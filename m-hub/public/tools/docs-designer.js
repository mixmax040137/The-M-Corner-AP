// แท็บ “เกียรติบัตร / ป้ายชื่อ / จดหมาย PDF” — ออกแบบบนภาพพื้นหลัง แล้วเติมข้อมูลรายคน
// ใช้ canvas ของเบราว์เซอร์วาดตัวหนังสือ จึงจัดสระ/วรรณยุกต์ไทยถูกต้องทุกฟอนต์
import { h, btn, field, select, toast, progressBar, safeName, fillTemplate, seg, checkbox, num, text, debounce, presetBar, pickFiles, nextFrame, download } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { outputChooser, openSink } from '../core/output.js';
import * as store from '../core/store.js';
import { openPdf, renderPdfPage, pdfLib } from '../core/pdf.js';
import { wrapText as wrapLines } from '../core/thai.js';
import { loadQr, qrMatrix, drawQr } from '../core/qr.js';

const PAGES = {
  a4l: { label: 'A4 แนวนอน (เกียรติบัตร)', w: 297, h: 210 },
  a4p: { label: 'A4 แนวตั้ง (จดหมาย / ประกาศ)', w: 210, h: 297 },
  a5l: { label: 'A5 แนวนอน', w: 210, h: 148 },
  card: { label: 'ป้ายชื่อ / นามบัตร 9 × 5.5 ซม.', w: 90, h: 55 },
  badge: { label: 'ป้ายห้อยคอ 10 × 14 ซม.', w: 100, h: 140 },
  tent: { label: 'ป้ายตั้งโต๊ะ 21 × 9.9 ซม.', w: 210, h: 99 },
  custom: { label: 'กำหนดเอง (มม.)', w: 100, h: 100 },
};
const FONTS = [['Sarabun', 'Sarabun'], ['Kanit', 'Kanit'], ['Prompt', 'Prompt'], ['Mitr', 'Mitr'], ['Charm', 'Charm (ลายมือ)']];
const BOLD = { Sarabun: 700, Kanit: 600, Prompt: 600, Mitr: 500, Charm: 700 };
const PT = 25.4 / 72; // 1 pt = 0.3528 มม.

const F = (o) => ({ text: '', x: 50, y: 50, size: 16, font: 'Sarabun', bold: false, color: '#1b1f27', align: 'center', maxWidth: 85, wrap: false, lineHeight: 1.45, ...o });

