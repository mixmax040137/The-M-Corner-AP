// หน้าเขียนโพสต์: ฟอร์มข้อมูลงาน → เลือกประเภท/โทน/ภาษา/ช่องทาง → ผลลัพธ์ + กล่อง “ควรเช็ก”
import { h, setKids, btn, field, select, seg, toast, copyText, debounce, download } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { repo } from './db.js';
import { FIELDS, GROUPS, KINDS, TONES, LANGS, CHANNELS, EVENT_TYPES, emptyFields, fieldLabel, channelOf, toneOf } from './fields.js';
import { renderPost } from './templates.js';
import { checkPost, applyFix, checkLinks, describeLink, xLength } from './checker.js';
import { fmtRange, fmtDate } from './dates.js';
import { buildEml, gmailLink, outlookLink } from '../core/eml.js';
import { loadGlossary, compileGlossary, aiTranslate, hasThai } from '../core/glossary.js';

let st = null;
let ui = null;

const LEVEL_ICON = { error: 'xCircle', warn: 'alert', info: 'info', ok: 'checkCircle' };
const STATUS_LABEL = { draft: 'ร่าง', approved: 'อนุมัติแล้ว', posted: 'โพสต์แล้ว' };

export async function mount(el, app) {
  const s = app.settings;
  st = { app, eventId: null, event: null, fields: emptyFields(), kind: s.kind, tone: s.tone, lang: s.lang, channel: s.channel, templateId: '',
    edited: false, text: '', subject: '', postId: null, links: {}, userTemplates: [], lastLinkKey: '' };
  ui = {};
  ui.eventSel = h('select', { 'aria-label': 'เลือกงาน', onchange: (e) => loadEvent(e.target.value) });
  ui.sampleNote = h('div.note.info', { hidden: true }, 'งานตัวอย่าง: ชื่อบุคคล เบอร์โทร อีเมล และลิงก์ทั้งหมดเป็นของสมมติ ใช้ทดลองได้เลย หรือลบได้ที่หน้าตั้งค่า');
  ui.form = h('div.pr-form');
  ui.options = h('section.card');
  ui.checks = h('section.card.pr-checks');
  ui.out = h('section.card.pr-outcard');
  ui.allOut = h('div.pr-all', { hidden: true });

  el.append(
    h('section.card',
      h('div.row.wrap',
        h('span.field-label', 'งาน'), h('div', { style: { flex: '1', minWidth: '220px' } }, ui.eventSel),
        btn('งานใหม่', () => loadEvent(''), { ic: 'plus' }),
        btn('ทำสำเนางานนี้', duplicateEvent, { ic: 'copy', kind: 'ghost' })),
      ui.sampleNote,
      h('div.hint', 'ข้อมูลในฟอร์มบันทึกอัตโนมัติ เปลี่ยนเป็นงานอื่นแล้วกลับมาได้ตลอด')),
    h('div.pr-cols',
      ui.form,
      h('div.pr-outcol', ui.options, ui.checks, ui.out, ui.allOut)),
  );
  repo.onChange((t) => { if (t === 'events' || t === '*') refreshEventList(); if (t === 'templates' || t === '*') loadTemplates(); });
  await refreshEventList();
  await loadTemplates();
  renderOptions();
}

export async function show(params = {}) {
  if (params.e !== undefined && params.e !== (st.eventId || '')) await loadEvent(params.e, { keepKind: !!params.k });
  else if (!st.eventId && !st.fields.title) {
    const list = await repo.list('events');
    if (list.length && params.e === undefined) await loadEvent(sortEvents(list)[0].id);
    else if (!list.length) { renderForm(); regenerate(); }
  }
  if (params.k && KINDS.some((k) => k.id === params.k)) { st.kind = params.k; renderOptions(); renderForm(); st.edited = false; regenerate(); }
}

const sortEvents = (list) => [...list].sort((a, b) => String(b.fields.date || '').localeCompare(String(a.fields.date || '')) || String(b.updatedAt).localeCompare(String(a.updatedAt)));

