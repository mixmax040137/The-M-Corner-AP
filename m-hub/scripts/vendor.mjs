// คัดลอก/รวมไลบรารีจาก node_modules ไปไว้ที่ public/vendor ให้หน้าเว็บโหลดได้เอง
// (ไม่พึ่ง CDN ภายนอก → ใช้งานออฟไลน์ได้หลังเปิดครั้งแรก)
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const nm = (p) => join(root, 'node_modules', p);
const out = join(root, 'public', 'vendor');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const copy = (from, to) => { mkdirSync(dirname(join(out, to)), { recursive: true }); cpSync(nm(from), join(out, to)); };

copy('xlsx/dist/xlsx.full.min.js', 'xlsx.full.min.js');
copy('fflate/esm/browser.js', 'fflate.mjs');
copy('pdf-lib/dist/pdf-lib.esm.min.js', 'pdf-lib.mjs');
copy('pdfjs-dist/build/pdf.min.mjs', 'pdfjs/pdf.min.mjs');
copy('pdfjs-dist/build/pdf.worker.min.mjs', 'pdfjs/pdf.worker.min.mjs');
copy('heic2any/dist/heic2any.min.js', 'heic2any.min.js');
copy('exifr/dist/lite.esm.mjs', 'exifr-lite.mjs');
copy('qrcode-generator/dist/qrcode.mjs', 'qrcode.mjs');
copy('tesseract.js/dist/tesseract.esm.min.js', 'tesseract.esm.min.js');

// AVIF encoder (wasm แบบ single-thread — ไม่ต้องตั้ง COOP/COEP)
// ตัว wasm ใหญ่ 3.5 MB จึงไม่ฝังใน Worker: Worker ไปดึงจาก jsDelivr ให้ที่ /cdn/avif/ (โหลดเฉพาะตอนเลือก AVIF)
for (const f of ['meta.js', 'utils.js']) copy('@jsquash/avif/' + f, 'avif/' + f);
let enc = readFileSync(nm('@jsquash/avif/encode.js'), 'utf8');
enc = enc.replace("import { threads } from 'wasm-feature-detect';", 'const threads = async () => false;')
  .replace("import('./codec/enc/avif_enc.js')", "import('/cdn/avif/avif_enc.js')");
if (enc.includes('wasm-feature-detect') || !enc.includes('/cdn/avif/avif_enc.js')) throw new Error('patch avif encode.js failed');
writeFileSync(join(out, 'avif/encode.js'), enc);

// docxtemplater + pizzip รวมเป็นโมดูลเดียว
await build({
  stdin: { contents: "export { default as Docxtemplater } from 'docxtemplater'; export { default as PizZip } from 'pizzip';", resolveDir: root },
  bundle: true, format: 'esm', platform: 'browser', minify: true, outfile: join(out, 'docx.mjs'), logLevel: 'warning',
});

// mediabunny (ย่อ/ตัดวิดีโอด้วย WebCodecs) — รวมเฉพาะส่วนที่ใช้
await build({
  stdin: { contents: "export { Input, ALL_FORMATS, BlobSource, Output, BufferTarget, Mp4OutputFormat, WebMOutputFormat, Conversion, canEncodeVideo, canEncodeAudio } from 'mediabunny';", resolveDir: root },
  bundle: true, format: 'esm', platform: 'browser', minify: true, outfile: join(out, 'mediabunny.mjs'), logLevel: 'warning',
});

// Anthropic SDK (เรียก Claude จากเบราว์เซอร์ด้วย API key ของผู้ใช้) — โหลดเฉพาะตอนกดใช้ AI
await build({
  stdin: { contents: "export { default as Anthropic } from '@anthropic-ai/sdk';", resolveDir: root },
  bundle: true, format: 'esm', platform: 'browser', minify: true, outfile: join(out, 'anthropic.mjs'), logLevel: 'warning',
});

// ฟอนต์ไทย (Sarabun, Kanit, Prompt, Mitr, Charm) เฉพาะ woff2 ชุด thai + latin
const fonts = { sarabun: [400, 700], kanit: [400, 600], prompt: [400, 600], mitr: [400, 500], charm: [400, 700] };
let css = '';
for (const [name, weights] of Object.entries(fonts)) {
  for (const w of weights) {
    const src = readFileSync(nm(`@fontsource/${name}/${w}.css`), 'utf8');
    for (const block of src.split('/*').slice(1)) {
      const m = block.match(/^\s*([a-z-]+)-(\d+)-normal \*\//);
      if (!m || !/-(thai|latin)$/.test(m[1])) continue;
      const file = `${m[1]}-${w}-normal.woff2`;
      copy(`@fontsource/${name}/files/${file}`, `fonts/${file}`);
      css += '/*' + block.replace(/src:[^;]+;/, `src: url(./${file}) format('woff2');`);
    }
  }
}
writeFileSync(join(out, 'fonts/fonts.css'), css);
if (!existsSync(join(out, 'fonts/sarabun-thai-400-normal.woff2'))) throw new Error('font copy failed');
console.log('vendor: ok');
