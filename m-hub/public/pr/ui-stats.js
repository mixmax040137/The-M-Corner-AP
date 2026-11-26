// หน้าสถิติและรายงาน: (1) บันทึกผลการโพสต์ (2) Dashboard อะไรได้ผลดีที่สุด (3) รายงานรายเดือน (CSV / พิมพ์เป็น PDF)
import { h, setKids, btn, field, select, seg, tabs, toast, download, debounce } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { repo } from './db.js';
import { channelOf, kindOf, toneOf } from './fields.js';
import { fmtDate } from './dates.js';
import { toCsv } from '../core/eml.js';
import {
  METRICS, engagement, rate, hasMetrics, postedDate, monthKey, monthLabel, scope, summary, groupStats, GROUP_KEYS, groupLabel,
  postsPerMonth, lastMonths, insight, monthRows, REPORT_COLS, fmtRate,
} from './stats.js';
import { barList, stackedColumns, statTile, fmtNum } from './charts.js';
import { openPostEditor } from './ui-campaign.js';

let st;

export async function mount(el, app) {
  st = { app, el, posts: [], events: [], recMonth: '', withApproved: false, period: '6', metric: 'avgEng', by: 'channel', repMonth: '' };
  st.rec = h('div.pr-stack');
  st.dash = h('div.pr-stack');
  st.rep = h('div.pr-stack');
  const t = tabs([
    { id: 'record', label: 'บันทึกผลการโพสต์', icon: 'pen', render: () => st.rec },
    { id: 'dash', label: 'Dashboard', icon: 'grid', render: () => st.dash },
    { id: 'report', label: 'รายงานรายเดือน', icon: 'file', render: () => st.rep },
  ], (id) => { st.tab = id; draw(); });
  el.append(h('p.intro', 'ใส่ตัวเลขผลของแต่ละโพสต์หลังโพสต์แล้ว (ดูจาก Meta Business Suite, LINE OA Manager ฯลฯ) ระบบจะสรุปว่าโทน ช่องทาง ประเภทงาน วัน และช่วงเวลาไหนได้ผลดีที่สุด และทำรายงานรายเดือนให้ — คำนวณในเครื่อง ไม่ใช้ AI'), t.el);
  repo.onChange((x) => { if (['posts', 'events', '*'].includes(x) && !el.hidden && !st.typing) load(); });
}

export async function show() { await load(); }

async function load() {
  [st.posts, st.events] = await Promise.all([repo.list('posts'), repo.list('events')]);
  draw();
}

function draw() {
  if (st.tab === 'dash') drawDash();
  else if (st.tab === 'report') drawReport();
  else drawRecord();
}

const evTitle = (p) => { const e = st.events.find((x) => x.id === p.eventId); return e ? e.fields.title : ''; };
const monthsWithPosts = () => [...new Set(st.posts.filter((p) => p.status === 'posted').map(postedDate).filter(Boolean).map(monthKey))].sort().reverse();

