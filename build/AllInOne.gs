/**
 * The M Corner AP — ระบบบริหารหอพัก (ไฟล์เดียวจบ)
 * ไฟล์นี้สร้างอัตโนมัติจากโฟลเดอร์ src/ เมื่อ 2026-08-31 16:48 UTC
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
var SCHEMA_VERSION = 2;

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
      id: uid_('DEBT'), ledger: d.ledger, title: d.title, creditor: d.creditor,
      startDate: d.startDate, principal: d.principal, interestPerMonth: d.interestPerMonth,
      dueDay: d.dueDay, planPerMonth: d.planPerMonth, status: d.status,
      note: d.note, updatedAt: new Date()
    };
  });
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
 * โครงคิด:
 *   Debts        = ก้อนหนี้ (ยอดตั้งต้น)
 *   DebtPayments = รายการโอนใช้หนี้แต่ละครั้ง
 *
 *   ยอดหนี้ทั้งหมด = ผลรวม principal ของก้อนหนี้ในบัญชีนั้น
 *   ชำระแล้ว      = ผลรวมรายการชำระ "เงินต้น" (ดอกเบี้ย/ค่าธรรมเนียมไม่ลดเงินต้น)
 *   คงเหลือ       = ยอดหนี้ทั้งหมด - ชำระแล้ว
 */

var LEDGER_MAIN = 'หนี้หลัก';
var LEDGER_SUB = 'หนี้รอง';

function listDebts_(ledger) {
  var rows = readRows_(SHEETS.DEBTS);
  if (ledger) rows = rows.filter(function (d) { return d.ledger === ledger; });
  return rows;
}

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

/**
 * สรุปยอดของบัญชีหนี้หนึ่งบัญชี
 * @param {string} ledger 'หนี้หลัก' | 'หนี้รอง'
 * @param {string|number} year ปี ค.ศ. หรือ 'all'
 */
