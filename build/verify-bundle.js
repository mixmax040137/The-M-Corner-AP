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

check('สร้างครบ 13 ชีต', Object.keys(SHEETS).length === 13);
check('รายการซื้อ 94 รายการ', readRows_(SHEETS.PURCHASES).length === 94);
check('ยอดชำระหนี้ 5,049,654', Math.round(debtSummary_('หนี้หลัก', 'all').paid) === 5049654);
check('รายรับ-รายจ่าย 32 รายการ', readRows_(SHEETS.FINANCE).length === 32);
check('มีคำสั่ง API ครบ 72 คำสั่ง', Object.keys(API_ROUTES).length === 72);
check('มีบัญชีผู้ดูแลคนแรกให้ล็อกอิน', !!findUser_('admin'), true);
const adminKey = getSetting_('admin_token', ''), viewKey = getSetting_('view_token', '');
check('มีกุญแจผู้ดูแลและกุญแจแชร์', !!(adminKey && viewKey && adminKey !== viewKey), true);
// เปิดลิงก์เปล่า ๆ ต้องได้หน้าเว็บ (แล้วไปเจอหน้าล็อกอิน) ไม่ใช่หน้าปฏิเสธ
{
  const st = require('../test/mock-gas.js').store;
  const realUser = global.Session.getActiveUser;
  global.Session.getActiveUser = () => ({ getEmail: () => '' });   // คนนอกที่เปิดลิงก์มา ไม่ใช่เจ้าของชีต

  doGet({ parameter: {} });
  check('doGet ไม่มีกุญแจ → ยังเปิดหน้าเว็บได้ (ไปเจอหน้าล็อกอิน)', st.lastTemplate.role === 'none',
        'ได้บทบาท ' + st.lastTemplate.role);
  doGet({ parameter: { key: adminKey } });
  check('doGet ด้วยกุญแจกู้ระบบ → เข้าเป็นผู้ดูแล', st.lastTemplate.role === ROLE.ADMIN,
        'ได้บทบาท ' + st.lastTemplate.role);
  check('doGet ส่งธีมไปให้หน้าเว็บด้วย', typeof st.lastTemplate.theme === 'string', String(st.lastTemplate.theme));

  // กุญแจถูกฝังดิบ ๆ ในแท็ก script จึงต้องไม่มีอักขระที่หลุดออกจากเครื่องหมายคำพูดได้เลย
  doGet({ parameter: { key: '"></script><script>alert(1)//' } });
  check('doGet กรองอักขระอันตรายออกจากกุญแจก่อนฝังลงหน้า',
        !/[^A-Za-z0-9_-]/.test(st.lastTemplate.accessKey), String(st.lastTemplate.accessKey));

  global.Session.getActiveUser = realUser;
}
setSetting_('share_link_enabled', 'เปิด');

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
  // ใส่ค่าลับจำลอง เพื่อพิสูจน์ว่ามันไม่หลุดไปโผล่ในหน้าเว็บ
  const SECRET_PROBE = 'DOORCODE-999888-PROBE';
  setSetting_('door_code', SECRET_PROBE);
  setSetting_('admin_code', SECRET_PROBE + '-ADMIN');
  put('settings.list', {}); put('auth.devices', {}); put('user.list', {});

  // auth.me ต้องตอบว่าล็อกอินแล้ว ไม่งั้นหน้าเว็บจะค้างอยู่ที่หน้าล็อกอิน
  // คำตอบปลอมของคำสั่งที่ "บันทึกข้อมูล" ไว้ทดสอบว่าหน้าเว็บจดรุ่นข้อมูลใหม่หลังบันทึก
  // (ไม่เรียก api จริง เพราะไม่อยากให้ข้อมูลทดสอบไปปนกับ fixture ชุดอื่น)
  fx['purchase.save|{"record":{"item":"ทดสอบ","price":1,"buyDate":"2026-01-01"}}'] =
    { ok: true, data: { id: 'PUR-TEST' } };

  const meAdmin = api('auth.me', { _key: adminKey });
  const meViewer = api('auth.me', { _key: viewKey });
  fx['auth.me|{}'] = meAdmin;

  // เรนเดอร์ template แบบเดียวกับ Apps Script ของจริง:
  //   <?=  expr ?>  พิมพ์ค่าโดย escape HTML  (ถ้าใช้ในแท็ก script จะพัง เพราะ &quot; ไม่ถูกถอดกลับ)
  //   <?!= expr ?>  พิมพ์ค่าดิบ
  // จำลองให้ตรงจุดนี้สำคัญมาก — เคยพลาดมาแล้วจนกุญแจไม่ถึงหน้าเว็บ
  const tplVars = { appName: 'The M Corner AP', subtitle: 'ระบบบริหารหอพัก', version: '1.0.0',
                    accessKey: adminKey, role: ROLE.ADMIN, theme: 'ตามเครื่อง' };
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
          var body = {}; Object.keys(p||{}).forEach(function(k){ if (k !== '_key' && k !== '_session') body[k] = p[k]; });
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

  // เครื่องนี้มี chromium ติดตั้งไว้แล้ว ไม่ต้องให้ playwright ไปโหลดใหม่
  const CHROME = '/opt/pw-browsers/chromium';
  const b = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
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
  check('บทบาทถูกส่งถึงหน้าเว็บ', vars.role === ROLE.ADMIN, 'ได้ ' + JSON.stringify(vars.role));
  check('canEdit() คืน true สำหรับผู้ดูแล', vars.edit === true, 'ได้ ' + JSON.stringify(vars.edit));
  check('CSS ถูกฝังมาด้วย', await pg.evaluate(() => getComputedStyle(document.querySelector('.nav')).width) !== 'auto');
  const navCount = await pg.$$eval('.nav-item', e => e.length);
  check('เมนู 11 หน้า', navCount === 11, 'ได้ ' + navCount);

  for (const p of ['dashboard','debtMain','debtSub','purchases','finance','ac','repairs','building','rooms','reports','settings']) {
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
                            Object.assign({}, tplVars, { accessKey: viewKey, role: ROLE.VIEWER }));
  const f2 = path.join(OUT, 'bundle-readonly.html');
  const fxRo = Object.assign({}, fx, {
    'auth.me|{}': meViewer,
    'app.bootstrap|{}': api('app.bootstrap', { _key: viewKey })
  });
  const stubRo = stub.replace(JSON.stringify(fx), JSON.stringify(fxRo));
  fs.writeFileSync(f2, ro.replace('</head>', stubRo + '</head>'));
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

  /* ---------- หน้าล็อกอิน · PIN · ธีม ---------- */
  console.log('\n── หน้าล็อกอิน / PIN / ธีม ──');
  {
    // ยังไม่ได้ล็อกอิน — ต้องเจอหน้าล็อกอิน ไม่ใช่ข้อมูลหอพัก
    // ต้องปลอมเป็นคนนอกก่อน ไม่งั้นทางลัด "เจ้าของชีตเข้าได้เสมอ" จะทำให้ล็อกอินผ่านไปเลย
    const realUser3 = global.Session.getActiveUser;
    global.Session.getActiveUser = () => ({ getEmail: () => '' });
    const meNobody = api('auth.me', {});
    global.Session.getActiveUser = realUser3;
    check('ผู้ที่ยังไม่ล็อกอินได้ signedIn = false', meNobody.data.signedIn === false, JSON.stringify(meNobody.data));
    const fxOut = Object.assign({}, fx, { 'auth.me|{}': meNobody });
    const fOut = path.join(OUT, 'bundle-login.html');
    const stubOut = stub.replace(JSON.stringify(fx), JSON.stringify(fxOut));
    const outHtml = renderTemplate(fs.readFileSync(path.join(ROOT, 'build', 'Index.html'), 'utf8'),
                                   Object.assign({}, tplVars, { accessKey: '', role: 'none' }));
    fs.writeFileSync(fOut, outHtml.replace('</head>', stubOut + '</head>'));

    const p3 = await b.newPage({ viewport: { width: 500, height: 900 } });
    const errs3 = [];
    p3.on('pageerror', e => errs3.push(e.message));
    await p3.goto('file://' + fOut);
    await p3.waitForSelector('#lgGo', { timeout: 5000 }).catch(() => {});

    check('ยังไม่ล็อกอิน → เจอหน้าล็อกอิน', await p3.$('#lgGo') !== null);
    check('มีช่องชื่อผู้ใช้และรหัสผ่าน', (await p3.$('#lgUser')) !== null && (await p3.$('#lgPass')) !== null);
    check('หน้าล็อกอินไม่มี JS error', errs3.length === 0, errs3.join(' | '));
    check('ข้อมูลหอพักถูกบังไว้จนกว่าจะล็อกอิน',
          await p3.evaluate(() => document.body.classList.contains('locked')));

    // กรอกไม่ครบต้องเตือน ไม่ใช่ยิงคำสั่งไปเลย
    await p3.click('#lgGo');
    await p3.waitForTimeout(200);
    check('กรอกไม่ครบแล้วขึ้นข้อความเตือน',
          await p3.evaluate(() => { const e = document.getElementById('authErr'); return !!e && !e.hidden; }));

    // หน้า PIN
    await p3.evaluate(() => { AUTH.device = 'DEVTOKEN'; showPin(); });
    await p3.waitForTimeout(200);
    check('เปิดหน้า PIN ได้', await p3.$('#pinDots') !== null);
    check('มีจุดครบ 6 จุด', await p3.$$eval('#pinDots i', e => e.length) === 6);
    check('มีแป้นตัวเลขครบ 12 ปุ่ม', await p3.$$eval('.pin-k', e => e.length) === 12);
    await p3.evaluate(() => { pinPush('1'); pinPush('2'); pinPush('3'); });
    check('กดเลขแล้วจุดติดตามจำนวนที่กด',
          await p3.$$eval('#pinDots i.on', e => e.length) === 3);
    await p3.evaluate(() => pinBack());
    check('กดลบแล้วจุดลดลง', await p3.$$eval('#pinDots i.on', e => e.length) === 2);
    await p3.screenshot({ path: OUT + '/bundle-pin.png' });
    await p3.close();
  }

  {
    // ธีม — สลับได้จริงและมีผลกับสีพื้น
    const p4 = await b.newPage({ viewport: { width: 1200, height: 900 } });
    await p4.goto('file://' + file);
    await p4.waitForTimeout(900);
    const bgOf = () => p4.evaluate(() => getComputedStyle(document.body).backgroundColor);

    await p4.evaluate(() => setTheme('สว่าง', true));
    const light = await bgOf();
    check('เลือกธีมสว่างแล้วติดป้าย light',
          await p4.evaluate(() => document.documentElement.getAttribute('data-theme')) === 'light');

    await p4.evaluate(() => setTheme('มืด', true));
    const dark = await bgOf();
    check('เลือกธีมมืดแล้วติดป้าย dark',
          await p4.evaluate(() => document.documentElement.getAttribute('data-theme')) === 'dark');
    check('สีพื้นหลังเปลี่ยนจริงเมื่อสลับธีม', light !== dark, light + ' vs ' + dark);

    await p4.evaluate(() => setTheme('ตามเครื่อง', true));
    check('เลือกตามเครื่องแล้วเอาป้ายออก',
          await p4.evaluate(() => document.documentElement.getAttribute('data-theme')) === null);

    await p4.evaluate(() => cycleTheme());
    check('ปุ่มสลับธีมบนแถบหัวใช้งานได้',
          await p4.evaluate(() => document.documentElement.getAttribute('data-theme')) === 'light');

    // หน้าตั้งค่า
    await p4.evaluate(() => setTheme('มืด', true));
    await p4.evaluate(() => go('settings'));
    await p4.waitForFunction(() => !/กำลังโหลดข้อมูล/.test(document.getElementById('view').innerText), { timeout: 5000 });
    const txt = await p4.$eval('#view', e => e.innerText);
    check('หน้าตั้งค่ามีบัญชีของฉัน', txt.includes('บัญชีของฉัน'));
    check('หน้าตั้งค่ามีตัวเลือกธีม', await p4.$$eval('.theme-opt', e => e.length) === 3);
    check('ธีมที่ใช้อยู่ถูกไฮไลต์', await p4.$$eval('.theme-opt.on', e => e.length) === 1);
    check('หน้าตั้งค่ามีตารางผู้ใช้', txt.includes('ผู้ใช้ในระบบ'));
    const rawHtml = await p4.content();
    check('ค่ารหัสเข้าตึกไม่หลุดมาที่หน้าเว็บเลย', !rawHtml.includes(SECRET_PROBE), 'พบค่าลับในหน้า!');
    check('หน้าตั้งค่าบอกว่าค่าลับอยู่ในชีต', txt.includes('ไม่แสดงที่นี่เพื่อความปลอดภัย'));
    check('หน้าตั้งค่ามีปุ่มบันทึก', await p4.$$eval('#view [onclick*="saveSettingsForm"]', e => e.length) >= 1);
    await p4.screenshot({ path: OUT + '/bundle-settings-dark.png', fullPage: true });
    await p4.close();
  }

  /* ---------- บิลเดียวหลายรายการ (ซื้อออนไลน์) ---------- */
  console.log('\n── กรอกบิลหลายรายการ ──');
  {
    await pg.evaluate(() => go('purchases'));
    await pg.waitForFunction(() => !/กำลังโหลดข้อมูล/.test(document.getElementById('view').innerText), { timeout: 5000 });
    await pg.evaluate(() => formPurchase(null));
    await pg.waitForTimeout(300);

    check('ฟอร์มซื้อของมีตารางรายการในบิล', await pg.$('#f_lines') !== null);
    check('เริ่มต้นยังไม่มีรายการย่อย', await pg.$$eval('#f_lines .line-row', e => e.length) === 0);

    // กรอกสามรายการเหมือนสั่งของออนไลน์จริง
    await pg.evaluate(() => {
      addLine(); setLine(0, 'name', 'ปั๊มน้ำ 750W'); setLine(0, 'qty', 1); setLine(0, 'unit', 'เครื่อง'); setLine(0, 'price', 4250);
      addLine(); setLine(1, 'name', 'สายไฟ VAF 2x1.5'); setLine(1, 'qty', 20); setLine(1, 'unit', 'เมตร'); setLine(1, 'price', 17.5);
      addLine(); setLine(2, 'name', 'เทปพันสายไฟ'); setLine(2, 'qty', 3); setLine(2, 'unit', 'ม้วน'); setLine(2, 'price', 15);
    });
    await pg.waitForTimeout(150);
    check('เพิ่มรายการย่อยได้ 3 แถว', await pg.$$eval('#f_lines .line-row', e => e.length) === 3);
    check('ราคารวมคิดให้อัตโนมัติ (4250+350+45)',
      await pg.evaluate(() => Number(document.getElementById('f_price').value)) === 4645);
    check('ช่องราคารวมถูกล็อกไม่ให้พิมพ์ทับ',
      await pg.evaluate(() => document.getElementById('f_price').readOnly) === true);

    // ใส่ค่าส่งกับส่วนลด
    await pg.evaluate(() => {
      document.getElementById('f_shipping').value = '60';
      document.getElementById('f_discount').value = '100';
      recalcBill();
    });
    check('บวกค่าส่ง หักส่วนลด แล้วยอดถูก (4645+60−100)',
      await pg.evaluate(() => Number(document.getElementById('f_price').value)) === 4605);

    // ลบรายการกลางออก ยอดต้องคิดใหม่
    await pg.evaluate(() => delLine(1));
    await pg.waitForTimeout(120);
    check('ลบรายการย่อยแล้วยอดคิดใหม่ (4250+45+60−100)',
      await pg.evaluate(() => Number(document.getElementById('f_price').value)) === 4255);
    check('เหลือ 2 แถว', await pg.$$eval('#f_lines .line-row', e => e.length) === 2);

    // แปลงกลับเป็นข้อความที่จะเก็บลงชีต — ต้องตรงรูปแบบเดียวกับฝั่งเซิร์ฟเวอร์
    check('แปลงเป็นข้อความสำหรับเก็บลงชีตได้ถูกรูปแบบ',
      await pg.evaluate(() => formatLinesText(FORM.lines)) ===
      'ปั๊มน้ำ 750W | 1 | เครื่อง | 4250\nเทปพันสายไฟ | 3 | ม้วน | 15');

    // วางทีเดียวหลายรายการ
    await pg.evaluate(() => { FORM.lines = []; redrawLines(); });
    await pg.evaluate(() => {
      pasteLines();
      document.getElementById('pasteBox').value =
        'พัดลมโคจร | 3 | ตัว | 890\nหลอดไฟ LED 9W 145\nสวิตช์ไฟ | 5 | อัน | 45';
      applyPastedLines();
    });
    await pg.waitForTimeout(200);
    check('วางทีเดียวได้ 3 รายการ', await pg.$$eval('#f_lines .line-row', e => e.length) === 3);
    const guessed = await pg.evaluate(() => [FORM.lines[1].name, FORM.lines[1].price]);
    check('บรรทัดที่ไม่มี | ระบบแยกชื่อกับราคาให้เอง',
      guessed[0] === 'หลอดไฟ LED 9W' && guessed[1] === 145, JSON.stringify(guessed));
    // ค่าส่ง/ส่วนลดจากขั้นก่อนหน้ายังอยู่ ต้องถูกคิดรวมด้วย
    check('ยอดจากการวาง รวมค่าส่งกับส่วนลดที่ยังค้างอยู่ (2670+145+225+60−100)',
      await pg.evaluate(() => Number(document.getElementById('f_price').value)) === 3000);
    await pg.evaluate(() => {
      document.getElementById('f_shipping').value = '';
      document.getElementById('f_discount').value = '';
      recalcBill();
    });
    check('ล้างค่าส่งกับส่วนลดแล้วเหลือค่าสินค้าล้วน (2670+145+225)',
      await pg.evaluate(() => Number(document.getElementById('f_price').value)) === 3040);

    await pg.evaluate(() => closeModal());

    // บิลที่บันทึกไว้แล้วต้องกางดูรายการย่อยได้ในตาราง
    await pg.evaluate(() => go('purchases'));
    await pg.waitForFunction(() => !/กำลังโหลดข้อมูล/.test(document.getElementById('view').innerText), { timeout: 5000 });
    const hasToggle = await pg.evaluate(() => {
      // ยัดบิลตัวอย่างเข้าไปในผลลัพธ์แล้ววาดใหม่ เพื่อดูว่าปุ่มกางทำงาน
      var d = S.cache.purchases;
      d.items[0].bill = { count: 2, shipping: 60, discount: 0,
        lines: [{ name:'ปั๊มน้ำ', qty:1, unit:'เครื่อง', unitPrice:4250, total:4250 },
                { name:'สายไฟ', qty:20, unit:'เมตร', unitPrice:17.5, total:350 }] };
      document.getElementById('view').innerHTML = ROUTES.purchases.render(d);
      var btn = document.querySelector('.bill-toggle');
      if (!btn) return 'ไม่มีปุ่มกางดู';
      var box = document.getElementById(btn.getAttribute('onclick').match(/'([^']+)'/)[1]);
      var before = box.hidden;
      btn.click();
      return before === true && box.hidden === false ? 'ok' : 'กดแล้วไม่กาง';
    });
    check('บิลหลายรายการกางดูในตารางได้', hasToggle === 'ok', hasToggle);
    check('รายการย่อยแสดงครบทุกบรรทัด',
      await pg.$$eval('.bill-line', e => e.length) === 2);
  }

  /* ---------- ปุ่มแก้ไขต้องแก้ของเดิม ไม่ใช่สร้างใหม่ ----------
     เคยพลาดมาแล้ว: ประกาศ attr() ชื่อซ้ำใน Settings.html ไปทับของ Views.html
     ทำให้ปุ่มแก้ไขได้ข้อความแทน object → ฟอร์มขึ้นว่าง → กดบันทึกกลายเป็นรายการใหม่
  --------------------------------------------------------------- */
  console.log('\n── ปุ่มแก้ไขทุกโมดูล ──');
  {
    // หน้า, ฟังก์ชันฟอร์ม, ช่องที่ต้องมีค่าเดิมขึ้นมา
    const cases = [
      ['debtMain',  'formDebt',        'f_title'],
      ['debtMain',  'formDebtPayment', 'f_payDate'],
      ['purchases', 'formPurchase',    'f_item'],
      ['ac',        'formAc',          'f_room'],
      ['repairs',   'formRepair',      'f_items'],
      ['building',  'formBuilding',    'f_title'],
      ['finance',   'formFinance',     'f_amount']
    ];

    for (const [pageId, fn, probe] of cases) {
      await pg.evaluate(x => go(x), pageId);
      await pg.waitForFunction(() => !/กำลังโหลดข้อมูล/.test(document.getElementById('view').innerText), { timeout: 5000 });

      // หาปุ่มดินสอของฟอร์มนั้นในตาราง แล้วกดจริง ๆ เหมือนผู้ใช้
      // ต้องเป็นปุ่มที่ส่ง object ของรายการเข้าไป (ดินสอ) ไม่ใช่ปุ่ม "+ เพิ่ม" ที่ส่ง null
      const clicked = await pg.evaluate(f => {
        var btn = Array.prototype.slice.call(document.querySelectorAll('#view [onclick]'))
          .filter(function(e){ return (e.getAttribute('onclick') || '').indexOf(f + '({') === 0; })[0];
        if (!btn) return 'ไม่เจอปุ่มดินสอที่ส่งข้อมูลรายการ';
        btn.click();
        return 'ok';
      }, fn);
      if (clicked !== 'ok') { check(fn + ': มีปุ่มแก้ไขให้กด', false, clicked); continue; }
      await pg.waitForTimeout(250);

      const got = await pg.evaluate(id => ({
        title: (document.querySelector('.modal-h h3') || {}).textContent || '',
        probe: (document.getElementById(id) || {}).value,
        recId: (FORM.rec || {}).id || ''
      }), probe);

      check(fn + ': หัวฟอร์มขึ้นว่า "แก้ไข" ไม่ใช่ "เพิ่ม/บันทึก"',
            /แก้ไข|ข้อมูลห้อง/.test(got.title), got.title);
      check(fn + ': ข้อมูลเดิมถูกเติมลงฟอร์ม',
            got.probe !== undefined && String(got.probe).trim() !== '', JSON.stringify(got.probe));
      check(fn + ': จำรหัสรายการเดิมไว้ (กดบันทึกแล้วจะแก้ทับ ไม่สร้างใหม่)',
            !!got.recId, JSON.stringify(got.recId));
      await pg.evaluate(() => closeModal());
    }

    // กดปุ่ม "เพิ่มรายการ" ต้องได้ฟอร์มเปล่าและไม่มีรหัสเดิม
    await pg.evaluate(() => go('finance'));
    await pg.waitForFunction(() => !/กำลังโหลดข้อมูล/.test(document.getElementById('view').innerText), { timeout: 5000 });
    await pg.evaluate(() => formFinance(null));
    await pg.waitForTimeout(200);
    const fresh = await pg.evaluate(() => ({
      title: (document.querySelector('.modal-h h3') || {}).textContent || '',
      recId: (FORM.rec || {}).id || ''
    }));
    check('กดเพิ่มรายการใหม่: หัวฟอร์มไม่ใช่ "แก้ไข"', !/แก้ไข/.test(fresh.title), fresh.title);
    check('กดเพิ่มรายการใหม่: ไม่มีรหัสเดิมติดมา', !fresh.recId, JSON.stringify(fresh.recId));
    await pg.evaluate(() => closeModal());
  }

  /* ---------- การรีเฟรชอัตโนมัติต้องไม่รบกวนการกรอกข้อมูล ---------- */
  console.log('\n── การรีเฟรชอัตโนมัติ ──');
  {
    const p5 = await b.newPage({ viewport: { width: 1300, height: 900 } });
    const errs5 = [];
    p5.on('pageerror', e => errs5.push(e.message));
    await p5.goto('file://' + file);
    await p5.waitForTimeout(1000);

    check('ค่าตั้งต้นรีเฟรชคือ 5 นาที',
      await p5.evaluate(() => S.boot.settings.refreshSeconds) === 300);
    check('ป้ายบอกรอบเป็น "นาที" ไม่ใช่ "วินาที"',
      (await p5.$eval('#liveDot', e => e.innerHTML)).includes('ทุก 5 นาที'));

    // กำลังพิมพ์อยู่ในช่องค้นหา = ยุ่ง ห้ามโหลดทับ
    await p5.focus('#searchBox');
    check('พิมพ์อยู่ในช่องกรอก = ถือว่ากำลังยุ่ง', await p5.evaluate(() => userIsBusy()) === true);
    await p5.evaluate(() => document.activeElement.blur());
    check('ไม่ได้พิมพ์อะไร = ว่าง โหลดได้', await p5.evaluate(() => userIsBusy()) === false);

    // เปิดฟอร์มค้างไว้ = ยุ่ง
    await p5.evaluate(() => go('purchases'));
    await p5.waitForFunction(() => !/กำลังโหลดข้อมูล/.test(document.getElementById('view').innerText), { timeout: 5000 });
    await p5.evaluate(() => formPurchase());
    await p5.waitForTimeout(300);
    check('เปิดฟอร์มค้างไว้ = ถือว่ากำลังยุ่ง', await p5.evaluate(() => userIsBusy()) === true);

    // พิมพ์ข้อความค้างไว้ในฟอร์ม แล้วจำลองว่ามีข้อมูลใหม่เข้ามา
    await p5.evaluate(() => { document.getElementById('f_item').value = 'ปั๊มน้ำที่ยังกรอกไม่เสร็จ'; });
    const typed = await p5.evaluate(() => {
      S.version = 'เก่า';
      // จำลองรอบตรวจข้อมูลหนึ่งรอบ ตามตรรกะเดียวกับใน startPolling
      var changed = true;
      if (changed && Date.now() >= S.selfChangeUntil && userIsBusy()) liveDotPending();
      return document.getElementById('f_item').value;
    });
    check('มีข้อมูลใหม่ตอนกำลังกรอก → ข้อความที่พิมพ์ไว้ไม่หาย',
      typed === 'ปั๊มน้ำที่ยังกรอกไม่เสร็จ', typed);
    check('ขึ้นปุ่ม "มีข้อมูลใหม่" ให้กดเองแทนการโหลดทับ',
      (await p5.$eval('#liveDot', e => e.innerHTML)).includes('มีข้อมูลใหม่'));
    await p5.evaluate(() => closeModal());

    // กดบันทึกแล้วต้องจดรุ่นข้อมูลใหม่ไว้ ไม่งั้นจะโหลดซ้ำและขึ้นข้อความผิด ๆ
    const selfBefore = await p5.evaluate(() => S.selfChangeUntil);
    const saved = await p5.evaluate(() => callApi('purchase.save',
      { record: { item: 'ทดสอบ', price: 1, buyDate: '2026-01-01' } })
      .then(function(d){ return d.id; }).catch(function(e){ return 'ผิดพลาด: ' + e.message; }));
    check('คำสั่งบันทึกทำงานสำเร็จ', saved === 'PUR-TEST', saved);
    await p5.waitForTimeout(200);
    check('กดบันทึกแล้วระบบจำได้ว่าเป็นการแก้ของเราเอง',
      await p5.evaluate(() => S.selfChangeUntil) > selfBefore);
    check('ช่วงกันโหลดซ้ำหลังบันทึกยาวพอรองรับความหน่วงของ Drive',
      await p5.evaluate(() => S.selfChangeUntil - Date.now()) > 60000);
    check('คำสั่งที่แค่อ่านข้อมูล ไม่ถูกนับว่าเป็นการแก้',
      await p5.evaluate(() => CLIENT_MUTATING.test('purchase.list') === false &&
                              CLIENT_MUTATING.test('app.dashboard') === false &&
                              CLIENT_MUTATING.test('purchase.save') === true &&
                              CLIENT_MUTATING.test('file.upload') === true));
    check('หน้ารีเฟรชไม่มี JS error', errs5.length === 0, errs5.join(' | '));
    await p5.close();
  }

  console.log('\n════════════════════════════');
  console.log(`ผ่าน ${pass} · ไม่ผ่าน ${fail}`);
  await b.close();
  process.exit(fail ? 1 : 0);
})();
