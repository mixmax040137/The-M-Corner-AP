// ฐานข้อมูลบุคลากร: จัดรูปชื่อ+ตำแหน่งวิชาการตามภาษา, ค้นหาสำหรับช่องเติมอัตโนมัติ, นำเข้า/ส่งออก CSV
import { h } from '../core/ui.js';

export const STAFF_COLS = [
  ['nameTh', 'ชื่อ-นามสกุล (ไทย)', [/ชื่อ.*(ไทย|th)/i, /^ชื่อ[-\s]*นามสกุล$/, /^ชื่อ$/, /name.*th/i]],
  ['nameEn', 'ชื่อ-นามสกุล (อังกฤษ)', [/ชื่อ.*(อังกฤษ|en)/i, /name.*(en|eng)/i, /^name$/i, /full ?name/i]],
  ['titleTh', 'คำนำหน้า/ตำแหน่งวิชาการ (ไทย)', [/คำนำหน้า.*(ไทย|th)/i, /ตำแหน่งวิชาการ/, /^คำนำหน้า$/]],
  ['titleEn', 'คำนำหน้า/ตำแหน่งวิชาการ (อังกฤษ)', [/คำนำหน้า.*(อังกฤษ|en)/i, /^title/i, /academic title/i]],
  ['positionTh', 'ตำแหน่ง (ไทย)', [/^ตำแหน่ง.*(ไทย|th)/i, /^ตำแหน่ง$/, /ตำแหน่งบริหาร/]],
  ['positionEn', 'ตำแหน่ง (อังกฤษ)', [/ตำแหน่ง.*(อังกฤษ|en)/i, /^position/i]],
  ['unit', 'หน่วยงาน / สาขา', [/หน่วยงาน|สาขา|ภาควิชา|unit|department/i]],
  ['email', 'อีเมล', [/อีเมล|e-?mail/i]],
  ['phone', 'โทรศัพท์', [/โทร|phone|tel/i]],
];

const NO_SPACE_TH = /^(นาย|นาง|นางสาว|คุณ|ดร\.)$/;
// "รองศาสตราจารย์ ดร." + "สมชาย ใจดี" → "รองศาสตราจารย์ ดร.สมชาย ใจดี"
export function fullName(s, lang) {
  if (lang === 'th') {
    const t = String(s.titleTh || '').trim(), n = String(s.nameTh || '').trim();
    if (!t) return n;
    return t + (t.endsWith('.') || NO_SPACE_TH.test(t) ? '' : ' ') + n;
  }
  const t = String(s.titleEn || '').trim(), n = String(s.nameEn || '').trim();
  return [t, n].filter(Boolean).join(' ');
}

// ชื่อพร้อมตำแหน่งสำหรับช่อง “ประธาน”: ไทย = ชื่อ ตำแหน่ง, อังกฤษ = Name, Position
export function nameWithPosition(s, lang) {
  return lang === 'th'
    ? [fullName(s, 'th'), s.positionTh].filter(Boolean).join(' ')
    : [fullName(s, 'en'), s.positionEn].filter(Boolean).join(', ');
}

const norm = (x) => String(x || '').toLowerCase().replace(/\s+/g, '');
export function searchStaff(list, q, max = 6) {
  const k = norm(q).replace(/^(รองศาสตราจารย์|ผู้ช่วยศาสตราจารย์|ศาสตราจารย์|อาจารย์|รศ\.|ผศ\.|ศ\.|อ\.|ดร\.|นางสาว|นาย|นาง|คุณ)+/, '');
  if (k.length < 2) return [];
  return list.filter((s) => [s.nameTh, s.nameEn, s.positionTh, s.unit].some((v) => norm(v).includes(k))).slice(0, max);
}

/**
 * ใส่ช่องเติมอัตโนมัติให้ input: พิมพ์ชื่อ ≥ 2 ตัวอักษร แล้วเลือกจากรายชื่อบุคลากร
 * คืน element ที่ห่อ input ไว้ (ใช้แทน input ในฟอร์ม)
 */
export function staffSuggest(input, getStaff, onPick) {
  const list = h('ul.pr-ac-list', { role: 'listbox', hidden: true });
  const wrap = h('div.pr-ac', input, list);
  let items = [], active = -1;
  const close = () => { list.hidden = true; active = -1; };
  const draw = () => {
    list.replaceChildren(...items.map((s, i) => h('li', { role: 'option', 'aria-selected': i === active, onmousedown: (e) => { e.preventDefault(); pick(i); } },
      h('b', fullName(s, 'th') || fullName(s, 'en')), h('span.muted.small', ' ' + [s.positionTh, s.unit].filter(Boolean).join(' · ')))));
    list.hidden = !items.length;
  };
  const pick = (i) => { const s = items[i]; close(); if (s) onPick(s); };
  input.setAttribute('autocomplete', 'off');
  input.addEventListener('input', () => { items = searchStaff(getStaff() || [], input.value); active = -1; draw(); });
  input.addEventListener('keydown', (e) => {
    if (list.hidden) return;
    if (e.key === 'ArrowDown') { active = Math.min(items.length - 1, active + 1); draw(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { active = Math.max(0, active - 1); draw(); e.preventDefault(); }
    else if (e.key === 'Enter' && active >= 0) { pick(active); e.preventDefault(); }
    else if (e.key === 'Escape') close();
  });
  input.addEventListener('blur', () => setTimeout(close, 150));
  return wrap;
}

// แถวจากไฟล์ (หัวตารางอะไรก็ได้) → ระเบียนบุคลากร
export function rowsToStaff(headers, rows) {
  const map = {};
  for (const [key, , pats] of STAFF_COLS) {
    const used = new Set(Object.values(map));
    const hit = headers.find((x) => !used.has(x) && pats.some((p) => p.test(x)));
    if (hit) map[key] = hit;
  }
  return {
    map,
    list: rows.map((r) => Object.fromEntries(STAFF_COLS.map(([k]) => [k, String(map[k] ? r[map[k]] ?? '' : '').trim()]))).filter((s) => s.nameTh || s.nameEn),
  };
}
