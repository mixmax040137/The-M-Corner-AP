// หน้า “งานทั้งหมด”: รายการงาน + โพสต์ของแต่ละงาน (ร่าง / อนุมัติแล้ว / โพสต์แล้ว)
import { h, setKids, btn, select, toast, copyText, confirmBox, text } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { repo } from './db.js';
import { KINDS, CHANNELS, LANGS, eventTypeOf, kindOf, channelOf, toneOf } from './fields.js';
import { fmtRange, todayISO } from './dates.js';

const STATUS = [['draft', 'ร่าง'], ['approved', 'อนุมัติแล้ว'], ['posted', 'โพสต์แล้ว']];
let st;

export async function mount(el, app) {
  st = { app, q: '', when: 'all', open: new Set() };
  st.list = h('div.pr-list');
  el.append(
    h('section.card',
      h('div.row.wrap',
        h('div', { style: { flex: '1', minWidth: '200px' } }, text('', (v) => { st.q = v.trim(); draw(); }, { placeholder: 'ค้นหาชื่องาน สถานที่ ผู้จัด…', 'aria-label': 'ค้นหางาน' })),
        select([['all', 'ทุกงาน'], ['upcoming', 'งานที่กำลังจะถึง'], ['past', 'งานที่ผ่านไปแล้ว']], st.when, (v) => { st.when = v; draw(); }),
        btn('งานใหม่', () => app.go('compose', { e: '' }), { ic: 'plus', kind: 'primary' }))),
    st.list);
  repo.onChange((t) => { if (['events', 'posts', '*'].includes(t)) draw(); });
}

export async function show() { await draw(); }

async function draw() {
  const [events, posts] = await Promise.all([repo.list('events'), repo.list('posts')]);
  const today = todayISO();
  const q = st.q.toLowerCase();
  const shown = events
    .filter((e) => !q || [e.fields.title, e.fields.titleEn, e.fields.place, e.fields.organizer].some((x) => String(x || '').toLowerCase().includes(q)))
    .filter((e) => st.when === 'all' || (st.when === 'upcoming' ? (e.fields.endDate || e.fields.date || '9999') >= today : (e.fields.endDate || e.fields.date || '9999') < today))
    .sort((a, b) => String(b.fields.date || '').localeCompare(String(a.fields.date || '')));
  if (!shown.length) {
    setKids(st.list, h('div.note', events.length ? 'ไม่พบงานที่ค้นหา' : 'ยังไม่มีงาน กด “งานใหม่” เพื่อเริ่ม'));
    return;
  }
  setKids(st.list, ...shown.map((e) => eventCard(e, posts.filter((p) => p.eventId === e.id))));
}

function eventCard(e, posts) {
  const f = e.fields;
  const isOpen = st.open.has(e.id);
  const toggle = () => { if (isOpen) st.open.delete(e.id); else st.open.add(e.id); draw(); };
  const counts = STATUS.map(([k, t]) => [t, posts.filter((p) => p.status === k).length]).filter(([, n]) => n);
  return h('section.card.pr-event', { 'data-event': e.id },
    h('div.row.wrap.top',
      h('div', { style: { flex: '1', minWidth: '240px' } },
        h('h3.card-title', f.title || '(ไม่มีชื่องาน)', e.sample ? h('span.badge', 'ข้อมูลตัวอย่าง') : null),
        h('div.muted.small', [eventTypeOf(f.eventType).label, f.date ? fmtRange(f.date, f.endDate, 'th') : 'ยังไม่ระบุวันที่', f.place].filter(Boolean).join(' · ')),
        counts.length ? h('div.chips', { style: { marginTop: '6px' } }, counts.map(([t, n]) => h('span.tag', `${t} ${n}`))) : null),
      h('div.row.wrap',
        btn('เขียนโพสต์', () => st.app.go('compose', { e: e.id }), { ic: 'pen', kind: 'primary sm' }),
        btn(isOpen ? 'ซ่อนโพสต์' : `โพสต์ (${posts.length})`, toggle, { ic: isOpen ? 'up' : 'down', kind: 'sm' }),
        btn('', async () => {
          const copy = await repo.put('events', { fields: { ...structuredClone(f), title: (f.title || 'งาน') + ' (สำเนา)' }, kind: e.kind, versionNo: 1, sample: false });
          toast('ทำสำเนาแล้ว', 'ok');
          st.app.go('compose', { e: copy.id });
        }, { ic: 'copy', kind: 'icon-only sm', title: 'ทำสำเนางาน' }),
        btn('', async () => {
          if (!(await confirmBox(`ลบงาน “${f.title || 'ไม่มีชื่อ'}” และโพสต์ของงานนี้?`, { ok: 'ลบ', danger: true }))) return;
          for (const p of posts) await repo.remove('posts', p.id);
          await repo.remove('events', e.id);
          toast('ลบแล้ว');
        }, { ic: 'trash', kind: 'icon-only sm', title: 'ลบงาน' }))),
    isOpen ? postList(posts) : null);
}

function postList(posts) {
  if (!posts.length) return h('div.muted.small', 'ยังไม่มีโพสต์ที่บันทึกไว้ — กด “บันทึกร่าง” หรือ “ใช้จริง” ในหน้าเขียนโพสต์');
  return h('div.pr-posts', posts.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).map((p) => h('div.list-item.pr-post', { 'data-post': p.id },
    h('div', { style: { flex: '1', minWidth: '0' } },
      h('div.small', h('b', kindOf(p.kind).th), ` · ${channelOf(p.channel).th} · ${(LANGS.find((l) => l.id === p.lang) || {}).th || ''} · โทน${toneOf(p.tone, st.app.settings.customTones).th}`),
      h('div.muted.small.pr-snippet', String(p.subject ? p.subject + ' — ' : '') + String(p.text || '').split('\n').slice(0, 2).join(' '))),
    select(STATUS, p.status, async (v) => {
      await repo.put('posts', { ...p, status: v, approvedAt: v !== 'draft' ? p.approvedAt || new Date().toISOString() : p.approvedAt, postedAt: v === 'posted' ? p.postedAt || new Date().toISOString() : p.postedAt });
      toast('อัปเดตสถานะแล้ว', 'ok', 1500);
    }),
    btn('', () => copyText(p.text), { ic: 'copy', kind: 'icon-only sm', title: 'คัดลอกข้อความ' }),
    btn('', async () => { if (await confirmBox('ลบโพสต์นี้?', { ok: 'ลบ', danger: true })) await repo.remove('posts', p.id); }, { ic: 'trash', kind: 'icon-only sm', title: 'ลบโพสต์' }))));
}
