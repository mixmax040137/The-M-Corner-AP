// อ่านรายชื่อจาก Excel / CSV / การวางจาก Excel แล้วแสดงตารางตัวอย่าง
import { h, btn, select, field, loadScript, pickFiles, toast, copyText } from './ui.js';
import { shared, onShare } from './bus.js';

export async function loadXLSX() {
  await loadScript(new URL('../vendor/xlsx.full.min.js', import.meta.url).href);
  return window.XLSX;
}

// อ่านไฟล์ตาราง → [{name, grid: [[...]]}]
export async function readGrid(file) {
  const XLSX = await loadXLSX();
  const buf = await file.arrayBuffer();
  const isCsv = /\.(csv|txt|tsv)$/i.test(file.name);
  const wb = isCsv
    ? XLSX.read(new TextDecoder('utf-8').decode(buf).replace(/^﻿/, ''), { type: 'string', raw: true })
    : XLSX.read(buf, { type: 'array', cellDates: false });
  return wb.SheetNames.map((name) => ({
    name,
    grid: XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '', raw: false, blankrows: false }),
  }));
}

export function parsePasted(text) {
  const lines = String(text).replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '');
  const delim = lines.some((l) => l.includes('\t')) ? '\t' : ',';
  return lines.map((l) => l.split(delim).map((c) => c.trim().replace(/^"(.*)"$/, '$1')));
}

// แปลงตาราง (grid) เป็นแถวข้อมูล โดยเลือกว่าหัวตารางอยู่แถวไหน
export function gridToRows(grid, headerRow = 0) {
  const head = (grid[headerRow] || []).map((x) => String(x ?? '').trim());
  const width = Math.max(head.length, ...grid.slice(headerRow + 1).map((r) => r.length));
  const headers = [];
  const seen = {};
  for (let i = 0; i < width; i++) {
    let name = head[i] || 'คอลัมน์ ' + colLetter(i);
    if (seen[name]) name = `${name} (${++seen[name]})`;
    else seen[name] = 1;
    headers.push(name);
  }
  const rows = grid.slice(headerRow + 1)
    .filter((r) => r.some((c) => String(c ?? '').trim() !== ''))
    .map((r) => Object.fromEntries(headers.map((k, i) => [k, String(r[i] ?? '').trim()])));
  return { headers, rows };
}

