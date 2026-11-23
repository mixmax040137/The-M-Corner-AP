/**
 * cloudflare.js — ทดสอบระบบฝั่ง Cloudflare (Durable Object + SQLite) คู่กับ Apps Script
 *
 * ฝั่ง Cloudflare  ใช้ server.js ตัวจริง บนฐานข้อมูล SQLite ของ Node (node:sqlite) แทนของ Cloudflare
 * ฝั่ง Apps Script ใช้โค้ด src/*.gs ตัวจริง บนตัวจำลอง test/mock-gas.js (แยกโลกกันด้วย vm)
 * ทั้งสองฝั่งคุยกันผ่านเส้นทางจริง: Cloudflare → doPost ของ Apps Script, Apps Script → /sync/apply
 *
 * รัน: node cloudflare/build.js && node test/cloudflare.js
 */
process.env.TZ = 'Asia/Bangkok';   // Apps Script ตั้งเขตเวลาของสคริปต์เป็นไทย — ตัวจำลองต้องเหมือนกัน
const fs = require('fs'), path = require('path'), vm = require('vm');
const { execFileSync } = require('child_process');
const { DatabaseSync } = require('node:sqlite');
const ROOT = path.join(__dirname, '..');

process.removeAllListeners('warning');   // ไม่ต้องโชว์คำเตือน "SQLite ยังทดลองอยู่"

let pass = 0, fail = 0;
function check(name, got, want) {
  const ok = want === undefined ? !!got : JSON.stringify(got) === JSON.stringify(want);
  if (ok) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + '\n      ได้: ' + JSON.stringify(got) + '\n      ควรได้: ' + JSON.stringify(want)); }
}
const section = t => console.log('\n── ' + t + ' ──');
const clone = v => JSON.parse(JSON.stringify(v));

/* ------------------------------------------------------------------ */
/*  Apps Script จำลอง (โลกแยก)                                         */
/* ------------------------------------------------------------------ */
const GAS_URL = 'https://script.google.com/macros/s/AKfycbTESTTESTTESTTESTTESTTEST/exec';
const CF_ORIGIN = 'https://mcorner.example.workers.dev';
const net = { gasDown: false, cfDown: false, gasCalls: 0, cfCalls: 0 };

function makeGas() {
  const sandbox = { console, require, Buffer, module: { exports: {} }, setTimeout, clearTimeout };
  sandbox.global = sandbox;
  const ctx = vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'mock-gas.js'), 'utf8'), ctx, { filename: 'mock-gas.js' });
  const runSrc = fs.readFileSync(path.join(__dirname, 'run.js'), 'utf8');
  const order = eval(runSrc.match(/const order = (\[[\s\S]*?\]);/)[1]);
  order.forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, 'src', f), 'utf8'), ctx, { filename: f }));
  vm.runInContext('QUIET_ = true;', ctx);
  return ctx;
}
const gas = makeGas();
const G = code => vm.runInContext(code, gas);
G('setupSystem(); seedHistoricalData();');

// Apps Script → Cloudflare: UrlFetchApp ของจริงเป็นแบบรอผลในตัว — เรียก Durable Object ตรง ๆ แบบเดียวกัน
let cf = null;
gas.UrlFetchApp = {
  fetch(url, opts) {
    if (String(url).indexOf(CF_ORIGIN) !== 0) return { getResponseCode: () => 200, getContentText: () => '' };
    net.cfCalls++;
    if (net.cfDown || !cf) throw new Error('Address unavailable: ' + url);
    const body = JSON.parse(opts.payload);
    const res = cf.handleSyncApply(body);
    return { getResponseCode: () => 200, getContentText: () => JSON.stringify(res) };
  }
};

