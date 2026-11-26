// ขั้นที่ 1 ของโหมด AI: อ่านไฟล์ในเครื่องก่อน (PDF ข้อความ / DOCX / OCR ไทยสำหรับรูปและ PDF สแกน) แล้วแยกข้อมูลแบบไม่ใช้ AI
// ส่ง AI เฉพาะเมื่อผู้ใช้กดเอง (แยกข้อมูลจากข้อความ หรืออ่านรูปโดยตรงด้วย Claude)
import { recognize } from '../core/ocr.js';
import { openPdf, renderPdfPage } from '../core/pdf.js';
import { decodeImage } from '../core/image.js';
import { findDates, findTimeRanges } from './dates.js';
import { findLinks } from './checker.js';
import { thaiDigits } from '../core/thai.js';

const MAX_SIDE = 1568;

function canvasToJpeg(src, w, h) {
  const s = Math.min(1, MAX_SIDE / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * s); c.height = Math.round(h * s);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.85);
}

async function imageData(file) {
  const img = await decodeImage(file);
  return canvasToJpeg(img, img.width, img.height);
}

async function pdfImages(file, maxPages = 2) {
  const doc = await openPdf(file);
  const out = [];
  for (let p = 1; p <= Math.min(doc.numPages, maxPages); p++) {
    const c = await renderPdfPage(doc, p, MAX_SIDE);
    out.push(canvasToJpeg(c, c.width, c.height));
  }
  doc.destroy();
  return out;
}

const decodeXml = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
export async function docxText(file) {
  const { PizZip } = await import('../vendor/docx.mjs');
  const zip = new PizZip(await file.arrayBuffer());
  const f = zip.file('word/document.xml');
  if (!f) throw new Error('ไฟล์ Word นี้อ่านไม่ได้');
  return decodeXml(f.asText().replace(/<w:tab\/>/g, '\t').replace(/<w:br[^>]*\/>/g, '\n').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, ''))
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** อ่านไฟล์ → { text, method: 'docx'|'pdf-text'|'ocr'|'text', images: [dataURL] (เฉพาะรูป/PDF สแกน เผื่อส่งให้ AI อ่าน) } */
export async function readSource(file, onProgress) {
  const name = (file.name || '').toLowerCase();
  if (/\.docx$/.test(name)) return { text: await docxText(file), method: 'docx', images: [] };
  if (/\.(txt|md|csv)$/.test(name)) return { text: await file.text(), method: 'text', images: [] };
  const isPdf = /\.pdf$/.test(name) || file.type === 'application/pdf';
  const isImg = /^image\//.test(file.type) || /\.(png|jpe?g|webp|heic|heif|gif|bmp|avif)$/.test(name);
  if (!isPdf && !isImg) throw new Error('รองรับไฟล์ PDF, Word (.docx), รูปภาพ หรือ .txt');
  const r = await recognize(file, { onProgress, maxPages: 5 });
  const images = r.method === 'ocr' ? (isPdf ? await pdfImages(file) : [await imageData(file)]) : [];
  return { text: r.text || '', method: r.method, images };
}

// ---------- แยกข้อมูลแบบไม่ใช้ AI ----------
const pad2 = (n) => String(n).padStart(2, '0');
const TYPE_WORDS = [
  [/ประชุมวิชาการ|conference/i, 'conference'], [/สัมมนา|เสวนา|seminar|forum/i, 'seminar'], [/บรรยาย|lecture|talk/i, 'lecture'],
  [/อบรม|เวิร์กช็อป|workshop|training/i, 'workshop'], [/นิทรรศการ|exhibition/i, 'exhibition'], [/รับสมัคร|ทุนการศึกษา|scholarship|application/i, 'admission'],
  [/พิธี|ceremony/i, 'ceremony'], [/ค่าย|กิจกรรม|camp|activity/i, 'student'], [/ประชุม|meeting/i, 'meeting'],
];
const DEADLINE_RE = /(ภายใน|ปิดรับ|หมดเขต|ก่อนวันที่|ภายในวันที่|ลงทะเบียนได้ถึง|deadline|by|before|closes?)\s*(?:วันที่|วัน)?\s*$/i;