async function refreshEventList() {
  const list = sortEvents(await repo.list('events'));
  setKids(ui.eventSel, h('option', { value: '' }, '— งานใหม่ —'),
    ...list.map((e) => h('option', { value: e.id, selected: e.id === st.eventId },
      `${e.fields.title || '(ไม่มีชื่อ)'}${e.fields.date ? ' · ' + fmtRange(e.fields.date, e.fields.endDate, 'th', { short: true, weekday: false }) : ''}${e.sample ? ' · ตัวอย่าง' : ''}`)));
  ui.eventSel.value = st.eventId || '';
}

async function loadTemplates() {
  st.userTemplates = await repo.list('templates');
  if (ui.tplSel) renderOptions();
}

async function loadEvent(id, { keepKind = false } = {}) {
  await flushSave();
  const ev = id ? await repo.get('events', id) : null;
  st.eventId = ev ? ev.id : null;
  st.event = ev;
  st.fields = ev ? { ...emptyFields(), ...structuredClone(ev.fields) } : emptyFields();
  if (ev && ev.kind && !keepKind) st.kind = ev.kind;
  st.edited = false;
  st.postId = null;
  ui.eventSel.value = st.eventId || '';
  ui.sampleNote.hidden = !(ev && ev.sample);
  renderOptions();
  renderForm();
  regenerate();
}

async function duplicateEvent() {
  await flushSave();
  const copy = await repo.put('events', { fields: { ...structuredClone(st.fields), title: (st.fields.title || 'งาน') + ' (สำเนา)' }, kind: st.kind, versionNo: 1, sample: false });
  await refreshEventList();
  await loadEvent(copy.id);
  toast('ทำสำเนางานแล้ว', 'ok');
}

// ---------- บันทึกงานอัตโนมัติ ----------
let saveTimer = null;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveEvent, 600);
}
async function flushSave() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; await saveEvent(); }
}
async function saveEvent() {
  saveTimer = null;
  const f = st.fields;
  const hasData = FIELDS.some((x) => x.key !== 'eventType' && (x.type === 'guests' ? (f.guests || []).length : f[x.key]));
  if (!st.eventId && !hasData) return;
  const base = st.eventId ? (await repo.get('events', st.eventId)) || {} : { versionNo: 1, sample: false };
  const rec = await repo.put('events', { ...base, id: st.eventId || undefined, fields: structuredClone(f), kind: st.kind }, { silent: true });
  const isNew = !st.eventId;
  st.eventId = rec.id;
  st.event = rec;
  if (isNew) await refreshEventList();
}

// ---------- ฟอร์ม ----------
function renderForm() {
  const showEn = st.lang !== 'th';
  const f = st.fields;
  const onChange = () => { scheduleSave(); st.postId = null; if (!st.edited) regenerate(); else runCheck(); };
  const input = (key, type) => {
    const attrs = { 'data-f': key, 'aria-label': fieldLabel(key, st.kind) };
    if (type === 'textarea') return h('textarea', { ...attrs, rows: 3, value: f[key] || '', oninput: (e) => { f[key] = e.target.value; onChange(); } });
    if (type === 'eventType') return h('select', { ...attrs, onchange: (e) => { f[key] = e.target.value; onChange(); } }, EVENT_TYPES.map((t) => h('option', { value: t.id, selected: t.id === f[key] }, t.label)));
    const t = { date: 'date', time: 'time', url: 'url', tel: 'tel', email: 'email' }[type] || 'text';
    if (t === 'date') {
      // แสดงวันที่แบบไทยใต้ช่อง (ช่องเลือกวันของเบราว์เซอร์อาจเป็นรูปแบบฝรั่ง)
      const hint = h('span.hint.pr-datehint');
      const draw = () => { hint.textContent = f[key] ? fmtDate(f[key], 'th') : ''; };
      draw();
      return h('div.pr-stack.pr-date', h('input', { ...attrs, type: t, value: f[key] || '', oninput: (e) => { f[key] = e.target.value; draw(); onChange(); } }), hint);
    }
    return h('input', { ...attrs, type: t, value: f[key] || '', oninput: (e) => { f[key] = e.target.value.trimStart(); onChange(); }, placeholder: t === 'url' ? 'https://' : null });
  };
  const cards = GROUPS.map(([gid, gtitle]) => {
    const rows = [];
    let pairRow = [];
    for (const x of FIELDS.filter((y) => y.group === gid)) {
      if (x.type === 'guests') { rows.push(field(fieldLabel('guests', st.kind), guestEditor(showEn, onChange))); continue; }
      if (x.en && showEn) {
        rows.push(h('div.grid2', field(fieldLabel(x.key, st.kind), input(x.key, x.type), x.hint), field(fieldLabel(x.key + 'En', st.kind), input(x.key + 'En', x.type))));
        continue;
      }
      pairRow.push(field(fieldLabel(x.key, st.kind), input(x.key, x.type), x.hint));
      if (pairRow.length === 2) { rows.push(h('div.grid2', ...pairRow)); pairRow = []; }
    }
    if (pairRow.length) rows.push(h('div.grid2', ...pairRow));
    return h('section.card', h('h3.card-title', gtitle), ...rows);
  });
  const enTools = showEn ? h('div.note', h('div.row.wrap',
    h('span', 'ช่องภาษาอังกฤษว่างอยู่? เติมจากคลังคำแปลของ M Hub และ AI แปลฟรี (ไม่ใช้ token ของ Claude · ไม่แปลชื่อบุคคล)'),
    btn('เติมช่องภาษาอังกฤษ', fillEnglish, { ic: 'languages', kind: 'sm' }))) : null;
  setKids(ui.form, ...(enTools ? [enTools] : []), ...cards);
}

