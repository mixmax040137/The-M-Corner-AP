// เครื่องมือ: รวม / ทำความสะอาดรายชื่อ Excel
// รวมหลายไฟล์ · ตัดช่องว่าง · แยกคำนำหน้า–ชื่อ–นามสกุล · จัดรูปแบบเบอร์โทร/อีเมล · ลบรายชื่อซ้ำ
import { h, btn, field, select, step, toast, checkbox, pickFiles, download, dropZone } from '../core/ui.js';
import { readGrid, gridToRows, parsePasted, guessColumn, loadXLSX } from '../core/data.js';
import { thaiDigits } from '../core/thai.js';
import { toCsv } from '../core/eml.js';
import { share } from '../core/bus.js';

// คำนำหน้า (ยาวก่อนสั้น) — ตำแหน่งทางวิชาการ ยศ และคำนำหน้าทั่วไป ไทย/อังกฤษ
const PREFIXES = [
  'ศาสตราจารย์เกียรติคุณ', 'ผู้ช่วยศาสตราจารย์', 'รองศาสตราจารย์', 'ศาสตราจารย์', 'ว่าที่ร้อยตรีหญิง', 'ว่าที่ร้อยตรี', 'ว่าที่ ร.ต.',
  'พล.ต.อ.', 'พล.ต.ท.', 'พล.ต.ต.', 'พ.ต.อ.', 'พ.ต.ท.', 'พ.ต.ต.', 'พล.อ.', 'พล.ท.', 'พล.ต.', 'พ.อ.', 'พ.ท.', 'พ.ต.', 'ร.อ.', 'ร.ท.', 'ร.ต.',
  'ศ.ดร.', 'รศ.ดร.', 'ผศ.ดร.', 'อ.ดร.', 'ศ.', 'รศ.', 'ผศ.', 'อ.', 'ดร.', 'นพ.', 'พญ.', 'ทพ.', 'ทพญ.', 'ภก.', 'ภญ.',
  'เด็กชาย', 'เด็กหญิง', 'ด.ช.', 'ด.ญ.', 'นางสาว', 'น.ส.', 'นาง', 'นาย', 'คุณ', 'พระครู', 'พระมหา', 'พระ',
  'Assoc. Prof. Dr.', 'Asst. Prof. Dr.', 'Prof. Dr.', 'Assoc. Prof.', 'Asst. Prof.', 'Assoc.Prof.', 'Asst.Prof.', 'Prof.', 'Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Miss', 'Mr', 'Mrs', 'Ms', 'Dr',
];
const SPACE_ONLY = new Set(['Miss', 'Mr', 'Mrs', 'Ms', 'Dr', 'คุณ', 'พระ']); // ต้องมีเว้นวรรคตามหลัง

export function splitName(full) {
  let rest = String(full || '').replace(/\s+/g, ' ').trim();
  const pre = [];
  for (let guard = 0; guard < 4; guard++) {
    const low = rest.toLowerCase();
    const p = PREFIXES.find((x) => low.startsWith(x.toLowerCase()) && (rest.length > x.length) && (!SPACE_ONLY.has(x) || rest[x.length] === ' ') &&
      !(x === 'อ.' && /^อ\.\S*\s?$/.test(rest)));
    if (!p) break;
    pre.push(p);
    rest = rest.slice(p.length).trim();
  }
  const parts = rest.split(' ').filter(Boolean);
  const latin = /^[A-Za-z]/.test(rest);
  let first = '', last = '';
  if (parts.length === 1) first = parts[0];
  else if (latin) { first = parts.slice(0, -1).join(' '); last = parts[parts.length - 1]; }
  else { first = parts[0]; last = parts.slice(1).join(' '); }
  const prefix = pre.reduce((a, p) => (a ? a + (a.endsWith('.') && !latin ? '' : ' ') + p : p), '');
  return { prefix, first, last };
}

