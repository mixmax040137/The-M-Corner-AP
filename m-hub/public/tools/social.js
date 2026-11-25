// เครื่องมือ: ภาพปกโพสต์หลายขนาดจากแบบเดียว (Facebook, IG, Story, X, แบนเนอร์เว็บ, YouTube)
import { h, btn, field, select, step, toast, safeName, fillTemplate, seg, checkbox, text, debounce, presetBar, pickFiles, progressBar, nextFrame, splitExt } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { dataSource, guessColumn } from '../core/data.js';
import { outputChooser, openSink } from '../core/output.js';
import { presets } from '../core/store.js';
import { wrapText } from '../core/thai.js';
import { decodeImage, encodeCanvas } from '../core/image.js';

export const SIZES = {
  fb: { label: 'Facebook / แชร์ลิงก์', w: 1200, h: 630 },
  square: { label: 'โพสต์สี่เหลี่ยม (FB / IG)', w: 1080, h: 1080 },
  portrait: { label: 'IG แนวตั้ง 4:5', w: 1080, h: 1350 },
  story: { label: 'Story / Reels', w: 1080, h: 1920 },
  x: { label: 'X (Twitter)', w: 1600, h: 900 },
  web: { label: 'แบนเนอร์เว็บไซต์', w: 1920, h: 600 },
  youtube: { label: 'ปก YouTube', w: 1280, h: 720 },
};
const FONTS = { Kanit: 600, Prompt: 600, Sarabun: 700, Mitr: 500 };

const DEFAULTS = {
  tag: 'ข่าวประชาสัมพันธ์', title: 'การสัมมนาวิชาการ “ภาษาและวัฒนธรรมในยุคดิจิทัล”', subtitle: 'เปิดรับลงทะเบียนแล้ววันนี้ — ฟรี ไม่มีค่าใช้จ่าย',
  info: '15 ธันวาคม 2569 · 09.00–16.00 น. · ห้องประชุมคณะศิลปศาสตร์', footer: 'คณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์',
  layout: 'bottom', accent: '#c8102e', font: 'Kanit', darkness: 45, focusX: 50, focusY: 50, logoPos: 'tl',
  sizes: ['fb', 'square', 'story'], format: 'jpg', batch: false, imageCol: '', fileName: '',
};
const BUILTIN = {
  'ข่าวกิจกรรม (ภาพเต็ม + ข้อความล่าง)': { ...DEFAULTS, layout: 'bottom' },
  'ประกาศ (แถบสีด้านข้าง)': { ...DEFAULTS, layout: 'panel', accent: '#1f3a93', tag: 'ประกาศ' },
  'โปสเตอร์ (ข้อความกลางภาพ)': { ...DEFAULTS, layout: 'center', darkness: 55 },
};

