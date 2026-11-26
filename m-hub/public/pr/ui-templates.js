// หน้าเทมเพลต: ดูต้นแบบ แก้/สร้างเทมเพลตของตัวเองด้วย {{ตัวแปร}} พร้อมดูตัวอย่างสดกับข้อมูลงานจริง
import { h, setKids, btn, field, select, toast, checkbox, confirmBox, debounce } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { repo } from './db.js';
import { KINDS, TONES, CHANNELS, emptyFields, kindOf, channelOf } from './fields.js';
import { renderPost, builtinBody, PLACEHOLDER_HELP, placeholderKeys, buildVars } from './templates.js';
import { checkPost } from './checker.js';

let st;

export async function mount(el, app) {
  st = { app, kind: app.settings.kind || 'invite', tone: 'semi', lang: 'th', channel: '*', editing: null, previewEvent: '' };
  st.sel = h('section.card');
  st.builtin = h('section.card');
  st.mine = h('section.card');
  st.editor = h('section.card', { hidden: true });
  el.append(
    h('p.intro', 'เทมเพลตต้นแบบมี 9 ประเภท × 5 โทน × 2 ภาษา และปรับตามช่องทางให้อัตโนมัติ (ความยาว อีโมจิ แฮชแท็ก หัวเรื่องอีเมล ลายเซ็น หนังสือเวียน) อยากได้สำนวนของหน่วยงานเอง คัดลอกต้นแบบมาแก้ แล้วติ๊ก “ใช้แทนต้นแบบ”'),
    st.sel, h('div.split', st.builtin, h('div.pr-stack', st.mine, st.editor)));
  repo.onChange((t) => { if (t === 'templates' || t === '*') drawMine(); });
  drawSel();
}

export async function show() { drawBuiltin(); await drawMine(); }

function drawSel() {
  setKids(st.sel, h('div.grid4',
    field('ประเภท', select(KINDS.map((k) => [k.id, k.th]), st.kind, (v) => { st.kind = v; drawBuiltin(); drawMine(); })),
    field('โทน', select(TONES.map((t) => [t.id, t.th]), st.tone, (v) => { st.tone = v; drawBuiltin(); })),
    field('ภาษา', select([['th', 'ไทย'], ['en', 'English']], st.lang, (v) => { st.lang = v; drawBuiltin(); })),
    field('ช่องทาง', select([['*', 'ทุกช่องทาง (เนื้อหาหลัก)'], ...CHANNELS.map((c) => [c.id, c.th])], st.channel, (v) => { st.channel = v; drawBuiltin(); }))));
}

function drawBuiltin() {
  const chId = st.channel === '*' ? 'facebook' : st.channel;
  const ch = channelOf(chId);
  const body = builtinBody(st.kind, ch.forceTone || st.tone, st.lang, chId);
  const note = ch.short ? 'ช่องทาง X ใช้ข้อความสั้นแยกต่างหาก (ทุกโทนใช้ร่วมกัน)' : ch.poster ? 'ข้อความโปสเตอร์ใช้รูปแบบเดียวกันทุกโทน' : ch.forceTone ? 'หนังสือเวียนใช้เนื้อหาโทนราชการเสมอ แล้วใส่หัว “เรื่อง / เรียน” และคำลงท้ายให้' : st.channel === '*' ? 'เนื้อหาหลัก — แต่ละช่องทางจะปรับต่อให้อัตโนมัติ' : `เนื้อหาหลัก แล้วปรับสำหรับ ${ch.th} อัตโนมัติ`;
  setKids(st.builtin, 
    h('h3.card-title', icon('file'), 'ต้นแบบ: ', kindOf(st.kind).th, h('span.badge', (TONES.find((t) => t.id === st.tone) || {}).th), h('span.badge', st.lang === 'th' ? 'ไทย' : 'EN')),
    h('div.hint', note),
    h('pre.pr-pre.pr-tpl', body),
    h('div.row.wrap', btn('คัดลอกไปแก้เป็นเทมเพลตของฉัน', () => edit({ name: `${kindOf(st.kind).th} · ${(TONES.find((t) => t.id === st.tone) || {}).th} (ของฉัน)`, kind: st.kind, tone: st.tone, channel: st.channel, lang: st.lang, body, override: true }), { ic: 'copy', kind: 'primary' })),
    help());
}

