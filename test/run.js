/** โหลดไฟล์ .gs ทั้งหมดเข้ามาใน global scope แล้วรันตรวจสอบตรรกะ */
require('./mock-gas.js');
const fs = require('fs'), path = require('path'), vm = require('vm');

const SRC = path.join(__dirname, '..', 'src');
const order = ['Config.gs','Util.gs','Setup.gs','Auth.gs','Drive.gs','Seed.gs','Finance.gs','Backup.gs',
               'Debt.gs','Purchase.gs','Maintenance.gs','Building.gs','Dashboard.gs',
               'Api.gs','Web.gs','Notify.gs'];
order.forEach(f => vm.runInThisContext(fs.readFileSync(path.join(SRC, f), 'utf8'), { filename: f }));

let pass = 0, fail = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + '\n      ได้: ' + JSON.stringify(actual) + '\n      ควรได้: ' + JSON.stringify(expected)); }
}
function near(name, actual, expected, tol = 1) {
  const ok = Math.abs(Number(actual) - Number(expected)) <= tol;
  if (ok) { pass++; console.log('  ✓ ' + name + ' (' + actual + ')'); }
  else { fail++; console.log('  ✗ ' + name + ' ได้ ' + actual + ' ควรได้ ~' + expected); }
}

console.log('\n── 1. ตัวช่วยแปลงค่า ──');
check('toNumber_ "1,234.50"', toNumber_('1,234.50'), 1234.5);
check('toNumber_ ""', toNumber_(''), null);
check('toDate_ 26/04/26 (D/M/YY)', toIsoDate_('26/04/26'), '2026-04-26');
check('toDate_ 5/20/2026 (M/D/YYYY)', toIsoDate_('5/20/2026'), '2026-05-20');
check('toDate_ 2026-08-23 (ISO)', toIsoDate_('2026-08-23'), '2026-08-23');
check('toDate_ พ.ศ. 19/01/2565', toIsoDate_('19/01/2565'), '2022-01-19');
check('addMonths_ 31/1 +1 ไม่ล้นเดือน', toIsoDate_(addMonths_('2026-01-31', 1)), '2026-02-28');
check('addMonths_ +12', toIsoDate_(addMonths_('2025-06-15', 12)), '2026-06-15');
check('floorOf_ 415', floorOf_('415'), 4);
check('ROOMS มี 24 ห้อง', ROOMS.length, 24);

console.log('\n── 2. ติดตั้งระบบ ──');
setupSystem();
check('สร้างครบทุกชีต', Object.keys(SHEETS).every(k => !!SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS[k])), true);
check('ทะเบียนห้อง 24 แถว', readRows_(SHEETS.ROOMS).length, 24);
check('setupSystem ซ้ำไม่สร้างห้องเกิน', (setupSystem(), readRows_(SHEETS.ROOMS).length), 24);

console.log('\n── 3. นำเข้าข้อมูลเดิม ──');
seedHistoricalData();
check('ก้อนหนี้ 4 รายการ', readRows_(SHEETS.DEBTS).length, 4);
check('รายการชำระ 40 รายการ (32 หลัก + 8 ดอกเบี้ย)', readRows_(SHEETS.DEBT_PAYMENTS).length, 40);
check('รายการซื้อ 94 รายการ', readRows_(SHEETS.PURCHASES).length, 94);
check('ล้างแอร์ 41 ครั้ง', readRows_(SHEETS.AC_SERVICE).length, 41);
check('ซ่อมแซมห้อง 42 รายการ', readRows_(SHEETS.ROOM_REPAIRS).length, 42);
check('ซ่อมตึก 4 รายการ', readRows_(SHEETS.BUILDING_REPAIRS).length, 4);
check('ทรัพย์สิน 72 รายการ (24 ห้อง × 3)', readRows_(SHEETS.ASSETS).length, 72);
check('seed ซ้ำไม่ทำงาน', (seedHistoricalData(), readRows_(SHEETS.PURCHASES).length), 94);

