/**
 * The M Corner AP — ระบบบริหารหอพัก (ไฟล์เดียวจบ)
 * ไฟล์นี้สร้างอัตโนมัติจากโฟลเดอร์ src/ เมื่อ 2026-09-03 04:16 UTC
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
  VERSION: '1.3.1',
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
  { key: 'lines',       label: 'รายการในบิล',      type: 'multiline' },
  { key: 'shipping',    label: 'ค่าส่ง',           type: 'money' },
  { key: 'discount',    label: 'ส่วนลด',           type: 'money' },
  { key: 'price',       label: 'ราคารวม',         type: 'money' },
  { key: 'orderNo',     label: 'เลขที่คำสั่งซื้อ',   type: 'text' },
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
var SCHEMA_VERSION = 7;

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
  { key: 'refresh_seconds', label: 'ตรวจข้อมูลใหม่อัตโนมัติ', value: '300', note: 'ระบบจะไม่โหลดทับตอนที่คุณกำลังกรอกข้อมูลอยู่ · กดบันทึกแล้วอัปเดตให้ทันทีเสมอ' },
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

/**
 * สร้าง Date จากปี/เดือน/วัน แล้วตรวจว่าวันนั้นมีอยู่จริง
 *
 * new Date(2026, 1, 31) ไม่ error แต่เลื่อนไปเป็น 3 มี.ค. เงียบ ๆ
 * พิมพ์ผิดเป็น 31/02 จึงกลายเป็นรายการของเดือนมีนาคมโดยไม่มีใครรู้
 * ซึ่งในสมุดบัญชีคือยอดไปโผล่ผิดเดือน — ไม่มีวันนั้นก็ต้องบอกว่าไม่มี
 */
function mkDate_(y, mo, d) {
  var out = new Date(y, mo - 1, d);
  if (out.getFullYear() !== y || out.getMonth() !== mo - 1 || out.getDate() !== d) return null;
  return out;
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
  if (m) return mkDate_(Number(m[1]), Number(m[2]), Number(m[3]));

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
    return mkDate_(y, mo, d);
  }
  var parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * ตรวจวันที่ที่ผู้ใช้กรอกมา แล้วคืนเป็น 'YYYY-MM-DD'
 *
 * ถ้าอ่านไม่ออกต้องบอกกลับไปเลย ห้ามเก็บเป็นค่าว่างเงียบ ๆ
 * เพราะแถวนั้นจะยังถูกนับในยอดรวมของปี (ปีถูกเดาจากค่าสำรอง)
 * แต่ไม่โผล่ในเดือนไหนเลย ทำให้ตัวเลขสรุปกับกราฟไม่ตรงกัน
 * โดยที่เจ้าของหอไม่มีทางรู้ว่าหายไปไหน
 *
 * @param {*} value ค่าที่กรอกมา
 * @param {string} label ชื่อช่อง ใช้ในข้อความบอกผู้ใช้
 * @param {boolean=} required ต้องกรอกหรือไม่
 */
function cleanDate_(value, label, required) {
  var raw = String(value == null ? '' : value).trim();
  if (!raw) {
    if (required) throw new Error('กรุณาระบุ' + label);
    return '';
  }
  var d = toDate_(raw);
  if (!d) throw new Error(label + 'ไม่ถูกต้อง: "' + raw + '" — ไม่มีวันนี้อยู่จริง');
  return toIsoDate_(d);
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

/**
 * รายชื่อห้องที่ต้องแสดงผล = ทะเบียนห้อง + ห้องที่โผล่ในข้อมูลแต่ไม่อยู่ในทะเบียน
 *
 * ถ้าใช้ ROOMS ตรง ๆ ห้องที่ยังไม่ได้ลงทะเบียน (เพิ่มห้องใหม่ ปรับเลขห้อง
 * หรือพิมพ์เลขห้องผิด) จะหายไปจากภาพรวมทั้งที่ยังถูกนับรวมในยอดรวม
 * ตัวเลขจึงไม่ลงกันและงานนั้นก็กดเข้าไปดูไม่ได้เลย
 *
 * @param {...Array} lists รายการข้อมูลที่มีคอลัมน์ room
 */
function roomsInPlay_() {
  var seen = {}, out = [];
  ROOMS.forEach(function (r) { seen[String(r)] = true; out.push(String(r)); });
  for (var i = 0; i < arguments.length; i++) {
    (arguments[i] || []).forEach(function (r) {
      var room = String((r && r.room) != null ? r.room : r).trim();
      if (!room || seen[room]) return;
      seen[room] = true;
      out.push(room);
    });
  }
  return out;
}

/* ---------- Log ---------- */

function logActivity_(action, target, detail) {
  try {
    insertRow_(SHEETS.LOG, {
      at: new Date(),
      user: currentUserEmail_() || 'ไม่ทราบผู้ใช้',
      action: action,
      target: target,
      detail: typeof detail === 'string' ? detail : JSON.stringify(detail || {})
    });
  } catch (e) {
    console.warn('logActivity_ failed: ' + e);
  }
}

/**
 * อีเมลของคนที่กำลังใช้งาน — คืนค่าว่างถ้าไม่รู้
 *
 * ต้องเป็นค่าว่าง ไม่ใช่คำแทนอย่าง 'unknown' เพราะ resolveActor_ เอาค่านี้
 * ไปเทียบกับอีเมลเจ้าของชีต ถ้าคืนคำแทนที่ทั้งสองฝั่งบังเอิญตรงกัน
 * คนที่ไม่ได้ล็อกอินจะกลายเป็นผู้ดูแลทันที — ไม่รู้ต้องแปลว่าไม่ผ่าน
 */
function currentUserEmail_() {
  try { return Session.getActiveUser().getEmail() || ''; }
  catch (e) { return ''; }
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
var MUTATING_ACTIONS = /^ocr\.read$|\.(save|delete|savePayment|deletePayment|bulkBook|import|send|rotateToken|backupNow|upload|trash|toggle)$/;

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
 *
 * options ของ select ใส่ได้ 2 แบบ
 *   'ข้อความ'                   — ค่าที่เก็บกับข้อความที่เห็นเป็นตัวเดียวกัน
 *   { value: '300', label: '…' } — เก็บค่าหนึ่ง แต่ให้ผู้ใช้เห็นอีกข้อความหนึ่ง
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
      { key: 'refresh_seconds', type: 'select', options: [
        { value: '0',    label: 'ปิด — โหลดใหม่เองเมื่อกดปุ่ม ↻' },
        { value: '60',   label: 'ทุก 1 นาที' },
        { value: '300',  label: 'ทุก 5 นาที (แนะนำ)' },
        { value: '900',  label: 'ทุก 15 นาที' },
        { value: '1800', label: 'ทุก 30 นาที' }
      ] }
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

/** ค่าที่เก็บจริงของตัวเลือกหนึ่งอัน (รองรับทั้งแบบข้อความล้วนและแบบมีป้ายกำกับ) */
function optionValue_(o) {
  return (o && typeof o === 'object') ? String(o.value) : String(o);
}

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
          options: it.options ? it.options.map(function (o) {
            return (o && typeof o === 'object')
              ? { value: String(o.value), label: String(o.label) }
              : { value: String(o), label: String(o) };
          }) : null,
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
    if (spec.type === 'select' && spec.options &&
        spec.options.map(optionValue_).indexOf(v) < 0) {
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

    // ชีตเดิมเขียนรวมบรรทัดเดียวว่า "1.ยาแนว 2.เก็บสีห้อง" — เก็บเป็นเช็คลิสต์เลย
    // งานเก่าทั้งหมดซ่อมจบไปแล้ว จึงติ๊กครบทุกข้อ
    var todo = parseTodo_(items);
    todo.forEach(function (t) { t.done = true; });

    return {
      id: uid_('FIX'), room: room, year: year,
      reportDate: '', bookDate: date, repairDate: date,
      category: guessRepairCategory_(items),
      // ชีตเดิมบางแถวไม่ได้ระบุรายการ — ปล่อยว่างไว้ ไม่ใส่ข้อความแทน
      // ไม่งั้นข้อความนั้นจะกลายเป็นงานค้างหนึ่งข้อในเช็คลิสต์
      items: todo.length ? formatTodo_(todo) : '',
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
  obj.date = cleanDate_(obj.date, 'วันที่', true);
  var d = toDate_(obj.date);
  obj.year = d.getFullYear();
  obj.month = d.getMonth() + 1;
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
  if (from < 5) done.push(migrateV5RefreshRate_());
  if (from < 7) done.push(migrateV7RepairTodo_());

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
 * รุ่น 7 — เปลี่ยนรายการที่ต้องซ่อมให้เป็นเช็คลิสต์ติ๊กได้
 *
 * ของเดิมเขียนรวมบรรทัดเดียวว่า "1.ยาแนว 2.เก็บสีห้อง 3.ทาสี"
 * แปลงเป็นบรรทัดละงาน พร้อมช่องติ๊ก
 *   [ ] ยาแนว
 *   [ ] เก็บสีห้อง
 *   [ ] ทาสี
 *
 * งานที่ปิดไปแล้ว (เสร็จสิ้น) ติ๊กให้ครบทุกข้อ เพราะซ่อมจบไปแล้วจริง
 * ส่วนประเภทงานของแต่ละข้อ ปล่อยว่างไว้ให้เจ้าของหอมาเลือกเองทีหลัง
 * เพราะเดาแทนไม่ได้ว่าข้อไหนเป็นงานประเภทใด
 */
function migrateV7RepairTodo_() {
  var name = SHEETS.ROOM_REPAIRS;
  var old = readByHeader_(name);
  if (!old) return name + ': ไม่มีชีต ข้ามไป';

  var changed = 0;
  var rows = old.rows.map(function (r) {
    var text = String(r['รายการที่ต้องซ่อมแซม'] || '');

    // แถวที่ชีตเดิมไม่ได้ระบุรายการ เคยเติมข้อความแทนไว้
    // ถ้าปล่อยไว้มันจะกลายเป็นงานหนึ่งข้อในเช็คลิสต์ จึงล้างให้ว่าง
    if (text.trim() === '(ไม่ได้ระบุรายการ)') { text = ''; changed++; }

    var todo = parseTodo_(text);

    if (todo.length) {
      if (String(r['สถานะ'] || '') === 'เสร็จสิ้น') {
        todo.forEach(function (t) { t.done = true; });
      }
      var formatted = formatTodo_(todo);
      if (formatted !== text) changed++;
      r['รายการที่ต้องซ่อมแซม'] = formatted;
    } else {
      r['รายการที่ต้องซ่อมแซม'] = text;
    }

    var out = {};
    SCHEMA[name].forEach(function (c) { out[c.key] = r[c.label]; });
    return out;
  });

  rewriteSheet_(name, rows);
  applyFormatting_(name);
  return 'งานซ่อมห้อง: แปลงเป็นเช็คลิสต์ ' + changed + ' รายการ';
}

/**
 * รุ่น 5 — ยืดรอบตรวจข้อมูลใหม่ให้ห่างขึ้น
 *
 * ของเดิมตั้งไว้ 25 วินาที ซึ่งถี่เกินไปจนรบกวนตอนกรอกข้อมูล
 * ขยับเฉพาะเครื่องที่ยังใช้ค่าถี่ ๆ อยู่ ใครตั้งเป็น 0 (ปิด) ไว้เองก็ปล่อยตามนั้น
 */
function migrateV5RefreshRate_() {
  var cur = toNumber_(getSetting_('refresh_seconds', '300'));
  if (cur !== null && cur > 0 && cur < 60) {
    setSetting_('refresh_seconds', '300');
    return 'ตรวจข้อมูลใหม่: ' + cur + ' วินาที → 5 นาที';
  }
  return 'ตรวจข้อมูลใหม่: ใช้ค่าเดิม (' + cur + ' วินาที)';
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
  obj.payDate = cleanDate_(obj.payDate, 'วันที่ชำระ', true);
  obj.year = yearOf_(obj.payDate);
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
    p.bill = billOf_(p);
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

/* ------------------------------------------------------------------ */
/*  บิลเดียวหลายรายการ (ซื้อออนไลน์)                                    */
/* ------------------------------------------------------------------ */

/**
 * ซื้อออนไลน์ทีเดียวมักได้ของหลายอย่างจากร้านเดียว
 * จึงเก็บรายการย่อยไว้ในช่องเดียว บรรทัดละหนึ่งรายการ คั่นด้วย |
 *
 *   ชื่อสินค้า | จำนวน | หน่วย | ราคาต่อหน่วย
 *   ปั๊มน้ำ 750W | 1 | เครื่อง | 4250
 *   สายไฟ VAF 2x1.5 | 20 | เมตร | 17.5
 *
 * ตั้งใจเก็บเป็นข้อความ ไม่ใช่ JSON เพราะเจ้าของหอเปิดชีตแก้เองได้ด้วย
 * อ่านรู้เรื่องและพิมพ์แก้ในชีตได้ทันที
 *
 * ยอดรวมของบิล = ผลรวมรายการย่อย + ค่าส่ง − ส่วนลด
 * ซึ่งจะถูกเขียนลงช่อง "ราคารวม" ให้อัตโนมัติ รายงานทุกตัวจึงใช้ค่าเดิมได้เลย
 */
function parseLines_(text) {
  return String(text == null ? '' : text)
    .split(/\r?\n/)
    .map(function (raw) { return String(raw).trim(); })
    .filter(function (raw) { return raw.length > 0; })
    .map(function (raw) {
      var parts = raw.split('|').map(function (x) { return String(x).trim(); });
      var name = parts[0] || '';
      var qty = 1, unit = '', unitPrice = 0;

      if (parts.length >= 4) {
        qty = toNumber_(parts[1]);
        unit = parts[2] || '';
        unitPrice = toNumber_(parts[3]);
      } else if (parts.length === 3) {
        // ชื่อ | จำนวน | ราคาต่อหน่วย  (ไม่ได้ระบุหน่วย)
        qty = toNumber_(parts[1]);
        unitPrice = toNumber_(parts[2]);
      } else if (parts.length === 2) {
        // ชื่อ | ราคา  (ชิ้นเดียว)
        unitPrice = toNumber_(parts[1]);
      }

      if (qty === null || !isFinite(qty)) qty = 1;
      if (unitPrice === null || !isFinite(unitPrice)) unitPrice = 0;

      return {
        name: name,
        qty: qty,
        unit: unit,
        unitPrice: unitPrice,
        total: round2_(qty * unitPrice)
      };
    })
    .filter(function (l) { return l.name || l.total; });
}

/** เขียนกลับเป็นข้อความรูปแบบเดียวกันเสมอ เพื่อให้ชีตอ่านง่าย */
function formatLines_(list) {
  return (list || []).map(function (l) {
    return [
      String(l.name || '').replace(/\|/g, '/'),   // กัน | ในชื่อสินค้าไม่ให้ทำโครงสร้างพัง
      l.qty == null ? 1 : l.qty,
      String(l.unit || '').replace(/\|/g, '/'),
      l.unitPrice == null ? 0 : l.unitPrice
    ].join(' | ');
  }).join('\n');
}

function linesTotal_(list) {
  return round2_((list || []).reduce(function (a, l) { return a + (Number(l.total) || 0); }, 0));
}

/**
 * ยอดรวมของบิลหนึ่งใบ
 * @return {{lines:Array, itemsTotal:number, shipping:number, discount:number, grand:number, count:number}}
 */
function billOf_(p) {
  var lines = parseLines_(p.lines);
  var itemsTotal = linesTotal_(lines);
  var shipping = toNumber_(p.shipping) || 0;
  var discount = toNumber_(p.discount) || 0;
  return {
    lines: lines,
    count: lines.length,
    itemsTotal: itemsTotal,
    shipping: shipping,
    discount: discount,
    grand: round2_(itemsTotal + shipping - discount)
  };
}

function savePurchase_(obj) {
  obj.buyDate = cleanDate_(obj.buyDate, 'วันที่ซื้อ', true);
  obj.year = yearOf_(obj.buyDate);
  if (obj.buyDate && obj.warrantyMonths) {
    obj.warrantyEnd = toIsoDate_(addMonths_(obj.buyDate, obj.warrantyMonths));
  }

  // ถ้ากรอกรายการย่อยไว้ ให้ยอดรวมกับจำนวนคิดจากรายการย่อยเสมอ
  // จะได้ไม่มีทางที่ยอดรวมกับรายละเอียดในบิลไม่ตรงกัน
  var lines = parseLines_(obj.lines);
  if (lines.length) {
    obj.lines = formatLines_(lines);
    var bill = billOf_(obj);
    obj.price = bill.grand;
    obj.qty = lines.reduce(function (a, l) { return a + (Number(l.qty) || 0); }, 0);
    if (!String(obj.unit || '').trim()) obj.unit = 'รายการ';
    if (!String(obj.item || '').trim()) obj.item = summarizeLines_(lines);
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

/** ตั้งชื่อบิลให้อัตโนมัติจากรายการย่อย เช่น "ปั๊มน้ำ 750W และอีก 3 รายการ" */
function summarizeLines_(lines) {
  if (!lines.length) return '';
  var first = lines[0].name || 'สินค้า';
  return lines.length === 1 ? first : first + ' และอีก ' + (lines.length - 1) + ' รายการ';
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
  var roomList = roomsInPlay_(all);
  roomList.forEach(function (r) { byRoom[r] = []; });
  all.forEach(function (r) { byRoom[String(r.room)].push(r); });

  var rows = roomList.map(function (room) {
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
    r.todo = parseTodo_(r.items);
    r.progress = todoStats_(r.todo);
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
  var roomList = roomsInPlay_(scope);
  roomList.forEach(function (r) { byRoom[r] = []; });
  scope.forEach(function (r) { byRoom[String(r.room)].push(r); });

  var rooms = roomList.map(function (room) {
    var list = byRoom[room].sort(function (a, b) {
      return String(b.repairDate || b.bookDate || '').localeCompare(String(a.repairDate || a.bookDate || ''));
    });
    list.forEach(function (r) {
      r.beforeRefs = toFileRefs_(r.photosBefore);
      r.afterRefs = toFileRefs_(r.photosAfter);
      r.todo = parseTodo_(r.items);
      r.progress = todoStats_(r.todo);
    });

    var open = list.filter(function (r) { return r.status !== 'เสร็จสิ้น' && r.status !== 'ยกเลิก'; });
    return {
      room: room,
      floor: floorOf_(room),
      count: list.length,
      openCount: open.length,
      cost: round2_(sum_(list, function (r) { return r.cost; })),
      last: list.length ? (list[0].repairDate || list[0].bookDate || '') : '',
      records: list,
      // นับ "จุด" ที่ยังไม่ได้ทำ ไม่ใช่จำนวนใบงาน — ใบเดียวอาจเหลืออีกหลายจุด
      openTasks: sum_(open, function (r) { return r.progress.pending; })
    };
  });

  return {
    year: year || 'all',
    years: uniqueYears_(all, ['repairDate', 'bookDate', 'reportDate']),
    rooms: rooms,
    totalJobs: scope.length,
    openJobs: scope.filter(function (r) { return r.status !== 'เสร็จสิ้น' && r.status !== 'ยกเลิก'; }).length,
    totalCost: round2_(sum_(scope, function (r) { return r.cost; })),
    openTasks: sum_(rooms, function (r) { return r.openTasks; })
  };
}

/* ------------------------------------------------------------------ */
/*  เช็คลิสต์งานซ่อมในหนึ่งครั้ง                                        */
/* ------------------------------------------------------------------ */

/**
 * เข้าซ่อมห้องหนึ่งครั้ง มักซ่อมหลายจุดพร้อมกัน และแต่ละจุดคนละประเภทงาน
 * จึงเก็บเป็นเช็คลิสต์ บรรทัดละหนึ่งงาน
 *
 *   [x] ยาแนวห้องน้ำ | ระบบน้ำ/สุขภัณฑ์
 *   [ ] เก็บสีห้อง | สี/ผนัง/ฝ้า
 *   [ ] เปลี่ยนก๊อกน้ำล้างจาน | ระบบน้ำ/สุขภัณฑ์
 *
 * ใช้ [x] / [ ] เพราะอ่านออกทันทีว่าอันไหนเสร็จแล้ว
 * และเจ้าของหอเปิดชีตพิมพ์ x เองเพื่อติ๊กก็ได้
 *
 * ตัวอ่านยอมรับของเดิมด้วย ทั้งแบบ "1.ยาแนว 2.เก็บสีห้อง" และแบบบรรทัดเปล่า ๆ
 * ข้อมูลเก่าจึงกลายเป็นเช็คลิสต์ได้เองโดยไม่ต้องพิมพ์ใหม่
 */
function parseTodo_(text) {
  var raw = String(text == null ? '' : text);
  if (!raw.trim()) return [];

  var lines = raw.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);

  // ของเดิมเขียนรวมบรรทัดเดียวว่า "1.ยาแนว 2.เก็บสีห้อง 3.ทาสี" — แตกออกให้
  if (lines.length === 1 && /\d\s*[.)]/.test(lines[0]) && !/^\[/.test(lines[0])) {
    lines = lines[0].split(/\s*\d+\s*[.)]\s*/).map(function (x) { return x.trim(); }).filter(Boolean);
  }

  return lines.map(function (line) {
    var done = false;
    var m = line.match(/^\[\s*([xX✓])?\s*\]\s*(.*)$/);
    if (m) { done = !!m[1]; line = m[2]; }

    // ตัดเลขลำดับหน้าบรรทัดทิ้ง ("1. ยาแนว" -> "ยาแนว")
    line = line.replace(/^\d+\s*[.)]\s*/, '').trim();

    var parts = line.split('|');
    return {
      done: done,
      name: String(parts[0] || '').trim(),
      category: String(parts[1] || '').trim()
    };
  }).filter(function (t) { return t.name; });
}

/** เขียนกลับเป็นข้อความรูปแบบเดียวกันเสมอ เพื่อให้ชีตอ่านง่าย */
function formatTodo_(list) {
  return (list || [])
    .filter(function (t) { return String(t.name || '').trim(); })
    .map(function (t) {
      var name = String(t.name).replace(/\|/g, '/').trim();
      var cat = String(t.category || '').replace(/\|/g, '/').trim();
      return '[' + (t.done ? 'x' : ' ') + '] ' + name + (cat ? ' | ' + cat : '');
    }).join('\n');
}

/** ความคืบหน้าของเช็คลิสต์หนึ่งชุด */
function todoStats_(list) {
  var total = (list || []).length;
  var done = (list || []).filter(function (t) { return t.done; }).length;
  return {
    total: total,
    done: done,
    pending: total - done,
    percent: total ? round2_((done / total) * 100) : 0
  };
}

/**
 * ปรับสถานะงานให้ตามเช็คลิสต์
 *
 * @param {boolean=} fromToggle มาจากการติ๊กในเช็คลิสต์หรือเปล่า
 *
 * ตอนกดบันทึกในฟอร์ม (fromToggle = false) จะเดินหน้าอย่างเดียว ไม่ดึงถอยหลัง
 * เพราะผู้ใช้อาจตั้งสถานะเองไว้แล้ว เช่นเลือก "เสร็จสิ้น" ทั้งที่ยังไม่ได้ติ๊กทีละข้อ
 * ระบบไม่ควรไปเถียงกับสิ่งที่เขาเลือกเอง
 *
 * แต่ตอนติ๊กในเช็คลิสต์ (fromToggle = true) การติ๊กคือเจตนาโดยตรง
 * ติ๊กออกจากงานที่ปิดแล้ว จึงดึงกลับมาเป็น "กำลังซ่อม" ได้
 */
function statusFromTodo_(current, stats, fromToggle) {
  if (current === 'ยกเลิก') return current;              // ยกเลิกแล้วคือจบ
  if (!stats.total) return current;
  if (stats.done === stats.total) return 'เสร็จสิ้น';
  if (stats.done > 0 && (current === 'รอดำเนินการ' || current === 'นัดหมายแล้ว')) return 'กำลังซ่อม';
  if (fromToggle && current === 'เสร็จสิ้น' && stats.pending > 0) return 'กำลังซ่อม';
  return current;
}

function saveRoomRepair_(obj) {
  obj.year = yearOf_(obj.repairDate) || yearOf_(obj.bookDate) || yearOf_(obj.reportDate) || obj.year || new Date().getFullYear();
  obj.status = obj.status || (obj.repairDate ? 'เสร็จสิ้น' : (obj.bookDate ? 'นัดหมายแล้ว' : 'รอดำเนินการ'));
  obj.priority = obj.priority || 'ปกติ';

  // เช็คลิสต์เป็นตัวตั้ง — สถานะกับประเภทงานของทั้งใบตามความคืบหน้าของรายการย่อย
  var todo = parseTodo_(obj.items);
  if (todo.length) {
    obj.items = formatTodo_(todo);
    var stats = todoStats_(todo);
    obj.status = statusFromTodo_(obj.status, stats);
    // ประเภทงานของทั้งใบ ใช้ประเภทที่พบบ่อยที่สุดในเช็คลิสต์ ถ้ายังไม่ได้เลือกเอง
    if (!String(obj.category || '').trim()) obj.category = topCategory_(todo);
  }

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

/** ประเภทงานที่พบบ่อยที่สุดในเช็คลิสต์ ใช้เป็นประเภทของทั้งใบ */
function topCategory_(todo) {
  var count = {}, best = '', max = 0;
  (todo || []).forEach(function (t) {
    var c = String(t.category || '').trim();
    if (!c) return;
    count[c] = (count[c] || 0) + 1;
    if (count[c] > max) { max = count[c]; best = c; }
  });
  return best;
}

/**
 * ติ๊กงานทีละรายการจากหน้ารายการโดยไม่ต้องเปิดฟอร์ม
 * @param {{id:string, index:number, done:boolean}} p
 */
function toggleRepairItem_(p) {
  var found = findRow_(SHEETS.ROOM_REPAIRS, p && p.id);
  if (!found) throw new Error('ไม่พบงานซ่อม: ' + (p && p.id));

  var todo = parseTodo_(found.items);
  var i = Number(p.index);
  if (!(i >= 0 && i < todo.length)) throw new Error('ไม่พบรายการที่ ' + (i + 1) + ' ในงานนี้');

  todo[i].done = !!p.done;
  var stats = todoStats_(todo);

  var patch = {
    items: formatTodo_(todo),
    status: statusFromTodo_(found.status, stats, true),
    updatedAt: new Date()
  };
  logActivity_(p.done ? 'ติ๊กงานซ่อมเสร็จ' : 'ยกเลิกติ๊กงานซ่อม', found.id,
               found.room + ' · ' + todo[i].name);

  var saved = updateRow_(SHEETS.ROOM_REPAIRS, found._row, Object.assign({}, found, patch));
  saved.todo = todo;
  saved.progress = stats;
  return saved;
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
      // ส่งเช็คลิสต์ไปเป็นรายการ ไม่ใช่ข้อความดิบ ไม่งั้นในไทม์ไลน์จะเห็นเป็น "[x] ยาแนว [x] เก็บสี"
      return { date: r.repairDate || r.bookDate || r.reportDate, type: 'ซ่อมแซม', title: r.category || 'งานซ่อม',
               detail: '', todo: r.todo || [], progress: r.progress || null,
               status: r.status, cost: r.cost,
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

  var openRepairs = openRepairs_();
  var overdueRepairs = overdueRepairs_(openRepairs, today);

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

/** งานซ่อมที่ยังไม่ปิด (ทุกปี) */
function openRepairs_() {
  return listRoomRepairs_('all', 'all', 'all').filter(function (r) {
    return r.status !== 'เสร็จสิ้น' && r.status !== 'ยกเลิก';
  });
}

/** งานซ่อมที่ค้างเกินกำหนดที่ตั้งไว้ */
function overdueRepairs_(openList, today) {
  var overdueDays = Number(getSetting_('overdue_alert_days', 7)) || 7;
  return (openList || []).filter(function (r) {
    var ref = r.bookDate || r.reportDate;
    if (!ref) return false;
    var d = daysBetween_(ref, today);
    return d !== null && d > overdueDays;
  });
}

/**
 * ศูนย์แจ้งเตือน — ใช้กับตัวเลขบนเมนูและกล่องแจ้งเตือนบนแถบหัว
 *
 * ตั้งใจให้เบากว่า dashboard_() มาก เพราะหน้าเว็บเรียกบ่อย
 * (ตอนเปิดระบบ · หลังกดบันทึกทุกครั้ง · ทุกรอบตรวจข้อมูล)
 * จึงคิดเฉพาะสิ่งที่ต้องใช้จริง ไม่แตะยอดหนี้ ยอดซื้อ หรือกราฟรายเดือน
 *
 * @return {{counts:Object, total:number, items:Array}}
 */
function alertCenter_() {
  var today = todayIso_();
  var y = String(new Date().getFullYear());

  var open = openRepairs_();
  var overdue = overdueRepairs_(open, today);
  var ac = acMatrix_(y);
  var bld = buildingSummary_(y);

  var items = buildAlerts_(overdue, ac, bld, today);

  // ตัวเลขบนเมนู = "จำนวนงานที่ยังค้างอยู่" ของแต่ละโมดูล
  // ไม่ใช่จำนวนการแจ้งเตือน เพราะผู้ใช้อ่านว่า "ยังเหลืองานกี่ชิ้น"
  var counts = {
    repairs: open.length,
    ac: ac.roomsPending.length,
    building: bld.openCount || 0,
    purchases: expiringWarranties_().length
  };

  var byModule = {};
  items.forEach(function (a) { byModule[a.module] = (byModule[a.module] || 0) + 1; });

  return {
    counts: counts,
    alertsByModule: byModule,
    total: items.length,
    urgent: items.filter(function (a) { return a.level === 'danger'; }).length,
    items: items.slice(0, 40),
    at: nowStamp_()
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

  scan(readRows_(SHEETS.PURCHASES), 'purchases', 'รายการซื้อของ', ['item', 'lines', 'vendor', 'orderNo', 'note', 'category']);
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
  // รวมห้องที่โผล่ในข้อมูลแต่ยังไม่อยู่ในทะเบียนด้วย ไม่งั้นค่าใช้จ่ายของห้องนั้นหายไปเฉย ๆ
  // ส่วนรายการซื้อของที่ไม่ได้ระบุห้อง (ของส่วนกลาง) ไม่นับเข้าห้องไหน เหมือนเดิม
  var roomList = roomsInPlay_(repairs, ac, purchases.filter(function (p) { return p.room; }));
  roomList.forEach(function (r) {
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

  var rows = roomList.map(function (r) {
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
        refreshSeconds: Number(getSetting_('refresh_seconds', 300)),
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

  /** เบา — หน้าเว็บเรียกบ่อยเพื่ออัปเดตตัวเลขบนเมนูและกล่องแจ้งเตือน */
  'app.alerts': function () { return alertCenter_(); },
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
  'repair.toggle': function (p) { return toggleRepairItem_(p); },

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
  'c2Fucy1zZXJpZjsKICAtLWZvbnQtZGlzcGxheTonQmFpIEphbWp1cmVlJywnSUJNIFBsZXggU2FucyBUaGFpJywnTm90byBTYW5zIFRoYWknLHZhcigtLWZvbnQtdWkpOwogIC8qIOC4quC4teC4geC4o+C4suC4nyDigJQg4LiZ4LmJ4Liz4LmA4LiH4Li04LiZL+C4',
  'quC5ieC4oSDguYTguKHguYjguYPguIrguYjguYDguILguLXguKLguKcv4LmB4LiU4LiHIOC5gOC4nuC4o+C4suC4sOC5gOC4guC4teC4ouC4p+C4geC4seC4muC5geC4lOC4h+C4hOC4meC4leC4suC4muC4reC4lOC4quC4teC5gOC4guC4teC4ouC4py3guYHguJTg',
  'uIfguYHguKLguIHguYTguKHguYjguK3guK3guIEKICAgICAo4Lin4Lix4LiU4LmE4LiU4LmJIM6URSA0Ljkg4LiV4LmI4Liz4LiB4Lin4LmI4Liy4LmA4LiB4LiT4LiR4LmMIDYpIOC4quC5iOC4p+C4meC4hOC4ueC5iOC4meC4teC5ieC5hOC4lOC5iSAyNy42IOC4',
  'nOC5iOC4suC4meC4quC4muC4suC4ouC4l+C4seC5ieC4h+C5guC4q+C4oeC4lOC4quC4p+C5iOC4suC4h+C5geC4peC4sOC4oeC4t+C4lAogICAgIGMxID0g4LmA4LiH4Li04LiZ4LmA4LiC4LmJ4LiyL+C4geC4s+C5hOC4oyDCtyBjMiA9IOC5gOC4h+C4tOC4meC4',
  'reC4reC4gS/guILguLLguJTguJfguLjguJkgKi8KICAtLWMxOiMyYzVjYzU7IC0tYzI6I2IyNmEwMDsKICBjb2xvci1zY2hlbWU6bGlnaHQ7Cn0KQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTpkYXJrKXsKICA6cm9vdDpub3QoW2RhdGEtdGhlbWU9ImxpZ2h0',
  'Il0pewogICAgLS1iZzojMGMxMTFiOyAtLXN1cmZhY2U6IzE0MWIyODsgLS1zdXJmYWNlLTI6IzFhMjIzMTsKICAgIC0taW5rOiNlNmVjZjc7IC0taW5rLTI6I2JmYzlkYjsgLS1tdXRlZDojODc5NGFiOyAtLWZhaW50OiM2NzczOGM7CiAgICAtLWxpbmU6IzIzMmQz',
  'ZjsgLS1saW5lLTI6IzFjMjUzNDsKICAgIC0tbmF2OiMwODBjMTQ7IC0tbmF2LTI6IzE0MWMyYjsgLS1uYXYtaW5rOiM5NGEyYmQ7IC0tbmF2LXNlYzojNTk2NTdlOwogICAgLS1icmFuZDojNmY5YmZmOyAtLWJyYW5kLWluazojMGIxMDIwOyAtLWJyYW5kLXNvZnQ6',
  'IzE3MjQ0YTsgLS1icmFuZC0yOiM5ZGJhZmY7IC0tYnJhbmQtMjojOWRiYWZmOwogICAgLS1vazojMzVjOThhOyAtLW9rLXNvZnQ6IzBmMmEyMDsgLS1vay0yOiM2ZmRjYWM7IC0tb2stMjojNmZkY2FjOwogICAgLS13YXJuOiNlMGEzNDA7IC0td2Fybi1zb2Z0OiMy',
  'YzIxMTM7IC0td2Fybi0yOiNmMGM0Nzc7IC0td2Fybi0yOiNmMGM0Nzc7CiAgICAtLWRhbmdlcjojZjA3MTZiOyAtLWRhbmdlci1zb2Z0OiMyZTE4MTg7CiAgICAtLWluZm86IzRjYjZlYTsgLS1pbmZvLXNvZnQ6IzEwMjQyZjsKICAgIC0tYzE6IzViODdlODsgLS1j',
  'MjojYzA4NjJjOwogICAgLS1zaDowIDFweCAycHggcmdiYSgwLDAsMCwuNDUpOwogICAgLS1zaC1sZzowIDE2cHggNDBweCByZ2JhKDAsMCwwLC42Mik7CiAgICBjb2xvci1zY2hlbWU6ZGFyazsKICB9Cn0KOnJvb3RbZGF0YS10aGVtZT0iZGFyayJdewogIC0tYmc6',
  'IzBjMTExYjsgLS1zdXJmYWNlOiMxNDFiMjg7IC0tc3VyZmFjZS0yOiMxYTIyMzE7CiAgLS1pbms6I2U2ZWNmNzsgLS1pbmstMjojYmZjOWRiOyAtLW11dGVkOiM4Nzk0YWI7IC0tZmFpbnQ6IzY3NzM4YzsKICAtLWxpbmU6IzIzMmQzZjsgLS1saW5lLTI6IzFjMjUz',
  'NDsKICAtLW5hdjojMDgwYzE0OyAtLW5hdi0yOiMxNDFjMmI7IC0tbmF2LWluazojOTRhMmJkOyAtLW5hdi1zZWM6IzU5NjU3ZTsKICAtLWJyYW5kOiM2ZjliZmY7IC0tYnJhbmQtaW5rOiMwYjEwMjA7IC0tYnJhbmQtc29mdDojMTcyNDRhOyAtLWJyYW5kLTI6Izlk',
  'YmFmZjsKICAtLW9rOiMzNWM5OGE7IC0tb2stc29mdDojMGYyYTIwOyAtLW9rLTI6IzZmZGNhYzsKICAtLXdhcm46I2UwYTM0MDsgLS13YXJuLXNvZnQ6IzJjMjExMzsgLS13YXJuLTI6I2YwYzQ3NzsKICAtLWRhbmdlcjojZjA3MTZiOyAtLWRhbmdlci1zb2Z0OiMy',
  'ZTE4MTg7CiAgLS1pbmZvOiM0Y2I2ZWE7IC0taW5mby1zb2Z0OiMxMDI0MmY7CiAgLS1jMTojNWI4N2U4OyAtLWMyOiNjMDg2MmM7CiAgLS1zaDowIDFweCAycHggcmdiYSgwLDAsMCwuNDUpOwogIC0tc2gtbGc6MCAxNnB4IDQwcHggcmdiYSgwLDAsMCwuNjIpOwog',
  'IGNvbG9yLXNjaGVtZTpkYXJrOwp9Cgoqe2JveC1zaXppbmc6Ym9yZGVyLWJveH0KaHRtbCxib2R5e21hcmdpbjowO3BhZGRpbmc6MH0KYm9keXsKICBmb250LWZhbWlseTp2YXIoLS1mb250LXVpKTsKICBiYWNrZ3JvdW5kOnZhcigtLWJnKTsgY29sb3I6dmFyKC0t',
  'aW5rKTsgZm9udC1zaXplOjE0cHg7IGxpbmUtaGVpZ2h0OjEuNTU7CiAgLXdlYmtpdC1mb250LXNtb290aGluZzphbnRpYWxpYXNlZDsKfQppbWd7bWF4LXdpZHRoOjEwMCV9CltoaWRkZW5de2Rpc3BsYXk6bm9uZSFpbXBvcnRhbnR9Cjpmb2N1cy12aXNpYmxle291',
  'dGxpbmU6MnB4IHNvbGlkIHZhcigtLWJyYW5kKTtvdXRsaW5lLW9mZnNldDoycHg7Ym9yZGVyLXJhZGl1czo1cHh9CkBtZWRpYSAocHJlZmVycy1yZWR1Y2VkLW1vdGlvbjpyZWR1Y2UpewogICosKjo6YmVmb3JlLCo6OmFmdGVye2FuaW1hdGlvbi1kdXJhdGlvbjou',
  'MDFtcyFpbXBvcnRhbnQ7YW5pbWF0aW9uLWl0ZXJhdGlvbi1jb3VudDoxIWltcG9ydGFudDt0cmFuc2l0aW9uLWR1cmF0aW9uOi4wMW1zIWltcG9ydGFudH0KfQphe2NvbG9yOnZhcigtLWJyYW5kKTt0ZXh0LWRlY29yYXRpb246bm9uZX0KYnV0dG9uLGlucHV0LHNl',
  'bGVjdCx0ZXh0YXJlYXtmb250OmluaGVyaXQ7Y29sb3I6aW5oZXJpdH0KOjotd2Via2l0LXNjcm9sbGJhcnt3aWR0aDoxMHB4O2hlaWdodDoxMHB4fQo6Oi13ZWJraXQtc2Nyb2xsYmFyLXRodW1ie2JhY2tncm91bmQ6dmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czo4',
  'cHg7Ym9yZGVyOjNweCBzb2xpZCB2YXIoLS1iZyl9CgovKiA9PT09PT09PT09PT0gbGF5b3V0ID09PT09PT09PT09PSAqLwouYXBwe2Rpc3BsYXk6ZmxleDttaW4taGVpZ2h0OjEwMHZofQoubmF2ewogIHdpZHRoOnZhcigtLW5hdi13KTtmbGV4OjAgMCB2YXIoLS1u',
  'YXYtdyk7YmFja2dyb3VuZDp2YXIoLS1uYXYpO2NvbG9yOnZhcigtLW5hdi1pbmspOwogIGRpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47cG9zaXRpb246c3RpY2t5O3RvcDowO2hlaWdodDoxMDB2aDtvdmVyZmxvdy15OmF1dG87Cn0KLmJyYW5ke3Bh',
  'ZGRpbmc6MjBweCAxOHB4IDE2cHg7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgcmdiYSgyNTUsMjU1LDI1NSwuMDcpfQouYnJhbmQgYntkaXNwbGF5OmJsb2NrO2NvbG9yOiNmZmY7Zm9udC1zaXplOjE1LjVweDtsZXR0ZXItc3BhY2luZzouMXB4O2ZvbnQtZmFtaWx5',
  'OnZhcigtLWZvbnQtZGlzcGxheSk7Zm9udC13ZWlnaHQ6NjAwfQouYnJhbmQgc3Bhbntmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLW5hdi1zZWMpfQoubmF2LWxpc3R7cGFkZGluZzoxMHB4IDEwcHggMjBweDtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246',
  'Y29sdW1uO2dhcDoycHg7ZmxleDoxfQoubmF2LXNlY3tmb250LXNpemU6MTAuNXB4O2xldHRlci1zcGFjaW5nOi45cHg7dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlO2NvbG9yOnZhcigtLW5hdi1zZWMpO3BhZGRpbmc6MTRweCAxMHB4IDZweDtmb250LXdlaWdodDo2',
  'MDB9Ci5uYXYtaXRlbXsKICBkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMHB4O3BhZGRpbmc6OXB4IDExcHg7Ym9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTsKICBjdXJzb3I6cG9pbnRlcjtjb2xvcjp2YXIoLS1uYXYtaW5rKTtmb250LXNpemU6',
  'MTMuNXB4O2JvcmRlcjowO2JhY2tncm91bmQ6MDt3aWR0aDoxMDAlO3RleHQtYWxpZ246bGVmdDsKfQoubmF2LWl0ZW06aG92ZXJ7YmFja2dyb3VuZDp2YXIoLS1uYXYtMik7Y29sb3I6I2ZmZn0KLm5hdi1pdGVtLm9ue2JhY2tncm91bmQ6dmFyKC0tYnJhbmQpO2Nv',
  'bG9yOnZhcigtLWJyYW5kLWluayk7Zm9udC13ZWlnaHQ6NjAwfQoubmF2LWl0ZW0gLmlje3dpZHRoOjE4cHg7dGV4dC1hbGlnbjpjZW50ZXI7Zm9udC1zaXplOjE1cHh9Ci5uYXYtaXRlbSAuYmFkZ2V7bWFyZ2luLWxlZnQ6YXV0bztiYWNrZ3JvdW5kOnJnYmEoMjU1',
  'LDI1NSwyNTUsLjE0KTtib3JkZXItcmFkaXVzOjIwcHg7cGFkZGluZzoxcHggN3B4O2ZvbnQtc2l6ZToxMXB4fQoubmF2LWl0ZW0ub24gLmJhZGdle2JhY2tncm91bmQ6cmdiYSgyNTUsMjU1LDI1NSwuMjUpfQoubmF2LWZvb3R7cGFkZGluZzoxMnB4IDE2cHg7Ym9y',
  'ZGVyLXRvcDoxcHggc29saWQgcmdiYSgyNTUsMjU1LDI1NSwuMDcpO2ZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0tbmF2LXNlYyl9CgoubWFpbntmbGV4OjE7bWluLXdpZHRoOjA7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbn0KLnRvcHsKICBw',
  'b3NpdGlvbjpzdGlja3k7dG9wOjA7ei1pbmRleDozMDtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpO2JvcmRlci1ib3R0b206MXB4IHNvbGlkIHZhcigtLWxpbmUpOwogIHBhZGRpbmc6MTFweCAyMnB4O2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2Fw',
  'OjEycHg7ZmxleC13cmFwOndyYXA7Cn0KLnRvcCBoMXtmb250LXNpemU6MTcuNXB4O21hcmdpbjowO2ZvbnQtd2VpZ2h0OjYwMDtsZXR0ZXItc3BhY2luZzotLjFweDtmb250LWZhbWlseTp2YXIoLS1mb250LWRpc3BsYXkpO3RleHQtd3JhcDpiYWxhbmNlfQoudG9w',
  'IC5zdWJ7Zm9udC1zaXplOjEycHg7Y29sb3I6dmFyKC0tbXV0ZWQpO21hcmdpbi10b3A6MXB4fQoudG9wLXJpZ2h0e21hcmdpbi1sZWZ0OmF1dG87ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6OHB4O2ZsZXgtd3JhcDp3cmFwfQouY29udGVudHtw',
  'YWRkaW5nOjIwcHggMjJweCA2NHB4O21heC13aWR0aDoxMzIwcHg7d2lkdGg6MTAwJX0KCi5idXJnZXJ7ZGlzcGxheTpub25lO2JhY2tncm91bmQ6MDtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6dmFyKC0tci1zbSk7cGFkZGluZzo2',
  'cHggMTBweDtjdXJzb3I6cG9pbnRlcn0KCi8qIOC5geC4luC4muC4peC5iOC4suC4h+C4quC4s+C4q+C4o+C4seC4muC4oeC4t+C4reC4luC4t+C4rSDigJQg4Lib4Li44LmI4Lih4LiK4Li44LiU4LmA4LiU4Li14Lii4Lin4LiB4Lix4Lia4LmA4Lih4LiZ4Li54LiC',
  '4LmJ4Liy4LiHIOC5gOC4o+C4teC4ouC4gSBnbygpIOC4leC4seC4p+C5gOC4lOC4teC4ouC4p+C4geC4seC4mQogICDguYTguKHguYjguYPguIrguYjguKvguJnguYnguLLguIjguK3guITguJnguKXguLDguIrguLjguJQg4LiI4Lit4LiB4Lin4LmJ4Liy4LiH4LiL',
  '4LmI4Lit4LiZ4LmE4Lin4LmJIOC4iOC4reC5geC4hOC4muC4hOC5iOC4reC4ouC5guC4nOC4peC5iCAo4LiU4Li5IG1lZGlhIHF1ZXJ5IOC4l+C5ieC4suC4ouC5hOC4n+C4peC5jCkKICAg4Lib4Lij4Liw4LiB4Liy4Lio4LmE4Lin4LmJ4LiV4Lij4LiH4LiZ4Li1',
  '4LmJ4LmA4Lie4Lij4Liy4Liw4LiV4LmJ4Lit4LiH4Lih4Liy4LiB4LmI4Lit4LiZIG1lZGlhIHF1ZXJ5IOC5hOC4oeC5iOC4h+C4seC5ieC4mSBkaXNwbGF5Om5vbmUg4LiI4Liw4LiK4LiZ4LiwICovCi50YWJiYXJ7ZGlzcGxheTpub25lfQoKLyogPT09PT09PT09',
  'PT09IGNvbnRyb2xzID09PT09PT09PT09PSAqLwouc2VsLC5pbnAsLnRhewogIGJhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXItc20pOwogIHBhZGRpbmc6N3B4IDExcHg7Zm9u',
  'dC1zaXplOjEzLjVweDt3aWR0aDoxMDAlO291dGxpbmU6MDt0cmFuc2l0aW9uOmJvcmRlci1jb2xvciAuMTVzLGJveC1zaGFkb3cgLjE1czsKfQouc2VsOmZvY3VzLC5pbnA6Zm9jdXMsLnRhOmZvY3Vze2JvcmRlci1jb2xvcjp2YXIoLS1icmFuZCk7Ym94LXNoYWRv',
  'dzowIDAgMCAzcHggdmFyKC0tYnJhbmQtc29mdCl9Ci50YXttaW4taGVpZ2h0Ojc0cHg7cmVzaXplOnZlcnRpY2FsfQouc2Vse2N1cnNvcjpwb2ludGVyO3BhZGRpbmctcmlnaHQ6MjZweH0KLnctYXV0b3t3aWR0aDphdXRvfQouYnRuewogIGRpc3BsYXk6aW5saW5l',
  'LWZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo2cHg7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpOwogIGJvcmRlci1yYWRpdXM6dmFyKC0tci1zbSk7cGFkZGluZzo3cHggMTNweDtmb250LXNpemU6MTMuNXB4',
  'O2N1cnNvcjpwb2ludGVyO2ZvbnQtd2VpZ2h0OjUwMDsKICB0cmFuc2l0aW9uOmJhY2tncm91bmQgLjE1cyxib3JkZXItY29sb3IgLjE1cyx0cmFuc2Zvcm0gLjA1czt3aGl0ZS1zcGFjZTpub3dyYXA7Cn0KLmJ0bjpob3ZlcntiYWNrZ3JvdW5kOnZhcigtLXN1cmZh',
  'Y2UtMik7Ym9yZGVyLWNvbG9yOnZhcigtLWZhaW50KX0KLmJ0bjphY3RpdmV7dHJhbnNmb3JtOnRyYW5zbGF0ZVkoMXB4KX0KLmJ0bi5wcml7YmFja2dyb3VuZDp2YXIoLS1icmFuZCk7Ym9yZGVyLWNvbG9yOnZhcigtLWJyYW5kKTtjb2xvcjp2YXIoLS1icmFuZC1p',
  'bmspfQouYnRuLnByaTpob3ZlcntmaWx0ZXI6YnJpZ2h0bmVzcygxLjA3KX0KLmJ0bi5kZ3J7Y29sb3I6dmFyKC0tZGFuZ2VyKTtib3JkZXItY29sb3I6dmFyKC0tZGFuZ2VyKX0KLmJ0bi5kZ3I6aG92ZXJ7YmFja2dyb3VuZDp2YXIoLS1kYW5nZXItc29mdCl9Ci5i',
  'dG4uc217cGFkZGluZzo0cHggOXB4O2ZvbnQtc2l6ZToxMi41cHh9Ci5idG4uaWNvbntwYWRkaW5nOjVweCA4cHh9Ci5idG5bZGlzYWJsZWRde29wYWNpdHk6LjU7Y3Vyc29yOm5vdC1hbGxvd2VkfQoKLmNoaXBze2Rpc3BsYXk6ZmxleDtnYXA6NnB4O2ZsZXgtd3Jh',
  'cDp3cmFwfQouY2hpcHsKICBib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7Ym9yZGVyLXJhZGl1czo5OXB4O3BhZGRpbmc6NHB4IDEycHg7CiAgZm9udC1zaXplOjEyLjVweDtjdXJzb3I6cG9pbnRlcjtjb2xvcjp2',
  'YXIoLS1pbmstMik7Cn0KLmNoaXA6aG92ZXJ7Ym9yZGVyLWNvbG9yOnZhcigtLWJyYW5kKTtjb2xvcjp2YXIoLS1icmFuZCl9Ci5jaGlwLm9ue2JhY2tncm91bmQ6dmFyKC0tYnJhbmQpO2JvcmRlci1jb2xvcjp2YXIoLS1icmFuZCk7Y29sb3I6dmFyKC0tYnJhbmQt',
  'aW5rKTtmb250LXdlaWdodDo2MDB9CgovKiA9PT09PT09PT09PT0gY2FyZHMgPT09PT09PT09PT09ICovCi5jYXJke2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXIpO2JveC1z',
  'aGFkb3c6dmFyKC0tc2gpfQouY2FyZC1oe3BhZGRpbmc6MTRweCAxNnB4O2JvcmRlci1ib3R0b206MXB4IHNvbGlkIHZhcigtLWxpbmUtMik7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTBweDtmbGV4LXdyYXA6d3JhcH0KLmNhcmQtaCBoM3tt',
  'YXJnaW46MDtmb250LXNpemU6MTQuNXB4O2ZvbnQtd2VpZ2h0OjYwMDtmb250LWZhbWlseTp2YXIoLS1mb250LWRpc3BsYXkpO3RleHQtd3JhcDpiYWxhbmNlfQouY2FyZC1oIC5zcHttYXJnaW4tbGVmdDphdXRvO2Rpc3BsYXk6ZmxleDtnYXA6NnB4O2FsaWduLWl0',
  'ZW1zOmNlbnRlcjtmbGV4LXdyYXA6d3JhcH0KLmNhcmQtYntwYWRkaW5nOjE2cHh9Ci5jYXJkLWIuZmx1c2h7cGFkZGluZzowfQoKLmdyaWR7ZGlzcGxheTpncmlkO2dhcDoxNHB4fQouZzJ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCgyLG1pbm1heCgwLDFm',
  'cikpfQouZzN7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCgzLG1pbm1heCgwLDFmcikpfQouZzR7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCg0LG1pbm1heCgwLDFmcikpfQouZy1hdXRve2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoYXV0by1m',
  'aWxsLG1pbm1heCgyNDBweCwxZnIpKX0KCi8qIEtQSSAqLwoua3Bpe2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXIpO3BhZGRpbmc6MTRweCAxNnB4O2JveC1zaGFkb3c6dmFy',
  'KC0tc2gpfQoua3BpIC5sYmx7Zm9udC1zaXplOjEycHg7Y29sb3I6dmFyKC0tbXV0ZWQpO2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjZweH0KLmtwaSAudmFse2ZvbnQtc2l6ZToyM3B4O2ZvbnQtd2VpZ2h0OjYwMDtsZXR0ZXItc3BhY2luZzot',
  'LjRweDttYXJnaW4tdG9wOjVweDtmb250LWZhbWlseTp2YXIoLS1mb250LWRpc3BsYXkpO2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtc30KLmtwaSAuY2Fwe2ZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0tZmFpbnQpO21hcmdpbi10b3A6MnB4O2Zv',
  'bnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtc30KLmtwaS5hY2NlbnR7YmFja2dyb3VuZDp2YXIoLS1icmFuZC1zb2Z0KTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnR9Ci5rcGkuYWNjZW50IC5sYmx7Y29sb3I6dmFyKC0tYnJhbmQpfQoua3BpLmdvb2QgLnZh',
  'bHtjb2xvcjp2YXIoLS1vayl9IC5rcGkuYmFkIC52YWx7Y29sb3I6dmFyKC0tZGFuZ2VyKX0gLmtwaS53YXJuIC52YWx7Y29sb3I6dmFyKC0td2Fybil9CgovKiBwcm9ncmVzcyAqLwoucGJhcntoZWlnaHQ6MTBweDtib3JkZXItcmFkaXVzOjk5cHg7YmFja2dyb3Vu',
  'ZDp2YXIoLS1saW5lLTIpO292ZXJmbG93OmhpZGRlbjtwb3NpdGlvbjpyZWxhdGl2ZX0KLnBiYXI+aXtkaXNwbGF5OmJsb2NrO2hlaWdodDoxMDAlO2JvcmRlci1yYWRpdXM6OTlweDtiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCg5MGRlZyx2YXIoLS1icmFuZCks',
  'dmFyKC0tYnJhbmQtMikpO3RyYW5zaXRpb246d2lkdGggLjZzIGN1YmljLWJlemllciguNCwwLC4yLDEpfQoucGJhci5sZ3toZWlnaHQ6MTZweH0KLnBiYXIub2s+aXtiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCg5MGRlZyx2YXIoLS1vayksdmFyKC0tb2stMikp',
  'fQoucGJhci53YXJuPml7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoOTBkZWcsdmFyKC0td2FybiksdmFyKC0td2Fybi0yKSl9Ci5wbWV0YXtkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47Zm9udC1zaXplOjEycHg7Y29sb3I6dmFy',
  'KC0tbXV0ZWQpO21hcmdpbi10b3A6N3B4fQoucG1ldGEgYntjb2xvcjp2YXIoLS1pbmspO2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtc30KCi8qID09PT09PT09PT09PSB0YWJsZSA9PT09PT09PT09PT0gKi8KLnR3e292ZXJmbG93LXg6YXV0bzstd2Vi',
  'a2l0LW92ZXJmbG93LXNjcm9sbGluZzp0b3VjaH0KdGFibGUudHt3aWR0aDoxMDAlO2JvcmRlci1jb2xsYXBzZTpjb2xsYXBzZTtmb250LXNpemU6MTNweDttaW4td2lkdGg6NjQwcHh9CnRhYmxlLnQgdGh7CiAgdGV4dC1hbGlnbjpsZWZ0O3BhZGRpbmc6OXB4IDEy',
  'cHg7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpO2JvcmRlci1ib3R0b206MXB4IHNvbGlkIHZhcigtLWxpbmUpOwogIGZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtd2VpZ2h0OjYwMDtsZXR0ZXItc3BhY2luZzouM3B4O3RleHQtdHJh',
  'bnNmb3JtOnVwcGVyY2FzZTt3aGl0ZS1zcGFjZTpub3dyYXA7Cn0KdGFibGUudCB0ZHtwYWRkaW5nOjEwcHggMTJweDtib3JkZXItYm90dG9tOjFweCBzb2xpZCB2YXIoLS1saW5lLTIpO3ZlcnRpY2FsLWFsaWduOnRvcH0KdGFibGUudCB0cjpsYXN0LWNoaWxkIHRk',
  'e2JvcmRlci1ib3R0b206MH0KdGFibGUudCB0Ym9keSB0cjpob3ZlcntiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMil9Ci5udW17dGV4dC1hbGlnbjpyaWdodDtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7d2hpdGUtc3BhY2U6bm93cmFwfQoubm93',
  'cmFwe3doaXRlLXNwYWNlOm5vd3JhcH0KLnQtYWN0aW9uc3tkaXNwbGF5OmZsZXg7Z2FwOjRweDtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1lbmR9CgovKiA9PT09PT09PT09PT0gYmFkZ2VzID09PT09PT09PT09PSAqLwouYntkaXNwbGF5OmlubGluZS1mbGV4O2FsaWdu',
  'LWl0ZW1zOmNlbnRlcjtnYXA6NHB4O2JvcmRlci1yYWRpdXM6OTlweDtwYWRkaW5nOjJweCA5cHg7Zm9udC1zaXplOjExLjVweDtmb250LXdlaWdodDo2MDA7d2hpdGUtc3BhY2U6bm93cmFwfQouYi5va3tiYWNrZ3JvdW5kOnZhcigtLW9rLXNvZnQpO2NvbG9yOnZh',
  'cigtLW9rKX0KLmIud2FybntiYWNrZ3JvdW5kOnZhcigtLXdhcm4tc29mdCk7Y29sb3I6dmFyKC0td2Fybil9Ci5iLmRncntiYWNrZ3JvdW5kOnZhcigtLWRhbmdlci1zb2Z0KTtjb2xvcjp2YXIoLS1kYW5nZXIpfQouYi5pbmZve2JhY2tncm91bmQ6dmFyKC0taW5m',
  'by1zb2Z0KTtjb2xvcjp2YXIoLS1pbmZvKX0KLmIubXV0ZXtiYWNrZ3JvdW5kOnZhcigtLWxpbmUtMik7Y29sb3I6dmFyKC0tbXV0ZWQpfQoKLyogPT09PT09PT09PT09IHJvb20gZ3JpZCA9PT09PT09PT09PT0gKi8KLmZsb29yc3tkaXNwbGF5OmZsZXg7ZmxleC1k',
  'aXJlY3Rpb246Y29sdW1uO2dhcDoxMnB4fQouZmxvb3J7ZGlzcGxheTpmbGV4O2dhcDoxMnB4O2FsaWduLWl0ZW1zOmZsZXgtc3RhcnR9Ci5mbG9vci10YWd7CiAgZmxleDowIDAgNjJweDtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Ym9yZGVyOjFweCBzb2xp',
  'ZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXItc20pOwogIHBhZGRpbmc6OHB4O3RleHQtYWxpZ246Y2VudGVyO2ZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0tbXV0ZWQpOwp9Ci5mbG9vci10YWcgYntkaXNwbGF5OmJsb2NrO2ZvbnQtc2l6ZTox',
  'N3B4O2NvbG9yOnZhcigtLWluayl9Ci5yb29tc3tkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdChhdXRvLWZpbGwsbWlubWF4KDEyNnB4LDFmcikpO2dhcDo4cHg7ZmxleDoxfQoucm9vbXsKICBib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxp',
  'bmUpO2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7Ym9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTtwYWRkaW5nOjlweCAxMHB4OwogIGN1cnNvcjpwb2ludGVyO3RyYW5zaXRpb246dHJhbnNmb3JtIC4xcyxib3gtc2hhZG93IC4xNXMsYm9yZGVyLWNvbG9yIC4xNXM7',
  'cG9zaXRpb246cmVsYXRpdmU7b3ZlcmZsb3c6aGlkZGVuOwp9Ci5yb29tOmhvdmVye3RyYW5zZm9ybTp0cmFuc2xhdGVZKC0xcHgpO2JveC1zaGFkb3c6dmFyKC0tc2gtbGcpO2JvcmRlci1jb2xvcjp2YXIoLS1icmFuZCl9Ci5yb29tIC5ub3tmb250LXdlaWdodDo2',
  'MDA7Zm9udC1zaXplOjE1LjVweDtsZXR0ZXItc3BhY2luZzowO2ZvbnQtZmFtaWx5OnZhcigtLWZvbnQtZGlzcGxheSk7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zfQoucm9vbSAuc3R7Zm9udC1zaXplOjExcHg7Y29sb3I6dmFyKC0tbXV0ZWQpO21h',
  'cmdpbi10b3A6MnB4O2xpbmUtaGVpZ2h0OjEuM30KLnJvb20gLmRvdHtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6OXB4O3JpZ2h0OjlweDt3aWR0aDo4cHg7aGVpZ2h0OjhweDtib3JkZXItcmFkaXVzOjk5cHg7YmFja2dyb3VuZDp2YXIoLS1saW5lKX0KLnJvb20ucy1v',
  'ayAuZG90e2JhY2tncm91bmQ6dmFyKC0tb2spfSAucm9vbS5zLXdhcm4gLmRvdHtiYWNrZ3JvdW5kOnZhcigtLXdhcm4pfQoucm9vbS5zLWRnciAuZG90e2JhY2tncm91bmQ6dmFyKC0tZGFuZ2VyKX0gLnJvb20ucy1pbmZvIC5kb3R7YmFja2dyb3VuZDp2YXIoLS1p',
  'bmZvKX0KLnJvb20ucy1va3tib3JkZXItbGVmdDozcHggc29saWQgdmFyKC0tb2spfSAucm9vbS5zLXdhcm57Ym9yZGVyLWxlZnQ6M3B4IHNvbGlkIHZhcigtLXdhcm4pfQoucm9vbS5zLWRncntib3JkZXItbGVmdDozcHggc29saWQgdmFyKC0tZGFuZ2VyKX0gLnJv',
  'b20ucy1pbmZve2JvcmRlci1sZWZ0OjNweCBzb2xpZCB2YXIoLS1pbmZvKX0KCi8qID09PT09PT09PT09PSBhbGVydHMgLyBsaXN0ID09PT09PT09PT09PSAqLwouYWxpc3R7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbn0KLmFsaXtkaXNwbGF5OmZs',
  'ZXg7Z2FwOjExcHg7cGFkZGluZzoxMXB4IDE2cHg7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgdmFyKC0tbGluZS0yKTtjdXJzb3I6cG9pbnRlcn0KLmFsaTpsYXN0LWNoaWxke2JvcmRlci1ib3R0b206MH0KLmFsaTpob3ZlcntiYWNrZ3JvdW5kOnZhcigtLXN1cmZh',
  'Y2UtMil9Ci5hbGkgLmlje2ZvbnQtc2l6ZToxNnB4O2xpbmUtaGVpZ2h0OjEuM30KLmFsaSAudHR7Zm9udC13ZWlnaHQ6NjAwO2ZvbnQtc2l6ZToxM3B4fQouYWxpIC5kZHtmb250LXNpemU6MTJweDtjb2xvcjp2YXIoLS1tdXRlZCk7bWFyZ2luLXRvcDoxcHh9Ci5h',
  'bGkubC1kYW5nZXIgLnR0e2NvbG9yOnZhcigtLWRhbmdlcil9IC5hbGkubC13YXJuIC50dHtjb2xvcjp2YXIoLS13YXJuKX0KCi8qID09PT09PT09PT09PSBtZWRpYSAvIHRodW1icyA9PT09PT09PT09PT0gKi8KLnRodW1ic3tkaXNwbGF5OmZsZXg7Z2FwOjVweDtm',
  'bGV4LXdyYXA6d3JhcH0KLnRodW1iewogIHdpZHRoOjQ0cHg7aGVpZ2h0OjQ0cHg7Ym9yZGVyLXJhZGl1czo2cHg7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtvYmplY3QtZml0OmNvdmVyOwogIGJhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKTtjdXJzb3I6',
  'cG9pbnRlcjtkaXNwbGF5OmJsb2NrOwp9Ci50aHVtYi5iaWd7d2lkdGg6OTJweDtoZWlnaHQ6OTJweH0KLmZpbGUtZHJvcHsKICBib3JkZXI6MS41cHggZGFzaGVkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6dmFyKC0tci1zbSk7cGFkZGluZzoxNHB4O3RleHQt',
  'YWxpZ246Y2VudGVyOwogIGNvbG9yOnZhcigtLW11dGVkKTtmb250LXNpemU6MTIuNXB4O2N1cnNvcjpwb2ludGVyO2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKTsKfQouZmlsZS1kcm9wOmhvdmVye2JvcmRlci1jb2xvcjp2YXIoLS1icmFuZCk7Y29sb3I6dmFy',
  'KC0tYnJhbmQpfQoKLyogPT09PT09PT09PT09IG1vZGFsID09PT09PT09PT09PSAqLwoub3Z7cG9zaXRpb246Zml4ZWQ7aW5zZXQ6MDtiYWNrZ3JvdW5kOnJnYmEoMTYsMjQsNDAsLjU1KTtiYWNrZHJvcC1maWx0ZXI6Ymx1cigzcHgpO3otaW5kZXg6MTAwO2Rpc3Bs',
  'YXk6ZmxleDthbGlnbi1pdGVtczpmbGV4LXN0YXJ0O2p1c3RpZnktY29udGVudDpjZW50ZXI7cGFkZGluZzoyNHB4IDE2cHg7b3ZlcmZsb3cteTphdXRvfQoubW9kYWx7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlKTtib3JkZXItcmFkaXVzOjE0cHg7Ym94LXNoYWRv',
  'dzp2YXIoLS1zaC1sZyk7d2lkdGg6MTAwJTttYXgtd2lkdGg6NjYwcHg7bWFyZ2luOmF1dG8gMDthbmltYXRpb246cG9wIC4xNnMgZWFzZS1vdXR9Ci5tb2RhbC53aWRle21heC13aWR0aDo5NjBweH0KQGtleWZyYW1lcyBwb3B7ZnJvbXtvcGFjaXR5OjA7dHJhbnNm',
  'b3JtOnRyYW5zbGF0ZVkoLThweCkgc2NhbGUoLjk4NSl9dG97b3BhY2l0eToxO3RyYW5zZm9ybTpub25lfX0KLm1vZGFsLWh7cGFkZGluZzoxNnB4IDE4cHg7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgdmFyKC0tbGluZSk7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1z',
  'OmNlbnRlcjtnYXA6MTBweH0KLm1vZGFsLWggaDN7bWFyZ2luOjA7Zm9udC1zaXplOjE1LjVweDtmb250LXdlaWdodDo2MDA7Zm9udC1mYW1pbHk6dmFyKC0tZm9udC1kaXNwbGF5KX0KLm1vZGFsLWJ7cGFkZGluZzoxOHB4O21heC1oZWlnaHQ6bWluKDcwdmgsNzAw',
  'cHgpO292ZXJmbG93LXk6YXV0b30KLm1vZGFsLWZ7cGFkZGluZzoxNHB4IDE4cHg7Ym9yZGVyLXRvcDoxcHggc29saWQgdmFyKC0tbGluZSk7ZGlzcGxheTpmbGV4O2dhcDo4cHg7anVzdGlmeS1jb250ZW50OmZsZXgtZW5kO2ZsZXgtd3JhcDp3cmFwfQoueHttYXJn',
  'aW4tbGVmdDphdXRvO2JhY2tncm91bmQ6MDtib3JkZXI6MDtmb250LXNpemU6MjBweDtjb2xvcjp2YXIoLS1tdXRlZCk7Y3Vyc29yOnBvaW50ZXI7bGluZS1oZWlnaHQ6MTtwYWRkaW5nOjJweCA2cHg7Ym9yZGVyLXJhZGl1czo2cHh9Ci54OmhvdmVye2JhY2tncm91',
  'bmQ6dmFyKC0tbGluZS0yKTtjb2xvcjp2YXIoLS1pbmspfQoKLmZncmlke2Rpc3BsYXk6Z3JpZDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDIsbWlubWF4KDAsMWZyKSk7Z2FwOjEzcHh9Ci5me2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47',
  'Z2FwOjVweH0KLmYuZnVsbHtncmlkLWNvbHVtbjoxLy0xfQouZiBsYWJlbHtmb250LXNpemU6MTJweDtjb2xvcjp2YXIoLS1pbmstMik7Zm9udC13ZWlnaHQ6NjAwfQouZiAuaGludHtmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLWZhaW50KX0KCi8qID09PT09',
  'PT09PT09PSBtaXNjID09PT09PT09PT09PSAqLwouZW1wdHl7cGFkZGluZzo0MHB4IDIwcHg7dGV4dC1hbGlnbjpjZW50ZXI7Y29sb3I6dmFyKC0tbXV0ZWQpfQouZW1wdHkgLmJpZ3tmb250LXNpemU6MzRweDttYXJnaW4tYm90dG9tOjhweDtvcGFjaXR5Oi42fQou',
  'c3BpbntkaXNwbGF5OmlubGluZS1ibG9jazt3aWR0aDoxNXB4O2hlaWdodDoxNXB4O2JvcmRlcjoycHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXRvcC1jb2xvcjp2YXIoLS1icmFuZCk7Ym9yZGVyLXJhZGl1czo5OXB4O2FuaW1hdGlvbjpzcCAuN3MgbGluZWFy',
  'IGluZmluaXRlO3ZlcnRpY2FsLWFsaWduOi0ycHh9CkBrZXlmcmFtZXMgc3B7dG97dHJhbnNmb3JtOnJvdGF0ZSgzNjBkZWcpfX0KLnRvYXN0ewogIHBvc2l0aW9uOmZpeGVkO2xlZnQ6NTAlO2JvdHRvbToyNHB4O3RyYW5zZm9ybTp0cmFuc2xhdGVYKC01MCUpO3ot',
  'aW5kZXg6MjAwOwogIGJhY2tncm91bmQ6dmFyKC0tbmF2KTtjb2xvcjojZmZmO3BhZGRpbmc6MTBweCAxOHB4O2JvcmRlci1yYWRpdXM6OTlweDtmb250LXNpemU6MTNweDsKICBib3gtc2hhZG93OnZhcigtLXNoLWxnKTthbmltYXRpb246dXAgLjJzIGVhc2Utb3V0',
  'O21heC13aWR0aDo5MHZ3Owp9Ci50b2FzdC5lcnJ7YmFja2dyb3VuZDp2YXIoLS1kYW5nZXIpfQoudG9hc3Qub2t7YmFja2dyb3VuZDp2YXIoLS1vayl9CkBrZXlmcmFtZXMgdXB7ZnJvbXtvcGFjaXR5OjA7dHJhbnNmb3JtOnRyYW5zbGF0ZSgtNTAlLDEwcHgpfXRv',
  'e29wYWNpdHk6MTt0cmFuc2Zvcm06dHJhbnNsYXRlKC01MCUsMCl9fQoubXV0ZWR7Y29sb3I6dmFyKC0tbXV0ZWQpfSAuZmFpbnR7Y29sb3I6dmFyKC0tZmFpbnQpfQouZnMxMntmb250LXNpemU6MTJweH0gLmZzMTN7Zm9udC1zaXplOjEzcHh9Ci5tb25ve2ZvbnQt',
  'dmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtc30KLm10OHttYXJnaW4tdG9wOjhweH0gLm10MTJ7bWFyZ2luLXRvcDoxMnB4fSAubXQxNnttYXJnaW4tdG9wOjE2cHh9IC5tYjh7bWFyZ2luLWJvdHRvbTo4cHh9IC5tYjEye21hcmdpbi1ib3R0b206MTJweH0KLnJv',
  'd3tkaXNwbGF5OmZsZXg7Z2FwOjhweDthbGlnbi1pdGVtczpjZW50ZXI7ZmxleC13cmFwOndyYXB9Ci5zcHttYXJnaW4tbGVmdDphdXRvfQouaHJ7aGVpZ2h0OjFweDtiYWNrZ3JvdW5kOnZhcigtLWxpbmUtMik7bWFyZ2luOjE0cHggMH0KLmNsaXB7b3ZlcmZsb3c6',
  'aGlkZGVuO3RleHQtb3ZlcmZsb3c6ZWxsaXBzaXM7ZGlzcGxheTotd2Via2l0LWJveDstd2Via2l0LWxpbmUtY2xhbXA6Mjstd2Via2l0LWJveC1vcmllbnQ6dmVydGljYWx9CgovKiBiYXIgY2hhcnQgKi8KLmJhcnN7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9u',
  'OmNvbHVtbjtnYXA6OXB4fQouYmFyLXJvd3tkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOm1pbm1heCg5MHB4LDE1MHB4KSAxZnIgYXV0bztnYXA6MTBweDthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1zaXplOjEyLjVweH0KLmJhci10cmFja3toZWln',
  'aHQ6OHB4O2JhY2tncm91bmQ6dmFyKC0tbGluZS0yKTtib3JkZXItcmFkaXVzOjk5cHg7b3ZlcmZsb3c6aGlkZGVufQouYmFyLWZpbGx7aGVpZ2h0OjEwMCU7YmFja2dyb3VuZDp2YXIoLS1icmFuZCk7Ym9yZGVyLXJhZGl1czo5OXB4O3RyYW5zaXRpb246d2lkdGgg',
  'LjVzfQouYmFyLXJvdyAudntmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7Y29sb3I6dmFyKC0taW5rLTIpO2ZvbnQtd2VpZ2h0OjYwMDt3aGl0ZS1zcGFjZTpub3dyYXB9CgovKiB0aW1lbGluZSAqLwoudGx7cG9zaXRpb246cmVsYXRpdmU7cGFkZGlu',
  'Zy1sZWZ0OjIycHh9Ci50bDpiZWZvcmV7Y29udGVudDonJztwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0OjZweDt0b3A6NnB4O2JvdHRvbTo2cHg7d2lkdGg6MnB4O2JhY2tncm91bmQ6dmFyKC0tbGluZSl9Ci50bC1pe3Bvc2l0aW9uOnJlbGF0aXZlO3BhZGRpbmc6MCAw',
  'IDE2cHh9Ci50bC1pOmJlZm9yZXtjb250ZW50OicnO3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6LTIwcHg7dG9wOjVweDt3aWR0aDoxMHB4O2hlaWdodDoxMHB4O2JvcmRlci1yYWRpdXM6OTlweDtiYWNrZ3JvdW5kOnZhcigtLWJyYW5kKTtib3JkZXI6MnB4IHNvbGlk',
  'IHZhcigtLXN1cmZhY2UpfQoudGwtaSAuZHtmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLW11dGVkKX0KLnRsLWkgLnR7Zm9udC13ZWlnaHQ6NjAwO2ZvbnQtc2l6ZToxM3B4fQoKLyogPT09PT09PT09PT09IHJlc3BvbnNpdmUgPT09PT09PT09PT09ICovCkBt',
  'ZWRpYSAobWF4LXdpZHRoOjkwMHB4KXsKICAuZzR7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCgyLG1pbm1heCgwLDFmcikpfQogIC5nM3tncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDIsbWlubWF4KDAsMWZyKSl9Cn0KLyog4LmB4LiX4LmH4Lia4LmA',
  '4Lil4LmH4LiVL+C4q+C4meC5ieC4suC4leC5iOC4suC4h+C4ouC5iOC4rTog4LmA4Lih4LiZ4Li54LiC4LmJ4Liy4LiH4Lii4Lix4LiH4Lit4Lii4Li54LmIIOC4l+C4teC5iOC5gOC4q+C4peC4t+C4reC5g+C4q+C5ieC5geC4luC4muC4q+C4seC4p+C5gOC4peC4',
  'ouC5geC4hOC4mgogICDguJrguLXguJrguIrguYjguK3guIfguITguYnguJnguKvguLLguKXguIfguKvguJnguYjguK3guKLguIjguLDguYTguJTguYnguYTguKHguYjguJXguIHguJrguKPguKPguJfguLHguJTguIjguJnguYHguJbguJrguKvguLHguKfguKrguLng',
  'uIfguILguLbguYnguJnguK3guLXguIHguYDguJfguYjguLLguJXguLHguKcgKi8KQG1lZGlhIChtYXgtd2lkdGg6MTA0MHB4KXsKICAudG9wLXJpZ2h0ICNzZWFyY2hCb3h7d2lkdGg6MTMycHghaW1wb3J0YW50fQogIC50b3AtcmlnaHQgI3llYXJTZWx7bWF4LXdp',
  'ZHRoOjEzMnB4fQogIC8qIOC4leC4seC4p+C4muC4reC4geC4quC4luC4suC4meC4sOC5gOC4q+C4peC4t+C4reC5geC4leC5iOC5hOC4reC4hOC4reC4mSAo4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Lii4Lix4LiH4Lit4LmI4Liy4LiZ4LmE4LiU4LmJ4LiI4Liy4LiB',
  '4LiB4Liy4Lij4LiK4Li14LmJ4LiE4LmJ4Liy4LiHKQogICAgIOC4geC4juC5gOC4lOC4teC4ouC4p+C4geC4seC4muC4l+C4teC5iOC5g+C4iuC5ieC4muC4meC4oeC4t+C4reC4luC4t+C4reC4reC4ouC4ueC5iOC5geC4peC5ieC4pyDguYHguITguYjguILguKLg',
  'uLHguJrguYPguKvguYnguYDguKPguLTguYjguKHguYDguKPguYfguKfguILguLbguYnguJkgKi8KICAuc3luYy1waWxsIC5zeW5jLWxhYmVse2Rpc3BsYXk6bm9uZX0KICAuc3luYy1waWxse3BhZGRpbmc6M3B4IDhweH0KfQpAbWVkaWEgKG1heC13aWR0aDo3NjBw',
  'eCl7CiAgLm5hdnsKICAgIHBvc2l0aW9uOmZpeGVkO2xlZnQ6MDt0b3A6MDtib3R0b206MDt6LWluZGV4OjYwO3RyYW5zZm9ybTp0cmFuc2xhdGVYKC0xMDAlKTsKICAgIHRyYW5zaXRpb246dHJhbnNmb3JtIC4yMnMgZWFzZTtib3gtc2hhZG93OnZhcigtLXNoLWxn',
  'KTsKICB9CiAgLm5hdi5vcGVue3RyYW5zZm9ybTpub25lfQogIC5idXJnZXJ7ZGlzcGxheTppbmxpbmUtZmxleH0KICAuY29udGVudHtwYWRkaW5nOjE0cHggMTRweCA4MHB4fQogIC50b3B7cGFkZGluZzoxMHB4IDE0cHh9CiAgLmcyLC5nMywuZzR7Z3JpZC10ZW1w',
  'bGF0ZS1jb2x1bW5zOjFmcn0KICAuZmdyaWR7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOjFmcn0KICAuZmxvb3J7ZmxleC1kaXJlY3Rpb246Y29sdW1ufQogIC5mbG9vci10YWd7ZmxleDpub25lO3dpZHRoOjEwMCU7ZGlzcGxheTpmbGV4O2dhcDo4cHg7YWxpZ24taXRl',
  'bXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0O3RleHQtYWxpZ246bGVmdH0KICAuZmxvb3ItdGFnIGJ7Zm9udC1zaXplOjE0cHh9CiAgLnNjcmlte3Bvc2l0aW9uOmZpeGVkO2luc2V0OjA7YmFja2dyb3VuZDpyZ2JhKDAsMCwwLC40NSk7ei1pbmRl',
  'eDo1NX0KICAubW9kYWwtYnttYXgtaGVpZ2h0Om5vbmV9CiAgLm92e3BhZGRpbmc6MH0KICAubW9kYWx7Ym9yZGVyLXJhZGl1czowO21pbi1oZWlnaHQ6MTAwdmg7bWF4LXdpZHRoOm5vbmV9Cn0KLyogPT09PT09PT09PT09IOC4q+C4meC5ieC4suC4peC5h+C4reC4',
  'geC4reC4tOC4mSAvIFBJTiA9PT09PT09PT09PT0gKi8KYm9keS5sb2NrZWR7b3ZlcmZsb3c6aGlkZGVufQpib2R5LmxvY2tlZCAuYXBwe2ZpbHRlcjpibHVyKDNweCk7cG9pbnRlci1ldmVudHM6bm9uZTt1c2VyLXNlbGVjdDpub25lfQouYXV0aC13cmFwewogIHBv',
  'c2l0aW9uOmZpeGVkO2luc2V0OjA7ei1pbmRleDo2MDtkaXNwbGF5OmdyaWQ7cGxhY2UtaXRlbXM6Y2VudGVyOwogIHBhZGRpbmc6MjRweDtiYWNrZ3JvdW5kOnZhcigtLWJnKTtvdmVyZmxvdy15OmF1dG87Cn0KLmF1dGgtY2FyZHsKICB3aWR0aDoxMDAlO21heC13',
  'aWR0aDozNjBweDtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpO2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7CiAgYm9yZGVyLXJhZGl1czoxNnB4O2JveC1zaGFkb3c6dmFyKC0tc2gtbGcpO3BhZGRpbmc6MjZweCAyNHB4IDIycHg7Cn0KLmF1dGgtYnJhbmR7',
  'Zm9udC1zaXplOjE1cHg7Y29sb3I6dmFyKC0tbXV0ZWQpO21hcmdpbi1ib3R0b206MThweDt0ZXh0LWFsaWduOmNlbnRlcn0KLmF1dGgtYnJhbmQgYntjb2xvcjp2YXIoLS1pbmspO2ZvbnQtZmFtaWx5OnZhcigtLWZvbnQtZGlzcGxheSl9Ci5hdXRoLWh7bWFyZ2lu',
  'OjAgMCA0cHg7Zm9udC1zaXplOjIwcHg7Zm9udC13ZWlnaHQ6NjAwO2ZvbnQtZmFtaWx5OnZhcigtLWZvbnQtZGlzcGxheSk7dGV4dC1hbGlnbjpjZW50ZXJ9Ci5hdXRoLXN1YnttYXJnaW46MCAwIDE4cHg7Zm9udC1zaXplOjEzcHg7Y29sb3I6dmFyKC0tbXV0ZWQp',
  'O3RleHQtYWxpZ246Y2VudGVyO2xpbmUtaGVpZ2h0OjEuNn0KLmF1dGgtZnttYXJnaW4tYm90dG9tOjEzcHh9Ci5hdXRoLWYgbGFiZWx7ZGlzcGxheTpibG9jaztmb250LXNpemU6MTIuNXB4O2NvbG9yOnZhcigtLWluay0yKTttYXJnaW4tYm90dG9tOjVweDtmb250',
  'LXdlaWdodDo1MDB9Ci5hdXRoLWYgLmlucHt3aWR0aDoxMDAlO3BhZGRpbmc6MTBweCAxMnB4O2ZvbnQtc2l6ZToxNXB4fQouYXV0aC1nb3t3aWR0aDoxMDAlO2p1c3RpZnktY29udGVudDpjZW50ZXI7cGFkZGluZzoxMXB4O2ZvbnQtc2l6ZToxNC41cHg7bWFyZ2lu',
  'LXRvcDo2cHh9Ci5hdXRoLWFsdHt3aWR0aDoxMDAlO2p1c3RpZnktY29udGVudDpjZW50ZXI7bWFyZ2luLXRvcDo5cHg7Zm9udC1zaXplOjEzcHh9Ci5hdXRoLWVycnsKICBiYWNrZ3JvdW5kOnZhcigtLWRhbmdlci1zb2Z0KTtjb2xvcjp2YXIoLS1kYW5nZXIpO2Jv',
  'cmRlci1yYWRpdXM6dmFyKC0tci1zbSk7CiAgcGFkZGluZzo5cHggMTJweDtmb250LXNpemU6MTIuNXB4O21hcmdpbi1ib3R0b206MTRweDtsaW5lLWhlaWdodDoxLjU1Owp9Ci5hdXRoLWZvb3R7Zm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1mYWludCk7dGV4',
  'dC1hbGlnbjpjZW50ZXI7bWFyZ2luOjE2cHggMCAwO2xpbmUtaGVpZ2h0OjEuNn0KCi8qIOC4iOC4uOC4lCA2IOC4iOC4uOC4lOC5geC4l+C4mSBQSU4g4LiX4Li14LmI4LiB4LiU4LmE4Lib4LmB4Lil4LmJ4LinICovCi5waW4tZG90c3tkaXNwbGF5OmZsZXg7Z2Fw',
  'OjEzcHg7anVzdGlmeS1jb250ZW50OmNlbnRlcjttYXJnaW46NnB4IDAgMjJweH0KLnBpbi1kb3RzIGl7CiAgd2lkdGg6MTNweDtoZWlnaHQ6MTNweDtib3JkZXItcmFkaXVzOjk5cHg7YmFja2dyb3VuZDp2YXIoLS1saW5lKTsKICBib3JkZXI6MXB4IHNvbGlkIHZh',
  'cigtLWxpbmUpO3RyYW5zaXRpb246dHJhbnNmb3JtIC4xMnMsYmFja2dyb3VuZCAuMTJzOwp9Ci5waW4tZG90cyBpLm9ue2JhY2tncm91bmQ6dmFyKC0tYnJhbmQpO2JvcmRlci1jb2xvcjp2YXIoLS1icmFuZCk7dHJhbnNmb3JtOnNjYWxlKDEuMTYpfQoucGluLWRv',
  'dHMuYnVzeXtvcGFjaXR5Oi41fQoucGluLWRvdHMuc2hha2V7YW5pbWF0aW9uOnNoYWtlIC40MnN9CkBrZXlmcmFtZXMgc2hha2V7CiAgMCUsMTAwJXt0cmFuc2Zvcm06dHJhbnNsYXRlWCgwKX0gMjAle3RyYW5zZm9ybTp0cmFuc2xhdGVYKC04cHgpfQogIDQwJXt0',
  'cmFuc2Zvcm06dHJhbnNsYXRlWCg4cHgpfSA2MCV7dHJhbnNmb3JtOnRyYW5zbGF0ZVgoLTVweCl9IDgwJXt0cmFuc2Zvcm06dHJhbnNsYXRlWCg1cHgpfQp9Ci5waW4tcGFke2Rpc3BsYXk6Z3JpZDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDMsMWZyKTtn',
  'YXA6MTFweH0KLnBpbi1rewogIGFzcGVjdC1yYXRpbzoxLzE7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Y29sb3I6dmFyKC0taW5rKTsKICBib3JkZXItcmFkaXVzOjE0cHg7Zm9udC1zaXplOjIxcHg7Zm9u',
  'dC13ZWlnaHQ6NTAwO2N1cnNvcjpwb2ludGVyOwogIGZvbnQtZmFtaWx5OnZhcigtLWZvbnQtZGlzcGxheSk7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zOwogIHRyYW5zaXRpb246YmFja2dyb3VuZCAuMXMsdHJhbnNmb3JtIC4wNnM7Cn0KLnBpbi1r',
  'OmhvdmVye2JhY2tncm91bmQ6dmFyKC0tYnJhbmQtc29mdCk7Ym9yZGVyLWNvbG9yOnZhcigtLWJyYW5kKX0KLnBpbi1rOmFjdGl2ZXt0cmFuc2Zvcm06c2NhbGUoLjk0KX0KLnBpbi1rLmdob3N0e2JhY2tncm91bmQ6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOnRy',
  'YW5zcGFyZW50O2ZvbnQtc2l6ZToxN3B4O2NvbG9yOnZhcigtLW11dGVkKX0KLnBpbi1rLmdob3N0OmhvdmVye2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKTtib3JkZXItY29sb3I6dmFyKC0tbGluZSl9CgovKiA9PT09PT09PT09PT0g4LiV4Lix4Lin4LmA4Lil',
  '4Li34Lit4LiB4LiY4Li14LihID09PT09PT09PT09PSAqLwoudGhlbWUtcGlja3tkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCgzLG1pbm1heCgwLDFmcikpO2dhcDoxMHB4fQoudGhlbWUtb3B0ewogIGRpc3BsYXk6ZmxleDtmbGV4LWRp',
  'cmVjdGlvbjpjb2x1bW47YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo0cHg7dGV4dC1hbGlnbjpjZW50ZXI7CiAgcGFkZGluZzoxNXB4IDEwcHg7Ym9yZGVyOjEuNXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6dmFyKC0tcik7CiAgYmFja2dyb3VuZDp2',
  'YXIoLS1zdXJmYWNlLTIpO2N1cnNvcjpwb2ludGVyO2NvbG9yOnZhcigtLWluayk7Zm9udDppbmhlcml0OwogIHRyYW5zaXRpb246Ym9yZGVyLWNvbG9yIC4xMnMsYmFja2dyb3VuZCAuMTJzOwp9Ci50aGVtZS1vcHQ6aG92ZXJ7Ym9yZGVyLWNvbG9yOnZhcigtLWJy',
  'YW5kKX0KLnRoZW1lLW9wdC5vbntib3JkZXItY29sb3I6dmFyKC0tYnJhbmQpO2JhY2tncm91bmQ6dmFyKC0tYnJhbmQtc29mdCl9Ci50aGVtZS1vcHQgLmlje2ZvbnQtc2l6ZToyNHB4O2xpbmUtaGVpZ2h0OjEuMn0KLnRoZW1lLW9wdCBie2ZvbnQtc2l6ZToxMy41',
  'cHh9Ci50aGVtZS1vcHQgLmhpbnR7Zm9udC1zaXplOjExcHg7Y29sb3I6dmFyKC0tbXV0ZWQpO2xpbmUtaGVpZ2h0OjEuNDV9Ci53YXJuLXRleHR7Y29sb3I6dmFyKC0td2Fybil9CgovKiA9PT09PT09PT09PT0g4Lic4Lil4LiB4Liy4Lij4Lit4LmI4Liy4LiZ4LiC',
  '4LmJ4Lit4LiE4Lin4Liy4Lih4LiI4Liy4LiB4Lij4Li54LibID09PT09PT09PT09PSAqLwovKiDguYTguK7guYTguKXguJXguYzguKrguLHguYnguJkg4LmGIOC5g+C4q+C5ieC5gOC4q+C5h+C4meC4p+C5iOC4suC4iuC5iOC4reC4h+C5hOC4q+C4meC5gOC4nuC4',
  'tOC5iOC4h+C4luC4ueC4geC5gOC4leC4tOC4oeC4iOC4suC4geC4o+C4ueC4myAqLwoub2NyLWZpbGxlZHsKICBib3JkZXItY29sb3I6dmFyKC0tYnJhbmQpIWltcG9ydGFudDsKICBib3gtc2hhZG93OjAgMCAwIDNweCB2YXIoLS1icmFuZC1zb2Z0KSFpbXBvcnRh',
  'bnQ7CiAgYW5pbWF0aW9uOm9jclBvcCAuNHM7Cn0KQGtleWZyYW1lcyBvY3JQb3B7IDAle2JhY2tncm91bmQ6dmFyKC0tYnJhbmQtc29mdCl9IDEwMCV7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlKX0gfQoKLm9jci1ib3h7CiAgYm9yZGVyOjFweCBkYXNoZWQgdmFy',
  'KC0tYnJhbmQpO2JhY2tncm91bmQ6dmFyKC0tYnJhbmQtc29mdCk7CiAgYm9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTtwYWRkaW5nOjEycHg7bWFyZ2luLXRvcDoxMHB4Owp9Ci5vY3ItYm94IC5oZHtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo3',
  'cHg7Zm9udC1zaXplOjEyLjVweDtmb250LXdlaWdodDo2MDA7Y29sb3I6dmFyKC0tYnJhbmQpO21hcmdpbi1ib3R0b206OXB4fQoub2NyLWJveCAuaGQgLnNwe21hcmdpbi1sZWZ0OmF1dG87ZGlzcGxheTpmbGV4O2dhcDo2cHh9Ci5vY3ItaGl0c3tkaXNwbGF5OmZs',
  'ZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2dhcDo2cHh9Ci5vY3ItaGl0ewogIGRpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjlweDtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpOwogIGJvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVy',
  'LXJhZGl1czp2YXIoLS1yLXNtKTtwYWRkaW5nOjdweCAxMHB4O2ZvbnQtc2l6ZToxM3B4Owp9Ci5vY3ItaGl0IC5re2NvbG9yOnZhcigtLW11dGVkKTtmb250LXNpemU6MTEuNXB4O21pbi13aWR0aDo3OHB4fQoub2NyLWhpdCAudntmb250LXdlaWdodDo2MDA7Zmxl',
  'eDoxO21pbi13aWR0aDowO292ZXJmbG93OmhpZGRlbjt0ZXh0LW92ZXJmbG93OmVsbGlwc2lzO3doaXRlLXNwYWNlOm5vd3JhcH0KLm9jci1yYXd7CiAgbWF4LWhlaWdodDoxNTBweDtvdmVyZmxvdzphdXRvO2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7Ym9yZGVy',
  'OjFweCBzb2xpZCB2YXIoLS1saW5lKTsKICBib3JkZXItcmFkaXVzOnZhcigtLXItc20pO3BhZGRpbmc6OXB4IDExcHg7Zm9udC1zaXplOjEycHg7bGluZS1oZWlnaHQ6MS42NTsKICB3aGl0ZS1zcGFjZTpwcmUtd3JhcDtjb2xvcjp2YXIoLS1pbmstMik7bWFyZ2lu',
  'LXRvcDo5cHg7Cn0KCkBtZWRpYSAobWF4LXdpZHRoOjUyMHB4KXsKICAuYXV0aC1jYXJke21heC13aWR0aDoxMDAlO3BhZGRpbmc6MjJweCAxOHB4IDE4cHh9CiAgLnRoZW1lLXBpY2t7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOjFmcn0KICAudGhlbWUtb3B0e2ZsZXgt',
  'ZGlyZWN0aW9uOnJvdzt0ZXh0LWFsaWduOmxlZnQ7Z2FwOjExcHh9CiAgLnRoZW1lLW9wdCAuaGludHtkaXNwbGF5Om5vbmV9Cn0KCi8qID09PT09PT09PT09PSDguKPguLLguKLguIHguLLguKPguKLguYjguK3guKLguYPguJnguJrguLTguKUgKOC4i+C4t+C5ieC4',
  'reC4l+C4teC5gOC4lOC4teC4ouC4p+C4q+C4peC4suC4ouC4reC4ouC5iOC4suC4hykgPT09PT09PT09PT09ICovCi5saW5lc3tib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6dmFyKC0tci1zbSk7cGFkZGluZzoxMHB4O2JhY2tncm91',
  'bmQ6dmFyKC0tc3VyZmFjZS0yKX0KLmxpbmUtaGVhZCwubGluZS1yb3d7CiAgZGlzcGxheTpncmlkO2dyaWQtdGVtcGxhdGUtY29sdW1uczptaW5tYXgoMCwxZnIpIDg0cHggOTJweCAxMDhweCA5NnB4IDM0cHg7CiAgZ2FwOjdweDthbGlnbi1pdGVtczpjZW50ZXI7',
  'Cn0KLmxpbmUtaGVhZHtmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLW11dGVkKTtwYWRkaW5nOjAgMnB4IDZweDtmb250LXdlaWdodDo2MDB9Ci5saW5lLWhlYWQgLm51bSwubGluZS1yb3cgLm51bXt0ZXh0LWFsaWduOnJpZ2h0fQoubGluZS1yb3d7bWFyZ2lu',
  'LWJvdHRvbTo2cHh9Ci5saW5lLXJvdyAuaW5we3BhZGRpbmc6NnB4IDlweDtmb250LXNpemU6MTNweH0KLmxpbmUtcm93IC5pbnAubnVte3RleHQtYWxpZ246cmlnaHQ7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zfQoubGluZS1zdW17CiAgdGV4dC1h',
  'bGlnbjpyaWdodDtmb250LXNpemU6MTNweDtmb250LXdlaWdodDo2MDA7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zOwogIGNvbG9yOnZhcigtLWluayk7d2hpdGUtc3BhY2U6bm93cmFwO292ZXJmbG93OmhpZGRlbjsKfQoubGluZS10b3RhbHttYXJn',
  'aW4tbGVmdDphdXRvO2ZvbnQtc2l6ZToxM3B4O2NvbG9yOnZhcigtLW11dGVkKTtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXN9Ci5saW5lLXRvdGFsIGJ7Y29sb3I6dmFyKC0taW5rKX0KCi8qIOC4o+C4suC4ouC4geC4suC4o+C4ouC5iOC4reC4ouC4',
  'l+C4teC5iOC4geC4suC4h+C4lOC4ueC5g+C4meC4leC4suC4o+C4suC4hyAqLwouYmlsbC1saW5lc3ttYXJnaW4tdG9wOjZweDtib3JkZXItbGVmdDoycHggc29saWQgdmFyKC0tbGluZSk7cGFkZGluZy1sZWZ0OjlweH0KLmJpbGwtbGluZXsKICBkaXNwbGF5OmZs',
  'ZXg7Z2FwOjhweDtmb250LXNpemU6MTJweDtjb2xvcjp2YXIoLS1pbmstMik7cGFkZGluZzoxcHggMDsKICBmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7Cn0KLmJpbGwtbGluZSAubm17ZmxleDoxO21pbi13aWR0aDowO292ZXJmbG93OmhpZGRlbjt0',
  'ZXh0LW92ZXJmbG93OmVsbGlwc2lzO3doaXRlLXNwYWNlOm5vd3JhcH0KLmJpbGwtbGluZSAucXR7Y29sb3I6dmFyKC0tZmFpbnQpO3doaXRlLXNwYWNlOm5vd3JhcH0KLmJpbGwtbGluZSAudHR7d2hpdGUtc3BhY2U6bm93cmFwO2ZvbnQtd2VpZ2h0OjYwMH0KLmJp',
  'bGwtZXh0cmF7Zm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1tdXRlZCk7bWFyZ2luLXRvcDozcHh9Ci5iaWxsLXRvZ2dsZXsKICBiYWNrZ3JvdW5kOjA7Ym9yZGVyOjA7cGFkZGluZzowO21hcmdpbi10b3A6M3B4O2N1cnNvcjpwb2ludGVyO2ZvbnQ6aW5oZXJp',
  'dDsKICBmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLWJyYW5kKTt0ZXh0LWFsaWduOmxlZnQ7Cn0KLmJpbGwtdG9nZ2xlOmhvdmVye3RleHQtZGVjb3JhdGlvbjp1bmRlcmxpbmV9CgpAbWVkaWEgKG1heC13aWR0aDo2NDBweCl7CiAgLyog4LiI4Lit4LmB4LiE',
  '4LiaOiDguIrguLfguYjguK3guKrguLTguJnguITguYnguLLguK3guKLguLnguYjguJrguKPguKPguJfguLHguJTguJrguJkg4Liq4LmI4Lin4LiZ4LiI4Liz4LiZ4Lin4LiZL+C4q+C4meC5iOC4p+C4oi/guKPguLLguITguLIv4Lij4Lin4LihIOC4reC4ouC4ueC5',
  'iOC4muC4o+C4o+C4l+C4seC4lOC5gOC4lOC4teC4ouC4p+C4geC4seC4meC4guC5ieC4suC4h+C4peC5iOC4suC4hwogICAgIOC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC4geC4tOC4meC4nuC4t+C5ieC4meC4l+C4teC5iOC5geC4meC4p+C4leC4seC5ieC4h+C4',
  'iOC4meC4leC5ieC4reC4h+C5gOC4peC4t+C5iOC4reC4meC4iOC4reC4ouC4suC4p+C5gOC4p+C4peC4suC4i+C4t+C5ieC4reC4guC4reC4h+C4q+C4peC4suC4ouC4reC4ouC5iOC4suC4hyAqLwogIC5saW5lc3twYWRkaW5nOjhweH0KICAubGluZS1oZWFke2Rp',
  'c3BsYXk6bm9uZX0KICAubGluZS1yb3d7CiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6NTZweCBtaW5tYXgoMCwxZnIpIDcycHggbWlubWF4KDAsODZweCk7CiAgICBncmlkLXRlbXBsYXRlLWFyZWFzOiduYW1lIG5hbWUgbmFtZSBkZWwnICdxdHkgdW5pdCBwcmlj',
  'ZSBzdW0nOwogICAgZ2FwOjVweDtwYWRkaW5nOjhweDttYXJnaW4tYm90dG9tOjhweDsKICAgIGJvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpOwogIH0KICAubGluZS1y',
  'b3cgLmlucDpudGgtb2YtdHlwZSgxKXtncmlkLWFyZWE6bmFtZX0KICAubGluZS1yb3cgLmlucDpudGgtb2YtdHlwZSgyKXtncmlkLWFyZWE6cXR5O3RleHQtYWxpZ246Y2VudGVyfQogIC5saW5lLXJvdyAuaW5wOm50aC1vZi10eXBlKDMpe2dyaWQtYXJlYTp1bml0',
  'fQogIC5saW5lLXJvdyAuaW5wOm50aC1vZi10eXBlKDQpe2dyaWQtYXJlYTpwcmljZX0KICAubGluZS1yb3cgLmxpbmUtc3Vte2dyaWQtYXJlYTpzdW07YWxpZ24tc2VsZjpjZW50ZXI7Zm9udC1zaXplOjEyLjVweH0KICAubGluZS1yb3cgLmJ0bntncmlkLWFyZWE6',
  'ZGVsO2FsaWduLXNlbGY6c3RhcnQ7anVzdGlmeS1zZWxmOmVuZDt3aWR0aDozNHB4O3BhZGRpbmc6NnB4IDB9CiAgLmxpbmUtcm93IC5pbnB7cGFkZGluZzo2cHggN3B4O2ZvbnQtc2l6ZToxMi41cHh9CiAgLmxpbmUtdG90YWx7d2lkdGg6MTAwJTttYXJnaW46NnB4',
  'IDAgMDt0ZXh0LWFsaWduOnJpZ2h0fQp9CgovKiA9PT09PT09PT09PT0g4LiV4Lix4Lin4Lia4Lit4LiB4Liq4LiW4Liy4LiZ4Liw4LiB4Liy4Lij4LiL4Li04LiH4LiB4LmMICjguKHguLjguKHguILguKfguLLguJrguJkpID09PT09PT09PT09PQogICDguYDguIfg',
  'uLXguKLguJrguYDguKHguLfguYjguK3guJfguLjguIHguK3guKLguYjguLLguIfguJvguIHguJXguLQg4LiK4Lix4LiU4LmA4LiI4LiZ4LmA4Lih4Li34LmI4Lit4Lih4Li14Lit4Liw4LmE4Lij4LiV4LmJ4Lit4LiH4LiI4Lix4LiU4LiB4Liy4LijCiAgIOC4leC4',
  'seC4p+C4l+C4teC5iOC4geC4lOC5hOC4lOC5ieC4iOC4sOC4ouC4geC4guC4tuC5ieC4meC5gOC4peC5h+C4geC4meC5ieC4reC4ouC4leC4reC4meC5gOC4reC4suC5gOC4oeC4suC4quC5jOC4iuC4teC5iSDguYPguKvguYnguKPguLnguYnguKfguYjguLLguIHg',
  'uJTguYTguJTguYkKLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi8KLnN5bmMtcGlsbHsKICB0cmFuc2l0aW9uOmJhY2tncm91bmQgLjE1cyxjb2xvciAuMTVzOwogIHdoaXRlLXNwYWNlOm5vd3JhcDtsaW5l',
  'LWhlaWdodDoxLjc7Cn0KLnN5bmMtcGlsbCAuc3Bpbnt3aWR0aDoxMXB4O2hlaWdodDoxMXB4O2JvcmRlci13aWR0aDoycHg7dmVydGljYWwtYWxpZ246LTFweH0KYnV0dG9uLnN5bmMtcGlsbHtwYWRkaW5nOjJweCAxMHB4fQpidXR0b24uc3luYy1waWxsOmhvdmVy',
  'e2ZpbHRlcjpicmlnaHRuZXNzKC45NCl9CmJ1dHRvbi5zeW5jLXBpbGw6YWN0aXZle3RyYW5zZm9ybTp0cmFuc2xhdGVZKDFweCl9Ci8qIOC4quC4luC4suC4meC4sOC4l+C4teC5iOC4leC5ieC4reC4h+C5g+C4q+C5ieC4nOC4ueC5ieC5g+C4iuC5ieC4iOC4seC4',
  'lOC4geC4suC4oyDguIHguLDguJ7guKPguLTguJrguYDguJrguLIg4LmGIOC5g+C4q+C5ieC4quC4seC4h+C5gOC4geC4leC5gOC4q+C5h+C4mSDguYHguJXguYjguYTguKHguYjguKPguJrguIHguKfguJnguKrguLLguKLguJXguLIgKi8KLnN5bmMtcGlsbC53YXJu',
  'LC5zeW5jLXBpbGwuZGdye2FuaW1hdGlvbjpzeW5jTnVkZ2UgMi40cyBlYXNlLWluLW91dCBpbmZpbml0ZX0KQGtleWZyYW1lcyBzeW5jTnVkZ2V7MCUsODglLDEwMCV7b3BhY2l0eToxfTk0JXtvcGFjaXR5Oi41NX19CkBtZWRpYSAocHJlZmVycy1yZWR1Y2VkLW1v',
  'dGlvbjpyZWR1Y2UpewogIC5zeW5jLXBpbGwud2Fybiwuc3luYy1waWxsLmRncnthbmltYXRpb246bm9uZX0KfQpAbWVkaWEgKG1heC13aWR0aDo3MjBweCl7CiAgLyog4LiI4Lit4LmB4LiE4LiaOiDguYDguKvguKXguLfguK3guYHguJXguYjguYTguK3guITguK3g',
  'uJnguKvguKPguLfguK3guKfguIfguKvguKHguLjguJkg4Lib4Lij4Liw4Lir4Lii4Lix4LiU4LiX4Li14LmI4Lia4LiZ4LmB4LiW4Lia4Lir4Lix4LinCiAgICAg4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Lii4Lix4LiH4Lit4LmI4Liy4LiZ4LmE4LiU4LmJ4LiI4Liy',
  '4LiB4LiB4Liy4Lij4LmB4LiV4Liw4LiE4LmJ4Liy4LiHICh0aXRsZSkgKi8KICAuc3luYy1waWxsIC5zeW5jLWxhYmVse2Rpc3BsYXk6bm9uZX0KICAuc3luYy1waWxse3BhZGRpbmc6M3B4IDhweDtmb250LXNpemU6MTNweH0KfQoKLyogPT09PT09PT09PT09IOC4',
  'geC4o+C4sOC4lOC4tOC5iOC4h+C5geC4iOC5ieC4h+C5gOC4leC4t+C4reC4mSArIOC4geC4peC5iOC4reC4h+C4o+C4suC4ouC4geC4suC4oyA9PT09PT09PT09PT0gKi8KLmJlbGwtd3JhcHtwb3NpdGlvbjpyZWxhdGl2ZTtkaXNwbGF5OmlubGluZS1mbGV4fQou',
  'YnRuLmJlbGx7cG9zaXRpb246cmVsYXRpdmU7Zm9udC1zaXplOjE1cHg7bGluZS1oZWlnaHQ6MX0KLmJlbGwtZG90ewogIHBvc2l0aW9uOmFic29sdXRlO3RvcDotNXB4O3JpZ2h0Oi01cHg7bWluLXdpZHRoOjE3cHg7aGVpZ2h0OjE3cHg7cGFkZGluZzowIDRweDsK',
  'ICBiYWNrZ3JvdW5kOnZhcigtLXdhcm4pO2NvbG9yOiNmZmY7Ym9yZGVyLXJhZGl1czo5OXB4OwogIGZvbnQtc2l6ZToxMC41cHg7Zm9udC13ZWlnaHQ6NzAwO2xpbmUtaGVpZ2h0OjE3cHg7dGV4dC1hbGlnbjpjZW50ZXI7CiAgYm94LXNoYWRvdzowIDAgMCAycHgg',
  'dmFyKC0tc3VyZmFjZSk7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zOwp9Ci5iZWxsLWRvdC51cmdlbnR7YmFja2dyb3VuZDp2YXIoLS1kYW5nZXIpfQoKLm5vdGlmewogIHBvc2l0aW9uOmFic29sdXRlO3RvcDpjYWxjKDEwMCUgKyA4cHgpO3JpZ2h0',
  'OjA7ei1pbmRleDo3MDsKICB3aWR0aDptaW4oMzgwcHgsY2FsYygxMDB2dyAtIDMycHgpKTsKICBiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpO2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czp2YXIoLS1yKTsKICBib3gtc2hhZG93OnZh',
  'cigtLXNoLWxnKTtvdmVyZmxvdzpoaWRkZW47YW5pbWF0aW9uOnBvcCAuMTRzIGVhc2Utb3V0Owp9Ci5ub3RpZi1oewogIGRpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjhweDtwYWRkaW5nOjExcHggMTRweDsKICBib3JkZXItYm90dG9tOjFweCBz',
  'b2xpZCB2YXIoLS1saW5lLTIpO2ZvbnQtc2l6ZToxNHB4Owp9Ci5ub3RpZi1oIC5zcHttYXJnaW4tbGVmdDphdXRvO2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjdweH0KLm5vdGlmLWxpc3R7bWF4LWhlaWdodDptaW4oNjB2aCw0NDBweCk7b3Zl',
  'cmZsb3cteTphdXRvfQoubm90aWYtc2VjewogIHBhZGRpbmc6OXB4IDE0cHggNHB4O2ZvbnQtc2l6ZToxMS41cHg7Zm9udC13ZWlnaHQ6NjAwO2NvbG9yOnZhcigtLW11dGVkKTsKICBiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7cG9zaXRpb246c3RpY2t5O3Rv',
  'cDowOwp9Ci5ub3RpZi1pdGVtewogIGRpc3BsYXk6YmxvY2s7d2lkdGg6MTAwJTt0ZXh0LWFsaWduOmxlZnQ7YmFja2dyb3VuZDowO2JvcmRlcjowO2N1cnNvcjpwb2ludGVyOwogIHBhZGRpbmc6OXB4IDE0cHggOXB4IDE3cHg7Ym9yZGVyLWxlZnQ6M3B4IHNvbGlk',
  'IHRyYW5zcGFyZW50O2ZvbnQ6aW5oZXJpdDtjb2xvcjppbmhlcml0OwogIGJvcmRlci1ib3R0b206MXB4IHNvbGlkIHZhcigtLWxpbmUtMik7Cn0KLm5vdGlmLWl0ZW06aG92ZXJ7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpfQoubm90aWYtaXRlbSAudHR7Zm9u',
  'dC1zaXplOjEzcHg7Zm9udC13ZWlnaHQ6NTAwO2NvbG9yOnZhcigtLWluayk7bGluZS1oZWlnaHQ6MS40NX0KLm5vdGlmLWl0ZW0gLmRke2ZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0tbXV0ZWQpO21hcmdpbi10b3A6MnB4O2xpbmUtaGVpZ2h0OjEuNX0KLm5v',
  'dGlmLWl0ZW0ubC1kYW5nZXJ7Ym9yZGVyLWxlZnQtY29sb3I6dmFyKC0tZGFuZ2VyKX0KLm5vdGlmLWl0ZW0ubC13YXJue2JvcmRlci1sZWZ0LWNvbG9yOnZhcigtLXdhcm4pfQoubm90aWYtaXRlbS5sLWluZm97Ym9yZGVyLWxlZnQtY29sb3I6dmFyKC0taW5mbyl9',
  'Ci5ub3RpZi1tb3JlewogIGRpc3BsYXk6YmxvY2s7d2lkdGg6MTAwJTt0ZXh0LWFsaWduOmxlZnQ7cGFkZGluZzo3cHggMTRweCA5cHggMTdweDsKICBiYWNrZ3JvdW5kOjA7Ym9yZGVyOjA7Y3Vyc29yOnBvaW50ZXI7Zm9udDppbmhlcml0O2ZvbnQtc2l6ZToxMnB4',
  'O2NvbG9yOnZhcigtLWJyYW5kKTsKICBib3JkZXItYm90dG9tOjFweCBzb2xpZCB2YXIoLS1saW5lLTIpOwp9Ci5ub3RpZi1tb3JlOmhvdmVye3RleHQtZGVjb3JhdGlvbjp1bmRlcmxpbmV9Ci5ub3RpZi1lbXB0eXtwYWRkaW5nOjI2cHggMTZweDt0ZXh0LWFsaWdu',
  'OmNlbnRlcjtjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC1zaXplOjEzLjVweDtsaW5lLWhlaWdodDoxLjd9Ci5ub3RpZi1lbXB0eSAuYmlne2ZvbnQtc2l6ZTozMHB4O21hcmdpbi1ib3R0b206NnB4fQoubm90aWYtZnsKICBwYWRkaW5nOjlweCAxNHB4O2JvcmRlci10',
  'b3A6MXB4IHNvbGlkIHZhcigtLWxpbmUtMik7CiAgZm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1mYWludCk7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpOwp9CgovKiDguJXguLHguKfguYDguKXguILguJrguJnguYDguKHguJnguLnguIvguYnguLLguKIg',
  '4oCUIOC5g+C4q+C5ieC5gOC4lOC5iOC4meC4guC4tuC5ieC4meC5gOC4oeC4t+C5iOC4reC4oeC4teC4h+C4suC4meC4hOC5ieC4suC4hyAqLwoubmF2LWl0ZW0gLmJhZGdlewogIGJhY2tncm91bmQ6dmFyKC0td2Fybik7Y29sb3I6I2ZmZjtmb250LXdlaWdodDo3',
  'MDA7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zOwp9Ci5uYXYtaXRlbS5vbiAuYmFkZ2V7YmFja2dyb3VuZDpyZ2JhKDI1NSwyNTUsMjU1LC4yOCk7Y29sb3I6I2ZmZn0KCkBtZWRpYSAobWF4LXdpZHRoOjcyMHB4KXsKICAubm90aWZ7CiAgICBwb3Np',
  'dGlvbjpmaXhlZDt0b3A6YXV0bztsZWZ0OjhweDtyaWdodDo4cHg7Ym90dG9tOjhweDt3aWR0aDphdXRvOwogICAgbWF4LWhlaWdodDo3MnZoO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47CiAgfQogIC5ub3RpZi1saXN0e2ZsZXg6MTttYXgtaGVp',
  'Z2h0Om5vbmV9Cn0KCi8qID09PT09PT09PT09PSDguYDguIrguYfguITguKXguLTguKrguJXguYzguIfguLLguJnguIvguYjguK3guKEgPT09PT09PT09PT09ICovCi8qIC0tLS0g4LmD4LiZ4Lif4Lit4Lij4LmM4LihIC0tLS0gKi8KLnRvZG97Ym9yZGVyOjFweCBz',
  'b2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXItc20pO3BhZGRpbmc6MTBweDtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMil9Ci50b2RvLXJvd3sKICBkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOjMwcHggbWlubWF4KDAsMWZy',
  'KSAxOTBweCAzNHB4OwogIGdhcDo3cHg7YWxpZ24taXRlbXM6Y2VudGVyO21hcmdpbi1ib3R0b206NnB4Owp9Ci50b2RvLXJvdyAuaW5wLC50b2RvLXJvdyAuc2Vse3BhZGRpbmc6NnB4IDlweDtmb250LXNpemU6MTNweH0KLnRvZG8tcm93LmRvbmUgLmlucHt0ZXh0',
  'LWRlY29yYXRpb246bGluZS10aHJvdWdoO2NvbG9yOnZhcigtLW11dGVkKX0KLnRvZG8tY2hlY2t7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO2N1cnNvcjpwb2ludGVyfQoudG9kby1jaGVjayBpbnB1dHt3aWR0',
  'aDoxN3B4O2hlaWdodDoxN3B4O2N1cnNvcjpwb2ludGVyO2FjY2VudC1jb2xvcjp2YXIoLS1vayl9Ci50b2RvLWNvdW50e21hcmdpbi1sZWZ0OmF1dG87Zm9udC1zaXplOjEzcHg7Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXIt',
  'bnVtc30KLnRvZG8tY291bnQgYntjb2xvcjp2YXIoLS1pbmspfQoKLyogLS0tLSDguYPguJnguJXguLLguKPguLLguIfguKPguLLguKLguIHguLLguKMgKOC4leC4tOC5iuC4geC5hOC4lOC5ieC4iOC4o+C4tOC4hykgLS0tLSAqLwoudG9kby12aWV3e2Rpc3BsYXk6',
  'ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47Z2FwOjJweH0KLnRvZG8tYmFye2hlaWdodDo1cHg7Ym9yZGVyLXJhZGl1czo5OXB4O2JhY2tncm91bmQ6dmFyKC0tbGluZS0yKTtvdmVyZmxvdzpoaWRkZW47bWFyZ2luLWJvdHRvbToycHh9Ci50b2RvLWJhcj5pe2Rp',
  'c3BsYXk6YmxvY2s7aGVpZ2h0OjEwMCU7Ym9yZGVyLXJhZGl1czo5OXB4O2JhY2tncm91bmQ6dmFyKC0tb2spO3RyYW5zaXRpb246d2lkdGggLjM1cyBlYXNlfQoudG9kby1tZXRhe2ZvbnQtc2l6ZToxMXB4O2NvbG9yOnZhcigtLW11dGVkKTtmb250LXZhcmlhbnQt',
  'bnVtZXJpYzp0YWJ1bGFyLW51bXM7bWFyZ2luLWJvdHRvbTozcHh9Ci50b2RvLW1ldGEgYntjb2xvcjp2YXIoLS1pbmspfQoudG9kby1saW5lewogIGRpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpmbGV4LXN0YXJ0O2dhcDo3cHg7Zm9udC1zaXplOjEzcHg7bGluZS1o',
  'ZWlnaHQ6MS41OwogIHBhZGRpbmc6MnB4IDA7Y3Vyc29yOnBvaW50ZXI7Cn0KLnRvZG8tbGluZSBpbnB1dHttYXJnaW4tdG9wOjJweDt3aWR0aDoxNXB4O2hlaWdodDoxNXB4O2ZsZXg6bm9uZTtjdXJzb3I6cG9pbnRlcjthY2NlbnQtY29sb3I6dmFyKC0tb2spfQou',
  'dG9kby1saW5lIC5ubXtmbGV4OjE7bWluLXdpZHRoOjA7Y29sb3I6dmFyKC0taW5rKX0KLnRvZG8tbGluZSAuY2F0e2ZsZXg6bm9uZTtmb250LXNpemU6MTAuNXB4O3BhZGRpbmc6MXB4IDdweH0KLnRvZG8tbGluZS5kb25lIC5ubXt0ZXh0LWRlY29yYXRpb246bGlu',
  'ZS10aHJvdWdoO2NvbG9yOnZhcigtLWZhaW50KX0KLnRvZG8tbGluZS5sb2NrZWR7Y3Vyc29yOmRlZmF1bHR9Ci50b2RvLWxpbmU6bm90KC5sb2NrZWQpOmhvdmVyIC5ubXtjb2xvcjp2YXIoLS1icmFuZCl9CgpAbWVkaWEgKG1heC13aWR0aDo2NDBweCl7CiAgLnRv',
  'ZG8tcm93ewogICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOjMwcHggbWlubWF4KDAsMWZyKSAzNHB4OwogICAgZ3JpZC10ZW1wbGF0ZS1hcmVhczonY2hrIG5hbWUgZGVsJyAnLiBjYXQgY2F0JzsKICAgIHBhZGRpbmc6OHB4O2JvcmRlcjoxcHggc29saWQgdmFyKC0t',
  'bGluZSk7Ym9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTsKICAgIGJhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7bWFyZ2luLWJvdHRvbTo4cHg7CiAgfQogIC50b2RvLWNoZWNre2dyaWQtYXJlYTpjaGs7YWxpZ24tc2VsZjpzdGFydDtwYWRkaW5nLXRvcDo1cHh9CiAg',
  'LnRvZG8tcm93IC5pbnB7Z3JpZC1hcmVhOm5hbWV9CiAgLnRvZG8tcm93IC5zZWx7Z3JpZC1hcmVhOmNhdDt3aWR0aDoxMDAlfQogIC50b2RvLXJvdyAuYnRue2dyaWQtYXJlYTpkZWw7YWxpZ24tc2VsZjpzdGFydDtqdXN0aWZ5LXNlbGY6ZW5kO3dpZHRoOjM0cHg7',
  'cGFkZGluZzo2cHggMH0KICAudG9kby1jb3VudHt3aWR0aDoxMDAlO21hcmdpbjo2cHggMCAwO3RleHQtYWxpZ246cmlnaHR9Cn0KCgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg',
  '4LiI4Lit4LmB4LiE4LiaICjguKHguLfguK3guJbguLfguK0gLyDguYHguJfguYfguJrguYDguKXguYfguJXguYHguJnguKfguJXguLHguYnguIcpCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PQogICDguYTguKHguYjguYTguJTguYnguYHguKLguIHguYTguJ/guKXguYzguKvguKPguLfguK3guYHguKLguIHguYDguJfguKHguYDguJ7guKXguJXguKrguLPguKvguKPguLHguJrguKHguLfguK3guJbguLfguK0g4oCUIEhUTUwg4LiK4Li44LiU4LmA4LiU',
  '4Li14Lii4Lin4LiB4Lix4LiZ4LiX4Lix4LmJ4LiH4Lir4Lih4LiUCiAgIOC4leC4o+C4h+C4meC4teC5ieC5gOC4m+C4peC4teC5iOC4ouC4meC5geC4hOC5iCAi4Lin4Liy4LiH4LiV4Lij4LiH4LmE4Lir4LiZIiDguILguYnguK3guKHguLnguKUg4Lib4Li44LmI',
  '4LihIOC4leC4o+C4o+C4geC4sCDguYPguIrguYnguKPguYjguKfguKHguIHguLHguJnguKvguKHguJQKICAg4Lii4LmI4LitLeC4guC4ouC4suC4ouC4q+C4meC5ieC4suC4leC5iOC4suC4h+C4muC4meC4hOC4reC4oeC4geC5h+C4quC4peC4seC4muC5hOC4lOC5',
  'ieC4l+C4seC4meC4l+C4tSDguYHguKXguLDguYDguJ7guLTguYjguKHguJ/guLXguYDguIjguK3guKPguYzguITguKPguLHguYnguIfguYDguJTguLXguKLguKfguYTguJTguYnguJfguLHguYnguIfguKrguK3guIfguYHguJrguJoKLS0tLS0tLS0tLS0tLS0tLS0t',
  'LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovCkBtZWRpYSAobWF4LXdpZHRoOjc2MHB4KXsKCiAgLyogLS0tLSDguYHguJbguJrguKXguYjguLLguIc6IOC4m+C4uOC5iOC4oeC4reC4ouC4ueC5iOC4o+C4sOC4lOC4seC4',
  'muC4meC4tOC5ieC4p+C5guC4m+C5ieC4hyDguYTguKHguYjguJXguYnguK3guIfguYDguK3guLfguYnguK3guKHguYTguJvguKHguLjguKHguIvguYnguLLguKLguJrguJkgLS0tLSAqLwogIC50YWJiYXJ7CiAgICBkaXNwbGF5OmZsZXg7cG9zaXRpb246Zml4ZWQ7',
  'bGVmdDowO3JpZ2h0OjA7Ym90dG9tOjA7ei1pbmRleDo1MDsKICAgIGJhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7Ym9yZGVyLXRvcDoxcHggc29saWQgdmFyKC0tbGluZSk7CiAgICBwYWRkaW5nLWJvdHRvbTplbnYoc2FmZS1hcmVhLWluc2V0LWJvdHRvbSk7CiAg',
  'ICBib3gtc2hhZG93OjAgLTJweCAxNHB4IHJnYmEoMTUsMjMsNDEsLjA3KTsKICB9CiAgLnRhYnsKICAgIGZsZXg6MSAxIDA7bWluLXdpZHRoOjA7bWluLWhlaWdodDo1NHB4O3BhZGRpbmc6N3B4IDJweCA2cHg7CiAgICBkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rp',
  'b246Y29sdW1uO2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO2dhcDozcHg7CiAgICBib3JkZXI6MDtiYWNrZ3JvdW5kOjA7Y3Vyc29yOnBvaW50ZXI7Y29sb3I6dmFyKC0tbXV0ZWQpOwogICAgZm9udC1zaXplOjEwLjVweDtsaW5lLWhl',
  'aWdodDoxLjI7cG9zaXRpb246cmVsYXRpdmU7CiAgfQogIC50YWIgLmlje2ZvbnQtc2l6ZToxOHB4O2xpbmUtaGVpZ2h0OjF9CiAgLnRhYiAudGx7bWF4LXdpZHRoOjEwMCU7b3ZlcmZsb3c6aGlkZGVuO3RleHQtb3ZlcmZsb3c6ZWxsaXBzaXM7d2hpdGUtc3BhY2U6',
  'bm93cmFwfQogIC50YWIub257Y29sb3I6dmFyKC0tYnJhbmQpO2ZvbnQtd2VpZ2h0OjcwMH0KICAudGFiLm9uIC5pY3t0cmFuc2Zvcm06dHJhbnNsYXRlWSgtMXB4KX0KICAudGFiIC5iYWRnZXsKICAgIHBvc2l0aW9uOmFic29sdXRlO3RvcDozcHg7bGVmdDo1MCU7',
  'bWFyZ2luLWxlZnQ6M3B4OwogICAgYmFja2dyb3VuZDp2YXIoLS13YXJuKTtjb2xvcjojZmZmO2JvcmRlci1yYWRpdXM6OTlweDsKICAgIG1pbi13aWR0aDoxNnB4O2hlaWdodDoxNnB4O3BhZGRpbmc6MCA0cHg7CiAgICBmb250LXNpemU6MTBweDtsaW5lLWhlaWdo',
  'dDoxNnB4O2ZvbnQtd2VpZ2h0OjcwMDt0ZXh0LWFsaWduOmNlbnRlcjsKICAgIGJveC1zaGFkb3c6MCAwIDAgMnB4IHZhcigtLXN1cmZhY2UpOwogIH0KICAvKiDguYDguKfguYnguJnguJfguLXguYjguYPguKvguYnguYHguJbguJrguKXguYjguLLguIcg4LmE4Lih',
  '4LmI4LmD4Lir4LmJ4LiX4Lix4Lia4LmA4LiZ4Li34LmJ4Lit4Lir4Liy4Lia4Lij4Lij4LiX4Lix4LiU4Liq4Li44LiU4LiX4LmJ4Liy4LiiICovCiAgLmNvbnRlbnR7cGFkZGluZzoxNHB4IDE0cHggY2FsYyg3NHB4ICsgZW52KHNhZmUtYXJlYS1pbnNldC1ib3R0',
  'b20pKX0KICAudGFiYmFyIH4gLm92LC5uYXZ7ei1pbmRleDo2MH0KCiAgLyogLS0tLSDguYHguJbguJrguKvguLHguKc6IOC4muC4teC4muC5g+C4q+C5ieC5gOC4q+C4peC4t+C4reC5geC4luC4p+C5gOC4lOC4teC4ouC4p+C5gOC4l+C5iOC4suC4l+C4teC5iOC5',
  'hOC4q+C4pyAtLS0tICovCiAgLnRvcHtwYWRkaW5nOjZweCAxMHB4O2dhcDo3cHg7cm93LWdhcDo2cHh9CiAgLnRvcCBoMXtmb250LXNpemU6MTUuNXB4fQogIC50b3AgLnN1YntkaXNwbGF5Om5vbmV9ICAgICAgICAgIC8qIOC4hOC4s+C4reC4mOC4tOC4muC4suC4',
  'ouC4q+C4meC5ieC4suC5hOC4m+C4reC4ouC4ueC5iOC5g+C4meC5gOC4oeC4meC4ueC4guC5ieC4suC4h+C5geC4peC5ieC4pyDguYTguKHguYjguJXguYnguK3guIfguIvguYnguLMgKi8KICAudG9wLXJpZ2h0e2dhcDo2cHg7d2lkdGg6MTAwJTttYXJnaW4tbGVm',
  'dDowfQogIC50b3AtcmlnaHQgI3NlYXJjaEJveHtmbGV4OjEgMSAxMTBweDt3aWR0aDphdXRvIWltcG9ydGFudDttaW4td2lkdGg6MH0KICAudG9wLXJpZ2h0ICN5ZWFyU2Vse2ZsZXg6MCAxIGF1dG87bWF4LXdpZHRoOjQydnd9CiAgLmJ1cmdlcntwYWRkaW5nOjdw',
  'eCAxMHB4fQogIC8qIOC4iuC5iOC4reC4h+C4geC4o+C4reC4geC4muC4meC5geC4luC4muC4q+C4seC4p+C5gOC4leC4teC5ieC4ouC4peC4hyDguYHguJXguYjguKLguLHguIfguITguIcgMTZweCDguIHguLHguJkgaU9TIOC4i+C4ueC4oeC5gOC4reC4hyAqLwog',
  'IC50b3AgLmlucCwudG9wIC5zZWx7cGFkZGluZzo2cHggMTBweH0KICAudG9wIC5idG4uaWNvbntwYWRkaW5nOjZweCA5cHh9CgogIC8qIC0tLS0g4LiV4Lix4Lin4LmA4Lil4LiC4Liq4Lij4Li44LibOiAyIOC4iuC5iOC4reC4h+C4leC5iOC4reC5geC4luC4pyDg',
  'uYTguKHguYjguYPguIrguYjguIrguYjguK3guIfguYDguJTguLXguKLguKfguIjguJnguIHguLTguJnguJfguLHguYnguIfguIjguK0gLS0tLSAqLwogIC5nNCwuZzN7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCgyLG1pbm1heCgwLDFmcikpfQogIC5nMntn',
  'cmlkLXRlbXBsYXRlLWNvbHVtbnM6MWZyfQogIC5rcGl7cGFkZGluZzoxMXB4IDEycHh9CiAgLmtwaSAudntmb250LXNpemU6MTlweH0KICAua3BpIC5se2ZvbnQtc2l6ZToxMXB4fQogIC5rcGkgLnN7Zm9udC1zaXplOjEwLjVweH0KCiAgLyogLS0tLSDguJXguLLg',
  'uKPguLLguIcgLT4g4LiB4Liy4Lij4LmM4LiU4LiX4Li14Lil4Liw4Lij4Liy4Lii4LiB4Liy4LijIC0tLS0KICAgICDguIrguLfguYjguK3guITguK3guKXguLHguKHguJnguYzguKHguLLguIjguLLguIEgZGF0YS1sYWJlbCDguJfguLXguYggbGFiZWxDZWxscygp',
  'IOC4leC4tOC4lOC5hOC4p+C5ieC5g+C4q+C5ieC4q+C4peC4seC4h+C4p+C4suC4lOC4q+C4meC5ieC4sgogICAgIOC4iOC4tuC4h+C5g+C4iuC5ieC5hOC4lOC5ieC4geC4seC4muC4l+C4uOC4geC4leC4suC4o+C4suC4h+C5g+C4meC4o+C4sOC4muC4muC5guC4',
  'lOC4ouC5hOC4oeC5iOC4leC5ieC4reC4h+C5geC4geC5ieC4leC4suC4o+C4suC4h+C4l+C4teC4peC4sOC4reC4seC4mSAqLwogIC50d3tvdmVyZmxvdy14OnZpc2libGV9CiAgLnR7bWluLXdpZHRoOjAhaW1wb3J0YW50O2Rpc3BsYXk6YmxvY2s7d2lkdGg6MTAw',
  'JTtib3JkZXI6MH0KICAudCB0aGVhZHtkaXNwbGF5Om5vbmV9CiAgLnQgdGJvZHl7ZGlzcGxheTpibG9ja30KICAudCB0Ym9keSB0cnsKICAgIGRpc3BsYXk6YmxvY2s7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlKTtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUp',
  'OwogICAgYm9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTtwYWRkaW5nOjlweCAxMnB4O21hcmdpbi1ib3R0b206OHB4OwogIH0KICAudCB0Ym9keSB0cjpsYXN0LWNoaWxke21hcmdpbi1ib3R0b206MH0KICAudCB0Ym9keSB0ZHsKICAgIGRpc3BsYXk6ZmxleDtnYXA6',
  'MTBweDthbGlnbi1pdGVtczpiYXNlbGluZTsKICAgIHBhZGRpbmc6M3B4IDA7Ym9yZGVyOjA7dGV4dC1hbGlnbjpsZWZ0IWltcG9ydGFudDt3aGl0ZS1zcGFjZTpub3JtYWw7CiAgfQogIC50IHRib2R5IHRkOmVtcHR5LC50IHRib2R5IHRkLmNlbGwtZW1wdHl7ZGlz',
  'cGxheTpub25lfQogIC50IHRib2R5IHRkW2RhdGEtbGFiZWxdOjpiZWZvcmV7CiAgICBjb250ZW50OmF0dHIoZGF0YS1sYWJlbCk7ZmxleDowIDAgMzYlO21pbi13aWR0aDowOwogICAgY29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtc2l6ZToxMS41cHg7Zm9udC13ZWln',
  'aHQ6NTAwOwogIH0KICAudCB0Ym9keSB0ZC5udW17anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnR9CiAgLnQgdGJvZHkgdGQuY2VsbC1hY3Rpb25zewogICAganVzdGlmeS1jb250ZW50OmZsZXgtZW5kO2dhcDo2cHg7cGFkZGluZy10b3A6OXB4O21hcmdpbi10b3A6',
  'NnB4OwogICAgYm9yZGVyLXRvcDoxcHggc29saWQgdmFyKC0tbGluZS0yKTsKICB9CiAgLnQgdGJvZHkgdHIucm93LXdpZGUgdGR7ZGlzcGxheTpibG9jazt0ZXh0LWFsaWduOmNlbnRlciFpbXBvcnRhbnR9CiAgLnQgdGJvZHkgdHIucm93LXdpZGUgdGQ6OmJlZm9y',
  'ZXtjb250ZW50Om5vbmV9CgogIC8qIC0tLS0g4Lib4Li44LmI4Lih4LiV4LmJ4Lit4LiH4LiB4LiU4LmC4LiU4LiZ4LiU4LmJ4Lin4Lii4LiZ4Li04LmJ4LinIC0tLS0gKi8KICAuYnRue3BhZGRpbmc6OXB4IDE0cHh9CiAgLmJ0bi5zbXtwYWRkaW5nOjdweCAxMXB4',
  'O2ZvbnQtc2l6ZToxM3B4fQogIC5idG4uaWNvbntwYWRkaW5nOjhweCAxMHB4fQogIC5jaGlwe3BhZGRpbmc6N3B4IDE0cHh9CiAgLnNlbCwuaW5we3BhZGRpbmc6OXB4IDExcHg7Zm9udC1zaXplOjE2cHh9ICAgLyogMTZweCDguIHguLHguJkgaU9TIOC4i+C4ueC4',
  'oeC5gOC4reC4h+C4leC4reC4meC5geC4leC4sOC4iuC5iOC4reC4h+C4geC4o+C4reC4gSAqLwogIC50IC5idG4uaWNvbntwYWRkaW5nOjdweCAxMHB4fQoKICAvKiAtLS0tIOC4geC4o+C4suC4nzog4LmD4Lir4LmJ4LmA4LiV4Li14LmJ4Lii4Lil4LiH4Lir4LiZ',
  '4LmI4Lit4LiiIOC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC4geC4tOC4meC4l+C4seC5ieC4h+C4iOC4rSAtLS0tICovCiAgLmNoYXJ0e21pbi13aWR0aDo0NjBweH0KICAuY2hhcnQtd3JhcHtvdmVyZmxvdy14OmF1dG87LXdlYmtpdC1vdmVyZmxvdy1zY3JvbGxp',
  'bmc6dG91Y2h9CgogIC8qIC0tLS0g4LiB4Lil4LmI4Lit4LiH4LiL4LmJ4Lit4LiZOiDguYDguJXguYfguKHguIjguK3guYHguJrguJrguYHguJzguYjguJnguYDguKXguLfguYjguK3guJnguILguLbguYnguJkg4Lib4Li44LmI4Lih4Lia4Lix4LiZ4LiX4Li24LiB',
  '4LiV4Li04LiU4LiC4Lit4Lia4Lil4LmI4Liy4LiH4LmA4Liq4Lih4LitIC0tLS0gKi8KICAubW9kYWwtZntwb3NpdGlvbjpzdGlja3k7Ym90dG9tOjA7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlKTsKICAgIHBhZGRpbmctYm90dG9tOmNhbGMoMTJweCArIGVudihz',
  'YWZlLWFyZWEtaW5zZXQtYm90dG9tKSl9Cn0KCi8qIOC4iOC4reC5gOC4peC5h+C4geC4oeC4suC4gSAo4LmA4LiE4Lij4Li34LmI4Lit4LiH4LmA4Lil4LmH4LiBIC8g4Lii4LmI4Lit4Lir4LiZ4LmJ4Liy4LiV4LmI4Liy4LiH4LmB4LiE4Lia4Liq4Li44LiUKSAq',
  'LwpAbWVkaWEgKG1heC13aWR0aDo0MDBweCl7CiAgLnRhYiAudGx7Zm9udC1zaXplOjkuNXB4fQogIC5rcGkgLnZ7Zm9udC1zaXplOjE3LjVweH0KICAudCB0Ym9keSB0ZFtkYXRhLWxhYmVsXTo6YmVmb3Jle2ZsZXgtYmFzaXM6NDIlfQp9CgpAbWVkaWEgcHJpbnR7',
  'CiAgLm5hdiwudG9wLXJpZ2h0LC5idXJnZXIsLnQtYWN0aW9ucywuYnRue2Rpc3BsYXk6bm9uZSFpbXBvcnRhbnR9CiAgLmFwcHtkaXNwbGF5OmJsb2NrfSBib2R5e2JhY2tncm91bmQ6I2ZmZn0KICAuY2FyZHticmVhay1pbnNpZGU6YXZvaWQ7Ym94LXNoYWRvdzpu',
  'b25lfQp9CgovKiA9PT09PT09PT09PT0g4LiB4Lij4Liy4LifID09PT09PT09PT09PSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0KICAg4LmA4Liq4LmJ4LiZ4LiV4Liy4Lij4Liy4LiH4LiB4Lix4Lia4LmB4LiB4LiZ4LmA4Lib4LmH4LiZ4LmA',
  '4Liq4LmJ4LiZ4Lia4Liy4LiH4LiX4Li24LiaIOC5hOC4oeC5iOC5g+C4iuC5ieC5gOC4quC5ieC4meC4m+C4o+C4sCAo4LmA4Liq4LmJ4LiZ4Lib4Lij4Liw4Lit4LmI4Liy4LiZ4LmA4Lir4Lih4Li34Lit4LiZ4LmA4Liq4LmJ4LiZ4LiE4Liy4LiU4LiB4Liy4Lij',
  '4LiT4LmMKQogICDguYHguJfguYjguIfguKvguJnguLLguYTguKHguYjguYDguIHguLTguJkgMjRweCDguJvguKXguLLguKLguJTguYnguLLguJnguILguYnguK3guKHguLnguKXguKHguJnguYDguKXguYfguIHguJnguYnguK3guKIg4LiU4LmJ4Liy4LiZ4LiQ4Liy',
  '4LiZ4LmA4Lir4Lil4Li14LmI4Lii4LihCiAgIOC4leC4seC4p+C4q+C4meC4seC4h+C4quC4t+C4reC4l+C4uOC4geC4leC4seC4p+C5g+C4iuC5ieC4quC4teC4leC4seC4p+C4reC4seC4geC4qeC4o+C4m+C4geC4leC4tCDguYTguKHguYjguYPguIrguYjguKrg',
  'uLXguILguK3guIfguYHguJfguYjguIcg4oCUIOC4quC4teC4reC4ouC4ueC5iOC4l+C4teC5iOC5geC4l+C5iOC4h+C5gOC4l+C5iOC4suC4meC4seC5ieC4mQotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0t',
  'LS0tLS0tLS0tLSAqLwouY2hhcnQtd3JhcHtvdmVyZmxvdy14OmF1dG99Ci5jaGFydHtkaXNwbGF5OmJsb2NrO3dpZHRoOjEwMCU7aGVpZ2h0OmF1dG87bWluLXdpZHRoOjU2MHB4fQouY2hhcnQgLmdyaWQtbHtzdHJva2U6dmFyKC0tbGluZSk7c3Ryb2tlLXdpZHRo',
  'OjE7ZmlsbDpub25lfQouY2hhcnQgLmF4aXMtbHtzdHJva2U6dmFyKC0tbGluZSk7c3Ryb2tlLXdpZHRoOjF9Ci5jaGFydCAudGlja3tmaWxsOnZhcigtLW11dGVkKTtmb250LXNpemU6MTFweDtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXN9Ci5jaGFy',
  'dCAueGxhYntmaWxsOnZhcigtLWluay0yKTtmb250LXNpemU6MTJweH0KLmNoYXJ0IC5kbGFie2ZpbGw6dmFyKC0taW5rKTtmb250LXNpemU6MTFweDtmb250LXdlaWdodDo2MDB9Ci5jaGFydCAuYzF7ZmlsbDp2YXIoLS1jMSl9Ci5jaGFydCAuYzJ7ZmlsbDp2YXIo',
  'LS1jMil9Ci5jaGFydCAuaGl0e2ZpbGw6dHJhbnNwYXJlbnQ7Y3Vyc29yOnBvaW50ZXJ9Ci5jaGFydCAuaGl0OmZvY3Vze291dGxpbmU6bm9uZX0KLmNoYXJ0IC5iYW5ke2ZpbGw6dmFyKC0taW5rKTtvcGFjaXR5OjA7dHJhbnNpdGlvbjpvcGFjaXR5IC4xMnN9Ci5j',
  'aGFydCBnLm9uIC5iYW5ke29wYWNpdHk6LjA1fQouY2hhcnQgLmhpdDpmb2N1cy12aXNpYmxlICsgLmJhbmQsCi5jaGFydCBnLm9uIC5iYW5ke29wYWNpdHk6LjA4fQoKLmxlZ2VuZHtkaXNwbGF5OmZsZXg7Z2FwOjE0cHg7YWxpZ24taXRlbXM6Y2VudGVyO2ZsZXgt',
  'd3JhcDp3cmFwO21hcmdpbi1ib3R0b206MTBweH0KLmxlZ2VuZCAua3tkaXNwbGF5OmlubGluZS1mbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6NnB4O2ZvbnQtc2l6ZToxMnB4O2NvbG9yOnZhcigtLWluay0yKX0KLmxlZ2VuZCAuc3d7d2lkdGg6MTJweDtoZWln',
  'aHQ6MTJweDtib3JkZXItcmFkaXVzOjNweDtmbGV4Om5vbmV9CgovKiDguIHguKXguYjguK3guIfguJrguK3guIHguITguYjguLLguJXguK3guJnguIrguLXguYkg4oCUIOC4hOC5iOC4suC4leC4seC4p+C5g+C4q+C4jeC5iOC4oeC4suC4geC5iOC4reC4mSDguIrg',
  'uLfguYjguK3guKPguLLguKLguIHguLLguKPguYDguJvguYfguJnguJXguLHguKfguKPguK3guIcgKi8KLmN0aXB7cG9zaXRpb246Zml4ZWQ7ei1pbmRleDo5MDtwb2ludGVyLWV2ZW50czpub25lO2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7CiAgYm9yZGVyOjFw',
  'eCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXItc20pO2JveC1zaGFkb3c6dmFyKC0tc2gtbGcpOwogIHBhZGRpbmc6OHB4IDEwcHg7Zm9udC1zaXplOjEycHg7bWluLXdpZHRoOjEzMnB4O29wYWNpdHk6MDt0cmFuc2l0aW9uOm9wYWNpdHkg',
  'LjFzfQouY3RpcC5vbntvcGFjaXR5OjF9Ci5jdGlwIC5te2ZvbnQtd2VpZ2h0OjcwMDtjb2xvcjp2YXIoLS1pbmspO21hcmdpbi1ib3R0b206NnB4fQouY3RpcCAucntkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo3cHg7bWFyZ2luLXRvcDozcHh9',
  'Ci5jdGlwIC5yIGl7d2lkdGg6MTJweDtoZWlnaHQ6MnB4O2JvcmRlci1yYWRpdXM6MnB4O2ZsZXg6bm9uZX0KLmN0aXAgLnIgYntjb2xvcjp2YXIoLS1pbmspO2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtczttYXJnaW4tbGVmdDphdXRvfQouY3RpcCAu',
  'ciBzcGFue2NvbG9yOnZhcigtLW11dGVkKX0KCjwvc3R5bGU+CjwvaGVhZD4KPGJvZHk+Cgo8ZGl2IGNsYXNzPSJhcHAiPgogIDwhLS0gPT09PT09PT09PT09PT09PT0gc2lkZWJhciA9PT09PT09PT09PT09PT09PSAtLT4KICA8YXNpZGUgY2xhc3M9Im5hdiIgaWQ9',
  'Im5hdiI+CiAgICA8ZGl2IGNsYXNzPSJicmFuZCI+CiAgICAgIDxiPvCfj6IgPD89IGFwcE5hbWUgPz48L2I+CiAgICAgIDxzcGFuPjw/PSBzdWJ0aXRsZSA/PiDCtyB2PD89IHZlcnNpb24gPz48L3NwYW4+CiAgICA8L2Rpdj4KICAgIDxkaXYgY2xhc3M9Im5hdi1s',
  'aXN0IiBpZD0ibmF2TGlzdCI+PC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJuYXYtZm9vdCIgaWQ9Im5hdkZvb3QiPuC4geC4s+C4peC4seC4h+C5guC4q+C4peC4lOKApjwvZGl2PgogIDwvYXNpZGU+CgogIDwhLS0gPT09PT09PT09PT09PT09PT0gbWFpbiA9PT09PT09',
  'PT09PT09PT09PSAtLT4KICA8ZGl2IGNsYXNzPSJtYWluIj4KICAgIDxoZWFkZXIgY2xhc3M9InRvcCI+CiAgICAgIDxidXR0b24gY2xhc3M9ImJ1cmdlciIgb25jbGljaz0idG9nZ2xlTmF2KCkiPuKYsDwvYnV0dG9uPgogICAgICA8ZGl2PgogICAgICAgIDxoMSBp',
  'ZD0icGFnZVRpdGxlIj7guKDguLLguJ7guKPguKfguKE8L2gxPgogICAgICAgIDxkaXYgY2xhc3M9InN1YiIgaWQ9InBhZ2VTdWIiPuC5geC4lOC4iuC4muC4reC4o+C5jOC4lOC4o+C4p+C4oeC4l+C4uOC4geC4quC5iOC4p+C4meC4guC4reC4h+C4q+C4reC4nuC4',
  'seC4gTwvZGl2PgogICAgICA8L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0idG9wLXJpZ2h0Ij4KICAgICAgICA8c3BhbiBpZD0ibGl2ZURvdCI+PC9zcGFuPgogICAgICAgIDxzcGFuIGlkPSJiZWxsV3JhcCIgY2xhc3M9ImJlbGwtd3JhcCI+PC9zcGFuPgogICAgICAg',
  'IDxidXR0b24gY2xhc3M9ImJ0biBpY29uIiBpZD0idGhlbWVCdG4iIHRpdGxlPSLguKrguKXguLHguJrguJjguLXguKEiIG9uY2xpY2s9ImN5Y2xlVGhlbWUoKSI+8J+MlzwvYnV0dG9uPgogICAgICAgIDxpbnB1dCBjbGFzcz0iaW5wIHctYXV0byIgaWQ9InNlYXJj',
  'aEJveCIgcGxhY2Vob2xkZXI9IvCflI4g4LiE4LmJ4LiZ4Lir4Liy4LiX4Lix4LmJ4LiH4Lij4Liw4Lia4Lia4oCmIiBzdHlsZT0id2lkdGg6MTgwcHgiCiAgICAgICAgICAgICAgIG9uaW5wdXQ9Im9uU2VhcmNoKHRoaXMudmFsdWUpIiBhdXRvY29tcGxldGU9Im9m',
  'ZiI+CiAgICAgICAgPHNlbGVjdCBjbGFzcz0ic2VsIHctYXV0byIgaWQ9InllYXJTZWwiIG9uY2hhbmdlPSJzZXRZZWFyKHRoaXMudmFsdWUpIj48L3NlbGVjdD4KICAgICAgICA8YnV0dG9uIGNsYXNzPSJidG4gaWNvbiIgdGl0bGU9IuC4o+C4teC5gOC4n+C4o+C4',
  'iiIgb25jbGljaz0icmVmcmVzaCgpIj7ihrs8L2J1dHRvbj4KICAgICAgPC9kaXY+CiAgICA8L2hlYWRlcj4KICAgIDxtYWluIGNsYXNzPSJjb250ZW50IiBpZD0idmlldyI+CiAgICAgIDxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPjxzcGFuIGNs',
  'YXNzPSJzcGluIj48L3NwYW4+PC9kaXY+4LiB4Liz4Lil4Lix4LiH4LmA4LiK4Li34LmI4Lit4Lih4LiV4LmI4Lit4Lij4Liw4Lia4Lia4oCmPC9kaXY+CiAgICA8L21haW4+CiAgPC9kaXY+CgogIDwhLS0g4LmB4LiW4Lia4Lil4LmI4Liy4LiH4Liq4Liz4Lir4Lij',
  '4Lix4Lia4Lih4Li34Lit4LiW4Li34LitIOKAlCDguK3guKLguLnguYjguYPguJnguKvguJnguYnguLLguYDguJTguLXguKLguKfguIHguLHguJnguJnguLXguYnguYDguKrguKHguK0g4LmE4Lih4LmI4LmE4LiU4LmJ4LmB4Lii4LiB4LmE4Lif4Lil4LmMCiAgICAg',
  'ICBDU1Mg4LmA4Lib4LmH4LiZ4LiV4Lix4Lin4LiV4Lix4LiU4Liq4Li04LiZ4Lin4LmI4Liy4LiI4Lit4LmE4Lir4LiZ4LmA4Lir4LmH4LiZIOC4ouC5iOC4rS3guILguKLguLLguKLguKvguJnguYnguLLguJXguYjguLLguIfguYHguKXguYnguKfguKrguKXguLHg',
  'uJrguYTguJTguYnguJfguLHguJnguJfguLUgLS0+CiAgPG5hdiBjbGFzcz0idGFiYmFyIiBpZD0idGFiQmFyIiBhcmlhLWxhYmVsPSLguYDguKHguJnguLnguKvguKXguLHguIEiPjwvbmF2Pgo8L2Rpdj4KCjxkaXYgaWQ9ImF1dGhSb290Ij48L2Rpdj4KPGRpdiBp',
  'ZD0ibW9kYWxSb290Ij48L2Rpdj4KPGRpdiBpZD0idG9hc3RSb290Ij48L2Rpdj4KCjxzY3JpcHQ+CiAgLyog4LiE4LmI4Liy4LiX4Lix4LmJ4LiH4Liq4Liy4Lih4LiW4Li54LiB4LiB4Lij4Lit4LiH4Lih4Liy4LiI4Liy4LiB4Lid4Lix4LmI4LiH4LmA4LiL4Li0',
  '4Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4LmB4Lil4LmJ4LinIOC4iOC4tuC4h+C4q+C4peC4uOC4lOC4reC4reC4geC4iOC4suC4geC5gOC4hOC4o+C4t+C5iOC4reC4h+C4q+C4oeC4suC4ouC4hOC4s+C4nuC4ueC4lOC5hOC4oeC5iOC5hOC4lOC5iQogICAgICAg',
  'YWNjZXNzS2V5ICDguJzguYjguLLguJkgc2FmZUtleV8gICAg4LmA4Lir4Lil4Li34Lit4LmB4LiE4LmIIEEtWiBhLXogMC05IF8gLQogICAgICAgcm9sZSAgICAgICDguKHguLLguIjguLLguIHguKPguLLguKLguIHguLLguKPguITguIfguJfguLXguYggUk9MRQog',
  'ICAgICAgdGhlbWUgICAgICDguJzguYjguLLguJkgc2FmZVRoZW1lXyAg4LmA4Lir4Lil4Li34Lit4LmB4LiE4LmIIDMg4LiE4LmI4Liy4LiX4Li14LmI4LiB4Liz4Lir4LiZ4LiU4LmE4Lin4LmJCgogICAgIOC4l+C4seC5ieC4h+C4quC4suC4oeC4leC5ieC4reC4',
  'h+C4nuC4tOC4oeC4nuC5jOC5geC4muC4muC4lOC4tOC4miAoZm9yY2UtcHJpbnRpbmcpIOC5gOC4l+C5iOC4suC4meC4seC5ieC4mSDguKvguYnguLLguKHguYPguIrguYnguYHguJrguJogc3RhbmRhcmQtcHJpbnRpbmcKICAgICDguYDguJ7guKPguLLguLDguYHg',
  'uJrguJrguKvguKXguLHguIfguIjguLAgZXNjYXBlIOC5gOC4hOC4o+C4t+C5iOC4reC4h+C4q+C4oeC4suC4ouC4hOC4s+C4nuC4ueC4lOC5gOC4m+C5h+C4mSAmcXVvdDsg4LiL4Li24LmI4LiH4LmD4LiZ4LmB4LiX4LmH4LiBIHNjcmlwdAogICAgIOC5gOC4muC4',
  'o+C4suC4p+C5jOC5gOC4i+C4reC4o+C5jOC5hOC4oeC5iOC4luC4reC4lOC4geC4peC4seC4miDguJfguLPguYPguKvguYnguJfguLHguYnguIfguJrguKXguYfguK3guIHguJnguLXguYnguJ7guLHguIfguJfguLHguYnguIfguIHguYnguK3guJnguYHguKXguLDg',
  'uITguYjguLLguYTguKHguYjguJbguLbguIfguKvguJnguYnguLLguYDguKfguYfguJogKi8KICB2YXIgQUNDRVNTX0tFWSA9ICI8PyE9IGFjY2Vzc0tleSA/PiI7CiAgdmFyIFVTRVJfUk9MRSAgPSAiPD8hPSByb2xlID8+IjsKICB2YXIgSU5JVF9USEVNRSA9ICI8',
  'PyE9IHRoZW1lID8+IjsKPC9zY3JpcHQ+CjxzY3JpcHQ+Ci8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBBcHAuaHRtbCDigJQgY29yZTogc3RhdGUsIGFwaSwgcm91dGVyLCBmb3JtYXQsIG1vZGFs',
  'LCB1cGxvYWQKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgp2YXIgUyA9IHsKICBib290OiBudWxsLCAgICAgICAgICAvLyDguILguYnguK3guKHguLnguKXguJXguLHguYnguIfguJXguYnguJng',
  'uIjguLLguIEgYXBwLmJvb3RzdHJhcAogIHBhZ2U6ICdkYXNoYm9hcmQnLAogIHllYXI6IFN0cmluZyhuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCkpLAogIGNhY2hlOiB7fSwgICAgICAgICAgIC8vIOC5gOC4geC5h+C4muC4nOC4peC4peC4seC4nuC4mOC5jOC4peC5',
  'iOC4suC4quC4uOC4lOC4guC4reC4h+C5geC4leC5iOC4peC4sOC4q+C4meC5ieC4sgogIHBhcmFtczoge30sICAgICAgICAgIC8vIOC4leC4seC4p+C4geC4o+C4reC4h+C4ouC5iOC4reC4ouC4guC4reC4h+C5geC4leC5iOC4peC4sOC4q+C4meC5ieC4siDguYDg',
  'uIrguYjguJkge3Jvb206JzMxMScsIHN0YXR1czonYWxsJ30KICBidXN5OiBmYWxzZSwKICB2ZXJzaW9uOiAwLCAgICAgICAgICAvLyDguKPguLjguYjguJnguILguYnguK3guKHguLnguKXguJfguLXguYjguKvguJnguYnguLLguJnguLXguYnguJbguLfguK3guK3g',
  'uKLguLnguYgKICBzZWxmQ2hhbmdlVW50aWw6IDAsICAvLyDguYDguJ7guLTguYjguIfguIHguJTguJrguLHguJnguJfguLbguIHguYDguK3guIcg4oCUIOC4reC4ouC5iOC4suC5gOC4lOC5ieC4h+C4p+C5iOC4siAi4Lih4Li14LiE4LiZ4LmB4LiB4LmJ4LiC4LmJ',
  '4Lit4Lih4Li54LilIgogIHN5bmNUaW1lcjogbnVsbAp9OwoKdmFyIEFMTF9ERUJUUyA9IFtdOwoKdmFyIFBBR0VTID0gWwogIHsgaWQ6J2Rhc2hib2FyZCcsIGljOifwn5OKJywgbGFiZWw6J+C4oOC4suC4nuC4o+C4p+C4oScsICAgICAgICAgICAgICBzdWI6J+C5',
  'geC4lOC4iuC4muC4reC4o+C5jOC4lOC4o+C4p+C4oeC4l+C4uOC4geC4quC5iOC4p+C4meC4guC4reC4h+C4q+C4reC4nuC4seC4gScsICAgICAgICBzZWM6J+C4oOC4suC4nuC4o+C4p+C4oScsIHRhYjon4Lig4Liy4Lie4Lij4Lin4LihJyB9LAogIHsgaWQ6J2Rl',
  'YnRNYWluJywgIGljOifwn5KwJywgbGFiZWw6J+C4o+C4suC4ouC4geC4suC4o+C4quC4o+C4uOC4m+C4o+C4p+C4oScsICAgICAgIHN1Yjon4Lia4Lix4LiN4LiK4Li14LmC4Lit4LiZ4LmD4LiK4LmJ4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiB4LiC4Lit4LiH4Lir',
  '4Lit4Lie4Lix4LiBJywgICAgICAgIHNlYzon4LiB4Liy4Lij4LmA4LiH4Li04LiZJyB9LAogIHsgaWQ6J2RlYnRTdWInLCAgIGljOifwn6e+JywgbGFiZWw6J+C4q+C4meC4teC5ieC4quC4tOC4mScsICAgICAgICAgICAgICBzdWI6J+C4muC4seC4jeC4iuC4teC5',
  'guC4reC4meC5g+C4iuC5ieC4q+C4meC4teC5ieC4o+C4reC4h+C4guC4reC4h+C4q+C4reC4nuC4seC4gScgfSwKICB7IGlkOidwdXJjaGFzZXMnLCBpYzon8J+bkicsIGxhYmVsOifguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcnLCAgICAg',
  'ICAgc3ViOifguILguK3guIfguYDguILguYnguLLguKvguK3guJ7guLHguIEg4Lij4Liy4LiE4LiyIOC4m+C4o+C4sOC4geC4seC4mSDguYHguKXguLDguKrguKXguLTguJsnIH0sCiAgeyBpZDonZmluYW5jZScsICAgaWM6J/Cfk5InLCBsYWJlbDon4Lij4Liy4Lii',
  '4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4ouC4q+C4rScsICAgICAgc3ViOifguITguYjguLLguYDguIrguYjguLLguJfguLXguYjguYDguIHguYfguJrguYTguJTguYkgwrcg4LiE4LmI4Liy4LmE4LifIMK3IOC4hOC5iOC4suC4meC5ieC4syDCtyDguITg',
  'uYjguLLguYDguJnguYfguJUgwrcg4Lig4Liy4Lip4Li1JywgdGFiOifguKPguLLguKLguKPguLHguJot4LiI4LmI4Liy4LiiJyB9LAogIHsgaWQ6J2FjJywgICAgICAgIGljOifinYTvuI8nLCBsYWJlbDon4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJywgICAgICAg',
  'ICAgICBzdWI6J+C4leC4suC4o+C4suC4h+C4peC5ieC4suC4h+C5geC4reC4o+C5jOC4o+C4suC4ouC4q+C5ieC4reC4hyAyNCDguKvguYnguK3guIcnLCAgICAgIHNlYzon4LiL4LmI4Lit4Lih4Lia4Liz4Lij4Li44LiHJywgdGFiOifguKXguYnguLLguIfguYHg',
  'uK3guKPguYwnIH0sCiAgeyBpZDoncmVwYWlycycsICAgaWM6J/CflKcnLCBsYWJlbDon4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Liy4Lih4Lir4LmJ4Lit4LiHJywgICAgICBzdWI6J+C4h+C4suC4meC5geC4iOC5ieC4h+C4i+C5iOC4reC4oeC5geC4ouC4geC4',
  'leC4suC4oeC4q+C5ieC4reC4hycsIHRhYjon4LiL4LmI4Lit4Lih4Lir4LmJ4Lit4LiHJyB9LAogIHsgaWQ6J2J1aWxkaW5nJywgIGljOifwn4+iJywgbGFiZWw6J+C4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oScsICAgIHN1',
  'Yjon4LiH4Liy4LiZ4Liq4LmI4Lin4LiZ4LiB4Lil4Liy4LiH4LiC4Lit4LiH4Lit4Liy4LiE4Liy4LijJyB9LAogIHsgaWQ6J3Jvb21zJywgICAgIGljOifwn5qqJywgbGFiZWw6J+C4q+C5ieC4reC4h+C4nuC4seC4gScsICAgICAgICAgICAgIHN1Yjon4LiX4Liw',
  '4LmA4Lia4Li14Lii4LiZ4Lir4LmJ4Lit4LiH4LmB4Lil4Liw4Lib4Lij4Liw4Lin4Lix4LiV4Li04Lij4Liy4Lii4Lir4LmJ4Lit4LiHJywgICAgICAgc2VjOifguILguYnguK3guKHguLnguKUnIH0sCiAgeyBpZDoncmVwb3J0cycsICAgaWM6J/Cfk4gnLCBsYWJl',
  'bDon4Lij4Liy4Lii4LiH4Liy4LiZICYg4Liq4Liz4Lij4Lit4LiH4LiC4LmJ4Lit4Lih4Li54LilJywgc3ViOifguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguKPguLLguKLguKvguYnguK3guIcgwrcg4Lib4LiP4Li04LiX4Li04LiZ4LiH4Liy4LiZIMK3',
  'IOC4quC5iOC4h+C4reC4reC4geC4guC5ieC4reC4oeC4ueC4pScgfSwKICB7IGlkOidzZXR0aW5ncycsICBpYzon4pqZ77iPJywgbGFiZWw6J+C4leC4seC5ieC4h+C4hOC5iOC4sicsICAgICAgICAgICAgICBzdWI6J+C4muC4seC4jeC4iuC4tSDCtyDguJjguLXg',
  'uKEgwrcg4Lic4Li54LmJ4LmD4LiK4LmJIMK3IOC4peC4tOC4h+C4geC5jOC5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4mScsICAgc2VjOifguKPguLDguJrguJonIH0KXTsKCi8qIC0tLS0tLS0tLS0tLS0tLS0gQVBJIC0tLS0tLS0tLS0tLS0tLS0gKi8KCi8q',
  'KiDguIHguLjguI3guYHguIjguJfguLXguYjguIjguLDguYHguJnguJrguYTguJvguIHguLHguJrguJfguLjguIHguITguLPguKrguLHguYjguIcg4oCUIOC4oeC4tSAyIOC4l+C4suC4h+C4quC4s+C4o+C4reC4h+C5gOC4nOC4t+C5iOC4reC4l+C4suC4h+C5geC4',
  'o+C4geC5hOC4oeC5iOC4oeC4siAqLwp2YXIgUkVTT0xWRURfS0VZID0gbnVsbDsKCmZ1bmN0aW9uIGFjY2Vzc0tleSgpewogIGlmIChSRVNPTFZFRF9LRVkgIT09IG51bGwpIHJldHVybiBSRVNPTFZFRF9LRVk7CiAgUkVTT0xWRURfS0VZID0gKHR5cGVvZiBBQ0NF',
  'U1NfS0VZID09PSAnc3RyaW5nJyAmJiBBQ0NFU1NfS0VZKSA/IEFDQ0VTU19LRVkgOiAnJzsKICByZXR1cm4gUkVTT0xWRURfS0VZOwp9CgovKiogdHJ1ZSDguJbguYnguLLguYDguJvguLTguJTguJTguYnguKfguKLguKXguLTguIfguIHguYzguJzguLnguYnguJTg',
  'uLnguYHguKUg4oCUIOC5g+C4iuC5ieC5geC4l+C4meC4leC4seC4p+C5geC4m+C4oyBDQU5fRURJVCDguJXguKPguIcg4LmGIOC4l+C4teC5iOC4reC4suC4iOC5hOC4oeC5iOC4luC4ueC4geC4m+C4o+C4sOC4geC4suC4qCAqLwpmdW5jdGlvbiBjYW5FZGl0KCl7',
  'CiAgaWYgKHR5cGVvZiBDQU5fRURJVCAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiAhIUNBTl9FRElUOwogIHJldHVybiAhIShTLmJvb3QgJiYgUy5ib290LmNhbkVkaXQpOwp9CgpmdW5jdGlvbiBjYWxsQXBpKGFjdGlvbiwgcGF5bG9hZCl7CiAgdmFyIGJvZHkgPSB7',
  'fTsKICBPYmplY3Qua2V5cyhwYXlsb2FkIHx8IHt9KS5mb3JFYWNoKGZ1bmN0aW9uKGspeyBib2R5W2tdID0gcGF5bG9hZFtrXTsgfSk7CiAgYm9keS5fa2V5ID0gYWNjZXNzS2V5KCk7CiAgLy8g4Lic4Li54LmJ4LmA4Lij4Li14Lii4LiB4Liq4LmI4LiHIF9zZXNz',
  'aW9uIOC4oeC4suC5gOC4reC4h+C5hOC4lOC5iSAo4LiV4Lit4LiZ4Lit4Lit4LiB4LiI4Liy4LiB4Lij4Liw4Lia4Lia4LiV4LmJ4Lit4LiH4LmD4LiK4LmJ4LiV4Lix4Lin4LmA4LiB4LmI4LiyKQogIGlmIChib2R5Ll9zZXNzaW9uID09PSB1bmRlZmluZWQpIGJv',
  'ZHkuX3Nlc3Npb24gPSAodHlwZW9mIEFVVEggIT09ICd1bmRlZmluZWQnID8gQVVUSC5zZXNzaW9uIDogJycpIHx8ICcnOwogIHBheWxvYWQgPSBib2R5OwogIHZhciBtdXRhdGluZyA9IENMSUVOVF9NVVRBVElORy50ZXN0KGFjdGlvbik7CiAgaWYgKG11dGF0aW5n',
  'KSBzeW5jU2V0KCdzYXZpbmcnKTsKCiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7CiAgICBnb29nbGUuc2NyaXB0LnJ1bgogICAgICAud2l0aFN1Y2Nlc3NIYW5kbGVyKGZ1bmN0aW9uKHJlcyl7CiAgICAgICAgaWYgKCFyZXMp',
  'IHsgaWYgKG11dGF0aW5nKSBzeW5jU2V0KCdvZmZsaW5lJyk7IHJldHVybiByZWplY3QobmV3IEVycm9yKCfguYTguKHguYjguYTguJTguYnguKPguLHguJrguILguYnguK3guKHguLnguKXguIjguLLguIHguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYwn',
  'KSk7IH0KICAgICAgICBpZiAocmVzLm9rKSB7CiAgICAgICAgICBpZiAobXV0YXRpbmcpIHsgbWFya1NlbGZDaGFuZ2UoKTsgc3luY1NldCgnc2F2ZWQnKTsgfQogICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzLmRhdGEpOwogICAgICAgIH0KICAgICAgICAvLyDg',
  'uKvguKHguJTguK3guLLguKLguLjguKPguLDguKvguKfguYjguLLguIfguYPguIrguYnguIfguLLguJkg4oCUIOC4nuC4suC4geC4peC4seC4muC5hOC4m+C4q+C4meC5ieC4suC4peC5h+C4reC4geC4reC4tOC4meC5geC4l+C4meC4l+C4teC5iOC4iOC4sOC4guC4',
  'tuC5ieC4meC4guC5ieC4reC4hOC4p+C4suC4oeC4hOC5ieC4suC4h+C5hOC4p+C5ieC5gOC4ieC4oiDguYYKICAgICAgICBpZiAocmVzLm5lZWRMb2dpbiAmJiB0eXBlb2Ygb25TZXNzaW9uTG9zdCA9PT0gJ2Z1bmN0aW9uJykgb25TZXNzaW9uTG9zdCgpOwogICAg',
  'ICAgIGlmIChtdXRhdGluZykgc3luY1NldCgnZXJyb3InLCByZXMuZXJyb3IpOwogICAgICAgIHJlamVjdChuZXcgRXJyb3IocmVzLmVycm9yKSk7CiAgICAgIH0pCiAgICAgIC53aXRoRmFpbHVyZUhhbmRsZXIoZnVuY3Rpb24oZXJyKXsKICAgICAgICAvLyDguYDg',
  'uJnguYfguJXguKrguLDguJTguLjguJQg4oCUIOC4guC4reC4h+C4l+C4teC5iOC4geC4o+C4reC4geC5hOC4p+C5ieC4ouC4seC4h+C4reC4ouC4ueC5iOC5g+C4meC4n+C4reC4o+C5jOC4oSDguYTguKHguYjguKvguLLguKLguYTguJvguYTguKvguJkKICAgICAg',
  'ICBpZiAobXV0YXRpbmcpIHN5bmNTZXQoaXNPZmZsaW5lRXJyb3IoZXJyKSA/ICdvZmZsaW5lJyA6ICdlcnJvcicsIChlcnIgJiYgZXJyLm1lc3NhZ2UpIHx8IFN0cmluZyhlcnIpKTsKICAgICAgICByZWplY3QoZXJyKTsKICAgICAgfSkKICAgICAgLmFwaShhY3Rp',
  'b24sIHBheWxvYWQgfHwge30pOwogIH0pOwp9CgovKiog4LmA4Lij4Li14Lii4LiB4LmA4Lih4Li34LmI4Lit4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4Lia4Lit4LiB4Lin4LmI4Liy4Lii4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJ4Lil4LmH4Lit',
  '4LiB4Lit4Li04LiZICjguKvguKHguJTguK3guLLguKLguLggLyDguJbguLnguIHguYPguKvguYnguK3guK3guIHguIjguLLguIHguKPguLDguJrguJopICovCnZhciBzZXNzaW9uTG9zdEF0ID0gMDsKZnVuY3Rpb24gb25TZXNzaW9uTG9zdCgpewogIGlmIChEYXRl',
  'Lm5vdygpIC0gc2Vzc2lvbkxvc3RBdCA8IDMwMDApIHJldHVybjsgICAvLyDguKvguKXguLLguKLguITguLPguKrguLHguYjguIfguJ7guKPguYnguK3guKHguIHguLHguJnguIHguYfguYDguJTguYnguIfguITguKPguLHguYnguIfguYDguJTguLXguKLguKfguJ7g',
  'uK0KICBzZXNzaW9uTG9zdEF0ID0gRGF0ZS5ub3coKTsKICBzYXZlU2Vzc2lvbignJyk7CiAgY2xvc2VNb2RhbCgpOwogIGlmIChBVVRILmRldmljZSkgc2hvd1BpbigpOyBlbHNlIHNob3dMb2dpbign4Lir4Lih4LiU4LmA4Lin4Lil4Liy4LmD4LiK4LmJ4LiH4Liy',
  '4LiZIOC4geC4o+C4uOC4k+C4suC5gOC4guC5ieC4suC4quC4ueC5iOC4o+C4sOC4muC4muC4reC4teC4geC4hOC4o+C4seC5ieC4hycpOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIGJvb3QgJiByb3V0aW5nIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIGJv',
  'b3QoKXsKICAvLyDguJfguLLguJjguLXguKHguIHguYjguK3guJnguK3guKLguYjguLLguIfguK3guLfguYjguJkg4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4LmA4Lir4LmH4LiZ4Lir4LiZ4LmJ4Liy4LiI4Lit4LiB4Lij4Liw4Lie4Lij4Li04Lia4LiC4Liy4Lin',
  '4LiV4Lit4LiZ4LmA4Lib4Li04LiUCiAgYXBwbHlUaGVtZShsc0dldChMU19USEVNRSkgfHwgKHR5cGVvZiBJTklUX1RIRU1FID09PSAnc3RyaW5nJyA/IElOSVRfVEhFTUUgOiAn4LiV4Liy4Lih4LmA4LiE4Lij4Li34LmI4Lit4LiHJykpOwogIC8vIGF1dGhHYXRl',
  'IOC4iOC4sOC4reC5iOC4suC4meC4geC4uOC4jeC5geC4iOC4iOC4suC4gSBVUkwg4LiC4Lit4LiH4Lir4LiZ4LmJ4Liy4LmB4Lih4LmI4LmD4Lir4LmJ4LiU4LmJ4Lin4LiiIOC4luC5ieC4suC4leC4seC4p+C5geC4m+C4o+C5hOC4oeC5iOC4oeC4suC4luC4tuC4',
  'h+C4q+C4meC5ieC4suC5gOC4p+C5h+C4mgogIGF1dGhHYXRlKCk7Cn0KCmZ1bmN0aW9uIGJvb3ROb3coKXsKICBjYWxsQXBpKCdhcHAuYm9vdHN0cmFwJykudGhlbihmdW5jdGlvbihiKXsKICAgIFMuYm9vdCA9IGI7CiAgICByZW5kZXJOYXYoKTsKICAgIGRvY3Vt',
  'ZW50LmdldEVsZW1lbnRCeUlkKCduYXZGb290JykuaW5uZXJIVE1MID0gbmF2Rm9vdEh0bWwoYik7CiAgICBTLnZlcnNpb24gPSBiLnZlcnNpb24gfHwgMDsKICAgIGlmICghYi5jYW5FZGl0KSBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ3JlYWRvbmx5Jyk7',
  'CiAgICAvLyDguJjguLXguKHguILguK3guIfguYDguITguKPguLfguYjguK3guIfguJnguLXguYnguIrguJnguLDguYDguKrguKHguK0g4LiW4LmJ4Liy4Lii4Lix4LiH4LmE4Lih4LmI4LmA4LiE4Lii4LiV4Lix4LmJ4LiH4LiE4LmI4Lit4Lii4LmD4LiK4LmJ4LiC',
  '4Lit4LiH4Lij4Liw4Lia4LiaCiAgICBhcHBseVRoZW1lKGN1cnJlbnRUaGVtZSgpKTsKICAgIGdvKHN0YXJ0UGFnZShiKSk7CiAgICByZWZyZXNoQWxlcnRzKCk7CiAgICBzdGFydFBvbGxpbmcoYi5zZXR0aW5ncyAmJiBiLnNldHRpbmdzLnJlZnJlc2hTZWNvbmRz',
  'KTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aWV3JykuaW5uZXJIVE1MID0KICAgICAgJzxkaXYgY2xhc3M9ImNhcmQiPjxkaXYgY2xhc3M9ImNhcmQtYiI+PGgzPuC5gOC4iuC4t+C5iOC4reC4oeC4leC5iOC4',
  'reC4o+C4sOC4muC4muC5hOC4oeC5iOC4quC4s+C5gOC4o+C5h+C4iDwvaDM+JyArCiAgICAgICc8cCBjbGFzcz0ibXV0ZWQiPicgKyBlc2MoZS5tZXNzYWdlfHxlKSArICc8L3A+JyArCiAgICAgICc8cCBjbGFzcz0iZnMxMyI+4LiV4Lij4Lin4LiI4Liq4Lit4Lia',
  '4Lin4LmI4LiyOiDguYDguJvguLTguJTguIrguLXguJXguYHguKXguYnguKfguKPguLHguJkgPGI+4LmA4Lih4LiZ4Li5IPCfj6IgVGhlIE0gQ29ybmVyIEFQIOKGkiDwn5qAIOC4leC4tOC4lOC4leC4seC5ieC4h+C4l+C4seC5ieC4h+C4q+C4oeC4lOC5g+C4meC4',
  'hOC4peC4tOC4geC5gOC4lOC4teC4ouC4pzwvYj4gJyArCiAgICAgICfguYDguKPguLXguKLguJrguKPguYnguK3guKLguYHguKXguYnguKc8L3A+PC9kaXY+PC9kaXY+JzsKICB9KTsKfQoKLyoqIOC4q+C4meC5ieC4suC5geC4o+C4geC4l+C4teC5iOC4iOC4sOC5',
  'gOC4m+C4tOC4lCDigJQg4LiV4Liy4Lih4LiX4Li14LmI4LiV4Lix4LmJ4LiH4LmE4Lin4LmJIOC5geC4leC5iOC4luC5ieC4suC4oeC4tSAjaGFzaCDguYPguJnguKXguLTguIfguIHguYzguYPguKvguYkgaGFzaCDguIrguJnguLAgKi8KZnVuY3Rpb24gc3RhcnRQ',
  'YWdlKGIpewogIHZhciBoYXNoID0gKGxvY2F0aW9uLmhhc2ggfHwgJycpLnJlcGxhY2UoJyMnLCcnKTsKICBpZiAoUEFHRVMuc29tZShmdW5jdGlvbihwKXsgcmV0dXJuIHAuaWQgPT09IGhhc2g7IH0pKSByZXR1cm4gaGFzaDsKICB2YXIgbWFwID0gewogICAgJ+C5',
  'geC4lOC4iuC4muC4reC4o+C5jOC4lCc6J2Rhc2hib2FyZCcsICfguKPguLLguKLguIHguLLguKPguKrguKPguLjguJvguKPguKfguKEnOidkZWJ0TWFpbicsICfguKvguJnguLXguYnguKrguLTguJknOidkZWJ0U3ViJywKICAgICfguKPguLLguKLguIHguLLguKPg',
  'uIvguLfguYnguK3guILguK3guIcnOidwdXJjaGFzZXMnLCAn4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Liy4Lih4Lir4LmJ4Lit4LiHJzoncmVwYWlycycKICB9OwogIHJldHVybiBtYXBbYi5zZXR0aW5ncyAmJiBiLnNldHRpbmdzLnN0YXJ0UGFnZV0gfHwgJ2Rh',
  'c2hib2FyZCc7Cn0KCi8qKiDguILguYnguK3guITguKfguLLguKHguKHguLjguKHguKXguYjguLLguIfguIvguYnguLLguKIg4oCUIOC5gOC4p+C4reC4o+C5jOC4iuC4seC4meC5gOC4p+C5h+C4muC5geC4reC4m+C4iOC4sOC5gOC4guC4teC4ouC4meC4l+C4seC4',
  'muC4n+C4seC4h+C4geC5jOC4iuC4seC4meC4meC4teC5iSAqLwpmdW5jdGlvbiBuYXZGb290SHRtbChiKXsKICB2YXIgdSA9IGIudXNlciB8fCB7fTsKICByZXR1cm4gJzxiIHN0eWxlPSJjb2xvcjojYzdkMGUwIj4nICsgZXNjKHUubmFtZSB8fCB1LmxhYmVsIHx8',
  'ICcnKSArICc8L2I+JyArCiAgICAodS51c2VybmFtZSA/ICcgPHNwYW4gc3R5bGU9Im9wYWNpdHk6LjciPkAnICsgZXNjKHUudXNlcm5hbWUpICsgJzwvc3Bhbj4nIDogJycpICsKICAgICc8YnI+PHNwYW4gc3R5bGU9Im9wYWNpdHk6LjgiPicgKyBlc2ModS5yb2xl',
  'ICYmIHUucm9sZSAhPT0gJ25vbmUnID8gdS5yb2xlIDogdS52aWEgfHwgJycpICsgJzwvc3Bhbj4nICsKICAgIChiLnNoZWV0VXJsID8gJzxicj48YSBocmVmPSInICsgYi5zaGVldFVybCArICciIHRhcmdldD0iX2JsYW5rIj7guYDguJvguLTguJQgR29vZ2xlIFNo',
  'ZWV0IOKGlzwvYT4nIDogJycpICsKICAgICh1LnNpZ25lZEluICYmIHUudXNlcm5hbWUKICAgICAgPyAnPGJyPjxhIGhyZWY9ImphdmFzY3JpcHQ6dm9pZCgwKSIgb25jbGljaz0iY29uZmlybUxvZ291dCgpIj7guK3guK3guIHguIjguLLguIHguKPguLDguJrguJo8',
  'L2E+JwogICAgICA6ICcnKTsKfQoKZnVuY3Rpb24gcmVuZGVyTmF2KCl7CiAgdmFyIGh0bWwgPSAnJzsKICBQQUdFUy5mb3JFYWNoKGZ1bmN0aW9uKHApewogICAgaWYgKHAuc2VjKSBodG1sICs9ICc8ZGl2IGNsYXNzPSJuYXYtc2VjIj4nICsgcC5zZWMgKyAnPC9k',
  'aXY+JzsKICAgIGh0bWwgKz0gJzxidXR0b24gY2xhc3M9Im5hdi1pdGVtIiBpZD0ibmF2LScgKyBwLmlkICsgJyIgb25jbGljaz0iZ28oXCcnICsgcC5pZCArICdcJykiPicgKwogICAgICAgICAgICAgICc8c3BhbiBjbGFzcz0iaWMiPicgKyBwLmljICsgJzwvc3Bh',
  'bj48c3Bhbj4nICsgcC5sYWJlbCArICc8L3NwYW4+JyArCiAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPSJiYWRnZSIgaWQ9ImJhZGdlLScgKyBwLmlkICsgJyIgc3R5bGU9ImRpc3BsYXk6bm9uZSI+PC9zcGFuPicgKwogICAgICAgICAgICAnPC9idXR0b24+JzsK',
  'ICB9KTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2TGlzdCcpLmlubmVySFRNTCA9IGh0bWw7CiAgcmVuZGVyVGFicygpOwp9CgovKioKICog4LmB4LiW4Lia4Lil4LmI4Liy4LiH4Liq4Liz4Lir4Lij4Lix4Lia4Lih4Li34Lit4LiW4Li34LitIOKAlCDg',
  'uYPguIrguYkgUEFHRVMg4LiK4Li44LiU4LmA4LiU4Li14Lii4Lin4LiB4Lix4Lia4LmA4Lih4LiZ4Li54LiC4LmJ4Liy4LiHIOC5geC4peC4sOC5gOC4o+C4teC4ouC4gSBnbygpIOC4leC4seC4p+C5gOC4lOC4teC4ouC4p+C4geC4seC4mQogKiDguYTguKHguYjg',
  'uYTguJTguYnguYDguJvguYfguJnguKvguJnguYnguLLguIjguK3guITguJnguKXguLDguIrguLjguJQg4LmA4Lib4LmH4LiZ4LmB4LiE4LmI4LiX4Li14LmI4Lin4Liy4LiH4Lib4Li44LmI4Lih4Lit4Li14LiB4LiX4Li14LmI4Lir4LiZ4Li24LmI4LiH4LiC4Lit',
  '4LiH4LiC4LmJ4Lit4Lih4Li54Lil4LmA4LiU4Li04LihCiAqIOC4m+C4uOC5iOC4oeC4quC4uOC4lOC4l+C5ieC4suC4ouC5gOC4m+C4tOC4lOC4peC4tOC5ieC4meC4iuC4seC4geC5gOC4oeC4meC4ueC5gOC4lOC4tOC4oSDguIjguLDguYTguJTguYnguYDguILg',
  'uYnguLLguJbguLbguIfguKvguJnguYnguLLguJfguLXguYjguYDguKvguKXguLfguK3guYTguJTguYnguITguKPguJoKICovCmZ1bmN0aW9uIHJlbmRlclRhYnMoKXsKICB2YXIgYmFyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhYkJhcicpOwogIGlmICgh',
  'YmFyKSByZXR1cm47CiAgdmFyIGh0bWwgPSBQQUdFUy5maWx0ZXIoZnVuY3Rpb24ocCl7IHJldHVybiBwLnRhYjsgfSkubWFwKGZ1bmN0aW9uKHApewogICAgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJ0YWIiIGlkPSJ0YWItJyArIHAuaWQgKyAnIiBvbmNsaWNrPSJn',
  'byhcJycgKyBwLmlkICsgJ1wnKSIgYXJpYS1sYWJlbD0iJyArIGVzYyhwLmxhYmVsKSArICciPicgKwogICAgICAgICAgICAgJzxzcGFuIGNsYXNzPSJpYyI+JyArIHAuaWMgKyAnPC9zcGFuPjxzcGFuIGNsYXNzPSJ0bCI+JyArIGVzYyhwLnRhYikgKyAnPC9zcGFu',
  'PicgKwogICAgICAgICAgICAgJzxzcGFuIGNsYXNzPSJiYWRnZSIgaWQ9InRhYmJhZGdlLScgKyBwLmlkICsgJyIgc3R5bGU9ImRpc3BsYXk6bm9uZSI+PC9zcGFuPicgKwogICAgICAgICAgICc8L2J1dHRvbj4nOwogIH0pLmpvaW4oJycpOwogIGJhci5pbm5lckhU',
  'TUwgPSBodG1sICsKICAgICc8YnV0dG9uIGNsYXNzPSJ0YWIiIGlkPSJ0YWItbW9yZSIgb25jbGljaz0idG9nZ2xlTmF2KCkiIGFyaWEtbGFiZWw9IuC5gOC4oeC4meC4ueC4l+C4seC5ieC4h+C4q+C4oeC4lCI+JyArCiAgICAgICc8c3BhbiBjbGFzcz0iaWMiPuKY',
  'sDwvc3Bhbj48c3BhbiBjbGFzcz0idGwiPuC5gOC4nuC4tOC5iOC4oeC5gOC4leC4tOC4oTwvc3Bhbj4nICsKICAgICAgJzxzcGFuIGNsYXNzPSJiYWRnZSIgaWQ9InRhYmJhZGdlLW1vcmUiIHN0eWxlPSJkaXNwbGF5Om5vbmUiPjwvc3Bhbj4nICsKICAgICc8L2J1',
  'dHRvbj4nOwp9CgpmdW5jdGlvbiBnbyhwYWdlKXsKICBTLnBhZ2UgPSBwYWdlOwogIFMucGFyYW1zID0ge307CiAgbG9jYXRpb24uaGFzaCA9IHBhZ2U7CiAgdmFyIG1ldGEgPSBQQUdFUy5maWx0ZXIoZnVuY3Rpb24ocCl7cmV0dXJuIHAuaWQ9PT1wYWdlO30pWzBd',
  'IHx8IFBBR0VTWzBdOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlVGl0bGUnKS50ZXh0Q29udGVudCA9IG1ldGEubGFiZWw7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BhZ2VTdWInKS50ZXh0Q29udGVudCA9IG1ldGEuc3ViOwogIFBBR0VTLmZv',
  'ckVhY2goZnVuY3Rpb24ocCl7CiAgICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2LScgKyBwLmlkKTsKICAgIGlmIChlbCkgZWwuY2xhc3NMaXN0LnRvZ2dsZSgnb24nLCBwLmlkID09PSBwYWdlKTsKICAgIHZhciB0YWIgPSBkb2N1bWVudC5n',
  'ZXRFbGVtZW50QnlJZCgndGFiLScgKyBwLmlkKTsKICAgIGlmICh0YWIpIHRhYi5jbGFzc0xpc3QudG9nZ2xlKCdvbicsIHAuaWQgPT09IHBhZ2UpOwogIH0pOwogIC8vIOC4q+C4meC5ieC4suC4l+C4teC5iOC5hOC4oeC5iOC4oeC4teC5geC4l+C5h+C4muC4guC4',
  'reC4h+C4leC4seC4p+C5gOC4reC4hyDguYPguKvguYnguJvguLjguYjguKEgIuC5gOC4nuC4tOC5iOC4oeC5gOC4leC4tOC4oSIg4Liq4Lin4LmI4Liy4LiH4LmB4LiX4LiZIOC4iOC4sOC5hOC4lOC5ieC4o+C4ueC5ieC4p+C5iOC4suC4reC4ouC4ueC5iOC4leC4',
  'o+C4h+C5hOC4q+C4mQogIHZhciBtb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhYi1tb3JlJyk7CiAgaWYgKG1vcmUpIG1vcmUuY2xhc3NMaXN0LnRvZ2dsZSgnb24nLCAhUEFHRVMuc29tZShmdW5jdGlvbihwKXsgcmV0dXJuIHAudGFiICYmIHAuaWQg',
  'PT09IHBhZ2U7IH0pKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2JykuY2xhc3NMaXN0LnJlbW92ZSgnb3BlbicpOwogIHJlbW92ZVNjcmltKCk7CiAgbG9hZCgpOwp9CgpmdW5jdGlvbiByZWZyZXNoKCl7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfQoK',
  'ZnVuY3Rpb24gc2V0WWVhcih5KXsKICBTLnllYXIgPSB5OwogIGxvYWQoKTsKfQoKLyoqCiAqIOC5guC4q+C4peC4lOC4guC5ieC4reC4oeC4ueC4peC4guC4reC4h+C4q+C4meC5ieC4suC4m+C4seC4iOC4iOC4uOC4muC4seC4mQogKgogKiBAcGFyYW0ge3txdWll',
  'dDpib29sZWFufT19IG9wdHMKICogICBxdWlldCA9IOC4i+C4tOC4h+C4geC5jOC5gOC4h+C4teC4ouC4miDguYYg4LmA4Lia4Li34LmJ4Lit4LiH4Lir4Lil4Lix4LiHIOC5hOC4oeC5iOC4peC5ieC4suC4h+C4q+C4meC5ieC4suC5gOC4m+C5h+C4meC4p+C4h+C4',
  'geC4peC4oeC4q+C4oeC4uOC4mSDguYHguKXguLDguITguLfguJnguJXguLPguYHguKvguJnguYjguIfguJfguLXguYjguYDguKXguLfguYjguK3guJnguITguYnguLLguIfguYTguKfguYkKICogICAgICAgICAgIOC5g+C4iuC5ieC4q+C4peC4seC4h+C4geC4lOC4',
  'muC4seC4meC4l+C4tuC4gSDguYHguKXguLDguJXguK3guJnguJ7guJrguKfguYjguLLguKHguLXguITguJnguYHguIHguYnguILguYnguK3guKHguLnguKXguIjguLLguIHguJfguLXguYjguK3guLfguYjguJkKICogICAgICAgICAgIOC5gOC4nuC4t+C5iOC4reC5',
  'g+C4q+C5ieC4q+C4meC5ieC4suC4iOC4reC4meC4tOC5iOC4h+C4l+C4teC5iOC4quC4uOC4lCDguYTguKHguYjguIHguKPguLDguJ7guKPguLTguJrguYHguKXguLDguYTguKHguYjguYDguJTguYnguIfguIHguKXguLHguJrguYTguJvguJrguJnguKrguLjguJQK',
  'ICovCmZ1bmN0aW9uIGxvYWQob3B0cyl7CiAgb3B0cyA9IChvcHRzID09PSB0cnVlKSA/IHt9IDogKG9wdHMgfHwge30pOyAgICAgLy8g4LmA4Lic4Li34LmI4Lit4LmC4LiE4LmJ4LiU4LmA4LiB4LmI4Liy4LiX4Li14LmI4LmA4Lij4Li14Lii4LiBIGxvYWQodHJ1',
  'ZSkKICB2YXIgcXVpZXQgPSAhIW9wdHMucXVpZXQ7CiAgdmFyIHZpZXcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndmlldycpOwogIHZhciByID0gUk9VVEVTW1MucGFnZV07CiAgaWYgKCFyKSB7IHZpZXcuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9ImVtcHR5',
  'Ij7guYTguKHguYjguJ7guJrguKvguJnguYnguLLguJnguLXguYk8L2Rpdj4nOyByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7IH0KCiAgaWYgKCFxdWlldCkgewogICAgdmlldy5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz0iZW1wdHkiPjxkaXYgY2xhc3M9ImJpZyI+',
  'PHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj48L2Rpdj7guIHguLPguKXguLHguIfguYLguKvguKXguJTguILguYnguK3guKHguLnguKXigKY8L2Rpdj4nOwogIH0gZWxzZSB7CiAgICBzeW5jU2V0KCdzeW5jaW5nJyk7CiAgfQoKICB2YXIga2VlcCA9IHF1aWV0ID8g',
  'c25hcHNob3RWaWV3KCkgOiBudWxsOwoKICByZXR1cm4gci5sb2FkKCkudGhlbihmdW5jdGlvbihkYXRhKXsKICAgIFMuY2FjaGVbUy5wYWdlXSA9IGRhdGE7CgogICAgLy8g4Lir4LiZ4LmJ4Liy4LmB4LiV4LmI4Lil4Liw4Lir4LiZ4LmJ4Liy4Lih4Li14Lib4Li1',
  '4LmD4Lir4LmJ4LmA4Lil4Li34Lit4LiB4LmE4Lih4LmI4LmA4LiX4LmI4Liy4LiB4Lix4LiZICjguYDguIrguYjguJnguIvguLfguYnguK3guILguK3guIfguKHguLXguJbguLbguIfguJvguLUgMjU2MyDguYHguJXguYjguKPguLLguKLguKPguLHguJot4Lij4Liy',
  '4Lii4LiI4LmI4Liy4Lii4Lih4Li14LmB4LiE4LmI4Lib4Li14Lil4LmI4Liy4Liq4Li44LiUKQogICAgLy8g4LiW4LmJ4Liy4Lib4Li14LiX4Li14LmI4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmI4LmE4Lih4LmI4Lih4Li14LmD4LiZ4Lir4LiZ4LmJ4Liy4LiZ4Li1',
  '4LmJIHN5bmNZZWFyT3B0aW9ucyDguIjguLDguJvguKPguLHguJrguJvguLXguYPguKvguYkg4oCUIOC5geC4leC5iOC4guC5ieC4reC4oeC4ueC4peC4l+C4teC5iOC5gOC4nuC4tOC5iOC4h+C4lOC4tuC4h+C4oeC4sgogICAgLy8g4LmA4Lib4LmH4LiZ4LiC4Lit',
  '4LiH4Lib4Li14LmA4LiB4LmI4LiyIOC4quC5iOC4p+C4meC4m+C5ieC4suC4ouC4geC4s+C4geC4seC4muC5g+C4iuC5ieC4m+C4teC5g+C4q+C4oeC5iCDguIHguKXguLLguKLguYDguJvguYfguJnguJrguK3guIHguKfguYjguLIgIuC4ouC4reC4lOC4i+C4t+C5',
  'ieC4rSDguJvguLUgMjAyNiA9IDAg4Lia4Liy4LiXIgogICAgLy8g4LiX4Lix4LmJ4LiH4LiX4Li14LmI4Lib4Li14LiZ4Lix4LmJ4LiZ4Lih4Li14Lii4Lit4LiU4LiI4Lij4Li04LiHIOKAlCDguJXguYnguK3guIfguJTguLbguIfguYPguKvguKHguYjguYPguKvg',
  'uYnguJXguKPguIfguIHguLHguJrguJvguLXguJfguLXguYjguJvguKPguLHguJrguYHguKXguYnguKcKICAgIHZhciB5ZWFyQmVmb3JlID0gU3RyaW5nKFMueWVhcik7CiAgICBzeW5jWWVhck9wdGlvbnMoZGF0YS55ZWFycyB8fCBkYXRhLmF2YWlsYWJsZSB8fCBb',
  'XSk7CiAgICBpZiAoU3RyaW5nKFMueWVhcikgIT09IHllYXJCZWZvcmUgJiYgIW9wdHMuX3JldHJpZWQpIHsKICAgICAgcmV0dXJuIGxvYWQoeyBxdWlldDogcXVpZXQsIF9yZXRyaWVkOiB0cnVlIH0pOwogICAgfQoKICAgIHZpZXcuaW5uZXJIVE1MID0gci5yZW5k',
  'ZXIoZGF0YSk7CiAgICBsYWJlbENlbGxzKHZpZXcpOwogICAgYXBwbHlSZWFkT25seSh2aWV3KTsKICAgIGlmIChyLmFmdGVyKSByLmFmdGVyKGRhdGEpOwogICAgaWYgKGtlZXApIHJlc3RvcmVWaWV3KGtlZXApOwogICAgaWYgKHF1aWV0KSBzeW5jU2V0KCdzeW5j',
  'ZWQnKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgIGlmIChxdWlldCkgeyAgICAgICAgICAgICAgICAgICAgICAgLy8g4LiL4Li04LiH4LiB4LmM4LmA4Lia4Li34LmJ4Lit4LiH4Lir4Lil4Lix4LiH4Lie4Lil4Liy4LiUIOKAlCDguK3guKLguYjguLLguJfg',
  'uLTguYnguIfguILguK3guIfguJfguLXguYjguYDguKvguYfguJnguK3guKLguLnguYgKICAgICAgc3luY1NldChpc09mZmxpbmVFcnJvcihlKSA/ICdvZmZsaW5lJyA6ICdlcnJvcicsIGUubWVzc2FnZSB8fCBlKTsKICAgICAgcmV0dXJuOwogICAgfQogICAgdmll',
  'dy5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz0iY2FyZCI+PGRpdiBjbGFzcz0iY2FyZC1iIj48aDM+4LmC4Lir4Lil4LiU4LiC4LmJ4Lit4Lih4Li54Lil4LmE4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIPC9oMz4nICsKICAgICAgICAgICAgICAgICAgICAgJzxwIGNs',
  'YXNzPSJtdXRlZCI+JyArIGVzYyhlLm1lc3NhZ2V8fGUpICsgJzwvcD4nICsKICAgICAgICAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0ibG9hZCgpIj7guKXguK3guIfguYPguKvguKHguYg8L2J1dHRvbj48L2Rpdj48L2Rpdj4nOwog',
  'IH0pOwp9CgovKiog4LiI4Liz4Liq4Lig4Liy4Lie4Lir4LiZ4LmJ4Liy4LiI4Lit4LmE4Lin4LmJ4LiB4LmI4Lit4LiZ4Lin4Liy4LiU4LmD4Lir4Lih4LmIIOC5gOC4nuC4t+C5iOC4reC5g+C4q+C5ieC4nOC4ueC5ieC5g+C4iuC5ieC4o+C4ueC5ieC4quC4tuC4',
  'geC4p+C5iOC4suC4q+C4meC5ieC4suC5hOC4oeC5iOC5hOC4lOC5ieC4luC4ueC4geC5guC4q+C4peC4lOC5g+C4q+C4oeC5iCAqLwpmdW5jdGlvbiBzbmFwc2hvdFZpZXcoKXsKICB2YXIgb3BlbiA9IFtdOwogIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5i',
  'aWxsLWxpbmVzJykuZm9yRWFjaChmdW5jdGlvbihlbCl7CiAgICBpZiAoIWVsLmhpZGRlbikgb3Blbi5wdXNoKGVsLmlkKTsKICB9KTsKICByZXR1cm4geyB5OiB3aW5kb3cuc2Nyb2xsWSB8fCAwLCBvcGVuOiBvcGVuIH07Cn0KCmZ1bmN0aW9uIHJlc3RvcmVWaWV3',
  'KGtlZXApewogIGtlZXAub3Blbi5mb3JFYWNoKGZ1bmN0aW9uKGlkKXsKICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTsKICAgIGlmIChlbCkgeyBlbC5oaWRkZW4gPSBmYWxzZTsgdmFyIGIgPSBlbC5wcmV2aW91c0VsZW1lbnRTaWJsaW5n',
  'OwogICAgICAgICAgICAgIGlmIChiKSBiLnRleHRDb250ZW50ID0gYi50ZXh0Q29udGVudC5yZXBsYWNlKCfilr4nLCAn4pa0Jyk7IH0KICB9KTsKICBpZiAoa2VlcC55KSB3aW5kb3cuc2Nyb2xsVG8oMCwga2VlcC55KTsKfQoKLyoqIOC5gOC4leC4tOC4oeC4leC4',
  'seC4p+C5gOC4peC4t+C4reC4geC4m+C4teC5g+C4meC5geC4luC4muC4muC4meC5g+C4q+C5ieC4leC4o+C4h+C4geC4seC4muC4guC5ieC4reC4oeC4ueC4peC4iOC4o+C4tOC4h+C4guC4reC4h+C4q+C4meC5ieC4suC4meC4seC5ieC4mSAqLwpmdW5jdGlvbiBz',
  'eW5jWWVhck9wdGlvbnMoeWVhcnMpewogIHZhciBzZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgneWVhclNlbCcpOwogIHZhciBsaXN0ID0gKHllYXJzIHx8IFtdKS5zbGljZSgpLnNvcnQoZnVuY3Rpb24oYSxiKXtyZXR1cm4gYi1hO30pOwogIHZhciBjdXIg',
  'PSBuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCk7CiAgaWYgKGxpc3QuaW5kZXhPZihjdXIpIDwgMCkgbGlzdC51bnNoaWZ0KGN1cik7CiAgdmFyIGh0bWwgPSAnPG9wdGlvbiB2YWx1ZT0iYWxsIj7guJfguLjguIHguJvguLU8L29wdGlvbj4nOwogIGxpc3QuZm9yRWFj',
  'aChmdW5jdGlvbih5KXsKICAgIGh0bWwgKz0gJzxvcHRpb24gdmFsdWU9IicgKyB5ICsgJyI+4Lib4Li1ICcgKyB5ICsgJyAo4LieLuC4qC4gJyArIChOdW1iZXIoeSkrNTQzKSArICcpPC9vcHRpb24+JzsKICB9KTsKICBzZWwuaW5uZXJIVE1MID0gaHRtbDsKICBp',
  'ZiAobGlzdC5pbmRleE9mKE51bWJlcihTLnllYXIpKSA8IDAgJiYgUy55ZWFyICE9PSAnYWxsJykgUy55ZWFyID0gU3RyaW5nKGN1cik7CiAgc2VsLnZhbHVlID0gUy55ZWFyOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC5guC4q+C4oeC4lOC4lOC4ueC4reC4ouC5',
  'iOC4suC4h+C5gOC4lOC4teC4ouC4pyAtLS0tLS0tLS0tLS0tLS0tCiAgIOC4neC4seC5iOC4h+C5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jOC4geC4seC4meC5hOC4p+C5ieC5geC4peC5ieC4p+C5g+C4meC4n+C4seC4h+C4geC5jOC4iuC4seC4mSBh',
  'cGkoKSDguJXguKPguIfguJnguLXguYnguYHguITguYjguIvguYjguK3guJnguJvguLjguYjguKHguJfguLXguYjguIHguJTguYTguJvguIHguYfguJfguLPguYTguKHguYjguYTguJTguYkKICAg4LmA4Lie4Li34LmI4Lit4LmE4Lih4LmI4LmD4Lir4LmJ4Lic4Li5',
  '4LmJ4LiX4Li14LmI4LmA4Lib4Li04LiU4LiU4LmJ4Lin4Lii4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4Liq4Lix4Lia4Liq4LiZICovCnZhciBFRElUX0VOVFJZUE9JTlRTID0gL1xiKGZvcm1EZWJ0fGZvcm1EZWJ0UGF5bWVudHxmb3JtUHVyY2hhc2V8Zm9y',
  'bUFjfGZvcm1CdWxrQWN8Zm9ybVJlcGFpcnxmb3JtQnVpbGRpbmd8Zm9ybVJvb218Zm9ybUZpbmFuY2V8Zm9ybVVzZXJ8ZGVsRGVidHxkZWxEZWJ0UGF5bWVudHxkZWxQdXJjaGFzZXxkZWxBY3xkZWxSZXBhaXJ8ZGVsQnVpbGRpbmd8ZGVsRmluYW5jZXxkZWxVc2Vy',
  'fGRvSW1wb3J0SnNvbnxkb1JvdGF0ZVNoYXJlfGRvQmFja3VwTm93fHNhdmVTZXR0aW5nc0Zvcm0pXHMqXCgvOwoKZnVuY3Rpb24gYXBwbHlSZWFkT25seShyb290KXsKICBpZiAoY2FuRWRpdCgpKSByZXR1cm47CiAgdmFyIG5vZGVzID0gcm9vdC5xdWVyeVNlbGVj',
  'dG9yQWxsKCdbb25jbGlja10nKTsKICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7CiAgICBpZiAoRURJVF9FTlRSWVBPSU5UUy50ZXN0KG5vZGVzW2ldLmdldEF0dHJpYnV0ZSgnb25jbGljaycpIHx8ICcnKSkgbm9kZXNbaV0ucmVtb3Zl',
  'KCk7CiAgfQp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4o+C4teC5gOC4n+C4o+C4iuC4reC4seC4leC5guC4meC4oeC4seC4leC4tOC5gOC4oeC4t+C5iOC4reC4guC5ieC4reC4oeC4ueC4peC5g+C4meC4iuC4teC4leC5gOC4m+C4peC4teC5iOC4ouC4mSAtLS0t',
  'LS0tLS0tLS0tLS0tCgogICDguIHguI7guYDguKvguKXguYfguIHguILguK3guIfguKrguYjguKfguJnguJnguLXguYk6IOC4q+C5ieC4suC4oeC5guC4q+C4peC4lOC4l+C4seC4muC4quC4tOC5iOC4h+C4l+C4teC5iOC4nOC4ueC5ieC5g+C4iuC5ieC4geC4s+C4',
  'peC4seC4h+C4nuC4tOC4oeC4nuC5jOC4reC4ouC4ueC5iOC5gOC4lOC5h+C4lOC4guC4suC4lAogICDguJbguYnguLLguKHguLXguILguYnguK3guKHguLnguKXguYPguKvguKHguYjguJXguK3guJnguJfguLXguYjguJzguLnguYnguYPguIrguYnguIHguLPguKXg',
  'uLHguIfguIHguKPguK3guIHguK3guKLguLnguYgg4LmD4Lir4LmJ4LiC4Li24LmJ4LiZ4Lib4Li44LmI4Lih4LmA4Lil4LmH4LiBIOC5hiDguYPguKvguYnguIHguJTguYDguK3guIfguYDguKHguLfguYjguK3guJ7guKPguYnguK3guKEKCiAgIOC4q+C4oeC4suC4',
  'ouC5gOC4q+C4leC4uDog4Lij4Li44LmI4LiZ4LiC4LmJ4Lit4Lih4Li54Lil4LiU4Li54LiI4Liy4LiBICLguYDguKfguKXguLLguJfguLXguYjguIrguLXguJXguJbguLnguIHguYHguIHguYnguKXguYjguLLguKrguLjguJQiIOC4guC4reC4hyBHb29nbGUgRHJp',
  'dmUKICAg4LiL4Li24LmI4LiH4LiC4Lii4Lix4Lia4LiX4Li44LiB4LiE4Lij4Lix4LmJ4LiH4LiX4Li14LmI4Lih4Li14LiB4Liy4Lij4LmA4LiC4Li14Lii4LiZIOC4o+C4p+C4oeC4luC4tuC4h+C4leC4reC4meC4l+C4teC5iOC5gOC4o+C4suC5gOC4reC4h+C4',
  'geC4lOC4muC4seC4meC4l+C4tuC4geC4lOC5ieC4p+C4ogogICDguIjguLbguIfguJXguYnguK3guIfguIjguJTguKPguLjguYjguJnguYPguKvguKHguYjguYTguKfguYnguKvguKXguLHguIfguJrguLHguJnguJfguLbguIHguJfguLjguIHguITguKPguLHguYng',
  'uIcg4LmE4Lih4LmI4LiH4Lix4LmJ4LiZ4LiI4Liw4LmC4Lir4Lil4LiU4LiL4LmJ4Liz4LmB4Lil4Liw4LiC4Li24LmJ4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4LihCiAgIOC4p+C5iOC4siAi4Lih4Li14LiE4LiZ4LmB4LiB4LmJ4LiC4LmJ4Lit4Lih4Li54LilIiDg',
  'uJfguLHguYnguIfguJfguLXguYjguITguJnguYHguIHguYnguITguLfguK3guJzguLnguYnguYPguIrguYnguYDguK3guIcKLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovCgovKiog4LiE',
  '4Liz4Liq4Lix4LmI4LiH4LiX4Li14LmI4LiX4Liz4LmD4Lir4LmJ4LiC4LmJ4Lit4Lih4Li54Lil4LmD4LiZ4LiK4Li14LiV4LmA4Lib4Lil4Li14LmI4Lii4LiZICjguYPguKvguYnguJXguKPguIfguIHguLHguJogTVVUQVRJTkdfQUNUSU9OUyDguJ3guLHguYjg',
  'uIfguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYwpICovCnZhciBDTElFTlRfTVVUQVRJTkcgPSAvXC4oc2F2ZXxkZWxldGV8c2F2ZVBheW1lbnR8ZGVsZXRlUGF5bWVudHxidWxrQm9va3xpbXBvcnR8cm90YXRlVG9rZW58YmFja3VwTm93fHVwbG9hZHx0',
  'cmFzaHx0b2dnbGUpJC87CgovKioKICog4LmA4Lie4Li04LmI4LiH4LiB4LiU4Lia4Lix4LiZ4LiX4Li24LiB4LmA4Lit4LiHIOKAlCDguKvguJnguYnguLLguYLguKvguKXguJTguILguYnguK3guKHguLnguKXguYPguKvguKHguYjguYTguJvguYHguKXguYnguKfg',
  'uJXguK3guJnguIHguJTguJrguLHguJnguJfguLbguIEKICog4LiI4LiU4Lij4Li44LmI4LiZ4LiC4LmJ4Lit4Lih4Li54Lil4Lil4LmI4Liy4Liq4Li44LiU4LmE4Lin4LmJIOC5geC4peC4sOC4geC4seC4meC5hOC4oeC5iOC5g+C4q+C5ieC4o+C4reC4muC4leC4',
  'o+C4p+C4iOC4luC4seC4lOC5hOC4m+C5guC4q+C4peC4lOC4i+C5ieC4swogKiAo4LmA4Lic4Li34LmI4Lit4LmE4Lin4LmJIDIg4LiZ4Liy4LiX4Li1IOC5gOC4nuC4o+C4suC4sCBHb29nbGUgRHJpdmUg4Lit4Lix4Lib4LmA4LiU4LiV4LmA4Lin4Lil4Liy4LmB',
  '4LiB4LmJ4LmE4LiC4LiK4LmJ4Liy4LiB4Lin4LmI4Liy4LiB4Liy4Lij4LmA4LiC4Li14Lii4LiZ4LiI4Lij4Li04LiH4LmA4Lil4LmH4LiB4LiZ4LmJ4Lit4LiiKQogKi8KZnVuY3Rpb24gbWFya1NlbGZDaGFuZ2UoKXsKICBTLnNlbGZDaGFuZ2VVbnRpbCA9IERh',
  'dGUubm93KCkgKyAxMjAwMDA7CiAgY2xlYXJUaW1lb3V0KFMuc3luY1RpbWVyKTsKICBTLnN5bmNUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXsKICAgIHN5bmNWZXJzaW9uKCk7CiAgICByZWZyZXNoQWxlcnRzKCk7ICAgICAvLyDguIfguLLguJnguITguYng',
  'uLLguIfguK3guLLguIjguYDguJ7guLTguYjguKHguKvguKPguLfguK3guKXguJTguIjguLLguIHguKrguLTguYjguIfguJfguLXguYjguYDguJ7guLTguYjguIfguJrguLHguJnguJfguLbguIHguYTguJsKICB9LCAxNTAwKTsKfQoKZnVuY3Rpb24gc3luY1ZlcnNp',
  'b24oKXsKICBjYWxsQXBpKCdhcHAudmVyc2lvbicpCiAgICAudGhlbihmdW5jdGlvbih2KXsgaWYgKHYgJiYgdi52ZXJzaW9uKSBTLnZlcnNpb24gPSB2LnZlcnNpb247IH0pCiAgICAuY2F0Y2goZnVuY3Rpb24oKXsgLyog4LmE4Lin4LmJ4Lij4Lit4Lia4Lir4LiZ',
  '4LmJ4LiyICovIH0pOwp9CgovKiog4Lic4Li54LmJ4LmD4LiK4LmJ4LiB4Liz4Lil4Lix4LiH4LiB4Lij4Lit4LiB4LiC4LmJ4Lit4Lih4Li54Lil4Lit4Lii4Li54LmI4Lir4Lij4Li34Lit4LmA4Lib4Lil4LmI4LiyIOKAlCDguJbguYnguLLguYPguIrguYgg4Lir',
  '4LmJ4Liy4Lih4LmC4Lir4Lil4LiU4LiX4Lix4LiaICovCmZ1bmN0aW9uIHVzZXJJc0J1c3koKXsKICB2YXIgbW9kYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9kYWxSb290Jyk7CiAgaWYgKG1vZGFsICYmIG1vZGFsLmlubmVySFRNTCkgcmV0dXJuIHRy',
  'dWU7ICAgICAgICAgICAgICAvLyDguJ/guK3guKPguYzguKHguYDguJvguLTguJTguITguYnguLLguIfguK3guKLguLnguYgKICB2YXIgZWwgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50OwogIGlmIChlbCAmJiAvXihJTlBVVHxURVhUQVJFQXxTRUxFQ1QpJC8udGVz',
  'dChlbC50YWdOYW1lKSAmJgogICAgICBlbC50eXBlICE9PSAnYnV0dG9uJyAmJiBlbC50eXBlICE9PSAnc3VibWl0JykgcmV0dXJuIHRydWU7ICAgLy8g4LmA4LiE4Lit4Lij4LmM4LmA4LiL4Lit4Lij4LmM4Lit4Lii4Li54LmI4LmD4LiZ4LiK4LmI4Lit4LiH4LiB',
  '4Lij4Lit4LiBCiAgcmV0dXJuIGZhbHNlOwp9CgpmdW5jdGlvbiByZWZyZXNoTGFiZWwoc2VjKXsKICBpZiAoIXNlYykgcmV0dXJuICfguJvguLTguJTguIHguLLguKPguJXguKPguKfguIjguK3guLHguJXguYLguJnguKHguLHguJXguLQnOwogIGlmIChzZWMgJSAz',
  'NjAwID09PSAwKSByZXR1cm4gJ+C4leC4o+C4p+C4iOC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C4oeC5iOC4l+C4uOC4gSAnICsgKHNlYyAvIDM2MDApICsgJyDguIrguLHguYjguKfguYLguKHguIcnOwogIGlmIChzZWMgJSA2MCA9PT0gMCkgcmV0dXJuICfguJXg',
  'uKPguKfguIjguILguYnguK3guKHguLnguKXguYPguKvguKHguYjguJfguLjguIEgJyArIChzZWMgLyA2MCkgKyAnIOC4meC4suC4l+C4tSc7CiAgcmV0dXJuICfguJXguKPguKfguIjguILguYnguK3guKHguLnguKXguYPguKvguKHguYjguJfguLjguIEgJyArIHNl',
  'YyArICcg4Lin4Li04LiZ4Liy4LiX4Li1JzsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguJXguLHguKfguJrguK3guIHguKrguJbguLLguJnguLDguIHguLLguKPguIvguLTguIfguIHguYwgKOC4oeC4uOC4oeC4guC4p+C4suC4muC4mSkgLS0tLS0tLS0tLS0tLS0t',
  'LQoKICAg4Lir4LiZ4LmJ4Liy4LiX4Li14LmIOiDguJrguK3guIHguYPguKvguYnguKPguLnguYnguJXguKXguK3guJTguKfguYjguLLguJXguK3guJnguJnguLXguYnguILguYnguK3guKHguLnguKXguJXguKPguIfguIHguLHguJrguKvguKXguLHguIfguJrguYng',
  'uLLguJnguKvguKPguLfguK3guKLguLHguIcKICAg4LiB4Liz4Lil4Lix4LiH4Lia4Lix4LiZ4LiX4Li24LiB4Lit4Lii4Li54LmI4LmE4Lir4LihIOC4q+C4o+C4t+C4reC4oeC4teC4reC4sOC5hOC4o+C4hOC5ieC4suC4h+C4l+C4teC5iOC4leC5ieC4reC4h+C4',
  'iOC4seC4lOC4geC4suC4owoKICAg4LiV4Lix4LmJ4LiH4LmD4LiI4LmD4Lir4LmJICLguYDguIfguLXguKLguJrguYDguKHguLfguYjguK3guJfguLjguIHguK3guKLguYjguLLguIfguJvguIHguJXguLQg4LmB4Lil4Liw4LiK4Lix4LiU4LmA4LiI4LiZ4LmA4Lih',
  '4Li34LmI4Lit4Lih4Li14Lit4Liw4LmE4Lij4Lic4Li04LiU4Lib4LiB4LiV4Li0IgogICDguKrguJbguLLguJnguLDguJfguLXguYjguJXguYnguK3guIfguYPguKvguYnguJzguLnguYnguYPguIrguYnguJfguLPguK3guLDguYTguKPguJXguYjguK0gKOC4oeC4',
  'teC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C4oeC5iCAvIOC5gOC4iuC4t+C5iOC4reC4oeC4leC5iOC4reC5hOC4oeC5iOC5hOC4lOC5iSkg4LiB4LiU4LmE4LiU4LmJCi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0t',
  'LS0tLS0tLS0tLS0tLSAqLwoKdmFyIFNZTkMgPSB7IHN0YXRlOiAnc3luY2VkJywgZGV0YWlsOiAnJywgYXQ6IDAsIHRpbWVyOiBudWxsIH07Cgp2YXIgU1lOQ19MT09LID0gewogIHN5bmNlZDogIHsgY2xzOiAnb2snLCAgIGljb246ICfil48nLCAgdGV4dDogJ+C4',
  'i+C4tOC4h+C4geC5jOC5geC4peC5ieC4pycgfSwKICBzeW5jaW5nOiB7IGNsczogJ2luZm8nLCBpY29uOiAnJywgICB0ZXh0OiAn4LiB4Liz4Lil4Lix4LiH4LiL4Li04LiH4LiB4LmM4oCmJywgICBzcGluOiB0cnVlIH0sCiAgc2F2aW5nOiAgeyBjbHM6ICdpbmZv',
  'JywgaWNvbjogJycsICAgdGV4dDogJ+C4geC4s+C4peC4seC4h+C4muC4seC4meC4l+C4tuC4geKApicsICBzcGluOiB0cnVlIH0sCiAgc2F2ZWQ6ICAgeyBjbHM6ICdvaycsICAgaWNvbjogJ+KckycsICB0ZXh0OiAn4Lia4Lix4LiZ4LiX4Li24LiB4LmB4Lil4LmJ',
  '4LinJyB9LAogIHBlbmRpbmc6IHsgY2xzOiAnd2FybicsIGljb246ICfihrsnLCAgdGV4dDogJ+C4oeC4teC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C4oeC5iCcsICBjbGljazogJ2xvYWRQZW5kaW5nKCknIH0sCiAgb2ZmbGluZTogeyBjbHM6ICdkZ3InLCAgaWNv',
  'bjogJ+KaoCcsICB0ZXh0OiAn4LmA4LiK4Li34LmI4Lit4Lih4LiV4LmI4Lit4LmE4Lih4LmI4LmE4LiU4LmJJywgY2xpY2s6ICdyZXRyeVN5bmMoKScgfSwKICBlcnJvcjogICB7IGNsczogJ2RncicsICBpY29uOiAn4pqgJywgIHRleHQ6ICfguJrguLHguJnguJfg',
  'uLbguIHguYTguKHguYjguKrguLPguYDguKPguYfguIgnLCBjbGljazogJ3JldHJ5U3luYygpJyB9LAogIHBhdXNlZDogIHsgY2xzOiAnbXV0ZScsIGljb246ICfil4snLCAgdGV4dDogJ+C5hOC4oeC5iOC4leC4o+C4p+C4iOC4reC4seC4leC5guC4meC4oeC4seC4',
  'leC4tCcsIGNsaWNrOiAnbG9hZFBlbmRpbmcoKScgfQp9OwoKLyoqCiAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZSDguIrguLfguYjguK3guKrguJbguLLguJnguLDguYPguJkgU1lOQ19MT09LCiAqIEBwYXJhbSB7c3RyaW5nPX0gZGV0YWlsIOC4guC5ieC4reC4hOC4',
  'p+C4suC4oeC4reC4mOC4tOC4muC4suC4ouC5gOC4nuC4tOC5iOC4oSAo4LmC4Lic4Lil4LmI4LiV4Lit4LiZ4LmA4Lit4Liy4LmA4Lih4Liy4Liq4LmM4LiK4Li14LmJKQogKi8KZnVuY3Rpb24gc3luY1NldChzdGF0ZSwgZGV0YWlsKXsKICAvLyDguKrguJbguLLg',
  'uJnguLDguJfguLXguYjguJXguYnguK3guIfguYPguKvguYnguJzguLnguYnguYPguIrguYnguIjguLHguJTguIHguLLguKMg4Lir4LmJ4Liy4Lih4LiW4Li54LiB4Liq4LiW4Liy4LiZ4Liw4LiX4Lix4LmI4Lin4LmE4Lib4Lih4Liy4LiB4Lil4Lia4LiX4Li04LmJ',
  '4LiHCiAgaWYgKChTWU5DLnN0YXRlID09PSAncGVuZGluZycgfHwgU1lOQy5zdGF0ZSA9PT0gJ29mZmxpbmUnKSAmJgogICAgICAoc3RhdGUgPT09ICdzeW5jZWQnIHx8IHN0YXRlID09PSAnc3luY2luZycpKSByZXR1cm47CgogIFNZTkMuc3RhdGUgPSBzdGF0ZTsK',
  'ICBTWU5DLmRldGFpbCA9IGRldGFpbCB8fCAnJzsKICBpZiAoc3RhdGUgPT09ICdzeW5jZWQnIHx8IHN0YXRlID09PSAnc2F2ZWQnKSBTWU5DLmF0ID0gRGF0ZS5ub3coKTsKICBzeW5jUGFpbnQoKTsKCiAgY2xlYXJUaW1lb3V0KFNZTkMudGltZXIpOwogIGlmIChz',
  'dGF0ZSA9PT0gJ3NhdmVkJykgeyAgICAgICAgICAgICAgICAgICAgICAgLy8g4LmC4LiK4Lin4LmMICLguJrguLHguJnguJfguLbguIHguYHguKXguYnguKciIOC5geC4m+C5iuC4muC5gOC4lOC4teC4ouC4p+C5geC4peC5ieC4p+C4geC4peC4seC4muC5hOC4m+C4',
  'm+C4geC4leC4tAogICAgU1lOQy50aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXsKICAgICAgaWYgKFNZTkMuc3RhdGUgPT09ICdzYXZlZCcpIHN5bmNTZXQoJ3N5bmNlZCcpOwogICAgfSwgMjYwMCk7CiAgfQp9CgpmdW5jdGlvbiBzeW5jUGFpbnQoKXsKICB2',
  'YXIgZG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xpdmVEb3QnKTsKICBpZiAoIWRvdCkgcmV0dXJuOwogIHZhciBsb29rID0gU1lOQ19MT09LW1NZTkMuc3RhdGVdIHx8IFNZTkNfTE9PSy5zeW5jZWQ7CgogIHZhciB0aXAgPSBTWU5DLmRldGFpbCB8fCBz',
  'eW5jVG9vbHRpcCgpOwogIC8vIOC4q+C5iOC4reC4guC5ieC4reC4hOC4p+C4suC4oeC5hOC4p+C5iSDguYDguJ7guLfguYjguK3guYPguKvguYnguIjguK3guYHguITguJrguIvguYjguK3guJnguYDguInguJ7guLLguLDguILguYnguK3guITguKfguLLguKHguYHg',
  'uKXguLDguKLguLHguIfguYDguKvguYfguJnguYTguK3guITguK3guJnguK3guKLguLnguYgKICB2YXIgYm9keSA9IChsb29rLnNwaW4gPyAnPHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4gJyA6IChsb29rLmljb24gPyBsb29rLmljb24gKyAnICcgOiAnJykpICsK',
  'ICAgICAgICAgICAgICc8c3BhbiBjbGFzcz0ic3luYy1sYWJlbCI+JyArIGxvb2sudGV4dCArICc8L3NwYW4+JzsKICB2YXIgY2xzID0gJ2IgJyArIGxvb2suY2xzICsgJyBzeW5jLXBpbGwnOwoKICBkb3QuaW5uZXJIVE1MID0gbG9vay5jbGljawogICAgPyAnPGJ1',
  'dHRvbiBjbGFzcz0iJyArIGNscyArICciIHN0eWxlPSJib3JkZXI6MDtjdXJzb3I6cG9pbnRlcjtmb250OmluaGVyaXQiICcgKwogICAgICAndGl0bGU9IicgKyBlc2ModGlwKSArICciIG9uY2xpY2s9IicgKyBsb29rLmNsaWNrICsgJyI+JyArIGJvZHkgKyAnPC9i',
  'dXR0b24+JwogICAgOiAnPHNwYW4gY2xhc3M9IicgKyBjbHMgKyAnIiB0aXRsZT0iJyArIGVzYyh0aXApICsgJyI+JyArIGJvZHkgKyAnPC9zcGFuPic7Cn0KCmZ1bmN0aW9uIHN5bmNUb29sdGlwKCl7CiAgdmFyIGJhc2UgPSByZWZyZXNoTGFiZWwoUE9MTF9TRUNP',
  'TkRTKSArICcgwrcg4LmE4Lih4LmI4LmC4Lir4Lil4LiU4LiX4Lix4Lia4LiV4Lit4LiZ4LiB4Liz4Lil4Lix4LiH4LiB4Lij4Lit4LiB4LiC4LmJ4Lit4Lih4Li54LilJzsKICBpZiAoIVNZTkMuYXQpIHJldHVybiBiYXNlOwogIHZhciBkID0gbmV3IERhdGUoU1lO',
  'Qy5hdCk7CiAgdmFyIGhoID0gKCcwJyArIGQuZ2V0SG91cnMoKSkuc2xpY2UoLTIpLCBtbSA9ICgnMCcgKyBkLmdldE1pbnV0ZXMoKSkuc2xpY2UoLTIpOwogIHJldHVybiAn4LiV4Lij4LiH4LiB4Lix4Lia4LiC4LmJ4Lit4Lih4Li54Lil4Lir4Lil4Lix4LiH4Lia',
  '4LmJ4Liy4LiZ4LmA4Lih4Li34LmI4LitICcgKyBoaCArICc6JyArIG1tICsgJyDguJkuXG4nICsgYmFzZTsKfQoKLyoqIOC5gOC4meC5h+C4leC4quC4sOC4lOC4uOC4lC/guKvguKXguLjguJQg4LiV4LmI4Liy4LiH4LiI4Liy4LiBICLguYDguIvguLTguKPguYzg',
  'uJ/guYDguKfguK3guKPguYzguJXguK3guJrguKfguYjguLLguJfguLPguYTguKHguYjguYTguJTguYkiIOC4i+C4tuC5iOC4h+C5gOC4m+C5h+C4meC4hOC4p+C4suC4oeC4nOC4tOC4lOC4guC4reC4h+C4hOC4s+C4quC4seC5iOC4hyAqLwpmdW5jdGlvbiBpc09m',
  'ZmxpbmVFcnJvcihlKXsKICBpZiAodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLm9uTGluZSA9PT0gZmFsc2UpIHJldHVybiB0cnVlOwogIHZhciBtID0gU3RyaW5nKChlICYmIGUubWVzc2FnZSkgfHwgZSB8fCAnJyk7CiAgcmV0',
  'dXJuIC9uZXR3b3JrfGZhaWxlZHx0aW1lb3V0fOC5gOC4hOC4o+C4t+C4reC4guC5iOC4suC4onzguYDguIrguLfguYjguK3guKHguJXguYjguK184LmE4Lih4LmI4LmE4LiU4LmJ4Lij4Lix4Lia4LiC4LmJ4Lit4Lih4Li54Lil4LiI4Liy4LiB4LmA4LiL4Li04Lij',
  '4LmM4Lif4LmA4Lin4Lit4Lij4LmML2kudGVzdChtKTsKfQoKLyoqIOC4nOC4ueC5ieC5g+C4iuC5ieC4geC4lOC4l+C4teC5iOC4leC4seC4p+C4muC4reC4geC4quC4luC4suC4meC4sOC4leC4reC4meC4oeC4teC4m+C4seC4jeC4q+C4siDigJQg4Lil4Lit4LiH',
  '4LmD4Lir4Lih4LmI4LiX4Lix4LiZ4LiX4Li1ICovCmZ1bmN0aW9uIHJldHJ5U3luYygpewogIFNZTkMuc3RhdGUgPSAnc3luY2luZyc7CiAgc3luY1BhaW50KCk7CiAgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwp9CgovKiog4LmC4Lir4Lil4LiU4LiC4LmJ4Lit4Lih',
  '4Li54Lil4LmD4Lir4Lih4LmI4LiV4Lit4LiZ4LiX4Li14LmI4Lic4Li54LmJ4LmD4LiK4LmJ4Lie4Lij4LmJ4Lit4LihICjguIHguJTguIjguLLguIHguJvguYnguLLguKIgIuC4oeC4teC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C4oeC5iCIpICovCmZ1bmN0aW9u',
  'IGxvYWRQZW5kaW5nKCl7CiAgU1lOQy5zdGF0ZSA9ICdzeW5jaW5nJzsKICBzeW5jUGFpbnQoKTsKICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7Cn0KCnZhciBQT0xMX1NFQ09ORFMgPSAwOwp2YXIgUE9MTF9USU1FUiA9IG51bGw7CgpmdW5jdGlvbiBzdGFydFBvbGxp',
  'bmcoc2Vjb25kcyl7CiAgdmFyIHNlYyA9IE51bWJlcihzZWNvbmRzIHx8IDApOwogIFBPTExfU0VDT05EUyA9IHNlYzsKICBjbGVhckludGVydmFsKFBPTExfVElNRVIpOwoKICBpZiAoIXNlYykgeyBzeW5jU2V0KCdwYXVzZWQnKTsgcmV0dXJuOyB9ICAgLy8g4Lib',
  '4Li04LiU4LiB4Liy4Lij4LiV4Lij4Lin4LiI4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0IOKAlCDguIHguJTguJfguLXguYjguJvguYnguLLguKLguYDguJ7guLfguYjguK3guIvguLTguIfguIHguYzguYDguK3guIfguYTguJTguYkKICBzeW5jU2V0KCdzeW5j',
  'ZWQnKTsKCiAgUE9MTF9USU1FUiA9IHNldEludGVydmFsKGZ1bmN0aW9uKCl7CiAgICBpZiAoZG9jdW1lbnQuaGlkZGVuKSByZXR1cm47CiAgICBjYWxsQXBpKCdhcHAudmVyc2lvbicpLnRoZW4oZnVuY3Rpb24odil7CiAgICAgIGlmIChTWU5DLnN0YXRlID09PSAn',
  'b2ZmbGluZScpIHN5bmNTZXQoJ3N5bmNlZCcpOyAgIC8vIOC4geC4peC4seC4muC4oeC4suC4leC5iOC4reC5hOC4lOC5ieC5geC4peC5ieC4pwogICAgICBpZiAoIXYgfHwgIXYudmVyc2lvbiB8fCB2LnZlcnNpb24gPT09IFMudmVyc2lvbikgcmV0dXJuOwogICAg',
  'ICBTLnZlcnNpb24gPSB2LnZlcnNpb247CgogICAgICAvLyDguYDguKPguLLguYDguJvguYfguJnguITguJnguYHguIHguYnguYDguK3guIcg4LmB4Lil4Liw4Lir4LiZ4LmJ4Liy4LiB4LmH4LiL4Li04LiH4LiB4LmM4LmE4Lib4LmB4Lil4LmJ4Lin4LiV4Lit4LiZ',
  '4LiB4LiU4Lia4Lix4LiZ4LiX4Li24LiBCiAgICAgIGlmIChEYXRlLm5vdygpIDwgUy5zZWxmQ2hhbmdlVW50aWwpIHJldHVybjsKCiAgICAgIC8vIOC4geC4s+C4peC4seC4h+C4geC4o+C4reC4geC4guC5ieC4reC4oeC4ueC4peC4reC4ouC4ueC5iCDigJQg4Lir',
  '4LmJ4Liy4Lih4LmC4Lir4Lil4LiU4LiX4Lix4LiaIOC4o+C4reC5g+C4q+C5ieC4nOC4ueC5ieC5g+C4iuC5ieC4geC4lOC5gOC4reC4hwogICAgICBpZiAodXNlcklzQnVzeSgpKSB7IHN5bmNTZXQoJ3BlbmRpbmcnKTsgcmV0dXJuOyB9CgogICAgICAvLyDguIvg',
  'uLTguIfguIHguYzguYDguIfguLXguKLguJog4LmGIOC5hOC4oeC5iOC4peC5ieC4suC4h+C4q+C4meC5ieC4siDguYTguKHguYjguYDguJTguYnguIfguIHguKXguLHguJrguYTguJvguJrguJnguKrguLjguJQKICAgICAgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwog',
  'ICAgICByZWZyZXNoQWxlcnRzKCk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgc3luY1NldChpc09mZmxpbmVFcnJvcihlKSA/ICdvZmZsaW5lJyA6ICdlcnJvcicsIChlICYmIGUubWVzc2FnZSkgfHwgU3RyaW5nKGUpKTsKICAgIH0pOwogIH0sIHNl',
  'YyAqIDEwMDApOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4qOC4ueC4meC4ouC5jOC5geC4iOC5ieC4h+C5gOC4leC4t+C4reC4mSAtLS0tLS0tLS0tLS0tLS0tCgogICDguJXguLHguKfguYDguKXguILguJrguJnguYDguKHguJnguLkgKOC5gOC4iuC5iOC4mSA2',
  'IOC4q+C4peC4seC4hyAi4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMIikg4LiB4Lix4Lia4LiB4Lil4LmI4Lit4LiH4LmB4LiI4LmJ4LiH4LmA4LiV4Li34Lit4LiZ4Lia4LiZ4LmB4LiW4Lia4Lir4Lix4LinCiAgIOC5g+C4iuC5ieC4guC5ieC4reC4oeC4ueC4peC4',
  'iuC4uOC4lOC5gOC4lOC4teC4ouC4p+C4geC4seC4meC4iOC4suC4geC4hOC4s+C4quC4seC5iOC4hyBhcHAuYWxlcnRzIOC4i+C4tuC5iOC4h+C5gOC4muC4suC4geC4p+C5iOC4suC5geC4lOC4iuC4muC4reC4o+C5jOC4lOC4oeC4suC4gQoKICAg4Lit4Lix4Lib',
  '4LmA4LiU4LiV4LmA4Lih4Li34LmI4LitOiDguYDguJvguLTguJTguKPguLDguJrguJogwrcg4Lir4Lil4Lix4LiH4LiB4LiU4Lia4Lix4LiZ4LiX4Li24LiBL+C4peC4muC4l+C4uOC4geC4hOC4o+C4seC5ieC4hyDCtyDguJfguLjguIHguKPguK3guJrguJXguKPg',
  'uKfguIjguILguYnguK3guKHguLnguKUKICAg4LmA4LiU4Li04Lih4LiV4Lix4Lin4LmA4Lil4LiC4LiZ4Li14LmJ4Lit4Lix4Lib4LmA4LiU4LiV4LiV4Lit4LiZ4LmA4Lib4Li04LiU4Lir4LiZ4LmJ4Liy4LmB4LiU4LiK4Lia4Lit4Lij4LmM4LiU4Lit4Lii4LmI',
  '4Liy4LiH4LmA4LiU4Li14Lii4LinCiAgIOC5hOC4m+C4reC4ouC4ueC5iOC4q+C4meC5ieC4suC4reC4t+C5iOC4meC5geC4peC5ieC4p+C4leC4seC4p+C5gOC4peC4guC4iOC4tuC4h+C4hOC5ieC4suC4h+C4reC4ouC4ueC5iOC4l+C4teC5iOC4hOC5iOC4suC5',
  'gOC4geC5iOC4sgotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi8KCnZhciBBTEVSVFMgPSB7IGNvdW50czoge30sIGl0ZW1zOiBbXSwgdG90YWw6IDAsIHVyZ2VudDogMCwgYXQ6ICcnIH07',
  'CgpmdW5jdGlvbiByZWZyZXNoQWxlcnRzKCl7CiAgcmV0dXJuIGNhbGxBcGkoJ2FwcC5hbGVydHMnKS50aGVuKGZ1bmN0aW9uKGEpewogICAgQUxFUlRTID0gYSB8fCBBTEVSVFM7CiAgICBwYWludEJhZGdlcygpOwogICAgcGFpbnRCZWxsKCk7CiAgICBpZiAoZG9j',
  'dW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25vdGlmUGFuZWwnKSkgcmVuZGVyTm90aWZQYW5lbCgpOyAgIC8vIOC5gOC4m+C4tOC4lOC4hOC5ieC4suC4h+C4reC4ouC4ueC5iCDguYPguKvguYnguK3guLHguJvguYDguJTguJXguJXguLLguKEKICAgIHJldHVybiBhOwog',
  'IH0pLmNhdGNoKGZ1bmN0aW9uKCl7IC8qIOC5gOC4meC5h+C4leC4quC4sOC4lOC4uOC4lCDguYTguKfguYnguKPguK3guJrguKvguJnguYnguLIgKi8gfSk7Cn0KCi8qKiDguJXguLHguKfguYDguKXguILguJrguJnguYDguKHguJnguLnguIvguYnguLLguKIg4oCU',
  'IOC4muC4reC4geC4iOC4s+C4meC4p+C4meC4h+C4suC4meC4l+C4teC5iOC4ouC4seC4h+C4hOC5ieC4suC4h+C4reC4ouC4ueC5iOC4guC4reC4h+C5geC4leC5iOC4peC4sOC5guC4oeC4lOC4ueC4pSAqLwpmdW5jdGlvbiBwYWludEJhZGdlcygpewogIHZhciBj',
  'ID0gQUxFUlRTLmNvdW50cyB8fCB7fTsKICBQQUdFUy5mb3JFYWNoKGZ1bmN0aW9uKHApeyBzZXRCYWRnZShwLmlkLCBjW3AuaWRdIHx8IDApOyB9KTsKfQoKZnVuY3Rpb24gc2V0QmFkZ2UocGFnZSwgbil7CiAgW2RvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiYWRn',
  'ZS0nICsgcGFnZSksIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YWJiYWRnZS0nICsgcGFnZSldCiAgICAuZm9yRWFjaChmdW5jdGlvbihlbCl7IGlmIChlbCkgcGFpbnRCYWRnZShlbCwgbik7IH0pOwoKICAvLyDguIfguLLguJnguITguYnguLLguIfguILguK3g',
  'uIfguKvguJnguYnguLLguJfguLXguYjguYTguKHguYjguKHguLXguYHguJfguYfguJog4LmD4Lir4LmJ4LmE4Lib4Lij4Lin4Lih4Lit4Lii4Li54LmI4LiX4Li14LmI4Lib4Li44LmI4LihICLguYDguJ7guLTguYjguKHguYDguJXguLTguKEiIOC5hOC4oeC5iOC4',
  'h+C4seC5ieC4meC4muC4meC4oeC4t+C4reC4luC4t+C4reC4iOC4sOC4oeC4reC4h+C5hOC4oeC5iOC5gOC4q+C5h+C4meC5gOC4peC4ogogIHZhciBtb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhYmJhZGdlLW1vcmUnKTsKICBpZiAobW9yZSkgewog',
  'ICAgdmFyIGhpZGRlbiA9IFBBR0VTLmZpbHRlcihmdW5jdGlvbihwKXsgcmV0dXJuICFwLnRhYjsgfSkKICAgICAgLnJlZHVjZShmdW5jdGlvbihhLCBwKXsgcmV0dXJuIGEgKyAoKEFMRVJUUy5jb3VudHMgfHwge30pW3AuaWRdIHx8IDApOyB9LCAwKTsKICAgIHBh',
  'aW50QmFkZ2UobW9yZSwgaGlkZGVuKTsKICB9Cn0KCmZ1bmN0aW9uIHBhaW50QmFkZ2UoZWwsIG4pewogIGlmIChuID4gMCkgewogICAgZWwudGV4dENvbnRlbnQgPSBuID4gOTkgPyAnOTkrJyA6IG47CiAgICBlbC5zdHlsZS5kaXNwbGF5ID0gJyc7CiAgICBlbC50',
  'aXRsZSA9ICfguKLguLHguIfguITguYnguLLguIfguK3guKLguLnguYggJyArIG4gKyAnIOC4o+C4suC4ouC4geC4suC4oyc7CiAgfSBlbHNlIHsKICAgIGVsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7CiAgfQp9CgovKiAtLS0tIOC4geC4o+C4sOC4lOC4tOC5iOC4',
  'h+C4muC4meC5geC4luC4muC4q+C4seC4pyAtLS0tICovCgpmdW5jdGlvbiBwYWludEJlbGwoKXsKICB2YXIgd3JhcCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiZWxsV3JhcCcpOwogIGlmICghd3JhcCkgcmV0dXJuOwoKICAvLyDguKfguLLguJTguYDguIng',
  'uJ7guLLguLDguJXguLHguKfguJvguLjguYjguKEg4Lir4LmJ4Liy4Lih4LmA4LiC4Li14Lii4LiZ4LiX4Lix4Lia4LiX4Lix4LmJ4LiHIGJlbGxXcmFwCiAgLy8g4LmA4Lie4Lij4Liy4Liw4LiB4Lil4LmI4Lit4LiH4LmB4LiI4LmJ4LiH4LmA4LiV4Li34Lit4LiZ',
  '4LiX4Li14LmI4LmA4Lib4Li04LiU4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmI4LiB4LmH4LmA4Lib4LmH4LiZ4Lil4Li54LiB4LiC4Lit4LiHIGJlbGxXcmFwIOC5gOC4q+C4oeC4t+C4reC4meC4geC4seC4mQogIHZhciBzbG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVu',
  'dEJ5SWQoJ2JlbGxTbG90Jyk7CiAgaWYgKCFzbG90KSB7CiAgICBzbG90ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpOwogICAgc2xvdC5pZCA9ICdiZWxsU2xvdCc7CiAgICB3cmFwLmluc2VydEJlZm9yZShzbG90LCB3cmFwLmZpcnN0Q2hpbGQpOwog',
  'IH0KCiAgdmFyIG4gPSBBTEVSVFMudG90YWwgfHwgMDsKICB2YXIgdXJnZW50ID0gQUxFUlRTLnVyZ2VudCB8fCAwOwogIHNsb3QuaW5uZXJIVE1MID0KICAgICc8YnV0dG9uIGNsYXNzPSJidG4gaWNvbiBiZWxsIiBpZD0iYmVsbEJ0biIgb25jbGljaz0idG9nZ2xl',
  'Tm90aWYoKSIgJyArCiAgICAgICd0aXRsZT0iJyArIChuID8gJ+C4oeC4tSAnICsgbiArICcg4LmA4Lij4Li34LmI4Lit4LiH4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LiU4Li5JyA6ICfguYTguKHguYjguKHguLXguIfguLLguJnguITguYnguLLguIcnKSArICciICcg',
  'KwogICAgICAnYXJpYS1sYWJlbD0i4LiB4Liy4Lij4LmB4LiI4LmJ4LiH4LmA4LiV4Li34Lit4LiZIj7wn5SUJyArCiAgICAgIChuID8gJzxzcGFuIGNsYXNzPSJiZWxsLWRvdCcgKyAodXJnZW50ID8gJyB1cmdlbnQnIDogJycpICsgJyI+JyArIChuID4gOTkgPyAn',
  'OTkrJyA6IG4pICsgJzwvc3Bhbj4nIDogJycpICsKICAgICc8L2J1dHRvbj4nOwp9CgpmdW5jdGlvbiB0b2dnbGVOb3RpZigpewogIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbm90aWZQYW5lbCcpKSByZXR1cm4gY2xvc2VOb3RpZigpOwogIHZhciB3cmFw',
  'ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JlbGxXcmFwJyk7CiAgaWYgKCF3cmFwKSByZXR1cm47CiAgdmFyIHBhbmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgcGFuZWwuaWQgPSAnbm90aWZQYW5lbCc7CiAgcGFuZWwuY2xhc3NOYW1l',
  'ID0gJ25vdGlmJzsKICB3cmFwLmFwcGVuZENoaWxkKHBhbmVsKTsKICByZW5kZXJOb3RpZlBhbmVsKCk7CiAgc2V0VGltZW91dChmdW5jdGlvbigpeyBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIG5vdGlmT3V0c2lkZSwgdHJ1ZSk7IH0sIDApOwog',
  'IHJlZnJlc2hBbGVydHMoKTsgICAgICAgICAgICAgICAgICAgICAgLy8g4LmA4Lib4Li04LiU4LiX4Li14LmE4Lij4LiB4LmH4LiU4Li24LiH4LiC4Lit4LiH4Lil4LmI4Liy4Liq4Li44LiU4Lih4Liy4LmD4Lir4LmJ4LiU4LmJ4Lin4LiiCn0KCmZ1bmN0aW9uIGNs',
  'b3NlTm90aWYoKXsKICB2YXIgcCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdub3RpZlBhbmVsJyk7CiAgaWYgKHApIHAucmVtb3ZlKCk7CiAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBub3RpZk91dHNpZGUsIHRydWUpOwp9CgpmdW5j',
  'dGlvbiBub3RpZk91dHNpZGUoZSl7CiAgdmFyIHdyYXAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmVsbFdyYXAnKTsKICBpZiAod3JhcCAmJiAhd3JhcC5jb250YWlucyhlLnRhcmdldCkpIGNsb3NlTm90aWYoKTsKfQoKdmFyIE5PVElGX0dST1VQUyA9IFsK',
  'ICB7IG1vZHVsZToncmVwYWlycycsICAgaWM6J/CflKcnLCBsYWJlbDon4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiE4LmJ4Liy4LiHJyB9LAogIHsgbW9kdWxlOidhYycsICAgICAgICBpYzon4p2E77iPJywgbGFiZWw6J+C4peC5ieC4suC4h+C5geC4reC4o+C5jOC4',
  'luC4tuC4h+C4geC4s+C4q+C4meC4lCcgfSwKICB7IG1vZHVsZTonYnVpbGRpbmcnLCAgaWM6J/Cfj6InLCBsYWJlbDon4LiH4Liy4LiZ4LiV4Li24LiB4Liq4LmI4Lin4LiZ4LiB4Lil4Liy4LiHJyB9LAogIHsgbW9kdWxlOidwdXJjaGFzZXMnLCBpYzon8J+boe+4',
  'jycsIGxhYmVsOifguJvguKPguLDguIHguLHguJnguYPguIHguKXguYnguKvguKHguJQnIH0sCiAgeyBtb2R1bGU6J2ZpbmFuY2UnLCAgIGljOifwn6e+JywgbGFiZWw6J+C4muC4tOC4peC4o+C4suC4ouC5gOC4lOC4t+C4reC4mScgfQpdOwoKZnVuY3Rpb24gcmVu',
  'ZGVyTm90aWZQYW5lbCgpewogIHZhciBwYW5lbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdub3RpZlBhbmVsJyk7CiAgaWYgKCFwYW5lbCkgcmV0dXJuOwogIHZhciBpdGVtcyA9IEFMRVJUUy5pdGVtcyB8fCBbXTsKCiAgdmFyIGhlYWQgPSAnPGRpdiBjbGFz',
  'cz0ibm90aWYtaCI+PGI+4LiB4Liy4Lij4LmB4LiI4LmJ4LiH4LmA4LiV4Li34Lit4LiZPC9iPicgKwogICAgJzxzcGFuIGNsYXNzPSJzcCI+JyArCiAgICAgIChpdGVtcy5sZW5ndGggPyAnPHNwYW4gY2xhc3M9ImIgJyArIChBTEVSVFMudXJnZW50ID8gJ2Rncicg',
  'OiAnd2FybicpICsgJyI+JyArIGl0ZW1zLmxlbmd0aCArICcg4LmA4Lij4Li34LmI4Lit4LiHPC9zcGFuPicgOiAnJykgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24iIHRpdGxlPSLguJTguLbguIfguILguYnguK3guKHguLnguKXguKXguYjguLLg',
  'uKrguLjguJQiIG9uY2xpY2s9InJlZnJlc2hBbGVydHMoKSI+4oa7PC9idXR0b24+JyArCiAgICAnPC9zcGFuPjwvZGl2Pic7CgogIGlmICghaXRlbXMubGVuZ3RoKSB7CiAgICBwYW5lbC5pbm5lckhUTUwgPSBoZWFkICsKICAgICAgJzxkaXYgY2xhc3M9Im5vdGlm',
  'LWVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPuKchTwvZGl2PuC5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4hOC5ieC4suC4hzxicj4nICsKICAgICAgJzxzcGFuIGNsYXNzPSJmczEyIGZhaW50Ij7guJfguLjguIHguK3guKLguYjguLLguIfguYDguKPguLXguKLguJrg',
  'uKPguYnguK3guKLguJTguLU8L3NwYW4+PC9kaXY+JzsKICAgIHJldHVybjsKICB9CgogIC8vIOC4iOC4seC4lOC4geC4peC4uOC5iOC4oeC4leC4suC4oeC5guC4oeC4lOC4ueC4pSDguYDguKPguLXguKLguIfguJXguLLguKHguKXguLPguJTguLHguJrguJfguLXg',
  'uYjguJzguLnguYnguYPguIrguYnguKrguJnguYPguIjguIHguYjguK3guJkKICB2YXIgYm9keSA9ICcnOwogIE5PVElGX0dST1VQUy5mb3JFYWNoKGZ1bmN0aW9uKGcpewogICAgdmFyIGxpc3QgPSBpdGVtcy5maWx0ZXIoZnVuY3Rpb24oYSl7IHJldHVybiBhLm1v',
  'ZHVsZSA9PT0gZy5tb2R1bGU7IH0pOwogICAgaWYgKCFsaXN0Lmxlbmd0aCkgcmV0dXJuOwogICAgYm9keSArPSAnPGRpdiBjbGFzcz0ibm90aWYtc2VjIj4nICsgZy5pYyArICcgJyArIGVzYyhnLmxhYmVsKSArICcgKCcgKyBsaXN0Lmxlbmd0aCArICcpPC9kaXY+',
  'JzsKICAgIGxpc3Quc2xpY2UoMCwgOCkuZm9yRWFjaChmdW5jdGlvbihhKXsKICAgICAgYm9keSArPSAnPGJ1dHRvbiBjbGFzcz0ibm90aWYtaXRlbSBsLScgKyBlc2MoYS5sZXZlbCkgKyAnIiBvbmNsaWNrPSJnb3RvQWxlcnQoXCcnICsgZXNjKGEubW9kdWxlKSAr',
  'ICdcJykiPicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJ0dCI+JyArIGVzYyhhLnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgICAoYS5kZXRhaWwgPyAnPGRpdiBjbGFzcz0iZGQiPicgKyBlc2MoYS5kZXRhaWwpICsgJzwvZGl2PicgOiAnJykgKwogICAgICAnPC9i',
  'dXR0b24+JzsKICAgIH0pOwogICAgaWYgKGxpc3QubGVuZ3RoID4gOCkgewogICAgICBib2R5ICs9ICc8YnV0dG9uIGNsYXNzPSJub3RpZi1tb3JlIiBvbmNsaWNrPSJnb3RvQWxlcnQoXCcnICsgZXNjKGcubW9kdWxlKSArICdcJykiPicgKwogICAgICAgICfguJTg',
  'uLnguK3guLXguIEgJyArIChsaXN0Lmxlbmd0aCAtIDgpICsgJyDguKPguLLguKLguIHguLLguKMg4oaSPC9idXR0b24+JzsKICAgIH0KICB9KTsKCiAgcGFuZWwuaW5uZXJIVE1MID0gaGVhZCArICc8ZGl2IGNsYXNzPSJub3RpZi1saXN0Ij4nICsgYm9keSArICc8',
  'L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJub3RpZi1mIj7guK3guLHguJvguYDguJTguJXguYDguKHguLfguYjguK0gJyArIGVzYyhTdHJpbmcoQUxFUlRTLmF0IHx8ICcnKS5zbGljZSgxMSwgMTYpIHx8ICfigJMnKSArICcg4LiZLiDCtyAnICsKICAgICc8YSBo',
  'cmVmPSJqYXZhc2NyaXB0OnZvaWQoMCkiIG9uY2xpY2s9ImNsb3NlTm90aWYoKTtnbyhcJ2Rhc2hib2FyZFwnKSI+4LiU4Li54LiX4Lix4LmJ4LiH4Lir4Lih4LiU4LmD4LiZ4LmB4LiU4LiK4Lia4Lit4Lij4LmM4LiUIOKGkjwvYT48L2Rpdj4nOwp9CgpmdW5jdGlv',
  'biBnb3RvQWxlcnQobW9kdWxlKXsKICBjbG9zZU5vdGlmKCk7CiAgZ28obW9kdWxlID09PSAnZGVidCcgPyAnZGVidE1haW4nIDogbW9kdWxlKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSBmb3JtYXQgaGVscGVycyAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlv',
  'biBlc2Mocyl7CiAgcmV0dXJuIFN0cmluZyhzPT1udWxsPycnOnMpCiAgICAucmVwbGFjZSgvJi9nLCcmYW1wOycpLnJlcGxhY2UoLzwvZywnJmx0OycpLnJlcGxhY2UoLz4vZywnJmd0OycpCiAgICAucmVwbGFjZSgvIi9nLCcmcXVvdDsnKS5yZXBsYWNlKC8nL2cs',
  'JyYjMzk7Jyk7Cn0KZnVuY3Rpb24gbW9uZXkobiwgZGVjKXsKICB2YXIgdiA9IE51bWJlcihufHwwKTsKICByZXR1cm4gdi50b0xvY2FsZVN0cmluZygndGgtVEgnLHttaW5pbXVtRnJhY3Rpb25EaWdpdHM6ZGVjfHwwLCBtYXhpbXVtRnJhY3Rpb25EaWdpdHM6ZGVj',
  'fHwwfSk7Cn0KZnVuY3Rpb24gYmFodChuKXsgcmV0dXJuIG1vbmV5KG4pICsgJyDguL8nOyB9CmZ1bmN0aW9uIHBjdChuKXsgcmV0dXJuIChOdW1iZXIobil8fDApLnRvRml4ZWQoMSkgKyAnJSc7IH0KZnVuY3Rpb24gbnVtKG4peyByZXR1cm4gbj09bnVsbHx8bj09',
  'PScnID8gJ+KAkycgOiBtb25leShuKTsgfQoKLyoqIDIwMjYtMDQtMjYgLT4gMjYg4LmA4LihLuC4oi4gMjU2OSAqLwp2YXIgVEhfTU9OID0gWyfguKEu4LiELicsJ+C4gS7guJ4uJywn4Lih4Li1LuC4hC4nLCfguYDguKEu4LiiLicsJ+C4ni7guIQuJywn4Lih4Li0',
  'LuC4oi4nLCfguIEu4LiELicsJ+C4qi7guIQuJywn4LiBLuC4oi4nLCfguJUu4LiELicsJ+C4ni7guKIuJywn4LiYLuC4hC4nXTsKZnVuY3Rpb24gdGhEYXRlKGlzbyl7CiAgaWYgKCFpc28pIHJldHVybiAn4oCTJzsKICB2YXIgbSA9IFN0cmluZyhpc28pLm1hdGNo',
  'KC9eKFxkezR9KS0oXGR7Mn0pLShcZHsyfSkvKTsKICBpZiAoIW0pIHJldHVybiBlc2MoaXNvKTsKICByZXR1cm4gTnVtYmVyKG1bM10pICsgJyAnICsgVEhfTU9OW051bWJlcihtWzJdKS0xXSArICcgJyArIChOdW1iZXIobVsxXSkrNTQzKTsKfQpmdW5jdGlvbiB0',
  'aERhdGVTaG9ydChpc28pewogIGlmICghaXNvKSByZXR1cm4gJ+KAkyc7CiAgdmFyIG0gPSBTdHJpbmcoaXNvKS5tYXRjaCgvXihcZHs0fSktKFxkezJ9KS0oXGR7Mn0pLyk7CiAgaWYgKCFtKSByZXR1cm4gZXNjKGlzbyk7CiAgcmV0dXJuIE51bWJlcihtWzNdKSAr',
  'ICcvJyArIE51bWJlcihtWzJdKSArICcvJyArIFN0cmluZyhOdW1iZXIobVsxXSkrNTQzKS5zbGljZSgyKTsKfQpmdW5jdGlvbiBkYXlzQWdvKGlzbyl7CiAgaWYgKCFpc28pIHJldHVybiBudWxsOwogIHJldHVybiBNYXRoLnJvdW5kKChEYXRlLm5vdygpIC0gbmV3',
  'IERhdGUoaXNvKS5nZXRUaW1lKCkpLzg2NDAwMDAwKTsKfQoKZnVuY3Rpb24gc3RhdHVzQmFkZ2Uoc3QpewogIHZhciBtYXAgPSB7CiAgICAn4LmA4Liq4Lij4LmH4LiI4Liq4Li04LmJ4LiZJzonb2snLCfguJTguLPguYDguJnguLTguJnguIHguLLguKPguYHguKXg',
  'uYnguKcnOidvaycsJ+C5g+C4iuC5ieC4h+C4suC4meC4m+C4geC4leC4tCc6J29rJywn4Lib4Li04LiU4Lir4LiZ4Li14LmJ4LmB4Lil4LmJ4LinJzonb2snLCfguK3guKLguLnguYjguYPguJnguJvguKPguLDguIHguLHguJknOidvaycsJ+C4oeC4teC4nOC4ueC5',
  'ieC5gOC4iuC5iOC4sic6J29rJywn4Lib4LiB4LiV4Li0Jzonb2snLAogICAgJ+C4geC4s+C4peC4seC4h+C4i+C5iOC4reC4oSc6J2luZm8nLCfguIHguLPguKXguLHguIfguJTguLPguYDguJnguLTguJnguIHguLLguKMnOidpbmZvJywn4LiZ4Lix4LiU4Lir4Lih',
  '4Liy4Lii4LmB4Lil4LmJ4LinJzonaW5mbycsJ+C4geC4s+C4peC4seC4h+C4nOC5iOC4reC4mSc6J2luZm8nLCfguKfguYjguLLguIcnOidpbmZvJywKICAgICfguKPguK3guJTguLPguYDguJnguLTguJnguIHguLLguKMnOid3YXJuJywn4LmA4Lil4Li34LmI4Lit',
  '4LiZ4LiZ4Lix4LiUJzond2FybicsJ+C5g+C4geC4peC5ieC4q+C4oeC4lOC4m+C4o+C4sOC4geC4seC4mSc6J3dhcm4nLCfguJXguYnguK3guIfguIvguYjguK3guKEnOid3YXJuJywn4Lie4Lix4LiB4LiK4Liz4Lij4LiwJzond2FybicsJ+C4m+C4tOC4lOC4m+C4',
  'o+C4seC4muC4m+C4o+C4uOC4hyc6J3dhcm4nLCfguYDguIHguLTguJnguIHguLPguKvguJnguJQnOid3YXJuJywn4Lii4Lix4LiH4LmE4Lih4LmI4LmA4LiE4Lii4Lil4LmJ4Liy4LiHJzond2FybicsCiAgICAn4Lii4LiB4LmA4Lil4Li04LiBJzonbXV0ZScsJ+C4',
  'm+C4peC4lOC4o+C4sOC4p+C4suC4hyc6J211dGUnLCfguYTguKHguYjguKPguLDguJrguLgnOidtdXRlJywKICAgICfguKvguKHguJTguK3guLLguKLguLjguYHguKXguYnguKcnOidkZ3InLCfguJTguYjguKfguJnguKHguLLguIEnOidkZ3InLCfguJTguYjguKfg',
  'uJknOid3YXJuJwogIH07CiAgaWYgKCFzdCkgcmV0dXJuICcnOwogIHJldHVybiAnPHNwYW4gY2xhc3M9ImIgJyArIChtYXBbc3RdfHwnbXV0ZScpICsgJyI+JyArIGVzYyhzdCkgKyAnPC9zcGFuPic7Cn0KCmZ1bmN0aW9uIHByb2dyZXNzKHBlcmNlbnQsIGNscyl7',
  'CiAgdmFyIHAgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIE51bWJlcihwZXJjZW50KXx8MCkpOwogIHJldHVybiAnPGRpdiBjbGFzcz0icGJhciAnICsgKGNsc3x8JycpICsgJyI+PGkgc3R5bGU9IndpZHRoOicgKyBwICsgJyUiPjwvaT48L2Rpdj4nOwp9Cgpm',
  'dW5jdGlvbiB0aHVtYnNIdG1sKHJlZnMsIGJpZyl7CiAgaWYgKCFyZWZzIHx8ICFyZWZzLmxlbmd0aCkgcmV0dXJuICc8c3BhbiBjbGFzcz0iZmFpbnQgZnMxMiI+4oCTPC9zcGFuPic7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJ0aHVtYnMiPicgKyByZWZzLm1hcChm',
  'dW5jdGlvbihyKXsKICAgIGlmIChyLnRodW1iKSB7CiAgICAgIHJldHVybiAnPGltZyBjbGFzcz0idGh1bWInICsgKGJpZz8nIGJpZyc6JycpICsgJyIgbG9hZGluZz0ibGF6eSIgc3JjPSInICsgZXNjKHIudGh1bWIpICsgJyIgJyArCiAgICAgICAgICAgICAnb25j',
  'bGljaz0id2luZG93Lm9wZW4oXCcnICsgZXNjKHIudXJsKSArICdcJyxcJ19ibGFua1wnKSIgJyArCiAgICAgICAgICAgICAnb25lcnJvcj0idGhpcy5vbmVycm9yPW51bGw7dGhpcy5yZXBsYWNlV2l0aChmaWxlQ2hpcCgnICsgSlNPTi5zdHJpbmdpZnkoSlNPTi5z',
  'dHJpbmdpZnkocikpLnJlcGxhY2UoLyIvZywnJnF1b3Q7JykgKyAnKSkiPic7CiAgICB9CiAgICByZXR1cm4gJzxhIGNsYXNzPSJiIGluZm8iIGhyZWY9IicgKyBlc2Moci51cmwpICsgJyIgdGFyZ2V0PSJfYmxhbmsiPuC5hOC4n+C4peC5jDwvYT4nOwogIH0pLmpv',
  'aW4oJycpICsgJzwvZGl2Pic7Cn0KZnVuY3Rpb24gZmlsZUNoaXAoanNvbil7CiAgdmFyIHIgPSB0eXBlb2YganNvbiA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKGpzb24pIDoganNvbjsKICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTsKICBh',
  'LmNsYXNzTmFtZSA9ICdiIGluZm8nOyBhLmhyZWYgPSByLnVybDsgYS50YXJnZXQgPSAnX2JsYW5rJzsgYS50ZXh0Q29udGVudCA9ICfwn5OOIOC5hOC4n+C4peC5jCc7CiAgcmV0dXJuIGE7Cn0KCmZ1bmN0aW9uIGVtcHR5Qm94KHRleHQsIGFjdGlvbil7CiAgcmV0',
  'dXJuICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj7wn5eC77iPPC9kaXY+JyArIGVzYyh0ZXh0KSArCiAgICAgICAgIChhY3Rpb24gPyAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIGFjdGlvbiArICc8L2Rpdj4nIDogJycpICsgJzwvZGl2Pic7Cn0K',
  'CmZ1bmN0aW9uIGJhckNoYXJ0KGl0ZW1zLCBsYWJlbEtleSwgdmFsdWVLZXksIGZvcm1hdHRlcil7CiAgaWYgKCFpdGVtcyB8fCAhaXRlbXMubGVuZ3RoKSByZXR1cm4gJzxkaXYgY2xhc3M9ImVtcHR5Ij7guKLguLHguIfguYTguKHguYjguKHguLXguILguYnguK3g',
  'uKHguLnguKU8L2Rpdj4nOwogIHZhciBtYXggPSBNYXRoLm1heC5hcHBseShudWxsLCBpdGVtcy5tYXAoZnVuY3Rpb24oaSl7IHJldHVybiBOdW1iZXIoaVt2YWx1ZUtleV0pfHwwOyB9KSkgfHwgMTsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImJhcnMiPicgKyBpdGVt',
  'cy5tYXAoZnVuY3Rpb24oaSl7CiAgICB2YXIgdiA9IE51bWJlcihpW3ZhbHVlS2V5XSl8fDA7CiAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImJhci1yb3ciPicgKwogICAgICAnPGRpdiBjbGFzcz0iY2xpcCIgdGl0bGU9IicgKyBlc2MoaVtsYWJlbEtleV0pICsgJyI+',
  'JyArIGVzYyhpW2xhYmVsS2V5XSkgKyAnPC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJiYXItdHJhY2siPjxkaXYgY2xhc3M9ImJhci1maWxsIiBzdHlsZT0id2lkdGg6JyArICh2L21heCoxMDApICsgJyUiPjwvZGl2PjwvZGl2PicgKwogICAgICAnPGRpdiBj',
  'bGFzcz0idiI+JyArIChmb3JtYXR0ZXIgPyBmb3JtYXR0ZXIoaSkgOiBtb25leSh2KSkgKyAnPC9kaXY+JyArCiAgICAnPC9kaXY+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIG1vZGFsIC0tLS0tLS0tLS0tLS0tLS0g',
  'Ki8KCi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLQogICDguJXguLLguKPguLLguIfguJrguJnguIjguK3guYHguITguJoKICAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0t',
  'LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tCiAgIOC4leC4suC4o+C4suC4h+C4geC4p+C5ieC4suC4hyAxLDAwMHB4IOC4reC5iOC4suC4meC4muC4meC4oeC4t+C4reC4luC4t+C4reC5hOC4oeC5iOC5hOC4q+C4pyDguJXguYnguK3guIfguYDguKXg',
  'uLfguYjguK3guJnguIvguYnguLLguKLguILguKfguLLguJXguKXguK3guJQKICAg4LiI4Li24LiH4LiV4Li04LiU4LiK4Li34LmI4Lit4LiE4Lit4Lil4Lix4Lih4LiZ4LmM4LmE4Lin4LmJ4LiX4Li14LmI4LmB4LiV4LmI4Lil4Liw4LiK4LmI4Lit4LiH4LiU4LmJ',
  '4Lin4LiiIGRhdGEtbGFiZWwg4LmB4Lil4LmJ4Lin4LmD4Lir4LmJIENTUwogICDguYDguJvguYfguJnguITguJnguJXguLHguJTguKrguLTguJnguKfguYjguLLguIjguLDguYHguKrguJTguIfguYDguJvguYfguJnguJXguLLguKPguLLguIfguKvguKPguLfguK3g',
  'uYDguJvguYfguJnguIHguLLguKPguYzguJTguJfguLXguKXguLDguKPguLLguKLguIHguLLguKMKCiAgIOC4l+C4s+C4l+C4teC5iOC4meC4teC5iOC4l+C4teC5iOC5gOC4lOC4teC4ouC4p+C4q+C4peC4seC4h+C4p+C4suC4lOC4q+C4meC5ieC4suC5gOC4quC4',
  'o+C5h+C4iCDguJfguLjguIHguJXguLLguKPguLLguIfguYPguJnguKPguLDguJrguJrguIjguLbguIfguYTguJTguYnguJzguKXguYDguKvguKHguLfguK3guJnguIHguLHguJnguKvguKHguJQKICAg4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LmE4Lil4LmI4LmB4LiB',
  '4LmJ4LiX4Li14Lil4Liw4LiV4Liy4Lij4Liy4LiHIOC5geC4peC4sOC4leC4suC4o+C4suC4h+C4l+C4teC5iOC5gOC4nuC4tOC5iOC4oeC5g+C4q+C4oeC5iOC4l+C4teC4q+C4peC4seC4h+C4geC5h+C5hOC4lOC5ieC5hOC4m+C4lOC5ieC4p+C4ouC5gOC4peC4',
  'ogogICBIVE1MIOC4ouC4seC4h+C5gOC4m+C5h+C4meC4iuC4uOC4lOC5gOC4lOC4teC4ouC4pyDguJXguYjguLLguIfguIHguLHguJnguYHguITguYggQ1NTIOC4ouC5iOC4rS3guILguKLguLLguKLguKvguJnguYnguLLguJXguYjguLLguIfguIHguYfguKrguKXg',
  'uLHguJrguYTguJTguYnguJfguLHguJnguJfguLUKLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqLwpmdW5jdGlvbiBsYWJlbENlbGxzKHJvb3QpewogIGlmICghcm9vdCkgcmV0dXJuOwog',
  'IHZhciB0YWJsZXMgPSByb290LnF1ZXJ5U2VsZWN0b3JBbGwgPyByb290LnF1ZXJ5U2VsZWN0b3JBbGwoJ3RhYmxlJykgOiBbXTsKICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKHRhYmxlcywgZnVuY3Rpb24odCl7CiAgICB2YXIgaGVhZHMgPSBBcnJheS5w',
  'cm90b3R5cGUubWFwLmNhbGwodC5xdWVyeVNlbGVjdG9yQWxsKCd0aGVhZCB0aCcpLCBmdW5jdGlvbih0aCl7CiAgICAgIHJldHVybiAodGgudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKTsKICAgIH0pOwogICAgaWYgKCFoZWFkcy5sZW5ndGgpIHJldHVybjsKICAg',
  'IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwodC5xdWVyeVNlbGVjdG9yQWxsKCd0Ym9keSB0cicpLCBmdW5jdGlvbih0cil7CiAgICAgIC8vIOC5geC4luC4p+C4quC4o+C4uOC4m+C4q+C4o+C4t+C4reC5geC4luC4pyAi4LmE4Lih4LmI4Lih4Li14LiC4LmJ',
  '4Lit4Lih4Li54LilIiDguJfguLXguYjguKPguKfguKHguIrguYjguK3guIcg4Lib4Lil4LmI4Lit4Lii4LmE4Lin4LmJ4LmA4LiV4LmH4Lih4LiE4Lin4Liy4Lih4LiB4Lin4LmJ4Liy4LiHCiAgICAgIGlmICh0ci5xdWVyeVNlbGVjdG9yKCdbY29sc3Bhbl0nKSkg',
  'eyB0ci5jbGFzc0xpc3QuYWRkKCdyb3ctd2lkZScpOyByZXR1cm47IH0KICAgICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbCh0ci5jaGlsZHJlbiwgZnVuY3Rpb24odGQsIGkpewogICAgICAgIHZhciBsYWJlbCA9IGhlYWRzW2ldIHx8ICcnOwogICAgICAg',
  'IGlmIChsYWJlbCkgdGQuc2V0QXR0cmlidXRlKCdkYXRhLWxhYmVsJywgbGFiZWwpOwogICAgICAgIGVsc2UgdGQuY2xhc3NMaXN0LmFkZCgnY2VsbC1hY3Rpb25zJyk7ICAgLy8g4LiE4Lit4Lil4Lix4Lih4LiZ4LmM4Lib4Li44LmI4LihIOC5hOC4oeC5iOC4oeC4',
  'teC4q+C4seC4p+C4leC4suC4o+C4suC4hyDguYTguKHguYjguJXguYnguK3guIfguJXguLTguJTguJvguYnguLLguKIKCiAgICAgICAgLy8g4LiK4LmI4Lit4LiH4LiX4Li14LmI4LmE4Lih4LmI4Lih4Li14LiE4LmI4LiyICjguKfguYjguLLguIfguKvguKPguLfg',
  'uK3guILguLXguJQpIOC4muC4meC4iOC4reC5geC4hOC4muC5hOC4oeC5iOC4leC5ieC4reC4h+C5guC4iuC4p+C5jOC5gOC4m+C5h+C4meC4muC4o+C4o+C4l+C4seC4lAogICAgICAgIC8vIOC4geC4suC4o+C5jOC4lOC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC4',
  'ouC4suC4p+C5gOC4geC5ieC4rSDguKrguYjguKfguJnguJrguJnguIjguK3guIHguKfguYnguLLguIfguKLguLHguIfguJXguYnguK3guIfguKHguLXguYDguJ7guLfguYjguK3guYPguKvguYnguITguK3guKXguLHguKHguJnguYzguJXguKPguIfguIHguLHguJkK',
  'ICAgICAgICB2YXIgdHh0ID0gKHRkLnRleHRDb250ZW50IHx8ICcnKS50cmltKCk7CiAgICAgICAgdmFyIGhhc1RoaW5nID0gdGQucXVlcnlTZWxlY3RvcignaW1nLGJ1dHRvbixhLGlucHV0LHN2ZywudGh1bWInKTsKICAgICAgICBpZiAoKHR4dCA9PT0gJycgfHwg',
  'dHh0ID09PSAn4oCTJyB8fCB0eHQgPT09ICctJykgJiYgIWhhc1RoaW5nKSB7CiAgICAgICAgICB0ZC5jbGFzc0xpc3QuYWRkKCdjZWxsLWVtcHR5Jyk7CiAgICAgICAgfQogICAgICB9KTsKICAgIH0pOwogIH0pOwp9CgpmdW5jdGlvbiBvcGVuTW9kYWwodGl0bGUs',
  'IGJvZHlIdG1sLCBmb290SHRtbCwgd2lkZSl7CiAgdmFyIHJvb3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9kYWxSb290Jyk7CiAgcm9vdC5pbm5lckhUTUwgPQogICAgJzxkaXYgY2xhc3M9Im92IiBvbmNsaWNrPSJpZihldmVudC50YXJnZXQ9PT10aGlz',
  'KWNsb3NlTW9kYWwoKSI+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJtb2RhbCcgKyAod2lkZT8nIHdpZGUnOicnKSArICciPicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJtb2RhbC1oIj48aDM+JyArIGVzYyh0aXRsZSkgKyAnPC9oMz48YnV0dG9uIGNsYXNzPSJ4IiBv',
  'bmNsaWNrPSJjbG9zZU1vZGFsKCkiPsOXPC9idXR0b24+PC9kaXY+JyArCiAgICAgICAgJzxkaXYgY2xhc3M9Im1vZGFsLWIiPicgKyBib2R5SHRtbCArICc8L2Rpdj4nICsKICAgICAgICAoZm9vdEh0bWwgPyAnPGRpdiBjbGFzcz0ibW9kYWwtZiI+JyArIGZvb3RI',
  'dG1sICsgJzwvZGl2PicgOiAnJykgKwogICAgICAnPC9kaXY+JyArCiAgICAnPC9kaXY+JzsKICBhcHBseVJlYWRPbmx5KHJvb3QpOwogIGxhYmVsQ2VsbHMocm9vdCk7CiAgZG9jdW1lbnQuYm9keS5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nOwp9CmZ1bmN0aW9u',
  'IGNsb3NlTW9kYWwoKXsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9kYWxSb290JykuaW5uZXJIVE1MID0gJyc7CiAgZG9jdW1lbnQuYm9keS5zdHlsZS5vdmVyZmxvdyA9ICcnOwp9CmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5j',
  'dGlvbihlKXsgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgY2xvc2VNb2RhbCgpOyB9KTsKCmZ1bmN0aW9uIGNvbmZpcm1BY3Rpb24odGV4dCwgb25ZZXMpewogIG9wZW5Nb2RhbCgn4Lii4Li34LiZ4Lii4Lix4LiZJywKICAgICc8cD4nICsgZXNjKHRleHQpICsgJzwv',
  'cD4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gZGdyIiBpZD0iY2ZtQnRuIj7guKLguLfguJnguKLguLHguJk8L2J1dHRv',
  'bj4nKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2ZtQnRuJykub25jbGljayA9IGZ1bmN0aW9uKCl7IGNsb3NlTW9kYWwoKTsgb25ZZXMoKTsgfTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSB0b2FzdCAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiB0',
  'b2FzdChtc2csIGtpbmQpewogIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogIGVsLmNsYXNzTmFtZSA9ICd0b2FzdCAnICsgKGtpbmR8fCcnKTsKICBlbC50ZXh0Q29udGVudCA9IG1zZzsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgn',
  'dG9hc3RSb290JykuYXBwZW5kQ2hpbGQoZWwpOwogIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgZWwucmVtb3ZlKCk7IH0sIGtpbmQ9PT0nZXJyJyA/IDUyMDAgOiAyODAwKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSBuYXYgKG1vYmlsZSkgLS0tLS0tLS0tLS0tLS0t',
  'LSAqLwoKZnVuY3Rpb24gdG9nZ2xlTmF2KCl7CiAgdmFyIG5hdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXYnKTsKICBuYXYuY2xhc3NMaXN0LnRvZ2dsZSgnb3BlbicpOwogIGlmIChuYXYuY2xhc3NMaXN0LmNvbnRhaW5zKCdvcGVuJykpIHsKICAgIHZh',
  'ciBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICBzLmNsYXNzTmFtZSA9ICdzY3JpbSc7IHMuaWQgPSAnc2NyaW0nOwogICAgcy5vbmNsaWNrID0gZnVuY3Rpb24oKXsgbmF2LmNsYXNzTGlzdC5yZW1vdmUoJ29wZW4nKTsgcmVtb3ZlU2NyaW0o',
  'KTsgfTsKICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocyk7CiAgfSBlbHNlIHJlbW92ZVNjcmltKCk7Cn0KZnVuY3Rpb24gcmVtb3ZlU2NyaW0oKXsKICB2YXIgcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzY3JpbScpOwogIGlmIChzKSBzLnJlbW92',
  'ZSgpOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIHNlYXJjaCAtLS0tLS0tLS0tLS0tLS0tICovCgp2YXIgc2VhcmNoVGltZXIgPSBudWxsOwpmdW5jdGlvbiBvblNlYXJjaChxKXsKICBjbGVhclRpbWVvdXQoc2VhcmNoVGltZXIpOwogIGlmICghcSB8fCBxLnRyaW0o',
  'KS5sZW5ndGggPCAyKSByZXR1cm47CiAgc2VhcmNoVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdhcHAuc2VhcmNoJywgeyBxOiBxIH0pLnRoZW4oZnVuY3Rpb24ocm93cyl7CiAgICAgIG9wZW5Nb2RhbCgn4Lic4Lil4LiB4Liy4Lij',
  '4LiE4LmJ4LiZ4Lir4LiyICInICsgcSArICciICgnICsgcm93cy5sZW5ndGggKyAnKScsCiAgICAgICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0iYWxpc3QiPicgKyByb3dzLm1hcChmdW5jdGlvbihyKXsKICAgICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0i',
  'YWxpIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCk7Z28oXCcnICsganVtcFBhZ2Uoci5tb2R1bGUpICsgJ1wnKSI+JyArCiAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJpYyI+JyArIG1vZHVsZUljb24oci5tb2R1bGUpICsgJzwvZGl2PjxkaXY+JyArCiAgICAgICAgICAg',
  'ICc8ZGl2IGNsYXNzPSJ0dCI+JyArIGVzYyhyLnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImRkIj4nICsgZXNjKHIubGFiZWwpICsgKHIuZGV0YWlsID8gJyDCtyAnICsgZXNjKHIuZGV0YWlsKSA6ICcnKSArICc8L2Rpdj4nICsK',
  'ICAgICAgICAgICAgJzwvZGl2PjwvZGl2Pic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JwogICAgICAgIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij7guYTguKHguYjguJ7guJrguKPguLLguKLguIHguLLguKPguJfguLXguYjguJXguKPguIfguIHguLHguJrg',
  'uITguLPguITguYnguJk8L2Rpdj4nLCAnJywgdHJ1ZSk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7IH0pOwogIH0sIDQyMCk7Cn0KZnVuY3Rpb24ganVtcFBhZ2UobW9kdWxlKXsKICByZXR1cm4gKHtwdXJjaGFz',
  'ZXM6J3B1cmNoYXNlcycsIHJlcGFpcnM6J3JlcGFpcnMnLCBidWlsZGluZzonYnVpbGRpbmcnLCBhYzonYWMnLCBkZWJ0OidkZWJ0TWFpbicsIHJvb21zOidyb29tcyd9KVttb2R1bGVdIHx8ICdkYXNoYm9hcmQnOwp9CmZ1bmN0aW9uIG1vZHVsZUljb24obW9kdWxl',
  'KXsKICByZXR1cm4gKHtwdXJjaGFzZXM6J/Cfm5InLCByZXBhaXJzOifwn5SnJywgYnVpbGRpbmc6J/Cfj6InLCBhYzon4p2E77iPJywgZGVidDon8J+SsCcsIHJvb21zOifwn5qqJ30pW21vZHVsZV0gfHwgJ/Cfk4QnOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIGZp',
  'bGUgdXBsb2FkIC0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKgogKiDguK3guYjguLLguJnguYTguJ/guKXguYzguIjguLLguIEgPGlucHV0IHR5cGU9ZmlsZT4g4LmA4Lib4LmH4LiZIGRhdGFVUkwg4LmB4Lil4LmJ4Lin4Liq4LmI4LiH4LiC4Li24LmJ4LiZIERyaXZl',
  'CiAqIOC4hOC4t+C4mSBhcnJheSDguILguK3guIcge2lkLG5hbWUsdXJsLHRodW1ifQogKi8KZnVuY3Rpb24gdXBsb2FkRmlsZXMoaW5wdXRFbCwgYnVja2V0KXsKICB2YXIgZmlsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChpbnB1dEVsLmZpbGVzIHx8',
  'IFtdKTsKICBpZiAoIWZpbGVzLmxlbmd0aCkgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7CiAgdmFyIE1BWCA9IDEyICogMTAyNCAqIDEwMjQ7CiAgdmFyIHRvb0JpZyA9IGZpbGVzLmZpbHRlcihmdW5jdGlvbihmKXsgcmV0dXJuIGYuc2l6ZSA+IE1BWDsgfSk7',
  'CiAgaWYgKHRvb0JpZy5sZW5ndGgpIHsKICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ+C5hOC4n+C4peC5jOC5g+C4q+C4jeC5iOC5gOC4geC4tOC4mSAxMiBNQjogJyArIHRvb0JpZy5tYXAoZnVuY3Rpb24oZil7cmV0dXJuIGYubmFtZTt9KS5q',
  'b2luKCcsICcpKSk7CiAgfQogIHJldHVybiBQcm9taXNlLmFsbChmaWxlcy5tYXAocmVhZEFzRGF0YVVybCkpCiAgICAudGhlbihmdW5jdGlvbihwYXlsb2Fkcyl7IHJldHVybiBjYWxsQXBpKCdmaWxlLnVwbG9hZCcsIHsgYnVja2V0OiBidWNrZXQsIGZpbGVzOiBw',
  'YXlsb2FkcyB9KTsgfSk7Cn0KCmZ1bmN0aW9uIHJlYWRBc0RhdGFVcmwoZmlsZSl7CiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7CiAgICB2YXIgciA9IG5ldyBGaWxlUmVhZGVyKCk7CiAgICByLm9ubG9hZCA9IGZ1bmN0aW9u',
  'KCl7IHJlc29sdmUoeyBuYW1lOiBmaWxlLm5hbWUsIG1pbWVUeXBlOiBmaWxlLnR5cGUsIGRhdGFVcmw6IHIucmVzdWx0IH0pOyB9OwogICAgci5vbmVycm9yID0gZnVuY3Rpb24oKXsgcmVqZWN0KG5ldyBFcnJvcign4Lit4LmI4Liy4LiZ4LmE4Lif4Lil4LmM4LmE',
  '4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIOiAnICsgZmlsZS5uYW1lKSk7IH07CiAgICByLnJlYWRBc0RhdGFVUkwoZmlsZSk7CiAgfSk7Cn0KPC9zY3JpcHQ+CjxzY3JpcHQ+Ci8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PQogICBBdXRoLmh0bWwg4oCUIOC4q+C4meC5ieC4suC4peC5h+C4reC4geC4reC4tOC4mSDCtyBQSU4gNiDguKvguKXguLHguIEgwrcg4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZCgogICDguJfguLXguYjguYDg',
  'uIHguYfguJrguILguK3guIfguJ3guLHguYjguIfguYDguJrguKPguLLguKfguYzguYDguIvguK3guKPguYwgMiDguIrguLHguYnguJkg4LmA4Lie4Lij4Liy4Liw4LmA4Lin4LmH4Lia4LmB4Lit4Lib4LiC4Lit4LiHIEFwcHMgU2NyaXB0CiAgIOC4l+C4s+C4h+C4',
  'suC4meC5g+C4mSBpZnJhbWUg4LiX4Li14LmI4LiK4Li34LmI4Lit4LmC4LiU4LmA4Lih4LiZ4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LiX4Li44LiB4LiE4Lij4Lix4LmJ4LiH4LiX4Li14LmI4LmA4Lib4Li04LiUCiAgIGxvY2FsU3RvcmFnZSDguIjguLbguIfguKvg',
  'uLLguKLguYTguJTguYkg4LiV4LmJ4Lit4LiH4Lih4Li14LiX4Liy4LiH4Liq4Liz4Lij4Lit4LiHCiAgICAgwrcg4Lij4Lir4Lix4Liq4Lit4LmJ4Liy4LiH4Lit4Li04LiH4LiB4Liy4Lij4LmA4LiC4LmJ4Liy4LmD4LiK4LmJ4LiH4Liy4LiZICjguK3guLLguKLg',
  'uLjguKrguLHguYnguJkpIOKAlCDguYDguIHguYfguJrguYPguJkgbG9jYWxTdG9yYWdlIOC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pwogICAgICAg4Lir4Liy4Lii4LiB4LmH4LmB4LiE4LmI4LmD4Liq4LmIIFBJTiDguYPguKvguKHguYgKICAgICDCtyDg',
  'uKPguKvguLHguKrguK3guLjguJvguIHguKPguJPguYwgKOC4hOC4ueC5iOC4geC4seC4miBQSU4pIOKAlCDguYDguIHguYfguJrguJfguLHguYnguIcgbG9jYWxTdG9yYWdlIOC5geC4peC4sOC5g+C4mSBVUkwg4LiC4Lit4LiH4Lir4LiZ4LmJ4Liy4LmB4Lih4LmI',
  'CiAgICAgICDguJzguYjguLLguJkgZ29vZ2xlLnNjcmlwdC5oaXN0b3J5IOC5gOC4nuC4t+C5iOC4reC5g+C4q+C5ieC4ouC4seC4h+C4reC4ouC4ueC5iOC4q+C4peC4seC4h+C4m+C4tOC4lOC5gOC4m+C4tOC4lOC5gOC4hOC4o+C4t+C5iOC4reC4hwogICA9PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCnZhciBBVVRIID0gewogIHNlc3Npb246ICcnLAogIGRldmljZTogJycsCiAgbWU6IG51bGwsCiAgcGluOiAnJywKICBzY3JlZW46ICcnCn07Cgp2YXIgTFNfU0VT',
  'U0lPTiA9ICdtY29ybmVyLnNlc3Npb24nOwp2YXIgTFNfREVWSUNFICA9ICdtY29ybmVyLmRldmljZSc7CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4l+C4teC5iOC5gOC4geC5h+C4muC4neC4seC5iOC4h+C5gOC4muC4o+C4suC4p+C5jOC5gOC4i+C4reC4o+C5jCAt',
  'LS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiBsc0dldChrKXsKICB0cnkgeyByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGspIHx8ICcnOyB9IGNhdGNoIChlKSB7IHJldHVybiAnJzsgfQp9CmZ1bmN0aW9uIGxzU2V0KGssIHYpewogIHRyeSB7',
  'IHYgPyB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oaywgdikgOiB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oayk7IH0KICBjYXRjaCAoZSkgeyAvKiDguYLguKvguKHguJTguKrguYjguKfguJnguJXguLHguKfguKvguKPguLfguK3guJvguLTguJTg',
  'uITguLjguIHguIHguLXguYnguYTguKfguYkg4oCUIOC5g+C4iuC5ieC4l+C4suC4h+C4quC4s+C4o+C4reC4hyAqLyB9Cn0KCi8qKiDguYDguILguLXguKLguJnguKPguKvguLHguKrguK3guLjguJvguIHguKPguJPguYzguKXguIcgVVJMIOC4guC4reC4h+C4q+C4',
  'meC5ieC4suC5geC4oeC5iCDguYPguKvguYnguKPguK3guJTguILguYnguLLguKHguIHguLLguKPguYDguJvguLTguJTguYPguKvguKHguYggKi8KZnVuY3Rpb24gZGV2aWNlVG9VcmwodG9rZW4pewogIHRyeSB7CiAgICBpZiAoIXdpbmRvdy5nb29nbGUgfHwgIWdv',
  'b2dsZS5zY3JpcHQgfHwgIWdvb2dsZS5zY3JpcHQuaGlzdG9yeSkgcmV0dXJuOwogICAgdmFyIHBhcmFtcyA9IHt9OwogICAgaWYgKGFjY2Vzc0tleSgpKSBwYXJhbXMua2V5ID0gYWNjZXNzS2V5KCk7CiAgICBpZiAodG9rZW4pIHBhcmFtcy5kID0gdG9rZW47CiAg',
  'ICBnb29nbGUuc2NyaXB0Lmhpc3RvcnkucmVwbGFjZVN0YXRlKHt9LCBwYXJhbXMsIGxvY2F0aW9uLmhhc2gpOwogIH0gY2F0Y2ggKGUpIHsgLyog4LmE4Lih4LmI4LmD4LiK4LmI4LmA4Lin4LmH4Lia4LmB4Lit4LibICjguYDguIrguYjguJnguYDguJvguLTguJTg',
  'uYPguJkgZGlhbG9nKSDigJQg4LiC4LmJ4Liy4Lih4LmE4LibICovIH0KfQoKZnVuY3Rpb24gc2F2ZURldmljZSh0b2tlbil7CiAgQVVUSC5kZXZpY2UgPSB0b2tlbiB8fCAnJzsKICBsc1NldChMU19ERVZJQ0UsIEFVVEguZGV2aWNlKTsKICBkZXZpY2VUb1VybChB',
  'VVRILmRldmljZSk7Cn0KCmZ1bmN0aW9uIHNhdmVTZXNzaW9uKHRva2VuKXsKICBBVVRILnNlc3Npb24gPSB0b2tlbiB8fCAnJzsKICBsc1NldChMU19TRVNTSU9OLCBBVVRILnNlc3Npb24pOwp9CgovKiog4Lit4LmI4Liy4LiZ4LiE4LmI4Liy4LiX4Li14LmI4LmA',
  '4LiB4LmH4Lia4LmE4Lin4LmJ4LiX4Lix4LmJ4LiH4Lir4Lih4LiUICjguJXguYnguK3guIfguKPguK0gVVJMIOC4guC4reC4h+C4q+C4meC5ieC4suC5geC4oeC5iCDguIjguLbguIfguYDguJvguYfguJnguYHguJrguJogY2FsbGJhY2spICovCmZ1bmN0aW9uIGxv',
  'YWRTdG9yZWQoZG9uZSl7CiAgQVVUSC5zZXNzaW9uID0gbHNHZXQoTFNfU0VTU0lPTik7CiAgQVVUSC5kZXZpY2UgID0gbHNHZXQoTFNfREVWSUNFKTsKCiAgaWYgKHdpbmRvdy5nb29nbGUgJiYgZ29vZ2xlLnNjcmlwdCAmJiBnb29nbGUuc2NyaXB0LnVybCkgewog',
  'ICAgdHJ5IHsKICAgICAgZ29vZ2xlLnNjcmlwdC51cmwuZ2V0TG9jYXRpb24oZnVuY3Rpb24obG9jKXsKICAgICAgICB2YXIgcCA9IChsb2MgJiYgbG9jLnBhcmFtZXRlcikgfHwge307CiAgICAgICAgaWYgKHAuZCAmJiAhQVVUSC5kZXZpY2UpIHsgQVVUSC5kZXZp',
  'Y2UgPSBTdHJpbmcocC5kKTsgbHNTZXQoTFNfREVWSUNFLCBBVVRILmRldmljZSk7IH0KICAgICAgICBpZiAocC5rZXkgJiYgIWFjY2Vzc0tleSgpKSBSRVNPTFZFRF9LRVkgPSBTdHJpbmcocC5rZXkpOwogICAgICAgIGRvbmUoKTsKICAgICAgfSk7CiAgICAgIHJl',
  'dHVybjsKICAgIH0gY2F0Y2ggKGUpIHsgLyog4LmD4LiK4LmJ4LiX4Liy4LiH4Lib4LiB4LiV4Li0ICovIH0KICB9CiAgZG9uZSgpOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4leC4seC4p+C4hOC4uOC4oeC4peC4s+C4lOC4seC4muC4q+C4meC5ieC4suC4iOC4',
  'rSAtLS0tLS0tLS0tLS0tLS0tICovCgovKiog4LmA4Lij4Li14Lii4LiB4LiV4Lit4LiZ4LmA4Lib4Li04LiU4Lir4LiZ4LmJ4Liy4LmA4Lin4LmH4LiaIOKAlCDguJXguLHguJTguKrguLTguJnguKfguYjguLLguIjguLDguYPguKvguYnguYDguKvguYfguJnguK3g',
  'uLDguYTguKPguIHguYjguK3guJkgKi8KZnVuY3Rpb24gYXV0aEdhdGUoKXsKICBsb2FkU3RvcmVkKGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdhdXRoLm1lJykudGhlbihmdW5jdGlvbihtZSl7CiAgICAgIEFVVEgubWUgPSBtZTsKICAgICAgaWYgKG1lLnNpZ25l',
  'ZEluKSByZXR1cm4gZW50ZXJBcHAobWUpOwogICAgICBpZiAoQVVUSC5kZXZpY2UpIHJldHVybiBzaG93UGluKCk7CiAgICAgIHNob3dMb2dpbigpOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgIHNob3dMb2dpbihlLm1lc3NhZ2UgfHwgZSk7CiAgICB9',
  'KTsKICB9KTsKfQoKZnVuY3Rpb24gZW50ZXJBcHAobWUpewogIEFVVEgubWUgPSBtZTsKICBoaWRlQXV0aCgpOwogIGJvb3ROb3coKTsKICAvLyDguYDguJ7guLTguYjguIfguKXguYfguK3guIHguK3guLTguJnguJTguYnguKfguKLguKPguKvguLHguKrguJzguYjg',
  'uLLguJnguYHguKXguLDguKLguLHguIfguYTguKHguYjguYDguITguKLguJXguLHguYnguIcgUElOIOC4muC4meC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5iSDigJQg4LiK4Lin4LiZ4LiV4Lix4LmJ4LiH4Liq4Lix4LiB4LiE4Lij4Lix4LmJ4LiHCiAgaWYg',
  'KCFBVVRILmRldmljZSAmJiBtZS51c2VybmFtZSAmJiAhbHNHZXQoJ21jb3JuZXIucGluQXNrZWQnKSkgewogICAgc2V0VGltZW91dChvZmZlclBpbiwgOTAwKTsKICB9Cn0KCmZ1bmN0aW9uIGhpZGVBdXRoKCl7CiAgdmFyIHIgPSBkb2N1bWVudC5nZXRFbGVtZW50',
  'QnlJZCgnYXV0aFJvb3QnKTsKICBpZiAocikgci5pbm5lckhUTUwgPSAnJzsKICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2xvY2tlZCcpOwp9CgpmdW5jdGlvbiBzaG93QXV0aChodG1sKXsKICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ2xv',
  'Y2tlZCcpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdXRoUm9vdCcpLmlubmVySFRNTCA9CiAgICAnPGRpdiBjbGFzcz0iYXV0aC13cmFwIj48ZGl2IGNsYXNzPSJhdXRoLWNhcmQiPicgKwogICAgICAnPGRpdiBjbGFzcz0iYXV0aC1icmFuZCI+8J+PoiA8',
  'Yj4nICsgZXNjKChTLmJvb3QgJiYgUy5ib290LmFwcCAmJiBTLmJvb3QuYXBwLm5hbWUpIHx8ICdUaGUgTSBDb3JuZXIgQVAnKSArICc8L2I+PC9kaXY+JyArCiAgICAgIGh0bWwgKwogICAgJzwvZGl2PjwvZGl2Pic7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4Lir',
  '4LiZ4LmJ4Liy4Lil4LmH4Lit4LiB4Lit4Li04LiZ4LiU4LmJ4Lin4Lii4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIHNob3dMb2dpbihlcnIpewogIEFVVEguc2NyZWVuID0gJ2xvZ2luJzsKICBzaG93QXV0aCgK',
  'ICAgICc8aDIgY2xhc3M9ImF1dGgtaCI+4LmA4LiC4LmJ4Liy4Liq4Li54LmI4Lij4Liw4Lia4LiaPC9oMj4nICsKICAgICc8cCBjbGFzcz0iYXV0aC1zdWIiPuC5g+C4quC5iOC4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5ieC5geC4peC4sOC4o+C4q+C4seC4',
  'quC4nOC5iOC4suC4meC4l+C4teC5iOC5hOC4lOC5ieC4o+C4seC4mjwvcD4nICsKICAgIChlcnIgPyAnPGRpdiBjbGFzcz0iYXV0aC1lcnIiPicgKyBlc2MoZXJyKSArICc8L2Rpdj4nIDogJzxkaXYgY2xhc3M9ImF1dGgtZXJyIiBpZD0iYXV0aEVyciIgaGlkZGVu',
  'PjwvZGl2PicpICsKICAgICc8ZGl2IGNsYXNzPSJhdXRoLWYiPjxsYWJlbCBmb3I9ImxnVXNlciI+4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJPC9sYWJlbD4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0ibGdVc2VyIiBhdXRvY29tcGxldGU9',
  'InVzZXJuYW1lIiBhdXRvY2FwaXRhbGl6ZT0ibm9uZSIgc3BlbGxjaGVjaz0iZmFsc2UiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImF1dGgtZiI+PGxhYmVsIGZvcj0ibGdQYXNzIj7guKPguKvguLHguKrguJzguYjguLLguJk8L2xhYmVsPicgKwogICAgICAn',
  'PGlucHV0IGNsYXNzPSJpbnAiIGlkPSJsZ1Bhc3MiIHR5cGU9InBhc3N3b3JkIiBhdXRvY29tcGxldGU9ImN1cnJlbnQtcGFzc3dvcmQiPjwvZGl2PicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgYXV0aC1nbyIgaWQ9ImxnR28iPuC5gOC4guC5ieC4suC4',
  'quC4ueC5iOC4o+C4sOC4muC4mjwvYnV0dG9uPicgKwogICAgKEFVVEguZGV2aWNlID8gJzxidXR0b24gY2xhc3M9ImJ0biBhdXRoLWFsdCIgb25jbGljaz0ic2hvd1BpbigpIj7ihpAg4LiB4Lil4Lix4Lia4LmE4Lib4LmD4LiK4LmJIFBJTjwvYnV0dG9uPicgOiAn',
  'JykgKwogICAgJzxwIGNsYXNzPSJhdXRoLWZvb3QiPuC4peC4t+C4oeC4o+C4q+C4seC4quC4nOC5iOC4suC4mT8g4LmD4Lir4LmJ4Lic4Li54LmJ4LiU4Li54LmB4Lil4LiV4Lix4LmJ4LiH4Lij4Lir4Lix4Liq4LmD4Lir4Lih4LmI4LmD4Lir4LmJ4LiI4Liy4LiB',
  '4LmA4Lih4LiZ4Li54LmD4LiZ4LiK4Li14LiVPC9wPicKICApOwoKICB2YXIgZ28gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGdHbycpOwogIHZhciB1c2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xnVXNlcicpOwogIHZhciBwYXNzID0gZG9jdW1l',
  'bnQuZ2V0RWxlbWVudEJ5SWQoJ2xnUGFzcycpOwoKICBmdW5jdGlvbiBzdWJtaXQoKXsKICAgIHZhciB1ID0gdXNlci52YWx1ZS50cmltKCksIHAgPSBwYXNzLnZhbHVlOwogICAgaWYgKCF1IHx8ICFwKSByZXR1cm4gYXV0aEVycm9yKCfguIHguKPguLjguJPguLLg',
  'uIHguKPguK3guIHguJfguLHguYnguIfguIrguLfguYjguK3guJzguLnguYnguYPguIrguYnguYHguKXguLDguKPguKvguLHguKrguJzguYjguLLguJknKTsKICAgIGdvLmRpc2FibGVkID0gdHJ1ZTsKICAgIGdvLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz0ic3Bp',
  'biI+PC9zcGFuPiDguIHguLPguKXguLHguIfguJXguKPguKfguIjguKrguK3guJrigKYnOwogICAgY2FsbEFwaSgnYXV0aC5sb2dpbicsIHsgdXNlcm5hbWU6IHUsIHBhc3N3b3JkOiBwIH0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICAgIHNhdmVTZXNzaW9uKHIuc2Vz',
  'c2lvbik7CiAgICAgIGlmIChyLm11c3RDaGFuZ2UpIHJldHVybiBzaG93Q2hhbmdlUGFzc3dvcmQodHJ1ZSk7CiAgICAgIHJldHVybiBjYWxsQXBpKCdhdXRoLm1lJykudGhlbihlbnRlckFwcCk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgZ28uZGlz',
  'YWJsZWQgPSBmYWxzZTsKICAgICAgZ28udGV4dENvbnRlbnQgPSAn4LmA4LiC4LmJ4Liy4Liq4Li54LmI4Lij4Liw4Lia4LiaJzsKICAgICAgcGFzcy52YWx1ZSA9ICcnOwogICAgICBhdXRoRXJyb3IoZS5tZXNzYWdlIHx8IGUpOwogICAgfSk7CiAgfQoKICBnby5v',
  'bmNsaWNrID0gc3VibWl0OwogIFt1c2VyLCBwYXNzXS5mb3JFYWNoKGZ1bmN0aW9uKGVsKXsKICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihldil7IGlmIChldi5rZXkgPT09ICdFbnRlcicpIHN1Ym1pdCgpOyB9KTsKICB9KTsKICB1',
  'c2VyLmZvY3VzKCk7Cn0KCmZ1bmN0aW9uIGF1dGhFcnJvcihtc2cpewogIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdXRoRXJyJyk7CiAgaWYgKGVsKSB7IGVsLnRleHRDb250ZW50ID0gbXNnOyBlbC5oaWRkZW4gPSBmYWxzZTsgfQogIGVsc2Ug',
  'c2hvd0xvZ2luKG1zZyk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4Lir4LiZ4LmJ4LiyIFBJTiA2IOC4q+C4peC4seC4gSAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiBzaG93UGluKCl7CiAgQVVUSC5zY3JlZW4gPSAncGluJzsKICBBVVRILnBpbiA9ICcn',
  'OwogIHNob3dBdXRoKAogICAgJzxoMiBjbGFzcz0iYXV0aC1oIj7guYPguKrguYggUElOPC9oMj4nICsKICAgICc8cCBjbGFzcz0iYXV0aC1zdWIiPuC4m+C4peC4lOC4peC5h+C4reC4geC4lOC5ieC4p+C4ouC4o+C4q+C4seC4qiA2IOC4q+C4peC4seC4geC4guC4',
  'reC4h+C5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5iTwvcD4nICsKICAgICc8ZGl2IGNsYXNzPSJhdXRoLWVyciIgaWQ9ImF1dGhFcnIiIGhpZGRlbj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJwaW4tZG90cyIgaWQ9InBpbkRvdHMiPicgKyBwaW5Eb3Rz',
  'SHRtbCgnJykgKyAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0icGluLXBhZCI+JyArCiAgICAgIFsxLDIsMyw0LDUsNiw3LDgsOV0ubWFwKGZ1bmN0aW9uKG4pewogICAgICAgIHJldHVybiAnPGJ1dHRvbiBjbGFzcz0icGluLWsiIG9uY2xpY2s9InBpblB1c2go',
  'XCcnICsgbiArICdcJykiPicgKyBuICsgJzwvYnV0dG9uPic7CiAgICAgIH0pLmpvaW4oJycpICsKICAgICAgJzxidXR0b24gY2xhc3M9InBpbi1rIGdob3N0IiBvbmNsaWNrPSJzaG93TG9naW4oKSIgdGl0bGU9IuC5g+C4iuC5ieC4o+C4q+C4seC4quC4nOC5iOC4',
  'suC4meC5geC4l+C4mSI+8J+UkTwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0icGluLWsiIG9uY2xpY2s9InBpblB1c2goXCcwXCcpIj4wPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJwaW4tayBnaG9zdCIgb25jbGljaz0icGluQmFj',
  'aygpIiB0aXRsZT0i4Lil4LiaIj7ijKs8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gYXV0aC1hbHQiIG9uY2xpY2s9ImZvcmdldFRoaXNEZXZpY2UoKSI+4Lil4Li34LihIFBJTiDigJQg4LmA4LiC4LmJ4Liy4LiU4LmJ',
  '4Lin4Lii4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZPC9idXR0b24+JwogICk7CgogIC8vIOC4hOC4teC4ouC5jOC4muC4reC4o+C5jOC4lOC4iOC4o+C4tOC4h+C4geC5h+C5g+C4iuC5ieC5hOC4lOC5iSDguYTguKHguYjguJXguYnguK3guIfguIjguLTguYnguKHg',
  'uJvguLjguYjguKHguJrguJnguIjguK0KICBkb2N1bWVudC5vbmtleWRvd24gPSBmdW5jdGlvbihldil7CiAgICBpZiAoQVVUSC5zY3JlZW4gIT09ICdwaW4nKSByZXR1cm47CiAgICBpZiAoL15cZCQvLnRlc3QoZXYua2V5KSkgcGluUHVzaChldi5rZXkpOwogICAg',
  'ZWxzZSBpZiAoZXYua2V5ID09PSAnQmFja3NwYWNlJykgcGluQmFjaygpOwogIH07Cn0KCmZ1bmN0aW9uIHBpbkRvdHNIdG1sKHBpbil7CiAgdmFyIGh0bWwgPSAnJzsKICBmb3IgKHZhciBpID0gMDsgaSA8IDY7IGkrKykgaHRtbCArPSAnPGkgY2xhc3M9IicgKyAo',
  'aSA8IHBpbi5sZW5ndGggPyAnb24nIDogJycpICsgJyI+PC9pPic7CiAgcmV0dXJuIGh0bWw7Cn0KCmZ1bmN0aW9uIHBpblB1c2goZCl7CiAgaWYgKEFVVEgucGluLmxlbmd0aCA+PSA2KSByZXR1cm47CiAgQVVUSC5waW4gKz0gZDsKICBkb2N1bWVudC5nZXRFbGVt',
  'ZW50QnlJZCgncGluRG90cycpLmlubmVySFRNTCA9IHBpbkRvdHNIdG1sKEFVVEgucGluKTsKICBpZiAoQVVUSC5waW4ubGVuZ3RoID09PSA2KSBzZXRUaW1lb3V0KHBpblN1Ym1pdCwgMTIwKTsKfQoKZnVuY3Rpb24gcGluQmFjaygpewogIEFVVEgucGluID0gQVVU',
  'SC5waW4uc2xpY2UoMCwgLTEpOwogIHZhciBkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpbkRvdHMnKTsKICBpZiAoZCkgZC5pbm5lckhUTUwgPSBwaW5Eb3RzSHRtbChBVVRILnBpbik7Cn0KCmZ1bmN0aW9uIHBpblN1Ym1pdCgpewogIHZhciBwaW4gPSBB',
  'VVRILnBpbjsKICBBVVRILnBpbiA9ICcnOwogIHZhciBkb3RzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpbkRvdHMnKTsKICBpZiAoZG90cykgZG90cy5jbGFzc0xpc3QuYWRkKCdidXN5Jyk7CgogIGNhbGxBcGkoJ2F1dGgudW5sb2NrJywgeyBkZXZpY2U6',
  'IEFVVEguZGV2aWNlLCBwaW46IHBpbiB9KS50aGVuKGZ1bmN0aW9uKHIpewogICAgc2F2ZVNlc3Npb24oci5zZXNzaW9uKTsKICAgIGRvY3VtZW50Lm9ua2V5ZG93biA9IG51bGw7CiAgICByZXR1cm4gY2FsbEFwaSgnYXV0aC5tZScpLnRoZW4oZW50ZXJBcHApOwog',
  'IH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgdmFyIG1zZyA9IFN0cmluZyhlLm1lc3NhZ2UgfHwgZSk7CiAgICBpZiAoZG90cykgeyBkb3RzLmNsYXNzTGlzdC5yZW1vdmUoJ2J1c3knKTsgZG90cy5jbGFzc0xpc3QuYWRkKCdzaGFrZScpOyBkb3RzLmlubmVySFRN',
  'TCA9IHBpbkRvdHNIdG1sKCcnKTsgfQogICAgc2V0VGltZW91dChmdW5jdGlvbigpeyBpZiAoZG90cykgZG90cy5jbGFzc0xpc3QucmVtb3ZlKCdzaGFrZScpOyB9LCA1MDApOwogICAgYXV0aEVycm9yKG1zZyk7CiAgICAvLyBQSU4g4LiW4Li54LiB4Lii4LiB4LmA',
  '4Lil4Li04LiB4LmE4Lib4LmB4Lil4LmJ4LinICjguJzguLTguJTguITguKPguJrguYLguITguKfguJXguLIgLyDguKvguKHguJTguK3guLLguKLguLgpIOKAlCDguJXguYnguK3guIfguIHguKXguLHguJrguYTguJvguYPguIrguYnguKPguKvguLHguKrguJzguYjg',
  'uLLguJkKICAgIGlmICgv4Lil4LmH4Lit4LiB4Lit4Li04LiZ4LiU4LmJ4Lin4Lii4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZLy50ZXN0KG1zZykpIHsKICAgICAgc2F2ZURldmljZSgnJyk7CiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgc2hvd0xvZ2luKG1z',
  'Zyk7IH0sIDE0MDApOwogICAgfQogIH0pOwp9CgpmdW5jdGlvbiBmb3JnZXRUaGlzRGV2aWNlKCl7CiAgdmFyIHRva2VuID0gQVVUSC5kZXZpY2U7CiAgc2F2ZURldmljZSgnJyk7CiAgbHNTZXQoJ21jb3JuZXIucGluQXNrZWQnLCAnJyk7CiAgZG9jdW1lbnQub25r',
  'ZXlkb3duID0gbnVsbDsKICBpZiAodG9rZW4pIGNhbGxBcGkoJ2F1dGguZm9yZ2V0RGV2aWNlJywgeyBkZXZpY2U6IHRva2VuIH0pLmNhdGNoKGZ1bmN0aW9uKCl7IC8qIOC4q+C4oeC4lOC4reC4suC4ouC4uOC5hOC4m+C5geC4peC5ieC4p+C4geC5h+C4iuC5iOC4',
  'suC4h+C4oeC4seC4mSAqLyB9KTsKICBzaG93TG9naW4oKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguJXguLHguYnguIcgUElOIC0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKiDguIrguKfguJnguJXguLHguYnguIcgUElOIOC4q+C4peC4seC4h+C4peC5h+C4reC4',
  'geC4reC4tOC4meC4hOC4o+C4seC5ieC4h+C5geC4o+C4geC4muC4meC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5iSAqLwpmdW5jdGlvbiBvZmZlclBpbigpewogIGxzU2V0KCdtY29ybmVyLnBpbkFza2VkJywgJzEnKTsKICBvcGVuTW9kYWwoJ+C4leC4seC5',
  'ieC4hyBQSU4g4Liq4Liz4Lir4Lij4Lix4Lia4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJJywKICAgICc8cD7guJXguLHguYnguIfguKPguKvguLHguKogNiDguKvguKXguLHguIHguYTguKfguYkg4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4LiV4LmJ4Lit',
  '4LiH4Lie4Li04Lih4Lie4LmM4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LiX4Li44LiB4LiE4Lij4Lix4LmJ4LiH4LiX4Li14LmI4LmA4Lib4Li04LiUPC9wPicgKwogICAgJzxwIGNsYXNzPSJtdXRlZCBmczEzIj5QSU4g4Lic4Li54LiB4LiB4Lix4Lia4LmA4LiE',
  '4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJ4LmA4LiE4Lij4Li34LmI4Lit4LiH4LmA4LiU4Li14Lii4LinIOC5gOC4hOC4o+C4t+C5iOC4reC4h+C4reC4t+C5iOC4meC5g+C4iuC5ieC5hOC4oeC5iOC5hOC4lOC5iSDCtyDguKLguIHguYDguKXguLTguIHguYDguKHg',
  'uLfguYjguK3guYTguKvguKPguYjguIHguYfguYTguJTguYnguYPguJnguKvguJnguYnguLLguJXguLHguYnguIfguITguYjguLI8L3A+JywKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4LmE4Lin4LmJ4LiB4LmI4Lit4LiZ',
  'PC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iY2xvc2VNb2RhbCgpO2Zvcm1TZXRQaW4oKSI+4LiV4Lix4LmJ4LiHIFBJTiDguYDguKXguKI8L2J1dHRvbj4nKTsKfQoKZnVuY3Rpb24gZm9ybVNldFBpbigpewogIG9wZW5N',
  'b2RhbCgn4LiV4Lix4LmJ4LiHIFBJTiA2IOC4q+C4peC4seC4gScsCiAgICAnPGRpdiBjbGFzcz0iZmdyaWQiPicgKwogICAgICAnPGRpdiBjbGFzcz0iZiBmdWxsIj48bGFiZWwgZm9yPSJwaW4xIj5QSU4g4LmD4Lir4Lih4LmIPC9sYWJlbD4nICsKICAgICAgICAn',
  'PGlucHV0IGNsYXNzPSJpbnAiIGlkPSJwaW4xIiB0eXBlPSJwYXNzd29yZCIgaW5wdXRtb2RlPSJudW1lcmljIiBtYXhsZW5ndGg9IjYiICcgKwogICAgICAgICdhdXRvY29tcGxldGU9Im5ldy1wYXNzd29yZCIgcGxhY2Vob2xkZXI9IuKAouKAouKAouKAouKAouKA',
  'oiI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIGZ1bGwiPjxsYWJlbCBmb3I9InBpbjIiPuC5g+C4quC5iCBQSU4g4Lit4Li14LiB4LiE4Lij4Lix4LmJ4LiHPC9sYWJlbD4nICsKICAgICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJwaW4yIiB0eXBl',
  'PSJwYXNzd29yZCIgaW5wdXRtb2RlPSJudW1lcmljIiBtYXhsZW5ndGg9IjYiICcgKwogICAgICAgICdhdXRvY29tcGxldGU9Im5ldy1wYXNzd29yZCIgcGxhY2Vob2xkZXI9IuKAouKAouKAouKAouKAouKAoiI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJm',
  'IGZ1bGwiPjxsYWJlbCBmb3I9InBpbkRldiI+4LiK4Li34LmI4Lit4LmA4LiE4Lij4Li34LmI4Lit4LiHICjguYTguKfguYnguJTguLnguKLguYnguK3guJnguKvguKXguLHguIcpPC9sYWJlbD4nICsKICAgICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJwaW5E',
  'ZXYiIHZhbHVlPSInICsgZXNjKGd1ZXNzRGV2aWNlTmFtZSgpKSArICciPjwvZGl2PicgKwogICAgJzwvZGl2PicgKwogICAgJzxwIGNsYXNzPSJtdXRlZCBmczEzIG10OCI+4Lir4Lil4Li14LiB4LmA4Lil4Li14LmI4Lii4LiH4LmA4Lil4LiC4LiX4Li14LmI4LmA',
  '4LiU4Liy4LiH4LmI4Liy4LiiIOC5gOC4iuC5iOC4mSAxMTExMTEg4Lir4Lij4Li34LitIDEyMzQ1NjwvcD4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgICc8',
  'YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBpZD0icGluR28iPuC4muC4seC4meC4l+C4tuC4gSBQSU48L2J1dHRvbj4nKTsKCiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpbkdvJykub25jbGljayA9IGZ1bmN0aW9uKCl7CiAgICB2YXIgYSA9IGRvY3VtZW50Lmdl',
  'dEVsZW1lbnRCeUlkKCdwaW4xJykudmFsdWU7CiAgICB2YXIgYiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaW4yJykudmFsdWU7CiAgICBpZiAoIS9eXGR7Nn0kLy50ZXN0KGEpKSByZXR1cm4gdG9hc3QoJ1BJTiDguJXguYnguK3guIfguYDguJvguYfguJng',
  'uJXguLHguKfguYDguKXguIIgNiDguKvguKXguLHguIEnLCAnZXJyJyk7CiAgICBpZiAoYSAhPT0gYikgcmV0dXJuIHRvYXN0KCdQSU4g4Liq4Lit4LiH4LiK4LmI4Lit4LiH4LmE4Lih4LmI4LiV4Lij4LiH4LiB4Lix4LiZJywgJ2VycicpOwogICAgdmFyIGJ0biA9',
  'IHRoaXM7CiAgICBidG4uZGlzYWJsZWQgPSB0cnVlOwogICAgYnRuLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDguIHguLPguKXguLHguIfguJrguLHguJnguJfguLbguIHigKYnOwogICAgY2FsbEFwaSgnYXV0aC5zZXRQaW4nLCB7IHBp',
  'bjogYSwgZGV2aWNlOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGluRGV2JykudmFsdWUgfSkudGhlbihmdW5jdGlvbihyKXsKICAgICAgc2F2ZURldmljZShyLmRldmljZSk7CiAgICAgIGNsb3NlTW9kYWwoKTsKICAgICAgdG9hc3QoJ+C4leC4seC5ieC4hyBQ',
  'SU4g4LmA4Lij4Li14Lii4Lia4Lij4LmJ4Lit4LiiIOKAlCDguITguKPguLHguYnguIfguKvguJnguYnguLLguYPguKrguYjguYHguITguYggNiDguKvguKXguLHguIEnLCAnb2snKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICBidG4uZGlzYWJsZWQg',
  'PSBmYWxzZTsKICAgICAgYnRuLnRleHRDb250ZW50ID0gJ+C4muC4seC4meC4l+C4tuC4gSBQSU4nOwogICAgICB0b2FzdChlLm1lc3NhZ2UgfHwgZSwgJ2VycicpOwogICAgfSk7CiAgfTsKfQoKZnVuY3Rpb24gZ3Vlc3NEZXZpY2VOYW1lKCl7CiAgdmFyIHVhID0g',
  'bmF2aWdhdG9yLnVzZXJBZ2VudCB8fCAnJzsKICBpZiAoL2lQaG9uZS8udGVzdCh1YSkpIHJldHVybiAnaVBob25lJzsKICBpZiAoL2lQYWQvLnRlc3QodWEpKSByZXR1cm4gJ2lQYWQnOwogIGlmICgvQW5kcm9pZC8udGVzdCh1YSkpIHJldHVybiAnQW5kcm9pZCc7',
  'CiAgaWYgKC9NYWNpbnRvc2gvLnRlc3QodWEpKSByZXR1cm4gJ01hYyc7CiAgaWYgKC9XaW5kb3dzLy50ZXN0KHVhKSkgcmV0dXJuICdXaW5kb3dzJzsKICByZXR1cm4gJ+C4reC4uOC4m+C4geC4o+C4k+C5jOC4guC4reC4h+C4ieC4seC4mSc7Cn0KCi8qIC0tLS0t',
  'LS0tLS0tLS0tLS0g4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZIC0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKiBAcGFyYW0ge2Jvb2xlYW59IGZvcmNlZCB0cnVlID0g4Lij4Liw4Lia4Lia4Lia4Lix4LiH4LiE4Lix4Lia4LmA4Lib',
  '4Lil4Li14LmI4Lii4LiZ4LiV4Lit4LiZ4Lil4LmH4Lit4LiB4Lit4Li04LiZ4LiE4Lij4Lix4LmJ4LiH4LmB4Lij4LiBICovCmZ1bmN0aW9uIHNob3dDaGFuZ2VQYXNzd29yZChmb3JjZWQpewogIGlmICghZm9yY2VkKSByZXR1cm4gZm9ybUNoYW5nZVBhc3N3b3Jk',
  'KCk7CiAgQVVUSC5zY3JlZW4gPSAnY2hhbmdlJzsKICBzaG93QXV0aCgKICAgICc8aDIgY2xhc3M9ImF1dGgtaCI+4LiV4Lix4LmJ4LiH4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LiC4Lit4LiH4LiE4Li44LiT4LmA4Lit4LiHPC9oMj4nICsKICAgICc8cCBjbGFz',
  'cz0iYXV0aC1zdWIiPuC4o+C4q+C4seC4quC4l+C4teC5iOC5hOC4lOC5ieC4oeC4suC5gOC4m+C5h+C4meC4o+C4q+C4seC4quC4iuC4seC5iOC4p+C4hOC4o+C4suC4pyDguYDguJvguKXguLXguYjguKLguJnguIHguYjguK3guJnguYPguIrguYnguIfguLLguJng',
  'uKvguJnguLbguYjguIfguITguKPguLHguYnguIc8L3A+JyArCiAgICAnPGRpdiBjbGFzcz0iYXV0aC1lcnIiIGlkPSJhdXRoRXJyIiBoaWRkZW4+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iYXV0aC1mIj48bGFiZWwgZm9yPSJjcE9sZCI+4Lij4Lir4Lix4Liq',
  '4Lic4LmI4Liy4LiZ4LmA4LiU4Li04LihPC9sYWJlbD4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0iY3BPbGQiIHR5cGU9InBhc3N3b3JkIiBhdXRvY29tcGxldGU9ImN1cnJlbnQtcGFzc3dvcmQiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImF1',
  'dGgtZiI+PGxhYmVsIGZvcj0iY3BOZXciPuC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iCAo4Lit4Lii4LmI4Liy4LiH4LiZ4LmJ4Lit4LiiIDgg4LiV4Lix4LinKTwvbGFiZWw+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImNwTmV3',
  'IiB0eXBlPSJwYXNzd29yZCIgYXV0b2NvbXBsZXRlPSJuZXctcGFzc3dvcmQiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImF1dGgtZiI+PGxhYmVsIGZvcj0iY3BOZXcyIj7guYPguKrguYjguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYjguK3g',
  'uLXguIHguITguKPguLHguYnguIc8L2xhYmVsPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJjcE5ldzIiIHR5cGU9InBhc3N3b3JkIiBhdXRvY29tcGxldGU9Im5ldy1wYXNzd29yZCI+PC9kaXY+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHBy',
  'aSBhdXRoLWdvIiBpZD0iY3BHbyI+4Lia4Lix4LiZ4LiX4Li24LiB4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmIPC9idXR0b24+JwogICk7CgogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjcEdvJykub25jbGljayA9IGZ1bmN0aW9uKCl7CiAg',
  'ICB2YXIgbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjcE9sZCcpLnZhbHVlOwogICAgdmFyIG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3BOZXcnKS52YWx1ZTsKICAgIHZhciBuMiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjcE5ldzInKS52',
  'YWx1ZTsKICAgIGlmIChuLmxlbmd0aCA8IDgpIHJldHVybiBhdXRoRXJyb3IoJ+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iOC4leC5ieC4reC4h+C4ouC4suC4p+C4reC4ouC5iOC4suC4h+C4meC5ieC4reC4oiA4IOC4leC4seC4p+C4reC4seC4',
  'geC4qeC4oycpOwogICAgaWYgKG4gIT09IG4yKSByZXR1cm4gYXV0aEVycm9yKCfguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYjguKrguK3guIfguIrguYjguK3guIfguYTguKHguYjguJXguKPguIfguIHguLHguJknKTsKICAgIHZhciBidG4gPSB0',
  'aGlzOwogICAgYnRuLmRpc2FibGVkID0gdHJ1ZTsKICAgIGJ0bi5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4Lia4Lix4LiZ4LiX4Li24LiB4oCmJzsKICAgIGNhbGxBcGkoJ2F1dGguY2hhbmdlUGFzc3dvcmQn',
  'LCB7IG9sZFBhc3N3b3JkOiBvLCBuZXdQYXNzd29yZDogbiB9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICAgIHJldHVybiBjYWxsQXBpKCdhdXRoLm1lJykudGhlbihlbnRlckFwcCk7CiAgICB9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICAgIHRvYXN0KCfguYDguJvguKXg',
  'uLXguYjguKLguJnguKPguKvguLHguKrguJzguYjguLLguJnguYDguKPguLXguKLguJrguKPguYnguK3guKInLCAnb2snKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTsKICAgICAgYnRuLnRleHRDb250ZW50ID0g',
  'J+C4muC4seC4meC4l+C4tuC4geC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iCc7CiAgICAgIGF1dGhFcnJvcihlLm1lc3NhZ2UgfHwgZSk7CiAgICB9KTsKICB9OwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjcE9sZCcpLmZvY3VzKCk7Cn0K',
  'CmZ1bmN0aW9uIGZvcm1DaGFuZ2VQYXNzd29yZCgpewogIG9wZW5Nb2RhbCgn4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZJywKICAgICc8ZGl2IGNsYXNzPSJmZ3JpZCI+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIGZ1bGwiPjxs',
  'YWJlbCBmb3I9Im1jT2xkIj7guKPguKvguLHguKrguJzguYjguLLguJnguYDguJTguLTguKE8L2xhYmVsPjxpbnB1dCBjbGFzcz0iaW5wIiBpZD0ibWNPbGQiIHR5cGU9InBhc3N3b3JkIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYgZnVsbCI+PGxhYmVs',
  'IGZvcj0ibWNOZXciPuC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iCAo4Lit4Lii4LmI4Liy4LiH4LiZ4LmJ4Lit4LiiIDgg4LiV4Lix4LinKTwvbGFiZWw+PGlucHV0IGNsYXNzPSJpbnAiIGlkPSJtY05ldyIgdHlwZT0icGFzc3dvcmQiPjwvZGl2',
  'PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiBmdWxsIj48bGFiZWwgZm9yPSJtY05ldzIiPuC5g+C4quC5iOC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iOC4reC4teC4geC4hOC4o+C4seC5ieC4hzwvbGFiZWw+PGlucHV0IGNsYXNzPSJpbnAiIGlk',
  'PSJtY05ldzIiIHR5cGU9InBhc3N3b3JkIj48L2Rpdj4nICsKICAgICc8L2Rpdj4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJi',
  'dG4gcHJpIiBpZD0ibWNHbyI+4Lia4Lix4LiZ4LiX4Li24LiBPC9idXR0b24+Jyk7CgogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtY0dvJykub25jbGljayA9IGZ1bmN0aW9uKCl7CiAgICB2YXIgbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtY05ldycp',
  'LnZhbHVlOwogICAgaWYgKG4ubGVuZ3RoIDwgOCkgcmV0dXJuIHRvYXN0KCfguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYjguJXguYnguK3guIfguKLguLLguKfguK3guKLguYjguLLguIfguJnguYnguK3guKIgOCDguJXguLHguKfguK3guLHguIHg',
  'uKnguKMnLCAnZXJyJyk7CiAgICBpZiAobiAhPT0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21jTmV3MicpLnZhbHVlKSByZXR1cm4gdG9hc3QoJ+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iOC4quC4reC4h+C4iuC5iOC4reC4h+C5hOC4oeC5',
  'iOC4leC4o+C4h+C4geC4seC4mScsICdlcnInKTsKICAgIHZhciBidG4gPSB0aGlzOwogICAgYnRuLmRpc2FibGVkID0gdHJ1ZTsKICAgIGNhbGxBcGkoJ2F1dGguY2hhbmdlUGFzc3dvcmQnLCB7CiAgICAgIG9sZFBhc3N3b3JkOiBkb2N1bWVudC5nZXRFbGVtZW50',
  'QnlJZCgnbWNPbGQnKS52YWx1ZSwgbmV3UGFzc3dvcmQ6IG4KICAgIH0pLnRoZW4oZnVuY3Rpb24oKXsKICAgICAgY2xvc2VNb2RhbCgpOwogICAgICB0b2FzdCgn4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmA4Lij4Li14Lii',
  '4Lia4Lij4LmJ4Lit4LiiJywgJ29rJyk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgYnRuLmRpc2FibGVkID0gZmFsc2U7CiAgICAgIHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7CiAgICB9KTsKICB9Owp9CgovKiAtLS0tLS0tLS0tLS0tLS0t',
  'IOC4reC4reC4geC4iOC4suC4geC4o+C4sOC4muC4miAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiBkb0xvZ291dChrZWVwUGluKXsKICB2YXIgcyA9IEFVVEguc2Vzc2lvbjsKICBzYXZlU2Vzc2lvbignJyk7CiAgaWYgKCFrZWVwUGluKSB7IHZhciBkID0g',
  'QVVUSC5kZXZpY2U7IHNhdmVEZXZpY2UoJycpOyBpZiAoZCkgY2FsbEFwaSgnYXV0aC5mb3JnZXREZXZpY2UnLCB7IGRldmljZTogZCB9KS5jYXRjaChmdW5jdGlvbigpe30pOyB9CiAgaWYgKHMpIGNhbGxBcGkoJ2F1dGgubG9nb3V0JywgeyBfc2Vzc2lvbjogcyB9',
  'KS5jYXRjaChmdW5jdGlvbigpeyAvKiDguKvguKHguJTguK3guLLguKLguLjguYHguKXguYnguKfguIHguYfguJbguLfguK3guKfguYjguLLguK3guK3guIHguYHguKXguYnguKcgKi8gfSk7CiAgY2xvc2VNb2RhbCgpOwogIEFVVEgubWUgPSBudWxsOwogIGlmIChB',
  'VVRILmRldmljZSkgc2hvd1BpbigpOyBlbHNlIHNob3dMb2dpbigpOwp9CgpmdW5jdGlvbiBjb25maXJtTG9nb3V0KCl7CiAgb3Blbk1vZGFsKCfguK3guK3guIHguIjguLLguIHguKPguLDguJrguJonLAogICAgJzxwPuC4leC5ieC4reC4h+C4geC4suC4o+C4reC4',
  'reC4geC4iOC4suC4geC4o+C4sOC4muC4muC5g+C4iuC5iOC5hOC4q+C4oTwvcD4nICsKICAgIChBVVRILmRldmljZSA/ICc8cCBjbGFzcz0ibXV0ZWQgZnMxMyI+UElOIOC4muC4meC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5ieC4iOC4sOC4ouC4seC4h+C4',
  'reC4ouC4ueC5iCDguITguKPguLHguYnguIfguKvguJnguYnguLLguYDguILguYnguLLguJTguYnguKfguKIgUElOIOC5hOC4lOC5ieC5gOC4peC4ojwvcD4nIDogJycpLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLg',
  'uIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgIChBVVRILmRldmljZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4gZGdyIiBvbmNsaWNrPSJkb0xvZ291dChmYWxzZSkiPuC4reC4reC4geC5geC4peC4sOC4peC4miBQSU48L2J1dHRvbj4nIDogJycpICsKICAgICc8',
  'YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJkb0xvZ291dCh0cnVlKSI+4Lit4Lit4LiB4LiI4Liy4LiB4Lij4Liw4Lia4LiaPC9idXR0b24+Jyk7Cn0KPC9zY3JpcHQ+CjxzY3JpcHQ+Ci8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PQogICBWaWV3cy5odG1sIOKAlCDguJXguLHguKfguYLguKvguKXguJQgKyDguJXguLHguKfguKfguLLguJTguILguK3guIfguYHguJXguYjguKXguLDguKvguJnguYnguLIKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgp2YXIgUk9VVEVTID0ge307CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgMSkg4Lig4Liy4Lie4Lij4Lin4LihCiAgID09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMuZGFzaGJvYXJkID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7IHJldHVybiBjYWxsQXBpKCdhcHAuZGFzaGJvYXJkJywgeyB5ZWFyOiBTLnllYXIgfSk7',
  'IH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciBiID0gZC5idWlsZGluZzsKICAgIHZhciBrcGlzID0KICAgICAga3BpKCfguKLguK3guJTguKvguJnguLXguYnguITguIfguYDguKvguKXguLfguK3guJfguLHguYnguIfguKvguKHguJQnLCBiYWh0KGQu',
  'ZGVidEFsbC5yZW1haW5pbmcpLAogICAgICAgICAgJ+C4iOC4suC4geC4ouC4reC4lOC4q+C4meC4teC5iSAnICsgYmFodChkLmRlYnRBbGwudG90YWxEZWJ0KSArICcgwrcg4LiK4Liz4Lij4Liw4LmB4Lil4LmJ4LinICcgKyBwY3QoZC5kZWJ0QWxsLnBlcmNlbnQp',
  'LCAnYWNjZW50JykgKwogICAgICBrcGkoJ+C4iuC4s+C4o+C4sOC5geC4peC5ieC4pyAo4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiBKScsIHBjdChkLmRlYnRNYWluLnBlcmNlbnQpLCBiYWh0KGQuZGVidE1haW4ucGFpZCkgKyAnIOC4iOC4suC4gSAnICsgYmFodChk',
  'LmRlYnRNYWluLnRvdGFsKSwgJ2dvb2QnKSArCiAgICAgIGtwaSgn4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Lib4Li1ICcgKyBkLnllYXIsIGJhaHQoZC5zcGVuZFRoaXNZZWFyKSwgJ+C4i+C4t+C5ieC4reC4guC4reC4hyArIOC4i+C5iOC4reC4oeC5',
  'geC4i+C4oSArIOC4peC5ieC4suC4h+C5geC4reC4o+C5jCcpICsKICAgICAga3BpKCfguIfguLLguJnguIvguYjguK3guKHguITguYnguLLguIcnLCBkLnJlcGFpcnMub3BlbkpvYnMgKyAnIOC4h+C4suC4mScsIGQucmVwYWlycy5vdmVyZHVlICsgJyDguIfguLLg',
  'uJnguYDguIHguLTguJnguIHguLPguKvguJnguJQnLCBkLnJlcGFpcnMub3ZlcmR1ZSA/ICdiYWQnIDogJycpOwoKICAgIHZhciBhbGVydHMgPSBkLmFsZXJ0cy5sZW5ndGgKICAgICAgPyAnPGRpdiBjbGFzcz0iYWxpc3QiPicgKyBkLmFsZXJ0cy5zbGljZSgwLDEy',
  'KS5tYXAoZnVuY3Rpb24oYSl7CiAgICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImFsaSBsLScgKyBhLmxldmVsICsgJyIgb25jbGljaz0iZ28oXCcnICsganVtcFBhZ2UoYS5tb2R1bGUpICsgJ1wnKSI+JyArCiAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9',
  'ImljIj4nICsgYS5pY29uICsgJzwvZGl2PjxkaXY+PGRpdiBjbGFzcz0idHQiPicgKyBlc2MoYS50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImRkIj4nICsgZXNjKGEuZGV0YWlsKSArICc8L2Rpdj48L2Rpdj48L2Rpdj4n',
  'OwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicKICAgICAgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPjxkaXYgY2xhc3M9ImJpZyI+4pyFPC9kaXY+4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ4LiE4LmJ4Liy4LiHIOKAlCDguJfguLjguIHguK3guKLguYjguLLg',
  'uIfguYDguKPguLXguKLguJrguKPguYnguK3guKI8L2Rpdj4nOwoKICAgIHJldHVybiAnJyArCiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKyBrcGlzICsgJzwvZGl2PicgKwoKICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzIgbWIxMiI+JyArCiAg',
  'ICAgICAgY2FyZCgn8J+SsCDguKPguLLguKLguIHguLLguKPguKrguKPguLjguJvguKPguKfguKEgKOC4q+C4meC4teC5ieC4q+C4peC4seC4gSknLAogICAgICAgICAgZGVidE1pbmkoZC5kZWJ0TWFpbiwgJ2RlYnRNYWluJyksCiAgICAgICAgICAnPGJ1dHRvbiBj',
  'bGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJnbyhcJ2RlYnRNYWluXCcpIj7guJTguLnguJfguLHguYnguIfguKvguKHguJQg4oaSPC9idXR0b24+JykgKwogICAgICAgIGNhcmQoJ/Cfp74g4Lir4LiZ4Li14LmJ4Liq4Li04LiZICjguKvguJnguLXguYnguKPguK3guIcp',
  'JywKICAgICAgICAgIGRlYnRNaW5pKGQuZGVidFN1YiwgJ2RlYnRTdWInKSArCiAgICAgICAgICAoZC5kZWJ0U3ViLmludGVyZXN0VGhpc1llYXIgPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtdDgiPuC4lOC4reC4geC5gOC4muC4teC5ieC4ouC4l+C4teC5iOC4',
  'iuC4s+C4o+C4sOC4m+C4tSAnICsgZC55ZWFyICsgJzogPGI+JyArIGJhaHQoZC5kZWJ0U3ViLmludGVyZXN0VGhpc1llYXIpICsgJzwvYj48L2Rpdj4nIDogJycpLAogICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZ28oXCdkZWJ0U3Vi',
  'XCcpIj7guJTguLnguJfguLHguYnguIfguKvguKHguJQg4oaSPC9idXR0b24+JykgKwogICAgICAnPC9kaXY+JyArCgogICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAgICBrcGkoJ+C4q+C5ieC4reC4h+C4l+C4seC5ieC4h+C4q+C4oeC4',
  'lCcsIGIudG90YWxSb29tcyArICcg4Lir4LmJ4Lit4LiHJywgJ+C4oeC4teC4nOC4ueC5ieC5gOC4iuC5iOC4siAnICsgYi5vY2N1cGllZCArICcgwrcg4Lin4LmI4Liy4LiHICcgKyBiLnZhY2FudCkgKwogICAgICAgIGtwaSgn4Lil4LmJ4Liy4LiH4LmB4Lit4Lij',
  '4LmM4Lib4Li1ICcgKyBkLnllYXIsIGQuYWMucm9vbXNEb25lICsgJy8nICsgYi50b3RhbFJvb21zICsgJyDguKvguYnguK3guIcnLCBkLmFjLmRvbmVJblllYXIgKyAnIOC4o+C4reC4miDCtyDguITguYnguLLguIcgJyArIGQuYWMucm9vbXNQZW5kaW5nICsgJyDg',
  'uKvguYnguK3guIcnLCBkLmFjLnJvb21zUGVuZGluZyA/ICd3YXJuJyA6ICdnb29kJykgKwogICAgICAgIGtwaSgn4LiL4Li34LmJ4Lit4LiC4Lit4LiH4Lib4Li1ICcgKyBkLnllYXIsIGJhaHQoZC5wdXJjaGFzZXMueWVhclRvdGFsKSwgZC5wdXJjaGFzZXMueWVh',
  'ckNvdW50ICsgJyDguKPguLLguKLguIHguLLguKMnKSArCiAgICAgICAga3BpKCfguJvguKPguLDguIHguLHguJnguYPguIHguKXguYnguKvguKHguJQnLCBkLnB1cmNoYXNlcy53YXJyYW50eS5leHBpcmluZyArICcg4Lij4Liy4Lii4LiB4Liy4LijJywgJ+C4q+C4',
  'oeC4lOC4reC4suC4ouC4uOC5geC4peC5ieC4pyAnICsgZC5wdXJjaGFzZXMud2FycmFudHkuZXhwaXJlZCwgZC5wdXJjaGFzZXMud2FycmFudHkuZXhwaXJpbmcgPyAnd2FybicgOiAnJykgKwogICAgICAnPC9kaXY+JyArCgogICAgICAnPGRpdiBjbGFzcz0iZ3Jp',
  'ZCBnMiBtYjEyIj4nICsKICAgICAgICBjYXJkKCfwn5OSIOC4o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKLguKvguK0g4Lib4Li1ICcgKyBkLnllYXIsCiAgICAgICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMyBtYjEyIj4nICsKICAgICAgICAg',
  'ICAga3BpKCfguKPguLLguKLguKPguLHguJonLCBiYWh0KGQuZmluYW5jZS5pbmNvbWUpLCAn4LmA4LiJ4Lil4Li14LmI4LiiICcgKyBiYWh0KGQuZmluYW5jZS5hdmdJbmNvbWUpICsgJy/guYDguJTguLfguK3guJknLCAnZ29vZCcpICsKICAgICAgICAgICAga3Bp',
  'KCfguKPguLLguKLguIjguYjguLLguKInLCBiYWh0KGQuZmluYW5jZS5leHBlbnNlKSwgJ+C5gOC4ieC4peC4teC5iOC4oiAnICsgYmFodChkLmZpbmFuY2UuYXZnRXhwZW5zZSkgKyAnL+C5gOC4lOC4t+C4reC4mScsICdiYWQnKSArCiAgICAgICAgICAgIGtwaSgn',
  '4LiE4LiH4LmA4Lir4Lil4Li34Lit4Liq4Li44LiX4LiY4Li0JywgYmFodChkLmZpbmFuY2UubmV0KSwgJ+C4reC4seC4leC4o+C4suC4geC4s+C5hOC4oyAnICsgcGN0KGQuZmluYW5jZS5tYXJnaW4pKSArCiAgICAgICAgICAnPC9kaXY+JyArIG1pbmlNb250aENo',
  'YXJ0KGQuZmluYW5jZS5ieU1vbnRoKSwKICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImdvKFwnZmluYW5jZVwnKSI+4LiU4Li54LiX4Lix4LmJ4LiH4Lir4Lih4LiUIOKGkjwvYnV0dG9uPicpICsKICAgICAgICBjYXJkKCfwn5eT77iP',
  'IOC4h+C4suC4meC4l+C4teC5iOC4geC4s+C4peC4seC4h+C4iOC4sOC4luC4tuC4hyAoJyArIGQudXBjb21pbmcubGVuZ3RoICsgJyknLAogICAgICAgICAgZC51cGNvbWluZy5sZW5ndGggPyAnPGRpdiBjbGFzcz0iYWxpc3QiPicgKyBkLnVwY29taW5nLnNsaWNl',
  'KDAsNykubWFwKGZ1bmN0aW9uKHUpewogICAgICAgICAgICB2YXIgbHZsID0gdS5kYXlzTGVmdCA8IDAgPyAnZGFuZ2VyJyA6ICh1LmRheXNMZWZ0IDw9IDcgPyAnd2FybicgOiAnaW5mbycpOwogICAgICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImFsaSBsLScg',
  'KyBsdmwgKyAnIiBvbmNsaWNrPSJnbyhcJycgKyBqdW1wUGFnZSh1Lm1vZHVsZSkgKyAnXCcpIj4nICsKICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0iaWMiPicgKyB1Lmljb24gKyAnPC9kaXY+PGRpdj48ZGl2IGNsYXNzPSJ0dCI+JyArIGVzYyh1LnRpdGxlKSAr',
  'ICc8L2Rpdj4nICsKICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0iZGQiPicgKyB0aERhdGUodS5kYXRlKSArICcgwrcgJyArCiAgICAgICAgICAgICAgICAodS5kYXlzTGVmdCA8IDAgPyAn4LmA4Lil4Lii4LiB4Liz4Lir4LiZ4LiUICcgKyAoLXUuZGF5c0xlZnQp',
  'ICsgJyDguKfguLHguJknIDogKHUuZGF5c0xlZnQgPT09IDAgPyAn4Lin4Lix4LiZ4LiZ4Li14LmJJyA6ICfguK3guLXguIEgJyArIHUuZGF5c0xlZnQgKyAnIOC4p+C4seC4mScpKSArCiAgICAgICAgICAgICAgJzwvZGl2PjwvZGl2PjwvZGl2Pic7CiAgICAgICAg',
  'ICB9KS5qb2luKCcnKSArICc8L2Rpdj4nIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPvCfjKTvuI88L2Rpdj7guYTguKHguYjguKHguLXguIfguLLguJnguJnguLHguJTguKvguKHguLLguKLguYDguKPguYfguKcg4LmGIOC4meC4teC5iTwv',
  'ZGl2PicsCiAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJnbyhcJ3JlcG9ydHNcJykiPuC4m+C4j+C4tOC4l+C4tOC4meC5gOC4leC5h+C4oSDihpI8L2J1dHRvbj4nLCB0cnVlKSArCiAgICAgICc8L2Rpdj4nICsKCiAgICAgICc8ZGl2',
  'IGNsYXNzPSJncmlkIGcyIj4nICsKICAgICAgICBjYXJkKCfwn5SUIOC4quC4tOC5iOC4h+C4l+C4teC5iOC4leC5ieC4reC4h+C4l+C4syAoJyArIGQuYWxlcnRzLmxlbmd0aCArICcpJywgYWxlcnRzLCAnJywgdHJ1ZSkgKwogICAgICAgIGNhcmQoJ/Cfj6Ig4LiH',
  '4Liy4LiZ4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmC4LiU4Lii4Lij4Lin4LihJywKICAgICAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGcyIj4nICsKICAgICAgICAgICAga3BpKCfguIfguLLguJnguJvguLUgJyArIGQueWVhciwgZC5idWlsZGluZ1Jl',
  'cGFpcnMueWVhckNvdW50ICsgJyDguIfguLLguJknLCAn4LiE4LmJ4Liy4LiHICcgKyBkLmJ1aWxkaW5nUmVwYWlycy5vcGVuQ291bnQpICsKICAgICAgICAgICAga3BpKCfguITguYjguLLguYPguIrguYnguIjguYjguLLguKInLCBiYWh0KGQuYnVpbGRpbmdSZXBh',
  'aXJzLnllYXJDb3N0KSwgJ+C4hOC4o+C4muC4geC4s+C4q+C4meC4lOC5gOC4o+C5h+C4pyDguYYg4LiZ4Li14LmJICcgKyBkLmJ1aWxkaW5nUmVwYWlycy51cGNvbWluZykgKwogICAgICAgICAgJzwvZGl2PicgKwogICAgICAgICAgKGQuZGVidE1haW4uZm9yZWNh',
  'c3QgJiYgZC5kZWJ0TWFpbi5mb3JlY2FzdC5tb250aHNMZWZ0CiAgICAgICAgICAgID8gJzxkaXYgY2xhc3M9ImhyIj48L2Rpdj48ZGl2IGNsYXNzPSJmczEzIj48Yj7guJvguKPguLDguKHguLLguJPguIHguLLguKPguJvguLTguJTguKvguJnguLXguYnguKvguKXg',
  'uLHguIE8L2I+PGRpdiBjbGFzcz0ibXV0ZWQgbXQ4Ij4nICsKICAgICAgICAgICAgICAn4LiI4Liy4LiB4Lit4Lix4LiV4Lij4Liy4LiK4Liz4Lij4Liw4LmA4LiJ4Lil4Li14LmI4LiiICcgKyBiYWh0KGQuZGVidE1haW4uZm9yZWNhc3QuYXZnUGVyTW9udGgpICsg',
  'Jy/guYDguJTguLfguK3guJkgKDEyIOC5gOC4lOC4t+C4reC4meC4peC5iOC4suC4quC4uOC4lCkgJyArCiAgICAgICAgICAgICAgJ+C4hOC4suC4lOC4p+C5iOC4suC4reC4teC4gSA8Yj4nICsgZC5kZWJ0TWFpbi5mb3JlY2FzdC5tb250aHNMZWZ0ICsgJyDguYDg',
  'uJTguLfguK3guJk8L2I+ICcgKwogICAgICAgICAgICAgICco4Lij4Liy4LinICcgKyB0aERhdGUoZC5kZWJ0TWFpbi5mb3JlY2FzdC5wYXlvZmZEYXRlKSArICcpPC9kaXY+PC9kaXY+JwogICAgICAgICAgICA6ICcnKSwKICAgICAgICAgICc8YnV0dG9uIGNsYXNz',
  'PSJidG4gc20iIG9uY2xpY2s9ImdvKFwnYnVpbGRpbmdcJykiPuC4lOC4ueC4l+C4seC5ieC4h+C4q+C4oeC4lCDihpI8L2J1dHRvbj4nKSArCiAgICAgICc8L2Rpdj4nOwogIH0sCiAgYWZ0ZXI6IGZ1bmN0aW9uKCl7CiAgICAvLyDguJXguLHguKfguYDguKXguILg',
  'uJrguJnguYDguKHguJnguLnguK3guLHguJvguYDguJTguJXguIjguLLguIHguKjguLnguJnguKLguYzguYHguIjguYnguIfguYDguJXguLfguK3guJkgKHJlZnJlc2hBbGVydHMpIOC4l+C4uOC4geC4q+C4meC5ieC4siDguYTguKHguYjguYPguIrguYjguYDguIng',
  'uJ7guLLguLDguKvguJnguYnguLLguJnguLXguYkKICAgIHJlZnJlc2hBbGVydHMoKTsKICB9Cn07CgpmdW5jdGlvbiBtaW5pTW9udGhDaGFydChieU1vbnRoKXsKICB2YXIgbWF4ID0gTWF0aC5tYXguYXBwbHkobnVsbCwgYnlNb250aC5tYXAoZnVuY3Rpb24obSl7',
  'IHJldHVybiBNYXRoLm1heChtLmluY29tZSwgbS5leHBlbnNlKTsgfSkpIHx8IDE7CiAgcmV0dXJuICc8ZGl2IHN0eWxlPSJkaXNwbGF5OmZsZXg7Z2FwOjNweDthbGlnbi1pdGVtczpmbGV4LWVuZDtoZWlnaHQ6NzRweCI+JyArIGJ5TW9udGgubWFwKGZ1bmN0aW9u',
  'KG0pewogICAgdmFyIGhpID0gTWF0aC5yb3VuZChtLmluY29tZSAvIG1heCAqIDY2KSwgaGUgPSBNYXRoLnJvdW5kKG0uZXhwZW5zZSAvIG1heCAqIDY2KTsKICAgIHJldHVybiAnPGRpdiBzdHlsZT0iZmxleDoxO3RleHQtYWxpZ246Y2VudGVyIiB0aXRsZT0iJyAr',
  'IG0ubGFiZWwgKyAnIMK3IOC4o+C4seC4miAnICsgbW9uZXkobS5pbmNvbWUpICsgJyDCtyDguIjguYjguLLguKIgJyArIG1vbmV5KG0uZXhwZW5zZSkgKyAnIj4nICsKICAgICAgJzxkaXYgc3R5bGU9ImRpc3BsYXk6ZmxleDtnYXA6MXB4O2FsaWduLWl0ZW1zOmZs',
  'ZXgtZW5kO2p1c3RpZnktY29udGVudDpjZW50ZXI7aGVpZ2h0OjY2cHgiPicgKwogICAgICAgICc8ZGl2IHN0eWxlPSJ3aWR0aDo2cHg7aGVpZ2h0OicgKyBoaSArICdweDtiYWNrZ3JvdW5kOnZhcigtLW9rKTtib3JkZXItcmFkaXVzOjJweCAycHggMCAwIj48L2Rp',
  'dj4nICsKICAgICAgICAnPGRpdiBzdHlsZT0id2lkdGg6NnB4O2hlaWdodDonICsgaGUgKyAncHg7YmFja2dyb3VuZDp2YXIoLS1kYW5nZXIpO2JvcmRlci1yYWRpdXM6MnB4IDJweCAwIDAiPjwvZGl2PicgKwogICAgICAnPC9kaXY+PGRpdiBjbGFzcz0iZmFpbnQi',
  'IHN0eWxlPSJmb250LXNpemU6OS41cHgiPicgKyBtLmxhYmVsLnJlcGxhY2UoJy4nLCcnKSArICc8L2Rpdj48L2Rpdj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2PicgKwogICc8ZGl2IGNsYXNzPSJyb3cgZnMxMiBtdXRlZCBtdDgiPjxzcGFuIGNsYXNzPSJiIG9r',
  'Ij7guKPguLLguKLguKPguLHguJo8L3NwYW4+PHNwYW4gY2xhc3M9ImIgZGdyIj7guKPguLLguKLguIjguYjguLLguKI8L3NwYW4+PC9kaXY+JzsKfQoKZnVuY3Rpb24gZGVidE1pbmkoeCwgcGFnZSl7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJwbWV0YSIgc3R5bGU9',
  'Im1hcmdpbjowIDAgNnB4Ij48c3Bhbj7guIrguLPguKPguLDguYHguKXguYnguKcgPGI+JyArIGJhaHQoeC5wYWlkKSArICc8L2I+PC9zcGFuPicgKwogICAgICAgICAnPHNwYW4+PGI+JyArIHBjdCh4LnBlcmNlbnQpICsgJzwvYj48L3NwYW4+PC9kaXY+JyArCiAg',
  'ICAgICAgIHByb2dyZXNzKHgucGVyY2VudCwgJ2xnJykgKwogICAgICAgICAnPGRpdiBjbGFzcz0icG1ldGEiPjxzcGFuPuC4hOC4h+C5gOC4q+C4peC4t+C4rSA8Yj4nICsgYmFodCh4LnJlbWFpbmluZykgKyAnPC9iPjwvc3Bhbj4nICsKICAgICAgICAgJzxzcGFu',
  'PuC4ouC4reC4lOC4q+C4meC4teC5ieC4l+C4seC5ieC4h+C4q+C4oeC4lCA8Yj4nICsgYmFodCh4LnRvdGFsKSArICc8L2I+PC9zcGFuPjwvZGl2PicgKwogICAgICAgICAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtdDgiPuC4iuC4s+C4o+C4sOC5g+C4meC4m+C4',
  'teC4l+C4teC5iOC5gOC4peC4t+C4reC4gTogPGI+JyArIGJhaHQoeC50aGlzWWVhcikgKyAnPC9iPjwvZGl2Pic7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICAyKSDguKvguJnguLXg',
  'uYnguKvguKXguLHguIEgLyDguKvguJnguLXguYnguKPguK3guIcgKOC5g+C4iuC5ieC4leC4seC4p+C4p+C4suC4lOC4o+C5iOC4p+C4oeC4geC4seC4mSkKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09ICovCmZ1bmN0aW9uIGRlYnRSb3V0ZShsZWRnZXIsIHRpdGxlKXsKICByZXR1cm4gewogICAgbG9hZDogZnVuY3Rpb24oKXsKICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFsKICAgICAgICBjYWxsQXBpKCdkZWJ0LnN1bW1hcnknLCB7IGxlZGdlcjogbGVkZ2Vy',
  'LCB5ZWFyOiBTLnllYXIgfSksCiAgICAgICAgY2FsbEFwaSgnZGVidC5wYXltZW50cycsIHsgbGVkZ2VyOiBsZWRnZXIsIHllYXI6IFMueWVhciB9KQogICAgICBdKS50aGVuKGZ1bmN0aW9uKHIpewogICAgICAgIHZhciBkID0gclswXTsgZC5wYXltZW50cyA9IHJb',
  'MV07IGQubGVkZ2VyID0gbGVkZ2VyOyBkLnBhZ2VUaXRsZSA9IHRpdGxlOwogICAgICAgIHJldHVybiBkOwogICAgICB9KTsKICAgIH0sCiAgICByZW5kZXI6IHJlbmRlckRlYnQsCiAgICBhZnRlcjogY2FjaGVBbGxEZWJ0cwogIH07Cn0KUk9VVEVTLmRlYnRNYWlu',
  'ID0gZGVidFJvdXRlKCfguKvguJnguLXguYnguKvguKXguLHguIEnLCAn4Lij4Liy4Lii4LiB4Liy4Lij4Liq4Lij4Li44Lib4Lij4Lin4LihIFRoZSBNIENvcm5lciBBUCcpOwpST1VURVMuZGVidFN1YiAgPSBkZWJ0Um91dGUoJ+C4q+C4meC4teC5ieC4o+C4reC4',
  'hycsICfguKvguJnguLXguYnguKrguLTguJknKTsKCi8qKiDguYDguIHguYfguJrguKPguLLguKLguIrguLfguYjguK3guIHguYnguK3guJnguKvguJnguLXguYnguJfguLjguIHguJrguLHguI3guIrguLXguYTguKfguYnguYPguKvguYnguJ/guK3guKPguYzguKHg',
  'uYDguKXguLfguK3guIEgIuC5gOC4m+C5h+C4meC4quC5iOC4p+C4meC4q+C4meC4tuC5iOC4h+C4guC4reC4hyIgKi8KZnVuY3Rpb24gY2FjaGVBbGxEZWJ0cygpewogIGNhbGxBcGkoJ2RlYnQubGlzdCcsIHt9KS50aGVuKGZ1bmN0aW9uKGxpc3QpewogICAgQUxM',
  'X0RFQlRTID0gbGlzdC5tYXAoZnVuY3Rpb24oZCl7CiAgICAgIHJldHVybiB7IGlkOiBkLmlkLCB0aXRsZTogZC50aXRsZSwgbGVkZ2VyOiBkLmxlZGdlciwgcGFyZW50SWQ6IGQucGFyZW50SWQgfHwgJycgfTsKICAgIH0pOwogIH0pLmNhdGNoKGZ1bmN0aW9uKCl7',
  'fSk7Cn0KCmZ1bmN0aW9uIHJlbmRlckRlYnQoZCl7CiAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKCiAgdmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iY2FyZCBtYjEyIj48ZGl2',
  'IGNsYXNzPSJjYXJkLWIiPicgKwogICAgJzxkaXYgY2xhc3M9InJvdyBtYjEyIj48aDMgc3R5bGU9Im1hcmdpbjowO2ZvbnQtc2l6ZToxNXB4Ij4nICsgZXNjKGQucGFnZVRpdGxlKSArICc8L2gzPicgKwogICAgJzxzcGFuIGNsYXNzPSJzcCI+PC9zcGFuPicgKwog',
  'ICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgc20iIG9uY2xpY2s9ImZvcm1EZWJ0UGF5bWVudChudWxsLFwnJyArIGQubGVkZ2VyICsgJ1wnKSI+KyDguJrguLHguJnguJfguLbguIHguIHguLLguKPguIrguLPguKPguLA8L2J1dHRvbj4nICsKICAgICc8YnV0dG9u',
  'IGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImZvcm1EZWJ0KG51bGwsXCcnICsgZC5sZWRnZXIgKyAnXCcpIj4rIOC5gOC4nuC4tOC5iOC4oeC4geC5ieC4reC4meC4q+C4meC4teC5iTwvYnV0dG9uPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InBtZXRhIiBzdHls',
  'ZT0ibWFyZ2luOjAgMCA3cHgiPjxzcGFuPuC4hOC4p+C4suC4oeC4hOC4t+C4muC4q+C4meC5ieC4suC4geC4suC4o+C4iuC4s+C4o+C4sDwvc3Bhbj48c3Bhbj48Yj4nICsgcGN0KGQucGVyY2VudCkgKyAnPC9iPjwvc3Bhbj48L2Rpdj4nICsKICAgIHByb2dyZXNz',
  'KGQucGVyY2VudCwgJ2xnICcgKyAoZC5wZXJjZW50ID49IDEwMCA/ICdvaycgOiAnJykpICsKICAgICc8ZGl2IGNsYXNzPSJncmlkIGc0IG10MTYiPicgKwogICAgICBrcGkoJ+C4ouC4reC4lOC4q+C4meC4teC5ieC4l+C4seC5ieC4h+C4q+C4oeC4lCcsIGJhaHQo',
  'ZC50b3RhbERlYnQpLCBkLmRlYnRzLmxlbmd0aCArICcg4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJJykgKwogICAgICBrcGkoJ+C4iuC4s+C4o+C4sOC5geC4peC5ieC4pycsIGJhaHQoZC5wYWlkKSwgZC5wYXltZW50Q291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4',
  'o+C5guC4reC4mScsICdnb29kJykgKwogICAgICBrcGkoJ+C4hOC4h+C5gOC4q+C4peC4t+C4rScsIGJhaHQoZC5yZW1haW5pbmcpLCAn4Lit4Li14LiBICcgKyBwY3QoMTAwIC0gZC5wZXJjZW50KSArICcg4LiI4Liw4Lib4Li04LiU4Lir4LiZ4Li14LmJJywgJ2Jh',
  'ZCcpICsKICAgICAga3BpKCfguIrguLPguKPguLDguYPguJknICsgeWVhckxhYmVsLCBiYWh0KGQuc2VsZWN0ZWRZZWFyUGFpZCksIGQuc2VsZWN0ZWRZZWFyQ291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4oycgKwogICAgICAgICAgKGQuc2VsZWN0ZWRZZWFySW50',
  'ZXJlc3QgPyAnIMK3IOC4lOC4reC4geC5gOC4muC4teC5ieC4oiAnICsgYmFodChkLnNlbGVjdGVkWWVhckludGVyZXN0KSA6ICcnKSkgKwogICAgJzwvZGl2PjwvZGl2PjwvZGl2Pic7CgogIHZhciBwZXJEZWJ0ID0gZC5kZWJ0cy5sZW5ndGggPyAnPGRpdiBjbGFz',
  'cz0iZ3JpZCBnLWF1dG8gbWIxMiI+JyArIGQuZGVidHMubWFwKGZ1bmN0aW9uKHgpewogICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJjYXJkIj48ZGl2IGNsYXNzPSJjYXJkLWIiPicgKwogICAgICAnPGRpdiBjbGFzcz0iY2xpcCIgc3R5bGU9ImZvbnQtd2VpZ2h0OjY1',
  'MDtmb250LXNpemU6MTMuNXB4O21pbi1oZWlnaHQ6MzhweCI+JyArIGVzYyh4LnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBmczEyIG11dGVkIG1iOCI+JyArIHN0YXR1c0JhZGdlKHguc3RhdHVzKSArCiAgICAgICAgJzxzcGFuPicg',
  'KyBlc2MoeC5jcmVkaXRvciB8fCAn4oCTJykgKyAoeC5zdGFydERhdGUgPyAnIMK3ICcgKyB0aERhdGUoeC5zdGFydERhdGUpIDogJycpICsgJzwvc3Bhbj48L2Rpdj4nICsKICAgICAgKHgucGFyZW50VGl0bGUKICAgICAgICA/ICc8ZGl2IGNsYXNzPSJiIGluZm8g',
  'bWI4IiB0aXRsZT0i4Lii4Lit4LiU4LiB4LmJ4Lit4LiZ4LiZ4Li14LmJ4Lit4Lii4Li54LmI4LmD4LiZ4LiB4LmJ4Lit4LiZ4LmB4Lih4LmI4LmB4Lil4LmJ4LinIOC4iOC5iOC4suC4ouC4hOC4t+C4meC4geC5ieC4reC4meC4meC4teC5ieC4geC5ieC4reC4meC5',
  'geC4oeC5iOC4iOC4sOC4peC4lOC4leC4suC4oSI+JyArCiAgICAgICAgICAn4oazIOC5gOC4m+C5h+C4meC4quC5iOC4p+C4meC4q+C4meC4tuC5iOC4h+C4guC4reC4hyAnICsgZXNjKHgucGFyZW50VGl0bGUpICsgJzwvZGl2PicKICAgICAgICA6ICcnKSArCiAg',
  'ICAgIHByb2dyZXNzKHgucGVyY2VudCkgKwogICAgICAnPGRpdiBjbGFzcz0icG1ldGEiPjxzcGFuPuC4iuC4s+C4o+C4sCA8Yj4nICsgYmFodCh4LnBhaWQpICsgJzwvYj48L3NwYW4+PHNwYW4+4LiE4LiH4LmA4Lir4Lil4Li34LitIDxiPicgKyBiYWh0KHgucmVt',
  'YWluaW5nKSArICc8L2I+PC9zcGFuPjwvZGl2PicgKwogICAgICAoeC5jaGlsZHJlbiAmJiB4LmNoaWxkcmVuLmxlbmd0aAogICAgICAgID8gJzxkaXYgY2xhc3M9ImhyIiBzdHlsZT0ibWFyZ2luOjEycHggMCAxMHB4Ij48L2Rpdj4nICsKICAgICAgICAgICc8ZGl2',
  'IGNsYXNzPSJmczEyIG11dGVkIG1iOCI+4LmD4LiZ4Lii4Lit4LiU4LiZ4Li14LmJ4Lih4Li14LiB4LmJ4Lit4LiZ4Lii4LmI4Lit4Lii4Lit4Lii4Li54LmIICcgKyB4LmNoaWxkcmVuLmxlbmd0aCArICcg4LiB4LmJ4Lit4LiZPC9kaXY+JyArCiAgICAgICAgICB4',
  'LmNoaWxkcmVuLm1hcChmdW5jdGlvbihjKXsKICAgICAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJtYjgiPicgKwogICAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJyb3cgZnMxMiI+PHNwYW4+4oazICcgKyBlc2MoYy50aXRsZSkgKyAnPC9zcGFuPicgKwogICAg',
  'ICAgICAgICAgICc8c3BhbiBjbGFzcz0ic3AgbW9ubyI+JyArIG1vbmV5KGMucGFpZCkgKyAnIC8gJyArIG1vbmV5KGMucHJpbmNpcGFsKSArICc8L3NwYW4+PC9kaXY+JyArCiAgICAgICAgICAgICAgcHJvZ3Jlc3MoYy5wZXJjZW50LCAnb2snKSArICc8L2Rpdj4n',
  'OwogICAgICAgICAgfSkuam9pbignJykgKwogICAgICAgICAgKHgucGFpZEZyb21DaGlsZHJlbiA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIj7guKPguKfguKHguKLguK3guJTguJfguLXguYjguKHguLLguIjguLLguIHguIHguYnguK3guJnguKLguYjguK3guKIg',
  'JyArIGJhaHQoeC5wYWlkRnJvbUNoaWxkcmVuKSArICc8L2Rpdj4nIDogJycpCiAgICAgICAgOiAnJykgKwogICAgICAoeC5pbnRlcmVzdFBlck1vbnRoID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbXQ4Ij7guJTguK3guIHguYDguJrguLXguYnguKIgJyArIGJh',
  'aHQoeC5pbnRlcmVzdFBlck1vbnRoKSArICcv4LmA4LiU4Li34Lit4LiZPC9kaXY+JyA6ICcnKSArCiAgICAgICh4LnBsYW5QZXJNb250aCA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIj7guYHguJzguJnguJzguYjguK3guJkgJyArIGJhaHQoeC5wbGFuUGVyTW9u',
  'dGgpICsgJy/guYDguJTguLfguK3guJk8L2Rpdj4nIDogJycpICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBtdDEyIj48YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9XCdmb3JtRGVidCgnICsgYXR0cih4KSArICcsIicgKyBkLmxlZGdlciArICciKVwnPuC5',
  'geC4geC5ieC5hOC4gjwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGRnciIgb25jbGljaz0iZGVsRGVidChcJycgKyB4LmlkICsgJ1wnKSI+4Lil4LiaPC9idXR0b24+PC9kaXY+JyArCiAgICAnPC9kaXY+PC9kaXY+JzsKICB9KS5qb2lu',
  'KCcnKSArICc8L2Rpdj4nIDogJyc7CgogIHZhciBieVllYXIgPSBkLmJ5WWVhci5sZW5ndGggPyBjYXJkKCfwn5OFIOC4ouC4reC4lOC4iuC4s+C4o+C4sOC5geC4ouC4geC4leC4suC4oeC4m+C4tScsCiAgICAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0i',
  'dCI+PHRoZWFkPjx0cj4nICsKICAgICc8dGg+4Lib4Li1PC90aD48dGggY2xhc3M9Im51bSI+4LmA4LiH4Li04LiZ4LiV4LmJ4LiZPC90aD48dGggY2xhc3M9Im51bSI+4LiU4Lit4LiB4LmA4Lia4Li14LmJ4LiiPC90aD48dGggY2xhc3M9Im51bSI+4Lij4Lin4Lih',
  '4LiX4Li14LmI4LmC4Lit4LiZPC90aD4nICsKICAgICc8dGggY2xhc3M9Im51bSI+4LiI4Liz4LiZ4Lin4LiZ4LiE4Lij4Lix4LmJ4LiHPC90aD48dGggY2xhc3M9Im51bSI+4LmA4LiH4Li04LiZ4LiV4LmJ4LiZ4Liq4Liw4Liq4LihPC90aD48dGggc3R5bGU9Indp',
  'ZHRoOjI2JSI+4LiE4Lin4Liy4Lih4LiE4Li34Lia4Lir4LiZ4LmJ4Liy4Liq4Liw4Liq4LihPC90aD4nICsKICAgICc8L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgZC5ieVllYXIubWFwKGZ1bmN0aW9uKHkpewogICAgICB2YXIgY3VtID0geS5jdW11bGF0aXZl',
  'ICE9IG51bGwgPyB5LmN1bXVsYXRpdmUgOiAwOwogICAgICB2YXIgcCA9IGQudG90YWxEZWJ0ID8gKGN1bSAvIGQudG90YWxEZWJ0ICogMTAwKSA6IDA7CiAgICAgIHJldHVybiAnPHRyIG9uY2xpY2s9InNldFllYXJGcm9tVGFibGUoJyArIHkueWVhciArICcpIiBz',
  'dHlsZT0iY3Vyc29yOnBvaW50ZXIiPicgKwogICAgICAgICc8dGQ+PGI+JyArIHkueWVhciArICc8L2I+IDxzcGFuIGNsYXNzPSJmYWludCBmczEyIj4vICcgKyAoeS55ZWFyKzU0MykgKyAnPC9zcGFuPjwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4n',
  'ICsgbW9uZXkoeS5wcmluY2lwYWwpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHkuaW50ZXJlc3QgPyBtb25leSh5LmludGVyZXN0KSA6ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9Im51bSI+PGI+JyArIG1v',
  'bmV5KHkucHJpbmNpcGFsICsgeS5pbnRlcmVzdCkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgeS5jb3VudCArICc8L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIG1vbmV5KGN1bSkgKyAnPC90ZD4nICsKICAg',
  'ICAgICAnPHRkPicgKyBwcm9ncmVzcyhwKSArICc8L3RkPjwvdHI+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nLCAnJywgdHJ1ZSkgOiAnJzsKCiAgdmFyIHJvd3MgPSBkLnBheW1lbnRzOwogIHZhciBsaXN0ID0gY2FyZCgn8J+n',
  'viDguKPguLLguKLguIHguLLguKPguYLguK3guJnguYPguIrguYnguKvguJnguLXguYkgwrcgJyArIHllYXJMYWJlbCArICcgKCcgKyByb3dzLmxlbmd0aCArICcpJywKICAgIHJvd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0',
  'aGVhZD48dHI+JyArCiAgICAgICc8dGg+4Lin4Lix4LiZ4LiX4Li14LmIPC90aD48dGg+4LiH4Lin4LiUPC90aD48dGggY2xhc3M9Im51bSI+4LmA4LiH4Li04LiZ4LiV4LmJ4LiZPC90aD48dGggY2xhc3M9Im51bSI+4LiU4Lit4LiB4LmA4Lia4Li14LmJ4LiiPC90',
  'aD4nICsKICAgICAgJzx0aCBjbGFzcz0ibnVtIj7guKPguKfguKHguJfguLXguYjguYLguK3guJk8L3RoPjx0aD7guIrguYjguK3guIfguJfguLLguIc8L3RoPicgKwogICAgICAnPHRoPuC4quC4peC4tOC4mzwvdGg+PHRoPuC4q+C4oeC4suC4ouC5gOC4q+C4leC4',
  'uDwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgcm93cy5tYXAoZnVuY3Rpb24ocCl7CiAgICAgICAgcmV0dXJuICc8dHI+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAiPicgKyB0aERhdGUocC5wYXlEYXRlKSArICc8L3Rk',
  'PicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIj4nICsgZXNjKHAuaW5zdGFsbG1lbnQgfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAocC5wcmluY2lwYWwgPyAnPGIgc3R5bGU9ImNvbG9yOnZhcigtLW9r',
  'KSI+JyArIG1vbmV5KHAucHJpbmNpcGFsKSArICc8L2I+JyA6ICc8c3BhbiBjbGFzcz0iZmFpbnQiPuKAkzwvc3Bhbj4nKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHAuaW50ZXJlc3QgPyAnPGIgc3R5bGU9ImNvbG9yOnZhcigt',
  'LXdhcm4pIj4nICsgbW9uZXkocC5pbnRlcmVzdCkgKyAnPC9iPicgOiAnPHNwYW4gY2xhc3M9ImZhaW50Ij7igJM8L3NwYW4+JykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+PGI+JyArIG1vbmV5KHAuYW1vdW50KSArICc8L2I+PC90ZD4n',
  'ICsKICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MocC5jaGFubmVsIHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbChwLnNsaXBSZWZzKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0iZnMx',
  'MiBtdXRlZCBjbGlwIj4nICsgZXNjKHAubm90ZSB8fCAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsKICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIiBvbmNsaWNrPVwnZm9ybURlYnRQ',
  'YXltZW50KCcgKyBhdHRyKHApICsgJywiJyArIGQubGVkZ2VyICsgJyIpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiBkZ3IiIG9uY2xpY2s9ImRlbERlYnRQYXltZW50KFwnJyArIHAuaWQgKyAnXCcp',
  'Ij7wn5eRPC9idXR0b24+JyArCiAgICAgICAgICAnPC9kaXY+PC90ZD48L3RyPic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nCiAgICA6IGVtcHR5Qm94KCfguKLguLHguIfguYTguKHguYjguKHguLXguKPguLLguKLguIHguLLg',
  'uKPguIrguLPguKPguLDguYPguJknICsgeWVhckxhYmVsLAogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtRGVidFBheW1lbnQobnVsbCxcJycgKyBkLmxlZGdlciArICdcJykiPisg4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij',
  '4LiK4Liz4Lij4LiwPC9idXR0b24+JyksCiAgICAnJywgdHJ1ZSk7CgogIHJldHVybiBoZWFkICsgcGVyRGVidCArIGJ5WWVhciArICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgbGlzdCArICc8L2Rpdj4nOwp9CgpmdW5jdGlvbiBzZXRZZWFyRnJvbVRhYmxlKHkpewog',
  'IFMueWVhciA9IFN0cmluZyh5KTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgneWVhclNlbCcpLnZhbHVlID0gUy55ZWFyOwogIGxvYWQoKTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'CiAgIDMpIOC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLnB1cmNoYXNlcyA9IHsKICBsb2FkOiBmdW5jdGlv',
  'bigpewogICAgcmV0dXJuIFByb21pc2UuYWxsKFsKICAgICAgY2FsbEFwaSgncHVyY2hhc2Uuc3VtbWFyeScsIHsgeWVhcjogUy55ZWFyIH0pLAogICAgICBjYWxsQXBpKCdwdXJjaGFzZS5saXN0JywgeyB5ZWFyOiBTLnllYXIsIGNhdGVnb3J5OiBTLnBhcmFtcy5j',
  'YXRlZ29yeSB8fCAnJywgcTogUy5wYXJhbXMucSB8fCAnJyB9KQogICAgXSkudGhlbihmdW5jdGlvbihyKXsgdmFyIGQgPSByWzBdOyBkLml0ZW1zID0gclsxXTsgcmV0dXJuIGQ7IH0pOwogIH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciB5ZWFyTGFi',
  'ZWwgPSBTLnllYXIgPT09ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICBrcGkoJ+C4ouC4reC4lOC4i+C4t+C5ieC4rSAnICsgeWVh',
  'ckxhYmVsLCBiYWh0KGQueWVhclRvdGFsKSwgZC55ZWFyQ291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4oycsICdhY2NlbnQnKSArCiAgICAgIGtwaSgn4Lii4Lit4LiU4Liq4Liw4Liq4Lih4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJywgYmFodChkLmdyYW5kVG90YWwp',
  'LCBkLmdyYW5kQ291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4oycpICsKICAgICAga3BpKCfguK3guKLguLnguYjguYPguJnguJvguKPguLDguIHguLHguJknLCBkLndhcnJhbnR5LmFjdGl2ZSArICcg4Lij4Liy4Lii4LiB4Liy4LijJywgJ+C5g+C4geC4peC5ieC4',
  'q+C4oeC4lCAnICsgZC53YXJyYW50eS5leHBpcmluZywgZC53YXJyYW50eS5leHBpcmluZyA/ICd3YXJuJyA6ICdnb29kJykgKwogICAgICBrcGkoJ+C4q+C4oeC4p+C4lOC4l+C4teC5iOC5g+C4iuC5ieC4iOC5iOC4suC4ouC4quC4ueC4h+C4quC4uOC4lCcsIGQu',
  'YnlDYXRlZ29yeVswXSA/IGQuYnlDYXRlZ29yeVswXS5jYXRlZ29yeSA6ICfigJMnLAogICAgICAgICAgZC5ieUNhdGVnb3J5WzBdID8gYmFodChkLmJ5Q2F0ZWdvcnlbMF0udG90YWwpIDogJycpICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciBjaGFydHMgPSAnPGRp',
  'diBjbGFzcz0iZ3JpZCBnMiBtYjEyIj4nICsKICAgICAgY2FyZCgn8J+TiiDguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguYHguKLguIHguJXguLLguKHguKvguKHguKfguJTguKvguKHguLnguYggwrcgJyArIHllYXJMYWJlbCwKICAgICAgICBiYXJDaGFy',
  'dChkLmJ5Q2F0ZWdvcnksICdjYXRlZ29yeScsICd0b3RhbCcsIGZ1bmN0aW9uKGkpeyByZXR1cm4gbW9uZXkoaS50b3RhbCkgKyAnIOC4vyc7IH0pKSArCiAgICAgIGNhcmQoJ/Cfk4Ug4Lii4Lit4LiU4LiL4Li34LmJ4Lit4LmB4Lii4LiB4LiV4Liy4Lih4Lib4Li1',
  'JywKICAgICAgICBiYXJDaGFydChkLmJ5WWVhci5tYXAoZnVuY3Rpb24oeSl7IHJldHVybiB7IGxhYmVsOiAn4Lib4Li1ICcgKyB5LnllYXIgKyAnICgnICsgeS5jb3VudCArICcpJywgdG90YWw6IHkudG90YWwsIHllYXI6IHkueWVhciB9OyB9KSwKICAgICAgICAg',
  'ICAgICAgICAnbGFiZWwnLCAndG90YWwnLCBmdW5jdGlvbihpKXsgcmV0dXJuIG1vbmV5KGkudG90YWwpICsgJyDguL8nOyB9KSkgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIGNhdHMgPSAnPGRpdiBjbGFzcz0iY2hpcHMgbWIxMiI+JyArCiAgICAgICc8YnV0dG9u',
  'IGNsYXNzPSJjaGlwICcgKyAoIVMucGFyYW1zLmNhdGVnb3J5Pydvbic6JycpICsgJyIgb25jbGljaz0ic2V0UGFyYW0oXCdjYXRlZ29yeVwnLFwnXCcpIj7guJfguLjguIHguKvguKHguKfguJQ8L2J1dHRvbj4nICsKICAgICAgZC5ieUNhdGVnb3J5Lm1hcChmdW5j',
  'dGlvbihjKXsKICAgICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9ImNoaXAgJyArIChTLnBhcmFtcy5jYXRlZ29yeT09PWMuY2F0ZWdvcnk/J29uJzonJykgKyAnIiAnICsKICAgICAgICAgICAgICAgJ29uY2xpY2s9InNldFBhcmFtKFwnY2F0ZWdvcnlcJyxcJycg',
  'KyBlc2MoYy5jYXRlZ29yeSkgKyAnXCcpIj4nICsgZXNjKGMuY2F0ZWdvcnkpICsgJyAoJyArIGMuY291bnQgKyAnKTwvYnV0dG9uPic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7CgogICAgdmFyIHJvd3MgPSBkLml0ZW1zOwogICAgdmFyIHRhYmxlID0g',
  'Y2FyZCgn8J+bkiDguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcgwrcgJyArIHllYXJMYWJlbCArICcgKCcgKyByb3dzLmxlbmd0aCArICcpJywKICAgICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIg',
  'c3R5bGU9Im1pbi13aWR0aDo5ODBweCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoIHN0eWxlPSJ3aWR0aDo5NnB4Ij7guKfguLHguJnguJfguLXguYjguIvguLfguYnguK08L3RoPjx0aD7guKPguLLguKLguIHguLLguKPguKrguLTguJnguITguYnguLI8L3Ro',
  'Pjx0aCBjbGFzcz0ibnVtIj7guIjguLPguJnguKfguJk8L3RoPicgKwogICAgICAgICc8dGggY2xhc3M9Im51bSI+4Lij4Liy4LiE4LiyPC90aD48dGg+4LmB4Lir4Lil4LmI4LiH4LiX4Li14LmI4LiL4Li34LmJ4LitPC90aD48dGg+4Lib4Lij4Liw4LiB4Lix4LiZ',
  'PC90aD48dGg+4Lig4Liy4LiePC90aD48dGg+4Liq4Lil4Li04LibPC90aD48dGg+PC90aD4nICsKICAgICAgICAnPC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICByb3dzLm1hcChmdW5jdGlvbihwKXsKICAgICAgICAgIHZhciB3ID0gcC53YXJyYW50eSB8',
  'fCB7fTsKICAgICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZShwLmJ1eURhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0iY2xpcCIgdGl0bGU9IicgKyBl',
  'c2MocC5pdGVtKSArICciPjxiPicgKyBlc2MocC5pdGVtKSArICc8L2I+PC9kaXY+JyArCiAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImZzMTIgZmFpbnQiPicgKyBlc2MocC5jYXRlZ29yeSB8fCAnJykgKyAocC5yb29tID8gJyDCtyDguKvguYnguK3guIcgJyAr',
  'IGVzYyhwLnJvb20pIDogJycpICsKICAgICAgICAgICAgICAgIChwLm9yZGVyTm8gPyAnIMK3IOC4reC4reC4o+C5jOC5gOC4lOC4reC4o+C5jCAnICsgZXNjKHAub3JkZXJObykgOiAnJykgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICAgYmlsbEh0bWwocCkgKyAn',
  'PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbnVtKHAucXR5KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxiPicgKyBtb25leShwLnByaWNlKSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBj',
  'bGFzcz0iZnMxMiI+JyArIGVzYyhwLnZlbmRvciB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArICh3LmhhcwogICAgICAgICAgICAgICAgPyBzdGF0dXNCYWRnZSh3LnN0YXRlKSArICc8ZGl2IGNsYXNzPSJmYWlu',
  'dCIgc3R5bGU9ImZvbnQtc2l6ZToxMXB4Ij4nICsgdGhEYXRlU2hvcnQody5lbmQpICsgJzwvZGl2PicKICAgICAgICAgICAgICAgIDogJzxzcGFuIGNsYXNzPSJmYWludCI+4oCTPC9zcGFuPicpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1i',
  'c0h0bWwocC5waG90b1JlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwocC5zbGlwUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48ZGl2IGNsYXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgICAgICc8YnV0',
  'dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1QdXJjaGFzZSgnICsgYXR0cihwKSArICcpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIGRnciIgb25jbGljaz0iZGVsUHVyY2hh',
  'c2UoXCcnICsgcC5pZCArICdcJykiPvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICAgJzwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nCiAgICAgIDogZW1wdHlCb3goJ+C4ouC4seC4h+C5hOC4',
  'oeC5iOC4oeC4teC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC5g+C4mScgKyB5ZWFyTGFiZWwsICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtUHVyY2hhc2UobnVsbCkiPisg4LmA4Lie4Li04LmI4Lih4Lij4Liy4Lii4LiB4Liy4Lij',
  '4LiL4Li34LmJ4LitPC9idXR0b24+JyksCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIHNtIiBvbmNsaWNrPSJmb3JtUHVyY2hhc2UobnVsbCkiPisg4LmA4Lie4Li04LmI4Lih4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4LitPC9idXR0b24+JywgdHJ1',
  'ZSk7CgogICAgcmV0dXJuIGhlYWQgKyBjaGFydHMgKyBjYXRzICsgdGFibGU7CiAgfQp9OwoKLyoqCiAqIOC4muC4tOC4peC4l+C4teC5iOC4oeC4teC4guC4reC4h+C4q+C4peC4suC4ouC4reC4ouC5iOC4suC4hyDigJQg4LmB4Liq4LiU4LiH4LmA4Lib4LmH4LiZ',
  '4Lib4Li44LmI4Lih4LiB4Liy4LiH4LiU4Li5IOC5hOC4oeC5iOC5g+C4q+C5ieC4leC4suC4o+C4suC4h+C4ouC4suC4p+C5gOC4geC4tOC4meC5hOC4mwogKiDguJrguLTguKXguJfguLXguYjguKHguLXguKPguLLguKLguIHguLLguKPguYDguJTguLXguKLguKfg',
  'uKvguKPguLfguK3guYTguKHguYjguKHguLXguKPguLLguKLguIHguLLguKPguKLguYjguK3guKLguYDguKXguKIg4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LmB4Liq4LiU4LiH4Lit4Liw4LmE4Lij4LmA4Lie4Li04LmI4LihCiAqLwpmdW5jdGlvbiBiaWxsSHRtbChw',
  'KXsKICB2YXIgYiA9IHAuYmlsbDsKICBpZiAoIWIgfHwgYi5jb3VudCA8IDIpIHJldHVybiAnJzsKICB2YXIgaWQgPSAnYmlsbF8nICsgcC5pZDsKICByZXR1cm4gJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYmlsbC10b2dnbGUiIG9uY2xpY2s9InRvZ2ds',
  'ZUJpbGwoXCcnICsgaWQgKyAnXCcpIj4nICsKICAgICAgJ/Cfp74gJyArIGIuY291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4o+C5g+C4meC4muC4tOC4pSDilr48L2J1dHRvbj4nICsKICAgICc8ZGl2IGNsYXNzPSJiaWxsLWxpbmVzIiBpZD0iJyArIGlkICsgJyIg',
  'aGlkZGVuPicgKwogICAgICBiLmxpbmVzLm1hcChmdW5jdGlvbihsKXsKICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImJpbGwtbGluZSI+JyArCiAgICAgICAgICAnPHNwYW4gY2xhc3M9Im5tIiB0aXRsZT0iJyArIGVzYyhsLm5hbWUpICsgJyI+JyArIGVzYyhs',
  'Lm5hbWUpICsgJzwvc3Bhbj4nICsKICAgICAgICAgICc8c3BhbiBjbGFzcz0icXQiPicgKyBudW0obC5xdHkpICsgKGwudW5pdCA/ICcgJyArIGVzYyhsLnVuaXQpIDogJycpICsgJyDDlyAnICsgbW9uZXkobC51bml0UHJpY2UsIDIpICsgJzwvc3Bhbj4nICsKICAg',
  'ICAgICAgICc8c3BhbiBjbGFzcz0idHQiPicgKyBtb25leShsLnRvdGFsLCAyKSArICc8L3NwYW4+PC9kaXY+JzsKICAgICAgfSkuam9pbignJykgKwogICAgICAoKGIuc2hpcHBpbmcgfHwgYi5kaXNjb3VudCkKICAgICAgICA/ICc8ZGl2IGNsYXNzPSJiaWxsLWV4',
  'dHJhIj4nICsKICAgICAgICAgICAgKGIuc2hpcHBpbmcgPyAn4LiE4LmI4Liy4Liq4LmI4LiHICcgKyBtb25leShiLnNoaXBwaW5nLCAyKSA6ICcnKSArCiAgICAgICAgICAgIChiLnNoaXBwaW5nICYmIGIuZGlzY291bnQgPyAnIMK3ICcgOiAnJykgKwogICAgICAg',
  'ICAgICAoYi5kaXNjb3VudCA/ICfguKrguYjguKfguJnguKXguJQg4oiSJyArIG1vbmV5KGIuZGlzY291bnQsIDIpIDogJycpICsgJzwvZGl2PicKICAgICAgICA6ICcnKSArCiAgICAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gdG9nZ2xlQmlsbChpZCl7CiAgdmFyIGVs',
  'ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpOwogIGlmICghZWwpIHJldHVybjsKICBlbC5oaWRkZW4gPSAhZWwuaGlkZGVuOwogIHZhciBidG4gPSBlbC5wcmV2aW91c0VsZW1lbnRTaWJsaW5nOwogIGlmIChidG4pIGJ0bi50ZXh0Q29udGVudCA9IGJ0bi50',
  'ZXh0Q29udGVudC5yZXBsYWNlKGVsLmhpZGRlbiA/ICfilrQnIDogJ+KWvicsIGVsLmhpZGRlbiA/ICfilr4nIDogJ+KWtCcpOwp9CgpmdW5jdGlvbiBzZXRQYXJhbShrZXksIHZhbCl7CiAgUy5wYXJhbXNba2V5XSA9IHZhbDsKICBsb2FkKCk7Cn0KCi8qID09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICA0KSDguKXguYnguLLguIfguYHguK3guKPguYwKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'ICovClJPVVRFUy5hYyA9IHsKICBsb2FkOiBmdW5jdGlvbigpeyByZXR1cm4gY2FsbEFwaSgnYWMubWF0cml4JywgeyB5ZWFyOiBTLnllYXIgfSk7IH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09ICdhbGwnID8g',
  'J+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICBrcGkoJ+C4peC5ieC4suC4h+C5geC4peC5ieC4pyAnICsgeWVhckxhYmVsLCBkLnJvb21zRG9uZUlu',
  'WWVhciArICcvJyArIGQucm9vbXMubGVuZ3RoICsgJyDguKvguYnguK3guIcnLCBkLmRvbmVJblllYXIgKyAnIOC4o+C4reC4muC4l+C4seC5ieC4h+C4q+C4oeC4lCcsICdhY2NlbnQnKSArCiAgICAgIGtwaSgn4Lii4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJ4Lil',
  '4LmJ4Liy4LiHJywgZC5yb29tc1BlbmRpbmcubGVuZ3RoICsgJyDguKvguYnguK3guIcnLCBkLnJvb21zUGVuZGluZy5zbGljZSgwLDgpLmpvaW4oJywgJykgKyAoZC5yb29tc1BlbmRpbmcubGVuZ3RoPjg/J+KApic6JycpLCBkLnJvb21zUGVuZGluZy5sZW5ndGgg',
  'PyAnd2Fybic6J2dvb2QnKSArCiAgICAgIGtwaSgn4LiW4Li24LiH4LiB4Liz4Lir4LiZ4LiU4Lil4LmJ4Liy4LiHJywgZC5vdmVyZHVlLmxlbmd0aCArICcg4Lir4LmJ4Lit4LiHJywgJ+C4o+C4reC4muC4peC5ieC4suC4h+C4l+C4uOC4gSAnICsgZC5jeWNsZU1v',
  'bnRocyArICcg4LmA4LiU4Li34Lit4LiZJywgZC5vdmVyZHVlLmxlbmd0aCA/ICdiYWQnOidnb29kJykgKwogICAgICBrcGkoJ+C4hOC4p+C4suC4oeC4hOC4t+C4muC4q+C4meC5ieC4sicsIHBjdChkLnJvb21zLmxlbmd0aCA/IGQucm9vbXNEb25lSW5ZZWFyL2Qu',
  'cm9vbXMubGVuZ3RoKjEwMCA6IDApLCAn4LiC4Lit4LiH4LiX4Lix4LmJ4LiH4Lir4Lih4LiUICcgKyBkLnJvb21zLmxlbmd0aCArICcg4Lir4LmJ4Lit4LiHJykgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIGFjdGlvbnMgPSAnPGRpdiBjbGFzcz0icm93IG1iMTIi',
  'PicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZm9ybUFjKG51bGwpIj4rIOC4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C4peC5ieC4suC4h+C5geC4reC4o+C5jDwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRu',
  'IiBvbmNsaWNrPSJmb3JtQnVsa0FjKCkiPvCfk4Ug4LiZ4Lix4LiU4Lil4LmJ4Liy4LiH4Lir4Lil4Liy4Lii4Lir4LmJ4Lit4LiH4Lie4Lij4LmJ4Lit4Lih4LiB4Lix4LiZPC9idXR0b24+JyArCiAgICAgICc8c3BhbiBjbGFzcz0ic3AiPjwvc3Bhbj4nICsKICAg',
  'ICAgJzxzcGFuIGNsYXNzPSJmczEyIG11dGVkIj7guITguKXguLTguIHguJfguLXguYjguKvguYnguK3guIfguYDguJ7guLfguYjguK3guJTguLkv4LmA4Lie4Li04LmI4Lih4Lij4Lit4Lia4LiB4Liy4Lij4Lil4LmJ4Liy4LiHPC9zcGFuPicgKwogICAgJzwvZGl2',
  'Pic7CgogICAgdmFyIGdyaWQgPSBjYXJkKCfinYTvuI8g4LiV4Liy4Lij4Liy4LiH4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4Lij4Liy4Lii4Lir4LmJ4Lit4LiHIMK3ICcgKyB5ZWFyTGFiZWwsIHJvb21GbG9vcnMoZC5yb29tcywgZnVuY3Rpb24ocil7CiAgICAg',
  'IHZhciBjbHMgPSByLnJvdW5kc0luWWVhciA+IDAgPyAncy1vaycgOiAoci5zdGF0ZSA9PT0gJ+C5gOC4geC4tOC4meC4geC4s+C4q+C4meC4lCcgPyAncy1kZ3InIDogKHIuc3RhdGUgPT09ICfguKLguLHguIfguYTguKHguYjguYDguITguKLguKXguYnguLLguIcn',
  'ID8gJ3Mtd2FybicgOiAncy1pbmZvJykpOwogICAgICB2YXIgc3ViID0gci5yb3VuZHNJblllYXIgPiAwCiAgICAgICAgPyAnPGI+JyArIHIucm91bmRzSW5ZZWFyICsgJyDguKPguK3guJo8L2I+PGJyPicgKyB0aERhdGVTaG9ydChyLnJlY29yZHMuZmlsdGVyKGZ1',
  'bmN0aW9uKHgpe3JldHVybiB4LnNlcnZpY2VEYXRlO30pLm1hcChmdW5jdGlvbih4KXtyZXR1cm4geC5zZXJ2aWNlRGF0ZTt9KS5zb3J0KCkucG9wKCkpCiAgICAgICAgOiAoci5ib29rZWRJblllYXIgPyAn4LiZ4Lix4LiU4LmB4Lil4LmJ4LinICcgKyByLmJvb2tl',
  'ZEluWWVhciA6IChyLmxhc3RTZXJ2aWNlID8gJ+C4peC5iOC4suC4quC4uOC4lCAnICsgdGhEYXRlU2hvcnQoci5sYXN0U2VydmljZSkgOiAn4LmE4Lih4LmI4Lih4Li14Lib4Lij4Liw4Lin4Lix4LiV4Li0JykpOwogICAgICByZXR1cm4geyBjbHM6IGNscywgc3Vi',
  'OiBzdWIsIG9uY2xpY2s6ICdvcGVuQWNSb29tKFwnJyArIHIucm9vbSArICdcJyknIH07CiAgICB9KSwgJycsIGZhbHNlKTsKCiAgICB2YXIgbGlzdFJvd3MgPSBbXTsKICAgIGQucm9vbXMuZm9yRWFjaChmdW5jdGlvbihyKXsgci5yZWNvcmRzLmZvckVhY2goZnVu',
  'Y3Rpb24oeCl7IHguX3Jvb20gPSByLnJvb207IGxpc3RSb3dzLnB1c2goeCk7IH0pOyB9KTsKICAgIGxpc3RSb3dzLnNvcnQoZnVuY3Rpb24oYSxiKXsgcmV0dXJuIFN0cmluZyhiLnNlcnZpY2VEYXRlfHxiLmJvb2tEYXRlfHwnJykubG9jYWxlQ29tcGFyZShTdHJp',
  'bmcoYS5zZXJ2aWNlRGF0ZXx8YS5ib29rRGF0ZXx8JycpKTsgfSk7CgogICAgdmFyIGxpc3QgPSBjYXJkKCfwn5OLIOC4m+C4o+C4sOC4p+C4seC4leC4tOC4geC4suC4o+C4peC5ieC4suC4h+C5geC4reC4o+C5jCDCtyAnICsgeWVhckxhYmVsICsgJyAoJyArIGxp',
  'c3RSb3dzLmxlbmd0aCArICcpJywKICAgICAgbGlzdFJvd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guKvguYnguK3guIc8L3RoPjx0aD7guKPguK3guJrguJfguLXguYg8L3Ro',
  'Pjx0aD7guKfguLHguJnguJfguLXguYjguJnguLHguJQ8L3RoPjx0aD7guKfguLHguJnguJfguLXguYjguJTguLPguYDguJnguLTguJnguIHguLLguKM8L3RoPjx0aD7guKrguJbguLLguJnguLA8L3RoPicgKwogICAgICAgICc8dGg+4LiK4LmI4Liy4LiHPC90aD48',
  'dGggY2xhc3M9Im51bSI+4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiPC90aD48dGg+4Lig4Liy4LiePC90aD48dGg+4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4PC90aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIGxpc3RSb3dz',
  'Lm1hcChmdW5jdGlvbih4KXsKICAgICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgICAnPHRkPjxiPicgKyBlc2MoeC5yb29tKSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHgucm91bmQgfHwgMSkgKyAnPC90',
  'ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyB0aERhdGUoeC5ib29rRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyB0aERhdGUoeC5zZXJ2aWNlRGF0ZSkgKyAnPC90ZD4n',
  'ICsKICAgICAgICAgICAgJzx0ZD4nICsgc3RhdHVzQmFkZ2UoeC5zdGF0dXMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MoeC50ZWNobmljaWFuIHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNs',
  'YXNzPSJudW0iPicgKyBudW0oeC5jb3N0KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHgucGhvdG9SZWZzKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIG11dGVkIGNsaXAiPicgKyBlc2MoeC5ub3Rl',
  'IHx8ICcnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPjxkaXYgY2xhc3M9InQtYWN0aW9ucyI+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIiBvbmNsaWNrPVwnZm9ybUFjKCcgKyBhdHRyKHgpICsgJylcJz7inI/vuI88',
  'L2J1dHRvbj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24gZGdyIiBvbmNsaWNrPSJkZWxBYyhcJycgKyB4LmlkICsgJ1wnKSI+8J+XkTwvYnV0dG9uPicgKwogICAgICAgICAgICAnPC9kaXY+PC90ZD48L3RyPic7CiAgICAgICAg',
  'fSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgOiBlbXB0eUJveCgn4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4LmD4LiZJyArIHllYXJMYWJl',
  'bCksICcnLCB0cnVlKTsKCiAgICByZXR1cm4gaGVhZCArIGFjdGlvbnMgKyBncmlkICsgJzxkaXYgY2xhc3M9Im10MTIiPicgKyBsaXN0ICsgJzwvZGl2Pic7CiAgfQp9OwoKZnVuY3Rpb24gb3BlbkFjUm9vbShyb29tKXsKICB2YXIgZCA9IFMuY2FjaGUuYWM7CiAg',
  'dmFyIHIgPSBkLnJvb21zLmZpbHRlcihmdW5jdGlvbih4KXsgcmV0dXJuIHgucm9vbSA9PT0gcm9vbTsgfSlbMF07CiAgdmFyIGJvZHkgPQogICAgJzxkaXYgY2xhc3M9ImdyaWQgZzMgbWIxMiI+JyArCiAgICAgIGtwaSgn4Lij4Lit4Lia4LiX4Li14LmI4Lil4LmJ',
  '4Liy4LiH4LmD4LiZ4Lib4Li14LiZ4Li14LmJJywgKHIucm91bmRzSW5ZZWFyfHwwKSArICcg4Lij4Lit4LiaJywgJycpICsKICAgICAga3BpKCfguKXguYnguLLguIfguKXguYjguLLguKrguLjguJQnLCByLmxhc3RTZXJ2aWNlID8gdGhEYXRlKHIubGFzdFNlcnZp',
  'Y2UpIDogJ+KAkycsIHIubGFzdFNlcnZpY2UgPyAoZGF5c0FnbyhyLmxhc3RTZXJ2aWNlKSArICcg4Lin4Lix4LiZ4LiX4Li14LmI4LmB4Lil4LmJ4LinJykgOiAnJykgKwogICAgICBrcGkoJ+C4hOC4o+C4muC4geC4s+C4q+C4meC4lOC4o+C4reC4muC4luC4seC4',
  'lOC5hOC4mycsIHIubmV4dER1ZSA/IHRoRGF0ZShyLm5leHREdWUpIDogJ+KAkycsIHIuc3RhdGUsIHIuc3RhdGUgPT09ICfguYDguIHguLTguJnguIHguLPguKvguJnguJQnID8gJ2JhZCcgOiAnJykgKwogICAgJzwvZGl2PicgKwogICAgKHIucmVjb3Jkcy5sZW5n',
  'dGgKICAgICAgPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDphdXRvIj48dGhlYWQ+PHRyPjx0aD7guKPguK3guJo8L3RoPjx0aD7guJnguLHguJQ8L3RoPjx0aD7guJTguLPguYDguJnguLTguJnguIHguLLguKM8L3Ro',
  'Pjx0aD7guKrguJbguLLguJnguLA8L3RoPjx0aD7guKDguLLguJ48L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgci5yZWNvcmRzLm1hcChmdW5jdGlvbih4KXsKICAgICAgICAgIHJldHVybiAnPHRyPjx0ZD4nICsgKHgucm91bmR8',
  'fDEpICsgJzwvdGQ+PHRkIGNsYXNzPSJmczEyIj4nICsgdGhEYXRlKHguYm9va0RhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyB0aERhdGUoeC5zZXJ2aWNlRGF0ZSkgKyAnPC90ZD48dGQ+JyArIHN0YXR1c0JhZGdlKHgu',
  'c3RhdHVzKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHgucGhvdG9SZWZzKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPjxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz1cJ2Nsb3NlTW9kYWwoKTtmb3JtQWMoJyAr',
  'IGF0dHIoeCkgKyAnKVwnPuC5geC4geC5ieC5hOC4gjwvYnV0dG9uPjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nCiAgICAgIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij7guKLguLHguIfguYTguKHguYjguKHg',
  'uLXguJrguLHguJnguJfguLbguIHguYPguJnguJvguLXguJfguLXguYjguYDguKXguLfguK3guIE8L2Rpdj4nKTsKCiAgb3Blbk1vZGFsKCfinYTvuI8g4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMIMK3IOC4q+C5ieC4reC4hyAnICsgcm9vbSwgYm9keSwKICAgICc8',
  'YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lib4Li04LiUPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iY2xvc2VNb2RhbCgpO2Zvcm1BYyh7cm9vbTpcJycgKyByb29tICsgJ1wnfSkiPisg',
  '4LmA4Lie4Li04LmI4Lih4Lij4Lit4Lia4LiB4Liy4Lij4Lil4LmJ4Liy4LiHPC9idXR0b24+Jyk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICA1KSDguIvguYjguK3guKHguYHguIvg',
  'uKHguJXguLLguKHguKvguYnguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5yZXBhaXJzID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7IHJldHVybiBjYWxsQXBpKCdyZXBh',
  'aXIubWF0cml4JywgeyB5ZWFyOiBTLnllYXIgfSk7IH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgaGVhZCA9',
  'ICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICBrcGkoJ+C4h+C4suC4meC4i+C5iOC4reC4oSAnICsgeWVhckxhYmVsLCBkLnRvdGFsSm9icyArICcg4LiH4Liy4LiZJywgJ+C4iOC4suC4gSAnICsgZC5yb29tcy5maWx0ZXIoZnVuY3Rpb24ocil7',
  'cmV0dXJuIHIuY291bnQ+MDt9KS5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsICdhY2NlbnQnKSArCiAgICAgIGtwaSgn4LiH4Liy4LiZ4LiX4Li14LmI4Lii4Lix4LiH4LmE4Lih4LmI4LmA4Liq4Lij4LmH4LiIJywgZC5vcGVuSm9icyArICcg4LiH4Liy4LiZJywg',
  'ZC5vcGVuVGFza3MgPyAn4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmIICcgKyBkLm9wZW5UYXNrcyArICcg4LiI4Li44LiUJyA6ICcnLCBkLm9wZW5Kb2JzID8gJ3dhcm4nIDogJ2dvb2QnKSArCiAgICAgIGtwaSgn4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii',
  '4Lij4Lin4LihJywgYmFodChkLnRvdGFsQ29zdCksIHllYXJMYWJlbCkgKwogICAgICBrcGkoJ+C4q+C5ieC4reC4h+C4l+C4teC5iOC4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4i+C5iOC4reC4oScsIGQucm9vbXMuZmlsdGVyKGZ1bmN0aW9uKHIpe3JldHVy',
  'biByLmNvdW50PT09MDt9KS5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsICfguYPguJknICsgeWVhckxhYmVsKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgYWN0aW9ucyA9ICc8ZGl2IGNsYXNzPSJyb3cgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJi',
  'dG4gcHJpIiBvbmNsaWNrPSJmb3JtUmVwYWlyKG51bGwpIj4rIOC5geC4iOC5ieC4h+C4i+C5iOC4reC4oSAvIOC4muC4seC4meC4l+C4tuC4geC4h+C4suC4meC4i+C5iOC4reC4oTwvYnV0dG9uPicgKwogICAgICAnPHNwYW4gY2xhc3M9InNwIj48L3NwYW4+PHNw',
  'YW4gY2xhc3M9ImZzMTIgbXV0ZWQiPuC4hOC4peC4tOC4geC4l+C4teC5iOC4q+C5ieC4reC4h+C5gOC4nuC4t+C5iOC4reC4lOC4ueC4m+C4o+C4sOC4p+C4seC4leC4tOC4h+C4suC4meC4i+C5iOC4reC4oeC4guC4reC4h+C4q+C5ieC4reC4h+C4meC4seC5ieC4',
  'mTwvc3Bhbj48L2Rpdj4nOwoKICAgIHZhciBncmlkID0gY2FyZCgn8J+UpyDguKDguLLguJ7guKPguKfguKHguIfguLLguJnguIvguYjguK3guKHguKPguLLguKLguKvguYnguK3guIcgwrcgJyArIHllYXJMYWJlbCwgcm9vbUZsb29ycyhkLnJvb21zLCBmdW5jdGlv',
  'bihyKXsKICAgICAgdmFyIGNscyA9IHIub3BlbkNvdW50ID4gMCA/ICdzLWRncicgOiAoci5jb3VudCA+IDAgPyAncy1vaycgOiAncy1pbmZvJyk7CiAgICAgIHZhciBzdWIgPSByLmNvdW50ID4gMAogICAgICAgID8gJzxiPicgKyByLmNvdW50ICsgJyDguIfguLLg',
  'uJk8L2I+JyArIChyLm9wZW5Db3VudCA/ICcgwrcg4LiE4LmJ4Liy4LiHICcgKyAoci5vcGVuVGFza3MgfHwgci5vcGVuQ291bnQpICsgJyDguIjguLjguJQnIDogJycpICsgJzxicj4nICsgKHIubGFzdCA/IHRoRGF0ZVNob3J0KHIubGFzdCkgOiAnJykKICAgICAg',
  'ICA6ICfguYTguKHguYjguKHguLXguIfguLLguJnguIvguYjguK3guKEnOwogICAgICByZXR1cm4geyBjbHM6IGNscywgc3ViOiBzdWIsIG9uY2xpY2s6ICdvcGVuUmVwYWlyUm9vbShcJycgKyByLnJvb20gKyAnXCcpJyB9OwogICAgfSkpOwoKICAgIHZhciByb3dz',
  'ID0gW107CiAgICBkLnJvb21zLmZvckVhY2goZnVuY3Rpb24ocil7IHIucmVjb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uKHgpeyByb3dzLnB1c2goeCk7IH0pOyB9KTsKICAgIHJvd3Muc29ydChmdW5jdGlvbihhLGIpeyByZXR1cm4gU3RyaW5nKGIucmVwYWlyRGF0ZXx8',
  'Yi5ib29rRGF0ZXx8JycpLmxvY2FsZUNvbXBhcmUoU3RyaW5nKGEucmVwYWlyRGF0ZXx8YS5ib29rRGF0ZXx8JycpKTsgfSk7CgogICAgdmFyIGxpc3QgPSBjYXJkKCfwn5OLIOC4o+C4suC4ouC4geC4suC4o+C4h+C4suC4meC4i+C5iOC4reC4oSDCtyAnICsgeWVh',
  'ckxhYmVsICsgJyAoJyArIHJvd3MubGVuZ3RoICsgJyknLAogICAgICByb3dzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOjEwMjBweCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC4q+C5ieC4',
  'reC4hzwvdGg+PHRoPuC4p+C4seC4meC4meC4seC4lOC4i+C5iOC4reC4oTwvdGg+PHRoPuC4p+C4seC4meC5gOC4guC5ieC4suC4i+C5iOC4reC4oTwvdGg+PHRoPuC4m+C4o+C4sOC5gOC4oOC4lzwvdGg+PHRoPuC4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4',
  'i+C5iOC4reC4oeC5geC4i+C4oTwvdGg+JyArCiAgICAgICAgJzx0aD7guKrguJbguLLguJnguLA8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguYjguLLguYPguIrguYnguIjguYjguLLguKI8L3RoPjx0aD7guIHguYjguK3guJk8L3RoPjx0aD7guKvguKXguLHguIc8',
  'L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgcm93cy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgICAgICByZXR1cm4gJzx0cj4nICsKICAgICAgICAgICAgJzx0ZD48Yj4nICsgZXNjKHgucm9vbSkgKyAnPC9iPjwvdGQ+JyArCiAgICAg',
  'ICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHguYm9va0RhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHgucmVwYWlyRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAg',
  'ICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyh4LmNhdGVnb3J5IHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIHN0eWxlPSJtaW4td2lkdGg6MjgwcHgiPicgKyB0b2RvTGlzdEh0bWwoeCkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0',
  'ZD4nICsgc3RhdHVzQmFkZ2UoeC5zdGF0dXMpICsgKHgucHJpb3JpdHkgJiYgeC5wcmlvcml0eSAhPT0gJ+C4m+C4geC4leC4tCcgPyAnICcgKyBzdGF0dXNCYWRnZSh4LnByaW9yaXR5KSA6ICcnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJu',
  'dW0iPicgKyBudW0oeC5jb3N0KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHguYmVmb3JlUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCh4LmFmdGVyUmVmcykgKyAnPC90ZD4nICsKICAg',
  'ICAgICAgICAgJzx0ZD48ZGl2IGNsYXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1SZXBhaXIoJyArIGF0dHIoeCkgKyAnKVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAgICAg',
  'ICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiBkZ3IiIG9uY2xpY2s9ImRlbFJlcGFpcihcJycgKyB4LmlkICsgJ1wnKSI+8J+XkTwvYnV0dG9uPicgKwogICAgICAgICAgICAnPC9kaXY+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAn',
  'PC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgOiBlbXB0eUJveCgn4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LmD4LiZJyArIHllYXJMYWJlbCwgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZvcm1SZXBh',
  'aXIobnVsbCkiPisg4LmB4LiI4LmJ4LiH4LiL4LmI4Lit4LihPC9idXR0b24+JyksICcnLCB0cnVlKTsKCiAgICByZXR1cm4gaGVhZCArIGFjdGlvbnMgKyBncmlkICsgJzxkaXYgY2xhc3M9Im10MTIiPicgKyBsaXN0ICsgJzwvZGl2Pic7CiAgfQp9OwoKLyoqCiAq',
  'IOC5gOC4iuC5h+C4hOC4peC4tOC4quC4leC5jOC4l+C4teC5iOC4leC4tOC5iuC4geC5hOC4lOC5ieC4iOC4o+C4tOC4h+C4iOC4suC4geC4q+C4meC5ieC4suC4o+C4suC4ouC4geC4suC4oyDguYTguKHguYjguJXguYnguK3guIfguYDguJvguLTguJTguJ/guK3g',
  'uKPguYzguKEKICog4LiV4Li04LmK4LiB4Lib4Li44LmK4Lia4Lia4Lix4LiZ4LiX4Li24LiB4LiC4Li24LmJ4LiZ4LiK4Li14LiV4LiX4Lix4LiZ4LiX4Li1IOC5geC4peC4sOC4luC5ieC4suC4leC4tOC5iuC4geC4hOC4o+C4muC4l+C4uOC4geC4guC5ieC4rSDg',
  'uKrguJbguLLguJnguLDguIjguLDguYDguJvguKXguLXguYjguKLguJnguYDguJvguYfguJkgIuC5gOC4quC4o+C5h+C4iOC4quC4tOC5ieC4mSIg4LmD4Lir4LmJ4LmA4Lit4LiHCiAqLwpmdW5jdGlvbiB0b2RvTGlzdEh0bWwoeCl7CiAgdmFyIHRvZG8gPSB4LnRv',
  'ZG8gfHwgW107CiAgaWYgKCF0b2RvLmxlbmd0aCkgcmV0dXJuICc8c3BhbiBjbGFzcz0iZnMxMyBtdXRlZCI+JyArIGVzYyh4Lml0ZW1zIHx8ICfigJMnKSArICc8L3NwYW4+JzsKCiAgdmFyIHAgPSB4LnByb2dyZXNzIHx8IHsgZG9uZTogMCwgdG90YWw6IHRvZG8u',
  'bGVuZ3RoLCBwZXJjZW50OiAwIH07CiAgdmFyIGxvY2tlZCA9ICFjYW5FZGl0KCk7CgogIHJldHVybiAnPGRpdiBjbGFzcz0idG9kby12aWV3Ij4nICsKICAgICc8ZGl2IGNsYXNzPSJ0b2RvLWJhciI+PGkgc3R5bGU9IndpZHRoOicgKyBwLnBlcmNlbnQgKyAnJSI+',
  'PC9pPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InRvZG8tbWV0YSI+4LmA4Liq4Lij4LmH4LiI4LmB4Lil4LmJ4LinIDxiPicgKyBwLmRvbmUgKyAnLycgKyBwLnRvdGFsICsgJzwvYj4g4LiH4Liy4LiZPC9kaXY+JyArCiAgICB0b2RvLm1hcChmdW5jdGlvbih0',
  'LCBpKXsKICAgICAgcmV0dXJuICc8bGFiZWwgY2xhc3M9InRvZG8tbGluZScgKyAodC5kb25lID8gJyBkb25lJyA6ICcnKSArIChsb2NrZWQgPyAnIGxvY2tlZCcgOiAnJykgKyAnIj4nICsKICAgICAgICAnPGlucHV0IHR5cGU9ImNoZWNrYm94IicgKyAodC5kb25l',
  'ID8gJyBjaGVja2VkJyA6ICcnKSArIChsb2NrZWQgPyAnIGRpc2FibGVkJyA6ICcnKSArCiAgICAgICAgICAnIG9uY2hhbmdlPSJ0b2dnbGVUb2RvKFwnJyArIGVzYyh4LmlkKSArICdcJywnICsgaSArICcsdGhpcy5jaGVja2VkLHRoaXMpIj4nICsKICAgICAgICAn',
  'PHNwYW4gY2xhc3M9Im5tIj4nICsgZXNjKHQubmFtZSkgKyAnPC9zcGFuPicgKwogICAgICAgICh0LmNhdGVnb3J5ID8gJzxzcGFuIGNsYXNzPSJiIG11dGUgY2F0Ij4nICsgZXNjKHQuY2F0ZWdvcnkpICsgJzwvc3Bhbj4nIDogJycpICsKICAgICAgJzwvbGFiZWw+',
  'JzsKICAgIH0pLmpvaW4oJycpICsKICAnPC9kaXY+JzsKfQoKLyoqCiAqIOC4leC4tOC5iuC4geC4h+C4suC4meC4q+C4meC4tuC5iOC4h+C4guC5ieC4rSDigJQg4Lit4Lix4Lib4LmA4LiU4LiV4Lir4LiZ4LmJ4Liy4LiI4Lit4LiX4Lix4LiZ4LiX4Li14LmB4Lil',
  '4LmJ4Lin4LiE4LmI4Lit4Lii4Lia4Lix4LiZ4LiX4Li24LiBCiAqIOC4luC5ieC4suC4muC4seC4meC4l+C4tuC4geC5hOC4oeC5iOC4nOC5iOC4suC4mSDguYPguKvguYnguJXguLTguYrguIHguIHguKXguLHguJrguYTguJvguYDguJvguYfguJnguYDguKvguKHg',
  'uLfguK3guJnguYDguJTguLTguKEg4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4LmA4LiC4LmJ4Liy4LmD4LiI4Lic4Li04LiU4Lin4LmI4Liy4Lia4Lix4LiZ4LiX4Li24LiB4LmB4Lil4LmJ4LinCiAqLwpmdW5jdGlvbiB0b2dnbGVUb2RvKGlkLCBpbmRleCwgZG9u',
  'ZSwgYm94KXsKICB2YXIgbGluZSA9IGJveC5jbG9zZXN0KCcudG9kby1saW5lJyk7CiAgaWYgKGxpbmUpIGxpbmUuY2xhc3NMaXN0LnRvZ2dsZSgnZG9uZScsIGRvbmUpOwogIGJveC5kaXNhYmxlZCA9IHRydWU7CgogIGNhbGxBcGkoJ3JlcGFpci50b2dnbGUnLCB7',
  'IGlkOiBpZCwgaW5kZXg6IGluZGV4LCBkb25lOiBkb25lIH0pLnRoZW4oZnVuY3Rpb24oKXsKICAgIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgICAgICAgIC8vIOC4hOC4p+C4suC4oeC4hOC4t+C4muC4q+C4meC5ieC4suC4geC4seC4muC4quC4luC4suC4meC4sOC4',
  'reC4suC4iOC5gOC4m+C4peC4teC5iOC4ouC4mSDguIvguLTguIfguIHguYzguYDguIfguLXguKLguJog4LmGCiAgICByZWZyZXNoQWxlcnRzKCk7ICAgICAgICAgICAgICAvLyDguIfguLLguJnguITguYnguLLguIfguK3guLLguIjguKXguJTguKXguIcg4LiV4Lix',
  '4Lin4LmA4Lil4LiC4Lia4LiZ4LmA4Lih4LiZ4Li54LiV4LmJ4Lit4LiH4LiV4Liy4Lih4LiU4LmJ4Lin4LiiCiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICBib3guY2hlY2tlZCA9ICFkb25lOwogICAgaWYgKGxpbmUpIGxpbmUuY2xhc3NMaXN0LnRvZ2dsZSgn',
  'ZG9uZScsICFkb25lKTsKICAgIGJveC5kaXNhYmxlZCA9IGZhbHNlOwogICAgdG9hc3QoZS5tZXNzYWdlIHx8IGUsICdlcnInKTsKICB9KTsKfQoKZnVuY3Rpb24gb3BlblJlcGFpclJvb20ocm9vbSl7CiAgdmFyIGQgPSBTLmNhY2hlLnJlcGFpcnM7CiAgdmFyIHIg',
  'PSBkLnJvb21zLmZpbHRlcihmdW5jdGlvbih4KXsgcmV0dXJuIHgucm9vbSA9PT0gcm9vbTsgfSlbMF07CiAgdmFyIGJvZHkgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnMyBtYjEyIj4nICsKICAgICAga3BpKCfguIfguLLguJnguJfguLHguYnguIfguKvguKHguJQnLCBy',
  'LmNvdW50ICsgJyDguIfguLLguJknLCAnJykgKwogICAgICBrcGkoJ+C4ouC4seC4h+C5hOC4oeC5iOC5gOC4quC4o+C5h+C4iCcsIHIub3BlbkNvdW50ICsgJyDguIfguLLguJknLCByLm9wZW5UYXNrcyA/ICfguITguYnguLLguIfguK3guKLguLnguYggJyArIHIu',
  'b3BlblRhc2tzICsgJyDguIjguLjguJQnIDogJycsIHIub3BlbkNvdW50ID8gJ3dhcm4nOidnb29kJykgKwogICAgICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oicsIGJhaHQoci5jb3N0KSwgJycpICsKICAgICc8L2Rpdj4nICsKICAgIChyLnJl',
  'Y29yZHMubGVuZ3RoID8gJzxkaXYgY2xhc3M9InRsIj4nICsgci5yZWNvcmRzLm1hcChmdW5jdGlvbih4KXsKICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJ0bC1pIj48ZGl2IGNsYXNzPSJkIj4nICsgdGhEYXRlKHgucmVwYWlyRGF0ZSB8fCB4LmJvb2tEYXRlKSAr',
  'ICcgwrcgJyArIGVzYyh4LmNhdGVnb3J5fHwnJykgKyAnICcgKyBzdGF0dXNCYWRnZSh4LnN0YXR1cykgKyAnPC9kaXY+JyArCiAgICAgICAgJzxkaXYgY2xhc3M9InQiPicgKyB0b2RvTGlzdEh0bWwoeCkgKyAnPC9kaXY+JyArCiAgICAgICAgKHgudGVjaG5pY2lh',
  'biA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIj7guIrguYjguLLguIc6ICcgKyBlc2MoeC50ZWNobmljaWFuKSArICc8L2Rpdj4nIDogJycpICsKICAgICAgICAoeC5jb3N0ID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQiPuC4hOC5iOC4suC5g+C4iuC5ieC4iOC5',
  'iOC4suC4oiAnICsgYmFodCh4LmNvc3QpICsgJzwvZGl2PicgOiAnJykgKwogICAgICAgICc8ZGl2IGNsYXNzPSJtdDgiPicgKyB0aHVtYnNIdG1sKCh4LmJlZm9yZVJlZnN8fFtdKS5jb25jYXQoeC5hZnRlclJlZnN8fFtdKSkgKyAnPC9kaXY+JyArCiAgICAgICAg',
  'JzxkaXYgY2xhc3M9Im10OCI+PGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPVwnY2xvc2VNb2RhbCgpO2Zvcm1SZXBhaXIoJyArIGF0dHIoeCkgKyAnKVwnPuC5geC4geC5ieC5hOC4gjwvYnV0dG9uPjwvZGl2PicgKwogICAgICAnPC9kaXY+JzsKICAgIH0p',
  'LmpvaW4oJycpICsgJzwvZGl2PicgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4i+C5iOC4reC4oeC5g+C4meC4m+C4teC4l+C4teC5iOC5gOC4peC4t+C4reC4gTwvZGl2PicpOwoKICBvcGVuTW9kYWwoJ/Cf',
  'lKcg4LiH4Liy4LiZ4LiL4LmI4Lit4LihIMK3IOC4q+C5ieC4reC4hyAnICsgcm9vbSwgYm9keSwKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lib4Li04LiUPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRu',
  'IHByaSIgb25jbGljaz0iY2xvc2VNb2RhbCgpO2Zvcm1SZXBhaXIoe3Jvb206XCcnICsgcm9vbSArICdcJ30pIj4rIOC5gOC4nuC4tOC5iOC4oeC4h+C4suC4meC4i+C5iOC4reC4oTwvYnV0dG9uPicsIHRydWUpOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgNikg4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmC4LiU4Lii4Lij4Lin4LihCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PSAqLwpST1VURVMuYnVpbGRpbmcgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsKICAgIHJldHVybiBQcm9taXNlLmFsbChbCiAgICAgIGNhbGxBcGkoJ2J1aWxkaW5nLnN1bW1hcnknLCB7IHllYXI6IFMueWVhciB9KSwKICAgICAgY2FsbEFwaSgnYnVpbGRp',
  'bmcubGlzdCcsIHsgeWVhcjogUy55ZWFyLCB6b25lOiBTLnBhcmFtcy56b25lIHx8ICcnLCBzdGF0dXM6ICcnIH0pCiAgICBdKS50aGVuKGZ1bmN0aW9uKHIpeyB2YXIgZCA9IHJbMF07IGQuaXRlbXMgPSByWzFdOyByZXR1cm4gZDsgfSk7CiAgfSwKICByZW5kZXI6',
  'IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKICAgIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgIGtwaSgn',
  '4LiH4Liy4LiZ4Lib4Li1ICcgKyAoUy55ZWFyPT09J2FsbCc/J+C4l+C4seC5ieC4h+C4q+C4oeC4lCc6Uy55ZWFyKSwgZC55ZWFyQ291bnQgKyAnIOC4h+C4suC4mScsICfguKrguLDguKrguKEgJyArIGQudG90YWwgKyAnIOC4h+C4suC4mScsICdhY2NlbnQnKSAr',
  'CiAgICAgIGtwaSgn4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiICcgKyB5ZWFyTGFiZWwsIGJhaHQoZC55ZWFyQ29zdCksICfguKrguLDguKrguKEgJyArIGJhaHQoZC5ncmFuZENvc3QpKSArCiAgICAgIGtwaSgn4LiH4Liy4LiZ4LiX4Li14LmI4Lii4Lix',
  '4LiH4LmE4Lih4LmI4LmA4Liq4Lij4LmH4LiIJywgZC5vcGVuQ291bnQgKyAnIOC4h+C4suC4mScsICcnLCBkLm9wZW5Db3VudCA/ICd3YXJuJyA6ICdnb29kJykgKwogICAgICBrcGkoJ+C4hOC4o+C4muC4geC4s+C4q+C4meC4lOC5g+C4mSA5MCDguKfguLHguJkn',
  'LCBkLnVwY29taW5nLmxlbmd0aCArICcg4LiH4Liy4LiZJywgZC51cGNvbWluZy5sZW5ndGggPyBkLnVwY29taW5nWzBdLnRpdGxlIDogJycsIGQudXBjb21pbmcubGVuZ3RoID8gJ3dhcm4nIDogJycpICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciB6b25lcyA9ICc8',
  'ZGl2IGNsYXNzPSJjaGlwcyBtYjEyIj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImNoaXAgJyArICghUy5wYXJhbXMuem9uZT8nb24nOicnKSArICciIG9uY2xpY2s9InNldFBhcmFtKFwnem9uZVwnLFwnXCcpIj7guJfguLjguIHguKrguYjguKfguJk8L2J1dHRv',
  'bj4nICsKICAgICAgZC5ieVpvbmUubWFwKGZ1bmN0aW9uKHopewogICAgICAgIHJldHVybiAnPGJ1dHRvbiBjbGFzcz0iY2hpcCAnICsgKFMucGFyYW1zLnpvbmU9PT16LnpvbmU/J29uJzonJykgKyAnIiBvbmNsaWNrPSJzZXRQYXJhbShcJ3pvbmVcJyxcJycgKyBl',
  'c2Moei56b25lKSArICdcJykiPicgKwogICAgICAgICAgICAgICBlc2Moei56b25lKSArICcgKCcgKyB6LmNvdW50ICsgJyk8L2J1dHRvbj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwoKICAgIHZhciBjaGFydHMgPSAnPGRpdiBjbGFzcz0iZ3JpZCBn',
  'MiBtYjEyIj4nICsKICAgICAgY2FyZCgn8J+Pl++4jyDguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguYHguKLguIHguJXguLLguKHguKrguYjguKfguJnguILguK3guIfguK3guLLguITguLLguKMnLCBiYXJDaGFydChkLmJ5Wm9uZSwgJ3pvbmUnLCAnY29z',
  'dCcsIGZ1bmN0aW9uKGkpeyByZXR1cm4gbW9uZXkoaS5jb3N0KSArICcg4Li/JzsgfSkpICsKICAgICAgY2FyZCgn8J+ThSDguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguYHguKLguIHguJXguLLguKHguJvguLUnLCBiYXJDaGFydCgKICAgICAgICBkLmJ5',
  'WWVhci5tYXAoZnVuY3Rpb24oeSl7IHJldHVybiB7IGxhYmVsOifguJvguLUgJyArIHkueWVhciArICcgKCcgKyB5LmNvdW50ICsgJyDguIfguLLguJkpJywgY29zdDp5LmNvc3QgfTsgfSksCiAgICAgICAgJ2xhYmVsJywgJ2Nvc3QnLCBmdW5jdGlvbihpKXsgcmV0',
  'dXJuIG1vbmV5KGkuY29zdCkgKyAnIOC4vyc7IH0pKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgcm93cyA9IGQuaXRlbXM7CiAgICB2YXIgbGlzdCA9IGNhcmQoJ/Cfj6Ig4Lij4Liy4Lii4LiB4Liy4Lij4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmC',
  '4LiU4Lii4Lij4Lin4LihIMK3ICcgKyB5ZWFyTGFiZWwgKyAnICgnICsgcm93cy5sZW5ndGggKyAnKScsCiAgICAgIHJvd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiIHN0eWxlPSJtaW4td2lkdGg6MTAyMHB4Ij48dGhlYWQ+PHRy',
  'PicgKwogICAgICAgICc8dGg+4Liq4LmI4Lin4LiZ4LiC4Lit4LiH4Lit4Liy4LiE4Liy4LijPC90aD48dGg+4Lij4Liy4Lii4LiB4Liy4LijPC90aD48dGg+4LiZ4Lix4LiUPC90aD48dGg+4LmA4Lij4Li04LmI4LihPC90aD48dGg+4LmA4Liq4Lij4LmH4LiIPC90',
  'aD48dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD4nICsKICAgICAgICAnPHRoPuC4nOC4ueC5ieC4o+C4seC4muC5gOC4q+C4oeC4sjwvdGg+PHRoIGNsYXNzPSJudW0iPuC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ojwvdGg+PHRoPuC4o+C4reC4muC4luC4seC4',
  'lOC5hOC4mzwvdGg+PHRoPuC4oOC4suC4njwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICByb3dzLm1hcChmdW5jdGlvbih4KXsKICAgICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj48',
  'Yj4nICsgZXNjKHguem9uZSB8fCAn4oCTJykgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTMiPjxkaXYgY2xhc3M9ImNsaXAiPicgKyBlc2MoeC50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICAgKHgubm90ZSA/ICc8ZGl2',
  'IGNsYXNzPSJmczEyIGZhaW50IGNsaXAiPicgKyBlc2MoeC5ub3RlKSArICc8L2Rpdj4nIDogJycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHguYm9va0RhdGUpICsgJzwvdGQ+JyArCiAgICAgICAg',
  'ICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHguc3RhcnREYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LmVuZERhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8',
  'dGQ+JyArIHN0YXR1c0JhZGdlKHguc3RhdHVzKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKHguY29udHJhY3RvciB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbnVt',
  'KHguY29zdCkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyAoeC5uZXh0RHVlID8gdGhEYXRlU2hvcnQoeC5uZXh0RHVlKSArCiAgICAgICAgICAgICAgICAoeC5kdWVJbkRheXMgIT0gbnVsbCA/ICc8ZGl2IGNsYXNz',
  'PSJmYWludCIgc3R5bGU9ImZvbnQtc2l6ZToxMXB4Ij4nICsgKHguZHVlSW5EYXlzPDAgPyAn4LmA4Lil4LiiICcgKyAoLXguZHVlSW5EYXlzKSArICcg4Lin4Lix4LiZJyA6ICfguK3guLXguIEgJyArIHguZHVlSW5EYXlzICsgJyDguKfguLHguJknKSArICc8L2Rp',
  'dj4nIDogJycpCiAgICAgICAgICAgICAgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCgoeC5waG90b1JlZnN8fFtdKS5jb25jYXQoeC5zbGlwUmVmc3x8W10pKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPjxk',
  'aXYgY2xhc3M9InQtYWN0aW9ucyI+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIiBvbmNsaWNrPVwnZm9ybUJ1aWxkaW5nKCcgKyBhdHRyKHgpICsgJylcJz7inI/vuI88L2J1dHRvbj4nICsKICAgICAgICAgICAgICAnPGJ1dHRv',
  'biBjbGFzcz0iYnRuIHNtIGljb24gZGdyIiBvbmNsaWNrPSJkZWxCdWlsZGluZyhcJycgKyB4LmlkICsgJ1wnKSI+8J+XkTwvYnV0dG9uPicgKwogICAgICAgICAgICAnPC9kaXY+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3Rh',
  'YmxlPjwvZGl2PicKICAgICAgOiBlbXB0eUJveCgn4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmD4LiZJyArIHllYXJMYWJlbCwgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZv',
  'cm1CdWlsZGluZyhudWxsKSI+KyDguYDguJ7guLTguYjguKHguIfguLLguJnguIvguYjguK3guKHguJXguLbguIE8L2J1dHRvbj4nKSwKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgc20iIG9uY2xpY2s9ImZvcm1CdWlsZGluZyhudWxsKSI+KyDguYDguJ7g',
  'uLTguYjguKHguIfguLLguJnguIvguYjguK3guKHguJXguLbguIE8L2J1dHRvbj4nLCB0cnVlKTsKCiAgICByZXR1cm4gaGVhZCArIHpvbmVzICsgY2hhcnRzICsgbGlzdDsKICB9Cn07CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT0KICAgNykg4Lir4LmJ4Lit4LiH4Lie4Lix4LiBCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMucm9vbXMgPSB7CiAgbG9hZDogZnVuY3Rpb24o',
  'KXsgcmV0dXJuIGNhbGxBcGkoJ3Jvb20ubGlzdCcpLnRoZW4oZnVuY3Rpb24oZmxvb3JzKXsgcmV0dXJuIHsgZmxvb3JzOiBmbG9vcnMsIHllYXJzOiBbXSB9OyB9KTsgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIGZsYXQgPSBbXTsKICAgIGQuZmxv',
  'b3JzLmZvckVhY2goZnVuY3Rpb24oZil7IGYucm9vbXMuZm9yRWFjaChmdW5jdGlvbihyKXsgZmxhdC5wdXNoKHIpOyB9KTsgfSk7CiAgICB2YXIgb2NjID0gZmxhdC5maWx0ZXIoZnVuY3Rpb24ocil7IHJldHVybiByLnN0YXR1cyA9PT0gJ+C4oeC4teC4nOC4ueC5',
  'ieC5gOC4iuC5iOC4sic7IH0pLmxlbmd0aDsKCiAgICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICBrcGkoJ+C4q+C5ieC4reC4h+C4l+C4seC5ieC4h+C4q+C4oeC4lCcsIGZsYXQubGVuZ3RoICsgJyDguKvguYnguK3guIcn',
  'LCAnNSDguIrguLHguYnguJknLCAnYWNjZW50JykgKwogICAgICBrcGkoJ+C4oeC4teC4nOC4ueC5ieC5gOC4iuC5iOC4sicsIG9jYyArICcg4Lir4LmJ4Lit4LiHJywgcGN0KGZsYXQubGVuZ3RoID8gb2NjL2ZsYXQubGVuZ3RoKjEwMCA6IDApICsgJyDguK3guLHg',
  'uJXguKPguLLguYDguILguYnguLLguJ7guLHguIEnLCAnZ29vZCcpICsKICAgICAga3BpKCfguKvguYnguK3guIfguKfguYjguLLguIcnLCBmbGF0LmZpbHRlcihmdW5jdGlvbihyKXsgcmV0dXJuIHIuc3RhdHVzID09PSAn4Lin4LmI4Liy4LiHJzsgfSkubGVuZ3Ro',
  'ICsgJyDguKvguYnguK3guIcnLCAnJywgJ3dhcm4nKSArCiAgICAgIGtwaSgn4LiE4LmI4Liy4LmA4LiK4LmI4Liy4Lij4Lin4LihL+C5gOC4lOC4t+C4reC4mScsIGJhaHQoZmxhdC5yZWR1Y2UoZnVuY3Rpb24oYSxyKXsgcmV0dXJuIGEgKyAoTnVtYmVyKHIucmVu',
  'dCl8fDApOyB9LCAwKSksICfguIjguLLguIHguKvguYnguK3guIfguJfguLXguYjguIHguKPguK3guIHguITguYjguLLguYDguIrguYjguLLguYTguKfguYknKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgZ3JpZCA9IGNhcmQoJ/Cfmqog4Lic4Lix4LiH4Lir4LmJ',
  '4Lit4LiH4Lie4Lix4LiBJywgcm9vbUZsb29ycyhmbGF0LCBmdW5jdGlvbihyKXsKICAgICAgdmFyIGNscyA9IHIuc3RhdHVzID09PSAn4Lih4Li14Lic4Li54LmJ4LmA4LiK4LmI4LiyJyA/ICdzLW9rJyA6IChyLnN0YXR1cyA9PT0gJ+C4p+C5iOC4suC4hycgPyAn',
  'cy1pbmZvJyA6ICdzLXdhcm4nKTsKICAgICAgcmV0dXJuIHsgY2xzOiBjbHMsIHN1YjogZXNjKHIudGVuYW50IHx8IHIuc3RhdHVzIHx8ICcnKSArIChyLnJlbnQgPyAnPGJyPicgKyBtb25leShyLnJlbnQpICsgJyDguL8nIDogJycpLAogICAgICAgICAgICAgICBv',
  'bmNsaWNrOiAnb3BlblJvb20oXCcnICsgci5yb29tICsgJ1wnKScgfTsKICAgIH0pLCAnPHNwYW4gY2xhc3M9ImZzMTIgbXV0ZWQiPuC4hOC4peC4tOC4geC4l+C4teC5iOC4q+C5ieC4reC4h+C5gOC4nuC4t+C5iOC4reC4lOC4ueC4m+C4o+C4sOC4p+C4seC4leC4',
  'tOC4l+C4seC5ieC4h+C4q+C4oeC4lOC4guC4reC4h+C4q+C5ieC4reC4h+C4meC4seC5ieC4mTwvc3Bhbj4nKTsKCiAgICByZXR1cm4gaGVhZCArIGdyaWQ7CiAgfQp9OwoKZnVuY3Rpb24gb3BlblJvb20ocm9vbSl7CiAgb3Blbk1vZGFsKCfwn5qqIOC4q+C5ieC4',
  'reC4hyAnICsgcm9vbSwgJzxkaXYgY2xhc3M9ImVtcHR5Ij48c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDguIHguLPguKXguLHguIfguYLguKvguKXguJTigKY8L2Rpdj4nKTsKICBjYWxsQXBpKCdyb29tLnByb2ZpbGUnLCB7IHJvb206IHJvb20gfSkudGhlbihm',
  'dW5jdGlvbihwKXsKICAgIHZhciBpID0gcC5pbmZvOwogICAgdmFyIGJvZHkgPQogICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAgICBrcGkoJ+C4quC4luC4suC4meC4sCcsIGkuc3RhdHVzIHx8ICfigJMnLCBlc2MoaS50ZW5hbnQgfHwg',
  'JycpKSArCiAgICAgICAga3BpKCfguKXguYnguLLguIfguYHguK3guKPguYwnLCBwLmFjQ291bnQgKyAnIOC4hOC4o+C4seC5ieC4hycsIHAubGFzdEFjID8gJ+C4peC5iOC4suC4quC4uOC4lCAnICsgdGhEYXRlKHAubGFzdEFjKSA6ICfguYTguKHguYjguKHguLXg',
  'uJvguKPguLDguKfguLHguJXguLQnKSArCiAgICAgICAga3BpKCfguIfguLLguJnguIvguYjguK3guKEnLCBwLnJlcGFpckNvdW50ICsgJyDguIfguLLguJknLCAn4LiE4LmJ4Liy4LiHICcgKyBwLm9wZW5SZXBhaXJzLCBwLm9wZW5SZXBhaXJzID8gJ3dhcm4nIDog',
  'JycpICsKICAgICAgICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC4quC4sOC4quC4oScsIGJhaHQocC50b3RhbENvc3QpLCAn4LiL4LmI4Lit4LihICsg4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJykgKwogICAgICAnPC9kaXY+JyArCiAgICAg',
  'ICc8ZGl2IGNsYXNzPSJyb3cgbWIxMiI+JyArCiAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz1cJ2Nsb3NlTW9kYWwoKTtmb3JtUm9vbSgnICsgYXR0cihpKSArICcpXCc+4pyP77iPIOC5geC4geC5ieC5hOC4guC4guC5ieC4reC4oeC4ueC4',
  'peC4q+C5ieC4reC4hzwvYnV0dG9uPicgKwogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtmb3JtUmVwYWlyKHtyb29tOlwnJyArIHJvb20gKyAnXCd9KSI+KyDguYHguIjguYnguIfguIvguYjguK3guKE8L2J1dHRv',
  'bj4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCk7Zm9ybUFjKHtyb29tOlwnJyArIHJvb20gKyAnXCd9KSI+KyDguKXguYnguLLguIfguYHguK3guKPguYw8L2J1dHRvbj4nICsKICAgICAgJzwvZGl2PicgKwog',
  'ICAgICAnPGRpdiBjbGFzcz0iY2FyZCBtYjEyIj48ZGl2IGNsYXNzPSJjYXJkLWgiPjxoMz7guJfguKPguLHguJ7guKLguYzguKrguLTguJnguYPguJnguKvguYnguK3guIc8L2gzPicgKwogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9XCdj',
  'bG9zZU1vZGFsKCk7Zm9ybUFzc2V0KHtyb29tOiInICsgZXNjKHJvb20pICsgJyJ9KVwnPisg4LmA4Lie4Li04LmI4Lih4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZPC9idXR0b24+JyArCiAgICAgICc8L2Rpdj48ZGl2IGNsYXNzPSJjYXJkLWIiPicgKwogICAg',
  'ICAgIChwLmFzc2V0cy5sZW5ndGgKICAgICAgICAgID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiIHN0eWxlPSJtaW4td2lkdGg6YXV0byI+PHRoZWFkPjx0cj4nICsKICAgICAgICAgICAgJzx0aD7guJfguKPguLHguJ7guKLguYzguKrguLTguJk8',
  'L3RoPjx0aD7guKLguLXguYjguKvguYnguK0v4Lij4Li44LmI4LiZPC90aD48dGg+4LiV4Li04LiU4LiV4Lix4LmJ4LiHPC90aD48dGg+4Lib4Lij4Liw4LiB4Lix4LiZ4LiW4Li24LiHPC90aD48dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD48dGg+PC90aD48L3RyPjwv',
  'dGhlYWQ+PHRib2R5PicgKwogICAgICAgICAgICBwLmFzc2V0cy5tYXAoZnVuY3Rpb24oYSl7CiAgICAgICAgICAgICAgcmV0dXJuICc8dHI+PHRkPjxiPicgKyBlc2MoYS5uYW1lKSArICc8L2I+JyArCiAgICAgICAgICAgICAgICAgICAgICAgKGEuc2VyaWFsID8g',
  'Jzxicj48c3BhbiBjbGFzcz0iZnMxMiBtdXRlZCI+Uy9OICcgKyBlc2MoYS5zZXJpYWwpICsgJzwvc3Bhbj4nIDogJycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MoYS5icmFuZHx8J+KAkycpICsgJzwv',
  'dGQ+JyArCiAgICAgICAgICAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyB0aERhdGUoYS5pbnN0YWxsRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIChhLndhcnJhbnR5RW5kID8gdGhEYXRl',
  'KGEud2FycmFudHlFbmQpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICAgICAgICAgICc8dGQ+JyArIHN0YXR1c0JhZGdlKGEuc3RhdHVzKSArICc8L3RkPicgKwogICAgICAgICAgICAgICAgICAgICAnPHRkIGNsYXNzPSJ0LWFjdGlvbnMiPjxidXR0',
  'b24gY2xhc3M9ImJ0biBpY29uIHNtIiB0aXRsZT0i4LmB4LiB4LmJ4LmE4LiCIiAnICsKICAgICAgICAgICAgICAgICAgICAgICAnb25jbGljaz1cJ2Nsb3NlTW9kYWwoKTtmb3JtQXNzZXQoJyArIGF0dHIoYSkgKyAnKVwnPuKcj++4jzwvYnV0dG9uPjwvdGQ+PC90',
  'cj4nOwogICAgICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICAgICAgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5iOC5hOC4lOC5ieC4muC4seC4meC4l+C4tuC4geC4l+C4o+C4seC4nuC4ouC5',
  'jOC4quC4tOC4meC4guC4reC4h+C4q+C5ieC4reC4h+C4meC4teC5iTwvZGl2PicpICsKICAgICAgJzwvZGl2PjwvZGl2PicgKwogICAgICAnPGgzIGNsYXNzPSJmczEzIG1iOCI+4Lib4Lij4Liw4Lin4Lix4LiV4Li04LiX4Lix4LmJ4LiH4Lir4Lih4LiUICgnICsg',
  'cC50aW1lbGluZS5sZW5ndGggKyAnKTwvaDM+JyArCiAgICAgIChwLnRpbWVsaW5lLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0bCI+JyArIHAudGltZWxpbmUubWFwKGZ1bmN0aW9uKGUpewogICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0idGwtaSI+PGRpdiBjbGFz',
  'cz0iZCI+JyArIHRoRGF0ZShlLmRhdGUpICsgJyDCtyAnICsgZXNjKGUudHlwZSkgKyAnICcgKyBzdGF0dXNCYWRnZShlLnN0YXR1cykgKyAnPC9kaXY+JyArCiAgICAgICAgICAnPGRpdiBjbGFzcz0idCI+JyArIGVzYyhlLnRpdGxlKSArICc8L2Rpdj4nICsKICAg',
  'ICAgICAgIChlLnRvZG8gJiYgZS50b2RvLmxlbmd0aCA/IHRvZG9MaXN0SHRtbChlKSA6ICcnKSArCiAgICAgICAgICAoZS5kZXRhaWwgPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCI+JyArIGVzYyhlLmRldGFpbCkgKyAnPC9kaXY+JyA6ICcnKSArCiAgICAgICAg',
  'ICAoZS5jb3N0ID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQiPicgKyBiYWh0KGUuY29zdCkgKyAnPC9kaXY+JyA6ICcnKSArCiAgICAgICAgICAoZS5waG90b3MgJiYgZS5waG90b3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9Im10OCI+JyArIHRodW1ic0h0bWwoZS5w',
  'aG90b3MpICsgJzwvZGl2PicgOiAnJykgKwogICAgICAgICc8L2Rpdj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij7guKLguLHguIfguYTguKHguYjguKHguLXguJvguKPguLDguKfguLHguJXguLQ8L2Rpdj4nKTsK',
  'CiAgICBvcGVuTW9kYWwoJ/Cfmqog4Lir4LmJ4Lit4LiHICcgKyByb29tICsgJyDCtyDguIrguLHguYnguJkgJyArIChpLmZsb29yfHwnJyksIGJvZHksCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lib4Li04LiUPC9i',
  'dXR0b24+JywgdHJ1ZSk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwgJ2VycicpOyBjbG9zZU1vZGFsKCk7IH0pOwp9CgoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09CiAgIDgpIOC4o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKLguKvguK0gKOC4o+C4suC4ouC5gOC4lOC4t+C4reC4mSkKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICov',
  'Ci8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguIHguKPguLLguJ8g4oCUIOC4p+C4suC4lOC5gOC4m+C5h+C4mSBTVkcg4LiV4Lij4LiHIOC5hiDguYTguKHguYjguJ7guLbguYjguIfguYTg',
  'uKXguJrguKPguLLguKPguLXguILguYnguLLguIfguJnguK3guIEKICAg4LmA4Lie4Lij4Liy4Liw4Lir4LiZ4LmJ4Liy4LmA4Lin4LmH4Lia4LiC4Lit4LiHIEFwcHMgU2NyaXB0IOC5guC4q+C4peC4lOC4quC4hOC4o+C4tOC4m+C4leC5jOC4guC5ieC4suC4oeC5',
  'guC4lOC5gOC4oeC4meC5hOC4oeC5iOC5hOC4lOC5iQogICDguYHguKXguLDguKvguJnguYnguLLguJXguLHguKfguK3guKLguYjguLLguIfguJXguYnguK3guIfguYDguJvguLTguJTguYTguJTguYnguYLguJTguKLguYTguKHguYjguJXguYnguK3guIfguJXguYjg',
  'uK3guYDguJnguYfguJUKCiAgIOC4quC4teC4l+C4teC5iOC5g+C4iuC5ieC5gOC4m+C5h+C4meC4meC5ieC4s+C5gOC4h+C4tOC4mS/guKrguYnguKEg4LmE4Lih4LmI4LmD4LiK4LmI4LmA4LiC4Li14Lii4LinL+C5geC4lOC4hyDguYDguJ7guKPguLLguLDguKfg',
  'uLHguJTguYHguKXguYnguKfguYDguILguLXguKLguKfguIHguLHguJrguYHguJTguIcKICAg4LiE4LiZ4LiV4Liy4Lia4Lit4LiU4Liq4Li14LmA4LiC4Li14Lii4LinLeC5geC4lOC4h+C5geC4ouC4geC5hOC4oeC5iOC4reC4reC4gSAozpRFIDQuOSDguJXguYjg',
  'uLPguIHguKfguYjguLLguYDguIHguJPguJHguYwgNikg4LiE4Li54LmI4LiZ4Li14LmJ4LmE4LiU4LmJIDI3LjYKICAg4LiX4Li44LiB4LiV4Lix4Lin4LmA4Lil4LiC4LiX4Li14LmI4LiB4Lij4Liy4Lif4LmB4Liq4LiU4LiHIOC4reC5iOC4suC4meC5hOC4lOC5',
  'ieC4iOC4suC4geC4leC4suC4o+C4suC4h+C4guC5ieC4suC4h+C4peC5iOC4suC4h+C5gOC4quC4oeC4rQogICDguIHguKXguYjguK3guIfguJrguK3guIHguITguYjguLLguJXguK3guJnguIrguLXguYnguYDguJvguYfguJnguILguK3guIfguYHguJbguKEg4LmE',
  '4Lih4LmI4LmD4LiK4LmI4LiX4Liy4LiH4LmA4LiU4Li14Lii4Lin4LiX4Li14LmI4LiI4Liw4Lij4Li54LmJ4LiE4LmI4LiyCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKdmFyIENIQVJU',
  'X1cgPSA3MjAsIENIQVJUX1BBREwgPSA2MiwgQ0hBUlRfUEFEUiA9IDE0LCBDSEFSVF9QQURUID0gMTQ7CnZhciBDSEFSVF9PTiA9IG51bGw7CgovKiog4Lib4Lix4LiU4LiC4Li24LmJ4LiZ4LmA4Lib4LmH4LiZ4LmA4Lil4LiC4LiB4Lil4LihIOC5hiDguKrguLPg',
  'uKvguKPguLHguJrguKvguLHguKfguYHguIHguJkgWSAqLwpmdW5jdGlvbiBuaWNlTWF4KHYpewogIGlmICh2IDw9IDApIHJldHVybiAxOwogIHZhciBtYWcgPSBNYXRoLnBvdygxMCwgTWF0aC5mbG9vcihNYXRoLmxvZyh2KSAvIE1hdGguTE4xMCkpOwogIHZhciBu',
  'ID0gdiAvIG1hZzsKICB2YXIgc3RlcCA9IG4gPD0gMSA/IDEgOiBuIDw9IDIgPyAyIDogbiA8PSAyLjUgPyAyLjUgOiBuIDw9IDUgPyA1IDogMTA7CiAgcmV0dXJuIHN0ZXAgKiBtYWc7Cn0KCi8qKiDguKLguYjguK3guIjguLPguJnguKfguJnguYDguIfguLTguJng',
  'uYPguKvguYnguKrguLHguYnguJnguJ7guK3guKrguLPguKvguKPguLHguJrguKvguLHguKfguYHguIHguJkg4oCUIDEuMiDguKUuIC8gODVLICovCmZ1bmN0aW9uIHNob3J0QmFodCh2KXsKICB2YXIgYSA9IE1hdGguYWJzKHYpOwogIGlmIChhID49IDEwMDAwMDAp',
  'IHJldHVybiAodiAvIDEwMDAwMDApLnRvRml4ZWQoYSA+PSAxMDAwMDAwMCA/IDAgOiAxKS5yZXBsYWNlKC9cLjAkLywgJycpICsgJyDguKUuJzsKICBpZiAoYSA+PSAxMDAwKSByZXR1cm4gTWF0aC5yb3VuZCh2IC8gMTAwMCkgKyAnSyc7CiAgcmV0dXJuIFN0cmlu',
  'ZyhNYXRoLnJvdW5kKHYpKTsKfQoKLyoqIOC5geC4l+C5iOC4h+C4l+C4teC5iOC4m+C4peC4suC4ouC4lOC5ieC4suC4meC4guC5ieC4reC4oeC4ueC4peC4oeC4mSA0cHgg4LiU4LmJ4Liy4LiZ4LiQ4Liy4LiZ4LmA4Lir4Lil4Li14LmI4Lii4LihICovCmZ1bmN0',
  'aW9uIGJhclBhdGgoeCwgeSwgdywgaCwgdXApewogIHZhciByID0gTWF0aC5taW4oNCwgdyAvIDIsIGgpOwogIGlmIChoIDw9IDAuNSkgcmV0dXJuICcnOwogIHJldHVybiB1cAogICAgPyAnTScgKyB4ICsgJywnICsgKHkgKyBoKSArICdWJyArICh5ICsgcikgKyAn',
  'YScgKyByICsgJywnICsgciArICcgMCAwIDEgJyArIHIgKyAnLC0nICsgciArCiAgICAgICdoJyArICh3IC0gMiAqIHIpICsgJ2EnICsgciArICcsJyArIHIgKyAnIDAgMCAxICcgKyByICsgJywnICsgciArICdWJyArICh5ICsgaCkgKyAnWicKICAgIDogJ00nICsg',
  'eCArICcsJyArIHkgKyAnVicgKyAoeSArIGggLSByKSArICdhJyArIHIgKyAnLCcgKyByICsgJyAwIDAgMCAnICsgciArICcsJyArIHIgKwogICAgICAnaCcgKyAodyAtIDIgKiByKSArICdhJyArIHIgKyAnLCcgKyByICsgJyAwIDAgMCAnICsgciArICcsLScgKyBy',
  'ICsgJ1YnICsgeSArICdaJzsKfQoKLyoqIOC4guC5ieC4reC4oeC4ueC4peC4guC4reC4h+C4geC4peC5iOC4reC4h+C4muC4reC4geC4hOC5iOC4siDguYDguIHguYfguJrguYDguJvguYfguJkgSlNPTiDguYPguJkgYXR0cmlidXRlIOC5geC4peC5ieC4pyBlc2Mo',
  'KSDguYPguKvguYnguJvguKXguK3guJTguKDguLHguKIgKi8KZnVuY3Rpb24gdGlwRGF0YShsYWJlbCwgcm93cyl7CiAgcmV0dXJuIGVzYyhKU09OLnN0cmluZ2lmeSh7IGw6IGxhYmVsLCByOiByb3dzIH0pKTsKfQoKZnVuY3Rpb24gaGl0UmVjdCh4LCB5LCB3LCBo',
  'LCB0aXApewogIHJldHVybiAnPHJlY3QgY2xhc3M9ImhpdCIgdGFiaW5kZXg9IjAiIHJvbGU9ImJ1dHRvbiIgeD0iJyArIHggKyAnIiB5PSInICsgeSArCiAgICAgICAgICciIHdpZHRoPSInICsgdyArICciIGhlaWdodD0iJyArIGggKyAnIiBkYXRhLXRpcD0iJyAr',
  'IHRpcCArICciPjwvcmVjdD4nOwp9CgpmdW5jdGlvbiBncmlkQW5kVGlja3ModG9wLCBwbG90SCwgbWF4LCBsaW5lcyl7CiAgdmFyIG91dCA9ICcnOwogIGZvciAodmFyIGkgPSAwOyBpIDw9IGxpbmVzOyBpKyspIHsKICAgIHZhciB5ID0gdG9wICsgcGxvdEggLSAo',
  'cGxvdEggKiBpIC8gbGluZXMpOwogICAgb3V0ICs9ICc8bGluZSBjbGFzcz0iZ3JpZC1sIiB4MT0iJyArIENIQVJUX1BBREwgKyAnIiB5MT0iJyArIHkgKyAnIiB4Mj0iJyArIChDSEFSVF9XIC0gQ0hBUlRfUEFEUikgKyAnIiB5Mj0iJyArIHkgKyAnIj48L2xpbmU+',
  'JyArCiAgICAgICAgICAgJzx0ZXh0IGNsYXNzPSJ0aWNrIiB4PSInICsgKENIQVJUX1BBREwgLSA4KSArICciIHk9IicgKyAoeSArIDQpICsgJyIgdGV4dC1hbmNob3I9ImVuZCI+JyArIHNob3J0QmFodChtYXggKiBpIC8gbGluZXMpICsgJzwvdGV4dD4nOwogIH0K',
  'ICByZXR1cm4gb3V0Owp9CgpmdW5jdGlvbiBzdmdXcmFwKGJvZHksIGgsIHRpdGxlKXsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImNoYXJ0LXdyYXAiPjxzdmcgY2xhc3M9ImNoYXJ0IiB2aWV3Qm94PSIwIDAgJyArIENIQVJUX1cgKyAnICcgKyBoICsgJyIgJyArCiAg',
  'ICAncm9sZT0iaW1nIiBhcmlhLWxhYmVsPSInICsgZXNjKHRpdGxlKSArICciIG9ucG9pbnRlcm1vdmU9ImNoYXJ0SG92ZXIoZXZlbnQpIiBvbnBvaW50ZXJsZWF2ZT0iY2hhcnRPdXQoKSIgJyArCiAgICAnb25mb2N1c2luPSJjaGFydEhvdmVyKGV2ZW50KSIgb25m',
  'b2N1c291dD0iY2hhcnRPdXQoKSI+JyArIGJvZHkgKyAnPC9zdmc+PC9kaXY+JzsKfQoKLyoqCiAqIOC4geC4o+C4suC4n+C5geC4l+C5iOC4h+C4hOC4ueC5iCDguKPguLLguKLguKPguLHguJogLyDguKPguLLguKLguIjguYjguLLguKIg4Lij4Liy4Lii4LmA4LiU',
  '4Li34Lit4LiZCiAqIOC4leC4tOC4lOC4m+C5ieC4suC4ouC4leC4seC4p+C5gOC4peC4guC5gOC4ieC4nuC4suC4sOC5gOC4lOC4t+C4reC4meC4quC4ueC4h+C4quC4uOC4lOC4guC4reC4h+C5geC4leC5iOC4peC4sOC4neC4seC5iOC4hyDguYTguKHguYjguJXg',
  'uLTguJTguJfguLjguIHguYHguJfguYjguIcKICog4LmA4Lie4Lij4Liy4Liw4LiV4Li04LiU4LiE4Lij4Lia4LiX4Li44LiB4LmB4LiX4LmI4LiH4LmB4Lil4LmJ4Lin4Lij4LiB4LiI4LiZ4LmE4Lih4LmI4Lih4Li14LmD4LiE4Lij4Lit4LmI4Liy4LiZCiAqLwpm',
  'dW5jdGlvbiBjaGFydEluY29tZUV4cGVuc2Uocm93cyl7CiAgdmFyIHBsb3RIID0gMTkwLCB0b3AgPSBDSEFSVF9QQURULCBIID0gdG9wICsgcGxvdEggKyAzMDsKICB2YXIgbWF4ID0gbmljZU1heChNYXRoLm1heC5hcHBseShudWxsLCByb3dzLm1hcChmdW5jdGlv',
  'bihtKXsgcmV0dXJuIE1hdGgubWF4KG0uaW5jb21lLCBtLmV4cGVuc2UpOyB9KSkgfHwgMSk7CiAgdmFyIGJhbmQgPSAoQ0hBUlRfVyAtIENIQVJUX1BBREwgLSBDSEFSVF9QQURSKSAvIHJvd3MubGVuZ3RoOwogIHZhciBidyA9IE1hdGgubWluKDI0LCAoYmFuZCAt',
  'IDEwKSAvIDIpOwoKICB2YXIgbWF4SW4gPSByb3dzLnJlZHVjZShmdW5jdGlvbihhLCBiKXsgcmV0dXJuIGIuaW5jb21lID4gYS5pbmNvbWUgPyBiIDogYTsgfSwgcm93c1swXSk7CiAgdmFyIG1heEV4ID0gcm93cy5yZWR1Y2UoZnVuY3Rpb24oYSwgYil7IHJldHVy',
  'biBiLmV4cGVuc2UgPiBhLmV4cGVuc2UgPyBiIDogYTsgfSwgcm93c1swXSk7CgogIHZhciBib2R5ID0gZ3JpZEFuZFRpY2tzKHRvcCwgcGxvdEgsIG1heCwgNCk7CiAgcm93cy5mb3JFYWNoKGZ1bmN0aW9uKG0sIGkpewogICAgdmFyIGN4ID0gQ0hBUlRfUEFETCAr',
  'IGJhbmQgKiBpICsgYmFuZCAvIDI7CiAgICAvLyDguYDguKfguYnguJnguIrguYjguK3guIfguKfguYjguLLguIfguKrguLXguJ7guLfguYnguJkgMnB4IOC4o+C4sOC4q+C4p+C5iOC4suC4h+C5geC4l+C5iOC4h+C4hOC4ueC5iCDguYTguKHguYjguYPguIrguYng',
  'uYDguKrguYnguJnguILguK3guJrguKHguLLguITguLHguYjguJkKICAgIHZhciB4MSA9IGN4IC0gYncgLSAxLCB4MiA9IGN4ICsgMTsKICAgIHZhciBoMSA9IHBsb3RIICogKG0uaW5jb21lIC8gbWF4KSwgaDIgPSBwbG90SCAqIChtLmV4cGVuc2UgLyBtYXgpOwog',
  'ICAgYm9keSArPSAnPGc+JyArCiAgICAgICc8cmVjdCBjbGFzcz0iYmFuZCIgeD0iJyArIChjeCAtIGJhbmQgLyAyKSArICciIHk9IicgKyB0b3AgKyAnIiB3aWR0aD0iJyArIGJhbmQgKyAnIiBoZWlnaHQ9IicgKyBwbG90SCArICciIHJ4PSI2Ij48L3JlY3Q+JyAr',
  'CiAgICAgICc8cGF0aCBjbGFzcz0iYzEiIGQ9IicgKyBiYXJQYXRoKHgxLCB0b3AgKyBwbG90SCAtIGgxLCBidywgaDEsIHRydWUpICsgJyI+PC9wYXRoPicgKwogICAgICAnPHBhdGggY2xhc3M9ImMyIiBkPSInICsgYmFyUGF0aCh4MiwgdG9wICsgcGxvdEggLSBo',
  'MiwgYncsIGgyLCB0cnVlKSArICciPjwvcGF0aD4nOwogICAgaWYgKG0gPT09IG1heEluICYmIG0uaW5jb21lKSB7CiAgICAgIGJvZHkgKz0gJzx0ZXh0IGNsYXNzPSJkbGFiIiB4PSInICsgKHgxICsgYncgLyAyKSArICciIHk9IicgKyAodG9wICsgcGxvdEggLSBo',
  'MSAtIDYpICsgJyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+JyArIHNob3J0QmFodChtLmluY29tZSkgKyAnPC90ZXh0Pic7CiAgICB9CiAgICBpZiAobSA9PT0gbWF4RXggJiYgbS5leHBlbnNlKSB7CiAgICAgIGJvZHkgKz0gJzx0ZXh0IGNsYXNzPSJkbGFiIiB4PSIn',
  'ICsgKHgyICsgYncgLyAyKSArICciIHk9IicgKyAodG9wICsgcGxvdEggLSBoMiAtIDYpICsgJyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+JyArIHNob3J0QmFodChtLmV4cGVuc2UpICsgJzwvdGV4dD4nOwogICAgfQogICAgYm9keSArPSAnPHRleHQgY2xhc3M9Inhs',
  'YWIiIHg9IicgKyBjeCArICciIHk9IicgKyAodG9wICsgcGxvdEggKyAxOCkgKyAnIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj4nICsgZXNjKG0ubGFiZWwpICsgJzwvdGV4dD4nICsKICAgICAgaGl0UmVjdChjeCAtIGJhbmQgLyAyLCB0b3AsIGJhbmQsIHBsb3RILAog',
  'ICAgICAgIHRpcERhdGEobS5sYWJlbCwgW1sn4Lij4Liy4Lii4Lij4Lix4LiaJywgbW9uZXkobS5pbmNvbWUpLCAxXSwgWyfguKPguLLguKLguIjguYjguLLguKInLCBtb25leShtLmV4cGVuc2UpLCAyXV0pKSArCiAgICAgICc8L2c+JzsKICB9KTsKCiAgYm9keSAr',
  'PSAnPGxpbmUgY2xhc3M9ImF4aXMtbCIgeDE9IicgKyBDSEFSVF9QQURMICsgJyIgeTE9IicgKyAodG9wICsgcGxvdEgpICsgJyIgeDI9IicgKyAoQ0hBUlRfVyAtIENIQVJUX1BBRFIpICsgJyIgeTI9IicgKyAodG9wICsgcGxvdEgpICsgJyI+PC9saW5lPic7CiAg',
  'cmV0dXJuIHN2Z1dyYXAoYm9keSwgSCwgJ+C4geC4o+C4suC4n+C5geC4l+C5iOC4h+C5gOC4m+C4o+C4teC4ouC4muC5gOC4l+C4teC4ouC4muC4o+C4suC4ouC4o+C4seC4muC4geC4seC4muC4o+C4suC4ouC4iOC5iOC4suC4ouC4guC4reC4h+C5geC4leC5iOC4',
  'peC4sOC5gOC4lOC4t+C4reC4mScpOwp9CgovKioKICog4LiB4Liz4LmE4LijL+C4guC4suC4lOC4l+C4uOC4meC4quC4uOC4l+C4mOC4tOC4o+C4suC4ouC5gOC4lOC4t+C4reC4mSDigJQg4LmB4LiX4LmI4LiH4LiC4Li24LmJ4LiZ4LiI4Liy4LiB4LmA4Liq4LmJ',
  '4LiZ4Lio4Li54LiZ4Lii4LmM4LiE4Li34Lit4LiB4Liz4LmE4LijIOC4peC4h+C4hOC4t+C4reC4guC4suC4lOC4l+C4uOC4mQogKiDguJXguLPguYHguKvguJnguYjguIfguYDguKvguJnguLfguK0v4LmD4LiV4LmJ4LmA4Liq4LmJ4LiZ4LmA4Lib4LmH4LiZ4LiV',
  '4Lix4Lin4Lia4Lit4LiB4Lir4Lil4Lix4LiBIOC4quC4teC5gOC4m+C5h+C4meC4leC4seC4p+C4ouC5ieC4s+C4reC4teC4geC4iuC4seC5ieC4meC4q+C4meC4tuC5iOC4hwogKi8KZnVuY3Rpb24gY2hhcnROZXQocm93cyl7CiAgdmFyIHBsb3RIID0gMTcwLCB0',
  'b3AgPSBDSEFSVF9QQURULCBIID0gdG9wICsgcGxvdEggKyAzMDsKICB2YXIgbWF4ID0gbmljZU1heChNYXRoLm1heC5hcHBseShudWxsLCByb3dzLm1hcChmdW5jdGlvbihtKXsgcmV0dXJuIE1hdGguYWJzKG0ubmV0KTsgfSkpIHx8IDEpOwogIHZhciBiYW5kID0g',
  'KENIQVJUX1cgLSBDSEFSVF9QQURMIC0gQ0hBUlRfUEFEUikgLyByb3dzLmxlbmd0aDsKICB2YXIgYncgPSBNYXRoLm1pbigyNCwgYmFuZCAtIDEyKTsKICB2YXIgemVybyA9IHRvcCArIHBsb3RIIC8gMiwgaGFsZiA9IHBsb3RIIC8gMjsKCiAgdmFyIGJlc3QgPSBy',
  'b3dzLnJlZHVjZShmdW5jdGlvbihhLCBiKXsgcmV0dXJuIGIubmV0ID4gYS5uZXQgPyBiIDogYTsgfSwgcm93c1swXSk7CiAgdmFyIHdvcnN0ID0gcm93cy5yZWR1Y2UoZnVuY3Rpb24oYSwgYil7IHJldHVybiBiLm5ldCA8IGEubmV0ID8gYiA6IGE7IH0sIHJvd3Nb',
  'MF0pOwoKICB2YXIgYm9keSA9ICcnOwogIFsxLCAwLjUsIDAsIC0wLjUsIC0xXS5mb3JFYWNoKGZ1bmN0aW9uKGYpewogICAgdmFyIHkgPSB6ZXJvIC0gaGFsZiAqIGY7CiAgICBib2R5ICs9ICc8bGluZSBjbGFzcz0iZ3JpZC1sIiB4MT0iJyArIENIQVJUX1BBREwg',
  'KyAnIiB5MT0iJyArIHkgKyAnIiB4Mj0iJyArIChDSEFSVF9XIC0gQ0hBUlRfUEFEUikgKyAnIiB5Mj0iJyArIHkgKyAnIj48L2xpbmU+JyArCiAgICAgICAgICAgICc8dGV4dCBjbGFzcz0idGljayIgeD0iJyArIChDSEFSVF9QQURMIC0gOCkgKyAnIiB5PSInICsg',
  'KHkgKyA0KSArICciIHRleHQtYW5jaG9yPSJlbmQiPicgKyBzaG9ydEJhaHQobWF4ICogZikgKyAnPC90ZXh0Pic7CiAgfSk7CgogIHJvd3MuZm9yRWFjaChmdW5jdGlvbihtLCBpKXsKICAgIHZhciBjeCA9IENIQVJUX1BBREwgKyBiYW5kICogaSArIGJhbmQgLyAy',
  'OwogICAgdmFyIGggPSBoYWxmICogKE1hdGguYWJzKG0ubmV0KSAvIG1heCk7CiAgICB2YXIgdXAgPSBtLm5ldCA+PSAwOwogICAgYm9keSArPSAnPGc+JyArCiAgICAgICc8cmVjdCBjbGFzcz0iYmFuZCIgeD0iJyArIChjeCAtIGJhbmQgLyAyKSArICciIHk9Iicg',
  'KyB0b3AgKyAnIiB3aWR0aD0iJyArIGJhbmQgKyAnIiBoZWlnaHQ9IicgKyBwbG90SCArICciIHJ4PSI2Ij48L3JlY3Q+JyArCiAgICAgICc8cGF0aCBjbGFzcz0iJyArICh1cCA/ICdjMScgOiAnYzInKSArICciIGQ9IicgKyBiYXJQYXRoKGN4IC0gYncgLyAyLCB1',
  'cCA/IHplcm8gLSBoIDogemVybywgYncsIGgsIHVwKSArICciPjwvcGF0aD4nOwogICAgaWYgKChtID09PSBiZXN0ICYmIG0ubmV0ID4gMCkgfHwgKG0gPT09IHdvcnN0ICYmIG0ubmV0IDwgMCkpIHsKICAgICAgYm9keSArPSAnPHRleHQgY2xhc3M9ImRsYWIiIHg9',
  'IicgKyBjeCArICciIHk9IicgKyAodXAgPyB6ZXJvIC0gaCAtIDYgOiB6ZXJvICsgaCArIDE0KSArICciIHRleHQtYW5jaG9yPSJtaWRkbGUiPicgKyBzaG9ydEJhaHQobS5uZXQpICsgJzwvdGV4dD4nOwogICAgfQogICAgYm9keSArPSAnPHRleHQgY2xhc3M9Inhs',
  'YWIiIHg9IicgKyBjeCArICciIHk9IicgKyAodG9wICsgcGxvdEggKyAxOCkgKyAnIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj4nICsgZXNjKG0ubGFiZWwpICsgJzwvdGV4dD4nICsKICAgICAgaGl0UmVjdChjeCAtIGJhbmQgLyAyLCB0b3AsIGJhbmQsIHBsb3RILAog',
  'ICAgICAgIHRpcERhdGEobS5sYWJlbCwgW1t1cCA/ICfguIHguLPguYTguKMnIDogJ+C4guC4suC4lOC4l+C4uOC4mScsIG1vbmV5KG0ubmV0KSwgdXAgPyAxIDogMl1dKSkgKwogICAgICAnPC9nPic7CiAgfSk7CgogIGJvZHkgKz0gJzxsaW5lIGNsYXNzPSJheGlz',
  'LWwiIHgxPSInICsgQ0hBUlRfUEFETCArICciIHkxPSInICsgemVybyArICciIHgyPSInICsgKENIQVJUX1cgLSBDSEFSVF9QQURSKSArICciIHkyPSInICsgemVybyArICciPjwvbGluZT4nOwogIHJldHVybiBzdmdXcmFwKGJvZHksIEgsICfguIHguKPguLLguJ/g',
  'uIHguLPguYTguKPguILguLLguJTguJfguLjguJnguKrguLjguJfguJjguLTguKPguLLguKLguYDguJTguLfguK3guJkg4LmB4LiX4LmI4LiH4LmA4Lir4LiZ4Li34Lit4LmA4Liq4LmJ4LiZ4LiE4Li34Lit4LiB4Liz4LmE4LijIOC5g+C4leC5ieC5gOC4quC5ieC4',
  'meC4hOC4t+C4reC4guC4suC4lOC4l+C4uOC4mScpOwp9CgpmdW5jdGlvbiBjaGFydFRpcEJveCgpewogIHZhciBib3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2hhcnRUaXAnKTsKICBpZiAoIWJveCkgewogICAgYm94ID0gZG9jdW1lbnQuY3JlYXRlRWxl',
  'bWVudCgnZGl2Jyk7CiAgICBib3guaWQgPSAnY2hhcnRUaXAnOwogICAgYm94LmNsYXNzTmFtZSA9ICdjdGlwJzsKICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYm94KTsKICB9CiAgcmV0dXJuIGJveDsKfQoKZnVuY3Rpb24gY2hhcnRIb3Zlcihldil7CiAg',
  'dmFyIGhpdCA9IGV2LnRhcmdldCAmJiBldi50YXJnZXQuY2xvc2VzdCA/IGV2LnRhcmdldC5jbG9zZXN0KCcuaGl0JykgOiBudWxsOwogIGlmICghaGl0KSB7IGNoYXJ0T3V0KCk7IHJldHVybjsgfQoKICB2YXIgZyA9IGhpdC5wYXJlbnROb2RlOwogIGlmIChDSEFS',
  'VF9PTiAmJiBDSEFSVF9PTiAhPT0gZykgQ0hBUlRfT04uY2xhc3NMaXN0LnJlbW92ZSgnb24nKTsKICBnLmNsYXNzTGlzdC5hZGQoJ29uJyk7CiAgQ0hBUlRfT04gPSBnOwoKICB2YXIgZGF0YTsKICB0cnkgeyBkYXRhID0gSlNPTi5wYXJzZShoaXQuZ2V0QXR0cmli',
  'dXRlKCdkYXRhLXRpcCcpIHx8ICd7fScpOyB9IGNhdGNoIChlKSB7IHJldHVybjsgfQoKICAvLyDguJvguKPguLDguIHguK3guJrguJTguYnguKfguKIgdGV4dENvbnRlbnQg4LmE4Lih4LmI4LmD4LiK4LmIIGlubmVySFRNTCDigJQg4LiK4Li34LmI4Lit4Lij4Liy',
  '4Lii4LiB4Liy4Lij4Lih4Liy4LiI4Liy4LiB4LiC4LmJ4Lit4Lih4Li54LilIOC5hOC4oeC5iOC4hOC4p+C4o+C4luC4t+C4reC4p+C5iOC4suC4m+C4peC4reC4lOC4oOC4seC4ogogIHZhciBib3ggPSBjaGFydFRpcEJveCgpOwogIGJveC5pbm5lckhUTUwgPSAn',
  'JzsKICB2YXIgaGVhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogIGhlYWQuY2xhc3NOYW1lID0gJ20nOwogIGhlYWQudGV4dENvbnRlbnQgPSBkYXRhLmwgfHwgJyc7CiAgYm94LmFwcGVuZENoaWxkKGhlYWQpOwoKICAoZGF0YS5yIHx8IFtdKS5m',
  'b3JFYWNoKGZ1bmN0aW9uKHJvdyl7CiAgICB2YXIgbGluZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogICAgbGluZS5jbGFzc05hbWUgPSAncic7CiAgICB2YXIga2V5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaScpOwogICAga2V5LnN0eWxl',
  'LmJhY2tncm91bmQgPSAndmFyKC0tYycgKyAocm93WzJdIHx8IDEpICsgJyknOwogICAgdmFyIG5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7CiAgICBuYW1lLnRleHRDb250ZW50ID0gcm93WzBdOwogICAgdmFyIHZhbCA9IGRvY3VtZW50LmNy',
  'ZWF0ZUVsZW1lbnQoJ2InKTsKICAgIHZhbC50ZXh0Q29udGVudCA9IHJvd1sxXTsKICAgIGxpbmUuYXBwZW5kQ2hpbGQoa2V5KTsgbGluZS5hcHBlbmRDaGlsZChuYW1lKTsgbGluZS5hcHBlbmRDaGlsZCh2YWwpOwogICAgYm94LmFwcGVuZENoaWxkKGxpbmUpOwog',
  'IH0pOwoKICAvLyDguYDguIHguLLguLDguJXguLPguYHguKvguJnguYjguIfguYDguKHguLLguKrguYwg4LmE4Lih4LmI4LmD4LiK4LmI4LiC4Lit4Lia4Lia4LiZ4LiC4Lit4LiH4LiK4LmI4Lit4LiH4Lij4Lix4Lia4LiB4Liy4Lij4LiK4Li14LmJICjguIrguYjg',
  'uK3guIfguJnguLHguYnguJnguKrguLnguIfguYDguJfguYjguLLguIHguKPguLLguJ/guJfguLHguYnguIfguK3guLHguJkKICAvLyDguKfguLLguIfguYTguKfguYnguILguYnguLLguIfguJrguJnguJfguLXguYTguKPguIHguYfguYTguJvguJrguLHguIfguKvg',
  'uLHguKfguILguYnguK3guIHguLLguKPguYzguJTguJfguLjguIHguJfguLUpIOC4luC5ieC4suC5gOC4peC4t+C5iOC4reC4meC4lOC5ieC4p+C4ouC5geC4m+C5ieC4meC4nuC4tOC4oeC4nuC5jOC4geC5h+C5g+C4iuC5ieC4leC4seC4p+C5geC4l+C5iOC4h+C5',
  'geC4l+C4mQogIHZhciByID0gaGl0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpOwogIHZhciBweCA9IChldi5jbGllbnRYIHx8IGV2LmNsaWVudFggPT09IDApID8gZXYuY2xpZW50WCA6IHIubGVmdCArIHIud2lkdGggLyAyOwogIHZhciBweSA9IChldi5jbGllbnRZ',
  'IHx8IGV2LmNsaWVudFkgPT09IDApID8gZXYuY2xpZW50WSA6IHIudG9wICsgci5oZWlnaHQgLyAyOwogIGJveC5jbGFzc0xpc3QuYWRkKCdvbicpOwogIHZhciBsZWZ0ID0gTWF0aC5taW4oTWF0aC5tYXgoOCwgcHggLSBib3gub2Zmc2V0V2lkdGggLyAyKSwgd2lu',
  'ZG93LmlubmVyV2lkdGggLSBib3gub2Zmc2V0V2lkdGggLSA4KTsKICB2YXIgYWJvdmUgPSBweSAtIGJveC5vZmZzZXRIZWlnaHQgLSAxNDsKICBib3guc3R5bGUubGVmdCA9IGxlZnQgKyAncHgnOwogIGJveC5zdHlsZS50b3AgPSAoYWJvdmUgPCA4ID8gcHkgKyAx',
  'OCA6IGFib3ZlKSArICdweCc7Cn0KCmZ1bmN0aW9uIGNoYXJ0T3V0KCl7CiAgaWYgKENIQVJUX09OKSB7IENIQVJUX09OLmNsYXNzTGlzdC5yZW1vdmUoJ29uJyk7IENIQVJUX09OID0gbnVsbDsgfQogIHZhciBib3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgn',
  'Y2hhcnRUaXAnKTsKICBpZiAoYm94KSBib3guY2xhc3NMaXN0LnJlbW92ZSgnb24nKTsKfQoKZnVuY3Rpb24gY2hhcnRMZWdlbmQoYSwgYil7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJsZWdlbmQiPicgKwogICAgJzxzcGFuIGNsYXNzPSJrIj48c3BhbiBjbGFzcz0i',
  'c3ciIHN0eWxlPSJiYWNrZ3JvdW5kOnZhcigtLWMxKSI+PC9zcGFuPicgKyBlc2MoYSkgKyAnPC9zcGFuPicgKwogICAgJzxzcGFuIGNsYXNzPSJrIj48c3BhbiBjbGFzcz0ic3ciIHN0eWxlPSJiYWNrZ3JvdW5kOnZhcigtLWMyKSI+PC9zcGFuPicgKyBlc2MoYikg',
  'KyAnPC9zcGFuPicgKwogICAgJzwvZGl2Pic7Cn0KClJPVVRFUy5maW5hbmNlID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7CiAgICByZXR1cm4gUHJvbWlzZS5hbGwoWwogICAgICBjYWxsQXBpKCdmaW5hbmNlLnN1bW1hcnknLCB7IHllYXI6IFMueWVhciB9KSwKICAg',
  'ICAgY2FsbEFwaSgnZmluYW5jZS5saXN0JywgeyB5ZWFyOiBTLnllYXIsIGtpbmQ6IFMucGFyYW1zLmtpbmQgfHwgJycgfSkKICAgIF0pLnRoZW4oZnVuY3Rpb24ocil7IHZhciBkID0gclswXTsgZC5pdGVtcyA9IHJbMV07IHJldHVybiBkOyB9KTsKICB9LAogIHJl',
  'bmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgeWVhckxhYmVsID0gUy55ZWFyID09PSAnYWxsJyA/ICfguJfguLjguIHguJvguLUnIDogJ+C4m+C4tSAnICsgUy55ZWFyOwogICAgdmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAg',
  'a3BpKCfguKPguLLguKLguKPguLHguJogJyArIHllYXJMYWJlbCwgYmFodChkLmluY29tZSksICfguYDguInguKXguLXguYjguKIgJyArIGJhaHQoZC5hdmdJbmNvbWUpICsgJy/guYDguJTguLfguK3guJknLCAnZ29vZCcpICsKICAgICAga3BpKCfguKPguLLguKLg',
  'uIjguYjguLLguKIgJyArIHllYXJMYWJlbCwgYmFodChkLmV4cGVuc2UpLCAn4LmA4LiJ4Lil4Li14LmI4LiiICcgKyBiYWh0KGQuYXZnRXhwZW5zZSkgKyAnL+C5gOC4lOC4t+C4reC4mScsICdiYWQnKSArCiAgICAgIGtwaSgn4LiE4LiH4LmA4Lir4Lil4Li34Lit',
  '4Liq4Li44LiX4LiY4Li0JywgYmFodChkLm5ldCksICfguK3guLHguJXguKPguLLguIHguLPguYTguKMgJyArIHBjdChkLm1hcmdpbiksICdhY2NlbnQgJyArIChkLm5ldCA+PSAwID8gJ2dvb2QnIDogJ2JhZCcpKSArCiAgICAgIGtwaSgn4Lia4Lix4LiZ4LiX4Li2',
  '4LiB4LmB4Lil4LmJ4LinJywgZC5tb250aHNXaXRoRGF0YSArICcg4LmA4LiU4Li34Lit4LiZJywgZC5jb3VudCArICcg4Lij4Liy4Lii4LiB4Liy4LijJykgKwogICAgJzwvZGl2Pic7CgogICAgLy8g4LiB4Lij4Liy4Lif4LiB4LmI4Lit4LiZIOC5geC4peC5ieC4',
  'p+C4hOC5iOC4reC4ouC4leC4suC4o+C4suC4hyDigJQg4LiV4Liy4Lij4Liy4LiH4LiC4LmJ4Liy4LiH4Lil4LmI4Liy4LiH4LiE4Li34Lit4LiX4Li14LmI4Lit4LmI4Liy4LiZ4LiE4LmI4Liy4LiI4Lij4Li04LiH4LmE4LiU4LmJ4LiX4Li44LiB4LiV4Lix4Lin',
  'CiAgICAvLyDguIHguKPguLLguJ/guIrguYjguKfguKLguYPguKvguYnguYDguKvguYfguJnguYHguJnguKfguYLguJnguYnguKEg4LmE4Lih4LmI4LmE4LiU4LmJ4Lih4Liy4LmB4LiX4LiZ4LiV4Lix4Lin4LmA4Lil4LiCCiAgICB2YXIgaGFzRGF0YSA9IGQuYnlN',
  'b250aC5zb21lKGZ1bmN0aW9uKG0peyByZXR1cm4gbS5pbmNvbWUgfHwgbS5leHBlbnNlOyB9KTsKICAgIHZhciBjaGFydHMgPSAhaGFzRGF0YSA/ICcnIDoKICAgICAgY2FyZCgn8J+TiCDguKPguLLguKLguKPguLHguJogLyDguKPguLLguKLguIjguYjguLLguKIg',
  '4Lij4Liy4Lii4LmA4LiU4Li34Lit4LiZIMK3ICcgKyB5ZWFyTGFiZWwsCiAgICAgICAgY2hhcnRMZWdlbmQoJ+C4o+C4suC4ouC4o+C4seC4micsICfguKPguLLguKLguIjguYjguLLguKInKSArIGNoYXJ0SW5jb21lRXhwZW5zZShkLmJ5TW9udGgpKSArCiAgICAg',
  'IGNhcmQoJ+Kalu+4jyDguIHguLPguYTguKMgLyDguILguLLguJTguJfguLjguJnguKrguLjguJfguJjguLQg4Lij4Liy4Lii4LmA4LiU4Li34Lit4LiZIMK3ICcgKyB5ZWFyTGFiZWwsCiAgICAgICAgJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbWI4Ij7guYHguJfg',
  'uYjguIfguYDguKvguJnguLfguK3guYDguKrguYnguJnguKjguLnguJnguKLguYzguITguLfguK3guYDguJTguLfguK3guJnguJfguLXguYjguIHguLPguYTguKMg4LmD4LiV4LmJ4LmA4Liq4LmJ4LiZ4LiE4Li34Lit4LmA4LiU4Li34Lit4LiZ4LiX4Li14LmI4LiC',
  '4Liy4LiU4LiX4Li44LiZPC9kaXY+JyArCiAgICAgICAgY2hhcnROZXQoZC5ieU1vbnRoKSk7CgogICAgdmFyIG1heEJhciA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGQuYnlNb250aC5tYXAoZnVuY3Rpb24obSl7IHJldHVybiBNYXRoLm1heChtLmluY29tZSwgbS5l',
  'eHBlbnNlKTsgfSkpIHx8IDE7CiAgICB2YXIgbW9udGhseSA9IGNhcmQoJ/Cfk4Ug4Lij4Liy4Lii4LmA4LiU4Li34Lit4LiZIMK3ICcgKyB5ZWFyTGFiZWwsCiAgICAgICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0Ij48dGhlYWQ+PHRyPicgKwogICAg',
  'ICAnPHRoPuC5gOC4lOC4t+C4reC4mTwvdGg+PHRoIGNsYXNzPSJudW0iPuC4o+C4suC4ouC4o+C4seC4mjwvdGg+PHRoIGNsYXNzPSJudW0iPuC4o+C4suC4ouC4iOC5iOC4suC4ojwvdGg+PHRoIGNsYXNzPSJudW0iPuC4hOC4h+C5gOC4q+C4peC4t+C4rTwvdGg+',
  'JyArCiAgICAgICc8dGggc3R5bGU9IndpZHRoOjM4JSI+4LmA4LiX4Li14Lii4Lia4Lij4Liy4Lii4Lij4Lix4LiaIC8g4Lij4Liy4Lii4LiI4LmI4Liy4LiiPC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICBkLmJ5TW9udGgubWFwKGZ1bmN0aW9uKG0p',
  'ewogICAgICAgIHZhciBibGFuayA9ICFtLmluY29tZSAmJiAhbS5leHBlbnNlOwogICAgICAgIHJldHVybiAnPHRyJyArIChibGFuayA/ICcgc3R5bGU9Im9wYWNpdHk6LjQ1IicgOiAnJykgKyAnPicgKwogICAgICAgICAgJzx0ZD48Yj4nICsgbS5sYWJlbCArICc8',
  'L2I+PC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChtLmluY29tZSA/IG1vbmV5KG0uaW5jb21lKSA6ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKG0uZXhwZW5zZSA/IG1vbmV5KG0uZXhwZW5z',
  'ZSkgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+PGIgc3R5bGU9ImNvbG9yOicgKyAobS5uZXQgPj0gMCA/ICd2YXIoLS1vayknIDogJ3ZhcigtLWRhbmdlciknKSArICciPicgKwogICAgICAgICAgICAoYmxhbmsgPyAn4oCT',
  'JyA6IG1vbmV5KG0ubmV0KSkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAnPHRkPicgKwogICAgICAgICAgICAnPGRpdiBjbGFzcz0iYmFyLXRyYWNrIG1iOCI+PGRpdiBjbGFzcz0iYmFyLWZpbGwiIHN0eWxlPSJ3aWR0aDonICsgKG0uaW5jb21lL21heEJhciox',
  'MDApICsgJyU7YmFja2dyb3VuZDp2YXIoLS1jMSkiPjwvZGl2PjwvZGl2PicgKwogICAgICAgICAgICAnPGRpdiBjbGFzcz0iYmFyLXRyYWNrIj48ZGl2IGNsYXNzPSJiYXItZmlsbCIgc3R5bGU9IndpZHRoOicgKyAobS5leHBlbnNlL21heEJhcioxMDApICsgJyU7',
  'YmFja2dyb3VuZDp2YXIoLS1jMikiPjwvZGl2PjwvZGl2PicgKwogICAgICAgICAgJzwvdGQ+PC90cj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JywgJycsIHRydWUpOwoKICAgIHZhciBieUtpbmQgPSBjYXJkKCfwn6e+IOC5',
  'geC4ouC4geC4leC4suC4oeC4o+C4suC4ouC4geC4suC4oyDCtyAnICsgeWVhckxhYmVsLAogICAgICBiYXJDaGFydChkLmJ5S2luZC5tYXAoZnVuY3Rpb24oayl7IHJldHVybiB7IGxhYmVsOiBrLmtpbmQgKyAnICgnICsgay5jb3VudCArICcpJywgdG90YWw6IGsu',
  'dG90YWwgfTsgfSksCiAgICAgICAgICAgICAgICdsYWJlbCcsICd0b3RhbCcsIGZ1bmN0aW9uKGkpeyByZXR1cm4gbW9uZXkoaS50b3RhbCkgKyAnIOC4vyc7IH0pKTsKCiAgICB2YXIgYnlZZWFyID0gY2FyZCgn8J+TiiDguYDguJfguLXguKLguJrguKPguLLguKLg',
  'uJvguLUnLAogICAgICBkLmJ5WWVhci5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDphdXRvIj48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4Lib4Li1PC90aD48dGggY2xhc3M9Im51bSI+4Lij4Liy',
  '4Lii4Lij4Lix4LiaPC90aD48dGggY2xhc3M9Im51bSI+4Lij4Liy4Lii4LiI4LmI4Liy4LiiPC90aD48dGggY2xhc3M9Im51bSI+4LiE4LiH4LmA4Lir4Lil4Li34LitPC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIGQuYnlZZWFyLm1hcChmdW5j',
  'dGlvbih5KXsKICAgICAgICAgIHJldHVybiAnPHRyIG9uY2xpY2s9InNldFllYXJGcm9tVGFibGUoJyArIHkueWVhciArICcpIiBzdHlsZT0iY3Vyc29yOnBvaW50ZXIiPicgKwogICAgICAgICAgICAnPHRkPjxiPicgKyB5LnllYXIgKyAnPC9iPiA8c3BhbiBjbGFz',
  'cz0iZmFpbnQgZnMxMiI+LyAnICsgKHkueWVhcis1NDMpICsgJzwvc3Bhbj48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyBtb25leSh5LmluY29tZSkgKyAnPC90ZD48dGQgY2xhc3M9Im51bSI+JyArIG1vbmV5KHkuZXhwZW5zZSkgKyAn',
  'PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj48YiBzdHlsZT0iY29sb3I6JyArICh5Lm5ldD49MD8ndmFyKC0tb2spJzondmFyKC0tZGFuZ2VyKScpICsgJyI+JyArIG1vbmV5KHkubmV0KSArICc8L2I+PC90ZD48L3RyPic7CiAgICAgICAgfSku',
  'am9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4guC5ieC4reC4oeC4ueC4pTwvZGl2PicsICcnLCB0cnVlKTsKCiAgICB2YXIga2luZHMgPSAnPGRpdiBjbGFzcz0i',
  'Y2hpcHMgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJjaGlwICcgKyAoIVMucGFyYW1zLmtpbmQ/J29uJzonJykgKyAnIiBvbmNsaWNrPSJzZXRQYXJhbShcJ2tpbmRcJyxcJ1wnKSI+4LiX4Li44LiB4Lij4Liy4Lii4LiB4Liy4LijPC9idXR0b24+JyAr',
  'CiAgICAgIGQuYnlLaW5kLm1hcChmdW5jdGlvbihrKXsKICAgICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9ImNoaXAgJyArIChTLnBhcmFtcy5raW5kPT09ay5raW5kPydvbic6JycpICsgJyIgb25jbGljaz0ic2V0UGFyYW0oXCdraW5kXCcsXCcnICsgZXNjKGsu',
  'a2luZCkgKyAnXCcpIj4nICsKICAgICAgICAgICAgICAgZXNjKGsua2luZCkgKyAnICgnICsgay5jb3VudCArICcpPC9idXR0b24+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKCiAgICB2YXIgcm93cyA9IGQuaXRlbXM7CiAgICB2YXIgbGlzdCA9IGNh',
  'cmQoJ/Cfk5Ig4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Lix4LmJ4LiH4Lir4Lih4LiUIMK3ICcgKyB5ZWFyTGFiZWwgKyAnICgnICsgcm93cy5sZW5ndGggKyAnKScsCiAgICAgIHJvd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0',
  'aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guKfguLHguJnguJfguLXguYg8L3RoPjx0aD7guKPguLLguKLguIHguLLguKM8L3RoPjx0aCBjbGFzcz0ibnVtIj7guIjguLPguJnguKfguJnguYDguIfguLTguJk8L3RoPjx0aD7guKPguK3guJrguJrguLTguKU8L3Ro',
  'Pjx0aD7guIrguYjguK3guIfguJfguLLguIc8L3RoPicgKwogICAgICAgICc8dGg+4Liq4Lil4Li04LibPC90aD48dGg+4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4PC90aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIHJvd3MubWFwKGZ1',
  'bmN0aW9uKHgpewogICAgICAgICAgdmFyIGluYyA9IHguZmxvdyA9PT0gJ+C4o+C4suC4ouC4o+C4seC4mic7CiAgICAgICAgICByZXR1cm4gJzx0cj4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyB0aERhdGUoeC5kYXRlKSArICc8',
  'L3RkPicgKwogICAgICAgICAgICAnPHRkPjxiPicgKyBlc2MoeC5raW5kKSArICc8L2I+ICcgKyAoaW5jID8gJzxzcGFuIGNsYXNzPSJiIG9rIj7guKPguLLguKLguKPguLHguJo8L3NwYW4+JyA6ICc8c3BhbiBjbGFzcz0iYiBtdXRlIj7guKPguLLguKLguIjguYjg',
  'uLLguKI8L3NwYW4+JykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj48YiBzdHlsZT0iY29sb3I6JyArIChpbmM/J3ZhcigtLW9rKSc6J3ZhcigtLWluayknKSArICciPicgKyAoaW5jPycrJzon4oiSJykgKyBtb25leSh4LmFtb3VudCwg',
  'MikgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MoeC5iaWxsTW9udGggfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MoeC5jaGFubmVsIHx8ICfigJMnKSAr',
  'ICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHguc2xpcFJlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIgbXV0ZWQgY2xpcCI+JyArIGVzYyh4Lm5vdGUgfHwgJycpICsgJzwvdGQ+JyArCiAgICAgICAg',
  'ICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24iIG9uY2xpY2s9XCdmb3JtRmluYW5jZSgnICsgYXR0cih4KSArICcpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAg',
  'ICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIGRnciIgb25jbGljaz0iZGVsRmluYW5jZShcJycgKyB4LmlkICsgJ1wnKSI+8J+XkTwvYnV0dG9uPicgKwogICAgICAgICAgICAnPC9kaXY+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90',
  'Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgOiBlbXB0eUJveCgn4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4Lij4LmD4LiZJyArIHllYXJMYWJlbCwgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZvcm1GaW5hbmNlKG51',
  'bGwpIj4rIOC4muC4seC4meC4l+C4tuC4geC4o+C4suC4ouC4geC4suC4ozwvYnV0dG9uPicpLAogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSBzbSIgb25jbGljaz0iZm9ybUZpbmFuY2UobnVsbCkiPisg4Lia4Lix4LiZ4LiX4Li24LiB4Lij4Liy4Lii4Lij',
  '4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4ojwvYnV0dG9uPicsIHRydWUpOwoKICAgIHJldHVybiBoZWFkICsgY2hhcnRzICsgbW9udGhseSArICc8ZGl2IGNsYXNzPSJncmlkIGcyIG10MTIgbWIxMiI+JyArIGJ5S2luZCArIGJ5WWVhciArICc8L2Rpdj4nICsg',
  'a2luZHMgKyBsaXN0OwogIH0KfTsKCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICA5KSDguKPguLLguKLguIfguLLguJkgJiDguKrguLPguKPguK3guIfguILguYnguK3guKHguLnguKUKICAg',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5yZXBvcnRzID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7CiAgICByZXR1cm4gUHJvbWlzZS5hbGwoWwogICAgICBjYWxsQXBpKCdyZXBvcnQu',
  'Y29zdFBlclJvb20nLCB7IHllYXI6IFMueWVhciB9KSwKICAgICAgY2FsbEFwaSgncmVwb3J0LnVwY29taW5nJywgeyBkYXlzOiA5MCB9KSwKICAgICAgY2FsbEFwaSgnYmFja3VwLnNoZWV0cycsIHt9KSwKICAgICAgY2FsbEFwaSgnc2hhcmUubGlua3MnLCB7fSku',
  'Y2F0Y2goZnVuY3Rpb24oKXsgcmV0dXJuIHt9OyB9KSwKICAgICAgY2FsbEFwaSgnYmFja3VwLmhpc3RvcnknLCB7fSkuY2F0Y2goZnVuY3Rpb24oKXsgcmV0dXJuIFtdOyB9KQogICAgXSkudGhlbihmdW5jdGlvbihyKXsKICAgICAgcmV0dXJuIHsgY29zdDogclsw',
  'XSwgdXBjb21pbmc6IHJbMV0sIHNoZWV0czogclsyXSwgbGlua3M6IHJbM10gfHwge30sIGJhY2t1cHM6IHJbNF0gfHwgW10sIHllYXJzOiBbXSB9OwogICAgfSk7CiAgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9',
  'PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKICAgIHZhciBjID0gZC5jb3N0OwogICAgdmFyIHRvcCA9IGMucm9vbXMuZmlsdGVyKGZ1bmN0aW9uKHIpeyByZXR1cm4gci50b3RhbCA+IDA7IH0pOwogICAgdmFyIG1heENv',
  'c3QgPSB0b3AubGVuZ3RoID8gdG9wWzBdLnRvdGFsIDogMTsKCiAgICB2YXIgdXBjb21pbmcgPSBjYXJkKCfwn5eT77iPIOC4m+C4j+C4tOC4l+C4tOC4meC4h+C4suC4meC4l+C4teC5iOC4geC4s+C4peC4seC4h+C4iOC4sOC4luC4tuC4hyAoOTAg4Lin4Lix4LiZ',
  'KSDCtyAnICsgZC51cGNvbWluZy5sZW5ndGggKyAnIOC4h+C4suC4mScsCiAgICAgIGQudXBjb21pbmcubGVuZ3RoID8gJzxkaXYgY2xhc3M9ImFsaXN0Ij4nICsgZC51cGNvbWluZy5tYXAoZnVuY3Rpb24odSl7CiAgICAgICAgdmFyIGx2bCA9IHUuZGF5c0xlZnQg',
  'PCAwID8gJ2RhbmdlcicgOiAodS5kYXlzTGVmdCA8PSA3ID8gJ3dhcm4nIDogJ2luZm8nKTsKICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImFsaSBsLScgKyBsdmwgKyAnIiBvbmNsaWNrPSJnbyhcJycgKyBqdW1wUGFnZSh1Lm1vZHVsZSkgKyAnXCcpIj4nICsK',
  'ICAgICAgICAgICc8ZGl2IGNsYXNzPSJpYyI+JyArIHUuaWNvbiArICc8L2Rpdj48ZGl2PicgKwogICAgICAgICAgJzxkaXYgY2xhc3M9InR0Ij4nICsgZXNjKHUudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAgJzxkaXYgY2xhc3M9ImRkIj4nICsgdGhEYXRl',
  'KHUuZGF0ZSkgKyAnIMK3ICcgKwogICAgICAgICAgICAodS5kYXlzTGVmdCA8IDAgPyAn4LmA4Lil4Lii4LiB4Liz4Lir4LiZ4LiUICcgKyAoLXUuZGF5c0xlZnQpICsgJyDguKfguLHguJknIDogKHUuZGF5c0xlZnQgPT09IDAgPyAn4Lin4Lix4LiZ4LiZ4Li14LmJ',
  'JyA6ICfguK3guLXguIEgJyArIHUuZGF5c0xlZnQgKyAnIOC4p+C4seC4mScpKSArCiAgICAgICAgICAgICh1LmRldGFpbCA/ICcgwrcgJyArIGVzYyh1LmRldGFpbCkgOiAnJykgKyAnPC9kaXY+PC9kaXY+PC9kaXY+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9k',
  'aXY+JyA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj7wn4yk77iPPC9kaXY+4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ4LiZ4Lix4LiU4Lir4Lih4Liy4Lii4LmD4LiZIDkwIOC4p+C4seC4meC4guC5ieC4suC4h+C4q+C4meC5ieC4sjwvZGl2',
  'PicsICcnLCB0cnVlKTsKCiAgICB2YXIgY29zdENhcmQgPSBjYXJkKCfwn4+377iPIOC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC4quC4sOC4quC4oeC4o+C4suC4ouC4q+C5ieC4reC4hyDCtyAnICsgeWVhckxhYmVsLAogICAgICAnPGRpdiBjbGFzcz0i',
  'Z3JpZCBnMyBtYjEyIj4nICsKICAgICAgICBrcGkoJ+C4o+C4p+C4oeC4l+C4uOC4geC4q+C5ieC4reC4hycsIGJhaHQoYy50b3RhbCksICcnKSArCiAgICAgICAga3BpKCfguYDguInguKXguLXguYjguKLguJXguYjguK3guKvguYnguK3guIcnLCBiYWh0KGMuYXZl',
  'cmFnZSksICcnKSArCiAgICAgICAga3BpKCfguKvguYnguK3guIfguJfguLXguYjguYPguIrguYnguIjguYjguLLguKLguKrguLnguIfguKrguLjguJQnLCB0b3AubGVuZ3RoID8gKCfguKvguYnguK3guIcgJyArIHRvcFswXS5yb29tKSA6ICfigJMnLCB0b3AubGVu',
  'Z3RoID8gYmFodCh0b3BbMF0udG90YWwpIDogJycpICsKICAgICAgJzwvZGl2PicgKwogICAgICAodG9wLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0Ij48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4Lir4LmJ4Lit4LiHPC90aD48',
  'dGggY2xhc3M9Im51bSI+4LiH4Liy4LiZ4LiL4LmI4Lit4LihPC90aD48dGggY2xhc3M9Im51bSI+4LiE4LmI4Liy4LiL4LmI4Lit4LihPC90aD48dGggY2xhc3M9Im51bSI+4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMPC90aD4nICsKICAgICAgICAnPHRoIGNsYXNz',
  'PSJudW0iPuC4guC4reC4h+C5gOC4guC5ieC4suC4q+C5ieC4reC4hzwvdGg+PHRoIGNsYXNzPSJudW0iPuC4o+C4p+C4oTwvdGg+PHRoIHN0eWxlPSJ3aWR0aDoyNiUiPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICB0b3AubWFwKGZ1bmN0aW9u',
  'KHIpewogICAgICAgICAgcmV0dXJuICc8dHIgb25jbGljaz0ib3BlblJvb20oXCcnICsgci5yb29tICsgJ1wnKSIgc3R5bGU9ImN1cnNvcjpwb2ludGVyIj4nICsKICAgICAgICAgICAgJzx0ZD48Yj4nICsgci5yb29tICsgJzwvYj4gPHNwYW4gY2xhc3M9ImZhaW50',
  'IGZzMTIiPuC4iuC4seC5ieC4mSAnICsgci5mbG9vciArICc8L3NwYW4+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgci5qb2JzICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChyLnJlcGFpciA/IG1v',
  'bmV5KHIucmVwYWlyKSA6ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAoci5hYyA/IG1vbmV5KHIuYWMpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChyLnB1cmNo',
  'YXNlID8gbW9uZXkoci5wdXJjaGFzZSkgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj48Yj4nICsgbW9uZXkoci50b3RhbCkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0iYmFyLXRyYWNr',
  'Ij48ZGl2IGNsYXNzPSJiYXItZmlsbCIgc3R5bGU9IndpZHRoOicgKyAoci50b3RhbC9tYXhDb3N0KjEwMCkgKyAnJSI+PC9kaXY+PC9kaXY+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgOiAn',
  'PGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC4l+C4teC5iOC4muC4seC4meC4l+C4tuC4geC5hOC4p+C5ieC4o+C4suC4ouC4q+C5ieC4reC4hzxkaXYgY2xhc3M9ImZzMTIgbXQ4',
  'Ij7guYPguKrguYggIuC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oiIg4LmD4LiZ4LiH4Liy4LiZ4LiL4LmI4Lit4LihL+C4peC5ieC4suC4h+C5geC4reC4o+C5jCDguKvguKPguLfguK3guKPguLDguJrguLjguKvguYnguK3guIfguYPguJnguKPguLLguKLg',
  'uIHguLLguKPguIvguLfguYnguK3guILguK3guIcg4LmB4Lil4LmJ4Lin4LiV4Lix4Lin4LmA4Lil4LiC4LiI4Liw4LiC4Li24LmJ4LiZ4LiX4Li14LmI4LiZ4Li14LmIPC9kaXY+PC9kaXY+JykpOwoKICAgIHZhciBiYWNrdXAgPSBjYXJkKCfwn5K+IOC4quC4s+C4',
  'o+C4reC4h+C5geC4peC4sOC4geC4ueC5ieC4hOC4t+C4meC4guC5ieC4reC4oeC4ueC4pScsCiAgICAgICc8cCBjbGFzcz0iZnMxMyBtdXRlZCI+4LiC4LmJ4Lit4Lih4Li54Lil4LiX4Lix4LmJ4LiH4Lir4Lih4LiU4Lit4Lii4Li54LmI4LmD4LiZ4Lij4Liw4Lia',
  '4Lia4LiZ4Li14LmJIOKAlCDguITguKfguKPguJTguLLguKfguJnguYzguYLguKvguKXguJTguKrguLPguKPguK3guIfguYTguKfguYnguYDguJTguLfguK3guJnguKXguLDguITguKPguLHguYnguIcgJyArCiAgICAgICfguYTguJ/guKXguYwgSlNPTiDguJnguLPg',
  'uIHguKXguLHguJrguYDguILguYnguLLguKPguLDguJrguJrguYTguJTguYkg4Liq4LmI4Lin4LiZIENTViDguYDguJvguLTguJTguYPguJkgRXhjZWwg4Lir4Lij4Li34LitIEdvb2dsZSBTaGVldHMg4LmE4LiU4LmJ4LmA4Lil4LiiPC9wPicgKwogICAgICAnPGRp',
  'diBjbGFzcz0icm93IG10MTIiPicgKwogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJkb0V4cG9ydEpzb24oKSI+4qyH77iPIOC4lOC4suC4p+C4meC5jOC5guC4q+C4peC4lOC4quC4s+C4o+C4reC4h+C4l+C4seC5ieC4h+C4q+C4oeC4',
  'lCAoSlNPTik8L2J1dHRvbj4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJkb0ltcG9ydEpzb24oKSI+4qyG77iPIOC4geC4ueC5ieC4hOC4t+C4meC4iOC4suC4geC5hOC4n+C4peC5jOC4quC4s+C4o+C4reC4hzwvYnV0dG9uPicgKwog',
  'ICAgICAnPC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIG1iOCI+4Liq4LmI4LiH4Lit4Lit4LiB4LmA4Lib4LmH4LiZIENTViDguYHguKLguIHguJXguLLguKPguLLguIc8L2Rpdj4n',
  'ICsKICAgICAgJzxkaXYgY2xhc3M9ImNoaXBzIj4nICsgZC5zaGVldHMubWFwKGZ1bmN0aW9uKG4pewogICAgICAgIHJldHVybiAnPGJ1dHRvbiBjbGFzcz0iY2hpcCIgb25jbGljaz0iZG9FeHBvcnRDc3YoXCcnICsgZXNjKG4pICsgJ1wnKSI+JyArIGVzYyhzaGVl',
  'dExhYmVsKG4pKSArICc8L2J1dHRvbj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nKTsKCiAgICB2YXIgc2hhcmUgPSAoY2FuRWRpdCgpICYmIGQubGlua3MgJiYgZC5saW5rcy52aWV3VXJsKSA/IGNhcmQoJ/CflJcg4Lil4Li04LiH4LiB4LmM4LmA4LiC',
  '4LmJ4Liy4LmD4LiK4LmJ4LiH4Liy4LiZJywKICAgICAgJzxkaXYgY2xhc3M9ImYgbWIxMiI+PGxhYmVsPvCflJEg4Lil4Li04LiH4LiB4LmM4LiC4Lit4LiH4LiE4Li44LiTICjguYHguIHguYnguYTguILguILguYnguK3guKHguLnguKXguYTguJTguYkg4oCUIOC4',
  'reC4ouC5iOC4suC4quC5iOC4h+C4leC5iOC4rSk8L2xhYmVsPicgKwogICAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgcmVhZG9ubHkgdmFsdWU9IicgKyBlc2MoZC5saW5rcy5hZG1pblVybCkgKyAnIiBvbmNsaWNrPSJ0aGlzLnNlbGVjdCgpIj48L2Rpdj4nICsK',
  'ICAgICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7wn5GAIOC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jCAo4LmA4Lib4Li04LiU4LiU4Li54LmE4LiU4LmJ4Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinIOKAlCDguKrguYjguIfguYPguKvguYnguYPguITg',
  'uKPguIHguYfguYTguJTguYkpPC9sYWJlbD4nICsKICAgICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJzaGFyZVVybCIgcmVhZG9ubHkgdmFsdWU9IicgKyBlc2MoZC5saW5rcy52aWV3VXJsKSArICciIG9uY2xpY2s9InRoaXMuc2VsZWN0KCkiPjwvZGl2Picg',
  'KwogICAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPicgKwogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJjb3B5U2hhcmUoKSI+8J+TiyDguITguLHguJTguKXguK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYw8L2J1dHRvbj4n',
  'ICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIGRnciIgb25jbGljaz0iZG9Sb3RhdGVTaGFyZSgpIj7wn5SBIOC4reC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC5g+C4q+C4oeC5iDwvYnV0dG9uPicgKwogICAgICAnPC9kaXY+JyArCiAgICAg',
  'ICc8cCBjbGFzcz0iZnMxMiBtdXRlZCBtdDEyIj7guITguJnguJfguLXguYjguYDguJvguLTguJTguKXguLTguIfguIHguYzguYHguIrguKPguYzguIjguLDguYDguKvguYfguJnguILguYnguK3guKHguLnguKXguJfguLHguYnguIfguKvguKHguJTguYHguJrguJrg',
  'uK3guYjguLLguJnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcgJyArCiAgICAgICfguYTguKHguYjguJXguYnguK3guIfguKHguLXguJrguLHguI3guIrguLUgR29vZ2xlIOC5geC4peC4sOC5hOC4oeC5iOC5gOC4q+C5h+C4mSBHb29nbGUgU2hlZXQg4LiC',
  '4Lit4LiH4LiE4Li44LiTIMK3ICcgKwogICAgICAn4LiW4LmJ4Liy4Lil4Li04LiH4LiB4LmM4Lir4Lil4Li44LiU4LmD4Lir4LmJ4LiB4LiUICLguK3guK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYzguYPguKvguKHguYgiIOC4peC4tOC4h+C4geC5jOC5',
  'gOC4lOC4tOC4oeC4iOC4sOC5g+C4iuC5ieC5hOC4oeC5iOC5hOC4lOC5ieC4l+C4seC4meC4l+C4tTwvcD4nKSA6ICcnOwoKICAgIHZhciBkcml2ZSA9IGNhbkVkaXQoKSA/IGNhcmQoJ+KYge+4jyDguKrguLPguKPguK3guIfguK3guLHguJXguYLguJnguKHguLHg',
  'uJXguLTguYPguJkgR29vZ2xlIERyaXZlICgnICsgZC5iYWNrdXBzLmxlbmd0aCArICcg4LiK4Li44LiUKScsCiAgICAgICc8cCBjbGFzcz0iZnMxMyBtdXRlZCI+4Lij4Liw4Lia4Lia4LmA4LiB4LmH4Lia4LmE4Lif4Lil4LmM4Liq4Liz4Lij4Lit4LiH4LmE4Lin',
  '4LmJ4LmD4LiZ4LmC4Lif4Lil4LmA4LiU4Lit4Lij4LmMICLguKrguLPguKPguK3guIfguILguYnguK3guKHguLnguKUiIOC4muC4meC5hOC4lOC4o+C4n+C5jOC4guC4reC4h+C4hOC4uOC4kyAnICsKICAgICAgJ+C4leC4seC5ieC4h+C5g+C4q+C5ieC4l+C4s+C4',
  'reC4seC4leC5guC4meC4oeC4seC4leC4tOC4l+C4uOC4geC4p+C4seC4meC5hOC4lOC5ieC4iOC4suC4geC5gOC4oeC4meC4ueC5g+C4meC4iuC4teC4lTwvcD4nICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBtdDEyIj48YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xp',
  'Y2s9ImRvQmFja3VwTm93KCkiPvCfkr4g4Liq4Liz4Lij4Lit4LiH4LmA4LiU4Li14LmL4Lii4Lin4LiZ4Li14LmJPC9idXR0b24+PC9kaXY+JyArCiAgICAgIChkLmJhY2t1cHMubGVuZ3RoID8gJzxkaXYgY2xhc3M9ImhyIj48L2Rpdj48ZGl2IGNsYXNzPSJ0dyI+',
  'PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOmF1dG8iPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guYTguJ/guKXguYw8L3RoPjx0aD7guYDguKfguKXguLI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guILguJnguLLguJQ8L3RoPjwvdHI+PC90aGVh',
  'ZD48dGJvZHk+JyArCiAgICAgICAgZC5iYWNrdXBzLnNsaWNlKDAsMTApLm1hcChmdW5jdGlvbihiKXsKICAgICAgICAgIHJldHVybiAnPHRyPjx0ZCBjbGFzcz0iZnMxMiI+PGEgaHJlZj0iJyArIGVzYyhiLnVybCkgKyAnIiB0YXJnZXQ9Il9ibGFuayI+JyArIGVz',
  'YyhiLm5hbWUpICsgJzwvYT48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKGIuYXQpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSBmczEyIj4nICsgTWF0aC5yb3VuZChiLnNpemUvMTAyNCkgKyAnIEtC',
  'PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicgOiAnJykpIDogJyc7CgogICAgcmV0dXJuIHVwY29taW5nICsgJzxkaXYgY2xhc3M9Im10MTIiPicgKyBjb3N0Q2FyZCArICc8L2Rpdj4nICsKICAgICAgICAg',
  'ICAoc2hhcmUgPyAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIHNoYXJlICsgJzwvZGl2PicgOiAnJykgKwogICAgICAgICAgICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgYmFja3VwICsgJzwvZGl2PicgKwogICAgICAgICAgIChkcml2ZSA/ICc8ZGl2IGNsYXNzPSJtdDEy',
  'Ij4nICsgZHJpdmUgKyAnPC9kaXY+JyA6ICcnKTsKICB9Cn07CgpmdW5jdGlvbiBzaGVldExhYmVsKG4pewogIHJldHVybiAoewogICAgRGVidHM6J+C4geC5ieC4reC4meC4q+C4meC4teC5iScsIERlYnRQYXltZW50czon4Lij4Liy4Lii4LiB4Liy4Lij4LiK4Liz',
  '4Lij4Liw4Lir4LiZ4Li14LmJJywgUHVyY2hhc2VzOifguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcnLCBSb29tczon4LiX4Liw4LmA4Lia4Li14Lii4LiZ4Lir4LmJ4Lit4LiHJywKICAgIEFjU2VydmljZTon4Lil4LmJ4Liy4LiH4LmB4Lit',
  '4Lij4LmMJywgUm9vbVJlcGFpcnM6J+C4i+C5iOC4reC4oeC5geC4i+C4oeC4q+C5ieC4reC4hycsIEJ1aWxkaW5nUmVwYWlyczon4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiBJywKICAgIFJvb21Bc3NldHM6J+C4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4',
  'meC4q+C5ieC4reC4hycsIEZpbmFuY2U6J+C4o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKInLCBTZXR0aW5nczon4LiV4Lix4LmJ4LiH4LiE4LmI4LiyJywgQWN0aXZpdHlMb2c6J+C4m+C4o+C4sOC4p+C4seC4leC4tOC4geC4suC4o+C5geC4',
  'geC5ieC5hOC4gicKICB9KVtuXSB8fCBuOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4LiV4Lix4Lin4LiK4LmI4Lin4Lii4Lin4Liy4LiU4LiL4LmJ4LizIOC5hgogICA9PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCmZ1bmN0aW9uIGtwaShsYWJlbCwgdmFsdWUsIGNhcCwgY2xzKXsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImtwaSAnICsgKGNsc3x8JycpICsgJyI+JyArCiAgICAn',
  'PGRpdiBjbGFzcz0ibGJsIj4nICsgZXNjKGxhYmVsKSArICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJ2YWwiPicgKyB2YWx1ZSArICc8L2Rpdj4nICsKICAgIChjYXAgPyAnPGRpdiBjbGFzcz0iY2FwIj4nICsgY2FwICsgJzwvZGl2PicgOiAnJykgKyAnPC9k',
  'aXY+JzsKfQoKZnVuY3Rpb24gY2FyZCh0aXRsZSwgYm9keSwgYWN0aW9ucywgZmx1c2gpewogIHJldHVybiAnPGRpdiBjbGFzcz0iY2FyZCI+JyArCiAgICAodGl0bGUgPyAnPGRpdiBjbGFzcz0iY2FyZC1oIj48aDM+JyArIHRpdGxlICsgJzwvaDM+JyArIChhY3Rp',
  'b25zID8gJzxkaXYgY2xhc3M9InNwIj4nICsgYWN0aW9ucyArICc8L2Rpdj4nIDogJycpICsgJzwvZGl2PicgOiAnJykgKwogICAgJzxkaXYgY2xhc3M9ImNhcmQtYicgKyAoZmx1c2ggPyAnIGZsdXNoJyA6ICcnKSArICciPicgKyBib2R5ICsgJzwvZGl2PjwvZGl2',
  'Pic7Cn0KCi8qKiDguKfguLLguJTguJzguLHguIfguKvguYnguK3guIfguYHguJrguYjguIfguJXguLLguKHguIrguLHguYnguJkg4oCUIGRlY29yYXRlKHJvb20pIC0+IHtjbHMsIHN1Yiwgb25jbGlja30gKi8KZnVuY3Rpb24gcm9vbUZsb29ycyhyb29tcywgZGVj',
  'b3JhdGUpewogIHZhciBieUZsb29yID0ge307CiAgcm9vbXMuZm9yRWFjaChmdW5jdGlvbihyKXsKICAgIHZhciBmID0gci5mbG9vciB8fCBOdW1iZXIoU3RyaW5nKHIucm9vbSkuY2hhckF0KDApKTsKICAgIChieUZsb29yW2ZdID0gYnlGbG9vcltmXSB8fCBbXSku',
  'cHVzaChyKTsKICB9KTsKICB2YXIgZmxvb3JzID0gT2JqZWN0LmtleXMoYnlGbG9vcikuc29ydCgpOwogIHJldHVybiAnPGRpdiBjbGFzcz0iZmxvb3JzIj4nICsgZmxvb3JzLm1hcChmdW5jdGlvbihmKXsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0iZmxvb3IiPjxk',
  'aXYgY2xhc3M9ImZsb29yLXRhZyI+PGI+JyArIGYgKyAnPC9iPuC4iuC4seC5ieC4mTwvZGl2PjxkaXYgY2xhc3M9InJvb21zIj4nICsKICAgICAgYnlGbG9vcltmXS5tYXAoZnVuY3Rpb24ocil7CiAgICAgICAgdmFyIGQgPSBkZWNvcmF0ZShyKTsKICAgICAgICBy',
  'ZXR1cm4gJzxkaXYgY2xhc3M9InJvb20gJyArIGQuY2xzICsgJyIgb25jbGljaz0iJyArIGQub25jbGljayArICciPicgKwogICAgICAgICAgJzxzcGFuIGNsYXNzPSJkb3QiPjwvc3Bhbj48ZGl2IGNsYXNzPSJubyI+JyArIGVzYyhyLnJvb20pICsgJzwvZGl2Picg',
  'KwogICAgICAgICAgJzxkaXYgY2xhc3M9InN0Ij4nICsgZC5zdWIgKyAnPC9kaXY+PC9kaXY+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+PC9kaXY+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwp9CgovKiog4LmD4Liq4LmIIG9iamVjdCDguKXguIfg',
  'uYPguJkgb25jbGljayBhdHRyaWJ1dGUg4LmE4LiU4LmJ4Lit4Lii4LmI4Liy4LiH4Lib4Lil4Lit4LiU4Lig4Lix4LiiICovCmZ1bmN0aW9uIGF0dHIob2JqKXsKICB2YXIgY2xlYW4gPSB7fTsKICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goZnVuY3Rpb24oayl7',
  'CiAgICBpZiAoay5pbmRleE9mKCdfJykgPT09IDAgfHwgL1JlZnMkLy50ZXN0KGspIHx8IGsgPT09ICdyZWNvcmRzJyB8fCBrID09PSAnd2FycmFudHknKSByZXR1cm47CiAgICBjbGVhbltrXSA9IG9ialtrXTsKICB9KTsKICByZXR1cm4gSlNPTi5zdHJpbmdpZnko',
  'Y2xlYW4pLnJlcGxhY2UoLyYvZywnJmFtcDsnKS5yZXBsYWNlKC8nL2csJyYjMzk7JykucmVwbGFjZSgvIi9nLCcmcXVvdDsnKTsKfQo8L3NjcmlwdD4KPHNjcmlwdD4KLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09CiAgIFNldHRpbmdzLmh0bWwg4oCUIOC4q+C4meC5ieC4suC4leC4seC5ieC4h+C4hOC5iOC4siDCtyDguJjguLXguKEgwrcg4Lia4Lix4LiN4LiK4Li14Lic4Li54LmJ4LmD4LiK4LmJIMK3IOC4reC4uOC4m+C4geC4o+C4k+C5jAogICA9PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4LiY4Li14Lih4Liq4Lin4LmI4Liy4LiHIC8g4Lih4Li34LiUIC0tLS0tLS0tLS0tLS0tLS0gKi8KCnZhciBMU19USEVNRSA9ICdtY29y',
  'bmVyLnRoZW1lJzsKdmFyIFRIRU1FUyA9IFsKICB7IGlkOiAn4LiV4Liy4Lih4LmA4LiE4Lij4Li34LmI4Lit4LiHJywgaWM6ICfwn4yXJywgaGludDogJ+C4quC4peC4seC4muC4leC4suC4oeC4geC4suC4o+C4leC4seC5ieC4h+C4hOC5iOC4suC4guC4reC4h+C4',
  'reC4uOC4m+C4geC4o+C4k+C5jCcgfSwKICB7IGlkOiAn4Liq4Lin4LmI4Liy4LiHJywgICAgICBpYzogJ+KYgO+4jycsIGhpbnQ6ICfguJ7guLfguYnguJnguILguLLguKcg4Lit4LmI4Liy4LiZ4LiH4LmI4Liy4Lii4LiB4Lil4Liy4LiH4LmB4LiU4LiUJyB9LAog',
  'IHsgaWQ6ICfguKHguLfguJQnLCAgICAgICAgaWM6ICfwn4yZJywgaGludDogJ+C4nuC4t+C5ieC4meC5gOC4guC5ieC4oSDguKrguJrguLLguKLguJXguLLguJXguK3guJnguIHguKXguLLguIfguITguLfguJknIH0KXTsKCi8qKgogKiDguJfguLLguJjguLXguKHg',
  'uKXguIfguKvguJnguYnguLLguYDguKfguYfguJrguJfguLHguJnguJfguLUKICog4LiV4Lix4Lin4LmB4Lib4Lij4Liq4Li14LiX4Lix4LmJ4LiH4Lir4Lih4LiU4LiZ4Li04Lii4Liy4Lih4LmE4Lin4LmJIDMg4LiK4Lix4LmJ4LiZ4LmD4LiZIFN0eWxlLmh0bWwg',
  '4LmB4Lil4LmJ4LinIOC4leC4o+C4h+C4meC4teC5ieC5geC4hOC5iOC4leC4tOC4lOC4m+C5ieC4suC4ouC4muC4reC4geC4p+C5iOC4suC5g+C4iuC5ieC4iuC4seC5ieC4meC5hOC4q+C4mQogKi8KZnVuY3Rpb24gYXBwbHlUaGVtZShuYW1lKXsKICB2YXIgcm9v',
  'dCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDsKICBpZiAobmFtZSA9PT0gJ+C4quC4p+C5iOC4suC4hycpIHJvb3Quc2V0QXR0cmlidXRlKCdkYXRhLXRoZW1lJywgJ2xpZ2h0Jyk7CiAgZWxzZSBpZiAobmFtZSA9PT0gJ+C4oeC4t+C4lCcpIHJvb3Quc2V0QXR0',
  'cmlidXRlKCdkYXRhLXRoZW1lJywgJ2RhcmsnKTsKICBlbHNlIHJvb3QucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXRoZW1lJyk7ICAgICAgIC8vIOC4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hyA9IOC4m+C4peC5iOC4reC4ouC5g+C4q+C5iSBwcmVmZXJzLWNv',
  'bG9yLXNjaGVtZSDguJXguLHguJTguKrguLTguJkKICB2YXIgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RoZW1lQnRuJyk7CiAgaWYgKGJ0bikgewogICAgdmFyIHQgPSBUSEVNRVMuZmlsdGVyKGZ1bmN0aW9uKHgpeyByZXR1cm4geC5pZCA9PT0gbmFt',
  'ZTsgfSlbMF0gfHwgVEhFTUVTWzBdOwogICAgYnRuLnRleHRDb250ZW50ID0gdC5pYzsKICAgIGJ0bi50aXRsZSA9ICfguJjguLXguKE6ICcgKyB0LmlkICsgJyAo4LiB4LiU4LmA4Lie4Li34LmI4Lit4Liq4Lil4Lix4LiaKSc7CiAgfQp9CgpmdW5jdGlvbiBjdXJy',
  'ZW50VGhlbWUoKXsKICByZXR1cm4gbHNHZXQoTFNfVEhFTUUpIHx8IChTLmJvb3QgJiYgUy5ib290LnNldHRpbmdzICYmIFMuYm9vdC5zZXR0aW5ncy50aGVtZSkgfHwgJ+C4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hyc7Cn0KCi8qKiDguJXguLHguYnguIfg',
  'uJjguLXguKHguYHguKXguLDguIjguLPguYTguKfguYkg4oCUIOC4nOC4ueC5ieC4lOC4ueC5geC4peC4iOC4sOC4luC4ueC4geC4muC4seC4meC4l+C4tuC4geC5gOC4m+C5h+C4meC4hOC5iOC4suC4leC4seC5ieC4h+C4leC5ieC4meC4guC4reC4h+C4o+C4sOC4',
  'muC4muC4lOC5ieC4p+C4oiAqLwpmdW5jdGlvbiBzZXRUaGVtZShuYW1lLCBxdWlldCl7CiAgbHNTZXQoTFNfVEhFTUUsIG5hbWUpOwogIGFwcGx5VGhlbWUobmFtZSk7CiAgaWYgKFMuYm9vdCAmJiBTLmJvb3QuaXNBZG1pbikgewogICAgY2FsbEFwaSgnc2V0dGlu',
  'Z3Muc2F2ZScsIHsgdmFsdWVzOiB7IHRoZW1lOiBuYW1lIH0gfSkuY2F0Y2goZnVuY3Rpb24oKXsgLyog4LmA4LiB4LmH4Lia4LmD4LiZ4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiB4LmH4Lie4LitICovIH0pOwogIH0KICBpZiAoIXF1aWV0KSB0b2FzdCgn4LmA4Lib',
  '4Lil4Li14LmI4Lii4LiZ4LmA4Lib4LmH4LiZ4LiY4Li14LihJyArIChuYW1lID09PSAn4LiV4Liy4Lih4LmA4LiE4Lij4Li34LmI4Lit4LiHJyA/ICfguJXguLLguKHguYDguITguKPguLfguYjguK3guIcnIDogbmFtZSksICdvaycpOwogIGlmIChTLnBhZ2UgPT09',
  'ICdzZXR0aW5ncycpIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKfQoKLyoqIOC4m+C4uOC5iOC4oeC4muC4meC5geC4luC4muC4q+C4seC4pyDigJQg4Lin4LiZ4Liq4Lin4LmI4Liy4LiHIOKGkiDguKHguLfguJQg4oaSIOC4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4',
  'reC4hyAqLwpmdW5jdGlvbiBjeWNsZVRoZW1lKCl7CiAgdmFyIG9yZGVyID0gWyfguKrguKfguYjguLLguIcnLCAn4Lih4Li34LiUJywgJ+C4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hyddOwogIHZhciBpID0gb3JkZXIuaW5kZXhPZihjdXJyZW50VGhlbWUo',
  'KSk7CiAgc2V0VGhlbWUob3JkZXJbKGkgKyAxKSAlIG9yZGVyLmxlbmd0aF0pOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4q+C4meC5ieC4suC4leC4seC5ieC4h+C4hOC5iOC4siAtLS0tLS0tLS0tLS0tLS0tICovCgpST1VURVMuc2V0dGluZ3MgPSB7CiAgbG9h',
  'ZDogZnVuY3Rpb24oKXsKICAgIHJldHVybiBQcm9taXNlLmFsbChbCiAgICAgIGNhbGxBcGkoJ3NldHRpbmdzLmxpc3QnLCB7fSksCiAgICAgIGNhbGxBcGkoJ2F1dGguZGV2aWNlcycsIHt9KS5jYXRjaChmdW5jdGlvbigpeyByZXR1cm4gW107IH0pLAogICAgICAo',
  'Uy5ib290ICYmIFMuYm9vdC5pc0FkbWluKSA/IGNhbGxBcGkoJ3VzZXIubGlzdCcsIHt9KS5jYXRjaChmdW5jdGlvbigpeyByZXR1cm4gW107IH0pIDogUHJvbWlzZS5yZXNvbHZlKG51bGwpLAogICAgICAoUy5ib290ICYmIFMuYm9vdC5pc0FkbWluKSA/IGNhbGxB',
  'cGkoJ3NoYXJlLmxpbmtzJywge30pLmNhdGNoKGZ1bmN0aW9uKCl7IHJldHVybiB7fTsgfSkgOiBQcm9taXNlLnJlc29sdmUoe30pCiAgICBdKS50aGVuKGZ1bmN0aW9uKHIpewogICAgICByZXR1cm4geyBzZXR0aW5nczogclswXSwgZGV2aWNlczogclsxXSB8fCBb',
  'XSwgdXNlcnM6IHJbMl0sIGxpbmtzOiByWzNdIHx8IHt9LCB5ZWFyczogW10gfTsKICAgIH0pOwogIH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHJldHVybiAnJyArCiAgICAgIHNldHRpbmdzQWNjb3VudENhcmQoZCkgKwogICAgICBzZXR0aW5nc1RoZW1l',
  'Q2FyZCgpICsKICAgICAgKGQuc2V0dGluZ3MuY2FuRWRpdCA/IHNldHRpbmdzR3JvdXBzSHRtbChkLnNldHRpbmdzKSA6IHNldHRpbmdzUmVhZE9ubHlOb3RlKCkpICsKICAgICAgLy8g4LmA4LiJ4Lie4Liy4Liw4Lic4Li54LmJ4LiU4Li54LmB4Lil4LiX4Li14LmI',
  '4LmA4Lir4LmH4LiZ4Liq4Lit4LiH4Liq4LmI4Lin4LiZ4LiZ4Li14LmJIOKAlCDguJXguLHguKfguIHguLLguKPguYzguJTguYDguJvguYfguJnguITguJnguJXguLHguJTguKrguLTguJnguYPguIjguYDguK3guIfguKfguYjguLLguIjguLDguYHguKrguJTguIfg',
  'uK3guLDguYTguKMKICAgICAgLy8g4LmA4Lie4Lij4Liy4Liw4Lir4LiZ4LmJ4Liy4LiV4Lix4Lin4Lit4Lii4LmI4Liy4LiH4LmB4Lia4Lia4LmE4Lif4Lil4LmM4LmA4LiU4Li14Lii4Lin4LmE4Lih4LmI4Lih4Li14Lia4Lix4LiN4LiK4Li14Lic4Li54LmJ4LmD',
  '4LiK4LmJ4LmD4Lir4LmJ4LmB4Liq4LiU4LiHIOC5geC4leC5iOC4ouC4seC4h+C4reC4ouC4suC4geC4muC4reC4geC4nOC4ueC5ieC5g+C4iuC5ieC4p+C5iOC4suC4oeC4teC4reC4sOC5hOC4o+C4muC5ieC4suC4hwogICAgICAoaXNBZG1pbk5vdygpID8gc2V0',
  'dGluZ3NVc2Vyc0NhcmQoZC51c2VycykgKyBzZXR0aW5nc1NoYXJlQ2FyZChkLmxpbmtzKSA6ICcnKTsKICB9Cn07CgovKiAtLS0tIOC4muC4seC4jeC4iuC4teC4guC4reC4h+C4ieC4seC4mSAtLS0tICovCgpmdW5jdGlvbiBzZXR0aW5nc0FjY291bnRDYXJkKGQp',
  'ewogIHZhciBtZSA9IEFVVEgubWUgfHwge307CiAgdmFyIGRldmljZXMgPSBkLmRldmljZXMgfHwgW107CiAgcmV0dXJuIGNhcmQoJ/CfkaQg4Lia4Lix4LiN4LiK4Li14LiC4Lit4LiH4LiJ4Lix4LiZJywKICAgICc8ZGl2IGNsYXNzPSJncmlkIGcyIG1iMTIiPicg',
  'KwogICAgICBrcGkoJ+C5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4meC5g+C4meC4iuC4t+C5iOC4rScsIGVzYyhtZS5uYW1lIHx8IG1lLnVzZXJuYW1lIHx8ICfigJMnKSwgZXNjKG1lLnVzZXJuYW1lID8gJ0AnICsgbWUudXNlcm5hbWUgOiAobWUudmlhIHx8',
  'ICcnKSkpICsKICAgICAga3BpKCfguKrguLTguJfguJjguLTguYzguIHguLLguKPguYPguIrguYnguIfguLLguJknLCBlc2MobWUucm9sZSB8fCAn4oCTJyksCiAgICAgICAgICBtZS5jYW5FZGl0ID8gJ+C5gOC4nuC4tOC5iOC4oSDguYHguIHguYnguYTguIIg4LmB',
  '4Lil4Liw4Lil4Lia4LiC4LmJ4Lit4Lih4Li54Lil4LmE4LiU4LmJJyA6ICfguYDguJvguLTguJTguJTguLnguYTguJTguYnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcnKSArCiAgICAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0icm93Ij4nICsKICAg',
  'ICAgKG1lLnVzZXJuYW1lID8gJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iZm9ybUNoYW5nZVBhc3N3b3JkKCkiPvCflJEg4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZPC9idXR0b24+JyA6ICcnKSArCiAgICAgIChtZS51',
  'c2VybmFtZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImZvcm1TZXRQaW4oKSI+8J+UoiAnICsKICAgICAgICAoQVVUSC5kZXZpY2UgPyAn4LiV4Lix4LmJ4LiHIFBJTiDguYPguKvguKHguYjguJrguJnguYDguITguKPguLfguYjguK3guIfguJnguLXg',
  'uYknIDogJ+C4leC4seC5ieC4hyBQSU4g4Liq4Liz4Lir4Lij4Lix4Lia4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJJykgKyAnPC9idXR0b24+JyA6ICcnKSArCiAgICAgIChBVVRILmRldmljZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4gZGdyIiBvbmNsaWNr',
  'PSJmb3JnZXRUaGlzRGV2aWNlKCkiPuC4peC4miBQSU4g4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJPC9idXR0b24+JyA6ICcnKSArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNvbmZpcm1Mb2dvdXQoKSI+8J+aqiDguK3guK3guIHg',
  'uIjguLLguIHguKPguLDguJrguJo8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nICsKICAgIChkZXZpY2VzLmxlbmd0aAogICAgICA/ICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+PGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtYjgiPuC4reC4uOC4m+C4geC4o+C4k+C5jOC4',
  'l+C4teC5iOC4leC4seC5ieC4hyBQSU4g4LmE4Lin4LmJICgnICsgZGV2aWNlcy5sZW5ndGggKyAnKTwvZGl2PicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOmF1dG8iPjx0aGVhZD48dHI+JyArCiAg',
  'ICAgICAgJzx0aD7guK3guLjguJvguIHguKPguJPguYw8L3RoPjx0aD7guJXguLHguYnguIfguYDguKHguLfguYjguK08L3RoPjx0aD7guYPguIrguYnguKXguYjguLLguKrguLjguJQ8L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgZGV2aWNlcy5t',
  'YXAoZnVuY3Rpb24oeCl7CiAgICAgICAgICByZXR1cm4gJzx0cj48dGQ+JyArIGVzYyh4LmRldmljZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIHRoRGF0ZVNob3J0KFN0cmluZyh4LmNyZWF0ZWRBdCkuc2xpY2UoMCwxMCkp',
  'ICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyB0aERhdGVTaG9ydChTdHJpbmcoeC5sYXN0U2Vlbikuc2xpY2UoMCwxMCkpICsgJzwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rp',
  'dj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPjxidXR0b24gY2xhc3M9ImJ0biBkZ3Igc20iIG9uY2xpY2s9ImRvRm9yZ2V0QWxsRGV2aWNlcygpIj7guKLguIHguYDguKXguLTguIEgUElOIOC4l+C4uOC4geC5gOC4hOC4o+C4t+C5iOC4reC4hzwv',
  'YnV0dG9uPjwvZGl2PicKICAgICAgOiAnJykpOwp9CgpmdW5jdGlvbiBkb0ZvcmdldEFsbERldmljZXMoKXsKICBjb25maXJtQWN0aW9uKCfguKLguIHguYDguKXguLTguIEgUElOIOC4muC4meC4l+C4uOC4geC5gOC4hOC4o+C4t+C5iOC4reC4h+C5g+C4iuC5iOC5',
  'hOC4q+C4oSDigJQg4LiX4Li44LiB4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiI4Liw4LiV4LmJ4Lit4LiH4Lil4LmH4Lit4LiB4Lit4Li04LiZ4LiU4LmJ4Lin4Lii4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmIJywgZnVuY3Rpb24oKXsKICAgIGNh',
  'bGxBcGkoJ2F1dGguZm9yZ2V0QWxsRGV2aWNlcycsIHt9KS50aGVuKGZ1bmN0aW9uKG4pewogICAgICBzYXZlRGV2aWNlKCcnKTsKICAgICAgdG9hc3QoJ+C4ouC4geC5gOC4peC4tOC4gSBQSU4g4LmB4Lil4LmJ4LinICcgKyBuICsgJyDguYDguITguKPguLfguYjg',
  'uK3guIcnLCAnb2snKTsKICAgICAgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7IH0pOwogIH0pOwp9CgovKiAtLS0tIOC4mOC4teC4oSAtLS0tICovCgpmdW5jdGlvbiBz',
  'ZXR0aW5nc1RoZW1lQ2FyZCgpewogIHZhciBjdXIgPSBjdXJyZW50VGhlbWUoKTsKICByZXR1cm4gY2FyZCgn8J+OqCDguJjguLXguKHguKrguLXguKvguJnguYnguLLguIjguK0nLAogICAgJzxkaXYgY2xhc3M9InRoZW1lLXBpY2siPicgKyBUSEVNRVMubWFwKGZ1',
  'bmN0aW9uKHQpewogICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9InRoZW1lLW9wdCcgKyAodC5pZCA9PT0gY3VyID8gJyBvbicgOiAnJykgKyAnIiBvbmNsaWNrPSJzZXRUaGVtZShcJycgKyB0LmlkICsgJ1wnKSI+JyArCiAgICAgICAgJzxzcGFuIGNsYXNzPSJp',
  'YyI+JyArIHQuaWMgKyAnPC9zcGFuPicgKwogICAgICAgICc8Yj4nICsgZXNjKHQuaWQpICsgJzwvYj4nICsKICAgICAgICAnPHNwYW4gY2xhc3M9ImhpbnQiPicgKyBlc2ModC5oaW50KSArICc8L3NwYW4+JyArCiAgICAgICc8L2J1dHRvbj4nOwogICAgfSkuam9p',
  'bignJykgKyAnPC9kaXY+JyArCiAgICAnPHAgY2xhc3M9ImZzMTIgbXV0ZWQgbXQxMiI+4LiY4Li14Lih4LiI4Liz4LmB4Lii4LiB4Lij4Liy4Lii4LmA4LiE4Lij4Li34LmI4Lit4LiHIOC5gOC4m+C4peC4teC5iOC4ouC4meC4l+C4teC5iOC4meC4teC5iOC4q+C4',
  'o+C4t+C4reC4geC4lOC4m+C4uOC5iOC4oeC4o+C4ueC4m+C4nuC4o+C4sOC4reC4suC4l+C4tOC4leC4ouC5jC/guJ7guKPguLDguIjguLHguJnguJfguKPguYzguKHguLjguKHguILguKfguLLguJrguJnguIHguYfguYTguJTguYknICsKICAgIChTLmJvb3QgJiYg',
  'Uy5ib290LmlzQWRtaW4gPyAnIMK3IOC4hOC5iOC4suC4l+C4teC5iOC4nOC4ueC5ieC4lOC4ueC5geC4peC5gOC4peC4t+C4reC4geC4iOC4sOC5gOC4m+C5h+C4meC4hOC5iOC4suC4leC4seC5ieC4h+C4leC5ieC4meC5g+C4q+C5ieC5gOC4hOC4o+C4t+C5iOC4',
  'reC4h+C4l+C4teC5iOC4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4leC4seC5ieC4hycgOiAnJykgKyAnPC9wPicpOwp9CgovKiAtLS0tIOC4geC4peC4uOC5iOC4oeC4hOC5iOC4suC4leC4seC5ieC4h+C4hOC5iOC4siAtLS0tICovCgpmdW5jdGlvbiBzZXR0',
  'aW5nc1JlYWRPbmx5Tm90ZSgpewogIHJldHVybiBjYXJkKCfimpnvuI8g4LiB4Liy4Lij4LiV4Lix4LmJ4LiH4LiE4LmI4Liy4Lij4Liw4Lia4LiaJywKICAgICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj7wn5SSPC9kaXY+4LmA4LiJ4Lie4Liy',
  '4Liw4Lic4Li54LmJ4LiU4Li54LmB4Lil4LmA4LiX4LmI4Liy4LiZ4Lix4LmJ4LiZ4LiX4Li14LmI4LmB4LiB4LmJ4LiB4Liy4Lij4LiV4Lix4LmJ4LiH4LiE4LmI4Liy4Lij4Liw4Lia4Lia4LmE4LiU4LmJPC9kaXY+Jyk7Cn0KCmZ1bmN0aW9uIHNldHRpbmdzR3Jv',
  'dXBzSHRtbChzKXsKICByZXR1cm4gcy5ncm91cHMubWFwKGZ1bmN0aW9uKGcpewogICAgcmV0dXJuIGNhcmQoZy5pY29uICsgJyAnICsgZy5ncm91cCwKICAgICAgJzxkaXYgY2xhc3M9ImZncmlkIj4nICsgZy5pdGVtcy5tYXAoc2V0dGluZ0ZpZWxkSHRtbCkuam9p',
  'bignJykgKyAnPC9kaXY+Jyk7CiAgfSkuam9pbignJykgKwogIGNhcmQoJ/Cfkr4g4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4LiV4Lix4LmJ4LiH4LiE4LmI4LiyJywKICAgICc8cCBjbGFzcz0iZnMxMyBtdXRlZCI+JyArIGVzYyhzLnNlY3JldE5vdGUpICsg',
  'JzwvcD4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJzYXZlU2V0dGluZ3NGb3JtKCkiPuC4muC4seC4meC4l+C4tuC4geC4l+C4seC5ieC4h+C4q+C4oeC4lDwvYnV0dG9uPicg',
  'KwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJsb2FkKCkiPuC4ouC4geC5gOC4peC4tOC4geC4geC4suC4o+C5geC4geC5ieC5hOC4gjwvYnV0dG9uPicgKwogICAgJzwvZGl2PicpOwp9CgpmdW5jdGlvbiBzZXR0aW5nRmllbGRIdG1sKGl0KXsK',
  'ICB2YXIgaWQgPSAnc18nICsgaXQua2V5OwogIHZhciBpbm5lcjsKICBpZiAoaXQucmVhZE9ubHkpIHsKICAgIGlubmVyID0gJzxkaXYgY2xhc3M9ImlucCIgc3R5bGU9ImJhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKTtjdXJzb3I6ZGVmYXVsdCI+JyArIGVzYyhp',
  'dC52YWx1ZSkgKyAnPC9kaXY+JzsKICB9IGVsc2UgaWYgKGl0LnR5cGUgPT09ICdzZWxlY3QnKSB7CiAgICAvLyDguJ3guLHguYjguIfguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYzguKrguYjguIfguKHguLLguYDguJvguYfguJkge3ZhbHVlLGxhYmVs',
  'fSDguYDguKrguKHguK0g4oCUIOC4hOC5iOC4suC4l+C4teC5iOC5gOC4geC5h+C4muC4geC4seC4muC4guC5ieC4reC4hOC4p+C4suC4oeC4l+C4teC5iOC5gOC4q+C5h+C4meC4reC4suC4iOC4hOC4meC4peC4sOC4reC4seC4mQogICAgaW5uZXIgPSAnPHNlbGVj',
  'dCBjbGFzcz0ic2VsIiBpZD0iJyArIGlkICsgJyI+JyArIChpdC5vcHRpb25zIHx8IFtdKS5tYXAoZnVuY3Rpb24obyl7CiAgICAgIHJldHVybiAnPG9wdGlvbiB2YWx1ZT0iJyArIGVzYyhvLnZhbHVlKSArICciJyArIChvLnZhbHVlID09PSBpdC52YWx1ZSA/ICcg',
  'c2VsZWN0ZWQnIDogJycpICsKICAgICAgICAgICAgICc+JyArIGVzYyhvLmxhYmVsKSArICc8L29wdGlvbj4nOwogICAgfSkuam9pbignJykgKyAnPC9zZWxlY3Q+JzsKICB9IGVsc2UgaWYgKGl0LnR5cGUgPT09ICdtdWx0aWxpbmUnKSB7CiAgICBpbm5lciA9ICc8',
  'dGV4dGFyZWEgY2xhc3M9InRhIiBpZD0iJyArIGlkICsgJyI+JyArIGVzYyhpdC52YWx1ZSkgKyAnPC90ZXh0YXJlYT4nOwogIH0gZWxzZSBpZiAoaXQudHlwZSA9PT0gJ251bWJlcicpIHsKICAgIGlubmVyID0gJzxpbnB1dCB0eXBlPSJudW1iZXIiIGNsYXNzPSJp',
  'bnAiIGlkPSInICsgaWQgKyAnIiB2YWx1ZT0iJyArIGVzYyhpdC52YWx1ZSkgKyAnIiBpbnB1dG1vZGU9ImRlY2ltYWwiPic7CiAgfSBlbHNlIHsKICAgIGlubmVyID0gJzxpbnB1dCB0eXBlPSJ0ZXh0IiBjbGFzcz0iaW5wIiBpZD0iJyArIGlkICsgJyIgdmFsdWU9',
  'IicgKyBlc2MoaXQudmFsdWUpICsgJyI+JzsKICB9CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJmJyArIChpdC50eXBlID09PSAnbXVsdGlsaW5lJyA/ICcgZnVsbCcgOiAnJykgKyAnIj4nICsKICAgICc8bGFiZWwgZm9yPSInICsgaWQgKyAnIj4nICsgZXNjKGl0Lmxh',
  'YmVsKSArICc8L2xhYmVsPicgKyBpbm5lciArCiAgICAoaXQubm90ZSA/ICc8ZGl2IGNsYXNzPSJoaW50Ij4nICsgZXNjKGl0Lm5vdGUpICsgJzwvZGl2PicgOiAnJykgKyAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gc2F2ZVNldHRpbmdzRm9ybSgpewogIHZhciB2YWxz',
  'ID0ge307CiAgdmFyIGRhdGEgPSBTLmNhY2hlLnNldHRpbmdzOwogIGlmICghZGF0YSkgcmV0dXJuOwogIGRhdGEuc2V0dGluZ3MuZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24oZyl7CiAgICBnLml0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXQpewogICAgICBpZiAoaXQu',
  'cmVhZE9ubHkpIHJldHVybjsKICAgICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NfJyArIGl0LmtleSk7CiAgICAgIGlmIChlbCkgdmFsc1tpdC5rZXldID0gZWwudmFsdWU7CiAgICB9KTsKICB9KTsKICBjYWxsQXBpKCdzZXR0aW5ncy5zYXZl',
  'JywgeyB2YWx1ZXM6IHZhbHMgfSkudGhlbihmdW5jdGlvbihyKXsKICAgIGlmICh2YWxzLnRoZW1lKSB7IGxzU2V0KExTX1RIRU1FLCB2YWxzLnRoZW1lKTsgYXBwbHlUaGVtZSh2YWxzLnRoZW1lKTsgfQogICAgdG9hc3Qoci5zYXZlZCA/ICfguJrguLHguJnguJfg',
  'uLbguIHguYHguKXguYnguKcgJyArIHIuc2F2ZWQgKyAnIOC4o+C4suC4ouC4geC4suC4oycgOiAn4LmE4Lih4LmI4Lih4Li14Lit4Liw4LmE4Lij4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LmB4Lib4Lil4LiHJywgJ29rJyk7CiAgICAvLyDguITguYjguLLguJrguLLg',
  'uIfguJXguLHguKcgKOC4o+C4reC4muC4o+C4teC5gOC4n+C4o+C4iiDguIrguLfguYjguK3guK3guLLguITguLLguKMpIOC4oeC4teC4nOC4peC4geC4seC4muC4l+C4seC5ieC4h+C4q+C4meC5ieC4siDguIjguLbguIfguYLguKvguKXguJTguYPguKvguKHguYjg',
  'uJfguLHguYnguIfguIrguLjguJQKICAgIHJldHVybiBjYWxsQXBpKCdhcHAuYm9vdHN0cmFwJykudGhlbihmdW5jdGlvbihiKXsgUy5ib290ID0gYjsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9KTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNz',
  'YWdlIHx8IGUsICdlcnInKTsgfSk7Cn0KCi8qIC0tLS0g4LiI4Lix4LiU4LiB4Liy4Lij4Lic4Li54LmJ4LmD4LiK4LmJICjguJzguLnguYnguJTguLnguYHguKXguYDguJfguYjguLLguJnguLHguYnguJkpIC0tLS0gKi8KCmZ1bmN0aW9uIGlzQWRtaW5Ob3coKXsK',
  'ICByZXR1cm4gISEoUy5ib290ICYmIFMuYm9vdC5pc0FkbWluKTsKfQoKZnVuY3Rpb24gc2V0dGluZ3NVc2Vyc0NhcmQodXNlcnMpewogIGlmICghdXNlcnMpIHJldHVybiAnJzsKICByZXR1cm4gY2FyZCgn8J+RpSDguJzguLnguYnguYPguIrguYnguYPguJnguKPg',
  'uLDguJrguJogKCcgKyB1c2Vycy5sZW5ndGggKyAnKScsCiAgICAnPHAgY2xhc3M9ImZzMTMgbXV0ZWQiPuC5geC4iOC4geC4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5ieC5geC4peC4sOC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C5ieC4hOC4meC4',
  'reC4t+C5iOC4meC5gOC4guC5ieC4suC4oeC4suC4lOC4ueC4q+C4o+C4t+C4reC4iuC5iOC4p+C4ouC5geC4geC5ieC4guC5ieC4reC4oeC4ueC4peC5hOC4lOC5iSAnICsKICAgICfguJXguLHguYnguIfguKrguLTguJfguJjguLTguYzguYHguKLguIHguKPguLLg',
  'uKLguITguJkg4LmB4Lil4Liw4Lij4Liw4LiH4Lix4Lia4LmE4LiU4LmJ4LiX4Li44LiB4LmA4Lih4Li34LmI4LitPC9wPicgKwogICAgJzxkaXYgY2xhc3M9InR3IG10MTIiPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsKICAgICAgJzx0aD7guIrguLfg',
  'uYjguK3guJzguLnguYnguYPguIrguYk8L3RoPjx0aD7guIrguLfguYjguK3guJfguLXguYjguYHguKrguJTguIc8L3RoPjx0aD7guKrguLTguJfguJjguLTguYw8L3RoPjx0aD7guKrguJbguLLguJnguLA8L3RoPjx0aD7guYDguILguYnguLLguKXguYjguLLguKrg',
  'uLjguJQ8L3RoPicgKwogICAgICAnPHRoIGNsYXNzPSJudW0iPuC4reC4uOC4m+C4geC4o+C4k+C5jDwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgIHVzZXJzLm1hcChmdW5jdGlvbih1KXsKICAgICAgdmFyIG1lTm93ID0gKEFVVEgubWUg',
  'JiYgQVVUSC5tZS51c2VybmFtZSkgPT09IHUudXNlcm5hbWU7CiAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICc8dGQ+PGI+JyArIGVzYyh1LnVzZXJuYW1lKSArICc8L2I+JyArIChtZU5vdyA/ICcgPHNwYW4gY2xhc3M9ImIgaW5mbyI+4LiE4Li44LiTPC9z',
  'cGFuPicgOiAnJykgKyAnPC90ZD4nICsKICAgICAgICAnPHRkPicgKyBlc2ModS5uYW1lIHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICc8dGQ+JyArIHJvbGVCYWRnZSh1LnJvbGUpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZD4nICsgc3RhdHVzQmFkZ2Uo',
  'dS5zdGF0dXMpICsgKHUubG9ja2VkID8gJyA8c3BhbiBjbGFzcz0iYiBkZ3IiPuC4luC4ueC4geC4peC5h+C4reC4geC4iuC4seC5iOC4p+C4hOC4o+C4suC4pzwvc3Bhbj4nIDogJycpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArICh1',
  'Lmxhc3RMb2dpbiA/IHRoRGF0ZVNob3J0KFN0cmluZyh1Lmxhc3RMb2dpbikuc2xpY2UoMCwxMCkpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHUuZGV2aWNlcyB8fCAwKSArICc8L3RkPicgKwogICAgICAgICc8dGQg',
  'Y2xhc3M9InQtYWN0aW9ucyI+JyArCiAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJmb3JtVXNlcignICsgYXR0cih1KSArICcpIj7guYHguIHguYnguYTguII8L2J1dHRvbj4nICsKICAgICAgICAgIChtZU5vdyA/ICcnIDogJzxidXR0',
  'b24gY2xhc3M9ImJ0biBzbSBkZ3IiIG9uY2xpY2s9ImRlbFVzZXIoXCcnICsgZXNjKHUudXNlcm5hbWUpICsgJ1wnKSI+4Lil4LiaPC9idXR0b24+JykgKwogICAgICAgICc8L3RkPjwvdHI+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rp',
  'dj4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgc20iIG9uY2xpY2s9ImZvcm1Vc2VyKCkiPisg4LmA4Lie4Li04LmI4Lih4Lic4Li54LmJ4LmD4LiK4LmJPC9idXR0b24+Jyk7Cn0KCmZ1bmN0aW9uIHJvbGVCYWRnZShyb2xlKXsKICB2YXIgY2xzID0gcm9s',
  'ZSA9PT0gJ+C4nOC4ueC5ieC4lOC4ueC5geC4pScgPyAnb2snIDogKHJvbGUgPT09ICfguYHguIHguYnguYTguILguYTguJTguYknID8gJ2luZm8nIDogJ211dGUnKTsKICByZXR1cm4gJzxzcGFuIGNsYXNzPSJiICcgKyBjbHMgKyAnIj4nICsgZXNjKHJvbGUpICsg',
  'Jzwvc3Bhbj4nOwp9CgovLyDguKvguKHguLLguKLguYDguKvguJXguLg6IOC5g+C4iuC5iSBhdHRyKCkg4LiV4Lix4Lin4LmA4LiU4Li14Lii4Lin4LiB4Lix4Lia4LiX4Li14LmIIFZpZXdzLmh0bWwg4Lib4Lij4Liw4LiB4Liy4Lio4LmE4Lin4LmJCi8vIOC5gOC4',
  'hOC4ouC4m+C4o+C4sOC4geC4suC4qOC4iuC4t+C5iOC4reC4i+C5ieC4s+C5hOC4p+C5ieC4leC4o+C4h+C4meC4teC5ieC4hOC4o+C4seC5ieC4h+C4q+C4meC4tuC5iOC4hyDguYHguKXguYnguKfguYTguJvguJfguLHguJrguILguK3guIfguYDguJTguLTguKHg',
  'uIjguJnguJvguLjguYjguKHguYHguIHguYnguYTguILguJfguLHguYnguIfguKPguLDguJrguJrguJ7guLHguIcKLy8gKOC4n+C4reC4o+C5jOC4oeC4guC4tuC5ieC4meC4p+C5iOC4suC4hyDguYHguKXguLDguIHguJTguJrguLHguJnguJfguLbguIHguIHguKXg',
  'uLLguKLguYDguJvguYfguJnguKrguKPguYnguLLguIfguKPguLLguKLguIHguLLguKPguYPguKvguKHguYjguYHguJfguJnguIHguLLguKPguYHguIHguYnguILguK3guIfguYDguJTguLTguKEpCgpmdW5jdGlvbiBmb3JtVXNlcihqc29uKXsKICB2YXIgdSA9IGpz',
  'b24gPyAodHlwZW9mIGpzb24gPT09ICdzdHJpbmcnID8gSlNPTi5wYXJzZShqc29uKSA6IGpzb24pIDoge307CiAgdmFyIGlzTmV3ID0gIXUudXNlcm5hbWU7CgogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiBpc05ldyA/ICfguYDguJ7guLTguYjguKHguJzguLnguYng',
  'uYPguIrguYnguYPguKvguKHguYgnIDogJ+C5geC4geC5ieC5hOC4guC4nOC4ueC5ieC5g+C4iuC5iSAnICsgdS51c2VybmFtZSwKICAgIGFjdGlvbjogJ3VzZXIuc2F2ZScsCiAgICByZWNvcmQ6IE9iamVjdC5hc3NpZ24oeyBpZDogaXNOZXcgPyAnJyA6IHUudXNl',
  'cm5hbWUsIHJvbGU6ICfguJTguLnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcnLCBzdGF0dXM6ICfguYPguIrguYnguIfguLLguJknIH0sIHUpLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oid1c2VybmFtZScsIGxhYmVsOifguIrguLfguYjguK3guJzg',
  'uLnguYnguYPguIrguYkgKOC4oOC4suC4qeC4suC4reC4seC4h+C4geC4pOC4qSknLCByZXF1aXJlZDppc05ldywgcGg6J+C5gOC4iuC5iOC4mSBzb21jaGFpJywKICAgICAgICBoaW50OiBpc05ldyA/ICdhLXogMC05IC4gXyAtIOC4ouC4suC4pyAz4oCTMjQg4LiV',
  '4Lix4LinIMK3IOC5gOC4m+C4peC4teC5iOC4ouC4meC4oOC4suC4ouC4q+C4peC4seC4h+C5hOC4oeC5iOC5hOC4lOC5iScgOiAn4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmE4Lih4LmI4LmE4LiU4LmJJyB9LAog',
  'ICAgICB7IGtleTonbmFtZScsIGxhYmVsOifguIrguLfguYjguK3guJfguLXguYjguYHguKrguJTguIcnLCByZXF1aXJlZDp0cnVlLCBwaDon4LmA4LiK4LmI4LiZIOC4quC4oeC4iuC4suC4oicgfSwKICAgICAgeyBrZXk6J3JvbGUnLCBsYWJlbDon4Liq4Li04LiX',
  '4LiY4Li04LmM4LiB4Liy4Lij4LmD4LiK4LmJ4LiH4Liy4LiZJywgdHlwZTonc2VsZWN0JywgYmxhbms6ZmFsc2UsIHJlcXVpcmVkOnRydWUsCiAgICAgICAgb3B0aW9uczpbJ+C4lOC4ueC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pycsJ+C5geC4geC5ieC5',
  'hOC4guC5hOC4lOC5iScsJ+C4nOC4ueC5ieC4lOC4ueC5geC4pSddLAogICAgICAgIGhpbnQ6J+C4lOC4ueC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pyA9IOC5gOC4m+C4tOC4lOC4lOC4ueC5hOC4lOC5ieC4l+C4uOC4geC4q+C4meC5ieC4siDCtyDguYHg',
  'uIHguYnguYTguILguYTguJTguYkgPSDguYDguJ7guLTguYjguKEv4LmB4LiB4LmJL+C4peC4muC4guC5ieC4reC4oeC4ueC4pSDCtyDguJzguLnguYnguJTguLnguYHguKUgPSDguIjguLHguJTguIHguLLguKPguJzguLnguYnguYPguIrguYnguYHguKXguLDguIHg',
  'uLLguKPguJXguLHguYnguIfguITguYjguLLguYTguJTguYnguJTguYnguKfguKInIH0sCiAgICAgIHsga2V5OidwYXNzd29yZCcsIGxhYmVsOiBpc05ldyA/ICfguKPguKvguLHguKrguJzguYjguLLguJnguYDguKPguLTguYjguKHguJXguYnguJknIDogJ+C4leC4',
  'seC5ieC4h+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iCAo4LmA4Lin4LmJ4LiZ4Lin4LmI4Liy4LiHID0g4LmE4Lih4LmI4LmA4Lib4Lil4Li14LmI4Lii4LiZKScsCiAgICAgICAgcmVxdWlyZWQ6aXNOZXcsIHBoOifguK3guKLguYjguLLguIfg',
  'uJnguYnguK3guKIgOCDguJXguLHguKfguK3guLHguIHguKnguKMnLAogICAgICAgIGhpbnQ6J+C4iOC4lOC5hOC4p+C5ieC4quC5iOC4h+C5g+C4q+C5ieC5gOC4iOC5ieC4suC4leC4seC4pyDigJQg4Lij4Liw4Lia4Lia4LmA4LiB4LmH4Lia4LmB4Lia4Lia4LmA',
  '4LiC4LmJ4Liy4Lij4Lir4Lix4LiqIOC5gOC4m+C4tOC4lOC4lOC4ueC4ouC5ieC4reC4meC4q+C4peC4seC4h+C5hOC4oeC5iOC5hOC4lOC5iScgfSwKICAgICAgeyBrZXk6J211c3RDaGFuZ2UnLCBsYWJlbDon4LmD4Lir4LmJ4LmA4Lib4Lil4Li14LmI4Lii4LiZ',
  '4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LiV4Lit4LiZ4LmA4LiC4LmJ4Liy4LiE4Lij4Lix4LmJ4LiH4LmB4Lij4LiBJywgdHlwZTonc2VsZWN0JywgYmxhbms6ZmFsc2UsCiAgICAgICAgb3B0aW9uczpbe3ZhbHVlOid0cnVlJyxsYWJlbDon4LmD4LiK4LmIICjg',
  'uYHguJnguLDguJnguLMpJ30se3ZhbHVlOidmYWxzZScsbGFiZWw6J+C5hOC4oeC5iOC4leC5ieC4reC4hyd9XSB9LAogICAgICB7IGtleTonc3RhdHVzJywgbGFiZWw6J+C4quC4luC4suC4meC4sCcsIHR5cGU6J3NlbGVjdCcsIGJsYW5rOmZhbHNlLCBvcHRpb25z',
  'Olsn4LmD4LiK4LmJ4LiH4Liy4LiZJywn4Lij4Liw4LiH4Lix4LiaJ10sCiAgICAgICAgaGludDon4Lij4Liw4LiH4Lix4LiaID0g4LmA4LiC4LmJ4Liy4Lij4Liw4Lia4Lia4LmE4Lih4LmI4LmE4LiU4LmJ4LiX4Lix4LiZ4LiX4Li1IOC5geC4leC5iOC4ouC4seC4',
  'h+C5gOC4geC5h+C4muC4muC4seC4jeC4iuC4teC5hOC4p+C5iScgfSwKICAgICAgeyBrZXk6J25vdGUnLCBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXSwKICAgIHdpZGU6IHRydWUKICB9',
  'KTsKCiAgLy8g4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LmE4Lih4LmI4LmE4LiU4LmJIOC4peC5h+C4reC4geC4iuC5iOC4reC4h+C5hOC4p+C5ieC5gOC4peC4ouC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC5gOC4',
  'guC5ieC4suC5g+C4iOC4nOC4tOC4lAogIGlmICghaXNOZXcpIHsKICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX3VzZXJuYW1lJyk7CiAgICBpZiAoZWwpIHsgZWwucmVhZE9ubHkgPSB0cnVlOyBlbC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3Zh',
  'cigtLXN1cmZhY2UtMiknOyB9CiAgfQp9CgpmdW5jdGlvbiBkZWxVc2VyKHVzZXJuYW1lKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguJzguLnguYnguYPguIrguYkgIicgKyB1c2VybmFtZSArICciIOC5g+C4iuC5iOC5hOC4q+C4oSDigJQg4LmA4LiC4LmJ4Liy',
  '4Lij4Liw4Lia4Lia4LmE4Lih4LmI4LmE4LiU4LmJ4Lit4Li14LiB4LiX4Lix4LiZ4LiX4Li1JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ3VzZXIuZGVsZXRlJywgeyB1c2VybmFtZTogdXNlcm5hbWUgfSkudGhlbihmdW5jdGlvbigpewogICAgICB0b2FzdCgn',
  '4Lil4Lia4Lic4Li54LmJ4LmD4LiK4LmJ4LmB4Lil4LmJ4LinJywgJ29rJyk7CiAgICAgIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2UgfHwgZSwgJ2VycicpOyB9KTsKICB9KTsKfQoKLyogLS0t',
  'LSDguKXguLTguIfguIHguYzguYDguILguYnguLLguYPguIrguYnguIfguLLguJkgLS0tLSAqLwoKZnVuY3Rpb24gc2V0dGluZ3NTaGFyZUNhcmQobGlua3MpewogIGlmICghbGlua3MgfHwgIWxpbmtzLmFwcFVybCkgewogICAgcmV0dXJuIGNhcmQoJ/CflJcg4Lil',
  '4Li04LiH4LiB4LmM4LmA4LiC4LmJ4Liy4LmD4LiK4LmJ4LiH4Liy4LiZJywKICAgICAgJzxkaXYgY2xhc3M9ImVtcHR5Ij7guKLguLHguIfguKvguLLguKXguLTguIfguIHguYzguIjguKPguLTguIfguYTguKHguYjguYDguIjguK0g4oCUIOC5gOC4m+C4tOC4lOC5',
  'gOC4p+C5h+C4muC5geC4reC4m+C4iOC4suC4geC4peC4tOC4h+C4geC5jOC4l+C4teC5iOC4peC4h+C4l+C5ieC4suC4oiAvZXhlYyDguKrguLHguIHguITguKPguLHguYnguIcg4LmB4Lil4LmJ4Lin4Lij4Liw4Lia4Lia4LiI4Liw4LiI4Liz4LmD4Lir4LmJ4LmA',
  '4Lit4LiHPC9kaXY+Jyk7CiAgfQogIHJldHVybiBjYXJkKCfwn5SXIOC4peC4tOC4h+C4geC5jOC5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4mScsCiAgICAnPGRpdiBjbGFzcz0iZiBtYjEyIj48bGFiZWw+4Lil4Li04LiH4LiB4LmM4Lir4Lil4Lix4LiBIOKA',
  'lCDguKrguYjguIfguYPguKvguYnguJfguLjguIHguITguJnguYTguJTguYkgKOC5gOC4guC5ieC4suC4lOC5ieC4p+C4ouC4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5ieC5geC4peC4sOC4o+C4q+C4seC4quC4nOC5iOC4suC4mSk8L2xhYmVsPicgKwogICAg',
  'ICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJhcHBVcmwiIHJlYWRvbmx5IHZhbHVlPSInICsgZXNjKGxpbmtzLmFwcFVybCkgKyAnIiBvbmNsaWNrPSJ0aGlzLnNlbGVjdCgpIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbWIxMiI+JyArCiAgICAgICc8',
  'YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJjb3B5RmllbGQoXCdhcHBVcmxcJykiPvCfk4sg4LiE4Lix4LiU4Lil4Lit4LiB4Lil4Li04LiH4LiB4LmM4Lir4Lil4Lix4LiBPC9idXR0b24+JyArCiAgICAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0i',
  'aHIiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImYgbWIxMiI+PGxhYmVsPvCfkYAg4Lil4Li04LiH4LiB4LmM4LiU4Li54Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4Lin4LmB4Lia4Lia4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4Lil4LmH4Lit4LiB4Lit4Li0',
  '4LiZPC9sYWJlbD4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0ic2hhcmVVcmwiIHJlYWRvbmx5IHZhbHVlPSInICsgZXNjKGxpbmtzLnZpZXdVcmwpICsgJyIgb25jbGljaz0idGhpcy5zZWxlY3QoKSI+PC9kaXY+JyArCiAgICAnPHAgY2xhc3M9ImZz',
  'MTIgJyArIChsaW5rcy5zaGFyZUVuYWJsZWQgPyAnbXV0ZWQnIDogJ3dhcm4tdGV4dCcpICsgJyI+JyArCiAgICAgIChsaW5rcy5zaGFyZUVuYWJsZWQKICAgICAgICA/ICfguYDguJvguLTguJTguK3guKLguLnguYgg4oCUIOC5g+C4hOC4o+C4geC5h+C4leC4suC4',
  'oeC4l+C4teC5iOC4oeC4teC4peC4tOC4h+C4geC5jOC4meC4teC5ieC5gOC4m+C4tOC4lOC4lOC4ueC4guC5ieC4reC4oeC4ueC4peC5hOC4lOC5ieC5guC4lOC4ouC5hOC4oeC5iOC4leC5ieC4reC4h+C4peC5h+C4reC4geC4reC4tOC4mScKICAgICAgICA6ICfi',
  'mqDvuI8g4Lib4Li04LiU4Lit4Lii4Li54LmIIOKAlCDguKXguLTguIfguIHguYzguJnguLXguYnguKLguLHguIfguYPguIrguYnguYTguKHguYjguYTguJTguYkg4LmA4Lib4Li04LiU4Liq4Lin4Li04LiV4LiK4LmM4LmE4LiU4LmJ4LiX4Li14LmI4Lir4Lix4Lin',
  '4LiC4LmJ4LitICLguITguKfguLLguKHguJvguKXguK3guJTguKDguLHguKLguYHguKXguLDguIHguLLguKPguYDguILguYnguLLguYPguIrguYnguIfguLLguJkiIOC4lOC5ieC4suC4meC4muC4mScpICsKICAgICc8L3A+JyArCiAgICAnPGRpdiBjbGFzcz0icm93',
  'IG10MTIiPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjb3B5RmllbGQoXCdzaGFyZVVybFwnKSI+8J+TiyDguITguLHguJTguKXguK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYw8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24g',
  'Y2xhc3M9ImJ0biBkZ3IiIG9uY2xpY2s9ImRvUm90YXRlU2hhcmUoKSI+8J+UgSDguK3guK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYzguYPguKvguKHguYg8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+',
  'JyArCiAgICAnPHAgY2xhc3M9ImZzMTIgbXV0ZWQiPvCfhpgg4Lil4Li04LiH4LiB4LmM4LiB4Li54LmJ4Lij4Liw4Lia4LiaICjguYPguIrguYnguJXguK3guJnguKXguLfguKHguKPguKvguLHguKrguJzguYjguLLguJnguIjguJnguYDguILguYnguLLguYTguKHg',
  'uYjguYTguJTguYkg4oCUIOC4q+C5ieC4suC4oeC4quC5iOC4h+C4leC5iOC4rSk8YnI+JyArCiAgICAnPGNvZGUgY2xhc3M9ImZzMTIiPicgKyBlc2MobGlua3MuYWRtaW5VcmwpICsgJzwvY29kZT48L3A+Jyk7Cn0KCmZ1bmN0aW9uIGNvcHlGaWVsZChpZCl7CiAg',
  'dmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpOwogIGlmICghZWwpIHJldHVybjsKICBlbC5zZWxlY3QoKTsKICB0cnkgeyBkb2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpOyB0b2FzdCgn4LiE4Lix4LiU4Lil4Lit4LiB4LmB4Lil4LmJ4LinJywg',
  'J29rJyk7IH0KICBjYXRjaCAoZSkgeyB0b2FzdCgn4LiB4LiU4LiE4LmJ4Liy4LiH4LiX4Li14LmI4LiK4LmI4Lit4LiH4LmB4Lil4LmJ4Lin4LmA4Lil4Li34Lit4LiBIOC4hOC4seC4lOC4peC4reC4gScsICdlcnInKTsgfQp9Cjwvc2NyaXB0Pgo8c2NyaXB0Pgov',
  'KiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgRm9ybXMuaHRtbCDigJQg4Lif4Lit4Lij4LmM4Lih4LmA4Lie4Li04LmI4LihL+C5geC4geC5ieC5hOC4giDguYHguKXguLDguIHguLLguKPguKXguJoK',
  'ICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgp2YXIgRk9STSA9IHsKICBzcGVjczogW10sICAgICAgIC8vIOC4nOC4seC4h+C4iuC5iOC4reC4h+C4geC4o+C4reC4geC4guC4reC4h+C4n+C4reC4',
  'o+C5jOC4oeC4l+C4teC5iOC5gOC4m+C4tOC4lOC4reC4ouC4ueC5iAogIGtlZXA6IHt9LCAgICAgICAgLy8g4LmE4Lif4Lil4LmM4LmB4LiZ4Lia4LmA4LiU4Li04Lih4LiX4Li14LmI4Lii4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJ4LmA4Lit4Liy4Lit4Lit4LiB',
  'CiAgYnVja2V0OiAnbWlzYycsICAvLyDguYLguJ/guKXguYDguJTguK3guKPguYzguJfguLXguYjguIjguLDguYDguIHguYfguJrguYTguJ/guKXguYzguYHguJnguJrguYPguKvguKHguYgKICBvY3I6IG51bGwsICAgICAgIC8vIOC4nOC4seC4h+C4geC4suC4o+C5',
  'gOC4leC4tOC4oeC4hOC5iOC4suC4iOC4suC4geC4o+C4ueC4mwogIHJlYzogbnVsbCwgICAgICAgLy8g4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4LiB4Liz4Lil4Lix4LiH4LmB4LiB4LmJ4Lit4Lii4Li54LmIIChudWxsID0g4LiB4Liz4Lil4Lix4LiH4LmA',
  '4Lie4Li04LmI4Lih4Lij4Liy4Lii4LiB4Liy4Lij4LmD4Lir4Lih4LmIKQogIGxpbmVzOiBbXSwgICAgICAgLy8g4Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4Lii4LmD4LiZ4Lia4Li04LilICjguYPguIrguYnguIHguLHguJrguIrguYjguK3guIfguIrguJng',
  'uLTguJQgbGluZXMpCiAgdG9kbzogW10sICAgICAgICAvLyDguYDguIrguYfguITguKXguLTguKrguJXguYzguIfguLLguJnguIvguYjguK3guKEgKOC5g+C4iuC5ieC4geC4seC4muC4iuC5iOC4reC4h+C4iuC4meC4tOC4lCB0b2RvKQogIHRvZG9PcHRpb25zOiBb',
  'XSAgLy8g4LiV4Lix4Lin4LmA4Lil4Li34Lit4LiB4Lib4Lij4Liw4LmA4Lig4LiX4LiH4Liy4LiZ4LiC4Lit4LiH4LmB4LiV4LmI4Lil4Liw4LiC4LmJ4LitCn07CgovKiAtLS0tLS0tLS0tLS0tLS0tIGZvcm0gZW5naW5lIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1',
  'bmN0aW9uIGZpZWxkc0h0bWwoc3BlY3MsIHJlYyl7CiAgcmVjID0gcmVjIHx8IHt9OwogIEZPUk0uc3BlY3MgPSBzcGVjczsKICBGT1JNLmtlZXAgPSB7fTsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImZncmlkIj4nICsgc3BlY3MubWFwKGZ1bmN0aW9uKGYpewogICAg',
  'dmFyIHYgPSByZWNbZi5rZXldOwogICAgdmFyIGlkID0gJ2ZfJyArIGYua2V5OwogICAgdmFyIGlubmVyOwoKICAgIGlmIChmLnR5cGUgPT09ICdzZWxlY3QnKSB7CiAgICAgIHZhciBvcHRzID0gKGYub3B0aW9ucyB8fCBbXSkubWFwKGZ1bmN0aW9uKG8pewogICAg',
  'ICAgIHZhciB2YWwgPSB0eXBlb2YgbyA9PT0gJ29iamVjdCcgPyBvLnZhbHVlIDogbzsKICAgICAgICB2YXIgbGFiID0gdHlwZW9mIG8gPT09ICdvYmplY3QnID8gby5sYWJlbCA6IG87CiAgICAgICAgcmV0dXJuICc8b3B0aW9uIHZhbHVlPSInICsgZXNjKHZhbCkg',
  'KyAnIicgKyAoU3RyaW5nKHYpID09PSBTdHJpbmcodmFsKSA/ICcgc2VsZWN0ZWQnIDogJycpICsgJz4nICsgZXNjKGxhYikgKyAnPC9vcHRpb24+JzsKICAgICAgfSkuam9pbignJyk7CiAgICAgIGlubmVyID0gJzxzZWxlY3QgY2xhc3M9InNlbCIgaWQ9IicgKyBp',
  'ZCArICciPicgKyAoZi5ibGFuayAhPT0gZmFsc2UgPyAnPG9wdGlvbiB2YWx1ZT0iIj7igJQg4LmA4Lil4Li34Lit4LiBIOKAlDwvb3B0aW9uPicgOiAnJykgKyBvcHRzICsgJzwvc2VsZWN0Pic7CgogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICd0ZXh0YXJlYScp',
  'IHsKICAgICAgaW5uZXIgPSAnPHRleHRhcmVhIGNsYXNzPSJ0YSIgaWQ9IicgKyBpZCArICciIHBsYWNlaG9sZGVyPSInICsgZXNjKGYucGh8fCcnKSArICciPicgKyBlc2Modnx8JycpICsgJzwvdGV4dGFyZWE+JzsKCiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0g',
  'J2ZpbGVzJykgewogICAgICBGT1JNLmtlZXBbZi5rZXldID0gKHJlY1tmLmtleV0gJiYgcmVjW2Yua2V5XS5sZW5ndGgpID8gW10uY29uY2F0KHJlY1tmLmtleV0pIDogW107CiAgICAgIGlubmVyID0KICAgICAgICAnPGRpdiBpZD0iJyArIGlkICsgJ19leGlzdGlu',
  'ZyI+JyArIGV4aXN0aW5nRmlsZXNIdG1sKGYua2V5KSArICc8L2Rpdj4nICsKICAgICAgICAnPGxhYmVsIGNsYXNzPSJmaWxlLWRyb3AiIGZvcj0iJyArIGlkICsgJyI+8J+TjiDguYHguJXguLDguYDguJ7guLfguYjguK3guYDguKXguLfguK3guIHguYTguJ/guKXg',
  'uYwgKOC5gOC4peC4t+C4reC4geC5hOC4lOC5ieC4q+C4peC4suC4ouC5hOC4n+C4peC5jCDCtyDguYTguKHguYjguYDguIHguLTguJkgMTIgTUIg4LiV4LmI4Lit4LmE4Lif4Lil4LmMKScgKwogICAgICAgICc8aW5wdXQgdHlwZT0iZmlsZSIgaWQ9IicgKyBpZCAr',
  'ICciIG11bHRpcGxlIGFjY2VwdD0iaW1hZ2UvKixhcHBsaWNhdGlvbi9wZGYiIHN0eWxlPSJkaXNwbGF5Om5vbmUiICcgKwogICAgICAgICdvbmNoYW5nZT0icHJldmlld1BpY2tlZCh0aGlzLFwnJyArIGlkICsgJ1wnKSI+PC9sYWJlbD4nICsKICAgICAgICAnPGRp',
  'diBpZD0iJyArIGlkICsgJ19wcmV2aWV3IiBjbGFzcz0idGh1bWJzIG10OCI+PC9kaXY+JyArCiAgICAgICAgJzxkaXYgaWQ9IicgKyBpZCArICdfb2NyIj48L2Rpdj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAndG9kbycpIHsKICAgICAgRk9STS50b2Rv',
  'ID0gcGFyc2VUb2RvVGV4dCh2KTsKICAgICAgRk9STS50b2RvT3B0aW9ucyA9IGYub3B0aW9ucyB8fCBbXTsKICAgICAgaW5uZXIgPSAnPGRpdiBpZD0iJyArIGlkICsgJyIgY2xhc3M9InRvZG8iPicgKyB0b2RvVGFibGVIdG1sKCkgKyAnPC9kaXY+JzsKCiAgICB9',
  'IGVsc2UgaWYgKGYudHlwZSA9PT0gJ2xpbmVzJykgewogICAgICBGT1JNLmxpbmVzID0gcGFyc2VMaW5lc1RleHQodik7CiAgICAgIGlubmVyID0gJzxkaXYgaWQ9IicgKyBpZCArICciIGNsYXNzPSJsaW5lcyI+JyArIGxpbmVzVGFibGVIdG1sKCkgKyAnPC9kaXY+',
  'JzsKCiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ2NvbXB1dGVkJykgewogICAgICBpbm5lciA9ICc8ZGl2IGNsYXNzPSJpbnAiIGlkPSInICsgaWQgKyAnIiBzdHlsZT0iYmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpO2ZvbnQtd2VpZ2h0OjYwMDsnICsKICAg',
  'ICAgICAgICAgICAnZm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zO2N1cnNvcjpkZWZhdWx0Ij4wPC9kaXY+JzsKCiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ2RhdGUnKSB7CiAgICAgIGlubmVyID0gJzxpbnB1dCB0eXBlPSJkYXRlIiBjbGFzcz0i',
  'aW5wIiBpZD0iJyArIGlkICsgJyIgdmFsdWU9IicgKyBlc2ModiB8fCAnJykgKyAnIj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnbnVtYmVyJyB8fCBmLnR5cGUgPT09ICdtb25leScpIHsKICAgICAgaW5uZXIgPSAnPGlucHV0IHR5cGU9Im51bWJlciIg',
  'c3RlcD0iJyArIChmLnR5cGUgPT09ICdtb25leScgPyAnMC4wMScgOiAnMScpICsgJyIgY2xhc3M9ImlucCIgaWQ9IicgKyBpZCArICciICcgKwogICAgICAgICAgICAgICd2YWx1ZT0iJyArICh2ID09IG51bGwgfHwgdiA9PT0gJycgPyAnJyA6IGVzYyh2KSkgKyAn',
  'IiBwbGFjZWhvbGRlcj0iJyArIGVzYyhmLnBofHwnJykgKyAnIiBpbnB1dG1vZGU9ImRlY2ltYWwiJyArCiAgICAgICAgICAgICAgKGYuc3VtcyA/ICcgb25pbnB1dD0icmVjYWxjU3VtcygpIicgOiAoZi5vbmlucHV0ID8gJyBvbmlucHV0PSInICsgZXNjKGYub25p',
  'bnB1dCkgKyAnIicgOiAnJykpICsgJz4nOwoKICAgIH0gZWxzZSB7CiAgICAgIGlubmVyID0gJzxpbnB1dCB0eXBlPSJ0ZXh0IiBjbGFzcz0iaW5wIiBpZD0iJyArIGlkICsgJyIgdmFsdWU9IicgKyBlc2ModiB8fCAnJykgKyAnIiBwbGFjZWhvbGRlcj0iJyArIGVz',
  'YyhmLnBofHwnJykgKyAnIj4nOwogICAgfQoKICAgIHJldHVybiAnPGRpdiBjbGFzcz0iZicgKyAoZi5mdWxsID8gJyBmdWxsJyA6ICcnKSArICciPicgKwogICAgICAnPGxhYmVsIGZvcj0iJyArIGlkICsgJyI+JyArIGVzYyhmLmxhYmVsKSArIChmLnJlcXVpcmVk',
  'ID8gJyA8c3BhbiBzdHlsZT0iY29sb3I6dmFyKC0tZGFuZ2VyKSI+Kjwvc3Bhbj4nIDogJycpICsgJzwvbGFiZWw+JyArCiAgICAgIGlubmVyICsgKGYuaGludCA/ICc8ZGl2IGNsYXNzPSJoaW50Ij4nICsKICAgICAgICAoZi5oaW50LmNoYXJBdCgwKSA9PT0gJzwn',
  'ID8gZi5oaW50IDogZXNjKGYuaGludCkpICsgJzwvZGl2PicgOiAnJykgKyAnPC9kaXY+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg',
  '4LmA4LiK4LmH4LiE4Lil4Li04Liq4LiV4LmM4LiH4Liy4LiZ4LiL4LmI4Lit4LihIOKAlCDguYDguILguYnguLLguIvguYjguK3guKHguITguKPguLHguYnguIfguYDguJTguLXguKLguKfguKHguLHguIHguIvguYjguK3guKHguKvguKXguLLguKLguIjguLjguJQK',
  'CiAgIOC5gOC4geC5h+C4muC4peC4h+C4iuC4teC4leC4muC4o+C4o+C4l+C4seC4lOC4peC4sOC4h+C4suC4mSAgW3hdIOC4iuC4t+C5iOC4reC4h+C4suC4mSB8IOC4m+C4o+C4sOC5gOC4oOC4l+C4h+C4suC4mQogICAo4Lij4Li54Lib4LmB4Lia4Lia4LmA4LiU',
  '4Li14Lii4Lin4LiB4Lix4LiaIHBhcnNlVG9kb18g4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmMIOKAlCDguYHguIHguYnguJfguLXguYjguYTguKvguJnguJXguYnguK3guIfguYHguIHguYnguYPguKvguYnguJXguKPguIfguIHg',
  'uLHguJkpCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKZnVuY3Rpb24gcGFyc2VUb2RvVGV4dCh0ZXh0KXsKICB2YXIgcmF3ID0gU3RyaW5nKHRleHQgPT0gbnVsbCA/ICcnIDogdGV4dCk7',
  'CiAgaWYgKCFyYXcudHJpbSgpKSByZXR1cm4gW107CiAgdmFyIGxpbmVzID0gcmF3LnNwbGl0KC9ccj9cbi8pLm1hcChmdW5jdGlvbihsKXsgcmV0dXJuIGwudHJpbSgpOyB9KS5maWx0ZXIoQm9vbGVhbik7CgogIC8vIOC4guC4reC4h+C5gOC4lOC4tOC4oeC5gOC4',
  'guC4teC4ouC4meC4o+C4p+C4oeC4muC4o+C4o+C4l+C4seC4lOC5gOC4lOC4teC4ouC4p+C4p+C5iOC4siAiMS7guKLguLLguYHguJnguKcgMi7guYDguIHguYfguJrguKrguLXguKvguYnguK3guIciCiAgaWYgKGxpbmVzLmxlbmd0aCA9PT0gMSAmJiAvXGRccypb',
  'LildLy50ZXN0KGxpbmVzWzBdKSAmJiBsaW5lc1swXS5jaGFyQXQoMCkgIT09ICdbJykgewogICAgbGluZXMgPSBsaW5lc1swXS5zcGxpdCgvXHMqXGQrXHMqWy4pXVxzKi8pLm1hcChmdW5jdGlvbih4KXsgcmV0dXJuIHgudHJpbSgpOyB9KS5maWx0ZXIoQm9vbGVh',
  'bik7CiAgfQoKICByZXR1cm4gbGluZXMubWFwKGZ1bmN0aW9uKGxpbmUpewogICAgdmFyIGRvbmUgPSBmYWxzZTsKICAgIHZhciBtID0gbGluZS5tYXRjaCgvXlxbXHMqKFt4WOKck10pP1xzKlxdXHMqKC4qKSQvKTsKICAgIGlmIChtKSB7IGRvbmUgPSAhIW1bMV07',
  'IGxpbmUgPSBtWzJdOyB9CiAgICBsaW5lID0gbGluZS5yZXBsYWNlKC9eXGQrXHMqWy4pXVxzKi8sICcnKS50cmltKCk7CiAgICB2YXIgYSA9IGxpbmUuc3BsaXQoJ3wnKTsKICAgIHJldHVybiB7IGRvbmU6IGRvbmUsIG5hbWU6IChhWzBdIHx8ICcnKS50cmltKCks',
  'IGNhdGVnb3J5OiAoYVsxXSB8fCAnJykudHJpbSgpIH07CiAgfSkuZmlsdGVyKGZ1bmN0aW9uKHQpeyByZXR1cm4gdC5uYW1lOyB9KTsKfQoKZnVuY3Rpb24gZm9ybWF0VG9kb1RleHQobGlzdCl7CiAgcmV0dXJuIChsaXN0IHx8IFtdKQogICAgLmZpbHRlcihmdW5j',
  'dGlvbih0KXsgcmV0dXJuIFN0cmluZyh0Lm5hbWUgfHwgJycpLnRyaW0oKTsgfSkKICAgIC5tYXAoZnVuY3Rpb24odCl7CiAgICAgIHZhciBubSA9IFN0cmluZyh0Lm5hbWUpLnJlcGxhY2UoL1x8L2csICcvJykudHJpbSgpOwogICAgICB2YXIgY3QgPSBTdHJpbmco',
  'dC5jYXRlZ29yeSB8fCAnJykucmVwbGFjZSgvXHwvZywgJy8nKS50cmltKCk7CiAgICAgIHJldHVybiAnWycgKyAodC5kb25lID8gJ3gnIDogJyAnKSArICddICcgKyBubSArIChjdCA/ICcgfCAnICsgY3QgOiAnJyk7CiAgICB9KS5qb2luKCdcbicpOwp9CgpmdW5j',
  'dGlvbiB0b2RvRG9uZSgpeyByZXR1cm4gKEZPUk0udG9kbyB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uKHQpeyByZXR1cm4gdC5kb25lOyB9KS5sZW5ndGg7IH0KCmZ1bmN0aW9uIHRvZG9UYWJsZUh0bWwoKXsKICB2YXIgb3B0cyA9IEZPUk0udG9kb09wdGlvbnMgfHwg',
  'W107CiAgdmFyIHJvd3MgPSAoRk9STS50b2RvIHx8IFtdKS5tYXAoZnVuY3Rpb24odCwgaSl7CiAgICByZXR1cm4gJzxkaXYgY2xhc3M9InRvZG8tcm93JyArICh0LmRvbmUgPyAnIGRvbmUnIDogJycpICsgJyI+JyArCiAgICAgICc8bGFiZWwgY2xhc3M9InRvZG8t',
  'Y2hlY2siIHRpdGxlPSInICsgKHQuZG9uZSA/ICfguJfguLPguYDguKrguKPguYfguIjguYHguKXguYnguKcnIDogJ+C4ouC4seC4h+C5hOC4oeC5iOC5hOC4lOC5ieC4l+C4sycpICsgJyI+JyArCiAgICAgICAgJzxpbnB1dCB0eXBlPSJjaGVja2JveCInICsgKHQu',
  'ZG9uZSA/ICcgY2hlY2tlZCcgOiAnJykgKyAnIG9uY2hhbmdlPSJzZXRUb2RvKCcgKyBpICsgJyxcJ2RvbmVcJyx0aGlzLmNoZWNrZWQpIj4nICsKICAgICAgJzwvbGFiZWw+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgcGxhY2Vob2xkZXI9IuC4h+C4suC4',
  'meC4l+C4teC5iOC4leC5ieC4reC4h+C4i+C5iOC4reC4oSIgdmFsdWU9IicgKyBlc2ModC5uYW1lIHx8ICcnKSArICciICcgKwogICAgICAgICdvbmlucHV0PSJzZXRUb2RvKCcgKyBpICsgJyxcJ25hbWVcJyx0aGlzLnZhbHVlKSI+JyArCiAgICAgICc8c2VsZWN0',
  'IGNsYXNzPSJzZWwiIG9uY2hhbmdlPSJzZXRUb2RvKCcgKyBpICsgJyxcJ2NhdGVnb3J5XCcsdGhpcy52YWx1ZSkiPicgKwogICAgICAgICc8b3B0aW9uIHZhbHVlPSIiPuKAlCDguJvguKPguLDguYDguKDguJfguIfguLLguJkg4oCUPC9vcHRpb24+JyArCiAgICAg',
  'ICAgb3B0cy5tYXAoZnVuY3Rpb24obyl7CiAgICAgICAgICByZXR1cm4gJzxvcHRpb24gdmFsdWU9IicgKyBlc2MobykgKyAnIicgKyAobyA9PT0gdC5jYXRlZ29yeSA/ICcgc2VsZWN0ZWQnIDogJycpICsgJz4nICsgZXNjKG8pICsgJzwvb3B0aW9uPic7CiAgICAg',
  'ICAgfSkuam9pbignJykgKwogICAgICAnPC9zZWxlY3Q+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSBkZ3IiIHRpdGxlPSLguYDguK3guLLguIfguLLguJnguJnguLXguYnguK3guK3guIEiIG9uY2xpY2s9ImRlbFRvZG8oJyAr',
  'IGkgKyAnKSI+w5c8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nOwogIH0pLmpvaW4oJycpOwoKICB2YXIgbiA9IChGT1JNLnRvZG8gfHwgW10pLmxlbmd0aCwgZCA9IHRvZG9Eb25lKCk7CiAgcmV0dXJuIChyb3dzIHx8ICc8ZGl2IGNsYXNzPSJoaW50IiBzdHlsZT0i',
  'cGFkZGluZzo4cHggMnB4Ij7guKLguLHguIfguYTguKHguYjguKHguLXguIfguLLguJkg4oCUIOC4geC4lCDigJzguYDguJ7guLTguYjguKHguIfguLLguJnigJ0g4LmA4Lie4Li34LmI4Lit4LmD4Liq4LmI4LiX4Li14Lil4Liw4LiI4Li44LiU4LiX4Li14LmI4LiV',
  '4LmJ4Lit4LiH4LiL4LmI4Lit4LihPC9kaXY+JykgKwogICAgJzxkaXYgY2xhc3M9InJvdyBtdDgiPicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImFkZFRvZG8oKSI+KyDguYDguJ7guLTguYjguKHguIfguLLg',
  'uJk8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJwYXN0ZVRvZG8oKSI+8J+TiyDguKfguLLguIfguJfguLXguYDguJTguLXguKLguKfguKvguKXguLLguKLguIfguLLguJk8L2J1dHRvbj4nICsK',
  'ICAgICAgKG4gPyAnPGRpdiBjbGFzcz0idG9kby1jb3VudCI+4LmA4Liq4Lij4LmH4LiI4LmB4Lil4LmJ4LinIDxiPicgKyBkICsgJy8nICsgbiArICc8L2I+IOC4h+C4suC4mTwvZGl2PicgOiAnJykgKwogICAgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIHJlZHJhd1Rv',
  'ZG8oKXsKICB2YXIgYm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfaXRlbXMnKTsKICBpZiAoIWJveCkgcmV0dXJuOwogIGJveC5pbm5lckhUTUwgPSB0b2RvVGFibGVIdG1sKCk7Cn0KCmZ1bmN0aW9uIHNldFRvZG8oaSwga2V5LCB2YWwpewogIGlmICgh',
  'Rk9STS50b2RvW2ldKSByZXR1cm47CiAgRk9STS50b2RvW2ldW2tleV0gPSAoa2V5ID09PSAnZG9uZScpID8gISF2YWwgOiB2YWw7CiAgaWYgKGtleSA9PT0gJ2RvbmUnKSB7IHJlZHJhd1RvZG8oKTsgcmV0dXJuOyB9ICAgLy8g4LiV4Li04LmK4LiB4LmB4Lil4LmJ',
  '4Lin4Lin4Liy4LiU4LmD4Lir4Lih4LmI4LmD4Lir4LmJ4LiC4Li14LiU4LiG4LmI4Liy4LmA4Lir4LmH4LiZ4LiK4Lix4LiUCiAgdmFyIGMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZl9pdGVtcyAudG9kby1jb3VudCBiJyk7CiAgaWYgKGMpIGMudGV4dENv',
  'bnRlbnQgPSB0b2RvRG9uZSgpICsgJy8nICsgRk9STS50b2RvLmxlbmd0aDsKfQoKZnVuY3Rpb24gYWRkVG9kbygpewogIEZPUk0udG9kby5wdXNoKHsgZG9uZTogZmFsc2UsIG5hbWU6ICcnLCBjYXRlZ29yeTogJycgfSk7CiAgcmVkcmF3VG9kbygpOwogIHZhciBp',
  'bnB1dHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjZl9pdGVtcyAudG9kby1yb3cgLmlucCcpOwogIGlmIChpbnB1dHMubGVuZ3RoKSBpbnB1dHNbaW5wdXRzLmxlbmd0aCAtIDFdLmZvY3VzKCk7Cn0KCmZ1bmN0aW9uIGRlbFRvZG8oaSl7CiAgRk9STS50',
  'b2RvLnNwbGljZShpLCAxKTsKICByZWRyYXdUb2RvKCk7Cn0KCi8qKiDguKfguLLguIfguKPguLLguKLguIHguLLguKPguJfguLXguYjguJXguYnguK3guIfguIvguYjguK3guKHguJfguLXguYDguJTguLXguKLguKfguKvguKXguLLguKLguJrguKPguKPguJfguLHg',
  'uJQg4LmB4Lil4LmJ4Lin4LmD4Lir4LmJ4Lij4Liw4Lia4Lia4LmB4Lii4LiB4LmD4Lir4LmJICovCmZ1bmN0aW9uIHBhc3RlVG9kbygpewogIHZhciBib3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9kb1Bhc3RlV3JhcCcpOwogIGlmIChib3gpIHsgYm94',
  'LmhpZGRlbiA9ICFib3guaGlkZGVuOyBpZiAoIWJveC5oaWRkZW4pIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2RvUGFzdGVCb3gnKS5mb2N1cygpOyByZXR1cm47IH0KCiAgdmFyIGhvc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9pdGVtcycpOwog',
  'IGlmICghaG9zdCkgcmV0dXJuOwogIHZhciB3cmFwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgd3JhcC5pZCA9ICd0b2RvUGFzdGVXcmFwJzsKICB3cmFwLmNsYXNzTmFtZSA9ICdtdDgnOwogIHdyYXAuaW5uZXJIVE1MID0KICAgICc8dGV4dGFy',
  'ZWEgY2xhc3M9InRhIiBpZD0idG9kb1Bhc3RlQm94IiBzdHlsZT0ibWluLWhlaWdodDoxMTBweCIgJyArCiAgICAgICdwbGFjZWhvbGRlcj0i4Lii4Liy4LmB4LiZ4Lin4Lir4LmJ4Lit4LiH4LiZ4LmJ4LizJiMxMDvguYDguIHguYfguJrguKrguLXguKvguYnguK3g',
  'uIcmIzEwO+C5gOC4m+C4peC4teC5iOC4ouC4meC4geC5iuC4reC4geC4meC5ieC4s+C4peC5ieC4suC4h+C4iOC4suC4mSI+PC90ZXh0YXJlYT4nICsKICAgICc8ZGl2IGNsYXNzPSJoaW50IG10OCI+4Lia4Lij4Lij4LiX4Lix4LiU4Lil4Liw4Lir4LiZ4Li24LmI',
  '4LiH4LiH4Liy4LiZIMK3IOC4q+C4o+C4t+C4reC4nuC4tOC4oeC4nuC5jOC4o+C4p+C4oeC4muC4o+C4o+C4l+C4seC4lOC5gOC4lOC4teC4ouC4p+C5geC4muC4miDigJwxLuC4ouC4suC5geC4meC4pyAyLuC5gOC4geC5h+C4muC4quC4teC4q+C5ieC4reC4h+KA',
  'nSDguIHguYfguYTguJTguYk8YnI+JyArCiAgICAgICfguYPguKrguYjguJvguKPguLDguYDguKDguJfguIfguLLguJnguJfguLXguKvguKXguLHguIfguIjguLLguIHguIrguYjguK3guIfguILguYnguLLguIcg4LmGIOC5geC4leC5iOC4peC4sOC4h+C4suC4mTwv',
  'ZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InJvdyBtdDgiPicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20gcHJpIiBvbmNsaWNrPSJhcHBseVBhc3RlZFRvZG8oKSI+4LmA4Lie4Li04LmI4Lih4LmA4LiC4LmJ4Liy4Lij4Liy4Lii',
  '4LiB4Liy4LijPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCd0b2RvUGFzdGVXcmFwXCcpLmhpZGRlbj10cnVlIj7guJvguLTguJQ8L2J1dHRvbj4n',
  'ICsKICAgICc8L2Rpdj4nOwogIGhvc3QuYXBwZW5kQ2hpbGQod3JhcCk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvZG9QYXN0ZUJveCcpLmZvY3VzKCk7Cn0KCmZ1bmN0aW9uIGFwcGx5UGFzdGVkVG9kbygpewogIHZhciB0ZXh0ID0gKGRvY3VtZW50Lmdl',
  'dEVsZW1lbnRCeUlkKCd0b2RvUGFzdGVCb3gnKSB8fCB7fSkudmFsdWUgfHwgJyc7CiAgdmFyIGFkZGVkID0gcGFyc2VUb2RvVGV4dCh0ZXh0KTsKICBpZiAoIWFkZGVkLmxlbmd0aCkgcmV0dXJuIHRvYXN0KCfguYTguKHguYjguJ7guJrguIfguLLguJnguJfguLXg',
  'uYjguK3guYjguLLguJnguYTguJTguYknLCAnZXJyJyk7CiAgRk9STS50b2RvID0gKEZPUk0udG9kbyB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uKHQpeyByZXR1cm4gU3RyaW5nKHQubmFtZSB8fCAnJykudHJpbSgpOyB9KS5jb25jYXQoYWRkZWQpOwogIHJlZHJhd1Rv',
  'ZG8oKTsKICB0b2FzdCgn4LmA4Lie4Li04LmI4Lih4LmD4Lir4LmJICcgKyBhZGRlZC5sZW5ndGggKyAnIOC4h+C4suC4mScsICdvaycpOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg',
  '4Lia4Li04Lil4LmA4LiU4Li14Lii4Lin4Lir4Lil4Liy4Lii4Lij4Liy4Lii4LiB4Liy4LijIOKAlCDguIvguLfguYnguK3guK3guK3guJnguYTguKXguJnguYzguJfguLXguYDguJTguLXguKLguKfguYTguJTguYnguILguK3guIfguKvguKXguLLguKLguK3guKLg',
  'uYjguLLguIcKCiAgIOC5gOC4geC5h+C4muC4peC4h+C4iuC4teC4leC5gOC4m+C5h+C4meC4guC5ieC4reC4hOC4p+C4suC4oSDguJrguKPguKPguJfguLHguJTguKXguLDguKPguLLguKLguIHguLLguKMgIOC4iuC4t+C5iOC4rSB8IOC4iOC4s+C4meC4p+C4mSB8',
  'IOC4q+C4meC5iOC4p+C4oiB8IOC4o+C4suC4hOC4suC4leC5iOC4reC4q+C4meC5iOC4p+C4ogogICAo4Lij4Li54Lib4LmB4Lia4Lia4LmA4LiU4Li14Lii4Lin4LiB4Lix4LiaIHBhcnNlTGluZXNfIOC4neC4seC5iOC4h+C5gOC4i+C4tOC4o+C5jOC4n+C5gOC4',
  'p+C4reC4o+C5jCDigJQg4LmB4LiB4LmJ4LiX4Li14LmI4LmE4Lir4LiZ4LiV4LmJ4Lit4LiH4LmB4LiB4LmJ4LmD4Lir4LmJ4LiV4Lij4LiH4LiB4Lix4LiZKQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT0gKi8KCmZ1bmN0aW9uIHBhcnNlTGluZXNUZXh0KHRleHQpewogIHJldHVybiBTdHJpbmcodGV4dCA9PSBudWxsID8gJycgOiB0ZXh0KS5zcGxpdCgvXHI/XG4vKQogICAgLm1hcChmdW5jdGlvbihzKXsgcmV0dXJuIHMudHJpbSgpOyB9KS5maWx0ZXIoQm9v',
  'bGVhbikKICAgIC5tYXAoZnVuY3Rpb24ocmF3KXsKICAgICAgdmFyIGEgPSByYXcuc3BsaXQoJ3wnKS5tYXAoZnVuY3Rpb24oeCl7IHJldHVybiB4LnRyaW0oKTsgfSk7CiAgICAgIHZhciBuYW1lID0gYVswXSB8fCAnJywgcXR5ID0gMSwgdW5pdCA9ICcnLCBwcmlj',
  'ZSA9IDA7CiAgICAgIGlmIChhLmxlbmd0aCA+PSA0KSAgICAgIHsgcXR5ID0gbnVtT3IoYVsxXSwgMSk7IHVuaXQgPSBhWzJdIHx8ICcnOyBwcmljZSA9IG51bU9yKGFbM10sIDApOyB9CiAgICAgIGVsc2UgaWYgKGEubGVuZ3RoID09PSAzKXsgcXR5ID0gbnVtT3Io',
  'YVsxXSwgMSk7IHByaWNlID0gbnVtT3IoYVsyXSwgMCk7IH0KICAgICAgZWxzZSBpZiAoYS5sZW5ndGggPT09IDIpeyBwcmljZSA9IG51bU9yKGFbMV0sIDApOyB9CiAgICAgIHJldHVybiB7IG5hbWU6IG5hbWUsIHF0eTogcXR5LCB1bml0OiB1bml0LCBwcmljZTog',
  'cHJpY2UgfTsKICAgIH0pOwp9CgpmdW5jdGlvbiBudW1Pcih2LCBkZmx0KXsKICB2YXIgbiA9IE51bWJlcihTdHJpbmcodikucmVwbGFjZSgvLC9nLCAnJykpOwogIHJldHVybiBpc0Zpbml0ZShuKSA/IG4gOiBkZmx0Owp9CgpmdW5jdGlvbiBmb3JtYXRMaW5lc1Rl',
  'eHQobGlzdCl7CiAgcmV0dXJuIChsaXN0IHx8IFtdKQogICAgLmZpbHRlcihmdW5jdGlvbihsKXsgcmV0dXJuIFN0cmluZyhsLm5hbWUgfHwgJycpLnRyaW0oKSB8fCBOdW1iZXIobC5wcmljZSk7IH0pCiAgICAubWFwKGZ1bmN0aW9uKGwpewogICAgICByZXR1cm4g',
  'W1N0cmluZyhsLm5hbWUgfHwgJycpLnJlcGxhY2UoL1x8L2csICcvJyksCiAgICAgICAgICAgICAgbC5xdHkgfHwgMSwKICAgICAgICAgICAgICBTdHJpbmcobC51bml0IHx8ICcnKS5yZXBsYWNlKC9cfC9nLCAnLycpLAogICAgICAgICAgICAgIGwucHJpY2UgfHwg',
  'MF0uam9pbignIHwgJyk7CiAgICB9KS5qb2luKCdcbicpOwp9CgpmdW5jdGlvbiBsaW5lVG90YWwobCl7IHJldHVybiAoTnVtYmVyKGwucXR5KSB8fCAwKSAqIChOdW1iZXIobC5wcmljZSkgfHwgMCk7IH0KZnVuY3Rpb24gbGluZXNTdW0oKXsgcmV0dXJuIChGT1JN',
  'LmxpbmVzIHx8IFtdKS5yZWR1Y2UoZnVuY3Rpb24oYSwgbCl7IHJldHVybiBhICsgbGluZVRvdGFsKGwpOyB9LCAwKTsgfQoKZnVuY3Rpb24gbGluZXNUYWJsZUh0bWwoKXsKICB2YXIgcm93cyA9IChGT1JNLmxpbmVzIHx8IFtdKS5tYXAoZnVuY3Rpb24obCwgaSl7',
  'CiAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImxpbmUtcm93Ij4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBwbGFjZWhvbGRlcj0i4LiK4Li34LmI4Lit4Liq4Li04LiZ4LiE4LmJ4LiyIiB2YWx1ZT0iJyArIGVzYyhsLm5hbWUgfHwgJycpICsgJyIgJyArCiAg',
  'ICAgICAgJ29uaW5wdXQ9InNldExpbmUoJyArIGkgKyAnLFwnbmFtZVwnLHRoaXMudmFsdWUpIj4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIG51bSIgdHlwZT0ibnVtYmVyIiBzdGVwPSJhbnkiIGlucHV0bW9kZT0iZGVjaW1hbCIgcGxhY2Vob2xkZXI9IuC4',
  'iOC4s+C4meC4p+C4mSIgJyArCiAgICAgICAgJ3ZhbHVlPSInICsgKGwucXR5ID09IG51bGwgPyAnJyA6IGVzYyhsLnF0eSkpICsgJyIgb25pbnB1dD0ic2V0TGluZSgnICsgaSArICcsXCdxdHlcJyx0aGlzLnZhbHVlKSI+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9',
  'ImlucCIgcGxhY2Vob2xkZXI9IuC4q+C4meC5iOC4p+C4oiIgdmFsdWU9IicgKyBlc2MobC51bml0IHx8ICcnKSArICciICcgKwogICAgICAgICdvbmlucHV0PSJzZXRMaW5lKCcgKyBpICsgJyxcJ3VuaXRcJyx0aGlzLnZhbHVlKSI+JyArCiAgICAgICc8aW5wdXQg',
  'Y2xhc3M9ImlucCBudW0iIHR5cGU9Im51bWJlciIgc3RlcD0iYW55IiBpbnB1dG1vZGU9ImRlY2ltYWwiIHBsYWNlaG9sZGVyPSLguKPguLLguITguLIv4Lir4LiZ4LmI4Lin4LiiIiAnICsKICAgICAgICAndmFsdWU9IicgKyAobC5wcmljZSA9PSBudWxsID8gJycg',
  'OiBlc2MobC5wcmljZSkpICsgJyIgb25pbnB1dD0ic2V0TGluZSgnICsgaSArICcsXCdwcmljZVwnLHRoaXMudmFsdWUpIj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImxpbmUtc3VtIj4nICsgbW9uZXkobGluZVRvdGFsKGwpLCAyKSArICc8L2Rpdj4nICsKICAgICAg',
  'JzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIGRnciIgdGl0bGU9IuC5gOC4reC4suC4o+C4suC4ouC4geC4suC4o+C4meC4teC5ieC4reC4reC4gSIgb25jbGljaz0iZGVsTGluZSgnICsgaSArICcpIj7DlzwvYnV0dG9uPicgKwogICAgJzwvZGl2',
  'Pic7CiAgfSkuam9pbignJyk7CgogIHJldHVybiAnPGRpdiBjbGFzcz0ibGluZS1oZWFkIj4nICsKICAgICAgJzxzcGFuPuC4iuC4t+C5iOC4reC4quC4tOC4meC4hOC5ieC4sjwvc3Bhbj48c3BhbiBjbGFzcz0ibnVtIj7guIjguLPguJnguKfguJk8L3NwYW4+PHNw',
  'YW4+4Lir4LiZ4LmI4Lin4LiiPC9zcGFuPicgKwogICAgICAnPHNwYW4gY2xhc3M9Im51bSI+4Lij4Liy4LiE4LiyL+C4q+C4meC5iOC4p+C4ojwvc3Bhbj48c3BhbiBjbGFzcz0ibnVtIj7guKPguKfguKE8L3NwYW4+PHNwYW4+PC9zcGFuPicgKwogICAgJzwvZGl2',
  'PicgKwogICAgKHJvd3MgfHwgJzxkaXYgY2xhc3M9ImhpbnQiIHN0eWxlPSJwYWRkaW5nOjhweCAycHgiPuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4o+C4suC4ouC4geC4suC4oyDigJQg4LiB4LiUIOKAnOC5gOC4nuC4tOC5iOC4oeC4o+C4suC4ouC4geC4suC4',
  'o+KAnSDguYDguJ7guLfguYjguK3guYPguKrguYjguKrguLTguJnguITguYnguLLguJfguLXguKXguLDguK3guKLguYjguLLguIc8L2Rpdj4nKSArCiAgICAnPGRpdiBjbGFzcz0icm93IG10OCI+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9',
  'ImJ0biBzbSIgb25jbGljaz0iYWRkTGluZSgpIj4rIOC5gOC4nuC4tOC5iOC4oeC4o+C4suC4ouC4geC4suC4ozwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9InBhc3RlTGluZXMoKSI+8J+TiyDg',
  'uKfguLLguIfguJfguLXguYDguJTguLXguKLguKfguKvguKXguLLguKLguKPguLLguKLguIHguLLguKM8L2J1dHRvbj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImxpbmUtdG90YWwiPuC4o+C4p+C4oeC4hOC5iOC4suC4quC4tOC4meC4hOC5ieC4siA8Yj4nICsgbW9u',
  'ZXkobGluZXNTdW0oKSwgMikgKyAnIOC4vzwvYj48L2Rpdj4nICsKICAgICc8L2Rpdj4nOwp9CgpmdW5jdGlvbiByZWRyYXdMaW5lcygpewogIHZhciBib3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9saW5lcycpOwogIGlmICghYm94KSByZXR1cm47CiAg',
  'Ym94LmlubmVySFRNTCA9IGxpbmVzVGFibGVIdG1sKCk7CiAgcmVjYWxjQmlsbCgpOwp9CgpmdW5jdGlvbiBzZXRMaW5lKGksIGtleSwgdmFsKXsKICBpZiAoIUZPUk0ubGluZXNbaV0pIHJldHVybjsKICBGT1JNLmxpbmVzW2ldW2tleV0gPSAoa2V5ID09PSAncXR5',
  'JyB8fCBrZXkgPT09ICdwcmljZScpID8gbnVtT3IodmFsLCAwKSA6IHZhbDsKICAvLyDguYTguKHguYjguKfguLLguJTguYPguKvguKHguYjguJfguLHguYnguIfguJXguLLguKPguLLguIcg4LmA4LiU4Li14LmL4Lii4Lin4LmA4LiE4Lit4Lij4LmM4LmA4LiL4Lit',
  '4Lij4LmM4LmA4LiU4LmJ4LiH4Lit4Lit4LiB4LiI4Liy4LiB4LiK4LmI4Lit4LiH4LiX4Li14LmI4LiB4Liz4Lil4Lix4LiH4Lie4Li04Lih4Lie4LmMCiAgdmFyIHJvdyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNmX2xpbmVzIC5saW5lLXJvdycpW2ld',
  'OwogIGlmIChyb3cpIHJvdy5xdWVyeVNlbGVjdG9yKCcubGluZS1zdW0nKS50ZXh0Q29udGVudCA9IG1vbmV5KGxpbmVUb3RhbChGT1JNLmxpbmVzW2ldKSwgMik7CiAgdmFyIHRvdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNmX2xpbmVzIC5saW5lLXRvdGFs',
  'IGInKTsKICBpZiAodG90KSB0b3QudGV4dENvbnRlbnQgPSBtb25leShsaW5lc1N1bSgpLCAyKSArICcg4Li/JzsKICByZWNhbGNCaWxsKCk7Cn0KCmZ1bmN0aW9uIGFkZExpbmUoKXsKICBGT1JNLmxpbmVzLnB1c2goeyBuYW1lOiAnJywgcXR5OiAxLCB1bml0OiAn',
  'JywgcHJpY2U6IDAgfSk7CiAgcmVkcmF3TGluZXMoKTsKICB2YXIgaW5wdXRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2ZfbGluZXMgLmxpbmUtcm93IC5pbnAnKTsKICBpZiAoaW5wdXRzLmxlbmd0aCkgaW5wdXRzWyhGT1JNLmxpbmVzLmxlbmd0aCAt',
  'IDEpICogNF0uZm9jdXMoKTsKfQoKZnVuY3Rpb24gZGVsTGluZShpKXsKICBGT1JNLmxpbmVzLnNwbGljZShpLCAxKTsKICByZWRyYXdMaW5lcygpOwp9CgovKioKICog4Lin4Liy4LiH4Lij4Liy4Lii4LiB4Liy4Lij4LiI4Liy4LiB4Lir4LiZ4LmJ4Liy4LiE4Liz',
  '4Liq4Lix4LmI4LiH4LiL4Li34LmJ4Lit4LiX4Li14LmA4LiU4Li14Lii4Lin4LiX4Lix4LmJ4LiH4LiB4LmJ4Lit4LiZIOC5geC4peC5ieC4p+C5g+C4q+C5ieC4o+C4sOC4muC4muC5geC4ouC4geC4muC4o+C4o+C4l+C4seC4lOC5g+C4q+C5iQogKgogKiDguJfg',
  'uLPguYDguJvguYfguJnguIrguYjguK3guIfguJ7guLHguJrguYDguIHguYfguJrguK3guKLguLnguYjguYPguJnguJ/guK3guKPguYzguKHguYDguJTguLTguKEg4LmE4Lih4LmI4LmA4Lib4Li04LiU4Lir4LiZ4LmJ4Liy4LiV4LmI4Liy4LiH4LiL4LmJ4Lit4LiZ',
  'CiAqIOC5gOC4nuC4o+C4suC4sCBvcGVuTW9kYWwoKSDguYDguILguLXguKLguJnguJfguLHguJrguKvguJnguYnguLLguJXguYjguLLguIfguYDguJTguLTguKEg4LiW4LmJ4Liy4LmA4Lib4Li04LiU4LiL4LmJ4Lit4LiZ4Lif4Lit4Lij4LmM4Lih4LiX4Li14LmI',
  '4LiB4Lij4Lit4LiB4LiE4LmJ4Liy4LiH4LmE4Lin4LmJ4LiI4Liw4Lir4Liy4Lii4LiX4Lix4LmJ4LiH4LmD4LiaCiAqLwpmdW5jdGlvbiBwYXN0ZUxpbmVzKCl7CiAgdmFyIGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXN0ZVdyYXAnKTsKICBpZiAo',
  'Ym94KSB7IGJveC5oaWRkZW4gPSAhYm94LmhpZGRlbjsgaWYgKCFib3guaGlkZGVuKSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFzdGVCb3gnKS5mb2N1cygpOyByZXR1cm47IH0KCiAgdmFyIGhvc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9saW5l',
  'cycpOwogIGlmICghaG9zdCkgcmV0dXJuOwogIHZhciB3cmFwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgd3JhcC5pZCA9ICdwYXN0ZVdyYXAnOwogIHdyYXAuY2xhc3NOYW1lID0gJ210OCc7CiAgd3JhcC5pbm5lckhUTUwgPQogICAgJzx0ZXh0',
  'YXJlYSBjbGFzcz0idGEiIGlkPSJwYXN0ZUJveCIgc3R5bGU9Im1pbi1oZWlnaHQ6MTIwcHgiICcgKwogICAgICAncGxhY2Vob2xkZXI9IuC4m+C4seC5iuC4oeC4meC5ieC4syA3NTBXIHwgMSB8IOC5gOC4hOC4o+C4t+C5iOC4reC4hyB8IDQyNTAmIzEwO+C4quC4',
  'suC4ouC5hOC4nyBWQUYgMngxLjUgfCAyMCB8IOC5gOC4oeC4leC4oyB8IDE3LjUmIzEwO+C5gOC4l+C4m+C4nuC4seC4meC4quC4suC4ouC5hOC4nyA0NSI+PC90ZXh0YXJlYT4nICsKICAgICc8ZGl2IGNsYXNzPSJoaW50IG10OCI+4LiE4Lix4LmI4LiZ4LiU4LmJ',
  '4Lin4LiiIDxiPnw8L2I+IOC4leC4suC4oeC4peC4s+C4lOC4seC4miDguIrguLfguYjguK0gwrcg4LiI4Liz4LiZ4Lin4LiZIMK3IOC4q+C4meC5iOC4p+C4oiDCtyDguKPguLLguITguLLguJXguYjguK3guKvguJnguYjguKfguKI8YnI+JyArCiAgICAgICfguJbg',
  'uYnguLLguKfguLLguIfguKHguLLguYDguJvguYfguJnguILguYnguK3guITguKfguLLguKHguJjguKPguKPguKHguJTguLIg4Lij4Liw4Lia4Lia4LiI4Liw4Lie4Lii4Liy4Lii4Liy4Lih4LmB4Lii4LiB4LiK4Li34LmI4Lit4LiB4Lix4Lia4Lij4Liy4LiE4Liy',
  '4LmD4Lir4LmJ4LmA4Lit4LiHPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0icm93IG10OCI+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSBwcmkiIG9uY2xpY2s9ImFwcGx5UGFzdGVkTGluZXMoKSI+4LmA4Lie4Li04LmI4Lih',
  '4LmA4LiC4LmJ4Liy4Lij4Liy4Lii4LiB4Liy4LijPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCdwYXN0ZVdyYXBcJykuaGlkZGVuPXRydWUiPuC4',
  'm+C4tOC4lDwvYnV0dG9uPicgKwogICAgJzwvZGl2Pic7CiAgaG9zdC5hcHBlbmRDaGlsZCh3cmFwKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFzdGVCb3gnKS5mb2N1cygpOwp9CgpmdW5jdGlvbiBhcHBseVBhc3RlZExpbmVzKCl7CiAgdmFyIHRleHQg',
  'PSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Bhc3RlQm94JykgfHwge30pLnZhbHVlIHx8ICcnOwogIHZhciBhZGRlZCA9IHRleHQuc3BsaXQoL1xyP1xuLykubWFwKGZ1bmN0aW9uKHMpeyByZXR1cm4gcy50cmltKCk7IH0pLmZpbHRlcihCb29sZWFuKS5tYXAo',
  'ZnVuY3Rpb24ocmF3KXsKICAgIGlmIChyYXcuaW5kZXhPZignfCcpID49IDApIHJldHVybiBwYXJzZUxpbmVzVGV4dChyYXcpWzBdOwogICAgLy8g4LmE4Lih4LmI4Lih4Li1IHwg4oCUIOC5gOC4lOC4suC4iOC4suC4geC4leC4seC4p+C5gOC4peC4guC4l+C5ieC4',
  'suC4ouC4muC4o+C4o+C4l+C4seC4lOC4p+C5iOC4suC5gOC4m+C5h+C4meC4o+C4suC4hOC4sgogICAgdmFyIG0gPSByYXcubWF0Y2goL14oLio/KVtcczp4w5ddKihbXGQsXSsoPzpcLlxkKyk/KVxzKig/OuC4muC4suC4l3zguL8pPyQvKTsKICAgIGlmIChtICYm',
  'IG1bMV0udHJpbSgpKSByZXR1cm4geyBuYW1lOiBtWzFdLnRyaW0oKSwgcXR5OiAxLCB1bml0OiAnJywgcHJpY2U6IG51bU9yKG1bMl0sIDApIH07CiAgICByZXR1cm4geyBuYW1lOiByYXcsIHF0eTogMSwgdW5pdDogJycsIHByaWNlOiAwIH07CiAgfSkuZmlsdGVy',
  'KEJvb2xlYW4pOwoKICBpZiAoIWFkZGVkLmxlbmd0aCkgcmV0dXJuIHRvYXN0KCfguYTguKHguYjguJ7guJrguKPguLLguKLguIHguLLguKPguJfguLXguYjguK3guYjguLLguJnguYTguJTguYknLCAnZXJyJyk7CiAgRk9STS5saW5lcyA9IChGT1JNLmxpbmVzIHx8',
  'IFtdKS5maWx0ZXIoZnVuY3Rpb24obCl7IHJldHVybiBTdHJpbmcobC5uYW1lIHx8ICcnKS50cmltKCk7IH0pLmNvbmNhdChhZGRlZCk7CiAgcmVkcmF3TGluZXMoKTsgICAvLyDguKfguLLguJTguYPguKvguKHguYjguYHguKXguYnguKfguIrguYjguK3guIfguKfg',
  'uLLguIfguIjguLDguKvguLLguKLguYTguJvguYDguK3guIcg4LmA4Lie4Lij4Liy4Liw4Lit4Lii4Li54LmI4LiC4LmJ4Liy4LiH4LmD4LiZIGZfbGluZXMKICB0b2FzdCgn4LmA4Lie4Li04LmI4Lih4LmD4Lir4LmJICcgKyBhZGRlZC5sZW5ndGggKyAnIOC4o+C4',
  'suC4ouC4geC4suC4oyDigJQg4LiV4Lij4Lin4LiI4LiV4Lix4Lin4LmA4Lil4LiC4Lit4Li14LiB4LiE4Lij4Lix4LmJ4LiH4LiB4LmI4Lit4LiZ4Lia4Lix4LiZ4LiX4Li24LiBJywgJ29rJyk7Cn0KCi8qKgogKiDguITguLTguJTguKLguK3guJTguKPguKfguKHg',
  'uILguK3guIfguJrguLTguKUgPSDguITguYjguLLguKrguLTguJnguITguYnguLIgKyDguITguYjguLLguKrguYjguIcg4oiSIOC4quC5iOC4p+C4meC4peC4lCDguYHguKXguYnguKfguYDguJXguLTguKHguKXguIfguIrguYjguK3guIcgIuC4o+C4suC4hOC4suC4',
  'o+C4p+C4oSIKICog4LmD4Lir4LmJ4LiV4Lij4LiH4LiB4Lix4Lia4LiX4Li14LmI4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4LiE4Li04LiU4LiV4Lit4LiZ4Lia4Lix4LiZ4LiX4Li24LiBIOC4iOC4sOC5hOC4lOC5ieC5hOC4',
  'oeC5iOC4oeC4teC4l+C4suC4h+C4l+C4teC5iOC4leC4seC4p+C5gOC4peC4guC4quC4reC4h+C4neC4seC5iOC4h+C5hOC4oeC5iOC4leC4o+C4h+C4geC4seC4mQogKi8KZnVuY3Rpb24gcmVjYWxjQmlsbCgpewogIGlmICghZG9jdW1lbnQuZ2V0RWxlbWVudEJ5',
  'SWQoJ2ZfbGluZXMnKSkgcmV0dXJuOwogIHZhciBwcmljZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX3ByaWNlJyk7CiAgaWYgKCFwcmljZSkgcmV0dXJuOwogIHZhciBuID0gKEZPUk0ubGluZXMgfHwgW10pLmZpbHRlcihmdW5jdGlvbihsKXsgcmV0dXJu',
  'IFN0cmluZyhsLm5hbWUgfHwgJycpLnRyaW0oKSB8fCBOdW1iZXIobC5wcmljZSk7IH0pLmxlbmd0aDsKICBpZiAoIW4pIHsgcHJpY2UucmVhZE9ubHkgPSBmYWxzZTsgcHJpY2Uuc3R5bGUuYmFja2dyb3VuZCA9ICcnOyByZXR1cm47IH0KCiAgdmFyIHNoaXAgPSBO',
  'dW1iZXIoKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX3NoaXBwaW5nJykgfHwge30pLnZhbHVlKSB8fCAwOwogIHZhciBkaXNjID0gTnVtYmVyKChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9kaXNjb3VudCcpIHx8IHt9KS52YWx1ZSkgfHwgMDsKICBwcmlj',
  'ZS52YWx1ZSA9IE1hdGgucm91bmQoKGxpbmVzU3VtKCkgKyBzaGlwIC0gZGlzYykgKiAxMDApIC8gMTAwOwogIHByaWNlLnJlYWRPbmx5ID0gdHJ1ZTsgICAgICAgICAgICAgICAgICAgICAgIC8vIOC4oeC4teC4o+C4suC4ouC4geC4suC4o+C4ouC5iOC4reC4ouC5',
  'geC4peC5ieC4pyDguKvguYnguLLguKHguJ7guLTguKHguJ7guYzguJfguLHguJrguYPguKvguYnguYTguKHguYjguJXguKPguIfguIHguLHguJkKICBwcmljZS5zdHlsZS5iYWNrZ3JvdW5kID0gJ3ZhcigtLXN1cmZhY2UtMiknOwogIHByaWNlLnRpdGxlID0gJ+C4',
  'hOC4tOC4lOC4iOC4suC4geC4o+C4suC4ouC4geC4suC4o+C5g+C4meC4muC4tOC4peC5g+C4q+C5ieC4reC4seC4leC5guC4meC4oeC4seC4leC4tCDigJQg4LmB4LiB4LmJ4LiX4Li14LmI4Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4LiiIOC4hOC5iOC4suC4',
  'quC5iOC4hyDguKvguKPguLfguK3guKrguYjguKfguJnguKXguJQnOwoKICB2YXIgaGludCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiaWxsSGludCcpOwogIGlmIChoaW50KSB7CiAgICBoaW50LmlubmVySFRNTCA9IG4gKyAnIOC4o+C4suC4ouC4geC4suC4',
  'oyDCtyDguITguYjguLLguKrguLTguJnguITguYnguLIgJyArIG1vbmV5KGxpbmVzU3VtKCksIDIpICsKICAgICAgKHNoaXAgPyAnICsg4LiE4LmI4Liy4Liq4LmI4LiHICcgKyBtb25leShzaGlwLCAyKSA6ICcnKSArCiAgICAgIChkaXNjID8gJyDiiJIg4Liq4LmI',
  '4Lin4LiZ4Lil4LiUICcgKyBtb25leShkaXNjLCAyKSA6ICcnKTsKICB9Cn0KCi8qKiDguK3guLHguJvguYDguJTguJXguIrguYjguK3guIfguJzguKXguKPguKfguKHguJfguLjguIHguIrguYjguK3guIfguYPguJnguJ/guK3guKPguYzguKHguJvguLHguIjguIjg',
  'uLjguJrguLHguJkgKi8KZnVuY3Rpb24gcmVjYWxjU3VtcygpewogIChGT1JNLnNwZWNzIHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uKGYpewogICAgaWYgKGYudHlwZSAhPT0gJ2NvbXB1dGVkJyB8fCAhZi5mcm9tKSByZXR1cm47CiAgICB2YXIgZWwgPSBkb2N1bWVu',
  'dC5nZXRFbGVtZW50QnlJZCgnZl8nICsgZi5rZXkpOwogICAgaWYgKCFlbCkgcmV0dXJuOwogICAgdmFyIHRvdGFsID0gMDsKICAgIGYuZnJvbS5mb3JFYWNoKGZ1bmN0aW9uKGspewogICAgICB2YXIgaSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmXycgKyBr',
  'KTsKICAgICAgaWYgKGkpIHRvdGFsICs9IE51bWJlcihpLnZhbHVlKSB8fCAwOwogICAgfSk7CiAgICBlbC50ZXh0Q29udGVudCA9IHRvdGFsLnRvTG9jYWxlU3RyaW5nKCd0aC1USCcsIHsgbWluaW11bUZyYWN0aW9uRGlnaXRzOiAwLCBtYXhpbXVtRnJhY3Rpb25E',
  'aWdpdHM6IDIgfSkgKyAnIOC4vyc7CiAgICBlbC5zdHlsZS5jb2xvciA9IHRvdGFsID4gMCA/ICd2YXIoLS1vayknIDogJ3ZhcigtLW11dGVkKSc7CiAgfSk7Cn0KCmZ1bmN0aW9uIGV4aXN0aW5nRmlsZXNIdG1sKGtleSl7CiAgdmFyIGxpc3QgPSBGT1JNLmtlZXBb',
  'a2V5XSB8fCBbXTsKICBpZiAoIWxpc3QubGVuZ3RoKSByZXR1cm4gJyc7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJ0aHVtYnMgbWI4Ij4nICsgbGlzdC5tYXAoZnVuY3Rpb24odXJsLCBpKXsKICAgIHZhciBpZCA9IFN0cmluZyh1cmwpLm1hdGNoKC9bLVx3XXsyMCx9',
  'Lyk7CiAgICB2YXIgdGh1bWIgPSBpZCA/ICdodHRwczovL2RyaXZlLmdvb2dsZS5jb20vdGh1bWJuYWlsP2lkPScgKyBpZFswXSArICcmc3o9dzIwMCcgOiAnJzsKICAgIHJldHVybiAnPHNwYW4gc3R5bGU9InBvc2l0aW9uOnJlbGF0aXZlO2Rpc3BsYXk6aW5saW5l',
  'LWJsb2NrIj4nICsKICAgICAgKHRodW1iID8gJzxpbWcgY2xhc3M9InRodW1iIiBzcmM9IicgKyBlc2ModGh1bWIpICsgJyIgb25jbGljaz0id2luZG93Lm9wZW4oXCcnICsgZXNjKHVybCkgKyAnXCcsXCdfYmxhbmtcJykiPicKICAgICAgICAgICAgIDogJzxhIGNs',
  'YXNzPSJiIGluZm8iIGhyZWY9IicgKyBlc2ModXJsKSArICciIHRhcmdldD0iX2JsYW5rIj7guYTguJ/guKXguYwgJyArIChpKzEpICsgJzwvYT4nKSArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgb25jbGljaz0iZHJvcEZpbGUoXCcnICsga2V5ICsgJ1wn',
  'LCcgKyBpICsgJykiIHRpdGxlPSLguYDguK3guLLguK3guK3guIEiICcgKwogICAgICAnc3R5bGU9InBvc2l0aW9uOmFic29sdXRlO3RvcDotNnB4O3JpZ2h0Oi02cHg7YmFja2dyb3VuZDp2YXIoLS1kYW5nZXIpO2NvbG9yOiNmZmY7Ym9yZGVyOjA7Ym9yZGVyLXJh',
  'ZGl1czo5OXB4O3dpZHRoOjE4cHg7aGVpZ2h0OjE4cHg7bGluZS1oZWlnaHQ6MTtjdXJzb3I6cG9pbnRlcjtmb250LXNpemU6MTJweCI+w5c8L2J1dHRvbj4nICsKICAgICAgJzwvc3Bhbj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIGRy',
  'b3BGaWxlKGtleSwgaWR4KXsKICBGT1JNLmtlZXBba2V5XS5zcGxpY2UoaWR4LCAxKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl8nICsga2V5ICsgJ19leGlzdGluZycpLmlubmVySFRNTCA9IGV4aXN0aW5nRmlsZXNIdG1sKGtleSk7Cn0KCmZ1bmN0aW9u',
  'IHByZXZpZXdQaWNrZWQoaW5wdXQsIGlkKXsKICB2YXIgYm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQgKyAnX3ByZXZpZXcnKTsKICB2YXIgZmlsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChpbnB1dC5maWxlcyB8fCBbXSk7CiAgYm94Lmlu',
  'bmVySFRNTCA9IGZpbGVzLm1hcChmdW5jdGlvbihmKXsKICAgIHJldHVybiAnPHNwYW4gY2xhc3M9ImIgaW5mbyI+JyArIGVzYyhmLm5hbWUuc2xpY2UoMCwyNikpICsgJyDCtyAnICsgTWF0aC5yb3VuZChmLnNpemUvMTAyNCkgKyAnIEtCPC9zcGFuPic7CiAgfSku',
  'am9pbignICcpOwoKICB2YXIgc2xvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkICsgJ19vY3InKTsKICBpZiAoIXNsb3QpIHJldHVybjsKICBzbG90LmlubmVySFRNTCA9ICcnOwogIGlmICghb2NyVXNhYmxlKCkgfHwgIWZpcnN0UmVhZGFibGUoZmlsZXMp',
  'KSByZXR1cm47CgogIHZhciBtb2RlID0gKFMuYm9vdC5zZXR0aW5ncyAmJiBTLmJvb3Quc2V0dGluZ3Mub2NyQXV0b2ZpbGwpIHx8ICfguJbguLLguKHguIHguYjguK3guJnguYDguJXguLTguKEnOwogIGlmIChtb2RlID09PSAn4LmE4Lih4LmI4LmA4LiV4Li04Lih',
  'JykgcmV0dXJuOwogIGlmIChtb2RlID09PSAn4LmA4LiV4Li04Lih4LmD4Lir4LmJ4LmA4Lil4LiiJykgcmV0dXJuIHJ1bk9jcihpZCwgdHJ1ZSk7CgogIHNsb3QuaW5uZXJIVE1MID0KICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSBtdDgi',
  'IG9uY2xpY2s9InJ1bk9jcihcJycgKyBpZCArICdcJykiPicgKwogICAgJ/CflI4g4Lit4LmI4Liy4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiI4Liy4LiB4Lij4Li54Lib4LiZ4Li14LmJIOC5geC4peC5ieC4p+C4iuC5iOC4p+C4ouC4geC4o+C4reC4geC5g+C4',
  'q+C5iTwvYnV0dG9uPic7Cn0KCi8qKiDguK3guYjguLLguJnguITguYjguLLguIjguLLguIHguJ/guK3guKPguYzguKEgKyDguK3guLHguJvguYLguKvguKXguJTguYTguJ/guKXguYzguYPguKvguKHguYgg4LmB4Lil4LmJ4Lin4LiE4Li34LiZIG9iamVjdCDguJ7g',
  'uKPguYnguK3guKHguJrguLHguJnguJfguLbguIEgKi8KZnVuY3Rpb24gcmVhZEZvcm0oc3BlY3MsIGJ1Y2tldCl7CiAgdmFyIG91dCA9IHt9OwogIHZhciB1cGxvYWRzID0gW107CgogIHNwZWNzLmZvckVhY2goZnVuY3Rpb24oZil7CiAgICBpZiAoZi50eXBlID09',
  'PSAnY29tcHV0ZWQnKSByZXR1cm47ICAgICAgICAgIC8vIOC4iuC5iOC4reC4h+C4hOC4s+C4meC4p+C4kyDguYTguKHguYjguJXguYnguK3guIfguJrguLHguJnguJfguLbguIEKICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmXycgKyBmLmtl',
  'eSk7CiAgICBpZiAoIWVsKSByZXR1cm47CiAgICBpZiAoZi50eXBlID09PSAnZmlsZXMnKSB7CiAgICAgIHVwbG9hZHMucHVzaCgKICAgICAgICB1cGxvYWRGaWxlcyhlbCwgYnVja2V0KS50aGVuKGZ1bmN0aW9uKHJlZnMpewogICAgICAgICAgb3V0W2Yua2V5XSA9',
  'IChGT1JNLmtlZXBbZi5rZXldIHx8IFtdKS5jb25jYXQocmVmcy5tYXAoZnVuY3Rpb24ocil7IHJldHVybiByLnVybDsgfSkpOwogICAgICAgIH0pCiAgICAgICk7CiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ3RvZG8nKSB7CiAgICAgIG91dFtmLmtleV0gPSBm',
  'b3JtYXRUb2RvVGV4dChGT1JNLnRvZG8pOwogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICdsaW5lcycpIHsKICAgICAgb3V0W2Yua2V5XSA9IGZvcm1hdExpbmVzVGV4dChGT1JNLmxpbmVzKTsKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnbnVtYmVyJyB8fCBm',
  'LnR5cGUgPT09ICdtb25leScpIHsKICAgICAgb3V0W2Yua2V5XSA9IGVsLnZhbHVlID09PSAnJyA/IG51bGwgOiBOdW1iZXIoZWwudmFsdWUpOwogICAgfSBlbHNlIHsKICAgICAgb3V0W2Yua2V5XSA9IGVsLnZhbHVlOwogICAgfQogIH0pOwoKICByZXR1cm4gUHJv',
  'bWlzZS5hbGwodXBsb2FkcykudGhlbihmdW5jdGlvbigpeyByZXR1cm4gb3V0OyB9KTsKfQoKLyoqIOC5guC4hOC4o+C4h+C4n+C4reC4o+C5jOC4oeC4oeC4suC4leC4o+C4kOC4suC4mTog4LmA4Lib4Li04LiUIG1vZGFsLCDguIjguLHguJTguIHguLLguKPguJvg',
  'uLjguYjguKHguJrguLHguJnguJfguLbguIEsIOC4o+C4teC5guC4q+C4peC4lOC4q+C4meC5ieC4siAqLwpmdW5jdGlvbiBvcGVuRm9ybShvcHRzKXsKICB2YXIgcmVjID0gb3B0cy5yZWNvcmQgfHwge307CiAgRk9STS5vY3IgPSBvcHRzLm9jciB8fCBudWxsOwog',
  'IEZPUk0ucmVjID0gcmVjLmlkID8gcmVjIDogbnVsbDsgICAvLyDguIjguLPguYTguKfguYnguKfguYjguLLguIHguLPguKXguLHguIfguYHguIHguYnguILguK3guIfguYDguJTguLTguKEg4Lir4Lij4Li34Lit4LiB4Liz4Lil4Lix4LiH4LmA4Lie4Li04LmI4Lih',
  '4LmD4Lir4Lih4LmICiAgb3Blbk1vZGFsKG9wdHMudGl0bGUsCiAgICBmaWVsZHNIdG1sKG9wdHMuZmllbGRzLCByZWMpLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsK',
  'ICAgIChyZWMuaWQgJiYgb3B0cy5vbkRlbGV0ZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4gZGdyIiBpZD0iZkRlbCI+4Lil4Lia4Lij4Liy4Lii4LiB4Liy4Lij4LiZ4Li14LmJPC9idXR0b24+JyA6ICcnKSArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgaWQ9',
  'ImZTYXZlIj4nICsgKHJlYy5pZCA/ICfguJrguLHguJnguJfguLbguIHguIHguLLguKPguYHguIHguYnguYTguIInIDogJ+C4muC4seC4meC4l+C4tuC4gScpICsgJzwvYnV0dG9uPicsCiAgICBvcHRzLndpZGUpOwoKICBpZiAocmVjLmlkICYmIG9wdHMub25EZWxl',
  'dGUpIHsKICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmRGVsJykub25jbGljayA9IGZ1bmN0aW9uKCl7IGNsb3NlTW9kYWwoKTsgb3B0cy5vbkRlbGV0ZShyZWMuaWQpOyB9OwogIH0KCiAgcmVjYWxjU3VtcygpOwogIHJlY2FsY0JpbGwoKTsKCiAgZG9jdW1l',
  'bnQuZ2V0RWxlbWVudEJ5SWQoJ2ZTYXZlJykub25jbGljayA9IGZ1bmN0aW9uKCl7CiAgICB2YXIgYnRuID0gdGhpczsKICAgIGJ0bi5kaXNhYmxlZCA9IHRydWU7CiAgICBidG4uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4',
  'peC4seC4h+C4muC4seC4meC4l+C4tuC4geKApic7CgogICAgcmVhZEZvcm0ob3B0cy5maWVsZHMsIG9wdHMuYnVja2V0IHx8ICdtaXNjJykudGhlbihmdW5jdGlvbihkYXRhKXsKICAgICAgdmFyIG1pc3NpbmcgPSBvcHRzLmZpZWxkcy5maWx0ZXIoZnVuY3Rpb24o',
  'Zil7CiAgICAgICAgcmV0dXJuIGYucmVxdWlyZWQgJiYgKGRhdGFbZi5rZXldID09IG51bGwgfHwgZGF0YVtmLmtleV0gPT09ICcnKTsKICAgICAgfSk7CiAgICAgIGlmIChtaXNzaW5nLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKCfguIHguKPguLjguJPguLLguIHg',
  'uKPguK3guIE6ICcgKyBtaXNzaW5nLm1hcChmdW5jdGlvbihmKXsgcmV0dXJuIGYubGFiZWw7IH0pLmpvaW4oJywgJykpOwoKICAgICAgdmFyIHJlY29yZCA9IE9iamVjdC5hc3NpZ24oe30sIG9wdHMuYmFzZSB8fCB7fSwgZGF0YSk7CiAgICAgIGlmIChyZWMuaWQp',
  'IHJlY29yZC5pZCA9IHJlYy5pZDsKICAgICAgcmV0dXJuIGNhbGxBcGkob3B0cy5hY3Rpb24sIE9iamVjdC5hc3NpZ24oeyByZWNvcmQ6IHJlY29yZCB9LCBvcHRzLmV4dHJhIHx8IHt9KSk7CiAgICB9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICAgIGNsb3NlTW9kYWwo',
  'KTsKICAgICAgLy8g4LiV4Lix4Lin4Lia4Lit4LiB4Liq4LiW4Liy4LiZ4Liw4Lih4Li44Lih4LiC4Lin4Liy4Lia4LiZ4LiC4Li24LmJ4LiZICLguJrguLHguJnguJfguLbguIHguYHguKXguYnguKciIOC5g+C4q+C5ieC4reC4ouC4ueC5iOC5geC4peC5ieC4pyDg',
  'uIjguLbguIfguYTguKHguYjguJXguYnguK3guIfguYDguJTguYnguIcgdG9hc3Qg4LiL4LmJ4LizCiAgICAgIC8vIOC5geC4peC5ieC4p+C4i+C4tOC4h+C4geC5jOC5gOC4h+C4teC4ouC4miDguYYg4LmE4Lih4LmI4Lil4LmJ4Liy4LiH4Lir4LiZ4LmJ4Liy4LmB',
  '4Lil4Liw4LmE4Lih4LmI4LmA4LiU4LmJ4LiH4LiB4Lil4Lix4Lia4LmE4Lib4Lia4LiZ4Liq4Li44LiUCiAgICAgIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKICAgICAgLy8g4Lif4Lit4Lij4LmM4Lih4LiX4Li14LmI4LmA4Lib4Li04LiU4Lih4Liy4LiI4Liy4LiB',
  '4Lir4LiZ4LmJ4Liy4LiV4LmI4Liy4LiH4Lit4Li34LmI4LiZICjguYDguIrguYjguJkg4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZ4LmD4LiZ4Lir4LiZ4LmJ4Liy4Lir4LmJ4Lit4LiHKSDguILguK3guYDguJvguLTguJTguKvguJnguYnguLLguJnguLHguYng',
  'uJnguIHguKXguLHguJrguITguLfguJkKICAgICAgaWYgKHR5cGVvZiBvcHRzLmFmdGVyID09PSAnZnVuY3Rpb24nKSBvcHRzLmFmdGVyKCk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgYnRuLmRpc2FibGVkID0gZmFsc2U7CiAgICAgIGJ0bi50ZXh0',
  'Q29udGVudCA9IHJlYy5pZCA/ICfguJrguLHguJnguJfguLbguIHguIHguLLguKPguYHguIHguYnguYTguIInIDogJ+C4muC4seC4meC4l+C4tuC4gSc7CiAgICAgIHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7CiAgICB9KTsKICB9Owp9CgovKiA9PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lit4LmI4Liy4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiI4Liy4LiB4Lij4Li54LibIChPQ1IpIOC5geC4peC5ieC4p+C4iuC5iOC4p+C4ouC4geC4o+C4reC4',
  'geC4n+C4reC4o+C5jOC4oQoKICAg4LiX4Li44LiB4LiE4LmI4Liy4LiX4Li14LmI4LmE4LiU4LmJ4LmA4Lib4LmH4LiZ4LmB4LiE4LmI4LiC4LmJ4Lit4LmA4Liq4LiZ4LitIOC4nOC4ueC5ieC5g+C4iuC5ieC4geC4lOC5gOC4leC4tOC4oeC5gOC4reC4h+C4l+C4',
  'teC4peC4sOC4iuC5iOC4reC4h+C4q+C4o+C4t+C4reC5gOC4leC4tOC4oeC4l+C4seC5ieC4h+C4q+C4oeC4lOC4geC5h+C5hOC4lOC5iQogICDguYHguKXguLDguYHguIHguYnguYTguILguJXguYjguK3guYTguJTguYnguYDguKrguKHguK0g4LmA4Lie4Lij4Liy',
  '4Liw4LiV4Lix4Lin4Lit4LmI4Liy4LiZ4Lie4Lil4Liy4LiU4LmE4LiU4LmJIOC5guC4lOC4ouC5gOC4ieC4nuC4suC4sOC4peC4suC4ouC4oeC4t+C4reC4geC4seC4muC4o+C4ueC4m+C5gOC4reC4teC4ouC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCnZhciBPQ1JfTUFYID0gOCAqIDEwMjQgKiAxMDI0OyAgIC8vIOC4o+C4ueC4m+C5g+C4q+C4jeC5iOC4geC4p+C5iOC4suC4meC4teC5ieC4quC5iOC4h+C5hOC4m+C4reC5iOC4suC4meC5geC4',
  'peC5ieC4p+C4oeC4seC4geC4q+C4oeC4lOC5gOC4p+C4peC4sgoKZnVuY3Rpb24gb2NyVXNhYmxlKCl7CiAgcmV0dXJuICEhKEZPUk0ub2NyICYmIFMuYm9vdCAmJiBTLmJvb3Quc2V0dGluZ3MgJiYgUy5ib290LnNldHRpbmdzLm9jckVuYWJsZWQpOwp9CgovKiog',
  '4Lij4Li54Lib4LmB4Lij4LiB4LiX4Li14LmI4Lie4Lit4Lit4LmI4Liy4LiZ4LmE4LiU4LmJICjguILguYnguLLguKHguYTguJ/guKXguYzguYPguKvguI3guYjguYDguIHguLTguJnguYHguKXguLDguYTguJ/guKXguYzguJfguLXguYjguYTguKHguYjguYPguIrg',
  'uYjguKPguLnguJsvUERGKSAqLwpmdW5jdGlvbiBmaXJzdFJlYWRhYmxlKGZpbGVzKXsKICBmb3IgKHZhciBpID0gMDsgaSA8IGZpbGVzLmxlbmd0aDsgaSsrKSB7CiAgICB2YXIgZiA9IGZpbGVzW2ldOwogICAgaWYgKGYuc2l6ZSA8PSBPQ1JfTUFYICYmIC9eaW1h',
  'Z2VcL3xwZGYkLy50ZXN0KGYudHlwZSB8fCAnJykpIHJldHVybiBmOwogIH0KICByZXR1cm4gbnVsbDsKfQoKLyoqCiAqIEBwYXJhbSB7c3RyaW5nfSBpZCAgaWQg4LiC4Lit4LiH4LiK4LmI4Lit4LiH4LmB4LiZ4Lia4LmE4Lif4Lil4LmMIOC5gOC4iuC5iOC4mSBm',
  'X3NsaXBzCiAqIEBwYXJhbSB7Ym9vbGVhbn0gYXV0byB0cnVlID0g4LmA4LiV4Li04Lih4LiK4LmI4Lit4LiH4LiX4Li14LmI4Lii4Lix4LiH4Lin4LmI4Liy4LiH4LmD4Lir4LmJ4LmA4Lil4Lii4LmC4LiU4Lii4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LiB4LiUCiAq',
  'LwpmdW5jdGlvbiBydW5PY3IoaWQsIGF1dG8pewogIHZhciBpbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTsKICB2YXIgc2xvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkICsgJ19vY3InKTsKICBpZiAoIWlucHV0IHx8ICFzbG90KSByZXR1',
  'cm47CgogIHZhciBmaWxlID0gZmlyc3RSZWFkYWJsZShBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChpbnB1dC5maWxlcyB8fCBbXSkpOwogIGlmICghZmlsZSkgeyBzbG90LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJoaW50IG10OCI+4LmE4Lih4LmI4Lih4Li1',
  '4Lij4Li54Lib4LiX4Li14LmI4Lit4LmI4Liy4LiZ4LmE4LiU4LmJICjguKPguK3guIfguKPguLHguJrguKPguLnguJvguKDguLLguJ7guYHguKXguLAgUERGIOC5hOC4oeC5iOC5gOC4geC4tOC4mSA4IE1CKTwvZGl2Pic7IHJldHVybjsgfQoKICBzbG90LmlubmVy',
  'SFRNTCA9ICc8ZGl2IGNsYXNzPSJvY3ItYm94Ij48ZGl2IGNsYXNzPSJoZCI+PHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4Lit4LmI4Liy4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiI4Liy4LiBICcgKwogICAgICAgICAgICAgICAg',
  'ICAgZXNjKGZpbGUubmFtZS5zbGljZSgwLCAyOCkpICsgJ+KApjwvZGl2PjwvZGl2Pic7CgogIHJlYWRBc0RhdGFVcmwoZmlsZSkudGhlbihmdW5jdGlvbihwKXsKICAgIHJldHVybiBjYWxsQXBpKCdvY3IucmVhZCcsIHsgZGF0YVVybDogcC5kYXRhVXJsLCBtaW1l',
  'VHlwZTogcC5taW1lVHlwZSB9KTsKICB9KS50aGVuKGZ1bmN0aW9uKHIpewogICAgc2xvdC5pbm5lckhUTUwgPSBvY3JCb3hIdG1sKGlkLCByKTsKICAgIE9DUl9MQVNUW2lkXSA9IHI7CiAgICBpZiAoYXV0bykgewogICAgICB2YXIgbiA9IG9jckFwcGx5QWxsKGlk',
  'LCB0cnVlKTsKICAgICAgdG9hc3QobiA/ICfguK3guYjguLLguJnguKPguLnguJvguYHguKXguYnguKcg4LmA4LiV4Li04Lih4LmD4Lir4LmJICcgKyBuICsgJyDguIrguYjguK3guIcg4oCUIOC4leC4o+C4p+C4iOC4lOC4ueC4geC5iOC4reC4meC4muC4seC4meC4',
  'l+C4tuC4geC4meC4sCcgOiAn4Lit4LmI4Liy4LiZ4Lij4Li54Lib4LmB4Lil4LmJ4LinIOC5geC4leC5iOC4ouC4seC4h+C4iOC4seC4muC4hOC5iOC4suC4l+C4teC5iOC5g+C4iuC5ieC5hOC4lOC5ieC5hOC4oeC5iOC5hOC4lOC5iScsIG4gPyAnb2snIDogJycp',
  'OwogICAgfQogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgc2xvdC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz0ib2NyLWJveCI+PGRpdiBjbGFzcz0iaGQiPuKaoO+4jyDguK3guYjguLLguJnguKPguLnguJvguYTguKHguYjguKrguLPguYDguKPguYfguIg8L2Rp',
  'dj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImhpbnQiPicgKyBlc2MoZS5tZXNzYWdlIHx8IGUpICsgJzwvZGl2PicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20gbXQ4IiBvbmNsaWNrPSJydW5PY3IoXCcnICsgaWQgKyAnXCcpIj7g',
  'uKXguK3guIfguK3guLXguIHguITguKPguLHguYnguIc8L2J1dHRvbj48L2Rpdj4nOwogIH0pOwp9Cgp2YXIgT0NSX0xBU1QgPSB7fTsKCi8qKiDguITguYjguLLguJfguLXguYjguK3guYjguLLguJnguYTguJTguYkg4LiE4Li54LmI4LiB4Lix4Lia4LiK4LmI4Lit',
  '4LiH4LmD4LiZ4Lif4Lit4Lij4LmM4Lih4LiX4Li14LmI4LiI4Liw4LmA4Lit4Liy4LmE4Lib4LmD4Liq4LmIICovCmZ1bmN0aW9uIG9jclBhaXJzKHIpewogIHZhciBtID0gRk9STS5vY3IgfHwge307CiAgdmFyIGcgPSByLmd1ZXNzIHx8IHt9OwogIHZhciBvdXQg',
  'PSBbXTsKICBpZiAobS5kYXRlICAgJiYgZy5kYXRlKSAgIG91dC5wdXNoKHsgZmllbGQ6IG0uZGF0ZSwgICBsYWJlbDogJ+C4p+C4seC4meC4l+C4teC5iCcsICAgICB2YWx1ZTogZy5kYXRlLCAgIHNob3c6IHRoRGF0ZShnLmRhdGUpIH0pOwogIGlmIChtLmFtb3Vu',
  'dCAmJiBnLmFtb3VudCkgb3V0LnB1c2goeyBmaWVsZDogbS5hbW91bnQsIGxhYmVsOiAn4LiI4Liz4LiZ4Lin4LiZ4LmA4LiH4Li04LiZJywgIHZhbHVlOiBnLmFtb3VudCwgc2hvdzogYmFodChnLmFtb3VudCkgfSk7CiAgaWYgKG0udmVuZG9yICYmIGcudmVuZG9y',
  'KSBvdXQucHVzaCh7IGZpZWxkOiBtLnZlbmRvciwgbGFiZWw6ICfguKPguYnguLLguJkv4Lic4Li54LmJ4LiC4Liy4LiiJywgdmFsdWU6IGcudmVuZG9yLCBzaG93OiBnLnZlbmRvciB9KTsKICBpZiAobS50aXRsZSAgJiYgZy50aXRsZSkgIG91dC5wdXNoKHsgZmll',
  'bGQ6IG0udGl0bGUsICBsYWJlbDogJ+C4iuC4t+C5iOC4reC4o+C4suC4ouC4geC4suC4oycsICB2YWx1ZTogZy50aXRsZSwgIHNob3c6IGcudGl0bGUgfSk7CiAgaWYgKG0ubm90ZSAgICYmIGcucmVmKSAgICBvdXQucHVzaCh7IGZpZWxkOiBtLm5vdGUsICAgbGFi',
  'ZWw6ICfguYDguKXguILguK3guYnguLLguIfguK3guLTguIcnLCAgdmFsdWU6ICfguK3guYnguLLguIfguK3guLTguIcgJyArIGcucmVmLCBzaG93OiBnLnJlZiB9KTsKICAvLyDguYPguJrguYDguKrguKPguYfguIjguKvguKXguLLguKLguKPguLLguKLguIHguLLg',
  'uKMKICBpZiAoZy5pdGVtcyAmJiBnLml0ZW1zLmxlbmd0aCA+IDEpIHsKICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9saW5lcycpKSB7CiAgICAgIC8vIOC4n+C4reC4o+C5jOC4oeC4meC4teC5ieC4oeC4teC4leC4suC4o+C4suC4h+C4o+C4suC4',
  'ouC4geC4suC4o+C4ouC5iOC4reC4oiDigJQg4LmA4LiV4Li04Lih4Lil4LiH4LiV4Liy4Lij4Liy4LiH4LmA4Lil4LiiIOC5hOC4lOC5ieC4l+C4seC5ieC4h+C4iuC4t+C5iOC4rSDguIjguLPguJnguKfguJkg4LmB4Lil4Liw4Lij4Liy4LiE4Liy4LmB4Lii4LiB',
  '4LiB4Lix4LiZCiAgICAgIG91dC5wdXNoKHsgZmllbGQ6ICdfbGluZXMnLCBsYWJlbDogJ+C4o+C4suC4ouC4geC4suC4o+C5g+C4meC4muC4tOC4pScsIHZhbHVlOiBnLml0ZW1zLAogICAgICAgICAgICAgICAgIHNob3c6ICfguYDguJXguLTguKEgJyArIGcuaXRl',
  'bXMubGVuZ3RoICsgJyDguKPguLLguKLguIHguLLguKPguKXguIfguJXguLLguKPguLLguIcnLCBsaW5lczogdHJ1ZSB9KTsKICAgIH0gZWxzZSBpZiAobS50aXRsZSkgewogICAgICB2YXIgbGluZXMgPSBnLml0ZW1zLm1hcChmdW5jdGlvbihpdCwgaSl7IHJldHVy',
  'biAoaSsxKSArICcuJyArIGl0Lm5hbWUgKyAnICcgKyBtb25leShpdC5wcmljZSwgMikgKyAnIOC4vyc7IH0pLmpvaW4oJ1xuJyk7CiAgICAgIG91dC5wdXNoKHsgZmllbGQ6IG0udGl0bGUsIGxhYmVsOiAn4LiX4Li44LiB4Lij4Liy4Lii4LiB4Liy4LijICgnICsg',
  'Zy5pdGVtcy5sZW5ndGggKyAnKScsIHZhbHVlOiBsaW5lcywKICAgICAgICAgICAgICAgICBzaG93OiBnLml0ZW1zLmxlbmd0aCArICcg4Lij4Liy4Lii4LiB4Liy4Lij4LmD4LiZ4LmD4Lia4LmA4Liq4Lij4LmH4LiIJywgbXVsdGk6IHRydWUgfSk7CiAgICB9CiAg',
  'fQogIHJldHVybiBvdXQ7Cn0KCmZ1bmN0aW9uIG9jckJveEh0bWwoaWQsIHIpewogIHZhciBwYWlycyA9IG9jclBhaXJzKHIpOwogIGlmICghcGFpcnMubGVuZ3RoKSB7CiAgICByZXR1cm4gJzxkaXYgY2xhc3M9Im9jci1ib3giPjxkaXYgY2xhc3M9ImhkIj7wn5SO',
  'IOC4reC5iOC4suC4meC4guC5ieC4reC4hOC4p+C4suC4oeC5hOC4lOC5iSDguYHguJXguYjguKLguLHguIfguIjguLHguJrguITguYjguLLguJfguLXguYjguYPguIrguYnguYTguJTguYnguYTguKHguYjguYTguJTguYknICsKICAgICAgJzxzcGFuIGNsYXNzPSJz',
  'cCI+PGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9Im9jclRvZ2dsZVJhdyhcJycgKyBpZCArICdcJykiPuC4lOC4ueC4guC5ieC4reC4hOC4p+C4suC4oeC4l+C4teC5iOC4reC5iOC4suC4meC5hOC4lOC5iTwvYnV0dG9uPjwvc3Bh',
  'bj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9Im9jci1yYXciIGlkPSInICsgaWQgKyAnX3JhdyIgaGlkZGVuPicgKyBlc2Moci50ZXh0IHx8ICco4Lin4LmI4Liy4LiHKScpICsgJzwvZGl2PjwvZGl2Pic7CiAgfQogIHJldHVybiAnPGRpdiBjbGFzcz0ib2Ny',
  'LWJveCI+JyArCiAgICAnPGRpdiBjbGFzcz0iaGQiPvCflI4g4Lit4LmI4Liy4LiZ4LiI4Liy4LiB4Lij4Li54Lib4LmE4LiU4LmJ4LmB4Lia4Lia4LiZ4Li14LmJIOKAlCDguIHguJTguYDguJXguLTguKHguIrguYjguK3guIfguJfguLXguYjguJXguYnguK3guIfg',
  'uIHguLLguKMnICsKICAgICAgJzxzcGFuIGNsYXNzPSJzcCI+JyArCiAgICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIHByaSIgb25jbGljaz0ib2NyQXBwbHlBbGwoXCcnICsgaWQgKyAnXCcpIj7guYDguJXguLTguKHguJfguLHguYng',
  'uIfguKvguKHguJQ8L2J1dHRvbj4nICsKICAgICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9Im9jclRvZ2dsZVJhdyhcJycgKyBpZCArICdcJykiPuC4guC5ieC4reC4hOC4p+C4suC4oeC5gOC4leC5h+C4oTwvYnV0dG9u',
  'PicgKwogICAgICAnPC9zcGFuPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9Im9jci1oaXRzIj4nICsgcGFpcnMubWFwKGZ1bmN0aW9uKHAsIGkpewogICAgICByZXR1cm4gJzxkaXYgY2xhc3M9Im9jci1oaXQiPicgKwogICAgICAgICc8c3BhbiBjbGFzcz0iayI+',
  'JyArIGVzYyhwLmxhYmVsKSArICc8L3NwYW4+JyArCiAgICAgICAgJzxzcGFuIGNsYXNzPSJ2IiB0aXRsZT0iJyArIGVzYyhwLmxpbmVzID8gcC5zaG93IDogU3RyaW5nKHAudmFsdWUpKSArICciPicgKyBlc2MocC5zaG93KSArICc8L3NwYW4+JyArCiAgICAgICAg',
  'JzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJvY3JBcHBseU9uZShcJycgKyBpZCArICdcJywnICsgaSArICcpIj7guYDguJXguLTguKE8L2J1dHRvbj4nICsKICAgICAgJzwvZGl2Pic7CiAgICB9KS5qb2luKCcnKSArICc8L2Rp',
  'dj4nICsKICAgICc8ZGl2IGNsYXNzPSJvY3ItcmF3IiBpZD0iJyArIGlkICsgJ19yYXciIGhpZGRlbj4nICsgZXNjKHIudGV4dCB8fCAnKOC4p+C5iOC4suC4hyknKSArICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJoaW50IG10OCI+4LiV4Lij4Lin4LiI4LiE',
  '4Lin4Liy4Lih4LiW4Li54LiB4LiV4LmJ4Lit4LiH4LiB4LmI4Lit4LiZ4Lia4Lix4LiZ4LiX4Li24LiB4LmA4Liq4Lih4LitIOKAlCDguYHguIHguYnguYPguJnguIrguYjguK3guIfguYTguJTguYnguJXguLLguKHguJvguIHguJXguLQ8L2Rpdj4nICsKICAnPC9k',
  'aXY+JzsKfQoKZnVuY3Rpb24gb2NyVG9nZ2xlUmF3KGlkKXsKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCArICdfcmF3Jyk7CiAgaWYgKGVsKSBlbC5oaWRkZW4gPSAhZWwuaGlkZGVuOwp9CgovKiog4LmD4Liq4LmI4LiE4LmI4Liy4Lil4LiH',
  '4LiK4LmI4Lit4LiHIOC5geC4peC5ieC4p+C5hOC4ruC5hOC4peC4leC5jOC5g+C4q+C5ieC5gOC4q+C5h+C4meC4p+C5iOC4suC4iuC5iOC4reC4h+C5hOC4q+C4meC4luC4ueC4geC5gOC4leC4tOC4oSAqLwpmdW5jdGlvbiBvY3JGaWxsKGZpZWxkS2V5LCB2YWx1',
  'ZSl7CiAgLy8g4LmA4LiV4Li04Lih4Lil4LiH4LiV4Liy4Lij4Liy4LiH4Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4LiiICjguYPguJrguYDguKrguKPguYfguIjguJfguLXguYjguKHguLXguILguK3guIfguKvguKXguLLguKLguK3guKLguYjguLLguIcpCiAg',
  'aWYgKGZpZWxkS2V5ID09PSAnX2xpbmVzJykgewogICAgdmFyIGFkZCA9ICh2YWx1ZSB8fCBbXSkubWFwKGZ1bmN0aW9uKGl0KXsKICAgICAgcmV0dXJuIHsgbmFtZTogaXQubmFtZSwgcXR5OiAxLCB1bml0OiAnJywgcHJpY2U6IE51bWJlcihpdC5wcmljZSkgfHwg',
  'MCB9OwogICAgfSk7CiAgICBpZiAoIWFkZC5sZW5ndGgpIHJldHVybiBmYWxzZTsKICAgIEZPUk0ubGluZXMgPSAoRk9STS5saW5lcyB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uKGwpeyByZXR1cm4gU3RyaW5nKGwubmFtZSB8fCAnJykudHJpbSgpOyB9KS5jb25jYXQo',
  'YWRkKTsKICAgIHJlZHJhd0xpbmVzKCk7CiAgICB2YXIgYm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfbGluZXMnKTsKICAgIGlmIChib3gpIHsKICAgICAgYm94LmNsYXNzTGlzdC5hZGQoJ29jci1maWxsZWQnKTsKICAgICAgc2V0VGltZW91dChmdW5j',
  'dGlvbigpeyBib3guY2xhc3NMaXN0LnJlbW92ZSgnb2NyLWZpbGxlZCcpOyB9LCAxNjAwKTsKICAgIH0KICAgIHJldHVybiB0cnVlOwogIH0KCiAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyArIGZpZWxkS2V5KTsKICBpZiAoIWVsKSByZXR1',
  'cm4gZmFsc2U7CiAgZWwudmFsdWUgPSB2YWx1ZTsKICBlbC5jbGFzc0xpc3QuYWRkKCdvY3ItZmlsbGVkJyk7CiAgc2V0VGltZW91dChmdW5jdGlvbigpeyBlbC5jbGFzc0xpc3QucmVtb3ZlKCdvY3ItZmlsbGVkJyk7IH0sIDE2MDApOwogIHJlY2FsY1N1bXMoKTsK',
  'ICByZXR1cm4gdHJ1ZTsKfQoKZnVuY3Rpb24gb2NyQXBwbHlPbmUoaWQsIGlkeCl7CiAgdmFyIHIgPSBPQ1JfTEFTVFtpZF07CiAgaWYgKCFyKSByZXR1cm47CiAgdmFyIHAgPSBvY3JQYWlycyhyKVtpZHhdOwogIGlmIChwICYmIG9jckZpbGwocC5maWVsZCwgcC52',
  'YWx1ZSkpIHsKICAgIHRvYXN0KHAubGluZXMgPyAn4LmA4LiV4Li04LihICcgKyBwLnZhbHVlLmxlbmd0aCArICcg4Lij4Liy4Lii4LiB4Liy4Lij4Lil4LiH4Lia4Li04Lil4LmB4Lil4LmJ4LinIOKAlCDguJXguKPguKfguIjguIjguLPguJnguKfguJnguIHguLHg',
  'uJrguKPguLLguITguLLguK3guLXguIHguITguKPguLHguYnguIcnIDogJ+C5gOC4leC4tOC4oScgKyBwLmxhYmVsICsgJ+C5geC4peC5ieC4pycsICdvaycpOwogIH0KfQoKLyoqCiAqIEBwYXJhbSB7Ym9vbGVhbn0gb25seUVtcHR5IHRydWUgPSDguYDguJXguLTg',
  'uKHguYDguInguJ7guLLguLDguIrguYjguK3guIfguJfguLXguYjguKLguLHguIfguKfguYjguLLguIcgKOC5g+C4iuC5ieC4leC4reC4meC5gOC4leC4tOC4oeC4reC4seC4leC5guC4meC4oeC4seC4leC4tAogKiAgICAgICAgICAgICAgICAgICAgICAgICAgICDg',
  'uIjguLDguYTguJTguYnguYTguKHguYjguJfguLHguJrguKrguLTguYjguIfguJfguLXguYjguJzguLnguYnguYPguIrguYnguJ7guLTguKHguJ7guYzguYTguJvguYHguKXguYnguKcpCiAqIEByZXR1cm4ge251bWJlcn0g4LiI4Liz4LiZ4Lin4LiZ4LiK4LmI4Lit',
  '4LiH4LiX4Li14LmI4LmA4LiV4Li04Lih4LiI4Lij4Li04LiHCiAqLwpmdW5jdGlvbiBvY3JBcHBseUFsbChpZCwgb25seUVtcHR5KXsKICB2YXIgciA9IE9DUl9MQVNUW2lkXTsKICBpZiAoIXIpIHJldHVybiAwOwogIHZhciBkb25lID0ge307CiAgdmFyIG4gPSAw',
  'OwogIG9jclBhaXJzKHIpLmZvckVhY2goZnVuY3Rpb24ocCl7CiAgICBpZiAoZG9uZVtwLmZpZWxkXSkgcmV0dXJuOyAgICAgICAgICAgICAgICAgICAgICAgLy8g4LiK4LmI4Lit4LiH4LmA4LiU4Li14Lii4Lin4LiB4Lix4LiZ4LmA4LiV4Li04Lih4LiE4Lij4Lix',
  '4LmJ4LiH4LmA4LiU4Li14Lii4LinIOC5gOC4reC4suC4leC4seC4p+C5geC4o+C4gQogICAgaWYgKHAuZmllbGQgPT09ICdfbGluZXMnKSB7CiAgICAgIC8vIOC4leC4suC4o+C4suC4h+C4o+C4suC4ouC4geC4suC4o+C4ouC5iOC4reC4ojogIuC4p+C5iOC4suC4',
  'hyIg4Lir4Lih4Liy4Lii4LiW4Li24LiH4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4LiV4Lix4LmJ4LiH4LiK4Li34LmI4Lit4LmE4Lin4LmJCiAgICAgIGlmIChvbmx5RW1wdHkgJiYgKEZPUk0ubGluZXMgfHwgW10p',
  'LnNvbWUoZnVuY3Rpb24obCl7IHJldHVybiBTdHJpbmcobC5uYW1lIHx8ICcnKS50cmltKCk7IH0pKSByZXR1cm47CiAgICB9IGVsc2UgewogICAgICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl8nICsgcC5maWVsZCk7CiAgICAgIGlmICghZWwp',
  'IHJldHVybjsKICAgICAgaWYgKG9ubHlFbXB0eSAmJiBTdHJpbmcoZWwudmFsdWUgfHwgJycpLnRyaW0oKSAhPT0gJycpIHJldHVybjsKICAgIH0KICAgIGlmIChvY3JGaWxsKHAuZmllbGQsIHAudmFsdWUpKSB7IGRvbmVbcC5maWVsZF0gPSB0cnVlOyBuKys7IH0K',
  'ICB9KTsKICBpZiAoIW9ubHlFbXB0eSkgdG9hc3QobiA/ICfguYDguJXguLTguKHguYPguKvguYkgJyArIG4gKyAnIOC4iuC5iOC4reC4h+C5geC4peC5ieC4pyDigJQg4LiV4Lij4Lin4LiI4LiU4Li54LiB4LmI4Lit4LiZ4Lia4Lix4LiZ4LiX4Li24LiBJyA6ICfg',
  'uIrguYjguK3guIfguJfguLXguYjguIjguLDguYDguJXguLTguKHguYTguKHguYjguK3guKLguLnguYjguYPguJnguJ/guK3guKPguYzguKHguJnguLXguYknLCBuID8gJ29rJyA6ICdlcnInKTsKICByZXR1cm4gbjsKfQoKZnVuY3Rpb24gcm9vbU9wdGlvbnMoKXsg',
  'cmV0dXJuIFMuYm9vdCA/IFMuYm9vdC5yb29tcyA6IFtdOyB9CmZ1bmN0aW9uIG9wdChuYW1lKXsgcmV0dXJuIChTLmJvb3QgJiYgUy5ib290LnNjaGVtYVtuYW1lXSkgfHwgW107IH0KZnVuY3Rpb24gdG9kYXkoKXsgcmV0dXJuIG5ldyBEYXRlKCkudG9JU09TdHJp',
  'bmcoKS5zbGljZSgwLDEwKTsgfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJCiAgID09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtRGVidChyZWMsIGxlZGdlcil7CiAgLy8g4LmA4Lil4Li34Lit4LiB4LmB4Lih4LmI4LmE4LiU4LmJ4LiI4Liy4LiB4LiX4Li44LiB4Lia4Lix4LiN4LiK4Li1',
  'IOC4ouC4geC5gOC4p+C5ieC4meC4leC4seC4p+C5gOC4reC4hwogIHZhciBhbGwgPSAoQUxMX0RFQlRTIHx8IFtdKS5maWx0ZXIoZnVuY3Rpb24oZCl7IHJldHVybiAhcmVjIHx8IGQuaWQgIT09IHJlYy5pZDsgfSk7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJl',
  'YyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJJyA6ICfguYDguJ7guLTguYjguKHguIHguYnguK3guJnguKvguJnguLXguYknLAogICAgcmVjb3JkOiByZWMsIGFjdGlvbjogJ2RlYnQuc2F2ZScsIGJhc2U6IHsgbGVk',
  'Z2VyOiBsZWRnZXIgfSwKICAgIG9uRGVsZXRlOiBkZWxEZWJ0LAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oid0aXRsZScsICAgIGxhYmVsOifguKPguLLguKLguIHguLLguKPguKvguJnguLXguYknLCByZXF1aXJlZDp0cnVlLCBmdWxsOnRydWUsIHBoOifguYDg',
  'uIrguYjguJkg4LiE4LmI4Liy4LiB4LmI4Lit4Liq4Lij4LmJ4Liy4LiHIFRoZSBNIENvcm5lciBBUCcgfSwKICAgICAgeyBrZXk6J2xlZGdlcicsICAgbGFiZWw6J+C4m+C4o+C4sOC5gOC4oOC4l+C4muC4seC4jeC4iuC4tScsIHR5cGU6J3NlbGVjdCcsIG9wdGlv',
  'bnM6WyfguKvguJnguLXguYnguKvguKXguLHguIEnLCfguKvguJnguLXguYnguKPguK3guIcnXSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J2NyZWRpdG9yJywgbGFiZWw6J+C5gOC4iOC5ieC4suC4q+C4meC4teC5iScsIHBoOifguYDguIrguYjguJkg4LiE',
  '4Lij4Lit4Lia4LiE4Lij4Lix4LinIC8g4LiY4LiZ4Liy4LiE4Liy4LijIC8g4Lib4LmJ4Liy4LiV4LiyJyB9LAogICAgICB7IGtleToncGFyZW50SWQnLCBsYWJlbDon4LmA4Lib4LmH4LiZ4Liq4LmI4Lin4LiZ4Lir4LiZ4Li24LmI4LiH4LiC4Lit4LiH4LiB4LmJ',
  '4Lit4LiZ4Lir4LiZ4Li14LmJJywgdHlwZTonc2VsZWN0JywgZnVsbDp0cnVlLAogICAgICAgIG9wdGlvbnM6IGFsbC5tYXAoZnVuY3Rpb24oZCl7IHJldHVybiB7IHZhbHVlOmQuaWQsIGxhYmVsOmQudGl0bGUgKyAnICgnICsgZC5sZWRnZXIgKyAnKScgfTsgfSks',
  'CiAgICAgICAgaGludDon4LmD4LiK4LmJ4LmA4Lih4Li34LmI4Lit4LmA4LiH4Li04LiZ4LiB4LmJ4Lit4LiZ4LiZ4Li14LmJ4LmA4Lib4LmH4LiZ4LiX4Li44LiZ4LiC4Lit4LiH4Lit4Li14LiB4LiB4LmJ4Lit4LiZIOC5gOC4iuC5iOC4mSDguYDguIfguLTguJng',
  'uKLguLfguKHguJvguYnguLLguJXguLLguYDguJvguYfguJnguKrguYjguKfguJnguKvguJnguLbguYjguIfguILguK3guIfguKvguJnguLXguYnguIvguLfguYnguK3guJfguLXguYjguJTguLTguJkg4oCUICcgKwogICAgICAgICAgICAgJ+C4iOC5iOC4suC4ouC4',
  'hOC4t+C4meC4geC5ieC4reC4meC4meC4teC5ieC5geC4peC5ieC4p+C4geC5ieC4reC4meC5geC4oeC5iOC4iOC4sOC4peC4lOC4leC4suC4oeC5hOC4m+C4lOC5ieC4p+C4oiDguYHguKXguLDguKLguK3guJTguKPguKfguKHguIjguLDguYTguKHguYjguJbguLng',
  'uIHguJnguLHguJrguIvguYnguLMnIH0sCiAgICAgIHsga2V5OidzdGFydERhdGUnLCBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiB4LmI4Lit4Lir4LiZ4Li14LmJJywgdHlwZTonZGF0ZScgfSwKICAgICAgeyBrZXk6J3ByaW5jaXBhbCcsIGxhYmVsOifguKLg',
  'uK3guJTguKvguJnguLXguYnguJXguLHguYnguIfguJXguYnguJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHJlcXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J2ludGVyZXN0UGVyTW9udGgnLCBsYWJlbDon4LiU4Lit4LiB4LmA4Lia4Li14LmJ4Lii4LiV',
  '4LmI4Lit4LmA4LiU4Li34Lit4LiZICjguJrguLLguJcpJywgdHlwZTonbW9uZXknIH0sCiAgICAgIHsga2V5OidwbGFuUGVyTW9udGgnLCBsYWJlbDon4Lii4Lit4LiU4Lic4LmI4Lit4LiZ4LiV4LmI4Lit4LmA4LiU4Li34Lit4LiZICjguJrguLLguJcpJywgdHlw',
  'ZTonbW9uZXknIH0sCiAgICAgIHsga2V5OidkdWVEYXknLCAgIGxhYmVsOifguIHguLPguKvguJnguJTguIrguLPguKPguLAgKOC4p+C4seC4meC4l+C4teC5iOC4guC4reC4h+C5gOC4lOC4t+C4reC4mSknLCB0eXBlOidudW1iZXInLCBwaDonMjAnIH0sCiAgICAg',
  'IHsga2V5OidzdGF0dXMnLCAgIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnZGVidFN0YXR1c2VzJyksIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICAgIGxhYmVsOifguKvguKHguLLguKLguYDg',
  'uKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7CiAgaWYgKCFyZWMpIHsgdmFyIGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9sZWRnZXInKTsgaWYgKGUpIGUudmFsdWUgPSBsZWRnZXI7IH0KfQoKZnVuY3Rpb24g',
  'ZGVsRGVidChpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJ4LiZ4Li14LmJPyDguKPguLLguKLguIHguLLguKPguIrguLPguKPguLDguJfguLXguYjguJzguLnguIHguYTguKfguYnguIjguLDguKLguLHguIfguK3guKLg',
  'uLnguYgnLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgnZGVidC5kZWxldGUnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7IH0pCiAgICAgIC5jYXRjaChm',
  'dW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3guKPguYzguKE6IOC4o+C4suC4ouC4geC4',
  'suC4o+C5guC4reC4meC5g+C4iuC5ieC4q+C4meC4teC5iQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybURlYnRQYXltZW50KHJlYywgbGVkZ2VyKXsKICB2YXIgZGVi',
  'dHMgPSAoUy5jYWNoZVtTLnBhZ2VdICYmIFMuY2FjaGVbUy5wYWdlXS5kZWJ0cykgfHwgW107CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4Lij4Liy4Lii4LiB4Liy4Lij4LiK4Liz4Lij4LiwJyA6ICfguJrg',
  'uLHguJnguJfguLbguIHguIHguLLguKPguYLguK3guJnguYPguIrguYnguKvguJnguLXguYknLAogICAgcmVjb3JkOiByZWMgfHwgeyBwYXlEYXRlOiB0b2RheSgpLCBjaGFubmVsOiAn4LmC4Lit4LiZIFFSJyB9LAogICAgYWN0aW9uOiAnZGVidC5zYXZlUGF5bWVu',
  'dCcsIGJhc2U6IHsgbGVkZ2VyOiBsZWRnZXIgfSwgYnVja2V0OiAnZGVidCcsCiAgICBvY3I6IHsgZGF0ZToncGF5RGF0ZScsIGFtb3VudDoncHJpbmNpcGFsJywgbm90ZTonbm90ZScgfSwKICAgIG9uRGVsZXRlOiBkZWxEZWJ0UGF5bWVudCwKICAgIGZpZWxkczog',
  'WwogICAgICB7IGtleToncGF5RGF0ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguIrguLPguKPguLAnLCB0eXBlOidkYXRlJywgcmVxdWlyZWQ6dHJ1ZSB9LAogICAgICB7IGtleTonY2hhbm5lbCcsIGxhYmVsOifguIrguYjguK3guIfguJfguLLguIcnLCB0',
  'eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncGF5Q2hhbm5lbHMnKSB9LAogICAgICB7IGtleToncHJpbmNpcGFsJywgbGFiZWw6J+C5gOC4h+C4tOC4meC4leC5ieC4mSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5Jywgc3Vtczp0cnVlLAogICAgICAgIGhpbnQ6',
  'J+C4quC5iOC4p+C4meC4l+C4teC5iOC5hOC4m+C4peC4lOC4ouC4reC4lOC4q+C4meC4teC5ieC4iOC4o+C4tOC4hycgfSwKICAgICAgeyBrZXk6J2ludGVyZXN0JywgIGxhYmVsOifguJTguK3guIHguYDguJrguLXguYnguKIgKOC4muC4suC4lyknLCB0eXBlOidt',
  'b25leScsIHN1bXM6dHJ1ZSwKICAgICAgICBoaW50OifguYTguKHguYjguJbguLnguIHguJnguLPguYTguJvguKXguJTguKLguK3guJTguKvguJnguLXguYknIH0sCiAgICAgIHsga2V5OidfdG90YWwnLCAgbGFiZWw6J+C4o+C4p+C4oeC4l+C4teC5iOC5guC4reC4',
  'mScsIHR5cGU6J2NvbXB1dGVkJywgZnJvbTpbJ3ByaW5jaXBhbCcsJ2ludGVyZXN0J10sCiAgICAgICAgaGludDon4LiV4Lij4Lin4LiI4LmD4Lir4LmJ4LiV4Lij4LiH4LiB4Lix4Lia4Lii4Lit4LiU4LmD4LiZ4Liq4Lil4Li04LibIMK3IOC4o+C4sOC4muC4muC4',
  'hOC4tOC4lOC5g+C4q+C5ieC4reC4seC4leC5guC4meC4oeC4seC4leC4tCcgfSwKICAgICAgeyBrZXk6J2luc3RhbGxtZW50JywgbGFiZWw6J+C4h+C4p+C4lOC4l+C4teC5iCcsIHBoOifguYDguIrguYjguJkgOS8yNTY5JyB9LAogICAgICB7IGtleTonZGVidElk',
  'JywgIGxhYmVsOifguJzguLnguIHguIHguLHguJrguIHguYnguK3guJnguKvguJnguLXguYknLCB0eXBlOidzZWxlY3QnLAogICAgICAgIG9wdGlvbnM6IGRlYnRzLm1hcChmdW5jdGlvbihkKXsgcmV0dXJuIHsgdmFsdWU6ZC5pZCwgbGFiZWw6ZC50aXRsZSB9OyB9',
  'KSwKICAgICAgICBoaW50OifguYDguKfguYnguJnguKfguYjguLLguIfguYTguJTguYkg4oCUIOC4o+C4sOC4muC4muC4iOC4sOC4meC4seC4muC4o+C4p+C4oeC4l+C4seC5ieC4h+C4muC4seC4jeC4iuC4tScgfSwKICAgICAgeyBrZXk6J3BheWVyJywgICBsYWJl',
  'bDon4Lic4Li54LmJ4LiK4Liz4Lij4LiwJyB9LAogICAgICB7IGtleTonc2xpcHMnLCAgIGxhYmVsOifguKrguKXguLTguJvguIHguLLguKPguYLguK3guJknLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonbm90ZScsICAgIGxhYmVsOifg',
  'uKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbERlYnRQYXltZW50KGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguKPguLLguKLguIHguLLguKPguIrguLPguKPg',
  'uLDguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2RlYnQuZGVsZXRlUGF5bWVudCcsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkK',
  'ICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog',
  '4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtUHVyY2hhc2UocmVjKXsKICBvcGVuRm9ybSh7CiAg',
  'ICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguKPguLLguKLguIHguLLguKPguIvguLfguYnguK0nIDogJ+C5gOC4nuC4tOC5iOC4oeC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4hycsCiAgICByZWNvcmQ6IHJlYyB8',
  'fCB7IGJ1eURhdGU6IHRvZGF5KCkgfSwKICAgIGFjdGlvbjogJ3B1cmNoYXNlLnNhdmUnLCBidWNrZXQ6ICdwdXJjaGFzZXMnLCB3aWRlOiB0cnVlLAogICAgb2NyOiB7IGRhdGU6J2J1eURhdGUnLCBhbW91bnQ6J3ByaWNlJywgdmVuZG9yOid2ZW5kb3InLCB0aXRs',
  'ZTonaXRlbScgfSwKICAgIG9uRGVsZXRlOiBkZWxQdXJjaGFzZSwKICAgIGZpZWxkczogWwogICAgICB7IGtleTonaXRlbScsICAgIGxhYmVsOifguIrguLfguYjguK3guJrguLTguKUgLyDguKPguLLguKLguIHguLLguKPguKvguKXguLHguIEnLCB0eXBlOid0ZXh0',
  'YXJlYScsIHJlcXVpcmVkOnRydWUsIGZ1bGw6dHJ1ZSwKICAgICAgICBwaDon4LmA4LiK4LmI4LiZIOC4quC4seC5iOC4h+C4guC4reC4h+C5gOC4guC5ieC4suC4q+C4rSBTaG9wZWUg4Lij4LmJ4Liy4LiZIEFCQycsCiAgICAgICAgaGludDon4LiW4LmJ4Liy4LmD',
  '4Liq4LmI4Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4Lii4LiC4LmJ4Liy4LiH4Lil4LmI4Liy4LiH4LmE4Lin4LmJIOC5geC4peC5ieC4p+C5gOC4p+C5ieC4meC4iuC5iOC4reC4h+C4meC4teC5ieC4p+C5iOC4suC4hyDguKPguLDguJrguJrguIjguLDguJXg',
  'uLHguYnguIfguIrguLfguYjguK3guYPguKvguYnguYDguK3guIfguIjguLLguIHguKPguLLguKLguIHguLLguKPguYHguKPguIEnIH0sCiAgICAgIHsga2V5OididXlEYXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4i+C4t+C5ieC4rScsIHR5cGU6J2Rh',
  'dGUnLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidjYXRlZ29yeScsIGxhYmVsOifguKvguKHguKfguJTguKvguKHguLnguYgnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncHVyY2hhc2VDYXRlZ29yaWVzJykgfSwKCiAgICAgIHsga2V5OidsaW5l',
  'cycsICAgbGFiZWw6J+C4o+C4suC4ouC4geC4suC4o+C5g+C4meC4muC4tOC4pSAo4LiL4Li34LmJ4Lit4LiX4Li14LmA4LiU4Li14Lii4Lin4Lir4Lil4Liy4Lii4Lit4Lii4LmI4Liy4LiH4LmD4Liq4LmI4LiV4Lij4LiH4LiZ4Li14LmJKScsIHR5cGU6J2xpbmVz',
  'JywgZnVsbDp0cnVlLAogICAgICAgIGhpbnQ6J+C4quC4seC5iOC4h+C4reC4reC4meC5hOC4peC4meC5jOC4hOC4o+C4seC5ieC4h+C5gOC4lOC4teC4ouC4p+C5hOC4lOC5ieC4guC4reC4h+C4q+C4peC4suC4ouC4reC4ouC5iOC4suC4hyDguYPguKrguYjguYHg',
  'uKLguIHguJfguLXguKXguLDguKPguLLguKLguIHguLLguKPguYTguJTguYnguYDguKXguKIgwrcg4Lij4Liw4Lia4Lia4Lij4Lin4Lih4Lij4Liy4LiE4Liy4LmD4Lir4LmJ4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0JyB9LAogICAgICB7IGtleTonc2hpcHBp',
  'bmcnLCBsYWJlbDon4LiE4LmI4Liy4Liq4LmI4LiHICjguJrguLLguJcpJywgdHlwZTonbW9uZXknLCBwaDonMCcsIG9uaW5wdXQ6J3JlY2FsY0JpbGwoKScgfSwKICAgICAgeyBrZXk6J2Rpc2NvdW50JywgbGFiZWw6J+C4quC5iOC4p+C4meC4peC4lCAo4Lia4Liy',
  '4LiXKScsIHR5cGU6J21vbmV5JywgcGg6JzAnLCBvbmlucHV0OidyZWNhbGNCaWxsKCknIH0sCiAgICAgIHsga2V5OidwcmljZScsICAgbGFiZWw6J+C4o+C4suC4hOC4suC4o+C4p+C4oeC4l+C4seC5ieC4h+C4muC4tOC4pSAo4Lia4Liy4LiXKScsIHR5cGU6J21v',
  'bmV5JywgcmVxdWlyZWQ6dHJ1ZSwKICAgICAgICBoaW50Oic8c3BhbiBpZD0iYmlsbEhpbnQiPjwvc3Bhbj4nIH0sCiAgICAgIHsga2V5OidvcmRlck5vJywgbGFiZWw6J+C5gOC4peC4guC4l+C4teC5iOC4hOC4s+C4quC4seC5iOC4h+C4i+C4t+C5ieC4rScsIHBo',
  'OifguYDguKXguILguK3guK3guKPguYzguYDguJTguK3guKPguYzguIjguLLguIEgU2hvcGVlIC8gTGF6YWRhJyB9LAogICAgICB7IGtleTondmVuZG9yJywgIGxhYmVsOifguYHguKvguKXguYjguIfguJfguLXguYjguIvguLfguYnguK0nLCBwaDonU2hvcGVlIC8g',
  '4LmE4LiX4Lin4Lix4Liq4LiU4Li4IC8g4Lij4LmJ4Liy4LiZ4oCmJyB9LAogICAgICB7IGtleToncGF5ZXInLCAgIGxhYmVsOifguJzguLnguYnguIrguLPguKPguLAnIH0sCiAgICAgIHsga2V5Oid3YXJyYW50eU1vbnRocycsIGxhYmVsOifguKPguLDguKLguLDg',
  'uYDguKfguKXguLLguKPguLHguJrguJvguKPguLDguIHguLHguJkgKOC5gOC4lOC4t+C4reC4mSknLCB0eXBlOidudW1iZXInLAogICAgICAgIGhpbnQ6J+C4o+C4sOC4muC4muC4iOC4sOC4hOC4s+C4meC4p+C4k+C4p+C4seC4meC4q+C4oeC4lOC4m+C4o+C4sOC4',
  'geC4seC4meC5g+C4q+C5ieC4reC4seC4leC5guC4meC4oeC4seC4leC4tCcgfSwKICAgICAgeyBrZXk6J3Jvb20nLCAgICBsYWJlbDon4Lir4LmJ4Lit4LiHL+C4nuC4t+C5ieC4meC4l+C4teC5iOC4l+C4teC5iOC5g+C4iuC5iScsIHR5cGU6J3NlbGVjdCcsIG9w',
  'dGlvbnM6WyfguKrguYjguKfguJnguIHguKXguLLguIcnXS5jb25jYXQocm9vbU9wdGlvbnMoKSkgfSwKICAgICAgeyBrZXk6J3Bob3RvcycsICBsYWJlbDon4Lig4Liy4Lie4Lib4Lij4Liw4LiB4Lit4Lia4Liq4Li04LiZ4LiE4LmJ4LiyJywgdHlwZTonZmlsZXMn',
  'LCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J3NsaXBzJywgICBsYWJlbDon4Liq4Lil4Li04Lib4LiB4Liy4Lij4LmC4Lit4LiZ4LiK4Liz4Lij4LiwJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICBsYWJlbDon4Lir',
  '4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxQdXJjaGFzZShpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiZ',
  '4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdwdXJjaGFzZS5kZWxldGUnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7IH0pCiAgICAgIC5j',
  'YXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3guKPguYzguKE6IOC4peC5ieC4',
  'suC4h+C5geC4reC4o+C5jAogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybUFjKHJlYyl7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB',
  '4LiB4LmJ4LmE4LiC4Lij4Liy4Lii4LiB4Liy4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJyA6ICfguJrguLHguJnguJfguLbguIHguIHguLLguKPguKXguYnguLLguIfguYHguK3guKPguYwnLAogICAgcmVjb3JkOiByZWMgfHwgeyBib29rRGF0ZTogdG9kYXko',
  'KSB9LAogICAgYWN0aW9uOiAnYWMuc2F2ZScsIGJ1Y2tldDogJ2FjJywKICAgIG9jcjogeyBkYXRlOidzZXJ2aWNlRGF0ZScsIGFtb3VudDonY29zdCcsIHZlbmRvcjondGVjaG5pY2lhbicgfSwKICAgIG9uRGVsZXRlOiBkZWxBYywKICAgIGZpZWxkczogWwogICAg',
  'ICB7IGtleToncm9vbScsICAgICAgICBsYWJlbDon4Lir4LmJ4Lit4LiHJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpyb29tT3B0aW9ucygpLCByZXF1aXJlZDp0cnVlLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleToncm91bmQnLCAgICAgICBsYWJlbDon4Lij',
  '4Lit4Lia4LiX4Li14LmIJywgdHlwZTonbnVtYmVyJywgaGludDon4LmA4Lin4LmJ4LiZ4Lin4LmI4Liy4LiH4LmD4Lir4LmJ4Lij4Liw4Lia4Lia4LiZ4Lix4Lia4LiV4LmI4Lit4LiI4Liy4LiB4Lij4Lit4Lia4Lil4LmI4Liy4Liq4Li44LiU4LiC4Lit4LiH4Lib',
  '4Li14LiZ4Lix4LmJ4LiZJyB9LAogICAgICB7IGtleTonYm9va0RhdGUnLCAgICBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiZ4Lix4LiU4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJywgdHlwZTonZGF0ZScgfSwKICAgICAgeyBrZXk6J3NlcnZpY2VEYXRlJywg',
  'bGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4lOC4s+C5gOC4meC4tOC4meC4geC4suC4o+C4iOC4o+C4tOC4hycsIHR5cGU6J2RhdGUnLCBoaW50OifguIHguKPguK3guIHguYDguKHguLfguYjguK3guKXguYnguLLguIfguYDguKrguKPguYfguIjguYHguKXguYng',
  'uKcnIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCAgICAgIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnYWNTdGF0dXNlcycpIH0sCiAgICAgIHsga2V5Oid0ZWNobmljaWFuJywgIGxhYmVsOifguIrguYjguLLguIcg',
  'LyDguJzguLnguYnguYPguKvguYnguJrguKPguLTguIHguLLguKMnIH0sCiAgICAgIHsga2V5Oidjb3N0JywgICAgICAgIGxhYmVsOifguITguYjguLLguYPguIrguYnguIjguYjguLLguKIgKOC4muC4suC4lyknLCB0eXBlOidtb25leScgfSwKICAgICAgeyBrZXk6',
  'J3Bob3RvcycsICAgICAgbGFiZWw6J+C4oOC4suC4nuC4m+C4o+C4sOC4geC4reC4micsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICAgICAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0',
  'YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbEFjKGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguKPguLLguKLguIHguLLguKPguKXguYnguLLguIfguYHguK3guKPguYzguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNh',
  'bGxBcGkoJ2FjLmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8',
  'fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyoqIOC4meC4seC4lOC4peC5ieC4suC4h+C5geC4reC4o+C5jOC4q+C4peC4suC4ouC4q+C5ieC4reC4h+C4nuC4o+C5ieC4reC4oeC4geC4seC4mSAqLwpmdW5jdGlvbiBmb3JtQnVsa0FjKCl7CiAgdmFyIHJvb21zID0g',
  'cm9vbU9wdGlvbnMoKTsKICB2YXIgYm9keSA9CiAgICAnPGRpdiBjbGFzcz0iZmdyaWQiPicgKwogICAgICAnPGRpdiBjbGFzcz0iZiI+PGxhYmVsPuC4p+C4seC4meC4l+C4teC5iOC4meC4seC4lCA8c3BhbiBzdHlsZT0iY29sb3I6dmFyKC0tZGFuZ2VyKSI+Kjwv',
  'c3Bhbj48L2xhYmVsPicgKwogICAgICAgICc8aW5wdXQgdHlwZT0iZGF0ZSIgY2xhc3M9ImlucCIgaWQ9ImJrX2RhdGUiIHZhbHVlPSInICsgdG9kYXkoKSArICciPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiI+PGxhYmVsPuC4iuC5iOC4suC4hyAvIOC4',
  'nOC4ueC5ieC5g+C4q+C5ieC4muC4o+C4tOC4geC4suC4ozwvbGFiZWw+PGlucHV0IGNsYXNzPSJpbnAiIGlkPSJia190ZWNoIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7guITguYjguLLguYPguIrguYnguIjguYjguLLguKLguJXguYjg',
  'uK3guKvguYnguK3guIcgKOC4muC4suC4lyk8L2xhYmVsPjxpbnB1dCB0eXBlPSJudW1iZXIiIGNsYXNzPSJpbnAiIGlkPSJia19jb3N0Ij48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7guKvguKHguLLguKLguYDguKvguJXguLg8L2xhYmVs',
  'PjxpbnB1dCBjbGFzcz0iaW5wIiBpZD0iYmtfbm90ZSI+PC9kaXY+JyArCiAgICAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InJvdyBtYjgiPjxiIGNsYXNzPSJmczEzIj7guYDguKXguLfguK3guIHguKvg',
  'uYnguK3guIc8L2I+PHNwYW4gY2xhc3M9InNwIj48L3NwYW4+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImJ1bGtQaWNrKFwnYWxsXCcpIj7guJfguLHguYnguIfguKvguKHguJQ8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gY2xh',
  'c3M9ImJ0biBzbSIgb25jbGljaz0iYnVsa1BpY2soXCdub25lXCcpIj7guKXguYnguLLguIc8L2J1dHRvbj4nICsKICAgICAgWzEsMiwzLDQsNV0ubWFwKGZ1bmN0aW9uKGYpeyByZXR1cm4gJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iYnVsa1BpY2so',
  'JyArIGYgKyAnKSI+4LiK4Lix4LmJ4LiZICcgKyBmICsgJzwvYnV0dG9uPic7IH0pLmpvaW4oJycpICsKICAgICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJyb29tcyIgaWQ9ImJrUm9vbXMiPicgKyByb29tcy5tYXAoZnVuY3Rpb24ocil7CiAgICAgIHJldHVy',
  'biAnPGxhYmVsIGNsYXNzPSJyb29tIiBzdHlsZT0iY3Vyc29yOnBvaW50ZXIiPjxpbnB1dCB0eXBlPSJjaGVja2JveCIgY2xhc3M9ImJrIiB2YWx1ZT0iJyArIHIgKyAnIj4gPGI+JyArIHIgKyAnPC9iPjwvbGFiZWw+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvZGl2',
  'Pic7CgogIG9wZW5Nb2RhbCgn8J+ThSDguJnguLHguJTguKXguYnguLLguIfguYHguK3guKPguYzguKvguKXguLLguKLguKvguYnguK3guIfguJ7guKPguYnguK3guKHguIHguLHguJknLCBib2R5LAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xv',
  'c2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBpZD0iYmtTYXZlIj7guKrguKPguYnguLLguIfguJnguLHguJTguKvguKHguLLguKI8L2J1dHRvbj4nLCB0cnVlKTsKCiAgZG9jdW1lbnQu',
  'Z2V0RWxlbWVudEJ5SWQoJ2JrU2F2ZScpLm9uY2xpY2sgPSBmdW5jdGlvbigpewogICAgdmFyIHBpY2tlZCA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5iazpjaGVja2VkJykpLm1hcChmdW5jdGlvbihjKXsg',
  'cmV0dXJuIGMudmFsdWU7IH0pOwogICAgdmFyIGRhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmtfZGF0ZScpLnZhbHVlOwogICAgaWYgKCFwaWNrZWQubGVuZ3RoKSByZXR1cm4gdG9hc3QoJ+C5gOC4peC4t+C4reC4geC4reC4ouC5iOC4suC4h+C4meC5',
  'ieC4reC4oiAxIOC4q+C5ieC4reC4hycsICdlcnInKTsKICAgIGlmICghZGF0ZSkgcmV0dXJuIHRvYXN0KCfguIHguKPguLjguJPguLLguKPguLDguJrguLjguKfguLHguJnguJfguLXguYjguJnguLHguJQnLCAnZXJyJyk7CiAgICB2YXIgYnRuID0gdGhpczsgYnRu',
  'LmRpc2FibGVkID0gdHJ1ZTsgYnRuLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDguIHguLPguKXguLHguIfguJrguLHguJnguJfguLbguIHigKYnOwogICAgY2FsbEFwaSgnYWMuYnVsa0Jvb2snLCB7CiAgICAgIHJvb21zOiBwaWNrZWQs',
  'IGJvb2tEYXRlOiBkYXRlLAogICAgICB0ZWNobmljaWFuOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmtfdGVjaCcpLnZhbHVlLAogICAgICBjb3N0OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmtfY29zdCcpLnZhbHVlLAogICAgICBub3RlOiBkb2N1bWVu',
  'dC5nZXRFbGVtZW50QnlJZCgnYmtfbm90ZScpLnZhbHVlCiAgICB9KS50aGVuKGZ1bmN0aW9uKG4pewogICAgICBjbG9zZU1vZGFsKCk7IHRvYXN0KCfguKrguKPguYnguLLguIfguJnguLHguJTguKvguKHguLLguKIgJyArIG4gKyAnIOC4q+C5ieC4reC4h+C5geC4',
  'peC5ieC4pycsICdvaycpOyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgYnRuLmRpc2FibGVkID0gZmFsc2U7IGJ0bi50ZXh0Q29udGVudCA9ICfguKrguKPguYnguLLguIfguJnguLHguJTguKvguKHguLLguKIn',
  'OyB0b2FzdChlLm1lc3NhZ2V8fGUsICdlcnInKTsKICAgIH0pOwogIH07Cn0KCmZ1bmN0aW9uIGJ1bGtQaWNrKHdoYXQpewogIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5iaycpLmZvckVhY2goZnVuY3Rpb24oYyl7CiAgICBpZiAod2hhdCA9PT0gJ2FsbCcp',
  'IGMuY2hlY2tlZCA9IHRydWU7CiAgICBlbHNlIGlmICh3aGF0ID09PSAnbm9uZScpIGMuY2hlY2tlZCA9IGZhbHNlOwogICAgZWxzZSBjLmNoZWNrZWQgPSBTdHJpbmcoYy52YWx1ZSkuY2hhckF0KDApID09PSBTdHJpbmcod2hhdCk7CiAgfSk7Cn0KCi8qID09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3guKPguYzguKE6IOC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4suC4oeC4q+C5ieC4reC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybVJlcGFpcihyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4h+C4suC4meC4i+C5iOC4reC4oScgOiAn4LmB4LiI',
  '4LmJ4LiH4LiL4LmI4Lit4LihIC8g4Lia4Lix4LiZ4LiX4Li24LiB4LiH4Liy4LiZ4LiL4LmI4Lit4LihJywKICAgIHJlY29yZDogcmVjIHx8IHsgcmVwb3J0RGF0ZTogdG9kYXkoKSwgcHJpb3JpdHk6ICfguJvguIHguJXguLQnIH0sCiAgICBhY3Rpb246ICdyZXBh',
  'aXIuc2F2ZScsIGJ1Y2tldDogJ3Jvb21SZXBhaXInLCB3aWRlOiB0cnVlLAogICAgb2NyOiB7IGRhdGU6J3JlcGFpckRhdGUnLCBhbW91bnQ6J2Nvc3QnLCB2ZW5kb3I6J3RlY2huaWNpYW4nLCB0aXRsZTonaXRlbXMnIH0sCiAgICBvbkRlbGV0ZTogZGVsUmVwYWly',
  'LAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oidyb29tJywgICAgICAgbGFiZWw6J+C4q+C5ieC4reC4hycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6cm9vbU9wdGlvbnMoKSwgcmVxdWlyZWQ6dHJ1ZSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J2NhdGVn',
  'b3J5JywgICBsYWJlbDon4Lib4Lij4Liw4LmA4Lig4LiX4LiH4Liy4LiZ4Lir4Lil4Lix4LiB4LiC4Lit4LiH4LmD4Lia4LiZ4Li14LmJJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ3JlcGFpckNhdGVnb3JpZXMnKSwKICAgICAgICBoaW50OifguYDguKfg',
  'uYnguJnguKfguYjguLLguIfguYTguJTguYkg4oCUIOC4o+C4sOC4muC4muC5g+C4iuC5ieC4m+C4o+C4sOC5gOC4oOC4l+C4l+C4teC5iOC4nuC4muC4muC5iOC4reC4ouC4l+C4teC5iOC4quC4uOC4lOC5g+C4meC5gOC4iuC5h+C4hOC4peC4tOC4quC4leC5jOC5',
  'g+C4q+C5ieC5gOC4reC4hycgfSwKICAgICAgeyBrZXk6J2l0ZW1zJywgICAgICBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LiL4LmI4Lit4LihICjguJXguLTguYrguIHguYDguKHguLfguYjguK3guJfguLPguYDguKrguKPg',
  'uYfguIgpJywgdHlwZTondG9kbycsIHJlcXVpcmVkOnRydWUsIGZ1bGw6dHJ1ZSwKICAgICAgICBvcHRpb25zOiBvcHQoJ3JlcGFpckNhdGVnb3JpZXMnKSwKICAgICAgICBoaW50OifguYDguILguYnguLLguIvguYjguK3guKHguITguKPguLHguYnguIfguYDguJTg',
  'uLXguKLguKfguKHguLHguIHguIvguYjguK3guKHguKvguKXguLLguKLguIjguLjguJQg4LmD4Liq4LmI4LmB4Lii4LiB4LiX4Li14Lil4Liw4LiH4Liy4LiZ4LmB4Lil4Liw4LmA4Lil4Li34Lit4LiB4Lib4Lij4Liw4LmA4Lig4LiX4LiC4Lit4LiH4LmB4LiV4LmI',
  '4Lil4Liw4LiH4Liy4LiZ4LmE4LiU4LmJIMK3ICcgKwogICAgICAgICAgICAgJ+C4leC4tOC5iuC4geC4hOC4o+C4muC4l+C4uOC4geC4h+C4suC4meC5geC4peC5ieC4p+C4o+C4sOC4muC4muC4iOC4sOC5gOC4m+C4peC4teC5iOC4ouC4meC4quC4luC4suC4meC4',
  'sOC5gOC4m+C5h+C4mSDigJzguYDguKrguKPguYfguIjguKrguLTguYnguJnigJ0g4LmD4Lir4LmJ4LmA4Lit4LiHJyB9LAogICAgICB7IGtleToncmVwb3J0RGF0ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguYHguIjguYnguIcnLCB0eXBlOidkYXRlJyB9',
  'LAogICAgICB7IGtleTonYm9va0RhdGUnLCAgIGxhYmVsOifguKfguLHguJnguJnguLHguJTguIvguYjguK3guKHguYHguIvguKEnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleToncmVwYWlyRGF0ZScsIGxhYmVsOifguKfguLHguJnguYDguILguYnguLLguIvg',
  'uYjguK3guKHguYHguIvguKEnLCB0eXBlOidkYXRlJywgaGludDon4LiB4Lij4Lit4LiB4LmA4Lih4Li34LmI4Lit4LiL4LmI4Lit4Lih4LmA4Liq4Lij4LmH4LiI4LmB4Lil4LmJ4LinJyB9LAogICAgICB7IGtleTonc3RhdHVzJywgICAgIGxhYmVsOifguKrguJbg',
  'uLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncmVwYWlyU3RhdHVzZXMnKSB9LAogICAgICB7IGtleToncHJpb3JpdHknLCAgIGxhYmVsOifguITguKfguLLguKHguYDguKPguYjguIfguJTguYjguKfguJknLCB0eXBlOidzZWxlY3QnLCBvcHRp',
  'b25zOm9wdCgncHJpb3JpdGllcycpLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleTondGVjaG5pY2lhbicsIGxhYmVsOifguIrguYjguLLguIfguJzguLnguYnguIvguYjguK3guKEnIH0sCiAgICAgIHsga2V5Oidjb3N0JywgICAgICAgbGFiZWw6J+C4hOC5iOC4',
  'suC5g+C4iuC5ieC4iOC5iOC4suC4oiAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JyB9LAogICAgICB7IGtleToncGhvdG9zQmVmb3JlJywgbGFiZWw6J+C4oOC4suC4nuC4geC5iOC4reC4meC4i+C5iOC4reC4oScsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0s',
  'CiAgICAgIHsga2V5OidwaG90b3NBZnRlcicsICBsYWJlbDon4Lig4Liy4Lie4Lir4Lil4Lix4LiH4LiL4LmI4Lit4LihJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir',
  '4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxSZXBhaXIoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4h+C4suC4meC4i+C5iOC4reC4oeC4meC4teC5iT8nLCBmdW5jdGlvbigpewogICAg',
  'Y2FsbEFwaSgncmVwYWlyLmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1l',
  'c3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmC4LiU',
  '4Lii4Lij4Lin4LihCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtQnVpbGRpbmcocmVjKXsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfg',
  'uYHguIHguYnguYTguILguIfguLLguJnguIvguYjguK3guKHguJXguLbguIEnIDogJ+C5gOC4nuC4tOC5iOC4oeC4h+C4suC4meC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oScsCiAgICByZWNvcmQ6IHJlYyB8fCB7IGJvb2tE',
  'YXRlOiB0b2RheSgpIH0sCiAgICBhY3Rpb246ICdidWlsZGluZy5zYXZlJywgYnVja2V0OiAnYnVpbGRpbmcnLCB3aWRlOiB0cnVlLAogICAgb2NyOiB7IGRhdGU6J2VuZERhdGUnLCBhbW91bnQ6J2Nvc3QnLCB2ZW5kb3I6J2NvbnRyYWN0b3InLCB0aXRsZTondGl0',
  'bGUnIH0sCiAgICBvbkRlbGV0ZTogZGVsQnVpbGRpbmcsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3pvbmUnLCAgICAgIGxhYmVsOifguKrguYjguKfguJnguILguK3guIfguK3guLLguITguLLguKMnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnYnVp',
  'bGRpbmdab25lcycpLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5Oid0aXRsZScsICAgICBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4Lij4LiL4LmI4Lit4Lih4LmB4LiL4LihJywgdHlwZTondGV4dGFyZWEnLCByZXF1aXJlZDp0cnVlLCBmdWxsOnRydWUgfSwK',
  'ICAgICAgeyBrZXk6J2Jvb2tEYXRlJywgIGxhYmVsOifguKfguLHguJnguJfguLXguYjguJnguLHguJQnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonc3RhcnREYXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC5gOC4o+C4tOC5iOC4oeC4lOC4s+C5',
  'gOC4meC4tOC4meC4geC4suC4oycsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidlbmREYXRlJywgICBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LmB4Lil4LmJ4Lin4LmA4Liq4Lij4LmH4LiIJywgdHlwZTonZGF0ZScgfSwKICAgICAgeyBrZXk6J3N0YXR1',
  'cycsICAgIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnYnVpbGRpbmdTdGF0dXNlcycpIH0sCiAgICAgIHsga2V5Oidjb250cmFjdG9yJywgbGFiZWw6J+C4nOC4ueC5ieC4o+C4seC4muC5gOC4q+C4oeC4siAvIOC4',
  'o+C5ieC4suC4mScgfSwKICAgICAgeyBrZXk6J2Nvc3QnLCAgICAgIGxhYmVsOifguITguYjguLLguYPguIrguYnguIjguYjguLLguKIgKOC4muC4suC4lyknLCB0eXBlOidtb25leScgfSwKICAgICAgeyBrZXk6J25leHREdWUnLCAgIGxhYmVsOifguITguKPguJrg',
  'uIHguLPguKvguJnguJTguKPguK3guJrguJbguLHguJTguYTguJsnLCB0eXBlOidkYXRlJywgaGludDon4LmA4LiK4LmI4LiZIOC4geC4seC4meC4i+C4tuC4oeC4lOC4suC4lOC4n+C5ieC4suC4l+C4uOC4gSAzIOC4m+C4tSDigJQg4LmD4Liq4LmI4Lin4Lix4LiZ',
  '4LiX4Li14LmI4LiE4Lij4Lix4LmJ4LiH4LiW4Lix4LiU4LmE4LibJyB9LAogICAgICB7IGtleToncGhvdG9zJywgICAgbGFiZWw6J+C4oOC4suC4nuC4m+C4o+C4sOC4geC4reC4micsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5OidzbGlw',
  'cycsICAgICBsYWJlbDon4LmD4Lia4LmA4Liq4Lij4LmH4LiIIC8g4Liq4Lil4Li04LibJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0',
  'YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbEJ1aWxkaW5nKGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguIfguLLguJnguIvguYjguK3guKHguJXguLbguIHguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGko',
  'J2J1aWxkaW5nLmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8',
  'fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4LiC4LmJ4Lit4Lih4Li54Lil4Lir4LmJ4Lit4LiHCiAgID09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtUm9vbShyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiAn4LiC4LmJ4Lit4Lih4Li54Lil4Lir4LmJ4Lit4LiHICcgKyAocmVjID8gcmVj',
  'LnJvb20gOiAnJyksCiAgICByZWNvcmQ6IHJlYywgYWN0aW9uOiAncm9vbS5zYXZlJywKICAgIGZpZWxkczogWwogICAgICB7IGtleToncm9vbScsICAgbGFiZWw6J+C4q+C5ieC4reC4hycsIHJlcXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J2Zsb29yJywgIGxh',
  'YmVsOifguIrguLHguYnguJknLCB0eXBlOidudW1iZXInIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ3Jvb21TdGF0dXNlcycpLCBibGFuazpmYWxzZSB9LAogICAgICB7',
  'IGtleTondGVuYW50JywgbGFiZWw6J+C4iuC4t+C5iOC4reC4nOC4ueC5ieC5gOC4iuC5iOC4sicgfSwKICAgICAgeyBrZXk6J3Bob25lJywgIGxhYmVsOifguYDguJrguK3guKPguYzguJXguLTguJTguJXguYjguK0nIH0sCiAgICAgIHsga2V5OidyZW50JywgICBs',
  'YWJlbDon4LiE4LmI4Liy4LmA4LiK4LmI4LiyL+C5gOC4lOC4t+C4reC4mSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JyB9LAogICAgICB7IGtleTonbW92ZUluJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC5gOC4guC5ieC4suC4reC4ouC4ueC5iCcsIHR5',
  'cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5Oidub3RlJywgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguJfguKPguLHguJ7guKLguYzguKrguLTguJnguJvguKPguLDguIjguLPguKvguYnguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1Bc3NldChyZWMpewogIHZhciByb29tID0gKHJlYyAmJiByZWMucm9vbSkgfHwgJyc7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4LiX4Lij4Lix4Lie',
  '4Lii4LmM4Liq4Li04LiZJyA6ICfguYDguJ7guLTguYjguKHguJfguKPguLHguJ7guKLguYzguKrguLTguJnguYPguJnguKvguYnguK3guIcgJyArIHJvb20sCiAgICByZWNvcmQ6IHJlYyB8fCB7IHJvb206IHJvb20sIHN0YXR1czogJ+C5g+C4iuC5ieC4h+C4suC4',
  'meC4m+C4geC4leC4tCcgfSwKICAgIGFjdGlvbjogJ2Fzc2V0LnNhdmUnLAogICAgb25EZWxldGU6IHJlYyAmJiByZWMuaWQgPyBkZWxBc3NldCA6IG51bGwsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3Jvb20nLCAgIGxhYmVsOifguKvguYnguK3guIcnLCB0',
  'eXBlOidzZWxlY3QnLCBvcHRpb25zOnJvb21PcHRpb25zKCksIHJlcXVpcmVkOnRydWUsIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5OiduYW1lJywgICBsYWJlbDon4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZJywgcmVxdWlyZWQ6dHJ1ZSwgcGg6J+C5gOC4',
  'iuC5iOC4mSDguYHguK3guKPguYwgwrcg4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiX4Liz4LiZ4LmJ4Liz4Lit4Li44LmI4LiZIMK3IOC4leC4ueC5ieC5gOC4ouC5h+C4mScgfSwKICAgICAgeyBrZXk6J2JyYW5kJywgIGxhYmVsOifguKLguLXguYjguKvguYnguK0v',
  '4Lij4Li44LmI4LiZJyB9LAogICAgICB7IGtleTonc2VyaWFsJywgbGFiZWw6J1NlcmlhbCBOby4nIH0sCiAgICAgIHsga2V5OidpbnN0YWxsRGF0ZScsICBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiV4Li04LiU4LiV4Lix4LmJ4LiHJywgdHlwZTonZGF0ZScg',
  'fSwKICAgICAgeyBrZXk6J3dhcnJhbnR5RW5kJywgIGxhYmVsOifguJvguKPguLDguIHguLHguJnguKvguKHguJTguK3guLLguKLguLgnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonc3RhdHVzJywgbGFiZWw6J+C4quC4luC4suC4meC4sCcsIHR5cGU6J3Nl',
  'bGVjdCcsIG9wdGlvbnM6b3B0KCdhc3NldFN0YXR1c2VzJyksIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5OidwdXJjaGFzZUlkJywgbGFiZWw6J+C4reC5ieC4suC4h+C4reC4tOC4h+C4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4rScsIHBoOifguKPguKvg',
  'uLHguKrguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcgKOC4luC5ieC4suC4oeC4tSknIH0sCiAgICAgIHsga2V5Oidub3RlJywgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUg',
  'fQogICAgXSwKICAgIC8vIOC4n+C4reC4o+C5jOC4oeC4meC4teC5ieC5gOC4m+C4tOC4lOC4iOC4suC4geC4q+C4meC5ieC4suC4leC5iOC4suC4h+C4o+C4suC4ouC4peC4sOC5gOC4reC4teC4ouC4lOC4q+C5ieC4reC4hyDigJQg4Lia4Lix4LiZ4LiX4Li24LiB',
  '4LmA4Liq4Lij4LmH4LiI4LmA4Lib4Li04LiU4LiB4Lil4Lix4Lia4LmE4Lib4Lir4LiZ4LmJ4Liy4LmA4LiU4Li04LihCiAgICBhZnRlcjogZnVuY3Rpb24oKXsgaWYgKHJvb20gJiYgdHlwZW9mIG9wZW5Sb29tID09PSAnZnVuY3Rpb24nKSBvcGVuUm9vbShyb29t',
  'KTsgfQogIH0pOwp9CgpmdW5jdGlvbiBkZWxBc3NldChpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZ4LiK4Li04LmJ4LiZ4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdhc3NldC5kZWxldGUn',
  'LCB7IGlkOiBpZCB9KQogICAgICAudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7',
  'IH0pOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguKPguLLguKLguKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4Lii4Lir4LitCiAgID09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtRmluYW5jZShyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4o+C4',
  'suC4ouC4geC4suC4oycgOiAn4Lia4Lix4LiZ4LiX4Li24LiB4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4oicsCiAgICByZWNvcmQ6IHJlYyB8fCB7IGRhdGU6IHRvZGF5KCksIGNoYW5uZWw6ICfguYLguK3guJkgUVInIH0sCiAgICBhY3Rp',
  'b246ICdmaW5hbmNlLnNhdmUnLCBidWNrZXQ6ICdtaXNjJywKICAgIG9uRGVsZXRlOiBkZWxGaW5hbmNlLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5OidraW5kJywgICBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4LijJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpv',
  'cHQoJ2ZpbmFuY2VLaW5kcycpLCByZXF1aXJlZDp0cnVlLCBibGFuazpmYWxzZSwKICAgICAgICBoaW50OifguYDguKXguLfguK3guIEgIuC4o+C4suC4ouC4o+C4seC4muC4hOC5iOC4suC5gOC4iuC5iOC4siIg4Lir4Lij4Li34LitICLguKPguLLguKLguKPguLHg',
  'uJrguK3guLfguYjguJkg4LmGIiDguKPguLDguJrguJrguIjguLDguJnguLHguJrguYDguJvguYfguJnguJ3guLHguYjguIfguKPguLLguKLguKPguLHguJrguYPguKvguYnguK3guLHguJXguYLguJnguKHguLHguJXguLQnIH0sCiAgICAgIHsga2V5OidkYXRlJywg',
  'ICBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmIJywgdHlwZTonZGF0ZScsIHJlcXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J2Ftb3VudCcsIGxhYmVsOifguIjguLPguJnguKfguJnguYDguIfguLTguJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHJlcXVp',
  'cmVkOnRydWUgfSwKICAgICAgeyBrZXk6J2JpbGxNb250aCcsIGxhYmVsOifguKPguK3guJrguJrguLTguKXguILguK3guIfguYDguJTguLfguK3guJknLCBwaDon4LmA4LiK4LmI4LiZIOC4gS7guIQuIDI1NjknIH0sCiAgICAgIHsga2V5OidjaGFubmVsJywgbGFi',
  'ZWw6J+C4iuC5iOC4reC4h+C4l+C4suC4hycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdmaW5hbmNlQ2hhbm5lbHMnKSB9LAogICAgICB7IGtleTonc2xpcHMnLCAgbGFiZWw6J+C4quC4peC4tOC4myAvIOC5g+C4muC5gOC4quC4o+C5h+C4iCcsIHR5cGU6',
  'J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxGaW5hbmNlKGlkKXsKICBj',
  'b25maXJtQWN0aW9uKCfguKXguJrguKPguLLguKLguIHguLLguKPguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2ZpbmFuY2UuZGVsZXRlJywgeyBpZDogaWQgfSkudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywn',
  'b2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT0KICAg4Liq4Liz4Lij4Lit4LiHIC8g4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54LilCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBkb0V4',
  'cG9ydEpzb24oKXsKICB0b2FzdCgn4LiB4Liz4Lil4Lix4LiH4LmA4LiV4Lij4Li14Lii4Lih4LmE4Lif4Lil4LmM4Liq4Liz4Lij4Lit4LiH4oCmJyk7CiAgY2FsbEFwaSgnYmFja3VwLmV4cG9ydCcsIHt9KS50aGVuKGZ1bmN0aW9uKGR1bXApewogICAgc2F2ZVRl',
  'eHRGaWxlKCd0aGUtbS1jb3JuZXItYXAtYmFja3VwLScgKyB0b2RheSgpICsgJy5qc29uJywKICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShkdW1wLCBudWxsLCAxKSwgJ2FwcGxpY2F0aW9uL2pzb24nKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9h',
  'c3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7IH0pOwp9CgpmdW5jdGlvbiBkb0V4cG9ydENzdihzaGVldCl7CiAgY2FsbEFwaSgnYmFja3VwLmNzdicsIHsgc2hlZXQ6IHNoZWV0IH0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICBzYXZlVGV4dEZpbGUoci5maWxlbmFtZSwg',
  'ci5jb250ZW50LCAndGV4dC9jc3YnKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7IH0pOwp9CgovKiog4LiU4Liy4Lin4LiZ4LmM4LmC4Lir4Lil4LiU4LmE4Lif4Lil4LmMIOKAlCDguYPguIrguYkgZG93bmxvYWRz',
  'IGNhcGFiaWxpdHkg4LiW4LmJ4Liy4Lih4Li1IOC5hOC4oeC5iOC4h+C4seC5ieC4meC5g+C4iuC5ieC4peC4tOC4h+C4geC5jOC4m+C4geC4leC4tCAqLwpmdW5jdGlvbiBzYXZlVGV4dEZpbGUoZmlsZW5hbWUsIGNvbnRlbnQsIG1pbWUpewogIGlmICh0eXBlb2Yg',
  'd2luZG93LnNhdmVWaWFIb3N0ID09PSAnZnVuY3Rpb24nKSByZXR1cm4gd2luZG93LnNhdmVWaWFIb3N0KGZpbGVuYW1lLCBjb250ZW50LCBtaW1lKTsKICB2YXIgYmxvYiA9IG5ldyBCbG9iKFtjb250ZW50XSwgeyB0eXBlOiBtaW1lICsgJztjaGFyc2V0PXV0Zi04',
  'JyB9KTsKICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTsKICBhLmhyZWYgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpOwogIGEuZG93bmxvYWQgPSBmaWxlbmFtZTsKICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGEpOyBhLmNsaWNrKCk7',
  'CiAgc2V0VGltZW91dChmdW5jdGlvbigpeyBVUkwucmV2b2tlT2JqZWN0VVJMKGEuaHJlZik7IGEucmVtb3ZlKCk7IH0sIDEwMDApOwogIHRvYXN0KCfguJTguLLguKfguJnguYzguYLguKvguKXguJQgJyArIGZpbGVuYW1lICsgJyDguYHguKXguYnguKcnLCAnb2sn',
  'KTsKfQoKZnVuY3Rpb24gZG9JbXBvcnRKc29uKCl7CiAgb3Blbk1vZGFsKCfirIbvuI8g4LiB4Li54LmJ4LiE4Li34LiZ4LiI4Liy4LiB4LmE4Lif4Lil4LmM4Liq4Liz4Lij4Lit4LiHJywKICAgICc8cCBjbGFzcz0iZnMxMyI+4LmA4Lil4Li34Lit4LiB4LmE4Lif',
  '4Lil4LmMIDxiPi5qc29uPC9iPiDguJfguLXguYjguYDguITguKLguJTguLLguKfguJnguYzguYLguKvguKXguJTguYTguKfguYk8L3A+JyArCiAgICAnPGxhYmVsIGNsYXNzPSJmaWxlLWRyb3AiIGZvcj0iaW1wRmlsZSI+8J+ThCDguYDguKXguLfguK3guIHguYTg',
  'uJ/guKXguYzguKrguLPguKPguK3guIcnICsKICAgICAgJzxpbnB1dCB0eXBlPSJmaWxlIiBpZD0iaW1wRmlsZSIgYWNjZXB0PSJhcHBsaWNhdGlvbi9qc29uLC5qc29uIiBzdHlsZT0iZGlzcGxheTpub25lIiAnICsKICAgICAgJ29uY2hhbmdlPSJkb2N1bWVudC5n',
  'ZXRFbGVtZW50QnlJZChcJ2ltcE5hbWVcJykudGV4dENvbnRlbnQ9dGhpcy5maWxlc1swXT90aGlzLmZpbGVzWzBdLm5hbWU6XCdcJyI+PC9sYWJlbD4nICsKICAgICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIG10OCIgaWQ9ImltcE5hbWUiPjwvZGl2PicgKwogICAg',
  'JzxkaXYgY2xhc3M9ImhyIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJmIj48bGFiZWw+4Lin4Li04LiY4Li14LiB4Li54LmJ4LiE4Li34LiZPC9sYWJlbD4nICsKICAgICc8c2VsZWN0IGNsYXNzPSJzZWwiIGlkPSJpbXBNb2RlIj4nICsKICAgICAgJzxvcHRp',
  'b24gdmFsdWU9Im1lcmdlIj7guYDguJ7guLTguYjguKHguYDguInguJ7guLLguLDguKPguLLguKLguIHguLLguKPguJfguLXguYjguKLguLHguIfguYTguKHguYjguKHguLUgKOC5geC4meC4sOC4meC4syk8L29wdGlvbj4nICsKICAgICAgJzxvcHRpb24gdmFsdWU9',
  'InJlcGxhY2UiPuC4peC5ieC4suC4h+C4guC5ieC4reC4oeC4ueC4peC5gOC4lOC4tOC4oeC5geC4peC5ieC4p+C5geC4l+C4meC4l+C4teC5iOC4l+C4seC5ieC4h+C4q+C4oeC4lDwvb3B0aW9uPicgKwogICAgJzwvc2VsZWN0PjwvZGl2PicsCiAgICAnPGJ1dHRv',
  'biBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4gTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIGlkPSJpbXBHbyI+4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54LilPC9idXR0',
  'b24+Jyk7CgogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbXBHbycpLm9uY2xpY2sgPSBmdW5jdGlvbigpewogICAgdmFyIGYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW1wRmlsZScpLmZpbGVzWzBdOwogICAgaWYgKCFmKSByZXR1cm4gdG9hc3QoJ+C4',
  'geC4o+C4uOC4k+C4suC5gOC4peC4t+C4reC4geC5hOC4n+C4peC5jOC4geC5iOC4reC4mScsICdlcnInKTsKICAgIHZhciBtb2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ltcE1vZGUnKS52YWx1ZTsKICAgIHZhciBidG4gPSB0aGlzOyBidG4uZGlzYWJs',
  'ZWQgPSB0cnVlOyBidG4uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C4geC4ueC5ieC4hOC4t+C4meKApic7CiAgICB2YXIgciA9IG5ldyBGaWxlUmVhZGVyKCk7CiAgICByLm9ubG9hZCA9IGZ1bmN0aW9uKCl7',
  'CiAgICAgIHZhciBwYXJzZWQ7CiAgICAgIHRyeSB7IHBhcnNlZCA9IEpTT04ucGFyc2Uoci5yZXN1bHQpOyB9CiAgICAgIGNhdGNoIChlKSB7IGJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBidG4udGV4dENvbnRlbnQgPSAn4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit',
  '4Lih4Li54LilJzsgcmV0dXJuIHRvYXN0KCfguYTguJ/guKXguYzguYTguKHguYjguYPguIrguYggSlNPTiDguJfguLXguYjguJbguLnguIHguJXguYnguK3guIcnLCAnZXJyJyk7IH0KICAgICAgY2FsbEFwaSgnYmFja3VwLmltcG9ydCcsIHsgZGF0YTogcGFyc2Vk',
  'LCBtb2RlOiBtb2RlIH0pLnRoZW4oZnVuY3Rpb24oc3RhdCl7CiAgICAgICAgY2xvc2VNb2RhbCgpOwogICAgICAgIHZhciBuID0gT2JqZWN0LmtleXMoc3RhdCkucmVkdWNlKGZ1bmN0aW9uKGEsayl7IHJldHVybiBhICsgKHN0YXRba118fDApOyB9LCAwKTsKICAg',
  'ICAgICB0b2FzdCgn4LiB4Li54LmJ4LiE4Li34LiZ4Liq4Liz4LmA4Lij4LmH4LiIICcgKyBuICsgJyDguKPguLLguKLguIHguLLguKMnLCAnb2snKTsKICAgICAgICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAg',
  'ICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBidG4udGV4dENvbnRlbnQgPSAn4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54LilJzsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7CiAgICAgIH0pOwogICAgfTsKICAgIHIucmVhZEFzVGV4dChmKTsK',
  'ICB9Owp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmMIOC5geC4peC4sOC4geC4suC4o+C4quC4s+C4o+C4reC4h+C4peC4hyBHb29nbGUg',
  'RHJpdmUKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgpmdW5jdGlvbiBjb3B5U2hhcmUoKXsKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2hhcmVVcmwnKTsKICBpZiAo',
  'IWVsKSByZXR1cm47CiAgZWwuc2VsZWN0KCk7CiAgaWYgKG5hdmlnYXRvci5jbGlwYm9hcmQpIHsKICAgIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KGVsLnZhbHVlKQogICAgICAudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4LiE4Lix4LiU4Lil4Lit4LiB',
  '4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LmB4Lil4LmJ4LinJywnb2snKTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKCl7IHRvYXN0KCfguITguLHguJTguKXguK3guIHguYTguKHguYjguKrguLPguYDguKPguYfguIgg4oCUIOC4geC4lOC4hOC5ieC4suC4',
  'h+C4l+C4teC5iOC4iuC5iOC4reC4h+C5geC4peC5ieC4p+C5gOC4peC4t+C4reC4geC4hOC4seC4lOC4peC4reC4gScsJ2VycicpOyB9KTsKICB9IGVsc2UgewogICAgdHJ5IHsgZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2NvcHknKTsgdG9hc3QoJ+C4hOC4seC4lOC4',
  'peC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC5geC4peC5ieC4pycsJ29rJyk7IH0KICAgIGNhdGNoIChlKSB7IHRvYXN0KCfguITguLHguJTguKXguK3guIHguYTguKHguYjguKrguLPguYDguKPguYfguIgg4oCUIOC4geC4lOC4hOC5ieC4suC4h+C4',
  'l+C4teC5iOC4iuC5iOC4reC4h+C5geC4peC5ieC4p+C5gOC4peC4t+C4reC4geC4hOC4seC4lOC4peC4reC4gScsJ2VycicpOyB9CiAgfQp9CgpmdW5jdGlvbiBkb1JvdGF0ZVNoYXJlKCl7CiAgY29uZmlybUFjdGlvbign4Lit4Lit4LiB4Lil4Li04LiH4LiB4LmM',
  '4LmB4LiK4Lij4LmM4LiK4Li44LiU4LmD4Lir4Lih4LmIPyDguITguJnguJfguLXguYjguJbguLfguK3guKXguLTguIfguIHguYzguYDguJTguLTguKHguIjguLDguYDguJvguLTguJTguYTguKHguYjguYTguJTguYnguK3guLXguIEnLCBmdW5jdGlvbigpewogICAg',
  'Y2FsbEFwaSgnc2hhcmUucm90YXRlVG9rZW4nLCB7fSkudGhlbihmdW5jdGlvbigpewogICAgICB0b2FzdCgn4Lit4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LiK4Li44LiU4LmD4Lir4Lih4LmI4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCh7IHF1',
  'aWV0OiB0cnVlIH0pOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgpmdW5jdGlvbiBkb0JhY2t1cE5vdygpewogIHRvYXN0KCfguIHguLPguKXguLHguIfguKrguLPguKPguK3guIfguILguYng',
  'uK3guKHguLnguKXguKXguIcgRHJpdmXigKYnKTsKICBjYWxsQXBpKCdiYWNrdXAuYmFja3VwTm93Jywge30pLnRoZW4oZnVuY3Rpb24ocil7CiAgICB0b2FzdCgn4Liq4Liz4Lij4Lit4LiH4LmB4Lil4LmJ4LinOiAnICsgci5uYW1lLCAnb2snKTsgbG9hZCh7IHF1',
  'aWV0OiB0cnVlIH0pOwogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKfQo8L3NjcmlwdD4KPHNjcmlwdD5ib290KCk7PC9zY3JpcHQ+CjwvYm9keT4KPC9odG1sPgo='
].join('');

function indexHtml_() {
  return Utilities.newBlob(Utilities.base64Decode(INDEX_HTML_B64), 'text/html')
    .getDataAsString('UTF-8');
}
