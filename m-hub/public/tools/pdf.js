// เครื่องมือ: รวม / แยก / แปลง PDF (ทำในเครื่อง ไม่ต้องใช้ Acrobat)
import { h, btn, field, select, toast, progressBar, safeName, splitExt, naturalCompare, dropZone, pickFiles, text, download, tabs, nextFrame, formatBytes, card } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { outputChooser, openSink } from '../core/output.js';
import { pdfLib, openPdf, renderPdfPage } from '../core/pdf.js';
import { IMAGE_RE, decodeImage, drawResized, targetSize } from '../core/image.js';

// "1-3, 5, 8-" → [[1,3],[5,5],[8,n]] (เลขหน้าเริ่มที่ 1)
export function parseRanges(spec, n) {
  const s = String(spec || '').replace(/\s/g, '');
  if (!s || /^(all|ทั้งหมด|ทุกหน้า)$/i.test(s)) return [[1, n]];
  const out = [];
  for (const part of s.split(/[,;]/).filter(Boolean)) {
    const m = part.match(/^(\d*)(?:-(\d*))?$/);
    if (!m) throw new Error(`รูปแบบหน้าไม่ถูกต้อง: “${part}”`);
    const a = m[1] ? +m[1] : 1;
    const b = part.includes('-') ? (m[2] ? +m[2] : n) : a;
    if (a < 1 || b > n || a > b) throw new Error(`หน้า “${part}” เกินจำนวนหน้า (มี ${n} หน้า)`);
    out.push([a, b]);
  }
  return out;
}
const expand = (ranges) => ranges.flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i - 1));

async function loadPdf(file) {
  const { PDFDocument } = await pdfLib();
  return PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
}

async function copyPages(target, src, indices, rotate) {
  const { degrees } = await pdfLib();
  const pages = await target.copyPages(src, indices);
  for (const p of pages) {
    if (rotate) p.setRotation(degrees((p.getRotation().angle + rotate) % 360));
    target.addPage(p);
  }
}

const rotateSel = (state) => field('หมุนหน้า', select([[0, 'ไม่หมุน'], [90, 'หมุนขวา 90°'], [180, 'กลับหัว 180°'], [270, 'หมุนซ้าย 90°']], state.rotate, (v) => (state.rotate = +v)));

// ---------- รวมไฟล์ ----------
function mergeTab() {
  const files = []; // {file, pages, range}
  const state = { rotate: 0, name: 'รวมไฟล์' };
  const listEl = h('div.list');
  const draw = () => {
    listEl.replaceChildren(...files.map((x, i) => h('div.list-item',
      h('span.muted', i + 1), icon('file'),
      h('span.name', { title: x.file.name }, x.file.name, h('span.muted.small', `  · ${x.pages} หน้า · ${formatBytes(x.file.size)}`)),
      h('input', { type: 'text', value: x.range, placeholder: 'ทุกหน้า', style: { width: '120px' }, title: 'เลือกหน้า เช่น 1-3, 5', oninput: (e) => (x.range = e.target.value) }),
      btn('', () => { if (i) { [files[i - 1], files[i]] = [files[i], files[i - 1]]; draw(); } }, { ic: 'up', kind: 'icon-only sm', title: 'เลื่อนขึ้น' }),
      btn('', () => { if (i < files.length - 1) { [files[i + 1], files[i]] = [files[i], files[i + 1]]; draw(); } }, { ic: 'down', kind: 'icon-only sm', title: 'เลื่อนลง' }),
      btn('', () => { files.splice(i, 1); draw(); }, { ic: 'x', kind: 'icon-only sm', title: 'เอาออก' }))));
    if (!files.length) listEl.append(h('div.muted', 'ยังไม่มีไฟล์'));
  };
  const add = async (entries) => {
    for (const { file } of entries.filter((x) => /\.pdf$/i.test(x.file.name)).sort((a, b) => naturalCompare(a.path, b.path))) {
      try { const d = await loadPdf(file); files.push({ file, pages: d.getPageCount(), range: '' }); }
      catch (e) { toast(`${file.name}: เปิดไม่ได้ (${e.message})`, 'error'); }
    }
    draw();
  };
  const drop = h('div.drop', h('p', 'ลากไฟล์ PDF หลายไฟล์มาวาง หรือ'), btn('เลือกไฟล์ PDF', async () => add(await pickFiles({ accept: '.pdf,application/pdf' })), { kind: 'primary', ic: 'file' }));
  dropZone(drop, add);
  const result = h('div');
  draw();
  return [
    card(null, drop, listEl, h('div.hint', 'ช่อง “ทุกหน้า” ใส่เลขหน้าที่ต้องการได้ เช่น 1-3, 5 · เรียงลำดับไฟล์ด้วยลูกศร'),
      h('div.grid3', field('ชื่อไฟล์ผลลัพธ์', text(state.name, (v) => (state.name = v))), rotateSel(state)),
      h('div.row', btn('รวมเป็นไฟล์เดียว', async () => {
        if (files.length < 1) return toast('เลือกไฟล์ PDF ก่อน', 'warn');
        try {
          const { PDFDocument } = await pdfLib();
          const outDoc = await PDFDocument.create();
          for (const x of files) await copyPages(outDoc, await loadPdf(x.file), expand(parseRanges(x.range, x.pages)), state.rotate);
          const blob = new Blob([await outDoc.save()], { type: 'application/pdf' });
          download(blob, safeName(state.name, 'รวมไฟล์') + '.pdf');
          result.replaceChildren(h('div.note.ok', `รวม ${files.length} ไฟล์ → ${outDoc.getPageCount()} หน้า (${formatBytes(blob.size)})`));
        } catch (e) { toast(e.message, 'error'); }
      }, { kind: 'primary big', ic: 'merge' })), result),
  ];
}