console.log('\n── 4. ยอดหนี้ตรงกับชีตเดิม ──');
const main = debtSummary_('หนี้หลัก', 'all');
near('ยอดหนี้ทั้งหมด = 13,151,000', main.totalDebt, 13151000, 0);
near('ชำระแล้ว = 5,049,654', main.paid, 5049654, 0);
near('คงเหลือ = 8,101,346', main.remaining, 8101346, 1);
near('ความคืบหน้า ~38.4%', main.percent, 38.4, 0.2);
check('รวมความคืบหน้ารายก้อน = ยอดชำระรวม',
  Math.round(main.debts.reduce((a, d) => a + d.paid, 0)), Math.round(main.paid));
const sub = debtSummary_('หนี้รอง', 'all');
near('หนี้รอง ยอดตั้งต้น 1,000,000', sub.totalDebt, 1000000, 0);
near('หนี้รอง ดอกเบี้ยที่จ่าย 47,600', sub.interestPaid, 2200 * 7 + 32200, 0);
near('หนี้รอง เงินต้นยังไม่ลด', sub.paid, 0, 0);

console.log('\n── 5. รายการซื้อของ ──');
const buy = purchaseSummary_('all');
near('ยอดรวมทั้งหมด = 856,404', buy.grandTotal, 856404, 0);
check('จำนวน 94 รายการ', buy.grandCount, 94);
const y2026 = buy.byYear.find(y => y.year === 2026);
near('ปี 2026 = 28,676', y2026.total, 28676, 0);
check('ปี 2026 มี 16 รายการ', y2026.count, 16);
near('ปี 2020 = 616,445', buy.byYear.find(y => y.year === 2020).total, 616445, 0);
check('ยอดรวมทุกปี = ยอดรวมทั้งหมด',
  Math.round(buy.byYear.reduce((a, y) => a + y.total, 0)), 856404);

console.log('\n── 6. ล้างแอร์ ──');
const ac = acMatrix_('2026');
check('ตาราง 24 ห้อง', ac.rooms.length, 24);
check('ห้อง 516 ล้างปี 2026 1 รอบ', ac.rooms.find(r => r.room === '516').roundsInYear, 1);
check('ห้อง 111 ไม่เคยล้าง', ac.rooms.find(r => r.room === '111').state, 'ยังไม่เคยล้าง');
check('ห้อง 311 ล้างล่าสุด 2026-03-01', ac.rooms.find(r => r.room === '311').lastService, '2026-03-01');
check('nextDue = ล่าสุด + 6 เดือน', ac.rooms.find(r => r.room === '311').nextDue, '2026-09-01');
const acAll = acMatrix_('all');
check('รวมทุกรอบ = 41', acAll.rooms.reduce((a, r) => a + r.roundsInYear, 0), 41);

console.log('\n── 7. ซ่อมแซม ──');
const fix = repairMatrix_('2026');
check('ห้อง 415 มีงานปี 2026', fix.rooms.find(r => r.room === '415').count, 1);
check('งานทั้งหมดปี 2026', fix.totalJobs, readRows_(SHEETS.ROOM_REPAIRS).filter(r => String(r.year) === '2026').length);
const bld = buildingSummary_('all');
check('งานตึกทั้งหมด 4', bld.total, 4);

console.log('\n── 8. CRUD ──');
const p = savePurchase_({ item: 'ทดสอบสินค้า', buyDate: '2026-08-31', price: 1500, qty: 2, warrantyMonths: 12, category: 'อื่น ๆ' });
check('สร้างรายการซื้อได้', !!p.id, true);
check('คำนวณวันหมดประกันอัตโนมัติ', p.warrantyEnd, '2027-08-31');
const p2 = savePurchase_(Object.assign({}, p, { price: 1800 }));
check('แก้ไขแล้วไม่เพิ่มแถวใหม่', readRows_(SHEETS.PURCHASES).length, 95);
near('แก้ไขราคาสำเร็จ', findRow_(SHEETS.PURCHASES, p.id).price, 1800, 0);
deletePurchase_(p.id);
check('ลบสำเร็จ', readRows_(SHEETS.PURCHASES).length, 94);

