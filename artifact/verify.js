/**
 * verify.js — ทดสอบไฟล์ที่ประกอบเสร็จด้วยเบราว์เซอร์จริง
 * เน้นจุดสำคัญ: หน้าเว็บต้องสร้างเอกสารใหม่ของตัวเองได้ และเอกสารรุ่นถัดไปต้องทำงานต่อได้อีก
 */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = '/tmp/claude-0/-home-user-The-M-Corner-AP/65c75192-251f-5eb3-bc74-3f88e098978a/scratchpad';
const content = fs.readFileSync(path.join(ROOT, 'dist', 'the-m-corner-ap.html'), 'utf8');

// ห่อเหมือนที่ระบบ Artifact ห่อให้ตอนเผยแพร่
const wrap = c => `<!doctype html><html lang="th"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>:root{color-scheme:light dark}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>
</head><body>${c}</body></html>`;

// stub ของ capability: เก็บ html ที่หน้าเว็บสั่งเผยแพร่
const STUB = `<script>
window.__published = null;
window.claude = { use: function(name){
  if (name === 'artifact') return Promise.resolve({ publish: function(html){ window.__published = html; return Promise.resolve({ok:true}); } });
  if (name === 'downloads') return Promise.resolve({ save: function(){ return Promise.resolve(); } });
  return Promise.resolve(null);
}};
</script>`;

let pass = 0, fail = 0;
const check = (n, ok, extra) => { if (ok) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n + (extra ? '  → ' + extra : '')); } };

(async () => {
  const b = await chromium.launch();

  async function openDoc(html, label){
    const file = path.join(OUT, label + '.html');
    fs.writeFileSync(file, html.replace('<body>', '<body>' + STUB));
    const pg = await b.newPage({ viewport: { width: 1400, height: 1000 } });
    const errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    pg.on('console', m => { if (m.type() === 'error' && !/ERR_CONNECTION|ERR_NAME|net::/.test(m.text())) errs.push(m.text()); });
    await pg.goto('file://' + file);
    await pg.waitForTimeout(1300);
    return { pg, errs };
  }

  /* ---------- รุ่นที่ 1 ---------- */
  console.log('\n── รุ่นที่ 1 (ไฟล์ที่เพิ่งประกอบ) ──');
  const g1 = await openDoc(wrap(content), 'gen1');
  check('ไม่มี JS error', g1.errs.length === 0, g1.errs.join(' | '));
  check('เมนูขึ้นครบ 10 หน้า', await g1.pg.$$eval('.nav-item', e => e.length) === 10);
  check('สถานะ = พร้อมบันทึก (ไม่ใช่อ่านอย่างเดียว)',
    !(await g1.pg.$eval('#saveState', e => e.textContent)).includes('ดูอย่างเดียว'));

  const pages = ['dashboard','debtMain','debtSub','purchases','finance','ac','repairs','building','rooms','reports'];
  for (const p of pages) {
    await g1.pg.evaluate(x => go(x), p);
    await g1.pg.waitForTimeout(450);
    const txt = await g1.pg.$eval('#view', e => e.innerText);
    check('หน้า ' + p.padEnd(10) + ' แสดงผลได้', txt.length > 80 && !/undefined|NaN|โหลดข้อมูลไม่สำเร็จ/.test(txt),
          txt.slice(0, 90).replace(/\n/g, ' '));
  }
  await g1.pg.screenshot({ path: OUT + '/art-dashboard.png' });
  await g1.pg.evaluate(() => go('finance')); await g1.pg.waitForTimeout(500);
  await g1.pg.screenshot({ path: OUT + '/art-finance.png' });
  await g1.pg.evaluate(() => go('reports')); await g1.pg.waitForTimeout(500);
  await g1.pg.screenshot({ path: OUT + '/art-reports.png' });

  /* ---------- แก้ข้อมูลแล้วต้องเผยแพร่ทับตัวเอง ---------- */
  console.log('\n── บันทึกข้อมูล ──');
  const before = await g1.pg.evaluate(() => DB.Finance.length);
  await g1.pg.evaluate(() => callApi('finance.save', {
    record: { date: '2026-11-05', kind: 'ค่าไฟฟ้า', amount: 15999, note: 'ทดสอบการบันทึก' } }));
  await g1.pg.waitForTimeout(1400);
  check('เพิ่มข้อมูลในหน่วยความจำแล้ว', await g1.pg.evaluate(() => DB.Finance.length) === before + 1);
  const published = await g1.pg.evaluate(() => window.__published);
  check('เรียกเผยแพร่เอกสารใหม่', !!published);
  check('เอกสารใหม่ขึ้นต้นด้วย doctype', !!published && /^<!doctype html>/i.test(published.trim()));
  check('เอกสารใหม่มีข้อมูลที่เพิ่ง์บันทึก', !!published && published.includes('ทดสอบการบันทึก'));
  check('สถานะขึ้นว่าบันทึกแล้ว', /บันทึกแล้ว|กำลังบันทึก/.test(await g1.pg.$eval('#saveState', e => e.textContent)));

  /* ---------- รุ่นที่ 2: เปิดเอกสารที่หน้าเว็บสร้างเอง ---------- */
  console.log('\n── รุ่นที่ 2 (เอกสารที่หน้าเว็บสร้างเอง) ──');
  const g2 = await openDoc(published, 'gen2');
  check('ไม่มี JS error', g2.errs.length === 0, g2.errs.join(' | '));
  check('ข้อมูลที่บันทึกยังอยู่', await g2.pg.evaluate(() => DB.Finance.some(r => r.note === 'ทดสอบการบันทึก')));
  check('จำนวนรายการซื้อยังครบ 94', await g2.pg.evaluate(() => DB.Purchases.length) === 94);
  check('ยอดหนี้ยังถูกต้อง',
    Math.round(await g2.pg.evaluate(() => api('debt.summary', { ledger: 'หนี้หลัก', year: 'all' }).data.paid)) === 5049654);

  await g2.pg.evaluate(() => callApi('finance.save', {
    record: { date: '2026-11-06', kind: 'ค่าน้ำประปา', amount: 1234, note: 'รุ่นที่สาม' } }));
  await g2.pg.waitForTimeout(1400);
  const pub2 = await g2.pg.evaluate(() => window.__published);
  check('รุ่นที่ 2 ยังเผยแพร่ต่อได้', !!pub2);

  /* ---------- รุ่นที่ 3 ---------- */
  console.log('\n── รุ่นที่ 3 (พิสูจน์ว่าไม่เพี้ยนสะสม) ──');
  const g3 = await openDoc(pub2, 'gen3');
  check('ไม่มี JS error', g3.errs.length === 0, g3.errs.join(' | '));
  check('ข้อมูลครบทั้งสองรุ่น',
    await g3.pg.evaluate(() => DB.Finance.filter(r => /ทดสอบการบันทึก|รุ่นที่สาม/.test(r.note)).length) === 2);
  const sizes = [content.length, published.length, pub2.length].map(n => (n/1048576).toFixed(2) + ' MB');
  console.log('  ขนาดแต่ละรุ่น: ' + sizes.join(' → '));
  check('ขนาดไม่บวมสะสม', Math.abs(pub2.length - published.length) < 4000,
        'ต่างกัน ' + (pub2.length - published.length) + ' ตัวอักษร');

  console.log('\n════════════════════════════');
  console.log(`ผ่าน ${pass} · ไม่ผ่าน ${fail}`);
  await b.close();
  process.exit(fail ? 1 : 0);
})();
