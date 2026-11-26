// สถิติผลการโพสต์ (คำนวณในเครื่อง ไม่ใช้ AI): engagement, ค่าเฉลี่ยตามกลุ่ม, โพสต์ต่อเดือน, รายงานรายเดือน
import { TONES, CHANNELS, KINDS, EVENT_TYPES, toneOf, channelOf, kindOf, eventTypeOf } from './fields.js';
import { TH_DAYS } from './dates.js';
import { TH_MONTHS_SHORT, TH_MONTHS } from '../core/thai.js';

export const METRICS = [
  ['reach', 'การเข้าถึง (Reach)'],
  ['reactions', 'รีแอ็กชัน'],
  ['comments', 'คอมเมนต์'],
  ['shares', 'แชร์'],
  ['clicks', 'คลิก'],
];
const num = (v) => (Number.isFinite(+v) && v !== '' && v != null ? +v : 0);
export const engagement = (m = {}) => num(m.reactions) + num(m.comments) + num(m.shares) + num(m.clicks);
export const rate = (m = {}) => (num(m.reach) > 0 ? engagement(m) / num(m.reach) : null);
export const hasMetrics = (p) => !!p.metrics && METRICS.some(([k]) => p.metrics[k] !== '' && p.metrics[k] != null && Number.isFinite(+p.metrics[k]));

// วันเวลาที่โพสต์ (เวลาท้องถิ่น) — ใช้ postedAt ถ้ามี ไม่งั้นใช้วันที่วางแผนไว้
export function postedDate(p) {
  const s = p.postedAt || (p.status === 'posted' ? p.plannedDate : '');
  if (!s) return null;
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? s + 'T00:00' : s);
  return isNaN(d) ? null : d;
}
export const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
export const monthLabel = (m, short = false) => `${(short ? TH_MONTHS_SHORT : TH_MONTHS)[+m.slice(5, 7) - 1]} ${String(+m.slice(0, 4) + 543).slice(short ? 2 : 0)}`;
const hasTime = (p) => /T\d{2}:\d{2}/.test(String(p.postedAt || ''));

export const TIME_BUCKETS = [
  ['night', 'ดึก 00–06 น.', 0, 6], ['morning', 'เช้า 06–11 น.', 6, 11], ['noon', 'กลางวัน 11–14 น.', 11, 14],
  ['afternoon', 'บ่าย 14–17 น.', 14, 17], ['evening', 'เย็น 17–20 น.', 17, 20], ['late', 'ค่ำ 20–24 น.', 20, 24],
];
export const timeBucket = (h) => TIME_BUCKETS.find(([, , a, b]) => h >= a && h < b) || TIME_BUCKETS[0];

// โพสต์ที่โพสต์แล้วและมีตัวเลขผล ในช่วงเดือนที่เลือก
export function scope(posts, { from = '', to = '' } = {}) {
  return posts.filter((p) => !p.deleted && p.status === 'posted').filter((p) => {
    const d = postedDate(p);
    if (!d) return !from && !to;
    const m = monthKey(d);
    return (!from || m >= from) && (!to || m <= to);
  });
}

export function summary(posts) {
  const withM = posts.filter(hasMetrics);
  const reach = withM.reduce((a, p) => a + num(p.metrics.reach), 0);
  const eng = withM.reduce((a, p) => a + engagement(p.metrics), 0);
  const rated = withM.filter((p) => num(p.metrics.reach) > 0);
  return {
    posted: posts.length,
    measured: withM.length,
    reach, eng,
    avgEng: withM.length ? eng / withM.length : 0,
    avgRate: rated.length ? rated.reduce((a, p) => a + rate(p.metrics), 0) / rated.length : null,
  };
}

const GROUPS = {
  tone: { label: 'โทน', key: (p) => p.tone, name: (k, s) => toneOf(k, s.customTones || []).th, order: TONES.map((t) => t.id) },
  channel: { label: 'ช่องทาง', key: (p) => p.channel, name: (k) => channelOf(k).th, order: CHANNELS.map((c) => c.id) },
  eventType: { label: 'ประเภทงาน', key: (p) => p.eventType || 'other', name: (k) => eventTypeOf(k).label, order: EVENT_TYPES.map((e) => e.id) },
  kind: { label: 'ประเภทโพสต์', key: (p) => p.kind, name: (k) => kindOf(k).th, order: KINDS.map((k) => k.id) },
  weekday: { label: 'วันที่โพสต์', key: (p) => { const d = postedDate(p); return d ? String(d.getDay()) : null; }, name: (k) => 'วัน' + TH_DAYS[+k], order: ['1', '2', '3', '4', '5', '6', '0'] },
  time: { label: 'ช่วงเวลา', key: (p) => { const d = postedDate(p); return d && hasTime(p) ? timeBucket(d.getHours())[0] : null; }, name: (k) => (TIME_BUCKETS.find((b) => b[0] === k) || [])[1] || k, order: TIME_BUCKETS.map((b) => b[0]) },
};
export const GROUP_KEYS = Object.keys(GROUPS);
export const groupLabel = (g) => GROUPS[g].label;

