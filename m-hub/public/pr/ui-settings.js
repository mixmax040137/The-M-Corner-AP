// หน้าตั้งค่า: API key (อยู่ในเบราว์เซอร์นี้เท่านั้น), โมเดล, ค่าเริ่มต้นการเขียน, โทนของฉัน, แฮชแท็ก/ลายเซ็น, สำรอง/นำเข้าข้อมูล
import { h, setKids, btn, field, select, seg, toast, confirmBox, pickFiles, download, text } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { repo, apiKey, newId } from './db.js';
import { TONES, LANGS, CHANNELS, KINDS, EVENT_TYPES } from './fields.js';
import { DEFAULT_STYLE } from './sample.js';

const MODELS = [
  ['claude-haiku-5-5', 'Claude Haiku 5.5 — เร็วและถูก (แนะนำสำหรับร่าง)'],
  ['claude-sonnet-5-5', 'Claude Sonnet 5.5 — ภาษาสละสลวยกว่า (แนะนำสำหรับขัดเกลา)'],
  ['claude-opus-5-5', 'Claude Opus 5.5 — ดีที่สุด ราคาสูง'],
];

let st;

export async function mount(el, app) {
  st = { app, el };
  st.usage = h('div');
  st.data = h('div');
  el.append(aiCard(), writingCard(), styleCard(), dataCard());
}

export async function show() { await drawUsage(); await drawData(); }

// ---------- AI ----------
function aiCard() {
  const s = st.app.settings;
  const keyIn = h('input', { type: 'password', autocomplete: 'off', 'aria-label': 'Anthropic API key', placeholder: apiKey.get() ? '•••••••• (บันทึกไว้แล้ว)' : 'sk-ant-…' });
  const keyState = h('span.small');
  const drawKey = () => {
    const k = apiKey.get();
    keyState.textContent = k ? `บันทึกไว้แล้ว (ลงท้าย …${k.slice(-4)})` : 'ยังไม่ได้ใส่ — โหมดเทมเพลตใช้งานได้ตามปกติโดยไม่ต้องมี key';
    keyState.className = k ? 'status-ok small' : 'muted small';
    keyIn.placeholder = k ? '•••••••• (บันทึกไว้แล้ว)' : 'sk-ant-…';
  };
  drawKey();
  const modelSel = (key, value) => {
    const custom = !MODELS.some(([m]) => m === value);
    const inp = h('input', { type: 'text', value: custom ? value : '', placeholder: 'หรือพิมพ์ชื่อรุ่นเอง', 'aria-label': 'ชื่อรุ่นกำหนดเอง', oninput: (e) => { if (e.target.value.trim()) st.app.saveSettings({ [key]: e.target.value.trim() }); } });
    return h('div.pr-stack', select([...MODELS, ['', 'อื่น ๆ (พิมพ์เอง)']], custom ? '' : value, (v) => { if (v) { inp.value = ''; st.app.saveSettings({ [key]: v }); } else inp.focus(); }), inp);
  };
  return h('section.card',
    h('h3.card-title', icon('sparkles'), 'AI (Claude ของ Anthropic)'),
    h('div.note.warn', 'API key เก็บไว้ในเบราว์เซอร์นี้เท่านั้น (localStorage) ไม่อยู่ในโค้ด ไม่อยู่ในไฟล์สำรองข้อมูล และไม่ถูกส่งไปที่อื่นนอกจาก Anthropic — แต่ใครใช้เครื่องและเบราว์เซอร์นี้ก็เปิดใช้ได้ แนะนำสร้าง key แยกสำหรับงานนี้ และตั้งวงเงินรายเดือนใน Anthropic Console'),
    field('Anthropic API key', h('div.row.wrap', h('div', { style: { flex: '1', minWidth: '240px' } }, keyIn),
      btn('บันทึก', () => { if (!keyIn.value.trim()) return toast('วาง key ก่อน', 'warn'); apiKey.set(keyIn.value); keyIn.value = ''; drawKey(); toast('บันทึก key ในเบราว์เซอร์นี้แล้ว', 'ok'); }, { ic: 'save', kind: 'primary' }),
      btn('ลบ key', () => { apiKey.set(''); drawKey(); toast('ลบ key แล้ว'); }, { kind: 'ghost' })), keyState),
    h('div.grid2',
      field('โมเดลสำหรับร่าง', modelSel('draftModel', s.draftModel)),
      field('โมเดลสำหรับขัดเกลา', modelSel('polishModel', s.polishModel))),
    h('div.hint', 'ก่อนเรียก AI ทุกครั้งจะแสดง token และค่าใช้จ่ายโดยประมาณให้เห็นก่อนกด และข้อมูลชุดเดิมกับตัวเลือกเดิมจะไม่ถูกส่งซ้ำ'),
    h('h4', 'การใช้ AI เดือนนี้'), st.usage);
}

