/**
 * The M Corner AP — ระบบบริหารหอพัก (ไฟล์เดียวจบ)
 * ไฟล์นี้สร้างอัตโนมัติจากโฟลเดอร์ src/ เมื่อ 2026-11-26 01:46 UTC
 *
 * ⚠️ อย่าแก้ไฟล์นี้โดยตรง — แก้ที่ src/ แล้วรัน  node build/bundle.js
 *
 * ประกอบด้วย: Config.gs, Util.gs, Setup.gs, Users.gs, Auth.gs, Settings.gs, Drive.gs, Ocr.gs, Seed.gs, Finance.gs, Migrate.gs, Backup.gs, Debt.gs, Purchase.gs, Maintenance.gs, Building.gs, Dashboard.gs, Api.gs, Sync.gs, Notify.gs, Web.gs
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
  VERSION: '1.9.0',
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
  { key: 'alsoIn',    label: 'แสดงในบัญชีด้วย',  type: 'select', options: ['หนี้หลัก', 'หนี้รอง'] },
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
  { key: 'channel',  label: 'ช่องทาง',        type: 'select', options: ['โอน QR', 'โอนธนาคาร', 'เงินสด', 'บัตรเครดิต', 'อื่น ๆ', 'ปรับยอด'] },
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
var SCHEMA_VERSION = 10;

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
  { key: 'date_format',     label: 'รูปแบบปีที่แสดง',           value: 'ค.ศ. (2026)', note: 'ข้อมูลในชีตเก็บเป็น ค.ศ. เสมอ ตรงนี้เลือกได้ว่าจะให้หน้าจอแสดงปีแบบไหน' },
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
/**
 * ทำงานใต้ล็อกของสคริปต์ (ทีละคำสั่งทั้งระบบ) — เรียกซ้อนกันได้ในคำสั่งเดียวกัน
 * ใช้กับทุกอย่างที่ล้าง/เขียนชีตเป็นก้อน: คำสั่งบันทึก การย้ายข้อมูล การจัดคอลัมน์ใหม่
 */
var LOCK_DEPTH_ = 0;
function withScriptLock_(fn, waitMs) {
  if (LOCK_DEPTH_ > 0) return fn();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(waitMs || 30000)) {
    throw new Error('ระบบกำลังบันทึกรายการของคนอื่นอยู่ — รอสักครู่แล้วกดอีกครั้ง');
  }
  LOCK_DEPTH_++;
  try {
    return fn();
  } finally {
    LOCK_DEPTH_--;
    lock.releaseLock();
  }
}

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

  if (headersMatch_(existing, headers)) return sh;

  // หัวตารางไม่ตรง = ต้องจัดคอลัมน์ใหม่ (ล้างแล้วเขียนทั้งชีต) — ทำทีละคน
  // แล้วอ่านหัวตารางอีกรอบ เผื่อคนก่อนหน้าจัดให้เสร็จไปแล้วระหว่างรอ
  return withScriptLock_(function () {
    var lc = sh.getLastColumn();
    var now = lc > 0 ? sh.getRange(1, 1, 1, lc).getValues()[0].map(function (h) {
      return String(h == null ? '' : h).trim();
    }) : [];
    if (headersMatch_(now, headers)) return sh;
    return relayoutSheet_(sh, name, now, headers);
  }, 60000);
}

function headersMatch_(existing, headers) {
  for (var i = 0; i < headers.length; i++) {
    if (existing[i] !== headers[i]) return false;
  }
  return true;
}

function relayoutSheet_(sh, name, existing, headers) {
  var hasData = sh.getLastRow() > 1;
  var hasHeader = existing.filter(String).length > 0;

  if (hasData && hasHeader) {
    remapSheet_(sh, name, existing);   // ย้ายข้อมูลตามชื่อหัวตาราง แล้วค่อยเขียนหัวใหม่
    syncNoteSheet_(name);
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
  return textFromCell_(v);
}

/**
 * ช่องข้อความที่ชีตแอบแปลงเป็นวันที่ไปแล้ว
 *
 * พิมพ์ "7/2569" ลงชีตตรง ๆ ชีตจะเดาว่าเป็นวันที่ 1 ก.ค. ปี 2569 แล้วเก็บเป็นวันที่
 * พออ่านกลับมาเป็นข้อความจะได้ "Sat Jul 01 2569 00:00:00 GMT+0700 ..." แทน
 * วันที่ 1 ของเดือนแปลงกลับเป็น "เดือน/ปี" (รูปแบบของช่องงวด) วันอื่นเป็น yyyy-mm-dd
 * รวมถึงข้อความยาว ๆ แบบนั้นที่เคยถูกเขียนกลับลงชีตไปแล้วด้วย
 */
var JS_DATE_TEXT = /^(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{2}) (\d{4}) (\d{2}):(\d{2}):(\d{2}) GMT/;
var MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/*
 * แปลงกลับเฉพาะ "วันล้วน" (เวลา 00:00:00) เท่านั้น เพราะนั่นคือร่องรอยของการที่ชีตเดาข้อความเป็นวันที่
 * ค่าที่มีเวลาด้วย (เช่น เวลาหมดอายุของการเข้าใช้งาน เวลาปลดล็อกบัญชี) ห้ามตัดเวลาทิ้ง
 * คืนเป็น ISO เต็ม ๆ ที่ new Date() อ่านได้ตรงเวลาเดิมทุกวินาที
 */
function textFromCell_(v) {
  var y, m, d;
  if (Object.prototype.toString.call(v) === '[object Date]') {
    if (isNaN(v.getTime())) return '';
    var stamp = Utilities.formatDate(v, APP.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    if (stamp.slice(11) !== '00:00:00') return v.toISOString();
    y = Number(stamp.slice(0, 4)); m = Number(stamp.slice(5, 7)); d = Number(stamp.slice(8, 10));
  } else {
    var s = String(v);
    var hit = s.match(JS_DATE_TEXT);
    if (!hit) return s;
    if (hit[4] + hit[5] + hit[6] !== '000000') {
      var t = new Date(s);
      return isNaN(t.getTime()) ? s : t.toISOString();
    }
    y = Number(hit[3]); m = MONTH_ABBR.indexOf(hit[1]) + 1; d = Number(hit[2]);
  }
  if (d === 1) return m + '/' + y;
  return y + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
}

/**
 * ข้อความที่ชีตจะแอบตีความเอง ต้องใส่ ' นำหน้าตอนเขียน ชีตจะเก็บเป็นข้อความตามที่พิมพ์
 * (เครื่องหมาย ' ไม่ถูกเก็บเป็นส่วนหนึ่งของค่า อ่านกลับมาได้ข้อความเดิม)
 *   • หน้าตาเหมือนตัวเลข/วันที่ ("7/2026", "0812345678") — กันชีตแปลงเป็นวันที่หรือตัดเลข 0 ข้างหน้า
 *   • เวลาแบบ ISO ("2026-10-22T03:00:00.000Z") — เวลาหมดอายุ/ปลดล็อก ต้องคงเป็นข้อความเดิมเป๊ะ
 *   • ขึ้นต้นด้วย = + - @ — ไม่งั้นชีตถือเป็นสูตร ใครพิมพ์ =IMPORTDATA(...) ลงช่องหมายเหตุ
 *     สูตรจะไปทำงานในชีตของเจ้าของหอ (formula injection)
 */
var LOOKS_NUMERIC = /^[\d\s.,:\/+\-]+$/;
var ISO_STAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
var FORMULA_LEAD = /^[=+\-@]/;

function needsSheetQuote_(s) {
  return (LOOKS_NUMERIC.test(s) && /\d/.test(s)) || ISO_STAMP.test(s) || FORMULA_LEAD.test(s);
}

function asSheetText_(s) {
  return needsSheetQuote_(s) ? "'" + s : s;
}

/** ค่าที่เพิ่งเขียน → ค่าที่ client เห็น (ถอด ' ที่ asSheetText_ ใส่ไว้) */
function echoCell_(cell, type) {
  if (typeof cell === 'string' && cell.charAt(0) === "'" && needsSheetQuote_(cell.slice(1))) cell = cell.slice(1);
  return normalizeValue_(cell, type);
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
  return asSheetText_(String(v));
}

/** เพิ่มแถวใหม่ คืน object ที่บันทึกแล้ว */
function insertRow_(name, obj) {
  var sh = ensureSheet_(name);
  var cols = SCHEMA[name];
  var row = cols.map(function (c) { return serializeValue_(obj[c.key], c.type); });
  sh.appendRow(row);
  var saved = {};
  cols.forEach(function (c, i) { saved[c.key] = echoCell_(row[i], c.type); });
  saved._row = sh.getLastRow();
  syncNote_(name, saved);
  return saved;
}

/** เขียนทับแถวเดิมทั้งแถว */
function updateRow_(name, rowNumber, obj) {
  var sh = ensureSheet_(name);
  rowNumber = verifyRow_(sh, name, rowNumber, obj);
  var cols = SCHEMA[name];
  var row = cols.map(function (c) { return serializeValue_(obj[c.key], c.type); });
  sh.getRange(rowNumber, 1, 1, cols.length).setValues([row]);
  var saved = {};
  cols.forEach(function (c, i) { saved[c.key] = echoCell_(row[i], c.type); });
  saved._row = rowNumber;
  syncNote_(name, saved);
  return saved;
}

/** @param {Object=} expect แถวที่อ่านมา (ใส่ไว้เพื่อตรวจว่ายังเป็นรายการเดิมก่อนลบ) */
function deleteRow_(name, rowNumber, expect) {
  var sh = ensureSheet_(name);
  var at = verifyRow_(sh, name, rowNumber, expect);
  var key = sh.getRange(at, 1).getValue();       // รหัสของแถวที่ลบจริง (ส่งให้อีกฝั่งลบตาม)
  sh.deleteRow(at);
  syncNote_(name, null, normalizeValue_(key, 'text'));
}

/**
 * ยืนยันว่าแถวที่จะเขียน/ลบ ยังเป็นรายการเดิมอยู่ (เทียบคอลัมน์แรก = รหัสของแถว)
 *
 * เลขแถวได้มาตอนอ่าน ถ้าระหว่างนั้นมีคนอื่นลบแถวข้างบนไป แถวทั้งหมดจะเลื่อนขึ้น
 * เขียนลงเลขเดิมตรง ๆ = ทับรายการของคนอื่น · ลบเลขเดิม = ลบผิดรายการ
 * ถ้าไม่ตรง หาแถวของรหัสนั้นใหม่ · หาไม่เจอแปลว่าถูกลบไปแล้ว ไม่เขียนอะไรทั้งนั้น
 */
function verifyRow_(sh, name, rowNumber, obj) {
  var col = SCHEMA[name] && SCHEMA[name][0];
  if (!col || col.type !== 'text' || !obj) return rowNumber;
  var want = String(obj[col.key] == null ? '' : obj[col.key]).trim();
  if (!want) return rowNumber;
  var last = sh.getLastRow();
  if (rowNumber >= 2 && rowNumber <= last &&
      String(normalizeValue_(sh.getRange(rowNumber, 1).getValue(), 'text')).trim() === want) return rowNumber;
  if (last >= 2) {
    var vals = sh.getRange(2, 1, last - 1, 1).getValues();
    for (var i = 0; i < vals.length; i++) {
      if (String(normalizeValue_(vals[i][0], 'text')).trim() === want) return i + 2;
    }
  }
  throw new Error('รายการนี้ถูกลบหรือย้ายไปแล้วโดยคนอื่น — โหลดหน้าใหม่แล้วลองอีกครั้ง');
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
  matrix.forEach(function (row) {
    var saved = {};
    cols.forEach(function (c, i) { saved[c.key] = echoCell_(row[i], c.type); });
    syncNote_(name, saved);
  });
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
/**
 * เลขห้อง / ชื่อพื้นที่ — ตรวจทุกครั้งก่อนบันทึก
 * ค่านี้ไปโผล่ในผังห้อง ปุ่ม และลิงก์ของทุกหน้า ถ้าปล่อยอักขระอย่าง < > " ' ` \ เข้าไป
 * อาจถูกใช้ฝังโค้ดในหน้าเว็บของคนอื่น (หน้าเว็บ escape แล้ว ตรงนี้กันซ้ำอีกชั้น)
 */
function cleanRoom_(v, required) {
  var s = String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  if (!s) {
    if (required) throw new Error('กรุณาระบุห้อง');
    return '';
  }
  if (s.length > 40) throw new Error('ชื่อห้อง/พื้นที่ยาวเกินไป (ไม่เกิน 40 ตัวอักษร)');
  if (/[<>"'`\\\u0000-\u001f]/.test(s)) throw new Error('ชื่อห้อง/พื้นที่มีอักขระที่ใช้ไม่ได้: < > " \' ` \\');
  return s;
}

/**
 * กรองตามปีที่เลือกดู โดย "งานที่ยังไม่ปิด" ของปีอื่นยังเห็นอยู่เสมอเมื่อดูปีปัจจุบัน
 *
 * ปีของงานคิดจากวันนัด/วันทำ นัดซ่อมไว้ 1 ม.ค. ปีหน้า งานจึงเป็นของปีหน้า
 * ถ้ากรองตามปีตรง ๆ พอบันทึกเสร็จงานจะหายไปจากหน้าจอทันที (ดูปีนี้อยู่) เหมือนบันทึกไม่ติด
 * แล้วคนก็กรอกซ้ำ งานค้างจากปีก่อนที่ยังไม่ได้ทำก็หายแบบเดียวกัน
 * แถวที่ยืมมาจากปีอื่นติด otherYear ไว้ให้หน้าเว็บติดป้ายบอก และไม่เอาไปรวมยอดเงินของปีที่ดู
 *
 * @param {function(Object):*} yearOfRow  ปีของแถว
 * @param {function(Object):boolean} isOpen  แถวนี้ยังไม่ปิดงานหรือไม่
 */
function inYearOrOpen_(rows, year, yearOfRow, isOpen) {
  if (!year || year === 'all') return rows;
  var viewingNow = String(year) === String(new Date().getFullYear());
  return rows.filter(function (r) {
    var y = String(yearOfRow(r) || '');
    if (y === String(year)) return true;
    if (viewingNow && isOpen(r)) { r.otherYear = y; return true; }
    return false;
  });
}

/** จำนวนเงินแบบมีจุลภาค ไม่มีทศนิยม — ใช้ในข้อความ (อีเมลสรุป ปฏิทิน) */
function fmtMoney_(n) {
  return (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

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

/**
 * ไบต์สุ่มสำหรับรหัสลับ (รหัสการเข้าใช้งาน กุญแจ ค่าสุ่มรหัสผ่าน รหัสเชื่อมต่อ)
 *
 * ห้ามใช้ Math.random() — มันไม่ได้ออกแบบมาให้เดาไม่ได้ ใครเห็นค่าที่สุ่มออกมาไม่กี่ค่า
 * อาจเดาค่าถัดไปได้ · Cloudflare (และ Node ตอนทดสอบ) มี crypto.getRandomValues
 * · Apps Script ไม่มี จึงใช้ Utilities.getUuid() ซึ่งสุ่มด้วยตัวสุ่มที่ปลอดภัยของ Java
 *   (ตัดไบต์ที่ 6 และ 8 ทิ้ง เพราะมีบิตคงที่บอกรุ่นของ UUID)
 */
function secureBytes_(n) {
  var out = [];
  if (typeof crypto !== 'undefined' && crypto && typeof crypto.getRandomValues === 'function') {
    var a = new Uint8Array(n);
    crypto.getRandomValues(a);
    for (var i = 0; i < n; i++) out.push(a[i]);
    return out;
  }
  while (out.length < n) {
    var hex = Utilities.getUuid().replace(/-/g, '');
    for (var j = 0; j < 16; j++) {
      if (j === 6 || j === 8) continue;
      out.push(parseInt(hex.substr(j * 2, 2), 16));
    }
  }
  return out.slice(0, n);
}

/** สตริงสุ่มจากตัวอักษรที่กำหนด · ตัดไบต์ที่เกินช่วงทิ้ง จะได้ทุกตัวอักษรมีโอกาสเท่ากัน */
function randomString_(abc, len) {
  var limit = 256 - (256 % abc.length);
  var out = '';
  while (out.length < len) {
    secureBytes_(len * 2).forEach(function (b) {
      if (out.length < len && b < limit) out += abc.charAt(b % abc.length);
    });
  }
  return out;
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

/** 'YYYY-MM-DD' -> '26 เม.ย. 2026' (ใช้ในข้อความแจ้งเตือน/อีเมล) */
var TH_MONTHS_ = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

/**
 * แปลงปี ค.ศ. เป็นปีที่จะแสดงบนหน้าจอ ตามที่ตั้งไว้ในหน้าตั้งค่า
 *
 * ข้อมูลในชีตเก็บเป็น ค.ศ. เสมอ ไม่ว่าจะตั้งค่าเป็นอะไร
 * ตรงนี้แปลงตอนแสดงผลเท่านั้น จะได้ไม่มีทางที่ข้อมูลจริงเพี้ยนไป
 */
function displayYear_(ceYear) {
  return useBuddhistYear_() ? Number(ceYear) + 543 : Number(ceYear);
}

function useBuddhistYear_() {
  return String(getSetting_('date_format', 'ค.ศ. (2026)')).indexOf('พ.ศ.') === 0;
}

function thDate_(v) {
  var d = toDate_(v);
  if (!d) return '–';
  return d.getDate() + ' ' + TH_MONTHS_[d.getMonth()] + ' ' + displayYear_(d.getFullYear());
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
      sh.getRange(rows[i]._row, 3).setValue(serializeValue_(String(value), 'text'));   // ใส่ ' กันรหัส 0 นำหน้าหาย/กลายเป็นสูตร
      syncNote_(SHEETS.SETTINGS, Object.assign({}, rows[i], { value: String(value) }));
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
  return randomString_('ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789', len || 32);
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
  deleteRow_(SHEETS.USERS, u._row, u);
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
  if (s) deleteRow_(SHEETS.SESSIONS, s._row, s);
  return true;
}

/**
 * ออกจากระบบทุกเครื่องของผู้ใช้ (รวมอุปกรณ์ที่ตั้ง PIN ไว้)
 * @param {string[]=} keepTokens รหัสที่ไม่ต้องลบ — เช่น เครื่องที่กำลังเปลี่ยนรหัสผ่านอยู่ และ PIN ของเครื่องนั้น
 * @return {number} จำนวนที่ลบ
 */
function revokeAllSessions_(username, keepTokens) {
  var u = normUsername_(username);
  var keep = (keepTokens || []).map(String).filter(String);
  var rows = readRows_(SHEETS.SESSIONS);
  var n = 0;
  for (var i = rows.length - 1; i >= 0; i--) {
    if (normUsername_(rows[i].username) !== u) continue;
    if (keep.some(function (t) { return safeEqual_(rows[i].token, t); })) continue;
    deleteRow_(SHEETS.SESSIONS, rows[i]._row, rows[i]); n++;
  }
  // อีกระบบ (Cloudflare ⇄ Apps Script) มีการเข้าใช้งานแยกของตัวเอง ต้องให้ออกจากระบบที่นั่นด้วย
  // เครื่องที่ยกเว้นไว้ (keepTokens) อยู่ฝั่งนี้เท่านั้น ฝั่งโน้นออกทั้งหมด
  syncNoteRevoke_(username, false);
  return n;
}

/** ลบรายการที่หมดอายุทิ้ง ไม่ให้ชีตบวม */
function purgeSessions_() {
  var rows = readRows_(SHEETS.SESSIONS);
  var removed = 0;
  for (var i = rows.length - 1; i >= 0; i--) {
    if (isExpired_(rows[i])) { deleteRow_(SHEETS.SESSIONS, rows[i]._row, rows[i]); removed++; }
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
  if (isExpired_(d)) { deleteRow_(SHEETS.SESSIONS, d._row, d); throw new Error('ครบกำหนดยืนยันตัวตนใหม่ — กรุณาล็อกอินด้วยรหัสผ่าน'); }

  var u = findUser_(d.username);
  if (!u || u.status === 'ระงับ') { deleteRow_(SHEETS.SESSIONS, d._row, d); throw new Error('บัญชีนี้ใช้งานไม่ได้แล้ว'); }

  if (!safeEqual_(hashSecret_(pin, d.pinSalt), d.pinHash)) {
    var n = (toNumber_(d.failCount) || 0) + 1;
    if (n >= 5) {
      deleteRow_(SHEETS.SESSIONS, d._row, d);
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
  if (d) { deleteRow_(SHEETS.SESSIONS, d._row, d); logActivity_('ยกเลิก PIN บนอุปกรณ์', d.username, d.device || ''); }
  return true;
}

/** ยกเลิกอุปกรณ์ทั้งหมดของผู้ใช้ (เช่นทำเครื่องหาย) */
function forgetAllDevices_(username) {
  var u = normUsername_(username);
  var rows = readRows_(SHEETS.SESSIONS);
  var n = 0;
  for (var i = rows.length - 1; i >= 0; i--) {
    if (rows[i].kind === 'อุปกรณ์' && normUsername_(rows[i].username) === u) {
      deleteRow_(SHEETS.SESSIONS, rows[i]._row, rows[i]); n++;
    }
  }
  logActivity_('ยกเลิกอุปกรณ์ทั้งหมด', username, n + ' เครื่อง');
  syncNoteRevoke_(username, true);   // ยกเลิก PIN ในอีกระบบด้วย
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
var MUTATING_ACTIONS = /^ocr\.read$|\.(save|delete|savePayment|deletePayment|bulkBook|import|send|rotateToken|backupNow|upload|trash|toggle|setStatus|reconcile)$/;

/**
 * คำสั่งที่เฉพาะผู้ดูแลเท่านั้น
 * backup.* ทั้งหมดอยู่ในนี้เพราะไฟล์สำรองมีข้อมูลบัญชีผู้ใช้ติดไปด้วย
 */
var ADMIN_ONLY_ACTIONS = /^(user\.|share\.|settings\.save|backup\.|sync\.|auth\.forgetAllDevices)/;

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

var REQUEST_ACTOR_ = null;

function requireRole_(action, payloadOrKey) {
  var payload = (payloadOrKey && typeof payloadOrKey === 'object') ? payloadOrKey : { _key: payloadOrKey };
  if (PUBLIC_ACTIONS.test(action)) return ROLE.NONE;

  var actor = resolveActor_(payload);
  REQUEST_ACTOR_ = actor;      // คำสั่งที่ต้องรู้ว่าใครเรียก ใช้ตัวนี้ได้เลย ไม่ต้องอ่านชีตการเข้าใช้งานซ้ำ
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
  return randomString_('ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz', len || 22);
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
      { key: 'ac_cycle_months', type: 'number', min: 1, max: 24 },
      { key: 'warranty_alert_days', type: 'number', min: 1, max: 365 },
      { key: 'overdue_alert_days', type: 'number', min: 1, max: 365 },
      { key: 'due_soon_days', type: 'number', min: 0, max: 60 },
      { key: 'notify_email', type: 'text' },
      { key: 'notify_weekday', type: 'select', options: ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'] }
    ]
  },
  {
    group: 'การเงิน', icon: '💰',
    items: [
      { key: 'currency', type: 'text' },
      { key: 'default_due_day', type: 'number', min: 1, max: 31 },
      { key: 'late_fee', type: 'number', min: 0, max: 100000 }
    ]
  },
  {
    group: 'ความปลอดภัยและการเข้าใช้งาน', icon: '🔐',
    items: [
      { key: 'share_link_enabled', type: 'select', options: ['ปิด', 'เปิด'] },
      { key: 'session_hours', type: 'number', min: 1, max: 720 },
      { key: 'device_days', type: 'number', min: 1, max: 365 },
      { key: 'login_max_fail', type: 'number', min: 3, max: 20 },
      { key: 'login_lock_minutes', type: 'number', min: 1, max: 1440 }
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
      { key: 'backup_keep', type: 'number', min: 1, max: 365 },
      { key: 'backup_hour', type: 'number', min: 0, max: 23, note: '0–23 นาฬิกา' }
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
          min: it.min != null ? it.min : null,
          max: it.max != null ? it.max : null,
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
      // ช่วงที่ใช้งานได้จริง — เช่น "ใส่รหัสผิดได้กี่ครั้ง" = -1 จะล็อกทุกคนตั้งแต่พิมพ์ผิดครั้งแรก
      // ตรวจเฉพาะค่าที่เปลี่ยน: ค่าเก่าที่บันทึกไว้ก่อนมีกติกานี้ ต้องไม่ทำให้บันทึกช่องอื่นไม่ได้
      var changedNow = String(getSetting_(k, '')) !== String(n);
      if (changedNow && ((spec.min != null && n < spec.min) || (spec.max != null && n > spec.max))) {
        throw new Error(settingMeta_(k).label + ': ต้องอยู่ระหว่าง ' + spec.min + '–' + spec.max);
      }
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
var UPLOAD_MAX_BYTES = 12 * 1024 * 1024;   // ให้ตรงกับที่หน้าเว็บกันไว้
var UPLOAD_MAX_FILES = 20;

/**
 * ดูชนิดไฟล์จาก "เนื้อไฟล์" (ไบต์แรก ๆ) ไม่เชื่อชื่อหรือชนิดที่หน้าเว็บบอกมา
 * ไฟล์แนบถูกแชร์แบบใครมีลิงก์ก็เปิดได้ ถ้ารับทุกชนิด คนที่มีสิทธิ์แก้ไข
 * จะอัปโหลดหน้าเว็บหลอก/ไฟล์อันตรายไปฝากไว้ใน Drive ของเจ้าของหอ แล้วส่งลิงก์ต่อได้
 * รับเฉพาะรูปกับ PDF (สลิป ใบเสร็จ ภาพประกอบ) · คืน mime ที่ถูกต้อง หรือ '' ถ้าไม่รับ
 */
function sniffUpload_(bytes) {
  var b = [];
  for (var i = 0; i < Math.min(16, bytes.length); i++) b.push(bytes[i] & 0xff);
  var ascii = function (from, to) { return String.fromCharCode.apply(null, b.slice(from, to)); };
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && ascii(1, 4) === 'PNG') return 'image/png';
  if (ascii(0, 4) === 'GIF8') return 'image/gif';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (ascii(0, 5) === '%PDF-') return 'application/pdf';
  if (ascii(0, 2) === 'BM') return 'image/bmp';
  if (ascii(4, 8) === 'ftyp' && /^(heic|heix|hevc|heim|heis|mif1|msf1|avif)$/.test(ascii(8, 12))) {
    return ascii(8, 12) === 'avif' ? 'image/avif' : 'image/heic';
  }
  return '';
}

function uploadFiles_(payload) {
  var bucket = (payload && payload.bucket) || 'misc';
  var files = ((payload && payload.files) || []).filter(function (f) { return f && f.dataUrl; });
  if (files.length > UPLOAD_MAX_FILES) throw new Error('แนบได้ครั้งละไม่เกิน ' + UPLOAD_MAX_FILES + ' ไฟล์');

  // ตรวจครบทุกไฟล์ก่อน ค่อยสร้างไฟล์จริง — ไม่ให้เหลือไฟล์ครึ่ง ๆ กลาง ๆ ถ้ามีไฟล์หนึ่งไม่ผ่าน
  var ready = files.map(function (f) {
    var base64 = String(f.dataUrl).indexOf(',') >= 0
      ? String(f.dataUrl).split(',')[1]
      : String(f.dataUrl);
    var bytes = Utilities.base64Decode(base64);
    var name = String(f.name || 'file');
    if (bytes.length > UPLOAD_MAX_BYTES) throw new Error('ไฟล์ใหญ่เกิน 12 MB: ' + name);
    var mime = sniffUpload_(bytes);
    if (!mime) throw new Error('แนบได้เฉพาะรูปภาพ (JPG PNG WEBP HEIC GIF) หรือ PDF — ไฟล์นี้ใช้ไม่ได้: ' + name);
    return { bytes: bytes, mime: mime, name: name };
  });

  var folder = folderFor_(bucket);
  var out = [];
  ready.forEach(function (f) {
    var safeName = f.name
      .replace(/[\\/:*?"<>|]/g, '_')
      .slice(0, 90);
    var stamped = Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyyMMdd-HHmmss') + '-' + safeName;
    var blob = Utilities.newBlob(f.bytes, f.mime, stamped);
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
    // ลิงก์อื่นที่ไม่ใช่ไฟล์ Drive รับเฉพาะ https — กัน javascript: ที่ถูกพิมพ์ใส่ช่องไฟล์แนบ
    if (!id) return { id: '', name: raw, url: /^https:\/\//i.test(String(raw).trim()) ? String(raw).trim() : '', thumb: '' };
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

/**
 * ไฟล์นี้อยู่ในโฟลเดอร์ไฟล์แนบของระบบหรือไม่ (ไล่ขึ้นไปตามโฟลเดอร์แม่)
 *
 * สคริปต์ทำงานด้วยสิทธิ์ของเจ้าของ เข้าถึง Drive ของเจ้าของได้ทั้งหมด
 * ถ้ารับรหัสไฟล์อะไรก็ได้ คนที่มีสิทธิ์แก้ไขจะลบไฟล์ส่วนตัวของเจ้าของทิ้ง
 * หรือส่งเอกสารส่วนตัวไปอ่านข้อความ (OCR) แล้วได้เนื้อหากลับไปได้
 * จึงยอมเฉพาะไฟล์ที่ระบบเป็นคนอัปโหลดไว้เอง
 */
function isAppFile_(file) {
  var rootId = props_().getProperty(PROP.DRIVE_FOLDER_ID);
  if (!rootId || !file || typeof file.getParents !== 'function') return false;
  var queue = [], seen = {};
  var it = file.getParents();
  while (it.hasNext()) queue.push({ f: it.next(), depth: 1 });
  while (queue.length) {
    var cur = queue.shift();
    var id = cur.f.getId();
    if (id === rootId) return true;
    if (seen[id] || cur.depth >= 6) continue;
    seen[id] = true;
    var up = cur.f.getParents();
    while (up.hasNext()) queue.push({ f: up.next(), depth: cur.depth + 1 });
  }
  return false;
}

/** เปิดไฟล์ของระบบตามรหัส — ไฟล์นอกโฟลเดอร์ไฟล์แนบถือว่าไม่มี */
function appFileById_(fileId) {
  var id = extractDriveId_(fileId) || String(fileId || '').trim();
  if (!id) throw new Error('ไม่พบไฟล์');
  var file;
  try { file = DriveApp.getFileById(id); } catch (e) { throw new Error('ไม่พบไฟล์'); }
  if (!isAppFile_(file)) throw new Error('ไฟล์นี้ไม่ได้อยู่ในโฟลเดอร์ไฟล์แนบของระบบ');
  return file;
}

/** ลบไฟล์ (ย้ายลงถังขยะ) — เฉพาะไฟล์แนบของระบบ */
function trashFile_(fileId) {
  var file = appFileById_(fileId);
  try { file.setTrashed(true); return true; }
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
    return appFileById_(p.fileId).getBlob();   // เฉพาะไฟล์แนบของระบบ ไม่ใช่ไฟล์ไหนก็ได้ใน Drive
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
  { payDate: "2022-04-14", amount: 1104641, installment: "3/2022" },
  { payDate: "2022-04-14", amount: 309000, installment: "4/2022" },
  { payDate: "2018-04-23", amount: 1278000, installment: "2019" },
  { payDate: "2022-05-18", amount: 100000, installment: "2022" },
  { payDate: "2022-06-10", amount: 100000, installment: "2022" },
  { payDate: "2023-04-19", amount: 98000, installment: "2023" },
  { payDate: "2023-04-26", amount: 100013, installment: "2023" },
  { payDate: "2023-05-14", amount: 90000, installment: "2023" },
  { payDate: "2024-03-06", amount: 60000, installment: "3/2024" },
  { payDate: "2024-04-26", amount: 70000, installment: "4/2024" },
  { payDate: "2024-07-16", amount: 80000, installment: "6/2024" },
  { payDate: "2024-09-05", amount: 160000, installment: "8/2024" },
  { payDate: "2024-09-16", amount: 80000, installment: "9/2024" },
  { payDate: "2024-10-18", amount: 80000, installment: "10/2024" },
  { payDate: "2024-11-26", amount: 80000, installment: "11/2024" },
  { payDate: "2024-12-20", amount: 80000, installment: "12/2024" },
  { payDate: "2025-01-21", amount: 80000, installment: "01/2025" },
  { payDate: "2025-01-20", amount: 80000, installment: "02/2025" },
  { payDate: "2025-05-20", amount: 80000, installment: "05/2025" },
  { payDate: "2025-06-20", amount: 80000, installment: "06/2025" },
  { payDate: "2025-08-07", amount: 80000, installment: "07/2025" },
  { payDate: "2025-08-20", amount: 80000, installment: "08/2025" },
  { payDate: "2025-09-20", amount: 80000, installment: "09/2025" },
  { payDate: "2025-10-25", amount: 80000, installment: "10/2025" },
  { payDate: "2025-12-25", amount: 80000, installment: "12/2025" },
  { payDate: "2026-01-21", amount: 80000, installment: "1/2026" },
  { payDate: "2026-03-13", amount: 80000, installment: "3/2026" },
  { payDate: "2026-04-20", amount: 50000, installment: "4/2026" },
  { payDate: "2026-05-19", amount: 80000, installment: "5/2026" },
  { payDate: "2026-06-15", amount: 70000, installment: "6/2026" },
  { payDate: "2026-07-13", amount: 70000, installment: "7/2026" },
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
  deleteRow_(SHEETS.FINANCE, found._row, found);
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
    year: y, month: m, label: TH_MONTH_NAMES[m - 1] + ' ' + displayYear_(y),
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

  // หลัง deploy ถ้ามีคนเปิดเว็บพร้อมกันสองเครื่อง ทั้งคู่จะเข้ามาย้ายข้อมูลพร้อมกัน
  // การย้ายบางรุ่นล้างทั้งชีตแล้วเขียนใหม่ ถ้าซ้อนกันแถวหายหรือซ้ำได้ — ให้ทำทีละคนเท่านั้น
  return withScriptLock_(function () {
    // คนก่อนหน้าอาจย้ายเสร็จไปแล้วระหว่างที่รอล็อก
    from = Number(props_().getProperty('SCHEMA_VERSION') || 0);
    if (from >= SCHEMA_VERSION) return { migrated: false, from: from, to: SCHEMA_VERSION };

    var snapshot = snapshotBeforeMigrate_(from);

    var done = [];
    if (from < 2) done.push(migrateV2SplitPayment_());
    if (from < 3) done.push(migrateV3DebtParent_());
    if (from < 4) done.push(migrateV4Users_());
    if (from < 5) done.push(migrateV5RefreshRate_());
    if (from < 7) done.push(migrateV7RepairTodo_());
    if (from < 8) done.push(migrateV8ChristianYear_());
    if (from < 9) done.push(migrateV9InstallmentText_());
    if (from < 10) done.push(migrateV10ShareConstruction_());
    if (snapshot) done.unshift('สำเนาก่อนย้าย: ' + snapshot);

    props_().setProperty('SCHEMA_VERSION', String(SCHEMA_VERSION));
    logActivity_('ย้ายโครงสร้างข้อมูล', from + ' → ' + SCHEMA_VERSION, done);
    return { migrated: true, from: from, to: SCHEMA_VERSION, steps: done };
  }, 120000);
}

/**
 * ทำสำเนาไฟล์ Google Sheet ทั้งไฟล์ (ค่าดิบทุกช่อง) ไว้ในโฟลเดอร์สำรองก่อนย้ายข้อมูล
 * ถ้าการย้ายรุ่นไหนพลาด ยังเปิดสำเนานี้ดูหรือคัดลอกกลับได้ครบ
 * ไม่ใช้ exportAll_ เพราะมันอ่านผ่านโครงคอลัมน์ใหม่ คอลัมน์เก่าที่กำลังจะย้ายจะไม่ติดไปด้วย
 * ติดตั้งครั้งแรก (ยังไม่มีข้อมูล) ไม่ต้องทำ · ทำไม่สำเร็จก็ย้ายต่อ (แอปต้องใช้งานได้) แต่จดไว้
 */
function snapshotBeforeMigrate_(from) {
  if (!from) return '';
  try {
    var name = 'สำเนาก่อนย้ายข้อมูล-รุ่น' + from + '-' +
      Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyy-MM-dd-HHmm');
    // สร้างไฟล์ชีตใหม่แล้วคัดลอกทีละแผ่น — ไม่ใช้ makeCopy ทั้งไฟล์
    // เพราะ makeCopy คัดลอกโค้ด Apps Script ที่ผูกกับชีตไปด้วย ทุกครั้งที่ย้ายข้อมูล
    // จะเกิดโปรเจกต์ชื่อเดียวกันเพิ่มอีกอันในรายการโปรเจกต์ จนไม่รู้ว่าอันไหนของจริง
    // แผ่น Sessions ไม่คัดลอก (มีรหัสการเข้าใช้งานที่ยังใช้ได้อยู่ ไม่ควรไปอยู่ในไฟล์สำรอง)
    var src = getSpreadsheet_();
    var dest = SpreadsheetApp.create(name);
    var blank = dest.getSheets();
    src.getSheets().forEach(function (sh) {
      if (!exportable_(sh.getName())) return;
      sh.copyTo(dest).setName(sh.getName());
    });
    blank.forEach(function (sh) { if (dest.getSheets().length > 1) dest.deleteSheet(sh); });
    try { DriveApp.getFileById(dest.getId()).moveTo(backupFolder_()); } catch (e) { /* อยู่ที่ My Drive ก็ยังใช้กู้ได้ */ }
    return name;
  } catch (e) {
    console.warn('snapshotBeforeMigrate_: ' + e);
    return '';
  }
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
  syncNoteSheet_(name);
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
 * รุ่น 8 — แสดงปีเป็น ค.ศ. ให้ตรงกับปีที่เก็บในชีตและปฏิทินสากล
 *
 * ข้อมูลในชีตเก็บเป็น ค.ศ. มาตลอดอยู่แล้ว (2026-01-19) ไม่มีอะไรต้องแปลง
 * ที่เป็น พ.ศ. คือหน้าจอเท่านั้น — และช่องตั้งค่า "รูปแบบปีที่แสดง"
 * ก็มีมาตั้งแต่แรกแต่ไม่มีโค้ดไหนอ่านค่ามันเลย กดเปลี่ยนแล้วไม่มีอะไรเกิดขึ้น
 *
 * รุ่นนี้ทำให้ช่องนั้นใช้งานได้จริง และตั้งค่าเดิมของทุกเครื่องเป็น ค.ศ.
 * ใครอยากกลับไปใช้ พ.ศ. ก็เลือกได้เองในหน้าตั้งค่า
 */
function migrateV8ChristianYear_() {
  var before = getSetting_('date_format', '');
  setSetting_('date_format', 'ค.ศ. (2026)');

  // ช่อง "งวดที่" ของรายการโอนใช้หนี้เป็นช่องข้อความ ชีตเดิมกรอกเป็น พ.ศ. ไว้
  // เช่น "7/2569" หรือ "2565" — อันนี้เป็นข้อมูลจริง ไม่ใช่แค่การแสดงผล จึงต้องแปลง
  var changed = installmentsToCE_();
  return 'ปีที่แสดง: ' + (before || '(ยังไม่เคยตั้ง)') + ' → ค.ศ. · แปลงช่องงวดที่ ' + changed + ' รายการ';
}

/**
 * รุ่น 9 — ช่องงวดที่ชีตแอบแปลงเป็นวันที่
 *
 * "7/2569" ที่กรอกลงชีตตรง ๆ ถูกชีตเก็บเป็นวันที่ 1 ก.ค. 2569 รุ่น 8 จึงมองไม่เห็นว่าเป็น พ.ศ.
 * และหน้าเว็บแสดงเป็น "Sat Jul 01 2569 00:00:00 GMT+0700" ตอนนี้ readRows_ อ่านค่าพวกนี้
 * กลับเป็น "7/2569" ได้แล้ว จึงแปลงเป็น ค.ศ. อีกรอบ แล้วเขียนกลับเป็นข้อความถาวร
 * (ไม่แตะการตั้งค่าปีที่แสดง ใครเลือก พ.ศ. ไว้ก็ยังเป็น พ.ศ.)
 */
function migrateV9InstallmentText_() {
  return 'ช่องงวดที่: แปลงเป็น ค.ศ. ' + installmentsToCE_(true) + ' รายการ · เขียนกลับเป็นข้อความทั้งชีต';
}

/**
 * รุ่น 10 — ก้อนหนี้แสดงได้สองหน้า (คอลัมน์ "แสดงในบัญชีด้วย")
 *
 * ค่าก่อสร้างยังต้องผ่อนต่อ เจ้าของหออยากเห็นในหน้าหนี้สินด้วย
 * เป็นก้อนเดียวกัน ไม่ได้คัดลอก — บันทึกการชำระจากหน้าไหนก็เข้าก้อนเดียวกัน
 * ตั้งให้เฉพาะก้อนค่าก่อสร้างที่ยังไม่เคยตั้งค่าไว้ ใครปิดเองภายหลังก็ไม่ถูกตั้งทับ
 */
function migrateV10ShareConstruction_() {
  var rows = readRows_(SHEETS.DEBTS);    // ensureSheet_ เพิ่มคอลัมน์ใหม่ให้เองตามหัวตาราง
  var hit = rows.filter(function (d) {
    return d.ledger === LEDGER_MAIN && String(d.title || '').indexOf('ค่าก่อสร้าง') >= 0 && !String(d.alsoIn || '').trim();
  })[0];
  if (!hit) return 'ก้อนหนี้: เพิ่มคอลัมน์แสดงในบัญชีด้วย (ไม่พบก้อนค่าก่อสร้างที่ต้องตั้ง)';
  hit.alsoIn = LEDGER_SUB;
  updateRow_(SHEETS.DEBTS, hit._row, hit);
  return 'ก้อนหนี้: "' + hit.title + '" แสดงในหน้าหนี้สินด้วย';
}

/** แปลงช่องงวดที่ทั้งชีตเป็น ค.ศ. คืนจำนวนแถวที่เปลี่ยน · force = เขียนทับทั้งชีตแม้ค่าไม่เปลี่ยน */
function installmentsToCE_(force) {
  var name = SHEETS.DEBT_PAYMENTS;
  var rows = readRows_(name);
  var changed = 0;
  rows.forEach(function (r) {
    var next = installmentToCE_(r.installment);
    if (next !== String(r.installment == null ? '' : r.installment)) { r.installment = next; changed++; }
  });
  // เขียนทับเสมอเมื่อ force เพราะเซลล์ที่เป็นวันที่อยู่ ถึงค่าที่อ่านได้จะไม่เปลี่ยน ก็ต้องเขียนกลับเป็นข้อความ
  if (changed || (force && rows.length)) rewriteSheet_(name, rows.map(function (r) {
    var out = {};
    SCHEMA[name].forEach(function (c) { out[c.key] = r[c.key]; });
    return out;
  }));
  return changed;
}

/**
 * "7/2569" -> "7/2026" และ "2565" -> "2022"
 *
 * ผูกกับทั้งข้อความพอดี ไม่ใช่ค้นหาเลขลอย ๆ ตรงกลาง
 * เพราะมีชื่อร้านอย่าง "ฟาฮาน่า แมทเทรส 2560 จำกัด" และรหัสรายการ
 * อย่าง "BUY-MTL6QOVE2531" ที่มีเลขคล้ายปีอยู่ข้างใน ห้ามไปแตะ
 */
function installmentToCE_(text) {
  var raw = String(text == null ? '' : text).trim();
  var m = raw.match(/^(\d{1,2}\/)?(25\d{2})$/);
  if (!m) return raw;
  return (m[1] || '') + (Number(m[2]) - 543);
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

/**
 * แถวลับในชีต Settings (กุญแจกู้ระบบ กุญแจแชร์ รหัสประตู) ห้ามออกไปกับไฟล์สำรอง
 * ไฟล์สำรองถูกเก็บใน Drive และดาวน์โหลดไปเก็บที่อื่นได้ ถ้าหลุดไป
 * คนที่ได้ไฟล์จะเข้าระบบเป็นผู้ดูแลได้ทันทีด้วยกุญแจกู้ระบบ
 * และขาเข้าก็ไม่ยอมให้ไฟล์สำรองเขียนทับค่าพวกนี้ (กันไฟล์ที่ถูกแก้มาฝังกุญแจที่คนอื่นรู้)
 */
function isSecretRow_(sheetName, row) {
  return sheetName === SHEETS.SETTINGS && SECRET_SETTINGS.indexOf(String(row && row.key)) >= 0;
}

/** ส่งออกทุกชีตเป็นก้อน JSON เดียว — เฉพาะผู้ดูแล (ดู ADMIN_ONLY_ACTIONS) */
function exportAll_() {
  var out = { app: APP.NAME, version: APP.VERSION, exportedAt: nowStamp_(), sheets: {} };
  Object.keys(SHEETS).forEach(function (k) {
    var name = SHEETS[k];
    if (!exportable_(name)) return;
    out.sheets[name] = readRows_(name).filter(function (r) { return !isSecretRow_(name, r); }).map(function (r) {
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
  var rows = readRows_(sheetName).filter(function (r) { return !isSecretRow_(sheetName, r); });
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
  // ข้อความที่ขึ้นต้นด้วย = + - @ Excel จะรันเป็นสูตรตอนเปิดไฟล์ (CSV injection) — ใส่ ' นำหน้าให้เป็นข้อความ
  // ตัวเลขจริง (เช่น ยอดติดลบ) ไม่แตะ
  if (typeof v !== 'number' && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
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
    var incoming = (data.sheets[name] || []).filter(function (r) { return r && !isSecretRow_(name, r); });
    // แทนที่บัญชีผู้ใช้ทั้งชุดด้วยไฟล์ที่ไม่มีผู้ดูแลที่ใช้งานได้ = ล็อกทุกคนออกจากระบบ ไม่ยอม
    if (name === SHEETS.USERS && mode === 'replace' && !incoming.some(function (u) {
      return u.role === ROLE.ADMIN && String(u.status || 'ใช้งาน') === 'ใช้งาน';
    })) { stat[name] = 'ข้าม — ไฟล์ไม่มีผู้ดูแลที่ใช้งานได้'; return; }
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
  syncNoteSheet_(name);
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

/** บัญชีอื่นที่ก้อนนี้ไปแสดงด้วย ('' = ไม่มี) — ตั้งเป็นบัญชีเดียวกับตัวเองไม่มีผล */
function sharedLedger_(d) {
  var also = String((d && d.alsoIn) || '').trim();
  return also && also !== d.ledger && (also === LEDGER_MAIN || also === LEDGER_SUB) ? also : '';
}

/** ก้อนหนี้นี้แสดงในหน้าของบัญชีนี้หรือไม่ (บัญชีตัวเอง หรือตั้งให้แสดงร่วมไว้) */
function debtInLedger_(d, ledger) {
  return d.ledger === ledger || sharedLedger_(d) === ledger;
}

function listDebts_(ledger) {
  var rows = readRows_(SHEETS.DEBTS);
  if (ledger) rows = rows.filter(function (d) { return debtInLedger_(d, ledger); });
  return rows;
}

/**
 * รายการชำระที่แสดงในหน้าของบัญชีหนึ่ง
 * = ของบัญชีตัวเอง + รายการจากบัญชีอื่นที่ไปตัดก้อนที่ตั้งให้แสดงที่นี่ด้วย
 * เป็นแถวเดียวกันในชีต แก้/ลบจากหน้าไหนก็เปลี่ยนทั้งสองหน้า
 */
function ledgerPayments_(ledger, year) {
  var debts = readRows_(SHEETS.DEBTS);
  var all = listDebtPayments_(null, 'all');
  debtGraph_(debts, all);
  var byId = {};
  debts.forEach(function (d) { byId[String(d.id)] = d; });
  return all.filter(function (p) {
    if (year && year !== 'all' && String(p.year || yearOf_(p.payDate)) !== String(year)) return false;
    if (p.ledger === ledger) return true;
    var hit = (p._toDebts || []).some(function (id) { return byId[id] && sharedLedger_(byId[id]) === ledger; });
    if (hit) p.sharedFrom = p.ledger;
    return hit;
  });
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

/** ช่องทางของรายการ "ปรับยอดให้ตรงกับยอดจริง" — ไม่ใช่เงินที่โอนจริง จึงไม่นับเป็นยอดผ่อนรายปี */
var ADJUST_CHANNEL = 'ปรับยอด';

function isAdjustment_(p) { return String(p && p.channel || '') === ADJUST_CHANNEL; }

/**
 * ปันส่วนรายการชำระให้แต่ละก้อนหนี้
 *   ระบุก้อนหนี้ไว้     → เข้าก้อนนั้นเต็มจำนวน
 *   ไม่ได้ระบุ          → ตัดก้อนที่เริ่มก่อนให้หมดก่อน แล้วค่อยไหลไปก้อนถัดไป
 *                        (ก้อนที่เริ่มวันเดียวกัน ตัดก้อนเล็กก่อน)
 *   ก้อนไหนได้เกินยอดตั้งต้น → ส่วนเกินไหลต่อไปก้อนถัดไป ไม่หายไปเฉย ๆ
 *                        (เช่น จ่ายคืนป้าตาครบตอนที่ค่าที่ดินเต็มไปแล้ว)
 *
 * ทำไมไม่เฉลี่ยตามสัดส่วน: ของจริงคือจ่ายค่าที่ดินจนหมดก่อนค่อยมาผ่อนค่าก่อสร้าง
 * ถ้าเฉลี่ย ค่าที่ดินจะไม่มีวันปิดได้เลยทั้งที่จ่ายครบแล้ว และค่าก่อสร้างจะดูเหมือนจ่ายไปเกินจริง
 * ผลสุดท้ายไม่ขึ้นกับลำดับวันที่ของรายการ — ยอดชำระรวมเท่าเดิม แค่เติมก้อนเก่าให้เต็มก่อน
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

  // ลำดับการตัดของแต่ละบัญชี: เริ่มก่อน → ก้อนเล็กก่อน → ลำดับในชีต
  // ก้อนที่ตั้ง "แสดงในบัญชีอื่นด้วย" ไว้ อยู่ในคิวของบัญชีนั้นด้วย
  // บันทึกการชำระจากหน้าไหนก็ไหลมาลงก้อนเดียวกัน
  var queue = {};
  debts.forEach(function (d, i) {
    if (!isLedgerRoot(d)) return;
    (queue[d.ledger] = queue[d.ledger] || []).push({ d: d, i: i });
    var also = sharedLedger_(d);
    if (also) (queue[also] = queue[also] || []).push({ d: d, i: i });
  });
  Object.keys(queue).forEach(function (k) {
    queue[k] = queue[k].sort(function (a, b) {
      var sa = toIsoDate_(a.d.startDate) || '9999', sb = toIsoDate_(b.d.startDate) || '9999';
      if (sa !== sb) return sa < sb ? -1 : 1;
      var pa = toNumber_(a.d.principal) || 0, pb = toNumber_(b.d.principal) || 0;
      if (pa !== pb) return pa - pb;
      return a.i - b.i;
    }).map(function (x) { return x.d; });
  });

  var own = {};
  debts.forEach(function (d) { own[String(d.id)] = { principal: 0, interest: 0 }; });

  /** เงินต้นที่ลงก้อนนี้ไปแล้ว รวมก้อนลูกทุกชั้น */
  function allocated(d, guard) {
    guard = guard || 0;
    if (guard > 20) return 0;
    var sum = own[String(d.id)].principal;
    (children[String(d.id)] || []).forEach(function (c) { sum += allocated(c, guard + 1); });
    return sum;
  }

  function principalOf(d) { return toNumber_(d.principal) || 0; }

  // 1) รายการที่ระบุก้อนไว้ เข้าก้อนนั้นตรง ๆ · ที่ไม่ได้ระบุ รอเทลงคิวของบัญชีตัวเอง
  var loose = [];
  payments.forEach(function (p) {
    var id = String(p.debtId || '').trim();
    p._toDebts = [];
    p._split = {};
    if (id && own[id]) {
      own[id].principal += toNumber_(p.principal) || 0;
      own[id].interest += toNumber_(p.interest) || 0;
      p._toDebts.push(id);
      p._split[id] = toNumber_(p.principal) || 0;
    } else {
      loose.push(p);
    }
  });

  // 2) ก้อนที่ได้เกินยอดตั้งต้นแล้ว (เช่น จ่ายคืนก้อนย่อยทีหลังตอนที่ก้อนแม่เต็มไปแล้ว)
  //    ส่วนที่เกินไม่ได้หายไปไหน ไหลไปก้อนถัดไปในคิวของบัญชีนั้น
  var spill = {};
  debts.forEach(function (d) {
    if (!isLedgerRoot(d)) return;
    var over = allocated(d) - principalOf(d);
    if (over > 0) { own[String(d.id)].principal -= over; spill[d.ledger] = (spill[d.ledger] || 0) + over; }
  });

  /** เทเงินลงคิวจนเต็มทีละก้อน คืนรหัสก้อนที่ได้รับ · เกินทุกก้อนพักไว้ก้อนสุดท้าย */
  function pour(roots, amount, split) {
    var got = [];
    roots.forEach(function (d, k) {
      if (amount <= 0) return;
      var room = Math.max(0, principalOf(d) - allocated(d));
      var take = k === roots.length - 1 ? amount : Math.min(amount, room);
      if (take <= 0) return;
      own[String(d.id)].principal += take;
      amount -= take;
      got.push(String(d.id));
      if (split) split[String(d.id)] = take;
    });
    return got;
  }

  /** ยอดติดลบ (ปรับยอดหนี้ขึ้น) คืนจากก้อนท้าย ๆ ก่อน */
  function drain(roots, amount, split) {
    var got = [];
    for (var k = roots.length - 1; k >= 0 && amount < 0; k--) {
      var mine = own[String(roots[k].id)].principal;
      var back = k === 0 ? amount : Math.max(amount, -Math.max(0, mine));
      if (!back) continue;
      own[String(roots[k].id)].principal += back;
      amount -= back;
      got.push(String(roots[k].id));
      if (split) split[String(roots[k].id)] = back;
    }
    return got;
  }

  Object.keys(spill).forEach(function (ledger) { pour(queue[ledger] || [], spill[ledger]); });

  // 3) ไล่ตามวันที่ชำระ จะได้รู้ว่าแต่ละรายการไปตัดก้อนไหน (ใช้แสดงรายการในหน้าที่ก้อนนั้นแสดงอยู่)
  //    ยอดรวมแต่ละก้อนไม่ขึ้นกับลำดับ เพราะเติมก้อนเก่าให้เต็มก่อนเสมอ
  loose.sort(function (a, b) {
    return String(toIsoDate_(a.payDate)).localeCompare(String(toIsoDate_(b.payDate)));
  });
  var positive = loose.filter(function (p) { return (toNumber_(p.principal) || 0) >= 0; });
  var negative = loose.filter(function (p) { return (toNumber_(p.principal) || 0) < 0; });
  positive.concat(negative).forEach(function (p) {
    var roots = queue[p.ledger] || [];
    if (!roots.length) return;
    var pr = toNumber_(p.principal) || 0;
    var got = pr >= 0 ? pour(roots, pr, p._split) : drain(roots, pr, p._split);
    if (!got.length) {
      // ดอกเบี้ยอย่างเดียว: ผูกกับก้อนแรกที่ยังไม่เต็ม
      var open = roots.filter(function (d) { return allocated(d) < principalOf(d); })[0] || roots[roots.length - 1];
      got.push(String(open.id));
    }
    // ดอกเบี้ยไม่ได้ลดยอดหนี้ ลงก้อนแรกที่รายการนี้ไปตัดไว้เฉย ๆ
    own[got[0]].interest += toNumber_(p.interest) || 0;
    p._toDebts = got;
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
      while (d && guard++ < 20) {
        set[d.ledger] = true;
        if (sharedLedger_(d)) set[sharedLedger_(d)] = true;
        d = parentOf(d);
      }
    });
    if (!Object.keys(set).length) set[p.ledger] = true;
    return set;
  }

  /**
   * เงินต้นของรายการนี้ที่ "เป็นของ" บัญชีหนึ่ง
   * รายการของบัญชีตัวเองนับเต็ม · รายการจากบัญชีอื่นนับเฉพาะส่วนที่ไปตัดก้อนที่เกี่ยวกับบัญชีนี้
   * (งวดที่คร่อมสองก้อน เช่น ครึ่งหนึ่งปิดค่าเขียนแบบ อีกครึ่งเข้าค่าก่อสร้าง จะได้ไม่นับเกิน)
   */
  function principalFor(p, ledger) {
    if (p.ledger === ledger) return toNumber_(p.principal) || 0;
    var sum = 0;
    Object.keys(p._split || {}).forEach(function (id) {
      var set = {}, d = byId[id], guard = 0;
      while (d && guard++ < 20) {
        set[d.ledger] = true;
        if (sharedLedger_(d)) set[sharedLedger_(d)] = true;
        d = parentOf(d);
      }
      if (set[ledger]) sum += p._split[id];
    });
    return sum;
  }

  return {
    byId: byId, children: children, parentOf: parentOf, principalFor: principalFor,
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

  // ก้อนของบัญชีนี้ + ก้อนจากบัญชีอื่นที่ตั้งให้แสดงที่นี่ด้วย (ข้อมูลชุดเดียวกัน ไม่ได้คัดลอก)
  var debts = allDebts.filter(function (d) { return debtInLedger_(d, ledger); });
  var byId = g.byId;

  /** รายการนี้ไปตัดก้อนที่ยืมมาแสดงในบัญชีนี้ — นับเหมือนเป็นของบัญชีนี้ทุกอย่าง รวมดอกเบี้ย */
  function paysShared(p) {
    if (p.ledger === ledger) return false;
    return (p._toDebts || []).some(function (id) { return byId[id] && sharedLedger_(byId[id]) === ledger; });
  }
  function ownsInterest(p) { return p.ledger === ledger || paysShared(p); }

  // รายการชำระที่ส่งผลถึงบัญชีนี้
  //   • ของบัญชีตัวเอง และที่ไปตัดก้อนที่แสดงร่วม — เอาทั้งหมด
  //   • ของก้อนลูกที่อยู่คนละบัญชี — เอาเฉพาะที่มีเงินต้น เพราะดอกเบี้ยของลูก
  //     ไม่ได้ลดยอดหนี้ของแม่ ถ้านับมาด้วยจำนวนรายการกับยอดรายปีจะเกินจริง
  //   เงินต้นที่นับใช้ _mine = ส่วนที่เป็นของบัญชีนี้จริง (งวดที่คร่อมสองก้อนนับแค่ส่วนของก้อนที่นี่)
  var scoped = allPayments.filter(function (p) {
    p._mine = g.principalFor(p, ledger);
    if (p.ledger === ledger) return true;
    if (paysShared(p)) return p._mine !== 0 || !!(toNumber_(p.interest) || 0);
    if (!(p._mine > 0)) return false;
    return !!g.ledgersTouched(p)[ledger];
  });
  // รายการปรับยอดลดหนี้จริง แต่ไม่ใช่เงินที่โอนในปีนั้น — ไม่เอาไปนับเป็นยอดผ่อนรายปีหรือคาดการณ์
  var adjustments = scoped.filter(isAdjustment_);
  var adjusted = sum_(adjustments, function (p) { return p._mine; });
  scoped = scoped.filter(function (p) { return !isAdjustment_(p); });

  var totalDebt = sum_(debts, function (d) { return d.principal; });

  var principalPaid = 0;
  debts.forEach(function (d) {
    var parent = g.parentOf(d);
    if (parent && debtInLedger_(parent, ledger)) return;   // ก้อนลูกที่แม่อยู่ในหน้านี้ ถูกนับผ่านแม่แล้ว
    principalPaid += g.paidOf(d).principal;
  });
  var interestPaid = sum_(allPayments.filter(ownsInterest), function (p) { return p.interest; });

  var remaining = totalDebt - principalPaid;
  var percent = totalDebt > 0 ? Math.min(100, (principalPaid / totalDebt) * 100) : 0;

  // แยกตามปี
  var byYearMap = {};
  scoped.forEach(function (p) {
    var y = p.year || yearOf_(p.payDate);
    if (!y) return;
    if (!byYearMap[y]) byYearMap[y] = { year: Number(y), principal: 0, interest: 0, count: 0 };
    byYearMap[y].principal += p._mine;
    byYearMap[y].interest += (ownsInterest(p) ? (toNumber_(p.interest) || 0) : 0);
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
      alsoIn: sharedLedger_(d),
      sharedFrom: d.ledger !== ledger ? d.ledger : '',
      settled: principal > 0 && paid >= principal - 0.005,
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
    adjusted: round2_(adjusted),
    adjustmentCount: adjustments.length,
    years: byYear.map(function (y) { return y.year; }),
    byYear: byYear,
    debts: perDebt,
    forecast: forecast,
    selectedYear: year || 'all',
    selectedYearPaid: round2_(sum_(yearFiltered, function (p) { return p._mine; })),
    selectedYearInterest: round2_(sum_(yearFiltered.filter(ownsInterest),
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
  var total = sum_(recent, function (p) { return p._mine != null ? p._mine : p.principal; });
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
  obj.alsoIn = sharedLedger_({ ledger: obj.ledger, alsoIn: obj.alsoIn });
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
  // ลบก้อนที่ยังมีของผูกอยู่ ยอดจะย้ายไปก้อนอื่นเงียบ ๆ — ให้ย้าย/ลบของที่ผูกก่อน
  var pays = readRows_(SHEETS.DEBT_PAYMENTS).filter(function (p) { return String(p.debtId) === String(id); }).length;
  if (pays) throw new Error('ก้อนนี้มีรายการชำระผูกอยู่ ' + pays + ' รายการ — ลบหรือเปลี่ยน "ผูกกับก้อนหนี้" ของรายการเหล่านั้นก่อน');
  var kids = readRows_(SHEETS.DEBTS).filter(function (d) { return String(d.parentId) === String(id); }).length;
  if (kids) throw new Error('มีก้อนหนี้ ' + kids + ' ก้อนที่เป็นส่วนหนึ่งของก้อนนี้ — ปลดการผูกของก้อนเหล่านั้นก่อน');
  deleteRow_(SHEETS.DEBTS, found._row, found);
  logActivity_('ลบก้อนหนี้', id, found.title);
  return true;
}

function saveDebtPayment_(obj) {
  var now = new Date();
  obj.payDate = cleanDate_(obj.payDate, 'วันที่ชำระ', true);
  obj.year = yearOf_(obj.payDate);
  obj.ledger = obj.ledger || LEDGER_MAIN;
  // ผูกกับก้อนหนี้ไว้ → รายการเป็นของบัญชีที่ก้อนนั้นอยู่จริงเสมอ ไม่ว่าจะกดบันทึกจากหน้าไหน
  // (เช่น บันทึกค่าก่อสร้างจากหน้าหนี้สิน ก็ยังเข้ายอดของรายการสรุปรวมด้วย)
  var debtId = String(obj.debtId || '').trim();
  if (debtId) {
    var debt = findRow_(SHEETS.DEBTS, debtId);
    // ก้อนที่ผูกไว้ถูกลบไปแล้ว (ข้อมูลเก่า) ไม่ให้แก้รายการไม่ได้ — ปลดการผูก ให้ระบบตัดก้อนเก่าก่อนแทน
    if (debt) obj.ledger = debt.ledger;
    else obj.debtId = '';
  }
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
  deleteRow_(SHEETS.DEBT_PAYMENTS, found._row, found);
  logActivity_('ลบรายการชำระหนี้', id, found.amount);
  return true;
}

/**
 * ปรับยอดคงเหลือของก้อนหนี้ให้ตรงกับยอดจริง
 *
 * ใช้ตอนที่ยอดในระบบกับยอดที่เจ้าหนี้แจ้งไม่ตรงกัน เช่น มีบางงวดที่ไม่ได้บันทึกไว้
 * หรือเจ้าหนี้ยกให้บางส่วน — แทนที่จะไปแก้ยอดตั้งต้น (ซึ่งทำให้ประวัติเพี้ยน)
 * ระบบบันทึก "รายการปรับยอด" เท่าส่วนต่างผูกกับก้อนนั้น ตรวจย้อนหลังได้และลบทิ้งได้
 *
 * @param {{debtId:string, actualRemaining:number, payDate?:string, note?:string}} p
 */
function reconcileDebt_(p) {
  var debt = findRow_(SHEETS.DEBTS, p.debtId);
  if (!debt) throw new Error('ไม่พบก้อนหนี้: ' + p.debtId);
  var actual = toNumber_(p.actualRemaining);
  if (actual === null || actual < 0) throw new Error('กรอกยอดคงเหลือจริงเป็นตัวเลขตั้งแต่ 0 ขึ้นไป');
  var principal = toNumber_(debt.principal) || 0;
  if (actual > principal) throw new Error('ยอดคงเหลือจริงมากกว่ายอดหนี้ตั้งต้น (' + principal + ') — แก้ยอดตั้งต้นของก้อนนี้แทน');

  // ใช้ยอดที่ยังไม่ตัดเพดาน ไม่งั้นก้อนที่จ่ายเกินจะปรับลงไม่ได้
  var g = debtGraph_(readRows_(SHEETS.DEBTS), listDebtPayments_(null, 'all'));
  var current = principal - g.paidOf(debt).principal;
  var diff = round2_(current - actual);
  if (Math.abs(diff) < 0.005) throw new Error('ยอดคงเหลือตรงกับยอดจริงอยู่แล้ว ไม่ต้องปรับ');

  var note = 'ปรับยอดคงเหลือ ' + round2_(current) + ' → ' + actual +
    (p.note ? ' · ' + String(p.note).trim() : '');
  var saved = saveDebtPayment_({
    ledger: debt.ledger, debtId: debt.id, payDate: p.payDate || todayIso_(),
    principal: diff, interest: 0, channel: ADJUST_CHANNEL, note: note
  });
  logActivity_('ปรับยอดหนี้ให้ตรงยอดจริง', debt.id, debt.title + ' · ' + note);
  return saved;
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
  if (obj.room != null) obj.room = cleanRoom_(obj.room, false);
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
  deleteRow_(SHEETS.PURCHASES, found._row, found);
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
  obj.room = cleanRoom_(obj.room, true);
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

function acYear_(r) { return r.year || yearOf_(r.serviceDate) || yearOf_(r.bookDate); }
/** นัดไว้แล้วแต่ยังไม่ได้ล้าง (และไม่ได้ยกเลิก) */
function acOpen_(r) { return !r.serviceDate && !!r.bookDate && r.status !== 'ยกเลิก'; }

function listAcService_(year, room) {
  var rows = readRows_(SHEETS.AC_SERVICE);
  rows = inYearOrOpen_(rows, year, acYear_, acOpen_);
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
    var inYear = inYearOrOpen_(list, year, acYear_, acOpen_);

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
  // แก้รายการเดิมที่ไม่ได้ส่งห้องมา = ใช้ห้องเดิม · รายการใหม่ต้องมีห้องเสมอ
  if (obj.room !== undefined || !obj.id) obj.room = cleanRoom_(obj.room, true);
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
  // กันกรอกซ้ำ: นัดล้างห้องเดียวกันวันเดียวกันที่ยังไม่ได้ล้าง
  if (!obj.serviceDate && obj.bookDate) {
    var twin = readRows_(SHEETS.AC_SERVICE).filter(function (r) {
      return acOpen_(r) && String(r.room) === String(obj.room) && String(r.bookDate) === String(toIsoDate_(obj.bookDate));
    })[0];
    if (twin) throw new Error('ห้อง ' + obj.room + ' มีนัดล้างแอร์วันที่ ' + thDate_(twin.bookDate) + ' อยู่แล้ว — ไม่ได้บันทึกซ้ำ');
  }
  obj.id = obj.id || uid_('AC');
  logActivity_('เพิ่มล้างแอร์', obj.id, obj.room + ' ' + (obj.serviceDate || obj.bookDate));
  return insertRow_(SHEETS.AC_SERVICE, obj);
}

/**
 * เปลี่ยนสถานะล้างแอร์จากตารางโดยตรง ไม่ต้องเปิดฟอร์ม
 *
 * เจ้าของหอเปลี่ยนสถานะบ่อยกว่าแก้ช่องอื่นมาก การต้องกดดินสอ เปิดฟอร์ม
 * แก้ช่องเดียว แล้วกดบันทึกทุกครั้ง ช้าเกินไปเมื่อต้องไล่อัปเดตหลายห้อง
 *
 * @param {{id:string, status:string}} p
 */
function setAcStatus_(p) {
  var found = findRow_(SHEETS.AC_SERVICE, p && p.id);
  if (!found) throw new Error('ไม่พบรายการล้างแอร์: ' + (p && p.id));

  // รับเฉพาะสถานะที่มีอยู่จริงในระบบ ไม่ให้ยัดค่าอะไรก็ได้เข้ามา
  var allowed = fieldOptions_(SHEETS.AC_SERVICE, 'status');
  var next = String((p && p.status) || '').trim();
  if (allowed.indexOf(next) < 0) throw new Error('สถานะไม่ถูกต้อง: ' + next);

  var patch = { status: next, updatedAt: new Date() };

  // เลือก "ดำเนินการแล้ว" ทั้งที่ยังไม่เคยกรอกวันที่ดำเนินการ = เพิ่งล้างเสร็จวันนี้
  // ต้องเติมวันที่ให้ด้วย ไม่งั้นช่องห้องจะยังขึ้นว่า "ยังไม่เคยล้าง" และรอบถัดไป
  // ก็คำนวณไม่ได้ ทั้งที่แถวในตารางบอกว่าล้างแล้ว — ตัวเลขจะไม่ตรงกันเอง
  // ส่วนขาเปลี่ยนกลับ ไม่ลบวันที่ทิ้ง เพราะนั่นคือการทำลายข้อมูลที่เคยบันทึกไว้
  var filledDate = '';
  if (next === 'ดำเนินการแล้ว' && !found.serviceDate) {
    filledDate = todayIso_();
    patch.serviceDate = filledDate;
    patch.year = yearOf_(filledDate);
  }

  logActivity_('เปลี่ยนสถานะล้างแอร์', found.id,
               found.room + ' รอบที่ ' + (found.round || 1) + ': ' + found.status + ' → ' + next);
  var saved = updateRow_(SHEETS.AC_SERVICE, found._row, Object.assign({}, found, patch));
  saved.filledDate = filledDate;   // ให้หน้าเว็บบอกผู้ใช้ได้ว่าเติมวันที่ให้ด้วย
  return saved;
}

function deleteAcService_(id) {
  var found = findRow_(SHEETS.AC_SERVICE, id);
  if (!found) throw new Error('ไม่พบรายการล้างแอร์: ' + id);
  deleteRow_(SHEETS.AC_SERVICE, found._row, found);
  logActivity_('ลบล้างแอร์', id, found.room);
  return true;
}

/** สร้างนัดล้างแอร์หลายห้องพร้อมกัน (เช่น นัดช่างมาล้างทั้งชั้น) */
function bulkBookAc_(payload) {
  var rooms = (payload && payload.rooms) || [];
  var bookDate = payload && payload.bookDate;
  if (!rooms.length || !bookDate) throw new Error('ต้องระบุห้องและวันที่นัด');
  bookDate = cleanDate_(bookDate, 'วันที่นัด', true);
  var existing = readRows_(SHEETS.AC_SERVICE);
  // ตัดห้องที่ติ๊กซ้ำ และข้ามห้องที่มีนัดวันนี้อยู่แล้ว (กดสร้างนัดซ้ำสองรอบจะได้ไม่เกิดนัดซ้อน)
  var seen = {};
  rooms = rooms.map(function (r) { return cleanRoom_(r, true); }).filter(function (room) {
    if (seen[room]) return false;
    seen[room] = true;
    return !existing.some(function (r) {
      return acOpen_(r) && String(r.room) === String(room) && String(r.bookDate) === String(bookDate);
    });
  });
  if (!rooms.length) throw new Error('ทุกห้องที่เลือกมีนัดล้างแอร์วันที่ ' + thDate_(bookDate) + ' อยู่แล้ว');

  var year = yearOf_(bookDate);
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

function repairYear_(r) { return r.year || yearOf_(r.repairDate) || yearOf_(r.bookDate) || yearOf_(r.reportDate); }
function repairOpen_(r) { return r.status !== 'เสร็จสิ้น' && r.status !== 'ยกเลิก'; }

function listRoomRepairs_(year, room, status) {
  var rows = readRows_(SHEETS.ROOM_REPAIRS);
  rows = inYearOrOpen_(rows, year, repairYear_, repairOpen_);
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
  // shown = งานของปีที่ดู + งานที่ยังไม่เสร็จของปีอื่น (เห็นในผังห้องเสมอ)
  // scope = เฉพาะของปีที่ดู ใช้รวมจำนวนงานและค่าใช้จ่ายของปีนั้น
  var shown = inYearOrOpen_(all, year, repairYear_, repairOpen_);
  var scope = shown.filter(function (r) { return !r.otherYear; });

  var byRoom = {};
  var roomList = roomsInPlay_(shown);
  roomList.forEach(function (r) { byRoom[r] = []; });
  shown.forEach(function (r) { byRoom[String(r.room)].push(r); });

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
      cost: round2_(sum_(list.filter(function (r) { return !r.otherYear; }), function (r) { return r.cost; })),
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
    openJobs: shown.filter(repairOpen_).length,
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
  // แก้รายการเดิมที่ไม่ได้ส่งห้องมา = ใช้ห้องเดิม · รายการใหม่ต้องมีห้องเสมอ
  if (obj.room !== undefined || !obj.id) obj.room = cleanRoom_(obj.room, true);
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
  // กันกรอกซ้ำ: งานที่ยังไม่เสร็จ ห้องเดียวกัน รายการเดียวกัน วันนัดเดียวกัน = งานเดิม
  var twin = readRows_(SHEETS.ROOM_REPAIRS).filter(function (r) {
    return repairOpen_(r) && String(r.room) === String(obj.room) &&
      String(r.items || '') === String(obj.items || '') &&
      String(r.bookDate || '') === String(toIsoDate_(obj.bookDate) || '');
  })[0];
  if (twin) {
    throw new Error('มีงานนี้อยู่แล้ว: ห้อง ' + obj.room + (twin.bookDate ? ' นัด ' + thDate_(twin.bookDate) : '') +
      ' — ไม่ได้บันทึกซ้ำ (งานที่ยังไม่เสร็จดูได้ในผังห้องและในกระดิ่งแจ้งเตือน)');
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
  deleteRow_(SHEETS.ROOM_REPAIRS, found._row, found);
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
  // แก้รายการเดิมที่ไม่ได้ส่งห้องมา = ใช้ห้องเดิม · รายการใหม่ต้องมีห้องเสมอ
  if (obj.room !== undefined || !obj.id) obj.room = cleanRoom_(obj.room, true);
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
  deleteRow_(SHEETS.ASSETS, found._row, found);
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
  rows = inYearOrOpen_(rows, year,
    function (r) { return r.year || yearOf_(r.endDate) || yearOf_(r.startDate) || yearOf_(r.bookDate); },
    function (r) { return r.status !== 'เสร็จสิ้น' && r.status !== 'ยกเลิก'; });
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
    // งานที่ยังไม่ปิดทุกปี (งานที่เปิดไว้ตั้งแต่ปีก่อนก็ยังต้องทำ) — ศูนย์แจ้งเตือนใช้ ไม่ต้องอ่านชีตซ้ำ
    openJobs: all.filter(function (r) { return r.status !== 'เสร็จสิ้น' && r.status !== 'ยกเลิก'; }),
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
  // กันกรอกซ้ำ: งานชื่อเดียวกัน วันนัด/วันเริ่มเดียวกัน ที่ยังไม่เสร็จ
  var twin = readRows_(SHEETS.BUILDING_REPAIRS).filter(function (r) {
    return r.status !== 'เสร็จสิ้น' && r.status !== 'ยกเลิก' &&
      String(r.title || '').trim() === String(obj.title || '').trim() &&
      String(r.bookDate || '') === String(toIsoDate_(obj.bookDate) || '') &&
      String(r.startDate || '') === String(toIsoDate_(obj.startDate) || '');
  })[0];
  if (twin && String(obj.title || '').trim()) throw new Error('มีงาน "' + twin.title + '" ที่ยังไม่เสร็จอยู่แล้ว — ไม่ได้บันทึกซ้ำ');
  obj.id = obj.id || uid_('BLD');
  logActivity_('เพิ่มงานซ่อมตึก', obj.id, obj.title);
  return insertRow_(SHEETS.BUILDING_REPAIRS, obj);
}

function deleteBuildingRepair_(id) {
  var found = findRow_(SHEETS.BUILDING_REPAIRS, id);
  if (!found) throw new Error('ไม่พบงานซ่อมตึก: ' + id);
  deleteRow_(SHEETS.BUILDING_REPAIRS, found._row, found);
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
    // รายการเดียวกับกล่องแจ้งเตือน (งานที่ยังค้างทุกงาน ไม่ใช่แค่ที่เลยกำหนด) ปุ่ม "ดูทั้งหมดในแดชบอร์ด" จึงตรงกัน
    alerts: buildAlerts_(overdueRepairs, ac, bld, today, { openRepairs: openRepairs, openBuilding: bld.openJobs })
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
/** รายการแจ้งเตือนทั้งหมดของวันนี้ — ที่เดียวที่กล่องแจ้งเตือนและตัวเลขบนเมนูใช้ */
function collectAlerts_() {
  var today = todayIso_();
  var y = String(new Date().getFullYear());
  var open = openRepairs_();
  var bld = buildingSummary_(y);
  return buildAlerts_(overdueRepairs_(open, today), acMatrix_(y), bld, today,
    { openRepairs: open, openBuilding: bld.openJobs });
}

var ALERT_LIST_CAP = 40;   // รายละเอียดที่ส่งไปต่อหน้า (กล่องแสดงหน้าละ 8) — ตัวเลขยังนับครบทุกเรื่อง

function alertCenter_(payload) {
  var items = collectAlerts_();

  // ตัวเลขบนเมนูกับรายการในกล่องแจ้งเตือนมาจากรายการชุดเดียวกันเสมอ
  // (เดิมนับคนละแบบ เมนูบอก "ซ่อมแซม 4" แต่ในกล่องไม่มีงานซ่อมเลยสักรายการ)
  var counts = { repairs: 0, ac: 0, building: 0, purchases: 0, finance: 0 };
  items.forEach(function (a) { counts[a.module] = (counts[a.module] || 0) + 1; });

  // ผู้ใช้แต่ละคนเห็นแล้วหรือยัง — ตัวเลขบนกระดิ่ง = เฉพาะเรื่องที่ยังไม่เคยเห็น
  // เปิดดูแล้วตัวเลขหายไป แต่รายการยังอยู่ในกล่องจนกว่าจะแก้ที่ต้นเหตุ
  var who = alertViewer_(payload);
  var seen = who ? seenAlertKeys_(who) : {};
  items.forEach(function (a) { a.seen = alertKeySeen_(a.key, seen); });
  var unseen = items.filter(function (a) { return !a.seen; });
  var unseenByModule = {};
  unseen.forEach(function (a) { unseenByModule[a.module] = (unseenByModule[a.module] || 0) + 1; });

  // ส่งรายละเอียดไม่เกินหน้าละ ALERT_LIST_CAP แต่ส่ง "ดัชนี" ของทุกเรื่องไปด้วย (สั้นมาก)
  // หน้าเว็บจะได้นับเรื่องใหม่และจดเห็นแล้วได้ครบทุกเรื่อง แม้เรื่องที่ไม่ได้แสดงรายละเอียด
  var shown = {}, list = [];
  items.forEach(function (a) {
    shown[a.module] = (shown[a.module] || 0) + 1;
    if (shown[a.module] <= ALERT_LIST_CAP) list.push(a);
  });

  return {
    counts: counts,
    alertsByModule: counts,
    unseenByModule: unseenByModule,
    total: items.length,
    unseen: unseen.length,
    urgent: items.filter(function (a) { return a.level === 'danger'; }).length,
    // จำ "เห็นแล้ว" ไว้ที่บัญชี (ข้ามเครื่องได้) · เข้าด้วยกุญแจ/ลิงก์แชร์ไม่มีบัญชี ให้หน้าเว็บจำเอง
    seenStore: who ? 'account' : 'device',
    index: items.map(function (a) { return { key: a.key, module: a.module, level: a.level, seen: a.seen }; }),
    items: list,
    at: nowStamp_()
  };
}

/** ชื่อผู้ใช้ที่ใช้จำว่าเห็นการแจ้งเตือนแล้ว ('' = เข้าโดยไม่มีบัญชี) */
function alertViewer_(payload) {
  if (REQUEST_ACTOR_) return REQUEST_ACTOR_.username || '';
  try { return resolveActor_(payload || {}).username || ''; } catch (e) { return ''; }
}

/*
 * รหัสการแจ้งเตือน = "ต้นเรื่อง#ระดับ" เช่น repairs:R12#2
 * เห็นแล้ว = เคยเห็นต้นเรื่องเดียวกันที่ระดับเท่านี้หรือหนักกว่า
 *   เรื่องหนักขึ้น (ระดับสูงขึ้น) → เตือนอีกครั้ง · เรื่องเบาลง (เช่น งานเลยกำหนดถูกนัดใหม่) → ไม่เตือนซ้ำ
 * หน้าเว็บใช้กติกาเดียวกันใน alertKeySeen()
 */
function alertBase_(key) { var i = String(key).lastIndexOf('#'); return i < 0 ? String(key) : String(key).slice(0, i); }
function alertRank_(key) { var i = String(key).lastIndexOf('#'); return i < 0 ? 0 : Number(String(key).slice(i + 1)) || 0; }
function alertKeySeen_(key, seenMap) {
  if (seenMap[key]) return true;
  var base = alertBase_(key), rank = alertRank_(key);
  return Object.keys(seenMap).some(function (k) { return alertBase_(k) === base && alertRank_(k) >= rank; });
}

/*
 * "เห็นแล้ว" เก็บใน Script Properties แยกตามชื่อผู้ใช้ — ไม่เก็บในชีต
 * เพราะทุกครั้งที่ชีตถูกเขียน เวลาแก้ไขล่าสุดของไฟล์ขยับ ทุกเครื่องที่เปิดอยู่จะคิดว่า
 * "มีคนแก้ข้อมูล" แล้วโหลดใหม่หมด (รวมคนที่กำลังกรอกฟอร์มค้างอยู่) แค่เพราะมีคนเปิดดูกระดิ่ง
 * และไม่ต้องเข้าคิวเขียนชีต การเปิดกระดิ่งจึงไม่ไปถ่วงการบันทึกของคนอื่น
 */
var ALERT_SEEN_PREFIX = 'alertSeen:';
var ALERT_SEEN_MAX_CHARS = 8000;   // ค่าหนึ่งช่องของ Properties เก็บได้ราว 9 KB

function seenAlertKeys_(username) {
  var out = {};
  try {
    var list = JSON.parse(props_().getProperty(ALERT_SEEN_PREFIX + username) || '[]');
    if (Array.isArray(list)) list.forEach(function (k) { out[String(k)] = true; });
  } catch (e) { /* ค่าเสีย ถือว่ายังไม่เคยเห็น */ }
  return out;
}

/**
 * จดว่าผู้ใช้เห็นการแจ้งเตือนเหล่านี้แล้ว (เรียกตอนเปิดกล่องแจ้งเตือน)
 * @param {{keys:string[], live:string[]}} payload  live = รหัสของทุกเรื่องที่ยังค้างตอนนี้
 *   เก็บเฉพาะเรื่องที่ยังค้าง เรื่องที่แก้ไปแล้วถูกตัดทิ้งเอง จึงไม่บวมขึ้นเรื่อย ๆ
 *   (เป็นข้อมูลส่วนตัวของผู้ใช้คนนั้นเอง ส่งค่าแปลก ๆ มาก็กระทบแค่ตัวเอง)
 */
function markAlertsSeen_(payload) {
  var who = alertViewer_(payload);
  if (!who) return { stored: false };
  // ตัดทิ้งตาม "ต้นเรื่อง" ที่ยังค้าง ไม่ใช่รหัสเป๊ะ ๆ — เรื่องที่เบาลงยังจำได้ว่าเคยเห็นระดับที่หนักกว่า
  var live = {};
  ((payload && payload.live) || []).forEach(function (k) { live[alertBase_(k)] = true; });
  // หน้าเว็บส่ง "ทุกเรื่องที่เห็นแล้ว" มาทุกครั้ง (ไม่ใช่แค่ส่วนที่เพิ่ม) คำขอสองอันที่ส่งซ้อนกัน
  // จึงไม่ทับกันจนบางเรื่องหายไป
  var keep = {};
  Object.keys(seenAlertKeys_(who)).forEach(function (k) { if (live[alertBase_(k)]) keep[k] = true; });
  ((payload && payload.keys) || []).forEach(function (k) { k = String(k).slice(0, 200); if (live[alertBase_(k)]) keep[k] = true; });
  var list = Object.keys(keep);
  // ตัดของเก่าออกจนพอดีที่เก็บได้ (นับความยาวครั้งเดียว แล้วลบออกทีละรายการ)
  var size = JSON.stringify(list).length;
  while (list.length && size > ALERT_SEEN_MAX_CHARS) size -= JSON.stringify(list.shift()).length + 1;
  props_().setProperty(ALERT_SEEN_PREFIX + who, JSON.stringify(list));
  return { stored: true, seen: list.length };
}

/**
 * รายการ "สิ่งที่ต้องทำ" รวมทุกโมดูล เรียงตามความสำคัญ
 *
 * ทุกรายการมี key คงที่ = โมดูล + ต้นเรื่อง + ระดับ
 * เรื่องเดิมที่ยังไม่แก้ → key เดิม → ถือว่าเห็นแล้ว ไม่เด้งตัวเลขซ้ำ
 * เรื่องเดิมที่หนักขึ้น (เช่น งานซ่อมเพิ่งเลยกำหนด) → key ใหม่ → เด้งตัวเลขให้เห็นอีกครั้ง
 *
 * @param {Object=} extra  { openRepairs, openBuilding } — ใส่มาเพื่อให้ทุกงานที่ยังค้างขึ้นในรายการ
 *                         (แดชบอร์ดไม่ใส่ จะเห็นเฉพาะเรื่องที่ถึงกำหนด/เลยกำหนดเหมือนเดิม)
 */
function buildAlerts_(overdueRepairs, ac, bld, today, extra) {
  extra = extra || {};
  var alerts = [];
  var overdueIds = {};

  overdueRepairs.forEach(function (r) {
    overdueIds[String(r.id)] = true;
    var days = daysBetween_(r.bookDate || r.reportDate, today);
    var urgent = r.priority === 'ด่วนมาก';
    alerts.push({
      level: urgent ? 'danger' : 'warn',
      icon: '🔧', module: 'repairs',
      title: 'ห้อง ' + r.room + ' — งานซ่อมค้าง ' + days + ' วัน',
      detail: String(r.items || '').slice(0, 80),
      // สถานะจริง (เลยกำหนด/ยังไม่เลย × ด่วน/ไม่ด่วน) ไม่ใช่สีของป้าย — สองสถานะบางคู่สีเดียวกัน
      // ระดับ: ค้าง 1 · เลยกำหนด 2 · ด่วนมาก 3 · ด่วนมากและเลยกำหนด 4
      ref: r.id, key: 'repairs:' + r.id + '#' + (urgent ? 4 : 2)
    });
  });
  (extra.openRepairs || []).forEach(function (r) {
    if (overdueIds[String(r.id)]) return;
    var urgent = r.priority === 'ด่วนมาก';
    alerts.push({
      level: urgent ? 'warn' : 'info', icon: '🔧', module: 'repairs',
      title: 'ห้อง ' + r.room + ' — ' + (r.status || 'รอดำเนินการ') +
        (r.bookDate ? ' · นัด ' + thDate_(r.bookDate) : ''),
      detail: String(r.items || '').slice(0, 80),
      ref: r.id, key: 'repairs:' + r.id + '#' + (urgent ? 3 : 1)
    });
  });

  ac.overdue.forEach(function (r) {
    var never = r.state === 'ยังไม่เคยล้าง';
    alerts.push({
      level: never ? 'warn' : 'info',
      icon: '❄️', module: 'ac',
      title: 'ห้อง ' + r.room + ' — ' + (never ? 'ยังไม่เคยบันทึกการล้างแอร์' : 'ถึงกำหนดล้างแอร์'),
      detail: r.lastService ? ('ล้างล่าสุด ' + thDate_(r.lastService) + ' · ครบกำหนด ' + thDate_(r.nextDue)) : 'ยังไม่มีประวัติการล้าง',
      // ผูกกับวันครบกำหนด: ล้างแล้วรอบหน้าครบอีก = เรื่องใหม่
      ref: r.room, key: 'ac:' + r.room + ':' + (r.nextDue || 'never') + '#1'
    });
  });

  expiringWarranties_().forEach(function (p) {
    alerts.push({
      level: 'info', icon: '🛡️', module: 'purchases',
      title: 'ประกันใกล้หมด: ' + String(p.item).slice(0, 50),
      detail: 'หมดอายุ ' + thDate_(p.warranty.end) + ' (อีก ' + p.warranty.daysLeft + ' วัน)',
      ref: p.id, key: 'purchases:' + p.id + ':' + p.warranty.end + '#1'
    });
  });

  var dueIds = {};
  bld.upcoming.forEach(function (r) {
    dueIds[String(r.id)] = true;
    var late = r.dueInDays < 0;
    alerts.push({
      level: late ? 'warn' : 'info', icon: '🏢', module: 'building',
      title: 'งานตึก: ' + r.title,
      detail: 'ครบกำหนดรอบถัดไป ' + thDate_(r.nextDue) + (late ? ' (เลยกำหนดแล้ว)' : ' (อีก ' + r.dueInDays + ' วัน)'),
      ref: r.id, key: 'building:' + r.id + ':' + r.nextDue + '#' + (late ? 2 : 1)
    });
  });
  (extra.openBuilding || []).forEach(function (r) {
    if (dueIds[String(r.id)]) return;
    alerts.push({
      level: 'info', icon: '🏢', module: 'building',
      title: 'งานตึก: ' + r.title + ' — ' + (r.status || 'รอดำเนินการ'),
      detail: [r.zone, r.contractor, r.bookDate ? 'นัด ' + thDate_(r.bookDate) : ''].filter(String).join(' · '),
      ref: r.id, key: 'building:' + r.id + ':open#1'
    });
  });

  var bills = missingBills_();
  if (bills.missing.length) {
    alerts.push({
      level: 'info', icon: '🧾', module: 'finance',
      title: 'ยังไม่ได้บันทึกบิลเดือน ' + bills.label,
      detail: 'ขาด: ' + bills.missing.join(' · '),
      // หนึ่งเรื่องต่อเดือน — บันทึกบิลไปบางส่วน (เรื่องเล็กลง) ไม่ควรเด้งเตือนว่าเป็นเรื่องใหม่
      ref: '', key: 'finance:bills:' + bills.year + '-' + bills.month + '#1'
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

/* ------------------------------------------------------------------ */
/*  ปฏิทินงานรวม                                                       */
/* ------------------------------------------------------------------ */

/**
 * เหตุการณ์ทั้งหมดของเดือนหนึ่ง รวมทุกโมดูล — ไม่ผูกกับตัวเลือกปีบนแถบหัว
 * เลื่อนข้ามปีได้ต่อเนื่อง งานที่นัดไว้ปีหน้าจึงเห็นได้โดยไม่ต้องสลับปี
 *
 * state: done = ทำแล้ว · due = ยังไม่ถึง/ถึงกำหนดวันนี้ · late = เลยวันแล้วยังไม่ได้ทำ
 *
 * @param {string} ym 'YYYY-MM' (ว่าง = เดือนนี้)
 */
function calendarMonth_(ym) {
  var today = todayIso_();
  var m = String(ym || '').match(/^(\d{4})-(\d{2})$/);
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12 || Number(m[1]) < 2000 || Number(m[1]) > 2100) {
    ym = today.slice(0, 7);
    m = ym.match(/^(\d{4})-(\d{2})$/);
  }
  var y = Number(m[1]), mo = Number(m[2]);
  var lastDay = new Date(y, mo, 0).getDate();
  var events = [];

  function inMonth(d) { return !!d && String(d).slice(0, 7) === ym; }
  function add(date, module, icon, title, detail, done, ref) {
    if (!inMonth(date)) return;
    events.push({
      date: String(date).slice(0, 10), module: module, icon: icon,
      title: title, detail: detail || '', ref: ref || '',
      state: done ? 'done' : (String(date).slice(0, 10) < today ? 'late' : 'due')
    });
  }

  // งานซ่อมห้อง: วันที่ซ่อมจริงถ้าเสร็จแล้ว ไม่งั้นวันนัด
  readRows_(SHEETS.ROOM_REPAIRS).forEach(function (r) {
    if (r.status === 'ยกเลิก') return;
    var detail = parseTodo_(r.items).map(function (t) { return t.name; }).join(' · ').slice(0, 90);
    if (!repairOpen_(r)) add(r.repairDate || r.bookDate, 'repairs', '🔧', 'ซ่อม ห้อง ' + r.room, detail, true, r.id);
    else add(r.bookDate, 'repairs', '🔧', 'นัดซ่อม ห้อง ' + r.room, detail, false, r.id);
  });

  // ล้างแอร์: ล้างแล้ว / นัดไว้ / ครบรอบที่ยังไม่ได้นัด
  var booked = {};
  readRows_(SHEETS.AC_SERVICE).forEach(function (r) {
    if (r.status === 'ยกเลิก') return;
    if (r.serviceDate) add(r.serviceDate, 'ac', '❄️', 'ล้างแอร์ ห้อง ' + r.room, r.technician, true, r.id);
    else if (r.bookDate) {
      booked[String(r.room)] = true;
      add(r.bookDate, 'ac', '❄️', 'นัดล้างแอร์ ห้อง ' + r.room, r.technician, false, r.id);
    }
  });
  acMatrix_('all').rooms.forEach(function (r) {
    if (!r.nextDue || booked[String(r.room)]) return;       // นัดไว้แล้วไม่ต้องเตือนซ้ำ
    add(r.nextDue, 'ac', '❄️', 'ครบรอบล้างแอร์ ห้อง ' + r.room, 'ล้างล่าสุด ' + thDate_(r.lastService), false, r.room);
  });

  // งานตึก: เสร็จแล้ว / นัดหรือเริ่ม / ครบกำหนดรอบถัดไป
  readRows_(SHEETS.BUILDING_REPAIRS).forEach(function (r) {
    if (r.status === 'ยกเลิก') return;
    var open = r.status !== 'เสร็จสิ้น';
    if (!open) add(r.endDate || r.startDate || r.bookDate, 'building', '🏢', r.title, r.zone, true, r.id);
    else add(r.bookDate || r.startDate, 'building', '🏢', 'นัดงานตึก: ' + r.title, r.zone, false, r.id);
    if (r.nextDue) add(r.nextDue, 'building', '🏢', 'ครบรอบ: ' + r.title, r.zone, false, r.id);
  });

  // หนี้: รายการที่โอนจริง + วันครบกำหนดผ่อนของก้อนที่ยังไม่ปิด (เดือนนี้เป็นต้นไป)
  var debts = readRows_(SHEETS.DEBTS);
  var pays = listDebtPayments_(null, 'all');
  var g = debtGraph_(debts, pays);
  var paidThisMonth = {};
  pays.forEach(function (p) {
    if (!inMonth(p.payDate)) return;
    (p._toDebts || []).forEach(function (id) { paidThisMonth[id] = true; });
    if (isAdjustment_(p)) return;
    add(p.payDate, 'debt', '💰', 'โอนใช้หนี้ ' + fmtMoney_(p.amount) + ' บาท',
      p.installment ? 'งวด ' + p.installment : '', true, p.id);
  });
  if (ym >= today.slice(0, 7)) {
    debts.forEach(function (d) {
      var day = toNumber_(d.dueDay);
      if (!day || d.status === 'ปิดหนี้แล้ว' || d.status === 'พักชำระ') return;
      var principal = toNumber_(d.principal) || 0;
      if (principal > 0 && g.paidOf(d).principal >= principal - 0.005) return;   // ชำระครบแล้ว
      var date = ym + '-' + ('0' + Math.min(Math.max(1, day), lastDay)).slice(-2);
      add(date, 'debt', '💰', 'ครบกำหนดผ่อน: ' + d.title,
        d.planPerMonth ? 'แผนผ่อน ' + fmtMoney_(d.planPerMonth) + ' บาท' : '', !!paidThisMonth[String(d.id)], d.id);
    });
  }

  // ประกันหมดอายุ
  readRows_(SHEETS.PURCHASES).forEach(function (p) {
    var w = warrantyState_(p, today);
    if (!w.has || !w.end) return;
    add(w.end, 'purchases', '🛡️', 'ประกันหมด: ' + String(p.item).slice(0, 50), p.vendor, w.end < today, p.id);
  });

  var rank = { late: 0, due: 1, done: 2 };
  events.sort(function (a, b) {
    return a.date.localeCompare(b.date) || rank[a.state] - rank[b.state] || a.module.localeCompare(b.module);
  });
  return { ym: ym, year: y, month: mo, days: lastDay, today: today, events: events };
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

/**
 * คำสั่งที่เขียนลงชีต — ทำทีละคำสั่งเท่านั้น
 * ชีตไม่มี transaction ถ้าสองคนบันทึก/ลบพร้อมกัน เลขแถวที่อ่านไว้จะเลื่อน
 * และการล้างรายการหมดอายุตอนล็อกอินก็ลบแถวเหมือนกัน — ให้รอคิวกันทีละคน
 * (คำสั่งอ่านไม่ต้องรอ หน้าเว็บจึงไม่ช้าลง)
 */
var WRITE_ACTIONS = /\.(save|delete|savePayment|deletePayment|reconcile|setStatus|bulkBook|toggle|import|backupNow|rotateToken|send|login|unlock|logout|setPin|forgetDevice|forgetAllDevices|changePassword|resetPin|signOutAll)$/;

function api(action, payload) {
  payload = payload || {};
  REQUEST_ACTOR_ = null;
  syncBegin_();          // จดทุกแถวที่คำสั่งนี้เขียน แล้วส่งให้อีกฝั่งตอนจบ (Sync.gs)
  try {
    // หน้าเว็บที่เปิดค้างไว้ตั้งแต่ก่อน deploy เรียกตรงมาที่นี่โดยไม่ผ่าน doGet
    // ต้องย้ายข้อมูลให้ทันก่อน ไม่งั้นโค้ดใหม่อ่านชีตโครงเก่า (ย้ายแล้ว = อ่าน property ครั้งเดียว)
    runMigrations_();
    var run = function () {
      var role = requireRole_(action, payload);
      var fn = API_ROUTES[action];
      if (!fn) throw new Error('ไม่รู้จักคำสั่ง: ' + action);
      var data = fn(payload, role);
      return data;
    };
    if (!WRITE_ACTIONS.test(String(action))) return { ok: true, data: run() };
    return { ok: true, data: withScriptLock_(function () {
      var data = run();
      SpreadsheetApp.flush();   // เขียนให้ถึงชีตจริงก่อนปล่อยให้คนถัดไปอ่าน
      return data;
    }, 25000) };
  } catch (e) {
    console.error(action + ' -> ' + e);
    return {
      ok: false,
      error: String(e && e.message ? e.message : e),
      // หน้าเว็บใช้ธงนี้เด้งกลับไปหน้าล็อกอินแทนที่จะขึ้นข้อความเฉย ๆ
      needLogin: /เข้าสู่ระบบก่อน/.test(String(e && e.message ? e.message : e))
    };
  } finally {
    try { syncEnd_(); } catch (e2) { console.error('sync -> ' + e2); }   // ซิงก์พลาดต้องไม่ทำให้คำสั่งหลักพัง
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
        dateFormat: getSetting_('date_format', 'ค.ศ. (2026)'),
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
  'calendar.month': function (p) { return calendarMonth_(p.ym); },
  'app.alerts': function (p) { return alertCenter_(p); },
  // ไม่ได้เขียนชีต (เก็บใน Script Properties) จึงไม่ต้องเข้าคิวเขียน และไม่ทำให้เครื่องอื่นโหลดใหม่
  'app.alertsSeen': function (p) { return markAlertsSeen_(p); },
  'sync.status': function () { return syncStatus_(); },
  'app.search': function (p) { return globalSearch_(p.q); },

  /* ---------- หนี้ (ใช้ร่วมกันทั้งหนี้หลักและหนี้รอง) ---------- */
  'debt.summary': function (p) { return debtSummary_(p.ledger || LEDGER_MAIN, p.year); },
  'debt.overview': function () { return debtOverview_(); },
  'debt.payments': function (p) { return ledgerPayments_(p.ledger || LEDGER_MAIN, p.year); },
  'debt.list': function (p) { return listDebts_(p.ledger); },
  'debt.save': function (p) { return saveDebt_(p.record); },
  'debt.delete': function (p) { return deleteDebt_(p.id); },
  'debt.savePayment': function (p) { return saveDebtPayment_(p.record); },
  'debt.deletePayment': function (p) { return deleteDebtPayment_(p.id); },
  'debt.reconcile': function (p) { return reconcileDebt_(p.record || p); },

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
  'ac.setStatus': function (p) { return setAcStatus_(p); },
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
    var ok = changePassword_(me, p.oldPassword, p.newPassword);
    // เปลี่ยนรหัสผ่าน (มักเพราะสงสัยว่ามีคนรู้) → ออกจากระบบทุกเครื่องอื่น
    // เครื่องที่กดเปลี่ยนยังอยู่ต่อ ทั้งการเข้าใช้งานและ PIN ของเครื่องนั้น (หน้าเว็บส่ง _device มา)
    var n = revokeAllSessions_(me, [p._session, p._device]);
    if (n) logActivity_('ออกจากระบบเครื่องอื่นหลังเปลี่ยนรหัสผ่าน', me, n + ' รายการ');
    return ok;
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
   Sync.gs
   ══════════════════════════════════════════════════════════════ */

/**
 * Sync.gs — ข้อมูลตรงกันสองฝั่ง: Cloudflare (ตัวหลัก) ⇄ Apps Script (ตัวสำรอง)
 *
 * ไฟล์นี้รันทั้งสองฝั่ง (โค้ดชุดเดียวกัน) แบ่งงานกันแบบนี้
 *
 *   จด     ทุกครั้งที่เขียนแถว (insertRow_ / updateRow_ / deleteRow_ / bulkInsert_
 *          / setSetting_ / เขียนทั้งชีต) จะจดการเปลี่ยนแปลงเป็น "op" ไว้
 *   ส่ง     จบคำสั่งแล้วส่ง op ทั้งหมดไปอีกฝั่งทันที
 *          Apps Script → Cloudflare ส่งตรงด้วย UrlFetchApp (syncDeliver_ ด้านล่าง)
 *          Cloudflare → Apps Script ตัว Durable Object เป็นคนส่ง (cloudflare/server.js)
 *   รับ     applySyncOps_ เขียนลงชีตของตัวเองโดยไม่จดซ้ำ (กันส่งกลับไปกลับมา)
 *
 * op หนึ่งตัว:
 *   { s: ชีต, k: รหัสแถว, r: ข้อมูลทั้งแถว | null (= ลบ), t: เวลาที่เปลี่ยน }
 *   { s: ชีต, all: [ทุกแถว], t }   ← เขียนทั้งชีตใหม่ (ย้ายข้อมูล / นำเข้าแบบแทนที่)
 *   { s: ActivityLog, add: แถว, t } ← ประวัติการแก้ไข เพิ่มอย่างเดียว
 *   { s: Sessions, revoke: ชื่อผู้ใช้, dev: true|false, t } ← ให้ออกจากระบบทุกเครื่อง / ยกเลิก PIN ทุกเครื่อง
 *       (ไม่ส่งรหัสการเข้าใช้งานข้ามระบบ ส่งแค่คำสั่งให้อีกฝั่งลบของตัวเอง)
 *
 * กันรับซ้ำ: ผู้ส่งติดเลขลำดับให้ทุก op (_g จาก Apps Script · _o จาก Cloudflare)
 * ผู้รับจำเลขล่าสุดที่ทำแล้ว ถ้าคำตอบหายระหว่างทางแล้วผู้ส่งส่งซ้ำ ก็ไม่ทำซ้ำ (ประวัติไม่งอก)
 * กันโค้ดคนละรุ่น: ทุกชุดแนบ schemaVersion ผู้รับที่รุ่นไม่ตรงจะปฏิเสธ ผู้ส่งเก็บเข้าคิวรอจนอัปเดตครบ
 *
 * ไม่ซิงก์ชีต Sessions — การเข้าใช้งานแยกกันแต่ละฝั่ง รหัสการเข้าใช้งานจึงไม่ต้องเดินทางข้ามระบบ
 * ส่งไม่สำเร็จ (อีกฝั่งล่ม/เน็ตหลุด) เก็บเข้าคิวแล้วลองใหม่เองจนกว่าจะสำเร็จ
 */

var SYNC_SKIP = [SHEETS.SESSIONS];

/** คำสั่งที่ต้องใช้ Google Drive/อีเมล — ฝั่ง Cloudflare ส่งต่อให้ Apps Script ทำแทน */
var SYNC_PROXY_ACTIONS = ['file.upload', 'file.trash', 'ocr.read',
                          'backup.backupNow', 'backup.history', 'notify.send'];

function syncable_(name) { return !!SCHEMA[name] && SYNC_SKIP.indexOf(name) < 0; }
function syncKey_(name) { return SCHEMA[name][0].key; }

/** รันอยู่บน Cloudflare หรือไม่ — ตัวรันฝั่ง Cloudflare ประกาศทับให้คืน true */
function onCloudflare_() { return false; }

/* ------------------------------------------------------------------ */
/*  จดการเปลี่ยนแปลง                                                   */
/* ------------------------------------------------------------------ */

var SYNC_OUT_ = null;        // { ops: [], full: {} } ระหว่างคำสั่ง · null = ไม่ได้จด
var SYNC_APPLYING_ = false;  // กำลังเขียนสิ่งที่อีกฝั่งส่งมา — ห้ามจดซ้ำ ไม่งั้นส่งกลับไปกลับมาไม่จบ

function syncBegin_() { SYNC_OUT_ = { ops: [], full: {} }; }

function syncRowOut_(name, row) {
  var out = {};
  SCHEMA[name].forEach(function (c) { out[c.key] = row[c.key] === undefined ? '' : row[c.key]; });
  return out;
}

/** แถวหนึ่งถูกเพิ่ม/แก้ (row) หรือถูกลบ (row = null, key = รหัส) */
function syncNote_(name, row, key) {
  if (!SYNC_OUT_ || SYNC_APPLYING_ || !syncable_(name)) return;
  var t = Date.now();
  if (name === SHEETS.LOG) {
    if (row) SYNC_OUT_.ops.push({ s: name, add: syncRowOut_(name, row), t: t });
    return;
  }
  var k = String(row ? row[syncKey_(name)] : key);
  if (!k) return;
  SYNC_OUT_.ops.push({ s: name, k: k, r: row ? syncRowOut_(name, row) : null, t: t });
}

/** ให้ออกจากระบบทุกเครื่องของผู้ใช้ (dev = เฉพาะอุปกรณ์ที่ตั้ง PIN) — อีกฝั่งต้องทำตามด้วย */
function syncNoteRevoke_(username, dev) {
  if (!SYNC_OUT_ || SYNC_APPLYING_) return;
  var u = String(username || '').trim();
  if (u) SYNC_OUT_.ops.push({ s: SHEETS.SESSIONS, revoke: u, dev: !!dev, t: Date.now() });
}

/** ฝั่งรับ: ลบการเข้าใช้งานของผู้ใช้นั้นในระบบของตัวเอง (ไม่จดซ้ำ ไม่ลงประวัติซ้ำ) */
function syncApplyRevoke_(username, dev) {
  var u = normUsername_(username);
  var rows = readRows_(SHEETS.SESSIONS);
  var n = 0;
  for (var i = rows.length - 1; i >= 0; i--) {
    if (normUsername_(rows[i].username) !== u) continue;
    if (dev && rows[i].kind !== 'อุปกรณ์') continue;
    deleteRow_(SHEETS.SESSIONS, rows[i]._row, rows[i]); n++;
  }
  return n;
}

/** ทั้งชีตถูกเขียนใหม่ — ตอนส่งค่อยอ่านสภาพล่าสุดทั้งชีต */
function syncNoteSheet_(name) {
  if (!SYNC_OUT_ || SYNC_APPLYING_ || !syncable_(name) || name === SHEETS.LOG) return;
  SYNC_OUT_.full[name] = Date.now();
}

/** จบคำสั่ง: รวม op ของคำสั่งนี้แล้วส่ง */
function syncEnd_() {
  var cur = SYNC_OUT_;
  SYNC_OUT_ = null;
  if (!cur) return [];
  var full = cur.full;
  var ops = cur.ops.filter(function (op) { return !full[op.s]; });   // เขียนทั้งชีตแล้ว แถวย่อยไม่ต้องส่ง
  Object.keys(full).forEach(function (name) {
    ops.push({ s: name, all: readRows_(name).map(function (r) { return syncRowOut_(name, r); }), t: full[name] });
  });
  if (ops.length) syncDeliver_(ops);
  return ops;
}

/* ------------------------------------------------------------------ */
/*  รับการเปลี่ยนแปลงจากอีกฝั่ง                                          */
/* ------------------------------------------------------------------ */

/**
 * @param {Array} ops
 * @param {{accept?:function(Object):boolean, keepNewer?:function(string,string,number):boolean,
 *          dropIncoming?:function(string,string,number):boolean}=} opts
 *   accept        รับ op แถวนี้ไหม (ฝั่ง Cloudflare ใช้กันข้อมูลเก่ามาทับข้อมูลที่ใหม่กว่า)
 *   keepNewer     ตอนเขียนทั้งชีต แถวไหนของเราใหม่กว่า ให้เก็บของเราไว้
 *   dropIncoming  ตอนเขียนทั้งชีต แถวที่เราเพิ่งลบไป (หลังเวลาของชุดนี้) ไม่ต้องเอากลับมา
 *   strict        เจอ op ที่ทำไม่ได้ให้หยุดทั้งชุด (ใช้ตอนย้ายข้อมูลตั้งต้น — ต้องครบหรือไม่ทำเลย)
 *                 ไม่ตั้ง = ข้าม op นั้นแล้วทำตัวที่เหลือต่อ ไม่ให้ op เดียวขวางการซิงก์ไปตลอด
 * @return {number} จำนวน op ที่เขียนจริง
 */
function applySyncOps_(ops, opts) {
  opts = opts || {};
  var n = 0;
  SYNC_APPLYING_ = true;
  try {
    (ops || []).forEach(function (op) {
      if (!op) return;
      try {
        n += applySyncOp_(op, opts);
      } catch (e) {
        if (opts.strict) throw e;
        console.error('applySyncOps_: ข้าม op ' + op.s + '/' + (op.k || op.revoke || (op.all ? 'ทั้งชีต' : 'add')) + ' -> ' + e);
        if (opts.failed) opts.failed.push({ s: op.s, k: op.k, error: String(e && e.message || e) });
      }
    });
  } finally {
    SYNC_APPLYING_ = false;
  }
  return n;
}

/** ทำ op เดียว · คืนจำนวนที่เขียนจริง (0 หรือ 1) */
function applySyncOp_(op, opts) {
  if (op.revoke) { syncApplyRevoke_(op.revoke, op.dev); return 1; }
  if (!syncable_(op.s)) return 0;
  var name = op.s, key = syncKey_(name);
  if (op.add) { insertRow_(name, op.add); return 1; }
  if (op.all) {
    var merged = {}, order = [];
    op.all.forEach(function (r) {
      var k = String(r[key]);
      if (opts.dropIncoming && opts.dropIncoming(name, k, op.t)) return;
      if (!(k in merged)) order.push(k);
      merged[k] = r;
    });
    if (opts.keepNewer) {
      readRows_(name).forEach(function (r) {
        var k = String(r[key]);
        if (!opts.keepNewer(name, k, op.t)) return;
        if (!(k in merged)) order.push(k);
        merged[k] = r;
      });
    }
    rewriteSheet_(name, order.map(function (k) { return merged[k]; }));
    return 1;
  }
  if (opts.accept && !opts.accept(op)) return 0;
  var found = findRow_(name, op.k, key);
  if (!op.r) {
    if (!found) return 0;
    deleteRow_(name, found._row, found);
    return 1;
  }
  if (found) updateRow_(name, found._row, Object.assign({}, found, op.r));
  else insertRow_(name, op.r);
  return 1;
}

/** รุ่นโครงสร้างข้อมูลของอีกฝั่งเข้ากับเราไหม (ไม่แนบมา = โค้ดรุ่นแรกที่ยังไม่ส่งค่านี้ ถือว่าเข้ากัน) */
function syncSchemaOk_(v) {
  return v === undefined || v === null || v === '' || Number(v) === SCHEMA_VERSION;
}

/** ข้อมูลทั้งระบบสำหรับให้อีกฝั่งตั้งต้น (รวมค่าลับ เพราะเป็นระบบของเจ้าของคนเดียวกัน · ไม่รวม Sessions) */
function syncExport_() {
  var sheets = {};
  Object.keys(SHEETS).forEach(function (k) {
    var name = SHEETS[k];
    if (!syncable_(name)) return;
    var rows = readRows_(name).map(function (r) { return syncRowOut_(name, r); });
    if (name === SHEETS.LOG) rows = rows.slice(-SYNC_LOG_KEEP);
    sheets[name] = rows;
  });
  return { schemaVersion: SCHEMA_VERSION, version: APP.VERSION, sheets: sheets };
}

var SYNC_LOG_KEEP = 20000;   // ประวัติการแก้ไขที่ส่งไปตั้งต้น (ฉบับเต็มอยู่ในชีตเสมอ)

/* ------------------------------------------------------------------ */
/*  ฝั่ง Apps Script: ส่งไป Cloudflare + คิวลองใหม่                      */
/* ------------------------------------------------------------------ */

var SYNC_PROP = {
  SECRET: 'SYNC_SECRET',      // รหัสลับที่สองฝั่งใช้ยืนยันกัน (สร้างตอนจับคู่)
  CF_URL: 'CF_URL',           // ที่อยู่ของระบบบน Cloudflare
  QUEUE: 'SYNC_QUEUE',        // op ที่ส่งไม่สำเร็จ รอส่งใหม่
  SEQ: 'SYNC_SEQ',            // เลขลำดับ op ล่าสุดที่ส่งออก
  CF_DONE: 'SYNC_CF_DONE',    // เลขลำดับ op จาก Cloudflare ที่ทำไปแล้ว (กันทำซ้ำ)
  RESYNC: 'SYNC_RESYNC',      // คิวยาวเกินที่เก็บได้ → ส่งทั้งชีตแทน
  LAST_OK: 'SYNC_LAST_OK',
  LAST_ERR: 'SYNC_LAST_ERROR'
};
var SYNC_QUEUE_MAX = 8000;    // ไบต์ — Script Properties เก็บได้ราว 9 KB ต่อค่า

function syncConfigured_() {
  return !!(props_().getProperty(SYNC_PROP.SECRET) && props_().getProperty(SYNC_PROP.CF_URL));
}

/** ส่ง op ไปอีกฝั่ง — ฝั่ง Cloudflare ประกาศทับฟังก์ชันนี้ (ให้ Durable Object เป็นคนส่ง) */
function syncDeliver_(ops) {
  if (!syncConfigured_()) return false;
  // ทำใต้ล็อกเสมอ: คิวเก็บใน Script Properties แบบ อ่าน-แก้-เขียน ถ้าสองคำสั่งทำพร้อมกัน
  // อีกคนจะเขียนทับคิวของอีกคน (หรือ syncRetry ลบคิวที่เพิ่งต่อท้าย) แล้วการเปลี่ยนแปลงหาย
  try {
    return withScriptLock_(function () {
      syncTag_(ops);
      var queue = syncQueue_();
      var batch = queue.concat([ops]);
      var resync = syncResyncList_();
      if (!resync.length && syncPost_(batch)) {
        props_().deleteProperty(SYNC_PROP.QUEUE);
        return true;
      }
      syncEnqueue_(ops);
      return false;
    }, 30000);
  } catch (e) {
    console.error('syncDeliver_ -> ' + e);
    try { syncMarkResync_([ops]); } catch (e2) { console.error('syncMarkResync_ -> ' + e2); }
    return false;
  }
}

/** ติดเลขลำดับให้ทุก op (ฝั่ง Cloudflare ใช้กันทำซ้ำเมื่อส่งซ้ำ) */
function syncTag_(ops) {
  var seq = Number(props_().getProperty(SYNC_PROP.SEQ) || 0);
  ops.forEach(function (op) { if (op && op._g === undefined) op._g = ++seq; });
  props_().setProperty(SYNC_PROP.SEQ, String(seq));
}

/** ความยาวเป็นไบต์แบบ UTF-8 (ภาษาไทย 1 ตัว = 3 ไบต์ — ขีดจำกัดของ Script Properties นับเป็นไบต์) */
function utf8Len_(s) {
  return encodeURIComponent(String(s)).replace(/%[0-9A-F]{2}/gi, 'x').length;
}

/** จำว่าชีตไหนต้องส่งทั้งชีตใหม่ (ใช้เมื่อเก็บ op ทีละตัวไม่ไหว) */
function syncMarkResync_(batches) {
  var names = {};
  syncResyncList_().forEach(function (n) { names[n] = true; });
  batches.forEach(function (b) { (b || []).forEach(function (op) { if (op && syncable_(op.s) && op.s !== SHEETS.LOG) names[op.s] = true; }); });
  props_().setProperty(SYNC_PROP.RESYNC, JSON.stringify(Object.keys(names)));
}

function syncQueue_() {
  try { var q = JSON.parse(props_().getProperty(SYNC_PROP.QUEUE) || '[]'); return Array.isArray(q) ? q : []; }
  catch (e) { return []; }
}
function syncResyncList_() {
  try { var r = JSON.parse(props_().getProperty(SYNC_PROP.RESYNC) || '[]'); return Array.isArray(r) ? r : []; }
  catch (e) { return []; }
}

/** เก็บเข้าคิว · ถ้าคิวยาวเกินที่เก็บได้ จำแค่ว่าชีตไหนต้องส่งทั้งชีตใหม่ */
function syncEnqueue_(ops) {
  var queue = syncQueue_().concat([ops]);
  var text = JSON.stringify(queue);
  if (utf8Len_(text) <= SYNC_QUEUE_MAX) {
    try { props_().setProperty(SYNC_PROP.QUEUE, text); return; }
    catch (e) { console.error('syncEnqueue_ -> ' + e); }   // ใหญ่เกินจริง ๆ — ไปทางส่งทั้งชีตแทน
  }
  syncMarkResync_(queue);
  props_().deleteProperty(SYNC_PROP.QUEUE);
}

/** POST ไป Cloudflare · batch = รายการของชุด op (ส่งตามลำดับ) */
function syncPost_(batch) {
  var ops = [];
  batch.forEach(function (b) { ops = ops.concat(b); });
  try {
    var res = UrlFetchApp.fetch(String(props_().getProperty(SYNC_PROP.CF_URL)).replace(/\/+$/, '') + '/sync/apply', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true, followRedirects: true,
      payload: JSON.stringify({ secret: props_().getProperty(SYNC_PROP.SECRET), schemaVersion: SCHEMA_VERSION, ops: ops })
    });
    var reply = {};
    try { reply = JSON.parse(res.getContentText() || '{}') || {}; } catch (e2) { reply = {}; }
    var ok = res.getResponseCode() === 200 && reply.ok === true;
    if (ok) props_().setProperty(SYNC_PROP.LAST_OK, nowStamp_());
    else props_().setProperty(SYNC_PROP.LAST_ERR, nowStamp_() + ' · HTTP ' + res.getResponseCode() +
      (reply.error ? ' · ' + String(reply.error).slice(0, 160) : ''));
    return ok;
  } catch (e) {
    props_().setProperty(SYNC_PROP.LAST_ERR, nowStamp_() + ' · ' + String(e && e.message || e).slice(0, 200));
    return false;
  }
}

/** ตัวตั้งเวลา (ทุก 5 นาที) — ส่งสิ่งที่ค้างในคิวซ้ำ */
function syncRetry() {
  if (!syncConfigured_()) return 'ยังไม่ได้เชื่อมกับ Cloudflare';
  return withScriptLock_(function () {
    // คิว (การแก้ที่เก่ากว่า เลขลำดับน้อยกว่า) ต้องไปก่อน แล้วค่อยส่งทั้งชีต (สภาพล่าสุด) ทับ
    // กลับลำดับเมื่อไร ของเก่าจะไปทับของใหม่ และอีกฝั่งจะข้ามคิวเพราะเลขลำดับน้อยกว่าที่ทำไปแล้ว
    var queue = syncQueue_();
    if (queue.length) {
      if (!syncPost_(queue)) return 'ยังส่งไม่ได้ จะลองใหม่รอบหน้า';
      props_().deleteProperty(SYNC_PROP.QUEUE);
    }
    var resync = syncResyncList_();
    if (resync.length) {
      var t = Date.now();
      var ops = resync.filter(syncable_).map(function (name) {
        return { s: name, all: readRows_(name).map(function (r) { return syncRowOut_(name, r); }), t: t };
      });
      syncTag_(ops);
      if (!syncPost_([ops])) return 'ยังส่งไม่ได้ จะลองใหม่รอบหน้า';
      props_().deleteProperty(SYNC_PROP.RESYNC);
    }
    return 'ข้อมูลตรงกันแล้ว';
  }, 60000);
}

function installSyncTrigger_() {
  var mine = ['syncRetry', 'syncOnEdit', 'syncOnChange'];
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (mine.indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncRetry').timeBased().everyMinutes(5).create();
  var ss = getSpreadsheet_();
  ScriptApp.newTrigger('syncOnEdit').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('syncOnChange').forSpreadsheet(ss).onChange().create();
}

/* ------------------------------------------------------------------ */
/*  ฝั่ง Apps Script: คำขอที่ Cloudflare ส่งมา (ผ่าน doPost)             */
/* ------------------------------------------------------------------ */

/**
 * @param {Object} body  { op, secret, ... }
 *   pair    จับคู่ครั้งแรก — ยืนยันด้วย "กุญแจกู้ระบบ" ของ Apps Script แล้วสร้างรหัสลับร่วม
 *   export  ส่งข้อมูลทั้งระบบให้ Cloudflare ตั้งต้น
 *   apply   รับ op จาก Cloudflare
 *   api     ทำคำสั่งที่ต้องใช้ Drive/อีเมลแทน Cloudflare (ตรวจสิทธิ์ผู้ใช้มาแล้วที่ Cloudflare)
 *   ping    ตรวจว่ายังเชื่อมกันอยู่
 */
function syncHandle_(body) {
  body = body || {};
  try {
    runMigrations_();
    if (body.op === 'pair') return syncPair_(body);

    var secret = props_().getProperty(SYNC_PROP.SECRET);
    if (!secret || !safeEqual_(body.secret, secret)) return { ok: false, error: 'รหัสเชื่อมต่อไม่ถูกต้อง' };

    if (body.op === 'ping') return { ok: true, version: APP.VERSION, schemaVersion: SCHEMA_VERSION };
    if (body.op === 'export') return Object.assign({ ok: true }, syncExport_());
    if (body.op === 'apply') {
      if (!syncSchemaOk_(body.schemaVersion)) {
        return { ok: false, error: 'โค้ดสองฝั่งเป็นคนละรุ่น (Apps Script รุ่นข้อมูล ' + SCHEMA_VERSION + ' / Cloudflare ' +
          body.schemaVersion + ') — อัปเดตโค้ดให้ตรงกันก่อน ระหว่างนี้ข้อมูลรอในคิว ไม่หาย' };
      }
      var n = withScriptLock_(function () {
        // ส่งซ้ำ (คำตอบรอบก่อนหายระหว่างทาง) — op ที่ทำไปแล้วข้าม
        var done = Number(props_().getProperty(SYNC_PROP.CF_DONE) || 0), top = done;
        var fresh = (body.ops || []).filter(function (op) {
          var o = op && Number(op._o);
          if (!o) return true;
          if (o > top) top = o;
          return o > done;
        });
        var applied = applySyncOps_(fresh);
        if (top > done) props_().setProperty(SYNC_PROP.CF_DONE, String(top));
        return applied;
      }, 60000);
      return { ok: true, applied: n };
    }
    if (body.op === 'api') return syncProxyApi_(body);
    return { ok: false, error: 'ไม่รู้จักคำสั่ง: ' + body.op };
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e) };
  }
}

function syncPair_(body) {
  var adminKey = getSetting_('admin_token', '');
  if (!adminKey || !safeEqual_(String(body.adminKey || '').trim(), adminKey)) {
    logActivity_('จับคู่ Cloudflare ไม่สำเร็จ', 'กุญแจกู้ระบบไม่ถูกต้อง', '');
    return { ok: false, error: 'กุญแจกู้ระบบไม่ถูกต้อง' };
  }
  var url = String(body.cfUrl || '').trim().replace(/\/+$/, '');
  if (!/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(url)) return { ok: false, error: 'ที่อยู่ Cloudflare ไม่ถูกต้อง' };
  var secret = randomToken_(48);
  props_().setProperty(SYNC_PROP.SECRET, secret);
  props_().setProperty(SYNC_PROP.CF_URL, url);
  props_().deleteProperty(SYNC_PROP.QUEUE);
  props_().deleteProperty(SYNC_PROP.RESYNC);
  props_().deleteProperty(SYNC_PROP.CF_DONE);   // Cloudflare ฐานข้อมูลใหม่อาจนับเลขใหม่ตั้งแต่ 1
  try { installSyncTrigger_(); } catch (e) { /* ไม่มีสิทธิ์ตั้งเวลา ก็ยังซิงก์สดได้ แค่ไม่มีลองใหม่อัตโนมัติ */ }
  logActivity_('จับคู่กับ Cloudflare', url, '');
  return { ok: true, secret: secret, execUrl: webAppUrl_(), sheetUrl: getSpreadsheet_().getUrl(), version: APP.VERSION };
}

/** คำสั่งที่ Cloudflare ส่งต่อมา (อัปโหลดไฟล์ OCR สำรองข้อมูล ส่งอีเมล) */
function syncProxyApi_(body) {
  var action = String(body.action || '');
  if (SYNC_PROXY_ACTIONS.indexOf(action) < 0) return { ok: false, error: 'คำสั่งนี้ส่งต่อมาไม่ได้: ' + action };
  var role = body.role;
  if (ROLES.indexOf(role) < 0) return { ok: false, error: 'สิทธิ์ไม่ถูกต้อง' };
  if (ADMIN_ONLY_ACTIONS.test(action) && role !== ROLE.ADMIN) return { ok: false, error: 'เฉพาะผู้ดูแลเท่านั้นที่ทำรายการนี้ได้' };
  if (MUTATING_ACTIONS.test(action) && roleRank_(role) < roleRank_(ROLE.EDITOR)) {
    return { ok: false, error: 'บัญชีนี้เปิดดูได้อย่างเดียว จึงแก้ไขข้อมูลไม่ได้' };
  }
  // งานพวกนี้อาจเขียนชีตด้วย (เช่น เวลาสำรองข้อมูลล่าสุด) — จดแล้วส่งกลับไป Cloudflare เหมือนคำสั่งปกติ
  syncBegin_();
  try {
    return { ok: true, data: withScriptLock_(function () { return API_ROUTES[action](body.payload || {}, role); }, 25000) };
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e) };
  } finally {
    try { syncEnd_(); } catch (e2) { console.error('sync -> ' + e2); }
  }
}

/* ------------------------------------------------------------------ */
/*  ฝั่ง Apps Script: พิมพ์แก้ในชีตโดยตรง                                */
/* ------------------------------------------------------------------ */

/**
 * ตัวตั้งเวลา "เมื่อแก้ไข/เมื่อเปลี่ยนแปลง" ของชีต — ส่งทั้งแผ่นที่ถูกแก้ไปให้ Cloudflare
 * (การแก้จากโค้ดไม่ทำให้ตัวนี้ทำงาน มีแต่คนพิมพ์ในชีตเท่านั้น จึงไม่ซ้ำกับการซิงก์ปกติ)
 * แผ่นทั้งแผ่นเพราะการลบ/แทรก/ลากแถวทำให้รู้ไม่ได้ว่าแถวไหนเปลี่ยน
 */
function syncOnEdit(e) {
  if (!syncConfigured_()) return;
  var names = [];
  try {
    var sh = (e && e.range && e.range.getSheet) ? e.range.getSheet() : (e && e.source ? e.source.getActiveSheet() : null);
    if (sh) names.push(sh.getName());
  } catch (err) { /* ไม่รู้ว่าแผ่นไหน */ }
  names = names.filter(function (n) { return syncable_(n) && n !== SHEETS.LOG; });
  if (!names.length) return;
  withScriptLock_(function () {
    var t = Date.now();
    syncDeliver_(names.map(function (name) {
      return { s: name, all: readRows_(name).map(function (r) { return syncRowOut_(name, r); }), t: t };
    }));
  }, 30000);
}
function syncOnChange(e) {
  // แก้ค่าในช่อง (EDIT) ตัว onEdit จัดการแล้ว · จัดรูปแบบ (FORMAT) ไม่เปลี่ยนข้อมูล — ส่งเฉพาะการเปลี่ยนโครง
  var structural = ['INSERT_ROW', 'REMOVE_ROW', 'INSERT_COLUMN', 'REMOVE_COLUMN', 'INSERT_GRID', 'REMOVE_GRID', 'OTHER'];
  if (!e || structural.indexOf(e.changeType) < 0) return;
  syncOnEdit(e);
}

/** สถานะการเชื่อมต่อ (หน้าตั้งค่า) */
function syncStatus_() {
  return {
    platform: onCloudflare_() ? 'cloudflare' : 'apps-script',
    paired: syncConfigured_(),
    peer: props_().getProperty(SYNC_PROP.CF_URL) || '',
    lastOk: props_().getProperty(SYNC_PROP.LAST_OK) || '',
    lastError: props_().getProperty(SYNC_PROP.LAST_ERR) || '',
    pending: syncQueue_().length + syncResyncList_().length
  };
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
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
  // ไม่ตั้ง XFrameOptionsMode.ALLOWALL — ถ้าเปิดให้เว็บอื่นฝังหน้านี้ได้ คนอื่นทำหน้าหลอก
  // ครอบหน้าระบบไว้ใต้ปุ่มของตัวเอง ให้คนที่ล็อกอินค้างอยู่กดลบ/แก้ข้อมูลโดยไม่รู้ตัวได้ (clickjacking)
  // ค่าตั้งต้นของ Apps Script เปิดผ่านลิงก์ /exec ได้ตามปกติ
}

/**
 * จุดรับคำขอจากระบบบน Cloudflare (ซิงก์ข้อมูล / จับคู่ / ทำงานที่ต้องใช้ Drive แทน)
 * ทุกคำขอยกเว้นการจับคู่ต้องมีรหัสลับร่วม ตรวจใน syncHandle_ (Sync.gs)
 */
function doPost(e) {
  var body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { body = {}; }
  return ContentService.createTextOutput(JSON.stringify(syncHandle_(body)))
    .setMimeType(ContentService.MimeType.JSON);
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
  'aW5rKTsgZm9udC1zaXplOjE0cHg7IGxpbmUtaGVpZ2h0OjEuNTU7CiAgLXdlYmtpdC1mb250LXNtb290aGluZzphbnRpYWxpYXNlZDsKfQppbWd7bWF4LXdpZHRoOjEwMCV9CmNvZGV7b3ZlcmZsb3ctd3JhcDphbnl3aGVyZX0gICAvKiDguKXguLTguIfguIHguYzg',
  'uKLguLLguKcg4LmGIOC4leC4seC4lOC4guC4tuC5ieC4meC4muC4o+C4o+C4l+C4seC4lOC5g+C4q+C4oeC5iOC5hOC4lOC5iSDguYTguKHguYjguJTguLHguJnguIjguK3guYPguKvguYnguYDguKXguLfguYjguK3guJnguILguYnguLLguIcgKi8KLnQgdGQgPiAu',
  'Y3Z7ZGlzcGxheTpjb250ZW50c30gICAvKiDguJXguLHguKfguKvguYjguK3guITguYjguLLguYPguJnguIrguYjguK3guIfguJXguLLguKPguLLguIcg4oCUIOC4iOC4reC4geC4p+C5ieC4suC4h+C4l+C4s+C5gOC4q+C4oeC4t+C4reC4meC5hOC4oeC5iOC4oeC4',
  'tSAo4LiU4Li5IGxhYmVsQ2VsbHMpICovCltoaWRkZW5de2Rpc3BsYXk6bm9uZSFpbXBvcnRhbnR9Cjpmb2N1cy12aXNpYmxle291dGxpbmU6MnB4IHNvbGlkIHZhcigtLWJyYW5kKTtvdXRsaW5lLW9mZnNldDoycHg7Ym9yZGVyLXJhZGl1czo1cHh9CkBtZWRpYSAo',
  'cHJlZmVycy1yZWR1Y2VkLW1vdGlvbjpyZWR1Y2UpewogICosKjo6YmVmb3JlLCo6OmFmdGVye2FuaW1hdGlvbi1kdXJhdGlvbjouMDFtcyFpbXBvcnRhbnQ7YW5pbWF0aW9uLWl0ZXJhdGlvbi1jb3VudDoxIWltcG9ydGFudDt0cmFuc2l0aW9uLWR1cmF0aW9uOi4w',
  'MW1zIWltcG9ydGFudH0KfQphe2NvbG9yOnZhcigtLWJyYW5kKTt0ZXh0LWRlY29yYXRpb246bm9uZX0KYnV0dG9uLGlucHV0LHNlbGVjdCx0ZXh0YXJlYXtmb250OmluaGVyaXQ7Y29sb3I6aW5oZXJpdH0KOjotd2Via2l0LXNjcm9sbGJhcnt3aWR0aDoxMHB4O2hl',
  'aWdodDoxMHB4fQo6Oi13ZWJraXQtc2Nyb2xsYmFyLXRodW1ie2JhY2tncm91bmQ6dmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czo4cHg7Ym9yZGVyOjNweCBzb2xpZCB2YXIoLS1iZyl9CgovKiA9PT09PT09PT09PT0gbGF5b3V0ID09PT09PT09PT09PSAqLwouYXBw',
  'e2Rpc3BsYXk6ZmxleDttaW4taGVpZ2h0OjEwMHZofQoubmF2ewogIHdpZHRoOnZhcigtLW5hdi13KTtmbGV4OjAgMCB2YXIoLS1uYXYtdyk7YmFja2dyb3VuZDp2YXIoLS1uYXYpO2NvbG9yOnZhcigtLW5hdi1pbmspOwogIGRpc3BsYXk6ZmxleDtmbGV4LWRpcmVj',
  'dGlvbjpjb2x1bW47cG9zaXRpb246c3RpY2t5O3RvcDowO2hlaWdodDoxMDB2aDtvdmVyZmxvdy15OmF1dG87Cn0KLmJyYW5ke3BhZGRpbmc6MjBweCAxOHB4IDE2cHg7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgcmdiYSgyNTUsMjU1LDI1NSwuMDcpfQouYnJhbmQg',
  'YntkaXNwbGF5OmJsb2NrO2NvbG9yOiNmZmY7Zm9udC1zaXplOjE1LjVweDtsZXR0ZXItc3BhY2luZzouMXB4O2ZvbnQtZmFtaWx5OnZhcigtLWZvbnQtZGlzcGxheSk7Zm9udC13ZWlnaHQ6NjAwfQouYnJhbmQgc3Bhbntmb250LXNpemU6MTEuNXB4O2NvbG9yOnZh',
  'cigtLW5hdi1zZWMpfQoubmF2LWxpc3R7cGFkZGluZzoxMHB4IDEwcHggMjBweDtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2dhcDoycHg7ZmxleDoxfQoubmF2LXNlY3tmb250LXNpemU6MTAuNXB4O2xldHRlci1zcGFjaW5nOi45cHg7dGV4dC10',
  'cmFuc2Zvcm06dXBwZXJjYXNlO2NvbG9yOnZhcigtLW5hdi1zZWMpO3BhZGRpbmc6MTRweCAxMHB4IDZweDtmb250LXdlaWdodDo2MDB9Ci5uYXYtaXRlbXsKICBkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMHB4O3BhZGRpbmc6OXB4IDExcHg7',
  'Ym9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTsKICBjdXJzb3I6cG9pbnRlcjtjb2xvcjp2YXIoLS1uYXYtaW5rKTtmb250LXNpemU6MTMuNXB4O2JvcmRlcjowO2JhY2tncm91bmQ6MDt3aWR0aDoxMDAlO3RleHQtYWxpZ246bGVmdDsKfQoubmF2LWl0ZW06aG92ZXJ7',
  'YmFja2dyb3VuZDp2YXIoLS1uYXYtMik7Y29sb3I6I2ZmZn0KLm5hdi1pdGVtLm9ue2JhY2tncm91bmQ6dmFyKC0tYnJhbmQpO2NvbG9yOnZhcigtLWJyYW5kLWluayk7Zm9udC13ZWlnaHQ6NjAwfQoubmF2LWl0ZW0gLmlje3dpZHRoOjE4cHg7dGV4dC1hbGlnbjpj',
  'ZW50ZXI7Zm9udC1zaXplOjE1cHh9Ci5uYXYtaXRlbSAuYmFkZ2V7bWFyZ2luLWxlZnQ6YXV0bztiYWNrZ3JvdW5kOnJnYmEoMjU1LDI1NSwyNTUsLjE0KTtib3JkZXItcmFkaXVzOjIwcHg7cGFkZGluZzoxcHggN3B4O2ZvbnQtc2l6ZToxMXB4fQoubmF2LWl0ZW0u',
  'b24gLmJhZGdle2JhY2tncm91bmQ6cmdiYSgyNTUsMjU1LDI1NSwuMjUpfQoubmF2LWZvb3R7cGFkZGluZzoxMnB4IDE2cHg7Ym9yZGVyLXRvcDoxcHggc29saWQgcmdiYSgyNTUsMjU1LDI1NSwuMDcpO2ZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0tbmF2LXNl',
  'Yyl9CgoubWFpbntmbGV4OjE7bWluLXdpZHRoOjA7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbn0KLnRvcHsKICBwb3NpdGlvbjpzdGlja3k7dG9wOjA7ei1pbmRleDozMDtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpO2JvcmRlci1ib3R0b206MXB4',
  'IHNvbGlkIHZhcigtLWxpbmUpOwogIC8qIOC5geC4luC4muC4q+C4seC4p+C4geC4p+C5ieC4suC4h+C5gOC4leC5h+C4oeC4iOC4rSDguYHguJXguYjguILguK3guIfguILguYnguLLguIfguYPguJnguYDguKPguLXguKLguIfguJXguKPguIfguYHguJnguKfguYDg',
  'uJTguLXguKLguKfguIHguLHguJrguYDguJnguLfguYnguK3guKvguLLguJfguLXguYjguK3guKLguLnguYjguIHguKXguLLguIfguIjguK0KICAgICAo4LiC4Lit4Lia4LiL4LmJ4Liy4Lii4LiC4Lit4LiH4LiK4Li34LmI4Lit4Lir4LiZ4LmJ4LiyID0g4LiC4Lit',
  '4Lia4LiL4LmJ4Liy4Lii4LiC4Lit4LiH4LiB4Liy4Lij4LmM4LiUKSDguYHguJrguJrguYDguJTguLXguKLguKfguIHguLHguJogR2l0SHViIC8gU3RyaXBlIC8gR29vZ2xlIEFkbWluICovCiAgcGFkZGluZzoxMXB4IG1heCh2YXIoLS1ndXR0ZXIpLCBjYWxjKCgx',
  'MDAlIC0gdmFyKC0tcGFnZS1tYXgpKSAvIDIgKyB2YXIoLS1ndXR0ZXIpKSk7CiAgZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTJweDtmbGV4LXdyYXA6d3JhcDsKfQoudG9wIGgxe2ZvbnQtc2l6ZToxNy41cHg7bWFyZ2luOjA7Zm9udC13ZWln',
  'aHQ6NjAwO2xldHRlci1zcGFjaW5nOi0uMXB4O2ZvbnQtZmFtaWx5OnZhcigtLWZvbnQtZGlzcGxheSk7dGV4dC13cmFwOmJhbGFuY2V9Ci50b3AgLnN1Yntmb250LXNpemU6MTJweDtjb2xvcjp2YXIoLS1tdXRlZCk7bWFyZ2luLXRvcDoxcHh9Ci50b3AtcmlnaHR7',
  'bWFyZ2luLWxlZnQ6YXV0bztkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo4cHg7ZmxleC13cmFwOndyYXB9Cjpyb290ey0tcGFnZS1tYXg6MTMyMHB4Oy0tZ3V0dGVyOjIycHh9Ci8qIOC5gOC4meC4t+C5ieC4reC4q+C4suC4reC4ouC4ueC5iOC4',
  'geC4peC4suC4h+C4iOC4rSDguIHguKfguYnguLLguIfguYTguKHguYjguYDguIHguLTguJkgMTMyMHB4IOKAlCDguIjguK3guYPguKvguI3guYjguIjguLDguYDguKvguKXguLfguK3guJfguLXguYjguKfguYjguLLguIfguKrguK3guIfguILguYnguLLguIfguYDg',
  'uJfguYjguLLguIHguLHguJkg4LmE4Lih4LmI4LiB4Lit4LiH4LiK4Li04LiU4LiL4LmJ4Liy4LiiCiAgICjguYDguKfguYfguJrguYPguKvguI3guYjguKrguYjguKfguJnguKHguLLguIHguYPguIrguYkgMTIwMOKAkzE0NDBweDog4Lit4LmI4Liy4LiZ4LiH4LmI',
  '4Liy4LiiIOC4leC4suC5hOC4oeC5iOC4leC5ieC4reC4h+C4geC4p+C4suC4lOC5hOC4geC4pSDguJXguLLguKPguLLguIfguYTguKHguYjguKLguLfguJTguIjguJnguJXguLHguKfguYDguKXguILguKvguYjguLLguIfguIHguLHguJkpICovCi5jb250ZW50e3Bh',
  'ZGRpbmc6MjRweCB2YXIoLS1ndXR0ZXIpIDY0cHg7bWF4LXdpZHRoOnZhcigtLXBhZ2UtbWF4KTt3aWR0aDoxMDAlO21hcmdpbjowIGF1dG99CgouYnVyZ2Vye2Rpc3BsYXk6bm9uZTtiYWNrZ3JvdW5kOjA7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3Jk',
  'ZXItcmFkaXVzOnZhcigtLXItc20pO3BhZGRpbmc6NnB4IDEwcHg7Y3Vyc29yOnBvaW50ZXJ9CgovKiDguYHguJbguJrguKXguYjguLLguIfguKrguLPguKvguKPguLHguJrguKHguLfguK3guJbguLfguK0g4oCUIOC4m+C4uOC5iOC4oeC4iuC4uOC4lOC5gOC4lOC4',
  'teC4ouC4p+C4geC4seC4muC5gOC4oeC4meC4ueC4guC5ieC4suC4hyDguYDguKPguLXguKLguIEgZ28oKSDguJXguLHguKfguYDguJTguLXguKLguKfguIHguLHguJkKICAg4LmE4Lih4LmI4LmD4LiK4LmI4Lir4LiZ4LmJ4Liy4LiI4Lit4LiE4LiZ4Lil4Liw4LiK',
  '4Li44LiUIOC4iOC4reC4geC4p+C5ieC4suC4h+C4i+C5iOC4reC4meC5hOC4p+C5iSDguIjguK3guYHguITguJrguITguYjguK3guKLguYLguJzguKXguYggKOC4lOC4uSBtZWRpYSBxdWVyeSDguJfguYnguLLguKLguYTguJ/guKXguYwpCiAgIOC4m+C4o+C4sOC4',
  'geC4suC4qOC5hOC4p+C5ieC4leC4o+C4h+C4meC4teC5ieC5gOC4nuC4o+C4suC4sOC4leC5ieC4reC4h+C4oeC4suC4geC5iOC4reC4mSBtZWRpYSBxdWVyeSDguYTguKHguYjguIfguLHguYnguJkgZGlzcGxheTpub25lIOC4iOC4sOC4iuC4meC4sCAqLwoudGFi',
  'YmFye2Rpc3BsYXk6bm9uZX0KCi8qID09PT09PT09PT09PSBjb250cm9scyA9PT09PT09PT09PT0gKi8KLnNlbCwuaW5wLC50YXsKICBiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpO2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czp2YXIo',
  'LS1yLXNtKTsKICBwYWRkaW5nOjdweCAxMXB4O2ZvbnQtc2l6ZToxMy41cHg7d2lkdGg6MTAwJTtvdXRsaW5lOjA7dHJhbnNpdGlvbjpib3JkZXItY29sb3IgLjE1cyxib3gtc2hhZG93IC4xNXM7Cn0KLnNlbDpmb2N1cywuaW5wOmZvY3VzLC50YTpmb2N1c3tib3Jk',
  'ZXItY29sb3I6dmFyKC0tYnJhbmQpO2JveC1zaGFkb3c6MCAwIDAgM3B4IHZhcigtLWJyYW5kLXNvZnQpfQoudGF7bWluLWhlaWdodDo3NHB4O3Jlc2l6ZTp2ZXJ0aWNhbH0KLnNlbHtjdXJzb3I6cG9pbnRlcjtwYWRkaW5nLXJpZ2h0OjI2cHh9Ci53LWF1dG97d2lk',
  'dGg6YXV0b30KLmJ0bnsKICBkaXNwbGF5OmlubGluZS1mbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6NnB4O2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlKTsKICBib3JkZXItcmFkaXVzOnZhcigtLXItc20pO3Bh',
  'ZGRpbmc6N3B4IDEzcHg7Zm9udC1zaXplOjEzLjVweDtjdXJzb3I6cG9pbnRlcjtmb250LXdlaWdodDo1MDA7CiAgdHJhbnNpdGlvbjpiYWNrZ3JvdW5kIC4xNXMsYm9yZGVyLWNvbG9yIC4xNXMsdHJhbnNmb3JtIC4wNXM7d2hpdGUtc3BhY2U6bm93cmFwOwp9Ci5i',
  'dG46aG92ZXJ7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpO2JvcmRlci1jb2xvcjp2YXIoLS1mYWludCl9Ci5idG46YWN0aXZle3RyYW5zZm9ybTp0cmFuc2xhdGVZKDFweCl9Ci5idG4ucHJpe2JhY2tncm91bmQ6dmFyKC0tYnJhbmQpO2JvcmRlci1jb2xvcjp2',
  'YXIoLS1icmFuZCk7Y29sb3I6dmFyKC0tYnJhbmQtaW5rKX0KLmJ0bi5wcmk6aG92ZXJ7ZmlsdGVyOmJyaWdodG5lc3MoMS4wNyl9Ci5idG4uZGdye2NvbG9yOnZhcigtLWRhbmdlcik7Ym9yZGVyLWNvbG9yOnZhcigtLWRhbmdlcil9Ci5idG4uZGdyOmhvdmVye2Jh',
  'Y2tncm91bmQ6dmFyKC0tZGFuZ2VyLXNvZnQpfQouYnRuLnNte3BhZGRpbmc6NHB4IDlweDtmb250LXNpemU6MTIuNXB4fQouYnRuLmljb257cGFkZGluZzo1cHggOHB4fQouYnRuW2Rpc2FibGVkXXtvcGFjaXR5Oi41O2N1cnNvcjpub3QtYWxsb3dlZH0KCi5jaGlw',
  'c3tkaXNwbGF5OmZsZXg7Z2FwOjZweDtmbGV4LXdyYXA6d3JhcH0KLmNoaXB7CiAgYm9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpO2JvcmRlci1yYWRpdXM6OTlweDtwYWRkaW5nOjRweCAxMnB4OwogIGZvbnQtc2l6',
  'ZToxMi41cHg7Y3Vyc29yOnBvaW50ZXI7Y29sb3I6dmFyKC0taW5rLTIpOwp9Ci5jaGlwOmhvdmVye2JvcmRlci1jb2xvcjp2YXIoLS1icmFuZCk7Y29sb3I6dmFyKC0tYnJhbmQpfQouY2hpcC5vbntiYWNrZ3JvdW5kOnZhcigtLWJyYW5kKTtib3JkZXItY29sb3I6',
  'dmFyKC0tYnJhbmQpO2NvbG9yOnZhcigtLWJyYW5kLWluayk7Zm9udC13ZWlnaHQ6NjAwfQoKLyogPT09PT09PT09PT09IGNhcmRzID09PT09PT09PT09PSAqLwouY2FyZHtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpO2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGlu',
  'ZSk7Ym9yZGVyLXJhZGl1czp2YXIoLS1yKTtib3gtc2hhZG93OnZhcigtLXNoKX0KLmNhcmQtaHtwYWRkaW5nOjE0cHggMTZweDtib3JkZXItYm90dG9tOjFweCBzb2xpZCB2YXIoLS1saW5lLTIpO2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjEw',
  'cHg7ZmxleC13cmFwOndyYXB9Ci5jYXJkLWggaDN7bWFyZ2luOjA7Zm9udC1zaXplOjE0LjVweDtmb250LXdlaWdodDo2MDA7Zm9udC1mYW1pbHk6dmFyKC0tZm9udC1kaXNwbGF5KTt0ZXh0LXdyYXA6YmFsYW5jZX0KLmNhcmQtaCAuc3B7bWFyZ2luLWxlZnQ6YXV0',
  'bztkaXNwbGF5OmZsZXg7Z2FwOjZweDthbGlnbi1pdGVtczpjZW50ZXI7ZmxleC13cmFwOndyYXB9Ci5jYXJkLWJ7cGFkZGluZzoxNnB4fQouY2FyZC1iLmZsdXNoe3BhZGRpbmc6MH0KCi5ncmlke2Rpc3BsYXk6Z3JpZDtnYXA6MTRweH0KLmcye2dyaWQtdGVtcGxh',
  'dGUtY29sdW1uczpyZXBlYXQoMixtaW5tYXgoMCwxZnIpKX0KLmcze2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoMyxtaW5tYXgoMCwxZnIpKX0KLmc0e2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoNCxtaW5tYXgoMCwxZnIpKX0KLmctYXV0b3tncmlk',
  'LXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KGF1dG8tZml0LG1pbm1heCgyNjBweCwxZnIpKX0KCi8qIEtQSSAqLwoua3Bpe2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXIpO3Bh',
  'ZGRpbmc6MTRweCAxNnB4O2JveC1zaGFkb3c6dmFyKC0tc2gpOwogIGNvbnRhaW5lci10eXBlOmlubGluZS1zaXplfSAgIC8qIOC5g+C4q+C5ieC4leC4seC4p+C5gOC4peC4guC4guC5ieC4suC4h+C5g+C4meC4ouC5iOC4reC4leC4suC4oeC4hOC4p+C4suC4oeC4',
  'geC4p+C5ieC4suC4h+C4guC4reC4h+C4geC4peC5iOC4reC4h+C5gOC4reC4hyDguYTguKHguYjguKfguYjguLLguIjguK3guILguJnguLLguJTguYTguKvguJkgKi8KLmtwaSAubGJse2ZvbnQtc2l6ZToxMnB4O2NvbG9yOnZhcigtLW11dGVkKTtkaXNwbGF5OmZs',
  'ZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo2cHh9Ci5rcGkgLnZhbHtmb250LXNpemU6MjNweDtmb250LXNpemU6Y2xhbXAoMTVweCwxMi41Y3FpLDIzcHgpO2ZvbnQtd2VpZ2h0OjYwMDtsZXR0ZXItc3BhY2luZzotLjRweDttYXJnaW4tdG9wOjVweDsKICBmb250',
  'LWZhbWlseTp2YXIoLS1mb250LWRpc3BsYXkpO2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtcztvdmVyZmxvdy13cmFwOmFueXdoZXJlfQoua3BpIC5jYXB7Zm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1mYWludCk7bWFyZ2luLXRvcDoycHg7Zm9u',
  'dC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zfQoua3BpLmFjY2VudHtiYWNrZ3JvdW5kOnZhcigtLWJyYW5kLXNvZnQpO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudH0KLmtwaS5hY2NlbnQgLmxibHtjb2xvcjp2YXIoLS1icmFuZCl9Ci5rcGkuZ29vZCAudmFs',
  'e2NvbG9yOnZhcigtLW9rKX0gLmtwaS5iYWQgLnZhbHtjb2xvcjp2YXIoLS1kYW5nZXIpfSAua3BpLndhcm4gLnZhbHtjb2xvcjp2YXIoLS13YXJuKX0KCi8qIHByb2dyZXNzICovCi5wYmFye2hlaWdodDoxMHB4O2JvcmRlci1yYWRpdXM6OTlweDtiYWNrZ3JvdW5k',
  'OnZhcigtLWxpbmUtMik7b3ZlcmZsb3c6aGlkZGVuO3Bvc2l0aW9uOnJlbGF0aXZlfQoucGJhcj5pe2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjEwMCU7Ym9yZGVyLXJhZGl1czo5OXB4O2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDkwZGVnLHZhcigtLWJyYW5kKSx2',
  'YXIoLS1icmFuZC0yKSk7dHJhbnNpdGlvbjp3aWR0aCAuNnMgY3ViaWMtYmV6aWVyKC40LDAsLjIsMSl9Ci5wYmFyLmxne2hlaWdodDoxNnB4fQoucGJhci5vaz5pe2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDkwZGVnLHZhcigtLW9rKSx2YXIoLS1vay0yKSl9',
  'Ci5wYmFyLndhcm4+aXtiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCg5MGRlZyx2YXIoLS13YXJuKSx2YXIoLS13YXJuLTIpKX0KLnBtZXRhe2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2Vlbjtmb250LXNpemU6MTJweDtjb2xvcjp2YXIo',
  'LS1tdXRlZCk7bWFyZ2luLXRvcDo3cHh9Ci5wbWV0YSBie2NvbG9yOnZhcigtLWluayk7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zfQoKLyogPT09PT09PT09PT09IHRhYmxlID09PT09PT09PT09PSAqLwoudHd7b3ZlcmZsb3cteDphdXRvOy13ZWJr',
  'aXQtb3ZlcmZsb3ctc2Nyb2xsaW5nOnRvdWNofQp0YWJsZS50e3dpZHRoOjEwMCU7Ym9yZGVyLWNvbGxhcHNlOmNvbGxhcHNlO2ZvbnQtc2l6ZToxM3B4O21pbi13aWR0aDo2NDBweH0KdGFibGUudCB0aHsKICB0ZXh0LWFsaWduOmxlZnQ7cGFkZGluZzo5cHggMTJw',
  'eDtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgdmFyKC0tbGluZSk7CiAgZm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC13ZWlnaHQ6NjAwO2xldHRlci1zcGFjaW5nOi4zcHg7dGV4dC10cmFu',
  'c2Zvcm06dXBwZXJjYXNlO3doaXRlLXNwYWNlOm5vd3JhcDsKfQp0YWJsZS50IHRke3BhZGRpbmc6MTBweCAxMnB4O2JvcmRlci1ib3R0b206MXB4IHNvbGlkIHZhcigtLWxpbmUtMik7dmVydGljYWwtYWxpZ246dG9wfQp0YWJsZS50IHRyOmxhc3QtY2hpbGQgdGR7',
  'Ym9yZGVyLWJvdHRvbTowfQp0YWJsZS50IHRib2R5IHRyOmhvdmVye2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKX0KLm51bXt0ZXh0LWFsaWduOnJpZ2h0O2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtczt3aGl0ZS1zcGFjZTpub3dyYXB9Ci5ub3dy',
  'YXB7d2hpdGUtc3BhY2U6bm93cmFwfQoudC1hY3Rpb25ze2Rpc3BsYXk6ZmxleDtnYXA6NHB4O2p1c3RpZnktY29udGVudDpmbGV4LWVuZH0KCi8qID09PT09PT09PT09PSBiYWRnZXMgPT09PT09PT09PT09ICovCi5ie2Rpc3BsYXk6aW5saW5lLWZsZXg7YWxpZ24t',
  'aXRlbXM6Y2VudGVyO2dhcDo0cHg7Ym9yZGVyLXJhZGl1czo5OXB4O3BhZGRpbmc6MnB4IDlweDtmb250LXNpemU6MTEuNXB4O2ZvbnQtd2VpZ2h0OjYwMDt3aGl0ZS1zcGFjZTpub3dyYXB9Ci5iLm9re2JhY2tncm91bmQ6dmFyKC0tb2stc29mdCk7Y29sb3I6dmFy',
  'KC0tb2spfQouYi53YXJue2JhY2tncm91bmQ6dmFyKC0td2Fybi1zb2Z0KTtjb2xvcjp2YXIoLS13YXJuKX0KLmIuZGdye2JhY2tncm91bmQ6dmFyKC0tZGFuZ2VyLXNvZnQpO2NvbG9yOnZhcigtLWRhbmdlcil9Ci5iLmluZm97YmFja2dyb3VuZDp2YXIoLS1pbmZv',
  'LXNvZnQpO2NvbG9yOnZhcigtLWluZm8pfQoudCB0ci5hZGogdGR7YmFja2dyb3VuZDp2YXIoLS1pbmZvLXNvZnQpfQovKiDguJvguYnguLLguKLguJfguLXguYjguILguYnguK3guITguKfguLLguKHguKLguLLguKfguYTguJTguYkgKOC4iuC4t+C5iOC4reC4geC5',
  'ieC4reC4meC4q+C4meC4teC5iSkg4LmD4Lir4LmJ4LiV4Lix4LiU4LiC4Li24LmJ4LiZ4Lia4Lij4Lij4LiX4Lix4LiU4LmD4Lir4Lih4LmI4LmB4LiX4LiZ4LiB4Liy4Lij4Lil4LmJ4LiZ4LiC4Lit4Lia4LiB4Liy4Lij4LmM4LiUICovCi5iLndyYXB7d2hpdGUt',
  'c3BhY2U6bm9ybWFsO2Rpc3BsYXk6aW5saW5lLWJsb2NrO21heC13aWR0aDoxMDAlO2JvcmRlci1yYWRpdXM6MTBweDtsaW5lLWhlaWdodDoxLjQ1O292ZXJmbG93LXdyYXA6YW55d2hlcmV9Ci5iLm11dGV7YmFja2dyb3VuZDp2YXIoLS1saW5lLTIpO2NvbG9yOnZh',
  'cigtLW11dGVkKX0KCi8qID09PT09PT09PT09PSByb29tIGdyaWQgPT09PT09PT09PT09ICovCi5mbG9vcnN7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtnYXA6MTJweH0KLmZsb29ye2Rpc3BsYXk6ZmxleDtnYXA6MTJweDthbGlnbi1pdGVtczpm',
  'bGV4LXN0YXJ0fQouZmxvb3ItdGFnewogIGZsZXg6MCAwIDYycHg7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpO2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTsKICBwYWRkaW5nOjhweDt0ZXh0LWFsaWduOmNl',
  'bnRlcjtmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLW11dGVkKTsKfQouZmxvb3ItdGFnIGJ7ZGlzcGxheTpibG9jaztmb250LXNpemU6MTdweDtjb2xvcjp2YXIoLS1pbmspfQoucm9vbXN7ZGlzcGxheTpncmlkO2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBl',
  'YXQoYXV0by1maWxsLG1pbm1heCgxMjZweCwxZnIpKTtnYXA6OHB4O2ZsZXg6MX0KLnJvb217CiAgYm9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpO2JvcmRlci1yYWRpdXM6dmFyKC0tci1zbSk7cGFkZGluZzo5cHgg',
  'MTBweDsKICBjdXJzb3I6cG9pbnRlcjt0cmFuc2l0aW9uOnRyYW5zZm9ybSAuMXMsYm94LXNoYWRvdyAuMTVzLGJvcmRlci1jb2xvciAuMTVzO3Bvc2l0aW9uOnJlbGF0aXZlO292ZXJmbG93OmhpZGRlbjsKfQoucm9vbTpob3Zlcnt0cmFuc2Zvcm06dHJhbnNsYXRl',
  'WSgtMXB4KTtib3gtc2hhZG93OnZhcigtLXNoLWxnKTtib3JkZXItY29sb3I6dmFyKC0tYnJhbmQpfQoucm9vbSAubm97Zm9udC13ZWlnaHQ6NjAwO2ZvbnQtc2l6ZToxNS41cHg7bGV0dGVyLXNwYWNpbmc6MDtmb250LWZhbWlseTp2YXIoLS1mb250LWRpc3BsYXkp',
  'O2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtc30KLnJvb20gLnN0e2ZvbnQtc2l6ZToxMXB4O2NvbG9yOnZhcigtLW11dGVkKTttYXJnaW4tdG9wOjJweDtsaW5lLWhlaWdodDoxLjN9Ci5yb29tIC5kb3R7cG9zaXRpb246YWJzb2x1dGU7dG9wOjlweDty',
  'aWdodDo5cHg7d2lkdGg6OHB4O2hlaWdodDo4cHg7Ym9yZGVyLXJhZGl1czo5OXB4O2JhY2tncm91bmQ6dmFyKC0tbGluZSl9Ci5yb29tLnMtb2sgLmRvdHtiYWNrZ3JvdW5kOnZhcigtLW9rKX0gLnJvb20ucy13YXJuIC5kb3R7YmFja2dyb3VuZDp2YXIoLS13YXJu',
  'KX0KLnJvb20ucy1kZ3IgLmRvdHtiYWNrZ3JvdW5kOnZhcigtLWRhbmdlcil9IC5yb29tLnMtaW5mbyAuZG90e2JhY2tncm91bmQ6dmFyKC0taW5mbyl9Ci5yb29tLnMtb2t7Ym9yZGVyLWxlZnQ6M3B4IHNvbGlkIHZhcigtLW9rKX0gLnJvb20ucy13YXJue2JvcmRl',
  'ci1sZWZ0OjNweCBzb2xpZCB2YXIoLS13YXJuKX0KLnJvb20ucy1kZ3J7Ym9yZGVyLWxlZnQ6M3B4IHNvbGlkIHZhcigtLWRhbmdlcil9IC5yb29tLnMtaW5mb3tib3JkZXItbGVmdDozcHggc29saWQgdmFyKC0taW5mbyl9CgovKiA9PT09PT09PT09PT0gYWxlcnRz',
  'IC8gbGlzdCA9PT09PT09PT09PT0gKi8KLmFsaXN0e2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW59Ci5hbGl7ZGlzcGxheTpmbGV4O2dhcDoxMXB4O3BhZGRpbmc6MTFweCAxNnB4O2JvcmRlci1ib3R0b206MXB4IHNvbGlkIHZhcigtLWxpbmUtMik7',
  'Y3Vyc29yOnBvaW50ZXJ9Ci5hbGk6bGFzdC1jaGlsZHtib3JkZXItYm90dG9tOjB9Ci5hbGk6aG92ZXJ7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpfQouYWxpIC5pY3tmb250LXNpemU6MTZweDtsaW5lLWhlaWdodDoxLjN9Ci5hbGkgLnR0e2ZvbnQtd2VpZ2h0',
  'OjYwMDtmb250LXNpemU6MTNweH0KLmFsaSAuZGR7Zm9udC1zaXplOjEycHg7Y29sb3I6dmFyKC0tbXV0ZWQpO21hcmdpbi10b3A6MXB4fQouYWxpLmwtZGFuZ2VyIC50dHtjb2xvcjp2YXIoLS1kYW5nZXIpfSAuYWxpLmwtd2FybiAudHR7Y29sb3I6dmFyKC0td2Fy',
  'bil9CgovKiA9PT09PT09PT09PT0gbWVkaWEgLyB0aHVtYnMgPT09PT09PT09PT09ICovCi50aHVtYnN7ZGlzcGxheTpmbGV4O2dhcDo1cHg7ZmxleC13cmFwOndyYXB9Ci50aHVtYnsKICB3aWR0aDo0NHB4O2hlaWdodDo0NHB4O2JvcmRlci1yYWRpdXM6NnB4O2Jv',
  'cmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7b2JqZWN0LWZpdDpjb3ZlcjsKICBiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTpibG9jazsKfQoudGh1bWIuYmlne3dpZHRoOjkycHg7aGVpZ2h0OjkycHh9Ci5maWxlLWRy',
  'b3B7CiAgYm9yZGVyOjEuNXB4IGRhc2hlZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXItc20pO3BhZGRpbmc6MTRweDt0ZXh0LWFsaWduOmNlbnRlcjsKICBjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC1zaXplOjEyLjVweDtjdXJzb3I6cG9pbnRlcjti',
  'YWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Cn0KLmZpbGUtZHJvcDpob3Zlcntib3JkZXItY29sb3I6dmFyKC0tYnJhbmQpO2NvbG9yOnZhcigtLWJyYW5kKX0KCi8qID09PT09PT09PT09PSBtb2RhbCA9PT09PT09PT09PT0gKi8KLm92e3Bvc2l0aW9uOmZpeGVk',
  'O2luc2V0OjA7YmFja2dyb3VuZDpyZ2JhKDE2LDI0LDQwLC41NSk7YmFja2Ryb3AtZmlsdGVyOmJsdXIoM3B4KTt6LWluZGV4OjEwMDtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6ZmxleC1zdGFydDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO3BhZGRpbmc6MjRweCAx',
  'NnB4O292ZXJmbG93LXk6YXV0b30KLm1vZGFse2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7Ym9yZGVyLXJhZGl1czoxNHB4O2JveC1zaGFkb3c6dmFyKC0tc2gtbGcpO3dpZHRoOjEwMCU7bWF4LXdpZHRoOjY2MHB4O21hcmdpbjphdXRvIDA7YW5pbWF0aW9uOnBv',
  'cCAuMTZzIGVhc2Utb3V0fQoubW9kYWwud2lkZXttYXgtd2lkdGg6OTYwcHh9CkBrZXlmcmFtZXMgcG9we2Zyb217b3BhY2l0eTowO3RyYW5zZm9ybTp0cmFuc2xhdGVZKC04cHgpIHNjYWxlKC45ODUpfXRve29wYWNpdHk6MTt0cmFuc2Zvcm06bm9uZX19Ci5tb2Rh',
  'bC1oe3BhZGRpbmc6MTZweCAxOHB4O2JvcmRlci1ib3R0b206MXB4IHNvbGlkIHZhcigtLWxpbmUpO2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjEwcHh9Ci5tb2RhbC1oIGgze21hcmdpbjowO2ZvbnQtc2l6ZToxNS41cHg7Zm9udC13ZWlnaHQ6',
  'NjAwO2ZvbnQtZmFtaWx5OnZhcigtLWZvbnQtZGlzcGxheSl9Ci5tb2RhbC1ie3BhZGRpbmc6MThweDttYXgtaGVpZ2h0Om1pbig3MHZoLDcwMHB4KTtvdmVyZmxvdy15OmF1dG99Ci5tb2RhbC1me3BhZGRpbmc6MTRweCAxOHB4O2JvcmRlci10b3A6MXB4IHNvbGlk',
  'IHZhcigtLWxpbmUpO2Rpc3BsYXk6ZmxleDtnYXA6OHB4O2p1c3RpZnktY29udGVudDpmbGV4LWVuZDtmbGV4LXdyYXA6d3JhcH0KLnh7bWFyZ2luLWxlZnQ6YXV0bztiYWNrZ3JvdW5kOjA7Ym9yZGVyOjA7Zm9udC1zaXplOjIwcHg7Y29sb3I6dmFyKC0tbXV0ZWQp',
  'O2N1cnNvcjpwb2ludGVyO2xpbmUtaGVpZ2h0OjE7cGFkZGluZzoycHggNnB4O2JvcmRlci1yYWRpdXM6NnB4fQoueDpob3ZlcntiYWNrZ3JvdW5kOnZhcigtLWxpbmUtMik7Y29sb3I6dmFyKC0taW5rKX0KCi5mZ3JpZHtkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0',
  'ZS1jb2x1bW5zOnJlcGVhdCgyLG1pbm1heCgwLDFmcikpO2dhcDoxM3B4fQouZntkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2dhcDo1cHh9Ci5mLmZ1bGx7Z3JpZC1jb2x1bW46MS8tMX0KLmYgbGFiZWx7Zm9udC1zaXplOjEycHg7Y29sb3I6dmFy',
  'KC0taW5rLTIpO2ZvbnQtd2VpZ2h0OjYwMH0KLmYgLmhpbnR7Zm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1mYWludCl9CgovKiA9PT09PT09PT09PT0gbWlzYyA9PT09PT09PT09PT0gKi8KLmVtcHR5e3BhZGRpbmc6NDBweCAyMHB4O3RleHQtYWxpZ246Y2Vu',
  'dGVyO2NvbG9yOnZhcigtLW11dGVkKX0KLmVtcHR5IC5iaWd7Zm9udC1zaXplOjM0cHg7bWFyZ2luLWJvdHRvbTo4cHg7b3BhY2l0eTouNn0KLnNwaW57ZGlzcGxheTppbmxpbmUtYmxvY2s7d2lkdGg6MTVweDtoZWlnaHQ6MTVweDtib3JkZXI6MnB4IHNvbGlkIHZh',
  'cigtLWxpbmUpO2JvcmRlci10b3AtY29sb3I6dmFyKC0tYnJhbmQpO2JvcmRlci1yYWRpdXM6OTlweDthbmltYXRpb246c3AgLjdzIGxpbmVhciBpbmZpbml0ZTt2ZXJ0aWNhbC1hbGlnbjotMnB4fQpAa2V5ZnJhbWVzIHNwe3Rve3RyYW5zZm9ybTpyb3RhdGUoMzYw',
  'ZGVnKX19Ci50b2FzdHsKICBwb3NpdGlvbjpmaXhlZDtsZWZ0OjUwJTtib3R0b206MjRweDt0cmFuc2Zvcm06dHJhbnNsYXRlWCgtNTAlKTt6LWluZGV4OjIwMDsKICBiYWNrZ3JvdW5kOnZhcigtLW5hdik7Y29sb3I6I2ZmZjtwYWRkaW5nOjEwcHggMThweDtib3Jk',
  'ZXItcmFkaXVzOjk5cHg7Zm9udC1zaXplOjEzcHg7CiAgYm94LXNoYWRvdzp2YXIoLS1zaC1sZyk7YW5pbWF0aW9uOnVwIC4ycyBlYXNlLW91dDttYXgtd2lkdGg6OTB2dzsKfQoudG9hc3QuZXJye2JhY2tncm91bmQ6dmFyKC0tZGFuZ2VyKX0KLnRvYXN0Lm9re2Jh',
  'Y2tncm91bmQ6dmFyKC0tb2spfQpAa2V5ZnJhbWVzIHVwe2Zyb217b3BhY2l0eTowO3RyYW5zZm9ybTp0cmFuc2xhdGUoLTUwJSwxMHB4KX10b3tvcGFjaXR5OjE7dHJhbnNmb3JtOnRyYW5zbGF0ZSgtNTAlLDApfX0KLm11dGVke2NvbG9yOnZhcigtLW11dGVkKX0g',
  'LmZhaW50e2NvbG9yOnZhcigtLWZhaW50KX0KLmZzMTJ7Zm9udC1zaXplOjEycHh9IC5mczEze2ZvbnQtc2l6ZToxM3B4fQoubW9ub3tmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXN9Ci5tdDh7bWFyZ2luLXRvcDo4cHh9IC5tdDEye21hcmdpbi10b3A6',
  'MTJweH0gLm10MTZ7bWFyZ2luLXRvcDoxNnB4fSAubWI4e21hcmdpbi1ib3R0b206OHB4fSAubWIxMnttYXJnaW4tYm90dG9tOjEycHh9Ci5yb3d7ZGlzcGxheTpmbGV4O2dhcDo4cHg7YWxpZ24taXRlbXM6Y2VudGVyO2ZsZXgtd3JhcDp3cmFwfQouc3B7bWFyZ2lu',
  'LWxlZnQ6YXV0b30KLmhye2hlaWdodDoxcHg7YmFja2dyb3VuZDp2YXIoLS1saW5lLTIpO21hcmdpbjoxNHB4IDB9Ci5jbGlwe292ZXJmbG93OmhpZGRlbjt0ZXh0LW92ZXJmbG93OmVsbGlwc2lzO2Rpc3BsYXk6LXdlYmtpdC1ib3g7LXdlYmtpdC1saW5lLWNsYW1w',
  'OjI7LXdlYmtpdC1ib3gtb3JpZW50OnZlcnRpY2FsfQoKLyogYmFyIGNoYXJ0ICovCi5iYXJze2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47Z2FwOjlweH0KLmJhci1yb3d7ZGlzcGxheTpncmlkO2dyaWQtdGVtcGxhdGUtY29sdW1uczptaW5tYXgo',
  'OTBweCwxNTBweCkgMWZyIGF1dG87Z2FwOjEwcHg7YWxpZ24taXRlbXM6Y2VudGVyO2ZvbnQtc2l6ZToxMi41cHh9Ci5iYXItdHJhY2t7aGVpZ2h0OjhweDtiYWNrZ3JvdW5kOnZhcigtLWxpbmUtMik7Ym9yZGVyLXJhZGl1czo5OXB4O292ZXJmbG93OmhpZGRlbn0K',
  'LmJhci1maWxse2hlaWdodDoxMDAlO2JhY2tncm91bmQ6dmFyKC0tYnJhbmQpO2JvcmRlci1yYWRpdXM6OTlweDt0cmFuc2l0aW9uOndpZHRoIC41c30KLmJhci1yb3cgLnZ7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zO2NvbG9yOnZhcigtLWluay0y',
  'KTtmb250LXdlaWdodDo2MDA7d2hpdGUtc3BhY2U6bm93cmFwfQoKLyogdGltZWxpbmUgKi8KLnRse3Bvc2l0aW9uOnJlbGF0aXZlO3BhZGRpbmctbGVmdDoyMnB4fQoudGw6YmVmb3Jle2NvbnRlbnQ6Jyc7cG9zaXRpb246YWJzb2x1dGU7bGVmdDo2cHg7dG9wOjZw',
  'eDtib3R0b206NnB4O3dpZHRoOjJweDtiYWNrZ3JvdW5kOnZhcigtLWxpbmUpfQoudGwtaXtwb3NpdGlvbjpyZWxhdGl2ZTtwYWRkaW5nOjAgMCAxNnB4fQoudGwtaTpiZWZvcmV7Y29udGVudDonJztwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0Oi0yMHB4O3RvcDo1cHg7',
  'd2lkdGg6MTBweDtoZWlnaHQ6MTBweDtib3JkZXItcmFkaXVzOjk5cHg7YmFja2dyb3VuZDp2YXIoLS1icmFuZCk7Ym9yZGVyOjJweCBzb2xpZCB2YXIoLS1zdXJmYWNlKX0KLnRsLWkgLmR7Zm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1tdXRlZCl9Ci50bC1p',
  'IC50e2ZvbnQtd2VpZ2h0OjYwMDtmb250LXNpemU6MTNweH0KCi8qID09PT09PT09PT09PSByZXNwb25zaXZlID09PT09PT09PT09PSAqLwpAbWVkaWEgKG1heC13aWR0aDo5MDBweCl7CiAgLmc0e2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoMixtaW5tYXgo',
  'MCwxZnIpKX0KICAuZzN7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCgyLG1pbm1heCgwLDFmcikpfQp9Ci8qIOC5geC4l+C5h+C4muC5gOC4peC5h+C4lTog4LmA4Lih4LiZ4Li54LiC4LmJ4Liy4LiH4LiB4Li04LiZ4LiX4Li14LmI4LmE4Lib4LmA4LiB4Li3',
  '4Lit4Lia4Lir4LiZ4Li24LmI4LiH4LmD4LiZ4Liq4Liy4LihIOC4geC4suC4o+C5jOC4lOC4hOC4ueC5iOC4iOC4sOC5geC4hOC4muC4iOC4meC4leC4seC4p+C5gOC4peC4guC4reC4seC4lOC4geC4seC4mSDigJQg4Lin4Liy4LiH4LiX4Li14Lil4Liw4LmD4Lia',
  '4LmA4LiV4LmH4Lih4LiE4Lin4Liy4Lih4LiB4Lin4LmJ4Liy4LiH4LmB4LiX4LiZICovCkBtZWRpYSAobWluLXdpZHRoOjc2MXB4KSBhbmQgKG1heC13aWR0aDoxMDAwcHgpewogIC5nMntncmlkLXRlbXBsYXRlLWNvbHVtbnM6MWZyfQp9Ci8qIOC5geC4l+C5h+C4',
  'muC5gOC4peC5h+C4lS/guKvguJnguYnguLLguJXguYjguLLguIfguKLguYjguK06IOC5gOC4oeC4meC4ueC4guC5ieC4suC4h+C4ouC4seC4h+C4reC4ouC4ueC5iCDguJfguLXguYjguYDguKvguKXguLfguK3guYPguKvguYnguYHguJbguJrguKvguLHguKfguYDg',
  'uKXguKLguYHguITguJoKICAg4Lia4Li14Lia4LiK4LmI4Lit4LiH4LiE4LmJ4LiZ4Lir4Liy4Lil4LiH4Lir4LiZ4LmI4Lit4Lii4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4LiV4LiB4Lia4Lij4Lij4LiX4Lix4LiU4LiI4LiZ4LmB4LiW4Lia4Lir4Lix4Lin4Liq',
  '4Li54LiH4LiC4Li24LmJ4LiZ4Lit4Li14LiB4LmA4LiX4LmI4Liy4LiV4Lix4LinICovCkBtZWRpYSAobWF4LXdpZHRoOjEwNDBweCl7CiAgLnRvcC1yaWdodCAjc2VhcmNoQm94e3dpZHRoOjEzMnB4IWltcG9ydGFudH0KICAudG9wLXJpZ2h0ICN5ZWFyU2Vse21h',
  'eC13aWR0aDoxMzJweH0KICAvKiDguJXguLHguKfguJrguK3guIHguKrguJbguLLguJnguLDguYDguKvguKXguLfguK3guYHguJXguYjguYTguK3guITguK3guJkgKOC4guC5ieC4reC4hOC4p+C4suC4oeC4ouC4seC4h+C4reC5iOC4suC4meC5hOC4lOC5ieC4iOC4',
  'suC4geC4geC4suC4o+C4iuC4teC5ieC4hOC5ieC4suC4hykKICAgICDguIHguI7guYDguJTguLXguKLguKfguIHguLHguJrguJfguLXguYjguYPguIrguYnguJrguJnguKHguLfguK3guJbguLfguK3guK3guKLguLnguYjguYHguKXguYnguKcg4LmB4LiE4LmI4LiC',
  '4Lii4Lix4Lia4LmD4Lir4LmJ4LmA4Lij4Li04LmI4Lih4LmA4Lij4LmH4Lin4LiC4Li24LmJ4LiZICovCiAgLnN5bmMtcGlsbCAuc3luYy1sYWJlbHtkaXNwbGF5Om5vbmV9CiAgLnN5bmMtcGlsbHtwYWRkaW5nOjNweCA4cHh9Cn0KQG1lZGlhIChtYXgtd2lkdGg6',
  'NzYwcHgpewogIC5uYXZ7CiAgICBwb3NpdGlvbjpmaXhlZDtsZWZ0OjA7dG9wOjA7Ym90dG9tOjA7ei1pbmRleDo2MDt0cmFuc2Zvcm06dHJhbnNsYXRlWCgtMTAwJSk7CiAgICB0cmFuc2l0aW9uOnRyYW5zZm9ybSAuMjJzIGVhc2U7Ym94LXNoYWRvdzp2YXIoLS1z',
  'aC1sZyk7CiAgfQogIC5uYXYub3Blbnt0cmFuc2Zvcm06bm9uZX0KICAuYnVyZ2Vye2Rpc3BsYXk6aW5saW5lLWZsZXh9CiAgLmNvbnRlbnR7cGFkZGluZzoxNHB4IDE0cHggODBweH0KICAudG9we3BhZGRpbmc6MTBweCAxNHB4fQogIC5nMiwuZzMsLmc0e2dyaWQt',
  'dGVtcGxhdGUtY29sdW1uczoxZnJ9CiAgLmZncmlke2dyaWQtdGVtcGxhdGUtY29sdW1uczoxZnJ9CiAgLmZsb29ye2ZsZXgtZGlyZWN0aW9uOmNvbHVtbn0KICAuZmxvb3ItdGFne2ZsZXg6bm9uZTt3aWR0aDoxMDAlO2Rpc3BsYXk6ZmxleDtnYXA6OHB4O2FsaWdu',
  'LWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDt0ZXh0LWFsaWduOmxlZnR9CiAgLmZsb29yLXRhZyBie2ZvbnQtc2l6ZToxNHB4fQogIC5zY3JpbXtwb3NpdGlvbjpmaXhlZDtpbnNldDowO2JhY2tncm91bmQ6cmdiYSgwLDAsMCwuNDUpO3ot',
  'aW5kZXg6NTV9CiAgLm1vZGFsLWJ7bWF4LWhlaWdodDpub25lfQogIC5vdntwYWRkaW5nOjB9CiAgLm1vZGFse2JvcmRlci1yYWRpdXM6MDttaW4taGVpZ2h0OjEwMHZoO21heC13aWR0aDpub25lfQp9Ci8qID09PT09PT09PT09PSDguKvguJnguYnguLLguKXguYfg',
  'uK3guIHguK3guLTguJkgLyBQSU4gPT09PT09PT09PT09ICovCmJvZHkubG9ja2Vke292ZXJmbG93OmhpZGRlbn0KYm9keS5sb2NrZWQgLmFwcHtmaWx0ZXI6Ymx1cigzcHgpO3BvaW50ZXItZXZlbnRzOm5vbmU7dXNlci1zZWxlY3Q6bm9uZX0KLmF1dGgtd3JhcHsK',
  'ICBwb3NpdGlvbjpmaXhlZDtpbnNldDowO3otaW5kZXg6NjA7ZGlzcGxheTpncmlkO3BsYWNlLWl0ZW1zOmNlbnRlcjsKICBwYWRkaW5nOjI0cHg7YmFja2dyb3VuZDp2YXIoLS1iZyk7b3ZlcmZsb3cteTphdXRvOwp9Ci5hdXRoLWNhcmR7CiAgd2lkdGg6MTAwJTtt',
  'YXgtd2lkdGg6MzYwcHg7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlKTtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpOwogIGJvcmRlci1yYWRpdXM6MTZweDtib3gtc2hhZG93OnZhcigtLXNoLWxnKTtwYWRkaW5nOjI2cHggMjRweCAyMnB4Owp9Ci5hdXRoLWJy',
  'YW5ke2ZvbnQtc2l6ZToxNXB4O2NvbG9yOnZhcigtLW11dGVkKTttYXJnaW4tYm90dG9tOjE4cHg7dGV4dC1hbGlnbjpjZW50ZXJ9Ci5hdXRoLWJyYW5kIGJ7Y29sb3I6dmFyKC0taW5rKTtmb250LWZhbWlseTp2YXIoLS1mb250LWRpc3BsYXkpfQouYXV0aC1oe21h',
  'cmdpbjowIDAgNHB4O2ZvbnQtc2l6ZToyMHB4O2ZvbnQtd2VpZ2h0OjYwMDtmb250LWZhbWlseTp2YXIoLS1mb250LWRpc3BsYXkpO3RleHQtYWxpZ246Y2VudGVyfQouYXV0aC1zdWJ7bWFyZ2luOjAgMCAxOHB4O2ZvbnQtc2l6ZToxM3B4O2NvbG9yOnZhcigtLW11',
  'dGVkKTt0ZXh0LWFsaWduOmNlbnRlcjtsaW5lLWhlaWdodDoxLjZ9Ci5hdXRoLWZ7bWFyZ2luLWJvdHRvbToxM3B4fQouYXV0aC1mIGxhYmVse2Rpc3BsYXk6YmxvY2s7Zm9udC1zaXplOjEyLjVweDtjb2xvcjp2YXIoLS1pbmstMik7bWFyZ2luLWJvdHRvbTo1cHg7',
  'Zm9udC13ZWlnaHQ6NTAwfQouYXV0aC1mIC5pbnB7d2lkdGg6MTAwJTtwYWRkaW5nOjEwcHggMTJweDtmb250LXNpemU6MTVweH0KLmF1dGgtZ297d2lkdGg6MTAwJTtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO3BhZGRpbmc6MTFweDtmb250LXNpemU6MTQuNXB4O21h',
  'cmdpbi10b3A6NnB4fQouYXV0aC1hbHR7d2lkdGg6MTAwJTtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO21hcmdpbi10b3A6OXB4O2ZvbnQtc2l6ZToxM3B4fQouYXV0aC1lcnJ7CiAgYmFja2dyb3VuZDp2YXIoLS1kYW5nZXItc29mdCk7Y29sb3I6dmFyKC0tZGFuZ2Vy',
  'KTtib3JkZXItcmFkaXVzOnZhcigtLXItc20pOwogIHBhZGRpbmc6OXB4IDEycHg7Zm9udC1zaXplOjEyLjVweDttYXJnaW4tYm90dG9tOjE0cHg7bGluZS1oZWlnaHQ6MS41NTsKfQouYXV0aC1mb290e2ZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0tZmFpbnQp',
  'O3RleHQtYWxpZ246Y2VudGVyO21hcmdpbjoxNnB4IDAgMDtsaW5lLWhlaWdodDoxLjZ9CgovKiDguIjguLjguJQgNiDguIjguLjguJTguYHguJfguJkgUElOIOC4l+C4teC5iOC4geC4lOC5hOC4m+C5geC4peC5ieC4pyAqLwoucGluLWRvdHN7ZGlzcGxheTpmbGV4',
  'O2dhcDoxM3B4O2p1c3RpZnktY29udGVudDpjZW50ZXI7bWFyZ2luOjZweCAwIDIycHh9Ci5waW4tZG90cyBpewogIHdpZHRoOjEzcHg7aGVpZ2h0OjEzcHg7Ym9yZGVyLXJhZGl1czo5OXB4O2JhY2tncm91bmQ6dmFyKC0tbGluZSk7CiAgYm9yZGVyOjFweCBzb2xp',
  'ZCB2YXIoLS1saW5lKTt0cmFuc2l0aW9uOnRyYW5zZm9ybSAuMTJzLGJhY2tncm91bmQgLjEyczsKfQoucGluLWRvdHMgaS5vbntiYWNrZ3JvdW5kOnZhcigtLWJyYW5kKTtib3JkZXItY29sb3I6dmFyKC0tYnJhbmQpO3RyYW5zZm9ybTpzY2FsZSgxLjE2KX0KLnBp',
  'bi1kb3RzLmJ1c3l7b3BhY2l0eTouNX0KLnBpbi1kb3RzLnNoYWtle2FuaW1hdGlvbjpzaGFrZSAuNDJzfQpAa2V5ZnJhbWVzIHNoYWtlewogIDAlLDEwMCV7dHJhbnNmb3JtOnRyYW5zbGF0ZVgoMCl9IDIwJXt0cmFuc2Zvcm06dHJhbnNsYXRlWCgtOHB4KX0KICA0',
  'MCV7dHJhbnNmb3JtOnRyYW5zbGF0ZVgoOHB4KX0gNjAle3RyYW5zZm9ybTp0cmFuc2xhdGVYKC01cHgpfSA4MCV7dHJhbnNmb3JtOnRyYW5zbGF0ZVgoNXB4KX0KfQoucGluLXBhZHtkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCgzLDFm',
  'cik7Z2FwOjExcHh9Ci5waW4ta3sKICBhc3BlY3QtcmF0aW86MS8xO2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpO2NvbG9yOnZhcigtLWluayk7CiAgYm9yZGVyLXJhZGl1czoxNHB4O2ZvbnQtc2l6ZToyMXB4',
  'O2ZvbnQtd2VpZ2h0OjUwMDtjdXJzb3I6cG9pbnRlcjsKICBmb250LWZhbWlseTp2YXIoLS1mb250LWRpc3BsYXkpO2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtczsKICB0cmFuc2l0aW9uOmJhY2tncm91bmQgLjFzLHRyYW5zZm9ybSAuMDZzOwp9Ci5w',
  'aW4tazpob3ZlcntiYWNrZ3JvdW5kOnZhcigtLWJyYW5kLXNvZnQpO2JvcmRlci1jb2xvcjp2YXIoLS1icmFuZCl9Ci5waW4tazphY3RpdmV7dHJhbnNmb3JtOnNjYWxlKC45NCl9Ci5waW4tay5naG9zdHtiYWNrZ3JvdW5kOnRyYW5zcGFyZW50O2JvcmRlci1jb2xv',
  'cjp0cmFuc3BhcmVudDtmb250LXNpemU6MTdweDtjb2xvcjp2YXIoLS1tdXRlZCl9Ci5waW4tay5naG9zdDpob3ZlcntiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Ym9yZGVyLWNvbG9yOnZhcigtLWxpbmUpfQoKLyogPT09PT09PT09PT09IOC4leC4seC4p+C5',
  'gOC4peC4t+C4reC4geC4mOC4teC4oSA9PT09PT09PT09PT0gKi8KLnRoZW1lLXBpY2t7ZGlzcGxheTpncmlkO2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoMyxtaW5tYXgoMCwxZnIpKTtnYXA6MTBweH0KLnRoZW1lLW9wdHsKICBkaXNwbGF5OmZsZXg7Zmxl',
  'eC1kaXJlY3Rpb246Y29sdW1uO2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6NHB4O3RleHQtYWxpZ246Y2VudGVyOwogIHBhZGRpbmc6MTVweCAxMHB4O2JvcmRlcjoxLjVweCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXIpOwogIGJhY2tncm91',
  'bmQ6dmFyKC0tc3VyZmFjZS0yKTtjdXJzb3I6cG9pbnRlcjtjb2xvcjp2YXIoLS1pbmspO2ZvbnQ6aW5oZXJpdDsKICB0cmFuc2l0aW9uOmJvcmRlci1jb2xvciAuMTJzLGJhY2tncm91bmQgLjEyczsKfQoudGhlbWUtb3B0OmhvdmVye2JvcmRlci1jb2xvcjp2YXIo',
  'LS1icmFuZCl9Ci50aGVtZS1vcHQub257Ym9yZGVyLWNvbG9yOnZhcigtLWJyYW5kKTtiYWNrZ3JvdW5kOnZhcigtLWJyYW5kLXNvZnQpfQoudGhlbWUtb3B0IC5pY3tmb250LXNpemU6MjRweDtsaW5lLWhlaWdodDoxLjJ9Ci50aGVtZS1vcHQgYntmb250LXNpemU6',
  'MTMuNXB4fQoudGhlbWUtb3B0IC5oaW50e2ZvbnQtc2l6ZToxMXB4O2NvbG9yOnZhcigtLW11dGVkKTtsaW5lLWhlaWdodDoxLjQ1fQoud2Fybi10ZXh0e2NvbG9yOnZhcigtLXdhcm4pfQoKLyogPT09PT09PT09PT09IOC4nOC4peC4geC4suC4o+C4reC5iOC4suC4',
  'meC4guC5ieC4reC4hOC4p+C4suC4oeC4iOC4suC4geC4o+C4ueC4myA9PT09PT09PT09PT0gKi8KLyog4LmE4Liu4LmE4Lil4LiV4LmM4Liq4Lix4LmJ4LiZIOC5hiDguYPguKvguYnguYDguKvguYfguJnguKfguYjguLLguIrguYjguK3guIfguYTguKvguJnguYDg',
  'uJ7guLTguYjguIfguJbguLnguIHguYDguJXguLTguKHguIjguLLguIHguKPguLnguJsgKi8KLm9jci1maWxsZWR7CiAgYm9yZGVyLWNvbG9yOnZhcigtLWJyYW5kKSFpbXBvcnRhbnQ7CiAgYm94LXNoYWRvdzowIDAgMCAzcHggdmFyKC0tYnJhbmQtc29mdCkhaW1w',
  'b3J0YW50OwogIGFuaW1hdGlvbjpvY3JQb3AgLjRzOwp9CkBrZXlmcmFtZXMgb2NyUG9weyAwJXtiYWNrZ3JvdW5kOnZhcigtLWJyYW5kLXNvZnQpfSAxMDAle2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSl9IH0KCi5vY3ItYm94ewogIGJvcmRlcjoxcHggZGFzaGVk',
  'IHZhcigtLWJyYW5kKTtiYWNrZ3JvdW5kOnZhcigtLWJyYW5kLXNvZnQpOwogIGJvcmRlci1yYWRpdXM6dmFyKC0tci1zbSk7cGFkZGluZzoxMnB4O21hcmdpbi10b3A6MTBweDsKfQoub2NyLWJveCAuaGR7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtn',
  'YXA6N3B4O2ZvbnQtc2l6ZToxMi41cHg7Zm9udC13ZWlnaHQ6NjAwO2NvbG9yOnZhcigtLWJyYW5kKTttYXJnaW4tYm90dG9tOjlweH0KLm9jci1ib3ggLmhkIC5zcHttYXJnaW4tbGVmdDphdXRvO2Rpc3BsYXk6ZmxleDtnYXA6NnB4fQoub2NyLWhpdHN7ZGlzcGxh',
  'eTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtnYXA6NnB4fQoub2NyLWhpdHsKICBkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo5cHg7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlKTsKICBib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2Jv',
  'cmRlci1yYWRpdXM6dmFyKC0tci1zbSk7cGFkZGluZzo3cHggMTBweDtmb250LXNpemU6MTNweDsKfQoub2NyLWhpdCAua3tjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC1zaXplOjExLjVweDttaW4td2lkdGg6NzhweH0KLm9jci1oaXQgLnZ7Zm9udC13ZWlnaHQ6NjAw',
  'O2ZsZXg6MTttaW4td2lkdGg6MDtvdmVyZmxvdzpoaWRkZW47dGV4dC1vdmVyZmxvdzplbGxpcHNpczt3aGl0ZS1zcGFjZTpub3dyYXB9Ci5vY3ItcmF3ewogIG1heC1oZWlnaHQ6MTUwcHg7b3ZlcmZsb3c6YXV0bztiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpO2Jv',
  'cmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7CiAgYm9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTtwYWRkaW5nOjlweCAxMXB4O2ZvbnQtc2l6ZToxMnB4O2xpbmUtaGVpZ2h0OjEuNjU7CiAgd2hpdGUtc3BhY2U6cHJlLXdyYXA7Y29sb3I6dmFyKC0taW5rLTIpO21h',
  'cmdpbi10b3A6OXB4Owp9CgpAbWVkaWEgKG1heC13aWR0aDo1MjBweCl7CiAgLmF1dGgtY2FyZHttYXgtd2lkdGg6MTAwJTtwYWRkaW5nOjIycHggMThweCAxOHB4fQogIC50aGVtZS1waWNre2dyaWQtdGVtcGxhdGUtY29sdW1uczoxZnJ9CiAgLnRoZW1lLW9wdHtm',
  'bGV4LWRpcmVjdGlvbjpyb3c7dGV4dC1hbGlnbjpsZWZ0O2dhcDoxMXB4fQogIC50aGVtZS1vcHQgLmhpbnR7ZGlzcGxheTpub25lfQp9CgovKiA9PT09PT09PT09PT0g4Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4Lii4LmD4LiZ4Lia4Li04LilICjguIvguLfg',
  'uYnguK3guJfguLXguYDguJTguLXguKLguKfguKvguKXguLLguKLguK3guKLguYjguLLguIcpID09PT09PT09PT09PSAqLwoubGluZXN7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXItc20pO3BhZGRpbmc6MTBweDtiYWNr',
  'Z3JvdW5kOnZhcigtLXN1cmZhY2UtMil9Ci5saW5lLWhlYWQsLmxpbmUtcm93ewogIGRpc3BsYXk6Z3JpZDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6bWlubWF4KDAsMWZyKSA4NHB4IDkycHggMTA4cHggOTZweCAzNHB4OwogIGdhcDo3cHg7YWxpZ24taXRlbXM6Y2Vu',
  'dGVyOwp9Ci5saW5lLWhlYWR7Zm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1tdXRlZCk7cGFkZGluZzowIDJweCA2cHg7Zm9udC13ZWlnaHQ6NjAwfQoubGluZS1oZWFkIC5udW0sLmxpbmUtcm93IC5udW17dGV4dC1hbGlnbjpyaWdodH0KLmxpbmUtcm93e21h',
  'cmdpbi1ib3R0b206NnB4fQoubGluZS1yb3cgLmlucHtwYWRkaW5nOjZweCA5cHg7Zm9udC1zaXplOjEzcHh9Ci5saW5lLXJvdyAuaW5wLm51bXt0ZXh0LWFsaWduOnJpZ2h0O2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtc30KLmxpbmUtc3VtewogIHRl',
  'eHQtYWxpZ246cmlnaHQ7Zm9udC1zaXplOjEzcHg7Zm9udC13ZWlnaHQ6NjAwO2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtczsKICBjb2xvcjp2YXIoLS1pbmspO3doaXRlLXNwYWNlOm5vd3JhcDtvdmVyZmxvdzpoaWRkZW47Cn0KLmxpbmUtdG90YWx7',
  'bWFyZ2luLWxlZnQ6YXV0bztmb250LXNpemU6MTNweDtjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zfQoubGluZS10b3RhbCBie2NvbG9yOnZhcigtLWluayl9CgovKiDguKPguLLguKLguIHguLLguKPguKLguYjguK3g',
  'uKLguJfguLXguYjguIHguLLguIfguJTguLnguYPguJnguJXguLLguKPguLLguIcgKi8KLmJpbGwtbGluZXN7bWFyZ2luLXRvcDo2cHg7Ym9yZGVyLWxlZnQ6MnB4IHNvbGlkIHZhcigtLWxpbmUpO3BhZGRpbmctbGVmdDo5cHh9Ci5iaWxsLWxpbmV7CiAgZGlzcGxh',
  'eTpmbGV4O2dhcDo4cHg7Zm9udC1zaXplOjEycHg7Y29sb3I6dmFyKC0taW5rLTIpO3BhZGRpbmc6MXB4IDA7CiAgZm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zOwp9Ci5iaWxsLWxpbmUgLm5te2ZsZXg6MTttaW4td2lkdGg6MDtvdmVyZmxvdzpoaWRk',
  'ZW47dGV4dC1vdmVyZmxvdzplbGxpcHNpczt3aGl0ZS1zcGFjZTpub3dyYXB9Ci5iaWxsLWxpbmUgLnF0e2NvbG9yOnZhcigtLWZhaW50KTt3aGl0ZS1zcGFjZTpub3dyYXB9Ci5iaWxsLWxpbmUgLnR0e3doaXRlLXNwYWNlOm5vd3JhcDtmb250LXdlaWdodDo2MDB9',
  'Ci5iaWxsLWV4dHJhe2ZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0tbXV0ZWQpO21hcmdpbi10b3A6M3B4fQouYmlsbC10b2dnbGV7CiAgYmFja2dyb3VuZDowO2JvcmRlcjowO3BhZGRpbmc6MDttYXJnaW4tdG9wOjNweDtjdXJzb3I6cG9pbnRlcjtmb250Omlu',
  'aGVyaXQ7CiAgZm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1icmFuZCk7dGV4dC1hbGlnbjpsZWZ0Owp9Ci5iaWxsLXRvZ2dsZTpob3Zlcnt0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lfQoKQG1lZGlhIChtYXgtd2lkdGg6NjQwcHgpewogIC8qIOC4iOC4reC5',
  'geC4hOC4mjog4LiK4Li34LmI4Lit4Liq4Li04LiZ4LiE4LmJ4Liy4Lit4Lii4Li54LmI4Lia4Lij4Lij4LiX4Lix4LiU4Lia4LiZIOC4quC5iOC4p+C4meC4iOC4s+C4meC4p+C4mS/guKvguJnguYjguKfguKIv4Lij4Liy4LiE4LiyL+C4o+C4p+C4oSDguK3guKLg',
  'uLnguYjguJrguKPguKPguJfguLHguJTguYDguJTguLXguKLguKfguIHguLHguJnguILguYnguLLguIfguKXguYjguLLguIcKICAgICDguIjguLDguYTguJTguYnguYTguKHguYjguIHguLTguJnguJ7guLfguYnguJnguJfguLXguYjguYHguJnguKfguJXguLHguYng',
  'uIfguIjguJnguJXguYnguK3guIfguYDguKXguLfguYjguK3guJnguIjguK3guKLguLLguKfguYDguKfguKXguLLguIvguLfguYnguK3guILguK3guIfguKvguKXguLLguKLguK3guKLguYjguLLguIcgKi8KICAubGluZXN7cGFkZGluZzo4cHh9CiAgLmxpbmUtaGVh',
  'ZHtkaXNwbGF5Om5vbmV9CiAgLmxpbmUtcm93ewogICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOjU2cHggbWlubWF4KDAsMWZyKSA3MnB4IG1pbm1heCgwLDg2cHgpOwogICAgZ3JpZC10ZW1wbGF0ZS1hcmVhczonbmFtZSBuYW1lIG5hbWUgZGVsJyAncXR5IHVuaXQg',
  'cHJpY2Ugc3VtJzsKICAgIGdhcDo1cHg7cGFkZGluZzo4cHg7bWFyZ2luLWJvdHRvbTo4cHg7CiAgICBib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6dmFyKC0tci1zbSk7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlKTsKICB9CiAgLmxp',
  'bmUtcm93IC5pbnA6bnRoLW9mLXR5cGUoMSl7Z3JpZC1hcmVhOm5hbWV9CiAgLmxpbmUtcm93IC5pbnA6bnRoLW9mLXR5cGUoMil7Z3JpZC1hcmVhOnF0eTt0ZXh0LWFsaWduOmNlbnRlcn0KICAubGluZS1yb3cgLmlucDpudGgtb2YtdHlwZSgzKXtncmlkLWFyZWE6',
  'dW5pdH0KICAubGluZS1yb3cgLmlucDpudGgtb2YtdHlwZSg0KXtncmlkLWFyZWE6cHJpY2V9CiAgLmxpbmUtcm93IC5saW5lLXN1bXtncmlkLWFyZWE6c3VtO2FsaWduLXNlbGY6Y2VudGVyO2ZvbnQtc2l6ZToxMi41cHh9CiAgLmxpbmUtcm93IC5idG57Z3JpZC1h',
  'cmVhOmRlbDthbGlnbi1zZWxmOnN0YXJ0O2p1c3RpZnktc2VsZjplbmQ7d2lkdGg6MzRweDtwYWRkaW5nOjZweCAwfQogIC5saW5lLXJvdyAuaW5we3BhZGRpbmc6NnB4IDdweDtmb250LXNpemU6MTIuNXB4fQogIC5saW5lLXRvdGFse3dpZHRoOjEwMCU7bWFyZ2lu',
  'OjZweCAwIDA7dGV4dC1hbGlnbjpyaWdodH0KfQoKLyogPT09PT09PT09PT09IOC4leC4seC4p+C4muC4reC4geC4quC4luC4suC4meC4sOC4geC4suC4o+C4i+C4tOC4h+C4geC5jCAo4Lih4Li44Lih4LiC4Lin4Liy4Lia4LiZKSA9PT09PT09PT09PT0KICAg4LmA',
  '4LiH4Li14Lii4Lia4LmA4Lih4Li34LmI4Lit4LiX4Li44LiB4Lit4Lii4LmI4Liy4LiH4Lib4LiB4LiV4Li0IOC4iuC4seC4lOC5gOC4iOC4meC5gOC4oeC4t+C5iOC4reC4oeC4teC4reC4sOC5hOC4o+C4leC5ieC4reC4h+C4iOC4seC4lOC4geC4suC4owogICDg',
  'uJXguLHguKfguJfguLXguYjguIHguJTguYTguJTguYnguIjguLDguKLguIHguILguLbguYnguJnguYDguKXguYfguIHguJnguYnguK3guKLguJXguK3guJnguYDguK3guLLguYDguKHguLLguKrguYzguIrguLXguYkg4LmD4Lir4LmJ4Lij4Li54LmJ4Lin4LmI4Liy',
  '4LiB4LiU4LmE4LiU4LmJCi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovCi5zeW5jLXBpbGx7CiAgdHJhbnNpdGlvbjpiYWNrZ3JvdW5kIC4xNXMsY29sb3IgLjE1czsKICB3aGl0ZS1zcGFjZTpub3dyYXA7',
  'bGluZS1oZWlnaHQ6MS43Owp9Ci5zeW5jLXBpbGwgLnNwaW57d2lkdGg6MTFweDtoZWlnaHQ6MTFweDtib3JkZXItd2lkdGg6MnB4O3ZlcnRpY2FsLWFsaWduOi0xcHh9CmJ1dHRvbi5zeW5jLXBpbGx7cGFkZGluZzoycHggMTBweH0KYnV0dG9uLnN5bmMtcGlsbDpo',
  'b3ZlcntmaWx0ZXI6YnJpZ2h0bmVzcyguOTQpfQpidXR0b24uc3luYy1waWxsOmFjdGl2ZXt0cmFuc2Zvcm06dHJhbnNsYXRlWSgxcHgpfQovKiDguKrguJbguLLguJnguLDguJfguLXguYjguJXguYnguK3guIfguYPguKvguYnguJzguLnguYnguYPguIrguYnguIjg',
  'uLHguJTguIHguLLguKMg4LiB4Liw4Lie4Lij4Li04Lia4LmA4Lia4LiyIOC5hiDguYPguKvguYnguKrguLHguIfguYDguIHguJXguYDguKvguYfguJkg4LmB4LiV4LmI4LmE4Lih4LmI4Lij4Lia4LiB4Lin4LiZ4Liq4Liy4Lii4LiV4LiyICovCi5zeW5jLXBpbGwu',
  'd2Fybiwuc3luYy1waWxsLmRncnthbmltYXRpb246c3luY051ZGdlIDIuNHMgZWFzZS1pbi1vdXQgaW5maW5pdGV9CkBrZXlmcmFtZXMgc3luY051ZGdlezAlLDg4JSwxMDAle29wYWNpdHk6MX05NCV7b3BhY2l0eTouNTV9fQpAbWVkaWEgKHByZWZlcnMtcmVkdWNl',
  'ZC1tb3Rpb246cmVkdWNlKXsKICAuc3luYy1waWxsLndhcm4sLnN5bmMtcGlsbC5kZ3J7YW5pbWF0aW9uOm5vbmV9Cn0KQG1lZGlhIChtYXgtd2lkdGg6NzIwcHgpewogIC8qIOC4iOC4reC5geC4hOC4mjog4LmA4Lir4Lil4Li34Lit4LmB4LiV4LmI4LmE4Lit4LiE',
  '4Lit4LiZ4Lir4Lij4Li34Lit4Lin4LiH4Lir4Lih4Li44LiZIOC4m+C4o+C4sOC4q+C4ouC4seC4lOC4l+C4teC5iOC4muC4meC5geC4luC4muC4q+C4seC4pwogICAgIOC4guC5ieC4reC4hOC4p+C4suC4oeC4ouC4seC4h+C4reC5iOC4suC4meC5hOC4lOC5ieC4',
  'iOC4suC4geC4geC4suC4o+C5geC4leC4sOC4hOC5ieC4suC4hyAodGl0bGUpICovCiAgLnN5bmMtcGlsbCAuc3luYy1sYWJlbHtkaXNwbGF5Om5vbmV9CiAgLnN5bmMtcGlsbHtwYWRkaW5nOjNweCA4cHg7Zm9udC1zaXplOjEzcHh9Cn0KCi8qID09PT09PT09PT09',
  'PSDguIHguKPguLDguJTguLTguYjguIfguYHguIjguYnguIfguYDguJXguLfguK3guJkgKyDguIHguKXguYjguK3guIfguKPguLLguKLguIHguLLguKMgPT09PT09PT09PT09ICovCi5iZWxsLXdyYXB7cG9zaXRpb246cmVsYXRpdmU7ZGlzcGxheTppbmxpbmUtZmxl',
  'eH0KLmJ0bi5iZWxse3Bvc2l0aW9uOnJlbGF0aXZlO2ZvbnQtc2l6ZToxNXB4O2xpbmUtaGVpZ2h0OjF9Ci5iZWxsLWRvdHsKICBwb3NpdGlvbjphYnNvbHV0ZTt0b3A6LTVweDtyaWdodDotNXB4O21pbi13aWR0aDoxN3B4O2hlaWdodDoxN3B4O3BhZGRpbmc6MCA0',
  'cHg7CiAgYmFja2dyb3VuZDp2YXIoLS13YXJuKTtjb2xvcjojZmZmO2JvcmRlci1yYWRpdXM6OTlweDsKICBmb250LXNpemU6MTAuNXB4O2ZvbnQtd2VpZ2h0OjcwMDtsaW5lLWhlaWdodDoxN3B4O3RleHQtYWxpZ246Y2VudGVyOwogIGJveC1zaGFkb3c6MCAwIDAg',
  'MnB4IHZhcigtLXN1cmZhY2UpO2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtczsKfQouYmVsbC1kb3QudXJnZW50e2JhY2tncm91bmQ6dmFyKC0tZGFuZ2VyKX0KCi5ub3RpZnsKICBwb3NpdGlvbjphYnNvbHV0ZTt0b3A6Y2FsYygxMDAlICsgOHB4KTty',
  'aWdodDowO3otaW5kZXg6NzA7CiAgd2lkdGg6bWluKDM4MHB4LGNhbGMoMTAwdncgLSAzMnB4KSk7CiAgYmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlKTtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6dmFyKC0tcik7CiAgYm94LXNoYWRv',
  'dzp2YXIoLS1zaC1sZyk7b3ZlcmZsb3c6aGlkZGVuO2FuaW1hdGlvbjpwb3AgLjE0cyBlYXNlLW91dDsKfQoubm90aWYtaHsKICBkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo4cHg7cGFkZGluZzoxMXB4IDE0cHg7CiAgYm9yZGVyLWJvdHRvbTox',
  'cHggc29saWQgdmFyKC0tbGluZS0yKTtmb250LXNpemU6MTRweDsKfQoubm90aWYtaCAuc3B7bWFyZ2luLWxlZnQ6YXV0bztkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo3cHh9Ci5ub3RpZi1saXN0e21heC1oZWlnaHQ6bWluKDYwdmgsNDQwcHgp',
  'O292ZXJmbG93LXk6YXV0b30KLm5vdGlmLXNlY3sKICBwYWRkaW5nOjlweCAxNHB4IDRweDtmb250LXNpemU6MTEuNXB4O2ZvbnQtd2VpZ2h0OjYwMDtjb2xvcjp2YXIoLS1tdXRlZCk7CiAgYmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpO3Bvc2l0aW9uOnN0aWNr',
  'eTt0b3A6MDsKfQoubm90aWYtaXRlbXsKICBkaXNwbGF5OmJsb2NrO3dpZHRoOjEwMCU7dGV4dC1hbGlnbjpsZWZ0O2JhY2tncm91bmQ6MDtib3JkZXI6MDtjdXJzb3I6cG9pbnRlcjsKICBwYWRkaW5nOjlweCAxNHB4IDlweCAxN3B4O2JvcmRlci1sZWZ0OjNweCBz',
  'b2xpZCB0cmFuc3BhcmVudDtmb250OmluaGVyaXQ7Y29sb3I6aW5oZXJpdDsKICBib3JkZXItYm90dG9tOjFweCBzb2xpZCB2YXIoLS1saW5lLTIpOwp9Ci5ub3RpZi1pdGVtOmhvdmVye2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKX0KLm5vdGlmLWl0ZW0gLnR0',
  'e2ZvbnQtc2l6ZToxM3B4O2ZvbnQtd2VpZ2h0OjUwMDtjb2xvcjp2YXIoLS1pbmspO2xpbmUtaGVpZ2h0OjEuNDV9Ci5ub3RpZi1pdGVtIC5kZHtmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLW11dGVkKTttYXJnaW4tdG9wOjJweDtsaW5lLWhlaWdodDoxLjV9',
  'Ci5ub3RpZi1pdGVtLmwtZGFuZ2Vye2JvcmRlci1sZWZ0LWNvbG9yOnZhcigtLWRhbmdlcil9Ci5ub3RpZi1pdGVtLmwtd2Fybntib3JkZXItbGVmdC1jb2xvcjp2YXIoLS13YXJuKX0KLm5vdGlmLWl0ZW0ubC1pbmZve2JvcmRlci1sZWZ0LWNvbG9yOnZhcigtLWlu',
  'Zm8pfQoubm90aWYtbW9yZXsKICBkaXNwbGF5OmJsb2NrO3dpZHRoOjEwMCU7dGV4dC1hbGlnbjpsZWZ0O3BhZGRpbmc6N3B4IDE0cHggOXB4IDE3cHg7CiAgYmFja2dyb3VuZDowO2JvcmRlcjowO2N1cnNvcjpwb2ludGVyO2ZvbnQ6aW5oZXJpdDtmb250LXNpemU6',
  'MTJweDtjb2xvcjp2YXIoLS1icmFuZCk7CiAgYm9yZGVyLWJvdHRvbToxcHggc29saWQgdmFyKC0tbGluZS0yKTsKfQoubm90aWYtbW9yZTpob3Zlcnt0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lfQoubm90aWYtZW1wdHl7cGFkZGluZzoyNnB4IDE2cHg7dGV4dC1h',
  'bGlnbjpjZW50ZXI7Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtc2l6ZToxMy41cHg7bGluZS1oZWlnaHQ6MS43fQoubm90aWYtZW1wdHkgLmJpZ3tmb250LXNpemU6MzBweDttYXJnaW4tYm90dG9tOjZweH0KLm5vdGlmLWZ7CiAgcGFkZGluZzo5cHggMTRweDtib3Jk',
  'ZXItdG9wOjFweCBzb2xpZCB2YXIoLS1saW5lLTIpOwogIGZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0tZmFpbnQpO2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKTsKfQoKLyog4LiV4Lix4Lin4LmA4Lil4LiC4Lia4LiZ4LmA4Lih4LiZ4Li54LiL4LmJ4Liy',
  '4LiiIOKAlCDguYPguKvguYnguYDguJTguYjguJnguILguLbguYnguJnguYDguKHguLfguYjguK3guKHguLXguIfguLLguJnguITguYnguLLguIcgKi8KLm5hdi1pdGVtIC5iYWRnZXsKICBiYWNrZ3JvdW5kOnZhcigtLXdhcm4pO2NvbG9yOiNmZmY7Zm9udC13ZWln',
  'aHQ6NzAwO2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtczsKfQoubmF2LWl0ZW0ub24gLmJhZGdle2JhY2tncm91bmQ6cmdiYSgyNTUsMjU1LDI1NSwuMjgpO2NvbG9yOiNmZmZ9Ci8qIOC5gOC4q+C5h+C4meC5geC4peC5ieC4pzog4Lii4Lix4LiH4Lia',
  '4Lit4LiB4LiI4Liz4LiZ4Lin4LiZ4LiH4Liy4LiZ4LiE4LmJ4Liy4LiHIOC5geC4leC5iOC4iOC4suC4h+C4peC4hyDguYTguKHguYjguYDguKPguLXguKLguIHguKPguYnguK3guIfguITguKfguLLguKHguKrguJnguYPguIjguYDguJfguYjguLLguYDguKPguLfg',
  'uYjguK3guIfguYPguKvguKHguYggKi8KLm5hdi1pdGVtIC5iYWRnZS5zZWVue2JhY2tncm91bmQ6cmdiYSgyNTUsMjU1LDI1NSwuMTIpO2NvbG9yOnZhcigtLW5hdi1pbmspO2ZvbnQtd2VpZ2h0OjYwMH0KLm5hdi1pdGVtLm9uIC5iYWRnZS5zZWVue2JhY2tncm91',
  'bmQ6cmdiYSgyNTUsMjU1LDI1NSwuMik7Y29sb3I6I2ZmZn0KLnRhYiAuYmFkZ2Uuc2VlbntiYWNrZ3JvdW5kOnZhcigtLWxpbmUpO2NvbG9yOnZhcigtLW11dGVkKX0KLyog4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4LmA4Lie4Li04LmI4LiH4LmA4LiC4LmJ',
  '4Liy4Lih4Liy4LiV4Lix4LmJ4LiH4LmB4LiV4LmI4LmA4Lib4Li04LiU4LiU4Li54LiE4Lij4Lix4LmJ4LiH4LiB4LmI4Lit4LiZICovCi5ub3RpZi1pdGVtLmlzLW5ld3tiYWNrZ3JvdW5kOnZhcigtLWJyYW5kLXNvZnQpfQoubm90aWYtaXRlbS5pcy1uZXc6aG92',
  'ZXJ7YmFja2dyb3VuZDp2YXIoLS1icmFuZC1zb2Z0KTtmaWx0ZXI6YnJpZ2h0bmVzcyguOTgpfQoubmV3LWRvdHtkaXNwbGF5OmlubGluZS1ibG9jazt3aWR0aDo3cHg7aGVpZ2h0OjdweDtib3JkZXItcmFkaXVzOjk5cHg7YmFja2dyb3VuZDp2YXIoLS1icmFuZCk7',
  'bWFyZ2luLXJpZ2h0OjZweDt2ZXJ0aWNhbC1hbGlnbjoxcHh9CgpAbWVkaWEgKG1heC13aWR0aDo3MjBweCl7CiAgLm5vdGlmewogICAgcG9zaXRpb246Zml4ZWQ7dG9wOmF1dG87bGVmdDo4cHg7cmlnaHQ6OHB4O2JvdHRvbTo4cHg7d2lkdGg6YXV0bzsKICAgIG1h',
  'eC1oZWlnaHQ6NzJ2aDtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uOwogIH0KICAubm90aWYtbGlzdHtmbGV4OjE7bWF4LWhlaWdodDpub25lfQp9CgovKiA9PT09PT09PT09PT0g4LmA4LiK4LmH4LiE4Lil4Li04Liq4LiV4LmM4LiH4Liy4LiZ4LiL',
  '4LmI4Lit4LihID09PT09PT09PT09PSAqLwovKiAtLS0tIOC5g+C4meC4n+C4reC4o+C5jOC4oSAtLS0tICovCi50b2Rve2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTtwYWRkaW5nOjEwcHg7YmFja2dyb3VuZDp2',
  'YXIoLS1zdXJmYWNlLTIpfQoudG9kby1yb3d7CiAgZGlzcGxheTpncmlkO2dyaWQtdGVtcGxhdGUtY29sdW1uczozMHB4IG1pbm1heCgwLDFmcikgMTkwcHggMzRweDsKICBnYXA6N3B4O2FsaWduLWl0ZW1zOmNlbnRlcjttYXJnaW4tYm90dG9tOjZweDsKfQoudG9k',
  'by1yb3cgLmlucCwudG9kby1yb3cgLnNlbHtwYWRkaW5nOjZweCA5cHg7Zm9udC1zaXplOjEzcHh9Ci50b2RvLXJvdy5kb25lIC5pbnB7dGV4dC1kZWNvcmF0aW9uOmxpbmUtdGhyb3VnaDtjb2xvcjp2YXIoLS1tdXRlZCl9Ci50b2RvLWNoZWNre2Rpc3BsYXk6Zmxl',
  'eDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmNlbnRlcjtjdXJzb3I6cG9pbnRlcn0KLnRvZG8tY2hlY2sgaW5wdXR7d2lkdGg6MTdweDtoZWlnaHQ6MTdweDtjdXJzb3I6cG9pbnRlcjthY2NlbnQtY29sb3I6dmFyKC0tb2spfQoudG9kby1jb3Vu',
  'dHttYXJnaW4tbGVmdDphdXRvO2ZvbnQtc2l6ZToxM3B4O2NvbG9yOnZhcigtLW11dGVkKTtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXN9Ci50b2RvLWNvdW50IGJ7Y29sb3I6dmFyKC0taW5rKX0KCi8qIC0tLS0g4LmD4LiZ4LiV4Liy4Lij4Liy4LiH',
  '4Lij4Liy4Lii4LiB4Liy4LijICjguJXguLTguYrguIHguYTguJTguYnguIjguKPguLTguIcpIC0tLS0gKi8KLnRvZG8tdmlld3tkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2dhcDoycHh9Ci50b2RvLWJhcntoZWlnaHQ6NXB4O2JvcmRlci1yYWRp',
  'dXM6OTlweDtiYWNrZ3JvdW5kOnZhcigtLWxpbmUtMik7b3ZlcmZsb3c6aGlkZGVuO21hcmdpbi1ib3R0b206MnB4fQoudG9kby1iYXI+aXtkaXNwbGF5OmJsb2NrO2hlaWdodDoxMDAlO2JvcmRlci1yYWRpdXM6OTlweDtiYWNrZ3JvdW5kOnZhcigtLW9rKTt0cmFu',
  'c2l0aW9uOndpZHRoIC4zNXMgZWFzZX0KLnRvZG8tbWV0YXtmb250LXNpemU6MTFweDtjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zO21hcmdpbi1ib3R0b206M3B4fQoudG9kby1tZXRhIGJ7Y29sb3I6dmFyKC0taW5r',
  'KX0KLnRvZG8tbGluZXsKICBkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6ZmxleC1zdGFydDtnYXA6N3B4O2ZvbnQtc2l6ZToxM3B4O2xpbmUtaGVpZ2h0OjEuNTsKICBwYWRkaW5nOjJweCAwO2N1cnNvcjpwb2ludGVyOwp9Ci50b2RvLWxpbmUgaW5wdXR7bWFyZ2lu',
  'LXRvcDoycHg7d2lkdGg6MTVweDtoZWlnaHQ6MTVweDtmbGV4Om5vbmU7Y3Vyc29yOnBvaW50ZXI7YWNjZW50LWNvbG9yOnZhcigtLW9rKX0KLnRvZG8tbGluZSAubm17ZmxleDoxO21pbi13aWR0aDowO2NvbG9yOnZhcigtLWluayl9Ci50b2RvLWxpbmUgLmNhdHtm',
  'bGV4Om5vbmU7Zm9udC1zaXplOjEwLjVweDtwYWRkaW5nOjFweCA3cHh9Ci50b2RvLWxpbmUuZG9uZSAubm17dGV4dC1kZWNvcmF0aW9uOmxpbmUtdGhyb3VnaDtjb2xvcjp2YXIoLS1mYWludCl9Ci50b2RvLWxpbmUubG9ja2Vke2N1cnNvcjpkZWZhdWx0fQoudG9k',
  'by1saW5lOm5vdCgubG9ja2VkKTpob3ZlciAubm17Y29sb3I6dmFyKC0tYnJhbmQpfQoKQG1lZGlhIChtYXgtd2lkdGg6NjQwcHgpewogIC50b2RvLXJvd3sKICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczozMHB4IG1pbm1heCgwLDFmcikgMzRweDsKICAgIGdyaWQt',
  'dGVtcGxhdGUtYXJlYXM6J2NoayBuYW1lIGRlbCcgJy4gY2F0IGNhdCc7CiAgICBwYWRkaW5nOjhweDtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6dmFyKC0tci1zbSk7CiAgICBiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpO21hcmdp',
  'bi1ib3R0b206OHB4OwogIH0KICAudG9kby1jaGVja3tncmlkLWFyZWE6Y2hrO2FsaWduLXNlbGY6c3RhcnQ7cGFkZGluZy10b3A6NXB4fQogIC50b2RvLXJvdyAuaW5we2dyaWQtYXJlYTpuYW1lfQogIC50b2RvLXJvdyAuc2Vse2dyaWQtYXJlYTpjYXQ7d2lkdGg6',
  'MTAwJX0KICAudG9kby1yb3cgLmJ0bntncmlkLWFyZWE6ZGVsO2FsaWduLXNlbGY6c3RhcnQ7anVzdGlmeS1zZWxmOmVuZDt3aWR0aDozNHB4O3BhZGRpbmc6NnB4IDB9CiAgLnRvZG8tY291bnR7d2lkdGg6MTAwJTttYXJnaW46NnB4IDAgMDt0ZXh0LWFsaWduOnJp',
  'Z2h0fQp9CgoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4iOC4reC5geC4hOC4miAo4Lih4Li34Lit4LiW4Li34LitIC8g4LmB4LiX4LmH4Lia4LmA4Lil4LmH4LiV4LmB4LiZ',
  '4Lin4LiV4Lix4LmJ4LiHKQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4LmE4Lih4LmI4LmE4LiU4LmJ4LmB4Lii4LiB4LmE4Lif4Lil4LmM4Lir4Lij4Li34Lit4LmB4Lii4LiB',
  '4LmA4LiX4Lih4LmA4Lie4Lil4LiV4Liq4Liz4Lir4Lij4Lix4Lia4Lih4Li34Lit4LiW4Li34LitIOKAlCBIVE1MIOC4iuC4uOC4lOC5gOC4lOC4teC4ouC4p+C4geC4seC4meC4l+C4seC5ieC4h+C4q+C4oeC4lAogICDguJXguKPguIfguJnguLXguYnguYDguJvg',
  'uKXguLXguYjguKLguJnguYHguITguYggIuC4p+C4suC4h+C4leC4o+C4h+C5hOC4q+C4mSIg4LiC4LmJ4Lit4Lih4Li54LilIOC4m+C4uOC5iOC4oSDguJXguKPguKPguIHguLAg4LmD4LiK4LmJ4Lij4LmI4Lin4Lih4LiB4Lix4LiZ4Lir4Lih4LiUCiAgIOC4ouC5',
  'iOC4rS3guILguKLguLLguKLguKvguJnguYnguLLguJXguYjguLLguIfguJrguJnguITguK3guKHguIHguYfguKrguKXguLHguJrguYTguJTguYnguJfguLHguJnguJfguLUg4LmB4Lil4Liw4LmA4Lie4Li04LmI4Lih4Lif4Li14LmA4LiI4Lit4Lij4LmM4LiE4Lij',
  '4Lix4LmJ4LiH4LmA4LiU4Li14Lii4Lin4LmE4LiU4LmJ4LiX4Lix4LmJ4LiH4Liq4Lit4LiH4LmB4Lia4LiaCi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqLwpAbWVkaWEgKG1heC13aWR0',
  'aDo3NjBweCl7CgogIC8qIC0tLS0g4LmB4LiW4Lia4Lil4LmI4Liy4LiHOiDguJvguLjguYjguKHguK3guKLguLnguYjguKPguLDguJTguLHguJrguJnguLTguYnguKfguYLguJvguYnguIcg4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LmA4Lit4Li34LmJ4Lit4Lih4LmE',
  '4Lib4Lih4Li44Lih4LiL4LmJ4Liy4Lii4Lia4LiZIC0tLS0gKi8KICAudGFiYmFyewogICAgZGlzcGxheTpmbGV4O3Bvc2l0aW9uOmZpeGVkO2xlZnQ6MDtyaWdodDowO2JvdHRvbTowO3otaW5kZXg6NTA7CiAgICBiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpO2Jv',
  'cmRlci10b3A6MXB4IHNvbGlkIHZhcigtLWxpbmUpOwogICAgcGFkZGluZy1ib3R0b206ZW52KHNhZmUtYXJlYS1pbnNldC1ib3R0b20pOwogICAgYm94LXNoYWRvdzowIC0ycHggMTRweCByZ2JhKDE1LDIzLDQxLC4wNyk7CiAgfQogIC50YWJ7CiAgICBmbGV4OjEg',
  'MSAwO21pbi13aWR0aDowO21pbi1oZWlnaHQ6NTRweDtwYWRkaW5nOjdweCAycHggNnB4OwogICAgZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmNlbnRlcjtnYXA6M3B4OwogICAgYm9y',
  'ZGVyOjA7YmFja2dyb3VuZDowO2N1cnNvcjpwb2ludGVyO2NvbG9yOnZhcigtLW11dGVkKTsKICAgIGZvbnQtc2l6ZToxMC41cHg7bGluZS1oZWlnaHQ6MS4yO3Bvc2l0aW9uOnJlbGF0aXZlOwogIH0KICAudGFiIC5pY3tmb250LXNpemU6MThweDtsaW5lLWhlaWdo',
  'dDoxfQogIC50YWIgLnRse21heC13aWR0aDoxMDAlO292ZXJmbG93OmhpZGRlbjt0ZXh0LW92ZXJmbG93OmVsbGlwc2lzO3doaXRlLXNwYWNlOm5vd3JhcH0KICAudGFiLm9ue2NvbG9yOnZhcigtLWJyYW5kKTtmb250LXdlaWdodDo3MDB9CiAgLnRhYi5vbiAuaWN7',
  'dHJhbnNmb3JtOnRyYW5zbGF0ZVkoLTFweCl9CiAgLnRhYiAuYmFkZ2V7CiAgICBwb3NpdGlvbjphYnNvbHV0ZTt0b3A6M3B4O2xlZnQ6NTAlO21hcmdpbi1sZWZ0OjNweDsKICAgIGJhY2tncm91bmQ6dmFyKC0td2Fybik7Y29sb3I6I2ZmZjtib3JkZXItcmFkaXVz',
  'Ojk5cHg7CiAgICBtaW4td2lkdGg6MTZweDtoZWlnaHQ6MTZweDtwYWRkaW5nOjAgNHB4OwogICAgZm9udC1zaXplOjEwcHg7bGluZS1oZWlnaHQ6MTZweDtmb250LXdlaWdodDo3MDA7dGV4dC1hbGlnbjpjZW50ZXI7CiAgICBib3gtc2hhZG93OjAgMCAwIDJweCB2',
  'YXIoLS1zdXJmYWNlKTsKICB9CiAgLyog4LmA4Lin4LmJ4LiZ4LiX4Li14LmI4LmD4Lir4LmJ4LmB4LiW4Lia4Lil4LmI4Liy4LiHIOC5hOC4oeC5iOC5g+C4q+C5ieC4l+C4seC4muC5gOC4meC4t+C5ieC4reC4q+C4suC4muC4o+C4o+C4l+C4seC4lOC4quC4uOC4',
  'lOC4l+C5ieC4suC4oiAqLwogIC5jb250ZW50e3BhZGRpbmc6MTRweCAxNHB4IGNhbGMoNzRweCArIGVudihzYWZlLWFyZWEtaW5zZXQtYm90dG9tKSl9CiAgLnRhYmJhciB+IC5vdiwubmF2e3otaW5kZXg6NjB9CgogIC8qIC0tLS0g4LmB4LiW4Lia4Lir4Lix4Lin',
  'OiAyIOC5geC4luC4p+C4nuC4reC4lOC4tSDguYHguJrguJrguYHguK3guJvguKHguLfguK3guJbguLfguK3guJfguLHguYjguKfguYTguJsgKEdtYWlsLCBMSU5FLCBHb29nbGUgRHJpdmUpIC0tLS0KICAgICDguYHguJbguKcgMTog4piwIOC4iuC4t+C5iOC4reC4',
  'q+C4meC5ieC4siAuLi4uLi4uLiDguKrguJbguLLguJnguLAg8J+UlCDwn4yXIOKGuwogICAgIOC5geC4luC4pyAyOiBbIOC4hOC5ieC4meC4q+C4suC4l+C4seC5ieC4h+C4o+C4sOC4muC4miAuLi4uLi4uLi4uLi4gXSBbIOC4m+C4tSBdCiAgICAg4LmE4Lih4LmI',
  '4LmB4LiV4LiwIEhUTUwg4oCUIOC4m+C4peC5iOC4reC4ouC4m+C4uOC5iOC4oeC5g+C4mSAudG9wLXJpZ2h0IOC4reC4reC4geC4oeC4suC5gOC4o+C4teC4ouC4h+C5g+C4meC5geC4luC4muC4q+C4seC4p+C5guC4lOC4ouC4leC4o+C4hyDguYHguKXguYnguKfg',
  'uIjguLHguJTguKXguLPguJTguLHguJrguJTguYnguKfguKIgb3JkZXIgKi8KICAudG9we3BhZGRpbmc6NnB4IDEycHggOHB4O2dhcDo2cHg7cm93LWdhcDo3cHh9CiAgLnRvcCBoMXtmb250LXNpemU6MTZweDt3aGl0ZS1zcGFjZTpub3dyYXA7b3ZlcmZsb3c6aGlk',
  'ZGVuO3RleHQtb3ZlcmZsb3c6ZWxsaXBzaXN9CiAgLnRvcCAuc3Vie2Rpc3BsYXk6bm9uZX0gICAgICAgICAgLyog4LiE4Liz4Lit4LiY4Li04Lia4Liy4Lii4Lir4LiZ4LmJ4Liy4LmE4Lib4Lit4Lii4Li54LmI4LmD4LiZ4LmA4Lih4LiZ4Li54LiC4LmJ4Liy4LiH',
  '4LmB4Lil4LmJ4LinIOC5hOC4oeC5iOC4leC5ieC4reC4h+C4i+C5ieC4syAqLwogIC50b3AtcmlnaHR7ZGlzcGxheTpjb250ZW50c30KICAudG9wID4gLmJ1cmdlcntvcmRlcjoxfQogIC50b3AgPiBkaXY6bm90KC50b3AtcmlnaHQpe29yZGVyOjI7ZmxleDoxIDEg',
  'MDttaW4td2lkdGg6MH0KICAudG9wLXJpZ2h0ID4gKntvcmRlcjo2fQogICNsaXZlRG90LCNzYXZlU3RhdGV7b3JkZXI6M30KICAjYmVsbFdyYXB7b3JkZXI6NH0KICAjdGhlbWVCdG57b3JkZXI6NX0KICAudG9wOjphZnRlcntjb250ZW50OicnO29yZGVyOjc7Zmxl',
  'eC1iYXNpczoxMDAlO2hlaWdodDowfSAgIC8qIOC4guC4tuC5ieC4meC4muC4o+C4o+C4l+C4seC4lOC5g+C4q+C4oeC5iOC4leC4o+C4h+C4meC4teC5iSAqLwogIC50b3AtcmlnaHQgI3NlYXJjaEJveHtvcmRlcjo4O2ZsZXg6MSAxIDA7d2lkdGg6YXV0byFpbXBv',
  'cnRhbnQ7bWluLXdpZHRoOjB9CiAgLnRvcC1yaWdodCAjeWVhclNlbHtvcmRlcjo5O2ZsZXg6MCAwIGF1dG87bWF4LXdpZHRoOjQwdnc7d2lkdGg6YXV0b30KICAuYnVyZ2Vye3BhZGRpbmc6N3B4IDEwcHh9CiAgLyog4LiK4LmI4Lit4LiH4LiB4Lij4Lit4LiB4Lia',
  '4LiZ4LmB4LiW4Lia4Lir4Lix4Lin4LmA4LiV4Li14LmJ4Lii4Lil4LiHIOC5geC4leC5iOC4ouC4seC4h+C4hOC4hyAxNnB4IOC4geC4seC4mSBpT1Mg4LiL4Li54Lih4LmA4Lit4LiHICovCiAgLnRvcCAuaW5wLC50b3AgLnNlbHtwYWRkaW5nOjZweCAxMHB4fQog',
  'IC50b3AgLmJ0bi5pY29ue3BhZGRpbmc6NnB4IDlweH0KCiAgLyogLS0tLSDguJXguLHguKfguYDguKXguILguKrguKPguLjguJs6IDIg4LiK4LmI4Lit4LiH4LiV4LmI4Lit4LmB4LiW4LinIOC5hOC4oeC5iOC5g+C4iuC5iOC4iuC5iOC4reC4h+C5gOC4lOC4teC4',
  'ouC4p+C4iOC4meC4geC4tOC4meC4l+C4seC5ieC4h+C4iOC4rSAtLS0tICovCiAgLmc0LC5nM3tncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDIsbWlubWF4KDAsMWZyKSl9CiAgLmcye2dyaWQtdGVtcGxhdGUtY29sdW1uczoxZnJ9CiAgLmtwaXtwYWRkaW5n',
  'OjExcHggMTJweH0KICAua3BpIC52YWx7bGV0dGVyLXNwYWNpbmc6LS4zcHh9CiAgLmtwaSAubGJse2ZvbnQtc2l6ZToxMS41cHh9CiAgLmtwaSAuY2Fwe2ZvbnQtc2l6ZToxMXB4fQogIC5jYXJkLWJ7cGFkZGluZzoxM3B4fQogIC5jYXJkLWh7cGFkZGluZzoxMnB4',
  'IDEzcHh9CgogIC8qIC0tLS0g4LiV4Liy4Lij4Liy4LiHIC0+IOC4geC4suC4o+C5jOC4lOC4l+C4teC4peC4sOC4o+C4suC4ouC4geC4suC4oyAtLS0tCiAgICAg4LiK4Li34LmI4Lit4LiE4Lit4Lil4Lix4Lih4LiZ4LmM4Lih4Liy4LiI4Liy4LiBIGRhdGEtbGFi',
  'ZWwg4LiX4Li14LmIIGxhYmVsQ2VsbHMoKSDguJXguLTguJTguYTguKfguYnguYPguKvguYnguKvguKXguLHguIfguKfguLLguJTguKvguJnguYnguLIKICAgICDguIjguLbguIfguYPguIrguYnguYTguJTguYnguIHguLHguJrguJfguLjguIHguJXguLLguKPguLLg',
  'uIfguYPguJnguKPguLDguJrguJrguYLguJTguKLguYTguKHguYjguJXguYnguK3guIfguYHguIHguYnguJXguLLguKPguLLguIfguJfguLXguKXguLDguK3guLHguJkgKi8KICAudHd7b3ZlcmZsb3cteDp2aXNpYmxlfQogIC50e21pbi13aWR0aDowIWltcG9ydGFu',
  'dDtkaXNwbGF5OmJsb2NrO3dpZHRoOjEwMCU7Ym9yZGVyOjB9CiAgLnQgdGhlYWR7ZGlzcGxheTpub25lfQogIC50IHRib2R5e2Rpc3BsYXk6YmxvY2t9CiAgLnQgdGJvZHkgdHJ7CiAgICBkaXNwbGF5OmJsb2NrO2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7Ym9y',
  'ZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTsKICAgIGJvcmRlci1yYWRpdXM6dmFyKC0tci1zbSk7cGFkZGluZzo5cHggMTJweDttYXJnaW4tYm90dG9tOjhweDsKICB9CiAgLnQgdGJvZHkgdHI6bGFzdC1jaGlsZHttYXJnaW4tYm90dG9tOjB9CiAgLyog4LmB4LiV',
  '4LmI4Lil4Liw4LiK4LmI4Lit4LiHID0gMiDguITguK3guKXguLHguKHguJnguYw6IOC4iuC4t+C5iOC4reC4iuC5iOC4reC4hyB8IOC4hOC5iOC4siAo4LiE4LmI4Liy4Lir4Lil4Liy4Lii4Lia4Lij4Lij4LiX4Lix4LiU4LmA4Lij4Li14Lii4LiH4Lil4LiH4Lil',
  '4LmI4Liy4LiH4LmD4LiZ4LiE4Lit4Lil4Lix4Lih4LiZ4LmM4LiC4Lin4LiyIOC5hOC4oeC5iOC5gOC4muC4teC4ouC4lOC4geC4seC4meC5g+C4meC5geC4luC4p+C5gOC4lOC4teC4ouC4pykgKi8KICAudCB0Ym9keSB0ZHsKICAgIGRpc3BsYXk6Z3JpZDtncmlk',
  'LXRlbXBsYXRlLWNvbHVtbnM6MzYlIG1pbm1heCgwLDFmcik7Y29sdW1uLWdhcDoxMHB4O2FsaWduLWl0ZW1zOmJhc2VsaW5lOwogICAgcGFkZGluZzozcHggMDtib3JkZXI6MDt0ZXh0LWFsaWduOmxlZnQhaW1wb3J0YW50O3doaXRlLXNwYWNlOm5vcm1hbDsKICB9',
  'CiAgLnQgdGJvZHkgdGQ6bm90KFtkYXRhLWxhYmVsXSl7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOm1pbm1heCgwLDFmcil9CiAgLnQgdGJvZHkgdGQgPiAuY3Z7ZGlzcGxheTpibG9jazttaW4td2lkdGg6MH0gICAvKiDguITguYjguLLguJfguLHguYnguIfguIrguYjg',
  'uK3guIcgKGxhYmVsQ2VsbHMg4Lir4LmI4Lit4LmE4Lin4LmJKSDguYDguKPguLXguKLguIfguJXguLLguKHguJvguIHguJXguLTguYPguJnguITguK3guKXguLHguKHguJnguYzguILguKfguLIgKi8KICAudCB0Ym9keSB0ZDplbXB0eSwudCB0Ym9keSB0ZC5jZWxs',
  'LWVtcHR5e2Rpc3BsYXk6bm9uZX0KICAudCB0Ym9keSB0ZFtkYXRhLWxhYmVsXTo6YmVmb3JlewogICAgY29udGVudDphdHRyKGRhdGEtbGFiZWwpO2dyaWQtY29sdW1uOjE7bWluLXdpZHRoOjA7CiAgICBjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC1zaXplOjExLjVw',
  'eDtmb250LXdlaWdodDo1MDA7CiAgfQogIC50IHRib2R5IHRkLm51bXtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydH0KICAvKiDguIrguYjguK3guIfguJfguLXguYjguYDguJvguYfguJnguYDguIrguYfguITguKXguLTguKrguJXguYzguKLguLLguKc6IOC4iuC4',
  't+C5iOC4reC4iuC5iOC4reC4h+C4reC4ouC4ueC5iOC4muC4mSDguKPguLLguKLguIHguLLguKPguYDguJXguYfguKHguITguKfguLLguKHguIHguKfguYnguLLguIfguILguYnguLLguIfguKXguYjguLLguIcgKOC5hOC4oeC5iOC4muC4teC4muC5gOC4q+C4peC4',
  't+C4rSAyLzMg4LiC4Lit4LiH4LiB4Liy4Lij4LmM4LiUKSAqLwogIC50IHRib2R5IHRkOmhhcygudG9kby12aWV3KXtkaXNwbGF5OmJsb2NrfQogIC50IHRib2R5IHRkOmhhcygudG9kby12aWV3KTo6YmVmb3Jle2Rpc3BsYXk6YmxvY2s7bWFyZ2luLWJvdHRvbTo0',
  'cHh9CiAgLnQgdGJvZHkgdGQuY2VsbC1hY3Rpb25zewogICAgZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpmbGV4LWVuZDtnYXA6NnB4O3BhZGRpbmctdG9wOjlweDttYXJnaW4tdG9wOjZweDsKICAgIGJvcmRlci10b3A6MXB4IHNvbGlkIHZhcigtLWxpbmUt',
  'Mik7CiAgfQogIC50IHRib2R5IHRyLnJvdy13aWRlIHRke2Rpc3BsYXk6YmxvY2s7dGV4dC1hbGlnbjpjZW50ZXIhaW1wb3J0YW50fQogIC50IHRib2R5IHRyLnJvdy13aWRlIHRkOjpiZWZvcmV7Y29udGVudDpub25lfQoKICAvKiAtLS0tIOC4m+C4uOC5iOC4oeC4',
  'leC5ieC4reC4h+C4geC4lOC5guC4lOC4meC4lOC5ieC4p+C4ouC4meC4tOC5ieC4pyAtLS0tICovCiAgLmJ0bntwYWRkaW5nOjlweCAxNHB4fQogIC5idG4uc217cGFkZGluZzo3cHggMTFweDtmb250LXNpemU6MTNweH0KICAuYnRuLmljb257cGFkZGluZzo4cHgg',
  'MTBweH0KICAuY2hpcHtwYWRkaW5nOjdweCAxNHB4fQogIC5zZWwsLmlucHtwYWRkaW5nOjlweCAxMXB4O2ZvbnQtc2l6ZToxNnB4fSAgIC8qIDE2cHgg4LiB4Lix4LiZIGlPUyDguIvguLnguKHguYDguK3guIfguJXguK3guJnguYHguJXguLDguIrguYjguK3guIfg',
  'uIHguKPguK3guIEgKi8KICAudCAuYnRuLmljb257cGFkZGluZzo3cHggMTBweH0KCiAgLyogLS0tLSDguIHguKPguLLguJ86IOC5g+C4q+C5ieC5gOC4leC4teC5ieC4ouC4peC4h+C4q+C4meC5iOC4reC4oiDguIjguLDguYTguJTguYnguYTguKHguYjguIHguLTg',
  'uJnguJfguLHguYnguIfguIjguK0gLS0tLSAqLwogIC5jaGFydHttaW4td2lkdGg6NDYwcHh9CiAgLmNoYXJ0LXdyYXB7b3ZlcmZsb3cteDphdXRvOy13ZWJraXQtb3ZlcmZsb3ctc2Nyb2xsaW5nOnRvdWNofQoKICAvKiAtLS0tIOC4geC4peC5iOC4reC4h+C4i+C5',
  'ieC4reC4mTog4LmA4LiV4LmH4Lih4LiI4Lit4LmB4Lia4Lia4LmB4Lic4LmI4LiZ4LmA4Lil4Li34LmI4Lit4LiZ4LiC4Li24LmJ4LiZIOC4m+C4uOC5iOC4oeC4muC4seC4meC4l+C4tuC4geC4leC4tOC4lOC4guC4reC4muC4peC5iOC4suC4h+C5gOC4quC4oeC4',
  'rSAtLS0tICovCiAgLm1vZGFsLWZ7cG9zaXRpb246c3RpY2t5O2JvdHRvbTowO2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7CiAgICBwYWRkaW5nLWJvdHRvbTpjYWxjKDEycHggKyBlbnYoc2FmZS1hcmVhLWluc2V0LWJvdHRvbSkpfQp9CgovKiDguIjguK3guYDg',
  'uKXguYfguIHguKHguLLguIEgKOC5gOC4hOC4o+C4t+C5iOC4reC4h+C5gOC4peC5h+C4gSAvIOC4ouC5iOC4reC4q+C4meC5ieC4suC4leC5iOC4suC4h+C5geC4hOC4muC4quC4uOC4lCkgKi8KQG1lZGlhIChtYXgtd2lkdGg6NDAwcHgpewogIC50YWIgLnRse2Zv',
  'bnQtc2l6ZTo5LjVweH0KICAudCB0Ym9keSB0ZFtkYXRhLWxhYmVsXXtncmlkLXRlbXBsYXRlLWNvbHVtbnM6NDIlIG1pbm1heCgwLDFmcil9Cn0KCkBtZWRpYSBwcmludHsKICAubmF2LC50b3AtcmlnaHQsLmJ1cmdlciwudC1hY3Rpb25zLC5idG57ZGlzcGxheTpu',
  'b25lIWltcG9ydGFudH0KICAuYXBwe2Rpc3BsYXk6YmxvY2t9IGJvZHl7YmFja2dyb3VuZDojZmZmfQogIC5jYXJke2JyZWFrLWluc2lkZTphdm9pZDtib3gtc2hhZG93Om5vbmV9Cn0KCi8qID09PT09PT09PT09PSDguIrguYjguK3guIfguYDguKXguLfguK3guIHg',
  'uKrguJbguLLguJnguLDguYPguJnguJXguLLguKPguLLguIcgPT09PT09PT09PT09IC0tLS0tLS0tLS0tLS0tLS0tLS0tCiAgIOC4q+C4meC5ieC4suC4leC4suC5gOC4q+C4oeC4t+C4reC4meC4m+C5ieC4suC4ouC4quC4luC4suC4meC4sOC5gOC4lOC4tOC4oSDg',
  'uYHguJXguYjguIHguJTguYDguJvguKXguLXguYjguKLguJnguYTguJTguYnguYDguKXguKLguYTguKHguYjguJXguYnguK3guIfguYDguJvguLTguJTguJ/guK3guKPguYzguKEKICAg4LmD4LiK4LmJ4Liq4Li14LiK4Li44LiU4LmA4LiU4Li14Lii4Lin4LiB4Lix',
  '4LiaIC5iIOC5gOC4nuC4t+C5iOC4reC5g+C4q+C5ieC4leC4suC4o+C4suC4h+C4reC5iOC4suC4meC5gOC4q+C4oeC4t+C4reC4meC5gOC4lOC4tOC4oeC4l+C4uOC4geC4m+C4o+C4sOC4geC4suC4owotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0t',
  'LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqLwouc3Qtc2VsewogIC13ZWJraXQtYXBwZWFyYW5jZTpub25lO2FwcGVhcmFuY2U6bm9uZTsKICBib3JkZXI6MXB4IHNvbGlkIHRyYW5zcGFyZW50O2JvcmRlci1yYWRpdXM6OTlweDsKICBwYWRkaW5n',
  'OjNweCAyMnB4IDNweCAxMHB4O2ZvbnQtc2l6ZToxMnB4O2ZvbnQtd2VpZ2h0OjYwMDtsaW5lLWhlaWdodDoxLjU7CiAgY3Vyc29yOnBvaW50ZXI7bWF4LXdpZHRoOjEwMCU7CiAgYmFja2dyb3VuZC1yZXBlYXQ6bm8tcmVwZWF0O2JhY2tncm91bmQtcG9zaXRpb246',
  'cmlnaHQgN3B4IGNlbnRlcjtiYWNrZ3JvdW5kLXNpemU6OXB4OwogIGJhY2tncm91bmQtaW1hZ2U6dXJsKCJkYXRhOmltYWdlL3N2Zyt4bWw7Y2hhcnNldD11dGY4LCUzQ3N2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAx',
  'MCA2JyUzRSUzQ3BhdGggZD0nTTEgMWw0IDQgNC00JyBmaWxsPSdub25lJyBzdHJva2U9JyUyMzY2Nycgc3Ryb2tlLXdpZHRoPScxLjYnIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcvJTNFJTNDL3N2ZyUzRSIpOwp9Ci5zdC1zZWw6aG92ZXJ7Ym9yZGVyLWNvbG9yOnZh',
  'cigtLWxpbmUpfQouc3Qtc2VsOmZvY3Vze291dGxpbmU6bm9uZTtib3JkZXItY29sb3I6dmFyKC0tYnJhbmQpO2JveC1zaGFkb3c6MCAwIDAgM3B4IHZhcigtLWJyYW5kLXNvZnQpfQouc3Qtc2VsW2Rpc2FibGVkXXtvcGFjaXR5Oi41NTtjdXJzb3I6cHJvZ3Jlc3N9',
  'Ci5zdC1zZWwub2t7YmFja2dyb3VuZC1jb2xvcjp2YXIoLS1vay1zb2Z0KTtjb2xvcjp2YXIoLS1vayl9Ci5zdC1zZWwuaW5mb3tiYWNrZ3JvdW5kLWNvbG9yOnZhcigtLWluZm8tc29mdCk7Y29sb3I6dmFyKC0taW5mbyl9Ci5zdC1zZWwud2FybntiYWNrZ3JvdW5k',
  'LWNvbG9yOnZhcigtLXdhcm4tc29mdCk7Y29sb3I6dmFyKC0td2Fybil9Ci5zdC1zZWwuZGdye2JhY2tncm91bmQtY29sb3I6dmFyKC0tZGFuZ2VyLXNvZnQpO2NvbG9yOnZhcigtLWRhbmdlcil9Ci5zdC1zZWwubXV0ZXtiYWNrZ3JvdW5kLWNvbG9yOnZhcigtLXN1',
  'cmZhY2UtMik7Y29sb3I6dmFyKC0tbXV0ZWQpfQovKiDguIjguK3guYHguITguJo6IOC4geC4suC4o+C5jOC4lOC4l+C4teC4peC4sOC4o+C4suC4ouC4geC4suC4oyDguYPguKvguYnguIrguYjguK3guIfguJnguLXguYnguIHguJTguIfguYjguLLguKLguJTguYng',
  'uKfguKLguJnguLTguYnguKcgKi8KQG1lZGlhIChtYXgtd2lkdGg6NzYwcHgpewogIC5zdC1zZWx7cGFkZGluZzo3cHggMjZweCA3cHggMTJweDtmb250LXNpemU6MTNweH0KfQoKLyogPT09PT09PT09PT09IOC4m+C4j+C4tOC4l+C4tOC4meC4h+C4suC4meC4o+C4',
  'p+C4oSA9PT09PT09PT09PT0gKi8KLmNhbC10aXRsZXttYXJnaW46MDtmb250LXNpemU6MTdweDtmb250LWZhbWlseTp2YXIoLS1mb250LWRpc3BsYXkpO21pbi13aWR0aDoxNzBweDt0ZXh0LWFsaWduOmNlbnRlcn0KLmNhbHtkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1w',
  'bGF0ZS1jb2x1bW5zOnJlcGVhdCg3LG1pbm1heCgwLDFmcikpO2dhcDoxcHg7YmFja2dyb3VuZDp2YXIoLS1saW5lLTIpO2JvcmRlci1yYWRpdXM6dmFyKC0tcik7b3ZlcmZsb3c6aGlkZGVufQouY2FsLXdke2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKTtwYWRk',
  'aW5nOjdweCA0cHg7dGV4dC1hbGlnbjpjZW50ZXI7Zm9udC1zaXplOjExLjVweDtmb250LXdlaWdodDo2MDA7Y29sb3I6dmFyKC0tbXV0ZWQpfQouY2FsLWN7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlKTtib3JkZXI6MDttaW4taGVpZ2h0OjEwNHB4O3BhZGRpbmc6',
  'NnB4IDZweCA3cHg7dGV4dC1hbGlnbjpsZWZ0O2ZvbnQ6aW5oZXJpdDtjb2xvcjppbmhlcml0OwogIGRpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47Z2FwOjNweDtjdXJzb3I6cG9pbnRlcjttaW4td2lkdGg6MH0KLmNhbC1jLm9mZntiYWNrZ3JvdW5k',
  'OnZhcigtLXN1cmZhY2UtMik7Y3Vyc29yOmRlZmF1bHR9Ci5jYWwtYzpub3QoLm9mZik6aG92ZXJ7YmFja2dyb3VuZDp2YXIoLS1icmFuZC1zb2Z0KX0KLmNhbC1jOmZvY3VzLXZpc2libGV7b3V0bGluZToycHggc29saWQgdmFyKC0tYnJhbmQpO291dGxpbmUtb2Zm',
  'c2V0Oi0ycHh9Ci5jYWwtbntmb250LXNpemU6MTIuNXB4O2ZvbnQtd2VpZ2h0OjYwMDtjb2xvcjp2YXIoLS1pbmstMik7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zOwogIHdpZHRoOjI0cHg7aGVpZ2h0OjI0cHg7ZGlzcGxheTppbmxpbmUtZmxleDth',
  'bGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmNlbnRlcjtib3JkZXItcmFkaXVzOjk5cHh9Ci5jYWwtYy50b2RheSAuY2FsLW57YmFja2dyb3VuZDp2YXIoLS1icmFuZCk7Y29sb3I6dmFyKC0tYnJhbmQtaW5rKX0KLmNhbC1ldntkaXNwbGF5OmJsb2Nr',
  'O2ZvbnQtc2l6ZToxMXB4O2xpbmUtaGVpZ2h0OjEuMzU7cGFkZGluZzoycHggNnB4O2JvcmRlci1yYWRpdXM6NXB4OwogIHdoaXRlLXNwYWNlOm5vd3JhcDtvdmVyZmxvdzpoaWRkZW47dGV4dC1vdmVyZmxvdzplbGxpcHNpczttYXgtd2lkdGg6MTAwJX0KLmNhbC1l',
  'di5va3tiYWNrZ3JvdW5kOnZhcigtLW9rLXNvZnQpO2NvbG9yOnZhcigtLW9rKX0KLmNhbC1ldi5pbmZve2JhY2tncm91bmQ6dmFyKC0taW5mby1zb2Z0KTtjb2xvcjp2YXIoLS1pbmZvKX0KLmNhbC1ldi5kZ3J7YmFja2dyb3VuZDp2YXIoLS1kYW5nZXItc29mdCk7',
  'Y29sb3I6dmFyKC0tZGFuZ2VyKTtmb250LXdlaWdodDo2MDB9Ci5jYWwtbW9yZXtmb250LXNpemU6MTAuNXB4O2NvbG9yOnZhcigtLW11dGVkKTtwYWRkaW5nLWxlZnQ6NHB4fQouY2FsLWRvdHN7ZGlzcGxheTpub25lO2dhcDozcHg7YWxpZ24taXRlbXM6Y2VudGVy',
  'O2ZsZXgtd3JhcDp3cmFwfQouY2FsLWRvdHMgaXt3aWR0aDo3cHg7aGVpZ2h0OjdweDtib3JkZXItcmFkaXVzOjk5cHg7ZGlzcGxheTppbmxpbmUtYmxvY2t9Ci5jYWwtZG90cyBpLm9re2JhY2tncm91bmQ6dmFyKC0tb2spfSAuY2FsLWRvdHMgaS5pbmZve2JhY2tn',
  'cm91bmQ6dmFyKC0taW5mbyl9IC5jYWwtZG90cyBpLmRncntiYWNrZ3JvdW5kOnZhcigtLWRhbmdlcil9Ci5jYWwtZG90cyBlbXtmb250LXN0eWxlOm5vcm1hbDtmb250LXNpemU6MTBweDtjb2xvcjp2YXIoLS1tdXRlZCl9Ci5jYWwtYWdlbmRhe2Rpc3BsYXk6Zmxl',
  'eDtmbGV4LWRpcmVjdGlvbjpjb2x1bW59Ci5jYWwtZGF5e3BhZGRpbmc6MTBweCAxNHB4O2JvcmRlci1ib3R0b206MXB4IHNvbGlkIHZhcigtLWxpbmUtMil9Ci5jYWwtZGF5Omxhc3QtY2hpbGR7Ym9yZGVyLWJvdHRvbTowfQouY2FsLWRheS50b2RheXtiYWNrZ3Jv',
  'dW5kOnZhcigtLXN1cmZhY2UtMil9Ci5jYWwtZGF0ZXtmb250LXNpemU6MTIuNXB4O2ZvbnQtd2VpZ2h0OjYwMDtjb2xvcjp2YXIoLS1pbmstMik7bWFyZ2luLWJvdHRvbTo1cHh9Ci5jYWwtcm93e2Rpc3BsYXk6ZmxleDtnYXA6MTBweDthbGlnbi1pdGVtczpjZW50',
  'ZXI7d2lkdGg6MTAwJTt0ZXh0LWFsaWduOmxlZnQ7YmFja2dyb3VuZDowO2JvcmRlcjowOwogIHBhZGRpbmc6NnB4IDRweDtib3JkZXItcmFkaXVzOnZhcigtLXItc20pO2N1cnNvcjpwb2ludGVyO2ZvbnQ6aW5oZXJpdDtjb2xvcjppbmhlcml0O21pbi13aWR0aDow',
  'fQouY2FsLXJvdzpob3ZlcntiYWNrZ3JvdW5kOnZhcigtLWJyYW5kLXNvZnQpfQouY2FsLXJvdyAuaWN7ZmxleDpub25lO3dpZHRoOjIycHg7dGV4dC1hbGlnbjpjZW50ZXJ9Ci5jYWwtcm93IC50eHtmbGV4OjE7bWluLXdpZHRoOjA7ZGlzcGxheTpmbGV4O2ZsZXgt',
  'ZGlyZWN0aW9uOmNvbHVtbn0KLmNhbC1yb3cgLnR0e2ZvbnQtc2l6ZToxM3B4O2ZvbnQtd2VpZ2h0OjUwMDtvdmVyZmxvdy13cmFwOmFueXdoZXJlfQouY2FsLXJvdyAuZGR7Zm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1tdXRlZCk7b3ZlcmZsb3ctd3JhcDph',
  'bnl3aGVyZX0KLmNhbC1yb3cgLmJ7ZmxleDpub25lfQpAbWVkaWEgKG1heC13aWR0aDo3NjBweCl7CiAgLyog4LiI4Lit4LmB4LiE4LiaOiDguIrguYjguK3guIfguKfguLHguJnguYDguKvguKXguLfguK3guYDguKXguILguKfguLHguJnguIHguLHguJrguIjguLjg',
  'uJTguKrguLUg4Lij4Liy4Lii4Lil4Liw4LmA4Lit4Li14Lii4LiU4Lit4LmI4Liy4LiZ4LiI4Liy4LiB4Lij4Liy4Lii4LiB4Liy4Lij4LiC4LmJ4Liy4LiH4Lil4LmI4Liy4LiH4Lir4Lij4Li34Lit4LmB4LiV4Liw4LiX4Li14LmI4Lin4Lix4LiZICovCiAgLmNh',
  'bC1je21pbi1oZWlnaHQ6NTRweDtwYWRkaW5nOjRweCAzcHg7YWxpZ24taXRlbXM6Y2VudGVyfQogIC5jYWwtZXYsLmNhbC1tb3Jle2Rpc3BsYXk6bm9uZX0KICAuY2FsLWRvdHN7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpjZW50ZXJ9CiAgLmNhbC10aXRs',
  'ZXttaW4td2lkdGg6MDtmbGV4OjE7Zm9udC1zaXplOjE1LjVweH0KICAuY2FsLWRheXtwYWRkaW5nOjlweCAxMHB4fQp9CgovKiA9PT09PT09PT09PT0g4LiB4Lij4Liy4LifID09PT09PT09PT09PSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0K',
  'ICAg4LmA4Liq4LmJ4LiZ4LiV4Liy4Lij4Liy4LiH4LiB4Lix4Lia4LmB4LiB4LiZ4LmA4Lib4LmH4LiZ4LmA4Liq4LmJ4LiZ4Lia4Liy4LiH4LiX4Li24LiaIOC5hOC4oeC5iOC5g+C4iuC5ieC5gOC4quC5ieC4meC4m+C4o+C4sCAo4LmA4Liq4LmJ4LiZ4Lib4Lij',
  '4Liw4Lit4LmI4Liy4LiZ4LmA4Lir4Lih4Li34Lit4LiZ4LmA4Liq4LmJ4LiZ4LiE4Liy4LiU4LiB4Liy4Lij4LiT4LmMKQogICDguYHguJfguYjguIfguKvguJnguLLguYTguKHguYjguYDguIHguLTguJkgMjRweCDguJvguKXguLLguKLguJTguYnguLLguJnguILg',
  'uYnguK3guKHguLnguKXguKHguJnguYDguKXguYfguIHguJnguYnguK3guKIg4LiU4LmJ4Liy4LiZ4LiQ4Liy4LiZ4LmA4Lir4Lil4Li14LmI4Lii4LihCiAgIOC4leC4seC4p+C4q+C4meC4seC4h+C4quC4t+C4reC4l+C4uOC4geC4leC4seC4p+C5g+C4iuC5ieC4',
  'quC4teC4leC4seC4p+C4reC4seC4geC4qeC4o+C4m+C4geC4leC4tCDguYTguKHguYjguYPguIrguYjguKrguLXguILguK3guIfguYHguJfguYjguIcg4oCUIOC4quC4teC4reC4ouC4ueC5iOC4l+C4teC5iOC5geC4l+C5iOC4h+C5gOC4l+C5iOC4suC4meC4seC5',
  'ieC4mQotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqLwouY2hhcnQtd3JhcHtvdmVyZmxvdy14OmF1dG99Ci5jaGFydHtkaXNwbGF5OmJsb2NrO3dpZHRoOjEwMCU7aGVpZ2h0OmF1dG87',
  'bWluLXdpZHRoOjU2MHB4fQouY2hhcnQgLmdyaWQtbHtzdHJva2U6dmFyKC0tbGluZSk7c3Ryb2tlLXdpZHRoOjE7ZmlsbDpub25lfQouY2hhcnQgLmF4aXMtbHtzdHJva2U6dmFyKC0tbGluZSk7c3Ryb2tlLXdpZHRoOjF9Ci5jaGFydCAudGlja3tmaWxsOnZhcigt',
  'LW11dGVkKTtmb250LXNpemU6MTFweDtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXN9Ci5jaGFydCAueGxhYntmaWxsOnZhcigtLWluay0yKTtmb250LXNpemU6MTJweH0KLmNoYXJ0IC5kbGFie2ZpbGw6dmFyKC0taW5rKTtmb250LXNpemU6MTFweDtm',
  'b250LXdlaWdodDo2MDB9Ci5jaGFydCAuYzF7ZmlsbDp2YXIoLS1jMSl9Ci5jaGFydCAuYzJ7ZmlsbDp2YXIoLS1jMil9Ci5jaGFydCAuaGl0e2ZpbGw6dHJhbnNwYXJlbnQ7Y3Vyc29yOnBvaW50ZXJ9Ci5jaGFydCAuaGl0OmZvY3Vze291dGxpbmU6bm9uZX0KLmNo',
  'YXJ0IC5iYW5ke2ZpbGw6dmFyKC0taW5rKTtvcGFjaXR5OjA7dHJhbnNpdGlvbjpvcGFjaXR5IC4xMnN9Ci5jaGFydCBnLm9uIC5iYW5ke29wYWNpdHk6LjA1fQouY2hhcnQgLmhpdDpmb2N1cy12aXNpYmxlICsgLmJhbmQsCi5jaGFydCBnLm9uIC5iYW5ke29wYWNp',
  'dHk6LjA4fQoKLmxlZ2VuZHtkaXNwbGF5OmZsZXg7Z2FwOjE0cHg7YWxpZ24taXRlbXM6Y2VudGVyO2ZsZXgtd3JhcDp3cmFwO21hcmdpbi1ib3R0b206MTBweH0KLmxlZ2VuZCAua3tkaXNwbGF5OmlubGluZS1mbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6NnB4',
  'O2ZvbnQtc2l6ZToxMnB4O2NvbG9yOnZhcigtLWluay0yKX0KLmxlZ2VuZCAuc3d7d2lkdGg6MTJweDtoZWlnaHQ6MTJweDtib3JkZXItcmFkaXVzOjNweDtmbGV4Om5vbmV9CgovKiDguIHguKXguYjguK3guIfguJrguK3guIHguITguYjguLLguJXguK3guJnguIrg',
  'uLXguYkg4oCUIOC4hOC5iOC4suC4leC4seC4p+C5g+C4q+C4jeC5iOC4oeC4suC4geC5iOC4reC4mSDguIrguLfguYjguK3guKPguLLguKLguIHguLLguKPguYDguJvguYfguJnguJXguLHguKfguKPguK3guIcgKi8KLmN0aXB7cG9zaXRpb246Zml4ZWQ7ei1pbmRl',
  'eDo5MDtwb2ludGVyLWV2ZW50czpub25lO2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7CiAgYm9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXItc20pO2JveC1zaGFkb3c6dmFyKC0tc2gtbGcpOwogIHBhZGRpbmc6OHB4IDEw',
  'cHg7Zm9udC1zaXplOjEycHg7bWluLXdpZHRoOjEzMnB4O29wYWNpdHk6MDt0cmFuc2l0aW9uOm9wYWNpdHkgLjFzfQouY3RpcC5vbntvcGFjaXR5OjF9Ci5jdGlwIC5te2ZvbnQtd2VpZ2h0OjcwMDtjb2xvcjp2YXIoLS1pbmspO21hcmdpbi1ib3R0b206NnB4fQou',
  'Y3RpcCAucntkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo3cHg7bWFyZ2luLXRvcDozcHh9Ci5jdGlwIC5yIGl7d2lkdGg6MTJweDtoZWlnaHQ6MnB4O2JvcmRlci1yYWRpdXM6MnB4O2ZsZXg6bm9uZX0KLmN0aXAgLnIgYntjb2xvcjp2YXIoLS1p',
  'bmspO2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtczttYXJnaW4tbGVmdDphdXRvfQouY3RpcCAuciBzcGFue2NvbG9yOnZhcigtLW11dGVkKX0KCjwvc3R5bGU+CjwvaGVhZD4KPGJvZHk+Cgo8ZGl2IGNsYXNzPSJhcHAiPgogIDwhLS0gPT09PT09PT09',
  'PT09PT09PT0gc2lkZWJhciA9PT09PT09PT09PT09PT09PSAtLT4KICA8YXNpZGUgY2xhc3M9Im5hdiIgaWQ9Im5hdiI+CiAgICA8ZGl2IGNsYXNzPSJicmFuZCI+CiAgICAgIDxiPvCfj6IgPD89IGFwcE5hbWUgPz48L2I+CiAgICAgIDxzcGFuPjw/PSBzdWJ0aXRs',
  'ZSA/PiDCtyB2PD89IHZlcnNpb24gPz48L3NwYW4+CiAgICA8L2Rpdj4KICAgIDxkaXYgY2xhc3M9Im5hdi1saXN0IiBpZD0ibmF2TGlzdCI+PC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJuYXYtZm9vdCIgaWQ9Im5hdkZvb3QiPuC4geC4s+C4peC4seC4h+C5guC4q+C4',
  'peC4lOKApjwvZGl2PgogIDwvYXNpZGU+CgogIDwhLS0gPT09PT09PT09PT09PT09PT0gbWFpbiA9PT09PT09PT09PT09PT09PSAtLT4KICA8ZGl2IGNsYXNzPSJtYWluIj4KICAgIDxoZWFkZXIgY2xhc3M9InRvcCI+CiAgICAgIDxidXR0b24gY2xhc3M9ImJ1cmdl',
  'ciIgb25jbGljaz0idG9nZ2xlTmF2KCkiPuKYsDwvYnV0dG9uPgogICAgICA8ZGl2PgogICAgICAgIDxoMSBpZD0icGFnZVRpdGxlIj7guKDguLLguJ7guKPguKfguKE8L2gxPgogICAgICAgIDxkaXYgY2xhc3M9InN1YiIgaWQ9InBhZ2VTdWIiPuC5geC4lOC4iuC4',
  'muC4reC4o+C5jOC4lOC4o+C4p+C4oeC4l+C4uOC4geC4quC5iOC4p+C4meC4guC4reC4h+C4q+C4reC4nuC4seC4gTwvZGl2PgogICAgICA8L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0idG9wLXJpZ2h0Ij4KICAgICAgICA8c3BhbiBpZD0ibGl2ZURvdCI+PC9zcGFu',
  'PgogICAgICAgIDxzcGFuIGlkPSJiZWxsV3JhcCIgY2xhc3M9ImJlbGwtd3JhcCI+PC9zcGFuPgogICAgICAgIDxidXR0b24gY2xhc3M9ImJ0biBpY29uIiBpZD0idGhlbWVCdG4iIHRpdGxlPSLguKrguKXguLHguJrguJjguLXguKEiIG9uY2xpY2s9ImN5Y2xlVGhl',
  'bWUoKSI+8J+MlzwvYnV0dG9uPgogICAgICAgIDxpbnB1dCBjbGFzcz0iaW5wIHctYXV0byIgaWQ9InNlYXJjaEJveCIgcGxhY2Vob2xkZXI9IvCflI4g4LiE4LmJ4LiZ4Lir4Liy4LiX4Lix4LmJ4LiH4Lij4Liw4Lia4Lia4oCmIiBzdHlsZT0id2lkdGg6MTgwcHgi',
  'CiAgICAgICAgICAgICAgIG9uaW5wdXQ9Im9uU2VhcmNoKHRoaXMudmFsdWUpIiBhdXRvY29tcGxldGU9Im9mZiI+CiAgICAgICAgPHNlbGVjdCBjbGFzcz0ic2VsIHctYXV0byIgaWQ9InllYXJTZWwiIG9uY2hhbmdlPSJzZXRZZWFyKHRoaXMudmFsdWUpIj48L3Nl',
  'bGVjdD4KICAgICAgICA8YnV0dG9uIGNsYXNzPSJidG4gaWNvbiIgdGl0bGU9IuC4o+C4teC5gOC4n+C4o+C4iiIgb25jbGljaz0icmVmcmVzaCgpIj7ihrs8L2J1dHRvbj4KICAgICAgPC9kaXY+CiAgICA8L2hlYWRlcj4KICAgIDxtYWluIGNsYXNzPSJjb250ZW50',
  'IiBpZD0idmlldyI+CiAgICAgIDxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPjxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+PC9kaXY+4LiB4Liz4Lil4Lix4LiH4LmA4LiK4Li34LmI4Lit4Lih4LiV4LmI4Lit4Lij4Liw4Lia4Lia4oCmPC9kaXY+',
  'CiAgICA8L21haW4+CiAgPC9kaXY+CgogIDwhLS0g4LmB4LiW4Lia4Lil4LmI4Liy4LiH4Liq4Liz4Lir4Lij4Lix4Lia4Lih4Li34Lit4LiW4Li34LitIOKAlCDguK3guKLguLnguYjguYPguJnguKvguJnguYnguLLguYDguJTguLXguKLguKfguIHguLHguJnguJng',
  'uLXguYnguYDguKrguKHguK0g4LmE4Lih4LmI4LmE4LiU4LmJ4LmB4Lii4LiB4LmE4Lif4Lil4LmMCiAgICAgICBDU1Mg4LmA4Lib4LmH4LiZ4LiV4Lix4Lin4LiV4Lix4LiU4Liq4Li04LiZ4Lin4LmI4Liy4LiI4Lit4LmE4Lir4LiZ4LmA4Lir4LmH4LiZIOC4ouC5',
  'iOC4rS3guILguKLguLLguKLguKvguJnguYnguLLguJXguYjguLLguIfguYHguKXguYnguKfguKrguKXguLHguJrguYTguJTguYnguJfguLHguJnguJfguLUgLS0+CiAgPG5hdiBjbGFzcz0idGFiYmFyIiBpZD0idGFiQmFyIiBhcmlhLWxhYmVsPSLguYDguKHguJng',
  'uLnguKvguKXguLHguIEiPjwvbmF2Pgo8L2Rpdj4KCjxkaXYgaWQ9ImF1dGhSb290Ij48L2Rpdj4KPGRpdiBpZD0ibW9kYWxSb290Ij48L2Rpdj4KPGRpdiBpZD0idG9hc3RSb290Ij48L2Rpdj4KCjxzY3JpcHQ+CiAgLyog4LiE4LmI4Liy4LiX4Lix4LmJ4LiH4Liq',
  '4Liy4Lih4LiW4Li54LiB4LiB4Lij4Lit4LiH4Lih4Liy4LiI4Liy4LiB4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4LmB4Lil4LmJ4LinIOC4iOC4tuC4h+C4q+C4peC4uOC4lOC4reC4reC4geC4iOC4suC4geC5gOC4hOC4o+C4',
  't+C5iOC4reC4h+C4q+C4oeC4suC4ouC4hOC4s+C4nuC4ueC4lOC5hOC4oeC5iOC5hOC4lOC5iQogICAgICAgYWNjZXNzS2V5ICDguJzguYjguLLguJkgc2FmZUtleV8gICAg4LmA4Lir4Lil4Li34Lit4LmB4LiE4LmIIEEtWiBhLXogMC05IF8gLQogICAgICAgcm9s',
  'ZSAgICAgICDguKHguLLguIjguLLguIHguKPguLLguKLguIHguLLguKPguITguIfguJfguLXguYggUk9MRQogICAgICAgdGhlbWUgICAgICDguJzguYjguLLguJkgc2FmZVRoZW1lXyAg4LmA4Lir4Lil4Li34Lit4LmB4LiE4LmIIDMg4LiE4LmI4Liy4LiX4Li14LmI',
  '4LiB4Liz4Lir4LiZ4LiU4LmE4Lin4LmJCgogICAgIOC4l+C4seC5ieC4h+C4quC4suC4oeC4leC5ieC4reC4h+C4nuC4tOC4oeC4nuC5jOC5geC4muC4muC4lOC4tOC4miAoZm9yY2UtcHJpbnRpbmcpIOC5gOC4l+C5iOC4suC4meC4seC5ieC4mSDguKvguYnguLLg',
  'uKHguYPguIrguYnguYHguJrguJogc3RhbmRhcmQtcHJpbnRpbmcKICAgICDguYDguJ7guKPguLLguLDguYHguJrguJrguKvguKXguLHguIfguIjguLAgZXNjYXBlIOC5gOC4hOC4o+C4t+C5iOC4reC4h+C4q+C4oeC4suC4ouC4hOC4s+C4nuC4ueC4lOC5gOC4m+C5',
  'h+C4mSAmcXVvdDsg4LiL4Li24LmI4LiH4LmD4LiZ4LmB4LiX4LmH4LiBIHNjcmlwdAogICAgIOC5gOC4muC4o+C4suC4p+C5jOC5gOC4i+C4reC4o+C5jOC5hOC4oeC5iOC4luC4reC4lOC4geC4peC4seC4miDguJfguLPguYPguKvguYnguJfguLHguYnguIfguJrg',
  'uKXguYfguK3guIHguJnguLXguYnguJ7guLHguIfguJfguLHguYnguIfguIHguYnguK3guJnguYHguKXguLDguITguYjguLLguYTguKHguYjguJbguLbguIfguKvguJnguYnguLLguYDguKfguYfguJogKi8KICB2YXIgQUNDRVNTX0tFWSA9ICI8PyE9IGFjY2Vzc0tl',
  'eSA/PiI7CiAgdmFyIFVTRVJfUk9MRSAgPSAiPD8hPSByb2xlID8+IjsKICB2YXIgSU5JVF9USEVNRSA9ICI8PyE9IHRoZW1lID8+IjsKPC9zY3JpcHQ+CjxzY3JpcHQ+Ci8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PQogICBBcHAuaHRtbCDigJQgY29yZTogc3RhdGUsIGFwaSwgcm91dGVyLCBmb3JtYXQsIG1vZGFsLCB1cGxvYWQKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgp2YXIgUyA9IHsKICBi',
  'b290OiBudWxsLCAgICAgICAgICAvLyDguILguYnguK3guKHguLnguKXguJXguLHguYnguIfguJXguYnguJnguIjguLLguIEgYXBwLmJvb3RzdHJhcAogIHBhZ2U6ICdkYXNoYm9hcmQnLAogIHllYXI6IFN0cmluZyhuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCkpLAog',
  'IGNhY2hlOiB7fSwgICAgICAgICAgIC8vIOC5gOC4geC5h+C4muC4nOC4peC4peC4seC4nuC4mOC5jOC4peC5iOC4suC4quC4uOC4lOC4guC4reC4h+C5geC4leC5iOC4peC4sOC4q+C4meC5ieC4sgogIHBhcmFtczoge30sICAgICAgICAgIC8vIOC4leC4seC4p+C4',
  'geC4o+C4reC4h+C4ouC5iOC4reC4ouC4guC4reC4h+C5geC4leC5iOC4peC4sOC4q+C4meC5ieC4siDguYDguIrguYjguJkge3Jvb206JzMxMScsIHN0YXR1czonYWxsJ30KICBidXN5OiBmYWxzZSwKICB2ZXJzaW9uOiAwLCAgICAgICAgICAvLyDguKPguLjguYjg',
  'uJnguILguYnguK3guKHguLnguKXguJfguLXguYjguKvguJnguYnguLLguJnguLXguYnguJbguLfguK3guK3guKLguLnguYgKICBzZWxmQ2hhbmdlVW50aWw6IDAsICAvLyDguYDguJ7guLTguYjguIfguIHguJTguJrguLHguJnguJfguLbguIHguYDguK3guIcg4oCU',
  'IOC4reC4ouC5iOC4suC5gOC4lOC5ieC4h+C4p+C5iOC4siAi4Lih4Li14LiE4LiZ4LmB4LiB4LmJ4LiC4LmJ4Lit4Lih4Li54LilIgogIHN5bmNUaW1lcjogbnVsbAp9OwoKdmFyIEFMTF9ERUJUUyA9IFtdOwoKdmFyIFBBR0VTID0gWwogIHsgaWQ6J2Rhc2hib2Fy',
  'ZCcsIGljOifwn5OKJywgbGFiZWw6J+C4oOC4suC4nuC4o+C4p+C4oScsICAgICAgICAgICAgICBzdWI6J+C5geC4lOC4iuC4muC4reC4o+C5jOC4lOC4o+C4p+C4oeC4l+C4uOC4geC4quC5iOC4p+C4meC4guC4reC4h+C4q+C4reC4nuC4seC4gScsICAgICAgICBz',
  'ZWM6J+C4oOC4suC4nuC4o+C4p+C4oScsIHRhYjon4Lig4Liy4Lie4Lij4Lin4LihJyB9LAogIHsgaWQ6J2NhbGVuZGFyJywgIGljOifwn5eT77iPJywgbGFiZWw6J+C4m+C4j+C4tOC4l+C4tOC4meC4h+C4suC4mScsICAgICAgICAgICAgc3ViOifguJnguLHguJTg',
  'uIvguYjguK3guKEg4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMIOC4h+C4suC4meC4leC4tuC4gSDguYHguKXguLDguIHguLPguKvguJnguJTguJzguYjguK3guJkg4LiU4Li54LiV4LmI4Lit4LmA4LiZ4Li34LmI4Lit4LiH4LiC4LmJ4Liy4Lih4Lib4Li14LmE4LiU',
  '4LmJJyB9LAogIHsgaWQ6J2RlYnRNYWluJywgIGljOifwn5KwJywgbGFiZWw6J+C4o+C4suC4ouC4geC4suC4o+C4quC4o+C4uOC4m+C4o+C4p+C4oScsICAgICAgIHN1Yjon4Lia4Lix4LiN4LiK4Li14LmC4Lit4LiZ4LmD4LiK4LmJ4Lir4LiZ4Li14LmJ4Lir4Lil',
  '4Lix4LiB4LiC4Lit4LiH4Lir4Lit4Lie4Lix4LiBJywgICAgICAgIHNlYzon4LiB4Liy4Lij4LmA4LiH4Li04LiZJyB9LAogIHsgaWQ6J2RlYnRTdWInLCAgIGljOifwn6e+JywgbGFiZWw6J+C4q+C4meC4teC5ieC4quC4tOC4mScsICAgICAgICAgICAgICBzdWI6',
  'J+C4muC4seC4jeC4iuC4teC5guC4reC4meC5g+C4iuC5ieC4q+C4meC4teC5ieC4o+C4reC4h+C4guC4reC4h+C4q+C4reC4nuC4seC4gScgfSwKICB7IGlkOidwdXJjaGFzZXMnLCBpYzon8J+bkicsIGxhYmVsOifguKPguLLguKLguIHguLLguKPguIvguLfguYng',
  'uK3guILguK3guIcnLCAgICAgICAgc3ViOifguILguK3guIfguYDguILguYnguLLguKvguK3guJ7guLHguIEg4Lij4Liy4LiE4LiyIOC4m+C4o+C4sOC4geC4seC4mSDguYHguKXguLDguKrguKXguLTguJsnIH0sCiAgeyBpZDonZmluYW5jZScsICAgaWM6J/Cfk5In',
  'LCBsYWJlbDon4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4ouC4q+C4rScsICAgICAgc3ViOifguITguYjguLLguYDguIrguYjguLLguJfguLXguYjguYDguIHguYfguJrguYTguJTguYkgwrcg4LiE4LmI4Liy4LmE4LifIMK3IOC4hOC5iOC4',
  'suC4meC5ieC4syDCtyDguITguYjguLLguYDguJnguYfguJUgwrcg4Lig4Liy4Lip4Li1JywgdGFiOifguKPguLLguKLguKPguLHguJot4LiI4LmI4Liy4LiiJyB9LAogIHsgaWQ6J2FjJywgICAgICAgIGljOifinYTvuI8nLCBsYWJlbDon4Lil4LmJ4Liy4LiH4LmB',
  '4Lit4Lij4LmMJywgICAgICAgICAgICBzdWI6J+C4leC4suC4o+C4suC4h+C4peC5ieC4suC4h+C5geC4reC4o+C5jOC4o+C4suC4ouC4q+C5ieC4reC4hyAyNCDguKvguYnguK3guIcnLCAgICAgIHNlYzon4LiL4LmI4Lit4Lih4Lia4Liz4Lij4Li44LiHJywgdGFi',
  'OifguKXguYnguLLguIfguYHguK3guKPguYwnIH0sCiAgeyBpZDoncmVwYWlycycsICAgaWM6J/CflKcnLCBsYWJlbDon4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Liy4Lih4Lir4LmJ4Lit4LiHJywgICAgICBzdWI6J+C4h+C4suC4meC5geC4iOC5ieC4h+C4i+C5',
  'iOC4reC4oeC5geC4ouC4geC4leC4suC4oeC4q+C5ieC4reC4hycsIHRhYjon4LiL4LmI4Lit4Lih4Lir4LmJ4Lit4LiHJyB9LAogIHsgaWQ6J2J1aWxkaW5nJywgIGljOifwn4+iJywgbGFiZWw6J+C4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4lOC4',
  'ouC4o+C4p+C4oScsICAgIHN1Yjon4LiH4Liy4LiZ4Liq4LmI4Lin4LiZ4LiB4Lil4Liy4LiH4LiC4Lit4LiH4Lit4Liy4LiE4Liy4LijJyB9LAogIHsgaWQ6J3Jvb21zJywgICAgIGljOifwn5qqJywgbGFiZWw6J+C4q+C5ieC4reC4h+C4nuC4seC4gScsICAgICAg',
  'ICAgICAgIHN1Yjon4LiX4Liw4LmA4Lia4Li14Lii4LiZ4Lir4LmJ4Lit4LiH4LmB4Lil4Liw4Lib4Lij4Liw4Lin4Lix4LiV4Li04Lij4Liy4Lii4Lir4LmJ4Lit4LiHJywgICAgICAgc2VjOifguILguYnguK3guKHguLnguKUnIH0sCiAgeyBpZDoncmVwb3J0cycs',
  'ICAgaWM6J/Cfk4gnLCBsYWJlbDon4Lij4Liy4Lii4LiH4Liy4LiZICYg4Liq4Liz4Lij4Lit4LiH4LiC4LmJ4Lit4Lih4Li54LilJywgc3ViOifguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguKPguLLguKLguKvguYnguK3guIcgwrcg4Lib4LiP4Li04LiX',
  '4Li04LiZ4LiH4Liy4LiZIMK3IOC4quC5iOC4h+C4reC4reC4geC4guC5ieC4reC4oeC4ueC4pScgfSwKICB7IGlkOidzZXR0aW5ncycsICBpYzon4pqZ77iPJywgbGFiZWw6J+C4leC4seC5ieC4h+C4hOC5iOC4sicsICAgICAgICAgICAgICBzdWI6J+C4muC4seC4',
  'jeC4iuC4tSDCtyDguJjguLXguKEgwrcg4Lic4Li54LmJ4LmD4LiK4LmJIMK3IOC4peC4tOC4h+C4geC5jOC5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4mScsICAgc2VjOifguKPguLDguJrguJonIH0KXTsKCi8qIC0tLS0tLS0tLS0tLS0tLS0gQVBJIC0tLS0t',
  'LS0tLS0tLS0tLS0gKi8KCi8qKiDguIHguLjguI3guYHguIjguJfguLXguYjguIjguLDguYHguJnguJrguYTguJvguIHguLHguJrguJfguLjguIHguITguLPguKrguLHguYjguIcg4oCUIOC4oeC4tSAyIOC4l+C4suC4h+C4quC4s+C4o+C4reC4h+C5gOC4nOC4t+C5',
  'iOC4reC4l+C4suC4h+C5geC4o+C4geC5hOC4oeC5iOC4oeC4siAqLwp2YXIgUkVTT0xWRURfS0VZID0gbnVsbDsKCmZ1bmN0aW9uIGFjY2Vzc0tleSgpewogIGlmIChSRVNPTFZFRF9LRVkgIT09IG51bGwpIHJldHVybiBSRVNPTFZFRF9LRVk7CiAgUkVTT0xWRURf',
  'S0VZID0gKHR5cGVvZiBBQ0NFU1NfS0VZID09PSAnc3RyaW5nJyAmJiBBQ0NFU1NfS0VZKSA/IEFDQ0VTU19LRVkgOiAnJzsKICByZXR1cm4gUkVTT0xWRURfS0VZOwp9CgovKiogdHJ1ZSDguJbguYnguLLguYDguJvguLTguJTguJTguYnguKfguKLguKXguLTguIfg',
  'uIHguYzguJzguLnguYnguJTguLnguYHguKUg4oCUIOC5g+C4iuC5ieC5geC4l+C4meC4leC4seC4p+C5geC4m+C4oyBDQU5fRURJVCDguJXguKPguIcg4LmGIOC4l+C4teC5iOC4reC4suC4iOC5hOC4oeC5iOC4luC4ueC4geC4m+C4o+C4sOC4geC4suC4qCAqLwpm',
  'dW5jdGlvbiBjYW5FZGl0KCl7CiAgaWYgKHR5cGVvZiBDQU5fRURJVCAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiAhIUNBTl9FRElUOwogIHJldHVybiAhIShTLmJvb3QgJiYgUy5ib290LmNhbkVkaXQpOwp9CgpmdW5jdGlvbiBjYWxsQXBpKGFjdGlvbiwgcGF5bG9h',
  'ZCl7CiAgdmFyIGJvZHkgPSB7fTsKICBPYmplY3Qua2V5cyhwYXlsb2FkIHx8IHt9KS5mb3JFYWNoKGZ1bmN0aW9uKGspeyBib2R5W2tdID0gcGF5bG9hZFtrXTsgfSk7CiAgYm9keS5fa2V5ID0gYWNjZXNzS2V5KCk7CiAgLy8g4Lic4Li54LmJ4LmA4Lij4Li14Lii',
  '4LiB4Liq4LmI4LiHIF9zZXNzaW9uIOC4oeC4suC5gOC4reC4h+C5hOC4lOC5iSAo4LiV4Lit4LiZ4Lit4Lit4LiB4LiI4Liy4LiB4Lij4Liw4Lia4Lia4LiV4LmJ4Lit4LiH4LmD4LiK4LmJ4LiV4Lix4Lin4LmA4LiB4LmI4LiyKQogIGlmIChib2R5Ll9zZXNzaW9u',
  'ID09PSB1bmRlZmluZWQpIGJvZHkuX3Nlc3Npb24gPSAodHlwZW9mIEFVVEggIT09ICd1bmRlZmluZWQnID8gQVVUSC5zZXNzaW9uIDogJycpIHx8ICcnOwogIHBheWxvYWQgPSBib2R5OwogIHZhciBtdXRhdGluZyA9IENMSUVOVF9NVVRBVElORy50ZXN0KGFjdGlv',
  'bik7CiAgaWYgKG11dGF0aW5nKSBzeW5jU2V0KCdzYXZpbmcnKTsKCiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7CiAgICB2YXIgb2sgPSBmdW5jdGlvbihyZXMpewogICAgICBpZiAoIXJlcykgeyBpZiAobXV0YXRpbmcpIHN5',
  'bmNTZXQoJ29mZmxpbmUnKTsgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoJ+C5hOC4oeC5iOC5hOC4lOC5ieC4o+C4seC4muC4guC5ieC4reC4oeC4ueC4peC4iOC4suC4geC5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jCcpKTsgfQogICAgICBpZiAocmVz',
  'Lm9rKSB7CiAgICAgICAgaWYgKG11dGF0aW5nKSB7IG1hcmtTZWxmQ2hhbmdlKCk7IHN5bmNTZXQoJ3NhdmVkJyk7IH0KICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXMuZGF0YSk7CiAgICAgIH0KICAgICAgLy8g4Lir4Lih4LiU4Lit4Liy4Lii4Li44Lij4Liw4Lir',
  '4Lin4LmI4Liy4LiH4LmD4LiK4LmJ4LiH4Liy4LiZIOKAlCDguJ7guLLguIHguKXguLHguJrguYTguJvguKvguJnguYnguLLguKXguYfguK3guIHguK3guLTguJnguYHguJfguJnguJfguLXguYjguIjguLDguILguLbguYnguJnguILguYnguK3guITguKfguLLguKHg',
  'uITguYnguLLguIfguYTguKfguYnguYDguInguKIg4LmGCiAgICAgIGlmIChyZXMubmVlZExvZ2luICYmIHR5cGVvZiBvblNlc3Npb25Mb3N0ID09PSAnZnVuY3Rpb24nKSBvblNlc3Npb25Mb3N0KCk7CiAgICAgIGlmIChtdXRhdGluZykgc3luY1NldCgnZXJyb3In',
  'LCByZXMuZXJyb3IpOwogICAgICByZWplY3QobmV3IEVycm9yKHJlcy5lcnJvcikpOwogICAgfTsKICAgIHZhciBmYWlsID0gZnVuY3Rpb24oZXJyKXsKICAgICAgLy8g4LmA4LiZ4LmH4LiV4Liq4Liw4LiU4Li44LiUIOKAlCDguILguK3guIfguJfguLXguYjguIHg',
  'uKPguK3guIHguYTguKfguYnguKLguLHguIfguK3guKLguLnguYjguYPguJnguJ/guK3guKPguYzguKEg4LmE4Lih4LmI4Lir4Liy4Lii4LmE4Lib4LmE4Lir4LiZCiAgICAgIGlmIChtdXRhdGluZykgc3luY1NldChpc09mZmxpbmVFcnJvcihlcnIpID8gJ29mZmxp',
  'bmUnIDogJ2Vycm9yJywgKGVyciAmJiBlcnIubWVzc2FnZSkgfHwgU3RyaW5nKGVycikpOwogICAgICByZWplY3QoZXJyKTsKICAgIH07CiAgICBzZXJ2ZXJDYWxsKGFjdGlvbiwgcGF5bG9hZCB8fCB7fSwgb2ssIGZhaWwpOwogIH0pOwp9CgovKioKICog4Liq4LmI',
  '4LiH4LiE4Liz4Liq4Lix4LmI4LiH4LmE4Lib4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmMIOKAlCDguKvguJnguYnguLLguYDguKfguYfguJrguIrguLjguJTguYDguJTguLXguKLguKfguIHguLHguJnguYPguIrguYnguYTguJTguYnguJfguLHguYng',
  'uIfguKrguK3guIfguJfguLXguYgKICogICDguYDguJvguLTguJTguIjguLLguIEgQXBwcyBTY3JpcHQg4oaSIGdvb2dsZS5zY3JpcHQucnVuCiAqICAg4LmA4Lib4Li04LiU4LiI4Liy4LiBIENsb3VkZmxhcmUgIOKGkiBQT1NUIC9hcGkgKOC5hOC4lOC5ieC4nOC4',
  'peC4peC4seC4nuC4mOC5jOC4o+C4ueC4m+C5geC4muC4muC5gOC4lOC4teC4ouC4p+C4geC4seC4meC5gOC4m+C5iuC4sCkKICovCmZ1bmN0aW9uIHNlcnZlckNhbGwoYWN0aW9uLCBwYXlsb2FkLCBvaywgZmFpbCl7CiAgaWYgKHdpbmRvdy5nb29nbGUgJiYgZ29v',
  'Z2xlLnNjcmlwdCAmJiBnb29nbGUuc2NyaXB0LnJ1bikgewogICAgZ29vZ2xlLnNjcmlwdC5ydW4ud2l0aFN1Y2Nlc3NIYW5kbGVyKG9rKS53aXRoRmFpbHVyZUhhbmRsZXIoZmFpbCkuYXBpKGFjdGlvbiwgcGF5bG9hZCk7CiAgICByZXR1cm47CiAgfQogIGZldGNo',
  'KCcvYXBpJywgewogICAgbWV0aG9kOiAnUE9TVCcsCiAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSwKICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgYWN0aW9uOiBhY3Rpb24sIHBheWxvYWQ6IHBheWxvYWQgfSksCiAg',
  'ICBjcmVkZW50aWFsczogJ3NhbWUtb3JpZ2luJwogIH0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICAvLyDguJXguK3guJrguIHguKXguLHguJrguYDguJvguYfguJnguILguYnguK3guJzguLTguJTguJ7guKXguLLguJQgKDR4eC81eHgpIOC5geC4leC5iOC4oeC4teC4',
  'guC5ieC4reC4hOC4p+C4suC4oeC4muC4reC4geC4quC4suC5gOC4q+C4leC4uCDigJQg4Liq4LmI4LiH4LiV4LmI4Lit4LmD4Lir4LmJ4LmB4Liq4LiU4LiH4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiI4Lij4Li04LiHIOC5hOC4oeC5iOC5g+C4iuC5iOC4guC4tuC5',
  'ieC4meC4p+C5iOC4suC4reC4reC4n+C5hOC4peC4meC5jAogICAgcmV0dXJuIHIuanNvbigpLnRoZW4oZnVuY3Rpb24oYm9keSl7CiAgICAgIGlmIChib2R5ICYmIHR5cGVvZiBib2R5ID09PSAnb2JqZWN0JyAmJiAnb2snIGluIGJvZHkpIHJldHVybiBib2R5Owog',
  'ICAgICB0aHJvdyBuZXcgRXJyb3IoJ+C5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jOC4leC4reC4muC4geC4peC4seC4muC4nOC4tOC4lOC4o+C4ueC4m+C5geC4muC4miAoSFRUUCAnICsgci5zdGF0dXMgKyAnKScpOwogICAgfSwgZnVuY3Rpb24oKXsK',
  'ICAgICAgdGhyb3cgbmV3IEVycm9yKHIub2sgPyAn4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4LiV4Lit4Lia4LiB4Lil4Lix4Lia4Lic4Li04LiU4Lij4Li54Lib4LmB4Lia4LiaJyA6ICfguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYzg',
  'uILguLHguJTguILguYnguK3guIcgKEhUVFAgJyArIHIuc3RhdHVzICsgJyknKTsKICAgIH0pOwogIH0pLnRoZW4ob2ssIGZ1bmN0aW9uKGUpeyBmYWlsKGUgJiYgZS5tZXNzYWdlID8gZSA6IG5ldyBFcnJvcignbmV0d29yazogJyArIGUpKTsgfSk7Cn0KCi8qKiDg',
  'uYDguKPguLXguKLguIHguYDguKHguLfguYjguK3guYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYzguJrguK3guIHguKfguYjguLLguKLguLHguIfguYTguKHguYjguYTguJTguYnguKXguYfguK3guIHguK3guLTguJkgKOC4q+C4oeC4lOC4reC4suC4ouC4',
  'uCAvIOC4luC4ueC4geC5g+C4q+C5ieC4reC4reC4geC4iOC4suC4geC4o+C4sOC4muC4mikgKi8KdmFyIHNlc3Npb25Mb3N0QXQgPSAwOwpmdW5jdGlvbiBvblNlc3Npb25Mb3N0KCl7CiAgaWYgKERhdGUubm93KCkgLSBzZXNzaW9uTG9zdEF0IDwgMzAwMCkgcmV0',
  'dXJuOyAgIC8vIOC4q+C4peC4suC4ouC4hOC4s+C4quC4seC5iOC4h+C4nuC4o+C5ieC4reC4oeC4geC4seC4meC4geC5h+C5gOC4lOC5ieC4h+C4hOC4o+C4seC5ieC4h+C5gOC4lOC4teC4ouC4p+C4nuC4rQogIHNlc3Npb25Mb3N0QXQgPSBEYXRlLm5vdygpOwog',
  'IHNhdmVTZXNzaW9uKCcnKTsKICBjbG9zZU1vZGFsKCk7CiAgaWYgKEFVVEguZGV2aWNlKSBzaG93UGluKCk7IGVsc2Ugc2hvd0xvZ2luKCfguKvguKHguJTguYDguKfguKXguLLguYPguIrguYnguIfguLLguJkg4LiB4Lij4Li44LiT4Liy4LmA4LiC4LmJ4Liy4Liq',
  '4Li54LmI4Lij4Liw4Lia4Lia4Lit4Li14LiB4LiE4Lij4Lix4LmJ4LiHJyk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0gYm9vdCAmIHJvdXRpbmcgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gYm9vdCgpewogIC8vIOC4l+C4suC4mOC4teC4oeC4geC5iOC4',
  'reC4meC4reC4ouC5iOC4suC4h+C4reC4t+C5iOC4mSDguIjguLDguYTguJTguYnguYTguKHguYjguYDguKvguYfguJnguKvguJnguYnguLLguIjguK3guIHguKPguLDguJ7guKPguLTguJrguILguLLguKfguJXguK3guJnguYDguJvguLTguJQKICBhcHBseVRoZW1l',
  'KGxzR2V0KExTX1RIRU1FKSB8fCAodHlwZW9mIElOSVRfVEhFTUUgPT09ICdzdHJpbmcnID8gSU5JVF9USEVNRSA6ICfguJXguLLguKHguYDguITguKPguLfguYjguK3guIcnKSk7CiAgLy8gYXV0aEdhdGUg4LiI4Liw4Lit4LmI4Liy4LiZ4LiB4Li44LiN4LmB4LiI',
  '4LiI4Liy4LiBIFVSTCDguILguK3guIfguKvguJnguYnguLLguYHguKHguYjguYPguKvguYnguJTguYnguKfguKIg4LiW4LmJ4Liy4LiV4Lix4Lin4LmB4Lib4Lij4LmE4Lih4LmI4Lih4Liy4LiW4Li24LiH4Lir4LiZ4LmJ4Liy4LmA4Lin4LmH4LiaCiAgYXV0aEdh',
  'dGUoKTsKfQoKZnVuY3Rpb24gYm9vdE5vdygpewogIGNhbGxBcGkoJ2FwcC5ib290c3RyYXAnKS50aGVuKGZ1bmN0aW9uKGIpewogICAgUy5ib290ID0gYjsKICAgIHJlbmRlck5hdigpOwogICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdkZvb3QnKS5pbm5l',
  'ckhUTUwgPSBuYXZGb290SHRtbChiKTsKICAgIFMudmVyc2lvbiA9IGIudmVyc2lvbiB8fCAwOwogICAgaWYgKCFiLmNhbkVkaXQpIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgncmVhZG9ubHknKTsKICAgIC8vIOC4mOC4teC4oeC4guC4reC4h+C5gOC4hOC4',
  'o+C4t+C5iOC4reC4h+C4meC4teC5ieC4iuC4meC4sOC5gOC4quC4oeC4rSDguJbguYnguLLguKLguLHguIfguYTguKHguYjguYDguITguKLguJXguLHguYnguIfguITguYjguK3guKLguYPguIrguYnguILguK3guIfguKPguLDguJrguJoKICAgIGFwcGx5VGhlbWUo',
  'Y3VycmVudFRoZW1lKCkpOwogICAgZ28oc3RhcnRQYWdlKGIpKTsKICAgIHJlZnJlc2hBbGVydHMoKTsKICAgIHN0YXJ0UG9sbGluZyhiLnNldHRpbmdzICYmIGIuc2V0dGluZ3MucmVmcmVzaFNlY29uZHMpOwogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgZG9j',
  'dW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZpZXcnKS5pbm5lckhUTUwgPQogICAgICAnPGRpdiBjbGFzcz0iY2FyZCI+PGRpdiBjbGFzcz0iY2FyZC1iIj48aDM+4LmA4LiK4Li34LmI4Lit4Lih4LiV4LmI4Lit4Lij4Liw4Lia4Lia4LmE4Lih4LmI4Liq4Liz4LmA4Lij',
  '4LmH4LiIPC9oMz4nICsKICAgICAgJzxwIGNsYXNzPSJtdXRlZCI+JyArIGVzYyhlLm1lc3NhZ2V8fGUpICsgJzwvcD4nICsKICAgICAgJzxwIGNsYXNzPSJmczEzIj7guJXguKPguKfguIjguKrguK3guJrguKfguYjguLI6IOC5gOC4m+C4tOC4lOC4iuC4teC4leC5',
  'geC4peC5ieC4p+C4o+C4seC4mSA8Yj7guYDguKHguJnguLkg8J+PoiBUaGUgTSBDb3JuZXIgQVAg4oaSIPCfmoAg4LiV4Li04LiU4LiV4Lix4LmJ4LiH4LiX4Lix4LmJ4LiH4Lir4Lih4LiU4LmD4LiZ4LiE4Lil4Li04LiB4LmA4LiU4Li14Lii4LinPC9iPiAnICsK',
  'ICAgICAgJ+C5gOC4o+C4teC4ouC4muC4o+C5ieC4reC4ouC5geC4peC5ieC4pzwvcD48L2Rpdj48L2Rpdj4nOwogIH0pOwp9CgovKiog4Lir4LiZ4LmJ4Liy4LmB4Lij4LiB4LiX4Li14LmI4LiI4Liw4LmA4Lib4Li04LiUIOKAlCDguJXguLLguKHguJfguLXguYjg',
  'uJXguLHguYnguIfguYTguKfguYkg4LmB4LiV4LmI4LiW4LmJ4Liy4Lih4Li1ICNoYXNoIOC5g+C4meC4peC4tOC4h+C4geC5jOC5g+C4q+C5iSBoYXNoIOC4iuC4meC4sCAqLwpmdW5jdGlvbiBzdGFydFBhZ2UoYil7CiAgdmFyIGhhc2ggPSAobG9jYXRpb24uaGFz',
  'aCB8fCAnJykucmVwbGFjZSgnIycsJycpOwogIGlmIChQQUdFUy5zb21lKGZ1bmN0aW9uKHApeyByZXR1cm4gcC5pZCA9PT0gaGFzaDsgfSkpIHJldHVybiBoYXNoOwogIHZhciBtYXAgPSB7CiAgICAn4LmB4LiU4LiK4Lia4Lit4Lij4LmM4LiUJzonZGFzaGJvYXJk',
  'JywgJ+C4o+C4suC4ouC4geC4suC4o+C4quC4o+C4uOC4m+C4o+C4p+C4oSc6J2RlYnRNYWluJywgJ+C4q+C4meC4teC5ieC4quC4tOC4mSc6J2RlYnRTdWInLAogICAgJ+C4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4hyc6J3B1cmNoYXNlcycs',
  'ICfguIvguYjguK3guKHguYHguIvguKHguJXguLLguKHguKvguYnguK3guIcnOidyZXBhaXJzJwogIH07CiAgcmV0dXJuIG1hcFtiLnNldHRpbmdzICYmIGIuc2V0dGluZ3Muc3RhcnRQYWdlXSB8fCAnZGFzaGJvYXJkJzsKfQoKLyoqIOC4guC5ieC4reC4hOC4p+C4',
  'suC4oeC4oeC4uOC4oeC4peC5iOC4suC4h+C4i+C5ieC4suC4oiDigJQg4LmA4Lin4Lit4Lij4LmM4LiK4Lix4LiZ4LmA4Lin4LmH4Lia4LmB4Lit4Lib4LiI4Liw4LmA4LiC4Li14Lii4LiZ4LiX4Lix4Lia4Lif4Lix4LiH4LiB4LmM4LiK4Lix4LiZ4LiZ4Li14LmJ',
  'ICovCmZ1bmN0aW9uIG5hdkZvb3RIdG1sKGIpewogIHZhciB1ID0gYi51c2VyIHx8IHt9OwogIHJldHVybiAnPGIgc3R5bGU9ImNvbG9yOiNjN2QwZTAiPicgKyBlc2ModS5uYW1lIHx8IHUubGFiZWwgfHwgJycpICsgJzwvYj4nICsKICAgICh1LnVzZXJuYW1lID8g',
  'JyA8c3BhbiBzdHlsZT0ib3BhY2l0eTouNyI+QCcgKyBlc2ModS51c2VybmFtZSkgKyAnPC9zcGFuPicgOiAnJykgKwogICAgJzxicj48c3BhbiBzdHlsZT0ib3BhY2l0eTouOCI+JyArIGVzYyh1LnJvbGUgJiYgdS5yb2xlICE9PSAnbm9uZScgPyB1LnJvbGUgOiB1',
  'LnZpYSB8fCAnJykgKyAnPC9zcGFuPicgKwogICAgKGIuc2hlZXRVcmwgPyAnPGJyPjxhIGhyZWY9IicgKyBlc2Moc2FmZVVybChiLnNoZWV0VXJsKSkgKyAnIiB0YXJnZXQ9Il9ibGFuayIgcmVsPSJub29wZW5lciI+4LmA4Lib4Li04LiUIEdvb2dsZSBTaGVldCDi',
  'hpc8L2E+JyA6ICcnKSArCiAgICAodS5zaWduZWRJbiAmJiB1LnVzZXJuYW1lCiAgICAgID8gJzxicj48YSBocmVmPSJqYXZhc2NyaXB0OnZvaWQoMCkiIG9uY2xpY2s9ImNvbmZpcm1Mb2dvdXQoKSI+4Lit4Lit4LiB4LiI4Liy4LiB4Lij4Liw4Lia4LiaPC9hPicK',
  'ICAgICAgOiAnJyk7Cn0KCmZ1bmN0aW9uIHJlbmRlck5hdigpewogIHZhciBodG1sID0gJyc7CiAgUEFHRVMuZm9yRWFjaChmdW5jdGlvbihwKXsKICAgIGlmIChwLnNlYykgaHRtbCArPSAnPGRpdiBjbGFzcz0ibmF2LXNlYyI+JyArIHAuc2VjICsgJzwvZGl2Pic7',
  'CiAgICBodG1sICs9ICc8YnV0dG9uIGNsYXNzPSJuYXYtaXRlbSIgaWQ9Im5hdi0nICsgcC5pZCArICciIG9uY2xpY2s9ImdvKCcgKyBqc3EocC5pZCkgKyAnKSI+JyArCiAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPSJpYyI+JyArIHAuaWMgKyAnPC9zcGFuPjxz',
  'cGFuPicgKyBwLmxhYmVsICsgJzwvc3Bhbj4nICsKICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9ImJhZGdlIiBpZD0iYmFkZ2UtJyArIHAuaWQgKyAnIiBzdHlsZT0iZGlzcGxheTpub25lIj48L3NwYW4+JyArCiAgICAgICAgICAgICc8L2J1dHRvbj4nOwogIH0p',
  'OwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXZMaXN0JykuaW5uZXJIVE1MID0gaHRtbDsKICByZW5kZXJUYWJzKCk7Cn0KCi8qKgogKiDguYHguJbguJrguKXguYjguLLguIfguKrguLPguKvguKPguLHguJrguKHguLfguK3guJbguLfguK0g4oCUIOC5g+C4',
  'iuC5iSBQQUdFUyDguIrguLjguJTguYDguJTguLXguKLguKfguIHguLHguJrguYDguKHguJnguLnguILguYnguLLguIcg4LmB4Lil4Liw4LmA4Lij4Li14Lii4LiBIGdvKCkg4LiV4Lix4Lin4LmA4LiU4Li14Lii4Lin4LiB4Lix4LiZCiAqIOC5hOC4oeC5iOC5hOC4',
  'lOC5ieC5gOC4m+C5h+C4meC4q+C4meC5ieC4suC4iOC4reC4hOC4meC4peC4sOC4iuC4uOC4lCDguYDguJvguYfguJnguYHguITguYjguJfguLXguYjguKfguLLguIfguJvguLjguYjguKHguK3guLXguIHguJfguLXguYjguKvguJnguLbguYjguIfguILguK3guIfg',
  'uILguYnguK3guKHguLnguKXguYDguJTguLTguKEKICog4Lib4Li44LmI4Lih4Liq4Li44LiU4LiX4LmJ4Liy4Lii4LmA4Lib4Li04LiU4Lil4Li04LmJ4LiZ4LiK4Lix4LiB4LmA4Lih4LiZ4Li54LmA4LiU4Li04LihIOC4iOC4sOC5hOC4lOC5ieC5gOC4guC5ieC4',
  'suC4luC4tuC4h+C4q+C4meC5ieC4suC4l+C4teC5iOC5gOC4q+C4peC4t+C4reC5hOC4lOC5ieC4hOC4o+C4mgogKi8KZnVuY3Rpb24gcmVuZGVyVGFicygpewogIHZhciBiYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFiQmFyJyk7CiAgaWYgKCFiYXIp',
  'IHJldHVybjsKICB2YXIgaHRtbCA9IFBBR0VTLmZpbHRlcihmdW5jdGlvbihwKXsgcmV0dXJuIHAudGFiOyB9KS5tYXAoZnVuY3Rpb24ocCl7CiAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9InRhYiIgaWQ9InRhYi0nICsgcC5pZCArICciIG9uY2xpY2s9ImdvKCcg',
  'KyBqc3EocC5pZCkgKyAnKSIgYXJpYS1sYWJlbD0iJyArIGVzYyhwLmxhYmVsKSArICciPicgKwogICAgICAgICAgICAgJzxzcGFuIGNsYXNzPSJpYyI+JyArIHAuaWMgKyAnPC9zcGFuPjxzcGFuIGNsYXNzPSJ0bCI+JyArIGVzYyhwLnRhYikgKyAnPC9zcGFuPicg',
  'KwogICAgICAgICAgICAgJzxzcGFuIGNsYXNzPSJiYWRnZSIgaWQ9InRhYmJhZGdlLScgKyBwLmlkICsgJyIgc3R5bGU9ImRpc3BsYXk6bm9uZSI+PC9zcGFuPicgKwogICAgICAgICAgICc8L2J1dHRvbj4nOwogIH0pLmpvaW4oJycpOwogIGJhci5pbm5lckhUTUwg',
  'PSBodG1sICsKICAgICc8YnV0dG9uIGNsYXNzPSJ0YWIiIGlkPSJ0YWItbW9yZSIgb25jbGljaz0idG9nZ2xlTmF2KCkiIGFyaWEtbGFiZWw9IuC5gOC4oeC4meC4ueC4l+C4seC5ieC4h+C4q+C4oeC4lCI+JyArCiAgICAgICc8c3BhbiBjbGFzcz0iaWMiPuKYsDwv',
  'c3Bhbj48c3BhbiBjbGFzcz0idGwiPuC5gOC4nuC4tOC5iOC4oeC5gOC4leC4tOC4oTwvc3Bhbj4nICsKICAgICAgJzxzcGFuIGNsYXNzPSJiYWRnZSIgaWQ9InRhYmJhZGdlLW1vcmUiIHN0eWxlPSJkaXNwbGF5Om5vbmUiPjwvc3Bhbj4nICsKICAgICc8L2J1dHRv',
  'bj4nOwp9CgpmdW5jdGlvbiBnbyhwYWdlKXsKICBTLnBhZ2UgPSBwYWdlOwogIFMucGFyYW1zID0ge307CiAgbG9jYXRpb24uaGFzaCA9IHBhZ2U7CiAgdmFyIG1ldGEgPSBQQUdFUy5maWx0ZXIoZnVuY3Rpb24ocCl7cmV0dXJuIHAuaWQ9PT1wYWdlO30pWzBdIHx8',
  'IFBBR0VTWzBdOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlVGl0bGUnKS50ZXh0Q29udGVudCA9IG1ldGEubGFiZWw7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BhZ2VTdWInKS50ZXh0Q29udGVudCA9IG1ldGEuc3ViOwogIFBBR0VTLmZvckVh',
  'Y2goZnVuY3Rpb24ocCl7CiAgICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2LScgKyBwLmlkKTsKICAgIGlmIChlbCkgZWwuY2xhc3NMaXN0LnRvZ2dsZSgnb24nLCBwLmlkID09PSBwYWdlKTsKICAgIHZhciB0YWIgPSBkb2N1bWVudC5nZXRF',
  'bGVtZW50QnlJZCgndGFiLScgKyBwLmlkKTsKICAgIGlmICh0YWIpIHRhYi5jbGFzc0xpc3QudG9nZ2xlKCdvbicsIHAuaWQgPT09IHBhZ2UpOwogIH0pOwogIC8vIOC4q+C4meC5ieC4suC4l+C4teC5iOC5hOC4oeC5iOC4oeC4teC5geC4l+C5h+C4muC4guC4reC4',
  'h+C4leC4seC4p+C5gOC4reC4hyDguYPguKvguYnguJvguLjguYjguKEgIuC5gOC4nuC4tOC5iOC4oeC5gOC4leC4tOC4oSIg4Liq4Lin4LmI4Liy4LiH4LmB4LiX4LiZIOC4iOC4sOC5hOC4lOC5ieC4o+C4ueC5ieC4p+C5iOC4suC4reC4ouC4ueC5iOC4leC4o+C4',
  'h+C5hOC4q+C4mQogIHZhciBtb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhYi1tb3JlJyk7CiAgaWYgKG1vcmUpIG1vcmUuY2xhc3NMaXN0LnRvZ2dsZSgnb24nLCAhUEFHRVMuc29tZShmdW5jdGlvbihwKXsgcmV0dXJuIHAudGFiICYmIHAuaWQgPT09',
  'IHBhZ2U7IH0pKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2JykuY2xhc3NMaXN0LnJlbW92ZSgnb3BlbicpOwogIHJlbW92ZVNjcmltKCk7CiAgbG9hZCgpOwp9CgpmdW5jdGlvbiByZWZyZXNoKCl7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfQoKZnVu',
  'Y3Rpb24gc2V0WWVhcih5KXsKICBTLnllYXIgPSB5OwogIGxvYWQoKTsKfQoKLyoqCiAqIOC5guC4q+C4peC4lOC4guC5ieC4reC4oeC4ueC4peC4guC4reC4h+C4q+C4meC5ieC4suC4m+C4seC4iOC4iOC4uOC4muC4seC4mQogKgogKiBAcGFyYW0ge3txdWlldDpi',
  'b29sZWFufT19IG9wdHMKICogICBxdWlldCA9IOC4i+C4tOC4h+C4geC5jOC5gOC4h+C4teC4ouC4miDguYYg4LmA4Lia4Li34LmJ4Lit4LiH4Lir4Lil4Lix4LiHIOC5hOC4oeC5iOC4peC5ieC4suC4h+C4q+C4meC5ieC4suC5gOC4m+C5h+C4meC4p+C4h+C4geC4',
  'peC4oeC4q+C4oeC4uOC4mSDguYHguKXguLDguITguLfguJnguJXguLPguYHguKvguJnguYjguIfguJfguLXguYjguYDguKXguLfguYjguK3guJnguITguYnguLLguIfguYTguKfguYkKICogICAgICAgICAgIOC5g+C4iuC5ieC4q+C4peC4seC4h+C4geC4lOC4muC4',
  'seC4meC4l+C4tuC4gSDguYHguKXguLDguJXguK3guJnguJ7guJrguKfguYjguLLguKHguLXguITguJnguYHguIHguYnguILguYnguK3guKHguLnguKXguIjguLLguIHguJfguLXguYjguK3guLfguYjguJkKICogICAgICAgICAgIOC5gOC4nuC4t+C5iOC4reC5g+C4',
  'q+C5ieC4q+C4meC5ieC4suC4iOC4reC4meC4tOC5iOC4h+C4l+C4teC5iOC4quC4uOC4lCDguYTguKHguYjguIHguKPguLDguJ7guKPguLTguJrguYHguKXguLDguYTguKHguYjguYDguJTguYnguIfguIHguKXguLHguJrguYTguJvguJrguJnguKrguLjguJQKICov',
  'CmZ1bmN0aW9uIGxvYWQob3B0cyl7CiAgb3B0cyA9IChvcHRzID09PSB0cnVlKSA/IHt9IDogKG9wdHMgfHwge30pOyAgICAgLy8g4LmA4Lic4Li34LmI4Lit4LmC4LiE4LmJ4LiU4LmA4LiB4LmI4Liy4LiX4Li14LmI4LmA4Lij4Li14Lii4LiBIGxvYWQodHJ1ZSkK',
  'ICB2YXIgcXVpZXQgPSAhIW9wdHMucXVpZXQ7CiAgdmFyIHZpZXcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndmlldycpOwogIHZhciByID0gUk9VVEVTW1MucGFnZV07CiAgaWYgKCFyKSB7IHZpZXcuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9ImVtcHR5Ij7g',
  'uYTguKHguYjguJ7guJrguKvguJnguYnguLLguJnguLXguYk8L2Rpdj4nOyByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7IH0KCiAgaWYgKCFxdWlldCkgewogICAgdmlldy5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz0iZW1wdHkiPjxkaXYgY2xhc3M9ImJpZyI+PHNw',
  'YW4gY2xhc3M9InNwaW4iPjwvc3Bhbj48L2Rpdj7guIHguLPguKXguLHguIfguYLguKvguKXguJTguILguYnguK3guKHguLnguKXigKY8L2Rpdj4nOwogIH0gZWxzZSB7CiAgICBzeW5jU2V0KCdzeW5jaW5nJyk7CiAgfQoKICB2YXIga2VlcCA9IHF1aWV0ID8gc25h',
  'cHNob3RWaWV3KCkgOiBudWxsOwoKICByZXR1cm4gci5sb2FkKCkudGhlbihmdW5jdGlvbihkYXRhKXsKICAgIFMuY2FjaGVbUy5wYWdlXSA9IGRhdGE7CgogICAgLy8g4Lir4LiZ4LmJ4Liy4LmB4LiV4LmI4Lil4Liw4Lir4LiZ4LmJ4Liy4Lih4Li14Lib4Li14LmD',
  '4Lir4LmJ4LmA4Lil4Li34Lit4LiB4LmE4Lih4LmI4LmA4LiX4LmI4Liy4LiB4Lix4LiZICjguYDguIrguYjguJnguIvguLfguYnguK3guILguK3guIfguKHguLXguJbguLbguIfguJvguLUgMjU2MyDguYHguJXguYjguKPguLLguKLguKPguLHguJot4Lij4Liy4Lii',
  '4LiI4LmI4Liy4Lii4Lih4Li14LmB4LiE4LmI4Lib4Li14Lil4LmI4Liy4Liq4Li44LiUKQogICAgLy8g4LiW4LmJ4Liy4Lib4Li14LiX4Li14LmI4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmI4LmE4Lih4LmI4Lih4Li14LmD4LiZ4Lir4LiZ4LmJ4Liy4LiZ4Li14LmJ',
  'IHN5bmNZZWFyT3B0aW9ucyDguIjguLDguJvguKPguLHguJrguJvguLXguYPguKvguYkg4oCUIOC5geC4leC5iOC4guC5ieC4reC4oeC4ueC4peC4l+C4teC5iOC5gOC4nuC4tOC5iOC4h+C4lOC4tuC4h+C4oeC4sgogICAgLy8g4LmA4Lib4LmH4LiZ4LiC4Lit4LiH',
  '4Lib4Li14LmA4LiB4LmI4LiyIOC4quC5iOC4p+C4meC4m+C5ieC4suC4ouC4geC4s+C4geC4seC4muC5g+C4iuC5ieC4m+C4teC5g+C4q+C4oeC5iCDguIHguKXguLLguKLguYDguJvguYfguJnguJrguK3guIHguKfguYjguLIgIuC4ouC4reC4lOC4i+C4t+C5ieC4',
  'rSDguJvguLUgMjAyNiA9IDAg4Lia4Liy4LiXIgogICAgLy8g4LiX4Lix4LmJ4LiH4LiX4Li14LmI4Lib4Li14LiZ4Lix4LmJ4LiZ4Lih4Li14Lii4Lit4LiU4LiI4Lij4Li04LiHIOKAlCDguJXguYnguK3guIfguJTguLbguIfguYPguKvguKHguYjguYPguKvguYng',
  'uJXguKPguIfguIHguLHguJrguJvguLXguJfguLXguYjguJvguKPguLHguJrguYHguKXguYnguKcKICAgIHZhciB5ZWFyQmVmb3JlID0gU3RyaW5nKFMueWVhcik7CiAgICBzeW5jWWVhck9wdGlvbnMoZGF0YS55ZWFycyB8fCBkYXRhLmF2YWlsYWJsZSB8fCBbXSk7',
  'CiAgICBpZiAoU3RyaW5nKFMueWVhcikgIT09IHllYXJCZWZvcmUgJiYgIW9wdHMuX3JldHJpZWQpIHsKICAgICAgcmV0dXJuIGxvYWQoeyBxdWlldDogcXVpZXQsIF9yZXRyaWVkOiB0cnVlIH0pOwogICAgfQoKICAgIHZpZXcuaW5uZXJIVE1MID0gci5yZW5kZXIo',
  'ZGF0YSk7CiAgICBsYWJlbENlbGxzKHZpZXcpOwogICAgYXBwbHlSZWFkT25seSh2aWV3KTsKICAgIGlmIChyLmFmdGVyKSByLmFmdGVyKGRhdGEpOwogICAgaWYgKGtlZXApIHJlc3RvcmVWaWV3KGtlZXApOwogICAgaWYgKHF1aWV0KSBzeW5jU2V0KCdzeW5jZWQn',
  'KTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgIGlmIChxdWlldCkgeyAgICAgICAgICAgICAgICAgICAgICAgLy8g4LiL4Li04LiH4LiB4LmM4LmA4Lia4Li34LmJ4Lit4LiH4Lir4Lil4Lix4LiH4Lie4Lil4Liy4LiUIOKAlCDguK3guKLguYjguLLguJfguLTg',
  'uYnguIfguILguK3guIfguJfguLXguYjguYDguKvguYfguJnguK3guKLguLnguYgKICAgICAgc3luY1NldChpc09mZmxpbmVFcnJvcihlKSA/ICdvZmZsaW5lJyA6ICdlcnJvcicsIGUubWVzc2FnZSB8fCBlKTsKICAgICAgcmV0dXJuOwogICAgfQogICAgdmlldy5p',
  'bm5lckhUTUwgPSAnPGRpdiBjbGFzcz0iY2FyZCI+PGRpdiBjbGFzcz0iY2FyZC1iIj48aDM+4LmC4Lir4Lil4LiU4LiC4LmJ4Lit4Lih4Li54Lil4LmE4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIPC9oMz4nICsKICAgICAgICAgICAgICAgICAgICAgJzxwIGNsYXNz',
  'PSJtdXRlZCI+JyArIGVzYyhlLm1lc3NhZ2V8fGUpICsgJzwvcD4nICsKICAgICAgICAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0ibG9hZCgpIj7guKXguK3guIfguYPguKvguKHguYg8L2J1dHRvbj48L2Rpdj48L2Rpdj4nOwogIH0p',
  'Owp9CgovKiog4LiI4Liz4Liq4Lig4Liy4Lie4Lir4LiZ4LmJ4Liy4LiI4Lit4LmE4Lin4LmJ4LiB4LmI4Lit4LiZ4Lin4Liy4LiU4LmD4Lir4Lih4LmIIOC5gOC4nuC4t+C5iOC4reC5g+C4q+C5ieC4nOC4ueC5ieC5g+C4iuC5ieC4o+C4ueC5ieC4quC4tuC4geC4',
  'p+C5iOC4suC4q+C4meC5ieC4suC5hOC4oeC5iOC5hOC4lOC5ieC4luC4ueC4geC5guC4q+C4peC4lOC5g+C4q+C4oeC5iCAqLwpmdW5jdGlvbiBzbmFwc2hvdFZpZXcoKXsKICB2YXIgb3BlbiA9IFtdOwogIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5iaWxs',
  'LWxpbmVzJykuZm9yRWFjaChmdW5jdGlvbihlbCl7CiAgICBpZiAoIWVsLmhpZGRlbikgb3Blbi5wdXNoKGVsLmlkKTsKICB9KTsKICByZXR1cm4geyB5OiB3aW5kb3cuc2Nyb2xsWSB8fCAwLCBvcGVuOiBvcGVuIH07Cn0KCmZ1bmN0aW9uIHJlc3RvcmVWaWV3KGtl',
  'ZXApewogIGtlZXAub3Blbi5mb3JFYWNoKGZ1bmN0aW9uKGlkKXsKICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTsKICAgIGlmIChlbCkgeyBlbC5oaWRkZW4gPSBmYWxzZTsgdmFyIGIgPSBlbC5wcmV2aW91c0VsZW1lbnRTaWJsaW5nOwog',
  'ICAgICAgICAgICAgIGlmIChiKSBiLnRleHRDb250ZW50ID0gYi50ZXh0Q29udGVudC5yZXBsYWNlKCfilr4nLCAn4pa0Jyk7IH0KICB9KTsKICBpZiAoa2VlcC55KSB3aW5kb3cuc2Nyb2xsVG8oMCwga2VlcC55KTsKfQoKLyoqIOC5gOC4leC4tOC4oeC4leC4seC4',
  'p+C5gOC4peC4t+C4reC4geC4m+C4teC5g+C4meC5geC4luC4muC4muC4meC5g+C4q+C5ieC4leC4o+C4h+C4geC4seC4muC4guC5ieC4reC4oeC4ueC4peC4iOC4o+C4tOC4h+C4guC4reC4h+C4q+C4meC5ieC4suC4meC4seC5ieC4mSAqLwpmdW5jdGlvbiBzeW5j',
  'WWVhck9wdGlvbnMoeWVhcnMpewogIHZhciBzZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgneWVhclNlbCcpOwogIHZhciBsaXN0ID0gKHllYXJzIHx8IFtdKS5zbGljZSgpLnNvcnQoZnVuY3Rpb24oYSxiKXtyZXR1cm4gYi1hO30pOwogIHZhciBjdXIgPSBu',
  'ZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCk7CiAgaWYgKGxpc3QuaW5kZXhPZihjdXIpIDwgMCkgbGlzdC51bnNoaWZ0KGN1cik7CiAgdmFyIGh0bWwgPSAnPG9wdGlvbiB2YWx1ZT0iYWxsIj7guJfguLjguIHguJvguLU8L29wdGlvbj4nOwogIGxpc3QuZm9yRWFjaChm',
  'dW5jdGlvbih5KXsKICAgIC8vIOC4hOC5iOC4suC5g+C4mSBvcHRpb24g4LmA4Lib4LmH4LiZIOC4hC7guKguIOC5gOC4quC4oeC4rSAo4LiX4Lix4LmJ4LiH4Lij4Liw4Lia4Lia4LmD4LiK4LmJ4Lib4Li14LiZ4Li14LmJ4Lit4LmJ4Liy4LiH4Lit4Li04LiHKSDg',
  'uKrguYjguKfguJnguILguYnguK3guITguKfguLLguKHguYHguKXguYnguKfguYHguJXguYjguJfguLXguYjguJXguLHguYnguIfguYTguKfguYkKICAgIGh0bWwgKz0gJzxvcHRpb24gdmFsdWU9IicgKyB5ICsgJyI+4Lib4Li1ICcgKyBkaXNwbGF5WWVhcih5KSAr',
  'CiAgICAgICAgICAgICh1c2VCdWRkaGlzdFllYXIoKSA/ICcgKOC4hC7guKguICcgKyB5ICsgJyknIDogJycpICsgJzwvb3B0aW9uPic7CiAgfSk7CiAgc2VsLmlubmVySFRNTCA9IGh0bWw7CiAgaWYgKGxpc3QuaW5kZXhPZihOdW1iZXIoUy55ZWFyKSkgPCAwICYm',
  'IFMueWVhciAhPT0gJ2FsbCcpIFMueWVhciA9IFN0cmluZyhjdXIpOwogIHNlbC52YWx1ZSA9IFMueWVhcjsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguYLguKvguKHguJTguJTguLnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcgLS0tLS0tLS0tLS0tLS0t',
  'LQogICDguJ3guLHguYjguIfguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYzguIHguLHguJnguYTguKfguYnguYHguKXguYnguKfguYPguJnguJ/guLHguIfguIHguYzguIrguLHguJkgYXBpKCkg4LiV4Lij4LiH4LiZ4Li14LmJ4LmB4LiE4LmI4LiL4LmI',
  '4Lit4LiZ4Lib4Li44LmI4Lih4LiX4Li14LmI4LiB4LiU4LmE4Lib4LiB4LmH4LiX4Liz4LmE4Lih4LmI4LmE4LiU4LmJCiAgIOC5gOC4nuC4t+C5iOC4reC5hOC4oeC5iOC5g+C4q+C5ieC4nOC4ueC5ieC4l+C4teC5iOC5gOC4m+C4tOC4lOC4lOC5ieC4p+C4ouC4',
  'peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC4quC4seC4muC4quC4mSAqLwp2YXIgRURJVF9FTlRSWVBPSU5UUyA9IC9cYihmb3JtRGVidHxmb3JtRGVidFBheW1lbnR8Zm9ybVB1cmNoYXNlfGZvcm1BY3xmb3JtQnVsa0FjfGZvcm1SZXBhaXJ8Zm9ybUJ1aWxkaW5n',
  'fGZvcm1Sb29tfGZvcm1GaW5hbmNlfGZvcm1Vc2VyfGRlbERlYnR8ZGVsRGVidFBheW1lbnR8ZGVsUHVyY2hhc2V8ZGVsQWN8ZGVsUmVwYWlyfGRlbEJ1aWxkaW5nfGRlbEZpbmFuY2V8ZGVsVXNlcnxkb0ltcG9ydEpzb258ZG9Sb3RhdGVTaGFyZXxkb0JhY2t1cE5v',
  'd3xzYXZlU2V0dGluZ3NGb3JtKVxzKlwoLzsKCmZ1bmN0aW9uIGFwcGx5UmVhZE9ubHkocm9vdCl7CiAgaWYgKGNhbkVkaXQoKSkgcmV0dXJuOwogIHZhciBub2RlcyA9IHJvb3QucXVlcnlTZWxlY3RvckFsbCgnW29uY2xpY2tdJyk7CiAgZm9yICh2YXIgaSA9IDA7',
  'IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykgewogICAgaWYgKEVESVRfRU5UUllQT0lOVFMudGVzdChub2Rlc1tpXS5nZXRBdHRyaWJ1dGUoJ29uY2xpY2snKSB8fCAnJykpIG5vZGVzW2ldLnJlbW92ZSgpOwogIH0KfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguKPguLXg',
  'uYDguJ/guKPguIrguK3guLHguJXguYLguJnguKHguLHguJXguLTguYDguKHguLfguYjguK3guILguYnguK3guKHguLnguKXguYPguJnguIrguLXguJXguYDguJvguKXguLXguYjguKLguJkgLS0tLS0tLS0tLS0tLS0tLQoKICAg4LiB4LiO4LmA4Lir4Lil4LmH4LiB',
  '4LiC4Lit4LiH4Liq4LmI4Lin4LiZ4LiZ4Li14LmJOiDguKvguYnguLLguKHguYLguKvguKXguJTguJfguLHguJrguKrguLTguYjguIfguJfguLXguYjguJzguLnguYnguYPguIrguYnguIHguLPguKXguLHguIfguJ7guLTguKHguJ7guYzguK3guKLguLnguYjguYDg',
  'uJTguYfguJTguILguLLguJQKICAg4LiW4LmJ4Liy4Lih4Li14LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmI4LiV4Lit4LiZ4LiX4Li14LmI4Lic4Li54LmJ4LmD4LiK4LmJ4LiB4Liz4Lil4Lix4LiH4LiB4Lij4Lit4LiB4Lit4Lii4Li54LmIIOC5g+C4q+C5',
  'ieC4guC4tuC5ieC4meC4m+C4uOC5iOC4oeC5gOC4peC5h+C4gSDguYYg4LmD4Lir4LmJ4LiB4LiU4LmA4Lit4LiH4LmA4Lih4Li34LmI4Lit4Lie4Lij4LmJ4Lit4LihCgogICDguKvguKHguLLguKLguYDguKvguJXguLg6IOC4o+C4uOC5iOC4meC4guC5ieC4reC4',
  'oeC4ueC4peC4lOC4ueC4iOC4suC4gSAi4LmA4Lin4Lil4Liy4LiX4Li14LmI4LiK4Li14LiV4LiW4Li54LiB4LmB4LiB4LmJ4Lil4LmI4Liy4Liq4Li44LiUIiDguILguK3guIcgR29vZ2xlIERyaXZlCiAgIOC4i+C4tuC5iOC4h+C4guC4ouC4seC4muC4l+C4uOC4',
  'geC4hOC4o+C4seC5ieC4h+C4l+C4teC5iOC4oeC4teC4geC4suC4o+C5gOC4guC4teC4ouC4mSDguKPguKfguKHguJbguLbguIfguJXguK3guJnguJfguLXguYjguYDguKPguLLguYDguK3guIfguIHguJTguJrguLHguJnguJfguLbguIHguJTguYnguKfguKIKICAg',
  '4LiI4Li24LiH4LiV4LmJ4Lit4LiH4LiI4LiU4Lij4Li44LmI4LiZ4LmD4Lir4Lih4LmI4LmE4Lin4LmJ4Lir4Lil4Lix4LiH4Lia4Lix4LiZ4LiX4Li24LiB4LiX4Li44LiB4LiE4Lij4Lix4LmJ4LiHIOC5hOC4oeC5iOC4h+C4seC5ieC4meC4iOC4sOC5guC4q+C4',
  'peC4lOC4i+C5ieC4s+C5geC4peC4sOC4guC4tuC5ieC4meC4guC5ieC4reC4hOC4p+C4suC4oQogICDguKfguYjguLIgIuC4oeC4teC4hOC4meC5geC4geC5ieC4guC5ieC4reC4oeC4ueC4pSIg4LiX4Lix4LmJ4LiH4LiX4Li14LmI4LiE4LiZ4LmB4LiB4LmJ4LiE',
  '4Li34Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmA4Lit4LiHCi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqLwoKLyoqIOC4hOC4s+C4quC4seC5iOC4h+C4l+C4teC5iOC4l+C4s+C5g+C4q+C5',
  'ieC4guC5ieC4reC4oeC4ueC4peC5g+C4meC4iuC4teC4leC5gOC4m+C4peC4teC5iOC4ouC4mSAo4LmD4Lir4LmJ4LiV4Lij4LiH4LiB4Lix4LiaIE1VVEFUSU5HX0FDVElPTlMg4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmMKSAq',
  'Lwp2YXIgQ0xJRU5UX01VVEFUSU5HID0gL1wuKHNhdmV8ZGVsZXRlfHNhdmVQYXltZW50fGRlbGV0ZVBheW1lbnR8YnVsa0Jvb2t8aW1wb3J0fHJvdGF0ZVRva2VufGJhY2t1cE5vd3x1cGxvYWR8dHJhc2h8dG9nZ2xlfHNldFN0YXR1c3xyZWNvbmNpbGUpJC87Cgov',
  'KioKICog4LmA4Lie4Li04LmI4LiH4LiB4LiU4Lia4Lix4LiZ4LiX4Li24LiB4LmA4Lit4LiHIOKAlCDguKvguJnguYnguLLguYLguKvguKXguJTguILguYnguK3guKHguLnguKXguYPguKvguKHguYjguYTguJvguYHguKXguYnguKfguJXguK3guJnguIHguJTguJrg',
  'uLHguJnguJfguLbguIEKICog4LiI4LiU4Lij4Li44LmI4LiZ4LiC4LmJ4Lit4Lih4Li54Lil4Lil4LmI4Liy4Liq4Li44LiU4LmE4Lin4LmJIOC5geC4peC4sOC4geC4seC4meC5hOC4oeC5iOC5g+C4q+C5ieC4o+C4reC4muC4leC4o+C4p+C4iOC4luC4seC4lOC5',
  'hOC4m+C5guC4q+C4peC4lOC4i+C5ieC4swogKiAo4LmA4Lic4Li34LmI4Lit4LmE4Lin4LmJIDIg4LiZ4Liy4LiX4Li1IOC5gOC4nuC4o+C4suC4sCBHb29nbGUgRHJpdmUg4Lit4Lix4Lib4LmA4LiU4LiV4LmA4Lin4Lil4Liy4LmB4LiB4LmJ4LmE4LiC4LiK4LmJ',
  '4Liy4LiB4Lin4LmI4Liy4LiB4Liy4Lij4LmA4LiC4Li14Lii4LiZ4LiI4Lij4Li04LiH4LmA4Lil4LmH4LiB4LiZ4LmJ4Lit4LiiKQogKi8KZnVuY3Rpb24gbWFya1NlbGZDaGFuZ2UoKXsKICBTLnNlbGZDaGFuZ2VVbnRpbCA9IERhdGUubm93KCkgKyAxMjAwMDA7',
  'CiAgY2xlYXJUaW1lb3V0KFMuc3luY1RpbWVyKTsKICBTLnN5bmNUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXsKICAgIHN5bmNWZXJzaW9uKCk7CiAgICByZWZyZXNoQWxlcnRzKCk7ICAgICAvLyDguIfguLLguJnguITguYnguLLguIfguK3guLLguIjguYDg',
  'uJ7guLTguYjguKHguKvguKPguLfguK3guKXguJTguIjguLLguIHguKrguLTguYjguIfguJfguLXguYjguYDguJ7guLTguYjguIfguJrguLHguJnguJfguLbguIHguYTguJsKICB9LCAxNTAwKTsKfQoKZnVuY3Rpb24gc3luY1ZlcnNpb24oKXsKICBjYWxsQXBpKCdh',
  'cHAudmVyc2lvbicpCiAgICAudGhlbihmdW5jdGlvbih2KXsgaWYgKHYgJiYgdi52ZXJzaW9uKSBTLnZlcnNpb24gPSB2LnZlcnNpb247IH0pCiAgICAuY2F0Y2goZnVuY3Rpb24oKXsgLyog4LmE4Lin4LmJ4Lij4Lit4Lia4Lir4LiZ4LmJ4LiyICovIH0pOwp9Cgov',
  'Kiog4Lic4Li54LmJ4LmD4LiK4LmJ4LiB4Liz4Lil4Lix4LiH4LiB4Lij4Lit4LiB4LiC4LmJ4Lit4Lih4Li54Lil4Lit4Lii4Li54LmI4Lir4Lij4Li34Lit4LmA4Lib4Lil4LmI4LiyIOKAlCDguJbguYnguLLguYPguIrguYgg4Lir4LmJ4Liy4Lih4LmC4Lir4Lil',
  '4LiU4LiX4Lix4LiaICovCmZ1bmN0aW9uIHVzZXJJc0J1c3koKXsKICB2YXIgbW9kYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9kYWxSb290Jyk7CiAgaWYgKG1vZGFsICYmIG1vZGFsLmlubmVySFRNTCkgcmV0dXJuIHRydWU7ICAgICAgICAgICAgICAv',
  'LyDguJ/guK3guKPguYzguKHguYDguJvguLTguJTguITguYnguLLguIfguK3guKLguLnguYgKICB2YXIgZWwgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50OwogIGlmIChlbCAmJiAvXihJTlBVVHxURVhUQVJFQXxTRUxFQ1QpJC8udGVzdChlbC50YWdOYW1lKSAmJgog',
  'ICAgICBlbC50eXBlICE9PSAnYnV0dG9uJyAmJiBlbC50eXBlICE9PSAnc3VibWl0JykgcmV0dXJuIHRydWU7ICAgLy8g4LmA4LiE4Lit4Lij4LmM4LmA4LiL4Lit4Lij4LmM4Lit4Lii4Li54LmI4LmD4LiZ4LiK4LmI4Lit4LiH4LiB4Lij4Lit4LiBCiAgcmV0dXJu',
  'IGZhbHNlOwp9CgpmdW5jdGlvbiByZWZyZXNoTGFiZWwoc2VjKXsKICBpZiAoIXNlYykgcmV0dXJuICfguJvguLTguJTguIHguLLguKPguJXguKPguKfguIjguK3guLHguJXguYLguJnguKHguLHguJXguLQnOwogIGlmIChzZWMgJSAzNjAwID09PSAwKSByZXR1cm4g',
  'J+C4leC4o+C4p+C4iOC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C4oeC5iOC4l+C4uOC4gSAnICsgKHNlYyAvIDM2MDApICsgJyDguIrguLHguYjguKfguYLguKHguIcnOwogIGlmIChzZWMgJSA2MCA9PT0gMCkgcmV0dXJuICfguJXguKPguKfguIjguILguYnguK3g',
  'uKHguLnguKXguYPguKvguKHguYjguJfguLjguIEgJyArIChzZWMgLyA2MCkgKyAnIOC4meC4suC4l+C4tSc7CiAgcmV0dXJuICfguJXguKPguKfguIjguILguYnguK3guKHguLnguKXguYPguKvguKHguYjguJfguLjguIEgJyArIHNlYyArICcg4Lin4Li04LiZ4Liy',
  '4LiX4Li1JzsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguJXguLHguKfguJrguK3guIHguKrguJbguLLguJnguLDguIHguLLguKPguIvguLTguIfguIHguYwgKOC4oeC4uOC4oeC4guC4p+C4suC4muC4mSkgLS0tLS0tLS0tLS0tLS0tLQoKICAg4Lir4LiZ4LmJ4Liy',
  '4LiX4Li14LmIOiDguJrguK3guIHguYPguKvguYnguKPguLnguYnguJXguKXguK3guJTguKfguYjguLLguJXguK3guJnguJnguLXguYnguILguYnguK3guKHguLnguKXguJXguKPguIfguIHguLHguJrguKvguKXguLHguIfguJrguYnguLLguJnguKvguKPguLfguK3g',
  'uKLguLHguIcKICAg4LiB4Liz4Lil4Lix4LiH4Lia4Lix4LiZ4LiX4Li24LiB4Lit4Lii4Li54LmI4LmE4Lir4LihIOC4q+C4o+C4t+C4reC4oeC4teC4reC4sOC5hOC4o+C4hOC5ieC4suC4h+C4l+C4teC5iOC4leC5ieC4reC4h+C4iOC4seC4lOC4geC4suC4owoK',
  'ICAg4LiV4Lix4LmJ4LiH4LmD4LiI4LmD4Lir4LmJICLguYDguIfguLXguKLguJrguYDguKHguLfguYjguK3guJfguLjguIHguK3guKLguYjguLLguIfguJvguIHguJXguLQg4LmB4Lil4Liw4LiK4Lix4LiU4LmA4LiI4LiZ4LmA4Lih4Li34LmI4Lit4Lih4Li14Lit',
  '4Liw4LmE4Lij4Lic4Li04LiU4Lib4LiB4LiV4Li0IgogICDguKrguJbguLLguJnguLDguJfguLXguYjguJXguYnguK3guIfguYPguKvguYnguJzguLnguYnguYPguIrguYnguJfguLPguK3guLDguYTguKPguJXguYjguK0gKOC4oeC4teC4guC5ieC4reC4oeC4ueC4',
  'peC5g+C4q+C4oeC5iCAvIOC5gOC4iuC4t+C5iOC4reC4oeC4leC5iOC4reC5hOC4oeC5iOC5hOC4lOC5iSkg4LiB4LiU4LmE4LiU4LmJCi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqLwoK',
  'dmFyIFNZTkMgPSB7IHN0YXRlOiAnc3luY2VkJywgZGV0YWlsOiAnJywgYXQ6IDAsIHRpbWVyOiBudWxsIH07Cgp2YXIgU1lOQ19MT09LID0gewogIHN5bmNlZDogIHsgY2xzOiAnb2snLCAgIGljb246ICfil48nLCAgdGV4dDogJ+C4i+C4tOC4h+C4geC5jOC5geC4',
  'peC5ieC4pycgfSwKICBzeW5jaW5nOiB7IGNsczogJ2luZm8nLCBpY29uOiAnJywgICB0ZXh0OiAn4LiB4Liz4Lil4Lix4LiH4LiL4Li04LiH4LiB4LmM4oCmJywgICBzcGluOiB0cnVlIH0sCiAgc2F2aW5nOiAgeyBjbHM6ICdpbmZvJywgaWNvbjogJycsICAgdGV4',
  'dDogJ+C4geC4s+C4peC4seC4h+C4muC4seC4meC4l+C4tuC4geKApicsICBzcGluOiB0cnVlIH0sCiAgc2F2ZWQ6ICAgeyBjbHM6ICdvaycsICAgaWNvbjogJ+KckycsICB0ZXh0OiAn4Lia4Lix4LiZ4LiX4Li24LiB4LmB4Lil4LmJ4LinJyB9LAogIHBlbmRpbmc6',
  'IHsgY2xzOiAnd2FybicsIGljb246ICfihrsnLCAgdGV4dDogJ+C4oeC4teC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C4oeC5iCcsICBjbGljazogJ2xvYWRQZW5kaW5nKCknIH0sCiAgb2ZmbGluZTogeyBjbHM6ICdkZ3InLCAgaWNvbjogJ+KaoCcsICB0ZXh0OiAn',
  '4LmA4LiK4Li34LmI4Lit4Lih4LiV4LmI4Lit4LmE4Lih4LmI4LmE4LiU4LmJJywgY2xpY2s6ICdyZXRyeVN5bmMoKScgfSwKICBlcnJvcjogICB7IGNsczogJ2RncicsICBpY29uOiAn4pqgJywgIHRleHQ6ICfguJrguLHguJnguJfguLbguIHguYTguKHguYjguKrg',
  'uLPguYDguKPguYfguIgnLCBjbGljazogJ3JldHJ5U3luYygpJyB9LAogIHBhdXNlZDogIHsgY2xzOiAnbXV0ZScsIGljb246ICfil4snLCAgdGV4dDogJ+C5hOC4oeC5iOC4leC4o+C4p+C4iOC4reC4seC4leC5guC4meC4oeC4seC4leC4tCcsIGNsaWNrOiAnbG9h',
  'ZFBlbmRpbmcoKScgfQp9OwoKLyoqCiAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZSDguIrguLfguYjguK3guKrguJbguLLguJnguLDguYPguJkgU1lOQ19MT09LCiAqIEBwYXJhbSB7c3RyaW5nPX0gZGV0YWlsIOC4guC5ieC4reC4hOC4p+C4suC4oeC4reC4mOC4tOC4',
  'muC4suC4ouC5gOC4nuC4tOC5iOC4oSAo4LmC4Lic4Lil4LmI4LiV4Lit4LiZ4LmA4Lit4Liy4LmA4Lih4Liy4Liq4LmM4LiK4Li14LmJKQogKi8KZnVuY3Rpb24gc3luY1NldChzdGF0ZSwgZGV0YWlsKXsKICAvLyDguKrguJbguLLguJnguLDguJfguLXguYjguJXg',
  'uYnguK3guIfguYPguKvguYnguJzguLnguYnguYPguIrguYnguIjguLHguJTguIHguLLguKMg4Lir4LmJ4Liy4Lih4LiW4Li54LiB4Liq4LiW4Liy4LiZ4Liw4LiX4Lix4LmI4Lin4LmE4Lib4Lih4Liy4LiB4Lil4Lia4LiX4Li04LmJ4LiHCiAgaWYgKChTWU5DLnN0',
  'YXRlID09PSAncGVuZGluZycgfHwgU1lOQy5zdGF0ZSA9PT0gJ29mZmxpbmUnKSAmJgogICAgICAoc3RhdGUgPT09ICdzeW5jZWQnIHx8IHN0YXRlID09PSAnc3luY2luZycpKSByZXR1cm47CgogIFNZTkMuc3RhdGUgPSBzdGF0ZTsKICBTWU5DLmRldGFpbCA9IGRl',
  'dGFpbCB8fCAnJzsKICBpZiAoc3RhdGUgPT09ICdzeW5jZWQnIHx8IHN0YXRlID09PSAnc2F2ZWQnKSBTWU5DLmF0ID0gRGF0ZS5ub3coKTsKICBzeW5jUGFpbnQoKTsKCiAgY2xlYXJUaW1lb3V0KFNZTkMudGltZXIpOwogIGlmIChzdGF0ZSA9PT0gJ3NhdmVkJykg',
  'eyAgICAgICAgICAgICAgICAgICAgICAgLy8g4LmC4LiK4Lin4LmMICLguJrguLHguJnguJfguLbguIHguYHguKXguYnguKciIOC5geC4m+C5iuC4muC5gOC4lOC4teC4ouC4p+C5geC4peC5ieC4p+C4geC4peC4seC4muC5hOC4m+C4m+C4geC4leC4tAogICAgU1lO',
  'Qy50aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXsKICAgICAgaWYgKFNZTkMuc3RhdGUgPT09ICdzYXZlZCcpIHN5bmNTZXQoJ3N5bmNlZCcpOwogICAgfSwgMjYwMCk7CiAgfQp9CgpmdW5jdGlvbiBzeW5jUGFpbnQoKXsKICB2YXIgZG90ID0gZG9jdW1lbnQu',
  'Z2V0RWxlbWVudEJ5SWQoJ2xpdmVEb3QnKTsKICBpZiAoIWRvdCkgcmV0dXJuOwogIHZhciBsb29rID0gU1lOQ19MT09LW1NZTkMuc3RhdGVdIHx8IFNZTkNfTE9PSy5zeW5jZWQ7CgogIHZhciB0aXAgPSBTWU5DLmRldGFpbCB8fCBzeW5jVG9vbHRpcCgpOwogIC8v',
  'IOC4q+C5iOC4reC4guC5ieC4reC4hOC4p+C4suC4oeC5hOC4p+C5iSDguYDguJ7guLfguYjguK3guYPguKvguYnguIjguK3guYHguITguJrguIvguYjguK3guJnguYDguInguJ7guLLguLDguILguYnguK3guITguKfguLLguKHguYHguKXguLDguKLguLHguIfguYDg',
  'uKvguYfguJnguYTguK3guITguK3guJnguK3guKLguLnguYgKICB2YXIgYm9keSA9IChsb29rLnNwaW4gPyAnPHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4gJyA6IChsb29rLmljb24gPyBsb29rLmljb24gKyAnICcgOiAnJykpICsKICAgICAgICAgICAgICc8c3Bh',
  'biBjbGFzcz0ic3luYy1sYWJlbCI+JyArIGxvb2sudGV4dCArICc8L3NwYW4+JzsKICB2YXIgY2xzID0gJ2IgJyArIGxvb2suY2xzICsgJyBzeW5jLXBpbGwnOwoKICBkb3QuaW5uZXJIVE1MID0gbG9vay5jbGljawogICAgPyAnPGJ1dHRvbiBjbGFzcz0iJyArIGNs',
  'cyArICciIHN0eWxlPSJib3JkZXI6MDtjdXJzb3I6cG9pbnRlcjtmb250OmluaGVyaXQiICcgKwogICAgICAndGl0bGU9IicgKyBlc2ModGlwKSArICciIG9uY2xpY2s9IicgKyBsb29rLmNsaWNrICsgJyI+JyArIGJvZHkgKyAnPC9idXR0b24+JwogICAgOiAnPHNw',
  'YW4gY2xhc3M9IicgKyBjbHMgKyAnIiB0aXRsZT0iJyArIGVzYyh0aXApICsgJyI+JyArIGJvZHkgKyAnPC9zcGFuPic7Cn0KCmZ1bmN0aW9uIHN5bmNUb29sdGlwKCl7CiAgdmFyIGJhc2UgPSByZWZyZXNoTGFiZWwoUE9MTF9TRUNPTkRTKSArICcgwrcg4LmE4Lih',
  '4LmI4LmC4Lir4Lil4LiU4LiX4Lix4Lia4LiV4Lit4LiZ4LiB4Liz4Lil4Lix4LiH4LiB4Lij4Lit4LiB4LiC4LmJ4Lit4Lih4Li54LilJzsKICBpZiAoIVNZTkMuYXQpIHJldHVybiBiYXNlOwogIHZhciBkID0gbmV3IERhdGUoU1lOQy5hdCk7CiAgdmFyIGhoID0g',
  'KCcwJyArIGQuZ2V0SG91cnMoKSkuc2xpY2UoLTIpLCBtbSA9ICgnMCcgKyBkLmdldE1pbnV0ZXMoKSkuc2xpY2UoLTIpOwogIHJldHVybiAn4LiV4Lij4LiH4LiB4Lix4Lia4LiC4LmJ4Lit4Lih4Li54Lil4Lir4Lil4Lix4LiH4Lia4LmJ4Liy4LiZ4LmA4Lih4Li3',
  '4LmI4LitICcgKyBoaCArICc6JyArIG1tICsgJyDguJkuXG4nICsgYmFzZTsKfQoKLyoqIOC5gOC4meC5h+C4leC4quC4sOC4lOC4uOC4lC/guKvguKXguLjguJQg4LiV4LmI4Liy4LiH4LiI4Liy4LiBICLguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYzg',
  'uJXguK3guJrguKfguYjguLLguJfguLPguYTguKHguYjguYTguJTguYkiIOC4i+C4tuC5iOC4h+C5gOC4m+C5h+C4meC4hOC4p+C4suC4oeC4nOC4tOC4lOC4guC4reC4h+C4hOC4s+C4quC4seC5iOC4hyAqLwpmdW5jdGlvbiBpc09mZmxpbmVFcnJvcihlKXsKICBp',
  'ZiAodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLm9uTGluZSA9PT0gZmFsc2UpIHJldHVybiB0cnVlOwogIHZhciBtID0gU3RyaW5nKChlICYmIGUubWVzc2FnZSkgfHwgZSB8fCAnJyk7CiAgcmV0dXJuIC9uZXR3b3JrfGZhaWxl',
  'ZHx0aW1lb3V0fOC5gOC4hOC4o+C4t+C4reC4guC5iOC4suC4onzguYDguIrguLfguYjguK3guKHguJXguYjguK184LmE4Lih4LmI4LmE4LiU4LmJ4Lij4Lix4Lia4LiC4LmJ4Lit4Lih4Li54Lil4LiI4Liy4LiB4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij',
  '4LmML2kudGVzdChtKTsKfQoKLyoqIOC4nOC4ueC5ieC5g+C4iuC5ieC4geC4lOC4l+C4teC5iOC4leC4seC4p+C4muC4reC4geC4quC4luC4suC4meC4sOC4leC4reC4meC4oeC4teC4m+C4seC4jeC4q+C4siDigJQg4Lil4Lit4LiH4LmD4Lir4Lih4LmI4LiX4Lix',
  '4LiZ4LiX4Li1ICovCmZ1bmN0aW9uIHJldHJ5U3luYygpewogIFNZTkMuc3RhdGUgPSAnc3luY2luZyc7CiAgc3luY1BhaW50KCk7CiAgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwp9CgovKiog4LmC4Lir4Lil4LiU4LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmI',
  '4LiV4Lit4LiZ4LiX4Li14LmI4Lic4Li54LmJ4LmD4LiK4LmJ4Lie4Lij4LmJ4Lit4LihICjguIHguJTguIjguLLguIHguJvguYnguLLguKIgIuC4oeC4teC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C4oeC5iCIpICovCmZ1bmN0aW9uIGxvYWRQZW5kaW5nKCl7CiAg',
  'U1lOQy5zdGF0ZSA9ICdzeW5jaW5nJzsKICBzeW5jUGFpbnQoKTsKICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7Cn0KCnZhciBQT0xMX1NFQ09ORFMgPSAwOwp2YXIgUE9MTF9USU1FUiA9IG51bGw7CgpmdW5jdGlvbiBzdGFydFBvbGxpbmcoc2Vjb25kcyl7CiAgdmFy',
  'IHNlYyA9IE51bWJlcihzZWNvbmRzIHx8IDApOwogIFBPTExfU0VDT05EUyA9IHNlYzsKICBjbGVhckludGVydmFsKFBPTExfVElNRVIpOwoKICBpZiAoIXNlYykgeyBzeW5jU2V0KCdwYXVzZWQnKTsgcmV0dXJuOyB9ICAgLy8g4Lib4Li04LiU4LiB4Liy4Lij4LiV',
  '4Lij4Lin4LiI4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0IOKAlCDguIHguJTguJfguLXguYjguJvguYnguLLguKLguYDguJ7guLfguYjguK3guIvguLTguIfguIHguYzguYDguK3guIfguYTguJTguYkKICBzeW5jU2V0KCdzeW5jZWQnKTsKCiAgUE9MTF9USU1F',
  'UiA9IHNldEludGVydmFsKGZ1bmN0aW9uKCl7CiAgICBpZiAoZG9jdW1lbnQuaGlkZGVuKSByZXR1cm47CiAgICBjYWxsQXBpKCdhcHAudmVyc2lvbicpLnRoZW4oZnVuY3Rpb24odil7CiAgICAgIGlmIChTWU5DLnN0YXRlID09PSAnb2ZmbGluZScpIHN5bmNTZXQo',
  'J3N5bmNlZCcpOyAgIC8vIOC4geC4peC4seC4muC4oeC4suC4leC5iOC4reC5hOC4lOC5ieC5geC4peC5ieC4pwogICAgICBpZiAoIXYgfHwgIXYudmVyc2lvbiB8fCB2LnZlcnNpb24gPT09IFMudmVyc2lvbikgcmV0dXJuOwogICAgICBTLnZlcnNpb24gPSB2LnZl',
  'cnNpb247CgogICAgICAvLyDguYDguKPguLLguYDguJvguYfguJnguITguJnguYHguIHguYnguYDguK3guIcg4LmB4Lil4Liw4Lir4LiZ4LmJ4Liy4LiB4LmH4LiL4Li04LiH4LiB4LmM4LmE4Lib4LmB4Lil4LmJ4Lin4LiV4Lit4LiZ4LiB4LiU4Lia4Lix4LiZ4LiX',
  '4Li24LiBCiAgICAgIGlmIChEYXRlLm5vdygpIDwgUy5zZWxmQ2hhbmdlVW50aWwpIHJldHVybjsKCiAgICAgIC8vIOC4geC4s+C4peC4seC4h+C4geC4o+C4reC4geC4guC5ieC4reC4oeC4ueC4peC4reC4ouC4ueC5iCDigJQg4Lir4LmJ4Liy4Lih4LmC4Lir4Lil',
  '4LiU4LiX4Lix4LiaIOC4o+C4reC5g+C4q+C5ieC4nOC4ueC5ieC5g+C4iuC5ieC4geC4lOC5gOC4reC4hwogICAgICBpZiAodXNlcklzQnVzeSgpKSB7IHN5bmNTZXQoJ3BlbmRpbmcnKTsgcmV0dXJuOyB9CgogICAgICAvLyDguIvguLTguIfguIHguYzguYDguIfg',
  'uLXguKLguJog4LmGIOC5hOC4oeC5iOC4peC5ieC4suC4h+C4q+C4meC5ieC4siDguYTguKHguYjguYDguJTguYnguIfguIHguKXguLHguJrguYTguJvguJrguJnguKrguLjguJQKICAgICAgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwogICAgICByZWZyZXNoQWxlcnRz',
  'KCk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgc3luY1NldChpc09mZmxpbmVFcnJvcihlKSA/ICdvZmZsaW5lJyA6ICdlcnJvcicsIChlICYmIGUubWVzc2FnZSkgfHwgU3RyaW5nKGUpKTsKICAgIH0pOwogIH0sIHNlYyAqIDEwMDApOwp9CgovKiAt',
  'LS0tLS0tLS0tLS0tLS0tIOC4qOC4ueC4meC4ouC5jOC5geC4iOC5ieC4h+C5gOC4leC4t+C4reC4mSAtLS0tLS0tLS0tLS0tLS0tCgogICDguJXguLHguKfguYDguKXguILguJrguJnguYDguKHguJnguLkgKOC5gOC4iuC5iOC4mSA2IOC4q+C4peC4seC4hyAi4Lil',
  '4LmJ4Liy4LiH4LmB4Lit4Lij4LmMIikg4LiB4Lix4Lia4LiB4Lil4LmI4Lit4LiH4LmB4LiI4LmJ4LiH4LmA4LiV4Li34Lit4LiZ4Lia4LiZ4LmB4LiW4Lia4Lir4Lix4LinCiAgIOC5g+C4iuC5ieC4guC5ieC4reC4oeC4ueC4peC4iuC4uOC4lOC5gOC4lOC4teC4',
  'ouC4p+C4geC4seC4meC4iOC4suC4geC4hOC4s+C4quC4seC5iOC4hyBhcHAuYWxlcnRzIOC4i+C4tuC5iOC4h+C5gOC4muC4suC4geC4p+C5iOC4suC5geC4lOC4iuC4muC4reC4o+C5jOC4lOC4oeC4suC4gQoKICAg4Lit4Lix4Lib4LmA4LiU4LiV4LmA4Lih4Li3',
  '4LmI4LitOiDguYDguJvguLTguJTguKPguLDguJrguJogwrcg4Lir4Lil4Lix4LiH4LiB4LiU4Lia4Lix4LiZ4LiX4Li24LiBL+C4peC4muC4l+C4uOC4geC4hOC4o+C4seC5ieC4hyDCtyDguJfguLjguIHguKPguK3guJrguJXguKPguKfguIjguILguYnguK3guKHg',
  'uLnguKUKICAg4LmA4LiU4Li04Lih4LiV4Lix4Lin4LmA4Lil4LiC4LiZ4Li14LmJ4Lit4Lix4Lib4LmA4LiU4LiV4LiV4Lit4LiZ4LmA4Lib4Li04LiU4Lir4LiZ4LmJ4Liy4LmB4LiU4LiK4Lia4Lit4Lij4LmM4LiU4Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii',
  '4LinCiAgIOC5hOC4m+C4reC4ouC4ueC5iOC4q+C4meC5ieC4suC4reC4t+C5iOC4meC5geC4peC5ieC4p+C4leC4seC4p+C5gOC4peC4guC4iOC4tuC4h+C4hOC5ieC4suC4h+C4reC4ouC4ueC5iOC4l+C4teC5iOC4hOC5iOC4suC5gOC4geC5iOC4sgotLS0tLS0t',
  'LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi8KCnZhciBBTEVSVFMgPSB7IGNvdW50czoge30sIGl0ZW1zOiBbXSwgdG90YWw6IDAsIHVyZ2VudDogMCwgYXQ6ICcnIH07CgovKgogKiAi4LmA4Lir4LmH',
  '4LiZ4LmB4Lil4LmJ4LinIiDigJQg4LiV4Lix4Lin4LmA4Lil4LiC4Lia4LiZ4LiB4Lij4Liw4LiU4Li04LmI4LiH4LiZ4Lix4Lia4LmA4LiJ4Lie4Liy4Liw4LmA4Lij4Li34LmI4Lit4LiH4LiX4Li14LmI4Lii4Lix4LiH4LmE4Lih4LmI4LmA4LiE4Lii4LmA4Lir',
  '4LmH4LiZCiAqIOC5gOC4m+C4tOC4lOC4geC4peC5iOC4reC4h+C4lOC4ueC5geC4peC5ieC4p+C4leC4seC4p+C5gOC4peC4guC4q+C4suC4oiDguYHguJXguYjguKPguLLguKLguIHguLLguKPguKLguLHguIfguK3guKLguLnguYjguYPguJnguIHguKXguYjguK3g',
  'uIfguIjguJnguIHguKfguYjguLLguIjguLDguYHguIHguYnguJfguLXguYjguJXguYnguJnguYDguKvguJXguLgKICog4LmA4Lij4Li34LmI4Lit4LiH4LmD4Lir4Lih4LmI4Lir4Lij4Li34Lit4LmA4Lij4Li34LmI4Lit4LiH4LmA4LiU4Li04Lih4LiX4Li14LmI',
  '4Lir4LiZ4Lix4LiB4LiC4Li24LmJ4LiZICjguYDguIrguYjguJkg4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LmA4Lie4Li04LmI4LiH4LmA4Lil4Lii4LiB4Liz4Lir4LiZ4LiUKSDguYTguJTguYnguKPguKvguLHguKrguYPguKvguKHguYgg4LiV4Lix4Lin4LmA4Lil',
  '4LiC4LiI4Li24LiH4LiB4Lil4Lix4Lia4Lih4Liy4LmA4Lit4LiHCiAqCiAqIOC4peC5h+C4reC4geC4reC4tOC4meC4lOC5ieC4p+C4ouC4muC4seC4jeC4iuC4tSDihpIg4LiI4Liz4LmE4Lin4LmJ4LiX4Li14LmI4Lia4Lix4LiN4LiK4Li1ICjguYDguJvguLTg',
  'uJTguKHguLfguK3guJbguLfguK3guKvguKPguLfguK3guITguK3guKHguIHguYfguJXguKPguIfguIHguLHguJkpCiAqIOC5gOC4guC5ieC4suC4lOC5ieC4p+C4ouC4geC4uOC4jeC5geC4iC/guKXguLTguIfguIHguYzguYHguIrguKPguYwgKOC5hOC4oeC5iOC4',
  'oeC4teC4muC4seC4jeC4iuC4tSkg4oaSIOC4iOC4s+C5hOC4p+C5ieC5g+C4meC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5iQogKi8KdmFyIFNFRU5fTE9DQUxfS0VZID0gJ21jb3JuZXIuYWxlcnRTZWVuJzsKdmFyIE5PVElGX05FVyA9IHt9OyAgICAgIC8v',
  'IOC5gOC4o+C4t+C5iOC4reC4h+C4l+C4teC5iCAi4LmD4Lir4Lih4LmIIiDguJXguK3guJnguYDguJvguLTguJTguIHguKXguYjguK3guIfguKPguK3guJrguJnguLXguYkg4oCUIOC4ouC4seC4h+C4leC4tOC4lOC4m+C5ieC4suC4ouC5g+C4q+C4oeC5iOC5g+C4',
  'q+C5ieC5gOC4q+C5h+C4meC4iOC4meC4geC4p+C5iOC4suC4iOC4sOC4m+C4tOC4lOC4geC4peC5iOC4reC4hwp2YXIgU0VFTl9USElTX1BBR0UgPSB7fTsgLy8g4LiI4LiU4LmA4Lir4LmH4LiZ4LmB4Lil4LmJ4Lin4LmE4Lib4LmB4Lil4LmJ4Lin4LiV4Lix4LmJ',
  '4LiH4LmB4LiV4LmI4LmA4Lib4Li04LiU4Lir4LiZ4LmJ4LiyIOKAlCDguIHguLHguJnguJzguKXguK3guYjguLLguJnguJfguLXguYjguKrguYjguIfguKHguLLguIHguYjguK3guJnguJrguLHguJnguJfguLbguIHguYDguKrguKPguYfguIgg4LiX4Liz4LmD4Lir',
  '4LmJ4LiV4Lix4Lin4LmA4Lil4LiC4LmA4LiU4LmJ4LiH4LiB4Lil4Lix4LiaCgpmdW5jdGlvbiBsb2NhbFNlZW4oKXsKICB0cnkgeyB2YXIgdiA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oU0VFTl9MT0NBTF9LRVkpIHx8ICdbXScpOyByZXR1cm4g',
  'QXJyYXkuaXNBcnJheSh2KSA/IHYgOiBbXTsgfQogIGNhdGNoIChlKSB7IHJldHVybiBbXTsgfQp9CgovKiog4LiU4Lix4LiK4LiZ4Li14LiC4Lit4LiH4LiX4Li44LiB4LmA4Lij4Li34LmI4Lit4LiHICjguKPguLLguKLguKXguLDguYDguK3guLXguKLguJTguK3g',
  'uLLguIjguKrguYjguIfguKHguLLguYTguKHguYjguITguKPguJog4LmB4LiV4LmI4LiU4Lix4LiK4LiZ4Li14LiE4Lij4Lia4LmA4Liq4Lih4LitKSAqLwpmdW5jdGlvbiBhbGVydEluZGV4KCl7CiAgcmV0dXJuIEFMRVJUUy5pbmRleCB8fCAoQUxFUlRTLml0ZW1z',
  'IHx8IFtdKS5tYXAoZnVuY3Rpb24oYSl7IHJldHVybiB7IGtleTogYS5rZXksIG1vZHVsZTogYS5tb2R1bGUsIGxldmVsOiBhLmxldmVsLCBzZWVuOiBhLnNlZW4gfTsgfSk7Cn0KCi8qCiAqIOC4o+C4q+C4seC4qiA9ICLguJXguYnguJnguYDguKPguLfguYjguK3g',
  'uIcj4Lij4Liw4LiU4Lix4LiaIiDigJQg4LmA4Lir4LmH4LiZ4LmB4Lil4LmJ4Lin4LiW4LmJ4Liy4LmA4LiE4Lii4LmA4Lir4LmH4LiZ4LiV4LmJ4LiZ4LmA4Lij4Li34LmI4Lit4LiH4LmA4LiU4Li14Lii4Lin4LiB4Lix4LiZ4LiX4Li14LmI4Lij4Liw4LiU4Lix',
  '4Lia4LmA4LiX4LmI4Liy4LiZ4Li14LmJ4Lir4Lij4Li34Lit4Lir4LiZ4Lix4LiB4LiB4Lin4LmI4LiyCiAqICjguIHguJXguLTguIHguLLguYDguJTguLXguKLguKfguIHguLHguJogYWxlcnRLZXlTZWVuXyDguJ3guLHguYjguIfguYDguIvguLTguKPguYzguJ/g',
  'uYDguKfguK3guKPguYwpIOC5gOC4o+C4t+C5iOC4reC4h+C4q+C4meC4seC4geC4guC4tuC5ieC4meC5gOC4leC4t+C4reC4meC4reC4teC4gSDCtyDguYDguJrguLLguKXguIfguYTguKHguYjguYDguJXguLfguK3guJnguIvguYnguLMKICovCmZ1bmN0aW9uIGFs',
  'ZXJ0QmFzZShrKXsgayA9IFN0cmluZyhrKTsgdmFyIGkgPSBrLmxhc3RJbmRleE9mKCcjJyk7IHJldHVybiBpIDwgMCA/IGsgOiBrLnNsaWNlKDAsIGkpOyB9CmZ1bmN0aW9uIGFsZXJ0UmFuayhrKXsgayA9IFN0cmluZyhrKTsgdmFyIGkgPSBrLmxhc3RJbmRleE9m',
  'KCcjJyk7IHJldHVybiBpIDwgMCA/IDAgOiAoTnVtYmVyKGsuc2xpY2UoaSArIDEpKSB8fCAwKTsgfQoKLyoqIOC4o+C4sOC4lOC4seC4muC4quC4ueC4h+C4quC4uOC4lOC4l+C4teC5iOC5gOC4q+C5h+C4meC5geC4peC5ieC4p+C4guC4reC4h+C5geC4leC5iOC4',
  'peC4sOC4leC5ieC4meC5gOC4o+C4t+C5iOC4reC4hyDigJQg4LiE4Liz4LiZ4Lin4LiT4LiE4Lij4Lix4LmJ4LiH4LmA4LiU4Li14Lii4Lin4LiV4LmI4Lit4LiB4Liy4Lij4Lin4Liy4LiUICovCmZ1bmN0aW9uIHNlZW5TZXQoKXsKICB2YXIgYmVzdCA9IHt9Owog',
  'IGZ1bmN0aW9uIGFkZChrKXsgdmFyIGIgPSBhbGVydEJhc2UoayksIHIgPSBhbGVydFJhbmsoayk7IGlmICghKGIgaW4gYmVzdCkgfHwgciA+IGJlc3RbYl0pIGJlc3RbYl0gPSByOyB9CiAgT2JqZWN0LmtleXMoU0VFTl9USElTX1BBR0UpLmZvckVhY2goYWRkKTsK',
  'ICBpZiAoQUxFUlRTLnNlZW5TdG9yZSA9PT0gJ2FjY291bnQnKSBhbGVydEluZGV4KCkuZm9yRWFjaChmdW5jdGlvbihhKXsgaWYgKGEuc2VlbikgYWRkKGEua2V5KTsgfSk7CiAgZWxzZSBsb2NhbFNlZW4oKS5mb3JFYWNoKGFkZCk7CiAgcmV0dXJuIGJlc3Q7Cn0K',
  'ZnVuY3Rpb24gaXNTZWVuSW4oYmVzdCwga2V5KXsgdmFyIGIgPSBhbGVydEJhc2Uoa2V5KTsgcmV0dXJuIChiIGluIGJlc3QpICYmIGJlc3RbYl0gPj0gYWxlcnRSYW5rKGtleSk7IH0KZnVuY3Rpb24gdW5zZWVuQWxlcnRzKGJlc3QpewogIGJlc3QgPSBiZXN0IHx8',
  'IHNlZW5TZXQoKTsKICByZXR1cm4gYWxlcnRJbmRleCgpLmZpbHRlcihmdW5jdGlvbihhKXsgcmV0dXJuICFpc1NlZW5JbihiZXN0LCBhLmtleSk7IH0pOwp9CgovKiog4LiI4LiU4Lin4LmI4Liy4LmA4Lir4LmH4LiZ4LmB4Lil4LmJ4Lin4LiX4Li44LiB4LmA4Lij',
  '4Li34LmI4Lit4LiH4LiX4Li14LmI4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmI4LiV4Lit4LiZ4LiZ4Li14LmJICjguYDguJvguLTguJTguIHguKXguYjguK3guIcgPSDguYDguKvguYfguJnguJfguLHguYnguIfguKvguKHguJQg4Lij4Lin4Lih4LmA4Lij4Li34LmI',
  '4Lit4LiH4LiX4Li14LmI4Lit4Lii4Li54LmI4LmA4LiB4Li04LiZ4Lir4LiZ4LmJ4Liy4Lil4LiwIDgpICovCmZ1bmN0aW9uIG1hcmtBbGVydHNTZWVuKCl7CiAgdmFyIGZyZXNoID0gdW5zZWVuQWxlcnRzKCk7CiAgaWYgKCFmcmVzaC5sZW5ndGgpIHJldHVybjsK',
  'ICB2YXIga2V5cyA9IGZyZXNoLm1hcChmdW5jdGlvbihhKXsgcmV0dXJuIGEua2V5OyB9KTsKICBrZXlzLmZvckVhY2goZnVuY3Rpb24oayl7IE5PVElGX05FV1trXSA9IHRydWU7IFNFRU5fVEhJU19QQUdFW2tdID0gdHJ1ZTsgfSk7CiAgdmFyIGxpdmUgPSBhbGVy',
  'dEluZGV4KCkubWFwKGZ1bmN0aW9uKGEpeyByZXR1cm4gYS5rZXk7IH0pOwogIGlmIChBTEVSVFMuc2VlblN0b3JlID09PSAnYWNjb3VudCcpIHsKICAgIC8vIOC4quC5iOC4hyAi4LiX4Li44LiB4LmA4Lij4Li34LmI4Lit4LiH4LiX4Li14LmI4LmA4Lir4LmH4LiZ',
  '4LmB4Lil4LmJ4LinIiDguJfguLjguIHguITguKPguLHguYnguIcg4LmE4Lih4LmI4LmD4LiK4LmI4LmB4LiE4LmI4LiX4Li14LmI4LmA4Lie4Li04LmI4LihIOKAlCDguITguLPguILguK3guKrguK3guIfguK3guLHguJnguJfguLXguYjguIvguYnguK3guJnguIHg',
  'uLHguJnguIjguLDguYTguJTguYnguYTguKHguYjguJfguLHguJrguIHguLHguJnguIjguJnguJrguLLguIfguYDguKPguLfguYjguK3guIfguKvguLLguKIKICAgIHZhciBhbGwgPSBhbGVydEluZGV4KCkuZmlsdGVyKGZ1bmN0aW9uKGEpeyByZXR1cm4gYS5zZWVu',
  'IHx8IFNFRU5fVEhJU19QQUdFW2Eua2V5XTsgfSkKICAgICAgLm1hcChmdW5jdGlvbihhKXsgcmV0dXJuIGEua2V5OyB9KTsKICAgIGNhbGxBcGkoJ2FwcC5hbGVydHNTZWVuJywgeyBrZXlzOiBhbGwsIGxpdmU6IGxpdmUgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9u',
  'KCl7IC8qIOC4muC4seC4meC4l+C4tuC4geC5hOC4oeC5iOC4nOC5iOC4suC4mSDguYPguKvguYnguJXguLHguKfguYDguKXguILguIHguKXguLHguJrguKHguLIg4LiI4Liw4LmE4LiU4LmJ4Lij4Li54LmJ4Lin4LmI4Liy4Lii4Lix4LiH4LmE4Lih4LmI4LmE4LiU',
  '4LmJ4LiI4LiU4LmE4Lin4LmJICovIGZvcmdldFBlbmRpbmdTZWVuKGtleXMpOyB9KTsKICB9IGVsc2UgewogICAgLy8g4LmA4LiB4LmH4Lia4LmA4LiJ4Lie4Liy4Liw4LmA4Lij4Li34LmI4Lit4LiH4LiX4Li14LmI4Lii4Lix4LiH4LiE4LmJ4Liy4LiH4Lit4Lii',
  '4Li54LmIIOC4l+C4teC5iOC5geC4geC5ieC5hOC4m+C5geC4peC5ieC4p+C4leC4seC4lOC4l+C4tOC5ieC4hyDguYTguKHguYjguYPguKvguYnguJrguKfguKHguILguLbguYnguJnguYDguKPguLfguYjguK3guKIg4LmGCiAgICB2YXIgbGl2ZVNldCA9IHt9OyBs',
  'aXZlLmZvckVhY2goZnVuY3Rpb24oayl7IGxpdmVTZXRbYWxlcnRCYXNlKGspXSA9IHRydWU7IH0pOwogICAgdmFyIGtlZXAgPSBsb2NhbFNlZW4oKS5maWx0ZXIoZnVuY3Rpb24oayl7IHJldHVybiBsaXZlU2V0W2FsZXJ0QmFzZShrKV07IH0pLmNvbmNhdChrZXlz',
  'KTsKICAgIHRyeSB7IGxvY2FsU3RvcmFnZS5zZXRJdGVtKFNFRU5fTE9DQUxfS0VZLCBKU09OLnN0cmluZ2lmeShrZWVwKSk7IH0gY2F0Y2ggKGUpIHsgLyog4LmC4Lir4Lih4LiU4Liq4LmI4Lin4LiZ4LiV4Lix4LinICovIH0KICB9CiAgcGFpbnRCYWRnZXMoKTsK',
  'ICBwYWludEJlbGwoKTsKfQovKiog4Lia4Lix4LiZ4LiX4Li24LiB4LmA4Lir4LmH4LiZ4LmB4Lil4LmJ4Lin4LmE4Lih4LmI4Lic4LmI4Liy4LiZICjguYDguJnguYfguJXguKvguKXguLjguJQpIOKAlCDguYDguK3guLLguK3guK3guIHguIjguLLguIHguJfguLXg',
  'uYjguIjguLPguYTguKfguYkg4Lij4Lit4Lia4Lir4LiZ4LmJ4Liy4LiX4Li14LmI4LmA4Lib4Li04LiU4LiB4Lil4LmI4Lit4LiH4LiI4Liw4Liq4LmI4LiH4LmD4Lir4Lih4LmIICovCmZ1bmN0aW9uIGZvcmdldFBlbmRpbmdTZWVuKGtleXMpewogIGtleXMuZm9y',
  'RWFjaChmdW5jdGlvbihrKXsgZGVsZXRlIFNFRU5fVEhJU19QQUdFW2tdOyB9KTsKICBwYWludEJhZGdlcygpOwogIHBhaW50QmVsbCgpOwp9CgpmdW5jdGlvbiByZWZyZXNoQWxlcnRzKCl7CiAgcmV0dXJuIGNhbGxBcGkoJ2FwcC5hbGVydHMnKS50aGVuKGZ1bmN0',
  'aW9uKGEpewogICAgQUxFUlRTID0gYSB8fCBBTEVSVFM7CiAgICB2YXIgb3BlbiA9ICEhZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25vdGlmUGFuZWwnKTsKICAgIGlmIChvcGVuKSBtYXJrQWxlcnRzU2VlbigpOyAgICAgICAgICAgLy8g4LmA4Lib4Li04LiU4LiU',
  '4Li54Lit4Lii4Li54LmIIOC5gOC4o+C4t+C5iOC4reC4h+C4l+C4teC5iOC5gOC4nuC4tOC5iOC4h+C5gOC4guC5ieC4suC4oeC4suC4geC5h+C4luC4t+C4reC4p+C5iOC4suC5gOC4q+C5h+C4meC5geC4peC5ieC4pwogICAgcGFpbnRCYWRnZXMoKTsKICAgIHBh',
  'aW50QmVsbCgpOwogICAgaWYgKG9wZW4pIHJlbmRlck5vdGlmUGFuZWwoKTsgICAgICAgICAvLyDguYDguJvguLTguJTguITguYnguLLguIfguK3guKLguLnguYgg4LmD4Lir4LmJ4Lit4Lix4Lib4LmA4LiU4LiV4LiV4Liy4LihCiAgICByZXR1cm4gYTsKICB9KS5j',
  'YXRjaChmdW5jdGlvbigpeyAvKiDguYDguJnguYfguJXguKrguLDguJTguLjguJQg4LmE4Lin4LmJ4Lij4Lit4Lia4Lir4LiZ4LmJ4LiyICovIH0pOwp9CgovKioKICog4LiV4Lix4Lin4LmA4Lil4LiC4Lia4LiZ4LmA4Lih4LiZ4Li54LiL4LmJ4Liy4LiiIOKAlCDg',
  'uIjguLPguJnguKfguJnguYDguKPguLfguYjguK3guIfguJfguLXguYjguKLguLHguIfguITguYnguLLguIfguILguK3guIfguYHguJXguYjguKXguLDguKvguJnguYnguLIgKOC4leC4o+C4h+C4geC4seC4muC4iOC4s+C4meC4p+C4meC5g+C4meC4geC4peC5iOC4',
  'reC4h+C5geC4iOC5ieC4h+C5gOC4leC4t+C4reC4meC5gOC4quC4oeC4rSkKICog4Lih4Li14LmA4Lij4Li34LmI4Lit4LiH4LiX4Li14LmI4Lii4Lix4LiH4LmE4Lih4LmI4LmA4LiE4Lii4LmA4Lir4LmH4LiZID0g4Liq4Li14Liq4LmJ4Lih4LmA4LiU4LmI4LiZ',
  'IMK3IOC5gOC4q+C5h+C4meC4hOC4o+C4muC5geC4peC5ieC4pyA9IOC4quC4teC4iOC4suC4hyDguKLguLHguIfguJrguK3guIHguIjguLPguJnguKfguJnguITguYnguLLguIfguYHguJXguYjguYTguKHguYjguYDguKPguLXguKLguIHguKPguYnguK3guIfguITg',
  'uKfguLLguKHguKrguJnguYPguIgKICovCmZ1bmN0aW9uIHBhaW50QmFkZ2VzKCl7CiAgdmFyIGMgPSBBTEVSVFMuY291bnRzIHx8IHt9OwogIHZhciBmcmVzaCA9IHt9OwogIHVuc2VlbkFsZXJ0cygpLmZvckVhY2goZnVuY3Rpb24oYSl7IGZyZXNoW2EubW9kdWxl',
  'XSA9IChmcmVzaFthLm1vZHVsZV0gfHwgMCkgKyAxOyB9KTsKICBQQUdFUy5mb3JFYWNoKGZ1bmN0aW9uKHApeyBzZXRCYWRnZShwLmlkLCBjW3AuaWRdIHx8IDAsIChmcmVzaFtwLmlkXSB8fCAwKSA9PT0gMCwgZnJlc2gpOyB9KTsKfQoKZnVuY3Rpb24gc2V0QmFk',
  'Z2UocGFnZSwgbiwgc2VlbiwgZnJlc2gpewogIFtkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmFkZ2UtJyArIHBhZ2UpLCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFiYmFkZ2UtJyArIHBhZ2UpXQogICAgLmZvckVhY2goZnVuY3Rpb24oZWwpeyBpZiAoZWwp',
  'IHBhaW50QmFkZ2UoZWwsIG4sIHNlZW4pOyB9KTsKCiAgLy8g4LiH4Liy4LiZ4LiE4LmJ4Liy4LiH4LiC4Lit4LiH4Lir4LiZ4LmJ4Liy4LiX4Li14LmI4LmE4Lih4LmI4Lih4Li14LmB4LiX4LmH4LiaIOC5g+C4q+C5ieC5hOC4m+C4o+C4p+C4oeC4reC4ouC4ueC5',
  'iOC4l+C4teC5iOC4m+C4uOC5iOC4oSAi4LmA4Lie4Li04LmI4Lih4LmA4LiV4Li04LihIiDguYTguKHguYjguIfguLHguYnguJnguJrguJnguKHguLfguK3guJbguLfguK3guIjguLDguKHguK3guIfguYTguKHguYjguYDguKvguYfguJnguYDguKXguKIKICB2YXIg',
  'bW9yZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YWJiYWRnZS1tb3JlJyk7CiAgaWYgKG1vcmUpIHsKICAgIHZhciBoaWRkZW5QYWdlcyA9IFBBR0VTLmZpbHRlcihmdW5jdGlvbihwKXsgcmV0dXJuICFwLnRhYjsgfSk7CiAgICB2YXIgaGlkZGVuID0gaGlk',
  'ZGVuUGFnZXMucmVkdWNlKGZ1bmN0aW9uKGEsIHApeyByZXR1cm4gYSArICgoQUxFUlRTLmNvdW50cyB8fCB7fSlbcC5pZF0gfHwgMCk7IH0sIDApOwogICAgZnJlc2ggPSBmcmVzaCB8fCB7fTsKICAgIHZhciBoaWRkZW5GcmVzaCA9IGhpZGRlblBhZ2VzLnJlZHVj',
  'ZShmdW5jdGlvbihhLCBwKXsgcmV0dXJuIGEgKyAoZnJlc2hbcC5pZF0gfHwgMCk7IH0sIDApOwogICAgcGFpbnRCYWRnZShtb3JlLCBoaWRkZW4sIGhpZGRlbkZyZXNoID09PSAwKTsKICB9Cn0KCmZ1bmN0aW9uIHBhaW50QmFkZ2UoZWwsIG4sIHNlZW4pewogIGlm',
  'IChuID4gMCkgewogICAgZWwudGV4dENvbnRlbnQgPSBuID4gOTkgPyAnOTkrJyA6IG47CiAgICBlbC5zdHlsZS5kaXNwbGF5ID0gJyc7CiAgICBlbC5jbGFzc0xpc3QudG9nZ2xlKCdzZWVuJywgISFzZWVuKTsKICAgIGVsLnRpdGxlID0gJ+C4ouC4seC4h+C4hOC5',
  'ieC4suC4h+C4reC4ouC4ueC5iCAnICsgbiArICcg4Lij4Liy4Lii4LiB4Liy4LijJyArIChzZWVuID8gJyAo4LmA4Lir4LmH4LiZ4LmB4Lil4LmJ4LinKScgOiAnJyk7CiAgfSBlbHNlIHsKICAgIGVsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7CiAgfQp9CgovKiAt',
  'LS0tIOC4geC4o+C4sOC4lOC4tOC5iOC4h+C4muC4meC5geC4luC4muC4q+C4seC4pyAtLS0tICovCgpmdW5jdGlvbiBwYWludEJlbGwoKXsKICB2YXIgd3JhcCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiZWxsV3JhcCcpOwogIGlmICghd3JhcCkgcmV0dXJu',
  'OwoKICAvLyDguKfguLLguJTguYDguInguJ7guLLguLDguJXguLHguKfguJvguLjguYjguKEg4Lir4LmJ4Liy4Lih4LmA4LiC4Li14Lii4LiZ4LiX4Lix4Lia4LiX4Lix4LmJ4LiHIGJlbGxXcmFwCiAgLy8g4LmA4Lie4Lij4Liy4Liw4LiB4Lil4LmI4Lit4LiH4LmB',
  '4LiI4LmJ4LiH4LmA4LiV4Li34Lit4LiZ4LiX4Li14LmI4LmA4Lib4Li04LiU4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmI4LiB4LmH4LmA4Lib4LmH4LiZ4Lil4Li54LiB4LiC4Lit4LiHIGJlbGxXcmFwIOC5gOC4q+C4oeC4t+C4reC4meC4geC4seC4mQogIHZhciBz',
  'bG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JlbGxTbG90Jyk7CiAgaWYgKCFzbG90KSB7CiAgICBzbG90ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpOwogICAgc2xvdC5pZCA9ICdiZWxsU2xvdCc7CiAgICB3cmFwLmluc2VydEJlZm9yZShz',
  'bG90LCB3cmFwLmZpcnN0Q2hpbGQpOwogIH0KCiAgdmFyIGZyZXNoID0gdW5zZWVuQWxlcnRzKCk7CiAgdmFyIG4gPSBmcmVzaC5sZW5ndGg7CiAgdmFyIHRvdGFsID0gQUxFUlRTLnRvdGFsIHx8IDA7CiAgdmFyIHVyZ2VudCA9IGZyZXNoLmZpbHRlcihmdW5jdGlv',
  'bihhKXsgcmV0dXJuIGEubGV2ZWwgPT09ICdkYW5nZXInOyB9KS5sZW5ndGg7CiAgdmFyIHRpcCA9IG4gPyAn4Lih4Li14LmA4Lij4Li34LmI4Lit4LiH4LmD4Lir4Lih4LmIICcgKyBuICsgJyDguYDguKPguLfguYjguK3guIcnIDoKICAgICAgICAgICAgKHRvdGFs',
  'ID8gJ+C4ouC4seC4h+C4hOC5ieC4suC4h+C4reC4ouC4ueC5iCAnICsgdG90YWwgKyAnIOC5gOC4o+C4t+C5iOC4reC4hyAo4LmA4Lir4LmH4LiZ4LmB4Lil4LmJ4Lin4LiX4Lix4LmJ4LiH4Lir4Lih4LiUKScgOiAn4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ4LiE',
  '4LmJ4Liy4LiHJyk7CiAgc2xvdC5pbm5lckhUTUwgPQogICAgJzxidXR0b24gY2xhc3M9ImJ0biBpY29uIGJlbGwiIGlkPSJiZWxsQnRuIiBvbmNsaWNrPSJ0b2dnbGVOb3RpZigpIiAnICsKICAgICAgJ3RpdGxlPSInICsgZXNjKHRpcCkgKyAnIiAnICsKICAgICAg',
  'J2FyaWEtbGFiZWw9IuC4geC4suC4o+C5geC4iOC5ieC4h+C5gOC4leC4t+C4reC4mSI+8J+UlCcgKwogICAgICAobiA/ICc8c3BhbiBjbGFzcz0iYmVsbC1kb3QnICsgKHVyZ2VudCA/ICcgdXJnZW50JyA6ICcnKSArICciPicgKyAobiA+IDk5ID8gJzk5KycgOiBu',
  'KSArICc8L3NwYW4+JyA6ICcnKSArCiAgICAnPC9idXR0b24+JzsKfQoKZnVuY3Rpb24gdG9nZ2xlTm90aWYoKXsKICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25vdGlmUGFuZWwnKSkgcmV0dXJuIGNsb3NlTm90aWYoKTsKICB2YXIgd3JhcCA9IGRvY3Vt',
  'ZW50LmdldEVsZW1lbnRCeUlkKCdiZWxsV3JhcCcpOwogIGlmICghd3JhcCkgcmV0dXJuOwogIHZhciBwYW5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogIHBhbmVsLmlkID0gJ25vdGlmUGFuZWwnOwogIHBhbmVsLmNsYXNzTmFtZSA9ICdub3Rp',
  'Zic7CiAgd3JhcC5hcHBlbmRDaGlsZChwYW5lbCk7CiAgTk9USUZfTkVXID0ge307CiAgbWFya0FsZXJ0c1NlZW4oKTsgICAgICAgICAgICAgICAgICAgICAvLyDguYDguJvguLTguJTguJTguLnguYHguKXguYnguKcgPSDguYDguKvguYfguJnguYHguKXguYnguKcg',
  '4LiV4Lix4Lin4LmA4Lil4LiC4Lia4LiZ4LiB4Lij4Liw4LiU4Li04LmI4LiH4Lir4Liy4LiiICjguJvguYnguLLguKIgIuC5g+C4q+C4oeC5iCIg4Lii4Lix4LiH4Lit4Lii4Li54LmI4LmD4LiZ4LiB4Lil4LmI4Lit4LiHKQogIHJlbmRlck5vdGlmUGFuZWwoKTsK',
  'ICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgbm90aWZPdXRzaWRlLCB0cnVlKTsgfSwgMCk7CiAgcmVmcmVzaEFsZXJ0cygpOyAgICAgICAgICAgICAgICAgICAgICAvLyDguYDguJvguLTguJTguJfguLXg',
  'uYTguKPguIHguYfguJTguLbguIfguILguK3guIfguKXguYjguLLguKrguLjguJTguKHguLLguYPguKvguYnguJTguYnguKfguKIKfQoKZnVuY3Rpb24gY2xvc2VOb3RpZigpewogIHZhciBwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25vdGlmUGFuZWwnKTsK',
  'ICBpZiAocCkgcC5yZW1vdmUoKTsKICBOT1RJRl9ORVcgPSB7fTsKICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIG5vdGlmT3V0c2lkZSwgdHJ1ZSk7Cn0KCmZ1bmN0aW9uIG5vdGlmT3V0c2lkZShlKXsKICB2YXIgd3JhcCA9IGRvY3VtZW50',
  'LmdldEVsZW1lbnRCeUlkKCdiZWxsV3JhcCcpOwogIGlmICh3cmFwICYmICF3cmFwLmNvbnRhaW5zKGUudGFyZ2V0KSkgY2xvc2VOb3RpZigpOwp9Cgp2YXIgTk9USUZfR1JPVVBTID0gWwogIHsgbW9kdWxlOidyZXBhaXJzJywgICBpYzon8J+UpycsIGxhYmVsOifg',
  'uIfguLLguJnguIvguYjguK3guKHguKvguYnguK3guIfguJfguLXguYjguKLguLHguIfguYTguKHguYjguYDguKrguKPguYfguIgnIH0sCiAgeyBtb2R1bGU6J2FjJywgICAgICAgIGljOifinYTvuI8nLCBsYWJlbDon4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4LiW',
  '4Li24LiH4LiB4Liz4Lir4LiZ4LiUJyB9LAogIHsgbW9kdWxlOididWlsZGluZycsICBpYzon8J+PoicsIGxhYmVsOifguIfguLLguJnguJXguLbguIHguKrguYjguKfguJnguIHguKXguLLguIfguJfguLXguYjguKLguLHguIfguITguYnguLLguIcnIH0sCiAgeyBt',
  'b2R1bGU6J3B1cmNoYXNlcycsIGljOifwn5uh77iPJywgbGFiZWw6J+C4m+C4o+C4sOC4geC4seC4meC5g+C4geC4peC5ieC4q+C4oeC4lCcgfSwKICB7IG1vZHVsZTonZmluYW5jZScsICAgaWM6J/Cfp74nLCBsYWJlbDon4Lia4Li04Lil4Lij4Liy4Lii4LmA4LiU',
  '4Li34Lit4LiZJyB9Cl07CgpmdW5jdGlvbiByZW5kZXJOb3RpZlBhbmVsKCl7CiAgdmFyIHBhbmVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25vdGlmUGFuZWwnKTsKICBpZiAoIXBhbmVsKSByZXR1cm47CiAgdmFyIGl0ZW1zID0gQUxFUlRTLml0ZW1zIHx8',
  'IFtdOwoKICB2YXIgbmV3Q291bnQgPSBhbGVydEluZGV4KCkuZmlsdGVyKGZ1bmN0aW9uKGEpeyByZXR1cm4gTk9USUZfTkVXW2Eua2V5XTsgfSkubGVuZ3RoOwogIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9Im5vdGlmLWgiPjxiPuC4geC4suC4o+C5geC4iOC5ieC4',
  'h+C5gOC4leC4t+C4reC4mTwvYj4nICsKICAgICc8c3BhbiBjbGFzcz0ic3AiPicgKwogICAgICAobmV3Q291bnQgPyAnPHNwYW4gY2xhc3M9ImIgaW5mbyI+4LmD4Lir4Lih4LmIICcgKyBuZXdDb3VudCArICc8L3NwYW4+JyA6ICcnKSArCiAgICAgIChpdGVtcy5s',
  'ZW5ndGggPyAnPHNwYW4gY2xhc3M9ImIgJyArIChBTEVSVFMudXJnZW50ID8gJ2RncicgOiAnd2FybicpICsgJyI+4LiE4LmJ4Liy4LiHICcgKyAoQUxFUlRTLnRvdGFsIHx8IGl0ZW1zLmxlbmd0aCkgKyAnIOC5gOC4o+C4t+C5iOC4reC4hzwvc3Bhbj4nIDogJycp',
  'ICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIiB0aXRsZT0i4LiU4Li24LiH4LiC4LmJ4Lit4Lih4Li54Lil4Lil4LmI4Liy4Liq4Li44LiUIiBvbmNsaWNrPSJyZWZyZXNoQWxlcnRzKCkiPuKGuzwvYnV0dG9uPicgKwogICAgJzwvc3Bhbj48L2Rp',
  'dj4nOwoKICBpZiAoIWl0ZW1zLmxlbmd0aCkgewogICAgcGFuZWwuaW5uZXJIVE1MID0gaGVhZCArCiAgICAgICc8ZGl2IGNsYXNzPSJub3RpZi1lbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj7inIU8L2Rpdj7guYTguKHguYjguKHguLXguIfguLLguJnguITguYnguLLg',
  'uIc8YnI+JyArCiAgICAgICc8c3BhbiBjbGFzcz0iZnMxMiBmYWludCI+4LiX4Li44LiB4Lit4Lii4LmI4Liy4LiH4LmA4Lij4Li14Lii4Lia4Lij4LmJ4Lit4Lii4LiU4Li1PC9zcGFuPjwvZGl2Pic7CiAgICByZXR1cm47CiAgfQoKICAvLyDguIjguLHguJTguIHg',
  'uKXguLjguYjguKHguJXguLLguKHguYLguKHguJTguLnguKUg4LmA4Lij4Li14Lii4LiH4LiV4Liy4Lih4Lil4Liz4LiU4Lix4Lia4LiX4Li14LmI4Lic4Li54LmJ4LmD4LiK4LmJ4Liq4LiZ4LmD4LiI4LiB4LmI4Lit4LiZCiAgdmFyIGJvZHkgPSAnJzsKICBOT1RJ',
  'Rl9HUk9VUFMuZm9yRWFjaChmdW5jdGlvbihnKXsKICAgIHZhciBsaXN0ID0gaXRlbXMuZmlsdGVyKGZ1bmN0aW9uKGEpeyByZXR1cm4gYS5tb2R1bGUgPT09IGcubW9kdWxlOyB9KTsKICAgIGlmICghbGlzdC5sZW5ndGgpIHJldHVybjsKICAgIC8vIOC4iOC4s+C4',
  'meC4p+C4meC4iOC4o+C4tOC4h+C4iOC4suC4geC4leC4seC4p+C4meC4seC4miAo4Lij4Liy4Lii4Lil4Liw4LmA4Lit4Li14Lii4LiU4Liq4LmI4LiH4Lih4Liy4LmE4Lih4LmI4LmA4LiB4Li04LiZ4Lir4LiZ4LmJ4Liy4Lil4LiwIDQwIOC5gOC4o+C4t+C5iOC4',
  'reC4hykKICAgIHZhciBhbGwgPSBNYXRoLm1heChsaXN0Lmxlbmd0aCwgKEFMRVJUUy5jb3VudHMgfHwge30pW2cubW9kdWxlXSB8fCAwKTsKICAgIGJvZHkgKz0gJzxkaXYgY2xhc3M9Im5vdGlmLXNlYyI+JyArIGcuaWMgKyAnICcgKyBlc2MoZy5sYWJlbCkgKyAn',
  'ICgnICsgYWxsICsgJyk8L2Rpdj4nOwogICAgbGlzdC5zbGljZSgwLCA4KS5mb3JFYWNoKGZ1bmN0aW9uKGEpewogICAgICB2YXIgaXNOZXcgPSAhIU5PVElGX05FV1thLmtleV07CiAgICAgIGJvZHkgKz0gJzxidXR0b24gY2xhc3M9Im5vdGlmLWl0ZW0gbC0nICsg',
  'ZXNjKGEubGV2ZWwpICsgKGlzTmV3ID8gJyBpcy1uZXcnIDogJycpICsgJyIgb25jbGljaz0iZ290b0FsZXJ0KCcgKyBqc3EoYS5tb2R1bGUpICsgJykiPicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJ0dCI+JyArIChpc05ldyA/ICc8c3BhbiBjbGFzcz0ibmV3LWRv',
  'dCIgdGl0bGU9IuC5gOC4o+C4t+C5iOC4reC4h+C5g+C4q+C4oeC5iCI+PC9zcGFuPicgOiAnJykgKyBlc2MoYS50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgKGEuZGV0YWlsID8gJzxkaXYgY2xhc3M9ImRkIj4nICsgZXNjKGEuZGV0YWlsKSArICc8L2Rpdj4n',
  'IDogJycpICsKICAgICAgJzwvYnV0dG9uPic7CiAgICB9KTsKICAgIGlmIChhbGwgPiA4KSB7CiAgICAgIGJvZHkgKz0gJzxidXR0b24gY2xhc3M9Im5vdGlmLW1vcmUiIG9uY2xpY2s9ImdvdG9BbGVydCgnICsganNxKGcubW9kdWxlKSArICcpIj4nICsKICAgICAg',
  'ICAn4LiU4Li54Lit4Li14LiBICcgKyAoYWxsIC0gOCkgKyAnIOC4o+C4suC4ouC4geC4suC4oyDihpI8L2J1dHRvbj4nOwogICAgfQogIH0pOwoKICBwYW5lbC5pbm5lckhUTUwgPSBoZWFkICsgJzxkaXYgY2xhc3M9Im5vdGlmLWxpc3QiPicgKyBib2R5ICsgJzwv',
  'ZGl2PicgKwogICAgJzxkaXYgY2xhc3M9Im5vdGlmLWYiPuC4o+C4suC4ouC4geC4suC4o+C4iOC4sOC4q+C4suC4ouC5hOC4m+C5gOC4reC4h+C5gOC4oeC4t+C5iOC4reC5geC4geC5ieC5gOC4o+C4t+C5iOC4reC4h+C4meC4seC5ieC4meC5geC4peC5ieC4pyDC',
  'tyDguK3guLHguJvguYDguJTguJUgJyArIGVzYyhTdHJpbmcoQUxFUlRTLmF0IHx8ICcnKS5zbGljZSgxMSwgMTYpIHx8ICfigJMnKSArICcg4LiZLiDCtyAnICsKICAgICc8YSBocmVmPSJqYXZhc2NyaXB0OnZvaWQoMCkiIG9uY2xpY2s9ImNsb3NlTm90aWYoKTtn',
  'byhcJ2Rhc2hib2FyZFwnKSI+4LiU4Li54LiX4Lix4LmJ4LiH4Lir4Lih4LiU4LmD4LiZ4LmB4LiU4LiK4Lia4Lit4Lij4LmM4LiUIOKGkjwvYT48L2Rpdj4nOwp9CgpmdW5jdGlvbiBnb3RvQWxlcnQobW9kdWxlKXsKICBjbG9zZU5vdGlmKCk7CiAgZ28obW9kdWxl',
  'ID09PSAnZGVidCcgPyAnZGVidE1haW4nIDogbW9kdWxlKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSBmb3JtYXQgaGVscGVycyAtLS0tLS0tLS0tLS0tLS0tICovCgovKioKICog4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiX4Li14LmI4LiI4Liw4LmE4Lib4LmA4Lib',
  '4LmH4LiZ4Lit4Liy4Lij4LmM4LiB4Li04Lin4LmA4Lih4LiZ4LiV4LmM4LiC4Lit4LiHIEpTIOC5g+C4mSBvbmNsaWNrPSLigKYiCiAqIEpTT04uc3RyaW5naWZ5IOC4l+C4s+C5g+C4q+C5ieC5gOC4m+C5h+C4meC4quC4leC4o+C4tOC4hyBKUyDguJfguLXguYjg',
  'uJbguLnguIHguJXguYnguK3guIfguYDguKrguKHguK0gKOC4q+C4meC4teC4reC4seC4jeC4m+C4o+C4sOC4geC4suC4qC/guYHguJrguYfguIHguKrguYHguKXguIrguYPguKvguYkpIOC5geC4peC5ieC4pyBlc2Mg4LiB4Lix4LiZ4Lir4Lil4Li44LiU4Lit4Lit',
  '4LiB4LiI4Liy4LiBIGF0dHJpYnV0ZQogKiDguYPguIrguYnguYHguJfguJnguIHguLLguKPguJXguYjguK0gJ1wnJyArIOC4hOC5iOC4siArICdcJycg4LiV4Lij4LiHIOC5hiDguIvguLbguYjguIfguITguYjguLLguJfguLXguYjguKHguLUgJyDguIjguLDguJfg',
  'uLDguKXguLjguK3guK3guIHguKHguLLguKPguLHguJnguYLguITguYnguJTguYTguJTguYkKICovCmZ1bmN0aW9uIGpzcShzKXsgcmV0dXJuIGVzYyhKU09OLnN0cmluZ2lmeShTdHJpbmcocyA9PSBudWxsID8gJycgOiBzKSkpOyB9CgpmdW5jdGlvbiBlc2Mocyl7',
  'CiAgcmV0dXJuIFN0cmluZyhzPT1udWxsPycnOnMpCiAgICAucmVwbGFjZSgvJi9nLCcmYW1wOycpLnJlcGxhY2UoLzwvZywnJmx0OycpLnJlcGxhY2UoLz4vZywnJmd0OycpCiAgICAucmVwbGFjZSgvIi9nLCcmcXVvdDsnKS5yZXBsYWNlKC8nL2csJyYjMzk7Jyk7',
  'Cn0KZnVuY3Rpb24gbW9uZXkobiwgZGVjKXsKICB2YXIgdiA9IE51bWJlcihufHwwKTsKICByZXR1cm4gdi50b0xvY2FsZVN0cmluZygndGgtVEgnLHttaW5pbXVtRnJhY3Rpb25EaWdpdHM6ZGVjfHwwLCBtYXhpbXVtRnJhY3Rpb25EaWdpdHM6ZGVjfHwwfSk7Cn0K',
  'ZnVuY3Rpb24gYmFodChuKXsgcmV0dXJuIG1vbmV5KG4pICsgJ1x1MDBhMOC4vyc7IH0gICAvLyDguYDguKfguYnguJnguKfguKPguKPguITguYHguJrguJrguYTguKHguYjguJXguLHguJTguJrguKPguKPguJfguLHguJQg4oCUIOC4vyDguYTguKHguYjguKvguKXg',
  'uLjguJTguYTguJvguK3guKLguLnguYjguJrguKPguKPguJfguLHguJTguYPguKvguKHguYjguITguJnguYDguJTguLXguKLguKcKZnVuY3Rpb24gcGN0KG4peyByZXR1cm4gKE51bWJlcihuKXx8MCkudG9GaXhlZCgxKSArICclJzsgfQpmdW5jdGlvbiBudW0obil7',
  'IHJldHVybiBuPT1udWxsfHxuPT09JycgPyAn4oCTJyA6IG1vbmV5KG4pOyB9CgovKiogMjAyNi0wNC0yNiAtPiAyNiDguYDguKEu4LiiLiAyNTY5ICovCnZhciBUSF9NT04gPSBbJ+C4oS7guIQuJywn4LiBLuC4ni4nLCfguKHguLUu4LiELicsJ+C5gOC4oS7guKIu',
  'Jywn4LieLuC4hC4nLCfguKHguLQu4LiiLicsJ+C4gS7guIQuJywn4LiqLuC4hC4nLCfguIEu4LiiLicsJ+C4lS7guIQuJywn4LieLuC4oi4nLCfguJgu4LiELiddOwovKioKICog4Lib4Li14LiX4Li14LmI4LiI4Liw4LmB4Liq4LiU4LiH4Lia4LiZ4Lir4LiZ4LmJ',
  '4Liy4LiI4LitIOKAlCDguILguYnguK3guKHguLnguKXguYDguIHguYfguJrguYDguJvguYfguJkg4LiELuC4qC4g4LmA4Liq4Lih4LitCiAqIOC4leC4o+C4h+C4meC4teC5ieC5geC4m+C4peC4h+C4leC4reC4meC5geC4quC4lOC4h+C4nOC4peC4reC4ouC5iOC4',
  'suC4h+C5gOC4lOC4teC4ouC4pyDguJXguLLguKHguJfguLXguYjguYDguKXguLfguK3guIHguYTguKfguYnguYPguJnguKvguJnguYnguLLguJXguLHguYnguIfguITguYjguLIKICog4LiE4LmI4Liy4LiV4Lix4LmJ4LiH4LiV4LmJ4LiZ4LiE4Li34LitIOC4hC7g',
  'uKguIOC5g+C4q+C5ieC4leC4o+C4h+C4geC4seC4muC4m+C4teC4l+C4teC5iOC5gOC4geC5h+C4muC5g+C4meC4iuC4teC4leC5geC4peC4sOC4m+C4j+C4tOC4l+C4tOC4meC4quC4suC4geC4pQogKi8KZnVuY3Rpb24gdXNlQnVkZGhpc3RZZWFyKCl7CiAgdmFy',
  'IGYgPSAoUy5ib290ICYmIFMuYm9vdC5zZXR0aW5ncyAmJiBTLmJvb3Quc2V0dGluZ3MuZGF0ZUZvcm1hdCkgfHwgJ+C4hC7guKguICgyMDI2KSc7CiAgcmV0dXJuIFN0cmluZyhmKS5pbmRleE9mKCfguJ4u4LioLicpID09PSAwOwp9CmZ1bmN0aW9uIGRpc3BsYXlZ',
  'ZWFyKGNlKXsKICByZXR1cm4gdXNlQnVkZGhpc3RZZWFyKCkgPyBOdW1iZXIoY2UpICsgNTQzIDogTnVtYmVyKGNlKTsKfQoKZnVuY3Rpb24gdGhEYXRlKGlzbyl7CiAgaWYgKCFpc28pIHJldHVybiAn4oCTJzsKICB2YXIgbSA9IFN0cmluZyhpc28pLm1hdGNoKC9e',
  'KFxkezR9KS0oXGR7Mn0pLShcZHsyfSkvKTsKICBpZiAoIW0pIHJldHVybiBlc2MoaXNvKTsKICByZXR1cm4gTnVtYmVyKG1bM10pICsgJyAnICsgVEhfTU9OW051bWJlcihtWzJdKS0xXSArICcgJyArIGRpc3BsYXlZZWFyKG1bMV0pOwp9CmZ1bmN0aW9uIHRoRGF0',
  'ZVNob3J0KGlzbyl7CiAgaWYgKCFpc28pIHJldHVybiAn4oCTJzsKICB2YXIgbSA9IFN0cmluZyhpc28pLm1hdGNoKC9eKFxkezR9KS0oXGR7Mn0pLShcZHsyfSkvKTsKICBpZiAoIW0pIHJldHVybiBlc2MoaXNvKTsKICByZXR1cm4gTnVtYmVyKG1bM10pICsgJy8n',
  'ICsgTnVtYmVyKG1bMl0pICsgJy8nICsgU3RyaW5nKGRpc3BsYXlZZWFyKG1bMV0pKS5zbGljZSgyKTsKfQpmdW5jdGlvbiBkYXlzQWdvKGlzbyl7CiAgaWYgKCFpc28pIHJldHVybiBudWxsOwogIHJldHVybiBNYXRoLnJvdW5kKChEYXRlLm5vdygpIC0gbmV3IERh',
  'dGUoaXNvKS5nZXRUaW1lKCkpLzg2NDAwMDAwKTsKfQoKZnVuY3Rpb24gc3RhdHVzQmFkZ2Uoc3QpewogIHZhciBtYXAgPSB7CiAgICAn4LmA4Liq4Lij4LmH4LiI4Liq4Li04LmJ4LiZJzonb2snLCfguJTguLPguYDguJnguLTguJnguIHguLLguKPguYHguKXguYng',
  'uKcnOidvaycsJ+C5g+C4iuC5ieC4h+C4suC4meC4m+C4geC4leC4tCc6J29rJywn4Lib4Li04LiU4Lir4LiZ4Li14LmJ4LmB4Lil4LmJ4LinJzonb2snLCfguK3guKLguLnguYjguYPguJnguJvguKPguLDguIHguLHguJknOidvaycsJ+C4oeC4teC4nOC4ueC5ieC5',
  'gOC4iuC5iOC4sic6J29rJywn4Lib4LiB4LiV4Li0Jzonb2snLAogICAgJ+C4geC4s+C4peC4seC4h+C4i+C5iOC4reC4oSc6J2luZm8nLCfguIHguLPguKXguLHguIfguJTguLPguYDguJnguLTguJnguIHguLLguKMnOidpbmZvJywn4LiZ4Lix4LiU4Lir4Lih4Liy',
  '4Lii4LmB4Lil4LmJ4LinJzonaW5mbycsJ+C4geC4s+C4peC4seC4h+C4nOC5iOC4reC4mSc6J2luZm8nLCfguKfguYjguLLguIcnOidpbmZvJywKICAgICfguKPguK3guJTguLPguYDguJnguLTguJnguIHguLLguKMnOid3YXJuJywn4LmA4Lil4Li34LmI4Lit4LiZ',
  '4LiZ4Lix4LiUJzond2FybicsJ+C5g+C4geC4peC5ieC4q+C4oeC4lOC4m+C4o+C4sOC4geC4seC4mSc6J3dhcm4nLCfguJXguYnguK3guIfguIvguYjguK3guKEnOid3YXJuJywn4Lie4Lix4LiB4LiK4Liz4Lij4LiwJzond2FybicsJ+C4m+C4tOC4lOC4m+C4o+C4',
  'seC4muC4m+C4o+C4uOC4hyc6J3dhcm4nLCfguYDguIHguLTguJnguIHguLPguKvguJnguJQnOid3YXJuJywn4Lii4Lix4LiH4LmE4Lih4LmI4LmA4LiE4Lii4Lil4LmJ4Liy4LiHJzond2FybicsCiAgICAn4Lii4LiB4LmA4Lil4Li04LiBJzonbXV0ZScsJ+C4m+C4',
  'peC4lOC4o+C4sOC4p+C4suC4hyc6J211dGUnLCfguYTguKHguYjguKPguLDguJrguLgnOidtdXRlJywKICAgICfguKvguKHguJTguK3guLLguKLguLjguYHguKXguYnguKcnOidkZ3InLCfguJTguYjguKfguJnguKHguLLguIEnOidkZ3InLCfguJTguYjguKfguJkn',
  'Oid3YXJuJwogIH07CiAgaWYgKCFzdCkgcmV0dXJuICcnOwogIHJldHVybiAnPHNwYW4gY2xhc3M9ImIgJyArIChtYXBbc3RdfHwnbXV0ZScpICsgJyI+JyArIGVzYyhzdCkgKyAnPC9zcGFuPic7Cn0KCmZ1bmN0aW9uIHByb2dyZXNzKHBlcmNlbnQsIGNscyl7CiAg',
  'dmFyIHAgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIE51bWJlcihwZXJjZW50KXx8MCkpOwogIHJldHVybiAnPGRpdiBjbGFzcz0icGJhciAnICsgKGNsc3x8JycpICsgJyI+PGkgc3R5bGU9IndpZHRoOicgKyBwICsgJyUiPjwvaT48L2Rpdj4nOwp9CgpmdW5j',
  'dGlvbiB0aHVtYnNIdG1sKHJlZnMsIGJpZyl7CiAgaWYgKCFyZWZzIHx8ICFyZWZzLmxlbmd0aCkgcmV0dXJuICc8c3BhbiBjbGFzcz0iZmFpbnQgZnMxMiI+4oCTPC9zcGFuPic7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJ0aHVtYnMiPicgKyByZWZzLm1hcChmdW5j',
  'dGlvbihyKXsKICAgIGlmIChyLnRodW1iKSB7CiAgICAgIHJldHVybiAnPGltZyBjbGFzcz0idGh1bWInICsgKGJpZz8nIGJpZyc6JycpICsgJyIgbG9hZGluZz0ibGF6eSIgc3JjPSInICsgZXNjKHIudGh1bWIpICsgJyIgJyArCiAgICAgICAgICAgICAnb25jbGlj',
  'az0id2luZG93Lm9wZW4oJyArIGpzcShzYWZlVXJsKHIudXJsKSkgKyAnLFwnX2JsYW5rXCcpIiAnICsKICAgICAgICAgICAgICdvbmVycm9yPSJ0aGlzLm9uZXJyb3I9bnVsbDt0aGlzLnJlcGxhY2VXaXRoKGZpbGVDaGlwKCcgKyBKU09OLnN0cmluZ2lmeShKU09O',
  'LnN0cmluZ2lmeShyKSkucmVwbGFjZSgvIi9nLCcmcXVvdDsnKSArICcpKSI+JzsKICAgIH0KICAgIHZhciB1ID0gc2FmZVVybChyLnVybCk7CiAgICByZXR1cm4gdSA/ICc8YSBjbGFzcz0iYiBpbmZvIiBocmVmPSInICsgZXNjKHUpICsgJyIgdGFyZ2V0PSJfYmxh',
  'bmsiIHJlbD0ibm9vcGVuZXIiPuC5hOC4n+C4peC5jDwvYT4nCiAgICAgICAgICAgICA6ICc8c3BhbiBjbGFzcz0iYiBtdXRlIiB0aXRsZT0iJyArIGVzYyhyLm5hbWUgfHwgJycpICsgJyI+4LmE4Lif4Lil4LmMPC9zcGFuPic7CiAgfSkuam9pbignJykgKyAnPC9k',
  'aXY+JzsKfQoKLyoqIOC4o+C4seC4muC5gOC4ieC4nuC4suC4sOC4peC4tOC4h+C4geC5jCBodHRwcyDigJQg4LiE4LmI4Liy4Lit4Lii4LmI4Liy4LiHIGphdmFzY3JpcHQ6IOC4l+C4teC5iOC4luC4ueC4geC4nuC4tOC4oeC4nuC5jOC4peC4h+C4iuC5iOC4reC4',
  'h+C5hOC4n+C4peC5jOC5geC4meC4muC5g+C4meC4iuC4teC4leC4iOC4sOC5hOC4oeC5iOC4geC4peC4suC4ouC5gOC4m+C5h+C4meC4peC4tOC4h+C4geC5jCAqLwpmdW5jdGlvbiBzYWZlVXJsKHUpeyB1ID0gU3RyaW5nKHUgPT0gbnVsbCA/ICcnIDogdSkudHJp',
  'bSgpOyByZXR1cm4gL15odHRwczpcL1wvL2kudGVzdCh1KSA/IHUgOiAnJzsgfQpmdW5jdGlvbiBmaWxlQ2hpcChqc29uKXsKICB2YXIgciA9IHR5cGVvZiBqc29uID09PSAnc3RyaW5nJyA/IEpTT04ucGFyc2UoanNvbikgOiBqc29uOwogIHZhciBhID0gZG9jdW1l',
  'bnQuY3JlYXRlRWxlbWVudCgnYScpOwogIGEuY2xhc3NOYW1lID0gJ2IgaW5mbyc7IGEuaHJlZiA9IHNhZmVVcmwoci51cmwpIHx8ICcjJzsgYS50YXJnZXQgPSAnX2JsYW5rJzsgYS5yZWwgPSAnbm9vcGVuZXInOyBhLnRleHRDb250ZW50ID0gJ/Cfk44g4LmE4Lif',
  '4Lil4LmMJzsKICByZXR1cm4gYTsKfQoKZnVuY3Rpb24gZW1wdHlCb3godGV4dCwgYWN0aW9uKXsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPvCfl4LvuI88L2Rpdj4nICsgZXNjKHRleHQpICsKICAgICAgICAgKGFjdGlvbiA/',
  'ICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgYWN0aW9uICsgJzwvZGl2PicgOiAnJykgKyAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gYmFyQ2hhcnQoaXRlbXMsIGxhYmVsS2V5LCB2YWx1ZUtleSwgZm9ybWF0dGVyKXsKICBpZiAoIWl0ZW1zIHx8ICFpdGVtcy5sZW5ndGgp',
  'IHJldHVybiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4guC5ieC4reC4oeC4ueC4pTwvZGl2Pic7CiAgdmFyIG1heCA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGl0ZW1zLm1hcChmdW5jdGlvbihpKXsgcmV0dXJuIE51bWJlcihp',
  'W3ZhbHVlS2V5XSl8fDA7IH0pKSB8fCAxOwogIHJldHVybiAnPGRpdiBjbGFzcz0iYmFycyI+JyArIGl0ZW1zLm1hcChmdW5jdGlvbihpKXsKICAgIHZhciB2ID0gTnVtYmVyKGlbdmFsdWVLZXldKXx8MDsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0iYmFyLXJvdyI+',
  'JyArCiAgICAgICc8ZGl2IGNsYXNzPSJjbGlwIiB0aXRsZT0iJyArIGVzYyhpW2xhYmVsS2V5XSkgKyAnIj4nICsgZXNjKGlbbGFiZWxLZXldKSArICc8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImJhci10cmFjayI+PGRpdiBjbGFzcz0iYmFyLWZpbGwiIHN0',
  'eWxlPSJ3aWR0aDonICsgKHYvbWF4KjEwMCkgKyAnJSI+PC9kaXY+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJ2Ij4nICsgKGZvcm1hdHRlciA/IGZvcm1hdHRlcihpKSA6IG1vbmV5KHYpKSArICc8L2Rpdj4nICsKICAgICc8L2Rpdj4nOwogIH0pLmpvaW4o',
  'JycpICsgJzwvZGl2Pic7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0gbW9kYWwgLS0tLS0tLS0tLS0tLS0tLSAqLwoKLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tCiAgIOC4leC4suC4o+C4',
  'suC4h+C4muC4meC4iOC4reC5geC4hOC4mgogICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0KICAg4LiV4Liy4Lij4Liy4LiH4LiB4Lin4LmJ4Liy4LiHIDEsMDAwcHgg4Lit4LmI4Liy4LiZ',
  '4Lia4LiZ4Lih4Li34Lit4LiW4Li34Lit4LmE4Lih4LmI4LmE4Lir4LinIOC4leC5ieC4reC4h+C5gOC4peC4t+C5iOC4reC4meC4i+C5ieC4suC4ouC4guC4p+C4suC4leC4peC4reC4lAogICDguIjguLbguIfguJXguLTguJTguIrguLfguYjguK3guITguK3guKXg',
  'uLHguKHguJnguYzguYTguKfguYnguJfguLXguYjguYHguJXguYjguKXguLDguIrguYjguK3guIfguJTguYnguKfguKIgZGF0YS1sYWJlbCDguYHguKXguYnguKfguYPguKvguYkgQ1NTCiAgIOC5gOC4m+C5h+C4meC4hOC4meC4leC4seC4lOC4quC4tOC4meC4p+C5',
  'iOC4suC4iOC4sOC5geC4quC4lOC4h+C5gOC4m+C5h+C4meC4leC4suC4o+C4suC4h+C4q+C4o+C4t+C4reC5gOC4m+C5h+C4meC4geC4suC4o+C5jOC4lOC4l+C4teC4peC4sOC4o+C4suC4ouC4geC4suC4owoKICAg4LiX4Liz4LiX4Li14LmI4LiZ4Li14LmI4LiX',
  '4Li14LmI4LmA4LiU4Li14Lii4Lin4Lir4Lil4Lix4LiH4Lin4Liy4LiU4Lir4LiZ4LmJ4Liy4LmA4Liq4Lij4LmH4LiIIOC4l+C4uOC4geC4leC4suC4o+C4suC4h+C5g+C4meC4o+C4sOC4muC4muC4iOC4tuC4h+C5hOC4lOC5ieC4nOC4peC5gOC4q+C4oeC4t+C4',
  'reC4meC4geC4seC4meC4q+C4oeC4lAogICDguYTguKHguYjguJXguYnguK3guIfguYTguKXguYjguYHguIHguYnguJfguLXguKXguLDguJXguLLguKPguLLguIcg4LmB4Lil4Liw4LiV4Liy4Lij4Liy4LiH4LiX4Li14LmI4LmA4Lie4Li04LmI4Lih4LmD4Lir4Lih',
  '4LmI4LiX4Li14Lir4Lil4Lix4LiH4LiB4LmH4LmE4LiU4LmJ4LmE4Lib4LiU4LmJ4Lin4Lii4LmA4Lil4LiiCiAgIEhUTUwg4Lii4Lix4LiH4LmA4Lib4LmH4LiZ4LiK4Li44LiU4LmA4LiU4Li14Lii4LinIOC4leC5iOC4suC4h+C4geC4seC4meC5geC4hOC5iCBD',
  'U1Mg4Lii4LmI4LitLeC4guC4ouC4suC4ouC4q+C4meC5ieC4suC4leC5iOC4suC4h+C4geC5h+C4quC4peC4seC4muC5hOC4lOC5ieC4l+C4seC4meC4l+C4tQotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0t',
  'LS0tLS0tLS0tICovCmZ1bmN0aW9uIGxhYmVsQ2VsbHMocm9vdCl7CiAgaWYgKCFyb290KSByZXR1cm47CiAgdmFyIHRhYmxlcyA9IHJvb3QucXVlcnlTZWxlY3RvckFsbCA/IHJvb3QucXVlcnlTZWxlY3RvckFsbCgndGFibGUnKSA6IFtdOwogIEFycmF5LnByb3Rv',
  'dHlwZS5mb3JFYWNoLmNhbGwodGFibGVzLCBmdW5jdGlvbih0KXsKICAgIHZhciBoZWFkcyA9IEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbCh0LnF1ZXJ5U2VsZWN0b3JBbGwoJ3RoZWFkIHRoJyksIGZ1bmN0aW9uKHRoKXsKICAgICAgcmV0dXJuICh0aC50ZXh0Q29u',
  'dGVudCB8fCAnJykudHJpbSgpOwogICAgfSk7CiAgICBpZiAoIWhlYWRzLmxlbmd0aCkgcmV0dXJuOwogICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbCh0LnF1ZXJ5U2VsZWN0b3JBbGwoJ3Rib2R5IHRyJyksIGZ1bmN0aW9uKHRyKXsKICAgICAgLy8g4LmB',
  '4LiW4Lin4Liq4Lij4Li44Lib4Lir4Lij4Li34Lit4LmB4LiW4LinICLguYTguKHguYjguKHguLXguILguYnguK3guKHguLnguKUiIOC4l+C4teC5iOC4o+C4p+C4oeC4iuC5iOC4reC4hyDguJvguKXguYjguK3guKLguYTguKfguYnguYDguJXguYfguKHguITguKfg',
  'uLLguKHguIHguKfguYnguLLguIcKICAgICAgaWYgKHRyLnF1ZXJ5U2VsZWN0b3IoJ1tjb2xzcGFuXScpKSB7IHRyLmNsYXNzTGlzdC5hZGQoJ3Jvdy13aWRlJyk7IHJldHVybjsgfQogICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKHRyLmNoaWxkcmVu',
  'LCBmdW5jdGlvbih0ZCwgaSl7CiAgICAgICAgdmFyIGxhYmVsID0gaGVhZHNbaV0gfHwgJyc7CiAgICAgICAgaWYgKGxhYmVsKSB7CiAgICAgICAgICB0ZC5zZXRBdHRyaWJ1dGUoJ2RhdGEtbGFiZWwnLCBsYWJlbCk7CiAgICAgICAgICAvLyDguKvguYjguK3guITg',
  'uYjguLLguJfguLHguYnguIfguIrguYjguK3guIfguYTguKfguYnguIHguYnguK3guJnguYDguJTguLXguKLguKcg4oCUIOC4muC4meC4iOC4reC5geC4hOC4muC4iuC5iOC4reC4h+C5gOC4m+C5h+C4mSAyIOC4hOC4reC4peC4seC4oeC4meC5jCAo4LiK4Li34LmI',
  '4Lit4LiK4LmI4Lit4LiHIHwg4LiE4LmI4LiyKQogICAgICAgICAgLy8g4LiW4LmJ4Liy4LmE4Lih4LmI4Lir4LmI4LitIOC4m+C5ieC4suC4ouC4quC4luC4suC4meC4sCAyIOC4reC4seC4mSDguKPguLnguJvguKrguKXguLTguJvguKvguKXguLLguKLguKPguLng',
  'uJsg4Lir4Lij4Li34LitICLguILguYnguK3guITguKfguLLguKEgKyDguJXguLHguKfguYDguKXguIIiIOC4iOC4sOC5geC4leC4geC5gOC4m+C5h+C4meC4muC4o+C4o+C4l+C4seC4lOC4peC4sOC4iuC4tOC5ieC4mQogICAgICAgICAgLy8g4Lia4LiZ4LiI4Lit',
  '4LiB4Lin4LmJ4Liy4LiHIC5jdiDguYDguJvguYfguJkgZGlzcGxheTpjb250ZW50cyDguIjguLbguIfguYDguKvguKHguLfguK3guJnguYTguKHguYjguKHguLXguJXguLHguKfguKvguYjguK0KICAgICAgICAgIHZhciBvbmx5ID0gdGQuY2hpbGRyZW4ubGVuZ3Ro',
  'ID09PSAxICYmIHRkLmNoaWxkTm9kZXMubGVuZ3RoID09PSAxID8gdGQuZmlyc3RFbGVtZW50Q2hpbGQgOiBudWxsOwogICAgICAgICAgaWYgKHRkLmNoaWxkTm9kZXMubGVuZ3RoICYmICEob25seSAmJiBvbmx5LmNsYXNzTGlzdC5jb250YWlucygnY3YnKSkpIHsK',
  'ICAgICAgICAgICAgdmFyIGN2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICAgICAgICAgIGN2LmNsYXNzTmFtZSA9ICdjdic7CiAgICAgICAgICAgIHdoaWxlICh0ZC5maXJzdENoaWxkKSBjdi5hcHBlbmRDaGlsZCh0ZC5maXJzdENoaWxkKTsK',
  'ICAgICAgICAgICAgdGQuYXBwZW5kQ2hpbGQoY3YpOwogICAgICAgICAgfQogICAgICAgIH0KICAgICAgICBlbHNlIHRkLmNsYXNzTGlzdC5hZGQoJ2NlbGwtYWN0aW9ucycpOyAgIC8vIOC4hOC4reC4peC4seC4oeC4meC5jOC4m+C4uOC5iOC4oSDguYTguKHguYjg',
  'uKHguLXguKvguLHguKfguJXguLLguKPguLLguIcg4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LiV4Li04LiU4Lib4LmJ4Liy4LiiCgogICAgICAgIC8vIOC4iuC5iOC4reC4h+C4l+C4teC5iOC5hOC4oeC5iOC4oeC4teC4hOC5iOC4siAo4Lin4LmI4Liy4LiH4Lir4Lij',
  '4Li34Lit4LiC4Li14LiUKSDguJrguJnguIjguK3guYHguITguJrguYTguKHguYjguJXguYnguK3guIfguYLguIrguKfguYzguYDguJvguYfguJnguJrguKPguKPguJfguLHguJQKICAgICAgICAvLyDguIHguLLguKPguYzguJTguIjguLDguYTguJTguYnguYTguKHg',
  'uYjguKLguLLguKfguYDguIHguYnguK0g4Liq4LmI4Lin4LiZ4Lia4LiZ4LiI4Lit4LiB4Lin4LmJ4Liy4LiH4Lii4Lix4LiH4LiV4LmJ4Lit4LiH4Lih4Li14LmA4Lie4Li34LmI4Lit4LmD4Lir4LmJ4LiE4Lit4Lil4Lix4Lih4LiZ4LmM4LiV4Lij4LiH4LiB4Lix',
  '4LiZCiAgICAgICAgdmFyIHR4dCA9ICh0ZC50ZXh0Q29udGVudCB8fCAnJykudHJpbSgpOwogICAgICAgIHZhciBoYXNUaGluZyA9IHRkLnF1ZXJ5U2VsZWN0b3IoJ2ltZyxidXR0b24sYSxpbnB1dCxzdmcsLnRodW1iJyk7CiAgICAgICAgaWYgKCh0eHQgPT09ICcn',
  'IHx8IHR4dCA9PT0gJ+KAkycgfHwgdHh0ID09PSAnLScpICYmICFoYXNUaGluZykgewogICAgICAgICAgdGQuY2xhc3NMaXN0LmFkZCgnY2VsbC1lbXB0eScpOwogICAgICAgIH0KICAgICAgfSk7CiAgICB9KTsKICB9KTsKfQoKZnVuY3Rpb24gb3Blbk1vZGFsKHRp',
  'dGxlLCBib2R5SHRtbCwgZm9vdEh0bWwsIHdpZGUpewogIHZhciByb290ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vZGFsUm9vdCcpOwogIHJvb3QuaW5uZXJIVE1MID0KICAgICc8ZGl2IGNsYXNzPSJvdiIgb25jbGljaz0iaWYoZXZlbnQudGFyZ2V0PT09',
  'dGhpcyljbG9zZU1vZGFsKCkiPicgKwogICAgICAnPGRpdiBjbGFzcz0ibW9kYWwnICsgKHdpZGU/JyB3aWRlJzonJykgKyAnIj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0ibW9kYWwtaCI+PGgzPicgKyBlc2ModGl0bGUpICsgJzwvaDM+PGJ1dHRvbiBjbGFzcz0i',
  'eCIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7DlzwvYnV0dG9uPjwvZGl2PicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJtb2RhbC1iIj4nICsgYm9keUh0bWwgKyAnPC9kaXY+JyArCiAgICAgICAgKGZvb3RIdG1sID8gJzxkaXYgY2xhc3M9Im1vZGFsLWYiPicgKyBm',
  'b290SHRtbCArICc8L2Rpdj4nIDogJycpICsKICAgICAgJzwvZGl2PicgKwogICAgJzwvZGl2Pic7CiAgYXBwbHlSZWFkT25seShyb290KTsKICBsYWJlbENlbGxzKHJvb3QpOwogIGRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJzsKfQpmdW5j',
  'dGlvbiBjbG9zZU1vZGFsKCl7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vZGFsUm9vdCcpLmlubmVySFRNTCA9ICcnOwogIGRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnJzsKfQpkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywg',
  'ZnVuY3Rpb24oZSl7IGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIGNsb3NlTW9kYWwoKTsgfSk7CgpmdW5jdGlvbiBjb25maXJtQWN0aW9uKHRleHQsIG9uWWVzKXsKICBvcGVuTW9kYWwoJ+C4ouC4t+C4meC4ouC4seC4mScsCiAgICAnPHA+JyArIGVzYyh0ZXh0KSAr',
  'ICc8L3A+JywKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lii4LiB4LmA4Lil4Li04LiBPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIGRnciIgaWQ9ImNmbUJ0biI+4Lii4Li34LiZ4Lii4Lix4LiZPC9i',
  'dXR0b24+Jyk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmbUJ0bicpLm9uY2xpY2sgPSBmdW5jdGlvbigpeyBjbG9zZU1vZGFsKCk7IG9uWWVzKCk7IH07Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0gdG9hc3QgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rp',
  'b24gdG9hc3QobXNnLCBraW5kLCBtcyl7CiAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgZWwuY2xhc3NOYW1lID0gJ3RvYXN0ICcgKyAoa2luZHx8JycpOwogIGVsLnRleHRDb250ZW50ID0gbXNnOwogIGRvY3VtZW50LmdldEVsZW1l',
  'bnRCeUlkKCd0b2FzdFJvb3QnKS5hcHBlbmRDaGlsZChlbCk7CiAgc2V0VGltZW91dChmdW5jdGlvbigpeyBlbC5yZW1vdmUoKTsgfSwgbXMgfHwgKGtpbmQ9PT0nZXJyJyA/IDUyMDAgOiAyODAwKSk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0gbmF2IChtb2JpbGUp',
  'IC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIHRvZ2dsZU5hdigpewogIHZhciBuYXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2Jyk7CiAgbmF2LmNsYXNzTGlzdC50b2dnbGUoJ29wZW4nKTsKICBpZiAobmF2LmNsYXNzTGlzdC5jb250YWlucygn',
  'b3BlbicpKSB7CiAgICB2YXIgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogICAgcy5jbGFzc05hbWUgPSAnc2NyaW0nOyBzLmlkID0gJ3NjcmltJzsKICAgIHMub25jbGljayA9IGZ1bmN0aW9uKCl7IG5hdi5jbGFzc0xpc3QucmVtb3ZlKCdvcGVu',
  'Jyk7IHJlbW92ZVNjcmltKCk7IH07CiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHMpOwogIH0gZWxzZSByZW1vdmVTY3JpbSgpOwp9CmZ1bmN0aW9uIHJlbW92ZVNjcmltKCl7CiAgdmFyIHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2NyaW0nKTsK',
  'ICBpZiAocykgcy5yZW1vdmUoKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSBzZWFyY2ggLS0tLS0tLS0tLS0tLS0tLSAqLwoKdmFyIHNlYXJjaFRpbWVyID0gbnVsbDsKZnVuY3Rpb24gb25TZWFyY2gocSl7CiAgY2xlYXJUaW1lb3V0KHNlYXJjaFRpbWVyKTsKICBp',
  'ZiAoIXEgfHwgcS50cmltKCkubGVuZ3RoIDwgMikgcmV0dXJuOwogIHNlYXJjaFRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpewogICAgY2FsbEFwaSgnYXBwLnNlYXJjaCcsIHsgcTogcSB9KS50aGVuKGZ1bmN0aW9uKHJvd3MpewogICAgICBvcGVuTW9kYWwo',
  'J+C4nOC4peC4geC4suC4o+C4hOC5ieC4meC4q+C4siAiJyArIHEgKyAnIiAoJyArIHJvd3MubGVuZ3RoICsgJyknLAogICAgICAgIHJvd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9ImFsaXN0Ij4nICsgcm93cy5tYXAoZnVuY3Rpb24ocil7CiAgICAgICAgICByZXR1',
  'cm4gJzxkaXYgY2xhc3M9ImFsaSIgb25jbGljaz0iY2xvc2VNb2RhbCgpO2dvKFwnJyArIGp1bXBQYWdlKHIubW9kdWxlKSArICdcJykiPicgKwogICAgICAgICAgICAnPGRpdiBjbGFzcz0iaWMiPicgKyBtb2R1bGVJY29uKHIubW9kdWxlKSArICc8L2Rpdj48ZGl2',
  'PicgKwogICAgICAgICAgICAnPGRpdiBjbGFzcz0idHQiPicgKyBlc2Moci50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJkZCI+JyArIGVzYyhyLmxhYmVsKSArIChyLmRldGFpbCA/ICcgwrcgJyArIGVzYyhyLmRldGFpbCkgOiAn',
  'JykgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICc8L2Rpdj48L2Rpdj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicKICAgICAgICA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4LmE4Lih4LmI4Lie4Lia4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4LiV',
  '4Lij4LiH4LiB4Lix4Lia4LiE4Liz4LiE4LmJ4LiZPC9kaXY+JywgJycsIHRydWUpOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwgJ2VycicpOyB9KTsKICB9LCA0MjApOwp9CmZ1bmN0aW9uIGp1bXBQYWdlKG1vZHVsZSl7CiAg',
  'cmV0dXJuICh7cHVyY2hhc2VzOidwdXJjaGFzZXMnLCByZXBhaXJzOidyZXBhaXJzJywgYnVpbGRpbmc6J2J1aWxkaW5nJywgYWM6J2FjJywgZGVidDonZGVidE1haW4nLCByb29tczoncm9vbXMnfSlbbW9kdWxlXSB8fCAnZGFzaGJvYXJkJzsKfQpmdW5jdGlvbiBt',
  'b2R1bGVJY29uKG1vZHVsZSl7CiAgcmV0dXJuICh7cHVyY2hhc2VzOifwn5uSJywgcmVwYWlyczon8J+UpycsIGJ1aWxkaW5nOifwn4+iJywgYWM6J+KdhO+4jycsIGRlYnQ6J/CfkrAnLCByb29tczon8J+aqid9KVttb2R1bGVdIHx8ICfwn5OEJzsKfQoKLyogLS0t',
  'LS0tLS0tLS0tLS0tLSBmaWxlIHVwbG9hZCAtLS0tLS0tLS0tLS0tLS0tICovCgovKioKICog4Lit4LmI4Liy4LiZ4LmE4Lif4Lil4LmM4LiI4Liy4LiBIDxpbnB1dCB0eXBlPWZpbGU+IOC5gOC4m+C5h+C4mSBkYXRhVVJMIOC5geC4peC5ieC4p+C4quC5iOC4h+C4',
  'guC4tuC5ieC4mSBEcml2ZQogKiDguITguLfguJkgYXJyYXkg4LiC4Lit4LiHIHtpZCxuYW1lLHVybCx0aHVtYn0KICovCmZ1bmN0aW9uIHVwbG9hZEZpbGVzKGlucHV0RWwsIGJ1Y2tldCl7CiAgdmFyIGZpbGVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwo',
  'aW5wdXRFbC5maWxlcyB8fCBbXSk7CiAgaWYgKCFmaWxlcy5sZW5ndGgpIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pOwogIHZhciBNQVggPSAxMiAqIDEwMjQgKiAxMDI0OwogIHZhciB0b29CaWcgPSBmaWxlcy5maWx0ZXIoZnVuY3Rpb24oZil7IHJldHVybiBm',
  'LnNpemUgPiBNQVg7IH0pOwogIGlmICh0b29CaWcubGVuZ3RoKSB7CiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCfguYTguJ/guKXguYzguYPguKvguI3guYjguYDguIHguLTguJkgMTIgTUI6ICcgKyB0b29CaWcubWFwKGZ1bmN0aW9uKGYpe3Jl',
  'dHVybiBmLm5hbWU7fSkuam9pbignLCAnKSkpOwogIH0KICByZXR1cm4gUHJvbWlzZS5hbGwoZmlsZXMubWFwKHJlYWRBc0RhdGFVcmwpKQogICAgLnRoZW4oZnVuY3Rpb24ocGF5bG9hZHMpeyByZXR1cm4gY2FsbEFwaSgnZmlsZS51cGxvYWQnLCB7IGJ1Y2tldDog',
  'YnVja2V0LCBmaWxlczogcGF5bG9hZHMgfSk7IH0pOwp9CgpmdW5jdGlvbiByZWFkQXNEYXRhVXJsKGZpbGUpewogIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpewogICAgdmFyIHIgPSBuZXcgRmlsZVJlYWRlcigpOwogICAgci5v',
  'bmxvYWQgPSBmdW5jdGlvbigpeyByZXNvbHZlKHsgbmFtZTogZmlsZS5uYW1lLCBtaW1lVHlwZTogZmlsZS50eXBlLCBkYXRhVXJsOiByLnJlc3VsdCB9KTsgfTsKICAgIHIub25lcnJvciA9IGZ1bmN0aW9uKCl7IHJlamVjdChuZXcgRXJyb3IoJ+C4reC5iOC4suC4',
  'meC5hOC4n+C4peC5jOC5hOC4oeC5iOC4quC4s+C5gOC4o+C5h+C4iDogJyArIGZpbGUubmFtZSkpOyB9OwogICAgci5yZWFkQXNEYXRhVVJMKGZpbGUpOwogIH0pOwp9Cjwvc2NyaXB0Pgo8c2NyaXB0PgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgQXV0aC5odG1sIOKAlCDguKvguJnguYnguLLguKXguYfguK3guIHguK3guLTguJkgwrcgUElOIDYg4Lir4Lil4Lix4LiBIMK3IOC5gOC4m+C4peC4teC5iOC4ouC4meC4o+C4q+C4seC4quC4nOC5iOC4suC4mQoK',
  'ICAg4LiX4Li14LmI4LmA4LiB4LmH4Lia4LiC4Lit4LiH4Lid4Lix4LmI4LiH4LmA4Lia4Lij4Liy4Lin4LmM4LmA4LiL4Lit4Lij4LmMIDIg4LiK4Lix4LmJ4LiZIOC5gOC4nuC4o+C4suC4sOC5gOC4p+C5h+C4muC5geC4reC4m+C4guC4reC4hyBBcHBzIFNjcmlw',
  'dAogICDguJfguLPguIfguLLguJnguYPguJkgaWZyYW1lIOC4l+C4teC5iOC4iuC4t+C5iOC4reC5guC4lOC5gOC4oeC4meC5gOC4m+C4peC4teC5iOC4ouC4meC4l+C4uOC4geC4hOC4o+C4seC5ieC4h+C4l+C4teC5iOC5gOC4m+C4tOC4lAogICBsb2NhbFN0b3Jh',
  'Z2Ug4LiI4Li24LiH4Lir4Liy4Lii4LmE4LiU4LmJIOC4leC5ieC4reC4h+C4oeC4teC4l+C4suC4h+C4quC4s+C4o+C4reC4hwogICAgIMK3IOC4o+C4q+C4seC4quC4reC5ieC4suC4h+C4reC4tOC4h+C4geC4suC4o+C5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4',
  'suC4mSAo4Lit4Liy4Lii4Li44Liq4Lix4LmJ4LiZKSDigJQg4LmA4LiB4LmH4Lia4LmD4LiZIGxvY2FsU3RvcmFnZSDguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcKICAgICAgIOC4q+C4suC4ouC4geC5h+C5geC4hOC5iOC5g+C4quC5iCBQSU4g4LmD4Lir',
  '4Lih4LmICiAgICAgwrcg4Lij4Lir4Lix4Liq4Lit4Li44Lib4LiB4Lij4LiT4LmMICjguITguLnguYjguIHguLHguJogUElOKSDigJQg4LmA4LiB4LmH4Lia4LiX4Lix4LmJ4LiHIGxvY2FsU3RvcmFnZSDguYHguKXguLDguYPguJkgVVJMIOC4guC4reC4h+C4q+C4',
  'meC5ieC4suC5geC4oeC5iAogICAgICAg4Lic4LmI4Liy4LiZIGdvb2dsZS5zY3JpcHQuaGlzdG9yeSDguYDguJ7guLfguYjguK3guYPguKvguYnguKLguLHguIfguK3guKLguLnguYjguKvguKXguLHguIfguJvguLTguJTguYDguJvguLTguJTguYDguITguKPguLfg',
  'uYjguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgp2YXIgQVVUSCA9IHsKICBzZXNzaW9uOiAnJywKICBkZXZpY2U6ICcnLAogIG1lOiBudWxsLAogIHBpbjogJycsCiAgc2NyZWVuOiAn',
  'Jwp9OwoKdmFyIExTX1NFU1NJT04gPSAnbWNvcm5lci5zZXNzaW9uJzsKdmFyIExTX0RFVklDRSAgPSAnbWNvcm5lci5kZXZpY2UnOwoKLyogLS0tLS0tLS0tLS0tLS0tLSDguJfguLXguYjguYDguIHguYfguJrguJ3guLHguYjguIfguYDguJrguKPguLLguKfguYzg',
  'uYDguIvguK3guKPguYwgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gbHNHZXQoayl7CiAgdHJ5IHsgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrKSB8fCAnJzsgfSBjYXRjaCAoZSkgeyByZXR1cm4gJyc7IH0KfQpmdW5jdGlvbiBsc1Nl',
  'dChrLCB2KXsKICB0cnkgeyB2ID8gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKGssIHYpIDogd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGspOyB9CiAgY2F0Y2ggKGUpIHsgLyog4LmC4Lir4Lih4LiU4Liq4LmI4Lin4LiZ4LiV4Lix4Lin4Lir4Lij',
  '4Li34Lit4Lib4Li04LiU4LiE4Li44LiB4LiB4Li14LmJ4LmE4Lin4LmJIOKAlCDguYPguIrguYnguJfguLLguIfguKrguLPguKPguK3guIcgKi8gfQp9CgovKiog4LmA4LiC4Li14Lii4LiZ4Lij4Lir4Lix4Liq4Lit4Li44Lib4LiB4Lij4LiT4LmM4Lil4LiHIFVS',
  'TCDguILguK3guIfguKvguJnguYnguLLguYHguKHguYgg4LmD4Lir4LmJ4Lij4Lit4LiU4LiC4LmJ4Liy4Lih4LiB4Liy4Lij4LmA4Lib4Li04LiU4LmD4Lir4Lih4LmIICovCmZ1bmN0aW9uIGRldmljZVRvVXJsKHRva2VuKXsKICB0cnkgewogICAgaWYgKCF3aW5k',
  'b3cuZ29vZ2xlIHx8ICFnb29nbGUuc2NyaXB0IHx8ICFnb29nbGUuc2NyaXB0Lmhpc3RvcnkpIHJldHVybjsKICAgIHZhciBwYXJhbXMgPSB7fTsKICAgIGlmIChhY2Nlc3NLZXkoKSkgcGFyYW1zLmtleSA9IGFjY2Vzc0tleSgpOwogICAgaWYgKHRva2VuKSBwYXJh',
  'bXMuZCA9IHRva2VuOwogICAgZ29vZ2xlLnNjcmlwdC5oaXN0b3J5LnJlcGxhY2VTdGF0ZSh7fSwgcGFyYW1zLCBsb2NhdGlvbi5oYXNoKTsKICB9IGNhdGNoIChlKSB7IC8qIOC5hOC4oeC5iOC5g+C4iuC5iOC5gOC4p+C5h+C4muC5geC4reC4myAo4LmA4LiK4LmI',
  '4LiZ4LmA4Lib4Li04LiU4LmD4LiZIGRpYWxvZykg4oCUIOC4guC5ieC4suC4oeC5hOC4myAqLyB9Cn0KCmZ1bmN0aW9uIHNhdmVEZXZpY2UodG9rZW4pewogIEFVVEguZGV2aWNlID0gdG9rZW4gfHwgJyc7CiAgbHNTZXQoTFNfREVWSUNFLCBBVVRILmRldmljZSk7',
  'CiAgZGV2aWNlVG9VcmwoQVVUSC5kZXZpY2UpOwp9CgpmdW5jdGlvbiBzYXZlU2Vzc2lvbih0b2tlbil7CiAgQVVUSC5zZXNzaW9uID0gdG9rZW4gfHwgJyc7CiAgbHNTZXQoTFNfU0VTU0lPTiwgQVVUSC5zZXNzaW9uKTsKfQoKLyoqIOC4reC5iOC4suC4meC4hOC5',
  'iOC4suC4l+C4teC5iOC5gOC4geC5h+C4muC5hOC4p+C5ieC4l+C4seC5ieC4h+C4q+C4oeC4lCAo4LiV4LmJ4Lit4LiH4Lij4LitIFVSTCDguILguK3guIfguKvguJnguYnguLLguYHguKHguYgg4LiI4Li24LiH4LmA4Lib4LmH4LiZ4LmB4Lia4LiaIGNhbGxiYWNr',
  'KSAqLwpmdW5jdGlvbiBsb2FkU3RvcmVkKGRvbmUpewogIEFVVEguc2Vzc2lvbiA9IGxzR2V0KExTX1NFU1NJT04pOwogIEFVVEguZGV2aWNlICA9IGxzR2V0KExTX0RFVklDRSk7CgogIGlmICh3aW5kb3cuZ29vZ2xlICYmIGdvb2dsZS5zY3JpcHQgJiYgZ29vZ2xl',
  'LnNjcmlwdC51cmwpIHsKICAgIHRyeSB7CiAgICAgIGdvb2dsZS5zY3JpcHQudXJsLmdldExvY2F0aW9uKGZ1bmN0aW9uKGxvYyl7CiAgICAgICAgdmFyIHAgPSAobG9jICYmIGxvYy5wYXJhbWV0ZXIpIHx8IHt9OwogICAgICAgIGlmIChwLmQgJiYgIUFVVEguZGV2',
  'aWNlKSB7IEFVVEguZGV2aWNlID0gU3RyaW5nKHAuZCk7IGxzU2V0KExTX0RFVklDRSwgQVVUSC5kZXZpY2UpOyB9CiAgICAgICAgaWYgKHAua2V5ICYmICFhY2Nlc3NLZXkoKSkgUkVTT0xWRURfS0VZID0gU3RyaW5nKHAua2V5KTsKICAgICAgICBkb25lKCk7CiAg',
  'ICAgIH0pOwogICAgICByZXR1cm47CiAgICB9IGNhdGNoIChlKSB7IC8qIOC5g+C4iuC5ieC4l+C4suC4h+C4m+C4geC4leC4tCAqLyB9CiAgfQogIC8vIOC5gOC4m+C4tOC4lOC4iOC4suC4gSBDbG91ZGZsYXJlOiDguK3guYjguLLguJnguJ7guLLguKPguLLguKHg',
  'uLTguYDguJXguK3guKPguYzguIjguLLguIHguJfguLXguYjguK3guKLguLnguYjguKvguJnguYnguLLguYDguKfguYfguJrguJXguKPguIcg4LmGCiAgdHJ5IHsKICAgIHZhciBxID0gbmV3IFVSTFNlYXJjaFBhcmFtcyhsb2NhdGlvbi5zZWFyY2gpOwogICAgaWYg',
  'KHEuZ2V0KCdkJykgJiYgIUFVVEguZGV2aWNlKSB7IEFVVEguZGV2aWNlID0gcS5nZXQoJ2QnKTsgbHNTZXQoTFNfREVWSUNFLCBBVVRILmRldmljZSk7IH0KICAgIGlmIChxLmdldCgna2V5JykgJiYgIWFjY2Vzc0tleSgpKSBSRVNPTFZFRF9LRVkgPSBxLmdldCgn',
  'a2V5Jyk7CiAgfSBjYXRjaCAoZTIpIHsgLyog4LmA4Lia4Lij4Liy4Lin4LmM4LmA4LiL4Lit4Lij4LmM4LmA4LiB4LmI4Liy4Lih4Liy4LiBICovIH0KICBkb25lKCk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4LiV4Lix4Lin4LiE4Li44Lih4Lil4Liz4LiU4Lix',
  '4Lia4Lir4LiZ4LmJ4Liy4LiI4LitIC0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKiDguYDguKPguLXguKLguIHguJXguK3guJnguYDguJvguLTguJTguKvguJnguYnguLLguYDguKfguYfguJog4oCUIOC4leC4seC4lOC4quC4tOC4meC4p+C5iOC4suC4iOC4sOC5g+C4',
  'q+C5ieC5gOC4q+C5h+C4meC4reC4sOC5hOC4o+C4geC5iOC4reC4mSAqLwpmdW5jdGlvbiBhdXRoR2F0ZSgpewogIGxvYWRTdG9yZWQoZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2F1dGgubWUnKS50aGVuKGZ1bmN0aW9uKG1lKXsKICAgICAgQVVUSC5tZSA9IG1l',
  'OwogICAgICBpZiAobWUuc2lnbmVkSW4pIHJldHVybiBlbnRlckFwcChtZSk7CiAgICAgIGlmIChBVVRILmRldmljZSkgcmV0dXJuIHNob3dQaW4oKTsKICAgICAgc2hvd0xvZ2luKCk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgc2hvd0xvZ2luKGUu',
  'bWVzc2FnZSB8fCBlKTsKICAgIH0pOwogIH0pOwp9CgpmdW5jdGlvbiBlbnRlckFwcChtZSl7CiAgQVVUSC5tZSA9IG1lOwogIGhpZGVBdXRoKCk7CiAgYm9vdE5vdygpOwogIC8vIOC5gOC4nuC4tOC5iOC4h+C4peC5h+C4reC4geC4reC4tOC4meC4lOC5ieC4p+C4',
  'ouC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5geC4peC4sOC4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4leC4seC5ieC4hyBQSU4g4Lia4LiZ4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJIOKAlCDguIrguKfguJnguJXguLHguYnguIfguKrguLHguIHg',
  'uITguKPguLHguYnguIcKICBpZiAoIUFVVEguZGV2aWNlICYmIG1lLnVzZXJuYW1lICYmICFsc0dldCgnbWNvcm5lci5waW5Bc2tlZCcpKSB7CiAgICBzZXRUaW1lb3V0KG9mZmVyUGluLCA5MDApOwogIH0KfQoKZnVuY3Rpb24gaGlkZUF1dGgoKXsKICB2YXIgciA9',
  'IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdXRoUm9vdCcpOwogIGlmIChyKSByLmlubmVySFRNTCA9ICcnOwogIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbG9ja2VkJyk7Cn0KCmZ1bmN0aW9uIHNob3dBdXRoKGh0bWwpewogIGRvY3VtZW50LmJv',
  'ZHkuY2xhc3NMaXN0LmFkZCgnbG9ja2VkJyk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F1dGhSb290JykuaW5uZXJIVE1MID0KICAgICc8ZGl2IGNsYXNzPSJhdXRoLXdyYXAiPjxkaXYgY2xhc3M9ImF1dGgtY2FyZCI+JyArCiAgICAgICc8ZGl2IGNsYXNz',
  'PSJhdXRoLWJyYW5kIj7wn4+iIDxiPicgKyBlc2MoKFMuYm9vdCAmJiBTLmJvb3QuYXBwICYmIFMuYm9vdC5hcHAubmFtZSkgfHwgJ1RoZSBNIENvcm5lciBBUCcpICsgJzwvYj48L2Rpdj4nICsKICAgICAgaHRtbCArCiAgICAnPC9kaXY+PC9kaXY+JzsKfQoKLyog',
  'LS0tLS0tLS0tLS0tLS0tLSDguKvguJnguYnguLLguKXguYfguK3guIHguK3guLTguJnguJTguYnguKfguKLguKPguKvguLHguKrguJzguYjguLLguJkgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gc2hvd0xvZ2luKGVycil7CiAgQVVUSC5zY3JlZW4gPSAn',
  'bG9naW4nOwogIHNob3dBdXRoKAogICAgJzxoMiBjbGFzcz0iYXV0aC1oIj7guYDguILguYnguLLguKrguLnguYjguKPguLDguJrguJo8L2gyPicgKwogICAgJzxwIGNsYXNzPSJhdXRoLXN1YiI+4LmD4Liq4LmI4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJ',
  '4LmB4Lil4Liw4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LiX4Li14LmI4LmE4LiU4LmJ4Lij4Lix4LiaPC9wPicgKwogICAgKGVyciA/ICc8ZGl2IGNsYXNzPSJhdXRoLWVyciI+JyArIGVzYyhlcnIpICsgJzwvZGl2PicgOiAnPGRpdiBjbGFzcz0iYXV0aC1lcnIi',
  'IGlkPSJhdXRoRXJyIiBoaWRkZW4+PC9kaXY+JykgKwogICAgJzxkaXYgY2xhc3M9ImF1dGgtZiI+PGxhYmVsIGZvcj0ibGdVc2VyIj7guIrguLfguYjguK3guJzguLnguYnguYPguIrguYk8L2xhYmVsPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJs',
  'Z1VzZXIiIGF1dG9jb21wbGV0ZT0idXNlcm5hbWUiIGF1dG9jYXBpdGFsaXplPSJub25lIiBzcGVsbGNoZWNrPSJmYWxzZSI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iYXV0aC1mIj48bGFiZWwgZm9yPSJsZ1Bhc3MiPuC4o+C4q+C4seC4quC4nOC5iOC4suC4',
  'mTwvbGFiZWw+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImxnUGFzcyIgdHlwZT0icGFzc3dvcmQiIGF1dG9jb21wbGV0ZT0iY3VycmVudC1wYXNzd29yZCI+PC9kaXY+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSBhdXRoLWdvIiBpZD0i',
  'bGdHbyI+4LmA4LiC4LmJ4Liy4Liq4Li54LmI4Lij4Liw4Lia4LiaPC9idXR0b24+JyArCiAgICAoQVVUSC5kZXZpY2UgPyAnPGJ1dHRvbiBjbGFzcz0iYnRuIGF1dGgtYWx0IiBvbmNsaWNrPSJzaG93UGluKCkiPuKGkCDguIHguKXguLHguJrguYTguJvguYPguIrg',
  'uYkgUElOPC9idXR0b24+JyA6ICcnKSArCiAgICAnPHAgY2xhc3M9ImF1dGgtZm9vdCI+4Lil4Li34Lih4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZPyDguYPguKvguYnguJzguLnguYnguJTguLnguYHguKXguJXguLHguYnguIfguKPguKvguLHguKrguYPguKvguKHg',
  'uYjguYPguKvguYnguIjguLLguIHguYDguKHguJnguLnguYPguJnguIrguLXguJU8L3A+JwogICk7CgogIHZhciBnbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsZ0dvJyk7CiAgdmFyIHVzZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGdVc2VyJyk7',
  'CiAgdmFyIHBhc3MgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGdQYXNzJyk7CgogIGZ1bmN0aW9uIHN1Ym1pdCgpewogICAgdmFyIHUgPSB1c2VyLnZhbHVlLnRyaW0oKSwgcCA9IHBhc3MudmFsdWU7CiAgICBpZiAoIXUgfHwgIXApIHJldHVybiBhdXRoRXJy',
  'b3IoJ+C4geC4o+C4uOC4k+C4suC4geC4o+C4reC4geC4l+C4seC5ieC4h+C4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5ieC5geC4peC4sOC4o+C4q+C4seC4quC4nOC5iOC4suC4mScpOwogICAgZ28uZGlzYWJsZWQgPSB0cnVlOwogICAgZ28uaW5uZXJIVE1M',
  'ID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C4leC4o+C4p+C4iOC4quC4reC4muKApic7CiAgICBjYWxsQXBpKCdhdXRoLmxvZ2luJywgeyB1c2VybmFtZTogdSwgcGFzc3dvcmQ6IHAgfSkudGhlbihmdW5jdGlvbihyKXsKICAg',
  'ICAgc2F2ZVNlc3Npb24oci5zZXNzaW9uKTsKICAgICAgaWYgKHIubXVzdENoYW5nZSkgcmV0dXJuIHNob3dDaGFuZ2VQYXNzd29yZCh0cnVlKTsKICAgICAgcmV0dXJuIGNhbGxBcGkoJ2F1dGgubWUnKS50aGVuKGVudGVyQXBwKTsKICAgIH0pLmNhdGNoKGZ1bmN0',
  'aW9uKGUpewogICAgICBnby5kaXNhYmxlZCA9IGZhbHNlOwogICAgICBnby50ZXh0Q29udGVudCA9ICfguYDguILguYnguLLguKrguLnguYjguKPguLDguJrguJonOwogICAgICBwYXNzLnZhbHVlID0gJyc7CiAgICAgIGF1dGhFcnJvcihlLm1lc3NhZ2UgfHwgZSk7',
  'CiAgICB9KTsKICB9CgogIGdvLm9uY2xpY2sgPSBzdWJtaXQ7CiAgW3VzZXIsIHBhc3NdLmZvckVhY2goZnVuY3Rpb24oZWwpewogICAgZWwuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGV2KXsgaWYgKGV2LmtleSA9PT0gJ0VudGVyJykgc3Vi',
  'bWl0KCk7IH0pOwogIH0pOwogIHVzZXIuZm9jdXMoKTsKfQoKZnVuY3Rpb24gYXV0aEVycm9yKG1zZyl7CiAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F1dGhFcnInKTsKICBpZiAoZWwpIHsgZWwudGV4dENvbnRlbnQgPSBtc2c7IGVsLmhpZGRl',
  'biA9IGZhbHNlOyB9CiAgZWxzZSBzaG93TG9naW4obXNnKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguKvguJnguYnguLIgUElOIDYg4Lir4Lil4Lix4LiBIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIHNob3dQaW4oKXsKICBBVVRILnNjcmVlbiA9ICdw',
  'aW4nOwogIEFVVEgucGluID0gJyc7CiAgc2hvd0F1dGgoCiAgICAnPGgyIGNsYXNzPSJhdXRoLWgiPuC5g+C4quC5iCBQSU48L2gyPicgKwogICAgJzxwIGNsYXNzPSJhdXRoLXN1YiI+4Lib4Lil4LiU4Lil4LmH4Lit4LiB4LiU4LmJ4Lin4Lii4Lij4Lir4Lix4Liq',
  'IDYg4Lir4Lil4Lix4LiB4LiC4Lit4LiH4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJPC9wPicgKwogICAgJzxkaXYgY2xhc3M9ImF1dGgtZXJyIiBpZD0iYXV0aEVyciIgaGlkZGVuPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InBpbi1kb3RzIiBpZD0i',
  'cGluRG90cyI+JyArIHBpbkRvdHNIdG1sKCcnKSArICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJwaW4tcGFkIj4nICsKICAgICAgWzEsMiwzLDQsNSw2LDcsOCw5XS5tYXAoZnVuY3Rpb24obil7CiAgICAgICAgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJwaW4t',
  'ayIgb25jbGljaz0icGluUHVzaChcJycgKyBuICsgJ1wnKSI+JyArIG4gKyAnPC9idXR0b24+JzsKICAgICAgfSkuam9pbignJykgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0icGluLWsgZ2hvc3QiIG9uY2xpY2s9InNob3dMb2dpbigpIiB0aXRsZT0i4LmD4LiK4LmJ',
  '4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmB4LiX4LiZIj7wn5SRPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJwaW4tayIgb25jbGljaz0icGluUHVzaChcJzBcJykiPjA8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9InBpbi1rIGdo',
  'b3N0IiBvbmNsaWNrPSJwaW5CYWNrKCkiIHRpdGxlPSLguKXguJoiPuKMqzwvYnV0dG9uPicgKwogICAgJzwvZGl2PicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBhdXRoLWFsdCIgb25jbGljaz0iZm9yZ2V0VGhpc0RldmljZSgpIj7guKXguLfguKEgUElOIOKA',
  'lCDguYDguILguYnguLLguJTguYnguKfguKLguKPguKvguLHguKrguJzguYjguLLguJk8L2J1dHRvbj4nCiAgKTsKCiAgLy8g4LiE4Li14Lii4LmM4Lia4Lit4Lij4LmM4LiU4LiI4Lij4Li04LiH4LiB4LmH4LmD4LiK4LmJ4LmE4LiU4LmJIOC5hOC4oeC5iOC4leC5',
  'ieC4reC4h+C4iOC4tOC5ieC4oeC4m+C4uOC5iOC4oeC4muC4meC4iOC4rQogIGRvY3VtZW50Lm9ua2V5ZG93biA9IGZ1bmN0aW9uKGV2KXsKICAgIGlmIChBVVRILnNjcmVlbiAhPT0gJ3BpbicpIHJldHVybjsKICAgIGlmICgvXlxkJC8udGVzdChldi5rZXkpKSBw',
  'aW5QdXNoKGV2LmtleSk7CiAgICBlbHNlIGlmIChldi5rZXkgPT09ICdCYWNrc3BhY2UnKSBwaW5CYWNrKCk7CiAgfTsKfQoKZnVuY3Rpb24gcGluRG90c0h0bWwocGluKXsKICB2YXIgaHRtbCA9ICcnOwogIGZvciAodmFyIGkgPSAwOyBpIDwgNjsgaSsrKSBodG1s',
  'ICs9ICc8aSBjbGFzcz0iJyArIChpIDwgcGluLmxlbmd0aCA/ICdvbicgOiAnJykgKyAnIj48L2k+JzsKICByZXR1cm4gaHRtbDsKfQoKZnVuY3Rpb24gcGluUHVzaChkKXsKICBpZiAoQVVUSC5waW4ubGVuZ3RoID49IDYpIHJldHVybjsKICBBVVRILnBpbiArPSBk',
  'OwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaW5Eb3RzJykuaW5uZXJIVE1MID0gcGluRG90c0h0bWwoQVVUSC5waW4pOwogIGlmIChBVVRILnBpbi5sZW5ndGggPT09IDYpIHNldFRpbWVvdXQocGluU3VibWl0LCAxMjApOwp9CgpmdW5jdGlvbiBwaW5CYWNr',
  'KCl7CiAgQVVUSC5waW4gPSBBVVRILnBpbi5zbGljZSgwLCAtMSk7CiAgdmFyIGQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGluRG90cycpOwogIGlmIChkKSBkLmlubmVySFRNTCA9IHBpbkRvdHNIdG1sKEFVVEgucGluKTsKfQoKZnVuY3Rpb24gcGluU3Vi',
  'bWl0KCl7CiAgdmFyIHBpbiA9IEFVVEgucGluOwogIEFVVEgucGluID0gJyc7CiAgdmFyIGRvdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGluRG90cycpOwogIGlmIChkb3RzKSBkb3RzLmNsYXNzTGlzdC5hZGQoJ2J1c3knKTsKCiAgY2FsbEFwaSgnYXV0',
  'aC51bmxvY2snLCB7IGRldmljZTogQVVUSC5kZXZpY2UsIHBpbjogcGluIH0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICBzYXZlU2Vzc2lvbihyLnNlc3Npb24pOwogICAgZG9jdW1lbnQub25rZXlkb3duID0gbnVsbDsKICAgIHJldHVybiBjYWxsQXBpKCdhdXRoLm1l',
  'JykudGhlbihlbnRlckFwcCk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICB2YXIgbXNnID0gU3RyaW5nKGUubWVzc2FnZSB8fCBlKTsKICAgIGlmIChkb3RzKSB7IGRvdHMuY2xhc3NMaXN0LnJlbW92ZSgnYnVzeScpOyBkb3RzLmNsYXNzTGlzdC5hZGQoJ3No',
  'YWtlJyk7IGRvdHMuaW5uZXJIVE1MID0gcGluRG90c0h0bWwoJycpOyB9CiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IGlmIChkb3RzKSBkb3RzLmNsYXNzTGlzdC5yZW1vdmUoJ3NoYWtlJyk7IH0sIDUwMCk7CiAgICBhdXRoRXJyb3IobXNnKTsKICAgIC8vIFBJ',
  'TiDguJbguLnguIHguKLguIHguYDguKXguLTguIHguYTguJvguYHguKXguYnguKcgKOC4nOC4tOC4lOC4hOC4o+C4muC5guC4hOC4p+C4leC4siAvIOC4q+C4oeC4lOC4reC4suC4ouC4uCkg4oCUIOC4leC5ieC4reC4h+C4geC4peC4seC4muC5hOC4m+C5g+C4iuC5',
  'ieC4o+C4q+C4seC4quC4nOC5iOC4suC4mQogICAgaWYgKC/guKXguYfguK3guIHguK3guLTguJnguJTguYnguKfguKLguKPguKvguLHguKrguJzguYjguLLguJkvLnRlc3QobXNnKSkgewogICAgICBzYXZlRGV2aWNlKCcnKTsKICAgICAgc2V0VGltZW91dChmdW5j',
  'dGlvbigpeyBzaG93TG9naW4obXNnKTsgfSwgMTQwMCk7CiAgICB9CiAgfSk7Cn0KCmZ1bmN0aW9uIGZvcmdldFRoaXNEZXZpY2UoKXsKICB2YXIgdG9rZW4gPSBBVVRILmRldmljZTsKICBzYXZlRGV2aWNlKCcnKTsKICBsc1NldCgnbWNvcm5lci5waW5Bc2tlZCcs',
  'ICcnKTsKICBkb2N1bWVudC5vbmtleWRvd24gPSBudWxsOwogIGlmICh0b2tlbikgY2FsbEFwaSgnYXV0aC5mb3JnZXREZXZpY2UnLCB7IGRldmljZTogdG9rZW4gfSkuY2F0Y2goZnVuY3Rpb24oKXsgLyog4Lir4Lih4LiU4Lit4Liy4Lii4Li44LmE4Lib4LmB4Lil',
  '4LmJ4Lin4LiB4LmH4LiK4LmI4Liy4LiH4Lih4Lix4LiZICovIH0pOwogIHNob3dMb2dpbigpOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4leC4seC5ieC4hyBQSU4gLS0tLS0tLS0tLS0tLS0tLSAqLwoKLyoqIOC4iuC4p+C4meC4leC4seC5ieC4hyBQSU4g4Lir',
  '4Lil4Lix4LiH4Lil4LmH4Lit4LiB4Lit4Li04LiZ4LiE4Lij4Lix4LmJ4LiH4LmB4Lij4LiB4Lia4LiZ4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJICovCmZ1bmN0aW9uIG9mZmVyUGluKCl7CiAgbHNTZXQoJ21jb3JuZXIucGluQXNrZWQnLCAnMScpOwog',
  'IG9wZW5Nb2RhbCgn4LiV4Lix4LmJ4LiHIFBJTiDguKrguLPguKvguKPguLHguJrguYDguITguKPguLfguYjguK3guIfguJnguLXguYknLAogICAgJzxwPuC4leC4seC5ieC4h+C4o+C4q+C4seC4qiA2IOC4q+C4peC4seC4geC5hOC4p+C5iSDguIjguLDguYTguJTg',
  'uYnguYTguKHguYjguJXguYnguK3guIfguJ7guLTguKHguJ7guYzguKPguKvguLHguKrguJzguYjguLLguJnguJfguLjguIHguITguKPguLHguYnguIfguJfguLXguYjguYDguJvguLTguJQ8L3A+JyArCiAgICAnPHAgY2xhc3M9Im11dGVkIGZzMTMiPlBJTiDguJzg',
  'uLnguIHguIHguLHguJrguYDguITguKPguLfguYjguK3guIfguJnguLXguYnguYDguITguKPguLfguYjguK3guIfguYDguJTguLXguKLguKcg4LmA4LiE4Lij4Li34LmI4Lit4LiH4Lit4Li34LmI4LiZ4LmD4LiK4LmJ4LmE4Lih4LmI4LmE4LiU4LmJIMK3IOC4ouC4',
  'geC5gOC4peC4tOC4geC5gOC4oeC4t+C5iOC4reC5hOC4q+C4o+C5iOC4geC5h+C5hOC4lOC5ieC5g+C4meC4q+C4meC5ieC4suC4leC4seC5ieC4h+C4hOC5iOC4sjwvcD4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7g',
  'uYTguKfguYnguIHguYjguK3guJk8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCk7Zm9ybVNldFBpbigpIj7guJXguLHguYnguIcgUElOIOC5gOC4peC4ojwvYnV0dG9uPicpOwp9CgpmdW5jdGlvbiBm',
  'b3JtU2V0UGluKCl7CiAgb3Blbk1vZGFsKCfguJXguLHguYnguIcgUElOIDYg4Lir4Lil4Lix4LiBJywKICAgICc8ZGl2IGNsYXNzPSJmZ3JpZCI+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIGZ1bGwiPjxsYWJlbCBmb3I9InBpbjEiPlBJTiDguYPguKvguKHguYg8',
  'L2xhYmVsPicgKwogICAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9InBpbjEiIHR5cGU9InBhc3N3b3JkIiBpbnB1dG1vZGU9Im51bWVyaWMiIG1heGxlbmd0aD0iNiIgJyArCiAgICAgICAgJ2F1dG9jb21wbGV0ZT0ibmV3LXBhc3N3b3JkIiBwbGFjZWhvbGRl',
  'cj0i4oCi4oCi4oCi4oCi4oCi4oCiIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYgZnVsbCI+PGxhYmVsIGZvcj0icGluMiI+4LmD4Liq4LmIIFBJTiDguK3guLXguIHguITguKPguLHguYnguIc8L2xhYmVsPicgKwogICAgICAgICc8aW5wdXQgY2xhc3M9',
  'ImlucCIgaWQ9InBpbjIiIHR5cGU9InBhc3N3b3JkIiBpbnB1dG1vZGU9Im51bWVyaWMiIG1heGxlbmd0aD0iNiIgJyArCiAgICAgICAgJ2F1dG9jb21wbGV0ZT0ibmV3LXBhc3N3b3JkIiBwbGFjZWhvbGRlcj0i4oCi4oCi4oCi4oCi4oCi4oCiIj48L2Rpdj4nICsK',
  'ICAgICAgJzxkaXYgY2xhc3M9ImYgZnVsbCI+PGxhYmVsIGZvcj0icGluRGV2Ij7guIrguLfguYjguK3guYDguITguKPguLfguYjguK3guIcgKOC5hOC4p+C5ieC4lOC4ueC4ouC5ieC4reC4meC4q+C4peC4seC4hyk8L2xhYmVsPicgKwogICAgICAgICc8aW5wdXQg',
  'Y2xhc3M9ImlucCIgaWQ9InBpbkRldiIgdmFsdWU9IicgKyBlc2MoZ3Vlc3NEZXZpY2VOYW1lKCkpICsgJyI+PC9kaXY+JyArCiAgICAnPC9kaXY+JyArCiAgICAnPHAgY2xhc3M9Im11dGVkIGZzMTMgbXQ4Ij7guKvguKXguLXguIHguYDguKXguLXguYjguKLguIfg',
  'uYDguKXguILguJfguLXguYjguYDguJTguLLguIfguYjguLLguKIg4LmA4LiK4LmI4LiZIDExMTExMSDguKvguKPguLfguK0gMTIzNDU2PC9wPicsCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4',
  'gTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIGlkPSJwaW5HbyI+4Lia4Lix4LiZ4LiX4Li24LiBIFBJTjwvYnV0dG9uPicpOwoKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGluR28nKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsKICAg',
  'IHZhciBhID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpbjEnKS52YWx1ZTsKICAgIHZhciBiID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpbjInKS52YWx1ZTsKICAgIGlmICghL15cZHs2fSQvLnRlc3QoYSkpIHJldHVybiB0b2FzdCgnUElOIOC4leC5',
  'ieC4reC4h+C5gOC4m+C5h+C4meC4leC4seC4p+C5gOC4peC4giA2IOC4q+C4peC4seC4gScsICdlcnInKTsKICAgIGlmIChhICE9PSBiKSByZXR1cm4gdG9hc3QoJ1BJTiDguKrguK3guIfguIrguYjguK3guIfguYTguKHguYjguJXguKPguIfguIHguLHguJknLCAn',
  'ZXJyJyk7CiAgICB2YXIgYnRuID0gdGhpczsKICAgIGJ0bi5kaXNhYmxlZCA9IHRydWU7CiAgICBidG4uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C4muC4seC4meC4l+C4tuC4geKApic7CiAgICBjYWxsQXBp',
  'KCdhdXRoLnNldFBpbicsIHsgcGluOiBhLCBkZXZpY2U6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaW5EZXYnKS52YWx1ZSB9KS50aGVuKGZ1bmN0aW9uKHIpewogICAgICBzYXZlRGV2aWNlKHIuZGV2aWNlKTsKICAgICAgY2xvc2VNb2RhbCgpOwogICAgICB0',
  'b2FzdCgn4LiV4Lix4LmJ4LiHIFBJTiDguYDguKPguLXguKLguJrguKPguYnguK3guKIg4oCUIOC4hOC4o+C4seC5ieC4h+C4q+C4meC5ieC4suC5g+C4quC5iOC5geC4hOC5iCA2IOC4q+C4peC4seC4gScsICdvaycpOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7',
  'CiAgICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlOwogICAgICBidG4udGV4dENvbnRlbnQgPSAn4Lia4Lix4LiZ4LiX4Li24LiBIFBJTic7CiAgICAgIHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7CiAgICB9KTsKICB9Owp9CgpmdW5jdGlvbiBndWVzc0Rldmlj',
  'ZU5hbWUoKXsKICB2YXIgdWEgPSBuYXZpZ2F0b3IudXNlckFnZW50IHx8ICcnOwogIGlmICgvaVBob25lLy50ZXN0KHVhKSkgcmV0dXJuICdpUGhvbmUnOwogIGlmICgvaVBhZC8udGVzdCh1YSkpIHJldHVybiAnaVBhZCc7CiAgaWYgKC9BbmRyb2lkLy50ZXN0KHVh',
  'KSkgcmV0dXJuICdBbmRyb2lkJzsKICBpZiAoL01hY2ludG9zaC8udGVzdCh1YSkpIHJldHVybiAnTWFjJzsKICBpZiAoL1dpbmRvd3MvLnRlc3QodWEpKSByZXR1cm4gJ1dpbmRvd3MnOwogIHJldHVybiAn4Lit4Li44Lib4LiB4Lij4LiT4LmM4LiC4Lit4LiH4LiJ',
  '4Lix4LiZJzsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguYDguJvguKXguLXguYjguKLguJnguKPguKvguLHguKrguJzguYjguLLguJkgLS0tLS0tLS0tLS0tLS0tLSAqLwoKLyoqIEBwYXJhbSB7Ym9vbGVhbn0gZm9yY2VkIHRydWUgPSDguKPguLDguJrguJrguJrg',
  'uLHguIfguITguLHguJrguYDguJvguKXguLXguYjguKLguJnguJXguK3guJnguKXguYfguK3guIHguK3guLTguJnguITguKPguLHguYnguIfguYHguKPguIEgKi8KZnVuY3Rpb24gc2hvd0NoYW5nZVBhc3N3b3JkKGZvcmNlZCl7CiAgaWYgKCFmb3JjZWQpIHJldHVy',
  'biBmb3JtQ2hhbmdlUGFzc3dvcmQoKTsKICBBVVRILnNjcmVlbiA9ICdjaGFuZ2UnOwogIHNob3dBdXRoKAogICAgJzxoMiBjbGFzcz0iYXV0aC1oIj7guJXguLHguYnguIfguKPguKvguLHguKrguJzguYjguLLguJnguILguK3guIfguITguLjguJPguYDguK3guIc8',
  'L2gyPicgKwogICAgJzxwIGNsYXNzPSJhdXRoLXN1YiI+4Lij4Lir4Lix4Liq4LiX4Li14LmI4LmE4LiU4LmJ4Lih4Liy4LmA4Lib4LmH4LiZ4Lij4Lir4Lix4Liq4LiK4Lix4LmI4Lin4LiE4Lij4Liy4LinIOC5gOC4m+C4peC4teC5iOC4ouC4meC4geC5iOC4reC4',
  'meC5g+C4iuC5ieC4h+C4suC4meC4q+C4meC4tuC5iOC4h+C4hOC4o+C4seC5ieC4hzwvcD4nICsKICAgICc8ZGl2IGNsYXNzPSJhdXRoLWVyciIgaWQ9ImF1dGhFcnIiIGhpZGRlbj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJhdXRoLWYiPjxsYWJlbCBmb3I9',
  'ImNwT2xkIj7guKPguKvguLHguKrguJzguYjguLLguJnguYDguJTguLTguKE8L2xhYmVsPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJjcE9sZCIgdHlwZT0icGFzc3dvcmQiIGF1dG9jb21wbGV0ZT0iY3VycmVudC1wYXNzd29yZCI+PC9kaXY+JyAr',
  'CiAgICAnPGRpdiBjbGFzcz0iYXV0aC1mIj48bGFiZWwgZm9yPSJjcE5ldyI+4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmIICjguK3guKLguYjguLLguIfguJnguYnguK3guKIgOCDguJXguLHguKcpPC9sYWJlbD4nICsKICAgICAgJzxpbnB1dCBj',
  'bGFzcz0iaW5wIiBpZD0iY3BOZXciIHR5cGU9InBhc3N3b3JkIiBhdXRvY29tcGxldGU9Im5ldy1wYXNzd29yZCI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iYXV0aC1mIj48bGFiZWwgZm9yPSJjcE5ldzIiPuC5g+C4quC5iOC4o+C4q+C4seC4quC4nOC5iOC4',
  'suC4meC5g+C4q+C4oeC5iOC4reC4teC4geC4hOC4o+C4seC5ieC4hzwvbGFiZWw+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImNwTmV3MiIgdHlwZT0icGFzc3dvcmQiIGF1dG9jb21wbGV0ZT0ibmV3LXBhc3N3b3JkIj48L2Rpdj4nICsKICAgICc8',
  'YnV0dG9uIGNsYXNzPSJidG4gcHJpIGF1dGgtZ28iIGlkPSJjcEdvIj7guJrguLHguJnguJfguLbguIHguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYg8L2J1dHRvbj4nCiAgKTsKCiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NwR28nKS5vbmNs',
  'aWNrID0gZnVuY3Rpb24oKXsKICAgIHZhciBvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NwT2xkJykudmFsdWU7CiAgICB2YXIgbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjcE5ldycpLnZhbHVlOwogICAgdmFyIG4yID0gZG9jdW1lbnQuZ2V0RWxl',
  'bWVudEJ5SWQoJ2NwTmV3MicpLnZhbHVlOwogICAgaWYgKG4ubGVuZ3RoIDwgOCkgcmV0dXJuIGF1dGhFcnJvcign4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmI4LiV4LmJ4Lit4LiH4Lii4Liy4Lin4Lit4Lii4LmI4Liy4LiH4LiZ4LmJ4Lit4Lii',
  'IDgg4LiV4Lix4Lin4Lit4Lix4LiB4Lip4LijJyk7CiAgICBpZiAobiAhPT0gbjIpIHJldHVybiBhdXRoRXJyb3IoJ+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iOC4quC4reC4h+C4iuC5iOC4reC4h+C5hOC4oeC5iOC4leC4o+C4h+C4geC4seC4',
  'mScpOwogICAgdmFyIGJ0biA9IHRoaXM7CiAgICBidG4uZGlzYWJsZWQgPSB0cnVlOwogICAgYnRuLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDguIHguLPguKXguLHguIfguJrguLHguJnguJfguLbguIHigKYnOwogICAgY2FsbEFwaSgn',
  'YXV0aC5jaGFuZ2VQYXNzd29yZCcsIHsgb2xkUGFzc3dvcmQ6IG8sIG5ld1Bhc3N3b3JkOiBuLCBfZGV2aWNlOiBBVVRILmRldmljZSB8fCAnJyB9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICAgIHJldHVybiBjYWxsQXBpKCdhdXRoLm1lJykudGhlbihlbnRlckFwcCk7',
  'CiAgICB9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICAgIHRvYXN0KCfguYDguJvguKXguLXguYjguKLguJnguKPguKvguLHguKrguJzguYjguLLguJnguYDguKPguLXguKLguJrguKPguYnguK3guKInLCAnb2snKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAg',
  'ICBidG4uZGlzYWJsZWQgPSBmYWxzZTsKICAgICAgYnRuLnRleHRDb250ZW50ID0gJ+C4muC4seC4meC4l+C4tuC4geC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iCc7CiAgICAgIGF1dGhFcnJvcihlLm1lc3NhZ2UgfHwgZSk7CiAgICB9KTsKICB9',
  'OwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjcE9sZCcpLmZvY3VzKCk7Cn0KCmZ1bmN0aW9uIGZvcm1DaGFuZ2VQYXNzd29yZCgpewogIG9wZW5Nb2RhbCgn4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZJywKICAgICc8ZGl2',
  'IGNsYXNzPSJmZ3JpZCI+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIGZ1bGwiPjxsYWJlbCBmb3I9Im1jT2xkIj7guKPguKvguLHguKrguJzguYjguLLguJnguYDguJTguLTguKE8L2xhYmVsPjxpbnB1dCBjbGFzcz0iaW5wIiBpZD0ibWNPbGQiIHR5cGU9InBhc3N3',
  'b3JkIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYgZnVsbCI+PGxhYmVsIGZvcj0ibWNOZXciPuC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iCAo4Lit4Lii4LmI4Liy4LiH4LiZ4LmJ4Lit4LiiIDgg4LiV4Lix4LinKTwvbGFiZWw+PGlu',
  'cHV0IGNsYXNzPSJpbnAiIGlkPSJtY05ldyIgdHlwZT0icGFzc3dvcmQiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiBmdWxsIj48bGFiZWwgZm9yPSJtY05ldzIiPuC5g+C4quC5iOC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iOC4reC4',
  'teC4geC4hOC4o+C4seC5ieC4hzwvbGFiZWw+PGlucHV0IGNsYXNzPSJpbnAiIGlkPSJtY05ldzIiIHR5cGU9InBhc3N3b3JkIj48L2Rpdj4nICsKICAgICc8L2Rpdj4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLg',
  'uIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBpZD0ibWNHbyI+4Lia4Lix4LiZ4LiX4Li24LiBPC9idXR0b24+Jyk7CgogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtY0dvJykub25jbGljayA9IGZ1bmN0aW9u',
  'KCl7CiAgICB2YXIgbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtY05ldycpLnZhbHVlOwogICAgaWYgKG4ubGVuZ3RoIDwgOCkgcmV0dXJuIHRvYXN0KCfguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYjguJXguYnguK3guIfguKLguLLguKfg',
  'uK3guKLguYjguLLguIfguJnguYnguK3guKIgOCDguJXguLHguKfguK3guLHguIHguKnguKMnLCAnZXJyJyk7CiAgICBpZiAobiAhPT0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21jTmV3MicpLnZhbHVlKSByZXR1cm4gdG9hc3QoJ+C4o+C4q+C4seC4quC4nOC5',
  'iOC4suC4meC5g+C4q+C4oeC5iOC4quC4reC4h+C4iuC5iOC4reC4h+C5hOC4oeC5iOC4leC4o+C4h+C4geC4seC4mScsICdlcnInKTsKICAgIHZhciBidG4gPSB0aGlzOwogICAgYnRuLmRpc2FibGVkID0gdHJ1ZTsKICAgIGNhbGxBcGkoJ2F1dGguY2hhbmdlUGFz',
  'c3dvcmQnLCB7CiAgICAgIG9sZFBhc3N3b3JkOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWNPbGQnKS52YWx1ZSwgbmV3UGFzc3dvcmQ6IG4sIF9kZXZpY2U6IEFVVEguZGV2aWNlIHx8ICcnCiAgICB9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICAgIGNsb3NlTW9k',
  'YWwoKTsKICAgICAgdG9hc3QoJ+C5gOC4m+C4peC4teC5iOC4ouC4meC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5gOC4o+C4teC4ouC4muC4o+C5ieC4reC4oicsICdvaycpOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgIGJ0bi5kaXNhYmxlZCA9IGZh',
  'bHNlOwogICAgICB0b2FzdChlLm1lc3NhZ2UgfHwgZSwgJ2VycicpOwogICAgfSk7CiAgfTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguK3guK3guIHguIjguLLguIHguKPguLDguJrguJogLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gZG9Mb2dvdXQoa2Vl',
  'cFBpbil7CiAgdmFyIHMgPSBBVVRILnNlc3Npb247CiAgc2F2ZVNlc3Npb24oJycpOwogIGlmICgha2VlcFBpbikgeyB2YXIgZCA9IEFVVEguZGV2aWNlOyBzYXZlRGV2aWNlKCcnKTsgaWYgKGQpIGNhbGxBcGkoJ2F1dGguZm9yZ2V0RGV2aWNlJywgeyBkZXZpY2U6',
  'IGQgfSkuY2F0Y2goZnVuY3Rpb24oKXt9KTsgfQogIGlmIChzKSBjYWxsQXBpKCdhdXRoLmxvZ291dCcsIHsgX3Nlc3Npb246IHMgfSkuY2F0Y2goZnVuY3Rpb24oKXsgLyog4Lir4Lih4LiU4Lit4Liy4Lii4Li44LmB4Lil4LmJ4Lin4LiB4LmH4LiW4Li34Lit4Lin',
  '4LmI4Liy4Lit4Lit4LiB4LmB4Lil4LmJ4LinICovIH0pOwogIGNsb3NlTW9kYWwoKTsKICBBVVRILm1lID0gbnVsbDsKICBpZiAoQVVUSC5kZXZpY2UpIHNob3dQaW4oKTsgZWxzZSBzaG93TG9naW4oKTsKfQoKZnVuY3Rpb24gY29uZmlybUxvZ291dCgpewogIG9w',
  'ZW5Nb2RhbCgn4Lit4Lit4LiB4LiI4Liy4LiB4Lij4Liw4Lia4LiaJywKICAgICc8cD7guJXguYnguK3guIfguIHguLLguKPguK3guK3guIHguIjguLLguIHguKPguLDguJrguJrguYPguIrguYjguYTguKvguKE8L3A+JyArCiAgICAoQVVUSC5kZXZpY2UgPyAnPHAg',
  'Y2xhc3M9Im11dGVkIGZzMTMiPlBJTiDguJrguJnguYDguITguKPguLfguYjguK3guIfguJnguLXguYnguIjguLDguKLguLHguIfguK3guKLguLnguYgg4LiE4Lij4Lix4LmJ4LiH4Lir4LiZ4LmJ4Liy4LmA4LiC4LmJ4Liy4LiU4LmJ4Lin4LiiIFBJTiDguYTguJTg',
  'uYnguYDguKXguKI8L3A+JyA6ICcnKSwKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lii4LiB4LmA4Lil4Li04LiBPC9idXR0b24+JyArCiAgICAoQVVUSC5kZXZpY2UgPyAnPGJ1dHRvbiBjbGFzcz0iYnRuIGRnciIgb25j',
  'bGljaz0iZG9Mb2dvdXQoZmFsc2UpIj7guK3guK3guIHguYHguKXguLDguKXguJogUElOPC9idXR0b24+JyA6ICcnKSArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZG9Mb2dvdXQodHJ1ZSkiPuC4reC4reC4geC4iOC4suC4geC4o+C4sOC4',
  'muC4mjwvYnV0dG9uPicpOwp9Cjwvc2NyaXB0Pgo8c2NyaXB0PgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgVmlld3MuaHRtbCDigJQg4LiV4Lix4Lin4LmC4Lir4Lil4LiUICsg4LiV4Lix4Lin',
  '4Lin4Liy4LiU4LiC4Lit4LiH4LmB4LiV4LmI4Lil4Liw4Lir4LiZ4LmJ4LiyCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKdmFyIFJPVVRFUyA9IHt9OwoKLyogPT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDEpIOC4oOC4suC4nuC4o+C4p+C4oQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLmRhc2hib2Fy',
  'ZCA9IHsKICBsb2FkOiBmdW5jdGlvbigpeyByZXR1cm4gY2FsbEFwaSgnYXBwLmRhc2hib2FyZCcsIHsgeWVhcjogUy55ZWFyIH0pOyB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgYiA9IGQuYnVpbGRpbmc7CiAgICB2YXIga3BpcyA9CiAgICAgIGtw',
  'aSgn4Lii4Lit4LiU4Lir4LiZ4Li14LmJ4LiE4LiH4LmA4Lir4Lil4Li34Lit4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJywgYmFodChkLmRlYnRBbGwucmVtYWluaW5nKSwKICAgICAgICAgICfguIjguLLguIHguKLguK3guJTguKvguJnguLXguYkgJyArIGJhaHQoZC5k',
  'ZWJ0QWxsLnRvdGFsRGVidCkgKyAnIMK3IOC4iuC4s+C4o+C4sOC5geC4peC5ieC4pyAnICsgcGN0KGQuZGVidEFsbC5wZXJjZW50KSwgJ2FjY2VudCcpICsKICAgICAga3BpKCfguIrguLPguKPguLDguYHguKXguYnguKcgKOC4q+C4meC4teC5ieC4q+C4peC4seC4',
  'gSknLCBwY3QoZC5kZWJ0TWFpbi5wZXJjZW50KSwgYmFodChkLmRlYnRNYWluLnBhaWQpICsgJyDguIjguLLguIEgJyArIGJhaHQoZC5kZWJ0TWFpbi50b3RhbCksICdnb29kJykgKwogICAgICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC4m+C4',
  'tSAnICsgZC55ZWFyLCBiYWh0KGQuc3BlbmRUaGlzWWVhciksICfguIvguLfguYnguK3guILguK3guIcgKyDguIvguYjguK3guKHguYHguIvguKEgKyDguKXguYnguLLguIfguYHguK3guKPguYwnKSArCiAgICAgIGtwaSgn4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiE',
  '4LmJ4Liy4LiHJywgZC5yZXBhaXJzLm9wZW5Kb2JzICsgJyDguIfguLLguJknLCBkLnJlcGFpcnMub3ZlcmR1ZSArICcg4LiH4Liy4LiZ4LmA4LiB4Li04LiZ4LiB4Liz4Lir4LiZ4LiUJywgZC5yZXBhaXJzLm92ZXJkdWUgPyAnYmFkJyA6ICcnKTsKCiAgICB2YXIg',
  'YWxlcnRzID0gZC5hbGVydHMubGVuZ3RoCiAgICAgID8gJzxkaXYgY2xhc3M9ImFsaXN0Ij4nICsgZC5hbGVydHMuc2xpY2UoMCwxMikubWFwKGZ1bmN0aW9uKGEpewogICAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJhbGkgbC0nICsgYS5sZXZlbCArICciIG9u',
  'Y2xpY2s9ImdvKFwnJyArIGp1bXBQYWdlKGEubW9kdWxlKSArICdcJykiPicgKwogICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJpYyI+JyArIGEuaWNvbiArICc8L2Rpdj48ZGl2PjxkaXYgY2xhc3M9InR0Ij4nICsgZXNjKGEudGl0bGUpICsgJzwvZGl2Picg',
  'KwogICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJkZCI+JyArIGVzYyhhLmRldGFpbCkgKyAnPC9kaXY+PC9kaXY+PC9kaXY+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nCiAgICAgIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJi',
  'aWciPuKchTwvZGl2PuC5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4hOC5ieC4suC4hyDigJQg4LiX4Li44LiB4Lit4Lii4LmI4Liy4LiH4LmA4Lij4Li14Lii4Lia4Lij4LmJ4Lit4LiiPC9kaXY+JzsKCiAgICByZXR1cm4gJycgKwogICAgICAnPGRpdiBjbGFzcz0i',
  'Z3JpZCBnNCBtYjEyIj4nICsga3BpcyArICc8L2Rpdj4nICsKCiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGcyIG1iMTIiPicgKwogICAgICAgIGNhcmQoJ/CfkrAg4Lij4Liy4Lii4LiB4Liy4Lij4Liq4Lij4Li44Lib4Lij4Lin4LihICjguKvguJnguLXguYnguKvg',
  'uKXguLHguIEpJywKICAgICAgICAgIGRlYnRNaW5pKGQuZGVidE1haW4sICdkZWJ0TWFpbicpLAogICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZ28oXCdkZWJ0TWFpblwnKSI+4LiU4Li54LiX4Lix4LmJ4LiH4Lir4Lih4LiUIOKGkjwv',
  'YnV0dG9uPicpICsKICAgICAgICBjYXJkKCfwn6e+IOC4q+C4meC4teC5ieC4quC4tOC4mSAo4Lir4LiZ4Li14LmJ4Lij4Lit4LiHKScsCiAgICAgICAgICBkZWJ0TWluaShkLmRlYnRTdWIsICdkZWJ0U3ViJykgKwogICAgICAgICAgKGQuZGVidFN1Yi5pbnRlcmVz',
  'dFRoaXNZZWFyID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbXQ4Ij7guJTguK3guIHguYDguJrguLXguYnguKLguJfguLXguYjguIrguLPguKPguLDguJvguLUgJyArIGQueWVhciArICc6IDxiPicgKyBiYWh0KGQuZGVidFN1Yi5pbnRlcmVzdFRoaXNZZWFyKSAr',
  'ICc8L2I+PC9kaXY+JyA6ICcnKSwKICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImdvKFwnZGVidFN1YlwnKSI+4LiU4Li54LiX4Lix4LmJ4LiH4Lir4Lih4LiUIOKGkjwvYnV0dG9uPicpICsKICAgICAgJzwvZGl2PicgKwoKICAgICAg',
  'JzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgICAga3BpKCfguKvguYnguK3guIfguJfguLHguYnguIfguKvguKHguJQnLCBiLnRvdGFsUm9vbXMgKyAnIOC4q+C5ieC4reC4hycsICfguKHguLXguJzguLnguYnguYDguIrguYjguLIgJyArIGIub2Nj',
  'dXBpZWQgKyAnIMK3IOC4p+C5iOC4suC4hyAnICsgYi52YWNhbnQpICsKICAgICAgICBrcGkoJ+C4peC5ieC4suC4h+C5geC4reC4o+C5jOC4m+C4tSAnICsgZC55ZWFyLCBkLmFjLnJvb21zRG9uZSArICcvJyArIGIudG90YWxSb29tcyArICcg4Lir4LmJ4Lit4LiH',
  'JywgZC5hYy5kb25lSW5ZZWFyICsgJyDguKPguK3guJogwrcg4LiE4LmJ4Liy4LiHICcgKyBkLmFjLnJvb21zUGVuZGluZyArICcg4Lir4LmJ4Lit4LiHJywgZC5hYy5yb29tc1BlbmRpbmcgPyAnd2FybicgOiAnZ29vZCcpICsKICAgICAgICBrcGkoJ+C4i+C4t+C5',
  'ieC4reC4guC4reC4h+C4m+C4tSAnICsgZC55ZWFyLCBiYWh0KGQucHVyY2hhc2VzLnllYXJUb3RhbCksIGQucHVyY2hhc2VzLnllYXJDb3VudCArICcg4Lij4Liy4Lii4LiB4Liy4LijJykgKwogICAgICAgIGtwaSgn4Lib4Lij4Liw4LiB4Lix4LiZ4LmD4LiB4Lil',
  '4LmJ4Lir4Lih4LiUJywgZC5wdXJjaGFzZXMud2FycmFudHkuZXhwaXJpbmcgKyAnIOC4o+C4suC4ouC4geC4suC4oycsICfguKvguKHguJTguK3guLLguKLguLjguYHguKXguYnguKcgJyArIGQucHVyY2hhc2VzLndhcnJhbnR5LmV4cGlyZWQsIGQucHVyY2hhc2Vz',
  'LndhcnJhbnR5LmV4cGlyaW5nID8gJ3dhcm4nIDogJycpICsKICAgICAgJzwvZGl2PicgKwoKICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzIgbWIxMiI+JyArCiAgICAgICAgY2FyZCgn8J+TkiDguKPguLLguKLguKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4Lii',
  '4Lir4LitIOC4m+C4tSAnICsgZC55ZWFyLAogICAgICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzMgbWIxMiI+JyArCiAgICAgICAgICAgIGtwaSgn4Lij4Liy4Lii4Lij4Lix4LiaJywgYmFodChkLmZpbmFuY2UuaW5jb21lKSwgJ+C5gOC4ieC4peC4teC5iOC4oiAn',
  'ICsgYmFodChkLmZpbmFuY2UuYXZnSW5jb21lKSArICcv4LmA4LiU4Li34Lit4LiZJywgJ2dvb2QnKSArCiAgICAgICAgICAgIGtwaSgn4Lij4Liy4Lii4LiI4LmI4Liy4LiiJywgYmFodChkLmZpbmFuY2UuZXhwZW5zZSksICfguYDguInguKXguLXguYjguKIgJyAr',
  'IGJhaHQoZC5maW5hbmNlLmF2Z0V4cGVuc2UpICsgJy/guYDguJTguLfguK3guJknLCAnYmFkJykgKwogICAgICAgICAgICBrcGkoJ+C4hOC4h+C5gOC4q+C4peC4t+C4reC4quC4uOC4l+C4mOC4tCcsIGJhaHQoZC5maW5hbmNlLm5ldCksICfguK3guLHguJXguKPg',
  'uLLguIHguLPguYTguKMgJyArIHBjdChkLmZpbmFuY2UubWFyZ2luKSkgKwogICAgICAgICAgJzwvZGl2PicgKyBtaW5pTW9udGhDaGFydChkLmZpbmFuY2UuYnlNb250aCksCiAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJnbyhcJ2Zp',
  'bmFuY2VcJykiPuC4lOC4ueC4l+C4seC5ieC4h+C4q+C4oeC4lCDihpI8L2J1dHRvbj4nKSArCiAgICAgICAgY2FyZCgn8J+Xk++4jyDguIfguLLguJnguJfguLXguYjguIHguLPguKXguLHguIfguIjguLDguJbguLbguIcgKCcgKyBkLnVwY29taW5nLmxlbmd0aCAr',
  'ICcpJywKICAgICAgICAgIGQudXBjb21pbmcubGVuZ3RoID8gJzxkaXYgY2xhc3M9ImFsaXN0Ij4nICsgZC51cGNvbWluZy5zbGljZSgwLDcpLm1hcChmdW5jdGlvbih1KXsKICAgICAgICAgICAgdmFyIGx2bCA9IHUuZGF5c0xlZnQgPCAwID8gJ2RhbmdlcicgOiAo',
  'dS5kYXlzTGVmdCA8PSA3ID8gJ3dhcm4nIDogJ2luZm8nKTsKICAgICAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJhbGkgbC0nICsgbHZsICsgJyIgb25jbGljaz0iZ28oXCcnICsganVtcFBhZ2UodS5tb2R1bGUpICsgJ1wnKSI+JyArCiAgICAgICAgICAgICAg',
  'JzxkaXYgY2xhc3M9ImljIj4nICsgdS5pY29uICsgJzwvZGl2PjxkaXY+PGRpdiBjbGFzcz0idHQiPicgKyBlc2ModS50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImRkIj4nICsgdGhEYXRlKHUuZGF0ZSkgKyAnIMK3ICcgKwog',
  'ICAgICAgICAgICAgICAgKHUuZGF5c0xlZnQgPCAwID8gJ+C5gOC4peC4ouC4geC4s+C4q+C4meC4lCAnICsgKC11LmRheXNMZWZ0KSArICcg4Lin4Lix4LiZJyA6ICh1LmRheXNMZWZ0ID09PSAwID8gJ+C4p+C4seC4meC4meC4teC5iScgOiAn4Lit4Li14LiBICcg',
  'KyB1LmRheXNMZWZ0ICsgJyDguKfguLHguJknKSkgKwogICAgICAgICAgICAgICc8L2Rpdj48L2Rpdj48L2Rpdj4nOwogICAgICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JyA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj7wn4yk77iPPC9k',
  'aXY+4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ4LiZ4Lix4LiU4Lir4Lih4Liy4Lii4LmA4Lij4LmH4LinIOC5hiDguJnguLXguYk8L2Rpdj4nLAogICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZ28oXCdyZXBvcnRzXCcpIj7guJvguI/g',
  'uLTguJfguLTguJnguYDguJXguYfguKEg4oaSPC9idXR0b24+JywgdHJ1ZSkgKwogICAgICAnPC9kaXY+JyArCgogICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMiI+JyArCiAgICAgICAgY2FyZCgn8J+UlCDguKrguLTguYjguIfguJfguLXguYjguJXguYnguK3guIfg',
  'uJfguLMgKCcgKyBkLmFsZXJ0cy5sZW5ndGggKyAnKScsIGFsZXJ0cywgJycsIHRydWUpICsKICAgICAgICBjYXJkKCfwn4+iIOC4h+C4suC4meC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oScsCiAgICAgICAgICAnPGRpdiBj',
  'bGFzcz0iZ3JpZCBnMiI+JyArCiAgICAgICAgICAgIGtwaSgn4LiH4Liy4LiZ4Lib4Li1ICcgKyBkLnllYXIsIGQuYnVpbGRpbmdSZXBhaXJzLnllYXJDb3VudCArICcg4LiH4Liy4LiZJywgJ+C4hOC5ieC4suC4hyAnICsgZC5idWlsZGluZ1JlcGFpcnMub3BlbkNv',
  'dW50KSArCiAgICAgICAgICAgIGtwaSgn4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiJywgYmFodChkLmJ1aWxkaW5nUmVwYWlycy55ZWFyQ29zdCksICfguITguKPguJrguIHguLPguKvguJnguJTguYDguKPguYfguKcg4LmGIOC4meC4teC5iSAnICsgZC5i',
  'dWlsZGluZ1JlcGFpcnMudXBjb21pbmcpICsKICAgICAgICAgICc8L2Rpdj4nICsKICAgICAgICAgIChkLmRlYnRNYWluLmZvcmVjYXN0ICYmIGQuZGVidE1haW4uZm9yZWNhc3QubW9udGhzTGVmdAogICAgICAgICAgICA/ICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+',
  'PGRpdiBjbGFzcz0iZnMxMyI+PGI+4Lib4Lij4Liw4Lih4Liy4LiT4LiB4Liy4Lij4Lib4Li04LiU4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiBPC9iPjxkaXYgY2xhc3M9Im11dGVkIG10OCI+JyArCiAgICAgICAgICAgICAgJ+C4iOC4suC4geC4reC4seC4leC4o+C4',
  'suC4iuC4s+C4o+C4sOC5gOC4ieC4peC4teC5iOC4oiAnICsgYmFodChkLmRlYnRNYWluLmZvcmVjYXN0LmF2Z1Blck1vbnRoKSArICcv4LmA4LiU4Li34Lit4LiZICgxMiDguYDguJTguLfguK3guJnguKXguYjguLLguKrguLjguJQpICcgKwogICAgICAgICAgICAg',
  'ICfguITguLLguJTguKfguYjguLLguK3guLXguIEgPGI+JyArIGQuZGVidE1haW4uZm9yZWNhc3QubW9udGhzTGVmdCArICcg4LmA4LiU4Li34Lit4LiZPC9iPiAnICsKICAgICAgICAgICAgICAnKOC4o+C4suC4pyAnICsgdGhEYXRlKGQuZGVidE1haW4uZm9yZWNh',
  'c3QucGF5b2ZmRGF0ZSkgKyAnKTwvZGl2PjwvZGl2PicKICAgICAgICAgICAgOiAnJyksCiAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJnbyhcJ2J1aWxkaW5nXCcpIj7guJTguLnguJfguLHguYnguIfguKvguKHguJQg4oaSPC9idXR0',
  'b24+JykgKwogICAgICAnPC9kaXY+JzsKICB9LAogIGFmdGVyOiBmdW5jdGlvbigpewogICAgLy8g4LiV4Lix4Lin4LmA4Lil4LiC4Lia4LiZ4LmA4Lih4LiZ4Li54Lit4Lix4Lib4LmA4LiU4LiV4LiI4Liy4LiB4Lio4Li54LiZ4Lii4LmM4LmB4LiI4LmJ4LiH4LmA',
  '4LiV4Li34Lit4LiZIChyZWZyZXNoQWxlcnRzKSDguJfguLjguIHguKvguJnguYnguLIg4LmE4Lih4LmI4LmD4LiK4LmI4LmA4LiJ4Lie4Liy4Liw4Lir4LiZ4LmJ4Liy4LiZ4Li14LmJCiAgICByZWZyZXNoQWxlcnRzKCk7CiAgfQp9OwoKZnVuY3Rpb24gbWluaU1v',
  'bnRoQ2hhcnQoYnlNb250aCl7CiAgdmFyIG1heCA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGJ5TW9udGgubWFwKGZ1bmN0aW9uKG0peyByZXR1cm4gTWF0aC5tYXgobS5pbmNvbWUsIG0uZXhwZW5zZSk7IH0pKSB8fCAxOwogIHJldHVybiAnPGRpdiBzdHlsZT0iZGlz',
  'cGxheTpmbGV4O2dhcDozcHg7YWxpZ24taXRlbXM6ZmxleC1lbmQ7aGVpZ2h0Ojc0cHgiPicgKyBieU1vbnRoLm1hcChmdW5jdGlvbihtKXsKICAgIHZhciBoaSA9IE1hdGgucm91bmQobS5pbmNvbWUgLyBtYXggKiA2NiksIGhlID0gTWF0aC5yb3VuZChtLmV4cGVu',
  'c2UgLyBtYXggKiA2Nik7CiAgICByZXR1cm4gJzxkaXYgc3R5bGU9ImZsZXg6MTt0ZXh0LWFsaWduOmNlbnRlciIgdGl0bGU9IicgKyBtLmxhYmVsICsgJyDCtyDguKPguLHguJogJyArIG1vbmV5KG0uaW5jb21lKSArICcgwrcg4LiI4LmI4Liy4LiiICcgKyBtb25l',
  'eShtLmV4cGVuc2UpICsgJyI+JyArCiAgICAgICc8ZGl2IHN0eWxlPSJkaXNwbGF5OmZsZXg7Z2FwOjFweDthbGlnbi1pdGVtczpmbGV4LWVuZDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO2hlaWdodDo2NnB4Ij4nICsKICAgICAgICAnPGRpdiBzdHlsZT0id2lkdGg6',
  'NnB4O2hlaWdodDonICsgaGkgKyAncHg7YmFja2dyb3VuZDp2YXIoLS1vayk7Ym9yZGVyLXJhZGl1czoycHggMnB4IDAgMCI+PC9kaXY+JyArCiAgICAgICAgJzxkaXYgc3R5bGU9IndpZHRoOjZweDtoZWlnaHQ6JyArIGhlICsgJ3B4O2JhY2tncm91bmQ6dmFyKC0t',
  'ZGFuZ2VyKTtib3JkZXItcmFkaXVzOjJweCAycHggMCAwIj48L2Rpdj4nICsKICAgICAgJzwvZGl2PjxkaXYgY2xhc3M9ImZhaW50IiBzdHlsZT0iZm9udC1zaXplOjkuNXB4Ij4nICsgbS5sYWJlbC5yZXBsYWNlKCcuJywnJykgKyAnPC9kaXY+PC9kaXY+JzsKICB9',
  'KS5qb2luKCcnKSArICc8L2Rpdj4nICsKICAnPGRpdiBjbGFzcz0icm93IGZzMTIgbXV0ZWQgbXQ4Ij48c3BhbiBjbGFzcz0iYiBvayI+4Lij4Liy4Lii4Lij4Lix4LiaPC9zcGFuPjxzcGFuIGNsYXNzPSJiIGRnciI+4Lij4Liy4Lii4LiI4LmI4Liy4LiiPC9zcGFu',
  'PjwvZGl2Pic7Cn0KCmZ1bmN0aW9uIGRlYnRNaW5pKHgsIHBhZ2UpewogIHJldHVybiAnPGRpdiBjbGFzcz0icG1ldGEiIHN0eWxlPSJtYXJnaW46MCAwIDZweCI+PHNwYW4+4LiK4Liz4Lij4Liw4LmB4Lil4LmJ4LinIDxiPicgKyBiYWh0KHgucGFpZCkgKyAnPC9i',
  'Pjwvc3Bhbj4nICsKICAgICAgICAgJzxzcGFuPjxiPicgKyBwY3QoeC5wZXJjZW50KSArICc8L2I+PC9zcGFuPjwvZGl2PicgKwogICAgICAgICBwcm9ncmVzcyh4LnBlcmNlbnQsICdsZycpICsKICAgICAgICAgJzxkaXYgY2xhc3M9InBtZXRhIj48c3Bhbj7guITg',
  'uIfguYDguKvguKXguLfguK0gPGI+JyArIGJhaHQoeC5yZW1haW5pbmcpICsgJzwvYj48L3NwYW4+JyArCiAgICAgICAgICc8c3Bhbj7guKLguK3guJTguKvguJnguLXguYnguJfguLHguYnguIfguKvguKHguJQgPGI+JyArIGJhaHQoeC50b3RhbCkgKyAnPC9iPjwv',
  'c3Bhbj48L2Rpdj4nICsKICAgICAgICAgJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbXQ4Ij7guIrguLPguKPguLDguYPguJnguJvguLXguJfguLXguYjguYDguKXguLfguK3guIE6IDxiPicgKyBiYWh0KHgudGhpc1llYXIpICsgJzwvYj48L2Rpdj4nOwp9CgovKiA9',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgMikg4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiBIC8g4Lir4LiZ4Li14LmJ4Lij4Lit4LiHICjguYPguIrguYnguJXguLHguKfguKfguLLguJTguKPguYjg',
  'uKfguKHguIHguLHguJkpCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBkZWJ0Um91dGUobGVkZ2VyLCB0aXRsZSl7CiAgcmV0dXJuIHsKICAgIGxvYWQ6IGZ1bmN0aW9uKCl7',
  'CiAgICAgIHJldHVybiBQcm9taXNlLmFsbChbCiAgICAgICAgY2FsbEFwaSgnZGVidC5zdW1tYXJ5JywgeyBsZWRnZXI6IGxlZGdlciwgeWVhcjogUy55ZWFyIH0pLAogICAgICAgIGNhbGxBcGkoJ2RlYnQucGF5bWVudHMnLCB7IGxlZGdlcjogbGVkZ2VyLCB5ZWFy',
  'OiBTLnllYXIgfSkKICAgICAgXSkudGhlbihmdW5jdGlvbihyKXsKICAgICAgICB2YXIgZCA9IHJbMF07IGQucGF5bWVudHMgPSByWzFdOyBkLmxlZGdlciA9IGxlZGdlcjsgZC5wYWdlVGl0bGUgPSB0aXRsZTsKICAgICAgICByZXR1cm4gZDsKICAgICAgfSk7CiAg',
  'ICB9LAogICAgcmVuZGVyOiByZW5kZXJEZWJ0LAogICAgYWZ0ZXI6IGNhY2hlQWxsRGVidHMKICB9Owp9ClJPVVRFUy5kZWJ0TWFpbiA9IGRlYnRSb3V0ZSgn4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiBJywgJ+C4o+C4suC4ouC4geC4suC4o+C4quC4o+C4uOC4m+C4',
  'o+C4p+C4oSBUaGUgTSBDb3JuZXIgQVAnKTsKUk9VVEVTLmRlYnRTdWIgID0gZGVidFJvdXRlKCfguKvguJnguLXguYnguKPguK3guIcnLCAn4Lir4LiZ4Li14LmJ4Liq4Li04LiZJyk7CgovKiog4LmA4LiB4LmH4Lia4Lij4Liy4Lii4LiK4Li34LmI4Lit4LiB4LmJ',
  '4Lit4LiZ4Lir4LiZ4Li14LmJ4LiX4Li44LiB4Lia4Lix4LiN4LiK4Li14LmE4Lin4LmJ4LmD4Lir4LmJ4Lif4Lit4Lij4LmM4Lih4LmA4Lil4Li34Lit4LiBICLguYDguJvguYfguJnguKrguYjguKfguJnguKvguJnguLbguYjguIfguILguK3guIciICovCmZ1bmN0',
  'aW9uIGNhY2hlQWxsRGVidHMoKXsKICBjYWxsQXBpKCdkZWJ0Lmxpc3QnLCB7fSkudGhlbihmdW5jdGlvbihsaXN0KXsKICAgIEFMTF9ERUJUUyA9IGxpc3QubWFwKGZ1bmN0aW9uKGQpewogICAgICByZXR1cm4geyBpZDogZC5pZCwgdGl0bGU6IGQudGl0bGUsIGxl',
  'ZGdlcjogZC5sZWRnZXIsIHBhcmVudElkOiBkLnBhcmVudElkIHx8ICcnIH07CiAgICB9KTsKICB9KS5jYXRjaChmdW5jdGlvbigpe30pOwp9CgpmdW5jdGlvbiByZW5kZXJEZWJ0KGQpewogIHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09ICdhbGwnID8gJ+C4l+C4',
  'uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CgogIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImNhcmQgbWIxMiI+PGRpdiBjbGFzcz0iY2FyZC1iIj4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbWIxMiI+PGgzIHN0eWxlPSJtYXJnaW46MDtmb250LXNp',
  'emU6MTVweCI+JyArIGVzYyhkLnBhZ2VUaXRsZSkgKyAnPC9oMz4nICsKICAgICc8c3BhbiBjbGFzcz0ic3AiPjwvc3Bhbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIHNtIiBvbmNsaWNrPSJmb3JtRGVidFBheW1lbnQobnVsbCxcJycgKyBkLmxlZGdl',
  'ciArICdcJykiPisg4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4LiK4Liz4Lij4LiwPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJmb3JtRGVidChudWxsLFwnJyArIGQubGVkZ2VyICsgJ1wnKSI+KyDguYDguJ7guLTg',
  'uYjguKHguIHguYnguK3guJnguKvguJnguLXguYk8L2J1dHRvbj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJwbWV0YSIgc3R5bGU9Im1hcmdpbjowIDAgN3B4Ij48c3Bhbj7guITguKfguLLguKHguITguLfguJrguKvguJnguYnguLLguIHguLLguKPguIrguLPg',
  'uKPguLA8L3NwYW4+PHNwYW4+PGI+JyArIHBjdChkLnBlcmNlbnQpICsgJzwvYj48L3NwYW4+PC9kaXY+JyArCiAgICBwcm9ncmVzcyhkLnBlcmNlbnQsICdsZyAnICsgKGQucGVyY2VudCA+PSAxMDAgPyAnb2snIDogJycpKSArCiAgICAnPGRpdiBjbGFzcz0iZ3Jp',
  'ZCBnNCBtdDE2Ij4nICsKICAgICAga3BpKCfguKLguK3guJTguKvguJnguLXguYnguJfguLHguYnguIfguKvguKHguJQnLCBiYWh0KGQudG90YWxEZWJ0KSwgZC5kZWJ0cy5sZW5ndGggKyAnIOC4geC5ieC4reC4meC4q+C4meC4teC5iScpICsKICAgICAga3BpKCfg',
  'uIrguLPguKPguLDguYHguKXguYnguKcnLCBiYWh0KGQucGFpZCksIGQucGF5bWVudENvdW50ICsgJyDguKPguLLguKLguIHguLLguKPguYLguK3guJknICsKICAgICAgICAgIChkLmFkanVzdG1lbnRDb3VudCA/ICcgwrcg4Lib4Lij4Lix4Lia4Lii4Lit4LiUICcg',
  'KyBiYWh0KGQuYWRqdXN0ZWQpIDogJycpLCAnZ29vZCcpICsKICAgICAga3BpKCfguITguIfguYDguKvguKXguLfguK0nLCBiYWh0KGQucmVtYWluaW5nKSwgJ+C4reC4teC4gSAnICsgcGN0KDEwMCAtIGQucGVyY2VudCkgKyAnIOC4iOC4sOC4m+C4tOC4lOC4q+C4',
  'meC4teC5iScsICdiYWQnKSArCiAgICAgIGtwaSgn4LiK4Liz4Lij4Liw4LmD4LiZJyArIHllYXJMYWJlbCwgYmFodChkLnNlbGVjdGVkWWVhclBhaWQpLCBkLnNlbGVjdGVkWWVhckNvdW50ICsgJyDguKPguLLguKLguIHguLLguKMnICsKICAgICAgICAgIChkLnNl',
  'bGVjdGVkWWVhckludGVyZXN0ID8gJyDCtyDguJTguK3guIHguYDguJrguLXguYnguKIgJyArIGJhaHQoZC5zZWxlY3RlZFllYXJJbnRlcmVzdCkgOiAnJykpICsKICAgICc8L2Rpdj48L2Rpdj48L2Rpdj4nOwoKICB2YXIgcGVyRGVidCA9IGQuZGVidHMubGVuZ3Ro',
  'ID8gJzxkaXYgY2xhc3M9ImdyaWQgZy1hdXRvIG1iMTIiPicgKyBkLmRlYnRzLm1hcChmdW5jdGlvbih4KXsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0iY2FyZCI+PGRpdiBjbGFzcz0iY2FyZC1iIj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImNsaXAiIHN0eWxlPSJm',
  'b250LXdlaWdodDo2NTA7Zm9udC1zaXplOjEzLjVweDttaW4taGVpZ2h0OjM4cHgiPicgKyBlc2MoeC50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJyb3cgZnMxMiBtdXRlZCBtYjgiPicgKyAoeC5zZXR0bGVkID8gJzxzcGFuIGNsYXNzPSJi',
  'IG9rIj7inJMg4LiK4Liz4Lij4Liw4LiE4Lij4Lia4LmB4Lil4LmJ4LinPC9zcGFuPicgOiBzdGF0dXNCYWRnZSh4LnN0YXR1cykpICsKICAgICAgICAnPHNwYW4+JyArIGVzYyh4LmNyZWRpdG9yIHx8ICfigJMnKSArICh4LnN0YXJ0RGF0ZSA/ICcgwrcgJyArIHRo',
  'RGF0ZSh4LnN0YXJ0RGF0ZSkgOiAnJykgKyAnPC9zcGFuPjwvZGl2PicgKwogICAgICAoeC5zaGFyZWRGcm9tCiAgICAgICAgPyAnPGRpdiBjbGFzcz0iYiBvayB3cmFwIG1iOCIgdGl0bGU9IuC4geC5ieC4reC4meC5gOC4lOC4teC4ouC4p+C4geC4seC4muC5g+C4',
  'meC4reC4teC4geC4q+C4meC5ieC4siDguJrguLHguJnguJfguLbguIHguIHguLLguKPguIrguLPguKPguLDguIjguLLguIHguKvguJnguYnguLLguYTguKvguJnguIHguYfguYDguILguYnguLLguIHguYnguK3guJnguJnguLXguYkiPvCflJcg4LiB4LmJ4Lit4LiZ',
  '4LmA4LiU4Li14Lii4Lin4LiB4Lix4Lia4LmD4LiZ4Lir4LiZ4LmJ4LiyJyArCiAgICAgICAgICAoeC5zaGFyZWRGcm9tID09PSAn4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiBJyA/ICfguKPguLLguKLguIHguLLguKPguKrguKPguLjguJvguKPguKfguKEnIDogJ+C4',
  'q+C4meC4teC5ieC4quC4tOC4mScpICsgJzwvZGl2PicKICAgICAgICA6IHguYWxzb0luCiAgICAgICAgPyAnPGRpdiBjbGFzcz0iYiBvayB3cmFwIG1iOCIgdGl0bGU9IuC4geC5ieC4reC4meC4meC4teC5ieC5geC4quC4lOC4h+C5g+C4meC4reC4teC4geC4q+C4',
  'meC5ieC4suC4lOC5ieC4p+C4oiDguJXguLHguKfguYDguKXguILguYDguIrguLfguYjguK3guKHguIHguLHguJkiPvCflJcg4LmB4Liq4LiU4LiH4LmD4LiZ4Lir4LiZ4LmJ4LiyJyArCiAgICAgICAgICAoeC5hbHNvSW4gPT09ICfguKvguJnguLXguYnguKvguKXg',
  'uLHguIEnID8gJ+C4o+C4suC4ouC4geC4suC4o+C4quC4o+C4uOC4m+C4o+C4p+C4oScgOiAn4Lir4LiZ4Li14LmJ4Liq4Li04LiZJykgKyAn4LiU4LmJ4Lin4LiiPC9kaXY+JwogICAgICAgIDogJycpICsKICAgICAgKHgucGFyZW50VGl0bGUKICAgICAgICA/ICc8',
  'ZGl2IGNsYXNzPSJiIGluZm8gd3JhcCBtYjgiIHRpdGxlPSLguKLguK3guJTguIHguYnguK3guJnguJnguLXguYnguK3guKLguLnguYjguYPguJnguIHguYnguK3guJnguYHguKHguYjguYHguKXguYnguKcg4LiI4LmI4Liy4Lii4LiE4Li34LiZ4LiB4LmJ4Lit4LiZ',
  '4LiZ4Li14LmJ4LiB4LmJ4Lit4LiZ4LmB4Lih4LmI4LiI4Liw4Lil4LiU4LiV4Liy4LihIj4nICsKICAgICAgICAgICfihrMg4LmA4Lib4LmH4LiZ4Liq4LmI4Lin4LiZ4Lir4LiZ4Li24LmI4LiH4LiC4Lit4LiHICcgKyBlc2MoeC5wYXJlbnRUaXRsZSkgKyAnPC9k',
  'aXY+JwogICAgICAgIDogJycpICsKICAgICAgcHJvZ3Jlc3MoeC5wZXJjZW50KSArCiAgICAgICc8ZGl2IGNsYXNzPSJwbWV0YSI+PHNwYW4+4LiK4Liz4Lij4LiwIDxiPicgKyBiYWh0KHgucGFpZCkgKyAnPC9iPjwvc3Bhbj48c3Bhbj7guITguIfguYDguKvguKXg',
  'uLfguK0gPGI+JyArIGJhaHQoeC5yZW1haW5pbmcpICsgJzwvYj48L3NwYW4+PC9kaXY+JyArCiAgICAgICh4LmNoaWxkcmVuICYmIHguY2hpbGRyZW4ubGVuZ3RoCiAgICAgICAgPyAnPGRpdiBjbGFzcz0iaHIiIHN0eWxlPSJtYXJnaW46MTJweCAwIDEwcHgiPjwv',
  'ZGl2PicgKwogICAgICAgICAgJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbWI4Ij7guYPguJnguKLguK3guJTguJnguLXguYnguKHguLXguIHguYnguK3guJnguKLguYjguK3guKLguK3guKLguLnguYggJyArIHguY2hpbGRyZW4ubGVuZ3RoICsgJyDguIHguYnguK3g',
  'uJk8L2Rpdj4nICsKICAgICAgICAgIHguY2hpbGRyZW4ubWFwKGZ1bmN0aW9uKGMpewogICAgICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9Im1iOCI+JyArCiAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9InJvdyBmczEyIj48c3Bhbj7ihrMgJyArIGVzYyhjLnRp',
  'dGxlKSArICc8L3NwYW4+JyArCiAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPSJzcCBtb25vIj4nICsgbW9uZXkoYy5wYWlkKSArICcgLyAnICsgbW9uZXkoYy5wcmluY2lwYWwpICsgJzwvc3Bhbj48L2Rpdj4nICsKICAgICAgICAgICAgICBwcm9ncmVzcyhjLnBl',
  'cmNlbnQsICdvaycpICsgJzwvZGl2Pic7CiAgICAgICAgICB9KS5qb2luKCcnKSArCiAgICAgICAgICAoeC5wYWlkRnJvbUNoaWxkcmVuID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQiPuC4o+C4p+C4oeC4ouC4reC4lOC4l+C4teC5iOC4oeC4suC4iOC4suC4geC4',
  'geC5ieC4reC4meC4ouC5iOC4reC4oiAnICsgYmFodCh4LnBhaWRGcm9tQ2hpbGRyZW4pICsgJzwvZGl2PicgOiAnJykKICAgICAgICA6ICcnKSArCiAgICAgICh4LmludGVyZXN0UGVyTW9udGggPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtdDgiPuC4lOC4reC4',
  'geC5gOC4muC4teC5ieC4oiAnICsgYmFodCh4LmludGVyZXN0UGVyTW9udGgpICsgJy/guYDguJTguLfguK3guJk8L2Rpdj4nIDogJycpICsKICAgICAgKHgucGxhblBlck1vbnRoID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQiPuC5geC4nOC4meC4nOC5iOC4reC4',
  'mSAnICsgYmFodCh4LnBsYW5QZXJNb250aCkgKyAnL+C5gOC4lOC4t+C4reC4mTwvZGl2PicgOiAnJykgKwogICAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPjxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz1cJ2Zvcm1EZWJ0KCcgKyBhdHRyKHgpICsgJywi',
  'JyArIGQubGVkZ2VyICsgJyIpXCc+4LmB4LiB4LmJ4LmE4LiCPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIHRpdGxlPSLguKLguK3guJTguYTguKHguYjguJXguKPguIfguIHguLHguJrguJfguLXguYjguYDguIjguYnguLLguKvguJng',
  'uLXguYnguYHguIjguYnguIc/IOC4geC4o+C4reC4geC4ouC4reC4lOC4hOC4h+C5gOC4q+C4peC4t+C4reC4iOC4o+C4tOC4hyIgb25jbGljaz1cJ2Zvcm1SZWNvbmNpbGVEZWJ0KCcgKyBhdHRyKHgpICsgJylcJz7impbvuI8g4Lib4Lij4Lix4Lia4Lii4Lit4LiU',
  '4LmD4Lir4LmJ4LiV4Lij4LiHPC9idXR0b24+JyArCiAgICAgIC8vIOC4geC5ieC4reC4meC4l+C4teC5iOC4ouC4t+C4oeC4oeC4suC5geC4quC4lOC4hyDguKXguJrguIjguLLguIHguKvguJnguYnguLLguJnguLXguYnguYTguKHguYjguYTguJTguYkgKOC4iOC4',
  'sOC4q+C4suC4ouC4iOC4suC4geC4reC4teC4geC4q+C4meC5ieC4suC4lOC5ieC4p+C4oikg4oCUIOC5hOC4m+C4peC4muC4l+C4teC5iOC4q+C4meC5ieC4suC5gOC4iOC5ieC4suC4guC4reC4hyDguKvguKPguLfguK3guJvguLTguJTguIHguLLguKPguYHguKrg',
  'uJTguIfguKPguYjguKfguKHguYPguJnguJ/guK3guKPguYzguKHguYHguIHguYnguYTguIIKICAgICAgKHguc2hhcmVkRnJvbSA/ICcnIDogJzxidXR0b24gY2xhc3M9ImJ0biBzbSBkZ3IiIG9uY2xpY2s9ImRlbERlYnQoJyArIGpzcSh4LmlkKSArICcpIj7guKXg',
  'uJo8L2J1dHRvbj4nKSArICc8L2Rpdj4nICsKICAgICc8L2Rpdj48L2Rpdj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2PicgOiAnJzsKCiAgdmFyIGJ5WWVhciA9IGQuYnlZZWFyLmxlbmd0aCA/IGNhcmQoJ/Cfk4Ug4Lii4Lit4LiU4LiK4Liz4Lij4Liw4LmB4Lii',
  '4LiB4LiV4Liy4Lih4Lib4Li1JywKICAgICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0Ij48dGhlYWQ+PHRyPicgKwogICAgJzx0aD7guJvguLU8L3RoPjx0aCBjbGFzcz0ibnVtIj7guYDguIfguLTguJnguJXguYnguJk8L3RoPjx0aCBjbGFzcz0ibnVt',
  'Ij7guJTguK3guIHguYDguJrguLXguYnguKI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKPguKfguKHguJfguLXguYjguYLguK3guJk8L3RoPicgKwogICAgJzx0aCBjbGFzcz0ibnVtIj7guIjguLPguJnguKfguJnguITguKPguLHguYnguIc8L3RoPjx0aCBjbGFzcz0i',
  'bnVtIj7guYDguIfguLTguJnguJXguYnguJnguKrguLDguKrguKE8L3RoPjx0aCBzdHlsZT0id2lkdGg6MjYlIj7guITguKfguLLguKHguITguLfguJrguKvguJnguYnguLLguKrguLDguKrguKE8L3RoPicgKwogICAgJzwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAg',
  'ICBkLmJ5WWVhci5tYXAoZnVuY3Rpb24oeSl7CiAgICAgIHZhciBjdW0gPSB5LmN1bXVsYXRpdmUgIT0gbnVsbCA/IHkuY3VtdWxhdGl2ZSA6IDA7CiAgICAgIHZhciBwID0gZC50b3RhbERlYnQgPyAoY3VtIC8gZC50b3RhbERlYnQgKiAxMDApIDogMDsKICAgICAg',
  'cmV0dXJuICc8dHIgb25jbGljaz0ic2V0WWVhckZyb21UYWJsZSgnICsgeS55ZWFyICsgJykiIHN0eWxlPSJjdXJzb3I6cG9pbnRlciI+JyArCiAgICAgICAgJzx0ZD48Yj4nICsgZGlzcGxheVllYXIoeS55ZWFyKSArICc8L2I+JyArCiAgICAgICAgICAodXNlQnVk',
  'ZGhpc3RZZWFyKCkgPyAnIDxzcGFuIGNsYXNzPSJmYWludCBmczEyIj4vICcgKyB5LnllYXIgKyAnPC9zcGFuPicgOiAnJykgKyAnPC90ZD4nICsKICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyBtb25leSh5LnByaW5jaXBhbCkgKyAnPC90ZD4nICsKICAgICAg',
  'ICAnPHRkIGNsYXNzPSJudW0iPicgKyAoeS5pbnRlcmVzdCA/IG1vbmV5KHkuaW50ZXJlc3QpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj48Yj4nICsgbW9uZXkoeS5wcmluY2lwYWwgKyB5LmludGVyZXN0KSArICc8L2I+PC90',
  'ZD4nICsKICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyB5LmNvdW50ICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbW9uZXkoY3VtKSArICc8L3RkPicgKwogICAgICAgICc8dGQ+JyArIHByb2dyZXNzKHApICsgJzwvdGQ+PC90cj4n',
  'OwogICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicsICcnLCB0cnVlKSA6ICcnOwoKICB2YXIgcm93cyA9IGQucGF5bWVudHM7CiAgdmFyIGxpc3QgPSBjYXJkKCfwn6e+IOC4o+C4suC4ouC4geC4suC4o+C5guC4reC4meC5g+C4iuC5ieC4',
  'q+C4meC4teC5iSDCtyAnICsgeWVhckxhYmVsICsgJyAoJyArIHJvd3MubGVuZ3RoICsgJyknLAogICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsKICAgICAgJzx0aD7guKfguLHguJnguJfguLXg',
  'uYg8L3RoPjx0aD7guIfguKfguJQ8L3RoPjx0aCBjbGFzcz0ibnVtIj7guYDguIfguLTguJnguJXguYnguJk8L3RoPjx0aCBjbGFzcz0ibnVtIj7guJTguK3guIHguYDguJrguLXguYnguKI8L3RoPicgKwogICAgICAnPHRoIGNsYXNzPSJudW0iPuC4o+C4p+C4oeC4',
  'l+C4teC5iOC5guC4reC4mTwvdGg+PHRoPuC4iuC5iOC4reC4h+C4l+C4suC4hzwvdGg+JyArCiAgICAgICc8dGg+4Liq4Lil4Li04LibPC90aD48dGg+4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4PC90aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwog',
  'ICAgICByb3dzLm1hcChmdW5jdGlvbihwKXsKICAgICAgICB2YXIgYWRqID0gcC5jaGFubmVsID09PSAn4Lib4Lij4Lix4Lia4Lii4Lit4LiUJzsKICAgICAgICByZXR1cm4gJzx0cicgKyAoYWRqID8gJyBjbGFzcz0iYWRqIiB0aXRsZT0i4Lij4Liy4Lii4LiB4Liy',
  '4Lij4Lib4Lij4Lix4Lia4Lii4Lit4LiU4LmD4Lir4LmJ4LiV4Lij4LiH4Lii4Lit4LiU4LiI4Lij4Li04LiHIOC5hOC4oeC5iOC5g+C4iuC5iOC5gOC4h+C4tOC4meC4l+C4teC5iOC5guC4reC4mSInIDogJycpICsgJz4nICsKICAgICAgICAgICc8dGQgY2xhc3M9',
  'Im5vd3JhcCI+JyArIHRoRGF0ZShwLnBheURhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAiPicgKyBlc2MocC5pbnN0YWxsbWVudCB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChw',
  'LnByaW5jaXBhbCA/ICc8YiBzdHlsZT0iY29sb3I6dmFyKC0tb2spIj4nICsgbW9uZXkocC5wcmluY2lwYWwpICsgJzwvYj4nIDogJzxzcGFuIGNsYXNzPSJmYWludCI+4oCTPC9zcGFuPicpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicg',
  'KyAocC5pbnRlcmVzdCA/ICc8YiBzdHlsZT0iY29sb3I6dmFyKC0td2FybikiPicgKyBtb25leShwLmludGVyZXN0KSArICc8L2I+JyA6ICc8c3BhbiBjbGFzcz0iZmFpbnQiPuKAkzwvc3Bhbj4nKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibnVt',
  'Ij48Yj4nICsgbW9uZXkocC5hbW91bnQpICsgJzwvYj48L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIChhZGogPyAnPHNwYW4gY2xhc3M9ImIgaW5mbyI+4pqW77iPIOC4m+C4o+C4seC4muC4ouC4reC4lDwvc3Bhbj4nIDogZXNjKHAuY2hh',
  'bm5lbCB8fCAn4oCTJykpICsKICAgICAgICAgICAgKHAuc2hhcmVkRnJvbSA/ICc8ZGl2IGNsYXNzPSJtdDgiPjxzcGFuIGNsYXNzPSJiIG9rIiB0aXRsZT0i4Lij4Liy4Lii4LiB4Liy4Lij4LmA4LiU4Li14Lii4Lin4LiB4Lix4Lia4LmD4LiZ4Lit4Li14LiB4Lir',
  '4LiZ4LmJ4LiyIj7wn5SXICcgKwogICAgICAgICAgICAgIChwLnNoYXJlZEZyb20gPT09ICfguKvguJnguLXguYnguKvguKXguLHguIEnID8gJ+C4o+C4suC4ouC4geC4suC4o+C4quC4o+C4uOC4m+C4o+C4p+C4oScgOiAn4Lir4LiZ4Li14LmJ4Liq4Li04LiZJykg',
  'KyAnPC9zcGFuPjwvZGl2PicgOiAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwocC5zbGlwUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIgbXV0ZWQgY2xpcCI+JyArIGVzYyhwLm5vdGUgfHwgJycp',
  'ICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkPjxkaXYgY2xhc3M9InQtYWN0aW9ucyI+JyArCiAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1EZWJ0UGF5bWVudCgnICsgYXR0cihwKSArICcsIicgKyBkLmxlZGdl',
  'ciArICciKVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24gZGdyIiBvbmNsaWNrPSJkZWxEZWJ0UGF5bWVudCgnICsganNxKHAuaWQpICsgJykiPvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICc8L2Rp',
  'dj48L3RkPjwvdHI+JzsKICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgIDogZW1wdHlCb3goJ+C4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4o+C4suC4ouC4geC4suC4o+C4iuC4s+C4o+C4sOC5g+C4mScgKyB5ZWFyTGFiZWws',
  'CiAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZvcm1EZWJ0UGF5bWVudChudWxsLFwnJyArIGQubGVkZ2VyICsgJ1wnKSI+KyDguJrguLHguJnguJfguLbguIHguIHguLLguKPguIrguLPguKPguLA8L2J1dHRvbj4nKSwKICAgICcnLCB0',
  'cnVlKTsKCiAgcmV0dXJuIGhlYWQgKyBwZXJEZWJ0ICsgYnlZZWFyICsgJzxkaXYgY2xhc3M9Im10MTIiPicgKyBsaXN0ICsgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIHNldFllYXJGcm9tVGFibGUoeSl7CiAgUy55ZWFyID0gU3RyaW5nKHkpOwogIGRvY3VtZW50Lmdl',
  'dEVsZW1lbnRCeUlkKCd5ZWFyU2VsJykudmFsdWUgPSBTLnllYXI7CiAgbG9hZCgpOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgMykg4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ',
  '4Lit4LiC4Lit4LiHCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMucHVyY2hhc2VzID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7CiAgICByZXR1cm4gUHJvbWlzZS5hbGwoWwogICAg',
  'ICBjYWxsQXBpKCdwdXJjaGFzZS5zdW1tYXJ5JywgeyB5ZWFyOiBTLnllYXIgfSksCiAgICAgIGNhbGxBcGkoJ3B1cmNoYXNlLmxpc3QnLCB7IHllYXI6IFMueWVhciwgY2F0ZWdvcnk6IFMucGFyYW1zLmNhdGVnb3J5IHx8ICcnLCBxOiBTLnBhcmFtcy5xIHx8ICcn',
  'IH0pCiAgICBdKS50aGVuKGZ1bmN0aW9uKHIpeyB2YXIgZCA9IHJbMF07IGQuaXRlbXMgPSByWzFdOyByZXR1cm4gZDsgfSk7CiAgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB',
  '4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKICAgIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgIGtwaSgn4Lii4Lit4LiU4LiL4Li34LmJ4LitICcgKyB5ZWFyTGFiZWwsIGJhaHQoZC55ZWFyVG90YWwpLCBkLnllYXJD',
  'b3VudCArICcg4Lij4Liy4Lii4LiB4Liy4LijJywgJ2FjY2VudCcpICsKICAgICAga3BpKCfguKLguK3guJTguKrguLDguKrguKHguJfguLHguYnguIfguKvguKHguJQnLCBiYWh0KGQuZ3JhbmRUb3RhbCksIGQuZ3JhbmRDb3VudCArICcg4Lij4Liy4Lii4LiB4Liy',
  '4LijJykgKwogICAgICBrcGkoJ+C4reC4ouC4ueC5iOC5g+C4meC4m+C4o+C4sOC4geC4seC4mScsIGQud2FycmFudHkuYWN0aXZlICsgJyDguKPguLLguKLguIHguLLguKMnLCAn4LmD4LiB4Lil4LmJ4Lir4Lih4LiUICcgKyBkLndhcnJhbnR5LmV4cGlyaW5nLCBk',
  'LndhcnJhbnR5LmV4cGlyaW5nID8gJ3dhcm4nIDogJ2dvb2QnKSArCiAgICAgIGtwaSgn4Lir4Lih4Lin4LiU4LiX4Li14LmI4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Liq4Li54LiH4Liq4Li44LiUJywgZC5ieUNhdGVnb3J5WzBdID8gZC5ieUNhdGVnb3J5WzBdLmNh',
  'dGVnb3J5IDogJ+KAkycsCiAgICAgICAgICBkLmJ5Q2F0ZWdvcnlbMF0gPyBiYWh0KGQuYnlDYXRlZ29yeVswXS50b3RhbCkgOiAnJykgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIGNoYXJ0cyA9ICc8ZGl2IGNsYXNzPSJncmlkIGcyIG1iMTIiPicgKwogICAgICBj',
  'YXJkKCfwn5OKIOC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC5geC4ouC4geC4leC4suC4oeC4q+C4oeC4p+C4lOC4q+C4oeC4ueC5iCDCtyAnICsgeWVhckxhYmVsLAogICAgICAgIGJhckNoYXJ0KGQuYnlDYXRlZ29yeSwgJ2NhdGVnb3J5JywgJ3RvdGFs',
  'JywgZnVuY3Rpb24oaSl7IHJldHVybiBtb25leShpLnRvdGFsKSArICcg4Li/JzsgfSkpICsKICAgICAgY2FyZCgn8J+ThSDguKLguK3guJTguIvguLfguYnguK3guYHguKLguIHguJXguLLguKHguJvguLUnLAogICAgICAgIGJhckNoYXJ0KGQuYnlZZWFyLm1hcChm',
  'dW5jdGlvbih5KXsgcmV0dXJuIHsgbGFiZWw6ICfguJvguLUgJyArIHkueWVhciArICcgKCcgKyB5LmNvdW50ICsgJyknLCB0b3RhbDogeS50b3RhbCwgeWVhcjogeS55ZWFyIH07IH0pLAogICAgICAgICAgICAgICAgICdsYWJlbCcsICd0b3RhbCcsIGZ1bmN0aW9u',
  'KGkpeyByZXR1cm4gbW9uZXkoaS50b3RhbCkgKyAnIOC4vyc7IH0pKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgY2F0cyA9ICc8ZGl2IGNsYXNzPSJjaGlwcyBtYjEyIj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImNoaXAgJyArICghUy5wYXJhbXMuY2F0ZWdv',
  'cnk/J29uJzonJykgKyAnIiBvbmNsaWNrPSJzZXRQYXJhbShcJ2NhdGVnb3J5XCcsXCdcJykiPuC4l+C4uOC4geC4q+C4oeC4p+C4lDwvYnV0dG9uPicgKwogICAgICBkLmJ5Q2F0ZWdvcnkubWFwKGZ1bmN0aW9uKGMpewogICAgICAgIHJldHVybiAnPGJ1dHRvbiBj',
  'bGFzcz0iY2hpcCAnICsgKFMucGFyYW1zLmNhdGVnb3J5PT09Yy5jYXRlZ29yeT8nb24nOicnKSArICciICcgKwogICAgICAgICAgICAgICAnb25jbGljaz0ic2V0UGFyYW0oXCdjYXRlZ29yeVwnLCcgKyBqc3EoYy5jYXRlZ29yeSkgKyAnKSI+JyArIGVzYyhjLmNh',
  'dGVnb3J5KSArICcgKCcgKyBjLmNvdW50ICsgJyk8L2J1dHRvbj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwoKICAgIHZhciByb3dzID0gZC5pdGVtczsKICAgIHZhciB0YWJsZSA9IGNhcmQoJ/Cfm5Ig4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ',
  '4Lit4LiC4Lit4LiHIMK3ICcgKyB5ZWFyTGFiZWwgKyAnICgnICsgcm93cy5sZW5ndGggKyAnKScsCiAgICAgIHJvd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiIHN0eWxlPSJtaW4td2lkdGg6OTgwcHgiPjx0aGVhZD48dHI+JyAr',
  'CiAgICAgICAgJzx0aCBzdHlsZT0id2lkdGg6OTZweCI+4Lin4Lix4LiZ4LiX4Li14LmI4LiL4Li34LmJ4LitPC90aD48dGg+4Lij4Liy4Lii4LiB4Liy4Lij4Liq4Li04LiZ4LiE4LmJ4LiyPC90aD48dGggY2xhc3M9Im51bSI+4LiI4Liz4LiZ4Lin4LiZPC90aD4n',
  'ICsKICAgICAgICAnPHRoIGNsYXNzPSJudW0iPuC4o+C4suC4hOC4sjwvdGg+PHRoPuC5geC4q+C4peC5iOC4h+C4l+C4teC5iOC4i+C4t+C5ieC4rTwvdGg+PHRoPuC4m+C4o+C4sOC4geC4seC4mTwvdGg+PHRoPuC4oOC4suC4njwvdGg+PHRoPuC4quC4peC4tOC4',
  'mzwvdGg+PHRoPjwvdGg+JyArCiAgICAgICAgJzwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgcm93cy5tYXAoZnVuY3Rpb24ocCl7CiAgICAgICAgICB2YXIgdyA9IHAud2FycmFudHkgfHwge307CiAgICAgICAgICByZXR1cm4gJzx0cj4nICsKICAgICAg',
  'ICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyB0aERhdGUocC5idXlEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPjxkaXYgY2xhc3M9ImNsaXAiIHRpdGxlPSInICsgZXNjKHAuaXRlbSkgKyAnIj48Yj4nICsgZXNjKHAuaXRlbSkgKyAn',
  'PC9iPjwvZGl2PicgKwogICAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJmczEyIGZhaW50Ij4nICsgZXNjKHAuY2F0ZWdvcnkgfHwgJycpICsgKHAucm9vbSA/ICcgwrcg4Lir4LmJ4Lit4LiHICcgKyBlc2MocC5yb29tKSA6ICcnKSArCiAgICAgICAgICAgICAgICAo',
  'cC5vcmRlck5vID8gJyDCtyDguK3guK3guKPguYzguYDguJTguK3guKPguYwgJyArIGVzYyhwLm9yZGVyTm8pIDogJycpICsgJzwvZGl2PicgKwogICAgICAgICAgICAgIGJpbGxIdG1sKHApICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+',
  'JyArIG51bShwLnF0eSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj48Yj4nICsgbW9uZXkocC5wcmljZSkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MocC52ZW5kb3IgfHwgJ+KAkycp',
  'ICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyAody5oYXMKICAgICAgICAgICAgICAgID8gc3RhdHVzQmFkZ2Uody5zdGF0ZSkgKyAnPGRpdiBjbGFzcz0iZmFpbnQiIHN0eWxlPSJmb250LXNpemU6MTFweCI+JyArIHRoRGF0ZVNo',
  'b3J0KHcuZW5kKSArICc8L2Rpdj4nCiAgICAgICAgICAgICAgICA6ICc8c3BhbiBjbGFzcz0iZmFpbnQiPuKAkzwvc3Bhbj4nKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHAucGhvdG9SZWZzKSArICc8L3RkPicgKwogICAgICAg',
  'ICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHAuc2xpcFJlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24iIG9uY2xpY2s9XCdmb3Jt',
  'UHVyY2hhc2UoJyArIGF0dHIocCkgKyAnKVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiBkZ3IiIG9uY2xpY2s9ImRlbFB1cmNoYXNlKCcgKyBqc3EocC5pZCkgKyAnKSI+8J+XkTwvYnV0dG9uPicg',
  'KwogICAgICAgICAgICAnPC9kaXY+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgOiBlbXB0eUJveCgn4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ',
  '4Lit4LmD4LiZJyArIHllYXJMYWJlbCwgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZvcm1QdXJjaGFzZShudWxsKSI+KyDguYDguJ7guLTguYjguKHguKPguLLguKLguIHguLLguKPguIvguLfguYnguK08L2J1dHRvbj4nKSwKICAgICAgJzxidXR0',
  'b24gY2xhc3M9ImJ0biBwcmkgc20iIG9uY2xpY2s9ImZvcm1QdXJjaGFzZShudWxsKSI+KyDguYDguJ7guLTguYjguKHguKPguLLguKLguIHguLLguKPguIvguLfguYnguK08L2J1dHRvbj4nLCB0cnVlKTsKCiAgICByZXR1cm4gaGVhZCArIGNoYXJ0cyArIGNhdHMg',
  'KyB0YWJsZTsKICB9Cn07CgovKioKICog4Lia4Li04Lil4LiX4Li14LmI4Lih4Li14LiC4Lit4LiH4Lir4Lil4Liy4Lii4Lit4Lii4LmI4Liy4LiHIOKAlCDguYHguKrguJTguIfguYDguJvguYfguJnguJvguLjguYjguKHguIHguLLguIfguJTguLkg4LmE4Lih4LmI',
  '4LmD4Lir4LmJ4LiV4Liy4Lij4Liy4LiH4Lii4Liy4Lin4LmA4LiB4Li04LiZ4LmE4LibCiAqIOC4muC4tOC4peC4l+C4teC5iOC4oeC4teC4o+C4suC4ouC4geC4suC4o+C5gOC4lOC4teC4ouC4p+C4q+C4o+C4t+C4reC5hOC4oeC5iOC4oeC4teC4o+C4suC4ouC4',
  'geC4suC4o+C4ouC5iOC4reC4ouC5gOC4peC4oiDguYTguKHguYjguJXguYnguK3guIfguYHguKrguJTguIfguK3guLDguYTguKPguYDguJ7guLTguYjguKEKICovCmZ1bmN0aW9uIGJpbGxIdG1sKHApewogIHZhciBiID0gcC5iaWxsOwogIGlmICghYiB8fCBiLmNv',
  'dW50IDwgMikgcmV0dXJuICcnOwogIHZhciBpZCA9ICdiaWxsXycgKyBwLmlkOwogIHJldHVybiAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJiaWxsLXRvZ2dsZSIgb25jbGljaz0idG9nZ2xlQmlsbChcJycgKyBpZCArICdcJykiPicgKwogICAgICAn8J+n',
  'viAnICsgYi5jb3VudCArICcg4Lij4Liy4Lii4LiB4Liy4Lij4LmD4LiZ4Lia4Li04LilIOKWvjwvYnV0dG9uPicgKwogICAgJzxkaXYgY2xhc3M9ImJpbGwtbGluZXMiIGlkPSInICsgaWQgKyAnIiBoaWRkZW4+JyArCiAgICAgIGIubGluZXMubWFwKGZ1bmN0aW9u',
  'KGwpewogICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0iYmlsbC1saW5lIj4nICsKICAgICAgICAgICc8c3BhbiBjbGFzcz0ibm0iIHRpdGxlPSInICsgZXNjKGwubmFtZSkgKyAnIj4nICsgZXNjKGwubmFtZSkgKyAnPC9zcGFuPicgKwogICAgICAgICAgJzxzcGFu',
  'IGNsYXNzPSJxdCI+JyArIG51bShsLnF0eSkgKyAobC51bml0ID8gJyAnICsgZXNjKGwudW5pdCkgOiAnJykgKyAnIMOXICcgKyBtb25leShsLnVuaXRQcmljZSwgMikgKyAnPC9zcGFuPicgKwogICAgICAgICAgJzxzcGFuIGNsYXNzPSJ0dCI+JyArIG1vbmV5KGwu',
  'dG90YWwsIDIpICsgJzwvc3Bhbj48L2Rpdj4nOwogICAgICB9KS5qb2luKCcnKSArCiAgICAgICgoYi5zaGlwcGluZyB8fCBiLmRpc2NvdW50KQogICAgICAgID8gJzxkaXYgY2xhc3M9ImJpbGwtZXh0cmEiPicgKwogICAgICAgICAgICAoYi5zaGlwcGluZyA/ICfg',
  'uITguYjguLLguKrguYjguIcgJyArIG1vbmV5KGIuc2hpcHBpbmcsIDIpIDogJycpICsKICAgICAgICAgICAgKGIuc2hpcHBpbmcgJiYgYi5kaXNjb3VudCA/ICcgwrcgJyA6ICcnKSArCiAgICAgICAgICAgIChiLmRpc2NvdW50ID8gJ+C4quC5iOC4p+C4meC4peC4',
  'lCDiiJInICsgbW9uZXkoYi5kaXNjb3VudCwgMikgOiAnJykgKyAnPC9kaXY+JwogICAgICAgIDogJycpICsKICAgICc8L2Rpdj4nOwp9CgpmdW5jdGlvbiB0b2dnbGVCaWxsKGlkKXsKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7CiAgaWYg',
  'KCFlbCkgcmV0dXJuOwogIGVsLmhpZGRlbiA9ICFlbC5oaWRkZW47CiAgdmFyIGJ0biA9IGVsLnByZXZpb3VzRWxlbWVudFNpYmxpbmc7CiAgaWYgKGJ0bikgYnRuLnRleHRDb250ZW50ID0gYnRuLnRleHRDb250ZW50LnJlcGxhY2UoZWwuaGlkZGVuID8gJ+KWtCcg',
  'OiAn4pa+JywgZWwuaGlkZGVuID8gJ+KWvicgOiAn4pa0Jyk7Cn0KCmZ1bmN0aW9uIHNldFBhcmFtKGtleSwgdmFsKXsKICBTLnBhcmFtc1trZXldID0gdmFsOwogIGxvYWQoKTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09CiAgIDQpIOC4peC5ieC4suC4h+C5geC4reC4o+C5jAogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLmFjID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7',
  'IHJldHVybiBjYWxsQXBpKCdhYy5tYXRyaXgnLCB7IHllYXI6IFMueWVhciB9KTsgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVh',
  'cjsKICAgIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgIGtwaSgn4Lil4LmJ4Liy4LiH4LmB4Lil4LmJ4LinICcgKyB5ZWFyTGFiZWwsIGQucm9vbXNEb25lSW5ZZWFyICsgJy8nICsgZC5yb29tcy5sZW5ndGggKyAnIOC4q+C5',
  'ieC4reC4hycsIGQuZG9uZUluWWVhciArICcg4Lij4Lit4Lia4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJywgJ2FjY2VudCcpICsKICAgICAga3BpKCfguKLguLHguIfguYTguKHguYjguYTguJTguYnguKXguYnguLLguIcnLCBkLnJvb21zUGVuZGluZy5sZW5ndGggKyAn',
  'IOC4q+C5ieC4reC4hycsIGQucm9vbXNQZW5kaW5nLnNsaWNlKDAsOCkuam9pbignLCAnKSArIChkLnJvb21zUGVuZGluZy5sZW5ndGg+OD8n4oCmJzonJyksIGQucm9vbXNQZW5kaW5nLmxlbmd0aCA/ICd3YXJuJzonZ29vZCcpICsKICAgICAga3BpKCfguJbguLbg',
  'uIfguIHguLPguKvguJnguJTguKXguYnguLLguIcnLCBkLm92ZXJkdWUubGVuZ3RoICsgJyDguKvguYnguK3guIcnLCAn4Lij4Lit4Lia4Lil4LmJ4Liy4LiH4LiX4Li44LiBICcgKyBkLmN5Y2xlTW9udGhzICsgJyDguYDguJTguLfguK3guJknLCBkLm92ZXJkdWUu',
  'bGVuZ3RoID8gJ2JhZCc6J2dvb2QnKSArCiAgICAgIGtwaSgn4LiE4Lin4Liy4Lih4LiE4Li34Lia4Lir4LiZ4LmJ4LiyJywgcGN0KGQucm9vbXMubGVuZ3RoID8gZC5yb29tc0RvbmVJblllYXIvZC5yb29tcy5sZW5ndGgqMTAwIDogMCksICfguILguK3guIfguJfg',
  'uLHguYnguIfguKvguKHguJQgJyArIGQucm9vbXMubGVuZ3RoICsgJyDguKvguYnguK3guIcnKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgYWN0aW9ucyA9ICc8ZGl2IGNsYXNzPSJyb3cgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBv',
  'bmNsaWNrPSJmb3JtQWMobnVsbCkiPisg4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImZvcm1CdWxrQWMoKSI+8J+ThSDguJnguLHg',
  'uJTguKXguYnguLLguIfguKvguKXguLLguKLguKvguYnguK3guIfguJ7guKPguYnguK3guKHguIHguLHguJk8L2J1dHRvbj4nICsKICAgICAgJzxzcGFuIGNsYXNzPSJzcCI+PC9zcGFuPicgKwogICAgICAnPHNwYW4gY2xhc3M9ImZzMTIgbXV0ZWQiPuC4hOC4peC4',
  'tOC4geC4l+C4teC5iOC4q+C5ieC4reC4h+C5gOC4nuC4t+C5iOC4reC4lOC4uS/guYDguJ7guLTguYjguKHguKPguK3guJrguIHguLLguKPguKXguYnguLLguIc8L3NwYW4+JyArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgZ3JpZCA9IGNhcmQoJ+KdhO+4jyDguJXg',
  'uLLguKPguLLguIfguKXguYnguLLguIfguYHguK3guKPguYzguKPguLLguKLguKvguYnguK3guIcgwrcgJyArIHllYXJMYWJlbCwgcm9vbUZsb29ycyhkLnJvb21zLCBmdW5jdGlvbihyKXsKICAgICAgdmFyIGNscyA9IHIucm91bmRzSW5ZZWFyID4gMCA/ICdzLW9r',
  'JyA6IChyLnN0YXRlID09PSAn4LmA4LiB4Li04LiZ4LiB4Liz4Lir4LiZ4LiUJyA/ICdzLWRncicgOiAoci5zdGF0ZSA9PT0gJ+C4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4peC5ieC4suC4hycgPyAncy13YXJuJyA6ICdzLWluZm8nKSk7CiAgICAgIHZhciBz',
  'dWIgPSByLnJvdW5kc0luWWVhciA+IDAKICAgICAgICA/ICc8Yj4nICsgci5yb3VuZHNJblllYXIgKyAnIOC4o+C4reC4mjwvYj48YnI+JyArIHRoRGF0ZVNob3J0KHIucmVjb3Jkcy5maWx0ZXIoZnVuY3Rpb24oeCl7cmV0dXJuIHguc2VydmljZURhdGU7fSkubWFw',
  'KGZ1bmN0aW9uKHgpe3JldHVybiB4LnNlcnZpY2VEYXRlO30pLnNvcnQoKS5wb3AoKSkKICAgICAgICA6IChyLmJvb2tlZEluWWVhciA/ICfguJnguLHguJTguYHguKXguYnguKcgJyArIHIuYm9va2VkSW5ZZWFyIDogKHIubGFzdFNlcnZpY2UgPyAn4Lil4LmI4Liy',
  '4Liq4Li44LiUICcgKyB0aERhdGVTaG9ydChyLmxhc3RTZXJ2aWNlKSA6ICfguYTguKHguYjguKHguLXguJvguKPguLDguKfguLHguJXguLQnKSk7CiAgICAgIHJldHVybiB7IGNsczogY2xzLCBzdWI6IHN1Yiwgb25jbGljazogJ29wZW5BY1Jvb20oJyArIGpzcShy',
  'LnJvb20pICsgJyknIH07CiAgICB9KSwgJycsIGZhbHNlKTsKCiAgICB2YXIgbGlzdFJvd3MgPSBbXTsKICAgIGQucm9vbXMuZm9yRWFjaChmdW5jdGlvbihyKXsgci5yZWNvcmRzLmZvckVhY2goZnVuY3Rpb24oeCl7IHguX3Jvb20gPSByLnJvb207IGxpc3RSb3dz',
  'LnB1c2goeCk7IH0pOyB9KTsKICAgIGxpc3RSb3dzLnNvcnQoZnVuY3Rpb24oYSxiKXsgcmV0dXJuIFN0cmluZyhiLnNlcnZpY2VEYXRlfHxiLmJvb2tEYXRlfHwnJykubG9jYWxlQ29tcGFyZShTdHJpbmcoYS5zZXJ2aWNlRGF0ZXx8YS5ib29rRGF0ZXx8JycpKTsg',
  'fSk7CgogICAgdmFyIGxpc3QgPSBjYXJkKCfwn5OLIOC4m+C4o+C4sOC4p+C4seC4leC4tOC4geC4suC4o+C4peC5ieC4suC4h+C5geC4reC4o+C5jCDCtyAnICsgeWVhckxhYmVsICsgJyAoJyArIGxpc3RSb3dzLmxlbmd0aCArICcpJywKICAgICAgbGlzdFJvd3Mu',
  'bGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guKvguYnguK3guIc8L3RoPjx0aD7guKPguK3guJrguJfguLXguYg8L3RoPjx0aD7guKfguLHguJnguJfguLXguYjguJnguLHguJQ8L3Ro',
  'Pjx0aD7guKfguLHguJnguJfguLXguYjguJTguLPguYDguJnguLTguJnguIHguLLguKM8L3RoPjx0aD7guKrguJbguLLguJnguLA8L3RoPicgKwogICAgICAgICc8dGg+4LiK4LmI4Liy4LiHPC90aD48dGggY2xhc3M9Im51bSI+4LiE4LmI4Liy4LmD4LiK4LmJ4LiI',
  '4LmI4Liy4LiiPC90aD48dGg+4Lig4Liy4LiePC90aD48dGg+4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4PC90aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIGxpc3RSb3dzLm1hcChmdW5jdGlvbih4KXsKICAgICAgICAgIHJldHVybiAn',
  'PHRyPicgKwogICAgICAgICAgICAnPHRkPjxiPicgKyBlc2MoeC5yb29tKSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHgucm91bmQgfHwgMSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFw',
  'IGZzMTIiPicgKyB0aERhdGUoeC5ib29rRGF0ZSkgKyBvdGhlclllYXJUYWcoeCkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyB0aERhdGUoeC5zZXJ2aWNlRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0',
  'ZD4nICsgc3RhdHVzU2VsZWN0KHgsICdhYy5zZXRTdGF0dXMnLCBvcHQoJ2FjU3RhdHVzZXMnKSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyh4LnRlY2huaWNpYW4gfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAg',
  'ICAgICc8dGQgY2xhc3M9Im51bSI+JyArIG51bSh4LmNvc3QpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwoeC5waG90b1JlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIgbXV0ZWQgY2xpcCI+JyAr',
  'IGVzYyh4Lm5vdGUgfHwgJycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24iIG9uY2xpY2s9XCdmb3JtQWMoJyArIGF0dHIoeCkgKyAn',
  'KVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiBkZ3IiIG9uY2xpY2s9ImRlbEFjKCcgKyBqc3EoeC5pZCkgKyAnKSI+8J+XkTwvYnV0dG9uPicgKwogICAgICAgICAgICAnPC9kaXY+PC90ZD48L3Ry',
  'Pic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgOiBlbXB0eUJveCgn4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4LmD4LiZ',
  'JyArIHllYXJMYWJlbCksICcnLCB0cnVlKTsKCiAgICByZXR1cm4gaGVhZCArIGFjdGlvbnMgKyBncmlkICsgJzxkaXYgY2xhc3M9Im10MTIiPicgKyBsaXN0ICsgJzwvZGl2Pic7CiAgfQp9OwoKLyoqCiAqIOC4iuC5iOC4reC4h+C5gOC4peC4t+C4reC4geC4quC4',
  'luC4suC4meC4sOC5g+C4meC4leC4suC4o+C4suC4hyDigJQg4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LmB4Lil4LmJ4Lin4Lia4Lix4LiZ4LiX4Li24LiB4LiX4Lix4LiZ4LiX4Li1IOC5hOC4oeC5iOC4leC5ieC4reC4h+C5gOC4m+C4tOC4lOC4n+C4reC4o+C5jOC4',
  'oQogKgogKiDguKvguJnguYnguLLguJXguLLguYDguKvguKHguLfguK3guJnguJvguYnguLLguKLguKrguJbguLLguJnguLDguYDguJTguLTguKHguJfguLjguIHguK3guKLguYjguLLguIcgKOC4quC4teC5gOC4lOC4teC4ouC4p+C4geC4seC4mSkg4LmB4LiE4LmI',
  '4LiB4LiU4LmB4Lil4LmJ4Lin4LmA4Lil4Li34Lit4LiB4LmE4LiU4LmJCiAqIOC4hOC4meC4l+C4teC5iOC5gOC4m+C4tOC4lOC4lOC4ueC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4p+C4iOC4sOC5gOC4q+C5h+C4meC5gOC4m+C5h+C4meC4m+C5ieC4suC4',
  'ouC4mOC4o+C4o+C4oeC4lOC4suC5gOC4q+C4oeC4t+C4reC4meC5gOC4lOC4tOC4oQogKi8KZnVuY3Rpb24gc3RhdHVzU2VsZWN0KHgsIGFjdGlvbiwgb3B0aW9ucyl7CiAgaWYgKCFjYW5FZGl0KCkpIHJldHVybiBzdGF0dXNCYWRnZSh4LnN0YXR1cyk7CiAgdmFy',
  'IGN1ciA9IFN0cmluZyh4LnN0YXR1cyB8fCAnJyk7CiAgdmFyIGxpc3QgPSAob3B0aW9ucyB8fCBbXSkuc2xpY2UoKTsKICBpZiAoY3VyICYmIGxpc3QuaW5kZXhPZihjdXIpIDwgMCkgbGlzdC51bnNoaWZ0KGN1cik7ICAgLy8g4LiE4LmI4Liy4LmA4LiB4LmI4Liy',
  '4LiZ4Lit4LiB4Lij4Liy4Lii4LiB4Liy4LijIOC4leC5ieC4reC4h+C5hOC4oeC5iOC4q+C4suC4ouC5hOC4mwogIHJldHVybiAnPHNlbGVjdCBjbGFzcz0ic3Qtc2VsICcgKyBzdGF0dXNUb25lKGN1cikgKyAnIiB0aXRsZT0i4LmA4Lib4Lil4Li14LmI4Lii4LiZ',
  '4Liq4LiW4Liy4LiZ4Liw4LmE4LiU4LmJ4LmA4Lil4LiiIicgKwogICAgJyBkYXRhLXByZXY9IicgKyBlc2MoY3VyKSArICciJyArCiAgICAnIG9uY2hhbmdlPSJjaGFuZ2VTdGF0dXMoXCcnICsgYWN0aW9uICsgJ1wnLCcgKyBqc3EoeC5pZCkgKyAnLHRoaXMpIj4n',
  'ICsKICAgIGxpc3QubWFwKGZ1bmN0aW9uKG8pewogICAgICByZXR1cm4gJzxvcHRpb24gdmFsdWU9IicgKyBlc2MobykgKyAnIicgKyAobyA9PT0gY3VyID8gJyBzZWxlY3RlZCcgOiAnJykgKyAnPicgKyBlc2MobykgKyAnPC9vcHRpb24+JzsKICAgIH0pLmpvaW4o',
  'JycpICsgJzwvc2VsZWN0Pic7Cn0KCi8qKiDguKrguLXguILguK3guIfguKrguJbguLLguJnguLAg4LmD4LiK4LmJ4LiK4Li44LiU4LmA4LiU4Li14Lii4Lin4LiB4Lix4Lia4Lib4LmJ4Liy4LiiIHN0YXR1c0JhZGdlIOC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC5',
  'gOC4nuC4teC5ieC4ouC4meC4geC4seC4mSAqLwpmdW5jdGlvbiBzdGF0dXNUb25lKHN0KXsKICB2YXIgbSA9IFN0cmluZyhzdGF0dXNCYWRnZShzdCkpLm1hdGNoKC9jbGFzcz0iYiAoW2Etel0rKSIvKTsKICByZXR1cm4gbSA/IG1bMV0gOiAnbXV0ZSc7Cn0KCmZ1',
  'bmN0aW9uIGNoYW5nZVN0YXR1cyhhY3Rpb24sIGlkLCBzZWwpewogIHZhciBuZXh0ID0gc2VsLnZhbHVlLCBwcmV2ID0gc2VsLmdldEF0dHJpYnV0ZSgnZGF0YS1wcmV2JykgfHwgJyc7CiAgc2VsLmRpc2FibGVkID0gdHJ1ZTsKICBzZWwuY2xhc3NOYW1lID0gJ3N0',
  'LXNlbCAnICsgc3RhdHVzVG9uZShuZXh0KTsKCiAgY2FsbEFwaShhY3Rpb24sIHsgaWQ6IGlkLCBzdGF0dXM6IG5leHQgfSkudGhlbihmdW5jdGlvbihzYXZlZCl7CiAgICBpZiAoc2F2ZWQgJiYgc2F2ZWQuZmlsbGVkRGF0ZSkgewogICAgICB0b2FzdCgn4Lia4Lix',
  '4LiZ4LiX4Li24LiB4LmB4Lil4LmJ4LinIMK3IOC5gOC4leC4tOC4oeC4p+C4seC4meC4l+C4teC5iOC4lOC4s+C5gOC4meC4tOC4meC4geC4suC4o+C5gOC4m+C5h+C4mSAnICsgdGhEYXRlKHNhdmVkLmZpbGxlZERhdGUpICsgJyDguYPguKvguYnguJTguYnguKfg',
  'uKInLCAnb2snKTsKICAgIH0KICAgIHNlbC5zZXRBdHRyaWJ1dGUoJ2RhdGEtcHJldicsIG5leHQpOwogICAgc2VsLmRpc2FibGVkID0gZmFsc2U7CiAgICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7ICAgLy8g4LiK4LmI4Lit4LiH4Lir4LmJ4Lit4LiH4LiB4Lix4Lia',
  '4LiV4Lix4Lin4LmA4Lil4LiC4Liq4Lij4Li44Lib4LiU4LmJ4Liy4LiZ4Lia4LiZ4Lit4Liy4LiI4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LiV4Liy4LihCiAgICByZWZyZXNoQWxlcnRzKCk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICBpZiAocHJldikgeyBz',
  'ZWwudmFsdWUgPSBwcmV2OyBzZWwuY2xhc3NOYW1lID0gJ3N0LXNlbCAnICsgc3RhdHVzVG9uZShwcmV2KTsgfQogICAgc2VsLmRpc2FibGVkID0gZmFsc2U7CiAgICB0b2FzdChlLm1lc3NhZ2UgfHwgZSwgJ2VycicpOwogIH0pOwp9CgpmdW5jdGlvbiBvcGVuQWNS',
  'b29tKHJvb20pewogIHZhciBkID0gUy5jYWNoZS5hYzsKICB2YXIgciA9IGQucm9vbXMuZmlsdGVyKGZ1bmN0aW9uKHgpeyByZXR1cm4geC5yb29tID09PSByb29tOyB9KVswXTsKICB2YXIgYm9keSA9CiAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMyBtYjEyIj4nICsK',
  'ICAgICAga3BpKCfguKPguK3guJrguJfguLXguYjguKXguYnguLLguIfguYPguJnguJvguLXguJnguLXguYknLCAoci5yb3VuZHNJblllYXJ8fDApICsgJyDguKPguK3guJonLCAnJykgKwogICAgICBrcGkoJ+C4peC5ieC4suC4h+C4peC5iOC4suC4quC4uOC4lCcs',
  'IHIubGFzdFNlcnZpY2UgPyB0aERhdGUoci5sYXN0U2VydmljZSkgOiAn4oCTJywgci5sYXN0U2VydmljZSA/IChkYXlzQWdvKHIubGFzdFNlcnZpY2UpICsgJyDguKfguLHguJnguJfguLXguYjguYHguKXguYnguKcnKSA6ICcnKSArCiAgICAgIGtwaSgn4LiE4Lij',
  '4Lia4LiB4Liz4Lir4LiZ4LiU4Lij4Lit4Lia4LiW4Lix4LiU4LmE4LibJywgci5uZXh0RHVlID8gdGhEYXRlKHIubmV4dER1ZSkgOiAn4oCTJywgci5zdGF0ZSwgci5zdGF0ZSA9PT0gJ+C5gOC4geC4tOC4meC4geC4s+C4q+C4meC4lCcgPyAnYmFkJyA6ICcnKSAr',
  'CiAgICAnPC9kaXY+JyArCiAgICAoci5yZWNvcmRzLmxlbmd0aAogICAgICA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOmF1dG8iPjx0aGVhZD48dHI+PHRoPuC4o+C4reC4mjwvdGg+PHRoPuC4meC4seC4lDwvdGg+',
  'PHRoPuC4lOC4s+C5gOC4meC4tOC4meC4geC4suC4ozwvdGg+PHRoPuC4quC4luC4suC4meC4sDwvdGg+PHRoPuC4oOC4suC4njwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICByLnJlY29yZHMubWFwKGZ1bmN0aW9uKHgpewogICAg',
  'ICAgICAgcmV0dXJuICc8dHI+PHRkPicgKyAoeC5yb3VuZHx8MSkgKyAnPC90ZD48dGQgY2xhc3M9ImZzMTIiPicgKyB0aERhdGUoeC5ib29rRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIHRoRGF0ZSh4LnNlcnZpY2VE',
  'YXRlKSArICc8L3RkPjx0ZD4nICsgc3RhdHVzQmFkZ2UoeC5zdGF0dXMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwoeC5waG90b1JlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGJ1dHRvbiBjbGFzcz0iYnRuIHNt',
  'IiBvbmNsaWNrPVwnY2xvc2VNb2RhbCgpO2Zvcm1BYygnICsgYXR0cih4KSArICcpXCc+4LmB4LiB4LmJ4LmE4LiCPC9idXR0b24+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgOiAnPGRpdiBj',
  'bGFzcz0iZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4muC4seC4meC4l+C4tuC4geC5g+C4meC4m+C4teC4l+C4teC5iOC5gOC4peC4t+C4reC4gTwvZGl2PicpOwoKICBvcGVuTW9kYWwoJ+KdhO+4jyDguKXguYnguLLguIfguYHguK3guKPguYwgwrcg',
  '4Lir4LmJ4Lit4LiHICcgKyByb29tLCBib2R5LAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guJvguLTguJQ8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCk7',
  'Zm9ybUFjKHtyb29tOicgKyBqc3Eocm9vbSkgKyAnfSkiPisg4LmA4Lie4Li04LmI4Lih4Lij4Lit4Lia4LiB4Liy4Lij4Lil4LmJ4Liy4LiHPC9idXR0b24+Jyk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PQogICA1KSDguIvguYjguK3guKHguYHguIvguKHguJXguLLguKHguKvguYnguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5yZXBhaXJzID0gewogIGxv',
  'YWQ6IGZ1bmN0aW9uKCl7IHJldHVybiBjYWxsQXBpKCdyZXBhaXIubWF0cml4JywgeyB5ZWFyOiBTLnllYXIgfSk7IH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScg',
  'OiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICBrcGkoJ+C4h+C4suC4meC4i+C5iOC4reC4oSAnICsgeWVhckxhYmVsLCBkLnRvdGFsSm9icyArICcg4LiH4Liy4LiZJywgJ+C4iOC4',
  'suC4gSAnICsgZC5yb29tcy5maWx0ZXIoZnVuY3Rpb24ocil7cmV0dXJuIHIuY291bnQ+MDt9KS5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsICdhY2NlbnQnKSArCiAgICAgIGtwaSgn4LiH4Liy4LiZ4LiX4Li14LmI4Lii4Lix4LiH4LmE4Lih4LmI4LmA4Liq4Lij',
  '4LmH4LiIJywgZC5vcGVuSm9icyArICcg4LiH4Liy4LiZJywgZC5vcGVuVGFza3MgPyAn4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmIICcgKyBkLm9wZW5UYXNrcyArICcg4LiI4Li44LiUJyA6ICcnLCBkLm9wZW5Kb2JzID8gJ3dhcm4nIDogJ2dvb2QnKSArCiAgICAg',
  'IGtwaSgn4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Lij4Lin4LihJywgYmFodChkLnRvdGFsQ29zdCksIHllYXJMYWJlbCkgKwogICAgICBrcGkoJ+C4q+C5ieC4reC4h+C4l+C4teC5iOC4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4i+C5iOC4reC4',
  'oScsIGQucm9vbXMuZmlsdGVyKGZ1bmN0aW9uKHIpe3JldHVybiByLmNvdW50PT09MDt9KS5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsICfguYPguJknICsgeWVhckxhYmVsKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgYWN0aW9ucyA9ICc8ZGl2IGNsYXNzPSJy',
  'b3cgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtUmVwYWlyKG51bGwpIj4rIOC5geC4iOC5ieC4h+C4i+C5iOC4reC4oSAvIOC4muC4seC4meC4l+C4tuC4geC4h+C4suC4meC4i+C5iOC4reC4oTwvYnV0dG9uPicg',
  'KwogICAgICAnPHNwYW4gY2xhc3M9InNwIj48L3NwYW4+PHNwYW4gY2xhc3M9ImZzMTIgbXV0ZWQiPuC4hOC4peC4tOC4geC4l+C4teC5iOC4q+C5ieC4reC4h+C5gOC4nuC4t+C5iOC4reC4lOC4ueC4m+C4o+C4sOC4p+C4seC4leC4tOC4h+C4suC4meC4i+C5iOC4',
  'reC4oeC4guC4reC4h+C4q+C5ieC4reC4h+C4meC4seC5ieC4mTwvc3Bhbj48L2Rpdj4nOwoKICAgIHZhciBncmlkID0gY2FyZCgn8J+UpyDguKDguLLguJ7guKPguKfguKHguIfguLLguJnguIvguYjguK3guKHguKPguLLguKLguKvguYnguK3guIcgwrcgJyArIHll',
  'YXJMYWJlbCwgcm9vbUZsb29ycyhkLnJvb21zLCBmdW5jdGlvbihyKXsKICAgICAgdmFyIGNscyA9IHIub3BlbkNvdW50ID4gMCA/ICdzLWRncicgOiAoci5jb3VudCA+IDAgPyAncy1vaycgOiAncy1pbmZvJyk7CiAgICAgIHZhciBzdWIgPSByLmNvdW50ID4gMAog',
  'ICAgICAgID8gJzxiPicgKyByLmNvdW50ICsgJyDguIfguLLguJk8L2I+JyArIChyLm9wZW5Db3VudCA/ICcgwrcg4LiE4LmJ4Liy4LiHICcgKyAoci5vcGVuVGFza3MgfHwgci5vcGVuQ291bnQpICsgJyDguIjguLjguJQnIDogJycpICsgJzxicj4nICsgKHIubGFz',
  'dCA/IHRoRGF0ZVNob3J0KHIubGFzdCkgOiAnJykKICAgICAgICA6ICfguYTguKHguYjguKHguLXguIfguLLguJnguIvguYjguK3guKEnOwogICAgICByZXR1cm4geyBjbHM6IGNscywgc3ViOiBzdWIsIG9uY2xpY2s6ICdvcGVuUmVwYWlyUm9vbSgnICsganNxKHIu',
  'cm9vbSkgKyAnKScgfTsKICAgIH0pKTsKCiAgICB2YXIgcm93cyA9IFtdOwogICAgZC5yb29tcy5mb3JFYWNoKGZ1bmN0aW9uKHIpeyByLnJlY29yZHMuZm9yRWFjaChmdW5jdGlvbih4KXsgcm93cy5wdXNoKHgpOyB9KTsgfSk7CiAgICByb3dzLnNvcnQoZnVuY3Rp',
  'b24oYSxiKXsgcmV0dXJuIFN0cmluZyhiLnJlcGFpckRhdGV8fGIuYm9va0RhdGV8fCcnKS5sb2NhbGVDb21wYXJlKFN0cmluZyhhLnJlcGFpckRhdGV8fGEuYm9va0RhdGV8fCcnKSk7IH0pOwoKICAgIHZhciBsaXN0ID0gY2FyZCgn8J+TiyDguKPguLLguKLguIHg',
  'uLLguKPguIfguLLguJnguIvguYjguK3guKEgwrcgJyArIHllYXJMYWJlbCArICcgKCcgKyByb3dzLmxlbmd0aCArICcpJywKICAgICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDoxMDIwcHgi',
  'Pjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guKvguYnguK3guIc8L3RoPjx0aD7guKfguLHguJnguJnguLHguJTguIvguYjguK3guKE8L3RoPjx0aD7guKfguLHguJnguYDguILguYnguLLguIvguYjguK3guKE8L3RoPjx0aD7guJvguKPguLDguYDguKDguJc8',
  'L3RoPjx0aD7guKPguLLguKLguIHguLLguKPguJfguLXguYjguIvguYjguK3guKHguYHguIvguKE8L3RoPicgKwogICAgICAgICc8dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD48dGggY2xhc3M9Im51bSI+4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiPC90aD48',
  'dGg+4LiB4LmI4Lit4LiZPC90aD48dGg+4Lir4Lil4Lix4LiHPC90aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIHJvd3MubWFwKGZ1bmN0aW9uKHgpewogICAgICAgICAgcmV0dXJuICc8dHI+JyArCiAgICAgICAgICAgICc8dGQ+PGI+',
  'JyArIGVzYyh4LnJvb20pICsgJzwvYj48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LmJvb2tEYXRlKSArIG90aGVyWWVhclRhZyh4KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dy',
  'YXAgZnMxMiI+JyArIHRoRGF0ZSh4LnJlcGFpckRhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MoeC5jYXRlZ29yeSB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBzdHlsZT0ibWluLXdpZHRo',
  'OjI4MHB4Ij4nICsgdG9kb0xpc3RIdG1sKHgpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHN0YXR1c0JhZGdlKHguc3RhdHVzKSArICh4LnByaW9yaXR5ICYmIHgucHJpb3JpdHkgIT09ICfguJvguIHguJXguLQnID8gJyAnICsgc3RhdHVzQmFkZ2Uo',
  'eC5wcmlvcml0eSkgOiAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbnVtKHguY29zdCkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCh4LmJlZm9yZVJlZnMpICsgJzwvdGQ+JyArCiAgICAg',
  'ICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwoeC5hZnRlclJlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24iIG9uY2xpY2s9XCdm',
  'b3JtUmVwYWlyKCcgKyBhdHRyKHgpICsgJylcJz7inI/vuI88L2J1dHRvbj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24gZGdyIiBvbmNsaWNrPSJkZWxSZXBhaXIoJyArIGpzcSh4LmlkKSArICcpIj7wn5eRPC9idXR0b24+JyAr',
  'CiAgICAgICAgICAgICc8L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6IGVtcHR5Qm94KCfguKLguLHguIfguYTguKHguYjguKHguLXguIfguLLguJnguIvguYjguK3guKHguYPguJkn',
  'ICsgeWVhckxhYmVsLCAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZm9ybVJlcGFpcihudWxsKSI+KyDguYHguIjguYnguIfguIvguYjguK3guKE8L2J1dHRvbj4nKSwgJycsIHRydWUpOwoKICAgIHJldHVybiBoZWFkICsgYWN0aW9ucyArIGdyaWQg',
  'KyAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIGxpc3QgKyAnPC9kaXY+JzsKICB9Cn07CgovKioKICog4LmA4LiK4LmH4LiE4Lil4Li04Liq4LiV4LmM4LiX4Li14LmI4LiV4Li04LmK4LiB4LmE4LiU4LmJ4LiI4Lij4Li04LiH4LiI4Liy4LiB4Lir4LiZ4LmJ4Liy4Lij',
  '4Liy4Lii4LiB4Liy4LijIOC5hOC4oeC5iOC4leC5ieC4reC4h+C5gOC4m+C4tOC4lOC4n+C4reC4o+C5jOC4oQogKiDguJXguLTguYrguIHguJvguLjguYrguJrguJrguLHguJnguJfguLbguIHguILguLbguYnguJnguIrguLXguJXguJfguLHguJnguJfguLUg4LmB',
  '4Lil4Liw4LiW4LmJ4Liy4LiV4Li04LmK4LiB4LiE4Lij4Lia4LiX4Li44LiB4LiC4LmJ4LitIOC4quC4luC4suC4meC4sOC4iOC4sOC5gOC4m+C4peC4teC5iOC4ouC4meC5gOC4m+C5h+C4mSAi4LmA4Liq4Lij4LmH4LiI4Liq4Li04LmJ4LiZIiDguYPguKvguYng',
  'uYDguK3guIcKICovCmZ1bmN0aW9uIHRvZG9MaXN0SHRtbCh4KXsKICB2YXIgdG9kbyA9IHgudG9kbyB8fCBbXTsKICBpZiAoIXRvZG8ubGVuZ3RoKSByZXR1cm4gJzxzcGFuIGNsYXNzPSJmczEzIG11dGVkIj4nICsgZXNjKHguaXRlbXMgfHwgJ+KAkycpICsgJzwv',
  'c3Bhbj4nOwoKICB2YXIgcCA9IHgucHJvZ3Jlc3MgfHwgeyBkb25lOiAwLCB0b3RhbDogdG9kby5sZW5ndGgsIHBlcmNlbnQ6IDAgfTsKICB2YXIgbG9ja2VkID0gIWNhbkVkaXQoKTsKCiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJ0b2RvLXZpZXciPicgKwogICAgJzxk',
  'aXYgY2xhc3M9InRvZG8tYmFyIj48aSBzdHlsZT0id2lkdGg6JyArIHAucGVyY2VudCArICclIj48L2k+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0idG9kby1tZXRhIj7guYDguKrguKPguYfguIjguYHguKXguYnguKcgPGI+JyArIHAuZG9uZSArICcvJyArIHAu',
  'dG90YWwgKyAnPC9iPiDguIfguLLguJk8L2Rpdj4nICsKICAgIHRvZG8ubWFwKGZ1bmN0aW9uKHQsIGkpewogICAgICByZXR1cm4gJzxsYWJlbCBjbGFzcz0idG9kby1saW5lJyArICh0LmRvbmUgPyAnIGRvbmUnIDogJycpICsgKGxvY2tlZCA/ICcgbG9ja2VkJyA6',
  'ICcnKSArICciPicgKwogICAgICAgICc8aW5wdXQgdHlwZT0iY2hlY2tib3giJyArICh0LmRvbmUgPyAnIGNoZWNrZWQnIDogJycpICsgKGxvY2tlZCA/ICcgZGlzYWJsZWQnIDogJycpICsKICAgICAgICAgICcgb25jaGFuZ2U9InRvZ2dsZVRvZG8oJyArIGpzcSh4',
  'LmlkKSArICcsJyArIGkgKyAnLHRoaXMuY2hlY2tlZCx0aGlzKSI+JyArCiAgICAgICAgJzxzcGFuIGNsYXNzPSJubSI+JyArIGVzYyh0Lm5hbWUpICsgJzwvc3Bhbj4nICsKICAgICAgICAodC5jYXRlZ29yeSA/ICc8c3BhbiBjbGFzcz0iYiBtdXRlIGNhdCI+JyAr',
  'IGVzYyh0LmNhdGVnb3J5KSArICc8L3NwYW4+JyA6ICcnKSArCiAgICAgICc8L2xhYmVsPic7CiAgICB9KS5qb2luKCcnKSArCiAgJzwvZGl2Pic7Cn0KCi8qKgogKiDguJXguLTguYrguIHguIfguLLguJnguKvguJnguLbguYjguIfguILguYnguK0g4oCUIOC4reC4',
  'seC4m+C5gOC4lOC4leC4q+C4meC5ieC4suC4iOC4reC4l+C4seC4meC4l+C4teC5geC4peC5ieC4p+C4hOC5iOC4reC4ouC4muC4seC4meC4l+C4tuC4gQogKiDguJbguYnguLLguJrguLHguJnguJfguLbguIHguYTguKHguYjguJzguYjguLLguJkg4LmD4Lir4LmJ',
  '4LiV4Li04LmK4LiB4LiB4Lil4Lix4Lia4LmE4Lib4LmA4Lib4LmH4LiZ4LmA4Lir4Lih4Li34Lit4LiZ4LmA4LiU4Li04LihIOC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC5gOC4guC5ieC4suC5g+C4iOC4nOC4tOC4lOC4p+C5iOC4suC4muC4seC4meC4l+C4tuC4',
  'geC5geC4peC5ieC4pwogKi8KZnVuY3Rpb24gdG9nZ2xlVG9kbyhpZCwgaW5kZXgsIGRvbmUsIGJveCl7CiAgdmFyIGxpbmUgPSBib3guY2xvc2VzdCgnLnRvZG8tbGluZScpOwogIGlmIChsaW5lKSBsaW5lLmNsYXNzTGlzdC50b2dnbGUoJ2RvbmUnLCBkb25lKTsK',
  'ICBib3guZGlzYWJsZWQgPSB0cnVlOwoKICBjYWxsQXBpKCdyZXBhaXIudG9nZ2xlJywgeyBpZDogaWQsIGluZGV4OiBpbmRleCwgZG9uZTogZG9uZSB9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7ICAgICAgICAvLyDguITguKfg',
  'uLLguKHguITguLfguJrguKvguJnguYnguLLguIHguLHguJrguKrguJbguLLguJnguLDguK3guLLguIjguYDguJvguKXguLXguYjguKLguJkg4LiL4Li04LiH4LiB4LmM4LmA4LiH4Li14Lii4LiaIOC5hgogICAgcmVmcmVzaEFsZXJ0cygpOyAgICAgICAgICAgICAg',
  'Ly8g4LiH4Liy4LiZ4LiE4LmJ4Liy4LiH4Lit4Liy4LiI4Lil4LiU4Lil4LiHIOC4leC4seC4p+C5gOC4peC4guC4muC4meC5gOC4oeC4meC4ueC4leC5ieC4reC4h+C4leC4suC4oeC4lOC5ieC4p+C4ogogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgYm94LmNo',
  'ZWNrZWQgPSAhZG9uZTsKICAgIGlmIChsaW5lKSBsaW5lLmNsYXNzTGlzdC50b2dnbGUoJ2RvbmUnLCAhZG9uZSk7CiAgICBib3guZGlzYWJsZWQgPSBmYWxzZTsKICAgIHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7CiAgfSk7Cn0KCmZ1bmN0aW9uIG9wZW5S',
  'ZXBhaXJSb29tKHJvb20pewogIHZhciBkID0gUy5jYWNoZS5yZXBhaXJzOwogIHZhciByID0gZC5yb29tcy5maWx0ZXIoZnVuY3Rpb24oeCl7IHJldHVybiB4LnJvb20gPT09IHJvb207IH0pWzBdOwogIHZhciBib2R5ID0gJzxkaXYgY2xhc3M9ImdyaWQgZzMgbWIx',
  'MiI+JyArCiAgICAgIGtwaSgn4LiH4Liy4LiZ4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJywgci5jb3VudCArICcg4LiH4Liy4LiZJywgJycpICsKICAgICAga3BpKCfguKLguLHguIfguYTguKHguYjguYDguKrguKPguYfguIgnLCByLm9wZW5Db3VudCArICcg4LiH4Liy',
  '4LiZJywgci5vcGVuVGFza3MgPyAn4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmIICcgKyByLm9wZW5UYXNrcyArICcg4LiI4Li44LiUJyA6ICcnLCByLm9wZW5Db3VudCA/ICd3YXJuJzonZ29vZCcpICsKICAgICAga3BpKCfguITguYjguLLguYPguIrguYnguIjguYjg',
  'uLLguKInLCBiYWh0KHIuY29zdCksICcnKSArCiAgICAnPC9kaXY+JyArCiAgICAoci5yZWNvcmRzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0bCI+JyArIHIucmVjb3Jkcy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0idGwtaSI+PGRp',
  'diBjbGFzcz0iZCI+JyArIHRoRGF0ZSh4LnJlcGFpckRhdGUgfHwgeC5ib29rRGF0ZSkgKyAnIMK3ICcgKyBlc2MoeC5jYXRlZ29yeXx8JycpICsgJyAnICsgc3RhdHVzQmFkZ2UoeC5zdGF0dXMpICsgJzwvZGl2PicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJ0Ij4n',
  'ICsgdG9kb0xpc3RIdG1sKHgpICsgJzwvZGl2PicgKwogICAgICAgICh4LnRlY2huaWNpYW4gPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCI+4LiK4LmI4Liy4LiHOiAnICsgZXNjKHgudGVjaG5pY2lhbikgKyAnPC9kaXY+JyA6ICcnKSArCiAgICAgICAgKHguY29z',
  'dCA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIj7guITguYjguLLguYPguIrguYnguIjguYjguLLguKIgJyArIGJhaHQoeC5jb3N0KSArICc8L2Rpdj4nIDogJycpICsKICAgICAgICAnPGRpdiBjbGFzcz0ibXQ4Ij4nICsgdGh1bWJzSHRtbCgoeC5iZWZvcmVSZWZz',
  'fHxbXSkuY29uY2F0KHguYWZ0ZXJSZWZzfHxbXSkpICsgJzwvZGl2PicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJtdDgiPjxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz1cJ2Nsb3NlTW9kYWwoKTtmb3JtUmVwYWlyKCcgKyBhdHRyKHgpICsgJylcJz7guYHg',
  'uIHguYnguYTguII8L2J1dHRvbj48L2Rpdj4nICsKICAgICAgJzwvZGl2Pic7CiAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij7guKLguLHguIfguYTguKHguYjguKHguLXguIfguLLguJnguIvguYjguK3guKHguYPguJnguJvg',
  'uLXguJfguLXguYjguYDguKXguLfguK3guIE8L2Rpdj4nKTsKCiAgb3Blbk1vZGFsKCfwn5SnIOC4h+C4suC4meC4i+C5iOC4reC4oSDCtyDguKvguYnguK3guIcgJyArIHJvb20sIGJvZHksCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1v',
  'ZGFsKCkiPuC4m+C4tOC4lDwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtmb3JtUmVwYWlyKHtyb29tOicgKyBqc3Eocm9vbSkgKyAnfSkiPisg4LmA4Lie4Li04LmI4Lih4LiH4Liy4LiZ4LiL4LmI',
  '4Lit4LihPC9idXR0b24+JywgdHJ1ZSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICA2KSDguIvguYjguK3guKHguYHguIvguKHguJXguLbguIHguYLguJTguKLguKPguKfguKEKICAg',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5idWlsZGluZyA9IHsKICBsb2FkOiBmdW5jdGlvbigpewogICAgcmV0dXJuIFByb21pc2UuYWxsKFsKICAgICAgY2FsbEFwaSgnYnVpbGRp',
  'bmcuc3VtbWFyeScsIHsgeWVhcjogUy55ZWFyIH0pLAogICAgICBjYWxsQXBpKCdidWlsZGluZy5saXN0JywgeyB5ZWFyOiBTLnllYXIsIHpvbmU6IFMucGFyYW1zLnpvbmUgfHwgJycsIHN0YXR1czogJycgfSkKICAgIF0pLnRoZW4oZnVuY3Rpb24ocil7IHZhciBk',
  'ID0gclswXTsgZC5pdGVtcyA9IHJbMV07IHJldHVybiBkOyB9KTsKICB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgeWVhckxhYmVsID0gUy55ZWFyID09PSAnYWxsJyA/ICfguJfguLjguIHguJvguLUnIDogJ+C4m+C4tSAnICsgUy55ZWFyOwogICAg',
  'dmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAga3BpKCfguIfguLLguJnguJvguLUgJyArIChTLnllYXI9PT0nYWxsJz8n4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJzpTLnllYXIpLCBkLnllYXJDb3VudCArICcg4LiH4Liy4LiZJywg',
  'J+C4quC4sOC4quC4oSAnICsgZC50b3RhbCArICcg4LiH4Liy4LiZJywgJ2FjY2VudCcpICsKICAgICAga3BpKCfguITguYjguLLguYPguIrguYnguIjguYjguLLguKIgJyArIHllYXJMYWJlbCwgYmFodChkLnllYXJDb3N0KSwgJ+C4quC4sOC4quC4oSAnICsgYmFo',
  'dChkLmdyYW5kQ29zdCkpICsKICAgICAga3BpKCfguIfguLLguJnguJfguLXguYjguKLguLHguIfguYTguKHguYjguYDguKrguKPguYfguIgnLCBkLm9wZW5Db3VudCArICcg4LiH4Liy4LiZJywgJycsIGQub3BlbkNvdW50ID8gJ3dhcm4nIDogJ2dvb2QnKSArCiAg',
  'ICAgIGtwaSgn4LiE4Lij4Lia4LiB4Liz4Lir4LiZ4LiU4LmD4LiZIDkwIOC4p+C4seC4mScsIGQudXBjb21pbmcubGVuZ3RoICsgJyDguIfguLLguJknLCBkLnVwY29taW5nLmxlbmd0aCA/IGQudXBjb21pbmdbMF0udGl0bGUgOiAnJywgZC51cGNvbWluZy5sZW5n',
  'dGggPyAnd2FybicgOiAnJykgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIHpvbmVzID0gJzxkaXYgY2xhc3M9ImNoaXBzIG1iMTIiPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iY2hpcCAnICsgKCFTLnBhcmFtcy56b25lPydvbic6JycpICsgJyIgb25jbGljaz0i',
  'c2V0UGFyYW0oXCd6b25lXCcsXCdcJykiPuC4l+C4uOC4geC4quC5iOC4p+C4mTwvYnV0dG9uPicgKwogICAgICBkLmJ5Wm9uZS5tYXAoZnVuY3Rpb24oeil7CiAgICAgICAgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJjaGlwICcgKyAoUy5wYXJhbXMuem9uZT09PXou',
  'em9uZT8nb24nOicnKSArICciIG9uY2xpY2s9InNldFBhcmFtKFwnem9uZVwnLCcgKyBqc3Eoei56b25lKSArICcpIj4nICsKICAgICAgICAgICAgICAgZXNjKHouem9uZSkgKyAnICgnICsgei5jb3VudCArICcpPC9idXR0b24+JzsKICAgICAgfSkuam9pbignJykg',
  'KyAnPC9kaXY+JzsKCiAgICB2YXIgY2hhcnRzID0gJzxkaXYgY2xhc3M9ImdyaWQgZzIgbWIxMiI+JyArCiAgICAgIGNhcmQoJ/Cfj5fvuI8g4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4LmB4Lii4LiB4LiV4Liy4Lih4Liq4LmI4Lin4LiZ4LiC4Lit4LiH',
  '4Lit4Liy4LiE4Liy4LijJywgYmFyQ2hhcnQoZC5ieVpvbmUsICd6b25lJywgJ2Nvc3QnLCBmdW5jdGlvbihpKXsgcmV0dXJuIG1vbmV5KGkuY29zdCkgKyAnIOC4vyc7IH0pKSArCiAgICAgIGNhcmQoJ/Cfk4Ug4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii',
  '4LmB4Lii4LiB4LiV4Liy4Lih4Lib4Li1JywgYmFyQ2hhcnQoCiAgICAgICAgZC5ieVllYXIubWFwKGZ1bmN0aW9uKHkpeyByZXR1cm4geyBsYWJlbDon4Lib4Li1ICcgKyB5LnllYXIgKyAnICgnICsgeS5jb3VudCArICcg4LiH4Liy4LiZKScsIGNvc3Q6eS5jb3N0',
  'IH07IH0pLAogICAgICAgICdsYWJlbCcsICdjb3N0JywgZnVuY3Rpb24oaSl7IHJldHVybiBtb25leShpLmNvc3QpICsgJyDguL8nOyB9KSkgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIHJvd3MgPSBkLml0ZW1zOwogICAgdmFyIGxpc3QgPSBjYXJkKCfwn4+iIOC4',
  'o+C4suC4ouC4geC4suC4o+C4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oSDCtyAnICsgeWVhckxhYmVsICsgJyAoJyArIHJvd3MubGVuZ3RoICsgJyknLAogICAgICByb3dzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRh',
  'YmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOjEwMjBweCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC4quC5iOC4p+C4meC4guC4reC4h+C4reC4suC4hOC4suC4ozwvdGg+PHRoPuC4o+C4suC4ouC4geC4suC4ozwvdGg+PHRoPuC4meC4seC4lDwv',
  'dGg+PHRoPuC5gOC4o+C4tOC5iOC4oTwvdGg+PHRoPuC5gOC4quC4o+C5h+C4iDwvdGg+PHRoPuC4quC4luC4suC4meC4sDwvdGg+JyArCiAgICAgICAgJzx0aD7guJzguLnguYnguKPguLHguJrguYDguKvguKHguLI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguYjg',
  'uLLguYPguIrguYnguIjguYjguLLguKI8L3RoPjx0aD7guKPguK3guJrguJbguLHguJTguYTguJs8L3RoPjx0aD7guKDguLLguJ48L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgcm93cy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgICAg',
  'ICByZXR1cm4gJzx0cj4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+PGI+JyArIGVzYyh4LnpvbmUgfHwgJ+KAkycpICsgJzwvYj48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEzIj48ZGl2IGNsYXNzPSJjbGlwIj4nICsgZXNjKHgu',
  'dGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAgICAgICh4Lm5vdGUgPyAnPGRpdiBjbGFzcz0iZnMxMiBmYWludCBjbGlwIj4nICsgZXNjKHgubm90ZSkgKyAnPC9kaXY+JyA6ICcnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAg',
  'ZnMxMiI+JyArIHRoRGF0ZSh4LmJvb2tEYXRlKSArIG90aGVyWWVhclRhZyh4KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LnN0YXJ0RGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBj',
  'bGFzcz0ibm93cmFwIGZzMTIiPicgKyB0aERhdGUoeC5lbmREYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyBzdGF0dXNCYWRnZSh4LnN0YXR1cykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyh4LmNv',
  'bnRyYWN0b3IgfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIG51bSh4LmNvc3QpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgKHgubmV4dER1ZSA/IHRoRGF0ZVNo',
  'b3J0KHgubmV4dER1ZSkgKwogICAgICAgICAgICAgICAgKHguZHVlSW5EYXlzICE9IG51bGwgPyAnPGRpdiBjbGFzcz0iZmFpbnQiIHN0eWxlPSJmb250LXNpemU6MTFweCI+JyArICh4LmR1ZUluRGF5czwwID8gJ+C5gOC4peC4oiAnICsgKC14LmR1ZUluRGF5cykg',
  'KyAnIOC4p+C4seC4mScgOiAn4Lit4Li14LiBICcgKyB4LmR1ZUluRGF5cyArICcg4Lin4Lix4LiZJykgKyAnPC9kaXY+JyA6ICcnKQogICAgICAgICAgICAgIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwoKHgucGhv',
  'dG9SZWZzfHxbXSkuY29uY2F0KHguc2xpcFJlZnN8fFtdKSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48ZGl2IGNsYXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1C',
  'dWlsZGluZygnICsgYXR0cih4KSArICcpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIGRnciIgb25jbGljaz0iZGVsQnVpbGRpbmcoJyArIGpzcSh4LmlkKSArICcpIj7wn5eRPC9idXR0b24+JyAr',
  'CiAgICAgICAgICAgICc8L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6IGVtcHR5Qm94KCfguKLguLHguIfguYTguKHguYjguKHguLXguIfguLLguJnguIvguYjguK3guKHguYHguIvg',
  'uKHguJXguLbguIHguYPguJknICsgeWVhckxhYmVsLCAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZm9ybUJ1aWxkaW5nKG51bGwpIj4rIOC5gOC4nuC4tOC5iOC4oeC4h+C4suC4meC4i+C5iOC4reC4oeC4leC4tuC4gTwvYnV0dG9uPicpLAogICAg',
  'ICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSBzbSIgb25jbGljaz0iZm9ybUJ1aWxkaW5nKG51bGwpIj4rIOC5gOC4nuC4tOC5iOC4oeC4h+C4suC4meC4i+C5iOC4reC4oeC4leC4tuC4gTwvYnV0dG9uPicsIHRydWUpOwoKICAgIHJldHVybiBoZWFkICsgem9uZXMg',
  'KyBjaGFydHMgKyBsaXN0OwogIH0KfTsKCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICA3KSDguKvguYnguK3guIfguJ7guLHguIEKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5yb29tcyA9IHsKICBsb2FkOiBmdW5jdGlvbigpeyByZXR1cm4gY2FsbEFwaSgncm9vbS5saXN0JykudGhlbihmdW5jdGlvbihmbG9vcnMpeyByZXR1cm4geyBmbG9vcnM6IGZsb29ycywgeWVh',
  'cnM6IFtdIH07IH0pOyB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgZmxhdCA9IFtdOwogICAgZC5mbG9vcnMuZm9yRWFjaChmdW5jdGlvbihmKXsgZi5yb29tcy5mb3JFYWNoKGZ1bmN0aW9uKHIpeyBmbGF0LnB1c2gocik7IH0pOyB9KTsKICAgIHZh',
  'ciBvY2MgPSBmbGF0LmZpbHRlcihmdW5jdGlvbihyKXsgcmV0dXJuIHIuc3RhdHVzID09PSAn4Lih4Li14Lic4Li54LmJ4LmA4LiK4LmI4LiyJzsgfSkubGVuZ3RoOwoKICAgIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgIGtw',
  'aSgn4Lir4LmJ4Lit4LiH4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJywgZmxhdC5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsICc1IOC4iuC4seC5ieC4mScsICdhY2NlbnQnKSArCiAgICAgIGtwaSgn4Lih4Li14Lic4Li54LmJ4LmA4LiK4LmI4LiyJywgb2NjICsgJyDg',
  'uKvguYnguK3guIcnLCBwY3QoZmxhdC5sZW5ndGggPyBvY2MvZmxhdC5sZW5ndGgqMTAwIDogMCkgKyAnIOC4reC4seC4leC4o+C4suC5gOC4guC5ieC4suC4nuC4seC4gScsICdnb29kJykgKwogICAgICBrcGkoJ+C4q+C5ieC4reC4h+C4p+C5iOC4suC4hycsIGZs',
  'YXQuZmlsdGVyKGZ1bmN0aW9uKHIpeyByZXR1cm4gci5zdGF0dXMgPT09ICfguKfguYjguLLguIcnOyB9KS5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsICcnLCAnd2FybicpICsKICAgICAga3BpKCfguITguYjguLLguYDguIrguYjguLLguKPguKfguKEv4LmA4LiU',
  '4Li34Lit4LiZJywgYmFodChmbGF0LnJlZHVjZShmdW5jdGlvbihhLHIpeyByZXR1cm4gYSArIChOdW1iZXIoci5yZW50KXx8MCk7IH0sIDApKSwgJ+C4iOC4suC4geC4q+C5ieC4reC4h+C4l+C4teC5iOC4geC4o+C4reC4geC4hOC5iOC4suC5gOC4iuC5iOC4suC5',
  'hOC4p+C5iScpICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciBncmlkID0gY2FyZCgn8J+aqiDguJzguLHguIfguKvguYnguK3guIfguJ7guLHguIEnLCByb29tRmxvb3JzKGZsYXQsIGZ1bmN0aW9uKHIpewogICAgICB2YXIgY2xzID0gci5zdGF0dXMgPT09ICfguKHg',
  'uLXguJzguLnguYnguYDguIrguYjguLInID8gJ3Mtb2snIDogKHIuc3RhdHVzID09PSAn4Lin4LmI4Liy4LiHJyA/ICdzLWluZm8nIDogJ3Mtd2FybicpOwogICAgICByZXR1cm4geyBjbHM6IGNscywgc3ViOiBlc2Moci50ZW5hbnQgfHwgci5zdGF0dXMgfHwgJycp',
  'ICsgKHIucmVudCA/ICc8YnI+JyArIG1vbmV5KHIucmVudCkgKyAnIOC4vycgOiAnJyksCiAgICAgICAgICAgICAgIG9uY2xpY2s6ICdvcGVuUm9vbSgnICsganNxKHIucm9vbSkgKyAnKScgfTsKICAgIH0pLCAnPHNwYW4gY2xhc3M9ImZzMTIgbXV0ZWQiPuC4hOC4',
  'peC4tOC4geC4l+C4teC5iOC4q+C5ieC4reC4h+C5gOC4nuC4t+C5iOC4reC4lOC4ueC4m+C4o+C4sOC4p+C4seC4leC4tOC4l+C4seC5ieC4h+C4q+C4oeC4lOC4guC4reC4h+C4q+C5ieC4reC4h+C4meC4seC5ieC4mTwvc3Bhbj4nKTsKCiAgICByZXR1cm4gaGVh',
  'ZCArIGdyaWQ7CiAgfQp9OwoKZnVuY3Rpb24gb3BlblJvb20ocm9vbSl7CiAgb3Blbk1vZGFsKCfwn5qqIOC4q+C5ieC4reC4hyAnICsgcm9vbSwgJzxkaXYgY2xhc3M9ImVtcHR5Ij48c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDguIHguLPguKXguLHguIfguYLg',
  'uKvguKXguJTigKY8L2Rpdj4nKTsKICBjYWxsQXBpKCdyb29tLnByb2ZpbGUnLCB7IHJvb206IHJvb20gfSkudGhlbihmdW5jdGlvbihwKXsKICAgIHZhciBpID0gcC5pbmZvOwogICAgdmFyIGJvZHkgPQogICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4n',
  'ICsKICAgICAgICBrcGkoJ+C4quC4luC4suC4meC4sCcsIGkuc3RhdHVzIHx8ICfigJMnLCBlc2MoaS50ZW5hbnQgfHwgJycpKSArCiAgICAgICAga3BpKCfguKXguYnguLLguIfguYHguK3guKPguYwnLCBwLmFjQ291bnQgKyAnIOC4hOC4o+C4seC5ieC4hycsIHAu',
  'bGFzdEFjID8gJ+C4peC5iOC4suC4quC4uOC4lCAnICsgdGhEYXRlKHAubGFzdEFjKSA6ICfguYTguKHguYjguKHguLXguJvguKPguLDguKfguLHguJXguLQnKSArCiAgICAgICAga3BpKCfguIfguLLguJnguIvguYjguK3guKEnLCBwLnJlcGFpckNvdW50ICsgJyDg',
  'uIfguLLguJknLCAn4LiE4LmJ4Liy4LiHICcgKyBwLm9wZW5SZXBhaXJzLCBwLm9wZW5SZXBhaXJzID8gJ3dhcm4nIDogJycpICsKICAgICAgICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC4quC4sOC4quC4oScsIGJhaHQocC50b3RhbENvc3Qp',
  'LCAn4LiL4LmI4Lit4LihICsg4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJykgKwogICAgICAnPC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJyb3cgbWIxMiI+JyArCiAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz1cJ2Nsb3NlTW9kYWwo',
  'KTtmb3JtUm9vbSgnICsgYXR0cihpKSArICcpXCc+4pyP77iPIOC5geC4geC5ieC5hOC4guC4guC5ieC4reC4oeC4ueC4peC4q+C5ieC4reC4hzwvYnV0dG9uPicgKwogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtm',
  'b3JtUmVwYWlyKHtyb29tOicgKyBqc3Eocm9vbSkgKyAnfSkiPisg4LmB4LiI4LmJ4LiH4LiL4LmI4Lit4LihPC9idXR0b24+JyArCiAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iY2xvc2VNb2RhbCgpO2Zvcm1BYyh7cm9vbTonICsganNx',
  'KHJvb20pICsgJ30pIj4rIOC4peC5ieC4suC4h+C5geC4reC4o+C5jDwvYnV0dG9uPicgKwogICAgICAnPC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJjYXJkIG1iMTIiPjxkaXYgY2xhc3M9ImNhcmQtaCI+PGgzPuC4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4',
  'meC5g+C4meC4q+C5ieC4reC4hzwvaDM+JyArCiAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz1cJ2Nsb3NlTW9kYWwoKTtmb3JtQXNzZXQoe3Jvb206JyArIGpzcShyb29tKSArICd9KVwnPisg4LmA4Lie4Li04LmI4Lih4LiX4Lij4Lix4Lie',
  '4Lii4LmM4Liq4Li04LiZPC9idXR0b24+JyArCiAgICAgICc8L2Rpdj48ZGl2IGNsYXNzPSJjYXJkLWIiPicgKwogICAgICAgIChwLmFzc2V0cy5sZW5ndGgKICAgICAgICAgID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiIHN0eWxlPSJtaW4td2lk',
  'dGg6YXV0byI+PHRoZWFkPjx0cj4nICsKICAgICAgICAgICAgJzx0aD7guJfguKPguLHguJ7guKLguYzguKrguLTguJk8L3RoPjx0aD7guKLguLXguYjguKvguYnguK0v4Lij4Li44LmI4LiZPC90aD48dGg+4LiV4Li04LiU4LiV4Lix4LmJ4LiHPC90aD48dGg+4Lib',
  '4Lij4Liw4LiB4Lix4LiZ4LiW4Li24LiHPC90aD48dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgICAgICBwLmFzc2V0cy5tYXAoZnVuY3Rpb24oYSl7CiAgICAgICAgICAgICAgcmV0dXJuICc8dHI+',
  'PHRkPjxiPicgKyBlc2MoYS5uYW1lKSArICc8L2I+JyArCiAgICAgICAgICAgICAgICAgICAgICAgKGEuc2VyaWFsID8gJzxicj48c3BhbiBjbGFzcz0iZnMxMiBtdXRlZCI+Uy9OICcgKyBlc2MoYS5zZXJpYWwpICsgJzwvc3Bhbj4nIDogJycpICsgJzwvdGQ+JyAr',
  'CiAgICAgICAgICAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MoYS5icmFuZHx8J+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyB0aERhdGUoYS5pbnN0YWxsRGF0ZSkgKyAnPC90ZD4n',
  'ICsKICAgICAgICAgICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIChhLndhcnJhbnR5RW5kID8gdGhEYXRlKGEud2FycmFudHlFbmQpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICAgICAgICAgICc8dGQ+JyArIHN0YXR1c0JhZGdlKGEu',
  'c3RhdHVzKSArICc8L3RkPicgKwogICAgICAgICAgICAgICAgICAgICAnPHRkIGNsYXNzPSJ0LWFjdGlvbnMiPjxidXR0b24gY2xhc3M9ImJ0biBpY29uIHNtIiB0aXRsZT0i4LmB4LiB4LmJ4LmE4LiCIiAnICsKICAgICAgICAgICAgICAgICAgICAgICAnb25jbGlj',
  'az1cJ2Nsb3NlTW9kYWwoKTtmb3JtQXNzZXQoJyArIGF0dHIoYSkgKyAnKVwnPuKcj++4jzwvYnV0dG9uPjwvdGQ+PC90cj4nOwogICAgICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICAgICAgOiAnPGRpdiBjbGFzcz0i',
  'ZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5iOC5hOC4lOC5ieC4muC4seC4meC4l+C4tuC4geC4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4meC4guC4reC4h+C4q+C5ieC4reC4h+C4meC4teC5iTwvZGl2PicpICsKICAgICAgJzwvZGl2PjwvZGl2PicgKwogICAgICAn',
  'PGgzIGNsYXNzPSJmczEzIG1iOCI+4Lib4Lij4Liw4Lin4Lix4LiV4Li04LiX4Lix4LmJ4LiH4Lir4Lih4LiUICgnICsgcC50aW1lbGluZS5sZW5ndGggKyAnKTwvaDM+JyArCiAgICAgIChwLnRpbWVsaW5lLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0bCI+JyArIHAu',
  'dGltZWxpbmUubWFwKGZ1bmN0aW9uKGUpewogICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0idGwtaSI+PGRpdiBjbGFzcz0iZCI+JyArIHRoRGF0ZShlLmRhdGUpICsgJyDCtyAnICsgZXNjKGUudHlwZSkgKyAnICcgKyBzdGF0dXNCYWRnZShlLnN0YXR1cykgKyAn',
  'PC9kaXY+JyArCiAgICAgICAgICAnPGRpdiBjbGFzcz0idCI+JyArIGVzYyhlLnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgICAgIChlLnRvZG8gJiYgZS50b2RvLmxlbmd0aCA/IHRvZG9MaXN0SHRtbChlKSA6ICcnKSArCiAgICAgICAgICAoZS5kZXRhaWwgPyAn',
  'PGRpdiBjbGFzcz0iZnMxMiBtdXRlZCI+JyArIGVzYyhlLmRldGFpbCkgKyAnPC9kaXY+JyA6ICcnKSArCiAgICAgICAgICAoZS5jb3N0ID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQiPicgKyBiYWh0KGUuY29zdCkgKyAnPC9kaXY+JyA6ICcnKSArCiAgICAgICAg',
  'ICAoZS5waG90b3MgJiYgZS5waG90b3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9Im10OCI+JyArIHRodW1ic0h0bWwoZS5waG90b3MpICsgJzwvZGl2PicgOiAnJykgKwogICAgICAgICc8L2Rpdj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nIDogJzxkaXYg',
  'Y2xhc3M9ImVtcHR5Ij7guKLguLHguIfguYTguKHguYjguKHguLXguJvguKPguLDguKfguLHguJXguLQ8L2Rpdj4nKTsKCiAgICBvcGVuTW9kYWwoJ/Cfmqog4Lir4LmJ4Lit4LiHICcgKyByb29tICsgJyDCtyDguIrguLHguYnguJkgJyArIChpLmZsb29yfHwnJyks',
  'IGJvZHksCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lib4Li04LiUPC9idXR0b24+JywgdHJ1ZSk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwgJ2VycicpOyBjbG9zZU1vZGFsKCk7',
  'IH0pOwp9CgoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDgpIOC4o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKLguKvguK0gKOC4o+C4suC4ouC5gOC4lOC4t+C4reC4',
  'mSkKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguIHguKPguLLguJ8g',
  '4oCUIOC4p+C4suC4lOC5gOC4m+C5h+C4mSBTVkcg4LiV4Lij4LiHIOC5hiDguYTguKHguYjguJ7guLbguYjguIfguYTguKXguJrguKPguLLguKPguLXguILguYnguLLguIfguJnguK3guIEKICAg4LmA4Lie4Lij4Liy4Liw4Lir4LiZ4LmJ4Liy4LmA4Lin4LmH4Lia',
  '4LiC4Lit4LiHIEFwcHMgU2NyaXB0IOC5guC4q+C4peC4lOC4quC4hOC4o+C4tOC4m+C4leC5jOC4guC5ieC4suC4oeC5guC4lOC5gOC4oeC4meC5hOC4oeC5iOC5hOC4lOC5iQogICDguYHguKXguLDguKvguJnguYnguLLguJXguLHguKfguK3guKLguYjguLLguIfg',
  'uJXguYnguK3guIfguYDguJvguLTguJTguYTguJTguYnguYLguJTguKLguYTguKHguYjguJXguYnguK3guIfguJXguYjguK3guYDguJnguYfguJUKCiAgIOC4quC4teC4l+C4teC5iOC5g+C4iuC5ieC5gOC4m+C5h+C4meC4meC5ieC4s+C5gOC4h+C4tOC4mS/guKrg',
  'uYnguKEg4LmE4Lih4LmI4LmD4LiK4LmI4LmA4LiC4Li14Lii4LinL+C5geC4lOC4hyDguYDguJ7guKPguLLguLDguKfguLHguJTguYHguKXguYnguKfguYDguILguLXguKLguKfguIHguLHguJrguYHguJTguIcKICAg4LiE4LiZ4LiV4Liy4Lia4Lit4LiU4Liq4Li1',
  '4LmA4LiC4Li14Lii4LinLeC5geC4lOC4h+C5geC4ouC4geC5hOC4oeC5iOC4reC4reC4gSAozpRFIDQuOSDguJXguYjguLPguIHguKfguYjguLLguYDguIHguJPguJHguYwgNikg4LiE4Li54LmI4LiZ4Li14LmJ4LmE4LiU4LmJIDI3LjYKICAg4LiX4Li44LiB4LiV',
  '4Lix4Lin4LmA4Lil4LiC4LiX4Li14LmI4LiB4Lij4Liy4Lif4LmB4Liq4LiU4LiHIOC4reC5iOC4suC4meC5hOC4lOC5ieC4iOC4suC4geC4leC4suC4o+C4suC4h+C4guC5ieC4suC4h+C4peC5iOC4suC4h+C5gOC4quC4oeC4rQogICDguIHguKXguYjguK3guIfg',
  'uJrguK3guIHguITguYjguLLguJXguK3guJnguIrguLXguYnguYDguJvguYfguJnguILguK3guIfguYHguJbguKEg4LmE4Lih4LmI4LmD4LiK4LmI4LiX4Liy4LiH4LmA4LiU4Li14Lii4Lin4LiX4Li14LmI4LiI4Liw4Lij4Li54LmJ4LiE4LmI4LiyCiAgID09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKdmFyIENIQVJUX1cgPSA3MjAsIENIQVJUX1BBREwgPSA2MiwgQ0hBUlRfUEFEUiA9IDE0LCBDSEFSVF9QQURUID0gMTQ7CnZhciBDSEFSVF9PTiA9IG51bGw7',
  'CgovKiog4Lib4Lix4LiU4LiC4Li24LmJ4LiZ4LmA4Lib4LmH4LiZ4LmA4Lil4LiC4LiB4Lil4LihIOC5hiDguKrguLPguKvguKPguLHguJrguKvguLHguKfguYHguIHguJkgWSAqLwpmdW5jdGlvbiBuaWNlTWF4KHYpewogIGlmICh2IDw9IDApIHJldHVybiAxOwog',
  'IHZhciBtYWcgPSBNYXRoLnBvdygxMCwgTWF0aC5mbG9vcihNYXRoLmxvZyh2KSAvIE1hdGguTE4xMCkpOwogIHZhciBuID0gdiAvIG1hZzsKICB2YXIgc3RlcCA9IG4gPD0gMSA/IDEgOiBuIDw9IDIgPyAyIDogbiA8PSAyLjUgPyAyLjUgOiBuIDw9IDUgPyA1IDog',
  'MTA7CiAgcmV0dXJuIHN0ZXAgKiBtYWc7Cn0KCi8qKiDguKLguYjguK3guIjguLPguJnguKfguJnguYDguIfguLTguJnguYPguKvguYnguKrguLHguYnguJnguJ7guK3guKrguLPguKvguKPguLHguJrguKvguLHguKfguYHguIHguJkg4oCUIDEuMiDguKUuIC8gODVL',
  'ICovCmZ1bmN0aW9uIHNob3J0QmFodCh2KXsKICB2YXIgYSA9IE1hdGguYWJzKHYpOwogIGlmIChhID49IDEwMDAwMDApIHJldHVybiAodiAvIDEwMDAwMDApLnRvRml4ZWQoYSA+PSAxMDAwMDAwMCA/IDAgOiAxKS5yZXBsYWNlKC9cLjAkLywgJycpICsgJyDguKUu',
  'JzsKICBpZiAoYSA+PSAxMDAwKSByZXR1cm4gTWF0aC5yb3VuZCh2IC8gMTAwMCkgKyAnSyc7CiAgcmV0dXJuIFN0cmluZyhNYXRoLnJvdW5kKHYpKTsKfQoKLyoqIOC5geC4l+C5iOC4h+C4l+C4teC5iOC4m+C4peC4suC4ouC4lOC5ieC4suC4meC4guC5ieC4reC4',
  'oeC4ueC4peC4oeC4mSA0cHgg4LiU4LmJ4Liy4LiZ4LiQ4Liy4LiZ4LmA4Lir4Lil4Li14LmI4Lii4LihICovCmZ1bmN0aW9uIGJhclBhdGgoeCwgeSwgdywgaCwgdXApewogIHZhciByID0gTWF0aC5taW4oNCwgdyAvIDIsIGgpOwogIGlmIChoIDw9IDAuNSkgcmV0',
  'dXJuICcnOwogIHJldHVybiB1cAogICAgPyAnTScgKyB4ICsgJywnICsgKHkgKyBoKSArICdWJyArICh5ICsgcikgKyAnYScgKyByICsgJywnICsgciArICcgMCAwIDEgJyArIHIgKyAnLC0nICsgciArCiAgICAgICdoJyArICh3IC0gMiAqIHIpICsgJ2EnICsgciAr',
  'ICcsJyArIHIgKyAnIDAgMCAxICcgKyByICsgJywnICsgciArICdWJyArICh5ICsgaCkgKyAnWicKICAgIDogJ00nICsgeCArICcsJyArIHkgKyAnVicgKyAoeSArIGggLSByKSArICdhJyArIHIgKyAnLCcgKyByICsgJyAwIDAgMCAnICsgciArICcsJyArIHIgKwog',
  'ICAgICAnaCcgKyAodyAtIDIgKiByKSArICdhJyArIHIgKyAnLCcgKyByICsgJyAwIDAgMCAnICsgciArICcsLScgKyByICsgJ1YnICsgeSArICdaJzsKfQoKLyoqIOC4guC5ieC4reC4oeC4ueC4peC4guC4reC4h+C4geC4peC5iOC4reC4h+C4muC4reC4geC4hOC5',
  'iOC4siDguYDguIHguYfguJrguYDguJvguYfguJkgSlNPTiDguYPguJkgYXR0cmlidXRlIOC5geC4peC5ieC4pyBlc2MoKSDguYPguKvguYnguJvguKXguK3guJTguKDguLHguKIgKi8KZnVuY3Rpb24gdGlwRGF0YShsYWJlbCwgcm93cyl7CiAgcmV0dXJuIGVzYyhK',
  'U09OLnN0cmluZ2lmeSh7IGw6IGxhYmVsLCByOiByb3dzIH0pKTsKfQoKZnVuY3Rpb24gaGl0UmVjdCh4LCB5LCB3LCBoLCB0aXApewogIHJldHVybiAnPHJlY3QgY2xhc3M9ImhpdCIgdGFiaW5kZXg9IjAiIHJvbGU9ImJ1dHRvbiIgeD0iJyArIHggKyAnIiB5PSIn',
  'ICsgeSArCiAgICAgICAgICciIHdpZHRoPSInICsgdyArICciIGhlaWdodD0iJyArIGggKyAnIiBkYXRhLXRpcD0iJyArIHRpcCArICciPjwvcmVjdD4nOwp9CgpmdW5jdGlvbiBncmlkQW5kVGlja3ModG9wLCBwbG90SCwgbWF4LCBsaW5lcyl7CiAgdmFyIG91dCA9',
  'ICcnOwogIGZvciAodmFyIGkgPSAwOyBpIDw9IGxpbmVzOyBpKyspIHsKICAgIHZhciB5ID0gdG9wICsgcGxvdEggLSAocGxvdEggKiBpIC8gbGluZXMpOwogICAgb3V0ICs9ICc8bGluZSBjbGFzcz0iZ3JpZC1sIiB4MT0iJyArIENIQVJUX1BBREwgKyAnIiB5MT0i',
  'JyArIHkgKyAnIiB4Mj0iJyArIChDSEFSVF9XIC0gQ0hBUlRfUEFEUikgKyAnIiB5Mj0iJyArIHkgKyAnIj48L2xpbmU+JyArCiAgICAgICAgICAgJzx0ZXh0IGNsYXNzPSJ0aWNrIiB4PSInICsgKENIQVJUX1BBREwgLSA4KSArICciIHk9IicgKyAoeSArIDQpICsg',
  'JyIgdGV4dC1hbmNob3I9ImVuZCI+JyArIHNob3J0QmFodChtYXggKiBpIC8gbGluZXMpICsgJzwvdGV4dD4nOwogIH0KICByZXR1cm4gb3V0Owp9CgpmdW5jdGlvbiBzdmdXcmFwKGJvZHksIGgsIHRpdGxlKXsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImNoYXJ0LXdy',
  'YXAiPjxzdmcgY2xhc3M9ImNoYXJ0IiB2aWV3Qm94PSIwIDAgJyArIENIQVJUX1cgKyAnICcgKyBoICsgJyIgJyArCiAgICAncm9sZT0iaW1nIiBhcmlhLWxhYmVsPSInICsgZXNjKHRpdGxlKSArICciIG9ucG9pbnRlcm1vdmU9ImNoYXJ0SG92ZXIoZXZlbnQpIiBv',
  'bnBvaW50ZXJsZWF2ZT0iY2hhcnRPdXQoKSIgJyArCiAgICAnb25mb2N1c2luPSJjaGFydEhvdmVyKGV2ZW50KSIgb25mb2N1c291dD0iY2hhcnRPdXQoKSI+JyArIGJvZHkgKyAnPC9zdmc+PC9kaXY+JzsKfQoKLyoqCiAqIOC4geC4o+C4suC4n+C5geC4l+C5iOC4',
  'h+C4hOC4ueC5iCDguKPguLLguKLguKPguLHguJogLyDguKPguLLguKLguIjguYjguLLguKIg4Lij4Liy4Lii4LmA4LiU4Li34Lit4LiZCiAqIOC4leC4tOC4lOC4m+C5ieC4suC4ouC4leC4seC4p+C5gOC4peC4guC5gOC4ieC4nuC4suC4sOC5gOC4lOC4t+C4reC4',
  'meC4quC4ueC4h+C4quC4uOC4lOC4guC4reC4h+C5geC4leC5iOC4peC4sOC4neC4seC5iOC4hyDguYTguKHguYjguJXguLTguJTguJfguLjguIHguYHguJfguYjguIcKICog4LmA4Lie4Lij4Liy4Liw4LiV4Li04LiU4LiE4Lij4Lia4LiX4Li44LiB4LmB4LiX4LmI',
  '4LiH4LmB4Lil4LmJ4Lin4Lij4LiB4LiI4LiZ4LmE4Lih4LmI4Lih4Li14LmD4LiE4Lij4Lit4LmI4Liy4LiZCiAqLwpmdW5jdGlvbiBjaGFydEluY29tZUV4cGVuc2Uocm93cyl7CiAgdmFyIHBsb3RIID0gMTkwLCB0b3AgPSBDSEFSVF9QQURULCBIID0gdG9wICsg',
  'cGxvdEggKyAzMDsKICB2YXIgbWF4ID0gbmljZU1heChNYXRoLm1heC5hcHBseShudWxsLCByb3dzLm1hcChmdW5jdGlvbihtKXsgcmV0dXJuIE1hdGgubWF4KG0uaW5jb21lLCBtLmV4cGVuc2UpOyB9KSkgfHwgMSk7CiAgdmFyIGJhbmQgPSAoQ0hBUlRfVyAtIENI',
  'QVJUX1BBREwgLSBDSEFSVF9QQURSKSAvIHJvd3MubGVuZ3RoOwogIHZhciBidyA9IE1hdGgubWluKDI0LCAoYmFuZCAtIDEwKSAvIDIpOwoKICB2YXIgbWF4SW4gPSByb3dzLnJlZHVjZShmdW5jdGlvbihhLCBiKXsgcmV0dXJuIGIuaW5jb21lID4gYS5pbmNvbWUg',
  'PyBiIDogYTsgfSwgcm93c1swXSk7CiAgdmFyIG1heEV4ID0gcm93cy5yZWR1Y2UoZnVuY3Rpb24oYSwgYil7IHJldHVybiBiLmV4cGVuc2UgPiBhLmV4cGVuc2UgPyBiIDogYTsgfSwgcm93c1swXSk7CgogIHZhciBib2R5ID0gZ3JpZEFuZFRpY2tzKHRvcCwgcGxv',
  'dEgsIG1heCwgNCk7CiAgcm93cy5mb3JFYWNoKGZ1bmN0aW9uKG0sIGkpewogICAgdmFyIGN4ID0gQ0hBUlRfUEFETCArIGJhbmQgKiBpICsgYmFuZCAvIDI7CiAgICAvLyDguYDguKfguYnguJnguIrguYjguK3guIfguKfguYjguLLguIfguKrguLXguJ7guLfguYng',
  'uJkgMnB4IOC4o+C4sOC4q+C4p+C5iOC4suC4h+C5geC4l+C5iOC4h+C4hOC4ueC5iCDguYTguKHguYjguYPguIrguYnguYDguKrguYnguJnguILguK3guJrguKHguLLguITguLHguYjguJkKICAgIHZhciB4MSA9IGN4IC0gYncgLSAxLCB4MiA9IGN4ICsgMTsKICAg',
  'IHZhciBoMSA9IHBsb3RIICogKG0uaW5jb21lIC8gbWF4KSwgaDIgPSBwbG90SCAqIChtLmV4cGVuc2UgLyBtYXgpOwogICAgYm9keSArPSAnPGc+JyArCiAgICAgICc8cmVjdCBjbGFzcz0iYmFuZCIgeD0iJyArIChjeCAtIGJhbmQgLyAyKSArICciIHk9IicgKyB0',
  'b3AgKyAnIiB3aWR0aD0iJyArIGJhbmQgKyAnIiBoZWlnaHQ9IicgKyBwbG90SCArICciIHJ4PSI2Ij48L3JlY3Q+JyArCiAgICAgICc8cGF0aCBjbGFzcz0iYzEiIGQ9IicgKyBiYXJQYXRoKHgxLCB0b3AgKyBwbG90SCAtIGgxLCBidywgaDEsIHRydWUpICsgJyI+',
  'PC9wYXRoPicgKwogICAgICAnPHBhdGggY2xhc3M9ImMyIiBkPSInICsgYmFyUGF0aCh4MiwgdG9wICsgcGxvdEggLSBoMiwgYncsIGgyLCB0cnVlKSArICciPjwvcGF0aD4nOwogICAgaWYgKG0gPT09IG1heEluICYmIG0uaW5jb21lKSB7CiAgICAgIGJvZHkgKz0g',
  'Jzx0ZXh0IGNsYXNzPSJkbGFiIiB4PSInICsgKHgxICsgYncgLyAyKSArICciIHk9IicgKyAodG9wICsgcGxvdEggLSBoMSAtIDYpICsgJyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+JyArIHNob3J0QmFodChtLmluY29tZSkgKyAnPC90ZXh0Pic7CiAgICB9CiAgICBp',
  'ZiAobSA9PT0gbWF4RXggJiYgbS5leHBlbnNlKSB7CiAgICAgIGJvZHkgKz0gJzx0ZXh0IGNsYXNzPSJkbGFiIiB4PSInICsgKHgyICsgYncgLyAyKSArICciIHk9IicgKyAodG9wICsgcGxvdEggLSBoMiAtIDYpICsgJyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+JyAr',
  'IHNob3J0QmFodChtLmV4cGVuc2UpICsgJzwvdGV4dD4nOwogICAgfQogICAgYm9keSArPSAnPHRleHQgY2xhc3M9InhsYWIiIHg9IicgKyBjeCArICciIHk9IicgKyAodG9wICsgcGxvdEggKyAxOCkgKyAnIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj4nICsgZXNjKG0u',
  'bGFiZWwpICsgJzwvdGV4dD4nICsKICAgICAgaGl0UmVjdChjeCAtIGJhbmQgLyAyLCB0b3AsIGJhbmQsIHBsb3RILAogICAgICAgIHRpcERhdGEobS5sYWJlbCwgW1sn4Lij4Liy4Lii4Lij4Lix4LiaJywgbW9uZXkobS5pbmNvbWUpLCAxXSwgWyfguKPguLLguKLg',
  'uIjguYjguLLguKInLCBtb25leShtLmV4cGVuc2UpLCAyXV0pKSArCiAgICAgICc8L2c+JzsKICB9KTsKCiAgYm9keSArPSAnPGxpbmUgY2xhc3M9ImF4aXMtbCIgeDE9IicgKyBDSEFSVF9QQURMICsgJyIgeTE9IicgKyAodG9wICsgcGxvdEgpICsgJyIgeDI9Iicg',
  'KyAoQ0hBUlRfVyAtIENIQVJUX1BBRFIpICsgJyIgeTI9IicgKyAodG9wICsgcGxvdEgpICsgJyI+PC9saW5lPic7CiAgcmV0dXJuIHN2Z1dyYXAoYm9keSwgSCwgJ+C4geC4o+C4suC4n+C5geC4l+C5iOC4h+C5gOC4m+C4o+C4teC4ouC4muC5gOC4l+C4teC4ouC4',
  'muC4o+C4suC4ouC4o+C4seC4muC4geC4seC4muC4o+C4suC4ouC4iOC5iOC4suC4ouC4guC4reC4h+C5geC4leC5iOC4peC4sOC5gOC4lOC4t+C4reC4mScpOwp9CgovKioKICog4LiB4Liz4LmE4LijL+C4guC4suC4lOC4l+C4uOC4meC4quC4uOC4l+C4mOC4tOC4',
  'o+C4suC4ouC5gOC4lOC4t+C4reC4mSDigJQg4LmB4LiX4LmI4LiH4LiC4Li24LmJ4LiZ4LiI4Liy4LiB4LmA4Liq4LmJ4LiZ4Lio4Li54LiZ4Lii4LmM4LiE4Li34Lit4LiB4Liz4LmE4LijIOC4peC4h+C4hOC4t+C4reC4guC4suC4lOC4l+C4uOC4mQogKiDguJXg',
  'uLPguYHguKvguJnguYjguIfguYDguKvguJnguLfguK0v4LmD4LiV4LmJ4LmA4Liq4LmJ4LiZ4LmA4Lib4LmH4LiZ4LiV4Lix4Lin4Lia4Lit4LiB4Lir4Lil4Lix4LiBIOC4quC4teC5gOC4m+C5h+C4meC4leC4seC4p+C4ouC5ieC4s+C4reC4teC4geC4iuC4seC5',
  'ieC4meC4q+C4meC4tuC5iOC4hwogKi8KZnVuY3Rpb24gY2hhcnROZXQocm93cyl7CiAgdmFyIHBsb3RIID0gMTcwLCB0b3AgPSBDSEFSVF9QQURULCBIID0gdG9wICsgcGxvdEggKyAzMDsKICB2YXIgbWF4ID0gbmljZU1heChNYXRoLm1heC5hcHBseShudWxsLCBy',
  'b3dzLm1hcChmdW5jdGlvbihtKXsgcmV0dXJuIE1hdGguYWJzKG0ubmV0KTsgfSkpIHx8IDEpOwogIHZhciBiYW5kID0gKENIQVJUX1cgLSBDSEFSVF9QQURMIC0gQ0hBUlRfUEFEUikgLyByb3dzLmxlbmd0aDsKICB2YXIgYncgPSBNYXRoLm1pbigyNCwgYmFuZCAt',
  'IDEyKTsKICB2YXIgemVybyA9IHRvcCArIHBsb3RIIC8gMiwgaGFsZiA9IHBsb3RIIC8gMjsKCiAgdmFyIGJlc3QgPSByb3dzLnJlZHVjZShmdW5jdGlvbihhLCBiKXsgcmV0dXJuIGIubmV0ID4gYS5uZXQgPyBiIDogYTsgfSwgcm93c1swXSk7CiAgdmFyIHdvcnN0',
  'ID0gcm93cy5yZWR1Y2UoZnVuY3Rpb24oYSwgYil7IHJldHVybiBiLm5ldCA8IGEubmV0ID8gYiA6IGE7IH0sIHJvd3NbMF0pOwoKICB2YXIgYm9keSA9ICcnOwogIFsxLCAwLjUsIDAsIC0wLjUsIC0xXS5mb3JFYWNoKGZ1bmN0aW9uKGYpewogICAgdmFyIHkgPSB6',
  'ZXJvIC0gaGFsZiAqIGY7CiAgICBib2R5ICs9ICc8bGluZSBjbGFzcz0iZ3JpZC1sIiB4MT0iJyArIENIQVJUX1BBREwgKyAnIiB5MT0iJyArIHkgKyAnIiB4Mj0iJyArIChDSEFSVF9XIC0gQ0hBUlRfUEFEUikgKyAnIiB5Mj0iJyArIHkgKyAnIj48L2xpbmU+JyAr',
  'CiAgICAgICAgICAgICc8dGV4dCBjbGFzcz0idGljayIgeD0iJyArIChDSEFSVF9QQURMIC0gOCkgKyAnIiB5PSInICsgKHkgKyA0KSArICciIHRleHQtYW5jaG9yPSJlbmQiPicgKyBzaG9ydEJhaHQobWF4ICogZikgKyAnPC90ZXh0Pic7CiAgfSk7CgogIHJvd3Mu',
  'Zm9yRWFjaChmdW5jdGlvbihtLCBpKXsKICAgIHZhciBjeCA9IENIQVJUX1BBREwgKyBiYW5kICogaSArIGJhbmQgLyAyOwogICAgdmFyIGggPSBoYWxmICogKE1hdGguYWJzKG0ubmV0KSAvIG1heCk7CiAgICB2YXIgdXAgPSBtLm5ldCA+PSAwOwogICAgYm9keSAr',
  'PSAnPGc+JyArCiAgICAgICc8cmVjdCBjbGFzcz0iYmFuZCIgeD0iJyArIChjeCAtIGJhbmQgLyAyKSArICciIHk9IicgKyB0b3AgKyAnIiB3aWR0aD0iJyArIGJhbmQgKyAnIiBoZWlnaHQ9IicgKyBwbG90SCArICciIHJ4PSI2Ij48L3JlY3Q+JyArCiAgICAgICc8',
  'cGF0aCBjbGFzcz0iJyArICh1cCA/ICdjMScgOiAnYzInKSArICciIGQ9IicgKyBiYXJQYXRoKGN4IC0gYncgLyAyLCB1cCA/IHplcm8gLSBoIDogemVybywgYncsIGgsIHVwKSArICciPjwvcGF0aD4nOwogICAgaWYgKChtID09PSBiZXN0ICYmIG0ubmV0ID4gMCkg',
  'fHwgKG0gPT09IHdvcnN0ICYmIG0ubmV0IDwgMCkpIHsKICAgICAgYm9keSArPSAnPHRleHQgY2xhc3M9ImRsYWIiIHg9IicgKyBjeCArICciIHk9IicgKyAodXAgPyB6ZXJvIC0gaCAtIDYgOiB6ZXJvICsgaCArIDE0KSArICciIHRleHQtYW5jaG9yPSJtaWRkbGUi',
  'PicgKyBzaG9ydEJhaHQobS5uZXQpICsgJzwvdGV4dD4nOwogICAgfQogICAgYm9keSArPSAnPHRleHQgY2xhc3M9InhsYWIiIHg9IicgKyBjeCArICciIHk9IicgKyAodG9wICsgcGxvdEggKyAxOCkgKyAnIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj4nICsgZXNjKG0u',
  'bGFiZWwpICsgJzwvdGV4dD4nICsKICAgICAgaGl0UmVjdChjeCAtIGJhbmQgLyAyLCB0b3AsIGJhbmQsIHBsb3RILAogICAgICAgIHRpcERhdGEobS5sYWJlbCwgW1t1cCA/ICfguIHguLPguYTguKMnIDogJ+C4guC4suC4lOC4l+C4uOC4mScsIG1vbmV5KG0ubmV0',
  'KSwgdXAgPyAxIDogMl1dKSkgKwogICAgICAnPC9nPic7CiAgfSk7CgogIGJvZHkgKz0gJzxsaW5lIGNsYXNzPSJheGlzLWwiIHgxPSInICsgQ0hBUlRfUEFETCArICciIHkxPSInICsgemVybyArICciIHgyPSInICsgKENIQVJUX1cgLSBDSEFSVF9QQURSKSArICci',
  'IHkyPSInICsgemVybyArICciPjwvbGluZT4nOwogIHJldHVybiBzdmdXcmFwKGJvZHksIEgsICfguIHguKPguLLguJ/guIHguLPguYTguKPguILguLLguJTguJfguLjguJnguKrguLjguJfguJjguLTguKPguLLguKLguYDguJTguLfguK3guJkg4LmB4LiX4LmI4LiH',
  '4LmA4Lir4LiZ4Li34Lit4LmA4Liq4LmJ4LiZ4LiE4Li34Lit4LiB4Liz4LmE4LijIOC5g+C4leC5ieC5gOC4quC5ieC4meC4hOC4t+C4reC4guC4suC4lOC4l+C4uOC4mScpOwp9CgpmdW5jdGlvbiBjaGFydFRpcEJveCgpewogIHZhciBib3ggPSBkb2N1bWVudC5n',
  'ZXRFbGVtZW50QnlJZCgnY2hhcnRUaXAnKTsKICBpZiAoIWJveCkgewogICAgYm94ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICBib3guaWQgPSAnY2hhcnRUaXAnOwogICAgYm94LmNsYXNzTmFtZSA9ICdjdGlwJzsKICAgIGRvY3VtZW50LmJv',
  'ZHkuYXBwZW5kQ2hpbGQoYm94KTsKICB9CiAgcmV0dXJuIGJveDsKfQoKZnVuY3Rpb24gY2hhcnRIb3Zlcihldil7CiAgdmFyIGhpdCA9IGV2LnRhcmdldCAmJiBldi50YXJnZXQuY2xvc2VzdCA/IGV2LnRhcmdldC5jbG9zZXN0KCcuaGl0JykgOiBudWxsOwogIGlm',
  'ICghaGl0KSB7IGNoYXJ0T3V0KCk7IHJldHVybjsgfQoKICB2YXIgZyA9IGhpdC5wYXJlbnROb2RlOwogIGlmIChDSEFSVF9PTiAmJiBDSEFSVF9PTiAhPT0gZykgQ0hBUlRfT04uY2xhc3NMaXN0LnJlbW92ZSgnb24nKTsKICBnLmNsYXNzTGlzdC5hZGQoJ29uJyk7',
  'CiAgQ0hBUlRfT04gPSBnOwoKICB2YXIgZGF0YTsKICB0cnkgeyBkYXRhID0gSlNPTi5wYXJzZShoaXQuZ2V0QXR0cmlidXRlKCdkYXRhLXRpcCcpIHx8ICd7fScpOyB9IGNhdGNoIChlKSB7IHJldHVybjsgfQoKICAvLyDguJvguKPguLDguIHguK3guJrguJTguYng',
  'uKfguKIgdGV4dENvbnRlbnQg4LmE4Lih4LmI4LmD4LiK4LmIIGlubmVySFRNTCDigJQg4LiK4Li34LmI4Lit4Lij4Liy4Lii4LiB4Liy4Lij4Lih4Liy4LiI4Liy4LiB4LiC4LmJ4Lit4Lih4Li54LilIOC5hOC4oeC5iOC4hOC4p+C4o+C4luC4t+C4reC4p+C5iOC4',
  'suC4m+C4peC4reC4lOC4oOC4seC4ogogIHZhciBib3ggPSBjaGFydFRpcEJveCgpOwogIGJveC5pbm5lckhUTUwgPSAnJzsKICB2YXIgaGVhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogIGhlYWQuY2xhc3NOYW1lID0gJ20nOwogIGhlYWQudGV4',
  'dENvbnRlbnQgPSBkYXRhLmwgfHwgJyc7CiAgYm94LmFwcGVuZENoaWxkKGhlYWQpOwoKICAoZGF0YS5yIHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uKHJvdyl7CiAgICB2YXIgbGluZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogICAgbGluZS5jbGFz',
  'c05hbWUgPSAncic7CiAgICB2YXIga2V5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaScpOwogICAga2V5LnN0eWxlLmJhY2tncm91bmQgPSAndmFyKC0tYycgKyAocm93WzJdIHx8IDEpICsgJyknOwogICAgdmFyIG5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVt',
  'ZW50KCdzcGFuJyk7CiAgICBuYW1lLnRleHRDb250ZW50ID0gcm93WzBdOwogICAgdmFyIHZhbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2InKTsKICAgIHZhbC50ZXh0Q29udGVudCA9IHJvd1sxXTsKICAgIGxpbmUuYXBwZW5kQ2hpbGQoa2V5KTsgbGluZS5h',
  'cHBlbmRDaGlsZChuYW1lKTsgbGluZS5hcHBlbmRDaGlsZCh2YWwpOwogICAgYm94LmFwcGVuZENoaWxkKGxpbmUpOwogIH0pOwoKICAvLyDguYDguIHguLLguLDguJXguLPguYHguKvguJnguYjguIfguYDguKHguLLguKrguYwg4LmE4Lih4LmI4LmD4LiK4LmI4LiC',
  '4Lit4Lia4Lia4LiZ4LiC4Lit4LiH4LiK4LmI4Lit4LiH4Lij4Lix4Lia4LiB4Liy4Lij4LiK4Li14LmJICjguIrguYjguK3guIfguJnguLHguYnguJnguKrguLnguIfguYDguJfguYjguLLguIHguKPguLLguJ/guJfguLHguYnguIfguK3guLHguJkKICAvLyDguKfg',
  'uLLguIfguYTguKfguYnguILguYnguLLguIfguJrguJnguJfguLXguYTguKPguIHguYfguYTguJvguJrguLHguIfguKvguLHguKfguILguYnguK3guIHguLLguKPguYzguJTguJfguLjguIHguJfguLUpIOC4luC5ieC4suC5gOC4peC4t+C5iOC4reC4meC4lOC5ieC4',
  'p+C4ouC5geC4m+C5ieC4meC4nuC4tOC4oeC4nuC5jOC4geC5h+C5g+C4iuC5ieC4leC4seC4p+C5geC4l+C5iOC4h+C5geC4l+C4mQogIHZhciByID0gaGl0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpOwogIHZhciBweCA9IChldi5jbGllbnRYIHx8IGV2LmNsaWVu',
  'dFggPT09IDApID8gZXYuY2xpZW50WCA6IHIubGVmdCArIHIud2lkdGggLyAyOwogIHZhciBweSA9IChldi5jbGllbnRZIHx8IGV2LmNsaWVudFkgPT09IDApID8gZXYuY2xpZW50WSA6IHIudG9wICsgci5oZWlnaHQgLyAyOwogIGJveC5jbGFzc0xpc3QuYWRkKCdv',
  'bicpOwogIHZhciBsZWZ0ID0gTWF0aC5taW4oTWF0aC5tYXgoOCwgcHggLSBib3gub2Zmc2V0V2lkdGggLyAyKSwgd2luZG93LmlubmVyV2lkdGggLSBib3gub2Zmc2V0V2lkdGggLSA4KTsKICB2YXIgYWJvdmUgPSBweSAtIGJveC5vZmZzZXRIZWlnaHQgLSAxNDsK',
  'ICBib3guc3R5bGUubGVmdCA9IGxlZnQgKyAncHgnOwogIGJveC5zdHlsZS50b3AgPSAoYWJvdmUgPCA4ID8gcHkgKyAxOCA6IGFib3ZlKSArICdweCc7Cn0KCmZ1bmN0aW9uIGNoYXJ0T3V0KCl7CiAgaWYgKENIQVJUX09OKSB7IENIQVJUX09OLmNsYXNzTGlzdC5y',
  'ZW1vdmUoJ29uJyk7IENIQVJUX09OID0gbnVsbDsgfQogIHZhciBib3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2hhcnRUaXAnKTsKICBpZiAoYm94KSBib3guY2xhc3NMaXN0LnJlbW92ZSgnb24nKTsKfQoKZnVuY3Rpb24gY2hhcnRMZWdlbmQoYSwgYil7',
  'CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJsZWdlbmQiPicgKwogICAgJzxzcGFuIGNsYXNzPSJrIj48c3BhbiBjbGFzcz0ic3ciIHN0eWxlPSJiYWNrZ3JvdW5kOnZhcigtLWMxKSI+PC9zcGFuPicgKyBlc2MoYSkgKyAnPC9zcGFuPicgKwogICAgJzxzcGFuIGNsYXNz',
  'PSJrIj48c3BhbiBjbGFzcz0ic3ciIHN0eWxlPSJiYWNrZ3JvdW5kOnZhcigtLWMyKSI+PC9zcGFuPicgKyBlc2MoYikgKyAnPC9zcGFuPicgKwogICAgJzwvZGl2Pic7Cn0KClJPVVRFUy5maW5hbmNlID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7CiAgICByZXR1cm4g',
  'UHJvbWlzZS5hbGwoWwogICAgICBjYWxsQXBpKCdmaW5hbmNlLnN1bW1hcnknLCB7IHllYXI6IFMueWVhciB9KSwKICAgICAgY2FsbEFwaSgnZmluYW5jZS5saXN0JywgeyB5ZWFyOiBTLnllYXIsIGtpbmQ6IFMucGFyYW1zLmtpbmQgfHwgJycgfSkKICAgIF0pLnRo',
  'ZW4oZnVuY3Rpb24ocil7IHZhciBkID0gclswXTsgZC5pdGVtcyA9IHJbMV07IHJldHVybiBkOyB9KTsKICB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgeWVhckxhYmVsID0gUy55ZWFyID09PSAnYWxsJyA/ICfguJfguLjguIHguJvguLUnIDogJ+C4',
  'm+C4tSAnICsgUy55ZWFyOwogICAgdmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAga3BpKCfguKPguLLguKLguKPguLHguJogJyArIHllYXJMYWJlbCwgYmFodChkLmluY29tZSksICfguYDguInguKXguLXguYjguKIgJyArIGJh',
  'aHQoZC5hdmdJbmNvbWUpICsgJy/guYDguJTguLfguK3guJknLCAnZ29vZCcpICsKICAgICAga3BpKCfguKPguLLguKLguIjguYjguLLguKIgJyArIHllYXJMYWJlbCwgYmFodChkLmV4cGVuc2UpLCAn4LmA4LiJ4Lil4Li14LmI4LiiICcgKyBiYWh0KGQuYXZnRXhw',
  'ZW5zZSkgKyAnL+C5gOC4lOC4t+C4reC4mScsICdiYWQnKSArCiAgICAgIGtwaSgn4LiE4LiH4LmA4Lir4Lil4Li34Lit4Liq4Li44LiX4LiY4Li0JywgYmFodChkLm5ldCksICfguK3guLHguJXguKPguLLguIHguLPguYTguKMgJyArIHBjdChkLm1hcmdpbiksICdh',
  'Y2NlbnQgJyArIChkLm5ldCA+PSAwID8gJ2dvb2QnIDogJ2JhZCcpKSArCiAgICAgIGtwaSgn4Lia4Lix4LiZ4LiX4Li24LiB4LmB4Lil4LmJ4LinJywgZC5tb250aHNXaXRoRGF0YSArICcg4LmA4LiU4Li34Lit4LiZJywgZC5jb3VudCArICcg4Lij4Liy4Lii4LiB',
  '4Liy4LijJykgKwogICAgJzwvZGl2Pic7CgogICAgLy8g4LiB4Lij4Liy4Lif4LiB4LmI4Lit4LiZIOC5geC4peC5ieC4p+C4hOC5iOC4reC4ouC4leC4suC4o+C4suC4hyDigJQg4LiV4Liy4Lij4Liy4LiH4LiC4LmJ4Liy4LiH4Lil4LmI4Liy4LiH4LiE4Li34Lit',
  '4LiX4Li14LmI4Lit4LmI4Liy4LiZ4LiE4LmI4Liy4LiI4Lij4Li04LiH4LmE4LiU4LmJ4LiX4Li44LiB4LiV4Lix4LinCiAgICAvLyDguIHguKPguLLguJ/guIrguYjguKfguKLguYPguKvguYnguYDguKvguYfguJnguYHguJnguKfguYLguJnguYnguKEg4LmE4Lih',
  '4LmI4LmE4LiU4LmJ4Lih4Liy4LmB4LiX4LiZ4LiV4Lix4Lin4LmA4Lil4LiCCiAgICB2YXIgaGFzRGF0YSA9IGQuYnlNb250aC5zb21lKGZ1bmN0aW9uKG0peyByZXR1cm4gbS5pbmNvbWUgfHwgbS5leHBlbnNlOyB9KTsKICAgIHZhciBjaGFydHMgPSAhaGFzRGF0',
  'YSA/ICcnIDoKICAgICAgY2FyZCgn8J+TiCDguKPguLLguKLguKPguLHguJogLyDguKPguLLguKLguIjguYjguLLguKIg4Lij4Liy4Lii4LmA4LiU4Li34Lit4LiZIMK3ICcgKyB5ZWFyTGFiZWwsCiAgICAgICAgY2hhcnRMZWdlbmQoJ+C4o+C4suC4ouC4o+C4seC4',
  'micsICfguKPguLLguKLguIjguYjguLLguKInKSArIGNoYXJ0SW5jb21lRXhwZW5zZShkLmJ5TW9udGgpKSArCiAgICAgIGNhcmQoJ+Kalu+4jyDguIHguLPguYTguKMgLyDguILguLLguJTguJfguLjguJnguKrguLjguJfguJjguLQg4Lij4Liy4Lii4LmA4LiU4Li3',
  '4Lit4LiZIMK3ICcgKyB5ZWFyTGFiZWwsCiAgICAgICAgJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbWI4Ij7guYHguJfguYjguIfguYDguKvguJnguLfguK3guYDguKrguYnguJnguKjguLnguJnguKLguYzguITguLfguK3guYDguJTguLfguK3guJnguJfguLXguYjg',
  'uIHguLPguYTguKMg4LmD4LiV4LmJ4LmA4Liq4LmJ4LiZ4LiE4Li34Lit4LmA4LiU4Li34Lit4LiZ4LiX4Li14LmI4LiC4Liy4LiU4LiX4Li44LiZPC9kaXY+JyArCiAgICAgICAgY2hhcnROZXQoZC5ieU1vbnRoKSk7CgogICAgdmFyIG1heEJhciA9IE1hdGgubWF4',
  'LmFwcGx5KG51bGwsIGQuYnlNb250aC5tYXAoZnVuY3Rpb24obSl7IHJldHVybiBNYXRoLm1heChtLmluY29tZSwgbS5leHBlbnNlKTsgfSkpIHx8IDE7CiAgICB2YXIgbW9udGhseSA9IGNhcmQoJ/Cfk4Ug4Lij4Liy4Lii4LmA4LiU4Li34Lit4LiZIMK3ICcgKyB5',
  'ZWFyTGFiZWwsCiAgICAgICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0Ij48dGhlYWQ+PHRyPicgKwogICAgICAnPHRoPuC5gOC4lOC4t+C4reC4mTwvdGg+PHRoIGNsYXNzPSJudW0iPuC4o+C4suC4ouC4o+C4seC4mjwvdGg+PHRoIGNsYXNzPSJudW0i',
  'PuC4o+C4suC4ouC4iOC5iOC4suC4ojwvdGg+PHRoIGNsYXNzPSJudW0iPuC4hOC4h+C5gOC4q+C4peC4t+C4rTwvdGg+JyArCiAgICAgICc8dGggc3R5bGU9IndpZHRoOjM4JSI+4LmA4LiX4Li14Lii4Lia4Lij4Liy4Lii4Lij4Lix4LiaIC8g4Lij4Liy4Lii4LiI',
  '4LmI4Liy4LiiPC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICBkLmJ5TW9udGgubWFwKGZ1bmN0aW9uKG0pewogICAgICAgIHZhciBibGFuayA9ICFtLmluY29tZSAmJiAhbS5leHBlbnNlOwogICAgICAgIHJldHVybiAnPHRyJyArIChibGFuayA/ICcg',
  'c3R5bGU9Im9wYWNpdHk6LjQ1IicgOiAnJykgKyAnPicgKwogICAgICAgICAgJzx0ZD48Yj4nICsgbS5sYWJlbCArICc8L2I+PC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChtLmluY29tZSA/IG1vbmV5KG0uaW5jb21lKSA6ICfigJMnKSAr',
  'ICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKG0uZXhwZW5zZSA/IG1vbmV5KG0uZXhwZW5zZSkgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+PGIgc3R5bGU9ImNvbG9yOicgKyAobS5uZXQgPj0g',
  'MCA/ICd2YXIoLS1vayknIDogJ3ZhcigtLWRhbmdlciknKSArICciPicgKwogICAgICAgICAgICAoYmxhbmsgPyAn4oCTJyA6IG1vbmV5KG0ubmV0KSkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAnPHRkPicgKwogICAgICAgICAgICAnPGRpdiBjbGFzcz0iYmFy',
  'LXRyYWNrIG1iOCI+PGRpdiBjbGFzcz0iYmFyLWZpbGwiIHN0eWxlPSJ3aWR0aDonICsgKG0uaW5jb21lL21heEJhcioxMDApICsgJyU7YmFja2dyb3VuZDp2YXIoLS1jMSkiPjwvZGl2PjwvZGl2PicgKwogICAgICAgICAgICAnPGRpdiBjbGFzcz0iYmFyLXRyYWNr',
  'Ij48ZGl2IGNsYXNzPSJiYXItZmlsbCIgc3R5bGU9IndpZHRoOicgKyAobS5leHBlbnNlL21heEJhcioxMDApICsgJyU7YmFja2dyb3VuZDp2YXIoLS1jMikiPjwvZGl2PjwvZGl2PicgKwogICAgICAgICAgJzwvdGQ+PC90cj4nOwogICAgICB9KS5qb2luKCcnKSAr',
  'ICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JywgJycsIHRydWUpOwoKICAgIHZhciBieUtpbmQgPSBjYXJkKCfwn6e+IOC5geC4ouC4geC4leC4suC4oeC4o+C4suC4ouC4geC4suC4oyDCtyAnICsgeWVhckxhYmVsLAogICAgICBiYXJDaGFydChkLmJ5S2luZC5tYXAo',
  'ZnVuY3Rpb24oayl7IHJldHVybiB7IGxhYmVsOiBrLmtpbmQgKyAnICgnICsgay5jb3VudCArICcpJywgdG90YWw6IGsudG90YWwgfTsgfSksCiAgICAgICAgICAgICAgICdsYWJlbCcsICd0b3RhbCcsIGZ1bmN0aW9uKGkpeyByZXR1cm4gbW9uZXkoaS50b3RhbCkg',
  'KyAnIOC4vyc7IH0pKTsKCiAgICB2YXIgYnlZZWFyID0gY2FyZCgn8J+TiiDguYDguJfguLXguKLguJrguKPguLLguKLguJvguLUnLAogICAgICBkLmJ5WWVhci5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0',
  'aDphdXRvIj48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4Lib4Li1PC90aD48dGggY2xhc3M9Im51bSI+4Lij4Liy4Lii4Lij4Lix4LiaPC90aD48dGggY2xhc3M9Im51bSI+4Lij4Liy4Lii4LiI4LmI4Liy4LiiPC90aD48dGggY2xhc3M9Im51bSI+4LiE4LiH',
  '4LmA4Lir4Lil4Li34LitPC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIGQuYnlZZWFyLm1hcChmdW5jdGlvbih5KXsKICAgICAgICAgIHJldHVybiAnPHRyIG9uY2xpY2s9InNldFllYXJGcm9tVGFibGUoJyArIHkueWVhciArICcpIiBzdHlsZT0i',
  'Y3Vyc29yOnBvaW50ZXIiPicgKwogICAgICAgICAgICAnPHRkPjxiPicgKyBkaXNwbGF5WWVhcih5LnllYXIpICsgJzwvYj4nICsKICAgICAgICAgICh1c2VCdWRkaGlzdFllYXIoKSA/ICcgPHNwYW4gY2xhc3M9ImZhaW50IGZzMTIiPi8gJyArIHkueWVhciArICc8',
  'L3NwYW4+JyA6ICcnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyBtb25leSh5LmluY29tZSkgKyAnPC90ZD48dGQgY2xhc3M9Im51bSI+JyArIG1vbmV5KHkuZXhwZW5zZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBj',
  'bGFzcz0ibnVtIj48YiBzdHlsZT0iY29sb3I6JyArICh5Lm5ldD49MD8ndmFyKC0tb2spJzondmFyKC0tZGFuZ2VyKScpICsgJyI+JyArIG1vbmV5KHkubmV0KSArICc8L2I+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxl',
  'PjwvZGl2PicgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4guC5ieC4reC4oeC4ueC4pTwvZGl2PicsICcnLCB0cnVlKTsKCiAgICB2YXIga2luZHMgPSAnPGRpdiBjbGFzcz0iY2hpcHMgbWIxMiI+JyArCiAgICAgICc8YnV0',
  'dG9uIGNsYXNzPSJjaGlwICcgKyAoIVMucGFyYW1zLmtpbmQ/J29uJzonJykgKyAnIiBvbmNsaWNrPSJzZXRQYXJhbShcJ2tpbmRcJyxcJ1wnKSI+4LiX4Li44LiB4Lij4Liy4Lii4LiB4Liy4LijPC9idXR0b24+JyArCiAgICAgIGQuYnlLaW5kLm1hcChmdW5jdGlv',
  'bihrKXsKICAgICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9ImNoaXAgJyArIChTLnBhcmFtcy5raW5kPT09ay5raW5kPydvbic6JycpICsgJyIgb25jbGljaz0ic2V0UGFyYW0oXCdraW5kXCcsJyArIGpzcShrLmtpbmQpICsgJykiPicgKwogICAgICAgICAgICAg',
  'ICBlc2Moay5raW5kKSArICcgKCcgKyBrLmNvdW50ICsgJyk8L2J1dHRvbj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwoKICAgIHZhciByb3dzID0gZC5pdGVtczsKICAgIHZhciBsaXN0ID0gY2FyZCgn8J+TkiDguKPguLLguKLguIHguLLguKPguJfg',
  'uLHguYnguIfguKvguKHguJQgwrcgJyArIHllYXJMYWJlbCArICcgKCcgKyByb3dzLmxlbmd0aCArICcpJywKICAgICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC4p+C4',
  'seC4meC4l+C4teC5iDwvdGg+PHRoPuC4o+C4suC4ouC4geC4suC4ozwvdGg+PHRoIGNsYXNzPSJudW0iPuC4iOC4s+C4meC4p+C4meC5gOC4h+C4tOC4mTwvdGg+PHRoPuC4o+C4reC4muC4muC4tOC4pTwvdGg+PHRoPuC4iuC5iOC4reC4h+C4l+C4suC4hzwvdGg+',
  'JyArCiAgICAgICAgJzx0aD7guKrguKXguLTguJs8L3RoPjx0aD7guKvguKHguLLguKLguYDguKvguJXguLg8L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgcm93cy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgICAgICB2YXIgaW5jID0g',
  'eC5mbG93ID09PSAn4Lij4Liy4Lii4Lij4Lix4LiaJzsKICAgICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LmRhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGI+JyAr',
  'IGVzYyh4LmtpbmQpICsgJzwvYj4gJyArIChpbmMgPyAnPHNwYW4gY2xhc3M9ImIgb2siPuC4o+C4suC4ouC4o+C4seC4mjwvc3Bhbj4nIDogJzxzcGFuIGNsYXNzPSJiIG11dGUiPuC4o+C4suC4ouC4iOC5iOC4suC4ojwvc3Bhbj4nKSArICc8L3RkPicgKwogICAg',
  'ICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxiIHN0eWxlPSJjb2xvcjonICsgKGluYz8ndmFyKC0tb2spJzondmFyKC0taW5rKScpICsgJyI+JyArIChpbmM/JysnOifiiJInKSArIG1vbmV5KHguYW1vdW50LCAyKSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICAg',
  'Jzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyh4LmJpbGxNb250aCB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyh4LmNoYW5uZWwgfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyAr',
  'IHRodW1ic0h0bWwoeC5zbGlwUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiBtdXRlZCBjbGlwIj4nICsgZXNjKHgubm90ZSB8fCAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48ZGl2IGNsYXNzPSJ0LWFjdGlvbnMi',
  'PicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1GaW5hbmNlKCcgKyBhdHRyKHgpICsgJylcJz7inI/vuI88L2J1dHRvbj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24g',
  'ZGdyIiBvbmNsaWNrPSJkZWxGaW5hbmNlKCcgKyBqc3EoeC5pZCkgKyAnKSI+8J+XkTwvYnV0dG9uPicgKwogICAgICAgICAgICAnPC9kaXY+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgOiBl',
  'bXB0eUJveCgn4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4Lij4LmD4LiZJyArIHllYXJMYWJlbCwgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZvcm1GaW5hbmNlKG51bGwpIj4rIOC4muC4seC4meC4l+C4tuC4geC4o+C4',
  'suC4ouC4geC4suC4ozwvYnV0dG9uPicpLAogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSBzbSIgb25jbGljaz0iZm9ybUZpbmFuY2UobnVsbCkiPisg4Lia4Lix4LiZ4LiX4Li24LiB4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4ojwv',
  'YnV0dG9uPicsIHRydWUpOwoKICAgIHJldHVybiBoZWFkICsgY2hhcnRzICsgbW9udGhseSArICc8ZGl2IGNsYXNzPSJncmlkIGcyIG10MTIgbWIxMiI+JyArIGJ5S2luZCArIGJ5WWVhciArICc8L2Rpdj4nICsga2luZHMgKyBsaXN0OwogIH0KfTsKCi8qID09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICA5KSDguKPguLLguKLguIfguLLguJkgJiDguKrguLPguKPguK3guIfguILguYnguK3guKHguLnguKUKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5yZXBvcnRzID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7CiAgICByZXR1cm4gUHJvbWlzZS5hbGwoWwogICAgICBjYWxsQXBpKCdyZXBvcnQuY29zdFBlclJvb20nLCB7IHllYXI6IFMueWVhciB9',
  'KSwKICAgICAgY2FsbEFwaSgncmVwb3J0LnVwY29taW5nJywgeyBkYXlzOiA5MCB9KSwKICAgICAgY2FsbEFwaSgnYmFja3VwLnNoZWV0cycsIHt9KSwKICAgICAgY2FsbEFwaSgnc2hhcmUubGlua3MnLCB7fSkuY2F0Y2goZnVuY3Rpb24oKXsgcmV0dXJuIHt9OyB9',
  'KSwKICAgICAgY2FsbEFwaSgnYmFja3VwLmhpc3RvcnknLCB7fSkuY2F0Y2goZnVuY3Rpb24oKXsgcmV0dXJuIFtdOyB9KQogICAgXSkudGhlbihmdW5jdGlvbihyKXsKICAgICAgcmV0dXJuIHsgY29zdDogclswXSwgdXBjb21pbmc6IHJbMV0sIHNoZWV0czogclsy',
  'XSwgbGlua3M6IHJbM10gfHwge30sIGJhY2t1cHM6IHJbNF0gfHwgW10sIHllYXJzOiBbXSB9OwogICAgfSk7CiAgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6',
  'ICfguJvguLUgJyArIFMueWVhcjsKICAgIHZhciBjID0gZC5jb3N0OwogICAgdmFyIHRvcCA9IGMucm9vbXMuZmlsdGVyKGZ1bmN0aW9uKHIpeyByZXR1cm4gci50b3RhbCA+IDA7IH0pOwogICAgdmFyIG1heENvc3QgPSB0b3AubGVuZ3RoID8gdG9wWzBdLnRvdGFs',
  'IDogMTsKCiAgICB2YXIgdXBjb21pbmcgPSBjYXJkKCfwn5eT77iPIOC4m+C4j+C4tOC4l+C4tOC4meC4h+C4suC4meC4l+C4teC5iOC4geC4s+C4peC4seC4h+C4iOC4sOC4luC4tuC4hyAoOTAg4Lin4Lix4LiZKSDCtyAnICsgZC51cGNvbWluZy5sZW5ndGggKyAn',
  'IOC4h+C4suC4mScsCiAgICAgIGQudXBjb21pbmcubGVuZ3RoID8gJzxkaXYgY2xhc3M9ImFsaXN0Ij4nICsgZC51cGNvbWluZy5tYXAoZnVuY3Rpb24odSl7CiAgICAgICAgdmFyIGx2bCA9IHUuZGF5c0xlZnQgPCAwID8gJ2RhbmdlcicgOiAodS5kYXlzTGVmdCA8',
  'PSA3ID8gJ3dhcm4nIDogJ2luZm8nKTsKICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImFsaSBsLScgKyBsdmwgKyAnIiBvbmNsaWNrPSJnbyhcJycgKyBqdW1wUGFnZSh1Lm1vZHVsZSkgKyAnXCcpIj4nICsKICAgICAgICAgICc8ZGl2IGNsYXNzPSJpYyI+JyAr',
  'IHUuaWNvbiArICc8L2Rpdj48ZGl2PicgKwogICAgICAgICAgJzxkaXYgY2xhc3M9InR0Ij4nICsgZXNjKHUudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAgJzxkaXYgY2xhc3M9ImRkIj4nICsgdGhEYXRlKHUuZGF0ZSkgKyAnIMK3ICcgKwogICAgICAgICAg',
  'ICAodS5kYXlzTGVmdCA8IDAgPyAn4LmA4Lil4Lii4LiB4Liz4Lir4LiZ4LiUICcgKyAoLXUuZGF5c0xlZnQpICsgJyDguKfguLHguJknIDogKHUuZGF5c0xlZnQgPT09IDAgPyAn4Lin4Lix4LiZ4LiZ4Li14LmJJyA6ICfguK3guLXguIEgJyArIHUuZGF5c0xlZnQg',
  'KyAnIOC4p+C4seC4mScpKSArCiAgICAgICAgICAgICh1LmRldGFpbCA/ICcgwrcgJyArIGVzYyh1LmRldGFpbCkgOiAnJykgKyAnPC9kaXY+PC9kaXY+PC9kaXY+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JyA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRp',
  'diBjbGFzcz0iYmlnIj7wn4yk77iPPC9kaXY+4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ4LiZ4Lix4LiU4Lir4Lih4Liy4Lii4LmD4LiZIDkwIOC4p+C4seC4meC4guC5ieC4suC4h+C4q+C4meC5ieC4sjwvZGl2PicsICcnLCB0cnVlKTsKCiAgICB2YXIgY29zdENh',
  'cmQgPSBjYXJkKCfwn4+377iPIOC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC4quC4sOC4quC4oeC4o+C4suC4ouC4q+C5ieC4reC4hyDCtyAnICsgeWVhckxhYmVsLAogICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMyBtYjEyIj4nICsKICAgICAgICBrcGko',
  'J+C4o+C4p+C4oeC4l+C4uOC4geC4q+C5ieC4reC4hycsIGJhaHQoYy50b3RhbCksICcnKSArCiAgICAgICAga3BpKCfguYDguInguKXguLXguYjguKLguJXguYjguK3guKvguYnguK3guIcnLCBiYWh0KGMuYXZlcmFnZSksICcnKSArCiAgICAgICAga3BpKCfguKvg',
  'uYnguK3guIfguJfguLXguYjguYPguIrguYnguIjguYjguLLguKLguKrguLnguIfguKrguLjguJQnLCB0b3AubGVuZ3RoID8gKCfguKvguYnguK3guIcgJyArIHRvcFswXS5yb29tKSA6ICfigJMnLCB0b3AubGVuZ3RoID8gYmFodCh0b3BbMF0udG90YWwpIDogJycp',
  'ICsKICAgICAgJzwvZGl2PicgKwogICAgICAodG9wLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0Ij48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4Lir4LmJ4Lit4LiHPC90aD48dGggY2xhc3M9Im51bSI+4LiH4Liy4LiZ4LiL4LmI',
  '4Lit4LihPC90aD48dGggY2xhc3M9Im51bSI+4LiE4LmI4Liy4LiL4LmI4Lit4LihPC90aD48dGggY2xhc3M9Im51bSI+4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMPC90aD4nICsKICAgICAgICAnPHRoIGNsYXNzPSJudW0iPuC4guC4reC4h+C5gOC4guC5ieC4suC4',
  'q+C5ieC4reC4hzwvdGg+PHRoIGNsYXNzPSJudW0iPuC4o+C4p+C4oTwvdGg+PHRoIHN0eWxlPSJ3aWR0aDoyNiUiPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICB0b3AubWFwKGZ1bmN0aW9uKHIpewogICAgICAgICAgcmV0dXJuICc8dHIgb25j',
  'bGljaz0ib3BlblJvb20oJyArIGpzcShyLnJvb20pICsgJykiIHN0eWxlPSJjdXJzb3I6cG9pbnRlciI+JyArCiAgICAgICAgICAgICc8dGQ+PGI+JyArIGVzYyhyLnJvb20pICsgJzwvYj4gPHNwYW4gY2xhc3M9ImZhaW50IGZzMTIiPuC4iuC4seC5ieC4mSAnICsg',
  'ZXNjKHIuZmxvb3IpICsgJzwvc3Bhbj48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyByLmpvYnMgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHIucmVwYWlyID8gbW9uZXkoci5yZXBhaXIpIDogJ+KA',
  'kycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChyLmFjID8gbW9uZXkoci5hYykgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHIucHVyY2hhc2UgPyBtb25leShyLnB1cmNo',
  'YXNlKSA6ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxiPicgKyBtb25leShyLnRvdGFsKSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48ZGl2IGNsYXNzPSJiYXItdHJhY2siPjxkaXYgY2xhc3M9ImJhci1m',
  'aWxsIiBzdHlsZT0id2lkdGg6JyArIChyLnRvdGFsL21heENvc3QqMTAwKSArICclIj48L2Rpdj48L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+',
  '4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4LiX4Li14LmI4Lia4Lix4LiZ4LiX4Li24LiB4LmE4Lin4LmJ4Lij4Liy4Lii4Lir4LmJ4Lit4LiHPGRpdiBjbGFzcz0iZnMxMiBtdDgiPuC5g+C4quC5iCAi4LiE4LmI',
  '4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiIiDguYPguJnguIfguLLguJnguIvguYjguK3guKEv4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMIOC4q+C4o+C4t+C4reC4o+C4sOC4muC4uOC4q+C5ieC4reC4h+C5g+C4meC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4',
  'reC4guC4reC4hyDguYHguKXguYnguKfguJXguLHguKfguYDguKXguILguIjguLDguILguLbguYnguJnguJfguLXguYjguJnguLXguYg8L2Rpdj48L2Rpdj4nKSk7CgogICAgdmFyIGJhY2t1cCA9IGNhcmQoJ/Cfkr4g4Liq4Liz4Lij4Lit4LiH4LmB4Lil4Liw4LiB',
  '4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54LilJywKICAgICAgJzxwIGNsYXNzPSJmczEzIG11dGVkIj7guILguYnguK3guKHguLnguKXguJfguLHguYnguIfguKvguKHguJTguK3guKLguLnguYjguYPguJnguKPguLDguJrguJrguJnguLXguYkg4oCUIOC4',
  'hOC4p+C4o+C4lOC4suC4p+C4meC5jOC5guC4q+C4peC4lOC4quC4s+C4o+C4reC4h+C5hOC4p+C5ieC5gOC4lOC4t+C4reC4meC4peC4sOC4hOC4o+C4seC5ieC4hyAnICsKICAgICAgJ+C5hOC4n+C4peC5jCBKU09OIOC4meC4s+C4geC4peC4seC4muC5gOC4guC5',
  'ieC4suC4o+C4sOC4muC4muC5hOC4lOC5iSDguKrguYjguKfguJkgQ1NWIOC5gOC4m+C4tOC4lOC5g+C4mSBFeGNlbCDguKvguKPguLfguK0gR29vZ2xlIFNoZWV0cyDguYTguJTguYnguYDguKXguKI8L3A+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQxMiI+',
  'JyArCiAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImRvRXhwb3J0SnNvbigpIj7irIfvuI8g4LiU4Liy4Lin4LiZ4LmM4LmC4Lir4Lil4LiU4Liq4Liz4Lij4Lit4LiH4LiX4Lix4LmJ4LiH4Lir4Lih4LiUIChKU09OKTwvYnV0dG9uPicg',
  'KwogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImRvSW1wb3J0SnNvbigpIj7irIbvuI8g4LiB4Li54LmJ4LiE4Li34LiZ4LiI4Liy4LiB4LmE4Lif4Lil4LmM4Liq4Liz4Lij4Lit4LiHPC9idXR0b24+JyArCiAgICAgICc8L2Rpdj4nICsKICAg',
  'ICAgJzxkaXYgY2xhc3M9ImhyIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbWI4Ij7guKrguYjguIfguK3guK3guIHguYDguJvguYfguJkgQ1NWIOC5geC4ouC4geC4leC4suC4o+C4suC4hzwvZGl2PicgKwogICAgICAnPGRpdiBjbGFz',
  'cz0iY2hpcHMiPicgKyBkLnNoZWV0cy5tYXAoZnVuY3Rpb24obil7CiAgICAgICAgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJjaGlwIiBvbmNsaWNrPSJkb0V4cG9ydENzdignICsganNxKG4pICsgJykiPicgKyBlc2Moc2hlZXRMYWJlbChuKSkgKyAnPC9idXR0b24+',
  'JzsKICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+Jyk7CgogICAgdmFyIHNoYXJlID0gKGNhbkVkaXQoKSAmJiBkLmxpbmtzICYmIGQubGlua3Mudmlld1VybCkgPyBjYXJkKCfwn5SXIOC4peC4tOC4h+C4geC5jOC5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4',
  'mScsCiAgICAgICc8ZGl2IGNsYXNzPSJmIG1iMTIiPjxsYWJlbD7wn5SRIOC4peC4tOC4h+C4geC5jOC4guC4reC4h+C4hOC4uOC4kyAo4LmB4LiB4LmJ4LmE4LiC4LiC4LmJ4Lit4Lih4Li54Lil4LmE4LiU4LmJIOKAlCDguK3guKLguYjguLLguKrguYjguIfguJXg',
  'uYjguK0pPC9sYWJlbD4nICsKICAgICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIHJlYWRvbmx5IHZhbHVlPSInICsgZXNjKGQubGlua3MuYWRtaW5VcmwpICsgJyIgb25jbGljaz0idGhpcy5zZWxlY3QoKSI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIj48',
  'bGFiZWw+8J+RgCDguKXguLTguIfguIHguYzguYHguIrguKPguYwgKOC5gOC4m+C4tOC4lOC4lOC4ueC5hOC4lOC5ieC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pyDigJQg4Liq4LmI4LiH4LmD4Lir4LmJ4LmD4LiE4Lij4LiB4LmH4LmE4LiU4LmJKTwvbGFi',
  'ZWw+JyArCiAgICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0ic2hhcmVVcmwiIHJlYWRvbmx5IHZhbHVlPSInICsgZXNjKGQubGlua3Mudmlld1VybCkgKyAnIiBvbmNsaWNrPSJ0aGlzLnNlbGVjdCgpIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9InJv',
  'dyBtdDEyIj4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iY29weVNoYXJlKCkiPvCfk4sg4LiE4Lix4LiU4Lil4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmMPC9idXR0b24+JyArCiAgICAgICAgJzxidXR0b24gY2xh',
  'c3M9ImJ0biBkZ3IiIG9uY2xpY2s9ImRvUm90YXRlU2hhcmUoKSI+8J+UgSDguK3guK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYzguYPguKvguKHguYg8L2J1dHRvbj4nICsKICAgICAgJzwvZGl2PicgKwogICAgICAnPHAgY2xhc3M9ImZzMTIgbXV0ZWQg',
  'bXQxMiI+4LiE4LiZ4LiX4Li14LmI4LmA4Lib4Li04LiU4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LiI4Liw4LmA4Lir4LmH4LiZ4LiC4LmJ4Lit4Lih4Li54Lil4LiX4Lix4LmJ4LiH4Lir4Lih4LiU4LmB4Lia4Lia4Lit4LmI4Liy4LiZ4Lit4Lii4LmI4Liy',
  '4LiH4LmA4LiU4Li14Lii4LinICcgKwogICAgICAn4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4Lih4Li14Lia4Lix4LiN4LiK4Li1IEdvb2dsZSDguYHguKXguLDguYTguKHguYjguYDguKvguYfguJkgR29vZ2xlIFNoZWV0IOC4guC4reC4h+C4hOC4uOC4kyDCtyAnICsK',
  'ICAgICAgJ+C4luC5ieC4suC4peC4tOC4h+C4geC5jOC4q+C4peC4uOC4lOC5g+C4q+C5ieC4geC4lCAi4Lit4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LmD4Lir4Lih4LmIIiDguKXguLTguIfguIHguYzguYDguJTguLTguKHguIjguLDguYPguIrg',
  'uYnguYTguKHguYjguYTguJTguYnguJfguLHguJnguJfguLU8L3A+JykgOiAnJzsKCiAgICB2YXIgZHJpdmUgPSBjYW5FZGl0KCkgPyBjYXJkKCfimIHvuI8g4Liq4Liz4Lij4Lit4LiH4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li04LmD4LiZIEdvb2dsZSBEcml2',
  'ZSAoJyArIGQuYmFja3Vwcy5sZW5ndGggKyAnIOC4iuC4uOC4lCknLAogICAgICAnPHAgY2xhc3M9ImZzMTMgbXV0ZWQiPuC4o+C4sOC4muC4muC5gOC4geC5h+C4muC5hOC4n+C4peC5jOC4quC4s+C4o+C4reC4h+C5hOC4p+C5ieC5g+C4meC5guC4n+C4peC5gOC4',
  'lOC4reC4o+C5jCAi4Liq4Liz4Lij4Lit4LiH4LiC4LmJ4Lit4Lih4Li54LilIiDguJrguJnguYTguJTguKPguJ/guYzguILguK3guIfguITguLjguJMgJyArCiAgICAgICfguJXguLHguYnguIfguYPguKvguYnguJfguLPguK3guLHguJXguYLguJnguKHguLHguJXg',
  'uLTguJfguLjguIHguKfguLHguJnguYTguJTguYnguIjguLLguIHguYDguKHguJnguLnguYPguJnguIrguLXguJU8L3A+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQxMiI+PGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJkb0JhY2t1cE5vdygpIj7wn5K+',
  'IOC4quC4s+C4o+C4reC4h+C5gOC4lOC4teC5i+C4ouC4p+C4meC4teC5iTwvYnV0dG9uPjwvZGl2PicgKwogICAgICAoZC5iYWNrdXBzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+PGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9',
  'Im1pbi13aWR0aDphdXRvIj48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4LmE4Lif4Lil4LmMPC90aD48dGg+4LmA4Lin4Lil4LiyPC90aD48dGggY2xhc3M9Im51bSI+4LiC4LiZ4Liy4LiUPC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIGQu',
  'YmFja3Vwcy5zbGljZSgwLDEwKS5tYXAoZnVuY3Rpb24oYil7CiAgICAgICAgICByZXR1cm4gJzx0cj48dGQgY2xhc3M9ImZzMTIiPjxhIGhyZWY9IicgKyBlc2Moc2FmZVVybChiLnVybCkpICsgJyIgdGFyZ2V0PSJfYmxhbmsiIHJlbD0ibm9vcGVuZXIiPicgKyBl',
  'c2MoYi5uYW1lKSArICc8L2E+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyhiLmF0KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0gZnMxMiI+JyArIE1hdGgucm91bmQoYi5zaXplLzEwMjQpICsgJyBL',
  'QjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nIDogJycpKSA6ICcnOwoKICAgIHJldHVybiB1cGNvbWluZyArICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgY29zdENhcmQgKyAnPC9kaXY+JyArCiAgICAgICAg',
  'ICAgKHNoYXJlID8gJzxkaXYgY2xhc3M9Im10MTIiPicgKyBzaGFyZSArICc8L2Rpdj4nIDogJycpICsKICAgICAgICAgICAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIGJhY2t1cCArICc8L2Rpdj4nICsKICAgICAgICAgICAoZHJpdmUgPyAnPGRpdiBjbGFzcz0ibXQx',
  'MiI+JyArIGRyaXZlICsgJzwvZGl2PicgOiAnJyk7CiAgfQp9OwoKZnVuY3Rpb24gc2hlZXRMYWJlbChuKXsKICByZXR1cm4gKHsKICAgIERlYnRzOifguIHguYnguK3guJnguKvguJnguLXguYknLCBEZWJ0UGF5bWVudHM6J+C4o+C4suC4ouC4geC4suC4o+C4iuC4',
  's+C4o+C4sOC4q+C4meC4teC5iScsIFB1cmNoYXNlczon4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHJywgUm9vbXM6J+C4l+C4sOC5gOC4muC4teC4ouC4meC4q+C5ieC4reC4hycsCiAgICBBY1NlcnZpY2U6J+C4peC5ieC4suC4h+C5geC4',
  'reC4o+C5jCcsIFJvb21SZXBhaXJzOifguIvguYjguK3guKHguYHguIvguKHguKvguYnguK3guIcnLCBCdWlsZGluZ1JlcGFpcnM6J+C4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4gScsCiAgICBSb29tQXNzZXRzOifguJfguKPguLHguJ7guKLguYzguKrguLTg',
  'uJnguKvguYnguK3guIcnLCBGaW5hbmNlOifguKPguLLguKLguKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4LiiJywgU2V0dGluZ3M6J+C4leC4seC5ieC4h+C4hOC5iOC4sicsIEFjdGl2aXR5TG9nOifguJvguKPguLDguKfguLHguJXguLTguIHguLLguKPguYHg',
  'uIHguYnguYTguIInCiAgfSlbbl0gfHwgbjsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4leC4seC4p+C4iuC5iOC4p+C4ouC4p+C4suC4lOC4i+C5ieC4syDguYYKICAgPT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgpmdW5jdGlvbiBrcGkobGFiZWwsIHZhbHVlLCBjYXAsIGNscyl7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJrcGkgJyArIChjbHN8fCcnKSArICciPicgKwogICAg',
  'JzxkaXYgY2xhc3M9ImxibCI+JyArIGVzYyhsYWJlbCkgKyAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0idmFsIj4nICsgdmFsdWUgKyAnPC9kaXY+JyArCiAgICAoY2FwID8gJzxkaXYgY2xhc3M9ImNhcCI+JyArIGNhcCArICc8L2Rpdj4nIDogJycpICsgJzwv',
  'ZGl2Pic7Cn0KCmZ1bmN0aW9uIGNhcmQodGl0bGUsIGJvZHksIGFjdGlvbnMsIGZsdXNoKXsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImNhcmQiPicgKwogICAgKHRpdGxlID8gJzxkaXYgY2xhc3M9ImNhcmQtaCI+PGgzPicgKyB0aXRsZSArICc8L2gzPicgKyAoYWN0',
  'aW9ucyA/ICc8ZGl2IGNsYXNzPSJzcCI+JyArIGFjdGlvbnMgKyAnPC9kaXY+JyA6ICcnKSArICc8L2Rpdj4nIDogJycpICsKICAgICc8ZGl2IGNsYXNzPSJjYXJkLWInICsgKGZsdXNoID8gJyBmbHVzaCcgOiAnJykgKyAnIj4nICsgYm9keSArICc8L2Rpdj48L2Rp',
  'dj4nOwp9CgovKiog4Lin4Liy4LiU4Lic4Lix4LiH4Lir4LmJ4Lit4LiH4LmB4Lia4LmI4LiH4LiV4Liy4Lih4LiK4Lix4LmJ4LiZIOKAlCBkZWNvcmF0ZShyb29tKSAtPiB7Y2xzLCBzdWIsIG9uY2xpY2t9ICovCmZ1bmN0aW9uIHJvb21GbG9vcnMocm9vbXMsIGRl',
  'Y29yYXRlKXsKICB2YXIgYnlGbG9vciA9IHt9OwogIHJvb21zLmZvckVhY2goZnVuY3Rpb24ocil7CiAgICB2YXIgZiA9IHIuZmxvb3IgfHwgTnVtYmVyKFN0cmluZyhyLnJvb20pLmNoYXJBdCgwKSk7CiAgICAoYnlGbG9vcltmXSA9IGJ5Rmxvb3JbZl0gfHwgW10p',
  'LnB1c2gocik7CiAgfSk7CiAgdmFyIGZsb29ycyA9IE9iamVjdC5rZXlzKGJ5Rmxvb3IpLnNvcnQoKTsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImZsb29ycyI+JyArIGZsb29ycy5tYXAoZnVuY3Rpb24oZil7CiAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImZsb29yIj48',
  'ZGl2IGNsYXNzPSJmbG9vci10YWciPjxiPicgKyBmICsgJzwvYj7guIrguLHguYnguJk8L2Rpdj48ZGl2IGNsYXNzPSJyb29tcyI+JyArCiAgICAgIGJ5Rmxvb3JbZl0ubWFwKGZ1bmN0aW9uKHIpewogICAgICAgIHZhciBkID0gZGVjb3JhdGUocik7CiAgICAgICAg',
  'cmV0dXJuICc8ZGl2IGNsYXNzPSJyb29tICcgKyBkLmNscyArICciIG9uY2xpY2s9IicgKyBkLm9uY2xpY2sgKyAnIj4nICsKICAgICAgICAgICc8c3BhbiBjbGFzcz0iZG90Ij48L3NwYW4+PGRpdiBjbGFzcz0ibm8iPicgKyBlc2Moci5yb29tKSArICc8L2Rpdj4n',
  'ICsKICAgICAgICAgICc8ZGl2IGNsYXNzPSJzdCI+JyArIGQuc3ViICsgJzwvZGl2PjwvZGl2Pic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PjwvZGl2Pic7CiAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKfQoKLyoqIOC5g+C4quC5iCBvYmplY3Qg4Lil4LiH',
  '4LmD4LiZIG9uY2xpY2sgYXR0cmlidXRlIOC5hOC4lOC5ieC4reC4ouC5iOC4suC4h+C4m+C4peC4reC4lOC4oOC4seC4oiAqLwovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lib4LiP4Li0',
  '4LiX4Li04LiZ4LiH4Liy4LiZ4Lij4Lin4LihCiAgIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLQogICDguYDguJTguLfguK3guJnguJfguLXguYjguJTguLnguK3guKLguLnguYjguYDguIHguYfguJrg',
  'uYHguKLguIHguIjguLLguIHguJXguLHguKfguYDguKXguLfguK3guIHguJvguLXguJrguJnguYHguJbguJrguKvguLHguKcgKFMuY2FsWW0pIOC5gOC4peC4t+C5iOC4reC4meC4guC5ieC4suC4oeC4m+C4teC5hOC4lOC5ieC4leC5iOC4reC5gOC4meC4t+C5iOC4',
  'reC4hwogICDguIjguK3guIHguKfguYnguLLguIc6IOC4leC4suC4o+C4suC4h+C5gOC4lOC4t+C4reC4mSDguKHguLXguIrguLfguYjguK3guIfguLLguJnguYPguJnguIrguYjguK3guIfguKfguLHguJkgwrcg4LiI4Lit4LmB4LiE4LiaOiDguIrguYjguK3guIfg',
  'uKfguLHguJnguYDguKvguKXguLfguK3guIjguLjguJTguKrguLUg4Lij4Liy4Lii4Lil4Liw4LmA4Lit4Li14Lii4LiU4Lit4Lii4Li54LmI4LmD4LiZ4Lij4Liy4Lii4LiB4Liy4Lij4LiC4LmJ4Liy4LiH4Lil4LmI4Liy4LiHCiAgICjguYLguITguKPguIcgSFRN',
  'TCDguIrguLjguJTguYDguJTguLXguKLguKfguIHguLHguJkg4Liq4Lil4Lix4Lia4LiU4LmJ4Lin4LiiIENTUykKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCnZhciBUSF9NT05USF9GVUxM',
  'ID0gWyfguKHguIHguKPguLLguITguKEnLCfguIHguLjguKHguKDguLLguJ7guLHguJnguJjguYwnLCfguKHguLXguJnguLLguITguKEnLCfguYDguKHguKnguLLguKLguJknLCfguJ7guKTguKnguKDguLLguITguKEnLCfguKHguLTguJbguLjguJnguLLguKLguJkn',
  'LAogICAgICAgICAgICAgICAgICAgICAn4LiB4Lij4LiB4LiO4Liy4LiE4LihJywn4Liq4Li04LiH4Lir4Liy4LiE4LihJywn4LiB4Lix4LiZ4Lii4Liy4Lii4LiZJywn4LiV4Li44Lil4Liy4LiE4LihJywn4Lie4Lik4Lio4LiI4Li04LiB4Liy4Lii4LiZJywn4LiY',
  '4Lix4LiZ4Lin4Liy4LiE4LihJ107CnZhciBDQUxfS0lORFMgPSBbCiAgeyBtb2R1bGU6J3JlcGFpcnMnLCAgIGljOifwn5SnJywgbGFiZWw6J+C4i+C5iOC4reC4oeC4q+C5ieC4reC4hycgfSwKICB7IG1vZHVsZTonYWMnLCAgICAgICAgaWM6J+KdhO+4jycsIGxh',
  'YmVsOifguKXguYnguLLguIfguYHguK3guKPguYwnIH0sCiAgeyBtb2R1bGU6J2J1aWxkaW5nJywgIGljOifwn4+iJywgbGFiZWw6J+C4h+C4suC4meC4leC4tuC4gScgfSwKICB7IG1vZHVsZTonZGVidCcsICAgICAgaWM6J/CfkrAnLCBsYWJlbDon4Lic4LmI4Lit',
  '4LiZ4Lir4LiZ4Li14LmJJyB9LAogIHsgbW9kdWxlOidwdXJjaGFzZXMnLCBpYzon8J+boe+4jycsIGxhYmVsOifguJvguKPguLDguIHguLHguJknIH0KXTsKdmFyIENBTCA9IHsgaGlkZToge30sIGRhdGE6IG51bGwgfTsKCmZ1bmN0aW9uIGNhbE5vd1ltKCl7IHZh',
  'ciBkID0gbmV3IERhdGUoKTsgcmV0dXJuIGQuZ2V0RnVsbFllYXIoKSArICctJyArICgnMCcgKyAoZC5nZXRNb250aCgpICsgMSkpLnNsaWNlKC0yKTsgfQpmdW5jdGlvbiBjYWxTaGlmdCh5bSwgZGVsdGEpewogIHZhciB5ID0gTnVtYmVyKHltLnNsaWNlKDAsIDQp',
  'KSwgbSA9IE51bWJlcih5bS5zbGljZSg1LCA3KSkgLSAxICsgZGVsdGE7CiAgeSArPSBNYXRoLmZsb29yKG0gLyAxMik7IG0gPSAoKG0gJSAxMikgKyAxMikgJSAxMjsKICByZXR1cm4geSArICctJyArICgnMCcgKyAobSArIDEpKS5zbGljZSgtMik7Cn0KZnVuY3Rp',
  'b24gY2FsR28oZGVsdGEpeyBTLmNhbFltID0gZGVsdGEgPT09IDAgPyBjYWxOb3dZbSgpIDogY2FsU2hpZnQoUy5jYWxZbSB8fCBjYWxOb3dZbSgpLCBkZWx0YSk7IGxvYWQoKTsgfQpmdW5jdGlvbiBjYWxUb2dnbGUobW9kdWxlKXsgQ0FMLmhpZGVbbW9kdWxlXSA9',
  'ICFDQUwuaGlkZVttb2R1bGVdOyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndmlldycpLmlubmVySFRNTCA9IFJPVVRFUy5jYWxlbmRhci5yZW5kZXIoQ0FMLmRhdGEpOyBsYWJlbENlbGxzKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aWV3JykpOyBhcHBseVJl',
  'YWRPbmx5KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aWV3JykpOyB9CmZ1bmN0aW9uIGNhbFNob3duKCl7IHJldHVybiAoQ0FMLmRhdGEuZXZlbnRzIHx8IFtdKS5maWx0ZXIoZnVuY3Rpb24oZSl7IHJldHVybiAhQ0FMLmhpZGVbZS5tb2R1bGVdOyB9KTsgfQpm',
  'dW5jdGlvbiBjYWxTdGF0ZUxhYmVsKHMpeyByZXR1cm4gcyA9PT0gJ2RvbmUnID8gJ+C5gOC4quC4o+C5h+C4iOC5geC4peC5ieC4pycgOiAocyA9PT0gJ2xhdGUnID8gJ+C5gOC4peC4ouC4geC4s+C4q+C4meC4lCcgOiAn4Lij4Lit4LiX4LizJyk7IH0KZnVuY3Rp',
  'b24gY2FsU3RhdGVDbHMocyl7IHJldHVybiBzID09PSAnZG9uZScgPyAnb2snIDogKHMgPT09ICdsYXRlJyA/ICdkZ3InIDogJ2luZm8nKTsgfQoKUk9VVEVTLmNhbGVuZGFyID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7CiAgICBpZiAoIVMuY2FsWW0pIFMuY2FsWW0g',
  'PSBjYWxOb3dZbSgpOwogICAgcmV0dXJuIGNhbGxBcGkoJ2NhbGVuZGFyLm1vbnRoJywgeyB5bTogUy5jYWxZbSB9KS50aGVuKGZ1bmN0aW9uKGQpewogICAgICAvLyDguKvguJnguYnguLLguJnguLXguYnguYTguKHguYjguYPguIrguYnguJXguLHguKfguYDguKXg',
  'uLfguK3guIHguJvguLUg4oCUIOC4quC5iOC4h+C4m+C4teC4l+C4teC5iOC5gOC4peC4t+C4reC4geC4hOC5ieC4suC4h+C5hOC4p+C5ieC4geC4peC4seC4muC5hOC4myDguJXguLHguKfguYDguKXguLfguK3guIHguIjguLDguYTguJTguYnguYTguKHguYjguJbg',
  'uLnguIHguKPguLXguYDguIvguYfguJUKICAgICAgZC55ZWFycyA9IFMueWVhciAhPT0gJ2FsbCcgPyBbTnVtYmVyKFMueWVhcildIDogW107CiAgICAgIHJldHVybiBkOwogICAgfSk7CiAgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgQ0FMLmRhdGEgPSBk',
  'OwogICAgdmFyIGV2ID0gY2FsU2hvd24oKTsKICAgIHZhciBieURheSA9IHt9OwogICAgZXYuZm9yRWFjaChmdW5jdGlvbihlKXsgKGJ5RGF5W2UuZGF0ZV0gPSBieURheVtlLmRhdGVdIHx8IFtdKS5wdXNoKGUpOyB9KTsKICAgIHZhciBsYXRlID0gZXYuZmlsdGVy',
  'KGZ1bmN0aW9uKGUpeyByZXR1cm4gZS5zdGF0ZSA9PT0gJ2xhdGUnOyB9KS5sZW5ndGg7CiAgICB2YXIgZHVlICA9IGV2LmZpbHRlcihmdW5jdGlvbihlKXsgcmV0dXJuIGUuc3RhdGUgPT09ICdkdWUnOyB9KS5sZW5ndGg7CiAgICB2YXIgZG9uZSA9IGV2LmZpbHRl',
  'cihmdW5jdGlvbihlKXsgcmV0dXJuIGUuc3RhdGUgPT09ICdkb25lJzsgfSkubGVuZ3RoOwoKICAgIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImNhcmQgbWIxMiI+PGRpdiBjbGFzcz0iY2FyZC1iIj4nICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyI+JyArCiAgICAg',
  'ICAgJzxidXR0b24gY2xhc3M9ImJ0biBpY29uIiB0aXRsZT0i4LmA4LiU4Li34Lit4LiZ4LiB4LmI4Lit4LiZIiBhcmlhLWxhYmVsPSLguYDguJTguLfguK3guJnguIHguYjguK3guJkiIG9uY2xpY2s9ImNhbEdvKC0xKSI+4peAPC9idXR0b24+JyArCiAgICAgICAg',
  'JzxoMyBjbGFzcz0iY2FsLXRpdGxlIiBpZD0iY2FsVGl0bGUiPicgKyBUSF9NT05USF9GVUxMW2QubW9udGggLSAxXSArICcgJyArIGVzYyhkaXNwbGF5WWVhcihkLnllYXIpKSArICc8L2gzPicgKwogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gaWNvbiIgdGl0',
  'bGU9IuC5gOC4lOC4t+C4reC4meC4luC4seC4lOC5hOC4myIgYXJpYS1sYWJlbD0i4LmA4LiU4Li34Lit4LiZ4LiW4Lix4LiU4LmE4LibIiBvbmNsaWNrPSJjYWxHbygxKSI+4pa2PC9idXR0b24+JyArCiAgICAgICAgKGQueW0gIT09IGNhbE5vd1ltKCkgPyAnPGJ1',
  'dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJjYWxHbygwKSI+4LiB4Lil4Lix4Lia4Lih4Liy4LmA4LiU4Li34Lit4LiZ4LiZ4Li14LmJPC9idXR0b24+JyA6ICcnKSArCiAgICAgICAgJzxzcGFuIGNsYXNzPSJzcCI+PC9zcGFuPicgKwogICAgICAgIChsYXRl',
  'ID8gJzxzcGFuIGNsYXNzPSJiIGRnciI+4LmA4Lil4Lii4LiB4Liz4Lir4LiZ4LiUICcgKyBsYXRlICsgJzwvc3Bhbj4nIDogJycpICsKICAgICAgICAnPHNwYW4gY2xhc3M9ImIgaW5mbyI+4Lij4Lit4LiX4LizICcgKyBkdWUgKyAnPC9zcGFuPicgKwogICAgICAg',
  'ICc8c3BhbiBjbGFzcz0iYiBvayI+4LmA4Liq4Lij4LmH4LiI4LmB4Lil4LmJ4LinICcgKyBkb25lICsgJzwvc3Bhbj4nICsKICAgICAgJzwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iY2hpcHMgbXQxMiI+JyArIENBTF9LSU5EUy5tYXAoZnVuY3Rpb24oayl7',
  'CiAgICAgICAgdmFyIG4gPSAoZC5ldmVudHMgfHwgW10pLmZpbHRlcihmdW5jdGlvbihlKXsgcmV0dXJuIGUubW9kdWxlID09PSBrLm1vZHVsZTsgfSkubGVuZ3RoOwogICAgICAgIHJldHVybiAnPGJ1dHRvbiBjbGFzcz0iY2hpcCAnICsgKENBTC5oaWRlW2subW9k',
  'dWxlXSA/ICcnIDogJ29uJykgKyAnIiBhcmlhLXByZXNzZWQ9IicgKyAoIUNBTC5oaWRlW2subW9kdWxlXSkgKyAnIiAnICsKICAgICAgICAgICdvbmNsaWNrPSJjYWxUb2dnbGUoJyArIGpzcShrLm1vZHVsZSkgKyAnKSI+JyArIGsuaWMgKyAnICcgKyBlc2Moay5s',
  'YWJlbCkgKyAnICgnICsgbiArICcpPC9idXR0b24+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JyArCiAgICAnPC9kaXY+PC9kaXY+JzsKCiAgICAvLyDguJXguLLguKPguLLguIfguYDguJTguLfguK3guJk6IOC5gOC4o+C4tOC5iOC4oeC4quC4seC4m+C4',
  'lOC4suC4q+C5jOC4p+C4seC4meC4reC4suC4l+C4tOC4leC4ouC5jOC4leC4suC4oeC4m+C4j+C4tOC4l+C4tOC4meC5hOC4l+C4ogogICAgdmFyIGZpcnN0ID0gbmV3IERhdGUoZC55ZWFyLCBkLm1vbnRoIC0gMSwgMSkuZ2V0RGF5KCk7CiAgICB2YXIgY2VsbHMg',
  'PSAnJzsKICAgIFsn4Lit4LiyJywn4LiIJywn4LitJywn4LieJywn4Lie4LikJywn4LioJywn4LiqJ10uZm9yRWFjaChmdW5jdGlvbih3KXsgY2VsbHMgKz0gJzxkaXYgY2xhc3M9ImNhbC13ZCI+JyArIHcgKyAnPC9kaXY+JzsgfSk7CiAgICBmb3IgKHZhciBpID0g',
  'MDsgaSA8IGZpcnN0OyBpKyspIGNlbGxzICs9ICc8ZGl2IGNsYXNzPSJjYWwtYyBvZmYiPjwvZGl2Pic7CiAgICBmb3IgKHZhciBkYXkgPSAxOyBkYXkgPD0gZC5kYXlzOyBkYXkrKykgewogICAgICB2YXIgaXNvID0gZC55bSArICctJyArICgnMCcgKyBkYXkpLnNs',
  'aWNlKC0yKTsKICAgICAgdmFyIGxpc3QgPSBieURheVtpc29dIHx8IFtdOwogICAgICB2YXIgY2xzID0gJ2NhbC1jJyArIChpc28gPT09IGQudG9kYXkgPyAnIHRvZGF5JyA6ICcnKSArIChsaXN0Lmxlbmd0aCA/ICcgaGFzJyA6ICcnKTsKICAgICAgY2VsbHMgKz0g',
  'JzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iJyArIGNscyArICciIG9uY2xpY2s9Im9wZW5DYWxEYXkoJyArIGpzcShpc28pICsgJykiICcgKwogICAgICAgICdhcmlhLWxhYmVsPSLguKfguLHguJnguJfguLXguYggJyArIGRheSArIChsaXN0Lmxlbmd0aCA/',
  'ICcg4Lih4Li1ICcgKyBsaXN0Lmxlbmd0aCArICcg4Lij4Liy4Lii4LiB4Liy4LijJyA6ICcnKSArICciPicgKwogICAgICAgICc8c3BhbiBjbGFzcz0iY2FsLW4iPicgKyBkYXkgKyAnPC9zcGFuPicgKwogICAgICAgIGxpc3Quc2xpY2UoMCwgMykubWFwKGZ1bmN0',
  'aW9uKGUpewogICAgICAgICAgcmV0dXJuICc8c3BhbiBjbGFzcz0iY2FsLWV2ICcgKyBjYWxTdGF0ZUNscyhlLnN0YXRlKSArICciPicgKyBlLmljb24gKyAnICcgKyBlc2MoZS50aXRsZSkgKyAnPC9zcGFuPic7CiAgICAgICAgfSkuam9pbignJykgKwogICAgICAg',
  'IChsaXN0Lmxlbmd0aCA+IDMgPyAnPHNwYW4gY2xhc3M9ImNhbC1tb3JlIj4rJyArIChsaXN0Lmxlbmd0aCAtIDMpICsgJyDguKPguLLguKLguIHguLLguKM8L3NwYW4+JyA6ICcnKSArCiAgICAgICAgJzxzcGFuIGNsYXNzPSJjYWwtZG90cyI+JyArIGxpc3Quc2xp',
  'Y2UoMCwgNSkubWFwKGZ1bmN0aW9uKGUpewogICAgICAgICAgcmV0dXJuICc8aSBjbGFzcz0iJyArIGNhbFN0YXRlQ2xzKGUuc3RhdGUpICsgJyI+PC9pPic7CiAgICAgICAgfSkuam9pbignJykgKyAobGlzdC5sZW5ndGggPiA1ID8gJzxlbT4rJyArIChsaXN0Lmxl',
  'bmd0aCAtIDUpICsgJzwvZW0+JyA6ICcnKSArICc8L3NwYW4+JyArCiAgICAgICc8L2J1dHRvbj4nOwogICAgfQogICAgZm9yICh2YXIgdCA9IChmaXJzdCArIGQuZGF5cykgJSA3OyB0ID4gMCAmJiB0IDwgNzsgdCsrKSBjZWxscyArPSAnPGRpdiBjbGFzcz0iY2Fs',
  'LWMgb2ZmIj48L2Rpdj4nOyAgIC8vIOC5gOC4leC4tOC4oeC4l+C5ieC4suC4ouC5gOC4lOC4t+C4reC4meC5g+C4q+C5ieC5gOC4leC5h+C4oeC5geC4luC4pwogICAgdmFyIGdyaWQgPSAnPGRpdiBjbGFzcz0iY2FyZCBtYjEyIj48ZGl2IGNsYXNzPSJjYXJkLWIg',
  'Zmx1c2giPjxkaXYgY2xhc3M9ImNhbCI+JyArIGNlbGxzICsgJzwvZGl2PjwvZGl2PjwvZGl2Pic7CgogICAgLy8g4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Lix4LmJ4LiH4LmA4LiU4Li34Lit4LiZIOC5gOC4o+C4teC4ouC4h+C4leC4suC4oeC4p+C4seC4mSDigJQg',
  '4Lia4LiZ4Lih4Li34Lit4LiW4Li34Lit4LiZ4Li14LmI4LiE4Li34Lit4LiX4Li14LmI4Lit4LmI4Liy4LiZ4Lij4Liy4Lii4Lil4Liw4LmA4Lit4Li14Lii4LiU4Lir4Lil4Lix4LiBCiAgICB2YXIgZGF5cyA9IE9iamVjdC5rZXlzKGJ5RGF5KS5zb3J0KCk7CiAg',
  'ICB2YXIgYWdlbmRhID0gY2FyZCgn8J+TiyDguKPguLLguKLguIHguLLguKPguILguK3guIfguYDguJTguLfguK3guJnguJnguLXguYkgKCcgKyBldi5sZW5ndGggKyAnKScsCiAgICAgIGRheXMubGVuZ3RoID8gJzxkaXYgY2xhc3M9ImNhbC1hZ2VuZGEiPicgKyBk',
  'YXlzLm1hcChmdW5jdGlvbihpc28pewogICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0iY2FsLWRheScgKyAoaXNvID09PSBkLnRvZGF5ID8gJyB0b2RheScgOiAnJykgKyAnIj4nICsKICAgICAgICAgICc8ZGl2IGNsYXNzPSJjYWwtZGF0ZSI+JyArIHRoRGF0ZShp',
  'c28pICsgKGlzbyA9PT0gZC50b2RheSA/ICcgPHNwYW4gY2xhc3M9ImIgaW5mbyI+4Lin4Lix4LiZ4LiZ4Li14LmJPC9zcGFuPicgOiAnJykgKyAnPC9kaXY+JyArCiAgICAgICAgICBieURheVtpc29dLm1hcChjYWxSb3cpLmpvaW4oJycpICsgJzwvZGl2Pic7CiAg',
  'ICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicKICAgICAgOiBlbXB0eUJveCgn4LmA4LiU4Li34Lit4LiZ4LiZ4Li14LmJ4LmE4Lih4LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4LijJyArIChldi5sZW5ndGggIT09IChkLmV2ZW50cyB8fCBbXSkubGVuZ3RoID8gJ+C5',
  'g+C4meC4m+C4o+C4sOC5gOC4oOC4l+C4l+C4teC5iOC5gOC4peC4t+C4reC4gScgOiAnJyksCiAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0ib3BlbkNhbERheSgnICsganNxKGQueW0gKyAnLTAxJykgKyAnKSI+KyDguYDguJ7guLTg',
  'uYjguKHguJnguLHguJQ8L2J1dHRvbj4nKSwKICAgICAgJycsIHRydWUpOwoKICAgIHJldHVybiBoZWFkICsgZ3JpZCArIGFnZW5kYTsKICB9Cn07CgpmdW5jdGlvbiBjYWxSb3coZSl7CiAgcmV0dXJuICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImNhbC1y',
  'b3ciIG9uY2xpY2s9ImNhbE9wZW4oJyArIGpzcShlLm1vZHVsZSkgKyAnLCcgKyBqc3EoZS5kYXRlKSArICcsJyArIGpzcShlLnN0YXRlKSArICcpIj4nICsKICAgICc8c3BhbiBjbGFzcz0iaWMiPicgKyBlLmljb24gKyAnPC9zcGFuPicgKwogICAgJzxzcGFuIGNs',
  'YXNzPSJ0eCI+PHNwYW4gY2xhc3M9InR0Ij4nICsgZXNjKGUudGl0bGUpICsgJzwvc3Bhbj4nICsKICAgICAgKGUuZGV0YWlsID8gJzxzcGFuIGNsYXNzPSJkZCI+JyArIGVzYyhlLmRldGFpbCkgKyAnPC9zcGFuPicgOiAnJykgKyAnPC9zcGFuPicgKwogICAgJzxz',
  'cGFuIGNsYXNzPSJiICcgKyBjYWxTdGF0ZUNscyhlLnN0YXRlKSArICciPicgKyBjYWxTdGF0ZUxhYmVsKGUuc3RhdGUpICsgJzwvc3Bhbj4nICsKICAnPC9idXR0b24+JzsKfQoKLyoqIOC4geC4lOC4l+C4teC5iOC4p+C4seC4mTog4LiU4Li54Lij4Liy4Lii4LiB',
  '4Liy4Lij4LiC4Lit4LiH4Lin4Lix4LiZ4LiZ4Lix4LmJ4LiZIOC5geC4peC4sOC5gOC4nuC4tOC5iOC4oeC4meC4seC4lOC5g+C4q+C4oeC5iOC5guC4lOC4ouC5g+C4quC5iOC4p+C4seC4meC4l+C4teC5iOC5g+C4q+C5ieC5gOC4peC4oiAqLwpmdW5jdGlvbiBv',
  'cGVuQ2FsRGF5KGlzbyl7CiAgdmFyIGxpc3QgPSBjYWxTaG93bigpLmZpbHRlcihmdW5jdGlvbihlKXsgcmV0dXJuIGUuZGF0ZSA9PT0gaXNvOyB9KTsKICBvcGVuTW9kYWwoJ/Cfl5PvuI8gJyArIHRoRGF0ZShpc28pLAogICAgKGxpc3QubGVuZ3RoID8gJzxkaXYg',
  'Y2xhc3M9ImNhbC1hZ2VuZGEiPicgKyBsaXN0Lm1hcChjYWxSb3cpLmpvaW4oJycpICsgJzwvZGl2PicKICAgICAgICAgICAgICAgICA6ICc8ZGl2IGNsYXNzPSJlbXB0eSIgc3R5bGU9InBhZGRpbmc6MThweCI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lij4Liy',
  '4Lii4LiB4Liy4Lij4LmD4LiZ4Lin4Lix4LiZ4LiZ4Li14LmJPC9kaXY+JyksCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCk7Zm9ybVJlcGFpcih7Ym9va0RhdGU6JyArIGpzcShpc28pICsgJyxyZXBvcnREYXRlOnRvZGF5',
  'KCkscHJpb3JpdHk6XCfguJvguIHguJXguLRcJ30pIj4rIOC4meC4seC4lOC4i+C5iOC4reC4oeC4q+C5ieC4reC4hzwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iY2xvc2VNb2RhbCgpO2Zvcm1BYyh7Ym9va0RhdGU6JyAr',
  'IGpzcShpc28pICsgJ30pIj4rIOC4meC4seC4lOC4peC5ieC4suC4h+C5geC4reC4o+C5jDwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iY2xvc2VNb2RhbCgpO2Zvcm1CdWlsZGluZyh7Ym9va0RhdGU6JyArIGpzcShpc28p',
  'ICsgJ30pIj4rIOC4meC4seC4lOC4h+C4suC4meC4leC4tuC4gTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guJvguLTguJQ8L2J1dHRvbj4nKTsKfQoKLyoqIOC4geC4lOC4l+C4teC5iOC4o+C4suC4',
  'ouC4geC4suC4ozog4LmE4Lib4Lir4LiZ4LmJ4Liy4LiC4Lit4LiH4LiH4Liy4LiZ4LiZ4Lix4LmJ4LiZIOC5g+C4meC4m+C4teC4l+C4teC5iOC4iOC4sOC5gOC4q+C5h+C4meC4h+C4suC4meC4meC4seC5ieC4meC5geC4meC5iCDguYYgKi8KZnVuY3Rpb24gY2Fs',
  'T3Blbihtb2R1bGUsIGRhdGUsIHN0YXRlKXsKICBjbG9zZU1vZGFsKCk7CiAgdmFyIGN1ciA9IFN0cmluZyhuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCkpOwogIC8vIOC4h+C4suC4meC4l+C4teC5iOC4ouC4seC4h+C5hOC4oeC5iOC5gOC4quC4o+C5h+C4iOC5gOC4',
  'q+C5h+C4meC5g+C4meC4m+C4teC4m+C4seC4iOC4iOC4uOC4muC4seC4meC5gOC4quC4oeC4rSDCtyDguIfguLLguJnguJfguLXguYjguYDguKrguKPguYfguIjguYHguKXguYnguKfguYHguKXguLDguKPguLLguKLguIHguLLguKPguYLguK3guJnguK3guKLguLng',
  'uYjguYPguJnguJvguLXguILguK3guIfguKHguLHguJnguYDguK3guIcgwrcg4Lib4Lij4Liw4LiB4Lix4LiZ4Lit4Lii4Li54LmI4LmD4LiZ4Lib4Li14LiX4Li14LmI4LiL4Li34LmJ4LitIOC4iOC4tuC4h+C4lOC4ueC4l+C4uOC4geC4m+C4tQogIFMueWVhciA9',
  'IG1vZHVsZSA9PT0gJ3B1cmNoYXNlcycgPyAnYWxsJyA6ICgobW9kdWxlID09PSAnZGVidCcgfHwgc3RhdGUgPT09ICdkb25lJykgPyBTdHJpbmcoZGF0ZSkuc2xpY2UoMCwgNCkgOiBjdXIpOwogIGdvKG1vZHVsZSA9PT0gJ2RlYnQnID8gJ2RlYnRNYWluJyA6IG1v',
  'ZHVsZSk7Cn0KCi8qKiDguIfguLLguJnguJfguLXguYjguKLguLHguIfguYTguKHguYjguJvguLTguJTguILguK3guIfguJvguLXguK3guLfguYjguJkg4LiL4Li24LmI4LiH4LmB4Liq4LiU4LiH4Lij4LmI4Lin4Lih4Lit4Lii4Li54LmI4LmD4LiZ4Lib4Li14LiX',
  '4Li14LmI4LiB4Liz4Lil4Lix4LiH4LiU4Li5IOKAlCDguJXguLTguJTguJvguYnguLLguKLguJrguK3guIHguKfguYjguLLguYDguJvguYfguJnguILguK3guIfguJvguLXguYTguKvguJkgKi8KZnVuY3Rpb24gb3RoZXJZZWFyVGFnKHgpewogIHJldHVybiB4ICYm',
  'IHgub3RoZXJZZWFyID8gJyA8c3BhbiBjbGFzcz0iYiBpbmZvIiB0aXRsZT0i4LiH4Liy4LiZ4LiZ4Li14LmJ4Lii4Lix4LiH4LmE4Lih4LmI4Lib4Li04LiUIOC4iOC4tuC4h+C5geC4quC4lOC4h+C5g+C4meC4m+C4teC4meC4teC5ieC4lOC5ieC4p+C4oiI+4Lib',
  '4Li1ICcgKyBlc2MoZGlzcGxheVllYXIoeC5vdGhlclllYXIpKSArICc8L3NwYW4+JyA6ICcnOwp9CgpmdW5jdGlvbiBhdHRyKG9iail7CiAgdmFyIGNsZWFuID0ge307CiAgT2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uKGspewogICAgaWYgKGsuaW5k',
  'ZXhPZignXycpID09PSAwIHx8IC9SZWZzJC8udGVzdChrKSB8fCBrID09PSAncmVjb3JkcycgfHwgayA9PT0gJ3dhcnJhbnR5JykgcmV0dXJuOwogICAgY2xlYW5ba10gPSBvYmpba107CiAgfSk7CiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGNsZWFuKS5yZXBsYWNl',
  'KC8mL2csJyZhbXA7JykucmVwbGFjZSgvJy9nLCcmIzM5OycpLnJlcGxhY2UoLyIvZywnJnF1b3Q7Jyk7Cn0KPC9zY3JpcHQ+CjxzY3JpcHQ+Ci8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBTZXR0',
  'aW5ncy5odG1sIOKAlCDguKvguJnguYnguLLguJXguLHguYnguIfguITguYjguLIgwrcg4LiY4Li14LihIMK3IOC4muC4seC4jeC4iuC4teC4nOC4ueC5ieC5g+C4iuC5iSDCtyDguK3guLjguJvguIHguKPguJPguYwKICAgPT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4mOC4teC4oeC4quC4p+C5iOC4suC4hyAvIOC4oeC4t+C4lCAtLS0tLS0tLS0tLS0tLS0tICovCgp2YXIgTFNfVEhFTUUgPSAnbWNvcm5lci50aGVtZSc7CnZh',
  'ciBUSEVNRVMgPSBbCiAgeyBpZDogJ+C4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hycsIGljOiAn8J+MlycsIGhpbnQ6ICfguKrguKXguLHguJrguJXguLLguKHguIHguLLguKPguJXguLHguYnguIfguITguYjguLLguILguK3guIfguK3guLjguJvguIHguKPg',
  'uJPguYwnIH0sCiAgeyBpZDogJ+C4quC4p+C5iOC4suC4hycsICAgICAgaWM6ICfimIDvuI8nLCBoaW50OiAn4Lie4Li34LmJ4LiZ4LiC4Liy4LinIOC4reC5iOC4suC4meC4h+C5iOC4suC4ouC4geC4peC4suC4h+C5geC4lOC4lCcgfSwKICB7IGlkOiAn4Lih4Li3',
  '4LiUJywgICAgICAgIGljOiAn8J+MmScsIGhpbnQ6ICfguJ7guLfguYnguJnguYDguILguYnguKEg4Liq4Lia4Liy4Lii4LiV4Liy4LiV4Lit4LiZ4LiB4Lil4Liy4LiH4LiE4Li34LiZJyB9Cl07CgovKioKICog4LiX4Liy4LiY4Li14Lih4Lil4LiH4Lir4LiZ4LmJ',
  '4Liy4LmA4Lin4LmH4Lia4LiX4Lix4LiZ4LiX4Li1CiAqIOC4leC4seC4p+C5geC4m+C4o+C4quC4teC4l+C4seC5ieC4h+C4q+C4oeC4lOC4meC4tOC4ouC4suC4oeC5hOC4p+C5iSAzIOC4iuC4seC5ieC4meC5g+C4mSBTdHlsZS5odG1sIOC5geC4peC5ieC4pyDg',
  'uJXguKPguIfguJnguLXguYnguYHguITguYjguJXguLTguJTguJvguYnguLLguKLguJrguK3guIHguKfguYjguLLguYPguIrguYnguIrguLHguYnguJnguYTguKvguJkKICovCmZ1bmN0aW9uIGFwcGx5VGhlbWUobmFtZSl7CiAgdmFyIHJvb3QgPSBkb2N1bWVudC5k',
  'b2N1bWVudEVsZW1lbnQ7CiAgaWYgKG5hbWUgPT09ICfguKrguKfguYjguLLguIcnKSByb290LnNldEF0dHJpYnV0ZSgnZGF0YS10aGVtZScsICdsaWdodCcpOwogIGVsc2UgaWYgKG5hbWUgPT09ICfguKHguLfguJQnKSByb290LnNldEF0dHJpYnV0ZSgnZGF0YS10',
  'aGVtZScsICdkYXJrJyk7CiAgZWxzZSByb290LnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS10aGVtZScpOyAgICAgICAvLyDguJXguLLguKHguYDguITguKPguLfguYjguK3guIcgPSDguJvguKXguYjguK3guKLguYPguKvguYkgcHJlZmVycy1jb2xvci1zY2hlbWUg4LiV',
  '4Lix4LiU4Liq4Li04LiZCiAgdmFyIGJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0aGVtZUJ0bicpOwogIGlmIChidG4pIHsKICAgIHZhciB0ID0gVEhFTUVTLmZpbHRlcihmdW5jdGlvbih4KXsgcmV0dXJuIHguaWQgPT09IG5hbWU7IH0pWzBdIHx8IFRI',
  'RU1FU1swXTsKICAgIGJ0bi50ZXh0Q29udGVudCA9IHQuaWM7CiAgICBidG4udGl0bGUgPSAn4LiY4Li14LihOiAnICsgdC5pZCArICcgKOC4geC4lOC5gOC4nuC4t+C5iOC4reC4quC4peC4seC4miknOwogIH0KfQoKZnVuY3Rpb24gY3VycmVudFRoZW1lKCl7CiAg',
  'cmV0dXJuIGxzR2V0KExTX1RIRU1FKSB8fCAoUy5ib290ICYmIFMuYm9vdC5zZXR0aW5ncyAmJiBTLmJvb3Quc2V0dGluZ3MudGhlbWUpIHx8ICfguJXguLLguKHguYDguITguKPguLfguYjguK3guIcnOwp9CgovKiog4LiV4Lix4LmJ4LiH4LiY4Li14Lih4LmB4Lil',
  '4Liw4LiI4Liz4LmE4Lin4LmJIOKAlCDguJzguLnguYnguJTguLnguYHguKXguIjguLDguJbguLnguIHguJrguLHguJnguJfguLbguIHguYDguJvguYfguJnguITguYjguLLguJXguLHguYnguIfguJXguYnguJnguILguK3guIfguKPguLDguJrguJrguJTguYnguKfg',
  'uKIgKi8KZnVuY3Rpb24gc2V0VGhlbWUobmFtZSwgcXVpZXQpewogIGxzU2V0KExTX1RIRU1FLCBuYW1lKTsKICBhcHBseVRoZW1lKG5hbWUpOwogIGlmIChTLmJvb3QgJiYgUy5ib290LmlzQWRtaW4pIHsKICAgIGNhbGxBcGkoJ3NldHRpbmdzLnNhdmUnLCB7IHZh',
  'bHVlczogeyB0aGVtZTogbmFtZSB9IH0pLmNhdGNoKGZ1bmN0aW9uKCl7IC8qIOC5gOC4geC5h+C4muC5g+C4meC5gOC4hOC4o+C4t+C5iOC4reC4h+C4geC5h+C4nuC4rSAqLyB9KTsKICB9CiAgaWYgKCFxdWlldCkgdG9hc3QoJ+C5gOC4m+C4peC4teC5iOC4ouC4',
  'meC5gOC4m+C5h+C4meC4mOC4teC4oScgKyAobmFtZSA9PT0gJ+C4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hycgPyAn4LiV4Liy4Lih4LmA4LiE4Lij4Li34LmI4Lit4LiHJyA6IG5hbWUpLCAnb2snKTsKICBpZiAoUy5wYWdlID09PSAnc2V0dGluZ3MnKSBs',
  'b2FkKHsgcXVpZXQ6IHRydWUgfSk7Cn0KCi8qKiDguJvguLjguYjguKHguJrguJnguYHguJbguJrguKvguLHguKcg4oCUIOC4p+C4meC4quC4p+C5iOC4suC4hyDihpIg4Lih4Li34LiUIOKGkiDguJXguLLguKHguYDguITguKPguLfguYjguK3guIcgKi8KZnVuY3Rp',
  'b24gY3ljbGVUaGVtZSgpewogIHZhciBvcmRlciA9IFsn4Liq4Lin4LmI4Liy4LiHJywgJ+C4oeC4t+C4lCcsICfguJXguLLguKHguYDguITguKPguLfguYjguK3guIcnXTsKICB2YXIgaSA9IG9yZGVyLmluZGV4T2YoY3VycmVudFRoZW1lKCkpOwogIHNldFRoZW1l',
  'KG9yZGVyWyhpICsgMSkgJSBvcmRlci5sZW5ndGhdKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguKvguJnguYnguLLguJXguLHguYnguIfguITguYjguLIgLS0tLS0tLS0tLS0tLS0tLSAqLwoKUk9VVEVTLnNldHRpbmdzID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7',
  'CiAgICByZXR1cm4gUHJvbWlzZS5hbGwoWwogICAgICBjYWxsQXBpKCdzZXR0aW5ncy5saXN0Jywge30pLAogICAgICBjYWxsQXBpKCdhdXRoLmRldmljZXMnLCB7fSkuY2F0Y2goZnVuY3Rpb24oKXsgcmV0dXJuIFtdOyB9KSwKICAgICAgKFMuYm9vdCAmJiBTLmJv',
  'b3QuaXNBZG1pbikgPyBjYWxsQXBpKCd1c2VyLmxpc3QnLCB7fSkuY2F0Y2goZnVuY3Rpb24oKXsgcmV0dXJuIFtdOyB9KSA6IFByb21pc2UucmVzb2x2ZShudWxsKSwKICAgICAgKFMuYm9vdCAmJiBTLmJvb3QuaXNBZG1pbikgPyBjYWxsQXBpKCdzaGFyZS5saW5r',
  'cycsIHt9KS5jYXRjaChmdW5jdGlvbigpeyByZXR1cm4ge307IH0pIDogUHJvbWlzZS5yZXNvbHZlKHt9KQogICAgXSkudGhlbihmdW5jdGlvbihyKXsKICAgICAgcmV0dXJuIHsgc2V0dGluZ3M6IHJbMF0sIGRldmljZXM6IHJbMV0gfHwgW10sIHVzZXJzOiByWzJd',
  'LCBsaW5rczogclszXSB8fCB7fSwgeWVhcnM6IFtdIH07CiAgICB9KTsKICB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICByZXR1cm4gJycgKwogICAgICBzZXR0aW5nc0FjY291bnRDYXJkKGQpICsKICAgICAgc2V0dGluZ3NUaGVtZUNhcmQoKSArCiAgICAg',
  'IChkLnNldHRpbmdzLmNhbkVkaXQgPyBzZXR0aW5nc0dyb3Vwc0h0bWwoZC5zZXR0aW5ncykgOiBzZXR0aW5nc1JlYWRPbmx5Tm90ZSgpKSArCiAgICAgIC8vIOC5gOC4ieC4nuC4suC4sOC4nOC4ueC5ieC4lOC4ueC5geC4peC4l+C4teC5iOC5gOC4q+C5h+C4meC4',
  'quC4reC4h+C4quC5iOC4p+C4meC4meC4teC5iSDigJQg4LiV4Lix4Lin4LiB4Liy4Lij4LmM4LiU4LmA4Lib4LmH4LiZ4LiE4LiZ4LiV4Lix4LiU4Liq4Li04LiZ4LmD4LiI4LmA4Lit4LiH4Lin4LmI4Liy4LiI4Liw4LmB4Liq4LiU4LiH4Lit4Liw4LmE4LijCiAg',
  'ICAgIC8vIOC5gOC4nuC4o+C4suC4sOC4q+C4meC5ieC4suC4leC4seC4p+C4reC4ouC5iOC4suC4h+C5geC4muC4muC5hOC4n+C4peC5jOC5gOC4lOC4teC4ouC4p+C5hOC4oeC5iOC4oeC4teC4muC4seC4jeC4iuC4teC4nOC4ueC5ieC5g+C4iuC5ieC5g+C4q+C5',
  'ieC5geC4quC4lOC4hyDguYHguJXguYjguKLguLHguIfguK3guKLguLLguIHguJrguK3guIHguJzguLnguYnguYPguIrguYnguKfguYjguLLguKHguLXguK3guLDguYTguKPguJrguYnguLLguIcKICAgICAgKGlzQWRtaW5Ob3coKSA/IHNldHRpbmdzVXNlcnNDYXJk',
  'KGQudXNlcnMpICsgc2V0dGluZ3NTaGFyZUNhcmQoZC5saW5rcykgOiAnJyk7CiAgfQp9OwoKLyogLS0tLSDguJrguLHguI3guIrguLXguILguK3guIfguInguLHguJkgLS0tLSAqLwoKZnVuY3Rpb24gc2V0dGluZ3NBY2NvdW50Q2FyZChkKXsKICB2YXIgbWUgPSBB',
  'VVRILm1lIHx8IHt9OwogIHZhciBkZXZpY2VzID0gZC5kZXZpY2VzIHx8IFtdOwogIHJldHVybiBjYXJkKCfwn5GkIOC4muC4seC4jeC4iuC4teC4guC4reC4h+C4ieC4seC4mScsCiAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMiBtYjEyIj4nICsKICAgICAga3BpKCfg',
  'uYDguILguYnguLLguYPguIrguYnguIfguLLguJnguYPguJnguIrguLfguYjguK0nLCBlc2MobWUubmFtZSB8fCBtZS51c2VybmFtZSB8fCAn4oCTJyksIGVzYyhtZS51c2VybmFtZSA/ICdAJyArIG1lLnVzZXJuYW1lIDogKG1lLnZpYSB8fCAnJykpKSArCiAgICAg',
  'IGtwaSgn4Liq4Li04LiX4LiY4Li04LmM4LiB4Liy4Lij4LmD4LiK4LmJ4LiH4Liy4LiZJywgZXNjKG1lLnJvbGUgfHwgJ+KAkycpLAogICAgICAgICAgbWUuY2FuRWRpdCA/ICfguYDguJ7guLTguYjguKEg4LmB4LiB4LmJ4LmE4LiCIOC5geC4peC4sOC4peC4muC4',
  'guC5ieC4reC4oeC4ueC4peC5hOC4lOC5iScgOiAn4LmA4Lib4Li04LiU4LiU4Li54LmE4LiU4LmJ4Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinJykgKwogICAgJzwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InJvdyI+JyArCiAgICAgIChtZS51c2VybmFt',
  'ZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImZvcm1DaGFuZ2VQYXNzd29yZCgpIj7wn5SRIOC5gOC4m+C4peC4teC5iOC4ouC4meC4o+C4q+C4seC4quC4nOC5iOC4suC4mTwvYnV0dG9uPicgOiAnJykgKwogICAgICAobWUudXNlcm5hbWUgPyAnPGJ1',
  'dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJmb3JtU2V0UGluKCkiPvCflKIgJyArCiAgICAgICAgKEFVVEguZGV2aWNlID8gJ+C4leC4seC5ieC4hyBQSU4g4LmD4Lir4Lih4LmI4Lia4LiZ4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJJyA6ICfguJXguLHg',
  'uYnguIcgUElOIOC4quC4s+C4q+C4o+C4seC4muC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5iScpICsgJzwvYnV0dG9uPicgOiAnJykgKwogICAgICAoQVVUSC5kZXZpY2UgPyAnPGJ1dHRvbiBjbGFzcz0iYnRuIGRnciIgb25jbGljaz0iZm9yZ2V0VGhpc0Rl',
  'dmljZSgpIj7guKXguJogUElOIOC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5iTwvYnV0dG9uPicgOiAnJykgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjb25maXJtTG9nb3V0KCkiPvCfmqog4Lit4Lit4LiB4LiI4Liy4LiB4Lij4Liw',
  '4Lia4LiaPC9idXR0b24+JyArCiAgICAnPC9kaXY+JyArCiAgICAoZGV2aWNlcy5sZW5ndGgKICAgICAgPyAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PjxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbWI4Ij7guK3guLjguJvguIHguKPguJPguYzguJfguLXguYjguJXguLHg',
  'uYnguIcgUElOIOC5hOC4p+C5iSAoJyArIGRldmljZXMubGVuZ3RoICsgJyk8L2Rpdj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDphdXRvIj48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4Lit',
  '4Li44Lib4LiB4Lij4LiT4LmMPC90aD48dGg+4LiV4Lix4LmJ4LiH4LmA4Lih4Li34LmI4LitPC90aD48dGg+4LmD4LiK4LmJ4Lil4LmI4Liy4Liq4Li44LiUPC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIGRldmljZXMubWFwKGZ1bmN0aW9uKHgp',
  'ewogICAgICAgICAgcmV0dXJuICc8dHI+PHRkPicgKyBlc2MoeC5kZXZpY2UpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyB0aERhdGVTaG9ydChTdHJpbmcoeC5jcmVhdGVkQXQpLnNsaWNlKDAsMTApKSArICc8L3RkPicgKwog',
  'ICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgdGhEYXRlU2hvcnQoU3RyaW5nKHgubGFzdFNlZW4pLnNsaWNlKDAsMTApKSArICc8L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JyArCiAgICAgICAg',
  'JzxkaXYgY2xhc3M9InJvdyBtdDEyIj48YnV0dG9uIGNsYXNzPSJidG4gZGdyIHNtIiBvbmNsaWNrPSJkb0ZvcmdldEFsbERldmljZXMoKSI+4Lii4LiB4LmA4Lil4Li04LiBIFBJTiDguJfguLjguIHguYDguITguKPguLfguYjguK3guIc8L2J1dHRvbj48L2Rpdj4n',
  'CiAgICAgIDogJycpKTsKfQoKZnVuY3Rpb24gZG9Gb3JnZXRBbGxEZXZpY2VzKCl7CiAgY29uZmlybUFjdGlvbign4Lii4LiB4LmA4Lil4Li04LiBIFBJTiDguJrguJnguJfguLjguIHguYDguITguKPguLfguYjguK3guIfguYPguIrguYjguYTguKvguKEg4oCUIOC4',
  'l+C4uOC4geC5gOC4hOC4o+C4t+C5iOC4reC4h+C4iOC4sOC4leC5ieC4reC4h+C4peC5h+C4reC4geC4reC4tOC4meC4lOC5ieC4p+C4ouC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iCcsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdhdXRoLmZv',
  'cmdldEFsbERldmljZXMnLCB7fSkudGhlbihmdW5jdGlvbihuKXsKICAgICAgc2F2ZURldmljZSgnJyk7CiAgICAgIHRvYXN0KCfguKLguIHguYDguKXguLTguIEgUElOIOC5geC4peC5ieC4pyAnICsgbiArICcg4LmA4LiE4Lij4Li34LmI4Lit4LiHJywgJ29rJyk7',
  'CiAgICAgIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2UgfHwgZSwgJ2VycicpOyB9KTsKICB9KTsKfQoKLyogLS0tLSDguJjguLXguKEgLS0tLSAqLwoKZnVuY3Rpb24gc2V0dGluZ3NUaGVtZUNh',
  'cmQoKXsKICB2YXIgY3VyID0gY3VycmVudFRoZW1lKCk7CiAgcmV0dXJuIGNhcmQoJ/Cfjqgg4LiY4Li14Lih4Liq4Li14Lir4LiZ4LmJ4Liy4LiI4LitJywKICAgICc8ZGl2IGNsYXNzPSJ0aGVtZS1waWNrIj4nICsgVEhFTUVTLm1hcChmdW5jdGlvbih0KXsKICAg',
  'ICAgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJ0aGVtZS1vcHQnICsgKHQuaWQgPT09IGN1ciA/ICcgb24nIDogJycpICsgJyIgb25jbGljaz0ic2V0VGhlbWUoXCcnICsgdC5pZCArICdcJykiPicgKwogICAgICAgICc8c3BhbiBjbGFzcz0iaWMiPicgKyB0LmljICsg',
  'Jzwvc3Bhbj4nICsKICAgICAgICAnPGI+JyArIGVzYyh0LmlkKSArICc8L2I+JyArCiAgICAgICAgJzxzcGFuIGNsYXNzPSJoaW50Ij4nICsgZXNjKHQuaGludCkgKyAnPC9zcGFuPicgKwogICAgICAnPC9idXR0b24+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvZGl2',
  'PicgKwogICAgJzxwIGNsYXNzPSJmczEyIG11dGVkIG10MTIiPuC4mOC4teC4oeC4iOC4s+C5geC4ouC4geC4o+C4suC4ouC5gOC4hOC4o+C4t+C5iOC4reC4hyDguYDguJvguKXguLXguYjguKLguJnguJfguLXguYjguJnguLXguYjguKvguKPguLfguK3guIHguJTg',
  'uJvguLjguYjguKHguKPguLnguJvguJ7guKPguLDguK3guLLguJfguLTguJXguKLguYwv4Lie4Lij4Liw4LiI4Lix4LiZ4LiX4Lij4LmM4Lih4Li44Lih4LiC4Lin4Liy4Lia4LiZ4LiB4LmH4LmE4LiU4LmJJyArCiAgICAoUy5ib290ICYmIFMuYm9vdC5pc0FkbWlu',
  'ID8gJyDCtyDguITguYjguLLguJfguLXguYjguJzguLnguYnguJTguLnguYHguKXguYDguKXguLfguK3guIHguIjguLDguYDguJvguYfguJnguITguYjguLLguJXguLHguYnguIfguJXguYnguJnguYPguKvguYnguYDguITguKPguLfguYjguK3guIfguJfguLXguYjg',
  'uKLguLHguIfguYTguKHguYjguYDguITguKLguJXguLHguYnguIcnIDogJycpICsgJzwvcD4nKTsKfQoKLyogLS0tLSDguIHguKXguLjguYjguKHguITguYjguLLguJXguLHguYnguIfguITguYjguLIgLS0tLSAqLwoKZnVuY3Rpb24gc2V0dGluZ3NSZWFkT25seU5v',
  'dGUoKXsKICByZXR1cm4gY2FyZCgn4pqZ77iPIOC4geC4suC4o+C4leC4seC5ieC4h+C4hOC5iOC4suC4o+C4sOC4muC4micsCiAgICAnPGRpdiBjbGFzcz0iZW1wdHkiPjxkaXYgY2xhc3M9ImJpZyI+8J+UkjwvZGl2PuC5gOC4ieC4nuC4suC4sOC4nOC4ueC5ieC4',
  'lOC4ueC5geC4peC5gOC4l+C5iOC4suC4meC4seC5ieC4meC4l+C4teC5iOC5geC4geC5ieC4geC4suC4o+C4leC4seC5ieC4h+C4hOC5iOC4suC4o+C4sOC4muC4muC5hOC4lOC5iTwvZGl2PicpOwp9CgpmdW5jdGlvbiBzZXR0aW5nc0dyb3Vwc0h0bWwocyl7CiAg',
  'cmV0dXJuIHMuZ3JvdXBzLm1hcChmdW5jdGlvbihnKXsKICAgIHJldHVybiBjYXJkKGcuaWNvbiArICcgJyArIGcuZ3JvdXAsCiAgICAgICc8ZGl2IGNsYXNzPSJmZ3JpZCI+JyArIGcuaXRlbXMubWFwKHNldHRpbmdGaWVsZEh0bWwpLmpvaW4oJycpICsgJzwvZGl2',
  'PicpOwogIH0pLmpvaW4oJycpICsKICBjYXJkKCfwn5K+IOC4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C4leC4seC5ieC4h+C4hOC5iOC4sicsCiAgICAnPHAgY2xhc3M9ImZzMTMgbXV0ZWQiPicgKyBlc2Mocy5zZWNyZXROb3RlKSArICc8L3A+JyArCiAgICAn',
  'PGRpdiBjbGFzcz0icm93IG10MTIiPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0ic2F2ZVNldHRpbmdzRm9ybSgpIj7guJrguLHguJnguJfguLbguIHguJfguLHguYnguIfguKvguKHguJQ8L2J1dHRvbj4nICsKICAgICAgJzxidXR0',
  'b24gY2xhc3M9ImJ0biIgb25jbGljaz0ibG9hZCgpIj7guKLguIHguYDguKXguLTguIHguIHguLLguKPguYHguIHguYnguYTguII8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nKTsKfQoKZnVuY3Rpb24gc2V0dGluZ0ZpZWxkSHRtbChpdCl7CiAgdmFyIGlkID0gJ3Nf',
  'JyArIGl0LmtleTsKICB2YXIgaW5uZXI7CiAgaWYgKGl0LnJlYWRPbmx5KSB7CiAgICBpbm5lciA9ICc8ZGl2IGNsYXNzPSJpbnAiIHN0eWxlPSJiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Y3Vyc29yOmRlZmF1bHQiPicgKyBlc2MoaXQudmFsdWUpICsgJzwv',
  'ZGl2Pic7CiAgfSBlbHNlIGlmIChpdC50eXBlID09PSAnc2VsZWN0JykgewogICAgLy8g4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4Liq4LmI4LiH4Lih4Liy4LmA4Lib4LmH4LiZIHt2YWx1ZSxsYWJlbH0g4LmA4Liq4Lih4Lit',
  'IOKAlCDguITguYjguLLguJfguLXguYjguYDguIHguYfguJrguIHguLHguJrguILguYnguK3guITguKfguLLguKHguJfguLXguYjguYDguKvguYfguJnguK3guLLguIjguITguJnguKXguLDguK3guLHguJkKICAgIGlubmVyID0gJzxzZWxlY3QgY2xhc3M9InNlbCIg',
  'aWQ9IicgKyBpZCArICciPicgKyAoaXQub3B0aW9ucyB8fCBbXSkubWFwKGZ1bmN0aW9uKG8pewogICAgICByZXR1cm4gJzxvcHRpb24gdmFsdWU9IicgKyBlc2Moby52YWx1ZSkgKyAnIicgKyAoby52YWx1ZSA9PT0gaXQudmFsdWUgPyAnIHNlbGVjdGVkJyA6ICcn',
  'KSArCiAgICAgICAgICAgICAnPicgKyBlc2Moby5sYWJlbCkgKyAnPC9vcHRpb24+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvc2VsZWN0Pic7CiAgfSBlbHNlIGlmIChpdC50eXBlID09PSAnbXVsdGlsaW5lJykgewogICAgaW5uZXIgPSAnPHRleHRhcmVhIGNsYXNz',
  'PSJ0YSIgaWQ9IicgKyBpZCArICciPicgKyBlc2MoaXQudmFsdWUpICsgJzwvdGV4dGFyZWE+JzsKICB9IGVsc2UgaWYgKGl0LnR5cGUgPT09ICdudW1iZXInKSB7CiAgICBpbm5lciA9ICc8aW5wdXQgdHlwZT0ibnVtYmVyIiBjbGFzcz0iaW5wIiBpZD0iJyArIGlk',
  'ICsgJyIgdmFsdWU9IicgKyBlc2MoaXQudmFsdWUpICsgJyIgaW5wdXRtb2RlPSJkZWNpbWFsIicgKwogICAgICAoaXQubWluICE9IG51bGwgPyAnIG1pbj0iJyArIGVzYyhpdC5taW4pICsgJyInIDogJycpICsgKGl0Lm1heCAhPSBudWxsID8gJyBtYXg9IicgKyBl',
  'c2MoaXQubWF4KSArICciJyA6ICcnKSArICc+JyArCiAgICAgIChpdC5taW4gIT0gbnVsbCAmJiBpdC5tYXggIT0gbnVsbCA/ICc8ZGl2IGNsYXNzPSJoaW50Ij7guYPguKrguYjguYTguJTguYkgJyArIGVzYyhpdC5taW4pICsgJ+KAkycgKyBlc2MoaXQubWF4KSAr',
  'ICc8L2Rpdj4nIDogJycpOwogIH0gZWxzZSB7CiAgICBpbm5lciA9ICc8aW5wdXQgdHlwZT0idGV4dCIgY2xhc3M9ImlucCIgaWQ9IicgKyBpZCArICciIHZhbHVlPSInICsgZXNjKGl0LnZhbHVlKSArICciPic7CiAgfQogIHJldHVybiAnPGRpdiBjbGFzcz0iZicg',
  'KyAoaXQudHlwZSA9PT0gJ211bHRpbGluZScgPyAnIGZ1bGwnIDogJycpICsgJyI+JyArCiAgICAnPGxhYmVsIGZvcj0iJyArIGlkICsgJyI+JyArIGVzYyhpdC5sYWJlbCkgKyAnPC9sYWJlbD4nICsgaW5uZXIgKwogICAgKGl0Lm5vdGUgPyAnPGRpdiBjbGFzcz0i',
  'aGludCI+JyArIGVzYyhpdC5ub3RlKSArICc8L2Rpdj4nIDogJycpICsgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIHNhdmVTZXR0aW5nc0Zvcm0oKXsKICB2YXIgdmFscyA9IHt9OwogIHZhciBkYXRhID0gUy5jYWNoZS5zZXR0aW5nczsKICBpZiAoIWRhdGEpIHJldHVy',
  'bjsKICBkYXRhLnNldHRpbmdzLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uKGcpewogICAgZy5pdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0KXsKICAgICAgaWYgKGl0LnJlYWRPbmx5KSByZXR1cm47CiAgICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlk',
  'KCdzXycgKyBpdC5rZXkpOwogICAgICBpZiAoZWwpIHZhbHNbaXQua2V5XSA9IGVsLnZhbHVlOwogICAgfSk7CiAgfSk7CiAgY2FsbEFwaSgnc2V0dGluZ3Muc2F2ZScsIHsgdmFsdWVzOiB2YWxzIH0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICBpZiAodmFscy50aGVt',
  'ZSkgeyBsc1NldChMU19USEVNRSwgdmFscy50aGVtZSk7IGFwcGx5VGhlbWUodmFscy50aGVtZSk7IH0KICAgIHRvYXN0KHIuc2F2ZWQgPyAn4Lia4Lix4LiZ4LiX4Li24LiB4LmB4Lil4LmJ4LinICcgKyByLnNhdmVkICsgJyDguKPguLLguKLguIHguLLguKMnIDog',
  'J+C5hOC4oeC5iOC4oeC4teC4reC4sOC5hOC4o+C5gOC4m+C4peC4teC5iOC4ouC4meC5geC4m+C4peC4hycsICdvaycpOwogICAgLy8g4LiE4LmI4Liy4Lia4Liy4LiH4LiV4Lix4LinICjguKPguK3guJrguKPguLXguYDguJ/guKPguIog4LiK4Li34LmI4Lit4Lit',
  '4Liy4LiE4Liy4LijKSDguKHguLXguJzguKXguIHguLHguJrguJfguLHguYnguIfguKvguJnguYnguLIg4LiI4Li24LiH4LmC4Lir4Lil4LiU4LmD4Lir4Lih4LmI4LiX4Lix4LmJ4LiH4LiK4Li44LiUCiAgICByZXR1cm4gY2FsbEFwaSgnYXBwLmJvb3RzdHJhcCcp',
  'LnRoZW4oZnVuY3Rpb24oYil7IFMuYm9vdCA9IGI7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7IH0pOwp9CgovKiAtLS0tIOC4iOC4seC4lOC4geC4suC4o+C4nOC4',
  'ueC5ieC5g+C4iuC5iSAo4Lic4Li54LmJ4LiU4Li54LmB4Lil4LmA4LiX4LmI4Liy4LiZ4Lix4LmJ4LiZKSAtLS0tICovCgpmdW5jdGlvbiBpc0FkbWluTm93KCl7CiAgcmV0dXJuICEhKFMuYm9vdCAmJiBTLmJvb3QuaXNBZG1pbik7Cn0KCmZ1bmN0aW9uIHNldHRp',
  'bmdzVXNlcnNDYXJkKHVzZXJzKXsKICBpZiAoIXVzZXJzKSByZXR1cm4gJyc7CiAgcmV0dXJuIGNhcmQoJ/CfkaUg4Lic4Li54LmJ4LmD4LiK4LmJ4LmD4LiZ4Lij4Liw4Lia4LiaICgnICsgdXNlcnMubGVuZ3RoICsgJyknLAogICAgJzxwIGNsYXNzPSJmczEzIG11',
  'dGVkIj7guYHguIjguIHguIrguLfguYjguK3guJzguLnguYnguYPguIrguYnguYHguKXguLDguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguYnguITguJnguK3guLfguYjguJnguYDguILguYnguLLguKHguLLguJTguLnguKvguKPguLfguK3guIrguYjguKfg',
  'uKLguYHguIHguYnguILguYnguK3guKHguLnguKXguYTguJTguYkgJyArCiAgICAn4LiV4Lix4LmJ4LiH4Liq4Li04LiX4LiY4Li04LmM4LmB4Lii4LiB4Lij4Liy4Lii4LiE4LiZIOC5geC4peC4sOC4o+C4sOC4h+C4seC4muC5hOC4lOC5ieC4l+C4uOC4geC5gOC4',
  'oeC4t+C5iOC4rTwvcD4nICsKICAgICc8ZGl2IGNsYXNzPSJ0dyBtdDEyIj48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICc8dGg+4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJPC90aD48dGg+4LiK4Li34LmI4Lit4LiX4Li14LmI4LmB',
  '4Liq4LiU4LiHPC90aD48dGg+4Liq4Li04LiX4LiY4Li04LmMPC90aD48dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD48dGg+4LmA4LiC4LmJ4Liy4Lil4LmI4Liy4Liq4Li44LiUPC90aD4nICsKICAgICAgJzx0aCBjbGFzcz0ibnVtIj7guK3guLjguJvguIHguKPguJPg',
  'uYw8L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICB1c2Vycy5tYXAoZnVuY3Rpb24odSl7CiAgICAgIHZhciBtZU5vdyA9IChBVVRILm1lICYmIEFVVEgubWUudXNlcm5hbWUpID09PSB1LnVzZXJuYW1lOwogICAgICByZXR1cm4gJzx0cj4n',
  'ICsKICAgICAgICAnPHRkPjxiPicgKyBlc2ModS51c2VybmFtZSkgKyAnPC9iPicgKyAobWVOb3cgPyAnIDxzcGFuIGNsYXNzPSJiIGluZm8iPuC4hOC4uOC4kzwvc3Bhbj4nIDogJycpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZD4nICsgZXNjKHUubmFtZSB8fCAn',
  '4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAnPHRkPicgKyByb2xlQmFkZ2UodS5yb2xlKSArICc8L3RkPicgKwogICAgICAgICc8dGQ+JyArIHN0YXR1c0JhZGdlKHUuc3RhdHVzKSArICh1LmxvY2tlZCA/ICcgPHNwYW4gY2xhc3M9ImIgZGdyIj7guJbguLnguIHg',
  'uKXguYfguK3guIHguIrguLHguYjguKfguITguKPguLLguKc8L3NwYW4+JyA6ICcnKSArICc8L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyAodS5sYXN0TG9naW4gPyB0aERhdGVTaG9ydChTdHJpbmcodS5sYXN0TG9naW4pLnNsaWNlKDAsMTAp',
  'KSA6ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArICh1LmRldmljZXMgfHwgMCkgKyAnPC90ZD4nICsKICAgICAgICAnPHRkIGNsYXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIg',
  'b25jbGljaz0iZm9ybVVzZXIoJyArIGF0dHIodSkgKyAnKSI+4LmB4LiB4LmJ4LmE4LiCPC9idXR0b24+JyArCiAgICAgICAgICAobWVOb3cgPyAnJyA6ICc8YnV0dG9uIGNsYXNzPSJidG4gc20gZGdyIiBvbmNsaWNrPSJkZWxVc2VyKCcgKyBqc3EodS51c2VybmFt',
  'ZSkgKyAnKSI+4Lil4LiaPC9idXR0b24+JykgKwogICAgICAgICc8L3RkPjwvdHI+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgc20iIG9uY2xpY2s9ImZvcm1Vc2VyKCkiPisg',
  '4LmA4Lie4Li04LmI4Lih4Lic4Li54LmJ4LmD4LiK4LmJPC9idXR0b24+Jyk7Cn0KCmZ1bmN0aW9uIHJvbGVCYWRnZShyb2xlKXsKICB2YXIgY2xzID0gcm9sZSA9PT0gJ+C4nOC4ueC5ieC4lOC4ueC5geC4pScgPyAnb2snIDogKHJvbGUgPT09ICfguYHguIHguYng',
  'uYTguILguYTguJTguYknID8gJ2luZm8nIDogJ211dGUnKTsKICByZXR1cm4gJzxzcGFuIGNsYXNzPSJiICcgKyBjbHMgKyAnIj4nICsgZXNjKHJvbGUpICsgJzwvc3Bhbj4nOwp9CgovLyDguKvguKHguLLguKLguYDguKvguJXguLg6IOC5g+C4iuC5iSBhdHRyKCkg',
  '4LiV4Lix4Lin4LmA4LiU4Li14Lii4Lin4LiB4Lix4Lia4LiX4Li14LmIIFZpZXdzLmh0bWwg4Lib4Lij4Liw4LiB4Liy4Lio4LmE4Lin4LmJCi8vIOC5gOC4hOC4ouC4m+C4o+C4sOC4geC4suC4qOC4iuC4t+C5iOC4reC4i+C5ieC4s+C5hOC4p+C5ieC4leC4o+C4',
  'h+C4meC4teC5ieC4hOC4o+C4seC5ieC4h+C4q+C4meC4tuC5iOC4hyDguYHguKXguYnguKfguYTguJvguJfguLHguJrguILguK3guIfguYDguJTguLTguKHguIjguJnguJvguLjguYjguKHguYHguIHguYnguYTguILguJfguLHguYnguIfguKPguLDguJrguJrguJ7g',
  'uLHguIcKLy8gKOC4n+C4reC4o+C5jOC4oeC4guC4tuC5ieC4meC4p+C5iOC4suC4hyDguYHguKXguLDguIHguJTguJrguLHguJnguJfguLbguIHguIHguKXguLLguKLguYDguJvguYfguJnguKrguKPguYnguLLguIfguKPguLLguKLguIHguLLguKPguYPguKvguKHg',
  'uYjguYHguJfguJnguIHguLLguKPguYHguIHguYnguILguK3guIfguYDguJTguLTguKEpCgpmdW5jdGlvbiBmb3JtVXNlcihqc29uKXsKICB2YXIgdSA9IGpzb24gPyAodHlwZW9mIGpzb24gPT09ICdzdHJpbmcnID8gSlNPTi5wYXJzZShqc29uKSA6IGpzb24pIDog',
  'e307CiAgdmFyIGlzTmV3ID0gIXUudXNlcm5hbWU7CgogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiBpc05ldyA/ICfguYDguJ7guLTguYjguKHguJzguLnguYnguYPguIrguYnguYPguKvguKHguYgnIDogJ+C5geC4geC5ieC5hOC4guC4nOC4ueC5ieC5g+C4iuC5iSAn',
  'ICsgdS51c2VybmFtZSwKICAgIGFjdGlvbjogJ3VzZXIuc2F2ZScsCiAgICByZWNvcmQ6IE9iamVjdC5hc3NpZ24oeyBpZDogaXNOZXcgPyAnJyA6IHUudXNlcm5hbWUsIHJvbGU6ICfguJTguLnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcnLCBzdGF0dXM6',
  'ICfguYPguIrguYnguIfguLLguJknIH0sIHUpLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oid1c2VybmFtZScsIGxhYmVsOifguIrguLfguYjguK3guJzguLnguYnguYPguIrguYkgKOC4oOC4suC4qeC4suC4reC4seC4h+C4geC4pOC4qSknLCByZXF1aXJlZDpp',
  'c05ldywgcGg6J+C5gOC4iuC5iOC4mSBzb21jaGFpJywKICAgICAgICBoaW50OiBpc05ldyA/ICdhLXogMC05IC4gXyAtIOC4ouC4suC4pyAz4oCTMjQg4LiV4Lix4LinIMK3IOC5gOC4m+C4peC4teC5iOC4ouC4meC4oOC4suC4ouC4q+C4peC4seC4h+C5hOC4oeC5',
  'iOC5hOC4lOC5iScgOiAn4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmE4Lih4LmI4LmE4LiU4LmJJyB9LAogICAgICB7IGtleTonbmFtZScsIGxhYmVsOifguIrguLfguYjguK3guJfguLXguYjguYHguKrguJTguIcn',
  'LCByZXF1aXJlZDp0cnVlLCBwaDon4LmA4LiK4LmI4LiZIOC4quC4oeC4iuC4suC4oicgfSwKICAgICAgeyBrZXk6J3JvbGUnLCBsYWJlbDon4Liq4Li04LiX4LiY4Li04LmM4LiB4Liy4Lij4LmD4LiK4LmJ4LiH4Liy4LiZJywgdHlwZTonc2VsZWN0JywgYmxhbms6',
  'ZmFsc2UsIHJlcXVpcmVkOnRydWUsCiAgICAgICAgb3B0aW9uczpbJ+C4lOC4ueC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pycsJ+C5geC4geC5ieC5hOC4guC5hOC4lOC5iScsJ+C4nOC4ueC5ieC4lOC4ueC5geC4pSddLAogICAgICAgIGhpbnQ6J+C4lOC4',
  'ueC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pyA9IOC5gOC4m+C4tOC4lOC4lOC4ueC5hOC4lOC5ieC4l+C4uOC4geC4q+C4meC5ieC4siDCtyDguYHguIHguYnguYTguILguYTguJTguYkgPSDguYDguJ7guLTguYjguKEv4LmB4LiB4LmJL+C4peC4muC4guC5',
  'ieC4reC4oeC4ueC4pSDCtyDguJzguLnguYnguJTguLnguYHguKUgPSDguIjguLHguJTguIHguLLguKPguJzguLnguYnguYPguIrguYnguYHguKXguLDguIHguLLguKPguJXguLHguYnguIfguITguYjguLLguYTguJTguYnguJTguYnguKfguKInIH0sCiAgICAgIHsg',
  'a2V5OidwYXNzd29yZCcsIGxhYmVsOiBpc05ldyA/ICfguKPguKvguLHguKrguJzguYjguLLguJnguYDguKPguLTguYjguKHguJXguYnguJknIDogJ+C4leC4seC5ieC4h+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iCAo4LmA4Lin4LmJ4LiZ4Lin',
  '4LmI4Liy4LiHID0g4LmE4Lih4LmI4LmA4Lib4Lil4Li14LmI4Lii4LiZKScsCiAgICAgICAgcmVxdWlyZWQ6aXNOZXcsIHBoOifguK3guKLguYjguLLguIfguJnguYnguK3guKIgOCDguJXguLHguKfguK3guLHguIHguKnguKMnLAogICAgICAgIGhpbnQ6J+C4iOC4',
  'lOC5hOC4p+C5ieC4quC5iOC4h+C5g+C4q+C5ieC5gOC4iOC5ieC4suC4leC4seC4pyDigJQg4Lij4Liw4Lia4Lia4LmA4LiB4LmH4Lia4LmB4Lia4Lia4LmA4LiC4LmJ4Liy4Lij4Lir4Lix4LiqIOC5gOC4m+C4tOC4lOC4lOC4ueC4ouC5ieC4reC4meC4q+C4peC4',
  'seC4h+C5hOC4oeC5iOC5hOC4lOC5iScgfSwKICAgICAgeyBrZXk6J211c3RDaGFuZ2UnLCBsYWJlbDon4LmD4Lir4LmJ4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LiV4Lit4LiZ4LmA4LiC4LmJ4Liy4LiE4Lij4Lix4LmJ4LiH',
  '4LmB4Lij4LiBJywgdHlwZTonc2VsZWN0JywgYmxhbms6ZmFsc2UsCiAgICAgICAgb3B0aW9uczpbe3ZhbHVlOid0cnVlJyxsYWJlbDon4LmD4LiK4LmIICjguYHguJnguLDguJnguLMpJ30se3ZhbHVlOidmYWxzZScsbGFiZWw6J+C5hOC4oeC5iOC4leC5ieC4reC4',
  'hyd9XSB9LAogICAgICB7IGtleTonc3RhdHVzJywgbGFiZWw6J+C4quC4luC4suC4meC4sCcsIHR5cGU6J3NlbGVjdCcsIGJsYW5rOmZhbHNlLCBvcHRpb25zOlsn4LmD4LiK4LmJ4LiH4Liy4LiZJywn4Lij4Liw4LiH4Lix4LiaJ10sCiAgICAgICAgaGludDon4Lij',
  '4Liw4LiH4Lix4LiaID0g4LmA4LiC4LmJ4Liy4Lij4Liw4Lia4Lia4LmE4Lih4LmI4LmE4LiU4LmJ4LiX4Lix4LiZ4LiX4Li1IOC5geC4leC5iOC4ouC4seC4h+C5gOC4geC5h+C4muC4muC4seC4jeC4iuC4teC5hOC4p+C5iScgfSwKICAgICAgeyBrZXk6J25vdGUn',
  'LCBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXSwKICAgIHdpZGU6IHRydWUKICB9KTsKCiAgLy8g4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmA4Lib4Lil4Li14LmI4Lii4LiZ',
  '4LmE4Lih4LmI4LmE4LiU4LmJIOC4peC5h+C4reC4geC4iuC5iOC4reC4h+C5hOC4p+C5ieC5gOC4peC4ouC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC5gOC4guC5ieC4suC5g+C4iOC4nOC4tOC4lAogIGlmICghaXNOZXcpIHsKICAgIHZhciBlbCA9IGRvY3VtZW50',
  'LmdldEVsZW1lbnRCeUlkKCdmX3VzZXJuYW1lJyk7CiAgICBpZiAoZWwpIHsgZWwucmVhZE9ubHkgPSB0cnVlOyBlbC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3ZhcigtLXN1cmZhY2UtMiknOyB9CiAgfQp9CgpmdW5jdGlvbiBkZWxVc2VyKHVzZXJuYW1lKXsKICBjb25m',
  'aXJtQWN0aW9uKCfguKXguJrguJzguLnguYnguYPguIrguYkgIicgKyB1c2VybmFtZSArICciIOC5g+C4iuC5iOC5hOC4q+C4oSDigJQg4LmA4LiC4LmJ4Liy4Lij4Liw4Lia4Lia4LmE4Lih4LmI4LmE4LiU4LmJ4Lit4Li14LiB4LiX4Lix4LiZ4LiX4Li1JywgZnVu',
  'Y3Rpb24oKXsKICAgIGNhbGxBcGkoJ3VzZXIuZGVsZXRlJywgeyB1c2VybmFtZTogdXNlcm5hbWUgfSkudGhlbihmdW5jdGlvbigpewogICAgICB0b2FzdCgn4Lil4Lia4Lic4Li54LmJ4LmD4LiK4LmJ4LmB4Lil4LmJ4LinJywgJ29rJyk7CiAgICAgIGxvYWQoeyBx',
  'dWlldDogdHJ1ZSB9KTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2UgfHwgZSwgJ2VycicpOyB9KTsKICB9KTsKfQoKLyogLS0tLSDguKXguLTguIfguIHguYzguYDguILguYnguLLguYPguIrguYnguIfguLLguJkgLS0tLSAqLwoKZnVu',
  'Y3Rpb24gc2V0dGluZ3NTaGFyZUNhcmQobGlua3MpewogIGlmICghbGlua3MgfHwgIWxpbmtzLmFwcFVybCkgewogICAgcmV0dXJuIGNhcmQoJ/CflJcg4Lil4Li04LiH4LiB4LmM4LmA4LiC4LmJ4Liy4LmD4LiK4LmJ4LiH4Liy4LiZJywKICAgICAgJzxkaXYgY2xh',
  'c3M9ImVtcHR5Ij7guKLguLHguIfguKvguLLguKXguLTguIfguIHguYzguIjguKPguLTguIfguYTguKHguYjguYDguIjguK0g4oCUIOC5gOC4m+C4tOC4lOC5gOC4p+C5h+C4muC5geC4reC4m+C4iOC4suC4geC4peC4tOC4h+C4geC5jOC4l+C4teC5iOC4peC4h+C4',
  'l+C5ieC4suC4oiAvZXhlYyDguKrguLHguIHguITguKPguLHguYnguIcg4LmB4Lil4LmJ4Lin4Lij4Liw4Lia4Lia4LiI4Liw4LiI4Liz4LmD4Lir4LmJ4LmA4Lit4LiHPC9kaXY+Jyk7CiAgfQogIHJldHVybiBjYXJkKCfwn5SXIOC4peC4tOC4h+C4geC5jOC5gOC4',
  'guC5ieC4suC5g+C4iuC5ieC4h+C4suC4mScsCiAgICAnPGRpdiBjbGFzcz0iZiBtYjEyIj48bGFiZWw+4Lil4Li04LiH4LiB4LmM4Lir4Lil4Lix4LiBIOKAlCDguKrguYjguIfguYPguKvguYnguJfguLjguIHguITguJnguYTguJTguYkgKOC5gOC4guC5ieC4suC4',
  'lOC5ieC4p+C4ouC4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5ieC5geC4peC4sOC4o+C4q+C4seC4quC4nOC5iOC4suC4mSk8L2xhYmVsPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJhcHBVcmwiIHJlYWRvbmx5IHZhbHVlPSInICsgZXNjKGxp',
  'bmtzLmFwcFVybCkgKyAnIiBvbmNsaWNrPSJ0aGlzLnNlbGVjdCgpIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJjb3B5RmllbGQoXCdhcHBVcmxcJykiPvCfk4sg',
  '4LiE4Lix4LiU4Lil4Lit4LiB4Lil4Li04LiH4LiB4LmM4Lir4Lil4Lix4LiBPC9idXR0b24+JyArCiAgICAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImYgbWIxMiI+PGxhYmVsPvCfkYAg4Lil4Li04LiH',
  '4LiB4LmM4LiU4Li54Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4Lin4LmB4Lia4Lia4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4Lil4LmH4Lit4LiB4Lit4Li04LiZPC9sYWJlbD4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0ic2hhcmVVcmwiIHJlYWRv',
  'bmx5IHZhbHVlPSInICsgZXNjKGxpbmtzLnZpZXdVcmwpICsgJyIgb25jbGljaz0idGhpcy5zZWxlY3QoKSI+PC9kaXY+JyArCiAgICAnPHAgY2xhc3M9ImZzMTIgJyArIChsaW5rcy5zaGFyZUVuYWJsZWQgPyAnbXV0ZWQnIDogJ3dhcm4tdGV4dCcpICsgJyI+JyAr',
  'CiAgICAgIChsaW5rcy5zaGFyZUVuYWJsZWQKICAgICAgICA/ICfguYDguJvguLTguJTguK3guKLguLnguYgg4oCUIOC5g+C4hOC4o+C4geC5h+C4leC4suC4oeC4l+C4teC5iOC4oeC4teC4peC4tOC4h+C4geC5jOC4meC4teC5ieC5gOC4m+C4tOC4lOC4lOC4ueC4',
  'guC5ieC4reC4oeC4ueC4peC5hOC4lOC5ieC5guC4lOC4ouC5hOC4oeC5iOC4leC5ieC4reC4h+C4peC5h+C4reC4geC4reC4tOC4mScKICAgICAgICA6ICfimqDvuI8g4Lib4Li04LiU4Lit4Lii4Li54LmIIOKAlCDguKXguLTguIfguIHguYzguJnguLXguYnguKLg',
  'uLHguIfguYPguIrguYnguYTguKHguYjguYTguJTguYkg4LmA4Lib4Li04LiU4Liq4Lin4Li04LiV4LiK4LmM4LmE4LiU4LmJ4LiX4Li14LmI4Lir4Lix4Lin4LiC4LmJ4LitICLguITguKfguLLguKHguJvguKXguK3guJTguKDguLHguKLguYHguKXguLDguIHguLLg',
  'uKPguYDguILguYnguLLguYPguIrguYnguIfguLLguJkiIOC4lOC5ieC4suC4meC4muC4mScpICsKICAgICc8L3A+JyArCiAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjb3B5RmllbGQoXCdz',
  'aGFyZVVybFwnKSI+8J+TiyDguITguLHguJTguKXguK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYw8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBkZ3IiIG9uY2xpY2s9ImRvUm90YXRlU2hhcmUoKSI+8J+UgSDguK3guK3guIHguKXg',
  'uLTguIfguIHguYzguYHguIrguKPguYzguYPguKvguKHguYg8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+JyArCiAgICAnPHAgY2xhc3M9ImZzMTIgbXV0ZWQiPvCfhpgg4Lil4Li04LiH4LiB4LmM4LiB4Li54LmJ',
  '4Lij4Liw4Lia4LiaICjguYPguIrguYnguJXguK3guJnguKXguLfguKHguKPguKvguLHguKrguJzguYjguLLguJnguIjguJnguYDguILguYnguLLguYTguKHguYjguYTguJTguYkg4oCUIOC4q+C5ieC4suC4oeC4quC5iOC4h+C4leC5iOC4rSk8YnI+JyArCiAgICAn',
  'PGNvZGUgY2xhc3M9ImZzMTIiPicgKyBlc2MobGlua3MuYWRtaW5VcmwpICsgJzwvY29kZT48L3A+Jyk7Cn0KCmZ1bmN0aW9uIGNvcHlGaWVsZChpZCl7CiAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpOwogIGlmICghZWwpIHJldHVybjsKICBl',
  'bC5zZWxlY3QoKTsKICB0cnkgeyBkb2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpOyB0b2FzdCgn4LiE4Lix4LiU4Lil4Lit4LiB4LmB4Lil4LmJ4LinJywgJ29rJyk7IH0KICBjYXRjaCAoZSkgeyB0b2FzdCgn4LiB4LiU4LiE4LmJ4Liy4LiH4LiX4Li14LmI4LiK',
  '4LmI4Lit4LiH4LmB4Lil4LmJ4Lin4LmA4Lil4Li34Lit4LiBIOC4hOC4seC4lOC4peC4reC4gScsICdlcnInKTsgfQp9Cjwvc2NyaXB0Pgo8c2NyaXB0PgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0K',
  'ICAgRm9ybXMuaHRtbCDigJQg4Lif4Lit4Lij4LmM4Lih4LmA4Lie4Li04LmI4LihL+C5geC4geC5ieC5hOC4giDguYHguKXguLDguIHguLLguKPguKXguJoKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'ICovCgp2YXIgRk9STSA9IHsKICBzcGVjczogW10sICAgICAgIC8vIOC4nOC4seC4h+C4iuC5iOC4reC4h+C4geC4o+C4reC4geC4guC4reC4h+C4n+C4reC4o+C5jOC4oeC4l+C4teC5iOC5gOC4m+C4tOC4lOC4reC4ouC4ueC5iAogIGtlZXA6IHt9LCAgICAgICAg',
  'Ly8g4LmE4Lif4Lil4LmM4LmB4LiZ4Lia4LmA4LiU4Li04Lih4LiX4Li14LmI4Lii4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJ4LmA4Lit4Liy4Lit4Lit4LiBCiAgYnVja2V0OiAnbWlzYycsICAvLyDguYLguJ/guKXguYDguJTguK3guKPguYzguJfguLXguYjguIjg',
  'uLDguYDguIHguYfguJrguYTguJ/guKXguYzguYHguJnguJrguYPguKvguKHguYgKICBvY3I6IG51bGwsICAgICAgIC8vIOC4nOC4seC4h+C4geC4suC4o+C5gOC4leC4tOC4oeC4hOC5iOC4suC4iOC4suC4geC4o+C4ueC4mwogIHJlYzogbnVsbCwgICAgICAgLy8g',
  '4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4LiB4Liz4Lil4Lix4LiH4LmB4LiB4LmJ4Lit4Lii4Li54LmIIChudWxsID0g4LiB4Liz4Lil4Lix4LiH4LmA4Lie4Li04LmI4Lih4Lij4Liy4Lii4LiB4Liy4Lij4LmD4Lir4Lih4LmIKQogIGxpbmVzOiBbXSwgICAg',
  'ICAgLy8g4Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4Lii4LmD4LiZ4Lia4Li04LilICjguYPguIrguYnguIHguLHguJrguIrguYjguK3guIfguIrguJnguLTguJQgbGluZXMpCiAgdG9kbzogW10sICAgICAgICAvLyDguYDguIrguYfguITguKXguLTguKrguJXg',
  'uYzguIfguLLguJnguIvguYjguK3guKEgKOC5g+C4iuC5ieC4geC4seC4muC4iuC5iOC4reC4h+C4iuC4meC4tOC4lCB0b2RvKQogIHRvZG9PcHRpb25zOiBbXSAgLy8g4LiV4Lix4Lin4LmA4Lil4Li34Lit4LiB4Lib4Lij4Liw4LmA4Lig4LiX4LiH4Liy4LiZ4LiC',
  '4Lit4LiH4LmB4LiV4LmI4Lil4Liw4LiC4LmJ4LitCn07CgovKiAtLS0tLS0tLS0tLS0tLS0tIGZvcm0gZW5naW5lIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIGZpZWxkc0h0bWwoc3BlY3MsIHJlYyl7CiAgcmVjID0gcmVjIHx8IHt9OwogIEZPUk0uc3Bl',
  'Y3MgPSBzcGVjczsKICBGT1JNLmtlZXAgPSB7fTsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImZncmlkIj4nICsgc3BlY3MubWFwKGZ1bmN0aW9uKGYpewogICAgdmFyIHYgPSByZWNbZi5rZXldOwogICAgdmFyIGlkID0gJ2ZfJyArIGYua2V5OwogICAgdmFyIGlubmVy',
  'OwoKICAgIGlmIChmLnR5cGUgPT09ICdzZWxlY3QnKSB7CiAgICAgIHZhciBvcHRzID0gKGYub3B0aW9ucyB8fCBbXSkubWFwKGZ1bmN0aW9uKG8pewogICAgICAgIHZhciB2YWwgPSB0eXBlb2YgbyA9PT0gJ29iamVjdCcgPyBvLnZhbHVlIDogbzsKICAgICAgICB2',
  'YXIgbGFiID0gdHlwZW9mIG8gPT09ICdvYmplY3QnID8gby5sYWJlbCA6IG87CiAgICAgICAgcmV0dXJuICc8b3B0aW9uIHZhbHVlPSInICsgZXNjKHZhbCkgKyAnIicgKyAoU3RyaW5nKHYpID09PSBTdHJpbmcodmFsKSA/ICcgc2VsZWN0ZWQnIDogJycpICsgJz4n',
  'ICsgZXNjKGxhYikgKyAnPC9vcHRpb24+JzsKICAgICAgfSkuam9pbignJyk7CiAgICAgIGlubmVyID0gJzxzZWxlY3QgY2xhc3M9InNlbCIgaWQ9IicgKyBpZCArICciPicgKyAoZi5ibGFuayAhPT0gZmFsc2UgPyAnPG9wdGlvbiB2YWx1ZT0iIj7igJQg4LmA4Lil',
  '4Li34Lit4LiBIOKAlDwvb3B0aW9uPicgOiAnJykgKyBvcHRzICsgJzwvc2VsZWN0Pic7CgogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICd0ZXh0YXJlYScpIHsKICAgICAgaW5uZXIgPSAnPHRleHRhcmVhIGNsYXNzPSJ0YSIgaWQ9IicgKyBpZCArICciIHBsYWNl',
  'aG9sZGVyPSInICsgZXNjKGYucGh8fCcnKSArICciPicgKyBlc2Modnx8JycpICsgJzwvdGV4dGFyZWE+JzsKCiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ2ZpbGVzJykgewogICAgICBGT1JNLmtlZXBbZi5rZXldID0gKHJlY1tmLmtleV0gJiYgcmVjW2Yua2V5',
  'XS5sZW5ndGgpID8gW10uY29uY2F0KHJlY1tmLmtleV0pIDogW107CiAgICAgIGlubmVyID0KICAgICAgICAnPGRpdiBpZD0iJyArIGlkICsgJ19leGlzdGluZyI+JyArIGV4aXN0aW5nRmlsZXNIdG1sKGYua2V5KSArICc8L2Rpdj4nICsKICAgICAgICAnPGxhYmVs',
  'IGNsYXNzPSJmaWxlLWRyb3AiIGZvcj0iJyArIGlkICsgJyI+8J+TjiDguYHguJXguLDguYDguJ7guLfguYjguK3guYDguKXguLfguK3guIHguYTguJ/guKXguYwgKOC5gOC4peC4t+C4reC4geC5hOC4lOC5ieC4q+C4peC4suC4ouC5hOC4n+C4peC5jCDCtyDguYTg',
  'uKHguYjguYDguIHguLTguJkgMTIgTUIg4LiV4LmI4Lit4LmE4Lif4Lil4LmMKScgKwogICAgICAgICc8aW5wdXQgdHlwZT0iZmlsZSIgaWQ9IicgKyBpZCArICciIG11bHRpcGxlIGFjY2VwdD0iaW1hZ2UvKixhcHBsaWNhdGlvbi9wZGYiIHN0eWxlPSJkaXNwbGF5',
  'Om5vbmUiICcgKwogICAgICAgICdvbmNoYW5nZT0icHJldmlld1BpY2tlZCh0aGlzLFwnJyArIGlkICsgJ1wnKSI+PC9sYWJlbD4nICsKICAgICAgICAnPGRpdiBpZD0iJyArIGlkICsgJ19wcmV2aWV3IiBjbGFzcz0idGh1bWJzIG10OCI+PC9kaXY+JyArCiAgICAg',
  'ICAgJzxkaXYgaWQ9IicgKyBpZCArICdfb2NyIj48L2Rpdj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAndG9kbycpIHsKICAgICAgRk9STS50b2RvID0gcGFyc2VUb2RvVGV4dCh2KTsKICAgICAgRk9STS50b2RvT3B0aW9ucyA9IGYub3B0aW9ucyB8fCBb',
  'XTsKICAgICAgaW5uZXIgPSAnPGRpdiBpZD0iJyArIGlkICsgJyIgY2xhc3M9InRvZG8iPicgKyB0b2RvVGFibGVIdG1sKCkgKyAnPC9kaXY+JzsKCiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ2xpbmVzJykgewogICAgICBGT1JNLmxpbmVzID0gcGFyc2VMaW5l',
  'c1RleHQodik7CiAgICAgIGlubmVyID0gJzxkaXYgaWQ9IicgKyBpZCArICciIGNsYXNzPSJsaW5lcyI+JyArIGxpbmVzVGFibGVIdG1sKCkgKyAnPC9kaXY+JzsKCiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ2NvbXB1dGVkJykgewogICAgICBpbm5lciA9ICc8',
  'ZGl2IGNsYXNzPSJpbnAiIGlkPSInICsgaWQgKyAnIiBzdHlsZT0iYmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpO2ZvbnQtd2VpZ2h0OjYwMDsnICsKICAgICAgICAgICAgICAnZm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zO2N1cnNvcjpkZWZhdWx0',
  'Ij4wPC9kaXY+JzsKCiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ2RhdGUnKSB7CiAgICAgIGlubmVyID0gJzxpbnB1dCB0eXBlPSJkYXRlIiBjbGFzcz0iaW5wIiBpZD0iJyArIGlkICsgJyIgdmFsdWU9IicgKyBlc2ModiB8fCAnJykgKyAnIj4nOwoKICAgIH0g',
  'ZWxzZSBpZiAoZi50eXBlID09PSAnbnVtYmVyJyB8fCBmLnR5cGUgPT09ICdtb25leScpIHsKICAgICAgaW5uZXIgPSAnPGlucHV0IHR5cGU9Im51bWJlciIgc3RlcD0iJyArIChmLnR5cGUgPT09ICdtb25leScgPyAnMC4wMScgOiAnMScpICsgJyIgY2xhc3M9Imlu',
  'cCIgaWQ9IicgKyBpZCArICciICcgKwogICAgICAgICAgICAgICd2YWx1ZT0iJyArICh2ID09IG51bGwgfHwgdiA9PT0gJycgPyAnJyA6IGVzYyh2KSkgKyAnIiBwbGFjZWhvbGRlcj0iJyArIGVzYyhmLnBofHwnJykgKyAnIiBpbnB1dG1vZGU9ImRlY2ltYWwiJyAr',
  'CiAgICAgICAgICAgICAgKGYuc3VtcyA/ICcgb25pbnB1dD0icmVjYWxjU3VtcygpIicgOiAoZi5vbmlucHV0ID8gJyBvbmlucHV0PSInICsgZXNjKGYub25pbnB1dCkgKyAnIicgOiAnJykpICsgJz4nOwoKICAgIH0gZWxzZSB7CiAgICAgIGlubmVyID0gJzxpbnB1',
  'dCB0eXBlPSJ0ZXh0IiBjbGFzcz0iaW5wIiBpZD0iJyArIGlkICsgJyIgdmFsdWU9IicgKyBlc2ModiB8fCAnJykgKyAnIiBwbGFjZWhvbGRlcj0iJyArIGVzYyhmLnBofHwnJykgKyAnIj4nOwogICAgfQoKICAgIHJldHVybiAnPGRpdiBjbGFzcz0iZicgKyAoZi5m',
  'dWxsID8gJyBmdWxsJyA6ICcnKSArICciPicgKwogICAgICAnPGxhYmVsIGZvcj0iJyArIGlkICsgJyI+JyArIGVzYyhmLmxhYmVsKSArIChmLnJlcXVpcmVkID8gJyA8c3BhbiBzdHlsZT0iY29sb3I6dmFyKC0tZGFuZ2VyKSI+Kjwvc3Bhbj4nIDogJycpICsgJzwv',
  'bGFiZWw+JyArCiAgICAgIGlubmVyICsgKGYuaGludCA/ICc8ZGl2IGNsYXNzPSJoaW50Ij4nICsKICAgICAgICAoZi5oaW50LmNoYXJBdCgwKSA9PT0gJzwnID8gZi5oaW50IDogZXNjKGYuaGludCkpICsgJzwvZGl2PicgOiAnJykgKyAnPC9kaXY+JzsKICB9KS5q',
  'b2luKCcnKSArICc8L2Rpdj4nOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4LmA4LiK4LmH4LiE4Lil4Li04Liq4LiV4LmM4LiH4Liy4LiZ4LiL4LmI4Lit4LihIOKAlCDguYDguILg',
  'uYnguLLguIvguYjguK3guKHguITguKPguLHguYnguIfguYDguJTguLXguKLguKfguKHguLHguIHguIvguYjguK3guKHguKvguKXguLLguKLguIjguLjguJQKCiAgIOC5gOC4geC5h+C4muC4peC4h+C4iuC4teC4leC4muC4o+C4o+C4l+C4seC4lOC4peC4sOC4h+C4',
  'suC4mSAgW3hdIOC4iuC4t+C5iOC4reC4h+C4suC4mSB8IOC4m+C4o+C4sOC5gOC4oOC4l+C4h+C4suC4mQogICAo4Lij4Li54Lib4LmB4Lia4Lia4LmA4LiU4Li14Lii4Lin4LiB4Lix4LiaIHBhcnNlVG9kb18g4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif',
  '4LmA4Lin4Lit4Lij4LmMIOKAlCDguYHguIHguYnguJfguLXguYjguYTguKvguJnguJXguYnguK3guIfguYHguIHguYnguYPguKvguYnguJXguKPguIfguIHguLHguJkpCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PSAqLwoKZnVuY3Rpb24gcGFyc2VUb2RvVGV4dCh0ZXh0KXsKICB2YXIgcmF3ID0gU3RyaW5nKHRleHQgPT0gbnVsbCA/ICcnIDogdGV4dCk7CiAgaWYgKCFyYXcudHJpbSgpKSByZXR1cm4gW107CiAgdmFyIGxpbmVzID0gcmF3LnNwbGl0KC9ccj9c',
  'bi8pLm1hcChmdW5jdGlvbihsKXsgcmV0dXJuIGwudHJpbSgpOyB9KS5maWx0ZXIoQm9vbGVhbik7CgogIC8vIOC4guC4reC4h+C5gOC4lOC4tOC4oeC5gOC4guC4teC4ouC4meC4o+C4p+C4oeC4muC4o+C4o+C4l+C4seC4lOC5gOC4lOC4teC4ouC4p+C4p+C5iOC4',
  'siAiMS7guKLguLLguYHguJnguKcgMi7guYDguIHguYfguJrguKrguLXguKvguYnguK3guIciCiAgaWYgKGxpbmVzLmxlbmd0aCA9PT0gMSAmJiAvXGRccypbLildLy50ZXN0KGxpbmVzWzBdKSAmJiBsaW5lc1swXS5jaGFyQXQoMCkgIT09ICdbJykgewogICAgbGlu',
  'ZXMgPSBsaW5lc1swXS5zcGxpdCgvXHMqXGQrXHMqWy4pXVxzKi8pLm1hcChmdW5jdGlvbih4KXsgcmV0dXJuIHgudHJpbSgpOyB9KS5maWx0ZXIoQm9vbGVhbik7CiAgfQoKICByZXR1cm4gbGluZXMubWFwKGZ1bmN0aW9uKGxpbmUpewogICAgdmFyIGRvbmUgPSBm',
  'YWxzZTsKICAgIHZhciBtID0gbGluZS5tYXRjaCgvXlxbXHMqKFt4WOKck10pP1xzKlxdXHMqKC4qKSQvKTsKICAgIGlmIChtKSB7IGRvbmUgPSAhIW1bMV07IGxpbmUgPSBtWzJdOyB9CiAgICBsaW5lID0gbGluZS5yZXBsYWNlKC9eXGQrXHMqWy4pXVxzKi8sICcn',
  'KS50cmltKCk7CiAgICB2YXIgYSA9IGxpbmUuc3BsaXQoJ3wnKTsKICAgIHJldHVybiB7IGRvbmU6IGRvbmUsIG5hbWU6IChhWzBdIHx8ICcnKS50cmltKCksIGNhdGVnb3J5OiAoYVsxXSB8fCAnJykudHJpbSgpIH07CiAgfSkuZmlsdGVyKGZ1bmN0aW9uKHQpeyBy',
  'ZXR1cm4gdC5uYW1lOyB9KTsKfQoKZnVuY3Rpb24gZm9ybWF0VG9kb1RleHQobGlzdCl7CiAgcmV0dXJuIChsaXN0IHx8IFtdKQogICAgLmZpbHRlcihmdW5jdGlvbih0KXsgcmV0dXJuIFN0cmluZyh0Lm5hbWUgfHwgJycpLnRyaW0oKTsgfSkKICAgIC5tYXAoZnVu',
  'Y3Rpb24odCl7CiAgICAgIHZhciBubSA9IFN0cmluZyh0Lm5hbWUpLnJlcGxhY2UoL1x8L2csICcvJykudHJpbSgpOwogICAgICB2YXIgY3QgPSBTdHJpbmcodC5jYXRlZ29yeSB8fCAnJykucmVwbGFjZSgvXHwvZywgJy8nKS50cmltKCk7CiAgICAgIHJldHVybiAn',
  'WycgKyAodC5kb25lID8gJ3gnIDogJyAnKSArICddICcgKyBubSArIChjdCA/ICcgfCAnICsgY3QgOiAnJyk7CiAgICB9KS5qb2luKCdcbicpOwp9CgpmdW5jdGlvbiB0b2RvRG9uZSgpeyByZXR1cm4gKEZPUk0udG9kbyB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uKHQp',
  'eyByZXR1cm4gdC5kb25lOyB9KS5sZW5ndGg7IH0KCmZ1bmN0aW9uIHRvZG9UYWJsZUh0bWwoKXsKICB2YXIgb3B0cyA9IEZPUk0udG9kb09wdGlvbnMgfHwgW107CiAgdmFyIHJvd3MgPSAoRk9STS50b2RvIHx8IFtdKS5tYXAoZnVuY3Rpb24odCwgaSl7CiAgICBy',
  'ZXR1cm4gJzxkaXYgY2xhc3M9InRvZG8tcm93JyArICh0LmRvbmUgPyAnIGRvbmUnIDogJycpICsgJyI+JyArCiAgICAgICc8bGFiZWwgY2xhc3M9InRvZG8tY2hlY2siIHRpdGxlPSInICsgKHQuZG9uZSA/ICfguJfguLPguYDguKrguKPguYfguIjguYHguKXguYng',
  'uKcnIDogJ+C4ouC4seC4h+C5hOC4oeC5iOC5hOC4lOC5ieC4l+C4sycpICsgJyI+JyArCiAgICAgICAgJzxpbnB1dCB0eXBlPSJjaGVja2JveCInICsgKHQuZG9uZSA/ICcgY2hlY2tlZCcgOiAnJykgKyAnIG9uY2hhbmdlPSJzZXRUb2RvKCcgKyBpICsgJyxcJ2Rv',
  'bmVcJyx0aGlzLmNoZWNrZWQpIj4nICsKICAgICAgJzwvbGFiZWw+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgcGxhY2Vob2xkZXI9IuC4h+C4suC4meC4l+C4teC5iOC4leC5ieC4reC4h+C4i+C5iOC4reC4oSIgdmFsdWU9IicgKyBlc2ModC5uYW1lIHx8',
  'ICcnKSArICciICcgKwogICAgICAgICdvbmlucHV0PSJzZXRUb2RvKCcgKyBpICsgJyxcJ25hbWVcJyx0aGlzLnZhbHVlKSI+JyArCiAgICAgICc8c2VsZWN0IGNsYXNzPSJzZWwiIG9uY2hhbmdlPSJzZXRUb2RvKCcgKyBpICsgJyxcJ2NhdGVnb3J5XCcsdGhpcy52',
  'YWx1ZSkiPicgKwogICAgICAgICc8b3B0aW9uIHZhbHVlPSIiPuKAlCDguJvguKPguLDguYDguKDguJfguIfguLLguJkg4oCUPC9vcHRpb24+JyArCiAgICAgICAgb3B0cy5tYXAoZnVuY3Rpb24obyl7CiAgICAgICAgICByZXR1cm4gJzxvcHRpb24gdmFsdWU9Iicg',
  'KyBlc2MobykgKyAnIicgKyAobyA9PT0gdC5jYXRlZ29yeSA/ICcgc2VsZWN0ZWQnIDogJycpICsgJz4nICsgZXNjKG8pICsgJzwvb3B0aW9uPic7CiAgICAgICAgfSkuam9pbignJykgKwogICAgICAnPC9zZWxlY3Q+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1',
  'dHRvbiIgY2xhc3M9ImJ0biBzbSBkZ3IiIHRpdGxlPSLguYDguK3guLLguIfguLLguJnguJnguLXguYnguK3guK3guIEiIG9uY2xpY2s9ImRlbFRvZG8oJyArIGkgKyAnKSI+w5c8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nOwogIH0pLmpvaW4oJycpOwoKICB2YXIg',
  'biA9IChGT1JNLnRvZG8gfHwgW10pLmxlbmd0aCwgZCA9IHRvZG9Eb25lKCk7CiAgcmV0dXJuIChyb3dzIHx8ICc8ZGl2IGNsYXNzPSJoaW50IiBzdHlsZT0icGFkZGluZzo4cHggMnB4Ij7guKLguLHguIfguYTguKHguYjguKHguLXguIfguLLguJkg4oCUIOC4geC4',
  'lCDigJzguYDguJ7guLTguYjguKHguIfguLLguJnigJ0g4LmA4Lie4Li34LmI4Lit4LmD4Liq4LmI4LiX4Li14Lil4Liw4LiI4Li44LiU4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LiL4LmI4Lit4LihPC9kaXY+JykgKwogICAgJzxkaXYgY2xhc3M9InJvdyBtdDgiPicg',
  'KwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImFkZFRvZG8oKSI+KyDguYDguJ7guLTguYjguKHguIfguLLguJk8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBv',
  'bmNsaWNrPSJwYXN0ZVRvZG8oKSI+8J+TiyDguKfguLLguIfguJfguLXguYDguJTguLXguKLguKfguKvguKXguLLguKLguIfguLLguJk8L2J1dHRvbj4nICsKICAgICAgKG4gPyAnPGRpdiBjbGFzcz0idG9kby1jb3VudCI+4LmA4Liq4Lij4LmH4LiI4LmB4Lil4LmJ',
  '4LinIDxiPicgKyBkICsgJy8nICsgbiArICc8L2I+IOC4h+C4suC4mTwvZGl2PicgOiAnJykgKwogICAgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIHJlZHJhd1RvZG8oKXsKICB2YXIgYm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfaXRlbXMnKTsKICBpZiAo',
  'IWJveCkgcmV0dXJuOwogIGJveC5pbm5lckhUTUwgPSB0b2RvVGFibGVIdG1sKCk7Cn0KCmZ1bmN0aW9uIHNldFRvZG8oaSwga2V5LCB2YWwpewogIGlmICghRk9STS50b2RvW2ldKSByZXR1cm47CiAgRk9STS50b2RvW2ldW2tleV0gPSAoa2V5ID09PSAnZG9uZScp',
  'ID8gISF2YWwgOiB2YWw7CiAgaWYgKGtleSA9PT0gJ2RvbmUnKSB7IHJlZHJhd1RvZG8oKTsgcmV0dXJuOyB9ICAgLy8g4LiV4Li04LmK4LiB4LmB4Lil4LmJ4Lin4Lin4Liy4LiU4LmD4Lir4Lih4LmI4LmD4Lir4LmJ4LiC4Li14LiU4LiG4LmI4Liy4LmA4Lir4LmH',
  '4LiZ4LiK4Lix4LiUCiAgdmFyIGMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZl9pdGVtcyAudG9kby1jb3VudCBiJyk7CiAgaWYgKGMpIGMudGV4dENvbnRlbnQgPSB0b2RvRG9uZSgpICsgJy8nICsgRk9STS50b2RvLmxlbmd0aDsKfQoKZnVuY3Rpb24gYWRk',
  'VG9kbygpewogIEZPUk0udG9kby5wdXNoKHsgZG9uZTogZmFsc2UsIG5hbWU6ICcnLCBjYXRlZ29yeTogJycgfSk7CiAgcmVkcmF3VG9kbygpOwogIHZhciBpbnB1dHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjZl9pdGVtcyAudG9kby1yb3cgLmlucCcp',
  'OwogIGlmIChpbnB1dHMubGVuZ3RoKSBpbnB1dHNbaW5wdXRzLmxlbmd0aCAtIDFdLmZvY3VzKCk7Cn0KCmZ1bmN0aW9uIGRlbFRvZG8oaSl7CiAgRk9STS50b2RvLnNwbGljZShpLCAxKTsKICByZWRyYXdUb2RvKCk7Cn0KCi8qKiDguKfguLLguIfguKPguLLguKLg',
  'uIHguLLguKPguJfguLXguYjguJXguYnguK3guIfguIvguYjguK3guKHguJfguLXguYDguJTguLXguKLguKfguKvguKXguLLguKLguJrguKPguKPguJfguLHguJQg4LmB4Lil4LmJ4Lin4LmD4Lir4LmJ4Lij4Liw4Lia4Lia4LmB4Lii4LiB4LmD4Lir4LmJICovCmZ1',
  'bmN0aW9uIHBhc3RlVG9kbygpewogIHZhciBib3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9kb1Bhc3RlV3JhcCcpOwogIGlmIChib3gpIHsgYm94LmhpZGRlbiA9ICFib3guaGlkZGVuOyBpZiAoIWJveC5oaWRkZW4pIGRvY3VtZW50LmdldEVsZW1lbnRC',
  'eUlkKCd0b2RvUGFzdGVCb3gnKS5mb2N1cygpOyByZXR1cm47IH0KCiAgdmFyIGhvc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9pdGVtcycpOwogIGlmICghaG9zdCkgcmV0dXJuOwogIHZhciB3cmFwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2',
  'Jyk7CiAgd3JhcC5pZCA9ICd0b2RvUGFzdGVXcmFwJzsKICB3cmFwLmNsYXNzTmFtZSA9ICdtdDgnOwogIHdyYXAuaW5uZXJIVE1MID0KICAgICc8dGV4dGFyZWEgY2xhc3M9InRhIiBpZD0idG9kb1Bhc3RlQm94IiBzdHlsZT0ibWluLWhlaWdodDoxMTBweCIgJyAr',
  'CiAgICAgICdwbGFjZWhvbGRlcj0i4Lii4Liy4LmB4LiZ4Lin4Lir4LmJ4Lit4LiH4LiZ4LmJ4LizJiMxMDvguYDguIHguYfguJrguKrguLXguKvguYnguK3guIcmIzEwO+C5gOC4m+C4peC4teC5iOC4ouC4meC4geC5iuC4reC4geC4meC5ieC4s+C4peC5ieC4suC4',
  'h+C4iOC4suC4mSI+PC90ZXh0YXJlYT4nICsKICAgICc8ZGl2IGNsYXNzPSJoaW50IG10OCI+4Lia4Lij4Lij4LiX4Lix4LiU4Lil4Liw4Lir4LiZ4Li24LmI4LiH4LiH4Liy4LiZIMK3IOC4q+C4o+C4t+C4reC4nuC4tOC4oeC4nuC5jOC4o+C4p+C4oeC4muC4o+C4',
  'o+C4l+C4seC4lOC5gOC4lOC4teC4ouC4p+C5geC4muC4miDigJwxLuC4ouC4suC5geC4meC4pyAyLuC5gOC4geC5h+C4muC4quC4teC4q+C5ieC4reC4h+KAnSDguIHguYfguYTguJTguYk8YnI+JyArCiAgICAgICfguYPguKrguYjguJvguKPguLDguYDguKDguJfg',
  'uIfguLLguJnguJfguLXguKvguKXguLHguIfguIjguLLguIHguIrguYjguK3guIfguILguYnguLLguIcg4LmGIOC5geC4leC5iOC4peC4sOC4h+C4suC4mTwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InJvdyBtdDgiPicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJi',
  'dXR0b24iIGNsYXNzPSJidG4gc20gcHJpIiBvbmNsaWNrPSJhcHBseVBhc3RlZFRvZG8oKSI+4LmA4Lie4Li04LmI4Lih4LmA4LiC4LmJ4Liy4Lij4Liy4Lii4LiB4Liy4LijPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0',
  'biBzbSIgb25jbGljaz0iZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCd0b2RvUGFzdGVXcmFwXCcpLmhpZGRlbj10cnVlIj7guJvguLTguJQ8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nOwogIGhvc3QuYXBwZW5kQ2hpbGQod3JhcCk7CiAgZG9jdW1lbnQuZ2V0RWxl',
  'bWVudEJ5SWQoJ3RvZG9QYXN0ZUJveCcpLmZvY3VzKCk7Cn0KCmZ1bmN0aW9uIGFwcGx5UGFzdGVkVG9kbygpewogIHZhciB0ZXh0ID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2RvUGFzdGVCb3gnKSB8fCB7fSkudmFsdWUgfHwgJyc7CiAgdmFyIGFkZGVk',
  'ID0gcGFyc2VUb2RvVGV4dCh0ZXh0KTsKICBpZiAoIWFkZGVkLmxlbmd0aCkgcmV0dXJuIHRvYXN0KCfguYTguKHguYjguJ7guJrguIfguLLguJnguJfguLXguYjguK3guYjguLLguJnguYTguJTguYknLCAnZXJyJyk7CiAgRk9STS50b2RvID0gKEZPUk0udG9kbyB8',
  'fCBbXSkuZmlsdGVyKGZ1bmN0aW9uKHQpeyByZXR1cm4gU3RyaW5nKHQubmFtZSB8fCAnJykudHJpbSgpOyB9KS5jb25jYXQoYWRkZWQpOwogIHJlZHJhd1RvZG8oKTsKICB0b2FzdCgn4LmA4Lie4Li04LmI4Lih4LmD4Lir4LmJICcgKyBhZGRlZC5sZW5ndGggKyAn',
  'IOC4h+C4suC4mScsICdvaycpOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lia4Li04Lil4LmA4LiU4Li14Lii4Lin4Lir4Lil4Liy4Lii4Lij4Liy4Lii4LiB4Liy4LijIOKAlCDg',
  'uIvguLfguYnguK3guK3guK3guJnguYTguKXguJnguYzguJfguLXguYDguJTguLXguKLguKfguYTguJTguYnguILguK3guIfguKvguKXguLLguKLguK3guKLguYjguLLguIcKCiAgIOC5gOC4geC5h+C4muC4peC4h+C4iuC4teC4leC5gOC4m+C5h+C4meC4guC5ieC4',
  'reC4hOC4p+C4suC4oSDguJrguKPguKPguJfguLHguJTguKXguLDguKPguLLguKLguIHguLLguKMgIOC4iuC4t+C5iOC4rSB8IOC4iOC4s+C4meC4p+C4mSB8IOC4q+C4meC5iOC4p+C4oiB8IOC4o+C4suC4hOC4suC4leC5iOC4reC4q+C4meC5iOC4p+C4ogogICAo',
  '4Lij4Li54Lib4LmB4Lia4Lia4LmA4LiU4Li14Lii4Lin4LiB4Lix4LiaIHBhcnNlTGluZXNfIOC4neC4seC5iOC4h+C5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jCDigJQg4LmB4LiB4LmJ4LiX4Li14LmI4LmE4Lir4LiZ4LiV4LmJ4Lit4LiH4LmB4LiB',
  '4LmJ4LmD4Lir4LmJ4LiV4Lij4LiH4LiB4Lix4LiZKQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCmZ1bmN0aW9uIHBhcnNlTGluZXNUZXh0KHRleHQpewogIHJldHVybiBTdHJpbmcodGV4',
  'dCA9PSBudWxsID8gJycgOiB0ZXh0KS5zcGxpdCgvXHI/XG4vKQogICAgLm1hcChmdW5jdGlvbihzKXsgcmV0dXJuIHMudHJpbSgpOyB9KS5maWx0ZXIoQm9vbGVhbikKICAgIC5tYXAoZnVuY3Rpb24ocmF3KXsKICAgICAgdmFyIGEgPSByYXcuc3BsaXQoJ3wnKS5t',
  'YXAoZnVuY3Rpb24oeCl7IHJldHVybiB4LnRyaW0oKTsgfSk7CiAgICAgIHZhciBuYW1lID0gYVswXSB8fCAnJywgcXR5ID0gMSwgdW5pdCA9ICcnLCBwcmljZSA9IDA7CiAgICAgIGlmIChhLmxlbmd0aCA+PSA0KSAgICAgIHsgcXR5ID0gbnVtT3IoYVsxXSwgMSk7',
  'IHVuaXQgPSBhWzJdIHx8ICcnOyBwcmljZSA9IG51bU9yKGFbM10sIDApOyB9CiAgICAgIGVsc2UgaWYgKGEubGVuZ3RoID09PSAzKXsgcXR5ID0gbnVtT3IoYVsxXSwgMSk7IHByaWNlID0gbnVtT3IoYVsyXSwgMCk7IH0KICAgICAgZWxzZSBpZiAoYS5sZW5ndGgg',
  'PT09IDIpeyBwcmljZSA9IG51bU9yKGFbMV0sIDApOyB9CiAgICAgIHJldHVybiB7IG5hbWU6IG5hbWUsIHF0eTogcXR5LCB1bml0OiB1bml0LCBwcmljZTogcHJpY2UgfTsKICAgIH0pOwp9CgpmdW5jdGlvbiBudW1Pcih2LCBkZmx0KXsKICB2YXIgbiA9IE51bWJl',
  'cihTdHJpbmcodikucmVwbGFjZSgvLC9nLCAnJykpOwogIHJldHVybiBpc0Zpbml0ZShuKSA/IG4gOiBkZmx0Owp9CgpmdW5jdGlvbiBmb3JtYXRMaW5lc1RleHQobGlzdCl7CiAgcmV0dXJuIChsaXN0IHx8IFtdKQogICAgLmZpbHRlcihmdW5jdGlvbihsKXsgcmV0',
  'dXJuIFN0cmluZyhsLm5hbWUgfHwgJycpLnRyaW0oKSB8fCBOdW1iZXIobC5wcmljZSk7IH0pCiAgICAubWFwKGZ1bmN0aW9uKGwpewogICAgICByZXR1cm4gW1N0cmluZyhsLm5hbWUgfHwgJycpLnJlcGxhY2UoL1x8L2csICcvJyksCiAgICAgICAgICAgICAgbC5x',
  'dHkgfHwgMSwKICAgICAgICAgICAgICBTdHJpbmcobC51bml0IHx8ICcnKS5yZXBsYWNlKC9cfC9nLCAnLycpLAogICAgICAgICAgICAgIGwucHJpY2UgfHwgMF0uam9pbignIHwgJyk7CiAgICB9KS5qb2luKCdcbicpOwp9CgpmdW5jdGlvbiBsaW5lVG90YWwobCl7',
  'IHJldHVybiAoTnVtYmVyKGwucXR5KSB8fCAwKSAqIChOdW1iZXIobC5wcmljZSkgfHwgMCk7IH0KZnVuY3Rpb24gbGluZXNTdW0oKXsgcmV0dXJuIChGT1JNLmxpbmVzIHx8IFtdKS5yZWR1Y2UoZnVuY3Rpb24oYSwgbCl7IHJldHVybiBhICsgbGluZVRvdGFsKGwp',
  'OyB9LCAwKTsgfQoKZnVuY3Rpb24gbGluZXNUYWJsZUh0bWwoKXsKICB2YXIgcm93cyA9IChGT1JNLmxpbmVzIHx8IFtdKS5tYXAoZnVuY3Rpb24obCwgaSl7CiAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImxpbmUtcm93Ij4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0i',
  'aW5wIiBwbGFjZWhvbGRlcj0i4LiK4Li34LmI4Lit4Liq4Li04LiZ4LiE4LmJ4LiyIiB2YWx1ZT0iJyArIGVzYyhsLm5hbWUgfHwgJycpICsgJyIgJyArCiAgICAgICAgJ29uaW5wdXQ9InNldExpbmUoJyArIGkgKyAnLFwnbmFtZVwnLHRoaXMudmFsdWUpIj4nICsK',
  'ICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIG51bSIgdHlwZT0ibnVtYmVyIiBzdGVwPSJhbnkiIGlucHV0bW9kZT0iZGVjaW1hbCIgcGxhY2Vob2xkZXI9IuC4iOC4s+C4meC4p+C4mSIgJyArCiAgICAgICAgJ3ZhbHVlPSInICsgKGwucXR5ID09IG51bGwgPyAnJyA6',
  'IGVzYyhsLnF0eSkpICsgJyIgb25pbnB1dD0ic2V0TGluZSgnICsgaSArICcsXCdxdHlcJyx0aGlzLnZhbHVlKSI+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgcGxhY2Vob2xkZXI9IuC4q+C4meC5iOC4p+C4oiIgdmFsdWU9IicgKyBlc2MobC51bml0IHx8',
  'ICcnKSArICciICcgKwogICAgICAgICdvbmlucHV0PSJzZXRMaW5lKCcgKyBpICsgJyxcJ3VuaXRcJyx0aGlzLnZhbHVlKSI+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCBudW0iIHR5cGU9Im51bWJlciIgc3RlcD0iYW55IiBpbnB1dG1vZGU9ImRlY2ltYWwi',
  'IHBsYWNlaG9sZGVyPSLguKPguLLguITguLIv4Lir4LiZ4LmI4Lin4LiiIiAnICsKICAgICAgICAndmFsdWU9IicgKyAobC5wcmljZSA9PSBudWxsID8gJycgOiBlc2MobC5wcmljZSkpICsgJyIgb25pbnB1dD0ic2V0TGluZSgnICsgaSArICcsXCdwcmljZVwnLHRo',
  'aXMudmFsdWUpIj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImxpbmUtc3VtIj4nICsgbW9uZXkobGluZVRvdGFsKGwpLCAyKSArICc8L2Rpdj4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIGRnciIgdGl0bGU9IuC5gOC4reC4suC4',
  'o+C4suC4ouC4geC4suC4o+C4meC4teC5ieC4reC4reC4gSIgb25jbGljaz0iZGVsTGluZSgnICsgaSArICcpIj7DlzwvYnV0dG9uPicgKwogICAgJzwvZGl2Pic7CiAgfSkuam9pbignJyk7CgogIHJldHVybiAnPGRpdiBjbGFzcz0ibGluZS1oZWFkIj4nICsKICAg',
  'ICAgJzxzcGFuPuC4iuC4t+C5iOC4reC4quC4tOC4meC4hOC5ieC4sjwvc3Bhbj48c3BhbiBjbGFzcz0ibnVtIj7guIjguLPguJnguKfguJk8L3NwYW4+PHNwYW4+4Lir4LiZ4LmI4Lin4LiiPC9zcGFuPicgKwogICAgICAnPHNwYW4gY2xhc3M9Im51bSI+4Lij4Liy',
  '4LiE4LiyL+C4q+C4meC5iOC4p+C4ojwvc3Bhbj48c3BhbiBjbGFzcz0ibnVtIj7guKPguKfguKE8L3NwYW4+PHNwYW4+PC9zcGFuPicgKwogICAgJzwvZGl2PicgKwogICAgKHJvd3MgfHwgJzxkaXYgY2xhc3M9ImhpbnQiIHN0eWxlPSJwYWRkaW5nOjhweCAycHgi',
  'PuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4o+C4suC4ouC4geC4suC4oyDigJQg4LiB4LiUIOKAnOC5gOC4nuC4tOC5iOC4oeC4o+C4suC4ouC4geC4suC4o+KAnSDguYDguJ7guLfguYjguK3guYPguKrguYjguKrguLTguJnguITguYnguLLguJfguLXguKXguLDg',
  'uK3guKLguYjguLLguIc8L2Rpdj4nKSArCiAgICAnPGRpdiBjbGFzcz0icm93IG10OCI+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iYWRkTGluZSgpIj4rIOC5gOC4nuC4tOC5iOC4oeC4o+C4suC4ouC4geC4',
  'suC4ozwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9InBhc3RlTGluZXMoKSI+8J+TiyDguKfguLLguIfguJfguLXguYDguJTguLXguKLguKfguKvguKXguLLguKLguKPguLLguKLguIHguLLguKM8',
  'L2J1dHRvbj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImxpbmUtdG90YWwiPuC4o+C4p+C4oeC4hOC5iOC4suC4quC4tOC4meC4hOC5ieC4siA8Yj4nICsgbW9uZXkobGluZXNTdW0oKSwgMikgKyAnIOC4vzwvYj48L2Rpdj4nICsKICAgICc8L2Rpdj4nOwp9CgpmdW5j',
  'dGlvbiByZWRyYXdMaW5lcygpewogIHZhciBib3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9saW5lcycpOwogIGlmICghYm94KSByZXR1cm47CiAgYm94LmlubmVySFRNTCA9IGxpbmVzVGFibGVIdG1sKCk7CiAgcmVjYWxjQmlsbCgpOwp9CgpmdW5jdGlv',
  'biBzZXRMaW5lKGksIGtleSwgdmFsKXsKICBpZiAoIUZPUk0ubGluZXNbaV0pIHJldHVybjsKICBGT1JNLmxpbmVzW2ldW2tleV0gPSAoa2V5ID09PSAncXR5JyB8fCBrZXkgPT09ICdwcmljZScpID8gbnVtT3IodmFsLCAwKSA6IHZhbDsKICAvLyDguYTguKHguYjg',
  'uKfguLLguJTguYPguKvguKHguYjguJfguLHguYnguIfguJXguLLguKPguLLguIcg4LmA4LiU4Li14LmL4Lii4Lin4LmA4LiE4Lit4Lij4LmM4LmA4LiL4Lit4Lij4LmM4LmA4LiU4LmJ4LiH4Lit4Lit4LiB4LiI4Liy4LiB4LiK4LmI4Lit4LiH4LiX4Li14LmI4LiB',
  '4Liz4Lil4Lix4LiH4Lie4Li04Lih4Lie4LmMCiAgdmFyIHJvdyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNmX2xpbmVzIC5saW5lLXJvdycpW2ldOwogIGlmIChyb3cpIHJvdy5xdWVyeVNlbGVjdG9yKCcubGluZS1zdW0nKS50ZXh0Q29udGVudCA9IG1v',
  'bmV5KGxpbmVUb3RhbChGT1JNLmxpbmVzW2ldKSwgMik7CiAgdmFyIHRvdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNmX2xpbmVzIC5saW5lLXRvdGFsIGInKTsKICBpZiAodG90KSB0b3QudGV4dENvbnRlbnQgPSBtb25leShsaW5lc1N1bSgpLCAyKSArICcg',
  '4Li/JzsKICByZWNhbGNCaWxsKCk7Cn0KCmZ1bmN0aW9uIGFkZExpbmUoKXsKICBGT1JNLmxpbmVzLnB1c2goeyBuYW1lOiAnJywgcXR5OiAxLCB1bml0OiAnJywgcHJpY2U6IDAgfSk7CiAgcmVkcmF3TGluZXMoKTsKICB2YXIgaW5wdXRzID0gZG9jdW1lbnQucXVl',
  'cnlTZWxlY3RvckFsbCgnI2ZfbGluZXMgLmxpbmUtcm93IC5pbnAnKTsKICBpZiAoaW5wdXRzLmxlbmd0aCkgaW5wdXRzWyhGT1JNLmxpbmVzLmxlbmd0aCAtIDEpICogNF0uZm9jdXMoKTsKfQoKZnVuY3Rpb24gZGVsTGluZShpKXsKICBGT1JNLmxpbmVzLnNwbGlj',
  'ZShpLCAxKTsKICByZWRyYXdMaW5lcygpOwp9CgovKioKICog4Lin4Liy4LiH4Lij4Liy4Lii4LiB4Liy4Lij4LiI4Liy4LiB4Lir4LiZ4LmJ4Liy4LiE4Liz4Liq4Lix4LmI4LiH4LiL4Li34LmJ4Lit4LiX4Li14LmA4LiU4Li14Lii4Lin4LiX4Lix4LmJ4LiH4LiB',
  '4LmJ4Lit4LiZIOC5geC4peC5ieC4p+C5g+C4q+C5ieC4o+C4sOC4muC4muC5geC4ouC4geC4muC4o+C4o+C4l+C4seC4lOC5g+C4q+C5iQogKgogKiDguJfguLPguYDguJvguYfguJnguIrguYjguK3guIfguJ7guLHguJrguYDguIHguYfguJrguK3guKLguLnguYjg',
  'uYPguJnguJ/guK3guKPguYzguKHguYDguJTguLTguKEg4LmE4Lih4LmI4LmA4Lib4Li04LiU4Lir4LiZ4LmJ4Liy4LiV4LmI4Liy4LiH4LiL4LmJ4Lit4LiZCiAqIOC5gOC4nuC4o+C4suC4sCBvcGVuTW9kYWwoKSDguYDguILguLXguKLguJnguJfguLHguJrguKvg',
  'uJnguYnguLLguJXguYjguLLguIfguYDguJTguLTguKEg4LiW4LmJ4Liy4LmA4Lib4Li04LiU4LiL4LmJ4Lit4LiZ4Lif4Lit4Lij4LmM4Lih4LiX4Li14LmI4LiB4Lij4Lit4LiB4LiE4LmJ4Liy4LiH4LmE4Lin4LmJ4LiI4Liw4Lir4Liy4Lii4LiX4Lix4LmJ4LiH',
  '4LmD4LiaCiAqLwpmdW5jdGlvbiBwYXN0ZUxpbmVzKCl7CiAgdmFyIGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXN0ZVdyYXAnKTsKICBpZiAoYm94KSB7IGJveC5oaWRkZW4gPSAhYm94LmhpZGRlbjsgaWYgKCFib3guaGlkZGVuKSBkb2N1bWVudC5n',
  'ZXRFbGVtZW50QnlJZCgncGFzdGVCb3gnKS5mb2N1cygpOyByZXR1cm47IH0KCiAgdmFyIGhvc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9saW5lcycpOwogIGlmICghaG9zdCkgcmV0dXJuOwogIHZhciB3cmFwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVu',
  'dCgnZGl2Jyk7CiAgd3JhcC5pZCA9ICdwYXN0ZVdyYXAnOwogIHdyYXAuY2xhc3NOYW1lID0gJ210OCc7CiAgd3JhcC5pbm5lckhUTUwgPQogICAgJzx0ZXh0YXJlYSBjbGFzcz0idGEiIGlkPSJwYXN0ZUJveCIgc3R5bGU9Im1pbi1oZWlnaHQ6MTIwcHgiICcgKwog',
  'ICAgICAncGxhY2Vob2xkZXI9IuC4m+C4seC5iuC4oeC4meC5ieC4syA3NTBXIHwgMSB8IOC5gOC4hOC4o+C4t+C5iOC4reC4hyB8IDQyNTAmIzEwO+C4quC4suC4ouC5hOC4nyBWQUYgMngxLjUgfCAyMCB8IOC5gOC4oeC4leC4oyB8IDE3LjUmIzEwO+C5gOC4l+C4',
  'm+C4nuC4seC4meC4quC4suC4ouC5hOC4nyA0NSI+PC90ZXh0YXJlYT4nICsKICAgICc8ZGl2IGNsYXNzPSJoaW50IG10OCI+4LiE4Lix4LmI4LiZ4LiU4LmJ4Lin4LiiIDxiPnw8L2I+IOC4leC4suC4oeC4peC4s+C4lOC4seC4miDguIrguLfguYjguK0gwrcg4LiI',
  '4Liz4LiZ4Lin4LiZIMK3IOC4q+C4meC5iOC4p+C4oiDCtyDguKPguLLguITguLLguJXguYjguK3guKvguJnguYjguKfguKI8YnI+JyArCiAgICAgICfguJbguYnguLLguKfguLLguIfguKHguLLguYDguJvguYfguJnguILguYnguK3guITguKfguLLguKHguJjguKPg',
  'uKPguKHguJTguLIg4Lij4Liw4Lia4Lia4LiI4Liw4Lie4Lii4Liy4Lii4Liy4Lih4LmB4Lii4LiB4LiK4Li34LmI4Lit4LiB4Lix4Lia4Lij4Liy4LiE4Liy4LmD4Lir4LmJ4LmA4Lit4LiHPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0icm93IG10OCI+JyArCiAg',
  'ICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSBwcmkiIG9uY2xpY2s9ImFwcGx5UGFzdGVkTGluZXMoKSI+4LmA4Lie4Li04LmI4Lih4LmA4LiC4LmJ4Liy4Lij4Liy4Lii4LiB4Liy4LijPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIHR5',
  'cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCdwYXN0ZVdyYXBcJykuaGlkZGVuPXRydWUiPuC4m+C4tOC4lDwvYnV0dG9uPicgKwogICAgJzwvZGl2Pic7CiAgaG9zdC5hcHBlbmRDaGlsZCh3cmFwKTsK',
  'ICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFzdGVCb3gnKS5mb2N1cygpOwp9CgpmdW5jdGlvbiBhcHBseVBhc3RlZExpbmVzKCl7CiAgdmFyIHRleHQgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Bhc3RlQm94JykgfHwge30pLnZhbHVlIHx8ICcnOwog',
  'IHZhciBhZGRlZCA9IHRleHQuc3BsaXQoL1xyP1xuLykubWFwKGZ1bmN0aW9uKHMpeyByZXR1cm4gcy50cmltKCk7IH0pLmZpbHRlcihCb29sZWFuKS5tYXAoZnVuY3Rpb24ocmF3KXsKICAgIGlmIChyYXcuaW5kZXhPZignfCcpID49IDApIHJldHVybiBwYXJzZUxp',
  'bmVzVGV4dChyYXcpWzBdOwogICAgLy8g4LmE4Lih4LmI4Lih4Li1IHwg4oCUIOC5gOC4lOC4suC4iOC4suC4geC4leC4seC4p+C5gOC4peC4guC4l+C5ieC4suC4ouC4muC4o+C4o+C4l+C4seC4lOC4p+C5iOC4suC5gOC4m+C5h+C4meC4o+C4suC4hOC4sgogICAg',
  'dmFyIG0gPSByYXcubWF0Y2goL14oLio/KVtcczp4w5ddKihbXGQsXSsoPzpcLlxkKyk/KVxzKig/OuC4muC4suC4l3zguL8pPyQvKTsKICAgIGlmIChtICYmIG1bMV0udHJpbSgpKSByZXR1cm4geyBuYW1lOiBtWzFdLnRyaW0oKSwgcXR5OiAxLCB1bml0OiAnJywg',
  'cHJpY2U6IG51bU9yKG1bMl0sIDApIH07CiAgICByZXR1cm4geyBuYW1lOiByYXcsIHF0eTogMSwgdW5pdDogJycsIHByaWNlOiAwIH07CiAgfSkuZmlsdGVyKEJvb2xlYW4pOwoKICBpZiAoIWFkZGVkLmxlbmd0aCkgcmV0dXJuIHRvYXN0KCfguYTguKHguYjguJ7g',
  'uJrguKPguLLguKLguIHguLLguKPguJfguLXguYjguK3guYjguLLguJnguYTguJTguYknLCAnZXJyJyk7CiAgRk9STS5saW5lcyA9IChGT1JNLmxpbmVzIHx8IFtdKS5maWx0ZXIoZnVuY3Rpb24obCl7IHJldHVybiBTdHJpbmcobC5uYW1lIHx8ICcnKS50cmltKCk7',
  'IH0pLmNvbmNhdChhZGRlZCk7CiAgcmVkcmF3TGluZXMoKTsgICAvLyDguKfguLLguJTguYPguKvguKHguYjguYHguKXguYnguKfguIrguYjguK3guIfguKfguLLguIfguIjguLDguKvguLLguKLguYTguJvguYDguK3guIcg4LmA4Lie4Lij4Liy4Liw4Lit4Lii4Li5',
  '4LmI4LiC4LmJ4Liy4LiH4LmD4LiZIGZfbGluZXMKICB0b2FzdCgn4LmA4Lie4Li04LmI4Lih4LmD4Lir4LmJICcgKyBhZGRlZC5sZW5ndGggKyAnIOC4o+C4suC4ouC4geC4suC4oyDigJQg4LiV4Lij4Lin4LiI4LiV4Lix4Lin4LmA4Lil4LiC4Lit4Li14LiB4LiE',
  '4Lij4Lix4LmJ4LiH4LiB4LmI4Lit4LiZ4Lia4Lix4LiZ4LiX4Li24LiBJywgJ29rJyk7Cn0KCi8qKgogKiDguITguLTguJTguKLguK3guJTguKPguKfguKHguILguK3guIfguJrguLTguKUgPSDguITguYjguLLguKrguLTguJnguITguYnguLIgKyDguITguYjguLLg',
  'uKrguYjguIcg4oiSIOC4quC5iOC4p+C4meC4peC4lCDguYHguKXguYnguKfguYDguJXguLTguKHguKXguIfguIrguYjguK3guIcgIuC4o+C4suC4hOC4suC4o+C4p+C4oSIKICog4LmD4Lir4LmJ4LiV4Lij4LiH4LiB4Lix4Lia4LiX4Li14LmI4Lid4Lix4LmI4LiH',
  '4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4LiE4Li04LiU4LiV4Lit4LiZ4Lia4Lix4LiZ4LiX4Li24LiBIOC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC4oeC4teC4l+C4suC4h+C4l+C4teC5iOC4leC4seC4p+C5gOC4peC4guC4quC4reC4h+C4neC4',
  'seC5iOC4h+C5hOC4oeC5iOC4leC4o+C4h+C4geC4seC4mQogKi8KZnVuY3Rpb24gcmVjYWxjQmlsbCgpewogIGlmICghZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfbGluZXMnKSkgcmV0dXJuOwogIHZhciBwcmljZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlk',
  'KCdmX3ByaWNlJyk7CiAgaWYgKCFwcmljZSkgcmV0dXJuOwogIHZhciBuID0gKEZPUk0ubGluZXMgfHwgW10pLmZpbHRlcihmdW5jdGlvbihsKXsgcmV0dXJuIFN0cmluZyhsLm5hbWUgfHwgJycpLnRyaW0oKSB8fCBOdW1iZXIobC5wcmljZSk7IH0pLmxlbmd0aDsK',
  'ICBpZiAoIW4pIHsgcHJpY2UucmVhZE9ubHkgPSBmYWxzZTsgcHJpY2Uuc3R5bGUuYmFja2dyb3VuZCA9ICcnOyByZXR1cm47IH0KCiAgdmFyIHNoaXAgPSBOdW1iZXIoKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX3NoaXBwaW5nJykgfHwge30pLnZhbHVlKSB8',
  'fCAwOwogIHZhciBkaXNjID0gTnVtYmVyKChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9kaXNjb3VudCcpIHx8IHt9KS52YWx1ZSkgfHwgMDsKICBwcmljZS52YWx1ZSA9IE1hdGgucm91bmQoKGxpbmVzU3VtKCkgKyBzaGlwIC0gZGlzYykgKiAxMDApIC8gMTAw',
  'OwogIHByaWNlLnJlYWRPbmx5ID0gdHJ1ZTsgICAgICAgICAgICAgICAgICAgICAgIC8vIOC4oeC4teC4o+C4suC4ouC4geC4suC4o+C4ouC5iOC4reC4ouC5geC4peC5ieC4pyDguKvguYnguLLguKHguJ7guLTguKHguJ7guYzguJfguLHguJrguYPguKvguYnguYTg',
  'uKHguYjguJXguKPguIfguIHguLHguJkKICBwcmljZS5zdHlsZS5iYWNrZ3JvdW5kID0gJ3ZhcigtLXN1cmZhY2UtMiknOwogIHByaWNlLnRpdGxlID0gJ+C4hOC4tOC4lOC4iOC4suC4geC4o+C4suC4ouC4geC4suC4o+C5g+C4meC4muC4tOC4peC5g+C4q+C5ieC4',
  'reC4seC4leC5guC4meC4oeC4seC4leC4tCDigJQg4LmB4LiB4LmJ4LiX4Li14LmI4Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4LiiIOC4hOC5iOC4suC4quC5iOC4hyDguKvguKPguLfguK3guKrguYjguKfguJnguKXguJQnOwoKICB2YXIgaGludCA9IGRvY3Vt',
  'ZW50LmdldEVsZW1lbnRCeUlkKCdiaWxsSGludCcpOwogIGlmIChoaW50KSB7CiAgICBoaW50LmlubmVySFRNTCA9IG4gKyAnIOC4o+C4suC4ouC4geC4suC4oyDCtyDguITguYjguLLguKrguLTguJnguITguYnguLIgJyArIG1vbmV5KGxpbmVzU3VtKCksIDIpICsK',
  'ICAgICAgKHNoaXAgPyAnICsg4LiE4LmI4Liy4Liq4LmI4LiHICcgKyBtb25leShzaGlwLCAyKSA6ICcnKSArCiAgICAgIChkaXNjID8gJyDiiJIg4Liq4LmI4Lin4LiZ4Lil4LiUICcgKyBtb25leShkaXNjLCAyKSA6ICcnKTsKICB9Cn0KCi8qKiDguK3guLHguJvg',
  'uYDguJTguJXguIrguYjguK3guIfguJzguKXguKPguKfguKHguJfguLjguIHguIrguYjguK3guIfguYPguJnguJ/guK3guKPguYzguKHguJvguLHguIjguIjguLjguJrguLHguJkgKi8KZnVuY3Rpb24gcmVjYWxjU3VtcygpewogIChGT1JNLnNwZWNzIHx8IFtdKS5m',
  'b3JFYWNoKGZ1bmN0aW9uKGYpewogICAgaWYgKGYudHlwZSAhPT0gJ2NvbXB1dGVkJyB8fCAhZi5mcm9tKSByZXR1cm47CiAgICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl8nICsgZi5rZXkpOwogICAgaWYgKCFlbCkgcmV0dXJuOwogICAgdmFy',
  'IHRvdGFsID0gMDsKICAgIGYuZnJvbS5mb3JFYWNoKGZ1bmN0aW9uKGspewogICAgICB2YXIgaSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmXycgKyBrKTsKICAgICAgaWYgKGkpIHRvdGFsICs9IE51bWJlcihpLnZhbHVlKSB8fCAwOwogICAgfSk7CiAgICBl',
  'bC50ZXh0Q29udGVudCA9IHRvdGFsLnRvTG9jYWxlU3RyaW5nKCd0aC1USCcsIHsgbWluaW11bUZyYWN0aW9uRGlnaXRzOiAwLCBtYXhpbXVtRnJhY3Rpb25EaWdpdHM6IDIgfSkgKyAnIOC4vyc7CiAgICBlbC5zdHlsZS5jb2xvciA9IHRvdGFsID4gMCA/ICd2YXIo',
  'LS1vayknIDogJ3ZhcigtLW11dGVkKSc7CiAgfSk7Cn0KCmZ1bmN0aW9uIGV4aXN0aW5nRmlsZXNIdG1sKGtleSl7CiAgdmFyIGxpc3QgPSBGT1JNLmtlZXBba2V5XSB8fCBbXTsKICBpZiAoIWxpc3QubGVuZ3RoKSByZXR1cm4gJyc7CiAgcmV0dXJuICc8ZGl2IGNs',
  'YXNzPSJ0aHVtYnMgbWI4Ij4nICsgbGlzdC5tYXAoZnVuY3Rpb24odXJsLCBpKXsKICAgIHZhciBpZCA9IFN0cmluZyh1cmwpLm1hdGNoKC9bLVx3XXsyMCx9Lyk7CiAgICB2YXIgdGh1bWIgPSBpZCA/ICdodHRwczovL2RyaXZlLmdvb2dsZS5jb20vdGh1bWJuYWls',
  'P2lkPScgKyBpZFswXSArICcmc3o9dzIwMCcgOiAnJzsKICAgIHJldHVybiAnPHNwYW4gc3R5bGU9InBvc2l0aW9uOnJlbGF0aXZlO2Rpc3BsYXk6aW5saW5lLWJsb2NrIj4nICsKICAgICAgKHRodW1iID8gJzxpbWcgY2xhc3M9InRodW1iIiBzcmM9IicgKyBlc2Mo',
  'dGh1bWIpICsgJyIgb25jbGljaz0id2luZG93Lm9wZW4oJyArIGpzcShzYWZlVXJsKHVybCkpICsgJyxcJ19ibGFua1wnKSI+JwogICAgICAgICAgICAgOiAnPGEgY2xhc3M9ImIgaW5mbyIgaHJlZj0iJyArIGVzYyhzYWZlVXJsKHVybCkgfHwgJyMnKSArICciIHRh',
  'cmdldD0iX2JsYW5rIiByZWw9Im5vb3BlbmVyIj7guYTguJ/guKXguYwgJyArIChpKzEpICsgJzwvYT4nKSArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgb25jbGljaz0iZHJvcEZpbGUoXCcnICsga2V5ICsgJ1wnLCcgKyBpICsgJykiIHRpdGxlPSLguYDg',
  'uK3guLLguK3guK3guIEiICcgKwogICAgICAnc3R5bGU9InBvc2l0aW9uOmFic29sdXRlO3RvcDotNnB4O3JpZ2h0Oi02cHg7YmFja2dyb3VuZDp2YXIoLS1kYW5nZXIpO2NvbG9yOiNmZmY7Ym9yZGVyOjA7Ym9yZGVyLXJhZGl1czo5OXB4O3dpZHRoOjE4cHg7aGVp',
  'Z2h0OjE4cHg7bGluZS1oZWlnaHQ6MTtjdXJzb3I6cG9pbnRlcjtmb250LXNpemU6MTJweCI+w5c8L2J1dHRvbj4nICsKICAgICAgJzwvc3Bhbj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIGRyb3BGaWxlKGtleSwgaWR4KXsKICBGT1JN',
  'LmtlZXBba2V5XS5zcGxpY2UoaWR4LCAxKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl8nICsga2V5ICsgJ19leGlzdGluZycpLmlubmVySFRNTCA9IGV4aXN0aW5nRmlsZXNIdG1sKGtleSk7Cn0KCmZ1bmN0aW9uIHByZXZpZXdQaWNrZWQoaW5wdXQsIGlk',
  'KXsKICB2YXIgYm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQgKyAnX3ByZXZpZXcnKTsKICB2YXIgZmlsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChpbnB1dC5maWxlcyB8fCBbXSk7CiAgYm94LmlubmVySFRNTCA9IGZpbGVzLm1hcChmdW5j',
  'dGlvbihmKXsKICAgIHJldHVybiAnPHNwYW4gY2xhc3M9ImIgaW5mbyI+JyArIGVzYyhmLm5hbWUuc2xpY2UoMCwyNikpICsgJyDCtyAnICsgTWF0aC5yb3VuZChmLnNpemUvMTAyNCkgKyAnIEtCPC9zcGFuPic7CiAgfSkuam9pbignICcpOwoKICB2YXIgc2xvdCA9',
  'IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkICsgJ19vY3InKTsKICBpZiAoIXNsb3QpIHJldHVybjsKICBzbG90LmlubmVySFRNTCA9ICcnOwogIGlmICghb2NyVXNhYmxlKCkgfHwgIWZpcnN0UmVhZGFibGUoZmlsZXMpKSByZXR1cm47CgogIHZhciBtb2RlID0g',
  'KFMuYm9vdC5zZXR0aW5ncyAmJiBTLmJvb3Quc2V0dGluZ3Mub2NyQXV0b2ZpbGwpIHx8ICfguJbguLLguKHguIHguYjguK3guJnguYDguJXguLTguKEnOwogIGlmIChtb2RlID09PSAn4LmE4Lih4LmI4LmA4LiV4Li04LihJykgcmV0dXJuOwogIGlmIChtb2RlID09',
  'PSAn4LmA4LiV4Li04Lih4LmD4Lir4LmJ4LmA4Lil4LiiJykgcmV0dXJuIHJ1bk9jcihpZCwgdHJ1ZSk7CgogIHNsb3QuaW5uZXJIVE1MID0KICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSBtdDgiIG9uY2xpY2s9InJ1bk9jcihcJycgKyBp',
  'ZCArICdcJykiPicgKwogICAgJ/CflI4g4Lit4LmI4Liy4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiI4Liy4LiB4Lij4Li54Lib4LiZ4Li14LmJIOC5geC4peC5ieC4p+C4iuC5iOC4p+C4ouC4geC4o+C4reC4geC5g+C4q+C5iTwvYnV0dG9uPic7Cn0KCi8qKiDg',
  'uK3guYjguLLguJnguITguYjguLLguIjguLLguIHguJ/guK3guKPguYzguKEgKyDguK3guLHguJvguYLguKvguKXguJTguYTguJ/guKXguYzguYPguKvguKHguYgg4LmB4Lil4LmJ4Lin4LiE4Li34LiZIG9iamVjdCDguJ7guKPguYnguK3guKHguJrguLHguJnguJfg',
  'uLbguIEgKi8KZnVuY3Rpb24gcmVhZEZvcm0oc3BlY3MsIGJ1Y2tldCl7CiAgdmFyIG91dCA9IHt9OwogIHZhciB1cGxvYWRzID0gW107CgogIHNwZWNzLmZvckVhY2goZnVuY3Rpb24oZil7CiAgICBpZiAoZi50eXBlID09PSAnY29tcHV0ZWQnKSByZXR1cm47ICAg',
  'ICAgICAgIC8vIOC4iuC5iOC4reC4h+C4hOC4s+C4meC4p+C4kyDguYTguKHguYjguJXguYnguK3guIfguJrguLHguJnguJfguLbguIEKICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmXycgKyBmLmtleSk7CiAgICBpZiAoIWVsKSByZXR1cm47',
  'CiAgICBpZiAoZi50eXBlID09PSAnZmlsZXMnKSB7CiAgICAgIHVwbG9hZHMucHVzaCgKICAgICAgICB1cGxvYWRGaWxlcyhlbCwgYnVja2V0KS50aGVuKGZ1bmN0aW9uKHJlZnMpewogICAgICAgICAgb3V0W2Yua2V5XSA9IChGT1JNLmtlZXBbZi5rZXldIHx8IFtd',
  'KS5jb25jYXQocmVmcy5tYXAoZnVuY3Rpb24ocil7IHJldHVybiByLnVybDsgfSkpOwogICAgICAgIH0pCiAgICAgICk7CiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ3RvZG8nKSB7CiAgICAgIG91dFtmLmtleV0gPSBmb3JtYXRUb2RvVGV4dChGT1JNLnRvZG8p',
  'OwogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICdsaW5lcycpIHsKICAgICAgb3V0W2Yua2V5XSA9IGZvcm1hdExpbmVzVGV4dChGT1JNLmxpbmVzKTsKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnbnVtYmVyJyB8fCBmLnR5cGUgPT09ICdtb25leScpIHsKICAg',
  'ICAgb3V0W2Yua2V5XSA9IGVsLnZhbHVlID09PSAnJyA/IG51bGwgOiBOdW1iZXIoZWwudmFsdWUpOwogICAgfSBlbHNlIHsKICAgICAgb3V0W2Yua2V5XSA9IGVsLnZhbHVlOwogICAgfQogIH0pOwoKICByZXR1cm4gUHJvbWlzZS5hbGwodXBsb2FkcykudGhlbihm',
  'dW5jdGlvbigpeyByZXR1cm4gb3V0OyB9KTsKfQoKLyoqIOC5guC4hOC4o+C4h+C4n+C4reC4o+C5jOC4oeC4oeC4suC4leC4o+C4kOC4suC4mTog4LmA4Lib4Li04LiUIG1vZGFsLCDguIjguLHguJTguIHguLLguKPguJvguLjguYjguKHguJrguLHguJnguJfguLbg',
  'uIEsIOC4o+C4teC5guC4q+C4peC4lOC4q+C4meC5ieC4siAqLwpmdW5jdGlvbiBvcGVuRm9ybShvcHRzKXsKICB2YXIgcmVjID0gb3B0cy5yZWNvcmQgfHwge307CiAgRk9STS5vY3IgPSBvcHRzLm9jciB8fCBudWxsOwogIEZPUk0ucmVjID0gcmVjLmlkID8gcmVj',
  'IDogbnVsbDsgICAvLyDguIjguLPguYTguKfguYnguKfguYjguLLguIHguLPguKXguLHguIfguYHguIHguYnguILguK3guIfguYDguJTguLTguKEg4Lir4Lij4Li34Lit4LiB4Liz4Lil4Lix4LiH4LmA4Lie4Li04LmI4Lih4LmD4Lir4Lih4LmICiAgb3Blbk1vZGFs',
  'KG9wdHMudGl0bGUsCiAgICBmaWVsZHNIdG1sKG9wdHMuZmllbGRzLCByZWMpLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgIChyZWMuaWQgJiYgb3B0cy5vbkRl',
  'bGV0ZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4gZGdyIiBpZD0iZkRlbCI+4Lil4Lia4Lij4Liy4Lii4LiB4Liy4Lij4LiZ4Li14LmJPC9idXR0b24+JyA6ICcnKSArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgaWQ9ImZTYXZlIj4nICsgKHJlYy5pZCA/ICfg',
  'uJrguLHguJnguJfguLbguIHguIHguLLguKPguYHguIHguYnguYTguIInIDogJ+C4muC4seC4meC4l+C4tuC4gScpICsgJzwvYnV0dG9uPicsCiAgICBvcHRzLndpZGUpOwoKICBpZiAocmVjLmlkICYmIG9wdHMub25EZWxldGUpIHsKICAgIGRvY3VtZW50LmdldEVs',
  'ZW1lbnRCeUlkKCdmRGVsJykub25jbGljayA9IGZ1bmN0aW9uKCl7IGNsb3NlTW9kYWwoKTsgb3B0cy5vbkRlbGV0ZShyZWMuaWQpOyB9OwogIH0KCiAgcmVjYWxjU3VtcygpOwogIHJlY2FsY0JpbGwoKTsKCiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZTYXZl',
  'Jykub25jbGljayA9IGZ1bmN0aW9uKCl7CiAgICB2YXIgYnRuID0gdGhpczsKICAgIGJ0bi5kaXNhYmxlZCA9IHRydWU7CiAgICBidG4uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C4muC4seC4meC4l+C4tuC4',
  'geKApic7CgogICAgcmVhZEZvcm0ob3B0cy5maWVsZHMsIG9wdHMuYnVja2V0IHx8ICdtaXNjJykudGhlbihmdW5jdGlvbihkYXRhKXsKICAgICAgdmFyIG1pc3NpbmcgPSBvcHRzLmZpZWxkcy5maWx0ZXIoZnVuY3Rpb24oZil7CiAgICAgICAgcmV0dXJuIGYucmVx',
  'dWlyZWQgJiYgKGRhdGFbZi5rZXldID09IG51bGwgfHwgZGF0YVtmLmtleV0gPT09ICcnKTsKICAgICAgfSk7CiAgICAgIGlmIChtaXNzaW5nLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKCfguIHguKPguLjguJPguLLguIHguKPguK3guIE6ICcgKyBtaXNzaW5nLm1h',
  'cChmdW5jdGlvbihmKXsgcmV0dXJuIGYubGFiZWw7IH0pLmpvaW4oJywgJykpOwoKICAgICAgdmFyIHJlY29yZCA9IE9iamVjdC5hc3NpZ24oe30sIG9wdHMuYmFzZSB8fCB7fSwgZGF0YSk7CiAgICAgIGlmIChyZWMuaWQpIHJlY29yZC5pZCA9IHJlYy5pZDsKICAg',
  'ICAgcmV0dXJuIGNhbGxBcGkob3B0cy5hY3Rpb24sIE9iamVjdC5hc3NpZ24oeyByZWNvcmQ6IHJlY29yZCB9LCBvcHRzLmV4dHJhIHx8IHt9KSk7CiAgICB9KS50aGVuKGZ1bmN0aW9uKHNhdmVkKXsKICAgICAgY2xvc2VNb2RhbCgpOwogICAgICAvLyDguKPguLLg',
  'uKLguIHguLLguKPguJbguLnguIHguIjguLHguJTguYDguILguYnguLLguJvguLXguJXguLLguKHguKfguLHguJnguJfguLXguYgg4LiW4LmJ4Liy4LmE4Lih4LmI4LmD4LiK4LmI4Lib4Li14LiX4Li14LmI4LiB4Liz4Lil4Lix4LiH4LiU4Li54Lit4Lii4Li54LmI',
  'IOC4muC4reC4geC5g+C4q+C5ieC4iuC4seC4lCDigJQg4LmE4Lih4LmI4LiH4Lix4LmJ4LiZ4LiU4Li54LmA4Lir4Lih4Li34Lit4LiZ4Lia4Lix4LiZ4LiX4Li24LiB4LmE4Lih4LmI4LiV4Li04LiUCiAgICAgIGlmIChzYXZlZCAmJiBzYXZlZC55ZWFyICYmIFMu',
  'eWVhciAhPT0gJ2FsbCcgJiYgU3RyaW5nKHNhdmVkLnllYXIpICE9PSBTdHJpbmcoUy55ZWFyKSkgewogICAgICAgIHRvYXN0KCfguJrguLHguJnguJfguLbguIHguYHguKXguYnguKcg4oCUIOC4o+C4suC4ouC4geC4suC4o+C4meC4teC5ieC4reC4ouC4ueC5iOC5',
  'g+C4meC4m+C4tSAnICsgZGlzcGxheVllYXIoc2F2ZWQueWVhcikgKwogICAgICAgICAgJyAo4LiV4Lit4LiZ4LiZ4Li14LmJ4LiU4Li54Lib4Li1ICcgKyBkaXNwbGF5WWVhcihTLnllYXIpICsgJyDguK3guKLguLnguYgg4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lib',
  '4Li14LmE4LiU4LmJ4LiX4Li14LmI4Lih4Li44Lih4LiC4Lin4Liy4Lia4LiZKScsICdvaycsIDcwMDApOwogICAgICB9CiAgICAgIC8vIOC4leC4seC4p+C4muC4reC4geC4quC4luC4suC4meC4sOC4oeC4uOC4oeC4guC4p+C4suC4muC4meC4guC4tuC5ieC4mSAi',
  '4Lia4Lix4LiZ4LiX4Li24LiB4LmB4Lil4LmJ4LinIiDguYPguKvguYnguK3guKLguLnguYjguYHguKXguYnguKcg4LiI4Li24LiH4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LmA4LiU4LmJ4LiHIHRvYXN0IOC4i+C5ieC4swogICAgICAvLyDguYHguKXguYnguKfguIvg',
  'uLTguIfguIHguYzguYDguIfguLXguKLguJog4LmGIOC5hOC4oeC5iOC4peC5ieC4suC4h+C4q+C4meC5ieC4suC5geC4peC4sOC5hOC4oeC5iOC5gOC4lOC5ieC4h+C4geC4peC4seC4muC5hOC4m+C4muC4meC4quC4uOC4lAogICAgICBsb2FkKHsgcXVpZXQ6IHRy',
  'dWUgfSk7CiAgICAgIC8vIOC4n+C4reC4o+C5jOC4oeC4l+C4teC5iOC5gOC4m+C4tOC4lOC4oeC4suC4iOC4suC4geC4q+C4meC5ieC4suC4leC5iOC4suC4h+C4reC4t+C5iOC4mSAo4LmA4LiK4LmI4LiZIOC4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4meC5g+C4',
  'meC4q+C4meC5ieC4suC4q+C5ieC4reC4hykg4LiC4Lit4LmA4Lib4Li04LiU4Lir4LiZ4LmJ4Liy4LiZ4Lix4LmJ4LiZ4LiB4Lil4Lix4Lia4LiE4Li34LiZCiAgICAgIGlmICh0eXBlb2Ygb3B0cy5hZnRlciA9PT0gJ2Z1bmN0aW9uJykgb3B0cy5hZnRlcigpOwog',
  'ICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlOwogICAgICBidG4udGV4dENvbnRlbnQgPSByZWMuaWQgPyAn4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4LmB4LiB4LmJ4LmE4LiCJyA6ICfguJrguLHguJnguJfguLbg',
  'uIEnOwogICAgICB0b2FzdChlLm1lc3NhZ2UgfHwgZSwgJ2VycicpOwogICAgfSk7CiAgfTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4reC5iOC4suC4meC4guC5ieC4reC4hOC4',
  'p+C4suC4oeC4iOC4suC4geC4o+C4ueC4myAoT0NSKSDguYHguKXguYnguKfguIrguYjguKfguKLguIHguKPguK3guIHguJ/guK3guKPguYzguKEKCiAgIOC4l+C4uOC4geC4hOC5iOC4suC4l+C4teC5iOC5hOC4lOC5ieC5gOC4m+C5h+C4meC5geC4hOC5iOC4guC5',
  'ieC4reC5gOC4quC4meC4rSDguJzguLnguYnguYPguIrguYnguIHguJTguYDguJXguLTguKHguYDguK3guIfguJfguLXguKXguLDguIrguYjguK3guIfguKvguKPguLfguK3guYDguJXguLTguKHguJfguLHguYnguIfguKvguKHguJTguIHguYfguYTguJTguYkKICAg',
  '4LmB4Lil4Liw4LmB4LiB4LmJ4LmE4LiC4LiV4LmI4Lit4LmE4LiU4LmJ4LmA4Liq4Lih4LitIOC5gOC4nuC4o+C4suC4sOC4leC4seC4p+C4reC5iOC4suC4meC4nuC4peC4suC4lOC5hOC4lOC5iSDguYLguJTguKLguYDguInguJ7guLLguLDguKXguLLguKLguKHg',
  'uLfguK3guIHguLHguJrguKPguLnguJvguYDguK3guLXguKLguIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgp2YXIgT0NSX01BWCA9IDggKiAxMDI0ICogMTAyNDsgICAvLyDguKPguLng',
  'uJvguYPguKvguI3guYjguIHguKfguYjguLLguJnguLXguYnguKrguYjguIfguYTguJvguK3guYjguLLguJnguYHguKXguYnguKfguKHguLHguIHguKvguKHguJTguYDguKfguKXguLIKCmZ1bmN0aW9uIG9jclVzYWJsZSgpewogIHJldHVybiAhIShGT1JNLm9jciAm',
  'JiBTLmJvb3QgJiYgUy5ib290LnNldHRpbmdzICYmIFMuYm9vdC5zZXR0aW5ncy5vY3JFbmFibGVkKTsKfQoKLyoqIOC4o+C4ueC4m+C5geC4o+C4geC4l+C4teC5iOC4nuC4reC4reC5iOC4suC4meC5hOC4lOC5iSAo4LiC4LmJ4Liy4Lih4LmE4Lif4Lil4LmM4LmD',
  '4Lir4LiN4LmI4LmA4LiB4Li04LiZ4LmB4Lil4Liw4LmE4Lif4Lil4LmM4LiX4Li14LmI4LmE4Lih4LmI4LmD4LiK4LmI4Lij4Li54LibL1BERikgKi8KZnVuY3Rpb24gZmlyc3RSZWFkYWJsZShmaWxlcyl7CiAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWxlcy5sZW5n',
  'dGg7IGkrKykgewogICAgdmFyIGYgPSBmaWxlc1tpXTsKICAgIGlmIChmLnNpemUgPD0gT0NSX01BWCAmJiAvXmltYWdlXC98cGRmJC8udGVzdChmLnR5cGUgfHwgJycpKSByZXR1cm4gZjsKICB9CiAgcmV0dXJuIG51bGw7Cn0KCi8qKgogKiBAcGFyYW0ge3N0cmlu',
  'Z30gaWQgIGlkIOC4guC4reC4h+C4iuC5iOC4reC4h+C5geC4meC4muC5hOC4n+C4peC5jCDguYDguIrguYjguJkgZl9zbGlwcwogKiBAcGFyYW0ge2Jvb2xlYW59IGF1dG8gdHJ1ZSA9IOC5gOC4leC4tOC4oeC4iuC5iOC4reC4h+C4l+C4teC5iOC4ouC4seC4h+C4',
  'p+C5iOC4suC4h+C5g+C4q+C5ieC5gOC4peC4ouC5guC4lOC4ouC5hOC4oeC5iOC4leC5ieC4reC4h+C4geC4lAogKi8KZnVuY3Rpb24gcnVuT2NyKGlkLCBhdXRvKXsKICB2YXIgaW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7CiAgdmFyIHNsb3Qg',
  'PSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCArICdfb2NyJyk7CiAgaWYgKCFpbnB1dCB8fCAhc2xvdCkgcmV0dXJuOwoKICB2YXIgZmlsZSA9IGZpcnN0UmVhZGFibGUoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoaW5wdXQuZmlsZXMgfHwgW10pKTsKICBp',
  'ZiAoIWZpbGUpIHsgc2xvdC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz0iaGludCBtdDgiPuC5hOC4oeC5iOC4oeC4teC4o+C4ueC4m+C4l+C4teC5iOC4reC5iOC4suC4meC5hOC4lOC5iSAo4Lij4Lit4LiH4Lij4Lix4Lia4Lij4Li54Lib4Lig4Liy4Lie4LmB4Lil',
  '4LiwIFBERiDguYTguKHguYjguYDguIHguLTguJkgOCBNQik8L2Rpdj4nOyByZXR1cm47IH0KCiAgc2xvdC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz0ib2NyLWJveCI+PGRpdiBjbGFzcz0iaGQiPjxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4',
  'seC4h+C4reC5iOC4suC4meC4guC5ieC4reC4hOC4p+C4suC4oeC4iOC4suC4gSAnICsKICAgICAgICAgICAgICAgICAgIGVzYyhmaWxlLm5hbWUuc2xpY2UoMCwgMjgpKSArICfigKY8L2Rpdj48L2Rpdj4nOwoKICByZWFkQXNEYXRhVXJsKGZpbGUpLnRoZW4oZnVu',
  'Y3Rpb24ocCl7CiAgICByZXR1cm4gY2FsbEFwaSgnb2NyLnJlYWQnLCB7IGRhdGFVcmw6IHAuZGF0YVVybCwgbWltZVR5cGU6IHAubWltZVR5cGUgfSk7CiAgfSkudGhlbihmdW5jdGlvbihyKXsKICAgIHNsb3QuaW5uZXJIVE1MID0gb2NyQm94SHRtbChpZCwgcik7',
  'CiAgICBPQ1JfTEFTVFtpZF0gPSByOwogICAgaWYgKGF1dG8pIHsKICAgICAgdmFyIG4gPSBvY3JBcHBseUFsbChpZCwgdHJ1ZSk7CiAgICAgIHRvYXN0KG4gPyAn4Lit4LmI4Liy4LiZ4Lij4Li54Lib4LmB4Lil4LmJ4LinIOC5gOC4leC4tOC4oeC5g+C4q+C5iSAn',
  'ICsgbiArICcg4LiK4LmI4Lit4LiHIOKAlCDguJXguKPguKfguIjguJTguLnguIHguYjguK3guJnguJrguLHguJnguJfguLbguIHguJnguLAnIDogJ+C4reC5iOC4suC4meC4o+C4ueC4m+C5geC4peC5ieC4pyDguYHguJXguYjguKLguLHguIfguIjguLHguJrguITg',
  'uYjguLLguJfguLXguYjguYPguIrguYnguYTguJTguYnguYTguKHguYjguYTguJTguYknLCBuID8gJ29rJyA6ICcnKTsKICAgIH0KICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgIHNsb3QuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9Im9jci1ib3giPjxkaXYgY2xh',
  'c3M9ImhkIj7imqDvuI8g4Lit4LmI4Liy4LiZ4Lij4Li54Lib4LmE4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIPC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJoaW50Ij4nICsgZXNjKGUubWVzc2FnZSB8fCBlKSArICc8L2Rpdj4nICsKICAgICAgJzxidXR0b24g',
  'dHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIG10OCIgb25jbGljaz0icnVuT2NyKFwnJyArIGlkICsgJ1wnKSI+4Lil4Lit4LiH4Lit4Li14LiB4LiE4Lij4Lix4LmJ4LiHPC9idXR0b24+PC9kaXY+JzsKICB9KTsKfQoKdmFyIE9DUl9MQVNUID0ge307CgovKiog',
  '4LiE4LmI4Liy4LiX4Li14LmI4Lit4LmI4Liy4LiZ4LmE4LiU4LmJIOC4hOC4ueC5iOC4geC4seC4muC4iuC5iOC4reC4h+C5g+C4meC4n+C4reC4o+C5jOC4oeC4l+C4teC5iOC4iOC4sOC5gOC4reC4suC5hOC4m+C5g+C4quC5iCAqLwpmdW5jdGlvbiBvY3JQYWly',
  'cyhyKXsKICB2YXIgbSA9IEZPUk0ub2NyIHx8IHt9OwogIHZhciBnID0gci5ndWVzcyB8fCB7fTsKICB2YXIgb3V0ID0gW107CiAgaWYgKG0uZGF0ZSAgICYmIGcuZGF0ZSkgICBvdXQucHVzaCh7IGZpZWxkOiBtLmRhdGUsICAgbGFiZWw6ICfguKfguLHguJnguJfg',
  'uLXguYgnLCAgICAgdmFsdWU6IGcuZGF0ZSwgICBzaG93OiB0aERhdGUoZy5kYXRlKSB9KTsKICBpZiAobS5hbW91bnQgJiYgZy5hbW91bnQpIG91dC5wdXNoKHsgZmllbGQ6IG0uYW1vdW50LCBsYWJlbDogJ+C4iOC4s+C4meC4p+C4meC5gOC4h+C4tOC4mScsICB2',
  'YWx1ZTogZy5hbW91bnQsIHNob3c6IGJhaHQoZy5hbW91bnQpIH0pOwogIGlmIChtLnZlbmRvciAmJiBnLnZlbmRvcikgb3V0LnB1c2goeyBmaWVsZDogbS52ZW5kb3IsIGxhYmVsOiAn4Lij4LmJ4Liy4LiZL+C4nOC4ueC5ieC4guC4suC4oicsIHZhbHVlOiBnLnZl',
  'bmRvciwgc2hvdzogZy52ZW5kb3IgfSk7CiAgaWYgKG0udGl0bGUgICYmIGcudGl0bGUpICBvdXQucHVzaCh7IGZpZWxkOiBtLnRpdGxlLCAgbGFiZWw6ICfguIrguLfguYjguK3guKPguLLguKLguIHguLLguKMnLCAgdmFsdWU6IGcudGl0bGUsICBzaG93OiBnLnRp',
  'dGxlIH0pOwogIGlmIChtLm5vdGUgICAmJiBnLnJlZikgICAgb3V0LnB1c2goeyBmaWVsZDogbS5ub3RlLCAgIGxhYmVsOiAn4LmA4Lil4LiC4Lit4LmJ4Liy4LiH4Lit4Li04LiHJywgIHZhbHVlOiAn4Lit4LmJ4Liy4LiH4Lit4Li04LiHICcgKyBnLnJlZiwgc2hv',
  'dzogZy5yZWYgfSk7CiAgLy8g4LmD4Lia4LmA4Liq4Lij4LmH4LiI4Lir4Lil4Liy4Lii4Lij4Liy4Lii4LiB4Liy4LijCiAgaWYgKGcuaXRlbXMgJiYgZy5pdGVtcy5sZW5ndGggPiAxKSB7CiAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfbGluZXMn',
  'KSkgewogICAgICAvLyDguJ/guK3guKPguYzguKHguJnguLXguYnguKHguLXguJXguLLguKPguLLguIfguKPguLLguKLguIHguLLguKPguKLguYjguK3guKIg4oCUIOC5gOC4leC4tOC4oeC4peC4h+C4leC4suC4o+C4suC4h+C5gOC4peC4oiDguYTguJTguYnguJfg',
  'uLHguYnguIfguIrguLfguYjguK0g4LiI4Liz4LiZ4Lin4LiZIOC5geC4peC4sOC4o+C4suC4hOC4suC5geC4ouC4geC4geC4seC4mQogICAgICBvdXQucHVzaCh7IGZpZWxkOiAnX2xpbmVzJywgbGFiZWw6ICfguKPguLLguKLguIHguLLguKPguYPguJnguJrguLTg',
  'uKUnLCB2YWx1ZTogZy5pdGVtcywKICAgICAgICAgICAgICAgICBzaG93OiAn4LmA4LiV4Li04LihICcgKyBnLml0ZW1zLmxlbmd0aCArICcg4Lij4Liy4Lii4LiB4Liy4Lij4Lil4LiH4LiV4Liy4Lij4Liy4LiHJywgbGluZXM6IHRydWUgfSk7CiAgICB9IGVsc2Ug',
  'aWYgKG0udGl0bGUpIHsKICAgICAgdmFyIGxpbmVzID0gZy5pdGVtcy5tYXAoZnVuY3Rpb24oaXQsIGkpeyByZXR1cm4gKGkrMSkgKyAnLicgKyBpdC5uYW1lICsgJyAnICsgbW9uZXkoaXQucHJpY2UsIDIpICsgJyDguL8nOyB9KS5qb2luKCdcbicpOwogICAgICBv',
  'dXQucHVzaCh7IGZpZWxkOiBtLnRpdGxlLCBsYWJlbDogJ+C4l+C4uOC4geC4o+C4suC4ouC4geC4suC4oyAoJyArIGcuaXRlbXMubGVuZ3RoICsgJyknLCB2YWx1ZTogbGluZXMsCiAgICAgICAgICAgICAgICAgc2hvdzogZy5pdGVtcy5sZW5ndGggKyAnIOC4o+C4',
  'suC4ouC4geC4suC4o+C5g+C4meC5g+C4muC5gOC4quC4o+C5h+C4iCcsIG11bHRpOiB0cnVlIH0pOwogICAgfQogIH0KICByZXR1cm4gb3V0Owp9CgpmdW5jdGlvbiBvY3JCb3hIdG1sKGlkLCByKXsKICB2YXIgcGFpcnMgPSBvY3JQYWlycyhyKTsKICBpZiAoIXBh',
  'aXJzLmxlbmd0aCkgewogICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJvY3ItYm94Ij48ZGl2IGNsYXNzPSJoZCI+8J+UjiDguK3guYjguLLguJnguILguYnguK3guITguKfguLLguKHguYTguJTguYkg4LmB4LiV4LmI4Lii4Lix4LiH4LiI4Lix4Lia4LiE4LmI4Liy4LiX',
  '4Li14LmI4LmD4LiK4LmJ4LmE4LiU4LmJ4LmE4Lih4LmI4LmE4LiU4LmJJyArCiAgICAgICc8c3BhbiBjbGFzcz0ic3AiPjxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJvY3JUb2dnbGVSYXcoXCcnICsgaWQgKyAnXCcpIj7guJTg',
  'uLnguILguYnguK3guITguKfguLLguKHguJfguLXguYjguK3guYjguLLguJnguYTguJTguYk8L2J1dHRvbj48L3NwYW4+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJvY3ItcmF3IiBpZD0iJyArIGlkICsgJ19yYXciIGhpZGRlbj4nICsgZXNjKHIudGV4dCB8',
  'fCAnKOC4p+C5iOC4suC4hyknKSArICc8L2Rpdj48L2Rpdj4nOwogIH0KICByZXR1cm4gJzxkaXYgY2xhc3M9Im9jci1ib3giPicgKwogICAgJzxkaXYgY2xhc3M9ImhkIj7wn5SOIOC4reC5iOC4suC4meC4iOC4suC4geC4o+C4ueC4m+C5hOC4lOC5ieC5geC4muC4',
  'muC4meC4teC5iSDigJQg4LiB4LiU4LmA4LiV4Li04Lih4LiK4LmI4Lit4LiH4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LiB4Liy4LijJyArCiAgICAgICc8c3BhbiBjbGFzcz0ic3AiPicgKwogICAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBz',
  'bSBwcmkiIG9uY2xpY2s9Im9jckFwcGx5QWxsKFwnJyArIGlkICsgJ1wnKSI+4LmA4LiV4Li04Lih4LiX4Lix4LmJ4LiH4Lir4Lih4LiUPC9idXR0b24+JyArCiAgICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJvY3JU',
  'b2dnbGVSYXcoXCcnICsgaWQgKyAnXCcpIj7guILguYnguK3guITguKfguLLguKHguYDguJXguYfguKE8L2J1dHRvbj4nICsKICAgICAgJzwvc3Bhbj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJvY3ItaGl0cyI+JyArIHBhaXJzLm1hcChmdW5jdGlvbihwLCBp',
  'KXsKICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJvY3ItaGl0Ij4nICsKICAgICAgICAnPHNwYW4gY2xhc3M9ImsiPicgKyBlc2MocC5sYWJlbCkgKyAnPC9zcGFuPicgKwogICAgICAgICc8c3BhbiBjbGFzcz0idiIgdGl0bGU9IicgKyBlc2MocC5saW5lcyA/IHAu',
  'c2hvdyA6IFN0cmluZyhwLnZhbHVlKSkgKyAnIj4nICsgZXNjKHAuc2hvdykgKyAnPC9zcGFuPicgKwogICAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0ib2NyQXBwbHlPbmUoXCcnICsgaWQgKyAnXCcsJyArIGkgKyAn',
  'KSI+4LmA4LiV4Li04LihPC9idXR0b24+JyArCiAgICAgICc8L2Rpdj4nOwogICAgfSkuam9pbignJykgKyAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0ib2NyLXJhdyIgaWQ9IicgKyBpZCArICdfcmF3IiBoaWRkZW4+JyArIGVzYyhyLnRleHQgfHwgJyjguKfg',
  'uYjguLLguIcpJykgKyAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iaGludCBtdDgiPuC4leC4o+C4p+C4iOC4hOC4p+C4suC4oeC4luC4ueC4geC4leC5ieC4reC4h+C4geC5iOC4reC4meC4muC4seC4meC4l+C4tuC4geC5gOC4quC4oeC4rSDigJQg4LmB4LiB',
  '4LmJ4LmD4LiZ4LiK4LmI4Lit4LiH4LmE4LiU4LmJ4LiV4Liy4Lih4Lib4LiB4LiV4Li0PC9kaXY+JyArCiAgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIG9jclRvZ2dsZVJhdyhpZCl7CiAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQgKyAnX3Jhdycp',
  'OwogIGlmIChlbCkgZWwuaGlkZGVuID0gIWVsLmhpZGRlbjsKfQoKLyoqIOC5g+C4quC5iOC4hOC5iOC4suC4peC4h+C4iuC5iOC4reC4hyDguYHguKXguYnguKfguYTguK7guYTguKXguJXguYzguYPguKvguYnguYDguKvguYfguJnguKfguYjguLLguIrguYjguK3g',
  'uIfguYTguKvguJnguJbguLnguIHguYDguJXguLTguKEgKi8KZnVuY3Rpb24gb2NyRmlsbChmaWVsZEtleSwgdmFsdWUpewogIC8vIOC5gOC4leC4tOC4oeC4peC4h+C4leC4suC4o+C4suC4h+C4o+C4suC4ouC4geC4suC4o+C4ouC5iOC4reC4oiAo4LmD4Lia4LmA',
  '4Liq4Lij4LmH4LiI4LiX4Li14LmI4Lih4Li14LiC4Lit4LiH4Lir4Lil4Liy4Lii4Lit4Lii4LmI4Liy4LiHKQogIGlmIChmaWVsZEtleSA9PT0gJ19saW5lcycpIHsKICAgIHZhciBhZGQgPSAodmFsdWUgfHwgW10pLm1hcChmdW5jdGlvbihpdCl7CiAgICAgIHJl',
  'dHVybiB7IG5hbWU6IGl0Lm5hbWUsIHF0eTogMSwgdW5pdDogJycsIHByaWNlOiBOdW1iZXIoaXQucHJpY2UpIHx8IDAgfTsKICAgIH0pOwogICAgaWYgKCFhZGQubGVuZ3RoKSByZXR1cm4gZmFsc2U7CiAgICBGT1JNLmxpbmVzID0gKEZPUk0ubGluZXMgfHwgW10p',
  'LmZpbHRlcihmdW5jdGlvbihsKXsgcmV0dXJuIFN0cmluZyhsLm5hbWUgfHwgJycpLnRyaW0oKTsgfSkuY29uY2F0KGFkZCk7CiAgICByZWRyYXdMaW5lcygpOwogICAgdmFyIGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2xpbmVzJyk7CiAgICBpZiAo',
  'Ym94KSB7CiAgICAgIGJveC5jbGFzc0xpc3QuYWRkKCdvY3ItZmlsbGVkJyk7CiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgYm94LmNsYXNzTGlzdC5yZW1vdmUoJ29jci1maWxsZWQnKTsgfSwgMTYwMCk7CiAgICB9CiAgICByZXR1cm4gdHJ1ZTsKICB9Cgog',
  'IHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmXycgKyBmaWVsZEtleSk7CiAgaWYgKCFlbCkgcmV0dXJuIGZhbHNlOwogIGVsLnZhbHVlID0gdmFsdWU7CiAgZWwuY2xhc3NMaXN0LmFkZCgnb2NyLWZpbGxlZCcpOwogIHNldFRpbWVvdXQoZnVuY3Rp',
  'b24oKXsgZWwuY2xhc3NMaXN0LnJlbW92ZSgnb2NyLWZpbGxlZCcpOyB9LCAxNjAwKTsKICByZWNhbGNTdW1zKCk7CiAgcmV0dXJuIHRydWU7Cn0KCmZ1bmN0aW9uIG9jckFwcGx5T25lKGlkLCBpZHgpewogIHZhciByID0gT0NSX0xBU1RbaWRdOwogIGlmICghcikg',
  'cmV0dXJuOwogIHZhciBwID0gb2NyUGFpcnMocilbaWR4XTsKICBpZiAocCAmJiBvY3JGaWxsKHAuZmllbGQsIHAudmFsdWUpKSB7CiAgICB0b2FzdChwLmxpbmVzID8gJ+C5gOC4leC4tOC4oSAnICsgcC52YWx1ZS5sZW5ndGggKyAnIOC4o+C4suC4ouC4geC4suC4',
  'o+C4peC4h+C4muC4tOC4peC5geC4peC5ieC4pyDigJQg4LiV4Lij4Lin4LiI4LiI4Liz4LiZ4Lin4LiZ4LiB4Lix4Lia4Lij4Liy4LiE4Liy4Lit4Li14LiB4LiE4Lij4Lix4LmJ4LiHJyA6ICfguYDguJXguLTguKEnICsgcC5sYWJlbCArICfguYHguKXguYnguKcn',
  'LCAnb2snKTsKICB9Cn0KCi8qKgogKiBAcGFyYW0ge2Jvb2xlYW59IG9ubHlFbXB0eSB0cnVlID0g4LmA4LiV4Li04Lih4LmA4LiJ4Lie4Liy4Liw4LiK4LmI4Lit4LiH4LiX4Li14LmI4Lii4Lix4LiH4Lin4LmI4Liy4LiHICjguYPguIrguYnguJXguK3guJnguYDg',
  'uJXguLTguKHguK3guLHguJXguYLguJnguKHguLHguJXguLQKICogICAgICAgICAgICAgICAgICAgICAgICAgICAg4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4LiX4Lix4Lia4Liq4Li04LmI4LiH4LiX4Li14LmI4Lic4Li54LmJ4LmD4LiK4LmJ4Lie4Li04Lih4Lie',
  '4LmM4LmE4Lib4LmB4Lil4LmJ4LinKQogKiBAcmV0dXJuIHtudW1iZXJ9IOC4iOC4s+C4meC4p+C4meC4iuC5iOC4reC4h+C4l+C4teC5iOC5gOC4leC4tOC4oeC4iOC4o+C4tOC4hwogKi8KZnVuY3Rpb24gb2NyQXBwbHlBbGwoaWQsIG9ubHlFbXB0eSl7CiAgdmFy',
  'IHIgPSBPQ1JfTEFTVFtpZF07CiAgaWYgKCFyKSByZXR1cm4gMDsKICB2YXIgZG9uZSA9IHt9OwogIHZhciBuID0gMDsKICBvY3JQYWlycyhyKS5mb3JFYWNoKGZ1bmN0aW9uKHApewogICAgaWYgKGRvbmVbcC5maWVsZF0pIHJldHVybjsgICAgICAgICAgICAgICAg',
  'ICAgICAgIC8vIOC4iuC5iOC4reC4h+C5gOC4lOC4teC4ouC4p+C4geC4seC4meC5gOC4leC4tOC4oeC4hOC4o+C4seC5ieC4h+C5gOC4lOC4teC4ouC4pyDguYDguK3guLLguJXguLHguKfguYHguKPguIEKICAgIGlmIChwLmZpZWxkID09PSAnX2xpbmVzJykgewog',
  'ICAgICAvLyDguJXguLLguKPguLLguIfguKPguLLguKLguIHguLLguKPguKLguYjguK3guKI6ICLguKfguYjguLLguIciIOC4q+C4oeC4suC4ouC4luC4tuC4h+C4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4leC4seC5',
  'ieC4h+C4iuC4t+C5iOC4reC5hOC4p+C5iQogICAgICBpZiAob25seUVtcHR5ICYmIChGT1JNLmxpbmVzIHx8IFtdKS5zb21lKGZ1bmN0aW9uKGwpeyByZXR1cm4gU3RyaW5nKGwubmFtZSB8fCAnJykudHJpbSgpOyB9KSkgcmV0dXJuOwogICAgfSBlbHNlIHsKICAg',
  'ICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyArIHAuZmllbGQpOwogICAgICBpZiAoIWVsKSByZXR1cm47CiAgICAgIGlmIChvbmx5RW1wdHkgJiYgU3RyaW5nKGVsLnZhbHVlIHx8ICcnKS50cmltKCkgIT09ICcnKSByZXR1cm47CiAgICB9',
  'CiAgICBpZiAob2NyRmlsbChwLmZpZWxkLCBwLnZhbHVlKSkgeyBkb25lW3AuZmllbGRdID0gdHJ1ZTsgbisrOyB9CiAgfSk7CiAgaWYgKCFvbmx5RW1wdHkpIHRvYXN0KG4gPyAn4LmA4LiV4Li04Lih4LmD4Lir4LmJICcgKyBuICsgJyDguIrguYjguK3guIfguYHg',
  'uKXguYnguKcg4oCUIOC4leC4o+C4p+C4iOC4lOC4ueC4geC5iOC4reC4meC4muC4seC4meC4l+C4tuC4gScgOiAn4LiK4LmI4Lit4LiH4LiX4Li14LmI4LiI4Liw4LmA4LiV4Li04Lih4LmE4Lih4LmI4Lit4Lii4Li54LmI4LmD4LiZ4Lif4Lit4Lij4LmM4Lih4LiZ',
  '4Li14LmJJywgbiA/ICdvaycgOiAnZXJyJyk7CiAgcmV0dXJuIG47Cn0KCmZ1bmN0aW9uIHJvb21PcHRpb25zKCl7IHJldHVybiBTLmJvb3QgPyBTLmJvb3Qucm9vbXMgOiBbXTsgfQpmdW5jdGlvbiBvcHQobmFtZSl7IHJldHVybiAoUy5ib290ICYmIFMuYm9vdC5z',
  'Y2hlbWFbbmFtZV0pIHx8IFtdOyB9Ci8qKiDguKfguLHguJnguJnguLXguYnguJXguLLguKHguYDguKfguKXguLLguYPguJnguYDguITguKPguLfguYjguK3guIcg4oCUIOC4q+C5ieC4suC4oeC5g+C4iuC5iSB0b0lTT1N0cmluZygpIOC5gOC4nuC4o+C4suC4sOC5',
  'gOC4m+C5h+C4meC5gOC4p+C4peC4siBVVEMg4LiK4LmI4Lin4LiH4LmA4LiX4Li14LmI4Lii4LiH4LiE4Li34LiZ4oCTNyDguYLguKHguIfguYDguIrguYnguLLguYDguKfguKXguLLguYTguJfguKLguIjguLDguYTguJTguYnguKfguLHguJnguJfguLXguYjguILg',
  'uK3guIfguYDguKHguLfguYjguK3guKfguLLguJkgKi8KZnVuY3Rpb24gdG9kYXkoKXsKICB2YXIgZCA9IG5ldyBEYXRlKCk7CiAgcmV0dXJuIGQuZ2V0RnVsbFllYXIoKSArICctJyArICgnMCcgKyAoZC5nZXRNb250aCgpICsgMSkpLnNsaWNlKC0yKSArICctJyAr',
  'ICgnMCcgKyBkLmdldERhdGUoKSkuc2xpY2UoLTIpOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguIHguYnguK3guJnguKvguJnguLXguYkKICAgPT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1EZWJ0KHJlYywgbGVkZ2VyKXsKICAvLyDguYDguKXguLfguK3guIHguYHguKHguYjguYTguJTguYnguIjguLLguIHguJfguLjguIHg',
  'uJrguLHguI3guIrguLUg4Lii4LiB4LmA4Lin4LmJ4LiZ4LiV4Lix4Lin4LmA4Lit4LiHCiAgdmFyIGFsbCA9IChBTExfREVCVFMgfHwgW10pLmZpbHRlcihmdW5jdGlvbihkKXsgcmV0dXJuICFyZWMgfHwgZC5pZCAhPT0gcmVjLmlkOyB9KTsKICBvcGVuRm9ybSh7',
  'CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguIHguYnguK3guJnguKvguJnguLXguYknIDogJ+C5gOC4nuC4tOC5iOC4oeC4geC5ieC4reC4meC4q+C4meC4teC5iScsCiAgICByZWNvcmQ6IHJlYywgYWN0aW9uOiAnZGVidC5zYXZl',
  'JywgYmFzZTogeyBsZWRnZXI6IGxlZGdlciB9LAogICAgb25EZWxldGU6IGRlbERlYnQsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3RpdGxlJywgICAgbGFiZWw6J+C4o+C4suC4ouC4geC4suC4o+C4q+C4meC4teC5iScsIHJlcXVpcmVkOnRydWUsIGZ1bGw6',
  'dHJ1ZSwgcGg6J+C5gOC4iuC5iOC4mSDguITguYjguLLguIHguYjguK3guKrguKPguYnguLLguIcgVGhlIE0gQ29ybmVyIEFQJyB9LAogICAgICB7IGtleTonbGVkZ2VyJywgICBsYWJlbDon4Lib4Lij4Liw4LmA4Lig4LiX4Lia4Lix4LiN4LiK4Li1JywgdHlwZTon',
  'c2VsZWN0Jywgb3B0aW9uczpbJ+C4q+C4meC4teC5ieC4q+C4peC4seC4gScsJ+C4q+C4meC4teC5ieC4o+C4reC4hyddLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleTonY3JlZGl0b3InLCBsYWJlbDon4LmA4LiI4LmJ4Liy4Lir4LiZ4Li14LmJJywgcGg6J+C5',
  'gOC4iuC5iOC4mSDguITguKPguK3guJrguITguKPguLHguKcgLyDguJjguJnguLLguITguLLguKMgLyDguJvguYnguLLguJXguLInIH0sCiAgICAgIHsga2V5OidwYXJlbnRJZCcsIGxhYmVsOifguYDguJvguYfguJnguKrguYjguKfguJnguKvguJnguLbguYjguIfg',
  'uILguK3guIfguIHguYnguK3guJnguKvguJnguLXguYknLCB0eXBlOidzZWxlY3QnLCBmdWxsOnRydWUsCiAgICAgICAgb3B0aW9uczogYWxsLm1hcChmdW5jdGlvbihkKXsgcmV0dXJuIHsgdmFsdWU6ZC5pZCwgbGFiZWw6ZC50aXRsZSArICcgKCcgKyBkLmxlZGdl',
  'ciArICcpJyB9OyB9KSwKICAgICAgICBoaW50OifguYPguIrguYnguYDguKHguLfguYjguK3guYDguIfguLTguJnguIHguYnguK3guJnguJnguLXguYnguYDguJvguYfguJnguJfguLjguJnguILguK3guIfguK3guLXguIHguIHguYnguK3guJkg4LmA4LiK4LmI4LiZ',
  'IOC5gOC4h+C4tOC4meC4ouC4t+C4oeC4m+C5ieC4suC4leC4suC5gOC4m+C5h+C4meC4quC5iOC4p+C4meC4q+C4meC4tuC5iOC4h+C4guC4reC4h+C4q+C4meC4teC5ieC4i+C4t+C5ieC4reC4l+C4teC5iOC4lOC4tOC4mSDigJQgJyArCiAgICAgICAgICAgICAn',
  '4LiI4LmI4Liy4Lii4LiE4Li34LiZ4LiB4LmJ4Lit4LiZ4LiZ4Li14LmJ4LmB4Lil4LmJ4Lin4LiB4LmJ4Lit4LiZ4LmB4Lih4LmI4LiI4Liw4Lil4LiU4LiV4Liy4Lih4LmE4Lib4LiU4LmJ4Lin4LiiIOC5geC4peC4sOC4ouC4reC4lOC4o+C4p+C4oeC4iOC4sOC5',
  'hOC4oeC5iOC4luC4ueC4geC4meC4seC4muC4i+C5ieC4sycgfSwKICAgICAgeyBrZXk6J3N0YXJ0RGF0ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguIHguYjguK3guKvguJnguLXguYknLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleToncHJpbmNpcGFs',
  'JywgbGFiZWw6J+C4ouC4reC4lOC4q+C4meC4teC5ieC4leC4seC5ieC4h+C4leC5ieC4mSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JywgcmVxdWlyZWQ6dHJ1ZSB9LAogICAgICB7IGtleTonaW50ZXJlc3RQZXJNb250aCcsIGxhYmVsOifguJTguK3guIHguYDg',
  'uJrguLXguYnguKLguJXguYjguK3guYDguJTguLfguK3guJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScgfSwKICAgICAgeyBrZXk6J3BsYW5QZXJNb250aCcsIGxhYmVsOifguKLguK3guJTguJzguYjguK3guJnguJXguYjguK3guYDguJTguLfguK3guJkgKOC4',
  'muC4suC4lyknLCB0eXBlOidtb25leScgfSwKICAgICAgeyBrZXk6J2R1ZURheScsICAgbGFiZWw6J+C4geC4s+C4q+C4meC4lOC4iuC4s+C4o+C4sCAo4Lin4Lix4LiZ4LiX4Li14LmI4LiC4Lit4LiH4LmA4LiU4Li34Lit4LiZKScsIHR5cGU6J251bWJlcicsIHBo',
  'OicyMCcgfSwKICAgICAgeyBrZXk6J3N0YXR1cycsICAgbGFiZWw6J+C4quC4luC4suC4meC4sCcsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdkZWJ0U3RhdHVzZXMnKSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J2Fsc29JbicsICAgbGFiZWw6J+C5',
  'geC4quC4lOC4h+C5g+C4meC4reC4teC4geC4q+C4meC5ieC4suC4lOC5ieC4p+C4oicsIHR5cGU6J3NlbGVjdCcsCiAgICAgICAgb3B0aW9uczpbIHsgdmFsdWU6J+C4q+C4meC4teC5ieC4o+C4reC4hycsIGxhYmVsOifguKvguJnguYnguLLguKvguJnguLXguYng',
  'uKrguLTguJknIH0sIHsgdmFsdWU6J+C4q+C4meC4teC5ieC4q+C4peC4seC4gScsIGxhYmVsOifguKvguJnguYnguLLguKPguLLguKLguIHguLLguKPguKrguKPguLjguJvguKPguKfguKEnIH0gXSwKICAgICAgICBoaW50OifguIHguYnguK3guJnguYDguJTguLXg',
  'uKLguKfguIHguLHguJkg4LmE4Lih4LmI4LmE4LiU4LmJ4LiE4Lix4LiU4Lil4Lit4LiBIOKAlCDguJrguLHguJnguJfguLbguIHguIHguLLguKPguIrguLPguKPguLAg4LmB4LiB4LmJIOC4q+C4o+C4t+C4reC4peC4muC4iOC4suC4geC4q+C4meC5ieC4suC5hOC4',
  'q+C4mSDguK3guLXguIHguKvguJnguYnguLLguIHguYfguYDguJvguKXguLXguYjguKLguJnguJXguLLguKEgwrcg4LmA4Lil4Li34Lit4LiB4Lir4LiZ4LmJ4Liy4LmA4LiU4Li14Lii4Lin4LiB4Lix4Lia4Lib4Lij4Liw4LmA4Lig4LiX4Lia4Lix4LiN4LiK4Li1',
  '4LmE4Lin4LmJID0g4LmE4Lih4LmI4Lih4Li14Lic4LilJyB9LAogICAgICB7IGtleTonbm90ZScsICAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwogIGlmICghcmVjKSB7',
  'IHZhciBlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfbGVkZ2VyJyk7IGlmIChlKSBlLnZhbHVlID0gbGVkZ2VyOyB9Cn0KCmZ1bmN0aW9uIGRlbERlYnQoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4geC5ieC4reC4meC4q+C4meC4teC5ieC4meC4',
  'teC5iT8gKOC4luC5ieC4suC4ouC4seC4h+C4oeC4teC4o+C4suC4ouC4geC4suC4o+C4iuC4s+C4o+C4sOC4q+C4o+C4t+C4reC4geC5ieC4reC4meC4ouC5iOC4reC4ouC4nOC4ueC4geC4reC4ouC4ueC5iCDguKPguLDguJrguJrguIjguLDguYTguKHguYjguKLg',
  'uK3guKHguKXguJog4LmA4Lie4Li34LmI4Lit4LmE4Lih4LmI4LmD4Lir4LmJ4Lii4Lit4LiU4Lii4LmJ4Liy4Lii4LmE4Lib4LiB4LmJ4Lit4LiZ4Lit4Li34LmI4LiZ4LmA4LiH4Li14Lii4LiaIOC5hiknLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgnZGVidC5k',
  'ZWxldGUnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsg',
  'fSk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3guKPguYzguKE6IOC4o+C4suC4ouC4geC4suC4o+C5guC4reC4meC5g+C4iuC5ieC4q+C4meC4teC5iQogICA9',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybURlYnRQYXltZW50KHJlYywgbGVkZ2VyKXsKICB2YXIgZGVidHMgPSAoUy5jYWNoZVtTLnBhZ2VdICYmIFMuY2FjaGVbUy5wYWdl',
  'XS5kZWJ0cykgfHwgW107CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4Lij4Liy4Lii4LiB4Liy4Lij4LiK4Liz4Lij4LiwJyA6ICfguJrguLHguJnguJfguLbguIHguIHguLLguKPguYLguK3guJnguYPguIrg',
  'uYnguKvguJnguLXguYknLAogICAgcmVjb3JkOiByZWMgfHwgeyBwYXlEYXRlOiB0b2RheSgpLCBjaGFubmVsOiAn4LmC4Lit4LiZIFFSJyB9LAogICAgLy8g4LmB4LiB4LmJ4Lij4Liy4Lii4LiB4Liy4Lij4LmA4LiU4Li04Lih4LiE4LiH4Lia4Lix4LiN4LiK4Li1',
  '4LmA4LiU4Li04Lih4LmE4Lin4LmJIOKAlCDguKPguLLguKLguIHguLLguKPguJfguLXguYjguKHguLLguIjguLLguIHguK3guLXguIHguKvguJnguYnguLIgKOC4geC5ieC4reC4meC4l+C4teC5iOC5geC4quC4lOC4h+C4o+C5iOC4p+C4oSkg4LiV4LmJ4Lit4LiH',
  '4LmE4Lih4LmI4LiW4Li54LiB4Lii4LmJ4Liy4Lii4Lia4Lix4LiN4LiK4Li1CiAgICBhY3Rpb246ICdkZWJ0LnNhdmVQYXltZW50JywgYmFzZTogeyBsZWRnZXI6IChyZWMgJiYgcmVjLmxlZGdlcikgfHwgbGVkZ2VyIH0sIGJ1Y2tldDogJ2RlYnQnLAogICAgb2Ny',
  'OiB7IGRhdGU6J3BheURhdGUnLCBhbW91bnQ6J3ByaW5jaXBhbCcsIG5vdGU6J25vdGUnIH0sCiAgICBvbkRlbGV0ZTogZGVsRGVidFBheW1lbnQsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3BheURhdGUnLCBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiK',
  '4Liz4Lij4LiwJywgdHlwZTonZGF0ZScsIHJlcXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J2NoYW5uZWwnLCBsYWJlbDon4LiK4LmI4Lit4LiH4LiX4Liy4LiHJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ3BheUNoYW5uZWxzJykgfSwKICAgICAgeyBr',
  'ZXk6J3ByaW5jaXBhbCcsIGxhYmVsOifguYDguIfguLTguJnguJXguYnguJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHN1bXM6dHJ1ZSwKICAgICAgICBoaW50OifguKrguYjguKfguJnguJfguLXguYjguYTguJvguKXguJTguKLguK3guJTguKvguJnguLXg',
  'uYnguIjguKPguLTguIcnIH0sCiAgICAgIHsga2V5OidpbnRlcmVzdCcsICBsYWJlbDon4LiU4Lit4LiB4LmA4Lia4Li14LmJ4LiiICjguJrguLLguJcpJywgdHlwZTonbW9uZXknLCBzdW1zOnRydWUsCiAgICAgICAgaGludDon4LmE4Lih4LmI4LiW4Li54LiB4LiZ',
  '4Liz4LmE4Lib4Lil4LiU4Lii4Lit4LiU4Lir4LiZ4Li14LmJJyB9LAogICAgICB7IGtleTonX3RvdGFsJywgIGxhYmVsOifguKPguKfguKHguJfguLXguYjguYLguK3guJknLCB0eXBlOidjb21wdXRlZCcsIGZyb206WydwcmluY2lwYWwnLCdpbnRlcmVzdCddLAog',
  'ICAgICAgIGhpbnQ6J+C4leC4o+C4p+C4iOC5g+C4q+C5ieC4leC4o+C4h+C4geC4seC4muC4ouC4reC4lOC5g+C4meC4quC4peC4tOC4myDCtyDguKPguLDguJrguJrguITguLTguJTguYPguKvguYnguK3guLHguJXguYLguJnguKHguLHguJXguLQnIH0sCiAgICAg',
  'IHsga2V5OidpbnN0YWxsbWVudCcsIGxhYmVsOifguIfguKfguJTguJfguLXguYgnLCBwaDon4LmA4LiK4LmI4LiZIDkvMjAyNicgfSwKICAgICAgeyBrZXk6J2RlYnRJZCcsICBsYWJlbDon4Lic4Li54LiB4LiB4Lix4Lia4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJ',
  'JywgdHlwZTonc2VsZWN0JywKICAgICAgICBvcHRpb25zOiBkZWJ0cy5tYXAoZnVuY3Rpb24oZCl7IHJldHVybiB7IHZhbHVlOmQuaWQsIGxhYmVsOmQudGl0bGUgfTsgfSksCiAgICAgICAgaGludDon4LmA4Lin4LmJ4LiZ4Lin4LmI4Liy4LiH4LmE4LiU4LmJIOKA',
  'lCDguKPguLDguJrguJrguJXguLHguJTguIHguYnguK3guJnguYDguIHguYjguLLguIHguYjguK3guJnguYPguKvguYnguYDguK3guIcgwrcg4LmA4Lil4Li34Lit4LiB4LiB4LmJ4Lit4LiZ4LiX4Li14LmI4Lih4Liy4LiI4Liy4LiB4Lit4Li14LiB4Lir4LiZ4LmJ',
  '4LiyIOC4ouC4reC4lOC4iOC4sOC5gOC4guC5ieC4suC4l+C4seC5ieC4h+C4quC4reC4h+C4q+C4meC5ieC4sicgfSwKICAgICAgeyBrZXk6J3BheWVyJywgICBsYWJlbDon4Lic4Li54LmJ4LiK4Liz4Lij4LiwJyB9LAogICAgICB7IGtleTonc2xpcHMnLCAgIGxh',
  'YmVsOifguKrguKXguLTguJvguIHguLLguKPguYLguK3guJknLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonbm90ZScsICAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9',
  'CiAgICBdCiAgfSk7Cn0KCi8qKgogKiDguKLguK3guJTguYPguJnguKPguLDguJrguJrguYTguKHguYjguJXguKPguIfguIHguLHguJrguKLguK3guJTguJfguLXguYjguYDguIjguYnguLLguKvguJnguLXguYnguYHguIjguYnguIcg4oaSIOC4geC4o+C4reC4geC4',
  'ouC4reC4lOC4hOC4h+C5gOC4q+C4peC4t+C4reC4iOC4o+C4tOC4hyDguKPguLDguJrguJrguJrguLHguJnguJfguLbguIHguKrguYjguKfguJnguJXguYjguLLguIfguYPguKvguYkKICog4LmE4Lih4LmI4LmE4Lib4LmB4LiB4LmJ4Lii4Lit4LiU4LiV4Lix4LmJ',
  '4LiH4LiV4LmJ4LiZIOC5gOC4nuC4o+C4suC4sOC4m+C4o+C4sOC4p+C4seC4leC4tOC4iOC4sOC5gOC4nuC4teC5ieC4ouC4mSDguKPguLLguKLguIHguLLguKPguJvguKPguLHguJrguKLguK3guJTguKXguJrguJfguLTguYnguIfguYTguJTguYnguJbguYnguLLg',
  'uIHguKPguK3guIHguJzguLTguJQKICovCmZ1bmN0aW9uIGZvcm1SZWNvbmNpbGVEZWJ0KHgpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiAn4Lib4Lij4Lix4Lia4Lii4Lit4LiU4LmD4Lir4LmJ4LiV4Lij4LiH4Lii4Lit4LiU4LiI4Lij4Li04LiHIMK3ICcgKyB4',
  'LnRpdGxlLAogICAgcmVjb3JkOiB7IHBheURhdGU6IHRvZGF5KCkgfSwKICAgIGFjdGlvbjogJ2RlYnQucmVjb25jaWxlJywgYmFzZTogeyBkZWJ0SWQ6IHguaWQgfSwKICAgIGZpZWxkczogWwogICAgICB7IGtleTonYWN0dWFsUmVtYWluaW5nJywgbGFiZWw6J+C4',
  'ouC4reC4lOC4hOC4h+C5gOC4q+C4peC4t+C4reC4iOC4o+C4tOC4h+C4leC4reC4meC4meC4teC5iSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JywgcmVxdWlyZWQ6dHJ1ZSwgZnVsbDp0cnVlLAogICAgICAgIGhpbnQ6J+C5g+C4meC4o+C4sOC4muC4muC4leC4',
  'reC4meC4meC4teC5ieC4hOC4h+C5gOC4q+C4peC4t+C4rSA8Yj4nICsgYmFodCh4LnJlbWFpbmluZykgKyAnPC9iPiDCtyDguJbguYnguLLguJvguLTguJTguKvguJnguLXguYnguIHguYnguK3guJnguJnguLXguYnguYHguKXguYnguKcg4LmD4Liq4LmIIDAnIH0s',
  'CiAgICAgIHsga2V5OidwYXlEYXRlJywgbGFiZWw6J+C4kyDguKfguLHguJnguJfguLXguYgnLCB0eXBlOidkYXRlJywgcmVxdWlyZWQ6dHJ1ZSB9LAogICAgICB7IGtleTonbm90ZScsICAgIGxhYmVsOifguKrguLLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJl',
  'YScsIGZ1bGw6dHJ1ZSwKICAgICAgICBwaDon4LmA4LiK4LmI4LiZIOC4oeC4teC4h+C4p+C4lOC4l+C4teC5iOC5hOC4oeC5iOC5hOC4lOC5ieC4muC4seC4meC4l+C4tuC4geC5hOC4p+C5iSAvIOC5gOC4iOC5ieC4suC4q+C4meC4teC5ieC4peC4lOC5g+C4q+C5',
  'iScsCiAgICAgICAgaGludDon4Lij4Liw4Lia4Lia4Lia4Lix4LiZ4LiX4Li24LiB4Liq4LmI4Lin4LiZ4LiV4LmI4Liy4LiH4LmA4Lib4LmH4LiZ4Lij4Liy4Lii4LiB4Liy4Lij4LiK4LmI4Lit4LiH4LiX4Liy4LiHICLguJvguKPguLHguJrguKLguK3guJQiIOC4',
  'nOC4ueC4geC4geC4seC4muC4geC5ieC4reC4meC4meC4teC5iSAnICsKICAgICAgICAgICAgICfguYTguKHguYjguJnguLHguJrguYDguJvguYfguJnguKLguK3guJTguJzguYjguK3guJnguKPguLLguKLguJvguLXguYHguKXguLDguYTguKHguYjguYPguIrguYng',
  'uITguLLguJTguIHguLLguKPguJPguYzguKfguLHguJnguJvguLTguJTguKvguJnguLXguYkgwrcg4LiB4Lij4Lit4LiB4Lic4Li04LiU4LiB4LmH4Lil4Lia4Lij4Liy4Lii4LiB4Liy4Lij4LiZ4Lix4LmJ4LiZ4LiX4Li04LmJ4LiH4LmE4LiU4LmJJyB9CiAgICBd',
  'CiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbERlYnRQYXltZW50KGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguKPguLLguKLguIHguLLguKPguIrguLPguKPguLDguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2RlYnQuZGVsZXRlUGF5bWVudCcs',
  'IHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9',
  'KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHCiAgID09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtUHVyY2hhc2UocmVjKXsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguKPguLLguKLguIHguLLguKPg',
  'uIvguLfguYnguK0nIDogJ+C5gOC4nuC4tOC5iOC4oeC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4hycsCiAgICByZWNvcmQ6IHJlYyB8fCB7IGJ1eURhdGU6IHRvZGF5KCkgfSwKICAgIGFjdGlvbjogJ3B1cmNoYXNlLnNhdmUnLCBidWNrZXQ6',
  'ICdwdXJjaGFzZXMnLCB3aWRlOiB0cnVlLAogICAgb2NyOiB7IGRhdGU6J2J1eURhdGUnLCBhbW91bnQ6J3ByaWNlJywgdmVuZG9yOid2ZW5kb3InLCB0aXRsZTonaXRlbScgfSwKICAgIG9uRGVsZXRlOiBkZWxQdXJjaGFzZSwKICAgIGZpZWxkczogWwogICAgICB7',
  'IGtleTonaXRlbScsICAgIGxhYmVsOifguIrguLfguYjguK3guJrguLTguKUgLyDguKPguLLguKLguIHguLLguKPguKvguKXguLHguIEnLCB0eXBlOid0ZXh0YXJlYScsIHJlcXVpcmVkOnRydWUsIGZ1bGw6dHJ1ZSwKICAgICAgICBwaDon4LmA4LiK4LmI4LiZIOC4',
  'quC4seC5iOC4h+C4guC4reC4h+C5gOC4guC5ieC4suC4q+C4rSBTaG9wZWUg4Lij4LmJ4Liy4LiZIEFCQycsCiAgICAgICAgaGludDon4LiW4LmJ4Liy4LmD4Liq4LmI4Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4Lii4LiC4LmJ4Liy4LiH4Lil4LmI4Liy4LiH',
  '4LmE4Lin4LmJIOC5geC4peC5ieC4p+C5gOC4p+C5ieC4meC4iuC5iOC4reC4h+C4meC4teC5ieC4p+C5iOC4suC4hyDguKPguLDguJrguJrguIjguLDguJXguLHguYnguIfguIrguLfguYjguK3guYPguKvguYnguYDguK3guIfguIjguLLguIHguKPguLLguKLguIHg',
  'uLLguKPguYHguKPguIEnIH0sCiAgICAgIHsga2V5OididXlEYXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4i+C4t+C5ieC4rScsIHR5cGU6J2RhdGUnLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidjYXRlZ29yeScsIGxhYmVsOifguKvguKHg',
  'uKfguJTguKvguKHguLnguYgnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncHVyY2hhc2VDYXRlZ29yaWVzJykgfSwKCiAgICAgIHsga2V5OidsaW5lcycsICAgbGFiZWw6J+C4o+C4suC4ouC4geC4suC4o+C5g+C4meC4muC4tOC4pSAo4LiL4Li34LmJ4Lit',
  '4LiX4Li14LmA4LiU4Li14Lii4Lin4Lir4Lil4Liy4Lii4Lit4Lii4LmI4Liy4LiH4LmD4Liq4LmI4LiV4Lij4LiH4LiZ4Li14LmJKScsIHR5cGU6J2xpbmVzJywgZnVsbDp0cnVlLAogICAgICAgIGhpbnQ6J+C4quC4seC5iOC4h+C4reC4reC4meC5hOC4peC4meC5',
  'jOC4hOC4o+C4seC5ieC4h+C5gOC4lOC4teC4ouC4p+C5hOC4lOC5ieC4guC4reC4h+C4q+C4peC4suC4ouC4reC4ouC5iOC4suC4hyDguYPguKrguYjguYHguKLguIHguJfguLXguKXguLDguKPguLLguKLguIHguLLguKPguYTguJTguYnguYDguKXguKIgwrcg4Lij',
  '4Liw4Lia4Lia4Lij4Lin4Lih4Lij4Liy4LiE4Liy4LmD4Lir4LmJ4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0JyB9LAogICAgICB7IGtleTonc2hpcHBpbmcnLCBsYWJlbDon4LiE4LmI4Liy4Liq4LmI4LiHICjguJrguLLguJcpJywgdHlwZTonbW9uZXknLCBw',
  'aDonMCcsIG9uaW5wdXQ6J3JlY2FsY0JpbGwoKScgfSwKICAgICAgeyBrZXk6J2Rpc2NvdW50JywgbGFiZWw6J+C4quC5iOC4p+C4meC4peC4lCAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JywgcGg6JzAnLCBvbmlucHV0OidyZWNhbGNCaWxsKCknIH0sCiAgICAg',
  'IHsga2V5OidwcmljZScsICAgbGFiZWw6J+C4o+C4suC4hOC4suC4o+C4p+C4oeC4l+C4seC5ieC4h+C4muC4tOC4pSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JywgcmVxdWlyZWQ6dHJ1ZSwKICAgICAgICBoaW50Oic8c3BhbiBpZD0iYmlsbEhpbnQiPjwvc3Bh',
  'bj4nIH0sCiAgICAgIHsga2V5OidvcmRlck5vJywgbGFiZWw6J+C5gOC4peC4guC4l+C4teC5iOC4hOC4s+C4quC4seC5iOC4h+C4i+C4t+C5ieC4rScsIHBoOifguYDguKXguILguK3guK3guKPguYzguYDguJTguK3guKPguYzguIjguLLguIEgU2hvcGVlIC8gTGF6',
  'YWRhJyB9LAogICAgICB7IGtleTondmVuZG9yJywgIGxhYmVsOifguYHguKvguKXguYjguIfguJfguLXguYjguIvguLfguYnguK0nLCBwaDonU2hvcGVlIC8g4LmE4LiX4Lin4Lix4Liq4LiU4Li4IC8g4Lij4LmJ4Liy4LiZ4oCmJyB9LAogICAgICB7IGtleToncGF5',
  'ZXInLCAgIGxhYmVsOifguJzguLnguYnguIrguLPguKPguLAnIH0sCiAgICAgIHsga2V5Oid3YXJyYW50eU1vbnRocycsIGxhYmVsOifguKPguLDguKLguLDguYDguKfguKXguLLguKPguLHguJrguJvguKPguLDguIHguLHguJkgKOC5gOC4lOC4t+C4reC4mSknLCB0',
  'eXBlOidudW1iZXInLAogICAgICAgIGhpbnQ6J+C4o+C4sOC4muC4muC4iOC4sOC4hOC4s+C4meC4p+C4k+C4p+C4seC4meC4q+C4oeC4lOC4m+C4o+C4sOC4geC4seC4meC5g+C4q+C5ieC4reC4seC4leC5guC4meC4oeC4seC4leC4tCcgfSwKICAgICAgeyBrZXk6',
  'J3Jvb20nLCAgICBsYWJlbDon4Lir4LmJ4Lit4LiHL+C4nuC4t+C5ieC4meC4l+C4teC5iOC4l+C4teC5iOC5g+C4iuC5iScsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6WyfguKrguYjguKfguJnguIHguKXguLLguIcnXS5jb25jYXQocm9vbU9wdGlvbnMoKSkgfSwK',
  'ICAgICAgeyBrZXk6J3Bob3RvcycsICBsYWJlbDon4Lig4Liy4Lie4Lib4Lij4Liw4LiB4Lit4Lia4Liq4Li04LiZ4LiE4LmJ4LiyJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J3NsaXBzJywgICBsYWJlbDon4Liq4Lil4Li04Lib4LiB',
  '4Liy4Lij4LmC4Lit4LiZ4LiK4Liz4Lij4LiwJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQog',
  'IH0pOwp9CgpmdW5jdGlvbiBkZWxQdXJjaGFzZShpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdwdXJjaGFzZS5kZWxldGUnLCB7IGlkOiBp',
  'ZCB9KS50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8q',
  'ID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3guKPguYzguKE6IOC4peC5ieC4suC4h+C5geC4reC4o+C5jAogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybUFjKHJlYyl7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4Lij4Liy4Lii4LiB4Liy4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJyA6ICfg',
  'uJrguLHguJnguJfguLbguIHguIHguLLguKPguKXguYnguLLguIfguYHguK3guKPguYwnLAogICAgcmVjb3JkOiByZWMgfHwgeyBib29rRGF0ZTogdG9kYXkoKSB9LAogICAgYWN0aW9uOiAnYWMuc2F2ZScsIGJ1Y2tldDogJ2FjJywKICAgIG9jcjogeyBkYXRlOidz',
  'ZXJ2aWNlRGF0ZScsIGFtb3VudDonY29zdCcsIHZlbmRvcjondGVjaG5pY2lhbicgfSwKICAgIG9uRGVsZXRlOiBkZWxBYywKICAgIGZpZWxkczogWwogICAgICB7IGtleToncm9vbScsICAgICAgICBsYWJlbDon4Lir4LmJ4Lit4LiHJywgdHlwZTonc2VsZWN0Jywg',
  'b3B0aW9uczpyb29tT3B0aW9ucygpLCByZXF1aXJlZDp0cnVlLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleToncm91bmQnLCAgICAgICBsYWJlbDon4Lij4Lit4Lia4LiX4Li14LmIJywgdHlwZTonbnVtYmVyJywgaGludDon4LmA4Lin4LmJ4LiZ4Lin4LmI4Liy',
  '4LiH4LmD4Lir4LmJ4Lij4Liw4Lia4Lia4LiZ4Lix4Lia4LiV4LmI4Lit4LiI4Liy4LiB4Lij4Lit4Lia4Lil4LmI4Liy4Liq4Li44LiU4LiC4Lit4LiH4Lib4Li14LiZ4Lix4LmJ4LiZJyB9LAogICAgICB7IGtleTonYm9va0RhdGUnLCAgICBsYWJlbDon4Lin4Lix',
  '4LiZ4LiX4Li14LmI4LiZ4Lix4LiU4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJywgdHlwZTonZGF0ZScgfSwKICAgICAgeyBrZXk6J3NlcnZpY2VEYXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4lOC4s+C5gOC4meC4tOC4meC4geC4suC4o+C4iOC4o+C4',
  'tOC4hycsIHR5cGU6J2RhdGUnLCBoaW50OifguIHguKPguK3guIHguYDguKHguLfguYjguK3guKXguYnguLLguIfguYDguKrguKPguYfguIjguYHguKXguYnguKcnIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCAgICAgIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0',
  'eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnYWNTdGF0dXNlcycpIH0sCiAgICAgIHsga2V5Oid0ZWNobmljaWFuJywgIGxhYmVsOifguIrguYjguLLguIcgLyDguJzguLnguYnguYPguKvguYnguJrguKPguLTguIHguLLguKMnIH0sCiAgICAgIHsga2V5Oidjb3N0',
  'JywgICAgICAgIGxhYmVsOifguITguYjguLLguYPguIrguYnguIjguYjguLLguKIgKOC4muC4suC4lyknLCB0eXBlOidtb25leScgfSwKICAgICAgeyBrZXk6J3Bob3RvcycsICAgICAgbGFiZWw6J+C4oOC4suC4nuC4m+C4o+C4sOC4geC4reC4micsIHR5cGU6J2Zp',
  'bGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICAgICAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbEFjKGlkKXsKICBjb25m',
  'aXJtQWN0aW9uKCfguKXguJrguKPguLLguKLguIHguLLguKPguKXguYnguLLguIfguYHguK3guKPguYzguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2FjLmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4',
  'muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyoqIOC4meC4seC4lOC4peC5ieC4suC4h+C5geC4reC4o+C5',
  'jOC4q+C4peC4suC4ouC4q+C5ieC4reC4h+C4nuC4o+C5ieC4reC4oeC4geC4seC4mSAqLwpmdW5jdGlvbiBmb3JtQnVsa0FjKCl7CiAgdmFyIHJvb21zID0gcm9vbU9wdGlvbnMoKTsKICB2YXIgYm9keSA9CiAgICAnPGRpdiBjbGFzcz0iZmdyaWQiPicgKwogICAg',
  'ICAnPGRpdiBjbGFzcz0iZiI+PGxhYmVsPuC4p+C4seC4meC4l+C4teC5iOC4meC4seC4lCA8c3BhbiBzdHlsZT0iY29sb3I6dmFyKC0tZGFuZ2VyKSI+Kjwvc3Bhbj48L2xhYmVsPicgKwogICAgICAgICc8aW5wdXQgdHlwZT0iZGF0ZSIgY2xhc3M9ImlucCIgaWQ9',
  'ImJrX2RhdGUiIHZhbHVlPSInICsgdG9kYXkoKSArICciPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiI+PGxhYmVsPuC4iuC5iOC4suC4hyAvIOC4nOC4ueC5ieC5g+C4q+C5ieC4muC4o+C4tOC4geC4suC4ozwvbGFiZWw+PGlucHV0IGNsYXNzPSJpbnAi',
  'IGlkPSJia190ZWNoIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7guITguYjguLLguYPguIrguYnguIjguYjguLLguKLguJXguYjguK3guKvguYnguK3guIcgKOC4muC4suC4lyk8L2xhYmVsPjxpbnB1dCB0eXBlPSJudW1iZXIiIGNsYXNz',
  'PSJpbnAiIGlkPSJia19jb3N0Ij48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7guKvguKHguLLguKLguYDguKvguJXguLg8L2xhYmVsPjxpbnB1dCBjbGFzcz0iaW5wIiBpZD0iYmtfbm90ZSI+PC9kaXY+JyArCiAgICAnPC9kaXY+JyArCiAg',
  'ICAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InJvdyBtYjgiPjxiIGNsYXNzPSJmczEzIj7guYDguKXguLfguK3guIHguKvguYnguK3guIc8L2I+PHNwYW4gY2xhc3M9InNwIj48L3NwYW4+JyArCiAgICAgICc8YnV0dG9uIGNsYXNz',
  'PSJidG4gc20iIG9uY2xpY2s9ImJ1bGtQaWNrKFwnYWxsXCcpIj7guJfguLHguYnguIfguKvguKHguJQ8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iYnVsa1BpY2soXCdub25lXCcpIj7guKXguYnguLLguIc8L2J1dHRv',
  'bj4nICsKICAgICAgWzEsMiwzLDQsNV0ubWFwKGZ1bmN0aW9uKGYpeyByZXR1cm4gJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iYnVsa1BpY2soJyArIGYgKyAnKSI+4LiK4Lix4LmJ4LiZICcgKyBmICsgJzwvYnV0dG9uPic7IH0pLmpvaW4oJycpICsK',
  'ICAgICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJyb29tcyIgaWQ9ImJrUm9vbXMiPicgKyByb29tcy5tYXAoZnVuY3Rpb24ocil7CiAgICAgIHJldHVybiAnPGxhYmVsIGNsYXNzPSJyb29tIiBzdHlsZT0iY3Vyc29yOnBvaW50ZXIiPjxpbnB1dCB0eXBlPSJj',
  'aGVja2JveCIgY2xhc3M9ImJrIiB2YWx1ZT0iJyArIHIgKyAnIj4gPGI+JyArIHIgKyAnPC9iPjwvbGFiZWw+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7CgogIG9wZW5Nb2RhbCgn8J+ThSDguJnguLHguJTguKXguYnguLLguIfguYHguK3guKPguYzguKvg',
  'uKXguLLguKLguKvguYnguK3guIfguJ7guKPguYnguK3guKHguIHguLHguJknLCBib2R5LAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNz',
  'PSJidG4gcHJpIiBpZD0iYmtTYXZlIj7guKrguKPguYnguLLguIfguJnguLHguJTguKvguKHguLLguKI8L2J1dHRvbj4nLCB0cnVlKTsKCiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JrU2F2ZScpLm9uY2xpY2sgPSBmdW5jdGlvbigpewogICAgdmFyIHBpY2tl',
  'ZCA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5iazpjaGVja2VkJykpLm1hcChmdW5jdGlvbihjKXsgcmV0dXJuIGMudmFsdWU7IH0pOwogICAgdmFyIGRhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgn',
  'YmtfZGF0ZScpLnZhbHVlOwogICAgaWYgKCFwaWNrZWQubGVuZ3RoKSByZXR1cm4gdG9hc3QoJ+C5gOC4peC4t+C4reC4geC4reC4ouC5iOC4suC4h+C4meC5ieC4reC4oiAxIOC4q+C5ieC4reC4hycsICdlcnInKTsKICAgIGlmICghZGF0ZSkgcmV0dXJuIHRvYXN0',
  'KCfguIHguKPguLjguJPguLLguKPguLDguJrguLjguKfguLHguJnguJfguLXguYjguJnguLHguJQnLCAnZXJyJyk7CiAgICB2YXIgYnRuID0gdGhpczsgYnRuLmRpc2FibGVkID0gdHJ1ZTsgYnRuLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFu',
  'PiDguIHguLPguKXguLHguIfguJrguLHguJnguJfguLbguIHigKYnOwogICAgY2FsbEFwaSgnYWMuYnVsa0Jvb2snLCB7CiAgICAgIHJvb21zOiBwaWNrZWQsIGJvb2tEYXRlOiBkYXRlLAogICAgICB0ZWNobmljaWFuOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgn',
  'YmtfdGVjaCcpLnZhbHVlLAogICAgICBjb3N0OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmtfY29zdCcpLnZhbHVlLAogICAgICBub3RlOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmtfbm90ZScpLnZhbHVlCiAgICB9KS50aGVuKGZ1bmN0aW9uKG4pewog',
  'ICAgICBjbG9zZU1vZGFsKCk7IHRvYXN0KCfguKrguKPguYnguLLguIfguJnguLHguJTguKvguKHguLLguKIgJyArIG4gKyAnIOC4q+C5ieC4reC4h+C5geC4peC5ieC4pycsICdvaycpOyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAgICB9KS5jYXRjaChmdW5jdGlv',
  'bihlKXsKICAgICAgYnRuLmRpc2FibGVkID0gZmFsc2U7IGJ0bi50ZXh0Q29udGVudCA9ICfguKrguKPguYnguLLguIfguJnguLHguJTguKvguKHguLLguKInOyB0b2FzdChlLm1lc3NhZ2V8fGUsICdlcnInKTsKICAgIH0pOwogIH07Cn0KCmZ1bmN0aW9uIGJ1bGtQ',
  'aWNrKHdoYXQpewogIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5iaycpLmZvckVhY2goZnVuY3Rpb24oYyl7CiAgICBpZiAod2hhdCA9PT0gJ2FsbCcpIGMuY2hlY2tlZCA9IHRydWU7CiAgICBlbHNlIGlmICh3aGF0ID09PSAnbm9uZScpIGMuY2hlY2tlZCA9',
  'IGZhbHNlOwogICAgZWxzZSBjLmNoZWNrZWQgPSBTdHJpbmcoYy52YWx1ZSkuY2hhckF0KDApID09PSBTdHJpbmcod2hhdCk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDg',
  'uJ/guK3guKPguYzguKE6IOC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4suC4oeC4q+C5ieC4reC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybVJlcGFpcihyZWMp',
  'ewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4h+C4suC4meC4i+C5iOC4reC4oScgOiAn4LmB4LiI4LmJ4LiH4LiL4LmI4Lit4LihIC8g4Lia4Lix4LiZ4LiX4Li24LiB4LiH4Liy4LiZ4LiL4LmI4Lit4Lih',
  'JywKICAgIHJlY29yZDogcmVjIHx8IHsgcmVwb3J0RGF0ZTogdG9kYXkoKSwgcHJpb3JpdHk6ICfguJvguIHguJXguLQnIH0sCiAgICBhY3Rpb246ICdyZXBhaXIuc2F2ZScsIGJ1Y2tldDogJ3Jvb21SZXBhaXInLCB3aWRlOiB0cnVlLAogICAgb2NyOiB7IGRhdGU6',
  'J3JlcGFpckRhdGUnLCBhbW91bnQ6J2Nvc3QnLCB2ZW5kb3I6J3RlY2huaWNpYW4nLCB0aXRsZTonaXRlbXMnIH0sCiAgICBvbkRlbGV0ZTogZGVsUmVwYWlyLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oidyb29tJywgICAgICAgbGFiZWw6J+C4q+C5ieC4reC4',
  'hycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6cm9vbU9wdGlvbnMoKSwgcmVxdWlyZWQ6dHJ1ZSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J2NhdGVnb3J5JywgICBsYWJlbDon4Lib4Lij4Liw4LmA4Lig4LiX4LiH4Liy4LiZ4Lir4Lil4Lix4LiB4LiC4Lit',
  '4LiH4LmD4Lia4LiZ4Li14LmJJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ3JlcGFpckNhdGVnb3JpZXMnKSwKICAgICAgICBoaW50OifguYDguKfguYnguJnguKfguYjguLLguIfguYTguJTguYkg4oCUIOC4o+C4sOC4muC4muC5g+C4iuC5ieC4m+C4o+C4',
  'sOC5gOC4oOC4l+C4l+C4teC5iOC4nuC4muC4muC5iOC4reC4ouC4l+C4teC5iOC4quC4uOC4lOC5g+C4meC5gOC4iuC5h+C4hOC4peC4tOC4quC4leC5jOC5g+C4q+C5ieC5gOC4reC4hycgfSwKICAgICAgeyBrZXk6J2l0ZW1zJywgICAgICBsYWJlbDon4Lij4Liy',
  '4Lii4LiB4Liy4Lij4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LiL4LmI4Lit4LihICjguJXguLTguYrguIHguYDguKHguLfguYjguK3guJfguLPguYDguKrguKPguYfguIgpJywgdHlwZTondG9kbycsIHJlcXVpcmVkOnRydWUsIGZ1bGw6dHJ1ZSwKICAgICAgICBvcHRp',
  'b25zOiBvcHQoJ3JlcGFpckNhdGVnb3JpZXMnKSwKICAgICAgICBoaW50OifguYDguILguYnguLLguIvguYjguK3guKHguITguKPguLHguYnguIfguYDguJTguLXguKLguKfguKHguLHguIHguIvguYjguK3guKHguKvguKXguLLguKLguIjguLjguJQg4LmD4Liq4LmI',
  '4LmB4Lii4LiB4LiX4Li14Lil4Liw4LiH4Liy4LiZ4LmB4Lil4Liw4LmA4Lil4Li34Lit4LiB4Lib4Lij4Liw4LmA4Lig4LiX4LiC4Lit4LiH4LmB4LiV4LmI4Lil4Liw4LiH4Liy4LiZ4LmE4LiU4LmJIMK3ICcgKwogICAgICAgICAgICAgJ+C4leC4tOC5iuC4geC4',
  'hOC4o+C4muC4l+C4uOC4geC4h+C4suC4meC5geC4peC5ieC4p+C4o+C4sOC4muC4muC4iOC4sOC5gOC4m+C4peC4teC5iOC4ouC4meC4quC4luC4suC4meC4sOC5gOC4m+C5h+C4mSDigJzguYDguKrguKPguYfguIjguKrguLTguYnguJnigJ0g4LmD4Lir4LmJ4LmA',
  '4Lit4LiHJyB9LAogICAgICB7IGtleToncmVwb3J0RGF0ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguYHguIjguYnguIcnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonYm9va0RhdGUnLCAgIGxhYmVsOifguKfguLHguJnguJnguLHguJTguIvguYjg',
  'uK3guKHguYHguIvguKEnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleToncmVwYWlyRGF0ZScsIGxhYmVsOifguKfguLHguJnguYDguILguYnguLLguIvguYjguK3guKHguYHguIvguKEnLCB0eXBlOidkYXRlJywgaGludDon4LiB4Lij4Lit4LiB4LmA4Lih4Li3',
  '4LmI4Lit4LiL4LmI4Lit4Lih4LmA4Liq4Lij4LmH4LiI4LmB4Lil4LmJ4LinJyB9LAogICAgICB7IGtleTonc3RhdHVzJywgICAgIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncmVwYWlyU3RhdHVzZXMnKSB9LAog',
  'ICAgICB7IGtleToncHJpb3JpdHknLCAgIGxhYmVsOifguITguKfguLLguKHguYDguKPguYjguIfguJTguYjguKfguJknLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncHJpb3JpdGllcycpLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleTondGVjaG5pY2lh',
  'bicsIGxhYmVsOifguIrguYjguLLguIfguJzguLnguYnguIvguYjguK3guKEnIH0sCiAgICAgIHsga2V5Oidjb3N0JywgICAgICAgbGFiZWw6J+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oiAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JyB9LAogICAgICB7',
  'IGtleToncGhvdG9zQmVmb3JlJywgbGFiZWw6J+C4oOC4suC4nuC4geC5iOC4reC4meC4i+C5iOC4reC4oScsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5OidwaG90b3NBZnRlcicsICBsYWJlbDon4Lig4Liy4Lie4Lir4Lil4Lix4LiH4LiL',
  '4LmI4Lit4LihJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlv',
  'biBkZWxSZXBhaXIoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4h+C4suC4meC4i+C5iOC4reC4oeC4meC4teC5iT8nLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgncmVwYWlyLmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3Qo',
  'J+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmC4LiU4Lii4Lij4Lin4LihCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtQnVpbGRpbmcocmVjKXsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguIfguLLguJnguIvguYjguK3guKHguJXguLbguIEnIDogJ+C5gOC4nuC4tOC5',
  'iOC4oeC4h+C4suC4meC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oScsCiAgICByZWNvcmQ6IHJlYyB8fCB7IGJvb2tEYXRlOiB0b2RheSgpIH0sCiAgICBhY3Rpb246ICdidWlsZGluZy5zYXZlJywgYnVja2V0OiAnYnVpbGRp',
  'bmcnLCB3aWRlOiB0cnVlLAogICAgb2NyOiB7IGRhdGU6J2VuZERhdGUnLCBhbW91bnQ6J2Nvc3QnLCB2ZW5kb3I6J2NvbnRyYWN0b3InLCB0aXRsZTondGl0bGUnIH0sCiAgICBvbkRlbGV0ZTogZGVsQnVpbGRpbmcsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6',
  'J3pvbmUnLCAgICAgIGxhYmVsOifguKrguYjguKfguJnguILguK3guIfguK3guLLguITguLLguKMnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnYnVpbGRpbmdab25lcycpLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5Oid0aXRsZScsICAgICBsYWJl',
  'bDon4Lij4Liy4Lii4LiB4Liy4Lij4LiL4LmI4Lit4Lih4LmB4LiL4LihJywgdHlwZTondGV4dGFyZWEnLCByZXF1aXJlZDp0cnVlLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J2Jvb2tEYXRlJywgIGxhYmVsOifguKfguLHguJnguJfguLXguYjguJnguLHguJQn',
  'LCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonc3RhcnREYXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC5gOC4o+C4tOC5iOC4oeC4lOC4s+C5gOC4meC4tOC4meC4geC4suC4oycsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidlbmREYXRlJywg',
  'ICBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LmB4Lil4LmJ4Lin4LmA4Liq4Lij4LmH4LiIJywgdHlwZTonZGF0ZScgfSwKICAgICAgeyBrZXk6J3N0YXR1cycsICAgIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgn',
  'YnVpbGRpbmdTdGF0dXNlcycpIH0sCiAgICAgIHsga2V5Oidjb250cmFjdG9yJywgbGFiZWw6J+C4nOC4ueC5ieC4o+C4seC4muC5gOC4q+C4oeC4siAvIOC4o+C5ieC4suC4mScgfSwKICAgICAgeyBrZXk6J2Nvc3QnLCAgICAgIGxhYmVsOifguITguYjguLLguYPg',
  'uIrguYnguIjguYjguLLguKIgKOC4muC4suC4lyknLCB0eXBlOidtb25leScgfSwKICAgICAgeyBrZXk6J25leHREdWUnLCAgIGxhYmVsOifguITguKPguJrguIHguLPguKvguJnguJTguKPguK3guJrguJbguLHguJTguYTguJsnLCB0eXBlOidkYXRlJywgaGludDon',
  '4LmA4LiK4LmI4LiZIOC4geC4seC4meC4i+C4tuC4oeC4lOC4suC4lOC4n+C5ieC4suC4l+C4uOC4gSAzIOC4m+C4tSDigJQg4LmD4Liq4LmI4Lin4Lix4LiZ4LiX4Li14LmI4LiE4Lij4Lix4LmJ4LiH4LiW4Lix4LiU4LmE4LibJyB9LAogICAgICB7IGtleToncGhv',
  'dG9zJywgICAgbGFiZWw6J+C4oOC4suC4nuC4m+C4o+C4sOC4geC4reC4micsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5OidzbGlwcycsICAgICBsYWJlbDon4LmD4Lia4LmA4Liq4Lij4LmH4LiIIC8g4Liq4Lil4Li04LibJywgdHlwZTon',
  'ZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbEJ1aWxkaW5nKGlkKXsK',
  'ICBjb25maXJtQWN0aW9uKCfguKXguJrguIfguLLguJnguIvguYjguK3guKHguJXguLbguIHguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2J1aWxkaW5nLmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4',
  'muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4LiC4LmJ4Lit4Lih4Li54Lil4Lir4LmJ4Lit4LiHCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5j',
  'dGlvbiBmb3JtUm9vbShyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiAn4LiC4LmJ4Lit4Lih4Li54Lil4Lir4LmJ4Lit4LiHICcgKyAocmVjID8gcmVjLnJvb20gOiAnJyksCiAgICByZWNvcmQ6IHJlYywgYWN0aW9uOiAncm9vbS5zYXZlJywKICAgIGZpZWxk',
  'czogWwogICAgICB7IGtleToncm9vbScsICAgbGFiZWw6J+C4q+C5ieC4reC4hycsIHJlcXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J2Zsb29yJywgIGxhYmVsOifguIrguLHguYnguJknLCB0eXBlOidudW1iZXInIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCBs',
  'YWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ3Jvb21TdGF0dXNlcycpLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleTondGVuYW50JywgbGFiZWw6J+C4iuC4t+C5iOC4reC4nOC4ueC5ieC5gOC4iuC5iOC4sicgfSwK',
  'ICAgICAgeyBrZXk6J3Bob25lJywgIGxhYmVsOifguYDguJrguK3guKPguYzguJXguLTguJTguJXguYjguK0nIH0sCiAgICAgIHsga2V5OidyZW50JywgICBsYWJlbDon4LiE4LmI4Liy4LmA4LiK4LmI4LiyL+C5gOC4lOC4t+C4reC4mSAo4Lia4Liy4LiXKScsIHR5',
  'cGU6J21vbmV5JyB9LAogICAgICB7IGtleTonbW92ZUluJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC5gOC4guC5ieC4suC4reC4ouC4ueC5iCcsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5Oidub3RlJywgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir',
  '4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguJfguKPguLHguJ7g',
  'uKLguYzguKrguLTguJnguJvguKPguLDguIjguLPguKvguYnguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1Bc3NldChyZWMpewogIHZhciByb29tID0gKHJl',
  'YyAmJiByZWMucm9vbSkgfHwgJyc7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZJyA6ICfguYDguJ7guLTguYjguKHguJfguKPguLHguJ7guKLguYzguKrguLTg',
  'uJnguYPguJnguKvguYnguK3guIcgJyArIHJvb20sCiAgICByZWNvcmQ6IHJlYyB8fCB7IHJvb206IHJvb20sIHN0YXR1czogJ+C5g+C4iuC5ieC4h+C4suC4meC4m+C4geC4leC4tCcgfSwKICAgIGFjdGlvbjogJ2Fzc2V0LnNhdmUnLAogICAgb25EZWxldGU6IHJl',
  'YyAmJiByZWMuaWQgPyBkZWxBc3NldCA6IG51bGwsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3Jvb20nLCAgIGxhYmVsOifguKvguYnguK3guIcnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOnJvb21PcHRpb25zKCksIHJlcXVpcmVkOnRydWUsIGJsYW5rOmZh',
  'bHNlIH0sCiAgICAgIHsga2V5OiduYW1lJywgICBsYWJlbDon4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZJywgcmVxdWlyZWQ6dHJ1ZSwgcGg6J+C5gOC4iuC5iOC4mSDguYHguK3guKPguYwgwrcg4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiX4Liz4LiZ4LmJ4Liz',
  '4Lit4Li44LmI4LiZIMK3IOC4leC4ueC5ieC5gOC4ouC5h+C4mScgfSwKICAgICAgeyBrZXk6J2JyYW5kJywgIGxhYmVsOifguKLguLXguYjguKvguYnguK0v4Lij4Li44LmI4LiZJyB9LAogICAgICB7IGtleTonc2VyaWFsJywgbGFiZWw6J1NlcmlhbCBOby4nIH0s',
  'CiAgICAgIHsga2V5OidpbnN0YWxsRGF0ZScsICBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiV4Li04LiU4LiV4Lix4LmJ4LiHJywgdHlwZTonZGF0ZScgfSwKICAgICAgeyBrZXk6J3dhcnJhbnR5RW5kJywgIGxhYmVsOifguJvguKPguLDguIHguLHguJnguKvg',
  'uKHguJTguK3guLLguKLguLgnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonc3RhdHVzJywgbGFiZWw6J+C4quC4luC4suC4meC4sCcsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdhc3NldFN0YXR1c2VzJyksIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsg',
  'a2V5OidwdXJjaGFzZUlkJywgbGFiZWw6J+C4reC5ieC4suC4h+C4reC4tOC4h+C4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4rScsIHBoOifguKPguKvguLHguKrguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcgKOC4luC5ieC4suC4oeC4',
  'tSknIH0sCiAgICAgIHsga2V5Oidub3RlJywgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXSwKICAgIC8vIOC4n+C4reC4o+C5jOC4oeC4meC4teC5ieC5gOC4m+C4tOC4lOC4iOC4suC4',
  'geC4q+C4meC5ieC4suC4leC5iOC4suC4h+C4o+C4suC4ouC4peC4sOC5gOC4reC4teC4ouC4lOC4q+C5ieC4reC4hyDigJQg4Lia4Lix4LiZ4LiX4Li24LiB4LmA4Liq4Lij4LmH4LiI4LmA4Lib4Li04LiU4LiB4Lil4Lix4Lia4LmE4Lib4Lir4LiZ4LmJ4Liy4LmA',
  '4LiU4Li04LihCiAgICBhZnRlcjogZnVuY3Rpb24oKXsgaWYgKHJvb20gJiYgdHlwZW9mIG9wZW5Sb29tID09PSAnZnVuY3Rpb24nKSBvcGVuUm9vbShyb29tKTsgfQogIH0pOwp9CgpmdW5jdGlvbiBkZWxBc3NldChpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia',
  '4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZ4LiK4Li04LmJ4LiZ4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdhc3NldC5kZWxldGUnLCB7IGlkOiBpZCB9KQogICAgICAudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ',
  '4LinJywnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguKPguLLguKLguKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4Lii4Lir4LitCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAq',
  'LwpmdW5jdGlvbiBmb3JtRmluYW5jZShyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4o+C4suC4ouC4geC4suC4oycgOiAn4Lia4Lix4LiZ4LiX4Li24LiB4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4',
  'suC4ouC4iOC5iOC4suC4oicsCiAgICByZWNvcmQ6IHJlYyB8fCB7IGRhdGU6IHRvZGF5KCksIGNoYW5uZWw6ICfguYLguK3guJkgUVInIH0sCiAgICBhY3Rpb246ICdmaW5hbmNlLnNhdmUnLCBidWNrZXQ6ICdtaXNjJywKICAgIG9uRGVsZXRlOiBkZWxGaW5hbmNl',
  'LAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5OidraW5kJywgICBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4LijJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ2ZpbmFuY2VLaW5kcycpLCByZXF1aXJlZDp0cnVlLCBibGFuazpmYWxzZSwKICAgICAgICBoaW50',
  'OifguYDguKXguLfguK3guIEgIuC4o+C4suC4ouC4o+C4seC4muC4hOC5iOC4suC5gOC4iuC5iOC4siIg4Lir4Lij4Li34LitICLguKPguLLguKLguKPguLHguJrguK3guLfguYjguJkg4LmGIiDguKPguLDguJrguJrguIjguLDguJnguLHguJrguYDguJvguYfguJng',
  'uJ3guLHguYjguIfguKPguLLguKLguKPguLHguJrguYPguKvguYnguK3guLHguJXguYLguJnguKHguLHguJXguLQnIH0sCiAgICAgIHsga2V5OidkYXRlJywgICBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmIJywgdHlwZTonZGF0ZScsIHJlcXVpcmVkOnRydWUgfSwK',
  'ICAgICAgeyBrZXk6J2Ftb3VudCcsIGxhYmVsOifguIjguLPguJnguKfguJnguYDguIfguLTguJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHJlcXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J2JpbGxNb250aCcsIGxhYmVsOifguKPguK3guJrguJrguLTg',
  'uKXguILguK3guIfguYDguJTguLfguK3guJknLCBwaDon4LmA4LiK4LmI4LiZIOC4gS7guIQuIDI1NjknIH0sCiAgICAgIHsga2V5OidjaGFubmVsJywgbGFiZWw6J+C4iuC5iOC4reC4h+C4l+C4suC4hycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdmaW5h',
  'bmNlQ2hhbm5lbHMnKSB9LAogICAgICB7IGtleTonc2xpcHMnLCAgbGFiZWw6J+C4quC4peC4tOC4myAvIOC5g+C4muC5gOC4quC4o+C5h+C4iCcsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICBsYWJlbDon4Lir4Lih4Liy',
  '4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxGaW5hbmNlKGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguKPguLLguKLguIHguLLguKPguJnguLXguYk/JywgZnVuY3Rpb24o',
  'KXsKICAgIGNhbGxBcGkoJ2ZpbmFuY2UuZGVsZXRlJywgeyBpZDogaWQgfSkudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRv',
  'YXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Liq4Liz4Lij4Lit4LiHIC8g4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit',
  '4Lih4Li54LilCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBkb0V4cG9ydEpzb24oKXsKICB0b2FzdCgn4LiB4Liz4Lil4Lix4LiH4LmA4LiV4Lij4Li14Lii4Lih4LmE4Lif',
  '4Lil4LmM4Liq4Liz4Lij4Lit4LiH4oCmJyk7CiAgY2FsbEFwaSgnYmFja3VwLmV4cG9ydCcsIHt9KS50aGVuKGZ1bmN0aW9uKGR1bXApewogICAgc2F2ZVRleHRGaWxlKCd0aGUtbS1jb3JuZXItYXAtYmFja3VwLScgKyB0b2RheSgpICsgJy5qc29uJywKICAgICAg',
  'ICAgICAgICAgICBKU09OLnN0cmluZ2lmeShkdW1wLCBudWxsLCAxKSwgJ2FwcGxpY2F0aW9uL2pzb24nKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7IH0pOwp9CgpmdW5jdGlvbiBkb0V4cG9ydENzdihzaGVldCl7',
  'CiAgY2FsbEFwaSgnYmFja3VwLmNzdicsIHsgc2hlZXQ6IHNoZWV0IH0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICBzYXZlVGV4dEZpbGUoci5maWxlbmFtZSwgci5jb250ZW50LCAndGV4dC9jc3YnKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNz',
  'YWdlfHxlLCAnZXJyJyk7IH0pOwp9CgovKiog4LiU4Liy4Lin4LiZ4LmM4LmC4Lir4Lil4LiU4LmE4Lif4Lil4LmMIOKAlCDguYPguIrguYkgZG93bmxvYWRzIGNhcGFiaWxpdHkg4LiW4LmJ4Liy4Lih4Li1IOC5hOC4oeC5iOC4h+C4seC5ieC4meC5g+C4iuC5ieC4',
  'peC4tOC4h+C4geC5jOC4m+C4geC4leC4tCAqLwpmdW5jdGlvbiBzYXZlVGV4dEZpbGUoZmlsZW5hbWUsIGNvbnRlbnQsIG1pbWUpewogIGlmICh0eXBlb2Ygd2luZG93LnNhdmVWaWFIb3N0ID09PSAnZnVuY3Rpb24nKSByZXR1cm4gd2luZG93LnNhdmVWaWFIb3N0',
  'KGZpbGVuYW1lLCBjb250ZW50LCBtaW1lKTsKICB2YXIgYmxvYiA9IG5ldyBCbG9iKFtjb250ZW50XSwgeyB0eXBlOiBtaW1lICsgJztjaGFyc2V0PXV0Zi04JyB9KTsKICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTsKICBhLmhyZWYgPSBVUkwu',
  'Y3JlYXRlT2JqZWN0VVJMKGJsb2IpOwogIGEuZG93bmxvYWQgPSBmaWxlbmFtZTsKICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGEpOyBhLmNsaWNrKCk7CiAgc2V0VGltZW91dChmdW5jdGlvbigpeyBVUkwucmV2b2tlT2JqZWN0VVJMKGEuaHJlZik7IGEucmVt',
  'b3ZlKCk7IH0sIDEwMDApOwogIHRvYXN0KCfguJTguLLguKfguJnguYzguYLguKvguKXguJQgJyArIGZpbGVuYW1lICsgJyDguYHguKXguYnguKcnLCAnb2snKTsKfQoKZnVuY3Rpb24gZG9JbXBvcnRKc29uKCl7CiAgb3Blbk1vZGFsKCfirIbvuI8g4LiB4Li54LmJ',
  '4LiE4Li34LiZ4LiI4Liy4LiB4LmE4Lif4Lil4LmM4Liq4Liz4Lij4Lit4LiHJywKICAgICc8cCBjbGFzcz0iZnMxMyI+4LmA4Lil4Li34Lit4LiB4LmE4Lif4Lil4LmMIDxiPi5qc29uPC9iPiDguJfguLXguYjguYDguITguKLguJTguLLguKfguJnguYzguYLguKvg',
  'uKXguJTguYTguKfguYk8L3A+JyArCiAgICAnPGxhYmVsIGNsYXNzPSJmaWxlLWRyb3AiIGZvcj0iaW1wRmlsZSI+8J+ThCDguYDguKXguLfguK3guIHguYTguJ/guKXguYzguKrguLPguKPguK3guIcnICsKICAgICAgJzxpbnB1dCB0eXBlPSJmaWxlIiBpZD0iaW1w',
  'RmlsZSIgYWNjZXB0PSJhcHBsaWNhdGlvbi9qc29uLC5qc29uIiBzdHlsZT0iZGlzcGxheTpub25lIiAnICsKICAgICAgJ29uY2hhbmdlPSJkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcJ2ltcE5hbWVcJykudGV4dENvbnRlbnQ9dGhpcy5maWxlc1swXT90aGlzLmZp',
  'bGVzWzBdLm5hbWU6XCdcJyI+PC9sYWJlbD4nICsKICAgICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIG10OCIgaWQ9ImltcE5hbWUiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImhyIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJmIj48bGFiZWw+4Lin4Li0',
  '4LiY4Li14LiB4Li54LmJ4LiE4Li34LiZPC9sYWJlbD4nICsKICAgICc8c2VsZWN0IGNsYXNzPSJzZWwiIGlkPSJpbXBNb2RlIj4nICsKICAgICAgJzxvcHRpb24gdmFsdWU9Im1lcmdlIj7guYDguJ7guLTguYjguKHguYDguInguJ7guLLguLDguKPguLLguKLguIHg',
  'uLLguKPguJfguLXguYjguKLguLHguIfguYTguKHguYjguKHguLUgKOC5geC4meC4sOC4meC4syk8L29wdGlvbj4nICsKICAgICAgJzxvcHRpb24gdmFsdWU9InJlcGxhY2UiPuC4peC5ieC4suC4h+C4guC5ieC4reC4oeC4ueC4peC5gOC4lOC4tOC4oeC5geC4peC5',
  'ieC4p+C5geC4l+C4meC4l+C4teC5iOC4l+C4seC5ieC4h+C4q+C4oeC4lDwvb3B0aW9uPicgKwogICAgJzwvc2VsZWN0PjwvZGl2PicsCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4gTwvYnV0',
  'dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIGlkPSJpbXBHbyI+4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54LilPC9idXR0b24+Jyk7CgogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbXBHbycpLm9uY2xpY2sgPSBmdW5jdGlv',
  'bigpewogICAgdmFyIGYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW1wRmlsZScpLmZpbGVzWzBdOwogICAgaWYgKCFmKSByZXR1cm4gdG9hc3QoJ+C4geC4o+C4uOC4k+C4suC5gOC4peC4t+C4reC4geC5hOC4n+C4peC5jOC4geC5iOC4reC4mScsICdlcnIn',
  'KTsKICAgIHZhciBtb2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ltcE1vZGUnKS52YWx1ZTsKICAgIHZhciBidG4gPSB0aGlzOyBidG4uZGlzYWJsZWQgPSB0cnVlOyBidG4uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4',
  's+C4peC4seC4h+C4geC4ueC5ieC4hOC4t+C4meKApic7CiAgICB2YXIgciA9IG5ldyBGaWxlUmVhZGVyKCk7CiAgICByLm9ubG9hZCA9IGZ1bmN0aW9uKCl7CiAgICAgIHZhciBwYXJzZWQ7CiAgICAgIHRyeSB7IHBhcnNlZCA9IEpTT04ucGFyc2Uoci5yZXN1bHQp',
  'OyB9CiAgICAgIGNhdGNoIChlKSB7IGJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBidG4udGV4dENvbnRlbnQgPSAn4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54LilJzsgcmV0dXJuIHRvYXN0KCfguYTguJ/guKXguYzguYTguKHguYjguYPguIrguYggSlNP',
  'TiDguJfguLXguYjguJbguLnguIHguJXguYnguK3guIcnLCAnZXJyJyk7IH0KICAgICAgY2FsbEFwaSgnYmFja3VwLmltcG9ydCcsIHsgZGF0YTogcGFyc2VkLCBtb2RlOiBtb2RlIH0pLnRoZW4oZnVuY3Rpb24oc3RhdCl7CiAgICAgICAgY2xvc2VNb2RhbCgpOwog',
  'ICAgICAgIHZhciBuID0gT2JqZWN0LmtleXMoc3RhdCkucmVkdWNlKGZ1bmN0aW9uKGEsayl7IHJldHVybiBhICsgKHN0YXRba118fDApOyB9LCAwKTsKICAgICAgICB0b2FzdCgn4LiB4Li54LmJ4LiE4Li34LiZ4Liq4Liz4LmA4Lij4LmH4LiIICcgKyBuICsgJyDg',
  'uKPguLLguKLguIHguLLguKMnLCAnb2snKTsKICAgICAgICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBidG4udGV4dENvbnRlbnQgPSAn4LiB4Li54LmJ4LiE4Li3',
  '4LiZ4LiC4LmJ4Lit4Lih4Li54LilJzsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7CiAgICAgIH0pOwogICAgfTsKICAgIHIucmVhZEFzVGV4dChmKTsKICB9Owp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT0KICAg4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmMIOC5geC4peC4sOC4geC4suC4o+C4quC4s+C4o+C4reC4h+C4peC4hyBHb29nbGUgRHJpdmUKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09ICovCgpmdW5jdGlvbiBjb3B5U2hhcmUoKXsKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2hhcmVVcmwnKTsKICBpZiAoIWVsKSByZXR1cm47CiAgZWwuc2VsZWN0KCk7CiAgaWYgKG5hdmlnYXRvci5jbGlwYm9hcmQpIHsKICAg',
  'IG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KGVsLnZhbHVlKQogICAgICAudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4LiE4Lix4LiU4Lil4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LmB4Lil4LmJ4LinJywnb2snKTsgfSkKICAgICAgLmNh',
  'dGNoKGZ1bmN0aW9uKCl7IHRvYXN0KCfguITguLHguJTguKXguK3guIHguYTguKHguYjguKrguLPguYDguKPguYfguIgg4oCUIOC4geC4lOC4hOC5ieC4suC4h+C4l+C4teC5iOC4iuC5iOC4reC4h+C5geC4peC5ieC4p+C5gOC4peC4t+C4reC4geC4hOC4seC4lOC4',
  'peC4reC4gScsJ2VycicpOyB9KTsKICB9IGVsc2UgewogICAgdHJ5IHsgZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2NvcHknKTsgdG9hc3QoJ+C4hOC4seC4lOC4peC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC5geC4peC5ieC4pycsJ29rJyk7IH0KICAg',
  'IGNhdGNoIChlKSB7IHRvYXN0KCfguITguLHguJTguKXguK3guIHguYTguKHguYjguKrguLPguYDguKPguYfguIgg4oCUIOC4geC4lOC4hOC5ieC4suC4h+C4l+C4teC5iOC4iuC5iOC4reC4h+C5geC4peC5ieC4p+C5gOC4peC4t+C4reC4geC4hOC4seC4lOC4peC4',
  'reC4gScsJ2VycicpOyB9CiAgfQp9CgpmdW5jdGlvbiBkb1JvdGF0ZVNoYXJlKCl7CiAgY29uZmlybUFjdGlvbign4Lit4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LiK4Li44LiU4LmD4Lir4Lih4LmIPyDguITguJnguJfguLXguYjguJbguLfguK3g',
  'uKXguLTguIfguIHguYzguYDguJTguLTguKHguIjguLDguYDguJvguLTguJTguYTguKHguYjguYTguJTguYnguK3guLXguIEnLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgnc2hhcmUucm90YXRlVG9rZW4nLCB7fSkudGhlbihmdW5jdGlvbigpewogICAgICB0b2Fz',
  'dCgn4Lit4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LiK4Li44LiU4LmD4Lir4Lih4LmI4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwn',
  'ZXJyJyk7IH0pOwogIH0pOwp9CgpmdW5jdGlvbiBkb0JhY2t1cE5vdygpewogIHRvYXN0KCfguIHguLPguKXguLHguIfguKrguLPguKPguK3guIfguILguYnguK3guKHguLnguKXguKXguIcgRHJpdmXigKYnKTsKICBjYWxsQXBpKCdiYWNrdXAuYmFja3VwTm93Jywg',
  'e30pLnRoZW4oZnVuY3Rpb24ocil7CiAgICB0b2FzdCgn4Liq4Liz4Lij4Lit4LiH4LmB4Lil4LmJ4LinOiAnICsgci5uYW1lLCAnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2Vy',
  'cicpOyB9KTsKfQo8L3NjcmlwdD4KPHNjcmlwdD5ib290KCk7PC9zY3JpcHQ+CjwvYm9keT4KPC9odG1sPgo='
].join('');

function indexHtml_() {
  return Utilities.newBlob(Utilities.base64Decode(INDEX_HTML_B64), 'text/html')
    .getDataAsString('UTF-8');
}
