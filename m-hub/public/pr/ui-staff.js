// หน้าบุคลากร: ชื่อ ตำแหน่งวิชาการ ตำแหน่ง ไทย/อังกฤษ — ใช้เติมชื่อในฟอร์มอัตโนมัติ และตรวจชื่อ/ตำแหน่งในโพสต์
import { h, setKids, btn, toast, confirmBox, pickFiles, download, text, debounce } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { repo } from './db.js';
import { readGrid, gridToRows } from '../core/data.js';
import { toCsv } from '../core/eml.js';
import { STAFF_COLS, fullName, rowsToStaff } from './staff.js';

let st;

export async function mount(el, app) {
  st = { app, q: '', list: [] };
  st.table = h('div.table-wrap', { style: { maxHeight: '560px' } });
  st.count = h('span.muted.small');
  el.append(
    h('p.intro', 'ใส่รายชื่อบุคลากรครั้งเดียว แล้วในหน้าเขียนโพสต์พิมพ์ชื่อในช่องประธาน วิทยากร หรือผู้ประสานงาน จะมีรายชื่อให้เลือก ระบบใส่คำนำหน้า ตำแหน่งวิชาการ และตำแหน่งให้ถูกตามภาษา และตัวตรวจ “ควรเช็ก” จะเตือนถ้าโพสต์เขียนตำแหน่งวิชาการไม่ตรงกับที่นี่'),
    h('section.card',
      h('div.row.wrap',
        h('div', { style: { flex: '1', minWidth: '200px' } }, text('', (v) => { st.q = v.trim(); draw(); }, { placeholder: 'ค้นหาชื่อ ตำแหน่ง หน่วยงาน…', 'aria-label': 'ค้นหาบุคลากร' })),
        st.count,
        btn('เพิ่มบุคลากร', addRow, { ic: 'plus', kind: 'primary' })),
      st.table,
      h('div.row.wrap',
        btn('นำเข้า CSV / Excel', importFile, { ic: 'upload' }),
        btn('ส่งออก CSV', exportCsv, { ic: 'download' }),
        btn('ดาวน์โหลดไฟล์ตัวอย่างหัวตาราง', () => download(new Blob([toCsv([], STAFF_COLS.map(([, t]) => t))], { type: 'text/csv;charset=utf-8' }), 'บุคลากร-แบบฟอร์ม.csv'), { kind: 'ghost' })),
      h('div.hint', 'ไฟล์นำเข้า: หัวตารางเช่น “ชื่อ-นามสกุล (ไทย)”, “คำนำหน้า/ตำแหน่งวิชาการ (ไทย)”, “ตำแหน่ง (ไทย)”, ฉบับอังกฤษ, หน่วยงาน, อีเมล, โทรศัพท์ (ใช้ไฟล์ที่ส่งออกจากที่นี่เป็นแบบได้) · ชื่อไทยที่มีอยู่แล้วจะถูกอัปเดต')),
  );
  repo.onChange((t) => { if (t === 'staff' || t === '*') load(); });
}

export async function show() { await load(); }

async function load() {
  // ใช้ object เดิมของแต่ละคน (ช่องที่กำลังพิมพ์จะไม่เขียนทับกันเมื่อตารางวาดใหม่)
  const byId = new Map(st.list.map((x) => [x.id, x]));
  st.list = (await repo.list('staff')).map((f) => {
    const cur = byId.get(f.id);
    if (!cur) return f;
    if (String(f.updatedAt) > String(cur.updatedAt || '')) Object.assign(cur, f);
    return cur;
  }).sort((a, b) => String(a.nameTh || a.nameEn).localeCompare(String(b.nameTh || b.nameEn), 'th'));
  draw();
}

const saveSoon = new Map();
function save(rec) {
  rec.updatedAt = new Date().toISOString(); // ข้อมูลบนจอใหม่กว่าในฐานข้อมูลเสมอระหว่างพิมพ์
  if (!saveSoon.has(rec.id)) saveSoon.set(rec.id, debounce(async (r) => { const saved = await repo.put('staff', r, { silent: true }); r.updatedAt = saved.updatedAt; st.app.reloadStaff && st.app.reloadStaff(); }, 400));
  saveSoon.get(rec.id)(rec);
}