// ==================== 1) บันทึกผล ====================
function drawRecord() {
  const months = monthsWithPosts();
  const list = st.posts.filter((p) => p.status === 'posted' || (st.withApproved && p.status === 'approved'))
    .filter((p) => !st.recMonth || (postedDate(p) && monthKey(postedDate(p)) === st.recMonth))
    .sort((a, b) => (postedDate(b) || 0) - (postedDate(a) || 0));
  const missing = list.filter((p) => !hasMetrics(p)).length;
  setKids(st.rec,
    h('section.card', h('div.row.wrap',
      field('เดือน', select([['', 'ทุกเดือน'], ...months.map((m) => [m, monthLabel(m)])], st.recMonth, (v) => { st.recMonth = v; drawRecord(); })),
      h('label.check', h('input', { type: 'checkbox', checked: st.withApproved, onchange: (e) => { st.withApproved = e.target.checked; drawRecord(); } }), h('span', 'แสดงโพสต์ที่อนุมัติแล้วแต่ยังไม่ได้ตั้งว่าโพสต์แล้วด้วย')),
      h('span.spacer'),
      h('span.small' + (missing ? '.status-warn' : '.muted'), missing ? `ยังไม่ได้ใส่ผล ${missing} โพสต์` : `${list.length} โพสต์`)),
      h('div.hint', 'ใส่วันที่โพสต์แล้ว โพสต์จะถูกตั้งเป็น “โพสต์แล้ว” ให้อัตโนมัติ · Engagement = รีแอ็กชัน + คอมเมนต์ + แชร์ + คลิก')),
    list.length ? h('div.table-wrap.pr-rec', h('table.table',
      h('thead', h('tr', h('th', 'วันที่โพสต์'), h('th', 'เวลา'), h('th', 'โพสต์'), ...METRICS.map(([, t]) => h('th', t)), h('th', 'Engagement'), h('th', 'อัตรา'))),
      h('tbody', list.map(recordRow)))) : h('section.card', h('div.muted', 'ยังไม่มีโพสต์ที่โพสต์แล้ว — ในหน้า “งานทั้งหมด” หรือ “ปฏิทินโพสต์” เปลี่ยนสถานะโพสต์เป็น “โพสต์แล้ว” หรือติ๊กช่องด้านบนเพื่อแสดงโพสต์ที่อนุมัติแล้ว')));
}

function recordRow(p) {
  const d = postedDate(p);
  const iso = d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '';
  const tm = /T(\d{2}:\d{2})/.exec(String(p.postedAt || ''));
  const m = { ...(p.metrics || {}) };
  const engCell = h('td.num');
  const rateCell = h('td.num');
  const drawCalc = () => { engCell.textContent = hasMetrics({ metrics: m }) ? fmtNum(engagement(m)) : '–'; rateCell.textContent = fmtRate(rate(m)); };
  drawCalc();
  const state = { date: iso, time: tm ? tm[1] : '' };
  const save = debounce(async () => {
    const postedAt = state.date ? state.date + (state.time ? 'T' + state.time : '') : p.postedAt || '';
    st.typing = true;
    const saved = await repo.put('posts', { ...p, metrics: { ...m, updatedAt: new Date().toISOString() }, postedAt, status: state.date ? 'posted' : p.status });
    Object.assign(p, saved);
    st.typing = false;
  }, 500);
  const numIn = (k, label) => h('td', h('input.pr-numin', { type: 'number', min: 0, step: 1, inputmode: 'numeric', value: m[k] ?? '', 'aria-label': label, 'data-metric': k,
    oninput: (e) => { m[k] = e.target.value === '' ? '' : Math.max(0, +e.target.value); drawCalc(); save(); } }));
  return h('tr', { 'data-post': p.id },
    h('td', h('input', { type: 'date', value: iso, 'aria-label': 'วันที่โพสต์', oninput: (e) => { state.date = e.target.value; save(); } })),
    h('td', h('input', { type: 'time', value: state.time, 'aria-label': 'เวลาที่โพสต์', oninput: (e) => { state.time = e.target.value; save(); } })),
    h('td.pr-rec-post', h('button.linklike', { type: 'button', title: 'เปิดโพสต์', onclick: () => openPostEditor(st.app, p.id) },
      h('b', channelOf(p.channel).th), ' · ', kindOf(p.kind).th), h('div.muted.small.pr-snippet', evTitle(p) || String(p.text || '').split('\n')[0])),
    ...METRICS.map(([k, t]) => numIn(k, t)),
    engCell, rateCell);
}

// ==================== 2) Dashboard ====================
function periodRange() {
  if (st.period === 'all') return { from: '', to: '' };
  const ms = lastMonths(+st.period);
  return { from: ms[0], to: ms[ms.length - 1], months: ms };
}

