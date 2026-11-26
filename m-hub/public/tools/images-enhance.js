// ขั้น “ปรับแต่งภาพ” และ “เครื่องมือเสริม” ของงานรูปเป็นชุด + ฟังก์ชันประมวลผลที่ใช้ตอนสร้างไฟล์จริง
import { h, btn, field, select, step, toast, debounce } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { applyAdjust, isIdentity } from '../core/adjust.js';
import { adjustPanel } from './adjust-panel.js';
import { makeCanvas, ctx2d, blurCanvas, blurBackground, replaceBackground, retouchSkin } from '../core/fx.js';

export const AI_DEFAULTS = { upscale: 0, bg: 'none', bgColor: '#ffffff', focus: 55, retouch: 0, blur: 0 };
export const aiActive = (ai) => !!ai && (ai.upscale > 1 || ai.bg !== 'none' || ai.retouch > 0 || ai.blur > 0);
const needsMatte = (o) => o.adjust.scope === 'person' || o.adjust.scope === 'background' || o.ai.bg !== 'none' || o.ai.retouch > 0;

// ขยายภาพด้วย AI (ทำก่อนปรับขนาด) — ภาพใหญ่อยู่แล้วจะไม่ขยายเกิน 6000 px
export async function upscaleIfNeeded(src, o, say) {
  const sc = +o.ai.upscale;
  if (!(sc > 1)) return src;
  const real = Math.max(src.width, src.height) * sc > 6000 ? (Math.max(src.width, src.height) * 2 <= 6000 ? 2 : 1) : sc;
  if (real <= 1) return src;
  const { upscale } = await import('../core/ml.js');
  return upscale(src, real, { onProgress: (p) => say && say(`ขยายภาพ ${Math.round(p * 100)}%`) });
}

// ปรับแต่ง + เครื่องมือเสริม (ทำหลังปรับขนาด) — คืน canvas ใหม่
export async function applyExtras(canvas, o, say) {
  let matte = null;
  if (needsMatte(o)) {
    say && say('หาบุคคล…');
    const { personMatte } = await import('../core/ml.js');
    matte = (await personMatte(canvas)).alpha;
  }
  return applyExtrasWithMatte(canvas, o, matte);
}

/**
 * สร้างขั้น 3 (ปรับแต่ง) และ 4 (เครื่องมือเสริม)
 * getItems(): รายการรูป [{id, file, editedBlob, path}] · openEditor(item) เปิดหน้าต่างแก้ทีละรูป · onChange() แจ้งให้ตารางอัปเดต
 */
