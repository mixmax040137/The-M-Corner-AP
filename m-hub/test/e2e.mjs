// ทดสอบการใช้งานจริงในเบราว์เซอร์ (Chromium) ทุกเครื่องมือ: node test/e2e.mjs
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync, strFromU8 } from 'fflate';
import { startServer, aiCalls } from './server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const XLSX = require('xlsx');
const { PDFDocument } = require('pdf-lib');

const OUT = fileURLToPath(new URL('./out/', import.meta.url));
const FIX = join(OUT, 'fixtures');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(FIX, { recursive: true });

let failures = 0;
const ok = (cond, msg) => { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) failures++; };
const only = process.argv[2];

const { server, url } = await startServer();
const browser = await chromium.launch({ env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' } }); // ชื่อไฟล์ไทยต้องใช้ locale UTF-8
const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/Parameter not found/.test(m.text())) errors.push(m.text()); }); // คำเตือนปกติของ Tesseract
page.on('dialog', (d) => d.accept(d.defaultValue() || 'พรีเซ็ตทดสอบ'));

async function open(hash) {
  await page.goto(url + '/?t=' + Date.now() + hash); // โหลดหน้าใหม่ทุกครั้ง (เปลี่ยนแค่ # จะไม่รีโหลด)
  await page.waitForFunction(() => window.__mhubReady);
  await page.waitForTimeout(300);
}
const view = () => page.locator('main > .tool-view:not([hidden])');
async function chooseFiles(buttonText, files) {
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), view().getByRole('button', { name: buttonText }).first().click()]);
  await fc.setFiles(files);
}
async function startAndDownload(buttonText = 'เริ่มทำงาน', scope = view()) {
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), scope.getByRole('button', { name: buttonText }).first().click()]);
  const p = join(OUT, dl.suggestedFilename());
  await dl.saveAs(p);
  return p;
}
const zipEntries = (p) => unzipSync(readFileSync(p));
// Playwright ส่งไฟล์ที่ path เป็นภาษาไทยไม่ได้ จึงส่งเป็นข้อมูลพร้อมชื่อไฟล์ไทยแทน
const asPayload = (path, name) => ({ name, mimeType: 'application/octet-stream', buffer: readFileSync(path) });

// ---------- สร้างไฟล์ทดสอบ ----------
async function makeImage(name, w, h, color, type = 'jpeg') {
  const p = await context.newPage();
  await p.setViewportSize({ width: w, height: h });
  await p.setContent(`<body style="margin:0;background:${color};font:bold 120px sans-serif;color:#fff;display:grid;place-items:center;height:100vh">${name}</body>`);
  const file = join(FIX, name);
  await p.screenshot({ path: file, type, quality: type === 'jpeg' ? 90 : undefined });
  await p.close();
  return file;
}

// ========== 1) จัดการรูปเป็นชุด ==========
async function testImages() {
  console.log('จัดการรูปเป็นชุด');
  const imgs = [];
  const colors = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#d35400'];
  for (let i = 0; i < 5; i++) imgs.push(await makeImage(`IMG_000${i + 1}.jpg`, 2400, 1600, colors[i]));
  const xlsxPath = join(FIX, 'image-names.xlsx');
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['ชื่อไฟล์เดิม', 'ชื่อใหม่', 'โฟลเดอร์'],
    ['IMG_0003', 'บรรยากาศ-01', 'วันที่ 2'], ['IMG_0001.jpg', 'พิธีเปิด-01', 'วันที่ 1'], ['img_0002', 'พิธีเปิด-02', 'วันที่ 1'],
    ['IMG_0004', 'บรรยากาศ-02', 'วันที่ 2'],
  ]), 'Sheet1');
  XLSX.writeFile(wb, xlsxPath);

  await open('#/images');
  await chooseFiles('เลือกไฟล์รูป', imgs);
  await page.waitForTimeout(800);
  ok((await view().innerText()).includes('เลือกแล้ว 5 รูป'), 'เลือกรูป 5 รูป');

  await view().locator('select').filter({ hasText: 'ด้านยาวสุดไม่เกิน' }).selectOption('long');
  await view().getByLabel('ด้านยาวสุด (px)').fill('800');
  await view().getByRole('button', { name: 'WebP', exact: true }).click();
  await view().getByRole('button', { name: 'ตามรายชื่อใน Excel' }).click();
  await chooseFiles('เปิดไฟล์ Excel / CSV', [asPayload(xlsxPath, 'รายชื่อรูป.xlsx')]);
  await page.waitForTimeout(500);
  await view().locator('select').filter({ hasText: 'เรียงตามลำดับ' }).selectOption('match');
  await view().locator('select').filter({ hasText: 'ไม่แยกโฟลเดอร์' }).selectOption('template');
  await view().getByLabel('ชื่อโฟลเดอร์').fill('{{โฟลเดอร์}}');
  await page.waitForTimeout(400);
  const tableText = await view().locator('table').last().innerText();
  ok(tableText.includes('วันที่ 1') && tableText.includes('ไม่พบชื่อไฟล์นี้ใน Excel'), 'ตารางตัวอย่างแสดงโฟลเดอร์และเตือนรูปที่ไม่มีใน Excel');

  await view().locator('select').filter({ hasText: 'ดาวน์โหลดเป็นไฟล์ ZIP' }).selectOption('zip');
  const zipPath = await startAndDownload();
  const files = zipEntries(zipPath);
  const names = Object.keys(files).sort();
  console.log('    ', names.join(', '));
  ok(names.includes('วันที่ 1/พิธีเปิด-01.webp') && names.includes('วันที่ 1/พิธีเปิด-02.webp') && names.includes('วันที่ 2/บรรยากาศ-01.webp'), 'ตั้งชื่อตาม Excel + แยกโฟลเดอร์ตามคอลัมน์');
  ok(names.includes('IMG_0005.webp'), 'รูปที่ไม่มีใน Excel ใช้ชื่อเดิม');
  const webp = files['วันที่ 1/พิธีเปิด-01.webp'];
  ok(strFromU8(webp.slice(0, 4)) === 'RIFF' && strFromU8(webp.slice(8, 12)) === 'WEBP', 'ไฟล์เป็น WebP จริง');
  const dims = await page.evaluate(async (b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const bmp = await createImageBitmap(new Blob([bytes], { type: 'image/webp' }));
    return [bmp.width, bmp.height];
  }, Buffer.from(webp).toString('base64'));
  ok(dims[0] === 800 && dims[1] === 533, `ย่อด้านยาวเหลือ 800px (ได้ ${dims.join('×')})`);

  // AVIF + ลายน้ำ + บันทึกลงโฟลเดอร์ (จำลองด้วย OPFS)
  await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    window.__mhubPickDirectory = async () => root.getDirectoryHandle('img-out', { create: true });
  });
  await view().getByRole('button', { name: 'ใช้ชื่อเดิม' }).click();
  await view().locator('select').filter({ hasText: 'ไม่แยกโฟลเดอร์' }).selectOption('none');
  await view().getByRole('button', { name: 'AVIF / HEIF' }).click();
  await view().getByLabel('ใส่โลโก้ / ลายน้ำบนทุกรูป').check();
  const logo = await makeImage('logo.png', 200, 100, '#ffffff', 'png');
  await chooseFiles('เลือกโลโก้', [logo]);
  await view().locator('select').filter({ hasText: 'บันทึกลงโฟลเดอร์ในเครื่อง' }).selectOption('folder');
  await view().getByRole('button', { name: 'เริ่มทำงาน' }).click();
  await view().locator('.note.ok, .note.warn').filter({ hasText: 'img-out' }).waitFor({ timeout: 120000 });
  const written = await page.evaluate(async () => {
    const dir = await (await navigator.storage.getDirectory()).getDirectoryHandle('img-out');
    const out = {};
    for await (const [n, hnd] of dir.entries()) {
      const f = await hnd.getFile();
      out[n] = new TextDecoder().decode((await f.slice(4, 12).arrayBuffer()));
    }
    return out;
  });
  console.log('    ', JSON.stringify(written));
  ok(Object.keys(written).length === 5 && Object.values(written).every((m) => m === 'ftypavif'), 'บันทึก AVIF 5 ไฟล์ลงโฟลเดอร์');

  // พรีเซ็ต
  await view().locator('.preset-bar select').selectOption({ label: 'จัดคลังรูปเข้าโฟลเดอร์ ปี/เดือน (ไม่แปลงไฟล์)' });
  await page.waitForTimeout(300);
  await view().locator('select').filter({ hasText: 'บันทึกลงโฟลเดอร์ในเครื่อง' }).selectOption('zip');
  const zip2 = zipEntries(await startAndDownload());
  const n2 = Object.keys(zip2);
  const y = new Date().getFullYear();
  ok(n2.length === 5 && n2.every((n) => n.startsWith(`${y}/${y}-`) && n.endsWith('.jpg')), 'พรีเซ็ตจัดคลังรูป: แยกโฟลเดอร์ ปี/เดือน และคัดลอกไฟล์เดิม');
  ok(zip2[n2[0]].length === readFileSync(imgs[0]).length || n2.some((n) => zip2[n].length === readFileSync(imgs[0]).length), 'ไฟล์ที่คัดลอกมีขนาดเท่าต้นฉบับ');
}

// ========== 2) ออกเอกสารจากเทมเพลต ==========
function parseEml(src) {
  const [head] = src.split('\r\n\r\n');
  const subj = (head.match(/^Subject: ([\s\S]*?)\r\n(?=\S)/m) || [])[1] || '';
  const decoded = subj.split(/\r\n /).map((w) => { const m = w.match(/=\?UTF-8\?B\?(.*)\?=/); return m ? Buffer.from(m[1], 'base64').toString('utf8') : w; }).join('');
  const parts = src.split(/\r\n--mhub_[^\r\n]*\r\n/);
  const textPart = parts.find((p) => p.startsWith('Content-Type: text/plain')) || src;
  const b64 = textPart.split('\r\n\r\n')[1].split('\r\n--')[0].replace(/\s+/g, '');
  return { head, subject: decoded, body: Buffer.from(b64, 'base64').toString('utf8'), attachments: [...src.matchAll(/filename\*=UTF-8''([^\r\n]+)/g)].map((m) => decodeURIComponent(m[1])) };
}

