// หน้าต่างแก้ไขรูปทีละรูป: ปรับแต่ง + เครื่องมือ (ในเครื่อง และ AI) + เลเยอร์
import { h, btn, field, select, seg, toast, confirmBox } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { applyAdjust, isIdentity, ZERO } from '../core/adjust.js';
import { adjustPanel } from './adjust-panel.js';
import { makeCanvas, ctx2d, cloneCanvas, blurCanvas, mixByMask, featherMask, blurBackground, replaceBackground, retouchSkin, inpaint } from '../core/fx.js';
import { RATIOS, transformCanvas, straighten, cropCanvas } from '../core/image.js';

const MAX_WORK = 2400; // ความละเอียดสูงสุดที่แก้ในหน้าต่างนี้ (ด้านยาว)
const FONTS = ['Sarabun', 'Kanit', 'Prompt', 'Mitr', 'Charm'];
const SCENES = ['ห้องประชุมสว่าง ทันสมัย', 'สวนสีเขียว มีแสงแดดอ่อน', 'ห้องสมุดมหาวิทยาลัย', 'ฉากสตูดิโอสีขาวเรียบ', 'หน้าอาคารมหาวิทยาลัย ท้องฟ้าสดใส', 'ออฟฟิศทันสมัย เบลอเล็กน้อย'];

const TOOLS = [
  { group: 'ปรับปรุงภาพ', items: [
    ['crop', 'ครอปและหมุน', 'crop'], ['adjust', 'ปรับแต่ง', 'sparkles'], ['upscale', 'ขยายภาพ (AI)', 'image'], ['bg', 'ลบพื้นหลัง', 'scissors'],
    ['erase', 'ยางลบวิเศษ', 'x'], ['blur', 'เบลอ', 'grid'], ['focus', 'โฟกัสอัตโนมัติ', 'camera'], ['retouch', 'รีทัชผิวหน้า', 'users'],
  ] },
  { group: 'สร้างใหม่ด้วย AI (ใช้อินเทอร์เน็ต)', ai: true, items: [
    ['aiedit', 'แก้ด้วยคำสั่ง', 'sparkles'], ['aibg', 'สร้างพื้นหลังใหม่', 'image'], ['expand', 'ขยายขอบภาพ', 'grid'],
  ] },
  { group: 'แยกส่วนประกอบ', items: [
    ['layers', 'แยกเลเยอร์', 'files'], ['grab', 'หยิบบุคคล', 'users'], ['grabtext', 'ดึงข้อความ', 'type'],
  ] },
];

/**
 * เปิดหน้าต่างแก้ไข — source: Blob/File, onSave(blob)
 */
