// คลังโพสต์ที่ใช้จริง: ค้นหา/กรอง ติดแท็ก เลือกว่าจะใช้เป็นตัวอย่างให้ AI หรือไม่ ใช้ซ้ำเป็นเทมเพลต และเพิ่มโพสต์เก่าที่เคยโพสต์
import { h, setKids, btn, field, select, toast, copyText, confirmBox, text } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { repo } from './db.js';
import { KINDS, TONES, LANGS, CHANNELS, EVENT_TYPES, kindOf, channelOf, toneOf } from './fields.js';
import { isLibrary, postToTemplate } from './library.js';
import { openPostEditor } from './ui-campaign.js';

let st;

export async function mount(el, app) {
  st = { app, q: '', kind: '', channel: '', source: '', list: h('div.pr-stack'), count: h('span.muted.small') };
  const add = { kind: 'invite', channel: 'facebook', tone: 'semi', lang: 'th', eventType: 'seminar', text: '' };
  const addText = h('textarea', { rows: 5, 'aria-label': 'ข้อความโพสต์เก่า', placeholder: 'วางข้อความโพสต์ที่คณะเคยโพสต์และชอบสำนวน', oninput: (e) => { add.text = e.target.value; } });
  el.append(
    h('p.intro', 'โพสต์ที่กด “ใช้จริง” (ฉบับที่แก้แล้ว) และโพสต์ที่สถานะ “โพสต์แล้ว” จะอยู่ที่นี่ เวลาให้ AI เขียน ระบบเลือกโพสต์ที่คล้ายที่สุดไม่เกิน 3 โพสต์ตามแท็กและคำที่ใกล้กันส่งไปเป็นตัวอย่าง (ไม่ส่งทั้งคลัง)'),
    h('section.card',
      h('div.row.wrap',
        h('div', { style: { flex: '1', minWidth: '200px' } }, text('', (v) => { st.q = v.trim().toLowerCase(); draw(); }, { placeholder: 'ค้นหาข้อความหรือแท็ก…', 'aria-label': 'ค้นหาในคลังโพสต์' })),
        select([['', 'ทุกประเภท'], ...KINDS.map((k) => [k.id, k.th])], '', (v) => { st.kind = v; draw(); }),
        select([['', 'ทุกช่องทาง'], ...CHANNELS.map((c) => [c.id, c.th])], '', (v) => { st.channel = v; draw(); }),
        select([['', 'ทุกที่มา'], ['template', 'จากเทมเพลต'], ['ai', 'จาก AI'], ['manual', 'เพิ่มเอง']], '', (v) => { st.source = v; draw(); }),
        st.count)),
    st.list,
    h('details.card.pr-source',
      h('summary', h('b', 'เพิ่มโพสต์ที่เคยโพสต์เข้าคลัง'), h('span.muted.small', ' — ให้ AI เรียนสำนวนของคณะจากโพสต์เก่า')),
      h('div.grid4',
        field('ประเภท', select(KINDS.map((k) => [k.id, k.th]), add.kind, (v) => { add.kind = v; })),
        field('ช่องทาง', select(CHANNELS.map((c) => [c.id, c.th]), add.channel, (v) => { add.channel = v; })),
        field('โทน', select(TONES.map((t) => [t.id, t.th]), add.tone, (v) => { add.tone = v; })),
        field('ภาษา', select(LANGS.map((l) => [l.id, l.th]), add.lang, (v) => { add.lang = v; }))),
      field('ประเภทงาน', select(EVENT_TYPES.map((t) => [t.id, t.label]), add.eventType, (v) => { add.eventType = v; })),
      addText,
      h('div.row', btn('เพิ่มเข้าคลัง', async () => {
        if (!add.text.trim()) return toast('วางข้อความก่อน', 'warn');
        await repo.put('posts', { ...add, text: add.text.trim(), subject: '', status: 'posted', source: 'manual', metrics: {}, tags: [] });
        addText.value = ''; add.text = '';
        toast('เพิ่มเข้าคลังแล้ว', 'ok');
      }, { ic: 'plus', kind: 'primary' }))));
  repo.onChange((t) => { if (['posts', '*'].includes(t) && !el.hidden) draw(); });
}

export async function show() { await draw(); }