function debtSummary_(ledger, year) {
  var debts = listDebts_(ledger);
  var allPayments = listDebtPayments_(ledger, 'all');

  var totalDebt = sum_(debts, function (d) { return d.principal; });
  var principalPaid = sum_(allPayments, function (p) { return p.principal; });
  var interestPaid = sum_(allPayments, function (p) { return p.interest; });
  var remaining = totalDebt - principalPaid;
  var percent = totalDebt > 0 ? Math.min(100, (principalPaid / totalDebt) * 100) : 0;

  // แยกตามปี
  var byYearMap = {};
  allPayments.forEach(function (p) {
    var y = p.year || yearOf_(p.payDate);
    if (!y) return;
    if (!byYearMap[y]) byYearMap[y] = { year: Number(y), principal: 0, interest: 0, count: 0 };
    byYearMap[y].principal += toNumber_(p.principal) || 0;
    byYearMap[y].interest += toNumber_(p.interest) || 0;
    byYearMap[y].count++;
  });
  var byYear = Object.keys(byYearMap)
    .map(function (k) { return byYearMap[k]; })
    .sort(function (a, b) { return b.year - a.year; });

  // ยอดสะสมย้อนหลัง (ไว้วาดกราฟความคืบหน้า)
  var asc = byYear.slice().sort(function (a, b) { return a.year - b.year; });
  var run = 0;
  asc.forEach(function (y) { run += y.principal; y.cumulative = round2_(run); });

  // ความคืบหน้ารายก้อนหนี้ (เฉลี่ยตามสัดส่วนยอดตั้งต้น เมื่อไม่ได้ผูก debtId)
  var perDebt = debts.map(function (d) {
    var direct = sum_(allPayments.filter(function (p) {
      return String(p.debtId) === String(d.id);
    }), function (p) { return p.principal; });
    var unlinked = sum_(allPayments.filter(function (p) {
      return !String(p.debtId || '').trim();
    }), function (p) { return p.principal; });
    var share = totalDebt > 0 ? (toNumber_(d.principal) || 0) / totalDebt : 0;
    var paid = round2_(direct + unlinked * share);
    var principal = toNumber_(d.principal) || 0;
    return {
      id: d.id, title: d.title, creditor: d.creditor, ledger: d.ledger,
      startDate: d.startDate, status: d.status, note: d.note,
      interestPerMonth: d.interestPerMonth, dueDay: d.dueDay, planPerMonth: d.planPerMonth,
      principal: principal,
      paid: Math.min(paid, principal),
      remaining: round2_(Math.max(0, principal - paid)),
      percent: principal > 0 ? Math.min(100, (paid / principal) * 100) : 0,
      estimatedShare: !String(d.id) ? false : true
    };
  });

  // ประมาณการปิดหนี้จากอัตราชำระ 12 เดือนล่าสุด
  var forecast = forecastPayoff_(allPayments, remaining);

  var yearFiltered = (year && year !== 'all')
    ? allPayments.filter(function (p) { return String(p.year || yearOf_(p.payDate)) === String(year); })
    : allPayments;

  return {
    ledger: ledger,
    totalDebt: round2_(totalDebt),
    paid: round2_(principalPaid),
    remaining: round2_(remaining),
    percent: round2_(percent),
    interestPaid: round2_(interestPaid),
    paymentCount: allPayments.length,
    years: byYear.map(function (y) { return y.year; }),
    byYear: byYear,
    debts: perDebt,
    forecast: forecast,
    selectedYear: year || 'all',
    selectedYearPaid: round2_(sum_(yearFiltered, function (p) { return p.principal; })),
    selectedYearInterest: round2_(sum_(yearFiltered, function (p) { return p.interest; })),
    selectedYearCount: yearFiltered.length
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

function saveDebt_(obj) {
  var now = new Date();
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
  'uJnguYnguLIg4LmA4LiK4LmI4LiZIHtyb29tOiczMTEnLCBzdGF0dXM6J2FsbCd9CiAgYnVzeTogZmFsc2UKfTsKCnZhciBQQUdFUyA9IFsKICB7IGlkOidkYXNoYm9hcmQnLCBpYzon8J+TiicsIGxhYmVsOifguKDguLLguJ7guKPguKfguKEnLCAgICAgICAgICAg',
  'ICAgc3ViOifguYHguJTguIrguJrguK3guKPguYzguJTguKPguKfguKHguJfguLjguIHguKrguYjguKfguJnguILguK3guIfguKvguK3guJ7guLHguIEnLCAgICAgICAgc2VjOifguKDguLLguJ7guKPguKfguKEnIH0sCiAgeyBpZDonZGVidE1haW4nLCAgaWM6J/Cf',
  'krAnLCBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4Lij4Liq4Lij4Li44Lib4Lij4Lin4LihJywgICAgICAgc3ViOifguJrguLHguI3guIrguLXguYLguK3guJnguYPguIrguYnguKvguJnguLXguYnguKvguKXguLHguIHguILguK3guIfguKvguK3guJ7guLHguIEnLCAg',
  'ICAgICAgc2VjOifguIHguLLguKPguYDguIfguLTguJknIH0sCiAgeyBpZDonZGVidFN1YicsICAgaWM6J/Cfp74nLCBsYWJlbDon4Lir4LiZ4Li14LmJ4Liq4Li04LiZJywgICAgICAgICAgICAgIHN1Yjon4Lia4Lix4LiN4LiK4Li14LmC4Lit4LiZ4LmD4LiK4LmJ',
  '4Lir4LiZ4Li14LmJ4Lij4Lit4LiH4LiC4Lit4LiH4Lir4Lit4Lie4Lix4LiBJyB9LAogIHsgaWQ6J3B1cmNoYXNlcycsIGljOifwn5uSJywgbGFiZWw6J+C4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4hycsICAgICAgICBzdWI6J+C4guC4reC4',
  'h+C5gOC4guC5ieC4suC4q+C4reC4nuC4seC4gSDguKPguLLguITguLIg4Lib4Lij4Liw4LiB4Lix4LiZIOC5geC4peC4sOC4quC4peC4tOC4mycgfSwKICB7IGlkOidmaW5hbmNlJywgICBpYzon8J+TkicsIGxhYmVsOifguKPguLLguKLguKPguLHguJot4Lij4Liy',
  '4Lii4LiI4LmI4Liy4Lii4Lir4LitJywgICAgICBzdWI6J+C4hOC5iOC4suC5gOC4iuC5iOC4suC4l+C4teC5iOC5gOC4geC5h+C4muC5hOC4lOC5iSDCtyDguITguYjguLLguYTguJ8gwrcg4LiE4LmI4Liy4LiZ4LmJ4LizIMK3IOC4hOC5iOC4suC5gOC4meC5h+C4',
  'lSDCtyDguKDguLLguKnguLUnIH0sCiAgeyBpZDonYWMnLCAgICAgICAgaWM6J+KdhO+4jycsIGxhYmVsOifguKXguYnguLLguIfguYHguK3guKPguYwnLCAgICAgICAgICAgIHN1Yjon4LiV4Liy4Lij4Liy4LiH4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4Lij4Liy',
  '4Lii4Lir4LmJ4Lit4LiHIDI0IOC4q+C5ieC4reC4hycsICAgICAgc2VjOifguIvguYjguK3guKHguJrguLPguKPguLjguIcnIH0sCiAgeyBpZDoncmVwYWlycycsICAgaWM6J/CflKcnLCBsYWJlbDon4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Liy4Lih4Lir4LmJ',
  '4Lit4LiHJywgICAgICBzdWI6J+C4h+C4suC4meC5geC4iOC5ieC4h+C4i+C5iOC4reC4oeC5geC4ouC4geC4leC4suC4oeC4q+C5ieC4reC4hycgfSwKICB7IGlkOididWlsZGluZycsICBpYzon8J+PoicsIGxhYmVsOifguIvguYjguK3guKHguYHguIvguKHguJXg',
  'uLbguIHguYLguJTguKLguKPguKfguKEnLCAgICBzdWI6J+C4h+C4suC4meC4quC5iOC4p+C4meC4geC4peC4suC4h+C4guC4reC4h+C4reC4suC4hOC4suC4oycgfSwKICB7IGlkOidyb29tcycsICAgICBpYzon8J+aqicsIGxhYmVsOifguKvguYnguK3guIfguJ7g',
  'uLHguIEnLCAgICAgICAgICAgICBzdWI6J+C4l+C4sOC5gOC4muC4teC4ouC4meC4q+C5ieC4reC4h+C5geC4peC4sOC4m+C4o+C4sOC4p+C4seC4leC4tOC4o+C4suC4ouC4q+C5ieC4reC4hycsICAgICAgIHNlYzon4LiC4LmJ4Lit4Lih4Li54LilJyB9LAogIHsg',
  'aWQ6J3JlcG9ydHMnLCAgIGljOifwn5OIJywgbGFiZWw6J+C4o+C4suC4ouC4h+C4suC4mSAmIOC4quC4s+C4o+C4reC4h+C4guC5ieC4reC4oeC4ueC4pScsIHN1Yjon4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Lij4Liy4Lii4Lir4LmJ4Lit4LiHIMK3',
  'IOC4m+C4j+C4tOC4l+C4tOC4meC4h+C4suC4mSDCtyDguKrguYjguIfguK3guK3guIHguILguYnguK3guKHguLnguKUnIH0KXTsKCi8qIC0tLS0tLS0tLS0tLS0tLS0gQVBJIC0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKiDguIHguLjguI3guYHguIjguJfguLXguYjg',
  'uIjguLDguYHguJnguJrguYTguJvguIHguLHguJrguJfguLjguIHguITguLPguKrguLHguYjguIcg4oCUIOC4oeC4tSAyIOC4l+C4suC4h+C4quC4s+C4o+C4reC4h+C5gOC4nOC4t+C5iOC4reC4l+C4suC4h+C5geC4o+C4geC5hOC4oeC5iOC4oeC4siAqLwp2YXIg',
  'UkVTT0xWRURfS0VZID0gbnVsbDsKCmZ1bmN0aW9uIGFjY2Vzc0tleSgpewogIGlmIChSRVNPTFZFRF9LRVkgIT09IG51bGwpIHJldHVybiBSRVNPTFZFRF9LRVk7CiAgUkVTT0xWRURfS0VZID0gKHR5cGVvZiBBQ0NFU1NfS0VZID09PSAnc3RyaW5nJyAmJiBBQ0NF',
  'U1NfS0VZKSA/IEFDQ0VTU19LRVkgOiAnJzsKICByZXR1cm4gUkVTT0xWRURfS0VZOwp9CgovKiogdHJ1ZSDguJbguYnguLLguYDguJvguLTguJTguJTguYnguKfguKLguKXguLTguIfguIHguYzguJzguLnguYnguJTguLnguYHguKUg4oCUIOC5g+C4iuC5ieC5geC4',
  'l+C4meC4leC4seC4p+C5geC4m+C4oyBDQU5fRURJVCDguJXguKPguIcg4LmGIOC4l+C4teC5iOC4reC4suC4iOC5hOC4oeC5iOC4luC4ueC4geC4m+C4o+C4sOC4geC4suC4qCAqLwpmdW5jdGlvbiBjYW5FZGl0KCl7CiAgaWYgKHR5cGVvZiBDQU5fRURJVCAhPT0g',
  'J3VuZGVmaW5lZCcpIHJldHVybiAhIUNBTl9FRElUOwogIHJldHVybiAhIShTLmJvb3QgJiYgUy5ib290LmNhbkVkaXQpOwp9CgpmdW5jdGlvbiBjYWxsQXBpKGFjdGlvbiwgcGF5bG9hZCl7CiAgdmFyIGJvZHkgPSB7fTsKICBPYmplY3Qua2V5cyhwYXlsb2FkIHx8',
  'IHt9KS5mb3JFYWNoKGZ1bmN0aW9uKGspeyBib2R5W2tdID0gcGF5bG9hZFtrXTsgfSk7CiAgYm9keS5fa2V5ID0gYWNjZXNzS2V5KCk7CiAgcGF5bG9hZCA9IGJvZHk7CiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7CiAgICBn',
  'b29nbGUuc2NyaXB0LnJ1bgogICAgICAud2l0aFN1Y2Nlc3NIYW5kbGVyKGZ1bmN0aW9uKHJlcyl7CiAgICAgICAgaWYgKCFyZXMpIHJldHVybiByZWplY3QobmV3IEVycm9yKCfguYTguKHguYjguYTguJTguYnguKPguLHguJrguILguYnguK3guKHguLnguKXguIjg',
  'uLLguIHguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYwnKSk7CiAgICAgICAgaWYgKHJlcy5vaykgcmVzb2x2ZShyZXMuZGF0YSk7IGVsc2UgcmVqZWN0KG5ldyBFcnJvcihyZXMuZXJyb3IpKTsKICAgICAgfSkKICAgICAgLndpdGhGYWlsdXJlSGFuZGxl',
  'cihmdW5jdGlvbihlcnIpeyByZWplY3QoZXJyKTsgfSkKICAgICAgLmFwaShhY3Rpb24sIHBheWxvYWQgfHwge30pOwogIH0pOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIGJvb3QgJiByb3V0aW5nIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIGJvb3QoKXsK',
  'ICAvLyDguJbguYnguLLguJXguLHguKfguYHguJvguKPguIHguLjguI3guYHguIjguYTguKHguYjguKHguLLguJbguLbguIfguKvguJnguYnguLLguYDguKfguYfguJogKOC5gOC4iuC5iOC4mSB0ZW1wbGF0ZSDguYDguKPguJnguYDguJTguK3guKPguYzguJzguLTg',
  'uJQpIOC4peC4reC4h+C4reC5iOC4suC4meC4iOC4suC4gSBVUkwg4LiC4Lit4LiH4Lir4LiZ4LmJ4Liy4LmB4Lih4LmI4LiB4LmI4Lit4LiZCiAgaWYgKCFhY2Nlc3NLZXkoKSAmJiB3aW5kb3cuZ29vZ2xlICYmIGdvb2dsZS5zY3JpcHQgJiYgZ29vZ2xlLnNjcmlw',
  'dC51cmwpIHsKICAgIHRyeSB7CiAgICAgIGdvb2dsZS5zY3JpcHQudXJsLmdldExvY2F0aW9uKGZ1bmN0aW9uKGxvYyl7CiAgICAgICAgdmFyIGsgPSBsb2MgJiYgbG9jLnBhcmFtZXRlciAmJiBsb2MucGFyYW1ldGVyLmtleTsKICAgICAgICBSRVNPTFZFRF9LRVkg',
  'PSBrID8gU3RyaW5nKGspIDogJyc7CiAgICAgICAgYm9vdE5vdygpOwogICAgICB9KTsKICAgICAgcmV0dXJuOwogICAgfSBjYXRjaCAoZSkgeyAvKiDguYPguIrguYnguJfguLLguIfguJvguIHguJXguLQgKi8gfQogIH0KICBib290Tm93KCk7Cn0KCmZ1bmN0aW9u',
  'IGJvb3ROb3coKXsKICBjYWxsQXBpKCdhcHAuYm9vdHN0cmFwJykudGhlbihmdW5jdGlvbihiKXsKICAgIFMuYm9vdCA9IGI7CiAgICByZW5kZXJOYXYoKTsKICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXZGb290JykuaW5uZXJIVE1MID0gbmF2Rm9vdEh0',
  'bWwoYik7CiAgICBTLnZlcnNpb24gPSBiLnZlcnNpb24gfHwgMDsKICAgIGlmICghYi5jYW5FZGl0KSBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ3JlYWRvbmx5Jyk7CiAgICB2YXIgaGFzaCA9IChsb2NhdGlvbi5oYXNoIHx8ICcnKS5yZXBsYWNlKCcjJywn',
  'Jyk7CiAgICBnbyhQQUdFUy5zb21lKGZ1bmN0aW9uKHApe3JldHVybiBwLmlkPT09aGFzaDt9KSA/IGhhc2ggOiAnZGFzaGJvYXJkJyk7CiAgICBzdGFydFBvbGxpbmcoYi5zZXR0aW5ncyAmJiBiLnNldHRpbmdzLnJlZnJlc2hTZWNvbmRzKTsKICB9KS5jYXRjaChm',
  'dW5jdGlvbihlKXsKICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aWV3JykuaW5uZXJIVE1MID0KICAgICAgJzxkaXYgY2xhc3M9ImNhcmQiPjxkaXYgY2xhc3M9ImNhcmQtYiI+PGgzPuC5gOC4iuC4t+C5iOC4reC4oeC4leC5iOC4reC4o+C4sOC4muC4muC5',
  'hOC4oeC5iOC4quC4s+C5gOC4o+C5h+C4iDwvaDM+JyArCiAgICAgICc8cCBjbGFzcz0ibXV0ZWQiPicgKyBlc2MoZS5tZXNzYWdlfHxlKSArICc8L3A+JyArCiAgICAgICc8cCBjbGFzcz0iZnMxMyI+4LiV4Lij4Lin4LiI4Liq4Lit4Lia4Lin4LmI4LiyOiDguYDg',
  'uJvguLTguJTguIrguLXguJXguYHguKXguYnguKfguKPguLHguJkgPGI+4LmA4Lih4LiZ4Li5IPCfj6IgVGhlIE0gQ29ybmVyIEFQIOKGkiDguJXguLTguJTguJXguLHguYnguIfguKPguLDguJrguJo8L2I+IOC5gOC4o+C4teC4ouC4muC4o+C5ieC4reC4ouC5geC4',
  'peC5ieC4pyAnICsKICAgICAgJ+C5geC4peC4sOC4reC4teC5gOC4oeC4peC4l+C4teC5iOC5g+C4iuC5ieC4reC4ouC4ueC5iOC4oeC4teC4quC4tOC4l+C4mOC4tOC5jOC5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4mTwvcD48L2Rpdj48L2Rpdj4nOwogIH0p',
  'Owp9CgovKiog4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Lih4Li44Lih4Lil4LmI4Liy4LiH4LiL4LmJ4Liy4LiiIOKAlCDguYDguKfguK3guKPguYzguIrguLHguJnguYDguKfguYfguJrguYHguK3guJvguIjguLDguYDguILguLXguKLguJnguJfguLHguJrguJ/guLHg',
  'uIfguIHguYzguIrguLHguJnguJnguLXguYkgKi8KZnVuY3Rpb24gbmF2Rm9vdEh0bWwoYil7CiAgdmFyIHJvbGUgPSAoYi51c2VyICYmIGIudXNlci5sYWJlbCkgPyBiLnVzZXIubGFiZWwgOiAnJzsKICByZXR1cm4gJzxiIHN0eWxlPSJjb2xvcjojYzdkMGUwIj4n',
  'ICsgZXNjKHJvbGUpICsgJzwvYj4nICsKICAgIChiLnVzZXIgJiYgYi51c2VyLmVtYWlsICYmIGIudXNlci5lbWFpbCAhPT0gJ+C4nOC4ueC5ieC5g+C4iuC5ieC4nOC5iOC4suC4meC4peC4tOC4h+C4geC5jCcgPyAnPGJyPicgKyBlc2MoYi51c2VyLmVtYWlsKSA6',
  'ICcnKSArCiAgICAoYi5zaGVldFVybCA/ICc8YnI+PGEgaHJlZj0iJyArIGIuc2hlZXRVcmwgKyAnIiB0YXJnZXQ9Il9ibGFuayI+4LmA4Lib4Li04LiUIEdvb2dsZSBTaGVldCDihpc8L2E+JyA6ICcnKTsKfQoKZnVuY3Rpb24gcmVuZGVyTmF2KCl7CiAgdmFyIGh0',
  'bWwgPSAnJzsKICBQQUdFUy5mb3JFYWNoKGZ1bmN0aW9uKHApewogICAgaWYgKHAuc2VjKSBodG1sICs9ICc8ZGl2IGNsYXNzPSJuYXYtc2VjIj4nICsgcC5zZWMgKyAnPC9kaXY+JzsKICAgIGh0bWwgKz0gJzxidXR0b24gY2xhc3M9Im5hdi1pdGVtIiBpZD0ibmF2',
  'LScgKyBwLmlkICsgJyIgb25jbGljaz0iZ28oXCcnICsgcC5pZCArICdcJykiPicgKwogICAgICAgICAgICAgICc8c3BhbiBjbGFzcz0iaWMiPicgKyBwLmljICsgJzwvc3Bhbj48c3Bhbj4nICsgcC5sYWJlbCArICc8L3NwYW4+JyArCiAgICAgICAgICAgICAgJzxz',
  'cGFuIGNsYXNzPSJiYWRnZSIgaWQ9ImJhZGdlLScgKyBwLmlkICsgJyIgc3R5bGU9ImRpc3BsYXk6bm9uZSI+PC9zcGFuPicgKwogICAgICAgICAgICAnPC9idXR0b24+JzsKICB9KTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2TGlzdCcpLmlubmVySFRN',
  'TCA9IGh0bWw7Cn0KCmZ1bmN0aW9uIGdvKHBhZ2UpewogIFMucGFnZSA9IHBhZ2U7CiAgUy5wYXJhbXMgPSB7fTsKICBsb2NhdGlvbi5oYXNoID0gcGFnZTsKICB2YXIgbWV0YSA9IFBBR0VTLmZpbHRlcihmdW5jdGlvbihwKXtyZXR1cm4gcC5pZD09PXBhZ2U7fSlb',
  'MF0gfHwgUEFHRVNbMF07CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BhZ2VUaXRsZScpLnRleHRDb250ZW50ID0gbWV0YS5sYWJlbDsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFnZVN1YicpLnRleHRDb250ZW50ID0gbWV0YS5zdWI7CiAgUEFHRVMu',
  'Zm9yRWFjaChmdW5jdGlvbihwKXsKICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXYtJyArIHAuaWQpOwogICAgaWYgKGVsKSBlbC5jbGFzc0xpc3QudG9nZ2xlKCdvbicsIHAuaWQgPT09IHBhZ2UpOwogIH0pOwogIGRvY3VtZW50LmdldEVs',
  'ZW1lbnRCeUlkKCduYXYnKS5jbGFzc0xpc3QucmVtb3ZlKCdvcGVuJyk7CiAgcmVtb3ZlU2NyaW0oKTsKICBsb2FkKCk7Cn0KCmZ1bmN0aW9uIHJlZnJlc2goKXsgbG9hZCh0cnVlKTsgfQoKZnVuY3Rpb24gc2V0WWVhcih5KXsKICBTLnllYXIgPSB5OwogIGxvYWQo',
  'KTsKfQoKZnVuY3Rpb24gbG9hZChmb3JjZSl7CiAgdmFyIHZpZXcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndmlldycpOwogIHZpZXcuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPjxzcGFuIGNsYXNzPSJzcGluIj48',
  'L3NwYW4+PC9kaXY+4LiB4Liz4Lil4Lix4LiH4LmC4Lir4Lil4LiU4LiC4LmJ4Lit4Lih4Li54Lil4oCmPC9kaXY+JzsKICB2YXIgciA9IFJPVVRFU1tTLnBhZ2VdOwogIGlmICghcikgeyB2aWV3LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4LmE4Lih',
  '4LmI4Lie4Lia4Lir4LiZ4LmJ4Liy4LiZ4Li14LmJPC9kaXY+JzsgcmV0dXJuOyB9CiAgci5sb2FkKCkudGhlbihmdW5jdGlvbihkYXRhKXsKICAgIFMuY2FjaGVbUy5wYWdlXSA9IGRhdGE7CiAgICBzeW5jWWVhck9wdGlvbnMoZGF0YS55ZWFycyB8fCBkYXRhLmF2',
  'YWlsYWJsZSB8fCBbXSk7CiAgICB2aWV3LmlubmVySFRNTCA9IHIucmVuZGVyKGRhdGEpOwogICAgYXBwbHlSZWFkT25seSh2aWV3KTsKICAgIGlmIChyLmFmdGVyKSByLmFmdGVyKGRhdGEpOwogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgdmlldy5pbm5lckhU',
  'TUwgPSAnPGRpdiBjbGFzcz0iY2FyZCI+PGRpdiBjbGFzcz0iY2FyZC1iIj48aDM+4LmC4Lir4Lil4LiU4LiC4LmJ4Lit4Lih4Li54Lil4LmE4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIPC9oMz4nICsKICAgICAgICAgICAgICAgICAgICAgJzxwIGNsYXNzPSJtdXRl',
  'ZCI+JyArIGVzYyhlLm1lc3NhZ2V8fGUpICsgJzwvcD4nICsKICAgICAgICAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0ibG9hZCgpIj7guKXguK3guIfguYPguKvguKHguYg8L2J1dHRvbj48L2Rpdj48L2Rpdj4nOwogIH0pOwp9Cgov',
  'Kiog4LmA4LiV4Li04Lih4LiV4Lix4Lin4LmA4Lil4Li34Lit4LiB4Lib4Li14LmD4LiZ4LmB4LiW4Lia4Lia4LiZ4LmD4Lir4LmJ4LiV4Lij4LiH4LiB4Lix4Lia4LiC4LmJ4Lit4Lih4Li54Lil4LiI4Lij4Li04LiH4LiC4Lit4LiH4Lir4LiZ4LmJ4Liy4LiZ4Lix',
  '4LmJ4LiZICovCmZ1bmN0aW9uIHN5bmNZZWFyT3B0aW9ucyh5ZWFycyl7CiAgdmFyIHNlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd5ZWFyU2VsJyk7CiAgdmFyIGxpc3QgPSAoeWVhcnMgfHwgW10pLnNsaWNlKCkuc29ydChmdW5jdGlvbihhLGIpe3JldHVy',
  'biBiLWE7fSk7CiAgdmFyIGN1ciA9IG5ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKTsKICBpZiAobGlzdC5pbmRleE9mKGN1cikgPCAwKSBsaXN0LnVuc2hpZnQoY3VyKTsKICB2YXIgaHRtbCA9ICc8b3B0aW9uIHZhbHVlPSJhbGwiPuC4l+C4uOC4geC4m+C4tTwvb3B0',
  'aW9uPic7CiAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHkpewogICAgaHRtbCArPSAnPG9wdGlvbiB2YWx1ZT0iJyArIHkgKyAnIj7guJvguLUgJyArIHkgKyAnICjguJ4u4LioLiAnICsgKE51bWJlcih5KSs1NDMpICsgJyk8L29wdGlvbj4nOwogIH0pOwogIHNlbC5p',
  'bm5lckhUTUwgPSBodG1sOwogIGlmIChsaXN0LmluZGV4T2YoTnVtYmVyKFMueWVhcikpIDwgMCAmJiBTLnllYXIgIT09ICdhbGwnKSBTLnllYXIgPSBTdHJpbmcoY3VyKTsKICBzZWwudmFsdWUgPSBTLnllYXI7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4LmC4Lir',
  '4Lih4LiU4LiU4Li54Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinIC0tLS0tLS0tLS0tLS0tLS0KICAg4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4LiB4Lix4LiZ4LmE4Lin4LmJ4LmB4Lil4LmJ4Lin4LmD4LiZ4Lif4Lix',
  '4LiH4LiB4LmM4LiK4Lix4LiZIGFwaSgpIOC4leC4o+C4h+C4meC4teC5ieC5geC4hOC5iOC4i+C5iOC4reC4meC4m+C4uOC5iOC4oeC4l+C4teC5iOC4geC4lOC5hOC4m+C4geC5h+C4l+C4s+C5hOC4oeC5iOC5hOC4lOC5iQogICDguYDguJ7guLfguYjguK3guYTg',
  'uKHguYjguYPguKvguYnguJzguLnguYnguJfguLXguYjguYDguJvguLTguJTguJTguYnguKfguKLguKXguLTguIfguIHguYzguYHguIrguKPguYzguKrguLHguJrguKrguJkgKi8KdmFyIEVESVRfRU5UUllQT0lOVFMgPSAvXGIoZm9ybURlYnR8Zm9ybURlYnRQYXlt',
  'ZW50fGZvcm1QdXJjaGFzZXxmb3JtQWN8Zm9ybUJ1bGtBY3xmb3JtUmVwYWlyfGZvcm1CdWlsZGluZ3xmb3JtUm9vbXxmb3JtRmluYW5jZXxkZWxEZWJ0fGRlbERlYnRQYXltZW50fGRlbFB1cmNoYXNlfGRlbEFjfGRlbFJlcGFpcnxkZWxCdWlsZGluZ3xkZWxGaW5h',
  'bmNlfGRvSW1wb3J0SnNvbnxkb1JvdGF0ZVNoYXJlfGRvQmFja3VwTm93KVxzKlwoLzsKCmZ1bmN0aW9uIGFwcGx5UmVhZE9ubHkocm9vdCl7CiAgaWYgKGNhbkVkaXQoKSkgcmV0dXJuOwogIHZhciBub2RlcyA9IHJvb3QucXVlcnlTZWxlY3RvckFsbCgnW29uY2xp',
  'Y2tdJyk7CiAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykgewogICAgaWYgKEVESVRfRU5UUllQT0lOVFMudGVzdChub2Rlc1tpXS5nZXRBdHRyaWJ1dGUoJ29uY2xpY2snKSB8fCAnJykpIG5vZGVzW2ldLnJlbW92ZSgpOwogIH0KfQoKLyog',
  'LS0tLS0tLS0tLS0tLS0tLSDguKPguLXguYDguJ/guKPguIrguK3guLHguJXguYLguJnguKHguLHguJXguLTguYDguKHguLfguYjguK3guILguYnguK3guKHguLnguKXguYPguJnguIrguLXguJXguYDguJvguKXguLXguYjguKLguJkgLS0tLS0tLS0tLS0tLS0tLSAq',
  'LwoKZnVuY3Rpb24gc3RhcnRQb2xsaW5nKHNlY29uZHMpewogIHZhciBzZWMgPSBOdW1iZXIoc2Vjb25kcyB8fCAwKTsKICB2YXIgZG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xpdmVEb3QnKTsKICBpZiAoIXNlYykgeyBpZiAoZG90KSBkb3QuaW5uZXJI',
  'VE1MID0gJyc7IHJldHVybjsgfQogIGlmIChkb3QpIGRvdC5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9ImIgb2siIHRpdGxlPSLguILguYnguK3guKHguLnguKXguK3guLHguJvguYDguJTguJXguK3guLHguJXguYLguJnguKHguLHguJXguLTguJfguLjguIEgJyAr',
  'IHNlYyArICcg4Lin4Li04LiZ4Liy4LiX4Li1Ij7il48g4Liq4LiUPC9zcGFuPic7CgogIHNldEludGVydmFsKGZ1bmN0aW9uKCl7CiAgICBpZiAoZG9jdW1lbnQuaGlkZGVuKSByZXR1cm47CiAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vZGFsUm9v',
  'dCcpLmlubmVySFRNTCkgcmV0dXJuOyAgLy8g4LiB4Liz4Lil4Lix4LiH4LiB4Lij4Lit4LiB4Lif4Lit4Lij4LmM4Lih4Lit4Lii4Li54LmIIOC4reC4ouC5iOC4suC5gOC4nuC4tOC5iOC4h+C4o+C4teC5gOC4n+C4o+C4igogICAgY2FsbEFwaSgnYXBwLnZlcnNp',
  'b24nKS50aGVuKGZ1bmN0aW9uKHYpewogICAgICBpZiAodiAmJiB2LnZlcnNpb24gJiYgdi52ZXJzaW9uICE9PSBTLnZlcnNpb24pIHsKICAgICAgICBTLnZlcnNpb24gPSB2LnZlcnNpb247CiAgICAgICAgbG9hZCgpOwogICAgICAgIHRvYXN0KCfguILguYnguK3g',
  'uKHguLnguKXguKHguLXguIHguLLguKPguYDguJvguKXguLXguYjguKLguJnguYHguJvguKXguIcg4oCUIOC5guC4q+C4peC4lOC5g+C4q+C4oeC5iOC5g+C4q+C5ieC5geC4peC5ieC4pycpOwogICAgICB9CiAgICB9KS5jYXRjaChmdW5jdGlvbigpeyAvKiDguYDg',
  'uJnguYfguJXguKrguLDguJTguLjguJQg4LmE4Lin4LmJ4Lij4Lit4Lia4Lir4LiZ4LmJ4LiyICovIH0pOwogIH0sIHNlYyAqIDEwMDApOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIGZvcm1hdCBoZWxwZXJzIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIGVz',
  'YyhzKXsKICByZXR1cm4gU3RyaW5nKHM9PW51bGw/Jyc6cykKICAgIC5yZXBsYWNlKC8mL2csJyZhbXA7JykucmVwbGFjZSgvPC9nLCcmbHQ7JykucmVwbGFjZSgvPi9nLCcmZ3Q7JykKICAgIC5yZXBsYWNlKC8iL2csJyZxdW90OycpLnJlcGxhY2UoLycvZywnJiMz',
  'OTsnKTsKfQpmdW5jdGlvbiBtb25leShuLCBkZWMpewogIHZhciB2ID0gTnVtYmVyKG58fDApOwogIHJldHVybiB2LnRvTG9jYWxlU3RyaW5nKCd0aC1USCcse21pbmltdW1GcmFjdGlvbkRpZ2l0czpkZWN8fDAsIG1heGltdW1GcmFjdGlvbkRpZ2l0czpkZWN8fDB9',
  'KTsKfQpmdW5jdGlvbiBiYWh0KG4peyByZXR1cm4gbW9uZXkobikgKyAnIOC4vyc7IH0KZnVuY3Rpb24gcGN0KG4peyByZXR1cm4gKE51bWJlcihuKXx8MCkudG9GaXhlZCgxKSArICclJzsgfQpmdW5jdGlvbiBudW0obil7IHJldHVybiBuPT1udWxsfHxuPT09Jycg',
  'PyAn4oCTJyA6IG1vbmV5KG4pOyB9CgovKiogMjAyNi0wNC0yNiAtPiAyNiDguYDguKEu4LiiLiAyNTY5ICovCnZhciBUSF9NT04gPSBbJ+C4oS7guIQuJywn4LiBLuC4ni4nLCfguKHguLUu4LiELicsJ+C5gOC4oS7guKIuJywn4LieLuC4hC4nLCfguKHguLQu4Lii',
  'LicsJ+C4gS7guIQuJywn4LiqLuC4hC4nLCfguIEu4LiiLicsJ+C4lS7guIQuJywn4LieLuC4oi4nLCfguJgu4LiELiddOwpmdW5jdGlvbiB0aERhdGUoaXNvKXsKICBpZiAoIWlzbykgcmV0dXJuICfigJMnOwogIHZhciBtID0gU3RyaW5nKGlzbykubWF0Y2goL14o',
  'XGR7NH0pLShcZHsyfSktKFxkezJ9KS8pOwogIGlmICghbSkgcmV0dXJuIGVzYyhpc28pOwogIHJldHVybiBOdW1iZXIobVszXSkgKyAnICcgKyBUSF9NT05bTnVtYmVyKG1bMl0pLTFdICsgJyAnICsgKE51bWJlcihtWzFdKSs1NDMpOwp9CmZ1bmN0aW9uIHRoRGF0',
  'ZVNob3J0KGlzbyl7CiAgaWYgKCFpc28pIHJldHVybiAn4oCTJzsKICB2YXIgbSA9IFN0cmluZyhpc28pLm1hdGNoKC9eKFxkezR9KS0oXGR7Mn0pLShcZHsyfSkvKTsKICBpZiAoIW0pIHJldHVybiBlc2MoaXNvKTsKICByZXR1cm4gTnVtYmVyKG1bM10pICsgJy8n',
  'ICsgTnVtYmVyKG1bMl0pICsgJy8nICsgU3RyaW5nKE51bWJlcihtWzFdKSs1NDMpLnNsaWNlKDIpOwp9CmZ1bmN0aW9uIGRheXNBZ28oaXNvKXsKICBpZiAoIWlzbykgcmV0dXJuIG51bGw7CiAgcmV0dXJuIE1hdGgucm91bmQoKERhdGUubm93KCkgLSBuZXcgRGF0',
  'ZShpc28pLmdldFRpbWUoKSkvODY0MDAwMDApOwp9CgpmdW5jdGlvbiBzdGF0dXNCYWRnZShzdCl7CiAgdmFyIG1hcCA9IHsKICAgICfguYDguKrguKPguYfguIjguKrguLTguYnguJknOidvaycsJ+C4lOC4s+C5gOC4meC4tOC4meC4geC4suC4o+C5geC4peC5ieC4',
  'pyc6J29rJywn4LmD4LiK4LmJ4LiH4Liy4LiZ4Lib4LiB4LiV4Li0Jzonb2snLCfguJvguLTguJTguKvguJnguLXguYnguYHguKXguYnguKcnOidvaycsJ+C4reC4ouC4ueC5iOC5g+C4meC4m+C4o+C4sOC4geC4seC4mSc6J29rJywn4Lih4Li14Lic4Li54LmJ4LmA',
  '4LiK4LmI4LiyJzonb2snLCfguJvguIHguJXguLQnOidvaycsCiAgICAn4LiB4Liz4Lil4Lix4LiH4LiL4LmI4Lit4LihJzonaW5mbycsJ+C4geC4s+C4peC4seC4h+C4lOC4s+C5gOC4meC4tOC4meC4geC4suC4oyc6J2luZm8nLCfguJnguLHguJTguKvguKHguLLg',
  'uKLguYHguKXguYnguKcnOidpbmZvJywn4LiB4Liz4Lil4Lix4LiH4Lic4LmI4Lit4LiZJzonaW5mbycsJ+C4p+C5iOC4suC4hyc6J2luZm8nLAogICAgJ+C4o+C4reC4lOC4s+C5gOC4meC4tOC4meC4geC4suC4oyc6J3dhcm4nLCfguYDguKXguLfguYjguK3guJng',
  'uJnguLHguJQnOid3YXJuJywn4LmD4LiB4Lil4LmJ4Lir4Lih4LiU4Lib4Lij4Liw4LiB4Lix4LiZJzond2FybicsJ+C4leC5ieC4reC4h+C4i+C5iOC4reC4oSc6J3dhcm4nLCfguJ7guLHguIHguIrguLPguKPguLAnOid3YXJuJywn4Lib4Li04LiU4Lib4Lij4Lix',
  '4Lia4Lib4Lij4Li44LiHJzond2FybicsJ+C5gOC4geC4tOC4meC4geC4s+C4q+C4meC4lCc6J3dhcm4nLCfguKLguLHguIfguYTguKHguYjguYDguITguKLguKXguYnguLLguIcnOid3YXJuJywKICAgICfguKLguIHguYDguKXguLTguIEnOidtdXRlJywn4Lib4Lil',
  '4LiU4Lij4Liw4Lin4Liy4LiHJzonbXV0ZScsJ+C5hOC4oeC5iOC4o+C4sOC4muC4uCc6J211dGUnLAogICAgJ+C4q+C4oeC4lOC4reC4suC4ouC4uOC5geC4peC5ieC4pyc6J2RncicsJ+C4lOC5iOC4p+C4meC4oeC4suC4gSc6J2RncicsJ+C4lOC5iOC4p+C4mSc6',
  'J3dhcm4nCiAgfTsKICBpZiAoIXN0KSByZXR1cm4gJyc7CiAgcmV0dXJuICc8c3BhbiBjbGFzcz0iYiAnICsgKG1hcFtzdF18fCdtdXRlJykgKyAnIj4nICsgZXNjKHN0KSArICc8L3NwYW4+JzsKfQoKZnVuY3Rpb24gcHJvZ3Jlc3MocGVyY2VudCwgY2xzKXsKICB2',
  'YXIgcCA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEwMCwgTnVtYmVyKHBlcmNlbnQpfHwwKSk7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJwYmFyICcgKyAoY2xzfHwnJykgKyAnIj48aSBzdHlsZT0id2lkdGg6JyArIHAgKyAnJSI+PC9pPjwvZGl2Pic7Cn0KCmZ1bmN0',
  'aW9uIHRodW1ic0h0bWwocmVmcywgYmlnKXsKICBpZiAoIXJlZnMgfHwgIXJlZnMubGVuZ3RoKSByZXR1cm4gJzxzcGFuIGNsYXNzPSJmYWludCBmczEyIj7igJM8L3NwYW4+JzsKICByZXR1cm4gJzxkaXYgY2xhc3M9InRodW1icyI+JyArIHJlZnMubWFwKGZ1bmN0',
  'aW9uKHIpewogICAgaWYgKHIudGh1bWIpIHsKICAgICAgcmV0dXJuICc8aW1nIGNsYXNzPSJ0aHVtYicgKyAoYmlnPycgYmlnJzonJykgKyAnIiBsb2FkaW5nPSJsYXp5IiBzcmM9IicgKyBlc2Moci50aHVtYikgKyAnIiAnICsKICAgICAgICAgICAgICdvbmNsaWNr',
  'PSJ3aW5kb3cub3BlbihcJycgKyBlc2Moci51cmwpICsgJ1wnLFwnX2JsYW5rXCcpIiAnICsKICAgICAgICAgICAgICdvbmVycm9yPSJ0aGlzLm9uZXJyb3I9bnVsbDt0aGlzLnJlcGxhY2VXaXRoKGZpbGVDaGlwKCcgKyBKU09OLnN0cmluZ2lmeShKU09OLnN0cmlu',
  'Z2lmeShyKSkucmVwbGFjZSgvIi9nLCcmcXVvdDsnKSArICcpKSI+JzsKICAgIH0KICAgIHJldHVybiAnPGEgY2xhc3M9ImIgaW5mbyIgaHJlZj0iJyArIGVzYyhyLnVybCkgKyAnIiB0YXJnZXQ9Il9ibGFuayI+4LmE4Lif4Lil4LmMPC9hPic7CiAgfSkuam9pbign',
  'JykgKyAnPC9kaXY+JzsKfQpmdW5jdGlvbiBmaWxlQ2hpcChqc29uKXsKICB2YXIgciA9IHR5cGVvZiBqc29uID09PSAnc3RyaW5nJyA/IEpTT04ucGFyc2UoanNvbikgOiBqc29uOwogIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpOwogIGEuY2xh',
  'c3NOYW1lID0gJ2IgaW5mbyc7IGEuaHJlZiA9IHIudXJsOyBhLnRhcmdldCA9ICdfYmxhbmsnOyBhLnRleHRDb250ZW50ID0gJ/Cfk44g4LmE4Lif4Lil4LmMJzsKICByZXR1cm4gYTsKfQoKZnVuY3Rpb24gZW1wdHlCb3godGV4dCwgYWN0aW9uKXsKICByZXR1cm4g',
  'JzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPvCfl4LvuI88L2Rpdj4nICsgZXNjKHRleHQpICsKICAgICAgICAgKGFjdGlvbiA/ICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgYWN0aW9uICsgJzwvZGl2PicgOiAnJykgKyAnPC9kaXY+JzsKfQoKZnVu',
  'Y3Rpb24gYmFyQ2hhcnQoaXRlbXMsIGxhYmVsS2V5LCB2YWx1ZUtleSwgZm9ybWF0dGVyKXsKICBpZiAoIWl0ZW1zIHx8ICFpdGVtcy5sZW5ndGgpIHJldHVybiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4guC5ieC4reC4oeC4',
  'ueC4pTwvZGl2Pic7CiAgdmFyIG1heCA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGl0ZW1zLm1hcChmdW5jdGlvbihpKXsgcmV0dXJuIE51bWJlcihpW3ZhbHVlS2V5XSl8fDA7IH0pKSB8fCAxOwogIHJldHVybiAnPGRpdiBjbGFzcz0iYmFycyI+JyArIGl0ZW1zLm1h',
  'cChmdW5jdGlvbihpKXsKICAgIHZhciB2ID0gTnVtYmVyKGlbdmFsdWVLZXldKXx8MDsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0iYmFyLXJvdyI+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJjbGlwIiB0aXRsZT0iJyArIGVzYyhpW2xhYmVsS2V5XSkgKyAnIj4nICsg',
  'ZXNjKGlbbGFiZWxLZXldKSArICc8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImJhci10cmFjayI+PGRpdiBjbGFzcz0iYmFyLWZpbGwiIHN0eWxlPSJ3aWR0aDonICsgKHYvbWF4KjEwMCkgKyAnJSI+PC9kaXY+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNz',
  'PSJ2Ij4nICsgKGZvcm1hdHRlciA/IGZvcm1hdHRlcihpKSA6IG1vbmV5KHYpKSArICc8L2Rpdj4nICsKICAgICc8L2Rpdj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0gbW9kYWwgLS0tLS0tLS0tLS0tLS0tLSAqLwoK',
  'ZnVuY3Rpb24gb3Blbk1vZGFsKHRpdGxlLCBib2R5SHRtbCwgZm9vdEh0bWwsIHdpZGUpewogIHZhciByb290ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vZGFsUm9vdCcpOwogIHJvb3QuaW5uZXJIVE1MID0KICAgICc8ZGl2IGNsYXNzPSJvdiIgb25jbGlj',
  'az0iaWYoZXZlbnQudGFyZ2V0PT09dGhpcyljbG9zZU1vZGFsKCkiPicgKwogICAgICAnPGRpdiBjbGFzcz0ibW9kYWwnICsgKHdpZGU/JyB3aWRlJzonJykgKyAnIj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0ibW9kYWwtaCI+PGgzPicgKyBlc2ModGl0bGUpICsg',
  'JzwvaDM+PGJ1dHRvbiBjbGFzcz0ieCIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7DlzwvYnV0dG9uPjwvZGl2PicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJtb2RhbC1iIj4nICsgYm9keUh0bWwgKyAnPC9kaXY+JyArCiAgICAgICAgKGZvb3RIdG1sID8gJzxkaXYg',
  'Y2xhc3M9Im1vZGFsLWYiPicgKyBmb290SHRtbCArICc8L2Rpdj4nIDogJycpICsKICAgICAgJzwvZGl2PicgKwogICAgJzwvZGl2Pic7CiAgYXBwbHlSZWFkT25seShyb290KTsKICBkb2N1bWVudC5ib2R5LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7Cn0KZnVu',
  'Y3Rpb24gY2xvc2VNb2RhbCgpewogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb2RhbFJvb3QnKS5pbm5lckhUTUwgPSAnJzsKICBkb2N1bWVudC5ib2R5LnN0eWxlLm92ZXJmbG93ID0gJyc7Cn0KZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bics',
  'IGZ1bmN0aW9uKGUpeyBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSBjbG9zZU1vZGFsKCk7IH0pOwoKZnVuY3Rpb24gY29uZmlybUFjdGlvbih0ZXh0LCBvblllcyl7CiAgb3Blbk1vZGFsKCfguKLguLfguJnguKLguLHguJknLAogICAgJzxwPicgKyBlc2ModGV4dCkg',
  'KyAnPC9wPicsCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4gTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBkZ3IiIGlkPSJjZm1CdG4iPuC4ouC4t+C4meC4ouC4seC4mTwv',
  'YnV0dG9uPicpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZm1CdG4nKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsgY2xvc2VNb2RhbCgpOyBvblllcygpOyB9Owp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIHRvYXN0IC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0',
  'aW9uIHRvYXN0KG1zZywga2luZCl7CiAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgZWwuY2xhc3NOYW1lID0gJ3RvYXN0ICcgKyAoa2luZHx8JycpOwogIGVsLnRleHRDb250ZW50ID0gbXNnOwogIGRvY3VtZW50LmdldEVsZW1lbnRC',
  'eUlkKCd0b2FzdFJvb3QnKS5hcHBlbmRDaGlsZChlbCk7CiAgc2V0VGltZW91dChmdW5jdGlvbigpeyBlbC5yZW1vdmUoKTsgfSwga2luZD09PSdlcnInID8gNTIwMCA6IDI4MDApOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIG5hdiAobW9iaWxlKSAtLS0tLS0tLS0t',
  'LS0tLS0tICovCgpmdW5jdGlvbiB0b2dnbGVOYXYoKXsKICB2YXIgbmF2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdicpOwogIG5hdi5jbGFzc0xpc3QudG9nZ2xlKCdvcGVuJyk7CiAgaWYgKG5hdi5jbGFzc0xpc3QuY29udGFpbnMoJ29wZW4nKSkgewog',
  'ICAgdmFyIHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICAgIHMuY2xhc3NOYW1lID0gJ3NjcmltJzsgcy5pZCA9ICdzY3JpbSc7CiAgICBzLm9uY2xpY2sgPSBmdW5jdGlvbigpeyBuYXYuY2xhc3NMaXN0LnJlbW92ZSgnb3BlbicpOyByZW1vdmVT',
  'Y3JpbSgpOyB9OwogICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzKTsKICB9IGVsc2UgcmVtb3ZlU2NyaW0oKTsKfQpmdW5jdGlvbiByZW1vdmVTY3JpbSgpewogIHZhciBzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NjcmltJyk7CiAgaWYgKHMpIHMu',
  'cmVtb3ZlKCk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0gc2VhcmNoIC0tLS0tLS0tLS0tLS0tLS0gKi8KCnZhciBzZWFyY2hUaW1lciA9IG51bGw7CmZ1bmN0aW9uIG9uU2VhcmNoKHEpewogIGNsZWFyVGltZW91dChzZWFyY2hUaW1lcik7CiAgaWYgKCFxIHx8IHEu',
  'dHJpbSgpLmxlbmd0aCA8IDIpIHJldHVybjsKICBzZWFyY2hUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2FwcC5zZWFyY2gnLCB7IHE6IHEgfSkudGhlbihmdW5jdGlvbihyb3dzKXsKICAgICAgb3Blbk1vZGFsKCfguJzguKXguIHg',
  'uLLguKPguITguYnguJnguKvguLIgIicgKyBxICsgJyIgKCcgKyByb3dzLmxlbmd0aCArICcpJywKICAgICAgICByb3dzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJhbGlzdCI+JyArIHJvd3MubWFwKGZ1bmN0aW9uKHIpewogICAgICAgICAgcmV0dXJuICc8ZGl2IGNs',
  'YXNzPSJhbGkiIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtnbyhcJycgKyBqdW1wUGFnZShyLm1vZHVsZSkgKyAnXCcpIj4nICsKICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImljIj4nICsgbW9kdWxlSWNvbihyLm1vZHVsZSkgKyAnPC9kaXY+PGRpdj4nICsKICAgICAg',
  'ICAgICAgJzxkaXYgY2xhc3M9InR0Ij4nICsgZXNjKHIudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAgICAnPGRpdiBjbGFzcz0iZGQiPicgKyBlc2Moci5sYWJlbCkgKyAoci5kZXRhaWwgPyAnIMK3ICcgKyBlc2Moci5kZXRhaWwpIDogJycpICsgJzwvZGl2',
  'PicgKwogICAgICAgICAgICAnPC9kaXY+PC9kaXY+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nCiAgICAgICAgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC5hOC4oeC5iOC4nuC4muC4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4leC4o+C4h+C4geC4',
  'seC4muC4hOC4s+C4hOC5ieC4mTwvZGl2PicsICcnLCB0cnVlKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsICdlcnInKTsgfSk7CiAgfSwgNDIwKTsKfQpmdW5jdGlvbiBqdW1wUGFnZShtb2R1bGUpewogIHJldHVybiAoe3B1',
  'cmNoYXNlczoncHVyY2hhc2VzJywgcmVwYWlyczoncmVwYWlycycsIGJ1aWxkaW5nOididWlsZGluZycsIGFjOidhYycsIGRlYnQ6J2RlYnRNYWluJywgcm9vbXM6J3Jvb21zJ30pW21vZHVsZV0gfHwgJ2Rhc2hib2FyZCc7Cn0KZnVuY3Rpb24gbW9kdWxlSWNvbiht',
  'b2R1bGUpewogIHJldHVybiAoe3B1cmNoYXNlczon8J+bkicsIHJlcGFpcnM6J/CflKcnLCBidWlsZGluZzon8J+PoicsIGFjOifinYTvuI8nLCBkZWJ0Oifwn5KwJywgcm9vbXM6J/CfmqonfSlbbW9kdWxlXSB8fCAn8J+ThCc7Cn0KCi8qIC0tLS0tLS0tLS0tLS0t',
  'LS0gZmlsZSB1cGxvYWQgLS0tLS0tLS0tLS0tLS0tLSAqLwoKLyoqCiAqIOC4reC5iOC4suC4meC5hOC4n+C4peC5jOC4iOC4suC4gSA8aW5wdXQgdHlwZT1maWxlPiDguYDguJvguYfguJkgZGF0YVVSTCDguYHguKXguYnguKfguKrguYjguIfguILguLbguYnguJkg',
  'RHJpdmUKICog4LiE4Li34LiZIGFycmF5IOC4guC4reC4hyB7aWQsbmFtZSx1cmwsdGh1bWJ9CiAqLwpmdW5jdGlvbiB1cGxvYWRGaWxlcyhpbnB1dEVsLCBidWNrZXQpewogIHZhciBmaWxlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGlucHV0RWwuZmls',
  'ZXMgfHwgW10pOwogIGlmICghZmlsZXMubGVuZ3RoKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTsKICB2YXIgTUFYID0gMTIgKiAxMDI0ICogMTAyNDsKICB2YXIgdG9vQmlnID0gZmlsZXMuZmlsdGVyKGZ1bmN0aW9uKGYpeyByZXR1cm4gZi5zaXplID4gTUFY',
  'OyB9KTsKICBpZiAodG9vQmlnLmxlbmd0aCkgewogICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcign4LmE4Lif4Lil4LmM4LmD4Lir4LiN4LmI4LmA4LiB4Li04LiZIDEyIE1COiAnICsgdG9vQmlnLm1hcChmdW5jdGlvbihmKXtyZXR1cm4gZi5uYW1l',
  'O30pLmpvaW4oJywgJykpKTsKICB9CiAgcmV0dXJuIFByb21pc2UuYWxsKGZpbGVzLm1hcChyZWFkQXNEYXRhVXJsKSkKICAgIC50aGVuKGZ1bmN0aW9uKHBheWxvYWRzKXsgcmV0dXJuIGNhbGxBcGkoJ2ZpbGUudXBsb2FkJywgeyBidWNrZXQ6IGJ1Y2tldCwgZmls',
  'ZXM6IHBheWxvYWRzIH0pOyB9KTsKfQoKZnVuY3Rpb24gcmVhZEFzRGF0YVVybChmaWxlKXsKICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXsKICAgIHZhciByID0gbmV3IEZpbGVSZWFkZXIoKTsKICAgIHIub25sb2FkID0gZnVu',
  'Y3Rpb24oKXsgcmVzb2x2ZSh7IG5hbWU6IGZpbGUubmFtZSwgbWltZVR5cGU6IGZpbGUudHlwZSwgZGF0YVVybDogci5yZXN1bHQgfSk7IH07CiAgICByLm9uZXJyb3IgPSBmdW5jdGlvbigpeyByZWplY3QobmV3IEVycm9yKCfguK3guYjguLLguJnguYTguJ/guKXg',
  'uYzguYTguKHguYjguKrguLPguYDguKPguYfguIg6ICcgKyBmaWxlLm5hbWUpKTsgfTsKICAgIHIucmVhZEFzRGF0YVVSTChmaWxlKTsKICB9KTsKfQo8L3NjcmlwdD4KPHNjcmlwdD4KLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09CiAgIFZpZXdzLmh0bWwg4oCUIOC4leC4seC4p+C5guC4q+C4peC4lCArIOC4leC4seC4p+C4p+C4suC4lOC4guC4reC4h+C5geC4leC5iOC4peC4sOC4q+C4meC5ieC4sgogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCnZhciBST1VURVMgPSB7fTsKCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICAxKSDguKDguLLguJ7guKPguKfguKEKICAgPT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5kYXNoYm9hcmQgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsgcmV0dXJuIGNhbGxBcGkoJ2FwcC5kYXNoYm9hcmQnLCB7IHllYXI6IFMueWVhciB9KTsgfSwKICBy',
  'ZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIGIgPSBkLmJ1aWxkaW5nOwogICAgdmFyIGtwaXMgPQogICAgICBrcGkoJ+C4ouC4reC4lOC4q+C4meC4teC5ieC4hOC4h+C5gOC4q+C4peC4t+C4reC4l+C4seC5ieC4h+C4q+C4oeC4lCcsIGJhaHQoZC5kZWJ0TWFp',
  'bi5yZW1haW5pbmcgKyBkLmRlYnRTdWIucmVtYWluaW5nKSwgJ+C4q+C4meC4teC5ieC4q+C4peC4seC4gSArIOC4q+C4meC4teC5ieC4o+C4reC4hycsICdhY2NlbnQnKSArCiAgICAgIGtwaSgn4LiK4Liz4Lij4Liw4LmB4Lil4LmJ4LinICjguKvguJnguLXguYng',
  'uKvguKXguLHguIEpJywgcGN0KGQuZGVidE1haW4ucGVyY2VudCksIGJhaHQoZC5kZWJ0TWFpbi5wYWlkKSArICcg4LiI4Liy4LiBICcgKyBiYWh0KGQuZGVidE1haW4udG90YWwpLCAnZ29vZCcpICsKICAgICAga3BpKCfguITguYjguLLguYPguIrguYnguIjguYjg',
  'uLLguKLguJvguLUgJyArIGQueWVhciwgYmFodChkLnNwZW5kVGhpc1llYXIpLCAn4LiL4Li34LmJ4Lit4LiC4Lit4LiHICsg4LiL4LmI4Lit4Lih4LmB4LiL4LihICsg4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJykgKwogICAgICBrcGkoJ+C4h+C4suC4meC4i+C5',
  'iOC4reC4oeC4hOC5ieC4suC4hycsIGQucmVwYWlycy5vcGVuSm9icyArICcg4LiH4Liy4LiZJywgZC5yZXBhaXJzLm92ZXJkdWUgKyAnIOC4h+C4suC4meC5gOC4geC4tOC4meC4geC4s+C4q+C4meC4lCcsIGQucmVwYWlycy5vdmVyZHVlID8gJ2JhZCcgOiAnJyk7',
  'CgogICAgdmFyIGFsZXJ0cyA9IGQuYWxlcnRzLmxlbmd0aAogICAgICA/ICc8ZGl2IGNsYXNzPSJhbGlzdCI+JyArIGQuYWxlcnRzLnNsaWNlKDAsMTIpLm1hcChmdW5jdGlvbihhKXsKICAgICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0iYWxpIGwtJyArIGEubGV2',
  'ZWwgKyAnIiBvbmNsaWNrPSJnbyhcJycgKyBqdW1wUGFnZShhLm1vZHVsZSkgKyAnXCcpIj4nICsKICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0iaWMiPicgKyBhLmljb24gKyAnPC9kaXY+PGRpdj48ZGl2IGNsYXNzPSJ0dCI+JyArIGVzYyhhLnRpdGxlKSAr',
  'ICc8L2Rpdj4nICsKICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0iZGQiPicgKyBlc2MoYS5kZXRhaWwpICsgJzwvZGl2PjwvZGl2PjwvZGl2Pic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JwogICAgICA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRp',
  'diBjbGFzcz0iYmlnIj7inIU8L2Rpdj7guYTguKHguYjguKHguLXguIfguLLguJnguITguYnguLLguIcg4oCUIOC4l+C4uOC4geC4reC4ouC5iOC4suC4h+C5gOC4o+C4teC4ouC4muC4o+C5ieC4reC4ojwvZGl2Pic7CgogICAgcmV0dXJuICcnICsKICAgICAgJzxk',
  'aXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArIGtwaXMgKyAnPC9kaXY+JyArCgogICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMiBtYjEyIj4nICsKICAgICAgICBjYXJkKCfwn5KwIOC4o+C4suC4ouC4geC4suC4o+C4quC4o+C4uOC4m+C4o+C4p+C4oSAo4Lir4LiZ',
  '4Li14LmJ4Lir4Lil4Lix4LiBKScsCiAgICAgICAgICBkZWJ0TWluaShkLmRlYnRNYWluLCAnZGVidE1haW4nKSwKICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImdvKFwnZGVidE1haW5cJykiPuC4lOC4ueC4l+C4seC5ieC4h+C4q+C4',
  'oeC4lCDihpI8L2J1dHRvbj4nKSArCiAgICAgICAgY2FyZCgn8J+nviDguKvguJnguLXguYnguKrguLTguJkgKOC4q+C4meC4teC5ieC4o+C4reC4hyknLAogICAgICAgICAgZGVidE1pbmkoZC5kZWJ0U3ViLCAnZGVidFN1YicpICsKICAgICAgICAgIChkLmRlYnRT',
  'dWIuaW50ZXJlc3RUaGlzWWVhciA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIG10OCI+4LiU4Lit4LiB4LmA4Lia4Li14LmJ4Lii4LiX4Li14LmI4LiK4Liz4Lij4Liw4Lib4Li1ICcgKyBkLnllYXIgKyAnOiA8Yj4nICsgYmFodChkLmRlYnRTdWIuaW50ZXJlc3RU',
  'aGlzWWVhcikgKyAnPC9iPjwvZGl2PicgOiAnJyksCiAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJnbyhcJ2RlYnRTdWJcJykiPuC4lOC4ueC4l+C4seC5ieC4h+C4q+C4oeC4lCDihpI8L2J1dHRvbj4nKSArCiAgICAgICc8L2Rpdj4n',
  'ICsKCiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICAgIGtwaSgn4Lir4LmJ4Lit4LiH4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJywgYi50b3RhbFJvb21zICsgJyDguKvguYnguK3guIcnLCAn4Lih4Li14Lic4Li54LmJ4LmA4LiK4LmI4Liy',
  'ICcgKyBiLm9jY3VwaWVkICsgJyDCtyDguKfguYjguLLguIcgJyArIGIudmFjYW50KSArCiAgICAgICAga3BpKCfguKXguYnguLLguIfguYHguK3guKPguYzguJvguLUgJyArIGQueWVhciwgZC5hYy5yb29tc0RvbmUgKyAnLycgKyBiLnRvdGFsUm9vbXMgKyAnIOC4',
  'q+C5ieC4reC4hycsIGQuYWMuZG9uZUluWWVhciArICcg4Lij4Lit4LiaIMK3IOC4hOC5ieC4suC4hyAnICsgZC5hYy5yb29tc1BlbmRpbmcgKyAnIOC4q+C5ieC4reC4hycsIGQuYWMucm9vbXNQZW5kaW5nID8gJ3dhcm4nIDogJ2dvb2QnKSArCiAgICAgICAga3Bp',
  'KCfguIvguLfguYnguK3guILguK3guIfguJvguLUgJyArIGQueWVhciwgYmFodChkLnB1cmNoYXNlcy55ZWFyVG90YWwpLCBkLnB1cmNoYXNlcy55ZWFyQ291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4oycpICsKICAgICAgICBrcGkoJ+C4m+C4o+C4sOC4geC4seC4',
  'meC5g+C4geC4peC5ieC4q+C4oeC4lCcsIGQucHVyY2hhc2VzLndhcnJhbnR5LmV4cGlyaW5nICsgJyDguKPguLLguKLguIHguLLguKMnLCAn4Lir4Lih4LiU4Lit4Liy4Lii4Li44LmB4Lil4LmJ4LinICcgKyBkLnB1cmNoYXNlcy53YXJyYW50eS5leHBpcmVkLCBk',
  'LnB1cmNoYXNlcy53YXJyYW50eS5leHBpcmluZyA/ICd3YXJuJyA6ICcnKSArCiAgICAgICc8L2Rpdj4nICsKCiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGcyIG1iMTIiPicgKwogICAgICAgIGNhcmQoJ/Cfk5Ig4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4',
  'iOC5iOC4suC4ouC4q+C4rSDguJvguLUgJyArIGQueWVhciwKICAgICAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGczIG1iMTIiPicgKwogICAgICAgICAgICBrcGkoJ+C4o+C4suC4ouC4o+C4seC4micsIGJhaHQoZC5maW5hbmNlLmluY29tZSksICfguYDguInguKXg',
  'uLXguYjguKIgJyArIGJhaHQoZC5maW5hbmNlLmF2Z0luY29tZSkgKyAnL+C5gOC4lOC4t+C4reC4mScsICdnb29kJykgKwogICAgICAgICAgICBrcGkoJ+C4o+C4suC4ouC4iOC5iOC4suC4oicsIGJhaHQoZC5maW5hbmNlLmV4cGVuc2UpLCAn4LmA4LiJ4Lil4Li1',
  '4LmI4LiiICcgKyBiYWh0KGQuZmluYW5jZS5hdmdFeHBlbnNlKSArICcv4LmA4LiU4Li34Lit4LiZJywgJ2JhZCcpICsKICAgICAgICAgICAga3BpKCfguITguIfguYDguKvguKXguLfguK3guKrguLjguJfguJjguLQnLCBiYWh0KGQuZmluYW5jZS5uZXQpLCAn4Lit',
  '4Lix4LiV4Lij4Liy4LiB4Liz4LmE4LijICcgKyBwY3QoZC5maW5hbmNlLm1hcmdpbikpICsKICAgICAgICAgICc8L2Rpdj4nICsgbWluaU1vbnRoQ2hhcnQoZC5maW5hbmNlLmJ5TW9udGgpLAogICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGlj',
  'az0iZ28oXCdmaW5hbmNlXCcpIj7guJTguLnguJfguLHguYnguIfguKvguKHguJQg4oaSPC9idXR0b24+JykgKwogICAgICAgIGNhcmQoJ/Cfl5PvuI8g4LiH4Liy4LiZ4LiX4Li14LmI4LiB4Liz4Lil4Lix4LiH4LiI4Liw4LiW4Li24LiHICgnICsgZC51cGNvbWlu',
  'Zy5sZW5ndGggKyAnKScsCiAgICAgICAgICBkLnVwY29taW5nLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJhbGlzdCI+JyArIGQudXBjb21pbmcuc2xpY2UoMCw3KS5tYXAoZnVuY3Rpb24odSl7CiAgICAgICAgICAgIHZhciBsdmwgPSB1LmRheXNMZWZ0IDwgMCA/ICdk',
  'YW5nZXInIDogKHUuZGF5c0xlZnQgPD0gNyA/ICd3YXJuJyA6ICdpbmZvJyk7CiAgICAgICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0iYWxpIGwtJyArIGx2bCArICciIG9uY2xpY2s9ImdvKFwnJyArIGp1bXBQYWdlKHUubW9kdWxlKSArICdcJykiPicgKwogICAg',
  'ICAgICAgICAgICc8ZGl2IGNsYXNzPSJpYyI+JyArIHUuaWNvbiArICc8L2Rpdj48ZGl2PjxkaXYgY2xhc3M9InR0Ij4nICsgZXNjKHUudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJkZCI+JyArIHRoRGF0ZSh1LmRhdGUpICsg',
  'JyDCtyAnICsKICAgICAgICAgICAgICAgICh1LmRheXNMZWZ0IDwgMCA/ICfguYDguKXguKLguIHguLPguKvguJnguJQgJyArICgtdS5kYXlzTGVmdCkgKyAnIOC4p+C4seC4mScgOiAodS5kYXlzTGVmdCA9PT0gMCA/ICfguKfguLHguJnguJnguLXguYknIDogJ+C4',
  'reC4teC4gSAnICsgdS5kYXlzTGVmdCArICcg4Lin4Lix4LiZJykpICsKICAgICAgICAgICAgICAnPC9kaXY+PC9kaXY+PC9kaXY+JzsKICAgICAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPjxkaXYgY2xhc3M9ImJpZyI+',
  '8J+MpO+4jzwvZGl2PuC5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4meC4seC4lOC4q+C4oeC4suC4ouC5gOC4o+C5h+C4pyDguYYg4LiZ4Li14LmJPC9kaXY+JywKICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImdvKFwncmVwb3J0c1wn',
  'KSI+4Lib4LiP4Li04LiX4Li04LiZ4LmA4LiV4LmH4LihIOKGkjwvYnV0dG9uPicsIHRydWUpICsKICAgICAgJzwvZGl2PicgKwoKICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzIiPicgKwogICAgICAgIGNhcmQoJ/CflJQg4Liq4Li04LmI4LiH4LiX4Li14LmI4LiV',
  '4LmJ4Lit4LiH4LiX4LizICgnICsgZC5hbGVydHMubGVuZ3RoICsgJyknLCBhbGVydHMsICcnLCB0cnVlKSArCiAgICAgICAgY2FyZCgn8J+PoiDguIfguLLguJnguIvguYjguK3guKHguYHguIvguKHguJXguLbguIHguYLguJTguKLguKPguKfguKEnLAogICAgICAg',
  'ICAgJzxkaXYgY2xhc3M9ImdyaWQgZzIiPicgKwogICAgICAgICAgICBrcGkoJ+C4h+C4suC4meC4m+C4tSAnICsgZC55ZWFyLCBkLmJ1aWxkaW5nUmVwYWlycy55ZWFyQ291bnQgKyAnIOC4h+C4suC4mScsICfguITguYnguLLguIcgJyArIGQuYnVpbGRpbmdSZXBh',
  'aXJzLm9wZW5Db3VudCkgKwogICAgICAgICAgICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oicsIGJhaHQoZC5idWlsZGluZ1JlcGFpcnMueWVhckNvc3QpLCAn4LiE4Lij4Lia4LiB4Liz4Lir4LiZ4LiU4LmA4Lij4LmH4LinIOC5hiDguJnguLXg',
  'uYkgJyArIGQuYnVpbGRpbmdSZXBhaXJzLnVwY29taW5nKSArCiAgICAgICAgICAnPC9kaXY+JyArCiAgICAgICAgICAoZC5kZWJ0TWFpbi5mb3JlY2FzdCAmJiBkLmRlYnRNYWluLmZvcmVjYXN0Lm1vbnRoc0xlZnQKICAgICAgICAgICAgPyAnPGRpdiBjbGFzcz0i',
  'aHIiPjwvZGl2PjxkaXYgY2xhc3M9ImZzMTMiPjxiPuC4m+C4o+C4sOC4oeC4suC4k+C4geC4suC4o+C4m+C4tOC4lOC4q+C4meC4teC5ieC4q+C4peC4seC4gTwvYj48ZGl2IGNsYXNzPSJtdXRlZCBtdDgiPicgKwogICAgICAgICAgICAgICfguIjguLLguIHguK3g',
  'uLHguJXguKPguLLguIrguLPguKPguLDguYDguInguKXguLXguYjguKIgJyArIGJhaHQoZC5kZWJ0TWFpbi5mb3JlY2FzdC5hdmdQZXJNb250aCkgKyAnL+C5gOC4lOC4t+C4reC4mSAoMTIg4LmA4LiU4Li34Lit4LiZ4Lil4LmI4Liy4Liq4Li44LiUKSAnICsKICAg',
  'ICAgICAgICAgICAn4LiE4Liy4LiU4Lin4LmI4Liy4Lit4Li14LiBIDxiPicgKyBkLmRlYnRNYWluLmZvcmVjYXN0Lm1vbnRoc0xlZnQgKyAnIOC5gOC4lOC4t+C4reC4mTwvYj4gJyArCiAgICAgICAgICAgICAgJyjguKPguLLguKcgJyArIHRoRGF0ZShkLmRlYnRN',
  'YWluLmZvcmVjYXN0LnBheW9mZkRhdGUpICsgJyk8L2Rpdj48L2Rpdj4nCiAgICAgICAgICAgIDogJycpLAogICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZ28oXCdidWlsZGluZ1wnKSI+4LiU4Li54LiX4Lix4LmJ4LiH4Lir4Lih4LiU',
  'IOKGkjwvYnV0dG9uPicpICsKICAgICAgJzwvZGl2Pic7CiAgfSwKICBhZnRlcjogZnVuY3Rpb24oZCl7CiAgICBzZXRCYWRnZSgncmVwYWlycycsIGQucmVwYWlycy5vcGVuSm9icyk7CiAgICBzZXRCYWRnZSgnYWMnLCBkLmFjLnJvb21zUGVuZGluZyk7CiAgfQp9',
  'OwoKZnVuY3Rpb24gbWluaU1vbnRoQ2hhcnQoYnlNb250aCl7CiAgdmFyIG1heCA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGJ5TW9udGgubWFwKGZ1bmN0aW9uKG0peyByZXR1cm4gTWF0aC5tYXgobS5pbmNvbWUsIG0uZXhwZW5zZSk7IH0pKSB8fCAxOwogIHJldHVy',
  'biAnPGRpdiBzdHlsZT0iZGlzcGxheTpmbGV4O2dhcDozcHg7YWxpZ24taXRlbXM6ZmxleC1lbmQ7aGVpZ2h0Ojc0cHgiPicgKyBieU1vbnRoLm1hcChmdW5jdGlvbihtKXsKICAgIHZhciBoaSA9IE1hdGgucm91bmQobS5pbmNvbWUgLyBtYXggKiA2NiksIGhlID0g',
  'TWF0aC5yb3VuZChtLmV4cGVuc2UgLyBtYXggKiA2Nik7CiAgICByZXR1cm4gJzxkaXYgc3R5bGU9ImZsZXg6MTt0ZXh0LWFsaWduOmNlbnRlciIgdGl0bGU9IicgKyBtLmxhYmVsICsgJyDCtyDguKPguLHguJogJyArIG1vbmV5KG0uaW5jb21lKSArICcgwrcg4LiI',
  '4LmI4Liy4LiiICcgKyBtb25leShtLmV4cGVuc2UpICsgJyI+JyArCiAgICAgICc8ZGl2IHN0eWxlPSJkaXNwbGF5OmZsZXg7Z2FwOjFweDthbGlnbi1pdGVtczpmbGV4LWVuZDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO2hlaWdodDo2NnB4Ij4nICsKICAgICAgICAn',
  'PGRpdiBzdHlsZT0id2lkdGg6NnB4O2hlaWdodDonICsgaGkgKyAncHg7YmFja2dyb3VuZDp2YXIoLS1vayk7Ym9yZGVyLXJhZGl1czoycHggMnB4IDAgMCI+PC9kaXY+JyArCiAgICAgICAgJzxkaXYgc3R5bGU9IndpZHRoOjZweDtoZWlnaHQ6JyArIGhlICsgJ3B4',
  'O2JhY2tncm91bmQ6dmFyKC0tZGFuZ2VyKTtib3JkZXItcmFkaXVzOjJweCAycHggMCAwIj48L2Rpdj4nICsKICAgICAgJzwvZGl2PjxkaXYgY2xhc3M9ImZhaW50IiBzdHlsZT0iZm9udC1zaXplOjkuNXB4Ij4nICsgbS5sYWJlbC5yZXBsYWNlKCcuJywnJykgKyAn',
  'PC9kaXY+PC9kaXY+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nICsKICAnPGRpdiBjbGFzcz0icm93IGZzMTIgbXV0ZWQgbXQ4Ij48c3BhbiBjbGFzcz0iYiBvayI+4Lij4Liy4Lii4Lij4Lix4LiaPC9zcGFuPjxzcGFuIGNsYXNzPSJiIGRnciI+4Lij4Liy4Lii',
  '4LiI4LmI4Liy4LiiPC9zcGFuPjwvZGl2Pic7Cn0KCmZ1bmN0aW9uIGRlYnRNaW5pKHgsIHBhZ2UpewogIHJldHVybiAnPGRpdiBjbGFzcz0icG1ldGEiIHN0eWxlPSJtYXJnaW46MCAwIDZweCI+PHNwYW4+4LiK4Liz4Lij4Liw4LmB4Lil4LmJ4LinIDxiPicgKyBi',
  'YWh0KHgucGFpZCkgKyAnPC9iPjwvc3Bhbj4nICsKICAgICAgICAgJzxzcGFuPjxiPicgKyBwY3QoeC5wZXJjZW50KSArICc8L2I+PC9zcGFuPjwvZGl2PicgKwogICAgICAgICBwcm9ncmVzcyh4LnBlcmNlbnQsICdsZycpICsKICAgICAgICAgJzxkaXYgY2xhc3M9',
  'InBtZXRhIj48c3Bhbj7guITguIfguYDguKvguKXguLfguK0gPGI+JyArIGJhaHQoeC5yZW1haW5pbmcpICsgJzwvYj48L3NwYW4+JyArCiAgICAgICAgICc8c3Bhbj7guKLguK3guJTguKvguJnguLXguYnguJfguLHguYnguIfguKvguKHguJQgPGI+JyArIGJhaHQo',
  'eC50b3RhbCkgKyAnPC9iPjwvc3Bhbj48L2Rpdj4nICsKICAgICAgICAgJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbXQ4Ij7guIrguLPguKPguLDguYPguJnguJvguLXguJfguLXguYjguYDguKXguLfguK3guIE6IDxiPicgKyBiYWh0KHgudGhpc1llYXIpICsgJzwv',
  'Yj48L2Rpdj4nOwp9CgpmdW5jdGlvbiBzZXRCYWRnZShwYWdlLCBuKXsKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmFkZ2UtJyArIHBhZ2UpOwogIGlmICghZWwpIHJldHVybjsKICBpZiAobiA+IDApIHsgZWwudGV4dENvbnRlbnQgPSBuOyBl',
  'bC5zdHlsZS5kaXNwbGF5ID0gJyc7IH0KICBlbHNlIGVsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICAyKSDguKvguJnguLXguYnguKvguKXg',
  'uLHguIEgLyDguKvguJnguLXguYnguKPguK3guIcgKOC5g+C4iuC5ieC4leC4seC4p+C4p+C4suC4lOC4o+C5iOC4p+C4oeC4geC4seC4mSkKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1',
  'bmN0aW9uIGRlYnRSb3V0ZShsZWRnZXIsIHRpdGxlKXsKICByZXR1cm4gewogICAgbG9hZDogZnVuY3Rpb24oKXsKICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFsKICAgICAgICBjYWxsQXBpKCdkZWJ0LnN1bW1hcnknLCB7IGxlZGdlcjogbGVkZ2VyLCB5ZWFyOiBT',
  'LnllYXIgfSksCiAgICAgICAgY2FsbEFwaSgnZGVidC5wYXltZW50cycsIHsgbGVkZ2VyOiBsZWRnZXIsIHllYXI6IFMueWVhciB9KQogICAgICBdKS50aGVuKGZ1bmN0aW9uKHIpewogICAgICAgIHZhciBkID0gclswXTsgZC5wYXltZW50cyA9IHJbMV07IGQubGVk',
  'Z2VyID0gbGVkZ2VyOyBkLnBhZ2VUaXRsZSA9IHRpdGxlOwogICAgICAgIHJldHVybiBkOwogICAgICB9KTsKICAgIH0sCiAgICByZW5kZXI6IHJlbmRlckRlYnQKICB9Owp9ClJPVVRFUy5kZWJ0TWFpbiA9IGRlYnRSb3V0ZSgn4Lir4LiZ4Li14LmJ4Lir4Lil4Lix',
  '4LiBJywgJ+C4o+C4suC4ouC4geC4suC4o+C4quC4o+C4uOC4m+C4o+C4p+C4oSBUaGUgTSBDb3JuZXIgQVAnKTsKUk9VVEVTLmRlYnRTdWIgID0gZGVidFJvdXRlKCfguKvguJnguLXguYnguKPguK3guIcnLCAn4Lir4LiZ4Li14LmJ4Liq4Li04LiZJyk7CgpmdW5j',
  'dGlvbiByZW5kZXJEZWJ0KGQpewogIHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CgogIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImNhcmQgbWIxMiI+PGRpdiBjbGFzcz0iY2Fy',
  'ZC1iIj4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbWIxMiI+PGgzIHN0eWxlPSJtYXJnaW46MDtmb250LXNpemU6MTVweCI+JyArIGVzYyhkLnBhZ2VUaXRsZSkgKyAnPC9oMz4nICsKICAgICc8c3BhbiBjbGFzcz0ic3AiPjwvc3Bhbj4nICsKICAgICc8YnV0dG9u',
  'IGNsYXNzPSJidG4gcHJpIHNtIiBvbmNsaWNrPSJmb3JtRGVidFBheW1lbnQobnVsbCxcJycgKyBkLmxlZGdlciArICdcJykiPisg4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4LiK4Liz4Lij4LiwPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRu',
  'IHNtIiBvbmNsaWNrPSJmb3JtRGVidChudWxsLFwnJyArIGQubGVkZ2VyICsgJ1wnKSI+KyDguYDguJ7guLTguYjguKHguIHguYnguK3guJnguKvguJnguLXguYk8L2J1dHRvbj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJwbWV0YSIgc3R5bGU9Im1hcmdpbjow',
  'IDAgN3B4Ij48c3Bhbj7guITguKfguLLguKHguITguLfguJrguKvguJnguYnguLLguIHguLLguKPguIrguLPguKPguLA8L3NwYW4+PHNwYW4+PGI+JyArIHBjdChkLnBlcmNlbnQpICsgJzwvYj48L3NwYW4+PC9kaXY+JyArCiAgICBwcm9ncmVzcyhkLnBlcmNlbnQs',
  'ICdsZyAnICsgKGQucGVyY2VudCA+PSAxMDAgPyAnb2snIDogJycpKSArCiAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtdDE2Ij4nICsKICAgICAga3BpKCfguKLguK3guJTguKvguJnguLXguYnguJfguLHguYnguIfguKvguKHguJQnLCBiYWh0KGQudG90YWxEZWJ0',
  'KSwgZC5kZWJ0cy5sZW5ndGggKyAnIOC4geC5ieC4reC4meC4q+C4meC4teC5iScpICsKICAgICAga3BpKCfguIrguLPguKPguLDguYHguKXguYnguKcnLCBiYWh0KGQucGFpZCksIGQucGF5bWVudENvdW50ICsgJyDguKPguLLguKLguIHguLLguKPguYLguK3guJkn',
  'LCAnZ29vZCcpICsKICAgICAga3BpKCfguITguIfguYDguKvguKXguLfguK0nLCBiYWh0KGQucmVtYWluaW5nKSwgJ+C4reC4teC4gSAnICsgcGN0KDEwMCAtIGQucGVyY2VudCkgKyAnIOC4iOC4sOC4m+C4tOC4lOC4q+C4meC4teC5iScsICdiYWQnKSArCiAgICAg',
  'IGtwaSgn4LiK4Liz4Lij4Liw4LmD4LiZJyArIHllYXJMYWJlbCwgYmFodChkLnNlbGVjdGVkWWVhclBhaWQpLCBkLnNlbGVjdGVkWWVhckNvdW50ICsgJyDguKPguLLguKLguIHguLLguKMnICsKICAgICAgICAgIChkLnNlbGVjdGVkWWVhckludGVyZXN0ID8gJyDC',
  'tyDguJTguK3guIHguYDguJrguLXguYnguKIgJyArIGJhaHQoZC5zZWxlY3RlZFllYXJJbnRlcmVzdCkgOiAnJykpICsKICAgICc8L2Rpdj48L2Rpdj48L2Rpdj4nOwoKICB2YXIgcGVyRGVidCA9IGQuZGVidHMubGVuZ3RoID8gJzxkaXYgY2xhc3M9ImdyaWQgZy1h',
  'dXRvIG1iMTIiPicgKyBkLmRlYnRzLm1hcChmdW5jdGlvbih4KXsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0iY2FyZCI+PGRpdiBjbGFzcz0iY2FyZC1iIj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImNsaXAiIHN0eWxlPSJmb250LXdlaWdodDo2NTA7Zm9udC1zaXpl',
  'OjEzLjVweDttaW4taGVpZ2h0OjM4cHgiPicgKyBlc2MoeC50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJyb3cgZnMxMiBtdXRlZCBtYjgiPicgKyBzdGF0dXNCYWRnZSh4LnN0YXR1cykgKwogICAgICAgICc8c3Bhbj4nICsgZXNjKHguY3Jl',
  'ZGl0b3IgfHwgJ+KAkycpICsgKHguc3RhcnREYXRlID8gJyDCtyAnICsgdGhEYXRlKHguc3RhcnREYXRlKSA6ICcnKSArICc8L3NwYW4+PC9kaXY+JyArCiAgICAgIHByb2dyZXNzKHgucGVyY2VudCkgKwogICAgICAnPGRpdiBjbGFzcz0icG1ldGEiPjxzcGFuPuC4',
  'iuC4s+C4o+C4sCA8Yj4nICsgYmFodCh4LnBhaWQpICsgJzwvYj48L3NwYW4+PHNwYW4+4LiE4LiH4LmA4Lir4Lil4Li34LitIDxiPicgKyBiYWh0KHgucmVtYWluaW5nKSArICc8L2I+PC9zcGFuPjwvZGl2PicgKwogICAgICAoeC5pbnRlcmVzdFBlck1vbnRoID8g',
  'JzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbXQ4Ij7guJTguK3guIHguYDguJrguLXguYnguKIgJyArIGJhaHQoeC5pbnRlcmVzdFBlck1vbnRoKSArICcv4LmA4LiU4Li34Lit4LiZPC9kaXY+JyA6ICcnKSArCiAgICAgICh4LnBsYW5QZXJNb250aCA/ICc8ZGl2IGNs',
  'YXNzPSJmczEyIG11dGVkIj7guYHguJzguJnguJzguYjguK3guJkgJyArIGJhaHQoeC5wbGFuUGVyTW9udGgpICsgJy/guYDguJTguLfguK3guJk8L2Rpdj4nIDogJycpICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBtdDEyIj48YnV0dG9uIGNsYXNzPSJidG4gc20i',
  'IG9uY2xpY2s9XCdmb3JtRGVidCgnICsgYXR0cih4KSArICcsIicgKyBkLmxlZGdlciArICciKVwnPuC5geC4geC5ieC5hOC4gjwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGRnciIgb25jbGljaz0iZGVsRGVidChcJycgKyB4LmlkICsg',
  'J1wnKSI+4Lil4LiaPC9idXR0b24+PC9kaXY+JyArCiAgICAnPC9kaXY+PC9kaXY+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nIDogJyc7CgogIHZhciBieVllYXIgPSBkLmJ5WWVhci5sZW5ndGggPyBjYXJkKCfwn5OFIOC4ouC4reC4lOC4iuC4s+C4o+C4sOC5',
  'geC4ouC4geC4leC4suC4oeC4m+C4tScsCiAgICAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsKICAgICc8dGg+4Lib4Li1PC90aD48dGggY2xhc3M9Im51bSI+4LmA4LiH4Li04LiZ4LiV4LmJ4LiZPC90aD48dGggY2xhc3M9',
  'Im51bSI+4LiU4Lit4LiB4LmA4Lia4Li14LmJ4LiiPC90aD48dGggY2xhc3M9Im51bSI+4Lij4Lin4Lih4LiX4Li14LmI4LmC4Lit4LiZPC90aD4nICsKICAgICc8dGggY2xhc3M9Im51bSI+4LiI4Liz4LiZ4Lin4LiZ4LiE4Lij4Lix4LmJ4LiHPC90aD48dGggY2xh',
  'c3M9Im51bSI+4LmA4LiH4Li04LiZ4LiV4LmJ4LiZ4Liq4Liw4Liq4LihPC90aD48dGggc3R5bGU9IndpZHRoOjI2JSI+4LiE4Lin4Liy4Lih4LiE4Li34Lia4Lir4LiZ4LmJ4Liy4Liq4Liw4Liq4LihPC90aD4nICsKICAgICc8L3RyPjwvdGhlYWQ+PHRib2R5Picg',
  'KwogICAgZC5ieVllYXIubWFwKGZ1bmN0aW9uKHkpewogICAgICB2YXIgY3VtID0geS5jdW11bGF0aXZlICE9IG51bGwgPyB5LmN1bXVsYXRpdmUgOiAwOwogICAgICB2YXIgcCA9IGQudG90YWxEZWJ0ID8gKGN1bSAvIGQudG90YWxEZWJ0ICogMTAwKSA6IDA7CiAg',
  'ICAgIHJldHVybiAnPHRyIG9uY2xpY2s9InNldFllYXJGcm9tVGFibGUoJyArIHkueWVhciArICcpIiBzdHlsZT0iY3Vyc29yOnBvaW50ZXIiPicgKwogICAgICAgICc8dGQ+PGI+JyArIHkueWVhciArICc8L2I+IDxzcGFuIGNsYXNzPSJmYWludCBmczEyIj4vICcg',
  'KyAoeS55ZWFyKzU0MykgKyAnPC9zcGFuPjwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbW9uZXkoeS5wcmluY2lwYWwpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHkuaW50ZXJlc3QgPyBtb25leSh5LmludGVy',
  'ZXN0KSA6ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9Im51bSI+PGI+JyArIG1vbmV5KHkucHJpbmNpcGFsICsgeS5pbnRlcmVzdCkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgeS5jb3VudCArICc8L3Rk',
  'PicgKwogICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIG1vbmV5KGN1bSkgKyAnPC90ZD4nICsKICAgICAgICAnPHRkPicgKyBwcm9ncmVzcyhwKSArICc8L3RkPjwvdHI+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nLCAnJywg',
  'dHJ1ZSkgOiAnJzsKCiAgdmFyIHJvd3MgPSBkLnBheW1lbnRzOwogIHZhciBsaXN0ID0gY2FyZCgn8J+nviDguKPguLLguKLguIHguLLguKPguYLguK3guJnguYPguIrguYnguKvguJnguLXguYkgwrcgJyArIHllYXJMYWJlbCArICcgKCcgKyByb3dzLmxlbmd0aCAr',
  'ICcpJywKICAgIHJvd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICc8dGg+4Lin4Lix4LiZ4LiX4Li14LmIPC90aD48dGg+4LiH4Lin4LiUPC90aD48dGggY2xhc3M9Im51bSI+4LmA4LiH4Li0',
  '4LiZ4LiV4LmJ4LiZPC90aD48dGggY2xhc3M9Im51bSI+4LiU4Lit4LiB4LmA4Lia4Li14LmJ4LiiPC90aD4nICsKICAgICAgJzx0aCBjbGFzcz0ibnVtIj7guKPguKfguKHguJfguLXguYjguYLguK3guJk8L3RoPjx0aD7guIrguYjguK3guIfguJfguLLguIc8L3Ro',
  'PicgKwogICAgICAnPHRoPuC4quC4peC4tOC4mzwvdGg+PHRoPuC4q+C4oeC4suC4ouC5gOC4q+C4leC4uDwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgcm93cy5tYXAoZnVuY3Rpb24ocCl7CiAgICAgICAgcmV0dXJuICc8dHI+JyAr',
  'CiAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAiPicgKyB0aERhdGUocC5wYXlEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIj4nICsgZXNjKHAuaW5zdGFsbG1lbnQgfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAn',
  'PHRkIGNsYXNzPSJudW0iPicgKyAocC5wcmluY2lwYWwgPyAnPGIgc3R5bGU9ImNvbG9yOnZhcigtLW9rKSI+JyArIG1vbmV5KHAucHJpbmNpcGFsKSArICc8L2I+JyA6ICc8c3BhbiBjbGFzcz0iZmFpbnQiPuKAkzwvc3Bhbj4nKSArICc8L3RkPicgKwogICAgICAg',
  'ICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHAuaW50ZXJlc3QgPyAnPGIgc3R5bGU9ImNvbG9yOnZhcigtLXdhcm4pIj4nICsgbW9uZXkocC5pbnRlcmVzdCkgKyAnPC9iPicgOiAnPHNwYW4gY2xhc3M9ImZhaW50Ij7igJM8L3NwYW4+JykgKyAnPC90ZD4nICsKICAg',
  'ICAgICAgICc8dGQgY2xhc3M9Im51bSI+PGI+JyArIG1vbmV5KHAuYW1vdW50KSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MocC5jaGFubmVsIHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZD4nICsg',
  'dGh1bWJzSHRtbChwLnNsaXBSZWZzKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiBtdXRlZCBjbGlwIj4nICsgZXNjKHAubm90ZSB8fCAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsK',
  'ICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIiBvbmNsaWNrPVwnZm9ybURlYnRQYXltZW50KCcgKyBhdHRyKHApICsgJywiJyArIGQubGVkZ2VyICsgJyIpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAgICc8YnV0dG9uIGNsYXNz',
  'PSJidG4gc20gaWNvbiBkZ3IiIG9uY2xpY2s9ImRlbERlYnRQYXltZW50KFwnJyArIHAuaWQgKyAnXCcpIj7wn5eRPC9idXR0b24+JyArCiAgICAgICAgICAnPC9kaXY+PC90ZD48L3RyPic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rp',
  'dj4nCiAgICA6IGVtcHR5Qm94KCfguKLguLHguIfguYTguKHguYjguKHguLXguKPguLLguKLguIHguLLguKPguIrguLPguKPguLDguYPguJknICsgeWVhckxhYmVsLAogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtRGVidFBheW1l',
  'bnQobnVsbCxcJycgKyBkLmxlZGdlciArICdcJykiPisg4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4LiK4Liz4Lij4LiwPC9idXR0b24+JyksCiAgICAnJywgdHJ1ZSk7CgogIHJldHVybiBoZWFkICsgcGVyRGVidCArIGJ5WWVhciArICc8ZGl2IGNsYXNzPSJt',
  'dDEyIj4nICsgbGlzdCArICc8L2Rpdj4nOwp9CgpmdW5jdGlvbiBzZXRZZWFyRnJvbVRhYmxlKHkpewogIFMueWVhciA9IFN0cmluZyh5KTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgneWVhclNlbCcpLnZhbHVlID0gUy55ZWFyOwogIGxvYWQoKTsKfQoKLyog',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDMpIOC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLnB1cmNoYXNlcyA9IHsKICBsb2FkOiBmdW5jdGlvbigpewogICAgcmV0dXJuIFByb21pc2UuYWxsKFsKICAgICAgY2FsbEFwaSgncHVyY2hhc2Uuc3VtbWFyeScsIHsgeWVhcjogUy55ZWFyIH0pLAogICAgICBj',
  'YWxsQXBpKCdwdXJjaGFzZS5saXN0JywgeyB5ZWFyOiBTLnllYXIsIGNhdGVnb3J5OiBTLnBhcmFtcy5jYXRlZ29yeSB8fCAnJywgcTogUy5wYXJhbXMucSB8fCAnJyB9KQogICAgXSkudGhlbihmdW5jdGlvbihyKXsgdmFyIGQgPSByWzBdOyBkLml0ZW1zID0gclsx',
  'XTsgcmV0dXJuIGQ7IH0pOwogIH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNz',
  'PSJncmlkIGc0IG1iMTIiPicgKwogICAgICBrcGkoJ+C4ouC4reC4lOC4i+C4t+C5ieC4rSAnICsgeWVhckxhYmVsLCBiYWh0KGQueWVhclRvdGFsKSwgZC55ZWFyQ291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4oycsICdhY2NlbnQnKSArCiAgICAgIGtwaSgn4Lii',
  '4Lit4LiU4Liq4Liw4Liq4Lih4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJywgYmFodChkLmdyYW5kVG90YWwpLCBkLmdyYW5kQ291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4oycpICsKICAgICAga3BpKCfguK3guKLguLnguYjguYPguJnguJvguKPguLDguIHguLHguJkn',
  'LCBkLndhcnJhbnR5LmFjdGl2ZSArICcg4Lij4Liy4Lii4LiB4Liy4LijJywgJ+C5g+C4geC4peC5ieC4q+C4oeC4lCAnICsgZC53YXJyYW50eS5leHBpcmluZywgZC53YXJyYW50eS5leHBpcmluZyA/ICd3YXJuJyA6ICdnb29kJykgKwogICAgICBrcGkoJ+C4q+C4',
  'oeC4p+C4lOC4l+C4teC5iOC5g+C4iuC5ieC4iOC5iOC4suC4ouC4quC4ueC4h+C4quC4uOC4lCcsIGQuYnlDYXRlZ29yeVswXSA/IGQuYnlDYXRlZ29yeVswXS5jYXRlZ29yeSA6ICfigJMnLAogICAgICAgICAgZC5ieUNhdGVnb3J5WzBdID8gYmFodChkLmJ5Q2F0',
  'ZWdvcnlbMF0udG90YWwpIDogJycpICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciBjaGFydHMgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnMiBtYjEyIj4nICsKICAgICAgY2FyZCgn8J+TiiDguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguYHguKLguIHguJXguLLg',
  'uKHguKvguKHguKfguJTguKvguKHguLnguYggwrcgJyArIHllYXJMYWJlbCwKICAgICAgICBiYXJDaGFydChkLmJ5Q2F0ZWdvcnksICdjYXRlZ29yeScsICd0b3RhbCcsIGZ1bmN0aW9uKGkpeyByZXR1cm4gbW9uZXkoaS50b3RhbCkgKyAnIOC4vyc7IH0pKSArCiAg',
  'ICAgIGNhcmQoJ/Cfk4Ug4Lii4Lit4LiU4LiL4Li34LmJ4Lit4LmB4Lii4LiB4LiV4Liy4Lih4Lib4Li1JywKICAgICAgICBiYXJDaGFydChkLmJ5WWVhci5tYXAoZnVuY3Rpb24oeSl7IHJldHVybiB7IGxhYmVsOiAn4Lib4Li1ICcgKyB5LnllYXIgKyAnICgnICsg',
  'eS5jb3VudCArICcpJywgdG90YWw6IHkudG90YWwsIHllYXI6IHkueWVhciB9OyB9KSwKICAgICAgICAgICAgICAgICAnbGFiZWwnLCAndG90YWwnLCBmdW5jdGlvbihpKXsgcmV0dXJuIG1vbmV5KGkudG90YWwpICsgJyDguL8nOyB9KSkgKwogICAgJzwvZGl2Pic7',
  'CgogICAgdmFyIGNhdHMgPSAnPGRpdiBjbGFzcz0iY2hpcHMgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJjaGlwICcgKyAoIVMucGFyYW1zLmNhdGVnb3J5Pydvbic6JycpICsgJyIgb25jbGljaz0ic2V0UGFyYW0oXCdjYXRlZ29yeVwnLFwnXCcpIj7g',
  'uJfguLjguIHguKvguKHguKfguJQ8L2J1dHRvbj4nICsKICAgICAgZC5ieUNhdGVnb3J5Lm1hcChmdW5jdGlvbihjKXsKICAgICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9ImNoaXAgJyArIChTLnBhcmFtcy5jYXRlZ29yeT09PWMuY2F0ZWdvcnk/J29uJzonJykg',
  'KyAnIiAnICsKICAgICAgICAgICAgICAgJ29uY2xpY2s9InNldFBhcmFtKFwnY2F0ZWdvcnlcJyxcJycgKyBlc2MoYy5jYXRlZ29yeSkgKyAnXCcpIj4nICsgZXNjKGMuY2F0ZWdvcnkpICsgJyAoJyArIGMuY291bnQgKyAnKTwvYnV0dG9uPic7CiAgICAgIH0pLmpv',
  'aW4oJycpICsgJzwvZGl2Pic7CgogICAgdmFyIHJvd3MgPSBkLml0ZW1zOwogICAgdmFyIHRhYmxlID0gY2FyZCgn8J+bkiDguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcgwrcgJyArIHllYXJMYWJlbCArICcgKCcgKyByb3dzLmxlbmd0aCAr',
  'ICcpJywKICAgICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDo5ODBweCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoIHN0eWxlPSJ3aWR0aDo5NnB4Ij7guKfguLHguJnguJfguLXguYjg',
  'uIvguLfguYnguK08L3RoPjx0aD7guKPguLLguKLguIHguLLguKPguKrguLTguJnguITguYnguLI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guIjguLPguJnguKfguJk8L3RoPicgKwogICAgICAgICc8dGggY2xhc3M9Im51bSI+4Lij4Liy4LiE4LiyPC90aD48dGg+4LmB',
  '4Lir4Lil4LmI4LiH4LiX4Li14LmI4LiL4Li34LmJ4LitPC90aD48dGg+4Lib4Lij4Liw4LiB4Lix4LiZPC90aD48dGg+4Lig4Liy4LiePC90aD48dGg+4Liq4Lil4Li04LibPC90aD48dGg+PC90aD4nICsKICAgICAgICAnPC90cj48L3RoZWFkPjx0Ym9keT4nICsK',
  'ICAgICAgICByb3dzLm1hcChmdW5jdGlvbihwKXsKICAgICAgICAgIHZhciB3ID0gcC53YXJyYW50eSB8fCB7fTsKICAgICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZShwLmJ1eURhdGUp',
  'ICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0iY2xpcCIgdGl0bGU9IicgKyBlc2MocC5pdGVtKSArICciPjxiPicgKyBlc2MocC5pdGVtKSArICc8L2I+PC9kaXY+JyArCiAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImZzMTIgZmFpbnQi',
  'PicgKyBlc2MocC5jYXRlZ29yeSB8fCAnJykgKyAocC5yb29tID8gJyDCtyDguKvguYnguK3guIcgJyArIGVzYyhwLnJvb20pIDogJycpICsgJzwvZGl2PjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIG51bShwLnF0eSkgKyAnPC90ZD4n',
  'ICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj48Yj4nICsgbW9uZXkocC5wcmljZSkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MocC52ZW5kb3IgfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAg',
  'ICc8dGQgY2xhc3M9ImZzMTIiPicgKyAody5oYXMKICAgICAgICAgICAgICAgID8gc3RhdHVzQmFkZ2Uody5zdGF0ZSkgKyAnPGRpdiBjbGFzcz0iZmFpbnQiIHN0eWxlPSJmb250LXNpemU6MTFweCI+JyArIHRoRGF0ZVNob3J0KHcuZW5kKSArICc8L2Rpdj4nCiAg',
  'ICAgICAgICAgICAgICA6ICc8c3BhbiBjbGFzcz0iZmFpbnQiPuKAkzwvc3Bhbj4nKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHAucGhvdG9SZWZzKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1s',
  'KHAuc2xpcFJlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24iIG9uY2xpY2s9XCdmb3JtUHVyY2hhc2UoJyArIGF0dHIocCkgKyAn',
  'KVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiBkZ3IiIG9uY2xpY2s9ImRlbFB1cmNoYXNlKFwnJyArIHAuaWQgKyAnXCcpIj7wn5eRPC9idXR0b24+JyArCiAgICAgICAgICAgICc8L2Rpdj48L3Rk',
  'PjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6IGVtcHR5Qm94KCfguKLguLHguIfguYTguKHguYjguKHguLXguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guYPguJknICsgeWVhckxhYmVsLCAn',
  'PGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZm9ybVB1cmNoYXNlKG51bGwpIj4rIOC5gOC4nuC4tOC5iOC4oeC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4rTwvYnV0dG9uPicpLAogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSBzbSIgb25j',
  'bGljaz0iZm9ybVB1cmNoYXNlKG51bGwpIj4rIOC5gOC4nuC4tOC5iOC4oeC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4rTwvYnV0dG9uPicsIHRydWUpOwoKICAgIHJldHVybiBoZWFkICsgY2hhcnRzICsgY2F0cyArIHRhYmxlOwogIH0KfTsKCmZ1bmN0aW9u',
  'IHNldFBhcmFtKGtleSwgdmFsKXsKICBTLnBhcmFtc1trZXldID0gdmFsOwogIGxvYWQoKTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDQpIOC4peC5ieC4suC4h+C5geC4reC4o+C5',
  'jAogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLmFjID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7IHJldHVybiBjYWxsQXBpKCdhYy5tYXRyaXgnLCB7IHllYXI6IFMueWVhciB9KTsg',
  'fSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKICAgIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyAr',
  'CiAgICAgIGtwaSgn4Lil4LmJ4Liy4LiH4LmB4Lil4LmJ4LinICcgKyB5ZWFyTGFiZWwsIGQucm9vbXNEb25lSW5ZZWFyICsgJy8nICsgZC5yb29tcy5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsIGQuZG9uZUluWWVhciArICcg4Lij4Lit4Lia4LiX4Lix4LmJ4LiH',
  '4Lir4Lih4LiUJywgJ2FjY2VudCcpICsKICAgICAga3BpKCfguKLguLHguIfguYTguKHguYjguYTguJTguYnguKXguYnguLLguIcnLCBkLnJvb21zUGVuZGluZy5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsIGQucm9vbXNQZW5kaW5nLnNsaWNlKDAsOCkuam9pbign',
  'LCAnKSArIChkLnJvb21zUGVuZGluZy5sZW5ndGg+OD8n4oCmJzonJyksIGQucm9vbXNQZW5kaW5nLmxlbmd0aCA/ICd3YXJuJzonZ29vZCcpICsKICAgICAga3BpKCfguJbguLbguIfguIHguLPguKvguJnguJTguKXguYnguLLguIcnLCBkLm92ZXJkdWUubGVuZ3Ro',
  'ICsgJyDguKvguYnguK3guIcnLCAn4Lij4Lit4Lia4Lil4LmJ4Liy4LiH4LiX4Li44LiBICcgKyBkLmN5Y2xlTW9udGhzICsgJyDguYDguJTguLfguK3guJknLCBkLm92ZXJkdWUubGVuZ3RoID8gJ2JhZCc6J2dvb2QnKSArCiAgICAgIGtwaSgn4LiE4Lin4Liy4Lih',
  '4LiE4Li34Lia4Lir4LiZ4LmJ4LiyJywgcGN0KGQucm9vbXMubGVuZ3RoID8gZC5yb29tc0RvbmVJblllYXIvZC5yb29tcy5sZW5ndGgqMTAwIDogMCksICfguILguK3guIfguJfguLHguYnguIfguKvguKHguJQgJyArIGQucm9vbXMubGVuZ3RoICsgJyDguKvguYng',
  'uK3guIcnKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgYWN0aW9ucyA9ICc8ZGl2IGNsYXNzPSJyb3cgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtQWMobnVsbCkiPisg4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy',
  '4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImZvcm1CdWxrQWMoKSI+8J+ThSDguJnguLHguJTguKXguYnguLLguIfguKvguKXguLLguKLguKvguYnguK3guIfguJ7guKPguYng',
  'uK3guKHguIHguLHguJk8L2J1dHRvbj4nICsKICAgICAgJzxzcGFuIGNsYXNzPSJzcCI+PC9zcGFuPicgKwogICAgICAnPHNwYW4gY2xhc3M9ImZzMTIgbXV0ZWQiPuC4hOC4peC4tOC4geC4l+C4teC5iOC4q+C5ieC4reC4h+C5gOC4nuC4t+C5iOC4reC4lOC4uS/g',
  'uYDguJ7guLTguYjguKHguKPguK3guJrguIHguLLguKPguKXguYnguLLguIc8L3NwYW4+JyArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgZ3JpZCA9IGNhcmQoJ+KdhO+4jyDguJXguLLguKPguLLguIfguKXguYnguLLguIfguYHguK3guKPguYzguKPguLLguKLguKvg',
  'uYnguK3guIcgwrcgJyArIHllYXJMYWJlbCwgcm9vbUZsb29ycyhkLnJvb21zLCBmdW5jdGlvbihyKXsKICAgICAgdmFyIGNscyA9IHIucm91bmRzSW5ZZWFyID4gMCA/ICdzLW9rJyA6IChyLnN0YXRlID09PSAn4LmA4LiB4Li04LiZ4LiB4Liz4Lir4LiZ4LiUJyA/',
  'ICdzLWRncicgOiAoci5zdGF0ZSA9PT0gJ+C4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4peC5ieC4suC4hycgPyAncy13YXJuJyA6ICdzLWluZm8nKSk7CiAgICAgIHZhciBzdWIgPSByLnJvdW5kc0luWWVhciA+IDAKICAgICAgICA/ICc8Yj4nICsgci5yb3Vu',
  'ZHNJblllYXIgKyAnIOC4o+C4reC4mjwvYj48YnI+JyArIHRoRGF0ZVNob3J0KHIucmVjb3Jkcy5maWx0ZXIoZnVuY3Rpb24oeCl7cmV0dXJuIHguc2VydmljZURhdGU7fSkubWFwKGZ1bmN0aW9uKHgpe3JldHVybiB4LnNlcnZpY2VEYXRlO30pLnNvcnQoKS5wb3Ao',
  'KSkKICAgICAgICA6IChyLmJvb2tlZEluWWVhciA/ICfguJnguLHguJTguYHguKXguYnguKcgJyArIHIuYm9va2VkSW5ZZWFyIDogKHIubGFzdFNlcnZpY2UgPyAn4Lil4LmI4Liy4Liq4Li44LiUICcgKyB0aERhdGVTaG9ydChyLmxhc3RTZXJ2aWNlKSA6ICfguYTg',
  'uKHguYjguKHguLXguJvguKPguLDguKfguLHguJXguLQnKSk7CiAgICAgIHJldHVybiB7IGNsczogY2xzLCBzdWI6IHN1Yiwgb25jbGljazogJ29wZW5BY1Jvb20oXCcnICsgci5yb29tICsgJ1wnKScgfTsKICAgIH0pLCAnJywgZmFsc2UpOwoKICAgIHZhciBsaXN0',
  'Um93cyA9IFtdOwogICAgZC5yb29tcy5mb3JFYWNoKGZ1bmN0aW9uKHIpeyByLnJlY29yZHMuZm9yRWFjaChmdW5jdGlvbih4KXsgeC5fcm9vbSA9IHIucm9vbTsgbGlzdFJvd3MucHVzaCh4KTsgfSk7IH0pOwogICAgbGlzdFJvd3Muc29ydChmdW5jdGlvbihhLGIp',
  'eyByZXR1cm4gU3RyaW5nKGIuc2VydmljZURhdGV8fGIuYm9va0RhdGV8fCcnKS5sb2NhbGVDb21wYXJlKFN0cmluZyhhLnNlcnZpY2VEYXRlfHxhLmJvb2tEYXRlfHwnJykpOyB9KTsKCiAgICB2YXIgbGlzdCA9IGNhcmQoJ/Cfk4sg4Lib4Lij4Liw4Lin4Lix4LiV',
  '4Li04LiB4Liy4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMIMK3ICcgKyB5ZWFyTGFiZWwgKyAnICgnICsgbGlzdFJvd3MubGVuZ3RoICsgJyknLAogICAgICBsaXN0Um93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFk',
  'Pjx0cj4nICsKICAgICAgICAnPHRoPuC4q+C5ieC4reC4hzwvdGg+PHRoPuC4o+C4reC4muC4l+C4teC5iDwvdGg+PHRoPuC4p+C4seC4meC4l+C4teC5iOC4meC4seC4lDwvdGg+PHRoPuC4p+C4seC4meC4l+C4teC5iOC4lOC4s+C5gOC4meC4tOC4meC4geC4suC4',
  'ozwvdGg+PHRoPuC4quC4luC4suC4meC4sDwvdGg+JyArCiAgICAgICAgJzx0aD7guIrguYjguLLguIc8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguYjguLLguYPguIrguYnguIjguYjguLLguKI8L3RoPjx0aD7guKDguLLguJ48L3RoPjx0aD7guKvguKHguLLguKLg',
  'uYDguKvguJXguLg8L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgbGlzdFJvd3MubWFwKGZ1bmN0aW9uKHgpewogICAgICAgICAgcmV0dXJuICc8dHI+JyArCiAgICAgICAgICAgICc8dGQ+PGI+JyArIGVzYyh4LnJvb20pICsgJzwv',
  'Yj48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAoeC5yb3VuZCB8fCAxKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LmJvb2tEYXRlKSArICc8L3RkPicgKwogICAgICAg',
  'ICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LnNlcnZpY2VEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyBzdGF0dXNCYWRnZSh4LnN0YXR1cykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMx',
  'MiI+JyArIGVzYyh4LnRlY2huaWNpYW4gfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIG51bSh4LmNvc3QpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwoeC5waG90b1JlZnMpICsg',
  'JzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIgbXV0ZWQgY2xpcCI+JyArIGVzYyh4Lm5vdGUgfHwgJycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsKICAgICAgICAgICAgICAnPGJ1dHRv',
  'biBjbGFzcz0iYnRuIHNtIGljb24iIG9uY2xpY2s9XCdmb3JtQWMoJyArIGF0dHIoeCkgKyAnKVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiBkZ3IiIG9uY2xpY2s9ImRlbEFjKFwnJyArIHguaWQg',
  'KyAnXCcpIj7wn5eRPC9idXR0b24+JyArCiAgICAgICAgICAgICc8L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6IGVtcHR5Qm94KCfguKLguLHguIfguYTguKHguYjguKHguLXguJrg',
  'uLHguJnguJfguLbguIHguIHguLLguKPguKXguYnguLLguIfguYHguK3guKPguYzguYPguJknICsgeWVhckxhYmVsKSwgJycsIHRydWUpOwoKICAgIHJldHVybiBoZWFkICsgYWN0aW9ucyArIGdyaWQgKyAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIGxpc3QgKyAnPC9k',
  'aXY+JzsKICB9Cn07CgpmdW5jdGlvbiBvcGVuQWNSb29tKHJvb20pewogIHZhciBkID0gUy5jYWNoZS5hYzsKICB2YXIgciA9IGQucm9vbXMuZmlsdGVyKGZ1bmN0aW9uKHgpeyByZXR1cm4geC5yb29tID09PSByb29tOyB9KVswXTsKICB2YXIgYm9keSA9CiAgICAn',
  'PGRpdiBjbGFzcz0iZ3JpZCBnMyBtYjEyIj4nICsKICAgICAga3BpKCfguKPguK3guJrguJfguLXguYjguKXguYnguLLguIfguYPguJnguJvguLXguJnguLXguYknLCAoci5yb3VuZHNJblllYXJ8fDApICsgJyDguKPguK3guJonLCAnJykgKwogICAgICBrcGkoJ+C4',
  'peC5ieC4suC4h+C4peC5iOC4suC4quC4uOC4lCcsIHIubGFzdFNlcnZpY2UgPyB0aERhdGUoci5sYXN0U2VydmljZSkgOiAn4oCTJywgci5sYXN0U2VydmljZSA/IChkYXlzQWdvKHIubGFzdFNlcnZpY2UpICsgJyDguKfguLHguJnguJfguLXguYjguYHguKXguYng',
  'uKcnKSA6ICcnKSArCiAgICAgIGtwaSgn4LiE4Lij4Lia4LiB4Liz4Lir4LiZ4LiU4Lij4Lit4Lia4LiW4Lix4LiU4LmE4LibJywgci5uZXh0RHVlID8gdGhEYXRlKHIubmV4dER1ZSkgOiAn4oCTJywgci5zdGF0ZSwgci5zdGF0ZSA9PT0gJ+C5gOC4geC4tOC4meC4',
  'geC4s+C4q+C4meC4lCcgPyAnYmFkJyA6ICcnKSArCiAgICAnPC9kaXY+JyArCiAgICAoci5yZWNvcmRzLmxlbmd0aAogICAgICA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOmF1dG8iPjx0aGVhZD48dHI+PHRoPuC4',
  'o+C4reC4mjwvdGg+PHRoPuC4meC4seC4lDwvdGg+PHRoPuC4lOC4s+C5gOC4meC4tOC4meC4geC4suC4ozwvdGg+PHRoPuC4quC4luC4suC4meC4sDwvdGg+PHRoPuC4oOC4suC4njwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICBy',
  'LnJlY29yZHMubWFwKGZ1bmN0aW9uKHgpewogICAgICAgICAgcmV0dXJuICc8dHI+PHRkPicgKyAoeC5yb3VuZHx8MSkgKyAnPC90ZD48dGQgY2xhc3M9ImZzMTIiPicgKyB0aERhdGUoeC5ib29rRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFz',
  'cz0iZnMxMiI+JyArIHRoRGF0ZSh4LnNlcnZpY2VEYXRlKSArICc8L3RkPjx0ZD4nICsgc3RhdHVzQmFkZ2UoeC5zdGF0dXMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwoeC5waG90b1JlZnMpICsgJzwvdGQ+JyArCiAgICAgICAg',
  'ICAgICc8dGQ+PGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPVwnY2xvc2VNb2RhbCgpO2Zvcm1BYygnICsgYXR0cih4KSArICcpXCc+4LmB4LiB4LmJ4LmE4LiCPC9idXR0b24+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48',
  'L3RhYmxlPjwvZGl2PicKICAgICAgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4muC4seC4meC4l+C4tuC4geC5g+C4meC4m+C4teC4l+C4teC5iOC5gOC4peC4t+C4reC4gTwvZGl2PicpOwoKICBvcGVuTW9kYWwoJ+KdhO+4',
  'jyDguKXguYnguLLguIfguYHguK3guKPguYwgwrcg4Lir4LmJ4Lit4LiHICcgKyByb29tLCBib2R5LAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guJvguLTguJQ8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJi',
  'dG4gcHJpIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCk7Zm9ybUFjKHtyb29tOlwnJyArIHJvb20gKyAnXCd9KSI+KyDguYDguJ7guLTguYjguKHguKPguK3guJrguIHguLLguKPguKXguYnguLLguIc8L2J1dHRvbj4nKTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDUpIOC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4suC4oeC4q+C5ieC4reC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT0gKi8KUk9VVEVTLnJlcGFpcnMgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsgcmV0dXJuIGNhbGxBcGkoJ3JlcGFpci5tYXRyaXgnLCB7IHllYXI6IFMueWVhciB9KTsgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9',
  'PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKICAgIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgIGtwaSgn4LiH4Liy4LiZ4LiL4LmI4Lit4LihICcgKyB5ZWFyTGFiZWwsIGQudG90',
  'YWxKb2JzICsgJyDguIfguLLguJknLCAn4LiI4Liy4LiBICcgKyBkLnJvb21zLmZpbHRlcihmdW5jdGlvbihyKXtyZXR1cm4gci5jb3VudD4wO30pLmxlbmd0aCArICcg4Lir4LmJ4Lit4LiHJywgJ2FjY2VudCcpICsKICAgICAga3BpKCfguIfguLLguJnguJfguLXg',
  'uYjguKLguLHguIfguYTguKHguYjguYDguKrguKPguYfguIgnLCBkLm9wZW5Kb2JzICsgJyDguIfguLLguJknLCAnJywgZC5vcGVuSm9icyA/ICd3YXJuJyA6ICdnb29kJykgKwogICAgICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC4o+C4p+C4',
  'oScsIGJhaHQoZC50b3RhbENvc3QpLCB5ZWFyTGFiZWwpICsKICAgICAga3BpKCfguKvguYnguK3guIfguJfguLXguYjguKLguLHguIfguYTguKHguYjguYDguITguKLguIvguYjguK3guKEnLCBkLnJvb21zLmZpbHRlcihmdW5jdGlvbihyKXtyZXR1cm4gci5jb3Vu',
  'dD09PTA7fSkubGVuZ3RoICsgJyDguKvguYnguK3guIcnLCAn4LmD4LiZJyArIHllYXJMYWJlbCkgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIGFjdGlvbnMgPSAnPGRpdiBjbGFzcz0icm93IG1iMTIiPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIg',
  'b25jbGljaz0iZm9ybVJlcGFpcihudWxsKSI+KyDguYHguIjguYnguIfguIvguYjguK3guKEgLyDguJrguLHguJnguJfguLbguIHguIfguLLguJnguIvguYjguK3guKE8L2J1dHRvbj4nICsKICAgICAgJzxzcGFuIGNsYXNzPSJzcCI+PC9zcGFuPjxzcGFuIGNsYXNz',
  'PSJmczEyIG11dGVkIj7guITguKXguLTguIHguJfguLXguYjguKvguYnguK3guIfguYDguJ7guLfguYjguK3guJTguLnguJvguKPguLDguKfguLHguJXguLTguIfguLLguJnguIvguYjguK3guKHguILguK3guIfguKvguYnguK3guIfguJnguLHguYnguJk8L3NwYW4+',
  'PC9kaXY+JzsKCiAgICB2YXIgZ3JpZCA9IGNhcmQoJ/CflKcg4Lig4Liy4Lie4Lij4Lin4Lih4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4Lij4Liy4Lii4Lir4LmJ4Lit4LiHIMK3ICcgKyB5ZWFyTGFiZWwsIHJvb21GbG9vcnMoZC5yb29tcywgZnVuY3Rpb24ocil7CiAg',
  'ICAgIHZhciBjbHMgPSByLm9wZW5Db3VudCA+IDAgPyAncy1kZ3InIDogKHIuY291bnQgPiAwID8gJ3Mtb2snIDogJ3MtaW5mbycpOwogICAgICB2YXIgc3ViID0gci5jb3VudCA+IDAKICAgICAgICA/ICc8Yj4nICsgci5jb3VudCArICcg4LiH4Liy4LiZPC9iPicg',
  'KyAoci5vcGVuQ291bnQgPyAnIMK3IOC4hOC5ieC4suC4hyAnICsgci5vcGVuQ291bnQgOiAnJykgKyAnPGJyPicgKyAoci5sYXN0ID8gdGhEYXRlU2hvcnQoci5sYXN0KSA6ICcnKQogICAgICAgIDogJ+C5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4i+C5iOC4reC4',
  'oSc7CiAgICAgIHJldHVybiB7IGNsczogY2xzLCBzdWI6IHN1Yiwgb25jbGljazogJ29wZW5SZXBhaXJSb29tKFwnJyArIHIucm9vbSArICdcJyknIH07CiAgICB9KSk7CgogICAgdmFyIHJvd3MgPSBbXTsKICAgIGQucm9vbXMuZm9yRWFjaChmdW5jdGlvbihyKXsg',
  'ci5yZWNvcmRzLmZvckVhY2goZnVuY3Rpb24oeCl7IHJvd3MucHVzaCh4KTsgfSk7IH0pOwogICAgcm93cy5zb3J0KGZ1bmN0aW9uKGEsYil7IHJldHVybiBTdHJpbmcoYi5yZXBhaXJEYXRlfHxiLmJvb2tEYXRlfHwnJykubG9jYWxlQ29tcGFyZShTdHJpbmcoYS5y',
  'ZXBhaXJEYXRlfHxhLmJvb2tEYXRlfHwnJykpOyB9KTsKCiAgICB2YXIgbGlzdCA9IGNhcmQoJ/Cfk4sg4Lij4Liy4Lii4LiB4Liy4Lij4LiH4Liy4LiZ4LiL4LmI4Lit4LihIMK3ICcgKyB5ZWFyTGFiZWwgKyAnICgnICsgcm93cy5sZW5ndGggKyAnKScsCiAgICAg',
  'IHJvd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiIHN0eWxlPSJtaW4td2lkdGg6MTAyMHB4Ij48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4Lir4LmJ4Lit4LiHPC90aD48dGg+4Lin4Lix4LiZ4LiZ4Lix4LiU4LiL4LmI4Lit',
  '4LihPC90aD48dGg+4Lin4Lix4LiZ4LmA4LiC4LmJ4Liy4LiL4LmI4Lit4LihPC90aD48dGg+4Lib4Lij4Liw4LmA4Lig4LiXPC90aD48dGg+4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4LiL4LmI4Lit4Lih4LmB4LiL4LihPC90aD4nICsKICAgICAgICAnPHRo',
  'PuC4quC4luC4suC4meC4sDwvdGg+PHRoIGNsYXNzPSJudW0iPuC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ojwvdGg+PHRoPuC4geC5iOC4reC4mTwvdGg+PHRoPuC4q+C4peC4seC4hzwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAg',
  'ICAgICByb3dzLm1hcChmdW5jdGlvbih4KXsKICAgICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgICAnPHRkPjxiPicgKyBlc2MoeC5yb29tKSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyB0aERh',
  'dGUoeC5ib29rRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyB0aERhdGUoeC5yZXBhaXJEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKHguY2F0ZWdvcnkg',
  'fHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTMiPjxkaXYgY2xhc3M9ImNsaXAiPicgKyBlc2MoeC5pdGVtcyB8fCAnJykgKyAnPC9kaXY+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgc3RhdHVzQmFkZ2UoeC5zdGF0',
  'dXMpICsgKHgucHJpb3JpdHkgJiYgeC5wcmlvcml0eSAhPT0gJ+C4m+C4geC4leC4tCcgPyAnICcgKyBzdGF0dXNCYWRnZSh4LnByaW9yaXR5KSA6ICcnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyBudW0oeC5jb3N0KSArICc8',
  'L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHguYmVmb3JlUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCh4LmFmdGVyUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48ZGl2IGNsYXNz',
  'PSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1SZXBhaXIoJyArIGF0dHIoeCkgKyAnKVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJi',
  'dG4gc20gaWNvbiBkZ3IiIG9uY2xpY2s9ImRlbFJlcGFpcihcJycgKyB4LmlkICsgJ1wnKSI+8J+XkTwvYnV0dG9uPicgKwogICAgICAgICAgICAnPC9kaXY+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicK',
  'ICAgICAgOiBlbXB0eUJveCgn4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LmD4LiZJyArIHllYXJMYWJlbCwgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZvcm1SZXBhaXIobnVsbCkiPisg4LmB4LiI4LmJ4LiH',
  '4LiL4LmI4Lit4LihPC9idXR0b24+JyksICcnLCB0cnVlKTsKCiAgICByZXR1cm4gaGVhZCArIGFjdGlvbnMgKyBncmlkICsgJzxkaXYgY2xhc3M9Im10MTIiPicgKyBsaXN0ICsgJzwvZGl2Pic7CiAgfQp9OwoKZnVuY3Rpb24gb3BlblJlcGFpclJvb20ocm9vbSl7',
  'CiAgdmFyIGQgPSBTLmNhY2hlLnJlcGFpcnM7CiAgdmFyIHIgPSBkLnJvb21zLmZpbHRlcihmdW5jdGlvbih4KXsgcmV0dXJuIHgucm9vbSA9PT0gcm9vbTsgfSlbMF07CiAgdmFyIGJvZHkgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnMyBtYjEyIj4nICsKICAgICAga3Bp',
  'KCfguIfguLLguJnguJfguLHguYnguIfguKvguKHguJQnLCByLmNvdW50ICsgJyDguIfguLLguJknLCAnJykgKwogICAgICBrcGkoJ+C4ouC4seC4h+C5hOC4oeC5iOC5gOC4quC4o+C5h+C4iCcsIHIub3BlbkNvdW50ICsgJyDguIfguLLguJknLCAnJywgci5vcGVu',
  'Q291bnQgPyAnd2Fybic6J2dvb2QnKSArCiAgICAgIGtwaSgn4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiJywgYmFodChyLmNvc3QpLCAnJykgKwogICAgJzwvZGl2PicgKwogICAgKHIucmVjb3Jkcy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idGwiPicgKyBy',
  'LnJlY29yZHMubWFwKGZ1bmN0aW9uKHgpewogICAgICByZXR1cm4gJzxkaXYgY2xhc3M9InRsLWkiPjxkaXYgY2xhc3M9ImQiPicgKyB0aERhdGUoeC5yZXBhaXJEYXRlIHx8IHguYm9va0RhdGUpICsgJyDCtyAnICsgZXNjKHguY2F0ZWdvcnl8fCcnKSArICcgJyAr',
  'IHN0YXR1c0JhZGdlKHguc3RhdHVzKSArICc8L2Rpdj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0idCI+JyArIGVzYyh4Lml0ZW1zIHx8ICcnKSArICc8L2Rpdj4nICsKICAgICAgICAoeC50ZWNobmljaWFuID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQiPuC4iuC5',
  'iOC4suC4hzogJyArIGVzYyh4LnRlY2huaWNpYW4pICsgJzwvZGl2PicgOiAnJykgKwogICAgICAgICh4LmNvc3QgPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCI+4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiICcgKyBiYWh0KHguY29zdCkgKyAnPC9kaXY+',
  'JyA6ICcnKSArCiAgICAgICAgJzxkaXYgY2xhc3M9Im10OCI+JyArIHRodW1ic0h0bWwoKHguYmVmb3JlUmVmc3x8W10pLmNvbmNhdCh4LmFmdGVyUmVmc3x8W10pKSArICc8L2Rpdj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0ibXQ4Ij48YnV0dG9uIGNsYXNzPSJi',
  'dG4gc20iIG9uY2xpY2s9XCdjbG9zZU1vZGFsKCk7Zm9ybVJlcGFpcignICsgYXR0cih4KSArICcpXCc+4LmB4LiB4LmJ4LmE4LiCPC9idXR0b24+PC9kaXY+JyArCiAgICAgICc8L2Rpdj4nOwogICAgfSkuam9pbignJykgKyAnPC9kaXY+JyA6ICc8ZGl2IGNsYXNz',
  'PSJlbXB0eSI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LmD4LiZ4Lib4Li14LiX4Li14LmI4LmA4Lil4Li34Lit4LiBPC9kaXY+Jyk7CgogIG9wZW5Nb2RhbCgn8J+UpyDguIfguLLguJnguIvguYjguK3guKEgwrcg4Lir4LmJ',
  '4Lit4LiHICcgKyByb29tLCBib2R5LAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guJvguLTguJQ8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCk7Zm9ybVJl',
  'cGFpcih7cm9vbTpcJycgKyByb29tICsgJ1wnfSkiPisg4LmA4Lie4Li04LmI4Lih4LiH4Liy4LiZ4LiL4LmI4Lit4LihPC9idXR0b24+JywgdHJ1ZSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PQogICA2KSDguIvguYjguK3guKHguYHguIvguKHguJXguLbguIHguYLguJTguKLguKPguKfguKEKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5idWlsZGluZyA9IHsKICBs',
  'b2FkOiBmdW5jdGlvbigpewogICAgcmV0dXJuIFByb21pc2UuYWxsKFsKICAgICAgY2FsbEFwaSgnYnVpbGRpbmcuc3VtbWFyeScsIHsgeWVhcjogUy55ZWFyIH0pLAogICAgICBjYWxsQXBpKCdidWlsZGluZy5saXN0JywgeyB5ZWFyOiBTLnllYXIsIHpvbmU6IFMu',
  'cGFyYW1zLnpvbmUgfHwgJycsIHN0YXR1czogJycgfSkKICAgIF0pLnRoZW4oZnVuY3Rpb24ocil7IHZhciBkID0gclswXTsgZC5pdGVtcyA9IHJbMV07IHJldHVybiBkOyB9KTsKICB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgeWVhckxhYmVsID0g',
  'Uy55ZWFyID09PSAnYWxsJyA/ICfguJfguLjguIHguJvguLUnIDogJ+C4m+C4tSAnICsgUy55ZWFyOwogICAgdmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAga3BpKCfguIfguLLguJnguJvguLUgJyArIChTLnllYXI9PT0nYWxs',
  'Jz8n4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJzpTLnllYXIpLCBkLnllYXJDb3VudCArICcg4LiH4Liy4LiZJywgJ+C4quC4sOC4quC4oSAnICsgZC50b3RhbCArICcg4LiH4Liy4LiZJywgJ2FjY2VudCcpICsKICAgICAga3BpKCfguITguYjguLLguYPguIrguYnguIjg',
  'uYjguLLguKIgJyArIHllYXJMYWJlbCwgYmFodChkLnllYXJDb3N0KSwgJ+C4quC4sOC4quC4oSAnICsgYmFodChkLmdyYW5kQ29zdCkpICsKICAgICAga3BpKCfguIfguLLguJnguJfguLXguYjguKLguLHguIfguYTguKHguYjguYDguKrguKPguYfguIgnLCBkLm9w',
  'ZW5Db3VudCArICcg4LiH4Liy4LiZJywgJycsIGQub3BlbkNvdW50ID8gJ3dhcm4nIDogJ2dvb2QnKSArCiAgICAgIGtwaSgn4LiE4Lij4Lia4LiB4Liz4Lir4LiZ4LiU4LmD4LiZIDkwIOC4p+C4seC4mScsIGQudXBjb21pbmcubGVuZ3RoICsgJyDguIfguLLguJkn',
  'LCBkLnVwY29taW5nLmxlbmd0aCA/IGQudXBjb21pbmdbMF0udGl0bGUgOiAnJywgZC51cGNvbWluZy5sZW5ndGggPyAnd2FybicgOiAnJykgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIHpvbmVzID0gJzxkaXYgY2xhc3M9ImNoaXBzIG1iMTIiPicgKwogICAgICAn',
  'PGJ1dHRvbiBjbGFzcz0iY2hpcCAnICsgKCFTLnBhcmFtcy56b25lPydvbic6JycpICsgJyIgb25jbGljaz0ic2V0UGFyYW0oXCd6b25lXCcsXCdcJykiPuC4l+C4uOC4geC4quC5iOC4p+C4mTwvYnV0dG9uPicgKwogICAgICBkLmJ5Wm9uZS5tYXAoZnVuY3Rpb24o',
  'eil7CiAgICAgICAgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJjaGlwICcgKyAoUy5wYXJhbXMuem9uZT09PXouem9uZT8nb24nOicnKSArICciIG9uY2xpY2s9InNldFBhcmFtKFwnem9uZVwnLFwnJyArIGVzYyh6LnpvbmUpICsgJ1wnKSI+JyArCiAgICAgICAgICAg',
  'ICAgIGVzYyh6LnpvbmUpICsgJyAoJyArIHouY291bnQgKyAnKTwvYnV0dG9uPic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7CgogICAgdmFyIGNoYXJ0cyA9ICc8ZGl2IGNsYXNzPSJncmlkIGcyIG1iMTIiPicgKwogICAgICBjYXJkKCfwn4+X77iPIOC4',
  'hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC5geC4ouC4geC4leC4suC4oeC4quC5iOC4p+C4meC4guC4reC4h+C4reC4suC4hOC4suC4oycsIGJhckNoYXJ0KGQuYnlab25lLCAnem9uZScsICdjb3N0JywgZnVuY3Rpb24oaSl7IHJldHVybiBtb25leShpLmNv',
  'c3QpICsgJyDguL8nOyB9KSkgKwogICAgICBjYXJkKCfwn5OFIOC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC5geC4ouC4geC4leC4suC4oeC4m+C4tScsIGJhckNoYXJ0KAogICAgICAgIGQuYnlZZWFyLm1hcChmdW5jdGlvbih5KXsgcmV0dXJuIHsgbGFi',
  'ZWw6J+C4m+C4tSAnICsgeS55ZWFyICsgJyAoJyArIHkuY291bnQgKyAnIOC4h+C4suC4mSknLCBjb3N0OnkuY29zdCB9OyB9KSwKICAgICAgICAnbGFiZWwnLCAnY29zdCcsIGZ1bmN0aW9uKGkpeyByZXR1cm4gbW9uZXkoaS5jb3N0KSArICcg4Li/JzsgfSkpICsK',
  'ICAgICc8L2Rpdj4nOwoKICAgIHZhciByb3dzID0gZC5pdGVtczsKICAgIHZhciBsaXN0ID0gY2FyZCgn8J+PoiDguKPguLLguKLguIHguLLguKPguIvguYjguK3guKHguYHguIvguKHguJXguLbguIHguYLguJTguKLguKPguKfguKEgwrcgJyArIHllYXJMYWJlbCAr',
  'ICcgKCcgKyByb3dzLmxlbmd0aCArICcpJywKICAgICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDoxMDIwcHgiPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guKrguYjguKfguJnguILg',
  'uK3guIfguK3guLLguITguLLguKM8L3RoPjx0aD7guKPguLLguKLguIHguLLguKM8L3RoPjx0aD7guJnguLHguJQ8L3RoPjx0aD7guYDguKPguLTguYjguKE8L3RoPjx0aD7guYDguKrguKPguYfguIg8L3RoPjx0aD7guKrguJbguLLguJnguLA8L3RoPicgKwogICAg',
  'ICAgICc8dGg+4Lic4Li54LmJ4Lij4Lix4Lia4LmA4Lir4Lih4LiyPC90aD48dGggY2xhc3M9Im51bSI+4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiPC90aD48dGg+4Lij4Lit4Lia4LiW4Lix4LiU4LmE4LibPC90aD48dGg+4Lig4Liy4LiePC90aD48dGg+',
  'PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIHJvd3MubWFwKGZ1bmN0aW9uKHgpewogICAgICAgICAgcmV0dXJuICc8dHI+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPjxiPicgKyBlc2MoeC56b25lIHx8ICfigJMnKSArICc8L2I+',
  'PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMyI+PGRpdiBjbGFzcz0iY2xpcCI+JyArIGVzYyh4LnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgICAgICAgICAoeC5ub3RlID8gJzxkaXYgY2xhc3M9ImZzMTIgZmFpbnQgY2xpcCI+JyArIGVzYyh4',
  'Lm5vdGUpICsgJzwvZGl2PicgOiAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyB0aERhdGUoeC5ib29rRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyB0',
  'aERhdGUoeC5zdGFydERhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHguZW5kRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgc3RhdHVzQmFkZ2UoeC5zdGF0dXMpICsgJzwv',
  'dGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MoeC5jb250cmFjdG9yIHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyBudW0oeC5jb3N0KSArICc8L3RkPicgKwogICAgICAgICAgICAn',
  'PHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArICh4Lm5leHREdWUgPyB0aERhdGVTaG9ydCh4Lm5leHREdWUpICsKICAgICAgICAgICAgICAgICh4LmR1ZUluRGF5cyAhPSBudWxsID8gJzxkaXYgY2xhc3M9ImZhaW50IiBzdHlsZT0iZm9udC1zaXplOjExcHgiPicg',
  'KyAoeC5kdWVJbkRheXM8MCA/ICfguYDguKXguKIgJyArICgteC5kdWVJbkRheXMpICsgJyDguKfguLHguJknIDogJ+C4reC4teC4gSAnICsgeC5kdWVJbkRheXMgKyAnIOC4p+C4seC4mScpICsgJzwvZGl2PicgOiAnJykKICAgICAgICAgICAgICA6ICfigJMnKSAr',
  'ICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKCh4LnBob3RvUmVmc3x8W10pLmNvbmNhdCh4LnNsaXBSZWZzfHxbXSkpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsKICAgICAgICAg',
  'ICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24iIG9uY2xpY2s9XCdmb3JtQnVpbGRpbmcoJyArIGF0dHIoeCkgKyAnKVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiBkZ3IiIG9uY2xpY2s9',
  'ImRlbEJ1aWxkaW5nKFwnJyArIHguaWQgKyAnXCcpIj7wn5eRPC9idXR0b24+JyArCiAgICAgICAgICAgICc8L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6IGVtcHR5Qm94KCfguKLg',
  'uLHguIfguYTguKHguYjguKHguLXguIfguLLguJnguIvguYjguK3guKHguYHguIvguKHguJXguLbguIHguYPguJknICsgeWVhckxhYmVsLCAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZm9ybUJ1aWxkaW5nKG51bGwpIj4rIOC5gOC4nuC4tOC5iOC4',
  'oeC4h+C4suC4meC4i+C5iOC4reC4oeC4leC4tuC4gTwvYnV0dG9uPicpLAogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSBzbSIgb25jbGljaz0iZm9ybUJ1aWxkaW5nKG51bGwpIj4rIOC5gOC4nuC4tOC5iOC4oeC4h+C4suC4meC4i+C5iOC4reC4oeC4leC4',
  'tuC4gTwvYnV0dG9uPicsIHRydWUpOwoKICAgIHJldHVybiBoZWFkICsgem9uZXMgKyBjaGFydHMgKyBsaXN0OwogIH0KfTsKCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICA3KSDguKvguYng',
  'uK3guIfguJ7guLHguIEKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5yb29tcyA9IHsKICBsb2FkOiBmdW5jdGlvbigpeyByZXR1cm4gY2FsbEFwaSgncm9vbS5saXN0JykudGhl',
  'bihmdW5jdGlvbihmbG9vcnMpeyByZXR1cm4geyBmbG9vcnM6IGZsb29ycywgeWVhcnM6IFtdIH07IH0pOyB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgZmxhdCA9IFtdOwogICAgZC5mbG9vcnMuZm9yRWFjaChmdW5jdGlvbihmKXsgZi5yb29tcy5m',
  'b3JFYWNoKGZ1bmN0aW9uKHIpeyBmbGF0LnB1c2gocik7IH0pOyB9KTsKICAgIHZhciBvY2MgPSBmbGF0LmZpbHRlcihmdW5jdGlvbihyKXsgcmV0dXJuIHIuc3RhdHVzID09PSAn4Lih4Li14Lic4Li54LmJ4LmA4LiK4LmI4LiyJzsgfSkubGVuZ3RoOwoKICAgIHZh',
  'ciBoZWFkID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgIGtwaSgn4Lir4LmJ4Lit4LiH4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJywgZmxhdC5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsICc1IOC4iuC4seC5ieC4mScsICdhY2NlbnQnKSArCiAg',
  'ICAgIGtwaSgn4Lih4Li14Lic4Li54LmJ4LmA4LiK4LmI4LiyJywgb2NjICsgJyDguKvguYnguK3guIcnLCBwY3QoZmxhdC5sZW5ndGggPyBvY2MvZmxhdC5sZW5ndGgqMTAwIDogMCkgKyAnIOC4reC4seC4leC4o+C4suC5gOC4guC5ieC4suC4nuC4seC4gScsICdn',
  'b29kJykgKwogICAgICBrcGkoJ+C4q+C5ieC4reC4h+C4p+C5iOC4suC4hycsIGZsYXQuZmlsdGVyKGZ1bmN0aW9uKHIpeyByZXR1cm4gci5zdGF0dXMgPT09ICfguKfguYjguLLguIcnOyB9KS5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsICcnLCAnd2FybicpICsK',
  'ICAgICAga3BpKCfguITguYjguLLguYDguIrguYjguLLguKPguKfguKEv4LmA4LiU4Li34Lit4LiZJywgYmFodChmbGF0LnJlZHVjZShmdW5jdGlvbihhLHIpeyByZXR1cm4gYSArIChOdW1iZXIoci5yZW50KXx8MCk7IH0sIDApKSwgJ+C4iOC4suC4geC4q+C5ieC4',
  'reC4h+C4l+C4teC5iOC4geC4o+C4reC4geC4hOC5iOC4suC5gOC4iuC5iOC4suC5hOC4p+C5iScpICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciBncmlkID0gY2FyZCgn8J+aqiDguJzguLHguIfguKvguYnguK3guIfguJ7guLHguIEnLCByb29tRmxvb3JzKGZsYXQs',
  'IGZ1bmN0aW9uKHIpewogICAgICB2YXIgY2xzID0gci5zdGF0dXMgPT09ICfguKHguLXguJzguLnguYnguYDguIrguYjguLInID8gJ3Mtb2snIDogKHIuc3RhdHVzID09PSAn4Lin4LmI4Liy4LiHJyA/ICdzLWluZm8nIDogJ3Mtd2FybicpOwogICAgICByZXR1cm4g',
  'eyBjbHM6IGNscywgc3ViOiBlc2Moci50ZW5hbnQgfHwgci5zdGF0dXMgfHwgJycpICsgKHIucmVudCA/ICc8YnI+JyArIG1vbmV5KHIucmVudCkgKyAnIOC4vycgOiAnJyksCiAgICAgICAgICAgICAgIG9uY2xpY2s6ICdvcGVuUm9vbShcJycgKyByLnJvb20gKyAn',
  'XCcpJyB9OwogICAgfSksICc8c3BhbiBjbGFzcz0iZnMxMiBtdXRlZCI+4LiE4Lil4Li04LiB4LiX4Li14LmI4Lir4LmJ4Lit4LiH4LmA4Lie4Li34LmI4Lit4LiU4Li54Lib4Lij4Liw4Lin4Lix4LiV4Li04LiX4Lix4LmJ4LiH4Lir4Lih4LiU4LiC4Lit4LiH4Lir',
  '4LmJ4Lit4LiH4LiZ4Lix4LmJ4LiZPC9zcGFuPicpOwoKICAgIHJldHVybiBoZWFkICsgZ3JpZDsKICB9Cn07CgpmdW5jdGlvbiBvcGVuUm9vbShyb29tKXsKICBvcGVuTW9kYWwoJ/Cfmqog4Lir4LmJ4Lit4LiHICcgKyByb29tLCAnPGRpdiBjbGFzcz0iZW1wdHki',
  'PjxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C5guC4q+C4peC4lOKApjwvZGl2PicpOwogIGNhbGxBcGkoJ3Jvb20ucHJvZmlsZScsIHsgcm9vbTogcm9vbSB9KS50aGVuKGZ1bmN0aW9uKHApewogICAgdmFyIGkgPSBwLmluZm87CiAg',
  'ICB2YXIgYm9keSA9CiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICAgIGtwaSgn4Liq4LiW4Liy4LiZ4LiwJywgaS5zdGF0dXMgfHwgJ+KAkycsIGVzYyhpLnRlbmFudCB8fCAnJykpICsKICAgICAgICBrcGkoJ+C4peC5ieC4suC4h+C5',
  'geC4reC4o+C5jCcsIHAuYWNDb3VudCArICcg4LiE4Lij4Lix4LmJ4LiHJywgcC5sYXN0QWMgPyAn4Lil4LmI4Liy4Liq4Li44LiUICcgKyB0aERhdGUocC5sYXN0QWMpIDogJ+C5hOC4oeC5iOC4oeC4teC4m+C4o+C4sOC4p+C4seC4leC4tCcpICsKICAgICAgICBr',
  'cGkoJ+C4h+C4suC4meC4i+C5iOC4reC4oScsIHAucmVwYWlyQ291bnQgKyAnIOC4h+C4suC4mScsICfguITguYnguLLguIcgJyArIHAub3BlblJlcGFpcnMsIHAub3BlblJlcGFpcnMgPyAnd2FybicgOiAnJykgKwogICAgICAgIGtwaSgn4LiE4LmI4Liy4LmD4LiK',
  '4LmJ4LiI4LmI4Liy4Lii4Liq4Liw4Liq4LihJywgYmFodChwLnRvdGFsQ29zdCksICfguIvguYjguK3guKEgKyDguKXguYnguLLguIfguYHguK3guKPguYwnKSArCiAgICAgICc8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBtYjEyIj4nICsKICAgICAg',
  'ICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPVwnY2xvc2VNb2RhbCgpO2Zvcm1Sb29tKCcgKyBhdHRyKGkpICsgJylcJz7inI/vuI8g4LmB4LiB4LmJ4LmE4LiC4LiC4LmJ4Lit4Lih4Li54Lil4Lir4LmJ4Lit4LiHPC9idXR0b24+JyArCiAgICAgICAg',
  'JzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iY2xvc2VNb2RhbCgpO2Zvcm1SZXBhaXIoe3Jvb206XCcnICsgcm9vbSArICdcJ30pIj4rIOC5geC4iOC5ieC4h+C4i+C5iOC4reC4oTwvYnV0dG9uPicgKwogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4g',
  'c20iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtmb3JtQWMoe3Jvb206XCcnICsgcm9vbSArICdcJ30pIj4rIOC4peC5ieC4suC4h+C5geC4reC4o+C5jDwvYnV0dG9uPicgKwogICAgICAnPC9kaXY+JyArCiAgICAgIChwLmFzc2V0cy5sZW5ndGggPyAnPGRpdiBjbGFz',
  'cz0iY2FyZCBtYjEyIj48ZGl2IGNsYXNzPSJjYXJkLWgiPjxoMz7guJfguKPguLHguJ7guKLguYzguKrguLTguJnguYPguJnguKvguYnguK3guIc8L2gzPjwvZGl2PjxkaXYgY2xhc3M9ImNhcmQtYiI+JyArCiAgICAgICAgJzxkaXYgY2xhc3M9InR3Ij48dGFibGUg',
  'Y2xhc3M9InQiIHN0eWxlPSJtaW4td2lkdGg6YXV0byI+PHRoZWFkPjx0cj48dGg+4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZPC90aD48dGg+4Lii4Li14LmI4Lir4LmJ4LitL+C4o+C4uOC5iOC4mTwvdGg+PHRoPuC4leC4tOC4lOC4leC4seC5ieC4hzwvdGg+',
  'PHRoPuC4quC4luC4suC4meC4sDwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICBwLmFzc2V0cy5tYXAoZnVuY3Rpb24oYSl7CiAgICAgICAgICByZXR1cm4gJzx0cj48dGQ+JyArIGVzYyhhLm5hbWUpICsgJzwvdGQ+PHRkIGNsYXNzPSJmczEyIj4n',
  'ICsgZXNjKGEuYnJhbmR8fCfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyB0aERhdGUoYS5pbnN0YWxsRGF0ZSkgKyAnPC90ZD48dGQ+JyArIHN0YXR1c0JhZGdlKGEuc3RhdHVzKSArICc8L3RkPjwvdHI+JzsK',
  'ICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+PC9kaXY+PC9kaXY+JyA6ICcnKSArCiAgICAgICc8aDMgY2xhc3M9ImZzMTMgbWI4Ij7guJvguKPguLDguKfguLHguJXguLTguJfguLHguYnguIfguKvguKHguJQgKCcgKyBwLnRpbWVs',
  'aW5lLmxlbmd0aCArICcpPC9oMz4nICsKICAgICAgKHAudGltZWxpbmUubGVuZ3RoID8gJzxkaXYgY2xhc3M9InRsIj4nICsgcC50aW1lbGluZS5tYXAoZnVuY3Rpb24oZSl7CiAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJ0bC1pIj48ZGl2IGNsYXNzPSJkIj4n',
  'ICsgdGhEYXRlKGUuZGF0ZSkgKyAnIMK3ICcgKyBlc2MoZS50eXBlKSArICcgJyArIHN0YXR1c0JhZGdlKGUuc3RhdHVzKSArICc8L2Rpdj4nICsKICAgICAgICAgICc8ZGl2IGNsYXNzPSJ0Ij4nICsgZXNjKGUudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAg',
  'KGUuZGV0YWlsID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQiPicgKyBlc2MoZS5kZXRhaWwpICsgJzwvZGl2PicgOiAnJykgKwogICAgICAgICAgKGUuY29zdCA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIj4nICsgYmFodChlLmNvc3QpICsgJzwvZGl2PicgOiAn',
  'JykgKwogICAgICAgICAgKGUucGhvdG9zICYmIGUucGhvdG9zLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJtdDgiPicgKyB0aHVtYnNIdG1sKGUucGhvdG9zKSArICc8L2Rpdj4nIDogJycpICsKICAgICAgICAnPC9kaXY+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9k',
  'aXY+JyA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lib4Lij4Liw4Lin4Lix4LiV4Li0PC9kaXY+Jyk7CgogICAgb3Blbk1vZGFsKCfwn5qqIOC4q+C5ieC4reC4hyAnICsgcm9vbSArICcgwrcg4LiK4Lix4LmJ4LiZICcgKyAo',
  'aS5mbG9vcnx8JycpLCBib2R5LAogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4m+C4tOC4lDwvYnV0dG9uPicsIHRydWUpOwogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsICdlcnInKTsg',
  'Y2xvc2VNb2RhbCgpOyB9KTsKfQoKCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICA4KSDguKPguLLguKLguKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4Lii4Lir4LitICjguKPguLLguKLg',
  'uYDguJTguLfguK3guJkpCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMuZmluYW5jZSA9IHsKICBsb2FkOiBmdW5jdGlvbigpewogICAgcmV0dXJuIFByb21pc2UuYWxsKFsKICAg',
  'ICAgY2FsbEFwaSgnZmluYW5jZS5zdW1tYXJ5JywgeyB5ZWFyOiBTLnllYXIgfSksCiAgICAgIGNhbGxBcGkoJ2ZpbmFuY2UubGlzdCcsIHsgeWVhcjogUy55ZWFyLCBraW5kOiBTLnBhcmFtcy5raW5kIHx8ICcnIH0pCiAgICBdKS50aGVuKGZ1bmN0aW9uKHIpeyB2',
  'YXIgZCA9IHJbMF07IGQuaXRlbXMgPSByWzFdOyByZXR1cm4gZDsgfSk7CiAgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsK',
  'ICAgIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgIGtwaSgn4Lij4Liy4Lii4Lij4Lix4LiaICcgKyB5ZWFyTGFiZWwsIGJhaHQoZC5pbmNvbWUpLCAn4LmA4LiJ4Lil4Li14LmI4LiiICcgKyBiYWh0KGQuYXZnSW5jb21lKSAr',
  'ICcv4LmA4LiU4Li34Lit4LiZJywgJ2dvb2QnKSArCiAgICAgIGtwaSgn4Lij4Liy4Lii4LiI4LmI4Liy4LiiICcgKyB5ZWFyTGFiZWwsIGJhaHQoZC5leHBlbnNlKSwgJ+C5gOC4ieC4peC4teC5iOC4oiAnICsgYmFodChkLmF2Z0V4cGVuc2UpICsgJy/guYDguJTg',
  'uLfguK3guJknLCAnYmFkJykgKwogICAgICBrcGkoJ+C4hOC4h+C5gOC4q+C4peC4t+C4reC4quC4uOC4l+C4mOC4tCcsIGJhaHQoZC5uZXQpLCAn4Lit4Lix4LiV4Lij4Liy4LiB4Liz4LmE4LijICcgKyBwY3QoZC5tYXJnaW4pLCAnYWNjZW50ICcgKyAoZC5uZXQg',
  'Pj0gMCA/ICdnb29kJyA6ICdiYWQnKSkgKwogICAgICBrcGkoJ+C4muC4seC4meC4l+C4tuC4geC5geC4peC5ieC4pycsIGQubW9udGhzV2l0aERhdGEgKyAnIOC5gOC4lOC4t+C4reC4mScsIGQuY291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4oycpICsKICAgICc8',
  'L2Rpdj4nOwoKICAgIHZhciBtYXhCYXIgPSBNYXRoLm1heC5hcHBseShudWxsLCBkLmJ5TW9udGgubWFwKGZ1bmN0aW9uKG0peyByZXR1cm4gTWF0aC5tYXgobS5pbmNvbWUsIG0uZXhwZW5zZSk7IH0pKSB8fCAxOwogICAgdmFyIG1vbnRobHkgPSBjYXJkKCfwn5OF',
  'IOC4o+C4suC4ouC5gOC4lOC4t+C4reC4mSDCtyAnICsgeWVhckxhYmVsLAogICAgICAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsKICAgICAgJzx0aD7guYDguJTguLfguK3guJk8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKPg',
  'uLLguKLguKPguLHguJo8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKPguLLguKLguIjguYjguLLguKI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguIfguYDguKvguKXguLfguK08L3RoPicgKwogICAgICAnPHRoIHN0eWxlPSJ3aWR0aDozOCUiPuC5gOC4l+C4teC4ouC4',
  'muC4o+C4suC4ouC4o+C4seC4miAvIOC4o+C4suC4ouC4iOC5iOC4suC4ojwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgZC5ieU1vbnRoLm1hcChmdW5jdGlvbihtKXsKICAgICAgICB2YXIgYmxhbmsgPSAhbS5pbmNvbWUgJiYgIW0uZXhwZW5zZTsK',
  'ICAgICAgICByZXR1cm4gJzx0cicgKyAoYmxhbmsgPyAnIHN0eWxlPSJvcGFjaXR5Oi40NSInIDogJycpICsgJz4nICsKICAgICAgICAgICc8dGQ+PGI+JyArIG0ubGFiZWwgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAobS5p',
  'bmNvbWUgPyBtb25leShtLmluY29tZSkgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChtLmV4cGVuc2UgPyBtb25leShtLmV4cGVuc2UpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJu',
  'dW0iPjxiIHN0eWxlPSJjb2xvcjonICsgKG0ubmV0ID49IDAgPyAndmFyKC0tb2spJyA6ICd2YXIoLS1kYW5nZXIpJykgKyAnIj4nICsKICAgICAgICAgICAgKGJsYW5rID8gJ+KAkycgOiBtb25leShtLm5ldCkpICsgJzwvYj48L3RkPicgKwogICAgICAgICAgJzx0',
  'ZD4nICsKICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImJhci10cmFjayBtYjgiPjxkaXYgY2xhc3M9ImJhci1maWxsIiBzdHlsZT0id2lkdGg6JyArIChtLmluY29tZS9tYXhCYXIqMTAwKSArICclO2JhY2tncm91bmQ6dmFyKC0tb2spIj48L2Rpdj48L2Rpdj4nICsK',
  'ICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImJhci10cmFjayI+PGRpdiBjbGFzcz0iYmFyLWZpbGwiIHN0eWxlPSJ3aWR0aDonICsgKG0uZXhwZW5zZS9tYXhCYXIqMTAwKSArICclO2JhY2tncm91bmQ6dmFyKC0tZGFuZ2VyKSI+PC9kaXY+PC9kaXY+JyArCiAgICAg',
  'ICAgICAnPC90ZD48L3RyPic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nLCAnJywgdHJ1ZSk7CgogICAgdmFyIGJ5S2luZCA9IGNhcmQoJ/Cfp74g4LmB4Lii4LiB4LiV4Liy4Lih4Lij4Liy4Lii4LiB4Liy4LijIMK3ICcgKyB5',
  'ZWFyTGFiZWwsCiAgICAgIGJhckNoYXJ0KGQuYnlLaW5kLm1hcChmdW5jdGlvbihrKXsgcmV0dXJuIHsgbGFiZWw6IGsua2luZCArICcgKCcgKyBrLmNvdW50ICsgJyknLCB0b3RhbDogay50b3RhbCB9OyB9KSwKICAgICAgICAgICAgICAgJ2xhYmVsJywgJ3RvdGFs',
  'JywgZnVuY3Rpb24oaSl7IHJldHVybiBtb25leShpLnRvdGFsKSArICcg4Li/JzsgfSkpOwoKICAgIHZhciBieVllYXIgPSBjYXJkKCfwn5OKIOC5gOC4l+C4teC4ouC4muC4o+C4suC4ouC4m+C4tScsCiAgICAgIGQuYnlZZWFyLmxlbmd0aCA/ICc8ZGl2IGNsYXNz',
  'PSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOmF1dG8iPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guJvguLU8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKPguLLguKLguKPguLHguJo8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKPguLLguKLg',
  'uIjguYjguLLguKI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguIfguYDguKvguKXguLfguK08L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgZC5ieVllYXIubWFwKGZ1bmN0aW9uKHkpewogICAgICAgICAgcmV0dXJuICc8dHIgb25jbGljaz0ic2V0',
  'WWVhckZyb21UYWJsZSgnICsgeS55ZWFyICsgJykiIHN0eWxlPSJjdXJzb3I6cG9pbnRlciI+JyArCiAgICAgICAgICAgICc8dGQ+PGI+JyArIHkueWVhciArICc8L2I+IDxzcGFuIGNsYXNzPSJmYWludCBmczEyIj4vICcgKyAoeS55ZWFyKzU0MykgKyAnPC9zcGFu',
  'PjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIG1vbmV5KHkuaW5jb21lKSArICc8L3RkPjx0ZCBjbGFzcz0ibnVtIj4nICsgbW9uZXkoeS5leHBlbnNlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxiIHN0',
  'eWxlPSJjb2xvcjonICsgKHkubmV0Pj0wPyd2YXIoLS1vayknOid2YXIoLS1kYW5nZXIpJykgKyAnIj4nICsgbW9uZXkoeS5uZXQpICsgJzwvYj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JyA6ICc8ZGl2',
  'IGNsYXNzPSJlbXB0eSI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14LiC4LmJ4Lit4Lih4Li54LilPC9kaXY+JywgJycsIHRydWUpOwoKICAgIHZhciBraW5kcyA9ICc8ZGl2IGNsYXNzPSJjaGlwcyBtYjEyIj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImNoaXAg',
  'JyArICghUy5wYXJhbXMua2luZD8nb24nOicnKSArICciIG9uY2xpY2s9InNldFBhcmFtKFwna2luZFwnLFwnXCcpIj7guJfguLjguIHguKPguLLguKLguIHguLLguKM8L2J1dHRvbj4nICsKICAgICAgZC5ieUtpbmQubWFwKGZ1bmN0aW9uKGspewogICAgICAgIHJl',
  'dHVybiAnPGJ1dHRvbiBjbGFzcz0iY2hpcCAnICsgKFMucGFyYW1zLmtpbmQ9PT1rLmtpbmQ/J29uJzonJykgKyAnIiBvbmNsaWNrPSJzZXRQYXJhbShcJ2tpbmRcJyxcJycgKyBlc2Moay5raW5kKSArICdcJykiPicgKwogICAgICAgICAgICAgICBlc2Moay5raW5k',
  'KSArICcgKCcgKyBrLmNvdW50ICsgJyk8L2J1dHRvbj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwoKICAgIHZhciByb3dzID0gZC5pdGVtczsKICAgIHZhciBsaXN0ID0gY2FyZCgn8J+TkiDguKPguLLguKLguIHguLLguKPguJfguLHguYnguIfguKvg',
  'uKHguJQgwrcgJyArIHllYXJMYWJlbCArICcgKCcgKyByb3dzLmxlbmd0aCArICcpJywKICAgICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC4p+C4seC4meC4l+C4teC5',
  'iDwvdGg+PHRoPuC4o+C4suC4ouC4geC4suC4ozwvdGg+PHRoIGNsYXNzPSJudW0iPuC4iOC4s+C4meC4p+C4meC5gOC4h+C4tOC4mTwvdGg+PHRoPuC4o+C4reC4muC4muC4tOC4pTwvdGg+PHRoPuC4iuC5iOC4reC4h+C4l+C4suC4hzwvdGg+JyArCiAgICAgICAg',
  'Jzx0aD7guKrguKXguLTguJs8L3RoPjx0aD7guKvguKHguLLguKLguYDguKvguJXguLg8L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgcm93cy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgICAgICB2YXIgaW5jID0geC5mbG93ID09PSAn',
  '4Lij4Liy4Lii4Lij4Lix4LiaJzsKICAgICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LmRhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGI+JyArIGVzYyh4LmtpbmQp',
  'ICsgJzwvYj4gJyArIChpbmMgPyAnPHNwYW4gY2xhc3M9ImIgb2siPuC4o+C4suC4ouC4o+C4seC4mjwvc3Bhbj4nIDogJzxzcGFuIGNsYXNzPSJiIG11dGUiPuC4o+C4suC4ouC4iOC5iOC4suC4ojwvc3Bhbj4nKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRk',
  'IGNsYXNzPSJudW0iPjxiIHN0eWxlPSJjb2xvcjonICsgKGluYz8ndmFyKC0tb2spJzondmFyKC0taW5rKScpICsgJyI+JyArIChpbmM/JysnOifiiJInKSArIG1vbmV5KHguYW1vdW50LCAyKSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0i',
  'ZnMxMiI+JyArIGVzYyh4LmJpbGxNb250aCB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyh4LmNoYW5uZWwgfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwo',
  'eC5zbGlwUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiBtdXRlZCBjbGlwIj4nICsgZXNjKHgubm90ZSB8fCAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48ZGl2IGNsYXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAg',
  'ICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1GaW5hbmNlKCcgKyBhdHRyKHgpICsgJylcJz7inI/vuI88L2J1dHRvbj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24gZGdyIiBvbmNsaWNr',
  'PSJkZWxGaW5hbmNlKFwnJyArIHguaWQgKyAnXCcpIj7wn5eRPC9idXR0b24+JyArCiAgICAgICAgICAgICc8L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6IGVtcHR5Qm94KCfguKLg',
  'uLHguIfguYTguKHguYjguKHguLXguKPguLLguKLguIHguLLguKPguYPguJknICsgeWVhckxhYmVsLCAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZm9ybUZpbmFuY2UobnVsbCkiPisg4Lia4Lix4LiZ4LiX4Li24LiB4Lij4Liy4Lii4LiB4Liy4Lij',
  'PC9idXR0b24+JyksCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIHNtIiBvbmNsaWNrPSJmb3JtRmluYW5jZShudWxsKSI+KyDguJrguLHguJnguJfguLbguIHguKPguLLguKLguKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4LiiPC9idXR0b24+JywgdHJ1',
  'ZSk7CgogICAgcmV0dXJuIGhlYWQgKyBtb250aGx5ICsgJzxkaXYgY2xhc3M9ImdyaWQgZzIgbXQxMiBtYjEyIj4nICsgYnlLaW5kICsgYnlZZWFyICsgJzwvZGl2PicgKyBraW5kcyArIGxpc3Q7CiAgfQp9OwoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDkpIOC4o+C4suC4ouC4h+C4suC4mSAmIOC4quC4s+C4o+C4reC4h+C4guC5ieC4reC4oeC4ueC4pQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT0gKi8KUk9VVEVTLnJlcG9ydHMgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsKICAgIHJldHVybiBQcm9taXNlLmFsbChbCiAgICAgIGNhbGxBcGkoJ3JlcG9ydC5jb3N0UGVyUm9vbScsIHsgeWVhcjogUy55ZWFyIH0pLAogICAgICBjYWxsQXBpKCdyZXBv',
  'cnQudXBjb21pbmcnLCB7IGRheXM6IDkwIH0pLAogICAgICBjYWxsQXBpKCdiYWNrdXAuc2hlZXRzJywge30pLAogICAgICBjYWxsQXBpKCdzaGFyZS5saW5rcycsIHt9KS5jYXRjaChmdW5jdGlvbigpeyByZXR1cm4ge307IH0pLAogICAgICBjYWxsQXBpKCdiYWNr',
  'dXAuaGlzdG9yeScsIHt9KS5jYXRjaChmdW5jdGlvbigpeyByZXR1cm4gW107IH0pCiAgICBdKS50aGVuKGZ1bmN0aW9uKHIpewogICAgICByZXR1cm4geyBjb3N0OiByWzBdLCB1cGNvbWluZzogclsxXSwgc2hlZXRzOiByWzJdLCBsaW5rczogclszXSB8fCB7fSwg',
  'YmFja3Vwczogcls0XSB8fCBbXSwgeWVhcnM6IFtdIH07CiAgICB9KTsKICB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgeWVhckxhYmVsID0gUy55ZWFyID09PSAnYWxsJyA/ICfguJfguLjguIHguJvguLUnIDogJ+C4m+C4tSAnICsgUy55ZWFyOwog',
  'ICAgdmFyIGMgPSBkLmNvc3Q7CiAgICB2YXIgdG9wID0gYy5yb29tcy5maWx0ZXIoZnVuY3Rpb24ocil7IHJldHVybiByLnRvdGFsID4gMDsgfSk7CiAgICB2YXIgbWF4Q29zdCA9IHRvcC5sZW5ndGggPyB0b3BbMF0udG90YWwgOiAxOwoKICAgIHZhciB1cGNvbWlu',
  'ZyA9IGNhcmQoJ/Cfl5PvuI8g4Lib4LiP4Li04LiX4Li04LiZ4LiH4Liy4LiZ4LiX4Li14LmI4LiB4Liz4Lil4Lix4LiH4LiI4Liw4LiW4Li24LiHICg5MCDguKfguLHguJkpIMK3ICcgKyBkLnVwY29taW5nLmxlbmd0aCArICcg4LiH4Liy4LiZJywKICAgICAgZC51',
  'cGNvbWluZy5sZW5ndGggPyAnPGRpdiBjbGFzcz0iYWxpc3QiPicgKyBkLnVwY29taW5nLm1hcChmdW5jdGlvbih1KXsKICAgICAgICB2YXIgbHZsID0gdS5kYXlzTGVmdCA8IDAgPyAnZGFuZ2VyJyA6ICh1LmRheXNMZWZ0IDw9IDcgPyAnd2FybicgOiAnaW5mbycp',
  'OwogICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0iYWxpIGwtJyArIGx2bCArICciIG9uY2xpY2s9ImdvKFwnJyArIGp1bXBQYWdlKHUubW9kdWxlKSArICdcJykiPicgKwogICAgICAgICAgJzxkaXYgY2xhc3M9ImljIj4nICsgdS5pY29uICsgJzwvZGl2PjxkaXY+',
  'JyArCiAgICAgICAgICAnPGRpdiBjbGFzcz0idHQiPicgKyBlc2ModS50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAnPGRpdiBjbGFzcz0iZGQiPicgKyB0aERhdGUodS5kYXRlKSArICcgwrcgJyArCiAgICAgICAgICAgICh1LmRheXNMZWZ0IDwgMCA/ICfg',
  'uYDguKXguKLguIHguLPguKvguJnguJQgJyArICgtdS5kYXlzTGVmdCkgKyAnIOC4p+C4seC4mScgOiAodS5kYXlzTGVmdCA9PT0gMCA/ICfguKfguLHguJnguJnguLXguYknIDogJ+C4reC4teC4gSAnICsgdS5kYXlzTGVmdCArICcg4Lin4Lix4LiZJykpICsKICAg',
  'ICAgICAgICAgKHUuZGV0YWlsID8gJyDCtyAnICsgZXNjKHUuZGV0YWlsKSA6ICcnKSArICc8L2Rpdj48L2Rpdj48L2Rpdj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPvCfjKTvuI88',
  'L2Rpdj7guYTguKHguYjguKHguLXguIfguLLguJnguJnguLHguJTguKvguKHguLLguKLguYPguJkgOTAg4Lin4Lix4LiZ4LiC4LmJ4Liy4LiH4Lir4LiZ4LmJ4LiyPC9kaXY+JywgJycsIHRydWUpOwoKICAgIHZhciBjb3N0Q2FyZCA9IGNhcmQoJ/Cfj7fvuI8g4LiE',
  '4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Liq4Liw4Liq4Lih4Lij4Liy4Lii4Lir4LmJ4Lit4LiHIMK3ICcgKyB5ZWFyTGFiZWwsCiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGczIG1iMTIiPicgKwogICAgICAgIGtwaSgn4Lij4Lin4Lih4LiX4Li44LiB4Lir',
  '4LmJ4Lit4LiHJywgYmFodChjLnRvdGFsKSwgJycpICsKICAgICAgICBrcGkoJ+C5gOC4ieC4peC4teC5iOC4ouC4leC5iOC4reC4q+C5ieC4reC4hycsIGJhaHQoYy5hdmVyYWdlKSwgJycpICsKICAgICAgICBrcGkoJ+C4q+C5ieC4reC4h+C4l+C4teC5iOC5g+C4',
  'iuC5ieC4iOC5iOC4suC4ouC4quC4ueC4h+C4quC4uOC4lCcsIHRvcC5sZW5ndGggPyAoJ+C4q+C5ieC4reC4hyAnICsgdG9wWzBdLnJvb20pIDogJ+KAkycsIHRvcC5sZW5ndGggPyBiYWh0KHRvcFswXS50b3RhbCkgOiAnJykgKwogICAgICAnPC9kaXY+JyArCiAg',
  'ICAgICh0b3AubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guKvguYnguK3guIc8L3RoPjx0aCBjbGFzcz0ibnVtIj7guIfguLLguJnguIvguYjguK3guKE8L3RoPjx0aCBjbGFzcz0i',
  'bnVtIj7guITguYjguLLguIvguYjguK3guKE8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKXguYnguLLguIfguYHguK3guKPguYw8L3RoPicgKwogICAgICAgICc8dGggY2xhc3M9Im51bSI+4LiC4Lit4LiH4LmA4LiC4LmJ4Liy4Lir4LmJ4Lit4LiHPC90aD48dGggY2xh',
  'c3M9Im51bSI+4Lij4Lin4LihPC90aD48dGggc3R5bGU9IndpZHRoOjI2JSI+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIHRvcC5tYXAoZnVuY3Rpb24ocil7CiAgICAgICAgICByZXR1cm4gJzx0ciBvbmNsaWNrPSJvcGVuUm9vbShcJycgKyBy',
  'LnJvb20gKyAnXCcpIiBzdHlsZT0iY3Vyc29yOnBvaW50ZXIiPicgKwogICAgICAgICAgICAnPHRkPjxiPicgKyByLnJvb20gKyAnPC9iPiA8c3BhbiBjbGFzcz0iZmFpbnQgZnMxMiI+4LiK4Lix4LmJ4LiZICcgKyByLmZsb29yICsgJzwvc3Bhbj48L3RkPicgKwog',
  'ICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyByLmpvYnMgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHIucmVwYWlyID8gbW9uZXkoci5yZXBhaXIpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQg',
  'Y2xhc3M9Im51bSI+JyArIChyLmFjID8gbW9uZXkoci5hYykgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHIucHVyY2hhc2UgPyBtb25leShyLnB1cmNoYXNlKSA6ICfigJMnKSArICc8L3RkPicgKwogICAgICAg',
  'ICAgICAnPHRkIGNsYXNzPSJudW0iPjxiPicgKyBtb25leShyLnRvdGFsKSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48ZGl2IGNsYXNzPSJiYXItdHJhY2siPjxkaXYgY2xhc3M9ImJhci1maWxsIiBzdHlsZT0id2lkdGg6JyArIChyLnRvdGFsL21h',
  'eENvc3QqMTAwKSArICclIj48L2Rpdj48L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14LiE4LmI4Liy',
  '4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4LiX4Li14LmI4Lia4Lix4LiZ4LiX4Li24LiB4LmE4Lin4LmJ4Lij4Liy4Lii4Lir4LmJ4Lit4LiHPGRpdiBjbGFzcz0iZnMxMiBtdDgiPuC5g+C4quC5iCAi4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiIiDguYPguJng',
  'uIfguLLguJnguIvguYjguK3guKEv4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMIOC4q+C4o+C4t+C4reC4o+C4sOC4muC4uOC4q+C5ieC4reC4h+C5g+C4meC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4hyDguYHguKXguYnguKfguJXguLHguKfg',
  'uYDguKXguILguIjguLDguILguLbguYnguJnguJfguLXguYjguJnguLXguYg8L2Rpdj48L2Rpdj4nKSk7CgogICAgdmFyIGJhY2t1cCA9IGNhcmQoJ/Cfkr4g4Liq4Liz4Lij4Lit4LiH4LmB4Lil4Liw4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54Lil',
  'JywKICAgICAgJzxwIGNsYXNzPSJmczEzIG11dGVkIj7guILguYnguK3guKHguLnguKXguJfguLHguYnguIfguKvguKHguJTguK3guKLguLnguYjguYPguJnguKPguLDguJrguJrguJnguLXguYkg4oCUIOC4hOC4p+C4o+C4lOC4suC4p+C4meC5jOC5guC4q+C4peC4',
  'lOC4quC4s+C4o+C4reC4h+C5hOC4p+C5ieC5gOC4lOC4t+C4reC4meC4peC4sOC4hOC4o+C4seC5ieC4hyAnICsKICAgICAgJ+C5hOC4n+C4peC5jCBKU09OIOC4meC4s+C4geC4peC4seC4muC5gOC4guC5ieC4suC4o+C4sOC4muC4muC5hOC4lOC5iSDguKrguYjg',
  'uKfguJkgQ1NWIOC5gOC4m+C4tOC4lOC5g+C4mSBFeGNlbCDguKvguKPguLfguK0gR29vZ2xlIFNoZWV0cyDguYTguJTguYnguYDguKXguKI8L3A+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQxMiI+JyArCiAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBw',
  'cmkiIG9uY2xpY2s9ImRvRXhwb3J0SnNvbigpIj7irIfvuI8g4LiU4Liy4Lin4LiZ4LmM4LmC4Lir4Lil4LiU4Liq4Liz4Lij4Lit4LiH4LiX4Lix4LmJ4LiH4Lir4Lih4LiUIChKU09OKTwvYnV0dG9uPicgKwogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9u',
  'Y2xpY2s9ImRvSW1wb3J0SnNvbigpIj7irIbvuI8g4LiB4Li54LmJ4LiE4Li34LiZ4LiI4Liy4LiB4LmE4Lif4Lil4LmM4Liq4Liz4Lij4Lit4LiHPC9idXR0b24+JyArCiAgICAgICc8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImhyIj48L2Rpdj4nICsKICAg',
  'ICAgJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbWI4Ij7guKrguYjguIfguK3guK3guIHguYDguJvguYfguJkgQ1NWIOC5geC4ouC4geC4leC4suC4o+C4suC4hzwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iY2hpcHMiPicgKyBkLnNoZWV0cy5tYXAoZnVuY3Rp',
  'b24obil7CiAgICAgICAgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJjaGlwIiBvbmNsaWNrPSJkb0V4cG9ydENzdihcJycgKyBlc2MobikgKyAnXCcpIj4nICsgZXNjKHNoZWV0TGFiZWwobikpICsgJzwvYnV0dG9uPic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2',
  'PicpOwoKICAgIHZhciBzaGFyZSA9IChjYW5FZGl0KCkgJiYgZC5saW5rcyAmJiBkLmxpbmtzLnZpZXdVcmwpID8gY2FyZCgn8J+UlyDguKXguLTguIfguIHguYzguYDguILguYnguLLguYPguIrguYnguIfguLLguJknLAogICAgICAnPGRpdiBjbGFzcz0iZiBtYjEy',
  'Ij48bGFiZWw+8J+UkSDguKXguLTguIfguIHguYzguILguK3guIfguITguLjguJMgKOC5geC4geC5ieC5hOC4guC4guC5ieC4reC4oeC4ueC4peC5hOC4lOC5iSDigJQg4Lit4Lii4LmI4Liy4Liq4LmI4LiH4LiV4LmI4LitKTwvbGFiZWw+JyArCiAgICAgICAgJzxp',
  'bnB1dCBjbGFzcz0iaW5wIiByZWFkb25seSB2YWx1ZT0iJyArIGVzYyhkLmxpbmtzLmFkbWluVXJsKSArICciIG9uY2xpY2s9InRoaXMuc2VsZWN0KCkiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiI+PGxhYmVsPvCfkYAg4Lil4Li04LiH4LiB4LmM4LmB',
  '4LiK4Lij4LmMICjguYDguJvguLTguJTguJTguLnguYTguJTguYnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcg4oCUIOC4quC5iOC4h+C5g+C4q+C5ieC5g+C4hOC4o+C4geC5h+C5hOC4lOC5iSk8L2xhYmVsPicgKwogICAgICAgICc8aW5wdXQgY2xhc3M9',
  'ImlucCIgaWQ9InNoYXJlVXJsIiByZWFkb25seSB2YWx1ZT0iJyArIGVzYyhkLmxpbmtzLnZpZXdVcmwpICsgJyIgb25jbGljaz0idGhpcy5zZWxlY3QoKSI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQxMiI+JyArCiAgICAgICAgJzxidXR0b24g',
  'Y2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImNvcHlTaGFyZSgpIj7wn5OLIOC4hOC4seC4lOC4peC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jDwvYnV0dG9uPicgKwogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gZGdyIiBvbmNsaWNrPSJkb1JvdGF0',
  'ZVNoYXJlKCkiPvCflIEg4Lit4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LmD4Lir4Lih4LmIPC9idXR0b24+JyArCiAgICAgICc8L2Rpdj4nICsKICAgICAgJzxwIGNsYXNzPSJmczEyIG11dGVkIG10MTIiPuC4hOC4meC4l+C4teC5iOC5gOC4m+C4',
  'tOC4lOC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC4iOC4sOC5gOC4q+C5h+C4meC4guC5ieC4reC4oeC4ueC4peC4l+C4seC5ieC4h+C4q+C4oeC4lOC5geC4muC4muC4reC5iOC4suC4meC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pyAnICsKICAgICAg',
  'J+C5hOC4oeC5iOC4leC5ieC4reC4h+C4oeC4teC4muC4seC4jeC4iuC4tSBHb29nbGUg4LmB4Lil4Liw4LmE4Lih4LmI4LmA4Lir4LmH4LiZIEdvb2dsZSBTaGVldCDguILguK3guIfguITguLjguJMgwrcgJyArCiAgICAgICfguJbguYnguLLguKXguLTguIfguIHg',
  'uYzguKvguKXguLjguJTguYPguKvguYnguIHguJQgIuC4reC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC5g+C4q+C4oeC5iCIg4Lil4Li04LiH4LiB4LmM4LmA4LiU4Li04Lih4LiI4Liw4LmD4LiK4LmJ4LmE4Lih4LmI4LmE4LiU4LmJ4LiX4Lix4LiZ',
  '4LiX4Li1PC9wPicpIDogJyc7CgogICAgdmFyIGRyaXZlID0gY2FuRWRpdCgpID8gY2FyZCgn4piB77iPIOC4quC4s+C4o+C4reC4h+C4reC4seC4leC5guC4meC4oeC4seC4leC4tOC5g+C4mSBHb29nbGUgRHJpdmUgKCcgKyBkLmJhY2t1cHMubGVuZ3RoICsgJyDg',
  'uIrguLjguJQpJywKICAgICAgJzxwIGNsYXNzPSJmczEzIG11dGVkIj7guKPguLDguJrguJrguYDguIHguYfguJrguYTguJ/guKXguYzguKrguLPguKPguK3guIfguYTguKfguYnguYPguJnguYLguJ/guKXguYDguJTguK3guKPguYwgIuC4quC4s+C4o+C4reC4h+C4',
  'guC5ieC4reC4oeC4ueC4pSIg4Lia4LiZ4LmE4LiU4Lij4Lif4LmM4LiC4Lit4LiH4LiE4Li44LiTICcgKwogICAgICAn4LiV4Lix4LmJ4LiH4LmD4Lir4LmJ4LiX4Liz4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li04LiX4Li44LiB4Lin4Lix4LiZ4LmE4LiU4LmJ',
  '4LiI4Liy4LiB4LmA4Lih4LiZ4Li54LmD4LiZ4LiK4Li14LiVPC9wPicgKwogICAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPjxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iZG9CYWNrdXBOb3coKSI+8J+SviDguKrguLPguKPguK3guIfguYDguJTguLXguYvg',
  'uKLguKfguJnguLXguYk8L2J1dHRvbj48L2Rpdj4nICsKICAgICAgKGQuYmFja3Vwcy5sZW5ndGggPyAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PjxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiIHN0eWxlPSJtaW4td2lkdGg6YXV0byI+PHRoZWFkPjx0cj4n',
  'ICsKICAgICAgICAnPHRoPuC5hOC4n+C4peC5jDwvdGg+PHRoPuC5gOC4p+C4peC4sjwvdGg+PHRoIGNsYXNzPSJudW0iPuC4guC4meC4suC4lDwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICBkLmJhY2t1cHMuc2xpY2UoMCwxMCkubWFwKGZ1bmN0',
  'aW9uKGIpewogICAgICAgICAgcmV0dXJuICc8dHI+PHRkIGNsYXNzPSJmczEyIj48YSBocmVmPSInICsgZXNjKGIudXJsKSArICciIHRhcmdldD0iX2JsYW5rIj4nICsgZXNjKGIubmFtZSkgKyAnPC9hPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZz',
  'MTIiPicgKyBlc2MoYi5hdCkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIGZzMTIiPicgKyBNYXRoLnJvdW5kKGIuc2l6ZS8xMDI0KSArICcgS0I8L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+',
  'PC9kaXY+JyA6ICcnKSkgOiAnJzsKCiAgICByZXR1cm4gdXBjb21pbmcgKyAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIGNvc3RDYXJkICsgJzwvZGl2PicgKwogICAgICAgICAgIChzaGFyZSA/ICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgc2hhcmUgKyAnPC9kaXY+JyA6',
  'ICcnKSArCiAgICAgICAgICAgJzxkaXYgY2xhc3M9Im10MTIiPicgKyBiYWNrdXAgKyAnPC9kaXY+JyArCiAgICAgICAgICAgKGRyaXZlID8gJzxkaXYgY2xhc3M9Im10MTIiPicgKyBkcml2ZSArICc8L2Rpdj4nIDogJycpOwogIH0KfTsKCmZ1bmN0aW9uIHNoZWV0',
  'TGFiZWwobil7CiAgcmV0dXJuICh7CiAgICBEZWJ0czon4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJJywgRGVidFBheW1lbnRzOifguKPguLLguKLguIHguLLguKPguIrguLPguKPguLDguKvguJnguLXguYknLCBQdXJjaGFzZXM6J+C4o+C4suC4ouC4geC4suC4o+C4',
  'i+C4t+C5ieC4reC4guC4reC4hycsIFJvb21zOifguJfguLDguYDguJrguLXguKLguJnguKvguYnguK3guIcnLAogICAgQWNTZXJ2aWNlOifguKXguYnguLLguIfguYHguK3guKPguYwnLCBSb29tUmVwYWlyczon4LiL4LmI4Lit4Lih4LmB4LiL4Lih4Lir4LmJ4Lit',
  '4LiHJywgQnVpbGRpbmdSZXBhaXJzOifguIvguYjguK3guKHguYHguIvguKHguJXguLbguIEnLAogICAgUm9vbUFzc2V0czon4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZ4Lir4LmJ4Lit4LiHJywgRmluYW5jZTon4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4',
  'ouC4iOC5iOC4suC4oicsIFNldHRpbmdzOifguJXguLHguYnguIfguITguYjguLInLCBBY3Rpdml0eUxvZzon4Lib4Lij4Liw4Lin4Lix4LiV4Li04LiB4Liy4Lij4LmB4LiB4LmJ4LmE4LiCJwogIH0pW25dIHx8IG47Cn0KCi8qID09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJXguLHguKfguIrguYjguKfguKLguKfguLLguJTguIvguYnguLMg4LmGCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PSAqLwoKZnVuY3Rpb24ga3BpKGxhYmVsLCB2YWx1ZSwgY2FwLCBjbHMpewogIHJldHVybiAnPGRpdiBjbGFzcz0ia3BpICcgKyAoY2xzfHwnJykgKyAnIj4nICsKICAgICc8ZGl2IGNsYXNzPSJsYmwiPicgKyBlc2MobGFiZWwpICsgJzwvZGl2PicgKwogICAgJzxk',
  'aXYgY2xhc3M9InZhbCI+JyArIHZhbHVlICsgJzwvZGl2PicgKwogICAgKGNhcCA/ICc8ZGl2IGNsYXNzPSJjYXAiPicgKyBjYXAgKyAnPC9kaXY+JyA6ICcnKSArICc8L2Rpdj4nOwp9CgpmdW5jdGlvbiBjYXJkKHRpdGxlLCBib2R5LCBhY3Rpb25zLCBmbHVzaCl7',
  'CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJjYXJkIj4nICsKICAgICh0aXRsZSA/ICc8ZGl2IGNsYXNzPSJjYXJkLWgiPjxoMz4nICsgdGl0bGUgKyAnPC9oMz4nICsgKGFjdGlvbnMgPyAnPGRpdiBjbGFzcz0ic3AiPicgKyBhY3Rpb25zICsgJzwvZGl2PicgOiAnJykg',
  'KyAnPC9kaXY+JyA6ICcnKSArCiAgICAnPGRpdiBjbGFzcz0iY2FyZC1iJyArIChmbHVzaCA/ICcgZmx1c2gnIDogJycpICsgJyI+JyArIGJvZHkgKyAnPC9kaXY+PC9kaXY+JzsKfQoKLyoqIOC4p+C4suC4lOC4nOC4seC4h+C4q+C5ieC4reC4h+C5geC4muC5iOC4',
  'h+C4leC4suC4oeC4iuC4seC5ieC4mSDigJQgZGVjb3JhdGUocm9vbSkgLT4ge2Nscywgc3ViLCBvbmNsaWNrfSAqLwpmdW5jdGlvbiByb29tRmxvb3JzKHJvb21zLCBkZWNvcmF0ZSl7CiAgdmFyIGJ5Rmxvb3IgPSB7fTsKICByb29tcy5mb3JFYWNoKGZ1bmN0aW9u',
  'KHIpewogICAgdmFyIGYgPSByLmZsb29yIHx8IE51bWJlcihTdHJpbmcoci5yb29tKS5jaGFyQXQoMCkpOwogICAgKGJ5Rmxvb3JbZl0gPSBieUZsb29yW2ZdIHx8IFtdKS5wdXNoKHIpOwogIH0pOwogIHZhciBmbG9vcnMgPSBPYmplY3Qua2V5cyhieUZsb29yKS5z',
  'b3J0KCk7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJmbG9vcnMiPicgKyBmbG9vcnMubWFwKGZ1bmN0aW9uKGYpewogICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJmbG9vciI+PGRpdiBjbGFzcz0iZmxvb3ItdGFnIj48Yj4nICsgZiArICc8L2I+4LiK4Lix4LmJ4LiZPC9k',
  'aXY+PGRpdiBjbGFzcz0icm9vbXMiPicgKwogICAgICBieUZsb29yW2ZdLm1hcChmdW5jdGlvbihyKXsKICAgICAgICB2YXIgZCA9IGRlY29yYXRlKHIpOwogICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0icm9vbSAnICsgZC5jbHMgKyAnIiBvbmNsaWNrPSInICsg',
  'ZC5vbmNsaWNrICsgJyI+JyArCiAgICAgICAgICAnPHNwYW4gY2xhc3M9ImRvdCI+PC9zcGFuPjxkaXYgY2xhc3M9Im5vIj4nICsgZXNjKHIucm9vbSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAnPGRpdiBjbGFzcz0ic3QiPicgKyBkLnN1YiArICc8L2Rpdj48L2Rp',
  'dj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj48L2Rpdj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7Cn0KCi8qKiDguYPguKrguYggb2JqZWN0IOC4peC4h+C5g+C4mSBvbmNsaWNrIGF0dHJpYnV0ZSDguYTguJTguYnguK3guKLguYjguLLguIfguJvg',
  'uKXguK3guJTguKDguLHguKIgKi8KZnVuY3Rpb24gYXR0cihvYmopewogIHZhciBjbGVhbiA9IHt9OwogIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChmdW5jdGlvbihrKXsKICAgIGlmIChrLmluZGV4T2YoJ18nKSA9PT0gMCB8fCAvUmVmcyQvLnRlc3QoaykgfHwg',
  'ayA9PT0gJ3JlY29yZHMnIHx8IGsgPT09ICd3YXJyYW50eScpIHJldHVybjsKICAgIGNsZWFuW2tdID0gb2JqW2tdOwogIH0pOwogIHJldHVybiBKU09OLnN0cmluZ2lmeShjbGVhbikucmVwbGFjZSgvJi9nLCcmYW1wOycpLnJlcGxhY2UoLycvZywnJiMzOTsnKS5y',
  'ZXBsYWNlKC8iL2csJyZxdW90OycpOwp9Cjwvc2NyaXB0Pgo8c2NyaXB0PgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgRm9ybXMuaHRtbCDigJQg4Lif4Lit4Lij4LmM4Lih4LmA4Lie4Li04LmI',
  '4LihL+C5geC4geC5ieC5hOC4giDguYHguKXguLDguIHguLLguKPguKXguJoKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgp2YXIgRk9STSA9IHsgc3BlY3M6IFtdLCBrZWVwOiB7fSwgYnVja2V0',
  'OiAnbWlzYycgfTsKCi8qIC0tLS0tLS0tLS0tLS0tLS0gZm9ybSBlbmdpbmUgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gZmllbGRzSHRtbChzcGVjcywgcmVjKXsKICByZWMgPSByZWMgfHwge307CiAgRk9STS5zcGVjcyA9IHNwZWNzOwogIEZPUk0ua2Vl',
  'cCA9IHt9OwogIHJldHVybiAnPGRpdiBjbGFzcz0iZmdyaWQiPicgKyBzcGVjcy5tYXAoZnVuY3Rpb24oZil7CiAgICB2YXIgdiA9IHJlY1tmLmtleV07CiAgICB2YXIgaWQgPSAnZl8nICsgZi5rZXk7CiAgICB2YXIgaW5uZXI7CgogICAgaWYgKGYudHlwZSA9PT0g',
  'J3NlbGVjdCcpIHsKICAgICAgdmFyIG9wdHMgPSAoZi5vcHRpb25zIHx8IFtdKS5tYXAoZnVuY3Rpb24obyl7CiAgICAgICAgdmFyIHZhbCA9IHR5cGVvZiBvID09PSAnb2JqZWN0JyA/IG8udmFsdWUgOiBvOwogICAgICAgIHZhciBsYWIgPSB0eXBlb2YgbyA9PT0g',
  'J29iamVjdCcgPyBvLmxhYmVsIDogbzsKICAgICAgICByZXR1cm4gJzxvcHRpb24gdmFsdWU9IicgKyBlc2ModmFsKSArICciJyArIChTdHJpbmcodikgPT09IFN0cmluZyh2YWwpID8gJyBzZWxlY3RlZCcgOiAnJykgKyAnPicgKyBlc2MobGFiKSArICc8L29wdGlv',
  'bj4nOwogICAgICB9KS5qb2luKCcnKTsKICAgICAgaW5uZXIgPSAnPHNlbGVjdCBjbGFzcz0ic2VsIiBpZD0iJyArIGlkICsgJyI+JyArIChmLmJsYW5rICE9PSBmYWxzZSA/ICc8b3B0aW9uIHZhbHVlPSIiPuKAlCDguYDguKXguLfguK3guIEg4oCUPC9vcHRpb24+',
  'JyA6ICcnKSArIG9wdHMgKyAnPC9zZWxlY3Q+JzsKCiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ3RleHRhcmVhJykgewogICAgICBpbm5lciA9ICc8dGV4dGFyZWEgY2xhc3M9InRhIiBpZD0iJyArIGlkICsgJyIgcGxhY2Vob2xkZXI9IicgKyBlc2MoZi5waHx8',
  'JycpICsgJyI+JyArIGVzYyh2fHwnJykgKyAnPC90ZXh0YXJlYT4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnZmlsZXMnKSB7CiAgICAgIEZPUk0ua2VlcFtmLmtleV0gPSAocmVjW2Yua2V5XSAmJiByZWNbZi5rZXldLmxlbmd0aCkgPyBbXS5jb25jYXQo',
  'cmVjW2Yua2V5XSkgOiBbXTsKICAgICAgaW5uZXIgPQogICAgICAgICc8ZGl2IGlkPSInICsgaWQgKyAnX2V4aXN0aW5nIj4nICsgZXhpc3RpbmdGaWxlc0h0bWwoZi5rZXkpICsgJzwvZGl2PicgKwogICAgICAgICc8bGFiZWwgY2xhc3M9ImZpbGUtZHJvcCIgZm9y',
  'PSInICsgaWQgKyAnIj7wn5OOIOC5geC4leC4sOC5gOC4nuC4t+C5iOC4reC5gOC4peC4t+C4reC4geC5hOC4n+C4peC5jCAo4LmA4Lil4Li34Lit4LiB4LmE4LiU4LmJ4Lir4Lil4Liy4Lii4LmE4Lif4Lil4LmMIMK3IOC5hOC4oeC5iOC5gOC4geC4tOC4mSAxMiBN',
  'QiDguJXguYjguK3guYTguJ/guKXguYwpJyArCiAgICAgICAgJzxpbnB1dCB0eXBlPSJmaWxlIiBpZD0iJyArIGlkICsgJyIgbXVsdGlwbGUgYWNjZXB0PSJpbWFnZS8qLGFwcGxpY2F0aW9uL3BkZiIgc3R5bGU9ImRpc3BsYXk6bm9uZSIgJyArCiAgICAgICAgJ29u',
  'Y2hhbmdlPSJwcmV2aWV3UGlja2VkKHRoaXMsXCcnICsgaWQgKyAnXCcpIj48L2xhYmVsPicgKwogICAgICAgICc8ZGl2IGlkPSInICsgaWQgKyAnX3ByZXZpZXciIGNsYXNzPSJ0aHVtYnMgbXQ4Ij48L2Rpdj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAn',
  'Y29tcHV0ZWQnKSB7CiAgICAgIGlubmVyID0gJzxkaXYgY2xhc3M9ImlucCIgaWQ9IicgKyBpZCArICciIHN0eWxlPSJiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Zm9udC13ZWlnaHQ6NjAwOycgKwogICAgICAgICAgICAgICdmb250LXZhcmlhbnQtbnVtZXJp',
  'Yzp0YWJ1bGFyLW51bXM7Y3Vyc29yOmRlZmF1bHQiPjA8L2Rpdj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnZGF0ZScpIHsKICAgICAgaW5uZXIgPSAnPGlucHV0IHR5cGU9ImRhdGUiIGNsYXNzPSJpbnAiIGlkPSInICsgaWQgKyAnIiB2YWx1ZT0iJyAr',
  'IGVzYyh2IHx8ICcnKSArICciPic7CgogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICdudW1iZXInIHx8IGYudHlwZSA9PT0gJ21vbmV5JykgewogICAgICBpbm5lciA9ICc8aW5wdXQgdHlwZT0ibnVtYmVyIiBzdGVwPSInICsgKGYudHlwZSA9PT0gJ21vbmV5JyA/',
  'ICcwLjAxJyA6ICcxJykgKyAnIiBjbGFzcz0iaW5wIiBpZD0iJyArIGlkICsgJyIgJyArCiAgICAgICAgICAgICAgJ3ZhbHVlPSInICsgKHYgPT0gbnVsbCB8fCB2ID09PSAnJyA/ICcnIDogZXNjKHYpKSArICciIHBsYWNlaG9sZGVyPSInICsgZXNjKGYucGh8fCcn',
  'KSArICciIGlucHV0bW9kZT0iZGVjaW1hbCInICsKICAgICAgICAgICAgICAoZi5zdW1zID8gJyBvbmlucHV0PSJyZWNhbGNTdW1zKCkiJyA6ICcnKSArICc+JzsKCiAgICB9IGVsc2UgewogICAgICBpbm5lciA9ICc8aW5wdXQgdHlwZT0idGV4dCIgY2xhc3M9Imlu',
  'cCIgaWQ9IicgKyBpZCArICciIHZhbHVlPSInICsgZXNjKHYgfHwgJycpICsgJyIgcGxhY2Vob2xkZXI9IicgKyBlc2MoZi5waHx8JycpICsgJyI+JzsKICAgIH0KCiAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImYnICsgKGYuZnVsbCA/ICcgZnVsbCcgOiAnJykgKyAn',
  'Ij4nICsKICAgICAgJzxsYWJlbCBmb3I9IicgKyBpZCArICciPicgKyBlc2MoZi5sYWJlbCkgKyAoZi5yZXF1aXJlZCA/ICcgPHNwYW4gc3R5bGU9ImNvbG9yOnZhcigtLWRhbmdlcikiPio8L3NwYW4+JyA6ICcnKSArICc8L2xhYmVsPicgKwogICAgICBpbm5lciAr',
  'IChmLmhpbnQgPyAnPGRpdiBjbGFzcz0iaGludCI+JyArIGVzYyhmLmhpbnQpICsgJzwvZGl2PicgOiAnJykgKyAnPC9kaXY+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwp9CgovKiog4Lit4Lix4Lib4LmA4LiU4LiV4LiK4LmI4Lit4LiH4Lic4Lil4Lij4Lin',
  '4Lih4LiX4Li44LiB4LiK4LmI4Lit4LiH4LmD4LiZ4Lif4Lit4Lij4LmM4Lih4Lib4Lix4LiI4LiI4Li44Lia4Lix4LiZICovCmZ1bmN0aW9uIHJlY2FsY1N1bXMoKXsKICAoRk9STS5zcGVjcyB8fCBbXSkuZm9yRWFjaChmdW5jdGlvbihmKXsKICAgIGlmIChmLnR5',
  'cGUgIT09ICdjb21wdXRlZCcgfHwgIWYuZnJvbSkgcmV0dXJuOwogICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyArIGYua2V5KTsKICAgIGlmICghZWwpIHJldHVybjsKICAgIHZhciB0b3RhbCA9IDA7CiAgICBmLmZyb20uZm9yRWFjaChm',
  'dW5jdGlvbihrKXsKICAgICAgdmFyIGkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl8nICsgayk7CiAgICAgIGlmIChpKSB0b3RhbCArPSBOdW1iZXIoaS52YWx1ZSkgfHwgMDsKICAgIH0pOwogICAgZWwudGV4dENvbnRlbnQgPSB0b3RhbC50b0xvY2FsZVN0',
  'cmluZygndGgtVEgnLCB7IG1pbmltdW1GcmFjdGlvbkRpZ2l0czogMCwgbWF4aW11bUZyYWN0aW9uRGlnaXRzOiAyIH0pICsgJyDguL8nOwogICAgZWwuc3R5bGUuY29sb3IgPSB0b3RhbCA+IDAgPyAndmFyKC0tb2spJyA6ICd2YXIoLS1tdXRlZCknOwogIH0pOwp9',
  'CgpmdW5jdGlvbiBleGlzdGluZ0ZpbGVzSHRtbChrZXkpewogIHZhciBsaXN0ID0gRk9STS5rZWVwW2tleV0gfHwgW107CiAgaWYgKCFsaXN0Lmxlbmd0aCkgcmV0dXJuICcnOwogIHJldHVybiAnPGRpdiBjbGFzcz0idGh1bWJzIG1iOCI+JyArIGxpc3QubWFwKGZ1',
  'bmN0aW9uKHVybCwgaSl7CiAgICB2YXIgaWQgPSBTdHJpbmcodXJsKS5tYXRjaCgvWy1cd117MjAsfS8pOwogICAgdmFyIHRodW1iID0gaWQgPyAnaHR0cHM6Ly9kcml2ZS5nb29nbGUuY29tL3RodW1ibmFpbD9pZD0nICsgaWRbMF0gKyAnJnN6PXcyMDAnIDogJyc7',
  'CiAgICByZXR1cm4gJzxzcGFuIHN0eWxlPSJwb3NpdGlvbjpyZWxhdGl2ZTtkaXNwbGF5OmlubGluZS1ibG9jayI+JyArCiAgICAgICh0aHVtYiA/ICc8aW1nIGNsYXNzPSJ0aHVtYiIgc3JjPSInICsgZXNjKHRodW1iKSArICciIG9uY2xpY2s9IndpbmRvdy5vcGVu',
  'KFwnJyArIGVzYyh1cmwpICsgJ1wnLFwnX2JsYW5rXCcpIj4nCiAgICAgICAgICAgICA6ICc8YSBjbGFzcz0iYiBpbmZvIiBocmVmPSInICsgZXNjKHVybCkgKyAnIiB0YXJnZXQ9Il9ibGFuayI+4LmE4Lif4Lil4LmMICcgKyAoaSsxKSArICc8L2E+JykgKwogICAg',
  'ICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIG9uY2xpY2s9ImRyb3BGaWxlKFwnJyArIGtleSArICdcJywnICsgaSArICcpIiB0aXRsZT0i4LmA4Lit4Liy4Lit4Lit4LiBIiAnICsKICAgICAgJ3N0eWxlPSJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6LTZweDtyaWdodDot',
  'NnB4O2JhY2tncm91bmQ6dmFyKC0tZGFuZ2VyKTtjb2xvcjojZmZmO2JvcmRlcjowO2JvcmRlci1yYWRpdXM6OTlweDt3aWR0aDoxOHB4O2hlaWdodDoxOHB4O2xpbmUtaGVpZ2h0OjE7Y3Vyc29yOnBvaW50ZXI7Zm9udC1zaXplOjEycHgiPsOXPC9idXR0b24+JyAr',
  'CiAgICAgICc8L3NwYW4+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwp9CgpmdW5jdGlvbiBkcm9wRmlsZShrZXksIGlkeCl7CiAgRk9STS5rZWVwW2tleV0uc3BsaWNlKGlkeCwgMSk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyArIGtleSArICdf',
  'ZXhpc3RpbmcnKS5pbm5lckhUTUwgPSBleGlzdGluZ0ZpbGVzSHRtbChrZXkpOwp9CgpmdW5jdGlvbiBwcmV2aWV3UGlja2VkKGlucHV0LCBpZCl7CiAgdmFyIGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkICsgJ19wcmV2aWV3Jyk7CiAgdmFyIGZpbGVz',
  'ID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoaW5wdXQuZmlsZXMgfHwgW10pOwogIGJveC5pbm5lckhUTUwgPSBmaWxlcy5tYXAoZnVuY3Rpb24oZil7CiAgICByZXR1cm4gJzxzcGFuIGNsYXNzPSJiIGluZm8iPicgKyBlc2MoZi5uYW1lLnNsaWNlKDAsMjYp',
  'KSArICcgwrcgJyArIE1hdGgucm91bmQoZi5zaXplLzEwMjQpICsgJyBLQjwvc3Bhbj4nOwogIH0pLmpvaW4oJyAnKTsKfQoKLyoqIOC4reC5iOC4suC4meC4hOC5iOC4suC4iOC4suC4geC4n+C4reC4o+C5jOC4oSArIOC4reC4seC4m+C5guC4q+C4peC4lOC5hOC4',
  'n+C4peC5jOC5g+C4q+C4oeC5iCDguYHguKXguYnguKfguITguLfguJkgb2JqZWN0IOC4nuC4o+C5ieC4reC4oeC4muC4seC4meC4l+C4tuC4gSAqLwpmdW5jdGlvbiByZWFkRm9ybShzcGVjcywgYnVja2V0KXsKICB2YXIgb3V0ID0ge307CiAgdmFyIHVwbG9hZHMg',
  'PSBbXTsKCiAgc3BlY3MuZm9yRWFjaChmdW5jdGlvbihmKXsKICAgIGlmIChmLnR5cGUgPT09ICdjb21wdXRlZCcpIHJldHVybjsgICAgICAgICAgLy8g4LiK4LmI4Lit4LiH4LiE4Liz4LiZ4Lin4LiTIOC5hOC4oeC5iOC4leC5ieC4reC4h+C4muC4seC4meC4l+C4',
  'tuC4gQogICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyArIGYua2V5KTsKICAgIGlmICghZWwpIHJldHVybjsKICAgIGlmIChmLnR5cGUgPT09ICdmaWxlcycpIHsKICAgICAgdXBsb2Fkcy5wdXNoKAogICAgICAgIHVwbG9hZEZpbGVzKGVs',
  'LCBidWNrZXQpLnRoZW4oZnVuY3Rpb24ocmVmcyl7CiAgICAgICAgICBvdXRbZi5rZXldID0gKEZPUk0ua2VlcFtmLmtleV0gfHwgW10pLmNvbmNhdChyZWZzLm1hcChmdW5jdGlvbihyKXsgcmV0dXJuIHIudXJsOyB9KSk7CiAgICAgICAgfSkKICAgICAgKTsKICAg',
  'IH0gZWxzZSBpZiAoZi50eXBlID09PSAnbnVtYmVyJyB8fCBmLnR5cGUgPT09ICdtb25leScpIHsKICAgICAgb3V0W2Yua2V5XSA9IGVsLnZhbHVlID09PSAnJyA/IG51bGwgOiBOdW1iZXIoZWwudmFsdWUpOwogICAgfSBlbHNlIHsKICAgICAgb3V0W2Yua2V5XSA9',
  'IGVsLnZhbHVlOwogICAgfQogIH0pOwoKICByZXR1cm4gUHJvbWlzZS5hbGwodXBsb2FkcykudGhlbihmdW5jdGlvbigpeyByZXR1cm4gb3V0OyB9KTsKfQoKLyoqIOC5guC4hOC4o+C4h+C4n+C4reC4o+C5jOC4oeC4oeC4suC4leC4o+C4kOC4suC4mTog4LmA4Lib',
  '4Li04LiUIG1vZGFsLCDguIjguLHguJTguIHguLLguKPguJvguLjguYjguKHguJrguLHguJnguJfguLbguIEsIOC4o+C4teC5guC4q+C4peC4lOC4q+C4meC5ieC4siAqLwpmdW5jdGlvbiBvcGVuRm9ybShvcHRzKXsKICB2YXIgcmVjID0gb3B0cy5yZWNvcmQgfHwg',
  'e307CiAgb3Blbk1vZGFsKG9wdHMudGl0bGUsCiAgICBmaWVsZHNIdG1sKG9wdHMuZmllbGRzLCByZWMpLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgIChyZWMu',
  'aWQgJiYgb3B0cy5vbkRlbGV0ZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4gZGdyIiBpZD0iZkRlbCI+4Lil4Lia4Lij4Liy4Lii4LiB4Liy4Lij4LiZ4Li14LmJPC9idXR0b24+JyA6ICcnKSArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgaWQ9ImZTYXZlIj4n',
  'ICsgKHJlYy5pZCA/ICfguJrguLHguJnguJfguLbguIHguIHguLLguKPguYHguIHguYnguYTguIInIDogJ+C4muC4seC4meC4l+C4tuC4gScpICsgJzwvYnV0dG9uPicsCiAgICBvcHRzLndpZGUpOwoKICBpZiAocmVjLmlkICYmIG9wdHMub25EZWxldGUpIHsKICAg',
  'IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmRGVsJykub25jbGljayA9IGZ1bmN0aW9uKCl7IGNsb3NlTW9kYWwoKTsgb3B0cy5vbkRlbGV0ZShyZWMuaWQpOyB9OwogIH0KCiAgcmVjYWxjU3VtcygpOwoKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZlNhdmUn',
  'KS5vbmNsaWNrID0gZnVuY3Rpb24oKXsKICAgIHZhciBidG4gPSB0aGlzOwogICAgYnRuLmRpc2FibGVkID0gdHJ1ZTsKICAgIGJ0bi5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4Lia4Lix4LiZ4LiX4Li24LiB',
  '4oCmJzsKCiAgICByZWFkRm9ybShvcHRzLmZpZWxkcywgb3B0cy5idWNrZXQgfHwgJ21pc2MnKS50aGVuKGZ1bmN0aW9uKGRhdGEpewogICAgICB2YXIgbWlzc2luZyA9IG9wdHMuZmllbGRzLmZpbHRlcihmdW5jdGlvbihmKXsKICAgICAgICByZXR1cm4gZi5yZXF1',
  'aXJlZCAmJiAoZGF0YVtmLmtleV0gPT0gbnVsbCB8fCBkYXRhW2Yua2V5XSA9PT0gJycpOwogICAgICB9KTsKICAgICAgaWYgKG1pc3NpbmcubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoJ+C4geC4o+C4uOC4k+C4suC4geC4o+C4reC4gTogJyArIG1pc3NpbmcubWFw',
  'KGZ1bmN0aW9uKGYpeyByZXR1cm4gZi5sYWJlbDsgfSkuam9pbignLCAnKSk7CgogICAgICB2YXIgcmVjb3JkID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0cy5iYXNlIHx8IHt9LCBkYXRhKTsKICAgICAgaWYgKHJlYy5pZCkgcmVjb3JkLmlkID0gcmVjLmlkOwogICAg',
  'ICByZXR1cm4gY2FsbEFwaShvcHRzLmFjdGlvbiwgT2JqZWN0LmFzc2lnbih7IHJlY29yZDogcmVjb3JkIH0sIG9wdHMuZXh0cmEgfHwge30pKTsKICAgIH0pLnRoZW4oZnVuY3Rpb24oKXsKICAgICAgY2xvc2VNb2RhbCgpOwogICAgICB0b2FzdCgn4Lia4Lix4LiZ',
  '4LiX4Li24LiB4LmA4Lij4Li14Lii4Lia4Lij4LmJ4Lit4LiiJywgJ29rJyk7CiAgICAgIGxvYWQoKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTsKICAgICAgYnRuLnRleHRDb250ZW50ID0gcmVjLmlkID8gJ+C4',
  'muC4seC4meC4l+C4tuC4geC4geC4suC4o+C5geC4geC5ieC5hOC4gicgOiAn4Lia4Lix4LiZ4LiX4Li24LiBJzsKICAgICAgdG9hc3QoZS5tZXNzYWdlIHx8IGUsICdlcnInKTsKICAgIH0pOwogIH07Cn0KCmZ1bmN0aW9uIHJvb21PcHRpb25zKCl7IHJldHVybiBT',
  'LmJvb3QgPyBTLmJvb3Qucm9vbXMgOiBbXTsgfQpmdW5jdGlvbiBvcHQobmFtZSl7IHJldHVybiAoUy5ib290ICYmIFMuYm9vdC5zY2hlbWFbbmFtZV0pIHx8IFtdOyB9CmZ1bmN0aW9uIHRvZGF5KCl7IHJldHVybiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc2xp',
  'Y2UoMCwxMCk7IH0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3guKPguYzguKE6IOC4geC5ieC4reC4meC4q+C4meC4teC5iQogICA9PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybURlYnQocmVjLCBsZWRnZXIpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4geC5ieC4reC4meC4q+C4meC4teC5',
  'iScgOiAn4LmA4Lie4Li04LmI4Lih4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJJywKICAgIHJlY29yZDogcmVjLCBhY3Rpb246ICdkZWJ0LnNhdmUnLCBiYXNlOiB7IGxlZGdlcjogbGVkZ2VyIH0sCiAgICBvbkRlbGV0ZTogZGVsRGVidCwKICAgIGZpZWxkczogWwog',
  'ICAgICB7IGtleTondGl0bGUnLCAgICBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4Lij4Lir4LiZ4Li14LmJJywgcmVxdWlyZWQ6dHJ1ZSwgZnVsbDp0cnVlLCBwaDon4LmA4LiK4LmI4LiZIOC4hOC5iOC4suC4geC5iOC4reC4quC4o+C5ieC4suC4hyBUaGUgTSBDb3Ju',
  'ZXIgQVAnIH0sCiAgICAgIHsga2V5OidsZWRnZXInLCAgIGxhYmVsOifguJvguKPguLDguYDguKDguJfguJrguLHguI3guIrguLUnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOlsn4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiBJywn4Lir4LiZ4Li14LmJ4Lij4Lit4LiH',
  'J10sIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5OidjcmVkaXRvcicsIGxhYmVsOifguYDguIjguYnguLLguKvguJnguLXguYknLCBwaDon4LmA4LiK4LmI4LiZIOC4hOC4o+C4reC4muC4hOC4o+C4seC4pyAvIOC4mOC4meC4suC4hOC4suC4oyAvIOC4m+C5ieC4',
  'suC4leC4sicgfSwKICAgICAgeyBrZXk6J3N0YXJ0RGF0ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguIHguYjguK3guKvguJnguLXguYknLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleToncHJpbmNpcGFsJywgbGFiZWw6J+C4ouC4reC4lOC4q+C4meC4',
  'teC5ieC4leC4seC5ieC4h+C4leC5ieC4mSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JywgcmVxdWlyZWQ6dHJ1ZSB9LAogICAgICB7IGtleTonaW50ZXJlc3RQZXJNb250aCcsIGxhYmVsOifguJTguK3guIHguYDguJrguLXguYnguKLguJXguYjguK3guYDguJTg',
  'uLfguK3guJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScgfSwKICAgICAgeyBrZXk6J3BsYW5QZXJNb250aCcsIGxhYmVsOifguKLguK3guJTguJzguYjguK3guJnguJXguYjguK3guYDguJTguLfguK3guJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScgfSwK',
  'ICAgICAgeyBrZXk6J2R1ZURheScsICAgbGFiZWw6J+C4geC4s+C4q+C4meC4lOC4iuC4s+C4o+C4sCAo4Lin4Lix4LiZ4LiX4Li14LmI4LiC4Lit4LiH4LmA4LiU4Li34Lit4LiZKScsIHR5cGU6J251bWJlcicsIHBoOicyMCcgfSwKICAgICAgeyBrZXk6J3N0YXR1',
  'cycsICAgbGFiZWw6J+C4quC4luC4suC4meC4sCcsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdkZWJ0U3RhdHVzZXMnKSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5',
  'cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0KICB9KTsKICBpZiAoIXJlYykgeyB2YXIgZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2xlZGdlcicpOyBpZiAoZSkgZS52YWx1ZSA9IGxlZGdlcjsgfQp9CgpmdW5jdGlvbiBkZWxEZWJ0KGlkKXsK',
  'ICBjb25maXJtQWN0aW9uKCfguKXguJrguIHguYnguK3guJnguKvguJnguLXguYnguJnguLXguYk/IOC4o+C4suC4ouC4geC4suC4o+C4iuC4s+C4o+C4sOC4l+C4teC5iOC4nOC4ueC4geC5hOC4p+C5ieC4iOC4sOC4ouC4seC4h+C4reC4ouC4ueC5iCcsIGZ1bmN0',
  'aW9uKCl7CiAgICBjYWxsQXBpKCdkZWJ0LmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoKTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8',
  'fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4Lij4Liy4Lii4LiB4Liy4Lij4LmC4Lit4LiZ4LmD4LiK4LmJ4Lir4LiZ',
  '4Li14LmJCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtRGVidFBheW1lbnQocmVjLCBsZWRnZXIpewogIHZhciBkZWJ0cyA9IChTLmNhY2hlW1MucGFnZV0gJiYgUy5j',
  'YWNoZVtTLnBhZ2VdLmRlYnRzKSB8fCBbXTsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguKPguLLguKLguIHguLLguKPguIrguLPguKPguLAnIDogJ+C4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C5guC4',
  'reC4meC5g+C4iuC5ieC4q+C4meC4teC5iScsCiAgICByZWNvcmQ6IHJlYyB8fCB7IHBheURhdGU6IHRvZGF5KCksIGNoYW5uZWw6ICfguYLguK3guJkgUVInIH0sCiAgICBhY3Rpb246ICdkZWJ0LnNhdmVQYXltZW50JywgYmFzZTogeyBsZWRnZXI6IGxlZGdlciB9',
  'LCBidWNrZXQ6ICdkZWJ0JywKICAgIG9uRGVsZXRlOiBkZWxEZWJ0UGF5bWVudCwKICAgIGZpZWxkczogWwogICAgICB7IGtleToncGF5RGF0ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguIrguLPguKPguLAnLCB0eXBlOidkYXRlJywgcmVxdWlyZWQ6dHJ1',
  'ZSB9LAogICAgICB7IGtleTonY2hhbm5lbCcsIGxhYmVsOifguIrguYjguK3guIfguJfguLLguIcnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncGF5Q2hhbm5lbHMnKSB9LAogICAgICB7IGtleToncHJpbmNpcGFsJywgbGFiZWw6J+C5gOC4h+C4tOC4meC4',
  'leC5ieC4mSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5Jywgc3Vtczp0cnVlLAogICAgICAgIGhpbnQ6J+C4quC5iOC4p+C4meC4l+C4teC5iOC5hOC4m+C4peC4lOC4ouC4reC4lOC4q+C4meC4teC5ieC4iOC4o+C4tOC4hycgfSwKICAgICAgeyBrZXk6J2ludGVy',
  'ZXN0JywgIGxhYmVsOifguJTguK3guIHguYDguJrguLXguYnguKIgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHN1bXM6dHJ1ZSwKICAgICAgICBoaW50OifguYTguKHguYjguJbguLnguIHguJnguLPguYTguJvguKXguJTguKLguK3guJTguKvguJnguLXguYkn',
  'IH0sCiAgICAgIHsga2V5OidfdG90YWwnLCAgbGFiZWw6J+C4o+C4p+C4oeC4l+C4teC5iOC5guC4reC4mScsIHR5cGU6J2NvbXB1dGVkJywgZnJvbTpbJ3ByaW5jaXBhbCcsJ2ludGVyZXN0J10sCiAgICAgICAgaGludDon4LiV4Lij4Lin4LiI4LmD4Lir4LmJ4LiV',
  '4Lij4LiH4LiB4Lix4Lia4Lii4Lit4LiU4LmD4LiZ4Liq4Lil4Li04LibIMK3IOC4o+C4sOC4muC4muC4hOC4tOC4lOC5g+C4q+C5ieC4reC4seC4leC5guC4meC4oeC4seC4leC4tCcgfSwKICAgICAgeyBrZXk6J2luc3RhbGxtZW50JywgbGFiZWw6J+C4h+C4p+C4',
  'lOC4l+C4teC5iCcsIHBoOifguYDguIrguYjguJkgOS8yNTY5JyB9LAogICAgICB7IGtleTonZGVidElkJywgIGxhYmVsOifguJzguLnguIHguIHguLHguJrguIHguYnguK3guJnguKvguJnguLXguYknLCB0eXBlOidzZWxlY3QnLAogICAgICAgIG9wdGlvbnM6IGRl',
  'YnRzLm1hcChmdW5jdGlvbihkKXsgcmV0dXJuIHsgdmFsdWU6ZC5pZCwgbGFiZWw6ZC50aXRsZSB9OyB9KSwKICAgICAgICBoaW50OifguYDguKfguYnguJnguKfguYjguLLguIfguYTguJTguYkg4oCUIOC4o+C4sOC4muC4muC4iOC4sOC4meC4seC4muC4o+C4p+C4',
  'oeC4l+C4seC5ieC4h+C4muC4seC4jeC4iuC4tScgfSwKICAgICAgeyBrZXk6J3BheWVyJywgICBsYWJlbDon4Lic4Li54LmJ4LiK4Liz4Lij4LiwJyB9LAogICAgICB7IGtleTonc2xpcHMnLCAgIGxhYmVsOifguKrguKXguLTguJvguIHguLLguKPguYLguK3guJkn',
  'LCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonbm90ZScsICAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbERlYnRQYXlt',
  'ZW50KGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguKPguLLguKLguIHguLLguKPguIrguLPguKPguLDguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2RlYnQuZGVsZXRlUGF5bWVudCcsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsg',
  'dG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoKTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAq',
  'LwpmdW5jdGlvbiBmb3JtUHVyY2hhc2UocmVjKXsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguKPguLLguKLguIHguLLguKPguIvguLfguYnguK0nIDogJ+C5gOC4nuC4tOC5iOC4oeC4o+C4suC4ouC4geC4',
  'suC4o+C4i+C4t+C5ieC4reC4guC4reC4hycsCiAgICByZWNvcmQ6IHJlYyB8fCB7IGJ1eURhdGU6IHRvZGF5KCkgfSwKICAgIGFjdGlvbjogJ3B1cmNoYXNlLnNhdmUnLCBidWNrZXQ6ICdwdXJjaGFzZXMnLCB3aWRlOiB0cnVlLAogICAgb25EZWxldGU6IGRlbFB1',
  'cmNoYXNlLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5OidpdGVtJywgICAgbGFiZWw6J+C4o+C4suC4ouC4geC4suC4o+C4quC4tOC4meC4hOC5ieC4sicsIHR5cGU6J3RleHRhcmVhJywgcmVxdWlyZWQ6dHJ1ZSwgZnVsbDp0cnVlLCBwaDon4LiK4Li34LmI4Lit',
  '4Liq4Li04LiZ4LiE4LmJ4LiyIC8g4Lij4Li44LmI4LiZIC8g4Lij4Liy4Lii4Lil4Liw4LmA4Lit4Li14Lii4LiUJyB9LAogICAgICB7IGtleTonYnV5RGF0ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguIvguLfguYnguK0nLCB0eXBlOidkYXRlJywgcmVx',
  'dWlyZWQ6dHJ1ZSB9LAogICAgICB7IGtleTonY2F0ZWdvcnknLCBsYWJlbDon4Lir4Lih4Lin4LiU4Lir4Lih4Li54LmIJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ3B1cmNoYXNlQ2F0ZWdvcmllcycpIH0sCiAgICAgIHsga2V5OidxdHknLCAgICAgbGFi',
  'ZWw6J+C4iOC4s+C4meC4p+C4mScsIHR5cGU6J251bWJlcicgfSwKICAgICAgeyBrZXk6J3VuaXQnLCAgICBsYWJlbDon4Lir4LiZ4LmI4Lin4LiiJywgcGg6J+C4iuC4tOC5ieC4mSAvIOC4iuC4uOC4lCAvIOC5gOC4hOC4o+C4t+C5iOC4reC4hycgfSwKICAgICAg',
  'eyBrZXk6J3ByaWNlJywgICBsYWJlbDon4Lij4Liy4LiE4Liy4Lij4Lin4LihICjguJrguLLguJcpJywgdHlwZTonbW9uZXknLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5Oid2ZW5kb3InLCAgbGFiZWw6J+C5geC4q+C4peC5iOC4h+C4l+C4teC5iOC4i+C4',
  't+C5ieC4rScsIHBoOidTaG9wZWUgLyDguYTguJfguKfguLHguKrguJTguLggLyDguKPguYnguLLguJnigKYnIH0sCiAgICAgIHsga2V5OidwYXllcicsICAgbGFiZWw6J+C4nOC4ueC5ieC4iuC4s+C4o+C4sCcgfSwKICAgICAgeyBrZXk6J3dhcnJhbnR5TW9udGhz',
  'JywgbGFiZWw6J+C4o+C4sOC4ouC4sOC5gOC4p+C4peC4suC4o+C4seC4muC4m+C4o+C4sOC4geC4seC4mSAo4LmA4LiU4Li34Lit4LiZKScsIHR5cGU6J251bWJlcicsCiAgICAgICAgaGludDon4Lij4Liw4Lia4Lia4LiI4Liw4LiE4Liz4LiZ4Lin4LiT4Lin4Lix',
  '4LiZ4Lir4Lih4LiU4Lib4Lij4Liw4LiB4Lix4LiZ4LmD4Lir4LmJ4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0JyB9LAogICAgICB7IGtleToncm9vbScsICAgIGxhYmVsOifguKvguYnguK3guIcv4Lie4Li34LmJ4LiZ4LiX4Li14LmI4LiX4Li14LmI4LmD4LiK',
  '4LmJJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpbJ+C4quC5iOC4p+C4meC4geC4peC4suC4hyddLmNvbmNhdChyb29tT3B0aW9ucygpKSB9LAogICAgICB7IGtleToncGhvdG9zJywgIGxhYmVsOifguKDguLLguJ7guJvguKPguLDguIHguK3guJrguKrguLTguJng',
  'uITguYnguLInLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonc2xpcHMnLCAgIGxhYmVsOifguKrguKXguLTguJvguIHguLLguKPguYLguK3guJnguIrguLPguKPguLAnLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtl',
  'eTonbm90ZScsICAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbFB1cmNoYXNlKGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguKPguLLguKLg',
  'uIHguLLguKPguIvguLfguYnguK3guJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ3B1cmNoYXNlLmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoKTsgfSkK',
  'ICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog',
  '4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtQWMocmVjKXsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5p',
  'ZCA/ICfguYHguIHguYnguYTguILguKPguLLguKLguIHguLLguKPguKXguYnguLLguIfguYHguK3guKPguYwnIDogJ+C4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C4peC5ieC4suC4h+C5geC4reC4o+C5jCcsCiAgICByZWNvcmQ6IHJlYyB8fCB7IGJvb2tEYXRl',
  'OiB0b2RheSgpIH0sCiAgICBhY3Rpb246ICdhYy5zYXZlJywgYnVja2V0OiAnYWMnLAogICAgb25EZWxldGU6IGRlbEFjLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oidyb29tJywgICAgICAgIGxhYmVsOifguKvguYnguK3guIcnLCB0eXBlOidzZWxlY3QnLCBv',
  'cHRpb25zOnJvb21PcHRpb25zKCksIHJlcXVpcmVkOnRydWUsIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5Oidyb3VuZCcsICAgICAgIGxhYmVsOifguKPguK3guJrguJfguLXguYgnLCB0eXBlOidudW1iZXInLCBoaW50OifguYDguKfguYnguJnguKfguYjguLLg',
  'uIfguYPguKvguYnguKPguLDguJrguJrguJnguLHguJrguJXguYjguK3guIjguLLguIHguKPguK3guJrguKXguYjguLLguKrguLjguJTguILguK3guIfguJvguLXguJnguLHguYnguJknIH0sCiAgICAgIHsga2V5Oidib29rRGF0ZScsICAgIGxhYmVsOifguKfguLHg',
  'uJnguJfguLXguYjguJnguLHguJTguKXguYnguLLguIfguYHguK3guKPguYwnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonc2VydmljZURhdGUnLCBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4Lij4LiI4Lij4Li0',
  '4LiHJywgdHlwZTonZGF0ZScsIGhpbnQ6J+C4geC4o+C4reC4geC5gOC4oeC4t+C5iOC4reC4peC5ieC4suC4h+C5gOC4quC4o+C5h+C4iOC5geC4peC5ieC4pycgfSwKICAgICAgeyBrZXk6J3N0YXR1cycsICAgICAgbGFiZWw6J+C4quC4luC4suC4meC4sCcsIHR5',
  'cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdhY1N0YXR1c2VzJykgfSwKICAgICAgeyBrZXk6J3RlY2huaWNpYW4nLCAgbGFiZWw6J+C4iuC5iOC4suC4hyAvIOC4nOC4ueC5ieC5g+C4q+C5ieC4muC4o+C4tOC4geC4suC4oycgfSwKICAgICAgeyBrZXk6J2Nvc3Qn',
  'LCAgICAgICAgbGFiZWw6J+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oiAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JyB9LAogICAgICB7IGtleToncGhvdG9zJywgICAgICBsYWJlbDon4Lig4Liy4Lie4Lib4Lij4Liw4LiB4Lit4LiaJywgdHlwZTonZmls',
  'ZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICAgICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0KICB9KTsKfQoKZnVuY3Rpb24gZGVsQWMoaWQpewogIGNvbmZp',
  'cm1BY3Rpb24oJ+C4peC4muC4o+C4suC4ouC4geC4suC4o+C4peC5ieC4suC4h+C5geC4reC4o+C5jOC4meC4teC5iT8nLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgnYWMuZGVsZXRlJywgeyBpZDogaWQgfSkudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia',
  '4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCgpOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgovKiog4LiZ4Lix4LiU4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4Lir4Lil4Liy4Lii4Lir',
  '4LmJ4Lit4LiH4Lie4Lij4LmJ4Lit4Lih4LiB4Lix4LiZICovCmZ1bmN0aW9uIGZvcm1CdWxrQWMoKXsKICB2YXIgcm9vbXMgPSByb29tT3B0aW9ucygpOwogIHZhciBib2R5ID0KICAgICc8ZGl2IGNsYXNzPSJmZ3JpZCI+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJm',
  'Ij48bGFiZWw+4Lin4Lix4LiZ4LiX4Li14LmI4LiZ4Lix4LiUIDxzcGFuIHN0eWxlPSJjb2xvcjp2YXIoLS1kYW5nZXIpIj4qPC9zcGFuPjwvbGFiZWw+JyArCiAgICAgICAgJzxpbnB1dCB0eXBlPSJkYXRlIiBjbGFzcz0iaW5wIiBpZD0iYmtfZGF0ZSIgdmFsdWU9',
  'IicgKyB0b2RheSgpICsgJyI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIj48bGFiZWw+4LiK4LmI4Liy4LiHIC8g4Lic4Li54LmJ4LmD4Lir4LmJ4Lia4Lij4Li04LiB4Liy4LijPC9sYWJlbD48aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImJrX3RlY2giPjwv',
  'ZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiI+PGxhYmVsPuC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC4leC5iOC4reC4q+C5ieC4reC4hyAo4Lia4Liy4LiXKTwvbGFiZWw+PGlucHV0IHR5cGU9Im51bWJlciIgY2xhc3M9ImlucCIgaWQ9ImJrX2Nv',
  'c3QiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiI+PGxhYmVsPuC4q+C4oeC4suC4ouC5gOC4q+C4leC4uDwvbGFiZWw+PGlucHV0IGNsYXNzPSJpbnAiIGlkPSJia19ub3RlIj48L2Rpdj4nICsKICAgICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJo',
  'ciI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0icm93IG1iOCI+PGIgY2xhc3M9ImZzMTMiPuC5gOC4peC4t+C4reC4geC4q+C5ieC4reC4hzwvYj48c3BhbiBjbGFzcz0ic3AiPjwvc3Bhbj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGlj',
  'az0iYnVsa1BpY2soXCdhbGxcJykiPuC4l+C4seC5ieC4h+C4q+C4oeC4lDwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJidWxrUGljayhcJ25vbmVcJykiPuC4peC5ieC4suC4hzwvYnV0dG9uPicgKwogICAgICBbMSwy',
  'LDMsNCw1XS5tYXAoZnVuY3Rpb24oZil7IHJldHVybiAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJidWxrUGljaygnICsgZiArICcpIj7guIrguLHguYnguJkgJyArIGYgKyAnPC9idXR0b24+JzsgfSkuam9pbignJykgKwogICAgJzwvZGl2PicgKwog',
  'ICAgJzxkaXYgY2xhc3M9InJvb21zIiBpZD0iYmtSb29tcyI+JyArIHJvb21zLm1hcChmdW5jdGlvbihyKXsKICAgICAgcmV0dXJuICc8bGFiZWwgY2xhc3M9InJvb20iIHN0eWxlPSJjdXJzb3I6cG9pbnRlciI+PGlucHV0IHR5cGU9ImNoZWNrYm94IiBjbGFzcz0i',
  'YmsiIHZhbHVlPSInICsgciArICciPiA8Yj4nICsgciArICc8L2I+PC9sYWJlbD4nOwogICAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKCiAgb3Blbk1vZGFsKCfwn5OFIOC4meC4seC4lOC4peC5ieC4suC4h+C5geC4reC4o+C5jOC4q+C4peC4suC4ouC4q+C5ieC4',
  'reC4h+C4nuC4o+C5ieC4reC4oeC4geC4seC4mScsIGJvZHksCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4gTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIGlkPSJi',
  'a1NhdmUiPuC4quC4o+C5ieC4suC4h+C4meC4seC4lOC4q+C4oeC4suC4ojwvYnV0dG9uPicsIHRydWUpOwoKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmtTYXZlJykub25jbGljayA9IGZ1bmN0aW9uKCl7CiAgICB2YXIgcGlja2VkID0gQXJyYXkucHJvdG90',
  'eXBlLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmJrOmNoZWNrZWQnKSkubWFwKGZ1bmN0aW9uKGMpeyByZXR1cm4gYy52YWx1ZTsgfSk7CiAgICB2YXIgZGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdia19kYXRlJykudmFsdWU7',
  'CiAgICBpZiAoIXBpY2tlZC5sZW5ndGgpIHJldHVybiB0b2FzdCgn4LmA4Lil4Li34Lit4LiB4Lit4Lii4LmI4Liy4LiH4LiZ4LmJ4Lit4LiiIDEg4Lir4LmJ4Lit4LiHJywgJ2VycicpOwogICAgaWYgKCFkYXRlKSByZXR1cm4gdG9hc3QoJ+C4geC4o+C4uOC4k+C4',
  'suC4o+C4sOC4muC4uOC4p+C4seC4meC4l+C4teC5iOC4meC4seC4lCcsICdlcnInKTsKICAgIHZhciBidG4gPSB0aGlzOyBidG4uZGlzYWJsZWQgPSB0cnVlOyBidG4uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4',
  'h+C4muC4seC4meC4l+C4tuC4geKApic7CiAgICBjYWxsQXBpKCdhYy5idWxrQm9vaycsIHsKICAgICAgcm9vbXM6IHBpY2tlZCwgYm9va0RhdGU6IGRhdGUsCiAgICAgIHRlY2huaWNpYW46IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdia190ZWNoJykudmFsdWUs',
  'CiAgICAgIGNvc3Q6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdia19jb3N0JykudmFsdWUsCiAgICAgIG5vdGU6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdia19ub3RlJykudmFsdWUKICAgIH0pLnRoZW4oZnVuY3Rpb24obil7CiAgICAgIGNsb3NlTW9kYWwo',
  'KTsgdG9hc3QoJ+C4quC4o+C5ieC4suC4h+C4meC4seC4lOC4q+C4oeC4suC4oiAnICsgbiArICcg4Lir4LmJ4Lit4LiH4LmB4Lil4LmJ4LinJywgJ29rJyk7IGxvYWQoKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICBidG4uZGlzYWJsZWQgPSBmYWxz',
  'ZTsgYnRuLnRleHRDb250ZW50ID0gJ+C4quC4o+C5ieC4suC4h+C4meC4seC4lOC4q+C4oeC4suC4oic7IHRvYXN0KGUubWVzc2FnZXx8ZSwgJ2VycicpOwogICAgfSk7CiAgfTsKfQoKZnVuY3Rpb24gYnVsa1BpY2sod2hhdCl7CiAgZG9jdW1lbnQucXVlcnlTZWxl',
  'Y3RvckFsbCgnLmJrJykuZm9yRWFjaChmdW5jdGlvbihjKXsKICAgIGlmICh3aGF0ID09PSAnYWxsJykgYy5jaGVja2VkID0gdHJ1ZTsKICAgIGVsc2UgaWYgKHdoYXQgPT09ICdub25lJykgYy5jaGVja2VkID0gZmFsc2U7CiAgICBlbHNlIGMuY2hlY2tlZCA9IFN0',
  'cmluZyhjLnZhbHVlKS5jaGFyQXQoMCkgPT09IFN0cmluZyh3aGF0KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4LiL4LmI4Lit4Lih4LmB',
  '4LiL4Lih4LiV4Liy4Lih4Lir4LmJ4Lit4LiHCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtUmVwYWlyKHJlYyl7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAm',
  'JiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4LiH4Liy4LiZ4LiL4LmI4Lit4LihJyA6ICfguYHguIjguYnguIfguIvguYjguK3guKEgLyDguJrguLHguJnguJfguLbguIHguIfguLLguJnguIvguYjguK3guKEnLAogICAgcmVjb3JkOiByZWMgfHwgeyByZXBvcnRE',
  'YXRlOiB0b2RheSgpLCBwcmlvcml0eTogJ+C4m+C4geC4leC4tCcgfSwKICAgIGFjdGlvbjogJ3JlcGFpci5zYXZlJywgYnVja2V0OiAncm9vbVJlcGFpcicsIHdpZGU6IHRydWUsCiAgICBvbkRlbGV0ZTogZGVsUmVwYWlyLAogICAgZmllbGRzOiBbCiAgICAgIHsg',
  'a2V5Oidyb29tJywgICAgICAgbGFiZWw6J+C4q+C5ieC4reC4hycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6cm9vbU9wdGlvbnMoKSwgcmVxdWlyZWQ6dHJ1ZSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J2NhdGVnb3J5JywgICBsYWJlbDon4Lib4Lij4Liw',
  '4LmA4Lig4LiX4LiH4Liy4LiZJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ3JlcGFpckNhdGVnb3JpZXMnKSB9LAogICAgICB7IGtleTonaXRlbXMnLCAgICAgIGxhYmVsOifguKPguLLguKLguIHguLLguKPguJfguLXguYjguJXguYnguK3guIfguIvguYjg',
  'uK3guKHguYHguIvguKEnLCB0eXBlOid0ZXh0YXJlYScsIHJlcXVpcmVkOnRydWUsIGZ1bGw6dHJ1ZSwKICAgICAgICBwaDon4LmA4LiK4LmI4LiZIDEu4Lii4Liy4LmB4LiZ4LinIDIu4LmA4LiB4LmH4Lia4Liq4Li14Lir4LmJ4Lit4LiHIDMu4LmA4Lib4Lil4Li1',
  '4LmI4Lii4LiZ4LiB4LmK4Lit4LiB4LiZ4LmJ4Liz4Lil4LmJ4Liy4LiH4LiI4Liy4LiZJyB9LAogICAgICB7IGtleToncmVwb3J0RGF0ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguYHguIjguYnguIcnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTon',
  'Ym9va0RhdGUnLCAgIGxhYmVsOifguKfguLHguJnguJnguLHguJTguIvguYjguK3guKHguYHguIvguKEnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleToncmVwYWlyRGF0ZScsIGxhYmVsOifguKfguLHguJnguYDguILguYnguLLguIvguYjguK3guKHguYHguIvg',
  'uKEnLCB0eXBlOidkYXRlJywgaGludDon4LiB4Lij4Lit4LiB4LmA4Lih4Li34LmI4Lit4LiL4LmI4Lit4Lih4LmA4Liq4Lij4LmH4LiI4LmB4Lil4LmJ4LinJyB9LAogICAgICB7IGtleTonc3RhdHVzJywgICAgIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0eXBl',
  'OidzZWxlY3QnLCBvcHRpb25zOm9wdCgncmVwYWlyU3RhdHVzZXMnKSB9LAogICAgICB7IGtleToncHJpb3JpdHknLCAgIGxhYmVsOifguITguKfguLLguKHguYDguKPguYjguIfguJTguYjguKfguJknLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncHJpb3Jp',
  'dGllcycpLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleTondGVjaG5pY2lhbicsIGxhYmVsOifguIrguYjguLLguIfguJzguLnguYnguIvguYjguK3guKEnIH0sCiAgICAgIHsga2V5Oidjb3N0JywgICAgICAgbGFiZWw6J+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5',
  'iOC4suC4oiAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JyB9LAogICAgICB7IGtleToncGhvdG9zQmVmb3JlJywgbGFiZWw6J+C4oOC4suC4nuC4geC5iOC4reC4meC4i+C5iOC4reC4oScsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidw',
  'aG90b3NBZnRlcicsICBsYWJlbDon4Lig4Liy4Lie4Lir4Lil4Lix4LiH4LiL4LmI4Lit4LihJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTon',
  'dGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxSZXBhaXIoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4h+C4suC4meC4i+C5iOC4reC4oeC4meC4teC5iT8nLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgncmVwYWly',
  'LmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoKTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoK',
  'LyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmC4LiU4Lii4Lij4Lin4LihCiAgID09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtQnVpbGRpbmcocmVjKXsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguIfguLLguJnguIvguYjg',
  'uK3guKHguJXguLbguIEnIDogJ+C5gOC4nuC4tOC5iOC4oeC4h+C4suC4meC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oScsCiAgICByZWNvcmQ6IHJlYyB8fCB7IGJvb2tEYXRlOiB0b2RheSgpIH0sCiAgICBhY3Rpb246ICdi',
  'dWlsZGluZy5zYXZlJywgYnVja2V0OiAnYnVpbGRpbmcnLCB3aWRlOiB0cnVlLAogICAgb25EZWxldGU6IGRlbEJ1aWxkaW5nLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oid6b25lJywgICAgICBsYWJlbDon4Liq4LmI4Lin4LiZ4LiC4Lit4LiH4Lit4Liy4LiE',
  '4Liy4LijJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ2J1aWxkaW5nWm9uZXMnKSwgcmVxdWlyZWQ6dHJ1ZSB9LAogICAgICB7IGtleTondGl0bGUnLCAgICAgbGFiZWw6J+C4o+C4suC4ouC4geC4suC4o+C4i+C5iOC4reC4oeC5geC4i+C4oScsIHR5cGU6',
  'J3RleHRhcmVhJywgcmVxdWlyZWQ6dHJ1ZSwgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidib29rRGF0ZScsICBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiZ4Lix4LiUJywgdHlwZTonZGF0ZScgfSwKICAgICAgeyBrZXk6J3N0YXJ0RGF0ZScsIGxhYmVsOifg',
  'uKfguLHguJnguJfguLXguYjguYDguKPguLTguYjguKHguJTguLPguYDguJnguLTguJnguIHguLLguKMnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonZW5kRGF0ZScsICAgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC5geC4peC5ieC4p+C5gOC4quC4o+C5',
  'h+C4iCcsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCAgICBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ2J1aWxkaW5nU3RhdHVzZXMnKSB9LAogICAgICB7IGtleTonY29udHJhY3RvcicsIGxh',
  'YmVsOifguJzguLnguYnguKPguLHguJrguYDguKvguKHguLIgLyDguKPguYnguLLguJknIH0sCiAgICAgIHsga2V5Oidjb3N0JywgICAgICBsYWJlbDon4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiICjguJrguLLguJcpJywgdHlwZTonbW9uZXknIH0sCiAg',
  'ICAgIHsga2V5OiduZXh0RHVlJywgICBsYWJlbDon4LiE4Lij4Lia4LiB4Liz4Lir4LiZ4LiU4Lij4Lit4Lia4LiW4Lix4LiU4LmE4LibJywgdHlwZTonZGF0ZScsIGhpbnQ6J+C5gOC4iuC5iOC4mSDguIHguLHguJnguIvguLbguKHguJTguLLguJTguJ/guYnguLLg',
  'uJfguLjguIEgMyDguJvguLUg4oCUIOC5g+C4quC5iOC4p+C4seC4meC4l+C4teC5iOC4hOC4o+C4seC5ieC4h+C4luC4seC4lOC5hOC4mycgfSwKICAgICAgeyBrZXk6J3Bob3RvcycsICAgIGxhYmVsOifguKDguLLguJ7guJvguKPguLDguIHguK3guJonLCB0eXBl',
  'OidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonc2xpcHMnLCAgICAgbGFiZWw6J+C5g+C4muC5gOC4quC4o+C5h+C4iCAvIOC4quC4peC4tOC4mycsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICAgICBsYWJl',
  'bDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxCdWlsZGluZyhpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiV4Li2',
  '4LiB4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdidWlsZGluZy5kZWxldGUnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKCk7IH0pCiAgICAgIC5jYXRjaChmdW5j',
  'dGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3guKPguYzguKE6IOC4guC5ieC4reC4oeC4ueC4',
  'peC4q+C5ieC4reC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybVJvb20ocmVjKXsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogJ+C4guC5ieC4reC4oeC4ueC4peC4',
  'q+C5ieC4reC4hyAnICsgKHJlYyA/IHJlYy5yb29tIDogJycpLAogICAgcmVjb3JkOiByZWMsIGFjdGlvbjogJ3Jvb20uc2F2ZScsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3Jvb20nLCAgIGxhYmVsOifguKvguYnguK3guIcnLCByZXF1aXJlZDp0cnVlIH0s',
  'CiAgICAgIHsga2V5OidmbG9vcicsICBsYWJlbDon4LiK4Lix4LmJ4LiZJywgdHlwZTonbnVtYmVyJyB9LAogICAgICB7IGtleTonc3RhdHVzJywgbGFiZWw6J+C4quC4luC4suC4meC4sCcsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdyb29tU3RhdHVzZXMn',
  'KSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J3RlbmFudCcsIGxhYmVsOifguIrguLfguYjguK3guJzguLnguYnguYDguIrguYjguLInIH0sCiAgICAgIHsga2V5OidwaG9uZScsICBsYWJlbDon4LmA4Lia4Lit4Lij4LmM4LiV4Li04LiU4LiV4LmI4LitJyB9',
  'LAogICAgICB7IGtleToncmVudCcsICAgbGFiZWw6J+C4hOC5iOC4suC5gOC4iuC5iOC4si/guYDguJTguLfguK3guJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScgfSwKICAgICAgeyBrZXk6J21vdmVJbicsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguYDg',
  'uILguYnguLLguK3guKLguLnguYgnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonbm90ZScsICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0KICB9KTsKfQoKLyogPT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4ouC4q+C4rQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybUZpbmFuY2UocmVjKXsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguKPguLLguKLguIHguLLguKMnIDogJ+C4muC4seC4',
  'meC4l+C4tuC4geC4o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKInLAogICAgcmVjb3JkOiByZWMgfHwgeyBkYXRlOiB0b2RheSgpLCBjaGFubmVsOiAn4LmC4Lit4LiZIFFSJyB9LAogICAgYWN0aW9uOiAnZmluYW5jZS5zYXZlJywgYnVja2V0',
  'OiAnbWlzYycsCiAgICBvbkRlbGV0ZTogZGVsRmluYW5jZSwKICAgIGZpZWxkczogWwogICAgICB7IGtleTona2luZCcsICAgbGFiZWw6J+C4o+C4suC4ouC4geC4suC4oycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdmaW5hbmNlS2luZHMnKSwgcmVxdWly',
  'ZWQ6dHJ1ZSwgYmxhbms6ZmFsc2UsCiAgICAgICAgaGludDon4LmA4Lil4Li34Lit4LiBICLguKPguLLguKLguKPguLHguJrguITguYjguLLguYDguIrguYjguLIiIOC4q+C4o+C4t+C4rSAi4Lij4Liy4Lii4Lij4Lix4Lia4Lit4Li34LmI4LiZIOC5hiIg4Lij4Liw',
  '4Lia4Lia4LiI4Liw4LiZ4Lix4Lia4LmA4Lib4LmH4LiZ4Lid4Lix4LmI4LiH4Lij4Liy4Lii4Lij4Lix4Lia4LmD4Lir4LmJ4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0JyB9LAogICAgICB7IGtleTonZGF0ZScsICAgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5',
  'iCcsIHR5cGU6J2RhdGUnLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidhbW91bnQnLCBsYWJlbDon4LiI4Liz4LiZ4Lin4LiZ4LmA4LiH4Li04LiZICjguJrguLLguJcpJywgdHlwZTonbW9uZXknLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5Oidi',
  'aWxsTW9udGgnLCBsYWJlbDon4Lij4Lit4Lia4Lia4Li04Lil4LiC4Lit4LiH4LmA4LiU4Li34Lit4LiZJywgcGg6J+C5gOC4iuC5iOC4mSDguIEu4LiELiAyNTY5JyB9LAogICAgICB7IGtleTonY2hhbm5lbCcsIGxhYmVsOifguIrguYjguK3guIfguJfguLLguIcn',
  'LCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnZmluYW5jZUNoYW5uZWxzJykgfSwKICAgICAgeyBrZXk6J3NsaXBzJywgIGxhYmVsOifguKrguKXguLTguJsgLyDguYPguJrguYDguKrguKPguYfguIgnLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAg',
  'ICB7IGtleTonbm90ZScsICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0KICB9KTsKfQoKZnVuY3Rpb24gZGVsRmluYW5jZShpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4Lij4Liy',
  '4Lii4LiB4Liy4Lij4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdmaW5hbmNlLmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoKTsgfSkKICAgICAgLmNh',
  'dGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4quC4s+C4o+C4reC4hyAvIOC4geC4ueC5',
  'ieC4hOC4t+C4meC4guC5ieC4reC4oeC4ueC4pQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZG9FeHBvcnRKc29uKCl7CiAgdG9hc3QoJ+C4geC4s+C4peC4seC4h+C5gOC4',
  'leC4o+C4teC4ouC4oeC5hOC4n+C4peC5jOC4quC4s+C4o+C4reC4h+KApicpOwogIGNhbGxBcGkoJ2JhY2t1cC5leHBvcnQnLCB7fSkudGhlbihmdW5jdGlvbihkdW1wKXsKICAgIHNhdmVUZXh0RmlsZSgndGhlLW0tY29ybmVyLWFwLWJhY2t1cC0nICsgdG9kYXko',
  'KSArICcuanNvbicsCiAgICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoZHVtcCwgbnVsbCwgMSksICdhcHBsaWNhdGlvbi9qc29uJyk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwgJ2VycicpOyB9KTsKfQoKZnVuY3Rpb24g',
  'ZG9FeHBvcnRDc3Yoc2hlZXQpewogIGNhbGxBcGkoJ2JhY2t1cC5jc3YnLCB7IHNoZWV0OiBzaGVldCB9KS50aGVuKGZ1bmN0aW9uKHIpewogICAgc2F2ZVRleHRGaWxlKHIuZmlsZW5hbWUsIHIuY29udGVudCwgJ3RleHQvY3N2Jyk7CiAgfSkuY2F0Y2goZnVuY3Rp',
  'b24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwgJ2VycicpOyB9KTsKfQoKLyoqIOC4lOC4suC4p+C4meC5jOC5guC4q+C4peC4lOC5hOC4n+C4peC5jCDigJQg4LmD4LiK4LmJIGRvd25sb2FkcyBjYXBhYmlsaXR5IOC4luC5ieC4suC4oeC4tSDguYTguKHguYjguIfg',
  'uLHguYnguJnguYPguIrguYnguKXguLTguIfguIHguYzguJvguIHguJXguLQgKi8KZnVuY3Rpb24gc2F2ZVRleHRGaWxlKGZpbGVuYW1lLCBjb250ZW50LCBtaW1lKXsKICBpZiAodHlwZW9mIHdpbmRvdy5zYXZlVmlhSG9zdCA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJu',
  'IHdpbmRvdy5zYXZlVmlhSG9zdChmaWxlbmFtZSwgY29udGVudCwgbWltZSk7CiAgdmFyIGJsb2IgPSBuZXcgQmxvYihbY29udGVudF0sIHsgdHlwZTogbWltZSArICc7Y2hhcnNldD11dGYtOCcgfSk7CiAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdh',
  'Jyk7CiAgYS5ocmVmID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTsKICBhLmRvd25sb2FkID0gZmlsZW5hbWU7CiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhKTsgYS5jbGljaygpOwogIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgVVJMLnJldm9rZU9iamVj',
  'dFVSTChhLmhyZWYpOyBhLnJlbW92ZSgpOyB9LCAxMDAwKTsKICB0b2FzdCgn4LiU4Liy4Lin4LiZ4LmM4LmC4Lir4Lil4LiUICcgKyBmaWxlbmFtZSArICcg4LmB4Lil4LmJ4LinJywgJ29rJyk7Cn0KCmZ1bmN0aW9uIGRvSW1wb3J0SnNvbigpewogIG9wZW5Nb2Rh',
  'bCgn4qyG77iPIOC4geC4ueC5ieC4hOC4t+C4meC4iOC4suC4geC5hOC4n+C4peC5jOC4quC4s+C4o+C4reC4hycsCiAgICAnPHAgY2xhc3M9ImZzMTMiPuC5gOC4peC4t+C4reC4geC5hOC4n+C4peC5jCA8Yj4uanNvbjwvYj4g4LiX4Li14LmI4LmA4LiE4Lii4LiU',
  '4Liy4Lin4LiZ4LmM4LmC4Lir4Lil4LiU4LmE4Lin4LmJPC9wPicgKwogICAgJzxsYWJlbCBjbGFzcz0iZmlsZS1kcm9wIiBmb3I9ImltcEZpbGUiPvCfk4Qg4LmA4Lil4Li34Lit4LiB4LmE4Lif4Lil4LmM4Liq4Liz4Lij4Lit4LiHJyArCiAgICAgICc8aW5wdXQg',
  'dHlwZT0iZmlsZSIgaWQ9ImltcEZpbGUiIGFjY2VwdD0iYXBwbGljYXRpb24vanNvbiwuanNvbiIgc3R5bGU9ImRpc3BsYXk6bm9uZSIgJyArCiAgICAgICdvbmNoYW5nZT0iZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCdpbXBOYW1lXCcpLnRleHRDb250ZW50PXRo',
  'aXMuZmlsZXNbMF0/dGhpcy5maWxlc1swXS5uYW1lOlwnXCciPjwvbGFiZWw+JyArCiAgICAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtdDgiIGlkPSJpbXBOYW1lIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFz',
  'cz0iZiI+PGxhYmVsPuC4p+C4tOC4mOC4teC4geC4ueC5ieC4hOC4t+C4mTwvbGFiZWw+JyArCiAgICAnPHNlbGVjdCBjbGFzcz0ic2VsIiBpZD0iaW1wTW9kZSI+JyArCiAgICAgICc8b3B0aW9uIHZhbHVlPSJtZXJnZSI+4LmA4Lie4Li04LmI4Lih4LmA4LiJ4Lie',
  '4Liy4Liw4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li1ICjguYHguJnguLDguJnguLMpPC9vcHRpb24+JyArCiAgICAgICc8b3B0aW9uIHZhbHVlPSJyZXBsYWNlIj7guKXguYnguLLguIfguILguYnguK3guKHguLnguKXg',
  'uYDguJTguLTguKHguYHguKXguYnguKfguYHguJfguJnguJfguLXguYjguJfguLHguYnguIfguKvguKHguJQ8L29wdGlvbj4nICsKICAgICc8L3NlbGVjdD48L2Rpdj4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLg',
  'uIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBpZD0iaW1wR28iPuC4geC4ueC5ieC4hOC4t+C4meC4guC5ieC4reC4oeC4ueC4pTwvYnV0dG9uPicpOwoKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW1wR28n',
  'KS5vbmNsaWNrID0gZnVuY3Rpb24oKXsKICAgIHZhciBmID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ltcEZpbGUnKS5maWxlc1swXTsKICAgIGlmICghZikgcmV0dXJuIHRvYXN0KCfguIHguKPguLjguJPguLLguYDguKXguLfguK3guIHguYTguJ/guKXguYzg',
  'uIHguYjguK3guJknLCAnZXJyJyk7CiAgICB2YXIgbW9kZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbXBNb2RlJykudmFsdWU7CiAgICB2YXIgYnRuID0gdGhpczsgYnRuLmRpc2FibGVkID0gdHJ1ZTsgYnRuLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz0i',
  'c3BpbiI+PC9zcGFuPiDguIHguLPguKXguLHguIfguIHguLnguYnguITguLfguJnigKYnOwogICAgdmFyIHIgPSBuZXcgRmlsZVJlYWRlcigpOwogICAgci5vbmxvYWQgPSBmdW5jdGlvbigpewogICAgICB2YXIgcGFyc2VkOwogICAgICB0cnkgeyBwYXJzZWQgPSBK',
  'U09OLnBhcnNlKHIucmVzdWx0KTsgfQogICAgICBjYXRjaCAoZSkgeyBidG4uZGlzYWJsZWQgPSBmYWxzZTsgYnRuLnRleHRDb250ZW50ID0gJ+C4geC4ueC5ieC4hOC4t+C4meC4guC5ieC4reC4oeC4ueC4pSc7IHJldHVybiB0b2FzdCgn4LmE4Lif4Lil4LmM4LmE',
  '4Lih4LmI4LmD4LiK4LmIIEpTT04g4LiX4Li14LmI4LiW4Li54LiB4LiV4LmJ4Lit4LiHJywgJ2VycicpOyB9CiAgICAgIGNhbGxBcGkoJ2JhY2t1cC5pbXBvcnQnLCB7IGRhdGE6IHBhcnNlZCwgbW9kZTogbW9kZSB9KS50aGVuKGZ1bmN0aW9uKHN0YXQpewogICAg',
  'ICAgIGNsb3NlTW9kYWwoKTsKICAgICAgICB2YXIgbiA9IE9iamVjdC5rZXlzKHN0YXQpLnJlZHVjZShmdW5jdGlvbihhLGspeyByZXR1cm4gYSArIChzdGF0W2tdfHwwKTsgfSwgMCk7CiAgICAgICAgdG9hc3QoJ+C4geC4ueC5ieC4hOC4t+C4meC4quC4s+C5gOC4',
  'o+C5h+C4iCAnICsgbiArICcg4Lij4Liy4Lii4LiB4Liy4LijJywgJ29rJyk7CiAgICAgICAgbG9hZCgpOwogICAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTsgYnRuLnRleHRDb250ZW50ID0gJ+C4geC4ueC5ieC4',
  'hOC4t+C4meC4guC5ieC4reC4oeC4ueC4pSc7IHRvYXN0KGUubWVzc2FnZXx8ZSwgJ2VycicpOwogICAgICB9KTsKICAgIH07CiAgICByLnJlYWRBc1RleHQoZik7CiAgfTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09CiAgIOC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jCDguYHguKXguLDguIHguLLguKPguKrguLPguKPguK3guIfguKXguIcgR29vZ2xlIERyaXZlCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PSAqLwoKZnVuY3Rpb24gY29weVNoYXJlKCl7CiAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NoYXJlVXJsJyk7CiAgaWYgKCFlbCkgcmV0dXJuOwogIGVsLnNlbGVjdCgpOwogIGlmIChuYXZpZ2F0b3IuY2xpcGJvYXJkKSB7',
  'CiAgICBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChlbC52YWx1ZSkKICAgICAgLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4hOC4seC4lOC4peC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC5geC4peC5ieC4pycsJ29rJyk7IH0pCiAgICAg',
  'IC5jYXRjaChmdW5jdGlvbigpeyB0b2FzdCgn4LiE4Lix4LiU4Lil4Lit4LiB4LmE4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIIOKAlCDguIHguJTguITguYnguLLguIfguJfguLXguYjguIrguYjguK3guIfguYHguKXguYnguKfguYDguKXguLfguK3guIHguITguLHg',
  'uJTguKXguK3guIEnLCdlcnInKTsgfSk7CiAgfSBlbHNlIHsKICAgIHRyeSB7IGRvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7IHRvYXN0KCfguITguLHguJTguKXguK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYzguYHguKXguYnguKcnLCdvaycpOyB9',
  'CiAgICBjYXRjaCAoZSkgeyB0b2FzdCgn4LiE4Lix4LiU4Lil4Lit4LiB4LmE4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIIOKAlCDguIHguJTguITguYnguLLguIfguJfguLXguYjguIrguYjguK3guIfguYHguKXguYnguKfguYDguKXguLfguK3guIHguITguLHguJTg',
  'uKXguK3guIEnLCdlcnInKTsgfQogIH0KfQoKZnVuY3Rpb24gZG9Sb3RhdGVTaGFyZSgpewogIGNvbmZpcm1BY3Rpb24oJ+C4reC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC4iuC4uOC4lOC5g+C4q+C4oeC5iD8g4LiE4LiZ4LiX4Li14LmI4LiW4Li3',
  '4Lit4Lil4Li04LiH4LiB4LmM4LmA4LiU4Li04Lih4LiI4Liw4LmA4Lib4Li04LiU4LmE4Lih4LmI4LmE4LiU4LmJ4Lit4Li14LiBJywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ3NoYXJlLnJvdGF0ZVRva2VuJywge30pLnRoZW4oZnVuY3Rpb24oKXsKICAgICAg',
  'dG9hc3QoJ+C4reC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC4iuC4uOC4lOC5g+C4q+C4oeC5iOC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsK',
  'ICB9KTsKfQoKZnVuY3Rpb24gZG9CYWNrdXBOb3coKXsKICB0b2FzdCgn4LiB4Liz4Lil4Lix4LiH4Liq4Liz4Lij4Lit4LiH4LiC4LmJ4Lit4Lih4Li54Lil4Lil4LiHIERyaXZl4oCmJyk7CiAgY2FsbEFwaSgnYmFja3VwLmJhY2t1cE5vdycsIHt9KS50aGVuKGZ1',
  'bmN0aW9uKHIpewogICAgdG9hc3QoJ+C4quC4s+C4o+C4reC4h+C5geC4peC5ieC4pzogJyArIHIubmFtZSwgJ29rJyk7IGxvYWQoKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7Cn0KPC9zY3JpcHQ+CjxzY3Jp',
  'cHQ+Ym9vdCgpOzwvc2NyaXB0Pgo8L2JvZHk+CjwvaHRtbD4K'
].join('');

function indexHtml_() {
  return Utilities.newBlob(Utilities.base64Decode(INDEX_HTML_B64), 'text/html')
    .getDataAsString('UTF-8');
}
