/**
 * gen-demo.js — สร้าง demo/index.html
 *
 * หน้าตัวอย่างแบบอ่านอย่างเดียว เปิดในเบราว์เซอร์ได้เลยโดยไม่ต้องต่อเน็ต
 * ใช้ตอนอยากดูหน้าตาระบบโดยไม่แตะข้อมูลจริง
 *
 * โครงหน้าเอามาจาก build/Index.html ตัวเดียวกับที่ใช้จริง แล้วแทน
 * scriptlet ของ Apps Script ด้วยค่าคงที่ — เมื่อก่อนไฟล์นี้ก็อปโครงหน้า
 * มาเขียนเองซ้ำ พอหน้าจริงเปลี่ยน (มีกระดิ่ง มีหน้าตั้งค่า) ตัวอย่างก็เพี้ยนตาม
 * ไม่ทัน จึงเปลี่ยนมาอ่านจากไฟล์เดียวกันแทน
 *
 * ต้องรัน node build/bundle.js ก่อน เพราะไฟล์นี้อ่าน build/Index.html
 */
require('./mock-gas.js');
const fs = require('fs'), path = require('path'), vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');

// ไม่รวม Ocr.gs เพราะต้องพึ่ง Google Drive — หน้าตัวอย่างไม่มีเซิร์ฟเวอร์ให้เรียก
['Config.gs','Util.gs','Setup.gs','Users.gs','Auth.gs','Settings.gs','Drive.gs','Seed.gs',
 'Finance.gs','Backup.gs','Migrate.gs','Debt.gs','Purchase.gs','Maintenance.gs',
 'Building.gs','Dashboard.gs','Api.gs','Web.gs','Notify.gs']
  .forEach(f => vm.runInThisContext(fs.readFileSync(path.join(SRC, f), 'utf8'), { filename: f }));

QUIET_ = true;
setupSystem();
seedHistoricalData();

// ให้ตัวอย่างดูมีชีวิต: เติมงานค้างและงานที่นัดไว้ล่วงหน้าเล็กน้อย
// งานซ่อมใส่หลายจุดในใบเดียว จะได้เห็นเช็คลิสต์ทำงานจริง
saveRoomRepair_({ room:'212', reportDate:'2026-08-20', bookDate:'2026-09-02',
  items:'[x] ก๊อกอ่างล้างหน้ารั่ว | ระบบน้ำ/สุขภัณฑ์\n' +
        '[ ] เปลี่ยนสายฉีดชำระ | ระบบน้ำ/สุขภัณฑ์\n' +
        '[ ] เก็บสีขอบประตูห้องน้ำ | สี/ผนัง/ฝ้า',
  priority:'ด่วน', technician:'ช่างสมชาย', cost:850 });
saveRoomRepair_({ room:'514', reportDate:'2026-08-28',
  items:'[ ] เครื่องทำน้ำอุ่นไม่ร้อน | เครื่องทำน้ำอุ่น\n[ ] เปลี่ยนสวิตช์ไฟห้องน้ำ | ระบบไฟฟ้า',
  priority:'ด่วนมาก' });
bulkBookAc_({ rooms:['111','115','315'], bookDate:'2026-09-14', technician:'ร้านแอร์เย็นดี', cost:600 });
saveBuildingRepair_({ zone:'ปั๊มน้ำ/ถังเก็บน้ำ', title:'ล้างถังเก็บน้ำและตรวจปั๊มประจำปี',
  bookDate:'2026-09-20', status:'นัดหมายแล้ว', contractor:'ทีมช่างประจำ', cost:4500, nextDue:'2027-09-20' });

// หน้าตัวอย่างไม่มีเซิร์ฟเวอร์ จึงไม่มีบัญชีผู้ใช้และอ่านรูปไม่ได้
setSetting_('ocr_enabled', 'ปิด');
clearSheet_(SHEETS.USERS);
clearSheet_(SHEETS.SESSIONS);

const YEARS = mergeYears_([[2026,2025,2024,2023,2022,2021,2020,2018]]);
const fx = {};
const put = (action, payload) => {
  const res = api(action, payload);
  fx[action + '|' + JSON.stringify(payload || {})] = res.ok ? res.data : null;
};

// หน้าตัวอย่างไม่มีบัญชีผู้ใช้ให้ล็อกอิน — บอกไปเลยว่าเป็นผู้เยี่ยมชมที่ดูได้อย่างเดียว
// ไม่งั้น authGate จะค้างอยู่ที่หน้าล็อกอินที่กดเข้าไม่ได้
fx['auth.me|{}'] = {
  role: ROLE.VIEWER, canEdit: false, isAdmin: false, signedIn: true,
  username: '', name: 'ผู้เยี่ยมชม', via: 'หน้าตัวอย่าง', label: 'ดูอย่างเดียว'
};

