/**
 * upgrade.js — ซ้อมอัปเกรดระบบที่ "มีข้อมูลอยู่แล้ว" ขึ้นโครงรุ่นใหม่
 *
 * test/run.js ทดสอบระบบที่ติดตั้งใหม่ตั้งแต่ต้น แต่ของจริงคือระบบที่ใช้งานอยู่
 * มีข้อมูลเต็มชีตและอยู่ที่โครงรุ่นเก่า ไฟล์นี้จึงจำลองสถานการณ์นั้น:
 *
 *   1. สร้างชีตด้วยหัวตารางของโครงรุ่นปัจจุบัน แล้วเติมข้อมูลจากตัวติดตั้งจริง
 *   2. ตั้งรุ่นโครงข้อมูลย้อนกลับไปรุ่นเก่า
 *   3. รัน setupSystem() ด้วยโค้ดชุดใหม่ เหมือนที่ผู้ใช้กด START_HERE
 *   4. ตรวจว่า "ยอดเงินทุกตัวต้องไม่ขยับแม้แต่บาทเดียว" และของใหม่ต้องมาครบ
 *
 * เคยเกิดขึ้นจริงมาแล้วที่การอัปเดตโค้ดทำให้คอลัมน์เลื่อนจนยอดกลายเป็น 0
 * ไฟล์นี้มีไว้ไม่ให้เกิดซ้ำ
 */
require('./mock-gas.js');
const fs = require('fs'), path = require('path'), vm = require('vm');

const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
const check = (name, ok, extra) => {
  if (ok) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra !== undefined ? '  → ' + extra : '')); }
};

// ใช้ไฟล์ที่ผู้ใช้จะเอาไปวางจริง ไม่ใช่ซอร์สแยกไฟล์ — จะได้ทดสอบตัวเดียวกับที่ส่งมอบ
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'build', 'Code.gs'), 'utf8'), { filename: 'Code.gs' });

/* ---------- 1. สร้างระบบ "รุ่นเก่าที่มีข้อมูลแล้ว" ---------- */
QUIET_ = true;
setupSystem();
seedHistoricalData();

// สมมติผู้ใช้ลบงานซ่อมตึกไปหนึ่งรายการ — ของที่ลบต้องไม่กลับมาหลังอัปเกรด
const someBuilding = readRows_(SHEETS.BUILDING_REPAIRS)[0];
deleteBuildingRepair_(someBuilding.id);

// ถอยรุ่นโครงข้อมูลกลับไปก่อนมีระบบผู้ใช้ แล้วลบชีตใหม่ทิ้ง
// ให้เหมือนระบบที่ติดตั้งไว้ด้วยโค้ดรุ่นก่อนหน้าเป๊ะ ๆ
const ss = SpreadsheetApp.getActiveSpreadsheet();
[SHEETS.USERS, SHEETS.SESSIONS].forEach(n => {
  const sh = ss.getSheetByName(n);
  if (sh && ss.deleteSheet) ss.deleteSheet(sh);
});
props_().setProperty('SCHEMA_VERSION', '3');
props_().deleteProperty('FIRST_ADMIN_PASSWORD');

/* ---------- 2. จดยอดทุกตัวไว้ก่อน ---------- */
const snapshot = () => ({
  mainPaid: Math.round(debtSummary_('หนี้หลัก', 'all').paid),
  mainRemain: Math.round(debtSummary_('หนี้หลัก', 'all').remaining),
  subPaid: Math.round(debtSummary_('หนี้รอง', 'all').paid),
  subRemain: Math.round(debtSummary_('หนี้รอง', 'all').remaining),
  purchases: readRows_(SHEETS.PURCHASES).length,
  spend: Math.round(purchaseSummary_('all').grandTotal),
  rooms: readRows_(SHEETS.ROOMS).length,
  ac: readRows_(SHEETS.AC_SERVICE).length,
  repairs: readRows_(SHEETS.ROOM_REPAIRS).length,
  building: readRows_(SHEETS.BUILDING_REPAIRS).length,
  assets: readRows_(SHEETS.ASSETS).length,
  finance: readRows_(SHEETS.FINANCE).length,
  income: Math.round(financeSummary_('all').income),
  expense: Math.round(financeSummary_('all').expense)
});

const before = snapshot();
const tokenBefore = getSetting_('admin_token', '');
const viewBefore = getSetting_('view_token', '');
setSetting_('ac_cycle_months', '4');            // ค่าที่ผู้ใช้เคยปรับเอง ต้องไม่ถูกทับ

console.log('\n── ยอดก่อนอัปเกรด ──');
console.log('  หนี้หลัก ชำระแล้ว ' + before.mainPaid.toLocaleString() +
            ' · คงเหลือ ' + before.mainRemain.toLocaleString());
console.log('  ซื้อของ ' + before.purchases + ' รายการ รวม ' + before.spend.toLocaleString());
console.log('  รายรับ ' + before.income.toLocaleString() + ' · รายจ่าย ' + before.expense.toLocaleString());

/* ---------- 3. อัปเกรด ---------- */
setupSystem();