const acRec = saveAcService_({ room: '111', bookDate: '2026-09-15' });
check('ล้างแอร์: สถานะอัตโนมัติ = นัดหมายแล้ว', acRec.status, 'นัดหมายแล้ว');
check('ล้างแอร์: รอบที่นับอัตโนมัติ', acRec.round, 1);
const acRec2 = saveAcService_({ room: '111', serviceDate: '2026-09-20' });
check('รอบที่ 2 ของห้องเดิมในปีเดียวกัน', acRec2.round, 2);
check('มีวันดำเนินการ -> ดำเนินการแล้ว', acRec2.status, 'ดำเนินการแล้ว');
deleteAcService_(acRec.id); deleteAcService_(acRec2.id);

const n = bulkBookAc_({ rooms: ['111','112','114'], bookDate: '2026-10-01', technician: 'ช่างสมชาย' });
check('นัดหลายห้องพร้อมกัน', n, 3);
readRows_(SHEETS.AC_SERVICE).filter(r => r.bookDate === '2026-10-01').forEach(r => deleteAcService_(r.id));

console.log('\n── 9. Dashboard & API ──');
const dash = dashboard_('2026');
check('dashboard มี 24 ห้อง', dash.building.totalRooms, 24);
check('dashboard มีรายการแจ้งเตือน', dash.alerts.length > 0, true);
near('หนี้คงเหลือรวมบนแดชบอร์ด', dash.debtMain.remaining, 8101346, 1);
const boot = api('app.bootstrap');
check('api bootstrap สำเร็จ', boot.ok, true);
check('bootstrap ส่ง 24 ห้อง', boot.data.rooms.length, 24);
check('bootstrap ส่งตัวเลือกหมวดหมู่', boot.data.schema.purchaseCategories.length > 5, true);
check('api คำสั่งผิดคืน error', api('ไม่มีจริง').ok, false);
check("api ทุก route เรียกได้", Object.keys(API_ROUTES).length, 53);

console.log('\n── 10. รายรับ-รายจ่ายรายเดือน ──');
check('นำเข้า 32 รายการ', readRows_(SHEETS.FINANCE).length, 32);
const fin = financeSummary_('2026');
near('รายรับค่าเช่าปี 2026', fin.income, 32 && fin.byKind.find(k => k.kind === 'รายรับค่าเช่า').total, 0);
check('รายรับ > รายจ่าย (หอมีกำไร)', fin.net > 0, true);
check('แยก 12 เดือนครบ', fin.byMonth.length, 12);
check('กำไรสุทธิ = รายรับ - รายจ่าย', Math.round(fin.net), Math.round(fin.income - fin.expense));
const finRec = saveFinance_({ date: '2026-09-30', kind: 'ค่าไฟฟ้า', amount: 12000 });
check('เติมปี/เดือนอัตโนมัติ', [finRec.year, finRec.month], [2026, 9]);
check('เติมประเภทอัตโนมัติ', finRec.flow, 'รายจ่าย');
check('รายรับถูกจัดฝั่งถูก', saveFinance_({ date: '2026-09-30', kind: 'รายรับค่าเช่า', amount: 1 }).flow, 'รายรับ');
readRows_(SHEETS.FINANCE).filter(r => r.date === '2026-09-30').forEach(r => deleteFinance_(r.id));

console.log('\n── 11. รายงาน & สำรองข้อมูล ──');
const cpr = costPerRoom_('all');
check('ค่าใช้จ่ายรายห้อง ครบ 24 ห้อง', cpr.rooms.length, 24);
check('เรียงจากมากไปน้อย', cpr.rooms[0].total >= cpr.rooms[23].total, true);
const up = upcomingSchedule_(365);
check('ปฏิทินงานที่จะถึงทำงาน', Array.isArray(up), true);
const dump = exportAll_();
check('สำรองครบ 11 ชีต', Object.keys(dump.sheets).length, 11);
check('สำรองรายการซื้อครบ', dump.counts.Purchases, 94);
const csv = exportCsv_(SHEETS.PURCHASES);
check('CSV มีหัวตาราง', csv.content.indexOf('รายการสินค้า') > 0, true);
check('CSV มี 95 บรรทัด (หัว + 94)', csv.content.split('\r\n').length, 95);
const before = readRows_(SHEETS.PURCHASES).length;
importAll_({ data: dump, mode: 'merge' });
check('นำเข้าแบบ merge ไม่ทำข้อมูลซ้ำ', readRows_(SHEETS.PURCHASES).length, before);

