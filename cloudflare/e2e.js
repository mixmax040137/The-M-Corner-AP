/**
 * e2e.js — ทดสอบครบวงจรบน runtime จริงของ Cloudflare (workerd ผ่าน wrangler dev)
 *
 *   Cloudflare   wrangler dev (Durable Object + SQLite ของจริง, alarm ของจริง)
 *   Apps Script  เซิร์ฟเวอร์ HTTP ในเครื่องที่รันโค้ด src/*.gs บนตัวจำลอง (doPost ตัวจริง)
 *   หน้าเว็บ      Chromium เปิดหน้าระบบบน Cloudflare แล้วใช้งานจริง
 *
 * รัน: cd cloudflare && npm run e2e
 */
process.env.TZ = 'Asia/Bangkok';
const fs = require('fs'), path = require('path'), vm = require('vm'), http = require('http');
const { spawn, execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const CF_PORT = 8787, GAS_PORT = 8790;
const CF = 'http://127.0.0.1:' + CF_PORT, GAS_URL = 'http://127.0.0.1:' + GAS_PORT + '/exec';
const STATE = path.join(require('os').tmpdir(), 'mcorner-e2e-state');
const SHOTS = process.env.SHOTS || '';

let pass = 0, fail = 0;
function check(name, got, want) {
  const ok = want === undefined ? !!got : JSON.stringify(got) === JSON.stringify(want);
  if (ok) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + '\n      ได้: ' + JSON.stringify(got) + '\n      ควรได้: ' + JSON.stringify(want)); }
}
const section = t => console.log('\n── ' + t + ' ──');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clone = v => JSON.parse(JSON.stringify(v));

/* ---------- Apps Script จำลองเป็นเซิร์ฟเวอร์ HTTP ---------- */
const sandbox = { console, require, Buffer, module: { exports: {} }, setTimeout, clearTimeout };
sandbox.global = sandbox;
const gas = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'test', 'mock-gas.js'), 'utf8'), gas);
const order = eval(fs.readFileSync(path.join(ROOT, 'test', 'run.js'), 'utf8').match(/const order = (\[[\s\S]*?\]);/)[1]);
order.forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, 'src', f), 'utf8'), gas, { filename: f }));
const G = code => vm.runInContext(code, gas);
G('QUIET_ = true; setupSystem(); seedHistoricalData();');

// Apps Script ใช้ได้แต่ https — ในเครื่องทดสอบ Cloudflare เป็น http จึงแปลงที่อยู่ตรงนี้ที่เดียว
const asHttps = u => String(u).replace('http://127.0.0.1:' + CF_PORT, 'https://127.0.0.1:' + CF_PORT);
const asHttp = u => String(u).replace('https://127.0.0.1:' + CF_PORT, 'http://127.0.0.1:' + CF_PORT);
gas.UrlFetchApp = {
  fetch(url, opts) {   // UrlFetchApp ของจริงรอผลในตัว — ใช้ curl แบบรอผลให้เหมือนกัน
    try {
      const out = execFileSync('curl', ['-s', '-m', '30', '-o', '-', '-w', '\n%{http_code}', '-X', 'POST',
        '-H', 'Content-Type: application/json', '--data-binary', '@-', asHttp(url)],
        { input: opts.payload, encoding: 'utf8', env: Object.assign({}, process.env, { NO_PROXY: '127.0.0.1,localhost', no_proxy: '127.0.0.1,localhost' }) });
      const i = out.lastIndexOf('\n');
      const code = Number(out.slice(i + 1));
      if (!code) throw new Error('Address unavailable');
      return { getResponseCode: () => code, getContentText: () => out.slice(0, i) };
    } catch (e) { throw new Error('Address unavailable: ' + url); }
  }
};
let gasUp = true, gasHits = 0;
const gasServer = http.createServer((req, res) => {
  let body = '';
  req.on('data', c => { body += c; });
  req.on('end', () => {
    if (!gasUp) { req.socket.destroy(); return; }
    gasHits++;
    let parsed = {};
    try { parsed = JSON.parse(body); } catch (e) { /* ปล่อยว่าง */ }
    if (parsed.op === 'pair' && parsed.cfUrl) parsed.cfUrl = asHttps(parsed.cfUrl);
    const out = gas.doPost({ postData: { contents: JSON.stringify(parsed) } });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(out.text);
  });
});

