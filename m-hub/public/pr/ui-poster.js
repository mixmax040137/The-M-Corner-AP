// หน้าข้อความโปสเตอร์: พาดหัว ≤ 8 คำ, หัวรอง, กล่องวัน-เวลา-สถานที่, คำชวน, ลิงก์/QR — เทมเพลตก่อน (0 token)
import { h, setKids, btn, field, select, seg, toast, copyText, download, safeName } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { repo } from './db.js';
import { KINDS, eventTypeOf, kindOf } from './fields.js';
import { fmtRange, fmtTime } from './dates.js';
import { CTA } from './templates.js';
import { wordCount } from './checker.js';
import { loadQr, qrMatrix, drawQr } from '../core/qr.js';
import { share } from '../core/bus.js';

const MAX_WORDS = 8;
const LBL = {
  th: { headline: 'พาดหัว', sub: 'หัวรอง', block: 'วัน-เวลา-สถานที่', cta: 'คำชวน', qr: 'ลิงก์ / QR' },
  en: { headline: 'Headline', sub: 'Sub-headline', block: 'Date, time & venue', cta: 'Call to action', qr: 'Link / QR' },
};
const CTA_MORE = {
  th: ['ลงทะเบียนเลย!', 'ฟรี! ลงทะเบียนวันนี้', 'จำนวนจำกัด รีบลงทะเบียน', 'พบกันที่งาน', 'ติดตามรายละเอียดเพิ่มเติม'],
  en: ['Register now!', 'Free admission — register today', 'Limited seats', 'See you there', 'Find out more'],
};
let st;

export async function mount(el, app) {
  await loadQr();
  st = { app, el, eventId: '', event: null, kind: 'invite', lang: 'th', withQr: true, data: { th: {}, en: {} } };
  st.top = h('section.card');
  st.editor = h('div.pr-stack');
  st.preview = h('section.card.pr-posterwrap');
  el.append(
    h('p.intro', 'ข้อความสำหรับส่งให้ฝ่ายออกแบบ หรือใช้ทำภาพปกต่อในเครื่องมือ “ภาพปกโพสต์หลายขนาด” ของ M Hub — พาดหัวควรไม่เกิน 8 คำ ระบบเสนอพาดหัวที่สั้นลงจากชื่องานให้เลือก'),
    st.top, h('div.split', st.editor, st.preview));
}

export async function show(params = {}) {
  const events = (await repo.list('events')).sort((a, b) => String(b.fields.date || '').localeCompare(String(a.fields.date || '')));
  if (params.e && params.e !== st.eventId) st.eventId = params.e;
  if (!st.eventId && events[0]) st.eventId = events[0].id;
  st.event = events.find((e) => e.id === st.eventId) || null;
  if (st.event && st.loadedFor !== st.event.id) reset();
  setKids(st.top, h('div.grid3',
    field('งาน', select(events.map((e) => [e.id, (e.fields.title || '(ไม่มีชื่อ)') + (e.sample ? ' · ตัวอย่าง' : '')]), st.eventId, (v) => { st.eventId = v; st.event = events.find((e) => e.id === v); reset(); draw(); })),
    field('ประเภท', select(KINDS.map((k) => [k.id, k.th]), st.kind, (v) => { st.kind = v; reset(); draw(); })),
    field('ภาษา', seg([['th', 'ไทย'], ['en', 'English'], ['both', 'ไทย + English']], st.lang, (v) => { st.lang = v; draw(); }))));
  draw();
}

