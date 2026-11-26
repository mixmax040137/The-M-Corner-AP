// โหมด AI ของ L'Arts PR Writer: Claude (ใช้ API key ของผู้ใช้ในเบราว์เซอร์) หรือ AI ฟรีของ Cloudflare (ผ่าน Worker ของ M Hub)
// ประหยัด token: ส่งเฉพาะข้อมูลที่ยืนยันแล้ว + กฎสั้น ๆ + ตัวอย่างไม่เกิน 3 โพสต์, แคชผลลัพธ์ (ข้อมูลเดิม+ตัวเลือกเดิม ไม่เรียกซ้ำ),
// แสดงประมาณ token/ค่าใช้จ่ายก่อนเรียกทุกครั้ง และบันทึกยอดจริงรายเดือน
import { repo, apiKey } from './db.js';
import { estimateTokens } from '../core/thai.js';
import { FIELDS, TONES, KINDS, CHANNELS, LANGS, channelOf, eventTypeOf, toneOf, baseTone, FACULTY } from './fields.js';
import { fmtRange, fmtTime, fmtDate } from './dates.js';
import { buildVars, pickHashtags } from './templates.js';
import { diffFields } from './versions.js';

// คำสั่งระบบตามที่หน่วยงานกำหนด (ใช้ตามตัวอักษร)
export const SYSTEM_PROMPT = `You are the PR writer for the Faculty of Liberal Arts (คณะศิลปศาสตร์), Thammasat University. You receive: event facts, tone, language, channel, style rules and up to 3 approved past posts.
1. Use only the facts given. Never invent names, titles, numbers, dates or links. If something important is missing, write [กรอก: ...].
2. Check each weekday matches its date. Thai dates in พ.ศ., English dates in CE.
3. Write names and academic titles exactly as given.
4. Follow the tone definitions and the channel's length, emoji and hashtag rules.
5. Bilingual: Thai first, then a natural English version.
6. Match the style of the past posts without copying whole sentences.
7. Put key info (date, time, place, link) in an easy-to-scan block.
8. Output JSON: {"variant1": "...", "variant2": "...", "check": ["..."]}. No other text.`;

export const POST_SCHEMA = {
  type: 'object',
  properties: { variant1: { type: 'string' }, variant2: { type: 'string' }, check: { type: 'array', items: { type: 'string' } } },
  required: ['variant1', 'variant2', 'check'],
  additionalProperties: false,
};

export const EXTRACT_SYSTEM = `You extract event facts for the PR unit of the Faculty of Liberal Arts, Thammasat University. Use only what the text states; leave a field as "" when it is not stated. Dates as YYYY-MM-DD in CE (convert พ.ศ. by subtracting 543). Times as HH:MM (24-hour). Keep names, academic titles and links exactly as written. Output JSON only.`;
const S = { type: 'string' };
export const EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    title: S, titleEn: S, eventType: { type: 'string', enum: ['seminar', 'lecture', 'conference', 'workshop', 'meeting', 'student', 'ceremony', 'exhibition', 'admission', 'other'] },
    date: S, endDate: S, startTime: S, endTime: S, place: S, placeEn: S, organizer: S, chair: S,
    guests: { type: 'array', items: { type: 'object', properties: { name: S, role: S }, required: ['name', 'role'], additionalProperties: false } },
    audience: S, regLink: S, deadline: S, meetingLink: S, meetingId: S, contactName: S, phone: S, email: S, notes: S,
  },
  required: ['title', 'titleEn', 'eventType', 'date', 'endDate', 'startTime', 'endTime', 'place', 'placeEn', 'organizer', 'chair', 'guests', 'audience', 'regLink', 'deadline', 'meetingLink', 'meetingId', 'contactName', 'phone', 'email', 'notes'],
  additionalProperties: false,
};

// ราคา (USD ต่อ 1 ล้าน token) และการตั้งค่าต่อรุ่น — Haiku 5.5 นับ token ภาษาเดียวกันมากกว่ารุ่นเก่าราว 30%
export const CLAUDE_MODELS = {
  'claude-haiku-5-5': { label: 'Claude Haiku 5.5', in: 0.10, out: 0.50, factor: 1.3, thinking: { type: 'disabled' }, effort: 'low' },
  'claude-sonnet-5-5': { label: 'Claude Sonnet 5.5', in: 2, out: 10, factor: 1, thinking: { type: 'between_tools' }, effort: 'low' },
  'claude-opus-5-5': { label: 'Claude Opus 5.5', in: 4, out: 20, factor: 1, effort: 'low' },
};
export const FREE_MODEL = 'cf';
export const THB_PER_USD = 36;