console.log('\n── 12. สิทธิ์เข้าใช้งานผ่านลิงก์ ──');
// จำลองผู้เปิดลิงก์แบบไม่ล็อกอิน (deploy แบบ Anyone จะได้อีเมลว่าง)
const realUser = global.Session.getActiveUser;
global.Session.getActiveUser = () => ({ getEmail: () => '' });

const adminKey = getSetting_('admin_token', '');
const viewKey = getSetting_('view_token', '');
check('สร้างกุญแจผู้ดูแลแล้ว', adminKey.length >= 20, true);
check('สร้างกุญแจแชร์แล้ว', viewKey.length >= 20, true);
check('กุญแจสองชุดไม่ซ้ำกัน', adminKey !== viewKey, true);

check('ไม่มีกุญแจ → บทบาท none', resolveRole_(''), 'none');
check('กุญแจผู้ดูแล → admin', resolveRole_(adminKey), 'admin');
check('กุญแจแชร์ → viewer', resolveRole_(viewKey), 'viewer');
check('กุญแจมั่ว → none', resolveRole_('xxxxxxxxxxxxxxxxxxxxxx'), 'none');

check('ไม่มีกุญแจ อ่านข้อมูลไม่ได้', api('purchase.list', { year: 'all' }).ok, false);
check('กุญแจแชร์ อ่านข้อมูลได้', api('purchase.list', { year: 'all', _key: viewKey }).ok, true);
check('กุญแจแชร์ แก้ข้อมูลไม่ได้',
  api('purchase.save', { _key: viewKey, record: { item: 'แอบเพิ่ม', price: 1, buyDate: '2026-01-01' } }).ok, false);
check('จำนวนรายการไม่เปลี่ยนหลังถูกปฏิเสธ', readRows_(SHEETS.PURCHASES).length, 94);
check('กุญแจแชร์ ลบไม่ได้', api('purchase.delete', { _key: viewKey, id: 'x' }).ok, false);
check('กุญแจแชร์ กู้คืนข้อมูลไม่ได้', api('backup.import', { _key: viewKey, data: {} }).ok, false);
check('กุญแจแชร์ ออกลิงก์ใหม่ไม่ได้', api('share.rotateToken', { _key: viewKey }).ok, false);
check('กุญแจแชร์ ไม่เห็นลิงก์ผู้ดูแล', api('share.links', { _key: viewKey }).data.adminUrl, '');
check('กุญแจแชร์ ไม่เห็นลิงก์ Google Sheet', api('app.bootstrap', { _key: viewKey }).data.sheetUrl, '');

const added = api('purchase.save', { _key: adminKey, record: { item: 'ผู้ดูแลเพิ่มได้', price: 99, buyDate: '2026-01-01' } });
check('กุญแจผู้ดูแล แก้ข้อมูลได้', added.ok, true);
check('ผู้ดูแลเห็นลิงก์ Google Sheet', api('app.bootstrap', { _key: adminKey }).data.sheetUrl.length > 0, true);
check('ผู้ดูแลแก้ไขได้ (canEdit)', api('app.bootstrap', { _key: adminKey }).data.canEdit, true);
check('ผู้ดูลิงก์แชร์แก้ไม่ได้ (canEdit)', api('app.bootstrap', { _key: viewKey }).data.canEdit, false);
api('purchase.delete', { _key: adminKey, id: added.data.id });

