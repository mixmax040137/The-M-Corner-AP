// ตัวตรวจก่อนโพสต์ (0 token): วันกับวันที่, ปี พ.ศ./ค.ศ., ลิงก์, ถ้อยคำต้องห้าม/บังคับ, ช่องที่ยังไม่กรอก, ความยาวตามช่องทาง
import { findDates, findTimeRanges, weekdayName, shortDate, fixWeekdayText, parseISO, todayISO, toISO } from './dates.js';
import { REQUIRED, fieldLabel, channelOf, TONES, toneOf } from './fields.js';
import { countEmoji } from './templates.js';
import { thaiDigits, toThaiDigits } from '../core/thai.js';

const LEVEL_ORDER = { error: 0, warn: 1, info: 2, ok: 3 };

// ---------- ลิงก์ ----------
const URL_RE = /(?:https?:\/\/|www\.)[^\s<>"“”'()]+|\b(?:forms\.gle|bit\.ly|zoom\.us|tinyurl\.com|lin\.ee|fb\.me|youtu\.be|t\.ly|shorturl\.at)\/[^\s<>"“”'()]+/gi;
export function findLinks(text) {
  const out = [];
  for (const m of String(text || '').matchAll(URL_RE)) {
    let raw = m[0].replace(/[.,;:!?)\]}”’]+$/, '');
    const issues = [];
    const thai = raw.search(/[฀-๿]/);
    let url = raw;
    if (thai > 0) { url = raw.slice(0, thai); issues.push({ level: 'warn', msg: 'มีตัวอักษรไทยติดท้ายลิงก์ ควรเว้นวรรคหลังลิงก์ ไม่เช่นนั้นลิงก์จะเสีย', fix: { from: raw, to: url + ' ' + raw.slice(thai), label: 'เว้นวรรคให้' } }); }
    url = url.replace(/[.,;:!?)\]}”’]+$/, '');
    if (!/^https?:\/\//i.test(url)) issues.push({ level: 'warn', msg: 'ลิงก์ไม่มี https:// บางแพลตฟอร์มจะไม่ทำเป็นลิงก์ให้กด', fix: { from: url, to: 'https://' + url, label: 'เติม https://' } });
    else if (/^http:\/\//i.test(url)) issues.push({ level: 'info', msg: 'ลิงก์ใช้ http:// ถ้าเว็บรองรับควรใช้ https://' });
    try { new URL(/^https?:\/\//i.test(url) ? url : 'https://' + url); } catch { issues.push({ level: 'error', msg: 'รูปแบบลิงก์ไม่ถูกต้อง' }); }
    out.push({ raw, url: /^https?:\/\//i.test(url) ? url : 'https://' + url, display: url, issues });
  }
  return out.filter((l, i, a) => a.findIndex((x) => x.url === l.url) === i);
}

// สถานะลิงก์ที่ตรวจแล้ว: { state: 'ok'|'broken'|'warn', msg }
export function describeLink(r) {
  if (!r) return { state: 'pending', msg: 'ยังไม่ได้ตรวจ' };
  if (r.cors) return { state: 'warn', msg: 'ตรวจไม่ได้ (CORS) — เปิดดูเองอีกครั้ง' };
  if (r.blocked) return { state: 'warn', msg: 'ตรวจไม่ได้ (ที่อยู่ภายในหรือพอร์ตพิเศษ)' };
  if (r.invalid) return { state: 'broken', msg: 'รูปแบบลิงก์ไม่ถูกต้อง' };
  if (r.error === 'timeout') return { state: 'warn', msg: 'ตรวจไม่ได้ (ปลายทางไม่ตอบภายใน 8 วินาที)' };
  if (r.error) return { state: 'broken', msg: 'เชื่อมต่อไม่ได้ (หาเว็บไม่พบหรือเว็บล่ม)' };
  if (r.note === 'form-closed') return { state: 'broken', msg: 'เปิดได้ แต่ฟอร์มนี้ปิดรับคำตอบแล้ว' };
  const s = r.status;
  let host = '';
  try { if (r.finalUrl) host = new URL(r.finalUrl).host; } catch { /* ignore */ }
  const meeting = /(^|\.)(zoom\.us|meet\.google\.com|teams\.microsoft\.com|teams\.live\.com|webex\.com)$/i.test((() => { try { return new URL(r.finalUrl || r.url).hostname; } catch { return ''; } })());
  if (s >= 200 && s < 300) return { state: 'ok', msg: `เปิดได้ (HTTP ${s})${host ? ' → ไปที่ ' + host : ''}${meeting ? ' · ตรวจได้แค่ว่าหน้าเว็บเปิดได้ ไม่ได้ยืนยันว่าห้องประชุมมีจริง' : ''}` };
  if (s === 530 || s === 523 || s === 522) return { state: 'broken', msg: `เชื่อมต่อไม่ได้ (หาเว็บไม่พบหรือเว็บล่ม · HTTP ${s})` };
  if (s === 404 || s === 410) return { state: 'broken', msg: `ไม่พบหน้านี้ (HTTP ${s})` };
  if ([401, 403, 405, 429, 999].includes(s)) return { state: 'warn', msg: `ปลายทางไม่ให้ตรวจอัตโนมัติ (HTTP ${s}) — เปิดดูเองอีกครั้ง` };
  if (s >= 500) return { state: 'warn', msg: `เซิร์ฟเวอร์ปลายทางขัดข้อง (HTTP ${s})` };
  return { state: 'warn', msg: `ได้รับ HTTP ${s} — เปิดดูเองอีกครั้ง` };
}

const linkCache = new Map();
// ตรวจลิงก์ผ่าน Worker ของ M Hub (ฝั่งเซิร์ฟเวอร์ ไม่ติด CORS) ถ้าไม่มีให้ลองจากเบราว์เซอร์
export async function checkLinks(urls) {
  const todo = urls.filter((u) => !linkCache.has(u) || Date.now() - linkCache.get(u).at > 5 * 60 * 1000);
  if (todo.length) {
    let results = null;
    try {
      const r = await fetch('/api/linkcheck', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ urls: todo }) });
      if (r.ok) results = (await r.json()).results;
    } catch { /* ไม่มีเซิร์ฟเวอร์ตรวจ */ }
    if (!results) {
      results = await Promise.all(todo.map(async (url) => {
        try {
          const r = await fetch(url, { method: 'HEAD', mode: 'cors', redirect: 'follow' });
          return { url, status: r.status, finalUrl: r.url !== url ? r.url : undefined };
        } catch { return { url, cors: true }; }
      }));
    }
    for (const r of results) linkCache.set(r.url, { at: Date.now(), r });
  }
  return Object.fromEntries(urls.map((u) => [u, linkCache.get(u) && linkCache.get(u).r]));
}

// ---------- ความยาวตามแบบนับของ X (ลิงก์นับ 23 ตัว) ----------
export function xLength(text) {
  let t = String(text || '');
  let n = 0;
  t = t.replace(URL_RE, () => { n += 23; return ''; });
  return n + [...t.normalize('NFC')].length;
}

const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'word' }) : null;
export function wordCount(s) {
  if (!segmenter) return String(s || '').split(/\s+/).filter(Boolean).length;
  return [...segmenter.segment(String(s || ''))].filter((x) => x.isWordLike).length;
}

