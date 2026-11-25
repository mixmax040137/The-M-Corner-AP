// เครื่องมือ: ร่างอีเมลประกาศ ไทย / อังกฤษ จากไฟล์ประกาศ PDF
// ดึงข้อมูลด้วยกฎ (ไม่ใช้ AI) → ร่างอีเมลจากแบบฟอร์ม → แปลด้วย Workers AI ฟรีได้ถ้าต้องการ
import { h, btn, field, select, step, toast, progressBar, safeName, splitExt, naturalCompare, dropZone, pickFiles, copyText,
  text, debounce, nextFrame, tabs } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { outputChooser, openSink } from '../core/output.js';
import { fsSupported, pickDirectory, walkDirectory } from '../core/workspace.js';
import * as store from '../core/store.js';
import { openPdf, extractText } from '../core/pdf.js';
import { findThaiDates, thaiDatesToEnglish, thaiDigits, enDate, estimateTokens } from '../core/thai.js';
import { buildEml, gmailLink, outlookLink } from '../core/eml.js';
import { recognize } from '../core/ocr.js';
import { shared, onShare } from '../core/bus.js';
import { loadGlossary, compileGlossary, applyGlossary, aiTranslate as aiTranslateTexts, hasThai, onGlossaryChange } from '../core/glossary.js';

const DEFAULT_SETTINGS = {
  to: '', cc: '',
  subjectTh: '[ประชาสัมพันธ์] {{เรื่อง}}',
  subjectEn: '[Announcement] {{title}}',
  greetTh: 'เรียน คณาจารย์ บุคลากร และนักศึกษา',
  greetEn: 'Dear Faculty Members, Staff and Students,',
  closingTh: 'ขอแสดงความนับถือ\nงานประชาสัมพันธ์\nคณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์',
  closingEn: 'Best regards,\nPublic Relations Unit\nFaculty of Liberal Arts, Thammasat University',
  mode: 'both',
};

// ฟอนต์ไทยบางตัวเก็บวรรณยุกต์ไว้ในรหัสพิเศษ (PUA) → แปลงกลับเป็นตัวอักษรมาตรฐาน
const PUA = { 0xF700: 0x0E10, 0xF701: 0x0E34, 0xF702: 0x0E35, 0xF703: 0x0E36, 0xF704: 0x0E37, 0xF705: 0x0E48, 0xF706: 0x0E49, 0xF707: 0x0E4A, 0xF708: 0x0E4B, 0xF709: 0x0E4C,
  0xF70A: 0x0E48, 0xF70B: 0x0E49, 0xF70C: 0x0E4A, 0xF70D: 0x0E4B, 0xF70E: 0x0E4C, 0xF70F: 0x0E0D, 0xF710: 0x0E31, 0xF711: 0x0E4D, 0xF712: 0x0E47, 0xF713: 0x0E48,
  0xF714: 0x0E49, 0xF715: 0x0E4A, 0xF716: 0x0E4B, 0xF717: 0x0E4C, 0xF718: 0x0E38, 0xF719: 0x0E39, 0xF71A: 0x0E3A };

export function cleanThai(s) {
  return String(s)
    .replace(/[-]/g, (c) => String.fromCharCode(PUA[c.charCodeAt(0)] || c.charCodeAt(0)))
    .replace(/ํ([่-๋]?)า/g, '$1ำ') // ํ + า → ำ
    .replace(/([่-๋])ํ/g, 'ํ$1')
    .replace(/[ \t ]+/g, ' ');
}

const STOP_TITLE = /^(ด้วย|ตามที่|ตาม|โดยที่|อาศัย|เนื่องด้วย|เนื่องจาก|เพื่อ|[-_—–.]{3,}|\d+\.|ข้อ\s?\d|ทั้งนี้)/;
const BODY_LINE = /@|https?:|www\.|โทร|^(ผู้สนใจ|สอบถาม|กำหนด|จึง|โดย|ทั้งนี้|ติดต่อ)/;
const DEADLINE = /(ภายใน|ไม่เกิน|ก่อน|สิ้นสุด|ปิดรับ|หมดเขต|ถึงวันที่|ถึง|ตั้งแต่|ระหว่าง|ในวันที่|วันที่)/;