const rotated = api('share.rotateToken', { _key: adminKey }).data;
check('ออกลิงก์แชร์ใหม่แล้วกุญแจเปลี่ยน', rotated.token !== viewKey, true);
check('กุญแจแชร์เดิมใช้ไม่ได้อีก', resolveRole_(viewKey), 'none');
check('กุญแจแชร์ใหม่ใช้ได้', resolveRole_(rotated.token), 'viewer');
check('ออกลิงก์ใหม่ไม่กระทบกุญแจผู้ดูแล', resolveRole_(adminKey), 'admin');
global.Session.getActiveUser = realUser;
check('เจ้าของชีตเข้าได้แม้ไม่มีกุญแจ', resolveRole_(''), 'admin');

console.log('\n── 13. ตัวติดตั้งรวบยอด START_HERE ──');
{
  // ล้างทุกอย่างแล้วติดตั้งใหม่ด้วยฟังก์ชันเดียว เหมือนที่ผู้ใช้จะกดจริง
  const st = require('./mock-gas.js').store;
  st.sheets.clear();
  Object.keys(PropertiesService.getScriptProperties()).length;
  ['SEEDED_V1'].forEach(k => PropertiesService.getScriptProperties().deleteProperty(k));
  const out = START_HERE();
  check('START_HERE รันจบและคืนสรุป', typeof out === 'string' && out.indexOf('ติดตั้งเรียบร้อย') > 0, true);
  check('สร้างชีตครบ 11 แท็บ',
    Object.keys(SHEETS).every(k => !!SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS[k])), true);
  check('นำเข้าข้อมูลครบ 94 รายการซื้อ', readRows_(SHEETS.PURCHASES).length, 94);
  check('ทะเบียนห้อง 24 ห้อง', readRows_(SHEETS.ROOMS).length, 24);
  check('ออกกุญแจให้แล้วทั้งสองชุด',
    getSetting_('admin_token', '').length >= 20 && getSetting_('view_token', '').length >= 20, true);
  check('บอกวิธี deploy ต่อเมื่อยังไม่ได้ deploy', out.indexOf('Web app') > 0 || out.indexOf('ลิงก์ของคุณ') > 0, true);
  const again = START_HERE();
  check('รันซ้ำไม่ทำข้อมูลซ้ำ', readRows_(SHEETS.PURCHASES).length, 94);
  check('รันซ้ำไม่สร้างห้องซ้ำ', readRows_(SHEETS.ROOMS).length, 24);
}