async function testDocs() {
  console.log('ออกเอกสารจากเทมเพลต');
  await open('#/docs');
  await view().getByRole('button', { name: 'ลองด้วยข้อมูลตัวอย่าง' }).click();
  await page.waitForTimeout(400);
  const pv = await view().locator('.email-card').innerText();
  ok(pv.includes('เรียน ผศ.ดร.สมชาย ใจดี') && pv.includes('ขอเรียนเชิญเข้าร่วมการสัมมนาวิชาการ'), 'ตัวอย่างอีเมลเติมชื่อและข้อมูลกลางถูกต้อง');
  ok(pv.includes('ผศ.ดร. สมชาย ใจดี <somchai@example.com>'), 'ผู้รับมีชื่อ + อีเมล');

  // เกียรติบัตร PDF แยกรายคน
  await view().getByRole('tab', { name: 'เกียรติบัตร / ป้ายชื่อ / จดหมาย PDF' }).click();
  await page.waitForTimeout(800);
  await view().locator('.canvas-wrap').screenshot({ path: join(OUT, 'certificate-preview.png') });
  const designer = view().locator('.tab-body > div:not([hidden])');
  await designer.locator('select').filter({ hasText: 'PDF แยกรายคน' }).selectOption('separate');
  await designer.locator('select').filter({ hasText: 'ดาวน์โหลดเป็นไฟล์ ZIP' }).selectOption('zip');
  const certZip = zipEntries(await startAndDownload('สร้างไฟล์', designer));
  const certNames = Object.keys(certZip);
  console.log('    ', certNames.join(', '));
  ok(certNames.length === 5 && certNames.includes('สมชาย ใจดี.pdf'), 'ได้ PDF แยกรายคน 5 ไฟล์ ตั้งชื่อตามชื่อ-นามสกุล');
  const certPdf = await PDFDocument.load(certZip['สมชาย ใจดี.pdf']);
  const sz = certPdf.getPage(0).getSize();
  ok(certPdf.getPageCount() === 1 && Math.round(sz.width) === 842 && Math.round(sz.height) === 595, `PDF ขนาด A4 แนวนอน (${Math.round(sz.width)}×${Math.round(sz.height)} pt)`);

  // PDF รวมไฟล์เดียว
  await designer.locator('select').filter({ hasText: 'PDF แยกรายคน' }).selectOption('combined');
  const combined = await PDFDocument.load(readFileSync(await startAndDownload('สร้างไฟล์', designer)));
  ok(combined.getPageCount() === 5, 'PDF รวมไฟล์เดียว 5 หน้า');

  // ป้ายชื่อหลายใบต่อ A4
  await designer.locator('.preset-bar select').selectOption({ label: 'ป้ายชื่อ 9 × 5.5 ซม. (10 ใบต่อ A4)' });
  await page.waitForTimeout(600);
  const gridInfo = await designer.locator('.hint').filter({ hasText: 'ใบต่อหน้า A4' }).innerText();
  await view().locator('.canvas-wrap').screenshot({ path: join(OUT, 'badge-preview.png') });
  const badges = await PDFDocument.load(readFileSync(await startAndDownload('สร้างไฟล์', designer)));
  const bs = badges.getPage(0).getSize();
  ok(badges.getPageCount() === 1 && Math.round(bs.width) === 595 && /10 ใบ/.test(gridInfo), `ป้ายชื่อ: ${gridInfo.trim()} → 1 หน้า A4`);

  // จดหมาย A4 (ข้อความหลายบรรทัด)
  await designer.locator('.preset-bar select').selectOption({ label: 'จดหมายเชิญรายคน A4' });
  await page.waitForTimeout(800);
  await view().locator('.canvas-wrap').screenshot({ path: join(OUT, 'letter-preview.png') });

  // อีเมลพร้อมแนบเกียรติบัตรของแต่ละคน
  await view().getByRole('tab', { name: 'อีเมลเป็นชุด' }).click();
  await view().getByText('แนบไฟล์ที่สร้างจากแท็บ').click();
  const emailPane = view().locator('.tab-body > div:not([hidden])');
  await emailPane.locator('select').filter({ hasText: 'ดาวน์โหลดเป็นไฟล์ ZIP' }).selectOption('zip');
  const emlZip = zipEntries(await startAndDownload('ดาวน์โหลดฉบับร่าง .eml ทั้งหมด', emailPane));
  const emlNames = Object.keys(emlZip).sort();
  const first = parseEml(strFromU8(emlZip[emlNames[0]]));
  console.log('    ', emlNames[0], '|', first.subject, '|', first.attachments.join(','));
  ok(emlNames.length === 5 && first.head.includes('X-Unsent: 1'), 'ได้ฉบับร่าง .eml 5 ฉบับ (เปิดใน Outlook เป็นฉบับร่าง)');
  ok(first.subject === 'ขอเรียนเชิญเข้าร่วมการสัมมนาวิชาการ “ภาษาและวัฒนธรรมในยุคดิจิทัล”', 'หัวเรื่องภาษาไทยเข้ารหัส/ถอดรหัสถูกต้อง');
  ok(first.body.includes('เรียน ผศ.ดร.สมชาย ใจดี'), 'เนื้อความภาษาไทยถูกต้อง');
  ok(first.attachments.includes('สมชาย ใจดี.pdf'), 'แนบเกียรติบัตรของคนนั้นในอีเมล');

  // Word รายคน
  await view().getByRole('tab', { name: 'เอกสาร Word รายคน' }).click();
  const wordPane = view().locator('.tab-body > div:not([hidden])');
  const [dl] = await Promise.all([page.waitForEvent('download'), wordPane.getByRole('button', { name: 'ดาวน์โหลดเทมเพลตตัวอย่าง' }).click()]);
  const tplPath = join(OUT, 'sample-template.docx');
  await dl.saveAs(tplPath);
  await chooseFiles('เปิดไฟล์ Word (.docx)', [asPayload(tplPath, 'เทมเพลตจดหมาย.docx')]);
  await page.waitForTimeout(500);
  ok((await wordPane.innerText()).includes('พบตัวแทน'), 'อ่านตัวแทนในไฟล์ Word ได้');
  await wordPane.locator('select').filter({ hasText: 'ดาวน์โหลดเป็นไฟล์ ZIP' }).selectOption('zip');
  const wordZip = zipEntries(await startAndDownload('สร้างไฟล์ Word', wordPane));
  const wn = Object.keys(wordZip);
  const xml = strFromU8(unzipSync(wordZip['สมชาย ใจดี.docx'])['word/document.xml']);
  ok(wn.length === 5 && xml.includes('ผศ.ดร.สมชาย ใจดี') && !xml.includes('{{'), 'สร้าง Word รายคน 5 ไฟล์ เติมข้อมูลครบ');
}

