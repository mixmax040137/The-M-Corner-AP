/**
 * The M Corner AP — ระบบบริหารหอพัก (ไฟล์เดียวจบ)
 * ไฟล์นี้สร้างอัตโนมัติจากโฟลเดอร์ src/ เมื่อ 2026-08-31 17:17 UTC
 *
 * ⚠️ อย่าแก้ไฟล์นี้โดยตรง — แก้ที่ src/ แล้วรัน  node build/bundle.js
 *
 * ประกอบด้วย: Config.gs, Util.gs, Setup.gs, Auth.gs, Drive.gs, Seed.gs, Finance.gs, Migrate.gs, Backup.gs, Debt.gs, Purchase.gs, Maintenance.gs, Building.gs, Dashboard.gs, Api.gs, Notify.gs, Web.gs
 */


/* ══════════════════════════════════════════════════════════════
   Config.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * The M Corner AP — ระบบบริหารหอพัก
 * Config.gs — ค่าคงที่ / โครงสร้างตารางทั้งหมดของระบบ
 *
 * ทุกอย่างที่ต้องแก้เพื่อปรับระบบให้เข้ากับหอพัก อยู่ในไฟล์นี้ไฟล์เดียว
 */

var APP = {
  NAME: 'The M Corner AP',
  SUBTITLE: 'ระบบบริหารหอพัก',
  VERSION: '1.0.0',
  TIMEZONE: 'Asia/Bangkok',
  CURRENCY: 'THB'
};

/** ชื่อ Property ที่เก็บใน Script Properties (ตั้งค่าครั้งเดียวตอนติดตั้ง) */
var PROP = {
  SPREADSHEET_ID: 'SPREADSHEET_ID',   // ไอดีของ Google Sheet ที่ใช้เก็บข้อมูล
  DRIVE_FOLDER_ID: 'DRIVE_FOLDER_ID', // โฟลเดอร์หลักเก็บรูป/สลิป
  ALLOWED_EMAILS: 'ALLOWED_EMAILS',   // อีเมลที่เข้าใช้ได้ คั่นด้วย , (ว่าง = เจ้าของคนเดียว)
  NOTIFY_EMAIL: 'NOTIFY_EMAIL',       // อีเมลรับการแจ้งเตือน
  LINE_TOKEN: 'LINE_TOKEN'            // LINE Messaging API token (ถ้ามี)
};

/** 24 ห้องของหอพัก จัดกลุ่มตามชั้น */
var FLOORS = [
  { floor: 1, rooms: ['111', '112', '114', '115'] },
  { floor: 2, rooms: ['211', '212', '214', '215', '216'] },
  { floor: 3, rooms: ['311', '312', '314', '315', '316'] },
  { floor: 4, rooms: ['411', '412', '414', '415', '416'] },
  { floor: 5, rooms: ['511', '512', '514', '515', '516'] }
];

/** รายชื่อห้องแบบแบน ['111','112',...] — 24 ห้อง */
var ROOMS = FLOORS.reduce(function (acc, f) { return acc.concat(f.rooms); }, []);

/** ชื่อชีต (แท็บ) ทั้งหมดที่ระบบสร้างและใช้งาน */
var SHEETS = {
  DEBTS: 'Debts',                     // ก้อนหนี้ (หลัก/รอง)
  DEBT_PAYMENTS: 'DebtPayments',      // รายการโอนใช้หนี้
  PURCHASES: 'Purchases',             // รายการซื้อของ
  ROOMS: 'Rooms',                     // ทะเบียนห้อง
  AC_SERVICE: 'AcService',            // ล้างแอร์
  ROOM_REPAIRS: 'RoomRepairs',        // แจ้งซ่อมตามห้อง
  BUILDING_REPAIRS: 'BuildingRepairs',// ซ่อมแซมตึกโดยรวม
  ASSETS: 'RoomAssets',               // ทรัพย์สินประจำห้อง
  FINANCE: 'Finance',                 // รายรับ-รายจ่ายประจำเดือนของหอ
  SETTINGS: 'Settings',               // ค่าตั้งต้น / ข้อมูลอาคาร
  LOG: 'ActivityLog'                  // ประวัติการแก้ไข
};

/**
 * โครงสร้างคอลัมน์ของแต่ละชีต
 * key   = ชื่อฟิลด์ที่ใช้ในโค้ด (อังกฤษ)
 * label = หัวตารางภาษาไทยที่แสดงในชีต
 * type  = text | number | money | date | select | multiline | files | bool
 */
var SCHEMA = {};

SCHEMA[SHEETS.DEBTS] = [
  { key: 'id',        label: 'รหัส',            type: 'text' },
  { key: 'ledger',    label: 'ประเภทบัญชี',      type: 'select', options: ['หนี้หลัก', 'หนี้รอง'] },
  { key: 'title',     label: 'รายการหนี้',       type: 'text' },
  { key: 'parentId',  label: 'เป็นส่วนหนึ่งของ',  type: 'text' },
  { key: 'creditor',  label: 'เจ้าหนี้',         type: 'text' },
  { key: 'startDate', label: 'วันที่ก่อหนี้',     type: 'date' },
  { key: 'principal', label: 'ยอดหนี้ตั้งต้น',   type: 'money' },
  { key: 'interestPerMonth', label: 'ดอกเบี้ย/เดือน', type: 'money' },
  { key: 'dueDay',    label: 'กำหนดชำระ (วันที่)', type: 'number' },
  { key: 'planPerMonth', label: 'ยอดผ่อนต่อเดือน', type: 'money' },
  { key: 'status',    label: 'สถานะ',           type: 'select', options: ['กำลังผ่อน', 'ปิดหนี้แล้ว', 'พักชำระ'] },
  { key: 'note',      label: 'หมายเหตุ',        type: 'multiline' },
  { key: 'updatedAt', label: 'แก้ไขล่าสุด',      type: 'date' }
];

SCHEMA[SHEETS.DEBT_PAYMENTS] = [
  { key: 'id',       label: 'รหัส',          type: 'text' },
  { key: 'debtId',   label: 'รหัสหนี้',       type: 'text' },
  { key: 'ledger',   label: 'ประเภทบัญชี',    type: 'select', options: ['หนี้หลัก', 'หนี้รอง'] },
  { key: 'payDate',  label: 'วันที่ชำระ',      type: 'date' },
  { key: 'year',     label: 'ปี (ค.ศ.)',      type: 'number' },
  { key: 'installment', label: 'งวดที่',      type: 'text' },
  { key: 'principal', label: 'เงินต้น',       type: 'money' },
  { key: 'interest', label: 'ดอกเบี้ย',       type: 'money' },
  { key: 'amount',   label: 'รวมที่โอน',      type: 'money' },
  { key: 'channel',  label: 'ช่องทาง',        type: 'select', options: ['โอน QR', 'โอนธนาคาร', 'เงินสด', 'บัตรเครดิต', 'อื่น ๆ'] },
  { key: 'payer',    label: 'ผู้ชำระ',        type: 'text' },
  { key: 'slips',    label: 'สลิปการโอน',     type: 'files' },
  { key: 'note',     label: 'หมายเหตุ',       type: 'multiline' },
  { key: 'updatedAt', label: 'แก้ไขล่าสุด',   type: 'date' }
];

SCHEMA[SHEETS.PURCHASES] = [
  { key: 'id',          label: 'รหัส',            type: 'text' },
  { key: 'buyDate',     label: 'วันที่ซื้อ',        type: 'date' },
  { key: 'year',        label: 'ปี (ค.ศ.)',        type: 'number' },
  { key: 'item',        label: 'รายการสินค้า',     type: 'multiline' },
  { key: 'category',    label: 'หมวดหมู่',         type: 'select', options: [
      'เครื่องใช้ไฟฟ้า', 'เฟอร์นิเจอร์', 'วัสดุก่อสร้าง', 'อุปกรณ์ช่าง',
      'ระบบไฟฟ้า/แสงสว่าง', 'ระบบน้ำ/สุขภัณฑ์', 'CCTV/ระบบความปลอดภัย',
      'IT/เครือข่าย', 'ค่าบริการ/ค่าธรรมเนียม', 'อื่น ๆ'] },
  { key: 'qty',         label: 'จำนวน',           type: 'number' },
  { key: 'unit',        label: 'หน่วย',           type: 'text' },
  { key: 'price',       label: 'ราคารวม',         type: 'money' },
  { key: 'vendor',      label: 'แหล่งที่ซื้อ',      type: 'text' },
  { key: 'payer',       label: 'ผู้ชำระ',          type: 'text' },
  { key: 'warrantyMonths', label: 'ประกัน (เดือน)', type: 'number' },
  { key: 'warrantyEnd', label: 'ประกันหมดอายุ',   type: 'date' },
  { key: 'room',        label: 'ห้อง/พื้นที่',      type: 'text' },
  { key: 'photos',      label: 'ภาพประกอบ',       type: 'files' },
  { key: 'slips',       label: 'สลิปการโอน',      type: 'files' },
  { key: 'note',        label: 'หมายเหตุ',        type: 'multiline' },
  { key: 'updatedAt',   label: 'แก้ไขล่าสุด',      type: 'date' }
];

SCHEMA[SHEETS.ROOMS] = [
  { key: 'room',     label: 'ห้อง',        type: 'text' },
  { key: 'floor',    label: 'ชั้น',        type: 'number' },
  { key: 'status',   label: 'สถานะ',      type: 'select', options: ['มีผู้เช่า', 'ว่าง', 'ปิดปรับปรุง'] },
  { key: 'tenant',   label: 'ชื่อผู้เช่า',  type: 'text' },
  { key: 'phone',    label: 'เบอร์ติดต่อ',  type: 'text' },
  { key: 'rent',     label: 'ค่าเช่า/เดือน', type: 'money' },
  { key: 'moveIn',   label: 'วันที่เข้าอยู่', type: 'date' },
  { key: 'note',     label: 'หมายเหตุ',    type: 'multiline' },
  { key: 'updatedAt', label: 'แก้ไขล่าสุด', type: 'date' }
];

SCHEMA[SHEETS.AC_SERVICE] = [
  { key: 'id',          label: 'รหัส',           type: 'text' },
  { key: 'room',        label: 'ห้อง',           type: 'select', options: ROOMS },
  { key: 'year',        label: 'ปี (ค.ศ.)',       type: 'number' },
  { key: 'round',       label: 'รอบที่',          type: 'number' },
  { key: 'bookDate',    label: 'วันที่นัดล้างแอร์', type: 'date' },
  { key: 'serviceDate', label: 'วันที่ดำเนินการ',  type: 'date' },
  { key: 'status',      label: 'สถานะ',          type: 'select', options: ['นัดหมายแล้ว', 'ดำเนินการแล้ว', 'เลื่อนนัด', 'ยกเลิก'] },
  { key: 'technician',  label: 'ช่าง/ผู้ให้บริการ', type: 'text' },
  { key: 'cost',        label: 'ค่าใช้จ่าย',      type: 'money' },
  { key: 'photos',      label: 'ภาพประกอบ',      type: 'files' },
  { key: 'note',        label: 'หมายเหตุ',       type: 'multiline' },
  { key: 'updatedAt',   label: 'แก้ไขล่าสุด',     type: 'date' }
];

SCHEMA[SHEETS.ROOM_REPAIRS] = [
  { key: 'id',          label: 'รหัส',            type: 'text' },
  { key: 'room',        label: 'ห้อง',            type: 'select', options: ROOMS },
  { key: 'year',        label: 'ปี (ค.ศ.)',        type: 'number' },
  { key: 'reportDate',  label: 'วันที่แจ้ง',       type: 'date' },
  { key: 'bookDate',    label: 'วันนัดซ่อมแซม',    type: 'date' },
  { key: 'repairDate',  label: 'วันเข้าซ่อมแซม',   type: 'date' },
  { key: 'category',    label: 'ประเภทงาน',       type: 'select', options: [
      'ระบบน้ำ/สุขภัณฑ์', 'ระบบไฟฟ้า', 'แอร์', 'เครื่องทำน้ำอุ่น', 'ตู้เย็น',
      'ประตู/หน้าต่าง/กุญแจ', 'สี/ผนัง/ฝ้า', 'เฟอร์นิเจอร์', 'ทำความสะอาด', 'อื่น ๆ'] },
  { key: 'items',       label: 'รายการที่ต้องซ่อมแซม', type: 'multiline' },
  { key: 'priority',    label: 'ความเร่งด่วน',     type: 'select', options: ['ปกติ', 'ด่วน', 'ด่วนมาก'] },
  { key: 'status',      label: 'สถานะ',           type: 'select', options: ['รอดำเนินการ', 'นัดหมายแล้ว', 'กำลังซ่อม', 'เสร็จสิ้น', 'ยกเลิก'] },
  { key: 'technician',  label: 'ช่างผู้ซ่อม',      type: 'text' },
  { key: 'cost',        label: 'ค่าใช้จ่าย',       type: 'money' },
  { key: 'photosBefore', label: 'ภาพก่อนซ่อม',    type: 'files' },
  { key: 'photosAfter', label: 'ภาพหลังซ่อม',     type: 'files' },
  { key: 'note',        label: 'หมายเหตุ',        type: 'multiline' },
  { key: 'updatedAt',   label: 'แก้ไขล่าสุด',      type: 'date' }
];

SCHEMA[SHEETS.BUILDING_REPAIRS] = [
  { key: 'id',          label: 'รหัส',           type: 'text' },
  { key: 'year',        label: 'ปี (ค.ศ.)',       type: 'number' },
  { key: 'zone',        label: 'ส่วนของอาคาร',    type: 'select', options: [
      'ดาดฟ้า/กันซึม', 'โครงสร้าง/ผนังภายนอก', 'ระบบน้ำประปา', 'ท่อน้ำเสีย/ท่อระบายน้ำ',
      'ปั๊มน้ำ/ถังเก็บน้ำ', 'ระบบไฟฟ้าส่วนกลาง', 'ลิฟต์', 'บันได/ทางหนีไฟ',
      'โถงทางเดิน/พื้นที่ส่วนกลาง', 'CCTV/คีย์การ์ด', 'ที่จอดรถ', 'รั้ว/ประตูรั้ว',
      'สวน/ภูมิทัศน์', 'กำจัดปลวก/แมลง', 'อื่น ๆ'] },
  { key: 'title',       label: 'รายการซ่อมแซม',   type: 'multiline' },
  { key: 'bookDate',    label: 'วันที่นัด',        type: 'date' },
  { key: 'startDate',   label: 'วันที่เริ่มดำเนินการ', type: 'date' },
  { key: 'endDate',     label: 'วันที่แล้วเสร็จ',   type: 'date' },
  { key: 'status',      label: 'สถานะ',          type: 'select', options: ['รอดำเนินการ', 'นัดหมายแล้ว', 'กำลังดำเนินการ', 'เสร็จสิ้น', 'ยกเลิก'] },
  { key: 'contractor',  label: 'ผู้รับเหมา/ร้าน',  type: 'text' },
  { key: 'cost',        label: 'ค่าใช้จ่าย',      type: 'money' },
  { key: 'nextDue',     label: 'ครบกำหนดรอบถัดไป', type: 'date' },
  { key: 'photos',      label: 'ภาพประกอบ',      type: 'files' },
  { key: 'slips',       label: 'ใบเสร็จ/สลิป',    type: 'files' },
  { key: 'note',        label: 'หมายเหตุ',       type: 'multiline' },
  { key: 'updatedAt',   label: 'แก้ไขล่าสุด',     type: 'date' }
];

SCHEMA[SHEETS.ASSETS] = [
  { key: 'id',         label: 'รหัส',           type: 'text' },
  { key: 'room',       label: 'ห้อง',           type: 'text' },
  { key: 'name',       label: 'ทรัพย์สิน',       type: 'text' },
  { key: 'brand',      label: 'ยี่ห้อ/รุ่น',      type: 'text' },
  { key: 'serial',     label: 'Serial No.',     type: 'text' },
  { key: 'installDate', label: 'วันที่ติดตั้ง',   type: 'date' },
  { key: 'purchaseId', label: 'อ้างอิงรายการซื้อ', type: 'text' },
  { key: 'warrantyEnd', label: 'ประกันหมดอายุ',  type: 'date' },
  { key: 'status',     label: 'สถานะ',          type: 'select', options: ['ใช้งานปกติ', 'ต้องซ่อม', 'ปลดระวาง'] },
  { key: 'note',       label: 'หมายเหตุ',       type: 'multiline' },
  { key: 'updatedAt',  label: 'แก้ไขล่าสุด',     type: 'date' }
];

SCHEMA[SHEETS.FINANCE] = [
  { key: 'id',       label: 'รหัส',           type: 'text' },
  { key: 'date',     label: 'วันที่',          type: 'date' },
  { key: 'year',     label: 'ปี (ค.ศ.)',       type: 'number' },
  { key: 'month',    label: 'เดือน',          type: 'number' },
  { key: 'flow',     label: 'ประเภท',         type: 'select', options: ['รายรับ', 'รายจ่าย'] },
  { key: 'kind',     label: 'รายการ',         type: 'select', options: [
      'รายรับค่าเช่า', 'รายรับอื่น ๆ',
      'ค่าไฟฟ้า', 'ค่าน้ำประปา', 'ค่าอินเทอร์เน็ต', 'ค่าเก็บขยะ',
      'ภาษีที่ดินและสิ่งปลูกสร้าง', 'ค่าประกันภัยอาคาร', 'ใบอนุญาต/ค่าธรรมเนียม',
      'ค่าระบบบริหารหอพัก', 'เงินเดือน/ค่าแรง', 'ค่าใช้จ่ายอื่น ๆ'] },
  { key: 'amount',   label: 'จำนวนเงิน',      type: 'money' },
  { key: 'billMonth', label: 'รอบบิลเดือน',    type: 'text' },
  { key: 'channel',  label: 'ช่องทาง',        type: 'select', options: ['โอน QR', 'โอนธนาคาร', 'เงินสด', 'บัตรเครดิต', 'หักบัญชีอัตโนมัติ', 'อื่น ๆ'] },
  { key: 'slips',    label: 'สลิป/ใบเสร็จ',    type: 'files' },
  { key: 'note',     label: 'หมายเหตุ',       type: 'multiline' },
  { key: 'updatedAt', label: 'แก้ไขล่าสุด',    type: 'date' }
];

SCHEMA[SHEETS.SETTINGS] = [
  { key: 'key',   label: 'คีย์',      type: 'text' },
  { key: 'label', label: 'รายการ',    type: 'text' },
  { key: 'value', label: 'ค่า',       type: 'text' },
  { key: 'note',  label: 'หมายเหตุ',  type: 'multiline' }
];

SCHEMA[SHEETS.LOG] = [
  { key: 'at',     label: 'เวลา',      type: 'date' },
  { key: 'user',   label: 'ผู้ใช้',     type: 'text' },
  { key: 'action', label: 'การกระทำ',  type: 'text' },
  { key: 'target', label: 'รายการ',    type: 'text' },
  { key: 'detail', label: 'รายละเอียด', type: 'multiline' }
];

/** ชีตที่มีคอลัมน์ปี — ใช้ทำตัวกรอง "แยกตามปี" */
var YEAR_SHEETS = [
  SHEETS.DEBT_PAYMENTS, SHEETS.PURCHASES,
  SHEETS.AC_SERVICE, SHEETS.ROOM_REPAIRS, SHEETS.BUILDING_REPAIRS, SHEETS.FINANCE
];

/**
 * รุ่นของโครงสร้างข้อมูล — เพิ่มเลขนี้เมื่อมีการย้ายคอลัมน์
 * เพื่อให้ตัวย้ายข้อมูลทำงานครั้งเดียวตอนอัปเดตโค้ด
 */
var SCHEMA_VERSION = 3;

/** รายการที่เป็น "รายรับ" — ใช้แยกฝั่งรายรับ/รายจ่ายอัตโนมัติ */
var INCOME_KINDS = ['รายรับค่าเช่า', 'รายรับอื่น ๆ'];

/** ค่าตั้งต้นของชีต Settings (ค่าที่เป็นความลับ เช่น รหัสประตู ให้กรอกเองในชีต) */
var DEFAULT_SETTINGS = [
  { key: 'building_name',   label: 'ชื่ออาคาร',              value: 'The M Corner AP', note: '' },
  { key: 'building_address', label: 'ที่อยู่',               value: '', note: '' },
  { key: 'total_rooms',     label: 'จำนวนห้องทั้งหมด',       value: String(ROOMS.length), note: '' },
  { key: 'door_code',       label: 'รหัสเข้าตึก',            value: '', note: 'ข้อมูลลับ — กรอกในชีตเท่านั้น อย่าใส่ในโค้ด' },
  { key: 'admin_code',      label: 'รหัสดูแลระบบคีย์การ์ด',   value: '', note: 'ข้อมูลลับ — กรอกในชีตเท่านั้น' },
  { key: 'ac_cycle_months', label: 'รอบล้างแอร์ (เดือน)',     value: '6',  note: 'ใช้คำนวณห้องที่ถึงกำหนดล้างแอร์' },
  { key: 'warranty_alert_days', label: 'แจ้งเตือนก่อนประกันหมด (วัน)', value: '30', note: '' },
  { key: 'overdue_alert_days',  label: 'แจ้งเตือนงานซ่อมค้างเกิน (วัน)', value: '7', note: '' },
  { key: 'admin_token',     label: 'กุญแจผู้ดูแล (แก้ไขได้)',  value: '', note: 'สร้างอัตโนมัติตอนติดตั้ง — อย่าแชร์ให้ใคร' },
  { key: 'view_token',      label: 'กุญแจแชร์ (ดูอย่างเดียว)', value: '', note: 'สร้างอัตโนมัติ — แชร์ลิงก์นี้ให้คนอื่นดูได้' },
  { key: 'admin_emails',    label: 'อีเมลผู้ดูแลเพิ่มเติม',     value: '', note: 'คั่นด้วยเครื่องหมายจุลภาค เว้นว่างได้' },
  { key: 'webapp_url',      label: 'Web app URL (ลงท้าย /exec)', value: '', note: 'ระบบจำให้เองตอนเปิดเว็บครั้งแรก · หรือวางเองจาก Deploy > Manage deployments' },
  { key: 'backup_keep',     label: 'เก็บไฟล์สำรองย้อนหลัง (ชุด)', value: '30', note: '' },
  { key: 'refresh_seconds', label: 'รีเฟรชข้อมูลอัตโนมัติทุก (วินาที)', value: '25', note: 'ใส่ 0 เพื่อปิด' }
];


/* ══════════════════════════════════════════════════════════════
   Util.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * Util.gs — ตัวช่วยกลาง: อ่าน/เขียนชีต, แปลงวันที่, แปลงตัวเลข, log
 */

/* ---------- Spreadsheet ---------- */

function props_() {
  return PropertiesService.getScriptProperties();
}

function getSpreadsheet_() {
  var id = props_().getProperty(PROP.SPREADSHEET_ID);
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (e) { /* ตกไปใช้ active */ }
  }
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) {
    throw new Error('ยังไม่ได้ตั้งค่า SPREADSHEET_ID — เปิดเมนู "The M Corner AP" > "ติดตั้งระบบ" ก่อน');
  }
  return active;
}

/** คืนชีตตามชื่อ สร้างใหม่พร้อมหัวตารางถ้ายังไม่มี */
function ensureSheet_(name) {
  var ss = getSpreadsheet_();
  var sh = ss.getSheetByName(name);
  var cols = SCHEMA[name];
  if (!cols) throw new Error('ไม่พบ schema ของชีต: ' + name);

  if (!sh) {
    sh = ss.insertSheet(name);
  }
  var headers = cols.map(function (c) { return c.label; });
  var first = sh.getRange(1, 1, 1, Math.max(headers.length, sh.getLastColumn() || 1)).getValues()[0];
  var needHeader = false;
  for (var i = 0; i < headers.length; i++) {
    if (String(first[i] || '').trim() !== headers[i]) { needHeader = true; break; }
  }
  if (needHeader) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#1f2a44')
      .setFontColor('#ffffff')
      .setVerticalAlignment('middle');
    sh.setFrozenRows(1);
  }
  return sh;
}

/** อ่านทั้งชีตออกมาเป็น array ของ object ตาม schema (แนบ _row = เลขแถวจริง) */
function readRows_(name) {
  var sh = ensureSheet_(name);
  var cols = SCHEMA[name];
  var last = sh.getLastRow();
  if (last < 2) return [];
  var values = sh.getRange(2, 1, last - 1, cols.length).getValues();
  var out = [];
  for (var r = 0; r < values.length; r++) {
    var row = values[r];
    if (row.every(function (v) { return v === '' || v === null; })) continue;
    var obj = { _row: r + 2 };
    for (var c = 0; c < cols.length; c++) {
      obj[cols[c].key] = normalizeValue_(row[c], cols[c].type);
    }
    out.push(obj);
  }
  return out;
}

/** แปลงค่าที่อ่านจากชีตให้เป็นชนิดที่ client ใช้ได้ */
function normalizeValue_(v, type) {
  if (v === '' || v === null || v === undefined) {
    return (type === 'number' || type === 'money') ? null : '';
  }
  if (type === 'date') return toIsoDate_(v);
  if (type === 'number' || type === 'money') return toNumber_(v);
  if (type === 'files') return splitList_(v);
  if (type === 'bool') return v === true || String(v).toUpperCase() === 'TRUE';
  return String(v);
}

/** แปลงค่าจาก client ให้พร้อมเขียนลงชีต */
function serializeValue_(v, type) {
  if (v === null || v === undefined) return '';
  if (type === 'date') {
    var d = toDate_(v);
    return d ? d : '';
  }
  if (type === 'number' || type === 'money') {
    var n = toNumber_(v);
    return n === null ? '' : n;
  }
  if (type === 'files') {
    if (Array.isArray(v)) return v.filter(String).join('\n');
    return String(v || '');
  }
  return String(v);
}

/** เพิ่มแถวใหม่ คืน object ที่บันทึกแล้ว */
function insertRow_(name, obj) {
  var sh = ensureSheet_(name);
  var cols = SCHEMA[name];
  var row = cols.map(function (c) { return serializeValue_(obj[c.key], c.type); });
  sh.appendRow(row);
  var saved = {};
  cols.forEach(function (c, i) { saved[c.key] = normalizeValue_(row[i], c.type); });
  saved._row = sh.getLastRow();
  return saved;
}

/** เขียนทับแถวเดิมทั้งแถว */
function updateRow_(name, rowNumber, obj) {
  var sh = ensureSheet_(name);
  var cols = SCHEMA[name];
  var row = cols.map(function (c) { return serializeValue_(obj[c.key], c.type); });
  sh.getRange(rowNumber, 1, 1, cols.length).setValues([row]);
  var saved = {};
  cols.forEach(function (c, i) { saved[c.key] = normalizeValue_(row[i], c.type); });
  saved._row = rowNumber;
  return saved;
}

function deleteRow_(name, rowNumber) {
  var sh = ensureSheet_(name);
  sh.deleteRow(rowNumber);
}

/** หาแถวจาก id (คอลัมน์ 'id' หรือ 'room' สำหรับชีต Rooms) */
function findRow_(name, idValue, idKey) {
  idKey = idKey || 'id';
  var rows = readRows_(name);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][idKey]) === String(idValue)) return rows[i];
  }
  return null;
}

/** เขียนหลายแถวรวดเดียว (ใช้ตอน seed — เร็วกว่า appendRow ทีละแถว) */
function bulkInsert_(name, objects) {
  if (!objects || !objects.length) return 0;
  var sh = ensureSheet_(name);
  var cols = SCHEMA[name];
  var matrix = objects.map(function (o) {
    return cols.map(function (c) { return serializeValue_(o[c.key], c.type); });
  });
  sh.getRange(sh.getLastRow() + 1, 1, matrix.length, cols.length).setValues(matrix);
  return matrix.length;
}

/* ---------- ค่า / วันที่ ---------- */

/** '1,234.50' | 1234.5 | '' -> number | null */
function toNumber_(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return isNaN(v) ? null : v;
  var s = String(v).replace(/[,\s฿]/g, '').replace(/บาท/g, '');
  if (s === '' || s === '-') return null;
  var n = Number(s);
  return isNaN(n) ? null : n;
}

/** รับได้ทั้ง Date, 'YYYY-MM-DD', 'DD/MM/YY', 'DD/MM/YYYY' (ค.ศ. หรือ พ.ศ.) */
function toDate_(v) {
  if (!v && v !== 0) return null;
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return isNaN(v.getTime()) ? null : v;
  }
  var s = String(v).trim();
  if (!s) return null;

  var m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

  m = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})$/);
  if (m) {
    var a = Number(m[1]), b = Number(m[2]), y = Number(m[3]);
    if (y < 100) y += 2000;
    if (y > 2400) y -= 543;            // พ.ศ. -> ค.ศ.
    // ชีตเดิมมีทั้งแบบ วัน/เดือน/ปี และ เดือน/วัน/ปี (จาก Google Sheets รูปแบบอเมริกัน)
    // ถ้าตัวที่สองมากกว่า 12 แปลว่าเป็นวัน จึงต้องสลับให้ตัวแรกเป็นเดือน
    var d = a, mo = b;
    if (b > 12 && a <= 12) { d = b; mo = a; }
    if (mo > 12 || d > 31) return null;
    return new Date(y, mo - 1, d);
  }
  var parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/** Date -> 'YYYY-MM-DD' (โซนเวลาไทย) */
function toIsoDate_(v) {
  var d = toDate_(v);
  if (!d) return '';
  return Utilities.formatDate(d, APP.TIMEZONE, 'yyyy-MM-dd');
}

function yearOf_(v) {
  var d = toDate_(v);
  return d ? d.getFullYear() : null;
}

function todayIso_() {
  return Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyy-MM-dd');
}

function nowStamp_() {
  return Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
}

/** บวกเดือนแบบไม่ให้วันล้น (31 ม.ค. + 1 เดือน = 28/29 ก.พ.) */
function addMonths_(dateLike, months) {
  var d = toDate_(dateLike);
  if (!d || !months) return d;
  var day = d.getDate();
  var target = new Date(d.getFullYear(), d.getMonth() + Number(months), 1);
  var lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return target;
}

function daysBetween_(fromIso, toIso) {
  var a = toDate_(fromIso), b = toDate_(toIso);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function splitList_(v) {
  if (Array.isArray(v)) return v;
  return String(v || '').split(/[\n,]+/).map(function (s) { return s.trim(); }).filter(String);
}

function uid_(prefix) {
  var t = Date.now().toString(36).toUpperCase();
  var r = Math.floor(Math.random() * 1679616).toString(36).toUpperCase();
  return (prefix || 'ID') + '-' + t + r;
}

function sum_(arr, pick) {
  return arr.reduce(function (a, x) {
    var v = pick ? pick(x) : x;
    return a + (toNumber_(v) || 0);
  }, 0);
}

function round2_(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/* ---------- Log ---------- */

function logActivity_(action, target, detail) {
  try {
    insertRow_(SHEETS.LOG, {
      at: new Date(),
      user: currentUserEmail_(),
      action: action,
      target: target,
      detail: typeof detail === 'string' ? detail : JSON.stringify(detail || {})
    });
  } catch (e) {
    console.warn('logActivity_ failed: ' + e);
  }
}

function currentUserEmail_() {
  try { return Session.getActiveUser().getEmail() || 'unknown'; }
  catch (e) { return 'unknown'; }
}

/** 'YYYY-MM-DD' -> '26 เม.ย. 2569' (ใช้ในข้อความแจ้งเตือน/อีเมล) */
var TH_MONTHS_ = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
function thDate_(v) {
  var d = toDate_(v);
  if (!d) return '–';
  return d.getDate() + ' ' + TH_MONTHS_[d.getMonth()] + ' ' + (d.getFullYear() + 543);
}


/* ══════════════════════════════════════════════════════════════
   Setup.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * Setup.gs — ติดตั้งระบบครั้งแรก และเมนูใน Google Sheet
 */

/** ปิดเสียงกล่องข้อความชั่วคราว ตอนตัวติดตั้งรวบยอดเรียกหลายขั้นตอนต่อกัน */
var QUIET_ = false;

function alert_(msg) {
  if (QUIET_) { console.log(msg); return msg; }
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { console.log(msg); }
  return msg;
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏢 ' + APP.NAME)
    .addItem('🚀 ติดตั้งทั้งหมดในคลิกเดียว', 'START_HERE')
    .addSeparator()
    .addItem('⚙️ ติดตั้งระบบ (สร้างชีตทั้งหมด)', 'setupSystem')
    .addItem('🌱 นำเข้าข้อมูลเดิม (Seed)', 'seedHistoricalData')
    .addSeparator()
    .addItem('🔔 ส่งสรุปแจ้งเตือนตอนนี้', 'sendDigestNow')
    .addItem('⏰ ตั้งแจ้งเตือนอัตโนมัติรายสัปดาห์', 'installWeeklyTrigger')
    .addSeparator()
    .addItem('🔗 แสดงลิงก์เข้าใช้งาน', 'showWebAppUrl')
    .addItem('🔁 ออกลิงก์แชร์ใหม่ (ยกเลิกลิงก์เดิม)', 'rotateShareLink')
    .addItem('🔑 แสดงเฉพาะกุญแจ (เอาไปต่อท้าย URL เอง)', 'showKeysOnly')
    .addSeparator()
    .addItem('💾 สำรองข้อมูลลง Drive ตอนนี้', 'backupNow')
    .addItem('🗓️ ตั้งสำรองข้อมูลอัตโนมัติทุกวัน', 'installBackupTrigger')
    .addToUi();
}

/**
 * สร้างชีตทั้งหมด + ทะเบียนห้อง 24 ห้อง + โฟลเดอร์ Drive
 * เรียกซ้ำได้ ไม่ลบข้อมูลเดิม
 */
function setupSystem() {
  var ss = SpreadsheetApp.getActiveSpreadsheet() || getSpreadsheet_();
  props_().setProperty(PROP.SPREADSHEET_ID, ss.getId());

  var created = [];
  Object.keys(SHEETS).forEach(function (k) {
    var name = SHEETS[k];
    var existed = !!ss.getSheetByName(name);
    ensureSheet_(name);
    applyFormatting_(name);
    if (!existed) created.push(name);
  });

  seedRooms_();
  seedSettings_();
  ensureTokens_();
  runMigrations_();      // ย้ายคอลัมน์ให้ตรงรุ่นใหม่ ก่อนใครจะอ่านข้อมูล
  ensureDriveFolders_();

  var msg = 'ติดตั้งระบบเรียบร้อย\n\n' +
    'ชีตที่สร้างใหม่: ' + (created.length ? created.join(', ') : '(ไม่มี — มีครบอยู่แล้ว)') + '\n' +
    'ห้องทั้งหมด: ' + ROOMS.length + ' ห้อง\n' +
    'โฟลเดอร์ไฟล์แนบ: ' + (props_().getProperty(PROP.DRIVE_FOLDER_ID) || '-');
  return alert_(msg);
}

/** จัดรูปแบบคอลัมน์ (วันที่/เงิน) + ความกว้าง + dropdown */
function applyFormatting_(name) {
  var sh = ensureSheet_(name);
  var cols = SCHEMA[name];
  var maxRows = Math.max(sh.getMaxRows() - 1, 1);

  cols.forEach(function (c, i) {
    var col = i + 1;
    var range = sh.getRange(2, col, maxRows, 1);
    if (c.type === 'date') {
      range.setNumberFormat('yyyy-mm-dd');
      sh.setColumnWidth(col, 110);
    } else if (c.type === 'money') {
      range.setNumberFormat('#,##0.00');
      sh.setColumnWidth(col, 120);
    } else if (c.type === 'number') {
      range.setNumberFormat('#,##0');
      sh.setColumnWidth(col, 90);
    } else if (c.type === 'multiline' || c.type === 'files') {
      sh.setColumnWidth(col, 260);
      range.setWrap(true);
    } else {
      sh.setColumnWidth(col, 140);
    }

    if (c.type === 'select' && c.options && c.options.length && c.options.length <= 500) {
      var rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(c.options, true)
        .setAllowInvalid(true)
        .build();
      range.setDataValidation(rule);
    }
  });
}

/** เติมห้อง 24 ห้องลงชีต Rooms (ไม่ทับของเดิม) */
function seedRooms_() {
  var existing = readRows_(SHEETS.ROOMS);
  var have = {};
  existing.forEach(function (r) { have[String(r.room)] = true; });

  var toAdd = [];
  FLOORS.forEach(function (f) {
    f.rooms.forEach(function (room) {
      if (have[room]) return;
      toAdd.push({
        room: room, floor: f.floor, status: 'มีผู้เช่า',
        tenant: '', phone: '', rent: null, moveIn: '', note: '', updatedAt: new Date()
      });
    });
  });
  bulkInsert_(SHEETS.ROOMS, toAdd);
  return toAdd.length;
}

function seedSettings_() {
  var existing = readRows_(SHEETS.SETTINGS);
  var have = {};
  existing.forEach(function (r) { have[String(r.key)] = true; });
  var toAdd = DEFAULT_SETTINGS.filter(function (s) { return !have[s.key]; });
  bulkInsert_(SHEETS.SETTINGS, toAdd);
  return toAdd.length;
}

/** เขียนค่าลงชีต Settings (สร้างแถวใหม่ถ้ายังไม่มีคีย์นั้น) */
function setSetting_(key, value) {
  var sh = ensureSheet_(SHEETS.SETTINGS);
  var rows = readRows_(SHEETS.SETTINGS);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].key) === String(key)) {
      sh.getRange(rows[i]._row, 3).setValue(String(value));
      return value;
    }
  }
  insertRow_(SHEETS.SETTINGS, { key: key, label: key, value: String(value), note: '' });
  return value;
}

function getSetting_(key, fallback) {
  var rows = readRows_(SHEETS.SETTINGS);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].key) === key) {
      var v = String(rows[i].value || '').trim();
      return v === '' ? fallback : v;
    }
  }
  return fallback;
}

function showWebAppUrl() {
  ensureTokens_();
  return alert_(linksMessage_());
}

/** ข้อความบอกลิงก์ — จัดการกรณีที่ยังหา URL จริงไม่เจอด้วย */
function linksMessage_() {
  var admin = getSetting_('admin_token', '');
  var view = getSetting_('view_token', '');
  var url = webAppUrl_();

  if (url && !isTestUrl_(url)) {
    return '━━━━━━━━━━━━━━━━━━━━━━\n' +
      '🔑 ลิงก์ของคุณ (แก้ไขข้อมูลได้ — เก็บไว้ใช้เอง)\n' + url + '?key=' + admin + '\n\n' +
      '👀 ลิงก์แชร์ (ดูอย่างเดียว — ส่งให้ใครก็ได้)\n' + url + '?key=' + view + '\n' +
      '━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      'เปิดในมือถือแล้วกด "เพิ่มลงหน้าจอโฮม" เพื่อใช้เหมือนแอป';
  }

  return 'ยังหาลิงก์จริงไม่เจอ (ที่เห็นตอนนี้ลงท้ายด้วย /dev ซึ่งเป็นลิงก์ทดสอบ\n' +
    'เปิดได้เฉพาะบัญชีคุณ และแชร์ให้คนอื่นไม่ได้)\n\n' +
    'เกิดได้ 2 กรณี — ทำตามนี้ได้เลยทั้งคู่:\n\n' +
    '① ถ้ายังไม่เคยกด Deploy\n' + deploySteps_() + '\n\n' +
    '② ถ้า Deploy ไปแล้ว (getUrl จะคืน /dev เสมอเมื่อรันจากหน้าแก้ไขโค้ด — เป็นเรื่องปกติ)\n' +
    '   กด Deploy → Manage deployments → คัดลอก "Web app URL" ที่ลงท้ายด้วย /exec\n\n' +
    '━━━━━━━━━━━━━━━━━━━━━━\n' +
    'ได้ URL มาแล้ว เอามาต่อท้ายด้วยกุญแจข้างล่างนี้:\n\n' +
    '🔑 ผู้ดูแล  ?key=' + admin + '\n' +
    '👀 แชร์     ?key=' + view + '\n\n' +
    'ตัวอย่าง\n' +
    'https://script.google.com/macros/s/AKfy..../exec?key=' + admin + '\n' +
    '━━━━━━━━━━━━━━━━━━━━━━\n\n' +
    '💡 ทางลัด: วาง Web app URL ลงในชีต Settings แถว webapp_url\n' +
    '   แล้วรันเมนูนี้อีกครั้ง ระบบจะประกอบลิงก์เต็มให้เอง\n' +
    '   (หรือแค่เปิดลิงก์ /exec สักครั้ง ระบบก็จะจำเอง)';
}

function deployMessage_() { return deploySteps_(); }

function deploySteps_() {
  return 'วิธี Deploy ให้ได้ลิงก์ที่แชร์ได้:\n' +
    '1. กด Deploy (มุมขวาบน) → New deployment\n' +
    '2. กดเฟือง ⚙️ ข้าง Select type → เลือก Web app\n' +
    '3. Execute as   = Me (อีเมลของคุณ)\n' +
    '4. Who has access = Anyone   ← ไม่ใช่ "Anyone with Google account"\n' +
    '5. กด Deploy → กด Done จนหน้าต่างปิด';
}

function rotateShareLink() {
  var r = rotateViewToken_();
  return alert_('ออกลิงก์แชร์ชุดใหม่แล้ว — ลิงก์เดิมใช้ไม่ได้อีกต่อไป\n\n' + r.url);
}


/* ------------------------------------------------------------------ */
/*  ตัวติดตั้งรวบยอด — รันฟังก์ชันเดียวจบ                                */
/* ------------------------------------------------------------------ */

/**
 * START_HERE — รันฟังก์ชันนี้ฟังก์ชันเดียวหลังวางโค้ดเสร็จ
 *
 * ทำให้ครบในรอบเดียว:
 *   1. สร้างชีต 11 แท็บ + ทะเบียน 24 ห้อง + โฟลเดอร์ไฟล์แนบใน Drive
 *   2. นำเข้าข้อมูลเดิมทั้งหมด (ข้ามให้เองถ้าชีตมีข้อมูลอยู่แล้ว)
 *   3. สุ่มกุญแจผู้ดูแลกับกุญแจแชร์
 *   4. ตั้งสำรองข้อมูลลง Drive อัตโนมัติทุกวัน
 *   5. ตั้งแจ้งเตือนสรุปงานเข้าอีเมลทุกวันจันทร์
 *   6. บอกลิงก์เข้าใช้งาน (ถ้า deploy แล้ว) หรือบอกว่าต้องทำอะไรต่อ
 *
 * รันซ้ำได้ ไม่ทำข้อมูลซ้ำและไม่สร้าง trigger ซ้ำ
 */
function START_HERE() {
  var log = [];
  var wasQuiet = QUIET_;
  QUIET_ = true;

  try {
    setupSystem();
    log.push('✅ สร้างชีต 11 แท็บ · ทะเบียน 24 ห้อง · โฟลเดอร์ไฟล์แนบ');

    var before = readRows_(SHEETS.PURCHASES).length;
    seedHistoricalData();
    var after = readRows_(SHEETS.PURCHASES).length;
    log.push(after > before
      ? '✅ นำเข้าข้อมูลเดิมครบทุกโมดูล'
      : '✅ ข้อมูลเดิมมีอยู่แล้ว (' + after + ' รายการซื้อ) — ข้ามการนำเข้า');

    log.push('✅ ออกกุญแจผู้ดูแลและกุญแจแชร์แล้ว');

    try { installBackupTrigger(); log.push('✅ สำรองข้อมูลลง Drive อัตโนมัติ ทุกวันตี 2'); }
    catch (e) { log.push('⚠️ ตั้งสำรองอัตโนมัติไม่ได้: ' + e.message); }

    try { installWeeklyTrigger(); log.push('✅ แจ้งเตือนสรุปงานเข้าอีเมล ทุกวันจันทร์ 08:00'); }
    catch (e) { log.push('⚠️ ตั้งแจ้งเตือนอีเมลไม่ได้: ' + e.message); }
  } finally {
    QUIET_ = wasQuiet;
  }

  return alert_('The M Corner AP — ติดตั้งเรียบร้อย\n\n' + log.join('\n') + '\n\n' + linksMessage_());
}

/** ชื่อไทยของ START_HERE เผื่อหาในรายการฟังก์ชันง่ายขึ้น */
function ติดตั้งทั้งหมด() { return START_HERE(); }


/** แสดงแค่กุญแจ ไว้ใช้ตอนมี Web app URL อยู่ในมือแล้ว */
function showKeysOnly() {
  ensureTokens_();
  return alert_(
    'กุญแจของระบบ — เอาไปต่อท้าย Web app URL ที่ลงท้ายด้วย /exec\n\n' +
    '🔑 ผู้ดูแล (แก้ไขได้)\n?key=' + getSetting_('admin_token', '') + '\n\n' +
    '👀 แชร์ (ดูอย่างเดียว)\n?key=' + getSetting_('view_token', '') + '\n\n' +
    'หา Web app URL ได้ที่  Deploy → Manage deployments');
}


/* ══════════════════════════════════════════════════════════════
   Auth.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * Auth.gs — สิทธิ์เข้าใช้งานแบบลิงก์
 *
 * ระบบถูก deploy แบบ "ใครมีลิงก์ก็เปิดได้" (Anyone) เพื่อให้แชร์ให้คนอื่นดูได้
 * โดยไม่ต้องให้เขาเข้าถึง Google Sheet ของเรา สิทธิ์จึงคุมด้วย "กุญแจ" ในลิงก์แทน
 *
 *   ลิงก์ผู้ดูแล  .../exec?key=<admin_token>   → เพิ่ม/แก้/ลบได้ทุกอย่าง
 *   ลิงก์แชร์     .../exec?key=<view_token>    → ดูอย่างเดียว แก้อะไรไม่ได้
 *   ไม่มีกุญแจ                                  → เข้าไม่ได้
 *
 * กุญแจสองชุดนี้สุ่มขึ้นตอนติดตั้ง เก็บอยู่ในชีต Settings
 * ถ้าลิงก์แชร์หลุด ให้กด "ออกกุญแจแชร์ใหม่" ลิงก์เดิมจะใช้ไม่ได้ทันที
 *
 * ⚠️ การกันสิทธิ์ทำที่ฝั่งเซิร์ฟเวอร์ (ฟังก์ชัน api) ไม่ใช่แค่ซ่อนปุ่มในหน้าเว็บ
 */

var ROLE = { ADMIN: 'admin', VIEWER: 'viewer', NONE: 'none' };

/** คำสั่งที่เปลี่ยนแปลงข้อมูล — ต้องเป็นผู้ดูแลเท่านั้น */
var MUTATING_ACTIONS = /\.(save|delete|savePayment|deletePayment|bulkBook|import|send|rotateToken|backupNow)$/;

function resolveRole_(key) {
  key = String(key || '').trim();
  if (key) {
    if (key === getSetting_('admin_token', '')) return ROLE.ADMIN;
    if (key === getSetting_('view_token', '')) return ROLE.VIEWER;
  }
  // เจ้าของชีต (หรืออีเมลที่อนุญาตไว้) เข้าได้เสมอ แม้ไม่มีกุญแจในลิงก์
  var email = String(currentUserEmail_() || '').toLowerCase();
  if (email && email !== 'unknown') {
    if (email === String(ownerEmail_() || '').toLowerCase()) return ROLE.ADMIN;
    var allow = String(getSetting_('admin_emails', '') || '')
      .split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(String);
    if (allow.indexOf(email) >= 0) return ROLE.ADMIN;
  }
  return ROLE.NONE;
}

function requireRole_(action, key) {
  var role = resolveRole_(key);
  if (role === ROLE.NONE) {
    throw new Error('ลิงก์นี้ไม่มีสิทธิ์เข้าใช้งาน — ขอลิงก์ที่ถูกต้องจากเจ้าของหอพัก');
  }
  if (MUTATING_ACTIONS.test(action) && role !== ROLE.ADMIN) {
    throw new Error('ลิงก์นี้เป็นแบบดูอย่างเดียว จึงแก้ไขข้อมูลไม่ได้');
  }
  return role;
}

function currentUserEmail_() {
  try { return Session.getActiveUser().getEmail() || ''; }
  catch (e) { return ''; }
}

function ownerEmail_() {
  try {
    var o = getSpreadsheet_().getOwner();
    if (o) return o.getEmail();
  } catch (e) { /* ชีตใน Shared Drive ไม่มีเจ้าของรายบุคคล */ }
  try { return Session.getEffectiveUser().getEmail(); } catch (e2) { return ''; }
}

/** สุ่มกุญแจใหม่ (ตัวอักษรที่อ่านง่าย ไม่มี 0/O/1/l ปนกัน) */
function newToken_(len) {
  var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz';
  var out = '';
  for (var i = 0; i < (len || 22); i++) out += abc.charAt(Math.floor(Math.random() * abc.length));
  return out;
}

/** สร้างกุญแจตอนติดตั้ง ถ้ายังไม่มี */
function ensureTokens_() {
  var made = [];
  [['admin_token', 26], ['view_token', 22]].forEach(function (pair) {
    if (!getSetting_(pair[0], '')) {
      setSetting_(pair[0], newToken_(pair[1]));
      made.push(pair[0]);
    }
  });
  return made;
}

/** ออกกุญแจแชร์ชุดใหม่ — ลิงก์แชร์เดิมจะใช้ไม่ได้ทันที */
function rotateViewToken_() {
  var t = newToken_(22);
  setSetting_('view_token', t);
  logActivity_('ออกกุญแจแชร์ใหม่', 'view_token', '');
  return { token: t, url: shareUrl_(t) };
}

/**
 * URL ของเว็บแอป
 *   ลงท้าย /exec = ลิงก์จริง ใช้ได้กับทุกคน แชร์ได้
 *   ลงท้าย /dev  = ลิงก์ทดสอบ เปิดได้เฉพาะเจ้าของสคริปต์ แชร์ไม่ได้
 *
 * หมายเหตุสำคัญ: ScriptApp.getService().getUrl() คืน /dev เสมอเมื่อเรียกจากหน้าแก้ไขโค้ด
 * ถึงจะ deploy ไปแล้วก็ตาม จึงต้องหา URL จริงจากทางอื่นด้วย
 */
function rawServiceUrl_() {
  try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; }
}

/** URL ที่ใช้ประกอบลิงก์จริง — เอาที่ลงท้าย /exec ก่อนเสมอ */
function webAppUrl_() {
  var saved = String(getSetting_('webapp_url', '') || '').trim();
  if (saved && !isTestUrl_(saved)) return saved.replace(/\?.*$/, '');
  var live = rawServiceUrl_();
  return live;
}

/**
 * จำ URL จริงไว้ตอนที่มีคนเปิดเว็บแอป
 * เพราะตอนโค้ดทำงานอยู่ใน /exec ตัว getUrl() จะคืน /exec ให้
 */
function rememberExecUrl_() {
  try {
    var u = rawServiceUrl_();
    if (!u || isTestUrl_(u)) return;
    u = u.replace(/\?.*$/, '');
    if (u !== String(getSetting_('webapp_url', '') || '').trim()) setSetting_('webapp_url', u);
  } catch (e) { /* ไม่สำคัญพอจะขัดจังหวะการเปิดหน้า */ }
}

function isTestUrl_(url) {
  return /\/dev(\?|$)/.test(String(url || ''));
}

function shareUrl_(token) {
  var base = webAppUrl_();
  return base ? base + '?key=' + token : '(ยังไม่ได้ deploy)';
}

/** ใช้ในหน้าเว็บ เพื่อรู้ว่ากำลังเปิดด้วยสิทธิ์อะไร */
function whoAmI(key) {
  var role = resolveRole_(key);
  return {
    role: role,
    canEdit: role === ROLE.ADMIN,
    email: currentUserEmail_() || 'ผู้ใช้ผ่านลิงก์',
    label: role === ROLE.ADMIN ? 'ผู้ดูแล' : (role === ROLE.VIEWER ? 'ดูอย่างเดียว' : 'ไม่มีสิทธิ์')
  };
}


/* ══════════════════════════════════════════════════════════════
   Drive.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * Drive.gs — จัดการไฟล์แนบ (ภาพประกอบ / สลิปการโอน)
 *
 * โครงสร้างโฟลเดอร์:
 *   The M Corner AP - ไฟล์แนบ/
 *     ├── รายการซื้อของ/
 *     ├── สลิปโอนใช้หนี้/
 *     ├── ล้างแอร์/
 *     ├── ซ่อมแซมห้อง/
 *     └── ซ่อมแซมตึก/
 */

var DRIVE_SUBFOLDERS = {
  purchases: 'รายการซื้อของ',
  debt: 'สลิปโอนใช้หนี้',
  ac: 'ล้างแอร์',
  roomRepair: 'ซ่อมแซมห้อง',
  building: 'ซ่อมแซมตึก',
  misc: 'อื่น ๆ'
};

function ensureDriveFolders_() {
  var id = props_().getProperty(PROP.DRIVE_FOLDER_ID);
  var root;
  if (id) {
    try { root = DriveApp.getFolderById(id); } catch (e) { root = null; }
  }
  if (!root) {
    var name = APP.NAME + ' - ไฟล์แนบ';
    var it = DriveApp.getFoldersByName(name);
    root = it.hasNext() ? it.next() : DriveApp.createFolder(name);
    props_().setProperty(PROP.DRIVE_FOLDER_ID, root.getId());
  }
  Object.keys(DRIVE_SUBFOLDERS).forEach(function (k) {
    subFolder_(root, DRIVE_SUBFOLDERS[k]);
  });
  return root;
}

function subFolder_(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function folderFor_(bucket) {
  var root = ensureDriveFolders_();
  return subFolder_(root, DRIVE_SUBFOLDERS[bucket] || DRIVE_SUBFOLDERS.misc);
}

/**
 * อัปโหลดไฟล์จากหน้าเว็บ
 * @param {{bucket:string, files:Array<{name:string, mimeType:string, dataUrl:string}>}} payload
 * @return {Array<{id:string,name:string,url:string,thumb:string}>}
 */
function uploadFiles_(payload) {
  var bucket = (payload && payload.bucket) || 'misc';
  var files = (payload && payload.files) || [];
  var folder = folderFor_(bucket);
  var out = [];

  files.forEach(function (f) {
    if (!f || !f.dataUrl) return;
    var base64 = String(f.dataUrl).indexOf(',') >= 0
      ? String(f.dataUrl).split(',')[1]
      : String(f.dataUrl);
    var bytes = Utilities.base64Decode(base64);
    var safeName = (f.name || 'file')
      .replace(/[\\/:*?"<>|]/g, '_')
      .slice(0, 90);
    var stamped = Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyyMMdd-HHmmss') + '-' + safeName;
    var blob = Utilities.newBlob(bytes, f.mimeType || 'application/octet-stream', stamped);
    var file = folder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) { /* Shared Drive บางประเภทตั้งไม่ได้ — ข้ามไป */ }
    out.push(fileInfo_(file));
  });
  return out;
}

function fileInfo_(file) {
  var id = file.getId();
  return {
    id: id,
    name: file.getName(),
    url: 'https://drive.google.com/file/d/' + id + '/view',
    thumb: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w600',
    mime: file.getMimeType()
  };
}

/** แปลง URL/ID ที่เก็บในชีต ให้เป็นข้อมูลพร้อมแสดงผล */
function toFileRefs_(list) {
  return splitList_(list).map(function (raw) {
    var id = extractDriveId_(raw);
    if (!id) return { id: '', name: raw, url: raw, thumb: '' };
    return {
      id: id,
      name: '',
      url: 'https://drive.google.com/file/d/' + id + '/view',
      thumb: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w600'
    };
  });
}

function extractDriveId_(raw) {
  var s = String(raw || '').trim();
  if (!s) return '';
  var m = s.match(/\/d\/([a-zA-Z0-9_-]{20,})/) ||
          s.match(/[?&]id=([a-zA-Z0-9_-]{20,})/) ||
          s.match(/^([a-zA-Z0-9_-]{20,})$/);
  return m ? m[1] : '';
}

/** ลบไฟล์ (ย้ายลงถังขยะ) */
function trashFile_(fileId) {
  try { DriveApp.getFileById(fileId).setTrashed(true); return true; }
  catch (e) { return false; }
}


/* ══════════════════════════════════════════════════════════════
   Seed.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * Seed.gs — นำเข้าข้อมูลเดิมจาก Google Sheet "รายรับ-รายจ่าย 2026 ธิติวุฒิ"
 *
 * ข้อมูลชุดนี้ถอดมาจากชีตเดิมและตรวจยอดตรงกันแล้ว:
 *   • โอนใช้หนี้หลัก   32 รายการ  รวม 5,049,654 บาท  (ตรงกับ "ยอดผ่อนชำระรวม")
 *   • รายการซื้อของ    94 รายการ  รวม 856,404 บาท    (ตรงกับ "ยอดรวมทั้งหมด")
 *   • ล้างแอร์         41 ครั้ง
 *   • ซ่อมแซมตามห้อง   42 รายการ
 *
 * เรียก seedHistoricalData() ครั้งเดียวหลังติดตั้งระบบ — กันซ้ำด้วย flag ใน Script Properties
 */

var SEED_FLAG = 'SEEDED_V1';

/** ก้อนหนี้ตั้งต้น (ยอดรวม 13,151,000 = "ยอดก่อสร้างรวม" ในชีตเดิม) */
var SEED_DEBTS = [
  { ledger: 'หนี้หลัก', title: 'ซื้อที่ดิน The M Corner AP', creditor: 'ครอบครัว',
    startDate: '2018-03-07', principal: 4700000, interestPerMonth: null, dueDay: 20,
    planPerMonth: 80000, status: 'กำลังผ่อน', note: 'ยืมป้าตา 1 ล้านบาท (บันทึกแยกไว้ในบัญชีหนี้รอง)' },
  { ledger: 'หนี้หลัก', title: 'ค่าก่อสร้าง The M Corner AP', creditor: 'ครอบครัว',
    startDate: '2021-01-04', principal: 8400000, interestPerMonth: null, dueDay: 20,
    planPerMonth: 80000, status: 'กำลังผ่อน', note: '' },
  { ledger: 'หนี้หลัก', title: 'ค่าเขียนแบบ The M Corner AP', creditor: 'ครอบครัว',
    startDate: '2021-01-04', principal: 51000, interestPerMonth: null, dueDay: 20,
    planPerMonth: null, status: 'กำลังผ่อน', note: '' },
  { ledger: 'หนี้รอง', title: 'เงินยืมป้าตา (ทุนซื้อที่ดิน)', creditor: 'ป้าตา',
    startDate: '2018-03-07', principal: 1000000, interestPerMonth: 2200, dueDay: 20,
    planPerMonth: null, status: 'กำลังผ่อน', note: 'ชำระดอกเบี้ยเดือนละ 2,200 บาท' }
];

/** รายการโอนใช้หนี้หลัก (จากชีตเดิม) */
var SEED_DEBT_PAYMENTS = [
  { payDate: "2022-04-14", amount: 1104641, installment: "3/2565" },
  { payDate: "2022-04-14", amount: 309000, installment: "4/2565" },
  { payDate: "2018-04-23", amount: 1278000, installment: "2562" },
  { payDate: "2022-05-18", amount: 100000, installment: "2565" },
  { payDate: "2022-06-10", amount: 100000, installment: "2565" },
  { payDate: "2023-04-19", amount: 98000, installment: "2566" },
  { payDate: "2023-04-26", amount: 100013, installment: "2566" },
  { payDate: "2023-05-14", amount: 90000, installment: "2566" },
  { payDate: "2024-03-06", amount: 60000, installment: "3/2567" },
  { payDate: "2024-04-26", amount: 70000, installment: "4/2567" },
  { payDate: "2024-07-16", amount: 80000, installment: "6/2567" },
  { payDate: "2024-09-05", amount: 160000, installment: "8/2567" },
  { payDate: "2024-09-16", amount: 80000, installment: "9/2567" },
  { payDate: "2024-10-18", amount: 80000, installment: "10/2567" },
  { payDate: "2024-11-26", amount: 80000, installment: "11/2567" },
  { payDate: "2024-12-20", amount: 80000, installment: "12/2567" },
  { payDate: "2025-01-21", amount: 80000, installment: "01/2568" },
  { payDate: "2025-01-20", amount: 80000, installment: "02/2568" },
  { payDate: "2025-05-20", amount: 80000, installment: "05/2568" },
  { payDate: "2025-06-20", amount: 80000, installment: "06/2568" },
  { payDate: "2025-08-07", amount: 80000, installment: "07/2568" },
  { payDate: "2025-08-20", amount: 80000, installment: "08/2568" },
  { payDate: "2025-09-20", amount: 80000, installment: "09/2568" },
  { payDate: "2025-10-25", amount: 80000, installment: "10/2568" },
  { payDate: "2025-12-25", amount: 80000, installment: "12/2568" },
  { payDate: "2026-01-21", amount: 80000, installment: "1/2569" },
  { payDate: "2026-03-13", amount: 80000, installment: "3/2569" },
  { payDate: "2026-04-20", amount: 50000, installment: "4/2569" },
  { payDate: "2026-05-19", amount: 80000, installment: "5/2569" },
  { payDate: "2026-06-15", amount: 70000, installment: "6/2569" },
  { payDate: "2026-07-13", amount: 70000, installment: "7/2569" },
  { payDate: "2026-10-08", amount: 30000, installment: "" },
];

/** รายการชำระดอกเบี้ยหนี้รอง (ป้าตา) */
var SEED_INTEREST_PAYMENTS = [
  { payDate: "2026-01-20", amount: 2200 },
  { payDate: "2026-02-23", amount: 2200 },
  { payDate: "2026-03-31", amount: 2200 },
  { payDate: "2026-04-07", amount: 2200 },
  { payDate: "2026-05-20", amount: 2200 },
  { payDate: "2026-06-20", amount: 2200 },
  { payDate: "2026-07-20", amount: 2200 },
  { payDate: "2026-08-30", amount: 32200 },
];

/** รายการซื้อของ 94 รายการ [วันที่, ปี, รายการ, จำนวน, ราคารวม, ร้าน, หมวดหมู่, ประกัน(เดือน)] */
var SEED_PURCHASES = [
  ["2026-01-13",2026,"ไฟเพดาน Randy 22๐ 2400LW",15,879,"Shopee","ระบบไฟฟ้า/แสงสว่าง",null],
  ["2026-01-23",2026,"สายท่อน้ำทิ้ง 1.65m",10,275,"Shopee","ระบบน้ำ/สุขภัณฑ์",null],
  ["2026-02-02",2026,"ก๊อกอ่างล้างจาน 304",10,464,"Shopee","ระบบน้ำ/สุขภัณฑ์",null],
  ["2026-03-02",2026,"ค่าระบบ Horganice",1,6148,"","ค่าบริการ/ค่าธรรมเนียม",null],
  ["2026-02-13",2026,"ค่าธรรมเนียมเก็บขยะมูลฝอย",1,1200,"","ค่าบริการ/ค่าธรรมเนียม",null],
  ["2026-04-18",2026,"ชั้นวางของในห้องน้ำ MARINE TS-02MAX",1,306,"Shopee","ระบบน้ำ/สุขภัณฑ์",null],
  ["2026-01-05",2026,"จระเข้ Flex Shield 4kg",1,481,"Shopee","วัสดุก่อสร้าง",null],
  ["2026-11-05",2026,"Yale ลูกบิดประตูห้องน้ำ + ฝักบัว Hafele",7,1239,"Shopee","ระบบน้ำ/สุขภัณฑ์",null],
  ["2026-11-05",2026,"Chaindrite 500ml",1,360,"Shopee","วัสดุก่อสร้าง",null],
  ["2026-11-05",2026,"Maybuck เครื่องพ่นยา 20 ลิตร",1,600,"Shopee","อุปกรณ์ช่าง",null],
  ["2026-05-16",2026,"สีทาผนัง (เทา) + อุปกรณ์ถังน้ำ",null,1697,"ไทวัสดุ","วัสดุก่อสร้าง",null],
  ["2026-05-17",2026,"IMOU Ranger Mini กล้องวงจรปิด",4,2130,"Shopee","CCTV/ระบบความปลอดภัย",null],
  ["2026-05-17",2026,"IMOU Ranger Mini กล้องวงจรปิด",4,2130,"Shopee","CCTV/ระบบความปลอดภัย",null],
  ["2026-05-24",2026,"พัดลม DEWALT พัดลมไร้สาย 7\" 20V รุ่น DCE512-N + คีมและน้ำยากันคลาย",null,3107,"ไทวัสดุ","เครื่องใช้ไฟฟ้า",null],
  ["2026-05-25",2026,"LG เครื่องวักผ้า FB1207S6W",1,6538,"Shopee","เครื่องใช้ไฟฟ้า",null],
  ["2026-05-26",2026,"สีรองพื้นกันซึม Jotun Ultra Primer 3.7L + Nippon A200 เคลือบผิว",2,1122,"Shopee","วัสดุก่อสร้าง",null],
  ["2025-04-04",2025,"ระบบกล้องวงจรปิด (เพิ่มเติม) 1.Dahua XVR5104HS-5M-I3 4 ช่อง (AI) = 1 เครื่อง 2.สาย Glink GLDC+BNC 15 เมตร สาย COAXIAL CABLE สาย RG6 สำเร็จรูป = 4 เส้น 3.Glink GAC-104 adapter for cctv 12v5a 1 out 4 = 1 ชุด 4.Glink PDU09K-BLACK รางปลั๊กไฟ 8 ช่อง = 1 ชุด 5.Dahua HAC-HFW1500TLMP-IL-A กล้องวงจรปิด 5MP = 4 ชุด",11,5384,"","เครื่องใช้ไฟฟ้า",null],
  ["2025-04-19",2025,"เตียงเหล็ก 5f พร้อมฟูก 5f 6 นิ้วสีเทาเข้ม ร้าน ฟาฮาน่า แมทเทรส 2560 จำกัด",2,11800,"","วัสดุก่อสร้าง",null],
  ["2025-04-30",2025,"ไฟ LED 10 ดวง",10,347,"","ระบบไฟฟ้า/แสงสว่าง",null],
  ["2025-05-05",2025,"TP-Link RE305 AC1200",1,1079,"","IT/เครือข่าย",null],
  ["2025-05-05",2025,"HP 680 OG Black",2,349,"","IT/เครือข่าย",null],
  ["2025-05-05",2025,"กล่องกล้องวงจรปิด NANO 200",5,139,"","CCTV/ระบบความปลอดภัย",null],
  ["2025-05-05",2025,"Mouse Logi M196",1,299,"","IT/เครือข่าย",null],
  ["2025-05-05",2025,"โต๊ะไม้สัก 45*45*50 2 ชั้น",2,922,"","เฟอร์นิเจอร์",null],
  ["2025-05-05",2025,"Microwave 20 ลิตร TOSHIBA MWP-MM20P (BK)",2,2776,"","เครื่องใช้ไฟฟ้า",null],
  ["2025-05-05",2025,"เก้าอี้สำนักงาน KATIFIA",5,1644,"","เฟอร์นิเจอร์",null],
  ["2025-06-06",2025,"เครื่องทำน้ำอุ่น SHARP WH-34",2,3131,"","เครื่องใช้ไฟฟ้า",null],
  ["2024-11-03",2024,"ค่าบริการ Horganice 2024",1,1499,"","ค่าบริการ/ค่าธรรมเนียม",null],
  ["2024-06-17",2024,"TCL TAC-XAL18CH",1,12790,"","เครื่องใช้ไฟฟ้า",null],
  ["2024-07-07",2024,"แผงหลอดไฟ Lamton Mini module LED 20W",10,849,"","ระบบไฟฟ้า/แสงสว่าง",null],
  ["2023-01-15",2023,"สีกันซึม Nippon Roofshield 5G",1,12250,"","วัสดุก่อสร้าง",null],
  ["2023-03-15",2023,"เก้าอี้สำนักงาน",1,518,"","เฟอร์นิเจอร์",null],
  ["2023-03-15",2023,"หมึกเครื่องปริ้น HP",2,547,"","IT/เครือข่าย",null],
  ["2023-04-04",2023,"Sandisk 32GB Sdxc",3,500,"","CCTV/ระบบความปลอดภัย",null],
  ["2023-05-05",2023,"ป้าย Exit ทางเดินหนีไฟ",5,1770,"","วัสดุก่อสร้าง",null],
  ["2023-05-28",2023,"ซื้อประตู ปรับปรุงห้องพัก",null,6000,"","วัสดุก่อสร้าง",null],
  ["2023-07-07",2023,"Hoco 10.5 w USB A หัวปลํ๊ก C106",4,242,"","อื่น ๆ",null],
  ["2023-07-19",2023,"ชำระค่าธรรมเนียมเก็บขยะมูลฝอย (เดือนพ.ค.-ธ.ค.66)",8,800,"","ค่าบริการ/ค่าธรรมเนียม",null],
  ["2023-08-19",2023,"เก้าอี้สำนักงาน KUMALL 902-1BK",2,1066,"","เฟอร์นิเจอร์",null],
  ["2023-04-10",2023,"เครื่องขัดผนัง ขัดฝ้า ไร้ฝุ่น 7\" OKURA DWS-180L",1,1698,"","อุปกรณ์ช่าง",null],
  ["2023-05-10",2023,"ชุดไขควงกระแทก Dewalt Dewalt ไขควงกระแทกไร้สาย ไร้แปรงถ่าน 20V Max Atomic (เฉพาะตัวเครื่อง) รุ่น DCF850N-B1 DEWALT แบตเตอรี่ Lithium-ion 5.0Ah 18โวลต์ รุ่น DCB184-B1 DEWALT รุ่น DCB1104-B1 แท่นชาร์จ 12V/20V Max 4A",3,6746,"","อุปกรณ์ช่าง",null],
  ["2023-10-10",2023,"DEWALT สว่านกระแทกไร้สาย (เฉพาะตัวเครื่อง) 18 โวลต์ รุ่น DCD996N-KR",1,3748,"","อุปกรณ์ช่าง",null],
  ["2023-11-11",2023,"ไฟ Solar cell Philip Essential 5 ตัว รับประกัน 1 ปี",5,3915,"","ระบบไฟฟ้า/แสงสว่าง",12],
  ["2023-11-11",2023,"ชั้นวางของเหล็ก Home mark 100*150*30 4 ชั้น",1,931,"","เฟอร์นิเจอร์",null],
  ["2022-02-03",2022,"เครื่องทาบบัตรประตูคีย์การ์ดกันน้ำจากจีน",1,0,"","CCTV/ระบบความปลอดภัย",null],
  ["2022-03-02",2022,"ระบบไฟเครื่องทาบบัตรประตูคีย์การ์ดกันน้ำ",1,0,"","CCTV/ระบบความปลอดภัย",null],
  ["2022-04-30",2022,"Lenovo IdeaCenter 27",1,28900,"","IT/เครือข่าย",null],
  ["2022-04-30",2022,"สายฉีดนำแรงดันสุง (ล้างท่อ)",1,990,"","อื่น ๆ",null],
  ["2022-05-05",2022,"SD Card Micam กล้องวงจรปิด ชั้น 4",1,167,"","CCTV/ระบบความปลอดภัย",null],
  ["2022-05-05",2022,"Queen ชั้นวางของในห้องน้ำ",10,4050,"","ระบบน้ำ/สุขภัณฑ์",null],
  ["2022-05-18",2022,"เก้าอี้สำนักงาน ห้อง 512",1,765,"","เฟอร์นิเจอร์",null],
  ["2022-08-08",2022,"Zinsano ZN1101",1,2580,"","อุปกรณ์ช่าง",null],
  ["2022-10-10",2022,"เครื่องซักผ้า TOSHIBA AW-J800AT(WW)",1,4892,"","เครื่องใช้ไฟฟ้า",null],
  ["2021-05-01",2021,"PANASONIC TIMER SWITCH สวิทช์ตั้งเวลา เครื่องตั้งเวลา นาฬิกาตั้งเวลา พานาโซนิค รุ่น 178NE5T เปิด-ปิดไฟ 24ชั่วโมง 3 เดือน มีการรับประกัน",1,520,"","เครื่องใช้ไฟฟ้า",3],
  ["2021-05-01",2021,"บัตร RFID Card 1.8mm, บัตร Proximity ID Card125 KHz แบบหนา 1.8mm, บัตรคีย์การ์ด 1.8mm จำนวน 50 ใบ (อ่านอย่างเดียว)",2,620,"","CCTV/ระบบความปลอดภัย",null],
  ["2021-01-28",2021,"ตลับเมตรวัดระยะ 20เมตร (สีเหลือง)",1,260,"","อุปกรณ์ช่าง",null],
  ["2021-01-09",2021,"ผ้าม่านติดภายในห้อง",32,0,"","เฟอร์นิเจอร์",null],
  ["2021-01-09",2021,"3.5x6 sc+s 315 ซิป ฟูก",20,40000,"","เฟอร์นิเจอร์",null],
  ["2021-01-09",2021,"5x6 sc+s 315 ซิป ฟูก",15,42000,"","เฟอร์นิเจอร์",null],
  ["2021-11-11",2021,"HIP CMG601 เครื่องทาบบัตรประตูคีย์การ์ดกันน้ำ พร้อมกลอน 270กก. และเครื่องสำรองไฟ 10 ชม. Waterproof Access Control Proximity Card 2000 Users with Magnetic Door Lock and UPS 10 Hrs. 1 ปี การรับประกันจากโรงงานในประเทศ",1,1800,"","ระบบไฟฟ้า/แสงสว่าง",12],
  ["2020-01-28",2020,"LINK, สาย RG6 6/U Cable Shield 95% สีดำ ความยาว 100 เมตร ใช้กับงาน กล้องวงจรปิด รุ่น CB-0106A-1 จัดส่งฟรีทั่วประเทศ, สินค้ารับประกันศูนย์ยาวนาน 30 ปี, รับติดตั้งวางระบบกล้องวงจรปิด ระบบกันขโมย ระบบ Network",1,485,"","CCTV/ระบบความปลอดภัย",360],
  ["2020-01-28",2020,"สปริงดัดท่อ สปริงดัดท่อPVC สปริงดัดท่อร้อยสายไฟ เกรด A Nano ขนาด 16มม. 20มม. 25มม. 32มม. 3หุน 4หุน 6หุน 1นิ้ว",1,78,"","ระบบไฟฟ้า/แสงสว่าง",null],
  ["2020-01-28",2020,"กล่องกันน้ำพลาสติก Nano 4x4 สีขาว บ็อกกันน้ำ บ๊อกกันน้ำ บ็อกพัก บ๊อกพัก กล่องกันน้ำ Junction box",15,390,"","วัสดุก่อสร้าง",null],
  ["2020-02-12",2020,"กันชนประตูกันชนแบบติดผนัง 120CM",2,128,"","วัสดุก่อสร้าง",null],
  ["2020-12-02",2020,"หัว BNC F-Type x 50",50,290,"","CCTV/ระบบความปลอดภัย",null],
  ["2020-04-26",2020,"BOSCH เครื่องเจียร์ BOSCH GWS 060 +ใบตัดเพชร 4นิ้ว +ใบเจียร 4นิ้ว 6mm.+ใบตัดเหล็ก 4นิ้ว 2.5mm.แถมฟรี!! และแว่นนิรภัย YS120 ของแท้ 100% ส่งฟรี KERRY ร้านเป็นตัวแทนจำหน่ายโดยตรง 6 เดือน การรับประกันจากโรงงานในประเทศ",1,969,"","อุปกรณ์ช่าง",6],
  ["2020-07-05",2020,"เครื่องปรับอากาศ Diakin",21,294000,"","เครื่องใช้ไฟฟ้า",null],
  ["2020-06-21",2020,"LINNMON N TBL TP 100X60 WHITE AP ท๊อปโต๊ะ",24,8376,"","เฟอร์นิเจอร์",null],
  ["2020-06-21",2020,"ไฟเพดาน LAMPTAN LED CEILING LIGHT STAR/14W/DL",135,43065,"","ระบบไฟฟ้า/แสงสว่าง",null],
  ["2020-06-28",2020,"เตียงเหล็กคอนโด ขนาด 3.5",1,2950,"","เฟอร์นิเจอร์",null],
  ["2020-06-28",2020,"เตียงเหล็กคอนโด ขนาด 5",1,3950,"","เฟอร์นิเจอร์",null],
  ["2020-06-28",2020,"เตียงเหล็กคอนโด ขนาด 3.5",19,15000,"","เฟอร์นิเจอร์",null],
  ["2020-06-28",2020,"เตียงเหล็กคอนโด ขนาด 5",14,15000,"","เฟอร์นิเจอร์",null],
  ["2020-09-09",2020,"SHARP เครื่องทำน้ำอุ่น (3500 วัตต์) รุ่น WH-34",8,13504,"","เครื่องใช้ไฟฟ้า",null],
  ["2020-09-09",2020,"TOSHIBA ตูู้เย็น 2 ประตู (6.4 คิว, สีเงิน) รุ่น GR-B22KP(SS)",8,44784,"","เครื่องใช้ไฟฟ้า",null],
  ["2020-09-09",2020,"TOSHIBA ตูู้เย็น 2 ประตู (6.4 คิว, สีเงิน) รุ่น GR-B22KP(SS)",10,55980,"","เครื่องใช้ไฟฟ้า",null],
  ["2020-09-09",2020,"Sharp เครื่องทำน้ำอุ่น 3500 วัตต์ รุ่น WH-34 5 ปี มีการรับประกัน",5,8450,"","เครื่องใช้ไฟฟ้า",60],
  ["2020-09-09",2020,"Sharp เครื่องทำน้ำอุ่น 3500 วัตต์ รุ่น WH-34 5 ปี มีการรับประกัน",10,16900,"","เครื่องใช้ไฟฟ้า",60],
  ["2020-09-09",2020,"Sharp เครื่องทำน้ำอุ่น 3500 วัตต์ รุ่น WH-34 5 ปี มีการรับประกัน",15,25350,"","เครื่องใช้ไฟฟ้า",60],
  ["2020-10-10",2020,"Toshiba ตู้เย็น 2 ประตู ขนาด 6.4 คิว รุ่น GR-B22KP(SS) 1 ปี การรับประกันจากโรงงานในประเทศ",1,5539,"","เครื่องใช้ไฟฟ้า",12],
  ["2020-10-10",2020,"Toshiba ตู้เย็น 2 ประตู ขนาด 6.4 คิว รุ่น GR-B22KP(SS) 1 ปี การรับประกันจากโรงงานในประเทศ",5,27395,"","เครื่องใช้ไฟฟ้า",12],
  ["2020-11-11",2020,"Sandisk Micro Ultra Lite Speed 100MB , 32GB ,C10, UHS-1,R, 3x5 - (SDSQUNR-032G-GN3MN) 7 ปี มีการรับประกัน",2,230,"","CCTV/ระบบความปลอดภัย",84],
  ["2020-11-11",2020,"(2020 รุ่นใหม่ล่าสุด) กล้องวงจรปิด cctv Xiaomi IMILAB CCTV A1 ถ่ายได้360องศา ความชัด3ล้านพิกเซ่ล ถ่ายกลางคืนชัด อัพเกรดจากรุ่น2019 Mijia Camera 1 ปี การรับประกันโดยผู้ขายจากต่างประเทศ",2,1633,"","เครื่องใช้ไฟฟ้า",12],
  ["2020-11-11",2020,"MITSUBISHI พัดลมติดผนังแบบเชือกดึง 16 นิ้ว รุ่น W16-GZ รับประกันมอเตอร์ 5 ปี อะไหล่ทั่วไป 1 ปี",3,4270,"","เครื่องใช้ไฟฟ้า",60],
  ["2020-11-11",2020,"Seagate 2TB SkyHawk HDD CCTV Internal ST2000VX008 BY N.T Computer 3 ปี มีการรับประกันจากผู้ให้บริการ",1,1540,"","เครื่องใช้ไฟฟ้า",36],
  ["2020-11-11",2020,"Mitsubishi Mitsubishi พัดลมติดผนัง /ใบพัด 16 นิ้ว (ควบคุมแบบเชือก) รุ่น W16-GZ 1 ปี การรับประกันจากโรงงานในประเทศ",8,11520,"","เครื่องใช้ไฟฟ้า",12],
  ["2020-11-11",2020,"HIP CMG601 เครื่องทาบบัตรประตูคีย์การ์ดกันน้ำ พร้อมกลอน 270กก. และเครื่องสำรองไฟ 10 ชม. Waterproof Access Control Proximity Card 2000 Users with Magnetic Door Lock and UPS 10 Hrs. 1 ปี การรับประกันจากโรงงานในประเทศ",1,4275,"","ระบบไฟฟ้า/แสงสว่าง",12],
  ["2020-11-11",2020,"Dahua กล้องวงจรปิดต้าหัว ชุดกล้อง 8 ตัว 2 ล้านพิกเซล XVR5108HS-X + HFW1239TLM-A-LED Full-color starlight ภาพสีตลอดเวลา ไม่รวม Adaptor รับประกันศูนย์ไทย 3 ปี 3 ปี มีการรับประกัน",8,7400,"","ระบบไฟฟ้า/แสงสว่าง",36],
  ["2020-12-17",2020,"12V 2A Adapter อะแดพเตอร์มาตรฐาน มีไฟ LED บอกสถานะ จ่ายไฟเต็ม",5,288,"","ระบบไฟฟ้า/แสงสว่าง",null],
  ["2020-12-17",2020,"กันชนประตูกันชนแบบติดผนัง 95CM",18,1172,"","วัสดุก่อสร้าง",null],
  ["2020-12-17",2020,"MAKITA สว่านไร้สาย 68V 3ระบบ (งานไต้หวันAAA) 3 เดือน มีการรับประกันจากผู้ขาย",1,943,"","อุปกรณ์ช่าง",3],
  ["2020-12-24",2020,"กรรไกรตัดท่อ PVC SOLO No.A5542 (รุ่นอัพเกรด ปี2020)",1,192,"","อุปกรณ์ช่าง",null],
  ["2020-12-24",2020,"คอนเน็ตเตอร์ ข้อต่อเข้ากล่อง ท่อขาว UPVC 16 มิล",30,185,"","วัสดุก่อสร้าง",null],
  ["2020-12-28",2020,"อุปกรณ์ลวดร้อยสายไฟ พร้อมสายเคเบิลสำหรับดึง 10M",1,214,"","ระบบไฟฟ้า/แสงสว่าง",null],
];

/** ประวัติล้างแอร์ [ห้อง, วันที่ดำเนินการ] */
var SEED_AC = [
  ["112","2025-03-30"],
  ["114","2025-03-30"],
  ["211","2024-12-10"],
  ["211","2025-03-30"],
  ["212","2025-03-30"],
  ["212","2026-04-26"],
  ["214","2025-03-30"],
  ["214","2026-05-23"],
  ["215","2025-07-28"],
  ["215","2026-03-25"],
  ["216","2026-05-23"],
  ["311","2024-03-09"],
  ["311","2025-03-30"],
  ["311","2026-03-01"],
  ["312","2024-03-09"],
  ["312","2025-03-30"],
  ["312","2026-04-05"],
  ["314","2025-03-30"],
  ["314","2026-08-23"],
  ["315","2025-03-30"],
  ["316","2025-03-30"],
  ["316","2026-03-01"],
  ["411","2025-03-30"],
  ["411","2026-03-01"],
  ["412","2026-08-23"],
  ["414","2025-08-03"],
  ["414","2026-04-05"],
  ["415","2026-03-08"],
  ["416","2025-03-30"],
  ["416","2026-08-23"],
  ["511","2025-03-30"],
  ["511","2026-08-23"],
  ["512","2025-03-30"],
  ["512","2026-04-04"],
  ["514","2024-01-14"],
  ["514","2026-04-04"],
  ["515","2025-07-28"],
  ["515","2026-03-08"],
  ["516","2024-01-14"],
  ["516","2025-08-03"],
  ["516","2026-04-04"],
];

/** ประวัติซ่อมแซมตามห้อง [ห้อง, ปี, วันที่ซ่อม, รายการ] */
var SEED_ROOM_REPAIRS = [
  ["111",2025,"2025-06-28","1.ยาแนว 2.เก็บสีห้อง 3.เก็บสีเฟอร์นิเจอร์"],
  ["112",2024,"","1.ยาแนว 2.เก็บสีห้อง 3.เก็บสีเฟอร์นิเจอร์"],
  ["112",2025,"2025-06-28","1.ยาแนว 2.เก็บสีห้อง 3.เก็บสีเฟอร์นิเจอร์"],
  ["114",2024,"","1.ยาแนว 2.เก็บสีห้อง 3.เก็บสีเฟอร์นิเจอร์"],
  ["114",2025,"2025-06-28","1.ยาแนว 2.เก็บสีห้อง 3.เก็บสีเฟอร์นิเจอร์"],
  ["211",2025,"2025-06-28","1.ยาแนว 2.เก็บสีห้อง 3.เก็บสีเฟอร์นิเจอร์"],
  ["212",2025,"2025-06-28","1.ยาแนว 2.เก็บสีห้อง 3.เก็บสีเฟอร์นิเจอร์"],
  ["212",2026,"2026-04-26","1.ทาสี 2.ท่อน้ำทิ้ง 3.ทำความสะอาด"],
  ["214",2025,"2025-06-28","1.ยาแนว 2.เก็บสีห้อง 3.เก็บสีเฟอร์นิเจอร์"],
  ["215",2024,"2024-09-13","1.เปลี่ยนหัวฉีดชำระ"],
  ["215",2025,"2025-06-28","1.ยาแนว 2.เก็บสีห้อง 3.เก็บสีเฟอร์นิเจอร์"],
  ["311",2026,"2026-02-15","1.ทาสี 2.ทำความสะอาด 3.ล้างแอร์ 4.เปลี่ยนก๊อกน้ำล้างจาน+ท่อน้ำทิ้ง 5.ตาข่ายกันนก"],
  ["312",2024,"2024-08-28","1.เปลี่ยนสายชำระ 2.หัวฉีดชำระ"],
  ["312",2025,"2025-06-28","1.ยาแนว 2.เก็บสีห้อง 3.เก็บสีเฟอร์นิเจอร์"],
  ["314",2025,"2025-06-28","1.เปลี่ยนประตูห้องน้ำและอุปกรณ์ 2.ยาแนว 3.เก็บสีห้อง 4.เก็บสีเฟอร์นิเจอร์"],
  ["314",2026,"2026-02-15","1.ทำความสะอาด 2.ล้างแอร์ 3.เปลี่ยนก๊อกน้ำล้างจาน+ท่อน้ำทิ้ง 4.ยาแนว"],
  ["315",2024,"2024-05-25","1.ยาแนวอ่างล้างหน้า"],
  ["315",2024,"2024-09-15","1.ยาแนว 2.เก็บสีห้อง 3.เก็บสีเฟอร์นิเจอร์"],
  ["316",2024,"2024-07-06",""],
  ["316",2024,"","1.ยาแนว 2.เก็บสีห้อง 3.เก็บสีเฟอร์นิเจอร์ 4.เปลี่ยนหลอดไฟห้อง ด้านหน้า+ห้องน้ำ"],
  ["316",2025,"","1.ยาแนว 2.เก็บสีห้อง 3.เก็บสีเฟอร์นิเจอร์"],
  ["411",2026,"2026-02-15","1.ทาสี 2.ทำความสะอาด 3.ล้างแอร์ 4.ทาสี Furniture 5.เปลี่ยนหัว+สายฉีดชำระ 6.เปลี่ยนก๊อกน้ำล้างจาน+ท่อน้ำทิ้ง 7.ตาข่ายกันนก"],
  ["412",2025,"2025-06-12","1.เปลี่ยนเครื่องทำน้ำอุ่น 2.เปลี่ยนก๊อกอ่างล้างหน้า"],
  ["414",2023,"2023-07-05","1.เปลี่ยนก๊อกน้ำ"],
  ["414",2024,"","1.ยาแนว 2.เก็บสีห้อง 3.เก็บสีเฟอร์นิเจอร์"],
  ["415",2024,"2024-01-14","1.เปลี่ยนสายยางน้ำเข้าซิงค์ล้างจาน"],
  ["415",2024,"2024-09-13","1.เปลี่ยนหัวฉีดชำระ"],
  ["415",2025,"","1.ยาแนว 2.เก็บสีห้อง 3.เก็บสีเฟอร์นิเจอร์"],
  ["415",2026,"2026-03-01","1.ทาสี 2.ทำความสะอาด 3.ล้างแอร์ 4.ไฟเพดาน 1 ดวง"],
  ["416",2024,"2024-06-02","1.เปลี่ยนสายยางน้ำเข้าซิงค์ล้างจาน"],
  ["416",2024,"","1.ยาแนว 2.เก็บสีห้อง 3.เก็บสีเฟอร์นิเจอร์"],
  ["511",2023,"","1.เปลี่ยนสายยางน้ำฉีดชำระ"],
  ["511",2025,"","1.ยาแนว 2.เก็บสีห้อง 3.เก็บสีเฟอร์นิเจอร์"],
  ["512",2025,"","1.ยาแนว 2.เก็บสีห้อง 3.เก็บสีเฟอร์นิเจอร์"],
  ["514",2023,"2023-07-05","1.เปลี่ยนหัวฉีดชำระชักโครก 2.สายซิงค์ล้างจาน 3.เก็บสีห้อง"],
  ["514",2025,"","1.ยาแนว 2.เก็บสีห้อง 3.เก็บสีเฟอร์นิเจอร์"],
  ["514",2026,"2026-04-26","1.ทำความสะอาด 2.ล้างแอร์ 3.ทาสี"],
  ["515",2026,"2026-03-08","1.ทำความสะอาด 2.ล้างแอร์ 3.เปลี่ยนก๊อกน้ำล้างจาน+ท่อน้ำทิ้ง 4.ยาแนว 5.ทาสี"],
  ["516",2024,"2024-06-08",""],
  ["516",2024,"","1.ยาแนว 2.เก็บสีห้อง 3.เก็บสีเฟอร์นิเจอร์"],
  ["516",2025,"","1.ยาแนว 2.เก็บสีห้อง 3.เก็บสีเฟอร์นิเจอร์"],
  ["516",2026,"2026-04-26","1.ทำความสะอาด 2.ล้างแอร์ 3.ทาสี"],
];

/** งานซ่อมแซมตึกโดยรวมที่บันทึกไว้เดิม */
var SEED_BUILDING = [
  { year: 2023, zone: 'ดาดฟ้า/กันซึม', title: 'ทากันซึมดาดฟ้า', endDate: '', status: 'เสร็จสิ้น', note: 'ใช้สีกันซึม Nippon Roofshield 5G' },
  { year: 2023, zone: 'ท่อน้ำเสีย/ท่อระบายน้ำ', title: 'ล้างท่อน้ำเสียตึกทั้งอาคาร', endDate: '', status: 'เสร็จสิ้น', note: 'ครอบคลุมทั้ง 24 ห้อง' },
  { year: 2026, zone: 'ดาดฟ้า/กันซึม', title: 'ทากันซึมดาดฟ้า (รอบที่ 2)', endDate: '', status: 'เสร็จสิ้น', note: '' },
  { year: 2026, zone: 'ระบบน้ำประปา', title: 'ค่าติดตั้งการประปาส่วนภูมิภาค', endDate: '2026-08-07', status: 'เสร็จสิ้น', note: 'ค่าใช้จ่าย 3,036 บาท' }
];


/** รายรับ-รายจ่ายประจำเดือนของหอ 32 รายการ [วันที่, รายการ, จำนวนเงิน, หมายเหตุ] */
var SEED_FINANCE = [
  ["2026-01-19","ค่าน้ำประปา",677.36,"ค่าน้ำเดือน ธ.ค."],
  ["2026-01-25","ค่าอินเทอร์เน็ต",1923.86,""],
  ["2026-01-31","ค่าไฟฟ้า",8500.43,""],
  ["2026-02-10","รายรับค่าเช่า",82866.8,""],
  ["2026-02-19","ค่าน้ำประปา",629.98,"ค่าน้ำเดือน ม.ค."],
  ["2026-02-25","ค่าอินเทอร์เน็ต",1685.7,""],
  ["2026-03-10","ค่าไฟฟ้า",9121.35,""],
  ["2026-03-10","รายรับค่าเช่า",82731.8,""],
  ["2026-03-10","รายรับค่าเช่า",82879.1,""],
  ["2026-03-10","รายรับค่าเช่า",91298,""],
  ["2026-03-19","ค่าน้ำประปา",495.75,"ค่าน้ำเดือน ก.พ."],
  ["2026-04-07","ค่าอินเทอร์เน็ต",1602.86,""],
  ["2026-04-10","ค่าไฟฟ้า",10929.77,""],
  ["2026-04-19","ค่าน้ำประปา",548.87,"ค่าน้ำเดือน มี.ค."],
  ["2026-05-08","ค่าอินเทอร์เน็ต",1602.86,""],
  ["2026-05-11","ค่าไฟฟ้า",10487.01,""],
  ["2026-05-19","ค่าน้ำประปา",548.87,"ค่าน้ำเดือน เม.ย."],
  ["2026-05-20","รายรับค่าเช่า",93195,""],
  ["2026-05-25","ค่าอินเทอร์เน็ต",1602.86,""],
  ["2026-06-15","ค่าน้ำประปา",797.73,"ค่าน้ำเดือน พ.ค."],
  ["2026-06-25","ค่าอินเทอร์เน็ต",1602.86,""],
  ["2026-06-30","ค่าไฟฟ้า",15540.51,""],
  ["2026-07-19","ค่าน้ำประปา",1019.07,"ค่าน้ำเดือน มิ.ย."],
  ["2026-07-31","ค่าอินเทอร์เน็ต",1602.86,"[บัตรเครดิต]"],
  ["2026-08-02","ค่าอินเทอร์เน็ต",1602.86,"[บัตรเครดิต]"],
  ["2026-08-02","ค่าไฟฟ้า",17599.37,""],
  ["2026-08-10","รายรับค่าเช่า",119513,""],
  ["2026-08-16","ค่าน้ำประปา",1293.93,"ค่าน้ำเดือนกรกฎาคม"],
  ["2026-08-31","ค่าไฟฟ้า",14345.52,""],
  ["2026-09-10","รายรับค่าเช่า",123127,""],
  ["2026-10-06","ค่าไฟฟ้า",13151.54,""],
  ["2026-10-07","รายรับค่าเช่า",134952,""],
];

/* ------------------------------------------------------------------ */
/*  ตัวรันการนำเข้า                                                     */
/* ------------------------------------------------------------------ */

/**
 * นำเข้าข้อมูลเดิมทั้งหมด — รันครั้งเดียวหลัง setupSystem()
 * ถ้าอยากรันซ้ำ ให้ลบ Property 'SEEDED_V1' ก่อน (หรือเรียก resetSeedFlag())
 */
function seedHistoricalData() {
  if (props_().getProperty(SEED_FLAG) === 'done') {
    var already = 'นำเข้าข้อมูลเดิมไปแล้ว — ถ้าต้องการนำเข้าซ้ำ ให้รัน resetSeedFlag() ก่อน';
    alert_(already);
    return already;
  }

  setupSystem();

  // กันข้อมูลซ้ำ: ถ้าชีตมีข้อมูลอยู่แล้ว (เช่นได้ไฟล์ที่เตรียมมาให้) ไม่ต้องนำเข้าอีก
  var existing = readRows_(SHEETS.PURCHASES).length + readRows_(SHEETS.DEBT_PAYMENTS).length;
  if (existing > 0) {
    props_().setProperty(SEED_FLAG, 'done');
    var msg0 = 'ชีตนี้มีข้อมูลอยู่แล้ว (' + existing + ' รายการ) จึงข้ามการนำเข้าเพื่อไม่ให้ข้อมูลซ้ำ\n\n' +
               'ถ้าต้องการนำเข้าใหม่จริง ๆ ให้ลบข้อมูลในชีตก่อน แล้วรัน resetSeedFlag() ตามด้วย seedHistoricalData()';
    alert_(msg0);
    return msg0;
  }

  var stat = {
    debts: seedDebts_(),
    payments: seedDebtPayments_(),
    purchases: seedPurchases_(),
    ac: seedAc_(),
    roomRepairs: seedRoomRepairs_(),
    building: seedBuilding_(),
    finance: seedFinance_(),
    assets: seedAssetsFromPurchases_()
  };

  props_().setProperty(SEED_FLAG, 'done');
  logActivity_('seed', 'ทั้งระบบ', stat);

  var msg = 'นำเข้าข้อมูลเดิมเรียบร้อย\n\n' +
    '• ก้อนหนี้: ' + stat.debts + ' รายการ\n' +
    '• รายการโอนใช้หนี้: ' + stat.payments + ' รายการ\n' +
    '• รายการซื้อของ: ' + stat.purchases + ' รายการ\n' +
    '• ล้างแอร์: ' + stat.ac + ' ครั้ง\n' +
    '• ซ่อมแซมตามห้อง: ' + stat.roomRepairs + ' รายการ\n' +
    '• ซ่อมแซมตึกโดยรวม: ' + stat.building + ' รายการ\n' +
    '• รายรับ-รายจ่ายรายเดือน: ' + stat.finance + ' รายการ\n' +
    '• ทรัพย์สินประจำห้อง: ' + stat.assets + ' รายการ';
  alert_(msg);
  return msg;
}

function resetSeedFlag() {
  props_().deleteProperty(SEED_FLAG);
  return 'ล้าง flag แล้ว — เรียก seedHistoricalData() ได้อีกครั้ง (ระวังข้อมูลซ้ำ)';
}

function seedDebts_() {
  var rows = SEED_DEBTS.map(function (d) {
    return {
      id: uid_('DEBT'), ledger: d.ledger, title: d.title, parentId: '', creditor: d.creditor,
      startDate: d.startDate, principal: d.principal, interestPerMonth: d.interestPerMonth,
      dueDay: d.dueDay, planPerMonth: d.planPerMonth, status: d.status,
      note: d.note, updatedAt: new Date()
    };
  });

  // เงินยืมป้าตาคือทุนที่ใช้ซื้อที่ดิน จึงเป็นส่วนหนึ่งของหนี้ซื้อที่ดิน ไม่ใช่หนี้อีกก้อน
  var land = null, pata = null;
  rows.forEach(function (d) {
    if (!land && d.title.indexOf('ซื้อที่ดิน') >= 0) land = d;
    if (!pata && d.title.indexOf('ป้าตา') >= 0) pata = d;
  });
  if (land && pata) pata.parentId = land.id;

  return bulkInsert_(SHEETS.DEBTS, rows);
}

function seedDebtPayments_() {
  var main = SEED_DEBT_PAYMENTS.map(function (p) {
    return {
      id: uid_('PAY'), debtId: '', ledger: 'หนี้หลัก',
      payDate: p.payDate, year: Number(p.payDate.slice(0, 4)),
      installment: p.installment, principal: p.amount, interest: 0, amount: p.amount,
      channel: 'โอนธนาคาร', payer: '', slips: [],
      note: 'นำเข้าจากชีตเดิม', updatedAt: new Date()
    };
  });
  var sub = SEED_INTEREST_PAYMENTS.map(function (p) {
    return {
      id: uid_('PAY'), debtId: '', ledger: 'หนี้รอง',
      payDate: p.payDate, year: Number(p.payDate.slice(0, 4)),
      installment: '', principal: 0, interest: p.amount, amount: p.amount,
      channel: 'โอน QR', payer: '', slips: [],
      note: 'ดอกเบี้ยป้าตา — นำเข้าจากชีตเดิม', updatedAt: new Date()
    };
  });
  return bulkInsert_(SHEETS.DEBT_PAYMENTS, main.concat(sub));
}

function seedPurchases_() {
  var rows = SEED_PURCHASES.map(function (p) {
    var buyDate = p[0], year = p[1], item = p[2], qty = p[3],
        price = p[4], vendor = p[5], category = p[6], warrantyMonths = p[7];
    var end = '';
    if (buyDate && warrantyMonths && warrantyMonths < 900) {
      end = toIsoDate_(addMonths_(buyDate, warrantyMonths));
    }
    return {
      id: uid_('BUY'), buyDate: buyDate, year: year, item: item, category: category,
      qty: qty, unit: '', price: price, vendor: vendor, payer: '',
      warrantyMonths: (warrantyMonths && warrantyMonths >= 900) ? null : warrantyMonths,
      warrantyEnd: end, room: '', photos: [], slips: [],
      note: (warrantyMonths && warrantyMonths >= 900) ? 'รับประกันตลอดอายุการใช้งาน' : '',
      updatedAt: new Date()
    };
  });
  return bulkInsert_(SHEETS.PURCHASES, rows);
}

function seedAc_() {
  var perRoomYear = {};
  var rows = SEED_AC.map(function (a) {
    var room = a[0], date = a[1];
    var year = Number(date.slice(0, 4));
    var key = room + '|' + year;
    perRoomYear[key] = (perRoomYear[key] || 0) + 1;
    return {
      id: uid_('AC'), room: room, year: year, round: perRoomYear[key],
      bookDate: date, serviceDate: date, status: 'ดำเนินการแล้ว',
      technician: '', cost: null, photos: [],
      note: 'นำเข้าจากชีตเดิม', updatedAt: new Date()
    };
  });
  return bulkInsert_(SHEETS.AC_SERVICE, rows);
}

function seedRoomRepairs_() {
  var rows = SEED_ROOM_REPAIRS.map(function (r) {
    var room = r[0], year = r[1], date = r[2], items = r[3];
    return {
      id: uid_('FIX'), room: room, year: year,
      reportDate: '', bookDate: date, repairDate: date,
      category: guessRepairCategory_(items),
      items: items || '(ไม่ได้ระบุรายการ)',
      priority: 'ปกติ', status: 'เสร็จสิ้น', technician: '', cost: null,
      photosBefore: [], photosAfter: [],
      note: date ? 'นำเข้าจากชีตเดิม' : 'นำเข้าจากชีตเดิม (ชีตเดิมระบุเฉพาะปี ไม่มีวันที่)',
      updatedAt: new Date()
    };
  });
  return bulkInsert_(SHEETS.ROOM_REPAIRS, rows);
}

function guessRepairCategory_(text) {
  var s = String(text || '');
  if (/ก๊อก|ท่อน้ำ|ซิงค์|ฉีดชำระ|สายชำระ|ชักโครก|อ่างล้าง|ยาแนว/.test(s)) return 'ระบบน้ำ/สุขภัณฑ์';
  if (/น้ำอุ่น/.test(s)) return 'เครื่องทำน้ำอุ่น';
  if (/แอร์/.test(s)) return 'แอร์';
  if (/หลอดไฟ|ไฟเพดาน|ไฟฟ้า/.test(s)) return 'ระบบไฟฟ้า';
  if (/ประตู|กุญแจ|ลูกบิด/.test(s)) return 'ประตู/หน้าต่าง/กุญแจ';
  if (/สี|ทาสี|ฝ้า|ผนัง/.test(s)) return 'สี/ผนัง/ฝ้า';
  if (/เฟอร์นิเจอร์|ชั้นวาง|เตียง|โต๊ะ/.test(s)) return 'เฟอร์นิเจอร์';
  if (/ทำความสะอาด/.test(s)) return 'ทำความสะอาด';
  return 'อื่น ๆ';
}

function seedBuilding_() {
  var rows = SEED_BUILDING.map(function (b) {
    return {
      id: uid_('BLD'), year: b.year, zone: b.zone, title: b.title,
      bookDate: '', startDate: '', endDate: b.endDate, status: b.status,
      contractor: '', cost: null, nextDue: '', photos: [], slips: [],
      note: b.note, updatedAt: new Date()
    };
  });
  return bulkInsert_(SHEETS.BUILDING_REPAIRS, rows);
}

/**
 * สร้างทะเบียนทรัพย์สินประจำห้องจากรายการซื้อของที่เป็นเครื่องใช้ไฟฟ้าติดห้อง
 * (แอร์ 21 ตัว, เครื่องทำน้ำอุ่น, ตู้เย็น — ซื้อเป็นล็อตปี 2020)
 * ใส่เป็นโครงว่างให้เจ้าของกรอกยี่ห้อ/ซีเรียลเพิ่มภายหลัง
 */
function seedAssetsFromPurchases_() {
  var rows = [];
  ROOMS.forEach(function (room) {
    rows.push(asset_(room, 'เครื่องปรับอากาศ', 'Daikin', '2020-07-05'));
    rows.push(asset_(room, 'เครื่องทำน้ำอุ่น', 'Sharp WH-34', '2020-09-09'));
    rows.push(asset_(room, 'ตู้เย็น', 'Toshiba GR-B22KP', '2020-09-09'));
  });
  return bulkInsert_(SHEETS.ASSETS, rows);
}

function asset_(room, name, brand, installDate) {
  return {
    id: uid_('AST'), room: room, name: name, brand: brand, serial: '',
    installDate: installDate, purchaseId: '', warrantyEnd: '',
    status: 'ใช้งานปกติ', note: 'สร้างอัตโนมัติตอนนำเข้าข้อมูล — แก้ไขได้', updatedAt: new Date()
  };
}

function seedFinance_() {
  var rows = SEED_FINANCE.map(function (f) {
    var date = f[0], kind = f[1], amount = f[2], note = f[3];
    var d = toDate_(date);
    return {
      id: uid_('FIN'), date: date, year: d.getFullYear(), month: d.getMonth() + 1,
      flow: isIncome_(kind) ? 'รายรับ' : 'รายจ่าย', kind: kind, amount: amount,
      billMonth: note.replace(/^ค่าน้ำเดือน\s*/, ''), channel: 'โอน QR', slips: [],
      note: note, updatedAt: new Date()
    };
  });
  return bulkInsert_(SHEETS.FINANCE, rows);
}


/* ══════════════════════════════════════════════════════════════
   Finance.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * Finance.gs — รายรับ-รายจ่ายประจำเดือนของหอพัก
 *   ค่าเช่าที่เก็บได้ · ค่าไฟ · ค่าน้ำ · ค่าเน็ต · ภาษี · ค่าธรรมเนียม
 * ใช้ดูกำไรขาดทุนจากการดำเนินงานจริงในแต่ละเดือน/ปี
 */

function isIncome_(kind) {
  return INCOME_KINDS.indexOf(String(kind)) >= 0;
}

function listFinance_(year, kind) {
  var rows = readRows_(SHEETS.FINANCE);
  if (year && year !== 'all') {
    rows = rows.filter(function (r) { return String(r.year || yearOf_(r.date)) === String(year); });
  }
  if (kind && kind !== 'all') rows = rows.filter(function (r) { return r.kind === kind; });
  rows.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  return rows.map(function (r) { r.slipRefs = toFileRefs_(r.slips); return r; });
}

var TH_MONTH_NAMES = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function financeSummary_(year) {
  var all = readRows_(SHEETS.FINANCE);
  var scope = (year && year !== 'all')
    ? all.filter(function (r) { return String(r.year || yearOf_(r.date)) === String(year); })
    : all;

  var income = sum_(scope.filter(function (r) { return isIncome_(r.kind); }), function (r) { return r.amount; });
  var expense = sum_(scope.filter(function (r) { return !isIncome_(r.kind); }), function (r) { return r.amount; });

  // แยกรายเดือน
  var byMonthMap = {};
  scope.forEach(function (r) {
    var m = r.month || (toDate_(r.date) ? toDate_(r.date).getMonth() + 1 : null);
    if (!m) return;
    if (!byMonthMap[m]) byMonthMap[m] = { month: Number(m), label: TH_MONTH_NAMES[m - 1], income: 0, expense: 0 };
    var amt = toNumber_(r.amount) || 0;
    if (isIncome_(r.kind)) byMonthMap[m].income += amt; else byMonthMap[m].expense += amt;
  });
  var byMonth = [];
  for (var m = 1; m <= 12; m++) {
    var row = byMonthMap[m] || { month: m, label: TH_MONTH_NAMES[m - 1], income: 0, expense: 0 };
    row.net = round2_(row.income - row.expense);
    row.income = round2_(row.income);
    row.expense = round2_(row.expense);
    byMonth.push(row);
  }

  // แยกตามรายการ
  var byKindMap = {};
  scope.forEach(function (r) {
    var k = r.kind || 'ค่าใช้จ่ายอื่น ๆ';
    if (!byKindMap[k]) byKindMap[k] = { kind: k, total: 0, count: 0, income: isIncome_(k) };
    byKindMap[k].total += toNumber_(r.amount) || 0;
    byKindMap[k].count++;
  });
  var byKind = Object.keys(byKindMap).map(function (k) { return byKindMap[k]; })
    .sort(function (a, b) { return b.total - a.total; });

  // แยกตามปี
  var byYearMap = {};
  all.forEach(function (r) {
    var y = r.year || yearOf_(r.date);
    if (!y) return;
    if (!byYearMap[y]) byYearMap[y] = { year: Number(y), income: 0, expense: 0 };
    var amt = toNumber_(r.amount) || 0;
    if (isIncome_(r.kind)) byYearMap[y].income += amt; else byYearMap[y].expense += amt;
  });
  var byYear = Object.keys(byYearMap).map(function (k) {
    var y = byYearMap[k];
    y.net = round2_(y.income - y.expense);
    y.income = round2_(y.income); y.expense = round2_(y.expense);
    return y;
  }).sort(function (a, b) { return b.year - a.year; });

  var monthsWithData = byMonth.filter(function (m) { return m.income || m.expense; }).length;

  return {
    year: year || 'all',
    years: uniqueYears_(all, ['date']),
    income: round2_(income),
    expense: round2_(expense),
    net: round2_(income - expense),
    margin: income > 0 ? round2_((income - expense) / income * 100) : 0,
    avgIncome: monthsWithData ? round2_(income / monthsWithData) : 0,
    avgExpense: monthsWithData ? round2_(expense / monthsWithData) : 0,
    monthsWithData: monthsWithData,
    count: scope.length,
    byMonth: byMonth,
    byKind: byKind,
    byYear: byYear
  };
}

function saveFinance_(obj) {
  var d = toDate_(obj.date);
  obj.year = (d ? d.getFullYear() : null) || obj.year || new Date().getFullYear();
  obj.month = (d ? d.getMonth() + 1 : null) || obj.month || null;
  obj.flow = isIncome_(obj.kind) ? 'รายรับ' : 'รายจ่าย';
  obj.updatedAt = new Date();

  if (obj.id) {
    var found = findRow_(SHEETS.FINANCE, obj.id);
    if (found) {
      logActivity_('แก้ไขรายรับ-รายจ่าย', obj.id, obj.kind + ' ' + obj.amount);
      return updateRow_(SHEETS.FINANCE, found._row, Object.assign({}, found, obj));
    }
  }
  obj.id = obj.id || uid_('FIN');
  logActivity_('เพิ่มรายรับ-รายจ่าย', obj.id, obj.kind + ' ' + obj.amount);
  return insertRow_(SHEETS.FINANCE, obj);
}

function deleteFinance_(id) {
  var found = findRow_(SHEETS.FINANCE, id);
  if (!found) throw new Error('ไม่พบรายการ: ' + id);
  deleteRow_(SHEETS.FINANCE, found._row);
  logActivity_('ลบรายรับ-รายจ่าย', id, found.kind);
  return true;
}

/** บิลที่ยังไม่ได้บันทึกของเดือนปัจจุบัน — ใช้เตือนบนแดชบอร์ด */
function missingBills_() {
  var now = new Date();
  var y = now.getFullYear(), m = now.getMonth() + 1;
  var rows = readRows_(SHEETS.FINANCE).filter(function (r) {
    return String(r.year) === String(y) && String(r.month) === String(m);
  });
  var have = {};
  rows.forEach(function (r) { have[r.kind] = true; });
  var expect = ['รายรับค่าเช่า', 'ค่าไฟฟ้า', 'ค่าน้ำประปา', 'ค่าอินเทอร์เน็ต'];
  return {
    year: y, month: m, label: TH_MONTH_NAMES[m - 1] + ' ' + (y + 543),
    missing: expect.filter(function (k) { return !have[k]; })
  };
}


/* ══════════════════════════════════════════════════════════════
   Migrate.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * Migrate.gs — ย้ายโครงสร้างคอลัมน์เมื่ออัปเดตโค้ด โดยไม่ทำข้อมูลเดิมหาย
 *
 * ปัญหาที่ต้องแก้: ถ้าเพิ่ม/ลบ/สลับคอลัมน์ใน SCHEMA แล้วเขียนหัวตารางทับเฉย ๆ
 * ข้อมูลในแถวเดิมจะเลื่อนไปอยู่ผิดคอลัมน์ทันที ตัวนี้จึงอ่านข้อมูลเดิม
 * "โดยอ้างจากชื่อหัวตาราง" แล้วเขียนกลับตามลำดับใหม่
 */

/** เรียกทุกครั้งที่ติดตั้ง — ทำงานจริงเฉพาะตอนรุ่นโครงสร้างเปลี่ยน */
function runMigrations_() {
  var from = Number(props_().getProperty('SCHEMA_VERSION') || 0);
  if (from >= SCHEMA_VERSION) return { migrated: false, from: from, to: SCHEMA_VERSION };

  var done = [];
  if (from < 2) done.push(migrateV2SplitPayment_());
  if (from < 3) done.push(migrateV3DebtParent_());

  props_().setProperty('SCHEMA_VERSION', String(SCHEMA_VERSION));
  logActivity_('ย้ายโครงสร้างข้อมูล', from + ' → ' + SCHEMA_VERSION, done);
  return { migrated: true, from: from, to: SCHEMA_VERSION, steps: done };
}

/**
 * รุ่น 2 — แยก "จำนวนเงิน + ประเภทการชำระ" ออกเป็น "เงินต้น" กับ "ดอกเบี้ย"
 *
 *   ประเภทเดิม = ดอกเบี้ย        → ดอกเบี้ย = ยอดเดิม
 *   ประเภทเดิม = ค่าธรรมเนียม    → ดอกเบี้ย = ยอดเดิม (ต่อท้ายหมายเหตุไว้)
 *   ประเภทเดิม = เงินต้น / ว่าง   → เงินต้น = ยอดเดิม
 */
function migrateV2SplitPayment_() {
  var name = SHEETS.DEBT_PAYMENTS;
  var old = readByHeader_(name);
  if (!old) return name + ': ไม่มีชีต ข้ามไป';

  var rows = old.rows.map(function (r) {
    var amt = toNumber_(r['จำนวนเงิน']);
    if (amt === null) amt = toNumber_(r['รวมที่โอน']);
    var kind = String(r['ประเภทการชำระ'] || '').trim();

    var principal = toNumber_(r['เงินต้น']);
    var interest = toNumber_(r['ดอกเบี้ย']);

    // ถ้ายังไม่เคยแยก ให้แยกจากประเภทเดิม
    if (principal === null && interest === null) {
      if (kind === 'ดอกเบี้ย' || kind === 'ค่าธรรมเนียม') { interest = amt; principal = 0; }
      else { principal = amt; interest = 0; }
    }
    principal = principal || 0;
    interest = interest || 0;

    var note = String(r['หมายเหตุ'] || '');
    if (kind === 'ค่าธรรมเนียม' && note.indexOf('ค่าธรรมเนียม') < 0) {
      note = (note ? note + ' · ' : '') + 'เดิมบันทึกเป็นค่าธรรมเนียม';
    }

    return {
      id: r['รหัส'], debtId: r['รหัสหนี้'], ledger: r['ประเภทบัญชี'],
      payDate: r['วันที่ชำระ'], year: r['ปี (ค.ศ.)'], installment: r['งวดที่'],
      principal: principal, interest: interest, amount: round2_(principal + interest),
      channel: r['ช่องทาง'], payer: r['ผู้ชำระ'], slips: r['สลิปการโอน'],
      note: note, updatedAt: r['แก้ไขล่าสุด']
    };
  });

  rewriteSheet_(name, rows);
  return name + ': แยกเงินต้น/ดอกเบี้ย ' + rows.length + ' รายการ';
}

/**
 * รุ่น 3 — ก้อนหนี้ผูกกันเป็นแม่-ลูกได้ (คอลัมน์ "เป็นส่วนหนึ่งของ")
 *
 * ผูกให้อัตโนมัติ: เงินยืมป้าตา เป็นส่วนหนึ่งของหนี้ซื้อที่ดิน
 * เพราะเงินก้อนนั้นคือทุนที่ใช้ซื้อที่ดิน ไม่ใช่หนี้เพิ่มอีกก้อน
 */
function migrateV3DebtParent_() {
  var name = SHEETS.DEBTS;
  var old = readByHeader_(name);
  if (!old) return name + ': ไม่มีชีต ข้ามไป';

  var rows = old.rows.map(function (r) {
    return {
      id: r['รหัส'], ledger: r['ประเภทบัญชี'], title: r['รายการหนี้'],
      parentId: r['เป็นส่วนหนึ่งของ'] || '',
      creditor: r['เจ้าหนี้'], startDate: r['วันที่ก่อหนี้'],
      principal: r['ยอดหนี้ตั้งต้น'], interestPerMonth: r['ดอกเบี้ย/เดือน'],
      dueDay: r['กำหนดชำระ (วันที่)'], planPerMonth: r['ยอดผ่อนต่อเดือน'],
      status: r['สถานะ'], note: r['หมายเหตุ'], updatedAt: r['แก้ไขล่าสุด']
    };
  });

  var land = null, pata = null;
  rows.forEach(function (d) {
    var t = String(d.title || '');
    if (!land && t.indexOf('ซื้อที่ดิน') >= 0) land = d;
    if (!pata && t.indexOf('ป้าตา') >= 0) pata = d;
  });
  var linked = '';
  if (land && pata && !String(pata.parentId || '').trim() && land.id !== pata.id) {
    pata.parentId = land.id;
    linked = ' · ผูก "' + pata.title + '" เข้ากับ "' + land.title + '"';
  }

  rewriteSheet_(name, rows);
  return name + ': เพิ่มคอลัมน์แม่-ลูก ' + rows.length + ' รายการ' + linked;
}

/* ------------------------------------------------------------------ */
/*  ตัวช่วย                                                            */
/* ------------------------------------------------------------------ */

/**
 * อ่านทั้งชีตโดยใช้ "หัวตารางที่มีอยู่จริง" เป็นกุญแจ
 * คืน null ถ้ายังไม่มีชีตนั้น
 */
function readByHeader_(name) {
  var ss = getSpreadsheet_();
  var sh = ss.getSheetByName(name);
  if (!sh) return null;

  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  if (lastRow < 1 || lastCol < 1) return { headers: [], rows: [] };

  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });
  var values = lastRow > 1 ? sh.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];

  var rows = [];
  values.forEach(function (row) {
    if (row.every(function (v) { return v === '' || v === null; })) return;
    var o = {};
    headers.forEach(function (h, i) { if (h) o[h] = row[i]; });
    rows.push(o);
  });
  return { headers: headers, rows: rows };
}

/** เขียนทั้งชีตใหม่ตามลำดับคอลัมน์ปัจจุบันของ SCHEMA */
function rewriteSheet_(name, objects) {
  var sh = ensureSheet_(name);
  var cols = SCHEMA[name];

  var lastRow = sh.getLastRow();
  var lastCol = Math.max(sh.getLastColumn(), cols.length);
  if (lastRow > 0) sh.getRange(1, 1, lastRow, lastCol).clearContent();

  sh.getRange(1, 1, 1, cols.length).setValues([cols.map(function (c) { return c.label; })]);
  if (objects.length) {
    var matrix = objects.map(function (o) {
      return cols.map(function (c) { return serializeValue_(o[c.key], c.type); });
    });
    sh.getRange(2, 1, matrix.length, cols.length).setValues(matrix);
  }
  applyFormatting_(name);
  return objects.length;
}


/* ══════════════════════════════════════════════════════════════
   Backup.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * Backup.gs — สำรองและกู้คืนข้อมูลทั้งระบบ
 * ใช้ย้ายข้อมูลระหว่างเวอร์ชันเว็บกับ Google Sheet ได้สองทาง
 */

/** ส่งออกทุกชีตเป็นก้อน JSON เดียว */
function exportAll_() {
  var out = { app: APP.NAME, version: APP.VERSION, exportedAt: nowStamp_(), sheets: {} };
  Object.keys(SHEETS).forEach(function (k) {
    var name = SHEETS[k];
    out.sheets[name] = readRows_(name).map(function (r) {
      var c = {};
      Object.keys(r).forEach(function (key) { if (key !== '_row') c[key] = r[key]; });
      return c;
    });
  });
  out.counts = {};
  Object.keys(out.sheets).forEach(function (n) { out.counts[n] = out.sheets[n].length; });
  return out;
}

/** ส่งออกชีตเดียวเป็น CSV (เปิดใน Excel/Sheets ได้) */
function exportCsv_(sheetName) {
  var cols = SCHEMA[sheetName];
  if (!cols) throw new Error('ไม่รู้จักชีต: ' + sheetName);
  var rows = readRows_(sheetName);
  var lines = [cols.map(function (c) { return csvCell_(c.label); }).join(',')];
  rows.forEach(function (r) {
    lines.push(cols.map(function (c) {
      var v = r[c.key];
      if (Array.isArray(v)) v = v.join(' ');
      return csvCell_(v);
    }).join(','));
  });
  return { filename: sheetName + '-' + todayIso_() + '.csv', content: '﻿' + lines.join('\r\n') };
}

function csvCell_(v) {
  var s = String(v == null ? '' : v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/**
 * นำเข้าข้อมูลกลับ
 * @param {{data:Object, mode:'replace'|'merge'}} payload
 */
function importAll_(payload) {
  var data = payload && payload.data;
  var mode = (payload && payload.mode) || 'merge';
  if (!data || !data.sheets) throw new Error('ไฟล์สำรองไม่ถูกต้อง');

  var stat = {};
  Object.keys(data.sheets).forEach(function (name) {
    if (!SCHEMA[name]) return;
    var incoming = data.sheets[name] || [];
    if (mode === 'replace') {
      clearSheet_(name);
      stat[name] = bulkInsert_(name, incoming);
      return;
    }
    var idKey = (name === SHEETS.ROOMS) ? 'room' : (name === SHEETS.SETTINGS ? 'key' : 'id');
    var existing = {};
    readRows_(name).forEach(function (r) { existing[String(r[idKey])] = true; });
    var fresh = incoming.filter(function (r) { return !existing[String(r[idKey])]; });
    stat[name] = bulkInsert_(name, fresh);
  });
  logActivity_('นำเข้าข้อมูลสำรอง', mode, stat);
  return stat;
}

function clearSheet_(name) {
  var sh = ensureSheet_(name);
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, SCHEMA[name].length).clearContent();
}

/* ------------------------------------------------------------------ */
/*  รุ่นของข้อมูล — ใช้ให้หน้าเว็บรู้ว่ามีการเปลี่ยนแปลงแล้ว              */
/* ------------------------------------------------------------------ */

/**
 * คืนเวลาที่ชีตถูกแก้ล่าสุด (มิลลิวินาที)
 * ครอบคลุมทั้งการแก้ผ่านหน้าเว็บ และการพิมพ์แก้ในชีตโดยตรง
 * หน้าเว็บเรียกค่านี้เป็นระยะ ถ้าเปลี่ยนก็โหลดข้อมูลใหม่ให้อัตโนมัติ
 */
function dataVersion_() {
  try {
    return DriveApp.getFileById(getSpreadsheet_().getId()).getLastUpdated().getTime();
  } catch (e) {
    return Date.now();
  }
}

/* ------------------------------------------------------------------ */
/*  สำรองข้อมูลอัตโนมัติลง Google Drive                                 */
/* ------------------------------------------------------------------ */

var BACKUP_FOLDER = 'สำรองข้อมูล';

function backupFolder_() {
  return subFolder_(ensureDriveFolders_(), BACKUP_FOLDER);
}

/** เขียนไฟล์สำรอง 1 ชุด แล้วลบชุดเก่าที่เกินจำนวนที่ตั้งไว้ */
function backupToDrive_() {
  var dump = exportAll_();
  var name = 'the-m-corner-ap-' +
    Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyy-MM-dd-HHmm') + '.json';
  var folder = backupFolder_();
  var file = folder.createFile(
    Utilities.newBlob(JSON.stringify(dump, null, 1), 'application/json', name));

  var removed = pruneBackups_(folder);
  logActivity_('สำรองข้อมูลลง Drive', name, dump.counts);

  return {
    name: name,
    url: file.getUrl(),
    at: nowStamp_(),
    counts: dump.counts,
    removed: removed,
    folderUrl: folder.getUrl()
  };
}

function pruneBackups_(folder) {
  var keep = Number(getSetting_('backup_keep', 30)) || 30;
  var files = [];
  var it = folder.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    files.push({ f: f, at: f.getDateCreated().getTime() });
  }
  files.sort(function (a, b) { return b.at - a.at; });
  var removed = 0;
  files.slice(keep).forEach(function (x) { x.f.setTrashed(true); removed++; });
  return removed;
}

function listBackups_() {
  var out = [];
  try {
    var it = backupFolder_().getFiles();
    while (it.hasNext()) {
      var f = it.next();
      out.push({
        name: f.getName(),
        url: f.getUrl(),
        size: f.getSize(),
        at: Utilities.formatDate(f.getDateCreated(), APP.TIMEZONE, 'yyyy-MM-dd HH:mm')
      });
    }
  } catch (e) { /* ยังไม่มีโฟลเดอร์ */ }
  out.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
  return out.slice(0, 40);
}

/* ---------- เรียกจากเมนูในชีต ---------- */

function backupNow() {
  var r = backupToDrive_();
  var msg = 'สำรองข้อมูลเรียบร้อย\n\n' + r.name +
    '\nเก็บไว้ที่โฟลเดอร์ "' + BACKUP_FOLDER + '"' +
    (r.removed ? '\n(ลบไฟล์เก่าออก ' + r.removed + ' ชุด)' : '');
  alert_(msg);
  return msg;
}

function installBackupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'backupToDrive_' || t.getHandlerFunction() === 'scheduledBackup') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('scheduledBackup')
    .timeBased().atHour(2).everyDays(1).inTimezone(APP.TIMEZONE).create();

  var msg = 'ตั้งสำรองข้อมูลอัตโนมัติแล้ว — ทุกวันตอนตี 2\n' +
            'เก็บย้อนหลัง ' + getSetting_('backup_keep', 30) + ' ชุด (แก้ได้ในชีต Settings)';
  alert_(msg);
  return msg;
}

function scheduledBackup() {
  return backupToDrive_();
}


/* ══════════════════════════════════════════════════════════════
   Debt.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * Debt.gs — บัญชีหนี้หลัก (รายการสรุปรวม) และหนี้รอง (หนี้สิน)
 *
 * โครงคิด
 *   Debts        = ก้อนหนี้ (ยอดตั้งต้น)
 *   DebtPayments = รายการโอนใช้หนี้แต่ละครั้ง แยกเงินต้นกับดอกเบี้ย
 *
 * ก้อนหนี้ผูกกันเป็นแม่-ลูกได้ผ่านคอลัมน์ "เป็นส่วนหนึ่งของ" (parentId)
 * ใช้กับกรณีที่เงินก้อนหนึ่งเป็น "ทุน" ของอีกก้อน เช่น
 *
 *   ซื้อที่ดิน 4,700,000            ← ก้อนแม่
 *     └─ เงินยืมป้าตา 1,000,000     ← ก้อนลูก (เป็นส่วนหนึ่งของ 4.7 ล้านนั้น)
 *
 * กติกาที่ตามมา
 *   1. จ่ายคืนลูก 1 บาท = แม่ลดลง 1 บาทด้วย (ยอดชำระไหลขึ้นตามสายเสมอ)
 *   2. ยอดตั้งต้นของลูก "อยู่ใน" ยอดของแม่แล้ว ตอนรวมยอดทั้งระบบ
 *      จึงนับเฉพาะก้อนที่ไม่มีแม่ ไม่งั้นจะนับซ้ำ
 *   3. ดอกเบี้ยไม่ไหลขึ้น เพราะเป็นค่าใช้จ่าย ไม่ได้ลดเงินต้นของแม่
 */

var LEDGER_MAIN = 'หนี้หลัก';
var LEDGER_SUB = 'หนี้รอง';

function listDebts_(ledger) {
  var rows = readRows_(SHEETS.DEBTS);
  if (ledger) rows = rows.filter(function (d) { return d.ledger === ledger; });
  return rows;
}

/** @param {string|null} ledger ใส่ null เพื่อเอาทุกบัญชี */
function listDebtPayments_(ledger, year) {
  var rows = readRows_(SHEETS.DEBT_PAYMENTS);
  if (ledger) rows = rows.filter(function (p) { return p.ledger === ledger; });
  if (year && year !== 'all') {
    rows = rows.filter(function (p) { return String(p.year || yearOf_(p.payDate)) === String(year); });
  }
  rows.sort(function (a, b) { return String(b.payDate).localeCompare(String(a.payDate)); });
  return rows.map(function (p) {
    p.slipRefs = toFileRefs_(p.slips);
    return p;
  });
}

/* ------------------------------------------------------------------ */
/*  เครื่องคิดยอด — ปันส่วนการชำระ แล้วไหลขึ้นตามสายแม่-ลูก              */
/* ------------------------------------------------------------------ */

/**
 * ปันส่วนรายการชำระให้แต่ละก้อนหนี้
 *   ระบุก้อนหนี้ไว้     → เข้าก้อนนั้นเต็มจำนวน
 *   ไม่ได้ระบุ          → เฉลี่ยตามสัดส่วนยอดตั้งต้น ให้ก้อนระดับบนสุดของบัญชีนั้น
 */
function debtGraph_(debts, payments) {
  var byId = {};
  debts.forEach(function (d) { byId[String(d.id)] = d; });

  function parentOf(d) {
    var pid = String((d && d.parentId) || '').trim();
    return pid && byId[pid] && byId[pid] !== d ? byId[pid] : null;
  }

  /** ก้อนระดับบนสุด "ของบัญชีนั้น" — ไม่มีแม่ หรือแม่อยู่คนละบัญชี */
  function isLedgerRoot(d) {
    var p = parentOf(d);
    return !p || p.ledger !== d.ledger;
  }

  var children = {};
  debts.forEach(function (d) {
    var p = parentOf(d);
    if (p) (children[String(p.id)] = children[String(p.id)] || []).push(d);
  });

  var rootTotal = {};
  debts.forEach(function (d) {
    if (!isLedgerRoot(d)) return;
    rootTotal[d.ledger] = (rootTotal[d.ledger] || 0) + (toNumber_(d.principal) || 0);
  });

  var own = {};
  debts.forEach(function (d) { own[String(d.id)] = { principal: 0, interest: 0 }; });

  payments.forEach(function (p) {
    var pr = toNumber_(p.principal) || 0;
    var it = toNumber_(p.interest) || 0;
    var id = String(p.debtId || '').trim();
    p._toDebts = [];

    if (id && own[id]) {
      own[id].principal += pr;
      own[id].interest += it;
      p._toDebts.push(id);
      return;
    }
    var tot = rootTotal[p.ledger] || 0;
    debts.forEach(function (d) {
      if (d.ledger !== p.ledger || !isLedgerRoot(d)) return;
      var w = tot > 0 ? (toNumber_(d.principal) || 0) / tot : 0;
      own[String(d.id)].principal += pr * w;
      own[String(d.id)].interest += it * w;
      p._toDebts.push(String(d.id));
    });
  });

  /** ยอดของก้อนหนึ่ง = ของตัวเอง + เงินต้นของลูกทุกชั้น */
  function paidOf(d, guard) {
    guard = guard || 0;
    if (guard > 20) return { principal: 0, interest: 0, fromChildren: 0 };
    var mine = own[String(d.id)] || { principal: 0, interest: 0 };
    var fromChildren = 0;
    (children[String(d.id)] || []).forEach(function (c) {
      var r = paidOf(c, guard + 1);
      fromChildren += r.principal;
    });
    return {
      principal: mine.principal + fromChildren,
      interest: mine.interest,
      fromChildren: fromChildren
    };
  }

  /** บัญชีทั้งหมดที่รายการชำระนี้ส่งผลถึง (ไล่ขึ้นตามสายแม่) */
  function ledgersTouched(p) {
    var set = {};
    (p._toDebts || []).forEach(function (id) {
      var d = byId[id], guard = 0;
      while (d && guard++ < 20) { set[d.ledger] = true; d = parentOf(d); }
    });
    if (!Object.keys(set).length) set[p.ledger] = true;
    return set;
  }

  return {
    byId: byId, children: children, parentOf: parentOf,
    isLedgerRoot: isLedgerRoot, paidOf: paidOf, ledgersTouched: ledgersTouched
  };
}

/**
 * สรุปยอดของบัญชีหนี้หนึ่งบัญชี
 * @param {string} ledger 'หนี้หลัก' | 'หนี้รอง'
 * @param {string|number} year ปี ค.ศ. หรือ 'all'
 */
function debtSummary_(ledger, year) {
  var allDebts = readRows_(SHEETS.DEBTS);
  var allPayments = listDebtPayments_(null, 'all');
  var g = debtGraph_(allDebts, allPayments);

  var debts = allDebts.filter(function (d) { return d.ledger === ledger; });

  // รายการชำระที่ส่งผลถึงบัญชีนี้
  //   • ของบัญชีตัวเอง — เอาทั้งหมด
  //   • ของก้อนลูกที่อยู่คนละบัญชี — เอาเฉพาะที่มีเงินต้น เพราะดอกเบี้ยของลูก
  //     ไม่ได้ลดยอดหนี้ของแม่ ถ้านับมาด้วยจำนวนรายการกับยอดรายปีจะเกินจริง
  var scoped = allPayments.filter(function (p) {
    if (p.ledger === ledger) return true;
    if (!((toNumber_(p.principal) || 0) > 0)) return false;
    return !!g.ledgersTouched(p)[ledger];
  });

  var totalDebt = sum_(debts, function (d) { return d.principal; });

  var principalPaid = 0;
  debts.forEach(function (d) {
    if (!g.isLedgerRoot(d)) return;          // ก้อนลูกในบัญชีเดียวกันถูกนับผ่านแม่แล้ว
    principalPaid += g.paidOf(d).principal;
  });
  var interestPaid = sum_(allPayments.filter(function (p) { return p.ledger === ledger; }),
    function (p) { return p.interest; });

  var remaining = totalDebt - principalPaid;
  var percent = totalDebt > 0 ? Math.min(100, (principalPaid / totalDebt) * 100) : 0;

  // แยกตามปี
  var byYearMap = {};
  scoped.forEach(function (p) {
    var y = p.year || yearOf_(p.payDate);
    if (!y) return;
    if (!byYearMap[y]) byYearMap[y] = { year: Number(y), principal: 0, interest: 0, count: 0 };
    byYearMap[y].principal += toNumber_(p.principal) || 0;
    byYearMap[y].interest += (p.ledger === ledger ? (toNumber_(p.interest) || 0) : 0);
    byYearMap[y].count++;
  });
  var byYear = Object.keys(byYearMap)
    .map(function (k) { return byYearMap[k]; })
    .sort(function (a, b) { return b.year - a.year; });

  var asc = byYear.slice().sort(function (a, b) { return a.year - b.year; });
  var run = 0;
  asc.forEach(function (y) { run += y.principal; y.cumulative = round2_(run); });

  // ความคืบหน้ารายก้อนหนี้
  var perDebt = debts.map(function (d) {
    var r = g.paidOf(d);
    var principal = toNumber_(d.principal) || 0;
    var paid = round2_(r.principal);
    var parent = g.parentOf(d);
    var kids = (g.children[String(d.id)] || []);
    return {
      id: d.id, title: d.title, creditor: d.creditor, ledger: d.ledger,
      startDate: d.startDate, status: d.status, note: d.note,
      interestPerMonth: d.interestPerMonth, dueDay: d.dueDay, planPerMonth: d.planPerMonth,
      principal: principal,
      paid: Math.min(paid, principal),
      remaining: round2_(Math.max(0, principal - paid)),
      percent: principal > 0 ? Math.min(100, (paid / principal) * 100) : 0,
      paidFromChildren: round2_(r.fromChildren),
      parentId: String(d.parentId || ''),
      parentTitle: parent ? parent.title : '',
      children: kids.map(function (c) {
        var cr = g.paidOf(c);
        var cp = toNumber_(c.principal) || 0;
        return {
          id: c.id, title: c.title, ledger: c.ledger, creditor: c.creditor,
          principal: cp, paid: round2_(Math.min(cr.principal, cp)),
          remaining: round2_(Math.max(0, cp - cr.principal)),
          percent: cp > 0 ? Math.min(100, (cr.principal / cp) * 100) : 0
        };
      })
    };
  });

  var forecast = forecastPayoff_(scoped, remaining);

  var yearFiltered = (year && year !== 'all')
    ? scoped.filter(function (p) { return String(p.year || yearOf_(p.payDate)) === String(year); })
    : scoped;

  return {
    ledger: ledger,
    totalDebt: round2_(totalDebt),
    paid: round2_(principalPaid),
    remaining: round2_(remaining),
    percent: round2_(percent),
    interestPaid: round2_(interestPaid),
    paymentCount: scoped.length,
    years: byYear.map(function (y) { return y.year; }),
    byYear: byYear,
    debts: perDebt,
    forecast: forecast,
    selectedYear: year || 'all',
    selectedYearPaid: round2_(sum_(yearFiltered, function (p) { return p.principal; })),
    selectedYearInterest: round2_(sum_(yearFiltered.filter(function (p) { return p.ledger === ledger; }),
      function (p) { return p.interest; })),
    selectedYearCount: yearFiltered.length
  };
}

/**
 * ยอดรวมทั้งระบบแบบไม่นับซ้ำ — นับเฉพาะก้อนหนี้ที่ไม่มีแม่
 * ใช้บนแดชบอร์ด เพราะการเอายอดของแต่ละบัญชีมาบวกกันตรง ๆ
 * จะนับก้อนลูกซ้ำกับที่อยู่ในก้อนแม่อยู่แล้ว
 */
function debtOverview_() {
  var allDebts = readRows_(SHEETS.DEBTS);
  var allPayments = listDebtPayments_(null, 'all');
  var g = debtGraph_(allDebts, allPayments);

  var total = 0, paid = 0;
  allDebts.forEach(function (d) {
    if (g.parentOf(d)) return;                  // ยอดของลูกอยู่ในแม่แล้ว
    total += toNumber_(d.principal) || 0;
    paid += g.paidOf(d).principal;
  });
  var interest = sum_(allPayments, function (p) { return p.interest; });

  return {
    totalDebt: round2_(total),
    paid: round2_(Math.min(paid, total)),
    remaining: round2_(Math.max(0, total - paid)),
    percent: total > 0 ? round2_(Math.min(100, paid / total * 100)) : 0,
    interestPaid: round2_(interest)
  };
}

/** ประเมินว่าอีกกี่เดือนจะปิดหนี้ จากค่าเฉลี่ยการชำระ 12 เดือนล่าสุด */
function forecastPayoff_(payments, remaining) {
  if (remaining <= 0) return { monthsLeft: 0, avgPerMonth: 0, payoffDate: '' };
  var cutoff = addMonths_(new Date(), -12);
  var recent = payments.filter(function (p) {
    var d = toDate_(p.payDate);
    return d && cutoff && d >= cutoff;
  });
  var total = sum_(recent, function (p) { return p.principal; });
  var avg = total / 12;
  if (avg <= 0) return { monthsLeft: null, avgPerMonth: 0, payoffDate: '' };
  var months = Math.ceil(remaining / avg);
  return {
    monthsLeft: months,
    avgPerMonth: round2_(avg),
    payoffDate: toIsoDate_(addMonths_(new Date(), months))
  };
}

/* ---------- CRUD ---------- */

/** กันผูกวน เช่น A เป็นลูกของ B แล้ว B เป็นลูกของ A */
function assertNoCycle_(debtId, parentId) {
  if (!parentId) return;
  if (String(parentId) === String(debtId)) {
    throw new Error('ก้อนหนี้ผูกเป็นส่วนหนึ่งของตัวเองไม่ได้');
  }
  var byId = {};
  readRows_(SHEETS.DEBTS).forEach(function (d) { byId[String(d.id)] = d; });
  var cur = byId[String(parentId)], guard = 0;
  while (cur && guard++ < 20) {
    if (String(cur.id) === String(debtId)) {
      throw new Error('ผูกแบบนี้จะวนกลับมาหาตัวเอง — เลือกก้อนหนี้อื่น');
    }
    cur = byId[String(cur.parentId || '')];
  }
}

function saveDebt_(obj) {
  var now = new Date();
  obj.parentId = String(obj.parentId || '').trim();
  if (obj.parentId) assertNoCycle_(obj.id, obj.parentId);
  if (obj.id) {
    var found = findRow_(SHEETS.DEBTS, obj.id);
    if (found) {
      var merged = Object.assign({}, found, obj, { updatedAt: now });
      logActivity_('แก้ไขก้อนหนี้', obj.id, obj.title);
      return updateRow_(SHEETS.DEBTS, found._row, merged);
    }
  }
  obj.id = obj.id || uid_('DEBT');
  obj.updatedAt = now;
  logActivity_('เพิ่มก้อนหนี้', obj.id, obj.title);
  return insertRow_(SHEETS.DEBTS, obj);
}

function deleteDebt_(id) {
  var found = findRow_(SHEETS.DEBTS, id);
  if (!found) throw new Error('ไม่พบก้อนหนี้: ' + id);
  deleteRow_(SHEETS.DEBTS, found._row);
  logActivity_('ลบก้อนหนี้', id, found.title);
  return true;
}

function saveDebtPayment_(obj) {
  var now = new Date();
  obj.year = yearOf_(obj.payDate) || obj.year || new Date().getFullYear();
  obj.ledger = obj.ledger || LEDGER_MAIN;
  // "รวมที่โอน" คิดให้เองเสมอ เพื่อให้ตรงกับสลิปและกันกรอกไม่ตรงกัน
  obj.principal = toNumber_(obj.principal) || 0;
  obj.interest = toNumber_(obj.interest) || 0;
  obj.amount = round2_(obj.principal + obj.interest);

  if (obj.id) {
    var found = findRow_(SHEETS.DEBT_PAYMENTS, obj.id);
    if (found) {
      var merged = Object.assign({}, found, obj, { updatedAt: now });
      logActivity_('แก้ไขรายการชำระหนี้', obj.id, 'เงินต้น ' + obj.principal + ' · ดอกเบี้ย ' + obj.interest);
      return updateRow_(SHEETS.DEBT_PAYMENTS, found._row, merged);
    }
  }
  obj.id = obj.id || uid_('PAY');
  obj.updatedAt = now;
  logActivity_('เพิ่มรายการชำระหนี้', obj.id, obj.ledger + ' เงินต้น ' + obj.principal + ' · ดอกเบี้ย ' + obj.interest);
  return insertRow_(SHEETS.DEBT_PAYMENTS, obj);
}

function deleteDebtPayment_(id) {
  var found = findRow_(SHEETS.DEBT_PAYMENTS, id);
  if (!found) throw new Error('ไม่พบรายการชำระ: ' + id);
  deleteRow_(SHEETS.DEBT_PAYMENTS, found._row);
  logActivity_('ลบรายการชำระหนี้', id, found.amount);
  return true;
}


/* ══════════════════════════════════════════════════════════════
   Purchase.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * Purchase.gs — รายการซื้อของ + การติดตามระยะประกัน
 */

function listPurchases_(year, opts) {
  opts = opts || {};
  var rows = readRows_(SHEETS.PURCHASES);

  if (year && year !== 'all') {
    rows = rows.filter(function (p) { return String(p.year || yearOf_(p.buyDate)) === String(year); });
  }
  if (opts.category) rows = rows.filter(function (p) { return p.category === opts.category; });
  if (opts.room) rows = rows.filter(function (p) { return String(p.room) === String(opts.room); });
  if (opts.q) {
    var q = String(opts.q).toLowerCase();
    rows = rows.filter(function (p) {
      return (String(p.item) + ' ' + String(p.vendor) + ' ' + String(p.note)).toLowerCase().indexOf(q) >= 0;
    });
  }

  rows.sort(function (a, b) {
    var d = String(b.buyDate || '').localeCompare(String(a.buyDate || ''));
    return d !== 0 ? d : (Number(b.year || 0) - Number(a.year || 0));
  });

  var today = todayIso_();
  return rows.map(function (p) {
    p.photoRefs = toFileRefs_(p.photos);
    p.slipRefs = toFileRefs_(p.slips);
    p.warranty = warrantyState_(p, today);
    return p;
  });
}

/** สถานะประกัน: ไม่มี | เหลืออีก n วัน | ใกล้หมด | หมดอายุแล้ว */
function warrantyState_(p, today) {
  var end = p.warrantyEnd || (p.buyDate && p.warrantyMonths ? toIsoDate_(addMonths_(p.buyDate, p.warrantyMonths)) : '');
  if (!end) return { has: false, end: '', daysLeft: null, state: 'ไม่ระบุ' };
  var left = daysBetween_(today, end);
  var alertDays = Number(getSetting_('warranty_alert_days', 30)) || 30;
  var state = left < 0 ? 'หมดอายุแล้ว' : (left <= alertDays ? 'ใกล้หมดประกัน' : 'อยู่ในประกัน');
  return { has: true, end: end, daysLeft: left, state: state };
}

/** สรุปรายการซื้อของ พร้อมยอดแยกตามปีและหมวดหมู่ */
function purchaseSummary_(year) {
  var all = readRows_(SHEETS.PURCHASES);
  var today = todayIso_();

  var byYearMap = {};
  all.forEach(function (p) {
    var y = p.year || yearOf_(p.buyDate);
    if (!y) return;
    if (!byYearMap[y]) byYearMap[y] = { year: Number(y), total: 0, count: 0 };
    byYearMap[y].total += toNumber_(p.price) || 0;
    byYearMap[y].count++;
  });
  var byYear = Object.keys(byYearMap).map(function (k) { return byYearMap[k]; })
    .sort(function (a, b) { return b.year - a.year; });

  var scope = (year && year !== 'all')
    ? all.filter(function (p) { return String(p.year || yearOf_(p.buyDate)) === String(year); })
    : all;

  var byCatMap = {};
  scope.forEach(function (p) {
    var c = p.category || 'อื่น ๆ';
    if (!byCatMap[c]) byCatMap[c] = { category: c, total: 0, count: 0 };
    byCatMap[c].total += toNumber_(p.price) || 0;
    byCatMap[c].count++;
  });
  var byCategory = Object.keys(byCatMap).map(function (k) { return byCatMap[k]; })
    .sort(function (a, b) { return b.total - a.total; });

  var byVendorMap = {};
  scope.forEach(function (p) {
    var v = String(p.vendor || 'ไม่ระบุ');
    if (!byVendorMap[v]) byVendorMap[v] = { vendor: v, total: 0, count: 0 };
    byVendorMap[v].total += toNumber_(p.price) || 0;
    byVendorMap[v].count++;
  });
  var byVendor = Object.keys(byVendorMap).map(function (k) { return byVendorMap[k]; })
    .sort(function (a, b) { return b.total - a.total; }).slice(0, 10);

  var warrantyActive = 0, warrantyExpiring = 0, warrantyExpired = 0;
  all.forEach(function (p) {
    var w = warrantyState_(p, today);
    if (!w.has) return;
    if (w.state === 'อยู่ในประกัน') warrantyActive++;
    else if (w.state === 'ใกล้หมดประกัน') warrantyExpiring++;
    else warrantyExpired++;
  });

  return {
    grandTotal: round2_(sum_(all, function (p) { return p.price; })),
    grandCount: all.length,
    yearTotal: round2_(sum_(scope, function (p) { return p.price; })),
    yearCount: scope.length,
    years: byYear.map(function (y) { return y.year; }),
    byYear: byYear,
    byCategory: byCategory,
    byVendor: byVendor,
    warranty: { active: warrantyActive, expiring: warrantyExpiring, expired: warrantyExpired },
    selectedYear: year || 'all'
  };
}

/** รายการที่ประกันกำลังจะหมด (ใช้ในหน้า Dashboard และการแจ้งเตือน) */
function expiringWarranties_(days) {
  days = Number(days || getSetting_('warranty_alert_days', 30));
  var today = todayIso_();
  return readRows_(SHEETS.PURCHASES)
    .map(function (p) { p.warranty = warrantyState_(p, today); return p; })
    .filter(function (p) {
      return p.warranty.has && p.warranty.daysLeft !== null &&
             p.warranty.daysLeft >= 0 && p.warranty.daysLeft <= days;
    })
    .sort(function (a, b) { return a.warranty.daysLeft - b.warranty.daysLeft; });
}

/* ---------- CRUD ---------- */

function savePurchase_(obj) {
  obj.year = yearOf_(obj.buyDate) || obj.year || new Date().getFullYear();
  if (obj.buyDate && obj.warrantyMonths) {
    obj.warrantyEnd = toIsoDate_(addMonths_(obj.buyDate, obj.warrantyMonths));
  }
  obj.updatedAt = new Date();

  if (obj.id) {
    var found = findRow_(SHEETS.PURCHASES, obj.id);
    if (found) {
      logActivity_('แก้ไขรายการซื้อ', obj.id, obj.item);
      return updateRow_(SHEETS.PURCHASES, found._row, Object.assign({}, found, obj));
    }
  }
  obj.id = obj.id || uid_('BUY');
  logActivity_('เพิ่มรายการซื้อ', obj.id, obj.item);
  return insertRow_(SHEETS.PURCHASES, obj);
}

function deletePurchase_(id) {
  var found = findRow_(SHEETS.PURCHASES, id);
  if (!found) throw new Error('ไม่พบรายการซื้อ: ' + id);
  deleteRow_(SHEETS.PURCHASES, found._row);
  logActivity_('ลบรายการซื้อ', id, found.item);
  return true;
}


/* ══════════════════════════════════════════════════════════════
   Maintenance.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * Maintenance.gs — งานซ่อมบำรุงระดับห้อง
 *   • ล้างแอร์ (AcService)      — 1 ห้องมีได้หลายรอบต่อปี
 *   • แจ้งซ่อมตามห้อง (RoomRepairs)
 *   • ทะเบียนห้อง + ทรัพย์สินประจำห้อง
 */

/* ---------- ห้อง ---------- */

function listRooms_() {
  var rows = readRows_(SHEETS.ROOMS);
  var map = {};
  rows.forEach(function (r) { map[String(r.room)] = r; });

  // เติมห้องที่ยังไม่มีในชีตให้ครบ 24 ห้องเสมอ
  return FLOORS.map(function (f) {
    return {
      floor: f.floor,
      rooms: f.rooms.map(function (room) {
        return map[room] || { room: room, floor: f.floor, status: 'มีผู้เช่า', tenant: '', phone: '', rent: null, moveIn: '', note: '' };
      })
    };
  });
}

function saveRoom_(obj) {
  obj.updatedAt = new Date();
  var found = findRow_(SHEETS.ROOMS, obj.room, 'room');
  if (found) {
    logActivity_('แก้ไขข้อมูลห้อง', obj.room, obj.tenant);
    return updateRow_(SHEETS.ROOMS, found._row, Object.assign({}, found, obj));
  }
  logActivity_('เพิ่มห้อง', obj.room, '');
  return insertRow_(SHEETS.ROOMS, obj);
}

/* ---------- ล้างแอร์ ---------- */

function listAcService_(year, room) {
  var rows = readRows_(SHEETS.AC_SERVICE);
  if (year && year !== 'all') {
    rows = rows.filter(function (r) { return String(r.year || yearOf_(r.serviceDate) || yearOf_(r.bookDate)) === String(year); });
  }
  if (room && room !== 'all') rows = rows.filter(function (r) { return String(r.room) === String(room); });

  rows.sort(function (a, b) {
    var da = a.serviceDate || a.bookDate || '';
    var db = b.serviceDate || b.bookDate || '';
    var c = String(db).localeCompare(String(da));
    return c !== 0 ? c : String(a.room).localeCompare(String(b.room));
  });
  return rows.map(function (r) { r.photoRefs = toFileRefs_(r.photos); return r; });
}

/**
 * ตารางล้างแอร์: 1 แถวต่อ 1 ห้อง แสดงทุกรอบของปีที่เลือก + วันที่ล้างล่าสุด
 * ใช้กับหน้า "ล้างแอร์" ที่ต้องดูภาพรวมทั้ง 24 ห้องพร้อมกัน
 */
function acMatrix_(year) {
  var all = readRows_(SHEETS.AC_SERVICE);
  var cycle = Number(getSetting_('ac_cycle_months', 6)) || 6;
  var today = todayIso_();

  var byRoom = {};
  ROOMS.forEach(function (r) { byRoom[r] = []; });
  all.forEach(function (r) {
    var room = String(r.room);
    if (!byRoom[room]) byRoom[room] = [];
    byRoom[room].push(r);
  });

  var rows = ROOMS.map(function (room) {
    var list = byRoom[room].slice().sort(function (a, b) {
      return String(b.serviceDate || b.bookDate || '').localeCompare(String(a.serviceDate || a.bookDate || ''));
    });
    var inYear = (year && year !== 'all')
      ? list.filter(function (r) { return String(r.year || yearOf_(r.serviceDate) || yearOf_(r.bookDate)) === String(year); })
      : list;

    var done = list.filter(function (r) { return r.serviceDate; });
    var last = done.length ? done[0].serviceDate : '';
    var nextDue = last ? toIsoDate_(addMonths_(last, cycle)) : '';
    var overdueDays = nextDue ? -daysBetween_(today, nextDue) : null;

    return {
      room: room,
      floor: floorOf_(room),
      records: inYear.map(function (r) { r.photoRefs = toFileRefs_(r.photos); return r; }),
      roundsInYear: inYear.filter(function (r) { return r.serviceDate; }).length,
      bookedInYear: inYear.filter(function (r) { return !r.serviceDate && r.bookDate; }).length,
      lastService: last,
      nextDue: nextDue,
      overdueDays: overdueDays,
      state: !last ? 'ยังไม่เคยล้าง' : (overdueDays > 0 ? 'เกินกำหนด' : 'ปกติ')
    };
  });

  var years = uniqueYears_(all, ['serviceDate', 'bookDate']);
  return {
    year: year || 'all',
    years: years,
    cycleMonths: cycle,
    rooms: rows,
    doneInYear: rows.reduce(function (a, r) { return a + r.roundsInYear; }, 0),
    roomsDoneInYear: rows.filter(function (r) { return r.roundsInYear > 0; }).length,
    roomsPending: rows.filter(function (r) { return r.roundsInYear === 0; }).map(function (r) { return r.room; }),
    overdue: rows.filter(function (r) { return r.state === 'เกินกำหนด' || r.state === 'ยังไม่เคยล้าง'; })
  };
}

function saveAcService_(obj) {
  obj.year = yearOf_(obj.serviceDate) || yearOf_(obj.bookDate) || obj.year || new Date().getFullYear();
  obj.status = obj.status || (obj.serviceDate ? 'ดำเนินการแล้ว' : 'นัดหมายแล้ว');
  obj.updatedAt = new Date();

  if (!obj.round) {
    var same = readRows_(SHEETS.AC_SERVICE).filter(function (r) {
      return String(r.room) === String(obj.room) && String(r.year) === String(obj.year) && String(r.id) !== String(obj.id || '');
    });
    obj.round = same.length + 1;
  }

  if (obj.id) {
    var found = findRow_(SHEETS.AC_SERVICE, obj.id);
    if (found) {
      logActivity_('แก้ไขล้างแอร์', obj.id, obj.room);
      return updateRow_(SHEETS.AC_SERVICE, found._row, Object.assign({}, found, obj));
    }
  }
  obj.id = obj.id || uid_('AC');
  logActivity_('เพิ่มล้างแอร์', obj.id, obj.room + ' ' + (obj.serviceDate || obj.bookDate));
  return insertRow_(SHEETS.AC_SERVICE, obj);
}

function deleteAcService_(id) {
  var found = findRow_(SHEETS.AC_SERVICE, id);
  if (!found) throw new Error('ไม่พบรายการล้างแอร์: ' + id);
  deleteRow_(SHEETS.AC_SERVICE, found._row);
  logActivity_('ลบล้างแอร์', id, found.room);
  return true;
}

/** สร้างนัดล้างแอร์หลายห้องพร้อมกัน (เช่น นัดช่างมาล้างทั้งชั้น) */
function bulkBookAc_(payload) {
  var rooms = (payload && payload.rooms) || [];
  var bookDate = payload && payload.bookDate;
  if (!rooms.length || !bookDate) throw new Error('ต้องระบุห้องและวันที่นัด');

  var year = yearOf_(bookDate);
  var existing = readRows_(SHEETS.AC_SERVICE);
  var rows = rooms.map(function (room) {
    var same = existing.filter(function (r) {
      return String(r.room) === String(room) && String(r.year) === String(year);
    });
    return {
      id: uid_('AC'), room: room, year: year, round: same.length + 1,
      bookDate: bookDate, serviceDate: '', status: 'นัดหมายแล้ว',
      technician: payload.technician || '', cost: toNumber_(payload.cost),
      photos: [], note: payload.note || '', updatedAt: new Date()
    };
  });
  var n = bulkInsert_(SHEETS.AC_SERVICE, rows);
  logActivity_('นัดล้างแอร์หลายห้อง', rooms.join(','), bookDate);
  return n;
}

/* ---------- แจ้งซ่อมตามห้อง ---------- */

function listRoomRepairs_(year, room, status) {
  var rows = readRows_(SHEETS.ROOM_REPAIRS);
  if (year && year !== 'all') {
    rows = rows.filter(function (r) { return String(r.year || yearOf_(r.repairDate) || yearOf_(r.bookDate)) === String(year); });
  }
  if (room && room !== 'all') rows = rows.filter(function (r) { return String(r.room) === String(room); });
  if (status && status !== 'all') rows = rows.filter(function (r) { return r.status === status; });

  rows.sort(function (a, b) {
    var da = a.repairDate || a.bookDate || a.reportDate || '';
    var db = b.repairDate || b.bookDate || b.reportDate || '';
    var c = String(db).localeCompare(String(da));
    return c !== 0 ? c : String(a.room).localeCompare(String(b.room));
  });
  return rows.map(function (r) {
    r.beforeRefs = toFileRefs_(r.photosBefore);
    r.afterRefs = toFileRefs_(r.photosAfter);
    return r;
  });
}

/** ภาพรวมงานซ่อมรายห้องของปีที่เลือก */
function repairMatrix_(year) {
  var all = readRows_(SHEETS.ROOM_REPAIRS);
  var scope = (year && year !== 'all')
    ? all.filter(function (r) { return String(r.year || yearOf_(r.repairDate)) === String(year); })
    : all;

  var byRoom = {};
  ROOMS.forEach(function (r) { byRoom[r] = []; });
  scope.forEach(function (r) {
    var room = String(r.room);
    if (!byRoom[room]) byRoom[room] = [];
    byRoom[room].push(r);
  });

  var rooms = ROOMS.map(function (room) {
    var list = byRoom[room].sort(function (a, b) {
      return String(b.repairDate || b.bookDate || '').localeCompare(String(a.repairDate || a.bookDate || ''));
    });
    var open = list.filter(function (r) { return r.status !== 'เสร็จสิ้น' && r.status !== 'ยกเลิก'; });
    return {
      room: room,
      floor: floorOf_(room),
      count: list.length,
      openCount: open.length,
      cost: round2_(sum_(list, function (r) { return r.cost; })),
      last: list.length ? (list[0].repairDate || list[0].bookDate || '') : '',
      records: list.map(function (r) {
        r.beforeRefs = toFileRefs_(r.photosBefore);
        r.afterRefs = toFileRefs_(r.photosAfter);
        return r;
      })
    };
  });

  return {
    year: year || 'all',
    years: uniqueYears_(all, ['repairDate', 'bookDate', 'reportDate']),
    rooms: rooms,
    totalJobs: scope.length,
    openJobs: scope.filter(function (r) { return r.status !== 'เสร็จสิ้น' && r.status !== 'ยกเลิก'; }).length,
    totalCost: round2_(sum_(scope, function (r) { return r.cost; }))
  };
}

function saveRoomRepair_(obj) {
  obj.year = yearOf_(obj.repairDate) || yearOf_(obj.bookDate) || yearOf_(obj.reportDate) || obj.year || new Date().getFullYear();
  obj.status = obj.status || (obj.repairDate ? 'เสร็จสิ้น' : (obj.bookDate ? 'นัดหมายแล้ว' : 'รอดำเนินการ'));
  obj.priority = obj.priority || 'ปกติ';
  obj.updatedAt = new Date();

  if (obj.id) {
    var found = findRow_(SHEETS.ROOM_REPAIRS, obj.id);
    if (found) {
      logActivity_('แก้ไขงานซ่อมห้อง', obj.id, obj.room);
      return updateRow_(SHEETS.ROOM_REPAIRS, found._row, Object.assign({}, found, obj));
    }
  }
  obj.id = obj.id || uid_('FIX');
  logActivity_('เพิ่มงานซ่อมห้อง', obj.id, obj.room + ' ' + String(obj.items || '').slice(0, 40));
  return insertRow_(SHEETS.ROOM_REPAIRS, obj);
}

function deleteRoomRepair_(id) {
  var found = findRow_(SHEETS.ROOM_REPAIRS, id);
  if (!found) throw new Error('ไม่พบงานซ่อม: ' + id);
  deleteRow_(SHEETS.ROOM_REPAIRS, found._row);
  logActivity_('ลบงานซ่อมห้อง', id, found.room);
  return true;
}

/* ---------- ทรัพย์สินประจำห้อง ---------- */

function listAssets_(room) {
  var rows = readRows_(SHEETS.ASSETS);
  if (room && room !== 'all') rows = rows.filter(function (a) { return String(a.room) === String(room); });
  return rows;
}

function saveAsset_(obj) {
  obj.updatedAt = new Date();
  if (obj.id) {
    var found = findRow_(SHEETS.ASSETS, obj.id);
    if (found) return updateRow_(SHEETS.ASSETS, found._row, Object.assign({}, found, obj));
  }
  obj.id = obj.id || uid_('AST');
  return insertRow_(SHEETS.ASSETS, obj);
}

function deleteAsset_(id) {
  var found = findRow_(SHEETS.ASSETS, id);
  if (!found) throw new Error('ไม่พบทรัพย์สิน: ' + id);
  deleteRow_(SHEETS.ASSETS, found._row);
  return true;
}

/* ---------- ประวัติรวมของ 1 ห้อง ---------- */

/** ทุกอย่างที่เคยเกิดกับห้องนี้ เรียงตามเวลา — ใช้ในหน้ารายละเอียดห้อง */
function roomProfile_(room) {
  var info = findRow_(SHEETS.ROOMS, room, 'room') ||
             { room: room, floor: floorOf_(room), status: '', tenant: '', phone: '', rent: null, moveIn: '', note: '' };

  var ac = listAcService_('all', room);
  var repairs = listRoomRepairs_('all', room, 'all');
  var assets = listAssets_(room);
  var purchases = readRows_(SHEETS.PURCHASES).filter(function (p) { return String(p.room) === String(room); });

  var timeline = []
    .concat(ac.map(function (r) {
      return { date: r.serviceDate || r.bookDate, type: 'ล้างแอร์', title: 'ล้างแอร์ รอบที่ ' + (r.round || 1),
               detail: r.note || '', status: r.status, cost: r.cost, photos: r.photoRefs, id: r.id };
    }))
    .concat(repairs.map(function (r) {
      return { date: r.repairDate || r.bookDate || r.reportDate, type: 'ซ่อมแซม', title: r.category || 'งานซ่อม',
               detail: r.items || '', status: r.status, cost: r.cost,
               photos: (r.afterRefs || []).concat(r.beforeRefs || []), id: r.id };
    }))
    .concat(purchases.map(function (p) {
      return { date: p.buyDate, type: 'ซื้อของเข้าห้อง', title: p.item, detail: p.vendor || '',
               status: '', cost: p.price, photos: toFileRefs_(p.photos), id: p.id };
    }))
    .filter(function (e) { return e.date; })
    .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });

  return {
    info: info,
    timeline: timeline,
    assets: assets,
    acCount: ac.filter(function (r) { return r.serviceDate; }).length,
    lastAc: ac.filter(function (r) { return r.serviceDate; }).map(function (r) { return r.serviceDate; }).sort().pop() || '',
    repairCount: repairs.length,
    openRepairs: repairs.filter(function (r) { return r.status !== 'เสร็จสิ้น' && r.status !== 'ยกเลิก'; }).length,
    totalCost: round2_(sum_(repairs, function (r) { return r.cost; }) + sum_(ac, function (r) { return r.cost; }))
  };
}

/* ---------- helpers ---------- */

function floorOf_(room) {
  for (var i = 0; i < FLOORS.length; i++) {
    if (FLOORS[i].rooms.indexOf(String(room)) >= 0) return FLOORS[i].floor;
  }
  return Number(String(room).charAt(0)) || null;
}

function uniqueYears_(rows, dateKeys) {
  var set = {};
  rows.forEach(function (r) {
    var y = r.year;
    if (!y) {
      for (var i = 0; i < dateKeys.length && !y; i++) y = yearOf_(r[dateKeys[i]]);
    }
    if (y) set[Number(y)] = true;
  });
  var cur = new Date().getFullYear();
  set[cur] = true;
  return Object.keys(set).map(Number).sort(function (a, b) { return b - a; });
}


/* ══════════════════════════════════════════════════════════════
   Building.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * Building.gs — รายการซ่อมแซมตึกโดยรวม (งานส่วนกลาง ไม่ผูกกับห้องใดห้องหนึ่ง)
 */

function listBuildingRepairs_(year, zone, status) {
  var rows = readRows_(SHEETS.BUILDING_REPAIRS);
  if (year && year !== 'all') {
    rows = rows.filter(function (r) { return String(r.year || yearOf_(r.endDate) || yearOf_(r.startDate)) === String(year); });
  }
  if (zone && zone !== 'all') rows = rows.filter(function (r) { return r.zone === zone; });
  if (status && status !== 'all') rows = rows.filter(function (r) { return r.status === status; });

  rows.sort(function (a, b) {
    var da = a.endDate || a.startDate || a.bookDate || String(a.year || '');
    var db = b.endDate || b.startDate || b.bookDate || String(b.year || '');
    return String(db).localeCompare(String(da));
  });

  var today = todayIso_();
  return rows.map(function (r) {
    r.photoRefs = toFileRefs_(r.photos);
    r.slipRefs = toFileRefs_(r.slips);
    r.dueInDays = r.nextDue ? daysBetween_(today, r.nextDue) : null;
    return r;
  });
}

function buildingSummary_(year) {
  var all = readRows_(SHEETS.BUILDING_REPAIRS);
  var today = todayIso_();

  var scope = (year && year !== 'all')
    ? all.filter(function (r) { return String(r.year || yearOf_(r.endDate)) === String(year); })
    : all;

  var byZoneMap = {};
  scope.forEach(function (r) {
    var z = r.zone || 'อื่น ๆ';
    if (!byZoneMap[z]) byZoneMap[z] = { zone: z, count: 0, cost: 0, open: 0 };
    byZoneMap[z].count++;
    byZoneMap[z].cost += toNumber_(r.cost) || 0;
    if (r.status !== 'เสร็จสิ้น' && r.status !== 'ยกเลิก') byZoneMap[z].open++;
  });
  var byZone = Object.keys(byZoneMap).map(function (k) { return byZoneMap[k]; })
    .sort(function (a, b) { return b.cost - a.cost; });

  var byYearMap = {};
  all.forEach(function (r) {
    var y = r.year || yearOf_(r.endDate) || yearOf_(r.startDate);
    if (!y) return;
    if (!byYearMap[y]) byYearMap[y] = { year: Number(y), count: 0, cost: 0 };
    byYearMap[y].count++;
    byYearMap[y].cost += toNumber_(r.cost) || 0;
  });
  var byYear = Object.keys(byYearMap).map(function (k) { return byYearMap[k]; })
    .sort(function (a, b) { return b.year - a.year; });

  var upcoming = all.filter(function (r) {
    if (!r.nextDue) return false;
    var d = daysBetween_(today, r.nextDue);
    return d !== null && d <= 90;
  }).map(function (r) {
    r.dueInDays = daysBetween_(today, r.nextDue);
    return r;
  }).sort(function (a, b) { return a.dueInDays - b.dueInDays; });

  return {
    year: year || 'all',
    years: uniqueYears_(all, ['endDate', 'startDate', 'bookDate']),
    total: all.length,
    yearCount: scope.length,
    yearCost: round2_(sum_(scope, function (r) { return r.cost; })),
    grandCost: round2_(sum_(all, function (r) { return r.cost; })),
    openCount: scope.filter(function (r) { return r.status !== 'เสร็จสิ้น' && r.status !== 'ยกเลิก'; }).length,
    byZone: byZone,
    byYear: byYear,
    upcoming: upcoming
  };
}

function saveBuildingRepair_(obj) {
  obj.year = yearOf_(obj.endDate) || yearOf_(obj.startDate) || yearOf_(obj.bookDate) || obj.year || new Date().getFullYear();
  obj.status = obj.status || (obj.endDate ? 'เสร็จสิ้น' : (obj.startDate ? 'กำลังดำเนินการ' : (obj.bookDate ? 'นัดหมายแล้ว' : 'รอดำเนินการ')));
  obj.updatedAt = new Date();

  if (obj.id) {
    var found = findRow_(SHEETS.BUILDING_REPAIRS, obj.id);
    if (found) {
      logActivity_('แก้ไขงานซ่อมตึก', obj.id, obj.title);
      return updateRow_(SHEETS.BUILDING_REPAIRS, found._row, Object.assign({}, found, obj));
    }
  }
  obj.id = obj.id || uid_('BLD');
  logActivity_('เพิ่มงานซ่อมตึก', obj.id, obj.title);
  return insertRow_(SHEETS.BUILDING_REPAIRS, obj);
}

function deleteBuildingRepair_(id) {
  var found = findRow_(SHEETS.BUILDING_REPAIRS, id);
  if (!found) throw new Error('ไม่พบงานซ่อมตึก: ' + id);
  deleteRow_(SHEETS.BUILDING_REPAIRS, found._row);
  logActivity_('ลบงานซ่อมตึก', id, found.title);
  return true;
}


/* ══════════════════════════════════════════════════════════════
   Dashboard.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * Dashboard.gs — หน้าแรก: ตัวเลขสำคัญและสิ่งที่ต้องทำ
 */

function dashboard_(year) {
  var y = year && year !== 'all' ? String(year) : String(new Date().getFullYear());
  var today = todayIso_();

  var main = debtSummary_(LEDGER_MAIN, y);
  var sub = debtSummary_(LEDGER_SUB, y);
  var overview = debtOverview_();   // ยอดรวมจริง ไม่นับก้อนลูกซ้ำกับก้อนแม่
  var buy = purchaseSummary_(y);
  var ac = acMatrix_(y);
  var fix = repairMatrix_(y);
  var bld = buildingSummary_(y);
  var fin = financeSummary_(y);

  var openRepairs = listRoomRepairs_('all', 'all', 'all').filter(function (r) {
    return r.status !== 'เสร็จสิ้น' && r.status !== 'ยกเลิก';
  });
  var overdueDays = Number(getSetting_('overdue_alert_days', 7)) || 7;
  var overdueRepairs = openRepairs.filter(function (r) {
    var ref = r.bookDate || r.reportDate;
    if (!ref) return false;
    var d = daysBetween_(ref, today);
    return d !== null && d > overdueDays;
  });

  var rooms = readRows_(SHEETS.ROOMS);
  var occupied = rooms.filter(function (r) { return r.status === 'มีผู้เช่า'; }).length;
  var vacant = rooms.filter(function (r) { return r.status === 'ว่าง'; }).length;

  var spendThisYear = round2_(
    (buy.yearTotal || 0) +
    sum_(listRoomRepairs_(y, 'all', 'all'), function (r) { return r.cost; }) +
    sum_(listAcService_(y, 'all'), function (r) { return r.cost; }) +
    (bld.yearCost || 0)
  );

  return {
    year: y,
    years: mergeYears_([main.years, sub.years, buy.years, ac.years, fix.years, bld.years]),
    building: {
      name: getSetting_('building_name', APP.NAME),
      totalRooms: ROOMS.length,
      occupied: occupied,
      vacant: vacant,
      occupancy: ROOMS.length ? round2_((occupied / ROOMS.length) * 100) : 0
    },
    debtAll: overview,
    debtMain: {
      total: main.totalDebt, paid: main.paid, remaining: main.remaining,
      percent: main.percent, thisYear: main.selectedYearPaid, forecast: main.forecast
    },
    debtSub: {
      total: sub.totalDebt, paid: sub.paid, remaining: sub.remaining,
      percent: sub.percent, thisYear: sub.selectedYearPaid, interestThisYear: sub.selectedYearInterest
    },
    purchases: {
      yearTotal: buy.yearTotal, yearCount: buy.yearCount,
      grandTotal: buy.grandTotal, grandCount: buy.grandCount,
      topCategory: buy.byCategory[0] || null, warranty: buy.warranty
    },
    ac: {
      doneInYear: ac.doneInYear, roomsDone: ac.roomsDoneInYear,
      roomsPending: ac.roomsPending.length, pendingList: ac.roomsPending,
      overdue: ac.overdue.length, cycleMonths: ac.cycleMonths
    },
    repairs: {
      totalJobs: fix.totalJobs, openJobs: fix.openJobs, totalCost: fix.totalCost,
      overdue: overdueRepairs.length
    },
    buildingRepairs: {
      yearCount: bld.yearCount, yearCost: bld.yearCost,
      openCount: bld.openCount, upcoming: bld.upcoming.length
    },
    finance: {
      income: fin.income, expense: fin.expense, net: fin.net, margin: fin.margin,
      avgIncome: fin.avgIncome, avgExpense: fin.avgExpense,
      byMonth: fin.byMonth, monthsWithData: fin.monthsWithData
    },
    spendThisYear: spendThisYear,
    upcoming: upcomingSchedule_(60),
    alerts: buildAlerts_(overdueRepairs, ac, bld, today)
  };
}

/** รายการ "สิ่งที่ต้องทำ" รวมทุกโมดูล เรียงตามความสำคัญ */
function buildAlerts_(overdueRepairs, ac, bld, today) {
  var alerts = [];

  overdueRepairs.forEach(function (r) {
    var days = daysBetween_(r.bookDate || r.reportDate, today);
    alerts.push({
      level: r.priority === 'ด่วนมาก' ? 'danger' : 'warn',
      icon: '🔧', module: 'repairs',
      title: 'ห้อง ' + r.room + ' — งานซ่อมค้าง ' + days + ' วัน',
      detail: String(r.items || '').slice(0, 80),
      ref: r.id
    });
  });

  ac.overdue.forEach(function (r) {
    alerts.push({
      level: r.state === 'ยังไม่เคยล้าง' ? 'warn' : 'info',
      icon: '❄️', module: 'ac',
      title: 'ห้อง ' + r.room + ' — ' + (r.state === 'ยังไม่เคยล้าง' ? 'ยังไม่เคยบันทึกการล้างแอร์' : 'ถึงกำหนดล้างแอร์'),
      detail: r.lastService ? ('ล้างล่าสุด ' + thDate_(r.lastService) + ' · ครบกำหนด ' + thDate_(r.nextDue)) : 'ยังไม่มีประวัติการล้าง',
      ref: r.room
    });
  });

  expiringWarranties_().forEach(function (p) {
    alerts.push({
      level: 'info', icon: '🛡️', module: 'purchases',
      title: 'ประกันใกล้หมด: ' + String(p.item).slice(0, 50),
      detail: 'หมดอายุ ' + thDate_(p.warranty.end) + ' (อีก ' + p.warranty.daysLeft + ' วัน)',
      ref: p.id
    });
  });

  bld.upcoming.forEach(function (r) {
    alerts.push({
      level: r.dueInDays < 0 ? 'warn' : 'info', icon: '🏢', module: 'building',
      title: 'งานตึก: ' + r.title,
      detail: 'ครบกำหนดรอบถัดไป ' + thDate_(r.nextDue) + (r.dueInDays < 0 ? ' (เลยกำหนดแล้ว)' : ' (อีก ' + r.dueInDays + ' วัน)'),
      ref: r.id
    });
  });

  var bills = missingBills_();
  if (bills.missing.length) {
    alerts.push({
      level: 'info', icon: '🧾', module: 'finance',
      title: 'ยังไม่ได้บันทึกบิลเดือน ' + bills.label,
      detail: 'ขาด: ' + bills.missing.join(' · '),
      ref: ''
    });
  }

  var order = { danger: 0, warn: 1, info: 2 };
  alerts.sort(function (a, b) { return order[a.level] - order[b.level]; });
  return alerts;
}

function mergeYears_(lists) {
  var set = {};
  lists.forEach(function (l) { (l || []).forEach(function (y) { if (y) set[Number(y)] = true; }); });
  set[new Date().getFullYear()] = true;
  return Object.keys(set).map(Number).sort(function (a, b) { return b - a; });
}

/** ค้นหาข้ามทุกโมดูล */
function globalSearch_(q) {
  var s = String(q || '').trim().toLowerCase();
  if (s.length < 2) return [];
  var out = [];

  function scan(rows, module, label, fields) {
    rows.forEach(function (r) {
      var hay = fields.map(function (f) { return String(r[f] || ''); }).join(' ').toLowerCase();
      if (hay.indexOf(s) >= 0) {
        out.push({
          module: module, label: label, id: r.id || r.room,
          title: String(r[fields[0]] || r.room || ''),
          detail: [r.room, r.year, r.buyDate || r.repairDate || r.payDate || r.endDate].filter(String).join(' · ')
        });
      }
    });
  }

  scan(readRows_(SHEETS.PURCHASES), 'purchases', 'รายการซื้อของ', ['item', 'vendor', 'note', 'category']);
  scan(readRows_(SHEETS.ROOM_REPAIRS), 'repairs', 'ซ่อมแซมห้อง', ['items', 'note', 'technician', 'category']);
  scan(readRows_(SHEETS.BUILDING_REPAIRS), 'building', 'ซ่อมแซมตึก', ['title', 'note', 'contractor', 'zone']);
  scan(readRows_(SHEETS.AC_SERVICE), 'ac', 'ล้างแอร์', ['note', 'technician']);
  scan(readRows_(SHEETS.DEBT_PAYMENTS), 'debt', 'ชำระหนี้', ['installment', 'note', 'payer']);
  scan(readRows_(SHEETS.ROOMS), 'rooms', 'ห้อง', ['tenant', 'phone', 'note']);

  return out.slice(0, 60);
}

/**
 * ปฏิทินงานที่กำลังจะถึงภายใน N วัน — รวมทุกโมดูล
 * ใช้ตอบคำถาม "อาทิตย์นี้ต้องทำอะไรบ้าง"
 */
function upcomingSchedule_(days) {
  days = Number(days || 60);
  var today = todayIso_();
  var out = [];

  listAcService_('all', 'all').forEach(function (r) {
    if (r.serviceDate || !r.bookDate) return;
    var d = daysBetween_(today, r.bookDate);
    if (d === null || d < -30 || d > days) return;
    out.push({ date: r.bookDate, daysLeft: d, icon: '❄️', module: 'ac',
               title: 'ล้างแอร์ ห้อง ' + r.room, detail: r.technician || '', id: r.id });
  });

  listRoomRepairs_('all', 'all', 'all').forEach(function (r) {
    if (r.repairDate || !r.bookDate) return;
    var d = daysBetween_(today, r.bookDate);
    if (d === null || d < -30 || d > days) return;
    out.push({ date: r.bookDate, daysLeft: d, icon: '🔧', module: 'repairs',
               title: 'ซ่อม ห้อง ' + r.room, detail: String(r.items || '').slice(0, 60), id: r.id });
  });

  listBuildingRepairs_('all', 'all', 'all').forEach(function (r) {
    var ref = r.endDate ? r.nextDue : (r.bookDate || r.nextDue);
    if (!ref) return;
    var d = daysBetween_(today, ref);
    if (d === null || d < -30 || d > days) return;
    out.push({ date: ref, daysLeft: d, icon: '🏢', module: 'building',
               title: r.title, detail: r.zone || '', id: r.id });
  });

  out.sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
  return out;
}

/** ค่าใช้จ่ายสะสมรายห้อง — ซ่อม + ล้างแอร์ + ของที่ซื้อเข้าห้อง */
function costPerRoom_(year) {
  var repairs = listRoomRepairs_(year, 'all', 'all');
  var ac = listAcService_(year, 'all');
  var purchases = listPurchases_(year, {});

  var map = {};
  ROOMS.forEach(function (r) {
    map[r] = { room: r, floor: floorOf_(r), repair: 0, ac: 0, purchase: 0, total: 0, jobs: 0 };
  });
  repairs.forEach(function (r) {
    if (!map[r.room]) return;
    map[r.room].repair += toNumber_(r.cost) || 0;
    map[r.room].jobs++;
  });
  ac.forEach(function (r) {
    if (!map[r.room]) return;
    map[r.room].ac += toNumber_(r.cost) || 0;
  });
  purchases.forEach(function (p) {
    if (!map[p.room]) return;
    map[p.room].purchase += toNumber_(p.price) || 0;
  });

  var rows = ROOMS.map(function (r) {
    var x = map[r];
    x.total = round2_(x.repair + x.ac + x.purchase);
    x.repair = round2_(x.repair); x.ac = round2_(x.ac); x.purchase = round2_(x.purchase);
    return x;
  });
  var total = sum_(rows, function (r) { return r.total; });
  return {
    year: year || 'all',
    rooms: rows.slice().sort(function (a, b) { return b.total - a.total; }),
    total: round2_(total),
    average: rows.length ? round2_(total / rows.length) : 0
  };
}


/* ══════════════════════════════════════════════════════════════
   Api.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * Api.gs — ประตูเดียวที่หน้าเว็บเรียกเข้ามา
 *
 * ฝั่งหน้าเว็บ:  google.script.run.withSuccessHandler(cb).api('debt.summary', {ledger:'หนี้หลัก'})
 * ทุก action ผ่านการตรวจสิทธิ์ก่อนเสมอ
 */

function api(action, payload) {
  payload = payload || {};
  try {
    var role = requireRole_(action, payload._key);
    var fn = API_ROUTES[action];
    if (!fn) throw new Error('ไม่รู้จักคำสั่ง: ' + action);
    return { ok: true, data: fn(payload, role) };
  } catch (e) {
    console.error(action + ' -> ' + e);
    return { ok: false, error: String(e && e.message ? e.message : e) };
  }
}

var API_ROUTES = {

  /* ---------- ระบบ ---------- */
  'app.bootstrap': function (p, role) {
    return {
      app: { name: APP.NAME, subtitle: APP.SUBTITLE, version: APP.VERSION },
      user: whoAmI(p._key),
      canEdit: role === ROLE.ADMIN,
      floors: FLOORS,
      rooms: ROOMS,
      schema: {
        purchaseCategories: fieldOptions_(SHEETS.PURCHASES, 'category'),
        repairCategories: fieldOptions_(SHEETS.ROOM_REPAIRS, 'category'),
        repairStatuses: fieldOptions_(SHEETS.ROOM_REPAIRS, 'status'),
        priorities: fieldOptions_(SHEETS.ROOM_REPAIRS, 'priority'),
        acStatuses: fieldOptions_(SHEETS.AC_SERVICE, 'status'),
        buildingZones: fieldOptions_(SHEETS.BUILDING_REPAIRS, 'zone'),
        buildingStatuses: fieldOptions_(SHEETS.BUILDING_REPAIRS, 'status'),
        roomStatuses: fieldOptions_(SHEETS.ROOMS, 'status'),
        debtStatuses: fieldOptions_(SHEETS.DEBTS, 'status'),
        payChannels: fieldOptions_(SHEETS.DEBT_PAYMENTS, 'channel'),
        assetStatuses: fieldOptions_(SHEETS.ASSETS, 'status'),
        financeKinds: fieldOptions_(SHEETS.FINANCE, 'kind'),
        financeChannels: fieldOptions_(SHEETS.FINANCE, 'channel'),
        incomeKinds: INCOME_KINDS
      },
      settings: {
        acCycleMonths: Number(getSetting_('ac_cycle_months', 6)),
        warrantyAlertDays: Number(getSetting_('warranty_alert_days', 30)),
        overdueAlertDays: Number(getSetting_('overdue_alert_days', 7)),
        buildingName: getSetting_('building_name', APP.NAME),
        refreshSeconds: Number(getSetting_('refresh_seconds', 25))
      },
      version: dataVersion_(),
      sheetUrl: role === ROLE.ADMIN ? getSpreadsheet_().getUrl() : ''
    };
  },

  /** เบามาก — หน้าเว็บเรียกถี่ ๆ เพื่อดูว่าข้อมูลเปลี่ยนหรือยัง */
  'app.version': function () { return { version: dataVersion_() }; },

  'app.dashboard': function (p) { return dashboard_(p.year); },
  'app.search': function (p) { return globalSearch_(p.q); },

  /* ---------- หนี้ (ใช้ร่วมกันทั้งหนี้หลักและหนี้รอง) ---------- */
  'debt.summary': function (p) { return debtSummary_(p.ledger || LEDGER_MAIN, p.year); },
  'debt.overview': function () { return debtOverview_(); },
  'debt.payments': function (p) { return listDebtPayments_(p.ledger || LEDGER_MAIN, p.year); },
  'debt.list': function (p) { return listDebts_(p.ledger); },
  'debt.save': function (p) { return saveDebt_(p.record); },
  'debt.delete': function (p) { return deleteDebt_(p.id); },
  'debt.savePayment': function (p) { return saveDebtPayment_(p.record); },
  'debt.deletePayment': function (p) { return deleteDebtPayment_(p.id); },

  /* ---------- รายการซื้อของ ---------- */
  'purchase.summary': function (p) { return purchaseSummary_(p.year); },
  'purchase.list': function (p) { return listPurchases_(p.year, p); },
  'purchase.save': function (p) { return savePurchase_(p.record); },
  'purchase.delete': function (p) { return deletePurchase_(p.id); },
  'purchase.expiring': function (p) { return expiringWarranties_(p.days); },

  /* ---------- ล้างแอร์ ---------- */
  'ac.matrix': function (p) { return acMatrix_(p.year); },
  'ac.list': function (p) { return listAcService_(p.year, p.room); },
  'ac.save': function (p) { return saveAcService_(p.record); },
  'ac.delete': function (p) { return deleteAcService_(p.id); },
  'ac.bulkBook': function (p) { return bulkBookAc_(p); },

  /* ---------- ซ่อมแซมตามห้อง ---------- */
  'repair.matrix': function (p) { return repairMatrix_(p.year); },
  'repair.list': function (p) { return listRoomRepairs_(p.year, p.room, p.status); },
  'repair.save': function (p) { return saveRoomRepair_(p.record); },
  'repair.delete': function (p) { return deleteRoomRepair_(p.id); },

  /* ---------- ซ่อมแซมตึกโดยรวม ---------- */
  'building.summary': function (p) { return buildingSummary_(p.year); },
  'building.list': function (p) { return listBuildingRepairs_(p.year, p.zone, p.status); },
  'building.save': function (p) { return saveBuildingRepair_(p.record); },
  'building.delete': function (p) { return deleteBuildingRepair_(p.id); },

  /* ---------- ห้อง / ทรัพย์สิน ---------- */
  'room.list': function () { return listRooms_(); },
  'room.profile': function (p) { return roomProfile_(p.room); },
  'room.save': function (p) { return saveRoom_(p.record); },
  'asset.list': function (p) { return listAssets_(p.room); },
  'asset.save': function (p) { return saveAsset_(p.record); },
  'asset.delete': function (p) { return deleteAsset_(p.id); },

  /* ---------- ไฟล์แนบ ---------- */
  'file.upload': function (p) { return uploadFiles_(p); },
  'file.trash': function (p) { return trashFile_(p.id); },

  /* ---------- รายรับ-รายจ่ายรายเดือน ---------- */
  'finance.summary': function (p) { return financeSummary_(p.year); },
  'finance.list': function (p) { return listFinance_(p.year, p.kind); },
  'finance.save': function (p) { return saveFinance_(p.record); },
  'finance.delete': function (p) { return deleteFinance_(p.id); },

  /* ---------- รายงาน ---------- */
  'report.costPerRoom': function (p) { return costPerRoom_(p.year); },
  'report.upcoming': function (p) { return upcomingSchedule_(p.days); },

  /* ---------- สำรองข้อมูล ---------- */
  'backup.export': function () { return exportAll_(); },
  'backup.csv': function (p) { return exportCsv_(p.sheet); },
  'backup.import': function (p) { return importAll_(p); },
  'backup.sheets': function () {
    return Object.keys(SHEETS).map(function (k) { return SHEETS[k]; });
  },

  /* ---------- การแจ้งเตือน ---------- */
  'notify.digest': function () { return buildDigest_(); },
  'notify.send': function () { return sendDigestNow(); },

  /* ---------- ลิงก์แชร์ ---------- */
  'share.links': function (p, role) {
    if (role !== ROLE.ADMIN) return { base: '', adminUrl: '', viewUrl: '' };
    var base = '';
    try { base = ScriptApp.getService().getUrl() || ''; } catch (e) { }
    return {
      base: base,
      adminUrl: base ? base + '?key=' + getSetting_('admin_token', '') : '',
      viewUrl: base ? base + '?key=' + getSetting_('view_token', '') : ''
    };
  },
  'share.rotateToken': function () { return rotateViewToken_(); },

  /* ---------- สำรองข้อมูลลง Drive ---------- */
  'backup.backupNow': function () { return backupToDrive_(); },
  'backup.history': function (p, role) { return role === ROLE.ADMIN ? listBackups_() : []; }
};

/** ดึงตัวเลือก dropdown จาก SCHEMA เพื่อให้หน้าเว็บกับชีตใช้ชุดเดียวกันเสมอ */
function fieldOptions_(sheetName, key) {
  var cols = SCHEMA[sheetName] || [];
  for (var i = 0; i < cols.length; i++) {
    if (cols[i].key === key) return cols[i].options || [];
  }
  return [];
}


/* ══════════════════════════════════════════════════════════════
   Notify.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * Notify.gs — สรุปสิ่งที่ต้องทำ ส่งเข้าอีเมล (และ LINE ถ้าตั้งค่าไว้)
 */

function installWeeklyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sendDigestNow') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendDigestNow')
    .timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8)
    .inTimezone(APP.TIMEZONE).create();

  var msg = 'ตั้งการแจ้งเตือนอัตโนมัติแล้ว — ทุกวันจันทร์ 08:00 น.';
  alert_(msg);
  return msg;
}

function buildDigest_() {
  var d = dashboard_(String(new Date().getFullYear()));
  return {
    generatedAt: nowStamp_(),
    year: d.year,
    debtRemaining: d.debtMain.remaining,
    debtPercent: d.debtMain.percent,
    subRemaining: d.debtSub.remaining,
    openRepairs: d.repairs.openJobs,
    overdueRepairs: d.repairs.overdue,
    acPending: d.ac.roomsPending,
    acOverdue: d.ac.overdue,
    warrantyExpiring: d.purchases.warranty.expiring,
    spendThisYear: d.spendThisYear,
    alerts: d.alerts.slice(0, 25)
  };
}

function sendDigestNow() {
  var g = buildDigest_();
  var to = props_().getProperty(PROP.NOTIFY_EMAIL) || ownerEmail_();
  if (!to) return 'ไม่พบอีเมลปลายทาง — ตั้งค่า Script Property NOTIFY_EMAIL';

  var html = digestHtml_(g);
  MailApp.sendEmail({
    to: to,
    subject: '[' + APP.NAME + '] สรุปงานประจำสัปดาห์ ' + g.generatedAt.slice(0, 10),
    htmlBody: html
  });
  pushLine_(digestText_(g));
  logActivity_('ส่งสรุปแจ้งเตือน', to, g.alerts.length + ' รายการ');
  return 'ส่งสรุปไปที่ ' + to + ' แล้ว (' + g.alerts.length + ' รายการแจ้งเตือน)';
}

function digestHtml_(g) {
  var rows = g.alerts.map(function (a) {
    var color = a.level === 'danger' ? '#dc2626' : (a.level === 'warn' ? '#d97706' : '#2563eb');
    return '<tr>' +
      '<td style="padding:8px 10px;border-bottom:1px solid #eee;width:28px">' + a.icon + '</td>' +
      '<td style="padding:8px 10px;border-bottom:1px solid #eee">' +
        '<div style="color:' + color + ';font-weight:600">' + escapeHtml_(a.title) + '</div>' +
        '<div style="color:#666;font-size:13px">' + escapeHtml_(a.detail) + '</div>' +
      '</td></tr>';
  }).join('');

  return '<div style="font-family:\'Noto Sans Thai\',Tahoma,sans-serif;max-width:640px">' +
    '<h2 style="margin:0 0 4px">' + APP.NAME + '</h2>' +
    '<div style="color:#666;margin-bottom:16px">สรุปประจำสัปดาห์ · ' + g.generatedAt + '</div>' +
    '<table style="width:100%;border-collapse:collapse;margin-bottom:20px">' +
      kv_('หนี้หลักคงเหลือ', fmtMoney_(g.debtRemaining) + ' บาท (ชำระแล้ว ' + g.debtPercent.toFixed(1) + '%)') +
      kv_('หนี้รองคงเหลือ', fmtMoney_(g.subRemaining) + ' บาท') +
      kv_('ค่าใช้จ่ายปีนี้', fmtMoney_(g.spendThisYear) + ' บาท') +
      kv_('งานซ่อมค้าง', g.openRepairs + ' งาน (เกินกำหนด ' + g.overdueRepairs + ')') +
      kv_('ห้องที่ยังไม่ล้างแอร์ปีนี้', g.acPending.length + ' ห้อง') +
      kv_('ประกันใกล้หมดอายุ', g.warrantyExpiring + ' รายการ') +
    '</table>' +
    (rows ? '<h3 style="margin:0 0 8px">สิ่งที่ต้องทำ</h3><table style="width:100%;border-collapse:collapse">' + rows + '</table>'
          : '<p style="color:#16a34a">ไม่มีงานค้าง 🎉</p>') +
    '</div>';
}

function kv_(k, v) {
  return '<tr><td style="padding:6px 0;color:#666;width:200px">' + k + '</td>' +
         '<td style="padding:6px 0;font-weight:600">' + v + '</td></tr>';
}

function digestText_(g) {
  var lines = [
    APP.NAME + ' — สรุปประจำสัปดาห์',
    'หนี้หลักคงเหลือ ' + fmtMoney_(g.debtRemaining) + ' บาท (' + g.debtPercent.toFixed(1) + '%)',
    'งานซ่อมค้าง ' + g.openRepairs + ' งาน (เกินกำหนด ' + g.overdueRepairs + ')',
    'ห้องที่ยังไม่ล้างแอร์ปีนี้ ' + g.acPending.length + ' ห้อง',
    'ประกันใกล้หมด ' + g.warrantyExpiring + ' รายการ'
  ];
  return lines.join('\n');
}

/** ส่งเข้า LINE ผ่าน Messaging API (ถ้าตั้ง LINE_TOKEN + LINE_TO ไว้) */
function pushLine_(text) {
  var token = props_().getProperty(PROP.LINE_TOKEN);
  var to = props_().getProperty('LINE_TO');
  if (!token || !to) return false;
  try {
    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + token },
      payload: JSON.stringify({ to: to, messages: [{ type: 'text', text: text }] }),
      muteHttpExceptions: true
    });
    return true;
  } catch (e) {
    console.warn('LINE push failed: ' + e);
    return false;
  }
}

function fmtMoney_(n) {
  return Utilities.formatString('%s', (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }));
}

function escapeHtml_(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}


/* ══════════════════════════════════════════════════════════════
   Web.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * Web.gs — จุดเข้าเว็บแอป
 */

function doGet(e) {
  var key = safeKey_((e && e.parameter && e.parameter.key) || '');
  var role = resolveRole_(key);

  if (role === ROLE.NONE) return denyPage_();

  // อัปเดตโค้ดแล้วเปิดเว็บเลยโดยไม่ได้รัน START_HERE ก็ต้องย้ายคอลัมน์ให้ทัน
  // ไม่งั้นโค้ดใหม่จะอ่านชีตโครงเก่าแล้วข้อมูลเลื่อนคอลัมน์
  // (ถ้าย้ายไปแล้วจะเป็นแค่การอ่านค่า property หนึ่งครั้ง ไม่หน่วง)
  runMigrations_();

  rememberExecUrl_();   // ตอนนี้โค้ดทำงานอยู่ใน /exec จริง จึงจดที่อยู่ไว้ใช้ตอนแสดงลิงก์

  var t = HtmlService.createTemplate(indexHtml_());
  t.appName = APP.NAME;
  t.subtitle = APP.SUBTITLE;
  t.version = APP.VERSION;
  t.accessKey = key;   // กรองแล้ว ปลอดภัยที่จะฝังลงหน้าโดยตรง
  t.role = role;

  return t.evaluate()
    .setTitle(APP.NAME)
    .setFaviconUrl('https://ssl.gstatic.com/docs/spreadsheets/forms/favicon_jfk2.png')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * กรองกุญแจให้เหลือเฉพาะตัวอักษรที่ตัวสร้างกุญแจใช้จริง
 * เพื่อให้ฝังลงในหน้าเว็บด้วย <?!= ?> ได้อย่างปลอดภัย
 */
function safeKey_(k) {
  return String(k || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
}

/** ใช้ใน template: <?!= include('ui/Style') ?> */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/** หน้าที่แสดงเมื่อเปิดลิงก์โดยไม่มีกุญแจที่ถูกต้อง */
function denyPage_() {
  var html =
    '<!doctype html><html lang="th"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;600&display=swap" rel="stylesheet">' +
    '<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0f1729;color:#e6ecf7;' +
    "font-family:'IBM Plex Sans Thai',sans-serif;padding:24px}" +
    '.b{max-width:420px;text-align:center}.b h1{font-size:19px;margin:0 0 10px}' +
    '.b p{color:#8794ab;font-size:14px;line-height:1.7;margin:0}' +
    '.ic{font-size:44px;margin-bottom:14px}</style></head><body>' +
    '<div class="b"><div class="ic">🔒</div>' +
    '<h1>' + APP.NAME + '</h1>' +
    '<p>ลิงก์นี้ไม่มีสิทธิ์เข้าใช้งาน<br>กรุณาขอลิงก์ที่ถูกต้องจากเจ้าของหอพัก</p>' +
    '</div></body></html>';
  return HtmlService.createHtmlOutput(html)
    .setTitle(APP.NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}



/* ══════════════════════════════════════════════════════════════
   หน้าเว็บทั้งหมด (Index.html) ฝังไว้เป็น base64
   แก้ที่ src/ui/ แล้วรัน  node build/bundle.js  เพื่อสร้างใหม่
   ══════════════════════════════════════════════════════════════ */

var INDEX_HTML_B64 = [
  'PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9InRoIj4KPGhlYWQ+CiAgPGJhc2UgdGFyZ2V0PSJfdG9wIj4KICA8bWV0YSBjaGFyc2V0PSJ1dGYtOCI+CiAgPG1ldGEgbmFtZT0idmlld3BvcnQiIGNvbnRlbnQ9IndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1z',
  'Y2FsZT0xLCB2aWV3cG9ydC1maXQ9Y292ZXIiPgogIDx0aXRsZT48Pz0gYXBwTmFtZSA/PjwvdGl0bGU+CiAgPGxpbmsgcmVsPSJwcmVjb25uZWN0IiBocmVmPSJodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tIj4KICA8bGluayByZWw9InByZWNvbm5lY3QiIGhy',
  'ZWY9Imh0dHBzOi8vZm9udHMuZ3N0YXRpYy5jb20iIGNyb3Nzb3JpZ2luPgogIDxsaW5rIGhyZWY9Imh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb20vY3NzMj9mYW1pbHk9QmFpK0phbWp1cmVlOndnaHRANTAwOzYwMDs3MDAmZmFtaWx5PUlCTStQbGV4K1NhbnMr',
  'VGhhaTp3Z2h0QDQwMDs1MDA7NjAwOzcwMCZkaXNwbGF5PXN3YXAiIHJlbD0ic3R5bGVzaGVldCI+CiAgPHN0eWxlPgovKiA9PT09PT09PT09PT0gdG9rZW5zID09PT09PT09PT09PSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0KICAg4LiY4Li14Lih',
  '4Liq4Lin4LmI4Liy4LiHL+C4oeC4t+C4lCDguITguKPguK3guJrguITguKXguLjguKEgMyDguKrguJbguLLguJnguLA6CiAgIDpyb290ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSDguJjguLXguKHguKrguKfguYjguLLguIcgKOC4hOC5iOC4suC4leC4',
  'seC5ieC4h+C4leC5ieC4mSkKICAgcHJlZmVycy1jb2xvci1zY2hlbWUgKyA6bm90KGxpZ2h0KSA9IOC4nOC4ueC5ieC5g+C4iuC5ieC4leC4seC5ieC4hyBPUyDguYDguJvguYfguJnguKHguLfguJQg4LmB4Lil4Liw4LmE4Lih4LmI4LmE4LiU4LmJ4LmA4Lil4Li3',
  '4Lit4LiB4Liq4Lin4LmI4Liy4LiH4LmE4Lin4LmJCiAgIFtkYXRhLXRoZW1lPSJkYXJrIl0gICAgICAgICAgICAgICAgPSDguJzguLnguYnguYPguIrguYnguYDguKXguLfguK3guIHguKHguLfguJTguYDguK3guIcKICAg4Liq4Li14LiX4Li44LiB4Liq4Li14LiZ',
  '4Li04Lii4Liy4Lih4LmA4Lib4LmH4LiZ4LiV4Lix4Lin4LmB4Lib4Lij4LiX4Li14LmI4LiZ4Li14LmI4LiX4Li14LmI4LmA4LiU4Li14Lii4LinIOKAlCDguKvguYnguLLguKHguYPguKrguYjguKrguLXguJXguKPguIcg4LmGIOC5g+C4meC4hOC4reC4oeC5guC4',
  'nuC5gOC4meC4meC4leC5jAogICDguYLguJfguJnguIHguKXguLLguIfguYDguK3guLXguKLguIfguYTguJvguJfguLLguIfguJnguYnguLPguYDguIfguLTguJnguYLguITguJrguK3guKXguJXguYzguYPguKvguYnguYDguILguYnguLLguIHguLHguJrguKrguLXg',
  'uKvguKXguLHguIEg4LmB4LiX4LiZ4LiX4Li14LmI4LiI4Liw4LmD4LiK4LmJ4LmA4LiX4Liy4LiB4Lil4Liy4LiHIOC5hgotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovCjpyb290ewog',
  'IC0tYmc6I2YyZjVmYTsgLS1zdXJmYWNlOiNmZmY7IC0tc3VyZmFjZS0yOiNmN2Y5ZmM7CiAgLS1pbms6IzBmMTcyOTsgLS1pbmstMjojMzM0MDVhOyAtLW11dGVkOiM1ZjZkODc7IC0tZmFpbnQ6IzhkOWFiMjsKICAtLWxpbmU6I2UwZTZmMDsgLS1saW5lLTI6I2Vl',
  'ZjFmNzsKICAtLW5hdjojMTAxYTMwOyAtLW5hdi0yOiMxYjI4NDY7IC0tbmF2LWluazojYjhjNGRjOyAtLW5hdi1zZWM6IzYxNzA4ZjsKICAtLWJyYW5kOiMyYzVjYzU7IC0tYnJhbmQtaW5rOiNmZmY7IC0tYnJhbmQtc29mdDojZThlZWZmOyAtLWJyYW5kLTI6IzVi',
  'ODdlODsKICAtLW9rOiMwZThhNWY7IC0tb2stc29mdDojZTNmNWVkOyAtLW9rLTI6IzNmYjM4MzsKICAtLXdhcm46I2IyNmEwMDsgLS13YXJuLXNvZnQ6I2ZkZjFkZjsgLS13YXJuLTI6I2Q5OTYzYTsKICAtLWRhbmdlcjojYzYyODI4OyAtLWRhbmdlci1zb2Z0OiNm',
  'ZGVhZWE7CiAgLS1pbmZvOiMwYjZmYTQ7IC0taW5mby1zb2Z0OiNlNWYxZjk7CiAgLS1yOjEycHg7IC0tci1zbTo4cHg7CiAgLS1zaDowIDFweCAycHggcmdiYSgxNSwyMyw0MSwuMDUpLCAwIDFweCAzcHggcmdiYSgxNSwyMyw0MSwuMDYpOwogIC0tc2gtbGc6MCAx',
  'MnB4IDMycHggcmdiYSgxNSwyMyw0MSwuMTYpOwogIC0tbmF2LXc6MjM2cHg7CiAgLS1mb250LXVpOidJQk0gUGxleCBTYW5zIFRoYWknLCdOb3RvIFNhbnMgVGhhaScsJ1NhcmFidW4nLC1hcHBsZS1zeXN0ZW0sQmxpbmtNYWNTeXN0ZW1Gb250LCdTZWdvZSBVSScs',
  'c2Fucy1zZXJpZjsKICAtLWZvbnQtZGlzcGxheTonQmFpIEphbWp1cmVlJywnSUJNIFBsZXggU2FucyBUaGFpJywnTm90byBTYW5zIFRoYWknLHZhcigtLWZvbnQtdWkpOwogIGNvbG9yLXNjaGVtZTpsaWdodDsKfQpAbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1l',
  'OmRhcmspewogIDpyb290Om5vdChbZGF0YS10aGVtZT0ibGlnaHQiXSl7CiAgICAtLWJnOiMwYzExMWI7IC0tc3VyZmFjZTojMTQxYjI4OyAtLXN1cmZhY2UtMjojMWEyMjMxOwogICAgLS1pbms6I2U2ZWNmNzsgLS1pbmstMjojYmZjOWRiOyAtLW11dGVkOiM4Nzk0',
  'YWI7IC0tZmFpbnQ6IzY3NzM4YzsKICAgIC0tbGluZTojMjMyZDNmOyAtLWxpbmUtMjojMWMyNTM0OwogICAgLS1uYXY6IzA4MGMxNDsgLS1uYXYtMjojMTQxYzJiOyAtLW5hdi1pbms6Izk0YTJiZDsgLS1uYXYtc2VjOiM1OTY1N2U7CiAgICAtLWJyYW5kOiM2Zjli',
  'ZmY7IC0tYnJhbmQtaW5rOiMwYjEwMjA7IC0tYnJhbmQtc29mdDojMTcyNDRhOyAtLWJyYW5kLTI6IzlkYmFmZjsgLS1icmFuZC0yOiM5ZGJhZmY7CiAgICAtLW9rOiMzNWM5OGE7IC0tb2stc29mdDojMGYyYTIwOyAtLW9rLTI6IzZmZGNhYzsgLS1vay0yOiM2ZmRj',
  'YWM7CiAgICAtLXdhcm46I2UwYTM0MDsgLS13YXJuLXNvZnQ6IzJjMjExMzsgLS13YXJuLTI6I2YwYzQ3NzsgLS13YXJuLTI6I2YwYzQ3NzsKICAgIC0tZGFuZ2VyOiNmMDcxNmI7IC0tZGFuZ2VyLXNvZnQ6IzJlMTgxODsKICAgIC0taW5mbzojNGNiNmVhOyAtLWlu',
  'Zm8tc29mdDojMTAyNDJmOwogICAgLS1zaDowIDFweCAycHggcmdiYSgwLDAsMCwuNDUpOwogICAgLS1zaC1sZzowIDE2cHggNDBweCByZ2JhKDAsMCwwLC42Mik7CiAgICBjb2xvci1zY2hlbWU6ZGFyazsKICB9Cn0KOnJvb3RbZGF0YS10aGVtZT0iZGFyayJdewog',
  'IC0tYmc6IzBjMTExYjsgLS1zdXJmYWNlOiMxNDFiMjg7IC0tc3VyZmFjZS0yOiMxYTIyMzE7CiAgLS1pbms6I2U2ZWNmNzsgLS1pbmstMjojYmZjOWRiOyAtLW11dGVkOiM4Nzk0YWI7IC0tZmFpbnQ6IzY3NzM4YzsKICAtLWxpbmU6IzIzMmQzZjsgLS1saW5lLTI6',
  'IzFjMjUzNDsKICAtLW5hdjojMDgwYzE0OyAtLW5hdi0yOiMxNDFjMmI7IC0tbmF2LWluazojOTRhMmJkOyAtLW5hdi1zZWM6IzU5NjU3ZTsKICAtLWJyYW5kOiM2ZjliZmY7IC0tYnJhbmQtaW5rOiMwYjEwMjA7IC0tYnJhbmQtc29mdDojMTcyNDRhOyAtLWJyYW5k',
  'LTI6IzlkYmFmZjsKICAtLW9rOiMzNWM5OGE7IC0tb2stc29mdDojMGYyYTIwOyAtLW9rLTI6IzZmZGNhYzsKICAtLXdhcm46I2UwYTM0MDsgLS13YXJuLXNvZnQ6IzJjMjExMzsgLS13YXJuLTI6I2YwYzQ3NzsKICAtLWRhbmdlcjojZjA3MTZiOyAtLWRhbmdlci1z',
  'b2Z0OiMyZTE4MTg7CiAgLS1pbmZvOiM0Y2I2ZWE7IC0taW5mby1zb2Z0OiMxMDI0MmY7CiAgLS1zaDowIDFweCAycHggcmdiYSgwLDAsMCwuNDUpOwogIC0tc2gtbGc6MCAxNnB4IDQwcHggcmdiYSgwLDAsMCwuNjIpOwogIGNvbG9yLXNjaGVtZTpkYXJrOwp9Cgoq',
  'e2JveC1zaXppbmc6Ym9yZGVyLWJveH0KaHRtbCxib2R5e21hcmdpbjowO3BhZGRpbmc6MH0KYm9keXsKICBmb250LWZhbWlseTp2YXIoLS1mb250LXVpKTsKICBiYWNrZ3JvdW5kOnZhcigtLWJnKTsgY29sb3I6dmFyKC0taW5rKTsgZm9udC1zaXplOjE0cHg7IGxp',
  'bmUtaGVpZ2h0OjEuNTU7CiAgLXdlYmtpdC1mb250LXNtb290aGluZzphbnRpYWxpYXNlZDsKfQppbWd7bWF4LXdpZHRoOjEwMCV9CltoaWRkZW5de2Rpc3BsYXk6bm9uZSFpbXBvcnRhbnR9Cjpmb2N1cy12aXNpYmxle291dGxpbmU6MnB4IHNvbGlkIHZhcigtLWJy',
  'YW5kKTtvdXRsaW5lLW9mZnNldDoycHg7Ym9yZGVyLXJhZGl1czo1cHh9CkBtZWRpYSAocHJlZmVycy1yZWR1Y2VkLW1vdGlvbjpyZWR1Y2UpewogICosKjo6YmVmb3JlLCo6OmFmdGVye2FuaW1hdGlvbi1kdXJhdGlvbjouMDFtcyFpbXBvcnRhbnQ7YW5pbWF0aW9u',
  'LWl0ZXJhdGlvbi1jb3VudDoxIWltcG9ydGFudDt0cmFuc2l0aW9uLWR1cmF0aW9uOi4wMW1zIWltcG9ydGFudH0KfQphe2NvbG9yOnZhcigtLWJyYW5kKTt0ZXh0LWRlY29yYXRpb246bm9uZX0KYnV0dG9uLGlucHV0LHNlbGVjdCx0ZXh0YXJlYXtmb250OmluaGVy',
  'aXQ7Y29sb3I6aW5oZXJpdH0KOjotd2Via2l0LXNjcm9sbGJhcnt3aWR0aDoxMHB4O2hlaWdodDoxMHB4fQo6Oi13ZWJraXQtc2Nyb2xsYmFyLXRodW1ie2JhY2tncm91bmQ6dmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czo4cHg7Ym9yZGVyOjNweCBzb2xpZCB2YXIo',
  'LS1iZyl9CgovKiA9PT09PT09PT09PT0gbGF5b3V0ID09PT09PT09PT09PSAqLwouYXBwe2Rpc3BsYXk6ZmxleDttaW4taGVpZ2h0OjEwMHZofQoubmF2ewogIHdpZHRoOnZhcigtLW5hdi13KTtmbGV4OjAgMCB2YXIoLS1uYXYtdyk7YmFja2dyb3VuZDp2YXIoLS1u',
  'YXYpO2NvbG9yOnZhcigtLW5hdi1pbmspOwogIGRpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47cG9zaXRpb246c3RpY2t5O3RvcDowO2hlaWdodDoxMDB2aDtvdmVyZmxvdy15OmF1dG87Cn0KLmJyYW5ke3BhZGRpbmc6MjBweCAxOHB4IDE2cHg7Ym9y',
  'ZGVyLWJvdHRvbToxcHggc29saWQgcmdiYSgyNTUsMjU1LDI1NSwuMDcpfQouYnJhbmQgYntkaXNwbGF5OmJsb2NrO2NvbG9yOiNmZmY7Zm9udC1zaXplOjE1LjVweDtsZXR0ZXItc3BhY2luZzouMXB4O2ZvbnQtZmFtaWx5OnZhcigtLWZvbnQtZGlzcGxheSk7Zm9u',
  'dC13ZWlnaHQ6NjAwfQouYnJhbmQgc3Bhbntmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLW5hdi1zZWMpfQoubmF2LWxpc3R7cGFkZGluZzoxMHB4IDEwcHggMjBweDtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2dhcDoycHg7ZmxleDoxfQou',
  'bmF2LXNlY3tmb250LXNpemU6MTAuNXB4O2xldHRlci1zcGFjaW5nOi45cHg7dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlO2NvbG9yOnZhcigtLW5hdi1zZWMpO3BhZGRpbmc6MTRweCAxMHB4IDZweDtmb250LXdlaWdodDo2MDB9Ci5uYXYtaXRlbXsKICBkaXNwbGF5',
  'OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMHB4O3BhZGRpbmc6OXB4IDExcHg7Ym9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTsKICBjdXJzb3I6cG9pbnRlcjtjb2xvcjp2YXIoLS1uYXYtaW5rKTtmb250LXNpemU6MTMuNXB4O2JvcmRlcjowO2JhY2tncm91',
  'bmQ6MDt3aWR0aDoxMDAlO3RleHQtYWxpZ246bGVmdDsKfQoubmF2LWl0ZW06aG92ZXJ7YmFja2dyb3VuZDp2YXIoLS1uYXYtMik7Y29sb3I6I2ZmZn0KLm5hdi1pdGVtLm9ue2JhY2tncm91bmQ6dmFyKC0tYnJhbmQpO2NvbG9yOnZhcigtLWJyYW5kLWluayk7Zm9u',
  'dC13ZWlnaHQ6NjAwfQoubmF2LWl0ZW0gLmlje3dpZHRoOjE4cHg7dGV4dC1hbGlnbjpjZW50ZXI7Zm9udC1zaXplOjE1cHh9Ci5uYXYtaXRlbSAuYmFkZ2V7bWFyZ2luLWxlZnQ6YXV0bztiYWNrZ3JvdW5kOnJnYmEoMjU1LDI1NSwyNTUsLjE0KTtib3JkZXItcmFk',
  'aXVzOjIwcHg7cGFkZGluZzoxcHggN3B4O2ZvbnQtc2l6ZToxMXB4fQoubmF2LWl0ZW0ub24gLmJhZGdle2JhY2tncm91bmQ6cmdiYSgyNTUsMjU1LDI1NSwuMjUpfQoubmF2LWZvb3R7cGFkZGluZzoxMnB4IDE2cHg7Ym9yZGVyLXRvcDoxcHggc29saWQgcmdiYSgy',
  'NTUsMjU1LDI1NSwuMDcpO2ZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0tbmF2LXNlYyl9CgoubWFpbntmbGV4OjE7bWluLXdpZHRoOjA7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbn0KLnRvcHsKICBwb3NpdGlvbjpzdGlja3k7dG9wOjA7ei1p',
  'bmRleDozMDtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpO2JvcmRlci1ib3R0b206MXB4IHNvbGlkIHZhcigtLWxpbmUpOwogIHBhZGRpbmc6MTFweCAyMnB4O2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjEycHg7ZmxleC13cmFwOndyYXA7Cn0K',
  'LnRvcCBoMXtmb250LXNpemU6MTcuNXB4O21hcmdpbjowO2ZvbnQtd2VpZ2h0OjYwMDtsZXR0ZXItc3BhY2luZzotLjFweDtmb250LWZhbWlseTp2YXIoLS1mb250LWRpc3BsYXkpO3RleHQtd3JhcDpiYWxhbmNlfQoudG9wIC5zdWJ7Zm9udC1zaXplOjEycHg7Y29s',
  'b3I6dmFyKC0tbXV0ZWQpO21hcmdpbi10b3A6MXB4fQoudG9wLXJpZ2h0e21hcmdpbi1sZWZ0OmF1dG87ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6OHB4O2ZsZXgtd3JhcDp3cmFwfQouY29udGVudHtwYWRkaW5nOjIwcHggMjJweCA2NHB4O21h',
  'eC13aWR0aDoxMzIwcHg7d2lkdGg6MTAwJX0KCi5idXJnZXJ7ZGlzcGxheTpub25lO2JhY2tncm91bmQ6MDtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6dmFyKC0tci1zbSk7cGFkZGluZzo2cHggMTBweDtjdXJzb3I6cG9pbnRlcn0K',
  'Ci8qID09PT09PT09PT09PSBjb250cm9scyA9PT09PT09PT09PT0gKi8KLnNlbCwuaW5wLC50YXsKICBiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpO2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTsKICBwYWRkaW5n',
  'OjdweCAxMXB4O2ZvbnQtc2l6ZToxMy41cHg7d2lkdGg6MTAwJTtvdXRsaW5lOjA7dHJhbnNpdGlvbjpib3JkZXItY29sb3IgLjE1cyxib3gtc2hhZG93IC4xNXM7Cn0KLnNlbDpmb2N1cywuaW5wOmZvY3VzLC50YTpmb2N1c3tib3JkZXItY29sb3I6dmFyKC0tYnJh',
  'bmQpO2JveC1zaGFkb3c6MCAwIDAgM3B4IHZhcigtLWJyYW5kLXNvZnQpfQoudGF7bWluLWhlaWdodDo3NHB4O3Jlc2l6ZTp2ZXJ0aWNhbH0KLnNlbHtjdXJzb3I6cG9pbnRlcjtwYWRkaW5nLXJpZ2h0OjI2cHh9Ci53LWF1dG97d2lkdGg6YXV0b30KLmJ0bnsKICBk',
  'aXNwbGF5OmlubGluZS1mbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6NnB4O2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlKTsKICBib3JkZXItcmFkaXVzOnZhcigtLXItc20pO3BhZGRpbmc6N3B4IDEzcHg7Zm9u',
  'dC1zaXplOjEzLjVweDtjdXJzb3I6cG9pbnRlcjtmb250LXdlaWdodDo1MDA7CiAgdHJhbnNpdGlvbjpiYWNrZ3JvdW5kIC4xNXMsYm9yZGVyLWNvbG9yIC4xNXMsdHJhbnNmb3JtIC4wNXM7d2hpdGUtc3BhY2U6bm93cmFwOwp9Ci5idG46aG92ZXJ7YmFja2dyb3Vu',
  'ZDp2YXIoLS1zdXJmYWNlLTIpO2JvcmRlci1jb2xvcjp2YXIoLS1mYWludCl9Ci5idG46YWN0aXZle3RyYW5zZm9ybTp0cmFuc2xhdGVZKDFweCl9Ci5idG4ucHJpe2JhY2tncm91bmQ6dmFyKC0tYnJhbmQpO2JvcmRlci1jb2xvcjp2YXIoLS1icmFuZCk7Y29sb3I6',
  'dmFyKC0tYnJhbmQtaW5rKX0KLmJ0bi5wcmk6aG92ZXJ7ZmlsdGVyOmJyaWdodG5lc3MoMS4wNyl9Ci5idG4uZGdye2NvbG9yOnZhcigtLWRhbmdlcik7Ym9yZGVyLWNvbG9yOnZhcigtLWRhbmdlcil9Ci5idG4uZGdyOmhvdmVye2JhY2tncm91bmQ6dmFyKC0tZGFu',
  'Z2VyLXNvZnQpfQouYnRuLnNte3BhZGRpbmc6NHB4IDlweDtmb250LXNpemU6MTIuNXB4fQouYnRuLmljb257cGFkZGluZzo1cHggOHB4fQouYnRuW2Rpc2FibGVkXXtvcGFjaXR5Oi41O2N1cnNvcjpub3QtYWxsb3dlZH0KCi5jaGlwc3tkaXNwbGF5OmZsZXg7Z2Fw',
  'OjZweDtmbGV4LXdyYXA6d3JhcH0KLmNoaXB7CiAgYm9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpO2JvcmRlci1yYWRpdXM6OTlweDtwYWRkaW5nOjRweCAxMnB4OwogIGZvbnQtc2l6ZToxMi41cHg7Y3Vyc29yOnBv',
  'aW50ZXI7Y29sb3I6dmFyKC0taW5rLTIpOwp9Ci5jaGlwOmhvdmVye2JvcmRlci1jb2xvcjp2YXIoLS1icmFuZCk7Y29sb3I6dmFyKC0tYnJhbmQpfQouY2hpcC5vbntiYWNrZ3JvdW5kOnZhcigtLWJyYW5kKTtib3JkZXItY29sb3I6dmFyKC0tYnJhbmQpO2NvbG9y',
  'OnZhcigtLWJyYW5kLWluayk7Zm9udC13ZWlnaHQ6NjAwfQoKLyogPT09PT09PT09PT09IGNhcmRzID09PT09PT09PT09PSAqLwouY2FyZHtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpO2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czp2',
  'YXIoLS1yKTtib3gtc2hhZG93OnZhcigtLXNoKX0KLmNhcmQtaHtwYWRkaW5nOjE0cHggMTZweDtib3JkZXItYm90dG9tOjFweCBzb2xpZCB2YXIoLS1saW5lLTIpO2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjEwcHg7ZmxleC13cmFwOndyYXB9',
  'Ci5jYXJkLWggaDN7bWFyZ2luOjA7Zm9udC1zaXplOjE0LjVweDtmb250LXdlaWdodDo2MDA7Zm9udC1mYW1pbHk6dmFyKC0tZm9udC1kaXNwbGF5KTt0ZXh0LXdyYXA6YmFsYW5jZX0KLmNhcmQtaCAuc3B7bWFyZ2luLWxlZnQ6YXV0bztkaXNwbGF5OmZsZXg7Z2Fw',
  'OjZweDthbGlnbi1pdGVtczpjZW50ZXI7ZmxleC13cmFwOndyYXB9Ci5jYXJkLWJ7cGFkZGluZzoxNnB4fQouY2FyZC1iLmZsdXNoe3BhZGRpbmc6MH0KCi5ncmlke2Rpc3BsYXk6Z3JpZDtnYXA6MTRweH0KLmcye2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQo',
  'MixtaW5tYXgoMCwxZnIpKX0KLmcze2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoMyxtaW5tYXgoMCwxZnIpKX0KLmc0e2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoNCxtaW5tYXgoMCwxZnIpKX0KLmctYXV0b3tncmlkLXRlbXBsYXRlLWNvbHVtbnM6',
  'cmVwZWF0KGF1dG8tZmlsbCxtaW5tYXgoMjQwcHgsMWZyKSl9CgovKiBLUEkgKi8KLmtwaXtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpO2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czp2YXIoLS1yKTtwYWRkaW5nOjE0cHggMTZweDti',
  'b3gtc2hhZG93OnZhcigtLXNoKX0KLmtwaSAubGJse2ZvbnQtc2l6ZToxMnB4O2NvbG9yOnZhcigtLW11dGVkKTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo2cHh9Ci5rcGkgLnZhbHtmb250LXNpemU6MjNweDtmb250LXdlaWdodDo2MDA7bGV0',
  'dGVyLXNwYWNpbmc6LS40cHg7bWFyZ2luLXRvcDo1cHg7Zm9udC1mYW1pbHk6dmFyKC0tZm9udC1kaXNwbGF5KTtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXN9Ci5rcGkgLmNhcHtmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLWZhaW50KTttYXJn',
  'aW4tdG9wOjJweDtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXN9Ci5rcGkuYWNjZW50e2JhY2tncm91bmQ6dmFyKC0tYnJhbmQtc29mdCk7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50fQoua3BpLmFjY2VudCAubGJse2NvbG9yOnZhcigtLWJyYW5kKX0K',
  'LmtwaS5nb29kIC52YWx7Y29sb3I6dmFyKC0tb2spfSAua3BpLmJhZCAudmFse2NvbG9yOnZhcigtLWRhbmdlcil9IC5rcGkud2FybiAudmFse2NvbG9yOnZhcigtLXdhcm4pfQoKLyogcHJvZ3Jlc3MgKi8KLnBiYXJ7aGVpZ2h0OjEwcHg7Ym9yZGVyLXJhZGl1czo5',
  'OXB4O2JhY2tncm91bmQ6dmFyKC0tbGluZS0yKTtvdmVyZmxvdzpoaWRkZW47cG9zaXRpb246cmVsYXRpdmV9Ci5wYmFyPml7ZGlzcGxheTpibG9jaztoZWlnaHQ6MTAwJTtib3JkZXItcmFkaXVzOjk5cHg7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoOTBkZWcs',
  'dmFyKC0tYnJhbmQpLHZhcigtLWJyYW5kLTIpKTt0cmFuc2l0aW9uOndpZHRoIC42cyBjdWJpYy1iZXppZXIoLjQsMCwuMiwxKX0KLnBiYXIubGd7aGVpZ2h0OjE2cHh9Ci5wYmFyLm9rPml7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoOTBkZWcsdmFyKC0tb2sp',
  'LHZhcigtLW9rLTIpKX0KLnBiYXIud2Fybj5pe2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDkwZGVnLHZhcigtLXdhcm4pLHZhcigtLXdhcm4tMikpfQoucG1ldGF7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2ZvbnQtc2l6ZTox',
  'MnB4O2NvbG9yOnZhcigtLW11dGVkKTttYXJnaW4tdG9wOjdweH0KLnBtZXRhIGJ7Y29sb3I6dmFyKC0taW5rKTtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXN9CgovKiA9PT09PT09PT09PT0gdGFibGUgPT09PT09PT09PT09ICovCi50d3tvdmVyZmxv',
  'dy14OmF1dG87LXdlYmtpdC1vdmVyZmxvdy1zY3JvbGxpbmc6dG91Y2h9CnRhYmxlLnR7d2lkdGg6MTAwJTtib3JkZXItY29sbGFwc2U6Y29sbGFwc2U7Zm9udC1zaXplOjEzcHg7bWluLXdpZHRoOjY0MHB4fQp0YWJsZS50IHRoewogIHRleHQtYWxpZ246bGVmdDtw',
  'YWRkaW5nOjlweCAxMnB4O2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKTtib3JkZXItYm90dG9tOjFweCBzb2xpZCB2YXIoLS1saW5lKTsKICBmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLW11dGVkKTtmb250LXdlaWdodDo2MDA7bGV0dGVyLXNwYWNpbmc6',
  'LjNweDt0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2U7d2hpdGUtc3BhY2U6bm93cmFwOwp9CnRhYmxlLnQgdGR7cGFkZGluZzoxMHB4IDEycHg7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgdmFyKC0tbGluZS0yKTt2ZXJ0aWNhbC1hbGlnbjp0b3B9CnRhYmxlLnQgdHI6',
  'bGFzdC1jaGlsZCB0ZHtib3JkZXItYm90dG9tOjB9CnRhYmxlLnQgdGJvZHkgdHI6aG92ZXJ7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpfQoubnVte3RleHQtYWxpZ246cmlnaHQ7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zO3doaXRlLXNwYWNl',
  'Om5vd3JhcH0KLm5vd3JhcHt3aGl0ZS1zcGFjZTpub3dyYXB9Ci50LWFjdGlvbnN7ZGlzcGxheTpmbGV4O2dhcDo0cHg7anVzdGlmeS1jb250ZW50OmZsZXgtZW5kfQoKLyogPT09PT09PT09PT09IGJhZGdlcyA9PT09PT09PT09PT0gKi8KLmJ7ZGlzcGxheTppbmxp',
  'bmUtZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjRweDtib3JkZXItcmFkaXVzOjk5cHg7cGFkZGluZzoycHggOXB4O2ZvbnQtc2l6ZToxMS41cHg7Zm9udC13ZWlnaHQ6NjAwO3doaXRlLXNwYWNlOm5vd3JhcH0KLmIub2t7YmFja2dyb3VuZDp2YXIoLS1vay1z',
  'b2Z0KTtjb2xvcjp2YXIoLS1vayl9Ci5iLndhcm57YmFja2dyb3VuZDp2YXIoLS13YXJuLXNvZnQpO2NvbG9yOnZhcigtLXdhcm4pfQouYi5kZ3J7YmFja2dyb3VuZDp2YXIoLS1kYW5nZXItc29mdCk7Y29sb3I6dmFyKC0tZGFuZ2VyKX0KLmIuaW5mb3tiYWNrZ3Jv',
  'dW5kOnZhcigtLWluZm8tc29mdCk7Y29sb3I6dmFyKC0taW5mbyl9Ci5iLm11dGV7YmFja2dyb3VuZDp2YXIoLS1saW5lLTIpO2NvbG9yOnZhcigtLW11dGVkKX0KCi8qID09PT09PT09PT09PSByb29tIGdyaWQgPT09PT09PT09PT09ICovCi5mbG9vcnN7ZGlzcGxh',
  'eTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtnYXA6MTJweH0KLmZsb29ye2Rpc3BsYXk6ZmxleDtnYXA6MTJweDthbGlnbi1pdGVtczpmbGV4LXN0YXJ0fQouZmxvb3ItdGFnewogIGZsZXg6MCAwIDYycHg7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpO2Jv',
  'cmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTsKICBwYWRkaW5nOjhweDt0ZXh0LWFsaWduOmNlbnRlcjtmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLW11dGVkKTsKfQouZmxvb3ItdGFnIGJ7ZGlzcGxheTpibG9j',
  'aztmb250LXNpemU6MTdweDtjb2xvcjp2YXIoLS1pbmspfQoucm9vbXN7ZGlzcGxheTpncmlkO2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoYXV0by1maWxsLG1pbm1heCgxMjZweCwxZnIpKTtnYXA6OHB4O2ZsZXg6MX0KLnJvb217CiAgYm9yZGVyOjFweCBz',
  'b2xpZCB2YXIoLS1saW5lKTtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpO2JvcmRlci1yYWRpdXM6dmFyKC0tci1zbSk7cGFkZGluZzo5cHggMTBweDsKICBjdXJzb3I6cG9pbnRlcjt0cmFuc2l0aW9uOnRyYW5zZm9ybSAuMXMsYm94LXNoYWRvdyAuMTVzLGJvcmRl',
  'ci1jb2xvciAuMTVzO3Bvc2l0aW9uOnJlbGF0aXZlO292ZXJmbG93OmhpZGRlbjsKfQoucm9vbTpob3Zlcnt0cmFuc2Zvcm06dHJhbnNsYXRlWSgtMXB4KTtib3gtc2hhZG93OnZhcigtLXNoLWxnKTtib3JkZXItY29sb3I6dmFyKC0tYnJhbmQpfQoucm9vbSAubm97',
  'Zm9udC13ZWlnaHQ6NjAwO2ZvbnQtc2l6ZToxNS41cHg7bGV0dGVyLXNwYWNpbmc6MDtmb250LWZhbWlseTp2YXIoLS1mb250LWRpc3BsYXkpO2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtc30KLnJvb20gLnN0e2ZvbnQtc2l6ZToxMXB4O2NvbG9yOnZh',
  'cigtLW11dGVkKTttYXJnaW4tdG9wOjJweDtsaW5lLWhlaWdodDoxLjN9Ci5yb29tIC5kb3R7cG9zaXRpb246YWJzb2x1dGU7dG9wOjlweDtyaWdodDo5cHg7d2lkdGg6OHB4O2hlaWdodDo4cHg7Ym9yZGVyLXJhZGl1czo5OXB4O2JhY2tncm91bmQ6dmFyKC0tbGlu',
  'ZSl9Ci5yb29tLnMtb2sgLmRvdHtiYWNrZ3JvdW5kOnZhcigtLW9rKX0gLnJvb20ucy13YXJuIC5kb3R7YmFja2dyb3VuZDp2YXIoLS13YXJuKX0KLnJvb20ucy1kZ3IgLmRvdHtiYWNrZ3JvdW5kOnZhcigtLWRhbmdlcil9IC5yb29tLnMtaW5mbyAuZG90e2JhY2tn',
  'cm91bmQ6dmFyKC0taW5mbyl9Ci5yb29tLnMtb2t7Ym9yZGVyLWxlZnQ6M3B4IHNvbGlkIHZhcigtLW9rKX0gLnJvb20ucy13YXJue2JvcmRlci1sZWZ0OjNweCBzb2xpZCB2YXIoLS13YXJuKX0KLnJvb20ucy1kZ3J7Ym9yZGVyLWxlZnQ6M3B4IHNvbGlkIHZhcigt',
  'LWRhbmdlcil9IC5yb29tLnMtaW5mb3tib3JkZXItbGVmdDozcHggc29saWQgdmFyKC0taW5mbyl9CgovKiA9PT09PT09PT09PT0gYWxlcnRzIC8gbGlzdCA9PT09PT09PT09PT0gKi8KLmFsaXN0e2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW59Ci5h',
  'bGl7ZGlzcGxheTpmbGV4O2dhcDoxMXB4O3BhZGRpbmc6MTFweCAxNnB4O2JvcmRlci1ib3R0b206MXB4IHNvbGlkIHZhcigtLWxpbmUtMik7Y3Vyc29yOnBvaW50ZXJ9Ci5hbGk6bGFzdC1jaGlsZHtib3JkZXItYm90dG9tOjB9Ci5hbGk6aG92ZXJ7YmFja2dyb3Vu',
  'ZDp2YXIoLS1zdXJmYWNlLTIpfQouYWxpIC5pY3tmb250LXNpemU6MTZweDtsaW5lLWhlaWdodDoxLjN9Ci5hbGkgLnR0e2ZvbnQtd2VpZ2h0OjYwMDtmb250LXNpemU6MTNweH0KLmFsaSAuZGR7Zm9udC1zaXplOjEycHg7Y29sb3I6dmFyKC0tbXV0ZWQpO21hcmdp',
  'bi10b3A6MXB4fQouYWxpLmwtZGFuZ2VyIC50dHtjb2xvcjp2YXIoLS1kYW5nZXIpfSAuYWxpLmwtd2FybiAudHR7Y29sb3I6dmFyKC0td2Fybil9CgovKiA9PT09PT09PT09PT0gbWVkaWEgLyB0aHVtYnMgPT09PT09PT09PT09ICovCi50aHVtYnN7ZGlzcGxheTpm',
  'bGV4O2dhcDo1cHg7ZmxleC13cmFwOndyYXB9Ci50aHVtYnsKICB3aWR0aDo0NHB4O2hlaWdodDo0NHB4O2JvcmRlci1yYWRpdXM6NnB4O2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7b2JqZWN0LWZpdDpjb3ZlcjsKICBiYWNrZ3JvdW5kOnZhcigtLXN1cmZh',
  'Y2UtMik7Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTpibG9jazsKfQoudGh1bWIuYmlne3dpZHRoOjkycHg7aGVpZ2h0OjkycHh9Ci5maWxlLWRyb3B7CiAgYm9yZGVyOjEuNXB4IGRhc2hlZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXItc20pO3BhZGRp',
  'bmc6MTRweDt0ZXh0LWFsaWduOmNlbnRlcjsKICBjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC1zaXplOjEyLjVweDtjdXJzb3I6cG9pbnRlcjtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Cn0KLmZpbGUtZHJvcDpob3Zlcntib3JkZXItY29sb3I6dmFyKC0tYnJh',
  'bmQpO2NvbG9yOnZhcigtLWJyYW5kKX0KCi8qID09PT09PT09PT09PSBtb2RhbCA9PT09PT09PT09PT0gKi8KLm92e3Bvc2l0aW9uOmZpeGVkO2luc2V0OjA7YmFja2dyb3VuZDpyZ2JhKDE2LDI0LDQwLC41NSk7YmFja2Ryb3AtZmlsdGVyOmJsdXIoM3B4KTt6LWlu',
  'ZGV4OjEwMDtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6ZmxleC1zdGFydDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO3BhZGRpbmc6MjRweCAxNnB4O292ZXJmbG93LXk6YXV0b30KLm1vZGFse2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7Ym9yZGVyLXJhZGl1czox',
  'NHB4O2JveC1zaGFkb3c6dmFyKC0tc2gtbGcpO3dpZHRoOjEwMCU7bWF4LXdpZHRoOjY2MHB4O21hcmdpbjphdXRvIDA7YW5pbWF0aW9uOnBvcCAuMTZzIGVhc2Utb3V0fQoubW9kYWwud2lkZXttYXgtd2lkdGg6OTYwcHh9CkBrZXlmcmFtZXMgcG9we2Zyb217b3Bh',
  'Y2l0eTowO3RyYW5zZm9ybTp0cmFuc2xhdGVZKC04cHgpIHNjYWxlKC45ODUpfXRve29wYWNpdHk6MTt0cmFuc2Zvcm06bm9uZX19Ci5tb2RhbC1oe3BhZGRpbmc6MTZweCAxOHB4O2JvcmRlci1ib3R0b206MXB4IHNvbGlkIHZhcigtLWxpbmUpO2Rpc3BsYXk6Zmxl',
  'eDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjEwcHh9Ci5tb2RhbC1oIGgze21hcmdpbjowO2ZvbnQtc2l6ZToxNS41cHg7Zm9udC13ZWlnaHQ6NjAwO2ZvbnQtZmFtaWx5OnZhcigtLWZvbnQtZGlzcGxheSl9Ci5tb2RhbC1ie3BhZGRpbmc6MThweDttYXgtaGVpZ2h0',
  'Om1pbig3MHZoLDcwMHB4KTtvdmVyZmxvdy15OmF1dG99Ci5tb2RhbC1me3BhZGRpbmc6MTRweCAxOHB4O2JvcmRlci10b3A6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2Rpc3BsYXk6ZmxleDtnYXA6OHB4O2p1c3RpZnktY29udGVudDpmbGV4LWVuZDtmbGV4LXdyYXA6',
  'd3JhcH0KLnh7bWFyZ2luLWxlZnQ6YXV0bztiYWNrZ3JvdW5kOjA7Ym9yZGVyOjA7Zm9udC1zaXplOjIwcHg7Y29sb3I6dmFyKC0tbXV0ZWQpO2N1cnNvcjpwb2ludGVyO2xpbmUtaGVpZ2h0OjE7cGFkZGluZzoycHggNnB4O2JvcmRlci1yYWRpdXM6NnB4fQoueDpo',
  'b3ZlcntiYWNrZ3JvdW5kOnZhcigtLWxpbmUtMik7Y29sb3I6dmFyKC0taW5rKX0KCi5mZ3JpZHtkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCgyLG1pbm1heCgwLDFmcikpO2dhcDoxM3B4fQouZntkaXNwbGF5OmZsZXg7ZmxleC1kaXJl',
  'Y3Rpb246Y29sdW1uO2dhcDo1cHh9Ci5mLmZ1bGx7Z3JpZC1jb2x1bW46MS8tMX0KLmYgbGFiZWx7Zm9udC1zaXplOjEycHg7Y29sb3I6dmFyKC0taW5rLTIpO2ZvbnQtd2VpZ2h0OjYwMH0KLmYgLmhpbnR7Zm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1mYWlu',
  'dCl9CgovKiA9PT09PT09PT09PT0gbWlzYyA9PT09PT09PT09PT0gKi8KLmVtcHR5e3BhZGRpbmc6NDBweCAyMHB4O3RleHQtYWxpZ246Y2VudGVyO2NvbG9yOnZhcigtLW11dGVkKX0KLmVtcHR5IC5iaWd7Zm9udC1zaXplOjM0cHg7bWFyZ2luLWJvdHRvbTo4cHg7',
  'b3BhY2l0eTouNn0KLnNwaW57ZGlzcGxheTppbmxpbmUtYmxvY2s7d2lkdGg6MTVweDtoZWlnaHQ6MTVweDtib3JkZXI6MnB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci10b3AtY29sb3I6dmFyKC0tYnJhbmQpO2JvcmRlci1yYWRpdXM6OTlweDthbmltYXRpb246',
  'c3AgLjdzIGxpbmVhciBpbmZpbml0ZTt2ZXJ0aWNhbC1hbGlnbjotMnB4fQpAa2V5ZnJhbWVzIHNwe3Rve3RyYW5zZm9ybTpyb3RhdGUoMzYwZGVnKX19Ci50b2FzdHsKICBwb3NpdGlvbjpmaXhlZDtsZWZ0OjUwJTtib3R0b206MjRweDt0cmFuc2Zvcm06dHJhbnNs',
  'YXRlWCgtNTAlKTt6LWluZGV4OjIwMDsKICBiYWNrZ3JvdW5kOnZhcigtLW5hdik7Y29sb3I6I2ZmZjtwYWRkaW5nOjEwcHggMThweDtib3JkZXItcmFkaXVzOjk5cHg7Zm9udC1zaXplOjEzcHg7CiAgYm94LXNoYWRvdzp2YXIoLS1zaC1sZyk7YW5pbWF0aW9uOnVw',
  'IC4ycyBlYXNlLW91dDttYXgtd2lkdGg6OTB2dzsKfQoudG9hc3QuZXJye2JhY2tncm91bmQ6dmFyKC0tZGFuZ2VyKX0KLnRvYXN0Lm9re2JhY2tncm91bmQ6dmFyKC0tb2spfQpAa2V5ZnJhbWVzIHVwe2Zyb217b3BhY2l0eTowO3RyYW5zZm9ybTp0cmFuc2xhdGUo',
  'LTUwJSwxMHB4KX10b3tvcGFjaXR5OjE7dHJhbnNmb3JtOnRyYW5zbGF0ZSgtNTAlLDApfX0KLm11dGVke2NvbG9yOnZhcigtLW11dGVkKX0gLmZhaW50e2NvbG9yOnZhcigtLWZhaW50KX0KLmZzMTJ7Zm9udC1zaXplOjEycHh9IC5mczEze2ZvbnQtc2l6ZToxM3B4',
  'fQoubW9ub3tmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXN9Ci5tdDh7bWFyZ2luLXRvcDo4cHh9IC5tdDEye21hcmdpbi10b3A6MTJweH0gLm10MTZ7bWFyZ2luLXRvcDoxNnB4fSAubWI4e21hcmdpbi1ib3R0b206OHB4fSAubWIxMnttYXJnaW4tYm90',
  'dG9tOjEycHh9Ci5yb3d7ZGlzcGxheTpmbGV4O2dhcDo4cHg7YWxpZ24taXRlbXM6Y2VudGVyO2ZsZXgtd3JhcDp3cmFwfQouc3B7bWFyZ2luLWxlZnQ6YXV0b30KLmhye2hlaWdodDoxcHg7YmFja2dyb3VuZDp2YXIoLS1saW5lLTIpO21hcmdpbjoxNHB4IDB9Ci5j',
  'bGlwe292ZXJmbG93OmhpZGRlbjt0ZXh0LW92ZXJmbG93OmVsbGlwc2lzO2Rpc3BsYXk6LXdlYmtpdC1ib3g7LXdlYmtpdC1saW5lLWNsYW1wOjI7LXdlYmtpdC1ib3gtb3JpZW50OnZlcnRpY2FsfQoKLyogYmFyIGNoYXJ0ICovCi5iYXJze2Rpc3BsYXk6ZmxleDtm',
  'bGV4LWRpcmVjdGlvbjpjb2x1bW47Z2FwOjlweH0KLmJhci1yb3d7ZGlzcGxheTpncmlkO2dyaWQtdGVtcGxhdGUtY29sdW1uczptaW5tYXgoOTBweCwxNTBweCkgMWZyIGF1dG87Z2FwOjEwcHg7YWxpZ24taXRlbXM6Y2VudGVyO2ZvbnQtc2l6ZToxMi41cHh9Ci5i',
  'YXItdHJhY2t7aGVpZ2h0OjhweDtiYWNrZ3JvdW5kOnZhcigtLWxpbmUtMik7Ym9yZGVyLXJhZGl1czo5OXB4O292ZXJmbG93OmhpZGRlbn0KLmJhci1maWxse2hlaWdodDoxMDAlO2JhY2tncm91bmQ6dmFyKC0tYnJhbmQpO2JvcmRlci1yYWRpdXM6OTlweDt0cmFu',
  'c2l0aW9uOndpZHRoIC41c30KLmJhci1yb3cgLnZ7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zO2NvbG9yOnZhcigtLWluay0yKTtmb250LXdlaWdodDo2MDA7d2hpdGUtc3BhY2U6bm93cmFwfQoKLyogdGltZWxpbmUgKi8KLnRse3Bvc2l0aW9uOnJl',
  'bGF0aXZlO3BhZGRpbmctbGVmdDoyMnB4fQoudGw6YmVmb3Jle2NvbnRlbnQ6Jyc7cG9zaXRpb246YWJzb2x1dGU7bGVmdDo2cHg7dG9wOjZweDtib3R0b206NnB4O3dpZHRoOjJweDtiYWNrZ3JvdW5kOnZhcigtLWxpbmUpfQoudGwtaXtwb3NpdGlvbjpyZWxhdGl2',
  'ZTtwYWRkaW5nOjAgMCAxNnB4fQoudGwtaTpiZWZvcmV7Y29udGVudDonJztwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0Oi0yMHB4O3RvcDo1cHg7d2lkdGg6MTBweDtoZWlnaHQ6MTBweDtib3JkZXItcmFkaXVzOjk5cHg7YmFja2dyb3VuZDp2YXIoLS1icmFuZCk7Ym9y',
  'ZGVyOjJweCBzb2xpZCB2YXIoLS1zdXJmYWNlKX0KLnRsLWkgLmR7Zm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1tdXRlZCl9Ci50bC1pIC50e2ZvbnQtd2VpZ2h0OjYwMDtmb250LXNpemU6MTNweH0KCi8qID09PT09PT09PT09PSByZXNwb25zaXZlID09PT09',
  'PT09PT09PSAqLwpAbWVkaWEgKG1heC13aWR0aDo5MDBweCl7CiAgLmc0e2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoMixtaW5tYXgoMCwxZnIpKX0KICAuZzN7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCgyLG1pbm1heCgwLDFmcikpfQp9CkBtZWRp',
  'YSAobWF4LXdpZHRoOjc2MHB4KXsKICAubmF2ewogICAgcG9zaXRpb246Zml4ZWQ7bGVmdDowO3RvcDowO2JvdHRvbTowO3otaW5kZXg6NjA7dHJhbnNmb3JtOnRyYW5zbGF0ZVgoLTEwMCUpOwogICAgdHJhbnNpdGlvbjp0cmFuc2Zvcm0gLjIycyBlYXNlO2JveC1z',
  'aGFkb3c6dmFyKC0tc2gtbGcpOwogIH0KICAubmF2Lm9wZW57dHJhbnNmb3JtOm5vbmV9CiAgLmJ1cmdlcntkaXNwbGF5OmlubGluZS1mbGV4fQogIC5jb250ZW50e3BhZGRpbmc6MTRweCAxNHB4IDgwcHh9CiAgLnRvcHtwYWRkaW5nOjEwcHggMTRweH0KICAuZzIs',
  'LmczLC5nNHtncmlkLXRlbXBsYXRlLWNvbHVtbnM6MWZyfQogIC5mZ3JpZHtncmlkLXRlbXBsYXRlLWNvbHVtbnM6MWZyfQogIC5mbG9vcntmbGV4LWRpcmVjdGlvbjpjb2x1bW59CiAgLmZsb29yLXRhZ3tmbGV4Om5vbmU7d2lkdGg6MTAwJTtkaXNwbGF5OmZsZXg7',
  'Z2FwOjhweDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnQ7dGV4dC1hbGlnbjpsZWZ0fQogIC5mbG9vci10YWcgYntmb250LXNpemU6MTRweH0KICAuc2NyaW17cG9zaXRpb246Zml4ZWQ7aW5zZXQ6MDtiYWNrZ3JvdW5kOnJnYmEo',
  'MCwwLDAsLjQ1KTt6LWluZGV4OjU1fQogIC5tb2RhbC1ie21heC1oZWlnaHQ6bm9uZX0KICAub3Z7cGFkZGluZzowfQogIC5tb2RhbHtib3JkZXItcmFkaXVzOjA7bWluLWhlaWdodDoxMDB2aDttYXgtd2lkdGg6bm9uZX0KfQpAbWVkaWEgcHJpbnR7CiAgLm5hdiwu',
  'dG9wLXJpZ2h0LC5idXJnZXIsLnQtYWN0aW9ucywuYnRue2Rpc3BsYXk6bm9uZSFpbXBvcnRhbnR9CiAgLmFwcHtkaXNwbGF5OmJsb2NrfSBib2R5e2JhY2tncm91bmQ6I2ZmZn0KICAuY2FyZHticmVhay1pbnNpZGU6YXZvaWQ7Ym94LXNoYWRvdzpub25lfQp9Cjwv',
  'c3R5bGU+CjwvaGVhZD4KPGJvZHk+Cgo8ZGl2IGNsYXNzPSJhcHAiPgogIDwhLS0gPT09PT09PT09PT09PT09PT0gc2lkZWJhciA9PT09PT09PT09PT09PT09PSAtLT4KICA8YXNpZGUgY2xhc3M9Im5hdiIgaWQ9Im5hdiI+CiAgICA8ZGl2IGNsYXNzPSJicmFuZCI+',
  'CiAgICAgIDxiPvCfj6IgPD89IGFwcE5hbWUgPz48L2I+CiAgICAgIDxzcGFuPjw/PSBzdWJ0aXRsZSA/PiDCtyB2PD89IHZlcnNpb24gPz48L3NwYW4+CiAgICA8L2Rpdj4KICAgIDxkaXYgY2xhc3M9Im5hdi1saXN0IiBpZD0ibmF2TGlzdCI+PC9kaXY+CiAgICA8',
  'ZGl2IGNsYXNzPSJuYXYtZm9vdCIgaWQ9Im5hdkZvb3QiPuC4geC4s+C4peC4seC4h+C5guC4q+C4peC4lOKApjwvZGl2PgogIDwvYXNpZGU+CgogIDwhLS0gPT09PT09PT09PT09PT09PT0gbWFpbiA9PT09PT09PT09PT09PT09PSAtLT4KICA8ZGl2IGNsYXNzPSJt',
  'YWluIj4KICAgIDxoZWFkZXIgY2xhc3M9InRvcCI+CiAgICAgIDxidXR0b24gY2xhc3M9ImJ1cmdlciIgb25jbGljaz0idG9nZ2xlTmF2KCkiPuKYsDwvYnV0dG9uPgogICAgICA8ZGl2PgogICAgICAgIDxoMSBpZD0icGFnZVRpdGxlIj7guKDguLLguJ7guKPguKfg',
  'uKE8L2gxPgogICAgICAgIDxkaXYgY2xhc3M9InN1YiIgaWQ9InBhZ2VTdWIiPuC5geC4lOC4iuC4muC4reC4o+C5jOC4lOC4o+C4p+C4oeC4l+C4uOC4geC4quC5iOC4p+C4meC4guC4reC4h+C4q+C4reC4nuC4seC4gTwvZGl2PgogICAgICA8L2Rpdj4KICAgICAg',
  'PGRpdiBjbGFzcz0idG9wLXJpZ2h0Ij4KICAgICAgICA8c3BhbiBpZD0ibGl2ZURvdCI+PC9zcGFuPgogICAgICAgIDxpbnB1dCBjbGFzcz0iaW5wIHctYXV0byIgaWQ9InNlYXJjaEJveCIgcGxhY2Vob2xkZXI9IvCflI4g4LiE4LmJ4LiZ4Lir4Liy4LiX4Lix4LmJ',
  '4LiH4Lij4Liw4Lia4Lia4oCmIiBzdHlsZT0id2lkdGg6MTgwcHgiCiAgICAgICAgICAgICAgIG9uaW5wdXQ9Im9uU2VhcmNoKHRoaXMudmFsdWUpIiBhdXRvY29tcGxldGU9Im9mZiI+CiAgICAgICAgPHNlbGVjdCBjbGFzcz0ic2VsIHctYXV0byIgaWQ9InllYXJT',
  'ZWwiIG9uY2hhbmdlPSJzZXRZZWFyKHRoaXMudmFsdWUpIj48L3NlbGVjdD4KICAgICAgICA8YnV0dG9uIGNsYXNzPSJidG4gaWNvbiIgdGl0bGU9IuC4o+C4teC5gOC4n+C4o+C4iiIgb25jbGljaz0icmVmcmVzaCgpIj7ihrs8L2J1dHRvbj4KICAgICAgPC9kaXY+',
  'CiAgICA8L2hlYWRlcj4KICAgIDxtYWluIGNsYXNzPSJjb250ZW50IiBpZD0idmlldyI+CiAgICAgIDxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPjxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+PC9kaXY+4LiB4Liz4Lil4Lix4LiH4LmA4LiK4Li3',
  '4LmI4Lit4Lih4LiV4LmI4Lit4Lij4Liw4Lia4Lia4oCmPC9kaXY+CiAgICA8L21haW4+CiAgPC9kaXY+CjwvZGl2PgoKPGRpdiBpZD0ibW9kYWxSb290Ij48L2Rpdj4KPGRpdiBpZD0idG9hc3RSb290Ij48L2Rpdj4KCjxzY3JpcHQ+CiAgLyog4LiE4LmI4Liy4LiX',
  '4Lix4LmJ4LiH4Liq4Lit4LiH4LiW4Li54LiB4LiB4Lij4Lit4LiH4LmD4Lir4LmJ4LmA4Lir4Lil4Li34Lit4LmB4LiE4LmIIEEtWiBhLXogMC05IF8gLSDguKHguLLguYHguKXguYnguKfguIjguLLguIHguJ3guLHguYjguIfguYDguIvguLTguKPguYzguJ/guYDg',
  'uKfguK3guKPguYwgKHNhZmVLZXlfKQogICAgIOC4iOC4tuC4h+C4q+C4peC4uOC4lOC4reC4reC4geC4iOC4suC4geC5gOC4hOC4o+C4t+C5iOC4reC4h+C4q+C4oeC4suC4ouC4hOC4s+C4nuC4ueC4lOC5hOC4oeC5iOC5hOC4lOC5iQoKICAgICDguJXguYnguK3g',
  'uIfguJ7guLTguKHguJ7guYzguYHguJrguJrguJTguLTguJogKGZvcmNlLXByaW50aW5nKSDguYDguJfguYjguLLguJnguLHguYnguJkg4Lir4LmJ4Liy4Lih4LmD4LiK4LmJ4LmB4Lia4LiaIHN0YW5kYXJkLXByaW50aW5nCiAgICAg4LmA4Lie4Lij4Liy4Liw4LmB',
  '4Lia4Lia4Lir4Lil4Lix4LiH4LiI4LiwIGVzY2FwZSDguYDguITguKPguLfguYjguK3guIfguKvguKHguLLguKLguITguLPguJ7guLnguJTguYDguJvguYfguJkgJnF1b3Q7IOC4i+C4tuC5iOC4h+C5g+C4meC5geC4l+C5h+C4gSBzY3JpcHQKICAgICDguYDguJrg',
  'uKPguLLguKfguYzguYDguIvguK3guKPguYzguYTguKHguYjguJbguK3guJTguIHguKXguLHguJog4LiX4Liz4LmD4Lir4LmJ4LiX4Lix4LmJ4LiH4Lia4Lil4LmH4Lit4LiB4LiZ4Li14LmJ4Lie4Lix4LiH4LiX4Lix4LmJ4LiH4LiB4LmJ4Lit4LiZ4LmB4Lil4Liw',
  '4LiB4Li44LiN4LmB4LiI4LmE4Lih4LmI4LiW4Li24LiH4Lir4LiZ4LmJ4Liy4LmA4Lin4LmH4LiaICovCiAgdmFyIEFDQ0VTU19LRVkgPSAiPD8hPSBhY2Nlc3NLZXkgPz4iOwogIHZhciBVU0VSX1JPTEUgID0gIjw/IT0gcm9sZSA/PiI7CiAgdmFyIENBTl9FRElU',
  'ICAgPSBVU0VSX1JPTEUgPT09ICdhZG1pbic7Cjwvc2NyaXB0Pgo8c2NyaXB0PgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgQXBwLmh0bWwg4oCUIGNvcmU6IHN0YXRlLCBhcGksIHJvdXRlciwg',
  'Zm9ybWF0LCBtb2RhbCwgdXBsb2FkCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKdmFyIFMgPSB7CiAgYm9vdDogbnVsbCwgICAgICAgICAgLy8g4LiC4LmJ4Lit4Lih4Li54Lil4LiV4Lix4LmJ',
  '4LiH4LiV4LmJ4LiZ4LiI4Liy4LiBIGFwcC5ib290c3RyYXAKICBwYWdlOiAnZGFzaGJvYXJkJywKICB5ZWFyOiBTdHJpbmcobmV3IERhdGUoKS5nZXRGdWxsWWVhcigpKSwKICBjYWNoZToge30sICAgICAgICAgICAvLyDguYDguIHguYfguJrguJzguKXguKXguLHg',
  'uJ7guJjguYzguKXguYjguLLguKrguLjguJTguILguK3guIfguYHguJXguYjguKXguLDguKvguJnguYnguLIKICBwYXJhbXM6IHt9LCAgICAgICAgICAvLyDguJXguLHguKfguIHguKPguK3guIfguKLguYjguK3guKLguILguK3guIfguYHguJXguYjguKXguLDguKvg',
  'uJnguYnguLIg4LmA4LiK4LmI4LiZIHtyb29tOiczMTEnLCBzdGF0dXM6J2FsbCd9CiAgYnVzeTogZmFsc2UKfTsKCnZhciBBTExfREVCVFMgPSBbXTsKCnZhciBQQUdFUyA9IFsKICB7IGlkOidkYXNoYm9hcmQnLCBpYzon8J+TiicsIGxhYmVsOifguKDguLLguJ7g',
  'uKPguKfguKEnLCAgICAgICAgICAgICAgc3ViOifguYHguJTguIrguJrguK3guKPguYzguJTguKPguKfguKHguJfguLjguIHguKrguYjguKfguJnguILguK3guIfguKvguK3guJ7guLHguIEnLCAgICAgICAgc2VjOifguKDguLLguJ7guKPguKfguKEnIH0sCiAgeyBp',
  'ZDonZGVidE1haW4nLCAgaWM6J/CfkrAnLCBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4Lij4Liq4Lij4Li44Lib4Lij4Lin4LihJywgICAgICAgc3ViOifguJrguLHguI3guIrguLXguYLguK3guJnguYPguIrguYnguKvguJnguLXguYnguKvguKXguLHguIHguILguK3g',
  'uIfguKvguK3guJ7guLHguIEnLCAgICAgICAgc2VjOifguIHguLLguKPguYDguIfguLTguJknIH0sCiAgeyBpZDonZGVidFN1YicsICAgaWM6J/Cfp74nLCBsYWJlbDon4Lir4LiZ4Li14LmJ4Liq4Li04LiZJywgICAgICAgICAgICAgIHN1Yjon4Lia4Lix4LiN4LiK',
  '4Li14LmC4Lit4LiZ4LmD4LiK4LmJ4Lir4LiZ4Li14LmJ4Lij4Lit4LiH4LiC4Lit4LiH4Lir4Lit4Lie4Lix4LiBJyB9LAogIHsgaWQ6J3B1cmNoYXNlcycsIGljOifwn5uSJywgbGFiZWw6J+C4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4hycs',
  'ICAgICAgICBzdWI6J+C4guC4reC4h+C5gOC4guC5ieC4suC4q+C4reC4nuC4seC4gSDguKPguLLguITguLIg4Lib4Lij4Liw4LiB4Lix4LiZIOC5geC4peC4sOC4quC4peC4tOC4mycgfSwKICB7IGlkOidmaW5hbmNlJywgICBpYzon8J+TkicsIGxhYmVsOifguKPg',
  'uLLguKLguKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4Lii4Lir4LitJywgICAgICBzdWI6J+C4hOC5iOC4suC5gOC4iuC5iOC4suC4l+C4teC5iOC5gOC4geC5h+C4muC5hOC4lOC5iSDCtyDguITguYjguLLguYTguJ8gwrcg4LiE4LmI4Liy4LiZ4LmJ4LizIMK3',
  'IOC4hOC5iOC4suC5gOC4meC5h+C4lSDCtyDguKDguLLguKnguLUnIH0sCiAgeyBpZDonYWMnLCAgICAgICAgaWM6J+KdhO+4jycsIGxhYmVsOifguKXguYnguLLguIfguYHguK3guKPguYwnLCAgICAgICAgICAgIHN1Yjon4LiV4Liy4Lij4Liy4LiH4Lil4LmJ4Liy',
  '4LiH4LmB4Lit4Lij4LmM4Lij4Liy4Lii4Lir4LmJ4Lit4LiHIDI0IOC4q+C5ieC4reC4hycsICAgICAgc2VjOifguIvguYjguK3guKHguJrguLPguKPguLjguIcnIH0sCiAgeyBpZDoncmVwYWlycycsICAgaWM6J/CflKcnLCBsYWJlbDon4LiL4LmI4Lit4Lih4LmB',
  '4LiL4Lih4LiV4Liy4Lih4Lir4LmJ4Lit4LiHJywgICAgICBzdWI6J+C4h+C4suC4meC5geC4iOC5ieC4h+C4i+C5iOC4reC4oeC5geC4ouC4geC4leC4suC4oeC4q+C5ieC4reC4hycgfSwKICB7IGlkOididWlsZGluZycsICBpYzon8J+PoicsIGxhYmVsOifguIvg',
  'uYjguK3guKHguYHguIvguKHguJXguLbguIHguYLguJTguKLguKPguKfguKEnLCAgICBzdWI6J+C4h+C4suC4meC4quC5iOC4p+C4meC4geC4peC4suC4h+C4guC4reC4h+C4reC4suC4hOC4suC4oycgfSwKICB7IGlkOidyb29tcycsICAgICBpYzon8J+aqicsIGxh',
  'YmVsOifguKvguYnguK3guIfguJ7guLHguIEnLCAgICAgICAgICAgICBzdWI6J+C4l+C4sOC5gOC4muC4teC4ouC4meC4q+C5ieC4reC4h+C5geC4peC4sOC4m+C4o+C4sOC4p+C4seC4leC4tOC4o+C4suC4ouC4q+C5ieC4reC4hycsICAgICAgIHNlYzon4LiC4LmJ',
  '4Lit4Lih4Li54LilJyB9LAogIHsgaWQ6J3JlcG9ydHMnLCAgIGljOifwn5OIJywgbGFiZWw6J+C4o+C4suC4ouC4h+C4suC4mSAmIOC4quC4s+C4o+C4reC4h+C4guC5ieC4reC4oeC4ueC4pScsIHN1Yjon4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Lij',
  '4Liy4Lii4Lir4LmJ4Lit4LiHIMK3IOC4m+C4j+C4tOC4l+C4tOC4meC4h+C4suC4mSDCtyDguKrguYjguIfguK3guK3guIHguILguYnguK3guKHguLnguKUnIH0KXTsKCi8qIC0tLS0tLS0tLS0tLS0tLS0gQVBJIC0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKiDguIHg',
  'uLjguI3guYHguIjguJfguLXguYjguIjguLDguYHguJnguJrguYTguJvguIHguLHguJrguJfguLjguIHguITguLPguKrguLHguYjguIcg4oCUIOC4oeC4tSAyIOC4l+C4suC4h+C4quC4s+C4o+C4reC4h+C5gOC4nOC4t+C5iOC4reC4l+C4suC4h+C5geC4o+C4geC5',
  'hOC4oeC5iOC4oeC4siAqLwp2YXIgUkVTT0xWRURfS0VZID0gbnVsbDsKCmZ1bmN0aW9uIGFjY2Vzc0tleSgpewogIGlmIChSRVNPTFZFRF9LRVkgIT09IG51bGwpIHJldHVybiBSRVNPTFZFRF9LRVk7CiAgUkVTT0xWRURfS0VZID0gKHR5cGVvZiBBQ0NFU1NfS0VZ',
  'ID09PSAnc3RyaW5nJyAmJiBBQ0NFU1NfS0VZKSA/IEFDQ0VTU19LRVkgOiAnJzsKICByZXR1cm4gUkVTT0xWRURfS0VZOwp9CgovKiogdHJ1ZSDguJbguYnguLLguYDguJvguLTguJTguJTguYnguKfguKLguKXguLTguIfguIHguYzguJzguLnguYnguJTguLnguYHg',
  'uKUg4oCUIOC5g+C4iuC5ieC5geC4l+C4meC4leC4seC4p+C5geC4m+C4oyBDQU5fRURJVCDguJXguKPguIcg4LmGIOC4l+C4teC5iOC4reC4suC4iOC5hOC4oeC5iOC4luC4ueC4geC4m+C4o+C4sOC4geC4suC4qCAqLwpmdW5jdGlvbiBjYW5FZGl0KCl7CiAgaWYg',
  'KHR5cGVvZiBDQU5fRURJVCAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiAhIUNBTl9FRElUOwogIHJldHVybiAhIShTLmJvb3QgJiYgUy5ib290LmNhbkVkaXQpOwp9CgpmdW5jdGlvbiBjYWxsQXBpKGFjdGlvbiwgcGF5bG9hZCl7CiAgdmFyIGJvZHkgPSB7fTsKICBP',
  'YmplY3Qua2V5cyhwYXlsb2FkIHx8IHt9KS5mb3JFYWNoKGZ1bmN0aW9uKGspeyBib2R5W2tdID0gcGF5bG9hZFtrXTsgfSk7CiAgYm9keS5fa2V5ID0gYWNjZXNzS2V5KCk7CiAgcGF5bG9hZCA9IGJvZHk7CiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJl',
  'c29sdmUsIHJlamVjdCl7CiAgICBnb29nbGUuc2NyaXB0LnJ1bgogICAgICAud2l0aFN1Y2Nlc3NIYW5kbGVyKGZ1bmN0aW9uKHJlcyl7CiAgICAgICAgaWYgKCFyZXMpIHJldHVybiByZWplY3QobmV3IEVycm9yKCfguYTguKHguYjguYTguJTguYnguKPguLHguJrg',
  'uILguYnguK3guKHguLnguKXguIjguLLguIHguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYwnKSk7CiAgICAgICAgaWYgKHJlcy5vaykgcmVzb2x2ZShyZXMuZGF0YSk7IGVsc2UgcmVqZWN0KG5ldyBFcnJvcihyZXMuZXJyb3IpKTsKICAgICAgfSkKICAg',
  'ICAgLndpdGhGYWlsdXJlSGFuZGxlcihmdW5jdGlvbihlcnIpeyByZWplY3QoZXJyKTsgfSkKICAgICAgLmFwaShhY3Rpb24sIHBheWxvYWQgfHwge30pOwogIH0pOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIGJvb3QgJiByb3V0aW5nIC0tLS0tLS0tLS0tLS0tLS0g',
  'Ki8KCmZ1bmN0aW9uIGJvb3QoKXsKICAvLyDguJbguYnguLLguJXguLHguKfguYHguJvguKPguIHguLjguI3guYHguIjguYTguKHguYjguKHguLLguJbguLbguIfguKvguJnguYnguLLguYDguKfguYfguJogKOC5gOC4iuC5iOC4mSB0ZW1wbGF0ZSDguYDguKPguJng',
  'uYDguJTguK3guKPguYzguJzguLTguJQpIOC4peC4reC4h+C4reC5iOC4suC4meC4iOC4suC4gSBVUkwg4LiC4Lit4LiH4Lir4LiZ4LmJ4Liy4LmB4Lih4LmI4LiB4LmI4Lit4LiZCiAgaWYgKCFhY2Nlc3NLZXkoKSAmJiB3aW5kb3cuZ29vZ2xlICYmIGdvb2dsZS5z',
  'Y3JpcHQgJiYgZ29vZ2xlLnNjcmlwdC51cmwpIHsKICAgIHRyeSB7CiAgICAgIGdvb2dsZS5zY3JpcHQudXJsLmdldExvY2F0aW9uKGZ1bmN0aW9uKGxvYyl7CiAgICAgICAgdmFyIGsgPSBsb2MgJiYgbG9jLnBhcmFtZXRlciAmJiBsb2MucGFyYW1ldGVyLmtleTsK',
  'ICAgICAgICBSRVNPTFZFRF9LRVkgPSBrID8gU3RyaW5nKGspIDogJyc7CiAgICAgICAgYm9vdE5vdygpOwogICAgICB9KTsKICAgICAgcmV0dXJuOwogICAgfSBjYXRjaCAoZSkgeyAvKiDguYPguIrguYnguJfguLLguIfguJvguIHguJXguLQgKi8gfQogIH0KICBi',
  'b290Tm93KCk7Cn0KCmZ1bmN0aW9uIGJvb3ROb3coKXsKICBjYWxsQXBpKCdhcHAuYm9vdHN0cmFwJykudGhlbihmdW5jdGlvbihiKXsKICAgIFMuYm9vdCA9IGI7CiAgICByZW5kZXJOYXYoKTsKICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXZGb290Jyku',
  'aW5uZXJIVE1MID0gbmF2Rm9vdEh0bWwoYik7CiAgICBTLnZlcnNpb24gPSBiLnZlcnNpb24gfHwgMDsKICAgIGlmICghYi5jYW5FZGl0KSBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ3JlYWRvbmx5Jyk7CiAgICB2YXIgaGFzaCA9IChsb2NhdGlvbi5oYXNo',
  'IHx8ICcnKS5yZXBsYWNlKCcjJywnJyk7CiAgICBnbyhQQUdFUy5zb21lKGZ1bmN0aW9uKHApe3JldHVybiBwLmlkPT09aGFzaDt9KSA/IGhhc2ggOiAnZGFzaGJvYXJkJyk7CiAgICBzdGFydFBvbGxpbmcoYi5zZXR0aW5ncyAmJiBiLnNldHRpbmdzLnJlZnJlc2hT',
  'ZWNvbmRzKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aWV3JykuaW5uZXJIVE1MID0KICAgICAgJzxkaXYgY2xhc3M9ImNhcmQiPjxkaXYgY2xhc3M9ImNhcmQtYiI+PGgzPuC5gOC4iuC4t+C5iOC4reC4oeC4',
  'leC5iOC4reC4o+C4sOC4muC4muC5hOC4oeC5iOC4quC4s+C5gOC4o+C5h+C4iDwvaDM+JyArCiAgICAgICc8cCBjbGFzcz0ibXV0ZWQiPicgKyBlc2MoZS5tZXNzYWdlfHxlKSArICc8L3A+JyArCiAgICAgICc8cCBjbGFzcz0iZnMxMyI+4LiV4Lij4Lin4LiI4Liq',
  '4Lit4Lia4Lin4LmI4LiyOiDguYDguJvguLTguJTguIrguLXguJXguYHguKXguYnguKfguKPguLHguJkgPGI+4LmA4Lih4LiZ4Li5IPCfj6IgVGhlIE0gQ29ybmVyIEFQIOKGkiDguJXguLTguJTguJXguLHguYnguIfguKPguLDguJrguJo8L2I+IOC5gOC4o+C4teC4',
  'ouC4muC4o+C5ieC4reC4ouC5geC4peC5ieC4pyAnICsKICAgICAgJ+C5geC4peC4sOC4reC4teC5gOC4oeC4peC4l+C4teC5iOC5g+C4iuC5ieC4reC4ouC4ueC5iOC4oeC4teC4quC4tOC4l+C4mOC4tOC5jOC5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4mTwv',
  'cD48L2Rpdj48L2Rpdj4nOwogIH0pOwp9CgovKiog4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Lih4Li44Lih4Lil4LmI4Liy4LiH4LiL4LmJ4Liy4LiiIOKAlCDguYDguKfguK3guKPguYzguIrguLHguJnguYDguKfguYfguJrguYHguK3guJvguIjguLDguYDguILguLXg',
  'uKLguJnguJfguLHguJrguJ/guLHguIfguIHguYzguIrguLHguJnguJnguLXguYkgKi8KZnVuY3Rpb24gbmF2Rm9vdEh0bWwoYil7CiAgdmFyIHJvbGUgPSAoYi51c2VyICYmIGIudXNlci5sYWJlbCkgPyBiLnVzZXIubGFiZWwgOiAnJzsKICByZXR1cm4gJzxiIHN0',
  'eWxlPSJjb2xvcjojYzdkMGUwIj4nICsgZXNjKHJvbGUpICsgJzwvYj4nICsKICAgIChiLnVzZXIgJiYgYi51c2VyLmVtYWlsICYmIGIudXNlci5lbWFpbCAhPT0gJ+C4nOC4ueC5ieC5g+C4iuC5ieC4nOC5iOC4suC4meC4peC4tOC4h+C4geC5jCcgPyAnPGJyPicg',
  'KyBlc2MoYi51c2VyLmVtYWlsKSA6ICcnKSArCiAgICAoYi5zaGVldFVybCA/ICc8YnI+PGEgaHJlZj0iJyArIGIuc2hlZXRVcmwgKyAnIiB0YXJnZXQ9Il9ibGFuayI+4LmA4Lib4Li04LiUIEdvb2dsZSBTaGVldCDihpc8L2E+JyA6ICcnKTsKfQoKZnVuY3Rpb24g',
  'cmVuZGVyTmF2KCl7CiAgdmFyIGh0bWwgPSAnJzsKICBQQUdFUy5mb3JFYWNoKGZ1bmN0aW9uKHApewogICAgaWYgKHAuc2VjKSBodG1sICs9ICc8ZGl2IGNsYXNzPSJuYXYtc2VjIj4nICsgcC5zZWMgKyAnPC9kaXY+JzsKICAgIGh0bWwgKz0gJzxidXR0b24gY2xh',
  'c3M9Im5hdi1pdGVtIiBpZD0ibmF2LScgKyBwLmlkICsgJyIgb25jbGljaz0iZ28oXCcnICsgcC5pZCArICdcJykiPicgKwogICAgICAgICAgICAgICc8c3BhbiBjbGFzcz0iaWMiPicgKyBwLmljICsgJzwvc3Bhbj48c3Bhbj4nICsgcC5sYWJlbCArICc8L3NwYW4+',
  'JyArCiAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPSJiYWRnZSIgaWQ9ImJhZGdlLScgKyBwLmlkICsgJyIgc3R5bGU9ImRpc3BsYXk6bm9uZSI+PC9zcGFuPicgKwogICAgICAgICAgICAnPC9idXR0b24+JzsKICB9KTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJ',
  'ZCgnbmF2TGlzdCcpLmlubmVySFRNTCA9IGh0bWw7Cn0KCmZ1bmN0aW9uIGdvKHBhZ2UpewogIFMucGFnZSA9IHBhZ2U7CiAgUy5wYXJhbXMgPSB7fTsKICBsb2NhdGlvbi5oYXNoID0gcGFnZTsKICB2YXIgbWV0YSA9IFBBR0VTLmZpbHRlcihmdW5jdGlvbihwKXty',
  'ZXR1cm4gcC5pZD09PXBhZ2U7fSlbMF0gfHwgUEFHRVNbMF07CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BhZ2VUaXRsZScpLnRleHRDb250ZW50ID0gbWV0YS5sYWJlbDsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFnZVN1YicpLnRleHRDb250ZW50',
  'ID0gbWV0YS5zdWI7CiAgUEFHRVMuZm9yRWFjaChmdW5jdGlvbihwKXsKICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXYtJyArIHAuaWQpOwogICAgaWYgKGVsKSBlbC5jbGFzc0xpc3QudG9nZ2xlKCdvbicsIHAuaWQgPT09IHBhZ2UpOwog',
  'IH0pOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXYnKS5jbGFzc0xpc3QucmVtb3ZlKCdvcGVuJyk7CiAgcmVtb3ZlU2NyaW0oKTsKICBsb2FkKCk7Cn0KCmZ1bmN0aW9uIHJlZnJlc2goKXsgbG9hZCh0cnVlKTsgfQoKZnVuY3Rpb24gc2V0WWVhcih5KXsK',
  'ICBTLnllYXIgPSB5OwogIGxvYWQoKTsKfQoKZnVuY3Rpb24gbG9hZChmb3JjZSl7CiAgdmFyIHZpZXcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndmlldycpOwogIHZpZXcuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWci',
  'PjxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+PC9kaXY+4LiB4Liz4Lil4Lix4LiH4LmC4Lir4Lil4LiU4LiC4LmJ4Lit4Lih4Li54Lil4oCmPC9kaXY+JzsKICB2YXIgciA9IFJPVVRFU1tTLnBhZ2VdOwogIGlmICghcikgeyB2aWV3LmlubmVySFRNTCA9ICc8ZGl2',
  'IGNsYXNzPSJlbXB0eSI+4LmE4Lih4LmI4Lie4Lia4Lir4LiZ4LmJ4Liy4LiZ4Li14LmJPC9kaXY+JzsgcmV0dXJuOyB9CiAgci5sb2FkKCkudGhlbihmdW5jdGlvbihkYXRhKXsKICAgIFMuY2FjaGVbUy5wYWdlXSA9IGRhdGE7CiAgICBzeW5jWWVhck9wdGlvbnMo',
  'ZGF0YS55ZWFycyB8fCBkYXRhLmF2YWlsYWJsZSB8fCBbXSk7CiAgICB2aWV3LmlubmVySFRNTCA9IHIucmVuZGVyKGRhdGEpOwogICAgYXBwbHlSZWFkT25seSh2aWV3KTsKICAgIGlmIChyLmFmdGVyKSByLmFmdGVyKGRhdGEpOwogIH0pLmNhdGNoKGZ1bmN0aW9u',
  'KGUpewogICAgdmlldy5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz0iY2FyZCI+PGRpdiBjbGFzcz0iY2FyZC1iIj48aDM+4LmC4Lir4Lil4LiU4LiC4LmJ4Lit4Lih4Li54Lil4LmE4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIPC9oMz4nICsKICAgICAgICAgICAgICAg',
  'ICAgICAgJzxwIGNsYXNzPSJtdXRlZCI+JyArIGVzYyhlLm1lc3NhZ2V8fGUpICsgJzwvcD4nICsKICAgICAgICAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0ibG9hZCgpIj7guKXguK3guIfguYPguKvguKHguYg8L2J1dHRvbj48L2Rp',
  'dj48L2Rpdj4nOwogIH0pOwp9CgovKiog4LmA4LiV4Li04Lih4LiV4Lix4Lin4LmA4Lil4Li34Lit4LiB4Lib4Li14LmD4LiZ4LmB4LiW4Lia4Lia4LiZ4LmD4Lir4LmJ4LiV4Lij4LiH4LiB4Lix4Lia4LiC4LmJ4Lit4Lih4Li54Lil4LiI4Lij4Li04LiH4LiC4Lit',
  '4LiH4Lir4LiZ4LmJ4Liy4LiZ4Lix4LmJ4LiZICovCmZ1bmN0aW9uIHN5bmNZZWFyT3B0aW9ucyh5ZWFycyl7CiAgdmFyIHNlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd5ZWFyU2VsJyk7CiAgdmFyIGxpc3QgPSAoeWVhcnMgfHwgW10pLnNsaWNlKCkuc29y',
  'dChmdW5jdGlvbihhLGIpe3JldHVybiBiLWE7fSk7CiAgdmFyIGN1ciA9IG5ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKTsKICBpZiAobGlzdC5pbmRleE9mKGN1cikgPCAwKSBsaXN0LnVuc2hpZnQoY3VyKTsKICB2YXIgaHRtbCA9ICc8b3B0aW9uIHZhbHVlPSJhbGwi',
  'PuC4l+C4uOC4geC4m+C4tTwvb3B0aW9uPic7CiAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHkpewogICAgaHRtbCArPSAnPG9wdGlvbiB2YWx1ZT0iJyArIHkgKyAnIj7guJvguLUgJyArIHkgKyAnICjguJ4u4LioLiAnICsgKE51bWJlcih5KSs1NDMpICsgJyk8L29w',
  'dGlvbj4nOwogIH0pOwogIHNlbC5pbm5lckhUTUwgPSBodG1sOwogIGlmIChsaXN0LmluZGV4T2YoTnVtYmVyKFMueWVhcikpIDwgMCAmJiBTLnllYXIgIT09ICdhbGwnKSBTLnllYXIgPSBTdHJpbmcoY3VyKTsKICBzZWwudmFsdWUgPSBTLnllYXI7Cn0KCi8qIC0t',
  'LS0tLS0tLS0tLS0tLS0g4LmC4Lir4Lih4LiU4LiU4Li54Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinIC0tLS0tLS0tLS0tLS0tLS0KICAg4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4LiB4Lix4LiZ4LmE4Lin4LmJ4LmB',
  '4Lil4LmJ4Lin4LmD4LiZ4Lif4Lix4LiH4LiB4LmM4LiK4Lix4LiZIGFwaSgpIOC4leC4o+C4h+C4meC4teC5ieC5geC4hOC5iOC4i+C5iOC4reC4meC4m+C4uOC5iOC4oeC4l+C4teC5iOC4geC4lOC5hOC4m+C4geC5h+C4l+C4s+C5hOC4oeC5iOC5hOC4lOC5iQog',
  'ICDguYDguJ7guLfguYjguK3guYTguKHguYjguYPguKvguYnguJzguLnguYnguJfguLXguYjguYDguJvguLTguJTguJTguYnguKfguKLguKXguLTguIfguIHguYzguYHguIrguKPguYzguKrguLHguJrguKrguJkgKi8KdmFyIEVESVRfRU5UUllQT0lOVFMgPSAvXGIo',
  'Zm9ybURlYnR8Zm9ybURlYnRQYXltZW50fGZvcm1QdXJjaGFzZXxmb3JtQWN8Zm9ybUJ1bGtBY3xmb3JtUmVwYWlyfGZvcm1CdWlsZGluZ3xmb3JtUm9vbXxmb3JtRmluYW5jZXxkZWxEZWJ0fGRlbERlYnRQYXltZW50fGRlbFB1cmNoYXNlfGRlbEFjfGRlbFJlcGFp',
  'cnxkZWxCdWlsZGluZ3xkZWxGaW5hbmNlfGRvSW1wb3J0SnNvbnxkb1JvdGF0ZVNoYXJlfGRvQmFja3VwTm93KVxzKlwoLzsKCmZ1bmN0aW9uIGFwcGx5UmVhZE9ubHkocm9vdCl7CiAgaWYgKGNhbkVkaXQoKSkgcmV0dXJuOwogIHZhciBub2RlcyA9IHJvb3QucXVl',
  'cnlTZWxlY3RvckFsbCgnW29uY2xpY2tdJyk7CiAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykgewogICAgaWYgKEVESVRfRU5UUllQT0lOVFMudGVzdChub2Rlc1tpXS5nZXRBdHRyaWJ1dGUoJ29uY2xpY2snKSB8fCAnJykpIG5vZGVzW2ld',
  'LnJlbW92ZSgpOwogIH0KfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguKPguLXguYDguJ/guKPguIrguK3guLHguJXguYLguJnguKHguLHguJXguLTguYDguKHguLfguYjguK3guILguYnguK3guKHguLnguKXguYPguJnguIrguLXguJXguYDguJvguKXguLXguYjguKLg',
  'uJkgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gc3RhcnRQb2xsaW5nKHNlY29uZHMpewogIHZhciBzZWMgPSBOdW1iZXIoc2Vjb25kcyB8fCAwKTsKICB2YXIgZG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xpdmVEb3QnKTsKICBpZiAoIXNlYykg',
  'eyBpZiAoZG90KSBkb3QuaW5uZXJIVE1MID0gJyc7IHJldHVybjsgfQogIGlmIChkb3QpIGRvdC5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9ImIgb2siIHRpdGxlPSLguILguYnguK3guKHguLnguKXguK3guLHguJvguYDguJTguJXguK3guLHguJXguYLguJnguKHg',
  'uLHguJXguLTguJfguLjguIEgJyArIHNlYyArICcg4Lin4Li04LiZ4Liy4LiX4Li1Ij7il48g4Liq4LiUPC9zcGFuPic7CgogIHNldEludGVydmFsKGZ1bmN0aW9uKCl7CiAgICBpZiAoZG9jdW1lbnQuaGlkZGVuKSByZXR1cm47CiAgICBpZiAoZG9jdW1lbnQuZ2V0',
  'RWxlbWVudEJ5SWQoJ21vZGFsUm9vdCcpLmlubmVySFRNTCkgcmV0dXJuOyAgLy8g4LiB4Liz4Lil4Lix4LiH4LiB4Lij4Lit4LiB4Lif4Lit4Lij4LmM4Lih4Lit4Lii4Li54LmIIOC4reC4ouC5iOC4suC5gOC4nuC4tOC5iOC4h+C4o+C4teC5gOC4n+C4o+C4igog',
  'ICAgY2FsbEFwaSgnYXBwLnZlcnNpb24nKS50aGVuKGZ1bmN0aW9uKHYpewogICAgICBpZiAodiAmJiB2LnZlcnNpb24gJiYgdi52ZXJzaW9uICE9PSBTLnZlcnNpb24pIHsKICAgICAgICBTLnZlcnNpb24gPSB2LnZlcnNpb247CiAgICAgICAgbG9hZCgpOwogICAg',
  'ICAgIHRvYXN0KCfguILguYnguK3guKHguLnguKXguKHguLXguIHguLLguKPguYDguJvguKXguLXguYjguKLguJnguYHguJvguKXguIcg4oCUIOC5guC4q+C4peC4lOC5g+C4q+C4oeC5iOC5g+C4q+C5ieC5geC4peC5ieC4pycpOwogICAgICB9CiAgICB9KS5jYXRj',
  'aChmdW5jdGlvbigpeyAvKiDguYDguJnguYfguJXguKrguLDguJTguLjguJQg4LmE4Lin4LmJ4Lij4Lit4Lia4Lir4LiZ4LmJ4LiyICovIH0pOwogIH0sIHNlYyAqIDEwMDApOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIGZvcm1hdCBoZWxwZXJzIC0tLS0tLS0tLS0t',
  'LS0tLS0gKi8KCmZ1bmN0aW9uIGVzYyhzKXsKICByZXR1cm4gU3RyaW5nKHM9PW51bGw/Jyc6cykKICAgIC5yZXBsYWNlKC8mL2csJyZhbXA7JykucmVwbGFjZSgvPC9nLCcmbHQ7JykucmVwbGFjZSgvPi9nLCcmZ3Q7JykKICAgIC5yZXBsYWNlKC8iL2csJyZxdW90',
  'OycpLnJlcGxhY2UoLycvZywnJiMzOTsnKTsKfQpmdW5jdGlvbiBtb25leShuLCBkZWMpewogIHZhciB2ID0gTnVtYmVyKG58fDApOwogIHJldHVybiB2LnRvTG9jYWxlU3RyaW5nKCd0aC1USCcse21pbmltdW1GcmFjdGlvbkRpZ2l0czpkZWN8fDAsIG1heGltdW1G',
  'cmFjdGlvbkRpZ2l0czpkZWN8fDB9KTsKfQpmdW5jdGlvbiBiYWh0KG4peyByZXR1cm4gbW9uZXkobikgKyAnIOC4vyc7IH0KZnVuY3Rpb24gcGN0KG4peyByZXR1cm4gKE51bWJlcihuKXx8MCkudG9GaXhlZCgxKSArICclJzsgfQpmdW5jdGlvbiBudW0obil7IHJl',
  'dHVybiBuPT1udWxsfHxuPT09JycgPyAn4oCTJyA6IG1vbmV5KG4pOyB9CgovKiogMjAyNi0wNC0yNiAtPiAyNiDguYDguKEu4LiiLiAyNTY5ICovCnZhciBUSF9NT04gPSBbJ+C4oS7guIQuJywn4LiBLuC4ni4nLCfguKHguLUu4LiELicsJ+C5gOC4oS7guKIuJywn',
  '4LieLuC4hC4nLCfguKHguLQu4LiiLicsJ+C4gS7guIQuJywn4LiqLuC4hC4nLCfguIEu4LiiLicsJ+C4lS7guIQuJywn4LieLuC4oi4nLCfguJgu4LiELiddOwpmdW5jdGlvbiB0aERhdGUoaXNvKXsKICBpZiAoIWlzbykgcmV0dXJuICfigJMnOwogIHZhciBtID0g',
  'U3RyaW5nKGlzbykubWF0Y2goL14oXGR7NH0pLShcZHsyfSktKFxkezJ9KS8pOwogIGlmICghbSkgcmV0dXJuIGVzYyhpc28pOwogIHJldHVybiBOdW1iZXIobVszXSkgKyAnICcgKyBUSF9NT05bTnVtYmVyKG1bMl0pLTFdICsgJyAnICsgKE51bWJlcihtWzFdKSs1',
  'NDMpOwp9CmZ1bmN0aW9uIHRoRGF0ZVNob3J0KGlzbyl7CiAgaWYgKCFpc28pIHJldHVybiAn4oCTJzsKICB2YXIgbSA9IFN0cmluZyhpc28pLm1hdGNoKC9eKFxkezR9KS0oXGR7Mn0pLShcZHsyfSkvKTsKICBpZiAoIW0pIHJldHVybiBlc2MoaXNvKTsKICByZXR1',
  'cm4gTnVtYmVyKG1bM10pICsgJy8nICsgTnVtYmVyKG1bMl0pICsgJy8nICsgU3RyaW5nKE51bWJlcihtWzFdKSs1NDMpLnNsaWNlKDIpOwp9CmZ1bmN0aW9uIGRheXNBZ28oaXNvKXsKICBpZiAoIWlzbykgcmV0dXJuIG51bGw7CiAgcmV0dXJuIE1hdGgucm91bmQo',
  'KERhdGUubm93KCkgLSBuZXcgRGF0ZShpc28pLmdldFRpbWUoKSkvODY0MDAwMDApOwp9CgpmdW5jdGlvbiBzdGF0dXNCYWRnZShzdCl7CiAgdmFyIG1hcCA9IHsKICAgICfguYDguKrguKPguYfguIjguKrguLTguYnguJknOidvaycsJ+C4lOC4s+C5gOC4meC4tOC4',
  'meC4geC4suC4o+C5geC4peC5ieC4pyc6J29rJywn4LmD4LiK4LmJ4LiH4Liy4LiZ4Lib4LiB4LiV4Li0Jzonb2snLCfguJvguLTguJTguKvguJnguLXguYnguYHguKXguYnguKcnOidvaycsJ+C4reC4ouC4ueC5iOC5g+C4meC4m+C4o+C4sOC4geC4seC4mSc6J29r',
  'Jywn4Lih4Li14Lic4Li54LmJ4LmA4LiK4LmI4LiyJzonb2snLCfguJvguIHguJXguLQnOidvaycsCiAgICAn4LiB4Liz4Lil4Lix4LiH4LiL4LmI4Lit4LihJzonaW5mbycsJ+C4geC4s+C4peC4seC4h+C4lOC4s+C5gOC4meC4tOC4meC4geC4suC4oyc6J2luZm8n',
  'LCfguJnguLHguJTguKvguKHguLLguKLguYHguKXguYnguKcnOidpbmZvJywn4LiB4Liz4Lil4Lix4LiH4Lic4LmI4Lit4LiZJzonaW5mbycsJ+C4p+C5iOC4suC4hyc6J2luZm8nLAogICAgJ+C4o+C4reC4lOC4s+C5gOC4meC4tOC4meC4geC4suC4oyc6J3dhcm4n',
  'LCfguYDguKXguLfguYjguK3guJnguJnguLHguJQnOid3YXJuJywn4LmD4LiB4Lil4LmJ4Lir4Lih4LiU4Lib4Lij4Liw4LiB4Lix4LiZJzond2FybicsJ+C4leC5ieC4reC4h+C4i+C5iOC4reC4oSc6J3dhcm4nLCfguJ7guLHguIHguIrguLPguKPguLAnOid3YXJu',
  'Jywn4Lib4Li04LiU4Lib4Lij4Lix4Lia4Lib4Lij4Li44LiHJzond2FybicsJ+C5gOC4geC4tOC4meC4geC4s+C4q+C4meC4lCc6J3dhcm4nLCfguKLguLHguIfguYTguKHguYjguYDguITguKLguKXguYnguLLguIcnOid3YXJuJywKICAgICfguKLguIHguYDguKXg',
  'uLTguIEnOidtdXRlJywn4Lib4Lil4LiU4Lij4Liw4Lin4Liy4LiHJzonbXV0ZScsJ+C5hOC4oeC5iOC4o+C4sOC4muC4uCc6J211dGUnLAogICAgJ+C4q+C4oeC4lOC4reC4suC4ouC4uOC5geC4peC5ieC4pyc6J2RncicsJ+C4lOC5iOC4p+C4meC4oeC4suC4gSc6',
  'J2RncicsJ+C4lOC5iOC4p+C4mSc6J3dhcm4nCiAgfTsKICBpZiAoIXN0KSByZXR1cm4gJyc7CiAgcmV0dXJuICc8c3BhbiBjbGFzcz0iYiAnICsgKG1hcFtzdF18fCdtdXRlJykgKyAnIj4nICsgZXNjKHN0KSArICc8L3NwYW4+JzsKfQoKZnVuY3Rpb24gcHJvZ3Jl',
  'c3MocGVyY2VudCwgY2xzKXsKICB2YXIgcCA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEwMCwgTnVtYmVyKHBlcmNlbnQpfHwwKSk7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJwYmFyICcgKyAoY2xzfHwnJykgKyAnIj48aSBzdHlsZT0id2lkdGg6JyArIHAgKyAnJSI+',
  'PC9pPjwvZGl2Pic7Cn0KCmZ1bmN0aW9uIHRodW1ic0h0bWwocmVmcywgYmlnKXsKICBpZiAoIXJlZnMgfHwgIXJlZnMubGVuZ3RoKSByZXR1cm4gJzxzcGFuIGNsYXNzPSJmYWludCBmczEyIj7igJM8L3NwYW4+JzsKICByZXR1cm4gJzxkaXYgY2xhc3M9InRodW1i',
  'cyI+JyArIHJlZnMubWFwKGZ1bmN0aW9uKHIpewogICAgaWYgKHIudGh1bWIpIHsKICAgICAgcmV0dXJuICc8aW1nIGNsYXNzPSJ0aHVtYicgKyAoYmlnPycgYmlnJzonJykgKyAnIiBsb2FkaW5nPSJsYXp5IiBzcmM9IicgKyBlc2Moci50aHVtYikgKyAnIiAnICsK',
  'ICAgICAgICAgICAgICdvbmNsaWNrPSJ3aW5kb3cub3BlbihcJycgKyBlc2Moci51cmwpICsgJ1wnLFwnX2JsYW5rXCcpIiAnICsKICAgICAgICAgICAgICdvbmVycm9yPSJ0aGlzLm9uZXJyb3I9bnVsbDt0aGlzLnJlcGxhY2VXaXRoKGZpbGVDaGlwKCcgKyBKU09O',
  'LnN0cmluZ2lmeShKU09OLnN0cmluZ2lmeShyKSkucmVwbGFjZSgvIi9nLCcmcXVvdDsnKSArICcpKSI+JzsKICAgIH0KICAgIHJldHVybiAnPGEgY2xhc3M9ImIgaW5mbyIgaHJlZj0iJyArIGVzYyhyLnVybCkgKyAnIiB0YXJnZXQ9Il9ibGFuayI+4LmE4Lif4Lil',
  '4LmMPC9hPic7CiAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKfQpmdW5jdGlvbiBmaWxlQ2hpcChqc29uKXsKICB2YXIgciA9IHR5cGVvZiBqc29uID09PSAnc3RyaW5nJyA/IEpTT04ucGFyc2UoanNvbikgOiBqc29uOwogIHZhciBhID0gZG9jdW1lbnQuY3JlYXRl',
  'RWxlbWVudCgnYScpOwogIGEuY2xhc3NOYW1lID0gJ2IgaW5mbyc7IGEuaHJlZiA9IHIudXJsOyBhLnRhcmdldCA9ICdfYmxhbmsnOyBhLnRleHRDb250ZW50ID0gJ/Cfk44g4LmE4Lif4Lil4LmMJzsKICByZXR1cm4gYTsKfQoKZnVuY3Rpb24gZW1wdHlCb3godGV4',
  'dCwgYWN0aW9uKXsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPvCfl4LvuI88L2Rpdj4nICsgZXNjKHRleHQpICsKICAgICAgICAgKGFjdGlvbiA/ICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgYWN0aW9uICsgJzwvZGl2PicgOiAn',
  'JykgKyAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gYmFyQ2hhcnQoaXRlbXMsIGxhYmVsS2V5LCB2YWx1ZUtleSwgZm9ybWF0dGVyKXsKICBpZiAoIWl0ZW1zIHx8ICFpdGVtcy5sZW5ndGgpIHJldHVybiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5',
  'iOC4oeC4teC4guC5ieC4reC4oeC4ueC4pTwvZGl2Pic7CiAgdmFyIG1heCA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGl0ZW1zLm1hcChmdW5jdGlvbihpKXsgcmV0dXJuIE51bWJlcihpW3ZhbHVlS2V5XSl8fDA7IH0pKSB8fCAxOwogIHJldHVybiAnPGRpdiBjbGFz',
  'cz0iYmFycyI+JyArIGl0ZW1zLm1hcChmdW5jdGlvbihpKXsKICAgIHZhciB2ID0gTnVtYmVyKGlbdmFsdWVLZXldKXx8MDsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0iYmFyLXJvdyI+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJjbGlwIiB0aXRsZT0iJyArIGVzYyhp',
  'W2xhYmVsS2V5XSkgKyAnIj4nICsgZXNjKGlbbGFiZWxLZXldKSArICc8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImJhci10cmFjayI+PGRpdiBjbGFzcz0iYmFyLWZpbGwiIHN0eWxlPSJ3aWR0aDonICsgKHYvbWF4KjEwMCkgKyAnJSI+PC9kaXY+PC9kaXY+',
  'JyArCiAgICAgICc8ZGl2IGNsYXNzPSJ2Ij4nICsgKGZvcm1hdHRlciA/IGZvcm1hdHRlcihpKSA6IG1vbmV5KHYpKSArICc8L2Rpdj4nICsKICAgICc8L2Rpdj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0gbW9kYWwg',
  'LS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gb3Blbk1vZGFsKHRpdGxlLCBib2R5SHRtbCwgZm9vdEh0bWwsIHdpZGUpewogIHZhciByb290ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vZGFsUm9vdCcpOwogIHJvb3QuaW5uZXJIVE1MID0KICAgICc8',
  'ZGl2IGNsYXNzPSJvdiIgb25jbGljaz0iaWYoZXZlbnQudGFyZ2V0PT09dGhpcyljbG9zZU1vZGFsKCkiPicgKwogICAgICAnPGRpdiBjbGFzcz0ibW9kYWwnICsgKHdpZGU/JyB3aWRlJzonJykgKyAnIj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0ibW9kYWwtaCI+',
  'PGgzPicgKyBlc2ModGl0bGUpICsgJzwvaDM+PGJ1dHRvbiBjbGFzcz0ieCIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7DlzwvYnV0dG9uPjwvZGl2PicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJtb2RhbC1iIj4nICsgYm9keUh0bWwgKyAnPC9kaXY+JyArCiAgICAg',
  'ICAgKGZvb3RIdG1sID8gJzxkaXYgY2xhc3M9Im1vZGFsLWYiPicgKyBmb290SHRtbCArICc8L2Rpdj4nIDogJycpICsKICAgICAgJzwvZGl2PicgKwogICAgJzwvZGl2Pic7CiAgYXBwbHlSZWFkT25seShyb290KTsKICBkb2N1bWVudC5ib2R5LnN0eWxlLm92ZXJm',
  'bG93ID0gJ2hpZGRlbic7Cn0KZnVuY3Rpb24gY2xvc2VNb2RhbCgpewogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb2RhbFJvb3QnKS5pbm5lckhUTUwgPSAnJzsKICBkb2N1bWVudC5ib2R5LnN0eWxlLm92ZXJmbG93ID0gJyc7Cn0KZG9jdW1lbnQuYWRkRXZl',
  'bnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGUpeyBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSBjbG9zZU1vZGFsKCk7IH0pOwoKZnVuY3Rpb24gY29uZmlybUFjdGlvbih0ZXh0LCBvblllcyl7CiAgb3Blbk1vZGFsKCfguKLguLfguJnguKLguLHguJknLAog',
  'ICAgJzxwPicgKyBlc2ModGV4dCkgKyAnPC9wPicsCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4gTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBkZ3IiIGlkPSJjZm1CdG4i',
  'PuC4ouC4t+C4meC4ouC4seC4mTwvYnV0dG9uPicpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZm1CdG4nKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsgY2xvc2VNb2RhbCgpOyBvblllcygpOyB9Owp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIHRvYXN0IC0tLS0t',
  'LS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIHRvYXN0KG1zZywga2luZCl7CiAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgZWwuY2xhc3NOYW1lID0gJ3RvYXN0ICcgKyAoa2luZHx8JycpOwogIGVsLnRleHRDb250ZW50ID0gbXNnOwog',
  'IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2FzdFJvb3QnKS5hcHBlbmRDaGlsZChlbCk7CiAgc2V0VGltZW91dChmdW5jdGlvbigpeyBlbC5yZW1vdmUoKTsgfSwga2luZD09PSdlcnInID8gNTIwMCA6IDI4MDApOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIG5h',
  'diAobW9iaWxlKSAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiB0b2dnbGVOYXYoKXsKICB2YXIgbmF2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdicpOwogIG5hdi5jbGFzc0xpc3QudG9nZ2xlKCdvcGVuJyk7CiAgaWYgKG5hdi5jbGFzc0xpc3Qu',
  'Y29udGFpbnMoJ29wZW4nKSkgewogICAgdmFyIHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICAgIHMuY2xhc3NOYW1lID0gJ3NjcmltJzsgcy5pZCA9ICdzY3JpbSc7CiAgICBzLm9uY2xpY2sgPSBmdW5jdGlvbigpeyBuYXYuY2xhc3NMaXN0LnJl',
  'bW92ZSgnb3BlbicpOyByZW1vdmVTY3JpbSgpOyB9OwogICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzKTsKICB9IGVsc2UgcmVtb3ZlU2NyaW0oKTsKfQpmdW5jdGlvbiByZW1vdmVTY3JpbSgpewogIHZhciBzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQo',
  'J3NjcmltJyk7CiAgaWYgKHMpIHMucmVtb3ZlKCk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0gc2VhcmNoIC0tLS0tLS0tLS0tLS0tLS0gKi8KCnZhciBzZWFyY2hUaW1lciA9IG51bGw7CmZ1bmN0aW9uIG9uU2VhcmNoKHEpewogIGNsZWFyVGltZW91dChzZWFyY2hU',
  'aW1lcik7CiAgaWYgKCFxIHx8IHEudHJpbSgpLmxlbmd0aCA8IDIpIHJldHVybjsKICBzZWFyY2hUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2FwcC5zZWFyY2gnLCB7IHE6IHEgfSkudGhlbihmdW5jdGlvbihyb3dzKXsKICAgICAg',
  'b3Blbk1vZGFsKCfguJzguKXguIHguLLguKPguITguYnguJnguKvguLIgIicgKyBxICsgJyIgKCcgKyByb3dzLmxlbmd0aCArICcpJywKICAgICAgICByb3dzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJhbGlzdCI+JyArIHJvd3MubWFwKGZ1bmN0aW9uKHIpewogICAg',
  'ICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJhbGkiIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtnbyhcJycgKyBqdW1wUGFnZShyLm1vZHVsZSkgKyAnXCcpIj4nICsKICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImljIj4nICsgbW9kdWxlSWNvbihyLm1vZHVsZSkgKyAn',
  'PC9kaXY+PGRpdj4nICsKICAgICAgICAgICAgJzxkaXYgY2xhc3M9InR0Ij4nICsgZXNjKHIudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAgICAnPGRpdiBjbGFzcz0iZGQiPicgKyBlc2Moci5sYWJlbCkgKyAoci5kZXRhaWwgPyAnIMK3ICcgKyBlc2Moci5k',
  'ZXRhaWwpIDogJycpICsgJzwvZGl2PicgKwogICAgICAgICAgICAnPC9kaXY+PC9kaXY+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nCiAgICAgICAgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC5hOC4oeC5iOC4nuC4muC4o+C4suC4ouC4geC4suC4o+C4',
  'l+C4teC5iOC4leC4o+C4h+C4geC4seC4muC4hOC4s+C4hOC5ieC4mTwvZGl2PicsICcnLCB0cnVlKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsICdlcnInKTsgfSk7CiAgfSwgNDIwKTsKfQpmdW5jdGlvbiBqdW1wUGFnZSht',
  'b2R1bGUpewogIHJldHVybiAoe3B1cmNoYXNlczoncHVyY2hhc2VzJywgcmVwYWlyczoncmVwYWlycycsIGJ1aWxkaW5nOididWlsZGluZycsIGFjOidhYycsIGRlYnQ6J2RlYnRNYWluJywgcm9vbXM6J3Jvb21zJ30pW21vZHVsZV0gfHwgJ2Rhc2hib2FyZCc7Cn0K',
  'ZnVuY3Rpb24gbW9kdWxlSWNvbihtb2R1bGUpewogIHJldHVybiAoe3B1cmNoYXNlczon8J+bkicsIHJlcGFpcnM6J/CflKcnLCBidWlsZGluZzon8J+PoicsIGFjOifinYTvuI8nLCBkZWJ0Oifwn5KwJywgcm9vbXM6J/CfmqonfSlbbW9kdWxlXSB8fCAn8J+ThCc7',
  'Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0gZmlsZSB1cGxvYWQgLS0tLS0tLS0tLS0tLS0tLSAqLwoKLyoqCiAqIOC4reC5iOC4suC4meC5hOC4n+C4peC5jOC4iOC4suC4gSA8aW5wdXQgdHlwZT1maWxlPiDguYDguJvguYfguJkgZGF0YVVSTCDguYHguKXguYnguKfg',
  'uKrguYjguIfguILguLbguYnguJkgRHJpdmUKICog4LiE4Li34LiZIGFycmF5IOC4guC4reC4hyB7aWQsbmFtZSx1cmwsdGh1bWJ9CiAqLwpmdW5jdGlvbiB1cGxvYWRGaWxlcyhpbnB1dEVsLCBidWNrZXQpewogIHZhciBmaWxlcyA9IEFycmF5LnByb3RvdHlwZS5z',
  'bGljZS5jYWxsKGlucHV0RWwuZmlsZXMgfHwgW10pOwogIGlmICghZmlsZXMubGVuZ3RoKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTsKICB2YXIgTUFYID0gMTIgKiAxMDI0ICogMTAyNDsKICB2YXIgdG9vQmlnID0gZmlsZXMuZmlsdGVyKGZ1bmN0aW9uKGYp',
  'eyByZXR1cm4gZi5zaXplID4gTUFYOyB9KTsKICBpZiAodG9vQmlnLmxlbmd0aCkgewogICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcign4LmE4Lif4Lil4LmM4LmD4Lir4LiN4LmI4LmA4LiB4Li04LiZIDEyIE1COiAnICsgdG9vQmlnLm1hcChmdW5j',
  'dGlvbihmKXtyZXR1cm4gZi5uYW1lO30pLmpvaW4oJywgJykpKTsKICB9CiAgcmV0dXJuIFByb21pc2UuYWxsKGZpbGVzLm1hcChyZWFkQXNEYXRhVXJsKSkKICAgIC50aGVuKGZ1bmN0aW9uKHBheWxvYWRzKXsgcmV0dXJuIGNhbGxBcGkoJ2ZpbGUudXBsb2FkJywg',
  'eyBidWNrZXQ6IGJ1Y2tldCwgZmlsZXM6IHBheWxvYWRzIH0pOyB9KTsKfQoKZnVuY3Rpb24gcmVhZEFzRGF0YVVybChmaWxlKXsKICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXsKICAgIHZhciByID0gbmV3IEZpbGVSZWFkZXIo',
  'KTsKICAgIHIub25sb2FkID0gZnVuY3Rpb24oKXsgcmVzb2x2ZSh7IG5hbWU6IGZpbGUubmFtZSwgbWltZVR5cGU6IGZpbGUudHlwZSwgZGF0YVVybDogci5yZXN1bHQgfSk7IH07CiAgICByLm9uZXJyb3IgPSBmdW5jdGlvbigpeyByZWplY3QobmV3IEVycm9yKCfg',
  'uK3guYjguLLguJnguYTguJ/guKXguYzguYTguKHguYjguKrguLPguYDguKPguYfguIg6ICcgKyBmaWxlLm5hbWUpKTsgfTsKICAgIHIucmVhZEFzRGF0YVVSTChmaWxlKTsKICB9KTsKfQo8L3NjcmlwdD4KPHNjcmlwdD4KLyogPT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIFZpZXdzLmh0bWwg4oCUIOC4leC4seC4p+C5guC4q+C4peC4lCArIOC4leC4seC4p+C4p+C4suC4lOC4guC4reC4h+C5geC4leC5iOC4peC4sOC4q+C4meC5ieC4sgogICA9PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCnZhciBST1VURVMgPSB7fTsKCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICAxKSDguKDguLLguJ7guKPg',
  'uKfguKEKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5kYXNoYm9hcmQgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsgcmV0dXJuIGNhbGxBcGkoJ2FwcC5kYXNoYm9hcmQnLCB7IHll',
  'YXI6IFMueWVhciB9KTsgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIGIgPSBkLmJ1aWxkaW5nOwogICAgdmFyIGtwaXMgPQogICAgICBrcGkoJ+C4ouC4reC4lOC4q+C4meC4teC5ieC4hOC4h+C5gOC4q+C4peC4t+C4reC4l+C4seC5ieC4h+C4q+C4',
  'oeC4lCcsIGJhaHQoZC5kZWJ0QWxsLnJlbWFpbmluZyksCiAgICAgICAgICAn4LiI4Liy4LiB4Lii4Lit4LiU4Lir4LiZ4Li14LmJICcgKyBiYWh0KGQuZGVidEFsbC50b3RhbERlYnQpICsgJyDCtyDguIrguLPguKPguLDguYHguKXguYnguKcgJyArIHBjdChkLmRl',
  'YnRBbGwucGVyY2VudCksICdhY2NlbnQnKSArCiAgICAgIGtwaSgn4LiK4Liz4Lij4Liw4LmB4Lil4LmJ4LinICjguKvguJnguLXguYnguKvguKXguLHguIEpJywgcGN0KGQuZGVidE1haW4ucGVyY2VudCksIGJhaHQoZC5kZWJ0TWFpbi5wYWlkKSArICcg4LiI4Liy',
  '4LiBICcgKyBiYWh0KGQuZGVidE1haW4udG90YWwpLCAnZ29vZCcpICsKICAgICAga3BpKCfguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguJvguLUgJyArIGQueWVhciwgYmFodChkLnNwZW5kVGhpc1llYXIpLCAn4LiL4Li34LmJ4Lit4LiC4Lit4LiHICsg',
  '4LiL4LmI4Lit4Lih4LmB4LiL4LihICsg4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJykgKwogICAgICBrcGkoJ+C4h+C4suC4meC4i+C5iOC4reC4oeC4hOC5ieC4suC4hycsIGQucmVwYWlycy5vcGVuSm9icyArICcg4LiH4Liy4LiZJywgZC5yZXBhaXJzLm92ZXJk',
  'dWUgKyAnIOC4h+C4suC4meC5gOC4geC4tOC4meC4geC4s+C4q+C4meC4lCcsIGQucmVwYWlycy5vdmVyZHVlID8gJ2JhZCcgOiAnJyk7CgogICAgdmFyIGFsZXJ0cyA9IGQuYWxlcnRzLmxlbmd0aAogICAgICA/ICc8ZGl2IGNsYXNzPSJhbGlzdCI+JyArIGQuYWxl',
  'cnRzLnNsaWNlKDAsMTIpLm1hcChmdW5jdGlvbihhKXsKICAgICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0iYWxpIGwtJyArIGEubGV2ZWwgKyAnIiBvbmNsaWNrPSJnbyhcJycgKyBqdW1wUGFnZShhLm1vZHVsZSkgKyAnXCcpIj4nICsKICAgICAgICAgICAgICAg',
  'ICAnPGRpdiBjbGFzcz0iaWMiPicgKyBhLmljb24gKyAnPC9kaXY+PGRpdj48ZGl2IGNsYXNzPSJ0dCI+JyArIGVzYyhhLnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0iZGQiPicgKyBlc2MoYS5kZXRhaWwpICsgJzwvZGl2',
  'PjwvZGl2PjwvZGl2Pic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JwogICAgICA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj7inIU8L2Rpdj7guYTguKHguYjguKHguLXguIfguLLguJnguITguYnguLLguIcg4oCUIOC4l+C4uOC4',
  'geC4reC4ouC5iOC4suC4h+C5gOC4o+C4teC4ouC4muC4o+C5ieC4reC4ojwvZGl2Pic7CgogICAgcmV0dXJuICcnICsKICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArIGtwaXMgKyAnPC9kaXY+JyArCgogICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBn',
  'MiBtYjEyIj4nICsKICAgICAgICBjYXJkKCfwn5KwIOC4o+C4suC4ouC4geC4suC4o+C4quC4o+C4uOC4m+C4o+C4p+C4oSAo4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiBKScsCiAgICAgICAgICBkZWJ0TWluaShkLmRlYnRNYWluLCAnZGVidE1haW4nKSwKICAgICAg',
  'ICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImdvKFwnZGVidE1haW5cJykiPuC4lOC4ueC4l+C4seC5ieC4h+C4q+C4oeC4lCDihpI8L2J1dHRvbj4nKSArCiAgICAgICAgY2FyZCgn8J+nviDguKvguJnguLXguYnguKrguLTguJkgKOC4q+C4meC4',
  'teC5ieC4o+C4reC4hyknLAogICAgICAgICAgZGVidE1pbmkoZC5kZWJ0U3ViLCAnZGVidFN1YicpICsKICAgICAgICAgIChkLmRlYnRTdWIuaW50ZXJlc3RUaGlzWWVhciA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIG10OCI+4LiU4Lit4LiB4LmA4Lia4Li14LmJ',
  '4Lii4LiX4Li14LmI4LiK4Liz4Lij4Liw4Lib4Li1ICcgKyBkLnllYXIgKyAnOiA8Yj4nICsgYmFodChkLmRlYnRTdWIuaW50ZXJlc3RUaGlzWWVhcikgKyAnPC9iPjwvZGl2PicgOiAnJyksCiAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNr',
  'PSJnbyhcJ2RlYnRTdWJcJykiPuC4lOC4ueC4l+C4seC5ieC4h+C4q+C4oeC4lCDihpI8L2J1dHRvbj4nKSArCiAgICAgICc8L2Rpdj4nICsKCiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICAgIGtwaSgn4Lir4LmJ4Lit4LiH4LiX4Lix',
  '4LmJ4LiH4Lir4Lih4LiUJywgYi50b3RhbFJvb21zICsgJyDguKvguYnguK3guIcnLCAn4Lih4Li14Lic4Li54LmJ4LmA4LiK4LmI4LiyICcgKyBiLm9jY3VwaWVkICsgJyDCtyDguKfguYjguLLguIcgJyArIGIudmFjYW50KSArCiAgICAgICAga3BpKCfguKXguYng',
  'uLLguIfguYHguK3guKPguYzguJvguLUgJyArIGQueWVhciwgZC5hYy5yb29tc0RvbmUgKyAnLycgKyBiLnRvdGFsUm9vbXMgKyAnIOC4q+C5ieC4reC4hycsIGQuYWMuZG9uZUluWWVhciArICcg4Lij4Lit4LiaIMK3IOC4hOC5ieC4suC4hyAnICsgZC5hYy5yb29t',
  'c1BlbmRpbmcgKyAnIOC4q+C5ieC4reC4hycsIGQuYWMucm9vbXNQZW5kaW5nID8gJ3dhcm4nIDogJ2dvb2QnKSArCiAgICAgICAga3BpKCfguIvguLfguYnguK3guILguK3guIfguJvguLUgJyArIGQueWVhciwgYmFodChkLnB1cmNoYXNlcy55ZWFyVG90YWwpLCBk',
  'LnB1cmNoYXNlcy55ZWFyQ291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4oycpICsKICAgICAgICBrcGkoJ+C4m+C4o+C4sOC4geC4seC4meC5g+C4geC4peC5ieC4q+C4oeC4lCcsIGQucHVyY2hhc2VzLndhcnJhbnR5LmV4cGlyaW5nICsgJyDguKPguLLguKLguIHg',
  'uLLguKMnLCAn4Lir4Lih4LiU4Lit4Liy4Lii4Li44LmB4Lil4LmJ4LinICcgKyBkLnB1cmNoYXNlcy53YXJyYW50eS5leHBpcmVkLCBkLnB1cmNoYXNlcy53YXJyYW50eS5leHBpcmluZyA/ICd3YXJuJyA6ICcnKSArCiAgICAgICc8L2Rpdj4nICsKCiAgICAgICc8',
  'ZGl2IGNsYXNzPSJncmlkIGcyIG1iMTIiPicgKwogICAgICAgIGNhcmQoJ/Cfk5Ig4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4ouC4q+C4rSDguJvguLUgJyArIGQueWVhciwKICAgICAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGczIG1iMTIi',
  'PicgKwogICAgICAgICAgICBrcGkoJ+C4o+C4suC4ouC4o+C4seC4micsIGJhaHQoZC5maW5hbmNlLmluY29tZSksICfguYDguInguKXguLXguYjguKIgJyArIGJhaHQoZC5maW5hbmNlLmF2Z0luY29tZSkgKyAnL+C5gOC4lOC4t+C4reC4mScsICdnb29kJykgKwog',
  'ICAgICAgICAgICBrcGkoJ+C4o+C4suC4ouC4iOC5iOC4suC4oicsIGJhaHQoZC5maW5hbmNlLmV4cGVuc2UpLCAn4LmA4LiJ4Lil4Li14LmI4LiiICcgKyBiYWh0KGQuZmluYW5jZS5hdmdFeHBlbnNlKSArICcv4LmA4LiU4Li34Lit4LiZJywgJ2JhZCcpICsKICAg',
  'ICAgICAgICAga3BpKCfguITguIfguYDguKvguKXguLfguK3guKrguLjguJfguJjguLQnLCBiYWh0KGQuZmluYW5jZS5uZXQpLCAn4Lit4Lix4LiV4Lij4Liy4LiB4Liz4LmE4LijICcgKyBwY3QoZC5maW5hbmNlLm1hcmdpbikpICsKICAgICAgICAgICc8L2Rpdj4n',
  'ICsgbWluaU1vbnRoQ2hhcnQoZC5maW5hbmNlLmJ5TW9udGgpLAogICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZ28oXCdmaW5hbmNlXCcpIj7guJTguLnguJfguLHguYnguIfguKvguKHguJQg4oaSPC9idXR0b24+JykgKwogICAgICAg',
  'IGNhcmQoJ/Cfl5PvuI8g4LiH4Liy4LiZ4LiX4Li14LmI4LiB4Liz4Lil4Lix4LiH4LiI4Liw4LiW4Li24LiHICgnICsgZC51cGNvbWluZy5sZW5ndGggKyAnKScsCiAgICAgICAgICBkLnVwY29taW5nLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJhbGlzdCI+JyArIGQu',
  'dXBjb21pbmcuc2xpY2UoMCw3KS5tYXAoZnVuY3Rpb24odSl7CiAgICAgICAgICAgIHZhciBsdmwgPSB1LmRheXNMZWZ0IDwgMCA/ICdkYW5nZXInIDogKHUuZGF5c0xlZnQgPD0gNyA/ICd3YXJuJyA6ICdpbmZvJyk7CiAgICAgICAgICAgIHJldHVybiAnPGRpdiBj',
  'bGFzcz0iYWxpIGwtJyArIGx2bCArICciIG9uY2xpY2s9ImdvKFwnJyArIGp1bXBQYWdlKHUubW9kdWxlKSArICdcJykiPicgKwogICAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJpYyI+JyArIHUuaWNvbiArICc8L2Rpdj48ZGl2PjxkaXYgY2xhc3M9InR0Ij4nICsg',
  'ZXNjKHUudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJkZCI+JyArIHRoRGF0ZSh1LmRhdGUpICsgJyDCtyAnICsKICAgICAgICAgICAgICAgICh1LmRheXNMZWZ0IDwgMCA/ICfguYDguKXguKLguIHguLPguKvguJnguJQgJyAr',
  'ICgtdS5kYXlzTGVmdCkgKyAnIOC4p+C4seC4mScgOiAodS5kYXlzTGVmdCA9PT0gMCA/ICfguKfguLHguJnguJnguLXguYknIDogJ+C4reC4teC4gSAnICsgdS5kYXlzTGVmdCArICcg4Lin4Lix4LiZJykpICsKICAgICAgICAgICAgICAnPC9kaXY+PC9kaXY+PC9k',
  'aXY+JzsKICAgICAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPjxkaXYgY2xhc3M9ImJpZyI+8J+MpO+4jzwvZGl2PuC5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4meC4seC4lOC4q+C4oeC4suC4ouC5gOC4o+C5h+C4pyDg',
  'uYYg4LiZ4Li14LmJPC9kaXY+JywKICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImdvKFwncmVwb3J0c1wnKSI+4Lib4LiP4Li04LiX4Li04LiZ4LmA4LiV4LmH4LihIOKGkjwvYnV0dG9uPicsIHRydWUpICsKICAgICAgJzwvZGl2Picg',
  'KwoKICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzIiPicgKwogICAgICAgIGNhcmQoJ/CflJQg4Liq4Li04LmI4LiH4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LiX4LizICgnICsgZC5hbGVydHMubGVuZ3RoICsgJyknLCBhbGVydHMsICcnLCB0cnVlKSArCiAgICAgICAg',
  'Y2FyZCgn8J+PoiDguIfguLLguJnguIvguYjguK3guKHguYHguIvguKHguJXguLbguIHguYLguJTguKLguKPguKfguKEnLAogICAgICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzIiPicgKwogICAgICAgICAgICBrcGkoJ+C4h+C4suC4meC4m+C4tSAnICsgZC55ZWFy',
  'LCBkLmJ1aWxkaW5nUmVwYWlycy55ZWFyQ291bnQgKyAnIOC4h+C4suC4mScsICfguITguYnguLLguIcgJyArIGQuYnVpbGRpbmdSZXBhaXJzLm9wZW5Db3VudCkgKwogICAgICAgICAgICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oicsIGJhaHQo',
  'ZC5idWlsZGluZ1JlcGFpcnMueWVhckNvc3QpLCAn4LiE4Lij4Lia4LiB4Liz4Lir4LiZ4LiU4LmA4Lij4LmH4LinIOC5hiDguJnguLXguYkgJyArIGQuYnVpbGRpbmdSZXBhaXJzLnVwY29taW5nKSArCiAgICAgICAgICAnPC9kaXY+JyArCiAgICAgICAgICAoZC5k',
  'ZWJ0TWFpbi5mb3JlY2FzdCAmJiBkLmRlYnRNYWluLmZvcmVjYXN0Lm1vbnRoc0xlZnQKICAgICAgICAgICAgPyAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PjxkaXYgY2xhc3M9ImZzMTMiPjxiPuC4m+C4o+C4sOC4oeC4suC4k+C4geC4suC4o+C4m+C4tOC4lOC4q+C4',
  'meC4teC5ieC4q+C4peC4seC4gTwvYj48ZGl2IGNsYXNzPSJtdXRlZCBtdDgiPicgKwogICAgICAgICAgICAgICfguIjguLLguIHguK3guLHguJXguKPguLLguIrguLPguKPguLDguYDguInguKXguLXguYjguKIgJyArIGJhaHQoZC5kZWJ0TWFpbi5mb3JlY2FzdC5h',
  'dmdQZXJNb250aCkgKyAnL+C5gOC4lOC4t+C4reC4mSAoMTIg4LmA4LiU4Li34Lit4LiZ4Lil4LmI4Liy4Liq4Li44LiUKSAnICsKICAgICAgICAgICAgICAn4LiE4Liy4LiU4Lin4LmI4Liy4Lit4Li14LiBIDxiPicgKyBkLmRlYnRNYWluLmZvcmVjYXN0Lm1vbnRo',
  'c0xlZnQgKyAnIOC5gOC4lOC4t+C4reC4mTwvYj4gJyArCiAgICAgICAgICAgICAgJyjguKPguLLguKcgJyArIHRoRGF0ZShkLmRlYnRNYWluLmZvcmVjYXN0LnBheW9mZkRhdGUpICsgJyk8L2Rpdj48L2Rpdj4nCiAgICAgICAgICAgIDogJycpLAogICAgICAgICAg',
  'JzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZ28oXCdidWlsZGluZ1wnKSI+4LiU4Li54LiX4Lix4LmJ4LiH4Lir4Lih4LiUIOKGkjwvYnV0dG9uPicpICsKICAgICAgJzwvZGl2Pic7CiAgfSwKICBhZnRlcjogZnVuY3Rpb24oZCl7CiAgICBzZXRCYWRn',
  'ZSgncmVwYWlycycsIGQucmVwYWlycy5vcGVuSm9icyk7CiAgICBzZXRCYWRnZSgnYWMnLCBkLmFjLnJvb21zUGVuZGluZyk7CiAgfQp9OwoKZnVuY3Rpb24gbWluaU1vbnRoQ2hhcnQoYnlNb250aCl7CiAgdmFyIG1heCA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGJ5',
  'TW9udGgubWFwKGZ1bmN0aW9uKG0peyByZXR1cm4gTWF0aC5tYXgobS5pbmNvbWUsIG0uZXhwZW5zZSk7IH0pKSB8fCAxOwogIHJldHVybiAnPGRpdiBzdHlsZT0iZGlzcGxheTpmbGV4O2dhcDozcHg7YWxpZ24taXRlbXM6ZmxleC1lbmQ7aGVpZ2h0Ojc0cHgiPicg',
  'KyBieU1vbnRoLm1hcChmdW5jdGlvbihtKXsKICAgIHZhciBoaSA9IE1hdGgucm91bmQobS5pbmNvbWUgLyBtYXggKiA2NiksIGhlID0gTWF0aC5yb3VuZChtLmV4cGVuc2UgLyBtYXggKiA2Nik7CiAgICByZXR1cm4gJzxkaXYgc3R5bGU9ImZsZXg6MTt0ZXh0LWFs',
  'aWduOmNlbnRlciIgdGl0bGU9IicgKyBtLmxhYmVsICsgJyDCtyDguKPguLHguJogJyArIG1vbmV5KG0uaW5jb21lKSArICcgwrcg4LiI4LmI4Liy4LiiICcgKyBtb25leShtLmV4cGVuc2UpICsgJyI+JyArCiAgICAgICc8ZGl2IHN0eWxlPSJkaXNwbGF5OmZsZXg7',
  'Z2FwOjFweDthbGlnbi1pdGVtczpmbGV4LWVuZDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO2hlaWdodDo2NnB4Ij4nICsKICAgICAgICAnPGRpdiBzdHlsZT0id2lkdGg6NnB4O2hlaWdodDonICsgaGkgKyAncHg7YmFja2dyb3VuZDp2YXIoLS1vayk7Ym9yZGVyLXJh',
  'ZGl1czoycHggMnB4IDAgMCI+PC9kaXY+JyArCiAgICAgICAgJzxkaXYgc3R5bGU9IndpZHRoOjZweDtoZWlnaHQ6JyArIGhlICsgJ3B4O2JhY2tncm91bmQ6dmFyKC0tZGFuZ2VyKTtib3JkZXItcmFkaXVzOjJweCAycHggMCAwIj48L2Rpdj4nICsKICAgICAgJzwv',
  'ZGl2PjxkaXYgY2xhc3M9ImZhaW50IiBzdHlsZT0iZm9udC1zaXplOjkuNXB4Ij4nICsgbS5sYWJlbC5yZXBsYWNlKCcuJywnJykgKyAnPC9kaXY+PC9kaXY+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nICsKICAnPGRpdiBjbGFzcz0icm93IGZzMTIgbXV0ZWQg',
  'bXQ4Ij48c3BhbiBjbGFzcz0iYiBvayI+4Lij4Liy4Lii4Lij4Lix4LiaPC9zcGFuPjxzcGFuIGNsYXNzPSJiIGRnciI+4Lij4Liy4Lii4LiI4LmI4Liy4LiiPC9zcGFuPjwvZGl2Pic7Cn0KCmZ1bmN0aW9uIGRlYnRNaW5pKHgsIHBhZ2UpewogIHJldHVybiAnPGRp',
  'diBjbGFzcz0icG1ldGEiIHN0eWxlPSJtYXJnaW46MCAwIDZweCI+PHNwYW4+4LiK4Liz4Lij4Liw4LmB4Lil4LmJ4LinIDxiPicgKyBiYWh0KHgucGFpZCkgKyAnPC9iPjwvc3Bhbj4nICsKICAgICAgICAgJzxzcGFuPjxiPicgKyBwY3QoeC5wZXJjZW50KSArICc8',
  'L2I+PC9zcGFuPjwvZGl2PicgKwogICAgICAgICBwcm9ncmVzcyh4LnBlcmNlbnQsICdsZycpICsKICAgICAgICAgJzxkaXYgY2xhc3M9InBtZXRhIj48c3Bhbj7guITguIfguYDguKvguKXguLfguK0gPGI+JyArIGJhaHQoeC5yZW1haW5pbmcpICsgJzwvYj48L3Nw',
  'YW4+JyArCiAgICAgICAgICc8c3Bhbj7guKLguK3guJTguKvguJnguLXguYnguJfguLHguYnguIfguKvguKHguJQgPGI+JyArIGJhaHQoeC50b3RhbCkgKyAnPC9iPjwvc3Bhbj48L2Rpdj4nICsKICAgICAgICAgJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbXQ4Ij7g',
  'uIrguLPguKPguLDguYPguJnguJvguLXguJfguLXguYjguYDguKXguLfguK3guIE6IDxiPicgKyBiYWh0KHgudGhpc1llYXIpICsgJzwvYj48L2Rpdj4nOwp9CgpmdW5jdGlvbiBzZXRCYWRnZShwYWdlLCBuKXsKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50',
  'QnlJZCgnYmFkZ2UtJyArIHBhZ2UpOwogIGlmICghZWwpIHJldHVybjsKICBpZiAobiA+IDApIHsgZWwudGV4dENvbnRlbnQgPSBuOyBlbC5zdHlsZS5kaXNwbGF5ID0gJyc7IH0KICBlbHNlIGVsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7Cn0KCi8qID09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICAyKSDguKvguJnguLXguYnguKvguKXguLHguIEgLyDguKvguJnguLXguYnguKPguK3guIcgKOC5g+C4iuC5ieC4leC4seC4p+C4p+C4suC4lOC4o+C5iOC4p+C4oeC4',
  'geC4seC4mSkKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGRlYnRSb3V0ZShsZWRnZXIsIHRpdGxlKXsKICByZXR1cm4gewogICAgbG9hZDogZnVuY3Rpb24oKXsKICAgICAg',
  'cmV0dXJuIFByb21pc2UuYWxsKFsKICAgICAgICBjYWxsQXBpKCdkZWJ0LnN1bW1hcnknLCB7IGxlZGdlcjogbGVkZ2VyLCB5ZWFyOiBTLnllYXIgfSksCiAgICAgICAgY2FsbEFwaSgnZGVidC5wYXltZW50cycsIHsgbGVkZ2VyOiBsZWRnZXIsIHllYXI6IFMueWVh',
  'ciB9KQogICAgICBdKS50aGVuKGZ1bmN0aW9uKHIpewogICAgICAgIHZhciBkID0gclswXTsgZC5wYXltZW50cyA9IHJbMV07IGQubGVkZ2VyID0gbGVkZ2VyOyBkLnBhZ2VUaXRsZSA9IHRpdGxlOwogICAgICAgIHJldHVybiBkOwogICAgICB9KTsKICAgIH0sCiAg',
  'ICByZW5kZXI6IHJlbmRlckRlYnQsCiAgICBhZnRlcjogY2FjaGVBbGxEZWJ0cwogIH07Cn0KUk9VVEVTLmRlYnRNYWluID0gZGVidFJvdXRlKCfguKvguJnguLXguYnguKvguKXguLHguIEnLCAn4Lij4Liy4Lii4LiB4Liy4Lij4Liq4Lij4Li44Lib4Lij4Lin4Lih',
  'IFRoZSBNIENvcm5lciBBUCcpOwpST1VURVMuZGVidFN1YiAgPSBkZWJ0Um91dGUoJ+C4q+C4meC4teC5ieC4o+C4reC4hycsICfguKvguJnguLXguYnguKrguLTguJknKTsKCi8qKiDguYDguIHguYfguJrguKPguLLguKLguIrguLfguYjguK3guIHguYnguK3guJng',
  'uKvguJnguLXguYnguJfguLjguIHguJrguLHguI3guIrguLXguYTguKfguYnguYPguKvguYnguJ/guK3guKPguYzguKHguYDguKXguLfguK3guIEgIuC5gOC4m+C5h+C4meC4quC5iOC4p+C4meC4q+C4meC4tuC5iOC4h+C4guC4reC4hyIgKi8KZnVuY3Rpb24gY2Fj',
  'aGVBbGxEZWJ0cygpewogIGNhbGxBcGkoJ2RlYnQubGlzdCcsIHt9KS50aGVuKGZ1bmN0aW9uKGxpc3QpewogICAgQUxMX0RFQlRTID0gbGlzdC5tYXAoZnVuY3Rpb24oZCl7CiAgICAgIHJldHVybiB7IGlkOiBkLmlkLCB0aXRsZTogZC50aXRsZSwgbGVkZ2VyOiBk',
  'LmxlZGdlciwgcGFyZW50SWQ6IGQucGFyZW50SWQgfHwgJycgfTsKICAgIH0pOwogIH0pLmNhdGNoKGZ1bmN0aW9uKCl7fSk7Cn0KCmZ1bmN0aW9uIHJlbmRlckRlYnQoZCl7CiAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib',
  '4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKCiAgdmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iY2FyZCBtYjEyIj48ZGl2IGNsYXNzPSJjYXJkLWIiPicgKwogICAgJzxkaXYgY2xhc3M9InJvdyBtYjEyIj48aDMgc3R5bGU9Im1hcmdpbjowO2ZvbnQtc2l6ZToxNXB4',
  'Ij4nICsgZXNjKGQucGFnZVRpdGxlKSArICc8L2gzPicgKwogICAgJzxzcGFuIGNsYXNzPSJzcCI+PC9zcGFuPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgc20iIG9uY2xpY2s9ImZvcm1EZWJ0UGF5bWVudChudWxsLFwnJyArIGQubGVkZ2VyICsgJ1wn',
  'KSI+KyDguJrguLHguJnguJfguLbguIHguIHguLLguKPguIrguLPguKPguLA8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImZvcm1EZWJ0KG51bGwsXCcnICsgZC5sZWRnZXIgKyAnXCcpIj4rIOC5gOC4nuC4tOC5iOC4oeC4',
  'geC5ieC4reC4meC4q+C4meC4teC5iTwvYnV0dG9uPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InBtZXRhIiBzdHlsZT0ibWFyZ2luOjAgMCA3cHgiPjxzcGFuPuC4hOC4p+C4suC4oeC4hOC4t+C4muC4q+C4meC5ieC4suC4geC4suC4o+C4iuC4s+C4o+C4sDwv',
  'c3Bhbj48c3Bhbj48Yj4nICsgcGN0KGQucGVyY2VudCkgKyAnPC9iPjwvc3Bhbj48L2Rpdj4nICsKICAgIHByb2dyZXNzKGQucGVyY2VudCwgJ2xnICcgKyAoZC5wZXJjZW50ID49IDEwMCA/ICdvaycgOiAnJykpICsKICAgICc8ZGl2IGNsYXNzPSJncmlkIGc0IG10',
  'MTYiPicgKwogICAgICBrcGkoJ+C4ouC4reC4lOC4q+C4meC4teC5ieC4l+C4seC5ieC4h+C4q+C4oeC4lCcsIGJhaHQoZC50b3RhbERlYnQpLCBkLmRlYnRzLmxlbmd0aCArICcg4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJJykgKwogICAgICBrcGkoJ+C4iuC4s+C4',
  'o+C4sOC5geC4peC5ieC4pycsIGJhaHQoZC5wYWlkKSwgZC5wYXltZW50Q291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4o+C5guC4reC4mScsICdnb29kJykgKwogICAgICBrcGkoJ+C4hOC4h+C5gOC4q+C4peC4t+C4rScsIGJhaHQoZC5yZW1haW5pbmcpLCAn4Lit',
  '4Li14LiBICcgKyBwY3QoMTAwIC0gZC5wZXJjZW50KSArICcg4LiI4Liw4Lib4Li04LiU4Lir4LiZ4Li14LmJJywgJ2JhZCcpICsKICAgICAga3BpKCfguIrguLPguKPguLDguYPguJknICsgeWVhckxhYmVsLCBiYWh0KGQuc2VsZWN0ZWRZZWFyUGFpZCksIGQuc2Vs',
  'ZWN0ZWRZZWFyQ291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4oycgKwogICAgICAgICAgKGQuc2VsZWN0ZWRZZWFySW50ZXJlc3QgPyAnIMK3IOC4lOC4reC4geC5gOC4muC4teC5ieC4oiAnICsgYmFodChkLnNlbGVjdGVkWWVhckludGVyZXN0KSA6ICcnKSkgKwog',
  'ICAgJzwvZGl2PjwvZGl2PjwvZGl2Pic7CgogIHZhciBwZXJEZWJ0ID0gZC5kZWJ0cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0iZ3JpZCBnLWF1dG8gbWIxMiI+JyArIGQuZGVidHMubWFwKGZ1bmN0aW9uKHgpewogICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJjYXJkIj48',
  'ZGl2IGNsYXNzPSJjYXJkLWIiPicgKwogICAgICAnPGRpdiBjbGFzcz0iY2xpcCIgc3R5bGU9ImZvbnQtd2VpZ2h0OjY1MDtmb250LXNpemU6MTMuNXB4O21pbi1oZWlnaHQ6MzhweCI+JyArIGVzYyh4LnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xh',
  'c3M9InJvdyBmczEyIG11dGVkIG1iOCI+JyArIHN0YXR1c0JhZGdlKHguc3RhdHVzKSArCiAgICAgICAgJzxzcGFuPicgKyBlc2MoeC5jcmVkaXRvciB8fCAn4oCTJykgKyAoeC5zdGFydERhdGUgPyAnIMK3ICcgKyB0aERhdGUoeC5zdGFydERhdGUpIDogJycpICsg',
  'Jzwvc3Bhbj48L2Rpdj4nICsKICAgICAgKHgucGFyZW50VGl0bGUKICAgICAgICA/ICc8ZGl2IGNsYXNzPSJiIGluZm8gbWI4IiB0aXRsZT0i4Lii4Lit4LiU4LiB4LmJ4Lit4LiZ4LiZ4Li14LmJ4Lit4Lii4Li54LmI4LmD4LiZ4LiB4LmJ4Lit4LiZ4LmB4Lih4LmI',
  '4LmB4Lil4LmJ4LinIOC4iOC5iOC4suC4ouC4hOC4t+C4meC4geC5ieC4reC4meC4meC4teC5ieC4geC5ieC4reC4meC5geC4oeC5iOC4iOC4sOC4peC4lOC4leC4suC4oSI+JyArCiAgICAgICAgICAn4oazIOC5gOC4m+C5h+C4meC4quC5iOC4p+C4meC4q+C4meC4',
  'tuC5iOC4h+C4guC4reC4hyAnICsgZXNjKHgucGFyZW50VGl0bGUpICsgJzwvZGl2PicKICAgICAgICA6ICcnKSArCiAgICAgIHByb2dyZXNzKHgucGVyY2VudCkgKwogICAgICAnPGRpdiBjbGFzcz0icG1ldGEiPjxzcGFuPuC4iuC4s+C4o+C4sCA8Yj4nICsgYmFo',
  'dCh4LnBhaWQpICsgJzwvYj48L3NwYW4+PHNwYW4+4LiE4LiH4LmA4Lir4Lil4Li34LitIDxiPicgKyBiYWh0KHgucmVtYWluaW5nKSArICc8L2I+PC9zcGFuPjwvZGl2PicgKwogICAgICAoeC5jaGlsZHJlbiAmJiB4LmNoaWxkcmVuLmxlbmd0aAogICAgICAgID8g',
  'JzxkaXYgY2xhc3M9ImhyIiBzdHlsZT0ibWFyZ2luOjEycHggMCAxMHB4Ij48L2Rpdj4nICsKICAgICAgICAgICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIG1iOCI+4LmD4LiZ4Lii4Lit4LiU4LiZ4Li14LmJ4Lih4Li14LiB4LmJ4Lit4LiZ4Lii4LmI4Lit4Lii4Lit',
  '4Lii4Li54LmIICcgKyB4LmNoaWxkcmVuLmxlbmd0aCArICcg4LiB4LmJ4Lit4LiZPC9kaXY+JyArCiAgICAgICAgICB4LmNoaWxkcmVuLm1hcChmdW5jdGlvbihjKXsKICAgICAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJtYjgiPicgKwogICAgICAgICAgICAg',
  'ICc8ZGl2IGNsYXNzPSJyb3cgZnMxMiI+PHNwYW4+4oazICcgKyBlc2MoYy50aXRsZSkgKyAnPC9zcGFuPicgKwogICAgICAgICAgICAgICc8c3BhbiBjbGFzcz0ic3AgbW9ubyI+JyArIG1vbmV5KGMucGFpZCkgKyAnIC8gJyArIG1vbmV5KGMucHJpbmNpcGFsKSAr',
  'ICc8L3NwYW4+PC9kaXY+JyArCiAgICAgICAgICAgICAgcHJvZ3Jlc3MoYy5wZXJjZW50LCAnb2snKSArICc8L2Rpdj4nOwogICAgICAgICAgfSkuam9pbignJykgKwogICAgICAgICAgKHgucGFpZEZyb21DaGlsZHJlbiA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVk',
  'Ij7guKPguKfguKHguKLguK3guJTguJfguLXguYjguKHguLLguIjguLLguIHguIHguYnguK3guJnguKLguYjguK3guKIgJyArIGJhaHQoeC5wYWlkRnJvbUNoaWxkcmVuKSArICc8L2Rpdj4nIDogJycpCiAgICAgICAgOiAnJykgKwogICAgICAoeC5pbnRlcmVzdFBl',
  'ck1vbnRoID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbXQ4Ij7guJTguK3guIHguYDguJrguLXguYnguKIgJyArIGJhaHQoeC5pbnRlcmVzdFBlck1vbnRoKSArICcv4LmA4LiU4Li34Lit4LiZPC9kaXY+JyA6ICcnKSArCiAgICAgICh4LnBsYW5QZXJNb250aCA/',
  'ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIj7guYHguJzguJnguJzguYjguK3guJkgJyArIGJhaHQoeC5wbGFuUGVyTW9udGgpICsgJy/guYDguJTguLfguK3guJk8L2Rpdj4nIDogJycpICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBtdDEyIj48YnV0dG9uIGNsYXNz',
  'PSJidG4gc20iIG9uY2xpY2s9XCdmb3JtRGVidCgnICsgYXR0cih4KSArICcsIicgKyBkLmxlZGdlciArICciKVwnPuC5geC4geC5ieC5hOC4gjwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGRnciIgb25jbGljaz0iZGVsRGVidChcJycg',
  'KyB4LmlkICsgJ1wnKSI+4Lil4LiaPC9idXR0b24+PC9kaXY+JyArCiAgICAnPC9kaXY+PC9kaXY+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nIDogJyc7CgogIHZhciBieVllYXIgPSBkLmJ5WWVhci5sZW5ndGggPyBjYXJkKCfwn5OFIOC4ouC4reC4lOC4iuC4',
  's+C4o+C4sOC5geC4ouC4geC4leC4suC4oeC4m+C4tScsCiAgICAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsKICAgICc8dGg+4Lib4Li1PC90aD48dGggY2xhc3M9Im51bSI+4LmA4LiH4Li04LiZ4LiV4LmJ4LiZPC90aD48',
  'dGggY2xhc3M9Im51bSI+4LiU4Lit4LiB4LmA4Lia4Li14LmJ4LiiPC90aD48dGggY2xhc3M9Im51bSI+4Lij4Lin4Lih4LiX4Li14LmI4LmC4Lit4LiZPC90aD4nICsKICAgICc8dGggY2xhc3M9Im51bSI+4LiI4Liz4LiZ4Lin4LiZ4LiE4Lij4Lix4LmJ4LiHPC90',
  'aD48dGggY2xhc3M9Im51bSI+4LmA4LiH4Li04LiZ4LiV4LmJ4LiZ4Liq4Liw4Liq4LihPC90aD48dGggc3R5bGU9IndpZHRoOjI2JSI+4LiE4Lin4Liy4Lih4LiE4Li34Lia4Lir4LiZ4LmJ4Liy4Liq4Liw4Liq4LihPC90aD4nICsKICAgICc8L3RyPjwvdGhlYWQ+',
  'PHRib2R5PicgKwogICAgZC5ieVllYXIubWFwKGZ1bmN0aW9uKHkpewogICAgICB2YXIgY3VtID0geS5jdW11bGF0aXZlICE9IG51bGwgPyB5LmN1bXVsYXRpdmUgOiAwOwogICAgICB2YXIgcCA9IGQudG90YWxEZWJ0ID8gKGN1bSAvIGQudG90YWxEZWJ0ICogMTAw',
  'KSA6IDA7CiAgICAgIHJldHVybiAnPHRyIG9uY2xpY2s9InNldFllYXJGcm9tVGFibGUoJyArIHkueWVhciArICcpIiBzdHlsZT0iY3Vyc29yOnBvaW50ZXIiPicgKwogICAgICAgICc8dGQ+PGI+JyArIHkueWVhciArICc8L2I+IDxzcGFuIGNsYXNzPSJmYWludCBm',
  'czEyIj4vICcgKyAoeS55ZWFyKzU0MykgKyAnPC9zcGFuPjwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbW9uZXkoeS5wcmluY2lwYWwpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHkuaW50ZXJlc3QgPyBtb25l',
  'eSh5LmludGVyZXN0KSA6ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9Im51bSI+PGI+JyArIG1vbmV5KHkucHJpbmNpcGFsICsgeS5pbnRlcmVzdCkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgeS5jb3Vu',
  'dCArICc8L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIG1vbmV5KGN1bSkgKyAnPC90ZD4nICsKICAgICAgICAnPHRkPicgKyBwcm9ncmVzcyhwKSArICc8L3RkPjwvdHI+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rp',
  'dj4nLCAnJywgdHJ1ZSkgOiAnJzsKCiAgdmFyIHJvd3MgPSBkLnBheW1lbnRzOwogIHZhciBsaXN0ID0gY2FyZCgn8J+nviDguKPguLLguKLguIHguLLguKPguYLguK3guJnguYPguIrguYnguKvguJnguLXguYkgwrcgJyArIHllYXJMYWJlbCArICcgKCcgKyByb3dz',
  'Lmxlbmd0aCArICcpJywKICAgIHJvd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICc8dGg+4Lin4Lix4LiZ4LiX4Li14LmIPC90aD48dGg+4LiH4Lin4LiUPC90aD48dGggY2xhc3M9Im51bSI+',
  '4LmA4LiH4Li04LiZ4LiV4LmJ4LiZPC90aD48dGggY2xhc3M9Im51bSI+4LiU4Lit4LiB4LmA4Lia4Li14LmJ4LiiPC90aD4nICsKICAgICAgJzx0aCBjbGFzcz0ibnVtIj7guKPguKfguKHguJfguLXguYjguYLguK3guJk8L3RoPjx0aD7guIrguYjguK3guIfguJfg',
  'uLLguIc8L3RoPicgKwogICAgICAnPHRoPuC4quC4peC4tOC4mzwvdGg+PHRoPuC4q+C4oeC4suC4ouC5gOC4q+C4leC4uDwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgcm93cy5tYXAoZnVuY3Rpb24ocCl7CiAgICAgICAgcmV0dXJu',
  'ICc8dHI+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAiPicgKyB0aERhdGUocC5wYXlEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIj4nICsgZXNjKHAuaW5zdGFsbG1lbnQgfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAg',
  'ICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAocC5wcmluY2lwYWwgPyAnPGIgc3R5bGU9ImNvbG9yOnZhcigtLW9rKSI+JyArIG1vbmV5KHAucHJpbmNpcGFsKSArICc8L2I+JyA6ICc8c3BhbiBjbGFzcz0iZmFpbnQiPuKAkzwvc3Bhbj4nKSArICc8L3RkPicg',
  'KwogICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHAuaW50ZXJlc3QgPyAnPGIgc3R5bGU9ImNvbG9yOnZhcigtLXdhcm4pIj4nICsgbW9uZXkocC5pbnRlcmVzdCkgKyAnPC9iPicgOiAnPHNwYW4gY2xhc3M9ImZhaW50Ij7igJM8L3NwYW4+JykgKyAnPC90',
  'ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+PGI+JyArIG1vbmV5KHAuYW1vdW50KSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MocC5jaGFubmVsIHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAg',
  'Jzx0ZD4nICsgdGh1bWJzSHRtbChwLnNsaXBSZWZzKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiBtdXRlZCBjbGlwIj4nICsgZXNjKHAubm90ZSB8fCAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rp',
  'b25zIj4nICsKICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIiBvbmNsaWNrPVwnZm9ybURlYnRQYXltZW50KCcgKyBhdHRyKHApICsgJywiJyArIGQubGVkZ2VyICsgJyIpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAgICc8YnV0',
  'dG9uIGNsYXNzPSJidG4gc20gaWNvbiBkZ3IiIG9uY2xpY2s9ImRlbERlYnRQYXltZW50KFwnJyArIHAuaWQgKyAnXCcpIj7wn5eRPC9idXR0b24+JyArCiAgICAgICAgICAnPC9kaXY+PC90ZD48L3RyPic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90',
  'YWJsZT48L2Rpdj4nCiAgICA6IGVtcHR5Qm94KCfguKLguLHguIfguYTguKHguYjguKHguLXguKPguLLguKLguIHguLLguKPguIrguLPguKPguLDguYPguJknICsgeWVhckxhYmVsLAogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3Jt',
  'RGVidFBheW1lbnQobnVsbCxcJycgKyBkLmxlZGdlciArICdcJykiPisg4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4LiK4Liz4Lij4LiwPC9idXR0b24+JyksCiAgICAnJywgdHJ1ZSk7CgogIHJldHVybiBoZWFkICsgcGVyRGVidCArIGJ5WWVhciArICc8ZGl2',
  'IGNsYXNzPSJtdDEyIj4nICsgbGlzdCArICc8L2Rpdj4nOwp9CgpmdW5jdGlvbiBzZXRZZWFyRnJvbVRhYmxlKHkpewogIFMueWVhciA9IFN0cmluZyh5KTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgneWVhclNlbCcpLnZhbHVlID0gUy55ZWFyOwogIGxvYWQo',
  'KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDMpIOC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLnB1cmNoYXNlcyA9IHsKICBsb2FkOiBmdW5jdGlvbigpewogICAgcmV0dXJuIFByb21pc2UuYWxsKFsKICAgICAgY2FsbEFwaSgncHVyY2hhc2Uuc3VtbWFyeScsIHsgeWVhcjogUy55ZWFyIH0p',
  'LAogICAgICBjYWxsQXBpKCdwdXJjaGFzZS5saXN0JywgeyB5ZWFyOiBTLnllYXIsIGNhdGVnb3J5OiBTLnBhcmFtcy5jYXRlZ29yeSB8fCAnJywgcTogUy5wYXJhbXMucSB8fCAnJyB9KQogICAgXSkudGhlbihmdW5jdGlvbihyKXsgdmFyIGQgPSByWzBdOyBkLml0',
  'ZW1zID0gclsxXTsgcmV0dXJuIGQ7IH0pOwogIH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgaGVhZCA9ICc8',
  'ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICBrcGkoJ+C4ouC4reC4lOC4i+C4t+C5ieC4rSAnICsgeWVhckxhYmVsLCBiYWh0KGQueWVhclRvdGFsKSwgZC55ZWFyQ291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4oycsICdhY2NlbnQnKSArCiAgICAg',
  'IGtwaSgn4Lii4Lit4LiU4Liq4Liw4Liq4Lih4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJywgYmFodChkLmdyYW5kVG90YWwpLCBkLmdyYW5kQ291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4oycpICsKICAgICAga3BpKCfguK3guKLguLnguYjguYPguJnguJvguKPguLDg',
  'uIHguLHguJknLCBkLndhcnJhbnR5LmFjdGl2ZSArICcg4Lij4Liy4Lii4LiB4Liy4LijJywgJ+C5g+C4geC4peC5ieC4q+C4oeC4lCAnICsgZC53YXJyYW50eS5leHBpcmluZywgZC53YXJyYW50eS5leHBpcmluZyA/ICd3YXJuJyA6ICdnb29kJykgKwogICAgICBr',
  'cGkoJ+C4q+C4oeC4p+C4lOC4l+C4teC5iOC5g+C4iuC5ieC4iOC5iOC4suC4ouC4quC4ueC4h+C4quC4uOC4lCcsIGQuYnlDYXRlZ29yeVswXSA/IGQuYnlDYXRlZ29yeVswXS5jYXRlZ29yeSA6ICfigJMnLAogICAgICAgICAgZC5ieUNhdGVnb3J5WzBdID8gYmFo',
  'dChkLmJ5Q2F0ZWdvcnlbMF0udG90YWwpIDogJycpICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciBjaGFydHMgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnMiBtYjEyIj4nICsKICAgICAgY2FyZCgn8J+TiiDguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguYHguKLg',
  'uIHguJXguLLguKHguKvguKHguKfguJTguKvguKHguLnguYggwrcgJyArIHllYXJMYWJlbCwKICAgICAgICBiYXJDaGFydChkLmJ5Q2F0ZWdvcnksICdjYXRlZ29yeScsICd0b3RhbCcsIGZ1bmN0aW9uKGkpeyByZXR1cm4gbW9uZXkoaS50b3RhbCkgKyAnIOC4vyc7',
  'IH0pKSArCiAgICAgIGNhcmQoJ/Cfk4Ug4Lii4Lit4LiU4LiL4Li34LmJ4Lit4LmB4Lii4LiB4LiV4Liy4Lih4Lib4Li1JywKICAgICAgICBiYXJDaGFydChkLmJ5WWVhci5tYXAoZnVuY3Rpb24oeSl7IHJldHVybiB7IGxhYmVsOiAn4Lib4Li1ICcgKyB5LnllYXIg',
  'KyAnICgnICsgeS5jb3VudCArICcpJywgdG90YWw6IHkudG90YWwsIHllYXI6IHkueWVhciB9OyB9KSwKICAgICAgICAgICAgICAgICAnbGFiZWwnLCAndG90YWwnLCBmdW5jdGlvbihpKXsgcmV0dXJuIG1vbmV5KGkudG90YWwpICsgJyDguL8nOyB9KSkgKwogICAg',
  'JzwvZGl2Pic7CgogICAgdmFyIGNhdHMgPSAnPGRpdiBjbGFzcz0iY2hpcHMgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJjaGlwICcgKyAoIVMucGFyYW1zLmNhdGVnb3J5Pydvbic6JycpICsgJyIgb25jbGljaz0ic2V0UGFyYW0oXCdjYXRlZ29yeVwn',
  'LFwnXCcpIj7guJfguLjguIHguKvguKHguKfguJQ8L2J1dHRvbj4nICsKICAgICAgZC5ieUNhdGVnb3J5Lm1hcChmdW5jdGlvbihjKXsKICAgICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9ImNoaXAgJyArIChTLnBhcmFtcy5jYXRlZ29yeT09PWMuY2F0ZWdvcnk/',
  'J29uJzonJykgKyAnIiAnICsKICAgICAgICAgICAgICAgJ29uY2xpY2s9InNldFBhcmFtKFwnY2F0ZWdvcnlcJyxcJycgKyBlc2MoYy5jYXRlZ29yeSkgKyAnXCcpIj4nICsgZXNjKGMuY2F0ZWdvcnkpICsgJyAoJyArIGMuY291bnQgKyAnKTwvYnV0dG9uPic7CiAg',
  'ICAgIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7CgogICAgdmFyIHJvd3MgPSBkLml0ZW1zOwogICAgdmFyIHRhYmxlID0gY2FyZCgn8J+bkiDguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcgwrcgJyArIHllYXJMYWJlbCArICcgKCcgKyByb3dz',
  'Lmxlbmd0aCArICcpJywKICAgICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDo5ODBweCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoIHN0eWxlPSJ3aWR0aDo5NnB4Ij7guKfguLHguJng',
  'uJfguLXguYjguIvguLfguYnguK08L3RoPjx0aD7guKPguLLguKLguIHguLLguKPguKrguLTguJnguITguYnguLI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guIjguLPguJnguKfguJk8L3RoPicgKwogICAgICAgICc8dGggY2xhc3M9Im51bSI+4Lij4Liy4LiE4LiyPC90',
  'aD48dGg+4LmB4Lir4Lil4LmI4LiH4LiX4Li14LmI4LiL4Li34LmJ4LitPC90aD48dGg+4Lib4Lij4Liw4LiB4Lix4LiZPC90aD48dGg+4Lig4Liy4LiePC90aD48dGg+4Liq4Lil4Li04LibPC90aD48dGg+PC90aD4nICsKICAgICAgICAnPC90cj48L3RoZWFkPjx0',
  'Ym9keT4nICsKICAgICAgICByb3dzLm1hcChmdW5jdGlvbihwKXsKICAgICAgICAgIHZhciB3ID0gcC53YXJyYW50eSB8fCB7fTsKICAgICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZShw',
  'LmJ1eURhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0iY2xpcCIgdGl0bGU9IicgKyBlc2MocC5pdGVtKSArICciPjxiPicgKyBlc2MocC5pdGVtKSArICc8L2I+PC9kaXY+JyArCiAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImZz',
  'MTIgZmFpbnQiPicgKyBlc2MocC5jYXRlZ29yeSB8fCAnJykgKyAocC5yb29tID8gJyDCtyDguKvguYnguK3guIcgJyArIGVzYyhwLnJvb20pIDogJycpICsgJzwvZGl2PjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIG51bShwLnF0eSkg',
  'KyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj48Yj4nICsgbW9uZXkocC5wcmljZSkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MocC52ZW5kb3IgfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAg',
  'ICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyAody5oYXMKICAgICAgICAgICAgICAgID8gc3RhdHVzQmFkZ2Uody5zdGF0ZSkgKyAnPGRpdiBjbGFzcz0iZmFpbnQiIHN0eWxlPSJmb250LXNpemU6MTFweCI+JyArIHRoRGF0ZVNob3J0KHcuZW5kKSArICc8',
  'L2Rpdj4nCiAgICAgICAgICAgICAgICA6ICc8c3BhbiBjbGFzcz0iZmFpbnQiPuKAkzwvc3Bhbj4nKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHAucGhvdG9SZWZzKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0',
  'aHVtYnNIdG1sKHAuc2xpcFJlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24iIG9uY2xpY2s9XCdmb3JtUHVyY2hhc2UoJyArIGF0',
  'dHIocCkgKyAnKVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiBkZ3IiIG9uY2xpY2s9ImRlbFB1cmNoYXNlKFwnJyArIHAuaWQgKyAnXCcpIj7wn5eRPC9idXR0b24+JyArCiAgICAgICAgICAgICc8',
  'L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6IGVtcHR5Qm94KCfguKLguLHguIfguYTguKHguYjguKHguLXguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guYPguJknICsgeWVh',
  'ckxhYmVsLCAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZm9ybVB1cmNoYXNlKG51bGwpIj4rIOC5gOC4nuC4tOC5iOC4oeC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4rTwvYnV0dG9uPicpLAogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHBy',
  'aSBzbSIgb25jbGljaz0iZm9ybVB1cmNoYXNlKG51bGwpIj4rIOC5gOC4nuC4tOC5iOC4oeC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4rTwvYnV0dG9uPicsIHRydWUpOwoKICAgIHJldHVybiBoZWFkICsgY2hhcnRzICsgY2F0cyArIHRhYmxlOwogIH0KfTsK',
  'CmZ1bmN0aW9uIHNldFBhcmFtKGtleSwgdmFsKXsKICBTLnBhcmFtc1trZXldID0gdmFsOwogIGxvYWQoKTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDQpIOC4peC5ieC4suC4h+C5',
  'geC4reC4o+C5jAogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLmFjID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7IHJldHVybiBjYWxsQXBpKCdhYy5tYXRyaXgnLCB7IHllYXI6IFMu',
  'eWVhciB9KTsgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKICAgIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQg',
  'bWIxMiI+JyArCiAgICAgIGtwaSgn4Lil4LmJ4Liy4LiH4LmB4Lil4LmJ4LinICcgKyB5ZWFyTGFiZWwsIGQucm9vbXNEb25lSW5ZZWFyICsgJy8nICsgZC5yb29tcy5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsIGQuZG9uZUluWWVhciArICcg4Lij4Lit4Lia4LiX',
  '4Lix4LmJ4LiH4Lir4Lih4LiUJywgJ2FjY2VudCcpICsKICAgICAga3BpKCfguKLguLHguIfguYTguKHguYjguYTguJTguYnguKXguYnguLLguIcnLCBkLnJvb21zUGVuZGluZy5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsIGQucm9vbXNQZW5kaW5nLnNsaWNlKDAs',
  'OCkuam9pbignLCAnKSArIChkLnJvb21zUGVuZGluZy5sZW5ndGg+OD8n4oCmJzonJyksIGQucm9vbXNQZW5kaW5nLmxlbmd0aCA/ICd3YXJuJzonZ29vZCcpICsKICAgICAga3BpKCfguJbguLbguIfguIHguLPguKvguJnguJTguKXguYnguLLguIcnLCBkLm92ZXJk',
  'dWUubGVuZ3RoICsgJyDguKvguYnguK3guIcnLCAn4Lij4Lit4Lia4Lil4LmJ4Liy4LiH4LiX4Li44LiBICcgKyBkLmN5Y2xlTW9udGhzICsgJyDguYDguJTguLfguK3guJknLCBkLm92ZXJkdWUubGVuZ3RoID8gJ2JhZCc6J2dvb2QnKSArCiAgICAgIGtwaSgn4LiE',
  '4Lin4Liy4Lih4LiE4Li34Lia4Lir4LiZ4LmJ4LiyJywgcGN0KGQucm9vbXMubGVuZ3RoID8gZC5yb29tc0RvbmVJblllYXIvZC5yb29tcy5sZW5ndGgqMTAwIDogMCksICfguILguK3guIfguJfguLHguYnguIfguKvguKHguJQgJyArIGQucm9vbXMubGVuZ3RoICsg',
  'JyDguKvguYnguK3guIcnKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgYWN0aW9ucyA9ICc8ZGl2IGNsYXNzPSJyb3cgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtQWMobnVsbCkiPisg4Lia4Lix4LiZ4LiX4Li2',
  '4LiB4LiB4Liy4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImZvcm1CdWxrQWMoKSI+8J+ThSDguJnguLHguJTguKXguYnguLLguIfguKvguKXguLLguKLguKvguYnguK3guIfg',
  'uJ7guKPguYnguK3guKHguIHguLHguJk8L2J1dHRvbj4nICsKICAgICAgJzxzcGFuIGNsYXNzPSJzcCI+PC9zcGFuPicgKwogICAgICAnPHNwYW4gY2xhc3M9ImZzMTIgbXV0ZWQiPuC4hOC4peC4tOC4geC4l+C4teC5iOC4q+C5ieC4reC4h+C5gOC4nuC4t+C5iOC4',
  'reC4lOC4uS/guYDguJ7guLTguYjguKHguKPguK3guJrguIHguLLguKPguKXguYnguLLguIc8L3NwYW4+JyArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgZ3JpZCA9IGNhcmQoJ+KdhO+4jyDguJXguLLguKPguLLguIfguKXguYnguLLguIfguYHguK3guKPguYzguKPg',
  'uLLguKLguKvguYnguK3guIcgwrcgJyArIHllYXJMYWJlbCwgcm9vbUZsb29ycyhkLnJvb21zLCBmdW5jdGlvbihyKXsKICAgICAgdmFyIGNscyA9IHIucm91bmRzSW5ZZWFyID4gMCA/ICdzLW9rJyA6IChyLnN0YXRlID09PSAn4LmA4LiB4Li04LiZ4LiB4Liz4Lir',
  '4LiZ4LiUJyA/ICdzLWRncicgOiAoci5zdGF0ZSA9PT0gJ+C4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4peC5ieC4suC4hycgPyAncy13YXJuJyA6ICdzLWluZm8nKSk7CiAgICAgIHZhciBzdWIgPSByLnJvdW5kc0luWWVhciA+IDAKICAgICAgICA/ICc8Yj4n',
  'ICsgci5yb3VuZHNJblllYXIgKyAnIOC4o+C4reC4mjwvYj48YnI+JyArIHRoRGF0ZVNob3J0KHIucmVjb3Jkcy5maWx0ZXIoZnVuY3Rpb24oeCl7cmV0dXJuIHguc2VydmljZURhdGU7fSkubWFwKGZ1bmN0aW9uKHgpe3JldHVybiB4LnNlcnZpY2VEYXRlO30pLnNv',
  'cnQoKS5wb3AoKSkKICAgICAgICA6IChyLmJvb2tlZEluWWVhciA/ICfguJnguLHguJTguYHguKXguYnguKcgJyArIHIuYm9va2VkSW5ZZWFyIDogKHIubGFzdFNlcnZpY2UgPyAn4Lil4LmI4Liy4Liq4Li44LiUICcgKyB0aERhdGVTaG9ydChyLmxhc3RTZXJ2aWNl',
  'KSA6ICfguYTguKHguYjguKHguLXguJvguKPguLDguKfguLHguJXguLQnKSk7CiAgICAgIHJldHVybiB7IGNsczogY2xzLCBzdWI6IHN1Yiwgb25jbGljazogJ29wZW5BY1Jvb20oXCcnICsgci5yb29tICsgJ1wnKScgfTsKICAgIH0pLCAnJywgZmFsc2UpOwoKICAg',
  'IHZhciBsaXN0Um93cyA9IFtdOwogICAgZC5yb29tcy5mb3JFYWNoKGZ1bmN0aW9uKHIpeyByLnJlY29yZHMuZm9yRWFjaChmdW5jdGlvbih4KXsgeC5fcm9vbSA9IHIucm9vbTsgbGlzdFJvd3MucHVzaCh4KTsgfSk7IH0pOwogICAgbGlzdFJvd3Muc29ydChmdW5j',
  'dGlvbihhLGIpeyByZXR1cm4gU3RyaW5nKGIuc2VydmljZURhdGV8fGIuYm9va0RhdGV8fCcnKS5sb2NhbGVDb21wYXJlKFN0cmluZyhhLnNlcnZpY2VEYXRlfHxhLmJvb2tEYXRlfHwnJykpOyB9KTsKCiAgICB2YXIgbGlzdCA9IGNhcmQoJ/Cfk4sg4Lib4Lij4Liw',
  '4Lin4Lix4LiV4Li04LiB4Liy4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMIMK3ICcgKyB5ZWFyTGFiZWwgKyAnICgnICsgbGlzdFJvd3MubGVuZ3RoICsgJyknLAogICAgICBsaXN0Um93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0i',
  'dCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC4q+C5ieC4reC4hzwvdGg+PHRoPuC4o+C4reC4muC4l+C4teC5iDwvdGg+PHRoPuC4p+C4seC4meC4l+C4teC5iOC4meC4seC4lDwvdGg+PHRoPuC4p+C4seC4meC4l+C4teC5iOC4lOC4s+C5gOC4meC4tOC4',
  'meC4geC4suC4ozwvdGg+PHRoPuC4quC4luC4suC4meC4sDwvdGg+JyArCiAgICAgICAgJzx0aD7guIrguYjguLLguIc8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguYjguLLguYPguIrguYnguIjguYjguLLguKI8L3RoPjx0aD7guKDguLLguJ48L3RoPjx0aD7guKvg',
  'uKHguLLguKLguYDguKvguJXguLg8L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgbGlzdFJvd3MubWFwKGZ1bmN0aW9uKHgpewogICAgICAgICAgcmV0dXJuICc8dHI+JyArCiAgICAgICAgICAgICc8dGQ+PGI+JyArIGVzYyh4LnJv',
  'b20pICsgJzwvYj48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAoeC5yb3VuZCB8fCAxKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LmJvb2tEYXRlKSArICc8L3RkPicg',
  'KwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LnNlcnZpY2VEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyBzdGF0dXNCYWRnZSh4LnN0YXR1cykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBj',
  'bGFzcz0iZnMxMiI+JyArIGVzYyh4LnRlY2huaWNpYW4gfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIG51bSh4LmNvc3QpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwoeC5waG90',
  'b1JlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIgbXV0ZWQgY2xpcCI+JyArIGVzYyh4Lm5vdGUgfHwgJycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsKICAgICAgICAgICAg',
  'ICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24iIG9uY2xpY2s9XCdmb3JtQWMoJyArIGF0dHIoeCkgKyAnKVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiBkZ3IiIG9uY2xpY2s9ImRlbEFjKFwn',
  'JyArIHguaWQgKyAnXCcpIj7wn5eRPC9idXR0b24+JyArCiAgICAgICAgICAgICc8L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6IGVtcHR5Qm94KCfguKLguLHguIfguYTguKHguYjg',
  'uKHguLXguJrguLHguJnguJfguLbguIHguIHguLLguKPguKXguYnguLLguIfguYHguK3guKPguYzguYPguJknICsgeWVhckxhYmVsKSwgJycsIHRydWUpOwoKICAgIHJldHVybiBoZWFkICsgYWN0aW9ucyArIGdyaWQgKyAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIGxp',
  'c3QgKyAnPC9kaXY+JzsKICB9Cn07CgpmdW5jdGlvbiBvcGVuQWNSb29tKHJvb20pewogIHZhciBkID0gUy5jYWNoZS5hYzsKICB2YXIgciA9IGQucm9vbXMuZmlsdGVyKGZ1bmN0aW9uKHgpeyByZXR1cm4geC5yb29tID09PSByb29tOyB9KVswXTsKICB2YXIgYm9k',
  'eSA9CiAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMyBtYjEyIj4nICsKICAgICAga3BpKCfguKPguK3guJrguJfguLXguYjguKXguYnguLLguIfguYPguJnguJvguLXguJnguLXguYknLCAoci5yb3VuZHNJblllYXJ8fDApICsgJyDguKPguK3guJonLCAnJykgKwogICAg',
  'ICBrcGkoJ+C4peC5ieC4suC4h+C4peC5iOC4suC4quC4uOC4lCcsIHIubGFzdFNlcnZpY2UgPyB0aERhdGUoci5sYXN0U2VydmljZSkgOiAn4oCTJywgci5sYXN0U2VydmljZSA/IChkYXlzQWdvKHIubGFzdFNlcnZpY2UpICsgJyDguKfguLHguJnguJfguLXguYjg',
  'uYHguKXguYnguKcnKSA6ICcnKSArCiAgICAgIGtwaSgn4LiE4Lij4Lia4LiB4Liz4Lir4LiZ4LiU4Lij4Lit4Lia4LiW4Lix4LiU4LmE4LibJywgci5uZXh0RHVlID8gdGhEYXRlKHIubmV4dER1ZSkgOiAn4oCTJywgci5zdGF0ZSwgci5zdGF0ZSA9PT0gJ+C5gOC4',
  'geC4tOC4meC4geC4s+C4q+C4meC4lCcgPyAnYmFkJyA6ICcnKSArCiAgICAnPC9kaXY+JyArCiAgICAoci5yZWNvcmRzLmxlbmd0aAogICAgICA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOmF1dG8iPjx0aGVhZD48',
  'dHI+PHRoPuC4o+C4reC4mjwvdGg+PHRoPuC4meC4seC4lDwvdGg+PHRoPuC4lOC4s+C5gOC4meC4tOC4meC4geC4suC4ozwvdGg+PHRoPuC4quC4luC4suC4meC4sDwvdGg+PHRoPuC4oOC4suC4njwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsK',
  'ICAgICAgICByLnJlY29yZHMubWFwKGZ1bmN0aW9uKHgpewogICAgICAgICAgcmV0dXJuICc8dHI+PHRkPicgKyAoeC5yb3VuZHx8MSkgKyAnPC90ZD48dGQgY2xhc3M9ImZzMTIiPicgKyB0aERhdGUoeC5ib29rRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAg',
  'Jzx0ZCBjbGFzcz0iZnMxMiI+JyArIHRoRGF0ZSh4LnNlcnZpY2VEYXRlKSArICc8L3RkPjx0ZD4nICsgc3RhdHVzQmFkZ2UoeC5zdGF0dXMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwoeC5waG90b1JlZnMpICsgJzwvdGQ+JyAr',
  'CiAgICAgICAgICAgICc8dGQ+PGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPVwnY2xvc2VNb2RhbCgpO2Zvcm1BYygnICsgYXR0cih4KSArICcpXCc+4LmB4LiB4LmJ4LmE4LiCPC9idXR0b24+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAn',
  'PC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4muC4seC4meC4l+C4tuC4geC5g+C4meC4m+C4teC4l+C4teC5iOC5gOC4peC4t+C4reC4gTwvZGl2PicpOwoKICBvcGVuTW9k',
  'YWwoJ+KdhO+4jyDguKXguYnguLLguIfguYHguK3guKPguYwgwrcg4Lir4LmJ4Lit4LiHICcgKyByb29tLCBib2R5LAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guJvguLTguJQ8L2J1dHRvbj4nICsKICAgICc8YnV0dG9u',
  'IGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCk7Zm9ybUFjKHtyb29tOlwnJyArIHJvb20gKyAnXCd9KSI+KyDguYDguJ7guLTguYjguKHguKPguK3guJrguIHguLLguKPguKXguYnguLLguIc8L2J1dHRvbj4nKTsKfQoKLyogPT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDUpIOC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4suC4oeC4q+C5ieC4reC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT0gKi8KUk9VVEVTLnJlcGFpcnMgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsgcmV0dXJuIGNhbGxBcGkoJ3JlcGFpci5tYXRyaXgnLCB7IHllYXI6IFMueWVhciB9KTsgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9',
  'IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKICAgIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgIGtwaSgn4LiH4Liy4LiZ4LiL4LmI4Lit4LihICcgKyB5ZWFyTGFi',
  'ZWwsIGQudG90YWxKb2JzICsgJyDguIfguLLguJknLCAn4LiI4Liy4LiBICcgKyBkLnJvb21zLmZpbHRlcihmdW5jdGlvbihyKXtyZXR1cm4gci5jb3VudD4wO30pLmxlbmd0aCArICcg4Lir4LmJ4Lit4LiHJywgJ2FjY2VudCcpICsKICAgICAga3BpKCfguIfguLLg',
  'uJnguJfguLXguYjguKLguLHguIfguYTguKHguYjguYDguKrguKPguYfguIgnLCBkLm9wZW5Kb2JzICsgJyDguIfguLLguJknLCAnJywgZC5vcGVuSm9icyA/ICd3YXJuJyA6ICdnb29kJykgKwogICAgICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4',
  'ouC4o+C4p+C4oScsIGJhaHQoZC50b3RhbENvc3QpLCB5ZWFyTGFiZWwpICsKICAgICAga3BpKCfguKvguYnguK3guIfguJfguLXguYjguKLguLHguIfguYTguKHguYjguYDguITguKLguIvguYjguK3guKEnLCBkLnJvb21zLmZpbHRlcihmdW5jdGlvbihyKXtyZXR1',
  'cm4gci5jb3VudD09PTA7fSkubGVuZ3RoICsgJyDguKvguYnguK3guIcnLCAn4LmD4LiZJyArIHllYXJMYWJlbCkgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIGFjdGlvbnMgPSAnPGRpdiBjbGFzcz0icm93IG1iMTIiPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0i',
  'YnRuIHByaSIgb25jbGljaz0iZm9ybVJlcGFpcihudWxsKSI+KyDguYHguIjguYnguIfguIvguYjguK3guKEgLyDguJrguLHguJnguJfguLbguIHguIfguLLguJnguIvguYjguK3guKE8L2J1dHRvbj4nICsKICAgICAgJzxzcGFuIGNsYXNzPSJzcCI+PC9zcGFuPjxz',
  'cGFuIGNsYXNzPSJmczEyIG11dGVkIj7guITguKXguLTguIHguJfguLXguYjguKvguYnguK3guIfguYDguJ7guLfguYjguK3guJTguLnguJvguKPguLDguKfguLHguJXguLTguIfguLLguJnguIvguYjguK3guKHguILguK3guIfguKvguYnguK3guIfguJnguLHguYng',
  'uJk8L3NwYW4+PC9kaXY+JzsKCiAgICB2YXIgZ3JpZCA9IGNhcmQoJ/CflKcg4Lig4Liy4Lie4Lij4Lin4Lih4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4Lij4Liy4Lii4Lir4LmJ4Lit4LiHIMK3ICcgKyB5ZWFyTGFiZWwsIHJvb21GbG9vcnMoZC5yb29tcywgZnVuY3Rp',
  'b24ocil7CiAgICAgIHZhciBjbHMgPSByLm9wZW5Db3VudCA+IDAgPyAncy1kZ3InIDogKHIuY291bnQgPiAwID8gJ3Mtb2snIDogJ3MtaW5mbycpOwogICAgICB2YXIgc3ViID0gci5jb3VudCA+IDAKICAgICAgICA/ICc8Yj4nICsgci5jb3VudCArICcg4LiH4Liy',
  '4LiZPC9iPicgKyAoci5vcGVuQ291bnQgPyAnIMK3IOC4hOC5ieC4suC4hyAnICsgci5vcGVuQ291bnQgOiAnJykgKyAnPGJyPicgKyAoci5sYXN0ID8gdGhEYXRlU2hvcnQoci5sYXN0KSA6ICcnKQogICAgICAgIDogJ+C5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4',
  'i+C5iOC4reC4oSc7CiAgICAgIHJldHVybiB7IGNsczogY2xzLCBzdWI6IHN1Yiwgb25jbGljazogJ29wZW5SZXBhaXJSb29tKFwnJyArIHIucm9vbSArICdcJyknIH07CiAgICB9KSk7CgogICAgdmFyIHJvd3MgPSBbXTsKICAgIGQucm9vbXMuZm9yRWFjaChmdW5j',
  'dGlvbihyKXsgci5yZWNvcmRzLmZvckVhY2goZnVuY3Rpb24oeCl7IHJvd3MucHVzaCh4KTsgfSk7IH0pOwogICAgcm93cy5zb3J0KGZ1bmN0aW9uKGEsYil7IHJldHVybiBTdHJpbmcoYi5yZXBhaXJEYXRlfHxiLmJvb2tEYXRlfHwnJykubG9jYWxlQ29tcGFyZShT',
  'dHJpbmcoYS5yZXBhaXJEYXRlfHxhLmJvb2tEYXRlfHwnJykpOyB9KTsKCiAgICB2YXIgbGlzdCA9IGNhcmQoJ/Cfk4sg4Lij4Liy4Lii4LiB4Liy4Lij4LiH4Liy4LiZ4LiL4LmI4Lit4LihIMK3ICcgKyB5ZWFyTGFiZWwgKyAnICgnICsgcm93cy5sZW5ndGggKyAn',
  'KScsCiAgICAgIHJvd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiIHN0eWxlPSJtaW4td2lkdGg6MTAyMHB4Ij48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4Lir4LmJ4Lit4LiHPC90aD48dGg+4Lin4Lix4LiZ4LiZ4Lix4LiU',
  '4LiL4LmI4Lit4LihPC90aD48dGg+4Lin4Lix4LiZ4LmA4LiC4LmJ4Liy4LiL4LmI4Lit4LihPC90aD48dGg+4Lib4Lij4Liw4LmA4Lig4LiXPC90aD48dGg+4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4LiL4LmI4Lit4Lih4LmB4LiL4LihPC90aD4nICsKICAg',
  'ICAgICAnPHRoPuC4quC4luC4suC4meC4sDwvdGg+PHRoIGNsYXNzPSJudW0iPuC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ojwvdGg+PHRoPuC4geC5iOC4reC4mTwvdGg+PHRoPuC4q+C4peC4seC4hzwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9k',
  'eT4nICsKICAgICAgICByb3dzLm1hcChmdW5jdGlvbih4KXsKICAgICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgICAnPHRkPjxiPicgKyBlc2MoeC5yb29tKSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIi',
  'PicgKyB0aERhdGUoeC5ib29rRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyB0aERhdGUoeC5yZXBhaXJEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKHgu',
  'Y2F0ZWdvcnkgfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTMiPjxkaXYgY2xhc3M9ImNsaXAiPicgKyBlc2MoeC5pdGVtcyB8fCAnJykgKyAnPC9kaXY+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgc3RhdHVzQmFk',
  'Z2UoeC5zdGF0dXMpICsgKHgucHJpb3JpdHkgJiYgeC5wcmlvcml0eSAhPT0gJ+C4m+C4geC4leC4tCcgPyAnICcgKyBzdGF0dXNCYWRnZSh4LnByaW9yaXR5KSA6ICcnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyBudW0oeC5j',
  'b3N0KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHguYmVmb3JlUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCh4LmFmdGVyUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48',
  'ZGl2IGNsYXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1SZXBhaXIoJyArIGF0dHIoeCkgKyAnKVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAgICAgICAgICAgICc8YnV0dG9u',
  'IGNsYXNzPSJidG4gc20gaWNvbiBkZ3IiIG9uY2xpY2s9ImRlbFJlcGFpcihcJycgKyB4LmlkICsgJ1wnKSI+8J+XkTwvYnV0dG9uPicgKwogICAgICAgICAgICAnPC9kaXY+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxl',
  'PjwvZGl2PicKICAgICAgOiBlbXB0eUJveCgn4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LmD4LiZJyArIHllYXJMYWJlbCwgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZvcm1SZXBhaXIobnVsbCkiPisg4LmB',
  '4LiI4LmJ4LiH4LiL4LmI4Lit4LihPC9idXR0b24+JyksICcnLCB0cnVlKTsKCiAgICByZXR1cm4gaGVhZCArIGFjdGlvbnMgKyBncmlkICsgJzxkaXYgY2xhc3M9Im10MTIiPicgKyBsaXN0ICsgJzwvZGl2Pic7CiAgfQp9OwoKZnVuY3Rpb24gb3BlblJlcGFpclJv',
  'b20ocm9vbSl7CiAgdmFyIGQgPSBTLmNhY2hlLnJlcGFpcnM7CiAgdmFyIHIgPSBkLnJvb21zLmZpbHRlcihmdW5jdGlvbih4KXsgcmV0dXJuIHgucm9vbSA9PT0gcm9vbTsgfSlbMF07CiAgdmFyIGJvZHkgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnMyBtYjEyIj4nICsK',
  'ICAgICAga3BpKCfguIfguLLguJnguJfguLHguYnguIfguKvguKHguJQnLCByLmNvdW50ICsgJyDguIfguLLguJknLCAnJykgKwogICAgICBrcGkoJ+C4ouC4seC4h+C5hOC4oeC5iOC5gOC4quC4o+C5h+C4iCcsIHIub3BlbkNvdW50ICsgJyDguIfguLLguJknLCAn',
  'Jywgci5vcGVuQ291bnQgPyAnd2Fybic6J2dvb2QnKSArCiAgICAgIGtwaSgn4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiJywgYmFodChyLmNvc3QpLCAnJykgKwogICAgJzwvZGl2PicgKwogICAgKHIucmVjb3Jkcy5sZW5ndGggPyAnPGRpdiBjbGFzcz0i',
  'dGwiPicgKyByLnJlY29yZHMubWFwKGZ1bmN0aW9uKHgpewogICAgICByZXR1cm4gJzxkaXYgY2xhc3M9InRsLWkiPjxkaXYgY2xhc3M9ImQiPicgKyB0aERhdGUoeC5yZXBhaXJEYXRlIHx8IHguYm9va0RhdGUpICsgJyDCtyAnICsgZXNjKHguY2F0ZWdvcnl8fCcn',
  'KSArICcgJyArIHN0YXR1c0JhZGdlKHguc3RhdHVzKSArICc8L2Rpdj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0idCI+JyArIGVzYyh4Lml0ZW1zIHx8ICcnKSArICc8L2Rpdj4nICsKICAgICAgICAoeC50ZWNobmljaWFuID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0',
  'ZWQiPuC4iuC5iOC4suC4hzogJyArIGVzYyh4LnRlY2huaWNpYW4pICsgJzwvZGl2PicgOiAnJykgKwogICAgICAgICh4LmNvc3QgPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCI+4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiICcgKyBiYWh0KHguY29zdCkg',
  'KyAnPC9kaXY+JyA6ICcnKSArCiAgICAgICAgJzxkaXYgY2xhc3M9Im10OCI+JyArIHRodW1ic0h0bWwoKHguYmVmb3JlUmVmc3x8W10pLmNvbmNhdCh4LmFmdGVyUmVmc3x8W10pKSArICc8L2Rpdj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0ibXQ4Ij48YnV0dG9u',
  'IGNsYXNzPSJidG4gc20iIG9uY2xpY2s9XCdjbG9zZU1vZGFsKCk7Zm9ybVJlcGFpcignICsgYXR0cih4KSArICcpXCc+4LmB4LiB4LmJ4LmE4LiCPC9idXR0b24+PC9kaXY+JyArCiAgICAgICc8L2Rpdj4nOwogICAgfSkuam9pbignJykgKyAnPC9kaXY+JyA6ICc8',
  'ZGl2IGNsYXNzPSJlbXB0eSI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LmD4LiZ4Lib4Li14LiX4Li14LmI4LmA4Lil4Li34Lit4LiBPC9kaXY+Jyk7CgogIG9wZW5Nb2RhbCgn8J+UpyDguIfguLLguJnguIvguYjguK3guKEg',
  'wrcg4Lir4LmJ4Lit4LiHICcgKyByb29tLCBib2R5LAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guJvguLTguJQ8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJjbG9zZU1vZGFs',
  'KCk7Zm9ybVJlcGFpcih7cm9vbTpcJycgKyByb29tICsgJ1wnfSkiPisg4LmA4Lie4Li04LmI4Lih4LiH4Liy4LiZ4LiL4LmI4Lit4LihPC9idXR0b24+JywgdHJ1ZSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PQogICA2KSDguIvguYjguK3guKHguYHguIvguKHguJXguLbguIHguYLguJTguKLguKPguKfguKEKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5idWlsZGlu',
  'ZyA9IHsKICBsb2FkOiBmdW5jdGlvbigpewogICAgcmV0dXJuIFByb21pc2UuYWxsKFsKICAgICAgY2FsbEFwaSgnYnVpbGRpbmcuc3VtbWFyeScsIHsgeWVhcjogUy55ZWFyIH0pLAogICAgICBjYWxsQXBpKCdidWlsZGluZy5saXN0JywgeyB5ZWFyOiBTLnllYXIs',
  'IHpvbmU6IFMucGFyYW1zLnpvbmUgfHwgJycsIHN0YXR1czogJycgfSkKICAgIF0pLnRoZW4oZnVuY3Rpb24ocil7IHZhciBkID0gclswXTsgZC5pdGVtcyA9IHJbMV07IHJldHVybiBkOyB9KTsKICB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgeWVh',
  'ckxhYmVsID0gUy55ZWFyID09PSAnYWxsJyA/ICfguJfguLjguIHguJvguLUnIDogJ+C4m+C4tSAnICsgUy55ZWFyOwogICAgdmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAga3BpKCfguIfguLLguJnguJvguLUgJyArIChTLnll',
  'YXI9PT0nYWxsJz8n4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJzpTLnllYXIpLCBkLnllYXJDb3VudCArICcg4LiH4Liy4LiZJywgJ+C4quC4sOC4quC4oSAnICsgZC50b3RhbCArICcg4LiH4Liy4LiZJywgJ2FjY2VudCcpICsKICAgICAga3BpKCfguITguYjguLLguYPg',
  'uIrguYnguIjguYjguLLguKIgJyArIHllYXJMYWJlbCwgYmFodChkLnllYXJDb3N0KSwgJ+C4quC4sOC4quC4oSAnICsgYmFodChkLmdyYW5kQ29zdCkpICsKICAgICAga3BpKCfguIfguLLguJnguJfguLXguYjguKLguLHguIfguYTguKHguYjguYDguKrguKPguYfg',
  'uIgnLCBkLm9wZW5Db3VudCArICcg4LiH4Liy4LiZJywgJycsIGQub3BlbkNvdW50ID8gJ3dhcm4nIDogJ2dvb2QnKSArCiAgICAgIGtwaSgn4LiE4Lij4Lia4LiB4Liz4Lir4LiZ4LiU4LmD4LiZIDkwIOC4p+C4seC4mScsIGQudXBjb21pbmcubGVuZ3RoICsgJyDg',
  'uIfguLLguJknLCBkLnVwY29taW5nLmxlbmd0aCA/IGQudXBjb21pbmdbMF0udGl0bGUgOiAnJywgZC51cGNvbWluZy5sZW5ndGggPyAnd2FybicgOiAnJykgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIHpvbmVzID0gJzxkaXYgY2xhc3M9ImNoaXBzIG1iMTIiPicg',
  'KwogICAgICAnPGJ1dHRvbiBjbGFzcz0iY2hpcCAnICsgKCFTLnBhcmFtcy56b25lPydvbic6JycpICsgJyIgb25jbGljaz0ic2V0UGFyYW0oXCd6b25lXCcsXCdcJykiPuC4l+C4uOC4geC4quC5iOC4p+C4mTwvYnV0dG9uPicgKwogICAgICBkLmJ5Wm9uZS5tYXAo',
  'ZnVuY3Rpb24oeil7CiAgICAgICAgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJjaGlwICcgKyAoUy5wYXJhbXMuem9uZT09PXouem9uZT8nb24nOicnKSArICciIG9uY2xpY2s9InNldFBhcmFtKFwnem9uZVwnLFwnJyArIGVzYyh6LnpvbmUpICsgJ1wnKSI+JyArCiAg',
  'ICAgICAgICAgICAgIGVzYyh6LnpvbmUpICsgJyAoJyArIHouY291bnQgKyAnKTwvYnV0dG9uPic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7CgogICAgdmFyIGNoYXJ0cyA9ICc8ZGl2IGNsYXNzPSJncmlkIGcyIG1iMTIiPicgKwogICAgICBjYXJkKCfw',
  'n4+X77iPIOC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC5geC4ouC4geC4leC4suC4oeC4quC5iOC4p+C4meC4guC4reC4h+C4reC4suC4hOC4suC4oycsIGJhckNoYXJ0KGQuYnlab25lLCAnem9uZScsICdjb3N0JywgZnVuY3Rpb24oaSl7IHJldHVybiBt',
  'b25leShpLmNvc3QpICsgJyDguL8nOyB9KSkgKwogICAgICBjYXJkKCfwn5OFIOC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC5geC4ouC4geC4leC4suC4oeC4m+C4tScsIGJhckNoYXJ0KAogICAgICAgIGQuYnlZZWFyLm1hcChmdW5jdGlvbih5KXsgcmV0',
  'dXJuIHsgbGFiZWw6J+C4m+C4tSAnICsgeS55ZWFyICsgJyAoJyArIHkuY291bnQgKyAnIOC4h+C4suC4mSknLCBjb3N0OnkuY29zdCB9OyB9KSwKICAgICAgICAnbGFiZWwnLCAnY29zdCcsIGZ1bmN0aW9uKGkpeyByZXR1cm4gbW9uZXkoaS5jb3N0KSArICcg4Li/',
  'JzsgfSkpICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciByb3dzID0gZC5pdGVtczsKICAgIHZhciBsaXN0ID0gY2FyZCgn8J+PoiDguKPguLLguKLguIHguLLguKPguIvguYjguK3guKHguYHguIvguKHguJXguLbguIHguYLguJTguKLguKPguKfguKEgwrcgJyArIHll',
  'YXJMYWJlbCArICcgKCcgKyByb3dzLmxlbmd0aCArICcpJywKICAgICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDoxMDIwcHgiPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guKrguYjg',
  'uKfguJnguILguK3guIfguK3guLLguITguLLguKM8L3RoPjx0aD7guKPguLLguKLguIHguLLguKM8L3RoPjx0aD7guJnguLHguJQ8L3RoPjx0aD7guYDguKPguLTguYjguKE8L3RoPjx0aD7guYDguKrguKPguYfguIg8L3RoPjx0aD7guKrguJbguLLguJnguLA8L3Ro',
  'PicgKwogICAgICAgICc8dGg+4Lic4Li54LmJ4Lij4Lix4Lia4LmA4Lir4Lih4LiyPC90aD48dGggY2xhc3M9Im51bSI+4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiPC90aD48dGg+4Lij4Lit4Lia4LiW4Lix4LiU4LmE4LibPC90aD48dGg+4Lig4Liy4Lie',
  'PC90aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIHJvd3MubWFwKGZ1bmN0aW9uKHgpewogICAgICAgICAgcmV0dXJuICc8dHI+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPjxiPicgKyBlc2MoeC56b25lIHx8ICfigJMn',
  'KSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMyI+PGRpdiBjbGFzcz0iY2xpcCI+JyArIGVzYyh4LnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgICAgICAgICAoeC5ub3RlID8gJzxkaXYgY2xhc3M9ImZzMTIgZmFpbnQgY2xpcCI+',
  'JyArIGVzYyh4Lm5vdGUpICsgJzwvZGl2PicgOiAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyB0aERhdGUoeC5ib29rRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZz',
  'MTIiPicgKyB0aERhdGUoeC5zdGFydERhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHguZW5kRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgc3RhdHVzQmFkZ2UoeC5zdGF0',
  'dXMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MoeC5jb250cmFjdG9yIHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyBudW0oeC5jb3N0KSArICc8L3RkPicgKwogICAg',
  'ICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArICh4Lm5leHREdWUgPyB0aERhdGVTaG9ydCh4Lm5leHREdWUpICsKICAgICAgICAgICAgICAgICh4LmR1ZUluRGF5cyAhPSBudWxsID8gJzxkaXYgY2xhc3M9ImZhaW50IiBzdHlsZT0iZm9udC1zaXpl',
  'OjExcHgiPicgKyAoeC5kdWVJbkRheXM8MCA/ICfguYDguKXguKIgJyArICgteC5kdWVJbkRheXMpICsgJyDguKfguLHguJknIDogJ+C4reC4teC4gSAnICsgeC5kdWVJbkRheXMgKyAnIOC4p+C4seC4mScpICsgJzwvZGl2PicgOiAnJykKICAgICAgICAgICAgICA6',
  'ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKCh4LnBob3RvUmVmc3x8W10pLmNvbmNhdCh4LnNsaXBSZWZzfHxbXSkpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsK',
  'ICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24iIG9uY2xpY2s9XCdmb3JtQnVpbGRpbmcoJyArIGF0dHIoeCkgKyAnKVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiBkZ3Ii',
  'IG9uY2xpY2s9ImRlbEJ1aWxkaW5nKFwnJyArIHguaWQgKyAnXCcpIj7wn5eRPC9idXR0b24+JyArCiAgICAgICAgICAgICc8L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6IGVtcHR5',
  'Qm94KCfguKLguLHguIfguYTguKHguYjguKHguLXguIfguLLguJnguIvguYjguK3guKHguYHguIvguKHguJXguLbguIHguYPguJknICsgeWVhckxhYmVsLCAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZm9ybUJ1aWxkaW5nKG51bGwpIj4rIOC5gOC4',
  'nuC4tOC5iOC4oeC4h+C4suC4meC4i+C5iOC4reC4oeC4leC4tuC4gTwvYnV0dG9uPicpLAogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSBzbSIgb25jbGljaz0iZm9ybUJ1aWxkaW5nKG51bGwpIj4rIOC5gOC4nuC4tOC5iOC4oeC4h+C4suC4meC4i+C5iOC4',
  'reC4oeC4leC4tuC4gTwvYnV0dG9uPicsIHRydWUpOwoKICAgIHJldHVybiBoZWFkICsgem9uZXMgKyBjaGFydHMgKyBsaXN0OwogIH0KfTsKCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICA3',
  'KSDguKvguYnguK3guIfguJ7guLHguIEKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5yb29tcyA9IHsKICBsb2FkOiBmdW5jdGlvbigpeyByZXR1cm4gY2FsbEFwaSgncm9vbS5s',
  'aXN0JykudGhlbihmdW5jdGlvbihmbG9vcnMpeyByZXR1cm4geyBmbG9vcnM6IGZsb29ycywgeWVhcnM6IFtdIH07IH0pOyB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgZmxhdCA9IFtdOwogICAgZC5mbG9vcnMuZm9yRWFjaChmdW5jdGlvbihmKXsg',
  'Zi5yb29tcy5mb3JFYWNoKGZ1bmN0aW9uKHIpeyBmbGF0LnB1c2gocik7IH0pOyB9KTsKICAgIHZhciBvY2MgPSBmbGF0LmZpbHRlcihmdW5jdGlvbihyKXsgcmV0dXJuIHIuc3RhdHVzID09PSAn4Lih4Li14Lic4Li54LmJ4LmA4LiK4LmI4LiyJzsgfSkubGVuZ3Ro',
  'OwoKICAgIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgIGtwaSgn4Lir4LmJ4Lit4LiH4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJywgZmxhdC5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsICc1IOC4iuC4seC5ieC4mScsICdhY2Nl',
  'bnQnKSArCiAgICAgIGtwaSgn4Lih4Li14Lic4Li54LmJ4LmA4LiK4LmI4LiyJywgb2NjICsgJyDguKvguYnguK3guIcnLCBwY3QoZmxhdC5sZW5ndGggPyBvY2MvZmxhdC5sZW5ndGgqMTAwIDogMCkgKyAnIOC4reC4seC4leC4o+C4suC5gOC4guC5ieC4suC4nuC4',
  'seC4gScsICdnb29kJykgKwogICAgICBrcGkoJ+C4q+C5ieC4reC4h+C4p+C5iOC4suC4hycsIGZsYXQuZmlsdGVyKGZ1bmN0aW9uKHIpeyByZXR1cm4gci5zdGF0dXMgPT09ICfguKfguYjguLLguIcnOyB9KS5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsICcnLCAn',
  'd2FybicpICsKICAgICAga3BpKCfguITguYjguLLguYDguIrguYjguLLguKPguKfguKEv4LmA4LiU4Li34Lit4LiZJywgYmFodChmbGF0LnJlZHVjZShmdW5jdGlvbihhLHIpeyByZXR1cm4gYSArIChOdW1iZXIoci5yZW50KXx8MCk7IH0sIDApKSwgJ+C4iOC4suC4',
  'geC4q+C5ieC4reC4h+C4l+C4teC5iOC4geC4o+C4reC4geC4hOC5iOC4suC5gOC4iuC5iOC4suC5hOC4p+C5iScpICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciBncmlkID0gY2FyZCgn8J+aqiDguJzguLHguIfguKvguYnguK3guIfguJ7guLHguIEnLCByb29tRmxv',
  'b3JzKGZsYXQsIGZ1bmN0aW9uKHIpewogICAgICB2YXIgY2xzID0gci5zdGF0dXMgPT09ICfguKHguLXguJzguLnguYnguYDguIrguYjguLInID8gJ3Mtb2snIDogKHIuc3RhdHVzID09PSAn4Lin4LmI4Liy4LiHJyA/ICdzLWluZm8nIDogJ3Mtd2FybicpOwogICAg',
  'ICByZXR1cm4geyBjbHM6IGNscywgc3ViOiBlc2Moci50ZW5hbnQgfHwgci5zdGF0dXMgfHwgJycpICsgKHIucmVudCA/ICc8YnI+JyArIG1vbmV5KHIucmVudCkgKyAnIOC4vycgOiAnJyksCiAgICAgICAgICAgICAgIG9uY2xpY2s6ICdvcGVuUm9vbShcJycgKyBy',
  'LnJvb20gKyAnXCcpJyB9OwogICAgfSksICc8c3BhbiBjbGFzcz0iZnMxMiBtdXRlZCI+4LiE4Lil4Li04LiB4LiX4Li14LmI4Lir4LmJ4Lit4LiH4LmA4Lie4Li34LmI4Lit4LiU4Li54Lib4Lij4Liw4Lin4Lix4LiV4Li04LiX4Lix4LmJ4LiH4Lir4Lih4LiU4LiC',
  '4Lit4LiH4Lir4LmJ4Lit4LiH4LiZ4Lix4LmJ4LiZPC9zcGFuPicpOwoKICAgIHJldHVybiBoZWFkICsgZ3JpZDsKICB9Cn07CgpmdW5jdGlvbiBvcGVuUm9vbShyb29tKXsKICBvcGVuTW9kYWwoJ/Cfmqog4Lir4LmJ4Lit4LiHICcgKyByb29tLCAnPGRpdiBjbGFz',
  'cz0iZW1wdHkiPjxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C5guC4q+C4peC4lOKApjwvZGl2PicpOwogIGNhbGxBcGkoJ3Jvb20ucHJvZmlsZScsIHsgcm9vbTogcm9vbSB9KS50aGVuKGZ1bmN0aW9uKHApewogICAgdmFyIGkgPSBw',
  'LmluZm87CiAgICB2YXIgYm9keSA9CiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICAgIGtwaSgn4Liq4LiW4Liy4LiZ4LiwJywgaS5zdGF0dXMgfHwgJ+KAkycsIGVzYyhpLnRlbmFudCB8fCAnJykpICsKICAgICAgICBrcGkoJ+C4peC5',
  'ieC4suC4h+C5geC4reC4o+C5jCcsIHAuYWNDb3VudCArICcg4LiE4Lij4Lix4LmJ4LiHJywgcC5sYXN0QWMgPyAn4Lil4LmI4Liy4Liq4Li44LiUICcgKyB0aERhdGUocC5sYXN0QWMpIDogJ+C5hOC4oeC5iOC4oeC4teC4m+C4o+C4sOC4p+C4seC4leC4tCcpICsK',
  'ICAgICAgICBrcGkoJ+C4h+C4suC4meC4i+C5iOC4reC4oScsIHAucmVwYWlyQ291bnQgKyAnIOC4h+C4suC4mScsICfguITguYnguLLguIcgJyArIHAub3BlblJlcGFpcnMsIHAub3BlblJlcGFpcnMgPyAnd2FybicgOiAnJykgKwogICAgICAgIGtwaSgn4LiE4LmI',
  '4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Liq4Liw4Liq4LihJywgYmFodChwLnRvdGFsQ29zdCksICfguIvguYjguK3guKEgKyDguKXguYnguLLguIfguYHguK3guKPguYwnKSArCiAgICAgICc8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBtYjEyIj4n',
  'ICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPVwnY2xvc2VNb2RhbCgpO2Zvcm1Sb29tKCcgKyBhdHRyKGkpICsgJylcJz7inI/vuI8g4LmB4LiB4LmJ4LmE4LiC4LiC4LmJ4Lit4Lih4Li54Lil4Lir4LmJ4Lit4LiHPC9idXR0b24+JyAr',
  'CiAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iY2xvc2VNb2RhbCgpO2Zvcm1SZXBhaXIoe3Jvb206XCcnICsgcm9vbSArICdcJ30pIj4rIOC5geC4iOC5ieC4h+C4i+C5iOC4reC4oTwvYnV0dG9uPicgKwogICAgICAgICc8YnV0dG9uIGNs',
  'YXNzPSJidG4gc20iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtmb3JtQWMoe3Jvb206XCcnICsgcm9vbSArICdcJ30pIj4rIOC4peC5ieC4suC4h+C5geC4reC4o+C5jDwvYnV0dG9uPicgKwogICAgICAnPC9kaXY+JyArCiAgICAgIChwLmFzc2V0cy5sZW5ndGggPyAn',
  'PGRpdiBjbGFzcz0iY2FyZCBtYjEyIj48ZGl2IGNsYXNzPSJjYXJkLWgiPjxoMz7guJfguKPguLHguJ7guKLguYzguKrguLTguJnguYPguJnguKvguYnguK3guIc8L2gzPjwvZGl2PjxkaXYgY2xhc3M9ImNhcmQtYiI+JyArCiAgICAgICAgJzxkaXYgY2xhc3M9InR3',
  'Ij48dGFibGUgY2xhc3M9InQiIHN0eWxlPSJtaW4td2lkdGg6YXV0byI+PHRoZWFkPjx0cj48dGg+4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZPC90aD48dGg+4Lii4Li14LmI4Lir4LmJ4LitL+C4o+C4uOC5iOC4mTwvdGg+PHRoPuC4leC4tOC4lOC4leC4seC5',
  'ieC4hzwvdGg+PHRoPuC4quC4luC4suC4meC4sDwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICBwLmFzc2V0cy5tYXAoZnVuY3Rpb24oYSl7CiAgICAgICAgICByZXR1cm4gJzx0cj48dGQ+JyArIGVzYyhhLm5hbWUpICsgJzwvdGQ+PHRkIGNsYXNz',
  'PSJmczEyIj4nICsgZXNjKGEuYnJhbmR8fCfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyB0aERhdGUoYS5pbnN0YWxsRGF0ZSkgKyAnPC90ZD48dGQ+JyArIHN0YXR1c0JhZGdlKGEuc3RhdHVzKSArICc8L3Rk',
  'PjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+PC9kaXY+PC9kaXY+JyA6ICcnKSArCiAgICAgICc8aDMgY2xhc3M9ImZzMTMgbWI4Ij7guJvguKPguLDguKfguLHguJXguLTguJfguLHguYnguIfguKvguKHguJQgKCcg',
  'KyBwLnRpbWVsaW5lLmxlbmd0aCArICcpPC9oMz4nICsKICAgICAgKHAudGltZWxpbmUubGVuZ3RoID8gJzxkaXYgY2xhc3M9InRsIj4nICsgcC50aW1lbGluZS5tYXAoZnVuY3Rpb24oZSl7CiAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJ0bC1pIj48ZGl2IGNs',
  'YXNzPSJkIj4nICsgdGhEYXRlKGUuZGF0ZSkgKyAnIMK3ICcgKyBlc2MoZS50eXBlKSArICcgJyArIHN0YXR1c0JhZGdlKGUuc3RhdHVzKSArICc8L2Rpdj4nICsKICAgICAgICAgICc8ZGl2IGNsYXNzPSJ0Ij4nICsgZXNjKGUudGl0bGUpICsgJzwvZGl2PicgKwog',
  'ICAgICAgICAgKGUuZGV0YWlsID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQiPicgKyBlc2MoZS5kZXRhaWwpICsgJzwvZGl2PicgOiAnJykgKwogICAgICAgICAgKGUuY29zdCA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIj4nICsgYmFodChlLmNvc3QpICsgJzwv',
  'ZGl2PicgOiAnJykgKwogICAgICAgICAgKGUucGhvdG9zICYmIGUucGhvdG9zLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJtdDgiPicgKyB0aHVtYnNIdG1sKGUucGhvdG9zKSArICc8L2Rpdj4nIDogJycpICsKICAgICAgICAnPC9kaXY+JzsKICAgICAgfSkuam9pbign',
  'JykgKyAnPC9kaXY+JyA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lib4Lij4Liw4Lin4Lix4LiV4Li0PC9kaXY+Jyk7CgogICAgb3Blbk1vZGFsKCfwn5qqIOC4q+C5ieC4reC4hyAnICsgcm9vbSArICcgwrcg4LiK4Lix4LmJ',
  '4LiZICcgKyAoaS5mbG9vcnx8JycpLCBib2R5LAogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4m+C4tOC4lDwvYnV0dG9uPicsIHRydWUpOwogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUs',
  'ICdlcnInKTsgY2xvc2VNb2RhbCgpOyB9KTsKfQoKCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICA4KSDguKPguLLguKLguKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4Lii4Lir4LitICjg',
  'uKPguLLguKLguYDguJTguLfguK3guJkpCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMuZmluYW5jZSA9IHsKICBsb2FkOiBmdW5jdGlvbigpewogICAgcmV0dXJuIFByb21pc2Uu',
  'YWxsKFsKICAgICAgY2FsbEFwaSgnZmluYW5jZS5zdW1tYXJ5JywgeyB5ZWFyOiBTLnllYXIgfSksCiAgICAgIGNhbGxBcGkoJ2ZpbmFuY2UubGlzdCcsIHsgeWVhcjogUy55ZWFyLCBraW5kOiBTLnBhcmFtcy5raW5kIHx8ICcnIH0pCiAgICBdKS50aGVuKGZ1bmN0',
  'aW9uKHIpeyB2YXIgZCA9IHJbMF07IGQuaXRlbXMgPSByWzFdOyByZXR1cm4gZDsgfSk7CiAgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyAr',
  'IFMueWVhcjsKICAgIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgIGtwaSgn4Lij4Liy4Lii4Lij4Lix4LiaICcgKyB5ZWFyTGFiZWwsIGJhaHQoZC5pbmNvbWUpLCAn4LmA4LiJ4Lil4Li14LmI4LiiICcgKyBiYWh0KGQuYXZn',
  'SW5jb21lKSArICcv4LmA4LiU4Li34Lit4LiZJywgJ2dvb2QnKSArCiAgICAgIGtwaSgn4Lij4Liy4Lii4LiI4LmI4Liy4LiiICcgKyB5ZWFyTGFiZWwsIGJhaHQoZC5leHBlbnNlKSwgJ+C5gOC4ieC4peC4teC5iOC4oiAnICsgYmFodChkLmF2Z0V4cGVuc2UpICsg',
  'Jy/guYDguJTguLfguK3guJknLCAnYmFkJykgKwogICAgICBrcGkoJ+C4hOC4h+C5gOC4q+C4peC4t+C4reC4quC4uOC4l+C4mOC4tCcsIGJhaHQoZC5uZXQpLCAn4Lit4Lix4LiV4Lij4Liy4LiB4Liz4LmE4LijICcgKyBwY3QoZC5tYXJnaW4pLCAnYWNjZW50ICcg',
  'KyAoZC5uZXQgPj0gMCA/ICdnb29kJyA6ICdiYWQnKSkgKwogICAgICBrcGkoJ+C4muC4seC4meC4l+C4tuC4geC5geC4peC5ieC4pycsIGQubW9udGhzV2l0aERhdGEgKyAnIOC5gOC4lOC4t+C4reC4mScsIGQuY291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4oycp',
  'ICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciBtYXhCYXIgPSBNYXRoLm1heC5hcHBseShudWxsLCBkLmJ5TW9udGgubWFwKGZ1bmN0aW9uKG0peyByZXR1cm4gTWF0aC5tYXgobS5pbmNvbWUsIG0uZXhwZW5zZSk7IH0pKSB8fCAxOwogICAgdmFyIG1vbnRobHkgPSBj',
  'YXJkKCfwn5OFIOC4o+C4suC4ouC5gOC4lOC4t+C4reC4mSDCtyAnICsgeWVhckxhYmVsLAogICAgICAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsKICAgICAgJzx0aD7guYDguJTguLfguK3guJk8L3RoPjx0aCBjbGFzcz0i',
  'bnVtIj7guKPguLLguKLguKPguLHguJo8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKPguLLguKLguIjguYjguLLguKI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguIfguYDguKvguKXguLfguK08L3RoPicgKwogICAgICAnPHRoIHN0eWxlPSJ3aWR0aDozOCUiPuC5gOC4',
  'l+C4teC4ouC4muC4o+C4suC4ouC4o+C4seC4miAvIOC4o+C4suC4ouC4iOC5iOC4suC4ojwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgZC5ieU1vbnRoLm1hcChmdW5jdGlvbihtKXsKICAgICAgICB2YXIgYmxhbmsgPSAhbS5pbmNvbWUgJiYgIW0u',
  'ZXhwZW5zZTsKICAgICAgICByZXR1cm4gJzx0cicgKyAoYmxhbmsgPyAnIHN0eWxlPSJvcGFjaXR5Oi40NSInIDogJycpICsgJz4nICsKICAgICAgICAgICc8dGQ+PGI+JyArIG0ubGFiZWwgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJudW0i',
  'PicgKyAobS5pbmNvbWUgPyBtb25leShtLmluY29tZSkgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChtLmV4cGVuc2UgPyBtb25leShtLmV4cGVuc2UpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRk',
  'IGNsYXNzPSJudW0iPjxiIHN0eWxlPSJjb2xvcjonICsgKG0ubmV0ID49IDAgPyAndmFyKC0tb2spJyA6ICd2YXIoLS1kYW5nZXIpJykgKyAnIj4nICsKICAgICAgICAgICAgKGJsYW5rID8gJ+KAkycgOiBtb25leShtLm5ldCkpICsgJzwvYj48L3RkPicgKwogICAg',
  'ICAgICAgJzx0ZD4nICsKICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImJhci10cmFjayBtYjgiPjxkaXYgY2xhc3M9ImJhci1maWxsIiBzdHlsZT0id2lkdGg6JyArIChtLmluY29tZS9tYXhCYXIqMTAwKSArICclO2JhY2tncm91bmQ6dmFyKC0tb2spIj48L2Rpdj48',
  'L2Rpdj4nICsKICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImJhci10cmFjayI+PGRpdiBjbGFzcz0iYmFyLWZpbGwiIHN0eWxlPSJ3aWR0aDonICsgKG0uZXhwZW5zZS9tYXhCYXIqMTAwKSArICclO2JhY2tncm91bmQ6dmFyKC0tZGFuZ2VyKSI+PC9kaXY+PC9kaXY+',
  'JyArCiAgICAgICAgICAnPC90ZD48L3RyPic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nLCAnJywgdHJ1ZSk7CgogICAgdmFyIGJ5S2luZCA9IGNhcmQoJ/Cfp74g4LmB4Lii4LiB4LiV4Liy4Lih4Lij4Liy4Lii4LiB4Liy4Lij',
  'IMK3ICcgKyB5ZWFyTGFiZWwsCiAgICAgIGJhckNoYXJ0KGQuYnlLaW5kLm1hcChmdW5jdGlvbihrKXsgcmV0dXJuIHsgbGFiZWw6IGsua2luZCArICcgKCcgKyBrLmNvdW50ICsgJyknLCB0b3RhbDogay50b3RhbCB9OyB9KSwKICAgICAgICAgICAgICAgJ2xhYmVs',
  'JywgJ3RvdGFsJywgZnVuY3Rpb24oaSl7IHJldHVybiBtb25leShpLnRvdGFsKSArICcg4Li/JzsgfSkpOwoKICAgIHZhciBieVllYXIgPSBjYXJkKCfwn5OKIOC5gOC4l+C4teC4ouC4muC4o+C4suC4ouC4m+C4tScsCiAgICAgIGQuYnlZZWFyLmxlbmd0aCA/ICc8',
  'ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOmF1dG8iPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guJvguLU8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKPguLLguKLguKPguLHguJo8L3RoPjx0aCBjbGFzcz0ibnVtIj7g',
  'uKPguLLguKLguIjguYjguLLguKI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguIfguYDguKvguKXguLfguK08L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgZC5ieVllYXIubWFwKGZ1bmN0aW9uKHkpewogICAgICAgICAgcmV0dXJuICc8dHIgb25j',
  'bGljaz0ic2V0WWVhckZyb21UYWJsZSgnICsgeS55ZWFyICsgJykiIHN0eWxlPSJjdXJzb3I6cG9pbnRlciI+JyArCiAgICAgICAgICAgICc8dGQ+PGI+JyArIHkueWVhciArICc8L2I+IDxzcGFuIGNsYXNzPSJmYWludCBmczEyIj4vICcgKyAoeS55ZWFyKzU0Mykg',
  'KyAnPC9zcGFuPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIG1vbmV5KHkuaW5jb21lKSArICc8L3RkPjx0ZCBjbGFzcz0ibnVtIj4nICsgbW9uZXkoeS5leHBlbnNlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJu',
  'dW0iPjxiIHN0eWxlPSJjb2xvcjonICsgKHkubmV0Pj0wPyd2YXIoLS1vayknOid2YXIoLS1kYW5nZXIpJykgKyAnIj4nICsgbW9uZXkoeS5uZXQpICsgJzwvYj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+',
  'JyA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14LiC4LmJ4Lit4Lih4Li54LilPC9kaXY+JywgJycsIHRydWUpOwoKICAgIHZhciBraW5kcyA9ICc8ZGl2IGNsYXNzPSJjaGlwcyBtYjEyIj4nICsKICAgICAgJzxidXR0b24gY2xh',
  'c3M9ImNoaXAgJyArICghUy5wYXJhbXMua2luZD8nb24nOicnKSArICciIG9uY2xpY2s9InNldFBhcmFtKFwna2luZFwnLFwnXCcpIj7guJfguLjguIHguKPguLLguKLguIHguLLguKM8L2J1dHRvbj4nICsKICAgICAgZC5ieUtpbmQubWFwKGZ1bmN0aW9uKGspewog',
  'ICAgICAgIHJldHVybiAnPGJ1dHRvbiBjbGFzcz0iY2hpcCAnICsgKFMucGFyYW1zLmtpbmQ9PT1rLmtpbmQ/J29uJzonJykgKyAnIiBvbmNsaWNrPSJzZXRQYXJhbShcJ2tpbmRcJyxcJycgKyBlc2Moay5raW5kKSArICdcJykiPicgKwogICAgICAgICAgICAgICBl',
  'c2Moay5raW5kKSArICcgKCcgKyBrLmNvdW50ICsgJyk8L2J1dHRvbj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwoKICAgIHZhciByb3dzID0gZC5pdGVtczsKICAgIHZhciBsaXN0ID0gY2FyZCgn8J+TkiDguKPguLLguKLguIHguLLguKPguJfguLHg',
  'uYnguIfguKvguKHguJQgwrcgJyArIHllYXJMYWJlbCArICcgKCcgKyByb3dzLmxlbmd0aCArICcpJywKICAgICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC4p+C4seC4',
  'meC4l+C4teC5iDwvdGg+PHRoPuC4o+C4suC4ouC4geC4suC4ozwvdGg+PHRoIGNsYXNzPSJudW0iPuC4iOC4s+C4meC4p+C4meC5gOC4h+C4tOC4mTwvdGg+PHRoPuC4o+C4reC4muC4muC4tOC4pTwvdGg+PHRoPuC4iuC5iOC4reC4h+C4l+C4suC4hzwvdGg+JyAr',
  'CiAgICAgICAgJzx0aD7guKrguKXguLTguJs8L3RoPjx0aD7guKvguKHguLLguKLguYDguKvguJXguLg8L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgcm93cy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgICAgICB2YXIgaW5jID0geC5m',
  'bG93ID09PSAn4Lij4Liy4Lii4Lij4Lix4LiaJzsKICAgICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LmRhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGI+JyArIGVz',
  'Yyh4LmtpbmQpICsgJzwvYj4gJyArIChpbmMgPyAnPHNwYW4gY2xhc3M9ImIgb2siPuC4o+C4suC4ouC4o+C4seC4mjwvc3Bhbj4nIDogJzxzcGFuIGNsYXNzPSJiIG11dGUiPuC4o+C4suC4ouC4iOC5iOC4suC4ojwvc3Bhbj4nKSArICc8L3RkPicgKwogICAgICAg',
  'ICAgICAnPHRkIGNsYXNzPSJudW0iPjxiIHN0eWxlPSJjb2xvcjonICsgKGluYz8ndmFyKC0tb2spJzondmFyKC0taW5rKScpICsgJyI+JyArIChpbmM/JysnOifiiJInKSArIG1vbmV5KHguYW1vdW50LCAyKSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICAgJzx0',
  'ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyh4LmJpbGxNb250aCB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyh4LmNoYW5uZWwgfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRo',
  'dW1ic0h0bWwoeC5zbGlwUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiBtdXRlZCBjbGlwIj4nICsgZXNjKHgubm90ZSB8fCAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48ZGl2IGNsYXNzPSJ0LWFjdGlvbnMiPicg',
  'KwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1GaW5hbmNlKCcgKyBhdHRyKHgpICsgJylcJz7inI/vuI88L2J1dHRvbj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24gZGdy',
  'IiBvbmNsaWNrPSJkZWxGaW5hbmNlKFwnJyArIHguaWQgKyAnXCcpIj7wn5eRPC9idXR0b24+JyArCiAgICAgICAgICAgICc8L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6IGVtcHR5',
  'Qm94KCfguKLguLHguIfguYTguKHguYjguKHguLXguKPguLLguKLguIHguLLguKPguYPguJknICsgeWVhckxhYmVsLCAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZm9ybUZpbmFuY2UobnVsbCkiPisg4Lia4Lix4LiZ4LiX4Li24LiB4Lij4Liy4Lii',
  '4LiB4Liy4LijPC9idXR0b24+JyksCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIHNtIiBvbmNsaWNrPSJmb3JtRmluYW5jZShudWxsKSI+KyDguJrguLHguJnguJfguLbguIHguKPguLLguKLguKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4LiiPC9idXR0',
  'b24+JywgdHJ1ZSk7CgogICAgcmV0dXJuIGhlYWQgKyBtb250aGx5ICsgJzxkaXYgY2xhc3M9ImdyaWQgZzIgbXQxMiBtYjEyIj4nICsgYnlLaW5kICsgYnlZZWFyICsgJzwvZGl2PicgKyBraW5kcyArIGxpc3Q7CiAgfQp9OwoKLyogPT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDkpIOC4o+C4suC4ouC4h+C4suC4mSAmIOC4quC4s+C4o+C4reC4h+C4guC5ieC4reC4oeC4ueC4pQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLnJlcG9ydHMgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsKICAgIHJldHVybiBQcm9taXNlLmFsbChbCiAgICAgIGNhbGxBcGkoJ3JlcG9ydC5jb3N0UGVyUm9vbScsIHsgeWVhcjogUy55ZWFyIH0pLAogICAgICBjYWxs',
  'QXBpKCdyZXBvcnQudXBjb21pbmcnLCB7IGRheXM6IDkwIH0pLAogICAgICBjYWxsQXBpKCdiYWNrdXAuc2hlZXRzJywge30pLAogICAgICBjYWxsQXBpKCdzaGFyZS5saW5rcycsIHt9KS5jYXRjaChmdW5jdGlvbigpeyByZXR1cm4ge307IH0pLAogICAgICBjYWxs',
  'QXBpKCdiYWNrdXAuaGlzdG9yeScsIHt9KS5jYXRjaChmdW5jdGlvbigpeyByZXR1cm4gW107IH0pCiAgICBdKS50aGVuKGZ1bmN0aW9uKHIpewogICAgICByZXR1cm4geyBjb3N0OiByWzBdLCB1cGNvbWluZzogclsxXSwgc2hlZXRzOiByWzJdLCBsaW5rczogclsz',
  'XSB8fCB7fSwgYmFja3Vwczogcls0XSB8fCBbXSwgeWVhcnM6IFtdIH07CiAgICB9KTsKICB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgeWVhckxhYmVsID0gUy55ZWFyID09PSAnYWxsJyA/ICfguJfguLjguIHguJvguLUnIDogJ+C4m+C4tSAnICsg',
  'Uy55ZWFyOwogICAgdmFyIGMgPSBkLmNvc3Q7CiAgICB2YXIgdG9wID0gYy5yb29tcy5maWx0ZXIoZnVuY3Rpb24ocil7IHJldHVybiByLnRvdGFsID4gMDsgfSk7CiAgICB2YXIgbWF4Q29zdCA9IHRvcC5sZW5ndGggPyB0b3BbMF0udG90YWwgOiAxOwoKICAgIHZh',
  'ciB1cGNvbWluZyA9IGNhcmQoJ/Cfl5PvuI8g4Lib4LiP4Li04LiX4Li04LiZ4LiH4Liy4LiZ4LiX4Li14LmI4LiB4Liz4Lil4Lix4LiH4LiI4Liw4LiW4Li24LiHICg5MCDguKfguLHguJkpIMK3ICcgKyBkLnVwY29taW5nLmxlbmd0aCArICcg4LiH4Liy4LiZJywK',
  'ICAgICAgZC51cGNvbWluZy5sZW5ndGggPyAnPGRpdiBjbGFzcz0iYWxpc3QiPicgKyBkLnVwY29taW5nLm1hcChmdW5jdGlvbih1KXsKICAgICAgICB2YXIgbHZsID0gdS5kYXlzTGVmdCA8IDAgPyAnZGFuZ2VyJyA6ICh1LmRheXNMZWZ0IDw9IDcgPyAnd2Fybicg',
  'OiAnaW5mbycpOwogICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0iYWxpIGwtJyArIGx2bCArICciIG9uY2xpY2s9ImdvKFwnJyArIGp1bXBQYWdlKHUubW9kdWxlKSArICdcJykiPicgKwogICAgICAgICAgJzxkaXYgY2xhc3M9ImljIj4nICsgdS5pY29uICsgJzwv',
  'ZGl2PjxkaXY+JyArCiAgICAgICAgICAnPGRpdiBjbGFzcz0idHQiPicgKyBlc2ModS50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAnPGRpdiBjbGFzcz0iZGQiPicgKyB0aERhdGUodS5kYXRlKSArICcgwrcgJyArCiAgICAgICAgICAgICh1LmRheXNMZWZ0',
  'IDwgMCA/ICfguYDguKXguKLguIHguLPguKvguJnguJQgJyArICgtdS5kYXlzTGVmdCkgKyAnIOC4p+C4seC4mScgOiAodS5kYXlzTGVmdCA9PT0gMCA/ICfguKfguLHguJnguJnguLXguYknIDogJ+C4reC4teC4gSAnICsgdS5kYXlzTGVmdCArICcg4Lin4Lix4LiZ',
  'JykpICsKICAgICAgICAgICAgKHUuZGV0YWlsID8gJyDCtyAnICsgZXNjKHUuZGV0YWlsKSA6ICcnKSArICc8L2Rpdj48L2Rpdj48L2Rpdj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWci',
  'PvCfjKTvuI88L2Rpdj7guYTguKHguYjguKHguLXguIfguLLguJnguJnguLHguJTguKvguKHguLLguKLguYPguJkgOTAg4Lin4Lix4LiZ4LiC4LmJ4Liy4LiH4Lir4LiZ4LmJ4LiyPC9kaXY+JywgJycsIHRydWUpOwoKICAgIHZhciBjb3N0Q2FyZCA9IGNhcmQoJ/Cf',
  'j7fvuI8g4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Liq4Liw4Liq4Lih4Lij4Liy4Lii4Lir4LmJ4Lit4LiHIMK3ICcgKyB5ZWFyTGFiZWwsCiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGczIG1iMTIiPicgKwogICAgICAgIGtwaSgn4Lij4Lin4Lih4LiX',
  '4Li44LiB4Lir4LmJ4Lit4LiHJywgYmFodChjLnRvdGFsKSwgJycpICsKICAgICAgICBrcGkoJ+C5gOC4ieC4peC4teC5iOC4ouC4leC5iOC4reC4q+C5ieC4reC4hycsIGJhaHQoYy5hdmVyYWdlKSwgJycpICsKICAgICAgICBrcGkoJ+C4q+C5ieC4reC4h+C4l+C4',
  'teC5iOC5g+C4iuC5ieC4iOC5iOC4suC4ouC4quC4ueC4h+C4quC4uOC4lCcsIHRvcC5sZW5ndGggPyAoJ+C4q+C5ieC4reC4hyAnICsgdG9wWzBdLnJvb20pIDogJ+KAkycsIHRvcC5sZW5ndGggPyBiYWh0KHRvcFswXS50b3RhbCkgOiAnJykgKwogICAgICAnPC9k',
  'aXY+JyArCiAgICAgICh0b3AubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guKvguYnguK3guIc8L3RoPjx0aCBjbGFzcz0ibnVtIj7guIfguLLguJnguIvguYjguK3guKE8L3RoPjx0',
  'aCBjbGFzcz0ibnVtIj7guITguYjguLLguIvguYjguK3guKE8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKXguYnguLLguIfguYHguK3guKPguYw8L3RoPicgKwogICAgICAgICc8dGggY2xhc3M9Im51bSI+4LiC4Lit4LiH4LmA4LiC4LmJ4Liy4Lir4LmJ4Lit4LiHPC90',
  'aD48dGggY2xhc3M9Im51bSI+4Lij4Lin4LihPC90aD48dGggc3R5bGU9IndpZHRoOjI2JSI+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIHRvcC5tYXAoZnVuY3Rpb24ocil7CiAgICAgICAgICByZXR1cm4gJzx0ciBvbmNsaWNrPSJvcGVuUm9v',
  'bShcJycgKyByLnJvb20gKyAnXCcpIiBzdHlsZT0iY3Vyc29yOnBvaW50ZXIiPicgKwogICAgICAgICAgICAnPHRkPjxiPicgKyByLnJvb20gKyAnPC9iPiA8c3BhbiBjbGFzcz0iZmFpbnQgZnMxMiI+4LiK4Lix4LmJ4LiZICcgKyByLmZsb29yICsgJzwvc3Bhbj48',
  'L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyByLmpvYnMgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHIucmVwYWlyID8gbW9uZXkoci5yZXBhaXIpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAg',
  'ICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChyLmFjID8gbW9uZXkoci5hYykgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHIucHVyY2hhc2UgPyBtb25leShyLnB1cmNoYXNlKSA6ICfigJMnKSArICc8L3RkPicg',
  'KwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxiPicgKyBtb25leShyLnRvdGFsKSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48ZGl2IGNsYXNzPSJiYXItdHJhY2siPjxkaXYgY2xhc3M9ImJhci1maWxsIiBzdHlsZT0id2lkdGg6JyArIChy',
  'LnRvdGFsL21heENvc3QqMTAwKSArICclIj48L2Rpdj48L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li1',
  '4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4LiX4Li14LmI4Lia4Lix4LiZ4LiX4Li24LiB4LmE4Lin4LmJ4Lij4Liy4Lii4Lir4LmJ4Lit4LiHPGRpdiBjbGFzcz0iZnMxMiBtdDgiPuC5g+C4quC5iCAi4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii',
  'IiDguYPguJnguIfguLLguJnguIvguYjguK3guKEv4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMIOC4q+C4o+C4t+C4reC4o+C4sOC4muC4uOC4q+C5ieC4reC4h+C5g+C4meC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4hyDguYHguKXguYnguKfg',
  'uJXguLHguKfguYDguKXguILguIjguLDguILguLbguYnguJnguJfguLXguYjguJnguLXguYg8L2Rpdj48L2Rpdj4nKSk7CgogICAgdmFyIGJhY2t1cCA9IGNhcmQoJ/Cfkr4g4Liq4Liz4Lij4Lit4LiH4LmB4Lil4Liw4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit',
  '4Lih4Li54LilJywKICAgICAgJzxwIGNsYXNzPSJmczEzIG11dGVkIj7guILguYnguK3guKHguLnguKXguJfguLHguYnguIfguKvguKHguJTguK3guKLguLnguYjguYPguJnguKPguLDguJrguJrguJnguLXguYkg4oCUIOC4hOC4p+C4o+C4lOC4suC4p+C4meC5jOC5',
  'guC4q+C4peC4lOC4quC4s+C4o+C4reC4h+C5hOC4p+C5ieC5gOC4lOC4t+C4reC4meC4peC4sOC4hOC4o+C4seC5ieC4hyAnICsKICAgICAgJ+C5hOC4n+C4peC5jCBKU09OIOC4meC4s+C4geC4peC4seC4muC5gOC4guC5ieC4suC4o+C4sOC4muC4muC5hOC4lOC5',
  'iSDguKrguYjguKfguJkgQ1NWIOC5gOC4m+C4tOC4lOC5g+C4mSBFeGNlbCDguKvguKPguLfguK0gR29vZ2xlIFNoZWV0cyDguYTguJTguYnguYDguKXguKI8L3A+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQxMiI+JyArCiAgICAgICAgJzxidXR0b24gY2xh',
  'c3M9ImJ0biBwcmkiIG9uY2xpY2s9ImRvRXhwb3J0SnNvbigpIj7irIfvuI8g4LiU4Liy4Lin4LiZ4LmM4LmC4Lir4Lil4LiU4Liq4Liz4Lij4Lit4LiH4LiX4Lix4LmJ4LiH4Lir4Lih4LiUIChKU09OKTwvYnV0dG9uPicgKwogICAgICAgICc8YnV0dG9uIGNsYXNz',
  'PSJidG4iIG9uY2xpY2s9ImRvSW1wb3J0SnNvbigpIj7irIbvuI8g4LiB4Li54LmJ4LiE4Li34LiZ4LiI4Liy4LiB4LmE4Lif4Lil4LmM4Liq4Liz4Lij4Lit4LiHPC9idXR0b24+JyArCiAgICAgICc8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImhyIj48L2Rp',
  'dj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbWI4Ij7guKrguYjguIfguK3guK3guIHguYDguJvguYfguJkgQ1NWIOC5geC4ouC4geC4leC4suC4o+C4suC4hzwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iY2hpcHMiPicgKyBkLnNoZWV0cy5t',
  'YXAoZnVuY3Rpb24obil7CiAgICAgICAgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJjaGlwIiBvbmNsaWNrPSJkb0V4cG9ydENzdihcJycgKyBlc2MobikgKyAnXCcpIj4nICsgZXNjKHNoZWV0TGFiZWwobikpICsgJzwvYnV0dG9uPic7CiAgICAgIH0pLmpvaW4oJycp',
  'ICsgJzwvZGl2PicpOwoKICAgIHZhciBzaGFyZSA9IChjYW5FZGl0KCkgJiYgZC5saW5rcyAmJiBkLmxpbmtzLnZpZXdVcmwpID8gY2FyZCgn8J+UlyDguKXguLTguIfguIHguYzguYDguILguYnguLLguYPguIrguYnguIfguLLguJknLAogICAgICAnPGRpdiBjbGFz',
  'cz0iZiBtYjEyIj48bGFiZWw+8J+UkSDguKXguLTguIfguIHguYzguILguK3guIfguITguLjguJMgKOC5geC4geC5ieC5hOC4guC4guC5ieC4reC4oeC4ueC4peC5hOC4lOC5iSDigJQg4Lit4Lii4LmI4Liy4Liq4LmI4LiH4LiV4LmI4LitKTwvbGFiZWw+JyArCiAg',
  'ICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiByZWFkb25seSB2YWx1ZT0iJyArIGVzYyhkLmxpbmtzLmFkbWluVXJsKSArICciIG9uY2xpY2s9InRoaXMuc2VsZWN0KCkiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiI+PGxhYmVsPvCfkYAg4Lil4Li04LiH',
  '4LiB4LmM4LmB4LiK4Lij4LmMICjguYDguJvguLTguJTguJTguLnguYTguJTguYnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcg4oCUIOC4quC5iOC4h+C5g+C4q+C5ieC5g+C4hOC4o+C4geC5h+C5hOC4lOC5iSk8L2xhYmVsPicgKwogICAgICAgICc8aW5w',
  'dXQgY2xhc3M9ImlucCIgaWQ9InNoYXJlVXJsIiByZWFkb25seSB2YWx1ZT0iJyArIGVzYyhkLmxpbmtzLnZpZXdVcmwpICsgJyIgb25jbGljaz0idGhpcy5zZWxlY3QoKSI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQxMiI+JyArCiAgICAgICAg',
  'JzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImNvcHlTaGFyZSgpIj7wn5OLIOC4hOC4seC4lOC4peC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jDwvYnV0dG9uPicgKwogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gZGdyIiBvbmNsaWNr',
  'PSJkb1JvdGF0ZVNoYXJlKCkiPvCflIEg4Lit4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LmD4Lir4Lih4LmIPC9idXR0b24+JyArCiAgICAgICc8L2Rpdj4nICsKICAgICAgJzxwIGNsYXNzPSJmczEyIG11dGVkIG10MTIiPuC4hOC4meC4l+C4teC5',
  'iOC5gOC4m+C4tOC4lOC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC4iOC4sOC5gOC4q+C5h+C4meC4guC5ieC4reC4oeC4ueC4peC4l+C4seC5ieC4h+C4q+C4oeC4lOC5geC4muC4muC4reC5iOC4suC4meC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pyAn',
  'ICsKICAgICAgJ+C5hOC4oeC5iOC4leC5ieC4reC4h+C4oeC4teC4muC4seC4jeC4iuC4tSBHb29nbGUg4LmB4Lil4Liw4LmE4Lih4LmI4LmA4Lir4LmH4LiZIEdvb2dsZSBTaGVldCDguILguK3guIfguITguLjguJMgwrcgJyArCiAgICAgICfguJbguYnguLLguKXg',
  'uLTguIfguIHguYzguKvguKXguLjguJTguYPguKvguYnguIHguJQgIuC4reC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC5g+C4q+C4oeC5iCIg4Lil4Li04LiH4LiB4LmM4LmA4LiU4Li04Lih4LiI4Liw4LmD4LiK4LmJ4LmE4Lih4LmI4LmE4LiU4LmJ',
  '4LiX4Lix4LiZ4LiX4Li1PC9wPicpIDogJyc7CgogICAgdmFyIGRyaXZlID0gY2FuRWRpdCgpID8gY2FyZCgn4piB77iPIOC4quC4s+C4o+C4reC4h+C4reC4seC4leC5guC4meC4oeC4seC4leC4tOC5g+C4mSBHb29nbGUgRHJpdmUgKCcgKyBkLmJhY2t1cHMubGVu',
  'Z3RoICsgJyDguIrguLjguJQpJywKICAgICAgJzxwIGNsYXNzPSJmczEzIG11dGVkIj7guKPguLDguJrguJrguYDguIHguYfguJrguYTguJ/guKXguYzguKrguLPguKPguK3guIfguYTguKfguYnguYPguJnguYLguJ/guKXguYDguJTguK3guKPguYwgIuC4quC4s+C4',
  'o+C4reC4h+C4guC5ieC4reC4oeC4ueC4pSIg4Lia4LiZ4LmE4LiU4Lij4Lif4LmM4LiC4Lit4LiH4LiE4Li44LiTICcgKwogICAgICAn4LiV4Lix4LmJ4LiH4LmD4Lir4LmJ4LiX4Liz4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li04LiX4Li44LiB4Lin4Lix4LiZ',
  '4LmE4LiU4LmJ4LiI4Liy4LiB4LmA4Lih4LiZ4Li54LmD4LiZ4LiK4Li14LiVPC9wPicgKwogICAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPjxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iZG9CYWNrdXBOb3coKSI+8J+SviDguKrguLPguKPguK3guIfguYDg',
  'uJTguLXguYvguKLguKfguJnguLXguYk8L2J1dHRvbj48L2Rpdj4nICsKICAgICAgKGQuYmFja3Vwcy5sZW5ndGggPyAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PjxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiIHN0eWxlPSJtaW4td2lkdGg6YXV0byI+PHRo',
  'ZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC5hOC4n+C4peC5jDwvdGg+PHRoPuC5gOC4p+C4peC4sjwvdGg+PHRoIGNsYXNzPSJudW0iPuC4guC4meC4suC4lDwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICBkLmJhY2t1cHMuc2xpY2UoMCwxMCku',
  'bWFwKGZ1bmN0aW9uKGIpewogICAgICAgICAgcmV0dXJuICc8dHI+PHRkIGNsYXNzPSJmczEyIj48YSBocmVmPSInICsgZXNjKGIudXJsKSArICciIHRhcmdldD0iX2JsYW5rIj4nICsgZXNjKGIubmFtZSkgKyAnPC9hPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQg',
  'Y2xhc3M9ImZzMTIiPicgKyBlc2MoYi5hdCkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIGZzMTIiPicgKyBNYXRoLnJvdW5kKGIuc2l6ZS8xMDI0KSArICcgS0I8L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5',
  'PjwvdGFibGU+PC9kaXY+JyA6ICcnKSkgOiAnJzsKCiAgICByZXR1cm4gdXBjb21pbmcgKyAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIGNvc3RDYXJkICsgJzwvZGl2PicgKwogICAgICAgICAgIChzaGFyZSA/ICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgc2hhcmUgKyAn',
  'PC9kaXY+JyA6ICcnKSArCiAgICAgICAgICAgJzxkaXYgY2xhc3M9Im10MTIiPicgKyBiYWNrdXAgKyAnPC9kaXY+JyArCiAgICAgICAgICAgKGRyaXZlID8gJzxkaXYgY2xhc3M9Im10MTIiPicgKyBkcml2ZSArICc8L2Rpdj4nIDogJycpOwogIH0KfTsKCmZ1bmN0',
  'aW9uIHNoZWV0TGFiZWwobil7CiAgcmV0dXJuICh7CiAgICBEZWJ0czon4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJJywgRGVidFBheW1lbnRzOifguKPguLLguKLguIHguLLguKPguIrguLPguKPguLDguKvguJnguLXguYknLCBQdXJjaGFzZXM6J+C4o+C4suC4ouC4',
  'geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4hycsIFJvb21zOifguJfguLDguYDguJrguLXguKLguJnguKvguYnguK3guIcnLAogICAgQWNTZXJ2aWNlOifguKXguYnguLLguIfguYHguK3guKPguYwnLCBSb29tUmVwYWlyczon4LiL4LmI4Lit4Lih4LmB4LiL4Lih',
  '4Lir4LmJ4Lit4LiHJywgQnVpbGRpbmdSZXBhaXJzOifguIvguYjguK3guKHguYHguIvguKHguJXguLbguIEnLAogICAgUm9vbUFzc2V0czon4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZ4Lir4LmJ4Lit4LiHJywgRmluYW5jZTon4Lij4Liy4Lii4Lij4Lix4Lia',
  'LeC4o+C4suC4ouC4iOC5iOC4suC4oicsIFNldHRpbmdzOifguJXguLHguYnguIfguITguYjguLInLCBBY3Rpdml0eUxvZzon4Lib4Lij4Liw4Lin4Lix4LiV4Li04LiB4Liy4Lij4LmB4LiB4LmJ4LmE4LiCJwogIH0pW25dIHx8IG47Cn0KCi8qID09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJXguLHguKfguIrguYjguKfguKLguKfguLLguJTguIvguYnguLMg4LmGCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PSAqLwoKZnVuY3Rpb24ga3BpKGxhYmVsLCB2YWx1ZSwgY2FwLCBjbHMpewogIHJldHVybiAnPGRpdiBjbGFzcz0ia3BpICcgKyAoY2xzfHwnJykgKyAnIj4nICsKICAgICc8ZGl2IGNsYXNzPSJsYmwiPicgKyBlc2MobGFiZWwpICsgJzwvZGl2Picg',
  'KwogICAgJzxkaXYgY2xhc3M9InZhbCI+JyArIHZhbHVlICsgJzwvZGl2PicgKwogICAgKGNhcCA/ICc8ZGl2IGNsYXNzPSJjYXAiPicgKyBjYXAgKyAnPC9kaXY+JyA6ICcnKSArICc8L2Rpdj4nOwp9CgpmdW5jdGlvbiBjYXJkKHRpdGxlLCBib2R5LCBhY3Rpb25z',
  'LCBmbHVzaCl7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJjYXJkIj4nICsKICAgICh0aXRsZSA/ICc8ZGl2IGNsYXNzPSJjYXJkLWgiPjxoMz4nICsgdGl0bGUgKyAnPC9oMz4nICsgKGFjdGlvbnMgPyAnPGRpdiBjbGFzcz0ic3AiPicgKyBhY3Rpb25zICsgJzwvZGl2',
  'PicgOiAnJykgKyAnPC9kaXY+JyA6ICcnKSArCiAgICAnPGRpdiBjbGFzcz0iY2FyZC1iJyArIChmbHVzaCA/ICcgZmx1c2gnIDogJycpICsgJyI+JyArIGJvZHkgKyAnPC9kaXY+PC9kaXY+JzsKfQoKLyoqIOC4p+C4suC4lOC4nOC4seC4h+C4q+C5ieC4reC4h+C5',
  'geC4muC5iOC4h+C4leC4suC4oeC4iuC4seC5ieC4mSDigJQgZGVjb3JhdGUocm9vbSkgLT4ge2Nscywgc3ViLCBvbmNsaWNrfSAqLwpmdW5jdGlvbiByb29tRmxvb3JzKHJvb21zLCBkZWNvcmF0ZSl7CiAgdmFyIGJ5Rmxvb3IgPSB7fTsKICByb29tcy5mb3JFYWNo',
  'KGZ1bmN0aW9uKHIpewogICAgdmFyIGYgPSByLmZsb29yIHx8IE51bWJlcihTdHJpbmcoci5yb29tKS5jaGFyQXQoMCkpOwogICAgKGJ5Rmxvb3JbZl0gPSBieUZsb29yW2ZdIHx8IFtdKS5wdXNoKHIpOwogIH0pOwogIHZhciBmbG9vcnMgPSBPYmplY3Qua2V5cyhi',
  'eUZsb29yKS5zb3J0KCk7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJmbG9vcnMiPicgKyBmbG9vcnMubWFwKGZ1bmN0aW9uKGYpewogICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJmbG9vciI+PGRpdiBjbGFzcz0iZmxvb3ItdGFnIj48Yj4nICsgZiArICc8L2I+4LiK4Lix',
  '4LmJ4LiZPC9kaXY+PGRpdiBjbGFzcz0icm9vbXMiPicgKwogICAgICBieUZsb29yW2ZdLm1hcChmdW5jdGlvbihyKXsKICAgICAgICB2YXIgZCA9IGRlY29yYXRlKHIpOwogICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0icm9vbSAnICsgZC5jbHMgKyAnIiBvbmNs',
  'aWNrPSInICsgZC5vbmNsaWNrICsgJyI+JyArCiAgICAgICAgICAnPHNwYW4gY2xhc3M9ImRvdCI+PC9zcGFuPjxkaXYgY2xhc3M9Im5vIj4nICsgZXNjKHIucm9vbSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAnPGRpdiBjbGFzcz0ic3QiPicgKyBkLnN1YiArICc8',
  'L2Rpdj48L2Rpdj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj48L2Rpdj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7Cn0KCi8qKiDguYPguKrguYggb2JqZWN0IOC4peC4h+C5g+C4mSBvbmNsaWNrIGF0dHJpYnV0ZSDguYTguJTguYnguK3guKLguYjg',
  'uLLguIfguJvguKXguK3guJTguKDguLHguKIgKi8KZnVuY3Rpb24gYXR0cihvYmopewogIHZhciBjbGVhbiA9IHt9OwogIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChmdW5jdGlvbihrKXsKICAgIGlmIChrLmluZGV4T2YoJ18nKSA9PT0gMCB8fCAvUmVmcyQvLnRl',
  'c3QoaykgfHwgayA9PT0gJ3JlY29yZHMnIHx8IGsgPT09ICd3YXJyYW50eScpIHJldHVybjsKICAgIGNsZWFuW2tdID0gb2JqW2tdOwogIH0pOwogIHJldHVybiBKU09OLnN0cmluZ2lmeShjbGVhbikucmVwbGFjZSgvJi9nLCcmYW1wOycpLnJlcGxhY2UoLycvZywn',
  'JiMzOTsnKS5yZXBsYWNlKC8iL2csJyZxdW90OycpOwp9Cjwvc2NyaXB0Pgo8c2NyaXB0PgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgRm9ybXMuaHRtbCDigJQg4Lif4Lit4Lij4LmM4Lih4LmA',
  '4Lie4Li04LmI4LihL+C5geC4geC5ieC5hOC4giDguYHguKXguLDguIHguLLguKPguKXguJoKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgp2YXIgRk9STSA9IHsgc3BlY3M6IFtdLCBrZWVwOiB7',
  'fSwgYnVja2V0OiAnbWlzYycgfTsKCi8qIC0tLS0tLS0tLS0tLS0tLS0gZm9ybSBlbmdpbmUgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gZmllbGRzSHRtbChzcGVjcywgcmVjKXsKICByZWMgPSByZWMgfHwge307CiAgRk9STS5zcGVjcyA9IHNwZWNzOwog',
  'IEZPUk0ua2VlcCA9IHt9OwogIHJldHVybiAnPGRpdiBjbGFzcz0iZmdyaWQiPicgKyBzcGVjcy5tYXAoZnVuY3Rpb24oZil7CiAgICB2YXIgdiA9IHJlY1tmLmtleV07CiAgICB2YXIgaWQgPSAnZl8nICsgZi5rZXk7CiAgICB2YXIgaW5uZXI7CgogICAgaWYgKGYu',
  'dHlwZSA9PT0gJ3NlbGVjdCcpIHsKICAgICAgdmFyIG9wdHMgPSAoZi5vcHRpb25zIHx8IFtdKS5tYXAoZnVuY3Rpb24obyl7CiAgICAgICAgdmFyIHZhbCA9IHR5cGVvZiBvID09PSAnb2JqZWN0JyA/IG8udmFsdWUgOiBvOwogICAgICAgIHZhciBsYWIgPSB0eXBl',
  'b2YgbyA9PT0gJ29iamVjdCcgPyBvLmxhYmVsIDogbzsKICAgICAgICByZXR1cm4gJzxvcHRpb24gdmFsdWU9IicgKyBlc2ModmFsKSArICciJyArIChTdHJpbmcodikgPT09IFN0cmluZyh2YWwpID8gJyBzZWxlY3RlZCcgOiAnJykgKyAnPicgKyBlc2MobGFiKSAr',
  'ICc8L29wdGlvbj4nOwogICAgICB9KS5qb2luKCcnKTsKICAgICAgaW5uZXIgPSAnPHNlbGVjdCBjbGFzcz0ic2VsIiBpZD0iJyArIGlkICsgJyI+JyArIChmLmJsYW5rICE9PSBmYWxzZSA/ICc8b3B0aW9uIHZhbHVlPSIiPuKAlCDguYDguKXguLfguK3guIEg4oCU',
  'PC9vcHRpb24+JyA6ICcnKSArIG9wdHMgKyAnPC9zZWxlY3Q+JzsKCiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ3RleHRhcmVhJykgewogICAgICBpbm5lciA9ICc8dGV4dGFyZWEgY2xhc3M9InRhIiBpZD0iJyArIGlkICsgJyIgcGxhY2Vob2xkZXI9IicgKyBl',
  'c2MoZi5waHx8JycpICsgJyI+JyArIGVzYyh2fHwnJykgKyAnPC90ZXh0YXJlYT4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnZmlsZXMnKSB7CiAgICAgIEZPUk0ua2VlcFtmLmtleV0gPSAocmVjW2Yua2V5XSAmJiByZWNbZi5rZXldLmxlbmd0aCkgPyBb',
  'XS5jb25jYXQocmVjW2Yua2V5XSkgOiBbXTsKICAgICAgaW5uZXIgPQogICAgICAgICc8ZGl2IGlkPSInICsgaWQgKyAnX2V4aXN0aW5nIj4nICsgZXhpc3RpbmdGaWxlc0h0bWwoZi5rZXkpICsgJzwvZGl2PicgKwogICAgICAgICc8bGFiZWwgY2xhc3M9ImZpbGUt',
  'ZHJvcCIgZm9yPSInICsgaWQgKyAnIj7wn5OOIOC5geC4leC4sOC5gOC4nuC4t+C5iOC4reC5gOC4peC4t+C4reC4geC5hOC4n+C4peC5jCAo4LmA4Lil4Li34Lit4LiB4LmE4LiU4LmJ4Lir4Lil4Liy4Lii4LmE4Lif4Lil4LmMIMK3IOC5hOC4oeC5iOC5gOC4geC4',
  'tOC4mSAxMiBNQiDguJXguYjguK3guYTguJ/guKXguYwpJyArCiAgICAgICAgJzxpbnB1dCB0eXBlPSJmaWxlIiBpZD0iJyArIGlkICsgJyIgbXVsdGlwbGUgYWNjZXB0PSJpbWFnZS8qLGFwcGxpY2F0aW9uL3BkZiIgc3R5bGU9ImRpc3BsYXk6bm9uZSIgJyArCiAg',
  'ICAgICAgJ29uY2hhbmdlPSJwcmV2aWV3UGlja2VkKHRoaXMsXCcnICsgaWQgKyAnXCcpIj48L2xhYmVsPicgKwogICAgICAgICc8ZGl2IGlkPSInICsgaWQgKyAnX3ByZXZpZXciIGNsYXNzPSJ0aHVtYnMgbXQ4Ij48L2Rpdj4nOwoKICAgIH0gZWxzZSBpZiAoZi50',
  'eXBlID09PSAnY29tcHV0ZWQnKSB7CiAgICAgIGlubmVyID0gJzxkaXYgY2xhc3M9ImlucCIgaWQ9IicgKyBpZCArICciIHN0eWxlPSJiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Zm9udC13ZWlnaHQ6NjAwOycgKwogICAgICAgICAgICAgICdmb250LXZhcmlh',
  'bnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7Y3Vyc29yOmRlZmF1bHQiPjA8L2Rpdj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnZGF0ZScpIHsKICAgICAgaW5uZXIgPSAnPGlucHV0IHR5cGU9ImRhdGUiIGNsYXNzPSJpbnAiIGlkPSInICsgaWQgKyAnIiB2',
  'YWx1ZT0iJyArIGVzYyh2IHx8ICcnKSArICciPic7CgogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICdudW1iZXInIHx8IGYudHlwZSA9PT0gJ21vbmV5JykgewogICAgICBpbm5lciA9ICc8aW5wdXQgdHlwZT0ibnVtYmVyIiBzdGVwPSInICsgKGYudHlwZSA9PT0g',
  'J21vbmV5JyA/ICcwLjAxJyA6ICcxJykgKyAnIiBjbGFzcz0iaW5wIiBpZD0iJyArIGlkICsgJyIgJyArCiAgICAgICAgICAgICAgJ3ZhbHVlPSInICsgKHYgPT0gbnVsbCB8fCB2ID09PSAnJyA/ICcnIDogZXNjKHYpKSArICciIHBsYWNlaG9sZGVyPSInICsgZXNj',
  'KGYucGh8fCcnKSArICciIGlucHV0bW9kZT0iZGVjaW1hbCInICsKICAgICAgICAgICAgICAoZi5zdW1zID8gJyBvbmlucHV0PSJyZWNhbGNTdW1zKCkiJyA6ICcnKSArICc+JzsKCiAgICB9IGVsc2UgewogICAgICBpbm5lciA9ICc8aW5wdXQgdHlwZT0idGV4dCIg',
  'Y2xhc3M9ImlucCIgaWQ9IicgKyBpZCArICciIHZhbHVlPSInICsgZXNjKHYgfHwgJycpICsgJyIgcGxhY2Vob2xkZXI9IicgKyBlc2MoZi5waHx8JycpICsgJyI+JzsKICAgIH0KCiAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImYnICsgKGYuZnVsbCA/ICcgZnVsbCcg',
  'OiAnJykgKyAnIj4nICsKICAgICAgJzxsYWJlbCBmb3I9IicgKyBpZCArICciPicgKyBlc2MoZi5sYWJlbCkgKyAoZi5yZXF1aXJlZCA/ICcgPHNwYW4gc3R5bGU9ImNvbG9yOnZhcigtLWRhbmdlcikiPio8L3NwYW4+JyA6ICcnKSArICc8L2xhYmVsPicgKwogICAg',
  'ICBpbm5lciArIChmLmhpbnQgPyAnPGRpdiBjbGFzcz0iaGludCI+JyArIGVzYyhmLmhpbnQpICsgJzwvZGl2PicgOiAnJykgKyAnPC9kaXY+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwp9CgovKiog4Lit4Lix4Lib4LmA4LiU4LiV4LiK4LmI4Lit4LiH4Lic',
  '4Lil4Lij4Lin4Lih4LiX4Li44LiB4LiK4LmI4Lit4LiH4LmD4LiZ4Lif4Lit4Lij4LmM4Lih4Lib4Lix4LiI4LiI4Li44Lia4Lix4LiZICovCmZ1bmN0aW9uIHJlY2FsY1N1bXMoKXsKICAoRk9STS5zcGVjcyB8fCBbXSkuZm9yRWFjaChmdW5jdGlvbihmKXsKICAg',
  'IGlmIChmLnR5cGUgIT09ICdjb21wdXRlZCcgfHwgIWYuZnJvbSkgcmV0dXJuOwogICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyArIGYua2V5KTsKICAgIGlmICghZWwpIHJldHVybjsKICAgIHZhciB0b3RhbCA9IDA7CiAgICBmLmZyb20u',
  'Zm9yRWFjaChmdW5jdGlvbihrKXsKICAgICAgdmFyIGkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl8nICsgayk7CiAgICAgIGlmIChpKSB0b3RhbCArPSBOdW1iZXIoaS52YWx1ZSkgfHwgMDsKICAgIH0pOwogICAgZWwudGV4dENvbnRlbnQgPSB0b3RhbC50',
  'b0xvY2FsZVN0cmluZygndGgtVEgnLCB7IG1pbmltdW1GcmFjdGlvbkRpZ2l0czogMCwgbWF4aW11bUZyYWN0aW9uRGlnaXRzOiAyIH0pICsgJyDguL8nOwogICAgZWwuc3R5bGUuY29sb3IgPSB0b3RhbCA+IDAgPyAndmFyKC0tb2spJyA6ICd2YXIoLS1tdXRlZCkn',
  'OwogIH0pOwp9CgpmdW5jdGlvbiBleGlzdGluZ0ZpbGVzSHRtbChrZXkpewogIHZhciBsaXN0ID0gRk9STS5rZWVwW2tleV0gfHwgW107CiAgaWYgKCFsaXN0Lmxlbmd0aCkgcmV0dXJuICcnOwogIHJldHVybiAnPGRpdiBjbGFzcz0idGh1bWJzIG1iOCI+JyArIGxp',
  'c3QubWFwKGZ1bmN0aW9uKHVybCwgaSl7CiAgICB2YXIgaWQgPSBTdHJpbmcodXJsKS5tYXRjaCgvWy1cd117MjAsfS8pOwogICAgdmFyIHRodW1iID0gaWQgPyAnaHR0cHM6Ly9kcml2ZS5nb29nbGUuY29tL3RodW1ibmFpbD9pZD0nICsgaWRbMF0gKyAnJnN6PXcy',
  'MDAnIDogJyc7CiAgICByZXR1cm4gJzxzcGFuIHN0eWxlPSJwb3NpdGlvbjpyZWxhdGl2ZTtkaXNwbGF5OmlubGluZS1ibG9jayI+JyArCiAgICAgICh0aHVtYiA/ICc8aW1nIGNsYXNzPSJ0aHVtYiIgc3JjPSInICsgZXNjKHRodW1iKSArICciIG9uY2xpY2s9Indp',
  'bmRvdy5vcGVuKFwnJyArIGVzYyh1cmwpICsgJ1wnLFwnX2JsYW5rXCcpIj4nCiAgICAgICAgICAgICA6ICc8YSBjbGFzcz0iYiBpbmZvIiBocmVmPSInICsgZXNjKHVybCkgKyAnIiB0YXJnZXQ9Il9ibGFuayI+4LmE4Lif4Lil4LmMICcgKyAoaSsxKSArICc8L2E+',
  'JykgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIG9uY2xpY2s9ImRyb3BGaWxlKFwnJyArIGtleSArICdcJywnICsgaSArICcpIiB0aXRsZT0i4LmA4Lit4Liy4Lit4Lit4LiBIiAnICsKICAgICAgJ3N0eWxlPSJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6LTZw',
  'eDtyaWdodDotNnB4O2JhY2tncm91bmQ6dmFyKC0tZGFuZ2VyKTtjb2xvcjojZmZmO2JvcmRlcjowO2JvcmRlci1yYWRpdXM6OTlweDt3aWR0aDoxOHB4O2hlaWdodDoxOHB4O2xpbmUtaGVpZ2h0OjE7Y3Vyc29yOnBvaW50ZXI7Zm9udC1zaXplOjEycHgiPsOXPC9i',
  'dXR0b24+JyArCiAgICAgICc8L3NwYW4+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwp9CgpmdW5jdGlvbiBkcm9wRmlsZShrZXksIGlkeCl7CiAgRk9STS5rZWVwW2tleV0uc3BsaWNlKGlkeCwgMSk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyAr',
  'IGtleSArICdfZXhpc3RpbmcnKS5pbm5lckhUTUwgPSBleGlzdGluZ0ZpbGVzSHRtbChrZXkpOwp9CgpmdW5jdGlvbiBwcmV2aWV3UGlja2VkKGlucHV0LCBpZCl7CiAgdmFyIGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkICsgJ19wcmV2aWV3Jyk7CiAg',
  'dmFyIGZpbGVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoaW5wdXQuZmlsZXMgfHwgW10pOwogIGJveC5pbm5lckhUTUwgPSBmaWxlcy5tYXAoZnVuY3Rpb24oZil7CiAgICByZXR1cm4gJzxzcGFuIGNsYXNzPSJiIGluZm8iPicgKyBlc2MoZi5uYW1lLnNs',
  'aWNlKDAsMjYpKSArICcgwrcgJyArIE1hdGgucm91bmQoZi5zaXplLzEwMjQpICsgJyBLQjwvc3Bhbj4nOwogIH0pLmpvaW4oJyAnKTsKfQoKLyoqIOC4reC5iOC4suC4meC4hOC5iOC4suC4iOC4suC4geC4n+C4reC4o+C5jOC4oSArIOC4reC4seC4m+C5guC4q+C4',
  'peC4lOC5hOC4n+C4peC5jOC5g+C4q+C4oeC5iCDguYHguKXguYnguKfguITguLfguJkgb2JqZWN0IOC4nuC4o+C5ieC4reC4oeC4muC4seC4meC4l+C4tuC4gSAqLwpmdW5jdGlvbiByZWFkRm9ybShzcGVjcywgYnVja2V0KXsKICB2YXIgb3V0ID0ge307CiAgdmFy',
  'IHVwbG9hZHMgPSBbXTsKCiAgc3BlY3MuZm9yRWFjaChmdW5jdGlvbihmKXsKICAgIGlmIChmLnR5cGUgPT09ICdjb21wdXRlZCcpIHJldHVybjsgICAgICAgICAgLy8g4LiK4LmI4Lit4LiH4LiE4Liz4LiZ4Lin4LiTIOC5hOC4oeC5iOC4leC5ieC4reC4h+C4muC4',
  'seC4meC4l+C4tuC4gQogICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyArIGYua2V5KTsKICAgIGlmICghZWwpIHJldHVybjsKICAgIGlmIChmLnR5cGUgPT09ICdmaWxlcycpIHsKICAgICAgdXBsb2Fkcy5wdXNoKAogICAgICAgIHVwbG9h',
  'ZEZpbGVzKGVsLCBidWNrZXQpLnRoZW4oZnVuY3Rpb24ocmVmcyl7CiAgICAgICAgICBvdXRbZi5rZXldID0gKEZPUk0ua2VlcFtmLmtleV0gfHwgW10pLmNvbmNhdChyZWZzLm1hcChmdW5jdGlvbihyKXsgcmV0dXJuIHIudXJsOyB9KSk7CiAgICAgICAgfSkKICAg',
  'ICAgKTsKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnbnVtYmVyJyB8fCBmLnR5cGUgPT09ICdtb25leScpIHsKICAgICAgb3V0W2Yua2V5XSA9IGVsLnZhbHVlID09PSAnJyA/IG51bGwgOiBOdW1iZXIoZWwudmFsdWUpOwogICAgfSBlbHNlIHsKICAgICAgb3V0',
  'W2Yua2V5XSA9IGVsLnZhbHVlOwogICAgfQogIH0pOwoKICByZXR1cm4gUHJvbWlzZS5hbGwodXBsb2FkcykudGhlbihmdW5jdGlvbigpeyByZXR1cm4gb3V0OyB9KTsKfQoKLyoqIOC5guC4hOC4o+C4h+C4n+C4reC4o+C5jOC4oeC4oeC4suC4leC4o+C4kOC4suC4',
  'mTog4LmA4Lib4Li04LiUIG1vZGFsLCDguIjguLHguJTguIHguLLguKPguJvguLjguYjguKHguJrguLHguJnguJfguLbguIEsIOC4o+C4teC5guC4q+C4peC4lOC4q+C4meC5ieC4siAqLwpmdW5jdGlvbiBvcGVuRm9ybShvcHRzKXsKICB2YXIgcmVjID0gb3B0cy5y',
  'ZWNvcmQgfHwge307CiAgb3Blbk1vZGFsKG9wdHMudGl0bGUsCiAgICBmaWVsZHNIdG1sKG9wdHMuZmllbGRzLCByZWMpLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsK',
  'ICAgIChyZWMuaWQgJiYgb3B0cy5vbkRlbGV0ZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4gZGdyIiBpZD0iZkRlbCI+4Lil4Lia4Lij4Liy4Lii4LiB4Liy4Lij4LiZ4Li14LmJPC9idXR0b24+JyA6ICcnKSArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgaWQ9',
  'ImZTYXZlIj4nICsgKHJlYy5pZCA/ICfguJrguLHguJnguJfguLbguIHguIHguLLguKPguYHguIHguYnguYTguIInIDogJ+C4muC4seC4meC4l+C4tuC4gScpICsgJzwvYnV0dG9uPicsCiAgICBvcHRzLndpZGUpOwoKICBpZiAocmVjLmlkICYmIG9wdHMub25EZWxl',
  'dGUpIHsKICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmRGVsJykub25jbGljayA9IGZ1bmN0aW9uKCl7IGNsb3NlTW9kYWwoKTsgb3B0cy5vbkRlbGV0ZShyZWMuaWQpOyB9OwogIH0KCiAgcmVjYWxjU3VtcygpOwoKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJ',
  'ZCgnZlNhdmUnKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsKICAgIHZhciBidG4gPSB0aGlzOwogICAgYnRuLmRpc2FibGVkID0gdHJ1ZTsKICAgIGJ0bi5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4Lia4Lix4LiZ',
  '4LiX4Li24LiB4oCmJzsKCiAgICByZWFkRm9ybShvcHRzLmZpZWxkcywgb3B0cy5idWNrZXQgfHwgJ21pc2MnKS50aGVuKGZ1bmN0aW9uKGRhdGEpewogICAgICB2YXIgbWlzc2luZyA9IG9wdHMuZmllbGRzLmZpbHRlcihmdW5jdGlvbihmKXsKICAgICAgICByZXR1',
  'cm4gZi5yZXF1aXJlZCAmJiAoZGF0YVtmLmtleV0gPT0gbnVsbCB8fCBkYXRhW2Yua2V5XSA9PT0gJycpOwogICAgICB9KTsKICAgICAgaWYgKG1pc3NpbmcubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoJ+C4geC4o+C4uOC4k+C4suC4geC4o+C4reC4gTogJyArIG1p',
  'c3NpbmcubWFwKGZ1bmN0aW9uKGYpeyByZXR1cm4gZi5sYWJlbDsgfSkuam9pbignLCAnKSk7CgogICAgICB2YXIgcmVjb3JkID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0cy5iYXNlIHx8IHt9LCBkYXRhKTsKICAgICAgaWYgKHJlYy5pZCkgcmVjb3JkLmlkID0gcmVj',
  'LmlkOwogICAgICByZXR1cm4gY2FsbEFwaShvcHRzLmFjdGlvbiwgT2JqZWN0LmFzc2lnbih7IHJlY29yZDogcmVjb3JkIH0sIG9wdHMuZXh0cmEgfHwge30pKTsKICAgIH0pLnRoZW4oZnVuY3Rpb24oKXsKICAgICAgY2xvc2VNb2RhbCgpOwogICAgICB0b2FzdCgn',
  '4Lia4Lix4LiZ4LiX4Li24LiB4LmA4Lij4Li14Lii4Lia4Lij4LmJ4Lit4LiiJywgJ29rJyk7CiAgICAgIGxvYWQoKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTsKICAgICAgYnRuLnRleHRDb250ZW50ID0gcmVj',
  'LmlkID8gJ+C4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C5geC4geC5ieC5hOC4gicgOiAn4Lia4Lix4LiZ4LiX4Li24LiBJzsKICAgICAgdG9hc3QoZS5tZXNzYWdlIHx8IGUsICdlcnInKTsKICAgIH0pOwogIH07Cn0KCmZ1bmN0aW9uIHJvb21PcHRpb25zKCl7',
  'IHJldHVybiBTLmJvb3QgPyBTLmJvb3Qucm9vbXMgOiBbXTsgfQpmdW5jdGlvbiBvcHQobmFtZSl7IHJldHVybiAoUy5ib290ICYmIFMuYm9vdC5zY2hlbWFbbmFtZV0pIHx8IFtdOyB9CmZ1bmN0aW9uIHRvZGF5KCl7IHJldHVybiBuZXcgRGF0ZSgpLnRvSVNPU3Ry',
  'aW5nKCkuc2xpY2UoMCwxMCk7IH0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3guKPguYzguKE6IOC4geC5ieC4reC4meC4q+C4meC4teC5iQogICA9PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybURlYnQocmVjLCBsZWRnZXIpewogIC8vIOC5gOC4peC4t+C4reC4geC5geC4oeC5iOC5hOC4lOC5ieC4iOC4suC4geC4l+C4uOC4geC4muC4seC4jeC4iuC4',
  'tSDguKLguIHguYDguKfguYnguJnguJXguLHguKfguYDguK3guIcKICB2YXIgYWxsID0gKEFMTF9ERUJUUyB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uKGQpeyByZXR1cm4gIXJlYyB8fCBkLmlkICE9PSByZWMuaWQ7IH0pOwogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiBy',
  'ZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4geC5ieC4reC4meC4q+C4meC4teC5iScgOiAn4LmA4Lie4Li04LmI4Lih4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJJywKICAgIHJlY29yZDogcmVjLCBhY3Rpb246ICdkZWJ0LnNhdmUnLCBiYXNlOiB7IGxl',
  'ZGdlcjogbGVkZ2VyIH0sCiAgICBvbkRlbGV0ZTogZGVsRGVidCwKICAgIGZpZWxkczogWwogICAgICB7IGtleTondGl0bGUnLCAgICBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4Lij4Lir4LiZ4Li14LmJJywgcmVxdWlyZWQ6dHJ1ZSwgZnVsbDp0cnVlLCBwaDon4LmA',
  '4LiK4LmI4LiZIOC4hOC5iOC4suC4geC5iOC4reC4quC4o+C5ieC4suC4hyBUaGUgTSBDb3JuZXIgQVAnIH0sCiAgICAgIHsga2V5OidsZWRnZXInLCAgIGxhYmVsOifguJvguKPguLDguYDguKDguJfguJrguLHguI3guIrguLUnLCB0eXBlOidzZWxlY3QnLCBvcHRp',
  'b25zOlsn4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiBJywn4Lir4LiZ4Li14LmJ4Lij4Lit4LiHJ10sIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5OidjcmVkaXRvcicsIGxhYmVsOifguYDguIjguYnguLLguKvguJnguLXguYknLCBwaDon4LmA4LiK4LmI4LiZIOC4',
  'hOC4o+C4reC4muC4hOC4o+C4seC4pyAvIOC4mOC4meC4suC4hOC4suC4oyAvIOC4m+C5ieC4suC4leC4sicgfSwKICAgICAgeyBrZXk6J3BhcmVudElkJywgbGFiZWw6J+C5gOC4m+C5h+C4meC4quC5iOC4p+C4meC4q+C4meC4tuC5iOC4h+C4guC4reC4h+C4geC5',
  'ieC4reC4meC4q+C4meC4teC5iScsIHR5cGU6J3NlbGVjdCcsIGZ1bGw6dHJ1ZSwKICAgICAgICBvcHRpb25zOiBhbGwubWFwKGZ1bmN0aW9uKGQpeyByZXR1cm4geyB2YWx1ZTpkLmlkLCBsYWJlbDpkLnRpdGxlICsgJyAoJyArIGQubGVkZ2VyICsgJyknIH07IH0p',
  'LAogICAgICAgIGhpbnQ6J+C5g+C4iuC5ieC5gOC4oeC4t+C5iOC4reC5gOC4h+C4tOC4meC4geC5ieC4reC4meC4meC4teC5ieC5gOC4m+C5h+C4meC4l+C4uOC4meC4guC4reC4h+C4reC4teC4geC4geC5ieC4reC4mSDguYDguIrguYjguJkg4LmA4LiH4Li04LiZ',
  '4Lii4Li34Lih4Lib4LmJ4Liy4LiV4Liy4LmA4Lib4LmH4LiZ4Liq4LmI4Lin4LiZ4Lir4LiZ4Li24LmI4LiH4LiC4Lit4LiH4Lir4LiZ4Li14LmJ4LiL4Li34LmJ4Lit4LiX4Li14LmI4LiU4Li04LiZIOKAlCAnICsKICAgICAgICAgICAgICfguIjguYjguLLguKLg',
  'uITguLfguJnguIHguYnguK3guJnguJnguLXguYnguYHguKXguYnguKfguIHguYnguK3guJnguYHguKHguYjguIjguLDguKXguJTguJXguLLguKHguYTguJvguJTguYnguKfguKIg4LmB4Lil4Liw4Lii4Lit4LiU4Lij4Lin4Lih4LiI4Liw4LmE4Lih4LmI4LiW4Li5',
  '4LiB4LiZ4Lix4Lia4LiL4LmJ4LizJyB9LAogICAgICB7IGtleTonc3RhcnREYXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4geC5iOC4reC4q+C4meC4teC5iScsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidwcmluY2lwYWwnLCBsYWJlbDon4Lii',
  '4Lit4LiU4Lir4LiZ4Li14LmJ4LiV4Lix4LmJ4LiH4LiV4LmJ4LiZICjguJrguLLguJcpJywgdHlwZTonbW9uZXknLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidpbnRlcmVzdFBlck1vbnRoJywgbGFiZWw6J+C4lOC4reC4geC5gOC4muC4teC5ieC4ouC4',
  'leC5iOC4reC5gOC4lOC4t+C4reC4mSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JyB9LAogICAgICB7IGtleToncGxhblBlck1vbnRoJywgbGFiZWw6J+C4ouC4reC4lOC4nOC5iOC4reC4meC4leC5iOC4reC5gOC4lOC4t+C4reC4mSAo4Lia4Liy4LiXKScsIHR5',
  'cGU6J21vbmV5JyB9LAogICAgICB7IGtleTonZHVlRGF5JywgICBsYWJlbDon4LiB4Liz4Lir4LiZ4LiU4LiK4Liz4Lij4LiwICjguKfguLHguJnguJfguLXguYjguILguK3guIfguYDguJTguLfguK3guJkpJywgdHlwZTonbnVtYmVyJywgcGg6JzIwJyB9LAogICAg',
  'ICB7IGtleTonc3RhdHVzJywgICBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ2RlYnRTdGF0dXNlcycpLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleTonbm90ZScsICAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA',
  '4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwogIGlmICghcmVjKSB7IHZhciBlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfbGVkZ2VyJyk7IGlmIChlKSBlLnZhbHVlID0gbGVkZ2VyOyB9Cn0KCmZ1bmN0aW9u',
  'IGRlbERlYnQoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4geC5ieC4reC4meC4q+C4meC4teC5ieC4meC4teC5iT8g4Lij4Liy4Lii4LiB4Liy4Lij4LiK4Liz4Lij4Liw4LiX4Li14LmI4Lic4Li54LiB4LmE4Lin4LmJ4LiI4Liw4Lii4Lix4LiH4Lit4Lii',
  '4Li54LmIJywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2RlYnQuZGVsZXRlJywgeyBpZDogaWQgfSkudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCgpOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRv',
  'YXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguKPguLLguKLguIHguLLguKPguYLguK3guJng',
  'uYPguIrguYnguKvguJnguLXguYkKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1EZWJ0UGF5bWVudChyZWMsIGxlZGdlcil7CiAgdmFyIGRlYnRzID0gKFMuY2FjaGVb',
  'Uy5wYWdlXSAmJiBTLmNhY2hlW1MucGFnZV0uZGVidHMpIHx8IFtdOwogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4o+C4suC4ouC4geC4suC4o+C4iuC4s+C4o+C4sCcgOiAn4Lia4Lix4LiZ4LiX4Li24LiB',
  '4LiB4Liy4Lij4LmC4Lit4LiZ4LmD4LiK4LmJ4Lir4LiZ4Li14LmJJywKICAgIHJlY29yZDogcmVjIHx8IHsgcGF5RGF0ZTogdG9kYXkoKSwgY2hhbm5lbDogJ+C5guC4reC4mSBRUicgfSwKICAgIGFjdGlvbjogJ2RlYnQuc2F2ZVBheW1lbnQnLCBiYXNlOiB7IGxl',
  'ZGdlcjogbGVkZ2VyIH0sIGJ1Y2tldDogJ2RlYnQnLAogICAgb25EZWxldGU6IGRlbERlYnRQYXltZW50LAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5OidwYXlEYXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4iuC4s+C4o+C4sCcsIHR5cGU6J2RhdGUn',
  'LCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidjaGFubmVsJywgbGFiZWw6J+C4iuC5iOC4reC4h+C4l+C4suC4hycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdwYXlDaGFubmVscycpIH0sCiAgICAgIHsga2V5OidwcmluY2lwYWwnLCBsYWJlbDon',
  '4LmA4LiH4Li04LiZ4LiV4LmJ4LiZICjguJrguLLguJcpJywgdHlwZTonbW9uZXknLCBzdW1zOnRydWUsCiAgICAgICAgaGludDon4Liq4LmI4Lin4LiZ4LiX4Li14LmI4LmE4Lib4Lil4LiU4Lii4Lit4LiU4Lir4LiZ4Li14LmJ4LiI4Lij4Li04LiHJyB9LAogICAg',
  'ICB7IGtleTonaW50ZXJlc3QnLCAgbGFiZWw6J+C4lOC4reC4geC5gOC4muC4teC5ieC4oiAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5Jywgc3Vtczp0cnVlLAogICAgICAgIGhpbnQ6J+C5hOC4oeC5iOC4luC4ueC4geC4meC4s+C5hOC4m+C4peC4lOC4ouC4reC4',
  'lOC4q+C4meC4teC5iScgfSwKICAgICAgeyBrZXk6J190b3RhbCcsICBsYWJlbDon4Lij4Lin4Lih4LiX4Li14LmI4LmC4Lit4LiZJywgdHlwZTonY29tcHV0ZWQnLCBmcm9tOlsncHJpbmNpcGFsJywnaW50ZXJlc3QnXSwKICAgICAgICBoaW50OifguJXguKPguKfg',
  'uIjguYPguKvguYnguJXguKPguIfguIHguLHguJrguKLguK3guJTguYPguJnguKrguKXguLTguJsgwrcg4Lij4Liw4Lia4Lia4LiE4Li04LiU4LmD4Lir4LmJ4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0JyB9LAogICAgICB7IGtleTonaW5zdGFsbG1lbnQnLCBs',
  'YWJlbDon4LiH4Lin4LiU4LiX4Li14LmIJywgcGg6J+C5gOC4iuC5iOC4mSA5LzI1NjknIH0sCiAgICAgIHsga2V5OidkZWJ0SWQnLCAgbGFiZWw6J+C4nOC4ueC4geC4geC4seC4muC4geC5ieC4reC4meC4q+C4meC4teC5iScsIHR5cGU6J3NlbGVjdCcsCiAgICAg',
  'ICAgb3B0aW9uczogZGVidHMubWFwKGZ1bmN0aW9uKGQpeyByZXR1cm4geyB2YWx1ZTpkLmlkLCBsYWJlbDpkLnRpdGxlIH07IH0pLAogICAgICAgIGhpbnQ6J+C5gOC4p+C5ieC4meC4p+C5iOC4suC4h+C5hOC4lOC5iSDigJQg4Lij4Liw4Lia4Lia4LiI4Liw4LiZ',
  '4Lix4Lia4Lij4Lin4Lih4LiX4Lix4LmJ4LiH4Lia4Lix4LiN4LiK4Li1JyB9LAogICAgICB7IGtleToncGF5ZXInLCAgIGxhYmVsOifguJzguLnguYnguIrguLPguKPguLAnIH0sCiAgICAgIHsga2V5OidzbGlwcycsICAgbGFiZWw6J+C4quC4peC4tOC4m+C4geC4',
  'suC4o+C5guC4reC4mScsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0KICB9KTsKfQoKZnVuY3Rp',
  'b24gZGVsRGVidFBheW1lbnQoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4o+C4suC4ouC4geC4suC4o+C4iuC4s+C4o+C4sOC4meC4teC5iT8nLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgnZGVidC5kZWxldGVQYXltZW50JywgeyBpZDogaWQgfSkudGhl',
  'bihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCgpOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1QdXJjaGFzZShyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4rScgOiAn4LmA4Lie4Li04LmI4Lih',
  '4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHJywKICAgIHJlY29yZDogcmVjIHx8IHsgYnV5RGF0ZTogdG9kYXkoKSB9LAogICAgYWN0aW9uOiAncHVyY2hhc2Uuc2F2ZScsIGJ1Y2tldDogJ3B1cmNoYXNlcycsIHdpZGU6IHRydWUsCiAgICBv',
  'bkRlbGV0ZTogZGVsUHVyY2hhc2UsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J2l0ZW0nLCAgICBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4Lij4Liq4Li04LiZ4LiE4LmJ4LiyJywgdHlwZTondGV4dGFyZWEnLCByZXF1aXJlZDp0cnVlLCBmdWxsOnRydWUsIHBo',
  'OifguIrguLfguYjguK3guKrguLTguJnguITguYnguLIgLyDguKPguLjguYjguJkgLyDguKPguLLguKLguKXguLDguYDguK3guLXguKLguJQnIH0sCiAgICAgIHsga2V5OididXlEYXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4i+C4t+C5ieC4rScsIHR5',
  'cGU6J2RhdGUnLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidjYXRlZ29yeScsIGxhYmVsOifguKvguKHguKfguJTguKvguKHguLnguYgnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncHVyY2hhc2VDYXRlZ29yaWVzJykgfSwKICAgICAgeyBrZXk6',
  'J3F0eScsICAgICBsYWJlbDon4LiI4Liz4LiZ4Lin4LiZJywgdHlwZTonbnVtYmVyJyB9LAogICAgICB7IGtleTondW5pdCcsICAgIGxhYmVsOifguKvguJnguYjguKfguKInLCBwaDon4LiK4Li04LmJ4LiZIC8g4LiK4Li44LiUIC8g4LmA4LiE4Lij4Li34LmI4Lit',
  '4LiHJyB9LAogICAgICB7IGtleToncHJpY2UnLCAgIGxhYmVsOifguKPguLLguITguLLguKPguKfguKEgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHJlcXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J3ZlbmRvcicsICBsYWJlbDon4LmB4Lir4Lil4LmI4LiH',
  '4LiX4Li14LmI4LiL4Li34LmJ4LitJywgcGg6J1Nob3BlZSAvIOC5hOC4l+C4p+C4seC4quC4lOC4uCAvIOC4o+C5ieC4suC4meKApicgfSwKICAgICAgeyBrZXk6J3BheWVyJywgICBsYWJlbDon4Lic4Li54LmJ4LiK4Liz4Lij4LiwJyB9LAogICAgICB7IGtleTon',
  'd2FycmFudHlNb250aHMnLCBsYWJlbDon4Lij4Liw4Lii4Liw4LmA4Lin4Lil4Liy4Lij4Lix4Lia4Lib4Lij4Liw4LiB4Lix4LiZICjguYDguJTguLfguK3guJkpJywgdHlwZTonbnVtYmVyJywKICAgICAgICBoaW50OifguKPguLDguJrguJrguIjguLDguITguLPg',
  'uJnguKfguJPguKfguLHguJnguKvguKHguJTguJvguKPguLDguIHguLHguJnguYPguKvguYnguK3guLHguJXguYLguJnguKHguLHguJXguLQnIH0sCiAgICAgIHsga2V5Oidyb29tJywgICAgbGFiZWw6J+C4q+C5ieC4reC4hy/guJ7guLfguYnguJnguJfguLXguYjg',
  'uJfguLXguYjguYPguIrguYknLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOlsn4Liq4LmI4Lin4LiZ4LiB4Lil4Liy4LiHJ10uY29uY2F0KHJvb21PcHRpb25zKCkpIH0sCiAgICAgIHsga2V5OidwaG90b3MnLCAgbGFiZWw6J+C4oOC4suC4nuC4m+C4o+C4sOC4geC4',
  'reC4muC4quC4tOC4meC4hOC5ieC4sicsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5OidzbGlwcycsICAgbGFiZWw6J+C4quC4peC4tOC4m+C4geC4suC4o+C5guC4reC4meC4iuC4s+C4o+C4sCcsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVl',
  'IH0sCiAgICAgIHsga2V5Oidub3RlJywgICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0KICB9KTsKfQoKZnVuY3Rpb24gZGVsUHVyY2hhc2UoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4',
  'peC4muC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4meC4teC5iT8nLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgncHVyY2hhc2UuZGVsZXRlJywgeyBpZDogaWQgfSkudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2sn',
  'KTsgbG9hZCgpOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif',
  '4Lit4Lij4LmM4LihOiDguKXguYnguLLguIfguYHguK3guKPguYwKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1BYyhyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxl',
  'OiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4o+C4suC4ouC4geC4suC4o+C4peC5ieC4suC4h+C5geC4reC4o+C5jCcgOiAn4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJywKICAgIHJlY29yZDogcmVj',
  'IHx8IHsgYm9va0RhdGU6IHRvZGF5KCkgfSwKICAgIGFjdGlvbjogJ2FjLnNhdmUnLCBidWNrZXQ6ICdhYycsCiAgICBvbkRlbGV0ZTogZGVsQWMsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3Jvb20nLCAgICAgICAgbGFiZWw6J+C4q+C5ieC4reC4hycsIHR5',
  'cGU6J3NlbGVjdCcsIG9wdGlvbnM6cm9vbU9wdGlvbnMoKSwgcmVxdWlyZWQ6dHJ1ZSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J3JvdW5kJywgICAgICAgbGFiZWw6J+C4o+C4reC4muC4l+C4teC5iCcsIHR5cGU6J251bWJlcicsIGhpbnQ6J+C5gOC4p+C5',
  'ieC4meC4p+C5iOC4suC4h+C5g+C4q+C5ieC4o+C4sOC4muC4muC4meC4seC4muC4leC5iOC4reC4iOC4suC4geC4o+C4reC4muC4peC5iOC4suC4quC4uOC4lOC4guC4reC4h+C4m+C4teC4meC4seC5ieC4mScgfSwKICAgICAgeyBrZXk6J2Jvb2tEYXRlJywgICAg',
  'bGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4meC4seC4lOC4peC5ieC4suC4h+C5geC4reC4o+C5jCcsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidzZXJ2aWNlRGF0ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguJTguLPguYDguJnguLTguJnguIHg',
  'uLLguKPguIjguKPguLTguIcnLCB0eXBlOidkYXRlJywgaGludDon4LiB4Lij4Lit4LiB4LmA4Lih4Li34LmI4Lit4Lil4LmJ4Liy4LiH4LmA4Liq4Lij4LmH4LiI4LmB4Lil4LmJ4LinJyB9LAogICAgICB7IGtleTonc3RhdHVzJywgICAgICBsYWJlbDon4Liq4LiW',
  '4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ2FjU3RhdHVzZXMnKSB9LAogICAgICB7IGtleTondGVjaG5pY2lhbicsICBsYWJlbDon4LiK4LmI4Liy4LiHIC8g4Lic4Li54LmJ4LmD4Lir4LmJ4Lia4Lij4Li04LiB4Liy4LijJyB9LAogICAg',
  'ICB7IGtleTonY29zdCcsICAgICAgICBsYWJlbDon4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiICjguJrguLLguJcpJywgdHlwZTonbW9uZXknIH0sCiAgICAgIHsga2V5OidwaG90b3MnLCAgICAgIGxhYmVsOifguKDguLLguJ7guJvguKPguLDguIHguK3g',
  'uJonLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonbm90ZScsICAgICAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxB',
  'YyhpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4Lij4Liy4Lii4LiB4Liy4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdhYy5kZWxldGUnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7',
  'IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKCk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qKiDguJnguLHguJTguKXguYnguLLguIfguYHguK3guKPguYzg',
  'uKvguKXguLLguKLguKvguYnguK3guIfguJ7guKPguYnguK3guKHguIHguLHguJkgKi8KZnVuY3Rpb24gZm9ybUJ1bGtBYygpewogIHZhciByb29tcyA9IHJvb21PcHRpb25zKCk7CiAgdmFyIGJvZHkgPQogICAgJzxkaXYgY2xhc3M9ImZncmlkIj4nICsKICAgICAg',
  'JzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7guKfguLHguJnguJfguLXguYjguJnguLHguJQgPHNwYW4gc3R5bGU9ImNvbG9yOnZhcigtLWRhbmdlcikiPio8L3NwYW4+PC9sYWJlbD4nICsKICAgICAgICAnPGlucHV0IHR5cGU9ImRhdGUiIGNsYXNzPSJpbnAiIGlkPSJi',
  'a19kYXRlIiB2YWx1ZT0iJyArIHRvZGF5KCkgKyAnIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7guIrguYjguLLguIcgLyDguJzguLnguYnguYPguKvguYnguJrguKPguLTguIHguLLguKM8L2xhYmVsPjxpbnB1dCBjbGFzcz0iaW5wIiBp',
  'ZD0iYmtfdGVjaCI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIj48bGFiZWw+4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4LiV4LmI4Lit4Lir4LmJ4Lit4LiHICjguJrguLLguJcpPC9sYWJlbD48aW5wdXQgdHlwZT0ibnVtYmVyIiBjbGFzcz0i',
  'aW5wIiBpZD0iYmtfY29zdCI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIj48bGFiZWw+4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4PC9sYWJlbD48aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImJrX25vdGUiPjwvZGl2PicgKwogICAgJzwvZGl2PicgKwogICAg',
  'JzxkaXYgY2xhc3M9ImhyIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbWI4Ij48YiBjbGFzcz0iZnMxMyI+4LmA4Lil4Li34Lit4LiB4Lir4LmJ4Lit4LiHPC9iPjxzcGFuIGNsYXNzPSJzcCI+PC9zcGFuPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0i',
  'YnRuIHNtIiBvbmNsaWNrPSJidWxrUGljayhcJ2FsbFwnKSI+4LiX4Lix4LmJ4LiH4Lir4Lih4LiUPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImJ1bGtQaWNrKFwnbm9uZVwnKSI+4Lil4LmJ4Liy4LiHPC9idXR0b24+',
  'JyArCiAgICAgIFsxLDIsMyw0LDVdLm1hcChmdW5jdGlvbihmKXsgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImJ1bGtQaWNrKCcgKyBmICsgJykiPuC4iuC4seC5ieC4mSAnICsgZiArICc8L2J1dHRvbj4nOyB9KS5qb2luKCcnKSArCiAg',
  'ICAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0icm9vbXMiIGlkPSJia1Jvb21zIj4nICsgcm9vbXMubWFwKGZ1bmN0aW9uKHIpewogICAgICByZXR1cm4gJzxsYWJlbCBjbGFzcz0icm9vbSIgc3R5bGU9ImN1cnNvcjpwb2ludGVyIj48aW5wdXQgdHlwZT0iY2hl',
  'Y2tib3giIGNsYXNzPSJiayIgdmFsdWU9IicgKyByICsgJyI+IDxiPicgKyByICsgJzwvYj48L2xhYmVsPic7CiAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwoKICBvcGVuTW9kYWwoJ/Cfk4Ug4LiZ4Lix4LiU4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4Lir4Lil',
  '4Liy4Lii4Lir4LmJ4Lit4LiH4Lie4Lij4LmJ4Lit4Lih4LiB4Lix4LiZJywgYm9keSwKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lii4LiB4LmA4Lil4Li04LiBPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0i',
  'YnRuIHByaSIgaWQ9ImJrU2F2ZSI+4Liq4Lij4LmJ4Liy4LiH4LiZ4Lix4LiU4Lir4Lih4Liy4LiiPC9idXR0b24+JywgdHJ1ZSk7CgogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdia1NhdmUnKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsKICAgIHZhciBwaWNrZWQg',
  'PSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYms6Y2hlY2tlZCcpKS5tYXAoZnVuY3Rpb24oYyl7IHJldHVybiBjLnZhbHVlOyB9KTsKICAgIHZhciBkYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Jr',
  'X2RhdGUnKS52YWx1ZTsKICAgIGlmICghcGlja2VkLmxlbmd0aCkgcmV0dXJuIHRvYXN0KCfguYDguKXguLfguK3guIHguK3guKLguYjguLLguIfguJnguYnguK3guKIgMSDguKvguYnguK3guIcnLCAnZXJyJyk7CiAgICBpZiAoIWRhdGUpIHJldHVybiB0b2FzdCgn',
  '4LiB4Lij4Li44LiT4Liy4Lij4Liw4Lia4Li44Lin4Lix4LiZ4LiX4Li14LmI4LiZ4Lix4LiUJywgJ2VycicpOwogICAgdmFyIGJ0biA9IHRoaXM7IGJ0bi5kaXNhYmxlZCA9IHRydWU7IGJ0bi5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g',
  '4LiB4Liz4Lil4Lix4LiH4Lia4Lix4LiZ4LiX4Li24LiB4oCmJzsKICAgIGNhbGxBcGkoJ2FjLmJ1bGtCb29rJywgewogICAgICByb29tczogcGlja2VkLCBib29rRGF0ZTogZGF0ZSwKICAgICAgdGVjaG5pY2lhbjogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Jr',
  'X3RlY2gnKS52YWx1ZSwKICAgICAgY29zdDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JrX2Nvc3QnKS52YWx1ZSwKICAgICAgbm90ZTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JrX25vdGUnKS52YWx1ZQogICAgfSkudGhlbihmdW5jdGlvbihuKXsKICAg',
  'ICAgY2xvc2VNb2RhbCgpOyB0b2FzdCgn4Liq4Lij4LmJ4Liy4LiH4LiZ4Lix4LiU4Lir4Lih4Liy4LiiICcgKyBuICsgJyDguKvguYnguK3guIfguYHguKXguYnguKcnLCAnb2snKTsgbG9hZCgpOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgIGJ0bi5k',
  'aXNhYmxlZCA9IGZhbHNlOyBidG4udGV4dENvbnRlbnQgPSAn4Liq4Lij4LmJ4Liy4LiH4LiZ4Lix4LiU4Lir4Lih4Liy4LiiJzsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7CiAgICB9KTsKICB9Owp9CgpmdW5jdGlvbiBidWxrUGljayh3aGF0KXsKICBkb2N1',
  'bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYmsnKS5mb3JFYWNoKGZ1bmN0aW9uKGMpewogICAgaWYgKHdoYXQgPT09ICdhbGwnKSBjLmNoZWNrZWQgPSB0cnVlOwogICAgZWxzZSBpZiAod2hhdCA9PT0gJ25vbmUnKSBjLmNoZWNrZWQgPSBmYWxzZTsKICAgIGVsc2Ug',
  'Yy5jaGVja2VkID0gU3RyaW5nKGMudmFsdWUpLmNoYXJBdCgwKSA9PT0gU3RyaW5nKHdoYXQpOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDg',
  'uIvguYjguK3guKHguYHguIvguKHguJXguLLguKHguKvguYnguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1SZXBhaXIocmVjKXsKICBvcGVuRm9ybSh7CiAg',
  'ICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguIfguLLguJnguIvguYjguK3guKEnIDogJ+C5geC4iOC5ieC4h+C4i+C5iOC4reC4oSAvIOC4muC4seC4meC4l+C4tuC4geC4h+C4suC4meC4i+C5iOC4reC4oScsCiAgICByZWNvcmQ6IHJl',
  'YyB8fCB7IHJlcG9ydERhdGU6IHRvZGF5KCksIHByaW9yaXR5OiAn4Lib4LiB4LiV4Li0JyB9LAogICAgYWN0aW9uOiAncmVwYWlyLnNhdmUnLCBidWNrZXQ6ICdyb29tUmVwYWlyJywgd2lkZTogdHJ1ZSwKICAgIG9uRGVsZXRlOiBkZWxSZXBhaXIsCiAgICBmaWVs',
  'ZHM6IFsKICAgICAgeyBrZXk6J3Jvb20nLCAgICAgICBsYWJlbDon4Lir4LmJ4Lit4LiHJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpyb29tT3B0aW9ucygpLCByZXF1aXJlZDp0cnVlLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleTonY2F0ZWdvcnknLCAgIGxh',
  'YmVsOifguJvguKPguLDguYDguKDguJfguIfguLLguJknLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncmVwYWlyQ2F0ZWdvcmllcycpIH0sCiAgICAgIHsga2V5OidpdGVtcycsICAgICAgbGFiZWw6J+C4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4leC5',
  'ieC4reC4h+C4i+C5iOC4reC4oeC5geC4i+C4oScsIHR5cGU6J3RleHRhcmVhJywgcmVxdWlyZWQ6dHJ1ZSwgZnVsbDp0cnVlLAogICAgICAgIHBoOifguYDguIrguYjguJkgMS7guKLguLLguYHguJnguKcgMi7guYDguIHguYfguJrguKrguLXguKvguYnguK3guIcg',
  'My7guYDguJvguKXguLXguYjguKLguJnguIHguYrguK3guIHguJnguYnguLPguKXguYnguLLguIfguIjguLLguJknIH0sCiAgICAgIHsga2V5OidyZXBvcnREYXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC5geC4iOC5ieC4hycsIHR5cGU6J2RhdGUnIH0s',
  'CiAgICAgIHsga2V5Oidib29rRGF0ZScsICAgbGFiZWw6J+C4p+C4seC4meC4meC4seC4lOC4i+C5iOC4reC4oeC5geC4i+C4oScsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidyZXBhaXJEYXRlJywgbGFiZWw6J+C4p+C4seC4meC5gOC4guC5ieC4suC4i+C5',
  'iOC4reC4oeC5geC4i+C4oScsIHR5cGU6J2RhdGUnLCBoaW50OifguIHguKPguK3guIHguYDguKHguLfguYjguK3guIvguYjguK3guKHguYDguKrguKPguYfguIjguYHguKXguYnguKcnIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCAgICAgbGFiZWw6J+C4quC4luC4',
  'suC4meC4sCcsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdyZXBhaXJTdGF0dXNlcycpIH0sCiAgICAgIHsga2V5Oidwcmlvcml0eScsICAgbGFiZWw6J+C4hOC4p+C4suC4oeC5gOC4o+C5iOC4h+C4lOC5iOC4p+C4mScsIHR5cGU6J3NlbGVjdCcsIG9wdGlv',
  'bnM6b3B0KCdwcmlvcml0aWVzJyksIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5Oid0ZWNobmljaWFuJywgbGFiZWw6J+C4iuC5iOC4suC4h+C4nOC4ueC5ieC4i+C5iOC4reC4oScgfSwKICAgICAgeyBrZXk6J2Nvc3QnLCAgICAgICBsYWJlbDon4LiE4LmI4Liy',
  '4LmD4LiK4LmJ4LiI4LmI4Liy4LiiICjguJrguLLguJcpJywgdHlwZTonbW9uZXknIH0sCiAgICAgIHsga2V5OidwaG90b3NCZWZvcmUnLCBsYWJlbDon4Lig4Liy4Lie4LiB4LmI4Lit4LiZ4LiL4LmI4Lit4LihJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwK',
  'ICAgICAgeyBrZXk6J3Bob3Rvc0FmdGVyJywgIGxhYmVsOifguKDguLLguJ7guKvguKXguLHguIfguIvguYjguK3guKEnLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonbm90ZScsICAgICAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvg',
  'uJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbFJlcGFpcihpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBj',
  'YWxsQXBpKCdyZXBhaXIuZGVsZXRlJywgeyBpZDogaWQgfSkudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCgpOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7',
  'IH0pOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguIvguYjguK3guKHguYHguIvguKHguJXguLbguIHguYLguJTguKLguKPguKfguKEKICAg',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1CdWlsZGluZyhyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4',
  'h+C4suC4meC4i+C5iOC4reC4oeC4leC4tuC4gScgOiAn4LmA4Lie4Li04LmI4Lih4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmC4LiU4Lii4Lij4Lin4LihJywKICAgIHJlY29yZDogcmVjIHx8IHsgYm9va0RhdGU6IHRvZGF5KCkgfSwK',
  'ICAgIGFjdGlvbjogJ2J1aWxkaW5nLnNhdmUnLCBidWNrZXQ6ICdidWlsZGluZycsIHdpZGU6IHRydWUsCiAgICBvbkRlbGV0ZTogZGVsQnVpbGRpbmcsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3pvbmUnLCAgICAgIGxhYmVsOifguKrguYjguKfguJnguILg',
  'uK3guIfguK3guLLguITguLLguKMnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnYnVpbGRpbmdab25lcycpLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5Oid0aXRsZScsICAgICBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4Lij4LiL4LmI4Lit4Lih4LmB',
  '4LiL4LihJywgdHlwZTondGV4dGFyZWEnLCByZXF1aXJlZDp0cnVlLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J2Jvb2tEYXRlJywgIGxhYmVsOifguKfguLHguJnguJfguLXguYjguJnguLHguJQnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonc3RhcnRE',
  'YXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC5gOC4o+C4tOC5iOC4oeC4lOC4s+C5gOC4meC4tOC4meC4geC4suC4oycsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidlbmREYXRlJywgICBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LmB4Lil4LmJ',
  '4Lin4LmA4Liq4Lij4LmH4LiIJywgdHlwZTonZGF0ZScgfSwKICAgICAgeyBrZXk6J3N0YXR1cycsICAgIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnYnVpbGRpbmdTdGF0dXNlcycpIH0sCiAgICAgIHsga2V5Oidj',
  'b250cmFjdG9yJywgbGFiZWw6J+C4nOC4ueC5ieC4o+C4seC4muC5gOC4q+C4oeC4siAvIOC4o+C5ieC4suC4mScgfSwKICAgICAgeyBrZXk6J2Nvc3QnLCAgICAgIGxhYmVsOifguITguYjguLLguYPguIrguYnguIjguYjguLLguKIgKOC4muC4suC4lyknLCB0eXBl',
  'Oidtb25leScgfSwKICAgICAgeyBrZXk6J25leHREdWUnLCAgIGxhYmVsOifguITguKPguJrguIHguLPguKvguJnguJTguKPguK3guJrguJbguLHguJTguYTguJsnLCB0eXBlOidkYXRlJywgaGludDon4LmA4LiK4LmI4LiZIOC4geC4seC4meC4i+C4tuC4oeC4lOC4',
  'suC4lOC4n+C5ieC4suC4l+C4uOC4gSAzIOC4m+C4tSDigJQg4LmD4Liq4LmI4Lin4Lix4LiZ4LiX4Li14LmI4LiE4Lij4Lix4LmJ4LiH4LiW4Lix4LiU4LmE4LibJyB9LAogICAgICB7IGtleToncGhvdG9zJywgICAgbGFiZWw6J+C4oOC4suC4nuC4m+C4o+C4sOC4',
  'geC4reC4micsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5OidzbGlwcycsICAgICBsYWJlbDon4LmD4Lia4LmA4Liq4Lij4LmH4LiIIC8g4Liq4Lil4Li04LibJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J25v',
  'dGUnLCAgICAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbEJ1aWxkaW5nKGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguIfguLLguJnguIvg',
  'uYjguK3guKHguJXguLbguIHguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2J1aWxkaW5nLmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoKTsgfSkKICAg',
  'ICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4LiC',
  '4LmJ4Lit4Lih4Li54Lil4Lir4LmJ4Lit4LiHCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtUm9vbShyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiAn4LiC4LmJ',
  '4Lit4Lih4Li54Lil4Lir4LmJ4Lit4LiHICcgKyAocmVjID8gcmVjLnJvb20gOiAnJyksCiAgICByZWNvcmQ6IHJlYywgYWN0aW9uOiAncm9vbS5zYXZlJywKICAgIGZpZWxkczogWwogICAgICB7IGtleToncm9vbScsICAgbGFiZWw6J+C4q+C5ieC4reC4hycsIHJl',
  'cXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J2Zsb29yJywgIGxhYmVsOifguIrguLHguYnguJknLCB0eXBlOidudW1iZXInIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQo',
  'J3Jvb21TdGF0dXNlcycpLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleTondGVuYW50JywgbGFiZWw6J+C4iuC4t+C5iOC4reC4nOC4ueC5ieC5gOC4iuC5iOC4sicgfSwKICAgICAgeyBrZXk6J3Bob25lJywgIGxhYmVsOifguYDguJrguK3guKPguYzguJXguLTg',
  'uJTguJXguYjguK0nIH0sCiAgICAgIHsga2V5OidyZW50JywgICBsYWJlbDon4LiE4LmI4Liy4LmA4LiK4LmI4LiyL+C5gOC4lOC4t+C4reC4mSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JyB9LAogICAgICB7IGtleTonbW92ZUluJywgbGFiZWw6J+C4p+C4seC4',
  'meC4l+C4teC5iOC5gOC4guC5ieC4suC4reC4ouC4ueC5iCcsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5Oidub3RlJywgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9',
  'CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguKPguLLguKLguKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4Lii4Lir4LitCiAgID09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtRmluYW5jZShyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4o+C4suC4ouC4geC4suC4',
  'oycgOiAn4Lia4Lix4LiZ4LiX4Li24LiB4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4oicsCiAgICByZWNvcmQ6IHJlYyB8fCB7IGRhdGU6IHRvZGF5KCksIGNoYW5uZWw6ICfguYLguK3guJkgUVInIH0sCiAgICBhY3Rpb246ICdmaW5hbmNl',
  'LnNhdmUnLCBidWNrZXQ6ICdtaXNjJywKICAgIG9uRGVsZXRlOiBkZWxGaW5hbmNlLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5OidraW5kJywgICBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4LijJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ2ZpbmFuY2VL',
  'aW5kcycpLCByZXF1aXJlZDp0cnVlLCBibGFuazpmYWxzZSwKICAgICAgICBoaW50OifguYDguKXguLfguK3guIEgIuC4o+C4suC4ouC4o+C4seC4muC4hOC5iOC4suC5gOC4iuC5iOC4siIg4Lir4Lij4Li34LitICLguKPguLLguKLguKPguLHguJrguK3guLfguYjg',
  'uJkg4LmGIiDguKPguLDguJrguJrguIjguLDguJnguLHguJrguYDguJvguYfguJnguJ3guLHguYjguIfguKPguLLguKLguKPguLHguJrguYPguKvguYnguK3guLHguJXguYLguJnguKHguLHguJXguLQnIH0sCiAgICAgIHsga2V5OidkYXRlJywgICBsYWJlbDon4Lin',
  '4Lix4LiZ4LiX4Li14LmIJywgdHlwZTonZGF0ZScsIHJlcXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J2Ftb3VudCcsIGxhYmVsOifguIjguLPguJnguKfguJnguYDguIfguLTguJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHJlcXVpcmVkOnRydWUgfSwK',
  'ICAgICAgeyBrZXk6J2JpbGxNb250aCcsIGxhYmVsOifguKPguK3guJrguJrguLTguKXguILguK3guIfguYDguJTguLfguK3guJknLCBwaDon4LmA4LiK4LmI4LiZIOC4gS7guIQuIDI1NjknIH0sCiAgICAgIHsga2V5OidjaGFubmVsJywgbGFiZWw6J+C4iuC5iOC4',
  'reC4h+C4l+C4suC4hycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdmaW5hbmNlQ2hhbm5lbHMnKSB9LAogICAgICB7IGtleTonc2xpcHMnLCAgbGFiZWw6J+C4quC4peC4tOC4myAvIOC5g+C4muC5gOC4quC4o+C5h+C4iCcsIHR5cGU6J2ZpbGVzJywgZnVs',
  'bDp0cnVlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxGaW5hbmNlKGlkKXsKICBjb25maXJtQWN0aW9u',
  'KCfguKXguJrguKPguLLguKLguIHguLLguKPguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2ZpbmFuY2UuZGVsZXRlJywgeyBpZDogaWQgfSkudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCgp',
  'OyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Liq4Liz4Lij4Lit',
  '4LiHIC8g4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54LilCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBkb0V4cG9ydEpzb24oKXsKICB0b2FzdCgn4LiB4Liz',
  '4Lil4Lix4LiH4LmA4LiV4Lij4Li14Lii4Lih4LmE4Lif4Lil4LmM4Liq4Liz4Lij4Lit4LiH4oCmJyk7CiAgY2FsbEFwaSgnYmFja3VwLmV4cG9ydCcsIHt9KS50aGVuKGZ1bmN0aW9uKGR1bXApewogICAgc2F2ZVRleHRGaWxlKCd0aGUtbS1jb3JuZXItYXAtYmFj',
  'a3VwLScgKyB0b2RheSgpICsgJy5qc29uJywKICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShkdW1wLCBudWxsLCAxKSwgJ2FwcGxpY2F0aW9uL2pzb24nKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7IH0p',
  'Owp9CgpmdW5jdGlvbiBkb0V4cG9ydENzdihzaGVldCl7CiAgY2FsbEFwaSgnYmFja3VwLmNzdicsIHsgc2hlZXQ6IHNoZWV0IH0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICBzYXZlVGV4dEZpbGUoci5maWxlbmFtZSwgci5jb250ZW50LCAndGV4dC9jc3YnKTsKICB9',
  'KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7IH0pOwp9CgovKiog4LiU4Liy4Lin4LiZ4LmM4LmC4Lir4Lil4LiU4LmE4Lif4Lil4LmMIOKAlCDguYPguIrguYkgZG93bmxvYWRzIGNhcGFiaWxpdHkg4LiW4LmJ4Liy4Lih4Li1',
  'IOC5hOC4oeC5iOC4h+C4seC5ieC4meC5g+C4iuC5ieC4peC4tOC4h+C4geC5jOC4m+C4geC4leC4tCAqLwpmdW5jdGlvbiBzYXZlVGV4dEZpbGUoZmlsZW5hbWUsIGNvbnRlbnQsIG1pbWUpewogIGlmICh0eXBlb2Ygd2luZG93LnNhdmVWaWFIb3N0ID09PSAnZnVu',
  'Y3Rpb24nKSByZXR1cm4gd2luZG93LnNhdmVWaWFIb3N0KGZpbGVuYW1lLCBjb250ZW50LCBtaW1lKTsKICB2YXIgYmxvYiA9IG5ldyBCbG9iKFtjb250ZW50XSwgeyB0eXBlOiBtaW1lICsgJztjaGFyc2V0PXV0Zi04JyB9KTsKICB2YXIgYSA9IGRvY3VtZW50LmNy',
  'ZWF0ZUVsZW1lbnQoJ2EnKTsKICBhLmhyZWYgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpOwogIGEuZG93bmxvYWQgPSBmaWxlbmFtZTsKICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGEpOyBhLmNsaWNrKCk7CiAgc2V0VGltZW91dChmdW5jdGlvbigpeyBV',
  'UkwucmV2b2tlT2JqZWN0VVJMKGEuaHJlZik7IGEucmVtb3ZlKCk7IH0sIDEwMDApOwogIHRvYXN0KCfguJTguLLguKfguJnguYzguYLguKvguKXguJQgJyArIGZpbGVuYW1lICsgJyDguYHguKXguYnguKcnLCAnb2snKTsKfQoKZnVuY3Rpb24gZG9JbXBvcnRKc29u',
  'KCl7CiAgb3Blbk1vZGFsKCfirIbvuI8g4LiB4Li54LmJ4LiE4Li34LiZ4LiI4Liy4LiB4LmE4Lif4Lil4LmM4Liq4Liz4Lij4Lit4LiHJywKICAgICc8cCBjbGFzcz0iZnMxMyI+4LmA4Lil4Li34Lit4LiB4LmE4Lif4Lil4LmMIDxiPi5qc29uPC9iPiDguJfguLXg',
  'uYjguYDguITguKLguJTguLLguKfguJnguYzguYLguKvguKXguJTguYTguKfguYk8L3A+JyArCiAgICAnPGxhYmVsIGNsYXNzPSJmaWxlLWRyb3AiIGZvcj0iaW1wRmlsZSI+8J+ThCDguYDguKXguLfguK3guIHguYTguJ/guKXguYzguKrguLPguKPguK3guIcnICsK',
  'ICAgICAgJzxpbnB1dCB0eXBlPSJmaWxlIiBpZD0iaW1wRmlsZSIgYWNjZXB0PSJhcHBsaWNhdGlvbi9qc29uLC5qc29uIiBzdHlsZT0iZGlzcGxheTpub25lIiAnICsKICAgICAgJ29uY2hhbmdlPSJkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcJ2ltcE5hbWVcJyku',
  'dGV4dENvbnRlbnQ9dGhpcy5maWxlc1swXT90aGlzLmZpbGVzWzBdLm5hbWU6XCdcJyI+PC9sYWJlbD4nICsKICAgICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIG10OCIgaWQ9ImltcE5hbWUiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImhyIj48L2Rpdj4nICsK',
  'ICAgICc8ZGl2IGNsYXNzPSJmIj48bGFiZWw+4Lin4Li04LiY4Li14LiB4Li54LmJ4LiE4Li34LiZPC9sYWJlbD4nICsKICAgICc8c2VsZWN0IGNsYXNzPSJzZWwiIGlkPSJpbXBNb2RlIj4nICsKICAgICAgJzxvcHRpb24gdmFsdWU9Im1lcmdlIj7guYDguJ7guLTg',
  'uYjguKHguYDguInguJ7guLLguLDguKPguLLguKLguIHguLLguKPguJfguLXguYjguKLguLHguIfguYTguKHguYjguKHguLUgKOC5geC4meC4sOC4meC4syk8L29wdGlvbj4nICsKICAgICAgJzxvcHRpb24gdmFsdWU9InJlcGxhY2UiPuC4peC5ieC4suC4h+C4guC5',
  'ieC4reC4oeC4ueC4peC5gOC4lOC4tOC4oeC5geC4peC5ieC4p+C5geC4l+C4meC4l+C4teC5iOC4l+C4seC5ieC4h+C4q+C4oeC4lDwvb3B0aW9uPicgKwogICAgJzwvc2VsZWN0PjwvZGl2PicsCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9z',
  'ZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4gTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIGlkPSJpbXBHbyI+4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54LilPC9idXR0b24+Jyk7CgogIGRvY3VtZW50LmdldEVsZW1l',
  'bnRCeUlkKCdpbXBHbycpLm9uY2xpY2sgPSBmdW5jdGlvbigpewogICAgdmFyIGYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW1wRmlsZScpLmZpbGVzWzBdOwogICAgaWYgKCFmKSByZXR1cm4gdG9hc3QoJ+C4geC4o+C4uOC4k+C4suC5gOC4peC4t+C4reC4',
  'geC5hOC4n+C4peC5jOC4geC5iOC4reC4mScsICdlcnInKTsKICAgIHZhciBtb2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ltcE1vZGUnKS52YWx1ZTsKICAgIHZhciBidG4gPSB0aGlzOyBidG4uZGlzYWJsZWQgPSB0cnVlOyBidG4uaW5uZXJIVE1MID0g',
  'JzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C4geC4ueC5ieC4hOC4t+C4meKApic7CiAgICB2YXIgciA9IG5ldyBGaWxlUmVhZGVyKCk7CiAgICByLm9ubG9hZCA9IGZ1bmN0aW9uKCl7CiAgICAgIHZhciBwYXJzZWQ7CiAgICAgIHRy',
  'eSB7IHBhcnNlZCA9IEpTT04ucGFyc2Uoci5yZXN1bHQpOyB9CiAgICAgIGNhdGNoIChlKSB7IGJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBidG4udGV4dENvbnRlbnQgPSAn4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54LilJzsgcmV0dXJuIHRvYXN0KCfg',
  'uYTguJ/guKXguYzguYTguKHguYjguYPguIrguYggSlNPTiDguJfguLXguYjguJbguLnguIHguJXguYnguK3guIcnLCAnZXJyJyk7IH0KICAgICAgY2FsbEFwaSgnYmFja3VwLmltcG9ydCcsIHsgZGF0YTogcGFyc2VkLCBtb2RlOiBtb2RlIH0pLnRoZW4oZnVuY3Rp',
  'b24oc3RhdCl7CiAgICAgICAgY2xvc2VNb2RhbCgpOwogICAgICAgIHZhciBuID0gT2JqZWN0LmtleXMoc3RhdCkucmVkdWNlKGZ1bmN0aW9uKGEsayl7IHJldHVybiBhICsgKHN0YXRba118fDApOyB9LCAwKTsKICAgICAgICB0b2FzdCgn4LiB4Li54LmJ4LiE4Li3',
  '4LiZ4Liq4Liz4LmA4Lij4LmH4LiIICcgKyBuICsgJyDguKPguLLguKLguIHguLLguKMnLCAnb2snKTsKICAgICAgICBsb2FkKCk7CiAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBidG4udGV4dENvbnRlbnQg',
  'PSAn4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54LilJzsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7CiAgICAgIH0pOwogICAgfTsKICAgIHIucmVhZEFzVGV4dChmKTsKICB9Owp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmMIOC5geC4peC4sOC4geC4suC4o+C4quC4s+C4o+C4reC4h+C4peC4hyBHb29nbGUgRHJpdmUKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgpmdW5jdGlvbiBjb3B5U2hhcmUoKXsKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2hhcmVVcmwnKTsKICBpZiAoIWVsKSByZXR1cm47CiAgZWwuc2VsZWN0KCk7CiAgaWYgKG5hdmlnYXRv',
  'ci5jbGlwYm9hcmQpIHsKICAgIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KGVsLnZhbHVlKQogICAgICAudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4LiE4Lix4LiU4Lil4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LmB4Lil4LmJ4LinJywn',
  'b2snKTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKCl7IHRvYXN0KCfguITguLHguJTguKXguK3guIHguYTguKHguYjguKrguLPguYDguKPguYfguIgg4oCUIOC4geC4lOC4hOC5ieC4suC4h+C4l+C4teC5iOC4iuC5iOC4reC4h+C5geC4peC5ieC4p+C5gOC4peC4',
  't+C4reC4geC4hOC4seC4lOC4peC4reC4gScsJ2VycicpOyB9KTsKICB9IGVsc2UgewogICAgdHJ5IHsgZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2NvcHknKTsgdG9hc3QoJ+C4hOC4seC4lOC4peC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC5geC4peC5',
  'ieC4pycsJ29rJyk7IH0KICAgIGNhdGNoIChlKSB7IHRvYXN0KCfguITguLHguJTguKXguK3guIHguYTguKHguYjguKrguLPguYDguKPguYfguIgg4oCUIOC4geC4lOC4hOC5ieC4suC4h+C4l+C4teC5iOC4iuC5iOC4reC4h+C5geC4peC5ieC4p+C5gOC4peC4t+C4',
  'reC4geC4hOC4seC4lOC4peC4reC4gScsJ2VycicpOyB9CiAgfQp9CgpmdW5jdGlvbiBkb1JvdGF0ZVNoYXJlKCl7CiAgY29uZmlybUFjdGlvbign4Lit4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LiK4Li44LiU4LmD4Lir4Lih4LmIPyDguITguJng',
  'uJfguLXguYjguJbguLfguK3guKXguLTguIfguIHguYzguYDguJTguLTguKHguIjguLDguYDguJvguLTguJTguYTguKHguYjguYTguJTguYnguK3guLXguIEnLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgnc2hhcmUucm90YXRlVG9rZW4nLCB7fSkudGhlbihmdW5j',
  'dGlvbigpewogICAgICB0b2FzdCgn4Lit4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LiK4Li44LiU4LmD4Lir4Lih4LmI4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCgpOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8',
  'ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgpmdW5jdGlvbiBkb0JhY2t1cE5vdygpewogIHRvYXN0KCfguIHguLPguKXguLHguIfguKrguLPguKPguK3guIfguILguYnguK3guKHguLnguKXguKXguIcgRHJpdmXigKYnKTsKICBjYWxsQXBpKCdiYWNrdXAuYmFja3VwTm93',
  'Jywge30pLnRoZW4oZnVuY3Rpb24ocil7CiAgICB0b2FzdCgn4Liq4Liz4Lij4Lit4LiH4LmB4Lil4LmJ4LinOiAnICsgci5uYW1lLCAnb2snKTsgbG9hZCgpOwogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKfQo8',
  'L3NjcmlwdD4KPHNjcmlwdD5ib290KCk7PC9zY3JpcHQ+CjwvYm9keT4KPC9odG1sPgo='
].join('');

function indexHtml_() {
  return Utilities.newBlob(Utilities.base64Decode(INDEX_HTML_B64), 'text/html')
    .getDataAsString('UTF-8');
}