// ---------- วาดโพสต์ 1 ขนาด ----------
export function renderPost(ctx, W, H, o, v, bg, logo) {
  const u = Math.min(W, H) / 100;
  const wide = W / H >= 1.25;
  const pad = Math.round(u * (wide && W / H > 2.5 ? 5 : 6.5));
  ctx.save();
  ctx.fillStyle = '#1b1f27';
  ctx.fillRect(0, 0, W, H);

  // พื้นที่ภาพ (layout panel แบ่งพื้นที่ภาพ/แถบสี)
  let img = { x: 0, y: 0, w: W, h: H };
  let box = { x: pad, y: pad, w: W - pad * 2, h: H - pad * 2 };
  if (o.layout === 'panel') {
    if (wide) { const pw = Math.round(W * 0.46); img = { x: pw, y: 0, w: W - pw, h: H }; box = { x: pad, y: pad, w: pw - pad * 1.6, h: H - pad * 2 }; }
    else { const ph = Math.round(H * 0.46); img = { x: 0, y: 0, w: W, h: H - ph }; box = { x: pad, y: H - ph + pad * 0.9, w: W - pad * 2, h: ph - pad * 1.9 }; }
  }
  if (bg) {
    const s = Math.max(img.w / bg.width, img.h / bg.height);
    const sw = img.w / s, sh = img.h / s;
    const sx = Math.min(bg.width - sw, Math.max(0, (bg.width * o.focusX) / 100 - sw / 2));
    const sy = Math.min(bg.height - sh, Math.max(0, (bg.height * o.focusY) / 100 - sh / 2));
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bg, sx, sy, sw, sh, img.x, img.y, img.w, img.h);
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, o.accent); g.addColorStop(1, '#1b1f27');
    ctx.fillStyle = g; ctx.fillRect(img.x, img.y, img.w, img.h);
  }
  // ชั้นทำให้อ่านง่าย
  const dk = o.darkness / 100;
  if (o.layout === 'bottom') {
    const g = ctx.createLinearGradient(0, H * 0.25, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${Math.min(0.95, dk + 0.4)})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  } else if (o.layout === 'center') {
    ctx.fillStyle = `rgba(0,0,0,${dk})`; ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = o.accent;
    ctx.fillRect(wide ? 0 : 0, wide ? 0 : img.h, wide ? img.x : W, wide ? H : H - img.h);
  }

  // โลโก้
  let logoH = 0;
  if (logo) {
    logoH = u * (wide ? 11 : 9);
    const lw = (logo.width / logo.height) * logoH;
    const lx = o.logoPos === 'tr' ? W - pad - lw : pad;
    ctx.drawImage(logo, lx, pad, lw, logoH);
  }

  // ข้อความ
  const bold = FONTS[o.font] || 600;
  const center = o.layout === 'center';
  const tx = center ? box.x + box.w / 2 : box.x;
  ctx.textAlign = center ? 'center' : 'left';
  ctx.textBaseline = 'alphabetic';
  const tag = fillTemplate(o.tag, v), title = fillTemplate(o.title, v), sub = fillTemplate(o.subtitle, v), info = fillTemplate(o.info, v), foot = fillTemplate(o.footer, v);
  const story = H / W > 1.6;
  let ts = u * (wide ? (W / H > 2.5 ? 11 : 9) : story ? 8.2 : 7.4);
  const maxW = box.w * (center ? 0.92 : o.layout === 'panel' ? 1 : 0.88);
  // ย่อหัวเรื่องจนไม่เกิน 4 บรรทัด
  let lines;
  for (let i = 0; i < 12; i++) {
    ctx.font = `${bold} ${ts}px "${o.font}", Sarabun, sans-serif`;
    lines = wrapText(ctx, title, maxW);
    if (lines.length <= (W / H > 2.5 ? 2 : 4)) break;
    ts *= 0.9;
  }
  const ss = ts * 0.46, is = ts * 0.4, tagS = ts * 0.36;
  ctx.font = `400 ${ss}px "${o.font}", Sarabun, sans-serif`;
  const subLines = sub ? wrapText(ctx, sub, maxW).slice(0, 2) : [];
  const parts = [];
  if (tag) parts.push({ kind: 'tag', h: tagS * 2.1 });
  parts.push(...lines.map((t) => ({ kind: 'title', t, h: ts * 1.18 })));
  if (subLines.length) parts.push({ kind: 'gap', h: ts * 0.2 }, ...subLines.map((t) => ({ kind: 'sub', t, h: ss * 1.45 })));
  if (info) parts.push({ kind: 'gap', h: ts * 0.25 }, { kind: 'info', t: info, h: is * 1.5 });
  const total = parts.reduce((n, p) => n + p.h, 0);
  const footH = foot ? is * 1.6 : 0;
  let y;
  if (center) y = box.y + (box.h - total) / 2;
  else if (o.layout === 'panel') y = wide ? box.y + logoH + (box.h - logoH - total - footH) / 2 : box.y;
  else y = box.y + box.h - total - footH - (story ? H * 0.12 : 0);

  for (const p of parts) {
    if (p.kind === 'tag') {
      ctx.font = `${bold} ${tagS}px "${o.font}", Sarabun, sans-serif`;
      const tw = ctx.measureText(tag).width + tagS * 1.4;
      const x0 = center ? tx - tw / 2 : tx;
      ctx.fillStyle = o.layout === 'panel' ? 'rgba(255,255,255,0.18)' : o.accent;
      roundRect(ctx, x0, y, tw, tagS * 1.6, tagS * 0.4); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(tag, center ? tx : tx + tagS * 0.7, y + tagS * 1.15);
    } else if (p.kind === 'title') {
      ctx.font = `${bold} ${ts}px "${o.font}", Sarabun, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(p.t, tx, y + ts * 0.95);
    } else if (p.kind === 'sub') {
      ctx.font = `400 ${ss}px "${o.font}", Sarabun, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText(p.t, tx, y + ss);
    } else if (p.kind === 'info') {
      ctx.font = `${bold} ${is}px "${o.font}", Sarabun, sans-serif`;
      ctx.fillStyle = o.layout === 'panel' ? '#ffffff' : '#ffd36b';
      let t = p.t;
      while (ctx.measureText(t).width > maxW && t.length > 4) t = t.slice(0, -2);
      ctx.fillText(t === p.t ? t : t + '…', tx, y + is);
    }
    y += p.h;
  }
  if (foot) {
    ctx.font = `400 ${is * 0.85}px "${o.font}", Sarabun, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    const fy = o.layout === 'panel' && !wide ? H - pad * 0.7 : box.y + box.h - (story && !center ? H * 0.12 : 0);
    ctx.fillText(foot, tx, fy);
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function mount(root) {
  const o = structuredClone(DEFAULTS);
  const images = new Map(); // ชื่อไฟล์ (ตัวเล็ก) → {file, bmp}
  let firstBg = null, logo = null, logoBlob = null;
  const ds = dataSource({ onChange: () => { autoCols(); drawBatch(); refresh(); } });

  const ensureFonts = () => document.fonts.load(`${FONTS[o.font] || 600} 40px "${o.font}"`, 'กขคABC').then(() => document.fonts.load(`400 40px "${o.font}"`, 'กขค'));
  const rows = () => (o.batch && ds.state.rows.length ? ds.state.rows : [{}]);
  const bgFor = async (row) => {
    if (o.batch && o.imageCol && row[o.imageCol]) {
      const k = String(row[o.imageCol]).toLowerCase().trim();
      const hit = images.get(k) || images.get(splitExt(k)[0]);
      if (hit) return (hit.bmp ||= await decodeImage(hit.file));
    }
    return firstBg;
  };

  // ---------- ตัวอย่าง ----------
  const previewGrid = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px', alignItems: 'start' } });
  const refresh = debounce(async () => {
    await ensureFonts();
    const row = rows()[0];
    const bg = await bgFor(row);
    const vars = { ...row };
    previewGrid.replaceChildren(...o.sizes.map((key) => {
      const sz = SIZES[key];
      const scale = 360 / Math.max(sz.w, sz.h);
      const c = h('canvas', { width: Math.round(sz.w * scale), height: Math.round(sz.h * scale) });
      const ctx = c.getContext('2d');
      ctx.scale(scale, scale);
      renderPost(ctx, sz.w, sz.h, o, vars, bg, logo);
      c.style.cssText = 'width:100%;height:auto;border-radius:8px;border:1px solid var(--border)';
      return h('figure', { style: { margin: 0 } }, c, h('figcaption.small.muted', `${sz.label} · ${sz.w}×${sz.h}`));
    }));
  }, 120);

  // ---------- ข้อความ ----------
  const inp = (k, label, hint) => field(label, text(o[k], (v) => { o[k] = v; refresh(); }), hint);
  const textBox = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } });
  const drawText = () => textBox.replaceChildren(
    h('div.grid2', inp('tag', 'ป้ายหมวด', 'เช่น ข่าวประชาสัมพันธ์, ประกาศ, กิจกรรม (เว้นว่างได้)'), inp('footer', 'ข้อความท้ายภาพ', 'เช่น ชื่อหน่วยงาน หรือเว็บไซต์')),
    field('หัวเรื่อง', h('textarea', { rows: 2, value: o.title, oninput: (e) => { o.title = e.target.value; refresh(); } })),
    h('div.grid2', inp('subtitle', 'คำโปรย'), inp('info', 'วันที่ / เวลา / สถานที่')));

  // ---------- ทำหลายโพสต์จาก Excel ----------
  const batchBox = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } });
  function autoCols() {
    const hd = ds.state.headers;
    if (!hd.length) return;
    if (!hd.includes(o.imageCol)) o.imageCol = guessColumn(hd, [/ภาพ|รูป|image|photo|ไฟล์/i]) || '';
    if (!/\{\{/.test(o.title)) {
      const t = guessColumn(hd, [/หัวข้อ|เรื่อง|title|ชื่อโครงการ|ชื่องาน/i]);
      if (t) { o.title = `{{${t}}}`; drawText(); }
    }
  }
  function drawBatch() {
    if (!o.batch) { batchBox.replaceChildren(); return; }
    batchBox.replaceChildren(ds.el,
      h('div.grid2',
        field('คอลัมน์ชื่อไฟล์ภาพ (ไม่บังคับ)', select([['', '— ใช้ภาพเดียวกันทุกโพสต์ —'], ...ds.state.headers], o.imageCol, (v) => { o.imageCol = v; refresh(); })),
        field('ชื่อไฟล์ผลลัพธ์', text(o.fileName, (v) => (o.fileName = v), { placeholder: 'ค่าเริ่มต้น: หัวเรื่อง' }))),
      h('div.hint', 'ใช้ {{ชื่อคอลัมน์}} ในช่องข้อความด้านบน เช่น หัวเรื่อง = {{ชื่องาน}} · ภาพของแต่ละแถวจับคู่จากชื่อไฟล์ในขั้น “ภาพพื้นหลัง”'));
  }

  // ---------- ส่งออก ----------
  const out = outputChooser('social');
  const prog = progressBar();
  const result = h('div');
  async function exportAll() {
    if (!o.sizes.length) return toast('เลือกขนาดอย่างน้อย 1 ขนาด', 'warn');
    let sink;
    try { sink = await openSink(out.mode, { zipName: `ภาพโพสต์-${new Date().toISOString().slice(0, 10)}.zip`, dirId: 'mhub-social-out' }); }
    catch (e) { if (e.name !== 'AbortError') toast(e.message, 'error'); return; }
    await ensureFonts();
    const list = rows();
    const total = list.length * o.sizes.length;
    let n = 0;
    for (let i = 0; i < list.length; i++) {
      const row = list[i];
      const bg = await bgFor(row);
      const base = safeName(fillTemplate(o.fileName || o.title, row).slice(0, 60), `โพสต์-${i + 1}`);
      for (const key of o.sizes) {
        prog.set(n++, total);
        const sz = SIZES[key];
        const c = h('canvas', { width: sz.w, height: sz.h });
        renderPost(c.getContext('2d'), sz.w, sz.h, o, row, bg, logo);
        const blob = await encodeCanvas(c, o.format, 90);
        await sink.write(`${list.length > 1 ? String(i + 1).padStart(2, '0') + ' ' : ''}${base}-${key}-${sz.w}x${sz.h}.${o.format}`, blob);
        c.width = 0;
        await nextFrame();
      }
    }
    prog.hide();
    const res = await sink.close();
    result.replaceChildren(h('div.note.ok', `สร้างภาพ ${res.count} ไฟล์ → ${res.where}`));
  }

  const sizeChecks = h('div.grid3');
  const drawSizes = () => sizeChecks.replaceChildren(...Object.entries(SIZES).map(([k, s]) => checkbox(`${s.label} (${s.w}×${s.h})`, o.sizes.includes(k), (v) => {
    o.sizes = v ? [...o.sizes, k] : o.sizes.filter((x) => x !== k);
    o.sizes.sort((a, b) => Object.keys(SIZES).indexOf(a) - Object.keys(SIZES).indexOf(b));
    refresh();
  })));
  const bgInfo = h('span.muted.small', 'ยังไม่มีภาพ (ใช้พื้นไล่สี)');
  const logoInfo = h('span.muted.small');
  const layoutSeg = seg([['bottom', 'ภาพเต็ม + ข้อความล่าง'], ['panel', 'แถบสีด้านข้าง'], ['center', 'ข้อความกลางภาพ']], o.layout, (v) => { o.layout = v; refresh(); });
  const styleBox = h('div.grid4');
  const drawStyle = () => styleBox.replaceChildren(
    field('ฟอนต์', select(Object.keys(FONTS), o.font, (v) => { o.font = v; refresh(); })),
    field('สีหลัก', h('input', { type: 'color', value: o.accent, oninput: (e) => { o.accent = e.target.value; refresh(); } })),
    field('ความมืดของภาพ', h('input', { type: 'range', min: 0, max: 85, value: o.darkness, oninput: (e) => { o.darkness = +e.target.value; refresh(); } })),
    field('โลโก้', select([['tl', 'มุมซ้ายบน'], ['tr', 'มุมขวาบน']], o.logoPos, (v) => { o.logoPos = v; refresh(); })),
    field('จุดโฟกัสภาพ ซ้าย ↔ ขวา', h('input', { type: 'range', min: 0, max: 100, value: o.focusX, oninput: (e) => { o.focusX = +e.target.value; refresh(); } })),
    field('จุดโฟกัสภาพ บน ↕ ล่าง', h('input', { type: 'range', min: 0, max: 100, value: o.focusY, oninput: (e) => { o.focusY = +e.target.value; refresh(); } })));

  const bar = presetBar(presets('social'), {
    builtins: BUILTIN,
    getData: () => ({ ...structuredClone(o), logoBlob }),
    apply: async (d) => {
      const { logoBlob: lb, ...rest } = d;
      Object.assign(o, structuredClone(DEFAULTS), rest);
      if (lb) { logoBlob = lb; logo = await createImageBitmap(lb); logoInfo.textContent = 'โลโก้จากพรีเซ็ต'; }
      layoutSeg.setValue(o.layout); drawText(); drawStyle(); drawSizes(); drawBatch(); refresh();
    },
  });

  drawText(); drawStyle(); drawSizes(); drawBatch(); refresh();
  root.append(
    h('p.intro', 'ออกแบบครั้งเดียว ได้ภาพครบทุกขนาดสำหรับ Facebook, Instagram, Story, X, แบนเนอร์เว็บไซต์ และปก YouTube — หรือทำทีละหลายโพสต์จากรายการใน Excel'),
    bar,
    step(1, 'ภาพพื้นหลังและโลโก้',
      h('div.row.wrap',
        btn('เลือกภาพพื้นหลัง', async () => {
          const list = await pickFiles({ accept: 'image/*,.heic,.heif' });
          for (const { file } of list) { images.set(file.name.toLowerCase(), { file }); images.set(splitExt(file.name.toLowerCase())[0], images.get(file.name.toLowerCase())); }
          if (list.length) {
            try { firstBg = await decodeImage(list[0].file); } catch (e) { toast(e.message, 'error'); }
            bgInfo.textContent = list.length > 1 ? `${list.length} ภาพ (ตัวอย่างใช้ภาพแรก)` : list[0].file.name;
            refresh();
          }
        }, { kind: 'primary', ic: 'image' }),
        btn('เอาภาพออก', () => { firstBg = null; images.clear(); bgInfo.textContent = 'ยังไม่มีภาพ (ใช้พื้นไล่สี)'; refresh(); }, { kind: 'ghost' }), bgInfo),
      h('div.row.wrap',
        btn('เลือกโลโก้ (PNG พื้นใส)', async () => {
          const [f] = await pickFiles({ accept: 'image/png,image/svg+xml,image/webp', multiple: false });
          if (!f) return;
          try { logo = await createImageBitmap(f.file); logoBlob = f.file; logoInfo.textContent = f.file.name; refresh(); } catch { toast('เปิดโลโก้ไม่ได้', 'error'); }
        }, { ic: 'image' }),
        btn('เอาโลโก้ออก', () => { logo = null; logoBlob = null; logoInfo.textContent = ''; refresh(); }, { kind: 'ghost' }), logoInfo)),
    step(2, 'ข้อความ', textBox,
      checkbox('ทำหลายโพสต์จากรายการใน Excel', o.batch, (v) => { o.batch = v; drawBatch(); refresh(); }), batchBox),
    step(3, 'รูปแบบและขนาด', h('div.field', h('span.field-label', 'รูปแบบ'), layoutSeg), styleBox, h('div.field', h('span.field-label', 'ขนาดที่ต้องการ'), sizeChecks)),
    step(4, 'ตัวอย่างแล้วสร้างไฟล์', previewGrid,
      h('div.grid2', field('รูปแบบไฟล์', select([['jpg', 'JPG (แนะนำสำหรับโพสต์)'], ['png', 'PNG'], ['webp', 'WebP (เว็บไซต์)']], o.format, (v) => (o.format = v))), out.el),
      h('div.row', btn('สร้างภาพทุกขนาด', exportAll, { kind: 'primary big', ic: 'grid' })), prog.el, result),
  );
}
