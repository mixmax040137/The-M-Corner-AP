/** สร้าง demo/index.html — ตัวอย่างระบบแบบ static (อ่านอย่างเดียว) จากข้อมูล seed จริง */
require('./mock-gas.js');
const fs = require('fs'), path = require('path'), vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
['Config.gs','Util.gs','Setup.gs','Auth.gs','Drive.gs','Seed.gs','Finance.gs','Backup.gs','Migrate.gs','Debt.gs','Purchase.gs',
 'Maintenance.gs','Building.gs','Dashboard.gs','Api.gs','Web.gs','Notify.gs']
  .forEach(f => vm.runInThisContext(fs.readFileSync(path.join(SRC, f), 'utf8'), { filename: f }));

setupSystem();
seedHistoricalData();

// ให้ demo ดูมีชีวิต: เติมงานค้าง/นัดหมายในอนาคตเล็กน้อย
saveRoomRepair_({ room:'212', reportDate:'2026-08-20', bookDate:'2026-09-02',
  category:'ระบบน้ำ/สุขภัณฑ์', items:'1.ก๊อกอ่างล้างหน้ารั่ว 2.เปลี่ยนสายฉีดชำระ',
  priority:'ด่วน', status:'นัดหมายแล้ว', technician:'ช่างสมชาย', cost:850 });
saveRoomRepair_({ room:'514', reportDate:'2026-08-28', category:'เครื่องทำน้ำอุ่น',
  items:'1.เครื่องทำน้ำอุ่นไม่ร้อน', priority:'ด่วนมาก', status:'รอดำเนินการ' });
bulkBookAc_({ rooms:['111','115','315'], bookDate:'2026-09-14', technician:'ร้านแอร์เย็นดี', cost:600 });
saveBuildingRepair_({ zone:'ปั๊มน้ำ/ถังเก็บน้ำ', title:'ล้างถังเก็บน้ำและตรวจปั๊มประจำปี',
  bookDate:'2026-09-20', status:'นัดหมายแล้ว', contractor:'ทีมช่างประจำ', cost:4500, nextDue:'2027-09-20' });

const YEARS = mergeYears_([[2026,2025,2024,2023,2022,2021,2020,2018]]);
const fx = {};
const put = (action, payload) => {
  const res = api(action, payload);
  fx[action + '|' + JSON.stringify(payload || {})] = res.ok ? res.data : null;
};

put('app.bootstrap', {});
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
ROOMS.forEach(r => put('room.profile', { room: r }));

const read = f => fs.readFileSync(path.join(SRC, 'ui', f), 'utf8');
const strip = s => s.replace(/^\s*<script>/, '').replace(/<\/script>\s*$/, '');

const html = `<title>The M Corner AP — ระบบบริหารหอพัก</title>
${read('Style.html')}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@500;600;700&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet">

<div class="app">
  <aside class="nav" id="nav">
    <div class="brand"><b>🏢 The M Corner AP</b><span>ระบบบริหารหอพัก · ตัวอย่างการใช้งาน</span></div>
    <div class="nav-list" id="navList"></div>
    <div class="nav-foot" id="navFoot"></div>
  </aside>
  <div class="main">
    <header class="top">
      <button class="burger" onclick="toggleNav()">☰</button>
      <div><h1 id="pageTitle">ภาพรวม</h1><div class="sub" id="pageSub"></div></div>
      <div class="top-right">
        <span class="b warn">โหมดตัวอย่าง · อ่านอย่างเดียว</span>
        <span id="liveDot"></span>
        <select class="sel w-auto" id="yearSel" onchange="setYear(this.value)"></select>
        <button class="btn icon" onclick="refresh()">↻</button>
      </div>
    </header>
    <main class="content" id="view"></main>
  </div>
</div>
<div id="modalRoot"></div><div id="toastRoot"></div>

<script>
/* ---- ข้อมูลตัวอย่าง (สร้างจากข้อมูลจริงในชีตเดิม) ---- */
var FIXTURES = ${JSON.stringify(fx)};
var ACCESS_KEY = '';
var USER_ROLE = 'admin';
var CAN_EDIT = true;
</script>
<script>${strip(read('App.html'))}</script>
<script>${strip(read('Views.html'))}</script>
<script>${strip(read('Forms.html'))}</script>
<script>
/* ---- แทนที่การเรียกเซิร์ฟเวอร์ด้วยข้อมูลตัวอย่าง ---- */
callApi = function(action, payload){
  var key = action + '|' + JSON.stringify(payload || {});
  return new Promise(function(resolve, reject){
    setTimeout(function(){
      if (key in FIXTURES && FIXTURES[key] !== null) return resolve(FIXTURES[key]);
      if (action === 'app.search') {
        var q = String((payload||{}).q||'').toLowerCase();
        var hits = [];
        Object.keys(FIXTURES).forEach(function(k){
          if (k.indexOf('purchase.list') !== 0) return;
          (FIXTURES[k]||[]).forEach(function(p){
            if (String(p.item).toLowerCase().indexOf(q) >= 0 && hits.length < 40)
              hits.push({ module:'purchases', label:'รายการซื้อของ', id:p.id, title:p.item, detail:p.buyDate });
          });
        });
        return resolve(hits);
      }
      if (/\\.(save|delete|bulkBook|upload)/.test(action))
        return reject(new Error('นี่คือหน้าตัวอย่าง — การบันทึกจะทำงานจริงเมื่อติดตั้งบน Google Apps Script'));
      resolve(null);
    }, 90);
  });
};
function startPolling(){ var d = document.getElementById('liveDot'); if (d) d.innerHTML = ''; }
document.getElementById('navFoot').innerHTML =
  'หน้าตัวอย่างแบบอ่านอย่างเดียว<br>ข้อมูลจริงจากชีตเดิม ณ ส.ค. 2569';
boot();
</script>`;

fs.mkdirSync(path.join(ROOT, 'demo'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'demo', 'index.html'), html);
console.log('demo/index.html — ' + Math.round(html.length / 1024) + ' KB, ' + Object.keys(fx).length + ' fixtures');