// ========== 3) ร่างอีเมลประกาศ ==========
async function makePdfFromHtml(name, html) {
  const p = await context.newPage();
  await p.goto(url + '/index.html');
  await p.setContent(`<link rel="stylesheet" href="${url}/vendor/fonts/fonts.css"><body style="font:16pt Sarabun;padding:2cm;line-height:1.6">${html}</body>`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const file = join(FIX, name);
  await p.pdf({ path: file, format: 'A4' });
  await p.close();
  return file;
}

async function testAnnounce() {
  console.log('ร่างอีเมลประกาศ');
  const ann = await makePdfFromHtml('announcement.pdf', `
    <p style="text-align:center">ประกาศคณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์<br>ที่ 123/2569<br>เรื่อง รับสมัครนักศึกษาเข้าร่วมโครงการแลกเปลี่ยนภาษาและวัฒนธรรม<br>ประจำปีการศึกษา 2569<br>-------------------------------</p>
    <p>ด้วยคณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์ จะดำเนินโครงการแลกเปลี่ยนภาษาและวัฒนธรรม ณ ประเทศญี่ปุ่น ระหว่างวันที่ 1 มีนาคม 2570 ถึง 15 มีนาคม 2570 จึงขอประกาศรับสมัครนักศึกษาที่สนใจเข้าร่วมโครงการ</p>
    <p>ผู้สนใจสมัครได้ตั้งแต่บัดนี้ ภายในวันที่ 20 ธันวาคม 2569 ทาง https://arts.tu.ac.th/exchange</p>
    <p>สอบถามเพิ่มเติมได้ที่ งานวิเทศสัมพันธ์ โทร. 02-613-2601 อีเมล inter@arts.tu.ac.th</p>
    <p style="text-align:center">ประกาศ ณ วันที่ 25 พฤศจิกายน พ.ศ. 2569<br><br>(ชื่อ นามสกุล)<br>คณบดีคณะศิลปศาสตร์</p>`);
  const scan = await makePdfFromHtml('scanned.pdf', `<svg width="500" height="300"><rect width="500" height="300" fill="#ddd"/></svg>`);

  await open('#/announce');
  await chooseFiles('เลือกไฟล์ PDF', [asPayload(ann, 'ประกาศรับสมัคร.pdf'), asPayload(scan, 'สแกน.pdf')]);
  await view().getByText('อ่านแล้ว 2 ไฟล์').waitFor({ timeout: 30000 });
  const cards = view().locator('section.ann-doc');
  const c1 = cards.first();
  console.log('     ข้อความที่ดึงได้:\n' + (await c1.locator('details pre').textContent()).split('\n').slice(0, 8).map((l) => '       │ ' + l).join('\n'));
  const title = await c1.getByLabel('เรื่อง (ไทย)').inputValue();
  console.log('     เรื่อง:', title);
  ok(title === 'รับสมัครนักศึกษาเข้าร่วมโครงการแลกเปลี่ยนภาษาและวัฒนธรรม ประจำปีการศึกษา 2569', 'ดึงหัวเรื่อง (2 บรรทัด) ถูกต้อง');
  ok((await c1.getByLabel('ผู้ออกประกาศ').inputValue()) === 'คณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์', 'ดึงผู้ออกประกาศถูกต้อง');
  const contact = await c1.getByLabel('ติดต่อ').inputValue();
  ok(contact.includes('inter@arts.tu.ac.th') && contact.includes('02-613-2601'), 'ดึงอีเมลและเบอร์โทร: ' + contact);
  const chips = await c1.locator('.chips').first().innerText();
  console.log('     ข้อมูล:', chips.replace(/\n/g, ' | '));
  ok(chips.includes('123/2569') && chips.includes('20 ธันวาคม 2569') && chips.includes('ประกาศ 25 พฤศจิกายน'), 'ดึงเลขที่ วันประกาศ และกำหนดสำคัญ');
  const th = await c1.locator('.tab-body textarea').first().inputValue();
  ok(th.includes('ด้วยคณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์ได้ออกประกาศ เรื่อง รับสมัคร') && th.includes('https://arts.tu.ac.th/exchange'), 'ร่างภาษาไทยครบ');
  await c1.getByRole('tab', { name: 'ร่างภาษาอังกฤษ' }).click();
  const enBox = c1.locator('.tab-body textarea:visible');
  let en = await enBox.inputValue();
  ok(en.includes('Faculty of Liberal Arts, Thammasat University has issued') && en.includes('20 December 2026') && en.includes('25 November 2026'), 'ร่างอังกฤษ: แปลชื่อหน่วยงานด้วยคลังคำ + วันที่เป็น ค.ศ.');
  await c1.getByRole('button', { name: 'แปลด้วย AI ฟรี (Cloudflare)' }).click();
  await page.waitForTimeout(800);
  en = await enBox.inputValue();
  ok((await c1.getByLabel('Title (English)').inputValue()).startsWith('[EN]') && en.includes('“[EN]'), 'ปุ่มแปลด้วย AI เติมชื่อเรื่อง/สรุปภาษาอังกฤษ');
  ok((await cards.nth(1).innerText()).includes('ภาพสแกน'), 'เตือนไฟล์ที่เป็นภาพสแกน');
  await view().locator('select').filter({ hasText: 'ดาวน์โหลดเป็นไฟล์ ZIP' }).selectOption('zip');
  const z = zipEntries(await startAndDownload('ดาวน์โหลดฉบับร่าง .eml ทั้งหมด'));
  const names = Object.keys(z);
  const e1 = parseEml(strFromU8(z[names.find((n) => n.startsWith('ประกาศรับสมัคร'))]));
  console.log('    ', names.join(', '), '|', e1.subject.slice(0, 60));
  ok(names.length === 2 && e1.attachments.includes('ประกาศรับสมัคร.pdf') && e1.body.includes('Dear Faculty'), 'ฉบับร่าง .eml 2 ภาษา แนบ PDF ประกาศ');
}

// ========== 4) PDF ==========
async function makePdf(name, pages) {
  const d = await PDFDocument.create();
  for (let i = 0; i < pages; i++) d.addPage([595, 842]).drawText(`${name} page ${i + 1}`, { x: 50, y: 780, size: 24 });
  const file = join(FIX, name);
  writeFileSync(file, await d.save());
  return file;
}

async function testPdf() {
  console.log('รวม / แยก / แปลง PDF');
  const a = await makePdf('a.pdf', 3), b = await makePdf('b.pdf', 2);
  await open('#/pdf');
  await chooseFiles('เลือกไฟล์ PDF', [a, b]);
  await page.waitForTimeout(400);
  await view().locator('.list-item').first().locator('input').fill('1-2');
  const merged = await PDFDocument.load(readFileSync(await startAndDownload('รวมเป็นไฟล์เดียว')));
  ok(merged.getPageCount() === 4, 'รวมไฟล์ (เลือกหน้า 1-2 จากไฟล์แรก + ทุกหน้าไฟล์ที่สอง) = 4 หน้า');

  await view().getByRole('tab', { name: 'แยก / ดึงหน้า / หมุน' }).click();
  const pane = view().locator('.tab-body > div:not([hidden])');
  await chooseFiles('เลือกไฟล์ PDF', [a]);
  await page.waitForTimeout(300);
  await pane.locator('select').filter({ hasText: 'ดาวน์โหลดเป็นไฟล์ ZIP' }).selectOption('zip');
  const split = zipEntries(await startAndDownload('เริ่มแยกไฟล์', pane));
  ok(Object.keys(split).length === 3, 'แยกทุกหน้า = 3 ไฟล์');
  await pane.locator('select').filter({ hasText: 'แยกทุกหน้า' }).selectOption('pick');
  await pane.getByRole('textbox', { name: 'หน้าที่ต้องการ' }).fill('2-3');
  await pane.locator('select').filter({ hasText: 'ไม่หมุน' }).selectOption('90');
  const picked = await PDFDocument.load(readFileSync(await startAndDownload('เริ่มแยกไฟล์', pane)));
  ok(picked.getPageCount() === 2 && picked.getPage(0).getRotation().angle === 90, 'ดึงหน้า 2-3 และหมุน 90°');

  await view().getByRole('tab', { name: 'รูปเป็น PDF' }).click();
  const imgPane = view().locator('.tab-body > div:not([hidden])');
  const pics = [await makeImage('p1.jpg', 1200, 800, '#2980b9'), await makeImage('p2.jpg', 1200, 800, '#27ae60'), await makeImage('p3.png', 400, 600, '#8e44ad', 'png')];
  await chooseFiles('เลือกรูป', pics);
  const imgPdf = await PDFDocument.load(readFileSync(await startAndDownload('สร้าง PDF', imgPane)));
  ok(imgPdf.getPageCount() === 3 && Math.round(imgPdf.getPage(0).getSize().width) === 842, 'รูปเป็น PDF 3 หน้า (A4 แนวนอนตามรูป)');

  await view().getByRole('tab', { name: 'PDF เป็นรูป' }).click();
  const toImg = view().locator('.tab-body > div:not([hidden])');
  await chooseFiles('เลือกไฟล์ PDF', [b]);
  await toImg.locator('select').filter({ hasText: 'ดาวน์โหลดเป็นไฟล์ ZIP' }).selectOption('zip');
  const imgs = zipEntries(await startAndDownload('แปลงเป็นรูป', toImg));
  const k = Object.keys(imgs);
  ok(k.length === 2 && imgs[k[0]][0] === 0xff && imgs[k[0]][1] === 0xd8, 'PDF เป็นรูป JPG 2 หน้า');
}

// ========== 5) ย้ายไฟล์จัดคลังรูป (ลบต้นฉบับ) + หน้าจอมือถือ ==========
async function testMoveAndLayout() {
  console.log('ย้ายไฟล์จัดคลังรูป + หน้าจอมือถือ');
  const srcFiles = [await makeImage('m1.jpg', 600, 400, '#c0392b'), await makeImage('m2.jpg', 600, 400, '#2980b9'), await makeImage('m3.jpg', 600, 400, '#27ae60')];
  await open('#/images');
  await page.evaluate(async (files) => {
    const root = await navigator.storage.getDirectory();
    for (const n of ['lib-src', 'lib-dst']) await root.removeEntry(n, { recursive: true }).catch(() => {});
    const src = await root.getDirectoryHandle('lib-src', { create: true });
    const dst = await root.getDirectoryHandle('lib-dst', { create: true });
    for (const [name, b64] of files) {
      const w = await (await src.getFileHandle(name, { create: true })).createWritable();
      await w.write(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
      await w.close();
    }
    await (await src.getFileHandle('note.txt', { create: true })).createWritable().then(async (w) => { await w.write('keep me'); await w.close(); });
    window.__mhubPickDirectory = async (id) => (id === 'mhub-images-in' ? src : dst);
  }, srcFiles.map((f) => [f.split('/').pop(), readFileSync(f).toString('base64')]));
  await view().getByRole('button', { name: 'เลือกทั้งโฟลเดอร์' }).click();
  await view().getByText('เลือกแล้ว 3 รูป').waitFor();
  await view().locator('.preset-bar select').selectOption({ label: 'จัดคลังรูปเข้าโฟลเดอร์ ปี/เดือน (ไม่แปลงไฟล์)' });
  await view().locator('select').filter({ hasText: 'บันทึกลงโฟลเดอร์ในเครื่อง' }).selectOption('folder');
  await view().getByText('ย้ายไฟล์ (ลบต้นฉบับหลังบันทึกไฟล์ใหม่สำเร็จ)').click();
  await view().getByRole('button', { name: 'เริ่มทำงาน' }).click();
  await page.getByRole('button', { name: 'ย้ายไฟล์' }).click();
  await view().locator('.note').filter({ hasText: 'ย้ายไฟล์แล้ว' }).waitFor({ timeout: 30000 });
  const state = await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const list = async (d, pre = '') => { const o = []; for await (const [n, hd] of d.entries()) o.push(...(hd.kind === 'file' ? [pre + n] : await list(hd, pre + n + '/'))); return o; };
    return { src: await list(await root.getDirectoryHandle('lib-src')), dst: await list(await root.getDirectoryHandle('lib-dst')) };
  });
  console.log('     ต้นทาง:', state.src.join(', '), '| ปลายทาง:', state.dst.join(', '));
  ok(state.src.length === 1 && state.src[0] === 'note.txt', 'ต้นฉบับรูปถูกลบหลังย้าย (ไฟล์อื่นในโฟลเดอร์ไม่ถูกแตะ)');
  ok(state.dst.length === 3 && state.dst.every((p) => /^\d{4}\/\d{4}-\d{2}\/m\d\.jpg$/.test(p)), 'รูปถูกย้ายเข้าโฟลเดอร์ ปี/ปี-เดือน');

  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  for (const hsh of ['', '#/images', '#/docs']) {
    await mobile.goto(url + '/' + hsh);
    await mobile.waitForFunction(() => window.__mhubReady);
    await mobile.waitForTimeout(500);
    const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(overflow <= 1, `จอมือถือ ${hsh || 'หน้าแรก'}: ไม่มีเลื่อนแนวนอน (${overflow}px)`);
  }
  await mobile.goto(url + '/');
  await mobile.waitForFunction(() => window.__mhubReady);
  await mobile.screenshot({ path: join(OUT, 'mobile-home.png'), fullPage: false });
  await mobile.close();
  await page.setViewportSize({ width: 1280, height: 900 });
  await open('');
  await page.screenshot({ path: join(OUT, 'desktop-home.png'), fullPage: false });
}

// ========== 6) คลังคำแปล ==========
async function testGlossary() {
  console.log('คลังคำแปล');
  await open('#/glossary');
  const v = view();
  await v.locator('textarea').first().fill('รองศาสตราจารย์ ดร. คณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์ ปีการศึกษา 2569');
  await v.getByRole('button', { name: 'แปลด้วยคลังคำ (ไม่ใช้ AI)' }).click();
  const outText = await v.locator('textarea').nth(1).inputValue();
  console.log('     →', outText);
  ok(outText === 'Associate Professor Dr. Faculty of Liberal Arts, Thammasat University Academic Year 2026', 'แปลด้วยคลังคำ: คำยาวก่อน + ปี พ.ศ. → ค.ศ.');
  await v.getByRole('button', { name: 'เพิ่มคำ' }).click();
  await v.locator('table input[aria-label="ภาษาไทย"]').first().fill('งานแสดงมุทิตาจิต');
  await v.locator('table input[aria-label="English"]').first().fill('Retirement Ceremony');
  await page.waitForTimeout(700);
  await open('#/glossary');
  await view().getByPlaceholder('ค้นหาคำ…').fill('มุทิตา');
  ok((await view().locator('table input[aria-label="English"]').first().inputValue()) === 'Retirement Ceremony', 'เพิ่มคำใหม่แล้วจำไว้หลังเปิดหน้าใหม่');
  await view().locator('textarea').first().fill('ขอเชิญร่วมงานแสดงมุทิตาจิต');
  await view().getByRole('button', { name: 'แปลด้วย AI ฟรี (Cloudflare)' }).click();
  await page.waitForTimeout(600);
  ok((await view().locator('textarea').nth(1).inputValue()) === '[EN] ขอเชิญร่วมRetirement Ceremony', 'แปลด้วย AI: แทนคำในคลังก่อนส่งแปล');
}

// ========== 7) จัดการรายชื่อ ==========
async function testContacts() {
  console.log('รวม / ทำความสะอาดรายชื่อ');
  const f1 = join(FIX, 'contacts1.xlsx'), f2 = join(FIX, 'contacts2.xlsx');
  const mk = (file, rows) => { const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Sheet1'); XLSX.writeFile(wb, file); };
  mk(f1, [['รายชื่อผู้เข้าร่วม'], ['ชื่อ-นามสกุล', 'อีเมล', 'โทรศัพท์'],
    ['  ผศ.ดร.สมชาย   ใจดี ', 'Somchai@Example.com ', '0812345678'],
    ['นางสาวสมหญิง รักเรียน', 'somying@example.com', '+66 89 765 4321'],
    ['MR. JOHN SMITH', 'john@example', '๐๒-๖๑๓-๒๖๐๑']]);
  mk(f2, [['ชื่อ-นามสกุล', 'อีเมล', 'โทรศัพท์'], ['ผศ.ดร. สมชาย ใจดี', 'somchai@example.com', ''], ['นายปิยะ มีสุข', 'piya@example.com', '0623334444'], ['', '', '']]);
  await open('#/contacts');
  await chooseFiles('เพิ่มไฟล์ Excel / CSV', [f1, f2]);
  await page.waitForTimeout(500);
  await view().getByRole('button', { name: 'จัดการรายชื่อ' }).click();
  const rep = await view().locator('.note.ok').first().innerText();
  console.log('    ', rep);
  ok(/รวม 5 แถว → เหลือ 4 แถว/.test(rep) && /ลบรายชื่อซ้ำ 1/.test(rep), 'รวม 2 ไฟล์ ลบแถวว่างและรายชื่อซ้ำ (ดูจากอีเมล)');
  ok((await view().locator('.note.warn').innerText()).includes('อีเมลไม่ถูกต้อง 1'), 'ตรวจพบอีเมลผิดรูปแบบ');
  const xl = await startAndDownload('ดาวน์โหลด Excel');
  const rows = XLSX.utils.sheet_to_json(XLSX.read(readFileSync(xl)).Sheets['รายชื่อ'], { defval: '' });
  const som = rows.find((r) => r['ชื่อ'] === 'สมชาย');
  const john = rows.find((r) => r['นามสกุล'] === 'Smith');
  console.log('    ', JSON.stringify(som), '|', JSON.stringify(john));
  ok(som && som['คำนำหน้า'] === 'ผศ.ดร.' && som['นามสกุล'] === 'ใจดี' && som['อีเมล'] === 'somchai@example.com' && som['โทรศัพท์'] === '081-234-5678', 'แยกคำนำหน้า/ชื่อ/สกุล + อีเมลตัวเล็ก + เบอร์ 081-234-5678');
  ok(john && john['คำนำหน้า'] === 'Mr.' && john['ชื่อ'] === 'John' && john['โทรศัพท์'] === '02-613-2601' && john['หมายเหตุ'] === 'อีเมลไม่ถูกต้อง', 'ชื่ออังกฤษตัวพิมพ์ถูกต้อง + เลขไทยเป็นเลขอารบิก + หมายเหตุอีเมลผิด');
  ok(rows.find((r) => r['ชื่อ'] === 'สมหญิง')['โทรศัพท์'] === '089-765-4321', 'เบอร์ +66 แปลงเป็น 0');
  await view().getByRole('button', { name: 'ส่งไปออกเอกสาร / อีเมล →' }).click();
  await page.waitForTimeout(800);
  await view().getByRole('button', { name: 'ใช้รายชื่อนี้' }).click();
  await page.waitForTimeout(500);
  ok((await view().locator('.email-card').innerText()).includes('เรียน ผศ.ดร.สมชาย ใจดี'), 'ส่งรายชื่อต่อไปเครื่องมือออกเอกสารได้');
}

// ========== 8) QR ==========
async function decodeQr(pngBuf) {
  await page.addScriptTag({ path: fileURLToPath(new URL('../node_modules/jsqr/dist/jsQR.js', import.meta.url)) });
  return page.evaluate(async (b64) => {
    const bmp = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))]));
    const c = new OffscreenCanvas(bmp.width, bmp.height); const g = c.getContext('2d'); g.drawImage(bmp, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height);
    const r = window.jsQR(d.data, d.width, d.height);
    return r && r.data;
  }, Buffer.from(pngBuf).toString('base64'));
}

