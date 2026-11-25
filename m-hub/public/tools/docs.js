// เครื่องมือ: ออกเอกสารจากเทมเพลต
// ข้อมูลรายชื่อ 1 ชุด → อีเมลเป็นชุด / เกียรติบัตร ป้ายชื่อ จดหมาย PDF / เอกสาร Word รายคน
import { h, btn, field, select, step, toast, progressBar, safeName, fillTemplate, templateKeys, checkbox, text, debounce,
  presetBar, pickFiles, copyText, download, tabs, nextFrame, splitExt } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { dataSource, guessColumn } from '../core/data.js';
import { outputChooser, openSink } from '../core/output.js';
import { fsSupported, pickDirectory, walkDirectory } from '../core/workspace.js';
import * as store from '../core/store.js';
import { thaiDate, enDate } from '../core/thai.js';
import { buildEml, gmailLink, outlookLink, mailtoLink, toCsv, splitEmails } from '../core/eml.js';
import { designerTab } from './docs-designer.js';

const SAMPLE = [
  ['คำนำหน้า', 'ชื่อ', 'นามสกุล', 'ตำแหน่ง', 'หน่วยงาน', 'อีเมล'],
  ['ผศ.ดร.', 'สมชาย', 'ใจดี', 'อาจารย์ประจำสาขาภาษาอังกฤษ', 'คณะศิลปศาสตร์', 'somchai@example.com'],
  ['นางสาว', 'สมหญิง', 'รักเรียน', 'นักวิชาการศึกษา', 'กองบริการการศึกษา', 'somying@example.com'],
  ['นาย', 'ปิยะ', 'มีสุข', 'นักศึกษาปริญญาโท', 'สาขาภาษาศาสตร์', 'piya@example.com'],
  ['รศ.', 'วิไล', 'แสงทอง', 'รองคณบดีฝ่ายวิชาการ', 'คณะศิลปศาสตร์', 'wilai@example.com'],
  ['Dr.', 'John', 'Smith', 'Visiting Professor', 'University of Example', 'john.smith@example.com'],
];

const DEFAULT_CONSTANTS = `ชื่องาน = การสัมมนาวิชาการ “ภาษาและวัฒนธรรมในยุคดิจิทัล”
วันที่จัด = 15 ธันวาคม 2569 เวลา 09.00–16.00 น.
สถานที่ = ห้องประชุมคณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์ ท่าพระจันทร์
ผู้ลงนาม = ชื่อ นามสกุล ผู้ลงนาม
ตำแหน่งผู้ลงนาม = คณบดีคณะศิลปศาสตร์
ผู้ส่ง = งานประชาสัมพันธ์ คณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์`;