/* ---------- wrangler dev ---------- */
let wr = null;
async function startCf() {
  wr = spawn(path.join(__dirname, 'node_modules', '.bin', 'wrangler'),
    ['dev', '--port', String(CF_PORT), '--ip', '127.0.0.1', '--persist-to', STATE, '--var', 'ALLOW_TEST_PEER:1',
     '--show-interactive-dev-session=false', '--log-level', 'warn'],
    { cwd: __dirname, env: Object.assign({}, process.env, { NO_PROXY: '127.0.0.1,localhost', WRANGLER_SEND_METRICS: 'false', CI: '1' }), stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  wr.stdout.on('data', d => { log += d; if (process.env.VERBOSE) process.stdout.write(d); });
  wr.stderr.on('data', d => { log += d; if (process.env.VERBOSE) process.stderr.write(d); });
  for (let i = 0; i < 120; i++) {
    try { const r = await fetch(CF + '/healthz'); if (r.ok) return; } catch (e) { /* ยังไม่พร้อม */ }
    await sleep(500);
  }
  throw new Error('wrangler dev ไม่ขึ้น:\n' + log.slice(-3000));
}
async function stopCf() {
  if (!wr) return;
  wr.kill('SIGINT');
  await new Promise(r => { wr.on('exit', r); setTimeout(r, 8000); });
  wr = null;
  await sleep(500);
}

const post = async (p, body) => (await fetch(CF + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) })).json();
const api = (action, payload) => post('/api', { action, payload });
const gasRows = n => clone(G('readRows_(' + JSON.stringify(n) + ')'));
async function until(fn, ms) { const end = Date.now() + ms; while (Date.now() < end) { if (await fn()) return true; await sleep(300); } return false; }