// ข้อความตั้งต้นจากข้อมูลงาน
function reset() {
  const ev = st.event;
  st.loadedFor = ev ? ev.id : '';
  if (!ev) return;
  if (ev.kind && st.kindFor !== ev.id) { st.kind = ev.kind; st.kindFor = ev.id; }
  const f = ev.fields;
  const et = eventTypeOf(f.eventType);
  const names = (lang) => (f.guests || []).map((g) => (lang === 'th' ? g.name : g.nameEn)).filter(Boolean);
  for (const lang of ['th', 'en']) {
    const th = lang === 'th';
    const title = th ? f.title : f.titleEn;
    const place = th ? f.place : f.placeEn;
    const n = names(lang);
    const link = f.regLink || f.meetingLink || '';
    st.data[lang] = {
      headline: headlineCandidates(title || '', lang)[0] || '',
      sub: th ? `${et.th}${n.length ? ' โดย ' + n.join(', ') : ''}` : `${et.en.charAt(0).toUpperCase() + et.en.slice(1)}${n.length ? ' with ' + n.join(', ') : ''}`,
      block: [fmtRange(f.date, f.endDate, lang), fmtTime(f.startTime, f.endTime, lang), place].filter(Boolean).join('\n'),
      cta: CTA[lang][st.kind] || '',
      qr: link ? (th ? (f.regLink ? 'สแกน QR เพื่อลงทะเบียน' : 'สแกน QR เพื่อเข้าร่วมออนไลน์') : (f.regLink ? 'Scan to register' : 'Scan to join online')) + '\n' + link : '',
    };
  }
}

