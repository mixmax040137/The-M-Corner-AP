// วันที่ไทย ↔ อังกฤษ, เลขไทย, ตัดคำไทย
export const TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
export const TH_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const TH_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const EN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const thaiDigits = (s) => String(s ?? '').replace(/[๐-๙]/g, (d) => String('๐๑๒๓๔๕๖๗๘๙'.indexOf(d)));
export const toThaiDigits = (s) => String(s ?? '').replace(/[0-9]/g, (d) => '๐๑๒๓๔๕๖๗๘๙'[d]);

export function thaiDate(d = new Date(), { weekday = false, short = false } = {}) {
  const m = short ? TH_MONTHS_SHORT[d.getMonth()] : TH_MONTHS[d.getMonth()];
  return `${weekday ? 'วัน' + TH_DAYS[d.getDay()] + 'ที่ ' : ''}${d.getDate()} ${m} ${d.getFullYear() + 543}`;
}

export function enDate(d = new Date(), { weekday = false } = {}) {
  return `${weekday ? EN_DAYS[d.getDay()] + ', ' : ''}${d.getDate()} ${EN_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const MONTH_RE = [...TH_MONTHS, ...TH_MONTHS_SHORT.map((m) => m.replace(/\./g, '\\.\\s?'))].join('|');
// จับวันที่แบบ "25 พฤศจิกายน 2569", "๒๕ พ.ย. ๖๙", "วันที่ 3 ธันวาคม พ.ศ. 2569"
const DATE_RE = new RegExp(`([0-9๐-๙]{1,2})\\s*(${MONTH_RE})\\s*(?:พ\\.\\s?ศ\\.\\s*)?([0-9๐-๙]{2,4})?`, 'g');

function monthIndex(raw) {
  const m = raw.replace(/\s/g, '');
  let i = TH_MONTHS.indexOf(m);
  if (i < 0) i = TH_MONTHS_SHORT.indexOf(m);
  return i;
}

export function findThaiDates(text, defaultYearBE) {
  const out = [];
  for (const m of String(text).matchAll(DATE_RE)) {
    const day = +thaiDigits(m[1]);
    const mi = monthIndex(m[2]);
    let y = m[3] ? +thaiDigits(m[3]) : defaultYearBE || 0;
    if (y && y < 100) y += 2500;
    if (mi < 0 || day < 1 || day > 31) continue;
    const ce = y > 2400 ? y - 543 : y || new Date().getFullYear();
    out.push({ raw: m[0].trim(), index: m.index, day, month: mi, yearBE: ce + 543, date: new Date(ce, mi, day) });
  }
  return out;
}

// แปลงวันที่ไทยทุกตัวในข้อความเป็นอังกฤษ: "25 พฤศจิกายน 2569" → "25 November 2026"
export function thaiDatesToEnglish(text) {
  return String(text).replace(DATE_RE, (raw, d, m, y) => {
    const mi = monthIndex(m);
    if (mi < 0) return raw;
    let yy = y ? +thaiDigits(y) : 0;
    if (yy && yy < 100) yy += 2500;
    const ce = yy > 2400 ? yy - 543 : yy;
    return `${+thaiDigits(d)} ${EN_MONTHS[mi]}${ce ? ' ' + ce : ''}`;
  });
}

// ตัดคำไทยด้วย Intl.Segmenter (ใช้ตัดบรรทัดในเกียรติบัตร/จดหมาย)
let seg;
export function thaiWords(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    seg ||= new Intl.Segmenter('th', { granularity: 'word' });
    return [...seg.segment(text)].map((s) => s.segment);
  }
  return String(text).split(/(\s+)/);
}

// ตัดบรรทัดข้อความไทย/อังกฤษให้พอดีความกว้าง (ใช้กับ canvas)
export function wrapText(ctx, str, maxW) {
  const out = [];
  for (const para of String(str).replace(/\t/g, '    ').split('\n')) {
    if (!para.trim()) { out.push(''); continue; }
    let line = '';
    // ไม่ให้วงเล็บ/เครื่องหมายคำพูดเปิดค้างท้ายบรรทัด หรือเครื่องหมายปิด/ๆ/ฯ ขึ้นต้นบรรทัด
    const segs = [];
    for (const w of thaiWords(para)) {
      if (segs.length && (/^[”’)\]}.,!?:;ๆฯ%]+$/.test(w) || /[“‘([{]$/.test(segs[segs.length - 1]))) segs[segs.length - 1] += w;
      else segs.push(w);
    }
    for (const w of segs) {
      const test = line + w;
      if (line.trim() && ctx.measureText(test).width > maxW) { out.push(line.replace(/\s+$/, '')); line = w.replace(/^\s+/, ''); }
      else line = test;
    }
    if (line) out.push(line);
  }
  return out;
}

// คำนวณ token แบบประมาณ (ไทย ~1 token ต่อ 1–2 ตัวอักษร, อังกฤษ ~4 ตัวอักษร)
export function estimateTokens(text) {
  const s = String(text || '');
  const thai = (s.match(/[฀-๿]/g) || []).length;
  return Math.ceil(thai / 1.6 + (s.length - thai) / 4);
}

// ---------- ซ่อมสระ/วรรณยุกต์ที่หายไปตอนดึงข้อความจาก PDF ----------
// PDF ที่สร้างจาก Chrome / Google Docs มักเก็บวรรณยุกต์แบบเลื่อนตำแหน่งไว้โดยไม่มีรหัสอักษร
// pdf.js จึงคืนค่าเป็น U+0000 → ลองใส่สระ/วรรณยุกต์ทุกแบบแล้วให้พจนานุกรมไทยในเบราว์เซอร์ (Intl.Segmenter)
// เลือกแบบที่ได้คำจริง (ไม่ใช้ AI)
const UP = ['ั', 'ิ', 'ี', 'ึ', 'ื', '็'];
const TONE = ['่', '้', '๊', '๋', '์'];
const LOW = ['ุ', 'ู'];
const MARKS = [...TONE, ...UP, ...LOW, 'ํ', ...UP.flatMap((u) => TONE.map((t) => u + t)), ...LOW.flatMap((u) => TONE.map((t) => u + t))];
const LEX = new Set(('ที่ ได้ ให้ ไม่ ผู้ นี้ ซึ่ง เพื่อ เรื่อง ปี ต่อ ข้อ ค่า ว่า ก่อน ด้วย ถึง ตั้งแต่ แต่ ต้อง เข้า เป็น เพิ่ม เติม เพิ่มเติม เปลี่ยน แลกเปลี่ยน ' +
  'ชื่อ สื่อ ติดต่อ ระหว่าง ห้อง วันที่ หรือ ทั้ง นั้น อื่น ดี มี ที่สุด เมื่อ ใช้ ผ่าน ส่ง ท่าน อยู่ ถ้า ทุก ตั้ง ใหม่ หน้า น้อย กว่า ครั้ง ล่วงหน้า ลงชื่อ ' +
  'สิ้นสุด เลื่อน เปิด ปิด ค่าใช้จ่าย ค่าธรรมเนียม ผู้สนใจ ผู้สมัคร ศึกษา นักศึกษา อาจารย์ เจ้าหน้าที่ ร่วม เข้าร่วม ข้อมูล รายละเอียด ชั้น ประเมิน ปริญญา ' +
  'ตรี ประจำปี ปีการศึกษา ช่วง ช่อง ผู้อำนวยการ คณบดี รองคณบดี ศิลปศาสตร์ ธรรมศาสตร์ ไม่เกิน ทั้งนี้ ดังนั้น ดังกล่าว ต่อไป แล้ว ได้รับ ให้แก่ แก่ แด่ ' +
  'จึง เนื่อง เนื่องจาก ตามที่ เพื่อให้ เห็นชอบ เรียน สิ่ง ข่าว เผยแพร่ แจ้ง ทั่วกัน ญี่ปุ่น บัดนี้ ซื้อ ขึ้น พื้น ครู ที่ตั้ง ที่อยู่ ผู้เข้าร่วม ผู้ที่ ค่าลงทะเบียน').split(' '));

const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'word' }) : null;

function markScore(s, at) {
  let n = 0, bonus = 0, pos = 0;
  for (const x of segmenter.segment(s)) {
    if (x.isWordLike) n++;
    if (/^[ั-ฺ็-๎]/.test(x.segment)) n += 5; // สระลอยไม่มีพยัญชนะ = ผิดแน่นอน
    if (pos <= at && at < pos + x.segment.length && LEX.has(x.segment)) bonus = 0.9;
    pos += x.segment.length;
  }
  return n - bonus;
}

function repairLine(line) {
  const parts = line.split('\u0000');
  const choice = parts.slice(1).map(() => '่');
  const build = () => parts.map((p, k) => p + (k < choice.length ? choice[k] : '')).join('');
  for (let pass = 0; pass < 2; pass++) {
    for (let k = 0; k < choice.length; k++) {
      let at = 0;
      for (let j = 0; j <= k; j++) at += parts[j].length + (j < k ? choice[j].length : 0);
      let best = null;
      for (let ci = 0; ci < MARKS.length; ci++) {
        choice[k] = MARKS[ci];
        const full = build();
        const lo = Math.max(0, at - 30);
        const sc = markScore(full.slice(lo, at + 30), at - lo) + ci * 0.001 + (MARKS[ci].length > 1 ? 0.5 : 0);
        if (!best || sc < best.sc) best = { sc, c: MARKS[ci] };
      }
      choice[k] = best.c;
    }
  }
  return build();
}

export function repairThaiMarks(text) {
  if (!segmenter || !String(text).includes('\u0000')) return String(text).replace(/\u0000/g, '');
  return String(text).split('\n').map((l) => (l.includes('\u0000') && /[฀-๿]/.test(l) ? repairLine(l) : l.replace(/\u0000/g, ''))).join('\n');
}