function help() {
  return h('details.pr-help',
    h('summary', 'วิธีเขียนเทมเพลต'),
    h('ul.small',
      h('li', h('code', '{{title}}'), ' แทนด้วยข้อมูล ถ้าช่องนั้นว่างจะลบทั้งบรรทัด'),
      h('li', h('code', '{{title!}}'), ' ถ้าว่างจะขึ้น [กรอก: …] ให้เห็นว่าต้องเติม'),
      h('li', h('code', '{{audience|ผู้สนใจ}}'), ' ถ้าว่างใช้ข้อความหลัง |'),
      h('li', h('code', '[[ … ]]'), ' ส่วนเสริม ถ้าตัวแปรข้างในว่างจะตัดทั้งส่วน เช่น ', h('code', '[[ โดย {{guestsInline}}]]')),
      h('li', 'เทมเพลตภาษาอังกฤษใช้ตัวแปรชื่อเดิม ระบบจะดึงช่องภาษาอังกฤษให้เอง (เช่น {{place}} → สถานที่ภาษาอังกฤษ)')));
}

async function drawMine() {
  const all = (await repo.list('templates')).filter((t) => t.kind === st.kind);
  setKids(st.mine, 
    h('div.row', h('h3.card-title', icon('list'), 'เทมเพลตของฉัน: ', kindOf(st.kind).th), h('span.spacer'),
      btn('สร้างเปล่า', () => edit({ name: 'เทมเพลตใหม่', kind: st.kind, tone: '*', channel: '*', lang: st.lang, body: '', override: false }), { ic: 'plus', kind: 'sm' })),
    all.length ? h('div.field-list', all.map((t) => h('div.list-item', { 'data-tpl': t.id },
      h('div.name', h('b', t.name || 'ไม่มีชื่อ'), h('span.muted.small', ` · ${t.tone === '*' ? 'ทุกโทน' : (TONES.find((x) => x.id === t.tone) || {}).th} · ${t.channel === '*' ? 'ทุกช่องทาง' : channelOf(t.channel).th} · ${t.lang === 'th' ? 'ไทย' : 'EN'}`),
        t.override ? h('span.badge', 'ใช้แทนต้นแบบ') : null),
      btn('แก้', () => edit(t), { kind: 'sm', ic: 'pen' }))))
      : h('div.muted.small', 'ยังไม่มี — กด “คัดลอกไปแก้…” จากต้นแบบด้านซ้าย'));
}