function drawDash() {
  const r = periodRange();
  const posts = scope(st.posts, r);
  const sum = summary(posts);
  const metric = st.metric;
  const fmt = metric === 'avgRate' ? (v) => (v == null ? '–' : (v * 100).toFixed(1)) : fmtNum;
  const unit = metric === 'avgRate' ? '%' : '';
  const groups = Object.fromEntries(GROUP_KEYS.filter((g) => g !== 'kind').map((g) => [g, groupStats(posts, g, st.app.settings, metric).filter((x) => x[metric] != null)]));
  const insights = Object.entries(groups).map(([g, rows]) => insight(rows, g, metric)).filter(Boolean);
  const months = r.months || (() => { const all = monthsWithPosts().sort(); return all.length ? lastMonthsBetween(all[0], all[all.length - 1]) : []; })();
  const ppm = postsPerMonth(posts, st.by, months);
  setKids(st.dash,
    h('section.card', h('div.row.wrap',
      field('ช่วงเวลา', seg([['3', '3 เดือน'], ['6', '6 เดือน'], ['12', '12 เดือน'], ['all', 'ทั้งหมด']], st.period, (v) => { st.period = v; drawDash(); })),
      field('วัดผลด้วย', seg([['avgEng', 'Engagement เฉลี่ยต่อโพสต์'], ['avgRate', 'อัตรา Engagement ต่อ Reach']], metric, (v) => { st.metric = v; drawDash(); })))),
    h('div.pr-stats',
      statTile('โพสต์ที่โพสต์แล้ว', fmtNum(sum.posted), `มีตัวเลขผล ${sum.measured} โพสต์`),
      statTile('การเข้าถึงรวม', fmtNum(sum.reach)),
      statTile('Engagement รวม', fmtNum(sum.eng)),
      statTile('Engagement เฉลี่ย', fmtNum(sum.avgEng), 'ต่อโพสต์'),
      statTile('อัตราเฉลี่ย', fmtRate(sum.avgRate), 'Engagement ÷ Reach')),
    h('section.card', h('h3.card-title', icon('bulb'), 'สรุปอัตโนมัติ'),
      insights.length ? h('ul.pr-insights', insights.map((t) => h('li', t))) : h('div.muted.small', 'ยังมีข้อมูลน้อยเกินไปสำหรับสรุป — ต้องมีอย่างน้อย 2 กลุ่ม กลุ่มละ 2 โพสต์ขึ้นไป'),
      h('div.hint', 'ตัวเลขในวงเล็บคือจำนวนโพสต์ กลุ่มที่มีน้อยกว่า 2 โพสต์ยังสรุปไม่ได้')),
    h('div.pr-viz-grid', Object.entries(groups).map(([g, rows]) => barList({
      title: `${groupLabel(g)}`, unit,
      rows: rows.map((x) => ({ label: x.label, value: metric === 'avgRate' ? x.avgRate : x.avgEng, n: x.n })),
      format: fmt,
      empty: g === 'time' ? 'ยังไม่มีข้อมูล — ใส่เวลาที่โพสต์ในแท็บ “บันทึกผล”' : 'ยังไม่มีโพสต์ที่มีตัวเลขผล',
    }))),
    h('div.row.wrap', h('span.field-label', 'โพสต์ต่อเดือน แยกตาม'), seg([['channel', 'ช่องทาง'], ['kind', 'ประเภทโพสต์']], st.by, (v) => { st.by = v; drawDash(); })),
    stackedColumns({ title: `จำนวนโพสต์ต่อเดือน (แยกตาม${st.by === 'channel' ? 'ช่องทาง' : 'ประเภทโพสต์'})`, labels: ppm.months.map((m) => monthLabel(m, true)), series: ppm.series }));
}

function lastMonthsBetween(a, b) {
  const out = [];
  let y = +a.slice(0, 4), m = +a.slice(5, 7);
  while (`${y}-${String(m).padStart(2, '0')}` <= b && out.length < 36) { out.push(`${y}-${String(m).padStart(2, '0')}`); m++; if (m > 12) { m = 1; y++; } }
  return out;
}