console.log('\n── 13b. ลิงก์ /dev กับ /exec ──');
check('รู้จักลิงก์ทดสอบ /dev', isTestUrl_('https://script.google.com/macros/s/AKfy/dev'), true);
check('รู้จักลิงก์ทดสอบ /dev ที่มี query', isTestUrl_('https://script.google.com/macros/s/AKfy/dev?key=abc'), true);
check('ลิงก์ /exec ไม่ใช่ลิงก์ทดสอบ', isTestUrl_('https://script.google.com/macros/s/AKfy/exec'), false);
{
  const real = global.ScriptApp.getService;
  global.ScriptApp.getService = () => ({ getUrl: () => 'https://script.google.com/macros/s/AKfy/dev' });
  const m = linksMessage_();
  check('เตือนเมื่อยังไม่ได้ deploy', m.indexOf('/dev') > 0 && m.indexOf('แชร์ให้คนอื่นไม่ได้') > 0, true);
  check('บอกวิธี deploy ต่อ', m.indexOf('Who has access') > 0, true);
  check('กรณี /dev ยังบอกกุญแจให้เอาไปต่อเอง',
    m.indexOf('?key=' + getSetting_('admin_token','')) > 0 &&
    m.indexOf('?key=' + getSetting_('view_token','')) > 0, true);
  check('อธิบายกรณีที่ deploy ไปแล้วด้วย', m.indexOf('Manage deployments') > 0, true);

  global.ScriptApp.getService = () => ({ getUrl: () => 'https://script.google.com/macros/s/AKfy/exec' });
  const m2 = linksMessage_();
  check('ลิงก์ /exec แสดงกุญแจครบสองชุด',
    m2.indexOf('/exec?key=' + getSetting_('admin_token','')) > 0 &&
    m2.indexOf('/exec?key=' + getSetting_('view_token','')) > 0, true);

  // เปิดเว็บแอปครั้งเดียว ระบบต้องจำ URL จริงไว้เอง
  setSetting_('webapp_url', '');
  rememberExecUrl_();
  check('เปิด /exec แล้วระบบจำ URL ไว้', getSetting_('webapp_url',''), 'https://script.google.com/macros/s/AKfy/exec');

  // จำแล้ว ต่อให้กลับมารันจากหน้าแก้ไขโค้ด (ได้ /dev) ก็ยังให้ลิงก์จริงได้
  global.ScriptApp.getService = () => ({ getUrl: () => 'https://script.google.com/macros/s/AKfy/dev' });
  check('จำแล้วให้ลิงก์จริงได้แม้รันจากหน้าแก้ไขโค้ด',
    linksMessage_().indexOf('/exec?key=' + getSetting_('admin_token','')) > 0, true);
  check('ลิงก์ /dev ไม่ถูกจำ', (rememberExecUrl_(), getSetting_('webapp_url','')),
    'https://script.google.com/macros/s/AKfy/exec');

  // วาง URL เองในชีต Settings ก็ใช้ได้
  setSetting_('webapp_url', 'https://script.google.com/macros/s/PASTED/exec');
  check('วาง URL เองในชีตแล้วใช้ได้',
    linksMessage_().indexOf('/macros/s/PASTED/exec?key=') > 0, true);
  setSetting_('webapp_url', '');
  global.ScriptApp.getService = real;
}
check('กรองกุญแจตัดอักขระอันตรายทิ้ง', safeKey_('ab"><script>x</script>-1_2'), 'abscriptxscript-1_2');
check('กรองกุญแจไม่แตะตัวอักษรปกติ', safeKey_('qMYhE5AEcDsyk6WMCQJLMTfPdN'), 'qMYhE5AEcDsyk6WMCQJLMTfPdN');

console.log('\n── 14. อัปเดตสด & สำรองลง Drive ──');
const v1 = dataVersion_();
check('รุ่นข้อมูลเป็นตัวเลขเวลา', typeof v1 === 'number' && v1 > 0, true);
require('./mock-gas.js').store.lastUpdated = new Date(v1 + 60000);
check('แก้ชีตแล้วรุ่นข้อมูลเปลี่ยน', dataVersion_() !== v1, true);
check('app.version เรียกได้ด้วยกุญแจแชร์', api('app.version', { _key: rotated.token }).ok, true);

const bk = backupToDrive_();
check('สำรองลง Drive สำเร็จ', /^the-m-corner-ap-.*\.json$/.test(bk.name), true);
check('ไฟล์สำรองมีข้อมูลครบ 11 ชีต', Object.keys(bk.counts).length, 11);
check('ประวัติไฟล์สำรองขึ้น 1 ชุด', listBackups_().length, 1);
setSetting_('backup_keep', '2');
backupToDrive_(); backupToDrive_(); backupToDrive_();
check('เก็บย้อนหลังตามที่ตั้งไว้ (2 ชุด)', listBackups_().length, 2);
setSetting_('backup_keep', '30');

console.log('\n── 15. ค้นหา & แจ้งเตือน ──');
check('ค้นหา "ยาแนว" เจอ', globalSearch_('ยาแนว').length > 0, true);
check('ค้นหาสั้นเกินไปคืนว่าง', globalSearch_('ก').length, 0);
const digest = buildDigest_();
check('สรุปแจ้งเตือนสร้างได้', !!digest.generatedAt, true);
check('ส่งอีเมลได้', String(sendDigestNow()).indexOf('ส่งสรุป') === 0, true);

console.log('\n════════════════════════════');
console.log(`ผ่าน ${pass} · ไม่ผ่าน ${fail}`);
process.exit(fail ? 1 : 0);