const EMAIL_TEMPLATES = {
  'เชิญเข้าร่วมงาน (ทางการ)': {
    subject: 'ขอเรียนเชิญเข้าร่วม{{ชื่องาน}}',
    body: `เรียน {{คำนำหน้า}}{{ชื่อ}} {{นามสกุล}}

ด้วยคณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์ กำหนดจัด{{ชื่องาน}} ในวันที่ {{วันที่จัด}} ณ {{สถานที่}}

ในการนี้ คณะฯ จึงใคร่ขอเรียนเชิญท่านเข้าร่วมงานดังกล่าว ทั้งนี้ ขอความกรุณาตอบรับการเข้าร่วมภายในวันที่ ...

จึงเรียนมาเพื่อโปรดพิจารณา และขอขอบพระคุณมา ณ โอกาสนี้

ขอแสดงความนับถือ

{{ผู้ส่ง}}`,
  },
  'ขอความอนุเคราะห์ (ทางการ)': {
    subject: 'ขอความอนุเคราะห์ {{ชื่องาน}}',
    body: `เรียน {{คำนำหน้า}}{{ชื่อ}} {{นามสกุล}}

ด้วยคณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์ มีกำหนดจัด{{ชื่องาน}} ในวันที่ {{วันที่จัด}} ณ {{สถานที่}}

ในการนี้ คณะฯ พิจารณาแล้วเห็นว่าท่านเป็นผู้มีความรู้ ความสามารถ และประสบการณ์ในเรื่องดังกล่าวเป็นอย่างดี จึงใคร่ขอความอนุเคราะห์จากท่าน ...

จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์ และขอขอบพระคุณมา ณ โอกาสนี้

ขอแสดงความนับถือ

{{ผู้ส่ง}}`,
  },
  'ขอบคุณ / ส่งเกียรติบัตร': {
    subject: 'ขอขอบคุณที่เข้าร่วม{{ชื่องาน}}',
    body: `เรียน {{คำนำหน้า}}{{ชื่อ}} {{นามสกุล}}

คณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์ ขอขอบพระคุณท่านเป็นอย่างสูงที่ได้ให้เกียรติเข้าร่วม{{ชื่องาน}} เมื่อวันที่ {{วันที่จัด}}

คณะฯ ได้แนบเกียรติบัตรของท่านมาพร้อมนี้

ขอแสดงความนับถือ

{{ผู้ส่ง}}`,
  },
  'Formal invitation (English)': {
    subject: 'Invitation to {{ชื่องาน}}',
    body: `Dear {{คำนำหน้า}} {{ชื่อ}} {{นามสกุล}},

On behalf of the Faculty of Liberal Arts, Thammasat University, it is my pleasure to invite you to {{ชื่องาน}}, which will be held on {{วันที่จัด}} at {{สถานที่}}.

We would be grateful if you could kindly confirm your participation at your earliest convenience.

Yours sincerely,

{{ผู้ส่ง}}`,
  },
};

export function parseConstants(textValue) {
  const o = {};
  for (const line of String(textValue).split('\n')) {
    const m = line.match(/^\s*([^=:]+?)\s*[=:]\s*(.*)$/);
    if (m && m[1]) o[m[1].trim()] = m[2].trim();
  }
  return o;
}

export async function mount(root) {
  // ---------- ข้อมูลกลางที่ทุกแท็บใช้ร่วมกัน ----------
  const rowListeners = new Set();
  let constants = parseConstants(DEFAULT_CONSTANTS);
  let generated = null; // ไฟล์ที่สร้างล่าสุด (เกียรติบัตร/Word) สำหรับแนบอีเมลรายคน
  const genListeners = new Set();
  const ds = dataSource({ sample: SAMPLE, onChange: () => { for (const fn of rowListeners) fn(); } });
  const shared = {
    rows: () => ds.state.rows,
    headers: () => ds.state.headers,
    vars: (row, i) => ({ วันนี้: thaiDate(), today: enDate(), ลำดับ: String(i + 1), ...constants, ...row }),
    onRows: (fn) => rowListeners.add(fn),
    knownKeys: () => new Set(['วันนี้', 'today', 'ลำดับ', ...Object.keys(constants), ...ds.state.headers]),
    defaultFileName: () => {
      const hd = ds.state.headers;
      if (hd.includes('ชื่อ') && hd.includes('นามสกุล')) return '{{ชื่อ}} {{นามสกุล}}';
      return `{{${guessColumn(hd, [/ชื่อ|name/i]) || hd[0] || 'ลำดับ'}}}`;
    },
    setGenerated: (files, label) => { generated = { files, label }; for (const fn of genListeners) fn(); },
    get generated() { return generated; },
    onGenerated: (fn) => genListeners.add(fn),
  };

  const constBox = h('textarea', { rows: 6, value: DEFAULT_CONSTANTS });
  const savedConst = await store.get('docs:constants');
  if (savedConst != null) { constBox.value = savedConst; constants = parseConstants(savedConst); }
  constBox.addEventListener('input', debounce(() => {
    constants = parseConstants(constBox.value);
    store.set('docs:constants', constBox.value);
    for (const fn of rowListeners) fn();
  }, 250));

  const t = tabs([
    { id: 'email', label: 'อีเมลเป็นชุด', icon: 'mail', render: () => emailTab(shared) },
    { id: 'pdf', label: 'เกียรติบัตร / ป้ายชื่อ / จดหมาย PDF', icon: 'award', render: () => designerTab(shared) },
    { id: 'word', label: 'เอกสาร Word รายคน', icon: 'word', render: () => wordTab(shared) },
  ]);

  root.append(
    h('p.intro', 'ใส่รายชื่อครั้งเดียว แล้วสร้างอีเมล เกียรติบัตร ป้ายชื่อ หรือจดหมายแยกรายคนได้ทั้งชุด — ใช้ {{ชื่อคอลัมน์}} เป็นตัวแทนข้อมูลของแต่ละคน'),
    step(1, 'ข้อมูลรายชื่อ', ds.el,
      h('details', h('summary', h('b', 'ข้อมูลกลาง'), h('span.muted', ' — ค่าที่ใช้เหมือนกันทุกคน เช่น ชื่องาน วันที่ สถานที่ (เขียนบรรทัดละ 1 ค่า: ชื่อ = ค่า)')),
        h('div', { style: { marginTop: '8px' } }, constBox, h('div.hint', 'ตัวแทนอัตโนมัติ: {{วันนี้}} = ' + thaiDate() + ' · {{today}} = ' + enDate() + ' · {{ลำดับ}} = 1, 2, 3 …')))),
    step(2, 'เลือกสิ่งที่จะสร้าง', t.el),
  );
}