async function drawUsage() {
  const month = new Date().toISOString().slice(0, 7);
  const logs = (await repo.list('usage')).filter((u) => String(u.at || '').startsWith(month));
  const sum = logs.reduce((a, u) => ({ n: a.n + (u.cached ? 0 : 1), cached: a.cached + (u.cached ? 1 : 0), inTok: a.inTok + (u.inTok || 0), outTok: a.outTok + (u.outTok || 0), cost: a.cost + (u.costUSD || 0) }), { n: 0, cached: 0, inTok: 0, outTok: 0, cost: 0 });
  setKids(st.usage, h('div.facts',
    h('div.fact', h('div', h('b', `${sum.n} ครั้ง`), h('div.muted.small', `ใช้ผลเดิมจากแคช ${sum.cached} ครั้ง (ไม่เสีย token)`))),
    h('div.fact', h('div', h('b', `${(sum.inTok + sum.outTok).toLocaleString()} token`), h('div.muted.small', `ส่งไป ${sum.inTok.toLocaleString()} · ได้กลับ ${sum.outTok.toLocaleString()}`))),
    h('div.fact', h('div', h('b', `$${sum.cost.toFixed(4)}`), h('div.muted.small', `≈ ${(sum.cost * 36).toFixed(2)} บาท (คิด 36 บาท/ดอลลาร์)`)))));
}

// ---------- การเขียน ----------
function writingCard() {
  const s = st.app.settings;
  const tonesBox = h('div.field-list');
  const drawTones = () => {
    const list = st.app.settings.customTones || [];
    setKids(tonesBox, ...list.map((t, i) => h('div.field-item',
      h('div.grid3',
        field('ชื่อโทน', h('input', { type: 'text', value: t.th, oninput: (e) => { t.th = e.target.value; save(); } })),
        field('ใช้เทมเพลตของโทน', select(TONES.map((x) => [x.id, x.th]), t.base, (v) => { t.base = v; t.emoji = (TONES.find((x) => x.id === v) || TONES[2]).emoji; save(); })),
        field('', btn('ลบ', () => { list.splice(i, 1); save(); drawTones(); }, { ic: 'trash', kind: 'ghost sm' }))),
      field('คำอธิบายโทน (ส่งให้ AI ใช้ในโหมด AI)', h('textarea', { rows: 2, value: t.desc || '', oninput: (e) => { t.desc = e.target.value; save(); } })))),
    btn('เพิ่มโทนของฉัน', () => { list.push({ id: newId('custom:'), th: 'โทนใหม่', base: 'semi', desc: '', emoji: [2, 4] }); save(); drawTones(); }, { ic: 'plus', kind: 'sm' }));
  };
  const save = () => st.app.saveSettings({ customTones: st.app.settings.customTones || [] });
  if (!s.customTones) s.customTones = [];
  drawTones();
  return h('section.card',
    h('h3.card-title', icon('pen'), 'ค่าเริ่มต้นการเขียน'),
    field('คำลงท้ายในโทนเป็นกันเอง', seg([['none', 'ไม่ใส่'], ['khrap', 'ครับ'], ['kha', 'ค่ะ / คะ']], s.particle, (v) => st.app.saveSettings({ particle: v })), 'ใช้กับเทมเพลตโทนภาษาพูด/วัยรุ่น และคำขึ้นต้น–ลงท้ายอีเมลแบบเป็นกันเอง'),
    h('div.grid4',
      field('ประเภทเริ่มต้น', select(KINDS.map((k) => [k.id, k.th]), s.kind, (v) => st.app.saveSettings({ kind: v }))),
      field('โทนเริ่มต้น', select(TONES.map((t) => [t.id, t.th]), s.tone, (v) => st.app.saveSettings({ tone: v }))),
      field('ภาษาเริ่มต้น', select(LANGS.map((l) => [l.id, l.th]), s.lang, (v) => st.app.saveSettings({ lang: v }))),
      field('ช่องทางเริ่มต้น', select(CHANNELS.map((c) => [c.id, c.th]), s.channel, (v) => st.app.saveSettings({ channel: v })))),
    h('h4', 'โทนของฉัน'),
    h('div.hint', 'สร้างโทนเฉพาะของหน่วยงาน เช่น “ทางการแต่อบอุ่น” โหมดเทมเพลตจะใช้เทมเพลตของโทนที่เลือกเป็นฐาน'),
    tonesBox);
}