// ==================== 3) รายงานรายเดือน ====================
function drawReport() {
  const months = monthsWithPosts();
  if (!st.repMonth || !months.includes(st.repMonth)) st.repMonth = months[0] || monthKey(new Date());
  const month = st.repMonth;
  const rows = monthRows(st.posts, st.events, month);
  const posts = scope(st.posts, { from: month, to: month });
  const sum = summary(posts);
  const byCh = groupStats(posts, 'channel', st.app.settings);
  const byKind = postsPerMonth(posts, 'kind', [month]).series.map((x) => ({ label: x.label, value: x.values[0], n: x.values[0] })).sort((a, b) => b.value - a.value);
  setKids(st.rep,
    h('section.card', h('div.row.wrap',
      field('เดือน', select(months.length ? months.map((m) => [m, monthLabel(m)]) : [[month, monthLabel(month)]], month, (v) => { st.repMonth = v; drawReport(); })),
      h('span.spacer'),
      btn('ส่งออก CSV', () => exportCsv(rows, month), { ic: 'download' }),
      btn('พิมพ์ / บันทึกเป็น PDF', () => printReport(rows, sum, byCh, byKind, month), { ic: 'file', kind: 'primary' }))),
    h('div.pr-stats',
      statTile('โพสต์', fmtNum(sum.posted), `มีตัวเลขผล ${sum.measured}`),
      statTile('การเข้าถึงรวม', fmtNum(sum.reach)),
      statTile('Engagement รวม', fmtNum(sum.eng)),
      statTile('อัตราเฉลี่ย', fmtRate(sum.avgRate))),
    h('div.pr-viz-grid',
      barList({ title: 'Engagement เฉลี่ยตามช่องทาง', rows: byCh.map((x) => ({ label: x.label, value: x.avgEng, n: x.n })) }),
      barList({ title: 'จำนวนโพสต์ตามประเภท', rows: byKind, format: fmtNum, unit: ' โพสต์' })),
    rows.length ? h('section.card', h('h3.card-title', icon('table'), `โพสต์ทั้งหมดใน${monthLabel(month)}`),
      h('div.table-wrap', reportTable(rows))) : h('section.card', h('div.muted', 'ไม่มีโพสต์ในเดือนนี้')));
}

function cellOf(r, k) {
  if (k === 'rate') return fmtRate(r.rate);
  if (['reach', 'reactions', 'comments', 'shares', 'clicks', 'eng'].includes(k)) return r.measured ? fmtNum(r[k]) : '–';
  return r[k];
}
function reportTable(rows) {
  return h('table.table.pr-report',
    h('thead', h('tr', REPORT_COLS.map(([, t]) => h('th', t)))),
    h('tbody', rows.map((r) => h('tr', REPORT_COLS.map(([k]) => h('td' + (['reach', 'reactions', 'comments', 'shares', 'clicks', 'eng', 'rate'].includes(k) ? '.num' : ''), cellOf(r, k)))))));
}

function exportCsv(rows, month) {
  const head = REPORT_COLS.map(([, t]) => t);
  const data = rows.map((r) => Object.fromEntries(REPORT_COLS.map(([k, t]) => [t, k === 'rate' ? (r.rate == null ? '' : (r.rate * 100).toFixed(2)) : ['reach', 'reactions', 'comments', 'shares', 'clicks', 'eng'].includes(k) && !r.measured ? '' : r[k]])));
  download(new Blob([toCsv(data, head)], { type: 'text/csv;charset=utf-8' }), `รายงานประชาสัมพันธ์-${month}.csv`);
}