export function formatPhone(raw, style = 'dash') {
  return String(raw || '').split(/\s*[,/;]\s*|\s+หรือ\s+/).map((one) => {
    const ext = (one.match(/(?:ต่อ|ext\.?|x)\s*(\d{1,5})\s*$/i) || [])[1];
    let d = thaiDigits(one.replace(/(?:ต่อ|ext\.?|x)\s*\d{1,5}\s*$/i, '')).replace(/\D/g, '');
    if (!d) return one.trim();
    if (d.startsWith('66') && d.length >= 10) d = '0' + d.slice(2);
    let f = d;
    if (style === 'dash') {
      if (d.length === 10) f = `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
      else if (d.length === 9 && d.startsWith('02')) f = `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
      else if (d.length === 9) f = `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
    }
    return f + (ext ? ` ต่อ ${ext}` : '');
  }).filter(Boolean).join(', ');
}

const titleCase = (s) => s.replace(/[A-Za-z][A-Za-z'’-]*/g, (w) => (w.length > 1 && w === w.toUpperCase()) || w === w.toLowerCase() ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const clean = (v) => String(v ?? '').replace(/[​-‍﻿]/g, '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

export async function mount(root) {
  const sources = []; // {name, headers, rows}
  const opts = { trim: true, digits: true, split: true, phone: true, phoneStyle: 'dash', email: true, english: true, dedupe: true, dedupeKey: 'auto', empty: true, sourceCol: false };
  const cols = { full: '', email: '', phone: '' };
  let result = null;

  const srcList = h('div.list');
  const colBox = h('div.grid3');
  const report = h('div');
  const tableWrap = h('div.table-wrap', { style: { maxHeight: '460px' } });

  const allHeaders = () => [...new Set(sources.flatMap((s) => s.headers))];

  function drawSources() {
    srcList.replaceChildren(...sources.map((s, i) => h('div.list-item', h('span.name', s.name, h('span.muted.small', `  · ${s.rows.length} แถว · ${s.headers.length} คอลัมน์`)),
      btn('', () => { sources.splice(i, 1); drawSources(); }, { ic: 'x', kind: 'icon-only sm', title: 'เอาออก' }))));
    if (!sources.length) srcList.append(h('div.muted', 'ยังไม่มีไฟล์ — เพิ่มได้หลายไฟล์ ระบบจะรวมคอลัมน์ที่ชื่อเหมือนกันให้'));
    const hd = allHeaders();
    if (!hd.includes(cols.full)) cols.full = guessColumn(hd, [/ชื่อ\s*[-–]?\s*(นามสกุล|สกุล)|ชื่อเต็ม|full\s*name/i, /^ชื่อ$|^name$/i]) || '';
    if (!hd.includes(cols.email)) cols.email = guessColumn(hd, [/อีเมล|e-?mail|เมล/i]) || '';
    if (!hd.includes(cols.phone)) cols.phone = guessColumn(hd, [/โทร|เบอร์|phone|mobile|tel/i]) || '';
    colBox.replaceChildren(
      field('คอลัมน์ชื่อเต็ม (สำหรับแยกคำนำหน้า/ชื่อ/สกุล)', select([['', '— ไม่มี —'], ...hd], cols.full, (v) => (cols.full = v))),
      field('คอลัมน์อีเมล', select([['', '— ไม่มี —'], ...hd], cols.email, (v) => (cols.email = v))),
      field('คอลัมน์เบอร์โทร', select([['', '— ไม่มี —'], ...hd], cols.phone, (v) => (cols.phone = v))));
  }

  async function addFiles(entries) {
    for (const { file } of entries) {
      try {
        const sheets = await readGrid(file);
        for (const sh of sheets) {
          if (!sh.grid.length) continue;
          // หาแถวหัวตาราง: แถวแรกที่มีข้อความอย่างน้อย 2 ช่อง
          const hr = Math.max(0, sh.grid.findIndex((r) => r.filter((c) => String(c).trim()).length >= 2));
          const { headers, rows } = gridToRows(sh.grid, hr);
          sources.push({ name: sheets.length > 1 ? `${file.name} › ${sh.name}` : file.name, headers: headers.map(clean), rows });
        }
      } catch (e) { toast(`${file.name}: อ่านไม่ได้ (${e.message})`, 'error'); }
    }
    drawSources();
  }

  function run() {
    if (!sources.length) return toast('เพิ่มไฟล์รายชื่อก่อน', 'warn');
    const stat = { input: 0, split: 0, phone: 0, emailFixed: 0, emailBad: 0, dupes: 0, empty: 0 };
    let headers = allHeaders();
    let rows = sources.flatMap((s) => s.rows.map((r) => ({ ...(opts.sourceCol ? { แหล่งที่มา: s.name } : {}), ...r })));
    if (opts.sourceCol) headers = ['แหล่งที่มา', ...headers];
    stat.input = rows.length;
    const changed = new WeakMap();
    const mark = (r, k) => { if (!changed.has(r)) changed.set(r, new Set()); changed.get(r).add(k); };

    for (const r of rows) {
      for (const k of headers) {
        const before = String(r[k] ?? '');
        let v = before;
        if (opts.trim) v = clean(v);
        if (opts.digits) v = thaiDigits(v);
        if (v !== before) { r[k] = v; mark(r, k); } else r[k] = v;
      }
    }
    if (opts.empty) {
      const n = rows.length;
      rows = rows.filter((r) => headers.some((k) => r[k]));
      stat.empty = n - rows.length;
    }
    if (opts.split && cols.full) {
      for (const k of ['คำนำหน้า', 'ชื่อ', 'นามสกุล']) if (!headers.includes(k)) headers.push(k);
      for (const r of rows) {
        if (!r[cols.full] || (r['ชื่อ'] && cols.full !== 'ชื่อ')) continue;
        const s = splitName(r[cols.full]);
        if (cols.full === 'ชื่อ') { r['ชื่อ'] = s.first; mark(r, 'ชื่อ'); }
        if (!r['คำนำหน้า'] && s.prefix) { r['คำนำหน้า'] = s.prefix; mark(r, 'คำนำหน้า'); }
        if (!r['ชื่อ'] || cols.full === 'ชื่อ') { r['ชื่อ'] = s.first; mark(r, 'ชื่อ'); }
        if (!r['นามสกุล'] && s.last) { r['นามสกุล'] = s.last; mark(r, 'นามสกุล'); }
        stat.split++;
      }
    }
    if (opts.english) {
      for (const r of rows) for (const k of ['คำนำหน้า', 'ชื่อ', 'นามสกุล', cols.full].filter(Boolean)) {
        if (r[k] && /^[A-Za-z]/.test(r[k])) { const v = titleCase(r[k]); if (v !== r[k]) { r[k] = v; mark(r, k); } }
      }
    }
    if (opts.phone && cols.phone) {
      for (const r of rows) {
        const v = formatPhone(r[cols.phone], opts.phoneStyle);
        if (v !== r[cols.phone]) { r[cols.phone] = v; mark(r, cols.phone); stat.phone++; }
      }
    }
    const notes = new Map();
    if (opts.email && cols.email) {
      for (const r of rows) {
        const v = String(r[cols.email] || '').toLowerCase().replace(/^mailto:/, '').replace(/\s/g, '').replace(/[.,;]+$/, '');
        if (v !== r[cols.email]) { r[cols.email] = v; mark(r, cols.email); stat.emailFixed++; }
        if (v && !EMAIL_RE.test(v)) { notes.set(r, 'อีเมลไม่ถูกต้อง'); stat.emailBad++; }
      }
    }
    if (opts.dedupe) {
      const keyCol = opts.dedupeKey === 'auto' ? (cols.email ? 'email' : 'name') : opts.dedupeKey;
      const keyOf = (r) => {
        if (keyCol === 'email' && cols.email) return r[cols.email] ? 'e:' + r[cols.email] : null;
        if (keyCol === 'name') { const n = ((r['ชื่อ'] || '') + (r['นามสกุล'] || '')) || r[cols.full] || ''; return n ? 'n:' + n.replace(/\s/g, '').toLowerCase() : null; }
        return 'r:' + headers.map((k) => r[k]).join('|').toLowerCase();
      };
      const seen = new Map();
      const kept = [];
      for (const r of rows) {
        const k = keyOf(r);
        if (k && seen.has(k)) {
          const base = seen.get(k);
          for (const c of headers) if (!base[c] && r[c]) { base[c] = r[c]; mark(base, c); } // เติมช่องว่างจากแถวซ้ำ
          stat.dupes++;
        } else { if (k) seen.set(k, r); kept.push(r); }
      }
      rows = kept;
    }
    if (notes.size) { if (!headers.includes('หมายเหตุ')) headers.push('หมายเหตุ'); for (const [r, n] of notes) if (rows.includes(r)) r['หมายเหตุ'] = n; }
    result = { headers, rows, changed, notes };
    report.replaceChildren(h('div.note.ok',
      `รวม ${stat.input} แถว → เหลือ ${rows.length} แถว` +
      (stat.dupes ? ` · ลบรายชื่อซ้ำ ${stat.dupes}` : '') + (stat.empty ? ` · ลบแถวว่าง ${stat.empty}` : '') +
      (stat.split ? ` · แยกชื่อ ${stat.split} คน` : '') + (stat.phone ? ` · จัดเบอร์โทร ${stat.phone}` : '') +
      (stat.emailFixed ? ` · แก้อีเมล ${stat.emailFixed}` : '')),
      stat.emailBad ? h('div.note.warn', `อีเมลไม่ถูกต้อง ${stat.emailBad} แถว (ดูคอลัมน์ “หมายเหตุ”)`) : '');
    renderTable();
  }

  function renderTable() {
    if (!result) return;
    const { headers, rows, changed, notes } = result;
    const max = 200;
    tableWrap.replaceChildren(h('table.table',
      h('thead', h('tr', h('th', '#'), headers.map((k) => h('th', k)))),
      h('tbody', rows.slice(0, max).map((r, i) => h('tr', h('td.muted', i + 1),
        headers.map((k) => h('td', { style: notes.get(r) && k === 'หมายเหตุ' ? { color: 'var(--warn)' } : changed.get(r)?.has(k) ? { background: 'var(--ok-soft)' } : null, title: r[k] }, r[k] ?? '')))))));
    if (rows.length > max) tableWrap.append(h('div.muted.small', { style: { padding: '8px' } }, `แสดง ${max} แถวแรกจาก ${rows.length} แถว (ไฟล์ที่ส่งออกมีครบทุกแถว)`));
  }

  async function exportXlsx() {
    if (!result) return toast('กด “จัดการรายชื่อ” ก่อน', 'warn');
    const XLSX = await loadXLSX();
    const ws = XLSX.utils.json_to_sheet(result.rows.map((r) => Object.fromEntries(result.headers.map((k) => [k, r[k] ?? '']))), { header: result.headers });
    ws['!cols'] = result.headers.map((k) => ({ wch: Math.min(40, Math.max(10, k.length + 4, ...result.rows.slice(0, 50).map((r) => String(r[k] ?? '').length + 2))) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'รายชื่อ');
    download(new Blob([XLSX.write(wb, { type: 'array', bookType: 'xlsx' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'รายชื่อ-จัดการแล้ว.xlsx');
  }

  const pasteBox = h('textarea', { rows: 4, placeholder: 'วางตารางจาก Excel / Google Sheets (รวมแถวหัวตาราง)' });
  const drop = h('div.drop',
    h('p', 'ลากไฟล์ Excel / CSV หลายไฟล์มาวาง หรือ'),
    h('div.row.wrap', { style: { justifyContent: 'center' } },
      btn('เพิ่มไฟล์ Excel / CSV', async () => addFiles(await pickFiles({ accept: '.xlsx,.xls,.csv,.ods,.tsv,.txt' })), { kind: 'primary', ic: 'table' }),
      btn('ล้างทั้งหมด', () => { sources.length = 0; result = null; tableWrap.replaceChildren(); report.replaceChildren(); drawSources(); }, { kind: 'ghost', ic: 'trash' })));
  dropZone(drop, addFiles);

  const opt = (k, label) => checkbox(label, opts[k], (v) => (opts[k] = v));
  drawSources();

  root.append(
    h('p.intro', 'รวมรายชื่อจากหลายไฟล์ แล้วทำความสะอาดในคลิกเดียว — แยกคำนำหน้า/ชื่อ/นามสกุล จัดรูปแบบเบอร์โทรและอีเมล ลบชื่อซ้ำ พร้อมใช้ออกเอกสาร/ส่งอีเมลต่อได้ทันที'),
    step(1, 'เพิ่มรายชื่อ', drop,
      h('details', h('summary.muted', 'หรือวางข้อมูลจาก Excel'), h('div', { style: { marginTop: '8px' } }, pasteBox,
        h('div.row', btn('เพิ่มข้อมูลที่วาง', () => {
          const grid = parsePasted(pasteBox.value);
          if (grid.length < 2) return toast('ต้องมีหัวตาราง + ข้อมูลอย่างน้อย 1 แถว', 'warn');
          const { headers, rows } = gridToRows(grid, 0);
          sources.push({ name: `ข้อมูลที่วาง ${sources.length + 1}`, headers, rows });
          pasteBox.value = ''; drawSources();
        }, { kind: 'sm', ic: 'plus' })))),
      srcList),
    step(2, 'เลือกสิ่งที่ต้องการจัดการ', colBox,
      h('div.grid3',
        opt('trim', 'ตัดช่องว่างเกินและอักขระที่มองไม่เห็น'), opt('digits', 'แปลงเลขไทยเป็นเลขอารบิก'), opt('empty', 'ลบแถวว่าง'),
        opt('split', 'แยกคำนำหน้า / ชื่อ / นามสกุล'), opt('english', 'ชื่อภาษาอังกฤษขึ้นต้นตัวใหญ่ (JOHN → John)'), opt('email', 'อีเมลเป็นตัวเล็ก + ตรวจรูปแบบ'),
        h('div.row.wrap', opt('phone', 'จัดรูปแบบเบอร์โทร'), select([['dash', '081-234-5678'], ['plain', '0812345678']], opts.phoneStyle, (v) => (opts.phoneStyle = v))),
        h('div.row.wrap', opt('dedupe', 'ลบรายชื่อซ้ำ โดยดูจาก'), select([['auto', 'อัตโนมัติ (อีเมล ถ้ามี)'], ['email', 'อีเมล'], ['name', 'ชื่อ + นามสกุล'], ['row', 'ทั้งแถวเหมือนกัน']], opts.dedupeKey, (v) => (opts.dedupeKey = v))),
        opt('sourceCol', 'เพิ่มคอลัมน์ “แหล่งที่มา” (ชื่อไฟล์)')),
      h('div.row', btn('จัดการรายชื่อ', run, { kind: 'primary big', ic: 'play' })),
      h('div.hint', 'แถวซ้ำ: เก็บแถวแรกไว้ และเติมช่องที่ว่างจากแถวที่ซ้ำ · ช่องสีเขียว = ช่องที่ถูกแก้ไข')),
    step(3, 'ผลลัพธ์', report, tableWrap,
      h('div.row.wrap',
        btn('ดาวน์โหลด Excel', exportXlsx, { kind: 'primary', ic: 'download' }),
        btn('ดาวน์โหลด CSV', () => { if (!result) return toast('กด “จัดการรายชื่อ” ก่อน', 'warn'); download(new Blob([toCsv(result.rows, result.headers)], { type: 'text/csv' }), 'รายชื่อ-จัดการแล้ว.csv'); }, { ic: 'table' }),
        btn('ส่งไปออกเอกสาร / อีเมล →', () => {
          if (!result) return toast('กด “จัดการรายชื่อ” ก่อน', 'warn');
          share('contacts', { headers: result.headers, rows: result.rows, label: 'จากเครื่องมือจัดการรายชื่อ' });
          location.hash = '#/docs';
          toast('ส่งรายชื่อแล้ว — กด “ใช้รายชื่อนี้” ในขั้นที่ 1', 'ok', 5000);
        }, { ic: 'award' }))),
  );
}
