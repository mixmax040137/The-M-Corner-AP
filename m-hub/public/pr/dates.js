// วันที่และเวลา: จัดรูปแบบไทย (พ.ศ.) / อังกฤษ (ค.ศ.) และอ่านวันที่จากข้อความเพื่อตรวจว่าวันในสัปดาห์ตรงกับวันที่
import { TH_MONTHS, TH_MONTHS_SHORT, EN_MONTHS, thaiDigits } from '../core/thai.js';

export const TH_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
export const EN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const EN_DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EN_MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad2 = (n) => String(n).padStart(2, '0');

// 'YYYY-MM-DD' → Date (เวลาท้องถิ่น) หรือ null
export function parseISO(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? d : null;
}
export const toISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const todayISO = () => toISO(new Date());
export function addDays(iso, n) {
  const d = parseISO(iso);
  if (!d) return '';
  d.setDate(d.getDate() + n);
  return toISO(d);
}

// ---------- จัดรูปแบบ ----------
export function fmtDate(iso, lang, { weekday = true, short = false } = {}) {
  const d = parseISO(iso);
  if (!d) return '';
  const w = d.getDay(), day = d.getDate(), m = d.getMonth(), y = d.getFullYear();
  if (lang === 'th') {
    const mon = short ? TH_MONTHS_SHORT[m] : TH_MONTHS[m];
    return `${weekday ? 'วัน' + TH_DAYS[w] + 'ที่ ' : ''}${day} ${mon} ${y + 543}`;
  }
  if (short) return `${weekday ? EN_DAYS_SHORT[w] + ', ' : ''}${day} ${EN_MON_SHORT[m]} ${y}`;
  return `${weekday ? EN_DAYS[w] + ', ' : ''}${day} ${EN_MONTHS[m]} ${y}`;
}

// ช่วงวันที่: "วันอังคารที่ 15 – วันพุธที่ 16 ธันวาคม 2569" / "Tuesday 15 – Wednesday 16 December 2026"
export function fmtRange(start, end, lang, opts = {}) {
  const a = parseISO(start), b = parseISO(end);
  if (!a) return '';
  if (!b || toISO(a) === toISO(b) || b < a) return fmtDate(start, lang, opts);
  const { weekday = true, short = false } = opts;
  const sameY = a.getFullYear() === b.getFullYear(), sameM = sameY && a.getMonth() === b.getMonth();
  if (lang === 'th') {
    const mon = (d) => (short ? TH_MONTHS_SHORT : TH_MONTHS)[d.getMonth()];
    const wd = (d) => (weekday ? 'วัน' + TH_DAYS[d.getDay()] + 'ที่ ' : '');
    if (sameM) return `${wd(a)}${a.getDate()} – ${wd(b)}${b.getDate()} ${mon(b)} ${b.getFullYear() + 543}`;
    if (sameY) return `${wd(a)}${a.getDate()} ${mon(a)} – ${wd(b)}${b.getDate()} ${mon(b)} ${b.getFullYear() + 543}`;
    return `${fmtDate(start, lang, opts)} – ${fmtDate(end, lang, opts)}`;
  }
  const mon = (d) => (short ? EN_MON_SHORT : EN_MONTHS)[d.getMonth()];
  const wd = (d) => (weekday ? (short ? EN_DAYS_SHORT : EN_DAYS)[d.getDay()] + ' ' : '');
  if (sameM) return `${wd(a)}${a.getDate()} – ${wd(b)}${b.getDate()} ${mon(b)} ${b.getFullYear()}`;
  if (sameY) return `${wd(a)}${a.getDate()} ${mon(a)} – ${wd(b)}${b.getDate()} ${mon(b)} ${b.getFullYear()}`;
  return `${fmtDate(start, lang, opts)} – ${fmtDate(end, lang, opts)}`;
}