export function heuristics(raw, refYear = new Date().getFullYear()) {
  const text = thaiDigits(String(raw || '').replace(/\r/g, ''));
  const f = {};
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  // ชื่องาน: ในเครื่องหมายคำพูด > บรรทัด “เรื่อง …” > บรรทัดแรกที่ไม่ใช่หัวกระดาษ
  const q = text.match(/[“"]([^”"\n]{6,140})[”"]/);
  const subj = lines.find((l) => /^เรื่อง\s+/.test(l));
  if (q) f.title = q[1].trim();
  else if (subj) f.title = subj.replace(/^เรื่อง\s+/, '').trim();
  else {
    const first = lines.find((l) => l.length >= 6 && l.length <= 140 && !/^(ประกาศ|กำหนดการ|ด่วน|ข่าว|ขอเชิญ)$/.test(l) && !/^https?:/i.test(l));
    if (first) f.title = first;
  }
  for (const [re, t] of TYPE_WORDS) if (re.test(text)) { f.eventType = t; break; }
  // วันที่: ที่อยู่หลังคำว่า “ภายใน/ปิดรับ” = วันปิดรับ ที่เหลือ = วันงาน
  const dates = findDates(text, refYear).filter((d) => d.valid);
  const isDeadline = (d) => DEADLINE_RE.test(text.slice(Math.max(0, d.index - 30), d.index));
  const dl = dates.find(isDeadline);
  if (dl) f.deadline = dl.iso;
  const ev = dates.filter((d) => !isDeadline(d));
  if (ev[0]) {
    f.date = ev[0].iso;
    const same = ev.filter((d) => d.raw === ev[0].raw && d.index === ev[0].index);
    if (same.length > 1) f.endDate = same[same.length - 1].iso;
  }
  // เวลา
  const tr = findTimeRanges(text).find((t) => !t.bad && !t.reversed);
  const hm = (m) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
  if (tr) { f.startTime = hm(tr.start); f.endTime = hm(tr.end); }
  else {
    const one = text.match(/(?:เวลา|time)\s*(\d{1,2})[.:](\d{2})/i);
    if (one && +one[1] < 24 && +one[2] < 60) f.startTime = `${pad2(one[1])}:${one[2]}`;
  }
  // ลิงก์
  const links = findLinks(text).map((l) => l.url);
  const meet = links.find((u) => /zoom\.us|meet\.google|teams\.(microsoft|live)|webex/i.test(u));
  if (meet) f.meetingLink = meet;
  const reg = links.find((u) => u !== meet && /forms\.gle|docs\.google\.com\/forms|register|regist|ลงทะเบียน|eventpop|bit\.ly|tinyurl/i.test(u)) || links.find((u) => u !== meet);
  if (reg) f.regLink = reg;
  const mid = text.match(/Meeting\s*ID\s*[:：]?\s*([\d ]{9,14}\d)(?:[\s\S]{0,40}?Pass(?:code|word)\s*[:：]?\s*(\S+))?/i);
  if (mid) f.meetingId = mid[1].trim() + (mid[2] ? ` (Passcode: ${mid[2]})` : '');
  // ติดต่อ
  const email = text.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/);
  if (email) f.email = email[0];
  const phone = text.match(/(?<!\d)0\d{1,2}[- ]?\d{3}[- ]?\d{3,4}(?!\d)/);
  if (phone) f.phone = phone[0].replace(/\s/g, '-');
  // สถานที่
  const placeLine = lines.find((l) => /^(ณ\s|สถานที่|ห้องประชุม|ห้อง\s|Venue)/i.test(l));
  if (placeLine) f.place = placeLine.replace(/^(สถานที่\s*[:：]?\s*|ณ\s+|Venue\s*[:：]\s*)/i, '').trim();
  else {
    const at = text.match(/\sณ\s+([^\n]{4,90})/);
    if (at) f.place = at[1].replace(/\s+(โดย|เวลา|ตั้งแต่).*$/, '').trim();
  }
  return f;
}
