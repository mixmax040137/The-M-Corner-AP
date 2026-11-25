// ถอดรหัส / ย่อ / เข้ารหัสรูป — ใช้ร่วมกันได้หลายเครื่องมือ
import { loadScript } from './ui.js';

export const IMAGE_RE = /\.(jpe?g|jfif|png|webp|gif|bmp|avif|heic|heif)$/i;
export const isHeic = (f) => /\.(heic|heif)$/i.test(f.name) || /image\/hei[cf]/.test(f.type);

export const FORMATS = {
  jpg: { mime: 'image/jpeg', ext: 'jpg', label: 'JPG', alpha: false },
  png: { mime: 'image/png', ext: 'png', label: 'PNG', alpha: true },
  webp: { mime: 'image/webp', ext: 'webp', label: 'WebP', alpha: true },
  avif: { mime: 'image/avif', ext: 'avif', label: 'AVIF', alpha: true },
};

// รูปแบบเดิมของไฟล์ → รูปแบบที่ใช้ตอนต้องเข้ารหัสใหม่ (เช่น ตอนย่อขนาดแต่เลือก "คงรูปแบบเดิม")
export function sameFormatOf(file) {
  const n = file.name.toLowerCase();
  if (/\.png$/.test(n)) return 'png';
  if (/\.webp$/.test(n)) return 'webp';
  if (/\.avif$/.test(n)) return 'avif';
  return 'jpg';
}

async function heicToBlob(file) {
  await loadScript(new URL('../vendor/heic2any.min.js', import.meta.url).href);
  const out = await window.heic2any({ blob: file, toType: 'image/png' });
  return Array.isArray(out) ? out[0] : out;
}

// เปิดรูปเป็น ImageBitmap (หมุนตาม EXIF อัตโนมัติ, รองรับ HEIC จาก iPhone)
export async function decodeImage(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (e) {
    if (isHeic(file)) return createImageBitmap(await heicToBlob(file));
    throw new Error('เปิดรูปนี้ไม่ได้ (ไฟล์เสียหรือเบราว์เซอร์ไม่รองรับ)');
  }
}

/**
 * คำนวณขนาดผลลัพธ์
 * mode: none | long | width | height | percent | fit | cover
 */
export function targetSize(w, h, { mode = 'none', size = 1600, width = 1600, height = 900, percent = 50, noUpscale = true }) {
  let tw = w, th = h, crop = null;
  const cap = (s) => (noUpscale ? Math.min(1, s) : s);
  if (mode === 'long') { const s = cap(size / Math.max(w, h)); tw = w * s; th = h * s; }
  else if (mode === 'width') { const s = cap(width / w); tw = w * s; th = h * s; }
  else if (mode === 'height') { const s = cap(height / h); tw = w * s; th = h * s; }
  else if (mode === 'percent') { const s = percent / 100; tw = w * s; th = h * s; }
  else if (mode === 'fit') { const s = cap(Math.min(width / w, height / h)); tw = w * s; th = h * s; }
  else if (mode === 'cover') {
    tw = width; th = height;
    const s = Math.max(width / w, height / h);
    const sw = width / s, sh = height / s;
    crop = { sx: (w - sw) / 2, sy: (h - sh) / 2, sw, sh };
  }
  return { width: Math.max(1, Math.round(tw)), height: Math.max(1, Math.round(th)), crop };
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// ย่อแบบลดทีละครึ่ง เพื่อให้ภาพคมเมื่อย่อมาก ๆ
export function drawResized(src, sw, sh, target, crop, background) {
  let cur = src, cw = crop ? crop.sw : sw, ch = crop ? crop.sh : sh, sx = crop ? crop.sx : 0, sy = crop ? crop.sy : 0;
  const temps = [];
  while (cw / 2 >= target.width * 1.05 && ch / 2 >= target.height * 1.05) {
    const nw = Math.round(cw / 2), nh = Math.round(ch / 2);
    const t = makeCanvas(nw, nh);
    const tc = t.getContext('2d');
    tc.imageSmoothingQuality = 'high';
    tc.drawImage(cur, sx, sy, cw, ch, 0, 0, nw, nh);
    temps.push(t);
    cur = t; cw = nw; ch = nh; sx = 0; sy = 0;
  }
  const out = makeCanvas(target.width, target.height);
  const ctx = out.getContext('2d');
  if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, out.width, out.height); }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(cur, sx, sy, cw, ch, 0, 0, target.width, target.height);
  for (const t of temps) { t.width = 0; t.height = 0; }
  return out;
}

// วางโลโก้/ลายน้ำ: position = tl|tc|tr|ml|mc|mr|bl|bc|br, scale = % ของด้านกว้าง
export function drawWatermark(canvas, logo, { position = 'br', scale = 15, opacity = 85, margin = 3 }) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const lw = Math.max(1, Math.round((W * scale) / 100));
  const lh = Math.round((lw * logo.height) / logo.width);
  const m = Math.round((Math.min(W, H) * margin) / 100);
  const [v, hz] = position.split('');
  const x = hz === 'l' ? m : hz === 'r' ? W - lw - m : (W - lw) / 2;
  const y = v === 't' ? m : v === 'b' ? H - lh - m : (H - lh) / 2;
  ctx.save();
  ctx.globalAlpha = opacity / 100;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(logo, x, y, lw, lh);
  ctx.restore();
}

let avifEncode;
export async function encodeCanvas(canvas, format, quality = 82) {
  const f = FORMATS[format];
  if (format === 'avif') {
    avifEncode ||= (await import('../vendor/avif/encode.js')).default;
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    const q = Math.max(15, Math.min(95, Math.round(quality - 22)));
    const buf = await avifEncode(data, { quality: q, speed: 7 });
    return new Blob([buf], { type: 'image/avif' });
  }
  const blob = await new Promise((r) => canvas.toBlob(r, f.mime, format === 'png' ? undefined : quality / 100));
  if (!blob) throw new Error('เข้ารหัสรูปไม่สำเร็จ');
  if (blob.type !== f.mime) throw new Error(`เบราว์เซอร์นี้สร้างไฟล์ ${f.label} ไม่ได้ ลองใช้ Chrome หรือ Edge`);
  return blob;
}

// ภาพย่อขนาดเล็กสำหรับแสดงในตาราง
export async function thumbnail(file, size = 88) {
  try {
    if (isHeic(file)) return '';
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image', resizeWidth: size, resizeQuality: 'low' });
    const s = Math.min(1, size / Math.max(bmp.width, bmp.height));
    const c = makeCanvas(Math.round(bmp.width * s) || 1, Math.round(bmp.height * s) || 1);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    bmp.close();
    return c.toDataURL('image/jpeg', 0.7);
  } catch { return ''; }
}

let exifr;
export async function dateTaken(file) {
  try {
    exifr ||= await import('../vendor/exifr-lite.mjs');
    const d = await exifr.parse(file, ['DateTimeOriginal', 'CreateDate']);
    const v = d && (d.DateTimeOriginal || d.CreateDate);
    if (v instanceof Date && !isNaN(v)) return v;
  } catch { /* ไม่มี EXIF */ }
  return new Date(file.lastModified || Date.now());
}