function guestEditor(showEn, onChange) {
  const box = h('div.field-list');
  const draw = () => {
    const list = st.fields.guests || (st.fields.guests = []);
    setKids(box, ...list.map((g, i) => h('div.field-item',
      h('div.grid2',
        h('input', { type: 'text', 'aria-label': 'ชื่อ (มีคำนำหน้า/ตำแหน่งวิชาการ)', placeholder: 'ชื่อ เช่น รองศาสตราจารย์ ดร.สมชาย ใจดี', value: g.name || '', oninput: (e) => { g.name = e.target.value; onChange(); } }),
        h('input', { type: 'text', 'aria-label': 'ตำแหน่ง / บทบาท', placeholder: 'ตำแหน่ง / บทบาท', value: g.role || '', oninput: (e) => { g.role = e.target.value; onChange(); } })),
      showEn ? h('div.grid2',
        h('input', { type: 'text', 'aria-label': 'Name (English)', placeholder: 'Name in English', value: g.nameEn || '', oninput: (e) => { g.nameEn = e.target.value; onChange(); } }),
        h('input', { type: 'text', 'aria-label': 'Role (English)', placeholder: 'Role in English', value: g.roleEn || '', oninput: (e) => { g.roleEn = e.target.value; onChange(); } })) : null,
      h('div.row.end', btn('ลบ', () => { list.splice(i, 1); draw(); onChange(); }, { ic: 'trash', kind: 'ghost sm' })))),
    btn('เพิ่มรายชื่อ', () => { list.push({ name: '', role: '', nameEn: '', roleEn: '' }); draw(); box.querySelectorAll('input')[list.length * (showEn ? 4 : 2) - (showEn ? 4 : 2)]?.focus(); }, { ic: 'plus', kind: 'sm' }));
  };
  draw();
  return box;
}

async function fillEnglish() {
  const f = st.fields;
  const keys = ['title', 'place', 'organizer', 'audience', 'notes'].filter((k) => f[k] && !f[k + 'En']);
  if (!keys.length) return toast('ไม่มีช่องภาษาอังกฤษที่ว่างอยู่ (ช่องชื่อบุคคลต้องกรอกเอง)', 'info');
  try {
    const pairs = compileGlossary(await loadGlossary());
    const res = await aiTranslate(keys.map((k) => f[k]), pairs);
    keys.forEach((k, i) => { if (res[i] && !hasThai(res[i])) f[k + 'En'] = res[i].trim(); });
    renderForm();
    scheduleSave();
    if (!st.edited) regenerate();
    toast('เติมแล้ว ' + keys.length + ' ช่อง — ตรวจทานคำแปลก่อนใช้ทุกครั้ง', 'ok', 4000);
  } catch (e) { toast('แปลไม่สำเร็จ: ' + e.message, 'error'); }
}