const DESIGNS = {
  'เกียรติบัตร A4 แนวนอน': {
    page: 'a4l', w: 297, h: 210, layout: 'single', frame: true, cutLines: true, bg: null, bgType: '',
    fields: [
      F({ text: 'เกียรติบัตรฉบับนี้ให้ไว้เพื่อแสดงว่า', y: 36, size: 20, color: '#5d6676' }),
      F({ text: '{{คำนำหน้า}}{{ชื่อ}} {{นามสกุล}}', y: 50, size: 40, bold: true, font: 'Charm', color: '#7a5a12', maxWidth: 80 }),
      F({ text: '{{ตำแหน่ง}} {{หน่วยงาน}}', y: 59, size: 17, color: '#5d6676' }),
      F({ text: 'ได้เข้าร่วม{{ชื่องาน}}', y: 69, size: 20, maxWidth: 80 }),
      F({ text: 'ให้ไว้ ณ วันที่ {{วันนี้}}', y: 79, size: 16, color: '#5d6676' }),
    ],
  },
  'ป้ายชื่อ 9 × 5.5 ซม. (10 ใบต่อ A4)': {
    page: 'card', w: 90, h: 55, layout: 'grid', frame: true, cutLines: true, bg: null, bgType: '',
    fields: [
      F({ text: '{{คำนำหน้า}}{{ชื่อ}} {{นามสกุล}}', y: 47, size: 19, bold: true, font: 'Kanit', maxWidth: 88 }),
      F({ text: '{{ตำแหน่ง}}', y: 64, size: 11, color: '#5d6676', maxWidth: 88 }),
      F({ text: '{{หน่วยงาน}}', y: 77, size: 10, color: '#2f4fd6', maxWidth: 88 }),
    ],
  },
  'ป้ายห้อยคอ 10 × 14 ซม.': {
    page: 'badge', w: 100, h: 140, layout: 'grid', frame: true, cutLines: true, bg: null, bgType: '',
    fields: [
      F({ text: '{{ชื่องาน}}', y: 14, size: 12, color: '#2f4fd6', maxWidth: 86, wrap: true }),
      F({ text: '{{ชื่อ}}', y: 52, size: 34, bold: true, font: 'Kanit', maxWidth: 88 }),
      F({ text: '{{นามสกุล}}', y: 62, size: 18, maxWidth: 88 }),
      F({ text: '{{หน่วยงาน}}', y: 80, size: 13, color: '#5d6676', maxWidth: 88 }),
    ],
  },
  'จดหมายเชิญรายคน A4': {
    page: 'a4p', w: 210, h: 297, layout: 'single', frame: false, cutLines: false, bg: null, bgType: '',
    fields: [
      F({ text: 'คณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์', x: 88, y: 9, size: 13, align: 'right' }),
      F({ text: '{{วันนี้}}', x: 52, y: 15, size: 13, align: 'left' }),
      F({ text: 'เรื่อง   ขอเรียนเชิญเข้าร่วม{{ชื่องาน}}', x: 12, y: 21, size: 13, align: 'left', maxWidth: 76, wrap: true }),
      F({ text: 'เรียน   {{คำนำหน้า}}{{ชื่อ}} {{นามสกุล}}', x: 12, y: 26, size: 13, align: 'left', maxWidth: 76 }),
      F({ text: '\t\tด้วยคณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์ กำหนดจัด{{ชื่องาน}} ในวันที่ {{วันที่จัด}} ณ {{สถานที่}} เพื่อเป็นเวทีแลกเปลี่ยนความรู้และประสบการณ์ระหว่างนักวิชาการ นักศึกษา และผู้สนใจ\n\t\tในการนี้ คณะฯ พิจารณาแล้วเห็นว่าท่านเป็นผู้มีความรู้ความสามารถ จึงใคร่ขอเรียนเชิญท่านเข้าร่วมงานดังกล่าว\n\t\tจึงเรียนมาเพื่อโปรดพิจารณา และขอขอบพระคุณมา ณ โอกาสนี้', x: 12, y: 32, size: 13, align: 'left', maxWidth: 76, wrap: true, lineHeight: 1.6 }),
      F({ text: 'ขอแสดงความนับถือ', x: 60, y: 60, size: 13 }),
      F({ text: '({{ผู้ลงนาม}})', x: 60, y: 72, size: 13 }),
      F({ text: '{{ตำแหน่งผู้ลงนาม}}', x: 60, y: 76, size: 13, maxWidth: 60, wrap: true }),
    ],
  },
};

const sizeOf = (d) => (d.page === 'custom' ? { w: +d.w || 100, h: +d.h || 100 } : { w: PAGES[d.page].w, h: PAGES[d.page].h });

// จัดวางหลายใบบน A4 (เลือกแนวที่ได้จำนวนมากกว่า)
export function gridLayout(w, h, gap = 2, margin = 5) {
  const fit = (W, H) => {
    const cols = Math.max(1, Math.floor((W - 2 * margin + gap) / (w + gap)));
    const rows = Math.max(1, Math.floor((H - 2 * margin + gap) / (h + gap)));
    const ox = (W - (cols * w + (cols - 1) * gap)) / 2, oy = (H - (rows * h + (rows - 1) * gap)) / 2;
    return { W, H, cols, rows, per: cols * rows, slots: Array.from({ length: cols * rows }, (_, i) => ({ x: ox + (i % cols) * (w + gap), y: oy + Math.floor(i / cols) * (h + gap) })) };
  };
  const p = fit(210, 297), l = fit(297, 210);
  return l.per > p.per ? l : p;
}