async function testQr() {
  console.log('QR Code เป็นชุด');
  await open('#/qr');
  await view().getByRole('button', { name: 'ลองด้วยข้อมูลตัวอย่าง' }).click();
  await page.waitForTimeout(600);
  await view().locator('select').filter({ hasText: 'ดาวน์โหลดเป็นไฟล์ ZIP' }).selectOption('zip');
  const z = zipEntries(await startAndDownload('สร้าง QR ทั้งหมด'));
  const names = Object.keys(z);
  console.log('    ', names.join(', '));
  ok(names.length === 3 && names.includes('สมชาย ใจดี.png'), 'QR 3 ไฟล์ ตั้งชื่อตามชื่อ-นามสกุล');
  ok((await decodeQr(z['สมชาย ใจดี.png'])) === 'https://example.com/checkin?id=A001', 'สแกน QR ได้ข้อมูลถูกต้อง');
  await view().getByRole('button', { name: 'พิมพ์ทีละบรรทัด' }).click();
  await view().locator('textarea').first().fill('สวัสดีครับ คณะศิลปศาสตร์ ✓');
  await page.waitForTimeout(300);
  const z2 = zipEntries(await startAndDownload('สร้าง QR ทั้งหมด'));
  ok((await decodeQr(Object.values(z2)[0])) === 'สวัสดีครับ คณะศิลปศาสตร์ ✓', 'QR ภาษาไทย (UTF-8) สแกนได้ถูกต้อง');
  await view().locator('select').filter({ hasText: 'PNG แยกไฟล์' }).selectOption('sheet');
  const sheet = await PDFDocument.load(readFileSync(await startAndDownload('สร้าง QR ทั้งหมด')));
  ok(sheet.getPageCount() === 1 && Math.round(sheet.getPage(0).getSize().width) === 595, 'แผ่น QR A4 พร้อมพิมพ์');

  // QR ในเกียรติบัตร
  await open('#/docs');
  await view().getByRole('button', { name: 'ลองด้วยข้อมูลตัวอย่าง' }).click();
  await view().getByRole('tab', { name: 'เกียรติบัตร / ป้ายชื่อ / จดหมาย PDF' }).click();
  const designer = view().locator('.tab-body > div:not([hidden])');
  await designer.getByRole('button', { name: 'เพิ่ม QR' }).click();
  await designer.getByLabel('ข้อมูลใน QR').fill('https://example.com/verify?email={{อีเมล}}');
  await page.waitForTimeout(500);
  await view().locator('.canvas-wrap').screenshot({ path: join(OUT, 'certificate-qr.png') });
  const pdf = await PDFDocument.load(readFileSync(await startAndDownload('สร้างไฟล์', designer)));
  ok(pdf.getPageCount() === 5, 'เกียรติบัตรพร้อม QR รายคน สร้าง PDF ได้');
  await designer.locator('select').filter({ hasText: 'PNG แยกรายคน' }).selectOption('png');
  await designer.locator('select').filter({ hasText: 'ดาวน์โหลดเป็นไฟล์ ZIP' }).selectOption('zip');
  const pngs = zipEntries(await startAndDownload('สร้างไฟล์', designer));
  await page.addScriptTag({ path: fileURLToPath(new URL('../node_modules/jsqr/dist/jsQR.js', import.meta.url)) });
  const decoded = await page.evaluate(async (b64) => {
    const bmp = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))]));
    const k = bmp.width / 297, size = 30 * k; // QR 22 มม. ที่จุด (88%, 80%) + ขอบ
    const c = new OffscreenCanvas(Math.round(size), Math.round(size)); const g = c.getContext('2d');
    g.drawImage(bmp, bmp.width * 0.88 - size / 2, bmp.height * 0.80 - size / 2, size, size, 0, 0, size, size);
    const d = g.getImageData(0, 0, c.width, c.height);
    const r = window.jsQR(d.data, d.width, d.height);
    return r && r.data;
  }, Buffer.from(pngs['สมชาย ใจดี.png']).toString('base64'));
  ok(decoded === 'https://example.com/verify?email=somchai@example.com', 'QR บนเกียรติบัตรเติมข้อมูลรายคนและสแกนได้');
}

// ========== 9) ภาพปกโพสต์ ==========
async function testSocial() {
  console.log('ภาพปกโพสต์หลายขนาด');
  await open('#/social');
  const bg = await makeImage('bg.jpg', 1600, 1000, '#2c3e50');
  await chooseFiles('เลือกภาพพื้นหลัง', [bg]);
  await page.waitForTimeout(600);
  await view().locator('figure').first().locator('..').screenshot({ path: join(OUT, 'social-preview.png') });
  await view().locator('select').filter({ hasText: 'ดาวน์โหลดเป็นไฟล์ ZIP' }).selectOption('zip');
  const z = zipEntries(await startAndDownload('สร้างภาพทุกขนาด'));
  const names = Object.keys(z).sort();
  console.log('    ', names.join(', '));
  const dims = await page.evaluate(async (files) => Promise.all(files.map(async (b64) => { const b = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))])); return `${b.width}x${b.height}`; })), names.map((n) => Buffer.from(z[n]).toString('base64')));
  ok(names.length === 3 && dims.join(',') === '1200x630,1080x1080,1080x1920', 'ได้ภาพ 3 ขนาดตรงสเปก (' + dims.join(', ') + ')');
  await view().getByText('ทำหลายโพสต์จากรายการใน Excel').click();
  await view().getByRole('button', { name: 'วางจาก Excel' }).click();
  await view().getByPlaceholder(/คัดลอกตารางจาก Excel/).fill('ชื่องาน\tวันที่\nสัมมนาภาษาญี่ปุ่น\t1 ธ.ค.\nนิทรรศการภาพถ่าย\t5 ธ.ค.');
  await view().getByRole('button', { name: 'ใช้ข้อมูลที่วาง' }).click();
  await page.waitForTimeout(500);
  const z2 = zipEntries(await startAndDownload('สร้างภาพทุกขนาด'));
  const n2 = Object.keys(z2);
  ok(n2.length === 6 && n2.some((n) => n.includes('สัมมนาภาษาญี่ปุ่น')) && n2.some((n) => n.includes('นิทรรศการภาพถ่าย')), 'ทำหลายโพสต์จาก Excel: 2 โพสต์ × 3 ขนาด = 6 ไฟล์');
}

// ========== 10) OCR ==========
async function makeTextImage(name, html, width = 900) {
  const p = await context.newPage();
  await p.goto(url + '/index.html');
  await p.setContent(`<link rel="stylesheet" href="${url}/vendor/fonts/fonts.css"><body style="margin:0;background:#fff"><div id=t style="font:28px Sarabun;padding:30px;width:${width}px;line-height:1.6">${html}</div></body>`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const file = join(FIX, name);
  await p.locator('#t').screenshot({ path: file });
  await p.close();
  return file;
}

async function testOcr() {
  console.log('OCR ไทย');
  const html = 'ประกาศคณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์<br>เรื่อง รับสมัครนักศึกษาเข้าร่วมโครงการแลกเปลี่ยนภาษาและวัฒนธรรม<br>ผู้สนใจสมัครได้ภายในวันที่ 20 ธันวาคม 2569<br>สอบถามโทร. 02-613-2601 อีเมล inter@arts.tu.ac.th';
  const img = await makeTextImage('scan-text.png', html);
  await open('#/ocr');
  await chooseFiles('เลือกไฟล์', [img]);
  const ta = view().locator('.ocr-doc textarea');
  await ta.waitFor({ timeout: 120000 });
  const t = await ta.inputValue();
  console.log('     ' + t.split('\n').join(' | '));
  ok(t.includes('รับสมัครนักศึกษาเข้าร่วมโครงการแลกเปลี่ยนภาษาและวัฒนธรรม') && t.includes('20 ธันวาคม 2569') && t.includes('inter@arts.tu.ac.th'), 'อ่านภาษาไทย + อังกฤษจากภาพได้ถูกต้อง');
  await view().getByRole('button', { name: 'ร่างอีเมลประกาศจากข้อความนี้ →' }).click();
  await page.waitForTimeout(800);
  const card = view().locator('section.ann-doc').last();
  ok((await card.getByLabel('เรื่อง (ไทย)').inputValue()).startsWith('รับสมัครนักศึกษาเข้าร่วมโครงการ'), 'ส่งผล OCR ไปร่างอีเมลประกาศได้');

  // PDF สแกนในเครื่องมือร่างอีเมลประกาศ → ปุ่มอ่านด้วย OCR
  const pdfPage = await context.newPage();
  await pdfPage.setContent(`<body style="margin:0"><img src="data:image/png;base64,${readFileSync(img).toString('base64')}" style="width:100%"></body>`);
  const scanPdf = join(FIX, 'scan-announce.pdf');
  await pdfPage.pdf({ path: scanPdf, format: 'A4' });
  await pdfPage.close();
  await open('#/announce');
  await chooseFiles('เลือกไฟล์ PDF', [scanPdf]);
  const c2 = view().locator('section.ann-doc').first();
  await c2.getByRole('button', { name: 'อ่านด้วย OCR (ไทย + อังกฤษ)' }).click();
  await view().locator('section.ann-doc').first().getByRole('button', { name: 'อ่านด้วย OCR (ไทย + อังกฤษ)' }).waitFor({ state: 'detached', timeout: 120000 });
  const title = await view().locator('section.ann-doc').first().getByLabel('เรื่อง (ไทย)').inputValue();
  console.log('     เรื่อง:', title);
  ok(title.startsWith('รับสมัครนักศึกษาเข้าร่วมโครงการแลกเปลี่ยน'), 'PDF สแกน: กดอ่านด้วย OCR แล้วดึงหัวเรื่องได้');
}

// ========== 11) วิดีโอ ==========
async function testVideo() {
  console.log('ย่อ / ตัดวิดีโอ');
  await open('#/video');
  const b64 = await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const g = c.getContext('2d');
    const ac = new AudioContext(); const osc = ac.createOscillator(); const dst = ac.createMediaStreamDestination(); osc.connect(dst); osc.start();
    const stream = new MediaStream([...c.captureStream(30).getVideoTracks(), ...dst.stream.getAudioTracks()]);
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus', videoBitsPerSecond: 8e6 });
    const chunks = []; rec.ondataavailable = (e) => chunks.push(e.data);
    let f = 0; const t = setInterval(() => { g.fillStyle = `hsl(${f * 5},70%,50%)`; g.fillRect(0, 0, 1920, 1080); g.fillStyle = '#fff'; g.font = '160px sans-serif'; g.fillText('frame ' + f++, 300, 600); }, 33);
    rec.start(200); await new Promise((r) => setTimeout(r, 3300)); rec.stop(); await new Promise((r) => (rec.onstop = r)); clearInterval(t); osc.stop();
    const buf = new Uint8Array(await new Blob(chunks).arrayBuffer());
    let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return btoa(s);
  });
  const clip = join(FIX, 'clip.webm');
  writeFileSync(clip, Buffer.from(b64, 'base64'));
  await chooseFiles('เลือกวิดีโอ', [clip]);
  await view().locator('.video-item').waitFor();
  await page.waitForTimeout(600);
  await view().getByLabel('จุดเริ่ม').fill('0:00.5'); await view().getByLabel('จุดเริ่ม').press('Tab');
  await view().getByLabel('จุดจบ').fill('0:02.5'); await view().getByLabel('จุดจบ').press('Tab');
  await view().locator('select').filter({ hasText: 'ดาวน์โหลดเป็นไฟล์ ZIP' }).selectOption('files');
  const outFile = await startAndDownload('เริ่มแปลงวิดีโอ');
  const info = await page.evaluate(async (b) => {
    const m = await import('/vendor/mediabunny.mjs');
    const input = new m.Input({ source: new m.BlobSource(new Blob([Uint8Array.from(atob(b), (c) => c.charCodeAt(0))])), formats: m.ALL_FORMATS });
    const v = await input.getPrimaryVideoTrack();
    return { dur: await input.computeDuration(), w: v.displayWidth, h: v.displayHeight, codec: v.codec };
  }, readFileSync(outFile).toString('base64'));
  console.log('    ', outFile.split('/').pop(), JSON.stringify(info));
  ok(Math.abs(info.dur - 2) < 0.15, `ตัดช่วง 0.5–2.5 วินาที (ได้ ${info.dur.toFixed(2)} วินาที)`);
  ok(info.w === 1280 && info.h === 720, `ย่อจาก 1920×1080 เป็น 720p (${info.w}×${info.h})`);
  ok(/\.(mp4|webm)$/.test(outFile) && ['avc', 'vp9', 'vp8'].includes(info.codec), 'ได้ไฟล์วิดีโอ ' + info.codec);
}