// ---------- ตัวเลือก ----------
function renderOptions() {
  const s = st.app.settings;
  const customTones = s.customTones || [];
  const tpls = st.userTemplates.filter((t) => t.kind === st.kind);
  ui.tplSel = select([['', 'ต้นแบบ (หรือเทมเพลตที่ตั้งให้ใช้แทน)'], ...tpls.map((t) => [t.id, `${t.name || 'ไม่มีชื่อ'} · ${t.lang === 'en' ? 'EN' : 'TH'}`])], st.templateId, (v) => { st.templateId = v; st.edited = false; regenerate(); });
  const toneSeg = seg([...TONES.map((t) => [t.id, t.th]), ...customTones.map((t) => [t.id, t.th])], st.tone, (v) => { st.tone = v; st.edited = false; st.postId = null; regenerate(); });
  setKids(ui.options, 
    h('div.grid2',
      field('ประเภทโพสต์', select(KINDS.map((k) => [k.id, k.th]), st.kind, (v) => { st.kind = v; st.templateId = ''; st.edited = false; st.postId = null; renderOptions(); renderForm(); scheduleSave(); regenerate(); })),
      field('เทมเพลต', ui.tplSel)),
    field('โทน', toneSeg, toneOf(st.tone, customTones).desc),
    field('ภาษา', seg(LANGS.map((l) => [l.id, l.th]), st.lang, (v) => { st.lang = v; st.edited = false; st.postId = null; renderForm(); regenerate(); })),
    field('ช่องทาง', seg([...CHANNELS.map((c) => [c.id, c.th]), ['all', 'ทุกช่องทาง']], st.channel, (v) => { st.channel = v; st.edited = false; st.postId = null; regenerate(); })),
  );
  ui.options.querySelectorAll('.seg').forEach((x, i) => x.setAttribute('aria-label', ['โทน', 'ภาษา', 'ช่องทาง'][i]));
}

// ---------- สร้างข้อความ ----------
function opts(channel = st.channel) {
  return { kind: st.kind, tone: st.tone, channel, lang: st.lang, settings: st.app.settings, style: st.app.style, userTemplates: st.userTemplates, templateId: st.templateId || null };
}

function regenerate() {
  if (st.channel === 'all') return renderAll();
  ui.allOut.hidden = true;
  ui.checks.hidden = false;
  ui.out.hidden = false;
  const r = renderPost(st.fields, opts());
  st.used = r.used;
  if (!st.edited) { st.text = r.text; st.subject = r.subject; }
  renderOutput();
  runCheck();
  autoCheckLinks();
}