// เลือกผู้ให้บริการของช่อง “ร่าง” หรือ “ขัดเกลา” — ยังไม่มี key ก็ใช้ AI ฟรีแทน
export function routeFor(slot, settings) {
  const m = (slot === 'polish' ? settings.polishModel : settings.draftModel) || 'claude-haiku-5-5';
  if (m === FREE_MODEL) return { provider: 'cf', model: FREE_MODEL, label: 'AI ฟรี (Cloudflare)' };
  if (!apiKey.get()) return { provider: 'cf', model: FREE_MODEL, label: 'AI ฟรี (Cloudflare)', fallback: true };
  return { provider: 'claude', model: m, label: (CLAUDE_MODELS[m] || {}).label || m };
}

const IMAGE_TOKENS = 1600; // รูป ~1,568 px ≈ 1,600 token
export function estimate(route, { system = '', user = '', images = 0, outTok = 800 }) {
  const meta = CLAUDE_MODELS[route.model] || { in: 0, out: 0, factor: 1.2 };
  const inTok = Math.ceil((estimateTokens(system) + estimateTokens(user)) * meta.factor) + images * IMAGE_TOKENS;
  const out = Math.ceil(outTok * meta.factor);
  const usd = route.provider === 'claude' ? (inTok * meta.in + out * meta.out) / 1e6 : 0;
  return { inTok, outTok: out, usd, thb: usd * THB_PER_USD };
}
export const costOf = (model, inTok, outTok) => { const m = CLAUDE_MODELS[model]; return m ? (inTok * m.in + outTok * m.out) / 1e6 : 0; };
export function fmtCost(e) {
  if (!e.usd) return `~${(e.inTok + e.outTok).toLocaleString()} token · ฟรี`;
  const satang = e.thb * 100;
  return `~${(e.inTok + e.outTok).toLocaleString()} token · ≈ ${satang < 100 ? satang.toFixed(satang < 1 ? 2 : 1) + ' สตางค์' : e.thb.toFixed(2) + ' บาท'} ($${e.usd.toFixed(4)})`;
}

async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function parseJSON(text) {
  const t = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try { return JSON.parse(t); } catch { /* ลองตัดเฉพาะส่วน JSON */ }
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch { /* ignore */ } }
  throw new Error('AI ตอบกลับไม่เป็นรูปแบบที่อ่านได้ ลองใหม่อีกครั้ง');
}

async function logUsage(rec) {
  await repo.put('usage', { at: new Date().toISOString(), ...rec }, { silent: true });
}

// ---------- Claude ----------
let sdk;
async function claudeClient() {
  sdk ||= (await import('../vendor/anthropic.mjs')).Anthropic;
  return { Anthropic: sdk, client: new sdk({ apiKey: apiKey.get(), dangerouslyAllowBrowser: true, maxRetries: 1, timeout: 90_000 }) };
}

function friendly(e, A) {
  const msg = String((e && e.message) || e);
  if (A && e instanceof A.AuthenticationError) return 'API key ไม่ถูกต้องหรือถูกยกเลิกแล้ว — ตรวจที่หน้าตั้งค่า';
  if (A && e instanceof A.PermissionDeniedError) return 'key นี้ไม่มีสิทธิ์ใช้รุ่นนี้ — ลองเปลี่ยนรุ่นในหน้าตั้งค่า';
  if (A && e instanceof A.NotFoundError) return 'ไม่พบรุ่นที่ตั้งไว้ — ตรวจชื่อรุ่นในหน้าตั้งค่า';
  if (A && e instanceof A.RateLimitError) return 'เรียกใช้ถี่เกินไป รอสักครู่แล้วลองใหม่';
  if (/credit balance|billing/i.test(msg)) return 'เครดิตใน Anthropic Console ไม่พอ — เติมเครดิตแล้วลองใหม่ (หรือเปลี่ยนเป็น AI ฟรีในหน้าตั้งค่า)';
  if (A && e instanceof A.APIConnectionError) return 'เชื่อมต่อ Claude ไม่ได้ — ตรวจอินเทอร์เน็ต';
  if (A && e instanceof A.InternalServerError) return 'ระบบ Claude ขัดข้องหรือมีผู้ใช้มาก ลองใหม่อีกครั้ง';
  if (A && e instanceof A.APIError) return `Claude แจ้งข้อผิดพลาด (${e.status || ''}): ${msg.slice(0, 160)}`;
  return msg;
}