// ========== 12) ปรับแต่งภาพ + เครื่องมือแบบ Canva ==========
const PORTRAIT = fileURLToPath(new URL('./fixtures/portrait.jpg', import.meta.url));
const editorView = () => page.locator('dialog.editor');
async function editorPaint(points) {
  const box = await editorView().locator('canvas').first().boundingBox();
  await page.mouse.move(box.x + box.width * points[0][0], box.y + box.height * points[0][1]);
  await page.mouse.down();
  for (const [x, y] of points.slice(1)) await page.mouse.move(box.x + box.width * x, box.y + box.height * y, { steps: 6 });
  await page.mouse.up();
}
const editorIdle = () => editorView().locator('.editor-busy').waitFor({ state: 'hidden', timeout: 240000 });
const viewPixel = (fx, fy) => page.evaluate(([fx, fy]) => { const c = document.querySelector('dialog.editor canvas'); const d = c.getContext('2d').getImageData(Math.round(c.width * fx), Math.round(c.height * fy), 1, 1).data; return [...d]; }, [fx, fy]);

async function testImageFx() {
  console.log('ปรับแต่งภาพ + เครื่องมือแบบ Canva');
  await open('#/images');
  await chooseFiles('เลือกไฟล์รูป', [PORTRAIT]);
  await page.waitForTimeout(1200);
  await view().getByRole('button', { name: 'ขาวดำ', exact: true }).click();
  await page.waitForTimeout(1200);
  const px = await page.evaluate(() => { const c = document.querySelector('main > .tool-view:not([hidden]) .preview-box canvas'); return [...c.getContext('2d').getImageData(c.width >> 1, c.height >> 2, 1, 1).data]; });
  ok(Math.abs(px[0] - px[1]) < 6 && Math.abs(px[1] - px[2]) < 6, `ฟิลเตอร์ขาวดำแสดงในตัวอย่างทันที (${px.slice(0, 3)})`);
  const sat = await view().getByRole('slider', { name: 'ความอิ่มสี' }).inputValue();
  ok(sat === '-100', 'แถบเลื่อนอัปเดตตามฟิลเตอร์ (ความอิ่มสี -100)');
  await view().getByRole('button', { name: 'PNG', exact: true }).click();
  await view().locator('select').filter({ hasText: 'ลบพื้นหลัง (โปร่งใส)' }).selectOption('transparent');
  await view().locator('select').filter({ hasText: 'ดาวน์โหลดเป็นไฟล์ ZIP' }).selectOption('zip');
  const z = zipEntries(await startAndDownload());
  const png = Object.values(z)[0];
  const alpha = await page.evaluate(async (b64) => {
    const bm = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))]));
    const c = new OffscreenCanvas(bm.width, bm.height); const g = c.getContext('2d'); g.drawImage(bm, 0, 0);
    const at = (x, y) => [...g.getImageData(x, y, 1, 1).data];
    return { corner: at(10, 10), center: at(bm.width >> 1, Math.round(bm.height * 0.45)) };
  }, Buffer.from(png).toString('base64'));
  console.log('    ', JSON.stringify(alpha));
  ok(alpha.corner[3] === 0 && alpha.center[3] === 255, 'ลบพื้นหลังเป็นชุด: มุมภาพโปร่งใส บุคคลทึบ');
  ok(Math.abs(alpha.center[0] - alpha.center[1]) < 6, 'ไฟล์ผลลัพธ์ใช้ฟิลเตอร์ขาวดำด้วย');

  // ---- หน้าต่างแก้ไข ----
  await view().getByRole('button', { name: 'รีเซ็ตการปรับแต่ง' }).click();
  await view().locator('select').filter({ hasText: 'ลบพื้นหลัง (โปร่งใส)' }).selectOption('none');
  await view().locator('table').last().getByRole('button', { name: 'แก้ไข' }).click();
  await editorView().waitFor();
  await page.waitForTimeout(500);
  await editorView().getByRole('button', { name: 'ยางลบวิเศษ' }).click();
  const before = await viewPixel(0.47, 0.73);
  await editorPaint([[0.44, 0.71], [0.5, 0.71], [0.5, 0.76], [0.44, 0.76]]);
  await editorView().getByRole('button', { name: 'ลบในเครื่อง' }).click();
  await editorIdle();
  await page.waitForTimeout(300);
  const after = await viewPixel(0.47, 0.73);
  ok(before.some((v, i) => Math.abs(v - after[i]) > 8), `ยางลบวิเศษ (ในเครื่อง) เปลี่ยนพื้นที่ที่ระบาย (${before.slice(0, 3)} → ${after.slice(0, 3)})`);
  await editorView().getByRole('button', { name: 'เครื่องมือทั้งหมด' }).click();
  await editorView().getByRole('button', { name: 'แก้ด้วยคำสั่ง' }).click();
  await editorPaint([[0.1, 0.1], [0.2, 0.15]]);
  await editorView().locator('textarea').fill('ใส่ช่อดอกไม้');
  const nCalls = aiCalls.length;
  await editorView().getByRole('button', { name: 'สร้าง', exact: true }).click();
  await editorIdle();
  const last = aiCalls[aiCalls.length - 1];
  ok(aiCalls.length === nCalls + 1 && /\[EN\] ใส่ช่อดอกไม้/.test(last.prompt) && last.width % 16 === 0, 'แก้ด้วยคำสั่ง: แปลคำสั่งไทย แล้วส่งภาพส่วนที่ระบายไปให้ AI (ขนาดหาร 16 ลงตัว)');
  await editorView().getByRole('button', { name: 'เครื่องมือทั้งหมด' }).click();
  await editorView().getByRole('button', { name: 'ขยายขอบภาพ' }).click();
  await editorView().getByRole('button', { name: '16:9' }).click();
  await editorIdle();
  const size = await editorView().locator('.editor-top .muted.small').innerText();
  ok(size === '1138 × 640', 'ขยายขอบภาพเป็น 16:9 (' + size + ')');
  await editorView().getByRole('button', { name: 'บันทึก' }).click();
  await editorView().waitFor({ state: 'detached' });
  ok(await view().locator('table').last().getByRole('button', { name: 'แก้ต่อ' }).waitFor({ timeout: 10000 }).then(() => true, () => false), 'บันทึกแล้ว รูปในตารางมีสถานะแก้ไขแล้ว');

  // ---- ขยายภาพด้วย AI ----
  const small = await makeImage('small.png', 200, 150, '#336699', 'png');
  await open('#/images');
  await chooseFiles('เลือกไฟล์รูป', [small]);
  await page.waitForTimeout(800);
  await view().locator('table').last().getByRole('button', { name: 'แก้ไข' }).click();
  await editorView().getByRole('button', { name: 'ขยายภาพ (AI)' }).click();
  await editorView().getByRole('button', { name: /ขยาย 2 เท่า/ }).click();
  await editorIdle();
  ok((await editorView().locator('.editor-top .muted.small').innerText()) === '400 × 300', 'ขยายภาพด้วย AI 2 เท่า (200×150 → 400×300)');
  await editorView().getByRole('button', { name: 'ปิด' }).click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).last().click().catch(() => {});

  // ---- ดึงข้อความเป็นเลเยอร์ ----
  const txt = await makeTextImage('poster-text.png', '<div style="font-size:44px;font-weight:700">ประกาศรับสมัครทุนการศึกษา</div><div style="font-size:30px;margin-top:16px">ภายใน 20 ธันวาคม 2569</div>', 760);
  await open('#/images');
  await chooseFiles('เลือกไฟล์รูป', [txt]);
  await page.waitForTimeout(800);
  await view().locator('table').last().getByRole('button', { name: 'แก้ไข' }).click();
  await editorView().getByRole('button', { name: 'ดึงข้อความ' }).click();
  await editorView().getByRole('heading', { name: 'เลเยอร์' }).waitFor({ timeout: 240000 });
  const names = await editorView().locator('.layer-item .name').allInnerTexts();
  console.log('    ', names.join(' | '));
  ok(names.length >= 2 && names.some((n) => n.includes('ประกาศรับสมัคร')), 'ดึงข้อความในภาพออกมาเป็นเลเยอร์ที่แก้ได้');
  await editorView().locator('textarea').first().fill('ประกาศผลทุนการศึกษา');
  await editorView().getByRole('button', { name: 'รวมเลเยอร์ลงภาพ' }).click();
  await editorView().getByRole('button', { name: 'บันทึก' }).click();
  await editorView().waitFor({ state: 'detached' });
  ok(await view().locator('table').last().getByRole('button', { name: 'แก้ต่อ' }).waitFor({ timeout: 10000 }).then(() => true, () => false), 'แก้ข้อความแล้วรวมลงภาพ บันทึกกลับเข้างานเป็นชุด');
  await view().locator('select').filter({ hasText: 'ดาวน์โหลดเป็นไฟล์ ZIP' }).selectOption('zip');
  const zt = zipEntries(await startAndDownload());
  const tpng = Object.values(zt)[0];
  const reread = await page.evaluate(async (b64) => {
    const { recognize } = await import('/core/ocr.js');
    return (await recognize(new File([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], 'x.png', { type: 'image/png' }))).text;
  }, Buffer.from(tpng).toString('base64'));
  console.log('     อ่านซ้ำ:', reread.replace(/\n/g, ' | '));
  ok(reread.includes('ประกาศผลทุนการศึกษา') && !reread.includes('รับสมัคร'), 'ไฟล์ผลลัพธ์มีข้อความใหม่แทนข้อความเดิม (ตรวจด้วย OCR)');

  // ---- หยิบบุคคลเป็นเลเยอร์ + สร้างพื้นหลังใหม่ด้วย AI ----
  await open('#/images');
  await chooseFiles('เลือกไฟล์รูป', [PORTRAIT]);
  await page.waitForTimeout(800);
  await view().locator('table').last().getByRole('button', { name: 'แก้ไข' }).click();
  await editorView().getByRole('button', { name: 'หยิบบุคคล' }).click();
  await page.locator('dialog.dialog').getByRole('button', { name: 'ในเครื่อง (เร็ว)' }).click();
  await page.locator('dialog.dialog').getByRole('button', { name: 'เริ่ม' }).click();
  await editorView().getByRole('heading', { name: 'เลเยอร์' }).waitFor({ timeout: 240000 });
  ok((await editorView().locator('.layer-item .name').allInnerTexts()).includes('บุคคล'), 'หยิบบุคคลออกมาเป็นเลเยอร์ (พื้นหลังถูกเติมแทน)');
  const bodyBefore = await viewPixel(0.5, 0.75);
  await editorPaint([[0.5, 0.6], [0.2, 0.6]]); // ลากบุคคลไปทางซ้าย
  const bodyAfter = await viewPixel(0.5, 0.75);
  ok(bodyBefore.some((v, i) => Math.abs(v - bodyAfter[i]) > 20), 'ลากย้ายบุคคลบนภาพได้');
  await editorView().getByRole('button', { name: 'รวมเลเยอร์ลงภาพ' }).click();
  await editorView().getByRole('button', { name: 'เครื่องมือทั้งหมด' }).click().catch(() => {});
  await editorView().getByRole('button', { name: 'สร้างพื้นหลังใหม่' }).click();
  await editorView().getByRole('button', { name: 'สวนสีเขียว มีแสงแดดอ่อน' }).click();
  const n2 = aiCalls.length;
  await editorView().getByRole('button', { name: 'สร้างพื้นหลัง' }).click();
  await editorIdle();
  ok(aiCalls.length === n2 + 1 && /Replace the background with: \[EN\] สวนสีเขียว/.test(aiCalls[aiCalls.length - 1].prompt), 'สร้างพื้นหลังใหม่: ส่งคำสั่งแปลแล้วให้ AI (คงบุคคลเดิม)');
  await editorView().getByRole('button', { name: 'ปิด' }).click();
  await page.locator('dialog.dialog').getByRole('button', { name: 'ปิด' }).click();
}