// ======================= แท็บอีเมลเป็นชุด =======================
function emailTab(shared) {
  const st = { toCol: '', cc: '', subject: EMAIL_TEMPLATES['เชิญเข้าร่วมงาน (ทางการ)'].subject, body: EMAIL_TEMPLATES['เชิญเข้าร่วมงาน (ทางการ)'].body, attachCol: '', useGenerated: false };
  const common = []; // ไฟล์แนบที่ทุกฉบับได้เหมือนกัน
  const perPerson = new Map(); // ชื่อไฟล์ (ตัวเล็ก) → File
  let cur = 0;
  let lastFocus = null;

  const subj = text(st.subject, (v) => { st.subject = v; update(); });
  const body = h('textarea', { rows: 14, value: st.body, oninput: (e) => { st.body = e.target.value; update(); } });
  for (const el of [subj, body]) el.addEventListener('focus', () => (lastFocus = el));
  const toWrap = h('span'), attachColWrap = h('span');
  const chips = h('div.chips');
  const warn = h('div');
  const preview = h('div.email-card');
  const navLabel = h('span.muted.small');
  const listWrap = h('div.table-wrap', { style: { maxHeight: '320px' } });
  const attachInfo = h('div.hint');
  const genBox = h('div');

  const insert = (token) => {
    const el = lastFocus || body;
    const s = el.selectionStart ?? el.value.length, e = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, s) + token + el.value.slice(e);
    el.focus();
    el.selectionStart = el.selectionEnd = s + token.length;
    el.dispatchEvent(new Event('input'));
  };

  function email(i) {
    const r = shared.rows()[i];
    const v = shared.vars(r, i);
    const to = fillTemplate(st.toCol ? `{{${st.toCol}}}` : '', v);
    const name = [v['คำนำหน้า'], v['ชื่อ'], v['นามสกุล']].filter(Boolean).join(' ').trim();
    return { to, toHeader: splitEmails(to).map((e) => (name ? `${name} <${e}>` : e)).join(', '), cc: st.cc, subject: fillTemplate(st.subject, v), text: fillTemplate(st.body, v), row: r, i };
  }

  function attachmentsFor(i, r) {
    const list = [...common];
    if (st.attachCol && r) {
      for (const want of String(r[st.attachCol] || '').split(/[,;]/).map((x) => x.trim().toLowerCase()).filter(Boolean)) {
        const f = perPerson.get(want) || perPerson.get(splitExt(want)[0]);
        if (f) list.push(f);
      }
    }
    if (st.useGenerated && shared.generated && shared.generated.files[i]) {
      const g = shared.generated.files[i];
      list.push(new File([g.blob], g.name, { type: g.type }));
    }
    return list;
  }

  function update() {
    const hd = shared.headers();
    if (!hd.includes(st.toCol)) st.toCol = guessColumn(hd, [/อีเมล|e-?mail|เมล/i]) || '';
    toWrap.replaceChildren(field('ส่งถึง (คอลัมน์อีเมล)', select([['', '— เลือกคอลัมน์ —'], ...hd], st.toCol, (v) => { st.toCol = v; update(); })));
    attachColWrap.replaceChildren(field('คอลัมน์ชื่อไฟล์แนบรายคน', select([['', '— ไม่ใช้ —'], ...hd], st.attachCol, (v) => { st.attachCol = v; update(); })));
    const known = shared.knownKeys();
    chips.replaceChildren(h('span.muted.small', 'คลิกเพื่อแทรก:'), [...known].map((k) => h('button.chip', { type: 'button', onclick: () => insert(`{{${k}}}`) }, `{{${k}}}`)));
    const unknown = [...new Set([...templateKeys(st.subject), ...templateKeys(st.body)].filter((k) => !known.has(k)))];
    const rows = shared.rows();
    const noEmail = rows.filter((r, i) => !splitEmails(email(i).to).length).length;
    warn.replaceChildren(
      unknown.length ? h('div.note.warn', 'ไม่พบข้อมูลของ: ' + unknown.map((k) => `{{${k}}}`).join(', ') + ' — เพิ่มเป็นคอลัมน์ใน Excel หรือใน “ข้อมูลกลาง”') : '',
      rows.length && noEmail ? h('div.note.warn', `${noEmail} แถวไม่มีอีเมลที่ถูกต้อง`) : '');
    cur = Math.min(cur, Math.max(0, rows.length - 1));
    renderPreview();
    renderList();
    attachInfo.textContent = `แนบทุกฉบับ ${common.length} ไฟล์${perPerson.size ? ` · ไฟล์รายคนที่เลือกไว้ ${perPerson.size} ไฟล์` : ''}`;
    const g = shared.generated;
    genBox.replaceChildren(g ? h('div.note.info', checkbox(`แนบไฟล์ที่สร้างจากแท็บ “${g.label}” ของแต่ละคน (${g.files.filter(Boolean).length} ไฟล์)`, st.useGenerated, (v) => { st.useGenerated = v; update(); })) : '');
  }
  const updateSoon = debounce(update, 150);

  function renderPreview() {
    const rows = shared.rows();
    if (!rows.length) { preview.replaceChildren(h('div.muted', 'ใส่ข้อมูลรายชื่อในขั้นที่ 1 เพื่อดูตัวอย่าง')); navLabel.textContent = ''; return; }
    const m = email(cur);
    const att = attachmentsFor(cur, m.row);
    navLabel.textContent = `ฉบับที่ ${cur + 1} / ${rows.length}`;
    preview.replaceChildren(
      h('div.email-head', h('b', 'ถึง:'), m.toHeader || h('span.status-err', '(ไม่มีอีเมล)')),
      m.cc ? h('div.email-head', h('b', 'สำเนา:'), m.cc) : '',
      h('div.email-head', h('b', 'เรื่อง:'), m.subject),
      att.length ? h('div.email-head', h('b', 'แนบ:'), att.map((f) => f.name).join(', ')) : '',
      h('pre', m.text),
      h('div.row.wrap',
        h('a.btn.sm', { href: gmailLink(m), target: '_blank', rel: 'noopener' }, icon('external'), 'เปิดใน Gmail'),
        h('a.btn.sm', { href: outlookLink(m), target: '_blank', rel: 'noopener' }, icon('external'), 'Outlook เว็บ'),
        h('a.btn.sm', { href: mailtoLink(m) }, icon('mail'), 'โปรแกรมอีเมลในเครื่อง'),
        btn('คัดลอก', () => copyText(`ถึง: ${m.to}\nเรื่อง: ${m.subject}\n\n${m.text}`), { ic: 'copy', kind: 'sm' })),
      att.length ? h('div.hint', 'ลิงก์ Gmail / Outlook แนบไฟล์ให้อัตโนมัติไม่ได้ — ใช้ปุ่ม “ดาวน์โหลดฉบับร่าง .eml” เพื่อได้อีเมลพร้อมไฟล์แนบ') : '');
  }

  function renderList() {
    const rows = shared.rows();
    if (!rows.length) { listWrap.replaceChildren(); return; }
    listWrap.replaceChildren(h('table.table',
      h('thead', h('tr', h('th', '#'), h('th', 'ถึง'), h('th', 'เรื่อง'), h('th', 'เปิดเขียน'))),
      h('tbody', rows.map((r, i) => {
        const m = email(i);
        return h('tr', { style: { background: i === cur ? 'var(--accent-soft)' : '' } },
          h('td.muted', i + 1),
          h('td', { style: { cursor: 'pointer' }, onclick: () => { cur = i; renderPreview(); renderList(); } }, m.to || h('span.status-err', 'ไม่มีอีเมล')),
          h('td', { style: { cursor: 'pointer' }, onclick: () => { cur = i; renderPreview(); renderList(); } }, m.subject),
          h('td', h('div.row', h('a.btn.sm', { href: gmailLink(m), target: '_blank', rel: 'noopener' }, 'Gmail'), h('a.btn.sm', { href: outlookLink(m), target: '_blank', rel: 'noopener' }, 'Outlook'))));
      }))));
  }

  const out = outputChooser('docs-eml');
  const prog = progressBar();
  const resultBox = h('div');

  async function exportEml() {
    const rows = shared.rows();
    if (!rows.length) return toast('ยังไม่มีข้อมูลรายชื่อ', 'warn');
    let sink;
    try { sink = await openSink(out.mode, { zipName: `อีเมล-${rows.length}-ฉบับ.zip`, dirId: 'mhub-eml-out' }); }
    catch (e) { if (e.name !== 'AbortError') toast(e.message, 'error'); return; }
    for (let i = 0; i < rows.length; i++) {
      prog.set(i, rows.length);
      const m = email(i);
      const files = attachmentsFor(i, m.row);
      const attachments = [];
      for (const f of files) attachments.push({ name: f.name, type: f.type, data: new Uint8Array(await f.arrayBuffer()) });
      const eml = buildEml({ to: m.toHeader, cc: m.cc, subject: m.subject, text: m.text, attachments });
      const who = safeName([m.row['ชื่อ'], m.row['นามสกุล']].filter(Boolean).join(' ') || splitEmails(m.to)[0] || 'ฉบับ', 'ฉบับ');
      await sink.write(`${String(i + 1).padStart(3, '0')} ${who}.eml`, new Blob([eml], { type: 'message/rfc822' }));
      if (i % 10 === 9) await nextFrame();
    }
    prog.hide();
    const res = await sink.close();
    resultBox.replaceChildren(h('div.note.ok', `สร้างฉบับร่าง ${res.count} ฉบับ → ${res.where}`),
      h('div.hint', 'ดับเบิลคลิกไฟล์ .eml เพื่อเปิดใน Outlook (เปิดเป็นฉบับร่าง กดส่งได้ทันที) · Apple Mail: เปิดแล้วเลือก “ส่งอีกครั้ง” · Thunderbird: “แก้ไขเป็นข้อความใหม่”'));
  }

  function exportCsv() {
    const rows = shared.rows();
    if (!rows.length) return toast('ยังไม่มีข้อมูลรายชื่อ', 'warn');
    const data = rows.map((r, i) => { const m = email(i); return { to: splitEmails(m.to).join(', '), cc: m.cc, subject: m.subject, body: m.text }; });
    download(new Blob([toCsv(data, ['to', 'cc', 'subject', 'body'])], { type: 'text/csv' }), `อีเมล-${rows.length}-ฉบับ.csv`);
  }

  const bar = presetBar(store.presets('docs-email'), {
    builtins: EMAIL_TEMPLATES,
    getData: () => ({ subject: st.subject, body: st.body, cc: st.cc }),
    apply: (d) => { st.subject = d.subject || ''; st.body = d.body || ''; st.cc = d.cc || ''; subj.value = st.subject; body.value = st.body; ccInput.value = st.cc; update(); },
  });
  const ccInput = text(st.cc, (v) => { st.cc = v; updateSoon(); }, { placeholder: 'เช่น pr@arts.tu.ac.th (ไม่บังคับ)' });

  shared.onRows(updateSoon);
  shared.onGenerated(update);
  update();

  return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px' } },
    bar,
    h('div.split',
      h('div.card',
        h('h3.card-title', icon('mail'), 'เทมเพลตอีเมล'),
        h('div.grid2', toWrap, field('สำเนา (CC)', ccInput)),
        field('หัวเรื่อง', subj),
        field('เนื้อความ', body),
        chips, warn, genBox,
        h('details',
          h('summary', h('b', 'ไฟล์แนบ'), ' ', attachInfo),
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' } },
            h('div.row.wrap',
              btn('แนบไฟล์เดียวกันทุกฉบับ', async () => { for (const x of await pickFiles()) common.push(x.file); update(); }, { ic: 'plus', kind: 'sm' }),
              btn('เลือกไฟล์แนบรายคน', async () => {
                let list;
                if (fsSupported) { try { list = await walkDirectory(await pickDirectory('mhub-attach', 'read'), { recursive: false }); } catch (e) { if (e.name !== 'AbortError') toast(e.message, 'error'); return; } }
                else list = await pickFiles();
                for (const x of list) { perPerson.set(x.file.name.toLowerCase(), x.file); perPerson.set(splitExt(x.file.name.toLowerCase())[0], x.file); }
                update();
                toast(`เลือกไฟล์รายคน ${list.length} ไฟล์ — ระบุคอลัมน์ชื่อไฟล์ด้านล่าง`, 'ok');
              }, { ic: 'folder', kind: 'sm' }),
              btn('ล้างไฟล์แนบ', () => { common.length = 0; perPerson.clear(); update(); }, { kind: 'sm ghost' })),
            attachColWrap))),
      h('div.card',
        h('div.row', h('h3.card-title', 'ตัวอย่าง'), h('span.spacer'),
          btn('', () => { cur = Math.max(0, cur - 1); renderPreview(); renderList(); }, { ic: 'left', kind: 'icon-only', title: 'ฉบับก่อนหน้า' }),
          navLabel,
          btn('', () => { cur = Math.min(shared.rows().length - 1, cur + 1); renderPreview(); renderList(); }, { ic: 'right', kind: 'icon-only', title: 'ฉบับถัดไป' })),
        preview, listWrap)),
    h('div.card',
      h('h3.card-title', icon('download'), 'ส่งออกทั้งชุด'),
      h('div.grid2', out.el),
      h('div.row.wrap',
        btn('ดาวน์โหลดฉบับร่าง .eml ทั้งหมด', exportEml, { kind: 'primary big', ic: 'mail' }),
        btn('ส่งออก CSV (สำหรับ Mail Merge)', exportCsv, { ic: 'table' })),
      h('div.hint', 'ฉบับร่าง .eml มีไฟล์แนบครบ เปิดใน Outlook แล้วกดส่งได้เลย · CSV ใช้กับ Mail Merge ของ Gmail (เช่น YAMM, GMass) หรือ Word/Outlook'),
      prog.el, resultBox));
}