async function callClaude(route, { system, user, schema, images, maxTokens }) {
  const { Anthropic, client } = await claudeClient();
  const meta = CLAUDE_MODELS[route.model] || {};
  const content = [
    ...images.map((d) => {
      const [, mt, data] = /^data:([^;]+);base64,(.*)$/.exec(d) || [];
      return { type: 'image', source: { type: 'base64', media_type: mt || 'image/jpeg', data } };
    }),
    { type: 'text', text: user },
  ];
  const params = {
    model: route.model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content }],
    output_config: { format: { type: 'json_schema', schema }, ...(meta.effort ? { effort: meta.effort } : {}) },
    ...(meta.thinking ? { thinking: meta.thinking } : {}),
  };
  let resp;
  try { resp = await client.messages.create(params); } catch (e) { throw new Error(friendly(e, Anthropic)); }
  if (resp.stop_reason === 'refusal') throw new Error('Claude ไม่เขียนเรื่องนี้ให้ — ลองปรับข้อมูล หรือใช้โหมดเทมเพลต');
  if (resp.stop_reason === 'max_tokens') throw new Error('ข้อความยาวเกินขีดจำกัด — ลองเลือกภาษาเดียว หรือย่อรายละเอียด');
  const text = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  return { data: parseJSON(text), inTok: resp.usage.input_tokens, outTok: resp.usage.output_tokens, model: resp.model || route.model };
}