export async function openEditor({ source, name = 'รูปภาพ', onSave }) {
  const bmp = await createImageBitmap(source, { imageOrientation: 'from-image' });
  const s0 = Math.min(1, MAX_WORK / Math.max(bmp.width, bmp.height));
  let base = makeCanvas(Math.round(bmp.width * s0), Math.round(bmp.height * s0));
  base.getContext('2d').drawImage(bmp, 0, 0, base.width, base.height);
  bmp.close && bmp.close();
  const original = cloneCanvas(base);

  let adj = { ...ZERO, scope: 'all' };
  let matte = null; // หน้ากากบุคคลของ base ปัจจุบัน (คำนวณเมื่อจำเป็น)
  let mode = 'home';
  let brush = { size: 40, on: false, erase: false };
  let mask = null; // Float32Array ขนาดเท่า base — พื้นที่ที่ระบาย
  let areaMask = null; // พื้นที่ที่ระบายสำหรับปรับแต่งเฉพาะจุด
  let layers = null; // [{type:'image'|'text', ...}] เมื่ออยู่ในโหมดเลเยอร์
  let selLayer = -1;
  let showOriginal = false;
  const undo = [], redo = [];

  // ---------- โครงหน้าต่าง ----------
  const view = h('canvas', { 'aria-label': 'ภาพที่กำลังแก้' });
  const overlay = h('canvas.overlay');
  const busy = h('div.editor-busy', { hidden: true });
  const stack = h('div.stack', view, overlay);
  const stage = h('div.editor-stage', stack, busy);
  const side = h('div.editor-side');
  const undoBtn = btn('', () => doUndo(), { ic: 'left', kind: 'icon-only', title: 'เลิกทำ (Ctrl+Z)' });
  const redoBtn = btn('', () => doRedo(), { ic: 'right', kind: 'icon-only', title: 'ทำซ้ำ' });
  const cmpBtn = btn('กดค้างดูก่อนแก้', null, { kind: 'sm' });
  const sizeLabel = h('span.muted.small');
  const dlg = h('dialog.editor', h('div.editor-shell',
    h('div.editor-top',
      btn('ปิด', async () => { if (undo.length && !(await confirmBox('ปิดโดยไม่บันทึกการแก้ไข?', { ok: 'ปิด', danger: true }))) return; close(); }, { ic: 'x', kind: 'ghost' }),
      h('h2', name), sizeLabel, undoBtn, redoBtn, cmpBtn,
      btn('บันทึก', save, { kind: 'primary', ic: 'check' })),
    stage, side));
  document.body.append(dlg);
  dlg.addEventListener('cancel', (e) => e.preventDefault());
  dlg.showModal();
  const close = () => { dlg.close(); dlg.remove(); document.removeEventListener('keydown', onKey); };
  for (const ev of ['pointerdown', 'touchstart']) cmpBtn.addEventListener(ev, () => { showOriginal = true; render(); });
  for (const ev of ['pointerup', 'pointerleave', 'touchend']) cmpBtn.addEventListener(ev, () => { if (showOriginal) { showOriginal = false; render(); } });
  const onKey = (e) => { if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return; if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); } };
  document.addEventListener('keydown', onKey);

  // ---------- ประวัติ ----------
  function snapshot() {
    undo.push({ base: cloneCanvas(base), adj: { ...adj, hsl: { ...adj.hsl } } });
    if (undo.length > 12) undo.shift();
    redo.length = 0;
    updateButtons();
  }
  function restore(st) { base = st.base; adj = st.adj; matte = null; resizeView(); panelAdj && panelAdj.set(adj); if (cropSt) { cropSt = { src: base, angle: 0, ratio: cropSt.ratio, rect: null }; fitRatio(); } render(); }
  function doUndo() { if (!undo.length) return; redo.push({ base: cloneCanvas(base), adj: { ...adj } }); restore(undo.pop()); updateButtons(); }
  function doRedo() { if (!redo.length) return; undo.push({ base: cloneCanvas(base), adj: { ...adj } }); restore(redo.pop()); updateButtons(); }
  function updateButtons() { undoBtn.disabled = !undo.length; redoBtn.disabled = !redo.length; }

  // ---------- การแสดงผล ----------
  let k = 1;
  function resizeView() {
    k = Math.min(1, 1400 / Math.max(base.width, base.height));
    view.width = overlay.width = Math.round(base.width * k);
    view.height = overlay.height = Math.round(base.height * k);
    sizeLabel.textContent = `${base.width} × ${base.height}`;
  }
  const scaleMask = (m, w, hh, nw, nh) => {
    const out = new Float32Array(nw * nh);
    for (let y = 0; y < nh; y++) { const sy = Math.min(hh - 1, Math.floor((y * hh) / nh)); for (let x = 0; x < nw; x++) out[y * nw + x] = m[sy * w + Math.min(w - 1, Math.floor((x * w) / nw))]; }
    return out;
  };
  function scopeMask(w, hh) {
    if (adj.scope === 'person' && matte) return scaleMask(matte, base.width, base.height, w, hh);
    if (adj.scope === 'background' && matte) return scaleMask(matte, base.width, base.height, w, hh).map((v) => 1 - v);
    if (adj.scope === 'area' && areaMask) return featherMask(scaleMask(areaMask, base.width, base.height, w, hh), w, hh, 3);
    return null;
  }
  let raf = 0;
  function render() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const g = ctx2d(view);
      g.clearRect(0, 0, view.width, view.height);
      g.imageSmoothingQuality = 'high';
      g.drawImage(showOriginal ? original : mode === 'crop' && cropSt ? cropSt.src : base, 0, 0, view.width, view.height);
      if (!showOriginal && !isIdentity(adj) && (adj.scope === 'all' || scopeMask(1, 1) !== null || adj.scope === 'area')) {
        const id = g.getImageData(0, 0, view.width, view.height);
        g.putImageData(applyAdjust(id, adj, { mask: scopeMask(view.width, view.height) }), 0, 0);
      }
      if (layers && !showOriginal) drawLayers(g, k);
      drawOverlay();
    });
  }
  function drawLayers(g, s, forExport = false) {
    layers.forEach((L, i) => {
      if (L.hidden) return;
      if (L.type === 'image') g.drawImage(L.canvas, L.x * s, L.y * s, L.canvas.width * L.scale * s, L.canvas.height * L.scale * s);
      else {
        g.save();
        g.font = `${L.bold ? 700 : 400} ${L.size * s}px "${L.font}", Sarabun, sans-serif`;
        g.fillStyle = L.color; g.textBaseline = 'top';
        String(L.text).split('\n').forEach((ln, j) => g.fillText(ln, L.x * s, (L.y + j * L.size * 1.25) * s));
        g.restore();
      }
      if (!forExport && i === selLayer) { const b = layerBox(L); g.save(); g.setLineDash([6, 4]); g.strokeStyle = '#7c3aed'; g.lineWidth = 2; g.strokeRect(b.x * s - 3, b.y * s - 3, b.w * s + 6, b.h * s + 6); g.restore(); }
    });
  }
  function layerBox(L) {
    if (L.type === 'image') return { x: L.x, y: L.y, w: L.canvas.width * L.scale, h: L.canvas.height * L.scale };
    const g = ctx2d(view);
    g.font = `${L.bold ? 700 : 400} ${L.size}px "${L.font}", Sarabun, sans-serif`;
    const lines = String(L.text).split('\n');
    return { x: L.x, y: L.y, w: Math.max(10, ...lines.map((l) => g.measureText(l).width)), h: L.size * 1.25 * lines.length };
  }
  function drawOverlay() {
    const g = overlay.getContext('2d');
    g.clearRect(0, 0, overlay.width, overlay.height);
    if (mode === 'crop' && cropSt && !showOriginal) {
      const r = cropSt.rect, x = r.x * k, y = r.y * k, w = r.w * k, hh = r.h * k;
      g.fillStyle = 'rgba(0,0,0,.55)';
      g.fillRect(0, 0, overlay.width, y); g.fillRect(0, y + hh, overlay.width, overlay.height - y - hh);
      g.fillRect(0, y, x, hh); g.fillRect(x + w, y, overlay.width - x - w, hh);
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1;
      for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(x + (w * i) / 3, y); g.lineTo(x + (w * i) / 3, y + hh); g.moveTo(x, y + (hh * i) / 3); g.lineTo(x + w, y + (hh * i) / 3); g.stroke(); }
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(x, y, w, hh);
      g.fillStyle = '#fff';
      for (const [hx, hy] of cropHandles().map(([, px, py]) => [px * k, py * k])) g.fillRect(hx - 6, hy - 6, 12, 12);
      return;
    }
    const m = adj.scope === 'area' && mode === 'adjust' ? areaMask : mask;
    if (!m || !['erase', 'blur', 'aiedit', 'adjust'].includes(mode)) return;
    const id = g.createImageData(overlay.width, overlay.height);
    const sm = scaleMask(m, base.width, base.height, overlay.width, overlay.height);
    for (let i = 0; i < sm.length; i++) if (sm[i] > 0.5) { id.data[i * 4] = 124; id.data[i * 4 + 1] = 58; id.data[i * 4 + 2] = 237; id.data[i * 4 + 3] = 120; }
    g.putImageData(id, 0, 0);
  }

  // ---------- ระบาย / ลากเลเยอร์ ----------
  const toBase = (e) => { const r = view.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * base.width, y: ((e.clientY - r.top) / r.height) * base.height }; };
  let drag = null;
  function paint(p, m) {
    const rad = (brush.size / 2) / k;
    const x0 = Math.max(0, Math.floor(p.x - rad)), x1 = Math.min(base.width - 1, Math.ceil(p.x + rad));
    const y0 = Math.max(0, Math.floor(p.y - rad)), y1 = Math.min(base.height - 1, Math.ceil(p.y + rad));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if ((x - p.x) ** 2 + (y - p.y) ** 2 <= rad * rad) m[y * base.width + x] = brush.erase ? 0 : 1;
  }
  const brushing = () => ['erase', 'aiedit'].includes(mode) || (mode === 'blur' && blurMode === 'brush') || (mode === 'adjust' && adj.scope === 'area');
  // ---------- ครอป ----------
  let cropSt = null; // { src, angle, ratio, rect }
  let cropDrag = null;
  const ratioOf = () => (cropSt.ratio === 'free' ? 0 : cropSt.ratio === 'orig' ? base.width / base.height : RATIOS[cropSt.ratio]);
  function cropHandles() {
    const r = cropSt.rect, locked = !!ratioOf();
    const hs = [['nw', r.x, r.y], ['ne', r.x + r.w, r.y], ['sw', r.x, r.y + r.h], ['se', r.x + r.w, r.y + r.h]];
    if (!locked) hs.push(['n', r.x + r.w / 2, r.y], ['s', r.x + r.w / 2, r.y + r.h], ['w', r.x, r.y + r.h / 2], ['e', r.x + r.w, r.y + r.h / 2]);
    return hs;
  }
  function fitRatio() {
    const r = ratioOf(), W = base.width, H = base.height;
    if (!r) cropSt.rect = { x: 0, y: 0, w: W, h: H };
    else { const w = Math.min(W, H * r), hh = w / r; cropSt.rect = { x: (W - w) / 2, y: (H - hh) / 2, w, h: hh }; }
    updateCropLabel();
  }
  const cropChanged = () => cropSt && cropSt.rect && (cropSt.angle || cropSt.rect.x > 0.5 || cropSt.rect.y > 0.5 || Math.abs(cropSt.rect.w - base.width) > 0.5 || Math.abs(cropSt.rect.h - base.height) > 0.5);
  function moveCrop(p) {
    const W = base.width, H = base.height, min = Math.max(16, Math.min(W, H) * 0.03);
    const d = cropDrag, o = d.start, r = { ...o };
    const dx = p.x - d.p.x, dy = p.y - d.p.y;
    if (d.h === 'move') { r.x = Math.min(W - o.w, Math.max(0, o.x + dx)); r.y = Math.min(H - o.h, Math.max(0, o.y + dy)); cropSt.rect = r; return; }
    let x0 = o.x, y0 = o.y, x1 = o.x + o.w, y1 = o.y + o.h;
    if (d.h.includes('w')) x0 = Math.min(x1 - min, Math.max(0, o.x + dx));
    if (d.h.includes('e')) x1 = Math.max(x0 + min, Math.min(W, o.x + o.w + dx));
    if (d.h.includes('n')) y0 = Math.min(y1 - min, Math.max(0, o.y + dy));
    if (d.h.includes('s')) y1 = Math.max(y0 + min, Math.min(H, o.y + o.h + dy));
    const ratio = ratioOf();
    if (ratio) { // ล็อกสัดส่วน: ยึดมุมตรงข้ามไว้
      let w = x1 - x0, hh = w / ratio;
      const ax = d.h.includes('w') ? o.x + o.w : o.x, ay = d.h.includes('n') ? o.y + o.h : o.y;
      const maxW = d.h.includes('w') ? ax : W - ax, maxH = d.h.includes('n') ? ay : H - ay;
      if (hh > maxH) { hh = maxH; w = hh * ratio; }
      if (w > maxW) { w = maxW; hh = w / ratio; }
      x0 = d.h.includes('w') ? ax - w : ax; x1 = x0 + w;
      y0 = d.h.includes('n') ? ay - hh : ay; y1 = y0 + hh;
    }
    cropSt.rect = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  view.addEventListener('pointerdown', (e) => {
    const p = toBase(e);
    if (mode === 'crop' && cropSt) {
      const tol = 16 * (base.width / view.getBoundingClientRect().width);
      const hit = cropHandles().find(([, hx, hy]) => Math.abs(p.x - hx) <= tol && Math.abs(p.y - hy) <= tol);
      const r = cropSt.rect;
      const inside = p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
      if (hit || inside) { cropDrag = { h: hit ? hit[0] : 'move', p, start: { ...r } }; view.setPointerCapture(e.pointerId); }
      return;
    }
    if (layers) {
      const hit = layers.map((L, i) => [L, i]).reverse().find(([L]) => { const b = layerBox(L); return !L.hidden && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h; });
      if (hit) { selLayer = hit[1]; drag = { dx: p.x - hit[0].x, dy: p.y - hit[0].y }; view.setPointerCapture(e.pointerId); drawPanel(); render(); }
      return;
    }
    if (!brushing()) return;
    const target = mode === 'adjust' ? (areaMask ||= new Float32Array(base.width * base.height)) : (mask ||= new Float32Array(base.width * base.height));
    brush.on = true; view.setPointerCapture(e.pointerId); paint(p, target); render();
  });
  view.addEventListener('pointermove', (e) => {
    const p = toBase(e);
    if (cropDrag) { moveCrop(p); drawOverlay(); updateCropLabel(); return; }
    if (drag && layers && selLayer >= 0) { layers[selLayer].x = p.x - drag.dx; layers[selLayer].y = p.y - drag.dy; render(); return; }
    if (brush.on) { paint(p, mode === 'adjust' ? areaMask : mask); render(); }
  });
  view.addEventListener('pointerup', () => { brush.on = false; drag = null; cropDrag = null; });

  // ---------- งานหนัก (แสดงสถานะ) ----------
  async function work(msg, fn) {
    busy.hidden = false;
    busy.textContent = msg;
    await new Promise((r) => setTimeout(r, 30));
    try { return await fn((t) => (busy.textContent = t)); }
    catch (e) { console.error(e); toast(e.message || String(e), 'error', 7000); return null; }
    finally { busy.hidden = true; }
  }
  async function getMatte(say) {
    if (matte) return matte;
    say && say('กำลังหาบุคคลในภาพด้วย AI ในเครื่อง… (ครั้งแรกโหลดโมเดลประมาณ 6 MB)');
    const { personMatte } = await import('../core/ml.js');
    matte = (await personMatte(base)).alpha;
    return matte;
  }
  const hasMask = () => mask && mask.some((v) => v > 0.5);
  function commit(canvas) { snapshot(); base = canvas; matte = null; mask = null; resizeView(); render(); }
  let aiNoticeShown = false;
  const aiNotice = () => { if (!aiNoticeShown) { aiNoticeShown = true; toast('เครื่องมือ AI ส่งภาพ (หรือส่วนที่แก้) ไปประมวลผลที่ Workers AI ของบัญชีนี้ ใช้โควตาฟรีรายวัน', 'info', 6000); } };
  const genai = () => import('../core/genai.js');

  // ---------- แผงด้านข้าง ----------
  let panelAdj = null;
  let blurMode = 'brush';
  const back = () => btn('เครื่องมือทั้งหมด', () => { mode = 'home'; mask = null; cropSt = null; drawPanel(); render(); }, { ic: 'left', kind: 'ghost sm' });
  const brushCtl = () => h('div.adj-section',
    h('div.adj-row', h('label', 'ขนาดแปรง'), h('input.adj', { type: 'range', min: 6, max: 160, value: brush.size, oninput: (e) => (brush.size = +e.target.value) }), h('span')),
    h('div.row.wrap', seg([['paint', 'ระบาย'], ['erase', 'ลบรอยระบาย']], brush.erase ? 'erase' : 'paint', (v) => (brush.erase = v === 'erase')),
      btn('ล้างรอย', () => { if (mode === 'adjust') areaMask = null; else mask = null; render(); }, { kind: 'sm ghost' })));

  function drawPanel() {
    side.replaceChildren();
    if (layers) return side.append(...layersPanel());
    if (mode === 'home') {
      side.append(...TOOLS.map((grp) => h('div.adj-section', h('h4', grp.group),
        h('div.tool-grid2', ...grp.items.map(([id, label, ic]) => h('button.tool-btn', { type: 'button', onclick: () => openTool(id) }, icon(ic, 22), label, grp.ai ? h('span.ai-tag', 'AI') : ''))))));
      side.append(h('div.hint', 'ภาพสูงสุด ' + MAX_WORK + ' px ด้านยาว · กด Ctrl+Z เพื่อเลิกทำ · “บันทึก” แล้วภาพที่แก้จะถูกใช้แทนต้นฉบับในงานเป็นชุด'));
      return;
    }
    const panels = {
      crop: () => {
        const ratios = [['free', 'อิสระ'], ['orig', 'ต้นฉบับ'], ...Object.keys(RATIOS).map((r) => [r, r])];
        const straightIn = h('input.adj', { type: 'range', min: -45, max: 45, step: 0.5, value: cropSt.angle, 'aria-label': 'ปรับเอียง' });
        const straightNum = h('input.adj-num', { type: 'number', min: -45, max: 45, step: 0.5, value: cropSt.angle, 'aria-label': 'ปรับเอียง (องศา)' });
        const setAngle = (v) => {
          v = Math.max(-45, Math.min(45, +v || 0));
          cropSt.angle = v; straightIn.value = v; straightNum.value = v;
          cropSt.src = straighten(base, v);
          render();
        };
        straightIn.addEventListener('input', () => setAngle(straightIn.value));
        straightIn.addEventListener('dblclick', () => setAngle(0));
        straightNum.addEventListener('change', () => setAngle(straightNum.value));
        const rot = (o) => () => { commit(transformCanvas(base, o)); cropSt = { src: base, angle: 0, ratio: cropSt.ratio, rect: null }; fitRatio(); drawPanel(); render(); };
        return [
          h('p.intro', 'ลากกรอบหรือมุมกรอบบนภาพเพื่อเลือกส่วนที่ต้องการ แล้วกด “ใช้การครอป”'),
          h('div.adj-section', h('h4', icon('crop'), 'สัดส่วน'),
            h('div.chips', ...ratios.map(([v, label]) => h('button.chip', { type: 'button', 'aria-pressed': cropSt.ratio === v, style: cropSt.ratio === v ? { borderColor: 'var(--accent)', color: 'var(--accent)', fontWeight: 600 } : null, onclick: () => { cropSt.ratio = v; fitRatio(); drawPanel(); render(); } }, label)))),
          cropLabel,
          h('div.adj-section', h('h4', icon('rotate'), 'หมุนและกลับด้าน'),
            h('div.grid2',
              btn('หมุนซ้าย 90°', rot({ rotate: 270 }), { ic: 'rotateL' }),
              btn('หมุนขวา 90°', rot({ rotate: 90 }), { ic: 'rotate' }),
              btn('กลับซ้าย–ขวา', rot({ flipH: true }), { ic: 'flip' }),
              btn('กลับบน–ล่าง', rot({ flipV: true }), { ic: 'flip' })),
            h('div.adj-row', h('label', 'ปรับเอียง (องศา) — ภาพจะขยายเข้าเล็กน้อยไม่ให้มีมุมว่าง'), straightIn, straightNum)),
          h('div.row.wrap',
            btn('ใช้การครอป', () => {
              const r = cropSt.rect;
              if (!cropChanged()) return toast('ยังไม่ได้ครอปหรือปรับเอียง', 'warn');
              commit(cropCanvas(cropSt.src, r.x, r.y, r.w, r.h));
              cropSt = { src: base, angle: 0, ratio: 'free', rect: null }; fitRatio();
              drawPanel(); render();
              toast('ครอปแล้ว — กด Ctrl+Z เพื่อเลิกทำ', 'ok', 2000);
            }, { kind: 'primary', ic: 'check' }),
            btn('รีเซ็ต', () => { cropSt = { src: base, angle: 0, ratio: 'free', rect: null }; fitRatio(); drawPanel(); render(); }, { kind: 'ghost' })),
        ];
      },
      adjust: () => {
        panelAdj = adjustPanel({
          initial: adj, scopes: [['all', 'ทั้งภาพ'], ['person', 'บุคคล'], ['background', 'พื้นหลัง'], ['area', 'พื้นที่ที่ระบาย']],
          getImageData: () => ctx2d(base).getImageData(0, 0, base.width, base.height),
          onScope: async (v) => { if (v === 'person' || v === 'background') await work('กำลังหาบุคคล…', getMatte); drawPanel(); render(); },
          onChange: (p) => { adj = p; render(); },
        });
        panelAdj.analyze();
        return [adj.scope === 'area' ? brushCtl() : '', panelAdj.el];
      },
      upscale: () => [h('p.intro', 'ขยายภาพให้คมขึ้นด้วย AI ในเครื่อง (ESRGAN) — เหมาะกับภาพเล็ก/ภาพจากไลน์'),
        h('div.row.wrap', ...[2, 4].map((sc) => btn(`ขยาย ${sc} เท่า → ${base.width * sc} × ${base.height * sc}`, () => {
          if (Math.max(base.width, base.height) * sc > 6000) return toast('ภาพจะใหญ่เกิน 6000 px — ย่อภาพก่อนหรือเลือก 2 เท่า', 'warn');
          work('กำลังขยายภาพ…', async (say) => { const { upscale } = await import('../core/ml.js'); const out = await upscale(base, sc, { onProgress: (p) => say(`กำลังขยายภาพ… ${Math.round(p * 100)}%`) }); commit(out); });
        }, { kind: sc === 2 ? 'primary' : '' })))],
      bg: () => {
        let color = '#ffffff';
        return [h('p.intro', 'แยกบุคคลออกจากพื้นหลังด้วย AI ในเครื่อง (เหมาะกับภาพที่มีคน)'),
          h('div.grid2',
            btn('ลบพื้นหลัง (โปร่งใส)', () => work('กำลังลบพื้นหลัง…', async (say) => commit(replaceBackground(base, await getMatte(say), { mode: 'transparent' }))), { kind: 'primary' }),
            btn('เบลอพื้นหลัง', () => work('กำลังเบลอพื้นหลัง…', async (say) => commit(blurBackground(base, await getMatte(say), 55))))),
          h('div.row.wrap', h('input', { type: 'color', value: color, oninput: (e) => (color = e.target.value) }),
            btn('เปลี่ยนเป็นสีพื้นนี้', () => work('กำลังเปลี่ยนพื้นหลัง…', async (say) => commit(replaceBackground(base, await getMatte(say), { mode: 'color', color }))))),
          h('div.hint', 'พื้นโปร่งใสต้องบันทึกเป็น PNG / WebP / AVIF ในขั้นรูปแบบไฟล์ (ถ้าเลือก JPG จะได้พื้นสีที่ตั้งไว้)'),
          h('div.hint', 'ต้องการฉากใหม่ทั้งฉาก ใช้ “สร้างพื้นหลังใหม่” ในหมวด AI')];
      },
      erase: () => [h('p.intro', 'ระบายทับสิ่งที่ต้องการลบ แล้วเลือกวิธีลบ'), brushCtl(),
        h('div.grid2',
          btn('ลบในเครื่อง', () => { if (!hasMask()) return toast('ระบายพื้นที่ก่อน', 'warn'); work('กำลังเติมพื้นที่…', async () => commit(inpaint(base, mask))); }, { kind: 'primary' }),
          btn('ลบด้วย AI', () => { if (!hasMask()) return toast('ระบายพื้นที่ก่อน', 'warn'); aiNotice(); work('AI กำลังลบ… (ประมาณ 5 วินาที)', async () => { const { editRegion } = await genai(); commit(await editRegion(base, mask, 'Remove the object highlighted in magenta, and the magenta highlight itself. Fill that area naturally so it matches the surroundings. Keep everything else unchanged.', { highlight: true })); }); }, { ic: 'sparkles' })),
        h('div.hint', 'ในเครื่อง: เร็ว ไม่ใช้เน็ต เหมาะกับพื้นเรียบ/ลวดลายซ้ำ · AI: เนียนกว่าในฉากซับซ้อน')],
      blur: () => {
        let strength = 40;
        return [seg([['brush', 'ระบายส่วนที่จะเบลอ'], ['all', 'ทั้งภาพ']], blurMode, (v) => { blurMode = v; drawPanel(); }),
          blurMode === 'brush' ? brushCtl() : '',
          h('div.adj-row', h('label', 'ความเบลอ'), h('input.adj', { type: 'range', min: 1, max: 100, value: strength, oninput: (e) => (strength = +e.target.value) }), h('span')),
          btn('เบลอ', () => work('กำลังเบลอ…', async () => {
            const r = Math.max(1, Math.round((Math.min(base.width, base.height) * strength) / 100 * 0.03));
            const blurred = blurCanvas(base, r);
            if (blurMode === 'all') return commit(blurred);
            if (!hasMask()) return toast('ระบายพื้นที่ก่อน', 'warn');
            commit(mixByMask(blurred, base, featherMask(mask, base.width, base.height, Math.max(2, r * 0.5))));
          }), { kind: 'primary' })];
      },
      focus: () => {
        let strength = 50;
        return [h('p.intro', 'เบลอพื้นหลังให้บุคคลเด่นขึ้น เหมือนถ่ายด้วยกล้องเลนส์ไวด์'),
          h('div.adj-row', h('label', 'ความเบลอพื้นหลัง'), h('input.adj', { type: 'range', min: 5, max: 100, value: strength, oninput: (e) => (strength = +e.target.value) }), h('span')),
          btn('ใช้โฟกัสอัตโนมัติ', () => work('กำลังโฟกัส…', async (say) => commit(blurBackground(base, await getMatte(say), strength))), { kind: 'primary' })];
      },
      retouch: () => {
        let strength = 50;
        return [h('p.intro', 'ทำผิวให้เนียนและสว่างขึ้นเล็กน้อย โดยคงความคมของตา คิ้ว และปาก'),
          h('div.adj-row', h('label', 'ความเนียน'), h('input.adj', { type: 'range', min: 5, max: 100, value: strength, oninput: (e) => (strength = +e.target.value) }), h('span')),
          btn('รีทัช', () => work('กำลังรีทัช…', async (say) => commit(retouchSkin(base, { strength, matte: await getMatte(say) }))), { kind: 'primary' })];
      },
      aiedit: () => {
        const prompt = h('textarea', { rows: 3, placeholder: 'เช่น ใส่ช่อดอกไม้สีเหลือง / เปลี่ยนเป็นเสื้อสูทสีดำ / เพิ่มแก้วกาแฟบนโต๊ะ' });
        return [h('p.intro', 'ระบายบริเวณที่ต้องการเปลี่ยน แล้วพิมพ์สิ่งที่อยากให้เป็น (ไทยหรืออังกฤษ)'), brushCtl(), field('สิ่งที่ต้องการ', prompt),
          btn('สร้าง', () => {
            if (!hasMask()) return toast('ระบายพื้นที่ก่อน', 'warn');
            if (!prompt.value.trim()) return toast('พิมพ์สิ่งที่ต้องการก่อน', 'warn');
            aiNotice();
            work('AI กำลังแก้ภาพ…', async () => { const { editRegion, toEnglish } = await genai(); const en = await toEnglish(prompt.value.trim()); commit(await editRegion(base, mask, `In the marked center area: ${en}. Photorealistic, match the lighting and perspective. Keep everything else unchanged.`)); });
          }, { kind: 'primary', ic: 'sparkles' }),
          h('div.hint', 'ไม่ถูกใจ กด Ctrl+Z แล้วลองใหม่ได้ (ผลแต่ละครั้งไม่เหมือนกัน)')];
      },
      aibg: () => {
        const prompt = h('textarea', { rows: 2, placeholder: 'บรรยายฉากที่ต้องการ' });
        return [h('p.intro', 'ให้ AI สร้างฉากหลังใหม่ โดยคงบุคคลเดิมไว้'), field('ฉากที่ต้องการ', prompt),
          h('div.chips', ...SCENES.map((s) => h('button.chip', { type: 'button', onclick: () => (prompt.value = s) }, s))),
          btn('สร้างพื้นหลัง', () => {
            if (!prompt.value.trim()) return toast('เลือกหรือพิมพ์ฉากก่อน', 'warn');
            aiNotice();
            work('AI กำลังสร้างพื้นหลัง… (ประมาณ 6–10 วินาที)', async (say) => {
              const m = await getMatte(say).catch(() => null);
              say('AI กำลังสร้างพื้นหลัง…');
              const { replaceBackgroundAI, toEnglish } = await genai();
              const r = await replaceBackgroundAI(base, await toEnglish(prompt.value.trim()), m);
              commit(r.canvas);
              if (!r.kept) toast('AI ปรับบุคคลไปด้วยเล็กน้อย — ถ้าไม่ถูกใจ กด Ctrl+Z แล้วลองใหม่', 'info', 5000);
            });
          }, { kind: 'primary', ic: 'sparkles' })];
      },
      expand: () => {
        const ratios = [['16:9', 16 / 9], ['1:1', 1], ['4:5', 4 / 5], ['9:16', 9 / 16], ['กว้างขึ้น 30%', 'w'], ['สูงขึ้น 30%', 'h']];
        const target = (r) => {
          let w = base.width, hh = base.height;
          if (r === 'w') w = Math.round(w * 1.3); else if (r === 'h') hh = Math.round(hh * 1.3);
          else if (w / hh < r) w = Math.round(hh * r); else hh = Math.round(w / r);
          if (w === base.width && hh === base.height) { w = Math.round(w * 1.2); hh = Math.round(hh * 1.2); }
          const s = Math.min(1, 2048 / Math.max(w, hh));
          return [Math.round(w * s), Math.round(hh * s), s];
        };
        return [h('p.intro', 'ขยายขอบภาพออกไป ให้ได้สัดส่วนที่ต้องการ (เช่น ทำภาพแนวตั้งเป็นปกแนวนอน)'),
          h('div.grid2', ...ratios.map(([label, r]) => btn(label, () => {
            const [w, hh, s] = target(r);
            aiNotice();
            work('AI กำลังขยายภาพ… (ประมาณ 6–10 วินาที)', async () => {
              const src = s < 1 ? (() => { const c = makeCanvas(Math.round(base.width * s), Math.round(base.height * s)); c.getContext('2d').drawImage(base, 0, 0, c.width, c.height); return c; })() : base;
              const { expand } = await genai();
              commit(await expand(src, w, hh));
            });
          }))),
          h('div.hint', 'ขยายแล้วไม่เกิน 2048 px · ภาพเดิมตรงกลางคงความคมเหมือนเดิม')];
      },
    };
    side.append(back(), h('h3', TOOLS.flatMap((g) => g.items).find((x) => x[0] === mode)?.[1] || ''), ...panels[mode]());
  }

  const cropLabel = h('div.muted.small');
  function updateCropLabel() { if (cropSt && cropSt.rect) cropLabel.textContent = `ส่วนที่เลือก ${Math.round(cropSt.rect.w)} × ${Math.round(cropSt.rect.h)} px`; }

  async function openTool(id) {
    mask = null;
    if (id === 'crop') { cropSt = { src: base, angle: 0, ratio: 'free', rect: null }; fitRatio(); updateCropLabel(); }
    if (id === 'grab' || id === 'layers') return startLayers(id === 'layers');
    if (id === 'grabtext') return startText();
    mode = id;
    drawPanel();
    render();
  }

  // ---------- เลเยอร์: หยิบบุคคล / ดึงข้อความ ----------
  let preLayerState = null;
  async function startLayers(withText) {
    let fillMode = 'ai';
    const choose = await new Promise((resolve) => {
      const d = h('dialog.dialog', h('p', 'แยกบุคคลออกเป็นเลเยอร์ แล้วเติมพื้นหลังตรงที่บุคคลเคยอยู่ด้วย…'),
        seg([['ai', 'AI (เนียนกว่า ใช้เน็ต)'], ['local', 'ในเครื่อง (เร็ว)']], fillMode, (v) => (fillMode = v)),
        h('div.row.end', { style: { marginTop: '12px' } }, btn('ยกเลิก', () => { d.close(); d.remove(); resolve(false); }), btn('เริ่ม', () => { d.close(); d.remove(); resolve(true); }, { kind: 'primary' })));
      dlg.append(d); d.showModal();
    });
    if (!choose) return;
    const ok = await work('กำลังแยกบุคคล…', async (say) => {
      const m = await getMatte(say);
      if (!m.some((v) => v > 0.5)) throw new Error('ไม่พบบุคคลในภาพ');
      // เลเยอร์บุคคล (ครอปเฉพาะกรอบ)
      const W = base.width, H = base.height;
      let x0 = W, y0 = H, x1 = 0, y1 = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m[y * W + x] > 0.1) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const cut = replaceBackground(base, m, { mode: 'transparent' });
      const subj = makeCanvas(x1 - x0 + 1, y1 - y0 + 1);
      subj.getContext('2d').drawImage(cut, x0, y0, subj.width, subj.height, 0, 0, subj.width, subj.height);
      // เติมพื้นหลังตรงที่บุคคลเคยอยู่
      const hole = featherMask(m, W, H, 6).map((v) => (v > 0.05 ? 1 : 0));
      say(fillMode === 'ai' ? 'AI กำลังเติมพื้นหลัง…' : 'กำลังเติมพื้นหลัง…');
      let bg;
      if (fillMode === 'ai') { aiNotice(); const { editRegion } = await genai(); bg = await editRegion(base, hole, 'Remove the person highlighted in magenta, and the magenta highlight itself. Fill that area with the natural background that would be behind them. Keep everything else unchanged.', { highlight: true }); }
      else bg = inpaint(base, hole);
      preLayerState = { base: cloneCanvas(base), adj: { ...adj } };
      snapshot();
      base = bg; matte = null;
      layers = [{ type: 'image', name: 'บุคคล', canvas: subj, x: x0, y: y0, scale: 1 }];
      selLayer = 0;
      return true;
    });
    if (!ok) return;
    if (withText) await addTextLayers(false);
    drawPanel(); render();
    toast('ลากบุคคลเพื่อย้ายตำแหน่ง ปรับขนาดได้ที่แผงด้านขวา', 'ok', 4000);
  }

  async function startText() {
    preLayerState = { base: cloneCanvas(base), adj: { ...adj } };
    const ok = await addTextLayers(true);
    if (!ok) { preLayerState = null; return; }
    drawPanel(); render();
  }

  async function addTextLayers(alone) {
    return work('กำลังอ่านข้อความในภาพ… (ครั้งแรกโหลดตัวอ่านประมาณ 5 MB)', async (say) => {
      const { recognizeLines } = await import('../core/ocr.js');
      const lines = await recognizeLines(base, { onProgress: (s, p) => say(`${s} ${Math.round(p * 100)}%`) });
      if (!lines.length) { toast('ไม่พบข้อความในภาพ', 'warn'); return false; }
      const W = base.width, H = base.height;
      const hole = new Float32Array(W * H);
      const id = ctx2d(base).getImageData(0, 0, W, H).data;
      const newLayers = lines.map((l) => {
        const pad = Math.round((l.y1 - l.y0) * 0.15);
        const x0 = Math.max(0, Math.floor(l.x0 - pad)), y0 = Math.max(0, Math.floor(l.y0 - pad)), x1 = Math.min(W - 1, Math.ceil(l.x1 + pad)), y1 = Math.min(H - 1, Math.ceil(l.y1 + pad));
        // สีตัวอักษร: จุดที่ต่างจากสีพื้นในกรอบมากที่สุด
        const lum = [];
        for (let y = y0; y <= y1; y += 2) for (let x = x0; x <= x1; x += 2) { const j = (y * W + x) * 4; lum.push([0.3 * id[j] + 0.59 * id[j + 1] + 0.11 * id[j + 2], j]); }
        lum.sort((a, b) => a[0] - b[0]);
        const med = lum[lum.length >> 1][0];
        const far = (med > 128 ? lum.slice(0, Math.max(1, lum.length >> 4)) : lum.slice(-Math.max(1, lum.length >> 4))).map((x) => x[1]);
        const avg = [0, 1, 2].map((c) => Math.round(far.reduce((a, j) => a + id[j + c], 0) / far.length));
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) hole[y * W + x] = 1;
        return { type: 'text', name: l.text.slice(0, 24), text: l.text, x: l.x0, y: l.y0, size: Math.max(10, Math.round((l.y1 - l.y0) * 0.95)), font: 'Sarabun', bold: false, color: '#' + avg.map((v) => v.toString(16).padStart(2, '0')).join('') };
      });
      say('กำลังลบข้อความเดิมออกจากภาพ…');
      if (!layers) snapshot();
      base = inpaint(base, hole);
      matte = null;
      layers = [...(layers || []), ...newLayers];
      selLayer = layers.length - newLayers.length;
      if (alone) toast(`พบข้อความ ${newLayers.length} บรรทัด — คลิกข้อความบนภาพเพื่อแก้หรือย้าย`, 'ok', 4000);
      return true;
    });
  }

  function layersPanel() {
    const L = layers[selLayer];
    const list = h('div.list', ...layers.map((x, i) => h('div.layer-item' + (i === selLayer ? '.active' : ''), { onclick: () => { selLayer = i; drawPanel(); render(); } },
      icon(x.type === 'text' ? 'type' : 'image'), h('span.name', x.name || x.text),
      btn('', (e) => { e.stopPropagation(); x.hidden = !x.hidden; drawPanel(); render(); }, { ic: x.hidden ? 'x' : 'check', kind: 'icon-only sm', title: x.hidden ? 'แสดง' : 'ซ่อน' }))));
    const ctl = [];
    if (L && L.type === 'image') {
      ctl.push(h('div.adj-row', h('label', 'ขนาด (%)'), h('input.adj', { type: 'range', min: 10, max: 300, value: Math.round(L.scale * 100), oninput: (e) => { const c = layerBox(L); const ns = +e.target.value / 100; L.x += (c.w - L.canvas.width * ns) / 2; L.y += (c.h - L.canvas.height * ns) / 2; L.scale = ns; render(); } }), h('span')));
    } else if (L) {
      ctl.push(field('ข้อความ', h('textarea', { rows: 2, value: L.text, oninput: (e) => { L.text = e.target.value; render(); } })),
        h('div.grid2', field('ฟอนต์', select(FONTS, L.font, (v) => { L.font = v; document.fonts.load(`20px "${v}"`, 'กข').then(render); })),
          field('ขนาด (px)', h('input', { type: 'number', min: 6, max: 400, value: L.size, oninput: (e) => { L.size = +e.target.value || L.size; render(); } }))),
        h('div.row.wrap', h('input', { type: 'color', value: L.color, oninput: (e) => { L.color = e.target.value; render(); } }),
          h('label.check', h('input', { type: 'checkbox', checked: L.bold, onchange: (e) => { L.bold = e.target.checked; render(); } }), h('span', 'ตัวหนา'))));
    }
    if (L) ctl.push(btn('ลบเลเยอร์นี้', () => { layers.splice(selLayer, 1); selLayer = Math.min(selLayer, layers.length - 1); drawPanel(); render(); }, { kind: 'sm danger', ic: 'trash' }));
    return [h('h3', 'เลเยอร์'), h('p.hint', 'คลิกเลือก แล้วลากบนภาพเพื่อย้าย'), list, ...ctl,
      h('div.row.wrap', btn('รวมเลเยอร์ลงภาพ', () => { const out = cloneCanvas(base); drawLayers(ctx2d(out), 1, true); snapshot(); base = out; layers = null; selLayer = -1; preLayerState = null; mode = 'home'; drawPanel(); render(); }, { kind: 'primary', ic: 'check' }),
        btn('ยกเลิก', () => { if (preLayerState) { base = preLayerState.base; adj = preLayerState.adj; } layers = null; selLayer = -1; preLayerState = null; matte = null; mode = 'home'; resizeView(); drawPanel(); render(); }, { kind: 'ghost' }))];
  }

  // ---------- บันทึก ----------
  async function save() {
    if (mode === 'crop' && cropChanged()) { const r = cropSt.rect; commit(cropCanvas(cropSt.src, r.x, r.y, r.w, r.h)); cropSt = null; }
    let out = cloneCanvas(base);
    if (layers) drawLayers(ctx2d(out), 1, true);
    if (!isIdentity(adj)) {
      if ((adj.scope === 'person' || adj.scope === 'background') && !matte) await work('กำลังหาบุคคล…', getMatte);
      const g = ctx2d(out);
      const full = adj.scope === 'person' ? matte : adj.scope === 'background' ? matte && matte.map((v) => 1 - v) : adj.scope === 'area' && areaMask ? featherMask(areaMask, base.width, base.height, 3) : null;
      g.putImageData(applyAdjust(g.getImageData(0, 0, out.width, out.height), adj, { mask: full }), 0, 0);
    }
    const blob = await new Promise((r) => out.toBlob(r, 'image/png'));
    onSave && (await onSave(blob));
    close();
  }

  resizeView(); updateButtons(); drawPanel(); render();
}