// ---------- แฮชแท็ก ลายเซ็น ชื่อคณะ ----------
function styleCard() {
  const box = h('div.pr-stack');
  const draw = () => {
    const sy = st.app.style;
    const tags = sy.hashtags || [];
    const save = () => st.app.saveStyle({ hashtags: tags, signatures: sy.signatures, facultyTh: sy.facultyTh, facultyEn: sy.facultyEn });
    setKids(box, 
      h('div.grid2',
        field('ชื่อคณะ (ไทย) ใช้เมื่อกล่าวถึงครั้งแรก', text(sy.facultyTh, (v) => { sy.facultyTh = v; save(); })),
        field('ชื่อคณะ (อังกฤษ)', text(sy.facultyEn, (v) => { sy.facultyEn = v; save(); }))),
      h('h4', 'ชุดแฮชแท็ก'),
      h('div.field-list', tags.map((t, i) => h('div.field-item',
        h('div.grid3',
          field('ชื่อชุด', text(t.label, (v) => { t.label = v; save(); })),
          field('ใช้กับช่องทาง', select([['*', 'ทุกช่องทาง'], ...CHANNELS.map((c) => [c.id, c.th])], t.channel || '*', (v) => { t.channel = v; save(); })),
          field('ใช้กับประเภทงาน', select([['*', 'ทุกประเภท'], ...EVENT_TYPES.map((e) => [e.id, e.label])], t.eventType || '*', (v) => { t.eventType = v; save(); }))),
        h('div.row', h('div', { style: { flex: '1' } }, text(t.tags, (v) => { t.tags = v; save(); }, { 'aria-label': 'แฮชแท็ก', placeholder: '#แท็ก1 #แท็ก2' })),
          btn('', () => { tags.splice(i, 1); save(); draw(); }, { ic: 'trash', kind: 'icon-only sm', title: 'ลบชุดนี้' }))))),
      btn('เพิ่มชุดแฮชแท็ก', () => { tags.push({ id: newId('h'), label: 'ชุดใหม่', channel: '*', eventType: '*', tags: '' }); save(); draw(); }, { ic: 'plus', kind: 'sm' }),
      h('div.hint', 'จำนวนที่ใส่อัตโนมัติ: Facebook 3, Instagram 6, X 2, ข้อความโปสเตอร์ 1 (โทนราชการไม่เกิน 2) · ชุดที่ระบุประเภทงานจะถูกใช้ก่อน'),
      h('h4', 'ลายเซ็น (อีเมลและหนังสือเวียน)'),
      h('div.grid2', ...['th', 'en'].map((lang) => {
        let sig = (sy.signatures || []).find((x) => x.lang === lang);
        if (!sig) { sig = { id: newId('s'), lang, text: '' }; (sy.signatures ||= []).push(sig); }
        return field(lang === 'th' ? 'ภาษาไทย' : 'English', h('textarea', { rows: 3, value: sig.text, oninput: (e) => { sig.text = e.target.value; save(); } }));
      })),
      h('div.row', btn('คืนค่าเริ่มต้น', async () => {
        if (!(await confirmBox('คืนค่าชื่อคณะ แฮชแท็ก และลายเซ็นเป็นค่าเริ่มต้น?', { ok: 'คืนค่า' }))) return;
        await st.app.saveStyle({ facultyTh: DEFAULT_STYLE.facultyTh, facultyEn: DEFAULT_STYLE.facultyEn, hashtags: structuredClone(DEFAULT_STYLE.hashtags), signatures: structuredClone(DEFAULT_STYLE.signatures) });
        draw();
      }, { kind: 'ghost' })));
  };
  draw();
  return h('section.card', h('h3.card-title', icon('type'), 'ชื่อคณะ แฮชแท็ก และลายเซ็น'), box);
}