export function colLetter(i) {
  let s = '';
  for (i++; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
  return s;
}

// เดาคอลัมน์จากชื่อหัวตาราง เช่น หา "อีเมล"
export function guessColumn(headers, patterns) {
  for (const p of patterns) {
    const f = headers.find((x) => p.test(x));
    if (f) return f;
  }
  return '';
}

/**
 * กล่องข้อมูลรายชื่อ ใช้ซ้ำได้ทุกเครื่องมือ
 * onChange({headers, rows, source}) ถูกเรียกเมื่อข้อมูลเปลี่ยน
 */
export function dataSource({ onChange, sample, showChips = true, handoff = 'contacts' } = {}) {
  const state = { headers: [], rows: [], source: '', sheets: [], sheet: 0, headerRow: 0 };
  const info = h('div.muted');
  const sheetSel = h('span');
  const headerSel = h('span');
  const preview = h('div.table-wrap');
  const chips = h('div.chips');
  const pasteBox = h('textarea', { rows: 5, placeholder: 'คัดลอกตารางจาก Excel / Google Sheets (รวมแถวหัวตาราง) แล้ววางที่นี่' });
  const pasteWrap = h('div', { hidden: true }, pasteBox, h('div.row', btn('ใช้ข้อมูลที่วาง', () => {
    const grid = parsePasted(pasteBox.value);
    if (!grid.length) return toast('ยังไม่มีข้อมูล', 'warn');
    setSheets([{ name: 'ข้อมูลที่วาง', grid }], 'ข้อมูลที่วาง');
    pasteWrap.hidden = true;
  }, { kind: 'primary', ic: 'check' })));

  function setSheets(sheets, source) {
    state.sheets = sheets;
    state.sheet = 0;
    state.headerRow = 0;
    state.source = source;
    refresh();
  }

  function refresh() {
    const sh = state.sheets[state.sheet];
    if (!sh) return;
    Object.assign(state, gridToRows(sh.grid, state.headerRow));
    sheetSel.replaceChildren(state.sheets.length > 1
      ? field('ชีต', select(state.sheets.map((s, i) => [i, s.name]), state.sheet, (v) => { state.sheet = +v; state.headerRow = 0; refresh(); }))
      : '');
    const maxHead = Math.min(10, sh.grid.length);
    headerSel.replaceChildren(field('หัวตารางอยู่แถวที่', select(Array.from({ length: maxHead }, (_, i) => [i, String(i + 1)]), state.headerRow, (v) => { state.headerRow = +v; refresh(); })));
    info.textContent = `${state.source} · ${state.rows.length} แถว · ${state.headers.length} คอลัมน์`;
    renderPreview();
    onChange && onChange(state);
  }

  function renderPreview() {
    const max = 6;
    const t = h('table.table',
      h('thead', h('tr', h('th', '#'), state.headers.map((x) => h('th', x)))),
      h('tbody', state.rows.slice(0, max).map((r, i) => h('tr', h('td.muted', i + 1), state.headers.map((k) => h('td', r[k]))))));
    preview.replaceChildren(t, state.rows.length > max ? h('div.muted.small', `… และอีก ${state.rows.length - max} แถว`) : '');
    if (showChips) {
      chips.replaceChildren(h('span.muted.small', 'คลิกเพื่อคัดลอกตัวแทนข้อมูล:'),
        state.headers.map((k) => h('button.chip', { type: 'button', onclick: () => copyText(`{{${k}}}`) }, `{{${k}}}`)));
    }
  }

  // รับรายชื่อที่ส่งมาจากเครื่องมือ “จัดการรายชื่อ”
  const handoffBox = h('div');
  const showHandoff = (v) => {
    if (!v || !v.rows || !v.rows.length) { handoffBox.replaceChildren(); return; }
    handoffBox.replaceChildren(h('div.note.info.row.wrap',
      h('span', `มีรายชื่อที่จัดการแล้วส่งมา ${v.rows.length} แถว (${v.label || 'จัดการรายชื่อ'})`),
      btn('ใช้รายชื่อนี้', () => { setSheets([{ name: v.label || 'รายชื่อ', grid: [v.headers, ...v.rows.map((r) => v.headers.map((k) => r[k] ?? ''))] }], v.label || 'รายชื่อที่จัดการแล้ว'); handoffBox.replaceChildren(); }, { kind: 'primary sm', ic: 'check' })));
  };
  if (handoff) { showHandoff(shared(handoff)); onShare(handoff, showHandoff); }

  const el = h('div.data-source',
    handoffBox,
    h('div.row.wrap',
      btn('เปิดไฟล์ Excel / CSV', async () => {
        const [f] = await pickFiles({ accept: '.xlsx,.xls,.csv,.ods,.tsv,.txt', multiple: false });
        if (f) await loadFile(f.file);
      }, { kind: 'primary', ic: 'table' }),
      btn('วางจาก Excel', () => { pasteWrap.hidden = !pasteWrap.hidden; pasteBox.focus(); }, { ic: 'copy' }),
      sample ? btn('ลองด้วยข้อมูลตัวอย่าง', () => setSheets([{ name: 'ตัวอย่าง', grid: sample }], 'ข้อมูลตัวอย่าง'), { kind: 'ghost' }) : null),
    pasteWrap,
    h('div.row.wrap', sheetSel, headerSel),
    info, preview, chips);

  async function loadFile(file) {
    try { setSheets(await readGrid(file), file.name); }
    catch (e) { toast('อ่านไฟล์ไม่ได้: ' + e.message, 'error'); }
  }

  return { el, state, loadFile, setGrid: (grid, name = 'ข้อมูล') => setSheets([{ name, grid }], name) };
}