function renderOutput() {
  const ch = channelOf(st.channel);
  ui.text = h('textarea.pr-text', { rows: 16, 'data-out': '1', 'aria-label': 'ข้อความโพสต์', value: st.text,
    oninput: (e) => { st.text = e.target.value; markEdited(); runCheckSoon(); updateCount(); } });
  ui.subject = ch.subject ? h('input', { type: 'text', 'data-subject': '1', 'aria-label': ch.id === 'email' ? 'หัวเรื่องอีเมล' : 'หัวเรื่อง', value: st.subject,
    oninput: (e) => { st.subject = e.target.value; markEdited(); runCheckSoon(); } }) : null;
  ui.count = h('span.muted.small');
  ui.editedNote = h('div.note.warn', { hidden: !st.edited }, h('div.row.wrap', h('span', 'แก้ข้อความเองแล้ว — เปลี่ยนข้อมูลในฟอร์มจะไม่เขียนทับ'),
    btn('สร้างใหม่จากข้อมูล', () => { st.edited = false; regenerate(); }, { ic: 'refresh', kind: 'sm' })));
  const used = (st.used || []).map((u) => `${u.source === 'user' ? 'เทมเพลตของฉัน “' + u.name + '”' : 'ต้นแบบ'} (${u.lang === 'th' ? 'ไทย' : 'อังกฤษ'})`).join(' + ');
  const actions = h('div.row.wrap',
    btn('คัดลอกข้อความ', () => copyText(st.text), { ic: 'copy', kind: 'primary' }),
    ch.subject ? btn('คัดลอกหัวเรื่อง', () => copyText(st.subject), { ic: 'copy' }) : null,
    btn('บันทึกร่าง', () => savePost('draft'), { ic: 'save' }),
    btn('ใช้จริง', () => savePost('approved'), { ic: 'check', title: 'บันทึกเป็นโพสต์ที่ใช้จริง (เก็บเป็นตัวอย่างของคณะ)' }),
    btn('QR จากลิงก์', () => { const u = st.fields.regLink || st.fields.meetingLink; st.app.go('qr', u ? { u } : {}); }, { ic: 'qr', kind: 'ghost' }));
  const mail = ch.id === 'email' ? h('div.row.wrap',
    h('a.btn.sm', { href: '#', target: '_blank', rel: 'noopener', onmousedown: (e) => { e.currentTarget.href = gmailLink({ subject: st.subject, text: st.text }); }, onclick: (e) => { e.currentTarget.href = gmailLink({ subject: st.subject, text: st.text }); } }, icon('external'), 'เปิดใน Gmail'),
    h('a.btn.sm', { href: '#', target: '_blank', rel: 'noopener', onmousedown: (e) => { e.currentTarget.href = outlookLink({ subject: st.subject, text: st.text }); }, onclick: (e) => { e.currentTarget.href = outlookLink({ subject: st.subject, text: st.text }); } }, icon('external'), 'เปิดใน Outlook'),
    btn('ดาวน์โหลด .eml', () => download(new Blob([buildEml({ subject: st.subject, text: st.text })], { type: 'message/rfc822' }), (st.subject || 'อีเมล').slice(0, 80).replace(/[\\/:*?"<>|]/g, ' ') + '.eml'), { ic: 'download', kind: 'sm' })) : null;
  setKids(ui.out, 
    h('h3.card-title', icon('pen'), 'ข้อความ ', h('span.badge', ch.th)),
    ui.editedNote,
    ui.subject ? field(ch.id === 'email' ? 'หัวเรื่องอีเมล' : ch.id === 'web' ? 'พาดหัวข่าว' : 'เรื่อง', ui.subject) : null,
    ui.text,
    h('div.row.wrap', ui.count, h('span.spacer'), h('span.muted.small', used ? 'ใช้: ' + used : '')),
    actions, mail,
    h('div.hint', 'แก้ข้อความในกล่องได้เลย หรือวางข้อความที่เขียนเองเพื่อให้ตรวจก็ได้ ตัวตรวจด้านบนจะอัปเดตทันที'));
  updateCount();
}

function updateCount() {
  if (!ui.count) return;
  const ch = channelOf(st.channel);
  const n = ch.id === 'x' ? xLength(st.text) : [...st.text].length;
  ui.count.textContent = `${n.toLocaleString()} ตัวอักษร${ch.id === 'x' ? ' / 280 (นับแบบ X)' : ''}`;
  ui.count.className = n > ch.maxLen ? 'status-err small' : 'muted small';
}

function markEdited() {
  if (!st.edited) { st.edited = true; if (ui.editedNote) ui.editedNote.hidden = false; }
}

// ---------- ตัวตรวจ ----------
const runCheckSoon = debounce(() => runCheck(), 200);
function checkCtx(channel = st.channel) {
  return { fields: st.fields, kind: st.kind, tone: st.tone, channel, lang: st.lang, style: st.app.style, settings: st.app.settings, subject: st.subject, staff: st.app.staff || [] };
}
function runCheck() {
  if (st.channel === 'all') return;
  const res = checkPost(st.text, checkCtx());
  st.lastLinks = res.links;
  const counts = { error: 0, warn: 0 };
  for (const i of res.items) if (i.level in counts) counts[i.level]++;
  // ผลตรวจลิงก์นับรวมด้วย: ลิงก์เสีย = ต้องแก้, ตรวจไม่ได้ = ควรดู
  for (const l of res.links) {
    const d = describeLink(st.links[l.url]).state;
    if (d === 'broken') counts.error++;
    else if (d === 'warn') counts.warn++;
  }
  if (counts.error || counts.warn) res.items = res.items.filter((i) => i.code !== 'clean');
  const head = h('h3.card-title', icon('shield'), 'ควรเช็ก',
    counts.error ? h('span.badge.err', `แก้ ${counts.error}`) : null, counts.warn ? h('span.badge.warn', `ควรดู ${counts.warn}`) : null);
  const list = h('ul.check-list', res.items.map((i) => h('li.check-item.' + i.level, { 'data-code': i.code || '' },
    icon(LEVEL_ICON[i.level]), h('span.check-msg', i.msg),
    i.fix ? btn(i.fix.label || 'แก้ให้', () => applyCheckFix(i.fix), { kind: 'sm' }) : null)));
  const linkBox = res.links.length ? h('div.pr-links',
    h('div.row.wrap', h('b.small', `ลิงก์ในโพสต์ (${res.links.length})`), h('span.spacer'), btn('ตรวจลิงก์', () => doCheckLinks(true), { ic: 'link', kind: 'sm' })),
    h('ul.check-list', res.links.map((l) => {
      const d = describeLink(st.links[l.url]);
      return h('li.check-item.' + ({ ok: 'ok', broken: 'error', warn: 'warn', pending: 'info' }[d.state]), { 'data-link': l.url },
        icon(d.state === 'ok' ? 'checkCircle' : d.state === 'broken' ? 'xCircle' : d.state === 'warn' ? 'alert' : 'link'),
        h('span.check-msg', h('a', { href: l.url, target: '_blank', rel: 'noopener' }, l.display), ' — ', d.msg));
    }))) : null;
  setKids(ui.checks, head, list, linkBox);
}

function applyCheckFix(fix) {
  st.text = applyFix(st.text, fix);
  if (st.subject) st.subject = applyFix(st.subject, fix);
  if (ui.text) ui.text.value = st.text;
  if (ui.subject) ui.subject.value = st.subject;
  markEdited();
  updateCount();
  runCheck();
}

const autoCheckLinks = debounce(() => doCheckLinks(false), 900);
async function doCheckLinks(manual) {
  const urls = (st.lastLinks || []).map((l) => l.url);
  if (!urls.length) return;
  const key = urls.join('|');
  if (!manual && key === st.lastLinkKey) return;
  st.lastLinkKey = key;
  if (manual) toast('กำลังตรวจลิงก์…', 'info', 1500);
  const res = await checkLinks(urls);
  Object.assign(st.links, res);
  runCheck();
}

// ---------- ทุกช่องทาง ----------
function renderAll() {
  ui.checks.hidden = true;
  ui.out.hidden = true;
  ui.allOut.hidden = false;
  setKids(ui.allOut, ...CHANNELS.map((c) => {
    const r = renderPost(st.fields, opts(c.id));
    const res = checkPost(r.text, { ...checkCtx(c.id), subject: r.subject });
    const nErr = res.items.filter((i) => i.level === 'error').length;
    const nWarn = res.items.filter((i) => i.level === 'warn').length;
    return h('section.card.pr-chcard', { 'data-ch': c.id },
      h('div.row', h('h3.card-title', c.th), h('span.spacer'),
        nErr ? h('span.badge.err', `แก้ ${nErr}`) : null, nWarn ? h('span.badge.warn', `ควรดู ${nWarn}`) : null, !nErr && !nWarn ? h('span.badge.ok', 'ผ่าน') : null),
      r.subject ? h('div.small', h('b', 'หัวเรื่อง: '), r.subject) : null,
      h('pre.pr-pre', r.text),
      h('div.row.wrap',
        btn('คัดลอก', () => copyText(r.subject && c.id === 'email' ? r.text : r.text), { ic: 'copy', kind: 'sm' }),
        btn('เปิดแก้ไข / ดูจุดที่ควรเช็ก', () => { st.channel = c.id; st.edited = false; renderOptions(); regenerate(); }, { ic: 'pen', kind: 'ghost sm' })));
  }));
}

// ---------- บันทึกโพสต์ ----------
async function savePost(status) {
  await flushSave();
  if (!st.eventId) await saveEvent();
  const prev = st.postId ? await repo.get('posts', st.postId) : null;
  const t = new Date().toISOString();
  const rec = await repo.put('posts', {
    ...(prev || {}),
    id: st.postId || undefined,
    eventId: st.eventId, kind: st.kind, tone: st.tone, channel: st.channel, lang: st.lang, eventType: st.fields.eventType,
    text: st.text, subject: st.subject, status, source: 'template', edited: st.edited,
    templateId: (st.used || []).find((u) => u.id)?.id || null,
    approvedAt: status === 'approved' ? t : prev && prev.approvedAt,
    metrics: (prev && prev.metrics) || {},
    sample: !!(st.event && st.event.sample),
  });
  st.postId = rec.id;
  toast(status === 'approved' ? 'บันทึกเป็นโพสต์ที่ใช้จริงแล้ว (ดูได้ที่ “งานทั้งหมด”)' : 'บันทึกร่างแล้ว', 'ok');
}

export { STATUS_LABEL };