// ======================= แท็บ Word =======================
function wordTab(shared) {
  let tplBuf = null, tplName = '';
  let found = [];
  let fileName = '';
  const info = h('div');
  const out = outputChooser('docs-word');
  const prog = progressBar();
  const resultBox = h('div');

  async function lib() { return import('../vendor/docx.mjs'); }
  const options = () => ({ delimiters: { start: '{{', end: '}}' }, paragraphLoop: true, linebreaks: true, nullGetter: () => '' });

  async function loadTemplate(file) {
    try {
      const { Docxtemplater, PizZip } = await lib();
      const buf = await file.arrayBuffer();
      const doc = new Docxtemplater(new PizZip(buf), options());
      found = [...new Set(templateKeys(doc.getFullText()))];
      tplBuf = buf; tplName = file.name;
      render();
    } catch (e) {
      toast('อ่านไฟล์ Word ไม่ได้: ' + (e.properties?.errors?.[0]?.properties?.explanation || e.message), 'error', 7000);
    }
  }

  function render() {
    if (!tplBuf) { info.replaceChildren(h('div.muted', 'ยังไม่ได้เลือกไฟล์เทมเพลต')); return; }
    const known = shared.knownKeys();
    const missing = found.filter((k) => !known.has(k));
    info.replaceChildren(
      h('div.note.ok', `เทมเพลต: ${tplName} · พบตัวแทน ${found.length} ตัว`),
      h('div.chips', found.map((k) => h('span.tag', { style: known.has(k) ? null : { background: 'var(--warn-soft)', color: 'var(--warn)' } }, `{{${k}}}`))),
      missing.length ? h('div.note.warn', 'ยังไม่มีข้อมูลของ: ' + missing.map((k) => `{{${k}}}`).join(', ') + ' (จะเว้นว่าง)') : '');
  }
  shared.onRows(render);

  async function generate() {
    const rows = shared.rows();
    if (!tplBuf) return toast('เลือกไฟล์เทมเพลต Word ก่อน', 'warn');
    if (!rows.length) return toast('ใส่ข้อมูลรายชื่อในขั้นที่ 1 ก่อน', 'warn');
    let sink;
    try { sink = await openSink(out.mode, { zipName: `เอกสาร-Word-${rows.length}-ไฟล์.zip`, dirId: 'mhub-word-out' }); }
    catch (e) { if (e.name !== 'AbortError') toast(e.message, 'error'); return; }
    const { Docxtemplater, PizZip } = await lib();
    const nameTpl = fileName || shared.defaultFileName();
    const generated = [];
    const used = new Map();
    try {
      for (let i = 0; i < rows.length; i++) {
        prog.set(i, rows.length);
        const vars = shared.vars(rows[i], i);
        const doc = new Docxtemplater(new PizZip(tplBuf), options());
        doc.render(vars);
        const bytes = doc.getZip().generate({ type: 'uint8array', compression: 'DEFLATE' });
        let base = safeName(fillTemplate(nameTpl, vars), `เอกสาร-${i + 1}`);
        const n = (used.get(base) || 0) + 1; used.set(base, n);
        if (n > 1) base += `-${n}`;
        const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        await sink.write(base + '.docx', blob);
        generated[i] = { name: base + '.docx', type: blob.type, blob };
        if (i % 5 === 4) await nextFrame();
      }
      const res = await sink.close();
      shared.setGenerated(generated, 'เอกสาร Word');
      resultBox.replaceChildren(h('div.note.ok', `สร้างเอกสาร ${res.count} ไฟล์ → ${res.where}`), h('div.hint', 'ต้องการ PDF: เปิดใน Word แล้ว “บันทึกเป็น PDF” หรือใช้แท็บ “เกียรติบัตร / ป้ายชื่อ / จดหมาย PDF”'));
    } catch (e) {
      console.error(e);
      toast('สร้างไม่สำเร็จ: ' + e.message, 'error');
    } finally { prog.hide(); }
  }

  render();
  return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px' } },
    h('div.card',
      h('h3.card-title', icon('word'), 'เทมเพลต Word'),
      h('p.intro', 'ทำจดหมาย/เอกสารใน Word ตามปกติ แล้วพิมพ์ {{ชื่อคอลัมน์}} ตรงจุดที่ต้องการเติมข้อมูล เช่น เรียน {{คำนำหน้า}}{{ชื่อ}} {{นามสกุล}} — รูปแบบ ฟอนต์ ตราครุฑ หัวกระดาษ คงเดิมทั้งหมด'),
      h('div.row.wrap',
        btn('เปิดไฟล์ Word (.docx)', async () => { const [f] = await pickFiles({ accept: '.docx', multiple: false }); if (f) loadTemplate(f.file); }, { kind: 'primary', ic: 'word' }),
        btn('ดาวน์โหลดเทมเพลตตัวอย่าง', async () => download(await sampleDocx(), 'เทมเพลตจดหมายตัวอย่าง.docx'), { ic: 'download', kind: 'ghost' })),
      info),
    h('div.card',
      h('h3.card-title', icon('download'), 'สร้างเอกสารรายคน'),
      h('div.grid2', field('ชื่อไฟล์', text(fileName, (v) => (fileName = v), { placeholder: 'ค่าเริ่มต้น: {{ชื่อ}} {{นามสกุล}}' })), out.el),
      h('div.row', btn('สร้างไฟล์ Word', generate, { kind: 'primary big', ic: 'play' })),
      prog.el, resultBox));
}