// ========== 13) ครอปและหมุน ==========
async function makeTwoTone(name, w, h) {
  const p = await context.newPage();
  await p.setViewportSize({ width: w, height: h });
  await p.setContent('<body style="margin:0;display:flex;height:100vh"><div style="flex:1;background:#e00000"></div><div style="flex:1;background:#0000e0"></div></body>');
  const file = join(FIX, name);
  await p.screenshot({ path: file, type: 'png' });
  await p.close();
  return file;
}
async function pngInfo(buf, points) {
  return page.evaluate(async ([b64, pts]) => {
    const bm = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))]));
    const c = new OffscreenCanvas(bm.width, bm.height); const g = c.getContext('2d'); g.drawImage(bm, 0, 0);
    return { w: bm.width, h: bm.height, px: pts.map(([x, y]) => [...g.getImageData(Math.round(x * (bm.width - 1)), Math.round(y * (bm.height - 1)), 1, 1).data]) };
  }, [Buffer.from(buf).toString('base64'), points]);
}
const isRed = (p) => p[0] > 180 && p[2] < 80, isBlue = (p) => p[2] > 180 && p[0] < 80;

async function testCrop() {
  console.log('ครอปและหมุน');
  // ---- งานเป็นชุด: หมุนทุกรูป + ครอปตามสัดส่วน ----
  const tt = await makeTwoTone('twotone.png', 300, 200);
  await open('#/images');
  await chooseFiles('เลือกไฟล์รูป', [tt]);
  await page.waitForTimeout(600);
  await view().locator('select').filter({ hasText: 'ด้านยาวสุดไม่เกิน' }).selectOption('none');
  await view().getByRole('button', { name: 'PNG', exact: true }).click();
  await view().locator('select').filter({ hasText: 'หมุนขวา 90°' }).selectOption('90');
  await view().locator('select').filter({ hasText: 'ดาวน์โหลดเป็นไฟล์ ZIP' }).selectOption('zip');
  let z = zipEntries(await startAndDownload());
  let info = await pngInfo(Object.values(z)[0], [[0.5, 0.1], [0.5, 0.9]]);
  ok(info.w === 200 && info.h === 300 && isRed(info.px[0]) && isBlue(info.px[1]), `หมุนขวา 90° ทุกรูป: 300×200 → ${info.w}×${info.h} ด้านซ้าย (แดง) ขึ้นไปอยู่ด้านบน`);
  await view().locator('select').filter({ hasText: 'หมุนขวา 90°' }).selectOption('0');
  await view().locator('select').filter({ hasText: 'ไม่เปลี่ยนขนาด' }).selectOption('ratio');
  await view().locator('select').filter({ hasText: 'A4 แนวตั้ง' }).selectOption('1:1');
  await view().locator('select').filter({ hasText: 'ด้านบน (ภาพบุคคล)' }).selectOption('left');
  z = zipEntries(await startAndDownload());
  info = await pngInfo(Object.values(z)[0], [[0.05, 0.5], [0.95, 0.5]]);
  ok(info.w === 200 && info.h === 200 && isRed(info.px[0]) && isBlue(info.px[1]), `ครอปสัดส่วน 1:1 เก็บด้านซ้าย: ${info.w}×${info.h}`);

  // ---- หน้าต่างแก้ไข: ครอป 16:9 → หมุน → ปรับเอียง → ลากมุมกรอบ ----
  await open('#/images');
  await chooseFiles('เลือกไฟล์รูป', [PORTRAIT]);
  await page.waitForTimeout(600);
  await view().locator('table').last().getByRole('button', { name: 'แก้ไข' }).click();
  await editorView().waitFor();
  const size = () => editorView().locator('.editor-top .muted.small').innerText();
  await editorView().getByRole('button', { name: 'ครอปและหมุน' }).click();
  await editorView().getByRole('button', { name: '16:9' }).click();
  await editorView().getByRole('button', { name: 'ใช้การครอป' }).click();
  ok((await size()) === '640 × 360', 'ครอป 16:9 ในหน้าต่างแก้ไข (640 × 360)');
  await editorView().getByRole('button', { name: 'หมุนขวา 90°' }).click();
  ok((await size()) === '360 × 640', 'หมุนขวา 90° (360 × 640)');
  await editorView().getByRole('slider', { name: 'ปรับเอียง' }).fill('12');
  await editorView().getByRole('button', { name: 'ใช้การครอป' }).click();
  await page.waitForTimeout(300);
  const corners = await page.evaluate(() => { const c = document.querySelector('dialog.editor canvas'); const g = c.getContext('2d'); return [[1, 1], [c.width - 2, 1], [1, c.height - 2], [c.width - 2, c.height - 2]].map(([x, y]) => g.getImageData(x, y, 1, 1).data[3]); });
  ok((await size()) === '360 × 640' && corners.every((a) => a === 255), 'ปรับเอียง 12° แล้วไม่มีมุมว่าง (ขนาดเท่าเดิม)');
  await editorView().getByRole('button', { name: 'อิสระ' }).click();
  const box = await editorView().locator('canvas').first().boundingBox();
  await page.mouse.move(box.x + box.width - 2, box.y + box.height - 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5, { steps: 8 });
  await page.mouse.up();
  const label = await editorView().locator('.muted.small').filter({ hasText: 'ส่วนที่เลือก' }).innerText();
  await editorView().getByRole('button', { name: 'บันทึก' }).click(); // บันทึกโดยยังไม่กด “ใช้การครอป” → ครอปให้อัตโนมัติ
  await editorView().waitFor({ state: 'detached' });
  ok(/ส่วนที่เลือก 18\d × 3[12]\d px/.test(label), 'ลากมุมกรอบครอปได้ (' + label + ')');
  await view().locator('select').filter({ hasText: 'ดาวน์โหลดเป็นไฟล์ ZIP' }).selectOption('zip');
  await view().locator('select').filter({ hasText: 'ด้านยาวสุดไม่เกิน' }).selectOption('none');
  z = zipEntries(await startAndDownload());
  info = await pngInfo(Object.values(z)[0], [[0.5, 0.5]]);
  ok(info.w >= 175 && info.w <= 190 && info.h >= 310 && info.h <= 330, `กดบันทึกแล้วครอปให้อัตโนมัติ ไฟล์ผลลัพธ์ ${info.w}×${info.h}`);
}

