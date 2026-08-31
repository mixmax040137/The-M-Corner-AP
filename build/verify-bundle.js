/**
 * verify-bundle.js — ตรวจว่าไฟล์ 2 ไฟล์ที่จะเอาไปวางใน Apps Script ใช้งานได้จริง
 *   1) โหลด build/Code.gs เข้า runtime จำลอง แล้วเช็คตรรกะสำคัญ
 *   2) เปิด build/Index.html ด้วย Chromium จริง โดยต่อ google.script.run เข้ากับ Code.gs ตัวเดียวกัน
 */
require('../test/mock-gas.js');
const fs = require('fs'), path = require('path'), vm = require('vm');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const OUT = '/tmp/claude-0/-home-user-The-M-Corner-AP/65c75192-251f-5eb3-bc74-3f88e098978a/scratchpad';

let pass = 0, fail = 0;
const check = (n, ok, extra) => {
  if (typeof ok !== 'boolean') throw new Error('check() รับได้เฉพาะ boolean — ข้อ: ' + n);
  if (ok) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n + (extra ? '  → ' + extra : '')); }
};

/* ---------- 1) ฝั่งเซิร์ฟเวอร์ ---------- */
console.log('\n── build/Code.gs ──');
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'build', 'Code.gs'), 'utf8'), { filename: 'Code.gs' });
setupSystem();
seedHistoricalData();

check('สร้างครบ 11 ชีต', Object.keys(SHEETS).length === 11);
check('รายการซื้อ 94 รายการ', readRows_(SHEETS.PURCHASES).length === 94);
check('ยอดชำระหนี้ 5,049,654', Math.round(debtSummary_('หนี้หลัก', 'all').paid) === 5049654);
check('รายรับ-รายจ่าย 32 รายการ', readRows_(SHEETS.FINANCE).length === 32);
check('มีคำสั่ง API ครบ 53 คำสั่ง', Object.keys(API_ROUTES).length === 53);
const adminKey = getSetting_('admin_token', ''), viewKey = getSetting_('view_token', '');
check('มีกุญแจผู้ดูแลและกุญแจแชร์', !!(adminKey && viewKey && adminKey !== viewKey), true);
check('doGet ไม่มีกุญแจ → หน้าปฏิเสธ',
  /ไม่มีสิทธิ์เข้าใช้งาน/.test(String(denyPage_().getContent ? denyPage_().getContent() : '')), true);