function draw() {
  const q = st.q.toLowerCase();
  const shown = st.list.filter((s) => !q || STAFF_COLS.some(([k]) => String(s[k] || '').toLowerCase().includes(q)));
  st.count.textContent = `${st.list.length} คน`;
  const cell = (s, k, w) => h('td', h('input', { type: 'text', value: s[k] || '', 'aria-label': STAFF_COLS.find((c) => c[0] === k)[1], style: { minWidth: w }, oninput: (e) => { s[k] = e.target.value; save(s); preview(s, e.target); } }));
  setKids(st.table, h('table.table',
    h('thead', h('tr', h('th', 'คำนำหน้า (ไทย)'), h('th', 'ชื่อ-นามสกุล (ไทย)'), h('th', 'ตำแหน่ง (ไทย)'), h('th', 'Title'), h('th', 'Name'), h('th', 'Position'), h('th', 'หน่วยงาน'), h('th', 'อีเมล'), h('th', 'โทร'), h('th', ''))),
    h('tbody', shown.map((s) => h('tr', { 'data-staff': s.id, title: fullName(s, 'th') },
      cell(s, 'titleTh', '150px'), cell(s, 'nameTh', '170px'), cell(s, 'positionTh', '200px'),
      cell(s, 'titleEn', '120px'), cell(s, 'nameEn', '170px'), cell(s, 'positionEn', '200px'),
      cell(s, 'unit', '150px'), cell(s, 'email', '190px'), cell(s, 'phone', '120px'),
      h('td', s.sample ? h('span.badge', 'ตัวอย่าง') : null, btn('', async () => {
        if (!(await confirmBox(`ลบ “${fullName(s, 'th') || s.nameEn}”?`, { ok: 'ลบ', danger: true }))) return;
        await repo.remove('staff', s.id);
      }, { ic: 'trash', kind: 'icon-only sm', title: 'ลบ' })))))));
  if (!shown.length) st.table.append(h('div.muted', { style: { padding: '12px' } }, st.list.length ? 'ไม่พบชื่อที่ค้นหา' : 'ยังไม่มีบุคลากร — กด “เพิ่มบุคลากร” หรือนำเข้าไฟล์'));
}

function preview(s, input) { input.closest('tr').title = fullName(s, 'th'); }

async function addRow() {
  const rec = await repo.put('staff', { titleTh: '', nameTh: '', positionTh: '', titleEn: '', nameEn: '', positionEn: '', unit: '', email: '', phone: '' }, { silent: true });
  st.q = '';
  await load();
  st.table.querySelector(`tr[data-staff="${rec.id}"] input`)?.focus();
}

async function importFile() {
  const [f] = await pickFiles({ accept: '.csv,.xlsx,.xls', multiple: false });
  if (!f) return;
  try {
    const [sheet] = await readGrid(f.file);
    const { headers, rows } = gridToRows(sheet.grid, 0);
    const { map, list } = rowsToStaff(headers, rows);
    if (!map.nameTh && !map.nameEn) return toast('ไม่พบคอลัมน์ชื่อ — ใช้หัวตาราง “ชื่อ-นามสกุล (ไทย)” หรือดาวน์โหลดไฟล์ตัวอย่าง', 'error', 6000);
    let added = 0, updated = 0;
    for (const s of list) {
      const ex = st.list.find((x) => (s.nameTh && x.nameTh === s.nameTh) || (!s.nameTh && s.nameEn && x.nameEn === s.nameEn));
      if (ex) { await repo.put('staff', { ...ex, ...Object.fromEntries(Object.entries(s).filter(([, v]) => v)) }, { silent: true }); updated++; }
      else { await repo.put('staff', s, { silent: true }); added++; }
    }
    await load();
    st.app.reloadStaff && st.app.reloadStaff();
    toast(`นำเข้าแล้ว: เพิ่ม ${added} คน · อัปเดต ${updated} คน`, 'ok', 4000);
  } catch (e) { toast('นำเข้าไม่ได้: ' + e.message, 'error'); }
}

function exportCsv() {
  const rows = st.list.map((s) => Object.fromEntries(STAFF_COLS.map(([k, t]) => [t, s[k] || ''])));
  download(new Blob([toCsv(rows, STAFF_COLS.map(([, t]) => t))], { type: 'text/csv;charset=utf-8' }), 'บุคลากร.csv');
}

export { icon };