// ========== L'Arts PR Writer ==========
async function testPrWriter() {
  console.log("L'Arts PR Writer");
  await open('#/pr-writer?s=home');
  await view().getByText('มีงานตัวอย่าง 3 งาน').waitFor();
  ok(await view().getByText('ภาษา วัฒนธรรม และ AI').first().isVisible(), 'หน้าภาพรวมแสดงงานตัวอย่างที่กำลังจะถึง');
  await view().locator('.list-item[data-event]').filter({ hasText: 'ภาษา วัฒนธรรม และ AI' }).getByRole('button', { name: 'เขียนโพสต์' }).click();
  const out = view().locator('[data-out]');
  await out.waitFor();
  await page.waitForTimeout(400);
  let text = await out.inputValue();
  ok(text.includes('วันอังคารที่ 15 ธันวาคม 2569') && text.includes('คณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์') && text.includes('#ศิลปศาสตร์ธรรมศาสตร์'), 'โหมดเทมเพลตสร้างโพสต์ (วันไทย ชื่อคณะเต็ม แฮชแท็ก)');
  ok(await view().locator('.check-item[data-code="weekday-ok"]').isVisible(), 'ตัวตรวจยืนยันวันกับวันที่ตรงกัน');
  await view().locator('[data-link] >> text=เปิดได้ (HTTP 200)').waitFor({ timeout: 5000 });
  ok(true, 'ตรวจลิงก์ลงทะเบียนอัตโนมัติ: เปิดได้ (HTTP 200)');

  // แก้ข้อความเองให้วันผิด → ตัวตรวจจับได้ และกดแก้ให้ได้
  await out.fill(text.replace('วันอังคารที่ 15', 'วันจันทร์ที่ 15') + '\nปิดรับ ๑๕ ธ.ค. ๖๙ (จันทร์)\nMonday, 15 December 2026');
  await page.waitForTimeout(400);
  const wd = view().locator('.check-item[data-code="weekday"]');
  ok((await wd.count()) === 3, 'จับวันผิด 3 จุด (ไทย, เลขไทย, อังกฤษ)');
  ok((await wd.first().innerText()).includes('ตรงกับวันอังคาร'), 'บอกวันที่ถูกต้อง (วันอังคาร)');
  ok(await view().getByText('แก้ข้อความเองแล้ว').isVisible(), 'แจ้งว่าแก้ข้อความเองแล้ว');
  for (let i = 0; i < 3; i++) { await wd.first().getByRole('button').click(); await page.waitForTimeout(250); }
  text = await out.inputValue();
  ok(text.includes('วันอังคารที่ 15 ธันวาคม 2569') && text.includes('๑๕ ธ.ค. ๖๙ (อังคาร)') && text.includes('Tuesday, 15 December 2026') && (await wd.count()) === 0, 'ปุ่ม “แก้เป็นวัน…” แก้ครบทั้ง 3 จุด (คงเลขไทยไว้)');
  await view().getByRole('button', { name: 'สร้างใหม่จากข้อมูล' }).click();

  // เปลี่ยนข้อมูลในฟอร์ม → ข้อความเปลี่ยนตาม
  await view().locator('[data-f="date"]').fill('2026-12-16');
  await page.waitForTimeout(400);
  ok((await out.inputValue()).includes('วันพุธที่ 16 ธันวาคม 2569'), 'เปลี่ยนวันที่ในฟอร์มแล้วข้อความอัปเดต');
  ok((await view().locator('.pr-datehint').first().innerText()) === 'วันพุธที่ 16 ธันวาคม 2569', 'ใต้ช่องวันที่แสดงวันแบบไทย');

  const group = (name) => view().getByRole('group', { name });
  await group('ภาษา').getByRole('button', { name: 'ไทย + English' }).click();
  await group('ช่องทาง').getByRole('button', { name: 'อีเมล' }).click();
  await page.waitForTimeout(300);
  const subj = await view().locator('[data-subject]').inputValue();
  text = await out.inputValue();
  ok(subj.startsWith('ขอเชิญร่วมการสัมมนา') && subj.includes(' / Invitation:'), 'อีเมลสองภาษามีหัวเรื่องไทย / อังกฤษ');
  ok(text.startsWith('เรียน ') && text.includes('Wednesday, 16 December 2026') && text.indexOf('ขอบคุณ') < text.indexOf('Wednesday') && text.includes('งานประชาสัมพันธ์') && text.trim().endsWith('Faculty of Liberal Arts, Thammasat University') && !/\p{Extended_Pictographic}/u.test(text), 'อีเมล: ไทยก่อน อังกฤษตามหลัง มีคำลงท้ายและลายเซ็น ไม่มีอีโมจิ');
  await group('ภาษา').getByRole('button', { name: 'ไทย', exact: true }).click();
  await group('ช่องทาง').getByRole('button', { name: 'X' }).click();
  await page.waitForTimeout(300);
  const n = +(await view().locator('.pr-outcard .row .small').first().innerText()).replace(/[^\d].*$/, '').replace(/,/g, '');
  ok(n > 50 && n <= 280, `ข้อความ X ไม่เกิน 280 ตัวอักษร (${n})`);
  await group('ช่องทาง').getByRole('button', { name: 'ทุกช่องทาง' }).click();
  await page.waitForTimeout(300);
  ok((await view().locator('.pr-chcard').count()) === 8, 'โหมดทุกช่องทางแสดงครบ 8 ช่องทาง');
  await view().locator('.pr-chcard[data-ch="facebook"]').getByRole('button', { name: /เปิดแก้ไข/ }).click();
  await view().getByRole('button', { name: 'ใช้จริง' }).click();
  await page.waitForTimeout(300);

  // ลิงก์เสีย
  await view().locator('[data-f="regLink"]').fill('https://forms.gle/broken-link');
  await view().locator('[data-link] >> text=ไม่พบหน้านี้ (HTTP 404)').waitFor({ timeout: 5000 });
  ok(true, 'ลิงก์เสียแสดง “ไม่พบหน้านี้ (HTTP 404)”');

  // งานทั้งหมด: โพสต์ที่กด “ใช้จริง”
  await view().getByRole('tab', { name: 'งานทั้งหมด' }).click();
  const evCard = view().locator('.pr-event').filter({ hasText: 'ภาษา วัฒนธรรม และ AI' });
  await evCard.getByRole('button', { name: /โพสต์ \(1\)/ }).click();
  ok((await evCard.locator('.pr-post select').inputValue()) === 'approved', 'โพสต์ที่กด “ใช้จริง” อยู่ในงาน สถานะอนุมัติแล้ว');

  // เทมเพลตของฉันใช้แทนต้นแบบ
  await view().getByRole('tab', { name: 'เทมเพลต' }).click();
  await view().getByRole('button', { name: 'คัดลอกไปแก้เป็นเทมเพลตของฉัน' }).click();
  const tb = view().getByRole('textbox', { name: 'เนื้อหาเทมเพลต' });
  await tb.fill('★ ทดสอบเทมเพลต ★\n' + (await tb.inputValue()));
  await view().getByRole('button', { name: 'บันทึกเทมเพลต' }).click();
  await page.waitForTimeout(300);
  await view().getByRole('tab', { name: 'เขียนโพสต์' }).click();
  await group('ช่องทาง').getByRole('button', { name: 'Facebook' }).click();
  await page.waitForTimeout(300);
  ok((await out.inputValue()).startsWith('★ ทดสอบเทมเพลต ★'), 'เทมเพลตของฉัน (ใช้แทนต้นแบบ) ถูกใช้ในหน้าเขียนโพสต์');

  // QR จากลิงก์งาน
  await open('#/pr-writer?s=qr&u=' + encodeURIComponent('https://forms.gle/LArtsSample2569'));
  await page.waitForTimeout(500);
  const [dl] = await Promise.all([page.waitForEvent('download'), view().getByRole('button', { name: 'ดาวน์โหลด PNG' }).click()]);
  const qrPath = join(OUT, 'pr-qr.png');
  await dl.saveAs(qrPath);
  ok((await decodeQr(readFileSync(qrPath))) === 'https://forms.gle/LArtsSample2569', 'QR จากลิงก์งาน สแกนได้ถูกต้อง');

  // ตั้งค่า: API key ไม่อยู่ในไฟล์สำรอง, ส่งออก → ล้าง → นำเข้า
  await open('#/pr-writer?s=settings');
  await view().getByLabel('Anthropic API key').fill('sk-ant-test-SECRET123');
  await view().getByRole('button', { name: 'บันทึก', exact: true }).click();
  const [bk] = await Promise.all([page.waitForEvent('download'), view().getByRole('button', { name: /ส่งออกข้อมูลทั้งหมด/ }).click()]);
  const bkPath = join(OUT, 'pr-backup.json');
  await bk.saveAs(bkPath);
  const raw = readFileSync(bkPath, 'utf8');
  const backup = JSON.parse(raw);
  ok(backup.app === 'larts-pr-writer' && backup.data.events.length === 3 && backup.data.posts.length === 1 && backup.data.templates.length === 1, 'ส่งออกครบ (งาน 3 · โพสต์ 1 · เทมเพลต 1)');
  ok(!raw.includes('SECRET123'), 'API key ไม่อยู่ในไฟล์สำรอง');
  await view().getByRole('button', { name: 'ล้างข้อมูลทั้งหมดในเบราว์เซอร์นี้' }).click();
  await page.locator('dialog.dialog').getByRole('button', { name: 'ล้างทั้งหมด' }).click();
  await page.locator('dialog.dialog').getByRole('button', { name: 'ยืนยันล้างข้อมูล' }).click();
  await view().getByText('งาน 0 · โพสต์ 0').waitFor();
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), view().getByRole('button', { name: /นำเข้าจากไฟล์/ }).click()]);
  await fc.setFiles(bkPath);
  await view().getByText('งาน 3 · โพสต์ 1 · เทมเพลตของฉัน 1').waitFor();
  ok(true, 'ล้างข้อมูลแล้วนำเข้าไฟล์สำรองกลับมาครบ');
  ok(await page.evaluate(() => localStorage.getItem('larts-pr:anthropic-key')) === 'sk-ant-test-SECRET123', 'API key ยังอยู่ในเบราว์เซอร์นี้ (ไม่ถูกล้างไปกับข้อมูล)');

  // มือถือ: ไม่มีเลื่อนแนวนอน
  await page.setViewportSize({ width: 390, height: 844 });
  await open('#/pr-writer?s=compose');
  await page.waitForTimeout(500);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  ok(sw <= 391, `หน้าเขียนโพสต์บนมือถือไม่ล้นจอ (กว้าง ${sw}px)`);
  await page.setViewportSize({ width: 1280, height: 900 });
}

