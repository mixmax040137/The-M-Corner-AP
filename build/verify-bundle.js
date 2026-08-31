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

/* ---------- 1b) ไฟล์เดียวจบ ---------- */
console.log('\n── build/AllInOne.gs ──');
{
  const vmAll = require('vm').createContext(Object.assign({}, global, { console }));
  const allSrc = fs.readFileSync(path.join(ROOT, 'build', 'AllInOne.gs'), 'utf8');
  require('vm').runInContext(allSrc, vmAll, { filename: 'AllInOne.gs' });
  const embedded = vmAll.indexHtml_();
  const original = fs.readFileSync(path.join(ROOT, 'build', 'Index.html'), 'utf8');
  check('HTML ที่ฝังไว้ถอดกลับตรงกับต้นฉบับเป๊ะ', embedded === original,
        'ยาว ' + embedded.length + ' vs ' + original.length);
  check('มีทั้งโค้ดเซิร์ฟเวอร์และหน้าเว็บในไฟล์เดียว',
        typeof vmAll.START_HERE === 'function' && typeof vmAll.doGet === 'function' && embedded.length > 100000);
  check('ไม่เรียกไฟล์ HTML แยกอีกแล้ว', allSrc.indexOf("createTemplateFromFile('Index')") < 0);
}

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

  // เรนเดอร์ template แบบเดียวกับ Apps Script ของจริง:
  //   <?=  expr ?>  พิมพ์ค่าโดย escape HTML  (ถ้าใช้ในแท็ก script จะพัง เพราะ &quot; ไม่ถูกถอดกลับ)
  //   <?!= expr ?>  พิมพ์ค่าดิบ
  // จำลองให้ตรงจุดนี้สำคัญมาก — เคยพลาดมาแล้วจนกุญแจไม่ถึงหน้าเว็บ
  const tplVars = { appName: 'The M Corner AP', subtitle: 'ระบบบริหารหอพัก', version: '1.0.0',
                    accessKey: adminKey, role: 'admin' };
  const htmlEscape = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function renderTemplate(tpl, vars) {
    return tpl.replace(/<\?(!?)=\s*([\s\S]*?)\s*\?>/g, (m, force, expr) => {
      const val = Function('JSON', ...Object.keys(vars), 'return (' + expr + ')')(JSON, ...Object.values(vars));
      return force ? String(val) : htmlEscape(val);
    });
  }

  let html = renderTemplate(fs.readFileSync(path.join(ROOT, 'build', 'Index.html'), 'utf8'), tplVars);
  check('แทนค่า template ครบ ไม่มี <?= เหลือ', !/<\?/.test(html), (html.match(/<\?[^>]{0,40}/g) || []).join(' '));
  check('กุญแจถึงหน้าเว็บโดยไม่ถูก escape',
        html.indexOf('var ACCESS_KEY = "' + adminKey + '"') > 0 &&
        html.indexOf('&quot;') !== html.indexOf('var ACCESS_KEY'),
        (html.split('\n').find(l => l.includes('ACCESS_KEY')) || '').trim());

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
  const vars = await pg.evaluate(() => ({
    key: typeof ACCESS_KEY !== 'undefined' ? ACCESS_KEY : null,
    role: typeof USER_ROLE !== 'undefined' ? USER_ROLE : null,
    edit: typeof canEdit === 'function' ? canEdit() : null
  }));
  check('ตัวแปรกุญแจถูกประกาศในหน้าเว็บ', vars.key === adminKey, 'ได้ ' + JSON.stringify(vars.key));
  check('บทบาทถูกส่งถึงหน้าเว็บ', vars.role === 'admin', 'ได้ ' + JSON.stringify(vars.role));
  check('canEdit() คืน true สำหรับผู้ดูแล', vars.edit === true, 'ได้ ' + JSON.stringify(vars.edit));
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
  const ro = renderTemplate(fs.readFileSync(path.join(ROOT, 'build', 'Index.html'), 'utf8'),
                            Object.assign({}, tplVars, { accessKey: viewKey, role: 'viewer' }));
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