// วาดชิ้นงาน 1 ใบลงบน ctx (หน่วย: k พิกเซลต่อมิลลิเมตร) คืนกรอบของแต่ละช่องข้อความ (ใช้ลากย้าย)
export function renderItem(ctx, design, vars, k, bgImg, { selected = -1 } = {}) {
  const { w, h } = sizeOf(design);
  const W = w * k, H = h * k;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  if (bgImg) ctx.drawImage(bgImg, 0, 0, W, H);
  else if (design.frame) {
    const s = Math.min(w, h);
    const inset = Math.max(2, s * 0.035) * k;
    ctx.strokeStyle = '#b08d3c';
    ctx.lineWidth = Math.max(1, s * 0.006 * k);
    ctx.strokeRect(inset, inset, W - 2 * inset, H - 2 * inset);
    ctx.lineWidth = Math.max(0.5, s * 0.002 * k);
    const i2 = inset + Math.max(1.2, s * 0.012) * k;
    ctx.strokeRect(i2, i2, W - 2 * i2, H - 2 * i2);
  }
  const boxes = [];
  const outline = (box, idx) => {
    if (idx !== selected) return;
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#2f4fd6';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(box.x - 4, box.y - 4, box.w + 8, box.h + 8);
    ctx.restore();
  };
  design.fields.forEach((f, idx) => {
    if (f.type === 'qr') { // QR Code: x, y = จุดกึ่งกลาง, size = ความกว้าง (มม.)
      const sz = (+f.size || 20) * k;
      const box = { idx, x: (f.x / 100) * W - sz / 2, y: (f.y / 100) * H - sz / 2, w: sz, h: sz };
      const m = qrMatrix(fillTemplate(f.text, vars), 'M');
      if (m) drawQr(ctx, m, box.x, box.y, sz, { fg: f.color, bg: '#ffffff', margin: 2 });
      else { ctx.save(); ctx.strokeStyle = '#c0262d'; ctx.strokeRect(box.x, box.y, sz, sz); ctx.restore(); }
      boxes.push(box);
      outline(box, idx);
      return;
    }
    const str = fillTemplate(f.text, vars);
    let px = f.size * PT * k;
    const weight = f.bold ? BOLD[f.font] || 700 : 400;
    const setFont = () => { ctx.font = `${weight} ${px}px "${f.font}", "Sarabun", sans-serif`; };
    setFont();
    ctx.fillStyle = f.color;
    ctx.textAlign = f.align;
    ctx.textBaseline = 'alphabetic';
    const maxW = (f.maxWidth / 100) * W;
    const x = (f.x / 100) * W, y = (f.y / 100) * H;
    let lines;
    if (f.wrap) lines = wrapLines(ctx, str, maxW);
    else {
      lines = [str.replace(/\n/g, ' ')];
      const mw = ctx.measureText(lines[0]).width;
      if (mw > maxW) { px = Math.max(px * 0.4, px * (maxW / mw)); setFont(); }
    }
    const lh = px * f.lineHeight;
    let width = 0;
    lines.forEach((ln, i) => { ctx.fillText(ln, x, y + i * lh); width = Math.max(width, ctx.measureText(ln).width); });
    const left = f.align === 'left' ? x : f.align === 'right' ? x - width : x - width / 2;
    const box = { idx, x: left, y: y - px * 0.95, w: Math.max(width, 12), h: px * 1.25 + (lines.length - 1) * lh };
    boxes.push(box);
    outline(box, idx);
  });
  return boxes;
}

async function ensureFonts(design) {
  if (design.fields.some((f) => f.type === 'qr')) await loadQr();
  const need = new Set();
  for (const f of design.fields) if (f.type !== 'qr') need.add(`${f.bold ? BOLD[f.font] || 700 : 400} 32px "${f.font}"`);
  await Promise.all([...need].map((s) => document.fonts.load(s, 'กขคงำ่้ ABC').catch(() => {})));
}

// ---------- ฟอนต์ของผู้ใช้ (เช่น TH SarabunPSK) ----------
async function loadUserFonts() {
  const saved = (await store.get('fonts', {})) || {};
  for (const [name, buf] of Object.entries(saved)) {
    try { const face = new FontFace(name, buf); await face.load(); document.fonts.add(face); } catch { /* ข้าม */ }
  }
  return Object.keys(saved);
}