/* ---------- 4. ตรวจ ---------- */
console.log('\n── ข้อมูลเดิมต้องอยู่ครบ ยอดต้องไม่ขยับ ──');
const after = snapshot();
[
  ['หนี้หลัก ยอดชำระแล้ว', 'mainPaid'], ['หนี้หลัก ยอดคงเหลือ', 'mainRemain'],
  ['หนี้รอง ยอดชำระแล้ว', 'subPaid'], ['หนี้รอง ยอดคงเหลือ', 'subRemain'],
  ['จำนวนรายการซื้อของ', 'purchases'], ['ค่าซื้อของรวม', 'spend'],
  ['ทะเบียนห้อง', 'rooms'], ['ล้างแอร์', 'ac'], ['งานซ่อมห้อง', 'repairs'],
  ['ทรัพย์สินประจำห้อง', 'assets'], ['รายการรายรับ-รายจ่าย', 'finance'],
  ['ยอดรายรับรวม', 'income'], ['ยอดรายจ่ายรวม', 'expense']
].forEach(([label, k]) =>
  check(label + ' ไม่เปลี่ยน', after[k] === before[k], before[k] + ' → ' + after[k]));
check('รายการที่ลบไปแล้วไม่กลับมา', after.building === before.building, before.building + ' → ' + after.building);

console.log('\n── ของใหม่ต้องมาครบ โดยไม่ทับของเดิม ──');
check('สร้างชีต Users', !!ss.getSheetByName(SHEETS.USERS));
check('สร้างชีต Sessions', !!ss.getSheetByName(SHEETS.SESSIONS));
check('มีบัญชีผู้ดูแลคนแรก', !!findUser_('admin'));
check('มีรหัสผ่านให้แสดงครั้งเดียว', !!props_().getProperty('FIRST_ADMIN_PASSWORD'));
check('กุญแจกู้ระบบเดิมไม่ถูกออกใหม่', getSetting_('admin_token', '') === tokenBefore);
check('กุญแจแชร์เดิมไม่ถูกออกใหม่', getSetting_('view_token', '') === viewBefore);
check('เติมค่าตั้งค่าใหม่ให้', getSetting_('theme', '') === 'ตามเครื่อง' && getSetting_('ocr_enabled', '') === 'เปิด');
check('ลิงก์แชร์แบบไม่ต้องล็อกอินปิดไว้ก่อน', getSetting_('share_link_enabled', '') === 'ปิด');
check('ค่าที่ผู้ใช้เคยปรับเองไม่ถูกทับ', getSetting_('ac_cycle_months', '') === '4');

console.log('\n── ใช้งานต่อได้ทันทีด้วยบัญชีที่เพิ่งสร้าง ──');
const pw = props_().getProperty('FIRST_ADMIN_PASSWORD');
const realUser = global.Session.getActiveUser;
global.Session.getActiveUser = () => ({ getEmail: () => '' });   // ไม่ใช่เจ้าของชีต ต้องล็อกอินจริง
let ses = null;
try { ses = login_('admin', pw); check('ล็อกอินด้วยรหัสที่ระบบให้มา', true); }
catch (e) { check('ล็อกอินด้วยรหัสที่ระบบให้มา', false, e.message); }
if (ses) {
  check('ครั้งแรกถูกบังคับให้ตั้งรหัสผ่านเอง', ses.mustChange === true);
  check('เห็นรายการซื้อของครบ',
    api('purchase.list', { _session: ses.session, year: 'all' }).data.length === before.purchases);
  const dash = api('app.dashboard', { _session: ses.session, year: 'all' });
  check('แดชบอร์ดโหลดได้', dash.ok, dash.error);
  check('ยอดบนแดชบอร์ดตรงกับก่อนอัปเกรด', Math.round(dash.data.debtMain.paid) === before.mainPaid);
  check('หน้าตั้งค่าโหลดได้', api('settings.list', { _session: ses.session }).ok);
  const pin = api('auth.setPin', { _session: ses.session, pin: '481502', device: 'มือถือ' });
  check('ตั้ง PIN ได้', pin.ok, pin.error);
  if (pin.ok) check('ปลดล็อกด้วย PIN ได้', api('auth.unlock', { device: pin.data.device, pin: '481502' }).ok);
  check('เปลี่ยนรหัสผ่านเองได้',
    api('auth.changePassword', { _session: ses.session, oldPassword: pw, newPassword: 'MCorner2569!' }).ok);
  check('รหัสใหม่ใช้ล็อกอินได้',
    (() => { try { return !!login_('admin', 'MCorner2569!').session; } catch (e) { return false; } })());
}
global.Session.getActiveUser = realUser;

console.log('\n── กดติดตั้งซ้ำต้องไม่พัง ──');
setupSystem();
check('ยอดยังเท่าเดิมทุกตัว', JSON.stringify(snapshot()) === JSON.stringify(after));
check('ไม่สร้างบัญชี admin ซ้ำ', readRows_(SHEETS.USERS).length === 1, readRows_(SHEETS.USERS).length);

console.log('\n════════════════════════════');
console.log('ผ่าน ' + pass + ' · ไม่ผ่าน ' + fail);
process.exit(fail ? 1 : 0);
