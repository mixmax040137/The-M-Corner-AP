/**
 * The M Corner AP — ระบบบริหารหอพัก (ไฟล์เดียวจบ)
 * ไฟล์นี้สร้างอัตโนมัติจากโฟลเดอร์ src/ เมื่อ 2026-09-01 03:59 UTC
 *
 * ⚠️ อย่าแก้ไฟล์นี้โดยตรง — แก้ที่ src/ แล้วรัน  node build/bundle.js
 *
 * ประกอบด้วย: Config.gs, Util.gs, Setup.gs, Users.gs, Auth.gs, Settings.gs, Drive.gs, Ocr.gs, Seed.gs, Finance.gs, Migrate.gs, Backup.gs, Debt.gs, Purchase.gs, Maintenance.gs, Building.gs, Dashboard.gs, Api.gs, Notify.gs, Web.gs
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
  USERS: 'Users',                     // บัญชีผู้ใช้และรหัสผ่าน
  SESSIONS: 'Sessions',               // การเข้าใช้งานที่ยังไม่หมดอายุ + อุปกรณ์ที่ตั้ง PIN ไว้
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

/** บทบาทผู้ใช้ เรียงจากสิทธิ์มากไปน้อย */
var ROLES = ['ผู้ดูแล', 'แก้ไขได้', 'ดูอย่างเดียว'];

SCHEMA[SHEETS.USERS] = [
  { key: 'username',  label: 'ชื่อผู้ใช้',      type: 'text' },
  { key: 'name',      label: 'ชื่อที่แสดง',     type: 'text' },
  { key: 'role',      label: 'บทบาท',          type: 'select', options: ROLES },
  { key: 'passHash',  label: 'รหัสผ่าน (เข้ารหัส)', type: 'text' },
  { key: 'passSalt',  label: 'ค่าสุ่มรหัสผ่าน',  type: 'text' },
  { key: 'status',    label: 'สถานะ',          type: 'select', options: ['ใช้งาน', 'ระงับ'] },
  { key: 'mustChange', label: 'ต้องเปลี่ยนรหัสผ่าน', type: 'bool' },
  { key: 'failCount', label: 'ใส่รหัสผิดติดกัน', type: 'number' },
  { key: 'lockUntil', label: 'ล็อกถึงเวลา',     type: 'text' },
  { key: 'lastLogin', label: 'เข้าใช้ล่าสุด',    type: 'text' },
  { key: 'note',      label: 'หมายเหตุ',       type: 'multiline' },
  { key: 'updatedAt', label: 'แก้ไขล่าสุด',     type: 'date' }
];

SCHEMA[SHEETS.SESSIONS] = [
  { key: 'token',     label: 'รหัสอ้างอิง',     type: 'text' },
  { key: 'username',  label: 'ชื่อผู้ใช้',      type: 'text' },
  { key: 'kind',      label: 'ประเภท',         type: 'select', options: ['เข้าใช้งาน', 'อุปกรณ์'] },
  { key: 'pinHash',   label: 'PIN (เข้ารหัส)',  type: 'text' },
  { key: 'pinSalt',   label: 'ค่าสุ่ม PIN',     type: 'text' },
  { key: 'failCount', label: 'ใส่ PIN ผิดติดกัน', type: 'number' },
  { key: 'device',    label: 'อุปกรณ์',        type: 'text' },
  { key: 'expiresAt', label: 'หมดอายุ',        type: 'text' },
  { key: 'createdAt', label: 'สร้างเมื่อ',      type: 'text' },
  { key: 'lastSeen',  label: 'ใช้งานล่าสุด',    type: 'text' }
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
var SCHEMA_VERSION = 4;

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
  { key: 'refresh_seconds', label: 'รีเฟรชข้อมูลอัตโนมัติทุก (วินาที)', value: '25', note: 'ใส่ 0 เพื่อปิด' },
  { key: 'share_link_enabled', label: 'เปิดลิงก์แชร์แบบไม่ต้องล็อกอิน', value: 'ปิด', note: 'เปิด = ใครมีลิงก์แชร์ก็ดูได้เลย · ปิด = ต้องล็อกอินทุกคน' },
  { key: 'session_hours',   label: 'อยู่ในระบบได้นาน (ชั่วโมง)', value: '12', note: 'ครบแล้วต้องล็อกอินหรือใส่ PIN ใหม่' },
  { key: 'device_days',     label: 'จำอุปกรณ์ที่ตั้ง PIN ไว้ (วัน)', value: '90', note: '' },
  { key: 'login_max_fail',  label: 'ใส่รหัสผิดได้กี่ครั้งก่อนล็อก', value: '5', note: '' },
  { key: 'login_lock_minutes', label: 'ล็อกนานกี่นาทีเมื่อผิดครบ', value: '15', note: '' },
  { key: 'ocr_enabled',     label: 'เปิดใช้การอ่านข้อความจากรูป', value: 'เปิด', note: 'แนบรูปแล้วระบบเดาข้อความ/ตัวเลขให้ แก้ไขเองได้เสมอ' },
  { key: 'ocr_language',    label: 'ภาษาที่ใช้อ่านข้อความจากรูป', value: 'th', note: 'th = ไทย · en = อังกฤษ' },
  { key: 'ocr_autofill',    label: 'เมื่ออ่านรูปเสร็จให้ทำอะไร', value: 'ถามก่อนเติม', note: 'ถามก่อนเติม = ปลอดภัยที่สุด · เติมให้เลย = เร็วที่สุด' },
  { key: 'theme',           label: 'ธีมสีหน้าจอ',              value: 'ตามเครื่อง', note: 'ตามเครื่อง = สลับสว่าง/มืดตามระบบของอุปกรณ์' },
  { key: 'accent',          label: 'สีเน้นของระบบ',            value: 'ฟ้าคราม', note: '' },
  { key: 'number_format',   label: 'รูปแบบตัวเลขเงิน',          value: '1,234.56', note: '' },
  { key: 'date_format',     label: 'รูปแบบปีที่แสดง',           value: 'พ.ศ. (2569)', note: 'มีผลกับการแสดงผลเท่านั้น ข้อมูลในชีตยังเก็บเป็น ค.ศ. เสมอ' },
  { key: 'start_page',      label: 'หน้าแรกเมื่อเปิดระบบ',       value: 'แดชบอร์ด', note: '' },
  { key: 'due_soon_days',   label: 'เตือนก่อนถึงกำหนดชำระ (วัน)', value: '5', note: '' },
  { key: 'notify_email',    label: 'อีเมลรับสรุปแจ้งเตือน',      value: '', note: 'เว้นว่าง = ส่งเข้าอีเมลเจ้าของชีต' },
  { key: 'notify_weekday',  label: 'ส่งสรุปทุกวัน',             value: 'จันทร์', note: '' },
  { key: 'currency',        label: 'สกุลเงิน',                 value: 'บาท', note: '' },
  { key: 'default_due_day', label: 'วันครบกำหนดชำระประจำเดือน',  value: '20', note: 'ใช้เป็นค่าตั้งต้นตอนเพิ่มก้อนหนี้ใหม่' },
  { key: 'late_fee',        label: 'ค่าปรับชำระล่าช้า (บาท)',    value: '0', note: 'ใส่ 0 ถ้าไม่มี' },
  { key: 'backup_hour',     label: 'สำรองข้อมูลอัตโนมัติตอนกี่โมง', value: '2', note: '0–23 · ค่าเริ่มต้นคือตีสอง' }
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

/**
 * คืนชีตตามชื่อ สร้างใหม่พร้อมหัวตารางถ้ายังไม่มี
 *
 * ⚠️ กฎเหล็ก: ถ้าชีตมีข้อมูลอยู่แล้วและหัวตารางไม่ตรงกับ SCHEMA
 * ห้ามเขียนหัวใหม่ทับเฉย ๆ เพราะข้อมูลจะยังอยู่ตำแหน่งเดิมแล้วเลื่อนคอลัมน์ทั้งแผง
 * ต้องย้ายข้อมูลตามชื่อหัวตารางเดิมก่อนเสมอ
 */
function ensureSheet_(name) {
  var ss = getSpreadsheet_();
  var sh = ss.getSheetByName(name);
  var cols = SCHEMA[name];
  if (!cols) throw new Error('ไม่พบ schema ของชีต: ' + name);
  if (!sh) sh = ss.insertSheet(name);

  var headers = cols.map(function (c) { return c.label; });
  var lastCol = sh.getLastColumn();
  var existing = lastCol > 0 ? sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
    return String(h == null ? '' : h).trim();
  }) : [];

  var matches = true;
  for (var i = 0; i < headers.length; i++) {
    if (existing[i] !== headers[i]) { matches = false; break; }
  }
  if (matches) return sh;

  var hasData = sh.getLastRow() > 1;
  var hasHeader = existing.filter(String).length > 0;

  if (hasData && hasHeader) {
    remapSheet_(sh, name, existing);   // ย้ายข้อมูลตามชื่อหัวตาราง แล้วค่อยเขียนหัวใหม่
    return sh;
  }

  writeHeaderRow_(sh, headers);
  return sh;
}

function writeHeaderRow_(sh, headers) {
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#1f2a44')
    .setFontColor('#ffffff')
    .setVerticalAlignment('middle');
  sh.setFrozenRows(1);
}

/**
 * ย้ายข้อมูลจากหัวตารางเดิมมาเรียงตาม SCHEMA ปัจจุบัน
 * คอลัมน์ที่เพิ่มใหม่จะว่าง คอลัมน์ที่ถูกตัดออกจะหายไป
 */
function remapSheet_(sh, name, existing) {
  var cols = SCHEMA[name];
  var lastRow = sh.getLastRow();
  var lastCol = Math.max(sh.getLastColumn(), cols.length);
  var values = lastRow > 1 ? sh.getRange(2, 1, lastRow - 1, existing.length).getValues() : [];

  var idx = {};
  existing.forEach(function (h, i) { if (h && !(h in idx)) idx[h] = i; });

  var matrix = [];
  values.forEach(function (row) {
    if (row.every(function (v) { return v === '' || v === null; })) return;
    matrix.push(cols.map(function (c) {
      var i = idx[c.label];
      return i === undefined ? '' : row[i];
    }));
  });

  sh.getRange(1, 1, lastRow, lastCol).clearContent();
  writeHeaderRow_(sh, cols.map(function (c) { return c.label; }));
  if (matrix.length) sh.getRange(2, 1, matrix.length, cols.length).setValues(matrix);
  console.log('remapSheet_: ย้ายคอลัมน์ชีต ' + name + ' จำนวน ' + matrix.length + ' แถว');
  return matrix.length;
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
    .addItem('🩺 ซ่อมข้อมูลที่คอลัมน์เลื่อน', 'REPAIR')
    .addSeparator()
    .addItem('🔐 ตั้งรหัสผ่านผู้ดูแลใหม่', 'resetAdminPassword')
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

  // ต้องย้ายข้อมูลก่อนที่ ensureSheet_ จะไปแตะหัวตาราง ไม่งั้นคอลัมน์จะเลื่อน
  runMigrations_();

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
  ensureFirstAdmin_();     // ต้องมีผู้ดูแลอย่างน้อยหนึ่งคนเสมอ ไม่งั้นไม่มีใครเข้าระบบได้
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
      '🔗 ลิงก์เข้าใช้งาน (ใช้ลิงก์นี้เป็นหลัก — ส่งให้ทุกคนได้)\n' + url + '\n' +
      '   เข้าด้วยชื่อผู้ใช้และรหัสผ่าน แล้วตั้ง PIN 6 หลักไว้ใช้ครั้งต่อไป\n\n' +
      '🆘 ลิงก์กู้ระบบ (ใช้ตอนลืมรหัสผ่านจนเข้าไม่ได้ — ห้ามส่งต่อ)\n' + url + '?key=' + admin + '\n\n' +
      '👀 ลิงก์ดูอย่างเดียวแบบไม่ต้องล็อกอิน\n' + url + '?key=' + view + '\n' +
      '   ใช้ได้ต่อเมื่อเปิดสวิตช์ "เปิดลิงก์แชร์แบบไม่ต้องล็อกอิน" ในหน้าตั้งค่า\n' +
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
    log.push('✅ เปิดระบบล็อกอิน · ตั้งค่า · อ่านข้อความจากรูป');

    try { installBackupTrigger(); log.push('✅ สำรองข้อมูลลง Drive อัตโนมัติ ทุกวันตี 2'); }
    catch (e) { log.push('⚠️ ตั้งสำรองอัตโนมัติไม่ได้: ' + e.message); }

    try { installWeeklyTrigger(); log.push('✅ แจ้งเตือนสรุปงานเข้าอีเมล ทุกวันจันทร์ 08:00'); }
    catch (e) { log.push('⚠️ ตั้งแจ้งเตือนอีเมลไม่ได้: ' + e.message); }
  } finally {
    QUIET_ = wasQuiet;
  }

  return alert_('The M Corner AP — ติดตั้งเรียบร้อย\n\n' + log.join('\n') + '\n\n' +
    firstAdminMessage_() + linksMessage_());
}

/**
 * รหัสผ่านของผู้ดูแลคนแรก — แสดงครั้งเดียวแล้วลบออกจากที่เก็บชั่วคราวทันที
 * ตัวรหัสผ่านจริงถูกเก็บแบบเข้ารหัสในชีต Users อ่านย้อนกลับไม่ได้
 * ถ้าพลาดไม่ได้จด ให้ใช้เมนู "ตั้งรหัสผ่านผู้ดูแลใหม่"
 */
function firstAdminMessage_() {
  var pw = props_().getProperty('FIRST_ADMIN_PASSWORD');
  if (!pw) return '';
  props_().deleteProperty('FIRST_ADMIN_PASSWORD');
  return '━━━━━━━━━━━━━━━━━━━━━━\n' +
    '👤 บัญชีผู้ดูแลคนแรก (จดไว้ก่อนปิดหน้าต่างนี้)\n\n' +
    '   ชื่อผู้ใช้  admin\n' +
    '   รหัสผ่าน  ' + pw + '\n\n' +
    'ระบบจะให้เปลี่ยนรหัสผ่านทันทีที่ล็อกอินครั้งแรก\n' +
    'ข้อความนี้แสดงครั้งเดียว — ถ้าพลาด ใช้เมนู 🔐 ตั้งรหัสผ่านผู้ดูแลใหม่\n' +
    '━━━━━━━━━━━━━━━━━━━━━━\n\n';
}

/**
 * ตั้งรหัสผ่านผู้ดูแลใหม่ เมื่อเข้าระบบไม่ได้จริง ๆ
 * เรียกจากเมนูในชีตเท่านั้น (คนเรียกต้องเปิดชีตได้อยู่แล้ว)
 */
function resetAdminPassword() {
  var u = findUser_('admin');
  if (!u) {
    var made = ensureFirstAdmin_();
    return alert_('สร้างบัญชี admin ใหม่แล้ว\n\nชื่อผู้ใช้  admin\nรหัสผ่าน  ' + made.password);
  }
  var pw = randomToken_(12);
  var salt = randomToken_(16);
  updateRow_(SHEETS.USERS, u._row, Object.assign({}, u, {
    passSalt: salt, passHash: hashSecret_(pw, salt),
    mustChange: true, status: 'ใช้งาน', failCount: 0, lockUntil: '', updatedAt: new Date()
  }));
  revokeAllSessions_('admin');
  logActivity_('ตั้งรหัสผ่านผู้ดูแลใหม่จากเมนูชีต', 'admin', '');
  return alert_('ตั้งรหัสผ่านใหม่ให้บัญชี admin แล้ว\n\n' +
    '   ชื่อผู้ใช้  admin\n   รหัสผ่าน  ' + pw + '\n\n' +
    'อุปกรณ์ที่เคยตั้ง PIN และหน้าที่ล็อกอินค้างไว้ ถูกให้ออกจากระบบทั้งหมดแล้ว\n' +
    'ระบบจะให้เปลี่ยนรหัสผ่านทันทีที่ล็อกอิน');
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
   Users.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * Users.gs — บัญชีผู้ใช้ รหัสผ่าน การเข้าใช้งาน และ PIN
 *
 * แนวคิด
 *   1. ล็อกอินด้วยชื่อผู้ใช้ + รหัสผ่าน → ได้ "รหัสอ้างอิงการเข้าใช้งาน" (session)
 *      เก็บไว้ในเครื่อง แล้วแนบไปกับทุกคำสั่ง
 *   2. ตั้ง PIN 6 หลักบนเครื่องที่ใช้ประจำได้ → ได้ "รหัสอุปกรณ์" (device token)
 *      คราวหน้าใส่แค่ PIN ก็เข้าได้ ไม่ต้องพิมพ์รหัสผ่านยาว ๆ
 *   3. PIN ใช้เดี่ยว ๆ ไม่ได้ ต้องคู่กับรหัสอุปกรณ์ที่อยู่ในเครื่องนั้นเท่านั้น
 *      ใส่ผิดครบโควตาเมื่อไหร่ รหัสอุปกรณ์ถูกยกเลิก ต้องกลับไปใช้รหัสผ่าน
 *
 * เรื่องที่ต้องรู้ตามตรง
 *   Apps Script ไม่มี bcrypt/argon2 ให้ใช้ จึงใช้ SHA-256 วนซ้ำหลายพันรอบ
 *   พร้อมค่าสุ่มประจำผู้ใช้ (salt) ซึ่งแข็งแรงพอสำหรับระบบภายในขนาดนี้
 *   แต่ไม่เท่า bcrypt — อย่าใช้รหัสผ่านซ้ำกับบัญชีสำคัญอื่น
 */

var HASH_ROUNDS = 2000;

/* ------------------------------------------------------------------ */
/*  การเข้ารหัส                                                        */
/* ------------------------------------------------------------------ */

function randomToken_(len) {
  var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  var out = '';
  for (var i = 0; i < (len || 32); i++) out += abc.charAt(Math.floor(Math.random() * abc.length));
  return out;
}

function sha256_(text) {
  return Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(text), Utilities.Charset.UTF_8));
}

/** SHA-256 วนซ้ำพร้อม salt — ใช้ทั้งกับรหัสผ่านและ PIN */
function hashSecret_(secret, salt, rounds) {
  rounds = rounds || HASH_ROUNDS;
  var out = String(salt) + '|' + String(secret);
  for (var i = 0; i < rounds; i++) out = sha256_(out + '|' + i);
  return out;
}

/** เทียบสองสตริงโดยใช้เวลาเท่ากันเสมอ ไม่ให้เดาได้จากเวลาที่ใช้ */
function safeEqual_(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ------------------------------------------------------------------ */
/*  ผู้ใช้                                                             */
/* ------------------------------------------------------------------ */

/** ค่าที่ถือว่า "ใช่" — dropdown ในหน้าเว็บส่งมาเป็นข้อความ ไม่ใช่ boolean */
function truthy_(v) {
  if (v === true) return true;
  var s = String(v == null ? '' : v).trim().toLowerCase();
  return s === 'true' || s === 'ใช่' || s === '1' || s === 'yes';
}

function normUsername_(u) {
  return String(u || '').trim().toLowerCase();
}

function findUser_(username) {
  var u = normUsername_(username);
  if (!u) return null;
  var rows = readRows_(SHEETS.USERS);
  for (var i = 0; i < rows.length; i++) {
    if (normUsername_(rows[i].username) === u) return rows[i];
  }
  return null;
}

function listUsers_() {
  return readRows_(SHEETS.USERS).map(function (u) {
    return {
      username: u.username, name: u.name, role: u.role, status: u.status,
      mustChange: truthy_(u.mustChange),
      lastLogin: u.lastLogin, note: u.note,
      locked: isLocked_(u),
      devices: countDevices_(u.username)
    };
  });
}

function isLocked_(user) {
  var until = String(user.lockUntil || '').trim();
  if (!until) return false;
  return new Date(until).getTime() > Date.now();
}

function countDevices_(username) {
  return readRows_(SHEETS.SESSIONS).filter(function (s) {
    return s.kind === 'อุปกรณ์' && normUsername_(s.username) === normUsername_(username) && !isExpired_(s);
  }).length;
}

/**
 * สร้าง/แก้ไขผู้ใช้ — ผู้ดูแลเท่านั้น
 * ใส่ password ว่างไว้ = ไม่เปลี่ยนรหัสผ่านเดิม
 */
function saveUser_(obj, actingRole) {
  if (actingRole !== 'ผู้ดูแล') throw new Error('เฉพาะผู้ดูแลเท่านั้นที่จัดการผู้ใช้ได้');

  var username = normUsername_(obj.username);
  if (!/^[a-z0-9_.-]{3,24}$/.test(username)) {
    throw new Error('ชื่อผู้ใช้ต้องเป็น a-z 0-9 _ . - ยาว 3–24 ตัว');
  }
  if (ROLES.indexOf(obj.role) < 0) throw new Error('บทบาทไม่ถูกต้อง');

  var existing = findUser_(username);
  var pwd = String(obj.password || '');
  if (!existing && pwd.length < 8) throw new Error('รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร');
  if (pwd && pwd.length < 8) throw new Error('รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร');

  var salt = existing ? existing.passSalt : randomToken_(16);
  var hash = existing ? existing.passHash : '';
  if (pwd) { salt = randomToken_(16); hash = hashSecret_(pwd, salt); }

  var rec = {
    username: username,
    name: obj.name || username,
    role: obj.role,
    passHash: hash, passSalt: salt,
    status: obj.status || 'ใช้งาน',
    mustChange: truthy_(obj.mustChange),
    failCount: 0, lockUntil: '',
    lastLogin: existing ? existing.lastLogin : '',
    note: obj.note || '',
    updatedAt: new Date()
  };

  if (existing) {
    // กันไม่ให้เหลือผู้ดูแลศูนย์คน
    if (existing.role === 'ผู้ดูแล' && rec.role !== 'ผู้ดูแล' && countAdmins_() <= 1) {
      throw new Error('ต้องเหลือผู้ดูแลอย่างน้อย 1 คน');
    }
    if (existing.role === 'ผู้ดูแล' && rec.status === 'ระงับ' && countAdmins_() <= 1) {
      throw new Error('ระงับผู้ดูแลคนสุดท้ายไม่ได้');
    }
    logActivity_('แก้ไขผู้ใช้', username, rec.role + (pwd ? ' · เปลี่ยนรหัสผ่าน' : ''));
    return sanitizeUser_(updateRow_(SHEETS.USERS, existing._row, Object.assign({}, existing, rec)));
  }
  logActivity_('เพิ่มผู้ใช้', username, rec.role);
  return sanitizeUser_(insertRow_(SHEETS.USERS, rec));
}

function countAdmins_() {
  return readRows_(SHEETS.USERS).filter(function (u) {
    return u.role === 'ผู้ดูแล' && u.status !== 'ระงับ';
  }).length;
}

function sanitizeUser_(u) {
  return { username: u.username, name: u.name, role: u.role, status: u.status };
}

function deleteUser_(username, actingRole, actingUsername) {
  if (actingRole !== 'ผู้ดูแล') throw new Error('เฉพาะผู้ดูแลเท่านั้นที่จัดการผู้ใช้ได้');
  var u = findUser_(username);
  if (!u) throw new Error('ไม่พบผู้ใช้: ' + username);
  if (normUsername_(username) === normUsername_(actingUsername)) throw new Error('ลบบัญชีตัวเองไม่ได้');
  if (u.role === 'ผู้ดูแล' && countAdmins_() <= 1) throw new Error('ต้องเหลือผู้ดูแลอย่างน้อย 1 คน');

  revokeAllSessions_(username);
  deleteRow_(SHEETS.USERS, u._row);
  logActivity_('ลบผู้ใช้', username, '');
  return true;
}

/* ------------------------------------------------------------------ */
/*  การเข้าใช้งาน                                                      */
/* ------------------------------------------------------------------ */

function isExpired_(s) {
  var e = String(s.expiresAt || '').trim();
  if (!e) return true;
  return new Date(e).getTime() <= Date.now();
}

function findSession_(token) {
  var t = String(token || '').trim();
  if (!t) return null;
  var rows = readRows_(SHEETS.SESSIONS);
  for (var i = 0; i < rows.length; i++) {
    if (safeEqual_(rows[i].token, t)) return rows[i];
  }
  return null;
}

function createSession_(username, kind, hours, extra) {
  var token = randomToken_(40);
  var rec = Object.assign({
    token: token, username: normUsername_(username), kind: kind,
    pinHash: '', pinSalt: '', failCount: 0, device: '',
    expiresAt: new Date(Date.now() + hours * 3600000).toISOString(),
    createdAt: new Date().toISOString(),
    lastSeen: new Date().toISOString()
  }, extra || {});
  insertRow_(SHEETS.SESSIONS, rec);
  return token;
}

function revokeSession_(token) {
  var s = findSession_(token);
  if (s) deleteRow_(SHEETS.SESSIONS, s._row);
  return true;
}

function revokeAllSessions_(username) {
  var u = normUsername_(username);
  var rows = readRows_(SHEETS.SESSIONS);
  for (var i = rows.length - 1; i >= 0; i--) {
    if (normUsername_(rows[i].username) === u) deleteRow_(SHEETS.SESSIONS, rows[i]._row);
  }
  return true;
}

/** ลบรายการที่หมดอายุทิ้ง ไม่ให้ชีตบวม */
function purgeSessions_() {
  var rows = readRows_(SHEETS.SESSIONS);
  var removed = 0;
  for (var i = rows.length - 1; i >= 0; i--) {
    if (isExpired_(rows[i])) { deleteRow_(SHEETS.SESSIONS, rows[i]._row); removed++; }
  }
  return removed;
}

/** ล็อกอินด้วยรหัสผ่าน */
function login_(username, password) {
  var u = findUser_(username);
  var fail = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
  if (!u) { hashSecret_('x', 'y', 50); throw new Error(fail); }   // หน่วงเท่ากันไม่ให้เดาว่ามีชื่อนี้ไหม
  if (u.status === 'ระงับ') throw new Error('บัญชีนี้ถูกระงับการใช้งาน');
  if (isLocked_(u)) {
    var mins = Math.ceil((new Date(u.lockUntil).getTime() - Date.now()) / 60000);
    throw new Error('ใส่รหัสผิดหลายครั้ง กรุณารออีก ' + mins + ' นาที');
  }

  if (!safeEqual_(hashSecret_(password, u.passSalt), u.passHash)) {
    var maxFail = Number(getSetting_('login_max_fail', 5)) || 5;
    var lockMin = Number(getSetting_('login_lock_minutes', 15)) || 15;
    var n = (toNumber_(u.failCount) || 0) + 1;
    var patch = { failCount: n };
    if (n >= maxFail) {
      patch.failCount = 0;
      patch.lockUntil = new Date(Date.now() + lockMin * 60000).toISOString();
    }
    updateRow_(SHEETS.USERS, u._row, Object.assign({}, u, patch));
    logActivity_('ล็อกอินไม่สำเร็จ', u.username, 'ครั้งที่ ' + n);
    throw new Error(fail);
  }

  purgeSessions_();
  var hours = Number(getSetting_('session_hours', 12)) || 12;
  var token = createSession_(u.username, 'เข้าใช้งาน', hours);
  updateRow_(SHEETS.USERS, u._row, Object.assign({}, u, {
    failCount: 0, lockUntil: '', lastLogin: new Date().toISOString()
  }));
  logActivity_('ล็อกอิน', u.username, u.role);

  return {
    session: token,
    user: { username: u.username, name: u.name, role: u.role },
    mustChange: truthy_(u.mustChange)
  };
}

/** เปลี่ยนรหัสผ่านของตัวเอง */
function changePassword_(username, oldPassword, newPassword) {
  var u = findUser_(username);
  if (!u) throw new Error('ไม่พบผู้ใช้');
  if (!safeEqual_(hashSecret_(oldPassword, u.passSalt), u.passHash)) {
    throw new Error('รหัสผ่านเดิมไม่ถูกต้อง');
  }
  if (String(newPassword || '').length < 8) throw new Error('รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร');

  var salt = randomToken_(16);
  updateRow_(SHEETS.USERS, u._row, Object.assign({}, u, {
    passSalt: salt, passHash: hashSecret_(newPassword, salt), mustChange: false, updatedAt: new Date()
  }));
  logActivity_('เปลี่ยนรหัสผ่าน', u.username, '');
  return true;
}

/* ------------------------------------------------------------------ */
/*  PIN ประจำอุปกรณ์                                                   */
/* ------------------------------------------------------------------ */

/** ตั้ง PIN บนอุปกรณ์นี้ — ต้องล็อกอินอยู่แล้ว */
function setPin_(sessionToken, pin, deviceName) {
  if (!/^\d{6}$/.test(String(pin || ''))) throw new Error('PIN ต้องเป็นตัวเลข 6 หลัก');
  if (/^(\d)\1{5}$/.test(pin) || pin === '123456' || pin === '654321') {
    throw new Error('PIN นี้เดาง่ายเกินไป กรุณาเลือกใหม่');
  }
  var s = findSession_(sessionToken);
  if (!s || isExpired_(s)) throw new Error('กรุณาล็อกอินใหม่ก่อนตั้ง PIN');

  var days = Number(getSetting_('device_days', 90)) || 90;
  var salt = randomToken_(16);
  var token = createSession_(s.username, 'อุปกรณ์', days * 24, {
    pinHash: hashSecret_(pin, salt), pinSalt: salt,
    device: String(deviceName || '').slice(0, 80)
  });
  logActivity_('ตั้ง PIN บนอุปกรณ์', s.username, deviceName || '');
  return { device: token };
}

/** ปลดล็อกด้วย PIN — ต้องมีรหัสอุปกรณ์คู่กันเสมอ */
function unlockWithPin_(deviceToken, pin) {
  var d = findSession_(deviceToken);
  if (!d || d.kind !== 'อุปกรณ์') throw new Error('อุปกรณ์นี้ยังไม่ได้ตั้ง PIN — กรุณาล็อกอินด้วยรหัสผ่าน');
  if (isExpired_(d)) { deleteRow_(SHEETS.SESSIONS, d._row); throw new Error('ครบกำหนดยืนยันตัวตนใหม่ — กรุณาล็อกอินด้วยรหัสผ่าน'); }

  var u = findUser_(d.username);
  if (!u || u.status === 'ระงับ') { deleteRow_(SHEETS.SESSIONS, d._row); throw new Error('บัญชีนี้ใช้งานไม่ได้แล้ว'); }

  if (!safeEqual_(hashSecret_(pin, d.pinSalt), d.pinHash)) {
    var n = (toNumber_(d.failCount) || 0) + 1;
    if (n >= 5) {
      deleteRow_(SHEETS.SESSIONS, d._row);
      logActivity_('PIN ผิดครบโควตา ยกเลิกอุปกรณ์', d.username, '');
      throw new Error('ใส่ PIN ผิด 5 ครั้ง ยกเลิก PIN บนเครื่องนี้แล้ว — กรุณาล็อกอินด้วยรหัสผ่าน');
    }
    updateRow_(SHEETS.SESSIONS, d._row, Object.assign({}, d, { failCount: n }));
    throw new Error('PIN ไม่ถูกต้อง เหลืออีก ' + (5 - n) + ' ครั้ง');
  }

  updateRow_(SHEETS.SESSIONS, d._row, Object.assign({}, d, {
    failCount: 0, lastSeen: new Date().toISOString()
  }));
  var hours = Number(getSetting_('session_hours', 12)) || 12;
  var token = createSession_(u.username, 'เข้าใช้งาน', hours);
  logActivity_('ปลดล็อกด้วย PIN', u.username, d.device || '');

  return { session: token, user: { username: u.username, name: u.name, role: u.role } };
}

/** รายชื่ออุปกรณ์ที่ตั้ง PIN ไว้ของผู้ใช้คนหนึ่ง (ไม่คืนค่า PIN ออกไป) */
function listDevices_(username) {
  var u = normUsername_(username);
  return readRows_(SHEETS.SESSIONS).filter(function (r) {
    return r.kind === 'อุปกรณ์' && normUsername_(r.username) === u && !isExpired_(r);
  }).map(function (r) {
    return {
      device: r.device || 'อุปกรณ์ไม่ระบุชื่อ',
      createdAt: r.createdAt,
      lastSeen: r.lastSeen,
      expiresAt: r.expiresAt
    };
  });
}

function forgetDevice_(deviceToken) {
  var d = findSession_(deviceToken);
  if (d) { deleteRow_(SHEETS.SESSIONS, d._row); logActivity_('ยกเลิก PIN บนอุปกรณ์', d.username, d.device || ''); }
  return true;
}

/** ยกเลิกอุปกรณ์ทั้งหมดของผู้ใช้ (เช่นทำเครื่องหาย) */
function forgetAllDevices_(username) {
  var u = normUsername_(username);
  var rows = readRows_(SHEETS.SESSIONS);
  var n = 0;
  for (var i = rows.length - 1; i >= 0; i--) {
    if (rows[i].kind === 'อุปกรณ์' && normUsername_(rows[i].username) === u) {
      deleteRow_(SHEETS.SESSIONS, rows[i]._row); n++;
    }
  }
  logActivity_('ยกเลิกอุปกรณ์ทั้งหมด', username, n + ' เครื่อง');
  return n;
}

/* ------------------------------------------------------------------ */
/*  ตรวจสิทธิ์จาก session                                              */
/* ------------------------------------------------------------------ */

/** คืนข้อมูลผู้ใช้จากรหัสอ้างอิง หรือ null ถ้าใช้ไม่ได้ */
function sessionUser_(token) {
  var s = findSession_(token);
  if (!s || s.kind !== 'เข้าใช้งาน' || isExpired_(s)) return null;
  var u = findUser_(s.username);
  if (!u || u.status === 'ระงับ') return null;
  return { username: u.username, name: u.name, role: u.role, _row: s._row };
}

/** สร้างผู้ดูแลคนแรกตอนติดตั้ง คืนรหัสผ่านที่สุ่มให้ (แสดงครั้งเดียว) */
function ensureFirstAdmin_() {
  if (readRows_(SHEETS.USERS).length) return null;
  var password = randomToken_(12);
  var salt = randomToken_(16);
  insertRow_(SHEETS.USERS, {
    username: 'admin', name: 'ผู้ดูแลระบบ', role: 'ผู้ดูแล',
    passHash: hashSecret_(password, salt), passSalt: salt,
    status: 'ใช้งาน', mustChange: true, failCount: 0, lockUntil: '',
    lastLogin: '', note: 'บัญชีแรกที่ระบบสร้างให้ตอนติดตั้ง', updatedAt: new Date()
  });
  // เก็บไว้ให้ START_HERE แสดงครั้งเดียวแล้วลบทิ้ง ไม่เขียนลงชีต
  props_().setProperty('FIRST_ADMIN_PASSWORD', password);
  logActivity_('สร้างผู้ดูแลคนแรก', 'admin', '');
  return { username: 'admin', password: password };
}


/* ══════════════════════════════════════════════════════════════
   Auth.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * Auth.gs — ใครเข้าได้ และทำอะไรได้บ้าง
 *
 * ทางเข้าระบบมี 3 ทาง เรียงตามลำดับที่ตรวจ
 *   1. บัญชีผู้ใช้  — ล็อกอินด้วยรหัสผ่านหรือ PIN แล้วได้รหัสอ้างอิง (แนะนำให้ใช้ทางนี้)
 *   2. ลิงก์แชร์    — เปิด/ปิดได้ในหน้าตั้งค่า ใครมีลิงก์ก็ดูได้อย่างเดียว ไม่ต้องล็อกอิน
 *   3. กุญแจกู้ระบบ — ลิงก์ ?key=<admin_token> เก็บไว้เผื่อลืมรหัสผ่านจนเข้าไม่ได้
 *
 * ⚠️ การกันสิทธิ์ทำที่ฝั่งเซิร์ฟเวอร์ในฟังก์ชัน api() ก่อนทำงานทุกครั้ง
 *    ไม่ใช่แค่ซ่อนปุ่มในหน้าเว็บ
 */

var ROLE = { ADMIN: 'ผู้ดูแล', EDITOR: 'แก้ไขได้', VIEWER: 'ดูอย่างเดียว', NONE: 'none' };

/** คำสั่งที่เปิดให้เรียกได้โดยยังไม่ได้ล็อกอิน */
var PUBLIC_ACTIONS = /^auth\.(login|unlock|me|ping)$/;

/**
 * คำสั่งที่เปลี่ยนแปลงข้อมูลหรือใช้พื้นที่ของเจ้าของ — ต้องเป็นผู้ดูแลหรือแก้ไขได้
 * รวม upload/trash ด้วย เพราะเป็นการเขียนและลบไฟล์ใน Google Drive ของเจ้าของ
 * และ ocr.read ที่สร้างไฟล์ชั่วคราวใน Drive ทุกครั้งที่เรียก
 */
var MUTATING_ACTIONS = /^ocr\.read$|\.(save|delete|savePayment|deletePayment|bulkBook|import|send|rotateToken|backupNow|upload|trash)$/;

/**
 * คำสั่งที่เฉพาะผู้ดูแลเท่านั้น
 * backup.* ทั้งหมดอยู่ในนี้เพราะไฟล์สำรองมีข้อมูลบัญชีผู้ใช้ติดไปด้วย
 */
var ADMIN_ONLY_ACTIONS = /^(user\.|share\.|settings\.save|backup\.|auth\.forgetAllDevices)/;

/** ระดับสิทธิ์ ยิ่งมากยิ่งทำได้เยอะ */
function roleRank_(role) {
  if (role === ROLE.ADMIN) return 3;
  if (role === ROLE.EDITOR) return 2;
  if (role === ROLE.VIEWER) return 1;
  return 0;
}

/**
 * หาว่าคำสั่งนี้ถูกเรียกโดยใคร
 * @return {{role:string, username:string, name:string, via:string}}
 */
function resolveActor_(payload) {
  payload = payload || {};

  var u = sessionUser_(payload._session);
  if (u) return { role: u.role, username: u.username, name: u.name, via: 'บัญชีผู้ใช้' };

  var key = String(payload._key || '').trim();
  if (key) {
    if (safeEqual_(key, getSetting_('admin_token', ''))) {
      return { role: ROLE.ADMIN, username: '', name: 'กุญแจกู้ระบบ', via: 'กุญแจกู้ระบบ' };
    }
    if (shareLinkEnabled_() && safeEqual_(key, getSetting_('view_token', ''))) {
      return { role: ROLE.VIEWER, username: '', name: 'ผู้ชมผ่านลิงก์แชร์', via: 'ลิงก์แชร์' };
    }
  }

  // เจ้าของชีตเข้าได้เสมอ เผื่อกรณีเข้าไม่ได้จริง ๆ
  var email = String(currentUserEmail_() || '').toLowerCase();
  if (email && email === String(ownerEmail_() || '').toLowerCase()) {
    return { role: ROLE.ADMIN, username: '', name: 'เจ้าของชีต', via: 'บัญชี Google เจ้าของชีต' };
  }

  return { role: ROLE.NONE, username: '', name: '', via: '' };
}

function shareLinkEnabled_() {
  return String(getSetting_('share_link_enabled', 'ปิด')).trim().indexOf('เปิด') === 0;
}

function requireRole_(action, payloadOrKey) {
  var payload = (payloadOrKey && typeof payloadOrKey === 'object') ? payloadOrKey : { _key: payloadOrKey };
  if (PUBLIC_ACTIONS.test(action)) return ROLE.NONE;

  var actor = resolveActor_(payload);
  if (actor.role === ROLE.NONE) throw new Error('กรุณาเข้าสู่ระบบก่อนใช้งาน');

  if (ADMIN_ONLY_ACTIONS.test(action) && actor.role !== ROLE.ADMIN) {
    throw new Error('เฉพาะผู้ดูแลเท่านั้นที่ทำรายการนี้ได้');
  }
  if (MUTATING_ACTIONS.test(action) && roleRank_(actor.role) < roleRank_(ROLE.EDITOR)) {
    throw new Error('บัญชีนี้เปิดดูได้อย่างเดียว จึงแก้ไขข้อมูลไม่ได้');
  }
  return actor.role;
}

/** ใช้ในหน้าเว็บ เพื่อรู้ว่ากำลังเปิดด้วยสิทธิ์อะไร */
function whoAmI(payload) {
  var actor = resolveActor_(payload && typeof payload === 'object' ? payload : { _key: payload });
  return {
    role: actor.role,
    canEdit: roleRank_(actor.role) >= roleRank_(ROLE.EDITOR),
    isAdmin: actor.role === ROLE.ADMIN,
    signedIn: actor.role !== ROLE.NONE,
    username: actor.username,
    name: actor.name || (actor.role === ROLE.NONE ? '' : actor.role),
    via: actor.via,
    label: actor.role === ROLE.NONE ? 'ยังไม่ได้เข้าสู่ระบบ' : actor.role
  };
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


/* ══════════════════════════════════════════════════════════════
   Settings.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * Settings.gs — หน้าตั้งค่าของระบบ
 *
 * ค่าทั้งหมดเก็บอยู่ในชีต Settings เหมือนเดิม ไฟล์นี้แค่จัดกลุ่มให้อ่านง่าย
 * บอกชนิดของช่องกรอก และกันไม่ให้ค่าที่ไม่ควรแก้ผ่านเว็บหลุดออกไป
 *
 * ⚠️ ค่าที่เป็นความลับ (รหัสเข้าตึก / กุญแจต่าง ๆ) ไม่ส่งออกไปหน้าเว็บ
 *    และแก้ได้ในชีตเท่านั้น
 */

/** ค่าที่ห้ามอ่านและห้ามเขียนผ่านหน้าเว็บเด็ดขาด */
var SECRET_SETTINGS = ['door_code', 'admin_code', 'admin_token', 'view_token'];

/**
 * ผังหน้าตั้งค่า — เรียงตามลำดับที่อยากให้เห็น
 * type: text | number | select | multiline
 */
var SETTINGS_FORM = [
  {
    group: 'ข้อมูลหอพัก', icon: '🏢',
    items: [
      { key: 'building_name', type: 'text' },
      { key: 'building_address', type: 'multiline' },
      { key: 'total_rooms', type: 'number', readOnly: true, note: 'นับจากทะเบียนห้องอัตโนมัติ' }
    ]
  },
  {
    group: 'หน้าตาและการแสดงผล', icon: '🎨',
    items: [
      { key: 'theme', type: 'select', options: ['ตามเครื่อง', 'สว่าง', 'มืด'] },
      { key: 'accent', type: 'select', options: ['ฟ้าคราม', 'เขียวมรกต', 'ม่วง', 'ส้มอิฐ'] },
      { key: 'number_format', type: 'select', options: ['1,234.56', '1,234'] },
      { key: 'date_format', type: 'select', options: ['พ.ศ. (2569)', 'ค.ศ. (2026)'] },
      { key: 'start_page', type: 'select', options: ['แดชบอร์ด', 'รายการสรุปรวม', 'หนี้สิน', 'รายการซื้อของ', 'ซ่อมแซมตามห้อง'] },
      { key: 'refresh_seconds', type: 'number' }
    ]
  },
  {
    group: 'การแจ้งเตือน', icon: '🔔',
    items: [
      { key: 'ac_cycle_months', type: 'number' },
      { key: 'warranty_alert_days', type: 'number' },
      { key: 'overdue_alert_days', type: 'number' },
      { key: 'due_soon_days', type: 'number' },
      { key: 'notify_email', type: 'text' },
      { key: 'notify_weekday', type: 'select', options: ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'] }
    ]
  },
  {
    group: 'การเงิน', icon: '💰',
    items: [
      { key: 'currency', type: 'text' },
      { key: 'default_due_day', type: 'number' },
      { key: 'late_fee', type: 'number' }
    ]
  },
  {
    group: 'ความปลอดภัยและการเข้าใช้งาน', icon: '🔐',
    items: [
      { key: 'share_link_enabled', type: 'select', options: ['ปิด', 'เปิด'] },
      { key: 'session_hours', type: 'number' },
      { key: 'device_days', type: 'number' },
      { key: 'login_max_fail', type: 'number' },
      { key: 'login_lock_minutes', type: 'number' }
    ]
  },
  {
    group: 'อ่านข้อความจากรูป (OCR)', icon: '🔎',
    items: [
      { key: 'ocr_enabled', type: 'select', options: ['เปิด', 'ปิด'] },
      { key: 'ocr_language', type: 'select', options: ['th', 'en'] },
      { key: 'ocr_autofill', type: 'select', options: ['ถามก่อนเติม', 'เติมให้เลย', 'ไม่เติม'] }
    ]
  },
  {
    group: 'สำรองข้อมูล', icon: '💾',
    items: [
      { key: 'backup_keep', type: 'number' },
      { key: 'backup_hour', type: 'number', note: '0–23 นาฬิกา' }
    ]
  }
];

/** ป้ายชื่อของแต่ละคีย์ เอามาจาก DEFAULT_SETTINGS เพื่อไม่ให้เขียนซ้ำสองที่ */
function settingMeta_(key) {
  for (var i = 0; i < DEFAULT_SETTINGS.length; i++) {
    if (DEFAULT_SETTINGS[i].key === key) return DEFAULT_SETTINGS[i];
  }
  return { key: key, label: key, value: '', note: '' };
}

/** คีย์ทั้งหมดที่หน้าตั้งค่าแก้ได้ (ไม่รวมช่องอ่านอย่างเดียวและค่าลับ) */
function editableSettingKeys_() {
  var out = {};
  SETTINGS_FORM.forEach(function (g) {
    g.items.forEach(function (it) {
      if (!it.readOnly && SECRET_SETTINGS.indexOf(it.key) < 0) out[it.key] = it;
    });
  });
  return out;
}

/** ส่งผังหน้าตั้งค่าพร้อมค่าปัจจุบันให้หน้าเว็บ */
function listSettings_(role) {
  var current = {};
  readRows_(SHEETS.SETTINGS).forEach(function (r) {
    if (SECRET_SETTINGS.indexOf(String(r.key)) < 0) current[String(r.key)] = String(r.value || '');
  });

  var groups = SETTINGS_FORM.map(function (g) {
    return {
      group: g.group,
      icon: g.icon,
      items: g.items.map(function (it) {
        var meta = settingMeta_(it.key);
        return {
          key: it.key,
          label: meta.label,
          note: it.note || meta.note || '',
          type: it.type,
          options: it.options || null,
          readOnly: !!it.readOnly,
          value: current[it.key] !== undefined ? current[it.key] : String(meta.value || '')
        };
      })
    };
  });

  return {
    groups: groups,
    canEdit: role === ROLE.ADMIN,
    // เตือนไว้ให้เห็นในหน้าเว็บ ว่าค่าลับอยู่ในชีตนะ ไม่ได้หายไปไหน
    secretNote: 'รหัสเข้าตึกและกุญแจลิงก์ไม่แสดงที่นี่เพื่อความปลอดภัย — แก้ได้ในชีต Settings โดยตรง'
  };
}

/** บันทึกค่าจากหน้าตั้งค่า — รับเฉพาะคีย์ที่อยู่ในผังเท่านั้น */
function saveSettings_(values) {
  values = values || {};
  var allowed = editableSettingKeys_();
  var changed = [];

  Object.keys(values).forEach(function (k) {
    var spec = allowed[k];
    if (!spec) return;                       // คีย์แปลกปลอมหรือค่าลับ — ข้ามเงียบ ๆ

    var v = String(values[k] === null || values[k] === undefined ? '' : values[k]).trim();

    if (spec.type === 'number') {
      var n = toNumber_(v);
      if (n === null) throw new Error(settingMeta_(k).label + ': ต้องเป็นตัวเลข');
      v = String(n);
    }
    if (spec.type === 'select' && spec.options && spec.options.indexOf(v) < 0) {
      throw new Error(settingMeta_(k).label + ': ค่าที่เลือกไม่ถูกต้อง');
    }
    if (v.length > 500) throw new Error(settingMeta_(k).label + ': ข้อความยาวเกินไป');

    if (String(getSetting_(k, '')) !== v) {
      setSetting_(k, v);
      changed.push(settingMeta_(k).label);
    }
  });

  if (changed.length) logActivity_('แก้ไขการตั้งค่า', changed.join(', '), '');
  return { saved: changed.length, changed: changed };
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
   Ocr.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * Ocr.gs — อ่านข้อความจากรูปที่แนบเข้ามา แล้วเดาค่าลงฟอร์มให้
 *
 * วิธีทำงาน: ส่งรูปเข้า Google Drive แบบสั่งให้แปลงเป็นเอกสาร (convert=true)
 * พร้อมเปิดโหมดอ่านตัวอักษร (ocr=true) — เป็นตัวอ่านตัวเดียวกับที่ Google Docs ใช้
 * อ่านข้อความออกมาแล้วลบไฟล์ชั่วคราวทิ้งทันที
 *
 * ⚠️ ค่าที่ได้เป็นแค่ "ข้อเสนอ" หน้าเว็บต้องให้ผู้ใช้ตรวจและแก้ได้เสมอ
 *    ตัวอ่านพลาดได้ โดยเฉพาะลายมือและรูปเอียง
 */

var OCR_ENDPOINT = 'https://www.googleapis.com/upload/drive/v2/files';

/**
 * @param {{dataUrl:string, fileId:string, mimeType:string, context:string}} p
 * @return {{text:string, lines:string[], guess:Object, engine:string}}
 */
function ocrRead_(p) {
  p = p || {};
  if (String(getSetting_('ocr_enabled', 'เปิด')).indexOf('เปิด') !== 0) {
    throw new Error('การอ่านข้อความจากรูปถูกปิดอยู่ — เปิดได้ในหน้าตั้งค่า');
  }

  var blob = ocrBlob_(p);
  if (!blob) throw new Error('ไม่พบรูปที่จะอ่าน');

  var mime = blob.getContentType() || '';
  if (!/^image\/|pdf$/.test(mime)) {
    throw new Error('อ่านได้เฉพาะไฟล์รูปภาพหรือ PDF เท่านั้น');
  }

  var text = ocrExtractText_(blob);
  var lines = ocrLines_(text);
  return {
    text: text,
    lines: lines,
    guess: ocrGuess_(lines, String(p.context || '')),
    engine: 'Google Drive OCR'
  };
}

/** หารูปจาก dataUrl ที่หน้าเว็บส่งมา หรือจากไฟล์ที่อัปโหลดไปแล้ว */
function ocrBlob_(p) {
  if (p.dataUrl) {
    var raw = String(p.dataUrl);
    var base64 = raw.indexOf(',') >= 0 ? raw.split(',')[1] : raw;
    var mime = p.mimeType || (raw.match(/^data:([^;,]+)/) || [])[1] || 'image/jpeg';
    return Utilities.newBlob(Utilities.base64Decode(base64), mime, 'ocr-temp');
  }
  if (p.fileId) {
    var id = extractDriveId_(p.fileId) || p.fileId;
    return DriveApp.getFileById(id).getBlob();
  }
  return null;
}

/**
 * เรียก Drive REST v2 ตรง ๆ ด้วย UrlFetchApp
 * ทำแบบนี้เพื่อไม่ต้องเปิดบริการเสริม Drive API ในหน้า Apps Script ให้ยุ่งยาก
 */
function ocrExtractText_(blob) {
  var lang = String(getSetting_('ocr_language', 'th') || 'th').slice(0, 5);
  var token = ScriptApp.getOAuthToken();
  var url = OCR_ENDPOINT + '?uploadType=media&convert=true&ocr=true&ocrLanguage=' +
            encodeURIComponent(lang);

  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: blob.getContentType(),
    payload: blob.getBytes(),
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });

  if (res.getResponseCode() >= 300) {
    throw new Error('อ่านรูปไม่สำเร็จ (' + res.getResponseCode() + ') — ลองใหม่อีกครั้ง');
  }

  var meta = JSON.parse(res.getContentText());
  var tempId = meta.id;
  try {
    var exportUrl = (meta.exportLinks && meta.exportLinks['text/plain']) ||
      'https://www.googleapis.com/drive/v2/files/' + tempId + '/export?mimeType=text/plain';
    var txt = UrlFetchApp.fetch(exportUrl, {
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });
    return txt.getResponseCode() < 300 ? txt.getContentText() : '';
  } finally {
    // ลบไฟล์ชั่วคราวเสมอ ไม่ให้ Drive รก แม้ขั้นตอนก่อนหน้าจะพัง
    try { DriveApp.getFileById(tempId).setTrashed(true); } catch (e) { /* ลบไม่ได้ก็ปล่อย */ }
  }
}

/* ------------------------------------------------------------------ */
/*  แปลงข้อความดิบเป็นค่าที่กรอกฟอร์มได้                                */
/* ------------------------------------------------------------------ */

function ocrLines_(text) {
  return String(text || '')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(function (l) { return l.replace(/\s+/g, ' ').trim(); })
    .filter(function (l) { return l.length > 0; });
}

/** เลขไทย ๐-๙ → 0-9 */
function thaiDigits_(s) {
  return String(s || '').replace(/[๐-๙]/g, function (c) {
    return String('๐๑๒๓๔๕๖๗๘๙'.indexOf(c));
  });
}

var TH_MONTHS = {
  'ม.ค': 1, 'มกราคม': 1, 'ก.พ': 2, 'กุมภาพันธ์': 2, 'มี.ค': 3, 'มีนาคม': 3,
  'เม.ย': 4, 'เมษายน': 4, 'พ.ค': 5, 'พฤษภาคม': 5, 'มิ.ย': 6, 'มิถุนายน': 6,
  'ก.ค': 7, 'กรกฎาคม': 7, 'ส.ค': 8, 'สิงหาคม': 8, 'ก.ย': 9, 'กันยายน': 9,
  'ต.ค': 10, 'ตุลาคม': 10, 'พ.ย': 11, 'พฤศจิกายน': 11, 'ธ.ค': 12, 'ธันวาคม': 12
};

/** คำที่มักอยู่ข้างหน้ายอดเงินจริง ๆ ในสลิป/ใบเสร็จ */
var AMOUNT_HINTS = /(จำนวนเงิน|ยอดเงิน|ยอดรวม|รวมทั้งสิ้น|รวมเงิน|รวม|สุทธิ|ราคา|total|amount|grand\s*total|net)/i;

/** คำที่บอกว่าเลขบรรทัดนั้นไม่ใช่ยอดเงิน */
var AMOUNT_SKIP = /(เลขที่|อ้างอิง|ref|no\.|บัญชี|โทร|tel|รหัส|barcode|เวลา|time|vat|ภาษี)/i;

/** ดึงตัวเลขเงินทั้งหมดในบรรทัด */
function ocrAmountsIn_(line) {
  var s = thaiDigits_(line);
  var out = [];
  var re = /(?:^|[^\d.,])(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+\.\d{2}|\d{3,})(?![\d.,]*%)/g;
  var m;
  while ((m = re.exec(s)) !== null) {
    var n = Number(m[1].replace(/,/g, ''));
    if (isFinite(n) && n > 0) out.push(n);
  }
  return out;
}

/** เดาวันที่จากข้อความ คืนรูปแบบ YYYY-MM-DD */
function ocrGuessDate_(lines) {
  var joined = thaiDigits_(lines.join(' \n '));

  // 1 ก.ย. 2569  /  1 กันยายน 2569
  var keys = Object.keys(TH_MONTHS).sort(function (a, b) { return b.length - a.length; });
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i].replace(/\./g, '\\.');
    var re = new RegExp('(\\d{1,2})\\s*' + key + '\\.?\\s*(\\d{2,4})');
    var m = joined.match(re);
    if (m) {
      var y = ocrNormYear_(Number(m[2]));
      return ocrIso_(y, TH_MONTHS[keys[i]], Number(m[1]));
    }
  }

  // 2026-09-01 — ต้องเช็คก่อนแบบ วัน/เดือน/ปี ไม่งั้น 2026-03-10 จะถูกอ่านเป็น 26-03-10
  var m3 = joined.match(/(?:^|[^\d])(\d{4})-(\d{1,2})-(\d{1,2})(?![\d])/);
  if (m3) return ocrIso_(Number(m3[1]), Number(m3[2]), Number(m3[3]));

  // 01/09/2569 · 01-09-2026 · 1.9.26
  var m2 = joined.match(/(?:^|[^\d])(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})(?![\d])/);
  if (m2) {
    var d = Number(m2[1]), mo = Number(m2[2]);
    if (mo > 12 && d <= 12) { var t = d; d = mo; mo = t; }   // เผื่อสลิปฝรั่งเขียน MM/DD
    if (d <= 31 && mo <= 12) return ocrIso_(ocrNormYear_(Number(m2[3])), mo, d);
  }

  return '';
}

/** พ.ศ. → ค.ศ. และปีสองหลัก → สี่หลัก */
function ocrNormYear_(y) {
  if (y > 2400) return y - 543;          // 2569 = พ.ศ. เต็ม → 2026
  if (y >= 1000) return y;               // 2026 = ค.ศ. อยู่แล้ว
  if (y >= 60) return 2500 + y - 543;    // 69 = พ.ศ. สองหลัก → 2026
  return 2000 + y;                       // 26 = ค.ศ. สองหลัก → 2026
}

function ocrIso_(y, m, d) {
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return '';
  return y + '-' + ('0' + m).slice(-2) + '-' + ('0' + d).slice(-2);
}

/** เดายอดเงิน — เอาบรรทัดที่มีคำใบ้ก่อน ถ้าไม่มีค่อยเอาเลขที่มากที่สุด */
function ocrGuessAmount_(lines) {
  var hinted = [];
  var all = [];

  lines.forEach(function (line) {
    if (AMOUNT_SKIP.test(line)) return;
    var nums = ocrAmountsIn_(line);
    if (!nums.length) return;
    all = all.concat(nums);
    if (AMOUNT_HINTS.test(line)) hinted = hinted.concat(nums);
  });

  var pick = hinted.length ? hinted : all;
  if (!pick.length) return null;

  // ยอดรวมมักเป็นตัวใหญ่สุดในกลุ่มที่เข้าข่าย
  return pick.reduce(function (a, b) { return b > a ? b : a; }, 0) || null;
}

/** เดาชื่อร้าน/ผู้ขาย — บรรทัดแรกที่เป็นตัวอักษรจริง ไม่ใช่เลขล้วน */
function ocrGuessVendor_(lines) {
  for (var i = 0; i < Math.min(lines.length, 6); i++) {
    var l = lines[i];
    if (l.length < 3 || l.length > 60) continue;
    if (/^[\d\s\-.,:/]+$/.test(thaiDigits_(l))) continue;
    if (/(ใบเสร็จ|ใบกำกับ|receipt|invoice|tax)/i.test(l)) continue;
    return l;
  }
  return '';
}

/** บรรทัดนี้เป็นวันที่ล้วน ๆ หรือเปล่า — จะได้ไม่นับเป็นรายการสินค้า */
function ocrLooksLikeDate_(s) {
  return /^\D{0,12}\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\D{0,12}$/.test(s);
}

/**
 * เดาชื่อรายการ — ใบเสร็จมักเขียน "ชื่อของ ... ราคา" โดยราคาอยู่ท้ายบรรทัด
 * จึงตัดเฉพาะตัวเลขท้ายบรรทัดออก ที่เหลือคือชื่อของ
 * (ตัดตัวเลขทุกตัวไม่ได้ เพราะ "ปั๊มน้ำ 750W" จะเหลือแค่ "ปั๊มน้ำ W")
 */
function ocrGuessItems_(lines) {
  var items = [];
  lines.forEach(function (line) {
    if (AMOUNT_SKIP.test(line) || AMOUNT_HINTS.test(line)) return;
    var s = thaiDigits_(line);
    if (ocrLooksLikeDate_(s)) return;

    var m = s.match(/(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+\.\d{2}|\d{3,})\s*(?:บาท|฿|THB)?\s*$/i);
    if (!m) return;

    var price = Number(m[1].replace(/,/g, ''));
    var name = s.slice(0, m.index)
      // ตัด "x2" ที่บอกจำนวนทิ้ง แต่ต้องไม่ไปกิน "2x1.5" ที่เป็นสเปกของสินค้า
      .replace(/(^|[^\d])[x×@]\s*\d{1,3}\s*$/i, '$1')
      .replace(/[\s:.\-]+$/, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (name.length >= 2 && name.length <= 60 && price > 0) {
      items.push({ name: name, price: price });
    }
  });
  return items.slice(0, 20);
}

/** เดาเลขที่อ้างอิง (สลิปโอนเงินมักมี) */
function ocrGuessRef_(lines) {
  for (var i = 0; i < lines.length; i++) {
    var m = thaiDigits_(lines[i]).match(/(?:เลขที่รายการ|เลขที่อ้างอิง|อ้างอิง|ref(?:erence)?(?:\s*no)?)[:\s.]*([A-Za-z0-9]{6,30})/i);
    if (m) return m[1];
  }
  return '';
}

/**
 * รวมทุกอย่างเป็นชุดค่าที่เอาไปเติมฟอร์มได้
 * @param {string} context ชื่อฟอร์มที่กำลังเปิดอยู่ เช่น 'purchase' | 'payment' | 'repair'
 */
function ocrGuess_(lines, context) {
  var amount = ocrGuessAmount_(lines);
  var date = ocrGuessDate_(lines);
  var vendor = ocrGuessVendor_(lines);
  var items = ocrGuessItems_(lines);
  var ref = ocrGuessRef_(lines);

  var g = {
    amount: amount,
    date: date,
    vendor: vendor,
    ref: ref,
    items: items,
    // ชื่อรายการที่แนะนำ — เอารายการที่แพงที่สุด ถ้าไม่มีก็ใช้ชื่อร้าน
    title: items.length
      ? items.reduce(function (a, b) { return b.price > a.price ? b : a; }).name
      : vendor
  };

  // แต่ละฟอร์มใช้ชื่อช่องไม่เหมือนกัน จับคู่ให้ตรงตั้งแต่ที่นี่
  if (context === 'payment') {
    g.fields = { payDate: date, principal: amount, note: ref ? 'อ้างอิง ' + ref : '' };
  } else if (context === 'purchase') {
    g.fields = { buyDate: date, item: g.title, price: amount, vendor: vendor };
  } else if (context === 'repair' || context === 'building' || context === 'ac') {
    g.fields = { doneDate: date, detail: g.title, cost: amount, vendor: vendor };
  } else {
    g.fields = { date: date, detail: g.title, amount: amount, vendor: vendor };
  }
  return g;
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
  if (from < 4) done.push(migrateV4Users_());

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

/**
 * เขียนทั้งชีตใหม่ตามลำดับคอลัมน์ปัจจุบันของ SCHEMA
 * เข้าถึงชีตตรง ๆ ไม่ผ่าน ensureSheet_ เพราะตอนนี้กำลังย้ายข้อมูลอยู่
 * ถ้าเรียก ensureSheet_ จะไปกระตุ้นการย้ายซ้อนกันเอง
 */
function rewriteSheet_(name, objects) {
  var ss = getSpreadsheet_();
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  var cols = SCHEMA[name];

  var lastRow = sh.getLastRow();
  var lastCol = Math.max(sh.getLastColumn(), cols.length);
  if (lastRow > 0) sh.getRange(1, 1, lastRow, lastCol).clearContent();

  writeHeaderRow_(sh, cols.map(function (c) { return c.label; }));
  if (objects.length) {
    var matrix = objects.map(function (o) {
      return cols.map(function (c) { return serializeValue_(o[c.key], c.type); });
    });
    sh.getRange(2, 1, matrix.length, cols.length).setValues(matrix);
  }
  return objects.length;
}

/* ================================================================== */
/*  REPAIR — กู้ข้อมูลที่คอลัมน์เลื่อน                                   */
/* ================================================================== */

/**
 * แก้อาการ "ยอดกลายเป็น 0 และข้อมูลเลื่อนคอลัมน์"
 *
 * สาเหตุ: โค้ดรุ่นก่อนเขียนหัวตารางใหม่ทับ "ก่อน" ที่ตัวย้ายข้อมูลจะได้อ่าน
 * ตัวย้ายจึงอ่านชื่อหัวใหม่ไปเทียบกับข้อมูลตำแหน่งเก่า ทุกคอลัมน์เลยเลื่อนไป 1 ช่อง
 *
 * ตัวนี้จะ
 *   1. สำรองสภาพปัจจุบันลง Drive ก่อนแตะอะไรทั้งสิ้น
 *   2. เลื่อนคอลัมน์กลับที่เดิม
 *   3. กู้ค่าที่หายระหว่างทาง (เงินต้น/ดอกเบี้ย และช่องทาง) จากข้อมูลตั้งต้น
 *   4. ตรวจยอดแล้วรายงานผล
 *
 * รันซ้ำได้ ถ้าไม่มีอะไรเสียจะไม่แตะข้อมูล
 */
function REPAIR() {
  var report = [];
  var backup = null;
  try { backup = backupToDrive_(); } catch (e) { report.push('⚠️ สำรองข้อมูลก่อนซ่อมไม่สำเร็จ: ' + e.message); }
  if (backup) report.push('💾 สำรองสภาพปัจจุบันไว้แล้ว: ' + backup.name);

  report.push(repairDebtsSheet_());
  report.push(repairPaymentsSheet_());

  props_().setProperty('SCHEMA_VERSION', String(SCHEMA_VERSION));

  var main = debtSummary_(LEDGER_MAIN, 'all');
  var sub = debtSummary_(LEDGER_SUB, 'all');
  report.push('');
  report.push('ตรวจยอดหลังซ่อม');
  report.push('  ยอดหนี้หลัก   ' + fmtMoney_(main.totalDebt) + (Math.round(main.totalDebt) === 13151000 ? '  ✅' : '  ⚠️ ควรเป็น 13,151,000'));
  report.push('  ชำระแล้ว      ' + fmtMoney_(main.paid) + (Math.round(main.paid) === 5049654 ? '  ✅' : '  ⚠️ ควรเป็น 5,049,654'));
  report.push('  ยอดหนี้รอง    ' + fmtMoney_(sub.totalDebt) + (Math.round(sub.totalDebt) === 1000000 ? '  ✅' : '  ⚠️ ควรเป็น 1,000,000'));
  report.push('  ดอกเบี้ยที่จ่าย ' + fmtMoney_(sub.interestPaid));

  logActivity_('ซ่อมข้อมูลที่คอลัมน์เลื่อน', '', report.join(' | '));
  return alert_('ซ่อมข้อมูลเรียบร้อย\n\n' + report.join('\n'));
}

/**
 * ชีตก้อนหนี้: ค่าทุกช่องเลื่อนไป 1 ตำแหน่งตั้งแต่คอลัมน์ "เป็นส่วนหนึ่งของ"
 *
 * ต้องอ่านค่าดิบจากชีตตรง ๆ ไม่ผ่าน readRows_ เพราะ readRows_ จะแปลงชนิดข้อมูล
 * ตาม SCHEMA เช่นบังคับช่องเงินให้เป็นตัวเลข ข้อความอย่าง "กำลังผ่อน"
 * ที่บังเอิญไปตกอยู่ในช่องเงินจะถูกทิ้งกลายเป็นค่าว่างตั้งแต่ตอนอ่าน
 */
function repairDebtsSheet_() {
  var name = SHEETS.DEBTS;
  var raw = readByHeader_(name);
  if (!raw || !raw.rows.length) return 'ก้อนหนี้: ไม่มีข้อมูล ข้ามไป';

  var ids = {};
  raw.rows.forEach(function (r) { ids[String(r['รหัส'])] = true; });
  var shifted = raw.rows.some(function (r) {
    var p = String(r['เป็นส่วนหนึ่งของ'] || '').trim();
    return p && !ids[p];          // ค่าที่ไม่ใช่รหัสก้อนหนี้ = ค่าที่เลื่อนมา
  });
  if (!shifted) return 'ก้อนหนี้: ปกติดี ไม่ต้องซ่อม';

  var fixed = raw.rows.map(function (r) {
    return {
      id: r['รหัส'], ledger: r['ประเภทบัญชี'], title: r['รายการหนี้'],
      parentId: '',
      creditor: r['เป็นส่วนหนึ่งของ'],
      startDate: r['เจ้าหนี้'],
      principal: sheetSerialToNumber_(r['วันที่ก่อหนี้']),
      interestPerMonth: r['ยอดหนี้ตั้งต้น'],
      dueDay: r['ดอกเบี้ย/เดือน'],
      planPerMonth: r['กำหนดชำระ (วันที่)'],
      status: r['ยอดผ่อนต่อเดือน'],
      note: r['สถานะ'],
      updatedAt: r['หมายเหตุ']
    };
  });

  // ผูกเงินยืมป้าตาเข้ากับหนี้ซื้อที่ดินอีกครั้ง
  var land = null, pata = null;
  fixed.forEach(function (d) {
    var t = String(d.title || '');
    if (!land && t.indexOf('ซื้อที่ดิน') >= 0) land = d;
    if (!pata && t.indexOf('ป้าตา') >= 0) pata = d;
  });
  if (land && pata && land !== pata) pata.parentId = land.id;

  rewriteSheet_(name, fixed);
  applyFormatting_(name);
  return 'ก้อนหนี้: เลื่อนคอลัมน์กลับที่เดิม ' + fixed.length + ' รายการ';
}

/**
 * ยอดตั้งต้นถูกจับใส่ช่องวันที่ Google Sheets เลยเก็บเป็นวันที่ไปแล้ว
 * แปลงกลับเป็นตัวเลขด้วยหลักเลขลำดับวันของ Sheets (นับจาก 30 ธ.ค. 1899)
 */
function sheetSerialToNumber_(v) {
  var n = toNumber_(v);
  if (n !== null) return n;
  var d = toDate_(v);
  if (!d) return null;
  var days = Math.round((d.getTime() - Date.UTC(1899, 11, 30)) / 86400000);
  return days > 0 ? days : null;
}

/** ชีตรายการชำระ: ช่องทาง/ผู้ชำระ/สลิป/หมายเหตุ เลื่อนไป 1 ตำแหน่ง (อ่านค่าดิบเช่นกัน) */
function repairPaymentsSheet_() {
  var name = SHEETS.DEBT_PAYMENTS;
  var raw = readByHeader_(name);
  if (!raw || !raw.rows.length) return 'รายการชำระ: ไม่มีข้อมูล ข้ามไป';

  // สัญญาณของการเลื่อน: ช่องหมายเหตุกลายเป็นวันที่ และช่องแก้ไขล่าสุดว่าง
  var suspicious = raw.rows.filter(function (r) {
    return !String(r['แก้ไขล่าสุด'] || '').trim() && !!toDate_(r['หมายเหตุ']);
  }).length;
  if (suspicious < Math.ceil(raw.rows.length / 2)) return 'รายการชำระ: ปกติดี ไม่ต้องซ่อม';

  // ข้อมูลตั้งต้นไว้เทียบว่ารายการไหนเป็นดอกเบี้ย และช่องทางเดิมคืออะไร
  var interestKey = {}, principalKey = {};
  SEED_INTEREST_PAYMENTS.forEach(function (p) { interestKey[p.payDate + '|' + p.amount] = true; });
  SEED_DEBT_PAYMENTS.forEach(function (p) { principalKey[p.payDate + '|' + p.amount] = true; });

  var toInterest = 0;
  var fixed = raw.rows.map(function (r) {
    var amount = toNumber_(r['เงินต้น']) || 0;
    var key = toIsoDate_(r['วันที่ชำระ']) + '|' + amount;
    var isInterest = !!interestKey[key];
    if (isInterest) toInterest++;

    return {
      id: r['รหัส'], debtId: r['รหัสหนี้'], ledger: r['ประเภทบัญชี'],
      payDate: r['วันที่ชำระ'], year: r['ปี (ค.ศ.)'], installment: r['งวดที่'],
      principal: isInterest ? 0 : amount,
      interest: isInterest ? amount : (toNumber_(r['ดอกเบี้ย']) || 0),
      amount: amount,
      channel: isInterest ? 'โอน QR' : (principalKey[key] ? 'โอนธนาคาร' : ''),
      payer: r['ช่องทาง'],
      slips: r['ผู้ชำระ'],
      note: r['สลิปการโอน'],
      updatedAt: r['หมายเหตุ']
    };
  });

  rewriteSheet_(name, fixed);
  applyFormatting_(name);
  return 'รายการชำระ: เลื่อนคอลัมน์กลับที่เดิม ' + fixed.length + ' รายการ · กู้เป็นดอกเบี้ย ' + toInterest + ' รายการ';
}

/**
 * รุ่น 4 — เพิ่มระบบบัญชีผู้ใช้
 *
 * สร้างชีต Users กับ Sessions ถ้ายังไม่มี แล้วตั้งผู้ดูแลคนแรกให้
 * ไม่แตะข้อมูลเดิมเลย เป็นการเพิ่มชีตใหม่ล้วน ๆ
 */
function migrateV4Users_() {
  ensureSheet_(SHEETS.USERS);
  ensureSheet_(SHEETS.SESSIONS);
  seedSettings_();                       // เติมค่าตั้งค่าใหม่ที่เพิ่มมาพร้อมรุ่นนี้
  // บัญชีผู้ดูแลคนแรกสร้างใน setupSystem() ไม่ใช่ที่นี่
  // เพราะต้องมีให้ครบทุกครั้งที่ติดตั้ง ไม่ใช่เฉพาะตอนย้ายรุ่น
  return 'สร้างชีตผู้ใช้และชีตการเข้าใช้งาน';
}


/* ══════════════════════════════════════════════════════════════
   Backup.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * Backup.gs — สำรองและกู้คืนข้อมูลทั้งระบบ
 * ใช้ย้ายข้อมูลระหว่างเวอร์ชันเว็บกับ Google Sheet ได้สองทาง
 */

/**
 * ชีตที่ห้ามอยู่ในไฟล์สำรองเด็ดขาด
 *
 * Sessions เก็บ "รหัสอ้างอิงที่ใช้งานได้จริง" ของทุกคนที่ล็อกอินค้างไว้
 * ใครได้ไฟล์นี้ไปก็สวมสิทธิ์คนนั้นได้ทันที และเป็นข้อมูลชั่วคราวที่ไม่ต้องกู้คืนอยู่แล้ว
 * (รหัสผ่านในชีต Users เก็บแบบเข้ารหัส จึงสำรองได้ แต่ไฟล์สำรองเปิดให้เฉพาะผู้ดูแล)
 */
var EXPORT_SKIP_SHEETS = [SHEETS.SESSIONS];

function exportable_(name) {
  return EXPORT_SKIP_SHEETS.indexOf(name) < 0;
}

/** ส่งออกทุกชีตเป็นก้อน JSON เดียว — เฉพาะผู้ดูแล (ดู ADMIN_ONLY_ACTIONS) */
function exportAll_() {
  var out = { app: APP.NAME, version: APP.VERSION, exportedAt: nowStamp_(), sheets: {} };
  Object.keys(SHEETS).forEach(function (k) {
    var name = SHEETS[k];
    if (!exportable_(name)) return;
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
  if (!exportable_(sheetName)) throw new Error('ชีตนี้ส่งออกไม่ได้เพราะมีข้อมูลการเข้าใช้งานอยู่');
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
    if (!exportable_(name)) return;      // ไม่ยอมให้ยัดรหัสอ้างอิงปลอมเข้ามาทางไฟล์สำรอง
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
    var role = requireRole_(action, payload);
    var fn = API_ROUTES[action];
    if (!fn) throw new Error('ไม่รู้จักคำสั่ง: ' + action);
    return { ok: true, data: fn(payload, role) };
  } catch (e) {
    console.error(action + ' -> ' + e);
    return {
      ok: false,
      error: String(e && e.message ? e.message : e),
      // หน้าเว็บใช้ธงนี้เด้งกลับไปหน้าล็อกอินแทนที่จะขึ้นข้อความเฉย ๆ
      needLogin: /เข้าสู่ระบบก่อน/.test(String(e && e.message ? e.message : e))
    };
  }
}

var API_ROUTES = {

  /* ---------- ระบบ ---------- */
  'app.bootstrap': function (p, role) {
    return {
      app: { name: APP.NAME, subtitle: APP.SUBTITLE, version: APP.VERSION },
      user: whoAmI(p),
      canEdit: roleRank_(role) >= roleRank_(ROLE.EDITOR),
      isAdmin: role === ROLE.ADMIN,
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
        refreshSeconds: Number(getSetting_('refresh_seconds', 25)),
        theme: getSetting_('theme', 'ตามเครื่อง'),
        startPage: getSetting_('start_page', 'แดชบอร์ด'),
        currency: getSetting_('currency', 'บาท'),
        defaultDueDay: Number(getSetting_('default_due_day', 20)),
        ocrEnabled: String(getSetting_('ocr_enabled', 'เปิด')).indexOf('เปิด') === 0,
        ocrAutofill: getSetting_('ocr_autofill', 'ถามก่อนเติม'),
        shareLinkEnabled: shareLinkEnabled_()
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
    if (role !== ROLE.ADMIN) return { base: '', appUrl: '', adminUrl: '', viewUrl: '', shareEnabled: false };
    var base = webAppUrl_();
    return {
      base: base,
      appUrl: base,
      adminUrl: base ? base + '?key=' + getSetting_('admin_token', '') : '',
      viewUrl: base ? base + '?key=' + getSetting_('view_token', '') : '',
      shareEnabled: shareLinkEnabled_()
    };
  },
  'share.rotateToken': function () { return rotateViewToken_(); },

  /* ---------- สำรองข้อมูลลง Drive ---------- */
  'backup.backupNow': function () { return backupToDrive_(); },
  'backup.history': function (p, role) { return role === ROLE.ADMIN ? listBackups_() : []; },

  /* ---------- เข้าสู่ระบบ ---------- */

  // เปิดให้เรียกได้ก่อนล็อกอิน (ดู PUBLIC_ACTIONS ใน Auth.gs)
  'auth.ping': function () { return { ok: true, app: APP.NAME }; },
  'auth.me': function (p) { return whoAmI(p); },
  'auth.login': function (p) { return login_(p.username, p.password); },
  'auth.unlock': function (p) { return unlockWithPin_(p.device, p.pin); },

  // ต้องล็อกอินอยู่แล้ว
  'auth.logout': function (p) { return revokeSession_(p._session); },
  'auth.setPin': function (p) { return setPin_(p._session, p.pin, p.device); },
  'auth.forgetDevice': function (p) { return forgetDevice_(p.device); },
  'auth.forgetAllDevices': function (p) { return forgetAllDevices_(p.username || actorUsername_(p)); },
  'auth.changePassword': function (p) {
    var me = actorUsername_(p);
    if (!me) throw new Error('บัญชีนี้เข้าผ่านลิงก์ จึงไม่มีรหัสผ่านให้เปลี่ยน');
    return changePassword_(me, p.oldPassword, p.newPassword);
  },
  'auth.devices': function (p) {
    var me = actorUsername_(p);
    return me ? listDevices_(me) : [];
  },

  /* ---------- จัดการผู้ใช้ (ผู้ดูแลเท่านั้น) ---------- */
  'user.list': function () { return listUsers_(); },
  'user.save': function (p, role) { return saveUser_(p.record, role); },
  'user.delete': function (p, role) { return deleteUser_(p.username, role, actorUsername_(p)); },
  'user.resetPin': function (p) { return forgetAllDevices_(p.username); },
  'user.signOutAll': function (p) { return revokeAllSessions_(p.username); },

  /* ---------- ตั้งค่า ---------- */
  'settings.list': function (p, role) { return listSettings_(role); },
  'settings.save': function (p) { return saveSettings_(p.values); },

  /* ---------- อ่านข้อความจากรูป ---------- */
  'ocr.read': function (p) { return ocrRead_(p); }
};

/** ชื่อผู้ใช้ของคนที่กำลังเรียก (ว่างถ้าเข้าผ่านลิงก์) */
function actorUsername_(payload) {
  return resolveActor_(payload).username || '';
}

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

  // อัปเดตโค้ดแล้วเปิดเว็บเลยโดยไม่ได้รัน START_HERE ก็ต้องย้ายคอลัมน์ให้ทัน
  // ไม่งั้นโค้ดใหม่จะอ่านชีตโครงเก่าแล้วข้อมูลเลื่อนคอลัมน์
  // (ถ้าย้ายไปแล้วจะเป็นแค่การอ่านค่า property หนึ่งครั้ง ไม่หน่วง)
  runMigrations_();

  rememberExecUrl_();   // ตอนนี้โค้ดทำงานอยู่ใน /exec จริง จึงจดที่อยู่ไว้ใช้ตอนแสดงลิงก์

  // หน้าเว็บเปิดได้เสมอ แต่จะเห็นแค่หน้าล็อกอินจนกว่าจะยืนยันตัวตนผ่าน
  // ตัวกันสิทธิ์จริงอยู่ในฟังก์ชัน api() ฝั่งเซิร์ฟเวอร์ ไม่ได้อยู่ที่หน้านี้
  var actor = resolveActor_({ _key: key });

  var t = HtmlService.createTemplate(indexHtml_());
  t.appName = APP.NAME;
  t.subtitle = APP.SUBTITLE;
  t.version = APP.VERSION;
  t.accessKey = key;          // กรองแล้ว ปลอดภัยที่จะฝังลงหน้าโดยตรง
  t.role = actor.role;
  t.theme = safeTheme_(getSetting_('theme', 'ตามเครื่อง'));

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

/** ธีมที่ฝังลงหน้าได้อย่างปลอดภัย (ค่าอื่นถือว่าตามเครื่อง) */
function safeTheme_(v) {
  var s = String(v || '').trim();
  return (s === 'สว่าง' || s === 'มืด') ? s : 'ตามเครื่อง';
}

/** หน้าที่แสดงเมื่อระบบยังติดตั้งไม่เสร็จ หรือเปิดลิงก์ผิด */
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
  'MCwwLDAsLjQ1KTt6LWluZGV4OjU1fQogIC5tb2RhbC1ie21heC1oZWlnaHQ6bm9uZX0KICAub3Z7cGFkZGluZzowfQogIC5tb2RhbHtib3JkZXItcmFkaXVzOjA7bWluLWhlaWdodDoxMDB2aDttYXgtd2lkdGg6bm9uZX0KfQovKiA9PT09PT09PT09PT0g4Lir4LiZ',
  '4LmJ4Liy4Lil4LmH4Lit4LiB4Lit4Li04LiZIC8gUElOID09PT09PT09PT09PSAqLwpib2R5LmxvY2tlZHtvdmVyZmxvdzpoaWRkZW59CmJvZHkubG9ja2VkIC5hcHB7ZmlsdGVyOmJsdXIoM3B4KTtwb2ludGVyLWV2ZW50czpub25lO3VzZXItc2VsZWN0Om5vbmV9',
  'Ci5hdXRoLXdyYXB7CiAgcG9zaXRpb246Zml4ZWQ7aW5zZXQ6MDt6LWluZGV4OjYwO2Rpc3BsYXk6Z3JpZDtwbGFjZS1pdGVtczpjZW50ZXI7CiAgcGFkZGluZzoyNHB4O2JhY2tncm91bmQ6dmFyKC0tYmcpO292ZXJmbG93LXk6YXV0bzsKfQouYXV0aC1jYXJkewog',
  'IHdpZHRoOjEwMCU7bWF4LXdpZHRoOjM2MHB4O2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTsKICBib3JkZXItcmFkaXVzOjE2cHg7Ym94LXNoYWRvdzp2YXIoLS1zaC1sZyk7cGFkZGluZzoyNnB4IDI0cHggMjJw',
  'eDsKfQouYXV0aC1icmFuZHtmb250LXNpemU6MTVweDtjb2xvcjp2YXIoLS1tdXRlZCk7bWFyZ2luLWJvdHRvbToxOHB4O3RleHQtYWxpZ246Y2VudGVyfQouYXV0aC1icmFuZCBie2NvbG9yOnZhcigtLWluayk7Zm9udC1mYW1pbHk6dmFyKC0tZm9udC1kaXNwbGF5',
  'KX0KLmF1dGgtaHttYXJnaW46MCAwIDRweDtmb250LXNpemU6MjBweDtmb250LXdlaWdodDo2MDA7Zm9udC1mYW1pbHk6dmFyKC0tZm9udC1kaXNwbGF5KTt0ZXh0LWFsaWduOmNlbnRlcn0KLmF1dGgtc3Vie21hcmdpbjowIDAgMThweDtmb250LXNpemU6MTNweDtj',
  'b2xvcjp2YXIoLS1tdXRlZCk7dGV4dC1hbGlnbjpjZW50ZXI7bGluZS1oZWlnaHQ6MS42fQouYXV0aC1me21hcmdpbi1ib3R0b206MTNweH0KLmF1dGgtZiBsYWJlbHtkaXNwbGF5OmJsb2NrO2ZvbnQtc2l6ZToxMi41cHg7Y29sb3I6dmFyKC0taW5rLTIpO21hcmdp',
  'bi1ib3R0b206NXB4O2ZvbnQtd2VpZ2h0OjUwMH0KLmF1dGgtZiAuaW5we3dpZHRoOjEwMCU7cGFkZGluZzoxMHB4IDEycHg7Zm9udC1zaXplOjE1cHh9Ci5hdXRoLWdve3dpZHRoOjEwMCU7anVzdGlmeS1jb250ZW50OmNlbnRlcjtwYWRkaW5nOjExcHg7Zm9udC1z',
  'aXplOjE0LjVweDttYXJnaW4tdG9wOjZweH0KLmF1dGgtYWx0e3dpZHRoOjEwMCU7anVzdGlmeS1jb250ZW50OmNlbnRlcjttYXJnaW4tdG9wOjlweDtmb250LXNpemU6MTNweH0KLmF1dGgtZXJyewogIGJhY2tncm91bmQ6dmFyKC0tZGFuZ2VyLXNvZnQpO2NvbG9y',
  'OnZhcigtLWRhbmdlcik7Ym9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTsKICBwYWRkaW5nOjlweCAxMnB4O2ZvbnQtc2l6ZToxMi41cHg7bWFyZ2luLWJvdHRvbToxNHB4O2xpbmUtaGVpZ2h0OjEuNTU7Cn0KLmF1dGgtZm9vdHtmb250LXNpemU6MTEuNXB4O2NvbG9y',
  'OnZhcigtLWZhaW50KTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW46MTZweCAwIDA7bGluZS1oZWlnaHQ6MS42fQoKLyog4LiI4Li44LiUIDYg4LiI4Li44LiU4LmB4LiX4LiZIFBJTiDguJfguLXguYjguIHguJTguYTguJvguYHguKXguYnguKcgKi8KLnBpbi1kb3Rz',
  'e2Rpc3BsYXk6ZmxleDtnYXA6MTNweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO21hcmdpbjo2cHggMCAyMnB4fQoucGluLWRvdHMgaXsKICB3aWR0aDoxM3B4O2hlaWdodDoxM3B4O2JvcmRlci1yYWRpdXM6OTlweDtiYWNrZ3JvdW5kOnZhcigtLWxpbmUpOwogIGJv',
  'cmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7dHJhbnNpdGlvbjp0cmFuc2Zvcm0gLjEycyxiYWNrZ3JvdW5kIC4xMnM7Cn0KLnBpbi1kb3RzIGkub257YmFja2dyb3VuZDp2YXIoLS1icmFuZCk7Ym9yZGVyLWNvbG9yOnZhcigtLWJyYW5kKTt0cmFuc2Zvcm06c2Nh',
  'bGUoMS4xNil9Ci5waW4tZG90cy5idXN5e29wYWNpdHk6LjV9Ci5waW4tZG90cy5zaGFrZXthbmltYXRpb246c2hha2UgLjQyc30KQGtleWZyYW1lcyBzaGFrZXsKICAwJSwxMDAle3RyYW5zZm9ybTp0cmFuc2xhdGVYKDApfSAyMCV7dHJhbnNmb3JtOnRyYW5zbGF0',
  'ZVgoLThweCl9CiAgNDAle3RyYW5zZm9ybTp0cmFuc2xhdGVYKDhweCl9IDYwJXt0cmFuc2Zvcm06dHJhbnNsYXRlWCgtNXB4KX0gODAle3RyYW5zZm9ybTp0cmFuc2xhdGVYKDVweCl9Cn0KLnBpbi1wYWR7ZGlzcGxheTpncmlkO2dyaWQtdGVtcGxhdGUtY29sdW1u',
  'czpyZXBlYXQoMywxZnIpO2dhcDoxMXB4fQoucGluLWt7CiAgYXNwZWN0LXJhdGlvOjEvMTtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKTtjb2xvcjp2YXIoLS1pbmspOwogIGJvcmRlci1yYWRpdXM6MTRweDtm',
  'b250LXNpemU6MjFweDtmb250LXdlaWdodDo1MDA7Y3Vyc29yOnBvaW50ZXI7CiAgZm9udC1mYW1pbHk6dmFyKC0tZm9udC1kaXNwbGF5KTtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7CiAgdHJhbnNpdGlvbjpiYWNrZ3JvdW5kIC4xcyx0cmFuc2Zv',
  'cm0gLjA2czsKfQoucGluLWs6aG92ZXJ7YmFja2dyb3VuZDp2YXIoLS1icmFuZC1zb2Z0KTtib3JkZXItY29sb3I6dmFyKC0tYnJhbmQpfQoucGluLWs6YWN0aXZle3RyYW5zZm9ybTpzY2FsZSguOTQpfQoucGluLWsuZ2hvc3R7YmFja2dyb3VuZDp0cmFuc3BhcmVu',
  'dDtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Zm9udC1zaXplOjE3cHg7Y29sb3I6dmFyKC0tbXV0ZWQpfQoucGluLWsuZ2hvc3Q6aG92ZXJ7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpO2JvcmRlci1jb2xvcjp2YXIoLS1saW5lKX0KCi8qID09PT09PT09PT09',
  'PSDguJXguLHguKfguYDguKXguLfguK3guIHguJjguLXguKEgPT09PT09PT09PT09ICovCi50aGVtZS1waWNre2Rpc3BsYXk6Z3JpZDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDMsbWlubWF4KDAsMWZyKSk7Z2FwOjEwcHh9Ci50aGVtZS1vcHR7CiAgZGlz',
  'cGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjRweDt0ZXh0LWFsaWduOmNlbnRlcjsKICBwYWRkaW5nOjE1cHggMTBweDtib3JkZXI6MS41cHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czp2YXIoLS1y',
  'KTsKICBiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Y3Vyc29yOnBvaW50ZXI7Y29sb3I6dmFyKC0taW5rKTtmb250OmluaGVyaXQ7CiAgdHJhbnNpdGlvbjpib3JkZXItY29sb3IgLjEycyxiYWNrZ3JvdW5kIC4xMnM7Cn0KLnRoZW1lLW9wdDpob3Zlcntib3Jk',
  'ZXItY29sb3I6dmFyKC0tYnJhbmQpfQoudGhlbWUtb3B0Lm9ue2JvcmRlci1jb2xvcjp2YXIoLS1icmFuZCk7YmFja2dyb3VuZDp2YXIoLS1icmFuZC1zb2Z0KX0KLnRoZW1lLW9wdCAuaWN7Zm9udC1zaXplOjI0cHg7bGluZS1oZWlnaHQ6MS4yfQoudGhlbWUtb3B0',
  'IGJ7Zm9udC1zaXplOjEzLjVweH0KLnRoZW1lLW9wdCAuaGludHtmb250LXNpemU6MTFweDtjb2xvcjp2YXIoLS1tdXRlZCk7bGluZS1oZWlnaHQ6MS40NX0KLndhcm4tdGV4dHtjb2xvcjp2YXIoLS13YXJuKX0KCi8qID09PT09PT09PT09PSDguJzguKXguIHguLLg',
  'uKPguK3guYjguLLguJnguILguYnguK3guITguKfguLLguKHguIjguLLguIHguKPguLnguJsgPT09PT09PT09PT09ICovCi8qIOC5hOC4ruC5hOC4peC4leC5jOC4quC4seC5ieC4mSDguYYg4LmD4Lir4LmJ4LmA4Lir4LmH4LiZ4Lin4LmI4Liy4LiK4LmI4Lit4LiH',
  '4LmE4Lir4LiZ4LmA4Lie4Li04LmI4LiH4LiW4Li54LiB4LmA4LiV4Li04Lih4LiI4Liy4LiB4Lij4Li54LibICovCi5vY3ItZmlsbGVkewogIGJvcmRlci1jb2xvcjp2YXIoLS1icmFuZCkhaW1wb3J0YW50OwogIGJveC1zaGFkb3c6MCAwIDAgM3B4IHZhcigtLWJy',
  'YW5kLXNvZnQpIWltcG9ydGFudDsKICBhbmltYXRpb246b2NyUG9wIC40czsKfQpAa2V5ZnJhbWVzIG9jclBvcHsgMCV7YmFja2dyb3VuZDp2YXIoLS1icmFuZC1zb2Z0KX0gMTAwJXtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpfSB9Cgoub2NyLWJveHsKICBib3Jk',
  'ZXI6MXB4IGRhc2hlZCB2YXIoLS1icmFuZCk7YmFja2dyb3VuZDp2YXIoLS1icmFuZC1zb2Z0KTsKICBib3JkZXItcmFkaXVzOnZhcigtLXItc20pO3BhZGRpbmc6MTJweDttYXJnaW4tdG9wOjEwcHg7Cn0KLm9jci1ib3ggLmhke2Rpc3BsYXk6ZmxleDthbGlnbi1p',
  'dGVtczpjZW50ZXI7Z2FwOjdweDtmb250LXNpemU6MTIuNXB4O2ZvbnQtd2VpZ2h0OjYwMDtjb2xvcjp2YXIoLS1icmFuZCk7bWFyZ2luLWJvdHRvbTo5cHh9Ci5vY3ItYm94IC5oZCAuc3B7bWFyZ2luLWxlZnQ6YXV0bztkaXNwbGF5OmZsZXg7Z2FwOjZweH0KLm9j',
  'ci1oaXRze2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47Z2FwOjZweH0KLm9jci1oaXR7CiAgZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6OXB4O2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7CiAgYm9yZGVyOjFweCBzb2xpZCB2',
  'YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXItc20pO3BhZGRpbmc6N3B4IDEwcHg7Zm9udC1zaXplOjEzcHg7Cn0KLm9jci1oaXQgLmt7Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtc2l6ZToxMS41cHg7bWluLXdpZHRoOjc4cHh9Ci5vY3ItaGl0IC52e2Zv',
  'bnQtd2VpZ2h0OjYwMDtmbGV4OjE7bWluLXdpZHRoOjA7b3ZlcmZsb3c6aGlkZGVuO3RleHQtb3ZlcmZsb3c6ZWxsaXBzaXM7d2hpdGUtc3BhY2U6bm93cmFwfQoub2NyLXJhd3sKICBtYXgtaGVpZ2h0OjE1MHB4O292ZXJmbG93OmF1dG87YmFja2dyb3VuZDp2YXIo',
  'LS1zdXJmYWNlKTtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpOwogIGJvcmRlci1yYWRpdXM6dmFyKC0tci1zbSk7cGFkZGluZzo5cHggMTFweDtmb250LXNpemU6MTJweDtsaW5lLWhlaWdodDoxLjY1OwogIHdoaXRlLXNwYWNlOnByZS13cmFwO2NvbG9yOnZh',
  'cigtLWluay0yKTttYXJnaW4tdG9wOjlweDsKfQoKQG1lZGlhIChtYXgtd2lkdGg6NTIwcHgpewogIC5hdXRoLWNhcmR7bWF4LXdpZHRoOjEwMCU7cGFkZGluZzoyMnB4IDE4cHggMThweH0KICAudGhlbWUtcGlja3tncmlkLXRlbXBsYXRlLWNvbHVtbnM6MWZyfQog',
  'IC50aGVtZS1vcHR7ZmxleC1kaXJlY3Rpb246cm93O3RleHQtYWxpZ246bGVmdDtnYXA6MTFweH0KICAudGhlbWUtb3B0IC5oaW50e2Rpc3BsYXk6bm9uZX0KfQoKQG1lZGlhIHByaW50ewogIC5uYXYsLnRvcC1yaWdodCwuYnVyZ2VyLC50LWFjdGlvbnMsLmJ0bntk',
  'aXNwbGF5Om5vbmUhaW1wb3J0YW50fQogIC5hcHB7ZGlzcGxheTpibG9ja30gYm9keXtiYWNrZ3JvdW5kOiNmZmZ9CiAgLmNhcmR7YnJlYWstaW5zaWRlOmF2b2lkO2JveC1zaGFkb3c6bm9uZX0KfQo8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5PgoKPGRpdiBjbGFzcz0i',
  'YXBwIj4KICA8IS0tID09PT09PT09PT09PT09PT09IHNpZGViYXIgPT09PT09PT09PT09PT09PT0gLS0+CiAgPGFzaWRlIGNsYXNzPSJuYXYiIGlkPSJuYXYiPgogICAgPGRpdiBjbGFzcz0iYnJhbmQiPgogICAgICA8Yj7wn4+iIDw/PSBhcHBOYW1lID8+PC9iPgog',
  'ICAgICA8c3Bhbj48Pz0gc3VidGl0bGUgPz4gwrcgdjw/PSB2ZXJzaW9uID8+PC9zcGFuPgogICAgPC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJuYXYtbGlzdCIgaWQ9Im5hdkxpc3QiPjwvZGl2PgogICAgPGRpdiBjbGFzcz0ibmF2LWZvb3QiIGlkPSJuYXZGb290Ij7g',
  'uIHguLPguKXguLHguIfguYLguKvguKXguJTigKY8L2Rpdj4KICA8L2FzaWRlPgoKICA8IS0tID09PT09PT09PT09PT09PT09IG1haW4gPT09PT09PT09PT09PT09PT0gLS0+CiAgPGRpdiBjbGFzcz0ibWFpbiI+CiAgICA8aGVhZGVyIGNsYXNzPSJ0b3AiPgogICAg',
  'ICA8YnV0dG9uIGNsYXNzPSJidXJnZXIiIG9uY2xpY2s9InRvZ2dsZU5hdigpIj7imLA8L2J1dHRvbj4KICAgICAgPGRpdj4KICAgICAgICA8aDEgaWQ9InBhZ2VUaXRsZSI+4Lig4Liy4Lie4Lij4Lin4LihPC9oMT4KICAgICAgICA8ZGl2IGNsYXNzPSJzdWIiIGlk',
  'PSJwYWdlU3ViIj7guYHguJTguIrguJrguK3guKPguYzguJTguKPguKfguKHguJfguLjguIHguKrguYjguKfguJnguILguK3guIfguKvguK3guJ7guLHguIE8L2Rpdj4KICAgICAgPC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9InRvcC1yaWdodCI+CiAgICAgICAgPHNw',
  'YW4gaWQ9ImxpdmVEb3QiPjwvc3Bhbj4KICAgICAgICA8YnV0dG9uIGNsYXNzPSJidG4gaWNvbiIgaWQ9InRoZW1lQnRuIiB0aXRsZT0i4Liq4Lil4Lix4Lia4LiY4Li14LihIiBvbmNsaWNrPSJjeWNsZVRoZW1lKCkiPvCfjJc8L2J1dHRvbj4KICAgICAgICA8aW5w',
  'dXQgY2xhc3M9ImlucCB3LWF1dG8iIGlkPSJzZWFyY2hCb3giIHBsYWNlaG9sZGVyPSLwn5SOIOC4hOC5ieC4meC4q+C4suC4l+C4seC5ieC4h+C4o+C4sOC4muC4muKApiIgc3R5bGU9IndpZHRoOjE4MHB4IgogICAgICAgICAgICAgICBvbmlucHV0PSJvblNlYXJj',
  'aCh0aGlzLnZhbHVlKSIgYXV0b2NvbXBsZXRlPSJvZmYiPgogICAgICAgIDxzZWxlY3QgY2xhc3M9InNlbCB3LWF1dG8iIGlkPSJ5ZWFyU2VsIiBvbmNoYW5nZT0ic2V0WWVhcih0aGlzLnZhbHVlKSI+PC9zZWxlY3Q+CiAgICAgICAgPGJ1dHRvbiBjbGFzcz0iYnRu',
  'IGljb24iIHRpdGxlPSLguKPguLXguYDguJ/guKPguIoiIG9uY2xpY2s9InJlZnJlc2goKSI+4oa7PC9idXR0b24+CiAgICAgIDwvZGl2PgogICAgPC9oZWFkZXI+CiAgICA8bWFpbiBjbGFzcz0iY29udGVudCIgaWQ9InZpZXciPgogICAgICA8ZGl2IGNsYXNzPSJl',
  'bXB0eSI+PGRpdiBjbGFzcz0iYmlnIj48c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPjwvZGl2PuC4geC4s+C4peC4seC4h+C5gOC4iuC4t+C5iOC4reC4oeC4leC5iOC4reC4o+C4sOC4muC4muKApjwvZGl2PgogICAgPC9tYWluPgogIDwvZGl2Pgo8L2Rpdj4KCjxk',
  'aXYgaWQ9ImF1dGhSb290Ij48L2Rpdj4KPGRpdiBpZD0ibW9kYWxSb290Ij48L2Rpdj4KPGRpdiBpZD0idG9hc3RSb290Ij48L2Rpdj4KCjxzY3JpcHQ+CiAgLyog4LiE4LmI4Liy4LiX4Lix4LmJ4LiH4Liq4Liy4Lih4LiW4Li54LiB4LiB4Lij4Lit4LiH4Lih4Liy',
  '4LiI4Liy4LiB4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4LmB4Lil4LmJ4LinIOC4iOC4tuC4h+C4q+C4peC4uOC4lOC4reC4reC4geC4iOC4suC4geC5gOC4hOC4o+C4t+C5iOC4reC4h+C4q+C4oeC4suC4ouC4hOC4s+C4nuC4',
  'ueC4lOC5hOC4oeC5iOC5hOC4lOC5iQogICAgICAgYWNjZXNzS2V5ICDguJzguYjguLLguJkgc2FmZUtleV8gICAg4LmA4Lir4Lil4Li34Lit4LmB4LiE4LmIIEEtWiBhLXogMC05IF8gLQogICAgICAgcm9sZSAgICAgICDguKHguLLguIjguLLguIHguKPguLLguKLg',
  'uIHguLLguKPguITguIfguJfguLXguYggUk9MRQogICAgICAgdGhlbWUgICAgICDguJzguYjguLLguJkgc2FmZVRoZW1lXyAg4LmA4Lir4Lil4Li34Lit4LmB4LiE4LmIIDMg4LiE4LmI4Liy4LiX4Li14LmI4LiB4Liz4Lir4LiZ4LiU4LmE4Lin4LmJCgogICAgIOC4',
  'l+C4seC5ieC4h+C4quC4suC4oeC4leC5ieC4reC4h+C4nuC4tOC4oeC4nuC5jOC5geC4muC4muC4lOC4tOC4miAoZm9yY2UtcHJpbnRpbmcpIOC5gOC4l+C5iOC4suC4meC4seC5ieC4mSDguKvguYnguLLguKHguYPguIrguYnguYHguJrguJogc3RhbmRhcmQtcHJp',
  'bnRpbmcKICAgICDguYDguJ7guKPguLLguLDguYHguJrguJrguKvguKXguLHguIfguIjguLAgZXNjYXBlIOC5gOC4hOC4o+C4t+C5iOC4reC4h+C4q+C4oeC4suC4ouC4hOC4s+C4nuC4ueC4lOC5gOC4m+C5h+C4mSAmcXVvdDsg4LiL4Li24LmI4LiH4LmD4LiZ4LmB',
  '4LiX4LmH4LiBIHNjcmlwdAogICAgIOC5gOC4muC4o+C4suC4p+C5jOC5gOC4i+C4reC4o+C5jOC5hOC4oeC5iOC4luC4reC4lOC4geC4peC4seC4miDguJfguLPguYPguKvguYnguJfguLHguYnguIfguJrguKXguYfguK3guIHguJnguLXguYnguJ7guLHguIfguJfg',
  'uLHguYnguIfguIHguYnguK3guJnguYHguKXguLDguITguYjguLLguYTguKHguYjguJbguLbguIfguKvguJnguYnguLLguYDguKfguYfguJogKi8KICB2YXIgQUNDRVNTX0tFWSA9ICI8PyE9IGFjY2Vzc0tleSA/PiI7CiAgdmFyIFVTRVJfUk9MRSAgPSAiPD8hPSBy',
  'b2xlID8+IjsKICB2YXIgSU5JVF9USEVNRSA9ICI8PyE9IHRoZW1lID8+IjsKPC9zY3JpcHQ+CjxzY3JpcHQ+Ci8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBBcHAuaHRtbCDigJQgY29yZTogc3Rh',
  'dGUsIGFwaSwgcm91dGVyLCBmb3JtYXQsIG1vZGFsLCB1cGxvYWQKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgp2YXIgUyA9IHsKICBib290OiBudWxsLCAgICAgICAgICAvLyDguILguYnguK3g',
  'uKHguLnguKXguJXguLHguYnguIfguJXguYnguJnguIjguLLguIEgYXBwLmJvb3RzdHJhcAogIHBhZ2U6ICdkYXNoYm9hcmQnLAogIHllYXI6IFN0cmluZyhuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCkpLAogIGNhY2hlOiB7fSwgICAgICAgICAgIC8vIOC5gOC4geC5',
  'h+C4muC4nOC4peC4peC4seC4nuC4mOC5jOC4peC5iOC4suC4quC4uOC4lOC4guC4reC4h+C5geC4leC5iOC4peC4sOC4q+C4meC5ieC4sgogIHBhcmFtczoge30sICAgICAgICAgIC8vIOC4leC4seC4p+C4geC4o+C4reC4h+C4ouC5iOC4reC4ouC4guC4reC4h+C5',
  'geC4leC5iOC4peC4sOC4q+C4meC5ieC4siDguYDguIrguYjguJkge3Jvb206JzMxMScsIHN0YXR1czonYWxsJ30KICBidXN5OiBmYWxzZQp9OwoKdmFyIEFMTF9ERUJUUyA9IFtdOwoKdmFyIFBBR0VTID0gWwogIHsgaWQ6J2Rhc2hib2FyZCcsIGljOifwn5OKJywg',
  'bGFiZWw6J+C4oOC4suC4nuC4o+C4p+C4oScsICAgICAgICAgICAgICBzdWI6J+C5geC4lOC4iuC4muC4reC4o+C5jOC4lOC4o+C4p+C4oeC4l+C4uOC4geC4quC5iOC4p+C4meC4guC4reC4h+C4q+C4reC4nuC4seC4gScsICAgICAgICBzZWM6J+C4oOC4suC4nuC4',
  'o+C4p+C4oScgfSwKICB7IGlkOidkZWJ0TWFpbicsICBpYzon8J+SsCcsIGxhYmVsOifguKPguLLguKLguIHguLLguKPguKrguKPguLjguJvguKPguKfguKEnLCAgICAgICBzdWI6J+C4muC4seC4jeC4iuC4teC5guC4reC4meC5g+C4iuC5ieC4q+C4meC4teC5ieC4',
  'q+C4peC4seC4geC4guC4reC4h+C4q+C4reC4nuC4seC4gScsICAgICAgICBzZWM6J+C4geC4suC4o+C5gOC4h+C4tOC4mScgfSwKICB7IGlkOidkZWJ0U3ViJywgICBpYzon8J+nvicsIGxhYmVsOifguKvguJnguLXguYnguKrguLTguJknLCAgICAgICAgICAgICAg',
  'c3ViOifguJrguLHguI3guIrguLXguYLguK3guJnguYPguIrguYnguKvguJnguLXguYnguKPguK3guIfguILguK3guIfguKvguK3guJ7guLHguIEnIH0sCiAgeyBpZDoncHVyY2hhc2VzJywgaWM6J/Cfm5InLCBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li3',
  '4LmJ4Lit4LiC4Lit4LiHJywgICAgICAgIHN1Yjon4LiC4Lit4LiH4LmA4LiC4LmJ4Liy4Lir4Lit4Lie4Lix4LiBIOC4o+C4suC4hOC4siDguJvguKPguLDguIHguLHguJkg4LmB4Lil4Liw4Liq4Lil4Li04LibJyB9LAogIHsgaWQ6J2ZpbmFuY2UnLCAgIGljOifw',
  'n5OSJywgbGFiZWw6J+C4o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKLguKvguK0nLCAgICAgIHN1Yjon4LiE4LmI4Liy4LmA4LiK4LmI4Liy4LiX4Li14LmI4LmA4LiB4LmH4Lia4LmE4LiU4LmJIMK3IOC4hOC5iOC4suC5hOC4nyDCtyDguITg',
  'uYjguLLguJnguYnguLMgwrcg4LiE4LmI4Liy4LmA4LiZ4LmH4LiVIMK3IOC4oOC4suC4qeC4tScgfSwKICB7IGlkOidhYycsICAgICAgICBpYzon4p2E77iPJywgbGFiZWw6J+C4peC5ieC4suC4h+C5geC4reC4o+C5jCcsICAgICAgICAgICAgc3ViOifguJXguLLg',
  'uKPguLLguIfguKXguYnguLLguIfguYHguK3guKPguYzguKPguLLguKLguKvguYnguK3guIcgMjQg4Lir4LmJ4Lit4LiHJywgICAgICBzZWM6J+C4i+C5iOC4reC4oeC4muC4s+C4o+C4uOC4hycgfSwKICB7IGlkOidyZXBhaXJzJywgICBpYzon8J+UpycsIGxhYmVs',
  'OifguIvguYjguK3guKHguYHguIvguKHguJXguLLguKHguKvguYnguK3guIcnLCAgICAgIHN1Yjon4LiH4Liy4LiZ4LmB4LiI4LmJ4LiH4LiL4LmI4Lit4Lih4LmB4Lii4LiB4LiV4Liy4Lih4Lir4LmJ4Lit4LiHJyB9LAogIHsgaWQ6J2J1aWxkaW5nJywgIGljOifw',
  'n4+iJywgbGFiZWw6J+C4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oScsICAgIHN1Yjon4LiH4Liy4LiZ4Liq4LmI4Lin4LiZ4LiB4Lil4Liy4LiH4LiC4Lit4LiH4Lit4Liy4LiE4Liy4LijJyB9LAogIHsgaWQ6J3Jvb21zJywg',
  'ICAgIGljOifwn5qqJywgbGFiZWw6J+C4q+C5ieC4reC4h+C4nuC4seC4gScsICAgICAgICAgICAgIHN1Yjon4LiX4Liw4LmA4Lia4Li14Lii4LiZ4Lir4LmJ4Lit4LiH4LmB4Lil4Liw4Lib4Lij4Liw4Lin4Lix4LiV4Li04Lij4Liy4Lii4Lir4LmJ4Lit4LiHJywg',
  'ICAgICAgc2VjOifguILguYnguK3guKHguLnguKUnIH0sCiAgeyBpZDoncmVwb3J0cycsICAgaWM6J/Cfk4gnLCBsYWJlbDon4Lij4Liy4Lii4LiH4Liy4LiZICYg4Liq4Liz4Lij4Lit4LiH4LiC4LmJ4Lit4Lih4Li54LilJywgc3ViOifguITguYjguLLguYPguIrg',
  'uYnguIjguYjguLLguKLguKPguLLguKLguKvguYnguK3guIcgwrcg4Lib4LiP4Li04LiX4Li04LiZ4LiH4Liy4LiZIMK3IOC4quC5iOC4h+C4reC4reC4geC4guC5ieC4reC4oeC4ueC4pScgfSwKICB7IGlkOidzZXR0aW5ncycsICBpYzon4pqZ77iPJywgbGFiZWw6',
  'J+C4leC4seC5ieC4h+C4hOC5iOC4sicsICAgICAgICAgICAgICBzdWI6J+C4muC4seC4jeC4iuC4tSDCtyDguJjguLXguKEgwrcg4Lic4Li54LmJ4LmD4LiK4LmJIMK3IOC4peC4tOC4h+C4geC5jOC5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4mScsICAgc2Vj',
  'OifguKPguLDguJrguJonIH0KXTsKCi8qIC0tLS0tLS0tLS0tLS0tLS0gQVBJIC0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKiDguIHguLjguI3guYHguIjguJfguLXguYjguIjguLDguYHguJnguJrguYTguJvguIHguLHguJrguJfguLjguIHguITguLPguKrguLHguYjg',
  'uIcg4oCUIOC4oeC4tSAyIOC4l+C4suC4h+C4quC4s+C4o+C4reC4h+C5gOC4nOC4t+C5iOC4reC4l+C4suC4h+C5geC4o+C4geC5hOC4oeC5iOC4oeC4siAqLwp2YXIgUkVTT0xWRURfS0VZID0gbnVsbDsKCmZ1bmN0aW9uIGFjY2Vzc0tleSgpewogIGlmIChSRVNP',
  'TFZFRF9LRVkgIT09IG51bGwpIHJldHVybiBSRVNPTFZFRF9LRVk7CiAgUkVTT0xWRURfS0VZID0gKHR5cGVvZiBBQ0NFU1NfS0VZID09PSAnc3RyaW5nJyAmJiBBQ0NFU1NfS0VZKSA/IEFDQ0VTU19LRVkgOiAnJzsKICByZXR1cm4gUkVTT0xWRURfS0VZOwp9Cgov',
  'KiogdHJ1ZSDguJbguYnguLLguYDguJvguLTguJTguJTguYnguKfguKLguKXguLTguIfguIHguYzguJzguLnguYnguJTguLnguYHguKUg4oCUIOC5g+C4iuC5ieC5geC4l+C4meC4leC4seC4p+C5geC4m+C4oyBDQU5fRURJVCDguJXguKPguIcg4LmGIOC4l+C4teC5',
  'iOC4reC4suC4iOC5hOC4oeC5iOC4luC4ueC4geC4m+C4o+C4sOC4geC4suC4qCAqLwpmdW5jdGlvbiBjYW5FZGl0KCl7CiAgaWYgKHR5cGVvZiBDQU5fRURJVCAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiAhIUNBTl9FRElUOwogIHJldHVybiAhIShTLmJvb3QgJiYg',
  'Uy5ib290LmNhbkVkaXQpOwp9CgpmdW5jdGlvbiBjYWxsQXBpKGFjdGlvbiwgcGF5bG9hZCl7CiAgdmFyIGJvZHkgPSB7fTsKICBPYmplY3Qua2V5cyhwYXlsb2FkIHx8IHt9KS5mb3JFYWNoKGZ1bmN0aW9uKGspeyBib2R5W2tdID0gcGF5bG9hZFtrXTsgfSk7CiAg',
  'Ym9keS5fa2V5ID0gYWNjZXNzS2V5KCk7CiAgLy8g4Lic4Li54LmJ4LmA4Lij4Li14Lii4LiB4Liq4LmI4LiHIF9zZXNzaW9uIOC4oeC4suC5gOC4reC4h+C5hOC4lOC5iSAo4LiV4Lit4LiZ4Lit4Lit4LiB4LiI4Liy4LiB4Lij4Liw4Lia4Lia4LiV4LmJ4Lit4LiH',
  '4LmD4LiK4LmJ4LiV4Lix4Lin4LmA4LiB4LmI4LiyKQogIGlmIChib2R5Ll9zZXNzaW9uID09PSB1bmRlZmluZWQpIGJvZHkuX3Nlc3Npb24gPSAodHlwZW9mIEFVVEggIT09ICd1bmRlZmluZWQnID8gQVVUSC5zZXNzaW9uIDogJycpIHx8ICcnOwogIHBheWxvYWQg',
  'PSBib2R5OwogIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpewogICAgZ29vZ2xlLnNjcmlwdC5ydW4KICAgICAgLndpdGhTdWNjZXNzSGFuZGxlcihmdW5jdGlvbihyZXMpewogICAgICAgIGlmICghcmVzKSByZXR1cm4gcmVqZWN0',
  'KG5ldyBFcnJvcign4LmE4Lih4LmI4LmE4LiU4LmJ4Lij4Lix4Lia4LiC4LmJ4Lit4Lih4Li54Lil4LiI4Liy4LiB4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmMJykpOwogICAgICAgIGlmIChyZXMub2spIHJldHVybiByZXNvbHZlKHJlcy5kYXRhKTsK',
  'ICAgICAgICAvLyDguKvguKHguJTguK3guLLguKLguLjguKPguLDguKvguKfguYjguLLguIfguYPguIrguYnguIfguLLguJkg4oCUIOC4nuC4suC4geC4peC4seC4muC5hOC4m+C4q+C4meC5ieC4suC4peC5h+C4reC4geC4reC4tOC4meC5geC4l+C4meC4l+C4teC5',
  'iOC4iOC4sOC4guC4tuC5ieC4meC4guC5ieC4reC4hOC4p+C4suC4oeC4hOC5ieC4suC4h+C5hOC4p+C5ieC5gOC4ieC4oiDguYYKICAgICAgICBpZiAocmVzLm5lZWRMb2dpbiAmJiB0eXBlb2Ygb25TZXNzaW9uTG9zdCA9PT0gJ2Z1bmN0aW9uJykgb25TZXNzaW9u',
  'TG9zdCgpOwogICAgICAgIHJlamVjdChuZXcgRXJyb3IocmVzLmVycm9yKSk7CiAgICAgIH0pCiAgICAgIC53aXRoRmFpbHVyZUhhbmRsZXIoZnVuY3Rpb24oZXJyKXsgcmVqZWN0KGVycik7IH0pCiAgICAgIC5hcGkoYWN0aW9uLCBwYXlsb2FkIHx8IHt9KTsKICB9',
  'KTsKfQoKLyoqIOC5gOC4o+C4teC4ouC4geC5gOC4oeC4t+C5iOC4reC5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jOC4muC4reC4geC4p+C5iOC4suC4ouC4seC4h+C5hOC4oeC5iOC5hOC4lOC5ieC4peC5h+C4reC4geC4reC4tOC4mSAo4Lir4Lih4LiU',
  '4Lit4Liy4Lii4Li4IC8g4LiW4Li54LiB4LmD4Lir4LmJ4Lit4Lit4LiB4LiI4Liy4LiB4Lij4Liw4Lia4LiaKSAqLwp2YXIgc2Vzc2lvbkxvc3RBdCA9IDA7CmZ1bmN0aW9uIG9uU2Vzc2lvbkxvc3QoKXsKICBpZiAoRGF0ZS5ub3coKSAtIHNlc3Npb25Mb3N0QXQg',
  'PCAzMDAwKSByZXR1cm47ICAgLy8g4Lir4Lil4Liy4Lii4LiE4Liz4Liq4Lix4LmI4LiH4Lie4Lij4LmJ4Lit4Lih4LiB4Lix4LiZ4LiB4LmH4LmA4LiU4LmJ4LiH4LiE4Lij4Lix4LmJ4LiH4LmA4LiU4Li14Lii4Lin4Lie4LitCiAgc2Vzc2lvbkxvc3RBdCA9IERh',
  'dGUubm93KCk7CiAgc2F2ZVNlc3Npb24oJycpOwogIGNsb3NlTW9kYWwoKTsKICBpZiAoQVVUSC5kZXZpY2UpIHNob3dQaW4oKTsgZWxzZSBzaG93TG9naW4oJ+C4q+C4oeC4lOC5gOC4p+C4peC4suC5g+C4iuC5ieC4h+C4suC4mSDguIHguKPguLjguJPguLLguYDg',
  'uILguYnguLLguKrguLnguYjguKPguLDguJrguJrguK3guLXguIHguITguKPguLHguYnguIcnKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSBib290ICYgcm91dGluZyAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiBib290KCl7CiAgLy8g4LiX4Liy4LiY4Li1',
  '4Lih4LiB4LmI4Lit4LiZ4Lit4Lii4LmI4Liy4LiH4Lit4Li34LmI4LiZIOC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC5gOC4q+C5h+C4meC4q+C4meC5ieC4suC4iOC4reC4geC4o+C4sOC4nuC4o+C4tOC4muC4guC4suC4p+C4leC4reC4meC5gOC4m+C4tOC4lAog',
  'IGFwcGx5VGhlbWUobHNHZXQoTFNfVEhFTUUpIHx8ICh0eXBlb2YgSU5JVF9USEVNRSA9PT0gJ3N0cmluZycgPyBJTklUX1RIRU1FIDogJ+C4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hycpKTsKICAvLyBhdXRoR2F0ZSDguIjguLDguK3guYjguLLguJnguIHg',
  'uLjguI3guYHguIjguIjguLLguIEgVVJMIOC4guC4reC4h+C4q+C4meC5ieC4suC5geC4oeC5iOC5g+C4q+C5ieC4lOC5ieC4p+C4oiDguJbguYnguLLguJXguLHguKfguYHguJvguKPguYTguKHguYjguKHguLLguJbguLbguIfguKvguJnguYnguLLguYDguKfguYfg',
  'uJoKICBhdXRoR2F0ZSgpOwp9CgpmdW5jdGlvbiBib290Tm93KCl7CiAgY2FsbEFwaSgnYXBwLmJvb3RzdHJhcCcpLnRoZW4oZnVuY3Rpb24oYil7CiAgICBTLmJvb3QgPSBiOwogICAgcmVuZGVyTmF2KCk7CiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2',
  'Rm9vdCcpLmlubmVySFRNTCA9IG5hdkZvb3RIdG1sKGIpOwogICAgUy52ZXJzaW9uID0gYi52ZXJzaW9uIHx8IDA7CiAgICBpZiAoIWIuY2FuRWRpdCkgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdyZWFkb25seScpOwogICAgLy8g4LiY4Li14Lih4LiC4Lit',
  '4LiH4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJ4LiK4LiZ4Liw4LmA4Liq4Lih4LitIOC4luC5ieC4suC4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4leC4seC5ieC4h+C4hOC5iOC4reC4ouC5g+C4iuC5ieC4guC4reC4h+C4o+C4sOC4muC4mgogICAg',
  'YXBwbHlUaGVtZShjdXJyZW50VGhlbWUoKSk7CiAgICBnbyhzdGFydFBhZ2UoYikpOwogICAgc3RhcnRQb2xsaW5nKGIuc2V0dGluZ3MgJiYgYi5zZXR0aW5ncy5yZWZyZXNoU2Vjb25kcyk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICBkb2N1bWVudC5nZXRF',
  'bGVtZW50QnlJZCgndmlldycpLmlubmVySFRNTCA9CiAgICAgICc8ZGl2IGNsYXNzPSJjYXJkIj48ZGl2IGNsYXNzPSJjYXJkLWIiPjxoMz7guYDguIrguLfguYjguK3guKHguJXguYjguK3guKPguLDguJrguJrguYTguKHguYjguKrguLPguYDguKPguYfguIg8L2gz',
  'PicgKwogICAgICAnPHAgY2xhc3M9Im11dGVkIj4nICsgZXNjKGUubWVzc2FnZXx8ZSkgKyAnPC9wPicgKwogICAgICAnPHAgY2xhc3M9ImZzMTMiPuC4leC4o+C4p+C4iOC4quC4reC4muC4p+C5iOC4sjog4LmA4Lib4Li04LiU4LiK4Li14LiV4LmB4Lil4LmJ4Lin',
  '4Lij4Lix4LiZIDxiPuC5gOC4oeC4meC4uSDwn4+iIFRoZSBNIENvcm5lciBBUCDihpIg8J+agCDguJXguLTguJTguJXguLHguYnguIfguJfguLHguYnguIfguKvguKHguJTguYPguJnguITguKXguLTguIHguYDguJTguLXguKLguKc8L2I+ICcgKwogICAgICAn4LmA',
  '4Lij4Li14Lii4Lia4Lij4LmJ4Lit4Lii4LmB4Lil4LmJ4LinPC9wPjwvZGl2PjwvZGl2Pic7CiAgfSk7Cn0KCi8qKiDguKvguJnguYnguLLguYHguKPguIHguJfguLXguYjguIjguLDguYDguJvguLTguJQg4oCUIOC4leC4suC4oeC4l+C4teC5iOC4leC4seC5ieC4',
  'h+C5hOC4p+C5iSDguYHguJXguYjguJbguYnguLLguKHguLUgI2hhc2gg4LmD4LiZ4Lil4Li04LiH4LiB4LmM4LmD4Lir4LmJIGhhc2gg4LiK4LiZ4LiwICovCmZ1bmN0aW9uIHN0YXJ0UGFnZShiKXsKICB2YXIgaGFzaCA9IChsb2NhdGlvbi5oYXNoIHx8ICcnKS5y',
  'ZXBsYWNlKCcjJywnJyk7CiAgaWYgKFBBR0VTLnNvbWUoZnVuY3Rpb24ocCl7IHJldHVybiBwLmlkID09PSBoYXNoOyB9KSkgcmV0dXJuIGhhc2g7CiAgdmFyIG1hcCA9IHsKICAgICfguYHguJTguIrguJrguK3guKPguYzguJQnOidkYXNoYm9hcmQnLCAn4Lij4Liy',
  '4Lii4LiB4Liy4Lij4Liq4Lij4Li44Lib4Lij4Lin4LihJzonZGVidE1haW4nLCAn4Lir4LiZ4Li14LmJ4Liq4Li04LiZJzonZGVidFN1YicsCiAgICAn4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHJzoncHVyY2hhc2VzJywgJ+C4i+C5iOC4',
  'reC4oeC5geC4i+C4oeC4leC4suC4oeC4q+C5ieC4reC4hyc6J3JlcGFpcnMnCiAgfTsKICByZXR1cm4gbWFwW2Iuc2V0dGluZ3MgJiYgYi5zZXR0aW5ncy5zdGFydFBhZ2VdIHx8ICdkYXNoYm9hcmQnOwp9CgovKiog4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Lih4Li4',
  '4Lih4Lil4LmI4Liy4LiH4LiL4LmJ4Liy4LiiIOKAlCDguYDguKfguK3guKPguYzguIrguLHguJnguYDguKfguYfguJrguYHguK3guJvguIjguLDguYDguILguLXguKLguJnguJfguLHguJrguJ/guLHguIfguIHguYzguIrguLHguJnguJnguLXguYkgKi8KZnVuY3Rp',
  'b24gbmF2Rm9vdEh0bWwoYil7CiAgdmFyIHUgPSBiLnVzZXIgfHwge307CiAgcmV0dXJuICc8YiBzdHlsZT0iY29sb3I6I2M3ZDBlMCI+JyArIGVzYyh1Lm5hbWUgfHwgdS5sYWJlbCB8fCAnJykgKyAnPC9iPicgKwogICAgKHUudXNlcm5hbWUgPyAnIDxzcGFuIHN0',
  'eWxlPSJvcGFjaXR5Oi43Ij5AJyArIGVzYyh1LnVzZXJuYW1lKSArICc8L3NwYW4+JyA6ICcnKSArCiAgICAnPGJyPjxzcGFuIHN0eWxlPSJvcGFjaXR5Oi44Ij4nICsgZXNjKHUucm9sZSAmJiB1LnJvbGUgIT09ICdub25lJyA/IHUucm9sZSA6IHUudmlhIHx8ICcn',
  'KSArICc8L3NwYW4+JyArCiAgICAoYi5zaGVldFVybCA/ICc8YnI+PGEgaHJlZj0iJyArIGIuc2hlZXRVcmwgKyAnIiB0YXJnZXQ9Il9ibGFuayI+4LmA4Lib4Li04LiUIEdvb2dsZSBTaGVldCDihpc8L2E+JyA6ICcnKSArCiAgICAodS5zaWduZWRJbiAmJiB1LnVz',
  'ZXJuYW1lCiAgICAgID8gJzxicj48YSBocmVmPSJqYXZhc2NyaXB0OnZvaWQoMCkiIG9uY2xpY2s9ImNvbmZpcm1Mb2dvdXQoKSI+4Lit4Lit4LiB4LiI4Liy4LiB4Lij4Liw4Lia4LiaPC9hPicKICAgICAgOiAnJyk7Cn0KCmZ1bmN0aW9uIHJlbmRlck5hdigpewog',
  'IHZhciBodG1sID0gJyc7CiAgUEFHRVMuZm9yRWFjaChmdW5jdGlvbihwKXsKICAgIGlmIChwLnNlYykgaHRtbCArPSAnPGRpdiBjbGFzcz0ibmF2LXNlYyI+JyArIHAuc2VjICsgJzwvZGl2Pic7CiAgICBodG1sICs9ICc8YnV0dG9uIGNsYXNzPSJuYXYtaXRlbSIg',
  'aWQ9Im5hdi0nICsgcC5pZCArICciIG9uY2xpY2s9ImdvKFwnJyArIHAuaWQgKyAnXCcpIj4nICsKICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9ImljIj4nICsgcC5pYyArICc8L3NwYW4+PHNwYW4+JyArIHAubGFiZWwgKyAnPC9zcGFuPicgKwogICAgICAgICAg',
  'ICAgICc8c3BhbiBjbGFzcz0iYmFkZ2UiIGlkPSJiYWRnZS0nICsgcC5pZCArICciIHN0eWxlPSJkaXNwbGF5Om5vbmUiPjwvc3Bhbj4nICsKICAgICAgICAgICAgJzwvYnV0dG9uPic7CiAgfSk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdkxpc3QnKS5p',
  'bm5lckhUTUwgPSBodG1sOwp9CgpmdW5jdGlvbiBnbyhwYWdlKXsKICBTLnBhZ2UgPSBwYWdlOwogIFMucGFyYW1zID0ge307CiAgbG9jYXRpb24uaGFzaCA9IHBhZ2U7CiAgdmFyIG1ldGEgPSBQQUdFUy5maWx0ZXIoZnVuY3Rpb24ocCl7cmV0dXJuIHAuaWQ9PT1w',
  'YWdlO30pWzBdIHx8IFBBR0VTWzBdOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlVGl0bGUnKS50ZXh0Q29udGVudCA9IG1ldGEubGFiZWw7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BhZ2VTdWInKS50ZXh0Q29udGVudCA9IG1ldGEuc3ViOwog',
  'IFBBR0VTLmZvckVhY2goZnVuY3Rpb24ocCl7CiAgICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2LScgKyBwLmlkKTsKICAgIGlmIChlbCkgZWwuY2xhc3NMaXN0LnRvZ2dsZSgnb24nLCBwLmlkID09PSBwYWdlKTsKICB9KTsKICBkb2N1bWVu',
  'dC5nZXRFbGVtZW50QnlJZCgnbmF2JykuY2xhc3NMaXN0LnJlbW92ZSgnb3BlbicpOwogIHJlbW92ZVNjcmltKCk7CiAgbG9hZCgpOwp9CgpmdW5jdGlvbiByZWZyZXNoKCl7IGxvYWQodHJ1ZSk7IH0KCmZ1bmN0aW9uIHNldFllYXIoeSl7CiAgUy55ZWFyID0geTsK',
  'ICBsb2FkKCk7Cn0KCmZ1bmN0aW9uIGxvYWQoZm9yY2UpewogIHZhciB2aWV3ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZpZXcnKTsKICB2aWV3LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj48c3BhbiBjbGFzcz0i',
  'c3BpbiI+PC9zcGFuPjwvZGl2PuC4geC4s+C4peC4seC4h+C5guC4q+C4peC4lOC4guC5ieC4reC4oeC4ueC4peKApjwvZGl2Pic7CiAgdmFyIHIgPSBST1VURVNbUy5wYWdlXTsKICBpZiAoIXIpIHsgdmlldy5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz0iZW1wdHki',
  'PuC5hOC4oeC5iOC4nuC4muC4q+C4meC5ieC4suC4meC4teC5iTwvZGl2Pic7IHJldHVybjsgfQogIHIubG9hZCgpLnRoZW4oZnVuY3Rpb24oZGF0YSl7CiAgICBTLmNhY2hlW1MucGFnZV0gPSBkYXRhOwogICAgc3luY1llYXJPcHRpb25zKGRhdGEueWVhcnMgfHwg',
  'ZGF0YS5hdmFpbGFibGUgfHwgW10pOwogICAgdmlldy5pbm5lckhUTUwgPSByLnJlbmRlcihkYXRhKTsKICAgIGFwcGx5UmVhZE9ubHkodmlldyk7CiAgICBpZiAoci5hZnRlcikgci5hZnRlcihkYXRhKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgIHZpZXcu',
  'aW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9ImNhcmQiPjxkaXYgY2xhc3M9ImNhcmQtYiI+PGgzPuC5guC4q+C4peC4lOC4guC5ieC4reC4oeC4ueC4peC5hOC4oeC5iOC4quC4s+C5gOC4o+C5h+C4iDwvaDM+JyArCiAgICAgICAgICAgICAgICAgICAgICc8cCBjbGFz',
  'cz0ibXV0ZWQiPicgKyBlc2MoZS5tZXNzYWdlfHxlKSArICc8L3A+JyArCiAgICAgICAgICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImxvYWQoKSI+4Lil4Lit4LiH4LmD4Lir4Lih4LmIPC9idXR0b24+PC9kaXY+PC9kaXY+JzsKICB9',
  'KTsKfQoKLyoqIOC5gOC4leC4tOC4oeC4leC4seC4p+C5gOC4peC4t+C4reC4geC4m+C4teC5g+C4meC5geC4luC4muC4muC4meC5g+C4q+C5ieC4leC4o+C4h+C4geC4seC4muC4guC5ieC4reC4oeC4ueC4peC4iOC4o+C4tOC4h+C4guC4reC4h+C4q+C4meC5ieC4',
  'suC4meC4seC5ieC4mSAqLwpmdW5jdGlvbiBzeW5jWWVhck9wdGlvbnMoeWVhcnMpewogIHZhciBzZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgneWVhclNlbCcpOwogIHZhciBsaXN0ID0gKHllYXJzIHx8IFtdKS5zbGljZSgpLnNvcnQoZnVuY3Rpb24oYSxi',
  'KXtyZXR1cm4gYi1hO30pOwogIHZhciBjdXIgPSBuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCk7CiAgaWYgKGxpc3QuaW5kZXhPZihjdXIpIDwgMCkgbGlzdC51bnNoaWZ0KGN1cik7CiAgdmFyIGh0bWwgPSAnPG9wdGlvbiB2YWx1ZT0iYWxsIj7guJfguLjguIHguJvg',
  'uLU8L29wdGlvbj4nOwogIGxpc3QuZm9yRWFjaChmdW5jdGlvbih5KXsKICAgIGh0bWwgKz0gJzxvcHRpb24gdmFsdWU9IicgKyB5ICsgJyI+4Lib4Li1ICcgKyB5ICsgJyAo4LieLuC4qC4gJyArIChOdW1iZXIoeSkrNTQzKSArICcpPC9vcHRpb24+JzsKICB9KTsK',
  'ICBzZWwuaW5uZXJIVE1MID0gaHRtbDsKICBpZiAobGlzdC5pbmRleE9mKE51bWJlcihTLnllYXIpKSA8IDAgJiYgUy55ZWFyICE9PSAnYWxsJykgUy55ZWFyID0gU3RyaW5nKGN1cik7CiAgc2VsLnZhbHVlID0gUy55ZWFyOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0t',
  'IOC5guC4q+C4oeC4lOC4lOC4ueC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pyAtLS0tLS0tLS0tLS0tLS0tCiAgIOC4neC4seC5iOC4h+C5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jOC4geC4seC4meC5hOC4p+C5ieC5geC4peC5ieC4p+C5g+C4',
  'meC4n+C4seC4h+C4geC5jOC4iuC4seC4mSBhcGkoKSDguJXguKPguIfguJnguLXguYnguYHguITguYjguIvguYjguK3guJnguJvguLjguYjguKHguJfguLXguYjguIHguJTguYTguJvguIHguYfguJfguLPguYTguKHguYjguYTguJTguYkKICAg4LmA4Lie4Li34LmI',
  '4Lit4LmE4Lih4LmI4LmD4Lir4LmJ4Lic4Li54LmJ4LiX4Li14LmI4LmA4Lib4Li04LiU4LiU4LmJ4Lin4Lii4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4Liq4Lix4Lia4Liq4LiZICovCnZhciBFRElUX0VOVFJZUE9JTlRTID0gL1xiKGZvcm1EZWJ0fGZvcm1E',
  'ZWJ0UGF5bWVudHxmb3JtUHVyY2hhc2V8Zm9ybUFjfGZvcm1CdWxrQWN8Zm9ybVJlcGFpcnxmb3JtQnVpbGRpbmd8Zm9ybVJvb218Zm9ybUZpbmFuY2V8Zm9ybVVzZXJ8ZGVsRGVidHxkZWxEZWJ0UGF5bWVudHxkZWxQdXJjaGFzZXxkZWxBY3xkZWxSZXBhaXJ8ZGVs',
  'QnVpbGRpbmd8ZGVsRmluYW5jZXxkZWxVc2VyfGRvSW1wb3J0SnNvbnxkb1JvdGF0ZVNoYXJlfGRvQmFja3VwTm93fHNhdmVTZXR0aW5nc0Zvcm0pXHMqXCgvOwoKZnVuY3Rpb24gYXBwbHlSZWFkT25seShyb290KXsKICBpZiAoY2FuRWRpdCgpKSByZXR1cm47CiAg',
  'dmFyIG5vZGVzID0gcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCdbb25jbGlja10nKTsKICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7CiAgICBpZiAoRURJVF9FTlRSWVBPSU5UUy50ZXN0KG5vZGVzW2ldLmdldEF0dHJpYnV0ZSgnb25jbGlj',
  'aycpIHx8ICcnKSkgbm9kZXNbaV0ucmVtb3ZlKCk7CiAgfQp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4o+C4teC5gOC4n+C4o+C4iuC4reC4seC4leC5guC4meC4oeC4seC4leC4tOC5gOC4oeC4t+C5iOC4reC4guC5ieC4reC4oeC4ueC4peC5g+C4meC4iuC4teC4',
  'leC5gOC4m+C4peC4teC5iOC4ouC4mSAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiBzdGFydFBvbGxpbmcoc2Vjb25kcyl7CiAgdmFyIHNlYyA9IE51bWJlcihzZWNvbmRzIHx8IDApOwogIHZhciBkb3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGl2',
  'ZURvdCcpOwogIGlmICghc2VjKSB7IGlmIChkb3QpIGRvdC5pbm5lckhUTUwgPSAnJzsgcmV0dXJuOyB9CiAgaWYgKGRvdCkgZG90LmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz0iYiBvayIgdGl0bGU9IuC4guC5ieC4reC4oeC4ueC4peC4reC4seC4m+C5gOC4lOC4',
  'leC4reC4seC4leC5guC4meC4oeC4seC4leC4tOC4l+C4uOC4gSAnICsgc2VjICsgJyDguKfguLTguJnguLLguJfguLUiPuKXjyDguKrguJQ8L3NwYW4+JzsKCiAgc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKXsKICAgIGlmIChkb2N1bWVudC5oaWRkZW4pIHJldHVybjsK',
  'ICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9kYWxSb290JykuaW5uZXJIVE1MKSByZXR1cm47ICAvLyDguIHguLPguKXguLHguIfguIHguKPguK3guIHguJ/guK3guKPguYzguKHguK3guKLguLnguYgg4Lit4Lii4LmI4Liy4LmA4Lie4Li04LmI4LiH',
  '4Lij4Li14LmA4Lif4Lij4LiKCiAgICBjYWxsQXBpKCdhcHAudmVyc2lvbicpLnRoZW4oZnVuY3Rpb24odil7CiAgICAgIGlmICh2ICYmIHYudmVyc2lvbiAmJiB2LnZlcnNpb24gIT09IFMudmVyc2lvbikgewogICAgICAgIFMudmVyc2lvbiA9IHYudmVyc2lvbjsK',
  'ICAgICAgICBsb2FkKCk7CiAgICAgICAgdG9hc3QoJ+C4guC5ieC4reC4oeC4ueC4peC4oeC4teC4geC4suC4o+C5gOC4m+C4peC4teC5iOC4ouC4meC5geC4m+C4peC4hyDigJQg4LmC4Lir4Lil4LiU4LmD4Lir4Lih4LmI4LmD4Lir4LmJ4LmB4Lil4LmJ4LinJyk7',
  'CiAgICAgIH0KICAgIH0pLmNhdGNoKGZ1bmN0aW9uKCl7IC8qIOC5gOC4meC5h+C4leC4quC4sOC4lOC4uOC4lCDguYTguKfguYnguKPguK3guJrguKvguJnguYnguLIgKi8gfSk7CiAgfSwgc2VjICogMTAwMCk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0gZm9ybWF0',
  'IGhlbHBlcnMgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gZXNjKHMpewogIHJldHVybiBTdHJpbmcocz09bnVsbD8nJzpzKQogICAgLnJlcGxhY2UoLyYvZywnJmFtcDsnKS5yZXBsYWNlKC88L2csJyZsdDsnKS5yZXBsYWNlKC8+L2csJyZndDsnKQogICAg',
  'LnJlcGxhY2UoLyIvZywnJnF1b3Q7JykucmVwbGFjZSgvJy9nLCcmIzM5OycpOwp9CmZ1bmN0aW9uIG1vbmV5KG4sIGRlYyl7CiAgdmFyIHYgPSBOdW1iZXIobnx8MCk7CiAgcmV0dXJuIHYudG9Mb2NhbGVTdHJpbmcoJ3RoLVRIJyx7bWluaW11bUZyYWN0aW9uRGln',
  'aXRzOmRlY3x8MCwgbWF4aW11bUZyYWN0aW9uRGlnaXRzOmRlY3x8MH0pOwp9CmZ1bmN0aW9uIGJhaHQobil7IHJldHVybiBtb25leShuKSArICcg4Li/JzsgfQpmdW5jdGlvbiBwY3Qobil7IHJldHVybiAoTnVtYmVyKG4pfHwwKS50b0ZpeGVkKDEpICsgJyUnOyB9',
  'CmZ1bmN0aW9uIG51bShuKXsgcmV0dXJuIG49PW51bGx8fG49PT0nJyA/ICfigJMnIDogbW9uZXkobik7IH0KCi8qKiAyMDI2LTA0LTI2IC0+IDI2IOC5gOC4oS7guKIuIDI1NjkgKi8KdmFyIFRIX01PTiA9IFsn4LihLuC4hC4nLCfguIEu4LieLicsJ+C4oeC4tS7g',
  'uIQuJywn4LmA4LihLuC4oi4nLCfguJ4u4LiELicsJ+C4oeC4tC7guKIuJywn4LiBLuC4hC4nLCfguKou4LiELicsJ+C4gS7guKIuJywn4LiVLuC4hC4nLCfguJ4u4LiiLicsJ+C4mC7guIQuJ107CmZ1bmN0aW9uIHRoRGF0ZShpc28pewogIGlmICghaXNvKSByZXR1',
  'cm4gJ+KAkyc7CiAgdmFyIG0gPSBTdHJpbmcoaXNvKS5tYXRjaCgvXihcZHs0fSktKFxkezJ9KS0oXGR7Mn0pLyk7CiAgaWYgKCFtKSByZXR1cm4gZXNjKGlzbyk7CiAgcmV0dXJuIE51bWJlcihtWzNdKSArICcgJyArIFRIX01PTltOdW1iZXIobVsyXSktMV0gKyAn',
  'ICcgKyAoTnVtYmVyKG1bMV0pKzU0Myk7Cn0KZnVuY3Rpb24gdGhEYXRlU2hvcnQoaXNvKXsKICBpZiAoIWlzbykgcmV0dXJuICfigJMnOwogIHZhciBtID0gU3RyaW5nKGlzbykubWF0Y2goL14oXGR7NH0pLShcZHsyfSktKFxkezJ9KS8pOwogIGlmICghbSkgcmV0',
  'dXJuIGVzYyhpc28pOwogIHJldHVybiBOdW1iZXIobVszXSkgKyAnLycgKyBOdW1iZXIobVsyXSkgKyAnLycgKyBTdHJpbmcoTnVtYmVyKG1bMV0pKzU0Mykuc2xpY2UoMik7Cn0KZnVuY3Rpb24gZGF5c0Fnbyhpc28pewogIGlmICghaXNvKSByZXR1cm4gbnVsbDsK',
  'ICByZXR1cm4gTWF0aC5yb3VuZCgoRGF0ZS5ub3coKSAtIG5ldyBEYXRlKGlzbykuZ2V0VGltZSgpKS84NjQwMDAwMCk7Cn0KCmZ1bmN0aW9uIHN0YXR1c0JhZGdlKHN0KXsKICB2YXIgbWFwID0gewogICAgJ+C5gOC4quC4o+C5h+C4iOC4quC4tOC5ieC4mSc6J29r',
  'Jywn4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4Lij4LmB4Lil4LmJ4LinJzonb2snLCfguYPguIrguYnguIfguLLguJnguJvguIHguJXguLQnOidvaycsJ+C4m+C4tOC4lOC4q+C4meC4teC5ieC5geC4peC5ieC4pyc6J29rJywn4Lit4Lii4Li54LmI4LmD4LiZ4Lib',
  '4Lij4Liw4LiB4Lix4LiZJzonb2snLCfguKHguLXguJzguLnguYnguYDguIrguYjguLInOidvaycsJ+C4m+C4geC4leC4tCc6J29rJywKICAgICfguIHguLPguKXguLHguIfguIvguYjguK3guKEnOidpbmZvJywn4LiB4Liz4Lil4Lix4LiH4LiU4Liz4LmA4LiZ4Li0',
  '4LiZ4LiB4Liy4LijJzonaW5mbycsJ+C4meC4seC4lOC4q+C4oeC4suC4ouC5geC4peC5ieC4pyc6J2luZm8nLCfguIHguLPguKXguLHguIfguJzguYjguK3guJknOidpbmZvJywn4Lin4LmI4Liy4LiHJzonaW5mbycsCiAgICAn4Lij4Lit4LiU4Liz4LmA4LiZ4Li0',
  '4LiZ4LiB4Liy4LijJzond2FybicsJ+C5gOC4peC4t+C5iOC4reC4meC4meC4seC4lCc6J3dhcm4nLCfguYPguIHguKXguYnguKvguKHguJTguJvguKPguLDguIHguLHguJknOid3YXJuJywn4LiV4LmJ4Lit4LiH4LiL4LmI4Lit4LihJzond2FybicsJ+C4nuC4seC4',
  'geC4iuC4s+C4o+C4sCc6J3dhcm4nLCfguJvguLTguJTguJvguKPguLHguJrguJvguKPguLjguIcnOid3YXJuJywn4LmA4LiB4Li04LiZ4LiB4Liz4Lir4LiZ4LiUJzond2FybicsJ+C4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4peC5ieC4suC4hyc6J3dhcm4n',
  'LAogICAgJ+C4ouC4geC5gOC4peC4tOC4gSc6J211dGUnLCfguJvguKXguJTguKPguLDguKfguLLguIcnOidtdXRlJywn4LmE4Lih4LmI4Lij4Liw4Lia4Li4JzonbXV0ZScsCiAgICAn4Lir4Lih4LiU4Lit4Liy4Lii4Li44LmB4Lil4LmJ4LinJzonZGdyJywn4LiU',
  '4LmI4Lin4LiZ4Lih4Liy4LiBJzonZGdyJywn4LiU4LmI4Lin4LiZJzond2FybicKICB9OwogIGlmICghc3QpIHJldHVybiAnJzsKICByZXR1cm4gJzxzcGFuIGNsYXNzPSJiICcgKyAobWFwW3N0XXx8J211dGUnKSArICciPicgKyBlc2Moc3QpICsgJzwvc3Bhbj4n',
  'Owp9CgpmdW5jdGlvbiBwcm9ncmVzcyhwZXJjZW50LCBjbHMpewogIHZhciBwID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMTAwLCBOdW1iZXIocGVyY2VudCl8fDApKTsKICByZXR1cm4gJzxkaXYgY2xhc3M9InBiYXIgJyArIChjbHN8fCcnKSArICciPjxpIHN0eWxl',
  'PSJ3aWR0aDonICsgcCArICclIj48L2k+PC9kaXY+JzsKfQoKZnVuY3Rpb24gdGh1bWJzSHRtbChyZWZzLCBiaWcpewogIGlmICghcmVmcyB8fCAhcmVmcy5sZW5ndGgpIHJldHVybiAnPHNwYW4gY2xhc3M9ImZhaW50IGZzMTIiPuKAkzwvc3Bhbj4nOwogIHJldHVy',
  'biAnPGRpdiBjbGFzcz0idGh1bWJzIj4nICsgcmVmcy5tYXAoZnVuY3Rpb24ocil7CiAgICBpZiAoci50aHVtYikgewogICAgICByZXR1cm4gJzxpbWcgY2xhc3M9InRodW1iJyArIChiaWc/JyBiaWcnOicnKSArICciIGxvYWRpbmc9ImxhenkiIHNyYz0iJyArIGVz',
  'YyhyLnRodW1iKSArICciICcgKwogICAgICAgICAgICAgJ29uY2xpY2s9IndpbmRvdy5vcGVuKFwnJyArIGVzYyhyLnVybCkgKyAnXCcsXCdfYmxhbmtcJykiICcgKwogICAgICAgICAgICAgJ29uZXJyb3I9InRoaXMub25lcnJvcj1udWxsO3RoaXMucmVwbGFjZVdp',
  'dGgoZmlsZUNoaXAoJyArIEpTT04uc3RyaW5naWZ5KEpTT04uc3RyaW5naWZ5KHIpKS5yZXBsYWNlKC8iL2csJyZxdW90OycpICsgJykpIj4nOwogICAgfQogICAgcmV0dXJuICc8YSBjbGFzcz0iYiBpbmZvIiBocmVmPSInICsgZXNjKHIudXJsKSArICciIHRhcmdl',
  'dD0iX2JsYW5rIj7guYTguJ/guKXguYw8L2E+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwp9CmZ1bmN0aW9uIGZpbGVDaGlwKGpzb24pewogIHZhciByID0gdHlwZW9mIGpzb24gPT09ICdzdHJpbmcnID8gSlNPTi5wYXJzZShqc29uKSA6IGpzb247CiAgdmFy',
  'IGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7CiAgYS5jbGFzc05hbWUgPSAnYiBpbmZvJzsgYS5ocmVmID0gci51cmw7IGEudGFyZ2V0ID0gJ19ibGFuayc7IGEudGV4dENvbnRlbnQgPSAn8J+TjiDguYTguJ/guKXguYwnOwogIHJldHVybiBhOwp9Cgpm',
  'dW5jdGlvbiBlbXB0eUJveCh0ZXh0LCBhY3Rpb24pewogIHJldHVybiAnPGRpdiBjbGFzcz0iZW1wdHkiPjxkaXYgY2xhc3M9ImJpZyI+8J+Xgu+4jzwvZGl2PicgKyBlc2ModGV4dCkgKwogICAgICAgICAoYWN0aW9uID8gJzxkaXYgY2xhc3M9Im10MTIiPicgKyBh',
  'Y3Rpb24gKyAnPC9kaXY+JyA6ICcnKSArICc8L2Rpdj4nOwp9CgpmdW5jdGlvbiBiYXJDaGFydChpdGVtcywgbGFiZWxLZXksIHZhbHVlS2V5LCBmb3JtYXR0ZXIpewogIGlmICghaXRlbXMgfHwgIWl0ZW1zLmxlbmd0aCkgcmV0dXJuICc8ZGl2IGNsYXNzPSJlbXB0',
  'eSI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14LiC4LmJ4Lit4Lih4Li54LilPC9kaXY+JzsKICB2YXIgbWF4ID0gTWF0aC5tYXguYXBwbHkobnVsbCwgaXRlbXMubWFwKGZ1bmN0aW9uKGkpeyByZXR1cm4gTnVtYmVyKGlbdmFsdWVLZXldKXx8MDsgfSkpIHx8IDE7',
  'CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJiYXJzIj4nICsgaXRlbXMubWFwKGZ1bmN0aW9uKGkpewogICAgdmFyIHYgPSBOdW1iZXIoaVt2YWx1ZUtleV0pfHwwOwogICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJiYXItcm93Ij4nICsKICAgICAgJzxkaXYgY2xhc3M9ImNs',
  'aXAiIHRpdGxlPSInICsgZXNjKGlbbGFiZWxLZXldKSArICciPicgKyBlc2MoaVtsYWJlbEtleV0pICsgJzwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iYmFyLXRyYWNrIj48ZGl2IGNsYXNzPSJiYXItZmlsbCIgc3R5bGU9IndpZHRoOicgKyAodi9tYXgqMTAw',
  'KSArICclIj48L2Rpdj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9InYiPicgKyAoZm9ybWF0dGVyID8gZm9ybWF0dGVyKGkpIDogbW9uZXkodikpICsgJzwvZGl2PicgKwogICAgJzwvZGl2Pic7CiAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKfQoKLyogLS0t',
  'LS0tLS0tLS0tLS0tLSBtb2RhbCAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiBvcGVuTW9kYWwodGl0bGUsIGJvZHlIdG1sLCBmb290SHRtbCwgd2lkZSl7CiAgdmFyIHJvb3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9kYWxSb290Jyk7CiAgcm9v',
  'dC5pbm5lckhUTUwgPQogICAgJzxkaXYgY2xhc3M9Im92IiBvbmNsaWNrPSJpZihldmVudC50YXJnZXQ9PT10aGlzKWNsb3NlTW9kYWwoKSI+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJtb2RhbCcgKyAod2lkZT8nIHdpZGUnOicnKSArICciPicgKwogICAgICAgICc8',
  'ZGl2IGNsYXNzPSJtb2RhbC1oIj48aDM+JyArIGVzYyh0aXRsZSkgKyAnPC9oMz48YnV0dG9uIGNsYXNzPSJ4IiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPsOXPC9idXR0b24+PC9kaXY+JyArCiAgICAgICAgJzxkaXYgY2xhc3M9Im1vZGFsLWIiPicgKyBib2R5SHRt',
  'bCArICc8L2Rpdj4nICsKICAgICAgICAoZm9vdEh0bWwgPyAnPGRpdiBjbGFzcz0ibW9kYWwtZiI+JyArIGZvb3RIdG1sICsgJzwvZGl2PicgOiAnJykgKwogICAgICAnPC9kaXY+JyArCiAgICAnPC9kaXY+JzsKICBhcHBseVJlYWRPbmx5KHJvb3QpOwogIGRvY3Vt',
  'ZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJzsKfQpmdW5jdGlvbiBjbG9zZU1vZGFsKCl7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vZGFsUm9vdCcpLmlubmVySFRNTCA9ICcnOwogIGRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSAn',
  'JzsKfQpkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZSl7IGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIGNsb3NlTW9kYWwoKTsgfSk7CgpmdW5jdGlvbiBjb25maXJtQWN0aW9uKHRleHQsIG9uWWVzKXsKICBvcGVuTW9kYWwoJ+C4',
  'ouC4t+C4meC4ouC4seC4mScsCiAgICAnPHA+JyArIGVzYyh0ZXh0KSArICc8L3A+JywKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lii4LiB4LmA4Lil4Li04LiBPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0i',
  'YnRuIGRnciIgaWQ9ImNmbUJ0biI+4Lii4Li34LiZ4Lii4Lix4LiZPC9idXR0b24+Jyk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmbUJ0bicpLm9uY2xpY2sgPSBmdW5jdGlvbigpeyBjbG9zZU1vZGFsKCk7IG9uWWVzKCk7IH07Cn0KCi8qIC0tLS0tLS0t',
  'LS0tLS0tLS0gdG9hc3QgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gdG9hc3QobXNnLCBraW5kKXsKICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICBlbC5jbGFzc05hbWUgPSAndG9hc3QgJyArIChraW5kfHwnJyk7CiAgZWwu',
  'dGV4dENvbnRlbnQgPSBtc2c7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvYXN0Um9vdCcpLmFwcGVuZENoaWxkKGVsKTsKICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IGVsLnJlbW92ZSgpOyB9LCBraW5kPT09J2VycicgPyA1MjAwIDogMjgwMCk7Cn0KCi8q',
  'IC0tLS0tLS0tLS0tLS0tLS0gbmF2IChtb2JpbGUpIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIHRvZ2dsZU5hdigpewogIHZhciBuYXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2Jyk7CiAgbmF2LmNsYXNzTGlzdC50b2dnbGUoJ29wZW4nKTsK',
  'ICBpZiAobmF2LmNsYXNzTGlzdC5jb250YWlucygnb3BlbicpKSB7CiAgICB2YXIgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogICAgcy5jbGFzc05hbWUgPSAnc2NyaW0nOyBzLmlkID0gJ3NjcmltJzsKICAgIHMub25jbGljayA9IGZ1bmN0aW9u',
  'KCl7IG5hdi5jbGFzc0xpc3QucmVtb3ZlKCdvcGVuJyk7IHJlbW92ZVNjcmltKCk7IH07CiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHMpOwogIH0gZWxzZSByZW1vdmVTY3JpbSgpOwp9CmZ1bmN0aW9uIHJlbW92ZVNjcmltKCl7CiAgdmFyIHMgPSBkb2N1',
  'bWVudC5nZXRFbGVtZW50QnlJZCgnc2NyaW0nKTsKICBpZiAocykgcy5yZW1vdmUoKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSBzZWFyY2ggLS0tLS0tLS0tLS0tLS0tLSAqLwoKdmFyIHNlYXJjaFRpbWVyID0gbnVsbDsKZnVuY3Rpb24gb25TZWFyY2gocSl7CiAg',
  'Y2xlYXJUaW1lb3V0KHNlYXJjaFRpbWVyKTsKICBpZiAoIXEgfHwgcS50cmltKCkubGVuZ3RoIDwgMikgcmV0dXJuOwogIHNlYXJjaFRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpewogICAgY2FsbEFwaSgnYXBwLnNlYXJjaCcsIHsgcTogcSB9KS50aGVuKGZ1',
  'bmN0aW9uKHJvd3MpewogICAgICBvcGVuTW9kYWwoJ+C4nOC4peC4geC4suC4o+C4hOC5ieC4meC4q+C4siAiJyArIHEgKyAnIiAoJyArIHJvd3MubGVuZ3RoICsgJyknLAogICAgICAgIHJvd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9ImFsaXN0Ij4nICsgcm93cy5t',
  'YXAoZnVuY3Rpb24ocil7CiAgICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImFsaSIgb25jbGljaz0iY2xvc2VNb2RhbCgpO2dvKFwnJyArIGp1bXBQYWdlKHIubW9kdWxlKSArICdcJykiPicgKwogICAgICAgICAgICAnPGRpdiBjbGFzcz0iaWMiPicgKyBtb2R1',
  'bGVJY29uKHIubW9kdWxlKSArICc8L2Rpdj48ZGl2PicgKwogICAgICAgICAgICAnPGRpdiBjbGFzcz0idHQiPicgKyBlc2Moci50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJkZCI+JyArIGVzYyhyLmxhYmVsKSArIChyLmRldGFp',
  'bCA/ICcgwrcgJyArIGVzYyhyLmRldGFpbCkgOiAnJykgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICc8L2Rpdj48L2Rpdj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicKICAgICAgICA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4LmE4Lih4LmI4Lie4Lia',
  '4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4LiV4Lij4LiH4LiB4Lix4Lia4LiE4Liz4LiE4LmJ4LiZPC9kaXY+JywgJycsIHRydWUpOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwgJ2VycicpOyB9KTsKICB9LCA0MjApOwp9',
  'CmZ1bmN0aW9uIGp1bXBQYWdlKG1vZHVsZSl7CiAgcmV0dXJuICh7cHVyY2hhc2VzOidwdXJjaGFzZXMnLCByZXBhaXJzOidyZXBhaXJzJywgYnVpbGRpbmc6J2J1aWxkaW5nJywgYWM6J2FjJywgZGVidDonZGVidE1haW4nLCByb29tczoncm9vbXMnfSlbbW9kdWxl',
  'XSB8fCAnZGFzaGJvYXJkJzsKfQpmdW5jdGlvbiBtb2R1bGVJY29uKG1vZHVsZSl7CiAgcmV0dXJuICh7cHVyY2hhc2VzOifwn5uSJywgcmVwYWlyczon8J+UpycsIGJ1aWxkaW5nOifwn4+iJywgYWM6J+KdhO+4jycsIGRlYnQ6J/CfkrAnLCByb29tczon8J+aqid9',
  'KVttb2R1bGVdIHx8ICfwn5OEJzsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSBmaWxlIHVwbG9hZCAtLS0tLS0tLS0tLS0tLS0tICovCgovKioKICog4Lit4LmI4Liy4LiZ4LmE4Lif4Lil4LmM4LiI4Liy4LiBIDxpbnB1dCB0eXBlPWZpbGU+IOC5gOC4m+C5h+C4mSBk',
  'YXRhVVJMIOC5geC4peC5ieC4p+C4quC5iOC4h+C4guC4tuC5ieC4mSBEcml2ZQogKiDguITguLfguJkgYXJyYXkg4LiC4Lit4LiHIHtpZCxuYW1lLHVybCx0aHVtYn0KICovCmZ1bmN0aW9uIHVwbG9hZEZpbGVzKGlucHV0RWwsIGJ1Y2tldCl7CiAgdmFyIGZpbGVz',
  'ID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoaW5wdXRFbC5maWxlcyB8fCBbXSk7CiAgaWYgKCFmaWxlcy5sZW5ndGgpIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pOwogIHZhciBNQVggPSAxMiAqIDEwMjQgKiAxMDI0OwogIHZhciB0b29CaWcgPSBmaWxl',
  'cy5maWx0ZXIoZnVuY3Rpb24oZil7IHJldHVybiBmLnNpemUgPiBNQVg7IH0pOwogIGlmICh0b29CaWcubGVuZ3RoKSB7CiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCfguYTguJ/guKXguYzguYPguKvguI3guYjguYDguIHguLTguJkgMTIgTUI6',
  'ICcgKyB0b29CaWcubWFwKGZ1bmN0aW9uKGYpe3JldHVybiBmLm5hbWU7fSkuam9pbignLCAnKSkpOwogIH0KICByZXR1cm4gUHJvbWlzZS5hbGwoZmlsZXMubWFwKHJlYWRBc0RhdGFVcmwpKQogICAgLnRoZW4oZnVuY3Rpb24ocGF5bG9hZHMpeyByZXR1cm4gY2Fs',
  'bEFwaSgnZmlsZS51cGxvYWQnLCB7IGJ1Y2tldDogYnVja2V0LCBmaWxlczogcGF5bG9hZHMgfSk7IH0pOwp9CgpmdW5jdGlvbiByZWFkQXNEYXRhVXJsKGZpbGUpewogIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpewogICAgdmFy',
  'IHIgPSBuZXcgRmlsZVJlYWRlcigpOwogICAgci5vbmxvYWQgPSBmdW5jdGlvbigpeyByZXNvbHZlKHsgbmFtZTogZmlsZS5uYW1lLCBtaW1lVHlwZTogZmlsZS50eXBlLCBkYXRhVXJsOiByLnJlc3VsdCB9KTsgfTsKICAgIHIub25lcnJvciA9IGZ1bmN0aW9uKCl7',
  'IHJlamVjdChuZXcgRXJyb3IoJ+C4reC5iOC4suC4meC5hOC4n+C4peC5jOC5hOC4oeC5iOC4quC4s+C5gOC4o+C5h+C4iDogJyArIGZpbGUubmFtZSkpOyB9OwogICAgci5yZWFkQXNEYXRhVVJMKGZpbGUpOwogIH0pOwp9Cjwvc2NyaXB0Pgo8c2NyaXB0PgovKiA9',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgQXV0aC5odG1sIOKAlCDguKvguJnguYnguLLguKXguYfguK3guIHguK3guLTguJkgwrcgUElOIDYg4Lir4Lil4Lix4LiBIMK3IOC5gOC4m+C4peC4teC5iOC4',
  'ouC4meC4o+C4q+C4seC4quC4nOC5iOC4suC4mQoKICAg4LiX4Li14LmI4LmA4LiB4LmH4Lia4LiC4Lit4LiH4Lid4Lix4LmI4LiH4LmA4Lia4Lij4Liy4Lin4LmM4LmA4LiL4Lit4Lij4LmMIDIg4LiK4Lix4LmJ4LiZIOC5gOC4nuC4o+C4suC4sOC5gOC4p+C5h+C4',
  'muC5geC4reC4m+C4guC4reC4hyBBcHBzIFNjcmlwdAogICDguJfguLPguIfguLLguJnguYPguJkgaWZyYW1lIOC4l+C4teC5iOC4iuC4t+C5iOC4reC5guC4lOC5gOC4oeC4meC5gOC4m+C4peC4teC5iOC4ouC4meC4l+C4uOC4geC4hOC4o+C4seC5ieC4h+C4l+C4',
  'teC5iOC5gOC4m+C4tOC4lAogICBsb2NhbFN0b3JhZ2Ug4LiI4Li24LiH4Lir4Liy4Lii4LmE4LiU4LmJIOC4leC5ieC4reC4h+C4oeC4teC4l+C4suC4h+C4quC4s+C4o+C4reC4hwogICAgIMK3IOC4o+C4q+C4seC4quC4reC5ieC4suC4h+C4reC4tOC4h+C4geC4',
  'suC4o+C5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4mSAo4Lit4Liy4Lii4Li44Liq4Lix4LmJ4LiZKSDigJQg4LmA4LiB4LmH4Lia4LmD4LiZIGxvY2FsU3RvcmFnZSDguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcKICAgICAgIOC4q+C4suC4ouC4geC5',
  'h+C5geC4hOC5iOC5g+C4quC5iCBQSU4g4LmD4Lir4Lih4LmICiAgICAgwrcg4Lij4Lir4Lix4Liq4Lit4Li44Lib4LiB4Lij4LiT4LmMICjguITguLnguYjguIHguLHguJogUElOKSDigJQg4LmA4LiB4LmH4Lia4LiX4Lix4LmJ4LiHIGxvY2FsU3RvcmFnZSDguYHg',
  'uKXguLDguYPguJkgVVJMIOC4guC4reC4h+C4q+C4meC5ieC4suC5geC4oeC5iAogICAgICAg4Lic4LmI4Liy4LiZIGdvb2dsZS5zY3JpcHQuaGlzdG9yeSDguYDguJ7guLfguYjguK3guYPguKvguYnguKLguLHguIfguK3guKLguLnguYjguKvguKXguLHguIfguJvg',
  'uLTguJTguYDguJvguLTguJTguYDguITguKPguLfguYjguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgp2YXIgQVVUSCA9IHsKICBzZXNzaW9uOiAnJywKICBkZXZpY2U6ICcnLAogIG1l',
  'OiBudWxsLAogIHBpbjogJycsCiAgc2NyZWVuOiAnJwp9OwoKdmFyIExTX1NFU1NJT04gPSAnbWNvcm5lci5zZXNzaW9uJzsKdmFyIExTX0RFVklDRSAgPSAnbWNvcm5lci5kZXZpY2UnOwoKLyogLS0tLS0tLS0tLS0tLS0tLSDguJfguLXguYjguYDguIHguYfguJrg',
  'uJ3guLHguYjguIfguYDguJrguKPguLLguKfguYzguYDguIvguK3guKPguYwgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gbHNHZXQoayl7CiAgdHJ5IHsgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrKSB8fCAnJzsgfSBjYXRjaCAoZSkg',
  'eyByZXR1cm4gJyc7IH0KfQpmdW5jdGlvbiBsc1NldChrLCB2KXsKICB0cnkgeyB2ID8gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKGssIHYpIDogd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGspOyB9CiAgY2F0Y2ggKGUpIHsgLyog4LmC4Lir4Lih',
  '4LiU4Liq4LmI4Lin4LiZ4LiV4Lix4Lin4Lir4Lij4Li34Lit4Lib4Li04LiU4LiE4Li44LiB4LiB4Li14LmJ4LmE4Lin4LmJIOKAlCDguYPguIrguYnguJfguLLguIfguKrguLPguKPguK3guIcgKi8gfQp9CgovKiog4LmA4LiC4Li14Lii4LiZ4Lij4Lir4Lix4Liq',
  '4Lit4Li44Lib4LiB4Lij4LiT4LmM4Lil4LiHIFVSTCDguILguK3guIfguKvguJnguYnguLLguYHguKHguYgg4LmD4Lir4LmJ4Lij4Lit4LiU4LiC4LmJ4Liy4Lih4LiB4Liy4Lij4LmA4Lib4Li04LiU4LmD4Lir4Lih4LmIICovCmZ1bmN0aW9uIGRldmljZVRvVXJs',
  'KHRva2VuKXsKICB0cnkgewogICAgaWYgKCF3aW5kb3cuZ29vZ2xlIHx8ICFnb29nbGUuc2NyaXB0IHx8ICFnb29nbGUuc2NyaXB0Lmhpc3RvcnkpIHJldHVybjsKICAgIHZhciBwYXJhbXMgPSB7fTsKICAgIGlmIChhY2Nlc3NLZXkoKSkgcGFyYW1zLmtleSA9IGFj',
  'Y2Vzc0tleSgpOwogICAgaWYgKHRva2VuKSBwYXJhbXMuZCA9IHRva2VuOwogICAgZ29vZ2xlLnNjcmlwdC5oaXN0b3J5LnJlcGxhY2VTdGF0ZSh7fSwgcGFyYW1zLCBsb2NhdGlvbi5oYXNoKTsKICB9IGNhdGNoIChlKSB7IC8qIOC5hOC4oeC5iOC5g+C4iuC5iOC5',
  'gOC4p+C5h+C4muC5geC4reC4myAo4LmA4LiK4LmI4LiZ4LmA4Lib4Li04LiU4LmD4LiZIGRpYWxvZykg4oCUIOC4guC5ieC4suC4oeC5hOC4myAqLyB9Cn0KCmZ1bmN0aW9uIHNhdmVEZXZpY2UodG9rZW4pewogIEFVVEguZGV2aWNlID0gdG9rZW4gfHwgJyc7CiAg',
  'bHNTZXQoTFNfREVWSUNFLCBBVVRILmRldmljZSk7CiAgZGV2aWNlVG9VcmwoQVVUSC5kZXZpY2UpOwp9CgpmdW5jdGlvbiBzYXZlU2Vzc2lvbih0b2tlbil7CiAgQVVUSC5zZXNzaW9uID0gdG9rZW4gfHwgJyc7CiAgbHNTZXQoTFNfU0VTU0lPTiwgQVVUSC5zZXNz',
  'aW9uKTsKfQoKLyoqIOC4reC5iOC4suC4meC4hOC5iOC4suC4l+C4teC5iOC5gOC4geC5h+C4muC5hOC4p+C5ieC4l+C4seC5ieC4h+C4q+C4oeC4lCAo4LiV4LmJ4Lit4LiH4Lij4LitIFVSTCDguILguK3guIfguKvguJnguYnguLLguYHguKHguYgg4LiI4Li24LiH',
  '4LmA4Lib4LmH4LiZ4LmB4Lia4LiaIGNhbGxiYWNrKSAqLwpmdW5jdGlvbiBsb2FkU3RvcmVkKGRvbmUpewogIEFVVEguc2Vzc2lvbiA9IGxzR2V0KExTX1NFU1NJT04pOwogIEFVVEguZGV2aWNlICA9IGxzR2V0KExTX0RFVklDRSk7CgogIGlmICh3aW5kb3cuZ29v',
  'Z2xlICYmIGdvb2dsZS5zY3JpcHQgJiYgZ29vZ2xlLnNjcmlwdC51cmwpIHsKICAgIHRyeSB7CiAgICAgIGdvb2dsZS5zY3JpcHQudXJsLmdldExvY2F0aW9uKGZ1bmN0aW9uKGxvYyl7CiAgICAgICAgdmFyIHAgPSAobG9jICYmIGxvYy5wYXJhbWV0ZXIpIHx8IHt9',
  'OwogICAgICAgIGlmIChwLmQgJiYgIUFVVEguZGV2aWNlKSB7IEFVVEguZGV2aWNlID0gU3RyaW5nKHAuZCk7IGxzU2V0KExTX0RFVklDRSwgQVVUSC5kZXZpY2UpOyB9CiAgICAgICAgaWYgKHAua2V5ICYmICFhY2Nlc3NLZXkoKSkgUkVTT0xWRURfS0VZID0gU3Ry',
  'aW5nKHAua2V5KTsKICAgICAgICBkb25lKCk7CiAgICAgIH0pOwogICAgICByZXR1cm47CiAgICB9IGNhdGNoIChlKSB7IC8qIOC5g+C4iuC5ieC4l+C4suC4h+C4m+C4geC4leC4tCAqLyB9CiAgfQogIGRvbmUoKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguJXg',
  'uLHguKfguITguLjguKHguKXguLPguJTguLHguJrguKvguJnguYnguLLguIjguK0gLS0tLS0tLS0tLS0tLS0tLSAqLwoKLyoqIOC5gOC4o+C4teC4ouC4geC4leC4reC4meC5gOC4m+C4tOC4lOC4q+C4meC5ieC4suC5gOC4p+C5h+C4miDigJQg4LiV4Lix4LiU4Liq',
  '4Li04LiZ4Lin4LmI4Liy4LiI4Liw4LmD4Lir4LmJ4LmA4Lir4LmH4LiZ4Lit4Liw4LmE4Lij4LiB4LmI4Lit4LiZICovCmZ1bmN0aW9uIGF1dGhHYXRlKCl7CiAgbG9hZFN0b3JlZChmdW5jdGlvbigpewogICAgY2FsbEFwaSgnYXV0aC5tZScpLnRoZW4oZnVuY3Rp',
  'b24obWUpewogICAgICBBVVRILm1lID0gbWU7CiAgICAgIGlmIChtZS5zaWduZWRJbikgcmV0dXJuIGVudGVyQXBwKG1lKTsKICAgICAgaWYgKEFVVEguZGV2aWNlKSByZXR1cm4gc2hvd1BpbigpOwogICAgICBzaG93TG9naW4oKTsKICAgIH0pLmNhdGNoKGZ1bmN0',
  'aW9uKGUpewogICAgICBzaG93TG9naW4oZS5tZXNzYWdlIHx8IGUpOwogICAgfSk7CiAgfSk7Cn0KCmZ1bmN0aW9uIGVudGVyQXBwKG1lKXsKICBBVVRILm1lID0gbWU7CiAgaGlkZUF1dGgoKTsKICBib290Tm93KCk7CiAgLy8g4LmA4Lie4Li04LmI4LiH4Lil4LmH',
  '4Lit4LiB4Lit4Li04LiZ4LiU4LmJ4Lin4Lii4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmB4Lil4Liw4Lii4Lix4LiH4LmE4Lih4LmI4LmA4LiE4Lii4LiV4Lix4LmJ4LiHIFBJTiDguJrguJnguYDguITguKPguLfguYjguK3guIfguJnguLXguYkg4oCUIOC4iuC4',
  'p+C4meC4leC4seC5ieC4h+C4quC4seC4geC4hOC4o+C4seC5ieC4hwogIGlmICghQVVUSC5kZXZpY2UgJiYgbWUudXNlcm5hbWUgJiYgIWxzR2V0KCdtY29ybmVyLnBpbkFza2VkJykpIHsKICAgIHNldFRpbWVvdXQob2ZmZXJQaW4sIDkwMCk7CiAgfQp9CgpmdW5j',
  'dGlvbiBoaWRlQXV0aCgpewogIHZhciByID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F1dGhSb290Jyk7CiAgaWYgKHIpIHIuaW5uZXJIVE1MID0gJyc7CiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdsb2NrZWQnKTsKfQoKZnVuY3Rpb24gc2hv',
  'd0F1dGgoaHRtbCl7CiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdsb2NrZWQnKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXV0aFJvb3QnKS5pbm5lckhUTUwgPQogICAgJzxkaXYgY2xhc3M9ImF1dGgtd3JhcCI+PGRpdiBjbGFzcz0iYXV0aC1j',
  'YXJkIj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImF1dGgtYnJhbmQiPvCfj6IgPGI+JyArIGVzYygoUy5ib290ICYmIFMuYm9vdC5hcHAgJiYgUy5ib290LmFwcC5uYW1lKSB8fCAnVGhlIE0gQ29ybmVyIEFQJykgKyAnPC9iPjwvZGl2PicgKwogICAgICBodG1sICsK',
  'ICAgICc8L2Rpdj48L2Rpdj4nOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4q+C4meC5ieC4suC4peC5h+C4reC4geC4reC4tOC4meC4lOC5ieC4p+C4ouC4o+C4q+C4seC4quC4nOC5iOC4suC4mSAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiBzaG93TG9n',
  'aW4oZXJyKXsKICBBVVRILnNjcmVlbiA9ICdsb2dpbic7CiAgc2hvd0F1dGgoCiAgICAnPGgyIGNsYXNzPSJhdXRoLWgiPuC5gOC4guC5ieC4suC4quC4ueC5iOC4o+C4sOC4muC4mjwvaDI+JyArCiAgICAnPHAgY2xhc3M9ImF1dGgtc3ViIj7guYPguKrguYjguIrg',
  'uLfguYjguK3guJzguLnguYnguYPguIrguYnguYHguKXguLDguKPguKvguLHguKrguJzguYjguLLguJnguJfguLXguYjguYTguJTguYnguKPguLHguJo8L3A+JyArCiAgICAoZXJyID8gJzxkaXYgY2xhc3M9ImF1dGgtZXJyIj4nICsgZXNjKGVycikgKyAnPC9kaXY+',
  'JyA6ICc8ZGl2IGNsYXNzPSJhdXRoLWVyciIgaWQ9ImF1dGhFcnIiIGhpZGRlbj48L2Rpdj4nKSArCiAgICAnPGRpdiBjbGFzcz0iYXV0aC1mIj48bGFiZWwgZm9yPSJsZ1VzZXIiPuC4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5iTwvbGFiZWw+JyArCiAgICAg',
  'ICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImxnVXNlciIgYXV0b2NvbXBsZXRlPSJ1c2VybmFtZSIgYXV0b2NhcGl0YWxpemU9Im5vbmUiIHNwZWxsY2hlY2s9ImZhbHNlIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJhdXRoLWYiPjxsYWJlbCBmb3I9ImxnUGFz',
  'cyI+4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZPC9sYWJlbD4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0ibGdQYXNzIiB0eXBlPSJwYXNzd29yZCIgYXV0b2NvbXBsZXRlPSJjdXJyZW50LXBhc3N3b3JkIj48L2Rpdj4nICsKICAgICc8YnV0dG9uIGNs',
  'YXNzPSJidG4gcHJpIGF1dGgtZ28iIGlkPSJsZ0dvIj7guYDguILguYnguLLguKrguLnguYjguKPguLDguJrguJo8L2J1dHRvbj4nICsKICAgIChBVVRILmRldmljZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4gYXV0aC1hbHQiIG9uY2xpY2s9InNob3dQaW4oKSI+4oaQ',
  'IOC4geC4peC4seC4muC5hOC4m+C5g+C4iuC5iSBQSU48L2J1dHRvbj4nIDogJycpICsKICAgICc8cCBjbGFzcz0iYXV0aC1mb290Ij7guKXguLfguKHguKPguKvguLHguKrguJzguYjguLLguJk/IOC5g+C4q+C5ieC4nOC4ueC5ieC4lOC4ueC5geC4peC4leC4seC5',
  'ieC4h+C4o+C4q+C4seC4quC5g+C4q+C4oeC5iOC5g+C4q+C5ieC4iOC4suC4geC5gOC4oeC4meC4ueC5g+C4meC4iuC4teC4lTwvcD4nCiAgKTsKCiAgdmFyIGdvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xnR28nKTsKICB2YXIgdXNlciA9IGRvY3VtZW50',
  'LmdldEVsZW1lbnRCeUlkKCdsZ1VzZXInKTsKICB2YXIgcGFzcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsZ1Bhc3MnKTsKCiAgZnVuY3Rpb24gc3VibWl0KCl7CiAgICB2YXIgdSA9IHVzZXIudmFsdWUudHJpbSgpLCBwID0gcGFzcy52YWx1ZTsKICAgIGlm',
  'ICghdSB8fCAhcCkgcmV0dXJuIGF1dGhFcnJvcign4LiB4Lij4Li44LiT4Liy4LiB4Lij4Lit4LiB4LiX4Lix4LmJ4LiH4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmB4Lil4Liw4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZJyk7CiAgICBnby5kaXNhYmxl',
  'ZCA9IHRydWU7CiAgICBnby5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4LiV4Lij4Lin4LiI4Liq4Lit4Lia4oCmJzsKICAgIGNhbGxBcGkoJ2F1dGgubG9naW4nLCB7IHVzZXJuYW1lOiB1LCBwYXNzd29yZDog',
  'cCB9KS50aGVuKGZ1bmN0aW9uKHIpewogICAgICBzYXZlU2Vzc2lvbihyLnNlc3Npb24pOwogICAgICBpZiAoci5tdXN0Q2hhbmdlKSByZXR1cm4gc2hvd0NoYW5nZVBhc3N3b3JkKHRydWUpOwogICAgICByZXR1cm4gY2FsbEFwaSgnYXV0aC5tZScpLnRoZW4oZW50',
  'ZXJBcHApOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgIGdvLmRpc2FibGVkID0gZmFsc2U7CiAgICAgIGdvLnRleHRDb250ZW50ID0gJ+C5gOC4guC5ieC4suC4quC4ueC5iOC4o+C4sOC4muC4mic7CiAgICAgIHBhc3MudmFsdWUgPSAnJzsKICAgICAg',
  'YXV0aEVycm9yKGUubWVzc2FnZSB8fCBlKTsKICAgIH0pOwogIH0KCiAgZ28ub25jbGljayA9IHN1Ym1pdDsKICBbdXNlciwgcGFzc10uZm9yRWFjaChmdW5jdGlvbihlbCl7CiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZXYpeyBp',
  'ZiAoZXYua2V5ID09PSAnRW50ZXInKSBzdWJtaXQoKTsgfSk7CiAgfSk7CiAgdXNlci5mb2N1cygpOwp9CgpmdW5jdGlvbiBhdXRoRXJyb3IobXNnKXsKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXV0aEVycicpOwogIGlmIChlbCkgeyBlbC50',
  'ZXh0Q29udGVudCA9IG1zZzsgZWwuaGlkZGVuID0gZmFsc2U7IH0KICBlbHNlIHNob3dMb2dpbihtc2cpOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4q+C4meC5ieC4siBQSU4gNiDguKvguKXguLHguIEgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gc2hv',
  'd1BpbigpewogIEFVVEguc2NyZWVuID0gJ3Bpbic7CiAgQVVUSC5waW4gPSAnJzsKICBzaG93QXV0aCgKICAgICc8aDIgY2xhc3M9ImF1dGgtaCI+4LmD4Liq4LmIIFBJTjwvaDI+JyArCiAgICAnPHAgY2xhc3M9ImF1dGgtc3ViIj7guJvguKXguJTguKXguYfguK3g',
  'uIHguJTguYnguKfguKLguKPguKvguLHguKogNiDguKvguKXguLHguIHguILguK3guIfguYDguITguKPguLfguYjguK3guIfguJnguLXguYk8L3A+JyArCiAgICAnPGRpdiBjbGFzcz0iYXV0aC1lcnIiIGlkPSJhdXRoRXJyIiBoaWRkZW4+PC9kaXY+JyArCiAgICAn',
  'PGRpdiBjbGFzcz0icGluLWRvdHMiIGlkPSJwaW5Eb3RzIj4nICsgcGluRG90c0h0bWwoJycpICsgJzwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InBpbi1wYWQiPicgKwogICAgICBbMSwyLDMsNCw1LDYsNyw4LDldLm1hcChmdW5jdGlvbihuKXsKICAgICAgICBy',
  'ZXR1cm4gJzxidXR0b24gY2xhc3M9InBpbi1rIiBvbmNsaWNrPSJwaW5QdXNoKFwnJyArIG4gKyAnXCcpIj4nICsgbiArICc8L2J1dHRvbj4nOwogICAgICB9KS5qb2luKCcnKSArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJwaW4tayBnaG9zdCIgb25jbGljaz0ic2hv',
  'd0xvZ2luKCkiIHRpdGxlPSLguYPguIrguYnguKPguKvguLHguKrguJzguYjguLLguJnguYHguJfguJkiPvCflJE8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9InBpbi1rIiBvbmNsaWNrPSJwaW5QdXNoKFwnMFwnKSI+MDwvYnV0dG9uPicgKwogICAg',
  'ICAnPGJ1dHRvbiBjbGFzcz0icGluLWsgZ2hvc3QiIG9uY2xpY2s9InBpbkJhY2soKSIgdGl0bGU9IuC4peC4miI+4oyrPC9idXR0b24+JyArCiAgICAnPC9kaXY+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIGF1dGgtYWx0IiBvbmNsaWNrPSJmb3JnZXRUaGlz',
  'RGV2aWNlKCkiPuC4peC4t+C4oSBQSU4g4oCUIOC5gOC4guC5ieC4suC4lOC5ieC4p+C4ouC4o+C4q+C4seC4quC4nOC5iOC4suC4mTwvYnV0dG9uPicKICApOwoKICAvLyDguITguLXguKLguYzguJrguK3guKPguYzguJTguIjguKPguLTguIfguIHguYfguYPguIrg',
  'uYnguYTguJTguYkg4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LiI4Li04LmJ4Lih4Lib4Li44LmI4Lih4Lia4LiZ4LiI4LitCiAgZG9jdW1lbnQub25rZXlkb3duID0gZnVuY3Rpb24oZXYpewogICAgaWYgKEFVVEguc2NyZWVuICE9PSAncGluJykgcmV0dXJuOwogICAg',
  'aWYgKC9eXGQkLy50ZXN0KGV2LmtleSkpIHBpblB1c2goZXYua2V5KTsKICAgIGVsc2UgaWYgKGV2LmtleSA9PT0gJ0JhY2tzcGFjZScpIHBpbkJhY2soKTsKICB9Owp9CgpmdW5jdGlvbiBwaW5Eb3RzSHRtbChwaW4pewogIHZhciBodG1sID0gJyc7CiAgZm9yICh2',
  'YXIgaSA9IDA7IGkgPCA2OyBpKyspIGh0bWwgKz0gJzxpIGNsYXNzPSInICsgKGkgPCBwaW4ubGVuZ3RoID8gJ29uJyA6ICcnKSArICciPjwvaT4nOwogIHJldHVybiBodG1sOwp9CgpmdW5jdGlvbiBwaW5QdXNoKGQpewogIGlmIChBVVRILnBpbi5sZW5ndGggPj0g',
  'NikgcmV0dXJuOwogIEFVVEgucGluICs9IGQ7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpbkRvdHMnKS5pbm5lckhUTUwgPSBwaW5Eb3RzSHRtbChBVVRILnBpbik7CiAgaWYgKEFVVEgucGluLmxlbmd0aCA9PT0gNikgc2V0VGltZW91dChwaW5TdWJtaXQs',
  'IDEyMCk7Cn0KCmZ1bmN0aW9uIHBpbkJhY2soKXsKICBBVVRILnBpbiA9IEFVVEgucGluLnNsaWNlKDAsIC0xKTsKICB2YXIgZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaW5Eb3RzJyk7CiAgaWYgKGQpIGQuaW5uZXJIVE1MID0gcGluRG90c0h0bWwoQVVU',
  'SC5waW4pOwp9CgpmdW5jdGlvbiBwaW5TdWJtaXQoKXsKICB2YXIgcGluID0gQVVUSC5waW47CiAgQVVUSC5waW4gPSAnJzsKICB2YXIgZG90cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaW5Eb3RzJyk7CiAgaWYgKGRvdHMpIGRvdHMuY2xhc3NMaXN0LmFk',
  'ZCgnYnVzeScpOwoKICBjYWxsQXBpKCdhdXRoLnVubG9jaycsIHsgZGV2aWNlOiBBVVRILmRldmljZSwgcGluOiBwaW4gfSkudGhlbihmdW5jdGlvbihyKXsKICAgIHNhdmVTZXNzaW9uKHIuc2Vzc2lvbik7CiAgICBkb2N1bWVudC5vbmtleWRvd24gPSBudWxsOwog',
  'ICAgcmV0dXJuIGNhbGxBcGkoJ2F1dGgubWUnKS50aGVuKGVudGVyQXBwKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgIHZhciBtc2cgPSBTdHJpbmcoZS5tZXNzYWdlIHx8IGUpOwogICAgaWYgKGRvdHMpIHsgZG90cy5jbGFzc0xpc3QucmVtb3ZlKCdidXN5',
  'Jyk7IGRvdHMuY2xhc3NMaXN0LmFkZCgnc2hha2UnKTsgZG90cy5pbm5lckhUTUwgPSBwaW5Eb3RzSHRtbCgnJyk7IH0KICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgaWYgKGRvdHMpIGRvdHMuY2xhc3NMaXN0LnJlbW92ZSgnc2hha2UnKTsgfSwgNTAwKTsKICAg',
  'IGF1dGhFcnJvcihtc2cpOwogICAgLy8gUElOIOC4luC4ueC4geC4ouC4geC5gOC4peC4tOC4geC5hOC4m+C5geC4peC5ieC4pyAo4Lic4Li04LiU4LiE4Lij4Lia4LmC4LiE4Lin4LiV4LiyIC8g4Lir4Lih4LiU4Lit4Liy4Lii4Li4KSDigJQg4LiV4LmJ4Lit4LiH',
  '4LiB4Lil4Lix4Lia4LmE4Lib4LmD4LiK4LmJ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZCiAgICBpZiAoL+C4peC5h+C4reC4geC4reC4tOC4meC4lOC5ieC4p+C4ouC4o+C4q+C4seC4quC4nOC5iOC4suC4mS8udGVzdChtc2cpKSB7CiAgICAgIHNhdmVEZXZpY2Uo',
  'JycpOwogICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHNob3dMb2dpbihtc2cpOyB9LCAxNDAwKTsKICAgIH0KICB9KTsKfQoKZnVuY3Rpb24gZm9yZ2V0VGhpc0RldmljZSgpewogIHZhciB0b2tlbiA9IEFVVEguZGV2aWNlOwogIHNhdmVEZXZpY2UoJycpOwog',
  'IGxzU2V0KCdtY29ybmVyLnBpbkFza2VkJywgJycpOwogIGRvY3VtZW50Lm9ua2V5ZG93biA9IG51bGw7CiAgaWYgKHRva2VuKSBjYWxsQXBpKCdhdXRoLmZvcmdldERldmljZScsIHsgZGV2aWNlOiB0b2tlbiB9KS5jYXRjaChmdW5jdGlvbigpeyAvKiDguKvguKHg',
  'uJTguK3guLLguKLguLjguYTguJvguYHguKXguYnguKfguIHguYfguIrguYjguLLguIfguKHguLHguJkgKi8gfSk7CiAgc2hvd0xvZ2luKCk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4LiV4Lix4LmJ4LiHIFBJTiAtLS0tLS0tLS0tLS0tLS0tICovCgovKiog4LiK',
  '4Lin4LiZ4LiV4Lix4LmJ4LiHIFBJTiDguKvguKXguLHguIfguKXguYfguK3guIHguK3guLTguJnguITguKPguLHguYnguIfguYHguKPguIHguJrguJnguYDguITguKPguLfguYjguK3guIfguJnguLXguYkgKi8KZnVuY3Rpb24gb2ZmZXJQaW4oKXsKICBsc1NldCgn',
  'bWNvcm5lci5waW5Bc2tlZCcsICcxJyk7CiAgb3Blbk1vZGFsKCfguJXguLHguYnguIcgUElOIOC4quC4s+C4q+C4o+C4seC4muC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5iScsCiAgICAnPHA+4LiV4Lix4LmJ4LiH4Lij4Lir4Lix4LiqIDYg4Lir4Lil4Lix',
  '4LiB4LmE4Lin4LmJIOC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC4leC5ieC4reC4h+C4nuC4tOC4oeC4nuC5jOC4o+C4q+C4seC4quC4nOC5iOC4suC4meC4l+C4uOC4geC4hOC4o+C4seC5ieC4h+C4l+C4teC5iOC5gOC4m+C4tOC4lDwvcD4nICsKICAgICc8cCBj',
  'bGFzcz0ibXV0ZWQgZnMxMyI+UElOIOC4nOC4ueC4geC4geC4seC4muC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5ieC5gOC4hOC4o+C4t+C5iOC4reC4h+C5gOC4lOC4teC4ouC4pyDguYDguITguKPguLfguYjguK3guIfguK3guLfguYjguJnguYPguIrguYng',
  'uYTguKHguYjguYTguJTguYkgwrcg4Lii4LiB4LmA4Lil4Li04LiB4LmA4Lih4Li34LmI4Lit4LmE4Lir4Lij4LmI4LiB4LmH4LmE4LiU4LmJ4LmD4LiZ4Lir4LiZ4LmJ4Liy4LiV4Lix4LmJ4LiH4LiE4LmI4LiyPC9wPicsCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRu',
  'IiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC5hOC4p+C5ieC4geC5iOC4reC4mTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtmb3JtU2V0UGluKCkiPuC4leC4seC5ieC4hyBQSU4g4LmA4Lil4Lii',
  'PC9idXR0b24+Jyk7Cn0KCmZ1bmN0aW9uIGZvcm1TZXRQaW4oKXsKICBvcGVuTW9kYWwoJ+C4leC4seC5ieC4hyBQSU4gNiDguKvguKXguLHguIEnLAogICAgJzxkaXYgY2xhc3M9ImZncmlkIj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYgZnVsbCI+PGxhYmVsIGZv',
  'cj0icGluMSI+UElOIOC5g+C4q+C4oeC5iDwvbGFiZWw+JyArCiAgICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0icGluMSIgdHlwZT0icGFzc3dvcmQiIGlucHV0bW9kZT0ibnVtZXJpYyIgbWF4bGVuZ3RoPSI2IiAnICsKICAgICAgICAnYXV0b2NvbXBsZXRl',
  'PSJuZXctcGFzc3dvcmQiIHBsYWNlaG9sZGVyPSLigKLigKLigKLigKLigKLigKIiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiBmdWxsIj48bGFiZWwgZm9yPSJwaW4yIj7guYPguKrguYggUElOIOC4reC4teC4geC4hOC4o+C4seC5ieC4hzwvbGFiZWw+',
  'JyArCiAgICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0icGluMiIgdHlwZT0icGFzc3dvcmQiIGlucHV0bW9kZT0ibnVtZXJpYyIgbWF4bGVuZ3RoPSI2IiAnICsKICAgICAgICAnYXV0b2NvbXBsZXRlPSJuZXctcGFzc3dvcmQiIHBsYWNlaG9sZGVyPSLigKLi',
  'gKLigKLigKLigKLigKIiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiBmdWxsIj48bGFiZWwgZm9yPSJwaW5EZXYiPuC4iuC4t+C5iOC4reC5gOC4hOC4o+C4t+C5iOC4reC4hyAo4LmE4Lin4LmJ4LiU4Li54Lii4LmJ4Lit4LiZ4Lir4Lil4Lix4LiHKTwv',
  'bGFiZWw+JyArCiAgICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0icGluRGV2IiB2YWx1ZT0iJyArIGVzYyhndWVzc0RldmljZU5hbWUoKSkgKyAnIj48L2Rpdj4nICsKICAgICc8L2Rpdj4nICsKICAgICc8cCBjbGFzcz0ibXV0ZWQgZnMxMyBtdDgiPuC4q+C4',
  'peC4teC4geC5gOC4peC4teC5iOC4ouC4h+C5gOC4peC4guC4l+C4teC5iOC5gOC4lOC4suC4h+C5iOC4suC4oiDguYDguIrguYjguJkgMTExMTExIOC4q+C4o+C4t+C4rSAxMjM0NTY8L3A+JywKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3Nl',
  'TW9kYWwoKSI+4Lii4LiB4LmA4Lil4Li04LiBPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgaWQ9InBpbkdvIj7guJrguLHguJnguJfguLbguIEgUElOPC9idXR0b24+Jyk7CgogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaW5Hbycp',
  'Lm9uY2xpY2sgPSBmdW5jdGlvbigpewogICAgdmFyIGEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGluMScpLnZhbHVlOwogICAgdmFyIGIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGluMicpLnZhbHVlOwogICAgaWYgKCEvXlxkezZ9JC8udGVzdChh',
  'KSkgcmV0dXJuIHRvYXN0KCdQSU4g4LiV4LmJ4Lit4LiH4LmA4Lib4LmH4LiZ4LiV4Lix4Lin4LmA4Lil4LiCIDYg4Lir4Lil4Lix4LiBJywgJ2VycicpOwogICAgaWYgKGEgIT09IGIpIHJldHVybiB0b2FzdCgnUElOIOC4quC4reC4h+C4iuC5iOC4reC4h+C5hOC4',
  'oeC5iOC4leC4o+C4h+C4geC4seC4mScsICdlcnInKTsKICAgIHZhciBidG4gPSB0aGlzOwogICAgYnRuLmRpc2FibGVkID0gdHJ1ZTsKICAgIGJ0bi5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4Lia4Lix4LiZ',
  '4LiX4Li24LiB4oCmJzsKICAgIGNhbGxBcGkoJ2F1dGguc2V0UGluJywgeyBwaW46IGEsIGRldmljZTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpbkRldicpLnZhbHVlIH0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICAgIHNhdmVEZXZpY2Uoci5kZXZpY2UpOwog',
  'ICAgICBjbG9zZU1vZGFsKCk7CiAgICAgIHRvYXN0KCfguJXguLHguYnguIcgUElOIOC5gOC4o+C4teC4ouC4muC4o+C5ieC4reC4oiDigJQg4LiE4Lij4Lix4LmJ4LiH4Lir4LiZ4LmJ4Liy4LmD4Liq4LmI4LmB4LiE4LmIIDYg4Lir4Lil4Lix4LiBJywgJ29rJyk7',
  'CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgYnRuLmRpc2FibGVkID0gZmFsc2U7CiAgICAgIGJ0bi50ZXh0Q29udGVudCA9ICfguJrguLHguJnguJfguLbguIEgUElOJzsKICAgICAgdG9hc3QoZS5tZXNzYWdlIHx8IGUsICdlcnInKTsKICAgIH0pOwog',
  'IH07Cn0KCmZ1bmN0aW9uIGd1ZXNzRGV2aWNlTmFtZSgpewogIHZhciB1YSA9IG5hdmlnYXRvci51c2VyQWdlbnQgfHwgJyc7CiAgaWYgKC9pUGhvbmUvLnRlc3QodWEpKSByZXR1cm4gJ2lQaG9uZSc7CiAgaWYgKC9pUGFkLy50ZXN0KHVhKSkgcmV0dXJuICdpUGFk',
  'JzsKICBpZiAoL0FuZHJvaWQvLnRlc3QodWEpKSByZXR1cm4gJ0FuZHJvaWQnOwogIGlmICgvTWFjaW50b3NoLy50ZXN0KHVhKSkgcmV0dXJuICdNYWMnOwogIGlmICgvV2luZG93cy8udGVzdCh1YSkpIHJldHVybiAnV2luZG93cyc7CiAgcmV0dXJuICfguK3guLjg',
  'uJvguIHguKPguJPguYzguILguK3guIfguInguLHguJknOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC5gOC4m+C4peC4teC5iOC4ouC4meC4o+C4q+C4seC4quC4nOC5iOC4suC4mSAtLS0tLS0tLS0tLS0tLS0tICovCgovKiogQHBhcmFtIHtib29sZWFufSBmb3Jj',
  'ZWQgdHJ1ZSA9IOC4o+C4sOC4muC4muC4muC4seC4h+C4hOC4seC4muC5gOC4m+C4peC4teC5iOC4ouC4meC4leC4reC4meC4peC5h+C4reC4geC4reC4tOC4meC4hOC4o+C4seC5ieC4h+C5geC4o+C4gSAqLwpmdW5jdGlvbiBzaG93Q2hhbmdlUGFzc3dvcmQoZm9y',
  'Y2VkKXsKICBpZiAoIWZvcmNlZCkgcmV0dXJuIGZvcm1DaGFuZ2VQYXNzd29yZCgpOwogIEFVVEguc2NyZWVuID0gJ2NoYW5nZSc7CiAgc2hvd0F1dGgoCiAgICAnPGgyIGNsYXNzPSJhdXRoLWgiPuC4leC4seC5ieC4h+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC4',
  'guC4reC4h+C4hOC4uOC4k+C5gOC4reC4hzwvaDI+JyArCiAgICAnPHAgY2xhc3M9ImF1dGgtc3ViIj7guKPguKvguLHguKrguJfguLXguYjguYTguJTguYnguKHguLLguYDguJvguYfguJnguKPguKvguLHguKrguIrguLHguYjguKfguITguKPguLLguKcg4LmA4Lib',
  '4Lil4Li14LmI4Lii4LiZ4LiB4LmI4Lit4LiZ4LmD4LiK4LmJ4LiH4Liy4LiZ4Lir4LiZ4Li24LmI4LiH4LiE4Lij4Lix4LmJ4LiHPC9wPicgKwogICAgJzxkaXYgY2xhc3M9ImF1dGgtZXJyIiBpZD0iYXV0aEVyciIgaGlkZGVuPjwvZGl2PicgKwogICAgJzxkaXYg',
  'Y2xhc3M9ImF1dGgtZiI+PGxhYmVsIGZvcj0iY3BPbGQiPuC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5gOC4lOC4tOC4oTwvbGFiZWw+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImNwT2xkIiB0eXBlPSJwYXNzd29yZCIgYXV0b2NvbXBsZXRlPSJj',
  'dXJyZW50LXBhc3N3b3JkIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJhdXRoLWYiPjxsYWJlbCBmb3I9ImNwTmV3Ij7guKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYggKOC4reC4ouC5iOC4suC4h+C4meC5ieC4reC4oiA4IOC4leC4seC4pyk8',
  'L2xhYmVsPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJjcE5ldyIgdHlwZT0icGFzc3dvcmQiIGF1dG9jb21wbGV0ZT0ibmV3LXBhc3N3b3JkIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJhdXRoLWYiPjxsYWJlbCBmb3I9ImNwTmV3MiI+4LmD',
  '4Liq4LmI4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmI4Lit4Li14LiB4LiE4Lij4Lix4LmJ4LiHPC9sYWJlbD4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0iY3BOZXcyIiB0eXBlPSJwYXNzd29yZCIgYXV0b2NvbXBsZXRlPSJuZXct',
  'cGFzc3dvcmQiPjwvZGl2PicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgYXV0aC1nbyIgaWQ9ImNwR28iPuC4muC4seC4meC4l+C4tuC4geC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iDwvYnV0dG9uPicKICApOwoKICBkb2N1bWVudC5n',
  'ZXRFbGVtZW50QnlJZCgnY3BHbycpLm9uY2xpY2sgPSBmdW5jdGlvbigpewogICAgdmFyIG8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3BPbGQnKS52YWx1ZTsKICAgIHZhciBuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NwTmV3JykudmFsdWU7CiAg',
  'ICB2YXIgbjIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3BOZXcyJykudmFsdWU7CiAgICBpZiAobi5sZW5ndGggPCA4KSByZXR1cm4gYXV0aEVycm9yKCfguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYjguJXguYnguK3guIfguKLguLLguKfg',
  'uK3guKLguYjguLLguIfguJnguYnguK3guKIgOCDguJXguLHguKfguK3guLHguIHguKnguKMnKTsKICAgIGlmIChuICE9PSBuMikgcmV0dXJuIGF1dGhFcnJvcign4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmI4Liq4Lit4LiH4LiK4LmI4Lit4LiH',
  '4LmE4Lih4LmI4LiV4Lij4LiH4LiB4Lix4LiZJyk7CiAgICB2YXIgYnRuID0gdGhpczsKICAgIGJ0bi5kaXNhYmxlZCA9IHRydWU7CiAgICBidG4uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C4muC4seC4meC4',
  'l+C4tuC4geKApic7CiAgICBjYWxsQXBpKCdhdXRoLmNoYW5nZVBhc3N3b3JkJywgeyBvbGRQYXNzd29yZDogbywgbmV3UGFzc3dvcmQ6IG4gfSkudGhlbihmdW5jdGlvbigpewogICAgICByZXR1cm4gY2FsbEFwaSgnYXV0aC5tZScpLnRoZW4oZW50ZXJBcHApOwog',
  'ICAgfSkudGhlbihmdW5jdGlvbigpewogICAgICB0b2FzdCgn4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmA4Lij4Li14Lii4Lia4Lij4LmJ4Lit4LiiJywgJ29rJyk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAg',
  'YnRuLmRpc2FibGVkID0gZmFsc2U7CiAgICAgIGJ0bi50ZXh0Q29udGVudCA9ICfguJrguLHguJnguJfguLbguIHguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYgnOwogICAgICBhdXRoRXJyb3IoZS5tZXNzYWdlIHx8IGUpOwogICAgfSk7CiAgfTsK',
  'ICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3BPbGQnKS5mb2N1cygpOwp9CgpmdW5jdGlvbiBmb3JtQ2hhbmdlUGFzc3dvcmQoKXsKICBvcGVuTW9kYWwoJ+C5gOC4m+C4peC4teC5iOC4ouC4meC4o+C4q+C4seC4quC4nOC5iOC4suC4mScsCiAgICAnPGRpdiBj',
  'bGFzcz0iZmdyaWQiPicgKwogICAgICAnPGRpdiBjbGFzcz0iZiBmdWxsIj48bGFiZWwgZm9yPSJtY09sZCI+4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmA4LiU4Li04LihPC9sYWJlbD48aW5wdXQgY2xhc3M9ImlucCIgaWQ9Im1jT2xkIiB0eXBlPSJwYXNzd29y',
  'ZCI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIGZ1bGwiPjxsYWJlbCBmb3I9Im1jTmV3Ij7guKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYggKOC4reC4ouC5iOC4suC4h+C4meC5ieC4reC4oiA4IOC4leC4seC4pyk8L2xhYmVsPjxpbnB1',
  'dCBjbGFzcz0iaW5wIiBpZD0ibWNOZXciIHR5cGU9InBhc3N3b3JkIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYgZnVsbCI+PGxhYmVsIGZvcj0ibWNOZXcyIj7guYPguKrguYjguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYjguK3guLXg',
  'uIHguITguKPguLHguYnguIc8L2xhYmVsPjxpbnB1dCBjbGFzcz0iaW5wIiBpZD0ibWNOZXcyIiB0eXBlPSJwYXNzd29yZCI+PC9kaXY+JyArCiAgICAnPC9kaXY+JywKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lii4LiB',
  '4LmA4Lil4Li04LiBPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgaWQ9Im1jR28iPuC4muC4seC4meC4l+C4tuC4gTwvYnV0dG9uPicpOwoKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWNHbycpLm9uY2xpY2sgPSBmdW5jdGlvbigp',
  'ewogICAgdmFyIG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWNOZXcnKS52YWx1ZTsKICAgIGlmIChuLmxlbmd0aCA8IDgpIHJldHVybiB0b2FzdCgn4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmI4LiV4LmJ4Lit4LiH4Lii4Liy4Lin4Lit',
  '4Lii4LmI4Liy4LiH4LiZ4LmJ4Lit4LiiIDgg4LiV4Lix4Lin4Lit4Lix4LiB4Lip4LijJywgJ2VycicpOwogICAgaWYgKG4gIT09IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtY05ldzInKS52YWx1ZSkgcmV0dXJuIHRvYXN0KCfguKPguKvguLHguKrguJzguYjg',
  'uLLguJnguYPguKvguKHguYjguKrguK3guIfguIrguYjguK3guIfguYTguKHguYjguJXguKPguIfguIHguLHguJknLCAnZXJyJyk7CiAgICB2YXIgYnRuID0gdGhpczsKICAgIGJ0bi5kaXNhYmxlZCA9IHRydWU7CiAgICBjYWxsQXBpKCdhdXRoLmNoYW5nZVBhc3N3',
  'b3JkJywgewogICAgICBvbGRQYXNzd29yZDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21jT2xkJykudmFsdWUsIG5ld1Bhc3N3b3JkOiBuCiAgICB9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICAgIGNsb3NlTW9kYWwoKTsKICAgICAgdG9hc3QoJ+C5gOC4m+C4peC4',
  'teC5iOC4ouC4meC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5gOC4o+C4teC4ouC4muC4o+C5ieC4reC4oicsICdvaycpOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlOwogICAgICB0b2FzdChlLm1lc3NhZ2UgfHwg',
  'ZSwgJ2VycicpOwogICAgfSk7CiAgfTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguK3guK3guIHguIjguLLguIHguKPguLDguJrguJogLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gZG9Mb2dvdXQoa2VlcFBpbil7CiAgdmFyIHMgPSBBVVRILnNlc3Npb247',
  'CiAgc2F2ZVNlc3Npb24oJycpOwogIGlmICgha2VlcFBpbikgeyB2YXIgZCA9IEFVVEguZGV2aWNlOyBzYXZlRGV2aWNlKCcnKTsgaWYgKGQpIGNhbGxBcGkoJ2F1dGguZm9yZ2V0RGV2aWNlJywgeyBkZXZpY2U6IGQgfSkuY2F0Y2goZnVuY3Rpb24oKXt9KTsgfQog',
  'IGlmIChzKSBjYWxsQXBpKCdhdXRoLmxvZ291dCcsIHsgX3Nlc3Npb246IHMgfSkuY2F0Y2goZnVuY3Rpb24oKXsgLyog4Lir4Lih4LiU4Lit4Liy4Lii4Li44LmB4Lil4LmJ4Lin4LiB4LmH4LiW4Li34Lit4Lin4LmI4Liy4Lit4Lit4LiB4LmB4Lil4LmJ4LinICov',
  'IH0pOwogIGNsb3NlTW9kYWwoKTsKICBBVVRILm1lID0gbnVsbDsKICBpZiAoQVVUSC5kZXZpY2UpIHNob3dQaW4oKTsgZWxzZSBzaG93TG9naW4oKTsKfQoKZnVuY3Rpb24gY29uZmlybUxvZ291dCgpewogIG9wZW5Nb2RhbCgn4Lit4Lit4LiB4LiI4Liy4LiB4Lij',
  '4Liw4Lia4LiaJywKICAgICc8cD7guJXguYnguK3guIfguIHguLLguKPguK3guK3guIHguIjguLLguIHguKPguLDguJrguJrguYPguIrguYjguYTguKvguKE8L3A+JyArCiAgICAoQVVUSC5kZXZpY2UgPyAnPHAgY2xhc3M9Im11dGVkIGZzMTMiPlBJTiDguJrguJng',
  'uYDguITguKPguLfguYjguK3guIfguJnguLXguYnguIjguLDguKLguLHguIfguK3guKLguLnguYgg4LiE4Lij4Lix4LmJ4LiH4Lir4LiZ4LmJ4Liy4LmA4LiC4LmJ4Liy4LiU4LmJ4Lin4LiiIFBJTiDguYTguJTguYnguYDguKXguKI8L3A+JyA6ICcnKSwKICAgICc8',
  'YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lii4LiB4LmA4Lil4Li04LiBPC9idXR0b24+JyArCiAgICAoQVVUSC5kZXZpY2UgPyAnPGJ1dHRvbiBjbGFzcz0iYnRuIGRnciIgb25jbGljaz0iZG9Mb2dvdXQoZmFsc2UpIj7guK3guK3g',
  'uIHguYHguKXguLDguKXguJogUElOPC9idXR0b24+JyA6ICcnKSArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZG9Mb2dvdXQodHJ1ZSkiPuC4reC4reC4geC4iOC4suC4geC4o+C4sOC4muC4mjwvYnV0dG9uPicpOwp9Cjwvc2NyaXB0Pgo8',
  'c2NyaXB0PgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgVmlld3MuaHRtbCDigJQg4LiV4Lix4Lin4LmC4Lir4Lil4LiUICsg4LiV4Lix4Lin4Lin4Liy4LiU4LiC4Lit4LiH4LmB4LiV4LmI4Lil',
  '4Liw4Lir4LiZ4LmJ4LiyCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKdmFyIFJPVVRFUyA9IHt9OwoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09CiAgIDEpIOC4oOC4suC4nuC4o+C4p+C4oQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLmRhc2hib2FyZCA9IHsKICBsb2FkOiBmdW5jdGlvbigpeyByZXR1',
  'cm4gY2FsbEFwaSgnYXBwLmRhc2hib2FyZCcsIHsgeWVhcjogUy55ZWFyIH0pOyB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgYiA9IGQuYnVpbGRpbmc7CiAgICB2YXIga3BpcyA9CiAgICAgIGtwaSgn4Lii4Lit4LiU4Lir4LiZ4Li14LmJ4LiE4LiH',
  '4LmA4Lir4Lil4Li34Lit4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJywgYmFodChkLmRlYnRBbGwucmVtYWluaW5nKSwKICAgICAgICAgICfguIjguLLguIHguKLguK3guJTguKvguJnguLXguYkgJyArIGJhaHQoZC5kZWJ0QWxsLnRvdGFsRGVidCkgKyAnIMK3IOC4iuC4',
  's+C4o+C4sOC5geC4peC5ieC4pyAnICsgcGN0KGQuZGVidEFsbC5wZXJjZW50KSwgJ2FjY2VudCcpICsKICAgICAga3BpKCfguIrguLPguKPguLDguYHguKXguYnguKcgKOC4q+C4meC4teC5ieC4q+C4peC4seC4gSknLCBwY3QoZC5kZWJ0TWFpbi5wZXJjZW50KSwg',
  'YmFodChkLmRlYnRNYWluLnBhaWQpICsgJyDguIjguLLguIEgJyArIGJhaHQoZC5kZWJ0TWFpbi50b3RhbCksICdnb29kJykgKwogICAgICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC4m+C4tSAnICsgZC55ZWFyLCBiYWh0KGQuc3BlbmRUaGlz',
  'WWVhciksICfguIvguLfguYnguK3guILguK3guIcgKyDguIvguYjguK3guKHguYHguIvguKEgKyDguKXguYnguLLguIfguYHguK3guKPguYwnKSArCiAgICAgIGtwaSgn4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiE4LmJ4Liy4LiHJywgZC5yZXBhaXJzLm9wZW5Kb2Jz',
  'ICsgJyDguIfguLLguJknLCBkLnJlcGFpcnMub3ZlcmR1ZSArICcg4LiH4Liy4LiZ4LmA4LiB4Li04LiZ4LiB4Liz4Lir4LiZ4LiUJywgZC5yZXBhaXJzLm92ZXJkdWUgPyAnYmFkJyA6ICcnKTsKCiAgICB2YXIgYWxlcnRzID0gZC5hbGVydHMubGVuZ3RoCiAgICAg',
  'ID8gJzxkaXYgY2xhc3M9ImFsaXN0Ij4nICsgZC5hbGVydHMuc2xpY2UoMCwxMikubWFwKGZ1bmN0aW9uKGEpewogICAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJhbGkgbC0nICsgYS5sZXZlbCArICciIG9uY2xpY2s9ImdvKFwnJyArIGp1bXBQYWdlKGEubW9k',
  'dWxlKSArICdcJykiPicgKwogICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJpYyI+JyArIGEuaWNvbiArICc8L2Rpdj48ZGl2PjxkaXYgY2xhc3M9InR0Ij4nICsgZXNjKGEudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNz',
  'PSJkZCI+JyArIGVzYyhhLmRldGFpbCkgKyAnPC9kaXY+PC9kaXY+PC9kaXY+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nCiAgICAgIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPuKchTwvZGl2PuC5hOC4oeC5iOC4oeC4teC4',
  'h+C4suC4meC4hOC5ieC4suC4hyDigJQg4LiX4Li44LiB4Lit4Lii4LmI4Liy4LiH4LmA4Lij4Li14Lii4Lia4Lij4LmJ4Lit4LiiPC9kaXY+JzsKCiAgICByZXR1cm4gJycgKwogICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsga3BpcyArICc8L2Rp',
  'dj4nICsKCiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGcyIG1iMTIiPicgKwogICAgICAgIGNhcmQoJ/CfkrAg4Lij4Liy4Lii4LiB4Liy4Lij4Liq4Lij4Li44Lib4Lij4Lin4LihICjguKvguJnguLXguYnguKvguKXguLHguIEpJywKICAgICAgICAgIGRlYnRNaW5p',
  'KGQuZGVidE1haW4sICdkZWJ0TWFpbicpLAogICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZ28oXCdkZWJ0TWFpblwnKSI+4LiU4Li54LiX4Lix4LmJ4LiH4Lir4Lih4LiUIOKGkjwvYnV0dG9uPicpICsKICAgICAgICBjYXJkKCfwn6e+',
  'IOC4q+C4meC4teC5ieC4quC4tOC4mSAo4Lir4LiZ4Li14LmJ4Lij4Lit4LiHKScsCiAgICAgICAgICBkZWJ0TWluaShkLmRlYnRTdWIsICdkZWJ0U3ViJykgKwogICAgICAgICAgKGQuZGVidFN1Yi5pbnRlcmVzdFRoaXNZZWFyID8gJzxkaXYgY2xhc3M9ImZzMTIg',
  'bXV0ZWQgbXQ4Ij7guJTguK3guIHguYDguJrguLXguYnguKLguJfguLXguYjguIrguLPguKPguLDguJvguLUgJyArIGQueWVhciArICc6IDxiPicgKyBiYWh0KGQuZGVidFN1Yi5pbnRlcmVzdFRoaXNZZWFyKSArICc8L2I+PC9kaXY+JyA6ICcnKSwKICAgICAgICAg',
  'ICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImdvKFwnZGVidFN1YlwnKSI+4LiU4Li54LiX4Lix4LmJ4LiH4Lir4Lih4LiUIOKGkjwvYnV0dG9uPicpICsKICAgICAgJzwvZGl2PicgKwoKICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyAr',
  'CiAgICAgICAga3BpKCfguKvguYnguK3guIfguJfguLHguYnguIfguKvguKHguJQnLCBiLnRvdGFsUm9vbXMgKyAnIOC4q+C5ieC4reC4hycsICfguKHguLXguJzguLnguYnguYDguIrguYjguLIgJyArIGIub2NjdXBpZWQgKyAnIMK3IOC4p+C5iOC4suC4hyAnICsg',
  'Yi52YWNhbnQpICsKICAgICAgICBrcGkoJ+C4peC5ieC4suC4h+C5geC4reC4o+C5jOC4m+C4tSAnICsgZC55ZWFyLCBkLmFjLnJvb21zRG9uZSArICcvJyArIGIudG90YWxSb29tcyArICcg4Lir4LmJ4Lit4LiHJywgZC5hYy5kb25lSW5ZZWFyICsgJyDguKPguK3g',
  'uJogwrcg4LiE4LmJ4Liy4LiHICcgKyBkLmFjLnJvb21zUGVuZGluZyArICcg4Lir4LmJ4Lit4LiHJywgZC5hYy5yb29tc1BlbmRpbmcgPyAnd2FybicgOiAnZ29vZCcpICsKICAgICAgICBrcGkoJ+C4i+C4t+C5ieC4reC4guC4reC4h+C4m+C4tSAnICsgZC55ZWFy',
  'LCBiYWh0KGQucHVyY2hhc2VzLnllYXJUb3RhbCksIGQucHVyY2hhc2VzLnllYXJDb3VudCArICcg4Lij4Liy4Lii4LiB4Liy4LijJykgKwogICAgICAgIGtwaSgn4Lib4Lij4Liw4LiB4Lix4LiZ4LmD4LiB4Lil4LmJ4Lir4Lih4LiUJywgZC5wdXJjaGFzZXMud2Fy',
  'cmFudHkuZXhwaXJpbmcgKyAnIOC4o+C4suC4ouC4geC4suC4oycsICfguKvguKHguJTguK3guLLguKLguLjguYHguKXguYnguKcgJyArIGQucHVyY2hhc2VzLndhcnJhbnR5LmV4cGlyZWQsIGQucHVyY2hhc2VzLndhcnJhbnR5LmV4cGlyaW5nID8gJ3dhcm4nIDog',
  'JycpICsKICAgICAgJzwvZGl2PicgKwoKICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzIgbWIxMiI+JyArCiAgICAgICAgY2FyZCgn8J+TkiDguKPguLLguKLguKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4Lii4Lir4LitIOC4m+C4tSAnICsgZC55ZWFyLAogICAg',
  'ICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzMgbWIxMiI+JyArCiAgICAgICAgICAgIGtwaSgn4Lij4Liy4Lii4Lij4Lix4LiaJywgYmFodChkLmZpbmFuY2UuaW5jb21lKSwgJ+C5gOC4ieC4peC4teC5iOC4oiAnICsgYmFodChkLmZpbmFuY2UuYXZnSW5jb21lKSAr',
  'ICcv4LmA4LiU4Li34Lit4LiZJywgJ2dvb2QnKSArCiAgICAgICAgICAgIGtwaSgn4Lij4Liy4Lii4LiI4LmI4Liy4LiiJywgYmFodChkLmZpbmFuY2UuZXhwZW5zZSksICfguYDguInguKXguLXguYjguKIgJyArIGJhaHQoZC5maW5hbmNlLmF2Z0V4cGVuc2UpICsg',
  'Jy/guYDguJTguLfguK3guJknLCAnYmFkJykgKwogICAgICAgICAgICBrcGkoJ+C4hOC4h+C5gOC4q+C4peC4t+C4reC4quC4uOC4l+C4mOC4tCcsIGJhaHQoZC5maW5hbmNlLm5ldCksICfguK3guLHguJXguKPguLLguIHguLPguYTguKMgJyArIHBjdChkLmZpbmFu',
  'Y2UubWFyZ2luKSkgKwogICAgICAgICAgJzwvZGl2PicgKyBtaW5pTW9udGhDaGFydChkLmZpbmFuY2UuYnlNb250aCksCiAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJnbyhcJ2ZpbmFuY2VcJykiPuC4lOC4ueC4l+C4seC5ieC4h+C4',
  'q+C4oeC4lCDihpI8L2J1dHRvbj4nKSArCiAgICAgICAgY2FyZCgn8J+Xk++4jyDguIfguLLguJnguJfguLXguYjguIHguLPguKXguLHguIfguIjguLDguJbguLbguIcgKCcgKyBkLnVwY29taW5nLmxlbmd0aCArICcpJywKICAgICAgICAgIGQudXBjb21pbmcubGVu',
  'Z3RoID8gJzxkaXYgY2xhc3M9ImFsaXN0Ij4nICsgZC51cGNvbWluZy5zbGljZSgwLDcpLm1hcChmdW5jdGlvbih1KXsKICAgICAgICAgICAgdmFyIGx2bCA9IHUuZGF5c0xlZnQgPCAwID8gJ2RhbmdlcicgOiAodS5kYXlzTGVmdCA8PSA3ID8gJ3dhcm4nIDogJ2lu',
  'Zm8nKTsKICAgICAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJhbGkgbC0nICsgbHZsICsgJyIgb25jbGljaz0iZ28oXCcnICsganVtcFBhZ2UodS5tb2R1bGUpICsgJ1wnKSI+JyArCiAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImljIj4nICsgdS5pY29uICsg',
  'JzwvZGl2PjxkaXY+PGRpdiBjbGFzcz0idHQiPicgKyBlc2ModS50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImRkIj4nICsgdGhEYXRlKHUuZGF0ZSkgKyAnIMK3ICcgKwogICAgICAgICAgICAgICAgKHUuZGF5c0xlZnQgPCAw',
  'ID8gJ+C5gOC4peC4ouC4geC4s+C4q+C4meC4lCAnICsgKC11LmRheXNMZWZ0KSArICcg4Lin4Lix4LiZJyA6ICh1LmRheXNMZWZ0ID09PSAwID8gJ+C4p+C4seC4meC4meC4teC5iScgOiAn4Lit4Li14LiBICcgKyB1LmRheXNMZWZ0ICsgJyDguKfguLHguJknKSkg',
  'KwogICAgICAgICAgICAgICc8L2Rpdj48L2Rpdj48L2Rpdj4nOwogICAgICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JyA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj7wn4yk77iPPC9kaXY+4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ4LiZ',
  '4Lix4LiU4Lir4Lih4Liy4Lii4LmA4Lij4LmH4LinIOC5hiDguJnguLXguYk8L2Rpdj4nLAogICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZ28oXCdyZXBvcnRzXCcpIj7guJvguI/guLTguJfguLTguJnguYDguJXguYfguKEg4oaSPC9i',
  'dXR0b24+JywgdHJ1ZSkgKwogICAgICAnPC9kaXY+JyArCgogICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMiI+JyArCiAgICAgICAgY2FyZCgn8J+UlCDguKrguLTguYjguIfguJfguLXguYjguJXguYnguK3guIfguJfguLMgKCcgKyBkLmFsZXJ0cy5sZW5ndGggKyAn',
  'KScsIGFsZXJ0cywgJycsIHRydWUpICsKICAgICAgICBjYXJkKCfwn4+iIOC4h+C4suC4meC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oScsCiAgICAgICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMiI+JyArCiAgICAgICAgICAg',
  'IGtwaSgn4LiH4Liy4LiZ4Lib4Li1ICcgKyBkLnllYXIsIGQuYnVpbGRpbmdSZXBhaXJzLnllYXJDb3VudCArICcg4LiH4Liy4LiZJywgJ+C4hOC5ieC4suC4hyAnICsgZC5idWlsZGluZ1JlcGFpcnMub3BlbkNvdW50KSArCiAgICAgICAgICAgIGtwaSgn4LiE4LmI',
  '4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiJywgYmFodChkLmJ1aWxkaW5nUmVwYWlycy55ZWFyQ29zdCksICfguITguKPguJrguIHguLPguKvguJnguJTguYDguKPguYfguKcg4LmGIOC4meC4teC5iSAnICsgZC5idWlsZGluZ1JlcGFpcnMudXBjb21pbmcpICsKICAg',
  'ICAgICAgICc8L2Rpdj4nICsKICAgICAgICAgIChkLmRlYnRNYWluLmZvcmVjYXN0ICYmIGQuZGVidE1haW4uZm9yZWNhc3QubW9udGhzTGVmdAogICAgICAgICAgICA/ICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+PGRpdiBjbGFzcz0iZnMxMyI+PGI+4Lib4Lij4Liw',
  '4Lih4Liy4LiT4LiB4Liy4Lij4Lib4Li04LiU4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiBPC9iPjxkaXYgY2xhc3M9Im11dGVkIG10OCI+JyArCiAgICAgICAgICAgICAgJ+C4iOC4suC4geC4reC4seC4leC4o+C4suC4iuC4s+C4o+C4sOC5gOC4ieC4peC4teC5iOC4',
  'oiAnICsgYmFodChkLmRlYnRNYWluLmZvcmVjYXN0LmF2Z1Blck1vbnRoKSArICcv4LmA4LiU4Li34Lit4LiZICgxMiDguYDguJTguLfguK3guJnguKXguYjguLLguKrguLjguJQpICcgKwogICAgICAgICAgICAgICfguITguLLguJTguKfguYjguLLguK3guLXguIEg',
  'PGI+JyArIGQuZGVidE1haW4uZm9yZWNhc3QubW9udGhzTGVmdCArICcg4LmA4LiU4Li34Lit4LiZPC9iPiAnICsKICAgICAgICAgICAgICAnKOC4o+C4suC4pyAnICsgdGhEYXRlKGQuZGVidE1haW4uZm9yZWNhc3QucGF5b2ZmRGF0ZSkgKyAnKTwvZGl2PjwvZGl2',
  'PicKICAgICAgICAgICAgOiAnJyksCiAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJnbyhcJ2J1aWxkaW5nXCcpIj7guJTguLnguJfguLHguYnguIfguKvguKHguJQg4oaSPC9idXR0b24+JykgKwogICAgICAnPC9kaXY+JzsKICB9LAog',
  'IGFmdGVyOiBmdW5jdGlvbihkKXsKICAgIHNldEJhZGdlKCdyZXBhaXJzJywgZC5yZXBhaXJzLm9wZW5Kb2JzKTsKICAgIHNldEJhZGdlKCdhYycsIGQuYWMucm9vbXNQZW5kaW5nKTsKICB9Cn07CgpmdW5jdGlvbiBtaW5pTW9udGhDaGFydChieU1vbnRoKXsKICB2',
  'YXIgbWF4ID0gTWF0aC5tYXguYXBwbHkobnVsbCwgYnlNb250aC5tYXAoZnVuY3Rpb24obSl7IHJldHVybiBNYXRoLm1heChtLmluY29tZSwgbS5leHBlbnNlKTsgfSkpIHx8IDE7CiAgcmV0dXJuICc8ZGl2IHN0eWxlPSJkaXNwbGF5OmZsZXg7Z2FwOjNweDthbGln',
  'bi1pdGVtczpmbGV4LWVuZDtoZWlnaHQ6NzRweCI+JyArIGJ5TW9udGgubWFwKGZ1bmN0aW9uKG0pewogICAgdmFyIGhpID0gTWF0aC5yb3VuZChtLmluY29tZSAvIG1heCAqIDY2KSwgaGUgPSBNYXRoLnJvdW5kKG0uZXhwZW5zZSAvIG1heCAqIDY2KTsKICAgIHJl',
  'dHVybiAnPGRpdiBzdHlsZT0iZmxleDoxO3RleHQtYWxpZ246Y2VudGVyIiB0aXRsZT0iJyArIG0ubGFiZWwgKyAnIMK3IOC4o+C4seC4miAnICsgbW9uZXkobS5pbmNvbWUpICsgJyDCtyDguIjguYjguLLguKIgJyArIG1vbmV5KG0uZXhwZW5zZSkgKyAnIj4nICsK',
  'ICAgICAgJzxkaXYgc3R5bGU9ImRpc3BsYXk6ZmxleDtnYXA6MXB4O2FsaWduLWl0ZW1zOmZsZXgtZW5kO2p1c3RpZnktY29udGVudDpjZW50ZXI7aGVpZ2h0OjY2cHgiPicgKwogICAgICAgICc8ZGl2IHN0eWxlPSJ3aWR0aDo2cHg7aGVpZ2h0OicgKyBoaSArICdw',
  'eDtiYWNrZ3JvdW5kOnZhcigtLW9rKTtib3JkZXItcmFkaXVzOjJweCAycHggMCAwIj48L2Rpdj4nICsKICAgICAgICAnPGRpdiBzdHlsZT0id2lkdGg6NnB4O2hlaWdodDonICsgaGUgKyAncHg7YmFja2dyb3VuZDp2YXIoLS1kYW5nZXIpO2JvcmRlci1yYWRpdXM6',
  'MnB4IDJweCAwIDAiPjwvZGl2PicgKwogICAgICAnPC9kaXY+PGRpdiBjbGFzcz0iZmFpbnQiIHN0eWxlPSJmb250LXNpemU6OS41cHgiPicgKyBtLmxhYmVsLnJlcGxhY2UoJy4nLCcnKSArICc8L2Rpdj48L2Rpdj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2Picg',
  'KwogICc8ZGl2IGNsYXNzPSJyb3cgZnMxMiBtdXRlZCBtdDgiPjxzcGFuIGNsYXNzPSJiIG9rIj7guKPguLLguKLguKPguLHguJo8L3NwYW4+PHNwYW4gY2xhc3M9ImIgZGdyIj7guKPguLLguKLguIjguYjguLLguKI8L3NwYW4+PC9kaXY+JzsKfQoKZnVuY3Rpb24g',
  'ZGVidE1pbmkoeCwgcGFnZSl7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJwbWV0YSIgc3R5bGU9Im1hcmdpbjowIDAgNnB4Ij48c3Bhbj7guIrguLPguKPguLDguYHguKXguYnguKcgPGI+JyArIGJhaHQoeC5wYWlkKSArICc8L2I+PC9zcGFuPicgKwogICAgICAgICAn',
  'PHNwYW4+PGI+JyArIHBjdCh4LnBlcmNlbnQpICsgJzwvYj48L3NwYW4+PC9kaXY+JyArCiAgICAgICAgIHByb2dyZXNzKHgucGVyY2VudCwgJ2xnJykgKwogICAgICAgICAnPGRpdiBjbGFzcz0icG1ldGEiPjxzcGFuPuC4hOC4h+C5gOC4q+C4peC4t+C4rSA8Yj4n',
  'ICsgYmFodCh4LnJlbWFpbmluZykgKyAnPC9iPjwvc3Bhbj4nICsKICAgICAgICAgJzxzcGFuPuC4ouC4reC4lOC4q+C4meC4teC5ieC4l+C4seC5ieC4h+C4q+C4oeC4lCA8Yj4nICsgYmFodCh4LnRvdGFsKSArICc8L2I+PC9zcGFuPjwvZGl2PicgKwogICAgICAg',
  'ICAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtdDgiPuC4iuC4s+C4o+C4sOC5g+C4meC4m+C4teC4l+C4teC5iOC5gOC4peC4t+C4reC4gTogPGI+JyArIGJhaHQoeC50aGlzWWVhcikgKyAnPC9iPjwvZGl2Pic7Cn0KCmZ1bmN0aW9uIHNldEJhZGdlKHBhZ2UsIG4p',
  'ewogIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiYWRnZS0nICsgcGFnZSk7CiAgaWYgKCFlbCkgcmV0dXJuOwogIGlmIChuID4gMCkgeyBlbC50ZXh0Q29udGVudCA9IG47IGVsLnN0eWxlLmRpc3BsYXkgPSAnJzsgfQogIGVsc2UgZWwuc3R5bGUu',
  'ZGlzcGxheSA9ICdub25lJzsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDIpIOC4q+C4meC4teC5ieC4q+C4peC4seC4gSAvIOC4q+C4meC4teC5ieC4o+C4reC4hyAo4LmD4LiK4LmJ',
  '4LiV4Lix4Lin4Lin4Liy4LiU4Lij4LmI4Lin4Lih4LiB4Lix4LiZKQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZGVidFJvdXRlKGxlZGdlciwgdGl0bGUpewogIHJldHVy',
  'biB7CiAgICBsb2FkOiBmdW5jdGlvbigpewogICAgICByZXR1cm4gUHJvbWlzZS5hbGwoWwogICAgICAgIGNhbGxBcGkoJ2RlYnQuc3VtbWFyeScsIHsgbGVkZ2VyOiBsZWRnZXIsIHllYXI6IFMueWVhciB9KSwKICAgICAgICBjYWxsQXBpKCdkZWJ0LnBheW1lbnRz',
  'JywgeyBsZWRnZXI6IGxlZGdlciwgeWVhcjogUy55ZWFyIH0pCiAgICAgIF0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICAgICAgdmFyIGQgPSByWzBdOyBkLnBheW1lbnRzID0gclsxXTsgZC5sZWRnZXIgPSBsZWRnZXI7IGQucGFnZVRpdGxlID0gdGl0bGU7CiAgICAg',
  'ICAgcmV0dXJuIGQ7CiAgICAgIH0pOwogICAgfSwKICAgIHJlbmRlcjogcmVuZGVyRGVidCwKICAgIGFmdGVyOiBjYWNoZUFsbERlYnRzCiAgfTsKfQpST1VURVMuZGVidE1haW4gPSBkZWJ0Um91dGUoJ+C4q+C4meC4teC5ieC4q+C4peC4seC4gScsICfguKPguLLg',
  'uKLguIHguLLguKPguKrguKPguLjguJvguKPguKfguKEgVGhlIE0gQ29ybmVyIEFQJyk7ClJPVVRFUy5kZWJ0U3ViICA9IGRlYnRSb3V0ZSgn4Lir4LiZ4Li14LmJ4Lij4Lit4LiHJywgJ+C4q+C4meC4teC5ieC4quC4tOC4mScpOwoKLyoqIOC5gOC4geC5h+C4muC4',
  'o+C4suC4ouC4iuC4t+C5iOC4reC4geC5ieC4reC4meC4q+C4meC4teC5ieC4l+C4uOC4geC4muC4seC4jeC4iuC4teC5hOC4p+C5ieC5g+C4q+C5ieC4n+C4reC4o+C5jOC4oeC5gOC4peC4t+C4reC4gSAi4LmA4Lib4LmH4LiZ4Liq4LmI4Lin4LiZ4Lir4LiZ4Li2',
  '4LmI4LiH4LiC4Lit4LiHIiAqLwpmdW5jdGlvbiBjYWNoZUFsbERlYnRzKCl7CiAgY2FsbEFwaSgnZGVidC5saXN0Jywge30pLnRoZW4oZnVuY3Rpb24obGlzdCl7CiAgICBBTExfREVCVFMgPSBsaXN0Lm1hcChmdW5jdGlvbihkKXsKICAgICAgcmV0dXJuIHsgaWQ6',
  'IGQuaWQsIHRpdGxlOiBkLnRpdGxlLCBsZWRnZXI6IGQubGVkZ2VyLCBwYXJlbnRJZDogZC5wYXJlbnRJZCB8fCAnJyB9OwogICAgfSk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oKXt9KTsKfQoKZnVuY3Rpb24gcmVuZGVyRGVidChkKXsKICB2YXIgeWVhckxhYmVsID0g',
  'Uy55ZWFyID09PSAnYWxsJyA/ICfguJfguLjguIHguJvguLUnIDogJ+C4m+C4tSAnICsgUy55ZWFyOwoKICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJjYXJkIG1iMTIiPjxkaXYgY2xhc3M9ImNhcmQtYiI+JyArCiAgICAnPGRpdiBjbGFzcz0icm93IG1iMTIiPjxo',
  'MyBzdHlsZT0ibWFyZ2luOjA7Zm9udC1zaXplOjE1cHgiPicgKyBlc2MoZC5wYWdlVGl0bGUpICsgJzwvaDM+JyArCiAgICAnPHNwYW4gY2xhc3M9InNwIj48L3NwYW4+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSBzbSIgb25jbGljaz0iZm9ybURlYnRQ',
  'YXltZW50KG51bGwsXCcnICsgZC5sZWRnZXIgKyAnXCcpIj4rIOC4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C4iuC4s+C4o+C4sDwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZm9ybURlYnQobnVsbCxcJycgKyBkLmxl',
  'ZGdlciArICdcJykiPisg4LmA4Lie4Li04LmI4Lih4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJPC9idXR0b24+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0icG1ldGEiIHN0eWxlPSJtYXJnaW46MCAwIDdweCI+PHNwYW4+4LiE4Lin4Liy4Lih4LiE4Li34Lia4Lir',
  '4LiZ4LmJ4Liy4LiB4Liy4Lij4LiK4Liz4Lij4LiwPC9zcGFuPjxzcGFuPjxiPicgKyBwY3QoZC5wZXJjZW50KSArICc8L2I+PC9zcGFuPjwvZGl2PicgKwogICAgcHJvZ3Jlc3MoZC5wZXJjZW50LCAnbGcgJyArIChkLnBlcmNlbnQgPj0gMTAwID8gJ29rJyA6ICcn',
  'KSkgKwogICAgJzxkaXYgY2xhc3M9ImdyaWQgZzQgbXQxNiI+JyArCiAgICAgIGtwaSgn4Lii4Lit4LiU4Lir4LiZ4Li14LmJ4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJywgYmFodChkLnRvdGFsRGVidCksIGQuZGVidHMubGVuZ3RoICsgJyDguIHguYnguK3guJnguKvg',
  'uJnguLXguYknKSArCiAgICAgIGtwaSgn4LiK4Liz4Lij4Liw4LmB4Lil4LmJ4LinJywgYmFodChkLnBhaWQpLCBkLnBheW1lbnRDb3VudCArICcg4Lij4Liy4Lii4LiB4Liy4Lij4LmC4Lit4LiZJywgJ2dvb2QnKSArCiAgICAgIGtwaSgn4LiE4LiH4LmA4Lir4Lil',
  '4Li34LitJywgYmFodChkLnJlbWFpbmluZyksICfguK3guLXguIEgJyArIHBjdCgxMDAgLSBkLnBlcmNlbnQpICsgJyDguIjguLDguJvguLTguJTguKvguJnguLXguYknLCAnYmFkJykgKwogICAgICBrcGkoJ+C4iuC4s+C4o+C4sOC5g+C4mScgKyB5ZWFyTGFiZWws',
  'IGJhaHQoZC5zZWxlY3RlZFllYXJQYWlkKSwgZC5zZWxlY3RlZFllYXJDb3VudCArICcg4Lij4Liy4Lii4LiB4Liy4LijJyArCiAgICAgICAgICAoZC5zZWxlY3RlZFllYXJJbnRlcmVzdCA/ICcgwrcg4LiU4Lit4LiB4LmA4Lia4Li14LmJ4LiiICcgKyBiYWh0KGQu',
  'c2VsZWN0ZWRZZWFySW50ZXJlc3QpIDogJycpKSArCiAgICAnPC9kaXY+PC9kaXY+PC9kaXY+JzsKCiAgdmFyIHBlckRlYnQgPSBkLmRlYnRzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJncmlkIGctYXV0byBtYjEyIj4nICsgZC5kZWJ0cy5tYXAoZnVuY3Rpb24oeCl7',
  'CiAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImNhcmQiPjxkaXYgY2xhc3M9ImNhcmQtYiI+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJjbGlwIiBzdHlsZT0iZm9udC13ZWlnaHQ6NjUwO2ZvbnQtc2l6ZToxMy41cHg7bWluLWhlaWdodDozOHB4Ij4nICsgZXNjKHgudGl0',
  'bGUpICsgJzwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0icm93IGZzMTIgbXV0ZWQgbWI4Ij4nICsgc3RhdHVzQmFkZ2UoeC5zdGF0dXMpICsKICAgICAgICAnPHNwYW4+JyArIGVzYyh4LmNyZWRpdG9yIHx8ICfigJMnKSArICh4LnN0YXJ0RGF0ZSA/ICcgwrcg',
  'JyArIHRoRGF0ZSh4LnN0YXJ0RGF0ZSkgOiAnJykgKyAnPC9zcGFuPjwvZGl2PicgKwogICAgICAoeC5wYXJlbnRUaXRsZQogICAgICAgID8gJzxkaXYgY2xhc3M9ImIgaW5mbyBtYjgiIHRpdGxlPSLguKLguK3guJTguIHguYnguK3guJnguJnguLXguYnguK3guKLg',
  'uLnguYjguYPguJnguIHguYnguK3guJnguYHguKHguYjguYHguKXguYnguKcg4LiI4LmI4Liy4Lii4LiE4Li34LiZ4LiB4LmJ4Lit4LiZ4LiZ4Li14LmJ4LiB4LmJ4Lit4LiZ4LmB4Lih4LmI4LiI4Liw4Lil4LiU4LiV4Liy4LihIj4nICsKICAgICAgICAgICfihrMg',
  '4LmA4Lib4LmH4LiZ4Liq4LmI4Lin4LiZ4Lir4LiZ4Li24LmI4LiH4LiC4Lit4LiHICcgKyBlc2MoeC5wYXJlbnRUaXRsZSkgKyAnPC9kaXY+JwogICAgICAgIDogJycpICsKICAgICAgcHJvZ3Jlc3MoeC5wZXJjZW50KSArCiAgICAgICc8ZGl2IGNsYXNzPSJwbWV0',
  'YSI+PHNwYW4+4LiK4Liz4Lij4LiwIDxiPicgKyBiYWh0KHgucGFpZCkgKyAnPC9iPjwvc3Bhbj48c3Bhbj7guITguIfguYDguKvguKXguLfguK0gPGI+JyArIGJhaHQoeC5yZW1haW5pbmcpICsgJzwvYj48L3NwYW4+PC9kaXY+JyArCiAgICAgICh4LmNoaWxkcmVu',
  'ICYmIHguY2hpbGRyZW4ubGVuZ3RoCiAgICAgICAgPyAnPGRpdiBjbGFzcz0iaHIiIHN0eWxlPSJtYXJnaW46MTJweCAwIDEwcHgiPjwvZGl2PicgKwogICAgICAgICAgJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbWI4Ij7guYPguJnguKLguK3guJTguJnguLXguYng',
  'uKHguLXguIHguYnguK3guJnguKLguYjguK3guKLguK3guKLguLnguYggJyArIHguY2hpbGRyZW4ubGVuZ3RoICsgJyDguIHguYnguK3guJk8L2Rpdj4nICsKICAgICAgICAgIHguY2hpbGRyZW4ubWFwKGZ1bmN0aW9uKGMpewogICAgICAgICAgICByZXR1cm4gJzxk',
  'aXYgY2xhc3M9Im1iOCI+JyArCiAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9InJvdyBmczEyIj48c3Bhbj7ihrMgJyArIGVzYyhjLnRpdGxlKSArICc8L3NwYW4+JyArCiAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPSJzcCBtb25vIj4nICsgbW9uZXkoYy5wYWlk',
  'KSArICcgLyAnICsgbW9uZXkoYy5wcmluY2lwYWwpICsgJzwvc3Bhbj48L2Rpdj4nICsKICAgICAgICAgICAgICBwcm9ncmVzcyhjLnBlcmNlbnQsICdvaycpICsgJzwvZGl2Pic7CiAgICAgICAgICB9KS5qb2luKCcnKSArCiAgICAgICAgICAoeC5wYWlkRnJvbUNo',
  'aWxkcmVuID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQiPuC4o+C4p+C4oeC4ouC4reC4lOC4l+C4teC5iOC4oeC4suC4iOC4suC4geC4geC5ieC4reC4meC4ouC5iOC4reC4oiAnICsgYmFodCh4LnBhaWRGcm9tQ2hpbGRyZW4pICsgJzwvZGl2PicgOiAnJykKICAg',
  'ICAgICA6ICcnKSArCiAgICAgICh4LmludGVyZXN0UGVyTW9udGggPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtdDgiPuC4lOC4reC4geC5gOC4muC4teC5ieC4oiAnICsgYmFodCh4LmludGVyZXN0UGVyTW9udGgpICsgJy/guYDguJTguLfguK3guJk8L2Rpdj4n',
  'IDogJycpICsKICAgICAgKHgucGxhblBlck1vbnRoID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQiPuC5geC4nOC4meC4nOC5iOC4reC4mSAnICsgYmFodCh4LnBsYW5QZXJNb250aCkgKyAnL+C5gOC4lOC4t+C4reC4mTwvZGl2PicgOiAnJykgKwogICAgICAnPGRp',
  'diBjbGFzcz0icm93IG10MTIiPjxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz1cJ2Zvcm1EZWJ0KCcgKyBhdHRyKHgpICsgJywiJyArIGQubGVkZ2VyICsgJyIpXCc+4LmB4LiB4LmJ4LmE4LiCPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJi',
  'dG4gc20gZGdyIiBvbmNsaWNrPSJkZWxEZWJ0KFwnJyArIHguaWQgKyAnXCcpIj7guKXguJo8L2J1dHRvbj48L2Rpdj4nICsKICAgICc8L2Rpdj48L2Rpdj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2PicgOiAnJzsKCiAgdmFyIGJ5WWVhciA9IGQuYnlZZWFyLmxl',
  'bmd0aCA/IGNhcmQoJ/Cfk4Ug4Lii4Lit4LiU4LiK4Liz4Lij4Liw4LmB4Lii4LiB4LiV4Liy4Lih4Lib4Li1JywKICAgICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0Ij48dGhlYWQ+PHRyPicgKwogICAgJzx0aD7guJvguLU8L3RoPjx0aCBjbGFzcz0i',
  'bnVtIj7guYDguIfguLTguJnguJXguYnguJk8L3RoPjx0aCBjbGFzcz0ibnVtIj7guJTguK3guIHguYDguJrguLXguYnguKI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKPguKfguKHguJfguLXguYjguYLguK3guJk8L3RoPicgKwogICAgJzx0aCBjbGFzcz0ibnVtIj7g',
  'uIjguLPguJnguKfguJnguITguKPguLHguYnguIc8L3RoPjx0aCBjbGFzcz0ibnVtIj7guYDguIfguLTguJnguJXguYnguJnguKrguLDguKrguKE8L3RoPjx0aCBzdHlsZT0id2lkdGg6MjYlIj7guITguKfguLLguKHguITguLfguJrguKvguJnguYnguLLguKrguLDg',
  'uKrguKE8L3RoPicgKwogICAgJzwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICBkLmJ5WWVhci5tYXAoZnVuY3Rpb24oeSl7CiAgICAgIHZhciBjdW0gPSB5LmN1bXVsYXRpdmUgIT0gbnVsbCA/IHkuY3VtdWxhdGl2ZSA6IDA7CiAgICAgIHZhciBwID0gZC50b3Rh',
  'bERlYnQgPyAoY3VtIC8gZC50b3RhbERlYnQgKiAxMDApIDogMDsKICAgICAgcmV0dXJuICc8dHIgb25jbGljaz0ic2V0WWVhckZyb21UYWJsZSgnICsgeS55ZWFyICsgJykiIHN0eWxlPSJjdXJzb3I6cG9pbnRlciI+JyArCiAgICAgICAgJzx0ZD48Yj4nICsgeS55',
  'ZWFyICsgJzwvYj4gPHNwYW4gY2xhc3M9ImZhaW50IGZzMTIiPi8gJyArICh5LnllYXIrNTQzKSArICc8L3NwYW4+PC90ZD4nICsKICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyBtb25leSh5LnByaW5jaXBhbCkgKyAnPC90ZD4nICsKICAgICAgICAnPHRkIGNs',
  'YXNzPSJudW0iPicgKyAoeS5pbnRlcmVzdCA/IG1vbmV5KHkuaW50ZXJlc3QpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj48Yj4nICsgbW9uZXkoeS5wcmluY2lwYWwgKyB5LmludGVyZXN0KSArICc8L2I+PC90ZD4nICsKICAg',
  'ICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyB5LmNvdW50ICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbW9uZXkoY3VtKSArICc8L3RkPicgKwogICAgICAgICc8dGQ+JyArIHByb2dyZXNzKHApICsgJzwvdGQ+PC90cj4nOwogICAgfSku',
  'am9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicsICcnLCB0cnVlKSA6ICcnOwoKICB2YXIgcm93cyA9IGQucGF5bWVudHM7CiAgdmFyIGxpc3QgPSBjYXJkKCfwn6e+IOC4o+C4suC4ouC4geC4suC4o+C5guC4reC4meC5g+C4iuC5ieC4q+C4meC4teC5',
  'iSDCtyAnICsgeWVhckxhYmVsICsgJyAoJyArIHJvd3MubGVuZ3RoICsgJyknLAogICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsKICAgICAgJzx0aD7guKfguLHguJnguJfguLXguYg8L3RoPjx0',
  'aD7guIfguKfguJQ8L3RoPjx0aCBjbGFzcz0ibnVtIj7guYDguIfguLTguJnguJXguYnguJk8L3RoPjx0aCBjbGFzcz0ibnVtIj7guJTguK3guIHguYDguJrguLXguYnguKI8L3RoPicgKwogICAgICAnPHRoIGNsYXNzPSJudW0iPuC4o+C4p+C4oeC4l+C4teC5iOC5',
  'guC4reC4mTwvdGg+PHRoPuC4iuC5iOC4reC4h+C4l+C4suC4hzwvdGg+JyArCiAgICAgICc8dGg+4Liq4Lil4Li04LibPC90aD48dGg+4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4PC90aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICByb3dz',
  'Lm1hcChmdW5jdGlvbihwKXsKICAgICAgICByZXR1cm4gJzx0cj4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCI+JyArIHRoRGF0ZShwLnBheURhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAiPicgKyBlc2MocC5pbnN0',
  'YWxsbWVudCB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChwLnByaW5jaXBhbCA/ICc8YiBzdHlsZT0iY29sb3I6dmFyKC0tb2spIj4nICsgbW9uZXkocC5wcmluY2lwYWwpICsgJzwvYj4nIDogJzxzcGFuIGNsYXNz',
  'PSJmYWludCI+4oCTPC9zcGFuPicpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAocC5pbnRlcmVzdCA/ICc8YiBzdHlsZT0iY29sb3I6dmFyKC0td2FybikiPicgKyBtb25leShwLmludGVyZXN0KSArICc8L2I+JyA6ICc8c3BhbiBj',
  'bGFzcz0iZmFpbnQiPuKAkzwvc3Bhbj4nKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj48Yj4nICsgbW9uZXkocC5hbW91bnQpICsgJzwvYj48L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyhwLmNoYW5uZWwg',
  'fHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHAuc2xpcFJlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIG11dGVkIGNsaXAiPicgKyBlc2MocC5ub3RlIHx8ICcnKSArICc8L3RkPicgKwog',
  'ICAgICAgICAgJzx0ZD48ZGl2IGNsYXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24iIG9uY2xpY2s9XCdmb3JtRGVidFBheW1lbnQoJyArIGF0dHIocCkgKyAnLCInICsgZC5sZWRnZXIgKyAnIilcJz7inI/v',
  'uI88L2J1dHRvbj4nICsKICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIGRnciIgb25jbGljaz0iZGVsRGVidFBheW1lbnQoXCcnICsgcC5pZCArICdcJykiPvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICc8L2Rpdj48L3RkPjwvdHI+JzsK',
  'ICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgIDogZW1wdHlCb3goJ+C4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4o+C4suC4ouC4geC4suC4o+C4iuC4s+C4o+C4sOC5g+C4mScgKyB5ZWFyTGFiZWwsCiAgICAgICAgJzxidXR0',
  'b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZvcm1EZWJ0UGF5bWVudChudWxsLFwnJyArIGQubGVkZ2VyICsgJ1wnKSI+KyDguJrguLHguJnguJfguLbguIHguIHguLLguKPguIrguLPguKPguLA8L2J1dHRvbj4nKSwKICAgICcnLCB0cnVlKTsKCiAgcmV0dXJu',
  'IGhlYWQgKyBwZXJEZWJ0ICsgYnlZZWFyICsgJzxkaXYgY2xhc3M9Im10MTIiPicgKyBsaXN0ICsgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIHNldFllYXJGcm9tVGFibGUoeSl7CiAgUy55ZWFyID0gU3RyaW5nKHkpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd5',
  'ZWFyU2VsJykudmFsdWUgPSBTLnllYXI7CiAgbG9hZCgpOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgMykg4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHCiAg',
  'ID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMucHVyY2hhc2VzID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7CiAgICByZXR1cm4gUHJvbWlzZS5hbGwoWwogICAgICBjYWxsQXBpKCdwdXJj',
  'aGFzZS5zdW1tYXJ5JywgeyB5ZWFyOiBTLnllYXIgfSksCiAgICAgIGNhbGxBcGkoJ3B1cmNoYXNlLmxpc3QnLCB7IHllYXI6IFMueWVhciwgY2F0ZWdvcnk6IFMucGFyYW1zLmNhdGVnb3J5IHx8ICcnLCBxOiBTLnBhcmFtcy5xIHx8ICcnIH0pCiAgICBdKS50aGVu',
  'KGZ1bmN0aW9uKHIpeyB2YXIgZCA9IHJbMF07IGQuaXRlbXMgPSByWzFdOyByZXR1cm4gZDsgfSk7CiAgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvg',
  'uLUgJyArIFMueWVhcjsKICAgIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgIGtwaSgn4Lii4Lit4LiU4LiL4Li34LmJ4LitICcgKyB5ZWFyTGFiZWwsIGJhaHQoZC55ZWFyVG90YWwpLCBkLnllYXJDb3VudCArICcg4Lij4Liy',
  '4Lii4LiB4Liy4LijJywgJ2FjY2VudCcpICsKICAgICAga3BpKCfguKLguK3guJTguKrguLDguKrguKHguJfguLHguYnguIfguKvguKHguJQnLCBiYWh0KGQuZ3JhbmRUb3RhbCksIGQuZ3JhbmRDb3VudCArICcg4Lij4Liy4Lii4LiB4Liy4LijJykgKwogICAgICBr',
  'cGkoJ+C4reC4ouC4ueC5iOC5g+C4meC4m+C4o+C4sOC4geC4seC4mScsIGQud2FycmFudHkuYWN0aXZlICsgJyDguKPguLLguKLguIHguLLguKMnLCAn4LmD4LiB4Lil4LmJ4Lir4Lih4LiUICcgKyBkLndhcnJhbnR5LmV4cGlyaW5nLCBkLndhcnJhbnR5LmV4cGly',
  'aW5nID8gJ3dhcm4nIDogJ2dvb2QnKSArCiAgICAgIGtwaSgn4Lir4Lih4Lin4LiU4LiX4Li14LmI4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Liq4Li54LiH4Liq4Li44LiUJywgZC5ieUNhdGVnb3J5WzBdID8gZC5ieUNhdGVnb3J5WzBdLmNhdGVnb3J5IDogJ+KAkycs',
  'CiAgICAgICAgICBkLmJ5Q2F0ZWdvcnlbMF0gPyBiYWh0KGQuYnlDYXRlZ29yeVswXS50b3RhbCkgOiAnJykgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIGNoYXJ0cyA9ICc8ZGl2IGNsYXNzPSJncmlkIGcyIG1iMTIiPicgKwogICAgICBjYXJkKCfwn5OKIOC4hOC5',
  'iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC5geC4ouC4geC4leC4suC4oeC4q+C4oeC4p+C4lOC4q+C4oeC4ueC5iCDCtyAnICsgeWVhckxhYmVsLAogICAgICAgIGJhckNoYXJ0KGQuYnlDYXRlZ29yeSwgJ2NhdGVnb3J5JywgJ3RvdGFsJywgZnVuY3Rpb24oaSl7',
  'IHJldHVybiBtb25leShpLnRvdGFsKSArICcg4Li/JzsgfSkpICsKICAgICAgY2FyZCgn8J+ThSDguKLguK3guJTguIvguLfguYnguK3guYHguKLguIHguJXguLLguKHguJvguLUnLAogICAgICAgIGJhckNoYXJ0KGQuYnlZZWFyLm1hcChmdW5jdGlvbih5KXsgcmV0',
  'dXJuIHsgbGFiZWw6ICfguJvguLUgJyArIHkueWVhciArICcgKCcgKyB5LmNvdW50ICsgJyknLCB0b3RhbDogeS50b3RhbCwgeWVhcjogeS55ZWFyIH07IH0pLAogICAgICAgICAgICAgICAgICdsYWJlbCcsICd0b3RhbCcsIGZ1bmN0aW9uKGkpeyByZXR1cm4gbW9u',
  'ZXkoaS50b3RhbCkgKyAnIOC4vyc7IH0pKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgY2F0cyA9ICc8ZGl2IGNsYXNzPSJjaGlwcyBtYjEyIj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImNoaXAgJyArICghUy5wYXJhbXMuY2F0ZWdvcnk/J29uJzonJykgKyAn',
  'IiBvbmNsaWNrPSJzZXRQYXJhbShcJ2NhdGVnb3J5XCcsXCdcJykiPuC4l+C4uOC4geC4q+C4oeC4p+C4lDwvYnV0dG9uPicgKwogICAgICBkLmJ5Q2F0ZWdvcnkubWFwKGZ1bmN0aW9uKGMpewogICAgICAgIHJldHVybiAnPGJ1dHRvbiBjbGFzcz0iY2hpcCAnICsg',
  'KFMucGFyYW1zLmNhdGVnb3J5PT09Yy5jYXRlZ29yeT8nb24nOicnKSArICciICcgKwogICAgICAgICAgICAgICAnb25jbGljaz0ic2V0UGFyYW0oXCdjYXRlZ29yeVwnLFwnJyArIGVzYyhjLmNhdGVnb3J5KSArICdcJykiPicgKyBlc2MoYy5jYXRlZ29yeSkgKyAn',
  'ICgnICsgYy5jb3VudCArICcpPC9idXR0b24+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKCiAgICB2YXIgcm93cyA9IGQuaXRlbXM7CiAgICB2YXIgdGFibGUgPSBjYXJkKCfwn5uSIOC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4',
  'hyDCtyAnICsgeWVhckxhYmVsICsgJyAoJyArIHJvd3MubGVuZ3RoICsgJyknLAogICAgICByb3dzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOjk4MHB4Ij48dGhlYWQ+PHRyPicgKwogICAgICAgICc8',
  'dGggc3R5bGU9IndpZHRoOjk2cHgiPuC4p+C4seC4meC4l+C4teC5iOC4i+C4t+C5ieC4rTwvdGg+PHRoPuC4o+C4suC4ouC4geC4suC4o+C4quC4tOC4meC4hOC5ieC4sjwvdGg+PHRoIGNsYXNzPSJudW0iPuC4iOC4s+C4meC4p+C4mTwvdGg+JyArCiAgICAgICAg',
  'Jzx0aCBjbGFzcz0ibnVtIj7guKPguLLguITguLI8L3RoPjx0aD7guYHguKvguKXguYjguIfguJfguLXguYjguIvguLfguYnguK08L3RoPjx0aD7guJvguKPguLDguIHguLHguJk8L3RoPjx0aD7guKDguLLguJ48L3RoPjx0aD7guKrguKXguLTguJs8L3RoPjx0aD48',
  'L3RoPicgKwogICAgICAgICc8L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIHJvd3MubWFwKGZ1bmN0aW9uKHApewogICAgICAgICAgdmFyIHcgPSBwLndhcnJhbnR5IHx8IHt9OwogICAgICAgICAgcmV0dXJuICc8dHI+JyArCiAgICAgICAgICAgICc8dGQg',
  'Y2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHAuYnV5RGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48ZGl2IGNsYXNzPSJjbGlwIiB0aXRsZT0iJyArIGVzYyhwLml0ZW0pICsgJyI+PGI+JyArIGVzYyhwLml0ZW0pICsgJzwvYj48L2Rpdj4n',
  'ICsKICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0iZnMxMiBmYWludCI+JyArIGVzYyhwLmNhdGVnb3J5IHx8ICcnKSArIChwLnJvb20gPyAnIMK3IOC4q+C5ieC4reC4hyAnICsgZXNjKHAucm9vbSkgOiAnJykgKyAnPC9kaXY+PC90ZD4nICsKICAgICAgICAgICAg',
  'Jzx0ZCBjbGFzcz0ibnVtIj4nICsgbnVtKHAucXR5KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxiPicgKyBtb25leShwLnByaWNlKSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyhw',
  'LnZlbmRvciB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArICh3LmhhcwogICAgICAgICAgICAgICAgPyBzdGF0dXNCYWRnZSh3LnN0YXRlKSArICc8ZGl2IGNsYXNzPSJmYWludCIgc3R5bGU9ImZvbnQtc2l6ZTox',
  'MXB4Ij4nICsgdGhEYXRlU2hvcnQody5lbmQpICsgJzwvZGl2PicKICAgICAgICAgICAgICAgIDogJzxzcGFuIGNsYXNzPSJmYWludCI+4oCTPC9zcGFuPicpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwocC5waG90b1JlZnMpICsg',
  'JzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwocC5zbGlwUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48ZGl2IGNsYXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNv',
  'biIgb25jbGljaz1cJ2Zvcm1QdXJjaGFzZSgnICsgYXR0cihwKSArICcpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIGRnciIgb25jbGljaz0iZGVsUHVyY2hhc2UoXCcnICsgcC5pZCArICdcJyki',
  'PvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICAgJzwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nCiAgICAgIDogZW1wdHlCb3goJ+C4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4o+C4suC4ouC4',
  'geC4suC4o+C4i+C4t+C5ieC4reC5g+C4mScgKyB5ZWFyTGFiZWwsICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtUHVyY2hhc2UobnVsbCkiPisg4LmA4Lie4Li04LmI4Lih4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4LitPC9idXR0b24+',
  'JyksCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIHNtIiBvbmNsaWNrPSJmb3JtUHVyY2hhc2UobnVsbCkiPisg4LmA4Lie4Li04LmI4Lih4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4LitPC9idXR0b24+JywgdHJ1ZSk7CgogICAgcmV0dXJuIGhlYWQg',
  'KyBjaGFydHMgKyBjYXRzICsgdGFibGU7CiAgfQp9OwoKZnVuY3Rpb24gc2V0UGFyYW0oa2V5LCB2YWwpewogIFMucGFyYW1zW2tleV0gPSB2YWw7CiAgbG9hZCgpOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT0KICAgNCkg4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMuYWMgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsgcmV0dXJu',
  'IGNhbGxBcGkoJ2FjLm1hdHJpeCcsIHsgeWVhcjogUy55ZWFyIH0pOyB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgeWVhckxhYmVsID0gUy55ZWFyID09PSAnYWxsJyA/ICfguJfguLjguIHguJvguLUnIDogJ+C4m+C4tSAnICsgUy55ZWFyOwogICAg',
  'dmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAga3BpKCfguKXguYnguLLguIfguYHguKXguYnguKcgJyArIHllYXJMYWJlbCwgZC5yb29tc0RvbmVJblllYXIgKyAnLycgKyBkLnJvb21zLmxlbmd0aCArICcg4Lir4LmJ4Lit4LiH',
  'JywgZC5kb25lSW5ZZWFyICsgJyDguKPguK3guJrguJfguLHguYnguIfguKvguKHguJQnLCAnYWNjZW50JykgKwogICAgICBrcGkoJ+C4ouC4seC4h+C5hOC4oeC5iOC5hOC4lOC5ieC4peC5ieC4suC4hycsIGQucm9vbXNQZW5kaW5nLmxlbmd0aCArICcg4Lir4LmJ',
  '4Lit4LiHJywgZC5yb29tc1BlbmRpbmcuc2xpY2UoMCw4KS5qb2luKCcsICcpICsgKGQucm9vbXNQZW5kaW5nLmxlbmd0aD44PyfigKYnOicnKSwgZC5yb29tc1BlbmRpbmcubGVuZ3RoID8gJ3dhcm4nOidnb29kJykgKwogICAgICBrcGkoJ+C4luC4tuC4h+C4geC4',
  's+C4q+C4meC4lOC4peC5ieC4suC4hycsIGQub3ZlcmR1ZS5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsICfguKPguK3guJrguKXguYnguLLguIfguJfguLjguIEgJyArIGQuY3ljbGVNb250aHMgKyAnIOC5gOC4lOC4t+C4reC4mScsIGQub3ZlcmR1ZS5sZW5ndGgg',
  'PyAnYmFkJzonZ29vZCcpICsKICAgICAga3BpKCfguITguKfguLLguKHguITguLfguJrguKvguJnguYnguLInLCBwY3QoZC5yb29tcy5sZW5ndGggPyBkLnJvb21zRG9uZUluWWVhci9kLnJvb21zLmxlbmd0aCoxMDAgOiAwKSwgJ+C4guC4reC4h+C4l+C4seC5ieC4',
  'h+C4q+C4oeC4lCAnICsgZC5yb29tcy5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycpICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciBhY3Rpb25zID0gJzxkaXYgY2xhc3M9InJvdyBtYjEyIj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9',
  'ImZvcm1BYyhudWxsKSI+KyDguJrguLHguJnguJfguLbguIHguIHguLLguKPguKXguYnguLLguIfguYHguK3guKPguYw8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iZm9ybUJ1bGtBYygpIj7wn5OFIOC4meC4seC4lOC4peC5',
  'ieC4suC4h+C4q+C4peC4suC4ouC4q+C5ieC4reC4h+C4nuC4o+C5ieC4reC4oeC4geC4seC4mTwvYnV0dG9uPicgKwogICAgICAnPHNwYW4gY2xhc3M9InNwIj48L3NwYW4+JyArCiAgICAgICc8c3BhbiBjbGFzcz0iZnMxMiBtdXRlZCI+4LiE4Lil4Li04LiB4LiX',
  '4Li14LmI4Lir4LmJ4Lit4LiH4LmA4Lie4Li34LmI4Lit4LiU4Li5L+C5gOC4nuC4tOC5iOC4oeC4o+C4reC4muC4geC4suC4o+C4peC5ieC4suC4hzwvc3Bhbj4nICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciBncmlkID0gY2FyZCgn4p2E77iPIOC4leC4suC4o+C4',
  'suC4h+C4peC5ieC4suC4h+C5geC4reC4o+C5jOC4o+C4suC4ouC4q+C5ieC4reC4hyDCtyAnICsgeWVhckxhYmVsLCByb29tRmxvb3JzKGQucm9vbXMsIGZ1bmN0aW9uKHIpewogICAgICB2YXIgY2xzID0gci5yb3VuZHNJblllYXIgPiAwID8gJ3Mtb2snIDogKHIu',
  'c3RhdGUgPT09ICfguYDguIHguLTguJnguIHguLPguKvguJnguJQnID8gJ3MtZGdyJyA6IChyLnN0YXRlID09PSAn4Lii4Lix4LiH4LmE4Lih4LmI4LmA4LiE4Lii4Lil4LmJ4Liy4LiHJyA/ICdzLXdhcm4nIDogJ3MtaW5mbycpKTsKICAgICAgdmFyIHN1YiA9IHIu',
  'cm91bmRzSW5ZZWFyID4gMAogICAgICAgID8gJzxiPicgKyByLnJvdW5kc0luWWVhciArICcg4Lij4Lit4LiaPC9iPjxicj4nICsgdGhEYXRlU2hvcnQoci5yZWNvcmRzLmZpbHRlcihmdW5jdGlvbih4KXtyZXR1cm4geC5zZXJ2aWNlRGF0ZTt9KS5tYXAoZnVuY3Rp',
  'b24oeCl7cmV0dXJuIHguc2VydmljZURhdGU7fSkuc29ydCgpLnBvcCgpKQogICAgICAgIDogKHIuYm9va2VkSW5ZZWFyID8gJ+C4meC4seC4lOC5geC4peC5ieC4pyAnICsgci5ib29rZWRJblllYXIgOiAoci5sYXN0U2VydmljZSA/ICfguKXguYjguLLguKrguLjg',
  'uJQgJyArIHRoRGF0ZVNob3J0KHIubGFzdFNlcnZpY2UpIDogJ+C5hOC4oeC5iOC4oeC4teC4m+C4o+C4sOC4p+C4seC4leC4tCcpKTsKICAgICAgcmV0dXJuIHsgY2xzOiBjbHMsIHN1Yjogc3ViLCBvbmNsaWNrOiAnb3BlbkFjUm9vbShcJycgKyByLnJvb20gKyAn',
  'XCcpJyB9OwogICAgfSksICcnLCBmYWxzZSk7CgogICAgdmFyIGxpc3RSb3dzID0gW107CiAgICBkLnJvb21zLmZvckVhY2goZnVuY3Rpb24ocil7IHIucmVjb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uKHgpeyB4Ll9yb29tID0gci5yb29tOyBsaXN0Um93cy5wdXNoKHgp',
  'OyB9KTsgfSk7CiAgICBsaXN0Um93cy5zb3J0KGZ1bmN0aW9uKGEsYil7IHJldHVybiBTdHJpbmcoYi5zZXJ2aWNlRGF0ZXx8Yi5ib29rRGF0ZXx8JycpLmxvY2FsZUNvbXBhcmUoU3RyaW5nKGEuc2VydmljZURhdGV8fGEuYm9va0RhdGV8fCcnKSk7IH0pOwoKICAg',
  'IHZhciBsaXN0ID0gY2FyZCgn8J+TiyDguJvguKPguLDguKfguLHguJXguLTguIHguLLguKPguKXguYnguLLguIfguYHguK3guKPguYwgwrcgJyArIHllYXJMYWJlbCArICcgKCcgKyBsaXN0Um93cy5sZW5ndGggKyAnKScsCiAgICAgIGxpc3RSb3dzLmxlbmd0aCA/',
  'ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0Ij48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4Lir4LmJ4Lit4LiHPC90aD48dGg+4Lij4Lit4Lia4LiX4Li14LmIPC90aD48dGg+4Lin4Lix4LiZ4LiX4Li14LmI4LiZ4Lix4LiUPC90aD48dGg+4Lin',
  '4Lix4LiZ4LiX4Li14LmI4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4LijPC90aD48dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD4nICsKICAgICAgICAnPHRoPuC4iuC5iOC4suC4hzwvdGg+PHRoIGNsYXNzPSJudW0iPuC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4',
  'ojwvdGg+PHRoPuC4oOC4suC4njwvdGg+PHRoPuC4q+C4oeC4suC4ouC5gOC4q+C4leC4uDwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICBsaXN0Um93cy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgICAgICByZXR1cm4gJzx0cj4nICsK',
  'ICAgICAgICAgICAgJzx0ZD48Yj4nICsgZXNjKHgucm9vbSkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArICh4LnJvdW5kIHx8IDEpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4n',
  'ICsgdGhEYXRlKHguYm9va0RhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHguc2VydmljZURhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHN0YXR1c0JhZGdlKHguc3RhdHVz',
  'KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKHgudGVjaG5pY2lhbiB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbnVtKHguY29zdCkgKyAnPC90ZD4nICsKICAgICAg',
  'ICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCh4LnBob3RvUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiBtdXRlZCBjbGlwIj4nICsgZXNjKHgubm90ZSB8fCAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48ZGl2IGNs',
  'YXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1BYygnICsgYXR0cih4KSArICcpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0',
  'biBzbSBpY29uIGRnciIgb25jbGljaz0iZGVsQWMoXCcnICsgeC5pZCArICdcJykiPvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICAgJzwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nCiAgICAg',
  'IDogZW1wdHlCb3goJ+C4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C4peC5ieC4suC4h+C5geC4reC4o+C5jOC5g+C4mScgKyB5ZWFyTGFiZWwpLCAnJywgdHJ1ZSk7CgogICAgcmV0dXJuIGhlYWQgKyBhY3Rpb25zICsg',
  'Z3JpZCArICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgbGlzdCArICc8L2Rpdj4nOwogIH0KfTsKCmZ1bmN0aW9uIG9wZW5BY1Jvb20ocm9vbSl7CiAgdmFyIGQgPSBTLmNhY2hlLmFjOwogIHZhciByID0gZC5yb29tcy5maWx0ZXIoZnVuY3Rpb24oeCl7IHJldHVybiB4',
  'LnJvb20gPT09IHJvb207IH0pWzBdOwogIHZhciBib2R5ID0KICAgICc8ZGl2IGNsYXNzPSJncmlkIGczIG1iMTIiPicgKwogICAgICBrcGkoJ+C4o+C4reC4muC4l+C4teC5iOC4peC5ieC4suC4h+C5g+C4meC4m+C4teC4meC4teC5iScsIChyLnJvdW5kc0luWWVh',
  'cnx8MCkgKyAnIOC4o+C4reC4micsICcnKSArCiAgICAgIGtwaSgn4Lil4LmJ4Liy4LiH4Lil4LmI4Liy4Liq4Li44LiUJywgci5sYXN0U2VydmljZSA/IHRoRGF0ZShyLmxhc3RTZXJ2aWNlKSA6ICfigJMnLCByLmxhc3RTZXJ2aWNlID8gKGRheXNBZ28oci5sYXN0',
  'U2VydmljZSkgKyAnIOC4p+C4seC4meC4l+C4teC5iOC5geC4peC5ieC4pycpIDogJycpICsKICAgICAga3BpKCfguITguKPguJrguIHguLPguKvguJnguJTguKPguK3guJrguJbguLHguJTguYTguJsnLCByLm5leHREdWUgPyB0aERhdGUoci5uZXh0RHVlKSA6ICfi',
  'gJMnLCByLnN0YXRlLCByLnN0YXRlID09PSAn4LmA4LiB4Li04LiZ4LiB4Liz4Lir4LiZ4LiUJyA/ICdiYWQnIDogJycpICsKICAgICc8L2Rpdj4nICsKICAgIChyLnJlY29yZHMubGVuZ3RoCiAgICAgID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQi',
  'IHN0eWxlPSJtaW4td2lkdGg6YXV0byI+PHRoZWFkPjx0cj48dGg+4Lij4Lit4LiaPC90aD48dGg+4LiZ4Lix4LiUPC90aD48dGg+4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4LijPC90aD48dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD48dGg+4Lig4Liy4LiePC90aD48',
  'dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIHIucmVjb3Jkcy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgICAgICByZXR1cm4gJzx0cj48dGQ+JyArICh4LnJvdW5kfHwxKSArICc8L3RkPjx0ZCBjbGFzcz0iZnMxMiI+JyArIHRoRGF0ZSh4LmJv',
  'b2tEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgdGhEYXRlKHguc2VydmljZURhdGUpICsgJzwvdGQ+PHRkPicgKyBzdGF0dXNCYWRnZSh4LnN0YXR1cykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgdGh1',
  'bWJzSHRtbCh4LnBob3RvUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9XCdjbG9zZU1vZGFsKCk7Zm9ybUFjKCcgKyBhdHRyKHgpICsgJylcJz7guYHguIHguYnguYTguII8L2J1dHRvbj48L3Rk',
  'PjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lia4Lix4LiZ4LiX4Li24LiB4LmD4LiZ4Lib4Li14LiX4Li14LmI4LmA',
  '4Lil4Li34Lit4LiBPC9kaXY+Jyk7CgogIG9wZW5Nb2RhbCgn4p2E77iPIOC4peC5ieC4suC4h+C5geC4reC4o+C5jCDCtyDguKvguYnguK3guIcgJyArIHJvb20sIGJvZHksCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4',
  'm+C4tOC4lDwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtmb3JtQWMoe3Jvb206XCcnICsgcm9vbSArICdcJ30pIj4rIOC5gOC4nuC4tOC5iOC4oeC4o+C4reC4muC4geC4suC4o+C4peC5ieC4suC4',
  'hzwvYnV0dG9uPicpOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgNSkg4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Liy4Lih4Lir4LmJ4Lit4LiHCiAgID09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMucmVwYWlycyA9IHsKICBsb2FkOiBmdW5jdGlvbigpeyByZXR1cm4gY2FsbEFwaSgncmVwYWlyLm1hdHJpeCcsIHsgeWVhcjogUy55ZWFyIH0pOyB9LAogIHJlbmRlcjog',
  'ZnVuY3Rpb24oZCl7CiAgICB2YXIgeWVhckxhYmVsID0gUy55ZWFyID09PSAnYWxsJyA/ICfguJfguLjguIHguJvguLUnIDogJ+C4m+C4tSAnICsgUy55ZWFyOwogICAgdmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAga3BpKCfg',
  'uIfguLLguJnguIvguYjguK3guKEgJyArIHllYXJMYWJlbCwgZC50b3RhbEpvYnMgKyAnIOC4h+C4suC4mScsICfguIjguLLguIEgJyArIGQucm9vbXMuZmlsdGVyKGZ1bmN0aW9uKHIpe3JldHVybiByLmNvdW50PjA7fSkubGVuZ3RoICsgJyDguKvguYnguK3guIcn',
  'LCAnYWNjZW50JykgKwogICAgICBrcGkoJ+C4h+C4suC4meC4l+C4teC5iOC4ouC4seC4h+C5hOC4oeC5iOC5gOC4quC4o+C5h+C4iCcsIGQub3BlbkpvYnMgKyAnIOC4h+C4suC4mScsICcnLCBkLm9wZW5Kb2JzID8gJ3dhcm4nIDogJ2dvb2QnKSArCiAgICAgIGtw',
  'aSgn4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Lij4Lin4LihJywgYmFodChkLnRvdGFsQ29zdCksIHllYXJMYWJlbCkgKwogICAgICBrcGkoJ+C4q+C5ieC4reC4h+C4l+C4teC5iOC4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4i+C5iOC4reC4oScs',
  'IGQucm9vbXMuZmlsdGVyKGZ1bmN0aW9uKHIpe3JldHVybiByLmNvdW50PT09MDt9KS5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsICfguYPguJknICsgeWVhckxhYmVsKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgYWN0aW9ucyA9ICc8ZGl2IGNsYXNzPSJyb3cg',
  'bWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtUmVwYWlyKG51bGwpIj4rIOC5geC4iOC5ieC4h+C4i+C5iOC4reC4oSAvIOC4muC4seC4meC4l+C4tuC4geC4h+C4suC4meC4i+C5iOC4reC4oTwvYnV0dG9uPicgKwog',
  'ICAgICAnPHNwYW4gY2xhc3M9InNwIj48L3NwYW4+PHNwYW4gY2xhc3M9ImZzMTIgbXV0ZWQiPuC4hOC4peC4tOC4geC4l+C4teC5iOC4q+C5ieC4reC4h+C5gOC4nuC4t+C5iOC4reC4lOC4ueC4m+C4o+C4sOC4p+C4seC4leC4tOC4h+C4suC4meC4i+C5iOC4reC4',
  'oeC4guC4reC4h+C4q+C5ieC4reC4h+C4meC4seC5ieC4mTwvc3Bhbj48L2Rpdj4nOwoKICAgIHZhciBncmlkID0gY2FyZCgn8J+UpyDguKDguLLguJ7guKPguKfguKHguIfguLLguJnguIvguYjguK3guKHguKPguLLguKLguKvguYnguK3guIcgwrcgJyArIHllYXJM',
  'YWJlbCwgcm9vbUZsb29ycyhkLnJvb21zLCBmdW5jdGlvbihyKXsKICAgICAgdmFyIGNscyA9IHIub3BlbkNvdW50ID4gMCA/ICdzLWRncicgOiAoci5jb3VudCA+IDAgPyAncy1vaycgOiAncy1pbmZvJyk7CiAgICAgIHZhciBzdWIgPSByLmNvdW50ID4gMAogICAg',
  'ICAgID8gJzxiPicgKyByLmNvdW50ICsgJyDguIfguLLguJk8L2I+JyArIChyLm9wZW5Db3VudCA/ICcgwrcg4LiE4LmJ4Liy4LiHICcgKyByLm9wZW5Db3VudCA6ICcnKSArICc8YnI+JyArIChyLmxhc3QgPyB0aERhdGVTaG9ydChyLmxhc3QpIDogJycpCiAgICAg',
  'ICAgOiAn4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ4LiL4LmI4Lit4LihJzsKICAgICAgcmV0dXJuIHsgY2xzOiBjbHMsIHN1Yjogc3ViLCBvbmNsaWNrOiAnb3BlblJlcGFpclJvb20oXCcnICsgci5yb29tICsgJ1wnKScgfTsKICAgIH0pKTsKCiAgICB2YXIgcm93',
  'cyA9IFtdOwogICAgZC5yb29tcy5mb3JFYWNoKGZ1bmN0aW9uKHIpeyByLnJlY29yZHMuZm9yRWFjaChmdW5jdGlvbih4KXsgcm93cy5wdXNoKHgpOyB9KTsgfSk7CiAgICByb3dzLnNvcnQoZnVuY3Rpb24oYSxiKXsgcmV0dXJuIFN0cmluZyhiLnJlcGFpckRhdGV8',
  'fGIuYm9va0RhdGV8fCcnKS5sb2NhbGVDb21wYXJlKFN0cmluZyhhLnJlcGFpckRhdGV8fGEuYm9va0RhdGV8fCcnKSk7IH0pOwoKICAgIHZhciBsaXN0ID0gY2FyZCgn8J+TiyDguKPguLLguKLguIHguLLguKPguIfguLLguJnguIvguYjguK3guKEgwrcgJyArIHll',
  'YXJMYWJlbCArICcgKCcgKyByb3dzLmxlbmd0aCArICcpJywKICAgICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDoxMDIwcHgiPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guKvguYng',
  'uK3guIc8L3RoPjx0aD7guKfguLHguJnguJnguLHguJTguIvguYjguK3guKE8L3RoPjx0aD7guKfguLHguJnguYDguILguYnguLLguIvguYjguK3guKE8L3RoPjx0aD7guJvguKPguLDguYDguKDguJc8L3RoPjx0aD7guKPguLLguKLguIHguLLguKPguJfguLXguYjg',
  'uIvguYjguK3guKHguYHguIvguKE8L3RoPicgKwogICAgICAgICc8dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD48dGggY2xhc3M9Im51bSI+4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiPC90aD48dGg+4LiB4LmI4Lit4LiZPC90aD48dGg+4Lir4Lil4Lix4LiH',
  'PC90aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIHJvd3MubWFwKGZ1bmN0aW9uKHgpewogICAgICAgICAgcmV0dXJuICc8dHI+JyArCiAgICAgICAgICAgICc8dGQ+PGI+JyArIGVzYyh4LnJvb20pICsgJzwvYj48L3RkPicgKwogICAg',
  'ICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LmJvb2tEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LnJlcGFpckRhdGUpICsgJzwvdGQ+JyArCiAgICAgICAg',
  'ICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MoeC5jYXRlZ29yeSB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMyI+PGRpdiBjbGFzcz0iY2xpcCI+JyArIGVzYyh4Lml0ZW1zIHx8ICcnKSArICc8L2Rpdj48L3RkPicg',
  'KwogICAgICAgICAgICAnPHRkPicgKyBzdGF0dXNCYWRnZSh4LnN0YXR1cykgKyAoeC5wcmlvcml0eSAmJiB4LnByaW9yaXR5ICE9PSAn4Lib4LiB4LiV4Li0JyA/ICcgJyArIHN0YXR1c0JhZGdlKHgucHJpb3JpdHkpIDogJycpICsgJzwvdGQ+JyArCiAgICAgICAg',
  'ICAgICc8dGQgY2xhc3M9Im51bSI+JyArIG51bSh4LmNvc3QpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwoeC5iZWZvcmVSZWZzKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHguYWZ0ZXJSZWZz',
  'KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPjxkaXYgY2xhc3M9InQtYWN0aW9ucyI+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIiBvbmNsaWNrPVwnZm9ybVJlcGFpcignICsgYXR0cih4KSArICcpXCc+4pyP77iPPC9i',
  'dXR0b24+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIGRnciIgb25jbGljaz0iZGVsUmVwYWlyKFwnJyArIHguaWQgKyAnXCcpIj7wn5eRPC9idXR0b24+JyArCiAgICAgICAgICAgICc8L2Rpdj48L3RkPjwvdHI+JzsKICAgICAg',
  'ICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6IGVtcHR5Qm94KCfguKLguLHguIfguYTguKHguYjguKHguLXguIfguLLguJnguIvguYjguK3guKHguYPguJknICsgeWVhckxhYmVsLCAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIg',
  'b25jbGljaz0iZm9ybVJlcGFpcihudWxsKSI+KyDguYHguIjguYnguIfguIvguYjguK3guKE8L2J1dHRvbj4nKSwgJycsIHRydWUpOwoKICAgIHJldHVybiBoZWFkICsgYWN0aW9ucyArIGdyaWQgKyAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIGxpc3QgKyAnPC9kaXY+',
  'JzsKICB9Cn07CgpmdW5jdGlvbiBvcGVuUmVwYWlyUm9vbShyb29tKXsKICB2YXIgZCA9IFMuY2FjaGUucmVwYWlyczsKICB2YXIgciA9IGQucm9vbXMuZmlsdGVyKGZ1bmN0aW9uKHgpeyByZXR1cm4geC5yb29tID09PSByb29tOyB9KVswXTsKICB2YXIgYm9keSA9',
  'ICc8ZGl2IGNsYXNzPSJncmlkIGczIG1iMTIiPicgKwogICAgICBrcGkoJ+C4h+C4suC4meC4l+C4seC5ieC4h+C4q+C4oeC4lCcsIHIuY291bnQgKyAnIOC4h+C4suC4mScsICcnKSArCiAgICAgIGtwaSgn4Lii4Lix4LiH4LmE4Lih4LmI4LmA4Liq4Lij4LmH4LiI',
  'Jywgci5vcGVuQ291bnQgKyAnIOC4h+C4suC4mScsICcnLCByLm9wZW5Db3VudCA/ICd3YXJuJzonZ29vZCcpICsKICAgICAga3BpKCfguITguYjguLLguYPguIrguYnguIjguYjguLLguKInLCBiYWh0KHIuY29zdCksICcnKSArCiAgICAnPC9kaXY+JyArCiAgICAo',
  'ci5yZWNvcmRzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0bCI+JyArIHIucmVjb3Jkcy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0idGwtaSI+PGRpdiBjbGFzcz0iZCI+JyArIHRoRGF0ZSh4LnJlcGFpckRhdGUgfHwgeC5ib29rRGF0',
  'ZSkgKyAnIMK3ICcgKyBlc2MoeC5jYXRlZ29yeXx8JycpICsgJyAnICsgc3RhdHVzQmFkZ2UoeC5zdGF0dXMpICsgJzwvZGl2PicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJ0Ij4nICsgZXNjKHguaXRlbXMgfHwgJycpICsgJzwvZGl2PicgKwogICAgICAgICh4LnRl',
  'Y2huaWNpYW4gPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCI+4LiK4LmI4Liy4LiHOiAnICsgZXNjKHgudGVjaG5pY2lhbikgKyAnPC9kaXY+JyA6ICcnKSArCiAgICAgICAgKHguY29zdCA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIj7guITguYjguLLguYPguIrg',
  'uYnguIjguYjguLLguKIgJyArIGJhaHQoeC5jb3N0KSArICc8L2Rpdj4nIDogJycpICsKICAgICAgICAnPGRpdiBjbGFzcz0ibXQ4Ij4nICsgdGh1bWJzSHRtbCgoeC5iZWZvcmVSZWZzfHxbXSkuY29uY2F0KHguYWZ0ZXJSZWZzfHxbXSkpICsgJzwvZGl2PicgKwog',
  'ICAgICAgICc8ZGl2IGNsYXNzPSJtdDgiPjxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz1cJ2Nsb3NlTW9kYWwoKTtmb3JtUmVwYWlyKCcgKyBhdHRyKHgpICsgJylcJz7guYHguIHguYnguYTguII8L2J1dHRvbj48L2Rpdj4nICsKICAgICAgJzwvZGl2Pic7',
  'CiAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij7guKLguLHguIfguYTguKHguYjguKHguLXguIfguLLguJnguIvguYjguK3guKHguYPguJnguJvguLXguJfguLXguYjguYDguKXguLfguK3guIE8L2Rpdj4nKTsKCiAgb3Blbk1v',
  'ZGFsKCfwn5SnIOC4h+C4suC4meC4i+C5iOC4reC4oSDCtyDguKvguYnguK3guIcgJyArIHJvb20sIGJvZHksCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4m+C4tOC4lDwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xh',
  'c3M9ImJ0biBwcmkiIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtmb3JtUmVwYWlyKHtyb29tOlwnJyArIHJvb20gKyAnXCd9KSI+KyDguYDguJ7guLTguYjguKHguIfguLLguJnguIvguYjguK3guKE8L2J1dHRvbj4nLCB0cnVlKTsKfQoKLyogPT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDYpIOC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT0gKi8KUk9VVEVTLmJ1aWxkaW5nID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7CiAgICByZXR1cm4gUHJvbWlzZS5hbGwoWwogICAgICBjYWxsQXBpKCdidWlsZGluZy5zdW1tYXJ5JywgeyB5ZWFyOiBTLnllYXIgfSksCiAgICAgIGNhbGxBcGko',
  'J2J1aWxkaW5nLmxpc3QnLCB7IHllYXI6IFMueWVhciwgem9uZTogUy5wYXJhbXMuem9uZSB8fCAnJywgc3RhdHVzOiAnJyB9KQogICAgXSkudGhlbihmdW5jdGlvbihyKXsgdmFyIGQgPSByWzBdOyBkLml0ZW1zID0gclsxXTsgcmV0dXJuIGQ7IH0pOwogIH0sCiAg',
  'cmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAg',
  'ICBrcGkoJ+C4h+C4suC4meC4m+C4tSAnICsgKFMueWVhcj09PSdhbGwnPyfguJfguLHguYnguIfguKvguKHguJQnOlMueWVhciksIGQueWVhckNvdW50ICsgJyDguIfguLLguJknLCAn4Liq4Liw4Liq4LihICcgKyBkLnRvdGFsICsgJyDguIfguLLguJknLCAnYWNj',
  'ZW50JykgKwogICAgICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oiAnICsgeWVhckxhYmVsLCBiYWh0KGQueWVhckNvc3QpLCAn4Liq4Liw4Liq4LihICcgKyBiYWh0KGQuZ3JhbmRDb3N0KSkgKwogICAgICBrcGkoJ+C4h+C4suC4meC4l+C4teC5',
  'iOC4ouC4seC4h+C5hOC4oeC5iOC5gOC4quC4o+C5h+C4iCcsIGQub3BlbkNvdW50ICsgJyDguIfguLLguJknLCAnJywgZC5vcGVuQ291bnQgPyAnd2FybicgOiAnZ29vZCcpICsKICAgICAga3BpKCfguITguKPguJrguIHguLPguKvguJnguJTguYPguJkgOTAg4Lin',
  '4Lix4LiZJywgZC51cGNvbWluZy5sZW5ndGggKyAnIOC4h+C4suC4mScsIGQudXBjb21pbmcubGVuZ3RoID8gZC51cGNvbWluZ1swXS50aXRsZSA6ICcnLCBkLnVwY29taW5nLmxlbmd0aCA/ICd3YXJuJyA6ICcnKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgem9u',
  'ZXMgPSAnPGRpdiBjbGFzcz0iY2hpcHMgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJjaGlwICcgKyAoIVMucGFyYW1zLnpvbmU/J29uJzonJykgKyAnIiBvbmNsaWNrPSJzZXRQYXJhbShcJ3pvbmVcJyxcJ1wnKSI+4LiX4Li44LiB4Liq4LmI4Lin4LiZ',
  'PC9idXR0b24+JyArCiAgICAgIGQuYnlab25lLm1hcChmdW5jdGlvbih6KXsKICAgICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9ImNoaXAgJyArIChTLnBhcmFtcy56b25lPT09ei56b25lPydvbic6JycpICsgJyIgb25jbGljaz0ic2V0UGFyYW0oXCd6b25lXCcs',
  'XCcnICsgZXNjKHouem9uZSkgKyAnXCcpIj4nICsKICAgICAgICAgICAgICAgZXNjKHouem9uZSkgKyAnICgnICsgei5jb3VudCArICcpPC9idXR0b24+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKCiAgICB2YXIgY2hhcnRzID0gJzxkaXYgY2xhc3M9',
  'ImdyaWQgZzIgbWIxMiI+JyArCiAgICAgIGNhcmQoJ/Cfj5fvuI8g4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4LmB4Lii4LiB4LiV4Liy4Lih4Liq4LmI4Lin4LiZ4LiC4Lit4LiH4Lit4Liy4LiE4Liy4LijJywgYmFyQ2hhcnQoZC5ieVpvbmUsICd6b25l',
  'JywgJ2Nvc3QnLCBmdW5jdGlvbihpKXsgcmV0dXJuIG1vbmV5KGkuY29zdCkgKyAnIOC4vyc7IH0pKSArCiAgICAgIGNhcmQoJ/Cfk4Ug4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4LmB4Lii4LiB4LiV4Liy4Lih4Lib4Li1JywgYmFyQ2hhcnQoCiAgICAg',
  'ICAgZC5ieVllYXIubWFwKGZ1bmN0aW9uKHkpeyByZXR1cm4geyBsYWJlbDon4Lib4Li1ICcgKyB5LnllYXIgKyAnICgnICsgeS5jb3VudCArICcg4LiH4Liy4LiZKScsIGNvc3Q6eS5jb3N0IH07IH0pLAogICAgICAgICdsYWJlbCcsICdjb3N0JywgZnVuY3Rpb24o',
  'aSl7IHJldHVybiBtb25leShpLmNvc3QpICsgJyDguL8nOyB9KSkgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIHJvd3MgPSBkLml0ZW1zOwogICAgdmFyIGxpc3QgPSBjYXJkKCfwn4+iIOC4o+C4suC4ouC4geC4suC4o+C4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4',
  'tuC4geC5guC4lOC4ouC4o+C4p+C4oSDCtyAnICsgeWVhckxhYmVsICsgJyAoJyArIHJvd3MubGVuZ3RoICsgJyknLAogICAgICByb3dzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOjEwMjBweCI+PHRo',
  'ZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC4quC5iOC4p+C4meC4guC4reC4h+C4reC4suC4hOC4suC4ozwvdGg+PHRoPuC4o+C4suC4ouC4geC4suC4ozwvdGg+PHRoPuC4meC4seC4lDwvdGg+PHRoPuC5gOC4o+C4tOC5iOC4oTwvdGg+PHRoPuC5gOC4quC4o+C5',
  'h+C4iDwvdGg+PHRoPuC4quC4luC4suC4meC4sDwvdGg+JyArCiAgICAgICAgJzx0aD7guJzguLnguYnguKPguLHguJrguYDguKvguKHguLI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguYjguLLguYPguIrguYnguIjguYjguLLguKI8L3RoPjx0aD7guKPguK3guJrg',
  'uJbguLHguJTguYTguJs8L3RoPjx0aD7guKDguLLguJ48L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgcm93cy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgICAgICByZXR1cm4gJzx0cj4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0i',
  'ZnMxMiI+PGI+JyArIGVzYyh4LnpvbmUgfHwgJ+KAkycpICsgJzwvYj48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEzIj48ZGl2IGNsYXNzPSJjbGlwIj4nICsgZXNjKHgudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAgICAgICh4Lm5vdGUg',
  'PyAnPGRpdiBjbGFzcz0iZnMxMiBmYWludCBjbGlwIj4nICsgZXNjKHgubm90ZSkgKyAnPC9kaXY+JyA6ICcnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LmJvb2tEYXRlKSArICc8L3RkPicgKwog',
  'ICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LnN0YXJ0RGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyB0aERhdGUoeC5lbmREYXRlKSArICc8L3RkPicgKwogICAgICAg',
  'ICAgICAnPHRkPicgKyBzdGF0dXNCYWRnZSh4LnN0YXR1cykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyh4LmNvbnRyYWN0b3IgfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+',
  'JyArIG51bSh4LmNvc3QpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgKHgubmV4dER1ZSA/IHRoRGF0ZVNob3J0KHgubmV4dER1ZSkgKwogICAgICAgICAgICAgICAgKHguZHVlSW5EYXlzICE9IG51bGwgPyAnPGRp',
  'diBjbGFzcz0iZmFpbnQiIHN0eWxlPSJmb250LXNpemU6MTFweCI+JyArICh4LmR1ZUluRGF5czwwID8gJ+C5gOC4peC4oiAnICsgKC14LmR1ZUluRGF5cykgKyAnIOC4p+C4seC4mScgOiAn4Lit4Li14LiBICcgKyB4LmR1ZUluRGF5cyArICcg4Lin4Lix4LiZJykg',
  'KyAnPC9kaXY+JyA6ICcnKQogICAgICAgICAgICAgIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwoKHgucGhvdG9SZWZzfHxbXSkuY29uY2F0KHguc2xpcFJlZnN8fFtdKSkgKyAnPC90ZD4nICsKICAgICAgICAgICAg',
  'Jzx0ZD48ZGl2IGNsYXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1CdWlsZGluZygnICsgYXR0cih4KSArICcpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAgICAg',
  'JzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIGRnciIgb25jbGljaz0iZGVsQnVpbGRpbmcoXCcnICsgeC5pZCArICdcJykiPvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICAgJzwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJv',
  'ZHk+PC90YWJsZT48L2Rpdj4nCiAgICAgIDogZW1wdHlCb3goJ+C4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5g+C4mScgKyB5ZWFyTGFiZWwsICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNs',
  'aWNrPSJmb3JtQnVpbGRpbmcobnVsbCkiPisg4LmA4Lie4Li04LmI4Lih4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiV4Li24LiBPC9idXR0b24+JyksCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIHNtIiBvbmNsaWNrPSJmb3JtQnVpbGRpbmcobnVsbCkiPisg',
  '4LmA4Lie4Li04LmI4Lih4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiV4Li24LiBPC9idXR0b24+JywgdHJ1ZSk7CgogICAgcmV0dXJuIGhlYWQgKyB6b25lcyArIGNoYXJ0cyArIGxpc3Q7CiAgfQp9OwoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDcpIOC4q+C5ieC4reC4h+C4nuC4seC4gQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLnJvb21zID0gewogIGxvYWQ6IGZ1',
  'bmN0aW9uKCl7IHJldHVybiBjYWxsQXBpKCdyb29tLmxpc3QnKS50aGVuKGZ1bmN0aW9uKGZsb29ycyl7IHJldHVybiB7IGZsb29yczogZmxvb3JzLCB5ZWFyczogW10gfTsgfSk7IH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciBmbGF0ID0gW107CiAg',
  'ICBkLmZsb29ycy5mb3JFYWNoKGZ1bmN0aW9uKGYpeyBmLnJvb21zLmZvckVhY2goZnVuY3Rpb24ocil7IGZsYXQucHVzaChyKTsgfSk7IH0pOwogICAgdmFyIG9jYyA9IGZsYXQuZmlsdGVyKGZ1bmN0aW9uKHIpeyByZXR1cm4gci5zdGF0dXMgPT09ICfguKHguLXg',
  'uJzguLnguYnguYDguIrguYjguLInOyB9KS5sZW5ndGg7CgogICAgdmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAga3BpKCfguKvguYnguK3guIfguJfguLHguYnguIfguKvguKHguJQnLCBmbGF0Lmxlbmd0aCArICcg4Lir4LmJ',
  '4Lit4LiHJywgJzUg4LiK4Lix4LmJ4LiZJywgJ2FjY2VudCcpICsKICAgICAga3BpKCfguKHguLXguJzguLnguYnguYDguIrguYjguLInLCBvY2MgKyAnIOC4q+C5ieC4reC4hycsIHBjdChmbGF0Lmxlbmd0aCA/IG9jYy9mbGF0Lmxlbmd0aCoxMDAgOiAwKSArICcg',
  '4Lit4Lix4LiV4Lij4Liy4LmA4LiC4LmJ4Liy4Lie4Lix4LiBJywgJ2dvb2QnKSArCiAgICAgIGtwaSgn4Lir4LmJ4Lit4LiH4Lin4LmI4Liy4LiHJywgZmxhdC5maWx0ZXIoZnVuY3Rpb24ocil7IHJldHVybiByLnN0YXR1cyA9PT0gJ+C4p+C5iOC4suC4hyc7IH0p',
  'Lmxlbmd0aCArICcg4Lir4LmJ4Lit4LiHJywgJycsICd3YXJuJykgKwogICAgICBrcGkoJ+C4hOC5iOC4suC5gOC4iuC5iOC4suC4o+C4p+C4oS/guYDguJTguLfguK3guJknLCBiYWh0KGZsYXQucmVkdWNlKGZ1bmN0aW9uKGEscil7IHJldHVybiBhICsgKE51bWJl',
  'cihyLnJlbnQpfHwwKTsgfSwgMCkpLCAn4LiI4Liy4LiB4Lir4LmJ4Lit4LiH4LiX4Li14LmI4LiB4Lij4Lit4LiB4LiE4LmI4Liy4LmA4LiK4LmI4Liy4LmE4Lin4LmJJykgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIGdyaWQgPSBjYXJkKCfwn5qqIOC4nOC4seC4',
  'h+C4q+C5ieC4reC4h+C4nuC4seC4gScsIHJvb21GbG9vcnMoZmxhdCwgZnVuY3Rpb24ocil7CiAgICAgIHZhciBjbHMgPSByLnN0YXR1cyA9PT0gJ+C4oeC4teC4nOC4ueC5ieC5gOC4iuC5iOC4sicgPyAncy1vaycgOiAoci5zdGF0dXMgPT09ICfguKfguYjguLLg',
  'uIcnID8gJ3MtaW5mbycgOiAncy13YXJuJyk7CiAgICAgIHJldHVybiB7IGNsczogY2xzLCBzdWI6IGVzYyhyLnRlbmFudCB8fCByLnN0YXR1cyB8fCAnJykgKyAoci5yZW50ID8gJzxicj4nICsgbW9uZXkoci5yZW50KSArICcg4Li/JyA6ICcnKSwKICAgICAgICAg',
  'ICAgICAgb25jbGljazogJ29wZW5Sb29tKFwnJyArIHIucm9vbSArICdcJyknIH07CiAgICB9KSwgJzxzcGFuIGNsYXNzPSJmczEyIG11dGVkIj7guITguKXguLTguIHguJfguLXguYjguKvguYnguK3guIfguYDguJ7guLfguYjguK3guJTguLnguJvguKPguLDguKfg',
  'uLHguJXguLTguJfguLHguYnguIfguKvguKHguJTguILguK3guIfguKvguYnguK3guIfguJnguLHguYnguJk8L3NwYW4+Jyk7CgogICAgcmV0dXJuIGhlYWQgKyBncmlkOwogIH0KfTsKCmZ1bmN0aW9uIG9wZW5Sb29tKHJvb20pewogIG9wZW5Nb2RhbCgn8J+aqiDg',
  'uKvguYnguK3guIcgJyArIHJvb20sICc8ZGl2IGNsYXNzPSJlbXB0eSI+PHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4LmC4Lir4Lil4LiU4oCmPC9kaXY+Jyk7CiAgY2FsbEFwaSgncm9vbS5wcm9maWxlJywgeyByb29tOiByb29tIH0p',
  'LnRoZW4oZnVuY3Rpb24ocCl7CiAgICB2YXIgaSA9IHAuaW5mbzsKICAgIHZhciBib2R5ID0KICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgICAga3BpKCfguKrguJbguLLguJnguLAnLCBpLnN0YXR1cyB8fCAn4oCTJywgZXNjKGkudGVu',
  'YW50IHx8ICcnKSkgKwogICAgICAgIGtwaSgn4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJywgcC5hY0NvdW50ICsgJyDguITguKPguLHguYnguIcnLCBwLmxhc3RBYyA/ICfguKXguYjguLLguKrguLjguJQgJyArIHRoRGF0ZShwLmxhc3RBYykgOiAn4LmE4Lih4LmI',
  '4Lih4Li14Lib4Lij4Liw4Lin4Lix4LiV4Li0JykgKwogICAgICAgIGtwaSgn4LiH4Liy4LiZ4LiL4LmI4Lit4LihJywgcC5yZXBhaXJDb3VudCArICcg4LiH4Liy4LiZJywgJ+C4hOC5ieC4suC4hyAnICsgcC5vcGVuUmVwYWlycywgcC5vcGVuUmVwYWlycyA/ICd3',
  'YXJuJyA6ICcnKSArCiAgICAgICAga3BpKCfguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguKrguLDguKrguKEnLCBiYWh0KHAudG90YWxDb3N0KSwgJ+C4i+C5iOC4reC4oSArIOC4peC5ieC4suC4h+C5geC4reC4o+C5jCcpICsKICAgICAgJzwvZGl2Picg',
  'KwogICAgICAnPGRpdiBjbGFzcz0icm93IG1iMTIiPicgKwogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9XCdjbG9zZU1vZGFsKCk7Zm9ybVJvb20oJyArIGF0dHIoaSkgKyAnKVwnPuKcj++4jyDguYHguIHguYnguYTguILguILguYnguK3g',
  'uKHguLnguKXguKvguYnguK3guIc8L2J1dHRvbj4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCk7Zm9ybVJlcGFpcih7cm9vbTpcJycgKyByb29tICsgJ1wnfSkiPisg4LmB4LiI4LmJ4LiH4LiL4LmI4Lit4Lih',
  'PC9idXR0b24+JyArCiAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iY2xvc2VNb2RhbCgpO2Zvcm1BYyh7cm9vbTpcJycgKyByb29tICsgJ1wnfSkiPisg4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMPC9idXR0b24+JyArCiAgICAgICc8L2Rp',
  'dj4nICsKICAgICAgKHAuYXNzZXRzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJjYXJkIG1iMTIiPjxkaXYgY2xhc3M9ImNhcmQtaCI+PGgzPuC4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4meC5g+C4meC4q+C5ieC4reC4hzwvaDM+PC9kaXY+PGRpdiBjbGFzcz0iY2Fy',
  'ZC1iIj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDphdXRvIj48dGhlYWQ+PHRyPjx0aD7guJfguKPguLHguJ7guKLguYzguKrguLTguJk8L3RoPjx0aD7guKLguLXguYjguKvguYnguK0v4Lij4Li4',
  '4LmI4LiZPC90aD48dGg+4LiV4Li04LiU4LiV4Lix4LmJ4LiHPC90aD48dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIHAuYXNzZXRzLm1hcChmdW5jdGlvbihhKXsKICAgICAgICAgIHJldHVybiAnPHRyPjx0ZD4n',
  'ICsgZXNjKGEubmFtZSkgKyAnPC90ZD48dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MoYS5icmFuZHx8J+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIHRoRGF0ZShhLmluc3RhbGxEYXRlKSArICc8L3RkPjx0ZD4n',
  'ICsgc3RhdHVzQmFkZ2UoYS5zdGF0dXMpICsgJzwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj48L2Rpdj48L2Rpdj4nIDogJycpICsKICAgICAgJzxoMyBjbGFzcz0iZnMxMyBtYjgiPuC4m+C4o+C4sOC4p+C4',
  'seC4leC4tOC4l+C4seC5ieC4h+C4q+C4oeC4lCAoJyArIHAudGltZWxpbmUubGVuZ3RoICsgJyk8L2gzPicgKwogICAgICAocC50aW1lbGluZS5sZW5ndGggPyAnPGRpdiBjbGFzcz0idGwiPicgKyBwLnRpbWVsaW5lLm1hcChmdW5jdGlvbihlKXsKICAgICAgICBy',
  'ZXR1cm4gJzxkaXYgY2xhc3M9InRsLWkiPjxkaXYgY2xhc3M9ImQiPicgKyB0aERhdGUoZS5kYXRlKSArICcgwrcgJyArIGVzYyhlLnR5cGUpICsgJyAnICsgc3RhdHVzQmFkZ2UoZS5zdGF0dXMpICsgJzwvZGl2PicgKwogICAgICAgICAgJzxkaXYgY2xhc3M9InQi',
  'PicgKyBlc2MoZS50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAoZS5kZXRhaWwgPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCI+JyArIGVzYyhlLmRldGFpbCkgKyAnPC9kaXY+JyA6ICcnKSArCiAgICAgICAgICAoZS5jb3N0ID8gJzxkaXYgY2xhc3M9ImZz',
  'MTIgbXV0ZWQiPicgKyBiYWh0KGUuY29zdCkgKyAnPC9kaXY+JyA6ICcnKSArCiAgICAgICAgICAoZS5waG90b3MgJiYgZS5waG90b3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9Im10OCI+JyArIHRodW1ic0h0bWwoZS5waG90b3MpICsgJzwvZGl2PicgOiAnJykgKwog',
  'ICAgICAgICc8L2Rpdj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij7guKLguLHguIfguYTguKHguYjguKHguLXguJvguKPguLDguKfguLHguJXguLQ8L2Rpdj4nKTsKCiAgICBvcGVuTW9kYWwoJ/Cfmqog4Lir4LmJ',
  '4Lit4LiHICcgKyByb29tICsgJyDCtyDguIrguLHguYnguJkgJyArIChpLmZsb29yfHwnJyksIGJvZHksCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lib4Li04LiUPC9idXR0b24+JywgdHJ1ZSk7CiAgfSkuY2F0Y2go',
  'ZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwgJ2VycicpOyBjbG9zZU1vZGFsKCk7IH0pOwp9CgoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDgpIOC4o+C4suC4ouC4o+C4seC4',
  'mi3guKPguLLguKLguIjguYjguLLguKLguKvguK0gKOC4o+C4suC4ouC5gOC4lOC4t+C4reC4mSkKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5maW5hbmNlID0gewogIGxvYWQ6',
  'IGZ1bmN0aW9uKCl7CiAgICByZXR1cm4gUHJvbWlzZS5hbGwoWwogICAgICBjYWxsQXBpKCdmaW5hbmNlLnN1bW1hcnknLCB7IHllYXI6IFMueWVhciB9KSwKICAgICAgY2FsbEFwaSgnZmluYW5jZS5saXN0JywgeyB5ZWFyOiBTLnllYXIsIGtpbmQ6IFMucGFyYW1z',
  'LmtpbmQgfHwgJycgfSkKICAgIF0pLnRoZW4oZnVuY3Rpb24ocil7IHZhciBkID0gclswXTsgZC5pdGVtcyA9IHJbMV07IHJldHVybiBkOyB9KTsKICB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgeWVhckxhYmVsID0gUy55ZWFyID09PSAnYWxsJyA/',
  'ICfguJfguLjguIHguJvguLUnIDogJ+C4m+C4tSAnICsgUy55ZWFyOwogICAgdmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAga3BpKCfguKPguLLguKLguKPguLHguJogJyArIHllYXJMYWJlbCwgYmFodChkLmluY29tZSksICfg',
  'uYDguInguKXguLXguYjguKIgJyArIGJhaHQoZC5hdmdJbmNvbWUpICsgJy/guYDguJTguLfguK3guJknLCAnZ29vZCcpICsKICAgICAga3BpKCfguKPguLLguKLguIjguYjguLLguKIgJyArIHllYXJMYWJlbCwgYmFodChkLmV4cGVuc2UpLCAn4LmA4LiJ4Lil4Li1',
  '4LmI4LiiICcgKyBiYWh0KGQuYXZnRXhwZW5zZSkgKyAnL+C5gOC4lOC4t+C4reC4mScsICdiYWQnKSArCiAgICAgIGtwaSgn4LiE4LiH4LmA4Lir4Lil4Li34Lit4Liq4Li44LiX4LiY4Li0JywgYmFodChkLm5ldCksICfguK3guLHguJXguKPguLLguIHguLPguYTg',
  'uKMgJyArIHBjdChkLm1hcmdpbiksICdhY2NlbnQgJyArIChkLm5ldCA+PSAwID8gJ2dvb2QnIDogJ2JhZCcpKSArCiAgICAgIGtwaSgn4Lia4Lix4LiZ4LiX4Li24LiB4LmB4Lil4LmJ4LinJywgZC5tb250aHNXaXRoRGF0YSArICcg4LmA4LiU4Li34Lit4LiZJywg',
  'ZC5jb3VudCArICcg4Lij4Liy4Lii4LiB4Liy4LijJykgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIG1heEJhciA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGQuYnlNb250aC5tYXAoZnVuY3Rpb24obSl7IHJldHVybiBNYXRoLm1heChtLmluY29tZSwgbS5leHBlbnNl',
  'KTsgfSkpIHx8IDE7CiAgICB2YXIgbW9udGhseSA9IGNhcmQoJ/Cfk4Ug4Lij4Liy4Lii4LmA4LiU4Li34Lit4LiZIMK3ICcgKyB5ZWFyTGFiZWwsCiAgICAgICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0Ij48dGhlYWQ+PHRyPicgKwogICAgICAnPHRo',
  'PuC5gOC4lOC4t+C4reC4mTwvdGg+PHRoIGNsYXNzPSJudW0iPuC4o+C4suC4ouC4o+C4seC4mjwvdGg+PHRoIGNsYXNzPSJudW0iPuC4o+C4suC4ouC4iOC5iOC4suC4ojwvdGg+PHRoIGNsYXNzPSJudW0iPuC4hOC4h+C5gOC4q+C4peC4t+C4rTwvdGg+JyArCiAg',
  'ICAgICc8dGggc3R5bGU9IndpZHRoOjM4JSI+4LmA4LiX4Li14Lii4Lia4Lij4Liy4Lii4Lij4Lix4LiaIC8g4Lij4Liy4Lii4LiI4LmI4Liy4LiiPC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICBkLmJ5TW9udGgubWFwKGZ1bmN0aW9uKG0pewogICAg',
  'ICAgIHZhciBibGFuayA9ICFtLmluY29tZSAmJiAhbS5leHBlbnNlOwogICAgICAgIHJldHVybiAnPHRyJyArIChibGFuayA/ICcgc3R5bGU9Im9wYWNpdHk6LjQ1IicgOiAnJykgKyAnPicgKwogICAgICAgICAgJzx0ZD48Yj4nICsgbS5sYWJlbCArICc8L2I+PC90',
  'ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChtLmluY29tZSA/IG1vbmV5KG0uaW5jb21lKSA6ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKG0uZXhwZW5zZSA/IG1vbmV5KG0uZXhwZW5zZSkgOiAn',
  '4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+PGIgc3R5bGU9ImNvbG9yOicgKyAobS5uZXQgPj0gMCA/ICd2YXIoLS1vayknIDogJ3ZhcigtLWRhbmdlciknKSArICciPicgKwogICAgICAgICAgICAoYmxhbmsgPyAn4oCTJyA6IG1v',
  'bmV5KG0ubmV0KSkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAnPHRkPicgKwogICAgICAgICAgICAnPGRpdiBjbGFzcz0iYmFyLXRyYWNrIG1iOCI+PGRpdiBjbGFzcz0iYmFyLWZpbGwiIHN0eWxlPSJ3aWR0aDonICsgKG0uaW5jb21lL21heEJhcioxMDApICsg',
  'JyU7YmFja2dyb3VuZDp2YXIoLS1vaykiPjwvZGl2PjwvZGl2PicgKwogICAgICAgICAgICAnPGRpdiBjbGFzcz0iYmFyLXRyYWNrIj48ZGl2IGNsYXNzPSJiYXItZmlsbCIgc3R5bGU9IndpZHRoOicgKyAobS5leHBlbnNlL21heEJhcioxMDApICsgJyU7YmFja2dy',
  'b3VuZDp2YXIoLS1kYW5nZXIpIj48L2Rpdj48L2Rpdj4nICsKICAgICAgICAgICc8L3RkPjwvdHI+JzsKICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicsICcnLCB0cnVlKTsKCiAgICB2YXIgYnlLaW5kID0gY2FyZCgn8J+nviDguYHg',
  'uKLguIHguJXguLLguKHguKPguLLguKLguIHguLLguKMgwrcgJyArIHllYXJMYWJlbCwKICAgICAgYmFyQ2hhcnQoZC5ieUtpbmQubWFwKGZ1bmN0aW9uKGspeyByZXR1cm4geyBsYWJlbDogay5raW5kICsgJyAoJyArIGsuY291bnQgKyAnKScsIHRvdGFsOiBrLnRv',
  'dGFsIH07IH0pLAogICAgICAgICAgICAgICAnbGFiZWwnLCAndG90YWwnLCBmdW5jdGlvbihpKXsgcmV0dXJuIG1vbmV5KGkudG90YWwpICsgJyDguL8nOyB9KSk7CgogICAgdmFyIGJ5WWVhciA9IGNhcmQoJ/Cfk4og4LmA4LiX4Li14Lii4Lia4Lij4Liy4Lii4Lib',
  '4Li1JywKICAgICAgZC5ieVllYXIubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiIHN0eWxlPSJtaW4td2lkdGg6YXV0byI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC4m+C4tTwvdGg+PHRoIGNsYXNzPSJudW0iPuC4o+C4suC4',
  'ouC4o+C4seC4mjwvdGg+PHRoIGNsYXNzPSJudW0iPuC4o+C4suC4ouC4iOC5iOC4suC4ojwvdGg+PHRoIGNsYXNzPSJudW0iPuC4hOC4h+C5gOC4q+C4peC4t+C4rTwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICBkLmJ5WWVhci5tYXAoZnVuY3Rp',
  'b24oeSl7CiAgICAgICAgICByZXR1cm4gJzx0ciBvbmNsaWNrPSJzZXRZZWFyRnJvbVRhYmxlKCcgKyB5LnllYXIgKyAnKSIgc3R5bGU9ImN1cnNvcjpwb2ludGVyIj4nICsKICAgICAgICAgICAgJzx0ZD48Yj4nICsgeS55ZWFyICsgJzwvYj4gPHNwYW4gY2xhc3M9',
  'ImZhaW50IGZzMTIiPi8gJyArICh5LnllYXIrNTQzKSArICc8L3NwYW4+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbW9uZXkoeS5pbmNvbWUpICsgJzwvdGQ+PHRkIGNsYXNzPSJudW0iPicgKyBtb25leSh5LmV4cGVuc2UpICsgJzwv',
  'dGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+PGIgc3R5bGU9ImNvbG9yOicgKyAoeS5uZXQ+PTA/J3ZhcigtLW9rKSc6J3ZhcigtLWRhbmdlciknKSArICciPicgKyBtb25leSh5Lm5ldCkgKyAnPC9iPjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpv',
  'aW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij7guKLguLHguIfguYTguKHguYjguKHguLXguILguYnguK3guKHguLnguKU8L2Rpdj4nLCAnJywgdHJ1ZSk7CgogICAgdmFyIGtpbmRzID0gJzxkaXYgY2xhc3M9ImNo',
  'aXBzIG1iMTIiPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iY2hpcCAnICsgKCFTLnBhcmFtcy5raW5kPydvbic6JycpICsgJyIgb25jbGljaz0ic2V0UGFyYW0oXCdraW5kXCcsXCdcJykiPuC4l+C4uOC4geC4o+C4suC4ouC4geC4suC4ozwvYnV0dG9uPicgKwog',
  'ICAgICBkLmJ5S2luZC5tYXAoZnVuY3Rpb24oayl7CiAgICAgICAgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJjaGlwICcgKyAoUy5wYXJhbXMua2luZD09PWsua2luZD8nb24nOicnKSArICciIG9uY2xpY2s9InNldFBhcmFtKFwna2luZFwnLFwnJyArIGVzYyhrLmtp',
  'bmQpICsgJ1wnKSI+JyArCiAgICAgICAgICAgICAgIGVzYyhrLmtpbmQpICsgJyAoJyArIGsuY291bnQgKyAnKTwvYnV0dG9uPic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7CgogICAgdmFyIHJvd3MgPSBkLml0ZW1zOwogICAgdmFyIGxpc3QgPSBjYXJk',
  'KCfwn5OSIOC4o+C4suC4ouC4geC4suC4o+C4l+C4seC5ieC4h+C4q+C4oeC4lCDCtyAnICsgeWVhckxhYmVsICsgJyAoJyArIHJvd3MubGVuZ3RoICsgJyknLAogICAgICByb3dzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0Ij48dGhl',
  'YWQ+PHRyPicgKwogICAgICAgICc8dGg+4Lin4Lix4LiZ4LiX4Li14LmIPC90aD48dGg+4Lij4Liy4Lii4LiB4Liy4LijPC90aD48dGggY2xhc3M9Im51bSI+4LiI4Liz4LiZ4Lin4LiZ4LmA4LiH4Li04LiZPC90aD48dGg+4Lij4Lit4Lia4Lia4Li04LilPC90aD48',
  'dGg+4LiK4LmI4Lit4LiH4LiX4Liy4LiHPC90aD4nICsKICAgICAgICAnPHRoPuC4quC4peC4tOC4mzwvdGg+PHRoPuC4q+C4oeC4suC4ouC5gOC4q+C4leC4uDwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICByb3dzLm1hcChmdW5j',
  'dGlvbih4KXsKICAgICAgICAgIHZhciBpbmMgPSB4LmZsb3cgPT09ICfguKPguLLguKLguKPguLHguJonOwogICAgICAgICAgcmV0dXJuICc8dHI+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHguZGF0ZSkgKyAnPC90',
  'ZD4nICsKICAgICAgICAgICAgJzx0ZD48Yj4nICsgZXNjKHgua2luZCkgKyAnPC9iPiAnICsgKGluYyA/ICc8c3BhbiBjbGFzcz0iYiBvayI+4Lij4Liy4Lii4Lij4Lix4LiaPC9zcGFuPicgOiAnPHNwYW4gY2xhc3M9ImIgbXV0ZSI+4Lij4Liy4Lii4LiI4LmI4Liy',
  '4LiiPC9zcGFuPicpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+PGIgc3R5bGU9ImNvbG9yOicgKyAoaW5jPyd2YXIoLS1vayknOid2YXIoLS1pbmspJykgKyAnIj4nICsgKGluYz8nKyc6J+KIkicpICsgbW9uZXkoeC5hbW91bnQsIDIp',
  'ICsgJzwvYj48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKHguYmlsbE1vbnRoIHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKHguY2hhbm5lbCB8fCAn4oCTJykgKyAn',
  'PC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCh4LnNsaXBSZWZzKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIG11dGVkIGNsaXAiPicgKyBlc2MoeC5ub3RlIHx8ICcnKSArICc8L3RkPicgKwogICAgICAgICAg',
  'ICAnPHRkPjxkaXYgY2xhc3M9InQtYWN0aW9ucyI+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIiBvbmNsaWNrPVwnZm9ybUZpbmFuY2UoJyArIGF0dHIoeCkgKyAnKVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAgICAgICAgICAg',
  'ICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiBkZ3IiIG9uY2xpY2s9ImRlbEZpbmFuY2UoXCcnICsgeC5pZCArICdcJykiPvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICAgJzwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJv',
  'ZHk+PC90YWJsZT48L2Rpdj4nCiAgICAgIDogZW1wdHlCb3goJ+C4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4o+C4suC4ouC4geC4suC4o+C5g+C4mScgKyB5ZWFyTGFiZWwsICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtRmluYW5jZShudWxs',
  'KSI+KyDguJrguLHguJnguJfguLbguIHguKPguLLguKLguIHguLLguKM8L2J1dHRvbj4nKSwKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgc20iIG9uY2xpY2s9ImZvcm1GaW5hbmNlKG51bGwpIj4rIOC4muC4seC4meC4l+C4tuC4geC4o+C4suC4ouC4o+C4',
  'seC4mi3guKPguLLguKLguIjguYjguLLguKI8L2J1dHRvbj4nLCB0cnVlKTsKCiAgICByZXR1cm4gaGVhZCArIG1vbnRobHkgKyAnPGRpdiBjbGFzcz0iZ3JpZCBnMiBtdDEyIG1iMTIiPicgKyBieUtpbmQgKyBieVllYXIgKyAnPC9kaXY+JyArIGtpbmRzICsgbGlz',
  'dDsKICB9Cn07CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgOSkg4Lij4Liy4Lii4LiH4Liy4LiZICYg4Liq4Liz4Lij4Lit4LiH4LiC4LmJ4Lit4Lih4Li54LilCiAgID09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMucmVwb3J0cyA9IHsKICBsb2FkOiBmdW5jdGlvbigpewogICAgcmV0dXJuIFByb21pc2UuYWxsKFsKICAgICAgY2FsbEFwaSgncmVwb3J0LmNvc3RQZXJSb29t',
  'JywgeyB5ZWFyOiBTLnllYXIgfSksCiAgICAgIGNhbGxBcGkoJ3JlcG9ydC51cGNvbWluZycsIHsgZGF5czogOTAgfSksCiAgICAgIGNhbGxBcGkoJ2JhY2t1cC5zaGVldHMnLCB7fSksCiAgICAgIGNhbGxBcGkoJ3NoYXJlLmxpbmtzJywge30pLmNhdGNoKGZ1bmN0',
  'aW9uKCl7IHJldHVybiB7fTsgfSksCiAgICAgIGNhbGxBcGkoJ2JhY2t1cC5oaXN0b3J5Jywge30pLmNhdGNoKGZ1bmN0aW9uKCl7IHJldHVybiBbXTsgfSkKICAgIF0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICAgIHJldHVybiB7IGNvc3Q6IHJbMF0sIHVwY29taW5n',
  'OiByWzFdLCBzaGVldHM6IHJbMl0sIGxpbmtzOiByWzNdIHx8IHt9LCBiYWNrdXBzOiByWzRdIHx8IFtdLCB5ZWFyczogW10gfTsKICAgIH0pOwogIH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09ICdhbGwnID8g',
  'J+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgYyA9IGQuY29zdDsKICAgIHZhciB0b3AgPSBjLnJvb21zLmZpbHRlcihmdW5jdGlvbihyKXsgcmV0dXJuIHIudG90YWwgPiAwOyB9KTsKICAgIHZhciBtYXhDb3N0ID0gdG9wLmxl',
  'bmd0aCA/IHRvcFswXS50b3RhbCA6IDE7CgogICAgdmFyIHVwY29taW5nID0gY2FyZCgn8J+Xk++4jyDguJvguI/guLTguJfguLTguJnguIfguLLguJnguJfguLXguYjguIHguLPguKXguLHguIfguIjguLDguJbguLbguIcgKDkwIOC4p+C4seC4mSkgwrcgJyArIGQu',
  'dXBjb21pbmcubGVuZ3RoICsgJyDguIfguLLguJknLAogICAgICBkLnVwY29taW5nLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJhbGlzdCI+JyArIGQudXBjb21pbmcubWFwKGZ1bmN0aW9uKHUpewogICAgICAgIHZhciBsdmwgPSB1LmRheXNMZWZ0IDwgMCA/ICdkYW5n',
  'ZXInIDogKHUuZGF5c0xlZnQgPD0gNyA/ICd3YXJuJyA6ICdpbmZvJyk7CiAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJhbGkgbC0nICsgbHZsICsgJyIgb25jbGljaz0iZ28oXCcnICsganVtcFBhZ2UodS5tb2R1bGUpICsgJ1wnKSI+JyArCiAgICAgICAgICAn',
  'PGRpdiBjbGFzcz0iaWMiPicgKyB1Lmljb24gKyAnPC9kaXY+PGRpdj4nICsKICAgICAgICAgICc8ZGl2IGNsYXNzPSJ0dCI+JyArIGVzYyh1LnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgICAgICc8ZGl2IGNsYXNzPSJkZCI+JyArIHRoRGF0ZSh1LmRhdGUpICsg',
  'JyDCtyAnICsKICAgICAgICAgICAgKHUuZGF5c0xlZnQgPCAwID8gJ+C5gOC4peC4ouC4geC4s+C4q+C4meC4lCAnICsgKC11LmRheXNMZWZ0KSArICcg4Lin4Lix4LiZJyA6ICh1LmRheXNMZWZ0ID09PSAwID8gJ+C4p+C4seC4meC4meC4teC5iScgOiAn4Lit4Li1',
  '4LiBICcgKyB1LmRheXNMZWZ0ICsgJyDguKfguLHguJknKSkgKwogICAgICAgICAgICAodS5kZXRhaWwgPyAnIMK3ICcgKyBlc2ModS5kZXRhaWwpIDogJycpICsgJzwvZGl2PjwvZGl2PjwvZGl2Pic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicgOiAnPGRp',
  'diBjbGFzcz0iZW1wdHkiPjxkaXYgY2xhc3M9ImJpZyI+8J+MpO+4jzwvZGl2PuC5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4meC4seC4lOC4q+C4oeC4suC4ouC5g+C4mSA5MCDguKfguLHguJnguILguYnguLLguIfguKvguJnguYnguLI8L2Rpdj4nLCAnJywgdHJ1',
  'ZSk7CgogICAgdmFyIGNvc3RDYXJkID0gY2FyZCgn8J+Pt++4jyDguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguKrguLDguKrguKHguKPguLLguKLguKvguYnguK3guIcgwrcgJyArIHllYXJMYWJlbCwKICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzMgbWIx',
  'MiI+JyArCiAgICAgICAga3BpKCfguKPguKfguKHguJfguLjguIHguKvguYnguK3guIcnLCBiYWh0KGMudG90YWwpLCAnJykgKwogICAgICAgIGtwaSgn4LmA4LiJ4Lil4Li14LmI4Lii4LiV4LmI4Lit4Lir4LmJ4Lit4LiHJywgYmFodChjLmF2ZXJhZ2UpLCAnJykg',
  'KwogICAgICAgIGtwaSgn4Lir4LmJ4Lit4LiH4LiX4Li14LmI4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Liq4Li54LiH4Liq4Li44LiUJywgdG9wLmxlbmd0aCA/ICgn4Lir4LmJ4Lit4LiHICcgKyB0b3BbMF0ucm9vbSkgOiAn4oCTJywgdG9wLmxlbmd0aCA/IGJhaHQo',
  'dG9wWzBdLnRvdGFsKSA6ICcnKSArCiAgICAgICc8L2Rpdj4nICsKICAgICAgKHRvcC5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC4q+C5ieC4reC4hzwvdGg+PHRoIGNsYXNzPSJu',
  'dW0iPuC4h+C4suC4meC4i+C5iOC4reC4oTwvdGg+PHRoIGNsYXNzPSJudW0iPuC4hOC5iOC4suC4i+C5iOC4reC4oTwvdGg+PHRoIGNsYXNzPSJudW0iPuC4peC5ieC4suC4h+C5geC4reC4o+C5jDwvdGg+JyArCiAgICAgICAgJzx0aCBjbGFzcz0ibnVtIj7guILg',
  'uK3guIfguYDguILguYnguLLguKvguYnguK3guIc8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKPguKfguKE8L3RoPjx0aCBzdHlsZT0id2lkdGg6MjYlIj48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgdG9wLm1hcChmdW5jdGlvbihyKXsKICAgICAg',
  'ICAgIHJldHVybiAnPHRyIG9uY2xpY2s9Im9wZW5Sb29tKFwnJyArIHIucm9vbSArICdcJykiIHN0eWxlPSJjdXJzb3I6cG9pbnRlciI+JyArCiAgICAgICAgICAgICc8dGQ+PGI+JyArIHIucm9vbSArICc8L2I+IDxzcGFuIGNsYXNzPSJmYWludCBmczEyIj7guIrg',
  'uLHguYnguJkgJyArIHIuZmxvb3IgKyAnPC9zcGFuPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIHIuam9icyArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAoci5yZXBhaXIgPyBtb25leShyLnJlcGFp',
  'cikgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHIuYWMgPyBtb25leShyLmFjKSA6ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAoci5wdXJjaGFzZSA/IG1vbmV5',
  'KHIucHVyY2hhc2UpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+PGI+JyArIG1vbmV5KHIudG90YWwpICsgJzwvYj48L3RkPicgKwogICAgICAgICAgICAnPHRkPjxkaXYgY2xhc3M9ImJhci10cmFjayI+PGRpdiBjbGFz',
  'cz0iYmFyLWZpbGwiIHN0eWxlPSJ3aWR0aDonICsgKHIudG90YWwvbWF4Q29zdCoxMDApICsgJyUiPjwvZGl2PjwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nCiAgICAgIDogJzxkaXYgY2xhc3M9',
  'ImVtcHR5Ij7guKLguLHguIfguYTguKHguYjguKHguLXguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguJfguLXguYjguJrguLHguJnguJfguLbguIHguYTguKfguYnguKPguLLguKLguKvguYnguK3guIc8ZGl2IGNsYXNzPSJmczEyIG10OCI+4LmD4Liq4LmI',
  'ICLguITguYjguLLguYPguIrguYnguIjguYjguLLguKIiIOC5g+C4meC4h+C4suC4meC4i+C5iOC4reC4oS/guKXguYnguLLguIfguYHguK3guKPguYwg4Lir4Lij4Li34Lit4Lij4Liw4Lia4Li44Lir4LmJ4Lit4LiH4LmD4LiZ4Lij4Liy4Lii4LiB4Liy4Lij4LiL',
  '4Li34LmJ4Lit4LiC4Lit4LiHIOC5geC4peC5ieC4p+C4leC4seC4p+C5gOC4peC4guC4iOC4sOC4guC4tuC5ieC4meC4l+C4teC5iOC4meC4teC5iDwvZGl2PjwvZGl2PicpKTsKCiAgICB2YXIgYmFja3VwID0gY2FyZCgn8J+SviDguKrguLPguKPguK3guIfguYHg',
  'uKXguLDguIHguLnguYnguITguLfguJnguILguYnguK3guKHguLnguKUnLAogICAgICAnPHAgY2xhc3M9ImZzMTMgbXV0ZWQiPuC4guC5ieC4reC4oeC4ueC4peC4l+C4seC5ieC4h+C4q+C4oeC4lOC4reC4ouC4ueC5iOC5g+C4meC4o+C4sOC4muC4muC4meC4teC5',
  'iSDigJQg4LiE4Lin4Lij4LiU4Liy4Lin4LiZ4LmM4LmC4Lir4Lil4LiU4Liq4Liz4Lij4Lit4LiH4LmE4Lin4LmJ4LmA4LiU4Li34Lit4LiZ4Lil4Liw4LiE4Lij4Lix4LmJ4LiHICcgKwogICAgICAn4LmE4Lif4Lil4LmMIEpTT04g4LiZ4Liz4LiB4Lil4Lix4Lia',
  '4LmA4LiC4LmJ4Liy4Lij4Liw4Lia4Lia4LmE4LiU4LmJIOC4quC5iOC4p+C4mSBDU1Yg4LmA4Lib4Li04LiU4LmD4LiZIEV4Y2VsIOC4q+C4o+C4t+C4rSBHb29nbGUgU2hlZXRzIOC5hOC4lOC5ieC5gOC4peC4ojwvcD4nICsKICAgICAgJzxkaXYgY2xhc3M9InJv',
  'dyBtdDEyIj4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZG9FeHBvcnRKc29uKCkiPuKsh++4jyDguJTguLLguKfguJnguYzguYLguKvguKXguJTguKrguLPguKPguK3guIfguJfguLHguYnguIfguKvguKHguJQgKEpTT04pPC9i',
  'dXR0b24+JyArCiAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iZG9JbXBvcnRKc29uKCkiPuKshu+4jyDguIHguLnguYnguITguLfguJnguIjguLLguIHguYTguJ/guKXguYzguKrguLPguKPguK3guIc8L2J1dHRvbj4nICsKICAgICAgJzwvZGl2',
  'PicgKwogICAgICAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtYjgiPuC4quC5iOC4h+C4reC4reC4geC5gOC4m+C5h+C4mSBDU1Yg4LmB4Lii4LiB4LiV4Liy4Lij4Liy4LiHPC9kaXY+JyArCiAgICAgICc8',
  'ZGl2IGNsYXNzPSJjaGlwcyI+JyArIGQuc2hlZXRzLm1hcChmdW5jdGlvbihuKXsKICAgICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9ImNoaXAiIG9uY2xpY2s9ImRvRXhwb3J0Q3N2KFwnJyArIGVzYyhuKSArICdcJykiPicgKyBlc2Moc2hlZXRMYWJlbChuKSkg',
  'KyAnPC9idXR0b24+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+Jyk7CgogICAgdmFyIHNoYXJlID0gKGNhbkVkaXQoKSAmJiBkLmxpbmtzICYmIGQubGlua3Mudmlld1VybCkgPyBjYXJkKCfwn5SXIOC4peC4tOC4h+C4geC5jOC5gOC4guC5ieC4suC5g+C4',
  'iuC5ieC4h+C4suC4mScsCiAgICAgICc8ZGl2IGNsYXNzPSJmIG1iMTIiPjxsYWJlbD7wn5SRIOC4peC4tOC4h+C4geC5jOC4guC4reC4h+C4hOC4uOC4kyAo4LmB4LiB4LmJ4LmE4LiC4LiC4LmJ4Lit4Lih4Li54Lil4LmE4LiU4LmJIOKAlCDguK3guKLguYjguLLg',
  'uKrguYjguIfguJXguYjguK0pPC9sYWJlbD4nICsKICAgICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIHJlYWRvbmx5IHZhbHVlPSInICsgZXNjKGQubGlua3MuYWRtaW5VcmwpICsgJyIgb25jbGljaz0idGhpcy5zZWxlY3QoKSI+PC9kaXY+JyArCiAgICAgICc8ZGl2',
  'IGNsYXNzPSJmIj48bGFiZWw+8J+RgCDguKXguLTguIfguIHguYzguYHguIrguKPguYwgKOC5gOC4m+C4tOC4lOC4lOC4ueC5hOC4lOC5ieC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pyDigJQg4Liq4LmI4LiH4LmD4Lir4LmJ4LmD4LiE4Lij4LiB4LmH4LmE',
  '4LiU4LmJKTwvbGFiZWw+JyArCiAgICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0ic2hhcmVVcmwiIHJlYWRvbmx5IHZhbHVlPSInICsgZXNjKGQubGlua3Mudmlld1VybCkgKyAnIiBvbmNsaWNrPSJ0aGlzLnNlbGVjdCgpIj48L2Rpdj4nICsKICAgICAgJzxk',
  'aXYgY2xhc3M9InJvdyBtdDEyIj4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iY29weVNoYXJlKCkiPvCfk4sg4LiE4Lix4LiU4Lil4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmMPC9idXR0b24+JyArCiAgICAgICAg',
  'JzxidXR0b24gY2xhc3M9ImJ0biBkZ3IiIG9uY2xpY2s9ImRvUm90YXRlU2hhcmUoKSI+8J+UgSDguK3guK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYzguYPguKvguKHguYg8L2J1dHRvbj4nICsKICAgICAgJzwvZGl2PicgKwogICAgICAnPHAgY2xhc3M9',
  'ImZzMTIgbXV0ZWQgbXQxMiI+4LiE4LiZ4LiX4Li14LmI4LmA4Lib4Li04LiU4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LiI4Liw4LmA4Lir4LmH4LiZ4LiC4LmJ4Lit4Lih4Li54Lil4LiX4Lix4LmJ4LiH4Lir4Lih4LiU4LmB4Lia4Lia4Lit4LmI4Liy4LiZ',
  '4Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinICcgKwogICAgICAn4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4Lih4Li14Lia4Lix4LiN4LiK4Li1IEdvb2dsZSDguYHguKXguLDguYTguKHguYjguYDguKvguYfguJkgR29vZ2xlIFNoZWV0IOC4guC4reC4h+C4hOC4',
  'uOC4kyDCtyAnICsKICAgICAgJ+C4luC5ieC4suC4peC4tOC4h+C4geC5jOC4q+C4peC4uOC4lOC5g+C4q+C5ieC4geC4lCAi4Lit4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LmD4Lir4Lih4LmIIiDguKXguLTguIfguIHguYzguYDguJTguLTguKHg',
  'uIjguLDguYPguIrguYnguYTguKHguYjguYTguJTguYnguJfguLHguJnguJfguLU8L3A+JykgOiAnJzsKCiAgICB2YXIgZHJpdmUgPSBjYW5FZGl0KCkgPyBjYXJkKCfimIHvuI8g4Liq4Liz4Lij4Lit4LiH4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li04LmD4LiZ',
  'IEdvb2dsZSBEcml2ZSAoJyArIGQuYmFja3Vwcy5sZW5ndGggKyAnIOC4iuC4uOC4lCknLAogICAgICAnPHAgY2xhc3M9ImZzMTMgbXV0ZWQiPuC4o+C4sOC4muC4muC5gOC4geC5h+C4muC5hOC4n+C4peC5jOC4quC4s+C4o+C4reC4h+C5hOC4p+C5ieC5g+C4meC5',
  'guC4n+C4peC5gOC4lOC4reC4o+C5jCAi4Liq4Liz4Lij4Lit4LiH4LiC4LmJ4Lit4Lih4Li54LilIiDguJrguJnguYTguJTguKPguJ/guYzguILguK3guIfguITguLjguJMgJyArCiAgICAgICfguJXguLHguYnguIfguYPguKvguYnguJfguLPguK3guLHguJXguYLg',
  'uJnguKHguLHguJXguLTguJfguLjguIHguKfguLHguJnguYTguJTguYnguIjguLLguIHguYDguKHguJnguLnguYPguJnguIrguLXguJU8L3A+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQxMiI+PGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJkb0JhY2t1',
  'cE5vdygpIj7wn5K+IOC4quC4s+C4o+C4reC4h+C5gOC4lOC4teC5i+C4ouC4p+C4meC4teC5iTwvYnV0dG9uPjwvZGl2PicgKwogICAgICAoZC5iYWNrdXBzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+PGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFz',
  'cz0idCIgc3R5bGU9Im1pbi13aWR0aDphdXRvIj48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4LmE4Lif4Lil4LmMPC90aD48dGg+4LmA4Lin4Lil4LiyPC90aD48dGggY2xhc3M9Im51bSI+4LiC4LiZ4Liy4LiUPC90aD48L3RyPjwvdGhlYWQ+PHRib2R5Picg',
  'KwogICAgICAgIGQuYmFja3Vwcy5zbGljZSgwLDEwKS5tYXAoZnVuY3Rpb24oYil7CiAgICAgICAgICByZXR1cm4gJzx0cj48dGQgY2xhc3M9ImZzMTIiPjxhIGhyZWY9IicgKyBlc2MoYi51cmwpICsgJyIgdGFyZ2V0PSJfYmxhbmsiPicgKyBlc2MoYi5uYW1lKSAr',
  'ICc8L2E+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyhiLmF0KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0gZnMxMiI+JyArIE1hdGgucm91bmQoYi5zaXplLzEwMjQpICsgJyBLQjwvdGQ+PC90cj4n',
  'OwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nIDogJycpKSA6ICcnOwoKICAgIHJldHVybiB1cGNvbWluZyArICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgY29zdENhcmQgKyAnPC9kaXY+JyArCiAgICAgICAgICAgKHNoYXJlID8g',
  'JzxkaXYgY2xhc3M9Im10MTIiPicgKyBzaGFyZSArICc8L2Rpdj4nIDogJycpICsKICAgICAgICAgICAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIGJhY2t1cCArICc8L2Rpdj4nICsKICAgICAgICAgICAoZHJpdmUgPyAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIGRyaXZl',
  'ICsgJzwvZGl2PicgOiAnJyk7CiAgfQp9OwoKZnVuY3Rpb24gc2hlZXRMYWJlbChuKXsKICByZXR1cm4gKHsKICAgIERlYnRzOifguIHguYnguK3guJnguKvguJnguLXguYknLCBEZWJ0UGF5bWVudHM6J+C4o+C4suC4ouC4geC4suC4o+C4iuC4s+C4o+C4sOC4q+C4',
  'meC4teC5iScsIFB1cmNoYXNlczon4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHJywgUm9vbXM6J+C4l+C4sOC5gOC4muC4teC4ouC4meC4q+C5ieC4reC4hycsCiAgICBBY1NlcnZpY2U6J+C4peC5ieC4suC4h+C5geC4reC4o+C5jCcsIFJv',
  'b21SZXBhaXJzOifguIvguYjguK3guKHguYHguIvguKHguKvguYnguK3guIcnLCBCdWlsZGluZ1JlcGFpcnM6J+C4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4gScsCiAgICBSb29tQXNzZXRzOifguJfguKPguLHguJ7guKLguYzguKrguLTguJnguKvguYnguK3g',
  'uIcnLCBGaW5hbmNlOifguKPguLLguKLguKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4LiiJywgU2V0dGluZ3M6J+C4leC4seC5ieC4h+C4hOC5iOC4sicsIEFjdGl2aXR5TG9nOifguJvguKPguLDguKfguLHguJXguLTguIHguLLguKPguYHguIHguYnguYTguIIn',
  'CiAgfSlbbl0gfHwgbjsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4leC4seC4p+C4iuC5iOC4p+C4ouC4p+C4suC4lOC4i+C5ieC4syDguYYKICAgPT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgpmdW5jdGlvbiBrcGkobGFiZWwsIHZhbHVlLCBjYXAsIGNscyl7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJrcGkgJyArIChjbHN8fCcnKSArICciPicgKwogICAgJzxkaXYgY2xhc3M9',
  'ImxibCI+JyArIGVzYyhsYWJlbCkgKyAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0idmFsIj4nICsgdmFsdWUgKyAnPC9kaXY+JyArCiAgICAoY2FwID8gJzxkaXYgY2xhc3M9ImNhcCI+JyArIGNhcCArICc8L2Rpdj4nIDogJycpICsgJzwvZGl2Pic7Cn0KCmZ1',
  'bmN0aW9uIGNhcmQodGl0bGUsIGJvZHksIGFjdGlvbnMsIGZsdXNoKXsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImNhcmQiPicgKwogICAgKHRpdGxlID8gJzxkaXYgY2xhc3M9ImNhcmQtaCI+PGgzPicgKyB0aXRsZSArICc8L2gzPicgKyAoYWN0aW9ucyA/ICc8ZGl2',
  'IGNsYXNzPSJzcCI+JyArIGFjdGlvbnMgKyAnPC9kaXY+JyA6ICcnKSArICc8L2Rpdj4nIDogJycpICsKICAgICc8ZGl2IGNsYXNzPSJjYXJkLWInICsgKGZsdXNoID8gJyBmbHVzaCcgOiAnJykgKyAnIj4nICsgYm9keSArICc8L2Rpdj48L2Rpdj4nOwp9CgovKiog',
  '4Lin4Liy4LiU4Lic4Lix4LiH4Lir4LmJ4Lit4LiH4LmB4Lia4LmI4LiH4LiV4Liy4Lih4LiK4Lix4LmJ4LiZIOKAlCBkZWNvcmF0ZShyb29tKSAtPiB7Y2xzLCBzdWIsIG9uY2xpY2t9ICovCmZ1bmN0aW9uIHJvb21GbG9vcnMocm9vbXMsIGRlY29yYXRlKXsKICB2',
  'YXIgYnlGbG9vciA9IHt9OwogIHJvb21zLmZvckVhY2goZnVuY3Rpb24ocil7CiAgICB2YXIgZiA9IHIuZmxvb3IgfHwgTnVtYmVyKFN0cmluZyhyLnJvb20pLmNoYXJBdCgwKSk7CiAgICAoYnlGbG9vcltmXSA9IGJ5Rmxvb3JbZl0gfHwgW10pLnB1c2gocik7CiAg',
  'fSk7CiAgdmFyIGZsb29ycyA9IE9iamVjdC5rZXlzKGJ5Rmxvb3IpLnNvcnQoKTsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImZsb29ycyI+JyArIGZsb29ycy5tYXAoZnVuY3Rpb24oZil7CiAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImZsb29yIj48ZGl2IGNsYXNzPSJm',
  'bG9vci10YWciPjxiPicgKyBmICsgJzwvYj7guIrguLHguYnguJk8L2Rpdj48ZGl2IGNsYXNzPSJyb29tcyI+JyArCiAgICAgIGJ5Rmxvb3JbZl0ubWFwKGZ1bmN0aW9uKHIpewogICAgICAgIHZhciBkID0gZGVjb3JhdGUocik7CiAgICAgICAgcmV0dXJuICc8ZGl2',
  'IGNsYXNzPSJyb29tICcgKyBkLmNscyArICciIG9uY2xpY2s9IicgKyBkLm9uY2xpY2sgKyAnIj4nICsKICAgICAgICAgICc8c3BhbiBjbGFzcz0iZG90Ij48L3NwYW4+PGRpdiBjbGFzcz0ibm8iPicgKyBlc2Moci5yb29tKSArICc8L2Rpdj4nICsKICAgICAgICAg',
  'ICc8ZGl2IGNsYXNzPSJzdCI+JyArIGQuc3ViICsgJzwvZGl2PjwvZGl2Pic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PjwvZGl2Pic7CiAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKfQoKLyoqIOC5g+C4quC5iCBvYmplY3Qg4Lil4LiH4LmD4LiZIG9uY2xp',
  'Y2sgYXR0cmlidXRlIOC5hOC4lOC5ieC4reC4ouC5iOC4suC4h+C4m+C4peC4reC4lOC4oOC4seC4oiAqLwpmdW5jdGlvbiBhdHRyKG9iail7CiAgdmFyIGNsZWFuID0ge307CiAgT2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uKGspewogICAgaWYgKGsu',
  'aW5kZXhPZignXycpID09PSAwIHx8IC9SZWZzJC8udGVzdChrKSB8fCBrID09PSAncmVjb3JkcycgfHwgayA9PT0gJ3dhcnJhbnR5JykgcmV0dXJuOwogICAgY2xlYW5ba10gPSBvYmpba107CiAgfSk7CiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGNsZWFuKS5yZXBs',
  'YWNlKC8mL2csJyZhbXA7JykucmVwbGFjZSgvJy9nLCcmIzM5OycpLnJlcGxhY2UoLyIvZywnJnF1b3Q7Jyk7Cn0KPC9zY3JpcHQ+CjxzY3JpcHQ+Ci8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBT',
  'ZXR0aW5ncy5odG1sIOKAlCDguKvguJnguYnguLLguJXguLHguYnguIfguITguYjguLIgwrcg4LiY4Li14LihIMK3IOC4muC4seC4jeC4iuC4teC4nOC4ueC5ieC5g+C4iuC5iSDCtyDguK3guLjguJvguIHguKPguJPguYwKICAgPT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4mOC4teC4oeC4quC4p+C5iOC4suC4hyAvIOC4oeC4t+C4lCAtLS0tLS0tLS0tLS0tLS0tICovCgp2YXIgTFNfVEhFTUUgPSAnbWNvcm5lci50aGVtZSc7',
  'CnZhciBUSEVNRVMgPSBbCiAgeyBpZDogJ+C4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hycsIGljOiAn8J+MlycsIGhpbnQ6ICfguKrguKXguLHguJrguJXguLLguKHguIHguLLguKPguJXguLHguYnguIfguITguYjguLLguILguK3guIfguK3guLjguJvguIHg',
  'uKPguJPguYwnIH0sCiAgeyBpZDogJ+C4quC4p+C5iOC4suC4hycsICAgICAgaWM6ICfimIDvuI8nLCBoaW50OiAn4Lie4Li34LmJ4LiZ4LiC4Liy4LinIOC4reC5iOC4suC4meC4h+C5iOC4suC4ouC4geC4peC4suC4h+C5geC4lOC4lCcgfSwKICB7IGlkOiAn4Lih',
  '4Li34LiUJywgICAgICAgIGljOiAn8J+MmScsIGhpbnQ6ICfguJ7guLfguYnguJnguYDguILguYnguKEg4Liq4Lia4Liy4Lii4LiV4Liy4LiV4Lit4LiZ4LiB4Lil4Liy4LiH4LiE4Li34LiZJyB9Cl07CgovKioKICog4LiX4Liy4LiY4Li14Lih4Lil4LiH4Lir4LiZ',
  '4LmJ4Liy4LmA4Lin4LmH4Lia4LiX4Lix4LiZ4LiX4Li1CiAqIOC4leC4seC4p+C5geC4m+C4o+C4quC4teC4l+C4seC5ieC4h+C4q+C4oeC4lOC4meC4tOC4ouC4suC4oeC5hOC4p+C5iSAzIOC4iuC4seC5ieC4meC5g+C4mSBTdHlsZS5odG1sIOC5geC4peC5ieC4',
  'pyDguJXguKPguIfguJnguLXguYnguYHguITguYjguJXguLTguJTguJvguYnguLLguKLguJrguK3guIHguKfguYjguLLguYPguIrguYnguIrguLHguYnguJnguYTguKvguJkKICovCmZ1bmN0aW9uIGFwcGx5VGhlbWUobmFtZSl7CiAgdmFyIHJvb3QgPSBkb2N1bWVu',
  'dC5kb2N1bWVudEVsZW1lbnQ7CiAgaWYgKG5hbWUgPT09ICfguKrguKfguYjguLLguIcnKSByb290LnNldEF0dHJpYnV0ZSgnZGF0YS10aGVtZScsICdsaWdodCcpOwogIGVsc2UgaWYgKG5hbWUgPT09ICfguKHguLfguJQnKSByb290LnNldEF0dHJpYnV0ZSgnZGF0',
  'YS10aGVtZScsICdkYXJrJyk7CiAgZWxzZSByb290LnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS10aGVtZScpOyAgICAgICAvLyDguJXguLLguKHguYDguITguKPguLfguYjguK3guIcgPSDguJvguKXguYjguK3guKLguYPguKvguYkgcHJlZmVycy1jb2xvci1zY2hlbWUg',
  '4LiV4Lix4LiU4Liq4Li04LiZCiAgdmFyIGJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0aGVtZUJ0bicpOwogIGlmIChidG4pIHsKICAgIHZhciB0ID0gVEhFTUVTLmZpbHRlcihmdW5jdGlvbih4KXsgcmV0dXJuIHguaWQgPT09IG5hbWU7IH0pWzBdIHx8',
  'IFRIRU1FU1swXTsKICAgIGJ0bi50ZXh0Q29udGVudCA9IHQuaWM7CiAgICBidG4udGl0bGUgPSAn4LiY4Li14LihOiAnICsgdC5pZCArICcgKOC4geC4lOC5gOC4nuC4t+C5iOC4reC4quC4peC4seC4miknOwogIH0KfQoKZnVuY3Rpb24gY3VycmVudFRoZW1lKCl7',
  'CiAgcmV0dXJuIGxzR2V0KExTX1RIRU1FKSB8fCAoUy5ib290ICYmIFMuYm9vdC5zZXR0aW5ncyAmJiBTLmJvb3Quc2V0dGluZ3MudGhlbWUpIHx8ICfguJXguLLguKHguYDguITguKPguLfguYjguK3guIcnOwp9CgovKiog4LiV4Lix4LmJ4LiH4LiY4Li14Lih4LmB',
  '4Lil4Liw4LiI4Liz4LmE4Lin4LmJIOKAlCDguJzguLnguYnguJTguLnguYHguKXguIjguLDguJbguLnguIHguJrguLHguJnguJfguLbguIHguYDguJvguYfguJnguITguYjguLLguJXguLHguYnguIfguJXguYnguJnguILguK3guIfguKPguLDguJrguJrguJTguYng',
  'uKfguKIgKi8KZnVuY3Rpb24gc2V0VGhlbWUobmFtZSwgcXVpZXQpewogIGxzU2V0KExTX1RIRU1FLCBuYW1lKTsKICBhcHBseVRoZW1lKG5hbWUpOwogIGlmIChTLmJvb3QgJiYgUy5ib290LmlzQWRtaW4pIHsKICAgIGNhbGxBcGkoJ3NldHRpbmdzLnNhdmUnLCB7',
  'IHZhbHVlczogeyB0aGVtZTogbmFtZSB9IH0pLmNhdGNoKGZ1bmN0aW9uKCl7IC8qIOC5gOC4geC5h+C4muC5g+C4meC5gOC4hOC4o+C4t+C5iOC4reC4h+C4geC5h+C4nuC4rSAqLyB9KTsKICB9CiAgaWYgKCFxdWlldCkgdG9hc3QoJ+C5gOC4m+C4peC4teC5iOC4',
  'ouC4meC5gOC4m+C5h+C4meC4mOC4teC4oScgKyAobmFtZSA9PT0gJ+C4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hycgPyAn4LiV4Liy4Lih4LmA4LiE4Lij4Li34LmI4Lit4LiHJyA6IG5hbWUpLCAnb2snKTsKICBpZiAoUy5wYWdlID09PSAnc2V0dGluZ3Mn',
  'KSBsb2FkKCk7Cn0KCi8qKiDguJvguLjguYjguKHguJrguJnguYHguJbguJrguKvguLHguKcg4oCUIOC4p+C4meC4quC4p+C5iOC4suC4hyDihpIg4Lih4Li34LiUIOKGkiDguJXguLLguKHguYDguITguKPguLfguYjguK3guIcgKi8KZnVuY3Rpb24gY3ljbGVUaGVt',
  'ZSgpewogIHZhciBvcmRlciA9IFsn4Liq4Lin4LmI4Liy4LiHJywgJ+C4oeC4t+C4lCcsICfguJXguLLguKHguYDguITguKPguLfguYjguK3guIcnXTsKICB2YXIgaSA9IG9yZGVyLmluZGV4T2YoY3VycmVudFRoZW1lKCkpOwogIHNldFRoZW1lKG9yZGVyWyhpICsg',
  'MSkgJSBvcmRlci5sZW5ndGhdKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguKvguJnguYnguLLguJXguLHguYnguIfguITguYjguLIgLS0tLS0tLS0tLS0tLS0tLSAqLwoKUk9VVEVTLnNldHRpbmdzID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7CiAgICByZXR1cm4g',
  'UHJvbWlzZS5hbGwoWwogICAgICBjYWxsQXBpKCdzZXR0aW5ncy5saXN0Jywge30pLAogICAgICBjYWxsQXBpKCdhdXRoLmRldmljZXMnLCB7fSkuY2F0Y2goZnVuY3Rpb24oKXsgcmV0dXJuIFtdOyB9KSwKICAgICAgKFMuYm9vdCAmJiBTLmJvb3QuaXNBZG1pbikg',
  'PyBjYWxsQXBpKCd1c2VyLmxpc3QnLCB7fSkuY2F0Y2goZnVuY3Rpb24oKXsgcmV0dXJuIFtdOyB9KSA6IFByb21pc2UucmVzb2x2ZShudWxsKSwKICAgICAgKFMuYm9vdCAmJiBTLmJvb3QuaXNBZG1pbikgPyBjYWxsQXBpKCdzaGFyZS5saW5rcycsIHt9KS5jYXRj',
  'aChmdW5jdGlvbigpeyByZXR1cm4ge307IH0pIDogUHJvbWlzZS5yZXNvbHZlKHt9KQogICAgXSkudGhlbihmdW5jdGlvbihyKXsKICAgICAgcmV0dXJuIHsgc2V0dGluZ3M6IHJbMF0sIGRldmljZXM6IHJbMV0gfHwgW10sIHVzZXJzOiByWzJdLCBsaW5rczogclsz',
  'XSB8fCB7fSwgeWVhcnM6IFtdIH07CiAgICB9KTsKICB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICByZXR1cm4gJycgKwogICAgICBzZXR0aW5nc0FjY291bnRDYXJkKGQpICsKICAgICAgc2V0dGluZ3NUaGVtZUNhcmQoKSArCiAgICAgIChkLnNldHRpbmdz',
  'LmNhbkVkaXQgPyBzZXR0aW5nc0dyb3Vwc0h0bWwoZC5zZXR0aW5ncykgOiBzZXR0aW5nc1JlYWRPbmx5Tm90ZSgpKSArCiAgICAgIChkLnVzZXJzID8gc2V0dGluZ3NVc2Vyc0NhcmQoZC51c2VycykgOiAnJykgKwogICAgICAoZC51c2VycyA/IHNldHRpbmdzU2hh',
  'cmVDYXJkKGQubGlua3MpIDogJycpOwogIH0KfTsKCi8qIC0tLS0g4Lia4Lix4LiN4LiK4Li14LiC4Lit4LiH4LiJ4Lix4LiZIC0tLS0gKi8KCmZ1bmN0aW9uIHNldHRpbmdzQWNjb3VudENhcmQoZCl7CiAgdmFyIG1lID0gQVVUSC5tZSB8fCB7fTsKICB2YXIgZGV2',
  'aWNlcyA9IGQuZGV2aWNlcyB8fCBbXTsKICByZXR1cm4gY2FyZCgn8J+RpCDguJrguLHguI3guIrguLXguILguK3guIfguInguLHguJknLAogICAgJzxkaXYgY2xhc3M9ImdyaWQgZzIgbWIxMiI+JyArCiAgICAgIGtwaSgn4LmA4LiC4LmJ4Liy4LmD4LiK4LmJ4LiH',
  '4Liy4LiZ4LmD4LiZ4LiK4Li34LmI4LitJywgZXNjKG1lLm5hbWUgfHwgbWUudXNlcm5hbWUgfHwgJ+KAkycpLCBlc2MobWUudXNlcm5hbWUgPyAnQCcgKyBtZS51c2VybmFtZSA6IChtZS52aWEgfHwgJycpKSkgKwogICAgICBrcGkoJ+C4quC4tOC4l+C4mOC4tOC5',
  'jOC4geC4suC4o+C5g+C4iuC5ieC4h+C4suC4mScsIGVzYyhtZS5yb2xlIHx8ICfigJMnKSwKICAgICAgICAgIG1lLmNhbkVkaXQgPyAn4LmA4Lie4Li04LmI4LihIOC5geC4geC5ieC5hOC4giDguYHguKXguLDguKXguJrguILguYnguK3guKHguLnguKXguYTguJTg',
  'uYknIDogJ+C5gOC4m+C4tOC4lOC4lOC4ueC5hOC4lOC5ieC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pycpICsKICAgICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3ciPicgKwogICAgICAobWUudXNlcm5hbWUgPyAnPGJ1dHRvbiBjbGFzcz0iYnRu',
  'IiBvbmNsaWNrPSJmb3JtQ2hhbmdlUGFzc3dvcmQoKSI+8J+UkSDguYDguJvguKXguLXguYjguKLguJnguKPguKvguLHguKrguJzguYjguLLguJk8L2J1dHRvbj4nIDogJycpICsKICAgICAgKG1lLnVzZXJuYW1lID8gJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGlj',
  'az0iZm9ybVNldFBpbigpIj7wn5SiICcgKwogICAgICAgIChBVVRILmRldmljZSA/ICfguJXguLHguYnguIcgUElOIOC5g+C4q+C4oeC5iOC4muC4meC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5iScgOiAn4LiV4Lix4LmJ4LiHIFBJTiDguKrguLPguKvguKPg',
  'uLHguJrguYDguITguKPguLfguYjguK3guIfguJnguLXguYknKSArICc8L2J1dHRvbj4nIDogJycpICsKICAgICAgKEFVVEguZGV2aWNlID8gJzxidXR0b24gY2xhc3M9ImJ0biBkZ3IiIG9uY2xpY2s9ImZvcmdldFRoaXNEZXZpY2UoKSI+4Lil4LiaIFBJTiDguYDg',
  'uITguKPguLfguYjguK3guIfguJnguLXguYk8L2J1dHRvbj4nIDogJycpICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY29uZmlybUxvZ291dCgpIj7wn5qqIOC4reC4reC4geC4iOC4suC4geC4o+C4sOC4muC4mjwvYnV0dG9uPicgKwogICAg',
  'JzwvZGl2PicgKwogICAgKGRldmljZXMubGVuZ3RoCiAgICAgID8gJzxkaXYgY2xhc3M9ImhyIj48L2Rpdj48ZGl2IGNsYXNzPSJmczEyIG11dGVkIG1iOCI+4Lit4Li44Lib4LiB4Lij4LiT4LmM4LiX4Li14LmI4LiV4Lix4LmJ4LiHIFBJTiDguYTguKfguYkgKCcg',
  'KyBkZXZpY2VzLmxlbmd0aCArICcpPC9kaXY+JyArCiAgICAgICAgJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiIHN0eWxlPSJtaW4td2lkdGg6YXV0byI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC4reC4uOC4m+C4geC4o+C4k+C5jDwvdGg+',
  'PHRoPuC4leC4seC5ieC4h+C5gOC4oeC4t+C5iOC4rTwvdGg+PHRoPuC5g+C4iuC5ieC4peC5iOC4suC4quC4uOC4lDwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICBkZXZpY2VzLm1hcChmdW5jdGlvbih4KXsKICAgICAgICAgIHJldHVybiAnPHRy',
  'Pjx0ZD4nICsgZXNjKHguZGV2aWNlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgdGhEYXRlU2hvcnQoU3RyaW5nKHguY3JlYXRlZEF0KS5zbGljZSgwLDEwKSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0i',
  'ZnMxMiI+JyArIHRoRGF0ZVNob3J0KFN0cmluZyh4Lmxhc3RTZWVuKS5zbGljZSgwLDEwKSkgKyAnPC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQxMiI+',
  'PGJ1dHRvbiBjbGFzcz0iYnRuIGRnciBzbSIgb25jbGljaz0iZG9Gb3JnZXRBbGxEZXZpY2VzKCkiPuC4ouC4geC5gOC4peC4tOC4gSBQSU4g4LiX4Li44LiB4LmA4LiE4Lij4Li34LmI4Lit4LiHPC9idXR0b24+PC9kaXY+JwogICAgICA6ICcnKSk7Cn0KCmZ1bmN0',
  'aW9uIGRvRm9yZ2V0QWxsRGV2aWNlcygpewogIGNvbmZpcm1BY3Rpb24oJ+C4ouC4geC5gOC4peC4tOC4gSBQSU4g4Lia4LiZ4LiX4Li44LiB4LmA4LiE4Lij4Li34LmI4Lit4LiH4LmD4LiK4LmI4LmE4Lir4LihIOKAlCDguJfguLjguIHguYDguITguKPguLfguYjg',
  'uK3guIfguIjguLDguJXguYnguK3guIfguKXguYfguK3guIHguK3guLTguJnguJTguYnguKfguKLguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYgnLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgnYXV0aC5mb3JnZXRBbGxEZXZpY2VzJywge30pLnRo',
  'ZW4oZnVuY3Rpb24obil7CiAgICAgIHNhdmVEZXZpY2UoJycpOwogICAgICB0b2FzdCgn4Lii4LiB4LmA4Lil4Li04LiBIFBJTiDguYHguKXguYnguKcgJyArIG4gKyAnIOC5gOC4hOC4o+C4t+C5iOC4reC4hycsICdvaycpOwogICAgICBsb2FkKCk7CiAgICB9KS5j',
  'YXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlIHx8IGUsICdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qIC0tLS0g4LiY4Li14LihIC0tLS0gKi8KCmZ1bmN0aW9uIHNldHRpbmdzVGhlbWVDYXJkKCl7CiAgdmFyIGN1ciA9IGN1cnJlbnRUaGVtZSgpOwogIHJl',
  'dHVybiBjYXJkKCfwn46oIOC4mOC4teC4oeC4quC4teC4q+C4meC5ieC4suC4iOC4rScsCiAgICAnPGRpdiBjbGFzcz0idGhlbWUtcGljayI+JyArIFRIRU1FUy5tYXAoZnVuY3Rpb24odCl7CiAgICAgIHJldHVybiAnPGJ1dHRvbiBjbGFzcz0idGhlbWUtb3B0JyAr',
  'ICh0LmlkID09PSBjdXIgPyAnIG9uJyA6ICcnKSArICciIG9uY2xpY2s9InNldFRoZW1lKFwnJyArIHQuaWQgKyAnXCcpIj4nICsKICAgICAgICAnPHNwYW4gY2xhc3M9ImljIj4nICsgdC5pYyArICc8L3NwYW4+JyArCiAgICAgICAgJzxiPicgKyBlc2ModC5pZCkg',
  'KyAnPC9iPicgKwogICAgICAgICc8c3BhbiBjbGFzcz0iaGludCI+JyArIGVzYyh0LmhpbnQpICsgJzwvc3Bhbj4nICsKICAgICAgJzwvYnV0dG9uPic7CiAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nICsKICAgICc8cCBjbGFzcz0iZnMxMiBtdXRlZCBtdDEyIj7g',
  'uJjguLXguKHguIjguLPguYHguKLguIHguKPguLLguKLguYDguITguKPguLfguYjguK3guIcg4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LiX4Li14LmI4LiZ4Li14LmI4Lir4Lij4Li34Lit4LiB4LiU4Lib4Li44LmI4Lih4Lij4Li54Lib4Lie4Lij4Liw4Lit4Liy4LiX',
  '4Li04LiV4Lii4LmML+C4nuC4o+C4sOC4iOC4seC4meC4l+C4o+C5jOC4oeC4uOC4oeC4guC4p+C4suC4muC4meC4geC5h+C5hOC4lOC5iScgKwogICAgKFMuYm9vdCAmJiBTLmJvb3QuaXNBZG1pbiA/ICcgwrcg4LiE4LmI4Liy4LiX4Li14LmI4Lic4Li54LmJ4LiU',
  '4Li54LmB4Lil4LmA4Lil4Li34Lit4LiB4LiI4Liw4LmA4Lib4LmH4LiZ4LiE4LmI4Liy4LiV4Lix4LmJ4LiH4LiV4LmJ4LiZ4LmD4Lir4LmJ4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiX4Li14LmI4Lii4Lix4LiH4LmE4Lih4LmI4LmA4LiE4Lii4LiV4Lix4LmJ4LiH',
  'JyA6ICcnKSArICc8L3A+Jyk7Cn0KCi8qIC0tLS0g4LiB4Lil4Li44LmI4Lih4LiE4LmI4Liy4LiV4Lix4LmJ4LiH4LiE4LmI4LiyIC0tLS0gKi8KCmZ1bmN0aW9uIHNldHRpbmdzUmVhZE9ubHlOb3RlKCl7CiAgcmV0dXJuIGNhcmQoJ+Kame+4jyDguIHguLLguKPg',
  'uJXguLHguYnguIfguITguYjguLLguKPguLDguJrguJonLAogICAgJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPvCflJI8L2Rpdj7guYDguInguJ7guLLguLDguJzguLnguYnguJTguLnguYHguKXguYDguJfguYjguLLguJnguLHguYnguJnguJfg',
  'uLXguYjguYHguIHguYnguIHguLLguKPguJXguLHguYnguIfguITguYjguLLguKPguLDguJrguJrguYTguJTguYk8L2Rpdj4nKTsKfQoKZnVuY3Rpb24gc2V0dGluZ3NHcm91cHNIdG1sKHMpewogIHJldHVybiBzLmdyb3Vwcy5tYXAoZnVuY3Rpb24oZyl7CiAgICBy',
  'ZXR1cm4gY2FyZChnLmljb24gKyAnICcgKyBnLmdyb3VwLAogICAgICAnPGRpdiBjbGFzcz0iZmdyaWQiPicgKyBnLml0ZW1zLm1hcChzZXR0aW5nRmllbGRIdG1sKS5qb2luKCcnKSArICc8L2Rpdj4nKTsKICB9KS5qb2luKCcnKSArCiAgY2FyZCgn8J+SviDguJrg',
  'uLHguJnguJfguLbguIHguIHguLLguKPguJXguLHguYnguIfguITguYjguLInLAogICAgJzxwIGNsYXNzPSJmczEzIG11dGVkIj4nICsgZXNjKHMuc2VjcmV0Tm90ZSkgKyAnPC9wPicgKwogICAgJzxkaXYgY2xhc3M9InJvdyBtdDEyIj4nICsKICAgICAgJzxidXR0',
  'b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9InNhdmVTZXR0aW5nc0Zvcm0oKSI+4Lia4Lix4LiZ4LiX4Li24LiB4LiX4Lix4LmJ4LiH4Lir4Lih4LiUPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImxvYWQoKSI+4Lii4LiB',
  '4LmA4Lil4Li04LiB4LiB4Liy4Lij4LmB4LiB4LmJ4LmE4LiCPC9idXR0b24+JyArCiAgICAnPC9kaXY+Jyk7Cn0KCmZ1bmN0aW9uIHNldHRpbmdGaWVsZEh0bWwoaXQpewogIHZhciBpZCA9ICdzXycgKyBpdC5rZXk7CiAgdmFyIGlubmVyOwogIGlmIChpdC5yZWFk',
  'T25seSkgewogICAgaW5uZXIgPSAnPGRpdiBjbGFzcz0iaW5wIiBzdHlsZT0iYmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpO2N1cnNvcjpkZWZhdWx0Ij4nICsgZXNjKGl0LnZhbHVlKSArICc8L2Rpdj4nOwogIH0gZWxzZSBpZiAoaXQudHlwZSA9PT0gJ3NlbGVj',
  'dCcpIHsKICAgIGlubmVyID0gJzxzZWxlY3QgY2xhc3M9InNlbCIgaWQ9IicgKyBpZCArICciPicgKyAoaXQub3B0aW9ucyB8fCBbXSkubWFwKGZ1bmN0aW9uKG8pewogICAgICByZXR1cm4gJzxvcHRpb24gdmFsdWU9IicgKyBlc2MobykgKyAnIicgKyAobyA9PT0g',
  'aXQudmFsdWUgPyAnIHNlbGVjdGVkJyA6ICcnKSArICc+JyArIGVzYyhvKSArICc8L29wdGlvbj4nOwogICAgfSkuam9pbignJykgKyAnPC9zZWxlY3Q+JzsKICB9IGVsc2UgaWYgKGl0LnR5cGUgPT09ICdtdWx0aWxpbmUnKSB7CiAgICBpbm5lciA9ICc8dGV4dGFy',
  'ZWEgY2xhc3M9InRhIiBpZD0iJyArIGlkICsgJyI+JyArIGVzYyhpdC52YWx1ZSkgKyAnPC90ZXh0YXJlYT4nOwogIH0gZWxzZSBpZiAoaXQudHlwZSA9PT0gJ251bWJlcicpIHsKICAgIGlubmVyID0gJzxpbnB1dCB0eXBlPSJudW1iZXIiIGNsYXNzPSJpbnAiIGlk',
  'PSInICsgaWQgKyAnIiB2YWx1ZT0iJyArIGVzYyhpdC52YWx1ZSkgKyAnIiBpbnB1dG1vZGU9ImRlY2ltYWwiPic7CiAgfSBlbHNlIHsKICAgIGlubmVyID0gJzxpbnB1dCB0eXBlPSJ0ZXh0IiBjbGFzcz0iaW5wIiBpZD0iJyArIGlkICsgJyIgdmFsdWU9IicgKyBl',
  'c2MoaXQudmFsdWUpICsgJyI+JzsKICB9CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJmJyArIChpdC50eXBlID09PSAnbXVsdGlsaW5lJyA/ICcgZnVsbCcgOiAnJykgKyAnIj4nICsKICAgICc8bGFiZWwgZm9yPSInICsgaWQgKyAnIj4nICsgZXNjKGl0LmxhYmVsKSAr',
  'ICc8L2xhYmVsPicgKyBpbm5lciArCiAgICAoaXQubm90ZSA/ICc8ZGl2IGNsYXNzPSJoaW50Ij4nICsgZXNjKGl0Lm5vdGUpICsgJzwvZGl2PicgOiAnJykgKyAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gc2F2ZVNldHRpbmdzRm9ybSgpewogIHZhciB2YWxzID0ge307',
  'CiAgdmFyIGRhdGEgPSBTLmNhY2hlLnNldHRpbmdzOwogIGlmICghZGF0YSkgcmV0dXJuOwogIGRhdGEuc2V0dGluZ3MuZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24oZyl7CiAgICBnLml0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXQpewogICAgICBpZiAoaXQucmVhZE9u',
  'bHkpIHJldHVybjsKICAgICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NfJyArIGl0LmtleSk7CiAgICAgIGlmIChlbCkgdmFsc1tpdC5rZXldID0gZWwudmFsdWU7CiAgICB9KTsKICB9KTsKICBjYWxsQXBpKCdzZXR0aW5ncy5zYXZlJywgeyB2',
  'YWx1ZXM6IHZhbHMgfSkudGhlbihmdW5jdGlvbihyKXsKICAgIGlmICh2YWxzLnRoZW1lKSB7IGxzU2V0KExTX1RIRU1FLCB2YWxzLnRoZW1lKTsgYXBwbHlUaGVtZSh2YWxzLnRoZW1lKTsgfQogICAgdG9hc3Qoci5zYXZlZCA/ICfguJrguLHguJnguJfguLbguIHg',
  'uYHguKXguYnguKcgJyArIHIuc2F2ZWQgKyAnIOC4o+C4suC4ouC4geC4suC4oycgOiAn4LmE4Lih4LmI4Lih4Li14Lit4Liw4LmE4Lij4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LmB4Lib4Lil4LiHJywgJ29rJyk7CiAgICAvLyDguITguYjguLLguJrguLLguIfguJXg',
  'uLHguKcgKOC4o+C4reC4muC4o+C4teC5gOC4n+C4o+C4iiDguIrguLfguYjguK3guK3guLLguITguLLguKMpIOC4oeC4teC4nOC4peC4geC4seC4muC4l+C4seC5ieC4h+C4q+C4meC5ieC4siDguIjguLbguIfguYLguKvguKXguJTguYPguKvguKHguYjguJfguLHg',
  'uYnguIfguIrguLjguJQKICAgIHJldHVybiBjYWxsQXBpKCdhcHAuYm9vdHN0cmFwJykudGhlbihmdW5jdGlvbihiKXsgUy5ib290ID0gYjsgbG9hZCgpOyB9KTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlIHx8IGUsICdlcnInKTsgfSk7',
  'Cn0KCi8qIC0tLS0g4LiI4Lix4LiU4LiB4Liy4Lij4Lic4Li54LmJ4LmD4LiK4LmJICjguJzguLnguYnguJTguLnguYHguKXguYDguJfguYjguLLguJnguLHguYnguJkpIC0tLS0gKi8KCmZ1bmN0aW9uIHNldHRpbmdzVXNlcnNDYXJkKHVzZXJzKXsKICByZXR1cm4g',
  'Y2FyZCgn8J+RpSDguJzguLnguYnguYPguIrguYnguYPguJnguKPguLDguJrguJogKCcgKyB1c2Vycy5sZW5ndGggKyAnKScsCiAgICAnPHAgY2xhc3M9ImZzMTMgbXV0ZWQiPuC5geC4iOC4geC4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5ieC5geC4peC4sOC4',
  'o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C5ieC4hOC4meC4reC4t+C5iOC4meC5gOC4guC5ieC4suC4oeC4suC4lOC4ueC4q+C4o+C4t+C4reC4iuC5iOC4p+C4ouC5geC4geC5ieC4guC5ieC4reC4oeC4ueC4peC5hOC4lOC5iSAnICsKICAgICfguJXguLHg',
  'uYnguIfguKrguLTguJfguJjguLTguYzguYHguKLguIHguKPguLLguKLguITguJkg4LmB4Lil4Liw4Lij4Liw4LiH4Lix4Lia4LmE4LiU4LmJ4LiX4Li44LiB4LmA4Lih4Li34LmI4LitPC9wPicgKwogICAgJzxkaXYgY2xhc3M9InR3IG10MTIiPjx0YWJsZSBjbGFz',
  'cz0idCI+PHRoZWFkPjx0cj4nICsKICAgICAgJzx0aD7guIrguLfguYjguK3guJzguLnguYnguYPguIrguYk8L3RoPjx0aD7guIrguLfguYjguK3guJfguLXguYjguYHguKrguJTguIc8L3RoPjx0aD7guKrguLTguJfguJjguLTguYw8L3RoPjx0aD7guKrguJbguLLg',
  'uJnguLA8L3RoPjx0aD7guYDguILguYnguLLguKXguYjguLLguKrguLjguJQ8L3RoPicgKwogICAgICAnPHRoIGNsYXNzPSJudW0iPuC4reC4uOC4m+C4geC4o+C4k+C5jDwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgIHVzZXJzLm1hcChm',
  'dW5jdGlvbih1KXsKICAgICAgdmFyIG1lTm93ID0gKEFVVEgubWUgJiYgQVVUSC5tZS51c2VybmFtZSkgPT09IHUudXNlcm5hbWU7CiAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICc8dGQ+PGI+JyArIGVzYyh1LnVzZXJuYW1lKSArICc8L2I+JyArIChtZU5v',
  'dyA/ICcgPHNwYW4gY2xhc3M9ImIgaW5mbyI+4LiE4Li44LiTPC9zcGFuPicgOiAnJykgKyAnPC90ZD4nICsKICAgICAgICAnPHRkPicgKyBlc2ModS5uYW1lIHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICc8dGQ+JyArIHJvbGVCYWRnZSh1LnJvbGUpICsg',
  'JzwvdGQ+JyArCiAgICAgICAgJzx0ZD4nICsgc3RhdHVzQmFkZ2UodS5zdGF0dXMpICsgKHUubG9ja2VkID8gJyA8c3BhbiBjbGFzcz0iYiBkZ3IiPuC4luC4ueC4geC4peC5h+C4reC4geC4iuC4seC5iOC4p+C4hOC4o+C4suC4pzwvc3Bhbj4nIDogJycpICsgJzwv',
  'dGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArICh1Lmxhc3RMb2dpbiA/IHRoRGF0ZVNob3J0KFN0cmluZyh1Lmxhc3RMb2dpbikuc2xpY2UoMCwxMCkpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHUu',
  'ZGV2aWNlcyB8fCAwKSArICc8L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9InQtYWN0aW9ucyI+JyArCiAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJmb3JtVXNlcignICsgYXR0cih1KSArICcpIj7guYHguIHguYnguYTguII8L2J1',
  'dHRvbj4nICsKICAgICAgICAgIChtZU5vdyA/ICcnIDogJzxidXR0b24gY2xhc3M9ImJ0biBzbSBkZ3IiIG9uY2xpY2s9ImRlbFVzZXIoXCcnICsgZXNjKHUudXNlcm5hbWUpICsgJ1wnKSI+4Lil4LiaPC9idXR0b24+JykgKwogICAgICAgICc8L3RkPjwvdHI+JzsK',
  'ICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgc20iIG9uY2xpY2s9ImZvcm1Vc2VyKCkiPisg4LmA4Lie4Li04LmI4Lih4Lic4Li54LmJ4LmD4LiK4LmJPC9idXR0b24+Jyk7Cn0KCmZ1',
  'bmN0aW9uIHJvbGVCYWRnZShyb2xlKXsKICB2YXIgY2xzID0gcm9sZSA9PT0gJ+C4nOC4ueC5ieC4lOC4ueC5geC4pScgPyAnb2snIDogKHJvbGUgPT09ICfguYHguIHguYnguYTguILguYTguJTguYknID8gJ2luZm8nIDogJ211dGUnKTsKICByZXR1cm4gJzxzcGFu',
  'IGNsYXNzPSJiICcgKyBjbHMgKyAnIj4nICsgZXNjKHJvbGUpICsgJzwvc3Bhbj4nOwp9CgovKiog4Lid4Lix4LiHIG9iamVjdCDguKXguIfguYPguJkgb25jbGljayDguK3guKLguYjguLLguIfguJvguKXguK3guJTguKDguLHguKIgKi8KZnVuY3Rpb24gYXR0cihv',
  'YmopewogIC8vIOC4leC5ieC4reC4h+C5geC4m+C4peC4hyAmIOC4geC5iOC4reC4meC4leC4seC4p+C4reC4t+C5iOC4mSDguYTguKHguYjguIfguLHguYnguJkgJnF1b3Q7IOC4l+C4teC5iOC5gOC4nuC4tOC5iOC4h+C4quC4o+C5ieC4suC4h+C4iOC4sOC5guC4',
  'lOC4meC5geC4m+C4peC4h+C4i+C5ieC4swogIHJldHVybiBKU09OLnN0cmluZ2lmeShKU09OLnN0cmluZ2lmeShvYmopKQogICAgLnJlcGxhY2UoLyYvZywgJyZhbXA7JykucmVwbGFjZSgvIi9nLCAnJnF1b3Q7JykKICAgIC5yZXBsYWNlKC88L2csICcmbHQ7Jyku',
  'cmVwbGFjZSgvPi9nLCAnJmd0OycpOwp9CgpmdW5jdGlvbiBmb3JtVXNlcihqc29uKXsKICB2YXIgdSA9IGpzb24gPyAodHlwZW9mIGpzb24gPT09ICdzdHJpbmcnID8gSlNPTi5wYXJzZShqc29uKSA6IGpzb24pIDoge307CiAgdmFyIGlzTmV3ID0gIXUudXNlcm5h',
  'bWU7CgogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiBpc05ldyA/ICfguYDguJ7guLTguYjguKHguJzguLnguYnguYPguIrguYnguYPguKvguKHguYgnIDogJ+C5geC4geC5ieC5hOC4guC4nOC4ueC5ieC5g+C4iuC5iSAnICsgdS51c2VybmFtZSwKICAgIGFjdGlvbjog',
  'J3VzZXIuc2F2ZScsCiAgICByZWNvcmQ6IE9iamVjdC5hc3NpZ24oeyBpZDogaXNOZXcgPyAnJyA6IHUudXNlcm5hbWUsIHJvbGU6ICfguJTguLnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcnLCBzdGF0dXM6ICfguYPguIrguYnguIfguLLguJknIH0sIHUp',
  'LAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oid1c2VybmFtZScsIGxhYmVsOifguIrguLfguYjguK3guJzguLnguYnguYPguIrguYkgKOC4oOC4suC4qeC4suC4reC4seC4h+C4geC4pOC4qSknLCByZXF1aXJlZDppc05ldywgcGg6J+C5gOC4iuC5iOC4mSBzb21j',
  'aGFpJywKICAgICAgICBoaW50OiBpc05ldyA/ICdhLXogMC05IC4gXyAtIOC4ouC4suC4pyAz4oCTMjQg4LiV4Lix4LinIMK3IOC5gOC4m+C4peC4teC5iOC4ouC4meC4oOC4suC4ouC4q+C4peC4seC4h+C5hOC4oeC5iOC5hOC4lOC5iScgOiAn4LmA4Lib4Lil4Li1',
  '4LmI4Lii4LiZ4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmE4Lih4LmI4LmE4LiU4LmJJyB9LAogICAgICB7IGtleTonbmFtZScsIGxhYmVsOifguIrguLfguYjguK3guJfguLXguYjguYHguKrguJTguIcnLCByZXF1aXJlZDp0cnVlLCBwaDon4LmA4LiK',
  '4LmI4LiZIOC4quC4oeC4iuC4suC4oicgfSwKICAgICAgeyBrZXk6J3JvbGUnLCBsYWJlbDon4Liq4Li04LiX4LiY4Li04LmM4LiB4Liy4Lij4LmD4LiK4LmJ4LiH4Liy4LiZJywgdHlwZTonc2VsZWN0JywgYmxhbms6ZmFsc2UsIHJlcXVpcmVkOnRydWUsCiAgICAg',
  'ICAgb3B0aW9uczpbJ+C4lOC4ueC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pycsJ+C5geC4geC5ieC5hOC4guC5hOC4lOC5iScsJ+C4nOC4ueC5ieC4lOC4ueC5geC4pSddLAogICAgICAgIGhpbnQ6J+C4lOC4ueC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4',
  'ouC4pyA9IOC5gOC4m+C4tOC4lOC4lOC4ueC5hOC4lOC5ieC4l+C4uOC4geC4q+C4meC5ieC4siDCtyDguYHguIHguYnguYTguILguYTguJTguYkgPSDguYDguJ7guLTguYjguKEv4LmB4LiB4LmJL+C4peC4muC4guC5ieC4reC4oeC4ueC4pSDCtyDguJzguLnguYng',
  'uJTguLnguYHguKUgPSDguIjguLHguJTguIHguLLguKPguJzguLnguYnguYPguIrguYnguYHguKXguLDguIHguLLguKPguJXguLHguYnguIfguITguYjguLLguYTguJTguYnguJTguYnguKfguKInIH0sCiAgICAgIHsga2V5OidwYXNzd29yZCcsIGxhYmVsOiBpc05l',
  'dyA/ICfguKPguKvguLHguKrguJzguYjguLLguJnguYDguKPguLTguYjguKHguJXguYnguJknIDogJ+C4leC4seC5ieC4h+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iCAo4LmA4Lin4LmJ4LiZ4Lin4LmI4Liy4LiHID0g4LmE4Lih4LmI4LmA4Lib',
  '4Lil4Li14LmI4Lii4LiZKScsCiAgICAgICAgcmVxdWlyZWQ6aXNOZXcsIHBoOifguK3guKLguYjguLLguIfguJnguYnguK3guKIgOCDguJXguLHguKfguK3guLHguIHguKnguKMnLAogICAgICAgIGhpbnQ6J+C4iOC4lOC5hOC4p+C5ieC4quC5iOC4h+C5g+C4q+C5',
  'ieC5gOC4iOC5ieC4suC4leC4seC4pyDigJQg4Lij4Liw4Lia4Lia4LmA4LiB4LmH4Lia4LmB4Lia4Lia4LmA4LiC4LmJ4Liy4Lij4Lir4Lix4LiqIOC5gOC4m+C4tOC4lOC4lOC4ueC4ouC5ieC4reC4meC4q+C4peC4seC4h+C5hOC4oeC5iOC5hOC4lOC5iScgfSwK',
  'ICAgICAgeyBrZXk6J211c3RDaGFuZ2UnLCBsYWJlbDon4LmD4Lir4LmJ4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LiV4Lit4LiZ4LmA4LiC4LmJ4Liy4LiE4Lij4Lix4LmJ4LiH4LmB4Lij4LiBJywgdHlwZTonc2VsZWN0Jywg',
  'Ymxhbms6ZmFsc2UsCiAgICAgICAgb3B0aW9uczpbe3ZhbHVlOid0cnVlJyxsYWJlbDon4LmD4LiK4LmIICjguYHguJnguLDguJnguLMpJ30se3ZhbHVlOidmYWxzZScsbGFiZWw6J+C5hOC4oeC5iOC4leC5ieC4reC4hyd9XSB9LAogICAgICB7IGtleTonc3RhdHVz',
  'JywgbGFiZWw6J+C4quC4luC4suC4meC4sCcsIHR5cGU6J3NlbGVjdCcsIGJsYW5rOmZhbHNlLCBvcHRpb25zOlsn4LmD4LiK4LmJ4LiH4Liy4LiZJywn4Lij4Liw4LiH4Lix4LiaJ10sCiAgICAgICAgaGludDon4Lij4Liw4LiH4Lix4LiaID0g4LmA4LiC4LmJ4Liy',
  '4Lij4Liw4Lia4Lia4LmE4Lih4LmI4LmE4LiU4LmJ4LiX4Lix4LiZ4LiX4Li1IOC5geC4leC5iOC4ouC4seC4h+C5gOC4geC5h+C4muC4muC4seC4jeC4iuC4teC5hOC4p+C5iScgfSwKICAgICAgeyBrZXk6J25vdGUnLCBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir',
  '4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXSwKICAgIHdpZGU6IHRydWUKICB9KTsKCiAgLy8g4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LmE4Lih4LmI4LmE4LiU4LmJIOC4peC5h+C4',
  'reC4geC4iuC5iOC4reC4h+C5hOC4p+C5ieC5gOC4peC4ouC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC5gOC4guC5ieC4suC5g+C4iOC4nOC4tOC4lAogIGlmICghaXNOZXcpIHsKICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX3VzZXJuYW1l',
  'Jyk7CiAgICBpZiAoZWwpIHsgZWwucmVhZE9ubHkgPSB0cnVlOyBlbC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3ZhcigtLXN1cmZhY2UtMiknOyB9CiAgfQp9CgpmdW5jdGlvbiBkZWxVc2VyKHVzZXJuYW1lKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguJzguLnguYng',
  'uYPguIrguYkgIicgKyB1c2VybmFtZSArICciIOC5g+C4iuC5iOC5hOC4q+C4oSDigJQg4LmA4LiC4LmJ4Liy4Lij4Liw4Lia4Lia4LmE4Lih4LmI4LmE4LiU4LmJ4Lit4Li14LiB4LiX4Lix4LiZ4LiX4Li1JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ3VzZXIu',
  'ZGVsZXRlJywgeyB1c2VybmFtZTogdXNlcm5hbWUgfSkudGhlbihmdW5jdGlvbigpewogICAgICB0b2FzdCgn4Lil4Lia4Lic4Li54LmJ4LmD4LiK4LmJ4LmB4Lil4LmJ4LinJywgJ29rJyk7CiAgICAgIGxvYWQoKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0',
  'b2FzdChlLm1lc3NhZ2UgfHwgZSwgJ2VycicpOyB9KTsKICB9KTsKfQoKLyogLS0tLSDguKXguLTguIfguIHguYzguYDguILguYnguLLguYPguIrguYnguIfguLLguJkgLS0tLSAqLwoKZnVuY3Rpb24gc2V0dGluZ3NTaGFyZUNhcmQobGlua3MpewogIGlmICghbGlu',
  'a3MgfHwgIWxpbmtzLmFwcFVybCkgewogICAgcmV0dXJuIGNhcmQoJ/CflJcg4Lil4Li04LiH4LiB4LmM4LmA4LiC4LmJ4Liy4LmD4LiK4LmJ4LiH4Liy4LiZJywKICAgICAgJzxkaXYgY2xhc3M9ImVtcHR5Ij7guKLguLHguIfguKvguLLguKXguLTguIfguIHguYzg',
  'uIjguKPguLTguIfguYTguKHguYjguYDguIjguK0g4oCUIOC5gOC4m+C4tOC4lOC5gOC4p+C5h+C4muC5geC4reC4m+C4iOC4suC4geC4peC4tOC4h+C4geC5jOC4l+C4teC5iOC4peC4h+C4l+C5ieC4suC4oiAvZXhlYyDguKrguLHguIHguITguKPguLHguYnguIcg',
  '4LmB4Lil4LmJ4Lin4Lij4Liw4Lia4Lia4LiI4Liw4LiI4Liz4LmD4Lir4LmJ4LmA4Lit4LiHPC9kaXY+Jyk7CiAgfQogIHJldHVybiBjYXJkKCfwn5SXIOC4peC4tOC4h+C4geC5jOC5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4mScsCiAgICAnPGRpdiBjbGFz',
  'cz0iZiBtYjEyIj48bGFiZWw+4Lil4Li04LiH4LiB4LmM4Lir4Lil4Lix4LiBIOKAlCDguKrguYjguIfguYPguKvguYnguJfguLjguIHguITguJnguYTguJTguYkgKOC5gOC4guC5ieC4suC4lOC5ieC4p+C4ouC4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5ieC5',
  'geC4peC4sOC4o+C4q+C4seC4quC4nOC5iOC4suC4mSk8L2xhYmVsPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJhcHBVcmwiIHJlYWRvbmx5IHZhbHVlPSInICsgZXNjKGxpbmtzLmFwcFVybCkgKyAnIiBvbmNsaWNrPSJ0aGlzLnNlbGVjdCgpIj48',
  'L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJjb3B5RmllbGQoXCdhcHBVcmxcJykiPvCfk4sg4LiE4Lix4LiU4Lil4Lit4LiB4Lil4Li04LiH4LiB4LmM4Lir4Lil4Lix',
  '4LiBPC9idXR0b24+JyArCiAgICAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImYgbWIxMiI+PGxhYmVsPvCfkYAg4Lil4Li04LiH4LiB4LmM4LiU4Li54Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4Lin',
  '4LmB4Lia4Lia4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4Lil4LmH4Lit4LiB4Lit4Li04LiZPC9sYWJlbD4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0ic2hhcmVVcmwiIHJlYWRvbmx5IHZhbHVlPSInICsgZXNjKGxpbmtzLnZpZXdVcmwpICsgJyIgb25j',
  'bGljaz0idGhpcy5zZWxlY3QoKSI+PC9kaXY+JyArCiAgICAnPHAgY2xhc3M9ImZzMTIgJyArIChsaW5rcy5zaGFyZUVuYWJsZWQgPyAnbXV0ZWQnIDogJ3dhcm4tdGV4dCcpICsgJyI+JyArCiAgICAgIChsaW5rcy5zaGFyZUVuYWJsZWQKICAgICAgICA/ICfguYDg',
  'uJvguLTguJTguK3guKLguLnguYgg4oCUIOC5g+C4hOC4o+C4geC5h+C4leC4suC4oeC4l+C4teC5iOC4oeC4teC4peC4tOC4h+C4geC5jOC4meC4teC5ieC5gOC4m+C4tOC4lOC4lOC4ueC4guC5ieC4reC4oeC4ueC4peC5hOC4lOC5ieC5guC4lOC4ouC5hOC4oeC5',
  'iOC4leC5ieC4reC4h+C4peC5h+C4reC4geC4reC4tOC4mScKICAgICAgICA6ICfimqDvuI8g4Lib4Li04LiU4Lit4Lii4Li54LmIIOKAlCDguKXguLTguIfguIHguYzguJnguLXguYnguKLguLHguIfguYPguIrguYnguYTguKHguYjguYTguJTguYkg4LmA4Lib4Li0',
  '4LiU4Liq4Lin4Li04LiV4LiK4LmM4LmE4LiU4LmJ4LiX4Li14LmI4Lir4Lix4Lin4LiC4LmJ4LitICLguITguKfguLLguKHguJvguKXguK3guJTguKDguLHguKLguYHguKXguLDguIHguLLguKPguYDguILguYnguLLguYPguIrguYnguIfguLLguJkiIOC4lOC5ieC4',
  'suC4meC4muC4mScpICsKICAgICc8L3A+JyArCiAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjb3B5RmllbGQoXCdzaGFyZVVybFwnKSI+8J+TiyDguITguLHguJTguKXguK3guIHguKXguLTg',
  'uIfguIHguYzguYHguIrguKPguYw8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBkZ3IiIG9uY2xpY2s9ImRvUm90YXRlU2hhcmUoKSI+8J+UgSDguK3guK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYzguYPguKvguKHguYg8L2J1dHRv',
  'bj4nICsKICAgICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+JyArCiAgICAnPHAgY2xhc3M9ImZzMTIgbXV0ZWQiPvCfhpgg4Lil4Li04LiH4LiB4LmM4LiB4Li54LmJ4Lij4Liw4Lia4LiaICjguYPguIrguYnguJXguK3guJnguKXguLfguKHg',
  'uKPguKvguLHguKrguJzguYjguLLguJnguIjguJnguYDguILguYnguLLguYTguKHguYjguYTguJTguYkg4oCUIOC4q+C5ieC4suC4oeC4quC5iOC4h+C4leC5iOC4rSk8YnI+JyArCiAgICAnPGNvZGUgY2xhc3M9ImZzMTIiPicgKyBlc2MobGlua3MuYWRtaW5Vcmwp',
  'ICsgJzwvY29kZT48L3A+Jyk7Cn0KCmZ1bmN0aW9uIGNvcHlGaWVsZChpZCl7CiAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpOwogIGlmICghZWwpIHJldHVybjsKICBlbC5zZWxlY3QoKTsKICB0cnkgeyBkb2N1bWVudC5leGVjQ29tbWFuZCgn',
  'Y29weScpOyB0b2FzdCgn4LiE4Lix4LiU4Lil4Lit4LiB4LmB4Lil4LmJ4LinJywgJ29rJyk7IH0KICBjYXRjaCAoZSkgeyB0b2FzdCgn4LiB4LiU4LiE4LmJ4Liy4LiH4LiX4Li14LmI4LiK4LmI4Lit4LiH4LmB4Lil4LmJ4Lin4LmA4Lil4Li34Lit4LiBIOC4hOC4',
  'seC4lOC4peC4reC4gScsICdlcnInKTsgfQp9Cjwvc2NyaXB0Pgo8c2NyaXB0PgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgRm9ybXMuaHRtbCDigJQg4Lif4Lit4Lij4LmM4Lih4LmA4Lie4Li0',
  '4LmI4LihL+C5geC4geC5ieC5hOC4giDguYHguKXguLDguIHguLLguKPguKXguJoKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgp2YXIgRk9STSA9IHsgc3BlY3M6IFtdLCBrZWVwOiB7fSwgYnVj',
  'a2V0OiAnbWlzYycsIG9jcjogbnVsbCB9OwoKLyogLS0tLS0tLS0tLS0tLS0tLSBmb3JtIGVuZ2luZSAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiBmaWVsZHNIdG1sKHNwZWNzLCByZWMpewogIHJlYyA9IHJlYyB8fCB7fTsKICBGT1JNLnNwZWNzID0gc3Bl',
  'Y3M7CiAgRk9STS5rZWVwID0ge307CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJmZ3JpZCI+JyArIHNwZWNzLm1hcChmdW5jdGlvbihmKXsKICAgIHZhciB2ID0gcmVjW2Yua2V5XTsKICAgIHZhciBpZCA9ICdmXycgKyBmLmtleTsKICAgIHZhciBpbm5lcjsKCiAgICBp',
  'ZiAoZi50eXBlID09PSAnc2VsZWN0JykgewogICAgICB2YXIgb3B0cyA9IChmLm9wdGlvbnMgfHwgW10pLm1hcChmdW5jdGlvbihvKXsKICAgICAgICB2YXIgdmFsID0gdHlwZW9mIG8gPT09ICdvYmplY3QnID8gby52YWx1ZSA6IG87CiAgICAgICAgdmFyIGxhYiA9',
  'IHR5cGVvZiBvID09PSAnb2JqZWN0JyA/IG8ubGFiZWwgOiBvOwogICAgICAgIHJldHVybiAnPG9wdGlvbiB2YWx1ZT0iJyArIGVzYyh2YWwpICsgJyInICsgKFN0cmluZyh2KSA9PT0gU3RyaW5nKHZhbCkgPyAnIHNlbGVjdGVkJyA6ICcnKSArICc+JyArIGVzYyhs',
  'YWIpICsgJzwvb3B0aW9uPic7CiAgICAgIH0pLmpvaW4oJycpOwogICAgICBpbm5lciA9ICc8c2VsZWN0IGNsYXNzPSJzZWwiIGlkPSInICsgaWQgKyAnIj4nICsgKGYuYmxhbmsgIT09IGZhbHNlID8gJzxvcHRpb24gdmFsdWU9IiI+4oCUIOC5gOC4peC4t+C4reC4',
  'gSDigJQ8L29wdGlvbj4nIDogJycpICsgb3B0cyArICc8L3NlbGVjdD4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAndGV4dGFyZWEnKSB7CiAgICAgIGlubmVyID0gJzx0ZXh0YXJlYSBjbGFzcz0idGEiIGlkPSInICsgaWQgKyAnIiBwbGFjZWhvbGRlcj0i',
  'JyArIGVzYyhmLnBofHwnJykgKyAnIj4nICsgZXNjKHZ8fCcnKSArICc8L3RleHRhcmVhPic7CgogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICdmaWxlcycpIHsKICAgICAgRk9STS5rZWVwW2Yua2V5XSA9IChyZWNbZi5rZXldICYmIHJlY1tmLmtleV0ubGVuZ3Ro',
  'KSA/IFtdLmNvbmNhdChyZWNbZi5rZXldKSA6IFtdOwogICAgICBpbm5lciA9CiAgICAgICAgJzxkaXYgaWQ9IicgKyBpZCArICdfZXhpc3RpbmciPicgKyBleGlzdGluZ0ZpbGVzSHRtbChmLmtleSkgKyAnPC9kaXY+JyArCiAgICAgICAgJzxsYWJlbCBjbGFzcz0i',
  'ZmlsZS1kcm9wIiBmb3I9IicgKyBpZCArICciPvCfk44g4LmB4LiV4Liw4LmA4Lie4Li34LmI4Lit4LmA4Lil4Li34Lit4LiB4LmE4Lif4Lil4LmMICjguYDguKXguLfguK3guIHguYTguJTguYnguKvguKXguLLguKLguYTguJ/guKXguYwgwrcg4LmE4Lih4LmI4LmA',
  '4LiB4Li04LiZIDEyIE1CIOC4leC5iOC4reC5hOC4n+C4peC5jCknICsKICAgICAgICAnPGlucHV0IHR5cGU9ImZpbGUiIGlkPSInICsgaWQgKyAnIiBtdWx0aXBsZSBhY2NlcHQ9ImltYWdlLyosYXBwbGljYXRpb24vcGRmIiBzdHlsZT0iZGlzcGxheTpub25lIiAn',
  'ICsKICAgICAgICAnb25jaGFuZ2U9InByZXZpZXdQaWNrZWQodGhpcyxcJycgKyBpZCArICdcJykiPjwvbGFiZWw+JyArCiAgICAgICAgJzxkaXYgaWQ9IicgKyBpZCArICdfcHJldmlldyIgY2xhc3M9InRodW1icyBtdDgiPjwvZGl2PicgKwogICAgICAgICc8ZGl2',
  'IGlkPSInICsgaWQgKyAnX29jciI+PC9kaXY+JzsKCiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ2NvbXB1dGVkJykgewogICAgICBpbm5lciA9ICc8ZGl2IGNsYXNzPSJpbnAiIGlkPSInICsgaWQgKyAnIiBzdHlsZT0iYmFja2dyb3VuZDp2YXIoLS1zdXJmYWNl',
  'LTIpO2ZvbnQtd2VpZ2h0OjYwMDsnICsKICAgICAgICAgICAgICAnZm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zO2N1cnNvcjpkZWZhdWx0Ij4wPC9kaXY+JzsKCiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ2RhdGUnKSB7CiAgICAgIGlubmVyID0g',
  'JzxpbnB1dCB0eXBlPSJkYXRlIiBjbGFzcz0iaW5wIiBpZD0iJyArIGlkICsgJyIgdmFsdWU9IicgKyBlc2ModiB8fCAnJykgKyAnIj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnbnVtYmVyJyB8fCBmLnR5cGUgPT09ICdtb25leScpIHsKICAgICAgaW5u',
  'ZXIgPSAnPGlucHV0IHR5cGU9Im51bWJlciIgc3RlcD0iJyArIChmLnR5cGUgPT09ICdtb25leScgPyAnMC4wMScgOiAnMScpICsgJyIgY2xhc3M9ImlucCIgaWQ9IicgKyBpZCArICciICcgKwogICAgICAgICAgICAgICd2YWx1ZT0iJyArICh2ID09IG51bGwgfHwg',
  'diA9PT0gJycgPyAnJyA6IGVzYyh2KSkgKyAnIiBwbGFjZWhvbGRlcj0iJyArIGVzYyhmLnBofHwnJykgKyAnIiBpbnB1dG1vZGU9ImRlY2ltYWwiJyArCiAgICAgICAgICAgICAgKGYuc3VtcyA/ICcgb25pbnB1dD0icmVjYWxjU3VtcygpIicgOiAnJykgKyAnPic7',
  'CgogICAgfSBlbHNlIHsKICAgICAgaW5uZXIgPSAnPGlucHV0IHR5cGU9InRleHQiIGNsYXNzPSJpbnAiIGlkPSInICsgaWQgKyAnIiB2YWx1ZT0iJyArIGVzYyh2IHx8ICcnKSArICciIHBsYWNlaG9sZGVyPSInICsgZXNjKGYucGh8fCcnKSArICciPic7CiAgICB9',
  'CgogICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJmJyArIChmLmZ1bGwgPyAnIGZ1bGwnIDogJycpICsgJyI+JyArCiAgICAgICc8bGFiZWwgZm9yPSInICsgaWQgKyAnIj4nICsgZXNjKGYubGFiZWwpICsgKGYucmVxdWlyZWQgPyAnIDxzcGFuIHN0eWxlPSJjb2xvcjp2',
  'YXIoLS1kYW5nZXIpIj4qPC9zcGFuPicgOiAnJykgKyAnPC9sYWJlbD4nICsKICAgICAgaW5uZXIgKyAoZi5oaW50ID8gJzxkaXYgY2xhc3M9ImhpbnQiPicgKyBlc2MoZi5oaW50KSArICc8L2Rpdj4nIDogJycpICsgJzwvZGl2Pic7CiAgfSkuam9pbignJykgKyAn',
  'PC9kaXY+JzsKfQoKLyoqIOC4reC4seC4m+C5gOC4lOC4leC4iuC5iOC4reC4h+C4nOC4peC4o+C4p+C4oeC4l+C4uOC4geC4iuC5iOC4reC4h+C5g+C4meC4n+C4reC4o+C5jOC4oeC4m+C4seC4iOC4iOC4uOC4muC4seC4mSAqLwpmdW5jdGlvbiByZWNhbGNTdW1z',
  'KCl7CiAgKEZPUk0uc3BlY3MgfHwgW10pLmZvckVhY2goZnVuY3Rpb24oZil7CiAgICBpZiAoZi50eXBlICE9PSAnY29tcHV0ZWQnIHx8ICFmLmZyb20pIHJldHVybjsKICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmXycgKyBmLmtleSk7CiAg',
  'ICBpZiAoIWVsKSByZXR1cm47CiAgICB2YXIgdG90YWwgPSAwOwogICAgZi5mcm9tLmZvckVhY2goZnVuY3Rpb24oayl7CiAgICAgIHZhciBpID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyArIGspOwogICAgICBpZiAoaSkgdG90YWwgKz0gTnVtYmVyKGku',
  'dmFsdWUpIHx8IDA7CiAgICB9KTsKICAgIGVsLnRleHRDb250ZW50ID0gdG90YWwudG9Mb2NhbGVTdHJpbmcoJ3RoLVRIJywgeyBtaW5pbXVtRnJhY3Rpb25EaWdpdHM6IDAsIG1heGltdW1GcmFjdGlvbkRpZ2l0czogMiB9KSArICcg4Li/JzsKICAgIGVsLnN0eWxl',
  'LmNvbG9yID0gdG90YWwgPiAwID8gJ3ZhcigtLW9rKScgOiAndmFyKC0tbXV0ZWQpJzsKICB9KTsKfQoKZnVuY3Rpb24gZXhpc3RpbmdGaWxlc0h0bWwoa2V5KXsKICB2YXIgbGlzdCA9IEZPUk0ua2VlcFtrZXldIHx8IFtdOwogIGlmICghbGlzdC5sZW5ndGgpIHJl',
  'dHVybiAnJzsKICByZXR1cm4gJzxkaXYgY2xhc3M9InRodW1icyBtYjgiPicgKyBsaXN0Lm1hcChmdW5jdGlvbih1cmwsIGkpewogICAgdmFyIGlkID0gU3RyaW5nKHVybCkubWF0Y2goL1stXHddezIwLH0vKTsKICAgIHZhciB0aHVtYiA9IGlkID8gJ2h0dHBzOi8v',
  'ZHJpdmUuZ29vZ2xlLmNvbS90aHVtYm5haWw/aWQ9JyArIGlkWzBdICsgJyZzej13MjAwJyA6ICcnOwogICAgcmV0dXJuICc8c3BhbiBzdHlsZT0icG9zaXRpb246cmVsYXRpdmU7ZGlzcGxheTppbmxpbmUtYmxvY2siPicgKwogICAgICAodGh1bWIgPyAnPGltZyBj',
  'bGFzcz0idGh1bWIiIHNyYz0iJyArIGVzYyh0aHVtYikgKyAnIiBvbmNsaWNrPSJ3aW5kb3cub3BlbihcJycgKyBlc2ModXJsKSArICdcJyxcJ19ibGFua1wnKSI+JwogICAgICAgICAgICAgOiAnPGEgY2xhc3M9ImIgaW5mbyIgaHJlZj0iJyArIGVzYyh1cmwpICsg',
  'JyIgdGFyZ2V0PSJfYmxhbmsiPuC5hOC4n+C4peC5jCAnICsgKGkrMSkgKyAnPC9hPicpICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBvbmNsaWNrPSJkcm9wRmlsZShcJycgKyBrZXkgKyAnXCcsJyArIGkgKyAnKSIgdGl0bGU9IuC5gOC4reC4suC4reC4',
  'reC4gSIgJyArCiAgICAgICdzdHlsZT0icG9zaXRpb246YWJzb2x1dGU7dG9wOi02cHg7cmlnaHQ6LTZweDtiYWNrZ3JvdW5kOnZhcigtLWRhbmdlcik7Y29sb3I6I2ZmZjtib3JkZXI6MDtib3JkZXItcmFkaXVzOjk5cHg7d2lkdGg6MThweDtoZWlnaHQ6MThweDts',
  'aW5lLWhlaWdodDoxO2N1cnNvcjpwb2ludGVyO2ZvbnQtc2l6ZToxMnB4Ij7DlzwvYnV0dG9uPicgKwogICAgICAnPC9zcGFuPic7CiAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gZHJvcEZpbGUoa2V5LCBpZHgpewogIEZPUk0ua2VlcFtrZXld',
  'LnNwbGljZShpZHgsIDEpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmXycgKyBrZXkgKyAnX2V4aXN0aW5nJykuaW5uZXJIVE1MID0gZXhpc3RpbmdGaWxlc0h0bWwoa2V5KTsKfQoKZnVuY3Rpb24gcHJldmlld1BpY2tlZChpbnB1dCwgaWQpewogIHZhciBi',
  'b3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCArICdfcHJldmlldycpOwogIHZhciBmaWxlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGlucHV0LmZpbGVzIHx8IFtdKTsKICBib3guaW5uZXJIVE1MID0gZmlsZXMubWFwKGZ1bmN0aW9uKGYpewog',
  'ICAgcmV0dXJuICc8c3BhbiBjbGFzcz0iYiBpbmZvIj4nICsgZXNjKGYubmFtZS5zbGljZSgwLDI2KSkgKyAnIMK3ICcgKyBNYXRoLnJvdW5kKGYuc2l6ZS8xMDI0KSArICcgS0I8L3NwYW4+JzsKICB9KS5qb2luKCcgJyk7CgogIHZhciBzbG90ID0gZG9jdW1lbnQu',
  'Z2V0RWxlbWVudEJ5SWQoaWQgKyAnX29jcicpOwogIGlmICghc2xvdCkgcmV0dXJuOwogIHNsb3QuaW5uZXJIVE1MID0gJyc7CiAgaWYgKCFvY3JVc2FibGUoKSB8fCAhZmlyc3RSZWFkYWJsZShmaWxlcykpIHJldHVybjsKCiAgdmFyIG1vZGUgPSAoUy5ib290LnNl',
  'dHRpbmdzICYmIFMuYm9vdC5zZXR0aW5ncy5vY3JBdXRvZmlsbCkgfHwgJ+C4luC4suC4oeC4geC5iOC4reC4meC5gOC4leC4tOC4oSc7CiAgaWYgKG1vZGUgPT09ICfguYTguKHguYjguYDguJXguLTguKEnKSByZXR1cm47CiAgaWYgKG1vZGUgPT09ICfguYDguJXg',
  'uLTguKHguYPguKvguYnguYDguKXguKInKSByZXR1cm4gcnVuT2NyKGlkLCB0cnVlKTsKCiAgc2xvdC5pbm5lckhUTUwgPQogICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIG10OCIgb25jbGljaz0icnVuT2NyKFwnJyArIGlkICsgJ1wnKSI+',
  'JyArCiAgICAn8J+UjiDguK3guYjguLLguJnguILguYnguK3guITguKfguLLguKHguIjguLLguIHguKPguLnguJvguJnguLXguYkg4LmB4Lil4LmJ4Lin4LiK4LmI4Lin4Lii4LiB4Lij4Lit4LiB4LmD4Lir4LmJPC9idXR0b24+JzsKfQoKLyoqIOC4reC5iOC4suC4',
  'meC4hOC5iOC4suC4iOC4suC4geC4n+C4reC4o+C5jOC4oSArIOC4reC4seC4m+C5guC4q+C4peC4lOC5hOC4n+C4peC5jOC5g+C4q+C4oeC5iCDguYHguKXguYnguKfguITguLfguJkgb2JqZWN0IOC4nuC4o+C5ieC4reC4oeC4muC4seC4meC4l+C4tuC4gSAqLwpm',
  'dW5jdGlvbiByZWFkRm9ybShzcGVjcywgYnVja2V0KXsKICB2YXIgb3V0ID0ge307CiAgdmFyIHVwbG9hZHMgPSBbXTsKCiAgc3BlY3MuZm9yRWFjaChmdW5jdGlvbihmKXsKICAgIGlmIChmLnR5cGUgPT09ICdjb21wdXRlZCcpIHJldHVybjsgICAgICAgICAgLy8g',
  '4LiK4LmI4Lit4LiH4LiE4Liz4LiZ4Lin4LiTIOC5hOC4oeC5iOC4leC5ieC4reC4h+C4muC4seC4meC4l+C4tuC4gQogICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyArIGYua2V5KTsKICAgIGlmICghZWwpIHJldHVybjsKICAgIGlmIChm',
  'LnR5cGUgPT09ICdmaWxlcycpIHsKICAgICAgdXBsb2Fkcy5wdXNoKAogICAgICAgIHVwbG9hZEZpbGVzKGVsLCBidWNrZXQpLnRoZW4oZnVuY3Rpb24ocmVmcyl7CiAgICAgICAgICBvdXRbZi5rZXldID0gKEZPUk0ua2VlcFtmLmtleV0gfHwgW10pLmNvbmNhdChy',
  'ZWZzLm1hcChmdW5jdGlvbihyKXsgcmV0dXJuIHIudXJsOyB9KSk7CiAgICAgICAgfSkKICAgICAgKTsKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnbnVtYmVyJyB8fCBmLnR5cGUgPT09ICdtb25leScpIHsKICAgICAgb3V0W2Yua2V5XSA9IGVsLnZhbHVlID09',
  'PSAnJyA/IG51bGwgOiBOdW1iZXIoZWwudmFsdWUpOwogICAgfSBlbHNlIHsKICAgICAgb3V0W2Yua2V5XSA9IGVsLnZhbHVlOwogICAgfQogIH0pOwoKICByZXR1cm4gUHJvbWlzZS5hbGwodXBsb2FkcykudGhlbihmdW5jdGlvbigpeyByZXR1cm4gb3V0OyB9KTsK',
  'fQoKLyoqIOC5guC4hOC4o+C4h+C4n+C4reC4o+C5jOC4oeC4oeC4suC4leC4o+C4kOC4suC4mTog4LmA4Lib4Li04LiUIG1vZGFsLCDguIjguLHguJTguIHguLLguKPguJvguLjguYjguKHguJrguLHguJnguJfguLbguIEsIOC4o+C4teC5guC4q+C4peC4lOC4q+C4',
  'meC5ieC4siAqLwpmdW5jdGlvbiBvcGVuRm9ybShvcHRzKXsKICB2YXIgcmVjID0gb3B0cy5yZWNvcmQgfHwge307CiAgRk9STS5vY3IgPSBvcHRzLm9jciB8fCBudWxsOwogIG9wZW5Nb2RhbChvcHRzLnRpdGxlLAogICAgZmllbGRzSHRtbChvcHRzLmZpZWxkcywg',
  'cmVjKSwKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lii4LiB4LmA4Lil4Li04LiBPC9idXR0b24+JyArCiAgICAocmVjLmlkICYmIG9wdHMub25EZWxldGUgPyAnPGJ1dHRvbiBjbGFzcz0iYnRuIGRnciIgaWQ9ImZEZWwi',
  'PuC4peC4muC4o+C4suC4ouC4geC4suC4o+C4meC4teC5iTwvYnV0dG9uPicgOiAnJykgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIGlkPSJmU2F2ZSI+JyArIChyZWMuaWQgPyAn4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4LmB4LiB4LmJ4LmE4LiC',
  'JyA6ICfguJrguLHguJnguJfguLbguIEnKSArICc8L2J1dHRvbj4nLAogICAgb3B0cy53aWRlKTsKCiAgaWYgKHJlYy5pZCAmJiBvcHRzLm9uRGVsZXRlKSB7CiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZkRlbCcpLm9uY2xpY2sgPSBmdW5jdGlvbigpeyBj',
  'bG9zZU1vZGFsKCk7IG9wdHMub25EZWxldGUocmVjLmlkKTsgfTsKICB9CgogIHJlY2FsY1N1bXMoKTsKCiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZTYXZlJykub25jbGljayA9IGZ1bmN0aW9uKCl7CiAgICB2YXIgYnRuID0gdGhpczsKICAgIGJ0bi5kaXNh',
  'YmxlZCA9IHRydWU7CiAgICBidG4uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C4muC4seC4meC4l+C4tuC4geKApic7CgogICAgcmVhZEZvcm0ob3B0cy5maWVsZHMsIG9wdHMuYnVja2V0IHx8ICdtaXNjJyku',
  'dGhlbihmdW5jdGlvbihkYXRhKXsKICAgICAgdmFyIG1pc3NpbmcgPSBvcHRzLmZpZWxkcy5maWx0ZXIoZnVuY3Rpb24oZil7CiAgICAgICAgcmV0dXJuIGYucmVxdWlyZWQgJiYgKGRhdGFbZi5rZXldID09IG51bGwgfHwgZGF0YVtmLmtleV0gPT09ICcnKTsKICAg',
  'ICAgfSk7CiAgICAgIGlmIChtaXNzaW5nLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKCfguIHguKPguLjguJPguLLguIHguKPguK3guIE6ICcgKyBtaXNzaW5nLm1hcChmdW5jdGlvbihmKXsgcmV0dXJuIGYubGFiZWw7IH0pLmpvaW4oJywgJykpOwoKICAgICAgdmFy',
  'IHJlY29yZCA9IE9iamVjdC5hc3NpZ24oe30sIG9wdHMuYmFzZSB8fCB7fSwgZGF0YSk7CiAgICAgIGlmIChyZWMuaWQpIHJlY29yZC5pZCA9IHJlYy5pZDsKICAgICAgcmV0dXJuIGNhbGxBcGkob3B0cy5hY3Rpb24sIE9iamVjdC5hc3NpZ24oeyByZWNvcmQ6IHJl',
  'Y29yZCB9LCBvcHRzLmV4dHJhIHx8IHt9KSk7CiAgICB9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICAgIGNsb3NlTW9kYWwoKTsKICAgICAgdG9hc3QoJ+C4muC4seC4meC4l+C4tuC4geC5gOC4o+C4teC4ouC4muC4o+C5ieC4reC4oicsICdvaycpOwogICAgICBsb2Fk',
  'KCk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgYnRuLmRpc2FibGVkID0gZmFsc2U7CiAgICAgIGJ0bi50ZXh0Q29udGVudCA9IHJlYy5pZCA/ICfguJrguLHguJnguJfguLbguIHguIHguLLguKPguYHguIHguYnguYTguIInIDogJ+C4muC4seC4meC4',
  'l+C4tuC4gSc7CiAgICAgIHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7CiAgICB9KTsKICB9Owp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lit4LmI4Liy4LiZ4LiC4LmJ4Lit',
  '4LiE4Lin4Liy4Lih4LiI4Liy4LiB4Lij4Li54LibIChPQ1IpIOC5geC4peC5ieC4p+C4iuC5iOC4p+C4ouC4geC4o+C4reC4geC4n+C4reC4o+C5jOC4oQoKICAg4LiX4Li44LiB4LiE4LmI4Liy4LiX4Li14LmI4LmE4LiU4LmJ4LmA4Lib4LmH4LiZ4LmB4LiE4LmI',
  '4LiC4LmJ4Lit4LmA4Liq4LiZ4LitIOC4nOC4ueC5ieC5g+C4iuC5ieC4geC4lOC5gOC4leC4tOC4oeC5gOC4reC4h+C4l+C4teC4peC4sOC4iuC5iOC4reC4h+C4q+C4o+C4t+C4reC5gOC4leC4tOC4oeC4l+C4seC5ieC4h+C4q+C4oeC4lOC4geC5h+C5hOC4lOC5',
  'iQogICDguYHguKXguLDguYHguIHguYnguYTguILguJXguYjguK3guYTguJTguYnguYDguKrguKHguK0g4LmA4Lie4Lij4Liy4Liw4LiV4Lix4Lin4Lit4LmI4Liy4LiZ4Lie4Lil4Liy4LiU4LmE4LiU4LmJIOC5guC4lOC4ouC5gOC4ieC4nuC4suC4sOC4peC4suC4',
  'ouC4oeC4t+C4reC4geC4seC4muC4o+C4ueC4m+C5gOC4reC4teC4ouC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCnZhciBPQ1JfTUFYID0gOCAqIDEwMjQgKiAxMDI0OyAgIC8vIOC4',
  'o+C4ueC4m+C5g+C4q+C4jeC5iOC4geC4p+C5iOC4suC4meC4teC5ieC4quC5iOC4h+C5hOC4m+C4reC5iOC4suC4meC5geC4peC5ieC4p+C4oeC4seC4geC4q+C4oeC4lOC5gOC4p+C4peC4sgoKZnVuY3Rpb24gb2NyVXNhYmxlKCl7CiAgcmV0dXJuICEhKEZPUk0u',
  'b2NyICYmIFMuYm9vdCAmJiBTLmJvb3Quc2V0dGluZ3MgJiYgUy5ib290LnNldHRpbmdzLm9jckVuYWJsZWQpOwp9CgovKiog4Lij4Li54Lib4LmB4Lij4LiB4LiX4Li14LmI4Lie4Lit4Lit4LmI4Liy4LiZ4LmE4LiU4LmJICjguILguYnguLLguKHguYTguJ/guKXg',
  'uYzguYPguKvguI3guYjguYDguIHguLTguJnguYHguKXguLDguYTguJ/guKXguYzguJfguLXguYjguYTguKHguYjguYPguIrguYjguKPguLnguJsvUERGKSAqLwpmdW5jdGlvbiBmaXJzdFJlYWRhYmxlKGZpbGVzKXsKICBmb3IgKHZhciBpID0gMDsgaSA8IGZpbGVz',
  'Lmxlbmd0aDsgaSsrKSB7CiAgICB2YXIgZiA9IGZpbGVzW2ldOwogICAgaWYgKGYuc2l6ZSA8PSBPQ1JfTUFYICYmIC9eaW1hZ2VcL3xwZGYkLy50ZXN0KGYudHlwZSB8fCAnJykpIHJldHVybiBmOwogIH0KICByZXR1cm4gbnVsbDsKfQoKLyoqCiAqIEBwYXJhbSB7',
  'c3RyaW5nfSBpZCAgaWQg4LiC4Lit4LiH4LiK4LmI4Lit4LiH4LmB4LiZ4Lia4LmE4Lif4Lil4LmMIOC5gOC4iuC5iOC4mSBmX3NsaXBzCiAqIEBwYXJhbSB7Ym9vbGVhbn0gYXV0byB0cnVlID0g4LmA4LiV4Li04Lih4LiK4LmI4Lit4LiH4LiX4Li14LmI4Lii4Lix',
  '4LiH4Lin4LmI4Liy4LiH4LmD4Lir4LmJ4LmA4Lil4Lii4LmC4LiU4Lii4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LiB4LiUCiAqLwpmdW5jdGlvbiBydW5PY3IoaWQsIGF1dG8pewogIHZhciBpbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTsKICB2YXIg',
  'c2xvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkICsgJ19vY3InKTsKICBpZiAoIWlucHV0IHx8ICFzbG90KSByZXR1cm47CgogIHZhciBmaWxlID0gZmlyc3RSZWFkYWJsZShBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChpbnB1dC5maWxlcyB8fCBbXSkp',
  'OwogIGlmICghZmlsZSkgeyBzbG90LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJoaW50IG10OCI+4LmE4Lih4LmI4Lih4Li14Lij4Li54Lib4LiX4Li14LmI4Lit4LmI4Liy4LiZ4LmE4LiU4LmJICjguKPguK3guIfguKPguLHguJrguKPguLnguJvguKDguLLguJ7g',
  'uYHguKXguLAgUERGIOC5hOC4oeC5iOC5gOC4geC4tOC4mSA4IE1CKTwvZGl2Pic7IHJldHVybjsgfQoKICBzbG90LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJvY3ItYm94Ij48ZGl2IGNsYXNzPSJoZCI+PHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz',
  '4Lil4Lix4LiH4Lit4LmI4Liy4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiI4Liy4LiBICcgKwogICAgICAgICAgICAgICAgICAgZXNjKGZpbGUubmFtZS5zbGljZSgwLCAyOCkpICsgJ+KApjwvZGl2PjwvZGl2Pic7CgogIHJlYWRBc0RhdGFVcmwoZmlsZSkudGhl',
  'bihmdW5jdGlvbihwKXsKICAgIHJldHVybiBjYWxsQXBpKCdvY3IucmVhZCcsIHsgZGF0YVVybDogcC5kYXRhVXJsLCBtaW1lVHlwZTogcC5taW1lVHlwZSB9KTsKICB9KS50aGVuKGZ1bmN0aW9uKHIpewogICAgc2xvdC5pbm5lckhUTUwgPSBvY3JCb3hIdG1sKGlk',
  'LCByKTsKICAgIE9DUl9MQVNUW2lkXSA9IHI7CiAgICBpZiAoYXV0bykgewogICAgICB2YXIgbiA9IG9jckFwcGx5QWxsKGlkLCB0cnVlKTsKICAgICAgdG9hc3QobiA/ICfguK3guYjguLLguJnguKPguLnguJvguYHguKXguYnguKcg4LmA4LiV4Li04Lih4LmD4Lir',
  '4LmJICcgKyBuICsgJyDguIrguYjguK3guIcg4oCUIOC4leC4o+C4p+C4iOC4lOC4ueC4geC5iOC4reC4meC4muC4seC4meC4l+C4tuC4geC4meC4sCcgOiAn4Lit4LmI4Liy4LiZ4Lij4Li54Lib4LmB4Lil4LmJ4LinIOC5geC4leC5iOC4ouC4seC4h+C4iOC4seC4',
  'muC4hOC5iOC4suC4l+C4teC5iOC5g+C4iuC5ieC5hOC4lOC5ieC5hOC4oeC5iOC5hOC4lOC5iScsIG4gPyAnb2snIDogJycpOwogICAgfQogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgc2xvdC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz0ib2NyLWJveCI+PGRp',
  'diBjbGFzcz0iaGQiPuKaoO+4jyDguK3guYjguLLguJnguKPguLnguJvguYTguKHguYjguKrguLPguYDguKPguYfguIg8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImhpbnQiPicgKyBlc2MoZS5tZXNzYWdlIHx8IGUpICsgJzwvZGl2PicgKwogICAgICAnPGJ1',
  'dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20gbXQ4IiBvbmNsaWNrPSJydW5PY3IoXCcnICsgaWQgKyAnXCcpIj7guKXguK3guIfguK3guLXguIHguITguKPguLHguYnguIc8L2J1dHRvbj48L2Rpdj4nOwogIH0pOwp9Cgp2YXIgT0NSX0xBU1QgPSB7fTsK',
  'Ci8qKiDguITguYjguLLguJfguLXguYjguK3guYjguLLguJnguYTguJTguYkg4LiE4Li54LmI4LiB4Lix4Lia4LiK4LmI4Lit4LiH4LmD4LiZ4Lif4Lit4Lij4LmM4Lih4LiX4Li14LmI4LiI4Liw4LmA4Lit4Liy4LmE4Lib4LmD4Liq4LmIICovCmZ1bmN0aW9uIG9j',
  'clBhaXJzKHIpewogIHZhciBtID0gRk9STS5vY3IgfHwge307CiAgdmFyIGcgPSByLmd1ZXNzIHx8IHt9OwogIHZhciBvdXQgPSBbXTsKICBpZiAobS5kYXRlICAgJiYgZy5kYXRlKSAgIG91dC5wdXNoKHsgZmllbGQ6IG0uZGF0ZSwgICBsYWJlbDogJ+C4p+C4seC4',
  'meC4l+C4teC5iCcsICAgICB2YWx1ZTogZy5kYXRlLCAgIHNob3c6IHRoRGF0ZShnLmRhdGUpIH0pOwogIGlmIChtLmFtb3VudCAmJiBnLmFtb3VudCkgb3V0LnB1c2goeyBmaWVsZDogbS5hbW91bnQsIGxhYmVsOiAn4LiI4Liz4LiZ4Lin4LiZ4LmA4LiH4Li04LiZ',
  'JywgIHZhbHVlOiBnLmFtb3VudCwgc2hvdzogYmFodChnLmFtb3VudCkgfSk7CiAgaWYgKG0udmVuZG9yICYmIGcudmVuZG9yKSBvdXQucHVzaCh7IGZpZWxkOiBtLnZlbmRvciwgbGFiZWw6ICfguKPguYnguLLguJkv4Lic4Li54LmJ4LiC4Liy4LiiJywgdmFsdWU6',
  'IGcudmVuZG9yLCBzaG93OiBnLnZlbmRvciB9KTsKICBpZiAobS50aXRsZSAgJiYgZy50aXRsZSkgIG91dC5wdXNoKHsgZmllbGQ6IG0udGl0bGUsICBsYWJlbDogJ+C4iuC4t+C5iOC4reC4o+C4suC4ouC4geC4suC4oycsICB2YWx1ZTogZy50aXRsZSwgIHNob3c6',
  'IGcudGl0bGUgfSk7CiAgaWYgKG0ubm90ZSAgICYmIGcucmVmKSAgICBvdXQucHVzaCh7IGZpZWxkOiBtLm5vdGUsICAgbGFiZWw6ICfguYDguKXguILguK3guYnguLLguIfguK3guLTguIcnLCAgdmFsdWU6ICfguK3guYnguLLguIfguK3guLTguIcgJyArIGcucmVm',
  'LCBzaG93OiBnLnJlZiB9KTsKICAvLyDguYPguJrguYDguKrguKPguYfguIjguKvguKXguLLguKLguKPguLLguKLguIHguLLguKMg4oCUIOC4o+C4p+C4oeC5gOC4m+C5h+C4meC4guC5ieC4reC4hOC4p+C4suC4oeC4q+C4peC4suC4ouC4muC4o+C4o+C4l+C4seC4',
  'lOC5g+C4q+C5ieC5gOC4peC4t+C4reC4geC5g+C4quC5iOC4l+C4teC5gOC4lOC4teC4ouC4pwogIGlmIChtLnRpdGxlICYmIGcuaXRlbXMgJiYgZy5pdGVtcy5sZW5ndGggPiAxKSB7CiAgICB2YXIgbGluZXMgPSBnLml0ZW1zLm1hcChmdW5jdGlvbihpdCwgaSl7',
  'IHJldHVybiAoaSsxKSArICcuJyArIGl0Lm5hbWUgKyAnICcgKyBtb25leShpdC5wcmljZSwgMikgKyAnIOC4vyc7IH0pLmpvaW4oJ1xuJyk7CiAgICBvdXQucHVzaCh7IGZpZWxkOiBtLnRpdGxlLCBsYWJlbDogJ+C4l+C4uOC4geC4o+C4suC4ouC4geC4suC4oyAo',
  'JyArIGcuaXRlbXMubGVuZ3RoICsgJyknLCB2YWx1ZTogbGluZXMsIHNob3c6IGcuaXRlbXMubGVuZ3RoICsgJyDguKPguLLguKLguIHguLLguKPguYPguJnguYPguJrguYDguKrguKPguYfguIgnLCBtdWx0aTogdHJ1ZSB9KTsKICB9CiAgcmV0dXJuIG91dDsKfQoK',
  'ZnVuY3Rpb24gb2NyQm94SHRtbChpZCwgcil7CiAgdmFyIHBhaXJzID0gb2NyUGFpcnMocik7CiAgaWYgKCFwYWlycy5sZW5ndGgpIHsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0ib2NyLWJveCI+PGRpdiBjbGFzcz0iaGQiPvCflI4g4Lit4LmI4Liy4LiZ4LiC4LmJ',
  '4Lit4LiE4Lin4Liy4Lih4LmE4LiU4LmJIOC5geC4leC5iOC4ouC4seC4h+C4iOC4seC4muC4hOC5iOC4suC4l+C4teC5iOC5g+C4iuC5ieC5hOC4lOC5ieC5hOC4oeC5iOC5hOC4lOC5iScgKwogICAgICAnPHNwYW4gY2xhc3M9InNwIj48YnV0dG9uIHR5cGU9ImJ1',
  'dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0ib2NyVG9nZ2xlUmF3KFwnJyArIGlkICsgJ1wnKSI+4LiU4Li54LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiX4Li14LmI4Lit4LmI4Liy4LiZ4LmE4LiU4LmJPC9idXR0b24+PC9zcGFuPjwvZGl2PicgKwogICAgICAn',
  'PGRpdiBjbGFzcz0ib2NyLXJhdyIgaWQ9IicgKyBpZCArICdfcmF3IiBoaWRkZW4+JyArIGVzYyhyLnRleHQgfHwgJyjguKfguYjguLLguIcpJykgKyAnPC9kaXY+PC9kaXY+JzsKICB9CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJvY3ItYm94Ij4nICsKICAgICc8ZGl2',
  'IGNsYXNzPSJoZCI+8J+UjiDguK3guYjguLLguJnguIjguLLguIHguKPguLnguJvguYTguJTguYnguYHguJrguJrguJnguLXguYkg4oCUIOC4geC4lOC5gOC4leC4tOC4oeC4iuC5iOC4reC4h+C4l+C4teC5iOC4leC5ieC4reC4h+C4geC4suC4oycgKwogICAgICAn',
  'PHNwYW4gY2xhc3M9InNwIj4nICsKICAgICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20gcHJpIiBvbmNsaWNrPSJvY3JBcHBseUFsbChcJycgKyBpZCArICdcJykiPuC5gOC4leC4tOC4oeC4l+C4seC5ieC4h+C4q+C4oeC4lDwvYnV0dG9u',
  'PicgKwogICAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0ib2NyVG9nZ2xlUmF3KFwnJyArIGlkICsgJ1wnKSI+4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LmA4LiV4LmH4LihPC9idXR0b24+JyArCiAgICAgICc8L3NwYW4+',
  'PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0ib2NyLWhpdHMiPicgKyBwYWlycy5tYXAoZnVuY3Rpb24ocCwgaSl7CiAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0ib2NyLWhpdCI+JyArCiAgICAgICAgJzxzcGFuIGNsYXNzPSJrIj4nICsgZXNjKHAubGFiZWwpICsg',
  'Jzwvc3Bhbj4nICsKICAgICAgICAnPHNwYW4gY2xhc3M9InYiIHRpdGxlPSInICsgZXNjKFN0cmluZyhwLnZhbHVlKSkgKyAnIj4nICsgZXNjKHAuc2hvdykgKyAnPC9zcGFuPicgKwogICAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSIg',
  'b25jbGljaz0ib2NyQXBwbHlPbmUoXCcnICsgaWQgKyAnXCcsJyArIGkgKyAnKSI+4LmA4LiV4Li04LihPC9idXR0b24+JyArCiAgICAgICc8L2Rpdj4nOwogICAgfSkuam9pbignJykgKyAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0ib2NyLXJhdyIgaWQ9Iicg',
  'KyBpZCArICdfcmF3IiBoaWRkZW4+JyArIGVzYyhyLnRleHQgfHwgJyjguKfguYjguLLguIcpJykgKyAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iaGludCBtdDgiPuC4leC4o+C4p+C4iOC4hOC4p+C4suC4oeC4luC4ueC4geC4leC5ieC4reC4h+C4geC5iOC4',
  'reC4meC4muC4seC4meC4l+C4tuC4geC5gOC4quC4oeC4rSDigJQg4LmB4LiB4LmJ4LmD4LiZ4LiK4LmI4Lit4LiH4LmE4LiU4LmJ4LiV4Liy4Lih4Lib4LiB4LiV4Li0PC9kaXY+JyArCiAgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIG9jclRvZ2dsZVJhdyhpZCl7CiAg',
  'dmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQgKyAnX3JhdycpOwogIGlmIChlbCkgZWwuaGlkZGVuID0gIWVsLmhpZGRlbjsKfQoKLyoqIOC5g+C4quC5iOC4hOC5iOC4suC4peC4h+C4iuC5iOC4reC4hyDguYHguKXguYnguKfguYTguK7guYTguKXg',
  'uJXguYzguYPguKvguYnguYDguKvguYfguJnguKfguYjguLLguIrguYjguK3guIfguYTguKvguJnguJbguLnguIHguYDguJXguLTguKEgKi8KZnVuY3Rpb24gb2NyRmlsbChmaWVsZEtleSwgdmFsdWUpewogIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlk',
  'KCdmXycgKyBmaWVsZEtleSk7CiAgaWYgKCFlbCkgcmV0dXJuIGZhbHNlOwogIGVsLnZhbHVlID0gdmFsdWU7CiAgZWwuY2xhc3NMaXN0LmFkZCgnb2NyLWZpbGxlZCcpOwogIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgZWwuY2xhc3NMaXN0LnJlbW92ZSgnb2NyLWZp',
  'bGxlZCcpOyB9LCAxNjAwKTsKICByZWNhbGNTdW1zKCk7CiAgcmV0dXJuIHRydWU7Cn0KCmZ1bmN0aW9uIG9jckFwcGx5T25lKGlkLCBpZHgpewogIHZhciByID0gT0NSX0xBU1RbaWRdOwogIGlmICghcikgcmV0dXJuOwogIHZhciBwID0gb2NyUGFpcnMocilbaWR4',
  'XTsKICBpZiAocCAmJiBvY3JGaWxsKHAuZmllbGQsIHAudmFsdWUpKSB0b2FzdCgn4LmA4LiV4Li04LihJyArIHAubGFiZWwgKyAn4LmB4Lil4LmJ4LinJywgJ29rJyk7Cn0KCi8qKgogKiBAcGFyYW0ge2Jvb2xlYW59IG9ubHlFbXB0eSB0cnVlID0g4LmA4LiV4Li0',
  '4Lih4LmA4LiJ4Lie4Liy4Liw4LiK4LmI4Lit4LiH4LiX4Li14LmI4Lii4Lix4LiH4Lin4LmI4Liy4LiHICjguYPguIrguYnguJXguK3guJnguYDguJXguLTguKHguK3guLHguJXguYLguJnguKHguLHguJXguLQKICogICAgICAgICAgICAgICAgICAgICAgICAgICAg',
  '4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4LiX4Lix4Lia4Liq4Li04LmI4LiH4LiX4Li14LmI4Lic4Li54LmJ4LmD4LiK4LmJ4Lie4Li04Lih4Lie4LmM4LmE4Lib4LmB4Lil4LmJ4LinKQogKiBAcmV0dXJuIHtudW1iZXJ9IOC4iOC4s+C4meC4p+C4meC4iuC5iOC4',
  'reC4h+C4l+C4teC5iOC5gOC4leC4tOC4oeC4iOC4o+C4tOC4hwogKi8KZnVuY3Rpb24gb2NyQXBwbHlBbGwoaWQsIG9ubHlFbXB0eSl7CiAgdmFyIHIgPSBPQ1JfTEFTVFtpZF07CiAgaWYgKCFyKSByZXR1cm4gMDsKICB2YXIgZG9uZSA9IHt9OwogIHZhciBuID0g',
  'MDsKICBvY3JQYWlycyhyKS5mb3JFYWNoKGZ1bmN0aW9uKHApewogICAgaWYgKGRvbmVbcC5maWVsZF0pIHJldHVybjsgICAgICAgICAgICAgICAgICAgICAgIC8vIOC4iuC5iOC4reC4h+C5gOC4lOC4teC4ouC4p+C4geC4seC4meC5gOC4leC4tOC4oeC4hOC4o+C4',
  'seC5ieC4h+C5gOC4lOC4teC4ouC4pyDguYDguK3guLLguJXguLHguKfguYHguKPguIEKICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmXycgKyBwLmZpZWxkKTsKICAgIGlmICghZWwpIHJldHVybjsKICAgIGlmIChvbmx5RW1wdHkgJiYgU3Ry',
  'aW5nKGVsLnZhbHVlIHx8ICcnKS50cmltKCkgIT09ICcnKSByZXR1cm47CiAgICBpZiAob2NyRmlsbChwLmZpZWxkLCBwLnZhbHVlKSkgeyBkb25lW3AuZmllbGRdID0gdHJ1ZTsgbisrOyB9CiAgfSk7CiAgaWYgKCFvbmx5RW1wdHkpIHRvYXN0KG4gPyAn4LmA4LiV',
  '4Li04Lih4LmD4Lir4LmJICcgKyBuICsgJyDguIrguYjguK3guIfguYHguKXguYnguKcg4oCUIOC4leC4o+C4p+C4iOC4lOC4ueC4geC5iOC4reC4meC4muC4seC4meC4l+C4tuC4gScgOiAn4LiK4LmI4Lit4LiH4LiX4Li14LmI4LiI4Liw4LmA4LiV4Li04Lih4LmE',
  '4Lih4LmI4Lit4Lii4Li54LmI4LmD4LiZ4Lif4Lit4Lij4LmM4Lih4LiZ4Li14LmJJywgbiA/ICdvaycgOiAnZXJyJyk7CiAgcmV0dXJuIG47Cn0KCmZ1bmN0aW9uIHJvb21PcHRpb25zKCl7IHJldHVybiBTLmJvb3QgPyBTLmJvb3Qucm9vbXMgOiBbXTsgfQpmdW5j',
  'dGlvbiBvcHQobmFtZSl7IHJldHVybiAoUy5ib290ICYmIFMuYm9vdC5zY2hlbWFbbmFtZV0pIHx8IFtdOyB9CmZ1bmN0aW9uIHRvZGF5KCl7IHJldHVybiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc2xpY2UoMCwxMCk7IH0KCi8qID09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3guKPguYzguKE6IOC4geC5ieC4reC4meC4q+C4meC4teC5iQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT0gKi8KZnVuY3Rpb24gZm9ybURlYnQocmVjLCBsZWRnZXIpewogIC8vIOC5gOC4peC4t+C4reC4geC5geC4oeC5iOC5hOC4lOC5ieC4iOC4suC4geC4l+C4uOC4geC4muC4seC4jeC4iuC4tSDguKLguIHguYDguKfguYnguJnguJXguLHguKfguYDguK3guIcKICB2',
  'YXIgYWxsID0gKEFMTF9ERUJUUyB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uKGQpeyByZXR1cm4gIXJlYyB8fCBkLmlkICE9PSByZWMuaWQ7IH0pOwogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4geC5ieC4reC4',
  'meC4q+C4meC4teC5iScgOiAn4LmA4Lie4Li04LmI4Lih4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJJywKICAgIHJlY29yZDogcmVjLCBhY3Rpb246ICdkZWJ0LnNhdmUnLCBiYXNlOiB7IGxlZGdlcjogbGVkZ2VyIH0sCiAgICBvbkRlbGV0ZTogZGVsRGVidCwKICAg',
  'IGZpZWxkczogWwogICAgICB7IGtleTondGl0bGUnLCAgICBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4Lij4Lir4LiZ4Li14LmJJywgcmVxdWlyZWQ6dHJ1ZSwgZnVsbDp0cnVlLCBwaDon4LmA4LiK4LmI4LiZIOC4hOC5iOC4suC4geC5iOC4reC4quC4o+C5ieC4suC4',
  'hyBUaGUgTSBDb3JuZXIgQVAnIH0sCiAgICAgIHsga2V5OidsZWRnZXInLCAgIGxhYmVsOifguJvguKPguLDguYDguKDguJfguJrguLHguI3guIrguLUnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOlsn4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiBJywn4Lir4LiZ4Li1',
  '4LmJ4Lij4Lit4LiHJ10sIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5OidjcmVkaXRvcicsIGxhYmVsOifguYDguIjguYnguLLguKvguJnguLXguYknLCBwaDon4LmA4LiK4LmI4LiZIOC4hOC4o+C4reC4muC4hOC4o+C4seC4pyAvIOC4mOC4meC4suC4hOC4suC4',
  'oyAvIOC4m+C5ieC4suC4leC4sicgfSwKICAgICAgeyBrZXk6J3BhcmVudElkJywgbGFiZWw6J+C5gOC4m+C5h+C4meC4quC5iOC4p+C4meC4q+C4meC4tuC5iOC4h+C4guC4reC4h+C4geC5ieC4reC4meC4q+C4meC4teC5iScsIHR5cGU6J3NlbGVjdCcsIGZ1bGw6',
  'dHJ1ZSwKICAgICAgICBvcHRpb25zOiBhbGwubWFwKGZ1bmN0aW9uKGQpeyByZXR1cm4geyB2YWx1ZTpkLmlkLCBsYWJlbDpkLnRpdGxlICsgJyAoJyArIGQubGVkZ2VyICsgJyknIH07IH0pLAogICAgICAgIGhpbnQ6J+C5g+C4iuC5ieC5gOC4oeC4t+C5iOC4reC5',
  'gOC4h+C4tOC4meC4geC5ieC4reC4meC4meC4teC5ieC5gOC4m+C5h+C4meC4l+C4uOC4meC4guC4reC4h+C4reC4teC4geC4geC5ieC4reC4mSDguYDguIrguYjguJkg4LmA4LiH4Li04LiZ4Lii4Li34Lih4Lib4LmJ4Liy4LiV4Liy4LmA4Lib4LmH4LiZ4Liq4LmI',
  '4Lin4LiZ4Lir4LiZ4Li24LmI4LiH4LiC4Lit4LiH4Lir4LiZ4Li14LmJ4LiL4Li34LmJ4Lit4LiX4Li14LmI4LiU4Li04LiZIOKAlCAnICsKICAgICAgICAgICAgICfguIjguYjguLLguKLguITguLfguJnguIHguYnguK3guJnguJnguLXguYnguYHguKXguYnguKfg',
  'uIHguYnguK3guJnguYHguKHguYjguIjguLDguKXguJTguJXguLLguKHguYTguJvguJTguYnguKfguKIg4LmB4Lil4Liw4Lii4Lit4LiU4Lij4Lin4Lih4LiI4Liw4LmE4Lih4LmI4LiW4Li54LiB4LiZ4Lix4Lia4LiL4LmJ4LizJyB9LAogICAgICB7IGtleTonc3Rh',
  'cnREYXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4geC5iOC4reC4q+C4meC4teC5iScsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidwcmluY2lwYWwnLCBsYWJlbDon4Lii4Lit4LiU4Lir4LiZ4Li14LmJ4LiV4Lix4LmJ4LiH4LiV4LmJ4LiZICjg',
  'uJrguLLguJcpJywgdHlwZTonbW9uZXknLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidpbnRlcmVzdFBlck1vbnRoJywgbGFiZWw6J+C4lOC4reC4geC5gOC4muC4teC5ieC4ouC4leC5iOC4reC5gOC4lOC4t+C4reC4mSAo4Lia4Liy4LiXKScsIHR5cGU6',
  'J21vbmV5JyB9LAogICAgICB7IGtleToncGxhblBlck1vbnRoJywgbGFiZWw6J+C4ouC4reC4lOC4nOC5iOC4reC4meC4leC5iOC4reC5gOC4lOC4t+C4reC4mSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JyB9LAogICAgICB7IGtleTonZHVlRGF5JywgICBsYWJl',
  'bDon4LiB4Liz4Lir4LiZ4LiU4LiK4Liz4Lij4LiwICjguKfguLHguJnguJfguLXguYjguILguK3guIfguYDguJTguLfguK3guJkpJywgdHlwZTonbnVtYmVyJywgcGg6JzIwJyB9LAogICAgICB7IGtleTonc3RhdHVzJywgICBsYWJlbDon4Liq4LiW4Liy4LiZ4Liw',
  'JywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ2RlYnRTdGF0dXNlcycpLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleTonbm90ZScsICAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQog',
  'ICAgXQogIH0pOwogIGlmICghcmVjKSB7IHZhciBlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfbGVkZ2VyJyk7IGlmIChlKSBlLnZhbHVlID0gbGVkZ2VyOyB9Cn0KCmZ1bmN0aW9uIGRlbERlYnQoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4geC5',
  'ieC4reC4meC4q+C4meC4teC5ieC4meC4teC5iT8g4Lij4Liy4Lii4LiB4Liy4Lij4LiK4Liz4Lij4Liw4LiX4Li14LmI4Lic4Li54LiB4LmE4Lin4LmJ4LiI4Liw4Lii4Lix4LiH4Lit4Lii4Li54LmIJywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2RlYnQuZGVs',
  'ZXRlJywgeyBpZDogaWQgfSkudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCgpOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgovKiA9',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguKPguLLguKLguIHguLLguKPguYLguK3guJnguYPguIrguYnguKvguJnguLXguYkKICAgPT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1EZWJ0UGF5bWVudChyZWMsIGxlZGdlcil7CiAgdmFyIGRlYnRzID0gKFMuY2FjaGVbUy5wYWdlXSAmJiBTLmNhY2hlW1MucGFnZV0uZGVidHMpIHx8IFtdOwog',
  'IG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4o+C4suC4ouC4geC4suC4o+C4iuC4s+C4o+C4sCcgOiAn4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4LmC4Lit4LiZ4LmD4LiK4LmJ4Lir4LiZ4Li14LmJJywK',
  'ICAgIHJlY29yZDogcmVjIHx8IHsgcGF5RGF0ZTogdG9kYXkoKSwgY2hhbm5lbDogJ+C5guC4reC4mSBRUicgfSwKICAgIGFjdGlvbjogJ2RlYnQuc2F2ZVBheW1lbnQnLCBiYXNlOiB7IGxlZGdlcjogbGVkZ2VyIH0sIGJ1Y2tldDogJ2RlYnQnLAogICAgb2NyOiB7',
  'IGRhdGU6J3BheURhdGUnLCBhbW91bnQ6J3ByaW5jaXBhbCcsIG5vdGU6J25vdGUnIH0sCiAgICBvbkRlbGV0ZTogZGVsRGVidFBheW1lbnQsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3BheURhdGUnLCBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiK4Liz',
  '4Lij4LiwJywgdHlwZTonZGF0ZScsIHJlcXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J2NoYW5uZWwnLCBsYWJlbDon4LiK4LmI4Lit4LiH4LiX4Liy4LiHJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ3BheUNoYW5uZWxzJykgfSwKICAgICAgeyBrZXk6',
  'J3ByaW5jaXBhbCcsIGxhYmVsOifguYDguIfguLTguJnguJXguYnguJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHN1bXM6dHJ1ZSwKICAgICAgICBoaW50OifguKrguYjguKfguJnguJfguLXguYjguYTguJvguKXguJTguKLguK3guJTguKvguJnguLXguYng',
  'uIjguKPguLTguIcnIH0sCiAgICAgIHsga2V5OidpbnRlcmVzdCcsICBsYWJlbDon4LiU4Lit4LiB4LmA4Lia4Li14LmJ4LiiICjguJrguLLguJcpJywgdHlwZTonbW9uZXknLCBzdW1zOnRydWUsCiAgICAgICAgaGludDon4LmE4Lih4LmI4LiW4Li54LiB4LiZ4Liz',
  '4LmE4Lib4Lil4LiU4Lii4Lit4LiU4Lir4LiZ4Li14LmJJyB9LAogICAgICB7IGtleTonX3RvdGFsJywgIGxhYmVsOifguKPguKfguKHguJfguLXguYjguYLguK3guJknLCB0eXBlOidjb21wdXRlZCcsIGZyb206WydwcmluY2lwYWwnLCdpbnRlcmVzdCddLAogICAg',
  'ICAgIGhpbnQ6J+C4leC4o+C4p+C4iOC5g+C4q+C5ieC4leC4o+C4h+C4geC4seC4muC4ouC4reC4lOC5g+C4meC4quC4peC4tOC4myDCtyDguKPguLDguJrguJrguITguLTguJTguYPguKvguYnguK3guLHguJXguYLguJnguKHguLHguJXguLQnIH0sCiAgICAgIHsg',
  'a2V5OidpbnN0YWxsbWVudCcsIGxhYmVsOifguIfguKfguJTguJfguLXguYgnLCBwaDon4LmA4LiK4LmI4LiZIDkvMjU2OScgfSwKICAgICAgeyBrZXk6J2RlYnRJZCcsICBsYWJlbDon4Lic4Li54LiB4LiB4Lix4Lia4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJJywg',
  'dHlwZTonc2VsZWN0JywKICAgICAgICBvcHRpb25zOiBkZWJ0cy5tYXAoZnVuY3Rpb24oZCl7IHJldHVybiB7IHZhbHVlOmQuaWQsIGxhYmVsOmQudGl0bGUgfTsgfSksCiAgICAgICAgaGludDon4LmA4Lin4LmJ4LiZ4Lin4LmI4Liy4LiH4LmE4LiU4LmJIOKAlCDg',
  'uKPguLDguJrguJrguIjguLDguJnguLHguJrguKPguKfguKHguJfguLHguYnguIfguJrguLHguI3guIrguLUnIH0sCiAgICAgIHsga2V5OidwYXllcicsICAgbGFiZWw6J+C4nOC4ueC5ieC4iuC4s+C4o+C4sCcgfSwKICAgICAgeyBrZXk6J3NsaXBzJywgICBsYWJl',
  'bDon4Liq4Lil4Li04Lib4LiB4Liy4Lij4LmC4Lit4LiZJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQog',
  'ICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxEZWJ0UGF5bWVudChpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4Lij4Liy4Lii4LiB4Liy4Lij4LiK4Liz4Lij4Liw4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdkZWJ0LmRlbGV0ZVBheW1l',
  'bnQnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKCk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qID09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3guKPguYzguKE6IOC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybVB1cmNoYXNlKHJlYyl7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit',
  'JyA6ICfguYDguJ7guLTguYjguKHguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcnLAogICAgcmVjb3JkOiByZWMgfHwgeyBidXlEYXRlOiB0b2RheSgpIH0sCiAgICBhY3Rpb246ICdwdXJjaGFzZS5zYXZlJywgYnVja2V0OiAncHVyY2hhc2Vz',
  'Jywgd2lkZTogdHJ1ZSwKICAgIG9jcjogeyBkYXRlOididXlEYXRlJywgYW1vdW50OidwcmljZScsIHZlbmRvcjondmVuZG9yJywgdGl0bGU6J2l0ZW0nIH0sCiAgICBvbkRlbGV0ZTogZGVsUHVyY2hhc2UsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J2l0ZW0n',
  'LCAgICBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4Lij4Liq4Li04LiZ4LiE4LmJ4LiyJywgdHlwZTondGV4dGFyZWEnLCByZXF1aXJlZDp0cnVlLCBmdWxsOnRydWUsIHBoOifguIrguLfguYjguK3guKrguLTguJnguITguYnguLIgLyDguKPguLjguYjguJkgLyDguKPg',
  'uLLguKLguKXguLDguYDguK3guLXguKLguJQnIH0sCiAgICAgIHsga2V5OididXlEYXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4i+C4t+C5ieC4rScsIHR5cGU6J2RhdGUnLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidjYXRlZ29yeScsIGxh',
  'YmVsOifguKvguKHguKfguJTguKvguKHguLnguYgnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncHVyY2hhc2VDYXRlZ29yaWVzJykgfSwKICAgICAgeyBrZXk6J3F0eScsICAgICBsYWJlbDon4LiI4Liz4LiZ4Lin4LiZJywgdHlwZTonbnVtYmVyJyB9LAog',
  'ICAgICB7IGtleTondW5pdCcsICAgIGxhYmVsOifguKvguJnguYjguKfguKInLCBwaDon4LiK4Li04LmJ4LiZIC8g4LiK4Li44LiUIC8g4LmA4LiE4Lij4Li34LmI4Lit4LiHJyB9LAogICAgICB7IGtleToncHJpY2UnLCAgIGxhYmVsOifguKPguLLguITguLLguKPg',
  'uKfguKEgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHJlcXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J3ZlbmRvcicsICBsYWJlbDon4LmB4Lir4Lil4LmI4LiH4LiX4Li14LmI4LiL4Li34LmJ4LitJywgcGg6J1Nob3BlZSAvIOC5hOC4l+C4p+C4seC4quC4',
  'lOC4uCAvIOC4o+C5ieC4suC4meKApicgfSwKICAgICAgeyBrZXk6J3BheWVyJywgICBsYWJlbDon4Lic4Li54LmJ4LiK4Liz4Lij4LiwJyB9LAogICAgICB7IGtleTond2FycmFudHlNb250aHMnLCBsYWJlbDon4Lij4Liw4Lii4Liw4LmA4Lin4Lil4Liy4Lij4Lix',
  '4Lia4Lib4Lij4Liw4LiB4Lix4LiZICjguYDguJTguLfguK3guJkpJywgdHlwZTonbnVtYmVyJywKICAgICAgICBoaW50OifguKPguLDguJrguJrguIjguLDguITguLPguJnguKfguJPguKfguLHguJnguKvguKHguJTguJvguKPguLDguIHguLHguJnguYPguKvguYng',
  'uK3guLHguJXguYLguJnguKHguLHguJXguLQnIH0sCiAgICAgIHsga2V5Oidyb29tJywgICAgbGFiZWw6J+C4q+C5ieC4reC4hy/guJ7guLfguYnguJnguJfguLXguYjguJfguLXguYjguYPguIrguYknLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOlsn4Liq4LmI4Lin',
  '4LiZ4LiB4Lil4Liy4LiHJ10uY29uY2F0KHJvb21PcHRpb25zKCkpIH0sCiAgICAgIHsga2V5OidwaG90b3MnLCAgbGFiZWw6J+C4oOC4suC4nuC4m+C4o+C4sOC4geC4reC4muC4quC4tOC4meC4hOC5ieC4sicsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAg',
  'ICAgIHsga2V5OidzbGlwcycsICAgbGFiZWw6J+C4quC4peC4tOC4m+C4geC4suC4o+C5guC4reC4meC4iuC4s+C4o+C4sCcsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4',
  'leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0KICB9KTsKfQoKZnVuY3Rpb24gZGVsUHVyY2hhc2UoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4meC4teC5iT8nLCBmdW5jdGlv',
  'bigpewogICAgY2FsbEFwaSgncHVyY2hhc2UuZGVsZXRlJywgeyBpZDogaWQgfSkudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCgpOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2Fn',
  'ZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguKXguYnguLLguIfguYHguK3guKPguYwKICAgPT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1BYyhyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4o+C4suC4ouC4geC4suC4o+C4',
  'peC5ieC4suC4h+C5geC4reC4o+C5jCcgOiAn4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJywKICAgIHJlY29yZDogcmVjIHx8IHsgYm9va0RhdGU6IHRvZGF5KCkgfSwKICAgIGFjdGlvbjogJ2FjLnNhdmUnLCBidWNr',
  'ZXQ6ICdhYycsCiAgICBvY3I6IHsgZGF0ZTonc2VydmljZURhdGUnLCBhbW91bnQ6J2Nvc3QnLCB2ZW5kb3I6J3RlY2huaWNpYW4nIH0sCiAgICBvbkRlbGV0ZTogZGVsQWMsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3Jvb20nLCAgICAgICAgbGFiZWw6J+C4',
  'q+C5ieC4reC4hycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6cm9vbU9wdGlvbnMoKSwgcmVxdWlyZWQ6dHJ1ZSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J3JvdW5kJywgICAgICAgbGFiZWw6J+C4o+C4reC4muC4l+C4teC5iCcsIHR5cGU6J251bWJlcics',
  'IGhpbnQ6J+C5gOC4p+C5ieC4meC4p+C5iOC4suC4h+C5g+C4q+C5ieC4o+C4sOC4muC4muC4meC4seC4muC4leC5iOC4reC4iOC4suC4geC4o+C4reC4muC4peC5iOC4suC4quC4uOC4lOC4guC4reC4h+C4m+C4teC4meC4seC5ieC4mScgfSwKICAgICAgeyBrZXk6',
  'J2Jvb2tEYXRlJywgICAgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4meC4seC4lOC4peC5ieC4suC4h+C5geC4reC4o+C5jCcsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidzZXJ2aWNlRGF0ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguJTguLPg',
  'uYDguJnguLTguJnguIHguLLguKPguIjguKPguLTguIcnLCB0eXBlOidkYXRlJywgaGludDon4LiB4Lij4Lit4LiB4LmA4Lih4Li34LmI4Lit4Lil4LmJ4Liy4LiH4LmA4Liq4Lij4LmH4LiI4LmB4Lil4LmJ4LinJyB9LAogICAgICB7IGtleTonc3RhdHVzJywgICAg',
  'ICBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ2FjU3RhdHVzZXMnKSB9LAogICAgICB7IGtleTondGVjaG5pY2lhbicsICBsYWJlbDon4LiK4LmI4Liy4LiHIC8g4Lic4Li54LmJ4LmD4Lir4LmJ4Lia4Lij4Li04LiB',
  '4Liy4LijJyB9LAogICAgICB7IGtleTonY29zdCcsICAgICAgICBsYWJlbDon4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiICjguJrguLLguJcpJywgdHlwZTonbW9uZXknIH0sCiAgICAgIHsga2V5OidwaG90b3MnLCAgICAgIGxhYmVsOifguKDguLLguJ7g',
  'uJvguKPguLDguIHguK3guJonLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonbm90ZScsICAgICAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9',
  'CgpmdW5jdGlvbiBkZWxBYyhpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4Lij4Liy4Lii4LiB4Liy4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdhYy5kZWxldGUnLCB7IGlkOiBpZCB9KS50',
  'aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKCk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qKiDguJnguLHguJTguKXguYnguLLg',
  'uIfguYHguK3guKPguYzguKvguKXguLLguKLguKvguYnguK3guIfguJ7guKPguYnguK3guKHguIHguLHguJkgKi8KZnVuY3Rpb24gZm9ybUJ1bGtBYygpewogIHZhciByb29tcyA9IHJvb21PcHRpb25zKCk7CiAgdmFyIGJvZHkgPQogICAgJzxkaXYgY2xhc3M9ImZn',
  'cmlkIj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7guKfguLHguJnguJfguLXguYjguJnguLHguJQgPHNwYW4gc3R5bGU9ImNvbG9yOnZhcigtLWRhbmdlcikiPio8L3NwYW4+PC9sYWJlbD4nICsKICAgICAgICAnPGlucHV0IHR5cGU9ImRhdGUiIGNs',
  'YXNzPSJpbnAiIGlkPSJia19kYXRlIiB2YWx1ZT0iJyArIHRvZGF5KCkgKyAnIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7guIrguYjguLLguIcgLyDguJzguLnguYnguYPguKvguYnguJrguKPguLTguIHguLLguKM8L2xhYmVsPjxpbnB1',
  'dCBjbGFzcz0iaW5wIiBpZD0iYmtfdGVjaCI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIj48bGFiZWw+4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4LiV4LmI4Lit4Lir4LmJ4Lit4LiHICjguJrguLLguJcpPC9sYWJlbD48aW5wdXQgdHlwZT0i',
  'bnVtYmVyIiBjbGFzcz0iaW5wIiBpZD0iYmtfY29zdCI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIj48bGFiZWw+4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4PC9sYWJlbD48aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImJrX25vdGUiPjwvZGl2PicgKwogICAg',
  'JzwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImhyIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbWI4Ij48YiBjbGFzcz0iZnMxMyI+4LmA4Lil4Li34Lit4LiB4Lir4LmJ4Lit4LiHPC9iPjxzcGFuIGNsYXNzPSJzcCI+PC9zcGFuPicgKwogICAgICAn',
  'PGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJidWxrUGljayhcJ2FsbFwnKSI+4LiX4Lix4LmJ4LiH4Lir4Lih4LiUPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImJ1bGtQaWNrKFwnbm9uZVwnKSI+4Lil4LmJ',
  '4Liy4LiHPC9idXR0b24+JyArCiAgICAgIFsxLDIsMyw0LDVdLm1hcChmdW5jdGlvbihmKXsgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImJ1bGtQaWNrKCcgKyBmICsgJykiPuC4iuC4seC5ieC4mSAnICsgZiArICc8L2J1dHRvbj4nOyB9',
  'KS5qb2luKCcnKSArCiAgICAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0icm9vbXMiIGlkPSJia1Jvb21zIj4nICsgcm9vbXMubWFwKGZ1bmN0aW9uKHIpewogICAgICByZXR1cm4gJzxsYWJlbCBjbGFzcz0icm9vbSIgc3R5bGU9ImN1cnNvcjpwb2ludGVyIj48',
  'aW5wdXQgdHlwZT0iY2hlY2tib3giIGNsYXNzPSJiayIgdmFsdWU9IicgKyByICsgJyI+IDxiPicgKyByICsgJzwvYj48L2xhYmVsPic7CiAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwoKICBvcGVuTW9kYWwoJ/Cfk4Ug4LiZ4Lix4LiU4Lil4LmJ4Liy4LiH4LmB',
  '4Lit4Lij4LmM4Lir4Lil4Liy4Lii4Lir4LmJ4Lit4LiH4Lie4Lij4LmJ4Lit4Lih4LiB4Lix4LiZJywgYm9keSwKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lii4LiB4LmA4Lil4Li04LiBPC9idXR0b24+JyArCiAgICAn',
  'PGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgaWQ9ImJrU2F2ZSI+4Liq4Lij4LmJ4Liy4LiH4LiZ4Lix4LiU4Lir4Lih4Liy4LiiPC9idXR0b24+JywgdHJ1ZSk7CgogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdia1NhdmUnKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsK',
  'ICAgIHZhciBwaWNrZWQgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYms6Y2hlY2tlZCcpKS5tYXAoZnVuY3Rpb24oYyl7IHJldHVybiBjLnZhbHVlOyB9KTsKICAgIHZhciBkYXRlID0gZG9jdW1lbnQuZ2V0',
  'RWxlbWVudEJ5SWQoJ2JrX2RhdGUnKS52YWx1ZTsKICAgIGlmICghcGlja2VkLmxlbmd0aCkgcmV0dXJuIHRvYXN0KCfguYDguKXguLfguK3guIHguK3guKLguYjguLLguIfguJnguYnguK3guKIgMSDguKvguYnguK3guIcnLCAnZXJyJyk7CiAgICBpZiAoIWRhdGUp',
  'IHJldHVybiB0b2FzdCgn4LiB4Lij4Li44LiT4Liy4Lij4Liw4Lia4Li44Lin4Lix4LiZ4LiX4Li14LmI4LiZ4Lix4LiUJywgJ2VycicpOwogICAgdmFyIGJ0biA9IHRoaXM7IGJ0bi5kaXNhYmxlZCA9IHRydWU7IGJ0bi5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9',
  'InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4Lia4Lix4LiZ4LiX4Li24LiB4oCmJzsKICAgIGNhbGxBcGkoJ2FjLmJ1bGtCb29rJywgewogICAgICByb29tczogcGlja2VkLCBib29rRGF0ZTogZGF0ZSwKICAgICAgdGVjaG5pY2lhbjogZG9jdW1lbnQuZ2V0',
  'RWxlbWVudEJ5SWQoJ2JrX3RlY2gnKS52YWx1ZSwKICAgICAgY29zdDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JrX2Nvc3QnKS52YWx1ZSwKICAgICAgbm90ZTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JrX25vdGUnKS52YWx1ZQogICAgfSkudGhlbihm',
  'dW5jdGlvbihuKXsKICAgICAgY2xvc2VNb2RhbCgpOyB0b2FzdCgn4Liq4Lij4LmJ4Liy4LiH4LiZ4Lix4LiU4Lir4Lih4Liy4LiiICcgKyBuICsgJyDguKvguYnguK3guIfguYHguKXguYnguKcnLCAnb2snKTsgbG9hZCgpOwogICAgfSkuY2F0Y2goZnVuY3Rpb24o',
  'ZSl7CiAgICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBidG4udGV4dENvbnRlbnQgPSAn4Liq4Lij4LmJ4Liy4LiH4LiZ4Lix4LiU4Lir4Lih4Liy4LiiJzsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7CiAgICB9KTsKICB9Owp9CgpmdW5jdGlvbiBidWxrUGlj',
  'ayh3aGF0KXsKICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYmsnKS5mb3JFYWNoKGZ1bmN0aW9uKGMpewogICAgaWYgKHdoYXQgPT09ICdhbGwnKSBjLmNoZWNrZWQgPSB0cnVlOwogICAgZWxzZSBpZiAod2hhdCA9PT0gJ25vbmUnKSBjLmNoZWNrZWQgPSBm',
  'YWxzZTsKICAgIGVsc2UgYy5jaGVja2VkID0gU3RyaW5nKGMudmFsdWUpLmNoYXJBdCgwKSA9PT0gU3RyaW5nKHdoYXQpOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif',
  '4Lit4Lij4LmM4LihOiDguIvguYjguK3guKHguYHguIvguKHguJXguLLguKHguKvguYnguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1SZXBhaXIocmVjKXsK',
  'ICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguIfguLLguJnguIvguYjguK3guKEnIDogJ+C5geC4iOC5ieC4h+C4i+C5iOC4reC4oSAvIOC4muC4seC4meC4l+C4tuC4geC4h+C4suC4meC4i+C5iOC4reC4oScs',
  'CiAgICByZWNvcmQ6IHJlYyB8fCB7IHJlcG9ydERhdGU6IHRvZGF5KCksIHByaW9yaXR5OiAn4Lib4LiB4LiV4Li0JyB9LAogICAgYWN0aW9uOiAncmVwYWlyLnNhdmUnLCBidWNrZXQ6ICdyb29tUmVwYWlyJywgd2lkZTogdHJ1ZSwKICAgIG9jcjogeyBkYXRlOidy',
  'ZXBhaXJEYXRlJywgYW1vdW50Oidjb3N0JywgdmVuZG9yOid0ZWNobmljaWFuJywgdGl0bGU6J2l0ZW1zJyB9LAogICAgb25EZWxldGU6IGRlbFJlcGFpciwKICAgIGZpZWxkczogWwogICAgICB7IGtleToncm9vbScsICAgICAgIGxhYmVsOifguKvguYnguK3guIcn',
  'LCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOnJvb21PcHRpb25zKCksIHJlcXVpcmVkOnRydWUsIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5OidjYXRlZ29yeScsICAgbGFiZWw6J+C4m+C4o+C4sOC5gOC4oOC4l+C4h+C4suC4mScsIHR5cGU6J3NlbGVjdCcsIG9w',
  'dGlvbnM6b3B0KCdyZXBhaXJDYXRlZ29yaWVzJykgfSwKICAgICAgeyBrZXk6J2l0ZW1zJywgICAgICBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LiL4LmI4Lit4Lih4LmB4LiL4LihJywgdHlwZTondGV4dGFyZWEnLCByZXF1',
  'aXJlZDp0cnVlLCBmdWxsOnRydWUsCiAgICAgICAgcGg6J+C5gOC4iuC5iOC4mSAxLuC4ouC4suC5geC4meC4pyAyLuC5gOC4geC5h+C4muC4quC4teC4q+C5ieC4reC4hyAzLuC5gOC4m+C4peC4teC5iOC4ouC4meC4geC5iuC4reC4geC4meC5ieC4s+C4peC5ieC4',
  'suC4h+C4iOC4suC4mScgfSwKICAgICAgeyBrZXk6J3JlcG9ydERhdGUnLCBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LmB4LiI4LmJ4LiHJywgdHlwZTonZGF0ZScgfSwKICAgICAgeyBrZXk6J2Jvb2tEYXRlJywgICBsYWJlbDon4Lin4Lix4LiZ4LiZ4Lix4LiU',
  '4LiL4LmI4Lit4Lih4LmB4LiL4LihJywgdHlwZTonZGF0ZScgfSwKICAgICAgeyBrZXk6J3JlcGFpckRhdGUnLCBsYWJlbDon4Lin4Lix4LiZ4LmA4LiC4LmJ4Liy4LiL4LmI4Lit4Lih4LmB4LiL4LihJywgdHlwZTonZGF0ZScsIGhpbnQ6J+C4geC4o+C4reC4geC5',
  'gOC4oeC4t+C5iOC4reC4i+C5iOC4reC4oeC5gOC4quC4o+C5h+C4iOC5geC4peC5ieC4pycgfSwKICAgICAgeyBrZXk6J3N0YXR1cycsICAgICBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ3JlcGFpclN0YXR1c2Vz',
  'JykgfSwKICAgICAgeyBrZXk6J3ByaW9yaXR5JywgICBsYWJlbDon4LiE4Lin4Liy4Lih4LmA4Lij4LmI4LiH4LiU4LmI4Lin4LiZJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ3ByaW9yaXRpZXMnKSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J3Rl',
  'Y2huaWNpYW4nLCBsYWJlbDon4LiK4LmI4Liy4LiH4Lic4Li54LmJ4LiL4LmI4Lit4LihJyB9LAogICAgICB7IGtleTonY29zdCcsICAgICAgIGxhYmVsOifguITguYjguLLguYPguIrguYnguIjguYjguLLguKIgKOC4muC4suC4lyknLCB0eXBlOidtb25leScgfSwK',
  'ICAgICAgeyBrZXk6J3Bob3Rvc0JlZm9yZScsIGxhYmVsOifguKDguLLguJ7guIHguYjguK3guJnguIvguYjguK3guKEnLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleToncGhvdG9zQWZ0ZXInLCAgbGFiZWw6J+C4oOC4suC4nuC4q+C4peC4',
  'seC4h+C4i+C5iOC4reC4oScsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICAgICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0KICB9KTsKfQoK',
  'ZnVuY3Rpb24gZGVsUmVwYWlyKGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguIfguLLguJnguIvguYjguK3guKHguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ3JlcGFpci5kZWxldGUnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7',
  'IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKCk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3guKPguYzguKE6IOC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybUJ1aWxkaW5nKHJlYyl7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiV4Li24LiBJyA6ICfguYDguJ7guLTguYjguKHguIfg',
  'uLLguJnguIvguYjguK3guKHguYHguIvguKHguJXguLbguIHguYLguJTguKLguKPguKfguKEnLAogICAgcmVjb3JkOiByZWMgfHwgeyBib29rRGF0ZTogdG9kYXkoKSB9LAogICAgYWN0aW9uOiAnYnVpbGRpbmcuc2F2ZScsIGJ1Y2tldDogJ2J1aWxkaW5nJywgd2lk',
  'ZTogdHJ1ZSwKICAgIG9jcjogeyBkYXRlOidlbmREYXRlJywgYW1vdW50Oidjb3N0JywgdmVuZG9yOidjb250cmFjdG9yJywgdGl0bGU6J3RpdGxlJyB9LAogICAgb25EZWxldGU6IGRlbEJ1aWxkaW5nLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oid6b25lJywg',
  'ICAgICBsYWJlbDon4Liq4LmI4Lin4LiZ4LiC4Lit4LiH4Lit4Liy4LiE4Liy4LijJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ2J1aWxkaW5nWm9uZXMnKSwgcmVxdWlyZWQ6dHJ1ZSB9LAogICAgICB7IGtleTondGl0bGUnLCAgICAgbGFiZWw6J+C4o+C4',
  'suC4ouC4geC4suC4o+C4i+C5iOC4reC4oeC5geC4i+C4oScsIHR5cGU6J3RleHRhcmVhJywgcmVxdWlyZWQ6dHJ1ZSwgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidib29rRGF0ZScsICBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiZ4Lix4LiUJywgdHlwZTon',
  'ZGF0ZScgfSwKICAgICAgeyBrZXk6J3N0YXJ0RGF0ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguYDguKPguLTguYjguKHguJTguLPguYDguJnguLTguJnguIHguLLguKMnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonZW5kRGF0ZScsICAgbGFiZWw6',
  'J+C4p+C4seC4meC4l+C4teC5iOC5geC4peC5ieC4p+C5gOC4quC4o+C5h+C4iCcsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCAgICBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ2J1aWxkaW5n',
  'U3RhdHVzZXMnKSB9LAogICAgICB7IGtleTonY29udHJhY3RvcicsIGxhYmVsOifguJzguLnguYnguKPguLHguJrguYDguKvguKHguLIgLyDguKPguYnguLLguJknIH0sCiAgICAgIHsga2V5Oidjb3N0JywgICAgICBsYWJlbDon4LiE4LmI4Liy4LmD4LiK4LmJ4LiI',
  '4LmI4Liy4LiiICjguJrguLLguJcpJywgdHlwZTonbW9uZXknIH0sCiAgICAgIHsga2V5OiduZXh0RHVlJywgICBsYWJlbDon4LiE4Lij4Lia4LiB4Liz4Lir4LiZ4LiU4Lij4Lit4Lia4LiW4Lix4LiU4LmE4LibJywgdHlwZTonZGF0ZScsIGhpbnQ6J+C5gOC4iuC5',
  'iOC4mSDguIHguLHguJnguIvguLbguKHguJTguLLguJTguJ/guYnguLLguJfguLjguIEgMyDguJvguLUg4oCUIOC5g+C4quC5iOC4p+C4seC4meC4l+C4teC5iOC4hOC4o+C4seC5ieC4h+C4luC4seC4lOC5hOC4mycgfSwKICAgICAgeyBrZXk6J3Bob3RvcycsICAg',
  'IGxhYmVsOifguKDguLLguJ7guJvguKPguLDguIHguK3guJonLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonc2xpcHMnLCAgICAgbGFiZWw6J+C5g+C4muC5gOC4quC4o+C5h+C4iCAvIOC4quC4peC4tOC4mycsIHR5cGU6J2ZpbGVzJywg',
  'ZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxCdWlsZGluZyhpZCl7CiAgY29uZmly',
  'bUFjdGlvbign4Lil4Lia4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiV4Li24LiB4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdidWlsZGluZy5kZWxldGUnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXg',
  'uYnguKcnLCdvaycpOyBsb2FkKCk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PQogICDguJ/guK3guKPguYzguKE6IOC4guC5ieC4reC4oeC4ueC4peC4q+C5ieC4reC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybVJvb20ocmVjKXsKICBv',
  'cGVuRm9ybSh7CiAgICB0aXRsZTogJ+C4guC5ieC4reC4oeC4ueC4peC4q+C5ieC4reC4hyAnICsgKHJlYyA/IHJlYy5yb29tIDogJycpLAogICAgcmVjb3JkOiByZWMsIGFjdGlvbjogJ3Jvb20uc2F2ZScsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3Jvb20n',
  'LCAgIGxhYmVsOifguKvguYnguK3guIcnLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidmbG9vcicsICBsYWJlbDon4LiK4Lix4LmJ4LiZJywgdHlwZTonbnVtYmVyJyB9LAogICAgICB7IGtleTonc3RhdHVzJywgbGFiZWw6J+C4quC4luC4suC4meC4sCcs',
  'IHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdyb29tU3RhdHVzZXMnKSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J3RlbmFudCcsIGxhYmVsOifguIrguLfguYjguK3guJzguLnguYnguYDguIrguYjguLInIH0sCiAgICAgIHsga2V5OidwaG9uZScsICBs',
  'YWJlbDon4LmA4Lia4Lit4Lij4LmM4LiV4Li04LiU4LiV4LmI4LitJyB9LAogICAgICB7IGtleToncmVudCcsICAgbGFiZWw6J+C4hOC5iOC4suC5gOC4iuC5iOC4si/guYDguJTguLfguK3guJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScgfSwKICAgICAgeyBr',
  'ZXk6J21vdmVJbicsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguYDguILguYnguLLguK3guKLguLnguYgnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonbm90ZScsICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVh',
  'JywgZnVsbDp0cnVlIH0KICAgIF0KICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4',
  'suC4ouC4q+C4rQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybUZpbmFuY2UocmVjKXsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHg',
  'uIHguYnguYTguILguKPguLLguKLguIHguLLguKMnIDogJ+C4muC4seC4meC4l+C4tuC4geC4o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKInLAogICAgcmVjb3JkOiByZWMgfHwgeyBkYXRlOiB0b2RheSgpLCBjaGFubmVsOiAn4LmC4Lit4LiZ',
  'IFFSJyB9LAogICAgYWN0aW9uOiAnZmluYW5jZS5zYXZlJywgYnVja2V0OiAnbWlzYycsCiAgICBvbkRlbGV0ZTogZGVsRmluYW5jZSwKICAgIGZpZWxkczogWwogICAgICB7IGtleTona2luZCcsICAgbGFiZWw6J+C4o+C4suC4ouC4geC4suC4oycsIHR5cGU6J3Nl',
  'bGVjdCcsIG9wdGlvbnM6b3B0KCdmaW5hbmNlS2luZHMnKSwgcmVxdWlyZWQ6dHJ1ZSwgYmxhbms6ZmFsc2UsCiAgICAgICAgaGludDon4LmA4Lil4Li34Lit4LiBICLguKPguLLguKLguKPguLHguJrguITguYjguLLguYDguIrguYjguLIiIOC4q+C4o+C4t+C4rSAi',
  '4Lij4Liy4Lii4Lij4Lix4Lia4Lit4Li34LmI4LiZIOC5hiIg4Lij4Liw4Lia4Lia4LiI4Liw4LiZ4Lix4Lia4LmA4Lib4LmH4LiZ4Lid4Lix4LmI4LiH4Lij4Liy4Lii4Lij4Lix4Lia4LmD4Lir4LmJ4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0JyB9LAogICAg',
  'ICB7IGtleTonZGF0ZScsICAgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iCcsIHR5cGU6J2RhdGUnLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidhbW91bnQnLCBsYWJlbDon4LiI4Liz4LiZ4Lin4LiZ4LmA4LiH4Li04LiZICjguJrguLLguJcpJywgdHlw',
  'ZTonbW9uZXknLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidiaWxsTW9udGgnLCBsYWJlbDon4Lij4Lit4Lia4Lia4Li04Lil4LiC4Lit4LiH4LmA4LiU4Li34Lit4LiZJywgcGg6J+C5gOC4iuC5iOC4mSDguIEu4LiELiAyNTY5JyB9LAogICAgICB7IGtl',
  'eTonY2hhbm5lbCcsIGxhYmVsOifguIrguYjguK3guIfguJfguLLguIcnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnZmluYW5jZUNoYW5uZWxzJykgfSwKICAgICAgeyBrZXk6J3NsaXBzJywgIGxhYmVsOifguKrguKXguLTguJsgLyDguYPguJrguYDguKrg',
  'uKPguYfguIgnLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonbm90ZScsICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0KICB9KTsKfQoKZnVuY3Rpb24gZGVs',
  'RmluYW5jZShpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4Lij4Liy4Lii4LiB4Liy4Lij4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdmaW5hbmNlLmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4',
  'muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoKTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09CiAgIOC4quC4s+C4o+C4reC4hyAvIOC4geC4ueC5ieC4hOC4t+C4meC4guC5ieC4reC4oeC4ueC4pQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZG9F',
  'eHBvcnRKc29uKCl7CiAgdG9hc3QoJ+C4geC4s+C4peC4seC4h+C5gOC4leC4o+C4teC4ouC4oeC5hOC4n+C4peC5jOC4quC4s+C4o+C4reC4h+KApicpOwogIGNhbGxBcGkoJ2JhY2t1cC5leHBvcnQnLCB7fSkudGhlbihmdW5jdGlvbihkdW1wKXsKICAgIHNhdmVU',
  'ZXh0RmlsZSgndGhlLW0tY29ybmVyLWFwLWJhY2t1cC0nICsgdG9kYXkoKSArICcuanNvbicsCiAgICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoZHVtcCwgbnVsbCwgMSksICdhcHBsaWNhdGlvbi9qc29uJyk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRv',
  'YXN0KGUubWVzc2FnZXx8ZSwgJ2VycicpOyB9KTsKfQoKZnVuY3Rpb24gZG9FeHBvcnRDc3Yoc2hlZXQpewogIGNhbGxBcGkoJ2JhY2t1cC5jc3YnLCB7IHNoZWV0OiBzaGVldCB9KS50aGVuKGZ1bmN0aW9uKHIpewogICAgc2F2ZVRleHRGaWxlKHIuZmlsZW5hbWUs',
  'IHIuY29udGVudCwgJ3RleHQvY3N2Jyk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwgJ2VycicpOyB9KTsKfQoKLyoqIOC4lOC4suC4p+C4meC5jOC5guC4q+C4peC4lOC5hOC4n+C4peC5jCDigJQg4LmD4LiK4LmJIGRvd25sb2Fk',
  'cyBjYXBhYmlsaXR5IOC4luC5ieC4suC4oeC4tSDguYTguKHguYjguIfguLHguYnguJnguYPguIrguYnguKXguLTguIfguIHguYzguJvguIHguJXguLQgKi8KZnVuY3Rpb24gc2F2ZVRleHRGaWxlKGZpbGVuYW1lLCBjb250ZW50LCBtaW1lKXsKICBpZiAodHlwZW9m',
  'IHdpbmRvdy5zYXZlVmlhSG9zdCA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJuIHdpbmRvdy5zYXZlVmlhSG9zdChmaWxlbmFtZSwgY29udGVudCwgbWltZSk7CiAgdmFyIGJsb2IgPSBuZXcgQmxvYihbY29udGVudF0sIHsgdHlwZTogbWltZSArICc7Y2hhcnNldD11dGYt',
  'OCcgfSk7CiAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7CiAgYS5ocmVmID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTsKICBhLmRvd25sb2FkID0gZmlsZW5hbWU7CiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhKTsgYS5jbGljaygp',
  'OwogIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgVVJMLnJldm9rZU9iamVjdFVSTChhLmhyZWYpOyBhLnJlbW92ZSgpOyB9LCAxMDAwKTsKICB0b2FzdCgn4LiU4Liy4Lin4LiZ4LmM4LmC4Lir4Lil4LiUICcgKyBmaWxlbmFtZSArICcg4LmB4Lil4LmJ4LinJywgJ29r',
  'Jyk7Cn0KCmZ1bmN0aW9uIGRvSW1wb3J0SnNvbigpewogIG9wZW5Nb2RhbCgn4qyG77iPIOC4geC4ueC5ieC4hOC4t+C4meC4iOC4suC4geC5hOC4n+C4peC5jOC4quC4s+C4o+C4reC4hycsCiAgICAnPHAgY2xhc3M9ImZzMTMiPuC5gOC4peC4t+C4reC4geC5hOC4',
  'n+C4peC5jCA8Yj4uanNvbjwvYj4g4LiX4Li14LmI4LmA4LiE4Lii4LiU4Liy4Lin4LiZ4LmM4LmC4Lir4Lil4LiU4LmE4Lin4LmJPC9wPicgKwogICAgJzxsYWJlbCBjbGFzcz0iZmlsZS1kcm9wIiBmb3I9ImltcEZpbGUiPvCfk4Qg4LmA4Lil4Li34Lit4LiB4LmE',
  '4Lif4Lil4LmM4Liq4Liz4Lij4Lit4LiHJyArCiAgICAgICc8aW5wdXQgdHlwZT0iZmlsZSIgaWQ9ImltcEZpbGUiIGFjY2VwdD0iYXBwbGljYXRpb24vanNvbiwuanNvbiIgc3R5bGU9ImRpc3BsYXk6bm9uZSIgJyArCiAgICAgICdvbmNoYW5nZT0iZG9jdW1lbnQu',
  'Z2V0RWxlbWVudEJ5SWQoXCdpbXBOYW1lXCcpLnRleHRDb250ZW50PXRoaXMuZmlsZXNbMF0/dGhpcy5maWxlc1swXS5uYW1lOlwnXCciPjwvbGFiZWw+JyArCiAgICAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtdDgiIGlkPSJpbXBOYW1lIj48L2Rpdj4nICsKICAg',
  'ICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iZiI+PGxhYmVsPuC4p+C4tOC4mOC4teC4geC4ueC5ieC4hOC4t+C4mTwvbGFiZWw+JyArCiAgICAnPHNlbGVjdCBjbGFzcz0ic2VsIiBpZD0iaW1wTW9kZSI+JyArCiAgICAgICc8b3B0',
  'aW9uIHZhbHVlPSJtZXJnZSI+4LmA4Lie4Li04LmI4Lih4LmA4LiJ4Lie4Liy4Liw4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li1ICjguYHguJnguLDguJnguLMpPC9vcHRpb24+JyArCiAgICAgICc8b3B0aW9uIHZhbHVl',
  'PSJyZXBsYWNlIj7guKXguYnguLLguIfguILguYnguK3guKHguLnguKXguYDguJTguLTguKHguYHguKXguYnguKfguYHguJfguJnguJfguLXguYjguJfguLHguYnguIfguKvguKHguJQ8L29wdGlvbj4nICsKICAgICc8L3NlbGVjdD48L2Rpdj4nLAogICAgJzxidXR0',
  'b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBpZD0iaW1wR28iPuC4geC4ueC5ieC4hOC4t+C4meC4guC5ieC4reC4oeC4ueC4pTwvYnV0',
  'dG9uPicpOwoKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW1wR28nKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsKICAgIHZhciBmID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ltcEZpbGUnKS5maWxlc1swXTsKICAgIGlmICghZikgcmV0dXJuIHRvYXN0KCfg',
  'uIHguKPguLjguJPguLLguYDguKXguLfguK3guIHguYTguJ/guKXguYzguIHguYjguK3guJknLCAnZXJyJyk7CiAgICB2YXIgbW9kZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbXBNb2RlJykudmFsdWU7CiAgICB2YXIgYnRuID0gdGhpczsgYnRuLmRpc2Fi',
  'bGVkID0gdHJ1ZTsgYnRuLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDguIHguLPguKXguLHguIfguIHguLnguYnguITguLfguJnigKYnOwogICAgdmFyIHIgPSBuZXcgRmlsZVJlYWRlcigpOwogICAgci5vbmxvYWQgPSBmdW5jdGlvbigp',
  'ewogICAgICB2YXIgcGFyc2VkOwogICAgICB0cnkgeyBwYXJzZWQgPSBKU09OLnBhcnNlKHIucmVzdWx0KTsgfQogICAgICBjYXRjaCAoZSkgeyBidG4uZGlzYWJsZWQgPSBmYWxzZTsgYnRuLnRleHRDb250ZW50ID0gJ+C4geC4ueC5ieC4hOC4t+C4meC4guC5ieC4',
  'reC4oeC4ueC4pSc7IHJldHVybiB0b2FzdCgn4LmE4Lif4Lil4LmM4LmE4Lih4LmI4LmD4LiK4LmIIEpTT04g4LiX4Li14LmI4LiW4Li54LiB4LiV4LmJ4Lit4LiHJywgJ2VycicpOyB9CiAgICAgIGNhbGxBcGkoJ2JhY2t1cC5pbXBvcnQnLCB7IGRhdGE6IHBhcnNl',
  'ZCwgbW9kZTogbW9kZSB9KS50aGVuKGZ1bmN0aW9uKHN0YXQpewogICAgICAgIGNsb3NlTW9kYWwoKTsKICAgICAgICB2YXIgbiA9IE9iamVjdC5rZXlzKHN0YXQpLnJlZHVjZShmdW5jdGlvbihhLGspeyByZXR1cm4gYSArIChzdGF0W2tdfHwwKTsgfSwgMCk7CiAg',
  'ICAgICAgdG9hc3QoJ+C4geC4ueC5ieC4hOC4t+C4meC4quC4s+C5gOC4o+C5h+C4iCAnICsgbiArICcg4Lij4Liy4Lii4LiB4Liy4LijJywgJ29rJyk7CiAgICAgICAgbG9hZCgpOwogICAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgICBidG4uZGlzYWJs',
  'ZWQgPSBmYWxzZTsgYnRuLnRleHRDb250ZW50ID0gJ+C4geC4ueC5ieC4hOC4t+C4meC4guC5ieC4reC4oeC4ueC4pSc7IHRvYXN0KGUubWVzc2FnZXx8ZSwgJ2VycicpOwogICAgICB9KTsKICAgIH07CiAgICByLnJlYWRBc1RleHQoZik7CiAgfTsKfQoKLyogPT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jCDguYHguKXguLDguIHguLLguKPguKrguLPguKPguK3guIfguKXguIcgR29vZ2xlIERyaXZlCiAgID09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKZnVuY3Rpb24gY29weVNoYXJlKCl7CiAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NoYXJlVXJsJyk7CiAgaWYgKCFlbCkgcmV0dXJuOwog',
  'IGVsLnNlbGVjdCgpOwogIGlmIChuYXZpZ2F0b3IuY2xpcGJvYXJkKSB7CiAgICBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChlbC52YWx1ZSkKICAgICAgLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4hOC4seC4lOC4peC4reC4geC4peC4tOC4h+C4geC5',
  'jOC5geC4iuC4o+C5jOC5geC4peC5ieC4pycsJ29rJyk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbigpeyB0b2FzdCgn4LiE4Lix4LiU4Lil4Lit4LiB4LmE4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIIOKAlCDguIHguJTguITguYnguLLguIfguJfguLXguYjguIrg',
  'uYjguK3guIfguYHguKXguYnguKfguYDguKXguLfguK3guIHguITguLHguJTguKXguK3guIEnLCdlcnInKTsgfSk7CiAgfSBlbHNlIHsKICAgIHRyeSB7IGRvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7IHRvYXN0KCfguITguLHguJTguKXguK3guIHguKXguLTg',
  'uIfguIHguYzguYHguIrguKPguYzguYHguKXguYnguKcnLCdvaycpOyB9CiAgICBjYXRjaCAoZSkgeyB0b2FzdCgn4LiE4Lix4LiU4Lil4Lit4LiB4LmE4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIIOKAlCDguIHguJTguITguYnguLLguIfguJfguLXguYjguIrguYjg',
  'uK3guIfguYHguKXguYnguKfguYDguKXguLfguK3guIHguITguLHguJTguKXguK3guIEnLCdlcnInKTsgfQogIH0KfQoKZnVuY3Rpb24gZG9Sb3RhdGVTaGFyZSgpewogIGNvbmZpcm1BY3Rpb24oJ+C4reC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC4',
  'iuC4uOC4lOC5g+C4q+C4oeC5iD8g4LiE4LiZ4LiX4Li14LmI4LiW4Li34Lit4Lil4Li04LiH4LiB4LmM4LmA4LiU4Li04Lih4LiI4Liw4LmA4Lib4Li04LiU4LmE4Lih4LmI4LmE4LiU4LmJ4Lit4Li14LiBJywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ3NoYXJl',
  'LnJvdGF0ZVRva2VuJywge30pLnRoZW4oZnVuY3Rpb24oKXsKICAgICAgdG9hc3QoJ+C4reC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC4iuC4uOC4lOC5g+C4q+C4oeC5iOC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoKTsKICAgIH0pLmNhdGNoKGZ1',
  'bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKZnVuY3Rpb24gZG9CYWNrdXBOb3coKXsKICB0b2FzdCgn4LiB4Liz4Lil4Lix4LiH4Liq4Liz4Lij4Lit4LiH4LiC4LmJ4Lit4Lih4Li54Lil4Lil4LiHIERyaXZl4oCmJyk7',
  'CiAgY2FsbEFwaSgnYmFja3VwLmJhY2t1cE5vdycsIHt9KS50aGVuKGZ1bmN0aW9uKHIpewogICAgdG9hc3QoJ+C4quC4s+C4o+C4reC4h+C5geC4peC5ieC4pzogJyArIHIubmFtZSwgJ29rJyk7IGxvYWQoKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3Qo',
  'ZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7Cn0KPC9zY3JpcHQ+CjxzY3JpcHQ+Ym9vdCgpOzwvc2NyaXB0Pgo8L2JvZHk+CjwvaHRtbD4K'
].join('');

function indexHtml_() {
  return Utilities.newBlob(Utilities.base64Decode(INDEX_HTML_B64), 'text/html')
    .getDataAsString('UTF-8');
}