export function designerTab(shared) {
  let design = structuredClone(DESIGNS['เกียรติบัตร A4 แนวนอน']);
  let selected = 1;
  let previewRow = 0;
  let bgImg = null;
  let userFonts = [];
  const opts = { fileName: '', output: 'combined', dpi: 200 };

  const canvas = h('canvas', { width: 1000, height: 700, 'aria-label': 'ตัวอย่างชิ้นงาน' });
  const wrap = h('div.canvas-wrap', canvas);
  const rowLabel = h('span.muted.small');
  const gridInfo = h('div.hint');
  const fieldList = h('div.field-list');
  const pageFields = h('div.grid4');
  const bgInfo = h('span.muted.small');
  let boxes = [];

  const rows = () => shared.rows();
  const draw = debounce(async () => {
    await ensureFonts(design);
    const { w, h: hh } = sizeOf(design);
    const k = 1000 / w;
    canvas.width = 1000;
    canvas.height = Math.round(hh * k);
    const r = rows();
    previewRow = Math.min(previewRow, Math.max(0, r.length - 1));
    boxes = renderItem(canvas.getContext('2d'), design, shared.vars(r[previewRow] || {}, previewRow), k, bgImg, { selected });
    rowLabel.textContent = r.length ? `ตัวอย่างคนที่ ${previewRow + 1} / ${r.length}` : 'ยังไม่มีข้อมูลรายชื่อ (แสดงแบบว่าง)';
    if (design.layout === 'grid') {
      const g = gridLayout(w, hh);
      gridInfo.textContent = `จัดวาง ${g.per} ใบต่อหน้า A4 (${g.cols} × ${g.rows}) · ${r.length ? Math.ceil(r.length / g.per) + ' หน้า' : ''}`;
    } else gridInfo.textContent = '';
  }, 60);

  // ลากย้ายข้อความบนภาพตัวอย่าง
  let drag = null;
  const toCanvas = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * canvas.width, y: ((e.clientY - r.top) / r.height) * canvas.height };
  };
  canvas.addEventListener('pointerdown', (e) => {
    const p = toCanvas(e);
    const hit = [...boxes].reverse().find((b) => p.x >= b.x - 6 && p.x <= b.x + b.w + 6 && p.y >= b.y - 6 && p.y <= b.y + b.h + 6);
    if (!hit) return;
    selected = hit.idx;
    const f = design.fields[selected];
    drag = { dx: p.x - (f.x / 100) * canvas.width, dy: p.y - (f.y / 100) * canvas.height };
    canvas.setPointerCapture(e.pointerId);
    renderFields();
    draw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = toCanvas(e);
    const f = design.fields[selected];
    f.x = Math.round(((p.x - drag.dx) / canvas.width) * 1000) / 10;
    f.y = Math.round(((p.y - drag.dy) / canvas.height) * 1000) / 10;
    draw();
  });
  canvas.addEventListener('pointerup', () => { if (drag) { drag = null; renderFields(); } });

  function renderPage() {
    const parts = [field('ขนาดชิ้นงาน', select(Object.entries(PAGES).map(([k, v]) => [k, v.label]), design.page, (v) => {
      design.page = v;
      if (v !== 'custom') { design.w = PAGES[v].w; design.h = PAGES[v].h; }
      design.layout = PAGES[v].w * PAGES[v].h < 210 * 297 / 3 ? 'grid' : 'single';
      renderPage(); draw();
    }))];
    if (design.page === 'custom') parts.push(field('กว้าง (มม.)', num(design.w, (v) => { design.w = v; draw(); }, { min: 20 })), field('สูง (มม.)', num(design.h, (v) => { design.h = v; draw(); }, { min: 20 })));
    parts.push(field('การจัดหน้า', select([['single', '1 ชิ้นต่อหน้า'], ['grid', 'หลายชิ้นต่อ A4 (สำหรับตัด)']], design.layout, (v) => { design.layout = v; renderPage(); draw(); })));
    if (design.layout === 'grid') parts.push(h('div.field', h('span.field-label', ' '), checkbox('เส้นสำหรับตัด', design.cutLines, (v) => (design.cutLines = v))));
    parts.push(h('div.field', h('span.field-label', ' '), checkbox('กรอบตกแต่ง (เมื่อไม่มีพื้นหลัง)', design.frame, (v) => { design.frame = v; draw(); })));
    pageFields.replaceChildren(...parts);
  }

  async function setBackground(blob, type) {
    try {
      if (!blob) { bgImg = null; design.bg = null; design.bgType = ''; bgInfo.textContent = 'ไม่มีภาพพื้นหลัง'; draw(); return; }
      if (type === 'pdf') {
        const doc = await openPdf(blob);
        bgImg = await renderPdfPage(doc, 1, 3508);
        const pg = await doc.getPage(1);
        const vp = pg.getViewport({ scale: 1 });
        const w = Math.round(vp.width * PT), hh = Math.round(vp.height * PT);
        matchPage(w, hh);
      } else {
        bgImg = await createImageBitmap(blob);
        const { w } = sizeOf(design);
        const ratio = bgImg.height / bgImg.width;
        const { h: ch } = sizeOf(design);
        if (Math.abs(ratio - ch / w) > 0.03) toast('สัดส่วนภาพพื้นหลังไม่ตรงกับขนาดชิ้นงาน ภาพจะถูกยืดให้เต็ม — ตรวจขนาดชิ้นงานอีกครั้ง', 'warn', 6000);
      }
      design.bg = blob; design.bgType = type;
      bgInfo.textContent = `พื้นหลัง: ${blob.name || (type === 'pdf' ? 'PDF' : 'รูปภาพ')}`;
      draw();
    } catch (e) { toast('เปิดภาพพื้นหลังไม่ได้: ' + e.message, 'error'); }
  }
  function matchPage(w, hh) {
    const found = Object.entries(PAGES).find(([k, v]) => k !== 'custom' && Math.abs(v.w - w) <= 2 && Math.abs(v.h - hh) <= 2);
    if (found) { design.page = found[0]; design.w = found[1].w; design.h = found[1].h; }
    else { design.page = 'custom'; design.w = w; design.h = hh; }
    renderPage();
  }

  function renderFields() {
    fieldList.replaceChildren(...design.fields.map((f, i) => {
      if (i !== selected) {
        return h('button.field-item', { type: 'button', style: { textAlign: 'left', background: 'var(--surface)', color: 'var(--text)', font: 'inherit', cursor: 'pointer' }, onclick: () => { selected = i; renderFields(); draw(); } },
          h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, (f.type === 'qr' ? 'QR: ' : '') + (f.text.replace(/\n/g, ' ') || '(ว่าง)')));
      }
      const upd = (k) => (v) => { f[k] = v; draw(); };
      const tools = h('div.row',
        btn('ทำซ้ำ', () => { design.fields.splice(i + 1, 0, { ...structuredClone(f), y: f.y + 6 }); selected = i + 1; renderFields(); draw(); }, { ic: 'copy', kind: 'sm' }),
        btn('ลบ', () => { design.fields.splice(i, 1); selected = Math.min(i, design.fields.length - 1); renderFields(); draw(); }, { ic: 'trash', kind: 'sm danger' }));
      if (f.type === 'qr') {
        return h('div.field-item.active',
          field('ข้อมูลใน QR (ใส่ {{ชื่อคอลัมน์}} ได้)', h('textarea', { rows: 2, value: f.text, oninput: (e) => { f.text = e.target.value; draw(); } }), 'เช่น ลิงก์ตรวจสอบเกียรติบัตร https://…?id={{รหัส}}'),
          h('div.grid4',
            field('ขนาด (มม.)', num(f.size, upd('size'), { min: 8, max: 200 })),
            field('สี', h('input', { type: 'color', value: f.color, oninput: (e) => upd('color')(e.target.value) })),
            field('กึ่งกลาง X (%)', num(f.x, upd('x'), { step: 0.5 })),
            field('กึ่งกลาง Y (%)', num(f.y, upd('y'), { step: 0.5 }))),
          tools);
      }
      const fontOpts = [...FONTS, ...userFonts.map((n) => [n, n + ' (ของฉัน)'])];
      return h('div.field-item.active',
        field('ข้อความ (ใส่ {{ชื่อคอลัมน์}} ได้)', h('textarea', { rows: f.wrap ? 5 : 2, value: f.text, oninput: (e) => { f.text = e.target.value; draw(); } })),
        h('div.grid3',
          field('ฟอนต์', select(fontOpts, f.font, upd('font'))),
          field('ขนาด (pt)', num(f.size, upd('size'), { min: 4, max: 200, step: 0.5 })),
          field('สี', h('input', { type: 'color', value: f.color, oninput: (e) => upd('color')(e.target.value) }))),
        h('div.row.wrap',
          seg([['left', 'ชิดซ้าย'], ['center', 'กึ่งกลาง'], ['right', 'ชิดขวา']], f.align, upd('align')),
          checkbox('ตัวหนา', f.bold, upd('bold')),
          checkbox('ตัดบรรทัดอัตโนมัติ', f.wrap, (v) => { f.wrap = v; renderFields(); draw(); })),
        h('div.grid4',
          field('ตำแหน่ง X (%)', num(f.x, upd('x'), { step: 0.5 })),
          field('ตำแหน่ง Y (%)', num(f.y, upd('y'), { step: 0.5 })),
          field('กว้างสุด (%)', num(f.maxWidth, upd('maxWidth'), { min: 5, max: 100 })),
          f.wrap ? field('ระยะบรรทัด', num(f.lineHeight, upd('lineHeight'), { min: 0.8, max: 3, step: 0.05 })) : h('span.hint', 'ชื่อยาวจะย่อขนาดอัตโนมัติให้พอดีความกว้าง')),
        tools);
    }));
  }

  // ---------- สร้างไฟล์ ----------
  const out = outputChooser('docs-pdf');
  const prog = progressBar();
  const resultBox = h('div');
  const outTypeWrap = h('span');
  const renderOutType = () => {
    const optsList = design.layout === 'grid' ? [['combined', 'PDF ไฟล์เดียว (พร้อมพิมพ์)']] : [['combined', 'PDF รวมไฟล์เดียว (พร้อมพิมพ์)'], ['separate', 'PDF แยกรายคน'], ['png', 'PNG แยกรายคน']];
    if (!optsList.some((o) => o[0] === opts.output)) opts.output = 'combined';
    outTypeWrap.replaceChildren(field('รูปแบบผลลัพธ์', select(optsList, opts.output, (v) => { opts.output = v; out.el.hidden = v === 'combined'; })));
    out.el.hidden = opts.output === 'combined';
  };
  let cancel = false;

  async function generate() {
    const r = rows();
    if (!r.length) return toast('ใส่ข้อมูลรายชื่อในขั้นที่ 1 ก่อน', 'warn');
    if (!design.fields.length) return toast('ยังไม่มีช่องข้อความ', 'warn');
    let sink = null;
    if (opts.output !== 'combined') {
      try { sink = await openSink(out.mode, { zipName: `เอกสาร-${r.length}-ไฟล์.zip`, dirId: 'mhub-docs-out' }); }
      catch (e) { if (e.name !== 'AbortError') toast(e.message, 'error'); return; }
    }
    cancel = false;
    genBtn.disabled = true; stopBtn.hidden = false;
    resultBox.replaceChildren();
    try {
      await ensureFonts(design);
      const { PDFDocument } = await pdfLib();
      const { w, h: hh } = sizeOf(design);
      const k = opts.dpi / 25.4;
      const toPt = (mm) => (mm * 72) / 25.4;
      const nameTpl = opts.fileName || shared.defaultFileName();
      const generated = [];
      const jpegOf = (c) => new Promise((res) => c.toBlob(res, 'image/jpeg', 0.92)).then((b) => b.arrayBuffer());
      if (design.layout === 'grid') {
        const g = gridLayout(w, hh);
        const pdf = await PDFDocument.create();
        const c = h('canvas', { width: Math.round(g.W * k), height: Math.round(g.H * k) });
        const ctx = c.getContext('2d');
        for (let p = 0; p * g.per < r.length && !cancel; p++) {
          prog.set(p * g.per, r.length, `หน้า ${p + 1}`);
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
          for (let s = 0; s < g.per; s++) {
            const i = p * g.per + s;
            if (i >= r.length) break;
            const slot = g.slots[s];
            ctx.save();
            ctx.translate(slot.x * k, slot.y * k);
            ctx.beginPath(); ctx.rect(0, 0, w * k, hh * k); ctx.clip();
            renderItem(ctx, design, shared.vars(r[i], i), k, bgImg);
            ctx.restore();
            if (design.cutLines) { ctx.save(); ctx.strokeStyle = '#b9bec8'; ctx.setLineDash([3 * k, 2 * k]); ctx.lineWidth = Math.max(1, 0.15 * k); ctx.strokeRect(slot.x * k, slot.y * k, w * k, hh * k); ctx.restore(); }
          }
          const img = await pdf.embedJpg(await jpegOf(c));
          pdf.addPage([toPt(g.W), toPt(g.H)]).drawImage(img, { x: 0, y: 0, width: toPt(g.W), height: toPt(g.H) });
          await nextFrame();
        }
        pdf.setTitle('M Hub');
        download(new Blob([await pdf.save()], { type: 'application/pdf' }), `ป้าย-${r.length}-ชิ้น.pdf`);
        resultBox.replaceChildren(h('div.note.ok', `สร้าง PDF ${Math.ceil(r.length / g.per)} หน้า (${r.length} ชิ้น) แล้ว — ดาวน์โหลดไฟล์แล้ว`));
      } else {
        const c = h('canvas', { width: Math.round(w * k), height: Math.round(hh * k) });
        const ctx = c.getContext('2d');
        const combined = opts.output === 'combined' ? await PDFDocument.create() : null;
        const usedNames = new Map();
        for (let i = 0; i < r.length && !cancel; i++) {
          prog.set(i, r.length, `${i + 1} / ${r.length}`);
          renderItem(ctx, design, shared.vars(r[i], i), k, bgImg);
          let base = safeName(fillTemplate(nameTpl, shared.vars(r[i], i)), `เอกสาร-${i + 1}`);
          const n = (usedNames.get(base) || 0) + 1; usedNames.set(base, n);
          if (n > 1) base += `-${n}`;
          if (opts.output === 'png') {
            const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
            await sink.write(base + '.png', blob);
            generated[i] = { name: base + '.png', type: 'image/png', blob };
          } else {
            const doc = combined || (await PDFDocument.create());
            const img = await doc.embedJpg(await jpegOf(c));
            doc.addPage([toPt(w), toPt(hh)]).drawImage(img, { x: 0, y: 0, width: toPt(w), height: toPt(hh) });
            if (!combined) {
              doc.setTitle(base);
              const blob = new Blob([await doc.save()], { type: 'application/pdf' });
              await sink.write(base + '.pdf', blob);
              generated[i] = { name: base + '.pdf', type: 'application/pdf', blob };
            }
          }
          await nextFrame();
        }
        if (combined) {
          combined.setTitle('M Hub');
          download(new Blob([await combined.save()], { type: 'application/pdf' }), `เอกสาร-${r.length}-คน.pdf`);
          resultBox.replaceChildren(h('div.note.ok', `สร้าง PDF ${r.length} หน้าแล้ว — ดาวน์โหลดไฟล์แล้ว`));
        } else {
          const res = await sink.close();
          shared.setGenerated(generated, 'เกียรติบัตร/เอกสาร PDF');
          resultBox.replaceChildren(h('div.note.ok', `สร้าง ${res.count} ไฟล์ → ${res.where}`), h('div.hint', 'แนบไฟล์เหล่านี้ให้แต่ละคนได้ในแท็บ “อีเมลเป็นชุด”'));
        }
      }
    } catch (e) {
      console.error(e);
      toast('สร้างไม่สำเร็จ: ' + e.message, 'error');
    } finally {
      prog.hide(); genBtn.disabled = false; stopBtn.hidden = true;
    }
  }
  const genBtn = btn('สร้างไฟล์', generate, { kind: 'primary big', ic: 'play' });
  const stopBtn = btn('หยุด', () => (cancel = true), { kind: 'danger', ic: 'stop' });
  stopBtn.hidden = true;

  // ---------- พรีเซ็ตแบบ ----------
  const bar = presetBar(store.presets('docs-designer'), {
    builtins: DESIGNS,
    getData: () => structuredClone(design),
    apply: async (d) => {
      design = { ...structuredClone(DESIGNS['เกียรติบัตร A4 แนวนอน']), ...d };
      selected = 0;
      renderPage(); renderFields(); renderOutType();
      await setBackground(design.bg, design.bgType);
    },
  });

  loadUserFonts().then((names) => { userFonts = names; renderFields(); draw(); });
  shared.onRows(() => draw());
  renderPage(); renderFields(); renderOutType(); setBackground(null);

  return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px' } },
    bar,
    h('div.card',
      h('h3.card-title', icon('award'), 'แบบชิ้นงาน'),
      pageFields,
      h('div.row.wrap',
        btn('ใส่ภาพพื้นหลัง (PNG / JPG / PDF)', async () => {
          const [f] = await pickFiles({ accept: 'image/png,image/jpeg,image/webp,application/pdf,.pdf', multiple: false });
          if (f) await setBackground(f.file, /pdf$/i.test(f.file.type) || /\.pdf$/i.test(f.file.name) ? 'pdf' : 'image');
        }, { ic: 'image' }),
        btn('เอาพื้นหลังออก', () => setBackground(null), { kind: 'ghost' }),
        bgInfo),
      h('div.hint', 'เคล็ดลับ: ออกแบบพื้นหลังใน Canva / PowerPoint โดยเว้นที่ว่างสำหรับชื่อ แล้ว export เป็น PNG หรือ PDF ขนาดเดียวกับชิ้นงาน')),
    h('div.designer',
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
        wrap,
        h('div.row.wrap',
          btn('', () => { previewRow = Math.max(0, previewRow - 1); draw(); }, { ic: 'left', kind: 'icon-only', title: 'คนก่อนหน้า' }),
          btn('', () => { previewRow = Math.min(rows().length - 1, previewRow + 1); draw(); }, { ic: 'right', kind: 'icon-only', title: 'คนถัดไป' }),
          rowLabel, h('span.spacer'), h('span.hint', 'ลากข้อความบนภาพเพื่อย้ายตำแหน่ง')),
        gridInfo),
      h('div.card',
        h('div.row', h('h3.card-title', 'ช่องข้อความ'), h('span.spacer'),
          btn('เพิ่มข้อความ', () => { design.fields.push(F({ text: '{{ชื่อ}}', y: 50 })); selected = design.fields.length - 1; renderFields(); draw(); }, { ic: 'plus', kind: 'sm' }),
          btn('เพิ่ม QR', async () => { await loadQr(); design.fields.push(F({ type: 'qr', text: 'https://arts.tu.ac.th', x: 88, y: 80, size: 22, color: '#111111' })); selected = design.fields.length - 1; renderFields(); draw(); }, { ic: 'qr', kind: 'sm' })),
        fieldList,
        h('div.row.wrap', btn('เพิ่มฟอนต์ของฉัน (.ttf / .otf)', async () => {
          const [f] = await pickFiles({ accept: '.ttf,.otf,.woff,.woff2', multiple: false });
          if (!f) return;
          try {
            const name = f.file.name.replace(/\.[^.]+$/, '');
            const buf = await f.file.arrayBuffer();
            const face = new FontFace(name, buf);
            await face.load();
            document.fonts.add(face);
            const saved = (await store.get('fonts', {})) || {};
            saved[name] = buf;
            await store.set('fonts', saved);
            userFonts = Object.keys(saved);
            if (design.fields[selected]) design.fields[selected].font = name;
            renderFields(); draw();
            toast('เพิ่มฟอนต์ “' + name + '” แล้ว (จำไว้ในเครื่องนี้)', 'ok');
          } catch { toast('ไฟล์ฟอนต์นี้ใช้ไม่ได้', 'error'); }
        }, { ic: 'type', kind: 'sm' }), h('span.hint', 'เช่น TH SarabunPSK สำหรับหนังสือราชการ')))),
    h('div.card',
      h('h3.card-title', icon('download'), 'สร้างไฟล์'),
      h('div.grid3',
        outTypeWrap,
        field('ชื่อไฟล์ (เมื่อแยกรายคน)', text(opts.fileName, (v) => (opts.fileName = v), { placeholder: 'ค่าเริ่มต้น: {{ชื่อ}} {{นามสกุล}}' })),
        field('ความละเอียด', select([[150, '150 dpi (ไฟล์เล็ก)'], [200, '200 dpi (แนะนำ)'], [300, '300 dpi (พิมพ์คมชัด)']], opts.dpi, (v) => (opts.dpi = +v)))),
      out.el,
      h('div.row.wrap', genBtn, stopBtn), prog.el, resultBox));
}
