// ปฏิทินโพสต์: มุมมองเดือน / รายการ สถานะ ร่าง · อนุมัติแล้ว · โพสต์แล้ว + สร้างชุดโพสต์ของงาน
import { h, setKids, btn, select, seg } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { repo } from './db.js';
import { kindOf, channelOf } from './fields.js';
import { TH_MONTHS } from '../core/thai.js';
import { fmtDate, todayISO, toISO } from './dates.js';
import { stageOf } from './campaign.js';
import { openCampaign, openPostEditor, STATUS } from './ui-campaign.js';

const TH_DOW = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
let st;

export async function mount(el, app) {
  const t = todayISO();
  st = { app, el, month: t.slice(0, 7), view: matchMedia('(max-width: 760px)').matches ? 'list' : 'month', status: 'all', posts: [], events: [] };
  st.head = h('section.card');
  st.body = h('div.pr-stack');
  el.append(st.head, st.body);
  repo.onChange((t2) => { if (['posts', 'events', '*'].includes(t2) && !el.hidden) load(); });
}

export async function show(params = {}) {
  if (params.m && /^\d{4}-\d{2}$/.test(params.m)) st.month = params.m;
  await load();
}

async function load() {
  [st.posts, st.events] = await Promise.all([repo.list('posts'), repo.list('events')]);
  draw();
}

const postDate = (p) => p.plannedDate || (p.postedAt || '').slice(0, 10);
const monthLabel = (m) => `${TH_MONTHS[+m.slice(5, 7) - 1]} ${+m.slice(0, 4) + 543}`;
function shiftMonth(m, n) { const d = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1 + n, 1); return toISO(d).slice(0, 7); }

function draw() {
  const evSel = select([['', '— เลือกงาน —'], ...st.events.filter((e) => e.fields.date).sort((a, b) => b.fields.date.localeCompare(a.fields.date)).map((e) => [e.id, e.fields.title || '(ไม่มีชื่อ)'])], '', () => {});
  evSel.setAttribute('aria-label', 'งานสำหรับสร้างชุดโพสต์');
  setKids(st.head,
    h('div.row.wrap',
      btn('', () => { st.month = shiftMonth(st.month, -1); draw(); }, { ic: 'left', kind: 'icon-only', title: 'เดือนก่อน' }),
      h('h3.pr-month', monthLabel(st.month)),
      btn('', () => { st.month = shiftMonth(st.month, 1); draw(); }, { ic: 'right', kind: 'icon-only', title: 'เดือนถัดไป' }),
      btn('เดือนนี้', () => { st.month = todayISO().slice(0, 7); draw(); }, { kind: 'ghost sm' }),
      h('span.spacer'),
      seg([['month', 'เดือน'], ['list', 'รายการ']], st.view, (v) => { st.view = v; draw(); }),
      seg([['all', 'ทั้งหมด'], ...STATUS], st.status, (v) => { st.status = v; draw(); })),
    h('div.row.wrap', h('span.field-label', 'สร้างชุดโพสต์ 5 ชิ้นให้งาน'), h('div', { style: { minWidth: '220px', flex: '1' } }, evSel),
      btn('สร้างชุดโพสต์', () => { if (!evSel.value) return evSel.focus(); openCampaign(st.app, evSel.value); }, { ic: 'calendar', kind: 'primary' })));
  const posts = st.posts.filter((p) => st.status === 'all' || p.status === st.status);
  const inMonth = posts.filter((p) => postDate(p).startsWith(st.month));
  const undated = posts.filter((p) => !postDate(p));
  setKids(st.body,
    st.view === 'month' ? monthGrid(inMonth) : listView(inMonth),
    undated.length ? h('section.card', h('h3.card-title', icon('list'), `ยังไม่กำหนดวันโพสต์ (${undated.length})`), h('div.field-list', undated.map((p) => listRow(p)))) : null,
    h('div.row.wrap.pr-legend', h('span.muted.small', 'สถานะ:'), ...STATUS.map(([k, t]) => h('span.pr-chip.' + k, t)), h('span.pr-cal-ev', 'วันจัดงาน')));
}

function chip(p) {
  const ev = st.events.find((e) => e.id === p.eventId);
  const what = p.stage ? stageOf(p.stage).th : kindOf(p.kind).th;
  return h('button.pr-chip.' + (p.status || 'draft'), { type: 'button', 'data-post': p.id, title: `${ev ? ev.fields.title + ' · ' : ''}${what} · ${channelOf(p.channel).th}`, onclick: () => openPostEditor(st.app, p.id) },
    `${channelOf(p.channel).th} · ${what}`);
}

function eventsOn(iso) {
  return st.events.filter((e) => e.fields.date && e.fields.date <= iso && iso <= (e.fields.endDate || e.fields.date));
}

function monthGrid(posts) {
  const [y, m] = st.month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const today = todayISO();
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (i >= 35 && d.getMonth() !== m - 1) break;
    const iso = toISO(d);
    cells.push(h('div.pr-cal-cell' + (d.getMonth() !== m - 1 ? '.out' : '') + (iso === today ? '.today' : ''), { 'data-date': iso },
      h('div.pr-cal-day', d.getDate()),
      ...eventsOn(iso).map((e) => h('div.pr-cal-ev', { title: e.fields.title }, e.fields.title || 'งาน')),
      ...posts.filter((p) => postDate(p) === iso).map(chip)));
  }
  return h('section.card.pr-cal', h('div.pr-cal-grid', ...TH_DOW.map((d) => h('div.pr-cal-dow', d)), ...cells));
}

function listRow(p) {
  const ev = st.events.find((e) => e.id === p.eventId);
  return h('div.list-item', { 'data-post': p.id },
    h('div', { style: { flex: '1', minWidth: '0' } },
      h('div', chip(p), ' ', h('b.small', ev ? ev.fields.title : '')),
      h('div.muted.small.pr-snippet', String(p.text || '').split('\n')[0])),
    btn('เปิด', () => openPostEditor(st.app, p.id), { kind: 'sm' }));
}

function listView(posts) {
  if (!posts.length) return h('section.card', h('div.muted', 'ไม่มีโพสต์ในเดือนนี้ — เลือกงานด้านบนแล้วกด “สร้างชุดโพสต์” หรือกำหนดวันโพสต์ในหน้าเขียนโพสต์'));
  const byDate = new Map();
  for (const p of posts.sort((a, b) => postDate(a).localeCompare(postDate(b)))) {
    const d = postDate(p);
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d).push(p);
  }
  return h('div.pr-stack', [...byDate].map(([d, list]) => h('section.card', { 'data-date': d },
    h('h3.card-title', icon('calendar'), fmtDate(d, 'th'), ...eventsOn(d).map((e) => h('span.pr-cal-ev', e.fields.title))),
    h('div.field-list', list.map(listRow)))));
}
