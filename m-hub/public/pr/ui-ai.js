// ส่วนโหมด AI ในหน้าเขียนโพสต์: (1) อ่านไฟล์/ข้อความ → ดึงข้อมูลลงฟอร์ม (2) ให้ AI เขียน 2 แบบ + ขัดเกลา
import { h, setKids, btn, toast, copyText, confirmBox, pickFiles, dropZone, debounce } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { repo } from './db.js';
import { FIELDS, fieldLabel, channelOf, EVENT_TYPES } from './fields.js';
import { checkPost, applyFix } from './checker.js';
import { renderPost } from './templates.js';
import { estimateTokens } from '../core/thai.js';
import { fmtDate } from './dates.js';
import { readSource, heuristics } from './extract.js';
import { pickExamples } from './library.js';
import {
  SYSTEM_PROMPT, POST_SCHEMA, EXTRACT_SYSTEM, EXTRACT_SCHEMA, routeFor, estimate, fmtCost, callAI, isCached,
  buildWriteUser, buildPolishUser, buildExtractUser, splitSubject,
} from './ai.js';

const LEVEL_ICON = { error: 'xCircle', warn: 'alert', info: 'info', ok: 'checkCircle' };

// ==================== 1) อ่านไฟล์ / ข้อความ → ดึงข้อมูลลงฟอร์ม ====================
export function createSourcePanel(ctx) {
  const st = { text: '', images: [], method: '', proposal: {} };
  const status = h('div.small.muted');
  const paste = h('textarea', { rows: 4, 'aria-label': 'วางข้อความประกาศ', placeholder: 'วางข้อความจากอีเมล ไลน์ หรือเอกสาร แล้วกด “อ่านข้อมูล”' });
  const textBox = h('textarea.pr-srctext', { rows: 6, 'aria-label': 'ข้อความที่อ่านได้', oninput: (e) => { st.text = e.target.value; drawAiRow(); } });
  const textWrap = h('details.pr-help', { hidden: true }, h('summary', 'ข้อความที่อ่านได้ (แก้ได้ก่อนส่งให้ AI)'), textBox);
  const proposalBox = h('div');
  const aiRow = h('div.row.wrap');
  const drop = h('div.drop.pr-drop', icon('upload', 22), h('div', h('b', 'ลากไฟล์มาวาง'), h('div.small.muted', 'PDF, Word (.docx), รูปโปสเตอร์/ภาพหน้าจอ — อ่านในเครื่องก่อน (0 token)')),
    btn('เลือกไฟล์', async () => { const [f] = await pickFiles({ accept: '.pdf,.docx,.txt,image/*', multiple: false }); if (f) readFile(f.file); }, { ic: 'folder', kind: 'sm' }));
  dropZone(drop, (files) => files[0] && readFile(files[0].file));

  async function readFile(file) {
    status.textContent = 'กำลังอ่าน ' + file.name + '…';
    try {
      const r = await readSource(file, (msg) => { status.textContent = msg; });
      st.text = r.text; st.images = r.images; st.method = r.method;
      const how = { docx: 'อ่านจากไฟล์ Word', 'pdf-text': 'อ่านข้อความจาก PDF', ocr: 'อ่านด้วย OCR ภาษาไทยในเครื่อง', text: 'อ่านไฟล์ข้อความ' }[r.method] || '';
      status.textContent = `${how} · ${r.text.length.toLocaleString()} ตัวอักษร · ไม่ใช้ token${r.method === 'ocr' ? ' — OCR อาจอ่านผิดบางคำ ตรวจทานก่อนใช้' : ''}`;
      afterRead();
    } catch (e) { status.textContent = ''; toast('อ่านไฟล์ไม่ได้: ' + e.message, 'error', 5000); }
  }
  function readPaste() {
    if (!paste.value.trim()) return toast('วางข้อความก่อน', 'warn');
    st.text = paste.value; st.images = []; st.method = 'paste';
    status.textContent = `ข้อความที่วาง ${st.text.length.toLocaleString()} ตัวอักษร`;
    afterRead();
  }
  function afterRead() {
    textBox.value = st.text;
    textWrap.hidden = false;
    const found = heuristics(st.text);
    st.proposal = found;
    drawProposal(Object.keys(found).length ? 'พบข้อมูลโดยไม่ใช้ AI' : 'ยังไม่พบข้อมูลที่แยกได้อัตโนมัติ — ลองให้ AI ช่วยแยก');
    drawAiRow();
  }

  function display(k, v) {
    if (k === 'guests') return (v || []).map((g) => [g.name, g.role].filter(Boolean).join(' ')).join(', ');
    if (k === 'eventType') return (EVENT_TYPES.find((t) => t.id === v) || {}).label || v;
    if (/date|deadline/i.test(k) && /^\d{4}-\d{2}-\d{2}$/.test(v)) return fmtDate(v, 'th');
    return String(v ?? '');
  }
  function drawProposal(title) {
    const keys = Object.keys(st.proposal).filter((k) => (k === 'guests' ? (st.proposal[k] || []).length : String(st.proposal[k] || '').trim()));
    if (!keys.length) { setKids(proposalBox, title ? h('div.muted.small', title) : null); return; }
    const f = ctx.st.fields;
    const rows = keys.map((k) => {
      const cur = display(k, f[k]);
      const cb = h('input', { type: 'checkbox', checked: !cur || cur === display(k, st.proposal[k]) ? true : false, 'data-key': k, 'aria-label': 'ใช้ค่านี้: ' + fieldLabel(k) });
      return h('tr', h('td', cb), h('td', fieldLabel(k, ctx.st.kind).replace(/\s*\(.*\)$/, (m) => (/อังกฤษ/.test(m) ? ' (อังกฤษ)' : ''))),
        h('td', h('b', display(k, st.proposal[k]))), h('td.muted', cur || '—'));
    });
    setKids(proposalBox,
      h('div.small', h('b', title)),
      h('div.table-wrap', h('table.table.pr-prop', h('thead', h('tr', h('th', ''), h('th', 'ช่อง'), h('th', 'ค่าที่พบ'), h('th', 'ในฟอร์มตอนนี้'))), h('tbody', rows))),
      h('div.row.wrap', btn('ใส่ลงฟอร์มที่เลือก', () => {
        const patch = {};
        for (const cb of proposalBox.querySelectorAll('input[data-key]')) if (cb.checked) patch[cb.dataset.key] = st.proposal[cb.dataset.key];
        if (!Object.keys(patch).length) return toast('ยังไม่ได้เลือกช่อง', 'warn');
        ctx.applyFields(patch);
        toast(`ใส่ ${Object.keys(patch).length} ช่องลงฟอร์มแล้ว — ตรวจข้อมูลในฟอร์มก่อนเขียนโพสต์`, 'ok', 4000);
      }, { ic: 'check', kind: 'primary sm' }), h('span.hint', 'ค่าที่ไม่ได้เลือกจะไม่ถูกเปลี่ยน')));
  }

  function drawAiRow() {
    if (!st.text.trim() && !st.images.length) { setKids(aiRow); return; }
    const route = routeFor('draft', ctx.app.settings);
    const user = buildExtractUser(st.text);
    const est = estimate(route, { system: EXTRACT_SYSTEM, user, outTok: 600 });
    const weak = st.method === 'ocr' && st.text.replace(/\s/g, '').length < 80;
    setKids(aiRow,
      st.text.trim() ? btn('ให้ AI แยกข้อมูลจากข้อความ', () => aiExtract(false), { ic: 'sparkles', kind: 'sm' }) : null,
      st.text.trim() ? h('span.small.muted', `${route.label} · ${fmtCost(est)}`) : null,
      st.images.length && route.provider === 'claude' ? btn('ให้ AI อ่านจากรูปโดยตรง', () => aiExtract(true), { ic: 'scan', kind: weak ? 'primary sm' : 'ghost sm', title: 'ใช้เมื่อ OCR อ่านได้ไม่ดี' }) : null,
      st.images.length && route.provider === 'claude' ? h('span.small.muted', fmtCost(estimate(route, { system: EXTRACT_SYSTEM, user: 'TEXT:', images: st.images.length, outTok: 600 }))) : null,
      st.images.length && route.provider !== 'claude' && weak ? h('span.small.status-warn', 'OCR อ่านได้น้อย — การอ่านรูปโดยตรงต้องใช้ Claude API key') : null);
  }

  async function aiExtract(fromImages) {
    const route = routeFor('draft', ctx.app.settings);
    const req = { purpose: 'extract', system: EXTRACT_SYSTEM, user: fromImages ? 'Extract the event facts from the attached image(s).' : buildExtractUser(st.text), schema: EXTRACT_SCHEMA, images: fromImages ? st.images : [], maxTokens: 1500 };
    const cached = await isCached(route, req);
    const est = estimate(route, { system: req.system, user: req.user, images: req.images.length, outTok: 600 });
    if (!cached && route.provider === 'claude' && !(await confirmBox(`ส่งให้ ${route.label} แยกข้อมูล\n${fmtCost(est)}`, { ok: 'ส่งให้ AI' }))) return;
    status.textContent = cached ? 'ใช้ผลเดิม (ไม่เสีย token)…' : `กำลังให้ ${route.label} แยกข้อมูล…`;
    try {
      const r = await callAI(route, req);
      const d = r.data || {};
      const clean = {};
      for (const [k, v] of Object.entries(d)) {
        if (k === 'guests') { const g = (v || []).filter((x) => x && x.name); if (g.length) clean.guests = g.map((x) => ({ name: x.name, role: x.role || '', nameEn: '', roleEn: '' })); continue; }
        if (typeof v === 'string' && v.trim() && FIELDS.some((x) => x.key === k || x.key + 'En' === k)) clean[k] = v.trim();
      }
      for (const k of ['date', 'endDate', 'deadline']) if (clean[k] && !/^\d{4}-\d{2}-\d{2}$/.test(clean[k])) delete clean[k];
      for (const k of ['startTime', 'endTime']) if (clean[k] && !/^\d{2}:\d{2}$/.test(clean[k])) delete clean[k];
      st.proposal = { ...st.proposal, ...clean };
      status.textContent = r.cached ? 'ใช้ผลเดิมจากแคช (ไม่เสีย token)' : `${route.label} แยกข้อมูลแล้ว · ${r.inTok + r.outTok} token${r.costUSD ? ` · $${r.costUSD.toFixed(4)}` : ''}`;
      drawProposal('ข้อมูลที่ AI แยกได้ (รวมกับที่พบเอง) — ตรวจก่อนใส่ลงฟอร์ม');
    } catch (e) { status.textContent = ''; toast(e.message, 'error', 6000); }
  }

  const el = h('details.card.pr-source', { open: false },
    h('summary', h('b', 'เริ่มจากไฟล์หรือข้อความ'), h('span.muted.small', ' — ดึงชื่องาน วันที่ เวลา สถานที่ ลิงก์ ลงฟอร์มให้')),
    drop,
    paste,
    h('div.row.wrap', btn('อ่านข้อมูล (0 token)', readPaste, { ic: 'scan', kind: 'sm' }), status),
    textWrap, proposalBox, aiRow);
  return { el };
}

