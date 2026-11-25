// โหลด pdf.js (อ่าน/แสดง PDF) และ pdf-lib (สร้าง/แก้ PDF) แบบโหลดเมื่อจำเป็น
import { repairThaiMarks } from './thai.js';

let pdfjsP, pdfLibP;

export async function pdfjs() {
  pdfjsP ||= import('../vendor/pdfjs/pdf.min.mjs').then((m) => {
    m.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
    return m;
  });
  return pdfjsP;
}

export async function pdfLib() {
  pdfLibP ||= import('../vendor/pdf-lib.mjs');
  return pdfLibP;
}

export async function openPdf(data) {
  const lib = await pdfjs();
  const bytes = data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : data;
  return lib.getDocument({ data: bytes, isEvalSupported: false }).promise;
}

// แสดงหน้า PDF เป็นภาพ (ใช้ทำพื้นหลังเกียรติบัตร / ภาพตัวอย่าง)
export async function renderPdfPage(doc, pageNo = 1, targetWidth = 2000) {
  const page = await doc.getPage(pageNo);
  const vp1 = page.getViewport({ scale: 1 });
  const vp = page.getViewport({ scale: targetWidth / vp1.width });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(vp.width);
  canvas.height = Math.round(vp.height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  return canvas;
}

// ดึงข้อความจาก PDF โดยเว้นวรรค/ขึ้นบรรทัดตามตำแหน่งจริงบนหน้า
export async function extractText(doc, maxPages = 30) {
  const pages = [];
  for (let p = 1; p <= Math.min(doc.numPages, maxPages); p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    let lines = [];
    let line = '';
    let lastY = null, lastEnd = null;
    for (const it of tc.items) {
      if (!('str' in it)) continue;
      const x = it.transform[4], y = it.transform[5];
      const size = Math.hypot(it.transform[2], it.transform[3]) || 12;
      if (lastY !== null && Math.abs(y - lastY) > size * 0.5) { lines.push(line); line = ''; lastEnd = null; }
      if (lastEnd !== null && x - lastEnd > size * 0.25 && !line.endsWith(' ') && !it.str.startsWith(' ')) line += ' ';
      line += it.str;
      lastY = y;
      lastEnd = x + (it.width || 0);
      if (it.hasEOL) { lines.push(line); line = ''; lastY = null; lastEnd = null; }
    }
    if (line) lines.push(line);
    pages.push(lines.map((l) => l.replace(/\s+/g, ' ').trim()).join('\n'));
  }
  const thaiFix = (t) => t.replace(/\u0E4D\u0E32/g, '\u0E33').replace(/\u0E4D([\u0E48-\u0E4B])\u0E32/g, '$1\u0E33'); // ํา → ำ
  return repairThaiMarks(thaiFix(pages.join('\n\n'))).replace(/\n{3,}/g, '\n\n').trim();
}
