// เครื่องมือ: QR Code เป็นชุด
// จากรายชื่อ Excel หรือพิมพ์ทีละบรรทัด → PNG / SVG แยกไฟล์ หรือแผ่น A4 พร้อมพิมพ์ (มีชื่อใต้ QR)
import { h, btn, field, select, step, toast, safeName, fillTemplate, seg, num, text, debounce, pickFiles, download, progressBar, nextFrame } from '../core/ui.js';
import { dataSource, guessColumn } from '../core/data.js';
import { outputChooser, openSink } from '../core/output.js';
import { loadQr, qrMatrix, drawQr, qrSvg } from '../core/qr.js';
import { pdfLib } from '../core/pdf.js';

const SAMPLE = [['รหัส', 'ชื่อ', 'นามสกุล', 'ลิงก์ลงทะเบียน'],
  ['A001', 'สมชาย', 'ใจดี', 'https://example.com/checkin?id=A001'],
  ['A002', 'สมหญิง', 'รักเรียน', 'https://example.com/checkin?id=A002'],
  ['A003', 'ปิยะ', 'มีสุข', 'https://example.com/checkin?id=A003']];

export async function mount(root) {
  await loadQr();
  let sizeF, sheetF;
  const o = { source: 'data', lines: 'https://arts.tu.ac.th\nสวัสดีครับ คณะศิลปศาสตร์', content: '', label: '', fileName: '', ecl: 'M', size: 600, fg: '#111111', bg: '#ffffff', format: 'png', sheetCm: 4 };
  let logo = null;
  const ds = dataSource({ sample: SAMPLE, onChange: () => { autoFields(); drawSource(); refresh(); } });

  function items() {
    if (o.source === 'lines') return o.lines.split('\n').map((l) => l.trim()).filter(Boolean).map((l, i) => ({ content: l, label: o.label ? fillTemplate(o.label, { ข้อความ: l, ลำดับ: String(i + 1) }) : '', name: safeName(l.replace(/^https?:\/\//, ''), `qr-${i + 1}`).slice(0, 60) }));
    return ds.state.rows.map((r, i) => {
      const v = { ลำดับ: String(i + 1), ...r };
      return { content: fillTemplate(o.content, v), label: fillTemplate(o.label, v), name: safeName(fillTemplate(o.fileName || o.label || o.content, v), `qr-${i + 1}`).slice(0, 80) };
    });
  }

  function autoFields() {
    const hd = ds.state.headers;
    if (!hd.length) return;
    if (!o.content || !hd.some((k) => o.content.includes(`{{${k}}}`))) o.content = `{{${guessColumn(hd, [/ลิงก์|link|url|เว็บ/i, /รหัส|id|code/i]) || hd[0]}}}`;
    if (!o.label) o.label = hd.includes('ชื่อ') && hd.includes('นามสกุล') ? '{{ชื่อ}} {{นามสกุล}}' : '';
  }

  // ---------- วาด 1 ชิ้น (QR + ชื่อใต้ภาพ) ----------
  function render(item, px) {
    const m = qrMatrix(item.content, logo ? 'H' : o.ecl);
    const labelH = item.label ? Math.round(px * 0.16) : 0;
    const c = h('canvas', { width: px, height: px + labelH });
    const ctx = c.getContext('2d');
    ctx.fillStyle = o.bg; ctx.fillRect(0, 0, c.width, c.height);
    if (!m) { ctx.fillStyle = '#c0262d'; ctx.font = `${px * 0.06}px Sarabun`; ctx.fillText('ข้อความยาวเกินไป', px * 0.1, px / 2); return c; }
    drawQr(ctx, m, 0, 0, px, { fg: o.fg, bg: o.bg });
    if (logo) {
      const ls = px * 0.22;
      ctx.fillStyle = o.bg; ctx.fillRect((px - ls * 1.12) / 2, (px - ls * 1.12) / 2, ls * 1.12, ls * 1.12);
      const r = Math.min(ls / logo.width, ls / logo.height);
      ctx.drawImage(logo, (px - logo.width * r) / 2, (px - logo.height * r) / 2, logo.width * r, logo.height * r);
    }
    if (item.label) {
      let fs = labelH * 0.62;
      ctx.fillStyle = o.fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `600 ${fs}px Sarabun, sans-serif`;
      const w = ctx.measureText(item.label).width;
      if (w > px * 0.92) { fs *= (px * 0.92) / w; ctx.font = `600 ${fs}px Sarabun, sans-serif`; }
      ctx.fillText(item.label, px / 2, px + labelH * 0.38);
    }
    return c;
  }

  // ---------- ตัวอย่าง ----------
  const grid = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' } });
  const info = h('div.muted');
  const refresh = debounce(async () => {
    await document.fonts.load('600 20px Sarabun', 'กขค');
    const list = items();
    info.textContent = `${list.length} รายการ`;
    grid.replaceChildren(...list.slice(0, 12).map((it) => {
      const c = render(it, 300);
      c.style.width = '100%'; c.style.height = 'auto'; c.style.border = '1px solid var(--border)'; c.style.borderRadius = '8px';
      return h('div', { title: it.content }, c, h('div.small.muted', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, it.content));
    }));
    if (list.length > 12) grid.append(h('div.muted.small', `… และอีก ${list.length - 12} รายการ`));
  }, 150);

  // ---------- แหล่งข้อมูล ----------
  const sourceBody = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } });
  function drawSource() {
    if (o.source === 'lines') {
      sourceBody.replaceChildren(
        field('ข้อความ / ลิงก์ (บรรทัดละ 1 QR)', h('textarea', { rows: 6, value: o.lines, oninput: (e) => { o.lines = e.target.value; refresh(); } })),
        field('ข้อความใต้ QR (ไม่บังคับ)', text(o.label, (v) => { o.label = v; refresh(); }, { placeholder: 'เช่น สแกนเพื่อลงทะเบียน · ใช้ {{ข้อความ}} หรือ {{ลำดับ}} ได้' })));
    } else {
      sourceBody.replaceChildren(ds.el, h('div.grid3',
        field('ข้อมูลใน QR', text(o.content, (v) => { o.content = v; refresh(); }), 'เช่น {{ลิงก์ลงทะเบียน}} หรือ https://…?id={{รหัส}}'),
        field('ข้อความใต้ QR', text(o.label, (v) => { o.label = v; refresh(); }), 'เช่น {{ชื่อ}} {{นามสกุล}} (เว้นว่างได้)'),
        field('ชื่อไฟล์', text(o.fileName, (v) => (o.fileName = v), { placeholder: 'ค่าเริ่มต้น: ข้อความใต้ QR' }))));
    }
  }

  // ---------- ส่งออก ----------
  const out = outputChooser('qr');
  const prog = progressBar();
  const result = h('div');
  async function exportAll() {
    const list = items().filter((x) => x.content);
    if (!list.length) return toast('ยังไม่มีข้อมูลสำหรับสร้าง QR', 'warn');
    const bad = list.filter((x) => !qrMatrix(x.content, logo ? 'H' : o.ecl));
    if (bad.length) return toast(`ข้อความยาวเกินกว่าจะทำ QR ได้ ${bad.length} รายการ`, 'error');
    await document.fonts.load('600 20px Sarabun', 'กขค');
    if (o.format === 'sheet') return exportSheet(list);
    let sink;
    try { sink = await openSink(out.mode, { zipName: `QR-${list.length}-รายการ.zip`, dirId: 'mhub-qr-out' }); }
    catch (e) { if (e.name !== 'AbortError') toast(e.message, 'error'); return; }
    const used = new Map();
    for (let i = 0; i < list.length; i++) {
      prog.set(i, list.length);
      const it = list[i];
      let base = it.name; const n = (used.get(base) || 0) + 1; used.set(base, n); if (n > 1) base += `-${n}`;
      if (o.format === 'svg') {
        const m = qrMatrix(it.content, o.ecl);
        await sink.write(base + '.svg', new Blob([qrSvg(m, { fg: o.fg, bg: o.bg, size: o.size })], { type: 'image/svg+xml' }));
      } else {
        const c = render(it, +o.size);
        await sink.write(base + '.png', await new Promise((r) => c.toBlob(r, 'image/png')));
      }
      if (i % 10 === 9) await nextFrame();
    }
    prog.hide();
    const res = await sink.close();
    result.replaceChildren(h('div.note.ok', `สร้าง QR ${res.count} ไฟล์ → ${res.where}`));
  }

  async function exportSheet(list) {
    const { PDFDocument } = await pdfLib();
    const pdf = await PDFDocument.create();
    const mm = (v) => (v * 72) / 25.4;
    const cell = +o.sheetCm * 10, gap = 6, margin = 10;
    const labelMm = list.some((x) => x.label) ? cell * 0.16 : 0;
    const cols = Math.floor((210 - 2 * margin + gap) / (cell + gap));
    const rows = Math.floor((297 - 2 * margin + gap) / (cell + labelMm + gap));
    const per = cols * rows;
    const px = Math.round((cell / 25.4) * 300);
    for (let p = 0; p * per < list.length; p++) {
      prog.set(p * per, list.length);
      const page = pdf.addPage([mm(210), mm(297)]);
      for (let s = 0; s < per && p * per + s < list.length; s++) {
        const c = render(list[p * per + s], px);
        const img = await pdf.embedPng(await new Promise((r) => c.toBlob(r, 'image/png')).then((b) => b.arrayBuffer()));
        const x = margin + (s % cols) * (cell + gap);
        const y = 297 - margin - Math.floor(s / cols) * (cell + labelMm + gap) - (cell + labelMm);
        page.drawImage(img, { x: mm(x), y: mm(y), width: mm(cell), height: mm(cell + (c.height - px) * (cell / px)) });
      }
      await nextFrame();
    }
    prog.hide();
    download(new Blob([await pdf.save()], { type: 'application/pdf' }), `QR-${list.length}-รายการ.pdf`);
    result.replaceChildren(h('div.note.ok', `สร้างแผ่น QR ${pdf.getPageCount()} หน้า A4 (${cols} × ${rows} ต่อหน้า)`));
  }

  const logoPrev = h('span.muted.small');
  autoFields(); drawSource(); refresh();
  root.append(
    h('p.intro', 'สร้าง QR Code ทีละหลายสิบรายการ เช่น ลิงก์ลงทะเบียนรายคน รหัสเช็กอิน หรือลิงก์เอกสาร — รองรับภาษาไทย ใส่โลโก้กลาง QR ได้ และใช้ใส่ในเกียรติบัตร/ป้ายชื่อได้ด้วย'),
    step(1, 'ข้อมูลสำหรับ QR', seg([['data', 'จากรายชื่อ Excel'], ['lines', 'พิมพ์ทีละบรรทัด']], o.source, (v) => { o.source = v; drawSource(); refresh(); }), sourceBody),
    step(2, 'รูปแบบ',
      h('div.grid4',
        field('ระดับกันเสียหาย', select([['L', 'ต่ำ (QR เล็กสุด)'], ['M', 'กลาง (แนะนำ)'], ['Q', 'สูง'], ['H', 'สูงสุด (ใส่โลโก้ได้)']], o.ecl, (v) => { o.ecl = v; refresh(); })),
        field('สี QR', h('input', { type: 'color', value: o.fg, oninput: (e) => { o.fg = e.target.value; refresh(); } })),
        field('สีพื้นหลัง', h('input', { type: 'color', value: o.bg, oninput: (e) => { o.bg = e.target.value; refresh(); } })),
        h('div.field', h('span.field-label', 'โลโก้กลาง QR'), h('div.row', btn('เลือก', async () => {
          const [f] = await pickFiles({ accept: 'image/png,image/jpeg,image/svg+xml,image/webp', multiple: false });
          if (!f) return;
          try { logo = await createImageBitmap(f.file); logoPrev.textContent = f.file.name; refresh(); } catch { toast('เปิดรูปโลโก้ไม่ได้', 'error'); }
        }, { kind: 'sm', ic: 'image' }), btn('', () => { logo = null; logoPrev.textContent = ''; refresh(); }, { kind: 'icon-only sm', ic: 'x', title: 'เอาโลโก้ออก' }), logoPrev))),
      h('div.hint', 'สีเข้มบนพื้นสว่างสแกนได้ดีที่สุด · เมื่อใส่โลโก้ ระบบจะใช้ระดับกันเสียหายสูงสุดให้อัตโนมัติ'),
      info, grid),
    step(3, 'สร้างไฟล์',
      h('div.grid3',
        field('รูปแบบไฟล์', select([['png', 'PNG แยกไฟล์'], ['svg', 'SVG แยกไฟล์ (ขยายได้ไม่แตก)'], ['sheet', 'PDF แผ่น A4 พร้อมพิมพ์/ตัด']], o.format, (v) => { o.format = v; sizeF.hidden = v === 'sheet'; sheetF.hidden = v !== 'sheet'; out.el.hidden = v === 'sheet'; })),
        (sizeF = field('ขนาดภาพ (px)', select([[300, '300'], [600, '600 (แนะนำ)'], [1000, '1000'], [2000, '2000 (พิมพ์ใหญ่)']], o.size, (v) => (o.size = +v)))),
        (sheetF = field('ขนาด QR บนกระดาษ', select([[3, '3 ซม.'], [4, '4 ซม.'], [5, '5 ซม.'], [6, '6 ซม.']], o.sheetCm, (v) => (o.sheetCm = +v))))),
      out.el,
      h('div.row', btn('สร้าง QR ทั้งหมด', exportAll, { kind: 'primary big', ic: 'qr' })), prog.el, result),
  );
  sheetF.hidden = true;
}