put('app.bootstrap', {});
put('app.alerts', {});
['all'].concat(YEARS).forEach(y => {
  const year = String(y);
  put('app.dashboard', { year });
  ['หนี้หลัก','หนี้รอง'].forEach(l => {
    put('debt.summary', { ledger: l, year });
    put('debt.payments', { ledger: l, year });
  });
  put('purchase.summary', { year });
  put('purchase.list', { year, category: '', q: '' });
  put('ac.matrix', { year });
  put('repair.matrix', { year });
  put('building.summary', { year });
  put('building.list', { year, zone: '', status: '' });
  put('finance.summary', { year });
  put('finance.list', { year, kind: '' });
  put('report.costPerRoom', { year });
});
put('debt.list', {});
put('debt.overview', {});
put('room.list', {});
put('report.upcoming', { days: 90 });
put('backup.sheets', {});
put('share.links', {});
put('backup.history', {});
put('settings.list', {});
ROOMS.forEach(r => put('room.profile', { room: r }));

/* ---- ประกอบหน้า จากโครงเดียวกับที่ใช้จริง ---- */
let html = fs.readFileSync(path.join(ROOT, 'build', 'Index.html'), 'utf8');

const fill = {
  appName: APP.NAME,
  subtitle: APP.SUBTITLE + ' · ตัวอย่างการใช้งาน',
  version: APP.VERSION,
  accessKey: '',
  role: 'ผู้ดูแล',
  theme: 'ตามเครื่อง'
};
html = html.replace(/<\?!?=\s*(\w+)\s*\?>/g, (m, k) => (k in fill ? fill[k] : ''));
if (/<\?/.test(html)) throw new Error('ยังมี scriptlet ของ Apps Script เหลืออยู่ในหน้าตัวอย่าง');

// แทนชั้นเรียกเซิร์ฟเวอร์ด้วยข้อมูลตัวอย่างที่เตรียมไว้
// วางไว้หลัง App.html แต่ก่อน boot() จึงทับ callApi ตัวจริงได้ทัน
const STUB = `
<script>
/* ---- ข้อมูลตัวอย่าง (สร้างจากข้อมูลจริงในชีตเดิม) ---- */
var FIXTURES = ${JSON.stringify(fx)};
var CAN_EDIT = false;

callApi = function(action, payload){
  var key = action + '|' + JSON.stringify(payload || {});
  return new Promise(function(resolve, reject){
    setTimeout(function(){
      if (key in FIXTURES && FIXTURES[key] !== null) return resolve(FIXTURES[key]);
      if (action === 'app.search') {
        var q = String((payload||{}).q||'').toLowerCase(), hits = [];
        Object.keys(FIXTURES).forEach(function(k){
          if (k.indexOf('purchase.list') !== 0) return;
          (FIXTURES[k]||[]).forEach(function(p){
            if (String(p.item).toLowerCase().indexOf(q) >= 0 && hits.length < 40)
              hits.push({ module:'purchases', label:'รายการซื้อของ', id:p.id, title:p.item, detail:p.buyDate });
          });
        });
        return resolve(hits);
      }
      if (CLIENT_MUTATING.test(action))
        return reject(new Error('นี่คือหน้าตัวอย่าง — การบันทึกจะทำงานจริงเมื่อติดตั้งบน Google Apps Script'));
      resolve(null);
    }, 90);
  });
};

// ไม่มีเซิร์ฟเวอร์ให้ถามว่าข้อมูลเปลี่ยนหรือยัง จึงไม่ต้องตรวจซ้ำ
startPolling = function(){ syncSet('idle'); };
requireLogin = function(){ return false; };
</script>
<script>
// ทับตัวเขียนท้ายแถบเมนู ไม่ใช่เขียนทับ innerHTML เฉย ๆ
// เพราะ bootNow() เขียนช่องนี้ทีหลัง (หลังโหลด bootstrap เสร็จ) จะทับของเราหมด
navFootHtml = function(){
  return '<b style="color:#c7d0e0">หน้าตัวอย่างแบบอ่านอย่างเดียว</b>' +
    '<br><span style="opacity:.8">ข้อมูลจริงจากชีตเดิม ณ ส.ค. 2569</span>' +
    '<br><span style="opacity:.8">กดดูได้ทุกหน้า แต่บันทึกไม่ได้</span>';
};
</script>
`;
html = html.replace('<script>boot();</script>', STUB + '<script>boot();</script>');

fs.mkdirSync(path.join(ROOT, 'demo'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'demo', 'index.html'), html);
console.log('demo/index.html — ' + Math.round(html.length / 1024) + ' KB, ' +
            Object.keys(fx).length + ' fixtures');