export function enhanceSteps({ opts, getItems, openEditor, onChange }) {
  // ---------- ตัวอย่าง ----------
  const preview = h('canvas', { width: 640, height: 400, 'aria-label': 'ตัวอย่างผลการปรับแต่ง' });
  const pickSel = h('select', { 'aria-label': 'รูปที่ใช้ดูตัวอย่าง' });
  const status = h('span.muted.small');
  let srcKey = null, srcCanvas = null, srcMatte = null, showBefore = false;

  async function loadSource() {
    const items = getItems();
    const it = items.find((x) => String(x.id) === pickSel.value) || items[0];
    if (!it) { srcCanvas = null; srcKey = null; return null; }
    const key = it.id + ':' + (it.editedBlob ? it.editedBlob.size : 0) + ':' + (opts.rotate || 0) + (opts.flipH ? 'h' : '') + (opts.flipV ? 'v' : '');
    if (key === srcKey && srcCanvas) return srcCanvas;
    const { decodeImage } = await import('../core/image.js');
    const bmp = await decodeImage(it.editedBlob || it.file);
    const s = Math.min(1, 900 / Math.max(bmp.width, bmp.height));
    srcCanvas = makeCanvas(Math.round(bmp.width * s), Math.round(bmp.height * s));
    srcCanvas.getContext('2d').drawImage(bmp, 0, 0, srcCanvas.width, srcCanvas.height);
    bmp.close && bmp.close();
    const { transformCanvas } = await import('../core/image.js');
    srcCanvas = transformCanvas(srcCanvas, opts);
    srcKey = key; srcMatte = null;
    setTimeout(() => panel.analyze(), 0);
    return srcCanvas;
  }

  let token = 0;
  const draw = debounce(async () => {
    const my = ++token;
    const src = await loadSource().catch((e) => { status.textContent = e.message; return null; });
    if (!src || my !== token) { if (!src) { preview.width = 640; preview.height = 120; ctx2d(preview).clearRect(0, 0, 640, 120); status.textContent = 'เลือกรูปในขั้นที่ 1 เพื่อดูตัวอย่าง'; } return; }
    preview.width = src.width; preview.height = src.height;
    const g = ctx2d(preview);
    if (showBefore) { g.clearRect(0, 0, src.width, src.height); g.drawImage(src, 0, 0); status.textContent = 'ก่อนปรับแต่ง'; return; }
    try {
      const o = { ...opts, ai: { ...opts.ai, upscale: 0 } };
      if (needsMatte(o) && !srcMatte) {
        status.textContent = 'กำลังหาบุคคลในภาพด้วย AI ในเครื่อง… (ครั้งแรกโหลดโมเดลประมาณ 6 MB)';
        const { personMatte } = await import('../core/ml.js');
        srcMatte = (await personMatte(src)).alpha;
        if (my !== token) return;
      }
      // ใช้หน้ากากที่หาไว้แล้ว เพื่อให้แถบเลื่อนตอบสนองเร็ว
      const c = makeCanvas(src.width, src.height);
      c.getContext('2d').drawImage(src, 0, 0);
      const res = await applyExtrasWithMatte(c, o, srcMatte);
      if (my !== token) return;
      g.clearRect(0, 0, src.width, src.height);
      g.drawImage(res, 0, 0);
      status.textContent = isIdentity(opts.adjust) && !aiActive(opts.ai) ? 'ยังไม่ได้ปรับแต่ง' : 'ตัวอย่างหลังปรับแต่ง (กดค้างปุ่ม “ดูก่อนปรับ” เพื่อเทียบ)';
    } catch (e) { console.error(e); status.textContent = 'แสดงตัวอย่างไม่ได้: ' + e.message; }
  }, 90);

  function refreshPick() {
    const items = getItems();
    const cur = pickSel.value;
    pickSel.replaceChildren(...items.map((x) => h('option', { value: x.id }, (x.editedBlob ? '✎ ' : '') + x.path)));
    if (items.some((x) => String(x.id) === cur)) pickSel.value = cur;
    draw();
  }
  pickSel.addEventListener('change', draw);

  const beforeBtn = btn('ดูก่อนปรับ', null, { kind: 'sm' });
  for (const ev of ['pointerdown', 'touchstart']) beforeBtn.addEventListener(ev, () => { showBefore = true; draw(); });
  for (const ev of ['pointerup', 'pointerleave', 'touchend']) beforeBtn.addEventListener(ev, () => { if (showBefore) { showBefore = false; draw(); } });

  const panel = adjustPanel({
    initial: opts.adjust,
    scopes: [['all', 'ทั้งภาพ'], ['person', 'เฉพาะบุคคล'], ['background', 'เฉพาะพื้นหลัง']],
    getImageData: () => (srcCanvas ? ctx2d(srcCanvas).getImageData(0, 0, srcCanvas.width, srcCanvas.height) : null),
    onChange: (p) => { opts.adjust = p; draw(); onChange && onChange(); },
  });

  const adjustStep = step(3, 'ปรับแต่งภาพ (ใช้กับทุกรูป)',
    h('div.adj-layout',
      h('div.preview-box', h('div.row.wrap', field('ดูตัวอย่างจากรูป', pickSel), h('span.spacer'), beforeBtn), preview, status,
        h('div.row.wrap', btn('แก้ไขรูปนี้ทีละรูป (เครื่องมือครบ)', () => {
          const it = getItems().find((x) => String(x.id) === pickSel.value) || getItems()[0];
          if (!it) return toast('เลือกรูปก่อน', 'warn');
          openEditor(it);
        }, { ic: 'sparkles' }))),
      panel.el));

  // ---------- เครื่องมือเสริม ----------
  const toolsBody = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } });
  function drawTools() {
    const a = opts.ai;
    const set = (k) => (v) => { a[k] = v; drawTools(); draw(); onChange && onChange(); };
    const range = (k, label, hint) => field(label, h('div.row', h('input.adj', { type: 'range', min: 0, max: 100, value: a[k], style: { flex: 1 }, onchange: (e) => set(k)(+e.target.value) }), h('span.muted.small', { style: { minWidth: '34px' } }, a[k] ? a[k] : 'ปิด')), hint);
    toolsBody.replaceChildren(
      h('div.grid3',
        field('ขยายภาพด้วย AI', select([[0, 'ไม่ขยาย'], [2, 'ขยาย 2 เท่า'], [4, 'ขยาย 4 เท่า']], a.upscale, (v) => set('upscale')(+v)), 'ทำก่อนปรับขนาด เหมาะกับภาพเล็ก/ภาพจาก LINE'),
        field('พื้นหลัง', select([['none', 'คงเดิม'], ['transparent', 'ลบพื้นหลัง (โปร่งใส)'], ['color', 'เปลี่ยนเป็นสีพื้น'], ['blur', 'เบลอพื้นหลัง (โฟกัสอัตโนมัติ)']], a.bg, set('bg')), 'ใช้ AI ในเครื่องแยกบุคคล'),
        a.bg === 'color' ? field('สีพื้นหลัง', h('input', { type: 'color', value: a.bgColor, onchange: (e) => set('bgColor')(e.target.value) })) :
          a.bg === 'blur' ? range('focus', 'ความเบลอพื้นหลัง') : h('span')),
      h('div.grid3', range('retouch', 'รีทัชผิวหน้า', 'ผิวเนียนขึ้น คงความคมของตา คิ้ว ปาก'), range('blur', 'เบลอทั้งภาพ')),
      a.bg === 'transparent' && opts.format === 'jpg' ? h('div.note.warn', 'JPG ไม่มีพื้นโปร่งใส — เลือกรูปแบบ PNG / WebP / AVIF ในขั้นที่ 2 (ถ้าคง JPG จะได้พื้นสีตามที่ตั้งไว้)') : '',
      aiActive(a) ? h('div.hint', 'ครั้งแรกโหลดโมเดล AI ประมาณ 6 MB (ขยายภาพ ~2 MB) แล้วเบราว์เซอร์จำไว้ · ใช้เวลาเพิ่มประมาณ 1–3 วินาทีต่อรูปบนคอมทั่วไป') : '');
  }
  drawTools();
  const toolsStep = step(4, 'เครื่องมือเสริม (AI ในเครื่อง ไม่ต้องใช้เน็ต)', toolsBody,
    h('div.hint', 'เครื่องมือที่ต้องเลือกตำแหน่งหรือใช้ AI สร้างภาพ (ยางลบวิเศษ, แก้ด้วยคำสั่ง, สร้างพื้นหลังใหม่, ขยายขอบภาพ, แยกเลเยอร์, ดึงข้อความ) อยู่ในปุ่ม “แก้ไข” ของแต่ละรูป'));

  return {
    adjustStep, toolsStep, refresh: refreshPick,
    sync() { panel.set(opts.adjust); drawTools(); draw(); },
    analyze: () => panel.analyze(),
  };
}

