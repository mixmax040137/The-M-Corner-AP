// ทดสอบการใช้งานจริงในเบราว์เซอร์ (Chromium) ทุกเครื่องมือ: node test/e2e.mjs
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync, strFromU8 } from 'fflate';
import { startServer } from './server.mjs';

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
const browser = await chromium.launch();
const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
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

const sections = { images: testImages, docs: testDocs, announce: testAnnounce, pdf: testPdf, move: testMoveAndLayout };
for (const [name, fn] of Object.entries(sections)) {
  if (only && only !== name) continue;
  try { await fn(); } catch (e) { failures++; console.log('  ✗ ' + name + ' ล้มเหลว: ' + e.message); await page.screenshot({ path: join(OUT, `fail-${name}.png`), fullPage: true }); }
}
if (errors.length) { console.log('ข้อผิดพลาดในหน้าเว็บ:\n  ' + errors.join('\n  ')); }
await browser.close();
server.close();
console.log(failures ? `\nไม่ผ่าน ${failures} รายการ` : '\nผ่านทั้งหมด');
process.exit(failures ? 1 : 0);
