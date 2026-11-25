// เครื่องมือ: จัดการรูปเป็นชุด
// ย่อขนาด · แปลงรูปแบบ · เปลี่ยนชื่อตาม Excel/รูปแบบ · จัดโฟลเดอร์ · ใส่โลโก้ · คัดลอกหรือย้าย
import { h, btn, field, select, step, toast, progressBar, formatBytes, safeName, safePath, splitExt, naturalCompare, pad,
  nextFrame, dropZone, pickFiles, confirmBox, fillTemplate, seg, checkbox, num, text, debounce, presetBar, copyText } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { dataSource, guessColumn } from '../core/data.js';
import { outputChooser, openSink } from '../core/output.js';
import { fsSupported, pickDirectory, walkDirectory } from '../core/workspace.js';
import { presets } from '../core/store.js';
import { TH_MONTHS } from '../core/thai.js';
import { IMAGE_RE, FORMATS, isHeic, sameFormatOf, decodeImage, targetSize, drawResized, drawWatermark, encodeCanvas, thumbnail, dateTaken } from '../core/image.js';

const DEFAULTS = {
  resize: 'long', size: 1600, width: 1600, height: 900, percent: 50, noUpscale: true,
  format: 'webp', quality: 82, background: '#ffffff',
  rename: 'keep', pattern: 'ภาพกิจกรรม-{{ลำดับ}}', start: 1, digits: 3, sort: 'name',
  match: 'order', matchCol: '', nameTpl: '',
  organize: 'none', folderTpl: '{{ปี}}/{{ปี}}-{{เดือน}}', yearBE: false,
  wm: { enabled: false, position: 'br', scale: 15, opacity: 85, margin: 3 },
};

const BUILTIN_PRESETS = {
  'รูปข่าวขึ้นเว็บไซต์ (WebP ด้านยาว 1600px)': { ...DEFAULTS, resize: 'long', size: 1600, format: 'webp', quality: 80 },
  'รูปโพสต์ Facebook (JPG ด้านยาว 2048px)': { ...DEFAULTS, resize: 'long', size: 2048, format: 'jpg', quality: 88 },
  'รูปส่ง LINE / อีเมล (JPG ด้านยาว 1280px)': { ...DEFAULTS, resize: 'long', size: 1280, format: 'jpg', quality: 80 },
  'ภาพย่อสี่เหลี่ยม 600×600 (ครอปกลางภาพ)': { ...DEFAULTS, resize: 'cover', width: 600, height: 600, format: 'webp', quality: 80 },
  'แปลง HEIC จาก iPhone เป็น JPG (ขนาดเดิม)': { ...DEFAULTS, resize: 'none', format: 'jpg', quality: 92 },
  'จัดคลังรูปเข้าโฟลเดอร์ ปี/เดือน (ไม่แปลงไฟล์)': { ...DEFAULTS, resize: 'none', format: 'keep', organize: 'template', folderTpl: '{{ปี}}/{{ปี}}-{{เดือน}}' },
};

const SAMPLE = [['ชื่อไฟล์เดิม', 'ชื่อใหม่', 'โฟลเดอร์'], ['IMG_0001', 'พิธีเปิด-01', 'วันที่ 1'], ['IMG_0002', 'พิธีเปิด-02', 'วันที่ 1'], ['IMG_0003', 'บรรยากาศ-01', 'วันที่ 2']];

