// คลังโพสต์ที่ใช้จริง: เลือกตัวอย่างที่คล้ายที่สุด 1–3 โพสต์ (ไม่ส่งทั้งคลัง) และแปลงโพสต์เป็นเทมเพลต
import { eventTypeOf } from './fields.js';
import { buildVars } from './templates.js';

// โพสต์ตัวอย่างที่มีไว้ให้หน้าสถิติเท่านั้น (statsOnly) ไม่อยู่ในคลัง
export const isLibrary = (p) => p && !p.deleted && !p.statsOnly && (p.status === 'approved' || p.status === 'posted');

const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'word' }) : null;
const STOP = new Set(['และ', 'ที่', 'ใน', 'ของ', 'การ', 'ได้', 'จะ', 'มี', 'เป็น', 'ให้', 'กับ', 'the', 'and', 'of', 'to', 'in', 'for', 'a', 'on', 'at']);
export function keywords(text) {
  const s = String(text || '').toLowerCase().replace(/https?:\/\/\S+/g, ' ');
  const words = seg ? [...seg.segment(s)].filter((x) => x.isWordLike).map((x) => x.segment) : s.split(/[^\p{L}\p{N}]+/u);
  return new Set(words.filter((w) => w.length > 1 && !STOP.has(w) && !/^\d+$/.test(w)));
}
const jaccard = (a, b) => { if (!a.size || !b.size) return 0; let n = 0; for (const x of a) if (b.has(x)) n++; return n / (a.size + b.size - n); };

/**
 * คะแนน = แท็กที่ตรง (ประเภท 3, ช่องทาง 2, โทน 2, ประเภทงาน 2, ภาษา 1, แท็กของผู้ใช้ 1) + ความคล้ายของคำ × 6
 * คืนไม่เกิน max โพสต์ที่คะแนน ≥ 2
 */
export function pickExamples(posts, { kind, channel, tone, lang, fields = {} }, max = 3) {
  const q = keywords([fields.title, fields.titleEn, fields.notes, eventTypeOf(fields.eventType).label, fields.audience].filter(Boolean).join(' '));
  const qTags = new Set([kind, channel, tone, fields.eventType, lang].filter(Boolean));
  return posts.filter((p) => isLibrary(p) && !p.noExample && p.text)
    .map((p) => {
      let score = (p.kind === kind ? 3 : 0) + (p.channel === channel ? 2 : 0) + (p.tone === tone ? 2 : 0) + (p.eventType && p.eventType === fields.eventType ? 2 : 0) + (p.lang === lang ? 1 : 0);
      score += (p.tags || []).filter((t) => qTags.has(t)).length;
      score += jaccard(q, keywords(String(p.text).slice(0, 600))) * 6;
      return { p, score };
    })
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score || String(b.p.updatedAt).localeCompare(String(a.p.updatedAt)))
    .slice(0, max)
    .map((x) => x.p);
}

// แปลงโพสต์เป็นเทมเพลต: แทนข้อมูลของงานด้วย {{ตัวแปร}} (ยาวก่อนสั้น) — ไม่ใช้ AI
export function postToTemplate(text, fields, lang, kind) {
  let t = String(text || '');
  if (!fields) return t;
  const v = buildVars(fields, lang === 'en' ? 'en' : 'th', { kind });
  const keys = ['infoBlock', 'host', 'date', 'dateShort', 'dateNoDay', 'time', 'deadline', 'deadlineShort', 'title', 'place', 'chair', 'guestsInline', 'guestNames', 'audience', 'regLink', 'meetingLink', 'meetingId', 'contact', 'notes'];
  const pairs = keys.map((k) => [k, String(v[k] || '')]).filter(([, val]) => val.length >= 4 && !val.startsWith('[กรอก')).sort((a, b) => b[1].length - a[1].length);
  for (const [k, val] of pairs) t = t.split(val).join(`{{${k}}}`);
  return t;
}