// Cloudflare → Apps Script: fetch ไปที่ /exec = doPost
const realFetch = global.fetch;
global.fetch = async (url, init) => {
  if (String(url) === GAS_URL) {
    net.gasCalls++;
    if (net.gasDown) throw new TypeError('fetch failed');
    const out = gas.doPost({ postData: { contents: init.body } });
    return new Response(out.text, { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  return realFetch(url, init);
};

/* ------------------------------------------------------------------ */
/*  Cloudflare: Durable Object ตัวจริงบน SQLite ของ Node                */
/* ------------------------------------------------------------------ */
function sqlOn(db) {
  const stmts = new Map();
  const cursor = rows => ({ toArray: () => rows, one: () => rows[0], [Symbol.iterator]: () => rows[Symbol.iterator]() });
  return {
    exec(q, ...b) {
      if (!b.length && /;\s*\S/.test(q.trim())) { db.exec(q); return cursor([]); }
      let st = stmts.get(q);
      if (!st) { st = db.prepare(q); stmts.set(q, st); }
      if (/^\s*SELECT/i.test(q)) return cursor(st.all(...b).map(r => Object.assign({}, r)));
      st.run(...b);
      return cursor([]);
    }
  };
}
function makeCtx(db) {
  const st = { alarm: null };
  const bg = [];
  const sql = sqlOn(db);
  return {
    bg, st,
    storage: {
      sql,
      transactionSync(fn) {
        db.exec('BEGIN');
        try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
      },
      getAlarm: async () => st.alarm,
      setAlarm: async t => { st.alarm = t; },
      deleteAlarm: async () => { st.alarm = null; }
    },
    waitUntil: p => bg.push(p)
  };
}

(async () => {
  const { MCornerAP } = await import(path.join(ROOT, 'cloudflare', 'server.mjs'));
  const dbFile = path.join(require('os').tmpdir(), 'mcorner-cf-test-' + process.pid + '.sqlite');
  try { fs.unlinkSync(dbFile); } catch (e) { /* ไม่มีก็ได้ */ }
  let db = new DatabaseSync(dbFile);
  let ctx = makeCtx(db);
  cf = new MCornerAP(ctx, {});
  const settle = async () => { for (let i = 0; i < 5; i++) { const b = ctx.bg.splice(0); await Promise.all(b); if (cf.delivering) await cf.delivering; } };

  const req = (p, body, method) => cf.fetch(new Request(CF_ORIGIN + p, body === undefined && method !== 'POST'
    ? { method: method || 'GET' }
    : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) }));
  const post = async (p, body) => (await req(p, body)).json();
  const capi = async (action, payload) => { const r = await post('/api', { action, payload }); await settle(); return r; };
  const gapi = (action, payload) => clone(gas.api(action, payload));
  const adminKey = G("getSetting_('admin_token', '')");
  const gasRows = name => clone(G('readRows_(' + JSON.stringify(name) + ')')).map(r => { delete r._row; return r; });
  const cfRows = name => clone(cf.app.readRows(name)).map(r => { delete r._row; return r; });
  const S = clone(G('SHEETS'));

  /* ================================================================ */
  section('1. ก่อนเชื่อม');
  let r = await req('/');
  check('ยังไม่เชื่อม เปิดหน้าแรกพาไป /setup', [r.status, r.headers.get('location')], [302, CF_ORIGIN + '/setup']);
  check('หน้า /setup เปิดได้', (await (await req('/setup')).text()).indexOf('เชื่อมต่อและย้ายข้อมูล') > 0, true);
  check('ยังไม่เชื่อม เรียก /api ไม่ได้', (await post('/api', { action: 'app.bootstrap', payload: {} })).ok, false);
  check('ไอคอน PWA ส่งเป็น PNG', (await req('/icon-192.png')).headers.get('content-type'), 'image/png');
  check('manifest มีไอคอน 512', JSON.parse(await (await req('/manifest.webmanifest')).text()).icons.some(i => i.sizes === '512x512'), true);
  check('ลิงก์ Apps Script ผิดรูปแบบ ไม่ยอม', (await post('/setup/pair', { gasUrl: 'https://evil.example/exec', adminKey })).ok, false);
  check('กุญแจกู้ระบบผิด ไม่ยอม', (await post('/setup/pair', { gasUrl: GAS_URL, adminKey: 'wrong-key-xxxxxxxx' })).error, 'กุญแจกู้ระบบไม่ถูกต้อง');
  check('ยังไม่เชื่อม เพราะกุญแจผิด', (await post('/setup/status', {})).paired, false);

  /* ================================================================ */
  section('2. เชื่อมต่อและย้ายข้อมูล');
  r = await post('/setup/pair', { gasUrl: GAS_URL, adminKey });
  check('เชื่อมสำเร็จ', r.ok, true);
  if (!r.ok) console.log(r);
  const names = Object.keys(S).map(k => S[k]).filter(n => n !== S.SESSIONS);
  names.filter(n => n !== S.LOG).forEach(n => check('ย้ายครบ: ' + n + ' (' + gasRows(n).length + ' แถว)', cfRows(n), gasRows(n)));
  check('Apps Script จดรหัสลับและที่อยู่ Cloudflare', [!!G("props_().getProperty('SYNC_SECRET')"), G("props_().getProperty('CF_URL')")], [true, CF_ORIGIN]);
  check('ไม่มีอะไรค้างส่งหลังย้าย', cf.store.outboxCount(), 0);
  let v = await post('/setup/verify', { adminKey });
  check('ตรวจแล้วตรงกันทุกแผ่น', v.ok && v.sheets.every(s => s.same), true);
  check('ตัวเลขบนหน้าระบบตรงกันทุกตัว (' + (v.figures || []).length + ' ชุด)', v.ok && v.figures.every(f => f.same), true);
  check('ยอดหนี้หลักชำระแล้วตรงกัน 5,049,654', [Math.round(v.headline.cf.mainPaid), Math.round(v.headline.gas.mainPaid)], [5049654, 5049654]);
  check('กุญแจผิดตรวจไม่ได้', (await post('/setup/verify', { adminKey: 'nope' })).ok, false);

  /* ================================================================ */
  section('3. หน้าเว็บและล็อกอินบน Cloudflare');
  r = await req('/?key=' + adminKey);
  let page = await r.text();
  check('หน้าระบบเปิดได้', r.status, 200);
  check('ฝังกุญแจและสิทธิ์ผู้ดูแลลงหน้า', page.indexOf('var USER_ROLE  = "ผู้ดูแล"') > 0 && page.indexOf(adminKey) > 0, true);
  check('ไม่มีแท็ก template ค้าง', /<\?/.test(page), false);
  check('มี manifest + service worker', page.indexOf('/manifest.webmanifest') > 0 && page.indexOf("register('/sw.js')") > 0, true);
  check('ห้ามฝังในเว็บอื่น + ไม่ส่ง referrer', [r.headers.get('x-frame-options'), r.headers.get('referrer-policy')], ['DENY', 'no-referrer']);
  page = await (await req('/?key=<script>alert(1)</script>')).text();
  check('กุญแจแปลก ๆ ถูกกรองก่อนฝังลงหน้า', page.indexOf('<script>alert(1)') < 0 && page.indexOf('var USER_ROLE  = "none"') > 0, true);

  gapi('user.save', { _key: adminKey, record: { username: 'owner', name: 'เจ้าของ', role: 'ผู้ดูแล', password: 'Owner#2026pass' } });
  gapi('user.save', { _key: adminKey, record: { username: 'viewer', name: 'คนดู', role: 'ดูอย่างเดียว', password: 'Viewer#2026pass' } });
  gapi('user.save', { _key: adminKey, record: { username: 'editor', name: 'คนแก้', role: 'แก้ไขได้', password: 'Editor#2026pass' } });
  check('บัญชีที่สร้างใน Apps Script มาถึง Cloudflare ทันที', cfRows(S.USERS).map(u => u.username).sort(), gasRows(S.USERS).map(u => u.username).sort());
  let login = await capi('auth.login', { username: 'owner', password: 'Owner#2026pass' });
  check('รหัสผ่านที่ตั้งใน Apps Script ล็อกอินบน Cloudflare ได้ (SHA-256 ตรงกันทุกบิต)', login.ok, true);
  const ses = login.ok ? login.data.session : '';
  check('รหัสผ่านผิดล็อกอินไม่ได้', (await capi('auth.login', { username: 'owner', password: 'wrong-pass' })).ok, false);
  const vses = (await capi('auth.login', { username: 'viewer', password: 'Viewer#2026pass' })).data.session;
  const eses = (await capi('auth.login', { username: 'editor', password: 'Editor#2026pass' })).data.session;
  check('การเข้าใช้งาน (Sessions) ไม่ข้ามไปอีกฝั่ง', gasRows(S.SESSIONS).some(x => JSON.stringify(x).indexOf(ses) >= 0), false);
  let boot = await capi('app.bootstrap', { _session: ses });
  check('bootstrap บน Cloudflare', [boot.ok, boot.data && boot.data.isAdmin, boot.data && boot.data.rooms.length], [true, true, 24]);
  check('ลิงก์แชร์ชี้มาที่ Cloudflare', ((await capi('share.links', { _session: ses })).data || {}).viewUrl.indexOf(CF_ORIGIN + '?key=') === 0, true);
  check('ไม่ล็อกอินเรียกข้อมูลไม่ได้', (await capi('debt.summary', {})).needLogin, true);

  /* ================================================================ */
  section('4. ทุกคำสั่งอ่านข้อมูล: ผลตรงกับ Apps Script ทุกตัวอักษร');
  const gses = gapi('auth.login', { username: 'owner', password: 'Owner#2026pass' }).data.session;
  const year = new Date().getFullYear();
  const reads = [
    ['app.dashboard', { year }], ['app.dashboard', { year: 2025 }], ['calendar.month', { ym: year + '-03' }],
    ['debt.summary', { ledger: 'หนี้หลัก', year: 'all' }], ['debt.summary', { ledger: 'หนี้รอง', year: 2025 }],
    ['debt.overview', {}], ['debt.payments', { ledger: 'หนี้หลัก', year: 'all' }], ['debt.list', { ledger: 'หนี้หลัก' }],
    ['purchase.summary', { year: 2025 }], ['purchase.list', { year: 'all' }], ['purchase.expiring', { days: 400 }],
    ['ac.matrix', { year }], ['ac.list', { year: 'all' }], ['repair.matrix', { year }], ['repair.list', { year: 'all' }],
    ['building.summary', { year }], ['building.list', { year: 'all' }], ['room.list', {}], ['room.profile', { room: '201' }],
    ['asset.list', {}], ['finance.summary', { year: 2025 }], ['finance.list', { year: 'all' }],
    ['report.costPerRoom', { year: 2025 }], ['report.upcoming', { days: 90 }], ['app.search', { q: 'แอร์' }],
    ['notify.digest', {}], ['backup.csv', { sheet: S.PURCHASES }], ['user.list', {}]
  ];
  const strip = o => JSON.parse(JSON.stringify(o, (k, val) => (k === '_row' || k === 'exportedAt' ? undefined : val)));
  for (const [action, p] of reads) {
    const a = await capi(action, Object.assign({ _session: ses }, p));
    const b = gapi(action, Object.assign({ _session: gses }, p));
    check(action + ' ' + JSON.stringify(p), [a.ok, strip(a.data)], [b.ok, strip(b.data)]);
  }

  /* ================================================================ */
  section('5. แก้บน Cloudflare → ถึง Apps Script ทันที');
  const calls0 = net.gasCalls;
  let sv = await capi('purchase.save', { _session: ses, record: { buyDate: '2026-11-20', item: 'หลอดไฟ LED ทดสอบซิงก์', qty: 4, price: 89, category: 'เครื่องใช้ไฟฟ้า', shop: 'ร้านทดสอบ' } });
  check('บันทึกบน Cloudflare สำเร็จ', sv.ok, true);
  const pid = sv.data && sv.data.id;
  check('ส่งไป Apps Script แล้ว (ไม่ต้องรอ)', net.gasCalls > calls0, true);
  check('Apps Script มีรายการใหม่', gasRows(S.PURCHASES).some(x => x.id === pid && x.item === 'หลอดไฟ LED ทดสอบซิงก์'), true);
  check('แถวตรงกันทุกช่อง', gasRows(S.PURCHASES).find(x => x.id === pid), cfRows(S.PURCHASES).find(x => x.id === pid));
  check('ประวัติการแก้ไขไปถึงด้วย', gasRows(S.LOG).slice(-3).some(l => JSON.stringify(l).indexOf('หลอดไฟ LED ทดสอบซิงก์') >= 0), true);
  check('คิวว่าง', cf.store.outboxCount(), 0);
  sv = await capi('purchase.save', { _session: ses, record: Object.assign({}, cfRows(S.PURCHASES).find(x => x.id === pid), { price: 95 }) });
  check('แก้ราคาบน Cloudflare → Apps Script เห็นราคาใหม่', gasRows(S.PURCHASES).find(x => x.id === pid).price, 95);
  await capi('purchase.delete', { _session: ses, id: pid });
  check('ลบบน Cloudflare → Apps Script ลบตาม', gasRows(S.PURCHASES).some(x => x.id === pid), false);
  check('คนดูอย่างเดียวแก้บน Cloudflare ไม่ได้', (await capi('purchase.save', { _session: vses, record: { buyDate: '2026-11-20', item: 'x', price: 1 } })).ok, false);

  /* ================================================================ */
  section('6. แก้บน Apps Script → ถึง Cloudflare ทันที');
  const fin = gapi('finance.save', { _session: gses, record: { date: '2026-11-01', kind: 'ค่าไฟฟ้า', amount: 4321.5, note: 'จากฝั่ง Apps Script' } });
  check('บันทึกบน Apps Script สำเร็จ', fin.ok, true);
  check('Cloudflare มีรายการเดียวกันแล้ว', cfRows(S.FINANCE).find(x => x.id === fin.data.id), gasRows(S.FINANCE).find(x => x.id === fin.data.id));
  const ver0 = (await capi('app.version', { _session: ses })).data.version;
  gapi('finance.save', { _session: gses, record: Object.assign({}, gasRows(S.FINANCE).find(x => x.id === fin.data.id), { amount: 5000 }) });
  check('แก้บน Apps Script → ยอดบน Cloudflare เปลี่ยน', cfRows(S.FINANCE).find(x => x.id === fin.data.id).amount, 5000);
  check('รุ่นข้อมูลบน Cloudflare ขยับ (หน้าเว็บที่เปิดค้างโหลดใหม่เอง)', (await capi('app.version', { _session: ses })).data.version > ver0, true);
  gapi('finance.delete', { _session: gses, id: fin.data.id });
  check('ลบบน Apps Script → Cloudflare ลบตาม', cfRows(S.FINANCE).some(x => x.id === fin.data.id), false);
  check('Cloudflare ไม่ส่งของที่รับมากลับไปซ้ำ', cf.store.outboxCount(), 0);
  const st1 = gapi('settings.save', { _session: gses, values: { building_name: 'The M Corner (ซิงก์)', theme: 'มืด' } });
  check('แก้ตั้งค่าบน Apps Script', st1.ok, true);
  check('ตั้งค่ามาถึง Cloudflare', ['building_name', 'theme'].map(k => cfRows(S.SETTINGS).find(x => x.key === k).value), ['The M Corner (ซิงก์)', 'มืด']);
  check('หน้าเว็บบน Cloudflare ใช้ธีมใหม่ทันที', (await (await req('/')).text()).indexOf('var INIT_THEME = "มืด"') > 0, true);
  const st2 = await capi('settings.save', { _session: ses, values: { building_name: 'แก้จาก Cloudflare' } });
  check('แก้ตั้งค่าบน Cloudflare → Apps Script เห็น', [st2.ok, gasRows(S.SETTINGS).find(x => x.key === 'building_name').value], [true, 'แก้จาก Cloudflare']);

  /* ================================================================ */
  section('7. อีกฝั่งล่ม → เก็บเข้าคิวแล้วส่งเองเมื่อกลับมา');
  net.gasDown = true;
  sv = await capi('purchase.save', { _session: ses, record: { buyDate: '2026-11-21', item: 'ระหว่าง Apps Script ล่ม', qty: 1, price: 500 } });
  check('Apps Script ล่ม ผู้ใช้บนตัวหลักยังบันทึกได้', sv.ok, true);
  const offId = sv.data.id;
  await capi('purchase.save', { _session: ses, record: Object.assign({}, cfRows(S.PURCHASES).find(x => x.id === offId), { price: 550 }) });
  check('ค้างในคิว', cf.store.outboxCount() > 0, true);
  check('ตั้ง alarm ลองใหม่ไว้', ctx.st.alarm > Date.now(), true);
  const stat = await post('/setup/status', { adminKey });
  check('หน้าสถานะบอกว่ามีค้างส่งและสาเหตุ', [stat.pending > 0, /ติดต่อ Apps Script ไม่ได้/.test(stat.lastError)], [true, true]);
  check('ระหว่างนี้ Apps Script ยังไม่มีรายการ', gasRows(S.PURCHASES).some(x => x.id === offId), false);
  net.gasDown = false;
  await cf.alarm(); await settle();
  check('กลับมาแล้ว alarm ส่งครบ คิวว่าง', cf.store.outboxCount(), 0);
  check('Apps Script ได้ค่าล่าสุด (550) ตามลำดับ', (gasRows(S.PURCHASES).find(x => x.id === offId) || {}).price, 550);

  net.cfDown = true;
  const g2 = gapi('purchase.save', { _session: gses, record: { buyDate: '2026-11-21', item: 'ระหว่าง Cloudflare ล่ม', qty: 2, price: 120 } });
  check('Cloudflare ล่ม Apps Script ยังบันทึกได้', g2.ok, true);
  check('Apps Script เก็บเข้าคิวไว้', clone(G('syncStatus_()')).pending > 0, true);
  net.cfDown = false;
  check('ตัวตั้งเวลา syncRetry ส่งที่ค้าง', G('syncRetry()'), 'ข้อมูลตรงกันแล้ว');
  check('Cloudflare ได้รายการแล้ว', cfRows(S.PURCHASES).some(x => x.id === g2.data.id), true);

  /* ================================================================ */
  section('8. แก้แถวเดียวกันพร้อมกันสองฝั่ง → ลงเอยตรงกัน');
  const base = cfRows(S.PURCHASES).find(x => x.id === offId);
  net.gasDown = true;
  await capi('purchase.save', { _session: ses, record: Object.assign({}, base, { note: 'แก้จาก Cloudflare (ก่อน)' }) });
  await new Promise(res => setTimeout(res, 5));
  gapi('purchase.save', { _session: gses, record: Object.assign({}, gasRows(S.PURCHASES).find(x => x.id === offId), { note: 'แก้จาก Apps Script (หลังสุด)' }) });
  check('Cloudflare รับค่าที่ใหม่กว่า', cfRows(S.PURCHASES).find(x => x.id === offId).note, 'แก้จาก Apps Script (หลังสุด)');
  net.gasDown = false;
  await cf.alarm(); await settle();
  check('สองฝั่งตรงกันหลังส่งค้าง (ค่าใหม่สุดชนะ)', [gasRows(S.PURCHASES).find(x => x.id === offId).note, cfRows(S.PURCHASES).find(x => x.id === offId).note],
    ['แก้จาก Apps Script (หลังสุด)', 'แก้จาก Apps Script (หลังสุด)']);

  // Cloudflare ใหม่กว่า แต่ของเก่าจาก Apps Script มาถึงทีหลัง
  net.cfDown = true;
  gapi('purchase.save', { _session: gses, record: Object.assign({}, gasRows(S.PURCHASES).find(x => x.id === offId), { note: 'Apps Script (เก่า ส่งช้า)' }) });
  net.cfDown = false;
  await new Promise(res => setTimeout(res, 5));
  net.gasDown = true;
  await capi('purchase.save', { _session: ses, record: Object.assign({}, cfRows(S.PURCHASES).find(x => x.id === offId), { note: 'Cloudflare (ใหม่สุด)' }) });
  net.gasDown = false;
  G('syncRetry()');
  check('ของเก่าที่มาช้าไม่ทับของใหม่บน Cloudflare', cfRows(S.PURCHASES).find(x => x.id === offId).note, 'Cloudflare (ใหม่สุด)');
  await cf.alarm(); await settle();
  check('Apps Script ถูกแก้ให้ตามค่าใหม่สุด', gasRows(S.PURCHASES).find(x => x.id === offId).note, 'Cloudflare (ใหม่สุด)');

  // ลบบน Cloudflare แล้วอีกฝั่งส่งทั้งแผ่น (เก่ากว่า) มา — แถวที่ลบต้องไม่ฟื้น
  net.gasDown = true;
  await capi('purchase.delete', { _session: ses, id: g2.data.id });
  net.gasDown = false;
  cf.handleSyncApply({ secret: G("props_().getProperty('SYNC_SECRET')"), ops: [{ s: S.PURCHASES, all: gasRows(S.PURCHASES), t: Date.now() - 60000 }] });
  check('แถวที่ลบไปแล้วไม่ฟื้นจากข้อมูลเก่า', cfRows(S.PURCHASES).some(x => x.id === g2.data.id), false);
  await cf.alarm(); await settle();
  check('และ Apps Script ลบตาม', gasRows(S.PURCHASES).some(x => x.id === g2.data.id), false);

  /* ================================================================ */
  section('9. พิมพ์แก้ใน Google Sheet โดยตรง');
  const sh = gas.SpreadsheetApp.getActiveSpreadsheet().getSheetByName(S.ROOMS);
  const roomCol = clone(G('SCHEMA'))[S.ROOMS].findIndex(c => c.key === 'note') + 1;
  sh.getRange(3, roomCol).setValue('พิมพ์ในชีตเอง');
  const roomKey = gasRows(S.ROOMS)[1].room;
  G('syncOnEdit')({ range: { getSheet: () => sh } });
  check('แก้ในชีต → Cloudflare เห็น', cfRows(S.ROOMS).find(x => x.room === roomKey).note, 'พิมพ์ในชีตเอง');
  const before = gasRows(S.PURCHASES).length;
  gas.SpreadsheetApp.getActiveSpreadsheet().getSheetByName(S.PURCHASES).deleteRow(5);
  G('syncOnChange')({ changeType: 'REMOVE_ROW', source: { getActiveSheet: () => gas.SpreadsheetApp.getActiveSpreadsheet().getSheetByName(S.PURCHASES) } });
  check('ลบแถวในชีต → Cloudflare ลบตาม', cfRows(S.PURCHASES).length, before - 1);

  /* ================================================================ */
  section('10. งานที่ใช้ Drive/อีเมล: Cloudflare ส่งต่อให้ Apps Script ทำ');
  const png = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'cloudflare', 'web', 'icon-192.png')).toString('base64');
  let up = await capi('file.upload', { _session: eses, bucket: 'purchase', files: [{ name: 'slip.png', dataUrl: png }] });
  check('แนบไฟล์ผ่าน Cloudflare สำเร็จ (ไปเก็บใน Drive)', up.ok && up.data.length === 1 && !!up.data[0].id, true);
  check('คนดูอย่างเดียวแนบไฟล์ไม่ได้', (await capi('file.upload', { _session: vses, files: [{ name: 'a.png', dataUrl: png }] })).ok, false);
  check('ไม่ล็อกอินแนบไฟล์ไม่ได้', (await capi('file.upload', { files: [{ name: 'a.png', dataUrl: png }] })).needLogin, true);
  const bk = await capi('backup.backupNow', { _session: ses });
  check('สำรองข้อมูลลง Drive ผ่าน Cloudflare', bk.ok, true);
  check('คนแก้ไขได้สั่งสำรองไม่ได้ (เฉพาะผู้ดูแล)', (await capi('backup.backupNow', { _session: eses })).ok, false);
  check('Apps Script ไม่รับคำสั่งส่งต่อที่ไม่อยู่ในรายการ', clone(gas.syncHandle_({ op: 'api', secret: G("props_().getProperty('SYNC_SECRET')"), action: 'user.delete', role: 'ผู้ดูแล', payload: {} })).ok, false);
  check('Apps Script ไม่รับรหัสลับผิด', clone(gas.syncHandle_({ op: 'export', secret: 'x' })).ok, false);
  check('Cloudflare ไม่รับการเปลี่ยนแปลงที่รหัสลับผิด', (await post('/sync/apply', { secret: 'x', ops: [{ s: S.PURCHASES, k: 'A', r: null, t: Date.now() }] })).ok, false);

  /* ================================================================ */
  section('11. ปิดเปิดใหม่ (ข้อมูลอยู่ใน SQLite ไม่ใช่หน่วยความจำ)');
  net.gasDown = true;
  sv = await capi('ac.save', { _session: ses, record: { room: '305', bookDate: '2026-11-22', status: 'นัดหมายแล้ว', note: 'ค้างส่งก่อนรีสตาร์ต' } });
  check('บันทึกระหว่าง Apps Script ล่ม', sv.ok, true);
  const snapPurch = cfRows(S.PURCHASES), pendingBefore = cf.store.outboxCount();
  db.close();
  db = new DatabaseSync(dbFile);
  ctx = makeCtx(db);
  cf = new MCornerAP(ctx, {});
  check('ข้อมูลครบหลังรีสตาร์ต', cfRows(S.PURCHASES), snapPurch);
  check('คิวที่ค้างยังอยู่', cf.store.outboxCount(), pendingBefore);
  check('ล็อกอินค้างไว้ยังใช้ได้', (await capi('auth.me', { _session: ses })).data.signedIn, true);
  net.gasDown = false;
  await cf.alarm(); await settle();
  check('ส่งที่ค้างได้หลังรีสตาร์ต', [cf.store.outboxCount(), gasRows(S.AC_SERVICE).some(x => x.id === sv.data.id)], [0, true]);

  /* ================================================================ */
  section('12. ตรวจทั้งระบบอีกรอบหลังทุกอย่าง');
  v = await post('/setup/verify', { adminKey });
  check('ทุกแผ่นตรงกันทุกแถว', v.sheets.filter(s => !s.same).map(s => s.name + ': ' + s.diff.join(',')), []);
  check('ตัวเลขทุกชุดตรงกัน', v.figures.filter(f => !f.same).map(f => f.name), []);

  // ซ่อมด้วยการส่งทั้งชุด: ทำให้ Apps Script เพี้ยนเองแล้วกดซ่อม
  G("rewriteSheet_(SHEETS.ROOMS, readRows_(SHEETS.ROOMS).slice(0, 3))");
  v = await post('/setup/verify', { adminKey });
  check('ตรวจเจอว่าไม่ตรง', v.allSame, false);
  check('ปุ่มส่งทั้งชุดซ่อมได้', (await post('/setup/push', { adminKey })).ok, true);
  v = await post('/setup/verify', { adminKey });
  check('ตรงกันอีกครั้ง', v.allSame, true);

  /* ================================================================ */
  section('13. กันเดากุญแจที่ /setup');
  for (let i = 0; i < 8; i++) await post('/setup/verify', { adminKey: 'guess-' + i });
  r = await req('/setup/verify', { adminKey });
  check('ผิด 8 ครั้ง พักก่อน แม้กุญแจถูก', r.status, 429);
  cf.store.delProp('__setup_guard');

  /* ================================================================ */
  section('14. เวลาไทยบน Cloudflare (เครื่องเป็น UTC) ตรงกับ Apps Script');
  const probe = `
    const app = (await import(${JSON.stringify(path.join(ROOT, 'cloudflare', 'dist', 'app.mjs'))})).createApp({});
    const D = app.internals.Date, U = app.internals.Utilities, out = [];
    for (const t of T) {
      const d = new D(t);
      out.push([d.getFullYear(), d.getMonth(), d.getDate(), d.getDay(), d.getHours(), d.getMinutes(), String(d),
        U.formatDate(d, 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss')]);
      const e = new D(d.getFullYear(), d.getMonth(), d.getDate()); out.push(e.getTime());
      const f = new D(t); f.setDate(f.getDate() + 40); f.setHours(0, 0, 0, 0); out.push(f.getTime());
      const g = new D(t); g.setMonth(g.getMonth() + 13); out.push(g.getTime());
    }
    out.push(new D('2026-03-05T08:30').getTime(), new D('2026-03-05').getTime(), new D(2569, 6, 1).getTime(), new D(99, 0, 1).getTime());
    out.push(U.computeDigest(U.DigestAlgorithm.SHA_256, 'ทดสอบ ภาษาไทย 🏢 ' + 'x'.repeat(200)));
    console.log(JSON.stringify(out));`;
  const T = [];
  for (let i = 0; i < 400; i++) T.push(Date.UTC(2020, 0, 1) + i * 3 * 86400000 + (i * 7919 % 86400) * 1000);
  T.push(Date.UTC(2026, 11, 31, 17, 30), Date.UTC(2026, 11, 31, 16, 59, 59), Date.UTC(2027, 1, 28, 18));
  const want = [];
  for (const t of T) {
    const d = new Date(t);
    const p = n => String(n).padStart(2, '0');
    want.push([d.getFullYear(), d.getMonth(), d.getDate(), d.getDay(), d.getHours(), d.getMinutes(), String(d),
      d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())]);
    want.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime());
    const f = new Date(t); f.setDate(f.getDate() + 40); f.setHours(0, 0, 0, 0); want.push(f.getTime());
    const g = new Date(t); g.setMonth(g.getMonth() + 13); want.push(g.getTime());
  }
  want.push(new Date('2026-03-05T08:30').getTime(), new Date('2026-03-05').getTime(), new Date(2569, 6, 1).getTime(), new Date(99, 0, 1).getTime());
  want.push(Array.from(require('crypto').createHash('sha256').update('ทดสอบ ภาษาไทย 🏢 ' + 'x'.repeat(200), 'utf8').digest()).map(b => (b > 127 ? b - 256 : b)));
  const got = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', 'const T = ' + JSON.stringify(T) + ';' + probe],
    { env: Object.assign({}, process.env, { TZ: 'UTC' }), encoding: 'utf8' }));
  const bad = [];
  want.forEach((w, i) => { if (JSON.stringify(w) !== JSON.stringify(got[i])) bad.push({ i, want: w, got: got[i] }); });
  check('วันที่/เวลา ' + want.length + ' แบบ บนเครื่อง UTC ได้ผลเหมือน Apps Script เวลาไทยทุกตัว', bad.slice(0, 3), []);

  console.log('\n════════════════════════════\nผ่าน ' + pass + ' · ไม่ผ่าน ' + fail);
  db.close();
  try { fs.unlinkSync(dbFile); } catch (e) { /* ช่างมัน */ }
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