/** ค่าเฉลี่ยตามกลุ่ม → [{key, label, n, avgEng, avgRate, reach, eng}] เรียงจากดีที่สุด */
export function groupStats(posts, by, settings = {}, metric = 'avgEng') {
  const g = GROUPS[by];
  const map = new Map();
  for (const p of posts.filter(hasMetrics)) {
    const k = g.key(p);
    if (k == null || k === '') continue;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(p);
  }
  const rows = [...map].map(([key, list]) => ({ key, label: g.name(key, settings), ...summary(list), n: list.length }));
  // กลุ่มที่มีอย่างน้อย 2 โพสต์ขึ้นก่อน (สรุปได้) กลุ่มที่ข้อมูลน้อยไว้ท้าย
  return rows.sort((a, b) => (b.n >= 2) - (a.n >= 2) || (b[metric] ?? -1) - (a[metric] ?? -1) || b.n - a.n || g.order.indexOf(a.key) - g.order.indexOf(b.key));
}

// จำนวนโพสต์ต่อเดือน แยกตามช่องทางหรือประเภทโพสต์ (นับทุกโพสต์ที่โพสต์แล้ว ไม่ต้องมีตัวเลขผล)
export function postsPerMonth(posts, by = 'channel', months = []) {
  const g = GROUPS[by];
  const keys = g.order.filter((k) => posts.some((p) => g.key(p) === k));
  const counts = Object.fromEntries(keys.map((k) => [k, months.map(() => 0)]));
  for (const p of posts) {
    const d = postedDate(p);
    if (!d) continue;
    const i = months.indexOf(monthKey(d));
    const k = g.key(p);
    if (i >= 0 && counts[k]) counts[k][i]++;
  }
  let series = keys.map((k) => ({ key: k, label: g.name(k), values: counts[k] })).filter((s) => s.values.some(Boolean));
  // เกิน 8 กลุ่ม → รวมกลุ่มเล็กเป็น “อื่น ๆ” (สีหมวดหมู่มีแค่ 8 ช่อง)
  if (series.length > 8) {
    const sorted = [...series].sort((a, b) => b.values.reduce((x, y) => x + y) - a.values.reduce((x, y) => x + y));
    const keep = new Set(sorted.slice(0, 7).map((s) => s.key));
    const other = { key: 'other', label: 'อื่น ๆ', values: months.map((_, i) => series.filter((s) => !keep.has(s.key)).reduce((a, s) => a + s.values[i], 0)) };
    series = [...series.filter((s) => keep.has(s.key)), other];
  }
  return { months, series };
}

export function lastMonths(n, end = new Date()) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(monthKey(new Date(end.getFullYear(), end.getMonth() - i, 1)));
  return out;
}

// สรุปเป็นประโยค (0 token) — กลุ่มที่มีอย่างน้อย 2 โพสต์เท่านั้น
export function insight(rows, by, metric = 'avgEng') {
  const ok = rows.filter((r) => r.n >= 2 && r[metric] != null);
  if (ok.length < 2) return null;
  const best = ok[0];
  const v = metric === 'avgRate' ? (best.avgRate * 100).toFixed(1) + '% ของการเข้าถึง' : Math.round(best.avgEng).toLocaleString() + ' ต่อโพสต์';
  return `${GROUPS[by].label}ที่ได้ผลดีที่สุด: ${best.label} (เฉลี่ย ${v} จาก ${best.n} โพสต์)`;
}

// รายงานรายเดือน: แถวของโพสต์ในเดือนนั้น
export function monthRows(posts, events, month) {
  return scope(posts, { from: month, to: month })
    .map((p) => {
      const d = postedDate(p);
      const ev = events.find((e) => e.id === p.eventId);
      const m = p.metrics || {};
      return {
        id: p.id,
        date: d ? `${d.getDate()} ${TH_MONTHS_SHORT[d.getMonth()]}` : '',
        time: d && hasTime(p) ? `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')} น.` : '',
        sort: d ? d.getTime() : 0,
        channel: channelOf(p.channel).th,
        kind: kindOf(p.kind).th,
        tone: toneOf(p.tone).th,
        title: ev ? ev.fields.title : String(p.text || '').split('\n')[0].slice(0, 60),
        reach: num(m.reach), reactions: num(m.reactions), comments: num(m.comments), shares: num(m.shares), clicks: num(m.clicks),
        eng: engagement(m), rate: rate(m), measured: hasMetrics(p),
      };
    })
    .sort((a, b) => a.sort - b.sort);
}

export const REPORT_COLS = [
  ['date', 'วันที่'], ['time', 'เวลา'], ['channel', 'ช่องทาง'], ['kind', 'ประเภท'], ['tone', 'โทน'], ['title', 'งาน / โพสต์'],
  ['reach', 'Reach'], ['reactions', 'รีแอ็กชัน'], ['comments', 'คอมเมนต์'], ['shares', 'แชร์'], ['clicks', 'คลิก'], ['eng', 'Engagement'], ['rate', 'อัตรา (%)'],
];
export const fmtRate = (r) => (r == null ? '–' : (r * 100).toFixed(1) + '%');