// ========== L'Arts PR Writer เฟส 2 ==========
async function testPrWriter2() {
  console.log("L'Arts PR Writer เฟส 2");
  await open('#/');
  await page.evaluate(() => new Promise((r) => { const q = indexedDB.deleteDatabase('larts-pr-writer'); q.onsuccess = q.onerror = q.onblocked = () => r(); }));
  await open('#/pr-writer?s=staff');
  const count = () => view().locator('.pr-screen:not([hidden]) .muted.small').filter({ hasText: / คน$/ }).innerText();
  await view().locator('tr[data-staff]').first().waitFor();
  ok((await count()) === '7 คน', 'บุคลากรตัวอย่าง 7 คน');
  await view().getByRole('button', { name: 'เพิ่มบุคลากร' }).click();
  await page.waitForFunction(() => document.querySelectorAll('tr[data-staff]').length === 8 && document.querySelector('tr[data-staff] [aria-label="ชื่อ-นามสกุล (ไทย)"]').value === '');
  const row = view().locator('tr[data-staff]').first();
  await row.getByLabel('คำนำหน้า/ตำแหน่งวิชาการ (ไทย)').fill('รองศาสตราจารย์');
  await row.getByLabel('ชื่อ-นามสกุล (ไทย)').fill('ทดสอบ ระบบ');
  await row.getByLabel('ตำแหน่ง (ไทย)').fill('ผู้อำนวยการโครงการ');
  await row.getByLabel('คำนำหน้า/ตำแหน่งวิชาการ (อังกฤษ)').fill('Assoc. Prof.');
  await row.getByLabel('ชื่อ-นามสกุล (อังกฤษ)').fill('Test System');
  await row.getByLabel('ตำแหน่ง (อังกฤษ)').fill('Project Director');
  await page.waitForTimeout(700);
  const csv = '﻿ชื่อ-นามสกุล (ไทย),ชื่อ-นามสกุล (อังกฤษ),คำนำหน้า/ตำแหน่งวิชาการ (ไทย),คำนำหน้า/ตำแหน่งวิชาการ (อังกฤษ),ตำแหน่ง (ไทย),ตำแหน่ง (อังกฤษ),หน่วยงาน / สาขา,อีเมล,โทรศัพท์\r\n'
    + 'ภาณุ สมมติวงศ์,Panu Sommutwong,ผู้ช่วยศาสตราจารย์ ดร.,Asst. Prof. Dr.,อาจารย์ประจำสาขาวิชาภาษาศาสตร์,Lecturer in Linguistics,สาขาวิชาภาษาศาสตร์,panu-sample@example.com,02-999-9999\r\n'
    + 'นงลักษณ์ นำเข้า,Nongluck Namkao,อาจารย์ ดร.,Dr.,อาจารย์ประจำสาขาวิชาภาษาอังกฤษ,Lecturer in English,สาขาวิชาภาษาอังกฤษ,nong-sample@example.com,\r\n';
  const csvPath = join(FIX, 'staff.csv');
  writeFileSync(csvPath, csv);
  await chooseFiles('นำเข้า CSV / Excel', [csvPath]);
  await view().getByText('9 คน').waitFor();
  ok(true, 'เพิ่มเอง 1 คน + นำเข้า CSV (อัปเดต 1 · เพิ่ม 1) = 9 คน');
  const panuPhone = await page.evaluate(() => {
    const tr = [...document.querySelectorAll('tr[data-staff]')].find((r) => r.querySelector('[aria-label="ชื่อ-นามสกุล (ไทย)"]').value === 'ภาณุ สมมติวงศ์');
    return tr && tr.querySelector('[aria-label="โทรศัพท์"]').value;
  });
  ok(panuPhone === '02-999-9999', 'นำเข้าแล้วอัปเดตเบอร์โทรของคนเดิม');

  // เขียนโพสต์: เลือกชื่อจากฐานข้อมูล
  await view().getByRole('tab', { name: 'เขียนโพสต์' }).click();
  const out = view().locator('[data-out]');
  await out.waitFor();
  const group = (name) => view().getByRole('group', { name });
  await group('โทน').getByRole('button', { name: 'ทางการ', exact: true }).click();
  await group('ภาษา').getByRole('button', { name: 'ไทย + English' }).click();
  await view().getByRole('button', { name: 'เพิ่มรายชื่อ' }).click();
  const gname = view().getByLabel('ชื่อ (มีคำนำหน้า/ตำแหน่งวิชาการ)').last();
  await gname.fill('ทดสอบ');
  await view().locator('.pr-ac-list li').filter({ hasText: 'รองศาสตราจารย์ ทดสอบ ระบบ' }).click();
  await page.waitForTimeout(400);
  ok((await view().getByLabel('Name (English)').last().inputValue()) === 'Assoc. Prof. Test System' && (await view().getByLabel('ตำแหน่ง / บทบาท').last().inputValue()) === 'ผู้อำนวยการโครงการ', 'เลือกวิทยากรจากรายชื่อ: เติมชื่อ ตำแหน่ง ไทย/อังกฤษ ให้');
  await view().locator('[data-f="chair"]').fill('วรรณา');
  await view().locator('.pr-ac-list li').filter({ hasText: 'วรรณา ตัวอย่าง' }).click();
  await page.waitForTimeout(400);
  ok((await view().locator('[data-f="chair"]').inputValue()) === 'ผู้ช่วยศาสตราจารย์ ดร.วรรณา ตัวอย่าง รองคณบดีฝ่ายกิจการนักศึกษา'
    && (await view().locator('[data-f="chairEn"]').inputValue()) === 'Asst. Prof. Dr. Wanna Tuayang, Associate Dean for Student Affairs', 'เลือกประธานจากรายชื่อ: ใส่ชื่อ + ตำแหน่งตามภาษา');
  let text = await out.inputValue();
  ok(text.includes('ประธานในพิธี: ผู้ช่วยศาสตราจารย์ ดร.วรรณา ตัวอย่าง') && text.includes('Assoc. Prof. Test System, Project Director'), 'ข้อความโพสต์ใช้ชื่อและตำแหน่งจากฐานข้อมูล');
  await out.fill(text.replace('ประธานในพิธี: ผู้ช่วยศาสตราจารย์ ดร.วรรณา', 'ประธานในพิธี: อาจารย์ ดร.วรรณา'));
  await page.waitForTimeout(400);
  const staffItem = view().locator('.check-item[data-code="staff-title"]');
  ok((await staffItem.count()) === 1 && (await staffItem.innerText()).includes('ผู้ช่วยศาสตราจารย์ ดร.'), 'ตัวตรวจจับตำแหน่งวิชาการไม่ตรงฐานข้อมูล');
  await staffItem.getByRole('button').click();
  ok((await out.inputValue()).includes('ประธานในพิธี: ผู้ช่วยศาสตราจารย์ ดร.วรรณา ตัวอย่าง'), 'ปุ่มแก้ใช้ตำแหน่งตามฐานข้อมูล');

  // แนวทางการเขียน: เพิ่มคำต้องห้าม
  await view().getByRole('tab', { name: 'แนวทางการเขียน' }).click();
  await view().getByRole('button', { name: 'เพิ่มคำ' }).click();
  await view().getByLabel('คำที่พบ').last().fill('ไลฟ์สด');
  await view().getByLabel('คำที่ควรใช้').last().fill('ถ่ายทอดสด');
  await page.waitForTimeout(600);
  await view().getByRole('tab', { name: 'เขียนโพสต์' }).click();
  await view().getByRole('button', { name: 'สร้างใหม่จากข้อมูล' }).click();
  await view().locator('[data-f="notes"]').fill('มีไลฟ์สดทางเพจของคณะ');
  await page.waitForTimeout(500);
  ok((await view().locator('.check-item[data-code="banned"]').filter({ hasText: 'ไลฟ์สด' }).count()) === 1, 'คำต้องห้ามที่เพิ่มในแนวทางการเขียน ถูกตรวจในหน้าเขียนโพสต์');

  // แก้ไขและแจ้งเปลี่ยนแปลง
  await view().getByRole('button', { name: 'แก้ไขและแจ้งเปลี่ยนแปลง' }).click();
  await page.waitForTimeout(400);
  await view().locator('[data-f="date"]').fill('2026-12-17');
  await view().locator('[data-f="place"]').fill('ห้องประชุมใหญ่ ชั้น 5');
  await group('ช่องทาง').getByRole('button', { name: 'อีเมล' }).click();
  await page.waitForTimeout(500);
  text = await out.inputValue();
  const subj = await view().locator('[data-subject]').inputValue();
  ok(subj.startsWith('[แจ้งเปลี่ยนแปลง]') && subj.includes('[Change notice]'), 'หัวเรื่องอีเมลขึ้นต้นด้วย [แจ้งเปลี่ยนแปลง]');
  ok(text.includes('วันที่: จากเดิม วันอังคารที่ 15 ธันวาคม 2569 เปลี่ยนเป็น วันพฤหัสบดีที่ 17 ธันวาคม 2569') && text.includes('สถานที่: จากเดิม ห้องประชุมชั้น 2'), 'แสดงค่าเดิม → ค่าใหม่ของช่องที่เปลี่ยน');
  ok(text.includes('เวลา: 13.00–16.00 น. (ไม่เปลี่ยนแปลง)') && text.includes('(unchanged)') && text.includes('ขออภัยในความไม่สะดวก'), 'ข้อมูลที่คงเดิมมี (ไม่เปลี่ยนแปลง) และมีคำขออภัย');
  ok((await view().locator('.check-item[data-code="weekday"]').count()) === 0 && (await view().getByText('เปลี่ยน: วันที่, สถานที่').count()) === 1, 'แถบแจ้งบอกช่องที่เปลี่ยน และไม่มีวันผิด');
  await view().getByRole('tab', { name: 'งานทั้งหมด' }).click();
  const evCard = view().locator('.pr-event').filter({ hasText: 'ภาษา วัฒนธรรม และ AI' });
  await evCard.getByRole('button', { name: /โพสต์ \(0\) · ประวัติ/ }).click();
  ok((await evCard.locator('[data-version="1"]').innerText()).includes('วันที่, สถานที่'), 'ประวัติเวอร์ชันแสดงเวอร์ชัน 1 และช่องที่เปลี่ยน');

  // ชุดโพสต์ 5 ชิ้น → ปฏิทิน
  await evCard.getByRole('button', { name: 'สร้างชุดโพสต์' }).click();
  const dlg = page.locator('dialog.pr-dialog');
  await dlg.waitFor();
  ok((await dlg.locator('tr[data-stage] input[type="checkbox"]:checked').count()) === 5, 'ชุดโพสต์เลือกไว้ครบ 5 ชิ้น');
  await dlg.getByRole('button', { name: 'สร้างโพสต์ที่เลือก' }).click();
  await view().locator('.pr-cal-cell [data-post]').first().waitFor();
  ok((await view().locator('.pr-cal-cell [data-post]').count()) === 5, 'ปฏิทินแสดงโพสต์ 5 ชิ้นในเดือนธันวาคม');
  ok((await view().locator('.pr-cal-cell[data-date="2026-12-16"] [data-post]').innerText()).includes('1 วันก่อนงาน'), 'โพสต์ 1 วันก่อนงานอยู่วันที่ 16 ธ.ค.');
  await view().locator('.pr-cal-cell[data-date="2026-12-16"] [data-post]').click();
  const ed = page.locator('dialog.pr-dialog');
  ok((await ed.getByLabel('ข้อความโพสต์').inputValue()).includes('พรุ่งนี้'), 'โพสต์ 1 วันก่อนงานมีบรรทัดนำ “พรุ่งนี้”');
  await ed.locator('select').selectOption('approved');
  await ed.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await page.waitForTimeout(400);
  ok(await view().locator('.pr-cal-cell[data-date="2026-12-16"] .pr-chip.approved').isVisible(), 'เปลี่ยนสถานะเป็นอนุมัติแล้วในปฏิทิน');

  // ข้อความโปสเตอร์ → ภาพปก
  await view().getByRole('tab', { name: 'ข้อความโปสเตอร์' }).click();
  const head = view().locator('[data-poster="th-headline"]');
  await head.waitFor();
  ok((await head.inputValue()) === 'ภาษา วัฒนธรรม และ AI', 'พาดหัวโปสเตอร์ใช้ส่วนที่ไม่เกิน 8 คำ');
  await view().locator('button.chip').filter({ hasText: 'AI: มนุษยศาสตร์' }).click();
  const cnt = await view().locator('[data-lang="th"] .field').first().locator('span.small').innerText();
  const n = +cnt.match(/(\d+) คำ/)[1];
  ok(n > 8 && cnt.includes('ควรไม่เกิน 8 คำ'), `พาดหัวยาว ${n} คำ แสดงคำเตือน`);
  ok((await view().locator('[data-preview] canvas').count()) === 1, 'ตัวอย่างโปสเตอร์มี QR ของลิงก์ลงทะเบียน');
  await view().getByRole('button', { name: 'ส่งไปทำภาพปกโพสต์' }).click();
  await page.waitForFunction(() => location.hash === '#/social');
  await page.waitForTimeout(600);
  ok((await view().getByLabel('หัวเรื่อง').inputValue()).includes('มนุษยศาสตร์'), 'ส่งข้อความโปสเตอร์ไปเครื่องมือภาพปกโพสต์ได้');

  // มือถือ: ปฏิทินไม่ล้นจอ
  await page.setViewportSize({ width: 390, height: 844 });
  await open('#/pr-writer?s=calendar&m=2026-12');
  await page.waitForTimeout(500);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  ok(sw <= 391, `ปฏิทินบนมือถือไม่ล้นจอ (กว้าง ${sw}px)`);
  await page.setViewportSize({ width: 1280, height: 900 });
}

const sections = { images: testImages, docs: testDocs, announce: testAnnounce, pdf: testPdf, move: testMoveAndLayout, glossary: testGlossary, contacts: testContacts, qr: testQr, social: testSocial, ocr: testOcr, video: testVideo, imagefx: testImageFx, crop: testCrop, pr: testPrWriter, pr2: testPrWriter2 };
for (const [name, fn] of Object.entries(sections)) {
  if (only && only !== name) continue;
  try { await fn(); } catch (e) { failures++; console.log('  ✗ ' + name + ' ล้มเหลว: ' + e.message); await page.screenshot({ path: join(OUT, `fail-${name}.png`), fullPage: true }); }
}
if (errors.length) { console.log('ข้อผิดพลาดในหน้าเว็บ:\n  ' + errors.join('\n  ')); }
await browser.close();
server.close();
console.log(failures ? `\nไม่ผ่าน ${failures} รายการ` : '\nผ่านทั้งหมด');
process.exit(failures ? 1 : 0);