// ---------- แยก / ดึงหน้า ----------
function splitTab() {
  let src = null, n = 0;
  const state = { mode: 'each', spec: '', rotate: 0 };
  const info = h('div.muted', 'ยังไม่ได้เลือกไฟล์');
  const specWrap = h('span');
  const out = outputChooser('pdf-split');
  const result = h('div');
  const prog = progressBar();
  const drawSpec = () => specWrap.replaceChildren(state.mode === 'each' ? '' : field(state.mode === 'ranges' ? 'ช่วงหน้า (แต่ละช่วงเป็น 1 ไฟล์)' : 'หน้าที่ต้องการ', text(state.spec, (v) => (state.spec = v), { placeholder: state.mode === 'ranges' ? 'เช่น 1-3, 4-6, 7-' : 'เช่น 2, 5-7' })));
  drawSpec();
  const load = async (entries) => {
    const f = entries.find((x) => /\.pdf$/i.test(x.file.name));
    if (!f) return;
    try { const d = await loadPdf(f.file); src = f.file; n = d.getPageCount(); info.textContent = `${src.name} · ${n} หน้า`; }
    catch (e) { toast('เปิดไม่ได้: ' + e.message, 'error'); }
  };
  const drop = h('div.drop', h('p', 'ลากไฟล์ PDF มาวาง หรือ'), btn('เลือกไฟล์ PDF', async () => load(await pickFiles({ accept: '.pdf,application/pdf', multiple: false })), { kind: 'primary', ic: 'file' }));
  dropZone(drop, load);
  async function run() {
    if (!src) return toast('เลือกไฟล์ PDF ก่อน', 'warn');
    let groups;
    try {
      groups = state.mode === 'each' ? Array.from({ length: n }, (_, i) => [[i + 1, i + 1]])
        : state.mode === 'ranges' ? parseRanges(state.spec, n).map((r) => [r]) : [parseRanges(state.spec, n)];
    } catch (e) { return toast(e.message, 'error'); }
    const base = safeName(splitExt(src.name)[0]);
    const { PDFDocument } = await pdfLib();
    const doc = await loadPdf(src);
    const label = (rs) => rs.map(([a, b]) => (a === b ? a : `${a}-${b}`)).join(',');
    if (groups.length === 1) {
      const o = await PDFDocument.create();
      await copyPages(o, doc, expand(groups[0]), state.rotate);
      download(new Blob([await o.save()], { type: 'application/pdf' }), `${base} หน้า ${label(groups[0])}.pdf`);
      result.replaceChildren(h('div.note.ok', `ได้ไฟล์ ${o.getPageCount()} หน้า`));
      return;
    }
    let sink;
    try { sink = await openSink(out.mode, { zipName: `${base}-แยกหน้า.zip`, dirId: 'mhub-pdf-out' }); }
    catch (e) { if (e.name !== 'AbortError') toast(e.message, 'error'); return; }
    for (let i = 0; i < groups.length; i++) {
      prog.set(i, groups.length);
      const o = await PDFDocument.create();
      await copyPages(o, doc, expand(groups[i]), state.rotate);
      await sink.write(`${base} หน้า ${label(groups[i])}.pdf`, new Blob([await o.save()], { type: 'application/pdf' }));
      if (i % 10 === 9) await nextFrame();
    }
    prog.hide();
    const res = await sink.close();
    result.replaceChildren(h('div.note.ok', `แยกได้ ${res.count} ไฟล์ → ${res.where}`));
  }
  return [card(null, drop, info,
    h('div.grid3',
      field('วิธีแยก', select([['each', 'แยกทุกหน้า (หน้าละไฟล์)'], ['ranges', 'แยกตามช่วงหน้า'], ['pick', 'ดึงเฉพาะหน้าที่ต้องการ (ไฟล์เดียว)']], state.mode, (v) => { state.mode = v; drawSpec(); })),
      specWrap, rotateSel(state)),
    out.el, h('div.row', btn('เริ่มแยกไฟล์', run, { kind: 'primary big', ic: 'scissors' })), prog.el, result)];
}

