// ทดสอบเว็บจริงหลัง deploy: node test/live.mjs [URL]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = process.argv[2] || 'https://m-hub.mcorner-ap.workers.dev';
let fail = 0;
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fail++; };
const browser = await chromium.launch({ env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' } }); // ชื่อไฟล์ไทยต้องใช้ locale UTF-8
const ctx = await browser.newContext({ acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/Parameter not found|status of 429/.test(m.text())) errors.push(m.text()); }); // 429 = โควตา AI ฟรีหมด (ตรวจแยกด้านล่าง)
for (const hsh of ['', '#/images', '#/docs', '#/announce', '#/pdf', '#/social', '#/qr', '#/contacts', '#/ocr', '#/video', '#/glossary']) {
  await page.goto(`${BASE}/?t=${Date.now()}${hsh}`);
  await page.waitForFunction(() => window.__mhubReady, null, { timeout: 30000 });
  await page.waitForTimeout(500);
  ok(!(await page.locator('.note.error').count()), `เปิด ${hsh || 'หน้าแรก'} ได้`);
}
// AVIF ผ่าน /cdn/ ของ Worker จริง + แปลด้วย Workers AI จริง
const res = await page.evaluate(async () => {
  const c = document.createElement('canvas'); c.width = 320; c.height = 200;
  const g = c.getContext('2d'); g.fillStyle = '#2f4fd6'; g.fillRect(0, 0, 320, 200);
  const { encodeCanvas } = await import('/core/image.js');
  const avif = await encodeCanvas(c, 'avif', 80);
  const head = new TextDecoder().decode(await avif.slice(4, 12).arrayBuffer());
  const t = await fetch('/api/translate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ texts: ['ประกาศรับสมัครทุนการศึกษา'] }) }).then((r) => r.json());
  const enErr = t.error;
  const sw = await navigator.serviceWorker.getRegistration();
  return { head, size: avif.size, en: t.texts && t.texts[0], enErr, sw: !!sw };
});
ok(res.head === 'ftypavif', `เข้ารหัส AVIF ผ่านเว็บจริงได้ (${res.size} ไบต์)`);
const quotaOut = (x) => /โควตา AI ฟรี/.test(String(x || ''));
if (quotaOut(res.enErr)) console.log('  – ข้ามการแปล: โควตา Workers AI ฟรีของวันนี้หมด (รีเซ็ต 07:00 น.)');
else ok(!!res.en && !/[฀-๿]/.test(res.en), `แปลด้วย Workers AI: “${res.en}”`);
ok(res.sw, 'ลง service worker แล้ว (ใช้ออฟไลน์/ติดตั้งได้)');
// ไฟล์ OCR ที่ Worker ดึงจาก jsDelivr + OCR ภาษาไทยบนเว็บจริง
const cdn = await page.evaluate(async () => {
  const out = {};
  for (const p of ['/cdn/tesseract/worker.min.js', '/cdn/tesseract-core/tesseract-core-simd-lstm.wasm.js', '/cdn/tessdata/tha.traineddata.gz', '/cdn/tessdata/eng.traineddata.gz']) {
    const r = await fetch(p, { method: 'HEAD' }); out[p] = r.status;
  }
  return out;
});
ok(Object.values(cdn).every((s) => s === 200), 'ไฟล์ตัวอ่าน OCR ผ่าน Worker: ' + JSON.stringify(cdn));
const ocr = await page.evaluate(async () => {
  await document.fonts.load('32px Sarabun', 'กขค');
  const c = document.createElement('canvas'); c.width = 900; c.height = 160;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 900, 160); g.fillStyle = '#000'; g.font = '40px Sarabun';
  g.fillText('ประกาศรับสมัครทุนการศึกษา', 30, 90);
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  const { recognize } = await import('/core/ocr.js');
  return (await recognize(new File([blob], 'x.png', { type: 'image/png' }))).text;
});
ok(ocr.includes('ประกาศรับสมัครทุนการศึกษา'), `OCR ภาษาไทยบนเว็บจริง: “${ocr.trim()}”`);
// โมเดล AI ในเครื่อง (ผ่าน /cdn/ ของ Worker) + แก้ภาพด้วย Workers AI จริง
const ml = await page.evaluate(async () => {
  const out = {};
  for (const p of ['/cdn/tfjs/tf.min.js', '/cdn/m/rvm/rvm.json', '/cdn/m/rvm/rvm.bin', '/cdn/m/esrgan/x2/model.json', '/cdn/m/esrgan/x2/group1-shard1of1.bin', '/cdn/m/esrgan/x4/model.json', '/cdn/m/esrgan/x4/group1-shard1of1.bin']) {
    const r = await fetch(p, { method: 'HEAD' }); out[p.split('/').slice(-2).join('/')] = r.status;
  }
  return out;
});
ok(Object.values(ml).every((s) => s === 200), 'ไฟล์โมเดล AI ในเครื่องผ่าน Worker: ' + JSON.stringify(ml));
const matteRes = await page.evaluate(async () => {
  const c = document.createElement('canvas'); c.width = 320; c.height = 320; const g = c.getContext('2d');
  const img = await fetch('/icons/icon-512.png').then((r) => r.blob()).then((b) => createImageBitmap(b));
  g.drawImage(img, 0, 0, 320, 320);
  const { personMatte } = await import('/core/ml.js');
  const t0 = performance.now();
  const m = await personMatte(c);
  return { ms: Math.round(performance.now() - t0), n: m.alpha.length };
});
ok(matteRes.n === 320 * 320, `โมเดลแยกบุคคลโหลดและทำงานบนเว็บจริง (${matteRes.ms} ms ในเครื่องทดสอบที่ไม่มีการ์ดจอ)`);
const edit = await page.evaluate(async () => {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 512, 512); grd.addColorStop(0, '#9ec5e8'); grd.addColorStop(1, '#2f4f6f'); g.fillStyle = grd; g.fillRect(0, 0, 512, 512);
  g.fillStyle = '#d33'; g.beginPath(); g.arc(256, 256, 60, 0, Math.PI * 2); g.fill();
  const mask = new Float32Array(512 * 512); for (let y = 186; y < 326; y++) for (let x = 186; x < 326; x++) mask[y * 512 + x] = 1;
  const { editRegion } = await import('/core/genai.js');
  const t0 = performance.now();
  try {
    const out = await editRegion(c, mask, 'Remove the object highlighted in magenta, and the magenta highlight itself. Fill that area naturally so it matches the surroundings. Keep everything else unchanged.', { highlight: true });
    const d = out.getContext('2d').getImageData(256, 256, 1, 1).data;
    return { ms: Math.round(performance.now() - t0), center: [...d].slice(0, 3) };
  } catch (e) { return { err: e.message }; }
});
if (quotaOut(edit.err)) console.log('  – ข้ามการแก้ภาพด้วย AI: โควตา Workers AI ฟรีของวันนี้หมด (รีเซ็ต 07:00 น.)');
else ok(!edit.err && (edit.center[0] < 200 || edit.center[2] > 80), `ยางลบด้วย AI บนเว็บจริงลบวงกลมสีแดงได้ (${edit.err || edit.center + ', ' + edit.ms + ' ms'})`);
const manifest = await page.evaluate(() => fetch('/manifest.webmanifest').then((r) => r.json()));
ok(manifest.short_name === 'M Hub' && manifest.icons.length >= 3, 'manifest สำหรับติดตั้งเป็นแอปพร้อม');
await page.goto(BASE + '/');
await page.waitForFunction(() => window.__mhubReady);
await page.screenshot({ path: new URL('./out/live-home.png', import.meta.url).pathname });
if (errors.length) console.log('ข้อผิดพลาดในหน้าเว็บ:\n  ' + errors.join('\n  '));
ok(!errors.length, 'ไม่มีข้อผิดพลาดในคอนโซล');
await browser.close();
console.log(fail ? `ไม่ผ่าน ${fail} รายการ` : 'เว็บจริงผ่านทั้งหมด');
process.exit(fail ? 1 : 0);