const has = (f, key) => {
  if (key === 'guests') return (f.guests || []).some((g) => g && (g.name || g.nameEn));
  if (key === 'changes') return false;
  return !!String(f[key] || '').trim();
};

// ---------- ตรวจทั้งหมด ----------
/**
 * ctx: { fields, kind, tone, channel, lang, style, settings, subject, prevFields, staff, linkResults }
 */
export function checkPost(text, ctx) {
  const items = [];
  const add = (level, msg, extra = {}) => items.push({ level, msg, ...extra });
  const f = ctx.fields || {};
  const ch = channelOf(ctx.channel);
  const customTones = (ctx.settings && ctx.settings.customTones) || [];
  const tone = toneOf(ctx.tone, customTones);
  const toneId = ch.forceTone || tone.base || tone.id;
  const toneDef = TONES.find((t) => t.id === toneId) || tone;
  const style = ctx.style || {};
  const body = String(text || '');
  const full = (ctx.subject ? ctx.subject + '\n' : '') + body;

  // 1) ช่องที่ยังไม่กรอก
  const missing = (REQUIRED[ctx.kind] || []).filter((k) => !k.split('|').some((x) => (x === 'changes' ? !!ctx.prevFields : has(f, x))));
  if (missing.length) add('error', 'ยังไม่ได้กรอก: ' + missing.map((k) => k.split('|').map((x) => (x === 'changes' ? 'การเปลี่ยนแปลง' : fieldLabel(x, ctx.kind).replace(/\s*\(.*\)$/, ''))).join(' หรือ ')).join(', '), { code: 'missing' });
  if (ctx.lang !== 'th' && f.title && !f.titleEn) add('warn', 'ยังไม่ได้กรอกชื่องานภาษาอังกฤษ', { code: 'missing-en' });
  const blanks = [...full.matchAll(/\[กรอก:\s*([^\]]+)\]/g)].map((m) => m[1]);
  if (blanks.length) add('error', `ยังมีช่องให้เติม ${blanks.length} จุด: ${[...new Set(blanks)].join(', ')}`, { code: 'blank' });

  // 2) วันกับวันที่ และปี
  const refYear = (parseISO(f.date) || new Date()).getFullYear();
  const dates = findDates(full, refYear);
  let okCount = 0;
  const known = new Set();
  const a = parseISO(f.date), b = parseISO(f.endDate) || a;
  if (a) for (let d = new Date(a); d <= b && known.size < 60; d.setDate(d.getDate() + 1)) known.add(toISO(d));
  if (f.deadline) known.add(f.deadline);
  if (ctx.prevFields) { if (ctx.prevFields.date) known.add(ctx.prevFields.date); if (ctx.prevFields.deadline) known.add(ctx.prevFields.deadline); }
  const nowY = new Date().getFullYear();
  const seenMismatch = new Set();
  for (const d of dates) {
    const where = `“${d.raw}”`;
    if (!d.valid) { add('error', `${where} ไม่มีวันนี้จริงในปฏิทิน`, { code: 'date-invalid' }); continue; }
    if (d.stated != null && d.stated !== d.actual) {
      const lang = d.lang;
      add('error', lang === 'th'
        ? `${where}: วันที่ ${shortDate(d)} ตรงกับวัน${weekdayName(d.actual, 'th')} ไม่ใช่วัน${weekdayName(d.stated, 'th')}`
        : `${where}: ${shortDate(d)} is a ${weekdayName(d.actual, 'en')}, not ${weekdayName(d.stated, 'en')}`,
      { code: 'weekday', fix: d.statedRaw ? { from: d.raw, to: d.raw.replace(d.statedRaw, fixWeekdayText(d.statedRaw, d.actual, lang)), label: 'แก้เป็นวัน' + weekdayName(d.actual, 'th') } : null });
    } else if (d.stated != null) okCount++;
    if (d.lang === 'th' && d.era === 'CE' && !d.explicitCE && /\d{4}/.test(d.raw)) {
      const y = String(d.year);
      add('warn', `${where}: ข้อความภาษาไทยควรใช้ปี พ.ศ. (${d.year + 543}) ไม่ใช่ ค.ศ. ${y}`, { code: 'era', fix: { from: d.raw, to: d.raw.replace(y, String(d.year + 543)), label: `เปลี่ยนเป็น ${d.year + 543}` } });
    }
    if (d.lang === 'en' && d.era === 'BE') {
      const y = String(d.year + 543);
      add('warn', `${where}: English text should use CE (${d.year}), not B.E. ${y}`, { code: 'era', fix: { from: d.raw, to: d.raw.replace(y, String(d.year)), label: `เปลี่ยนเป็น ${d.year}` } });
    }
    if (!d.yearMissing && Math.abs(d.year - nowY) > 1) add('warn', `${where}: ปี ${d.lang === 'th' ? d.year + 543 : d.year} ห่างจากปีปัจจุบันมาก ตรวจว่าพิมพ์ถูกหรือไม่`, { code: 'year-far' });
    if (d.yearMissing && d.stated != null) add('info', `${where} ไม่ได้ระบุปี (ตรวจวันโดยถือว่าเป็นปี ${d.lang === 'th' ? d.year + 543 : d.year})`, { code: 'year-missing' });
    if (known.size && !known.has(d.iso) && !seenMismatch.has(d.iso) && ctx.kind !== 'recap') {
      seenMismatch.add(d.iso);
      add('info', `${where} ไม่ตรงกับวันงานหรือวันปิดรับในข้อมูลงาน — ตรวจว่าตั้งใจหรือไม่`, { code: 'date-other' });
    }
  }
  if (okCount) add('ok', `วันกับวันที่ตรงกัน ${okCount} จุด`, { code: 'weekday-ok' });

  // วันที่ในข้อมูลงาน
  const today = todayISO();
  if (f.date && ['invite', 'meeting', 'reminder', 'announce'].includes(ctx.kind) && (f.endDate || f.date) < today) add('warn', 'วันงานผ่านไปแล้ว ตรวจวันที่ในข้อมูลงานอีกครั้ง', { code: 'past' });
  if (f.deadline && f.date && f.deadline > (f.endDate || f.date)) add('warn', 'วันปิดรับลงทะเบียนอยู่หลังวันงาน', { code: 'deadline-after' });
  if (f.endDate && f.date && f.endDate < f.date) add('error', '“ถึงวันที่” อยู่ก่อนวันเริ่มงาน', { code: 'range' });
  if (f.startTime && f.endTime && f.endTime <= f.startTime) add('warn', 'เวลาสิ้นสุดไม่ได้อยู่หลังเวลาเริ่ม', { code: 'time' });
  for (const t of findTimeRanges(full)) {
    t.raw = t.raw.trim();
    if (t.bad) add('error', `“${t.raw}” เวลาไม่ถูกต้อง`, { code: 'time-bad' });
    else if (t.reversed) add('warn', `“${t.raw}” เวลาสิ้นสุดไม่ได้อยู่หลังเวลาเริ่ม`, { code: 'time-rev' });
  }

  // 3) ลิงก์
  const links = findLinks(full);
  for (const l of links) for (const i of l.issues) add(i.level, `${l.display}: ${i.msg}`, { code: 'link-format', fix: i.fix });
  if (links.length && ch.noClickLinks) add('info', 'Instagram กดลิงก์ในแคปชันไม่ได้ ใส่ลิงก์ไว้ในโปรไฟล์ (bio) หรือสติกเกอร์ลิงก์ใน Story', { code: 'ig-links' });
  for (const k of ['regLink', 'meetingLink']) {
    if (f[k] && !/^https?:\/\/\S+$/i.test(f[k].trim())) add('warn', `${fieldLabel(k)} ในข้อมูลงานควรขึ้นต้นด้วย https:// และไม่มีช่องว่าง`, { code: 'link-field' });
  }

  // 4) ถ้อยคำต้องห้าม / ที่ต้องมี
  for (const w of style.banned || []) {
    if (!w.word) continue;
    const n = full.split(w.word).length - 1;
    if (!n) continue;
    add(w.level === 'error' ? 'error' : 'warn', `พบ “${w.word}” ${n} จุด${w.suggest ? ` → ควรใช้ “${w.suggest}”` : ''}${w.note ? ` (${w.note})` : ''}`,
      { code: 'banned', fix: w.suggest ? { from: w.word, to: w.suggest, all: true, label: `แทนด้วย “${w.suggest}”` } : null });
  }
  for (const r of style.required || []) {
    if (!r.text || (r.lang && r.lang !== '*' && !(ctx.lang === r.lang || ctx.lang === 'both'))) continue;
    if (r.rule === 'firstFull') {
      const short = r.short || r.text;
      const at = body.indexOf(short);
      if (at < 0) continue;
      if (!body.startsWith(r.text, at)) {
        const tail = body.slice(at + short.length, at + short.length + 3);
        if (!(r.lang === 'th' && /^\s*มธ/.test(tail))) {
          add('warn', `การกล่าวถึงครั้งแรกควรใช้ชื่อเต็ม “${r.text}”`, { code: 'required', fix: { from: short, to: r.text, label: 'ใช้ชื่อเต็มครั้งแรก' } });
        } else add('warn', `การกล่าวถึงครั้งแรกควรใช้ชื่อเต็ม “${r.text}” แทนคำย่อ`, { code: 'required' });
      }
    } else if (!full.includes(r.text)) {
      add('warn', `ควรมีถ้อยคำ “${r.text}”${r.note ? ` (${r.note})` : ''}`, { code: 'required' });
    }
  }

  // 5) ชื่อและตำแหน่งเทียบฐานข้อมูลบุคลากร
  for (const s of ctx.staff || []) checkStaffName(full, s, add);

  // 6) ตามช่องทางและโทน
  const len = ch.id === 'x' ? xLength(body) : [...body].length;
  if (len > ch.maxLen) add('error', `ยาวเกินที่ ${ch.th} รับได้ (${len.toLocaleString()} / ${ch.maxLen.toLocaleString()} ตัวอักษร)`, { code: 'len' });
  else if (len > ch.recLen) add('info', `ค่อนข้างยาวสำหรับ ${ch.th} (${len.toLocaleString()} ตัวอักษร แนะนำไม่เกิน ${ch.recLen.toLocaleString()})`, { code: 'len-rec' });
  const tags = (body.match(/(^|\s)#[^\s#]+/g) || []).length;
  if (tags > ch.maxTags) add('warn', `${ch.th} ไม่ควรใส่แฮชแท็กเกิน ${ch.maxTags} อัน (ตอนนี้ ${tags})`, { code: 'tags' });
  const emo = countEmoji(full);
  if (ctx.kind === 'condolence') {
    if (emo) add('error', 'โพสต์ไว้อาลัยไม่ควรมีอีโมจิ', { code: 'condolence-emoji' });
    if (tags) add('warn', 'โพสต์ไว้อาลัยไม่ควรมีแฮชแท็ก', { code: 'condolence-tags' });
    if (toneId === 'teen' || toneId === 'casual') add('info', 'โพสต์ไว้อาลัยใช้ถ้อยคำสุภาพเสมอ เทมเพลตจึงปรับเป็นภาษาสุภาพให้', { code: 'condolence-tone' });
  } else if (!ch.emoji) {
    if (emo) add('warn', `${ch.th} ไม่ควรมีอีโมจิ (พบ ${emo} ตัว)`, { code: 'emoji' });
  } else if (toneDef.emoji) {
    const [lo, hi] = toneDef.emoji;
    if (emo > hi) add('warn', `โทน${toneDef.th}ควรมีอีโมจิไม่เกิน ${hi} ตัว (ตอนนี้ ${emo})`, { code: 'emoji' });
    else if (emo < lo) add('info', `โทน${toneDef.th}มักใช้อีโมจิ ${lo}–${hi} ตัว (ตอนนี้ ${emo})`, { code: 'emoji' });
  }
  if (ch.subject && ch.id === 'email' && !String(ctx.subject || '').trim()) add('warn', 'อีเมลยังไม่มีหัวเรื่อง', { code: 'subject' });
  if (ch.id === 'circular' && ctx.tone !== 'official') add('info', 'หนังสือเวียนใช้ภาษาแบบราชการเสมอ จึงใช้เนื้อหาโทนราชการ', { code: 'circular-tone' });
  if (ch.poster) {
    const m = body.match(/^(?:พาดหัว|Headline):\s*(.+)$/m);
    if (m) { const n = wordCount(m[1]); if (n > 8) add('warn', `พาดหัวโปสเตอร์ยาว ${n} คำ ควรไม่เกิน 8 คำ`, { code: 'poster-head' }); }
  }

  // 7) อื่น ๆ
  if (/[๐-๙]/.test(body) && /[0-9]/.test(body)) add('info', 'ใช้ตัวเลขไทยและเลขอารบิกปนกัน ควรเลือกแบบเดียวทั้งโพสต์', { code: 'digits' });
  if (/ครับ/.test(body) && /(ค่ะ|คะ)/.test(body)) add('warn', 'มีทั้ง “ครับ” และ “ค่ะ/คะ” ในโพสต์เดียว', { code: 'particle' });
  if (/ {2,}/.test(body.replace(/^ +/gm, ''))) add('info', 'มีการเว้นวรรคซ้อนกัน', { code: 'spaces', fix: { from: /([^\n ]) {2,}/g, to: '$1 ', label: 'ลบวรรคซ้อน', regex: true } });

  if (!items.some((i) => i.level === 'error' || i.level === 'warn')) add('ok', 'ไม่พบปัญหาที่ตรวจได้อัตโนมัติ — อ่านทวนอีกครั้งก่อนโพสต์', { code: 'clean' });
  items.sort((x, y) => LEVEL_ORDER[x.level] - LEVEL_ORDER[y.level]);
  return { items, links };
}

// ใช้ปุ่ม "แก้ให้" กับข้อความ
export function applyFix(text, fix) {
  if (!fix) return text;
  if (fix.regex) return text.replace(fix.from, fix.to);
  if (fix.all) return text.split(fix.from).join(fix.to);
  const i = text.indexOf(fix.from);
  if (i < 0) {
    // ข้อความที่ตรวจเจอถูกแปลงเลขไทยเป็นอารบิก ลองหาแบบเลขไทย
    const src = thaiDigits(text);
    const j = src.indexOf(fix.from);
    if (j < 0) return text;
    const orig = text.slice(j, j + fix.from.length);
    return text.slice(0, j) + (/[๐-๙]/.test(orig) ? toThaiDigits(fix.to) : fix.to) + text.slice(j + fix.from.length);
  }
  return text.slice(0, i) + fix.to + text.slice(i + fix.from.length);
}

// ---------- ชื่อ/ตำแหน่งวิชาการ ----------
const TITLE_ABBR = [['ศาสตราจารย์เกียรติคุณ', 'ศ.เกียรติคุณ'], ['รองศาสตราจารย์', 'รศ.'], ['ผู้ช่วยศาสตราจารย์', 'ผศ.'], ['ศาสตราจารย์', 'ศ.'], ['อาจารย์', 'อ.']];
const normTitle = (s) => {
  let t = String(s || '').replace(/\s+/g, '');
  for (const [full, ab] of TITLE_ABBR) t = t.split(full).join(ab.replace(/\s/g, ''));
  return t.replace(/\.$/, '');
};
function checkStaffName(text, s, add) {
  for (const [name, title, lang] of [[s.nameTh, s.titleTh, 'th'], [s.nameEn, s.titleEn, 'en']]) {
    if (!name || name.length < 4) continue;
    let at = text.indexOf(name);
    while (at >= 0) {
      const before = text.slice(Math.max(0, at - 40), at);
      const m = lang === 'th'
        ? before.match(/((?:ศาสตราจารย์เกียรติคุณ|รองศาสตราจารย์|ผู้ช่วยศาสตราจารย์|ศาสตราจารย์|อาจารย์|ศ\.|รศ\.|ผศ\.|อ\.)\s*(?:ดร\.)?\s*|ดร\.\s*|นาย\s*|นางสาว\s*|นาง\s*|คุณ\s*)$/)
        : before.match(/((?:Professor Emeritus|Emeritus Professor|Associate Professor|Assistant Professor|Professor|Assoc\. Prof\.|Asst\. Prof\.|Prof\.|Ajarn|Lecturer)\s*(?:Dr\.)?\s*|Dr\.\s*|Mr\.\s*|Ms\.\s*|Mrs\.\s*)$/i);
      const used = m ? m[1].trim() : '';
      if (title && normTitle(used) !== normTitle(title)) {
        add('warn', used
          ? `“${used}${lang === 'th' && /\.$/.test(used) ? '' : ' '}${name}”: ในฐานข้อมูลบุคลากรใช้ “${title}”`
          : `“${name}”: ควรมีคำนำหน้า/ตำแหน่งวิชาการ “${title}” ตามฐานข้อมูลบุคลากร`, { code: 'staff-title', fix: { from: (used ? used : '') + (used && /\s$/.test(m[1]) ? ' ' : '') + name, to: title + (lang === 'th' && /ดร\.$/.test(title) ? '' : ' ') + name, label: 'ใช้ตามฐานข้อมูล' } });
        break;
      }
      at = text.indexOf(name, at + name.length);
    }
  }
}