// หน้าพิมพ์: เปิดหน้าต่างใหม่ที่มีเฉพาะรายงาน แล้วสั่งพิมพ์ (เลือก “บันทึกเป็น PDF” ได้)
function printReport(rows, sum, byCh, byKind, month) {
  const w = window.open('', '_blank');
  if (!w) return toast('เบราว์เซอร์บล็อกหน้าต่างใหม่ — อนุญาตป๊อปอัปแล้วลองอีกครั้ง', 'warn', 5000);
  const esc = (x) => String(x ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const bars = (title, list, fmt = fmtNum, unit = '') => {
    const max = Math.max(1, ...list.map((x) => x.value || 0));
    return `<section class="box"><h3>${esc(title)}</h3>${list.length ? list.map((x, i) => `<div class="bar"><span class="bl">${esc(x.label)} <small>(${x.n})</small></span><span class="bt"><span class="bf${i === 0 ? ' best' : ''}" style="width:${Math.max(1.5, (x.value / max) * 100)}%"></span></span><span class="bv">${esc(fmt(x.value))}${unit}</span></div>`).join('') : '<p class="muted">ยังไม่มีข้อมูล</p>'}</section>`;
  };
  const html = `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>รายงานประชาสัมพันธ์ ${esc(monthLabel(month))}</title>
<link rel="stylesheet" href="${location.origin}/vendor/fonts/fonts.css">
<style>
  @page { size: A4; margin: 14mm; }
  body { font: 13px/1.5 'Sarabun', 'Leelawadee UI', sans-serif; color: #1b1f27; margin: 0; }
  h1 { font: 600 20px/1.3 'Prompt', 'Sarabun', sans-serif; margin: 0 0 2px; } h3 { font: 600 14px 'Prompt', 'Sarabun', sans-serif; margin: 0 0 8px; }
  .muted, small { color: #5d6676; } .sub { color: #5d6676; margin-bottom: 14px; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
  .stat { border: 1px solid #dde1e8; border-radius: 8px; padding: 8px 10px; } .stat b { display: block; font-size: 18px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
  .box { border: 1px solid #dde1e8; border-radius: 8px; padding: 10px 12px; break-inside: avoid; }
  .bar { display: grid; grid-template-columns: 38% 1fr 64px; align-items: center; gap: 8px; margin: 4px 0; }
  .bt { background: #f0f2f6; border-radius: 4px; height: 8px; display: block; } .bf { display: block; height: 8px; border-radius: 0 4px 4px 0; background: #9aa3b4; } .bf.best { background: #257de0; }
  .bv { text-align: right; font-variant-numeric: tabular-nums; }
  table { width: 100%; border-collapse: collapse; font-size: 11.5px; } th, td { border-bottom: 1px solid #dde1e8; padding: 4px 6px; text-align: left; vertical-align: top; }
  th { background: #f0f2f6; } td.num { text-align: right; font-variant-numeric: tabular-nums; } tr { break-inside: avoid; }
  .foot { margin-top: 10px; color: #5d6676; font-size: 11px; }
</style></head><body>
<h1>รายงานผลการประชาสัมพันธ์ ประจำเดือน${esc(monthLabel(month))}</h1>
<div class="sub">${esc(st.app.style.facultyTh || 'คณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์')} · จัดทำเมื่อ ${esc(fmtDate(new Date().toISOString().slice(0, 10), 'th'))}</div>
<div class="stats">
  <div class="stat"><small>โพสต์</small><b>${fmtNum(sum.posted)}</b><small>มีตัวเลขผล ${sum.measured}</small></div>
  <div class="stat"><small>การเข้าถึงรวม</small><b>${fmtNum(sum.reach)}</b></div>
  <div class="stat"><small>Engagement รวม</small><b>${fmtNum(sum.eng)}</b></div>
  <div class="stat"><small>อัตราเฉลี่ย</small><b>${fmtRate(sum.avgRate)}</b></div>
</div>
<div class="grid">${bars('Engagement เฉลี่ยตามช่องทาง', byCh.map((x) => ({ label: x.label, value: x.avgEng, n: x.n })))}${bars('จำนวนโพสต์ตามประเภท', byKind, fmtNum, ' โพสต์')}</div>
<table><thead><tr>${REPORT_COLS.map(([, t]) => `<th>${esc(t)}</th>`).join('')}</tr></thead><tbody>
${rows.map((r) => `<tr>${REPORT_COLS.map(([k]) => `<td${['reach', 'reactions', 'comments', 'shares', 'clicks', 'eng', 'rate'].includes(k) ? ' class="num"' : ''}>${esc(cellOf(r, k))}</td>`).join('')}</tr>`).join('')}
</tbody></table>
<div class="foot">Engagement = รีแอ็กชัน + คอมเมนต์ + แชร์ + คลิก · อัตรา = Engagement ÷ Reach · สร้างจาก L'Arts PR Writer (M Hub)</div>
<script>document.fonts.ready.then(() => setTimeout(() => print(), 300));<\/script>
</body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