// พาดหัวที่สั้นลง (ไม่ใช้ AI): ชื่อเต็ม, ส่วนก่อน/หลัง “:” หรือ “–”, ตัดคำในวงเล็บ
export function headlineCandidates(title, lang) {
  const t = String(title || '').trim();
  if (!t) return [];
  const out = [t];
  const parts = t.split(/\s*[:：–—|]\s*/).filter(Boolean);
  if (parts.length > 1) out.push(...parts);
  out.push(t.replace(/\s*[(（][^)）]*[)）]\s*/g, ' ').trim());
  out.push(t.replace(/^["“”']|["“”']$/g, ''));
  const uniq = [...new Set(out.map((x) => x.trim()).filter((x) => x.length > 1))];
  // เรียงให้ตัวที่ไม่เกิน 8 คำขึ้นก่อน (คงลำดับเดิมในกลุ่ม)
  return [...uniq.filter((x) => wordCount(x) <= MAX_WORDS), ...uniq.filter((x) => wordCount(x) > MAX_WORDS)];
}

function draw() {
  if (!st.event) { setKids(st.editor, h('div.note', 'ยังไม่มีงาน — สร้างงานในหน้า “เขียนโพสต์” ก่อน')); setKids(st.preview); return; }
  const langs = st.lang === 'both' ? ['th', 'en'] : [st.lang];
  setKids(st.editor, ...langs.map((lang) => editorFor(lang)),
    h('section.card',
      h('label.check', h('input', { type: 'checkbox', checked: st.withQr, onchange: (e) => { st.withQr = e.target.checked; drawPreview(); } }), h('span', 'แสดง QR ในตัวอย่าง')),
      h('div.row.wrap',
        btn('คัดลอกข้อความทั้งหมด', () => copyText(posterText()), { ic: 'copy', kind: 'primary' }),
        btn('ดาวน์โหลด .txt', () => download(new Blob([posterText()], { type: 'text/plain;charset=utf-8' }), safeName('ข้อความโปสเตอร์ ' + (st.event.fields.title || '')).slice(0, 80) + '.txt'), { ic: 'download' }),
        btn('บันทึกเป็นโพสต์ (ร่าง)', savePost, { ic: 'save' })),
      h('div.row.wrap',
        btn('ส่งไปทำภาพปกโพสต์', toSocial, { ic: 'grid', kind: 'ghost' }),
        link() ? btn('สร้าง QR ไฟล์ใหญ่', () => st.app.go('qr', { u: link() }), { ic: 'qr', kind: 'ghost' }) : null)));
  drawPreview();
}

const link = () => (st.event ? st.event.fields.regLink || st.event.fields.meetingLink || '' : '');

function editorFor(lang) {
  const d = st.data[lang];
  const L = LBL[lang];
  const count = h('span.small');
  const drawCount = () => {
    const n = wordCount(d.headline);
    count.textContent = `${n} คำ`;
    count.className = n > MAX_WORDS ? 'status-warn small' : 'status-ok small';
    if (n > MAX_WORDS) count.textContent += ` — ควรไม่เกิน ${MAX_WORDS} คำ`;
  };
  const head = h('textarea', { rows: 2, value: d.headline, 'aria-label': `${L.headline} (${lang})`, 'data-poster': lang + '-headline', oninput: (e) => { d.headline = e.target.value; drawCount(); drawPreview(); } });
  drawCount();
  const title = lang === 'th' ? st.event.fields.title : st.event.fields.titleEn;
  const cands = headlineCandidates(title, lang);
  const area = (k, rows) => h('textarea', { rows, value: d[k] || '', 'aria-label': `${L[k]} (${lang})`, oninput: (e) => { d[k] = e.target.value; drawPreview(); } });
  return h('section.card', { 'data-lang': lang },
    h('h3.card-title', icon('type'), lang === 'th' ? 'ภาษาไทย' : 'English'),
    field(L.headline, head, count),
    cands.length > 1 ? h('div.chips', h('span.muted.small', 'เลือกพาดหัว:'), cands.map((c) => h('button.chip', { type: 'button', title: `${wordCount(c)} คำ`, onclick: () => { d.headline = c; head.value = c; drawCount(); drawPreview(); } }, `${c} (${wordCount(c)})`))) : null,
    field(L.sub, area('sub', 2)),
    field(L.block, area('block', 3)),
    field(L.cta, h('input', { type: 'text', value: d.cta || '', 'aria-label': `${L.cta} (${lang})`, oninput: (e) => { d.cta = e.target.value; drawPreview(); } }),
      h('span.chips', CTA_MORE[lang].map((c) => h('button.chip', { type: 'button', onclick: (e) => { d.cta = c; e.target.closest('.field').querySelector('input').value = c; drawPreview(); } }, c)))),
    field(L.qr, area('qr', 2)));
}

function posterText() {
  const langs = st.lang === 'both' ? ['th', 'en'] : [st.lang];
  return langs.map((lang) => {
    const d = st.data[lang], L = LBL[lang];
    return [[L.headline, d.headline], [L.sub, d.sub], [L.block, d.block], [L.cta, d.cta], [L.qr, d.qr]].filter(([, v]) => v && v.trim())
      .map(([k, v]) => `${k}: ${v.includes('\n') ? '\n' + v : v}`).join('\n');
  }).join('\n\n— — —\n\n');
}

function drawPreview() {
  const langs = st.lang === 'both' ? ['th', 'en'] : [st.lang];
  const [a, b] = langs.map((l) => st.data[l]);
  let qr = null;
  if (st.withQr && link()) {
    const m = qrMatrix(link(), 'M');
    if (m) { qr = h('canvas.pr-poster-qr', { width: 240, height: 240 }); drawQr(qr.getContext('2d'), m, 0, 0, 240); }
  }
  setKids(st.preview,
    h('h3.card-title', icon('eye'), 'ตัวอย่างโปสเตอร์ (คร่าว ๆ)'),
    h('div.pr-poster', { 'data-preview': '1' },
      h('div.pr-poster-head', a.headline || ''),
      b ? h('div.pr-poster-head2', b.headline || '') : null,
      h('div.pr-poster-sub', a.sub || ''), b && b.sub ? h('div.pr-poster-sub2', b.sub) : null,
      h('div.pr-poster-block', a.block || ''), b && b.block ? h('div.pr-poster-block2', b.block) : null,
      h('div.pr-poster-foot',
        h('div', a.cta ? h('div.pr-poster-cta', a.cta) : null, b && b.cta ? h('div.pr-poster-cta2', b.cta) : null,
          h('div.pr-poster-qrnote', String(a.qr || '').split('\n')[0])),
        qr)),
    h('div.hint', `ประเภท: ${kindOf(st.kind).th} · ตัวอย่างนี้ใช้ดูความยาวข้อความ ไม่ใช่งานออกแบบจริง`));
}

async function savePost() {
  const ev = st.event;
  await repo.put('posts', { eventId: ev.id, eventType: ev.fields.eventType, kind: st.kind, tone: 'formal', channel: 'poster', lang: st.lang,
    text: posterText(), subject: '', status: 'draft', source: 'template', metrics: {}, sample: !!ev.sample });
  toast('บันทึกข้อความโปสเตอร์เป็นโพสต์ (ร่าง) แล้ว', 'ok');
}

function toSocial() {
  const d = st.data[st.lang === 'en' ? 'en' : 'th'];
  share('social-text', { tag: kindOf(st.kind).th, title: d.headline, subtitle: d.sub, info: String(d.block || '').replace(/\n/g, ' · '), footer: st.app.style.facultyTh || '' });
  location.hash = '#/social';
}