// ดึงข้อมูลสำคัญจากข้อความประกาศ
export function parseAnnouncement(raw, fileName = '') {
  const textValue = cleanThai(raw);
  const lines = textValue.split('\n').map((l) => l.trim()).filter(Boolean);
  const out = { issuer: '', title: '', number: '', announceDate: '', dates: [], emails: [], phones: [], urls: [], signer: '', position: '', summary: '' };

  // ผู้ออกประกาศ + เลขที่
  for (const l of lines.slice(0, 12)) {
    const m = l.match(/^ประกาศ\s*(?!ณ)(.+)$/);
    if (m && !out.issuer) out.issuer = m[1].replace(/\s*(ฉบับที่|ที่)\s*[\d๐-๙/ .]+.*$/, '').trim();
    const n = l.match(/(?:ฉบับที่|^ที่)\s*([\d๐-๙]+\s*\/\s*[\d๐-๙]{2,4})/);
    if (n && !out.number) out.number = thaiDigits(n[1]).replace(/\s/g, '');
  }
  // เรื่อง
  let ti = lines.findIndex((l) => /^เรื่อง\s*[:：]?\s*\S/.test(l));
  if (ti >= 0) {
    const parts = [lines[ti].replace(/^เรื่อง\s*[:：]?\s*/, '')];
    for (let j = ti + 1; j < lines.length && parts.length < 3; j++) {
      const l = lines[j];
      if (STOP_TITLE.test(l) || l.length > 90 || /^ประกาศ/.test(l) || BODY_LINE.test(l) || findThaiDates(l).length) break;
      parts.push(l);
    }
    out.title = parts.join(' ').replace(/\s+/g, ' ').trim();
  } else {
    const en = lines.find((l) => /^(subject|re|announcement)\s*[:：]/i.test(l));
    out.title = en ? en.replace(/^[^:：]+[:：]\s*/, '') : splitExt(fileName)[0];
  }
  // วันที่ประกาศ
  const ann = textValue.match(/(?:ประกาศ|สั่ง)\s*ณ\s*วันที่\s*([^\n]{4,40})/);
  if (ann) { const d = findThaiDates(ann[1])[0]; if (d) out.announceDate = d.raw; }
  // วันสำคัญ (พร้อมข้อความรอบ ๆ)
  const seen = new Set();
  const flat = textValue.replace(/\n/g, ' ');
  for (const d of findThaiDates(flat)) {
    if (d.raw === out.announceDate || seen.has(d.raw)) continue;
    const before = flat.slice(Math.max(0, d.index - 70), d.index);
    const after = flat.slice(d.index + d.raw.length, d.index + d.raw.length + 40);
    if (!DEADLINE.test(before.slice(-30))) continue;
    seen.add(d.raw);
    const ctx = before.slice(-45).replace(/^\S*\s/, '').trim();
    const tail = (after.match(/^\s*(?:ถึง|-|–)\s*(?:วันที่)?\s*[0-9๐-๙]{1,2}\s*\S+\s*[0-9๐-๙]{2,4}/) || [''])[0];
    out.dates.push({ raw: d.raw, date: d.date, context: (ctx + ' ' + d.raw + tail).trim() });
    if (out.dates.length >= 4) break;
  }
  // ช่องทางติดต่อ
  out.emails = [...new Set(textValue.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g) || [])];
  out.urls = [...new Set((textValue.match(/(https?:\/\/[^\s<>"')]+|www\.[^\s<>"')]+)/g) || []).map((u) => u.replace(/[.,;]$/, '')))];
  out.phones = [...new Set((thaiDigits(textValue).match(/0\d{1,2}[\s-]?\d{3}[\s-]?\d{3,4}(?:\s*(?:ต่อ|ext\.?)\s*\d{2,5})?/g) || []).map((p) => p.trim()))];
  // ผู้ลงนาม: บรรทัด (ชื่อ) ใกล้ท้ายเอกสาร
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 15); i--) {
    const m = lines[i].match(/^\(\s*(.{3,60}?)\s*\)$/);
    if (m) { out.signer = m[1]; out.position = lines[i + 1] && !/^\(/.test(lines[i + 1]) ? lines[i + 1] : ''; break; }
  }
  // สาระสำคัญ: ย่อหน้าแรกหลังหัวเรื่อง
  const bodyStart = ti >= 0 ? ti + 1 : 0;
  let body = lines.slice(bodyStart).filter((l) => !/^[-_—–.]{3,}$/.test(l)).join(' ');
  body = body.split(/(?:จึงประกาศ|ประกาศ\s*ณ\s*วันที่|สั่ง\s*ณ\s*วันที่)/)[0];
  if (out.title && body.startsWith(out.title)) body = body.slice(out.title.length);
  out.summary = shorten(body.replace(/\s+/g, ' ').trim(), 320);
  return out;
}

function shorten(s, max) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sp = cut.lastIndexOf(' ');
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut) + ' …';
}

// แปลด้วยคลังคำกลาง + วันที่ (ไม่ใช้ AI)
export const glossaryTranslate = (s, pairs) => applyGlossary(s, pairs);

export async function mount(root) {
  const settings = { ...DEFAULT_SETTINGS, ...((await store.get('announce:settings')) || {}) };
  const save = debounce(() => store.set('announce:settings', settings), 300);
  let glossary = compileGlossary(await loadGlossary());
  onGlossaryChange((list) => (glossary = compileGlossary(list)));
  const docs = []; // {file, path, text, f(fields), drafts, cardEl}
  const list = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px' } });
  const summaryLine = h('div.muted');
  const prog = progressBar();

  // ---------- 1) เลือกไฟล์ ----------
  async function addFiles(entries) {
    const pdfs = entries.filter((x) => /\.pdf$/i.test(x.file.name)).sort((a, b) => naturalCompare(a.path, b.path));
    if (!pdfs.length) return toast('ไม่พบไฟล์ PDF', 'warn');
    for (let i = 0; i < pdfs.length; i++) {
      prog.set(i, pdfs.length, `อ่าน ${i + 1} / ${pdfs.length}`);
      const { file, path } = pdfs[i];
      const d = { file, path, text: '', f: null, error: '' };
      try {
        const pdf = await openPdf(file);
        d.text = await extractText(pdf);
        pdf.destroy();
      } catch (e) { d.error = 'เปิดไฟล์ไม่ได้: ' + e.message; }
      if (!d.error && d.text.replace(/\s/g, '').length < 30) { d.error = 'ไฟล์นี้เป็นภาพสแกน ไม่มีข้อความให้ดึง — กด “อ่านด้วย OCR” หรือกรอกข้อมูลเองในช่องด้านล่าง'; d.scanned = true; }
      d.f = parseAnnouncement(d.text, file.name);
      initFields(d);
      docs.push(d);
      list.append(card(d));
      await nextFrame();
    }
    prog.hide();
    summaryLine.textContent = `อ่านแล้ว ${docs.length} ไฟล์`;
  }

  // รับข้อความจากเครื่องมือ OCR
  function addFromText(v) {
    if (!v || !v.text) return;
    const d = { file: v.file || null, path: v.name + ' (OCR)', text: v.text, f: null, error: '' };
    d.f = parseAnnouncement(d.text, v.name);
    initFields(d);
    docs.push(d);
    list.append(card(d));
    summaryLine.textContent = `อ่านแล้ว ${docs.length} ไฟล์`;
    toast('เพิ่มประกาศจากผล OCR แล้ว', 'ok');
  }

  async function ocrDoc(d, b) {
    b.disabled = true;
    try {
      const r = await recognize(d.file, { forceOcr: true, onProgress: (s, p) => prog.set(Math.round(p * 100), 100, s) });
      d.text = r.text; d.error = ''; d.scanned = false;
      d.f = parseAnnouncement(d.text, d.file.name);
      initFields(d);
      const old = d.cardEl;
      old.replaceWith(card(d));
      toast('อ่านด้วย OCR แล้ว — ตรวจทานข้อมูลอีกครั้ง', 'ok');
    } catch (e) { toast('OCR ไม่สำเร็จ: ' + e.message, 'error'); b.disabled = false; }
    finally { prog.hide(); }
  }

  function initFields(d) {
    const f = d.f;
    d.v = {
      title: f.title, summary: f.summary, issuer: f.issuer,
      titleEn: hasThai(glossaryTranslate(f.title, glossary)) ? '' : glossaryTranslate(f.title, glossary),
      summaryEn: '', issuerEn: hasThai(glossaryTranslate(f.issuer, glossary)) ? '' : glossaryTranslate(f.issuer, glossary),
      datesEn: [],
      contact: [...f.emails, ...f.phones].join(' · '),
      links: f.urls.join('\n'),
    };
  }

  // ---------- ประกอบอีเมล ----------
  function draftTh(d) {
    const v = d.v, f = d.f;
    const parts = [settings.greetTh, '', `ด้วย${v.issuer || 'หน่วยงาน'}ได้ออกประกาศ เรื่อง ${v.title}${f.number ? ` (ฉบับที่ ${f.number})` : ''}${f.announceDate ? ` ลงวันที่ ${f.announceDate}` : ''}`];
    if (v.summary) parts.push('', 'สาระสำคัญ: ' + v.summary);
    if (f.dates.length) parts.push('', 'กำหนดการสำคัญ', ...f.dates.map((x) => '• ' + x.context));
    if (v.contact) parts.push('', 'สอบถามเพิ่มเติม: ' + v.contact);
    if (v.links) parts.push('', 'ลิงก์ที่เกี่ยวข้อง:', v.links);
    if (d.file) parts.push('', 'รายละเอียดเพิ่มเติมตามไฟล์ประกาศที่แนบมาพร้อมนี้');
    parts.push('', 'จึงเรียนมาเพื่อโปรดทราบ และขอความอนุเคราะห์ประชาสัมพันธ์ต่อไป', '', settings.closingTh);
    return parts.join('\n');
  }
  function draftEn(d) {
    const v = d.v, f = d.f;
    const title = v.titleEn || `[English title: ${v.title}]`;
    const parts = [settings.greetEn, '', `${v.issuerEn || 'The Faculty'} has issued an announcement regarding “${title}”${f.announceDate ? `, dated ${thaiDatesToEnglish(f.announceDate)}` : ''}.`];
    if (v.summaryEn) parts.push('', v.summaryEn);
    if (f.dates.length) parts.push('', 'Key dates:', ...f.dates.map((x, i) => '• ' + (v.datesEn[i] || enDate(x.date))));
    if (v.contact) parts.push('', 'For further information, please contact: ' + v.contact);
    if (v.links) parts.push('', 'Related links:', v.links);
    if (d.file) parts.push('', 'Please see the attached announcement for full details.');
    parts.push('', settings.closingEn);
    return parts.join('\n');
  }
  const subjTh = (d) => settings.subjectTh.replace(/\{\{\s*เรื่อง\s*\}\}/g, d.v.title).replace(/\{\{\s*title\s*\}\}/g, d.v.titleEn || d.v.title);
  const subjEn = (d) => settings.subjectEn.replace(/\{\{\s*title\s*\}\}/g, d.v.titleEn || d.v.title).replace(/\{\{\s*เรื่อง\s*\}\}/g, d.v.title);

  function emailsFor(d) {
    const th = { subject: subjTh(d), text: d.thBox.value };
    const en = { subject: subjEn(d), text: d.enBox.value };
    if (settings.mode === 'th') return [{ ...th, tag: '' }];
    if (settings.mode === 'en') return [{ ...en, tag: '' }];
    if (settings.mode === 'separate') return [{ ...th, tag: ' (TH)' }, { ...en, tag: ' (EN)' }];
    return [{ subject: `${th.subject} / ${en.subject}`, text: `${th.text}\n\n——————————————\n\n${en.text}`, tag: '' }];
  }

  // ---------- แปลด้วย Workers AI ----------
  async function aiTranslate(d, b) {
    const v = d.v;
    b.disabled = true;
    try {
      const [t, sum, ...dates] = await aiTranslateTexts([v.title, v.summary, ...d.f.dates.map((x) => x.context)], glossary);
      v.titleEn = t; v.summaryEn = sum; v.datesEn = dates;
      if (!v.issuerEn) v.issuerEn = applyGlossary(v.issuer, glossary);
      d.refreshFields();
      d.enBox.value = draftEn(d);
      toast('แปลแล้ว — ตรวจทานก่อนส่งทุกครั้ง', 'ok');
    } catch (e) {
      toast('แปลไม่สำเร็จ (' + e.message + ') — ใช้ปุ่ม “คัดลอกข้อมูลย่อสำหรับ AI” แทนได้', 'error', 7000);
    } finally { b.disabled = false; }
  }

  function aiPrompt(d) {
    const v = d.v, f = d.f;
    const facts = [
      `เรื่อง: ${v.title}`, v.issuer && `ผู้ออกประกาศ: ${v.issuer}`, f.announceDate && `ลงวันที่: ${f.announceDate}`,
      v.summary && `สาระสำคัญ: ${v.summary}`, f.dates.length && `กำหนดการ: ${f.dates.map((x) => x.context).join(' | ')}`,
      v.contact && `ติดต่อ: ${v.contact}`, v.links && `ลิงก์: ${v.links.replace(/\n/g, ' ')}`,
    ].filter(Boolean).join('\n');
    return `เขียนอีเมลประชาสัมพันธ์ 2 ฉบับ (ภาษาไทยทางการ และภาษาอังกฤษ) จากข้อมูลประกาศนี้ ฉบับละไม่เกิน 120 คำ มีหัวเรื่อง ขึ้นต้นด้วย "${settings.greetTh}" / "${settings.greetEn.replace(/,$/, '')}" และแจ้งว่าแนบไฟล์ประกาศมาด้วย\n\n${facts}`;
  }

  // ---------- การ์ดของแต่ละไฟล์ ----------
  function card(d) {
    const v = d.v;
    d.thBox = h('textarea', { rows: 16, value: draftTh(d) });
    d.enBox = h('textarea', { rows: 16, value: draftEn(d) });
    const regen = () => { d.thBox.value = draftTh(d); d.enBox.value = draftEn(d); };
    const inp = (k, label, opts = {}) => field(label, opts.area
      ? h('textarea', { rows: opts.rows || 3, value: v[k], oninput: (e) => { v[k] = e.target.value; regenSoon(); } })
      : text(v[k], (x) => { v[k] = x; regenSoon(); }, opts.attrs || {}));
    const regenSoon = debounce(regen, 300);
    const fieldsBox = h('div');
    d.refreshFields = () => fieldsBox.replaceChildren(
      h('div.grid2', inp('title', 'เรื่อง (ไทย)'), inp('titleEn', 'Title (English)', { attrs: { placeholder: 'กด “แปลด้วย AI ฟรี” หรือพิมพ์เอง' } })),
      h('div.grid2', inp('summary', 'สาระสำคัญ (ไทย)', { area: true }), inp('summaryEn', 'Summary (English)', { area: true })),
      h('div.grid3', inp('issuer', 'ผู้ออกประกาศ'), inp('contact', 'ติดต่อ'), inp('links', 'ลิงก์', { area: true, rows: 1 })));
    d.refreshFields();

    const f = d.f;
    const facts = h('div.chips',
      f.number ? h('span.tag', 'ฉบับที่ ' + f.number) : '',
      f.announceDate ? h('span.tag', 'ประกาศ ' + f.announceDate) : '',
      ...f.dates.map((x) => h('span.tag', { title: x.context }, '📅 ' + x.raw)),
      f.signer ? h('span.tag', 'ลงนาม: ' + f.signer) : '');

    const promptText = () => aiPrompt(d);
    const fullTokens = estimateTokens(d.text);
    const aiBtn = btn('แปลด้วย AI ฟรี (Cloudflare)', () => aiTranslate(d, aiBtn), { ic: 'languages', kind: 'sm' });
    const t = tabs([
      { id: 'th', label: 'ร่างภาษาไทย', render: () => d.thBox },
      { id: 'en', label: 'ร่างภาษาอังกฤษ', render: () => d.enBox },
    ]);
    const links = h('div.row.wrap');
    const drawLinks = () => {
      const [m] = emailsFor(d);
      const mail = { to: settings.to, cc: settings.cc, subject: m.subject, text: m.text };
      links.replaceChildren(
        btn('ดาวน์โหลด .eml (แนบ PDF)', async () => {
          const sink = await openSink('files');
          for (const e of emailsFor(d)) await sink.write(safeName(splitExt(d.file ? d.file.name : d.path)[0]) + e.tag + '.eml', await emlBlob(d, e));
        }, { ic: 'mail', kind: 'sm primary' }),
        h('a.btn.sm', { href: gmailLink(mail), target: '_blank', rel: 'noopener', onmouseenter: drawLinks }, icon('external'), 'Gmail'),
        h('a.btn.sm', { href: outlookLink(mail), target: '_blank', rel: 'noopener', onmouseenter: drawLinks }, icon('external'), 'Outlook เว็บ'),
        btn('คัดลอกร่าง', () => copyText(`${m.subject}\n\n${m.text}`), { ic: 'copy', kind: 'sm' }));
    };
    drawLinks();
    d.thBox.addEventListener('input', debounce(drawLinks, 300));
    d.enBox.addEventListener('input', debounce(drawLinks, 300));

    const ocrBtn = d.scanned ? btn('อ่านด้วย OCR (ไทย + อังกฤษ)', () => ocrDoc(d, ocrBtn), { ic: 'scan', kind: 'sm primary' }) : null;
    return (d.cardEl = h('section.card.ann-doc',
      h('div.row.wrap', h('h3.card-title', icon('file'), d.path), h('span.spacer'), h('span.muted.small', `${d.text.length.toLocaleString()} ตัวอักษร`)),
      d.error ? h('div.note.warn.row.wrap', h('span', d.error), ocrBtn) : '',
      facts, fieldsBox,
      h('div.row.wrap', aiBtn,
        btn('คัดลอกข้อมูลย่อสำหรับ AI', () => { copyText(promptText()); }, { ic: 'sparkles', kind: 'sm' }),
        btn('สร้างร่างใหม่จากข้อมูล', () => { regen(); drawLinks(); }, { ic: 'rotate', kind: 'sm ghost' }),
        h('span.hint', `ข้อมูลย่อใช้ ~${estimateTokens(promptText())} token แทนทั้งไฟล์ ~${fullTokens} token`)),
      t.el, links,
      h('details', h('summary.muted.small', 'ดูข้อความที่ดึงได้จาก PDF'), h('pre', { style: { whiteSpace: 'pre-wrap', fontSize: '13px', maxHeight: '260px', overflow: 'auto', background: 'var(--surface-2)', padding: '10px', borderRadius: '8px' } }, d.text || '(ไม่มีข้อความ)'))));
  }

  async function emlBlob(d, e) {
    const attachments = d.file ? [{ name: d.file.name, type: 'application/pdf', data: new Uint8Array(await d.file.arrayBuffer()) }] : [];
    return new Blob([buildEml({ to: settings.to, cc: settings.cc, subject: e.subject, text: e.text, attachments })], { type: 'message/rfc822' });
  }

  // ---------- ส่งออกทั้งหมด ----------
  const out = outputChooser('announce');
  const resultBox = h('div');
  async function exportAll() {
    if (!docs.length) return toast('ยังไม่ได้เลือกไฟล์ประกาศ', 'warn');
    let sink;
    try { sink = await openSink(out.mode, { zipName: `อีเมลประกาศ-${docs.length}-ไฟล์.zip`, dirId: 'mhub-announce-out' }); }
    catch (e) { if (e.name !== 'AbortError') toast(e.message, 'error'); return; }
    for (const d of docs) for (const e of emailsFor(d)) await sink.write(safeName(splitExt(d.file ? d.file.name : d.path)[0]) + e.tag + '.eml', await emlBlob(d, e));
    const res = await sink.close();
    resultBox.replaceChildren(h('div.note.ok', `สร้างฉบับร่าง ${res.count} ฉบับ (แนบ PDF แล้ว) → ${res.where}`));
  }

  // ---------- ตั้งค่า ----------
  const set = (k) => (v) => { settings[k] = v; save(); };
  const settingsBox = h('details',
    h('summary', h('b', 'ตั้งค่าอีเมลและคลังคำแปล'), h('span.muted', ' — จำไว้ในเครื่องนี้')),
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' } },
      h('div.grid2',
        field('ส่งถึง (ไม่บังคับ)', text(settings.to, set('to'), { placeholder: 'เช่น all-staff@arts.tu.ac.th' })),
        field('สำเนา (CC)', text(settings.cc, set('cc')))),
      h('div.grid2',
        field('หัวเรื่องภาษาไทย', text(settings.subjectTh, set('subjectTh')), '{{เรื่อง}} = เรื่องของประกาศ'),
        field('หัวเรื่องภาษาอังกฤษ', text(settings.subjectEn, set('subjectEn')), '{{title}} = ชื่อเรื่องภาษาอังกฤษ')),
      h('div.grid2',
        field('คำขึ้นต้น (ไทย)', text(settings.greetTh, set('greetTh'))),
        field('คำขึ้นต้น (อังกฤษ)', text(settings.greetEn, set('greetEn')))),
      h('div.grid2',
        field('คำลงท้าย / ลายเซ็น (ไทย)', h('textarea', { rows: 3, value: settings.closingTh, oninput: (e) => set('closingTh')(e.target.value) })),
        field('คำลงท้าย / ลายเซ็น (อังกฤษ)', h('textarea', { rows: 3, value: settings.closingEn, oninput: (e) => set('closingEn')(e.target.value) }))),
      h('div.note.info', 'ชื่อหน่วยงาน ตำแหน่ง และคำเฉพาะ แปลด้วย ', h('a', { href: '#/glossary' }, 'คลังคำแปลกลาง'), ' (ใช้ร่วมกันทุกเครื่องมือ)'),
      h('div.hint', 'การตั้งค่าใหม่มีผลกับไฟล์ที่เลือกหลังจากนี้ หรือกด “สร้างร่างใหม่จากข้อมูล” ในแต่ละไฟล์')));

  const drop = h('div.drop',
    h('div', icon('files', 28)),
    h('p', 'ลากไฟล์ประกาศ PDF หรือโฟลเดอร์มาวางที่นี่ หรือ'),
    h('div.row.wrap', { style: { justifyContent: 'center' } },
      btn('เลือกไฟล์ PDF', async () => addFiles(await pickFiles({ accept: 'application/pdf,.pdf' })), { kind: 'primary', ic: 'file' }),
      btn('เลือกทั้งโฟลเดอร์', async () => {
        try {
          if (fsSupported) addFiles(await walkDirectory(await pickDirectory('mhub-announce-in', 'read'), { recursive: false, accept: (n) => /\.pdf$/i.test(n) }));
          else addFiles(await pickFiles({ directory: true }));
        } catch (e) { if (e.name !== 'AbortError') toast(e.message, 'error'); }
      }, { ic: 'folder' }),
      btn('ล้างรายการ', () => { docs.length = 0; list.replaceChildren(); summaryLine.textContent = ''; }, { kind: 'ghost', ic: 'trash' })));
  dropZone(drop, addFiles);

  root.append(
    h('p.intro', 'อ่านไฟล์ประกาศ PDF ทั้งโฟลเดอร์ ดึงเรื่อง วันสำคัญ และช่องทางติดต่อให้อัตโนมัติ แล้วร่างอีเมลไทย/อังกฤษพร้อมแนบไฟล์ — ไม่ต้องส่งเอกสารทั้งฉบับให้ AI อ่าน'),
    step(1, 'เลือกไฟล์ประกาศ', drop, prog.el, summaryLine, settingsBox),
    step(2, 'ตรวจทานร่างอีเมล', list),
    step(3, 'ส่งออกทั้งหมด',
      h('div.grid2',
        field('รูปแบบอีเมล', select([['both', 'ไทย + อังกฤษ ในฉบับเดียว'], ['separate', 'แยกฉบับไทย / อังกฤษ'], ['th', 'ภาษาไทยอย่างเดียว'], ['en', 'ภาษาอังกฤษอย่างเดียว']], settings.mode, set('mode'))),
        out.el),
      h('div.row', btn('ดาวน์โหลดฉบับร่าง .eml ทั้งหมด', exportAll, { kind: 'primary big', ic: 'mail' })),
      h('div.hint', 'ฉบับร่าง .eml แนบไฟล์ประกาศให้แล้ว ดับเบิลคลิกเปิดใน Outlook แล้วกดส่งได้ทันที'),
      resultBox),
  );
  // รับข้อความจากเครื่องมือ OCR (ทำหลังเตรียมหน้าเสร็จแล้ว)
  onShare('announce-text', addFromText);
  if (shared('announce-text')) addFromText(shared('announce-text'));
}