export function mount(root) {
  const opts = structuredClone(DEFAULTS);
  let items = []; // {id, file, path, parent, handle, thumb, date}
  let overrides = {}; // id → ชื่อใหม่ที่แก้เองในตาราง
  let logo = null; // ImageBitmap ของโลโก้
  let logoBlob = null;
  let plan = [];
  let running = false;
  let cancelRequested = false;
  let nextId = 1;

  const refresh = debounce(() => { rebuildPlan(); renderTable(); }, 120);

  // ---------- 1) เลือกรูป ----------
  const summary = h('div.muted');
  let recursive = true;
  const addItems = async (list) => {
    const imgs = list.filter((x) => IMAGE_RE.test(x.file.name));
    const skipped = list.length - imgs.length;
    for (const x of imgs) items.push({ id: nextId++, file: x.file, path: x.path || x.file.name, parent: x.parent, handle: x.handle, thumb: '', date: null });
    if (skipped) toast(`ข้ามไฟล์ที่ไม่ใช่รูป ${skipped} ไฟล์`, 'warn');
    if (!imgs.length) return;
    renderSummary();
    refresh();
    // อ่านวันที่ถ่าย + ทำภาพย่อเบื้องหลัง
    for (const it of items) {
      if (!it.date) { it.date = await dateTaken(it.file); }
    }
    refresh();
    for (const it of items) {
      if (it.thumb === '') { it.thumb = (await thumbnail(it.file)) || null; const img = root.querySelector(`img[data-id="${it.id}"]`); if (img && it.thumb) img.src = it.thumb; }
      await nextFrame();
    }
  };
  const renderSummary = () => {
    const total = items.reduce((n, x) => n + x.file.size, 0);
    const heic = items.filter((x) => isHeic(x.file)).length;
    summary.textContent = items.length ? `เลือกแล้ว ${items.length} รูป · ${formatBytes(total)}${heic ? ` · HEIC ${heic} รูป` : ''}` : 'ยังไม่ได้เลือกรูป';
    moveBox.hidden = !canMove();
  };

  const drop = h('div.drop',
    h('div', icon('image', 28)),
    h('p', 'ลากรูปหรือโฟลเดอร์มาวางที่นี่ หรือ'),
    h('div.row.wrap', { style: { justifyContent: 'center' } },
      btn('เลือกไฟล์รูป', async () => addItems(await pickFiles({ accept: 'image/*,.heic,.heif' })), { kind: 'primary', ic: 'image' }),
      btn('เลือกทั้งโฟลเดอร์', async () => {
        try {
          if (fsSupported) {
            const dir = await pickDirectory('mhub-images-in', 'readwrite');
            toast('กำลังอ่านโฟลเดอร์ “' + dir.name + '” …');
            addItems(await walkDirectory(dir, { recursive, accept: (n) => IMAGE_RE.test(n) }));
          } else addItems(await pickFiles({ directory: true }));
        } catch (e) { if (e.name !== 'AbortError') toast(e.message, 'error'); }
      }, { ic: 'folder' }),
      btn('ล้างรายการ', () => { items = []; overrides = {}; renderSummary(); refresh(); }, { kind: 'ghost', ic: 'trash' })),
    h('div.row', { style: { justifyContent: 'center', marginTop: '8px' } }, checkbox('รวมรูปในโฟลเดอร์ย่อย', recursive, (v) => (recursive = v))));
  dropZone(drop, addItems);

  // ---------- 2) ขนาดและรูปแบบ ----------
  const sizeFields = h('div.grid4');
  const drawSizeFields = () => {
    const f = [];
    if (opts.resize === 'long') f.push(field('ด้านยาวสุด (px)', num(opts.size, (v) => { opts.size = v; refresh(); }, { min: 16 })));
    if (['width', 'fit', 'cover'].includes(opts.resize)) f.push(field('กว้าง (px)', num(opts.width, (v) => { opts.width = v; refresh(); }, { min: 16 })));
    if (['height', 'fit', 'cover'].includes(opts.resize)) f.push(field('สูง (px)', num(opts.height, (v) => { opts.height = v; refresh(); }, { min: 16 })));
    if (opts.resize === 'percent') f.push(field('เปอร์เซ็นต์', num(opts.percent, (v) => { opts.percent = v; refresh(); }, { min: 1, max: 400 })));
    if (opts.resize !== 'none' && opts.resize !== 'cover' && opts.resize !== 'percent') f.push(h('div.field', h('span.field-label', ' '), checkbox('ไม่ขยายรูปที่เล็กกว่าเดิม', opts.noUpscale, (v) => { opts.noUpscale = v; refresh(); })));
    sizeFields.replaceChildren(...f);
  };
  const resizeSel = select([
    ['none', 'ไม่เปลี่ยนขนาด'], ['long', 'ด้านยาวสุดไม่เกิน'], ['width', 'กำหนดความกว้าง'], ['height', 'กำหนดความสูง'],
    ['fit', 'ย่อให้พอดีกรอบ (ไม่ครอป)'], ['cover', 'ครอปให้เต็มกรอบพอดี'], ['percent', 'ย่อเป็นเปอร์เซ็นต์'],
  ], opts.resize, (v) => { opts.resize = v; drawSizeFields(); refresh(); });

  const qualityLabel = h('span');
  const qualityInput = h('input', { type: 'range', min: 40, max: 100, value: opts.quality, oninput: (e) => { opts.quality = +e.target.value; qualityLabel.textContent = opts.quality; } });
  const formatNote = h('div.hint');
  const bgInput = h('input', { type: 'color', value: opts.background, oninput: (e) => (opts.background = e.target.value) });
  const bgField = field('พื้นหลัง (แทนส่วนโปร่งใสเมื่อเป็น JPG)', bgInput);
  const drawFormat = () => {
    const notes = {
      keep: 'คงรูปแบบเดิม — ถ้าไม่ย่อและไม่ใส่โลโก้ จะคัดลอกไฟล์เดิมทั้งไฟล์ (คุณภาพและข้อมูล EXIF ครบ)',
      jpg: 'JPG เปิดได้ทุกที่ เหมาะกับรูปถ่าย',
      png: 'PNG ไม่สูญเสียคุณภาพ ไฟล์ใหญ่ เหมาะกับกราฟิก/โลโก้/ภาพที่มีพื้นโปร่งใส',
      webp: 'WebP เล็กกว่า JPG ราว 25–35% เหมาะกับขึ้นเว็บไซต์',
      avif: 'AVIF (ตระกูล HEIF) เล็กที่สุด เปิดได้บนเบราว์เซอร์ใหม่ iPhone/Mac และ Windows 11 — ใช้เวลาแปลงนานกว่า · หมายเหตุ: ไฟล์ .HEIC แบบ iPhone ไม่มีเบราว์เซอร์ใดสร้างได้ จึงใช้ AVIF แทน (รับ HEIC เป็นไฟล์ต้นทางได้)',
    };
    formatNote.textContent = notes[opts.format];
    qualityInput.disabled = opts.format === 'png';
    bgField.hidden = opts.format !== 'jpg';
  };
  const formatSeg = seg([['keep', 'คงรูปแบบเดิม'], ['jpg', 'JPG'], ['png', 'PNG'], ['webp', 'WebP'], ['avif', 'AVIF / HEIF']], opts.format, (v) => { opts.format = v; drawFormat(); refresh(); });

  // ---------- 3) ตั้งชื่อ & จัดโฟลเดอร์ ----------
  const renameBody = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } });
  const ds = dataSource({ sample: SAMPLE, handoff: null, onChange: () => { autoExcelColumns(); drawRename(); refresh(); } });
  const tokenHelp = () => h('div.chips', h('span.muted.small', 'ตัวแทนที่ใช้ได้:'),
    ['ชื่อเดิม', 'ลำดับ', 'วันที่', 'ปี', 'เดือน', 'เดือนไทย', 'วัน', ...(opts.rename === 'excel' ? ds.state.headers : [])]
      .map((k) => h('button.chip', { type: 'button', onclick: () => copyText(`{{${k}}}`) }, `{{${k}}}`)));
  const sortSel = () => field('เรียงรูปตาม', select([['name', 'ชื่อไฟล์ (1, 2, 10)'], ['date', 'วันที่ถ่าย'], ['added', 'ลำดับที่เลือก']], opts.sort, (v) => { opts.sort = v; refresh(); }));

  function autoExcelColumns() {
    const hd = ds.state.headers;
    if (!hd.length) return;
    if (!hd.includes(opts.matchCol)) opts.matchCol = guessColumn(hd, [/ชื่อไฟล์|ไฟล์เดิม|file|รูป|ภาพ/i]) || hd[0];
    if (!opts.nameTpl || !/\{\{/.test(opts.nameTpl) || !hd.some((k) => opts.nameTpl.includes(`{{${k}}}`))) {
      const nameCol = guessColumn(hd, [/ชื่อใหม่|new/i, /ชื่อ-?สกุล|ชื่อ|name/i]) || hd.find((k) => k !== opts.matchCol) || hd[0];
      opts.nameTpl = `{{${nameCol}}}`;
    }
  }

  function drawRename() {
    const parts = [seg([['keep', 'ใช้ชื่อเดิม'], ['pattern', 'ตั้งชื่อตามรูปแบบ'], ['excel', 'ตามรายชื่อใน Excel']], opts.rename, (v) => { opts.rename = v; drawRename(); drawOrganize(); refresh(); })];
    if (opts.rename === 'pattern') {
      parts.push(h('div.grid4',
        h('div', { style: { gridColumn: 'span 2' } }, field('รูปแบบชื่อ', text(opts.pattern, (v) => { opts.pattern = v; refresh(); }), 'เช่น ภาพกิจกรรม-{{ลำดับ}} หรือ {{วันที่}}_{{ชื่อเดิม}}')),
        field('เลขเริ่มต้น', num(opts.start, (v) => { opts.start = v; refresh(); }, { min: 0 })),
        field('จำนวนหลัก', num(opts.digits, (v) => { opts.digits = v; refresh(); }, { min: 1, max: 6 }))),
        h('div.grid4', sortSel()), tokenHelp());
    }
    if (opts.rename === 'excel') {
      const hd = ds.state.headers;
      parts.push(ds.el);
      if (hd.length) {
        parts.push(h('div.grid3',
          field('จับคู่รูปกับแถวใน Excel', select([['order', 'เรียงตามลำดับ (แถว 1 = รูปแรก)'], ['match', 'ตามชื่อไฟล์เดิมในคอลัมน์']], opts.match, (v) => { opts.match = v; drawRename(); refresh(); })),
          opts.match === 'match'
            ? field('คอลัมน์ที่มีชื่อไฟล์เดิม', select(hd, opts.matchCol, (v) => { opts.matchCol = v; refresh(); }), 'มีหรือไม่มีนามสกุลไฟล์ก็ได้')
            : sortSel(),
          field('ชื่อใหม่', text(opts.nameTpl, (v) => { opts.nameTpl = v; refresh(); }), 'ใช้หลายคอลัมน์ได้ เช่น {{ชื่อ}}_{{รหัส}}')),
        tokenHelp());
      }
    }
    renameBody.replaceChildren(...parts);
  }

  const organizeBody = h('div');
  function drawOrganize() {
    const parts = [h('div.grid3',
      field('จัดเก็บเข้าโฟลเดอร์', select([
        ['none', 'ไม่แยกโฟลเดอร์'], ['keep', 'คงโครงสร้างโฟลเดอร์เดิม'], ['ym', 'ตามวันที่ถ่าย: ปี / ปี-เดือน'], ['ymd', 'ตามวันที่ถ่าย: ปี / ปี-เดือน-วัน'],
        ['template', 'กำหนดเอง (ใช้คอลัมน์ Excel ได้)'],
      ], opts.organize, (v) => { opts.organize = v; drawOrganize(); refresh(); })),
      opts.organize === 'template' ? field('ชื่อโฟลเดอร์', text(opts.folderTpl, (v) => { opts.folderTpl = v; refresh(); }), 'ใช้ / แยกโฟลเดอร์ย่อย เช่น {{ปี}}/{{โฟลเดอร์}}') : null,
      ['ym', 'ymd', 'template'].includes(opts.organize) ? h('div.field', h('span.field-label', ' '), checkbox('ใช้ปี พ.ศ.', opts.yearBE, (v) => { opts.yearBE = v; refresh(); })) : null)];
    organizeBody.replaceChildren(...parts);
  }

  // ---------- 4) โลโก้ / ลายน้ำ ----------
  const wmPreview = h('img', { style: { maxHeight: '56px', display: 'none', background: 'var(--surface-2)', borderRadius: '6px', padding: '4px' } });
  const wmBody = h('div.grid4', { hidden: true },
    h('div.field', h('span.field-label', 'ไฟล์โลโก้ (แนะนำ PNG พื้นใส)'), h('div.row', btn('เลือกโลโก้', async () => {
      const [f] = await pickFiles({ accept: 'image/png,image/webp,image/svg+xml,image/jpeg', multiple: false });
      if (f) await setLogo(f.file);
    }, { ic: 'upload' }), wmPreview)),
    field('ตำแหน่ง', select([['br', 'มุมขวาล่าง'], ['bl', 'มุมซ้ายล่าง'], ['tr', 'มุมขวาบน'], ['tl', 'มุมซ้ายบน'], ['bc', 'กลางด้านล่าง'], ['tc', 'กลางด้านบน'], ['mc', 'กลางภาพ']], opts.wm.position, (v) => (opts.wm.position = v))),
    field('ขนาด (% ของความกว้างรูป)', num(opts.wm.scale, (v) => (opts.wm.scale = v), { min: 2, max: 80 })),
    field('ความทึบ (%)', num(opts.wm.opacity, (v) => (opts.wm.opacity = v), { min: 5, max: 100 })));
  async function setLogo(file) {
    try {
      logo = await createImageBitmap(file);
      logoBlob = file;
      wmPreview.src = URL.createObjectURL(file);
      wmPreview.style.display = 'block';
    } catch { toast('เปิดไฟล์โลโก้ไม่ได้', 'error'); }
  }
  const wmToggle = checkbox('ใส่โลโก้ / ลายน้ำบนทุกรูป', opts.wm.enabled, (v) => { opts.wm.enabled = v; wmBody.hidden = !v; refresh(); });

  // ---------- 5) ตรวจสอบและเริ่ม ----------
  const tableWrap = h('div.table-wrap', { style: { maxHeight: '460px' } });
  const planNote = h('div');
  const out = outputChooser('images');
  let moveOriginals = false;
  const moveBox = h('div', { hidden: true }, checkbox('ย้ายไฟล์ (ลบต้นฉบับหลังบันทึกไฟล์ใหม่สำเร็จ)', false, (v) => (moveOriginals = v)), h('div.hint', 'ใช้จัดระเบียบคลังรูป — ต้องเลือกรูปด้วยปุ่ม “เลือกทั้งโฟลเดอร์” และบันทึกลงโฟลเดอร์'));
  const canMove = () => fsSupported && items.length > 0 && items.every((x) => x.parent);
  const prog = progressBar();
  const resultBox = h('div');
  const startBtn = btn('เริ่มทำงาน', () => run(), { kind: 'primary big', ic: 'play' });
  const cancelBtn = btn('หยุด', () => { cancelRequested = true; }, { kind: 'danger', ic: 'stop' });
  cancelBtn.hidden = true;

  function tokensFor(it, index) {
    const d = it.date || new Date(it.file.lastModified);
    const y = d.getFullYear() + (opts.yearBE ? 543 : 0);
    const mm = pad(d.getMonth() + 1, 2), dd = pad(d.getDate(), 2);
    return {
      ชื่อเดิม: splitExt(it.file.name)[0], นามสกุลเดิม: splitExt(it.file.name)[1],
      ลำดับ: pad((+opts.start || 0) + index, Math.max(1, +opts.digits || 1)),
      วันที่: `${y}-${mm}-${dd}`, ปี: String(y), เดือน: mm, วัน: dd, เดือนไทย: TH_MONTHS[d.getMonth()],
    };
  }

  function outFormat(it) {
    if (opts.format !== 'keep') return opts.format;
    return sameFormatOf(it.file);
  }
  const needsEncode = (it) => opts.format !== 'keep' || opts.resize !== 'none' || opts.wm.enabled || isHeic(it.file) || /\.(gif|bmp|jfif)$/i.test(it.file.name);

  function rebuildPlan() {
    let list = [...items];
    const useOrder = opts.rename === 'pattern' || (opts.rename === 'excel' && opts.match === 'order');
    if (useOrder || opts.sort) {
      if (opts.sort === 'name') list.sort((a, b) => naturalCompare(a.path, b.path));
      else if (opts.sort === 'date') list.sort((a, b) => (a.date || 0) - (b.date || 0));
    }
    const rows = ds.state.rows;
    const byName = new Map();
    if (opts.rename === 'excel' && opts.match === 'match') {
      for (const r of rows) {
        const k = String(r[opts.matchCol] ?? '').trim().toLowerCase();
        if (k) { byName.set(k, r); byName.set(splitExt(k)[0], r); }
      }
    }
    const used = new Map();
    plan = list.map((it, i) => {
      const tk = tokensFor(it, i);
      let row = null, warn = '';
      let base = tk.ชื่อเดิม;
      if (opts.rename === 'pattern') base = fillTemplate(opts.pattern, null, tk);
      else if (opts.rename === 'excel') {
        row = opts.match === 'order' ? rows[i] : (byName.get(it.file.name.toLowerCase()) || byName.get(tk.ชื่อเดิม.toLowerCase()));
        if (row) base = fillTemplate(opts.nameTpl, row, tk);
        else warn = opts.match === 'order' ? 'ไม่มีแถวใน Excel คู่กับรูปนี้ (ใช้ชื่อเดิม)' : 'ไม่พบชื่อไฟล์นี้ใน Excel (ใช้ชื่อเดิม)';
      }
      if (overrides[it.id] != null) base = overrides[it.id];
      base = safeName(base, tk.ชื่อเดิม);
      let folder = '';
      if (opts.organize === 'keep') folder = it.path.split('/').slice(0, -1).join('/');
      else if (opts.organize === 'ym') folder = `${tk.ปี}/${tk.ปี}-${tk.เดือน}`;
      else if (opts.organize === 'ymd') folder = `${tk.ปี}/${tk.ปี}-${tk.เดือน}-${tk.วัน}`;
      else if (opts.organize === 'template') folder = fillTemplate(opts.folderTpl, row, tk);
      folder = safePath(folder);
      const fmt = needsEncode(it) ? outFormat(it) : null;
      const ext = fmt ? FORMATS[fmt].ext : (splitExt(it.file.name)[1] || 'jpg').toLowerCase();
      let name = `${base}.${ext}`;
      const key = (folder + '/' + name).toLowerCase();
      if (used.has(key)) {
        let n = used.get(key) + 1;
        used.set(key, n);
        name = `${base}-${n}.${ext}`;
        warn ||= 'ชื่อซ้ำ จึงต่อท้ายเลขให้';
      } else used.set(key, 1);
      return { it, row, base, folder, name, fmt, warn, status: '' };
    });
    const extraRows = opts.rename === 'excel' && opts.match === 'order' && rows.length > list.length ? rows.length - list.length : 0;
    const missing = plan.filter((p) => p.warn && p.warn.startsWith('ไม่')).length;
    planNote.replaceChildren(
      !items.length ? h('div.muted', 'เลือกรูปในขั้นที่ 1 แล้วตารางตัวอย่างจะแสดงที่นี่') : '',
      missing ? h('div.note.warn', `มี ${missing} รูปที่หาแถวใน Excel ไม่เจอ จะใช้ชื่อเดิม`) : '',
      extraRows ? h('div.note.info', `Excel มีแถวมากกว่ารูป ${extraRows} แถว (แถวท้าย ๆ จะไม่ถูกใช้)`) : '');
  }

  function renderTable() {
    if (!plan.length) { tableWrap.replaceChildren(); return; }
    const t = h('table.table',
      h('thead', h('tr', h('th', '#'), h('th', 'รูป'), h('th', 'ชื่อเดิม'), h('th', 'ชื่อใหม่ (แก้ได้)'), h('th', 'โฟลเดอร์'), h('th', 'ขนาดเดิม'), h('th', 'สถานะ'))),
      h('tbody', plan.map((p, i) => h('tr',
        h('td.muted', i + 1),
        h('td', p.it.thumb ? h('img.thumb', { src: p.it.thumb, alt: '', 'data-id': p.it.id }) : h('img.thumb', { alt: '', 'data-id': p.it.id })),
        h('td', { title: p.it.path }, p.it.path),
        h('td', h('div.row', h('input', { type: 'text', value: p.base, onchange: (e) => { overrides[p.it.id] = e.target.value; refresh(); } }), h('span.muted', '.' + p.name.split('.').pop()))),
        h('td', p.folder || h('span.muted', '—')),
        h('td.muted', formatBytes(p.it.file.size)),
        h('td', { 'data-status': p.it.id, class: p.warn ? 'status-warn' : '' }, p.status || p.warn || (p.fmt ? 'แปลงเป็น ' + FORMATS[p.fmt].label : 'คัดลอกไฟล์เดิม'))))));
    tableWrap.replaceChildren(t);
  }

  const setStatus = (id, textValue, cls) => {
    const td = tableWrap.querySelector(`[data-status="${id}"]`);
    if (td) { td.textContent = textValue; td.className = cls || ''; }
  };

  async function run() {
    if (running) return;
    rebuildPlan();
    if (!plan.length) return toast('ยังไม่ได้เลือกรูป', 'warn');
    if (opts.wm.enabled && !logo) return toast('เลือกไฟล์โลโก้ก่อน หรือปิดการใส่โลโก้', 'warn');
    const doMove = moveOriginals && canMove() && out.mode === 'folder';
    let sink;
    try {
      sink = await openSink(out.mode, { zipName: `รูปภาพ-${new Date().toISOString().slice(0, 10)}.zip`, dirId: 'mhub-images-out' });
    } catch (e) { if (e.name !== 'AbortError') toast(e.message, 'error'); return; }
    if (doMove && !(await confirmBox(`ย้าย ${plan.length} รูปไปยังโฟลเดอร์ “${sink.label}” และลบไฟล์ต้นฉบับหลังบันทึกสำเร็จ?`, { ok: 'ย้ายไฟล์', danger: true }))) return;
    running = true; cancelRequested = false;
    startBtn.disabled = true; cancelBtn.hidden = false;
    resultBox.replaceChildren();
    let ok = 0, fail = 0, inBytes = 0, outBytes = 0;
    const moved = new Set();
    const t0 = performance.now();
    for (let i = 0; i < plan.length; i++) {
      if (cancelRequested) break;
      const p = plan[i];
      prog.set(i, plan.length, `${i + 1} / ${plan.length}`);
      setStatus(p.it.id, 'กำลังทำ…');
      await nextFrame();
      try {
        const blob = await processOne(p);
        const path = (p.folder ? p.folder + '/' : '') + p.name;
        const written = await sink.write(path, blob);
        if (doMove && blob.size > 0) { await p.it.parent.removeEntry(p.it.file.name); moved.add(p.it); }
        inBytes += p.it.file.size; outBytes += blob.size; ok++;
        setStatus(p.it.id, `✓ ${formatBytes(blob.size)}${written !== path ? ' → ' + written.split('/').pop() : ''}`, 'status-ok');
      } catch (e) {
        fail++;
        console.error(e);
        setStatus(p.it.id, '✗ ' + e.message, 'status-err');
      }
    }
    prog.set(plan.length, plan.length, 'บันทึก…');
    let res;
    try { res = await sink.close(); } catch (e) { toast('บันทึกไม่สำเร็จ: ' + e.message, 'error'); }
    prog.hide();
    running = false; startBtn.disabled = false; cancelBtn.hidden = true;
    const secs = ((performance.now() - t0) / 1000).toFixed(1);
    const saved = inBytes ? Math.round((1 - outBytes / inBytes) * 100) : 0;
    resultBox.replaceChildren(h('div.note.' + (fail ? 'warn' : 'ok'),
      `${cancelRequested ? 'หยุดแล้ว · ' : ''}สำเร็จ ${ok} รูป${fail ? ` · ไม่สำเร็จ ${fail} รูป` : ''} · ${formatBytes(inBytes)} → ${formatBytes(outBytes)}${saved > 0 ? ` (เล็กลง ${saved}%)` : ''} · ${secs} วินาที${res ? ' · ' + res.where : ''}${doMove ? ' · ย้ายไฟล์แล้ว' : ''}`));
    if (moved.size) { items = items.filter((x) => !moved.has(x)); renderSummary(); }
  }

  async function processOne(p) {
    if (!p.fmt) return p.it.file; // คัดลอกไฟล์เดิมทั้งไฟล์
    const bmp = await decodeImage(p.it.file);
    try {
      const target = targetSize(bmp.width, bmp.height, opts.resize === 'none' ? { mode: 'none' } : { mode: opts.resize, size: +opts.size, width: +opts.width, height: +opts.height, percent: +opts.percent, noUpscale: opts.noUpscale });
      const bg = FORMATS[p.fmt].alpha ? null : opts.background;
      const canvas = drawResized(bmp, bmp.width, bmp.height, target, target.crop, bg);
      if (opts.wm.enabled && logo) drawWatermark(canvas, logo, opts.wm);
      const blob = await encodeCanvas(canvas, p.fmt, +opts.quality);
      canvas.width = 0; canvas.height = 0;
      return blob;
    } finally { bmp.close && bmp.close(); }
  }

  // ---------- พรีเซ็ต ----------
  const store = presets('images');
  const bar = presetBar(store, {
    builtins: BUILTIN_PRESETS,
    getData: () => ({ ...structuredClone(opts), wmLogo: logoBlob || null }),
    apply: async (data) => {
      const { wmLogo, ...rest } = data;
      Object.assign(opts, structuredClone(DEFAULTS), rest, { wm: { ...DEFAULTS.wm, ...(rest.wm || {}) } });
      if (wmLogo) await setLogo(wmLogo);
      syncControls();
    },
  });

  function syncControls() {
    resizeSel.value = opts.resize;
    drawSizeFields();
    formatSeg.setValue(opts.format);
    qualityInput.value = opts.quality; qualityLabel.textContent = opts.quality;
    bgInput.value = opts.background;
    drawFormat();
    drawRename(); drawOrganize();
    wmToggle.input.checked = opts.wm.enabled; wmBody.hidden = !opts.wm.enabled;
    refresh();
  }

  // ---------- ประกอบหน้า ----------
  qualityLabel.textContent = opts.quality;
  drawSizeFields(); drawFormat(); drawRename(); drawOrganize(); renderSummary(); rebuildPlan();
  root.append(
    h('p.intro', 'ย่อ แปลง เปลี่ยนชื่อ และจัดเก็บรูปทีละหลายสิบรูปในคลิกเดียว — รูปทั้งหมดประมวลผลบนเครื่องนี้'),
    bar,
    step(1, 'เลือกรูป', drop, summary),
    step(2, 'ขนาดและรูปแบบไฟล์',
      h('div.grid4', field('ปรับขนาด', resizeSel)), sizeFields,
      field('รูปแบบไฟล์ผลลัพธ์', formatSeg), formatNote,
      h('div.grid4', field(h('span', 'คุณภาพ ', qualityLabel), qualityInput, 'ค่าแนะนำ 80–88'), bgField)),
    step(3, 'ตั้งชื่อใหม่และจัดเก็บ', renameBody, organizeBody),
    step(4, 'โลโก้ / ลายน้ำ (ไม่บังคับ)', wmToggle, wmBody),
    step(5, 'ตรวจสอบแล้วเริ่มทำงาน', planNote, tableWrap,
      h('div.grid2', out.el, moveBox),
      h('div.row.wrap', startBtn, cancelBtn), prog.el, resultBox),
  );
}
