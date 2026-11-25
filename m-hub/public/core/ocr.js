// อ่านตัวหนังสือจากภาพ (OCR) ด้วย Tesseract — ประมวลผลในเครื่อง
// ตัวอ่านและข้อมูลภาษา (~5 MB) โหลดครั้งแรกผ่าน /cdn/ ของ Worker แล้วเบราว์เซอร์จำไว้ (ใช้ออฟไลน์ได้)
import { openPdf, renderPdfPage, extractText } from './pdf.js';

let workerP = null;
let workerLangs = '';
let progressFn = null;

const STATUS = {
  'loading tesseract core': 'กำลังโหลดตัวอ่าน OCR (ครั้งแรกประมาณ 5 MB)',
  'initializing tesseract': 'กำลังเตรียมตัวอ่าน',
  'loading language traineddata': 'กำลังโหลดข้อมูลภาษา',
  'initializing api': 'กำลังเตรียมตัวอ่าน',
  'recognizing text': 'กำลังอ่านข้อความ',
};

async function getWorker(langs) {
  if (workerP && workerLangs === langs) return workerP;
  if (workerP) { try { (await workerP).terminate(); } catch { /* ข้าม */ } }
  workerLangs = langs;
  workerP = (async () => {
    const Tesseract = (await import('../vendor/tesseract.esm.min.js')).default;
    const base = location.origin;
    return Tesseract.createWorker(langs.split('+'), 1, {
      workerPath: base + '/cdn/tesseract/worker.min.js',
      corePath: base + '/cdn/tesseract-core/',
      langPath: base + '/cdn/tessdata',
      logger: (m) => progressFn && progressFn(STATUS[m.status] || m.status, m.progress || 0),
    });
  })();
  workerP.catch(() => { workerP = null; });
  return workerP;
}

// เตรียมภาพ: ขยายภาพเล็ก + ทำเป็นขาวดำ ช่วยให้อ่านแม่นขึ้น
async function prepare(source) {
  const bmp = source instanceof HTMLCanvasElement ? source : await createImageBitmap(source, { imageOrientation: 'from-image' });
  const scale = bmp.width < 1600 ? Math.min(3, 1600 / bmp.width) : bmp.width > 4000 ? 4000 / bmp.width : 1;
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  const ctx = c.getContext('2d');
  ctx.filter = 'grayscale(1) contrast(1.15)';
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  return c;
}

// ลบเฉพาะช่องว่างที่ผิดแน่นอน (ช่องว่างระหว่างคำไทยคงไว้ เพราะมีความหมาย)
export function tidyThai(text) {
  return String(text)
    .replace(/([ก-๎]) +(?=[ัิ-ฺ็-๎])/g, '$1') // ช่องว่างหน้าสระบน/ล่าง/วรรณยุกต์
    .replace(/([เ-ไ]) +(?=[ก-ฮ])/g, '$1') // สระหน้า (เ แ โ ใ ไ) ต้องติดพยัญชนะ
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * อ่านข้อความจากไฟล์ภาพหรือ PDF
 * onProgress(ข้อความสถานะ, 0–1)
 * PDF ที่มีข้อความอยู่แล้วจะดึงตรง ๆ (เร็วและแม่นกว่า) เว้นแต่สั่ง forceOcr
 */
export async function recognize(file, { langs = 'tha+eng', onProgress, forceOcr = false, tidy = true, maxPages = 20 } = {}) {
  progressFn = onProgress;
  const isPdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf';
  const pages = [];
  if (isPdf) {
    const doc = await openPdf(file);
    if (!forceOcr) {
      const t = await extractText(doc, maxPages);
      if (t.replace(/\s/g, '').length > 30 * Math.min(doc.numPages, maxPages)) { doc.destroy(); return { text: t, method: 'pdf-text', pages: doc.numPages }; }
    }
    for (let p = 1; p <= Math.min(doc.numPages, maxPages); p++) pages.push(() => renderPdfPage(doc, p, 2400));
  } else pages.push(() => file);
  const w = await getWorker(langs);
  const out = [];
  for (let i = 0; i < pages.length; i++) {
    onProgress && onProgress(`กำลังอ่านหน้า ${i + 1} / ${pages.length}`, i / pages.length);
    const canvas = await prepare(await pages[i]());
    const { data } = await w.recognize(canvas);
    out.push(data.text);
    canvas.width = 0;
  }
  let text = out.join('\n\n');
  if (tidy && /^tha|\+tha|tha\+/.test(langs)) text = tidyThai(text);
  return { text, method: 'ocr', pages: pages.length };
}