// ---------- รูปเป็น PDF ----------
function imagesTab() {
  const items = [];
  const state = { page: 'a4auto', margin: 10, name: 'รวมรูป' };
  const info = h('div.muted', 'ยังไม่ได้เลือกรูป');
  const prog = progressBar();
  const result = h('div');
  const add = (entries) => {
    for (const x of entries.filter((e) => IMAGE_RE.test(e.file.name)).sort((a, b) => naturalCompare(a.path, b.path))) items.push(x.file);
    info.textContent = `เลือกแล้ว ${items.length} รูป (เรียงตามชื่อไฟล์)`;
  };
  const drop = h('div.drop', h('p', 'ลากรูปมาวาง หรือ'), h('div.row', { style: { justifyContent: 'center' } },
    btn('เลือกรูป', async () => add(await pickFiles({ accept: 'image/*,.heic,.heif' })), { kind: 'primary', ic: 'image' }),
    btn('ล้าง', () => { items.length = 0; info.textContent = 'ยังไม่ได้เลือกรูป'; }, { kind: 'ghost' })));
  dropZone(drop, add);
  async function run() {
    if (!items.length) return toast('เลือกรูปก่อน', 'warn');
    const { PDFDocument } = await pdfLib();
    const doc = await PDFDocument.create();
    const mm = (v) => (v * 72) / 25.4;
    for (let i = 0; i < items.length; i++) {
      prog.set(i, items.length);
      try {
        const bmp = await decodeImage(items[i]);
        const t = targetSize(bmp.width, bmp.height, { mode: 'long', size: 2480, noUpscale: true });
        const c = drawResized(bmp, bmp.width, bmp.height, t, null, '#ffffff');
        bmp.close();
        const jpg = await doc.embedJpg(await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9)).then((b) => b.arrayBuffer()));
        const land = c.width > c.height;
        let pw, ph;
        if (state.page === 'fit') { pw = (c.width * 72) / 200; ph = (c.height * 72) / 200; }
        else { const portrait = state.page === 'a4p' || (state.page === 'a4auto' && !land); pw = mm(portrait ? 210 : 297); ph = mm(portrait ? 297 : 210); }
        const m = state.page === 'fit' ? 0 : mm(+state.margin || 0);
        const s = Math.min((pw - 2 * m) / c.width, (ph - 2 * m) / c.height);
        const w = c.width * s, hh = c.height * s;
        doc.addPage([pw, ph]).drawImage(jpg, { x: (pw - w) / 2, y: (ph - hh) / 2, width: w, height: hh });
        c.width = 0;
      } catch (e) { toast(`${items[i].name}: ${e.message}`, 'error'); }
      await nextFrame();
    }
    prog.hide();
    const blob = new Blob([await doc.save()], { type: 'application/pdf' });
    download(blob, safeName(state.name, 'รวมรูป') + '.pdf');
    result.replaceChildren(h('div.note.ok', `สร้าง PDF ${doc.getPageCount()} หน้า (${formatBytes(blob.size)})`));
  }
  return [card(null, drop, info,
    h('div.grid3',
      field('ขนาดหน้า', select([['a4auto', 'A4 (แนวตั้ง/นอนตามรูป)'], ['a4p', 'A4 แนวตั้ง'], ['a4l', 'A4 แนวนอน'], ['fit', 'เท่าขนาดรูป']], state.page, (v) => (state.page = v))),
      field('ขอบกระดาษ (มม.)', h('input', { type: 'number', value: state.margin, min: 0, max: 50, oninput: (e) => (state.margin = e.target.value) })),
      field('ชื่อไฟล์', text(state.name, (v) => (state.name = v)))),
    h('div.row', btn('สร้าง PDF', run, { kind: 'primary big', ic: 'play' })), prog.el, result)];
}