// เทมเพลตจดหมาย .docx ตัวอย่าง (สร้างในเบราว์เซอร์)
async function sampleDocx() {
  const { zipSync, strToU8 } = await import('../vendor/fflate.mjs');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const run = (t, bold) => `<w:r><w:rPr><w:rFonts w:ascii="TH SarabunPSK" w:hAnsi="TH SarabunPSK" w:cs="TH SarabunPSK"/>${bold ? '<w:b/><w:bCs/>' : ''}<w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr><w:t xml:space="preserve">${esc(t)}</w:t></w:r>`;
  const p = (t, { jc = 'left', indent = false, bold = false, before = 0 } = {}) =>
    `<w:p><w:pPr><w:spacing w:before="${before}" w:after="0"/>${indent ? '<w:ind w:firstLine="1440"/>' : ''}<w:jc w:val="${jc}"/></w:pPr>${run(t, bold)}</w:p>`;
  const body = [
    p('ที่ อว ...', { jc: 'left' }), p('คณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์', { jc: 'right' }),
    p('{{วันนี้}}', { jc: 'center', before: 240 }),
    p('เรื่อง   ขอเรียนเชิญเข้าร่วม{{ชื่องาน}}', { before: 240 }),
    p('เรียน   {{คำนำหน้า}}{{ชื่อ}} {{นามสกุล}}', { before: 120 }),
    p('ด้วยคณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์ กำหนดจัด{{ชื่องาน}} ในวันที่ {{วันที่จัด}} ณ {{สถานที่}}', { jc: 'thaiDistribute', indent: true, before: 240 }),
    p('ในการนี้ คณะฯ จึงใคร่ขอเรียนเชิญท่านซึ่งดำรงตำแหน่ง{{ตำแหน่ง}} {{หน่วยงาน}} เข้าร่วมงานดังกล่าว', { jc: 'thaiDistribute', indent: true, before: 120 }),
    p('จึงเรียนมาเพื่อโปรดพิจารณา', { indent: true, before: 120 }),
    p('ขอแสดงความนับถือ', { jc: 'center', before: 480 }),
    p('({{ผู้ลงนาม}})', { jc: 'center', before: 960 }), p('{{ตำแหน่งผู้ลงนาม}}', { jc: 'center' }),
  ].join('');
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1134" w:bottom="1134" w:left="1701" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const files = {
    '[Content_Types].xml': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'),
    '_rels/.rels': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'),
    'word/document.xml': strToU8(docXml),
  };
  return new Blob([zipSync(files)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}