// ---------- AI ฟรี (Cloudflare Workers AI ผ่าน Worker ของ M Hub) ----------
async function callFree({ purpose, system, user, schema, images, maxTokens }) {
  if (images.length) throw new Error('AI ฟรีอ่านรูปโดยตรงไม่ได้ — ใช้ข้อความจาก OCR แทน หรือใส่ Claude API key');
  let r;
  try {
    r = await fetch('/api/ai/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ purpose, system, user, schema, max_tokens: maxTokens }) });
  } catch { throw new Error('เชื่อมต่อ AI ฟรีไม่ได้ — ตรวจอินเทอร์เน็ต'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.text) throw new Error(j.error || 'AI ฟรีใช้ไม่ได้ (HTTP ' + r.status + ')');
  return { data: parseJSON(j.text), inTok: (j.usage && j.usage.input_tokens) || 0, outTok: (j.usage && j.usage.output_tokens) || 0, model: j.model || FREE_MODEL };
}

/**
 * เรียก AI 1 ครั้ง (มีแคช) → { data, cached, inTok, outTok, costUSD, model, provider }
 */
const cacheKey = (route, { purpose, system, user, schema, images = [] }) =>
  sha256(JSON.stringify({ v: 1, purpose, provider: route.provider, model: route.model, system, user, schema, images: images.map((x) => x.length + ':' + x.slice(-64)) }));
// เคยเรียกด้วยข้อมูลชุดนี้แล้วหรือยัง (ถ้าใช่ จะใช้ผลเดิม ไม่เสีย token)
export async function isCached(route, req) { return !!(await repo.cacheGet(await cacheKey(route, req))); }

export async function callAI(route, { purpose, system, user, schema, images = [], maxTokens = 2500 }) {
  const key = await cacheKey(route, { purpose, system, user, schema, images });
  const hit = await repo.cacheGet(key);
  if (hit) {
    await logUsage({ provider: route.provider, model: route.model, purpose, inTok: 0, outTok: 0, costUSD: 0, cached: true });
    return { ...hit, cached: true, costUSD: 0 };
  }
  const res = route.provider === 'claude'
    ? await callClaude(route, { system, user, schema, images, maxTokens })
    : await callFree({ purpose, system, user, schema, images, maxTokens });
  const costUSD = route.provider === 'claude' ? costOf(route.model, res.inTok, res.outTok) : 0;
  const out = { data: res.data, inTok: res.inTok, outTok: res.outTok, model: res.model, provider: route.provider, costUSD };
  await repo.cacheSet(key, out);
  await logUsage({ provider: route.provider, model: res.model, purpose, inTok: res.inTok, outTok: res.outTok, costUSD, cached: false });
  return { ...out, cached: false };
}

// ---------- สร้างข้อความที่จะส่ง (สั้นที่สุด เฉพาะที่จำเป็น) ----------
const KIND_EN = Object.fromEntries(KINDS.map((k) => [k.id, k.en]));
const LANG_TEXT = { th: 'Thai', en: 'English', both: 'Thai first, then a natural English version' };

function facts(f, lang, kind) {
  const L = [];
  const add = (label, th, en) => {
    const v = lang === 'th' ? th : lang === 'en' ? (en || (th ? `${th} (Thai only; no English given)` : '')) : [th, en].filter(Boolean).join(' / ');
    if (v && String(v).trim()) L.push(`- ${label}: ${v}`);
  };
  const vt = buildVars(f, 'th', { kind }), ve = buildVars(f, 'en', { kind });
  const plain = (x) => (String(x || '').startsWith('[กรอก') ? '' : x);
  add('Title', f.title, f.titleEn);
  add('Event type', eventTypeOf(f.eventType).th, eventTypeOf(f.eventType).en);
  add('Date', vt.date, ve.date);
  add('Time', vt.time, ve.time);
  add('Venue', f.place, f.placeEn);
  add('Organizer', vt.host, plain(ve.host));
  add('Chair', f.chair, f.chairEn);
  const g = (f.guests || []).filter((x) => x && (x.name || x.nameEn));
  if (g.length) add('Speakers/guests', g.map((x) => [x.name, x.role].filter(Boolean).join(', ')).join('; '), g.map((x) => [x.nameEn, x.roleEn].filter(Boolean).join(', ')).filter(Boolean).join('; '));
  add('Audience', f.audience, f.audienceEn);
  add('Registration link', f.regLink, f.regLink);
  add('Registration deadline', fmtDate(f.deadline, 'th'), fmtDate(f.deadline, 'en'));
  add('Online meeting link', f.meetingLink, f.meetingLink);
  add('Meeting ID/passcode', f.meetingId, f.meetingId);
  add('Contact', [f.contactName, f.phone && 'โทร. ' + f.phone, f.email].filter(Boolean).join(' '), [f.contactNameEn, f.phone && 'Tel. ' + f.phone, f.email].filter(Boolean).join(', '));
  add('Notes', f.notes, f.notesEn);
  return L;
}

function rules(style, channelId, eventType, kind, tone, lang) {
  const ch = channelOf(channelId);
  const R = [];
  const tags = kind === 'condolence' ? '' : pickHashtags(style, ch.id, eventType, tone === 'official' ? Math.min(ch.tags, 2) : ch.tags);
  const t = TONES.find((x) => x.id === tone);
  R.push(`- Channel ${ch.th}: ${ch.short ? 'max 280 characters' : `about ${ch.recLen} characters or less`}; ${ch.emoji && t && t.emoji[1] > 0 && kind !== 'condolence' ? `emoji ${t.emoji[0]}–${t.emoji[1]}` : 'no emoji'}; ${tags ? 'end with these hashtags: ' + tags : 'no hashtags'}.`);
  if (ch.noClickLinks) R.push('- Instagram links are not clickable: keep the link but add a short "link in bio" note.');
  if (ch.subject) R.push(`- Start each variant with one line "${lang === 'en' ? 'Subject' : 'หัวเรื่อง'}: …" (${ch.id === 'web' ? 'news headline' : 'subject line'}), then a blank line, then the body.`);
  if (ch.id === 'email' || ch.id === 'circular') {
    const sig = (style.signatures || []).filter((s) => lang === 'both' || s.lang === lang).map((s) => s.text.replace(/\n/g, ' / ')).join(' | ');
    if (sig) R.push(`- End with this signature: ${sig}`);
  }
  if (ch.id === 'circular') R.push('- Thai official memo style (เรื่อง / เรียน / body / จึงเรียนมาเพื่อโปรดทราบ).');
  for (const r of (style.required || []).filter((x) => x.text && (!x.lang || x.lang === '*' || lang === 'both' || x.lang === lang))) {
    R.push(r.rule === 'firstFull' ? `- First mention must be in full: "${r.text}".` : `- Must include: "${r.text}".`);
  }
  const banned = (style.banned || []).filter((w) => w.word).slice(0, 15);
  if (banned.length) R.push('- Never use: ' + banned.map((w) => (w.suggest ? `${w.word} (use ${w.suggest})` : w.word)).join(', ') + '.');
  if (kind === 'condolence') R.push('- Condolence: respectful wording, no emoji, no hashtags.');
  return R;
}

/** ข้อความสำหรับ “ให้ AI เขียน 2 แบบ” */
export function buildWriteUser({ fields, kind, tone, lang, channel, style = {}, settings = {}, examples = [], prevFields = null }) {
  const customTones = settings.customTones || [];
  const t = toneOf(tone, customTones);
  const base = baseTone(tone, customTones);
  const toneDesc = (t.base ? t.desc : (style.toneNotes || {})[t.id]) || t.desc || '';
  const ch = channelOf(channel);
  const lines = [
    `POST TYPE: ${KIND_EN[kind] || kind}`,
    `TONE: ${t.th}${t.base ? ` (based on ${TONES.find((x) => x.id === base).th})` : ''} — ${toneDesc}`,
    `LANGUAGE: ${LANG_TEXT[lang] || 'Thai'}`,
    `CHANNEL: ${ch.th}`,
    'FACTS:', ...facts(fields, lang, kind),
  ];
  if (kind === 'change' && prevFields) {
    const d = diffFields(prevFields, fields).filter((x) => !/^notes/.test(x.field));
    if (d.length) lines.push('CHANGES (old → new; mark unchanged key info as ไม่เปลี่ยนแปลง and apologise):', ...d.map((x) => `- ${x.label}: ${x.old || '-'} → ${x.new || '-'}`));
  }
  lines.push('STYLE RULES:', ...rules(style, ch.id, fields.eventType, kind, base, lang));
  if (examples.length) {
    lines.push('APPROVED PAST POSTS (match the style, do not copy sentences):');
    examples.forEach((p, i) => lines.push(`[${i + 1}] ${String(p.text || '').slice(0, 700)}`));
  }
  lines.push('Write 2 different variants.');
  return lines.join('\n');
}

/** ข้อความสำหรับ “ขัดเกลา” */
export function buildPolishUser({ text, kind, tone, lang, channel, style = {}, settings = {} }) {
  const t = toneOf(tone, settings.customTones || []);
  const ch = channelOf(channel);
  return [
    `POST TYPE: ${KIND_EN[kind] || kind}`,
    `TONE: ${t.th} — ${(style.toneNotes || {})[t.base || t.id] || t.desc || ''}`,
    `LANGUAGE: ${LANG_TEXT[lang] || 'Thai'}`,
    `CHANNEL: ${ch.th}`,
    'STYLE RULES:', ...rules(style, ch.id, '', kind, t.base || t.id, lang),
    'TASK: Polish the post below so it reads naturally and smoothly in this tone. Keep every fact, name, academic title, date, time, number and link exactly as written, and keep the key-info block. Put the polished post in variant1, leave variant2 as "", and list anything that looks wrong or missing in check.',
    'POST:', String(text || ''),
  ].join('\n');
}

export const buildExtractUser = (text) => 'TEXT:\n' + String(text || '').slice(0, 8000);

// ตัวหัวเรื่องออกจากผลของช่องทางที่มีหัวเรื่อง (อีเมล/หนังสือเวียน/ข่าวเว็บ)
export function splitSubject(text) {
  const m = /^\s*(?:หัวเรื่อง|เรื่อง|Subject|Headline)\s*[:：]\s*(.+)\n+/i.exec(String(text || ''));
  return m ? { subject: m[1].trim(), body: String(text).slice(m[0].length).trim() } : { subject: '', body: String(text || '').trim() };
}

// ยอดใช้ AI ของเดือน
export async function monthUsage(month = new Date().toISOString().slice(0, 7)) {
  const logs = (await repo.list('usage')).filter((u) => String(u.at || '').startsWith(month));
  const sum = { calls: 0, cached: 0, free: 0, inTok: 0, outTok: 0, usd: 0 };
  for (const u of logs) {
    if (u.cached) { sum.cached++; continue; }
    sum.calls++;
    if (u.provider === 'cf') sum.free++;
    sum.inTok += u.inTok || 0;
    sum.outTok += u.outTok || 0;
    sum.usd += u.costUSD || 0;
  }
  return sum;
}

export { FIELDS, CHANNELS, LANGS, FACULTY, fmtRange, fmtTime };