// ---------- PDF เป็นรูป ----------
function toImagesTab() {
  let src = null;
  const state = { format: 'jpg', width: 2000 };
  const info = h('div.muted', 'ยังไม่ได้เลือกไฟล์');
  const out = outputChooser('pdf-images');
  const prog = progressBar();
  const result = h('div');
  const load = (entries) => { const f = entries.find((x) => /\.pdf$/i.test(x.file.name)); if (f) { src = f.file; info.textContent = src.name; } };
  const drop = h('div.drop', h('p', 'ลากไฟล์ PDF มาวาง หรือ'), btn('เลือกไฟล์ PDF', async () => load(await pickFiles({ accept: '.pdf,application/pdf', multiple: false })), { kind: 'primary', ic: 'file' }));
  dropZone(drop, load);
  async function run() {
    if (!src) return toast('เลือกไฟล์ PDF ก่อน', 'warn');
    let sink;
    try { sink = await openSink(out.mode, { zipName: `${safeName(splitExt(src.name)[0])}-รูป.zip`, dirId: 'mhub-pdf-out' }); }
    catch (e) { if (e.name !== 'AbortError') toast(e.message, 'error'); return; }
    const doc = await openPdf(src);
    const base = safeName(splitExt(src.name)[0]);
    for (let p = 1; p <= doc.numPages; p++) {
      prog.set(p - 1, doc.numPages);
      const c = await renderPdfPage(doc, p, +state.width);
      const blob = await new Promise((r) => c.toBlob(r, state.format === 'png' ? 'image/png' : 'image/jpeg', 0.9));
      await sink.write(`${base}-หน้า-${String(p).padStart(2, '0')}.${state.format}`, blob);
      c.width = 0;
    }
    prog.hide();
    const res = await sink.close();
    result.replaceChildren(h('div.note.ok', `ได้รูป ${res.count} ไฟล์ → ${res.where}`));
  }
  return [card(null, drop, info,
    h('div.grid3',
      field('รูปแบบ', select([['jpg', 'JPG'], ['png', 'PNG']], state.format, (v) => (state.format = v))),
      field('ความกว้าง (px)', select([[1240, '1240 (ดูบนจอ)'], [2000, '2000 (แนะนำ)'], [3508, '3508 (พิมพ์ A4 300 dpi)']], state.width, (v) => (state.width = +v)))),
    out.el, h('div.row', btn('แปลงเป็นรูป', run, { kind: 'primary big', ic: 'image' })), prog.el, result)];
}

export function mount(root) {
  const t = tabs([
    { id: 'merge', label: 'รวมไฟล์', icon: 'merge', render: mergeTab },
    { id: 'split', label: 'แยก / ดึงหน้า / หมุน', icon: 'scissors', render: splitTab },
    { id: 'images', label: 'รูปเป็น PDF', icon: 'image', render: imagesTab },
    { id: 'toimg', label: 'PDF เป็นรูป', icon: 'files', render: toImagesTab },
  ]);
  root.append(h('p.intro', 'จัดการไฟล์ PDF ในเครื่องโดยไม่ต้องอัปโหลดไปเว็บอื่น — เหมาะกับเอกสารภายในที่ไม่ควรส่งออกนอกหน่วยงาน'), t.el);
}