async function draw() {
  const [posts, events] = await Promise.all([repo.list('posts'), repo.list('events')]);
  const lib = posts.filter(isLibrary)
    .filter((p) => (!st.kind || p.kind === st.kind) && (!st.channel || p.channel === st.channel) && (!st.source || (p.source || 'template') === st.source))
    .filter((p) => !st.q || [p.text, p.subject, ...(p.tags || [])].some((x) => String(x || '').toLowerCase().includes(st.q)))
    .sort((a, b) => String(b.approvedAt || b.updatedAt).localeCompare(String(a.approvedAt || a.updatedAt)));
  st.count.textContent = `${lib.length} โพสต์`;
  setKids(st.list, lib.length ? lib.map((p) => item(p, events.find((e) => e.id === p.eventId))) : h('section.card', h('div.muted', 'ยังไม่มีโพสต์ในคลัง — กด “ใช้จริง” ในหน้าเขียนโพสต์ หรือเพิ่มโพสต์เก่าด้านล่าง')));
}

function item(p, ev) {
  const tagInput = h('input', { type: 'text', placeholder: '+ แท็ก', 'aria-label': 'เพิ่มแท็ก', onkeydown: async (e) => {
    if (e.key !== 'Enter' || !e.target.value.trim()) return;
    await repo.put('posts', { ...p, tags: [...new Set([...(p.tags || []), e.target.value.trim()])] });
  } });
  const src = { ai: 'AI', manual: 'เพิ่มเอง', template: 'เทมเพลต' }[p.source || 'template'];
  return h('section.card.pr-lib-item', { 'data-post': p.id },
    h('div.row.wrap',
      h('b', kindOf(p.kind).th), h('span.muted.small', [channelOf(p.channel).th, (LANGS.find((l) => l.id === p.lang) || {}).th, 'โทน' + toneOf(p.tone, st.app.settings.customTones).th, src, ev ? ev.fields.title : ''].filter(Boolean).join(' · ')),
      p.sample ? h('span.badge', 'ตัวอย่าง') : null, h('span.spacer'),
      h('label.check', h('input', { type: 'checkbox', checked: !p.noExample, onchange: async (e) => { await repo.put('posts', { ...p, noExample: !e.target.checked }); } }), h('span.small', 'ใช้เป็นตัวอย่างให้ AI'))),
    p.subject ? h('div.small', h('b', 'หัวเรื่อง: '), p.subject) : null,
    h('pre.pr-pre', p.text),
    h('div.pr-tags', ...(p.tags || []).map((t) => h('span.pr-tag', t, h('button', { type: 'button', title: 'ลบแท็ก', onclick: async () => { await repo.put('posts', { ...p, tags: (p.tags || []).filter((x) => x !== t) }); } }, '×'))), tagInput),
    h('div.row.wrap',
      btn('คัดลอก', () => copyText(p.text), { ic: 'copy', kind: 'sm' }),
      btn('ใช้เป็นเทมเพลต', () => toTemplate(p, ev), { ic: 'file', kind: 'sm' }),
      btn('เปิด / แก้', () => openPostEditor(st.app, p.id), { ic: 'pen', kind: 'ghost sm' }),
      h('span.spacer'),
      btn('เอาออกจากคลัง', async () => {
        if (!(await confirmBox('เอาโพสต์นี้ออกจากคลัง? (เปลี่ยนสถานะกลับเป็นร่าง)', { ok: 'เอาออก' }))) return;
        await repo.put('posts', { ...p, status: 'draft' });
      }, { kind: 'ghost sm' })));
}

async function toTemplate(p, ev) {
  const lang = p.lang === 'en' ? 'en' : 'th';
  const body = postToTemplate(p.text, ev && ev.fields, lang, p.kind);
  const first = String(p.text || '').split('\n')[0].slice(0, 40);
  await repo.put('templates', { name: 'จากคลัง: ' + first, kind: p.kind, tone: p.tone && !String(p.tone).startsWith('custom:') ? p.tone : '*', channel: p.channel || '*', lang, body, override: false });
  toast(ev ? 'สร้างเทมเพลตแล้ว (แทนข้อมูลของงานด้วย {{ตัวแปร}} ให้) — เลือกใช้ได้ในหน้าเขียนโพสต์' : 'สร้างเทมเพลตแล้ว — โพสต์นี้ไม่ผูกกับงาน จึงควรแก้ส่วนที่เป็นข้อมูลงานเป็น {{ตัวแปร}} เอง', 'ok', 5000);
  st.app.go('templates', { k: p.kind });
}