async function edit(tpl) {
  st.editing = { ...tpl };
  const t = st.editing;
  const events = await repo.list('events');
  if (!st.previewEvent && events.length) st.previewEvent = events[0].id;
  const body = h('textarea.pr-text', { rows: 14, value: t.body || '', 'aria-label': 'เนื้อหาเทมเพลต', oninput: (e) => { t.body = e.target.value; previewSoon(); } });
  const preview = h('pre.pr-pre');
  const warn = h('div.small');
  const known = new Set([...PLACEHOLDER_HELP.map(([k]) => k), ...Object.keys(buildVars(emptyFields(), 'th', {})), 'hashtags', 'signature']);
  const doPreview = async () => {
    const ev = events.find((e) => e.id === st.previewEvent);
    const fields = ev ? ev.fields : emptyFields();
    const ch = t.channel === '*' ? 'facebook' : t.channel;
    const r = renderPost(fields, { kind: t.kind, tone: t.tone === '*' ? 'semi' : t.tone, channel: ch, lang: t.lang, settings: st.app.settings, style: st.app.style, userTemplates: [{ ...t, id: '__preview' }], templateId: '__preview' });
    preview.textContent = (r.subject ? 'หัวเรื่อง: ' + r.subject + '\n\n' : '') + r.text;
    const unknown = [...new Set(placeholderKeys(t.body).filter((k) => !known.has(k)))];
    const issues = checkPost(r.text, { fields, kind: t.kind, tone: t.tone === '*' ? 'semi' : t.tone, channel: ch, lang: t.lang, style: st.app.style, settings: st.app.settings, subject: r.subject }).items.filter((i) => i.level === 'error' || i.level === 'warn');
    setKids(warn, 
      unknown.length ? h('div.status-err', 'ไม่รู้จักตัวแปร: ' + unknown.map((k) => `{{${k}}}`).join(' ') + ' (บรรทัดที่มีตัวแปรนี้จะหายไป)') : null,
      issues.length ? h('div.status-warn', 'ตัวตรวจพบ: ' + issues.map((i) => i.msg).slice(0, 4).join(' · ')) : h('div.status-ok', 'ตัวตรวจไม่พบปัญหากับข้อมูลงานตัวอย่างนี้'));
  };
  const previewSoon = debounce(doPreview, 200);
  const insert = (k) => {
    const s = body.selectionStart ?? body.value.length;
    body.setRangeText(`{{${k}}}`, s, body.selectionEnd ?? s, 'end');
    t.body = body.value;
    body.focus();
    previewSoon();
  };
  st.editor.hidden = false;
  setKids(st.editor, 
    h('h3.card-title', icon('pen'), t.id ? 'แก้เทมเพลต' : 'เทมเพลตใหม่'),
    field('ชื่อเทมเพลต', h('input', { type: 'text', value: t.name || '', 'aria-label': 'ชื่อเทมเพลต', oninput: (e) => { t.name = e.target.value; } })),
    h('div.grid3',
      field('โทน', select([['*', 'ทุกโทน'], ...TONES.map((x) => [x.id, x.th])], t.tone, (v) => { t.tone = v; previewSoon(); })),
      field('ช่องทาง', select([['*', 'ทุกช่องทาง'], ...CHANNELS.map((c) => [c.id, c.th])], t.channel, (v) => { t.channel = v; previewSoon(); })),
      field('ภาษา', select([['th', 'ไทย'], ['en', 'English']], t.lang, (v) => { t.lang = v; previewSoon(); }))),
    checkbox('ใช้แทนต้นแบบอัตโนมัติ (เมื่อประเภท โทน ช่องทาง และภาษาตรงกัน)', t.override, (v) => { t.override = v; }),
    h('div.hint', t.channel === '*' ? 'ทุกช่องทาง = เขียนเฉพาะเนื้อหาหลัก ระบบจะเติมหัวอีเมล/หนังสือเวียน แฮชแท็ก และลายเซ็นให้เอง' : 'เจาะจงช่องทาง = ใช้ข้อความนี้ตามที่เขียนทั้งหมด (ระบบเติมเฉพาะแฮชแท็ก ถ้าไม่ได้ใส่ {{hashtags}})'),
    body,
    h('div.chips', h('span.muted.small', 'แทรกตัวแปร:'), PLACEHOLDER_HELP.map(([k, d]) => h('button.chip', { type: 'button', title: d, onclick: () => insert(k) }, `{{${k}}}`))),
    h('div.row.wrap', h('span.field-label', 'ดูตัวอย่างกับ'), select(events.map((e) => [e.id, (e.fields.title || '(ไม่มีชื่อ)') + (e.sample ? ' · ตัวอย่าง' : '')]), st.previewEvent, (v) => { st.previewEvent = v; previewSoon(); })),
    preview, warn,
    h('div.row.wrap',
      btn('บันทึกเทมเพลต', async () => {
        if (!t.body.trim()) return toast('ยังไม่มีเนื้อหา', 'warn');
        const saved = await repo.put('templates', { ...t, name: (t.name || '').trim() || 'เทมเพลตของฉัน' });
        st.editing = saved;
        toast('บันทึกเทมเพลตแล้ว' + (saved.override ? ' — หน้าเขียนโพสต์จะใช้เทมเพลตนี้แทนต้นแบบ' : ''), 'ok', 4000);
        edit(saved);
      }, { ic: 'save', kind: 'primary' }),
      t.id ? btn('ลบเทมเพลตนี้', async () => {
        if (!(await confirmBox(`ลบเทมเพลต “${t.name}”? (ต้นแบบจะกลับมาใช้แทน)`, { ok: 'ลบ', danger: true }))) return;
        await repo.remove('templates', t.id);
        st.editor.hidden = true;
        toast('ลบแล้ว');
      }, { ic: 'trash', kind: 'danger' }) : null,
      btn('ปิด', () => { st.editor.hidden = true; }, { kind: 'ghost' })));
  doPreview();
  st.editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