/* ---------- 2) ฝั่งหน้าเว็บ ---------- */
(async () => {
  console.log('\n── build/Index.html ──');

  // เตรียมคำตอบของทุกคำสั่งไว้ล่วงหน้า (เพราะเบราว์เซอร์คุยกับ Node ตรง ๆ ไม่ได้)
  const fx = {};
  const put = (a, p) => { fx[a + '|' + JSON.stringify(p || {})] = api(a, Object.assign({ _key: adminKey }, p)); };
  const years = ['all', '2026', '2025'];
  put('app.bootstrap', {}); put('app.version', {});
  years.forEach(year => {
    put('app.dashboard', { year });
    ['หนี้หลัก', 'หนี้รอง'].forEach(l => { put('debt.summary', { ledger: l, year }); put('debt.payments', { ledger: l, year }); });
    put('purchase.summary', { year }); put('purchase.list', { year, category: '', q: '' });
    put('finance.summary', { year }); put('finance.list', { year, kind: '' });
    put('ac.matrix', { year }); put('repair.matrix', { year });
    put('building.summary', { year }); put('building.list', { year, zone: '', status: '' });
    put('report.costPerRoom', { year });
  });
  put('room.list', {}); put('report.upcoming', { days: 90 });
  put('backup.sheets', {}); put('share.links', {}); put('backup.history', {});

  // Index.html เป็น template ของ Apps Script — แทนค่าตัวแปรเหมือนที่ doGet ทำ
  let html = fs.readFileSync(path.join(ROOT, 'build', 'Index.html'), 'utf8');
  html = html.replace(/<\?=\s*appName\s*\?>/g, 'The M Corner AP')
             .replace(/<\?=\s*subtitle\s*\?>/g, 'ระบบบริหารหอพัก')
             .replace(/<\?=\s*version\s*\?>/g, '1.0.0')
             .replace(/<\?=\s*JSON\.stringify\(accessKey\)\s*\?>/g, JSON.stringify(adminKey))
             .replace(/<\?=\s*JSON\.stringify\(role\)\s*\?>/g, '"admin"');
  check('แทนค่า template ครบ ไม่มี <?= เหลือ', !/<\?/.test(html), html.match(/<\?[^>]{0,40}/g));

  const stub = `<script>
    var __FX__ = ${JSON.stringify(fx)};
    // google.script.run คืน object ใหม่ทุกครั้งที่ต่อ handler (ของจริงก็ทำแบบนี้)
    // ถ้าใช้ object เดียวร่วมกัน การเรียกพร้อมกันหลายคำสั่งจะทับ handler กันเอง
    function mkRunner(h){
      return {
        withSuccessHandler: function(cb){ return mkRunner({ s: cb, f: h.f }); },
        withFailureHandler: function(cb){ return mkRunner({ s: h.s, f: cb }); },
        api: function(a, p){
          var body = {}; Object.keys(p||{}).forEach(function(k){ if (k !== '_key') body[k] = p[k]; });
          var key = a + '|' + JSON.stringify(body);
          setTimeout(function(){
            var res = __FX__[key];
            if (res) h.s(res);
            else if (h.f) h.f(new Error('ไม่มี fixture: ' + key));
            else h.s({ ok:false, error:'ไม่มี fixture: ' + key });
          }, 10);
        }
      };
    }
    window.google = { script: { run: mkRunner({}) } };
  </script>`;
  const file = path.join(OUT, 'bundle-index.html');
  fs.writeFileSync(file, html.replace('</head>', stub + '</head>'));

  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/net::|ERR_/.test(m.text())) errs.push(m.text()); });
  await pg.goto('file://' + file);
  await pg.waitForTimeout(1200);

  check('ไม่มี JS error', errs.length === 0, errs.join(' | '));
  check('CSS ถูกฝังมาด้วย', await pg.evaluate(() => getComputedStyle(document.querySelector('.nav')).width) !== 'auto');
  const navCount = await pg.$$eval('.nav-item', e => e.length);
  check('เมนู 10 หน้า', navCount === 10, 'ได้ ' + navCount);

  for (const p of ['dashboard','debtMain','debtSub','purchases','finance','ac','repairs','building','rooms','reports']) {
    await pg.evaluate(x => go(x), p);
    await pg.waitForFunction(() => !/กำลังโหลดข้อมูล/.test(document.getElementById('view').innerText), { timeout: 5000 });
    const t = await pg.$eval('#view', e => e.innerText);
    check('หน้า ' + p.padEnd(10), t.length > 80 && !/โหลดข้อมูลไม่สำเร็จ|undefined/.test(t), t.slice(0, 80).replace(/\n/g, ' '));
  }
  await pg.evaluate(() => go('reports')); await pg.waitForTimeout(400);
  check('หน้ารายงานมีการ์ดลิงก์แชร์', (await pg.$eval('#view', e => e.innerText)).includes('ลิงก์แชร์'));

  // ทุกฟังก์ชันที่ปุ่มเรียกต้องมีอยู่จริง (กันกรณีลืมใส่ฟังก์ชันตอนรวมไฟล์)
  const missing = new Set();
  for (const p of ['dashboard','debtMain','purchases','finance','ac','repairs','building','rooms','reports']) {
    await pg.evaluate(x => go(x), p);
    await pg.waitForFunction(() => !/กำลังโหลดข้อมูล/.test(document.getElementById('view').innerText), { timeout: 5000 });
    const gone = await pg.evaluate(() => {
      const out = [];
      document.querySelectorAll('[onclick]').forEach(el => {
        // จับเฉพาะการเรียกฟังก์ชันระดับ global ไม่นับเมธอด เช่น this.select()
        (el.getAttribute('onclick') || '').replace(/(^|[^.\w$])([A-Za-z_$][\w$]*)\s*\(/g, (m, pre, fn) => {
          const kw = ['if','for','while','return','function','typeof','new','JSON','Number','String','Array','Object','catch','switch'];
          if (typeof window[fn] !== 'function' && kw.indexOf(fn) < 0) out.push(fn);
          return m;
        });
      });
      return out;
    });
    gone.forEach(f => missing.add(f));
  }
  check('ปุ่มทุกปุ่มเรียกฟังก์ชันที่มีอยู่จริง', missing.size === 0, [...missing].join(', '));
  await pg.screenshot({ path: OUT + '/bundle-reports.png' });

  // โหมดดูอย่างเดียว
  const ro = html.replace('"admin"', '"viewer"').replace(JSON.stringify(adminKey), JSON.stringify(viewKey));
  const f2 = path.join(OUT, 'bundle-readonly.html');
  fs.writeFileSync(f2, ro.replace('</head>', stub + '</head>'));
  const pg2 = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  await pg2.goto('file://' + f2);
  await pg2.waitForTimeout(1000);
  await pg2.evaluate(() => go('purchases'));
  await pg2.waitForFunction(() => /856,404/.test(document.getElementById('view').innerText), { timeout: 5000 });
  const editBtns = await pg2.$$eval('#view [onclick]', els =>
    els.filter(e => /form[A-Z]|del[A-Z]/.test(e.getAttribute('onclick') || '')).length);
  check('โหมดดูอย่างเดียว: ไม่มีปุ่มแก้ไข/ลบเหลือ', editBtns === 0, 'ยังเหลือ ' + editBtns + ' ปุ่ม');
  check('โหมดดูอย่างเดียว: ยังเห็นข้อมูลครบ',
    (await pg2.$eval('#view', e => e.innerText)).includes('856,404'));
  await pg2.screenshot({ path: OUT + '/bundle-readonly.png' });

  console.log('\n════════════════════════════');
  console.log(`ผ่าน ${pass} · ไม่ผ่าน ${fail}`);
  await b.close();
  process.exit(fail ? 1 : 0);
})();