(async () => {
  fs.rmSync(STATE, { recursive: true, force: true });
  await new Promise(r => gasServer.listen(GAS_PORT, '127.0.0.1', r));
  await startCf();
  const adminKey = G("getSetting_('admin_token','')");
  const S = clone(G('SHEETS'));

  section('1. runtime จริงของ Cloudflare');
  let r = await fetch(CF + '/', { redirect: 'manual' });
  check('ยังไม่เชื่อม → /setup', [r.status, r.headers.get('location')], [302, CF + '/setup']);
  r = await post('/setup/pair', { gasUrl: GAS_URL, adminKey });
  check('เชื่อมและย้ายข้อมูลบน workerd', r.ok, true);
  if (!r.ok) console.log(r);
  check('ย้ายรายการซื้อครบ 94', r.counts && r.counts[S.PURCHASES], 94);
  let v = await post('/setup/verify', { adminKey });
  check('ตรวจ: ตรงทุกแผ่น ทุกตัวเลข', v.allSame, true);

  section('2. ใช้งานจริงผ่าน HTTP');
  G("api('user.save', { _key: getSetting_('admin_token',''), record: { username: 'owner', name: 'เจ้าของ', role: 'ผู้ดูแล', password: 'Owner#2026pass' } })");
  const login = await api('auth.login', { username: 'owner', password: 'Owner#2026pass' });
  check('ล็อกอินด้วยบัญชีที่สร้างใน Apps Script', login.ok, true);
  const ses = login.data.session;
  const sv = await api('purchase.save', { _session: ses, record: { buyDate: '2026-11-23', item: 'E2E: ก๊อกน้ำ', qty: 2, price: 640, category: 'อุปกรณ์ช่าง' } });
  check('บันทึกบน Cloudflare', sv.ok, true);
  check('Apps Script ได้รับภายในไม่กี่วินาที', await until(() => gasRows(S.PURCHASES).some(x => x.id === sv.data.id), 10000), true);
  const g = clone(G("api('finance.save', { _key: getSetting_('admin_token',''), record: { date: '2026-11-05', kind: 'ค่าน้ำประปา', amount: 777 } })"));
  check('บันทึกบน Apps Script', g.ok, true);
  const list = await api('finance.list', { _session: ses, year: 'all' });
  check('Cloudflare เห็นทันที', list.data.some(x => x.id === g.data.id && x.amount === 777), true);

  section('3. Apps Script ล่ม → alarm ส่งให้เองเมื่อกลับมา');
  gasUp = false;
  const off = await api('purchase.save', { _session: ses, record: { buyDate: '2026-11-23', item: 'E2E: ระหว่างล่ม', qty: 1, price: 99, category: 'อุปกรณ์ช่าง' } });
  check('ยังบันทึกได้', off.ok, true);
  await sleep(1500);
  let st = await post('/setup/status', { adminKey });
  check('มีค้างส่ง', st.pending > 0, true);
  gasUp = true;
  check('alarm ส่งให้เองหลัง Apps Script กลับมา (ไม่มีใครกดอะไร)', await until(() => gasRows(S.PURCHASES).some(x => x.id === off.data.id), 45000), true);
  st = await post('/setup/status', { adminKey });
  check('คิวว่าง', st.pending, 0);

  section('4. รีสตาร์ต Cloudflare — ข้อมูลอยู่ครบ');
  await stopCf();
  await startCf();
  const after = await api('purchase.list', { _session: ses, year: 'all' });
  check('ล็อกอินเดิมยังใช้ได้ และรายการครบ', after.ok && after.data.some(x => x.id === off.data.id), true);
  v = await post('/setup/verify', { adminKey });
  check('ตรวจอีกครั้ง: ตรงกันหมด', [v.allSame, v.sheets.filter(s => !s.same).map(s => s.name)], [true, []]);

  section('5. เปิดหน้าเว็บด้วย Chromium');
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  page.on('requestfailed', q => { if (!/fonts\.(googleapis|gstatic)/.test(q.url())) errors.push('โหลดไม่ได้: ' + q.url()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.abort());
  await page.goto(CF + '/');
  await page.waitForSelector('#authRoot input', { timeout: 20000 });
  const inputs = await page.$$('#authRoot input');
  await inputs[0].fill('owner');
  await page.fill('#authRoot input[type=password]', 'Owner#2026pass');
  await page.keyboard.press('Enter');
  const loggedIn = await page.waitForFunction(() => /หนี้/.test(document.getElementById('view').innerText) && !/กำลัง/.test(document.getElementById('view').innerText.slice(0, 40)), null, { timeout: 30000 }).then(() => true, () => false);
  check('ล็อกอินผ่านหน้าเว็บแล้วเห็นแดชบอร์ด', loggedIn, true);
  const dashText = await page.innerText('#view');
  check('แดชบอร์ดแสดงยอดหนี้หลักชำระแล้ว 5,049,654', /5,049,654/.test(dashText), true);
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'cf-dashboard.png') });
  const sw = await page.evaluate(() => navigator.serviceWorker.getRegistration().then(r => !!r));
  check('ติดตั้ง service worker (ติดตั้งเป็นแอปได้)', sw, true);
  const mf = await page.evaluate(() => fetch('/manifest.webmanifest').then(r => r.json()).then(m => m.display));
  check('manifest เปิดแบบแอป (standalone)', mf, 'standalone');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.waitForFunction(() => /หนี้/.test(document.getElementById('view').innerText), null, { timeout: 30000 }).catch(() => {});
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'cf-mobile.png') });
  check('เปิดใหม่ยังล็อกอินอยู่ (จำเครื่อง)', /หนี้/.test(await page.innerText('#view')), true);
  const setupPage = await browser.newPage({ viewport: { width: 900, height: 900 } });
  await setupPage.route(/fonts\.(googleapis|gstatic)\.com/, route => route.abort());
  await setupPage.goto(CF + '/setup');
  await setupPage.fill('#verifyKey', adminKey);
  await setupPage.click('#verifyBtn');
  await setupPage.waitForSelector('#verifyOut table', { timeout: 60000 });
  check('หน้า /setup ปุ่มตรวจแสดงผล "ตรงกันทุกแถว"', /ตรงกันทุกแถว/.test(await setupPage.innerText('#verifyMsg')), true);
  if (SHOTS) await setupPage.screenshot({ path: path.join(SHOTS, 'cf-setup.png'), fullPage: true });
  check('ไม่มี error ในหน้าเว็บ', errors, []);
  await browser.close();

  console.log('\n════════════════════════════\nผ่าน ' + pass + ' · ไม่ผ่าน ' + fail);
  await stopCf();
  gasServer.close();
  process.exit(fail ? 1 : 0);
})().catch(async e => { console.error(e); await stopCf(); process.exit(1); });
