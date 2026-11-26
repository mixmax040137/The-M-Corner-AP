// หน้าภาพรวม: งานที่กำลังจะถึง + คำแนะนำว่าควรโพสต์อะไร (คำนวณจากวันที่ ไม่ใช้ AI)
import { h, setKids, btn, toast, confirmBox } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { repo } from './db.js';
import { eventTypeOf, kindOf, channelOf } from './fields.js';
import { fmtRange, todayISO, addDays } from './dates.js';

let st;

export async function mount(el, app) {
  st = { app, box: h('div.pr-stack') };
  el.append(st.box);
  repo.onChange((t) => { if (['events', 'posts', '*'].includes(t) && !el.hidden) draw(); });
}

export async function show() { await draw(); }

// คำแนะนำโพสต์ของงานหนึ่ง
function suggestions(e, posts, today) {
  const f = e.fields;
  const out = [];
  const has = (k) => posts.some((p) => p.kind === k);
  const start = f.date, end = f.endDate || f.date;
  if (!start) return out;
  if (end < today) { if (!has('recap') && end >= addDays(today, -14)) out.push(['recap', 'งานจบแล้ว — ทำโพสต์สรุปกิจกรรม']); return out; }
  if (!has('invite') && e.kind !== 'meeting' && f.eventType !== 'meeting') out.push(['invite', 'ยังไม่มีโพสต์เชิญร่วมงาน']);
  if ((e.kind === 'meeting' || f.eventType === 'meeting') && !has('meeting')) out.push(['meeting', 'ยังไม่มีหนังสือเชิญประชุม']);
  if (f.deadline && f.deadline >= today && f.deadline <= addDays(today, 3) && !has('reminder')) out.push(['reminder', 'ใกล้ปิดรับลงทะเบียน — โพสต์เตือน']);
  if (start === addDays(today, 1)) out.push(['reminder', 'งานพรุ่งนี้ — โพสต์ย้ำ 1 วันก่อนงาน']);
  if (start === today) out.push(['invite', 'งานวันนี้ — โพสต์วันงาน']);
  return out;
}

async function draw() {
  const [events, posts] = await Promise.all([repo.list('events'), repo.list('posts')]);
  const today = todayISO();
  const upcoming = events.filter((e) => (e.fields.endDate || e.fields.date || '') >= today).sort((a, b) => a.fields.date.localeCompare(b.fields.date));
  const recentPast = events.filter((e) => e.fields.date && (e.fields.endDate || e.fields.date) < today && (e.fields.endDate || e.fields.date) >= addDays(today, -14));
  const samples = events.filter((e) => e.sample).length;
  const todo = [...upcoming, ...recentPast].flatMap((e) => suggestions(e, posts.filter((p) => p.eventId === e.id), today).map((s) => [e, ...s]));
  const card = (e) => h('div.list-item', { 'data-event': e.id },
    h('div', { style: { flex: '1', minWidth: '0' } },
      h('div', h('b', e.fields.title || '(ไม่มีชื่อ)'), e.sample ? h('span.badge', 'ตัวอย่าง') : null),
      h('div.muted.small', [fmtRange(e.fields.date, e.fields.endDate, 'th'), eventTypeOf(e.fields.eventType).label].filter(Boolean).join(' · '))),
    btn('ชุดโพสต์', async () => (await import('./ui-campaign.js')).openCampaign(st.app, e.id), { ic: 'calendar', kind: 'ghost sm', title: 'สร้างชุดโพสต์ 5 ชิ้นลงปฏิทิน' }),
    btn('เขียนโพสต์', () => st.app.go('compose', { e: e.id }), { ic: 'pen', kind: 'sm' }));
  setKids(st.box, 
    samples ? h('div.note.info', h('div.row.wrap', h('span', `มีงานตัวอย่าง ${samples} งาน (ชื่อบุคคลและลิงก์สมมติ) ไว้ให้ลองใช้ เปิดหน้า “เขียนโพสต์” ได้เลย`), h('span.spacer'),
      btn('ลบข้อมูลตัวอย่าง', async () => {
        if (!(await confirmBox('ลบงานและโพสต์ตัวอย่างทั้งหมด?', { ok: 'ลบ', danger: true }))) return;
        await repo.removeSamples();
        toast('ลบข้อมูลตัวอย่างแล้ว', 'ok');
      }, { kind: 'sm' }))) : null,
    h('div.facts',
      fact('pen', 'โหมดเทมเพลต 0 token', '9 ประเภท × 5 โทน × 8 ช่องทาง ไทย/อังกฤษ'),
      fact('shield', 'ตัวตรวจก่อนโพสต์', 'วันกับวันที่ พ.ศ./ค.ศ. ลิงก์ คำต้องห้าม'),
      fact('save', 'ข้อมูลอยู่ในเครื่อง', 'ส่งออก/นำเข้าเป็นไฟล์เดียว ย้ายเครื่องได้')),
    h('div.row.wrap',
      btn('เขียนโพสต์ใหม่', () => st.app.go('compose', { e: '' }), { ic: 'plus', kind: 'primary big' }),
      btn('งานทั้งหมด', () => st.app.go('events'), { ic: 'calendar' })),
    h('section.card', h('h3.card-title', icon('bulb'), 'ควรโพสต์อะไรต่อ'),
      todo.length ? h('div.field-list', todo.map(([e, kind, why]) => h('div.list-item',
        h('div', { style: { flex: '1', minWidth: '0' } }, h('b', why), h('div.muted.small', e.fields.title)),
        btn(kindOf(kind).th, () => st.app.go('compose', { e: e.id, k: kind }), { ic: 'pen', kind: 'sm primary' }))))
        : h('div.muted.small', 'ยังไม่มีคำแนะนำ — เพิ่มวันที่และวันปิดรับลงทะเบียนในข้อมูลงาน ระบบจะเตือนให้เอง')),
    h('section.card', h('h3.card-title', icon('calendar'), 'งานที่กำลังจะถึง'),
      upcoming.length ? h('div.field-list', upcoming.slice(0, 8).map(card)) : h('div.muted.small', 'ยังไม่มีงานที่กำลังจะถึง')),
    h('section.card', h('h3.card-title', icon('list'), 'โพสต์ล่าสุด'),
      posts.length ? h('div.field-list', posts.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, 5).map((p) => h('div.list-item',
        h('div', { style: { flex: '1', minWidth: '0' } }, h('b', kindOf(p.kind).th), h('span.muted.small', ` · ${channelOf(p.channel).th} · ${{ draft: 'ร่าง', approved: 'อนุมัติแล้ว', posted: 'โพสต์แล้ว' }[p.status] || ''}`),
          h('div.muted.small.pr-snippet', String(p.text || '').split('\n')[0]))))) : h('div.muted.small', 'ยังไม่มีโพสต์ที่บันทึก')));
}

const fact = (ic, t, d) => h('div.fact', icon(ic), h('div', h('b', t), h('div.muted.small', d)));