// ---------- ข้อมูล ----------
function dataCard() {
  return h('section.card',
    h('h3.card-title', icon('save'), 'สำรอง / นำเข้าข้อมูล'),
    h('p.small', 'ข้อมูลทั้งหมด (งาน เทมเพลต โพสต์ ค่าตั้ง) อยู่ในเบราว์เซอร์นี้ ควรกด “ส่งออก” เก็บไฟล์ไว้เป็นระยะ และใช้ไฟล์เดียวกันย้ายไปเครื่องเพื่อนร่วมงานได้ — ตอนนำเข้า รายการที่แก้ล่าสุดจะเป็นตัวที่ใช้ (API key ไม่อยู่ในไฟล์)'),
    h('div.row.wrap',
      btn('ส่งออกข้อมูลทั้งหมด (.json)', async () => {
        const json = await repo.exportAll();
        download(new Blob([JSON.stringify(json, null, 1)], { type: 'application/json' }), `larts-pr-backup-${new Date().toISOString().slice(0, 10)}.json`);
        await repo.setMeta('lastBackup', new Date().toISOString());
        drawData();
      }, { ic: 'download', kind: 'primary' }),
      btn('นำเข้าจากไฟล์ (.json)', async () => {
        const [f] = await pickFiles({ accept: '.json,application/json', multiple: false });
        if (!f) return;
        try {
          const r = await repo.importAll(JSON.parse(await f.file.text()));
          toast(`นำเข้าแล้ว: เพิ่ม ${r.added} · อัปเดต ${r.updated} · คงเดิม ${r.kept}`, 'ok', 5000);
          drawData();
        } catch (e) { toast('นำเข้าไม่ได้: ' + e.message, 'error', 5000); }
      }, { ic: 'upload' })),
    st.data);
}

async function drawData() {
  const [events, posts, templates] = await Promise.all([repo.list('events'), repo.list('posts'), repo.list('templates')]);
  const samples = events.filter((e) => e.sample).length + posts.filter((p) => p.sample).length;
  const last = await repo.getMeta('lastBackup', null);
  setKids(st.data, 
    h('div.muted.small', `งาน ${events.length} · โพสต์ ${posts.length} · เทมเพลตของฉัน ${templates.length}${last ? ` · สำรองล่าสุด ${new Date(last).toLocaleString('th-TH')}` : ' · ยังไม่เคยสำรอง'}`),
    h('div.row.wrap',
      samples ? btn(`ลบข้อมูลตัวอย่าง (${samples} รายการ)`, async () => {
        if (!(await confirmBox('ลบงานและโพสต์ตัวอย่างทั้งหมด? (ข้อมูลที่คุณสร้างเองไม่ถูกลบ)', { ok: 'ลบข้อมูลตัวอย่าง', danger: true }))) return;
        const n = await repo.removeSamples();
        toast(`ลบข้อมูลตัวอย่าง ${n} รายการแล้ว`, 'ok');
        drawData();
      }, { ic: 'trash' }) : null,
      btn('ล้างข้อมูลทั้งหมดในเบราว์เซอร์นี้', async () => {
        if (!(await confirmBox('ล้างงาน เทมเพลต โพสต์ และค่าตั้งทั้งหมด? ควรส่งออกไฟล์สำรองก่อน', { ok: 'ล้างทั้งหมด', danger: true }))) return;
        if (!(await confirmBox('ยืนยันอีกครั้ง: ลบแล้วกู้คืนไม่ได้ (ถ้าไม่มีไฟล์สำรอง)', { ok: 'ยืนยันล้างข้อมูล', danger: true }))) return;
        await repo.wipeAll();
        await repo.setMeta('samplesRemoved', true);
        toast('ล้างข้อมูลแล้ว');
        drawData();
      }, { ic: 'trash', kind: 'danger' })));
}