// เหมือน applyExtras แต่ใช้หน้ากากบุคคลที่หาไว้แล้ว (สำหรับตัวอย่างที่ต้องตอบสนองเร็ว)
async function applyExtrasWithMatte(canvas, o, matte) {
  let c = canvas;
  if (o.ai.retouch > 0) c = retouchSkin(c, { strength: +o.ai.retouch, matte });
  if (!isIdentity(o.adjust)) {
    const g = ctx2d(c);
    const mask = o.adjust.scope === 'person' ? matte : o.adjust.scope === 'background' && matte ? matte.map((v) => 1 - v) : null;
    g.putImageData(applyAdjust(g.getImageData(0, 0, c.width, c.height), o.adjust, { mask }), 0, 0);
  }
  if (o.ai.bg === 'blur' && matte) c = blurBackground(c, matte, +o.ai.focus);
  else if (o.ai.bg === 'transparent' && matte) c = replaceBackground(c, matte, { mode: 'transparent' });
  else if (o.ai.bg === 'color' && matte) c = replaceBackground(c, matte, { mode: 'color', color: o.ai.bgColor });
  if (o.ai.blur > 0) c = blurCanvas(c, Math.max(1, Math.round((Math.min(c.width, c.height) * o.ai.blur) / 100 * 0.03)));
  return c;
}