const validTime = (t) => /^\d{1,2}:\d{2}$/.test(String(t || ''));
function enClock(t) {
  const [h, m] = t.split(':').map(Number);
  const suf = h < 12 ? 'a.m.' : 'p.m.';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${pad2(m)} ${suf}`;
}
// "09.00–12.00 น." / "9:00 a.m. – 12:00 p.m."
export function fmtTime(start, end, lang) {
  if (!validTime(start)) return '';
  if (lang === 'th') {
    const th = (t) => t.replace(':', '.').padStart(5, '0');
    return validTime(end) ? `${th(start)}–${th(end)} น.` : `${th(start)} น. เป็นต้นไป`;
  }
  return validTime(end) ? `${enClock(start)} – ${enClock(end)}` : `from ${enClock(start)}`;
}

// ---------- อ่านวันที่จากข้อความ ----------
const TH_WD = { 'อาทิตย์': 0, 'จันทร์': 1, 'อังคาร': 2, 'พุธ': 3, 'พฤหัสบดี': 4, 'พฤหัส': 4, 'ศุกร์': 5, 'เสาร์': 6 };
const TH_WD_ABBR = { 'อา': 0, 'จ': 1, 'อ': 2, 'พ': 3, 'พฤ': 4, 'ศ': 5, 'ส': 6 };
const EN_WD = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const esc = (s) => s.replace(/\./g, '\\.\\s?');
const THW = `(?:\\((?:วัน)?(?:${Object.keys(TH_WD).join('|')})\\)|\\((?:อา|พฤ|จ|อ|พ|ศ|ส)\\.\\)|(?:วัน)?(?:${Object.keys(TH_WD).join('|')})(?:ที่)?)`;
const THM = [...TH_MONTHS, ...TH_MONTHS_SHORT.map(esc)].join('|');
const DASH = '(?:-|–|—|ถึง)';
const RE_TH = new RegExp(
  `(?:(${THW})[\\s,]*)?(\\d{1,2})(?:\\s*${DASH}\\s*(?:(${THW})[\\s,]*)?(\\d{1,2}))?\\s*(${THM})(?:\\s*(พ\\.\\s?ศ\\.|ค\\.\\s?ศ\\.)?\\s*(\\d{4}|\\d{2})(?!\\d|[.:]\\d))?`, 'g');
const RE_TH_AFTER = new RegExp(`^\\s*(${THW})`);
const RE_NUM = new RegExp(`(?:(${THW})[\\s,]*)?(?<![\\d.:/])(\\d{1,2})([/.])(\\d{1,2})\\3(\\d{4}|\\d{2})(?![\\d.:/])`, 'g');

const ENW = '(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tues|Tue|Wed|Thurs|Thur|Thu|Fri|Sat|Sun)\\.?';
const ENM = '(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)\\.?';
const ORD = '(?:st|nd|rd|th)?';
const RE_EN_DM = new RegExp(`\\b(?:${ENW}[,\\s]+)?(\\d{1,2})${ORD}(?:\\s*(?:-|–|—|to)\\s*(?:${ENW}[,\\s]+)?(\\d{1,2})${ORD})?\\s+${ENM}(?![a-z])(?:,?\\s*(\\d{4}))?`, 'gi');
const RE_EN_MD = new RegExp(`\\b(?:${ENW}[,\\s]+)?${ENM}(?![a-z])\\s+(\\d{1,2})${ORD}(?:\\s*(?:-|–|—)\\s*(\\d{1,2})${ORD})?(?:,?\\s*(\\d{4}))?`, 'gi');

function thWeekday(s) {
  if (!s) return null;
  const t = s.replace(/[()\s]/g, '').replace(/^วัน/, '').replace(/ที่$/, '');
  if (t in TH_WD) return TH_WD[t];
  const a = t.replace(/\.$/, '');
  return a in TH_WD_ABBR ? TH_WD_ABBR[a] : null;
}
const enWeekday = (s) => (s ? EN_WD[s.slice(0, 3).toLowerCase()] ?? null : null);
function thMonth(s) {
  const m = s.replace(/\s/g, '');
  const i = TH_MONTHS.indexOf(m);
  return i >= 0 ? i : TH_MONTHS_SHORT.indexOf(m);
}
const enMonth = (s) => EN_MON_SHORT.findIndex((m) => s.toLowerCase().startsWith(m.toLowerCase()));

// ปี: คืน { y: ค.ศ., era: 'BE'|'CE'|'', missing }
function resolveYear(raw, marker, lang, refYear) {
  if (!raw) return { y: refYear, era: '', missing: true };
  let y = +raw;
  if (marker && /ค/.test(marker)) return { y: raw.length === 2 ? 2000 + y : y, era: 'CE', explicitCE: true };
  if (raw.length === 2) return lang === 'th' ? { y: 2500 + y - 543, era: 'BE' } : { y: 2000 + y, era: 'CE' };
  if (y > 2400) return { y: y - 543, era: 'BE' };
  return { y, era: 'CE' };
}

function mk(found, { lang, raw, index, day, month, yr, statedWd, wdRaw }) {
  const d = new Date(yr.y, month, day);
  const valid = month >= 0 && d.getMonth() === month && d.getDate() === day;
  found.push({
    lang, raw, index, day, month, year: yr.y, era: yr.era, explicitCE: !!yr.explicitCE, yearMissing: !!yr.missing, valid,
    iso: valid ? toISO(d) : '', stated: statedWd, statedRaw: wdRaw || '', actual: valid ? d.getDay() : null,
  });
}

/**
 * หาวันที่ทุกตัวในข้อความ (ไทย / อังกฤษ / ตัวเลข) — ตัวเลขไทยอ่านได้
 * refYear = ปี ค.ศ. ที่ใช้เมื่อข้อความไม่ได้ระบุปี
 */
export function findDates(text, refYear = new Date().getFullYear()) {
  const src = thaiDigits(String(text || ''));
  const found = [];
  const taken = [];
  const free = (i, len) => !taken.some(([a, b]) => i < b && a < i + len);
  for (const m of src.matchAll(RE_TH)) {
    const [raw, wd1, d1, wd2, d2, mon, marker, yRaw] = m;
    const month = thMonth(mon);
    if (month < 0) continue;
    const yr = resolveYear(yRaw, marker, 'th', refYear);
    let w1 = thWeekday(wd1), w1raw = wd1;
    let fullRaw = raw;
    if (w1 == null && !d2) {
      const after = src.slice(m.index + raw.length).match(RE_TH_AFTER);
      if (after) { w1 = thWeekday(after[1]); w1raw = after[1]; fullRaw = raw + after[0]; }
    }
    taken.push([m.index, m.index + fullRaw.length]);
    if (d2) {
      mk(found, { lang: 'th', raw: fullRaw, index: m.index, day: +d1, month, yr, statedWd: w1, wdRaw: w1raw });
      mk(found, { lang: 'th', raw: fullRaw, index: m.index, day: +d2, month, yr, statedWd: thWeekday(wd2), wdRaw: wd2 });
    } else {
      mk(found, { lang: 'th', raw: fullRaw.trim(), index: m.index, day: +d1, month, yr, statedWd: w1, wdRaw: w1raw });
    }
  }
  for (const m of src.matchAll(RE_NUM)) {
    if (!free(m.index, m[0].length)) continue;
    const [raw, wd, d, , mo, yRaw] = m;
    const isThaiCtx = /[฀-๿]/.test(src.slice(Math.max(0, m.index - 20), m.index + raw.length + 20)) || +yRaw > 2400;
    const yr = resolveYear(yRaw, '', isThaiCtx ? 'th' : 'en', refYear);
    taken.push([m.index, m.index + raw.length]);
    mk(found, { lang: isThaiCtx ? 'th' : 'en', raw, index: m.index, day: +d, month: +mo - 1, yr, statedWd: thWeekday(wd), wdRaw: wd, numeric: true });
  }
  for (const re of [RE_EN_DM, RE_EN_MD]) {
    for (const m of src.matchAll(re)) {
      if (!free(m.index, m[0].length)) continue;
      let wd1, d1, wd2, d2, mon, yRaw;
      if (re === RE_EN_DM) [, wd1, d1, wd2, d2, mon, yRaw] = m;
      else [, wd1, mon, d1, d2, yRaw] = m;
      const month = enMonth(mon);
      if (month < 0) continue;
      const yr = resolveYear(yRaw, '', 'en', refYear);
      taken.push([m.index, m.index + m[0].length]);
      mk(found, { lang: 'en', raw: m[0].trim(), index: m.index, day: +d1, month, yr, statedWd: enWeekday(wd1), wdRaw: wd1 });
      if (d2) mk(found, { lang: 'en', raw: m[0].trim(), index: m.index, day: +d2, month, yr, statedWd: enWeekday(wd2), wdRaw: wd2 });
    }
  }
  return found.sort((a, b) => a.index - b.index);
}

export const weekdayName = (i, lang) => (lang === 'th' ? TH_DAYS[i] : EN_DAYS[i]);
export const shortDate = (f) => (f.lang === 'th'
  ? `${f.day} ${TH_MONTHS_SHORT[f.month]} ${f.year + 543}`
  : `${f.day} ${EN_MON_SHORT[f.month]} ${f.year}`);

// แทนชื่อวันในข้อความที่ผิดด้วยวันที่ถูก (ใช้กับปุ่ม "แก้ให้")
export function fixWeekdayText(statedRaw, actual, lang) {
  if (lang === 'th') {
    const t = TH_DAYS[actual];
    if (/^\((?:อา|พฤ|จ|อ|พ|ศ|ส)\.\)$/.test(statedRaw)) return `(${['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][actual]}.)`;
    return statedRaw.replace(/(พฤหัสบดี|พฤหัส|อาทิตย์|จันทร์|อังคาร|พุธ|ศุกร์|เสาร์)/, t);
  }
  const full = EN_DAYS[actual];
  const long = statedRaw.replace(/\.$/, '').length > 3;
  return long ? full : full.slice(0, 3) + (statedRaw.endsWith('.') ? '.' : '');
}

// อ่านช่วงเวลาในข้อความ "09.00–12.00 น." เพื่อตรวจว่าเวลาจบหลังเวลาเริ่ม
export function findTimeRanges(text) {
  const src = thaiDigits(String(text || ''));
  const out = [];
  for (const m of src.matchAll(/(?<![\d.:])(\d{1,2})[.:](\d{2})\s*(a\.m\.|p\.m\.|am|pm)?\s*(?:-|–|—|ถึง|to)\s*(\d{1,2})[.:](\d{2})\s*(a\.m\.|p\.m\.|am|pm)?/gi)) {
    let [raw, h1, m1, s1, h2, m2, s2] = m;
    const conv = (h, s) => { h = +h; if (s && /p/i.test(s) && h < 12) h += 12; if (s && /a/i.test(s) && h === 12) h = 0; return h; };
    const a = conv(h1, s1 || s2) * 60 + +m1, b = conv(h2, s2) * 60 + +m2;
    const bad = +h1 > 23 || +h2 > 23 || +m1 > 59 || +m2 > 59;
    out.push({ raw, start: a, end: b, bad, reversed: !bad && b <= a });
  }
  return out;
}
