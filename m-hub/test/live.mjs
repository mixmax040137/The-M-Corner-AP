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
page.on('console', (m) => { if (m.type() === 'error' && !/Parameter not found/.test(m.text())) errors.push(m.text()); });
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
  const sw = await navigator.serviceWorker.getRegistration();
  return { head, size: avif.size, en: t.texts && t.texts[0], sw: !!sw };
});
ok(res.head === 'ftypavif', `เข้ารหัส AVIF ผ่านเว็บจริงได้ (${res.size} ไบต์)`);
ok(!!res.en && !/[฀-๿]/.test(res.en), `แปลด้วย Workers AI: “${res.en}”`);
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