// ==================== 2) ให้ AI เขียน 2 แบบ + ขัดเกลา ====================
export function createAiPanel(ctx) {
  const head = h('div.pr-stack');
  const notes = h('div');
  const results = h('div.pr-ai-results');
  const el = h('section.card.pr-ai', { hidden: true }, h('h3.card-title', icon('sparkles'), 'AI เขียน 2 แบบ'), head, notes, results);
  let variants = [];
  let meta = null;

  async function request() {
    const o = ctx.opts();
    const route = routeFor('draft', ctx.app.settings);
    const posts = await repo.list('posts');
    const examples = pickExamples(posts, { kind: o.kind, channel: o.channel, tone: o.tone, lang: o.lang, fields: ctx.st.fields });
    const user = buildWriteUser({ fields: ctx.st.fields, kind: o.kind, tone: o.tone, lang: o.lang, channel: o.channel, style: ctx.app.style, settings: ctx.app.settings, examples, prevFields: o.prevFields });
    // ความยาวที่คาดไว้ ≈ 2 เท่าของข้อความจากเทมเพลต
    const tpl = renderPost(ctx.st.fields, o);
    const outTok = Math.ceil(estimateTokens(tpl.subject + tpl.text) * 2.1) + 80;
    const req = { purpose: 'write', system: SYSTEM_PROMPT, user, schema: POST_SCHEMA, maxTokens: Math.min(8000, Math.max(1500, outTok * 2)) };
    return { route, req, examples, est: estimate(route, { system: SYSTEM_PROMPT, user, outTok }), cached: await isCached(route, req) };
  }

  const refresh = debounce(async () => {
    if (el.hidden) return;
    const { route, req, examples, est, cached } = await request();
    const filled = FIELDS.reduce((n, x) => n + (x.type === 'guests' ? ((ctx.st.fields.guests || []).length ? 1 : 0) : (ctx.st.fields[x.key] ? 1 : 0) + (x.en && ctx.st.fields[x.key + 'En'] ? 1 : 0)), 0);
    setKids(head,
      route.fallback ? h('div.note.info', 'ยังไม่ได้ใส่ Claude API key จึงใช้ AI ฟรีของ Cloudflare (ใส่ key ได้ที่หน้าตั้งค่า)') : null,
      h('div.small', h('b', route.label), ` · ส่งเฉพาะข้อมูลที่กรอก ${filled} ช่อง + กฎสั้น ๆ + ตัวอย่างโพสต์ที่ใช้จริง ${examples.length} โพสต์`),
      h('div.row.wrap',
        btn(cached ? 'ใช้ผลเดิม (ไม่เสีย token)' : 'ให้ AI เขียน 2 แบบ', () => run(), { ic: 'sparkles', kind: 'primary' }),
        h('span.small' + (cached ? '.status-ok' : '.muted'), cached ? 'เคยเขียนด้วยข้อมูลและตัวเลือกนี้แล้ว' : 'ประมาณ ' + fmtCost(est))),
      h('details.pr-help', h('summary', 'ดูข้อความที่จะส่งให้ AI'), h('pre.pr-pre', 'SYSTEM:\n' + req.system + '\n\nUSER:\n' + req.user)));
  }, 250);

  async function run() {
    const { route, req, cached } = await request();
    const ch = channelOf(ctx.st.channel);
    setKids(notes, h('div.muted.small', cached ? 'ใช้ผลเดิม…' : `กำลังให้ ${route.label} เขียน…`));
    try {
      const r = await callAI(route, req);
      meta = { provider: r.provider, model: r.model, inTok: r.inTok, outTok: r.outTok, cost: r.costUSD, cached: r.cached };
      variants = [r.data.variant1, r.data.variant2].map((t) => {
        const s = ch.subject ? splitSubject(t) : { subject: '', body: String(t || '').trim() };
        return { text: s.body, subject: s.subject, postId: null, orig: null };
      });
      setKids(notes,
        h('div.small.' + (r.cached ? 'status-ok' : 'muted'), r.cached ? 'ผลเดิมจากแคช (ไม่เสีย token)' : `${route.label} · ใช้จริง ${(r.inTok + r.outTok).toLocaleString()} token${r.costUSD ? ` · $${r.costUSD.toFixed(4)} (≈ ${(r.costUSD * 36 * 100).toFixed(1)} สตางค์)` : ' · ฟรี'}`),
        (r.data.check || []).length ? h('ul.check-list', r.data.check.map((c) => h('li.check-item.info', icon('info'), h('span.check-msg', 'AI ฝากตรวจ: ' + c)))) : null);
      drawResults();
      refresh();
    } catch (e) {
      setKids(notes, h('div.note.error', e.message));
    }
  }

  function drawResults() {
    setKids(results, ...variants.map((v, i) => variantCard(v, i)));
  }

  function variantCard(v, i) {
    const ch = channelOf(ctx.st.channel);
    const checks = h('div');
    const subject = ch.subject ? h('input', { type: 'text', value: v.subject, 'aria-label': `หัวเรื่อง แบบที่ ${i + 1}`, oninput: (e) => { v.subject = e.target.value; drawChecks(); } }) : null;
    const ta = h('textarea.pr-text', { rows: 14, value: v.text, 'data-variant': i + 1, 'aria-label': `ข้อความ แบบที่ ${i + 1}`, oninput: (e) => { v.text = e.target.value; drawChecksSoon(); } });
    const drawChecks = () => {
      const res = checkPost(v.text, { ...ctx.checkCtx(), subject: v.subject });
      const bad = res.items.filter((x) => x.level === 'error' || x.level === 'warn');
      setKids(checks, h('ul.check-list', (bad.length ? bad : res.items.filter((x) => x.level === 'ok').slice(0, 1)).map((x) => h('li.check-item.' + x.level, { 'data-code': x.code || '' },
        icon(LEVEL_ICON[x.level]), h('span.check-msg', x.msg),
        x.fix ? btn(x.fix.label || 'แก้ให้', () => { v.text = applyFix(v.text, x.fix); ta.value = v.text; if (subject) { v.subject = applyFix(v.subject, x.fix); subject.value = v.subject; } drawChecks(); }, { kind: 'sm' }) : null))));
    };
    const drawChecksSoon = debounce(drawChecks, 200);
    drawChecks();
    const polishRoute = routeFor('polish', ctx.app.settings);
    return h('section.card.pr-variant', { 'data-variant-card': i + 1 },
      h('div.row', h('h3.card-title', `แบบที่ ${i + 1}`), v.orig ? h('span.badge.ok', 'ขัดเกลาแล้ว') : null, h('span.spacer'),
        v.orig ? btn('ย้อนกลับ', () => { v.text = v.orig.text; v.subject = v.orig.subject; v.orig = null; drawResults(); }, { kind: 'ghost sm' }) : null),
      subject ? h('label.field', h('span.field-label', ch.id === 'web' ? 'พาดหัว' : 'หัวเรื่อง'), subject) : null,
      ta, checks,
      h('div.row.wrap',
        btn('คัดลอก', () => copyText(v.text), { ic: 'copy', kind: 'sm' }),
        btn('ใช้จริง', async () => { v.postId = await ctx.save({ status: 'approved', text: v.text, subject: v.subject, source: 'ai', ai: meta, postId: v.postId }); }, { ic: 'check', kind: 'primary sm', title: 'เก็บฉบับที่แก้แล้วลงคลังโพสต์ ใช้เป็นตัวอย่างครั้งต่อไป' }),
        btn('บันทึกร่าง', async () => { v.postId = await ctx.save({ status: 'draft', text: v.text, subject: v.subject, source: 'ai', ai: meta, postId: v.postId }); }, { ic: 'save', kind: 'ghost sm' }),
        btn('ขัดเกลา', () => polish(v), { ic: 'sparkles', kind: 'sm', title: `ขัดเกลาด้วย ${polishRoute.label}` })));
  }

  async function polish(v) {
    const o = ctx.opts();
    const route = routeFor('polish', ctx.app.settings);
    const full = (v.subject ? 'หัวเรื่อง: ' + v.subject + '\n\n' : '') + v.text;
    const user = buildPolishUser({ text: full, kind: o.kind, tone: o.tone, lang: o.lang, channel: o.channel, style: ctx.app.style, settings: ctx.app.settings });
    const outTok = Math.ceil(estimateTokens(full) * 1.1) + 60;
    const req = { purpose: 'polish', system: SYSTEM_PROMPT, user, schema: POST_SCHEMA, maxTokens: Math.min(8000, Math.max(1200, outTok * 2)) };
    const cached = await isCached(route, req);
    const est = estimate(route, { system: SYSTEM_PROMPT, user, outTok });
    if (!cached && !(await confirmBox(`ขัดเกลาด้วย ${route.label}\nประมาณ ${fmtCost(est)}`, { ok: 'ขัดเกลา' }))) return;
    toast(cached ? 'ใช้ผลเดิม (ไม่เสีย token)' : `กำลังขัดเกลาด้วย ${route.label}…`, 'info', 2500);
    try {
      const r = await callAI(route, req);
      const ch = channelOf(ctx.st.channel);
      const s = ch.subject ? splitSubject(r.data.variant1) : { subject: v.subject, body: String(r.data.variant1 || '').trim() };
      if (!s.body) throw new Error('AI ไม่ได้ส่งข้อความที่ขัดเกลากลับมา');
      v.orig = v.orig || { text: v.text, subject: v.subject };
      v.text = s.body;
      v.subject = s.subject || v.subject;
      v.postId = null;
      drawResults();
      if ((r.data.check || []).length) toast('AI ฝากตรวจ: ' + r.data.check.join(' · '), 'info', 7000);
    } catch (e) { toast(e.message, 'error', 6000); }
  }

  return {
    el,
    show(on) { el.hidden = !on; if (on) refresh(); },
    refresh,
    reset() { variants = []; meta = null; setKids(results); setKids(notes); },
  };
}
