/**
 * The M Corner AP — ระบบบริหารหอพัก (ไฟล์เดียวจบ)
 * ไฟล์นี้สร้างอัตโนมัติจากโฟลเดอร์ src/ เมื่อ 2026-11-25 05:01 UTC
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
 * @return {number} จำนวน op ที่เขียนจริง
 */
function applySyncOps_(ops, opts) {
  opts = opts || {};
  var n = 0;
  SYNC_APPLYING_ = true;
  try {
    (ops || []).forEach(function (op) {
      if (!op || !syncable_(op.s)) return;
      var name = op.s, key = syncKey_(name);
      if (op.add) { insertRow_(name, op.add); n++; return; }
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
        n++;
        return;
      }
      if (opts.accept && !opts.accept(op)) return;
      var found = findRow_(name, op.k, key);
      if (!op.r) {
        if (found) { deleteRow_(name, found._row, found); n++; }
        return;
      }
      if (found) updateRow_(name, found._row, Object.assign({}, found, op.r));
      else insertRow_(name, op.r);
      n++;
    });
  } finally {
    SYNC_APPLYING_ = false;
  }
  return n;
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
  RESYNC: 'SYNC_RESYNC',      // คิวยาวเกินที่เก็บได้ → ส่งทั้งชีตแทน
  LAST_OK: 'SYNC_LAST_OK',
  LAST_ERR: 'SYNC_LAST_ERROR'
};
var SYNC_QUEUE_MAX = 8000;    // Script Properties เก็บได้ราว 9 KB ต่อค่า

function syncConfigured_() {
  return !!(props_().getProperty(SYNC_PROP.SECRET) && props_().getProperty(SYNC_PROP.CF_URL));
}

/** ส่ง op ไปอีกฝั่ง — ฝั่ง Cloudflare ประกาศทับฟังก์ชันนี้ (ให้ Durable Object เป็นคนส่ง) */
function syncDeliver_(ops) {
  if (!syncConfigured_()) return false;
  var queue = syncQueue_();
  var batch = queue.concat([ops]);
  var resync = syncResyncList_();
  if (!resync.length && syncPost_(batch)) {
    props_().deleteProperty(SYNC_PROP.QUEUE);
    return true;
  }
  syncEnqueue_(ops);
  return false;
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
  if (text.length <= SYNC_QUEUE_MAX) {
    props_().setProperty(SYNC_PROP.QUEUE, text);
    return;
  }
  var names = {};
  syncResyncList_().forEach(function (n) { names[n] = true; });
  queue.forEach(function (b) { b.forEach(function (op) { if (op.s !== SHEETS.LOG) names[op.s] = true; }); });
  props_().setProperty(SYNC_PROP.RESYNC, JSON.stringify(Object.keys(names)));
  props_().deleteProperty(SYNC_PROP.QUEUE);
}

/** POST ไป Cloudflare · batch = รายการของชุด op (ส่งตามลำดับ) */
function syncPost_(batch) {
  var ops = [];
  batch.forEach(function (b) { ops = ops.concat(b); });
  try {
    var res = UrlFetchApp.fetch(String(props_().getProperty(SYNC_PROP.CF_URL)).replace(/\/+$/, '') + '/sync/apply', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true, followRedirects: true,
      payload: JSON.stringify({ secret: props_().getProperty(SYNC_PROP.SECRET), ops: ops })
    });
    var ok = res.getResponseCode() === 200 && (JSON.parse(res.getContentText() || '{}').ok === true);
    if (ok) props_().setProperty(SYNC_PROP.LAST_OK, nowStamp_());
    else props_().setProperty(SYNC_PROP.LAST_ERR, nowStamp_() + ' · HTTP ' + res.getResponseCode());
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
    var resync = syncResyncList_();
    if (resync.length) {
      var t = Date.now();
      var ops = resync.filter(syncable_).map(function (name) {
        return { s: name, all: readRows_(name).map(function (r) { return syncRowOut_(name, r); }), t: t };
      });
      if (!syncPost_([ops])) return 'ยังส่งไม่ได้ จะลองใหม่รอบหน้า';
      props_().deleteProperty(SYNC_PROP.RESYNC);
    }
    var queue = syncQueue_();
    if (queue.length) {
      if (!syncPost_(queue)) return 'ยังส่งไม่ได้ จะลองใหม่รอบหน้า';
      props_().deleteProperty(SYNC_PROP.QUEUE);
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
      var n = withScriptLock_(function () { return applySyncOps_(body.ops || []); }, 60000);
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
  if (e && e.changeType === 'EDIT') return;   // แก้ค่าในช่อง ตัว onEdit จัดการแล้ว
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
  'uKLguLLguKcg4LmGIOC4leC4seC4lOC4guC4tuC5ieC4meC4muC4o+C4o+C4l+C4seC4lOC5g+C4q+C4oeC5iOC5hOC4lOC5iSDguYTguKHguYjguJTguLHguJnguIjguK3guYPguKvguYnguYDguKXguLfguYjguK3guJnguILguYnguLLguIcgKi8KW2hpZGRlbl17',
  'ZGlzcGxheTpub25lIWltcG9ydGFudH0KOmZvY3VzLXZpc2libGV7b3V0bGluZToycHggc29saWQgdmFyKC0tYnJhbmQpO291dGxpbmUtb2Zmc2V0OjJweDtib3JkZXItcmFkaXVzOjVweH0KQG1lZGlhIChwcmVmZXJzLXJlZHVjZWQtbW90aW9uOnJlZHVjZSl7CiAg',
  'KiwqOjpiZWZvcmUsKjo6YWZ0ZXJ7YW5pbWF0aW9uLWR1cmF0aW9uOi4wMW1zIWltcG9ydGFudDthbmltYXRpb24taXRlcmF0aW9uLWNvdW50OjEhaW1wb3J0YW50O3RyYW5zaXRpb24tZHVyYXRpb246LjAxbXMhaW1wb3J0YW50fQp9CmF7Y29sb3I6dmFyKC0tYnJh',
  'bmQpO3RleHQtZGVjb3JhdGlvbjpub25lfQpidXR0b24saW5wdXQsc2VsZWN0LHRleHRhcmVhe2ZvbnQ6aW5oZXJpdDtjb2xvcjppbmhlcml0fQo6Oi13ZWJraXQtc2Nyb2xsYmFye3dpZHRoOjEwcHg7aGVpZ2h0OjEwcHh9Cjo6LXdlYmtpdC1zY3JvbGxiYXItdGh1',
  'bWJ7YmFja2dyb3VuZDp2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOjhweDtib3JkZXI6M3B4IHNvbGlkIHZhcigtLWJnKX0KCi8qID09PT09PT09PT09PSBsYXlvdXQgPT09PT09PT09PT09ICovCi5hcHB7ZGlzcGxheTpmbGV4O21pbi1oZWlnaHQ6MTAwdmh9Ci5u',
  'YXZ7CiAgd2lkdGg6dmFyKC0tbmF2LXcpO2ZsZXg6MCAwIHZhcigtLW5hdi13KTtiYWNrZ3JvdW5kOnZhcigtLW5hdik7Y29sb3I6dmFyKC0tbmF2LWluayk7CiAgZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtwb3NpdGlvbjpzdGlja3k7dG9wOjA7',
  'aGVpZ2h0OjEwMHZoO292ZXJmbG93LXk6YXV0bzsKfQouYnJhbmR7cGFkZGluZzoyMHB4IDE4cHggMTZweDtib3JkZXItYm90dG9tOjFweCBzb2xpZCByZ2JhKDI1NSwyNTUsMjU1LC4wNyl9Ci5icmFuZCBie2Rpc3BsYXk6YmxvY2s7Y29sb3I6I2ZmZjtmb250LXNp',
  'emU6MTUuNXB4O2xldHRlci1zcGFjaW5nOi4xcHg7Zm9udC1mYW1pbHk6dmFyKC0tZm9udC1kaXNwbGF5KTtmb250LXdlaWdodDo2MDB9Ci5icmFuZCBzcGFue2ZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0tbmF2LXNlYyl9Ci5uYXYtbGlzdHtwYWRkaW5nOjEw',
  'cHggMTBweCAyMHB4O2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47Z2FwOjJweDtmbGV4OjF9Ci5uYXYtc2Vje2ZvbnQtc2l6ZToxMC41cHg7bGV0dGVyLXNwYWNpbmc6LjlweDt0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2U7Y29sb3I6dmFyKC0tbmF2',
  'LXNlYyk7cGFkZGluZzoxNHB4IDEwcHggNnB4O2ZvbnQtd2VpZ2h0OjYwMH0KLm5hdi1pdGVtewogIGRpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjEwcHg7cGFkZGluZzo5cHggMTFweDtib3JkZXItcmFkaXVzOnZhcigtLXItc20pOwogIGN1cnNv',
  'cjpwb2ludGVyO2NvbG9yOnZhcigtLW5hdi1pbmspO2ZvbnQtc2l6ZToxMy41cHg7Ym9yZGVyOjA7YmFja2dyb3VuZDowO3dpZHRoOjEwMCU7dGV4dC1hbGlnbjpsZWZ0Owp9Ci5uYXYtaXRlbTpob3ZlcntiYWNrZ3JvdW5kOnZhcigtLW5hdi0yKTtjb2xvcjojZmZm',
  'fQoubmF2LWl0ZW0ub257YmFja2dyb3VuZDp2YXIoLS1icmFuZCk7Y29sb3I6dmFyKC0tYnJhbmQtaW5rKTtmb250LXdlaWdodDo2MDB9Ci5uYXYtaXRlbSAuaWN7d2lkdGg6MThweDt0ZXh0LWFsaWduOmNlbnRlcjtmb250LXNpemU6MTVweH0KLm5hdi1pdGVtIC5i',
  'YWRnZXttYXJnaW4tbGVmdDphdXRvO2JhY2tncm91bmQ6cmdiYSgyNTUsMjU1LDI1NSwuMTQpO2JvcmRlci1yYWRpdXM6MjBweDtwYWRkaW5nOjFweCA3cHg7Zm9udC1zaXplOjExcHh9Ci5uYXYtaXRlbS5vbiAuYmFkZ2V7YmFja2dyb3VuZDpyZ2JhKDI1NSwyNTUs',
  'MjU1LC4yNSl9Ci5uYXYtZm9vdHtwYWRkaW5nOjEycHggMTZweDtib3JkZXItdG9wOjFweCBzb2xpZCByZ2JhKDI1NSwyNTUsMjU1LC4wNyk7Zm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1uYXYtc2VjKX0KCi5tYWlue2ZsZXg6MTttaW4td2lkdGg6MDtkaXNw',
  'bGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1ufQoudG9wewogIHBvc2l0aW9uOnN0aWNreTt0b3A6MDt6LWluZGV4OjMwO2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgdmFyKC0tbGluZSk7CiAgLyog4LmB4LiW4Lia',
  '4Lir4Lix4Lin4LiB4Lin4LmJ4Liy4LiH4LmA4LiV4LmH4Lih4LiI4LitIOC5geC4leC5iOC4guC4reC4h+C4guC5ieC4suC4h+C5g+C4meC5gOC4o+C4teC4ouC4h+C4leC4o+C4h+C5geC4meC4p+C5gOC4lOC4teC4ouC4p+C4geC4seC4muC5gOC4meC4t+C5ieC4',
  'reC4q+C4suC4l+C4teC5iOC4reC4ouC4ueC5iOC4geC4peC4suC4h+C4iOC4rQogICAgICjguILguK3guJrguIvguYnguLLguKLguILguK3guIfguIrguLfguYjguK3guKvguJnguYnguLIgPSDguILguK3guJrguIvguYnguLLguKLguILguK3guIfguIHguLLguKPg',
  'uYzguJQpIOC5geC4muC4muC5gOC4lOC4teC4ouC4p+C4geC4seC4miBHaXRIdWIgLyBTdHJpcGUgLyBHb29nbGUgQWRtaW4gKi8KICBwYWRkaW5nOjExcHggbWF4KHZhcigtLWd1dHRlciksIGNhbGMoKDEwMCUgLSB2YXIoLS1wYWdlLW1heCkpIC8gMiArIHZhcigt',
  'LWd1dHRlcikpKTsKICBkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMnB4O2ZsZXgtd3JhcDp3cmFwOwp9Ci50b3AgaDF7Zm9udC1zaXplOjE3LjVweDttYXJnaW46MDtmb250LXdlaWdodDo2MDA7bGV0dGVyLXNwYWNpbmc6LS4xcHg7Zm9udC1m',
  'YW1pbHk6dmFyKC0tZm9udC1kaXNwbGF5KTt0ZXh0LXdyYXA6YmFsYW5jZX0KLnRvcCAuc3Vie2ZvbnQtc2l6ZToxMnB4O2NvbG9yOnZhcigtLW11dGVkKTttYXJnaW4tdG9wOjFweH0KLnRvcC1yaWdodHttYXJnaW4tbGVmdDphdXRvO2Rpc3BsYXk6ZmxleDthbGln',
  'bi1pdGVtczpjZW50ZXI7Z2FwOjhweDtmbGV4LXdyYXA6d3JhcH0KOnJvb3R7LS1wYWdlLW1heDoxMzIwcHg7LS1ndXR0ZXI6MjJweH0KLyog4LmA4LiZ4Li34LmJ4Lit4Lir4Liy4Lit4Lii4Li54LmI4LiB4Lil4Liy4LiH4LiI4LitIOC4geC4p+C5ieC4suC4h+C5',
  'hOC4oeC5iOC5gOC4geC4tOC4mSAxMzIwcHgg4oCUIOC4iOC4reC5g+C4q+C4jeC5iOC4iOC4sOC5gOC4q+C4peC4t+C4reC4l+C4teC5iOC4p+C5iOC4suC4h+C4quC4reC4h+C4guC5ieC4suC4h+C5gOC4l+C5iOC4suC4geC4seC4mSDguYTguKHguYjguIHguK3g',
  'uIfguIrguLTguJTguIvguYnguLLguKIKICAgKOC5gOC4p+C5h+C4muC5g+C4q+C4jeC5iOC4quC5iOC4p+C4meC4oeC4suC4geC5g+C4iuC5iSAxMjAw4oCTMTQ0MHB4OiDguK3guYjguLLguJnguIfguYjguLLguKIg4LiV4Liy4LmE4Lih4LmI4LiV4LmJ4Lit4LiH',
  '4LiB4Lin4Liy4LiU4LmE4LiB4LilIOC4leC4suC4o+C4suC4h+C5hOC4oeC5iOC4ouC4t+C4lOC4iOC4meC4leC4seC4p+C5gOC4peC4guC4q+C5iOC4suC4h+C4geC4seC4mSkgKi8KLmNvbnRlbnR7cGFkZGluZzoyNHB4IHZhcigtLWd1dHRlcikgNjRweDttYXgt',
  'd2lkdGg6dmFyKC0tcGFnZS1tYXgpO3dpZHRoOjEwMCU7bWFyZ2luOjAgYXV0b30KCi5idXJnZXJ7ZGlzcGxheTpub25lO2JhY2tncm91bmQ6MDtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6dmFyKC0tci1zbSk7cGFkZGluZzo2cHgg',
  'MTBweDtjdXJzb3I6cG9pbnRlcn0KCi8qIOC5geC4luC4muC4peC5iOC4suC4h+C4quC4s+C4q+C4o+C4seC4muC4oeC4t+C4reC4luC4t+C4rSDigJQg4Lib4Li44LmI4Lih4LiK4Li44LiU4LmA4LiU4Li14Lii4Lin4LiB4Lix4Lia4LmA4Lih4LiZ4Li54LiC4LmJ',
  '4Liy4LiHIOC5gOC4o+C4teC4ouC4gSBnbygpIOC4leC4seC4p+C5gOC4lOC4teC4ouC4p+C4geC4seC4mQogICDguYTguKHguYjguYPguIrguYjguKvguJnguYnguLLguIjguK3guITguJnguKXguLDguIrguLjguJQg4LiI4Lit4LiB4Lin4LmJ4Liy4LiH4LiL4LmI',
  '4Lit4LiZ4LmE4Lin4LmJIOC4iOC4reC5geC4hOC4muC4hOC5iOC4reC4ouC5guC4nOC4peC5iCAo4LiU4Li5IG1lZGlhIHF1ZXJ5IOC4l+C5ieC4suC4ouC5hOC4n+C4peC5jCkKICAg4Lib4Lij4Liw4LiB4Liy4Lio4LmE4Lin4LmJ4LiV4Lij4LiH4LiZ4Li14LmJ',
  '4LmA4Lie4Lij4Liy4Liw4LiV4LmJ4Lit4LiH4Lih4Liy4LiB4LmI4Lit4LiZIG1lZGlhIHF1ZXJ5IOC5hOC4oeC5iOC4h+C4seC5ieC4mSBkaXNwbGF5Om5vbmUg4LiI4Liw4LiK4LiZ4LiwICovCi50YWJiYXJ7ZGlzcGxheTpub25lfQoKLyogPT09PT09PT09PT09',
  'IGNvbnRyb2xzID09PT09PT09PT09PSAqLwouc2VsLC5pbnAsLnRhewogIGJhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXItc20pOwogIHBhZGRpbmc6N3B4IDExcHg7Zm9udC1z',
  'aXplOjEzLjVweDt3aWR0aDoxMDAlO291dGxpbmU6MDt0cmFuc2l0aW9uOmJvcmRlci1jb2xvciAuMTVzLGJveC1zaGFkb3cgLjE1czsKfQouc2VsOmZvY3VzLC5pbnA6Zm9jdXMsLnRhOmZvY3Vze2JvcmRlci1jb2xvcjp2YXIoLS1icmFuZCk7Ym94LXNoYWRvdzow',
  'IDAgMCAzcHggdmFyKC0tYnJhbmQtc29mdCl9Ci50YXttaW4taGVpZ2h0Ojc0cHg7cmVzaXplOnZlcnRpY2FsfQouc2Vse2N1cnNvcjpwb2ludGVyO3BhZGRpbmctcmlnaHQ6MjZweH0KLnctYXV0b3t3aWR0aDphdXRvfQouYnRuewogIGRpc3BsYXk6aW5saW5lLWZs',
  'ZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo2cHg7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpOwogIGJvcmRlci1yYWRpdXM6dmFyKC0tci1zbSk7cGFkZGluZzo3cHggMTNweDtmb250LXNpemU6MTMuNXB4O2N1',
  'cnNvcjpwb2ludGVyO2ZvbnQtd2VpZ2h0OjUwMDsKICB0cmFuc2l0aW9uOmJhY2tncm91bmQgLjE1cyxib3JkZXItY29sb3IgLjE1cyx0cmFuc2Zvcm0gLjA1czt3aGl0ZS1zcGFjZTpub3dyYXA7Cn0KLmJ0bjpob3ZlcntiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2Ut',
  'Mik7Ym9yZGVyLWNvbG9yOnZhcigtLWZhaW50KX0KLmJ0bjphY3RpdmV7dHJhbnNmb3JtOnRyYW5zbGF0ZVkoMXB4KX0KLmJ0bi5wcml7YmFja2dyb3VuZDp2YXIoLS1icmFuZCk7Ym9yZGVyLWNvbG9yOnZhcigtLWJyYW5kKTtjb2xvcjp2YXIoLS1icmFuZC1pbmsp',
  'fQouYnRuLnByaTpob3ZlcntmaWx0ZXI6YnJpZ2h0bmVzcygxLjA3KX0KLmJ0bi5kZ3J7Y29sb3I6dmFyKC0tZGFuZ2VyKTtib3JkZXItY29sb3I6dmFyKC0tZGFuZ2VyKX0KLmJ0bi5kZ3I6aG92ZXJ7YmFja2dyb3VuZDp2YXIoLS1kYW5nZXItc29mdCl9Ci5idG4u',
  'c217cGFkZGluZzo0cHggOXB4O2ZvbnQtc2l6ZToxMi41cHh9Ci5idG4uaWNvbntwYWRkaW5nOjVweCA4cHh9Ci5idG5bZGlzYWJsZWRde29wYWNpdHk6LjU7Y3Vyc29yOm5vdC1hbGxvd2VkfQoKLmNoaXBze2Rpc3BsYXk6ZmxleDtnYXA6NnB4O2ZsZXgtd3JhcDp3',
  'cmFwfQouY2hpcHsKICBib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7Ym9yZGVyLXJhZGl1czo5OXB4O3BhZGRpbmc6NHB4IDEycHg7CiAgZm9udC1zaXplOjEyLjVweDtjdXJzb3I6cG9pbnRlcjtjb2xvcjp2YXIo',
  'LS1pbmstMik7Cn0KLmNoaXA6aG92ZXJ7Ym9yZGVyLWNvbG9yOnZhcigtLWJyYW5kKTtjb2xvcjp2YXIoLS1icmFuZCl9Ci5jaGlwLm9ue2JhY2tncm91bmQ6dmFyKC0tYnJhbmQpO2JvcmRlci1jb2xvcjp2YXIoLS1icmFuZCk7Y29sb3I6dmFyKC0tYnJhbmQtaW5r',
  'KTtmb250LXdlaWdodDo2MDB9CgovKiA9PT09PT09PT09PT0gY2FyZHMgPT09PT09PT09PT09ICovCi5jYXJke2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXIpO2JveC1zaGFk',
  'b3c6dmFyKC0tc2gpfQouY2FyZC1oe3BhZGRpbmc6MTRweCAxNnB4O2JvcmRlci1ib3R0b206MXB4IHNvbGlkIHZhcigtLWxpbmUtMik7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTBweDtmbGV4LXdyYXA6d3JhcH0KLmNhcmQtaCBoM3ttYXJn',
  'aW46MDtmb250LXNpemU6MTQuNXB4O2ZvbnQtd2VpZ2h0OjYwMDtmb250LWZhbWlseTp2YXIoLS1mb250LWRpc3BsYXkpO3RleHQtd3JhcDpiYWxhbmNlfQouY2FyZC1oIC5zcHttYXJnaW4tbGVmdDphdXRvO2Rpc3BsYXk6ZmxleDtnYXA6NnB4O2FsaWduLWl0ZW1z',
  'OmNlbnRlcjtmbGV4LXdyYXA6d3JhcH0KLmNhcmQtYntwYWRkaW5nOjE2cHh9Ci5jYXJkLWIuZmx1c2h7cGFkZGluZzowfQoKLmdyaWR7ZGlzcGxheTpncmlkO2dhcDoxNHB4fQouZzJ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCgyLG1pbm1heCgwLDFmcikp',
  'fQouZzN7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCgzLG1pbm1heCgwLDFmcikpfQouZzR7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCg0LG1pbm1heCgwLDFmcikpfQouZy1hdXRve2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoYXV0by1maXQs',
  'bWlubWF4KDI2MHB4LDFmcikpfQoKLyogS1BJICovCi5rcGl7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlKTtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6dmFyKC0tcik7cGFkZGluZzoxNHB4IDE2cHg7Ym94LXNoYWRvdzp2YXIoLS1z',
  'aCk7CiAgY29udGFpbmVyLXR5cGU6aW5saW5lLXNpemV9ICAgLyog4LmD4Lir4LmJ4LiV4Lix4Lin4LmA4Lil4LiC4LiC4LmJ4Liy4LiH4LmD4LiZ4Lii4LmI4Lit4LiV4Liy4Lih4LiE4Lin4Liy4Lih4LiB4Lin4LmJ4Liy4LiH4LiC4Lit4LiH4LiB4Lil4LmI4Lit',
  '4LiH4LmA4Lit4LiHIOC5hOC4oeC5iOC4p+C5iOC4suC4iOC4reC4guC4meC4suC4lOC5hOC4q+C4mSAqLwoua3BpIC5sYmx7Zm9udC1zaXplOjEycHg7Y29sb3I6dmFyKC0tbXV0ZWQpO2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjZweH0KLmtw',
  'aSAudmFse2ZvbnQtc2l6ZToyM3B4O2ZvbnQtc2l6ZTpjbGFtcCgxNXB4LDEyLjVjcWksMjNweCk7Zm9udC13ZWlnaHQ6NjAwO2xldHRlci1zcGFjaW5nOi0uNHB4O21hcmdpbi10b3A6NXB4OwogIGZvbnQtZmFtaWx5OnZhcigtLWZvbnQtZGlzcGxheSk7Zm9udC12',
  'YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zO292ZXJmbG93LXdyYXA6YW55d2hlcmV9Ci5rcGkgLmNhcHtmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLWZhaW50KTttYXJnaW4tdG9wOjJweDtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXN9Ci5r',
  'cGkuYWNjZW50e2JhY2tncm91bmQ6dmFyKC0tYnJhbmQtc29mdCk7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50fQoua3BpLmFjY2VudCAubGJse2NvbG9yOnZhcigtLWJyYW5kKX0KLmtwaS5nb29kIC52YWx7Y29sb3I6dmFyKC0tb2spfSAua3BpLmJhZCAudmFse2Nv',
  'bG9yOnZhcigtLWRhbmdlcil9IC5rcGkud2FybiAudmFse2NvbG9yOnZhcigtLXdhcm4pfQoKLyogcHJvZ3Jlc3MgKi8KLnBiYXJ7aGVpZ2h0OjEwcHg7Ym9yZGVyLXJhZGl1czo5OXB4O2JhY2tncm91bmQ6dmFyKC0tbGluZS0yKTtvdmVyZmxvdzpoaWRkZW47cG9z',
  'aXRpb246cmVsYXRpdmV9Ci5wYmFyPml7ZGlzcGxheTpibG9jaztoZWlnaHQ6MTAwJTtib3JkZXItcmFkaXVzOjk5cHg7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoOTBkZWcsdmFyKC0tYnJhbmQpLHZhcigtLWJyYW5kLTIpKTt0cmFuc2l0aW9uOndpZHRoIC42',
  'cyBjdWJpYy1iZXppZXIoLjQsMCwuMiwxKX0KLnBiYXIubGd7aGVpZ2h0OjE2cHh9Ci5wYmFyLm9rPml7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoOTBkZWcsdmFyKC0tb2spLHZhcigtLW9rLTIpKX0KLnBiYXIud2Fybj5pe2JhY2tncm91bmQ6bGluZWFyLWdy',
  'YWRpZW50KDkwZGVnLHZhcigtLXdhcm4pLHZhcigtLXdhcm4tMikpfQoucG1ldGF7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2ZvbnQtc2l6ZToxMnB4O2NvbG9yOnZhcigtLW11dGVkKTttYXJnaW4tdG9wOjdweH0KLnBtZXRhIGJ7',
  'Y29sb3I6dmFyKC0taW5rKTtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXN9CgovKiA9PT09PT09PT09PT0gdGFibGUgPT09PT09PT09PT09ICovCi50d3tvdmVyZmxvdy14OmF1dG87LXdlYmtpdC1vdmVyZmxvdy1zY3JvbGxpbmc6dG91Y2h9CnRhYmxl',
  'LnR7d2lkdGg6MTAwJTtib3JkZXItY29sbGFwc2U6Y29sbGFwc2U7Zm9udC1zaXplOjEzcHg7bWluLXdpZHRoOjY0MHB4fQp0YWJsZS50IHRoewogIHRleHQtYWxpZ246bGVmdDtwYWRkaW5nOjlweCAxMnB4O2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKTtib3Jk',
  'ZXItYm90dG9tOjFweCBzb2xpZCB2YXIoLS1saW5lKTsKICBmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLW11dGVkKTtmb250LXdlaWdodDo2MDA7bGV0dGVyLXNwYWNpbmc6LjNweDt0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2U7d2hpdGUtc3BhY2U6bm93cmFw',
  'Owp9CnRhYmxlLnQgdGR7cGFkZGluZzoxMHB4IDEycHg7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgdmFyKC0tbGluZS0yKTt2ZXJ0aWNhbC1hbGlnbjp0b3B9CnRhYmxlLnQgdHI6bGFzdC1jaGlsZCB0ZHtib3JkZXItYm90dG9tOjB9CnRhYmxlLnQgdGJvZHkgdHI6',
  'aG92ZXJ7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpfQoubnVte3RleHQtYWxpZ246cmlnaHQ7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zO3doaXRlLXNwYWNlOm5vd3JhcH0KLm5vd3JhcHt3aGl0ZS1zcGFjZTpub3dyYXB9Ci50LWFjdGlvbnN7',
  'ZGlzcGxheTpmbGV4O2dhcDo0cHg7anVzdGlmeS1jb250ZW50OmZsZXgtZW5kfQoKLyogPT09PT09PT09PT09IGJhZGdlcyA9PT09PT09PT09PT0gKi8KLmJ7ZGlzcGxheTppbmxpbmUtZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjRweDtib3JkZXItcmFkaXVz',
  'Ojk5cHg7cGFkZGluZzoycHggOXB4O2ZvbnQtc2l6ZToxMS41cHg7Zm9udC13ZWlnaHQ6NjAwO3doaXRlLXNwYWNlOm5vd3JhcH0KLmIub2t7YmFja2dyb3VuZDp2YXIoLS1vay1zb2Z0KTtjb2xvcjp2YXIoLS1vayl9Ci5iLndhcm57YmFja2dyb3VuZDp2YXIoLS13',
  'YXJuLXNvZnQpO2NvbG9yOnZhcigtLXdhcm4pfQouYi5kZ3J7YmFja2dyb3VuZDp2YXIoLS1kYW5nZXItc29mdCk7Y29sb3I6dmFyKC0tZGFuZ2VyKX0KLmIuaW5mb3tiYWNrZ3JvdW5kOnZhcigtLWluZm8tc29mdCk7Y29sb3I6dmFyKC0taW5mbyl9Ci50IHRyLmFk',
  'aiB0ZHtiYWNrZ3JvdW5kOnZhcigtLWluZm8tc29mdCl9Ci8qIOC4m+C5ieC4suC4ouC4l+C4teC5iOC4guC5ieC4reC4hOC4p+C4suC4oeC4ouC4suC4p+C5hOC4lOC5iSAo4LiK4Li34LmI4Lit4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJKSDguYPguKvguYnguJXg',
  'uLHguJTguILguLbguYnguJnguJrguKPguKPguJfguLHguJTguYPguKvguKHguYjguYHguJfguJnguIHguLLguKPguKXguYnguJnguILguK3guJrguIHguLLguKPguYzguJQgKi8KLmIud3JhcHt3aGl0ZS1zcGFjZTpub3JtYWw7ZGlzcGxheTppbmxpbmUtYmxvY2s7',
  'bWF4LXdpZHRoOjEwMCU7Ym9yZGVyLXJhZGl1czoxMHB4O2xpbmUtaGVpZ2h0OjEuNDU7b3ZlcmZsb3ctd3JhcDphbnl3aGVyZX0KLmIubXV0ZXtiYWNrZ3JvdW5kOnZhcigtLWxpbmUtMik7Y29sb3I6dmFyKC0tbXV0ZWQpfQoKLyogPT09PT09PT09PT09IHJvb20g',
  'Z3JpZCA9PT09PT09PT09PT0gKi8KLmZsb29yc3tkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2dhcDoxMnB4fQouZmxvb3J7ZGlzcGxheTpmbGV4O2dhcDoxMnB4O2FsaWduLWl0ZW1zOmZsZXgtc3RhcnR9Ci5mbG9vci10YWd7CiAgZmxleDowIDAg',
  'NjJweDtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXItc20pOwogIHBhZGRpbmc6OHB4O3RleHQtYWxpZ246Y2VudGVyO2ZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0t',
  'bXV0ZWQpOwp9Ci5mbG9vci10YWcgYntkaXNwbGF5OmJsb2NrO2ZvbnQtc2l6ZToxN3B4O2NvbG9yOnZhcigtLWluayl9Ci5yb29tc3tkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdChhdXRvLWZpbGwsbWlubWF4KDEyNnB4LDFmcikpO2dh',
  'cDo4cHg7ZmxleDoxfQoucm9vbXsKICBib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7Ym9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTtwYWRkaW5nOjlweCAxMHB4OwogIGN1cnNvcjpwb2ludGVyO3RyYW5zaXRpb246',
  'dHJhbnNmb3JtIC4xcyxib3gtc2hhZG93IC4xNXMsYm9yZGVyLWNvbG9yIC4xNXM7cG9zaXRpb246cmVsYXRpdmU7b3ZlcmZsb3c6aGlkZGVuOwp9Ci5yb29tOmhvdmVye3RyYW5zZm9ybTp0cmFuc2xhdGVZKC0xcHgpO2JveC1zaGFkb3c6dmFyKC0tc2gtbGcpO2Jv',
  'cmRlci1jb2xvcjp2YXIoLS1icmFuZCl9Ci5yb29tIC5ub3tmb250LXdlaWdodDo2MDA7Zm9udC1zaXplOjE1LjVweDtsZXR0ZXItc3BhY2luZzowO2ZvbnQtZmFtaWx5OnZhcigtLWZvbnQtZGlzcGxheSk7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1z',
  'fQoucm9vbSAuc3R7Zm9udC1zaXplOjExcHg7Y29sb3I6dmFyKC0tbXV0ZWQpO21hcmdpbi10b3A6MnB4O2xpbmUtaGVpZ2h0OjEuM30KLnJvb20gLmRvdHtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6OXB4O3JpZ2h0OjlweDt3aWR0aDo4cHg7aGVpZ2h0OjhweDtib3Jk',
  'ZXItcmFkaXVzOjk5cHg7YmFja2dyb3VuZDp2YXIoLS1saW5lKX0KLnJvb20ucy1vayAuZG90e2JhY2tncm91bmQ6dmFyKC0tb2spfSAucm9vbS5zLXdhcm4gLmRvdHtiYWNrZ3JvdW5kOnZhcigtLXdhcm4pfQoucm9vbS5zLWRnciAuZG90e2JhY2tncm91bmQ6dmFy',
  'KC0tZGFuZ2VyKX0gLnJvb20ucy1pbmZvIC5kb3R7YmFja2dyb3VuZDp2YXIoLS1pbmZvKX0KLnJvb20ucy1va3tib3JkZXItbGVmdDozcHggc29saWQgdmFyKC0tb2spfSAucm9vbS5zLXdhcm57Ym9yZGVyLWxlZnQ6M3B4IHNvbGlkIHZhcigtLXdhcm4pfQoucm9v',
  'bS5zLWRncntib3JkZXItbGVmdDozcHggc29saWQgdmFyKC0tZGFuZ2VyKX0gLnJvb20ucy1pbmZve2JvcmRlci1sZWZ0OjNweCBzb2xpZCB2YXIoLS1pbmZvKX0KCi8qID09PT09PT09PT09PSBhbGVydHMgLyBsaXN0ID09PT09PT09PT09PSAqLwouYWxpc3R7ZGlz',
  'cGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbn0KLmFsaXtkaXNwbGF5OmZsZXg7Z2FwOjExcHg7cGFkZGluZzoxMXB4IDE2cHg7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgdmFyKC0tbGluZS0yKTtjdXJzb3I6cG9pbnRlcn0KLmFsaTpsYXN0LWNoaWxke2Jv',
  'cmRlci1ib3R0b206MH0KLmFsaTpob3ZlcntiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMil9Ci5hbGkgLmlje2ZvbnQtc2l6ZToxNnB4O2xpbmUtaGVpZ2h0OjEuM30KLmFsaSAudHR7Zm9udC13ZWlnaHQ6NjAwO2ZvbnQtc2l6ZToxM3B4fQouYWxpIC5kZHtmb250',
  'LXNpemU6MTJweDtjb2xvcjp2YXIoLS1tdXRlZCk7bWFyZ2luLXRvcDoxcHh9Ci5hbGkubC1kYW5nZXIgLnR0e2NvbG9yOnZhcigtLWRhbmdlcil9IC5hbGkubC13YXJuIC50dHtjb2xvcjp2YXIoLS13YXJuKX0KCi8qID09PT09PT09PT09PSBtZWRpYSAvIHRodW1i',
  'cyA9PT09PT09PT09PT0gKi8KLnRodW1ic3tkaXNwbGF5OmZsZXg7Z2FwOjVweDtmbGV4LXdyYXA6d3JhcH0KLnRodW1iewogIHdpZHRoOjQ0cHg7aGVpZ2h0OjQ0cHg7Ym9yZGVyLXJhZGl1czo2cHg7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtvYmplY3Qt',
  'Zml0OmNvdmVyOwogIGJhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKTtjdXJzb3I6cG9pbnRlcjtkaXNwbGF5OmJsb2NrOwp9Ci50aHVtYi5iaWd7d2lkdGg6OTJweDtoZWlnaHQ6OTJweH0KLmZpbGUtZHJvcHsKICBib3JkZXI6MS41cHggZGFzaGVkIHZhcigtLWxp',
  'bmUpO2JvcmRlci1yYWRpdXM6dmFyKC0tci1zbSk7cGFkZGluZzoxNHB4O3RleHQtYWxpZ246Y2VudGVyOwogIGNvbG9yOnZhcigtLW11dGVkKTtmb250LXNpemU6MTIuNXB4O2N1cnNvcjpwb2ludGVyO2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKTsKfQouZmls',
  'ZS1kcm9wOmhvdmVye2JvcmRlci1jb2xvcjp2YXIoLS1icmFuZCk7Y29sb3I6dmFyKC0tYnJhbmQpfQoKLyogPT09PT09PT09PT09IG1vZGFsID09PT09PT09PT09PSAqLwoub3Z7cG9zaXRpb246Zml4ZWQ7aW5zZXQ6MDtiYWNrZ3JvdW5kOnJnYmEoMTYsMjQsNDAs',
  'LjU1KTtiYWNrZHJvcC1maWx0ZXI6Ymx1cigzcHgpO3otaW5kZXg6MTAwO2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpmbGV4LXN0YXJ0O2p1c3RpZnktY29udGVudDpjZW50ZXI7cGFkZGluZzoyNHB4IDE2cHg7b3ZlcmZsb3cteTphdXRvfQoubW9kYWx7YmFja2dy',
  'b3VuZDp2YXIoLS1zdXJmYWNlKTtib3JkZXItcmFkaXVzOjE0cHg7Ym94LXNoYWRvdzp2YXIoLS1zaC1sZyk7d2lkdGg6MTAwJTttYXgtd2lkdGg6NjYwcHg7bWFyZ2luOmF1dG8gMDthbmltYXRpb246cG9wIC4xNnMgZWFzZS1vdXR9Ci5tb2RhbC53aWRle21heC13',
  'aWR0aDo5NjBweH0KQGtleWZyYW1lcyBwb3B7ZnJvbXtvcGFjaXR5OjA7dHJhbnNmb3JtOnRyYW5zbGF0ZVkoLThweCkgc2NhbGUoLjk4NSl9dG97b3BhY2l0eToxO3RyYW5zZm9ybTpub25lfX0KLm1vZGFsLWh7cGFkZGluZzoxNnB4IDE4cHg7Ym9yZGVyLWJvdHRv',
  'bToxcHggc29saWQgdmFyKC0tbGluZSk7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTBweH0KLm1vZGFsLWggaDN7bWFyZ2luOjA7Zm9udC1zaXplOjE1LjVweDtmb250LXdlaWdodDo2MDA7Zm9udC1mYW1pbHk6dmFyKC0tZm9udC1kaXNwbGF5',
  'KX0KLm1vZGFsLWJ7cGFkZGluZzoxOHB4O21heC1oZWlnaHQ6bWluKDcwdmgsNzAwcHgpO292ZXJmbG93LXk6YXV0b30KLm1vZGFsLWZ7cGFkZGluZzoxNHB4IDE4cHg7Ym9yZGVyLXRvcDoxcHggc29saWQgdmFyKC0tbGluZSk7ZGlzcGxheTpmbGV4O2dhcDo4cHg7',
  'anVzdGlmeS1jb250ZW50OmZsZXgtZW5kO2ZsZXgtd3JhcDp3cmFwfQoueHttYXJnaW4tbGVmdDphdXRvO2JhY2tncm91bmQ6MDtib3JkZXI6MDtmb250LXNpemU6MjBweDtjb2xvcjp2YXIoLS1tdXRlZCk7Y3Vyc29yOnBvaW50ZXI7bGluZS1oZWlnaHQ6MTtwYWRk',
  'aW5nOjJweCA2cHg7Ym9yZGVyLXJhZGl1czo2cHh9Ci54OmhvdmVye2JhY2tncm91bmQ6dmFyKC0tbGluZS0yKTtjb2xvcjp2YXIoLS1pbmspfQoKLmZncmlke2Rpc3BsYXk6Z3JpZDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDIsbWlubWF4KDAsMWZyKSk7',
  'Z2FwOjEzcHh9Ci5me2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47Z2FwOjVweH0KLmYuZnVsbHtncmlkLWNvbHVtbjoxLy0xfQouZiBsYWJlbHtmb250LXNpemU6MTJweDtjb2xvcjp2YXIoLS1pbmstMik7Zm9udC13ZWlnaHQ6NjAwfQouZiAuaGlu',
  'dHtmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLWZhaW50KX0KCi8qID09PT09PT09PT09PSBtaXNjID09PT09PT09PT09PSAqLwouZW1wdHl7cGFkZGluZzo0MHB4IDIwcHg7dGV4dC1hbGlnbjpjZW50ZXI7Y29sb3I6dmFyKC0tbXV0ZWQpfQouZW1wdHkgLmJp',
  'Z3tmb250LXNpemU6MzRweDttYXJnaW4tYm90dG9tOjhweDtvcGFjaXR5Oi42fQouc3BpbntkaXNwbGF5OmlubGluZS1ibG9jazt3aWR0aDoxNXB4O2hlaWdodDoxNXB4O2JvcmRlcjoycHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXRvcC1jb2xvcjp2YXIoLS1i',
  'cmFuZCk7Ym9yZGVyLXJhZGl1czo5OXB4O2FuaW1hdGlvbjpzcCAuN3MgbGluZWFyIGluZmluaXRlO3ZlcnRpY2FsLWFsaWduOi0ycHh9CkBrZXlmcmFtZXMgc3B7dG97dHJhbnNmb3JtOnJvdGF0ZSgzNjBkZWcpfX0KLnRvYXN0ewogIHBvc2l0aW9uOmZpeGVkO2xl',
  'ZnQ6NTAlO2JvdHRvbToyNHB4O3RyYW5zZm9ybTp0cmFuc2xhdGVYKC01MCUpO3otaW5kZXg6MjAwOwogIGJhY2tncm91bmQ6dmFyKC0tbmF2KTtjb2xvcjojZmZmO3BhZGRpbmc6MTBweCAxOHB4O2JvcmRlci1yYWRpdXM6OTlweDtmb250LXNpemU6MTNweDsKICBi',
  'b3gtc2hhZG93OnZhcigtLXNoLWxnKTthbmltYXRpb246dXAgLjJzIGVhc2Utb3V0O21heC13aWR0aDo5MHZ3Owp9Ci50b2FzdC5lcnJ7YmFja2dyb3VuZDp2YXIoLS1kYW5nZXIpfQoudG9hc3Qub2t7YmFja2dyb3VuZDp2YXIoLS1vayl9CkBrZXlmcmFtZXMgdXB7',
  'ZnJvbXtvcGFjaXR5OjA7dHJhbnNmb3JtOnRyYW5zbGF0ZSgtNTAlLDEwcHgpfXRve29wYWNpdHk6MTt0cmFuc2Zvcm06dHJhbnNsYXRlKC01MCUsMCl9fQoubXV0ZWR7Y29sb3I6dmFyKC0tbXV0ZWQpfSAuZmFpbnR7Y29sb3I6dmFyKC0tZmFpbnQpfQouZnMxMntm',
  'b250LXNpemU6MTJweH0gLmZzMTN7Zm9udC1zaXplOjEzcHh9Ci5tb25ve2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtc30KLm10OHttYXJnaW4tdG9wOjhweH0gLm10MTJ7bWFyZ2luLXRvcDoxMnB4fSAubXQxNnttYXJnaW4tdG9wOjE2cHh9IC5tYjh7',
  'bWFyZ2luLWJvdHRvbTo4cHh9IC5tYjEye21hcmdpbi1ib3R0b206MTJweH0KLnJvd3tkaXNwbGF5OmZsZXg7Z2FwOjhweDthbGlnbi1pdGVtczpjZW50ZXI7ZmxleC13cmFwOndyYXB9Ci5zcHttYXJnaW4tbGVmdDphdXRvfQouaHJ7aGVpZ2h0OjFweDtiYWNrZ3Jv',
  'dW5kOnZhcigtLWxpbmUtMik7bWFyZ2luOjE0cHggMH0KLmNsaXB7b3ZlcmZsb3c6aGlkZGVuO3RleHQtb3ZlcmZsb3c6ZWxsaXBzaXM7ZGlzcGxheTotd2Via2l0LWJveDstd2Via2l0LWxpbmUtY2xhbXA6Mjstd2Via2l0LWJveC1vcmllbnQ6dmVydGljYWx9Cgov',
  'KiBiYXIgY2hhcnQgKi8KLmJhcnN7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtnYXA6OXB4fQouYmFyLXJvd3tkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOm1pbm1heCg5MHB4LDE1MHB4KSAxZnIgYXV0bztnYXA6MTBweDthbGln',
  'bi1pdGVtczpjZW50ZXI7Zm9udC1zaXplOjEyLjVweH0KLmJhci10cmFja3toZWlnaHQ6OHB4O2JhY2tncm91bmQ6dmFyKC0tbGluZS0yKTtib3JkZXItcmFkaXVzOjk5cHg7b3ZlcmZsb3c6aGlkZGVufQouYmFyLWZpbGx7aGVpZ2h0OjEwMCU7YmFja2dyb3VuZDp2',
  'YXIoLS1icmFuZCk7Ym9yZGVyLXJhZGl1czo5OXB4O3RyYW5zaXRpb246d2lkdGggLjVzfQouYmFyLXJvdyAudntmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7Y29sb3I6dmFyKC0taW5rLTIpO2ZvbnQtd2VpZ2h0OjYwMDt3aGl0ZS1zcGFjZTpub3dy',
  'YXB9CgovKiB0aW1lbGluZSAqLwoudGx7cG9zaXRpb246cmVsYXRpdmU7cGFkZGluZy1sZWZ0OjIycHh9Ci50bDpiZWZvcmV7Y29udGVudDonJztwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0OjZweDt0b3A6NnB4O2JvdHRvbTo2cHg7d2lkdGg6MnB4O2JhY2tncm91bmQ6',
  'dmFyKC0tbGluZSl9Ci50bC1pe3Bvc2l0aW9uOnJlbGF0aXZlO3BhZGRpbmc6MCAwIDE2cHh9Ci50bC1pOmJlZm9yZXtjb250ZW50OicnO3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6LTIwcHg7dG9wOjVweDt3aWR0aDoxMHB4O2hlaWdodDoxMHB4O2JvcmRlci1yYWRp',
  'dXM6OTlweDtiYWNrZ3JvdW5kOnZhcigtLWJyYW5kKTtib3JkZXI6MnB4IHNvbGlkIHZhcigtLXN1cmZhY2UpfQoudGwtaSAuZHtmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLW11dGVkKX0KLnRsLWkgLnR7Zm9udC13ZWlnaHQ6NjAwO2ZvbnQtc2l6ZToxM3B4',
  'fQoKLyogPT09PT09PT09PT09IHJlc3BvbnNpdmUgPT09PT09PT09PT09ICovCkBtZWRpYSAobWF4LXdpZHRoOjkwMHB4KXsKICAuZzR7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCgyLG1pbm1heCgwLDFmcikpfQogIC5nM3tncmlkLXRlbXBsYXRlLWNvbHVt',
  'bnM6cmVwZWF0KDIsbWlubWF4KDAsMWZyKSl9Cn0KLyog4LmB4LiX4LmH4Lia4LmA4Lil4LmH4LiVOiDguYDguKHguJnguLnguILguYnguLLguIfguIHguLTguJnguJfguLXguYjguYTguJvguYDguIHguLfguK3guJrguKvguJnguLbguYjguIfguYPguJnguKrguLLg',
  'uKEg4LiB4Liy4Lij4LmM4LiU4LiE4Li54LmI4LiI4Liw4LmB4LiE4Lia4LiI4LiZ4LiV4Lix4Lin4LmA4Lil4LiC4Lit4Lix4LiU4LiB4Lix4LiZIOKAlCDguKfguLLguIfguJfguLXguKXguLDguYPguJrguYDguJXguYfguKHguITguKfguLLguKHguIHguKfguYng',
  'uLLguIfguYHguJfguJkgKi8KQG1lZGlhIChtaW4td2lkdGg6NzYxcHgpIGFuZCAobWF4LXdpZHRoOjEwMDBweCl7CiAgLmcye2dyaWQtdGVtcGxhdGUtY29sdW1uczoxZnJ9Cn0KLyog4LmB4LiX4LmH4Lia4LmA4Lil4LmH4LiVL+C4q+C4meC5ieC4suC4leC5iOC4',
  'suC4h+C4ouC5iOC4rTog4LmA4Lih4LiZ4Li54LiC4LmJ4Liy4LiH4Lii4Lix4LiH4Lit4Lii4Li54LmIIOC4l+C4teC5iOC5gOC4q+C4peC4t+C4reC5g+C4q+C5ieC5geC4luC4muC4q+C4seC4p+C5gOC4peC4ouC5geC4hOC4mgogICDguJrguLXguJrguIrguYjg',
  'uK3guIfguITguYnguJnguKvguLLguKXguIfguKvguJnguYjguK3guKLguIjguLDguYTguJTguYnguYTguKHguYjguJXguIHguJrguKPguKPguJfguLHguJTguIjguJnguYHguJbguJrguKvguLHguKfguKrguLnguIfguILguLbguYnguJnguK3guLXguIHguYDguJfg',
  'uYjguLLguJXguLHguKcgKi8KQG1lZGlhIChtYXgtd2lkdGg6MTA0MHB4KXsKICAudG9wLXJpZ2h0ICNzZWFyY2hCb3h7d2lkdGg6MTMycHghaW1wb3J0YW50fQogIC50b3AtcmlnaHQgI3llYXJTZWx7bWF4LXdpZHRoOjEzMnB4fQogIC8qIOC4leC4seC4p+C4muC4',
  'reC4geC4quC4luC4suC4meC4sOC5gOC4q+C4peC4t+C4reC5geC4leC5iOC5hOC4reC4hOC4reC4mSAo4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Lii4Lix4LiH4Lit4LmI4Liy4LiZ4LmE4LiU4LmJ4LiI4Liy4LiB4LiB4Liy4Lij4LiK4Li14LmJ4LiE4LmJ4Liy4LiH',
  'KQogICAgIOC4geC4juC5gOC4lOC4teC4ouC4p+C4geC4seC4muC4l+C4teC5iOC5g+C4iuC5ieC4muC4meC4oeC4t+C4reC4luC4t+C4reC4reC4ouC4ueC5iOC5geC4peC5ieC4pyDguYHguITguYjguILguKLguLHguJrguYPguKvguYnguYDguKPguLTguYjguKHg',
  'uYDguKPguYfguKfguILguLbguYnguJkgKi8KICAuc3luYy1waWxsIC5zeW5jLWxhYmVse2Rpc3BsYXk6bm9uZX0KICAuc3luYy1waWxse3BhZGRpbmc6M3B4IDhweH0KfQpAbWVkaWEgKG1heC13aWR0aDo3NjBweCl7CiAgLm5hdnsKICAgIHBvc2l0aW9uOmZpeGVk',
  'O2xlZnQ6MDt0b3A6MDtib3R0b206MDt6LWluZGV4OjYwO3RyYW5zZm9ybTp0cmFuc2xhdGVYKC0xMDAlKTsKICAgIHRyYW5zaXRpb246dHJhbnNmb3JtIC4yMnMgZWFzZTtib3gtc2hhZG93OnZhcigtLXNoLWxnKTsKICB9CiAgLm5hdi5vcGVue3RyYW5zZm9ybTpu',
  'b25lfQogIC5idXJnZXJ7ZGlzcGxheTppbmxpbmUtZmxleH0KICAuY29udGVudHtwYWRkaW5nOjE0cHggMTRweCA4MHB4fQogIC50b3B7cGFkZGluZzoxMHB4IDE0cHh9CiAgLmcyLC5nMywuZzR7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOjFmcn0KICAuZmdyaWR7Z3Jp',
  'ZC10ZW1wbGF0ZS1jb2x1bW5zOjFmcn0KICAuZmxvb3J7ZmxleC1kaXJlY3Rpb246Y29sdW1ufQogIC5mbG9vci10YWd7ZmxleDpub25lO3dpZHRoOjEwMCU7ZGlzcGxheTpmbGV4O2dhcDo4cHg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpmbGV4',
  'LXN0YXJ0O3RleHQtYWxpZ246bGVmdH0KICAuZmxvb3ItdGFnIGJ7Zm9udC1zaXplOjE0cHh9CiAgLnNjcmlte3Bvc2l0aW9uOmZpeGVkO2luc2V0OjA7YmFja2dyb3VuZDpyZ2JhKDAsMCwwLC40NSk7ei1pbmRleDo1NX0KICAubW9kYWwtYnttYXgtaGVpZ2h0Om5v',
  'bmV9CiAgLm92e3BhZGRpbmc6MH0KICAubW9kYWx7Ym9yZGVyLXJhZGl1czowO21pbi1oZWlnaHQ6MTAwdmg7bWF4LXdpZHRoOm5vbmV9Cn0KLyogPT09PT09PT09PT09IOC4q+C4meC5ieC4suC4peC5h+C4reC4geC4reC4tOC4mSAvIFBJTiA9PT09PT09PT09PT0g',
  'Ki8KYm9keS5sb2NrZWR7b3ZlcmZsb3c6aGlkZGVufQpib2R5LmxvY2tlZCAuYXBwe2ZpbHRlcjpibHVyKDNweCk7cG9pbnRlci1ldmVudHM6bm9uZTt1c2VyLXNlbGVjdDpub25lfQouYXV0aC13cmFwewogIHBvc2l0aW9uOmZpeGVkO2luc2V0OjA7ei1pbmRleDo2',
  'MDtkaXNwbGF5OmdyaWQ7cGxhY2UtaXRlbXM6Y2VudGVyOwogIHBhZGRpbmc6MjRweDtiYWNrZ3JvdW5kOnZhcigtLWJnKTtvdmVyZmxvdy15OmF1dG87Cn0KLmF1dGgtY2FyZHsKICB3aWR0aDoxMDAlO21heC13aWR0aDozNjBweDtiYWNrZ3JvdW5kOnZhcigtLXN1',
  'cmZhY2UpO2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7CiAgYm9yZGVyLXJhZGl1czoxNnB4O2JveC1zaGFkb3c6dmFyKC0tc2gtbGcpO3BhZGRpbmc6MjZweCAyNHB4IDIycHg7Cn0KLmF1dGgtYnJhbmR7Zm9udC1zaXplOjE1cHg7Y29sb3I6dmFyKC0tbXV0',
  'ZWQpO21hcmdpbi1ib3R0b206MThweDt0ZXh0LWFsaWduOmNlbnRlcn0KLmF1dGgtYnJhbmQgYntjb2xvcjp2YXIoLS1pbmspO2ZvbnQtZmFtaWx5OnZhcigtLWZvbnQtZGlzcGxheSl9Ci5hdXRoLWh7bWFyZ2luOjAgMCA0cHg7Zm9udC1zaXplOjIwcHg7Zm9udC13',
  'ZWlnaHQ6NjAwO2ZvbnQtZmFtaWx5OnZhcigtLWZvbnQtZGlzcGxheSk7dGV4dC1hbGlnbjpjZW50ZXJ9Ci5hdXRoLXN1YnttYXJnaW46MCAwIDE4cHg7Zm9udC1zaXplOjEzcHg7Y29sb3I6dmFyKC0tbXV0ZWQpO3RleHQtYWxpZ246Y2VudGVyO2xpbmUtaGVpZ2h0',
  'OjEuNn0KLmF1dGgtZnttYXJnaW4tYm90dG9tOjEzcHh9Ci5hdXRoLWYgbGFiZWx7ZGlzcGxheTpibG9jaztmb250LXNpemU6MTIuNXB4O2NvbG9yOnZhcigtLWluay0yKTttYXJnaW4tYm90dG9tOjVweDtmb250LXdlaWdodDo1MDB9Ci5hdXRoLWYgLmlucHt3aWR0',
  'aDoxMDAlO3BhZGRpbmc6MTBweCAxMnB4O2ZvbnQtc2l6ZToxNXB4fQouYXV0aC1nb3t3aWR0aDoxMDAlO2p1c3RpZnktY29udGVudDpjZW50ZXI7cGFkZGluZzoxMXB4O2ZvbnQtc2l6ZToxNC41cHg7bWFyZ2luLXRvcDo2cHh9Ci5hdXRoLWFsdHt3aWR0aDoxMDAl',
  'O2p1c3RpZnktY29udGVudDpjZW50ZXI7bWFyZ2luLXRvcDo5cHg7Zm9udC1zaXplOjEzcHh9Ci5hdXRoLWVycnsKICBiYWNrZ3JvdW5kOnZhcigtLWRhbmdlci1zb2Z0KTtjb2xvcjp2YXIoLS1kYW5nZXIpO2JvcmRlci1yYWRpdXM6dmFyKC0tci1zbSk7CiAgcGFk',
  'ZGluZzo5cHggMTJweDtmb250LXNpemU6MTIuNXB4O21hcmdpbi1ib3R0b206MTRweDtsaW5lLWhlaWdodDoxLjU1Owp9Ci5hdXRoLWZvb3R7Zm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1mYWludCk7dGV4dC1hbGlnbjpjZW50ZXI7bWFyZ2luOjE2cHggMCAw',
  'O2xpbmUtaGVpZ2h0OjEuNn0KCi8qIOC4iOC4uOC4lCA2IOC4iOC4uOC4lOC5geC4l+C4mSBQSU4g4LiX4Li14LmI4LiB4LiU4LmE4Lib4LmB4Lil4LmJ4LinICovCi5waW4tZG90c3tkaXNwbGF5OmZsZXg7Z2FwOjEzcHg7anVzdGlmeS1jb250ZW50OmNlbnRlcjtt',
  'YXJnaW46NnB4IDAgMjJweH0KLnBpbi1kb3RzIGl7CiAgd2lkdGg6MTNweDtoZWlnaHQ6MTNweDtib3JkZXItcmFkaXVzOjk5cHg7YmFja2dyb3VuZDp2YXIoLS1saW5lKTsKICBib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO3RyYW5zaXRpb246dHJhbnNmb3Jt',
  'IC4xMnMsYmFja2dyb3VuZCAuMTJzOwp9Ci5waW4tZG90cyBpLm9ue2JhY2tncm91bmQ6dmFyKC0tYnJhbmQpO2JvcmRlci1jb2xvcjp2YXIoLS1icmFuZCk7dHJhbnNmb3JtOnNjYWxlKDEuMTYpfQoucGluLWRvdHMuYnVzeXtvcGFjaXR5Oi41fQoucGluLWRvdHMu',
  'c2hha2V7YW5pbWF0aW9uOnNoYWtlIC40MnN9CkBrZXlmcmFtZXMgc2hha2V7CiAgMCUsMTAwJXt0cmFuc2Zvcm06dHJhbnNsYXRlWCgwKX0gMjAle3RyYW5zZm9ybTp0cmFuc2xhdGVYKC04cHgpfQogIDQwJXt0cmFuc2Zvcm06dHJhbnNsYXRlWCg4cHgpfSA2MCV7',
  'dHJhbnNmb3JtOnRyYW5zbGF0ZVgoLTVweCl9IDgwJXt0cmFuc2Zvcm06dHJhbnNsYXRlWCg1cHgpfQp9Ci5waW4tcGFke2Rpc3BsYXk6Z3JpZDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDMsMWZyKTtnYXA6MTFweH0KLnBpbi1rewogIGFzcGVjdC1yYXRp',
  'bzoxLzE7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Y29sb3I6dmFyKC0taW5rKTsKICBib3JkZXItcmFkaXVzOjE0cHg7Zm9udC1zaXplOjIxcHg7Zm9udC13ZWlnaHQ6NTAwO2N1cnNvcjpwb2ludGVyOwog',
  'IGZvbnQtZmFtaWx5OnZhcigtLWZvbnQtZGlzcGxheSk7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zOwogIHRyYW5zaXRpb246YmFja2dyb3VuZCAuMXMsdHJhbnNmb3JtIC4wNnM7Cn0KLnBpbi1rOmhvdmVye2JhY2tncm91bmQ6dmFyKC0tYnJhbmQt',
  'c29mdCk7Ym9yZGVyLWNvbG9yOnZhcigtLWJyYW5kKX0KLnBpbi1rOmFjdGl2ZXt0cmFuc2Zvcm06c2NhbGUoLjk0KX0KLnBpbi1rLmdob3N0e2JhY2tncm91bmQ6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2ZvbnQtc2l6ZToxN3B4O2NvbG9y',
  'OnZhcigtLW11dGVkKX0KLnBpbi1rLmdob3N0OmhvdmVye2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKTtib3JkZXItY29sb3I6dmFyKC0tbGluZSl9CgovKiA9PT09PT09PT09PT0g4LiV4Lix4Lin4LmA4Lil4Li34Lit4LiB4LiY4Li14LihID09PT09PT09PT09',
  'PSAqLwoudGhlbWUtcGlja3tkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCgzLG1pbm1heCgwLDFmcikpO2dhcDoxMHB4fQoudGhlbWUtb3B0ewogIGRpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47YWxpZ24taXRlbXM6Y2Vu',
  'dGVyO2dhcDo0cHg7dGV4dC1hbGlnbjpjZW50ZXI7CiAgcGFkZGluZzoxNXB4IDEwcHg7Ym9yZGVyOjEuNXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6dmFyKC0tcik7CiAgYmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpO2N1cnNvcjpwb2ludGVy',
  'O2NvbG9yOnZhcigtLWluayk7Zm9udDppbmhlcml0OwogIHRyYW5zaXRpb246Ym9yZGVyLWNvbG9yIC4xMnMsYmFja2dyb3VuZCAuMTJzOwp9Ci50aGVtZS1vcHQ6aG92ZXJ7Ym9yZGVyLWNvbG9yOnZhcigtLWJyYW5kKX0KLnRoZW1lLW9wdC5vbntib3JkZXItY29s',
  'b3I6dmFyKC0tYnJhbmQpO2JhY2tncm91bmQ6dmFyKC0tYnJhbmQtc29mdCl9Ci50aGVtZS1vcHQgLmlje2ZvbnQtc2l6ZToyNHB4O2xpbmUtaGVpZ2h0OjEuMn0KLnRoZW1lLW9wdCBie2ZvbnQtc2l6ZToxMy41cHh9Ci50aGVtZS1vcHQgLmhpbnR7Zm9udC1zaXpl',
  'OjExcHg7Y29sb3I6dmFyKC0tbXV0ZWQpO2xpbmUtaGVpZ2h0OjEuNDV9Ci53YXJuLXRleHR7Y29sb3I6dmFyKC0td2Fybil9CgovKiA9PT09PT09PT09PT0g4Lic4Lil4LiB4Liy4Lij4Lit4LmI4Liy4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiI4Liy4LiB4Lij',
  '4Li54LibID09PT09PT09PT09PSAqLwovKiDguYTguK7guYTguKXguJXguYzguKrguLHguYnguJkg4LmGIOC5g+C4q+C5ieC5gOC4q+C5h+C4meC4p+C5iOC4suC4iuC5iOC4reC4h+C5hOC4q+C4meC5gOC4nuC4tOC5iOC4h+C4luC4ueC4geC5gOC4leC4tOC4oeC4',
  'iOC4suC4geC4o+C4ueC4myAqLwoub2NyLWZpbGxlZHsKICBib3JkZXItY29sb3I6dmFyKC0tYnJhbmQpIWltcG9ydGFudDsKICBib3gtc2hhZG93OjAgMCAwIDNweCB2YXIoLS1icmFuZC1zb2Z0KSFpbXBvcnRhbnQ7CiAgYW5pbWF0aW9uOm9jclBvcCAuNHM7Cn0K',
  'QGtleWZyYW1lcyBvY3JQb3B7IDAle2JhY2tncm91bmQ6dmFyKC0tYnJhbmQtc29mdCl9IDEwMCV7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlKX0gfQoKLm9jci1ib3h7CiAgYm9yZGVyOjFweCBkYXNoZWQgdmFyKC0tYnJhbmQpO2JhY2tncm91bmQ6dmFyKC0tYnJh',
  'bmQtc29mdCk7CiAgYm9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTtwYWRkaW5nOjEycHg7bWFyZ2luLXRvcDoxMHB4Owp9Ci5vY3ItYm94IC5oZHtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo3cHg7Zm9udC1zaXplOjEyLjVweDtmb250LXdlaWdo',
  'dDo2MDA7Y29sb3I6dmFyKC0tYnJhbmQpO21hcmdpbi1ib3R0b206OXB4fQoub2NyLWJveCAuaGQgLnNwe21hcmdpbi1sZWZ0OmF1dG87ZGlzcGxheTpmbGV4O2dhcDo2cHh9Ci5vY3ItaGl0c3tkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2dhcDo2',
  'cHh9Ci5vY3ItaGl0ewogIGRpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjlweDtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpOwogIGJvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTtwYWRkaW5nOjdw',
  'eCAxMHB4O2ZvbnQtc2l6ZToxM3B4Owp9Ci5vY3ItaGl0IC5re2NvbG9yOnZhcigtLW11dGVkKTtmb250LXNpemU6MTEuNXB4O21pbi13aWR0aDo3OHB4fQoub2NyLWhpdCAudntmb250LXdlaWdodDo2MDA7ZmxleDoxO21pbi13aWR0aDowO292ZXJmbG93OmhpZGRl',
  'bjt0ZXh0LW92ZXJmbG93OmVsbGlwc2lzO3doaXRlLXNwYWNlOm5vd3JhcH0KLm9jci1yYXd7CiAgbWF4LWhlaWdodDoxNTBweDtvdmVyZmxvdzphdXRvO2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTsKICBib3Jk',
  'ZXItcmFkaXVzOnZhcigtLXItc20pO3BhZGRpbmc6OXB4IDExcHg7Zm9udC1zaXplOjEycHg7bGluZS1oZWlnaHQ6MS42NTsKICB3aGl0ZS1zcGFjZTpwcmUtd3JhcDtjb2xvcjp2YXIoLS1pbmstMik7bWFyZ2luLXRvcDo5cHg7Cn0KCkBtZWRpYSAobWF4LXdpZHRo',
  'OjUyMHB4KXsKICAuYXV0aC1jYXJke21heC13aWR0aDoxMDAlO3BhZGRpbmc6MjJweCAxOHB4IDE4cHh9CiAgLnRoZW1lLXBpY2t7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOjFmcn0KICAudGhlbWUtb3B0e2ZsZXgtZGlyZWN0aW9uOnJvdzt0ZXh0LWFsaWduOmxlZnQ7',
  'Z2FwOjExcHh9CiAgLnRoZW1lLW9wdCAuaGludHtkaXNwbGF5Om5vbmV9Cn0KCi8qID09PT09PT09PT09PSDguKPguLLguKLguIHguLLguKPguKLguYjguK3guKLguYPguJnguJrguLTguKUgKOC4i+C4t+C5ieC4reC4l+C4teC5gOC4lOC4teC4ouC4p+C4q+C4peC4',
  'suC4ouC4reC4ouC5iOC4suC4hykgPT09PT09PT09PT09ICovCi5saW5lc3tib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6dmFyKC0tci1zbSk7cGFkZGluZzoxMHB4O2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKX0KLmxpbmUtaGVh',
  'ZCwubGluZS1yb3d7CiAgZGlzcGxheTpncmlkO2dyaWQtdGVtcGxhdGUtY29sdW1uczptaW5tYXgoMCwxZnIpIDg0cHggOTJweCAxMDhweCA5NnB4IDM0cHg7CiAgZ2FwOjdweDthbGlnbi1pdGVtczpjZW50ZXI7Cn0KLmxpbmUtaGVhZHtmb250LXNpemU6MTEuNXB4',
  'O2NvbG9yOnZhcigtLW11dGVkKTtwYWRkaW5nOjAgMnB4IDZweDtmb250LXdlaWdodDo2MDB9Ci5saW5lLWhlYWQgLm51bSwubGluZS1yb3cgLm51bXt0ZXh0LWFsaWduOnJpZ2h0fQoubGluZS1yb3d7bWFyZ2luLWJvdHRvbTo2cHh9Ci5saW5lLXJvdyAuaW5we3Bh',
  'ZGRpbmc6NnB4IDlweDtmb250LXNpemU6MTNweH0KLmxpbmUtcm93IC5pbnAubnVte3RleHQtYWxpZ246cmlnaHQ7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zfQoubGluZS1zdW17CiAgdGV4dC1hbGlnbjpyaWdodDtmb250LXNpemU6MTNweDtmb250',
  'LXdlaWdodDo2MDA7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zOwogIGNvbG9yOnZhcigtLWluayk7d2hpdGUtc3BhY2U6bm93cmFwO292ZXJmbG93OmhpZGRlbjsKfQoubGluZS10b3RhbHttYXJnaW4tbGVmdDphdXRvO2ZvbnQtc2l6ZToxM3B4O2Nv',
  'bG9yOnZhcigtLW11dGVkKTtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXN9Ci5saW5lLXRvdGFsIGJ7Y29sb3I6dmFyKC0taW5rKX0KCi8qIOC4o+C4suC4ouC4geC4suC4o+C4ouC5iOC4reC4ouC4l+C4teC5iOC4geC4suC4h+C4lOC4ueC5g+C4meC4',
  'leC4suC4o+C4suC4hyAqLwouYmlsbC1saW5lc3ttYXJnaW4tdG9wOjZweDtib3JkZXItbGVmdDoycHggc29saWQgdmFyKC0tbGluZSk7cGFkZGluZy1sZWZ0OjlweH0KLmJpbGwtbGluZXsKICBkaXNwbGF5OmZsZXg7Z2FwOjhweDtmb250LXNpemU6MTJweDtjb2xv',
  'cjp2YXIoLS1pbmstMik7cGFkZGluZzoxcHggMDsKICBmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7Cn0KLmJpbGwtbGluZSAubm17ZmxleDoxO21pbi13aWR0aDowO292ZXJmbG93OmhpZGRlbjt0ZXh0LW92ZXJmbG93OmVsbGlwc2lzO3doaXRlLXNw',
  'YWNlOm5vd3JhcH0KLmJpbGwtbGluZSAucXR7Y29sb3I6dmFyKC0tZmFpbnQpO3doaXRlLXNwYWNlOm5vd3JhcH0KLmJpbGwtbGluZSAudHR7d2hpdGUtc3BhY2U6bm93cmFwO2ZvbnQtd2VpZ2h0OjYwMH0KLmJpbGwtZXh0cmF7Zm9udC1zaXplOjExLjVweDtjb2xv',
  'cjp2YXIoLS1tdXRlZCk7bWFyZ2luLXRvcDozcHh9Ci5iaWxsLXRvZ2dsZXsKICBiYWNrZ3JvdW5kOjA7Ym9yZGVyOjA7cGFkZGluZzowO21hcmdpbi10b3A6M3B4O2N1cnNvcjpwb2ludGVyO2ZvbnQ6aW5oZXJpdDsKICBmb250LXNpemU6MTEuNXB4O2NvbG9yOnZh',
  'cigtLWJyYW5kKTt0ZXh0LWFsaWduOmxlZnQ7Cn0KLmJpbGwtdG9nZ2xlOmhvdmVye3RleHQtZGVjb3JhdGlvbjp1bmRlcmxpbmV9CgpAbWVkaWEgKG1heC13aWR0aDo2NDBweCl7CiAgLyog4LiI4Lit4LmB4LiE4LiaOiDguIrguLfguYjguK3guKrguLTguJnguITg',
  'uYnguLLguK3guKLguLnguYjguJrguKPguKPguJfguLHguJTguJrguJkg4Liq4LmI4Lin4LiZ4LiI4Liz4LiZ4Lin4LiZL+C4q+C4meC5iOC4p+C4oi/guKPguLLguITguLIv4Lij4Lin4LihIOC4reC4ouC4ueC5iOC4muC4o+C4o+C4l+C4seC4lOC5gOC4lOC4teC4',
  'ouC4p+C4geC4seC4meC4guC5ieC4suC4h+C4peC5iOC4suC4hwogICAgIOC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC4geC4tOC4meC4nuC4t+C5ieC4meC4l+C4teC5iOC5geC4meC4p+C4leC4seC5ieC4h+C4iOC4meC4leC5ieC4reC4h+C5gOC4peC4t+C5iOC4',
  'reC4meC4iOC4reC4ouC4suC4p+C5gOC4p+C4peC4suC4i+C4t+C5ieC4reC4guC4reC4h+C4q+C4peC4suC4ouC4reC4ouC5iOC4suC4hyAqLwogIC5saW5lc3twYWRkaW5nOjhweH0KICAubGluZS1oZWFke2Rpc3BsYXk6bm9uZX0KICAubGluZS1yb3d7CiAgICBn',
  'cmlkLXRlbXBsYXRlLWNvbHVtbnM6NTZweCBtaW5tYXgoMCwxZnIpIDcycHggbWlubWF4KDAsODZweCk7CiAgICBncmlkLXRlbXBsYXRlLWFyZWFzOiduYW1lIG5hbWUgbmFtZSBkZWwnICdxdHkgdW5pdCBwcmljZSBzdW0nOwogICAgZ2FwOjVweDtwYWRkaW5nOjhw',
  'eDttYXJnaW4tYm90dG9tOjhweDsKICAgIGJvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpOwogIH0KICAubGluZS1yb3cgLmlucDpudGgtb2YtdHlwZSgxKXtncmlkLWFy',
  'ZWE6bmFtZX0KICAubGluZS1yb3cgLmlucDpudGgtb2YtdHlwZSgyKXtncmlkLWFyZWE6cXR5O3RleHQtYWxpZ246Y2VudGVyfQogIC5saW5lLXJvdyAuaW5wOm50aC1vZi10eXBlKDMpe2dyaWQtYXJlYTp1bml0fQogIC5saW5lLXJvdyAuaW5wOm50aC1vZi10eXBl',
  'KDQpe2dyaWQtYXJlYTpwcmljZX0KICAubGluZS1yb3cgLmxpbmUtc3Vte2dyaWQtYXJlYTpzdW07YWxpZ24tc2VsZjpjZW50ZXI7Zm9udC1zaXplOjEyLjVweH0KICAubGluZS1yb3cgLmJ0bntncmlkLWFyZWE6ZGVsO2FsaWduLXNlbGY6c3RhcnQ7anVzdGlmeS1z',
  'ZWxmOmVuZDt3aWR0aDozNHB4O3BhZGRpbmc6NnB4IDB9CiAgLmxpbmUtcm93IC5pbnB7cGFkZGluZzo2cHggN3B4O2ZvbnQtc2l6ZToxMi41cHh9CiAgLmxpbmUtdG90YWx7d2lkdGg6MTAwJTttYXJnaW46NnB4IDAgMDt0ZXh0LWFsaWduOnJpZ2h0fQp9CgovKiA9',
  'PT09PT09PT09PT0g4LiV4Lix4Lin4Lia4Lit4LiB4Liq4LiW4Liy4LiZ4Liw4LiB4Liy4Lij4LiL4Li04LiH4LiB4LmMICjguKHguLjguKHguILguKfguLLguJrguJkpID09PT09PT09PT09PQogICDguYDguIfguLXguKLguJrguYDguKHguLfguYjguK3guJfguLjg',
  'uIHguK3guKLguYjguLLguIfguJvguIHguJXguLQg4LiK4Lix4LiU4LmA4LiI4LiZ4LmA4Lih4Li34LmI4Lit4Lih4Li14Lit4Liw4LmE4Lij4LiV4LmJ4Lit4LiH4LiI4Lix4LiU4LiB4Liy4LijCiAgIOC4leC4seC4p+C4l+C4teC5iOC4geC4lOC5hOC4lOC5ieC4',
  'iOC4sOC4ouC4geC4guC4tuC5ieC4meC5gOC4peC5h+C4geC4meC5ieC4reC4ouC4leC4reC4meC5gOC4reC4suC5gOC4oeC4suC4quC5jOC4iuC4teC5iSDguYPguKvguYnguKPguLnguYnguKfguYjguLLguIHguJTguYTguJTguYkKLS0tLS0tLS0tLS0tLS0tLS0t',
  'LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi8KLnN5bmMtcGlsbHsKICB0cmFuc2l0aW9uOmJhY2tncm91bmQgLjE1cyxjb2xvciAuMTVzOwogIHdoaXRlLXNwYWNlOm5vd3JhcDtsaW5lLWhlaWdodDoxLjc7Cn0KLnN5bmMtcGlsbCAuc3Bp',
  'bnt3aWR0aDoxMXB4O2hlaWdodDoxMXB4O2JvcmRlci13aWR0aDoycHg7dmVydGljYWwtYWxpZ246LTFweH0KYnV0dG9uLnN5bmMtcGlsbHtwYWRkaW5nOjJweCAxMHB4fQpidXR0b24uc3luYy1waWxsOmhvdmVye2ZpbHRlcjpicmlnaHRuZXNzKC45NCl9CmJ1dHRv',
  'bi5zeW5jLXBpbGw6YWN0aXZle3RyYW5zZm9ybTp0cmFuc2xhdGVZKDFweCl9Ci8qIOC4quC4luC4suC4meC4sOC4l+C4teC5iOC4leC5ieC4reC4h+C5g+C4q+C5ieC4nOC4ueC5ieC5g+C4iuC5ieC4iOC4seC4lOC4geC4suC4oyDguIHguLDguJ7guKPguLTguJrg',
  'uYDguJrguLIg4LmGIOC5g+C4q+C5ieC4quC4seC4h+C5gOC4geC4leC5gOC4q+C5h+C4mSDguYHguJXguYjguYTguKHguYjguKPguJrguIHguKfguJnguKrguLLguKLguJXguLIgKi8KLnN5bmMtcGlsbC53YXJuLC5zeW5jLXBpbGwuZGdye2FuaW1hdGlvbjpzeW5j',
  'TnVkZ2UgMi40cyBlYXNlLWluLW91dCBpbmZpbml0ZX0KQGtleWZyYW1lcyBzeW5jTnVkZ2V7MCUsODglLDEwMCV7b3BhY2l0eToxfTk0JXtvcGFjaXR5Oi41NX19CkBtZWRpYSAocHJlZmVycy1yZWR1Y2VkLW1vdGlvbjpyZWR1Y2UpewogIC5zeW5jLXBpbGwud2Fy',
  'biwuc3luYy1waWxsLmRncnthbmltYXRpb246bm9uZX0KfQpAbWVkaWEgKG1heC13aWR0aDo3MjBweCl7CiAgLyog4LiI4Lit4LmB4LiE4LiaOiDguYDguKvguKXguLfguK3guYHguJXguYjguYTguK3guITguK3guJnguKvguKPguLfguK3guKfguIfguKvguKHguLjg',
  'uJkg4Lib4Lij4Liw4Lir4Lii4Lix4LiU4LiX4Li14LmI4Lia4LiZ4LmB4LiW4Lia4Lir4Lix4LinCiAgICAg4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Lii4Lix4LiH4Lit4LmI4Liy4LiZ4LmE4LiU4LmJ4LiI4Liy4LiB4LiB4Liy4Lij4LmB4LiV4Liw4LiE4LmJ4Liy',
  '4LiHICh0aXRsZSkgKi8KICAuc3luYy1waWxsIC5zeW5jLWxhYmVse2Rpc3BsYXk6bm9uZX0KICAuc3luYy1waWxse3BhZGRpbmc6M3B4IDhweDtmb250LXNpemU6MTNweH0KfQoKLyogPT09PT09PT09PT09IOC4geC4o+C4sOC4lOC4tOC5iOC4h+C5geC4iOC5ieC4',
  'h+C5gOC4leC4t+C4reC4mSArIOC4geC4peC5iOC4reC4h+C4o+C4suC4ouC4geC4suC4oyA9PT09PT09PT09PT0gKi8KLmJlbGwtd3JhcHtwb3NpdGlvbjpyZWxhdGl2ZTtkaXNwbGF5OmlubGluZS1mbGV4fQouYnRuLmJlbGx7cG9zaXRpb246cmVsYXRpdmU7Zm9u',
  'dC1zaXplOjE1cHg7bGluZS1oZWlnaHQ6MX0KLmJlbGwtZG90ewogIHBvc2l0aW9uOmFic29sdXRlO3RvcDotNXB4O3JpZ2h0Oi01cHg7bWluLXdpZHRoOjE3cHg7aGVpZ2h0OjE3cHg7cGFkZGluZzowIDRweDsKICBiYWNrZ3JvdW5kOnZhcigtLXdhcm4pO2NvbG9y',
  'OiNmZmY7Ym9yZGVyLXJhZGl1czo5OXB4OwogIGZvbnQtc2l6ZToxMC41cHg7Zm9udC13ZWlnaHQ6NzAwO2xpbmUtaGVpZ2h0OjE3cHg7dGV4dC1hbGlnbjpjZW50ZXI7CiAgYm94LXNoYWRvdzowIDAgMCAycHggdmFyKC0tc3VyZmFjZSk7Zm9udC12YXJpYW50LW51',
  'bWVyaWM6dGFidWxhci1udW1zOwp9Ci5iZWxsLWRvdC51cmdlbnR7YmFja2dyb3VuZDp2YXIoLS1kYW5nZXIpfQoKLm5vdGlmewogIHBvc2l0aW9uOmFic29sdXRlO3RvcDpjYWxjKDEwMCUgKyA4cHgpO3JpZ2h0OjA7ei1pbmRleDo3MDsKICB3aWR0aDptaW4oMzgw',
  'cHgsY2FsYygxMDB2dyAtIDMycHgpKTsKICBiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpO2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czp2YXIoLS1yKTsKICBib3gtc2hhZG93OnZhcigtLXNoLWxnKTtvdmVyZmxvdzpoaWRkZW47YW5p',
  'bWF0aW9uOnBvcCAuMTRzIGVhc2Utb3V0Owp9Ci5ub3RpZi1oewogIGRpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjhweDtwYWRkaW5nOjExcHggMTRweDsKICBib3JkZXItYm90dG9tOjFweCBzb2xpZCB2YXIoLS1saW5lLTIpO2ZvbnQtc2l6ZTox',
  'NHB4Owp9Ci5ub3RpZi1oIC5zcHttYXJnaW4tbGVmdDphdXRvO2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjdweH0KLm5vdGlmLWxpc3R7bWF4LWhlaWdodDptaW4oNjB2aCw0NDBweCk7b3ZlcmZsb3cteTphdXRvfQoubm90aWYtc2VjewogIHBh',
  'ZGRpbmc6OXB4IDE0cHggNHB4O2ZvbnQtc2l6ZToxMS41cHg7Zm9udC13ZWlnaHQ6NjAwO2NvbG9yOnZhcigtLW11dGVkKTsKICBiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7cG9zaXRpb246c3RpY2t5O3RvcDowOwp9Ci5ub3RpZi1pdGVtewogIGRpc3BsYXk6',
  'YmxvY2s7d2lkdGg6MTAwJTt0ZXh0LWFsaWduOmxlZnQ7YmFja2dyb3VuZDowO2JvcmRlcjowO2N1cnNvcjpwb2ludGVyOwogIHBhZGRpbmc6OXB4IDE0cHggOXB4IDE3cHg7Ym9yZGVyLWxlZnQ6M3B4IHNvbGlkIHRyYW5zcGFyZW50O2ZvbnQ6aW5oZXJpdDtjb2xv',
  'cjppbmhlcml0OwogIGJvcmRlci1ib3R0b206MXB4IHNvbGlkIHZhcigtLWxpbmUtMik7Cn0KLm5vdGlmLWl0ZW06aG92ZXJ7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpfQoubm90aWYtaXRlbSAudHR7Zm9udC1zaXplOjEzcHg7Zm9udC13ZWlnaHQ6NTAwO2Nv',
  'bG9yOnZhcigtLWluayk7bGluZS1oZWlnaHQ6MS40NX0KLm5vdGlmLWl0ZW0gLmRke2ZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0tbXV0ZWQpO21hcmdpbi10b3A6MnB4O2xpbmUtaGVpZ2h0OjEuNX0KLm5vdGlmLWl0ZW0ubC1kYW5nZXJ7Ym9yZGVyLWxlZnQt',
  'Y29sb3I6dmFyKC0tZGFuZ2VyKX0KLm5vdGlmLWl0ZW0ubC13YXJue2JvcmRlci1sZWZ0LWNvbG9yOnZhcigtLXdhcm4pfQoubm90aWYtaXRlbS5sLWluZm97Ym9yZGVyLWxlZnQtY29sb3I6dmFyKC0taW5mbyl9Ci5ub3RpZi1tb3JlewogIGRpc3BsYXk6YmxvY2s7',
  'd2lkdGg6MTAwJTt0ZXh0LWFsaWduOmxlZnQ7cGFkZGluZzo3cHggMTRweCA5cHggMTdweDsKICBiYWNrZ3JvdW5kOjA7Ym9yZGVyOjA7Y3Vyc29yOnBvaW50ZXI7Zm9udDppbmhlcml0O2ZvbnQtc2l6ZToxMnB4O2NvbG9yOnZhcigtLWJyYW5kKTsKICBib3JkZXIt',
  'Ym90dG9tOjFweCBzb2xpZCB2YXIoLS1saW5lLTIpOwp9Ci5ub3RpZi1tb3JlOmhvdmVye3RleHQtZGVjb3JhdGlvbjp1bmRlcmxpbmV9Ci5ub3RpZi1lbXB0eXtwYWRkaW5nOjI2cHggMTZweDt0ZXh0LWFsaWduOmNlbnRlcjtjb2xvcjp2YXIoLS1tdXRlZCk7Zm9u',
  'dC1zaXplOjEzLjVweDtsaW5lLWhlaWdodDoxLjd9Ci5ub3RpZi1lbXB0eSAuYmlne2ZvbnQtc2l6ZTozMHB4O21hcmdpbi1ib3R0b206NnB4fQoubm90aWYtZnsKICBwYWRkaW5nOjlweCAxNHB4O2JvcmRlci10b3A6MXB4IHNvbGlkIHZhcigtLWxpbmUtMik7CiAg',
  'Zm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1mYWludCk7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpOwp9CgovKiDguJXguLHguKfguYDguKXguILguJrguJnguYDguKHguJnguLnguIvguYnguLLguKIg4oCUIOC5g+C4q+C5ieC5gOC4lOC5iOC4meC4guC4',
  'tuC5ieC4meC5gOC4oeC4t+C5iOC4reC4oeC4teC4h+C4suC4meC4hOC5ieC4suC4hyAqLwoubmF2LWl0ZW0gLmJhZGdlewogIGJhY2tncm91bmQ6dmFyKC0td2Fybik7Y29sb3I6I2ZmZjtmb250LXdlaWdodDo3MDA7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxh',
  'ci1udW1zOwp9Ci5uYXYtaXRlbS5vbiAuYmFkZ2V7YmFja2dyb3VuZDpyZ2JhKDI1NSwyNTUsMjU1LC4yOCk7Y29sb3I6I2ZmZn0KLyog4LmA4Lir4LmH4LiZ4LmB4Lil4LmJ4LinOiDguKLguLHguIfguJrguK3guIHguIjguLPguJnguKfguJnguIfguLLguJnguITg',
  'uYnguLLguIcg4LmB4LiV4LmI4LiI4Liy4LiH4Lil4LiHIOC5hOC4oeC5iOC5gOC4o+C4teC4ouC4geC4o+C5ieC4reC4h+C4hOC4p+C4suC4oeC4quC4meC5g+C4iOC5gOC4l+C5iOC4suC5gOC4o+C4t+C5iOC4reC4h+C5g+C4q+C4oeC5iCAqLwoubmF2LWl0ZW0g',
  'LmJhZGdlLnNlZW57YmFja2dyb3VuZDpyZ2JhKDI1NSwyNTUsMjU1LC4xMik7Y29sb3I6dmFyKC0tbmF2LWluayk7Zm9udC13ZWlnaHQ6NjAwfQoubmF2LWl0ZW0ub24gLmJhZGdlLnNlZW57YmFja2dyb3VuZDpyZ2JhKDI1NSwyNTUsMjU1LC4yKTtjb2xvcjojZmZm',
  'fQoudGFiIC5iYWRnZS5zZWVue2JhY2tncm91bmQ6dmFyKC0tbGluZSk7Y29sb3I6dmFyKC0tbXV0ZWQpfQovKiDguKPguLLguKLguIHguLLguKPguJfguLXguYjguYDguJ7guLTguYjguIfguYDguILguYnguLLguKHguLLguJXguLHguYnguIfguYHguJXguYjguYDg',
  'uJvguLTguJTguJTguLnguITguKPguLHguYnguIfguIHguYjguK3guJkgKi8KLm5vdGlmLWl0ZW0uaXMtbmV3e2JhY2tncm91bmQ6dmFyKC0tYnJhbmQtc29mdCl9Ci5ub3RpZi1pdGVtLmlzLW5ldzpob3ZlcntiYWNrZ3JvdW5kOnZhcigtLWJyYW5kLXNvZnQpO2Zp',
  'bHRlcjpicmlnaHRuZXNzKC45OCl9Ci5uZXctZG90e2Rpc3BsYXk6aW5saW5lLWJsb2NrO3dpZHRoOjdweDtoZWlnaHQ6N3B4O2JvcmRlci1yYWRpdXM6OTlweDtiYWNrZ3JvdW5kOnZhcigtLWJyYW5kKTttYXJnaW4tcmlnaHQ6NnB4O3ZlcnRpY2FsLWFsaWduOjFw',
  'eH0KCkBtZWRpYSAobWF4LXdpZHRoOjcyMHB4KXsKICAubm90aWZ7CiAgICBwb3NpdGlvbjpmaXhlZDt0b3A6YXV0bztsZWZ0OjhweDtyaWdodDo4cHg7Ym90dG9tOjhweDt3aWR0aDphdXRvOwogICAgbWF4LWhlaWdodDo3MnZoO2Rpc3BsYXk6ZmxleDtmbGV4LWRp',
  'cmVjdGlvbjpjb2x1bW47CiAgfQogIC5ub3RpZi1saXN0e2ZsZXg6MTttYXgtaGVpZ2h0Om5vbmV9Cn0KCi8qID09PT09PT09PT09PSDguYDguIrguYfguITguKXguLTguKrguJXguYzguIfguLLguJnguIvguYjguK3guKEgPT09PT09PT09PT09ICovCi8qIC0tLS0g',
  '4LmD4LiZ4Lif4Lit4Lij4LmM4LihIC0tLS0gKi8KLnRvZG97Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXItc20pO3BhZGRpbmc6MTBweDtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMil9Ci50b2RvLXJvd3sKICBkaXNw',
  'bGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOjMwcHggbWlubWF4KDAsMWZyKSAxOTBweCAzNHB4OwogIGdhcDo3cHg7YWxpZ24taXRlbXM6Y2VudGVyO21hcmdpbi1ib3R0b206NnB4Owp9Ci50b2RvLXJvdyAuaW5wLC50b2RvLXJvdyAuc2Vse3BhZGRpbmc6',
  'NnB4IDlweDtmb250LXNpemU6MTNweH0KLnRvZG8tcm93LmRvbmUgLmlucHt0ZXh0LWRlY29yYXRpb246bGluZS10aHJvdWdoO2NvbG9yOnZhcigtLW11dGVkKX0KLnRvZG8tY2hlY2t7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRl',
  'bnQ6Y2VudGVyO2N1cnNvcjpwb2ludGVyfQoudG9kby1jaGVjayBpbnB1dHt3aWR0aDoxN3B4O2hlaWdodDoxN3B4O2N1cnNvcjpwb2ludGVyO2FjY2VudC1jb2xvcjp2YXIoLS1vayl9Ci50b2RvLWNvdW50e21hcmdpbi1sZWZ0OmF1dG87Zm9udC1zaXplOjEzcHg7',
  'Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtc30KLnRvZG8tY291bnQgYntjb2xvcjp2YXIoLS1pbmspfQoKLyogLS0tLSDguYPguJnguJXguLLguKPguLLguIfguKPguLLguKLguIHguLLguKMgKOC4leC4tOC5iuC4geC5',
  'hOC4lOC5ieC4iOC4o+C4tOC4hykgLS0tLSAqLwoudG9kby12aWV3e2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47Z2FwOjJweH0KLnRvZG8tYmFye2hlaWdodDo1cHg7Ym9yZGVyLXJhZGl1czo5OXB4O2JhY2tncm91bmQ6dmFyKC0tbGluZS0yKTtv',
  'dmVyZmxvdzpoaWRkZW47bWFyZ2luLWJvdHRvbToycHh9Ci50b2RvLWJhcj5pe2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjEwMCU7Ym9yZGVyLXJhZGl1czo5OXB4O2JhY2tncm91bmQ6dmFyKC0tb2spO3RyYW5zaXRpb246d2lkdGggLjM1cyBlYXNlfQoudG9kby1tZXRh',
  'e2ZvbnQtc2l6ZToxMXB4O2NvbG9yOnZhcigtLW11dGVkKTtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7bWFyZ2luLWJvdHRvbTozcHh9Ci50b2RvLW1ldGEgYntjb2xvcjp2YXIoLS1pbmspfQoudG9kby1saW5lewogIGRpc3BsYXk6ZmxleDthbGln',
  'bi1pdGVtczpmbGV4LXN0YXJ0O2dhcDo3cHg7Zm9udC1zaXplOjEzcHg7bGluZS1oZWlnaHQ6MS41OwogIHBhZGRpbmc6MnB4IDA7Y3Vyc29yOnBvaW50ZXI7Cn0KLnRvZG8tbGluZSBpbnB1dHttYXJnaW4tdG9wOjJweDt3aWR0aDoxNXB4O2hlaWdodDoxNXB4O2Zs',
  'ZXg6bm9uZTtjdXJzb3I6cG9pbnRlcjthY2NlbnQtY29sb3I6dmFyKC0tb2spfQoudG9kby1saW5lIC5ubXtmbGV4OjE7bWluLXdpZHRoOjA7Y29sb3I6dmFyKC0taW5rKX0KLnRvZG8tbGluZSAuY2F0e2ZsZXg6bm9uZTtmb250LXNpemU6MTAuNXB4O3BhZGRpbmc6',
  'MXB4IDdweH0KLnRvZG8tbGluZS5kb25lIC5ubXt0ZXh0LWRlY29yYXRpb246bGluZS10aHJvdWdoO2NvbG9yOnZhcigtLWZhaW50KX0KLnRvZG8tbGluZS5sb2NrZWR7Y3Vyc29yOmRlZmF1bHR9Ci50b2RvLWxpbmU6bm90KC5sb2NrZWQpOmhvdmVyIC5ubXtjb2xv',
  'cjp2YXIoLS1icmFuZCl9CgpAbWVkaWEgKG1heC13aWR0aDo2NDBweCl7CiAgLnRvZG8tcm93ewogICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOjMwcHggbWlubWF4KDAsMWZyKSAzNHB4OwogICAgZ3JpZC10ZW1wbGF0ZS1hcmVhczonY2hrIG5hbWUgZGVsJyAnLiBj',
  'YXQgY2F0JzsKICAgIHBhZGRpbmc6OHB4O2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTsKICAgIGJhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7bWFyZ2luLWJvdHRvbTo4cHg7CiAgfQogIC50b2RvLWNoZWNre2dy',
  'aWQtYXJlYTpjaGs7YWxpZ24tc2VsZjpzdGFydDtwYWRkaW5nLXRvcDo1cHh9CiAgLnRvZG8tcm93IC5pbnB7Z3JpZC1hcmVhOm5hbWV9CiAgLnRvZG8tcm93IC5zZWx7Z3JpZC1hcmVhOmNhdDt3aWR0aDoxMDAlfQogIC50b2RvLXJvdyAuYnRue2dyaWQtYXJlYTpk',
  'ZWw7YWxpZ24tc2VsZjpzdGFydDtqdXN0aWZ5LXNlbGY6ZW5kO3dpZHRoOjM0cHg7cGFkZGluZzo2cHggMH0KICAudG9kby1jb3VudHt3aWR0aDoxMDAlO21hcmdpbjo2cHggMCAwO3RleHQtYWxpZ246cmlnaHR9Cn0KCgovKiA9PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4LiI4Lit4LmB4LiE4LiaICjguKHguLfguK3guJbguLfguK0gLyDguYHguJfguYfguJrguYDguKXguYfguJXguYHguJnguKfguJXguLHguYnguIcpCiAgID09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguYTguKHguYjguYTguJTguYnguYHguKLguIHguYTguJ/guKXguYzguKvguKPguLfguK3guYHguKLguIHguYDguJfguKHguYDguJ7guKXguJXguKrguLPguKvguKPg',
  'uLHguJrguKHguLfguK3guJbguLfguK0g4oCUIEhUTUwg4LiK4Li44LiU4LmA4LiU4Li14Lii4Lin4LiB4Lix4LiZ4LiX4Lix4LmJ4LiH4Lir4Lih4LiUCiAgIOC4leC4o+C4h+C4meC4teC5ieC5gOC4m+C4peC4teC5iOC4ouC4meC5geC4hOC5iCAi4Lin4Liy4LiH',
  '4LiV4Lij4LiH4LmE4Lir4LiZIiDguILguYnguK3guKHguLnguKUg4Lib4Li44LmI4LihIOC4leC4o+C4o+C4geC4sCDguYPguIrguYnguKPguYjguKfguKHguIHguLHguJnguKvguKHguJQKICAg4Lii4LmI4LitLeC4guC4ouC4suC4ouC4q+C4meC5ieC4suC4leC5',
  'iOC4suC4h+C4muC4meC4hOC4reC4oeC4geC5h+C4quC4peC4seC4muC5hOC4lOC5ieC4l+C4seC4meC4l+C4tSDguYHguKXguLDguYDguJ7guLTguYjguKHguJ/guLXguYDguIjguK3guKPguYzguITguKPguLHguYnguIfguYDguJTguLXguKLguKfguYTguJTguYng',
  'uJfguLHguYnguIfguKrguK3guIfguYHguJrguJoKLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovCkBtZWRpYSAobWF4LXdpZHRoOjc2MHB4KXsKCiAgLyogLS0tLSDguYHguJbguJrguKXg',
  'uYjguLLguIc6IOC4m+C4uOC5iOC4oeC4reC4ouC4ueC5iOC4o+C4sOC4lOC4seC4muC4meC4tOC5ieC4p+C5guC4m+C5ieC4hyDguYTguKHguYjguJXguYnguK3guIfguYDguK3guLfguYnguK3guKHguYTguJvguKHguLjguKHguIvguYnguLLguKLguJrguJkgLS0t',
  'LSAqLwogIC50YWJiYXJ7CiAgICBkaXNwbGF5OmZsZXg7cG9zaXRpb246Zml4ZWQ7bGVmdDowO3JpZ2h0OjA7Ym90dG9tOjA7ei1pbmRleDo1MDsKICAgIGJhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7Ym9yZGVyLXRvcDoxcHggc29saWQgdmFyKC0tbGluZSk7CiAg',
  'ICBwYWRkaW5nLWJvdHRvbTplbnYoc2FmZS1hcmVhLWluc2V0LWJvdHRvbSk7CiAgICBib3gtc2hhZG93OjAgLTJweCAxNHB4IHJnYmEoMTUsMjMsNDEsLjA3KTsKICB9CiAgLnRhYnsKICAgIGZsZXg6MSAxIDA7bWluLXdpZHRoOjA7bWluLWhlaWdodDo1NHB4O3Bh',
  'ZGRpbmc6N3B4IDJweCA2cHg7CiAgICBkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO2dhcDozcHg7CiAgICBib3JkZXI6MDtiYWNrZ3JvdW5kOjA7Y3Vyc29yOnBvaW50ZXI7',
  'Y29sb3I6dmFyKC0tbXV0ZWQpOwogICAgZm9udC1zaXplOjEwLjVweDtsaW5lLWhlaWdodDoxLjI7cG9zaXRpb246cmVsYXRpdmU7CiAgfQogIC50YWIgLmlje2ZvbnQtc2l6ZToxOHB4O2xpbmUtaGVpZ2h0OjF9CiAgLnRhYiAudGx7bWF4LXdpZHRoOjEwMCU7b3Zl',
  'cmZsb3c6aGlkZGVuO3RleHQtb3ZlcmZsb3c6ZWxsaXBzaXM7d2hpdGUtc3BhY2U6bm93cmFwfQogIC50YWIub257Y29sb3I6dmFyKC0tYnJhbmQpO2ZvbnQtd2VpZ2h0OjcwMH0KICAudGFiLm9uIC5pY3t0cmFuc2Zvcm06dHJhbnNsYXRlWSgtMXB4KX0KICAudGFi',
  'IC5iYWRnZXsKICAgIHBvc2l0aW9uOmFic29sdXRlO3RvcDozcHg7bGVmdDo1MCU7bWFyZ2luLWxlZnQ6M3B4OwogICAgYmFja2dyb3VuZDp2YXIoLS13YXJuKTtjb2xvcjojZmZmO2JvcmRlci1yYWRpdXM6OTlweDsKICAgIG1pbi13aWR0aDoxNnB4O2hlaWdodDox',
  'NnB4O3BhZGRpbmc6MCA0cHg7CiAgICBmb250LXNpemU6MTBweDtsaW5lLWhlaWdodDoxNnB4O2ZvbnQtd2VpZ2h0OjcwMDt0ZXh0LWFsaWduOmNlbnRlcjsKICAgIGJveC1zaGFkb3c6MCAwIDAgMnB4IHZhcigtLXN1cmZhY2UpOwogIH0KICAvKiDguYDguKfguYng',
  'uJnguJfguLXguYjguYPguKvguYnguYHguJbguJrguKXguYjguLLguIcg4LmE4Lih4LmI4LmD4Lir4LmJ4LiX4Lix4Lia4LmA4LiZ4Li34LmJ4Lit4Lir4Liy4Lia4Lij4Lij4LiX4Lix4LiU4Liq4Li44LiU4LiX4LmJ4Liy4LiiICovCiAgLmNvbnRlbnR7cGFkZGlu',
  'ZzoxNHB4IDE0cHggY2FsYyg3NHB4ICsgZW52KHNhZmUtYXJlYS1pbnNldC1ib3R0b20pKX0KICAudGFiYmFyIH4gLm92LC5uYXZ7ei1pbmRleDo2MH0KCiAgLyogLS0tLSDguYHguJbguJrguKvguLHguKc6IDIg4LmB4LiW4Lin4Lie4Lit4LiU4Li1IOC5geC4muC4',
  'muC5geC4reC4m+C4oeC4t+C4reC4luC4t+C4reC4l+C4seC5iOC4p+C5hOC4myAoR21haWwsIExJTkUsIEdvb2dsZSBEcml2ZSkgLS0tLQogICAgIOC5geC4luC4pyAxOiDimLAg4LiK4Li34LmI4Lit4Lir4LiZ4LmJ4LiyIC4uLi4uLi4uIOC4quC4luC4suC4meC4',
  'sCDwn5SUIPCfjJcg4oa7CiAgICAg4LmB4LiW4LinIDI6IFsg4LiE4LmJ4LiZ4Lir4Liy4LiX4Lix4LmJ4LiH4Lij4Liw4Lia4LiaIC4uLi4uLi4uLi4uLiBdIFsg4Lib4Li1IF0KICAgICDguYTguKHguYjguYHguJXguLAgSFRNTCDigJQg4Lib4Lil4LmI4Lit4Lii',
  '4Lib4Li44LmI4Lih4LmD4LiZIC50b3AtcmlnaHQg4Lit4Lit4LiB4Lih4Liy4LmA4Lij4Li14Lii4LiH4LmD4LiZ4LmB4LiW4Lia4Lir4Lix4Lin4LmC4LiU4Lii4LiV4Lij4LiHIOC5geC4peC5ieC4p+C4iOC4seC4lOC4peC4s+C4lOC4seC4muC4lOC5ieC4p+C4',
  'oiBvcmRlciAqLwogIC50b3B7cGFkZGluZzo2cHggMTJweCA4cHg7Z2FwOjZweDtyb3ctZ2FwOjdweH0KICAudG9wIGgxe2ZvbnQtc2l6ZToxNnB4O3doaXRlLXNwYWNlOm5vd3JhcDtvdmVyZmxvdzpoaWRkZW47dGV4dC1vdmVyZmxvdzplbGxpcHNpc30KICAudG9w',
  'IC5zdWJ7ZGlzcGxheTpub25lfSAgICAgICAgICAvKiDguITguLPguK3guJjguLTguJrguLLguKLguKvguJnguYnguLLguYTguJvguK3guKLguLnguYjguYPguJnguYDguKHguJnguLnguILguYnguLLguIfguYHguKXguYnguKcg4LmE4Lih4LmI4LiV4LmJ4Lit4LiH',
  '4LiL4LmJ4LizICovCiAgLnRvcC1yaWdodHtkaXNwbGF5OmNvbnRlbnRzfQogIC50b3AgPiAuYnVyZ2Vye29yZGVyOjF9CiAgLnRvcCA+IGRpdjpub3QoLnRvcC1yaWdodCl7b3JkZXI6MjtmbGV4OjEgMSAwO21pbi13aWR0aDowfQogIC50b3AtcmlnaHQgPiAqe29y',
  'ZGVyOjZ9CiAgI2xpdmVEb3QsI3NhdmVTdGF0ZXtvcmRlcjozfQogICNiZWxsV3JhcHtvcmRlcjo0fQogICN0aGVtZUJ0bntvcmRlcjo1fQogIC50b3A6OmFmdGVye2NvbnRlbnQ6Jyc7b3JkZXI6NztmbGV4LWJhc2lzOjEwMCU7aGVpZ2h0OjB9ICAgLyog4LiC4Li2',
  '4LmJ4LiZ4Lia4Lij4Lij4LiX4Lix4LiU4LmD4Lir4Lih4LmI4LiV4Lij4LiH4LiZ4Li14LmJICovCiAgLnRvcC1yaWdodCAjc2VhcmNoQm94e29yZGVyOjg7ZmxleDoxIDEgMDt3aWR0aDphdXRvIWltcG9ydGFudDttaW4td2lkdGg6MH0KICAudG9wLXJpZ2h0ICN5',
  'ZWFyU2Vse29yZGVyOjk7ZmxleDowIDAgYXV0bzttYXgtd2lkdGg6NDB2dzt3aWR0aDphdXRvfQogIC5idXJnZXJ7cGFkZGluZzo3cHggMTBweH0KICAvKiDguIrguYjguK3guIfguIHguKPguK3guIHguJrguJnguYHguJbguJrguKvguLHguKfguYDguJXguLXguYng',
  'uKLguKXguIcg4LmB4LiV4LmI4Lii4Lix4LiH4LiE4LiHIDE2cHgg4LiB4Lix4LiZIGlPUyDguIvguLnguKHguYDguK3guIcgKi8KICAudG9wIC5pbnAsLnRvcCAuc2Vse3BhZGRpbmc6NnB4IDEwcHh9CiAgLnRvcCAuYnRuLmljb257cGFkZGluZzo2cHggOXB4fQoK',
  'ICAvKiAtLS0tIOC4leC4seC4p+C5gOC4peC4guC4quC4o+C4uOC4mzogMiDguIrguYjguK3guIfguJXguYjguK3guYHguJbguKcg4LmE4Lih4LmI4LmD4LiK4LmI4LiK4LmI4Lit4LiH4LmA4LiU4Li14Lii4Lin4LiI4LiZ4LiB4Li04LiZ4LiX4Lix4LmJ4LiH4LiI',
  '4LitIC0tLS0gKi8KICAuZzQsLmcze2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoMixtaW5tYXgoMCwxZnIpKX0KICAuZzJ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOjFmcn0KICAua3Bpe3BhZGRpbmc6MTFweCAxMnB4fQogIC5rcGkgLnZhbHtsZXR0ZXItc3Bh',
  'Y2luZzotLjNweH0KICAua3BpIC5sYmx7Zm9udC1zaXplOjExLjVweH0KICAua3BpIC5jYXB7Zm9udC1zaXplOjExcHh9CiAgLmNhcmQtYntwYWRkaW5nOjEzcHh9CiAgLmNhcmQtaHtwYWRkaW5nOjEycHggMTNweH0KCiAgLyogLS0tLSDguJXguLLguKPguLLguIcg',
  'LT4g4LiB4Liy4Lij4LmM4LiU4LiX4Li14Lil4Liw4Lij4Liy4Lii4LiB4Liy4LijIC0tLS0KICAgICDguIrguLfguYjguK3guITguK3guKXguLHguKHguJnguYzguKHguLLguIjguLLguIEgZGF0YS1sYWJlbCDguJfguLXguYggbGFiZWxDZWxscygpIOC4leC4tOC4',
  'lOC5hOC4p+C5ieC5g+C4q+C5ieC4q+C4peC4seC4h+C4p+C4suC4lOC4q+C4meC5ieC4sgogICAgIOC4iOC4tuC4h+C5g+C4iuC5ieC5hOC4lOC5ieC4geC4seC4muC4l+C4uOC4geC4leC4suC4o+C4suC4h+C5g+C4meC4o+C4sOC4muC4muC5guC4lOC4ouC5hOC4',
  'oeC5iOC4leC5ieC4reC4h+C5geC4geC5ieC4leC4suC4o+C4suC4h+C4l+C4teC4peC4sOC4reC4seC4mSAqLwogIC50d3tvdmVyZmxvdy14OnZpc2libGV9CiAgLnR7bWluLXdpZHRoOjAhaW1wb3J0YW50O2Rpc3BsYXk6YmxvY2s7d2lkdGg6MTAwJTtib3JkZXI6',
  'MH0KICAudCB0aGVhZHtkaXNwbGF5Om5vbmV9CiAgLnQgdGJvZHl7ZGlzcGxheTpibG9ja30KICAudCB0Ym9keSB0cnsKICAgIGRpc3BsYXk6YmxvY2s7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlKTtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpOwogICAgYm9y',
  'ZGVyLXJhZGl1czp2YXIoLS1yLXNtKTtwYWRkaW5nOjlweCAxMnB4O21hcmdpbi1ib3R0b206OHB4OwogIH0KICAudCB0Ym9keSB0cjpsYXN0LWNoaWxke21hcmdpbi1ib3R0b206MH0KICAvKiDguYHguJXguYjguKXguLDguIrguYjguK3guIcgPSAyIOC4hOC4reC4',
  'peC4seC4oeC4meC5jDog4LiK4Li34LmI4Lit4LiK4LmI4Lit4LiHIHwg4LiE4LmI4LiyICjguITguYjguLLguKvguKXguLLguKLguJrguKPguKPguJfguLHguJTguYDguKPguLXguKLguIfguKXguIfguKXguYjguLLguIfguYPguJnguITguK3guKXguLHguKHguJng',
  'uYzguILguKfguLIg4LmE4Lih4LmI4LmA4Lia4Li14Lii4LiU4LiB4Lix4LiZ4LmD4LiZ4LmB4LiW4Lin4LmA4LiU4Li14Lii4LinKSAqLwogIC50IHRib2R5IHRkewogICAgZGlzcGxheTpncmlkO2dyaWQtdGVtcGxhdGUtY29sdW1uczozNiUgbWlubWF4KDAsMWZy',
  'KTtjb2x1bW4tZ2FwOjEwcHg7YWxpZ24taXRlbXM6YmFzZWxpbmU7CiAgICBwYWRkaW5nOjNweCAwO2JvcmRlcjowO3RleHQtYWxpZ246bGVmdCFpbXBvcnRhbnQ7d2hpdGUtc3BhY2U6bm9ybWFsOwogIH0KICAudCB0Ym9keSB0ZCA+ICp7Z3JpZC1jb2x1bW46Mjtt',
  'aW4td2lkdGg6MH0KICAudCB0Ym9keSB0ZCA+IC5iLC50IHRib2R5IHRkID4gLmJ0bntqdXN0aWZ5LXNlbGY6c3RhcnR9ICAgLyog4Lib4LmJ4Liy4Lii4Liq4LiW4Liy4LiZ4LiwL+C4m+C4uOC5iOC4oSDguIHguKfguYnguLLguIfguYDguJfguYjguLLguILguYng',
  'uK3guITguKfguLLguKEg4LmE4Lih4LmI4Lii4Li34LiU4LmA4LiV4LmH4Lih4LiK4LmI4Lit4LiHICovCiAgLnQgdGJvZHkgdGQ6bm90KFtkYXRhLWxhYmVsXSl7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOm1pbm1heCgwLDFmcil9CiAgLnQgdGJvZHkgdGQ6bm90KFtk',
  'YXRhLWxhYmVsXSkgPiAqe2dyaWQtY29sdW1uOmF1dG99CiAgLnQgdGJvZHkgdGQ6ZW1wdHksLnQgdGJvZHkgdGQuY2VsbC1lbXB0eXtkaXNwbGF5Om5vbmV9CiAgLnQgdGJvZHkgdGRbZGF0YS1sYWJlbF06OmJlZm9yZXsKICAgIGNvbnRlbnQ6YXR0cihkYXRhLWxh',
  'YmVsKTtncmlkLWNvbHVtbjoxO2dyaWQtcm93OjEgLyBzcGFuIDk7bWluLXdpZHRoOjA7CiAgICBjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC1zaXplOjExLjVweDtmb250LXdlaWdodDo1MDA7CiAgfQogIC50IHRib2R5IHRkLm51bXtqdXN0aWZ5LWNvbnRlbnQ6Zmxl',
  'eC1zdGFydH0KICAvKiDguIrguYjguK3guIfguJfguLXguYjguYDguJvguYfguJnguYDguIrguYfguITguKXguLTguKrguJXguYzguKLguLLguKc6IOC4iuC4t+C5iOC4reC4iuC5iOC4reC4h+C4reC4ouC4ueC5iOC4muC4mSDguKPguLLguKLguIHguLLguKPguYDg',
  'uJXguYfguKHguITguKfguLLguKHguIHguKfguYnguLLguIfguILguYnguLLguIfguKXguYjguLLguIcgKOC5hOC4oeC5iOC4muC4teC4muC5gOC4q+C4peC4t+C4rSAyLzMg4LiC4Lit4LiH4LiB4Liy4Lij4LmM4LiUKSAqLwogIC50IHRib2R5IHRkOmhhcygudG9k',
  'by12aWV3KXtkaXNwbGF5OmJsb2NrfQogIC50IHRib2R5IHRkOmhhcygudG9kby12aWV3KTo6YmVmb3Jle2Rpc3BsYXk6YmxvY2s7bWFyZ2luLWJvdHRvbTo0cHh9CiAgLnQgdGJvZHkgdGQuY2VsbC1hY3Rpb25zewogICAgZGlzcGxheTpmbGV4O2p1c3RpZnktY29u',
  'dGVudDpmbGV4LWVuZDtnYXA6NnB4O3BhZGRpbmctdG9wOjlweDttYXJnaW4tdG9wOjZweDsKICAgIGJvcmRlci10b3A6MXB4IHNvbGlkIHZhcigtLWxpbmUtMik7CiAgfQogIC50IHRib2R5IHRyLnJvdy13aWRlIHRke2Rpc3BsYXk6YmxvY2s7dGV4dC1hbGlnbjpj',
  'ZW50ZXIhaW1wb3J0YW50fQogIC50IHRib2R5IHRyLnJvdy13aWRlIHRkOjpiZWZvcmV7Y29udGVudDpub25lfQoKICAvKiAtLS0tIOC4m+C4uOC5iOC4oeC4leC5ieC4reC4h+C4geC4lOC5guC4lOC4meC4lOC5ieC4p+C4ouC4meC4tOC5ieC4pyAtLS0tICovCiAg',
  'LmJ0bntwYWRkaW5nOjlweCAxNHB4fQogIC5idG4uc217cGFkZGluZzo3cHggMTFweDtmb250LXNpemU6MTNweH0KICAuYnRuLmljb257cGFkZGluZzo4cHggMTBweH0KICAuY2hpcHtwYWRkaW5nOjdweCAxNHB4fQogIC5zZWwsLmlucHtwYWRkaW5nOjlweCAxMXB4',
  'O2ZvbnQtc2l6ZToxNnB4fSAgIC8qIDE2cHgg4LiB4Lix4LiZIGlPUyDguIvguLnguKHguYDguK3guIfguJXguK3guJnguYHguJXguLDguIrguYjguK3guIfguIHguKPguK3guIEgKi8KICAudCAuYnRuLmljb257cGFkZGluZzo3cHggMTBweH0KCiAgLyogLS0tLSDg',
  'uIHguKPguLLguJ86IOC5g+C4q+C5ieC5gOC4leC4teC5ieC4ouC4peC4h+C4q+C4meC5iOC4reC4oiDguIjguLDguYTguJTguYnguYTguKHguYjguIHguLTguJnguJfguLHguYnguIfguIjguK0gLS0tLSAqLwogIC5jaGFydHttaW4td2lkdGg6NDYwcHh9CiAgLmNo',
  'YXJ0LXdyYXB7b3ZlcmZsb3cteDphdXRvOy13ZWJraXQtb3ZlcmZsb3ctc2Nyb2xsaW5nOnRvdWNofQoKICAvKiAtLS0tIOC4geC4peC5iOC4reC4h+C4i+C5ieC4reC4mTog4LmA4LiV4LmH4Lih4LiI4Lit4LmB4Lia4Lia4LmB4Lic4LmI4LiZ4LmA4Lil4Li34LmI',
  '4Lit4LiZ4LiC4Li24LmJ4LiZIOC4m+C4uOC5iOC4oeC4muC4seC4meC4l+C4tuC4geC4leC4tOC4lOC4guC4reC4muC4peC5iOC4suC4h+C5gOC4quC4oeC4rSAtLS0tICovCiAgLm1vZGFsLWZ7cG9zaXRpb246c3RpY2t5O2JvdHRvbTowO2JhY2tncm91bmQ6dmFy',
  'KC0tc3VyZmFjZSk7CiAgICBwYWRkaW5nLWJvdHRvbTpjYWxjKDEycHggKyBlbnYoc2FmZS1hcmVhLWluc2V0LWJvdHRvbSkpfQp9CgovKiDguIjguK3guYDguKXguYfguIHguKHguLLguIEgKOC5gOC4hOC4o+C4t+C5iOC4reC4h+C5gOC4peC5h+C4gSAvIOC4ouC5',
  'iOC4reC4q+C4meC5ieC4suC4leC5iOC4suC4h+C5geC4hOC4muC4quC4uOC4lCkgKi8KQG1lZGlhIChtYXgtd2lkdGg6NDAwcHgpewogIC50YWIgLnRse2ZvbnQtc2l6ZTo5LjVweH0KICAudCB0Ym9keSB0ZFtkYXRhLWxhYmVsXXtncmlkLXRlbXBsYXRlLWNvbHVt',
  'bnM6NDIlIG1pbm1heCgwLDFmcil9Cn0KCkBtZWRpYSBwcmludHsKICAubmF2LC50b3AtcmlnaHQsLmJ1cmdlciwudC1hY3Rpb25zLC5idG57ZGlzcGxheTpub25lIWltcG9ydGFudH0KICAuYXBwe2Rpc3BsYXk6YmxvY2t9IGJvZHl7YmFja2dyb3VuZDojZmZmfQog',
  'IC5jYXJke2JyZWFrLWluc2lkZTphdm9pZDtib3gtc2hhZG93Om5vbmV9Cn0KCi8qID09PT09PT09PT09PSDguIrguYjguK3guIfguYDguKXguLfguK3guIHguKrguJbguLLguJnguLDguYPguJnguJXguLLguKPguLLguIcgPT09PT09PT09PT09IC0tLS0tLS0tLS0t',
  'LS0tLS0tLS0tCiAgIOC4q+C4meC5ieC4suC4leC4suC5gOC4q+C4oeC4t+C4reC4meC4m+C5ieC4suC4ouC4quC4luC4suC4meC4sOC5gOC4lOC4tOC4oSDguYHguJXguYjguIHguJTguYDguJvguKXguLXguYjguKLguJnguYTguJTguYnguYDguKXguKLguYTguKHg',
  'uYjguJXguYnguK3guIfguYDguJvguLTguJTguJ/guK3guKPguYzguKEKICAg4LmD4LiK4LmJ4Liq4Li14LiK4Li44LiU4LmA4LiU4Li14Lii4Lin4LiB4Lix4LiaIC5iIOC5gOC4nuC4t+C5iOC4reC5g+C4q+C5ieC4leC4suC4o+C4suC4h+C4reC5iOC4suC4meC5',
  'gOC4q+C4oeC4t+C4reC4meC5gOC4lOC4tOC4oeC4l+C4uOC4geC4m+C4o+C4sOC4geC4suC4owotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqLwouc3Qtc2VsewogIC13ZWJraXQtYXBw',
  'ZWFyYW5jZTpub25lO2FwcGVhcmFuY2U6bm9uZTsKICBib3JkZXI6MXB4IHNvbGlkIHRyYW5zcGFyZW50O2JvcmRlci1yYWRpdXM6OTlweDsKICBwYWRkaW5nOjNweCAyMnB4IDNweCAxMHB4O2ZvbnQtc2l6ZToxMnB4O2ZvbnQtd2VpZ2h0OjYwMDtsaW5lLWhlaWdo',
  'dDoxLjU7CiAgY3Vyc29yOnBvaW50ZXI7bWF4LXdpZHRoOjEwMCU7CiAgYmFja2dyb3VuZC1yZXBlYXQ6bm8tcmVwZWF0O2JhY2tncm91bmQtcG9zaXRpb246cmlnaHQgN3B4IGNlbnRlcjtiYWNrZ3JvdW5kLXNpemU6OXB4OwogIGJhY2tncm91bmQtaW1hZ2U6dXJs',
  'KCJkYXRhOmltYWdlL3N2Zyt4bWw7Y2hhcnNldD11dGY4LCUzQ3N2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAxMCA2JyUzRSUzQ3BhdGggZD0nTTEgMWw0IDQgNC00JyBmaWxsPSdub25lJyBzdHJva2U9JyUyMzY2Nycg',
  'c3Ryb2tlLXdpZHRoPScxLjYnIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcvJTNFJTNDL3N2ZyUzRSIpOwp9Ci5zdC1zZWw6aG92ZXJ7Ym9yZGVyLWNvbG9yOnZhcigtLWxpbmUpfQouc3Qtc2VsOmZvY3Vze291dGxpbmU6bm9uZTtib3JkZXItY29sb3I6dmFyKC0tYnJh',
  'bmQpO2JveC1zaGFkb3c6MCAwIDAgM3B4IHZhcigtLWJyYW5kLXNvZnQpfQouc3Qtc2VsW2Rpc2FibGVkXXtvcGFjaXR5Oi41NTtjdXJzb3I6cHJvZ3Jlc3N9Ci5zdC1zZWwub2t7YmFja2dyb3VuZC1jb2xvcjp2YXIoLS1vay1zb2Z0KTtjb2xvcjp2YXIoLS1vayl9',
  'Ci5zdC1zZWwuaW5mb3tiYWNrZ3JvdW5kLWNvbG9yOnZhcigtLWluZm8tc29mdCk7Y29sb3I6dmFyKC0taW5mbyl9Ci5zdC1zZWwud2FybntiYWNrZ3JvdW5kLWNvbG9yOnZhcigtLXdhcm4tc29mdCk7Y29sb3I6dmFyKC0td2Fybil9Ci5zdC1zZWwuZGdye2JhY2tn',
  'cm91bmQtY29sb3I6dmFyKC0tZGFuZ2VyLXNvZnQpO2NvbG9yOnZhcigtLWRhbmdlcil9Ci5zdC1zZWwubXV0ZXtiYWNrZ3JvdW5kLWNvbG9yOnZhcigtLXN1cmZhY2UtMik7Y29sb3I6dmFyKC0tbXV0ZWQpfQovKiDguIjguK3guYHguITguJo6IOC4geC4suC4o+C5',
  'jOC4lOC4l+C4teC4peC4sOC4o+C4suC4ouC4geC4suC4oyDguYPguKvguYnguIrguYjguK3guIfguJnguLXguYnguIHguJTguIfguYjguLLguKLguJTguYnguKfguKLguJnguLTguYnguKcgKi8KQG1lZGlhIChtYXgtd2lkdGg6NzYwcHgpewogIC5zdC1zZWx7cGFk',
  'ZGluZzo3cHggMjZweCA3cHggMTJweDtmb250LXNpemU6MTNweH0KfQoKLyogPT09PT09PT09PT09IOC4m+C4j+C4tOC4l+C4tOC4meC4h+C4suC4meC4o+C4p+C4oSA9PT09PT09PT09PT0gKi8KLmNhbC10aXRsZXttYXJnaW46MDtmb250LXNpemU6MTdweDtmb250',
  'LWZhbWlseTp2YXIoLS1mb250LWRpc3BsYXkpO21pbi13aWR0aDoxNzBweDt0ZXh0LWFsaWduOmNlbnRlcn0KLmNhbHtkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCg3LG1pbm1heCgwLDFmcikpO2dhcDoxcHg7YmFja2dyb3VuZDp2YXIo',
  'LS1saW5lLTIpO2JvcmRlci1yYWRpdXM6dmFyKC0tcik7b3ZlcmZsb3c6aGlkZGVufQouY2FsLXdke2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKTtwYWRkaW5nOjdweCA0cHg7dGV4dC1hbGlnbjpjZW50ZXI7Zm9udC1zaXplOjExLjVweDtmb250LXdlaWdodDo2',
  'MDA7Y29sb3I6dmFyKC0tbXV0ZWQpfQouY2FsLWN7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlKTtib3JkZXI6MDttaW4taGVpZ2h0OjEwNHB4O3BhZGRpbmc6NnB4IDZweCA3cHg7dGV4dC1hbGlnbjpsZWZ0O2ZvbnQ6aW5oZXJpdDtjb2xvcjppbmhlcml0OwogIGRp',
  'c3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47Z2FwOjNweDtjdXJzb3I6cG9pbnRlcjttaW4td2lkdGg6MH0KLmNhbC1jLm9mZntiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Y3Vyc29yOmRlZmF1bHR9Ci5jYWwtYzpub3QoLm9mZik6aG92ZXJ7YmFj',
  'a2dyb3VuZDp2YXIoLS1icmFuZC1zb2Z0KX0KLmNhbC1jOmZvY3VzLXZpc2libGV7b3V0bGluZToycHggc29saWQgdmFyKC0tYnJhbmQpO291dGxpbmUtb2Zmc2V0Oi0ycHh9Ci5jYWwtbntmb250LXNpemU6MTIuNXB4O2ZvbnQtd2VpZ2h0OjYwMDtjb2xvcjp2YXIo',
  'LS1pbmstMik7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zOwogIHdpZHRoOjI0cHg7aGVpZ2h0OjI0cHg7ZGlzcGxheTppbmxpbmUtZmxleDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmNlbnRlcjtib3JkZXItcmFkaXVzOjk5cHh9',
  'Ci5jYWwtYy50b2RheSAuY2FsLW57YmFja2dyb3VuZDp2YXIoLS1icmFuZCk7Y29sb3I6dmFyKC0tYnJhbmQtaW5rKX0KLmNhbC1ldntkaXNwbGF5OmJsb2NrO2ZvbnQtc2l6ZToxMXB4O2xpbmUtaGVpZ2h0OjEuMzU7cGFkZGluZzoycHggNnB4O2JvcmRlci1yYWRp',
  'dXM6NXB4OwogIHdoaXRlLXNwYWNlOm5vd3JhcDtvdmVyZmxvdzpoaWRkZW47dGV4dC1vdmVyZmxvdzplbGxpcHNpczttYXgtd2lkdGg6MTAwJX0KLmNhbC1ldi5va3tiYWNrZ3JvdW5kOnZhcigtLW9rLXNvZnQpO2NvbG9yOnZhcigtLW9rKX0KLmNhbC1ldi5pbmZv',
  'e2JhY2tncm91bmQ6dmFyKC0taW5mby1zb2Z0KTtjb2xvcjp2YXIoLS1pbmZvKX0KLmNhbC1ldi5kZ3J7YmFja2dyb3VuZDp2YXIoLS1kYW5nZXItc29mdCk7Y29sb3I6dmFyKC0tZGFuZ2VyKTtmb250LXdlaWdodDo2MDB9Ci5jYWwtbW9yZXtmb250LXNpemU6MTAu',
  'NXB4O2NvbG9yOnZhcigtLW11dGVkKTtwYWRkaW5nLWxlZnQ6NHB4fQouY2FsLWRvdHN7ZGlzcGxheTpub25lO2dhcDozcHg7YWxpZ24taXRlbXM6Y2VudGVyO2ZsZXgtd3JhcDp3cmFwfQouY2FsLWRvdHMgaXt3aWR0aDo3cHg7aGVpZ2h0OjdweDtib3JkZXItcmFk',
  'aXVzOjk5cHg7ZGlzcGxheTppbmxpbmUtYmxvY2t9Ci5jYWwtZG90cyBpLm9re2JhY2tncm91bmQ6dmFyKC0tb2spfSAuY2FsLWRvdHMgaS5pbmZve2JhY2tncm91bmQ6dmFyKC0taW5mbyl9IC5jYWwtZG90cyBpLmRncntiYWNrZ3JvdW5kOnZhcigtLWRhbmdlcil9',
  'Ci5jYWwtZG90cyBlbXtmb250LXN0eWxlOm5vcm1hbDtmb250LXNpemU6MTBweDtjb2xvcjp2YXIoLS1tdXRlZCl9Ci5jYWwtYWdlbmRhe2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW59Ci5jYWwtZGF5e3BhZGRpbmc6MTBweCAxNHB4O2JvcmRlci1i',
  'b3R0b206MXB4IHNvbGlkIHZhcigtLWxpbmUtMil9Ci5jYWwtZGF5Omxhc3QtY2hpbGR7Ym9yZGVyLWJvdHRvbTowfQouY2FsLWRheS50b2RheXtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMil9Ci5jYWwtZGF0ZXtmb250LXNpemU6MTIuNXB4O2ZvbnQtd2VpZ2h0',
  'OjYwMDtjb2xvcjp2YXIoLS1pbmstMik7bWFyZ2luLWJvdHRvbTo1cHh9Ci5jYWwtcm93e2Rpc3BsYXk6ZmxleDtnYXA6MTBweDthbGlnbi1pdGVtczpjZW50ZXI7d2lkdGg6MTAwJTt0ZXh0LWFsaWduOmxlZnQ7YmFja2dyb3VuZDowO2JvcmRlcjowOwogIHBhZGRp',
  'bmc6NnB4IDRweDtib3JkZXItcmFkaXVzOnZhcigtLXItc20pO2N1cnNvcjpwb2ludGVyO2ZvbnQ6aW5oZXJpdDtjb2xvcjppbmhlcml0O21pbi13aWR0aDowfQouY2FsLXJvdzpob3ZlcntiYWNrZ3JvdW5kOnZhcigtLWJyYW5kLXNvZnQpfQouY2FsLXJvdyAuaWN7',
  'ZmxleDpub25lO3dpZHRoOjIycHg7dGV4dC1hbGlnbjpjZW50ZXJ9Ci5jYWwtcm93IC50eHtmbGV4OjE7bWluLXdpZHRoOjA7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbn0KLmNhbC1yb3cgLnR0e2ZvbnQtc2l6ZToxM3B4O2ZvbnQtd2VpZ2h0OjUw',
  'MDtvdmVyZmxvdy13cmFwOmFueXdoZXJlfQouY2FsLXJvdyAuZGR7Zm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1tdXRlZCk7b3ZlcmZsb3ctd3JhcDphbnl3aGVyZX0KLmNhbC1yb3cgLmJ7ZmxleDpub25lfQpAbWVkaWEgKG1heC13aWR0aDo3NjBweCl7CiAg',
  'Lyog4LiI4Lit4LmB4LiE4LiaOiDguIrguYjguK3guIfguKfguLHguJnguYDguKvguKXguLfguK3guYDguKXguILguKfguLHguJnguIHguLHguJrguIjguLjguJTguKrguLUg4Lij4Liy4Lii4Lil4Liw4LmA4Lit4Li14Lii4LiU4Lit4LmI4Liy4LiZ4LiI4Liy4LiB',
  '4Lij4Liy4Lii4LiB4Liy4Lij4LiC4LmJ4Liy4LiH4Lil4LmI4Liy4LiH4Lir4Lij4Li34Lit4LmB4LiV4Liw4LiX4Li14LmI4Lin4Lix4LiZICovCiAgLmNhbC1je21pbi1oZWlnaHQ6NTRweDtwYWRkaW5nOjRweCAzcHg7YWxpZ24taXRlbXM6Y2VudGVyfQogIC5j',
  'YWwtZXYsLmNhbC1tb3Jle2Rpc3BsYXk6bm9uZX0KICAuY2FsLWRvdHN7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpjZW50ZXJ9CiAgLmNhbC10aXRsZXttaW4td2lkdGg6MDtmbGV4OjE7Zm9udC1zaXplOjE1LjVweH0KICAuY2FsLWRheXtwYWRkaW5nOjlw',
  'eCAxMHB4fQp9CgovKiA9PT09PT09PT09PT0g4LiB4Lij4Liy4LifID09PT09PT09PT09PSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0KICAg4LmA4Liq4LmJ4LiZ4LiV4Liy4Lij4Liy4LiH4LiB4Lix4Lia4LmB4LiB4LiZ4LmA4Lib4LmH4LiZ',
  '4LmA4Liq4LmJ4LiZ4Lia4Liy4LiH4LiX4Li24LiaIOC5hOC4oeC5iOC5g+C4iuC5ieC5gOC4quC5ieC4meC4m+C4o+C4sCAo4LmA4Liq4LmJ4LiZ4Lib4Lij4Liw4Lit4LmI4Liy4LiZ4LmA4Lir4Lih4Li34Lit4LiZ4LmA4Liq4LmJ4LiZ4LiE4Liy4LiU4LiB4Liy',
  '4Lij4LiT4LmMKQogICDguYHguJfguYjguIfguKvguJnguLLguYTguKHguYjguYDguIHguLTguJkgMjRweCDguJvguKXguLLguKLguJTguYnguLLguJnguILguYnguK3guKHguLnguKXguKHguJnguYDguKXguYfguIHguJnguYnguK3guKIg4LiU4LmJ4Liy4LiZ4LiQ',
  '4Liy4LiZ4LmA4Lir4Lil4Li14LmI4Lii4LihCiAgIOC4leC4seC4p+C4q+C4meC4seC4h+C4quC4t+C4reC4l+C4uOC4geC4leC4seC4p+C5g+C4iuC5ieC4quC4teC4leC4seC4p+C4reC4seC4geC4qeC4o+C4m+C4geC4leC4tCDguYTguKHguYjguYPguIrguYjg',
  'uKrguLXguILguK3guIfguYHguJfguYjguIcg4oCUIOC4quC4teC4reC4ouC4ueC5iOC4l+C4teC5iOC5geC4l+C5iOC4h+C5gOC4l+C5iOC4suC4meC4seC5ieC4mQotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0t',
  'LS0tLS0tLS0tLS0tLSAqLwouY2hhcnQtd3JhcHtvdmVyZmxvdy14OmF1dG99Ci5jaGFydHtkaXNwbGF5OmJsb2NrO3dpZHRoOjEwMCU7aGVpZ2h0OmF1dG87bWluLXdpZHRoOjU2MHB4fQouY2hhcnQgLmdyaWQtbHtzdHJva2U6dmFyKC0tbGluZSk7c3Ryb2tlLXdp',
  'ZHRoOjE7ZmlsbDpub25lfQouY2hhcnQgLmF4aXMtbHtzdHJva2U6dmFyKC0tbGluZSk7c3Ryb2tlLXdpZHRoOjF9Ci5jaGFydCAudGlja3tmaWxsOnZhcigtLW11dGVkKTtmb250LXNpemU6MTFweDtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXN9Ci5j',
  'aGFydCAueGxhYntmaWxsOnZhcigtLWluay0yKTtmb250LXNpemU6MTJweH0KLmNoYXJ0IC5kbGFie2ZpbGw6dmFyKC0taW5rKTtmb250LXNpemU6MTFweDtmb250LXdlaWdodDo2MDB9Ci5jaGFydCAuYzF7ZmlsbDp2YXIoLS1jMSl9Ci5jaGFydCAuYzJ7ZmlsbDp2',
  'YXIoLS1jMil9Ci5jaGFydCAuaGl0e2ZpbGw6dHJhbnNwYXJlbnQ7Y3Vyc29yOnBvaW50ZXJ9Ci5jaGFydCAuaGl0OmZvY3Vze291dGxpbmU6bm9uZX0KLmNoYXJ0IC5iYW5ke2ZpbGw6dmFyKC0taW5rKTtvcGFjaXR5OjA7dHJhbnNpdGlvbjpvcGFjaXR5IC4xMnN9',
  'Ci5jaGFydCBnLm9uIC5iYW5ke29wYWNpdHk6LjA1fQouY2hhcnQgLmhpdDpmb2N1cy12aXNpYmxlICsgLmJhbmQsCi5jaGFydCBnLm9uIC5iYW5ke29wYWNpdHk6LjA4fQoKLmxlZ2VuZHtkaXNwbGF5OmZsZXg7Z2FwOjE0cHg7YWxpZ24taXRlbXM6Y2VudGVyO2Zs',
  'ZXgtd3JhcDp3cmFwO21hcmdpbi1ib3R0b206MTBweH0KLmxlZ2VuZCAua3tkaXNwbGF5OmlubGluZS1mbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6NnB4O2ZvbnQtc2l6ZToxMnB4O2NvbG9yOnZhcigtLWluay0yKX0KLmxlZ2VuZCAuc3d7d2lkdGg6MTJweDto',
  'ZWlnaHQ6MTJweDtib3JkZXItcmFkaXVzOjNweDtmbGV4Om5vbmV9CgovKiDguIHguKXguYjguK3guIfguJrguK3guIHguITguYjguLLguJXguK3guJnguIrguLXguYkg4oCUIOC4hOC5iOC4suC4leC4seC4p+C5g+C4q+C4jeC5iOC4oeC4suC4geC5iOC4reC4mSDg',
  'uIrguLfguYjguK3guKPguLLguKLguIHguLLguKPguYDguJvguYfguJnguJXguLHguKfguKPguK3guIcgKi8KLmN0aXB7cG9zaXRpb246Zml4ZWQ7ei1pbmRleDo5MDtwb2ludGVyLWV2ZW50czpub25lO2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7CiAgYm9yZGVy',
  'OjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXItc20pO2JveC1zaGFkb3c6dmFyKC0tc2gtbGcpOwogIHBhZGRpbmc6OHB4IDEwcHg7Zm9udC1zaXplOjEycHg7bWluLXdpZHRoOjEzMnB4O29wYWNpdHk6MDt0cmFuc2l0aW9uOm9wYWNp',
  'dHkgLjFzfQouY3RpcC5vbntvcGFjaXR5OjF9Ci5jdGlwIC5te2ZvbnQtd2VpZ2h0OjcwMDtjb2xvcjp2YXIoLS1pbmspO21hcmdpbi1ib3R0b206NnB4fQouY3RpcCAucntkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo3cHg7bWFyZ2luLXRvcDoz',
  'cHh9Ci5jdGlwIC5yIGl7d2lkdGg6MTJweDtoZWlnaHQ6MnB4O2JvcmRlci1yYWRpdXM6MnB4O2ZsZXg6bm9uZX0KLmN0aXAgLnIgYntjb2xvcjp2YXIoLS1pbmspO2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtczttYXJnaW4tbGVmdDphdXRvfQouY3Rp',
  'cCAuciBzcGFue2NvbG9yOnZhcigtLW11dGVkKX0KCjwvc3R5bGU+CjwvaGVhZD4KPGJvZHk+Cgo8ZGl2IGNsYXNzPSJhcHAiPgogIDwhLS0gPT09PT09PT09PT09PT09PT0gc2lkZWJhciA9PT09PT09PT09PT09PT09PSAtLT4KICA8YXNpZGUgY2xhc3M9Im5hdiIg',
  'aWQ9Im5hdiI+CiAgICA8ZGl2IGNsYXNzPSJicmFuZCI+CiAgICAgIDxiPvCfj6IgPD89IGFwcE5hbWUgPz48L2I+CiAgICAgIDxzcGFuPjw/PSBzdWJ0aXRsZSA/PiDCtyB2PD89IHZlcnNpb24gPz48L3NwYW4+CiAgICA8L2Rpdj4KICAgIDxkaXYgY2xhc3M9Im5h',
  'di1saXN0IiBpZD0ibmF2TGlzdCI+PC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJuYXYtZm9vdCIgaWQ9Im5hdkZvb3QiPuC4geC4s+C4peC4seC4h+C5guC4q+C4peC4lOKApjwvZGl2PgogIDwvYXNpZGU+CgogIDwhLS0gPT09PT09PT09PT09PT09PT0gbWFpbiA9PT09',
  'PT09PT09PT09PT09PSAtLT4KICA8ZGl2IGNsYXNzPSJtYWluIj4KICAgIDxoZWFkZXIgY2xhc3M9InRvcCI+CiAgICAgIDxidXR0b24gY2xhc3M9ImJ1cmdlciIgb25jbGljaz0idG9nZ2xlTmF2KCkiPuKYsDwvYnV0dG9uPgogICAgICA8ZGl2PgogICAgICAgIDxo',
  'MSBpZD0icGFnZVRpdGxlIj7guKDguLLguJ7guKPguKfguKE8L2gxPgogICAgICAgIDxkaXYgY2xhc3M9InN1YiIgaWQ9InBhZ2VTdWIiPuC5geC4lOC4iuC4muC4reC4o+C5jOC4lOC4o+C4p+C4oeC4l+C4uOC4geC4quC5iOC4p+C4meC4guC4reC4h+C4q+C4reC4',
  'nuC4seC4gTwvZGl2PgogICAgICA8L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0idG9wLXJpZ2h0Ij4KICAgICAgICA8c3BhbiBpZD0ibGl2ZURvdCI+PC9zcGFuPgogICAgICAgIDxzcGFuIGlkPSJiZWxsV3JhcCIgY2xhc3M9ImJlbGwtd3JhcCI+PC9zcGFuPgogICAg',
  'ICAgIDxidXR0b24gY2xhc3M9ImJ0biBpY29uIiBpZD0idGhlbWVCdG4iIHRpdGxlPSLguKrguKXguLHguJrguJjguLXguKEiIG9uY2xpY2s9ImN5Y2xlVGhlbWUoKSI+8J+MlzwvYnV0dG9uPgogICAgICAgIDxpbnB1dCBjbGFzcz0iaW5wIHctYXV0byIgaWQ9InNl',
  'YXJjaEJveCIgcGxhY2Vob2xkZXI9IvCflI4g4LiE4LmJ4LiZ4Lir4Liy4LiX4Lix4LmJ4LiH4Lij4Liw4Lia4Lia4oCmIiBzdHlsZT0id2lkdGg6MTgwcHgiCiAgICAgICAgICAgICAgIG9uaW5wdXQ9Im9uU2VhcmNoKHRoaXMudmFsdWUpIiBhdXRvY29tcGxldGU9',
  'Im9mZiI+CiAgICAgICAgPHNlbGVjdCBjbGFzcz0ic2VsIHctYXV0byIgaWQ9InllYXJTZWwiIG9uY2hhbmdlPSJzZXRZZWFyKHRoaXMudmFsdWUpIj48L3NlbGVjdD4KICAgICAgICA8YnV0dG9uIGNsYXNzPSJidG4gaWNvbiIgdGl0bGU9IuC4o+C4teC5gOC4n+C4',
  'o+C4iiIgb25jbGljaz0icmVmcmVzaCgpIj7ihrs8L2J1dHRvbj4KICAgICAgPC9kaXY+CiAgICA8L2hlYWRlcj4KICAgIDxtYWluIGNsYXNzPSJjb250ZW50IiBpZD0idmlldyI+CiAgICAgIDxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPjxzcGFu',
  'IGNsYXNzPSJzcGluIj48L3NwYW4+PC9kaXY+4LiB4Liz4Lil4Lix4LiH4LmA4LiK4Li34LmI4Lit4Lih4LiV4LmI4Lit4Lij4Liw4Lia4Lia4oCmPC9kaXY+CiAgICA8L21haW4+CiAgPC9kaXY+CgogIDwhLS0g4LmB4LiW4Lia4Lil4LmI4Liy4LiH4Liq4Liz4Lir',
  '4Lij4Lix4Lia4Lih4Li34Lit4LiW4Li34LitIOKAlCDguK3guKLguLnguYjguYPguJnguKvguJnguYnguLLguYDguJTguLXguKLguKfguIHguLHguJnguJnguLXguYnguYDguKrguKHguK0g4LmE4Lih4LmI4LmE4LiU4LmJ4LmB4Lii4LiB4LmE4Lif4Lil4LmMCiAg',
  'ICAgICBDU1Mg4LmA4Lib4LmH4LiZ4LiV4Lix4Lin4LiV4Lix4LiU4Liq4Li04LiZ4Lin4LmI4Liy4LiI4Lit4LmE4Lir4LiZ4LmA4Lir4LmH4LiZIOC4ouC5iOC4rS3guILguKLguLLguKLguKvguJnguYnguLLguJXguYjguLLguIfguYHguKXguYnguKfguKrguKXg',
  'uLHguJrguYTguJTguYnguJfguLHguJnguJfguLUgLS0+CiAgPG5hdiBjbGFzcz0idGFiYmFyIiBpZD0idGFiQmFyIiBhcmlhLWxhYmVsPSLguYDguKHguJnguLnguKvguKXguLHguIEiPjwvbmF2Pgo8L2Rpdj4KCjxkaXYgaWQ9ImF1dGhSb290Ij48L2Rpdj4KPGRp',
  'diBpZD0ibW9kYWxSb290Ij48L2Rpdj4KPGRpdiBpZD0idG9hc3RSb290Ij48L2Rpdj4KCjxzY3JpcHQ+CiAgLyog4LiE4LmI4Liy4LiX4Lix4LmJ4LiH4Liq4Liy4Lih4LiW4Li54LiB4LiB4Lij4Lit4LiH4Lih4Liy4LiI4Liy4LiB4Lid4Lix4LmI4LiH4LmA4LiL',
  '4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4LmB4Lil4LmJ4LinIOC4iOC4tuC4h+C4q+C4peC4uOC4lOC4reC4reC4geC4iOC4suC4geC5gOC4hOC4o+C4t+C5iOC4reC4h+C4q+C4oeC4suC4ouC4hOC4s+C4nuC4ueC4lOC5hOC4oeC5iOC5hOC4lOC5iQogICAg',
  'ICAgYWNjZXNzS2V5ICDguJzguYjguLLguJkgc2FmZUtleV8gICAg4LmA4Lir4Lil4Li34Lit4LmB4LiE4LmIIEEtWiBhLXogMC05IF8gLQogICAgICAgcm9sZSAgICAgICDguKHguLLguIjguLLguIHguKPguLLguKLguIHguLLguKPguITguIfguJfguLXguYggUk9M',
  'RQogICAgICAgdGhlbWUgICAgICDguJzguYjguLLguJkgc2FmZVRoZW1lXyAg4LmA4Lir4Lil4Li34Lit4LmB4LiE4LmIIDMg4LiE4LmI4Liy4LiX4Li14LmI4LiB4Liz4Lir4LiZ4LiU4LmE4Lin4LmJCgogICAgIOC4l+C4seC5ieC4h+C4quC4suC4oeC4leC5ieC4',
  'reC4h+C4nuC4tOC4oeC4nuC5jOC5geC4muC4muC4lOC4tOC4miAoZm9yY2UtcHJpbnRpbmcpIOC5gOC4l+C5iOC4suC4meC4seC5ieC4mSDguKvguYnguLLguKHguYPguIrguYnguYHguJrguJogc3RhbmRhcmQtcHJpbnRpbmcKICAgICDguYDguJ7guKPguLLguLDg',
  'uYHguJrguJrguKvguKXguLHguIfguIjguLAgZXNjYXBlIOC5gOC4hOC4o+C4t+C5iOC4reC4h+C4q+C4oeC4suC4ouC4hOC4s+C4nuC4ueC4lOC5gOC4m+C5h+C4mSAmcXVvdDsg4LiL4Li24LmI4LiH4LmD4LiZ4LmB4LiX4LmH4LiBIHNjcmlwdAogICAgIOC5gOC4',
  'muC4o+C4suC4p+C5jOC5gOC4i+C4reC4o+C5jOC5hOC4oeC5iOC4luC4reC4lOC4geC4peC4seC4miDguJfguLPguYPguKvguYnguJfguLHguYnguIfguJrguKXguYfguK3guIHguJnguLXguYnguJ7guLHguIfguJfguLHguYnguIfguIHguYnguK3guJnguYHguKXg',
  'uLDguITguYjguLLguYTguKHguYjguJbguLbguIfguKvguJnguYnguLLguYDguKfguYfguJogKi8KICB2YXIgQUNDRVNTX0tFWSA9ICI8PyE9IGFjY2Vzc0tleSA/PiI7CiAgdmFyIFVTRVJfUk9MRSAgPSAiPD8hPSByb2xlID8+IjsKICB2YXIgSU5JVF9USEVNRSA9',
  'ICI8PyE9IHRoZW1lID8+IjsKPC9zY3JpcHQ+CjxzY3JpcHQ+Ci8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBBcHAuaHRtbCDigJQgY29yZTogc3RhdGUsIGFwaSwgcm91dGVyLCBmb3JtYXQsIG1v',
  'ZGFsLCB1cGxvYWQKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgp2YXIgUyA9IHsKICBib290OiBudWxsLCAgICAgICAgICAvLyDguILguYnguK3guKHguLnguKXguJXguLHguYnguIfguJXguYng',
  'uJnguIjguLLguIEgYXBwLmJvb3RzdHJhcAogIHBhZ2U6ICdkYXNoYm9hcmQnLAogIHllYXI6IFN0cmluZyhuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCkpLAogIGNhY2hlOiB7fSwgICAgICAgICAgIC8vIOC5gOC4geC5h+C4muC4nOC4peC4peC4seC4nuC4mOC5jOC4',
  'peC5iOC4suC4quC4uOC4lOC4guC4reC4h+C5geC4leC5iOC4peC4sOC4q+C4meC5ieC4sgogIHBhcmFtczoge30sICAgICAgICAgIC8vIOC4leC4seC4p+C4geC4o+C4reC4h+C4ouC5iOC4reC4ouC4guC4reC4h+C5geC4leC5iOC4peC4sOC4q+C4meC5ieC4siDg',
  'uYDguIrguYjguJkge3Jvb206JzMxMScsIHN0YXR1czonYWxsJ30KICBidXN5OiBmYWxzZSwKICB2ZXJzaW9uOiAwLCAgICAgICAgICAvLyDguKPguLjguYjguJnguILguYnguK3guKHguLnguKXguJfguLXguYjguKvguJnguYnguLLguJnguLXguYnguJbguLfguK3g',
  'uK3guKLguLnguYgKICBzZWxmQ2hhbmdlVW50aWw6IDAsICAvLyDguYDguJ7guLTguYjguIfguIHguJTguJrguLHguJnguJfguLbguIHguYDguK3guIcg4oCUIOC4reC4ouC5iOC4suC5gOC4lOC5ieC4h+C4p+C5iOC4siAi4Lih4Li14LiE4LiZ4LmB4LiB4LmJ4LiC',
  '4LmJ4Lit4Lih4Li54LilIgogIHN5bmNUaW1lcjogbnVsbAp9OwoKdmFyIEFMTF9ERUJUUyA9IFtdOwoKdmFyIFBBR0VTID0gWwogIHsgaWQ6J2Rhc2hib2FyZCcsIGljOifwn5OKJywgbGFiZWw6J+C4oOC4suC4nuC4o+C4p+C4oScsICAgICAgICAgICAgICBzdWI6',
  'J+C5geC4lOC4iuC4muC4reC4o+C5jOC4lOC4o+C4p+C4oeC4l+C4uOC4geC4quC5iOC4p+C4meC4guC4reC4h+C4q+C4reC4nuC4seC4gScsICAgICAgICBzZWM6J+C4oOC4suC4nuC4o+C4p+C4oScsIHRhYjon4Lig4Liy4Lie4Lij4Lin4LihJyB9LAogIHsgaWQ6',
  'J2NhbGVuZGFyJywgIGljOifwn5eT77iPJywgbGFiZWw6J+C4m+C4j+C4tOC4l+C4tOC4meC4h+C4suC4mScsICAgICAgICAgICAgc3ViOifguJnguLHguJTguIvguYjguK3guKEg4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMIOC4h+C4suC4meC4leC4tuC4gSDguYHg',
  'uKXguLDguIHguLPguKvguJnguJTguJzguYjguK3guJkg4LiU4Li54LiV4LmI4Lit4LmA4LiZ4Li34LmI4Lit4LiH4LiC4LmJ4Liy4Lih4Lib4Li14LmE4LiU4LmJJyB9LAogIHsgaWQ6J2RlYnRNYWluJywgIGljOifwn5KwJywgbGFiZWw6J+C4o+C4suC4ouC4geC4',
  'suC4o+C4quC4o+C4uOC4m+C4o+C4p+C4oScsICAgICAgIHN1Yjon4Lia4Lix4LiN4LiK4Li14LmC4Lit4LiZ4LmD4LiK4LmJ4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiB4LiC4Lit4LiH4Lir4Lit4Lie4Lix4LiBJywgICAgICAgIHNlYzon4LiB4Liy4Lij4LmA4LiH',
  '4Li04LiZJyB9LAogIHsgaWQ6J2RlYnRTdWInLCAgIGljOifwn6e+JywgbGFiZWw6J+C4q+C4meC4teC5ieC4quC4tOC4mScsICAgICAgICAgICAgICBzdWI6J+C4muC4seC4jeC4iuC4teC5guC4reC4meC5g+C4iuC5ieC4q+C4meC4teC5ieC4o+C4reC4h+C4guC4',
  'reC4h+C4q+C4reC4nuC4seC4gScgfSwKICB7IGlkOidwdXJjaGFzZXMnLCBpYzon8J+bkicsIGxhYmVsOifguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcnLCAgICAgICAgc3ViOifguILguK3guIfguYDguILguYnguLLguKvguK3guJ7guLHg',
  'uIEg4Lij4Liy4LiE4LiyIOC4m+C4o+C4sOC4geC4seC4mSDguYHguKXguLDguKrguKXguLTguJsnIH0sCiAgeyBpZDonZmluYW5jZScsICAgaWM6J/Cfk5InLCBsYWJlbDon4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4ouC4q+C4rScsICAg',
  'ICAgc3ViOifguITguYjguLLguYDguIrguYjguLLguJfguLXguYjguYDguIHguYfguJrguYTguJTguYkgwrcg4LiE4LmI4Liy4LmE4LifIMK3IOC4hOC5iOC4suC4meC5ieC4syDCtyDguITguYjguLLguYDguJnguYfguJUgwrcg4Lig4Liy4Lip4Li1JywgdGFiOifg',
  'uKPguLLguKLguKPguLHguJot4LiI4LmI4Liy4LiiJyB9LAogIHsgaWQ6J2FjJywgICAgICAgIGljOifinYTvuI8nLCBsYWJlbDon4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJywgICAgICAgICAgICBzdWI6J+C4leC4suC4o+C4suC4h+C4peC5ieC4suC4h+C5geC4',
  'reC4o+C5jOC4o+C4suC4ouC4q+C5ieC4reC4hyAyNCDguKvguYnguK3guIcnLCAgICAgIHNlYzon4LiL4LmI4Lit4Lih4Lia4Liz4Lij4Li44LiHJywgdGFiOifguKXguYnguLLguIfguYHguK3guKPguYwnIH0sCiAgeyBpZDoncmVwYWlycycsICAgaWM6J/CflKcn',
  'LCBsYWJlbDon4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Liy4Lih4Lir4LmJ4Lit4LiHJywgICAgICBzdWI6J+C4h+C4suC4meC5geC4iOC5ieC4h+C4i+C5iOC4reC4oeC5geC4ouC4geC4leC4suC4oeC4q+C5ieC4reC4hycsIHRhYjon4LiL4LmI4Lit4Lih4Lir',
  '4LmJ4Lit4LiHJyB9LAogIHsgaWQ6J2J1aWxkaW5nJywgIGljOifwn4+iJywgbGFiZWw6J+C4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oScsICAgIHN1Yjon4LiH4Liy4LiZ4Liq4LmI4Lin4LiZ4LiB4Lil4Liy4LiH4LiC4Lit',
  '4LiH4Lit4Liy4LiE4Liy4LijJyB9LAogIHsgaWQ6J3Jvb21zJywgICAgIGljOifwn5qqJywgbGFiZWw6J+C4q+C5ieC4reC4h+C4nuC4seC4gScsICAgICAgICAgICAgIHN1Yjon4LiX4Liw4LmA4Lia4Li14Lii4LiZ4Lir4LmJ4Lit4LiH4LmB4Lil4Liw4Lib4Lij',
  '4Liw4Lin4Lix4LiV4Li04Lij4Liy4Lii4Lir4LmJ4Lit4LiHJywgICAgICAgc2VjOifguILguYnguK3guKHguLnguKUnIH0sCiAgeyBpZDoncmVwb3J0cycsICAgaWM6J/Cfk4gnLCBsYWJlbDon4Lij4Liy4Lii4LiH4Liy4LiZICYg4Liq4Liz4Lij4Lit4LiH4LiC',
  '4LmJ4Lit4Lih4Li54LilJywgc3ViOifguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguKPguLLguKLguKvguYnguK3guIcgwrcg4Lib4LiP4Li04LiX4Li04LiZ4LiH4Liy4LiZIMK3IOC4quC5iOC4h+C4reC4reC4geC4guC5ieC4reC4oeC4ueC4pScgfSwK',
  'ICB7IGlkOidzZXR0aW5ncycsICBpYzon4pqZ77iPJywgbGFiZWw6J+C4leC4seC5ieC4h+C4hOC5iOC4sicsICAgICAgICAgICAgICBzdWI6J+C4muC4seC4jeC4iuC4tSDCtyDguJjguLXguKEgwrcg4Lic4Li54LmJ4LmD4LiK4LmJIMK3IOC4peC4tOC4h+C4geC5',
  'jOC5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4mScsICAgc2VjOifguKPguLDguJrguJonIH0KXTsKCi8qIC0tLS0tLS0tLS0tLS0tLS0gQVBJIC0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKiDguIHguLjguI3guYHguIjguJfguLXguYjguIjguLDguYHguJnguJrg',
  'uYTguJvguIHguLHguJrguJfguLjguIHguITguLPguKrguLHguYjguIcg4oCUIOC4oeC4tSAyIOC4l+C4suC4h+C4quC4s+C4o+C4reC4h+C5gOC4nOC4t+C5iOC4reC4l+C4suC4h+C5geC4o+C4geC5hOC4oeC5iOC4oeC4siAqLwp2YXIgUkVTT0xWRURfS0VZID0g',
  'bnVsbDsKCmZ1bmN0aW9uIGFjY2Vzc0tleSgpewogIGlmIChSRVNPTFZFRF9LRVkgIT09IG51bGwpIHJldHVybiBSRVNPTFZFRF9LRVk7CiAgUkVTT0xWRURfS0VZID0gKHR5cGVvZiBBQ0NFU1NfS0VZID09PSAnc3RyaW5nJyAmJiBBQ0NFU1NfS0VZKSA/IEFDQ0VT',
  'U19LRVkgOiAnJzsKICByZXR1cm4gUkVTT0xWRURfS0VZOwp9CgovKiogdHJ1ZSDguJbguYnguLLguYDguJvguLTguJTguJTguYnguKfguKLguKXguLTguIfguIHguYzguJzguLnguYnguJTguLnguYHguKUg4oCUIOC5g+C4iuC5ieC5geC4l+C4meC4leC4seC4p+C5',
  'geC4m+C4oyBDQU5fRURJVCDguJXguKPguIcg4LmGIOC4l+C4teC5iOC4reC4suC4iOC5hOC4oeC5iOC4luC4ueC4geC4m+C4o+C4sOC4geC4suC4qCAqLwpmdW5jdGlvbiBjYW5FZGl0KCl7CiAgaWYgKHR5cGVvZiBDQU5fRURJVCAhPT0gJ3VuZGVmaW5lZCcpIHJl',
  'dHVybiAhIUNBTl9FRElUOwogIHJldHVybiAhIShTLmJvb3QgJiYgUy5ib290LmNhbkVkaXQpOwp9CgpmdW5jdGlvbiBjYWxsQXBpKGFjdGlvbiwgcGF5bG9hZCl7CiAgdmFyIGJvZHkgPSB7fTsKICBPYmplY3Qua2V5cyhwYXlsb2FkIHx8IHt9KS5mb3JFYWNoKGZ1',
  'bmN0aW9uKGspeyBib2R5W2tdID0gcGF5bG9hZFtrXTsgfSk7CiAgYm9keS5fa2V5ID0gYWNjZXNzS2V5KCk7CiAgLy8g4Lic4Li54LmJ4LmA4Lij4Li14Lii4LiB4Liq4LmI4LiHIF9zZXNzaW9uIOC4oeC4suC5gOC4reC4h+C5hOC4lOC5iSAo4LiV4Lit4LiZ4Lit',
  '4Lit4LiB4LiI4Liy4LiB4Lij4Liw4Lia4Lia4LiV4LmJ4Lit4LiH4LmD4LiK4LmJ4LiV4Lix4Lin4LmA4LiB4LmI4LiyKQogIGlmIChib2R5Ll9zZXNzaW9uID09PSB1bmRlZmluZWQpIGJvZHkuX3Nlc3Npb24gPSAodHlwZW9mIEFVVEggIT09ICd1bmRlZmluZWQn',
  'ID8gQVVUSC5zZXNzaW9uIDogJycpIHx8ICcnOwogIHBheWxvYWQgPSBib2R5OwogIHZhciBtdXRhdGluZyA9IENMSUVOVF9NVVRBVElORy50ZXN0KGFjdGlvbik7CiAgaWYgKG11dGF0aW5nKSBzeW5jU2V0KCdzYXZpbmcnKTsKCiAgcmV0dXJuIG5ldyBQcm9taXNl',
  'KGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7CiAgICB2YXIgb2sgPSBmdW5jdGlvbihyZXMpewogICAgICBpZiAoIXJlcykgeyBpZiAobXV0YXRpbmcpIHN5bmNTZXQoJ29mZmxpbmUnKTsgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoJ+C5hOC4oeC5iOC5hOC4lOC5',
  'ieC4o+C4seC4muC4guC5ieC4reC4oeC4ueC4peC4iOC4suC4geC5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jCcpKTsgfQogICAgICBpZiAocmVzLm9rKSB7CiAgICAgICAgaWYgKG11dGF0aW5nKSB7IG1hcmtTZWxmQ2hhbmdlKCk7IHN5bmNTZXQoJ3Nh',
  'dmVkJyk7IH0KICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXMuZGF0YSk7CiAgICAgIH0KICAgICAgLy8g4Lir4Lih4LiU4Lit4Liy4Lii4Li44Lij4Liw4Lir4Lin4LmI4Liy4LiH4LmD4LiK4LmJ4LiH4Liy4LiZIOKAlCDguJ7guLLguIHguKXguLHguJrguYTguJvg',
  'uKvguJnguYnguLLguKXguYfguK3guIHguK3guLTguJnguYHguJfguJnguJfguLXguYjguIjguLDguILguLbguYnguJnguILguYnguK3guITguKfguLLguKHguITguYnguLLguIfguYTguKfguYnguYDguInguKIg4LmGCiAgICAgIGlmIChyZXMubmVlZExvZ2luICYm',
  'IHR5cGVvZiBvblNlc3Npb25Mb3N0ID09PSAnZnVuY3Rpb24nKSBvblNlc3Npb25Mb3N0KCk7CiAgICAgIGlmIChtdXRhdGluZykgc3luY1NldCgnZXJyb3InLCByZXMuZXJyb3IpOwogICAgICByZWplY3QobmV3IEVycm9yKHJlcy5lcnJvcikpOwogICAgfTsKICAg',
  'IHZhciBmYWlsID0gZnVuY3Rpb24oZXJyKXsKICAgICAgLy8g4LmA4LiZ4LmH4LiV4Liq4Liw4LiU4Li44LiUIOKAlCDguILguK3guIfguJfguLXguYjguIHguKPguK3guIHguYTguKfguYnguKLguLHguIfguK3guKLguLnguYjguYPguJnguJ/guK3guKPguYzguKEg',
  '4LmE4Lih4LmI4Lir4Liy4Lii4LmE4Lib4LmE4Lir4LiZCiAgICAgIGlmIChtdXRhdGluZykgc3luY1NldChpc09mZmxpbmVFcnJvcihlcnIpID8gJ29mZmxpbmUnIDogJ2Vycm9yJywgKGVyciAmJiBlcnIubWVzc2FnZSkgfHwgU3RyaW5nKGVycikpOwogICAgICBy',
  'ZWplY3QoZXJyKTsKICAgIH07CiAgICBzZXJ2ZXJDYWxsKGFjdGlvbiwgcGF5bG9hZCB8fCB7fSwgb2ssIGZhaWwpOwogIH0pOwp9CgovKioKICog4Liq4LmI4LiH4LiE4Liz4Liq4Lix4LmI4LiH4LmE4Lib4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM',
  'IOKAlCDguKvguJnguYnguLLguYDguKfguYfguJrguIrguLjguJTguYDguJTguLXguKLguKfguIHguLHguJnguYPguIrguYnguYTguJTguYnguJfguLHguYnguIfguKrguK3guIfguJfguLXguYgKICogICDguYDguJvguLTguJTguIjguLLguIEgQXBwcyBTY3JpcHQg',
  '4oaSIGdvb2dsZS5zY3JpcHQucnVuCiAqICAg4LmA4Lib4Li04LiU4LiI4Liy4LiBIENsb3VkZmxhcmUgIOKGkiBQT1NUIC9hcGkgKOC5hOC4lOC5ieC4nOC4peC4peC4seC4nuC4mOC5jOC4o+C4ueC4m+C5geC4muC4muC5gOC4lOC4teC4ouC4p+C4geC4seC4meC5',
  'gOC4m+C5iuC4sCkKICovCmZ1bmN0aW9uIHNlcnZlckNhbGwoYWN0aW9uLCBwYXlsb2FkLCBvaywgZmFpbCl7CiAgaWYgKHdpbmRvdy5nb29nbGUgJiYgZ29vZ2xlLnNjcmlwdCAmJiBnb29nbGUuc2NyaXB0LnJ1bikgewogICAgZ29vZ2xlLnNjcmlwdC5ydW4ud2l0',
  'aFN1Y2Nlc3NIYW5kbGVyKG9rKS53aXRoRmFpbHVyZUhhbmRsZXIoZmFpbCkuYXBpKGFjdGlvbiwgcGF5bG9hZCk7CiAgICByZXR1cm47CiAgfQogIGZldGNoKCcvYXBpJywgewogICAgbWV0aG9kOiAnUE9TVCcsCiAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUn',
  'OiAnYXBwbGljYXRpb24vanNvbicgfSwKICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgYWN0aW9uOiBhY3Rpb24sIHBheWxvYWQ6IHBheWxvYWQgfSksCiAgICBjcmVkZW50aWFsczogJ3NhbWUtb3JpZ2luJwogIH0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICBpZiAo',
  'IXIub2sgJiYgci5zdGF0dXMgIT09IDIwMCkgdGhyb3cgbmV3IEVycm9yKCfguYDguIrguLfguYjguK3guKHguJXguYjguK3guYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYzguYTguKHguYjguKrguLPguYDguKPguYfguIggKEhUVFAgJyArIHIuc3RhdHVz',
  'ICsgJyknKTsKICAgIHJldHVybiByLmpzb24oKTsKICB9KS50aGVuKG9rLCBmdW5jdGlvbihlKXsgZmFpbChlICYmIGUubWVzc2FnZSA/IGUgOiBuZXcgRXJyb3IoJ25ldHdvcms6ICcgKyBlKSk7IH0pOwp9CgovKiog4LmA4Lij4Li14Lii4LiB4LmA4Lih4Li34LmI',
  '4Lit4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4Lia4Lit4LiB4Lin4LmI4Liy4Lii4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJ4Lil4LmH4Lit4LiB4Lit4Li04LiZICjguKvguKHguJTguK3guLLguKLguLggLyDguJbguLnguIHguYPguKvguYnguK3g',
  'uK3guIHguIjguLLguIHguKPguLDguJrguJopICovCnZhciBzZXNzaW9uTG9zdEF0ID0gMDsKZnVuY3Rpb24gb25TZXNzaW9uTG9zdCgpewogIGlmIChEYXRlLm5vdygpIC0gc2Vzc2lvbkxvc3RBdCA8IDMwMDApIHJldHVybjsgICAvLyDguKvguKXguLLguKLguITg',
  'uLPguKrguLHguYjguIfguJ7guKPguYnguK3guKHguIHguLHguJnguIHguYfguYDguJTguYnguIfguITguKPguLHguYnguIfguYDguJTguLXguKLguKfguJ7guK0KICBzZXNzaW9uTG9zdEF0ID0gRGF0ZS5ub3coKTsKICBzYXZlU2Vzc2lvbignJyk7CiAgY2xvc2VN',
  'b2RhbCgpOwogIGlmIChBVVRILmRldmljZSkgc2hvd1BpbigpOyBlbHNlIHNob3dMb2dpbign4Lir4Lih4LiU4LmA4Lin4Lil4Liy4LmD4LiK4LmJ4LiH4Liy4LiZIOC4geC4o+C4uOC4k+C4suC5gOC4guC5ieC4suC4quC4ueC5iOC4o+C4sOC4muC4muC4reC4teC4',
  'geC4hOC4o+C4seC5ieC4hycpOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIGJvb3QgJiByb3V0aW5nIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIGJvb3QoKXsKICAvLyDguJfguLLguJjguLXguKHguIHguYjguK3guJnguK3guKLguYjguLLguIfguK3guLfg',
  'uYjguJkg4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4LmA4Lir4LmH4LiZ4Lir4LiZ4LmJ4Liy4LiI4Lit4LiB4Lij4Liw4Lie4Lij4Li04Lia4LiC4Liy4Lin4LiV4Lit4LiZ4LmA4Lib4Li04LiUCiAgYXBwbHlUaGVtZShsc0dldChMU19USEVNRSkgfHwgKHR5cGVv',
  'ZiBJTklUX1RIRU1FID09PSAnc3RyaW5nJyA/IElOSVRfVEhFTUUgOiAn4LiV4Liy4Lih4LmA4LiE4Lij4Li34LmI4Lit4LiHJykpOwogIC8vIGF1dGhHYXRlIOC4iOC4sOC4reC5iOC4suC4meC4geC4uOC4jeC5geC4iOC4iOC4suC4gSBVUkwg4LiC4Lit4LiH4Lir',
  '4LiZ4LmJ4Liy4LmB4Lih4LmI4LmD4Lir4LmJ4LiU4LmJ4Lin4LiiIOC4luC5ieC4suC4leC4seC4p+C5geC4m+C4o+C5hOC4oeC5iOC4oeC4suC4luC4tuC4h+C4q+C4meC5ieC4suC5gOC4p+C5h+C4mgogIGF1dGhHYXRlKCk7Cn0KCmZ1bmN0aW9uIGJvb3ROb3co',
  'KXsKICBjYWxsQXBpKCdhcHAuYm9vdHN0cmFwJykudGhlbihmdW5jdGlvbihiKXsKICAgIFMuYm9vdCA9IGI7CiAgICByZW5kZXJOYXYoKTsKICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXZGb290JykuaW5uZXJIVE1MID0gbmF2Rm9vdEh0bWwoYik7CiAg',
  'ICBTLnZlcnNpb24gPSBiLnZlcnNpb24gfHwgMDsKICAgIGlmICghYi5jYW5FZGl0KSBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ3JlYWRvbmx5Jyk7CiAgICAvLyDguJjguLXguKHguILguK3guIfguYDguITguKPguLfguYjguK3guIfguJnguLXguYnguIrg',
  'uJnguLDguYDguKrguKHguK0g4LiW4LmJ4Liy4Lii4Lix4LiH4LmE4Lih4LmI4LmA4LiE4Lii4LiV4Lix4LmJ4LiH4LiE4LmI4Lit4Lii4LmD4LiK4LmJ4LiC4Lit4LiH4Lij4Liw4Lia4LiaCiAgICBhcHBseVRoZW1lKGN1cnJlbnRUaGVtZSgpKTsKICAgIGdvKHN0',
  'YXJ0UGFnZShiKSk7CiAgICByZWZyZXNoQWxlcnRzKCk7CiAgICBzdGFydFBvbGxpbmcoYi5zZXR0aW5ncyAmJiBiLnNldHRpbmdzLnJlZnJlc2hTZWNvbmRzKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aWV3',
  'JykuaW5uZXJIVE1MID0KICAgICAgJzxkaXYgY2xhc3M9ImNhcmQiPjxkaXYgY2xhc3M9ImNhcmQtYiI+PGgzPuC5gOC4iuC4t+C5iOC4reC4oeC4leC5iOC4reC4o+C4sOC4muC4muC5hOC4oeC5iOC4quC4s+C5gOC4o+C5h+C4iDwvaDM+JyArCiAgICAgICc8cCBj',
  'bGFzcz0ibXV0ZWQiPicgKyBlc2MoZS5tZXNzYWdlfHxlKSArICc8L3A+JyArCiAgICAgICc8cCBjbGFzcz0iZnMxMyI+4LiV4Lij4Lin4LiI4Liq4Lit4Lia4Lin4LmI4LiyOiDguYDguJvguLTguJTguIrguLXguJXguYHguKXguYnguKfguKPguLHguJkgPGI+4LmA',
  '4Lih4LiZ4Li5IPCfj6IgVGhlIE0gQ29ybmVyIEFQIOKGkiDwn5qAIOC4leC4tOC4lOC4leC4seC5ieC4h+C4l+C4seC5ieC4h+C4q+C4oeC4lOC5g+C4meC4hOC4peC4tOC4geC5gOC4lOC4teC4ouC4pzwvYj4gJyArCiAgICAgICfguYDguKPguLXguKLguJrguKPg',
  'uYnguK3guKLguYHguKXguYnguKc8L3A+PC9kaXY+PC9kaXY+JzsKICB9KTsKfQoKLyoqIOC4q+C4meC5ieC4suC5geC4o+C4geC4l+C4teC5iOC4iOC4sOC5gOC4m+C4tOC4lCDigJQg4LiV4Liy4Lih4LiX4Li14LmI4LiV4Lix4LmJ4LiH4LmE4Lin4LmJIOC5geC4',
  'leC5iOC4luC5ieC4suC4oeC4tSAjaGFzaCDguYPguJnguKXguLTguIfguIHguYzguYPguKvguYkgaGFzaCDguIrguJnguLAgKi8KZnVuY3Rpb24gc3RhcnRQYWdlKGIpewogIHZhciBoYXNoID0gKGxvY2F0aW9uLmhhc2ggfHwgJycpLnJlcGxhY2UoJyMnLCcnKTsK',
  'ICBpZiAoUEFHRVMuc29tZShmdW5jdGlvbihwKXsgcmV0dXJuIHAuaWQgPT09IGhhc2g7IH0pKSByZXR1cm4gaGFzaDsKICB2YXIgbWFwID0gewogICAgJ+C5geC4lOC4iuC4muC4reC4o+C5jOC4lCc6J2Rhc2hib2FyZCcsICfguKPguLLguKLguIHguLLguKPguKrg',
  'uKPguLjguJvguKPguKfguKEnOidkZWJ0TWFpbicsICfguKvguJnguLXguYnguKrguLTguJknOidkZWJ0U3ViJywKICAgICfguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcnOidwdXJjaGFzZXMnLCAn4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV',
  '4Liy4Lih4Lir4LmJ4Lit4LiHJzoncmVwYWlycycKICB9OwogIHJldHVybiBtYXBbYi5zZXR0aW5ncyAmJiBiLnNldHRpbmdzLnN0YXJ0UGFnZV0gfHwgJ2Rhc2hib2FyZCc7Cn0KCi8qKiDguILguYnguK3guITguKfguLLguKHguKHguLjguKHguKXguYjguLLguIfg',
  'uIvguYnguLLguKIg4oCUIOC5gOC4p+C4reC4o+C5jOC4iuC4seC4meC5gOC4p+C5h+C4muC5geC4reC4m+C4iOC4sOC5gOC4guC4teC4ouC4meC4l+C4seC4muC4n+C4seC4h+C4geC5jOC4iuC4seC4meC4meC4teC5iSAqLwpmdW5jdGlvbiBuYXZGb290SHRtbChi',
  'KXsKICB2YXIgdSA9IGIudXNlciB8fCB7fTsKICByZXR1cm4gJzxiIHN0eWxlPSJjb2xvcjojYzdkMGUwIj4nICsgZXNjKHUubmFtZSB8fCB1LmxhYmVsIHx8ICcnKSArICc8L2I+JyArCiAgICAodS51c2VybmFtZSA/ICcgPHNwYW4gc3R5bGU9Im9wYWNpdHk6Ljci',
  'PkAnICsgZXNjKHUudXNlcm5hbWUpICsgJzwvc3Bhbj4nIDogJycpICsKICAgICc8YnI+PHNwYW4gc3R5bGU9Im9wYWNpdHk6LjgiPicgKyBlc2ModS5yb2xlICYmIHUucm9sZSAhPT0gJ25vbmUnID8gdS5yb2xlIDogdS52aWEgfHwgJycpICsgJzwvc3Bhbj4nICsK',
  'ICAgIChiLnNoZWV0VXJsID8gJzxicj48YSBocmVmPSInICsgZXNjKHNhZmVVcmwoYi5zaGVldFVybCkpICsgJyIgdGFyZ2V0PSJfYmxhbmsiIHJlbD0ibm9vcGVuZXIiPuC5gOC4m+C4tOC4lCBHb29nbGUgU2hlZXQg4oaXPC9hPicgOiAnJykgKwogICAgKHUuc2ln',
  'bmVkSW4gJiYgdS51c2VybmFtZQogICAgICA/ICc8YnI+PGEgaHJlZj0iamF2YXNjcmlwdDp2b2lkKDApIiBvbmNsaWNrPSJjb25maXJtTG9nb3V0KCkiPuC4reC4reC4geC4iOC4suC4geC4o+C4sOC4muC4mjwvYT4nCiAgICAgIDogJycpOwp9CgpmdW5jdGlvbiBy',
  'ZW5kZXJOYXYoKXsKICB2YXIgaHRtbCA9ICcnOwogIFBBR0VTLmZvckVhY2goZnVuY3Rpb24ocCl7CiAgICBpZiAocC5zZWMpIGh0bWwgKz0gJzxkaXYgY2xhc3M9Im5hdi1zZWMiPicgKyBwLnNlYyArICc8L2Rpdj4nOwogICAgaHRtbCArPSAnPGJ1dHRvbiBjbGFz',
  'cz0ibmF2LWl0ZW0iIGlkPSJuYXYtJyArIHAuaWQgKyAnIiBvbmNsaWNrPSJnbygnICsganNxKHAuaWQpICsgJykiPicgKwogICAgICAgICAgICAgICc8c3BhbiBjbGFzcz0iaWMiPicgKyBwLmljICsgJzwvc3Bhbj48c3Bhbj4nICsgcC5sYWJlbCArICc8L3NwYW4+',
  'JyArCiAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPSJiYWRnZSIgaWQ9ImJhZGdlLScgKyBwLmlkICsgJyIgc3R5bGU9ImRpc3BsYXk6bm9uZSI+PC9zcGFuPicgKwogICAgICAgICAgICAnPC9idXR0b24+JzsKICB9KTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJ',
  'ZCgnbmF2TGlzdCcpLmlubmVySFRNTCA9IGh0bWw7CiAgcmVuZGVyVGFicygpOwp9CgovKioKICog4LmB4LiW4Lia4Lil4LmI4Liy4LiH4Liq4Liz4Lir4Lij4Lix4Lia4Lih4Li34Lit4LiW4Li34LitIOKAlCDguYPguIrguYkgUEFHRVMg4LiK4Li44LiU4LmA4LiU',
  '4Li14Lii4Lin4LiB4Lix4Lia4LmA4Lih4LiZ4Li54LiC4LmJ4Liy4LiHIOC5geC4peC4sOC5gOC4o+C4teC4ouC4gSBnbygpIOC4leC4seC4p+C5gOC4lOC4teC4ouC4p+C4geC4seC4mQogKiDguYTguKHguYjguYTguJTguYnguYDguJvguYfguJnguKvguJnguYng',
  'uLLguIjguK3guITguJnguKXguLDguIrguLjguJQg4LmA4Lib4LmH4LiZ4LmB4LiE4LmI4LiX4Li14LmI4Lin4Liy4LiH4Lib4Li44LmI4Lih4Lit4Li14LiB4LiX4Li14LmI4Lir4LiZ4Li24LmI4LiH4LiC4Lit4LiH4LiC4LmJ4Lit4Lih4Li54Lil4LmA4LiU4Li0',
  '4LihCiAqIOC4m+C4uOC5iOC4oeC4quC4uOC4lOC4l+C5ieC4suC4ouC5gOC4m+C4tOC4lOC4peC4tOC5ieC4meC4iuC4seC4geC5gOC4oeC4meC4ueC5gOC4lOC4tOC4oSDguIjguLDguYTguJTguYnguYDguILguYnguLLguJbguLbguIfguKvguJnguYnguLLguJfg',
  'uLXguYjguYDguKvguKXguLfguK3guYTguJTguYnguITguKPguJoKICovCmZ1bmN0aW9uIHJlbmRlclRhYnMoKXsKICB2YXIgYmFyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhYkJhcicpOwogIGlmICghYmFyKSByZXR1cm47CiAgdmFyIGh0bWwgPSBQQUdF',
  'Uy5maWx0ZXIoZnVuY3Rpb24ocCl7IHJldHVybiBwLnRhYjsgfSkubWFwKGZ1bmN0aW9uKHApewogICAgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJ0YWIiIGlkPSJ0YWItJyArIHAuaWQgKyAnIiBvbmNsaWNrPSJnbygnICsganNxKHAuaWQpICsgJykiIGFyaWEtbGFi',
  'ZWw9IicgKyBlc2MocC5sYWJlbCkgKyAnIj4nICsKICAgICAgICAgICAgICc8c3BhbiBjbGFzcz0iaWMiPicgKyBwLmljICsgJzwvc3Bhbj48c3BhbiBjbGFzcz0idGwiPicgKyBlc2MocC50YWIpICsgJzwvc3Bhbj4nICsKICAgICAgICAgICAgICc8c3BhbiBjbGFz',
  'cz0iYmFkZ2UiIGlkPSJ0YWJiYWRnZS0nICsgcC5pZCArICciIHN0eWxlPSJkaXNwbGF5Om5vbmUiPjwvc3Bhbj4nICsKICAgICAgICAgICAnPC9idXR0b24+JzsKICB9KS5qb2luKCcnKTsKICBiYXIuaW5uZXJIVE1MID0gaHRtbCArCiAgICAnPGJ1dHRvbiBjbGFz',
  'cz0idGFiIiBpZD0idGFiLW1vcmUiIG9uY2xpY2s9InRvZ2dsZU5hdigpIiBhcmlhLWxhYmVsPSLguYDguKHguJnguLnguJfguLHguYnguIfguKvguKHguJQiPicgKwogICAgICAnPHNwYW4gY2xhc3M9ImljIj7imLA8L3NwYW4+PHNwYW4gY2xhc3M9InRsIj7guYDg',
  'uJ7guLTguYjguKHguYDguJXguLTguKE8L3NwYW4+JyArCiAgICAgICc8c3BhbiBjbGFzcz0iYmFkZ2UiIGlkPSJ0YWJiYWRnZS1tb3JlIiBzdHlsZT0iZGlzcGxheTpub25lIj48L3NwYW4+JyArCiAgICAnPC9idXR0b24+JzsKfQoKZnVuY3Rpb24gZ28ocGFnZSl7',
  'CiAgUy5wYWdlID0gcGFnZTsKICBTLnBhcmFtcyA9IHt9OwogIGxvY2F0aW9uLmhhc2ggPSBwYWdlOwogIHZhciBtZXRhID0gUEFHRVMuZmlsdGVyKGZ1bmN0aW9uKHApe3JldHVybiBwLmlkPT09cGFnZTt9KVswXSB8fCBQQUdFU1swXTsKICBkb2N1bWVudC5nZXRF',
  'bGVtZW50QnlJZCgncGFnZVRpdGxlJykudGV4dENvbnRlbnQgPSBtZXRhLmxhYmVsOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlU3ViJykudGV4dENvbnRlbnQgPSBtZXRhLnN1YjsKICBQQUdFUy5mb3JFYWNoKGZ1bmN0aW9uKHApewogICAgdmFyIGVs',
  'ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdi0nICsgcC5pZCk7CiAgICBpZiAoZWwpIGVsLmNsYXNzTGlzdC50b2dnbGUoJ29uJywgcC5pZCA9PT0gcGFnZSk7CiAgICB2YXIgdGFiID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhYi0nICsgcC5pZCk7',
  'CiAgICBpZiAodGFiKSB0YWIuY2xhc3NMaXN0LnRvZ2dsZSgnb24nLCBwLmlkID09PSBwYWdlKTsKICB9KTsKICAvLyDguKvguJnguYnguLLguJfguLXguYjguYTguKHguYjguKHguLXguYHguJfguYfguJrguILguK3guIfguJXguLHguKfguYDguK3guIcg4LmD4Lir',
  '4LmJ4Lib4Li44LmI4LihICLguYDguJ7guLTguYjguKHguYDguJXguLTguKEiIOC4quC4p+C5iOC4suC4h+C5geC4l+C4mSDguIjguLDguYTguJTguYnguKPguLnguYnguKfguYjguLLguK3guKLguLnguYjguJXguKPguIfguYTguKvguJkKICB2YXIgbW9yZSA9IGRv',
  'Y3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YWItbW9yZScpOwogIGlmIChtb3JlKSBtb3JlLmNsYXNzTGlzdC50b2dnbGUoJ29uJywgIVBBR0VTLnNvbWUoZnVuY3Rpb24ocCl7IHJldHVybiBwLnRhYiAmJiBwLmlkID09PSBwYWdlOyB9KSk7CiAgZG9jdW1lbnQuZ2V0',
  'RWxlbWVudEJ5SWQoJ25hdicpLmNsYXNzTGlzdC5yZW1vdmUoJ29wZW4nKTsKICByZW1vdmVTY3JpbSgpOwogIGxvYWQoKTsKfQoKZnVuY3Rpb24gcmVmcmVzaCgpeyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7IH0KCmZ1bmN0aW9uIHNldFllYXIoeSl7CiAgUy55ZWFy',
  'ID0geTsKICBsb2FkKCk7Cn0KCi8qKgogKiDguYLguKvguKXguJTguILguYnguK3guKHguLnguKXguILguK3guIfguKvguJnguYnguLLguJvguLHguIjguIjguLjguJrguLHguJkKICoKICogQHBhcmFtIHt7cXVpZXQ6Ym9vbGVhbn09fSBvcHRzCiAqICAgcXVpZXQg',
  'PSDguIvguLTguIfguIHguYzguYDguIfguLXguKLguJog4LmGIOC5gOC4muC4t+C5ieC4reC4h+C4q+C4peC4seC4hyDguYTguKHguYjguKXguYnguLLguIfguKvguJnguYnguLLguYDguJvguYfguJnguKfguIfguIHguKXguKHguKvguKHguLjguJkg4LmB4Lil4Liw',
  '4LiE4Li34LiZ4LiV4Liz4LmB4Lir4LiZ4LmI4LiH4LiX4Li14LmI4LmA4Lil4Li34LmI4Lit4LiZ4LiE4LmJ4Liy4LiH4LmE4Lin4LmJCiAqICAgICAgICAgICDguYPguIrguYnguKvguKXguLHguIfguIHguJTguJrguLHguJnguJfguLbguIEg4LmB4Lil4Liw4LiV',
  '4Lit4LiZ4Lie4Lia4Lin4LmI4Liy4Lih4Li14LiE4LiZ4LmB4LiB4LmJ4LiC4LmJ4Lit4Lih4Li54Lil4LiI4Liy4LiB4LiX4Li14LmI4Lit4Li34LmI4LiZCiAqICAgICAgICAgICDguYDguJ7guLfguYjguK3guYPguKvguYnguKvguJnguYnguLLguIjguK3guJng',
  'uLTguYjguIfguJfguLXguYjguKrguLjguJQg4LmE4Lih4LmI4LiB4Lij4Liw4Lie4Lij4Li04Lia4LmB4Lil4Liw4LmE4Lih4LmI4LmA4LiU4LmJ4LiH4LiB4Lil4Lix4Lia4LmE4Lib4Lia4LiZ4Liq4Li44LiUCiAqLwpmdW5jdGlvbiBsb2FkKG9wdHMpewogIG9w',
  'dHMgPSAob3B0cyA9PT0gdHJ1ZSkgPyB7fSA6IChvcHRzIHx8IHt9KTsgICAgIC8vIOC5gOC4nOC4t+C5iOC4reC5guC4hOC5ieC4lOC5gOC4geC5iOC4suC4l+C4teC5iOC5gOC4o+C4teC4ouC4gSBsb2FkKHRydWUpCiAgdmFyIHF1aWV0ID0gISFvcHRzLnF1aWV0',
  'OwogIHZhciB2aWV3ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZpZXcnKTsKICB2YXIgciA9IFJPVVRFU1tTLnBhZ2VdOwogIGlmICghcikgeyB2aWV3LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4LmE4Lih4LmI4Lie4Lia4Lir4LiZ4LmJ4Liy',
  '4LiZ4Li14LmJPC9kaXY+JzsgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpOyB9CgogIGlmICghcXVpZXQpIHsKICAgIHZpZXcuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPjxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+PC9k',
  'aXY+4LiB4Liz4Lil4Lix4LiH4LmC4Lir4Lil4LiU4LiC4LmJ4Lit4Lih4Li54Lil4oCmPC9kaXY+JzsKICB9IGVsc2UgewogICAgc3luY1NldCgnc3luY2luZycpOwogIH0KCiAgdmFyIGtlZXAgPSBxdWlldCA/IHNuYXBzaG90VmlldygpIDogbnVsbDsKCiAgcmV0',
  'dXJuIHIubG9hZCgpLnRoZW4oZnVuY3Rpb24oZGF0YSl7CiAgICBTLmNhY2hlW1MucGFnZV0gPSBkYXRhOwoKICAgIC8vIOC4q+C4meC5ieC4suC5geC4leC5iOC4peC4sOC4q+C4meC5ieC4suC4oeC4teC4m+C4teC5g+C4q+C5ieC5gOC4peC4t+C4reC4geC5hOC4',
  'oeC5iOC5gOC4l+C5iOC4suC4geC4seC4mSAo4LmA4LiK4LmI4LiZ4LiL4Li34LmJ4Lit4LiC4Lit4LiH4Lih4Li14LiW4Li24LiH4Lib4Li1IDI1NjMg4LmB4LiV4LmI4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4ouC4oeC4teC5geC4hOC5',
  'iOC4m+C4teC4peC5iOC4suC4quC4uOC4lCkKICAgIC8vIOC4luC5ieC4suC4m+C4teC4l+C4teC5iOC4hOC5ieC4suC4h+C4reC4ouC4ueC5iOC5hOC4oeC5iOC4oeC4teC5g+C4meC4q+C4meC5ieC4suC4meC4teC5iSBzeW5jWWVhck9wdGlvbnMg4LiI4Liw4Lib',
  '4Lij4Lix4Lia4Lib4Li14LmD4Lir4LmJIOKAlCDguYHguJXguYjguILguYnguK3guKHguLnguKXguJfguLXguYjguYDguJ7guLTguYjguIfguJTguLbguIfguKHguLIKICAgIC8vIOC5gOC4m+C5h+C4meC4guC4reC4h+C4m+C4teC5gOC4geC5iOC4siDguKrguYjg',
  'uKfguJnguJvguYnguLLguKLguIHguLPguIHguLHguJrguYPguIrguYnguJvguLXguYPguKvguKHguYgg4LiB4Lil4Liy4Lii4LmA4Lib4LmH4LiZ4Lia4Lit4LiB4Lin4LmI4LiyICLguKLguK3guJTguIvguLfguYnguK0g4Lib4Li1IDIwMjYgPSAwIOC4muC4suC4',
  'lyIKICAgIC8vIOC4l+C4seC5ieC4h+C4l+C4teC5iOC4m+C4teC4meC4seC5ieC4meC4oeC4teC4ouC4reC4lOC4iOC4o+C4tOC4hyDigJQg4LiV4LmJ4Lit4LiH4LiU4Li24LiH4LmD4Lir4Lih4LmI4LmD4Lir4LmJ4LiV4Lij4LiH4LiB4Lix4Lia4Lib4Li14LiX',
  '4Li14LmI4Lib4Lij4Lix4Lia4LmB4Lil4LmJ4LinCiAgICB2YXIgeWVhckJlZm9yZSA9IFN0cmluZyhTLnllYXIpOwogICAgc3luY1llYXJPcHRpb25zKGRhdGEueWVhcnMgfHwgZGF0YS5hdmFpbGFibGUgfHwgW10pOwogICAgaWYgKFN0cmluZyhTLnllYXIpICE9',
  'PSB5ZWFyQmVmb3JlICYmICFvcHRzLl9yZXRyaWVkKSB7CiAgICAgIHJldHVybiBsb2FkKHsgcXVpZXQ6IHF1aWV0LCBfcmV0cmllZDogdHJ1ZSB9KTsKICAgIH0KCiAgICB2aWV3LmlubmVySFRNTCA9IHIucmVuZGVyKGRhdGEpOwogICAgbGFiZWxDZWxscyh2aWV3',
  'KTsKICAgIGFwcGx5UmVhZE9ubHkodmlldyk7CiAgICBpZiAoci5hZnRlcikgci5hZnRlcihkYXRhKTsKICAgIGlmIChrZWVwKSByZXN0b3JlVmlldyhrZWVwKTsKICAgIGlmIChxdWlldCkgc3luY1NldCgnc3luY2VkJyk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7',
  'CiAgICBpZiAocXVpZXQpIHsgICAgICAgICAgICAgICAgICAgICAgIC8vIOC4i+C4tOC4h+C4geC5jOC5gOC4muC4t+C5ieC4reC4h+C4q+C4peC4seC4h+C4nuC4peC4suC4lCDigJQg4Lit4Lii4LmI4Liy4LiX4Li04LmJ4LiH4LiC4Lit4LiH4LiX4Li14LmI4LmA',
  '4Lir4LmH4LiZ4Lit4Lii4Li54LmICiAgICAgIHN5bmNTZXQoaXNPZmZsaW5lRXJyb3IoZSkgPyAnb2ZmbGluZScgOiAnZXJyb3InLCBlLm1lc3NhZ2UgfHwgZSk7CiAgICAgIHJldHVybjsKICAgIH0KICAgIHZpZXcuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9ImNh',
  'cmQiPjxkaXYgY2xhc3M9ImNhcmQtYiI+PGgzPuC5guC4q+C4peC4lOC4guC5ieC4reC4oeC4ueC4peC5hOC4oeC5iOC4quC4s+C5gOC4o+C5h+C4iDwvaDM+JyArCiAgICAgICAgICAgICAgICAgICAgICc8cCBjbGFzcz0ibXV0ZWQiPicgKyBlc2MoZS5tZXNzYWdl',
  'fHxlKSArICc8L3A+JyArCiAgICAgICAgICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImxvYWQoKSI+4Lil4Lit4LiH4LmD4Lir4Lih4LmIPC9idXR0b24+PC9kaXY+PC9kaXY+JzsKICB9KTsKfQoKLyoqIOC4iOC4s+C4quC4oOC4suC4',
  'nuC4q+C4meC5ieC4suC4iOC4reC5hOC4p+C5ieC4geC5iOC4reC4meC4p+C4suC4lOC5g+C4q+C4oeC5iCDguYDguJ7guLfguYjguK3guYPguKvguYnguJzguLnguYnguYPguIrguYnguKPguLnguYnguKrguLbguIHguKfguYjguLLguKvguJnguYnguLLguYTguKHg',
  'uYjguYTguJTguYnguJbguLnguIHguYLguKvguKXguJTguYPguKvguKHguYggKi8KZnVuY3Rpb24gc25hcHNob3RWaWV3KCl7CiAgdmFyIG9wZW4gPSBbXTsKICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYmlsbC1saW5lcycpLmZvckVhY2goZnVuY3Rpb24o',
  'ZWwpewogICAgaWYgKCFlbC5oaWRkZW4pIG9wZW4ucHVzaChlbC5pZCk7CiAgfSk7CiAgcmV0dXJuIHsgeTogd2luZG93LnNjcm9sbFkgfHwgMCwgb3Blbjogb3BlbiB9Owp9CgpmdW5jdGlvbiByZXN0b3JlVmlldyhrZWVwKXsKICBrZWVwLm9wZW4uZm9yRWFjaChm',
  'dW5jdGlvbihpZCl7CiAgICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7CiAgICBpZiAoZWwpIHsgZWwuaGlkZGVuID0gZmFsc2U7IHZhciBiID0gZWwucHJldmlvdXNFbGVtZW50U2libGluZzsKICAgICAgICAgICAgICBpZiAoYikgYi50ZXh0',
  'Q29udGVudCA9IGIudGV4dENvbnRlbnQucmVwbGFjZSgn4pa+JywgJ+KWtCcpOyB9CiAgfSk7CiAgaWYgKGtlZXAueSkgd2luZG93LnNjcm9sbFRvKDAsIGtlZXAueSk7Cn0KCi8qKiDguYDguJXguLTguKHguJXguLHguKfguYDguKXguLfguK3guIHguJvguLXguYPg',
  'uJnguYHguJbguJrguJrguJnguYPguKvguYnguJXguKPguIfguIHguLHguJrguILguYnguK3guKHguLnguKXguIjguKPguLTguIfguILguK3guIfguKvguJnguYnguLLguJnguLHguYnguJkgKi8KZnVuY3Rpb24gc3luY1llYXJPcHRpb25zKHllYXJzKXsKICB2YXIg',
  'c2VsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3llYXJTZWwnKTsKICB2YXIgbGlzdCA9ICh5ZWFycyB8fCBbXSkuc2xpY2UoKS5zb3J0KGZ1bmN0aW9uKGEsYil7cmV0dXJuIGItYTt9KTsKICB2YXIgY3VyID0gbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpOwog',
  'IGlmIChsaXN0LmluZGV4T2YoY3VyKSA8IDApIGxpc3QudW5zaGlmdChjdXIpOwogIHZhciBodG1sID0gJzxvcHRpb24gdmFsdWU9ImFsbCI+4LiX4Li44LiB4Lib4Li1PC9vcHRpb24+JzsKICBsaXN0LmZvckVhY2goZnVuY3Rpb24oeSl7CiAgICAvLyDguITguYjg',
  'uLLguYPguJkgb3B0aW9uIOC5gOC4m+C5h+C4mSDguIQu4LioLiDguYDguKrguKHguK0gKOC4l+C4seC5ieC4h+C4o+C4sOC4muC4muC5g+C4iuC5ieC4m+C4teC4meC4teC5ieC4reC5ieC4suC4h+C4reC4tOC4hykg4Liq4LmI4Lin4LiZ4LiC4LmJ4Lit4LiE4Lin',
  '4Liy4Lih4LmB4Lil4LmJ4Lin4LmB4LiV4LmI4LiX4Li14LmI4LiV4Lix4LmJ4LiH4LmE4Lin4LmJCiAgICBodG1sICs9ICc8b3B0aW9uIHZhbHVlPSInICsgeSArICciPuC4m+C4tSAnICsgZGlzcGxheVllYXIoeSkgKwogICAgICAgICAgICAodXNlQnVkZGhpc3RZ',
  'ZWFyKCkgPyAnICjguIQu4LioLiAnICsgeSArICcpJyA6ICcnKSArICc8L29wdGlvbj4nOwogIH0pOwogIHNlbC5pbm5lckhUTUwgPSBodG1sOwogIGlmIChsaXN0LmluZGV4T2YoTnVtYmVyKFMueWVhcikpIDwgMCAmJiBTLnllYXIgIT09ICdhbGwnKSBTLnllYXIg',
  'PSBTdHJpbmcoY3VyKTsKICBzZWwudmFsdWUgPSBTLnllYXI7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4LmC4Lir4Lih4LiU4LiU4Li54Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinIC0tLS0tLS0tLS0tLS0tLS0KICAg4Lid4Lix4LmI4LiH4LmA4LiL4Li0',
  '4Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4LiB4Lix4LiZ4LmE4Lin4LmJ4LmB4Lil4LmJ4Lin4LmD4LiZ4Lif4Lix4LiH4LiB4LmM4LiK4Lix4LiZIGFwaSgpIOC4leC4o+C4h+C4meC4teC5ieC5geC4hOC5iOC4i+C5iOC4reC4meC4m+C4uOC5iOC4oeC4l+C4teC5',
  'iOC4geC4lOC5hOC4m+C4geC5h+C4l+C4s+C5hOC4oeC5iOC5hOC4lOC5iQogICDguYDguJ7guLfguYjguK3guYTguKHguYjguYPguKvguYnguJzguLnguYnguJfguLXguYjguYDguJvguLTguJTguJTguYnguKfguKLguKXguLTguIfguIHguYzguYHguIrguKPguYzg',
  'uKrguLHguJrguKrguJkgKi8KdmFyIEVESVRfRU5UUllQT0lOVFMgPSAvXGIoZm9ybURlYnR8Zm9ybURlYnRQYXltZW50fGZvcm1QdXJjaGFzZXxmb3JtQWN8Zm9ybUJ1bGtBY3xmb3JtUmVwYWlyfGZvcm1CdWlsZGluZ3xmb3JtUm9vbXxmb3JtRmluYW5jZXxmb3Jt',
  'VXNlcnxkZWxEZWJ0fGRlbERlYnRQYXltZW50fGRlbFB1cmNoYXNlfGRlbEFjfGRlbFJlcGFpcnxkZWxCdWlsZGluZ3xkZWxGaW5hbmNlfGRlbFVzZXJ8ZG9JbXBvcnRKc29ufGRvUm90YXRlU2hhcmV8ZG9CYWNrdXBOb3d8c2F2ZVNldHRpbmdzRm9ybSlccypcKC87',
  'CgpmdW5jdGlvbiBhcHBseVJlYWRPbmx5KHJvb3QpewogIGlmIChjYW5FZGl0KCkpIHJldHVybjsKICB2YXIgbm9kZXMgPSByb290LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tvbmNsaWNrXScpOwogIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHsK',
  'ICAgIGlmIChFRElUX0VOVFJZUE9JTlRTLnRlc3Qobm9kZXNbaV0uZ2V0QXR0cmlidXRlKCdvbmNsaWNrJykgfHwgJycpKSBub2Rlc1tpXS5yZW1vdmUoKTsKICB9Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4Lij4Li14LmA4Lif4Lij4LiK4Lit4Lix4LiV4LmC4LiZ',
  '4Lih4Lix4LiV4Li04LmA4Lih4Li34LmI4Lit4LiC4LmJ4Lit4Lih4Li54Lil4LmD4LiZ4LiK4Li14LiV4LmA4Lib4Lil4Li14LmI4Lii4LiZIC0tLS0tLS0tLS0tLS0tLS0KCiAgIOC4geC4juC5gOC4q+C4peC5h+C4geC4guC4reC4h+C4quC5iOC4p+C4meC4meC4',
  'teC5iTog4Lir4LmJ4Liy4Lih4LmC4Lir4Lil4LiU4LiX4Lix4Lia4Liq4Li04LmI4LiH4LiX4Li14LmI4Lic4Li54LmJ4LmD4LiK4LmJ4LiB4Liz4Lil4Lix4LiH4Lie4Li04Lih4Lie4LmM4Lit4Lii4Li54LmI4LmA4LiU4LmH4LiU4LiC4Liy4LiUCiAgIOC4luC5',
  'ieC4suC4oeC4teC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C4oeC5iOC4leC4reC4meC4l+C4teC5iOC4nOC4ueC5ieC5g+C4iuC5ieC4geC4s+C4peC4seC4h+C4geC4o+C4reC4geC4reC4ouC4ueC5iCDguYPguKvguYnguILguLbguYnguJnguJvguLjguYjguKHg',
  'uYDguKXguYfguIEg4LmGIOC5g+C4q+C5ieC4geC4lOC5gOC4reC4h+C5gOC4oeC4t+C5iOC4reC4nuC4o+C5ieC4reC4oQoKICAg4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4OiDguKPguLjguYjguJnguILguYnguK3guKHguLnguKXguJTguLnguIjguLLguIEgIuC5',
  'gOC4p+C4peC4suC4l+C4teC5iOC4iuC4teC4leC4luC4ueC4geC5geC4geC5ieC4peC5iOC4suC4quC4uOC4lCIg4LiC4Lit4LiHIEdvb2dsZSBEcml2ZQogICDguIvguLbguYjguIfguILguKLguLHguJrguJfguLjguIHguITguKPguLHguYnguIfguJfguLXguYjg',
  'uKHguLXguIHguLLguKPguYDguILguLXguKLguJkg4Lij4Lin4Lih4LiW4Li24LiH4LiV4Lit4LiZ4LiX4Li14LmI4LmA4Lij4Liy4LmA4Lit4LiH4LiB4LiU4Lia4Lix4LiZ4LiX4Li24LiB4LiU4LmJ4Lin4LiiCiAgIOC4iOC4tuC4h+C4leC5ieC4reC4h+C4iOC4',
  'lOC4o+C4uOC5iOC4meC5g+C4q+C4oeC5iOC5hOC4p+C5ieC4q+C4peC4seC4h+C4muC4seC4meC4l+C4tuC4geC4l+C4uOC4geC4hOC4o+C4seC5ieC4hyDguYTguKHguYjguIfguLHguYnguJnguIjguLDguYLguKvguKXguJTguIvguYnguLPguYHguKXguLDguILg',
  'uLbguYnguJnguILguYnguK3guITguKfguLLguKEKICAg4Lin4LmI4LiyICLguKHguLXguITguJnguYHguIHguYnguILguYnguK3guKHguLnguKUiIOC4l+C4seC5ieC4h+C4l+C4teC5iOC4hOC4meC5geC4geC5ieC4hOC4t+C4reC4nOC4ueC5ieC5g+C4iuC5ieC5',
  'gOC4reC4hwotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKiDguITguLPguKrguLHguYjguIfguJfguLXguYjguJfguLPguYPguKvguYnguILguYnguK3guKHguLnguKXguYPguJng',
  'uIrguLXguJXguYDguJvguKXguLXguYjguKLguJkgKOC5g+C4q+C5ieC4leC4o+C4h+C4geC4seC4miBNVVRBVElOR19BQ1RJT05TIOC4neC4seC5iOC4h+C5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jCkgKi8KdmFyIENMSUVOVF9NVVRBVElORyA9IC9c',
  'LihzYXZlfGRlbGV0ZXxzYXZlUGF5bWVudHxkZWxldGVQYXltZW50fGJ1bGtCb29rfGltcG9ydHxyb3RhdGVUb2tlbnxiYWNrdXBOb3d8dXBsb2FkfHRyYXNofHRvZ2dsZXxzZXRTdGF0dXN8cmVjb25jaWxlKSQvOwoKLyoqCiAqIOC5gOC4nuC4tOC5iOC4h+C4geC4',
  'lOC4muC4seC4meC4l+C4tuC4geC5gOC4reC4hyDigJQg4Lir4LiZ4LmJ4Liy4LmC4Lir4Lil4LiU4LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmI4LmE4Lib4LmB4Lil4LmJ4Lin4LiV4Lit4LiZ4LiB4LiU4Lia4Lix4LiZ4LiX4Li24LiBCiAqIOC4iOC4lOC4',
  'o+C4uOC5iOC4meC4guC5ieC4reC4oeC4ueC4peC4peC5iOC4suC4quC4uOC4lOC5hOC4p+C5iSDguYHguKXguLDguIHguLHguJnguYTguKHguYjguYPguKvguYnguKPguK3guJrguJXguKPguKfguIjguJbguLHguJTguYTguJvguYLguKvguKXguJTguIvguYnguLMK',
  'ICogKOC5gOC4nOC4t+C5iOC4reC5hOC4p+C5iSAyIOC4meC4suC4l+C4tSDguYDguJ7guKPguLLguLAgR29vZ2xlIERyaXZlIOC4reC4seC4m+C5gOC4lOC4leC5gOC4p+C4peC4suC5geC4geC5ieC5hOC4guC4iuC5ieC4suC4geC4p+C5iOC4suC4geC4suC4o+C5',
  'gOC4guC4teC4ouC4meC4iOC4o+C4tOC4h+C5gOC4peC5h+C4geC4meC5ieC4reC4oikKICovCmZ1bmN0aW9uIG1hcmtTZWxmQ2hhbmdlKCl7CiAgUy5zZWxmQ2hhbmdlVW50aWwgPSBEYXRlLm5vdygpICsgMTIwMDAwOwogIGNsZWFyVGltZW91dChTLnN5bmNUaW1l',
  'cik7CiAgUy5zeW5jVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7CiAgICBzeW5jVmVyc2lvbigpOwogICAgcmVmcmVzaEFsZXJ0cygpOyAgICAgLy8g4LiH4Liy4LiZ4LiE4LmJ4Liy4LiH4Lit4Liy4LiI4LmA4Lie4Li04LmI4Lih4Lir4Lij4Li34Lit4Lil',
  '4LiU4LiI4Liy4LiB4Liq4Li04LmI4LiH4LiX4Li14LmI4LmA4Lie4Li04LmI4LiH4Lia4Lix4LiZ4LiX4Li24LiB4LmE4LibCiAgfSwgMTUwMCk7Cn0KCmZ1bmN0aW9uIHN5bmNWZXJzaW9uKCl7CiAgY2FsbEFwaSgnYXBwLnZlcnNpb24nKQogICAgLnRoZW4oZnVu',
  'Y3Rpb24odil7IGlmICh2ICYmIHYudmVyc2lvbikgUy52ZXJzaW9uID0gdi52ZXJzaW9uOyB9KQogICAgLmNhdGNoKGZ1bmN0aW9uKCl7IC8qIOC5hOC4p+C5ieC4o+C4reC4muC4q+C4meC5ieC4siAqLyB9KTsKfQoKLyoqIOC4nOC4ueC5ieC5g+C4iuC5ieC4geC4',
  's+C4peC4seC4h+C4geC4o+C4reC4geC4guC5ieC4reC4oeC4ueC4peC4reC4ouC4ueC5iOC4q+C4o+C4t+C4reC5gOC4m+C4peC5iOC4siDigJQg4LiW4LmJ4Liy4LmD4LiK4LmIIOC4q+C5ieC4suC4oeC5guC4q+C4peC4lOC4l+C4seC4miAqLwpmdW5jdGlvbiB1',
  'c2VySXNCdXN5KCl7CiAgdmFyIG1vZGFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vZGFsUm9vdCcpOwogIGlmIChtb2RhbCAmJiBtb2RhbC5pbm5lckhUTUwpIHJldHVybiB0cnVlOyAgICAgICAgICAgICAgLy8g4Lif4Lit4Lij4LmM4Lih4LmA4Lib4Li0',
  '4LiU4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmICiAgdmFyIGVsID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDsKICBpZiAoZWwgJiYgL14oSU5QVVR8VEVYVEFSRUF8U0VMRUNUKSQvLnRlc3QoZWwudGFnTmFtZSkgJiYKICAgICAgZWwudHlwZSAhPT0gJ2J1dHRvbicg',
  'JiYgZWwudHlwZSAhPT0gJ3N1Ym1pdCcpIHJldHVybiB0cnVlOyAgIC8vIOC5gOC4hOC4reC4o+C5jOC5gOC4i+C4reC4o+C5jOC4reC4ouC4ueC5iOC5g+C4meC4iuC5iOC4reC4h+C4geC4o+C4reC4gQogIHJldHVybiBmYWxzZTsKfQoKZnVuY3Rpb24gcmVmcmVz',
  'aExhYmVsKHNlYyl7CiAgaWYgKCFzZWMpIHJldHVybiAn4Lib4Li04LiU4LiB4Liy4Lij4LiV4Lij4Lin4LiI4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0JzsKICBpZiAoc2VjICUgMzYwMCA9PT0gMCkgcmV0dXJuICfguJXguKPguKfguIjguILguYnguK3guKHg',
  'uLnguKXguYPguKvguKHguYjguJfguLjguIEgJyArIChzZWMgLyAzNjAwKSArICcg4LiK4Lix4LmI4Lin4LmC4Lih4LiHJzsKICBpZiAoc2VjICUgNjAgPT09IDApIHJldHVybiAn4LiV4Lij4Lin4LiI4LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmI4LiX4Li4',
  '4LiBICcgKyAoc2VjIC8gNjApICsgJyDguJnguLLguJfguLUnOwogIHJldHVybiAn4LiV4Lij4Lin4LiI4LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmI4LiX4Li44LiBICcgKyBzZWMgKyAnIOC4p+C4tOC4meC4suC4l+C4tSc7Cn0KCi8qIC0tLS0tLS0tLS0t',
  'LS0tLS0g4LiV4Lix4Lin4Lia4Lit4LiB4Liq4LiW4Liy4LiZ4Liw4LiB4Liy4Lij4LiL4Li04LiH4LiB4LmMICjguKHguLjguKHguILguKfguLLguJrguJkpIC0tLS0tLS0tLS0tLS0tLS0KCiAgIOC4q+C4meC5ieC4suC4l+C4teC5iDog4Lia4Lit4LiB4LmD4Lir',
  '4LmJ4Lij4Li54LmJ4LiV4Lil4Lit4LiU4Lin4LmI4Liy4LiV4Lit4LiZ4LiZ4Li14LmJ4LiC4LmJ4Lit4Lih4Li54Lil4LiV4Lij4LiH4LiB4Lix4Lia4Lir4Lil4Lix4LiH4Lia4LmJ4Liy4LiZ4Lir4Lij4Li34Lit4Lii4Lix4LiHCiAgIOC4geC4s+C4peC4seC4',
  'h+C4muC4seC4meC4l+C4tuC4geC4reC4ouC4ueC5iOC5hOC4q+C4oSDguKvguKPguLfguK3guKHguLXguK3guLDguYTguKPguITguYnguLLguIfguJfguLXguYjguJXguYnguK3guIfguIjguLHguJTguIHguLLguKMKCiAgIOC4leC4seC5ieC4h+C5g+C4iOC5g+C4',
  'q+C5iSAi4LmA4LiH4Li14Lii4Lia4LmA4Lih4Li34LmI4Lit4LiX4Li44LiB4Lit4Lii4LmI4Liy4LiH4Lib4LiB4LiV4Li0IOC5geC4peC4sOC4iuC4seC4lOC5gOC4iOC4meC5gOC4oeC4t+C5iOC4reC4oeC4teC4reC4sOC5hOC4o+C4nOC4tOC4lOC4m+C4geC4',
  'leC4tCIKICAg4Liq4LiW4Liy4LiZ4Liw4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LmD4Lir4LmJ4Lic4Li54LmJ4LmD4LiK4LmJ4LiX4Liz4Lit4Liw4LmE4Lij4LiV4LmI4LitICjguKHguLXguILguYnguK3guKHguLnguKXguYPguKvguKHguYggLyDguYDguIrguLfg',
  'uYjguK3guKHguJXguYjguK3guYTguKHguYjguYTguJTguYkpIOC4geC4lOC5hOC4lOC5iQotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi8KCnZhciBTWU5DID0geyBzdGF0ZTogJ3N5bmNl',
  'ZCcsIGRldGFpbDogJycsIGF0OiAwLCB0aW1lcjogbnVsbCB9OwoKdmFyIFNZTkNfTE9PSyA9IHsKICBzeW5jZWQ6ICB7IGNsczogJ29rJywgICBpY29uOiAn4pePJywgIHRleHQ6ICfguIvguLTguIfguIHguYzguYHguKXguYnguKcnIH0sCiAgc3luY2luZzogeyBj',
  'bHM6ICdpbmZvJywgaWNvbjogJycsICAgdGV4dDogJ+C4geC4s+C4peC4seC4h+C4i+C4tOC4h+C4geC5jOKApicsICAgc3BpbjogdHJ1ZSB9LAogIHNhdmluZzogIHsgY2xzOiAnaW5mbycsIGljb246ICcnLCAgIHRleHQ6ICfguIHguLPguKXguLHguIfguJrguLHg',
  'uJnguJfguLbguIHigKYnLCAgc3BpbjogdHJ1ZSB9LAogIHNhdmVkOiAgIHsgY2xzOiAnb2snLCAgIGljb246ICfinJMnLCAgdGV4dDogJ+C4muC4seC4meC4l+C4tuC4geC5geC4peC5ieC4pycgfSwKICBwZW5kaW5nOiB7IGNsczogJ3dhcm4nLCBpY29uOiAn4oa7',
  'JywgIHRleHQ6ICfguKHguLXguILguYnguK3guKHguLnguKXguYPguKvguKHguYgnLCAgY2xpY2s6ICdsb2FkUGVuZGluZygpJyB9LAogIG9mZmxpbmU6IHsgY2xzOiAnZGdyJywgIGljb246ICfimqAnLCAgdGV4dDogJ+C5gOC4iuC4t+C5iOC4reC4oeC4leC5iOC4',
  'reC5hOC4oeC5iOC5hOC4lOC5iScsIGNsaWNrOiAncmV0cnlTeW5jKCknIH0sCiAgZXJyb3I6ICAgeyBjbHM6ICdkZ3InLCAgaWNvbjogJ+KaoCcsICB0ZXh0OiAn4Lia4Lix4LiZ4LiX4Li24LiB4LmE4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIJywgY2xpY2s6ICdy',
  'ZXRyeVN5bmMoKScgfSwKICBwYXVzZWQ6ICB7IGNsczogJ211dGUnLCBpY29uOiAn4peLJywgIHRleHQ6ICfguYTguKHguYjguJXguKPguKfguIjguK3guLHguJXguYLguJnguKHguLHguJXguLQnLCBjbGljazogJ2xvYWRQZW5kaW5nKCknIH0KfTsKCi8qKgogKiBA',
  'cGFyYW0ge3N0cmluZ30gc3RhdGUg4LiK4Li34LmI4Lit4Liq4LiW4Liy4LiZ4Liw4LmD4LiZIFNZTkNfTE9PSwogKiBAcGFyYW0ge3N0cmluZz19IGRldGFpbCDguILguYnguK3guITguKfguLLguKHguK3guJjguLTguJrguLLguKLguYDguJ7guLTguYjguKEgKOC5',
  'guC4nOC4peC5iOC4leC4reC4meC5gOC4reC4suC5gOC4oeC4suC4quC5jOC4iuC4teC5iSkKICovCmZ1bmN0aW9uIHN5bmNTZXQoc3RhdGUsIGRldGFpbCl7CiAgLy8g4Liq4LiW4Liy4LiZ4Liw4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LmD4Lir4LmJ4Lic4Li54LmJ',
  '4LmD4LiK4LmJ4LiI4Lix4LiU4LiB4Liy4LijIOC4q+C5ieC4suC4oeC4luC4ueC4geC4quC4luC4suC4meC4sOC4l+C4seC5iOC4p+C5hOC4m+C4oeC4suC4geC4peC4muC4l+C4tOC5ieC4hwogIGlmICgoU1lOQy5zdGF0ZSA9PT0gJ3BlbmRpbmcnIHx8IFNZTkMu',
  'c3RhdGUgPT09ICdvZmZsaW5lJykgJiYKICAgICAgKHN0YXRlID09PSAnc3luY2VkJyB8fCBzdGF0ZSA9PT0gJ3N5bmNpbmcnKSkgcmV0dXJuOwoKICBTWU5DLnN0YXRlID0gc3RhdGU7CiAgU1lOQy5kZXRhaWwgPSBkZXRhaWwgfHwgJyc7CiAgaWYgKHN0YXRlID09',
  'PSAnc3luY2VkJyB8fCBzdGF0ZSA9PT0gJ3NhdmVkJykgU1lOQy5hdCA9IERhdGUubm93KCk7CiAgc3luY1BhaW50KCk7CgogIGNsZWFyVGltZW91dChTWU5DLnRpbWVyKTsKICBpZiAoc3RhdGUgPT09ICdzYXZlZCcpIHsgICAgICAgICAgICAgICAgICAgICAgIC8v',
  'IOC5guC4iuC4p+C5jCAi4Lia4Lix4LiZ4LiX4Li24LiB4LmB4Lil4LmJ4LinIiDguYHguJvguYrguJrguYDguJTguLXguKLguKfguYHguKXguYnguKfguIHguKXguLHguJrguYTguJvguJvguIHguJXguLQKICAgIFNZTkMudGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0',
  'aW9uKCl7CiAgICAgIGlmIChTWU5DLnN0YXRlID09PSAnc2F2ZWQnKSBzeW5jU2V0KCdzeW5jZWQnKTsKICAgIH0sIDI2MDApOwogIH0KfQoKZnVuY3Rpb24gc3luY1BhaW50KCl7CiAgdmFyIGRvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsaXZlRG90Jyk7',
  'CiAgaWYgKCFkb3QpIHJldHVybjsKICB2YXIgbG9vayA9IFNZTkNfTE9PS1tTWU5DLnN0YXRlXSB8fCBTWU5DX0xPT0suc3luY2VkOwoKICB2YXIgdGlwID0gU1lOQy5kZXRhaWwgfHwgc3luY1Rvb2x0aXAoKTsKICAvLyDguKvguYjguK3guILguYnguK3guITguKfg',
  'uLLguKHguYTguKfguYkg4LmA4Lie4Li34LmI4Lit4LmD4Lir4LmJ4LiI4Lit4LmB4LiE4Lia4LiL4LmI4Lit4LiZ4LmA4LiJ4Lie4Liy4Liw4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LmB4Lil4Liw4Lii4Lix4LiH4LmA4Lir4LmH4LiZ4LmE4Lit4LiE4Lit4LiZ4Lit',
  '4Lii4Li54LmICiAgdmFyIGJvZHkgPSAobG9vay5zcGluID8gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+ICcgOiAobG9vay5pY29uID8gbG9vay5pY29uICsgJyAnIDogJycpKSArCiAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9InN5bmMtbGFiZWwiPicgKyBs',
  'b29rLnRleHQgKyAnPC9zcGFuPic7CiAgdmFyIGNscyA9ICdiICcgKyBsb29rLmNscyArICcgc3luYy1waWxsJzsKCiAgZG90LmlubmVySFRNTCA9IGxvb2suY2xpY2sKICAgID8gJzxidXR0b24gY2xhc3M9IicgKyBjbHMgKyAnIiBzdHlsZT0iYm9yZGVyOjA7Y3Vy',
  'c29yOnBvaW50ZXI7Zm9udDppbmhlcml0IiAnICsKICAgICAgJ3RpdGxlPSInICsgZXNjKHRpcCkgKyAnIiBvbmNsaWNrPSInICsgbG9vay5jbGljayArICciPicgKyBib2R5ICsgJzwvYnV0dG9uPicKICAgIDogJzxzcGFuIGNsYXNzPSInICsgY2xzICsgJyIgdGl0',
  'bGU9IicgKyBlc2ModGlwKSArICciPicgKyBib2R5ICsgJzwvc3Bhbj4nOwp9CgpmdW5jdGlvbiBzeW5jVG9vbHRpcCgpewogIHZhciBiYXNlID0gcmVmcmVzaExhYmVsKFBPTExfU0VDT05EUykgKyAnIMK3IOC5hOC4oeC5iOC5guC4q+C4peC4lOC4l+C4seC4muC4',
  'leC4reC4meC4geC4s+C4peC4seC4h+C4geC4o+C4reC4geC4guC5ieC4reC4oeC4ueC4pSc7CiAgaWYgKCFTWU5DLmF0KSByZXR1cm4gYmFzZTsKICB2YXIgZCA9IG5ldyBEYXRlKFNZTkMuYXQpOwogIHZhciBoaCA9ICgnMCcgKyBkLmdldEhvdXJzKCkpLnNsaWNl',
  'KC0yKSwgbW0gPSAoJzAnICsgZC5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKTsKICByZXR1cm4gJ+C4leC4o+C4h+C4geC4seC4muC4guC5ieC4reC4oeC4ueC4peC4q+C4peC4seC4h+C4muC5ieC4suC4meC5gOC4oeC4t+C5iOC4rSAnICsgaGggKyAnOicgKyBtbSAr',
  'ICcg4LiZLlxuJyArIGJhc2U7Cn0KCi8qKiDguYDguJnguYfguJXguKrguLDguJTguLjguJQv4Lir4Lil4Li44LiUIOC4leC5iOC4suC4h+C4iOC4suC4gSAi4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4LiV4Lit4Lia4Lin4LmI4Liy4LiX4Liz4LmE',
  '4Lih4LmI4LmE4LiU4LmJIiDguIvguLbguYjguIfguYDguJvguYfguJnguITguKfguLLguKHguJzguLTguJTguILguK3guIfguITguLPguKrguLHguYjguIcgKi8KZnVuY3Rpb24gaXNPZmZsaW5lRXJyb3IoZSl7CiAgaWYgKHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1',
  'bmRlZmluZWQnICYmIG5hdmlnYXRvci5vbkxpbmUgPT09IGZhbHNlKSByZXR1cm4gdHJ1ZTsKICB2YXIgbSA9IFN0cmluZygoZSAmJiBlLm1lc3NhZ2UpIHx8IGUgfHwgJycpOwogIHJldHVybiAvbmV0d29ya3xmYWlsZWR8dGltZW91dHzguYDguITguKPguLfguK3g',
  'uILguYjguLLguKJ84LmA4LiK4Li34LmI4Lit4Lih4LiV4LmI4LitfOC5hOC4oeC5iOC5hOC4lOC5ieC4o+C4seC4muC4guC5ieC4reC4oeC4ueC4peC4iOC4suC4geC5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jC9pLnRlc3QobSk7Cn0KCi8qKiDguJzg',
  'uLnguYnguYPguIrguYnguIHguJTguJfguLXguYjguJXguLHguKfguJrguK3guIHguKrguJbguLLguJnguLDguJXguK3guJnguKHguLXguJvguLHguI3guKvguLIg4oCUIOC4peC4reC4h+C5g+C4q+C4oeC5iOC4l+C4seC4meC4l+C4tSAqLwpmdW5jdGlvbiByZXRy',
  'eVN5bmMoKXsKICBTWU5DLnN0YXRlID0gJ3N5bmNpbmcnOwogIHN5bmNQYWludCgpOwogIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKfQoKLyoqIOC5guC4q+C4peC4lOC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C4oeC5iOC4leC4reC4meC4l+C4teC5iOC4nOC4ueC5',
  'ieC5g+C4iuC5ieC4nuC4o+C5ieC4reC4oSAo4LiB4LiU4LiI4Liy4LiB4Lib4LmJ4Liy4LiiICLguKHguLXguILguYnguK3guKHguLnguKXguYPguKvguKHguYgiKSAqLwpmdW5jdGlvbiBsb2FkUGVuZGluZygpewogIFNZTkMuc3RhdGUgPSAnc3luY2luZyc7CiAg',
  'c3luY1BhaW50KCk7CiAgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwp9Cgp2YXIgUE9MTF9TRUNPTkRTID0gMDsKdmFyIFBPTExfVElNRVIgPSBudWxsOwoKZnVuY3Rpb24gc3RhcnRQb2xsaW5nKHNlY29uZHMpewogIHZhciBzZWMgPSBOdW1iZXIoc2Vjb25kcyB8fCAw',
  'KTsKICBQT0xMX1NFQ09ORFMgPSBzZWM7CiAgY2xlYXJJbnRlcnZhbChQT0xMX1RJTUVSKTsKCiAgaWYgKCFzZWMpIHsgc3luY1NldCgncGF1c2VkJyk7IHJldHVybjsgfSAgIC8vIOC4m+C4tOC4lOC4geC4suC4o+C4leC4o+C4p+C4iOC4reC4seC4leC5guC4meC4',
  'oeC4seC4leC4tCDigJQg4LiB4LiU4LiX4Li14LmI4Lib4LmJ4Liy4Lii4LmA4Lie4Li34LmI4Lit4LiL4Li04LiH4LiB4LmM4LmA4Lit4LiH4LmE4LiU4LmJCiAgc3luY1NldCgnc3luY2VkJyk7CgogIFBPTExfVElNRVIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigp',
  'ewogICAgaWYgKGRvY3VtZW50LmhpZGRlbikgcmV0dXJuOwogICAgY2FsbEFwaSgnYXBwLnZlcnNpb24nKS50aGVuKGZ1bmN0aW9uKHYpewogICAgICBpZiAoU1lOQy5zdGF0ZSA9PT0gJ29mZmxpbmUnKSBzeW5jU2V0KCdzeW5jZWQnKTsgICAvLyDguIHguKXguLHg',
  'uJrguKHguLLguJXguYjguK3guYTguJTguYnguYHguKXguYnguKcKICAgICAgaWYgKCF2IHx8ICF2LnZlcnNpb24gfHwgdi52ZXJzaW9uID09PSBTLnZlcnNpb24pIHJldHVybjsKICAgICAgUy52ZXJzaW9uID0gdi52ZXJzaW9uOwoKICAgICAgLy8g4LmA4Lij4Liy',
  '4LmA4Lib4LmH4LiZ4LiE4LiZ4LmB4LiB4LmJ4LmA4Lit4LiHIOC5geC4peC4sOC4q+C4meC5ieC4suC4geC5h+C4i+C4tOC4h+C4geC5jOC5hOC4m+C5geC4peC5ieC4p+C4leC4reC4meC4geC4lOC4muC4seC4meC4l+C4tuC4gQogICAgICBpZiAoRGF0ZS5ub3co',
  'KSA8IFMuc2VsZkNoYW5nZVVudGlsKSByZXR1cm47CgogICAgICAvLyDguIHguLPguKXguLHguIfguIHguKPguK3guIHguILguYnguK3guKHguLnguKXguK3guKLguLnguYgg4oCUIOC4q+C5ieC4suC4oeC5guC4q+C4peC4lOC4l+C4seC4miDguKPguK3guYPguKvg',
  'uYnguJzguLnguYnguYPguIrguYnguIHguJTguYDguK3guIcKICAgICAgaWYgKHVzZXJJc0J1c3koKSkgeyBzeW5jU2V0KCdwZW5kaW5nJyk7IHJldHVybjsgfQoKICAgICAgLy8g4LiL4Li04LiH4LiB4LmM4LmA4LiH4Li14Lii4LiaIOC5hiDguYTguKHguYjguKXg',
  'uYnguLLguIfguKvguJnguYnguLIg4LmE4Lih4LmI4LmA4LiU4LmJ4LiH4LiB4Lil4Lix4Lia4LmE4Lib4Lia4LiZ4Liq4Li44LiUCiAgICAgIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKICAgICAgcmVmcmVzaEFsZXJ0cygpOwogICAgfSkuY2F0Y2goZnVuY3Rpb24o',
  'ZSl7CiAgICAgIHN5bmNTZXQoaXNPZmZsaW5lRXJyb3IoZSkgPyAnb2ZmbGluZScgOiAnZXJyb3InLCAoZSAmJiBlLm1lc3NhZ2UpIHx8IFN0cmluZyhlKSk7CiAgICB9KTsKICB9LCBzZWMgKiAxMDAwKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguKjguLnguJng',
  'uKLguYzguYHguIjguYnguIfguYDguJXguLfguK3guJkgLS0tLS0tLS0tLS0tLS0tLQoKICAg4LiV4Lix4Lin4LmA4Lil4LiC4Lia4LiZ4LmA4Lih4LiZ4Li5ICjguYDguIrguYjguJkgNiDguKvguKXguLHguIcgIuC4peC5ieC4suC4h+C5geC4reC4o+C5jCIpIOC4',
  'geC4seC4muC4geC4peC5iOC4reC4h+C5geC4iOC5ieC4h+C5gOC4leC4t+C4reC4meC4muC4meC5geC4luC4muC4q+C4seC4pwogICDguYPguIrguYnguILguYnguK3guKHguLnguKXguIrguLjguJTguYDguJTguLXguKLguKfguIHguLHguJnguIjguLLguIHguITg',
  'uLPguKrguLHguYjguIcgYXBwLmFsZXJ0cyDguIvguLbguYjguIfguYDguJrguLLguIHguKfguYjguLLguYHguJTguIrguJrguK3guKPguYzguJTguKHguLLguIEKCiAgIOC4reC4seC4m+C5gOC4lOC4leC5gOC4oeC4t+C5iOC4rTog4LmA4Lib4Li04LiU4Lij4Liw',
  '4Lia4LiaIMK3IOC4q+C4peC4seC4h+C4geC4lOC4muC4seC4meC4l+C4tuC4gS/guKXguJrguJfguLjguIHguITguKPguLHguYnguIcgwrcg4LiX4Li44LiB4Lij4Lit4Lia4LiV4Lij4Lin4LiI4LiC4LmJ4Lit4Lih4Li54LilCiAgIOC5gOC4lOC4tOC4oeC4leC4',
  'seC4p+C5gOC4peC4guC4meC4teC5ieC4reC4seC4m+C5gOC4lOC4leC4leC4reC4meC5gOC4m+C4tOC4lOC4q+C4meC5ieC4suC5geC4lOC4iuC4muC4reC4o+C5jOC4lOC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pwogICDguYTguJvguK3guKLguLnguYjg',
  'uKvguJnguYnguLLguK3guLfguYjguJnguYHguKXguYnguKfguJXguLHguKfguYDguKXguILguIjguLbguIfguITguYnguLLguIfguK3guKLguLnguYjguJfguLXguYjguITguYjguLLguYDguIHguYjguLIKLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0t',
  'LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovCgp2YXIgQUxFUlRTID0geyBjb3VudHM6IHt9LCBpdGVtczogW10sIHRvdGFsOiAwLCB1cmdlbnQ6IDAsIGF0OiAnJyB9OwoKLyoKICogIuC5gOC4q+C5h+C4meC5geC4peC5ieC4pyIg4oCUIOC4leC4',
  'seC4p+C5gOC4peC4guC4muC4meC4geC4o+C4sOC4lOC4tOC5iOC4h+C4meC4seC4muC5gOC4ieC4nuC4suC4sOC5gOC4o+C4t+C5iOC4reC4h+C4l+C4teC5iOC4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC5gOC4q+C5h+C4mQogKiDguYDguJvguLTguJTguIHg',
  'uKXguYjguK3guIfguJTguLnguYHguKXguYnguKfguJXguLHguKfguYDguKXguILguKvguLLguKIg4LmB4LiV4LmI4Lij4Liy4Lii4LiB4Liy4Lij4Lii4Lix4LiH4Lit4Lii4Li54LmI4LmD4LiZ4LiB4Lil4LmI4Lit4LiH4LiI4LiZ4LiB4Lin4LmI4Liy4LiI4Liw',
  '4LmB4LiB4LmJ4LiX4Li14LmI4LiV4LmJ4LiZ4LmA4Lir4LiV4Li4CiAqIOC5gOC4o+C4t+C5iOC4reC4h+C5g+C4q+C4oeC5iOC4q+C4o+C4t+C4reC5gOC4o+C4t+C5iOC4reC4h+C5gOC4lOC4tOC4oeC4l+C4teC5iOC4q+C4meC4seC4geC4guC4tuC5ieC4mSAo',
  '4LmA4LiK4LmI4LiZIOC4h+C4suC4meC4i+C5iOC4reC4oeC5gOC4nuC4tOC5iOC4h+C5gOC4peC4ouC4geC4s+C4q+C4meC4lCkg4LmE4LiU4LmJ4Lij4Lir4Lix4Liq4LmD4Lir4Lih4LmIIOC4leC4seC4p+C5gOC4peC4guC4iOC4tuC4h+C4geC4peC4seC4muC4',
  'oeC4suC5gOC4reC4hwogKgogKiDguKXguYfguK3guIHguK3guLTguJnguJTguYnguKfguKLguJrguLHguI3guIrguLUg4oaSIOC4iOC4s+C5hOC4p+C5ieC4l+C4teC5iOC4muC4seC4jeC4iuC4tSAo4LmA4Lib4Li04LiU4Lih4Li34Lit4LiW4Li34Lit4Lir4Lij',
  '4Li34Lit4LiE4Lit4Lih4LiB4LmH4LiV4Lij4LiH4LiB4Lix4LiZKQogKiDguYDguILguYnguLLguJTguYnguKfguKLguIHguLjguI3guYHguIgv4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmMICjguYTguKHguYjguKHguLXguJrguLHguI3guIrguLUpIOKGkiDg',
  'uIjguLPguYTguKfguYnguYPguJnguYDguITguKPguLfguYjguK3guIfguJnguLXguYkKICovCnZhciBTRUVOX0xPQ0FMX0tFWSA9ICdtY29ybmVyLmFsZXJ0U2Vlbic7CnZhciBOT1RJRl9ORVcgPSB7fTsgICAgICAvLyDguYDguKPguLfguYjguK3guIfguJfguLXg',
  'uYggIuC5g+C4q+C4oeC5iCIg4LiV4Lit4LiZ4LmA4Lib4Li04LiU4LiB4Lil4LmI4Lit4LiH4Lij4Lit4Lia4LiZ4Li14LmJIOKAlCDguKLguLHguIfguJXguLTguJTguJvguYnguLLguKLguYPguKvguKHguYjguYPguKvguYnguYDguKvguYfguJnguIjguJnguIHg',
  'uKfguYjguLLguIjguLDguJvguLTguJTguIHguKXguYjguK3guIcKdmFyIFNFRU5fVEhJU19QQUdFID0ge307IC8vIOC4iOC4lOC5gOC4q+C5h+C4meC5geC4peC5ieC4p+C5hOC4m+C5geC4peC5ieC4p+C4leC4seC5ieC4h+C5geC4leC5iOC5gOC4m+C4tOC4lOC4',
  'q+C4meC5ieC4siDigJQg4LiB4Lix4LiZ4Lic4Lil4Lit4LmI4Liy4LiZ4LiX4Li14LmI4Liq4LmI4LiH4Lih4Liy4LiB4LmI4Lit4LiZ4Lia4Lix4LiZ4LiX4Li24LiB4LmA4Liq4Lij4LmH4LiIIOC4l+C4s+C5g+C4q+C5ieC4leC4seC4p+C5gOC4peC4guC5gOC4',
  'lOC5ieC4h+C4geC4peC4seC4mgoKZnVuY3Rpb24gbG9jYWxTZWVuKCl7CiAgdHJ5IHsgdmFyIHYgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFNFRU5fTE9DQUxfS0VZKSB8fCAnW10nKTsgcmV0dXJuIEFycmF5LmlzQXJyYXkodikgPyB2IDogW107',
  'IH0KICBjYXRjaCAoZSkgeyByZXR1cm4gW107IH0KfQoKLyoqIOC4lOC4seC4iuC4meC4teC4guC4reC4h+C4l+C4uOC4geC5gOC4o+C4t+C5iOC4reC4hyAo4Lij4Liy4Lii4Lil4Liw4LmA4Lit4Li14Lii4LiU4Lit4Liy4LiI4Liq4LmI4LiH4Lih4Liy4LmE4Lih',
  '4LmI4LiE4Lij4LiaIOC5geC4leC5iOC4lOC4seC4iuC4meC4teC4hOC4o+C4muC5gOC4quC4oeC4rSkgKi8KZnVuY3Rpb24gYWxlcnRJbmRleCgpewogIHJldHVybiBBTEVSVFMuaW5kZXggfHwgKEFMRVJUUy5pdGVtcyB8fCBbXSkubWFwKGZ1bmN0aW9uKGEpeyBy',
  'ZXR1cm4geyBrZXk6IGEua2V5LCBtb2R1bGU6IGEubW9kdWxlLCBsZXZlbDogYS5sZXZlbCwgc2VlbjogYS5zZWVuIH07IH0pOwp9CgovKgogKiDguKPguKvguLHguKogPSAi4LiV4LmJ4LiZ4LmA4Lij4Li34LmI4Lit4LiHI+C4o+C4sOC4lOC4seC4miIg4oCUIOC5',
  'gOC4q+C5h+C4meC5geC4peC5ieC4p+C4luC5ieC4suC5gOC4hOC4ouC5gOC4q+C5h+C4meC4leC5ieC4meC5gOC4o+C4t+C5iOC4reC4h+C5gOC4lOC4teC4ouC4p+C4geC4seC4meC4l+C4teC5iOC4o+C4sOC4lOC4seC4muC5gOC4l+C5iOC4suC4meC4teC5ieC4',
  'q+C4o+C4t+C4reC4q+C4meC4seC4geC4geC4p+C5iOC4sgogKiAo4LiB4LiV4Li04LiB4Liy4LmA4LiU4Li14Lii4Lin4LiB4Lix4LiaIGFsZXJ0S2V5U2Vlbl8g4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmMKSDguYDguKPguLfg',
  'uYjguK3guIfguKvguJnguLHguIHguILguLbguYnguJnguYDguJXguLfguK3guJnguK3guLXguIEgwrcg4LmA4Lia4Liy4Lil4LiH4LmE4Lih4LmI4LmA4LiV4Li34Lit4LiZ4LiL4LmJ4LizCiAqLwpmdW5jdGlvbiBhbGVydEJhc2Uoayl7IGsgPSBTdHJpbmcoayk7',
  'IHZhciBpID0gay5sYXN0SW5kZXhPZignIycpOyByZXR1cm4gaSA8IDAgPyBrIDogay5zbGljZSgwLCBpKTsgfQpmdW5jdGlvbiBhbGVydFJhbmsoayl7IGsgPSBTdHJpbmcoayk7IHZhciBpID0gay5sYXN0SW5kZXhPZignIycpOyByZXR1cm4gaSA8IDAgPyAwIDog',
  'KE51bWJlcihrLnNsaWNlKGkgKyAxKSkgfHwgMCk7IH0KCi8qKiDguKPguLDguJTguLHguJrguKrguLnguIfguKrguLjguJTguJfguLXguYjguYDguKvguYfguJnguYHguKXguYnguKfguILguK3guIfguYHguJXguYjguKXguLDguJXguYnguJnguYDguKPguLfguYjg',
  'uK3guIcg4oCUIOC4hOC4s+C4meC4p+C4k+C4hOC4o+C4seC5ieC4h+C5gOC4lOC4teC4ouC4p+C4leC5iOC4reC4geC4suC4o+C4p+C4suC4lCAqLwpmdW5jdGlvbiBzZWVuU2V0KCl7CiAgdmFyIGJlc3QgPSB7fTsKICBmdW5jdGlvbiBhZGQoayl7IHZhciBiID0g',
  'YWxlcnRCYXNlKGspLCByID0gYWxlcnRSYW5rKGspOyBpZiAoIShiIGluIGJlc3QpIHx8IHIgPiBiZXN0W2JdKSBiZXN0W2JdID0gcjsgfQogIE9iamVjdC5rZXlzKFNFRU5fVEhJU19QQUdFKS5mb3JFYWNoKGFkZCk7CiAgaWYgKEFMRVJUUy5zZWVuU3RvcmUgPT09',
  'ICdhY2NvdW50JykgYWxlcnRJbmRleCgpLmZvckVhY2goZnVuY3Rpb24oYSl7IGlmIChhLnNlZW4pIGFkZChhLmtleSk7IH0pOwogIGVsc2UgbG9jYWxTZWVuKCkuZm9yRWFjaChhZGQpOwogIHJldHVybiBiZXN0Owp9CmZ1bmN0aW9uIGlzU2VlbkluKGJlc3QsIGtl',
  'eSl7IHZhciBiID0gYWxlcnRCYXNlKGtleSk7IHJldHVybiAoYiBpbiBiZXN0KSAmJiBiZXN0W2JdID49IGFsZXJ0UmFuayhrZXkpOyB9CmZ1bmN0aW9uIHVuc2VlbkFsZXJ0cyhiZXN0KXsKICBiZXN0ID0gYmVzdCB8fCBzZWVuU2V0KCk7CiAgcmV0dXJuIGFsZXJ0',
  'SW5kZXgoKS5maWx0ZXIoZnVuY3Rpb24oYSl7IHJldHVybiAhaXNTZWVuSW4oYmVzdCwgYS5rZXkpOyB9KTsKfQoKLyoqIOC4iOC4lOC4p+C5iOC4suC5gOC4q+C5h+C4meC5geC4peC5ieC4p+C4l+C4uOC4geC5gOC4o+C4t+C5iOC4reC4h+C4l+C4teC5iOC4hOC5',
  'ieC4suC4h+C4reC4ouC4ueC5iOC4leC4reC4meC4meC4teC5iSAo4LmA4Lib4Li04LiU4LiB4Lil4LmI4Lit4LiHID0g4LmA4Lir4LmH4LiZ4LiX4Lix4LmJ4LiH4Lir4Lih4LiUIOC4o+C4p+C4oeC5gOC4o+C4t+C5iOC4reC4h+C4l+C4teC5iOC4reC4ouC4ueC5',
  'iOC5gOC4geC4tOC4meC4q+C4meC5ieC4suC4peC4sCA4KSAqLwpmdW5jdGlvbiBtYXJrQWxlcnRzU2VlbigpewogIHZhciBmcmVzaCA9IHVuc2VlbkFsZXJ0cygpOwogIGlmICghZnJlc2gubGVuZ3RoKSByZXR1cm47CiAgdmFyIGtleXMgPSBmcmVzaC5tYXAoZnVu',
  'Y3Rpb24oYSl7IHJldHVybiBhLmtleTsgfSk7CiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGspeyBOT1RJRl9ORVdba10gPSB0cnVlOyBTRUVOX1RISVNfUEFHRVtrXSA9IHRydWU7IH0pOwogIHZhciBsaXZlID0gYWxlcnRJbmRleCgpLm1hcChmdW5jdGlvbihhKXsg',
  'cmV0dXJuIGEua2V5OyB9KTsKICBpZiAoQUxFUlRTLnNlZW5TdG9yZSA9PT0gJ2FjY291bnQnKSB7CiAgICAvLyDguKrguYjguIcgIuC4l+C4uOC4geC5gOC4o+C4t+C5iOC4reC4h+C4l+C4teC5iOC5gOC4q+C5h+C4meC5geC4peC5ieC4pyIg4LiX4Li44LiB4LiE',
  '4Lij4Lix4LmJ4LiHIOC5hOC4oeC5iOC5g+C4iuC5iOC5geC4hOC5iOC4l+C4teC5iOC5gOC4nuC4tOC5iOC4oSDigJQg4LiE4Liz4LiC4Lit4Liq4Lit4LiH4Lit4Lix4LiZ4LiX4Li14LmI4LiL4LmJ4Lit4LiZ4LiB4Lix4LiZ4LiI4Liw4LmE4LiU4LmJ4LmE4Lih',
  '4LmI4LiX4Lix4Lia4LiB4Lix4LiZ4LiI4LiZ4Lia4Liy4LiH4LmA4Lij4Li34LmI4Lit4LiH4Lir4Liy4LiiCiAgICB2YXIgYWxsID0gYWxlcnRJbmRleCgpLmZpbHRlcihmdW5jdGlvbihhKXsgcmV0dXJuIGEuc2VlbiB8fCBTRUVOX1RISVNfUEFHRVthLmtleV07',
  'IH0pCiAgICAgIC5tYXAoZnVuY3Rpb24oYSl7IHJldHVybiBhLmtleTsgfSk7CiAgICBjYWxsQXBpKCdhcHAuYWxlcnRzU2VlbicsIHsga2V5czogYWxsLCBsaXZlOiBsaXZlIH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbigpeyAvKiDguJrguLHguJnguJfguLbguIHg',
  'uYTguKHguYjguJzguYjguLLguJkg4LmD4Lir4LmJ4LiV4Lix4Lin4LmA4Lil4LiC4LiB4Lil4Lix4Lia4Lih4LiyIOC4iOC4sOC5hOC4lOC5ieC4o+C4ueC5ieC4p+C5iOC4suC4ouC4seC4h+C5hOC4oeC5iOC5hOC4lOC5ieC4iOC4lOC5hOC4p+C5iSAqLyBmb3Jn',
  'ZXRQZW5kaW5nU2VlbihrZXlzKTsgfSk7CiAgfSBlbHNlIHsKICAgIC8vIOC5gOC4geC5h+C4muC5gOC4ieC4nuC4suC4sOC5gOC4o+C4t+C5iOC4reC4h+C4l+C4teC5iOC4ouC4seC4h+C4hOC5ieC4suC4h+C4reC4ouC4ueC5iCDguJfguLXguYjguYHguIHguYng',
  'uYTguJvguYHguKXguYnguKfguJXguLHguJTguJfguLTguYnguIcg4LmE4Lih4LmI4LmD4Lir4LmJ4Lia4Lin4Lih4LiC4Li24LmJ4LiZ4LmA4Lij4Li34LmI4Lit4LiiIOC5hgogICAgdmFyIGxpdmVTZXQgPSB7fTsgbGl2ZS5mb3JFYWNoKGZ1bmN0aW9uKGspeyBs',
  'aXZlU2V0W2FsZXJ0QmFzZShrKV0gPSB0cnVlOyB9KTsKICAgIHZhciBrZWVwID0gbG9jYWxTZWVuKCkuZmlsdGVyKGZ1bmN0aW9uKGspeyByZXR1cm4gbGl2ZVNldFthbGVydEJhc2UoayldOyB9KS5jb25jYXQoa2V5cyk7CiAgICB0cnkgeyBsb2NhbFN0b3JhZ2Uu',
  'c2V0SXRlbShTRUVOX0xPQ0FMX0tFWSwgSlNPTi5zdHJpbmdpZnkoa2VlcCkpOyB9IGNhdGNoIChlKSB7IC8qIOC5guC4q+C4oeC4lOC4quC5iOC4p+C4meC4leC4seC4pyAqLyB9CiAgfQogIHBhaW50QmFkZ2VzKCk7CiAgcGFpbnRCZWxsKCk7Cn0KLyoqIOC4muC4',
  'seC4meC4l+C4tuC4geC5gOC4q+C5h+C4meC5geC4peC5ieC4p+C5hOC4oeC5iOC4nOC5iOC4suC4mSAo4LmA4LiZ4LmH4LiV4Lir4Lil4Li44LiUKSDigJQg4LmA4Lit4Liy4Lit4Lit4LiB4LiI4Liy4LiB4LiX4Li14LmI4LiI4Liz4LmE4Lin4LmJIOC4o+C4reC4',
  'muC4q+C4meC5ieC4suC4l+C4teC5iOC5gOC4m+C4tOC4lOC4geC4peC5iOC4reC4h+C4iOC4sOC4quC5iOC4h+C5g+C4q+C4oeC5iCAqLwpmdW5jdGlvbiBmb3JnZXRQZW5kaW5nU2VlbihrZXlzKXsKICBrZXlzLmZvckVhY2goZnVuY3Rpb24oayl7IGRlbGV0ZSBT',
  'RUVOX1RISVNfUEFHRVtrXTsgfSk7CiAgcGFpbnRCYWRnZXMoKTsKICBwYWludEJlbGwoKTsKfQoKZnVuY3Rpb24gcmVmcmVzaEFsZXJ0cygpewogIHJldHVybiBjYWxsQXBpKCdhcHAuYWxlcnRzJykudGhlbihmdW5jdGlvbihhKXsKICAgIEFMRVJUUyA9IGEgfHwg',
  'QUxFUlRTOwogICAgdmFyIG9wZW4gPSAhIWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdub3RpZlBhbmVsJyk7CiAgICBpZiAob3BlbikgbWFya0FsZXJ0c1NlZW4oKTsgICAgICAgICAgIC8vIOC5gOC4m+C4tOC4lOC4lOC4ueC4reC4ouC4ueC5iCDguYDguKPguLfg',
  'uYjguK3guIfguJfguLXguYjguYDguJ7guLTguYjguIfguYDguILguYnguLLguKHguLLguIHguYfguJbguLfguK3guKfguYjguLLguYDguKvguYfguJnguYHguKXguYnguKcKICAgIHBhaW50QmFkZ2VzKCk7CiAgICBwYWludEJlbGwoKTsKICAgIGlmIChvcGVuKSBy',
  'ZW5kZXJOb3RpZlBhbmVsKCk7ICAgICAgICAgLy8g4LmA4Lib4Li04LiU4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmIIOC5g+C4q+C5ieC4reC4seC4m+C5gOC4lOC4leC4leC4suC4oQogICAgcmV0dXJuIGE7CiAgfSkuY2F0Y2goZnVuY3Rpb24oKXsgLyog4LmA4LiZ',
  '4LmH4LiV4Liq4Liw4LiU4Li44LiUIOC5hOC4p+C5ieC4o+C4reC4muC4q+C4meC5ieC4siAqLyB9KTsKfQoKLyoqCiAqIOC4leC4seC4p+C5gOC4peC4guC4muC4meC5gOC4oeC4meC4ueC4i+C5ieC4suC4oiDigJQg4LiI4Liz4LiZ4Lin4LiZ4LmA4Lij4Li34LmI',
  '4Lit4LiH4LiX4Li14LmI4Lii4Lix4LiH4LiE4LmJ4Liy4LiH4LiC4Lit4LiH4LmB4LiV4LmI4Lil4Liw4Lir4LiZ4LmJ4LiyICjguJXguKPguIfguIHguLHguJrguIjguLPguJnguKfguJnguYPguJnguIHguKXguYjguK3guIfguYHguIjguYnguIfguYDguJXguLfg',
  'uK3guJnguYDguKrguKHguK0pCiAqIOC4oeC4teC5gOC4o+C4t+C5iOC4reC4h+C4l+C4teC5iOC4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC5gOC4q+C5h+C4mSA9IOC4quC4teC4quC5ieC4oeC5gOC4lOC5iOC4mSDCtyDguYDguKvguYfguJnguITguKPguJrg',
  'uYHguKXguYnguKcgPSDguKrguLXguIjguLLguIcg4Lii4Lix4LiH4Lia4Lit4LiB4LiI4Liz4LiZ4Lin4LiZ4LiE4LmJ4Liy4LiH4LmB4LiV4LmI4LmE4Lih4LmI4LmA4Lij4Li14Lii4LiB4Lij4LmJ4Lit4LiH4LiE4Lin4Liy4Lih4Liq4LiZ4LmD4LiICiAqLwpm',
  'dW5jdGlvbiBwYWludEJhZGdlcygpewogIHZhciBjID0gQUxFUlRTLmNvdW50cyB8fCB7fTsKICB2YXIgZnJlc2ggPSB7fTsKICB1bnNlZW5BbGVydHMoKS5mb3JFYWNoKGZ1bmN0aW9uKGEpeyBmcmVzaFthLm1vZHVsZV0gPSAoZnJlc2hbYS5tb2R1bGVdIHx8IDAp',
  'ICsgMTsgfSk7CiAgUEFHRVMuZm9yRWFjaChmdW5jdGlvbihwKXsgc2V0QmFkZ2UocC5pZCwgY1twLmlkXSB8fCAwLCAoZnJlc2hbcC5pZF0gfHwgMCkgPT09IDAsIGZyZXNoKTsgfSk7Cn0KCmZ1bmN0aW9uIHNldEJhZGdlKHBhZ2UsIG4sIHNlZW4sIGZyZXNoKXsK',
  'ICBbZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JhZGdlLScgKyBwYWdlKSwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhYmJhZGdlLScgKyBwYWdlKV0KICAgIC5mb3JFYWNoKGZ1bmN0aW9uKGVsKXsgaWYgKGVsKSBwYWludEJhZGdlKGVsLCBuLCBzZWVuKTsg',
  'fSk7CgogIC8vIOC4h+C4suC4meC4hOC5ieC4suC4h+C4guC4reC4h+C4q+C4meC5ieC4suC4l+C4teC5iOC5hOC4oeC5iOC4oeC4teC5geC4l+C5h+C4miDguYPguKvguYnguYTguJvguKPguKfguKHguK3guKLguLnguYjguJfguLXguYjguJvguLjguYjguKEgIuC5',
  'gOC4nuC4tOC5iOC4oeC5gOC4leC4tOC4oSIg4LmE4Lih4LmI4LiH4Lix4LmJ4LiZ4Lia4LiZ4Lih4Li34Lit4LiW4Li34Lit4LiI4Liw4Lih4Lit4LiH4LmE4Lih4LmI4LmA4Lir4LmH4LiZ4LmA4Lil4LiiCiAgdmFyIG1vcmUgPSBkb2N1bWVudC5nZXRFbGVtZW50',
  'QnlJZCgndGFiYmFkZ2UtbW9yZScpOwogIGlmIChtb3JlKSB7CiAgICB2YXIgaGlkZGVuUGFnZXMgPSBQQUdFUy5maWx0ZXIoZnVuY3Rpb24ocCl7IHJldHVybiAhcC50YWI7IH0pOwogICAgdmFyIGhpZGRlbiA9IGhpZGRlblBhZ2VzLnJlZHVjZShmdW5jdGlvbihh',
  'LCBwKXsgcmV0dXJuIGEgKyAoKEFMRVJUUy5jb3VudHMgfHwge30pW3AuaWRdIHx8IDApOyB9LCAwKTsKICAgIGZyZXNoID0gZnJlc2ggfHwge307CiAgICB2YXIgaGlkZGVuRnJlc2ggPSBoaWRkZW5QYWdlcy5yZWR1Y2UoZnVuY3Rpb24oYSwgcCl7IHJldHVybiBh',
  'ICsgKGZyZXNoW3AuaWRdIHx8IDApOyB9LCAwKTsKICAgIHBhaW50QmFkZ2UobW9yZSwgaGlkZGVuLCBoaWRkZW5GcmVzaCA9PT0gMCk7CiAgfQp9CgpmdW5jdGlvbiBwYWludEJhZGdlKGVsLCBuLCBzZWVuKXsKICBpZiAobiA+IDApIHsKICAgIGVsLnRleHRDb250',
  'ZW50ID0gbiA+IDk5ID8gJzk5KycgOiBuOwogICAgZWwuc3R5bGUuZGlzcGxheSA9ICcnOwogICAgZWwuY2xhc3NMaXN0LnRvZ2dsZSgnc2VlbicsICEhc2Vlbik7CiAgICBlbC50aXRsZSA9ICfguKLguLHguIfguITguYnguLLguIfguK3guKLguLnguYggJyArIG4g',
  'KyAnIOC4o+C4suC4ouC4geC4suC4oycgKyAoc2VlbiA/ICcgKOC5gOC4q+C5h+C4meC5geC4peC5ieC4pyknIDogJycpOwogIH0gZWxzZSB7CiAgICBlbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOwogIH0KfQoKLyogLS0tLSDguIHguKPguLDguJTguLTguYjguIfg',
  'uJrguJnguYHguJbguJrguKvguLHguKcgLS0tLSAqLwoKZnVuY3Rpb24gcGFpbnRCZWxsKCl7CiAgdmFyIHdyYXAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmVsbFdyYXAnKTsKICBpZiAoIXdyYXApIHJldHVybjsKCiAgLy8g4Lin4Liy4LiU4LmA4LiJ4Lie',
  '4Liy4Liw4LiV4Lix4Lin4Lib4Li44LmI4LihIOC4q+C5ieC4suC4oeC5gOC4guC4teC4ouC4meC4l+C4seC4muC4l+C4seC5ieC4hyBiZWxsV3JhcAogIC8vIOC5gOC4nuC4o+C4suC4sOC4geC4peC5iOC4reC4h+C5geC4iOC5ieC4h+C5gOC4leC4t+C4reC4meC4',
  'l+C4teC5iOC5gOC4m+C4tOC4lOC4hOC5ieC4suC4h+C4reC4ouC4ueC5iOC4geC5h+C5gOC4m+C5h+C4meC4peC4ueC4geC4guC4reC4hyBiZWxsV3JhcCDguYDguKvguKHguLfguK3guJnguIHguLHguJkKICB2YXIgc2xvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRC',
  'eUlkKCdiZWxsU2xvdCcpOwogIGlmICghc2xvdCkgewogICAgc2xvdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTsKICAgIHNsb3QuaWQgPSAnYmVsbFNsb3QnOwogICAgd3JhcC5pbnNlcnRCZWZvcmUoc2xvdCwgd3JhcC5maXJzdENoaWxkKTsKICB9',
  'CgogIHZhciBmcmVzaCA9IHVuc2VlbkFsZXJ0cygpOwogIHZhciBuID0gZnJlc2gubGVuZ3RoOwogIHZhciB0b3RhbCA9IEFMRVJUUy50b3RhbCB8fCAwOwogIHZhciB1cmdlbnQgPSBmcmVzaC5maWx0ZXIoZnVuY3Rpb24oYSl7IHJldHVybiBhLmxldmVsID09PSAn',
  'ZGFuZ2VyJzsgfSkubGVuZ3RoOwogIHZhciB0aXAgPSBuID8gJ+C4oeC4teC5gOC4o+C4t+C5iOC4reC4h+C5g+C4q+C4oeC5iCAnICsgbiArICcg4LmA4Lij4Li34LmI4Lit4LiHJyA6CiAgICAgICAgICAgICh0b3RhbCA/ICfguKLguLHguIfguITguYnguLLguIfg',
  'uK3guKLguLnguYggJyArIHRvdGFsICsgJyDguYDguKPguLfguYjguK3guIcgKOC5gOC4q+C5h+C4meC5geC4peC5ieC4p+C4l+C4seC5ieC4h+C4q+C4oeC4lCknIDogJ+C5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4hOC5ieC4suC4hycpOwogIHNsb3QuaW5uZXJI',
  'VE1MID0KICAgICc8YnV0dG9uIGNsYXNzPSJidG4gaWNvbiBiZWxsIiBpZD0iYmVsbEJ0biIgb25jbGljaz0idG9nZ2xlTm90aWYoKSIgJyArCiAgICAgICd0aXRsZT0iJyArIGVzYyh0aXApICsgJyIgJyArCiAgICAgICdhcmlhLWxhYmVsPSLguIHguLLguKPguYHg',
  'uIjguYnguIfguYDguJXguLfguK3guJkiPvCflJQnICsKICAgICAgKG4gPyAnPHNwYW4gY2xhc3M9ImJlbGwtZG90JyArICh1cmdlbnQgPyAnIHVyZ2VudCcgOiAnJykgKyAnIj4nICsgKG4gPiA5OSA/ICc5OSsnIDogbikgKyAnPC9zcGFuPicgOiAnJykgKwogICAg',
  'JzwvYnV0dG9uPic7Cn0KCmZ1bmN0aW9uIHRvZ2dsZU5vdGlmKCl7CiAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdub3RpZlBhbmVsJykpIHJldHVybiBjbG9zZU5vdGlmKCk7CiAgdmFyIHdyYXAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmVsbFdy',
  'YXAnKTsKICBpZiAoIXdyYXApIHJldHVybjsKICB2YXIgcGFuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICBwYW5lbC5pZCA9ICdub3RpZlBhbmVsJzsKICBwYW5lbC5jbGFzc05hbWUgPSAnbm90aWYnOwogIHdyYXAuYXBwZW5kQ2hpbGQocGFu',
  'ZWwpOwogIE5PVElGX05FVyA9IHt9OwogIG1hcmtBbGVydHNTZWVuKCk7ICAgICAgICAgICAgICAgICAgICAgLy8g4LmA4Lib4Li04LiU4LiU4Li54LmB4Lil4LmJ4LinID0g4LmA4Lir4LmH4LiZ4LmB4Lil4LmJ4LinIOC4leC4seC4p+C5gOC4peC4guC4muC4meC4',
  'geC4o+C4sOC4lOC4tOC5iOC4h+C4q+C4suC4oiAo4Lib4LmJ4Liy4LiiICLguYPguKvguKHguYgiIOC4ouC4seC4h+C4reC4ouC4ueC5iOC5g+C4meC4geC4peC5iOC4reC4hykKICByZW5kZXJOb3RpZlBhbmVsKCk7CiAgc2V0VGltZW91dChmdW5jdGlvbigpeyBk',
  'b2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIG5vdGlmT3V0c2lkZSwgdHJ1ZSk7IH0sIDApOwogIHJlZnJlc2hBbGVydHMoKTsgICAgICAgICAgICAgICAgICAgICAgLy8g4LmA4Lib4Li04LiU4LiX4Li14LmE4Lij4LiB4LmH4LiU4Li24LiH4LiC4Lit',
  '4LiH4Lil4LmI4Liy4Liq4Li44LiU4Lih4Liy4LmD4Lir4LmJ4LiU4LmJ4Lin4LiiCn0KCmZ1bmN0aW9uIGNsb3NlTm90aWYoKXsKICB2YXIgcCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdub3RpZlBhbmVsJyk7CiAgaWYgKHApIHAucmVtb3ZlKCk7CiAgTk9U',
  'SUZfTkVXID0ge307CiAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBub3RpZk91dHNpZGUsIHRydWUpOwp9CgpmdW5jdGlvbiBub3RpZk91dHNpZGUoZSl7CiAgdmFyIHdyYXAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmVsbFdyYXAn',
  'KTsKICBpZiAod3JhcCAmJiAhd3JhcC5jb250YWlucyhlLnRhcmdldCkpIGNsb3NlTm90aWYoKTsKfQoKdmFyIE5PVElGX0dST1VQUyA9IFsKICB7IG1vZHVsZToncmVwYWlycycsICAgaWM6J/CflKcnLCBsYWJlbDon4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4Lir4LmJ',
  '4Lit4LiH4LiX4Li14LmI4Lii4Lix4LiH4LmE4Lih4LmI4LmA4Liq4Lij4LmH4LiIJyB9LAogIHsgbW9kdWxlOidhYycsICAgICAgICBpYzon4p2E77iPJywgbGFiZWw6J+C4peC5ieC4suC4h+C5geC4reC4o+C5jOC4luC4tuC4h+C4geC4s+C4q+C4meC4lCcgfSwK',
  'ICB7IG1vZHVsZTonYnVpbGRpbmcnLCAgaWM6J/Cfj6InLCBsYWJlbDon4LiH4Liy4LiZ4LiV4Li24LiB4Liq4LmI4Lin4LiZ4LiB4Lil4Liy4LiH4LiX4Li14LmI4Lii4Lix4LiH4LiE4LmJ4Liy4LiHJyB9LAogIHsgbW9kdWxlOidwdXJjaGFzZXMnLCBpYzon8J+b',
  'oe+4jycsIGxhYmVsOifguJvguKPguLDguIHguLHguJnguYPguIHguKXguYnguKvguKHguJQnIH0sCiAgeyBtb2R1bGU6J2ZpbmFuY2UnLCAgIGljOifwn6e+JywgbGFiZWw6J+C4muC4tOC4peC4o+C4suC4ouC5gOC4lOC4t+C4reC4mScgfQpdOwoKZnVuY3Rpb24g',
  'cmVuZGVyTm90aWZQYW5lbCgpewogIHZhciBwYW5lbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdub3RpZlBhbmVsJyk7CiAgaWYgKCFwYW5lbCkgcmV0dXJuOwogIHZhciBpdGVtcyA9IEFMRVJUUy5pdGVtcyB8fCBbXTsKCiAgdmFyIG5ld0NvdW50ID0gYWxl',
  'cnRJbmRleCgpLmZpbHRlcihmdW5jdGlvbihhKXsgcmV0dXJuIE5PVElGX05FV1thLmtleV07IH0pLmxlbmd0aDsKICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJub3RpZi1oIj48Yj7guIHguLLguKPguYHguIjguYnguIfguYDguJXguLfguK3guJk8L2I+JyArCiAg',
  'ICAnPHNwYW4gY2xhc3M9InNwIj4nICsKICAgICAgKG5ld0NvdW50ID8gJzxzcGFuIGNsYXNzPSJiIGluZm8iPuC5g+C4q+C4oeC5iCAnICsgbmV3Q291bnQgKyAnPC9zcGFuPicgOiAnJykgKwogICAgICAoaXRlbXMubGVuZ3RoID8gJzxzcGFuIGNsYXNzPSJiICcg',
  'KyAoQUxFUlRTLnVyZ2VudCA/ICdkZ3InIDogJ3dhcm4nKSArICciPuC4hOC5ieC4suC4hyAnICsgKEFMRVJUUy50b3RhbCB8fCBpdGVtcy5sZW5ndGgpICsgJyDguYDguKPguLfguYjguK3guIc8L3NwYW4+JyA6ICcnKSArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJi',
  'dG4gc20gaWNvbiIgdGl0bGU9IuC4lOC4tuC4h+C4guC5ieC4reC4oeC4ueC4peC4peC5iOC4suC4quC4uOC4lCIgb25jbGljaz0icmVmcmVzaEFsZXJ0cygpIj7ihrs8L2J1dHRvbj4nICsKICAgICc8L3NwYW4+PC9kaXY+JzsKCiAgaWYgKCFpdGVtcy5sZW5ndGgp',
  'IHsKICAgIHBhbmVsLmlubmVySFRNTCA9IGhlYWQgKwogICAgICAnPGRpdiBjbGFzcz0ibm90aWYtZW1wdHkiPjxkaXYgY2xhc3M9ImJpZyI+4pyFPC9kaXY+4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ4LiE4LmJ4Liy4LiHPGJyPicgKwogICAgICAnPHNwYW4gY2xh',
  'c3M9ImZzMTIgZmFpbnQiPuC4l+C4uOC4geC4reC4ouC5iOC4suC4h+C5gOC4o+C4teC4ouC4muC4o+C5ieC4reC4ouC4lOC4tTwvc3Bhbj48L2Rpdj4nOwogICAgcmV0dXJuOwogIH0KCiAgLy8g4LiI4Lix4LiU4LiB4Lil4Li44LmI4Lih4LiV4Liy4Lih4LmC4Lih',
  '4LiU4Li54LilIOC5gOC4o+C4teC4ouC4h+C4leC4suC4oeC4peC4s+C4lOC4seC4muC4l+C4teC5iOC4nOC4ueC5ieC5g+C4iuC5ieC4quC4meC5g+C4iOC4geC5iOC4reC4mQogIHZhciBib2R5ID0gJyc7CiAgTk9USUZfR1JPVVBTLmZvckVhY2goZnVuY3Rpb24o',
  'Zyl7CiAgICB2YXIgbGlzdCA9IGl0ZW1zLmZpbHRlcihmdW5jdGlvbihhKXsgcmV0dXJuIGEubW9kdWxlID09PSBnLm1vZHVsZTsgfSk7CiAgICBpZiAoIWxpc3QubGVuZ3RoKSByZXR1cm47CiAgICAvLyDguIjguLPguJnguKfguJnguIjguKPguLTguIfguIjguLLg',
  'uIHguJXguLHguKfguJnguLHguJogKOC4o+C4suC4ouC4peC4sOC5gOC4reC4teC4ouC4lOC4quC5iOC4h+C4oeC4suC5hOC4oeC5iOC5gOC4geC4tOC4meC4q+C4meC5ieC4suC4peC4sCA0MCDguYDguKPguLfguYjguK3guIcpCiAgICB2YXIgYWxsID0gTWF0aC5t',
  'YXgobGlzdC5sZW5ndGgsIChBTEVSVFMuY291bnRzIHx8IHt9KVtnLm1vZHVsZV0gfHwgMCk7CiAgICBib2R5ICs9ICc8ZGl2IGNsYXNzPSJub3RpZi1zZWMiPicgKyBnLmljICsgJyAnICsgZXNjKGcubGFiZWwpICsgJyAoJyArIGFsbCArICcpPC9kaXY+JzsKICAg',
  'IGxpc3Quc2xpY2UoMCwgOCkuZm9yRWFjaChmdW5jdGlvbihhKXsKICAgICAgdmFyIGlzTmV3ID0gISFOT1RJRl9ORVdbYS5rZXldOwogICAgICBib2R5ICs9ICc8YnV0dG9uIGNsYXNzPSJub3RpZi1pdGVtIGwtJyArIGVzYyhhLmxldmVsKSArIChpc05ldyA/ICcg',
  'aXMtbmV3JyA6ICcnKSArICciIG9uY2xpY2s9ImdvdG9BbGVydCgnICsganNxKGEubW9kdWxlKSArICcpIj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0idHQiPicgKyAoaXNOZXcgPyAnPHNwYW4gY2xhc3M9Im5ldy1kb3QiIHRpdGxlPSLguYDguKPguLfguYjguK3g',
  'uIfguYPguKvguKHguYgiPjwvc3Bhbj4nIDogJycpICsgZXNjKGEudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgIChhLmRldGFpbCA/ICc8ZGl2IGNsYXNzPSJkZCI+JyArIGVzYyhhLmRldGFpbCkgKyAnPC9kaXY+JyA6ICcnKSArCiAgICAgICc8L2J1dHRvbj4n',
  'OwogICAgfSk7CiAgICBpZiAoYWxsID4gOCkgewogICAgICBib2R5ICs9ICc8YnV0dG9uIGNsYXNzPSJub3RpZi1tb3JlIiBvbmNsaWNrPSJnb3RvQWxlcnQoJyArIGpzcShnLm1vZHVsZSkgKyAnKSI+JyArCiAgICAgICAgJ+C4lOC4ueC4reC4teC4gSAnICsgKGFs',
  'bCAtIDgpICsgJyDguKPguLLguKLguIHguLLguKMg4oaSPC9idXR0b24+JzsKICAgIH0KICB9KTsKCiAgcGFuZWwuaW5uZXJIVE1MID0gaGVhZCArICc8ZGl2IGNsYXNzPSJub3RpZi1saXN0Ij4nICsgYm9keSArICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJu',
  'b3RpZi1mIj7guKPguLLguKLguIHguLLguKPguIjguLDguKvguLLguKLguYTguJvguYDguK3guIfguYDguKHguLfguYjguK3guYHguIHguYnguYDguKPguLfguYjguK3guIfguJnguLHguYnguJnguYHguKXguYnguKcgwrcg4Lit4Lix4Lib4LmA4LiU4LiVICcgKyBl',
  'c2MoU3RyaW5nKEFMRVJUUy5hdCB8fCAnJykuc2xpY2UoMTEsIDE2KSB8fCAn4oCTJykgKyAnIOC4mS4gwrcgJyArCiAgICAnPGEgaHJlZj0iamF2YXNjcmlwdDp2b2lkKDApIiBvbmNsaWNrPSJjbG9zZU5vdGlmKCk7Z28oXCdkYXNoYm9hcmRcJykiPuC4lOC4ueC4',
  'l+C4seC5ieC4h+C4q+C4oeC4lOC5g+C4meC5geC4lOC4iuC4muC4reC4o+C5jOC4lCDihpI8L2E+PC9kaXY+JzsKfQoKZnVuY3Rpb24gZ290b0FsZXJ0KG1vZHVsZSl7CiAgY2xvc2VOb3RpZigpOwogIGdvKG1vZHVsZSA9PT0gJ2RlYnQnID8gJ2RlYnRNYWluJyA6',
  'IG1vZHVsZSk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0gZm9ybWF0IGhlbHBlcnMgLS0tLS0tLS0tLS0tLS0tLSAqLwoKLyoqCiAqIOC4guC5ieC4reC4hOC4p+C4suC4oeC4l+C4teC5iOC4iOC4sOC5hOC4m+C5gOC4m+C5h+C4meC4reC4suC4o+C5jOC4geC4tOC4',
  'p+C5gOC4oeC4meC4leC5jOC4guC4reC4hyBKUyDguYPguJkgb25jbGljaz0i4oCmIgogKiBKU09OLnN0cmluZ2lmeSDguJfguLPguYPguKvguYnguYDguJvguYfguJnguKrguJXguKPguLTguIcgSlMg4LiX4Li14LmI4LiW4Li54LiB4LiV4LmJ4Lit4LiH4LmA4Liq',
  '4Lih4LitICjguKvguJnguLXguK3guLHguI3guJvguKPguLDguIHguLLguKgv4LmB4Lia4LmH4LiB4Liq4LmB4Lil4LiK4LmD4Lir4LmJKSDguYHguKXguYnguKcgZXNjIOC4geC4seC4meC4q+C4peC4uOC4lOC4reC4reC4geC4iOC4suC4gSBhdHRyaWJ1dGUKICog',
  '4LmD4LiK4LmJ4LmB4LiX4LiZ4LiB4Liy4Lij4LiV4LmI4LitICdcJycgKyDguITguYjguLIgKyAnXCcnIOC4leC4o+C4hyDguYYg4LiL4Li24LmI4LiH4LiE4LmI4Liy4LiX4Li14LmI4Lih4Li1ICcg4LiI4Liw4LiX4Liw4Lil4Li44Lit4Lit4LiB4Lih4Liy4Lij',
  '4Lix4LiZ4LmC4LiE4LmJ4LiU4LmE4LiU4LmJCiAqLwpmdW5jdGlvbiBqc3Eocyl7IHJldHVybiBlc2MoSlNPTi5zdHJpbmdpZnkoU3RyaW5nKHMgPT0gbnVsbCA/ICcnIDogcykpKTsgfQoKZnVuY3Rpb24gZXNjKHMpewogIHJldHVybiBTdHJpbmcocz09bnVsbD8n',
  'JzpzKQogICAgLnJlcGxhY2UoLyYvZywnJmFtcDsnKS5yZXBsYWNlKC88L2csJyZsdDsnKS5yZXBsYWNlKC8+L2csJyZndDsnKQogICAgLnJlcGxhY2UoLyIvZywnJnF1b3Q7JykucmVwbGFjZSgvJy9nLCcmIzM5OycpOwp9CmZ1bmN0aW9uIG1vbmV5KG4sIGRlYyl7',
  'CiAgdmFyIHYgPSBOdW1iZXIobnx8MCk7CiAgcmV0dXJuIHYudG9Mb2NhbGVTdHJpbmcoJ3RoLVRIJyx7bWluaW11bUZyYWN0aW9uRGlnaXRzOmRlY3x8MCwgbWF4aW11bUZyYWN0aW9uRGlnaXRzOmRlY3x8MH0pOwp9CmZ1bmN0aW9uIGJhaHQobil7IHJldHVybiBt',
  'b25leShuKSArICdcdTAwYTDguL8nOyB9ICAgLy8g4LmA4Lin4LmJ4LiZ4Lin4Lij4Lij4LiE4LmB4Lia4Lia4LmE4Lih4LmI4LiV4Lix4LiU4Lia4Lij4Lij4LiX4Lix4LiUIOKAlCDguL8g4LmE4Lih4LmI4Lir4Lil4Li44LiU4LmE4Lib4Lit4Lii4Li54LmI4Lia',
  '4Lij4Lij4LiX4Lix4LiU4LmD4Lir4Lih4LmI4LiE4LiZ4LmA4LiU4Li14Lii4LinCmZ1bmN0aW9uIHBjdChuKXsgcmV0dXJuIChOdW1iZXIobil8fDApLnRvRml4ZWQoMSkgKyAnJSc7IH0KZnVuY3Rpb24gbnVtKG4peyByZXR1cm4gbj09bnVsbHx8bj09PScnID8g',
  'J+KAkycgOiBtb25leShuKTsgfQoKLyoqIDIwMjYtMDQtMjYgLT4gMjYg4LmA4LihLuC4oi4gMjU2OSAqLwp2YXIgVEhfTU9OID0gWyfguKEu4LiELicsJ+C4gS7guJ4uJywn4Lih4Li1LuC4hC4nLCfguYDguKEu4LiiLicsJ+C4ni7guIQuJywn4Lih4Li0LuC4oi4n',
  'LCfguIEu4LiELicsJ+C4qi7guIQuJywn4LiBLuC4oi4nLCfguJUu4LiELicsJ+C4ni7guKIuJywn4LiYLuC4hC4nXTsKLyoqCiAqIOC4m+C4teC4l+C4teC5iOC4iOC4sOC5geC4quC4lOC4h+C4muC4meC4q+C4meC5ieC4suC4iOC4rSDigJQg4LiC4LmJ4Lit4Lih',
  '4Li54Lil4LmA4LiB4LmH4Lia4LmA4Lib4LmH4LiZIOC4hC7guKguIOC5gOC4quC4oeC4rQogKiDguJXguKPguIfguJnguLXguYnguYHguJvguKXguIfguJXguK3guJnguYHguKrguJTguIfguJzguKXguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcg4LiV4Liy',
  '4Lih4LiX4Li14LmI4LmA4Lil4Li34Lit4LiB4LmE4Lin4LmJ4LmD4LiZ4Lir4LiZ4LmJ4Liy4LiV4Lix4LmJ4LiH4LiE4LmI4LiyCiAqIOC4hOC5iOC4suC4leC4seC5ieC4h+C4leC5ieC4meC4hOC4t+C4rSDguIQu4LioLiDguYPguKvguYnguJXguKPguIfguIHg',
  'uLHguJrguJvguLXguJfguLXguYjguYDguIHguYfguJrguYPguJnguIrguLXguJXguYHguKXguLDguJvguI/guLTguJfguLTguJnguKrguLLguIHguKUKICovCmZ1bmN0aW9uIHVzZUJ1ZGRoaXN0WWVhcigpewogIHZhciBmID0gKFMuYm9vdCAmJiBTLmJvb3Quc2V0',
  'dGluZ3MgJiYgUy5ib290LnNldHRpbmdzLmRhdGVGb3JtYXQpIHx8ICfguIQu4LioLiAoMjAyNiknOwogIHJldHVybiBTdHJpbmcoZikuaW5kZXhPZign4LieLuC4qC4nKSA9PT0gMDsKfQpmdW5jdGlvbiBkaXNwbGF5WWVhcihjZSl7CiAgcmV0dXJuIHVzZUJ1ZGRo',
  'aXN0WWVhcigpID8gTnVtYmVyKGNlKSArIDU0MyA6IE51bWJlcihjZSk7Cn0KCmZ1bmN0aW9uIHRoRGF0ZShpc28pewogIGlmICghaXNvKSByZXR1cm4gJ+KAkyc7CiAgdmFyIG0gPSBTdHJpbmcoaXNvKS5tYXRjaCgvXihcZHs0fSktKFxkezJ9KS0oXGR7Mn0pLyk7',
  'CiAgaWYgKCFtKSByZXR1cm4gZXNjKGlzbyk7CiAgcmV0dXJuIE51bWJlcihtWzNdKSArICcgJyArIFRIX01PTltOdW1iZXIobVsyXSktMV0gKyAnICcgKyBkaXNwbGF5WWVhcihtWzFdKTsKfQpmdW5jdGlvbiB0aERhdGVTaG9ydChpc28pewogIGlmICghaXNvKSBy',
  'ZXR1cm4gJ+KAkyc7CiAgdmFyIG0gPSBTdHJpbmcoaXNvKS5tYXRjaCgvXihcZHs0fSktKFxkezJ9KS0oXGR7Mn0pLyk7CiAgaWYgKCFtKSByZXR1cm4gZXNjKGlzbyk7CiAgcmV0dXJuIE51bWJlcihtWzNdKSArICcvJyArIE51bWJlcihtWzJdKSArICcvJyArIFN0',
  'cmluZyhkaXNwbGF5WWVhcihtWzFdKSkuc2xpY2UoMik7Cn0KZnVuY3Rpb24gZGF5c0Fnbyhpc28pewogIGlmICghaXNvKSByZXR1cm4gbnVsbDsKICByZXR1cm4gTWF0aC5yb3VuZCgoRGF0ZS5ub3coKSAtIG5ldyBEYXRlKGlzbykuZ2V0VGltZSgpKS84NjQwMDAw',
  'MCk7Cn0KCmZ1bmN0aW9uIHN0YXR1c0JhZGdlKHN0KXsKICB2YXIgbWFwID0gewogICAgJ+C5gOC4quC4o+C5h+C4iOC4quC4tOC5ieC4mSc6J29rJywn4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4Lij4LmB4Lil4LmJ4LinJzonb2snLCfguYPguIrguYnguIfguLLg',
  'uJnguJvguIHguJXguLQnOidvaycsJ+C4m+C4tOC4lOC4q+C4meC4teC5ieC5geC4peC5ieC4pyc6J29rJywn4Lit4Lii4Li54LmI4LmD4LiZ4Lib4Lij4Liw4LiB4Lix4LiZJzonb2snLCfguKHguLXguJzguLnguYnguYDguIrguYjguLInOidvaycsJ+C4m+C4geC4',
  'leC4tCc6J29rJywKICAgICfguIHguLPguKXguLHguIfguIvguYjguK3guKEnOidpbmZvJywn4LiB4Liz4Lil4Lix4LiH4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4LijJzonaW5mbycsJ+C4meC4seC4lOC4q+C4oeC4suC4ouC5geC4peC5ieC4pyc6J2luZm8nLCfg',
  'uIHguLPguKXguLHguIfguJzguYjguK3guJknOidpbmZvJywn4Lin4LmI4Liy4LiHJzonaW5mbycsCiAgICAn4Lij4Lit4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4LijJzond2FybicsJ+C5gOC4peC4t+C5iOC4reC4meC4meC4seC4lCc6J3dhcm4nLCfguYPguIHg',
  'uKXguYnguKvguKHguJTguJvguKPguLDguIHguLHguJknOid3YXJuJywn4LiV4LmJ4Lit4LiH4LiL4LmI4Lit4LihJzond2FybicsJ+C4nuC4seC4geC4iuC4s+C4o+C4sCc6J3dhcm4nLCfguJvguLTguJTguJvguKPguLHguJrguJvguKPguLjguIcnOid3YXJuJywn',
  '4LmA4LiB4Li04LiZ4LiB4Liz4Lir4LiZ4LiUJzond2FybicsJ+C4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4peC5ieC4suC4hyc6J3dhcm4nLAogICAgJ+C4ouC4geC5gOC4peC4tOC4gSc6J211dGUnLCfguJvguKXguJTguKPguLDguKfguLLguIcnOidtdXRl',
  'Jywn4LmE4Lih4LmI4Lij4Liw4Lia4Li4JzonbXV0ZScsCiAgICAn4Lir4Lih4LiU4Lit4Liy4Lii4Li44LmB4Lil4LmJ4LinJzonZGdyJywn4LiU4LmI4Lin4LiZ4Lih4Liy4LiBJzonZGdyJywn4LiU4LmI4Lin4LiZJzond2FybicKICB9OwogIGlmICghc3QpIHJl',
  'dHVybiAnJzsKICByZXR1cm4gJzxzcGFuIGNsYXNzPSJiICcgKyAobWFwW3N0XXx8J211dGUnKSArICciPicgKyBlc2Moc3QpICsgJzwvc3Bhbj4nOwp9CgpmdW5jdGlvbiBwcm9ncmVzcyhwZXJjZW50LCBjbHMpewogIHZhciBwID0gTWF0aC5tYXgoMCwgTWF0aC5t',
  'aW4oMTAwLCBOdW1iZXIocGVyY2VudCl8fDApKTsKICByZXR1cm4gJzxkaXYgY2xhc3M9InBiYXIgJyArIChjbHN8fCcnKSArICciPjxpIHN0eWxlPSJ3aWR0aDonICsgcCArICclIj48L2k+PC9kaXY+JzsKfQoKZnVuY3Rpb24gdGh1bWJzSHRtbChyZWZzLCBiaWcp',
  'ewogIGlmICghcmVmcyB8fCAhcmVmcy5sZW5ndGgpIHJldHVybiAnPHNwYW4gY2xhc3M9ImZhaW50IGZzMTIiPuKAkzwvc3Bhbj4nOwogIHJldHVybiAnPGRpdiBjbGFzcz0idGh1bWJzIj4nICsgcmVmcy5tYXAoZnVuY3Rpb24ocil7CiAgICBpZiAoci50aHVtYikg',
  'ewogICAgICByZXR1cm4gJzxpbWcgY2xhc3M9InRodW1iJyArIChiaWc/JyBiaWcnOicnKSArICciIGxvYWRpbmc9ImxhenkiIHNyYz0iJyArIGVzYyhyLnRodW1iKSArICciICcgKwogICAgICAgICAgICAgJ29uY2xpY2s9IndpbmRvdy5vcGVuKCcgKyBqc3Eoc2Fm',
  'ZVVybChyLnVybCkpICsgJyxcJ19ibGFua1wnKSIgJyArCiAgICAgICAgICAgICAnb25lcnJvcj0idGhpcy5vbmVycm9yPW51bGw7dGhpcy5yZXBsYWNlV2l0aChmaWxlQ2hpcCgnICsgSlNPTi5zdHJpbmdpZnkoSlNPTi5zdHJpbmdpZnkocikpLnJlcGxhY2UoLyIv',
  'ZywnJnF1b3Q7JykgKyAnKSkiPic7CiAgICB9CiAgICB2YXIgdSA9IHNhZmVVcmwoci51cmwpOwogICAgcmV0dXJuIHUgPyAnPGEgY2xhc3M9ImIgaW5mbyIgaHJlZj0iJyArIGVzYyh1KSArICciIHRhcmdldD0iX2JsYW5rIiByZWw9Im5vb3BlbmVyIj7guYTguJ/g',
  'uKXguYw8L2E+JwogICAgICAgICAgICAgOiAnPHNwYW4gY2xhc3M9ImIgbXV0ZSIgdGl0bGU9IicgKyBlc2Moci5uYW1lIHx8ICcnKSArICciPuC5hOC4n+C4peC5jDwvc3Bhbj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7Cn0KCi8qKiDguKPguLHguJrguYDg',
  'uInguJ7guLLguLDguKXguLTguIfguIHguYwgaHR0cHMg4oCUIOC4hOC5iOC4suC4reC4ouC5iOC4suC4hyBqYXZhc2NyaXB0OiDguJfguLXguYjguJbguLnguIHguJ7guLTguKHguJ7guYzguKXguIfguIrguYjguK3guIfguYTguJ/guKXguYzguYHguJnguJrguYPg',
  'uJnguIrguLXguJXguIjguLDguYTguKHguYjguIHguKXguLLguKLguYDguJvguYfguJnguKXguLTguIfguIHguYwgKi8KZnVuY3Rpb24gc2FmZVVybCh1KXsgdSA9IFN0cmluZyh1ID09IG51bGwgPyAnJyA6IHUpLnRyaW0oKTsgcmV0dXJuIC9eaHR0cHM6XC9cLy9p',
  'LnRlc3QodSkgPyB1IDogJyc7IH0KZnVuY3Rpb24gZmlsZUNoaXAoanNvbil7CiAgdmFyIHIgPSB0eXBlb2YganNvbiA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKGpzb24pIDoganNvbjsKICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTsKICBh',
  'LmNsYXNzTmFtZSA9ICdiIGluZm8nOyBhLmhyZWYgPSBzYWZlVXJsKHIudXJsKSB8fCAnIyc7IGEudGFyZ2V0ID0gJ19ibGFuayc7IGEucmVsID0gJ25vb3BlbmVyJzsgYS50ZXh0Q29udGVudCA9ICfwn5OOIOC5hOC4n+C4peC5jCc7CiAgcmV0dXJuIGE7Cn0KCmZ1',
  'bmN0aW9uIGVtcHR5Qm94KHRleHQsIGFjdGlvbil7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj7wn5eC77iPPC9kaXY+JyArIGVzYyh0ZXh0KSArCiAgICAgICAgIChhY3Rpb24gPyAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIGFj',
  'dGlvbiArICc8L2Rpdj4nIDogJycpICsgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIGJhckNoYXJ0KGl0ZW1zLCBsYWJlbEtleSwgdmFsdWVLZXksIGZvcm1hdHRlcil7CiAgaWYgKCFpdGVtcyB8fCAhaXRlbXMubGVuZ3RoKSByZXR1cm4gJzxkaXYgY2xhc3M9ImVtcHR5',
  'Ij7guKLguLHguIfguYTguKHguYjguKHguLXguILguYnguK3guKHguLnguKU8L2Rpdj4nOwogIHZhciBtYXggPSBNYXRoLm1heC5hcHBseShudWxsLCBpdGVtcy5tYXAoZnVuY3Rpb24oaSl7IHJldHVybiBOdW1iZXIoaVt2YWx1ZUtleV0pfHwwOyB9KSkgfHwgMTsK',
  'ICByZXR1cm4gJzxkaXYgY2xhc3M9ImJhcnMiPicgKyBpdGVtcy5tYXAoZnVuY3Rpb24oaSl7CiAgICB2YXIgdiA9IE51bWJlcihpW3ZhbHVlS2V5XSl8fDA7CiAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImJhci1yb3ciPicgKwogICAgICAnPGRpdiBjbGFzcz0iY2xp',
  'cCIgdGl0bGU9IicgKyBlc2MoaVtsYWJlbEtleV0pICsgJyI+JyArIGVzYyhpW2xhYmVsS2V5XSkgKyAnPC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJiYXItdHJhY2siPjxkaXYgY2xhc3M9ImJhci1maWxsIiBzdHlsZT0id2lkdGg6JyArICh2L21heCoxMDAp',
  'ICsgJyUiPjwvZGl2PjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0idiI+JyArIChmb3JtYXR0ZXIgPyBmb3JtYXR0ZXIoaSkgOiBtb25leSh2KSkgKyAnPC9kaXY+JyArCiAgICAnPC9kaXY+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwp9CgovKiAtLS0t',
  'LS0tLS0tLS0tLS0tIG1vZGFsIC0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLQogICDguJXguLLguKPguLLguIfguJrguJnguIjguK3guYHguITguJoK',
  'ICAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tCiAgIOC4leC4suC4o+C4suC4h+C4geC4p+C5ieC4suC4hyAxLDAwMHB4IOC4reC5iOC4suC4meC4muC4meC4oeC4t+C4reC4luC4t+C4reC5',
  'hOC4oeC5iOC5hOC4q+C4pyDguJXguYnguK3guIfguYDguKXguLfguYjguK3guJnguIvguYnguLLguKLguILguKfguLLguJXguKXguK3guJQKICAg4LiI4Li24LiH4LiV4Li04LiU4LiK4Li34LmI4Lit4LiE4Lit4Lil4Lix4Lih4LiZ4LmM4LmE4Lin4LmJ4LiX4Li1',
  '4LmI4LmB4LiV4LmI4Lil4Liw4LiK4LmI4Lit4LiH4LiU4LmJ4Lin4LiiIGRhdGEtbGFiZWwg4LmB4Lil4LmJ4Lin4LmD4Lir4LmJIENTUwogICDguYDguJvguYfguJnguITguJnguJXguLHguJTguKrguLTguJnguKfguYjguLLguIjguLDguYHguKrguJTguIfguYDg',
  'uJvguYfguJnguJXguLLguKPguLLguIfguKvguKPguLfguK3guYDguJvguYfguJnguIHguLLguKPguYzguJTguJfguLXguKXguLDguKPguLLguKLguIHguLLguKMKCiAgIOC4l+C4s+C4l+C4teC5iOC4meC4teC5iOC4l+C4teC5iOC5gOC4lOC4teC4ouC4p+C4q+C4',
  'peC4seC4h+C4p+C4suC4lOC4q+C4meC5ieC4suC5gOC4quC4o+C5h+C4iCDguJfguLjguIHguJXguLLguKPguLLguIfguYPguJnguKPguLDguJrguJrguIjguLbguIfguYTguJTguYnguJzguKXguYDguKvguKHguLfguK3guJnguIHguLHguJnguKvguKHguJQKICAg',
  '4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LmE4Lil4LmI4LmB4LiB4LmJ4LiX4Li14Lil4Liw4LiV4Liy4Lij4Liy4LiHIOC5geC4peC4sOC4leC4suC4o+C4suC4h+C4l+C4teC5iOC5gOC4nuC4tOC5iOC4oeC5g+C4q+C4oeC5iOC4l+C4teC4q+C4peC4seC4h+C4geC5',
  'h+C5hOC4lOC5ieC5hOC4m+C4lOC5ieC4p+C4ouC5gOC4peC4ogogICBIVE1MIOC4ouC4seC4h+C5gOC4m+C5h+C4meC4iuC4uOC4lOC5gOC4lOC4teC4ouC4pyDguJXguYjguLLguIfguIHguLHguJnguYHguITguYggQ1NTIOC4ouC5iOC4rS3guILguKLguLLguKLg',
  'uKvguJnguYnguLLguJXguYjguLLguIfguIHguYfguKrguKXguLHguJrguYTguJTguYnguJfguLHguJnguJfguLUKLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqLwpmdW5jdGlvbiBsYWJl',
  'bENlbGxzKHJvb3QpewogIGlmICghcm9vdCkgcmV0dXJuOwogIHZhciB0YWJsZXMgPSByb290LnF1ZXJ5U2VsZWN0b3JBbGwgPyByb290LnF1ZXJ5U2VsZWN0b3JBbGwoJ3RhYmxlJykgOiBbXTsKICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKHRhYmxlcywg',
  'ZnVuY3Rpb24odCl7CiAgICB2YXIgaGVhZHMgPSBBcnJheS5wcm90b3R5cGUubWFwLmNhbGwodC5xdWVyeVNlbGVjdG9yQWxsKCd0aGVhZCB0aCcpLCBmdW5jdGlvbih0aCl7CiAgICAgIHJldHVybiAodGgudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKTsKICAgIH0p',
  'OwogICAgaWYgKCFoZWFkcy5sZW5ndGgpIHJldHVybjsKICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwodC5xdWVyeVNlbGVjdG9yQWxsKCd0Ym9keSB0cicpLCBmdW5jdGlvbih0cil7CiAgICAgIC8vIOC5geC4luC4p+C4quC4o+C4uOC4m+C4q+C4o+C4',
  't+C4reC5geC4luC4pyAi4LmE4Lih4LmI4Lih4Li14LiC4LmJ4Lit4Lih4Li54LilIiDguJfguLXguYjguKPguKfguKHguIrguYjguK3guIcg4Lib4Lil4LmI4Lit4Lii4LmE4Lin4LmJ4LmA4LiV4LmH4Lih4LiE4Lin4Liy4Lih4LiB4Lin4LmJ4Liy4LiHCiAgICAg',
  'IGlmICh0ci5xdWVyeVNlbGVjdG9yKCdbY29sc3Bhbl0nKSkgeyB0ci5jbGFzc0xpc3QuYWRkKCdyb3ctd2lkZScpOyByZXR1cm47IH0KICAgICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbCh0ci5jaGlsZHJlbiwgZnVuY3Rpb24odGQsIGkpewogICAgICAg',
  'IHZhciBsYWJlbCA9IGhlYWRzW2ldIHx8ICcnOwogICAgICAgIGlmIChsYWJlbCkgdGQuc2V0QXR0cmlidXRlKCdkYXRhLWxhYmVsJywgbGFiZWwpOwogICAgICAgIGVsc2UgdGQuY2xhc3NMaXN0LmFkZCgnY2VsbC1hY3Rpb25zJyk7ICAgLy8g4LiE4Lit4Lil4Lix',
  '4Lih4LiZ4LmM4Lib4Li44LmI4LihIOC5hOC4oeC5iOC4oeC4teC4q+C4seC4p+C4leC4suC4o+C4suC4hyDguYTguKHguYjguJXguYnguK3guIfguJXguLTguJTguJvguYnguLLguKIKCiAgICAgICAgLy8g4LiK4LmI4Lit4LiH4LiX4Li14LmI4LmE4Lih4LmI4Lih',
  '4Li14LiE4LmI4LiyICjguKfguYjguLLguIfguKvguKPguLfguK3guILguLXguJQpIOC4muC4meC4iOC4reC5geC4hOC4muC5hOC4oeC5iOC4leC5ieC4reC4h+C5guC4iuC4p+C5jOC5gOC4m+C5h+C4meC4muC4o+C4o+C4l+C4seC4lAogICAgICAgIC8vIOC4geC4',
  'suC4o+C5jOC4lOC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC4ouC4suC4p+C5gOC4geC5ieC4rSDguKrguYjguKfguJnguJrguJnguIjguK3guIHguKfguYnguLLguIfguKLguLHguIfguJXguYnguK3guIfguKHguLXguYDguJ7guLfguYjguK3guYPguKvguYnguITg',
  'uK3guKXguLHguKHguJnguYzguJXguKPguIfguIHguLHguJkKICAgICAgICB2YXIgdHh0ID0gKHRkLnRleHRDb250ZW50IHx8ICcnKS50cmltKCk7CiAgICAgICAgdmFyIGhhc1RoaW5nID0gdGQucXVlcnlTZWxlY3RvcignaW1nLGJ1dHRvbixhLGlucHV0LHN2Zywu',
  'dGh1bWInKTsKICAgICAgICBpZiAoKHR4dCA9PT0gJycgfHwgdHh0ID09PSAn4oCTJyB8fCB0eHQgPT09ICctJykgJiYgIWhhc1RoaW5nKSB7CiAgICAgICAgICB0ZC5jbGFzc0xpc3QuYWRkKCdjZWxsLWVtcHR5Jyk7CiAgICAgICAgfQogICAgICB9KTsKICAgIH0p',
  'OwogIH0pOwp9CgpmdW5jdGlvbiBvcGVuTW9kYWwodGl0bGUsIGJvZHlIdG1sLCBmb290SHRtbCwgd2lkZSl7CiAgdmFyIHJvb3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9kYWxSb290Jyk7CiAgcm9vdC5pbm5lckhUTUwgPQogICAgJzxkaXYgY2xhc3M9',
  'Im92IiBvbmNsaWNrPSJpZihldmVudC50YXJnZXQ9PT10aGlzKWNsb3NlTW9kYWwoKSI+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJtb2RhbCcgKyAod2lkZT8nIHdpZGUnOicnKSArICciPicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJtb2RhbC1oIj48aDM+JyArIGVz',
  'Yyh0aXRsZSkgKyAnPC9oMz48YnV0dG9uIGNsYXNzPSJ4IiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPsOXPC9idXR0b24+PC9kaXY+JyArCiAgICAgICAgJzxkaXYgY2xhc3M9Im1vZGFsLWIiPicgKyBib2R5SHRtbCArICc8L2Rpdj4nICsKICAgICAgICAoZm9vdEh0',
  'bWwgPyAnPGRpdiBjbGFzcz0ibW9kYWwtZiI+JyArIGZvb3RIdG1sICsgJzwvZGl2PicgOiAnJykgKwogICAgICAnPC9kaXY+JyArCiAgICAnPC9kaXY+JzsKICBhcHBseVJlYWRPbmx5KHJvb3QpOwogIGxhYmVsQ2VsbHMocm9vdCk7CiAgZG9jdW1lbnQuYm9keS5z',
  'dHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nOwp9CmZ1bmN0aW9uIGNsb3NlTW9kYWwoKXsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9kYWxSb290JykuaW5uZXJIVE1MID0gJyc7CiAgZG9jdW1lbnQuYm9keS5zdHlsZS5vdmVyZmxvdyA9ICcnOwp9CmRvY3Vt',
  'ZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihlKXsgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgY2xvc2VNb2RhbCgpOyB9KTsKCmZ1bmN0aW9uIGNvbmZpcm1BY3Rpb24odGV4dCwgb25ZZXMpewogIG9wZW5Nb2RhbCgn4Lii4Li34LiZ4Lii',
  '4Lix4LiZJywKICAgICc8cD4nICsgZXNjKHRleHQpICsgJzwvcD4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gZGdyIiBp',
  'ZD0iY2ZtQnRuIj7guKLguLfguJnguKLguLHguJk8L2J1dHRvbj4nKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2ZtQnRuJykub25jbGljayA9IGZ1bmN0aW9uKCl7IGNsb3NlTW9kYWwoKTsgb25ZZXMoKTsgfTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSB0',
  'b2FzdCAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiB0b2FzdChtc2csIGtpbmQsIG1zKXsKICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICBlbC5jbGFzc05hbWUgPSAndG9hc3QgJyArIChraW5kfHwnJyk7CiAgZWwudGV4dENv',
  'bnRlbnQgPSBtc2c7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvYXN0Um9vdCcpLmFwcGVuZENoaWxkKGVsKTsKICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IGVsLnJlbW92ZSgpOyB9LCBtcyB8fCAoa2luZD09PSdlcnInID8gNTIwMCA6IDI4MDApKTsKfQoK',
  'LyogLS0tLS0tLS0tLS0tLS0tLSBuYXYgKG1vYmlsZSkgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gdG9nZ2xlTmF2KCl7CiAgdmFyIG5hdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXYnKTsKICBuYXYuY2xhc3NMaXN0LnRvZ2dsZSgnb3Blbicp',
  'OwogIGlmIChuYXYuY2xhc3NMaXN0LmNvbnRhaW5zKCdvcGVuJykpIHsKICAgIHZhciBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICBzLmNsYXNzTmFtZSA9ICdzY3JpbSc7IHMuaWQgPSAnc2NyaW0nOwogICAgcy5vbmNsaWNrID0gZnVuY3Rp',
  'b24oKXsgbmF2LmNsYXNzTGlzdC5yZW1vdmUoJ29wZW4nKTsgcmVtb3ZlU2NyaW0oKTsgfTsKICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocyk7CiAgfSBlbHNlIHJlbW92ZVNjcmltKCk7Cn0KZnVuY3Rpb24gcmVtb3ZlU2NyaW0oKXsKICB2YXIgcyA9IGRv',
  'Y3VtZW50LmdldEVsZW1lbnRCeUlkKCdzY3JpbScpOwogIGlmIChzKSBzLnJlbW92ZSgpOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIHNlYXJjaCAtLS0tLS0tLS0tLS0tLS0tICovCgp2YXIgc2VhcmNoVGltZXIgPSBudWxsOwpmdW5jdGlvbiBvblNlYXJjaChxKXsK',
  'ICBjbGVhclRpbWVvdXQoc2VhcmNoVGltZXIpOwogIGlmICghcSB8fCBxLnRyaW0oKS5sZW5ndGggPCAyKSByZXR1cm47CiAgc2VhcmNoVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdhcHAuc2VhcmNoJywgeyBxOiBxIH0pLnRoZW4o',
  'ZnVuY3Rpb24ocm93cyl7CiAgICAgIG9wZW5Nb2RhbCgn4Lic4Lil4LiB4Liy4Lij4LiE4LmJ4LiZ4Lir4LiyICInICsgcSArICciICgnICsgcm93cy5sZW5ndGggKyAnKScsCiAgICAgICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0iYWxpc3QiPicgKyByb3dz',
  'Lm1hcChmdW5jdGlvbihyKXsKICAgICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0iYWxpIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCk7Z28oXCcnICsganVtcFBhZ2Uoci5tb2R1bGUpICsgJ1wnKSI+JyArCiAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJpYyI+JyArIG1v',
  'ZHVsZUljb24oci5tb2R1bGUpICsgJzwvZGl2PjxkaXY+JyArCiAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJ0dCI+JyArIGVzYyhyLnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImRkIj4nICsgZXNjKHIubGFiZWwpICsgKHIuZGV0',
  'YWlsID8gJyDCtyAnICsgZXNjKHIuZGV0YWlsKSA6ICcnKSArICc8L2Rpdj4nICsKICAgICAgICAgICAgJzwvZGl2PjwvZGl2Pic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JwogICAgICAgIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij7guYTguKHguYjguJ7g',
  'uJrguKPguLLguKLguIHguLLguKPguJfguLXguYjguJXguKPguIfguIHguLHguJrguITguLPguITguYnguJk8L2Rpdj4nLCAnJywgdHJ1ZSk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7IH0pOwogIH0sIDQyMCk7',
  'Cn0KZnVuY3Rpb24ganVtcFBhZ2UobW9kdWxlKXsKICByZXR1cm4gKHtwdXJjaGFzZXM6J3B1cmNoYXNlcycsIHJlcGFpcnM6J3JlcGFpcnMnLCBidWlsZGluZzonYnVpbGRpbmcnLCBhYzonYWMnLCBkZWJ0OidkZWJ0TWFpbicsIHJvb21zOidyb29tcyd9KVttb2R1',
  'bGVdIHx8ICdkYXNoYm9hcmQnOwp9CmZ1bmN0aW9uIG1vZHVsZUljb24obW9kdWxlKXsKICByZXR1cm4gKHtwdXJjaGFzZXM6J/Cfm5InLCByZXBhaXJzOifwn5SnJywgYnVpbGRpbmc6J/Cfj6InLCBhYzon4p2E77iPJywgZGVidDon8J+SsCcsIHJvb21zOifwn5qq',
  'J30pW21vZHVsZV0gfHwgJ/Cfk4QnOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIGZpbGUgdXBsb2FkIC0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKgogKiDguK3guYjguLLguJnguYTguJ/guKXguYzguIjguLLguIEgPGlucHV0IHR5cGU9ZmlsZT4g4LmA4Lib4LmH4LiZ',
  'IGRhdGFVUkwg4LmB4Lil4LmJ4Lin4Liq4LmI4LiH4LiC4Li24LmJ4LiZIERyaXZlCiAqIOC4hOC4t+C4mSBhcnJheSDguILguK3guIcge2lkLG5hbWUsdXJsLHRodW1ifQogKi8KZnVuY3Rpb24gdXBsb2FkRmlsZXMoaW5wdXRFbCwgYnVja2V0KXsKICB2YXIgZmls',
  'ZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChpbnB1dEVsLmZpbGVzIHx8IFtdKTsKICBpZiAoIWZpbGVzLmxlbmd0aCkgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7CiAgdmFyIE1BWCA9IDEyICogMTAyNCAqIDEwMjQ7CiAgdmFyIHRvb0JpZyA9IGZp',
  'bGVzLmZpbHRlcihmdW5jdGlvbihmKXsgcmV0dXJuIGYuc2l6ZSA+IE1BWDsgfSk7CiAgaWYgKHRvb0JpZy5sZW5ndGgpIHsKICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ+C5hOC4n+C4peC5jOC5g+C4q+C4jeC5iOC5gOC4geC4tOC4mSAxMiBN',
  'QjogJyArIHRvb0JpZy5tYXAoZnVuY3Rpb24oZil7cmV0dXJuIGYubmFtZTt9KS5qb2luKCcsICcpKSk7CiAgfQogIHJldHVybiBQcm9taXNlLmFsbChmaWxlcy5tYXAocmVhZEFzRGF0YVVybCkpCiAgICAudGhlbihmdW5jdGlvbihwYXlsb2Fkcyl7IHJldHVybiBj',
  'YWxsQXBpKCdmaWxlLnVwbG9hZCcsIHsgYnVja2V0OiBidWNrZXQsIGZpbGVzOiBwYXlsb2FkcyB9KTsgfSk7Cn0KCmZ1bmN0aW9uIHJlYWRBc0RhdGFVcmwoZmlsZSl7CiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7CiAgICB2',
  'YXIgciA9IG5ldyBGaWxlUmVhZGVyKCk7CiAgICByLm9ubG9hZCA9IGZ1bmN0aW9uKCl7IHJlc29sdmUoeyBuYW1lOiBmaWxlLm5hbWUsIG1pbWVUeXBlOiBmaWxlLnR5cGUsIGRhdGFVcmw6IHIucmVzdWx0IH0pOyB9OwogICAgci5vbmVycm9yID0gZnVuY3Rpb24o',
  'KXsgcmVqZWN0KG5ldyBFcnJvcign4Lit4LmI4Liy4LiZ4LmE4Lif4Lil4LmM4LmE4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIOiAnICsgZmlsZS5uYW1lKSk7IH07CiAgICByLnJlYWRBc0RhdGFVUkwoZmlsZSk7CiAgfSk7Cn0KPC9zY3JpcHQ+CjxzY3JpcHQ+Ci8q',
  'ID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBBdXRoLmh0bWwg4oCUIOC4q+C4meC5ieC4suC4peC5h+C4reC4geC4reC4tOC4mSDCtyBQSU4gNiDguKvguKXguLHguIEgwrcg4LmA4Lib4Lil4Li14LmI',
  '4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZCgogICDguJfguLXguYjguYDguIHguYfguJrguILguK3guIfguJ3guLHguYjguIfguYDguJrguKPguLLguKfguYzguYDguIvguK3guKPguYwgMiDguIrguLHguYnguJkg4LmA4Lie4Lij4Liy4Liw4LmA4Lin4LmH',
  '4Lia4LmB4Lit4Lib4LiC4Lit4LiHIEFwcHMgU2NyaXB0CiAgIOC4l+C4s+C4h+C4suC4meC5g+C4mSBpZnJhbWUg4LiX4Li14LmI4LiK4Li34LmI4Lit4LmC4LiU4LmA4Lih4LiZ4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LiX4Li44LiB4LiE4Lij4Lix4LmJ4LiH4LiX',
  '4Li14LmI4LmA4Lib4Li04LiUCiAgIGxvY2FsU3RvcmFnZSDguIjguLbguIfguKvguLLguKLguYTguJTguYkg4LiV4LmJ4Lit4LiH4Lih4Li14LiX4Liy4LiH4Liq4Liz4Lij4Lit4LiHCiAgICAgwrcg4Lij4Lir4Lix4Liq4Lit4LmJ4Liy4LiH4Lit4Li04LiH4LiB',
  '4Liy4Lij4LmA4LiC4LmJ4Liy4LmD4LiK4LmJ4LiH4Liy4LiZICjguK3guLLguKLguLjguKrguLHguYnguJkpIOKAlCDguYDguIHguYfguJrguYPguJkgbG9jYWxTdG9yYWdlIOC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pwogICAgICAg4Lir4Liy4Lii4LiB',
  '4LmH4LmB4LiE4LmI4LmD4Liq4LmIIFBJTiDguYPguKvguKHguYgKICAgICDCtyDguKPguKvguLHguKrguK3guLjguJvguIHguKPguJPguYwgKOC4hOC4ueC5iOC4geC4seC4miBQSU4pIOKAlCDguYDguIHguYfguJrguJfguLHguYnguIcgbG9jYWxTdG9yYWdlIOC5',
  'geC4peC4sOC5g+C4mSBVUkwg4LiC4Lit4LiH4Lir4LiZ4LmJ4Liy4LmB4Lih4LmICiAgICAgICDguJzguYjguLLguJkgZ29vZ2xlLnNjcmlwdC5oaXN0b3J5IOC5gOC4nuC4t+C5iOC4reC5g+C4q+C5ieC4ouC4seC4h+C4reC4ouC4ueC5iOC4q+C4peC4seC4h+C4',
  'm+C4tOC4lOC5gOC4m+C4tOC4lOC5gOC4hOC4o+C4t+C5iOC4reC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCnZhciBBVVRIID0gewogIHNlc3Npb246ICcnLAogIGRldmljZTogJycsCiAg',
  'bWU6IG51bGwsCiAgcGluOiAnJywKICBzY3JlZW46ICcnCn07Cgp2YXIgTFNfU0VTU0lPTiA9ICdtY29ybmVyLnNlc3Npb24nOwp2YXIgTFNfREVWSUNFICA9ICdtY29ybmVyLmRldmljZSc7CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4l+C4teC5iOC5gOC4geC5h+C4',
  'muC4neC4seC5iOC4h+C5gOC4muC4o+C4suC4p+C5jOC5gOC4i+C4reC4o+C5jCAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiBsc0dldChrKXsKICB0cnkgeyByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGspIHx8ICcnOyB9IGNhdGNoIChl',
  'KSB7IHJldHVybiAnJzsgfQp9CmZ1bmN0aW9uIGxzU2V0KGssIHYpewogIHRyeSB7IHYgPyB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oaywgdikgOiB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oayk7IH0KICBjYXRjaCAoZSkgeyAvKiDguYLguKvg',
  'uKHguJTguKrguYjguKfguJnguJXguLHguKfguKvguKPguLfguK3guJvguLTguJTguITguLjguIHguIHguLXguYnguYTguKfguYkg4oCUIOC5g+C4iuC5ieC4l+C4suC4h+C4quC4s+C4o+C4reC4hyAqLyB9Cn0KCi8qKiDguYDguILguLXguKLguJnguKPguKvguLHg',
  'uKrguK3guLjguJvguIHguKPguJPguYzguKXguIcgVVJMIOC4guC4reC4h+C4q+C4meC5ieC4suC5geC4oeC5iCDguYPguKvguYnguKPguK3guJTguILguYnguLLguKHguIHguLLguKPguYDguJvguLTguJTguYPguKvguKHguYggKi8KZnVuY3Rpb24gZGV2aWNlVG9V',
  'cmwodG9rZW4pewogIHRyeSB7CiAgICBpZiAoIXdpbmRvdy5nb29nbGUgfHwgIWdvb2dsZS5zY3JpcHQgfHwgIWdvb2dsZS5zY3JpcHQuaGlzdG9yeSkgcmV0dXJuOwogICAgdmFyIHBhcmFtcyA9IHt9OwogICAgaWYgKGFjY2Vzc0tleSgpKSBwYXJhbXMua2V5ID0g',
  'YWNjZXNzS2V5KCk7CiAgICBpZiAodG9rZW4pIHBhcmFtcy5kID0gdG9rZW47CiAgICBnb29nbGUuc2NyaXB0Lmhpc3RvcnkucmVwbGFjZVN0YXRlKHt9LCBwYXJhbXMsIGxvY2F0aW9uLmhhc2gpOwogIH0gY2F0Y2ggKGUpIHsgLyog4LmE4Lih4LmI4LmD4LiK4LmI',
  '4LmA4Lin4LmH4Lia4LmB4Lit4LibICjguYDguIrguYjguJnguYDguJvguLTguJTguYPguJkgZGlhbG9nKSDigJQg4LiC4LmJ4Liy4Lih4LmE4LibICovIH0KfQoKZnVuY3Rpb24gc2F2ZURldmljZSh0b2tlbil7CiAgQVVUSC5kZXZpY2UgPSB0b2tlbiB8fCAnJzsK',
  'ICBsc1NldChMU19ERVZJQ0UsIEFVVEguZGV2aWNlKTsKICBkZXZpY2VUb1VybChBVVRILmRldmljZSk7Cn0KCmZ1bmN0aW9uIHNhdmVTZXNzaW9uKHRva2VuKXsKICBBVVRILnNlc3Npb24gPSB0b2tlbiB8fCAnJzsKICBsc1NldChMU19TRVNTSU9OLCBBVVRILnNl',
  'c3Npb24pOwp9CgovKiog4Lit4LmI4Liy4LiZ4LiE4LmI4Liy4LiX4Li14LmI4LmA4LiB4LmH4Lia4LmE4Lin4LmJ4LiX4Lix4LmJ4LiH4Lir4Lih4LiUICjguJXguYnguK3guIfguKPguK0gVVJMIOC4guC4reC4h+C4q+C4meC5ieC4suC5geC4oeC5iCDguIjguLbg',
  'uIfguYDguJvguYfguJnguYHguJrguJogY2FsbGJhY2spICovCmZ1bmN0aW9uIGxvYWRTdG9yZWQoZG9uZSl7CiAgQVVUSC5zZXNzaW9uID0gbHNHZXQoTFNfU0VTU0lPTik7CiAgQVVUSC5kZXZpY2UgID0gbHNHZXQoTFNfREVWSUNFKTsKCiAgaWYgKHdpbmRvdy5n',
  'b29nbGUgJiYgZ29vZ2xlLnNjcmlwdCAmJiBnb29nbGUuc2NyaXB0LnVybCkgewogICAgdHJ5IHsKICAgICAgZ29vZ2xlLnNjcmlwdC51cmwuZ2V0TG9jYXRpb24oZnVuY3Rpb24obG9jKXsKICAgICAgICB2YXIgcCA9IChsb2MgJiYgbG9jLnBhcmFtZXRlcikgfHwg',
  'e307CiAgICAgICAgaWYgKHAuZCAmJiAhQVVUSC5kZXZpY2UpIHsgQVVUSC5kZXZpY2UgPSBTdHJpbmcocC5kKTsgbHNTZXQoTFNfREVWSUNFLCBBVVRILmRldmljZSk7IH0KICAgICAgICBpZiAocC5rZXkgJiYgIWFjY2Vzc0tleSgpKSBSRVNPTFZFRF9LRVkgPSBT',
  'dHJpbmcocC5rZXkpOwogICAgICAgIGRvbmUoKTsKICAgICAgfSk7CiAgICAgIHJldHVybjsKICAgIH0gY2F0Y2ggKGUpIHsgLyog4LmD4LiK4LmJ4LiX4Liy4LiH4Lib4LiB4LiV4Li0ICovIH0KICB9CiAgLy8g4LmA4Lib4Li04LiU4LiI4Liy4LiBIENsb3VkZmxh',
  'cmU6IOC4reC5iOC4suC4meC4nuC4suC4o+C4suC4oeC4tOC5gOC4leC4reC4o+C5jOC4iOC4suC4geC4l+C4teC5iOC4reC4ouC4ueC5iOC4q+C4meC5ieC4suC5gOC4p+C5h+C4muC4leC4o+C4hyDguYYKICB0cnkgewogICAgdmFyIHEgPSBuZXcgVVJMU2VhcmNo',
  'UGFyYW1zKGxvY2F0aW9uLnNlYXJjaCk7CiAgICBpZiAocS5nZXQoJ2QnKSAmJiAhQVVUSC5kZXZpY2UpIHsgQVVUSC5kZXZpY2UgPSBxLmdldCgnZCcpOyBsc1NldChMU19ERVZJQ0UsIEFVVEguZGV2aWNlKTsgfQogICAgaWYgKHEuZ2V0KCdrZXknKSAmJiAhYWNj',
  'ZXNzS2V5KCkpIFJFU09MVkVEX0tFWSA9IHEuZ2V0KCdrZXknKTsKICB9IGNhdGNoIChlMikgeyAvKiDguYDguJrguKPguLLguKfguYzguYDguIvguK3guKPguYzguYDguIHguYjguLLguKHguLLguIEgKi8gfQogIGRvbmUoKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0t',
  'LSDguJXguLHguKfguITguLjguKHguKXguLPguJTguLHguJrguKvguJnguYnguLLguIjguK0gLS0tLS0tLS0tLS0tLS0tLSAqLwoKLyoqIOC5gOC4o+C4teC4ouC4geC4leC4reC4meC5gOC4m+C4tOC4lOC4q+C4meC5ieC4suC5gOC4p+C5h+C4miDigJQg4LiV4Lix',
  '4LiU4Liq4Li04LiZ4Lin4LmI4Liy4LiI4Liw4LmD4Lir4LmJ4LmA4Lir4LmH4LiZ4Lit4Liw4LmE4Lij4LiB4LmI4Lit4LiZICovCmZ1bmN0aW9uIGF1dGhHYXRlKCl7CiAgbG9hZFN0b3JlZChmdW5jdGlvbigpewogICAgY2FsbEFwaSgnYXV0aC5tZScpLnRoZW4o',
  'ZnVuY3Rpb24obWUpewogICAgICBBVVRILm1lID0gbWU7CiAgICAgIGlmIChtZS5zaWduZWRJbikgcmV0dXJuIGVudGVyQXBwKG1lKTsKICAgICAgaWYgKEFVVEguZGV2aWNlKSByZXR1cm4gc2hvd1BpbigpOwogICAgICBzaG93TG9naW4oKTsKICAgIH0pLmNhdGNo',
  'KGZ1bmN0aW9uKGUpewogICAgICBzaG93TG9naW4oZS5tZXNzYWdlIHx8IGUpOwogICAgfSk7CiAgfSk7Cn0KCmZ1bmN0aW9uIGVudGVyQXBwKG1lKXsKICBBVVRILm1lID0gbWU7CiAgaGlkZUF1dGgoKTsKICBib290Tm93KCk7CiAgLy8g4LmA4Lie4Li04LmI4LiH',
  '4Lil4LmH4Lit4LiB4Lit4Li04LiZ4LiU4LmJ4Lin4Lii4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmB4Lil4Liw4Lii4Lix4LiH4LmE4Lih4LmI4LmA4LiE4Lii4LiV4Lix4LmJ4LiHIFBJTiDguJrguJnguYDguITguKPguLfguYjguK3guIfguJnguLXguYkg4oCU',
  'IOC4iuC4p+C4meC4leC4seC5ieC4h+C4quC4seC4geC4hOC4o+C4seC5ieC4hwogIGlmICghQVVUSC5kZXZpY2UgJiYgbWUudXNlcm5hbWUgJiYgIWxzR2V0KCdtY29ybmVyLnBpbkFza2VkJykpIHsKICAgIHNldFRpbWVvdXQob2ZmZXJQaW4sIDkwMCk7CiAgfQp9',
  'CgpmdW5jdGlvbiBoaWRlQXV0aCgpewogIHZhciByID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F1dGhSb290Jyk7CiAgaWYgKHIpIHIuaW5uZXJIVE1MID0gJyc7CiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdsb2NrZWQnKTsKfQoKZnVuY3Rp',
  'b24gc2hvd0F1dGgoaHRtbCl7CiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdsb2NrZWQnKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXV0aFJvb3QnKS5pbm5lckhUTUwgPQogICAgJzxkaXYgY2xhc3M9ImF1dGgtd3JhcCI+PGRpdiBjbGFzcz0i',
  'YXV0aC1jYXJkIj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImF1dGgtYnJhbmQiPvCfj6IgPGI+JyArIGVzYygoUy5ib290ICYmIFMuYm9vdC5hcHAgJiYgUy5ib290LmFwcC5uYW1lKSB8fCAnVGhlIE0gQ29ybmVyIEFQJykgKyAnPC9iPjwvZGl2PicgKwogICAgICBo',
  'dG1sICsKICAgICc8L2Rpdj48L2Rpdj4nOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4q+C4meC5ieC4suC4peC5h+C4reC4geC4reC4tOC4meC4lOC5ieC4p+C4ouC4o+C4q+C4seC4quC4nOC5iOC4suC4mSAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiBz',
  'aG93TG9naW4oZXJyKXsKICBBVVRILnNjcmVlbiA9ICdsb2dpbic7CiAgc2hvd0F1dGgoCiAgICAnPGgyIGNsYXNzPSJhdXRoLWgiPuC5gOC4guC5ieC4suC4quC4ueC5iOC4o+C4sOC4muC4mjwvaDI+JyArCiAgICAnPHAgY2xhc3M9ImF1dGgtc3ViIj7guYPguKrg',
  'uYjguIrguLfguYjguK3guJzguLnguYnguYPguIrguYnguYHguKXguLDguKPguKvguLHguKrguJzguYjguLLguJnguJfguLXguYjguYTguJTguYnguKPguLHguJo8L3A+JyArCiAgICAoZXJyID8gJzxkaXYgY2xhc3M9ImF1dGgtZXJyIj4nICsgZXNjKGVycikgKyAn',
  'PC9kaXY+JyA6ICc8ZGl2IGNsYXNzPSJhdXRoLWVyciIgaWQ9ImF1dGhFcnIiIGhpZGRlbj48L2Rpdj4nKSArCiAgICAnPGRpdiBjbGFzcz0iYXV0aC1mIj48bGFiZWwgZm9yPSJsZ1VzZXIiPuC4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5iTwvbGFiZWw+JyAr',
  'CiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImxnVXNlciIgYXV0b2NvbXBsZXRlPSJ1c2VybmFtZSIgYXV0b2NhcGl0YWxpemU9Im5vbmUiIHNwZWxsY2hlY2s9ImZhbHNlIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJhdXRoLWYiPjxsYWJlbCBmb3I9',
  'ImxnUGFzcyI+4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZPC9sYWJlbD4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0ibGdQYXNzIiB0eXBlPSJwYXNzd29yZCIgYXV0b2NvbXBsZXRlPSJjdXJyZW50LXBhc3N3b3JkIj48L2Rpdj4nICsKICAgICc8YnV0',
  'dG9uIGNsYXNzPSJidG4gcHJpIGF1dGgtZ28iIGlkPSJsZ0dvIj7guYDguILguYnguLLguKrguLnguYjguKPguLDguJrguJo8L2J1dHRvbj4nICsKICAgIChBVVRILmRldmljZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4gYXV0aC1hbHQiIG9uY2xpY2s9InNob3dQaW4o',
  'KSI+4oaQIOC4geC4peC4seC4muC5hOC4m+C5g+C4iuC5iSBQSU48L2J1dHRvbj4nIDogJycpICsKICAgICc8cCBjbGFzcz0iYXV0aC1mb290Ij7guKXguLfguKHguKPguKvguLHguKrguJzguYjguLLguJk/IOC5g+C4q+C5ieC4nOC4ueC5ieC4lOC4ueC5geC4peC4',
  'leC4seC5ieC4h+C4o+C4q+C4seC4quC5g+C4q+C4oeC5iOC5g+C4q+C5ieC4iOC4suC4geC5gOC4oeC4meC4ueC5g+C4meC4iuC4teC4lTwvcD4nCiAgKTsKCiAgdmFyIGdvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xnR28nKTsKICB2YXIgdXNlciA9IGRv',
  'Y3VtZW50LmdldEVsZW1lbnRCeUlkKCdsZ1VzZXInKTsKICB2YXIgcGFzcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsZ1Bhc3MnKTsKCiAgZnVuY3Rpb24gc3VibWl0KCl7CiAgICB2YXIgdSA9IHVzZXIudmFsdWUudHJpbSgpLCBwID0gcGFzcy52YWx1ZTsK',
  'ICAgIGlmICghdSB8fCAhcCkgcmV0dXJuIGF1dGhFcnJvcign4LiB4Lij4Li44LiT4Liy4LiB4Lij4Lit4LiB4LiX4Lix4LmJ4LiH4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmB4Lil4Liw4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZJyk7CiAgICBnby5k',
  'aXNhYmxlZCA9IHRydWU7CiAgICBnby5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4LiV4Lij4Lin4LiI4Liq4Lit4Lia4oCmJzsKICAgIGNhbGxBcGkoJ2F1dGgubG9naW4nLCB7IHVzZXJuYW1lOiB1LCBwYXNz',
  'd29yZDogcCB9KS50aGVuKGZ1bmN0aW9uKHIpewogICAgICBzYXZlU2Vzc2lvbihyLnNlc3Npb24pOwogICAgICBpZiAoci5tdXN0Q2hhbmdlKSByZXR1cm4gc2hvd0NoYW5nZVBhc3N3b3JkKHRydWUpOwogICAgICByZXR1cm4gY2FsbEFwaSgnYXV0aC5tZScpLnRo',
  'ZW4oZW50ZXJBcHApOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgIGdvLmRpc2FibGVkID0gZmFsc2U7CiAgICAgIGdvLnRleHRDb250ZW50ID0gJ+C5gOC4guC5ieC4suC4quC4ueC5iOC4o+C4sOC4muC4mic7CiAgICAgIHBhc3MudmFsdWUgPSAnJzsK',
  'ICAgICAgYXV0aEVycm9yKGUubWVzc2FnZSB8fCBlKTsKICAgIH0pOwogIH0KCiAgZ28ub25jbGljayA9IHN1Ym1pdDsKICBbdXNlciwgcGFzc10uZm9yRWFjaChmdW5jdGlvbihlbCl7CiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24o',
  'ZXYpeyBpZiAoZXYua2V5ID09PSAnRW50ZXInKSBzdWJtaXQoKTsgfSk7CiAgfSk7CiAgdXNlci5mb2N1cygpOwp9CgpmdW5jdGlvbiBhdXRoRXJyb3IobXNnKXsKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXV0aEVycicpOwogIGlmIChlbCkg',
  'eyBlbC50ZXh0Q29udGVudCA9IG1zZzsgZWwuaGlkZGVuID0gZmFsc2U7IH0KICBlbHNlIHNob3dMb2dpbihtc2cpOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4q+C4meC5ieC4siBQSU4gNiDguKvguKXguLHguIEgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rp',
  'b24gc2hvd1BpbigpewogIEFVVEguc2NyZWVuID0gJ3Bpbic7CiAgQVVUSC5waW4gPSAnJzsKICBzaG93QXV0aCgKICAgICc8aDIgY2xhc3M9ImF1dGgtaCI+4LmD4Liq4LmIIFBJTjwvaDI+JyArCiAgICAnPHAgY2xhc3M9ImF1dGgtc3ViIj7guJvguKXguJTguKXg',
  'uYfguK3guIHguJTguYnguKfguKLguKPguKvguLHguKogNiDguKvguKXguLHguIHguILguK3guIfguYDguITguKPguLfguYjguK3guIfguJnguLXguYk8L3A+JyArCiAgICAnPGRpdiBjbGFzcz0iYXV0aC1lcnIiIGlkPSJhdXRoRXJyIiBoaWRkZW4+PC9kaXY+JyAr',
  'CiAgICAnPGRpdiBjbGFzcz0icGluLWRvdHMiIGlkPSJwaW5Eb3RzIj4nICsgcGluRG90c0h0bWwoJycpICsgJzwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InBpbi1wYWQiPicgKwogICAgICBbMSwyLDMsNCw1LDYsNyw4LDldLm1hcChmdW5jdGlvbihuKXsKICAg',
  'ICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9InBpbi1rIiBvbmNsaWNrPSJwaW5QdXNoKFwnJyArIG4gKyAnXCcpIj4nICsgbiArICc8L2J1dHRvbj4nOwogICAgICB9KS5qb2luKCcnKSArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJwaW4tayBnaG9zdCIgb25jbGlj',
  'az0ic2hvd0xvZ2luKCkiIHRpdGxlPSLguYPguIrguYnguKPguKvguLHguKrguJzguYjguLLguJnguYHguJfguJkiPvCflJE8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9InBpbi1rIiBvbmNsaWNrPSJwaW5QdXNoKFwnMFwnKSI+MDwvYnV0dG9uPicg',
  'KwogICAgICAnPGJ1dHRvbiBjbGFzcz0icGluLWsgZ2hvc3QiIG9uY2xpY2s9InBpbkJhY2soKSIgdGl0bGU9IuC4peC4miI+4oyrPC9idXR0b24+JyArCiAgICAnPC9kaXY+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIGF1dGgtYWx0IiBvbmNsaWNrPSJmb3Jn',
  'ZXRUaGlzRGV2aWNlKCkiPuC4peC4t+C4oSBQSU4g4oCUIOC5gOC4guC5ieC4suC4lOC5ieC4p+C4ouC4o+C4q+C4seC4quC4nOC5iOC4suC4mTwvYnV0dG9uPicKICApOwoKICAvLyDguITguLXguKLguYzguJrguK3guKPguYzguJTguIjguKPguLTguIfguIHguYfg',
  'uYPguIrguYnguYTguJTguYkg4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LiI4Li04LmJ4Lih4Lib4Li44LmI4Lih4Lia4LiZ4LiI4LitCiAgZG9jdW1lbnQub25rZXlkb3duID0gZnVuY3Rpb24oZXYpewogICAgaWYgKEFVVEguc2NyZWVuICE9PSAncGluJykgcmV0dXJu',
  'OwogICAgaWYgKC9eXGQkLy50ZXN0KGV2LmtleSkpIHBpblB1c2goZXYua2V5KTsKICAgIGVsc2UgaWYgKGV2LmtleSA9PT0gJ0JhY2tzcGFjZScpIHBpbkJhY2soKTsKICB9Owp9CgpmdW5jdGlvbiBwaW5Eb3RzSHRtbChwaW4pewogIHZhciBodG1sID0gJyc7CiAg',
  'Zm9yICh2YXIgaSA9IDA7IGkgPCA2OyBpKyspIGh0bWwgKz0gJzxpIGNsYXNzPSInICsgKGkgPCBwaW4ubGVuZ3RoID8gJ29uJyA6ICcnKSArICciPjwvaT4nOwogIHJldHVybiBodG1sOwp9CgpmdW5jdGlvbiBwaW5QdXNoKGQpewogIGlmIChBVVRILnBpbi5sZW5n',
  'dGggPj0gNikgcmV0dXJuOwogIEFVVEgucGluICs9IGQ7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpbkRvdHMnKS5pbm5lckhUTUwgPSBwaW5Eb3RzSHRtbChBVVRILnBpbik7CiAgaWYgKEFVVEgucGluLmxlbmd0aCA9PT0gNikgc2V0VGltZW91dChwaW5T',
  'dWJtaXQsIDEyMCk7Cn0KCmZ1bmN0aW9uIHBpbkJhY2soKXsKICBBVVRILnBpbiA9IEFVVEgucGluLnNsaWNlKDAsIC0xKTsKICB2YXIgZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaW5Eb3RzJyk7CiAgaWYgKGQpIGQuaW5uZXJIVE1MID0gcGluRG90c0h0',
  'bWwoQVVUSC5waW4pOwp9CgpmdW5jdGlvbiBwaW5TdWJtaXQoKXsKICB2YXIgcGluID0gQVVUSC5waW47CiAgQVVUSC5waW4gPSAnJzsKICB2YXIgZG90cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaW5Eb3RzJyk7CiAgaWYgKGRvdHMpIGRvdHMuY2xhc3NM',
  'aXN0LmFkZCgnYnVzeScpOwoKICBjYWxsQXBpKCdhdXRoLnVubG9jaycsIHsgZGV2aWNlOiBBVVRILmRldmljZSwgcGluOiBwaW4gfSkudGhlbihmdW5jdGlvbihyKXsKICAgIHNhdmVTZXNzaW9uKHIuc2Vzc2lvbik7CiAgICBkb2N1bWVudC5vbmtleWRvd24gPSBu',
  'dWxsOwogICAgcmV0dXJuIGNhbGxBcGkoJ2F1dGgubWUnKS50aGVuKGVudGVyQXBwKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgIHZhciBtc2cgPSBTdHJpbmcoZS5tZXNzYWdlIHx8IGUpOwogICAgaWYgKGRvdHMpIHsgZG90cy5jbGFzc0xpc3QucmVtb3Zl',
  'KCdidXN5Jyk7IGRvdHMuY2xhc3NMaXN0LmFkZCgnc2hha2UnKTsgZG90cy5pbm5lckhUTUwgPSBwaW5Eb3RzSHRtbCgnJyk7IH0KICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgaWYgKGRvdHMpIGRvdHMuY2xhc3NMaXN0LnJlbW92ZSgnc2hha2UnKTsgfSwgNTAw',
  'KTsKICAgIGF1dGhFcnJvcihtc2cpOwogICAgLy8gUElOIOC4luC4ueC4geC4ouC4geC5gOC4peC4tOC4geC5hOC4m+C5geC4peC5ieC4pyAo4Lic4Li04LiU4LiE4Lij4Lia4LmC4LiE4Lin4LiV4LiyIC8g4Lir4Lih4LiU4Lit4Liy4Lii4Li4KSDigJQg4LiV4LmJ',
  '4Lit4LiH4LiB4Lil4Lix4Lia4LmE4Lib4LmD4LiK4LmJ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZCiAgICBpZiAoL+C4peC5h+C4reC4geC4reC4tOC4meC4lOC5ieC4p+C4ouC4o+C4q+C4seC4quC4nOC5iOC4suC4mS8udGVzdChtc2cpKSB7CiAgICAgIHNhdmVE',
  'ZXZpY2UoJycpOwogICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHNob3dMb2dpbihtc2cpOyB9LCAxNDAwKTsKICAgIH0KICB9KTsKfQoKZnVuY3Rpb24gZm9yZ2V0VGhpc0RldmljZSgpewogIHZhciB0b2tlbiA9IEFVVEguZGV2aWNlOwogIHNhdmVEZXZpY2Uo',
  'JycpOwogIGxzU2V0KCdtY29ybmVyLnBpbkFza2VkJywgJycpOwogIGRvY3VtZW50Lm9ua2V5ZG93biA9IG51bGw7CiAgaWYgKHRva2VuKSBjYWxsQXBpKCdhdXRoLmZvcmdldERldmljZScsIHsgZGV2aWNlOiB0b2tlbiB9KS5jYXRjaChmdW5jdGlvbigpeyAvKiDg',
  'uKvguKHguJTguK3guLLguKLguLjguYTguJvguYHguKXguYnguKfguIHguYfguIrguYjguLLguIfguKHguLHguJkgKi8gfSk7CiAgc2hvd0xvZ2luKCk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4LiV4Lix4LmJ4LiHIFBJTiAtLS0tLS0tLS0tLS0tLS0tICovCgov',
  'Kiog4LiK4Lin4LiZ4LiV4Lix4LmJ4LiHIFBJTiDguKvguKXguLHguIfguKXguYfguK3guIHguK3guLTguJnguITguKPguLHguYnguIfguYHguKPguIHguJrguJnguYDguITguKPguLfguYjguK3guIfguJnguLXguYkgKi8KZnVuY3Rpb24gb2ZmZXJQaW4oKXsKICBs',
  'c1NldCgnbWNvcm5lci5waW5Bc2tlZCcsICcxJyk7CiAgb3Blbk1vZGFsKCfguJXguLHguYnguIcgUElOIOC4quC4s+C4q+C4o+C4seC4muC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5iScsCiAgICAnPHA+4LiV4Lix4LmJ4LiH4Lij4Lir4Lix4LiqIDYg4Lir',
  '4Lil4Lix4LiB4LmE4Lin4LmJIOC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC4leC5ieC4reC4h+C4nuC4tOC4oeC4nuC5jOC4o+C4q+C4seC4quC4nOC5iOC4suC4meC4l+C4uOC4geC4hOC4o+C4seC5ieC4h+C4l+C4teC5iOC5gOC4m+C4tOC4lDwvcD4nICsKICAg',
  'ICc8cCBjbGFzcz0ibXV0ZWQgZnMxMyI+UElOIOC4nOC4ueC4geC4geC4seC4muC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5ieC5gOC4hOC4o+C4t+C5iOC4reC4h+C5gOC4lOC4teC4ouC4pyDguYDguITguKPguLfguYjguK3guIfguK3guLfguYjguJnguYPg',
  'uIrguYnguYTguKHguYjguYTguJTguYkgwrcg4Lii4LiB4LmA4Lil4Li04LiB4LmA4Lih4Li34LmI4Lit4LmE4Lir4Lij4LmI4LiB4LmH4LmE4LiU4LmJ4LmD4LiZ4Lir4LiZ4LmJ4Liy4LiV4Lix4LmJ4LiH4LiE4LmI4LiyPC9wPicsCiAgICAnPGJ1dHRvbiBjbGFz',
  'cz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC5hOC4p+C5ieC4geC5iOC4reC4mTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtmb3JtU2V0UGluKCkiPuC4leC4seC5ieC4hyBQSU4g4LmA',
  '4Lil4LiiPC9idXR0b24+Jyk7Cn0KCmZ1bmN0aW9uIGZvcm1TZXRQaW4oKXsKICBvcGVuTW9kYWwoJ+C4leC4seC5ieC4hyBQSU4gNiDguKvguKXguLHguIEnLAogICAgJzxkaXYgY2xhc3M9ImZncmlkIj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYgZnVsbCI+PGxh',
  'YmVsIGZvcj0icGluMSI+UElOIOC5g+C4q+C4oeC5iDwvbGFiZWw+JyArCiAgICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0icGluMSIgdHlwZT0icGFzc3dvcmQiIGlucHV0bW9kZT0ibnVtZXJpYyIgbWF4bGVuZ3RoPSI2IiAnICsKICAgICAgICAnYXV0b2Nv',
  'bXBsZXRlPSJuZXctcGFzc3dvcmQiIHBsYWNlaG9sZGVyPSLigKLigKLigKLigKLigKLigKIiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiBmdWxsIj48bGFiZWwgZm9yPSJwaW4yIj7guYPguKrguYggUElOIOC4reC4teC4geC4hOC4o+C4seC5ieC4hzwv',
  'bGFiZWw+JyArCiAgICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0icGluMiIgdHlwZT0icGFzc3dvcmQiIGlucHV0bW9kZT0ibnVtZXJpYyIgbWF4bGVuZ3RoPSI2IiAnICsKICAgICAgICAnYXV0b2NvbXBsZXRlPSJuZXctcGFzc3dvcmQiIHBsYWNlaG9sZGVy',
  'PSLigKLigKLigKLigKLigKLigKIiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiBmdWxsIj48bGFiZWwgZm9yPSJwaW5EZXYiPuC4iuC4t+C5iOC4reC5gOC4hOC4o+C4t+C5iOC4reC4hyAo4LmE4Lin4LmJ4LiU4Li54Lii4LmJ4Lit4LiZ4Lir4Lil4Lix',
  '4LiHKTwvbGFiZWw+JyArCiAgICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0icGluRGV2IiB2YWx1ZT0iJyArIGVzYyhndWVzc0RldmljZU5hbWUoKSkgKyAnIj48L2Rpdj4nICsKICAgICc8L2Rpdj4nICsKICAgICc8cCBjbGFzcz0ibXV0ZWQgZnMxMyBtdDgi',
  'PuC4q+C4peC4teC4geC5gOC4peC4teC5iOC4ouC4h+C5gOC4peC4guC4l+C4teC5iOC5gOC4lOC4suC4h+C5iOC4suC4oiDguYDguIrguYjguJkgMTExMTExIOC4q+C4o+C4t+C4rSAxMjM0NTY8L3A+JywKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9',
  'ImNsb3NlTW9kYWwoKSI+4Lii4LiB4LmA4Lil4Li04LiBPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgaWQ9InBpbkdvIj7guJrguLHguJnguJfguLbguIEgUElOPC9idXR0b24+Jyk7CgogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdw',
  'aW5HbycpLm9uY2xpY2sgPSBmdW5jdGlvbigpewogICAgdmFyIGEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGluMScpLnZhbHVlOwogICAgdmFyIGIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGluMicpLnZhbHVlOwogICAgaWYgKCEvXlxkezZ9JC8u',
  'dGVzdChhKSkgcmV0dXJuIHRvYXN0KCdQSU4g4LiV4LmJ4Lit4LiH4LmA4Lib4LmH4LiZ4LiV4Lix4Lin4LmA4Lil4LiCIDYg4Lir4Lil4Lix4LiBJywgJ2VycicpOwogICAgaWYgKGEgIT09IGIpIHJldHVybiB0b2FzdCgnUElOIOC4quC4reC4h+C4iuC5iOC4reC4',
  'h+C5hOC4oeC5iOC4leC4o+C4h+C4geC4seC4mScsICdlcnInKTsKICAgIHZhciBidG4gPSB0aGlzOwogICAgYnRuLmRpc2FibGVkID0gdHJ1ZTsKICAgIGJ0bi5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4Lia',
  '4Lix4LiZ4LiX4Li24LiB4oCmJzsKICAgIGNhbGxBcGkoJ2F1dGguc2V0UGluJywgeyBwaW46IGEsIGRldmljZTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpbkRldicpLnZhbHVlIH0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICAgIHNhdmVEZXZpY2Uoci5kZXZp',
  'Y2UpOwogICAgICBjbG9zZU1vZGFsKCk7CiAgICAgIHRvYXN0KCfguJXguLHguYnguIcgUElOIOC5gOC4o+C4teC4ouC4muC4o+C5ieC4reC4oiDigJQg4LiE4Lij4Lix4LmJ4LiH4Lir4LiZ4LmJ4Liy4LmD4Liq4LmI4LmB4LiE4LmIIDYg4Lir4Lil4Lix4LiBJywg',
  'J29rJyk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgYnRuLmRpc2FibGVkID0gZmFsc2U7CiAgICAgIGJ0bi50ZXh0Q29udGVudCA9ICfguJrguLHguJnguJfguLbguIEgUElOJzsKICAgICAgdG9hc3QoZS5tZXNzYWdlIHx8IGUsICdlcnInKTsKICAg',
  'IH0pOwogIH07Cn0KCmZ1bmN0aW9uIGd1ZXNzRGV2aWNlTmFtZSgpewogIHZhciB1YSA9IG5hdmlnYXRvci51c2VyQWdlbnQgfHwgJyc7CiAgaWYgKC9pUGhvbmUvLnRlc3QodWEpKSByZXR1cm4gJ2lQaG9uZSc7CiAgaWYgKC9pUGFkLy50ZXN0KHVhKSkgcmV0dXJu',
  'ICdpUGFkJzsKICBpZiAoL0FuZHJvaWQvLnRlc3QodWEpKSByZXR1cm4gJ0FuZHJvaWQnOwogIGlmICgvTWFjaW50b3NoLy50ZXN0KHVhKSkgcmV0dXJuICdNYWMnOwogIGlmICgvV2luZG93cy8udGVzdCh1YSkpIHJldHVybiAnV2luZG93cyc7CiAgcmV0dXJuICfg',
  'uK3guLjguJvguIHguKPguJPguYzguILguK3guIfguInguLHguJknOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC5gOC4m+C4peC4teC5iOC4ouC4meC4o+C4q+C4seC4quC4nOC5iOC4suC4mSAtLS0tLS0tLS0tLS0tLS0tICovCgovKiogQHBhcmFtIHtib29sZWFu',
  'fSBmb3JjZWQgdHJ1ZSA9IOC4o+C4sOC4muC4muC4muC4seC4h+C4hOC4seC4muC5gOC4m+C4peC4teC5iOC4ouC4meC4leC4reC4meC4peC5h+C4reC4geC4reC4tOC4meC4hOC4o+C4seC5ieC4h+C5geC4o+C4gSAqLwpmdW5jdGlvbiBzaG93Q2hhbmdlUGFzc3dv',
  'cmQoZm9yY2VkKXsKICBpZiAoIWZvcmNlZCkgcmV0dXJuIGZvcm1DaGFuZ2VQYXNzd29yZCgpOwogIEFVVEguc2NyZWVuID0gJ2NoYW5nZSc7CiAgc2hvd0F1dGgoCiAgICAnPGgyIGNsYXNzPSJhdXRoLWgiPuC4leC4seC5ieC4h+C4o+C4q+C4seC4quC4nOC5iOC4',
  'suC4meC4guC4reC4h+C4hOC4uOC4k+C5gOC4reC4hzwvaDI+JyArCiAgICAnPHAgY2xhc3M9ImF1dGgtc3ViIj7guKPguKvguLHguKrguJfguLXguYjguYTguJTguYnguKHguLLguYDguJvguYfguJnguKPguKvguLHguKrguIrguLHguYjguKfguITguKPguLLguKcg',
  '4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LiB4LmI4Lit4LiZ4LmD4LiK4LmJ4LiH4Liy4LiZ4Lir4LiZ4Li24LmI4LiH4LiE4Lij4Lix4LmJ4LiHPC9wPicgKwogICAgJzxkaXYgY2xhc3M9ImF1dGgtZXJyIiBpZD0iYXV0aEVyciIgaGlkZGVuPjwvZGl2PicgKwogICAg',
  'JzxkaXYgY2xhc3M9ImF1dGgtZiI+PGxhYmVsIGZvcj0iY3BPbGQiPuC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5gOC4lOC4tOC4oTwvbGFiZWw+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImNwT2xkIiB0eXBlPSJwYXNzd29yZCIgYXV0b2NvbXBs',
  'ZXRlPSJjdXJyZW50LXBhc3N3b3JkIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJhdXRoLWYiPjxsYWJlbCBmb3I9ImNwTmV3Ij7guKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYggKOC4reC4ouC5iOC4suC4h+C4meC5ieC4reC4oiA4IOC4leC4',
  'seC4pyk8L2xhYmVsPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJjcE5ldyIgdHlwZT0icGFzc3dvcmQiIGF1dG9jb21wbGV0ZT0ibmV3LXBhc3N3b3JkIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJhdXRoLWYiPjxsYWJlbCBmb3I9ImNwTmV3',
  'MiI+4LmD4Liq4LmI4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmI4Lit4Li14LiB4LiE4Lij4Lix4LmJ4LiHPC9sYWJlbD4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0iY3BOZXcyIiB0eXBlPSJwYXNzd29yZCIgYXV0b2NvbXBsZXRl',
  'PSJuZXctcGFzc3dvcmQiPjwvZGl2PicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgYXV0aC1nbyIgaWQ9ImNwR28iPuC4muC4seC4meC4l+C4tuC4geC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iDwvYnV0dG9uPicKICApOwoKICBkb2N1',
  'bWVudC5nZXRFbGVtZW50QnlJZCgnY3BHbycpLm9uY2xpY2sgPSBmdW5jdGlvbigpewogICAgdmFyIG8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3BPbGQnKS52YWx1ZTsKICAgIHZhciBuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NwTmV3JykudmFs',
  'dWU7CiAgICB2YXIgbjIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3BOZXcyJykudmFsdWU7CiAgICBpZiAobi5sZW5ndGggPCA4KSByZXR1cm4gYXV0aEVycm9yKCfguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYjguJXguYnguK3guIfguKLg',
  'uLLguKfguK3guKLguYjguLLguIfguJnguYnguK3guKIgOCDguJXguLHguKfguK3guLHguIHguKnguKMnKTsKICAgIGlmIChuICE9PSBuMikgcmV0dXJuIGF1dGhFcnJvcign4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmI4Liq4Lit4LiH4LiK4LmI',
  '4Lit4LiH4LmE4Lih4LmI4LiV4Lij4LiH4LiB4Lix4LiZJyk7CiAgICB2YXIgYnRuID0gdGhpczsKICAgIGJ0bi5kaXNhYmxlZCA9IHRydWU7CiAgICBidG4uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C4muC4',
  'seC4meC4l+C4tuC4geKApic7CiAgICBjYWxsQXBpKCdhdXRoLmNoYW5nZVBhc3N3b3JkJywgeyBvbGRQYXNzd29yZDogbywgbmV3UGFzc3dvcmQ6IG4sIF9kZXZpY2U6IEFVVEguZGV2aWNlIHx8ICcnIH0pLnRoZW4oZnVuY3Rpb24oKXsKICAgICAgcmV0dXJuIGNh',
  'bGxBcGkoJ2F1dGgubWUnKS50aGVuKGVudGVyQXBwKTsKICAgIH0pLnRoZW4oZnVuY3Rpb24oKXsKICAgICAgdG9hc3QoJ+C5gOC4m+C4peC4teC5iOC4ouC4meC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5gOC4o+C4teC4ouC4muC4o+C5ieC4reC4oicsICdvaycp',
  'OwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlOwogICAgICBidG4udGV4dENvbnRlbnQgPSAn4Lia4Lix4LiZ4LiX4Li24LiB4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmIJzsKICAgICAgYXV0aEVy',
  'cm9yKGUubWVzc2FnZSB8fCBlKTsKICAgIH0pOwogIH07CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NwT2xkJykuZm9jdXMoKTsKfQoKZnVuY3Rpb24gZm9ybUNoYW5nZVBhc3N3b3JkKCl7CiAgb3Blbk1vZGFsKCfguYDguJvguKXguLXguYjguKLguJnguKPg',
  'uKvguLHguKrguJzguYjguLLguJknLAogICAgJzxkaXYgY2xhc3M9ImZncmlkIj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYgZnVsbCI+PGxhYmVsIGZvcj0ibWNPbGQiPuC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5gOC4lOC4tOC4oTwvbGFiZWw+PGlucHV0IGNs',
  'YXNzPSJpbnAiIGlkPSJtY09sZCIgdHlwZT0icGFzc3dvcmQiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiBmdWxsIj48bGFiZWwgZm9yPSJtY05ldyI+4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmIICjguK3guKLguYjguLLguIfguJng',
  'uYnguK3guKIgOCDguJXguLHguKcpPC9sYWJlbD48aW5wdXQgY2xhc3M9ImlucCIgaWQ9Im1jTmV3IiB0eXBlPSJwYXNzd29yZCI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIGZ1bGwiPjxsYWJlbCBmb3I9Im1jTmV3MiI+4LmD4Liq4LmI4Lij4Lir4Lix',
  '4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmI4Lit4Li14LiB4LiE4Lij4Lix4LmJ4LiHPC9sYWJlbD48aW5wdXQgY2xhc3M9ImlucCIgaWQ9Im1jTmV3MiIgdHlwZT0icGFzc3dvcmQiPjwvZGl2PicgKwogICAgJzwvZGl2PicsCiAgICAnPGJ1dHRvbiBjbGFzcz0i',
  'YnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4gTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIGlkPSJtY0dvIj7guJrguLHguJnguJfguLbguIE8L2J1dHRvbj4nKTsKCiAgZG9jdW1lbnQuZ2V0RWxlbWVu',
  'dEJ5SWQoJ21jR28nKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsKICAgIHZhciBuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21jTmV3JykudmFsdWU7CiAgICBpZiAobi5sZW5ndGggPCA4KSByZXR1cm4gdG9hc3QoJ+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC5',
  'g+C4q+C4oeC5iOC4leC5ieC4reC4h+C4ouC4suC4p+C4reC4ouC5iOC4suC4h+C4meC5ieC4reC4oiA4IOC4leC4seC4p+C4reC4seC4geC4qeC4oycsICdlcnInKTsKICAgIGlmIChuICE9PSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWNOZXcyJykudmFsdWUp',
  'IHJldHVybiB0b2FzdCgn4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmI4Liq4Lit4LiH4LiK4LmI4Lit4LiH4LmE4Lih4LmI4LiV4Lij4LiH4LiB4Lix4LiZJywgJ2VycicpOwogICAgdmFyIGJ0biA9IHRoaXM7CiAgICBidG4uZGlzYWJsZWQgPSB0',
  'cnVlOwogICAgY2FsbEFwaSgnYXV0aC5jaGFuZ2VQYXNzd29yZCcsIHsKICAgICAgb2xkUGFzc3dvcmQ6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtY09sZCcpLnZhbHVlLCBuZXdQYXNzd29yZDogbiwgX2RldmljZTogQVVUSC5kZXZpY2UgfHwgJycKICAgIH0p',
  'LnRoZW4oZnVuY3Rpb24oKXsKICAgICAgY2xvc2VNb2RhbCgpOwogICAgICB0b2FzdCgn4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmA4Lij4Li14Lii4Lia4Lij4LmJ4Lit4LiiJywgJ29rJyk7CiAgICB9KS5jYXRjaChmdW5j',
  'dGlvbihlKXsKICAgICAgYnRuLmRpc2FibGVkID0gZmFsc2U7CiAgICAgIHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7CiAgICB9KTsKICB9Owp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4reC4reC4geC4iOC4suC4geC4o+C4sOC4muC4miAtLS0tLS0tLS0t',
  'LS0tLS0tICovCgpmdW5jdGlvbiBkb0xvZ291dChrZWVwUGluKXsKICB2YXIgcyA9IEFVVEguc2Vzc2lvbjsKICBzYXZlU2Vzc2lvbignJyk7CiAgaWYgKCFrZWVwUGluKSB7IHZhciBkID0gQVVUSC5kZXZpY2U7IHNhdmVEZXZpY2UoJycpOyBpZiAoZCkgY2FsbEFw',
  'aSgnYXV0aC5mb3JnZXREZXZpY2UnLCB7IGRldmljZTogZCB9KS5jYXRjaChmdW5jdGlvbigpe30pOyB9CiAgaWYgKHMpIGNhbGxBcGkoJ2F1dGgubG9nb3V0JywgeyBfc2Vzc2lvbjogcyB9KS5jYXRjaChmdW5jdGlvbigpeyAvKiDguKvguKHguJTguK3guLLguKLg',
  'uLjguYHguKXguYnguKfguIHguYfguJbguLfguK3guKfguYjguLLguK3guK3guIHguYHguKXguYnguKcgKi8gfSk7CiAgY2xvc2VNb2RhbCgpOwogIEFVVEgubWUgPSBudWxsOwogIGlmIChBVVRILmRldmljZSkgc2hvd1BpbigpOyBlbHNlIHNob3dMb2dpbigpOwp9',
  'CgpmdW5jdGlvbiBjb25maXJtTG9nb3V0KCl7CiAgb3Blbk1vZGFsKCfguK3guK3guIHguIjguLLguIHguKPguLDguJrguJonLAogICAgJzxwPuC4leC5ieC4reC4h+C4geC4suC4o+C4reC4reC4geC4iOC4suC4geC4o+C4sOC4muC4muC5g+C4iuC5iOC5hOC4q+C4',
  'oTwvcD4nICsKICAgIChBVVRILmRldmljZSA/ICc8cCBjbGFzcz0ibXV0ZWQgZnMxMyI+UElOIOC4muC4meC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5ieC4iOC4sOC4ouC4seC4h+C4reC4ouC4ueC5iCDguITguKPguLHguYnguIfguKvguJnguYnguLLguYDg',
  'uILguYnguLLguJTguYnguKfguKIgUElOIOC5hOC4lOC5ieC5gOC4peC4ojwvcD4nIDogJycpLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgIChBVVRILmRldmlj',
  'ZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4gZGdyIiBvbmNsaWNrPSJkb0xvZ291dChmYWxzZSkiPuC4reC4reC4geC5geC4peC4sOC4peC4miBQSU48L2J1dHRvbj4nIDogJycpICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJkb0xvZ291dCh0',
  'cnVlKSI+4Lit4Lit4LiB4LiI4Liy4LiB4Lij4Liw4Lia4LiaPC9idXR0b24+Jyk7Cn0KPC9zY3JpcHQ+CjxzY3JpcHQ+Ci8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBWaWV3cy5odG1sIOKAlCDg',
  'uJXguLHguKfguYLguKvguKXguJQgKyDguJXguLHguKfguKfguLLguJTguILguK3guIfguYHguJXguYjguKXguLDguKvguJnguYnguLIKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgp2YXIgUk9V',
  'VEVTID0ge307CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgMSkg4Lig4Liy4Lie4Lij4Lin4LihCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PSAqLwpST1VURVMuZGFzaGJvYXJkID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7IHJldHVybiBjYWxsQXBpKCdhcHAuZGFzaGJvYXJkJywgeyB5ZWFyOiBTLnllYXIgfSk7IH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciBiID0gZC5i',
  'dWlsZGluZzsKICAgIHZhciBrcGlzID0KICAgICAga3BpKCfguKLguK3guJTguKvguJnguLXguYnguITguIfguYDguKvguKXguLfguK3guJfguLHguYnguIfguKvguKHguJQnLCBiYWh0KGQuZGVidEFsbC5yZW1haW5pbmcpLAogICAgICAgICAgJ+C4iOC4suC4geC4',
  'ouC4reC4lOC4q+C4meC4teC5iSAnICsgYmFodChkLmRlYnRBbGwudG90YWxEZWJ0KSArICcgwrcg4LiK4Liz4Lij4Liw4LmB4Lil4LmJ4LinICcgKyBwY3QoZC5kZWJ0QWxsLnBlcmNlbnQpLCAnYWNjZW50JykgKwogICAgICBrcGkoJ+C4iuC4s+C4o+C4sOC5geC4',
  'peC5ieC4pyAo4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiBKScsIHBjdChkLmRlYnRNYWluLnBlcmNlbnQpLCBiYWh0KGQuZGVidE1haW4ucGFpZCkgKyAnIOC4iOC4suC4gSAnICsgYmFodChkLmRlYnRNYWluLnRvdGFsKSwgJ2dvb2QnKSArCiAgICAgIGtwaSgn4LiE',
  '4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Lib4Li1ICcgKyBkLnllYXIsIGJhaHQoZC5zcGVuZFRoaXNZZWFyKSwgJ+C4i+C4t+C5ieC4reC4guC4reC4hyArIOC4i+C5iOC4reC4oeC5geC4i+C4oSArIOC4peC5ieC4suC4h+C5geC4reC4o+C5jCcpICsKICAg',
  'ICAga3BpKCfguIfguLLguJnguIvguYjguK3guKHguITguYnguLLguIcnLCBkLnJlcGFpcnMub3BlbkpvYnMgKyAnIOC4h+C4suC4mScsIGQucmVwYWlycy5vdmVyZHVlICsgJyDguIfguLLguJnguYDguIHguLTguJnguIHguLPguKvguJnguJQnLCBkLnJlcGFpcnMu',
  'b3ZlcmR1ZSA/ICdiYWQnIDogJycpOwoKICAgIHZhciBhbGVydHMgPSBkLmFsZXJ0cy5sZW5ndGgKICAgICAgPyAnPGRpdiBjbGFzcz0iYWxpc3QiPicgKyBkLmFsZXJ0cy5zbGljZSgwLDEyKS5tYXAoZnVuY3Rpb24oYSl7CiAgICAgICAgICByZXR1cm4gJzxkaXYg',
  'Y2xhc3M9ImFsaSBsLScgKyBhLmxldmVsICsgJyIgb25jbGljaz0iZ28oXCcnICsganVtcFBhZ2UoYS5tb2R1bGUpICsgJ1wnKSI+JyArCiAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImljIj4nICsgYS5pY29uICsgJzwvZGl2PjxkaXY+PGRpdiBjbGFzcz0i',
  'dHQiPicgKyBlc2MoYS50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImRkIj4nICsgZXNjKGEuZGV0YWlsKSArICc8L2Rpdj48L2Rpdj48L2Rpdj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicKICAgICAgOiAn',
  'PGRpdiBjbGFzcz0iZW1wdHkiPjxkaXYgY2xhc3M9ImJpZyI+4pyFPC9kaXY+4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ4LiE4LmJ4Liy4LiHIOKAlCDguJfguLjguIHguK3guKLguYjguLLguIfguYDguKPguLXguKLguJrguKPguYnguK3guKI8L2Rpdj4nOwoKICAg',
  'IHJldHVybiAnJyArCiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKyBrcGlzICsgJzwvZGl2PicgKwoKICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzIgbWIxMiI+JyArCiAgICAgICAgY2FyZCgn8J+SsCDguKPguLLguKLguIHguLLguKPguKrguKPg',
  'uLjguJvguKPguKfguKEgKOC4q+C4meC4teC5ieC4q+C4peC4seC4gSknLAogICAgICAgICAgZGVidE1pbmkoZC5kZWJ0TWFpbiwgJ2RlYnRNYWluJyksCiAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJnbyhcJ2RlYnRNYWluXCcpIj7g',
  'uJTguLnguJfguLHguYnguIfguKvguKHguJQg4oaSPC9idXR0b24+JykgKwogICAgICAgIGNhcmQoJ/Cfp74g4Lir4LiZ4Li14LmJ4Liq4Li04LiZICjguKvguJnguLXguYnguKPguK3guIcpJywKICAgICAgICAgIGRlYnRNaW5pKGQuZGVidFN1YiwgJ2RlYnRTdWIn',
  'KSArCiAgICAgICAgICAoZC5kZWJ0U3ViLmludGVyZXN0VGhpc1llYXIgPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtdDgiPuC4lOC4reC4geC5gOC4muC4teC5ieC4ouC4l+C4teC5iOC4iuC4s+C4o+C4sOC4m+C4tSAnICsgZC55ZWFyICsgJzogPGI+JyArIGJh',
  'aHQoZC5kZWJ0U3ViLmludGVyZXN0VGhpc1llYXIpICsgJzwvYj48L2Rpdj4nIDogJycpLAogICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZ28oXCdkZWJ0U3ViXCcpIj7guJTguLnguJfguLHguYnguIfguKvguKHguJQg4oaSPC9idXR0',
  'b24+JykgKwogICAgICAnPC9kaXY+JyArCgogICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAgICBrcGkoJ+C4q+C5ieC4reC4h+C4l+C4seC5ieC4h+C4q+C4oeC4lCcsIGIudG90YWxSb29tcyArICcg4Lir4LmJ4Lit4LiHJywgJ+C4oeC4',
  'teC4nOC4ueC5ieC5gOC4iuC5iOC4siAnICsgYi5vY2N1cGllZCArICcgwrcg4Lin4LmI4Liy4LiHICcgKyBiLnZhY2FudCkgKwogICAgICAgIGtwaSgn4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4Lib4Li1ICcgKyBkLnllYXIsIGQuYWMucm9vbXNEb25lICsgJy8n',
  'ICsgYi50b3RhbFJvb21zICsgJyDguKvguYnguK3guIcnLCBkLmFjLmRvbmVJblllYXIgKyAnIOC4o+C4reC4miDCtyDguITguYnguLLguIcgJyArIGQuYWMucm9vbXNQZW5kaW5nICsgJyDguKvguYnguK3guIcnLCBkLmFjLnJvb21zUGVuZGluZyA/ICd3YXJuJyA6',
  'ICdnb29kJykgKwogICAgICAgIGtwaSgn4LiL4Li34LmJ4Lit4LiC4Lit4LiH4Lib4Li1ICcgKyBkLnllYXIsIGJhaHQoZC5wdXJjaGFzZXMueWVhclRvdGFsKSwgZC5wdXJjaGFzZXMueWVhckNvdW50ICsgJyDguKPguLLguKLguIHguLLguKMnKSArCiAgICAgICAg',
  'a3BpKCfguJvguKPguLDguIHguLHguJnguYPguIHguKXguYnguKvguKHguJQnLCBkLnB1cmNoYXNlcy53YXJyYW50eS5leHBpcmluZyArICcg4Lij4Liy4Lii4LiB4Liy4LijJywgJ+C4q+C4oeC4lOC4reC4suC4ouC4uOC5geC4peC5ieC4pyAnICsgZC5wdXJjaGFz',
  'ZXMud2FycmFudHkuZXhwaXJlZCwgZC5wdXJjaGFzZXMud2FycmFudHkuZXhwaXJpbmcgPyAnd2FybicgOiAnJykgKwogICAgICAnPC9kaXY+JyArCgogICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMiBtYjEyIj4nICsKICAgICAgICBjYXJkKCfwn5OSIOC4o+C4suC4',
  'ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKLguKvguK0g4Lib4Li1ICcgKyBkLnllYXIsCiAgICAgICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMyBtYjEyIj4nICsKICAgICAgICAgICAga3BpKCfguKPguLLguKLguKPguLHguJonLCBiYWh0KGQuZmluYW5j',
  'ZS5pbmNvbWUpLCAn4LmA4LiJ4Lil4Li14LmI4LiiICcgKyBiYWh0KGQuZmluYW5jZS5hdmdJbmNvbWUpICsgJy/guYDguJTguLfguK3guJknLCAnZ29vZCcpICsKICAgICAgICAgICAga3BpKCfguKPguLLguKLguIjguYjguLLguKInLCBiYWh0KGQuZmluYW5jZS5l',
  'eHBlbnNlKSwgJ+C5gOC4ieC4peC4teC5iOC4oiAnICsgYmFodChkLmZpbmFuY2UuYXZnRXhwZW5zZSkgKyAnL+C5gOC4lOC4t+C4reC4mScsICdiYWQnKSArCiAgICAgICAgICAgIGtwaSgn4LiE4LiH4LmA4Lir4Lil4Li34Lit4Liq4Li44LiX4LiY4Li0JywgYmFo',
  'dChkLmZpbmFuY2UubmV0KSwgJ+C4reC4seC4leC4o+C4suC4geC4s+C5hOC4oyAnICsgcGN0KGQuZmluYW5jZS5tYXJnaW4pKSArCiAgICAgICAgICAnPC9kaXY+JyArIG1pbmlNb250aENoYXJ0KGQuZmluYW5jZS5ieU1vbnRoKSwKICAgICAgICAgICc8YnV0dG9u',
  'IGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImdvKFwnZmluYW5jZVwnKSI+4LiU4Li54LiX4Lix4LmJ4LiH4Lir4Lih4LiUIOKGkjwvYnV0dG9uPicpICsKICAgICAgICBjYXJkKCfwn5eT77iPIOC4h+C4suC4meC4l+C4teC5iOC4geC4s+C4peC4seC4h+C4iOC4sOC4',
  'luC4tuC4hyAoJyArIGQudXBjb21pbmcubGVuZ3RoICsgJyknLAogICAgICAgICAgZC51cGNvbWluZy5sZW5ndGggPyAnPGRpdiBjbGFzcz0iYWxpc3QiPicgKyBkLnVwY29taW5nLnNsaWNlKDAsNykubWFwKGZ1bmN0aW9uKHUpewogICAgICAgICAgICB2YXIgbHZs',
  'ID0gdS5kYXlzTGVmdCA8IDAgPyAnZGFuZ2VyJyA6ICh1LmRheXNMZWZ0IDw9IDcgPyAnd2FybicgOiAnaW5mbycpOwogICAgICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImFsaSBsLScgKyBsdmwgKyAnIiBvbmNsaWNrPSJnbyhcJycgKyBqdW1wUGFnZSh1Lm1v',
  'ZHVsZSkgKyAnXCcpIj4nICsKICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0iaWMiPicgKyB1Lmljb24gKyAnPC9kaXY+PGRpdj48ZGl2IGNsYXNzPSJ0dCI+JyArIGVzYyh1LnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0iZGQi',
  'PicgKyB0aERhdGUodS5kYXRlKSArICcgwrcgJyArCiAgICAgICAgICAgICAgICAodS5kYXlzTGVmdCA8IDAgPyAn4LmA4Lil4Lii4LiB4Liz4Lir4LiZ4LiUICcgKyAoLXUuZGF5c0xlZnQpICsgJyDguKfguLHguJknIDogKHUuZGF5c0xlZnQgPT09IDAgPyAn4Lin',
  '4Lix4LiZ4LiZ4Li14LmJJyA6ICfguK3guLXguIEgJyArIHUuZGF5c0xlZnQgKyAnIOC4p+C4seC4mScpKSArCiAgICAgICAgICAgICAgJzwvZGl2PjwvZGl2PjwvZGl2Pic7CiAgICAgICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nIDogJzxkaXYgY2xhc3M9ImVt',
  'cHR5Ij48ZGl2IGNsYXNzPSJiaWciPvCfjKTvuI88L2Rpdj7guYTguKHguYjguKHguLXguIfguLLguJnguJnguLHguJTguKvguKHguLLguKLguYDguKPguYfguKcg4LmGIOC4meC4teC5iTwvZGl2PicsCiAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBv',
  'bmNsaWNrPSJnbyhcJ3JlcG9ydHNcJykiPuC4m+C4j+C4tOC4l+C4tOC4meC5gOC4leC5h+C4oSDihpI8L2J1dHRvbj4nLCB0cnVlKSArCiAgICAgICc8L2Rpdj4nICsKCiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGcyIj4nICsKICAgICAgICBjYXJkKCfwn5SUIOC4',
  'quC4tOC5iOC4h+C4l+C4teC5iOC4leC5ieC4reC4h+C4l+C4syAoJyArIGQuYWxlcnRzLmxlbmd0aCArICcpJywgYWxlcnRzLCAnJywgdHJ1ZSkgKwogICAgICAgIGNhcmQoJ/Cfj6Ig4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmC4LiU',
  '4Lii4Lij4Lin4LihJywKICAgICAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGcyIj4nICsKICAgICAgICAgICAga3BpKCfguIfguLLguJnguJvguLUgJyArIGQueWVhciwgZC5idWlsZGluZ1JlcGFpcnMueWVhckNvdW50ICsgJyDguIfguLLguJknLCAn4LiE4LmJ4Liy',
  '4LiHICcgKyBkLmJ1aWxkaW5nUmVwYWlycy5vcGVuQ291bnQpICsKICAgICAgICAgICAga3BpKCfguITguYjguLLguYPguIrguYnguIjguYjguLLguKInLCBiYWh0KGQuYnVpbGRpbmdSZXBhaXJzLnllYXJDb3N0KSwgJ+C4hOC4o+C4muC4geC4s+C4q+C4meC4lOC5',
  'gOC4o+C5h+C4pyDguYYg4LiZ4Li14LmJICcgKyBkLmJ1aWxkaW5nUmVwYWlycy51cGNvbWluZykgKwogICAgICAgICAgJzwvZGl2PicgKwogICAgICAgICAgKGQuZGVidE1haW4uZm9yZWNhc3QgJiYgZC5kZWJ0TWFpbi5mb3JlY2FzdC5tb250aHNMZWZ0CiAgICAg',
  'ICAgICAgID8gJzxkaXYgY2xhc3M9ImhyIj48L2Rpdj48ZGl2IGNsYXNzPSJmczEzIj48Yj7guJvguKPguLDguKHguLLguJPguIHguLLguKPguJvguLTguJTguKvguJnguLXguYnguKvguKXguLHguIE8L2I+PGRpdiBjbGFzcz0ibXV0ZWQgbXQ4Ij4nICsKICAgICAg',
  'ICAgICAgICAn4LiI4Liy4LiB4Lit4Lix4LiV4Lij4Liy4LiK4Liz4Lij4Liw4LmA4LiJ4Lil4Li14LmI4LiiICcgKyBiYWh0KGQuZGVidE1haW4uZm9yZWNhc3QuYXZnUGVyTW9udGgpICsgJy/guYDguJTguLfguK3guJkgKDEyIOC5gOC4lOC4t+C4reC4meC4peC5',
  'iOC4suC4quC4uOC4lCkgJyArCiAgICAgICAgICAgICAgJ+C4hOC4suC4lOC4p+C5iOC4suC4reC4teC4gSA8Yj4nICsgZC5kZWJ0TWFpbi5mb3JlY2FzdC5tb250aHNMZWZ0ICsgJyDguYDguJTguLfguK3guJk8L2I+ICcgKwogICAgICAgICAgICAgICco4Lij4Liy',
  '4LinICcgKyB0aERhdGUoZC5kZWJ0TWFpbi5mb3JlY2FzdC5wYXlvZmZEYXRlKSArICcpPC9kaXY+PC9kaXY+JwogICAgICAgICAgICA6ICcnKSwKICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImdvKFwnYnVpbGRpbmdcJykiPuC4lOC4',
  'ueC4l+C4seC5ieC4h+C4q+C4oeC4lCDihpI8L2J1dHRvbj4nKSArCiAgICAgICc8L2Rpdj4nOwogIH0sCiAgYWZ0ZXI6IGZ1bmN0aW9uKCl7CiAgICAvLyDguJXguLHguKfguYDguKXguILguJrguJnguYDguKHguJnguLnguK3guLHguJvguYDguJTguJXguIjguLLg',
  'uIHguKjguLnguJnguKLguYzguYHguIjguYnguIfguYDguJXguLfguK3guJkgKHJlZnJlc2hBbGVydHMpIOC4l+C4uOC4geC4q+C4meC5ieC4siDguYTguKHguYjguYPguIrguYjguYDguInguJ7guLLguLDguKvguJnguYnguLLguJnguLXguYkKICAgIHJlZnJlc2hB',
  'bGVydHMoKTsKICB9Cn07CgpmdW5jdGlvbiBtaW5pTW9udGhDaGFydChieU1vbnRoKXsKICB2YXIgbWF4ID0gTWF0aC5tYXguYXBwbHkobnVsbCwgYnlNb250aC5tYXAoZnVuY3Rpb24obSl7IHJldHVybiBNYXRoLm1heChtLmluY29tZSwgbS5leHBlbnNlKTsgfSkp',
  'IHx8IDE7CiAgcmV0dXJuICc8ZGl2IHN0eWxlPSJkaXNwbGF5OmZsZXg7Z2FwOjNweDthbGlnbi1pdGVtczpmbGV4LWVuZDtoZWlnaHQ6NzRweCI+JyArIGJ5TW9udGgubWFwKGZ1bmN0aW9uKG0pewogICAgdmFyIGhpID0gTWF0aC5yb3VuZChtLmluY29tZSAvIG1h',
  'eCAqIDY2KSwgaGUgPSBNYXRoLnJvdW5kKG0uZXhwZW5zZSAvIG1heCAqIDY2KTsKICAgIHJldHVybiAnPGRpdiBzdHlsZT0iZmxleDoxO3RleHQtYWxpZ246Y2VudGVyIiB0aXRsZT0iJyArIG0ubGFiZWwgKyAnIMK3IOC4o+C4seC4miAnICsgbW9uZXkobS5pbmNv',
  'bWUpICsgJyDCtyDguIjguYjguLLguKIgJyArIG1vbmV5KG0uZXhwZW5zZSkgKyAnIj4nICsKICAgICAgJzxkaXYgc3R5bGU9ImRpc3BsYXk6ZmxleDtnYXA6MXB4O2FsaWduLWl0ZW1zOmZsZXgtZW5kO2p1c3RpZnktY29udGVudDpjZW50ZXI7aGVpZ2h0OjY2cHgi',
  'PicgKwogICAgICAgICc8ZGl2IHN0eWxlPSJ3aWR0aDo2cHg7aGVpZ2h0OicgKyBoaSArICdweDtiYWNrZ3JvdW5kOnZhcigtLW9rKTtib3JkZXItcmFkaXVzOjJweCAycHggMCAwIj48L2Rpdj4nICsKICAgICAgICAnPGRpdiBzdHlsZT0id2lkdGg6NnB4O2hlaWdo',
  'dDonICsgaGUgKyAncHg7YmFja2dyb3VuZDp2YXIoLS1kYW5nZXIpO2JvcmRlci1yYWRpdXM6MnB4IDJweCAwIDAiPjwvZGl2PicgKwogICAgICAnPC9kaXY+PGRpdiBjbGFzcz0iZmFpbnQiIHN0eWxlPSJmb250LXNpemU6OS41cHgiPicgKyBtLmxhYmVsLnJlcGxh',
  'Y2UoJy4nLCcnKSArICc8L2Rpdj48L2Rpdj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2PicgKwogICc8ZGl2IGNsYXNzPSJyb3cgZnMxMiBtdXRlZCBtdDgiPjxzcGFuIGNsYXNzPSJiIG9rIj7guKPguLLguKLguKPguLHguJo8L3NwYW4+PHNwYW4gY2xhc3M9ImIg',
  'ZGdyIj7guKPguLLguKLguIjguYjguLLguKI8L3NwYW4+PC9kaXY+JzsKfQoKZnVuY3Rpb24gZGVidE1pbmkoeCwgcGFnZSl7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJwbWV0YSIgc3R5bGU9Im1hcmdpbjowIDAgNnB4Ij48c3Bhbj7guIrguLPguKPguLDguYHguKXg',
  'uYnguKcgPGI+JyArIGJhaHQoeC5wYWlkKSArICc8L2I+PC9zcGFuPicgKwogICAgICAgICAnPHNwYW4+PGI+JyArIHBjdCh4LnBlcmNlbnQpICsgJzwvYj48L3NwYW4+PC9kaXY+JyArCiAgICAgICAgIHByb2dyZXNzKHgucGVyY2VudCwgJ2xnJykgKwogICAgICAg',
  'ICAnPGRpdiBjbGFzcz0icG1ldGEiPjxzcGFuPuC4hOC4h+C5gOC4q+C4peC4t+C4rSA8Yj4nICsgYmFodCh4LnJlbWFpbmluZykgKyAnPC9iPjwvc3Bhbj4nICsKICAgICAgICAgJzxzcGFuPuC4ouC4reC4lOC4q+C4meC4teC5ieC4l+C4seC5ieC4h+C4q+C4oeC4',
  'lCA8Yj4nICsgYmFodCh4LnRvdGFsKSArICc8L2I+PC9zcGFuPjwvZGl2PicgKwogICAgICAgICAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtdDgiPuC4iuC4s+C4o+C4sOC5g+C4meC4m+C4teC4l+C4teC5iOC5gOC4peC4t+C4reC4gTogPGI+JyArIGJhaHQoeC50',
  'aGlzWWVhcikgKyAnPC9iPjwvZGl2Pic7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICAyKSDguKvguJnguLXguYnguKvguKXguLHguIEgLyDguKvguJnguLXguYnguKPguK3guIcgKOC5',
  'g+C4iuC5ieC4leC4seC4p+C4p+C4suC4lOC4o+C5iOC4p+C4oeC4geC4seC4mSkKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGRlYnRSb3V0ZShsZWRnZXIsIHRpdGxlKXsK',
  'ICByZXR1cm4gewogICAgbG9hZDogZnVuY3Rpb24oKXsKICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFsKICAgICAgICBjYWxsQXBpKCdkZWJ0LnN1bW1hcnknLCB7IGxlZGdlcjogbGVkZ2VyLCB5ZWFyOiBTLnllYXIgfSksCiAgICAgICAgY2FsbEFwaSgnZGVidC5w',
  'YXltZW50cycsIHsgbGVkZ2VyOiBsZWRnZXIsIHllYXI6IFMueWVhciB9KQogICAgICBdKS50aGVuKGZ1bmN0aW9uKHIpewogICAgICAgIHZhciBkID0gclswXTsgZC5wYXltZW50cyA9IHJbMV07IGQubGVkZ2VyID0gbGVkZ2VyOyBkLnBhZ2VUaXRsZSA9IHRpdGxl',
  'OwogICAgICAgIHJldHVybiBkOwogICAgICB9KTsKICAgIH0sCiAgICByZW5kZXI6IHJlbmRlckRlYnQsCiAgICBhZnRlcjogY2FjaGVBbGxEZWJ0cwogIH07Cn0KUk9VVEVTLmRlYnRNYWluID0gZGVidFJvdXRlKCfguKvguJnguLXguYnguKvguKXguLHguIEnLCAn',
  '4Lij4Liy4Lii4LiB4Liy4Lij4Liq4Lij4Li44Lib4Lij4Lin4LihIFRoZSBNIENvcm5lciBBUCcpOwpST1VURVMuZGVidFN1YiAgPSBkZWJ0Um91dGUoJ+C4q+C4meC4teC5ieC4o+C4reC4hycsICfguKvguJnguLXguYnguKrguLTguJknKTsKCi8qKiDguYDguIHg',
  'uYfguJrguKPguLLguKLguIrguLfguYjguK3guIHguYnguK3guJnguKvguJnguLXguYnguJfguLjguIHguJrguLHguI3guIrguLXguYTguKfguYnguYPguKvguYnguJ/guK3guKPguYzguKHguYDguKXguLfguK3guIEgIuC5gOC4m+C5h+C4meC4quC5iOC4p+C4meC4',
  'q+C4meC4tuC5iOC4h+C4guC4reC4hyIgKi8KZnVuY3Rpb24gY2FjaGVBbGxEZWJ0cygpewogIGNhbGxBcGkoJ2RlYnQubGlzdCcsIHt9KS50aGVuKGZ1bmN0aW9uKGxpc3QpewogICAgQUxMX0RFQlRTID0gbGlzdC5tYXAoZnVuY3Rpb24oZCl7CiAgICAgIHJldHVy',
  'biB7IGlkOiBkLmlkLCB0aXRsZTogZC50aXRsZSwgbGVkZ2VyOiBkLmxlZGdlciwgcGFyZW50SWQ6IGQucGFyZW50SWQgfHwgJycgfTsKICAgIH0pOwogIH0pLmNhdGNoKGZ1bmN0aW9uKCl7fSk7Cn0KCmZ1bmN0aW9uIHJlbmRlckRlYnQoZCl7CiAgdmFyIHllYXJM',
  'YWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKCiAgdmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iY2FyZCBtYjEyIj48ZGl2IGNsYXNzPSJjYXJkLWIiPicgKwogICAgJzxkaXYgY2xhc3M9InJvdyBt',
  'YjEyIj48aDMgc3R5bGU9Im1hcmdpbjowO2ZvbnQtc2l6ZToxNXB4Ij4nICsgZXNjKGQucGFnZVRpdGxlKSArICc8L2gzPicgKwogICAgJzxzcGFuIGNsYXNzPSJzcCI+PC9zcGFuPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgc20iIG9uY2xpY2s9ImZv',
  'cm1EZWJ0UGF5bWVudChudWxsLFwnJyArIGQubGVkZ2VyICsgJ1wnKSI+KyDguJrguLHguJnguJfguLbguIHguIHguLLguKPguIrguLPguKPguLA8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImZvcm1EZWJ0KG51bGwsXCcn',
  'ICsgZC5sZWRnZXIgKyAnXCcpIj4rIOC5gOC4nuC4tOC5iOC4oeC4geC5ieC4reC4meC4q+C4meC4teC5iTwvYnV0dG9uPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InBtZXRhIiBzdHlsZT0ibWFyZ2luOjAgMCA3cHgiPjxzcGFuPuC4hOC4p+C4suC4oeC4hOC4',
  't+C4muC4q+C4meC5ieC4suC4geC4suC4o+C4iuC4s+C4o+C4sDwvc3Bhbj48c3Bhbj48Yj4nICsgcGN0KGQucGVyY2VudCkgKyAnPC9iPjwvc3Bhbj48L2Rpdj4nICsKICAgIHByb2dyZXNzKGQucGVyY2VudCwgJ2xnICcgKyAoZC5wZXJjZW50ID49IDEwMCA/ICdv',
  'aycgOiAnJykpICsKICAgICc8ZGl2IGNsYXNzPSJncmlkIGc0IG10MTYiPicgKwogICAgICBrcGkoJ+C4ouC4reC4lOC4q+C4meC4teC5ieC4l+C4seC5ieC4h+C4q+C4oeC4lCcsIGJhaHQoZC50b3RhbERlYnQpLCBkLmRlYnRzLmxlbmd0aCArICcg4LiB4LmJ4Lit',
  '4LiZ4Lir4LiZ4Li14LmJJykgKwogICAgICBrcGkoJ+C4iuC4s+C4o+C4sOC5geC4peC5ieC4pycsIGJhaHQoZC5wYWlkKSwgZC5wYXltZW50Q291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4o+C5guC4reC4mScgKwogICAgICAgICAgKGQuYWRqdXN0bWVudENvdW50',
  'ID8gJyDCtyDguJvguKPguLHguJrguKLguK3guJQgJyArIGJhaHQoZC5hZGp1c3RlZCkgOiAnJyksICdnb29kJykgKwogICAgICBrcGkoJ+C4hOC4h+C5gOC4q+C4peC4t+C4rScsIGJhaHQoZC5yZW1haW5pbmcpLCAn4Lit4Li14LiBICcgKyBwY3QoMTAwIC0gZC5w',
  'ZXJjZW50KSArICcg4LiI4Liw4Lib4Li04LiU4Lir4LiZ4Li14LmJJywgJ2JhZCcpICsKICAgICAga3BpKCfguIrguLPguKPguLDguYPguJknICsgeWVhckxhYmVsLCBiYWh0KGQuc2VsZWN0ZWRZZWFyUGFpZCksIGQuc2VsZWN0ZWRZZWFyQ291bnQgKyAnIOC4o+C4',
  'suC4ouC4geC4suC4oycgKwogICAgICAgICAgKGQuc2VsZWN0ZWRZZWFySW50ZXJlc3QgPyAnIMK3IOC4lOC4reC4geC5gOC4muC4teC5ieC4oiAnICsgYmFodChkLnNlbGVjdGVkWWVhckludGVyZXN0KSA6ICcnKSkgKwogICAgJzwvZGl2PjwvZGl2PjwvZGl2Pic7',
  'CgogIHZhciBwZXJEZWJ0ID0gZC5kZWJ0cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0iZ3JpZCBnLWF1dG8gbWIxMiI+JyArIGQuZGVidHMubWFwKGZ1bmN0aW9uKHgpewogICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJjYXJkIj48ZGl2IGNsYXNzPSJjYXJkLWIiPicgKwog',
  'ICAgICAnPGRpdiBjbGFzcz0iY2xpcCIgc3R5bGU9ImZvbnQtd2VpZ2h0OjY1MDtmb250LXNpemU6MTMuNXB4O21pbi1oZWlnaHQ6MzhweCI+JyArIGVzYyh4LnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBmczEyIG11dGVkIG1iOCI+',
  'JyArICh4LnNldHRsZWQgPyAnPHNwYW4gY2xhc3M9ImIgb2siPuKckyDguIrguLPguKPguLDguITguKPguJrguYHguKXguYnguKc8L3NwYW4+JyA6IHN0YXR1c0JhZGdlKHguc3RhdHVzKSkgKwogICAgICAgICc8c3Bhbj4nICsgZXNjKHguY3JlZGl0b3IgfHwgJ+KA',
  'kycpICsgKHguc3RhcnREYXRlID8gJyDCtyAnICsgdGhEYXRlKHguc3RhcnREYXRlKSA6ICcnKSArICc8L3NwYW4+PC9kaXY+JyArCiAgICAgICh4LnNoYXJlZEZyb20KICAgICAgICA/ICc8ZGl2IGNsYXNzPSJiIG9rIHdyYXAgbWI4IiB0aXRsZT0i4LiB4LmJ4Lit',
  '4LiZ4LmA4LiU4Li14Lii4Lin4LiB4Lix4Lia4LmD4LiZ4Lit4Li14LiB4Lir4LiZ4LmJ4LiyIOC4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C4iuC4s+C4o+C4sOC4iOC4suC4geC4q+C4meC5ieC4suC5hOC4q+C4meC4geC5h+C5gOC4guC5ieC4suC4geC5ieC4',
  'reC4meC4meC4teC5iSI+8J+UlyDguIHguYnguK3guJnguYDguJTguLXguKLguKfguIHguLHguJrguYPguJnguKvguJnguYnguLInICsKICAgICAgICAgICh4LnNoYXJlZEZyb20gPT09ICfguKvguJnguLXguYnguKvguKXguLHguIEnID8gJ+C4o+C4suC4ouC4geC4',
  'suC4o+C4quC4o+C4uOC4m+C4o+C4p+C4oScgOiAn4Lir4LiZ4Li14LmJ4Liq4Li04LiZJykgKyAnPC9kaXY+JwogICAgICAgIDogeC5hbHNvSW4KICAgICAgICA/ICc8ZGl2IGNsYXNzPSJiIG9rIHdyYXAgbWI4IiB0aXRsZT0i4LiB4LmJ4Lit4LiZ4LiZ4Li14LmJ',
  '4LmB4Liq4LiU4LiH4LmD4LiZ4Lit4Li14LiB4Lir4LiZ4LmJ4Liy4LiU4LmJ4Lin4LiiIOC4leC4seC4p+C5gOC4peC4guC5gOC4iuC4t+C5iOC4reC4oeC4geC4seC4mSI+8J+UlyDguYHguKrguJTguIfguYPguJnguKvguJnguYnguLInICsKICAgICAgICAgICh4',
  'LmFsc29JbiA9PT0gJ+C4q+C4meC4teC5ieC4q+C4peC4seC4gScgPyAn4Lij4Liy4Lii4LiB4Liy4Lij4Liq4Lij4Li44Lib4Lij4Lin4LihJyA6ICfguKvguJnguLXguYnguKrguLTguJknKSArICfguJTguYnguKfguKI8L2Rpdj4nCiAgICAgICAgOiAnJykgKwog',
  'ICAgICAoeC5wYXJlbnRUaXRsZQogICAgICAgID8gJzxkaXYgY2xhc3M9ImIgaW5mbyB3cmFwIG1iOCIgdGl0bGU9IuC4ouC4reC4lOC4geC5ieC4reC4meC4meC4teC5ieC4reC4ouC4ueC5iOC5g+C4meC4geC5ieC4reC4meC5geC4oeC5iOC5geC4peC5ieC4pyDg',
  'uIjguYjguLLguKLguITguLfguJnguIHguYnguK3guJnguJnguLXguYnguIHguYnguK3guJnguYHguKHguYjguIjguLDguKXguJTguJXguLLguKEiPicgKwogICAgICAgICAgJ+KGsyDguYDguJvguYfguJnguKrguYjguKfguJnguKvguJnguLbguYjguIfguILguK3g',
  'uIcgJyArIGVzYyh4LnBhcmVudFRpdGxlKSArICc8L2Rpdj4nCiAgICAgICAgOiAnJykgKwogICAgICBwcm9ncmVzcyh4LnBlcmNlbnQpICsKICAgICAgJzxkaXYgY2xhc3M9InBtZXRhIj48c3Bhbj7guIrguLPguKPguLAgPGI+JyArIGJhaHQoeC5wYWlkKSArICc8',
  'L2I+PC9zcGFuPjxzcGFuPuC4hOC4h+C5gOC4q+C4peC4t+C4rSA8Yj4nICsgYmFodCh4LnJlbWFpbmluZykgKyAnPC9iPjwvc3Bhbj48L2Rpdj4nICsKICAgICAgKHguY2hpbGRyZW4gJiYgeC5jaGlsZHJlbi5sZW5ndGgKICAgICAgICA/ICc8ZGl2IGNsYXNzPSJo',
  'ciIgc3R5bGU9Im1hcmdpbjoxMnB4IDAgMTBweCI+PC9kaXY+JyArCiAgICAgICAgICAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtYjgiPuC5g+C4meC4ouC4reC4lOC4meC4teC5ieC4oeC4teC4geC5ieC4reC4meC4ouC5iOC4reC4ouC4reC4ouC4ueC5iCAnICsg',
  'eC5jaGlsZHJlbi5sZW5ndGggKyAnIOC4geC5ieC4reC4mTwvZGl2PicgKwogICAgICAgICAgeC5jaGlsZHJlbi5tYXAoZnVuY3Rpb24oYyl7CiAgICAgICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0ibWI4Ij4nICsKICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0i',
  'cm93IGZzMTIiPjxzcGFuPuKGsyAnICsgZXNjKGMudGl0bGUpICsgJzwvc3Bhbj4nICsKICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9InNwIG1vbm8iPicgKyBtb25leShjLnBhaWQpICsgJyAvICcgKyBtb25leShjLnByaW5jaXBhbCkgKyAnPC9zcGFuPjwvZGl2',
  'PicgKwogICAgICAgICAgICAgIHByb2dyZXNzKGMucGVyY2VudCwgJ29rJykgKyAnPC9kaXY+JzsKICAgICAgICAgIH0pLmpvaW4oJycpICsKICAgICAgICAgICh4LnBhaWRGcm9tQ2hpbGRyZW4gPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCI+4Lij4Lin4Lih4Lii',
  '4Lit4LiU4LiX4Li14LmI4Lih4Liy4LiI4Liy4LiB4LiB4LmJ4Lit4LiZ4Lii4LmI4Lit4LiiICcgKyBiYWh0KHgucGFpZEZyb21DaGlsZHJlbikgKyAnPC9kaXY+JyA6ICcnKQogICAgICAgIDogJycpICsKICAgICAgKHguaW50ZXJlc3RQZXJNb250aCA/ICc8ZGl2',
  'IGNsYXNzPSJmczEyIG11dGVkIG10OCI+4LiU4Lit4LiB4LmA4Lia4Li14LmJ4LiiICcgKyBiYWh0KHguaW50ZXJlc3RQZXJNb250aCkgKyAnL+C5gOC4lOC4t+C4reC4mTwvZGl2PicgOiAnJykgKwogICAgICAoeC5wbGFuUGVyTW9udGggPyAnPGRpdiBjbGFzcz0i',
  'ZnMxMiBtdXRlZCI+4LmB4Lic4LiZ4Lic4LmI4Lit4LiZICcgKyBiYWh0KHgucGxhblBlck1vbnRoKSArICcv4LmA4LiU4Li34Lit4LiZPC9kaXY+JyA6ICcnKSArCiAgICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQxMiI+PGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNs',
  'aWNrPVwnZm9ybURlYnQoJyArIGF0dHIoeCkgKyAnLCInICsgZC5sZWRnZXIgKyAnIilcJz7guYHguIHguYnguYTguII8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgdGl0bGU9IuC4ouC4reC4lOC5hOC4oeC5iOC4leC4o+C4h+C4geC4',
  'seC4muC4l+C4teC5iOC5gOC4iOC5ieC4suC4q+C4meC4teC5ieC5geC4iOC5ieC4hz8g4LiB4Lij4Lit4LiB4Lii4Lit4LiU4LiE4LiH4LmA4Lir4Lil4Li34Lit4LiI4Lij4Li04LiHIiBvbmNsaWNrPVwnZm9ybVJlY29uY2lsZURlYnQoJyArIGF0dHIoeCkgKyAn',
  'KVwnPuKalu+4jyDguJvguKPguLHguJrguKLguK3guJTguYPguKvguYnguJXguKPguIc8L2J1dHRvbj4nICsKICAgICAgLy8g4LiB4LmJ4Lit4LiZ4LiX4Li14LmI4Lii4Li34Lih4Lih4Liy4LmB4Liq4LiU4LiHIOC4peC4muC4iOC4suC4geC4q+C4meC5ieC4suC4',
  'meC4teC5ieC5hOC4oeC5iOC5hOC4lOC5iSAo4LiI4Liw4Lir4Liy4Lii4LiI4Liy4LiB4Lit4Li14LiB4Lir4LiZ4LmJ4Liy4LiU4LmJ4Lin4LiiKSDigJQg4LmE4Lib4Lil4Lia4LiX4Li14LmI4Lir4LiZ4LmJ4Liy4LmA4LiI4LmJ4Liy4LiC4Lit4LiHIOC4q+C4',
  'o+C4t+C4reC4m+C4tOC4lOC4geC4suC4o+C5geC4quC4lOC4h+C4o+C5iOC4p+C4oeC5g+C4meC4n+C4reC4o+C5jOC4oeC5geC4geC5ieC5hOC4ggogICAgICAoeC5zaGFyZWRGcm9tID8gJycgOiAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGRnciIgb25jbGljaz0i',
  'ZGVsRGVidCgnICsganNxKHguaWQpICsgJykiPuC4peC4mjwvYnV0dG9uPicpICsgJzwvZGl2PicgKwogICAgJzwvZGl2PjwvZGl2Pic7CiAgfSkuam9pbignJykgKyAnPC9kaXY+JyA6ICcnOwoKICB2YXIgYnlZZWFyID0gZC5ieVllYXIubGVuZ3RoID8gY2FyZCgn',
  '8J+ThSDguKLguK3guJTguIrguLPguKPguLDguYHguKLguIHguJXguLLguKHguJvguLUnLAogICAgJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAnPHRoPuC4m+C4tTwvdGg+PHRoIGNsYXNzPSJudW0iPuC5gOC4h+C4',
  'tOC4meC4leC5ieC4mTwvdGg+PHRoIGNsYXNzPSJudW0iPuC4lOC4reC4geC5gOC4muC4teC5ieC4ojwvdGg+PHRoIGNsYXNzPSJudW0iPuC4o+C4p+C4oeC4l+C4teC5iOC5guC4reC4mTwvdGg+JyArCiAgICAnPHRoIGNsYXNzPSJudW0iPuC4iOC4s+C4meC4p+C4',
  'meC4hOC4o+C4seC5ieC4hzwvdGg+PHRoIGNsYXNzPSJudW0iPuC5gOC4h+C4tOC4meC4leC5ieC4meC4quC4sOC4quC4oTwvdGg+PHRoIHN0eWxlPSJ3aWR0aDoyNiUiPuC4hOC4p+C4suC4oeC4hOC4t+C4muC4q+C4meC5ieC4suC4quC4sOC4quC4oTwvdGg+JyAr',
  'CiAgICAnPC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgIGQuYnlZZWFyLm1hcChmdW5jdGlvbih5KXsKICAgICAgdmFyIGN1bSA9IHkuY3VtdWxhdGl2ZSAhPSBudWxsID8geS5jdW11bGF0aXZlIDogMDsKICAgICAgdmFyIHAgPSBkLnRvdGFsRGVidCA/IChjdW0g',
  'LyBkLnRvdGFsRGVidCAqIDEwMCkgOiAwOwogICAgICByZXR1cm4gJzx0ciBvbmNsaWNrPSJzZXRZZWFyRnJvbVRhYmxlKCcgKyB5LnllYXIgKyAnKSIgc3R5bGU9ImN1cnNvcjpwb2ludGVyIj4nICsKICAgICAgICAnPHRkPjxiPicgKyBkaXNwbGF5WWVhcih5Lnll',
  'YXIpICsgJzwvYj4nICsKICAgICAgICAgICh1c2VCdWRkaGlzdFllYXIoKSA/ICcgPHNwYW4gY2xhc3M9ImZhaW50IGZzMTIiPi8gJyArIHkueWVhciArICc8L3NwYW4+JyA6ICcnKSArICc8L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIG1vbmV5',
  'KHkucHJpbmNpcGFsKSArICc8L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArICh5LmludGVyZXN0ID8gbW9uZXkoeS5pbnRlcmVzdCkgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxiPicgKyBtb25leSh5LnBy',
  'aW5jaXBhbCArIHkuaW50ZXJlc3QpICsgJzwvYj48L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIHkuY291bnQgKyAnPC90ZD4nICsKICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyBtb25leShjdW0pICsgJzwvdGQ+JyArCiAgICAgICAgJzx0',
  'ZD4nICsgcHJvZ3Jlc3MocCkgKyAnPC90ZD48L3RyPic7CiAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JywgJycsIHRydWUpIDogJyc7CgogIHZhciByb3dzID0gZC5wYXltZW50czsKICB2YXIgbGlzdCA9IGNhcmQoJ/Cfp74g4Lij4Liy',
  '4Lii4LiB4Liy4Lij4LmC4Lit4LiZ4LmD4LiK4LmJ4Lir4LiZ4Li14LmJIMK3ICcgKyB5ZWFyTGFiZWwgKyAnICgnICsgcm93cy5sZW5ndGggKyAnKScsCiAgICByb3dzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0Ij48dGhlYWQ+PHRy',
  'PicgKwogICAgICAnPHRoPuC4p+C4seC4meC4l+C4teC5iDwvdGg+PHRoPuC4h+C4p+C4lDwvdGg+PHRoIGNsYXNzPSJudW0iPuC5gOC4h+C4tOC4meC4leC5ieC4mTwvdGg+PHRoIGNsYXNzPSJudW0iPuC4lOC4reC4geC5gOC4muC4teC5ieC4ojwvdGg+JyArCiAg',
  'ICAgICc8dGggY2xhc3M9Im51bSI+4Lij4Lin4Lih4LiX4Li14LmI4LmC4Lit4LiZPC90aD48dGg+4LiK4LmI4Lit4LiH4LiX4Liy4LiHPC90aD4nICsKICAgICAgJzx0aD7guKrguKXguLTguJs8L3RoPjx0aD7guKvguKHguLLguKLguYDguKvguJXguLg8L3RoPjx0',
  'aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgIHJvd3MubWFwKGZ1bmN0aW9uKHApewogICAgICAgIHZhciBhZGogPSBwLmNoYW5uZWwgPT09ICfguJvguKPguLHguJrguKLguK3guJQnOwogICAgICAgIHJldHVybiAnPHRyJyArIChhZGogPyAnIGNs',
  'YXNzPSJhZGoiIHRpdGxlPSLguKPguLLguKLguIHguLLguKPguJvguKPguLHguJrguKLguK3guJTguYPguKvguYnguJXguKPguIfguKLguK3guJTguIjguKPguLTguIcg4LmE4Lih4LmI4LmD4LiK4LmI4LmA4LiH4Li04LiZ4LiX4Li14LmI4LmC4Lit4LiZIicgOiAn',
  'JykgKyAnPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIj4nICsgdGhEYXRlKHAucGF5RGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCI+JyArIGVzYyhwLmluc3RhbGxtZW50IHx8ICfigJMnKSArICc8L3RkPicgKwog',
  'ICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHAucHJpbmNpcGFsID8gJzxiIHN0eWxlPSJjb2xvcjp2YXIoLS1vaykiPicgKyBtb25leShwLnByaW5jaXBhbCkgKyAnPC9iPicgOiAnPHNwYW4gY2xhc3M9ImZhaW50Ij7igJM8L3NwYW4+JykgKyAnPC90ZD4n',
  'ICsKICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChwLmludGVyZXN0ID8gJzxiIHN0eWxlPSJjb2xvcjp2YXIoLS13YXJuKSI+JyArIG1vbmV5KHAuaW50ZXJlc3QpICsgJzwvYj4nIDogJzxzcGFuIGNsYXNzPSJmYWludCI+4oCTPC9zcGFuPicpICsgJzwv',
  'dGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxiPicgKyBtb25leShwLmFtb3VudCkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgKGFkaiA/ICc8c3BhbiBjbGFzcz0iYiBpbmZvIj7impbvuI8g4Lib4Lij4Lix',
  '4Lia4Lii4Lit4LiUPC9zcGFuPicgOiBlc2MocC5jaGFubmVsIHx8ICfigJMnKSkgKwogICAgICAgICAgICAocC5zaGFyZWRGcm9tID8gJzxkaXYgY2xhc3M9Im10OCI+PHNwYW4gY2xhc3M9ImIgb2siIHRpdGxlPSLguKPguLLguKLguIHguLLguKPguYDguJTguLXg',
  'uKLguKfguIHguLHguJrguYPguJnguK3guLXguIHguKvguJnguYnguLIiPvCflJcgJyArCiAgICAgICAgICAgICAgKHAuc2hhcmVkRnJvbSA9PT0gJ+C4q+C4meC4teC5ieC4q+C4peC4seC4gScgPyAn4Lij4Liy4Lii4LiB4Liy4Lij4Liq4Lij4Li44Lib4Lij4Lin',
  '4LihJyA6ICfguKvguJnguLXguYnguKrguLTguJknKSArICc8L3NwYW4+PC9kaXY+JyA6ICcnKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbChwLnNsaXBSZWZzKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiBt',
  'dXRlZCBjbGlwIj4nICsgZXNjKHAubm90ZSB8fCAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsKICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIiBvbmNsaWNrPVwnZm9ybURlYnRQYXlt',
  'ZW50KCcgKyBhdHRyKHApICsgJywiJyArIGQubGVkZ2VyICsgJyIpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiBkZ3IiIG9uY2xpY2s9ImRlbERlYnRQYXltZW50KCcgKyBqc3EocC5pZCkgKyAnKSI+',
  '8J+XkTwvYnV0dG9uPicgKwogICAgICAgICAgJzwvZGl2PjwvdGQ+PC90cj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgOiBlbXB0eUJveCgn4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4Lij',
  '4LiK4Liz4Lij4Liw4LmD4LiZJyArIHllYXJMYWJlbCwKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZm9ybURlYnRQYXltZW50KG51bGwsXCcnICsgZC5sZWRnZXIgKyAnXCcpIj4rIOC4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C4',
  'iuC4s+C4o+C4sDwvYnV0dG9uPicpLAogICAgJycsIHRydWUpOwoKICByZXR1cm4gaGVhZCArIHBlckRlYnQgKyBieVllYXIgKyAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIGxpc3QgKyAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gc2V0WWVhckZyb21UYWJsZSh5KXsKICBT',
  'LnllYXIgPSBTdHJpbmcoeSk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3llYXJTZWwnKS52YWx1ZSA9IFMueWVhcjsKICBsb2FkKCk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQog',
  'ICAzKSDguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5wdXJjaGFzZXMgPSB7CiAgbG9hZDogZnVuY3Rpb24o',
  'KXsKICAgIHJldHVybiBQcm9taXNlLmFsbChbCiAgICAgIGNhbGxBcGkoJ3B1cmNoYXNlLnN1bW1hcnknLCB7IHllYXI6IFMueWVhciB9KSwKICAgICAgY2FsbEFwaSgncHVyY2hhc2UubGlzdCcsIHsgeWVhcjogUy55ZWFyLCBjYXRlZ29yeTogUy5wYXJhbXMuY2F0',
  'ZWdvcnkgfHwgJycsIHE6IFMucGFyYW1zLnEgfHwgJycgfSkKICAgIF0pLnRoZW4oZnVuY3Rpb24ocil7IHZhciBkID0gclswXTsgZC5pdGVtcyA9IHJbMV07IHJldHVybiBkOyB9KTsKICB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgeWVhckxhYmVs',
  'ID0gUy55ZWFyID09PSAnYWxsJyA/ICfguJfguLjguIHguJvguLUnIDogJ+C4m+C4tSAnICsgUy55ZWFyOwogICAgdmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAga3BpKCfguKLguK3guJTguIvguLfguYnguK0gJyArIHllYXJM',
  'YWJlbCwgYmFodChkLnllYXJUb3RhbCksIGQueWVhckNvdW50ICsgJyDguKPguLLguKLguIHguLLguKMnLCAnYWNjZW50JykgKwogICAgICBrcGkoJ+C4ouC4reC4lOC4quC4sOC4quC4oeC4l+C4seC5ieC4h+C4q+C4oeC4lCcsIGJhaHQoZC5ncmFuZFRvdGFsKSwg',
  'ZC5ncmFuZENvdW50ICsgJyDguKPguLLguKLguIHguLLguKMnKSArCiAgICAgIGtwaSgn4Lit4Lii4Li54LmI4LmD4LiZ4Lib4Lij4Liw4LiB4Lix4LiZJywgZC53YXJyYW50eS5hY3RpdmUgKyAnIOC4o+C4suC4ouC4geC4suC4oycsICfguYPguIHguKXguYnguKvg',
  'uKHguJQgJyArIGQud2FycmFudHkuZXhwaXJpbmcsIGQud2FycmFudHkuZXhwaXJpbmcgPyAnd2FybicgOiAnZ29vZCcpICsKICAgICAga3BpKCfguKvguKHguKfguJTguJfguLXguYjguYPguIrguYnguIjguYjguLLguKLguKrguLnguIfguKrguLjguJQnLCBkLmJ5',
  'Q2F0ZWdvcnlbMF0gPyBkLmJ5Q2F0ZWdvcnlbMF0uY2F0ZWdvcnkgOiAn4oCTJywKICAgICAgICAgIGQuYnlDYXRlZ29yeVswXSA/IGJhaHQoZC5ieUNhdGVnb3J5WzBdLnRvdGFsKSA6ICcnKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgY2hhcnRzID0gJzxkaXYg',
  'Y2xhc3M9ImdyaWQgZzIgbWIxMiI+JyArCiAgICAgIGNhcmQoJ/Cfk4og4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4LmB4Lii4LiB4LiV4Liy4Lih4Lir4Lih4Lin4LiU4Lir4Lih4Li54LmIIMK3ICcgKyB5ZWFyTGFiZWwsCiAgICAgICAgYmFyQ2hhcnQo',
  'ZC5ieUNhdGVnb3J5LCAnY2F0ZWdvcnknLCAndG90YWwnLCBmdW5jdGlvbihpKXsgcmV0dXJuIG1vbmV5KGkudG90YWwpICsgJyDguL8nOyB9KSkgKwogICAgICBjYXJkKCfwn5OFIOC4ouC4reC4lOC4i+C4t+C5ieC4reC5geC4ouC4geC4leC4suC4oeC4m+C4tScs',
  'CiAgICAgICAgYmFyQ2hhcnQoZC5ieVllYXIubWFwKGZ1bmN0aW9uKHkpeyByZXR1cm4geyBsYWJlbDogJ+C4m+C4tSAnICsgeS55ZWFyICsgJyAoJyArIHkuY291bnQgKyAnKScsIHRvdGFsOiB5LnRvdGFsLCB5ZWFyOiB5LnllYXIgfTsgfSksCiAgICAgICAgICAg',
  'ICAgICAgJ2xhYmVsJywgJ3RvdGFsJywgZnVuY3Rpb24oaSl7IHJldHVybiBtb25leShpLnRvdGFsKSArICcg4Li/JzsgfSkpICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciBjYXRzID0gJzxkaXYgY2xhc3M9ImNoaXBzIG1iMTIiPicgKwogICAgICAnPGJ1dHRvbiBj',
  'bGFzcz0iY2hpcCAnICsgKCFTLnBhcmFtcy5jYXRlZ29yeT8nb24nOicnKSArICciIG9uY2xpY2s9InNldFBhcmFtKFwnY2F0ZWdvcnlcJyxcJ1wnKSI+4LiX4Li44LiB4Lir4Lih4Lin4LiUPC9idXR0b24+JyArCiAgICAgIGQuYnlDYXRlZ29yeS5tYXAoZnVuY3Rp',
  'b24oYyl7CiAgICAgICAgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJjaGlwICcgKyAoUy5wYXJhbXMuY2F0ZWdvcnk9PT1jLmNhdGVnb3J5Pydvbic6JycpICsgJyIgJyArCiAgICAgICAgICAgICAgICdvbmNsaWNrPSJzZXRQYXJhbShcJ2NhdGVnb3J5XCcsJyArIGpz',
  'cShjLmNhdGVnb3J5KSArICcpIj4nICsgZXNjKGMuY2F0ZWdvcnkpICsgJyAoJyArIGMuY291bnQgKyAnKTwvYnV0dG9uPic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7CgogICAgdmFyIHJvd3MgPSBkLml0ZW1zOwogICAgdmFyIHRhYmxlID0gY2FyZCgn',
  '8J+bkiDguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcgwrcgJyArIHllYXJMYWJlbCArICcgKCcgKyByb3dzLmxlbmd0aCArICcpJywKICAgICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9',
  'Im1pbi13aWR0aDo5ODBweCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoIHN0eWxlPSJ3aWR0aDo5NnB4Ij7guKfguLHguJnguJfguLXguYjguIvguLfguYnguK08L3RoPjx0aD7guKPguLLguKLguIHguLLguKPguKrguLTguJnguITguYnguLI8L3RoPjx0aCBj',
  'bGFzcz0ibnVtIj7guIjguLPguJnguKfguJk8L3RoPicgKwogICAgICAgICc8dGggY2xhc3M9Im51bSI+4Lij4Liy4LiE4LiyPC90aD48dGg+4LmB4Lir4Lil4LmI4LiH4LiX4Li14LmI4LiL4Li34LmJ4LitPC90aD48dGg+4Lib4Lij4Liw4LiB4Lix4LiZPC90aD48',
  'dGg+4Lig4Liy4LiePC90aD48dGg+4Liq4Lil4Li04LibPC90aD48dGg+PC90aD4nICsKICAgICAgICAnPC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICByb3dzLm1hcChmdW5jdGlvbihwKXsKICAgICAgICAgIHZhciB3ID0gcC53YXJyYW50eSB8fCB7fTsK',
  'ICAgICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZShwLmJ1eURhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0iY2xpcCIgdGl0bGU9IicgKyBlc2MocC5p',
  'dGVtKSArICciPjxiPicgKyBlc2MocC5pdGVtKSArICc8L2I+PC9kaXY+JyArCiAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImZzMTIgZmFpbnQiPicgKyBlc2MocC5jYXRlZ29yeSB8fCAnJykgKyAocC5yb29tID8gJyDCtyDguKvguYnguK3guIcgJyArIGVzYyhw',
  'LnJvb20pIDogJycpICsKICAgICAgICAgICAgICAgIChwLm9yZGVyTm8gPyAnIMK3IOC4reC4reC4o+C5jOC5gOC4lOC4reC4o+C5jCAnICsgZXNjKHAub3JkZXJObykgOiAnJykgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICAgYmlsbEh0bWwocCkgKyAnPC90ZD4n',
  'ICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbnVtKHAucXR5KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxiPicgKyBtb25leShwLnByaWNlKSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0i',
  'ZnMxMiI+JyArIGVzYyhwLnZlbmRvciB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArICh3LmhhcwogICAgICAgICAgICAgICAgPyBzdGF0dXNCYWRnZSh3LnN0YXRlKSArICc8ZGl2IGNsYXNzPSJmYWludCIgc3R5',
  'bGU9ImZvbnQtc2l6ZToxMXB4Ij4nICsgdGhEYXRlU2hvcnQody5lbmQpICsgJzwvZGl2PicKICAgICAgICAgICAgICAgIDogJzxzcGFuIGNsYXNzPSJmYWludCI+4oCTPC9zcGFuPicpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwo',
  'cC5waG90b1JlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwocC5zbGlwUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48ZGl2IGNsYXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNs',
  'YXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1QdXJjaGFzZSgnICsgYXR0cihwKSArICcpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIGRnciIgb25jbGljaz0iZGVsUHVyY2hhc2UoJyAr',
  'IGpzcShwLmlkKSArICcpIj7wn5eRPC9idXR0b24+JyArCiAgICAgICAgICAgICc8L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6IGVtcHR5Qm94KCfguKLguLHguIfguYTguKHguYjg',
  'uKHguLXguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guYPguJknICsgeWVhckxhYmVsLCAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZm9ybVB1cmNoYXNlKG51bGwpIj4rIOC5gOC4nuC4tOC5iOC4oeC4o+C4suC4ouC4geC4suC4o+C4i+C4',
  't+C5ieC4rTwvYnV0dG9uPicpLAogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSBzbSIgb25jbGljaz0iZm9ybVB1cmNoYXNlKG51bGwpIj4rIOC5gOC4nuC4tOC5iOC4oeC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4rTwvYnV0dG9uPicsIHRydWUpOwoK',
  'ICAgIHJldHVybiBoZWFkICsgY2hhcnRzICsgY2F0cyArIHRhYmxlOwogIH0KfTsKCi8qKgogKiDguJrguLTguKXguJfguLXguYjguKHguLXguILguK3guIfguKvguKXguLLguKLguK3guKLguYjguLLguIcg4oCUIOC5geC4quC4lOC4h+C5gOC4m+C5h+C4meC4m+C4',
  'uOC5iOC4oeC4geC4suC4h+C4lOC4uSDguYTguKHguYjguYPguKvguYnguJXguLLguKPguLLguIfguKLguLLguKfguYDguIHguLTguJnguYTguJsKICog4Lia4Li04Lil4LiX4Li14LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4Lij4LmA4LiU4Li14Lii4Lin4Lir4Lij',
  '4Li34Lit4LmE4Lih4LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4Lii4LmA4Lil4LiiIOC5hOC4oeC5iOC4leC5ieC4reC4h+C5geC4quC4lOC4h+C4reC4sOC5hOC4o+C5gOC4nuC4tOC5iOC4oQogKi8KZnVuY3Rpb24gYmlsbEh0bWwocCl7CiAg',
  'dmFyIGIgPSBwLmJpbGw7CiAgaWYgKCFiIHx8IGIuY291bnQgPCAyKSByZXR1cm4gJyc7CiAgdmFyIGlkID0gJ2JpbGxfJyArIHAuaWQ7CiAgcmV0dXJuICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJpbGwtdG9nZ2xlIiBvbmNsaWNrPSJ0b2dnbGVCaWxs',
  'KFwnJyArIGlkICsgJ1wnKSI+JyArCiAgICAgICfwn6e+ICcgKyBiLmNvdW50ICsgJyDguKPguLLguKLguIHguLLguKPguYPguJnguJrguLTguKUg4pa+PC9idXR0b24+JyArCiAgICAnPGRpdiBjbGFzcz0iYmlsbC1saW5lcyIgaWQ9IicgKyBpZCArICciIGhpZGRl',
  'bj4nICsKICAgICAgYi5saW5lcy5tYXAoZnVuY3Rpb24obCl7CiAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJiaWxsLWxpbmUiPicgKwogICAgICAgICAgJzxzcGFuIGNsYXNzPSJubSIgdGl0bGU9IicgKyBlc2MobC5uYW1lKSArICciPicgKyBlc2MobC5uYW1l',
  'KSArICc8L3NwYW4+JyArCiAgICAgICAgICAnPHNwYW4gY2xhc3M9InF0Ij4nICsgbnVtKGwucXR5KSArIChsLnVuaXQgPyAnICcgKyBlc2MobC51bml0KSA6ICcnKSArICcgw5cgJyArIG1vbmV5KGwudW5pdFByaWNlLCAyKSArICc8L3NwYW4+JyArCiAgICAgICAg',
  'ICAnPHNwYW4gY2xhc3M9InR0Ij4nICsgbW9uZXkobC50b3RhbCwgMikgKyAnPC9zcGFuPjwvZGl2Pic7CiAgICAgIH0pLmpvaW4oJycpICsKICAgICAgKChiLnNoaXBwaW5nIHx8IGIuZGlzY291bnQpCiAgICAgICAgPyAnPGRpdiBjbGFzcz0iYmlsbC1leHRyYSI+',
  'JyArCiAgICAgICAgICAgIChiLnNoaXBwaW5nID8gJ+C4hOC5iOC4suC4quC5iOC4hyAnICsgbW9uZXkoYi5zaGlwcGluZywgMikgOiAnJykgKwogICAgICAgICAgICAoYi5zaGlwcGluZyAmJiBiLmRpc2NvdW50ID8gJyDCtyAnIDogJycpICsKICAgICAgICAgICAg',
  'KGIuZGlzY291bnQgPyAn4Liq4LmI4Lin4LiZ4Lil4LiUIOKIkicgKyBtb25leShiLmRpc2NvdW50LCAyKSA6ICcnKSArICc8L2Rpdj4nCiAgICAgICAgOiAnJykgKwogICAgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIHRvZ2dsZUJpbGwoaWQpewogIHZhciBlbCA9IGRv',
  'Y3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTsKICBpZiAoIWVsKSByZXR1cm47CiAgZWwuaGlkZGVuID0gIWVsLmhpZGRlbjsKICB2YXIgYnRuID0gZWwucHJldmlvdXNFbGVtZW50U2libGluZzsKICBpZiAoYnRuKSBidG4udGV4dENvbnRlbnQgPSBidG4udGV4dENv',
  'bnRlbnQucmVwbGFjZShlbC5oaWRkZW4gPyAn4pa0JyA6ICfilr4nLCBlbC5oaWRkZW4gPyAn4pa+JyA6ICfilrQnKTsKfQoKZnVuY3Rpb24gc2V0UGFyYW0oa2V5LCB2YWwpewogIFMucGFyYW1zW2tleV0gPSB2YWw7CiAgbG9hZCgpOwp9CgovKiA9PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgNCkg4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpS',
  'T1VURVMuYWMgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsgcmV0dXJuIGNhbGxBcGkoJ2FjLm1hdHJpeCcsIHsgeWVhcjogUy55ZWFyIH0pOyB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgeWVhckxhYmVsID0gUy55ZWFyID09PSAnYWxsJyA/ICfguJfg',
  'uLjguIHguJvguLUnIDogJ+C4m+C4tSAnICsgUy55ZWFyOwogICAgdmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAga3BpKCfguKXguYnguLLguIfguYHguKXguYnguKcgJyArIHllYXJMYWJlbCwgZC5yb29tc0RvbmVJblllYXIg',
  'KyAnLycgKyBkLnJvb21zLmxlbmd0aCArICcg4Lir4LmJ4Lit4LiHJywgZC5kb25lSW5ZZWFyICsgJyDguKPguK3guJrguJfguLHguYnguIfguKvguKHguJQnLCAnYWNjZW50JykgKwogICAgICBrcGkoJ+C4ouC4seC4h+C5hOC4oeC5iOC5hOC4lOC5ieC4peC5ieC4',
  'suC4hycsIGQucm9vbXNQZW5kaW5nLmxlbmd0aCArICcg4Lir4LmJ4Lit4LiHJywgZC5yb29tc1BlbmRpbmcuc2xpY2UoMCw4KS5qb2luKCcsICcpICsgKGQucm9vbXNQZW5kaW5nLmxlbmd0aD44PyfigKYnOicnKSwgZC5yb29tc1BlbmRpbmcubGVuZ3RoID8gJ3dh',
  'cm4nOidnb29kJykgKwogICAgICBrcGkoJ+C4luC4tuC4h+C4geC4s+C4q+C4meC4lOC4peC5ieC4suC4hycsIGQub3ZlcmR1ZS5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsICfguKPguK3guJrguKXguYnguLLguIfguJfguLjguIEgJyArIGQuY3ljbGVNb250aHMg',
  'KyAnIOC5gOC4lOC4t+C4reC4mScsIGQub3ZlcmR1ZS5sZW5ndGggPyAnYmFkJzonZ29vZCcpICsKICAgICAga3BpKCfguITguKfguLLguKHguITguLfguJrguKvguJnguYnguLInLCBwY3QoZC5yb29tcy5sZW5ndGggPyBkLnJvb21zRG9uZUluWWVhci9kLnJvb21z',
  'Lmxlbmd0aCoxMDAgOiAwKSwgJ+C4guC4reC4h+C4l+C4seC5ieC4h+C4q+C4oeC4lCAnICsgZC5yb29tcy5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycpICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciBhY3Rpb25zID0gJzxkaXYgY2xhc3M9InJvdyBtYjEyIj4nICsK',
  'ICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZvcm1BYyhudWxsKSI+KyDguJrguLHguJnguJfguLbguIHguIHguLLguKPguKXguYnguLLguIfguYHguK3guKPguYw8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25j',
  'bGljaz0iZm9ybUJ1bGtBYygpIj7wn5OFIOC4meC4seC4lOC4peC5ieC4suC4h+C4q+C4peC4suC4ouC4q+C5ieC4reC4h+C4nuC4o+C5ieC4reC4oeC4geC4seC4mTwvYnV0dG9uPicgKwogICAgICAnPHNwYW4gY2xhc3M9InNwIj48L3NwYW4+JyArCiAgICAgICc8',
  'c3BhbiBjbGFzcz0iZnMxMiBtdXRlZCI+4LiE4Lil4Li04LiB4LiX4Li14LmI4Lir4LmJ4Lit4LiH4LmA4Lie4Li34LmI4Lit4LiU4Li5L+C5gOC4nuC4tOC5iOC4oeC4o+C4reC4muC4geC4suC4o+C4peC5ieC4suC4hzwvc3Bhbj4nICsKICAgICc8L2Rpdj4nOwoK',
  'ICAgIHZhciBncmlkID0gY2FyZCgn4p2E77iPIOC4leC4suC4o+C4suC4h+C4peC5ieC4suC4h+C5geC4reC4o+C5jOC4o+C4suC4ouC4q+C5ieC4reC4hyDCtyAnICsgeWVhckxhYmVsLCByb29tRmxvb3JzKGQucm9vbXMsIGZ1bmN0aW9uKHIpewogICAgICB2YXIg',
  'Y2xzID0gci5yb3VuZHNJblllYXIgPiAwID8gJ3Mtb2snIDogKHIuc3RhdGUgPT09ICfguYDguIHguLTguJnguIHguLPguKvguJnguJQnID8gJ3MtZGdyJyA6IChyLnN0YXRlID09PSAn4Lii4Lix4LiH4LmE4Lih4LmI4LmA4LiE4Lii4Lil4LmJ4Liy4LiHJyA/ICdz',
  'LXdhcm4nIDogJ3MtaW5mbycpKTsKICAgICAgdmFyIHN1YiA9IHIucm91bmRzSW5ZZWFyID4gMAogICAgICAgID8gJzxiPicgKyByLnJvdW5kc0luWWVhciArICcg4Lij4Lit4LiaPC9iPjxicj4nICsgdGhEYXRlU2hvcnQoci5yZWNvcmRzLmZpbHRlcihmdW5jdGlv',
  'bih4KXtyZXR1cm4geC5zZXJ2aWNlRGF0ZTt9KS5tYXAoZnVuY3Rpb24oeCl7cmV0dXJuIHguc2VydmljZURhdGU7fSkuc29ydCgpLnBvcCgpKQogICAgICAgIDogKHIuYm9va2VkSW5ZZWFyID8gJ+C4meC4seC4lOC5geC4peC5ieC4pyAnICsgci5ib29rZWRJblll',
  'YXIgOiAoci5sYXN0U2VydmljZSA/ICfguKXguYjguLLguKrguLjguJQgJyArIHRoRGF0ZVNob3J0KHIubGFzdFNlcnZpY2UpIDogJ+C5hOC4oeC5iOC4oeC4teC4m+C4o+C4sOC4p+C4seC4leC4tCcpKTsKICAgICAgcmV0dXJuIHsgY2xzOiBjbHMsIHN1Yjogc3Vi',
  'LCBvbmNsaWNrOiAnb3BlbkFjUm9vbSgnICsganNxKHIucm9vbSkgKyAnKScgfTsKICAgIH0pLCAnJywgZmFsc2UpOwoKICAgIHZhciBsaXN0Um93cyA9IFtdOwogICAgZC5yb29tcy5mb3JFYWNoKGZ1bmN0aW9uKHIpeyByLnJlY29yZHMuZm9yRWFjaChmdW5jdGlv',
  'bih4KXsgeC5fcm9vbSA9IHIucm9vbTsgbGlzdFJvd3MucHVzaCh4KTsgfSk7IH0pOwogICAgbGlzdFJvd3Muc29ydChmdW5jdGlvbihhLGIpeyByZXR1cm4gU3RyaW5nKGIuc2VydmljZURhdGV8fGIuYm9va0RhdGV8fCcnKS5sb2NhbGVDb21wYXJlKFN0cmluZyhh',
  'LnNlcnZpY2VEYXRlfHxhLmJvb2tEYXRlfHwnJykpOyB9KTsKCiAgICB2YXIgbGlzdCA9IGNhcmQoJ/Cfk4sg4Lib4Lij4Liw4Lin4Lix4LiV4Li04LiB4Liy4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMIMK3ICcgKyB5ZWFyTGFiZWwgKyAnICgnICsgbGlzdFJv',
  'd3MubGVuZ3RoICsgJyknLAogICAgICBsaXN0Um93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC4q+C5ieC4reC4hzwvdGg+PHRoPuC4o+C4reC4muC4l+C4teC5iDwvdGg+PHRo',
  'PuC4p+C4seC4meC4l+C4teC5iOC4meC4seC4lDwvdGg+PHRoPuC4p+C4seC4meC4l+C4teC5iOC4lOC4s+C5gOC4meC4tOC4meC4geC4suC4ozwvdGg+PHRoPuC4quC4luC4suC4meC4sDwvdGg+JyArCiAgICAgICAgJzx0aD7guIrguYjguLLguIc8L3RoPjx0aCBj',
  'bGFzcz0ibnVtIj7guITguYjguLLguYPguIrguYnguIjguYjguLLguKI8L3RoPjx0aD7guKDguLLguJ48L3RoPjx0aD7guKvguKHguLLguKLguYDguKvguJXguLg8L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgbGlzdFJvd3MubWFw',
  'KGZ1bmN0aW9uKHgpewogICAgICAgICAgcmV0dXJuICc8dHI+JyArCiAgICAgICAgICAgICc8dGQ+PGI+JyArIGVzYyh4LnJvb20pICsgJzwvYj48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAoeC5yb3VuZCB8fCAxKSArICc8L3RkPicg',
  'KwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LmJvb2tEYXRlKSArIG90aGVyWWVhclRhZyh4KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LnNlcnZpY2VE',
  'YXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyBzdGF0dXNTZWxlY3QoeCwgJ2FjLnNldFN0YXR1cycsIG9wdCgnYWNTdGF0dXNlcycpKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKHgudGVjaG5pY2lh',
  'biB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbnVtKHguY29zdCkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCh4LnBob3RvUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAg',
  'Jzx0ZCBjbGFzcz0iZnMxMiBtdXRlZCBjbGlwIj4nICsgZXNjKHgubm90ZSB8fCAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48ZGl2IGNsYXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIg',
  'b25jbGljaz1cJ2Zvcm1BYygnICsgYXR0cih4KSArICcpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIGRnciIgb25jbGljaz0iZGVsQWMoJyArIGpzcSh4LmlkKSArICcpIj7wn5eRPC9idXR0b24+',
  'JyArCiAgICAgICAgICAgICc8L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6IGVtcHR5Qm94KCfguKLguLHguIfguYTguKHguYjguKHguLXguJrguLHguJnguJfguLbguIHguIHguLLg',
  'uKPguKXguYnguLLguIfguYHguK3guKPguYzguYPguJknICsgeWVhckxhYmVsKSwgJycsIHRydWUpOwoKICAgIHJldHVybiBoZWFkICsgYWN0aW9ucyArIGdyaWQgKyAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIGxpc3QgKyAnPC9kaXY+JzsKICB9Cn07CgovKioKICog',
  '4LiK4LmI4Lit4LiH4LmA4Lil4Li34Lit4LiB4Liq4LiW4Liy4LiZ4Liw4LmD4LiZ4LiV4Liy4Lij4Liy4LiHIOKAlCDguYDguJvguKXguLXguYjguKLguJnguYHguKXguYnguKfguJrguLHguJnguJfguLbguIHguJfguLHguJnguJfguLUg4LmE4Lih4LmI4LiV4LmJ',
  '4Lit4LiH4LmA4Lib4Li04LiU4Lif4Lit4Lij4LmM4LihCiAqCiAqIOC4q+C4meC5ieC4suC4leC4suC5gOC4q+C4oeC4t+C4reC4meC4m+C5ieC4suC4ouC4quC4luC4suC4meC4sOC5gOC4lOC4tOC4oeC4l+C4uOC4geC4reC4ouC5iOC4suC4hyAo4Liq4Li14LmA',
  '4LiU4Li14Lii4Lin4LiB4Lix4LiZKSDguYHguITguYjguIHguJTguYHguKXguYnguKfguYDguKXguLfguK3guIHguYTguJTguYkKICog4LiE4LiZ4LiX4Li14LmI4LmA4Lib4Li04LiU4LiU4Li54Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4Lin4LiI4Liw4LmA',
  '4Lir4LmH4LiZ4LmA4Lib4LmH4LiZ4Lib4LmJ4Liy4Lii4LiY4Lij4Lij4Lih4LiU4Liy4LmA4Lir4Lih4Li34Lit4LiZ4LmA4LiU4Li04LihCiAqLwpmdW5jdGlvbiBzdGF0dXNTZWxlY3QoeCwgYWN0aW9uLCBvcHRpb25zKXsKICBpZiAoIWNhbkVkaXQoKSkgcmV0',
  'dXJuIHN0YXR1c0JhZGdlKHguc3RhdHVzKTsKICB2YXIgY3VyID0gU3RyaW5nKHguc3RhdHVzIHx8ICcnKTsKICB2YXIgbGlzdCA9IChvcHRpb25zIHx8IFtdKS5zbGljZSgpOwogIGlmIChjdXIgJiYgbGlzdC5pbmRleE9mKGN1cikgPCAwKSBsaXN0LnVuc2hpZnQo',
  'Y3VyKTsgICAvLyDguITguYjguLLguYDguIHguYjguLLguJnguK3guIHguKPguLLguKLguIHguLLguKMg4LiV4LmJ4Lit4LiH4LmE4Lih4LmI4Lir4Liy4Lii4LmE4LibCiAgcmV0dXJuICc8c2VsZWN0IGNsYXNzPSJzdC1zZWwgJyArIHN0YXR1c1RvbmUoY3VyKSAr',
  'ICciIHRpdGxlPSLguYDguJvguKXguLXguYjguKLguJnguKrguJbguLLguJnguLDguYTguJTguYnguYDguKXguKIiJyArCiAgICAnIGRhdGEtcHJldj0iJyArIGVzYyhjdXIpICsgJyInICsKICAgICcgb25jaGFuZ2U9ImNoYW5nZVN0YXR1cyhcJycgKyBhY3Rpb24g',
  'KyAnXCcsJyArIGpzcSh4LmlkKSArICcsdGhpcykiPicgKwogICAgbGlzdC5tYXAoZnVuY3Rpb24obyl7CiAgICAgIHJldHVybiAnPG9wdGlvbiB2YWx1ZT0iJyArIGVzYyhvKSArICciJyArIChvID09PSBjdXIgPyAnIHNlbGVjdGVkJyA6ICcnKSArICc+JyArIGVz',
  'YyhvKSArICc8L29wdGlvbj4nOwogICAgfSkuam9pbignJykgKyAnPC9zZWxlY3Q+JzsKfQoKLyoqIOC4quC4teC4guC4reC4h+C4quC4luC4suC4meC4sCDguYPguIrguYnguIrguLjguJTguYDguJTguLXguKLguKfguIHguLHguJrguJvguYnguLLguKIgc3RhdHVz',
  'QmFkZ2Ug4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4LmA4Lie4Li14LmJ4Lii4LiZ4LiB4Lix4LiZICovCmZ1bmN0aW9uIHN0YXR1c1RvbmUoc3QpewogIHZhciBtID0gU3RyaW5nKHN0YXR1c0JhZGdlKHN0KSkubWF0Y2goL2NsYXNzPSJiIChbYS16XSspIi8pOwog',
  'IHJldHVybiBtID8gbVsxXSA6ICdtdXRlJzsKfQoKZnVuY3Rpb24gY2hhbmdlU3RhdHVzKGFjdGlvbiwgaWQsIHNlbCl7CiAgdmFyIG5leHQgPSBzZWwudmFsdWUsIHByZXYgPSBzZWwuZ2V0QXR0cmlidXRlKCdkYXRhLXByZXYnKSB8fCAnJzsKICBzZWwuZGlzYWJs',
  'ZWQgPSB0cnVlOwogIHNlbC5jbGFzc05hbWUgPSAnc3Qtc2VsICcgKyBzdGF0dXNUb25lKG5leHQpOwoKICBjYWxsQXBpKGFjdGlvbiwgeyBpZDogaWQsIHN0YXR1czogbmV4dCB9KS50aGVuKGZ1bmN0aW9uKHNhdmVkKXsKICAgIGlmIChzYXZlZCAmJiBzYXZlZC5m',
  'aWxsZWREYXRlKSB7CiAgICAgIHRvYXN0KCfguJrguLHguJnguJfguLbguIHguYHguKXguYnguKcgwrcg4LmA4LiV4Li04Lih4Lin4Lix4LiZ4LiX4Li14LmI4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4Lij4LmA4Lib4LmH4LiZICcgKyB0aERhdGUoc2F2ZWQuZmls',
  'bGVkRGF0ZSkgKyAnIOC5g+C4q+C5ieC4lOC5ieC4p+C4oicsICdvaycpOwogICAgfQogICAgc2VsLnNldEF0dHJpYnV0ZSgnZGF0YS1wcmV2JywgbmV4dCk7CiAgICBzZWwuZGlzYWJsZWQgPSBmYWxzZTsKICAgIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgICAvLyDg',
  'uIrguYjguK3guIfguKvguYnguK3guIfguIHguLHguJrguJXguLHguKfguYDguKXguILguKrguKPguLjguJvguJTguYnguLLguJnguJrguJnguK3guLLguIjguYDguJvguKXguLXguYjguKLguJnguJXguLLguKEKICAgIHJlZnJlc2hBbGVydHMoKTsKICB9KS5jYXRj',
  'aChmdW5jdGlvbihlKXsKICAgIGlmIChwcmV2KSB7IHNlbC52YWx1ZSA9IHByZXY7IHNlbC5jbGFzc05hbWUgPSAnc3Qtc2VsICcgKyBzdGF0dXNUb25lKHByZXYpOyB9CiAgICBzZWwuZGlzYWJsZWQgPSBmYWxzZTsKICAgIHRvYXN0KGUubWVzc2FnZSB8fCBlLCAn',
  'ZXJyJyk7CiAgfSk7Cn0KCmZ1bmN0aW9uIG9wZW5BY1Jvb20ocm9vbSl7CiAgdmFyIGQgPSBTLmNhY2hlLmFjOwogIHZhciByID0gZC5yb29tcy5maWx0ZXIoZnVuY3Rpb24oeCl7IHJldHVybiB4LnJvb20gPT09IHJvb207IH0pWzBdOwogIHZhciBib2R5ID0KICAg',
  'ICc8ZGl2IGNsYXNzPSJncmlkIGczIG1iMTIiPicgKwogICAgICBrcGkoJ+C4o+C4reC4muC4l+C4teC5iOC4peC5ieC4suC4h+C5g+C4meC4m+C4teC4meC4teC5iScsIChyLnJvdW5kc0luWWVhcnx8MCkgKyAnIOC4o+C4reC4micsICcnKSArCiAgICAgIGtwaSgn',
  '4Lil4LmJ4Liy4LiH4Lil4LmI4Liy4Liq4Li44LiUJywgci5sYXN0U2VydmljZSA/IHRoRGF0ZShyLmxhc3RTZXJ2aWNlKSA6ICfigJMnLCByLmxhc3RTZXJ2aWNlID8gKGRheXNBZ28oci5sYXN0U2VydmljZSkgKyAnIOC4p+C4seC4meC4l+C4teC5iOC5geC4peC5',
  'ieC4pycpIDogJycpICsKICAgICAga3BpKCfguITguKPguJrguIHguLPguKvguJnguJTguKPguK3guJrguJbguLHguJTguYTguJsnLCByLm5leHREdWUgPyB0aERhdGUoci5uZXh0RHVlKSA6ICfigJMnLCByLnN0YXRlLCByLnN0YXRlID09PSAn4LmA4LiB4Li04LiZ',
  '4LiB4Liz4Lir4LiZ4LiUJyA/ICdiYWQnIDogJycpICsKICAgICc8L2Rpdj4nICsKICAgIChyLnJlY29yZHMubGVuZ3RoCiAgICAgID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiIHN0eWxlPSJtaW4td2lkdGg6YXV0byI+PHRoZWFkPjx0cj48dGg+',
  '4Lij4Lit4LiaPC90aD48dGg+4LiZ4Lix4LiUPC90aD48dGg+4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4LijPC90aD48dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD48dGg+4Lig4Liy4LiePC90aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAg',
  'IHIucmVjb3Jkcy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgICAgICByZXR1cm4gJzx0cj48dGQ+JyArICh4LnJvdW5kfHwxKSArICc8L3RkPjx0ZCBjbGFzcz0iZnMxMiI+JyArIHRoRGF0ZSh4LmJvb2tEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNs',
  'YXNzPSJmczEyIj4nICsgdGhEYXRlKHguc2VydmljZURhdGUpICsgJzwvdGQ+PHRkPicgKyBzdGF0dXNCYWRnZSh4LnN0YXR1cykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCh4LnBob3RvUmVmcykgKyAnPC90ZD4nICsKICAgICAg',
  'ICAgICAgJzx0ZD48YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9XCdjbG9zZU1vZGFsKCk7Zm9ybUFjKCcgKyBhdHRyKHgpICsgJylcJz7guYHguIHguYnguYTguII8L2J1dHRvbj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5',
  'PjwvdGFibGU+PC9kaXY+JwogICAgICA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lia4Lix4LiZ4LiX4Li24LiB4LmD4LiZ4Lib4Li14LiX4Li14LmI4LmA4Lil4Li34Lit4LiBPC9kaXY+Jyk7CgogIG9wZW5Nb2RhbCgn4p2E',
  '77iPIOC4peC5ieC4suC4h+C5geC4reC4o+C5jCDCtyDguKvguYnguK3guIcgJyArIHJvb20sIGJvZHksCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4m+C4tOC4lDwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9',
  'ImJ0biBwcmkiIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtmb3JtQWMoe3Jvb206JyArIGpzcShyb29tKSArICd9KSI+KyDguYDguJ7guLTguYjguKHguKPguK3guJrguIHguLLguKPguKXguYnguLLguIc8L2J1dHRvbj4nKTsKfQoKLyogPT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDUpIOC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4suC4oeC4q+C5ieC4reC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT0gKi8KUk9VVEVTLnJlcGFpcnMgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsgcmV0dXJuIGNhbGxBcGkoJ3JlcGFpci5tYXRyaXgnLCB7IHllYXI6IFMueWVhciB9KTsgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMueWVh',
  'ciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKICAgIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgIGtwaSgn4LiH4Liy4LiZ4LiL4LmI4Lit4LihICcgKyB5ZWFyTGFiZWwsIGQu',
  'dG90YWxKb2JzICsgJyDguIfguLLguJknLCAn4LiI4Liy4LiBICcgKyBkLnJvb21zLmZpbHRlcihmdW5jdGlvbihyKXtyZXR1cm4gci5jb3VudD4wO30pLmxlbmd0aCArICcg4Lir4LmJ4Lit4LiHJywgJ2FjY2VudCcpICsKICAgICAga3BpKCfguIfguLLguJnguJfg',
  'uLXguYjguKLguLHguIfguYTguKHguYjguYDguKrguKPguYfguIgnLCBkLm9wZW5Kb2JzICsgJyDguIfguLLguJknLCBkLm9wZW5UYXNrcyA/ICfguITguYnguLLguIfguK3guKLguLnguYggJyArIGQub3BlblRhc2tzICsgJyDguIjguLjguJQnIDogJycsIGQub3Bl',
  'bkpvYnMgPyAnd2FybicgOiAnZ29vZCcpICsKICAgICAga3BpKCfguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguKPguKfguKEnLCBiYWh0KGQudG90YWxDb3N0KSwgeWVhckxhYmVsKSArCiAgICAgIGtwaSgn4Lir4LmJ4Lit4LiH4LiX4Li14LmI4Lii4Lix',
  '4LiH4LmE4Lih4LmI4LmA4LiE4Lii4LiL4LmI4Lit4LihJywgZC5yb29tcy5maWx0ZXIoZnVuY3Rpb24ocil7cmV0dXJuIHIuY291bnQ9PT0wO30pLmxlbmd0aCArICcg4Lir4LmJ4Lit4LiHJywgJ+C5g+C4mScgKyB5ZWFyTGFiZWwpICsKICAgICc8L2Rpdj4nOwoK',
  'ICAgIHZhciBhY3Rpb25zID0gJzxkaXYgY2xhc3M9InJvdyBtYjEyIj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZvcm1SZXBhaXIobnVsbCkiPisg4LmB4LiI4LmJ4LiH4LiL4LmI4Lit4LihIC8g4Lia4Lix4LiZ4LiX4Li24LiB',
  '4LiH4Liy4LiZ4LiL4LmI4Lit4LihPC9idXR0b24+JyArCiAgICAgICc8c3BhbiBjbGFzcz0ic3AiPjwvc3Bhbj48c3BhbiBjbGFzcz0iZnMxMiBtdXRlZCI+4LiE4Lil4Li04LiB4LiX4Li14LmI4Lir4LmJ4Lit4LiH4LmA4Lie4Li34LmI4Lit4LiU4Li54Lib4Lij',
  '4Liw4Lin4Lix4LiV4Li04LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiC4Lit4LiH4Lir4LmJ4Lit4LiH4LiZ4Lix4LmJ4LiZPC9zcGFuPjwvZGl2Pic7CgogICAgdmFyIGdyaWQgPSBjYXJkKCfwn5SnIOC4oOC4suC4nuC4o+C4p+C4oeC4h+C4suC4meC4i+C5iOC4reC4',
  'oeC4o+C4suC4ouC4q+C5ieC4reC4hyDCtyAnICsgeWVhckxhYmVsLCByb29tRmxvb3JzKGQucm9vbXMsIGZ1bmN0aW9uKHIpewogICAgICB2YXIgY2xzID0gci5vcGVuQ291bnQgPiAwID8gJ3MtZGdyJyA6IChyLmNvdW50ID4gMCA/ICdzLW9rJyA6ICdzLWluZm8n',
  'KTsKICAgICAgdmFyIHN1YiA9IHIuY291bnQgPiAwCiAgICAgICAgPyAnPGI+JyArIHIuY291bnQgKyAnIOC4h+C4suC4mTwvYj4nICsgKHIub3BlbkNvdW50ID8gJyDCtyDguITguYnguLLguIcgJyArIChyLm9wZW5UYXNrcyB8fCByLm9wZW5Db3VudCkgKyAnIOC4',
  'iOC4uOC4lCcgOiAnJykgKyAnPGJyPicgKyAoci5sYXN0ID8gdGhEYXRlU2hvcnQoci5sYXN0KSA6ICcnKQogICAgICAgIDogJ+C5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4i+C5iOC4reC4oSc7CiAgICAgIHJldHVybiB7IGNsczogY2xzLCBzdWI6IHN1Yiwgb25j',
  'bGljazogJ29wZW5SZXBhaXJSb29tKCcgKyBqc3Eoci5yb29tKSArICcpJyB9OwogICAgfSkpOwoKICAgIHZhciByb3dzID0gW107CiAgICBkLnJvb21zLmZvckVhY2goZnVuY3Rpb24ocil7IHIucmVjb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uKHgpeyByb3dzLnB1c2go',
  'eCk7IH0pOyB9KTsKICAgIHJvd3Muc29ydChmdW5jdGlvbihhLGIpeyByZXR1cm4gU3RyaW5nKGIucmVwYWlyRGF0ZXx8Yi5ib29rRGF0ZXx8JycpLmxvY2FsZUNvbXBhcmUoU3RyaW5nKGEucmVwYWlyRGF0ZXx8YS5ib29rRGF0ZXx8JycpKTsgfSk7CgogICAgdmFy',
  'IGxpc3QgPSBjYXJkKCfwn5OLIOC4o+C4suC4ouC4geC4suC4o+C4h+C4suC4meC4i+C5iOC4reC4oSDCtyAnICsgeWVhckxhYmVsICsgJyAoJyArIHJvd3MubGVuZ3RoICsgJyknLAogICAgICByb3dzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNs',
  'YXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOjEwMjBweCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC4q+C5ieC4reC4hzwvdGg+PHRoPuC4p+C4seC4meC4meC4seC4lOC4i+C5iOC4reC4oTwvdGg+PHRoPuC4p+C4seC4meC5gOC4guC5ieC4suC4i+C5iOC4',
  'reC4oTwvdGg+PHRoPuC4m+C4o+C4sOC5gOC4oOC4lzwvdGg+PHRoPuC4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4i+C5iOC4reC4oeC5geC4i+C4oTwvdGg+JyArCiAgICAgICAgJzx0aD7guKrguJbguLLguJnguLA8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITg',
  'uYjguLLguYPguIrguYnguIjguYjguLLguKI8L3RoPjx0aD7guIHguYjguK3guJk8L3RoPjx0aD7guKvguKXguLHguIc8L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgcm93cy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgICAgICByZXR1',
  'cm4gJzx0cj4nICsKICAgICAgICAgICAgJzx0ZD48Yj4nICsgZXNjKHgucm9vbSkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHguYm9va0RhdGUpICsgb3RoZXJZZWFyVGFnKHgpICsgJzwvdGQ+',
  'JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHgucmVwYWlyRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyh4LmNhdGVnb3J5IHx8ICfigJMnKSArICc8L3RkPicgKwog',
  'ICAgICAgICAgICAnPHRkIHN0eWxlPSJtaW4td2lkdGg6MjgwcHgiPicgKyB0b2RvTGlzdEh0bWwoeCkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgc3RhdHVzQmFkZ2UoeC5zdGF0dXMpICsgKHgucHJpb3JpdHkgJiYgeC5wcmlvcml0eSAhPT0gJ+C4',
  'm+C4geC4leC4tCcgPyAnICcgKyBzdGF0dXNCYWRnZSh4LnByaW9yaXR5KSA6ICcnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyBudW0oeC5jb3N0KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1s',
  'KHguYmVmb3JlUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCh4LmFmdGVyUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48ZGl2IGNsYXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgICAgICc8YnV0dG9u',
  'IGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1SZXBhaXIoJyArIGF0dHIoeCkgKyAnKVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiBkZ3IiIG9uY2xpY2s9ImRlbFJlcGFpcignICsg',
  'anNxKHguaWQpICsgJykiPvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICAgJzwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nCiAgICAgIDogZW1wdHlCb3goJ+C4ouC4seC4h+C5hOC4oeC5iOC4',
  'oeC4teC4h+C4suC4meC4i+C5iOC4reC4oeC5g+C4mScgKyB5ZWFyTGFiZWwsICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtUmVwYWlyKG51bGwpIj4rIOC5geC4iOC5ieC4h+C4i+C5iOC4reC4oTwvYnV0dG9uPicpLCAnJywgdHJ1ZSk7Cgog',
  'ICAgcmV0dXJuIGhlYWQgKyBhY3Rpb25zICsgZ3JpZCArICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgbGlzdCArICc8L2Rpdj4nOwogIH0KfTsKCi8qKgogKiDguYDguIrguYfguITguKXguLTguKrguJXguYzguJfguLXguYjguJXguLTguYrguIHguYTguJTguYnguIjg',
  'uKPguLTguIfguIjguLLguIHguKvguJnguYnguLLguKPguLLguKLguIHguLLguKMg4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LmA4Lib4Li04LiU4Lif4Lit4Lij4LmM4LihCiAqIOC4leC4tOC5iuC4geC4m+C4uOC5iuC4muC4muC4seC4meC4l+C4tuC4geC4guC4tuC5',
  'ieC4meC4iuC4teC4leC4l+C4seC4meC4l+C4tSDguYHguKXguLDguJbguYnguLLguJXguLTguYrguIHguITguKPguJrguJfguLjguIHguILguYnguK0g4Liq4LiW4Liy4LiZ4Liw4LiI4Liw4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LmA4Lib4LmH4LiZICLguYDguKrg',
  'uKPguYfguIjguKrguLTguYnguJkiIOC5g+C4q+C5ieC5gOC4reC4hwogKi8KZnVuY3Rpb24gdG9kb0xpc3RIdG1sKHgpewogIHZhciB0b2RvID0geC50b2RvIHx8IFtdOwogIGlmICghdG9kby5sZW5ndGgpIHJldHVybiAnPHNwYW4gY2xhc3M9ImZzMTMgbXV0ZWQi',
  'PicgKyBlc2MoeC5pdGVtcyB8fCAn4oCTJykgKyAnPC9zcGFuPic7CgogIHZhciBwID0geC5wcm9ncmVzcyB8fCB7IGRvbmU6IDAsIHRvdGFsOiB0b2RvLmxlbmd0aCwgcGVyY2VudDogMCB9OwogIHZhciBsb2NrZWQgPSAhY2FuRWRpdCgpOwoKICByZXR1cm4gJzxk',
  'aXYgY2xhc3M9InRvZG8tdmlldyI+JyArCiAgICAnPGRpdiBjbGFzcz0idG9kby1iYXIiPjxpIHN0eWxlPSJ3aWR0aDonICsgcC5wZXJjZW50ICsgJyUiPjwvaT48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJ0b2RvLW1ldGEiPuC5gOC4quC4o+C5h+C4iOC5geC4',
  'peC5ieC4pyA8Yj4nICsgcC5kb25lICsgJy8nICsgcC50b3RhbCArICc8L2I+IOC4h+C4suC4mTwvZGl2PicgKwogICAgdG9kby5tYXAoZnVuY3Rpb24odCwgaSl7CiAgICAgIHJldHVybiAnPGxhYmVsIGNsYXNzPSJ0b2RvLWxpbmUnICsgKHQuZG9uZSA/ICcgZG9u',
  'ZScgOiAnJykgKyAobG9ja2VkID8gJyBsb2NrZWQnIDogJycpICsgJyI+JyArCiAgICAgICAgJzxpbnB1dCB0eXBlPSJjaGVja2JveCInICsgKHQuZG9uZSA/ICcgY2hlY2tlZCcgOiAnJykgKyAobG9ja2VkID8gJyBkaXNhYmxlZCcgOiAnJykgKwogICAgICAgICAg',
  'JyBvbmNoYW5nZT0idG9nZ2xlVG9kbygnICsganNxKHguaWQpICsgJywnICsgaSArICcsdGhpcy5jaGVja2VkLHRoaXMpIj4nICsKICAgICAgICAnPHNwYW4gY2xhc3M9Im5tIj4nICsgZXNjKHQubmFtZSkgKyAnPC9zcGFuPicgKwogICAgICAgICh0LmNhdGVnb3J5',
  'ID8gJzxzcGFuIGNsYXNzPSJiIG11dGUgY2F0Ij4nICsgZXNjKHQuY2F0ZWdvcnkpICsgJzwvc3Bhbj4nIDogJycpICsKICAgICAgJzwvbGFiZWw+JzsKICAgIH0pLmpvaW4oJycpICsKICAnPC9kaXY+JzsKfQoKLyoqCiAqIOC4leC4tOC5iuC4geC4h+C4suC4meC4',
  'q+C4meC4tuC5iOC4h+C4guC5ieC4rSDigJQg4Lit4Lix4Lib4LmA4LiU4LiV4Lir4LiZ4LmJ4Liy4LiI4Lit4LiX4Lix4LiZ4LiX4Li14LmB4Lil4LmJ4Lin4LiE4LmI4Lit4Lii4Lia4Lix4LiZ4LiX4Li24LiBCiAqIOC4luC5ieC4suC4muC4seC4meC4l+C4tuC4',
  'geC5hOC4oeC5iOC4nOC5iOC4suC4mSDguYPguKvguYnguJXguLTguYrguIHguIHguKXguLHguJrguYTguJvguYDguJvguYfguJnguYDguKvguKHguLfguK3guJnguYDguJTguLTguKEg4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4LmA4LiC4LmJ4Liy4LmD4LiI4Lic',
  '4Li04LiU4Lin4LmI4Liy4Lia4Lix4LiZ4LiX4Li24LiB4LmB4Lil4LmJ4LinCiAqLwpmdW5jdGlvbiB0b2dnbGVUb2RvKGlkLCBpbmRleCwgZG9uZSwgYm94KXsKICB2YXIgbGluZSA9IGJveC5jbG9zZXN0KCcudG9kby1saW5lJyk7CiAgaWYgKGxpbmUpIGxpbmUu',
  'Y2xhc3NMaXN0LnRvZ2dsZSgnZG9uZScsIGRvbmUpOwogIGJveC5kaXNhYmxlZCA9IHRydWU7CgogIGNhbGxBcGkoJ3JlcGFpci50b2dnbGUnLCB7IGlkOiBpZCwgaW5kZXg6IGluZGV4LCBkb25lOiBkb25lIH0pLnRoZW4oZnVuY3Rpb24oKXsKICAgIGxvYWQoeyBx',
  'dWlldDogdHJ1ZSB9KTsgICAgICAgIC8vIOC4hOC4p+C4suC4oeC4hOC4t+C4muC4q+C4meC5ieC4suC4geC4seC4muC4quC4luC4suC4meC4sOC4reC4suC4iOC5gOC4m+C4peC4teC5iOC4ouC4mSDguIvguLTguIfguIHguYzguYDguIfguLXguKLguJog4LmGCiAg',
  'ICByZWZyZXNoQWxlcnRzKCk7ICAgICAgICAgICAgICAvLyDguIfguLLguJnguITguYnguLLguIfguK3guLLguIjguKXguJTguKXguIcg4LiV4Lix4Lin4LmA4Lil4LiC4Lia4LiZ4LmA4Lih4LiZ4Li54LiV4LmJ4Lit4LiH4LiV4Liy4Lih4LiU4LmJ4Lin4LiiCiAg',
  'fSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICBib3guY2hlY2tlZCA9ICFkb25lOwogICAgaWYgKGxpbmUpIGxpbmUuY2xhc3NMaXN0LnRvZ2dsZSgnZG9uZScsICFkb25lKTsKICAgIGJveC5kaXNhYmxlZCA9IGZhbHNlOwogICAgdG9hc3QoZS5tZXNzYWdlIHx8IGUs',
  'ICdlcnInKTsKICB9KTsKfQoKZnVuY3Rpb24gb3BlblJlcGFpclJvb20ocm9vbSl7CiAgdmFyIGQgPSBTLmNhY2hlLnJlcGFpcnM7CiAgdmFyIHIgPSBkLnJvb21zLmZpbHRlcihmdW5jdGlvbih4KXsgcmV0dXJuIHgucm9vbSA9PT0gcm9vbTsgfSlbMF07CiAgdmFy',
  'IGJvZHkgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnMyBtYjEyIj4nICsKICAgICAga3BpKCfguIfguLLguJnguJfguLHguYnguIfguKvguKHguJQnLCByLmNvdW50ICsgJyDguIfguLLguJknLCAnJykgKwogICAgICBrcGkoJ+C4ouC4seC4h+C5hOC4oeC5iOC5gOC4quC4',
  'o+C5h+C4iCcsIHIub3BlbkNvdW50ICsgJyDguIfguLLguJknLCByLm9wZW5UYXNrcyA/ICfguITguYnguLLguIfguK3guKLguLnguYggJyArIHIub3BlblRhc2tzICsgJyDguIjguLjguJQnIDogJycsIHIub3BlbkNvdW50ID8gJ3dhcm4nOidnb29kJykgKwogICAg',
  'ICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oicsIGJhaHQoci5jb3N0KSwgJycpICsKICAgICc8L2Rpdj4nICsKICAgIChyLnJlY29yZHMubGVuZ3RoID8gJzxkaXYgY2xhc3M9InRsIj4nICsgci5yZWNvcmRzLm1hcChmdW5jdGlvbih4KXsKICAg',
  'ICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJ0bC1pIj48ZGl2IGNsYXNzPSJkIj4nICsgdGhEYXRlKHgucmVwYWlyRGF0ZSB8fCB4LmJvb2tEYXRlKSArICcgwrcgJyArIGVzYyh4LmNhdGVnb3J5fHwnJykgKyAnICcgKyBzdGF0dXNCYWRnZSh4LnN0YXR1cykgKyAnPC9k',
  'aXY+JyArCiAgICAgICAgJzxkaXYgY2xhc3M9InQiPicgKyB0b2RvTGlzdEh0bWwoeCkgKyAnPC9kaXY+JyArCiAgICAgICAgKHgudGVjaG5pY2lhbiA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIj7guIrguYjguLLguIc6ICcgKyBlc2MoeC50ZWNobmljaWFuKSAr',
  'ICc8L2Rpdj4nIDogJycpICsKICAgICAgICAoeC5jb3N0ID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQiPuC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oiAnICsgYmFodCh4LmNvc3QpICsgJzwvZGl2PicgOiAnJykgKwogICAgICAgICc8ZGl2IGNsYXNzPSJt',
  'dDgiPicgKyB0aHVtYnNIdG1sKCh4LmJlZm9yZVJlZnN8fFtdKS5jb25jYXQoeC5hZnRlclJlZnN8fFtdKSkgKyAnPC9kaXY+JyArCiAgICAgICAgJzxkaXYgY2xhc3M9Im10OCI+PGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPVwnY2xvc2VNb2RhbCgpO2Zv',
  'cm1SZXBhaXIoJyArIGF0dHIoeCkgKyAnKVwnPuC5geC4geC5ieC5hOC4gjwvYnV0dG9uPjwvZGl2PicgKwogICAgICAnPC9kaXY+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4',
  'teC4h+C4suC4meC4i+C5iOC4reC4oeC5g+C4meC4m+C4teC4l+C4teC5iOC5gOC4peC4t+C4reC4gTwvZGl2PicpOwoKICBvcGVuTW9kYWwoJ/CflKcg4LiH4Liy4LiZ4LiL4LmI4Lit4LihIMK3IOC4q+C5ieC4reC4hyAnICsgcm9vbSwgYm9keSwKICAgICc8YnV0',
  'dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lib4Li04LiUPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iY2xvc2VNb2RhbCgpO2Zvcm1SZXBhaXIoe3Jvb206JyArIGpzcShyb29tKSArICd9KSI+',
  'KyDguYDguJ7guLTguYjguKHguIfguLLguJnguIvguYjguK3guKE8L2J1dHRvbj4nLCB0cnVlKTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDYpIOC4i+C5iOC4reC4oeC5geC4i+C4',
  'oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLmJ1aWxkaW5nID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7CiAgICByZXR1cm4gUHJv',
  'bWlzZS5hbGwoWwogICAgICBjYWxsQXBpKCdidWlsZGluZy5zdW1tYXJ5JywgeyB5ZWFyOiBTLnllYXIgfSksCiAgICAgIGNhbGxBcGkoJ2J1aWxkaW5nLmxpc3QnLCB7IHllYXI6IFMueWVhciwgem9uZTogUy5wYXJhbXMuem9uZSB8fCAnJywgc3RhdHVzOiAnJyB9',
  'KQogICAgXSkudGhlbihmdW5jdGlvbihyKXsgdmFyIGQgPSByWzBdOyBkLml0ZW1zID0gclsxXTsgcmV0dXJuIGQ7IH0pOwogIH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09ICdhbGwnID8gJ+C4l+C4uOC4geC4',
  'm+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICBrcGkoJ+C4h+C4suC4meC4m+C4tSAnICsgKFMueWVhcj09PSdhbGwnPyfguJfguLHguYnguIfguKvguKHguJQnOlMueWVh',
  'ciksIGQueWVhckNvdW50ICsgJyDguIfguLLguJknLCAn4Liq4Liw4Liq4LihICcgKyBkLnRvdGFsICsgJyDguIfguLLguJknLCAnYWNjZW50JykgKwogICAgICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oiAnICsgeWVhckxhYmVsLCBiYWh0KGQu',
  'eWVhckNvc3QpLCAn4Liq4Liw4Liq4LihICcgKyBiYWh0KGQuZ3JhbmRDb3N0KSkgKwogICAgICBrcGkoJ+C4h+C4suC4meC4l+C4teC5iOC4ouC4seC4h+C5hOC4oeC5iOC5gOC4quC4o+C5h+C4iCcsIGQub3BlbkNvdW50ICsgJyDguIfguLLguJknLCAnJywgZC5v',
  'cGVuQ291bnQgPyAnd2FybicgOiAnZ29vZCcpICsKICAgICAga3BpKCfguITguKPguJrguIHguLPguKvguJnguJTguYPguJkgOTAg4Lin4Lix4LiZJywgZC51cGNvbWluZy5sZW5ndGggKyAnIOC4h+C4suC4mScsIGQudXBjb21pbmcubGVuZ3RoID8gZC51cGNvbWlu',
  'Z1swXS50aXRsZSA6ICcnLCBkLnVwY29taW5nLmxlbmd0aCA/ICd3YXJuJyA6ICcnKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgem9uZXMgPSAnPGRpdiBjbGFzcz0iY2hpcHMgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJjaGlwICcgKyAoIVMucGFy',
  'YW1zLnpvbmU/J29uJzonJykgKyAnIiBvbmNsaWNrPSJzZXRQYXJhbShcJ3pvbmVcJyxcJ1wnKSI+4LiX4Li44LiB4Liq4LmI4Lin4LiZPC9idXR0b24+JyArCiAgICAgIGQuYnlab25lLm1hcChmdW5jdGlvbih6KXsKICAgICAgICByZXR1cm4gJzxidXR0b24gY2xh',
  'c3M9ImNoaXAgJyArIChTLnBhcmFtcy56b25lPT09ei56b25lPydvbic6JycpICsgJyIgb25jbGljaz0ic2V0UGFyYW0oXCd6b25lXCcsJyArIGpzcSh6LnpvbmUpICsgJykiPicgKwogICAgICAgICAgICAgICBlc2Moei56b25lKSArICcgKCcgKyB6LmNvdW50ICsg',
  'Jyk8L2J1dHRvbj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwoKICAgIHZhciBjaGFydHMgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnMiBtYjEyIj4nICsKICAgICAgY2FyZCgn8J+Pl++4jyDguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguYHguKLg',
  'uIHguJXguLLguKHguKrguYjguKfguJnguILguK3guIfguK3guLLguITguLLguKMnLCBiYXJDaGFydChkLmJ5Wm9uZSwgJ3pvbmUnLCAnY29zdCcsIGZ1bmN0aW9uKGkpeyByZXR1cm4gbW9uZXkoaS5jb3N0KSArICcg4Li/JzsgfSkpICsKICAgICAgY2FyZCgn8J+T',
  'hSDguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguYHguKLguIHguJXguLLguKHguJvguLUnLCBiYXJDaGFydCgKICAgICAgICBkLmJ5WWVhci5tYXAoZnVuY3Rpb24oeSl7IHJldHVybiB7IGxhYmVsOifguJvguLUgJyArIHkueWVhciArICcgKCcgKyB5LmNv',
  'dW50ICsgJyDguIfguLLguJkpJywgY29zdDp5LmNvc3QgfTsgfSksCiAgICAgICAgJ2xhYmVsJywgJ2Nvc3QnLCBmdW5jdGlvbihpKXsgcmV0dXJuIG1vbmV5KGkuY29zdCkgKyAnIOC4vyc7IH0pKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgcm93cyA9IGQuaXRl',
  'bXM7CiAgICB2YXIgbGlzdCA9IGNhcmQoJ/Cfj6Ig4Lij4Liy4Lii4LiB4Liy4Lij4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmC4LiU4Lii4Lij4Lin4LihIMK3ICcgKyB5ZWFyTGFiZWwgKyAnICgnICsgcm93cy5sZW5ndGggKyAnKScsCiAgICAgIHJv',
  'd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiIHN0eWxlPSJtaW4td2lkdGg6MTAyMHB4Ij48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4Liq4LmI4Lin4LiZ4LiC4Lit4LiH4Lit4Liy4LiE4Liy4LijPC90aD48dGg+4Lij4Liy',
  '4Lii4LiB4Liy4LijPC90aD48dGg+4LiZ4Lix4LiUPC90aD48dGg+4LmA4Lij4Li04LmI4LihPC90aD48dGg+4LmA4Liq4Lij4LmH4LiIPC90aD48dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD4nICsKICAgICAgICAnPHRoPuC4nOC4ueC5ieC4o+C4seC4muC5gOC4q+C4',
  'oeC4sjwvdGg+PHRoIGNsYXNzPSJudW0iPuC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ojwvdGg+PHRoPuC4o+C4reC4muC4luC4seC4lOC5hOC4mzwvdGg+PHRoPuC4oOC4suC4njwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAg',
  'ICByb3dzLm1hcChmdW5jdGlvbih4KXsKICAgICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj48Yj4nICsgZXNjKHguem9uZSB8fCAn4oCTJykgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZz',
  'MTMiPjxkaXYgY2xhc3M9ImNsaXAiPicgKyBlc2MoeC50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICAgKHgubm90ZSA/ICc8ZGl2IGNsYXNzPSJmczEyIGZhaW50IGNsaXAiPicgKyBlc2MoeC5ub3RlKSArICc8L2Rpdj4nIDogJycpICsgJzwvdGQ+JyAr',
  'CiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHguYm9va0RhdGUpICsgb3RoZXJZZWFyVGFnKHgpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHguc3RhcnREYXRl',
  'KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LmVuZERhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHN0YXR1c0JhZGdlKHguc3RhdHVzKSArICc8L3RkPicgKwogICAgICAgICAg',
  'ICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKHguY29udHJhY3RvciB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbnVtKHguY29zdCkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFw',
  'IGZzMTIiPicgKyAoeC5uZXh0RHVlID8gdGhEYXRlU2hvcnQoeC5uZXh0RHVlKSArCiAgICAgICAgICAgICAgICAoeC5kdWVJbkRheXMgIT0gbnVsbCA/ICc8ZGl2IGNsYXNzPSJmYWludCIgc3R5bGU9ImZvbnQtc2l6ZToxMXB4Ij4nICsgKHguZHVlSW5EYXlzPDAg',
  'PyAn4LmA4Lil4LiiICcgKyAoLXguZHVlSW5EYXlzKSArICcg4Lin4Lix4LiZJyA6ICfguK3guLXguIEgJyArIHguZHVlSW5EYXlzICsgJyDguKfguLHguJknKSArICc8L2Rpdj4nIDogJycpCiAgICAgICAgICAgICAgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAg',
  'ICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCgoeC5waG90b1JlZnN8fFtdKS5jb25jYXQoeC5zbGlwUmVmc3x8W10pKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPjxkaXYgY2xhc3M9InQtYWN0aW9ucyI+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xh',
  'c3M9ImJ0biBzbSBpY29uIiBvbmNsaWNrPVwnZm9ybUJ1aWxkaW5nKCcgKyBhdHRyKHgpICsgJylcJz7inI/vuI88L2J1dHRvbj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24gZGdyIiBvbmNsaWNrPSJkZWxCdWlsZGluZygnICsg',
  'anNxKHguaWQpICsgJykiPvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICAgJzwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nCiAgICAgIDogZW1wdHlCb3goJ+C4ouC4seC4h+C5hOC4oeC5iOC4',
  'oeC4teC4h+C4suC4meC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5g+C4mScgKyB5ZWFyTGFiZWwsICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtQnVpbGRpbmcobnVsbCkiPisg4LmA4Lie4Li04LmI4Lih4LiH4Liy4LiZ4LiL4LmI',
  '4Lit4Lih4LiV4Li24LiBPC9idXR0b24+JyksCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIHNtIiBvbmNsaWNrPSJmb3JtQnVpbGRpbmcobnVsbCkiPisg4LmA4Lie4Li04LmI4Lih4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiV4Li24LiBPC9idXR0b24+Jywg',
  'dHJ1ZSk7CgogICAgcmV0dXJuIGhlYWQgKyB6b25lcyArIGNoYXJ0cyArIGxpc3Q7CiAgfQp9OwoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDcpIOC4q+C5ieC4reC4h+C4nuC4seC4gQog',
  'ICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLnJvb21zID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7IHJldHVybiBjYWxsQXBpKCdyb29tLmxpc3QnKS50aGVuKGZ1bmN0aW9uKGZsb29y',
  'cyl7IHJldHVybiB7IGZsb29yczogZmxvb3JzLCB5ZWFyczogW10gfTsgfSk7IH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciBmbGF0ID0gW107CiAgICBkLmZsb29ycy5mb3JFYWNoKGZ1bmN0aW9uKGYpeyBmLnJvb21zLmZvckVhY2goZnVuY3Rpb24o',
  'cil7IGZsYXQucHVzaChyKTsgfSk7IH0pOwogICAgdmFyIG9jYyA9IGZsYXQuZmlsdGVyKGZ1bmN0aW9uKHIpeyByZXR1cm4gci5zdGF0dXMgPT09ICfguKHguLXguJzguLnguYnguYDguIrguYjguLInOyB9KS5sZW5ndGg7CgogICAgdmFyIGhlYWQgPSAnPGRpdiBj',
  'bGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAga3BpKCfguKvguYnguK3guIfguJfguLHguYnguIfguKvguKHguJQnLCBmbGF0Lmxlbmd0aCArICcg4Lir4LmJ4Lit4LiHJywgJzUg4LiK4Lix4LmJ4LiZJywgJ2FjY2VudCcpICsKICAgICAga3BpKCfguKHguLXg',
  'uJzguLnguYnguYDguIrguYjguLInLCBvY2MgKyAnIOC4q+C5ieC4reC4hycsIHBjdChmbGF0Lmxlbmd0aCA/IG9jYy9mbGF0Lmxlbmd0aCoxMDAgOiAwKSArICcg4Lit4Lix4LiV4Lij4Liy4LmA4LiC4LmJ4Liy4Lie4Lix4LiBJywgJ2dvb2QnKSArCiAgICAgIGtw',
  'aSgn4Lir4LmJ4Lit4LiH4Lin4LmI4Liy4LiHJywgZmxhdC5maWx0ZXIoZnVuY3Rpb24ocil7IHJldHVybiByLnN0YXR1cyA9PT0gJ+C4p+C5iOC4suC4hyc7IH0pLmxlbmd0aCArICcg4Lir4LmJ4Lit4LiHJywgJycsICd3YXJuJykgKwogICAgICBrcGkoJ+C4hOC5',
  'iOC4suC5gOC4iuC5iOC4suC4o+C4p+C4oS/guYDguJTguLfguK3guJknLCBiYWh0KGZsYXQucmVkdWNlKGZ1bmN0aW9uKGEscil7IHJldHVybiBhICsgKE51bWJlcihyLnJlbnQpfHwwKTsgfSwgMCkpLCAn4LiI4Liy4LiB4Lir4LmJ4Lit4LiH4LiX4Li14LmI4LiB',
  '4Lij4Lit4LiB4LiE4LmI4Liy4LmA4LiK4LmI4Liy4LmE4Lin4LmJJykgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIGdyaWQgPSBjYXJkKCfwn5qqIOC4nOC4seC4h+C4q+C5ieC4reC4h+C4nuC4seC4gScsIHJvb21GbG9vcnMoZmxhdCwgZnVuY3Rpb24ocil7CiAg',
  'ICAgIHZhciBjbHMgPSByLnN0YXR1cyA9PT0gJ+C4oeC4teC4nOC4ueC5ieC5gOC4iuC5iOC4sicgPyAncy1vaycgOiAoci5zdGF0dXMgPT09ICfguKfguYjguLLguIcnID8gJ3MtaW5mbycgOiAncy13YXJuJyk7CiAgICAgIHJldHVybiB7IGNsczogY2xzLCBzdWI6',
  'IGVzYyhyLnRlbmFudCB8fCByLnN0YXR1cyB8fCAnJykgKyAoci5yZW50ID8gJzxicj4nICsgbW9uZXkoci5yZW50KSArICcg4Li/JyA6ICcnKSwKICAgICAgICAgICAgICAgb25jbGljazogJ29wZW5Sb29tKCcgKyBqc3Eoci5yb29tKSArICcpJyB9OwogICAgfSks',
  'ICc8c3BhbiBjbGFzcz0iZnMxMiBtdXRlZCI+4LiE4Lil4Li04LiB4LiX4Li14LmI4Lir4LmJ4Lit4LiH4LmA4Lie4Li34LmI4Lit4LiU4Li54Lib4Lij4Liw4Lin4Lix4LiV4Li04LiX4Lix4LmJ4LiH4Lir4Lih4LiU4LiC4Lit4LiH4Lir4LmJ4Lit4LiH4LiZ4Lix',
  '4LmJ4LiZPC9zcGFuPicpOwoKICAgIHJldHVybiBoZWFkICsgZ3JpZDsKICB9Cn07CgpmdW5jdGlvbiBvcGVuUm9vbShyb29tKXsKICBvcGVuTW9kYWwoJ/Cfmqog4Lir4LmJ4Lit4LiHICcgKyByb29tLCAnPGRpdiBjbGFzcz0iZW1wdHkiPjxzcGFuIGNsYXNzPSJz',
  'cGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C5guC4q+C4peC4lOKApjwvZGl2PicpOwogIGNhbGxBcGkoJ3Jvb20ucHJvZmlsZScsIHsgcm9vbTogcm9vbSB9KS50aGVuKGZ1bmN0aW9uKHApewogICAgdmFyIGkgPSBwLmluZm87CiAgICB2YXIgYm9keSA9CiAg',
  'ICAgICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICAgIGtwaSgn4Liq4LiW4Liy4LiZ4LiwJywgaS5zdGF0dXMgfHwgJ+KAkycsIGVzYyhpLnRlbmFudCB8fCAnJykpICsKICAgICAgICBrcGkoJ+C4peC5ieC4suC4h+C5geC4reC4o+C5jCcsIHAu',
  'YWNDb3VudCArICcg4LiE4Lij4Lix4LmJ4LiHJywgcC5sYXN0QWMgPyAn4Lil4LmI4Liy4Liq4Li44LiUICcgKyB0aERhdGUocC5sYXN0QWMpIDogJ+C5hOC4oeC5iOC4oeC4teC4m+C4o+C4sOC4p+C4seC4leC4tCcpICsKICAgICAgICBrcGkoJ+C4h+C4suC4meC4',
  'i+C5iOC4reC4oScsIHAucmVwYWlyQ291bnQgKyAnIOC4h+C4suC4mScsICfguITguYnguLLguIcgJyArIHAub3BlblJlcGFpcnMsIHAub3BlblJlcGFpcnMgPyAnd2FybicgOiAnJykgKwogICAgICAgIGtwaSgn4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii',
  '4Liq4Liw4Liq4LihJywgYmFodChwLnRvdGFsQ29zdCksICfguIvguYjguK3guKEgKyDguKXguYnguLLguIfguYHguK3guKPguYwnKSArCiAgICAgICc8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBtYjEyIj4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFz',
  'cz0iYnRuIHNtIiBvbmNsaWNrPVwnY2xvc2VNb2RhbCgpO2Zvcm1Sb29tKCcgKyBhdHRyKGkpICsgJylcJz7inI/vuI8g4LmB4LiB4LmJ4LmE4LiC4LiC4LmJ4Lit4Lih4Li54Lil4Lir4LmJ4Lit4LiHPC9idXR0b24+JyArCiAgICAgICAgJzxidXR0b24gY2xhc3M9',
  'ImJ0biBzbSIgb25jbGljaz0iY2xvc2VNb2RhbCgpO2Zvcm1SZXBhaXIoe3Jvb206JyArIGpzcShyb29tKSArICd9KSI+KyDguYHguIjguYnguIfguIvguYjguK3guKE8L2J1dHRvbj4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJj',
  'bG9zZU1vZGFsKCk7Zm9ybUFjKHtyb29tOicgKyBqc3Eocm9vbSkgKyAnfSkiPisg4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMPC9idXR0b24+JyArCiAgICAgICc8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImNhcmQgbWIxMiI+PGRpdiBjbGFzcz0iY2FyZC1o',
  'Ij48aDM+4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZ4LmD4LiZ4Lir4LmJ4Lit4LiHPC9oMz4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPVwnY2xvc2VNb2RhbCgpO2Zvcm1Bc3NldCh7cm9vbTonICsganNxKHJvb20pICsgJ30p',
  'XCc+KyDguYDguJ7guLTguYjguKHguJfguKPguLHguJ7guKLguYzguKrguLTguJk8L2J1dHRvbj4nICsKICAgICAgJzwvZGl2PjxkaXYgY2xhc3M9ImNhcmQtYiI+JyArCiAgICAgICAgKHAuYXNzZXRzLmxlbmd0aAogICAgICAgICAgPyAnPGRpdiBjbGFzcz0idHci',
  'Pjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDphdXRvIj48dGhlYWQ+PHRyPicgKwogICAgICAgICAgICAnPHRoPuC4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4mTwvdGg+PHRoPuC4ouC4teC5iOC4q+C5ieC4rS/guKPguLjguYjguJk8L3RoPjx0aD7g',
  'uJXguLTguJTguJXguLHguYnguIc8L3RoPjx0aD7guJvguKPguLDguIHguLHguJnguJbguLbguIc8L3RoPjx0aD7guKrguJbguLLguJnguLA8L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgICAgIHAuYXNzZXRzLm1hcChmdW5jdGlv',
  'bihhKXsKICAgICAgICAgICAgICByZXR1cm4gJzx0cj48dGQ+PGI+JyArIGVzYyhhLm5hbWUpICsgJzwvYj4nICsKICAgICAgICAgICAgICAgICAgICAgICAoYS5zZXJpYWwgPyAnPGJyPjxzcGFuIGNsYXNzPSJmczEyIG11dGVkIj5TL04gJyArIGVzYyhhLnNlcmlh',
  'bCkgKyAnPC9zcGFuPicgOiAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyhhLmJyYW5kfHwn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyAr',
  'IHRoRGF0ZShhLmluc3RhbGxEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgKGEud2FycmFudHlFbmQgPyB0aERhdGUoYS53YXJyYW50eUVuZCkgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAg',
  'ICAgICAgICAgJzx0ZD4nICsgc3RhdHVzQmFkZ2UoYS5zdGF0dXMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICAgICAgICAgICc8dGQgY2xhc3M9InQtYWN0aW9ucyI+PGJ1dHRvbiBjbGFzcz0iYnRuIGljb24gc20iIHRpdGxlPSLguYHguIHguYnguYTguIIiICcg',
  'KwogICAgICAgICAgICAgICAgICAgICAgICdvbmNsaWNrPVwnY2xvc2VNb2RhbCgpO2Zvcm1Bc3NldCgnICsgYXR0cihhKSArICcpXCc+4pyP77iPPC9idXR0b24+PC90ZD48L3RyPic7CiAgICAgICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48',
  'L2Rpdj4nCiAgICAgICAgICA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4Lii4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJ4Lia4Lix4LiZ4LiX4Li24LiB4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZ4LiC4Lit4LiH4Lir4LmJ4Lit4LiH4LiZ4Li14LmJPC9kaXY+Jykg',
  'KwogICAgICAnPC9kaXY+PC9kaXY+JyArCiAgICAgICc8aDMgY2xhc3M9ImZzMTMgbWI4Ij7guJvguKPguLDguKfguLHguJXguLTguJfguLHguYnguIfguKvguKHguJQgKCcgKyBwLnRpbWVsaW5lLmxlbmd0aCArICcpPC9oMz4nICsKICAgICAgKHAudGltZWxpbmUu',
  'bGVuZ3RoID8gJzxkaXYgY2xhc3M9InRsIj4nICsgcC50aW1lbGluZS5tYXAoZnVuY3Rpb24oZSl7CiAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJ0bC1pIj48ZGl2IGNsYXNzPSJkIj4nICsgdGhEYXRlKGUuZGF0ZSkgKyAnIMK3ICcgKyBlc2MoZS50eXBlKSAr',
  'ICcgJyArIHN0YXR1c0JhZGdlKGUuc3RhdHVzKSArICc8L2Rpdj4nICsKICAgICAgICAgICc8ZGl2IGNsYXNzPSJ0Ij4nICsgZXNjKGUudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAgKGUudG9kbyAmJiBlLnRvZG8ubGVuZ3RoID8gdG9kb0xpc3RIdG1sKGUp',
  'IDogJycpICsKICAgICAgICAgIChlLmRldGFpbCA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIj4nICsgZXNjKGUuZGV0YWlsKSArICc8L2Rpdj4nIDogJycpICsKICAgICAgICAgIChlLmNvc3QgPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCI+JyArIGJhaHQoZS5j',
  'b3N0KSArICc8L2Rpdj4nIDogJycpICsKICAgICAgICAgIChlLnBob3RvcyAmJiBlLnBob3Rvcy5sZW5ndGggPyAnPGRpdiBjbGFzcz0ibXQ4Ij4nICsgdGh1bWJzSHRtbChlLnBob3RvcykgKyAnPC9kaXY+JyA6ICcnKSArCiAgICAgICAgJzwvZGl2Pic7CiAgICAg',
  'IH0pLmpvaW4oJycpICsgJzwvZGl2PicgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4m+C4o+C4sOC4p+C4seC4leC4tDwvZGl2PicpOwoKICAgIG9wZW5Nb2RhbCgn8J+aqiDguKvguYnguK3guIcgJyArIHJvb20gKyAnIMK3',
  'IOC4iuC4seC5ieC4mSAnICsgKGkuZmxvb3J8fCcnKSwgYm9keSwKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guJvguLTguJQ8L2J1dHRvbj4nLCB0cnVlKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5t',
  'ZXNzYWdlfHxlLCAnZXJyJyk7IGNsb3NlTW9kYWwoKTsgfSk7Cn0KCgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgOCkg4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4',
  'ouC4q+C4rSAo4Lij4Liy4Lii4LmA4LiU4Li34Lit4LiZKQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09CiAgIOC4geC4o+C4suC4nyDigJQg4Lin4Liy4LiU4LmA4Lib4LmH4LiZIFNWRyDguJXguKPguIcg4LmGIOC5hOC4oeC5iOC4nuC4tuC5iOC4h+C5hOC4peC4muC4o+C4suC4o+C4teC4guC5ieC4suC4h+C4meC4reC4gQogICDguYDguJ7g',
  'uKPguLLguLDguKvguJnguYnguLLguYDguKfguYfguJrguILguK3guIcgQXBwcyBTY3JpcHQg4LmC4Lir4Lil4LiU4Liq4LiE4Lij4Li04Lib4LiV4LmM4LiC4LmJ4Liy4Lih4LmC4LiU4LmA4Lih4LiZ4LmE4Lih4LmI4LmE4LiU4LmJCiAgIOC5geC4peC4sOC4q+C4',
  'meC5ieC4suC4leC4seC4p+C4reC4ouC5iOC4suC4h+C4leC5ieC4reC4h+C5gOC4m+C4tOC4lOC5hOC4lOC5ieC5guC4lOC4ouC5hOC4oeC5iOC4leC5ieC4reC4h+C4leC5iOC4reC5gOC4meC5h+C4lQoKICAg4Liq4Li14LiX4Li14LmI4LmD4LiK4LmJ4LmA4Lib',
  '4LmH4LiZ4LiZ4LmJ4Liz4LmA4LiH4Li04LiZL+C4quC5ieC4oSDguYTguKHguYjguYPguIrguYjguYDguILguLXguKLguKcv4LmB4LiU4LiHIOC5gOC4nuC4o+C4suC4sOC4p+C4seC4lOC5geC4peC5ieC4p+C5gOC4guC4teC4ouC4p+C4geC4seC4muC5geC4lOC4',
  'hwogICDguITguJnguJXguLLguJrguK3guJTguKrguLXguYDguILguLXguKLguKct4LmB4LiU4LiH4LmB4Lii4LiB4LmE4Lih4LmI4Lit4Lit4LiBICjOlEUgNC45IOC4leC5iOC4s+C4geC4p+C5iOC4suC5gOC4geC4k+C4keC5jCA2KSDguITguLnguYjguJnguLXg',
  'uYnguYTguJTguYkgMjcuNgogICDguJfguLjguIHguJXguLHguKfguYDguKXguILguJfguLXguYjguIHguKPguLLguJ/guYHguKrguJTguIcg4Lit4LmI4Liy4LiZ4LmE4LiU4LmJ4LiI4Liy4LiB4LiV4Liy4Lij4Liy4LiH4LiC4LmJ4Liy4LiH4Lil4LmI4Liy4LiH',
  '4LmA4Liq4Lih4LitCiAgIOC4geC4peC5iOC4reC4h+C4muC4reC4geC4hOC5iOC4suC4leC4reC4meC4iuC4teC5ieC5gOC4m+C5h+C4meC4guC4reC4h+C5geC4luC4oSDguYTguKHguYjguYPguIrguYjguJfguLLguIfguYDguJTguLXguKLguKfguJfguLXguYjg',
  'uIjguLDguKPguLnguYnguITguYjguLIKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgp2YXIgQ0hBUlRfVyA9IDcyMCwgQ0hBUlRfUEFETCA9IDYyLCBDSEFSVF9QQURSID0gMTQsIENIQVJU',
  'X1BBRFQgPSAxNDsKdmFyIENIQVJUX09OID0gbnVsbDsKCi8qKiDguJvguLHguJTguILguLbguYnguJnguYDguJvguYfguJnguYDguKXguILguIHguKXguKEg4LmGIOC4quC4s+C4q+C4o+C4seC4muC4q+C4seC4p+C5geC4geC4mSBZICovCmZ1bmN0aW9uIG5pY2VN',
  'YXgodil7CiAgaWYgKHYgPD0gMCkgcmV0dXJuIDE7CiAgdmFyIG1hZyA9IE1hdGgucG93KDEwLCBNYXRoLmZsb29yKE1hdGgubG9nKHYpIC8gTWF0aC5MTjEwKSk7CiAgdmFyIG4gPSB2IC8gbWFnOwogIHZhciBzdGVwID0gbiA8PSAxID8gMSA6IG4gPD0gMiA/IDIg',
  'OiBuIDw9IDIuNSA/IDIuNSA6IG4gPD0gNSA/IDUgOiAxMDsKICByZXR1cm4gc3RlcCAqIG1hZzsKfQoKLyoqIOC4ouC5iOC4reC4iOC4s+C4meC4p+C4meC5gOC4h+C4tOC4meC5g+C4q+C5ieC4quC4seC5ieC4meC4nuC4reC4quC4s+C4q+C4o+C4seC4muC4q+C4',
  'seC4p+C5geC4geC4mSDigJQgMS4yIOC4pS4gLyA4NUsgKi8KZnVuY3Rpb24gc2hvcnRCYWh0KHYpewogIHZhciBhID0gTWF0aC5hYnModik7CiAgaWYgKGEgPj0gMTAwMDAwMCkgcmV0dXJuICh2IC8gMTAwMDAwMCkudG9GaXhlZChhID49IDEwMDAwMDAwID8gMCA6',
  'IDEpLnJlcGxhY2UoL1wuMCQvLCAnJykgKyAnIOC4pS4nOwogIGlmIChhID49IDEwMDApIHJldHVybiBNYXRoLnJvdW5kKHYgLyAxMDAwKSArICdLJzsKICByZXR1cm4gU3RyaW5nKE1hdGgucm91bmQodikpOwp9CgovKiog4LmB4LiX4LmI4LiH4LiX4Li14LmI4Lib',
  '4Lil4Liy4Lii4LiU4LmJ4Liy4LiZ4LiC4LmJ4Lit4Lih4Li54Lil4Lih4LiZIDRweCDguJTguYnguLLguJnguJDguLLguJnguYDguKvguKXguLXguYjguKLguKEgKi8KZnVuY3Rpb24gYmFyUGF0aCh4LCB5LCB3LCBoLCB1cCl7CiAgdmFyIHIgPSBNYXRoLm1pbig0',
  'LCB3IC8gMiwgaCk7CiAgaWYgKGggPD0gMC41KSByZXR1cm4gJyc7CiAgcmV0dXJuIHVwCiAgICA/ICdNJyArIHggKyAnLCcgKyAoeSArIGgpICsgJ1YnICsgKHkgKyByKSArICdhJyArIHIgKyAnLCcgKyByICsgJyAwIDAgMSAnICsgciArICcsLScgKyByICsKICAg',
  'ICAgJ2gnICsgKHcgLSAyICogcikgKyAnYScgKyByICsgJywnICsgciArICcgMCAwIDEgJyArIHIgKyAnLCcgKyByICsgJ1YnICsgKHkgKyBoKSArICdaJwogICAgOiAnTScgKyB4ICsgJywnICsgeSArICdWJyArICh5ICsgaCAtIHIpICsgJ2EnICsgciArICcsJyAr',
  'IHIgKyAnIDAgMCAwICcgKyByICsgJywnICsgciArCiAgICAgICdoJyArICh3IC0gMiAqIHIpICsgJ2EnICsgciArICcsJyArIHIgKyAnIDAgMCAwICcgKyByICsgJywtJyArIHIgKyAnVicgKyB5ICsgJ1onOwp9CgovKiog4LiC4LmJ4Lit4Lih4Li54Lil4LiC4Lit',
  '4LiH4LiB4Lil4LmI4Lit4LiH4Lia4Lit4LiB4LiE4LmI4LiyIOC5gOC4geC5h+C4muC5gOC4m+C5h+C4mSBKU09OIOC5g+C4mSBhdHRyaWJ1dGUg4LmB4Lil4LmJ4LinIGVzYygpIOC5g+C4q+C5ieC4m+C4peC4reC4lOC4oOC4seC4oiAqLwpmdW5jdGlvbiB0aXBE',
  'YXRhKGxhYmVsLCByb3dzKXsKICByZXR1cm4gZXNjKEpTT04uc3RyaW5naWZ5KHsgbDogbGFiZWwsIHI6IHJvd3MgfSkpOwp9CgpmdW5jdGlvbiBoaXRSZWN0KHgsIHksIHcsIGgsIHRpcCl7CiAgcmV0dXJuICc8cmVjdCBjbGFzcz0iaGl0IiB0YWJpbmRleD0iMCIg',
  'cm9sZT0iYnV0dG9uIiB4PSInICsgeCArICciIHk9IicgKyB5ICsKICAgICAgICAgJyIgd2lkdGg9IicgKyB3ICsgJyIgaGVpZ2h0PSInICsgaCArICciIGRhdGEtdGlwPSInICsgdGlwICsgJyI+PC9yZWN0Pic7Cn0KCmZ1bmN0aW9uIGdyaWRBbmRUaWNrcyh0b3As',
  'IHBsb3RILCBtYXgsIGxpbmVzKXsKICB2YXIgb3V0ID0gJyc7CiAgZm9yICh2YXIgaSA9IDA7IGkgPD0gbGluZXM7IGkrKykgewogICAgdmFyIHkgPSB0b3AgKyBwbG90SCAtIChwbG90SCAqIGkgLyBsaW5lcyk7CiAgICBvdXQgKz0gJzxsaW5lIGNsYXNzPSJncmlk',
  'LWwiIHgxPSInICsgQ0hBUlRfUEFETCArICciIHkxPSInICsgeSArICciIHgyPSInICsgKENIQVJUX1cgLSBDSEFSVF9QQURSKSArICciIHkyPSInICsgeSArICciPjwvbGluZT4nICsKICAgICAgICAgICAnPHRleHQgY2xhc3M9InRpY2siIHg9IicgKyAoQ0hBUlRf',
  'UEFETCAtIDgpICsgJyIgeT0iJyArICh5ICsgNCkgKyAnIiB0ZXh0LWFuY2hvcj0iZW5kIj4nICsgc2hvcnRCYWh0KG1heCAqIGkgLyBsaW5lcykgKyAnPC90ZXh0Pic7CiAgfQogIHJldHVybiBvdXQ7Cn0KCmZ1bmN0aW9uIHN2Z1dyYXAoYm9keSwgaCwgdGl0bGUp',
  'ewogIHJldHVybiAnPGRpdiBjbGFzcz0iY2hhcnQtd3JhcCI+PHN2ZyBjbGFzcz0iY2hhcnQiIHZpZXdCb3g9IjAgMCAnICsgQ0hBUlRfVyArICcgJyArIGggKyAnIiAnICsKICAgICdyb2xlPSJpbWciIGFyaWEtbGFiZWw9IicgKyBlc2ModGl0bGUpICsgJyIgb25w',
  'b2ludGVybW92ZT0iY2hhcnRIb3ZlcihldmVudCkiIG9ucG9pbnRlcmxlYXZlPSJjaGFydE91dCgpIiAnICsKICAgICdvbmZvY3VzaW49ImNoYXJ0SG92ZXIoZXZlbnQpIiBvbmZvY3Vzb3V0PSJjaGFydE91dCgpIj4nICsgYm9keSArICc8L3N2Zz48L2Rpdj4nOwp9',
  'CgovKioKICog4LiB4Lij4Liy4Lif4LmB4LiX4LmI4LiH4LiE4Li54LmIIOC4o+C4suC4ouC4o+C4seC4miAvIOC4o+C4suC4ouC4iOC5iOC4suC4oiDguKPguLLguKLguYDguJTguLfguK3guJkKICog4LiV4Li04LiU4Lib4LmJ4Liy4Lii4LiV4Lix4Lin4LmA4Lil',
  '4LiC4LmA4LiJ4Lie4Liy4Liw4LmA4LiU4Li34Lit4LiZ4Liq4Li54LiH4Liq4Li44LiU4LiC4Lit4LiH4LmB4LiV4LmI4Lil4Liw4Lid4Lix4LmI4LiHIOC5hOC4oeC5iOC4leC4tOC4lOC4l+C4uOC4geC5geC4l+C5iOC4hwogKiDguYDguJ7guKPguLLguLDguJXg',
  'uLTguJTguITguKPguJrguJfguLjguIHguYHguJfguYjguIfguYHguKXguYnguKfguKPguIHguIjguJnguYTguKHguYjguKHguLXguYPguITguKPguK3guYjguLLguJkKICovCmZ1bmN0aW9uIGNoYXJ0SW5jb21lRXhwZW5zZShyb3dzKXsKICB2YXIgcGxvdEggPSAx',
  'OTAsIHRvcCA9IENIQVJUX1BBRFQsIEggPSB0b3AgKyBwbG90SCArIDMwOwogIHZhciBtYXggPSBuaWNlTWF4KE1hdGgubWF4LmFwcGx5KG51bGwsIHJvd3MubWFwKGZ1bmN0aW9uKG0peyByZXR1cm4gTWF0aC5tYXgobS5pbmNvbWUsIG0uZXhwZW5zZSk7IH0pKSB8',
  'fCAxKTsKICB2YXIgYmFuZCA9IChDSEFSVF9XIC0gQ0hBUlRfUEFETCAtIENIQVJUX1BBRFIpIC8gcm93cy5sZW5ndGg7CiAgdmFyIGJ3ID0gTWF0aC5taW4oMjQsIChiYW5kIC0gMTApIC8gMik7CgogIHZhciBtYXhJbiA9IHJvd3MucmVkdWNlKGZ1bmN0aW9uKGEs',
  'IGIpeyByZXR1cm4gYi5pbmNvbWUgPiBhLmluY29tZSA/IGIgOiBhOyB9LCByb3dzWzBdKTsKICB2YXIgbWF4RXggPSByb3dzLnJlZHVjZShmdW5jdGlvbihhLCBiKXsgcmV0dXJuIGIuZXhwZW5zZSA+IGEuZXhwZW5zZSA/IGIgOiBhOyB9LCByb3dzWzBdKTsKCiAg',
  'dmFyIGJvZHkgPSBncmlkQW5kVGlja3ModG9wLCBwbG90SCwgbWF4LCA0KTsKICByb3dzLmZvckVhY2goZnVuY3Rpb24obSwgaSl7CiAgICB2YXIgY3ggPSBDSEFSVF9QQURMICsgYmFuZCAqIGkgKyBiYW5kIC8gMjsKICAgIC8vIOC5gOC4p+C5ieC4meC4iuC5iOC4',
  'reC4h+C4p+C5iOC4suC4h+C4quC4teC4nuC4t+C5ieC4mSAycHgg4Lij4Liw4Lir4Lin4LmI4Liy4LiH4LmB4LiX4LmI4LiH4LiE4Li54LmIIOC5hOC4oeC5iOC5g+C4iuC5ieC5gOC4quC5ieC4meC4guC4reC4muC4oeC4suC4hOC4seC5iOC4mQogICAgdmFyIHgx',
  'ID0gY3ggLSBidyAtIDEsIHgyID0gY3ggKyAxOwogICAgdmFyIGgxID0gcGxvdEggKiAobS5pbmNvbWUgLyBtYXgpLCBoMiA9IHBsb3RIICogKG0uZXhwZW5zZSAvIG1heCk7CiAgICBib2R5ICs9ICc8Zz4nICsKICAgICAgJzxyZWN0IGNsYXNzPSJiYW5kIiB4PSIn',
  'ICsgKGN4IC0gYmFuZCAvIDIpICsgJyIgeT0iJyArIHRvcCArICciIHdpZHRoPSInICsgYmFuZCArICciIGhlaWdodD0iJyArIHBsb3RIICsgJyIgcng9IjYiPjwvcmVjdD4nICsKICAgICAgJzxwYXRoIGNsYXNzPSJjMSIgZD0iJyArIGJhclBhdGgoeDEsIHRvcCAr',
  'IHBsb3RIIC0gaDEsIGJ3LCBoMSwgdHJ1ZSkgKyAnIj48L3BhdGg+JyArCiAgICAgICc8cGF0aCBjbGFzcz0iYzIiIGQ9IicgKyBiYXJQYXRoKHgyLCB0b3AgKyBwbG90SCAtIGgyLCBidywgaDIsIHRydWUpICsgJyI+PC9wYXRoPic7CiAgICBpZiAobSA9PT0gbWF4',
  'SW4gJiYgbS5pbmNvbWUpIHsKICAgICAgYm9keSArPSAnPHRleHQgY2xhc3M9ImRsYWIiIHg9IicgKyAoeDEgKyBidyAvIDIpICsgJyIgeT0iJyArICh0b3AgKyBwbG90SCAtIGgxIC0gNikgKyAnIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj4nICsgc2hvcnRCYWh0KG0u',
  'aW5jb21lKSArICc8L3RleHQ+JzsKICAgIH0KICAgIGlmIChtID09PSBtYXhFeCAmJiBtLmV4cGVuc2UpIHsKICAgICAgYm9keSArPSAnPHRleHQgY2xhc3M9ImRsYWIiIHg9IicgKyAoeDIgKyBidyAvIDIpICsgJyIgeT0iJyArICh0b3AgKyBwbG90SCAtIGgyIC0g',
  'NikgKyAnIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj4nICsgc2hvcnRCYWh0KG0uZXhwZW5zZSkgKyAnPC90ZXh0Pic7CiAgICB9CiAgICBib2R5ICs9ICc8dGV4dCBjbGFzcz0ieGxhYiIgeD0iJyArIGN4ICsgJyIgeT0iJyArICh0b3AgKyBwbG90SCArIDE4KSArICci',
  'IHRleHQtYW5jaG9yPSJtaWRkbGUiPicgKyBlc2MobS5sYWJlbCkgKyAnPC90ZXh0PicgKwogICAgICBoaXRSZWN0KGN4IC0gYmFuZCAvIDIsIHRvcCwgYmFuZCwgcGxvdEgsCiAgICAgICAgdGlwRGF0YShtLmxhYmVsLCBbWyfguKPguLLguKLguKPguLHguJonLCBt',
  'b25leShtLmluY29tZSksIDFdLCBbJ+C4o+C4suC4ouC4iOC5iOC4suC4oicsIG1vbmV5KG0uZXhwZW5zZSksIDJdXSkpICsKICAgICAgJzwvZz4nOwogIH0pOwoKICBib2R5ICs9ICc8bGluZSBjbGFzcz0iYXhpcy1sIiB4MT0iJyArIENIQVJUX1BBREwgKyAnIiB5',
  'MT0iJyArICh0b3AgKyBwbG90SCkgKyAnIiB4Mj0iJyArIChDSEFSVF9XIC0gQ0hBUlRfUEFEUikgKyAnIiB5Mj0iJyArICh0b3AgKyBwbG90SCkgKyAnIj48L2xpbmU+JzsKICByZXR1cm4gc3ZnV3JhcChib2R5LCBILCAn4LiB4Lij4Liy4Lif4LmB4LiX4LmI4LiH',
  '4LmA4Lib4Lij4Li14Lii4Lia4LmA4LiX4Li14Lii4Lia4Lij4Liy4Lii4Lij4Lix4Lia4LiB4Lix4Lia4Lij4Liy4Lii4LiI4LmI4Liy4Lii4LiC4Lit4LiH4LmB4LiV4LmI4Lil4Liw4LmA4LiU4Li34Lit4LiZJyk7Cn0KCi8qKgogKiDguIHguLPguYTguKMv4LiC',
  '4Liy4LiU4LiX4Li44LiZ4Liq4Li44LiX4LiY4Li04Lij4Liy4Lii4LmA4LiU4Li34Lit4LiZIOKAlCDguYHguJfguYjguIfguILguLbguYnguJnguIjguLLguIHguYDguKrguYnguJnguKjguLnguJnguKLguYzguITguLfguK3guIHguLPguYTguKMg4Lil4LiH4LiE',
  '4Li34Lit4LiC4Liy4LiU4LiX4Li44LiZCiAqIOC4leC4s+C5geC4q+C4meC5iOC4h+C5gOC4q+C4meC4t+C4rS/guYPguJXguYnguYDguKrguYnguJnguYDguJvguYfguJnguJXguLHguKfguJrguK3guIHguKvguKXguLHguIEg4Liq4Li14LmA4Lib4LmH4LiZ4LiV',
  '4Lix4Lin4Lii4LmJ4Liz4Lit4Li14LiB4LiK4Lix4LmJ4LiZ4Lir4LiZ4Li24LmI4LiHCiAqLwpmdW5jdGlvbiBjaGFydE5ldChyb3dzKXsKICB2YXIgcGxvdEggPSAxNzAsIHRvcCA9IENIQVJUX1BBRFQsIEggPSB0b3AgKyBwbG90SCArIDMwOwogIHZhciBtYXgg',
  'PSBuaWNlTWF4KE1hdGgubWF4LmFwcGx5KG51bGwsIHJvd3MubWFwKGZ1bmN0aW9uKG0peyByZXR1cm4gTWF0aC5hYnMobS5uZXQpOyB9KSkgfHwgMSk7CiAgdmFyIGJhbmQgPSAoQ0hBUlRfVyAtIENIQVJUX1BBREwgLSBDSEFSVF9QQURSKSAvIHJvd3MubGVuZ3Ro',
  'OwogIHZhciBidyA9IE1hdGgubWluKDI0LCBiYW5kIC0gMTIpOwogIHZhciB6ZXJvID0gdG9wICsgcGxvdEggLyAyLCBoYWxmID0gcGxvdEggLyAyOwoKICB2YXIgYmVzdCA9IHJvd3MucmVkdWNlKGZ1bmN0aW9uKGEsIGIpeyByZXR1cm4gYi5uZXQgPiBhLm5ldCA/',
  'IGIgOiBhOyB9LCByb3dzWzBdKTsKICB2YXIgd29yc3QgPSByb3dzLnJlZHVjZShmdW5jdGlvbihhLCBiKXsgcmV0dXJuIGIubmV0IDwgYS5uZXQgPyBiIDogYTsgfSwgcm93c1swXSk7CgogIHZhciBib2R5ID0gJyc7CiAgWzEsIDAuNSwgMCwgLTAuNSwgLTFdLmZv',
  'ckVhY2goZnVuY3Rpb24oZil7CiAgICB2YXIgeSA9IHplcm8gLSBoYWxmICogZjsKICAgIGJvZHkgKz0gJzxsaW5lIGNsYXNzPSJncmlkLWwiIHgxPSInICsgQ0hBUlRfUEFETCArICciIHkxPSInICsgeSArICciIHgyPSInICsgKENIQVJUX1cgLSBDSEFSVF9QQURS',
  'KSArICciIHkyPSInICsgeSArICciPjwvbGluZT4nICsKICAgICAgICAgICAgJzx0ZXh0IGNsYXNzPSJ0aWNrIiB4PSInICsgKENIQVJUX1BBREwgLSA4KSArICciIHk9IicgKyAoeSArIDQpICsgJyIgdGV4dC1hbmNob3I9ImVuZCI+JyArIHNob3J0QmFodChtYXgg',
  'KiBmKSArICc8L3RleHQ+JzsKICB9KTsKCiAgcm93cy5mb3JFYWNoKGZ1bmN0aW9uKG0sIGkpewogICAgdmFyIGN4ID0gQ0hBUlRfUEFETCArIGJhbmQgKiBpICsgYmFuZCAvIDI7CiAgICB2YXIgaCA9IGhhbGYgKiAoTWF0aC5hYnMobS5uZXQpIC8gbWF4KTsKICAg',
  'IHZhciB1cCA9IG0ubmV0ID49IDA7CiAgICBib2R5ICs9ICc8Zz4nICsKICAgICAgJzxyZWN0IGNsYXNzPSJiYW5kIiB4PSInICsgKGN4IC0gYmFuZCAvIDIpICsgJyIgeT0iJyArIHRvcCArICciIHdpZHRoPSInICsgYmFuZCArICciIGhlaWdodD0iJyArIHBsb3RI',
  'ICsgJyIgcng9IjYiPjwvcmVjdD4nICsKICAgICAgJzxwYXRoIGNsYXNzPSInICsgKHVwID8gJ2MxJyA6ICdjMicpICsgJyIgZD0iJyArIGJhclBhdGgoY3ggLSBidyAvIDIsIHVwID8gemVybyAtIGggOiB6ZXJvLCBidywgaCwgdXApICsgJyI+PC9wYXRoPic7CiAg',
  'ICBpZiAoKG0gPT09IGJlc3QgJiYgbS5uZXQgPiAwKSB8fCAobSA9PT0gd29yc3QgJiYgbS5uZXQgPCAwKSkgewogICAgICBib2R5ICs9ICc8dGV4dCBjbGFzcz0iZGxhYiIgeD0iJyArIGN4ICsgJyIgeT0iJyArICh1cCA/IHplcm8gLSBoIC0gNiA6IHplcm8gKyBo',
  'ICsgMTQpICsgJyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+JyArIHNob3J0QmFodChtLm5ldCkgKyAnPC90ZXh0Pic7CiAgICB9CiAgICBib2R5ICs9ICc8dGV4dCBjbGFzcz0ieGxhYiIgeD0iJyArIGN4ICsgJyIgeT0iJyArICh0b3AgKyBwbG90SCArIDE4KSArICci',
  'IHRleHQtYW5jaG9yPSJtaWRkbGUiPicgKyBlc2MobS5sYWJlbCkgKyAnPC90ZXh0PicgKwogICAgICBoaXRSZWN0KGN4IC0gYmFuZCAvIDIsIHRvcCwgYmFuZCwgcGxvdEgsCiAgICAgICAgdGlwRGF0YShtLmxhYmVsLCBbW3VwID8gJ+C4geC4s+C5hOC4oycgOiAn',
  '4LiC4Liy4LiU4LiX4Li44LiZJywgbW9uZXkobS5uZXQpLCB1cCA/IDEgOiAyXV0pKSArCiAgICAgICc8L2c+JzsKICB9KTsKCiAgYm9keSArPSAnPGxpbmUgY2xhc3M9ImF4aXMtbCIgeDE9IicgKyBDSEFSVF9QQURMICsgJyIgeTE9IicgKyB6ZXJvICsgJyIgeDI9',
  'IicgKyAoQ0hBUlRfVyAtIENIQVJUX1BBRFIpICsgJyIgeTI9IicgKyB6ZXJvICsgJyI+PC9saW5lPic7CiAgcmV0dXJuIHN2Z1dyYXAoYm9keSwgSCwgJ+C4geC4o+C4suC4n+C4geC4s+C5hOC4o+C4guC4suC4lOC4l+C4uOC4meC4quC4uOC4l+C4mOC4tOC4o+C4',
  'suC4ouC5gOC4lOC4t+C4reC4mSDguYHguJfguYjguIfguYDguKvguJnguLfguK3guYDguKrguYnguJnguITguLfguK3guIHguLPguYTguKMg4LmD4LiV4LmJ4LmA4Liq4LmJ4LiZ4LiE4Li34Lit4LiC4Liy4LiU4LiX4Li44LiZJyk7Cn0KCmZ1bmN0aW9uIGNoYXJ0',
  'VGlwQm94KCl7CiAgdmFyIGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaGFydFRpcCcpOwogIGlmICghYm94KSB7CiAgICBib3ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICAgIGJveC5pZCA9ICdjaGFydFRpcCc7CiAgICBib3guY2xh',
  'c3NOYW1lID0gJ2N0aXAnOwogICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChib3gpOwogIH0KICByZXR1cm4gYm94Owp9CgpmdW5jdGlvbiBjaGFydEhvdmVyKGV2KXsKICB2YXIgaGl0ID0gZXYudGFyZ2V0ICYmIGV2LnRhcmdldC5jbG9zZXN0ID8gZXYudGFy',
  'Z2V0LmNsb3Nlc3QoJy5oaXQnKSA6IG51bGw7CiAgaWYgKCFoaXQpIHsgY2hhcnRPdXQoKTsgcmV0dXJuOyB9CgogIHZhciBnID0gaGl0LnBhcmVudE5vZGU7CiAgaWYgKENIQVJUX09OICYmIENIQVJUX09OICE9PSBnKSBDSEFSVF9PTi5jbGFzc0xpc3QucmVtb3Zl',
  'KCdvbicpOwogIGcuY2xhc3NMaXN0LmFkZCgnb24nKTsKICBDSEFSVF9PTiA9IGc7CgogIHZhciBkYXRhOwogIHRyeSB7IGRhdGEgPSBKU09OLnBhcnNlKGhpdC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdGlwJykgfHwgJ3t9Jyk7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuOyB9',
  'CgogIC8vIOC4m+C4o+C4sOC4geC4reC4muC4lOC5ieC4p+C4oiB0ZXh0Q29udGVudCDguYTguKHguYjguYPguIrguYggaW5uZXJIVE1MIOKAlCDguIrguLfguYjguK3guKPguLLguKLguIHguLLguKPguKHguLLguIjguLLguIHguILguYnguK3guKHguLnguKUg4LmE',
  '4Lih4LmI4LiE4Lin4Lij4LiW4Li34Lit4Lin4LmI4Liy4Lib4Lil4Lit4LiU4Lig4Lix4LiiCiAgdmFyIGJveCA9IGNoYXJ0VGlwQm94KCk7CiAgYm94LmlubmVySFRNTCA9ICcnOwogIHZhciBoZWFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAg',
  'aGVhZC5jbGFzc05hbWUgPSAnbSc7CiAgaGVhZC50ZXh0Q29udGVudCA9IGRhdGEubCB8fCAnJzsKICBib3guYXBwZW5kQ2hpbGQoaGVhZCk7CgogIChkYXRhLnIgfHwgW10pLmZvckVhY2goZnVuY3Rpb24ocm93KXsKICAgIHZhciBsaW5lID0gZG9jdW1lbnQuY3Jl',
  'YXRlRWxlbWVudCgnZGl2Jyk7CiAgICBsaW5lLmNsYXNzTmFtZSA9ICdyJzsKICAgIHZhciBrZXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpJyk7CiAgICBrZXkuc3R5bGUuYmFja2dyb3VuZCA9ICd2YXIoLS1jJyArIChyb3dbMl0gfHwgMSkgKyAnKSc7CiAg',
  'ICB2YXIgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTsKICAgIG5hbWUudGV4dENvbnRlbnQgPSByb3dbMF07CiAgICB2YXIgdmFsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYicpOwogICAgdmFsLnRleHRDb250ZW50ID0gcm93WzFdOwog',
  'ICAgbGluZS5hcHBlbmRDaGlsZChrZXkpOyBsaW5lLmFwcGVuZENoaWxkKG5hbWUpOyBsaW5lLmFwcGVuZENoaWxkKHZhbCk7CiAgICBib3guYXBwZW5kQ2hpbGQobGluZSk7CiAgfSk7CgogIC8vIOC5gOC4geC4suC4sOC4leC4s+C5geC4q+C4meC5iOC4h+C5gOC4',
  'oeC4suC4quC5jCDguYTguKHguYjguYPguIrguYjguILguK3guJrguJrguJnguILguK3guIfguIrguYjguK3guIfguKPguLHguJrguIHguLLguKPguIrguLXguYkgKOC4iuC5iOC4reC4h+C4meC4seC5ieC4meC4quC4ueC4h+C5gOC4l+C5iOC4suC4geC4o+C4suC4',
  'n+C4l+C4seC5ieC4h+C4reC4seC4mQogIC8vIOC4p+C4suC4h+C5hOC4p+C5ieC4guC5ieC4suC4h+C4muC4meC4l+C4teC5hOC4o+C4geC5h+C5hOC4m+C4muC4seC4h+C4q+C4seC4p+C4guC5ieC4reC4geC4suC4o+C5jOC4lOC4l+C4uOC4geC4l+C4tSkg4LiW',
  '4LmJ4Liy4LmA4Lil4Li34LmI4Lit4LiZ4LiU4LmJ4Lin4Lii4LmB4Lib4LmJ4LiZ4Lie4Li04Lih4Lie4LmM4LiB4LmH4LmD4LiK4LmJ4LiV4Lix4Lin4LmB4LiX4LmI4LiH4LmB4LiX4LiZCiAgdmFyIHIgPSBoaXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7CiAg',
  'dmFyIHB4ID0gKGV2LmNsaWVudFggfHwgZXYuY2xpZW50WCA9PT0gMCkgPyBldi5jbGllbnRYIDogci5sZWZ0ICsgci53aWR0aCAvIDI7CiAgdmFyIHB5ID0gKGV2LmNsaWVudFkgfHwgZXYuY2xpZW50WSA9PT0gMCkgPyBldi5jbGllbnRZIDogci50b3AgKyByLmhl',
  'aWdodCAvIDI7CiAgYm94LmNsYXNzTGlzdC5hZGQoJ29uJyk7CiAgdmFyIGxlZnQgPSBNYXRoLm1pbihNYXRoLm1heCg4LCBweCAtIGJveC5vZmZzZXRXaWR0aCAvIDIpLCB3aW5kb3cuaW5uZXJXaWR0aCAtIGJveC5vZmZzZXRXaWR0aCAtIDgpOwogIHZhciBhYm92',
  'ZSA9IHB5IC0gYm94Lm9mZnNldEhlaWdodCAtIDE0OwogIGJveC5zdHlsZS5sZWZ0ID0gbGVmdCArICdweCc7CiAgYm94LnN0eWxlLnRvcCA9IChhYm92ZSA8IDggPyBweSArIDE4IDogYWJvdmUpICsgJ3B4JzsKfQoKZnVuY3Rpb24gY2hhcnRPdXQoKXsKICBpZiAo',
  'Q0hBUlRfT04pIHsgQ0hBUlRfT04uY2xhc3NMaXN0LnJlbW92ZSgnb24nKTsgQ0hBUlRfT04gPSBudWxsOyB9CiAgdmFyIGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaGFydFRpcCcpOwogIGlmIChib3gpIGJveC5jbGFzc0xpc3QucmVtb3ZlKCdvbicp',
  'Owp9CgpmdW5jdGlvbiBjaGFydExlZ2VuZChhLCBiKXsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImxlZ2VuZCI+JyArCiAgICAnPHNwYW4gY2xhc3M9ImsiPjxzcGFuIGNsYXNzPSJzdyIgc3R5bGU9ImJhY2tncm91bmQ6dmFyKC0tYzEpIj48L3NwYW4+JyArIGVzYyhh',
  'KSArICc8L3NwYW4+JyArCiAgICAnPHNwYW4gY2xhc3M9ImsiPjxzcGFuIGNsYXNzPSJzdyIgc3R5bGU9ImJhY2tncm91bmQ6dmFyKC0tYzIpIj48L3NwYW4+JyArIGVzYyhiKSArICc8L3NwYW4+JyArCiAgICAnPC9kaXY+JzsKfQoKUk9VVEVTLmZpbmFuY2UgPSB7',
  'CiAgbG9hZDogZnVuY3Rpb24oKXsKICAgIHJldHVybiBQcm9taXNlLmFsbChbCiAgICAgIGNhbGxBcGkoJ2ZpbmFuY2Uuc3VtbWFyeScsIHsgeWVhcjogUy55ZWFyIH0pLAogICAgICBjYWxsQXBpKCdmaW5hbmNlLmxpc3QnLCB7IHllYXI6IFMueWVhciwga2luZDog',
  'Uy5wYXJhbXMua2luZCB8fCAnJyB9KQogICAgXSkudGhlbihmdW5jdGlvbihyKXsgdmFyIGQgPSByWzBdOyBkLml0ZW1zID0gclsxXTsgcmV0dXJuIGQ7IH0pOwogIH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09',
  'ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICBrcGkoJ+C4o+C4suC4ouC4o+C4seC4miAnICsgeWVhckxhYmVsLCBiYWh0KGQuaW5j',
  'b21lKSwgJ+C5gOC4ieC4peC4teC5iOC4oiAnICsgYmFodChkLmF2Z0luY29tZSkgKyAnL+C5gOC4lOC4t+C4reC4mScsICdnb29kJykgKwogICAgICBrcGkoJ+C4o+C4suC4ouC4iOC5iOC4suC4oiAnICsgeWVhckxhYmVsLCBiYWh0KGQuZXhwZW5zZSksICfguYDg',
  'uInguKXguLXguYjguKIgJyArIGJhaHQoZC5hdmdFeHBlbnNlKSArICcv4LmA4LiU4Li34Lit4LiZJywgJ2JhZCcpICsKICAgICAga3BpKCfguITguIfguYDguKvguKXguLfguK3guKrguLjguJfguJjguLQnLCBiYWh0KGQubmV0KSwgJ+C4reC4seC4leC4o+C4suC4',
  'geC4s+C5hOC4oyAnICsgcGN0KGQubWFyZ2luKSwgJ2FjY2VudCAnICsgKGQubmV0ID49IDAgPyAnZ29vZCcgOiAnYmFkJykpICsKICAgICAga3BpKCfguJrguLHguJnguJfguLbguIHguYHguKXguYnguKcnLCBkLm1vbnRoc1dpdGhEYXRhICsgJyDguYDguJTguLfg',
  'uK3guJknLCBkLmNvdW50ICsgJyDguKPguLLguKLguIHguLLguKMnKSArCiAgICAnPC9kaXY+JzsKCiAgICAvLyDguIHguKPguLLguJ/guIHguYjguK3guJkg4LmB4Lil4LmJ4Lin4LiE4LmI4Lit4Lii4LiV4Liy4Lij4Liy4LiHIOKAlCDguJXguLLguKPguLLguIfg',
  'uILguYnguLLguIfguKXguYjguLLguIfguITguLfguK3guJfguLXguYjguK3guYjguLLguJnguITguYjguLLguIjguKPguLTguIfguYTguJTguYnguJfguLjguIHguJXguLHguKcKICAgIC8vIOC4geC4o+C4suC4n+C4iuC5iOC4p+C4ouC5g+C4q+C5ieC5gOC4q+C5',
  'h+C4meC5geC4meC4p+C5guC4meC5ieC4oSDguYTguKHguYjguYTguJTguYnguKHguLLguYHguJfguJnguJXguLHguKfguYDguKXguIIKICAgIHZhciBoYXNEYXRhID0gZC5ieU1vbnRoLnNvbWUoZnVuY3Rpb24obSl7IHJldHVybiBtLmluY29tZSB8fCBtLmV4cGVu',
  'c2U7IH0pOwogICAgdmFyIGNoYXJ0cyA9ICFoYXNEYXRhID8gJycgOgogICAgICBjYXJkKCfwn5OIIOC4o+C4suC4ouC4o+C4seC4miAvIOC4o+C4suC4ouC4iOC5iOC4suC4oiDguKPguLLguKLguYDguJTguLfguK3guJkgwrcgJyArIHllYXJMYWJlbCwKICAgICAg',
  'ICBjaGFydExlZ2VuZCgn4Lij4Liy4Lii4Lij4Lix4LiaJywgJ+C4o+C4suC4ouC4iOC5iOC4suC4oicpICsgY2hhcnRJbmNvbWVFeHBlbnNlKGQuYnlNb250aCkpICsKICAgICAgY2FyZCgn4pqW77iPIOC4geC4s+C5hOC4oyAvIOC4guC4suC4lOC4l+C4uOC4meC4',
  'quC4uOC4l+C4mOC4tCDguKPguLLguKLguYDguJTguLfguK3guJkgwrcgJyArIHllYXJMYWJlbCwKICAgICAgICAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtYjgiPuC5geC4l+C5iOC4h+C5gOC4q+C4meC4t+C4reC5gOC4quC5ieC4meC4qOC4ueC4meC4ouC5jOC4',
  'hOC4t+C4reC5gOC4lOC4t+C4reC4meC4l+C4teC5iOC4geC4s+C5hOC4oyDguYPguJXguYnguYDguKrguYnguJnguITguLfguK3guYDguJTguLfguK3guJnguJfguLXguYjguILguLLguJTguJfguLjguJk8L2Rpdj4nICsKICAgICAgICBjaGFydE5ldChkLmJ5TW9u',
  'dGgpKTsKCiAgICB2YXIgbWF4QmFyID0gTWF0aC5tYXguYXBwbHkobnVsbCwgZC5ieU1vbnRoLm1hcChmdW5jdGlvbihtKXsgcmV0dXJuIE1hdGgubWF4KG0uaW5jb21lLCBtLmV4cGVuc2UpOyB9KSkgfHwgMTsKICAgIHZhciBtb250aGx5ID0gY2FyZCgn8J+ThSDg',
  'uKPguLLguKLguYDguJTguLfguK3guJkgwrcgJyArIHllYXJMYWJlbCwKICAgICAgJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICc8dGg+4LmA4LiU4Li34Lit4LiZPC90aD48dGggY2xhc3M9Im51bSI+4Lij4Liy',
  '4Lii4Lij4Lix4LiaPC90aD48dGggY2xhc3M9Im51bSI+4Lij4Liy4Lii4LiI4LmI4Liy4LiiPC90aD48dGggY2xhc3M9Im51bSI+4LiE4LiH4LmA4Lir4Lil4Li34LitPC90aD4nICsKICAgICAgJzx0aCBzdHlsZT0id2lkdGg6MzglIj7guYDguJfguLXguKLguJrg',
  'uKPguLLguKLguKPguLHguJogLyDguKPguLLguKLguIjguYjguLLguKI8L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgIGQuYnlNb250aC5tYXAoZnVuY3Rpb24obSl7CiAgICAgICAgdmFyIGJsYW5rID0gIW0uaW5jb21lICYmICFtLmV4cGVuc2U7CiAg',
  'ICAgICAgcmV0dXJuICc8dHInICsgKGJsYW5rID8gJyBzdHlsZT0ib3BhY2l0eTouNDUiJyA6ICcnKSArICc+JyArCiAgICAgICAgICAnPHRkPjxiPicgKyBtLmxhYmVsICsgJzwvYj48L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKG0uaW5j',
  'b21lID8gbW9uZXkobS5pbmNvbWUpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAobS5leHBlbnNlID8gbW9uZXkobS5leHBlbnNlKSA6ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibnVt',
  'Ij48YiBzdHlsZT0iY29sb3I6JyArIChtLm5ldCA+PSAwID8gJ3ZhcigtLW9rKScgOiAndmFyKC0tZGFuZ2VyKScpICsgJyI+JyArCiAgICAgICAgICAgIChibGFuayA/ICfigJMnIDogbW9uZXkobS5uZXQpKSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICc8dGQ+',
  'JyArCiAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJiYXItdHJhY2sgbWI4Ij48ZGl2IGNsYXNzPSJiYXItZmlsbCIgc3R5bGU9IndpZHRoOicgKyAobS5pbmNvbWUvbWF4QmFyKjEwMCkgKyAnJTtiYWNrZ3JvdW5kOnZhcigtLWMxKSI+PC9kaXY+PC9kaXY+JyArCiAg',
  'ICAgICAgICAgICc8ZGl2IGNsYXNzPSJiYXItdHJhY2siPjxkaXYgY2xhc3M9ImJhci1maWxsIiBzdHlsZT0id2lkdGg6JyArIChtLmV4cGVuc2UvbWF4QmFyKjEwMCkgKyAnJTtiYWNrZ3JvdW5kOnZhcigtLWMyKSI+PC9kaXY+PC9kaXY+JyArCiAgICAgICAgICAn',
  'PC90ZD48L3RyPic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nLCAnJywgdHJ1ZSk7CgogICAgdmFyIGJ5S2luZCA9IGNhcmQoJ/Cfp74g4LmB4Lii4LiB4LiV4Liy4Lih4Lij4Liy4Lii4LiB4Liy4LijIMK3ICcgKyB5ZWFyTGFi',
  'ZWwsCiAgICAgIGJhckNoYXJ0KGQuYnlLaW5kLm1hcChmdW5jdGlvbihrKXsgcmV0dXJuIHsgbGFiZWw6IGsua2luZCArICcgKCcgKyBrLmNvdW50ICsgJyknLCB0b3RhbDogay50b3RhbCB9OyB9KSwKICAgICAgICAgICAgICAgJ2xhYmVsJywgJ3RvdGFsJywgZnVu',
  'Y3Rpb24oaSl7IHJldHVybiBtb25leShpLnRvdGFsKSArICcg4Li/JzsgfSkpOwoKICAgIHZhciBieVllYXIgPSBjYXJkKCfwn5OKIOC5gOC4l+C4teC4ouC4muC4o+C4suC4ouC4m+C4tScsCiAgICAgIGQuYnlZZWFyLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0dyI+',
  'PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOmF1dG8iPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guJvguLU8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKPguLLguKLguKPguLHguJo8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKPguLLguKLguIjguYjg',
  'uLLguKI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguIfguYDguKvguKXguLfguK08L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgZC5ieVllYXIubWFwKGZ1bmN0aW9uKHkpewogICAgICAgICAgcmV0dXJuICc8dHIgb25jbGljaz0ic2V0WWVhckZy',
  'b21UYWJsZSgnICsgeS55ZWFyICsgJykiIHN0eWxlPSJjdXJzb3I6cG9pbnRlciI+JyArCiAgICAgICAgICAgICc8dGQ+PGI+JyArIGRpc3BsYXlZZWFyKHkueWVhcikgKyAnPC9iPicgKwogICAgICAgICAgKHVzZUJ1ZGRoaXN0WWVhcigpID8gJyA8c3BhbiBjbGFz',
  'cz0iZmFpbnQgZnMxMiI+LyAnICsgeS55ZWFyICsgJzwvc3Bhbj4nIDogJycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIG1vbmV5KHkuaW5jb21lKSArICc8L3RkPjx0ZCBjbGFzcz0ibnVtIj4nICsgbW9uZXkoeS5leHBlbnNl',
  'KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxiIHN0eWxlPSJjb2xvcjonICsgKHkubmV0Pj0wPyd2YXIoLS1vayknOid2YXIoLS1kYW5nZXIpJykgKyAnIj4nICsgbW9uZXkoeS5uZXQpICsgJzwvYj48L3RkPjwvdHI+JzsKICAgICAg',
  'ICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JyA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14LiC4LmJ4Lit4Lih4Li54LilPC9kaXY+JywgJycsIHRydWUpOwoKICAgIHZhciBraW5kcyA9ICc8ZGl2IGNs',
  'YXNzPSJjaGlwcyBtYjEyIj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImNoaXAgJyArICghUy5wYXJhbXMua2luZD8nb24nOicnKSArICciIG9uY2xpY2s9InNldFBhcmFtKFwna2luZFwnLFwnXCcpIj7guJfguLjguIHguKPguLLguKLguIHguLLguKM8L2J1dHRv',
  'bj4nICsKICAgICAgZC5ieUtpbmQubWFwKGZ1bmN0aW9uKGspewogICAgICAgIHJldHVybiAnPGJ1dHRvbiBjbGFzcz0iY2hpcCAnICsgKFMucGFyYW1zLmtpbmQ9PT1rLmtpbmQ/J29uJzonJykgKyAnIiBvbmNsaWNrPSJzZXRQYXJhbShcJ2tpbmRcJywnICsganNx',
  'KGsua2luZCkgKyAnKSI+JyArCiAgICAgICAgICAgICAgIGVzYyhrLmtpbmQpICsgJyAoJyArIGsuY291bnQgKyAnKTwvYnV0dG9uPic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7CgogICAgdmFyIHJvd3MgPSBkLml0ZW1zOwogICAgdmFyIGxpc3QgPSBj',
  'YXJkKCfwn5OSIOC4o+C4suC4ouC4geC4suC4o+C4l+C4seC5ieC4h+C4q+C4oeC4lCDCtyAnICsgeWVhckxhYmVsICsgJyAoJyArIHJvd3MubGVuZ3RoICsgJyknLAogICAgICByb3dzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0Ij48',
  'dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4Lin4Lix4LiZ4LiX4Li14LmIPC90aD48dGg+4Lij4Liy4Lii4LiB4Liy4LijPC90aD48dGggY2xhc3M9Im51bSI+4LiI4Liz4LiZ4Lin4LiZ4LmA4LiH4Li04LiZPC90aD48dGg+4Lij4Lit4Lia4Lia4Li04LilPC90',
  'aD48dGg+4LiK4LmI4Lit4LiH4LiX4Liy4LiHPC90aD4nICsKICAgICAgICAnPHRoPuC4quC4peC4tOC4mzwvdGg+PHRoPuC4q+C4oeC4suC4ouC5gOC4q+C4leC4uDwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICByb3dzLm1hcChm',
  'dW5jdGlvbih4KXsKICAgICAgICAgIHZhciBpbmMgPSB4LmZsb3cgPT09ICfguKPguLLguKLguKPguLHguJonOwogICAgICAgICAgcmV0dXJuICc8dHI+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHguZGF0ZSkgKyAn',
  'PC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48Yj4nICsgZXNjKHgua2luZCkgKyAnPC9iPiAnICsgKGluYyA/ICc8c3BhbiBjbGFzcz0iYiBvayI+4Lij4Liy4Lii4Lij4Lix4LiaPC9zcGFuPicgOiAnPHNwYW4gY2xhc3M9ImIgbXV0ZSI+4Lij4Liy4Lii4LiI4LmI',
  '4Liy4LiiPC9zcGFuPicpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+PGIgc3R5bGU9ImNvbG9yOicgKyAoaW5jPyd2YXIoLS1vayknOid2YXIoLS1pbmspJykgKyAnIj4nICsgKGluYz8nKyc6J+KIkicpICsgbW9uZXkoeC5hbW91bnQs',
  'IDIpICsgJzwvYj48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKHguYmlsbE1vbnRoIHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKHguY2hhbm5lbCB8fCAn4oCTJykg',
  'KyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCh4LnNsaXBSZWZzKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIG11dGVkIGNsaXAiPicgKyBlc2MoeC5ub3RlIHx8ICcnKSArICc8L3RkPicgKwogICAgICAg',
  'ICAgICAnPHRkPjxkaXYgY2xhc3M9InQtYWN0aW9ucyI+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIiBvbmNsaWNrPVwnZm9ybUZpbmFuY2UoJyArIGF0dHIoeCkgKyAnKVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAgICAgICAg',
  'ICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiBkZ3IiIG9uY2xpY2s9ImRlbEZpbmFuY2UoJyArIGpzcSh4LmlkKSArICcpIj7wn5eRPC9idXR0b24+JyArCiAgICAgICAgICAgICc8L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8',
  'L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6IGVtcHR5Qm94KCfguKLguLHguIfguYTguKHguYjguKHguLXguKPguLLguKLguIHguLLguKPguYPguJknICsgeWVhckxhYmVsLCAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZm9ybUZpbmFuY2Uo',
  'bnVsbCkiPisg4Lia4Lix4LiZ4LiX4Li24LiB4Lij4Liy4Lii4LiB4Liy4LijPC9idXR0b24+JyksCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIHNtIiBvbmNsaWNrPSJmb3JtRmluYW5jZShudWxsKSI+KyDguJrguLHguJnguJfguLbguIHguKPguLLguKLg',
  'uKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4LiiPC9idXR0b24+JywgdHJ1ZSk7CgogICAgcmV0dXJuIGhlYWQgKyBjaGFydHMgKyBtb250aGx5ICsgJzxkaXYgY2xhc3M9ImdyaWQgZzIgbXQxMiBtYjEyIj4nICsgYnlLaW5kICsgYnlZZWFyICsgJzwvZGl2Picg',
  'KyBraW5kcyArIGxpc3Q7CiAgfQp9OwoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDkpIOC4o+C4suC4ouC4h+C4suC4mSAmIOC4quC4s+C4o+C4reC4h+C4guC5ieC4reC4oeC4ueC4pQog',
  'ICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLnJlcG9ydHMgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsKICAgIHJldHVybiBQcm9taXNlLmFsbChbCiAgICAgIGNhbGxBcGkoJ3JlcG9y',
  'dC5jb3N0UGVyUm9vbScsIHsgeWVhcjogUy55ZWFyIH0pLAogICAgICBjYWxsQXBpKCdyZXBvcnQudXBjb21pbmcnLCB7IGRheXM6IDkwIH0pLAogICAgICBjYWxsQXBpKCdiYWNrdXAuc2hlZXRzJywge30pLAogICAgICBjYWxsQXBpKCdzaGFyZS5saW5rcycsIHt9',
  'KS5jYXRjaChmdW5jdGlvbigpeyByZXR1cm4ge307IH0pLAogICAgICBjYWxsQXBpKCdiYWNrdXAuaGlzdG9yeScsIHt9KS5jYXRjaChmdW5jdGlvbigpeyByZXR1cm4gW107IH0pCiAgICBdKS50aGVuKGZ1bmN0aW9uKHIpewogICAgICByZXR1cm4geyBjb3N0OiBy',
  'WzBdLCB1cGNvbWluZzogclsxXSwgc2hlZXRzOiByWzJdLCBsaW5rczogclszXSB8fCB7fSwgYmFja3Vwczogcls0XSB8fCBbXSwgeWVhcnM6IFtdIH07CiAgICB9KTsKICB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgeWVhckxhYmVsID0gUy55ZWFy',
  'ID09PSAnYWxsJyA/ICfguJfguLjguIHguJvguLUnIDogJ+C4m+C4tSAnICsgUy55ZWFyOwogICAgdmFyIGMgPSBkLmNvc3Q7CiAgICB2YXIgdG9wID0gYy5yb29tcy5maWx0ZXIoZnVuY3Rpb24ocil7IHJldHVybiByLnRvdGFsID4gMDsgfSk7CiAgICB2YXIgbWF4',
  'Q29zdCA9IHRvcC5sZW5ndGggPyB0b3BbMF0udG90YWwgOiAxOwoKICAgIHZhciB1cGNvbWluZyA9IGNhcmQoJ/Cfl5PvuI8g4Lib4LiP4Li04LiX4Li04LiZ4LiH4Liy4LiZ4LiX4Li14LmI4LiB4Liz4Lil4Lix4LiH4LiI4Liw4LiW4Li24LiHICg5MCDguKfguLHg',
  'uJkpIMK3ICcgKyBkLnVwY29taW5nLmxlbmd0aCArICcg4LiH4Liy4LiZJywKICAgICAgZC51cGNvbWluZy5sZW5ndGggPyAnPGRpdiBjbGFzcz0iYWxpc3QiPicgKyBkLnVwY29taW5nLm1hcChmdW5jdGlvbih1KXsKICAgICAgICB2YXIgbHZsID0gdS5kYXlzTGVm',
  'dCA8IDAgPyAnZGFuZ2VyJyA6ICh1LmRheXNMZWZ0IDw9IDcgPyAnd2FybicgOiAnaW5mbycpOwogICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0iYWxpIGwtJyArIGx2bCArICciIG9uY2xpY2s9ImdvKFwnJyArIGp1bXBQYWdlKHUubW9kdWxlKSArICdcJykiPicg',
  'KwogICAgICAgICAgJzxkaXYgY2xhc3M9ImljIj4nICsgdS5pY29uICsgJzwvZGl2PjxkaXY+JyArCiAgICAgICAgICAnPGRpdiBjbGFzcz0idHQiPicgKyBlc2ModS50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAnPGRpdiBjbGFzcz0iZGQiPicgKyB0aERh',
  'dGUodS5kYXRlKSArICcgwrcgJyArCiAgICAgICAgICAgICh1LmRheXNMZWZ0IDwgMCA/ICfguYDguKXguKLguIHguLPguKvguJnguJQgJyArICgtdS5kYXlzTGVmdCkgKyAnIOC4p+C4seC4mScgOiAodS5kYXlzTGVmdCA9PT0gMCA/ICfguKfguLHguJnguJnguLXg',
  'uYknIDogJ+C4reC4teC4gSAnICsgdS5kYXlzTGVmdCArICcg4Lin4Lix4LiZJykpICsKICAgICAgICAgICAgKHUuZGV0YWlsID8gJyDCtyAnICsgZXNjKHUuZGV0YWlsKSA6ICcnKSArICc8L2Rpdj48L2Rpdj48L2Rpdj4nOwogICAgICB9KS5qb2luKCcnKSArICc8',
  'L2Rpdj4nIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPvCfjKTvuI88L2Rpdj7guYTguKHguYjguKHguLXguIfguLLguJnguJnguLHguJTguKvguKHguLLguKLguYPguJkgOTAg4Lin4Lix4LiZ4LiC4LmJ4Liy4LiH4Lir4LiZ4LmJ4LiyPC9k',
  'aXY+JywgJycsIHRydWUpOwoKICAgIHZhciBjb3N0Q2FyZCA9IGNhcmQoJ/Cfj7fvuI8g4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Liq4Liw4Liq4Lih4Lij4Liy4Lii4Lir4LmJ4Lit4LiHIMK3ICcgKyB5ZWFyTGFiZWwsCiAgICAgICc8ZGl2IGNsYXNz',
  'PSJncmlkIGczIG1iMTIiPicgKwogICAgICAgIGtwaSgn4Lij4Lin4Lih4LiX4Li44LiB4Lir4LmJ4Lit4LiHJywgYmFodChjLnRvdGFsKSwgJycpICsKICAgICAgICBrcGkoJ+C5gOC4ieC4peC4teC5iOC4ouC4leC5iOC4reC4q+C5ieC4reC4hycsIGJhaHQoYy5h',
  'dmVyYWdlKSwgJycpICsKICAgICAgICBrcGkoJ+C4q+C5ieC4reC4h+C4l+C4teC5iOC5g+C4iuC5ieC4iOC5iOC4suC4ouC4quC4ueC4h+C4quC4uOC4lCcsIHRvcC5sZW5ndGggPyAoJ+C4q+C5ieC4reC4hyAnICsgdG9wWzBdLnJvb20pIDogJ+KAkycsIHRvcC5s',
  'ZW5ndGggPyBiYWh0KHRvcFswXS50b3RhbCkgOiAnJykgKwogICAgICAnPC9kaXY+JyArCiAgICAgICh0b3AubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guKvguYnguK3guIc8L3Ro',
  'Pjx0aCBjbGFzcz0ibnVtIj7guIfguLLguJnguIvguYjguK3guKE8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguYjguLLguIvguYjguK3guKE8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKXguYnguLLguIfguYHguK3guKPguYw8L3RoPicgKwogICAgICAgICc8dGggY2xh',
  'c3M9Im51bSI+4LiC4Lit4LiH4LmA4LiC4LmJ4Liy4Lir4LmJ4Lit4LiHPC90aD48dGggY2xhc3M9Im51bSI+4Lij4Lin4LihPC90aD48dGggc3R5bGU9IndpZHRoOjI2JSI+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIHRvcC5tYXAoZnVuY3Rp',
  'b24ocil7CiAgICAgICAgICByZXR1cm4gJzx0ciBvbmNsaWNrPSJvcGVuUm9vbSgnICsganNxKHIucm9vbSkgKyAnKSIgc3R5bGU9ImN1cnNvcjpwb2ludGVyIj4nICsKICAgICAgICAgICAgJzx0ZD48Yj4nICsgZXNjKHIucm9vbSkgKyAnPC9iPiA8c3BhbiBjbGFz',
  'cz0iZmFpbnQgZnMxMiI+4LiK4Lix4LmJ4LiZICcgKyBlc2Moci5mbG9vcikgKyAnPC9zcGFuPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIHIuam9icyArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAo',
  'ci5yZXBhaXIgPyBtb25leShyLnJlcGFpcikgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHIuYWMgPyBtb25leShyLmFjKSA6ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0i',
  'PicgKyAoci5wdXJjaGFzZSA/IG1vbmV5KHIucHVyY2hhc2UpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+PGI+JyArIG1vbmV5KHIudG90YWwpICsgJzwvYj48L3RkPicgKwogICAgICAgICAgICAnPHRkPjxkaXYgY2xh',
  'c3M9ImJhci10cmFjayI+PGRpdiBjbGFzcz0iYmFyLWZpbGwiIHN0eWxlPSJ3aWR0aDonICsgKHIudG90YWwvbWF4Q29zdCoxMDApICsgJyUiPjwvZGl2PjwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rp',
  'dj4nCiAgICAgIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij7guKLguLHguIfguYTguKHguYjguKHguLXguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguJfguLXguYjguJrguLHguJnguJfguLbguIHguYTguKfguYnguKPguLLguKLguKvguYnguK3guIc8ZGl2IGNs',
  'YXNzPSJmczEyIG10OCI+4LmD4Liq4LmIICLguITguYjguLLguYPguIrguYnguIjguYjguLLguKIiIOC5g+C4meC4h+C4suC4meC4i+C5iOC4reC4oS/guKXguYnguLLguIfguYHguK3guKPguYwg4Lir4Lij4Li34Lit4Lij4Liw4Lia4Li44Lir4LmJ4Lit4LiH4LmD',
  '4LiZ4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHIOC5geC4peC5ieC4p+C4leC4seC4p+C5gOC4peC4guC4iOC4sOC4guC4tuC5ieC4meC4l+C4teC5iOC4meC4teC5iDwvZGl2PjwvZGl2PicpKTsKCiAgICB2YXIgYmFja3VwID0gY2FyZCgn',
  '8J+SviDguKrguLPguKPguK3guIfguYHguKXguLDguIHguLnguYnguITguLfguJnguILguYnguK3guKHguLnguKUnLAogICAgICAnPHAgY2xhc3M9ImZzMTMgbXV0ZWQiPuC4guC5ieC4reC4oeC4ueC4peC4l+C4seC5ieC4h+C4q+C4oeC4lOC4reC4ouC4ueC5iOC5',
  'g+C4meC4o+C4sOC4muC4muC4meC4teC5iSDigJQg4LiE4Lin4Lij4LiU4Liy4Lin4LiZ4LmM4LmC4Lir4Lil4LiU4Liq4Liz4Lij4Lit4LiH4LmE4Lin4LmJ4LmA4LiU4Li34Lit4LiZ4Lil4Liw4LiE4Lij4Lix4LmJ4LiHICcgKwogICAgICAn4LmE4Lif4Lil4LmM',
  'IEpTT04g4LiZ4Liz4LiB4Lil4Lix4Lia4LmA4LiC4LmJ4Liy4Lij4Liw4Lia4Lia4LmE4LiU4LmJIOC4quC5iOC4p+C4mSBDU1Yg4LmA4Lib4Li04LiU4LmD4LiZIEV4Y2VsIOC4q+C4o+C4t+C4rSBHb29nbGUgU2hlZXRzIOC5hOC4lOC5ieC5gOC4peC4ojwvcD4n',
  'ICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBtdDEyIj4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZG9FeHBvcnRKc29uKCkiPuKsh++4jyDguJTguLLguKfguJnguYzguYLguKvguKXguJTguKrguLPguKPguK3guIfguJfguLHg',
  'uYnguIfguKvguKHguJQgKEpTT04pPC9idXR0b24+JyArCiAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iZG9JbXBvcnRKc29uKCkiPuKshu+4jyDguIHguLnguYnguITguLfguJnguIjguLLguIHguYTguJ/guKXguYzguKrguLPguKPguK3guIc8',
  'L2J1dHRvbj4nICsKICAgICAgJzwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtYjgiPuC4quC5iOC4h+C4reC4reC4geC5gOC4m+C5h+C4mSBDU1Yg4LmB4Lii4LiB4LiV4Liy4Lij',
  '4Liy4LiHPC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJjaGlwcyI+JyArIGQuc2hlZXRzLm1hcChmdW5jdGlvbihuKXsKICAgICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9ImNoaXAiIG9uY2xpY2s9ImRvRXhwb3J0Q3N2KCcgKyBqc3EobikgKyAnKSI+JyAr',
  'IGVzYyhzaGVldExhYmVsKG4pKSArICc8L2J1dHRvbj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nKTsKCiAgICB2YXIgc2hhcmUgPSAoY2FuRWRpdCgpICYmIGQubGlua3MgJiYgZC5saW5rcy52aWV3VXJsKSA/IGNhcmQoJ/CflJcg4Lil4Li04LiH4LiB',
  '4LmM4LmA4LiC4LmJ4Liy4LmD4LiK4LmJ4LiH4Liy4LiZJywKICAgICAgJzxkaXYgY2xhc3M9ImYgbWIxMiI+PGxhYmVsPvCflJEg4Lil4Li04LiH4LiB4LmM4LiC4Lit4LiH4LiE4Li44LiTICjguYHguIHguYnguYTguILguILguYnguK3guKHguLnguKXguYTguJTg',
  'uYkg4oCUIOC4reC4ouC5iOC4suC4quC5iOC4h+C4leC5iOC4rSk8L2xhYmVsPicgKwogICAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgcmVhZG9ubHkgdmFsdWU9IicgKyBlc2MoZC5saW5rcy5hZG1pblVybCkgKyAnIiBvbmNsaWNrPSJ0aGlzLnNlbGVjdCgpIj48',
  'L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7wn5GAIOC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jCAo4LmA4Lib4Li04LiU4LiU4Li54LmE4LiU4LmJ4Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinIOKAlCDguKrguYjguIfguYPguKvg',
  'uYnguYPguITguKPguIHguYfguYTguJTguYkpPC9sYWJlbD4nICsKICAgICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJzaGFyZVVybCIgcmVhZG9ubHkgdmFsdWU9IicgKyBlc2MoZC5saW5rcy52aWV3VXJsKSArICciIG9uY2xpY2s9InRoaXMuc2VsZWN0KCki',
  'PjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPicgKwogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJjb3B5U2hhcmUoKSI+8J+TiyDguITguLHguJTguKXguK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYw8',
  'L2J1dHRvbj4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIGRnciIgb25jbGljaz0iZG9Sb3RhdGVTaGFyZSgpIj7wn5SBIOC4reC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC5g+C4q+C4oeC5iDwvYnV0dG9uPicgKwogICAgICAnPC9kaXY+',
  'JyArCiAgICAgICc8cCBjbGFzcz0iZnMxMiBtdXRlZCBtdDEyIj7guITguJnguJfguLXguYjguYDguJvguLTguJTguKXguLTguIfguIHguYzguYHguIrguKPguYzguIjguLDguYDguKvguYfguJnguILguYnguK3guKHguLnguKXguJfguLHguYnguIfguKvguKHguJTg',
  'uYHguJrguJrguK3guYjguLLguJnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcgJyArCiAgICAgICfguYTguKHguYjguJXguYnguK3guIfguKHguLXguJrguLHguI3guIrguLUgR29vZ2xlIOC5geC4peC4sOC5hOC4oeC5iOC5gOC4q+C5h+C4mSBHb29nbGUg',
  'U2hlZXQg4LiC4Lit4LiH4LiE4Li44LiTIMK3ICcgKwogICAgICAn4LiW4LmJ4Liy4Lil4Li04LiH4LiB4LmM4Lir4Lil4Li44LiU4LmD4Lir4LmJ4LiB4LiUICLguK3guK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYzguYPguKvguKHguYgiIOC4peC4tOC4',
  'h+C4geC5jOC5gOC4lOC4tOC4oeC4iOC4sOC5g+C4iuC5ieC5hOC4oeC5iOC5hOC4lOC5ieC4l+C4seC4meC4l+C4tTwvcD4nKSA6ICcnOwoKICAgIHZhciBkcml2ZSA9IGNhbkVkaXQoKSA/IGNhcmQoJ+KYge+4jyDguKrguLPguKPguK3guIfguK3guLHguJXguYLg',
  'uJnguKHguLHguJXguLTguYPguJkgR29vZ2xlIERyaXZlICgnICsgZC5iYWNrdXBzLmxlbmd0aCArICcg4LiK4Li44LiUKScsCiAgICAgICc8cCBjbGFzcz0iZnMxMyBtdXRlZCI+4Lij4Liw4Lia4Lia4LmA4LiB4LmH4Lia4LmE4Lif4Lil4LmM4Liq4Liz4Lij4Lit',
  '4LiH4LmE4Lin4LmJ4LmD4LiZ4LmC4Lif4Lil4LmA4LiU4Lit4Lij4LmMICLguKrguLPguKPguK3guIfguILguYnguK3guKHguLnguKUiIOC4muC4meC5hOC4lOC4o+C4n+C5jOC4guC4reC4h+C4hOC4uOC4kyAnICsKICAgICAgJ+C4leC4seC5ieC4h+C5g+C4q+C5',
  'ieC4l+C4s+C4reC4seC4leC5guC4meC4oeC4seC4leC4tOC4l+C4uOC4geC4p+C4seC4meC5hOC4lOC5ieC4iOC4suC4geC5gOC4oeC4meC4ueC5g+C4meC4iuC4teC4lTwvcD4nICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBtdDEyIj48YnV0dG9uIGNsYXNzPSJi',
  'dG4iIG9uY2xpY2s9ImRvQmFja3VwTm93KCkiPvCfkr4g4Liq4Liz4Lij4Lit4LiH4LmA4LiU4Li14LmL4Lii4Lin4LiZ4Li14LmJPC9idXR0b24+PC9kaXY+JyArCiAgICAgIChkLmJhY2t1cHMubGVuZ3RoID8gJzxkaXYgY2xhc3M9ImhyIj48L2Rpdj48ZGl2IGNs',
  'YXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOmF1dG8iPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guYTguJ/guKXguYw8L3RoPjx0aD7guYDguKfguKXguLI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guILguJnguLLguJQ8L3RoPjwv',
  'dHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgZC5iYWNrdXBzLnNsaWNlKDAsMTApLm1hcChmdW5jdGlvbihiKXsKICAgICAgICAgIHJldHVybiAnPHRyPjx0ZCBjbGFzcz0iZnMxMiI+PGEgaHJlZj0iJyArIGVzYyhzYWZlVXJsKGIudXJsKSkgKyAnIiB0YXJn',
  'ZXQ9Il9ibGFuayIgcmVsPSJub29wZW5lciI+JyArIGVzYyhiLm5hbWUpICsgJzwvYT48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKGIuYXQpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSBmczEyIj4n',
  'ICsgTWF0aC5yb3VuZChiLnNpemUvMTAyNCkgKyAnIEtCPC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicgOiAnJykpIDogJyc7CgogICAgcmV0dXJuIHVwY29taW5nICsgJzxkaXYgY2xhc3M9Im10MTIiPicg',
  'KyBjb3N0Q2FyZCArICc8L2Rpdj4nICsKICAgICAgICAgICAoc2hhcmUgPyAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIHNoYXJlICsgJzwvZGl2PicgOiAnJykgKwogICAgICAgICAgICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgYmFja3VwICsgJzwvZGl2PicgKwogICAg',
  'ICAgICAgIChkcml2ZSA/ICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgZHJpdmUgKyAnPC9kaXY+JyA6ICcnKTsKICB9Cn07CgpmdW5jdGlvbiBzaGVldExhYmVsKG4pewogIHJldHVybiAoewogICAgRGVidHM6J+C4geC5ieC4reC4meC4q+C4meC4teC5iScsIERlYnRQ',
  'YXltZW50czon4Lij4Liy4Lii4LiB4Liy4Lij4LiK4Liz4Lij4Liw4Lir4LiZ4Li14LmJJywgUHVyY2hhc2VzOifguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcnLCBSb29tczon4LiX4Liw4LmA4Lia4Li14Lii4LiZ4Lir4LmJ4Lit4LiHJywK',
  'ICAgIEFjU2VydmljZTon4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJywgUm9vbVJlcGFpcnM6J+C4i+C5iOC4reC4oeC5geC4i+C4oeC4q+C5ieC4reC4hycsIEJ1aWxkaW5nUmVwYWlyczon4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiBJywKICAgIFJvb21B',
  'c3NldHM6J+C4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4meC4q+C5ieC4reC4hycsIEZpbmFuY2U6J+C4o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKInLCBTZXR0aW5nczon4LiV4Lix4LmJ4LiH4LiE4LmI4LiyJywgQWN0aXZpdHlMb2c6J+C4',
  'm+C4o+C4sOC4p+C4seC4leC4tOC4geC4suC4o+C5geC4geC5ieC5hOC4gicKICB9KVtuXSB8fCBuOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4LiV4Lix4Lin4LiK4LmI4Lin4Lii',
  '4Lin4Liy4LiU4LiL4LmJ4LizIOC5hgogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCmZ1bmN0aW9uIGtwaShsYWJlbCwgdmFsdWUsIGNhcCwgY2xzKXsKICByZXR1cm4gJzxkaXYgY2xhc3M9',
  'ImtwaSAnICsgKGNsc3x8JycpICsgJyI+JyArCiAgICAnPGRpdiBjbGFzcz0ibGJsIj4nICsgZXNjKGxhYmVsKSArICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJ2YWwiPicgKyB2YWx1ZSArICc8L2Rpdj4nICsKICAgIChjYXAgPyAnPGRpdiBjbGFzcz0iY2Fw',
  'Ij4nICsgY2FwICsgJzwvZGl2PicgOiAnJykgKyAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gY2FyZCh0aXRsZSwgYm9keSwgYWN0aW9ucywgZmx1c2gpewogIHJldHVybiAnPGRpdiBjbGFzcz0iY2FyZCI+JyArCiAgICAodGl0bGUgPyAnPGRpdiBjbGFzcz0iY2FyZC1o',
  'Ij48aDM+JyArIHRpdGxlICsgJzwvaDM+JyArIChhY3Rpb25zID8gJzxkaXYgY2xhc3M9InNwIj4nICsgYWN0aW9ucyArICc8L2Rpdj4nIDogJycpICsgJzwvZGl2PicgOiAnJykgKwogICAgJzxkaXYgY2xhc3M9ImNhcmQtYicgKyAoZmx1c2ggPyAnIGZsdXNoJyA6',
  'ICcnKSArICciPicgKyBib2R5ICsgJzwvZGl2PjwvZGl2Pic7Cn0KCi8qKiDguKfguLLguJTguJzguLHguIfguKvguYnguK3guIfguYHguJrguYjguIfguJXguLLguKHguIrguLHguYnguJkg4oCUIGRlY29yYXRlKHJvb20pIC0+IHtjbHMsIHN1Yiwgb25jbGlja30g',
  'Ki8KZnVuY3Rpb24gcm9vbUZsb29ycyhyb29tcywgZGVjb3JhdGUpewogIHZhciBieUZsb29yID0ge307CiAgcm9vbXMuZm9yRWFjaChmdW5jdGlvbihyKXsKICAgIHZhciBmID0gci5mbG9vciB8fCBOdW1iZXIoU3RyaW5nKHIucm9vbSkuY2hhckF0KDApKTsKICAg',
  'IChieUZsb29yW2ZdID0gYnlGbG9vcltmXSB8fCBbXSkucHVzaChyKTsKICB9KTsKICB2YXIgZmxvb3JzID0gT2JqZWN0LmtleXMoYnlGbG9vcikuc29ydCgpOwogIHJldHVybiAnPGRpdiBjbGFzcz0iZmxvb3JzIj4nICsgZmxvb3JzLm1hcChmdW5jdGlvbihmKXsK',
  'ICAgIHJldHVybiAnPGRpdiBjbGFzcz0iZmxvb3IiPjxkaXYgY2xhc3M9ImZsb29yLXRhZyI+PGI+JyArIGYgKyAnPC9iPuC4iuC4seC5ieC4mTwvZGl2PjxkaXYgY2xhc3M9InJvb21zIj4nICsKICAgICAgYnlGbG9vcltmXS5tYXAoZnVuY3Rpb24ocil7CiAgICAg',
  'ICAgdmFyIGQgPSBkZWNvcmF0ZShyKTsKICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9InJvb20gJyArIGQuY2xzICsgJyIgb25jbGljaz0iJyArIGQub25jbGljayArICciPicgKwogICAgICAgICAgJzxzcGFuIGNsYXNzPSJkb3QiPjwvc3Bhbj48ZGl2IGNsYXNz',
  'PSJubyI+JyArIGVzYyhyLnJvb20pICsgJzwvZGl2PicgKwogICAgICAgICAgJzxkaXYgY2xhc3M9InN0Ij4nICsgZC5zdWIgKyAnPC9kaXY+PC9kaXY+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+PC9kaXY+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4n',
  'Owp9CgovKiog4LmD4Liq4LmIIG9iamVjdCDguKXguIfguYPguJkgb25jbGljayBhdHRyaWJ1dGUg4LmE4LiU4LmJ4Lit4Lii4LmI4Liy4LiH4Lib4Lil4Lit4LiU4Lig4Lix4LiiICovCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PQogICDguJvguI/guLTguJfguLTguJnguIfguLLguJnguKPguKfguKEKICAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tCiAgIOC5gOC4lOC4t+C4reC4meC4l+C4teC5',
  'iOC4lOC4ueC4reC4ouC4ueC5iOC5gOC4geC5h+C4muC5geC4ouC4geC4iOC4suC4geC4leC4seC4p+C5gOC4peC4t+C4reC4geC4m+C4teC4muC4meC5geC4luC4muC4q+C4seC4pyAoUy5jYWxZbSkg4LmA4Lil4Li34LmI4Lit4LiZ4LiC4LmJ4Liy4Lih4Lib4Li1',
  '4LmE4LiU4LmJ4LiV4LmI4Lit4LmA4LiZ4Li34LmI4Lit4LiHCiAgIOC4iOC4reC4geC4p+C5ieC4suC4hzog4LiV4Liy4Lij4Liy4LiH4LmA4LiU4Li34Lit4LiZIOC4oeC4teC4iuC4t+C5iOC4reC4h+C4suC4meC5g+C4meC4iuC5iOC4reC4h+C4p+C4seC4mSDC',
  'tyDguIjguK3guYHguITguJo6IOC4iuC5iOC4reC4h+C4p+C4seC4meC5gOC4q+C4peC4t+C4reC4iOC4uOC4lOC4quC4tSDguKPguLLguKLguKXguLDguYDguK3guLXguKLguJTguK3guKLguLnguYjguYPguJnguKPguLLguKLguIHguLLguKPguILguYnguLLguIfg',
  'uKXguYjguLLguIcKICAgKOC5guC4hOC4o+C4hyBIVE1MIOC4iuC4uOC4lOC5gOC4lOC4teC4ouC4p+C4geC4seC4mSDguKrguKXguLHguJrguJTguYnguKfguKIgQ1NTKQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT0gKi8KdmFyIFRIX01PTlRIX0ZVTEwgPSBbJ+C4oeC4geC4o+C4suC4hOC4oScsJ+C4geC4uOC4oeC4oOC4suC4nuC4seC4meC4mOC5jCcsJ+C4oeC4teC4meC4suC4hOC4oScsJ+C5gOC4oeC4qeC4suC4ouC4mScsJ+C4nuC4pOC4qeC4oOC4suC4',
  'hOC4oScsJ+C4oeC4tOC4luC4uOC4meC4suC4ouC4mScsCiAgICAgICAgICAgICAgICAgICAgICfguIHguKPguIHguI7guLLguITguKEnLCfguKrguLTguIfguKvguLLguITguKEnLCfguIHguLHguJnguKLguLLguKLguJknLCfguJXguLjguKXguLLguITguKEnLCfg',
  'uJ7guKTguKjguIjguLTguIHguLLguKLguJknLCfguJjguLHguJnguKfguLLguITguKEnXTsKdmFyIENBTF9LSU5EUyA9IFsKICB7IG1vZHVsZToncmVwYWlycycsICAgaWM6J/CflKcnLCBsYWJlbDon4LiL4LmI4Lit4Lih4Lir4LmJ4Lit4LiHJyB9LAogIHsgbW9k',
  'dWxlOidhYycsICAgICAgICBpYzon4p2E77iPJywgbGFiZWw6J+C4peC5ieC4suC4h+C5geC4reC4o+C5jCcgfSwKICB7IG1vZHVsZTonYnVpbGRpbmcnLCAgaWM6J/Cfj6InLCBsYWJlbDon4LiH4Liy4LiZ4LiV4Li24LiBJyB9LAogIHsgbW9kdWxlOidkZWJ0Jywg',
  'ICAgICBpYzon8J+SsCcsIGxhYmVsOifguJzguYjguK3guJnguKvguJnguLXguYknIH0sCiAgeyBtb2R1bGU6J3B1cmNoYXNlcycsIGljOifwn5uh77iPJywgbGFiZWw6J+C4m+C4o+C4sOC4geC4seC4mScgfQpdOwp2YXIgQ0FMID0geyBoaWRlOiB7fSwgZGF0YTog',
  'bnVsbCB9OwoKZnVuY3Rpb24gY2FsTm93WW0oKXsgdmFyIGQgPSBuZXcgRGF0ZSgpOyByZXR1cm4gZC5nZXRGdWxsWWVhcigpICsgJy0nICsgKCcwJyArIChkLmdldE1vbnRoKCkgKyAxKSkuc2xpY2UoLTIpOyB9CmZ1bmN0aW9uIGNhbFNoaWZ0KHltLCBkZWx0YSl7',
  'CiAgdmFyIHkgPSBOdW1iZXIoeW0uc2xpY2UoMCwgNCkpLCBtID0gTnVtYmVyKHltLnNsaWNlKDUsIDcpKSAtIDEgKyBkZWx0YTsKICB5ICs9IE1hdGguZmxvb3IobSAvIDEyKTsgbSA9ICgobSAlIDEyKSArIDEyKSAlIDEyOwogIHJldHVybiB5ICsgJy0nICsgKCcw',
  'JyArIChtICsgMSkpLnNsaWNlKC0yKTsKfQpmdW5jdGlvbiBjYWxHbyhkZWx0YSl7IFMuY2FsWW0gPSBkZWx0YSA9PT0gMCA/IGNhbE5vd1ltKCkgOiBjYWxTaGlmdChTLmNhbFltIHx8IGNhbE5vd1ltKCksIGRlbHRhKTsgbG9hZCgpOyB9CmZ1bmN0aW9uIGNhbFRv',
  'Z2dsZShtb2R1bGUpeyBDQUwuaGlkZVttb2R1bGVdID0gIUNBTC5oaWRlW21vZHVsZV07IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aWV3JykuaW5uZXJIVE1MID0gUk9VVEVTLmNhbGVuZGFyLnJlbmRlcihDQUwuZGF0YSk7IGxhYmVsQ2VsbHMoZG9jdW1lbnQu',
  'Z2V0RWxlbWVudEJ5SWQoJ3ZpZXcnKSk7IGFwcGx5UmVhZE9ubHkoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZpZXcnKSk7IH0KZnVuY3Rpb24gY2FsU2hvd24oKXsgcmV0dXJuIChDQUwuZGF0YS5ldmVudHMgfHwgW10pLmZpbHRlcihmdW5jdGlvbihlKXsgcmV0',
  'dXJuICFDQUwuaGlkZVtlLm1vZHVsZV07IH0pOyB9CmZ1bmN0aW9uIGNhbFN0YXRlTGFiZWwocyl7IHJldHVybiBzID09PSAnZG9uZScgPyAn4LmA4Liq4Lij4LmH4LiI4LmB4Lil4LmJ4LinJyA6IChzID09PSAnbGF0ZScgPyAn4LmA4Lil4Lii4LiB4Liz4Lir4LiZ',
  '4LiUJyA6ICfguKPguK3guJfguLMnKTsgfQpmdW5jdGlvbiBjYWxTdGF0ZUNscyhzKXsgcmV0dXJuIHMgPT09ICdkb25lJyA/ICdvaycgOiAocyA9PT0gJ2xhdGUnID8gJ2RncicgOiAnaW5mbycpOyB9CgpST1VURVMuY2FsZW5kYXIgPSB7CiAgbG9hZDogZnVuY3Rp',
  'b24oKXsKICAgIGlmICghUy5jYWxZbSkgUy5jYWxZbSA9IGNhbE5vd1ltKCk7CiAgICByZXR1cm4gY2FsbEFwaSgnY2FsZW5kYXIubW9udGgnLCB7IHltOiBTLmNhbFltIH0pLnRoZW4oZnVuY3Rpb24oZCl7CiAgICAgIC8vIOC4q+C4meC5ieC4suC4meC4teC5ieC5',
  'hOC4oeC5iOC5g+C4iuC5ieC4leC4seC4p+C5gOC4peC4t+C4reC4geC4m+C4tSDigJQg4Liq4LmI4LiH4Lib4Li14LiX4Li14LmI4LmA4Lil4Li34Lit4LiB4LiE4LmJ4Liy4LiH4LmE4Lin4LmJ4LiB4Lil4Lix4Lia4LmE4LibIOC4leC4seC4p+C5gOC4peC4t+C4',
  'reC4geC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC4luC4ueC4geC4o+C4teC5gOC4i+C5h+C4lQogICAgICBkLnllYXJzID0gUy55ZWFyICE9PSAnYWxsJyA/IFtOdW1iZXIoUy55ZWFyKV0gOiBbXTsKICAgICAgcmV0dXJuIGQ7CiAgICB9KTsKICB9LAogIHJlbmRl',
  'cjogZnVuY3Rpb24oZCl7CiAgICBDQUwuZGF0YSA9IGQ7CiAgICB2YXIgZXYgPSBjYWxTaG93bigpOwogICAgdmFyIGJ5RGF5ID0ge307CiAgICBldi5mb3JFYWNoKGZ1bmN0aW9uKGUpeyAoYnlEYXlbZS5kYXRlXSA9IGJ5RGF5W2UuZGF0ZV0gfHwgW10pLnB1c2go',
  'ZSk7IH0pOwogICAgdmFyIGxhdGUgPSBldi5maWx0ZXIoZnVuY3Rpb24oZSl7IHJldHVybiBlLnN0YXRlID09PSAnbGF0ZSc7IH0pLmxlbmd0aDsKICAgIHZhciBkdWUgID0gZXYuZmlsdGVyKGZ1bmN0aW9uKGUpeyByZXR1cm4gZS5zdGF0ZSA9PT0gJ2R1ZSc7IH0p',
  'Lmxlbmd0aDsKICAgIHZhciBkb25lID0gZXYuZmlsdGVyKGZ1bmN0aW9uKGUpeyByZXR1cm4gZS5zdGF0ZSA9PT0gJ2RvbmUnOyB9KS5sZW5ndGg7CgogICAgdmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iY2FyZCBtYjEyIj48ZGl2IGNsYXNzPSJjYXJkLWIiPicgKwog',
  'ICAgICAnPGRpdiBjbGFzcz0icm93Ij4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIGljb24iIHRpdGxlPSLguYDguJTguLfguK3guJnguIHguYjguK3guJkiIGFyaWEtbGFiZWw9IuC5gOC4lOC4t+C4reC4meC4geC5iOC4reC4mSIgb25jbGljaz0iY2Fs',
  'R28oLTEpIj7il4A8L2J1dHRvbj4nICsKICAgICAgICAnPGgzIGNsYXNzPSJjYWwtdGl0bGUiIGlkPSJjYWxUaXRsZSI+JyArIFRIX01PTlRIX0ZVTExbZC5tb250aCAtIDFdICsgJyAnICsgZXNjKGRpc3BsYXlZZWFyKGQueWVhcikpICsgJzwvaDM+JyArCiAgICAg',
  'ICAgJzxidXR0b24gY2xhc3M9ImJ0biBpY29uIiB0aXRsZT0i4LmA4LiU4Li34Lit4LiZ4LiW4Lix4LiU4LmE4LibIiBhcmlhLWxhYmVsPSLguYDguJTguLfguK3guJnguJbguLHguJTguYTguJsiIG9uY2xpY2s9ImNhbEdvKDEpIj7ilrY8L2J1dHRvbj4nICsKICAg',
  'ICAgICAoZC55bSAhPT0gY2FsTm93WW0oKSA/ICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImNhbEdvKDApIj7guIHguKXguLHguJrguKHguLLguYDguJTguLfguK3guJnguJnguLXguYk8L2J1dHRvbj4nIDogJycpICsKICAgICAgICAnPHNwYW4gY2xh',
  'c3M9InNwIj48L3NwYW4+JyArCiAgICAgICAgKGxhdGUgPyAnPHNwYW4gY2xhc3M9ImIgZGdyIj7guYDguKXguKLguIHguLPguKvguJnguJQgJyArIGxhdGUgKyAnPC9zcGFuPicgOiAnJykgKwogICAgICAgICc8c3BhbiBjbGFzcz0iYiBpbmZvIj7guKPguK3guJfg',
  'uLMgJyArIGR1ZSArICc8L3NwYW4+JyArCiAgICAgICAgJzxzcGFuIGNsYXNzPSJiIG9rIj7guYDguKrguKPguYfguIjguYHguKXguYnguKcgJyArIGRvbmUgKyAnPC9zcGFuPicgKwogICAgICAnPC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJjaGlwcyBtdDEy',
  'Ij4nICsgQ0FMX0tJTkRTLm1hcChmdW5jdGlvbihrKXsKICAgICAgICB2YXIgbiA9IChkLmV2ZW50cyB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uKGUpeyByZXR1cm4gZS5tb2R1bGUgPT09IGsubW9kdWxlOyB9KS5sZW5ndGg7CiAgICAgICAgcmV0dXJuICc8YnV0dG9u',
  'IGNsYXNzPSJjaGlwICcgKyAoQ0FMLmhpZGVbay5tb2R1bGVdID8gJycgOiAnb24nKSArICciIGFyaWEtcHJlc3NlZD0iJyArICghQ0FMLmhpZGVbay5tb2R1bGVdKSArICciICcgKwogICAgICAgICAgJ29uY2xpY2s9ImNhbFRvZ2dsZSgnICsganNxKGsubW9kdWxl',
  'KSArICcpIj4nICsgay5pYyArICcgJyArIGVzYyhrLmxhYmVsKSArICcgKCcgKyBuICsgJyk8L2J1dHRvbj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nICsKICAgICc8L2Rpdj48L2Rpdj4nOwoKICAgIC8vIOC4leC4suC4o+C4suC4h+C5gOC4lOC4t+C4',
  'reC4mTog4LmA4Lij4Li04LmI4Lih4Liq4Lix4Lib4LiU4Liy4Lir4LmM4Lin4Lix4LiZ4Lit4Liy4LiX4Li04LiV4Lii4LmM4LiV4Liy4Lih4Lib4LiP4Li04LiX4Li04LiZ4LmE4LiX4LiiCiAgICB2YXIgZmlyc3QgPSBuZXcgRGF0ZShkLnllYXIsIGQubW9udGgg',
  'LSAxLCAxKS5nZXREYXkoKTsKICAgIHZhciBjZWxscyA9ICcnOwogICAgWyfguK3guLInLCfguIgnLCfguK0nLCfguJ4nLCfguJ7guKQnLCfguKgnLCfguKonXS5mb3JFYWNoKGZ1bmN0aW9uKHcpeyBjZWxscyArPSAnPGRpdiBjbGFzcz0iY2FsLXdkIj4nICsgdyAr',
  'ICc8L2Rpdj4nOyB9KTsKICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmlyc3Q7IGkrKykgY2VsbHMgKz0gJzxkaXYgY2xhc3M9ImNhbC1jIG9mZiI+PC9kaXY+JzsKICAgIGZvciAodmFyIGRheSA9IDE7IGRheSA8PSBkLmRheXM7IGRheSsrKSB7CiAgICAgIHZhciBp',
  'c28gPSBkLnltICsgJy0nICsgKCcwJyArIGRheSkuc2xpY2UoLTIpOwogICAgICB2YXIgbGlzdCA9IGJ5RGF5W2lzb10gfHwgW107CiAgICAgIHZhciBjbHMgPSAnY2FsLWMnICsgKGlzbyA9PT0gZC50b2RheSA/ICcgdG9kYXknIDogJycpICsgKGxpc3QubGVuZ3Ro',
  'ID8gJyBoYXMnIDogJycpOwogICAgICBjZWxscyArPSAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSInICsgY2xzICsgJyIgb25jbGljaz0ib3BlbkNhbERheSgnICsganNxKGlzbykgKyAnKSIgJyArCiAgICAgICAgJ2FyaWEtbGFiZWw9IuC4p+C4seC4meC4',
  'l+C4teC5iCAnICsgZGF5ICsgKGxpc3QubGVuZ3RoID8gJyDguKHguLUgJyArIGxpc3QubGVuZ3RoICsgJyDguKPguLLguKLguIHguLLguKMnIDogJycpICsgJyI+JyArCiAgICAgICAgJzxzcGFuIGNsYXNzPSJjYWwtbiI+JyArIGRheSArICc8L3NwYW4+JyArCiAg',
  'ICAgICAgbGlzdC5zbGljZSgwLCAzKS5tYXAoZnVuY3Rpb24oZSl7CiAgICAgICAgICByZXR1cm4gJzxzcGFuIGNsYXNzPSJjYWwtZXYgJyArIGNhbFN0YXRlQ2xzKGUuc3RhdGUpICsgJyI+JyArIGUuaWNvbiArICcgJyArIGVzYyhlLnRpdGxlKSArICc8L3NwYW4+',
  'JzsKICAgICAgICB9KS5qb2luKCcnKSArCiAgICAgICAgKGxpc3QubGVuZ3RoID4gMyA/ICc8c3BhbiBjbGFzcz0iY2FsLW1vcmUiPisnICsgKGxpc3QubGVuZ3RoIC0gMykgKyAnIOC4o+C4suC4ouC4geC4suC4ozwvc3Bhbj4nIDogJycpICsKICAgICAgICAnPHNw',
  'YW4gY2xhc3M9ImNhbC1kb3RzIj4nICsgbGlzdC5zbGljZSgwLCA1KS5tYXAoZnVuY3Rpb24oZSl7CiAgICAgICAgICByZXR1cm4gJzxpIGNsYXNzPSInICsgY2FsU3RhdGVDbHMoZS5zdGF0ZSkgKyAnIj48L2k+JzsKICAgICAgICB9KS5qb2luKCcnKSArIChsaXN0',
  'Lmxlbmd0aCA+IDUgPyAnPGVtPisnICsgKGxpc3QubGVuZ3RoIC0gNSkgKyAnPC9lbT4nIDogJycpICsgJzwvc3Bhbj4nICsKICAgICAgJzwvYnV0dG9uPic7CiAgICB9CiAgICBmb3IgKHZhciB0ID0gKGZpcnN0ICsgZC5kYXlzKSAlIDc7IHQgPiAwICYmIHQgPCA3',
  'OyB0KyspIGNlbGxzICs9ICc8ZGl2IGNsYXNzPSJjYWwtYyBvZmYiPjwvZGl2Pic7ICAgLy8g4LmA4LiV4Li04Lih4LiX4LmJ4Liy4Lii4LmA4LiU4Li34Lit4LiZ4LmD4Lir4LmJ4LmA4LiV4LmH4Lih4LmB4LiW4LinCiAgICB2YXIgZ3JpZCA9ICc8ZGl2IGNsYXNz',
  'PSJjYXJkIG1iMTIiPjxkaXYgY2xhc3M9ImNhcmQtYiBmbHVzaCI+PGRpdiBjbGFzcz0iY2FsIj4nICsgY2VsbHMgKyAnPC9kaXY+PC9kaXY+PC9kaXY+JzsKCiAgICAvLyDguKPguLLguKLguIHguLLguKPguJfguLHguYnguIfguYDguJTguLfguK3guJkg4LmA4Lij',
  '4Li14Lii4LiH4LiV4Liy4Lih4Lin4Lix4LiZIOKAlCDguJrguJnguKHguLfguK3guJbguLfguK3guJnguLXguYjguITguLfguK3guJfguLXguYjguK3guYjguLLguJnguKPguLLguKLguKXguLDguYDguK3guLXguKLguJTguKvguKXguLHguIEKICAgIHZhciBkYXlz',
  'ID0gT2JqZWN0LmtleXMoYnlEYXkpLnNvcnQoKTsKICAgIHZhciBhZ2VuZGEgPSBjYXJkKCfwn5OLIOC4o+C4suC4ouC4geC4suC4o+C4guC4reC4h+C5gOC4lOC4t+C4reC4meC4meC4teC5iSAoJyArIGV2Lmxlbmd0aCArICcpJywKICAgICAgZGF5cy5sZW5ndGgg',
  'PyAnPGRpdiBjbGFzcz0iY2FsLWFnZW5kYSI+JyArIGRheXMubWFwKGZ1bmN0aW9uKGlzbyl7CiAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJjYWwtZGF5JyArIChpc28gPT09IGQudG9kYXkgPyAnIHRvZGF5JyA6ICcnKSArICciPicgKwogICAgICAgICAgJzxk',
  'aXYgY2xhc3M9ImNhbC1kYXRlIj4nICsgdGhEYXRlKGlzbykgKyAoaXNvID09PSBkLnRvZGF5ID8gJyA8c3BhbiBjbGFzcz0iYiBpbmZvIj7guKfguLHguJnguJnguLXguYk8L3NwYW4+JyA6ICcnKSArICc8L2Rpdj4nICsKICAgICAgICAgIGJ5RGF5W2lzb10ubWFw',
  'KGNhbFJvdykuam9pbignJykgKyAnPC9kaXY+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JwogICAgICA6IGVtcHR5Qm94KCfguYDguJTguLfguK3guJnguJnguLXguYnguYTguKHguYjguKHguLXguKPguLLguKLguIHguLLguKMnICsgKGV2Lmxlbmd0aCAh',
  'PT0gKGQuZXZlbnRzIHx8IFtdKS5sZW5ndGggPyAn4LmD4LiZ4Lib4Lij4Liw4LmA4Lig4LiX4LiX4Li14LmI4LmA4Lil4Li34Lit4LiBJyA6ICcnKSwKICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJvcGVuQ2FsRGF5KCcgKyBqc3Eo',
  'ZC55bSArICctMDEnKSArICcpIj4rIOC5gOC4nuC4tOC5iOC4oeC4meC4seC4lDwvYnV0dG9uPicpLAogICAgICAnJywgdHJ1ZSk7CgogICAgcmV0dXJuIGhlYWQgKyBncmlkICsgYWdlbmRhOwogIH0KfTsKCmZ1bmN0aW9uIGNhbFJvdyhlKXsKICByZXR1cm4gJzxi',
  'dXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iY2FsLXJvdyIgb25jbGljaz0iY2FsT3BlbignICsganNxKGUubW9kdWxlKSArICcsJyArIGpzcShlLmRhdGUpICsgJywnICsganNxKGUuc3RhdGUpICsgJykiPicgKwogICAgJzxzcGFuIGNsYXNzPSJpYyI+JyArIGUu',
  'aWNvbiArICc8L3NwYW4+JyArCiAgICAnPHNwYW4gY2xhc3M9InR4Ij48c3BhbiBjbGFzcz0idHQiPicgKyBlc2MoZS50aXRsZSkgKyAnPC9zcGFuPicgKwogICAgICAoZS5kZXRhaWwgPyAnPHNwYW4gY2xhc3M9ImRkIj4nICsgZXNjKGUuZGV0YWlsKSArICc8L3Nw',
  'YW4+JyA6ICcnKSArICc8L3NwYW4+JyArCiAgICAnPHNwYW4gY2xhc3M9ImIgJyArIGNhbFN0YXRlQ2xzKGUuc3RhdGUpICsgJyI+JyArIGNhbFN0YXRlTGFiZWwoZS5zdGF0ZSkgKyAnPC9zcGFuPicgKwogICc8L2J1dHRvbj4nOwp9CgovKiog4LiB4LiU4LiX4Li1',
  '4LmI4Lin4Lix4LiZOiDguJTguLnguKPguLLguKLguIHguLLguKPguILguK3guIfguKfguLHguJnguJnguLHguYnguJkg4LmB4Lil4Liw4LmA4Lie4Li04LmI4Lih4LiZ4Lix4LiU4LmD4Lir4Lih4LmI4LmC4LiU4Lii4LmD4Liq4LmI4Lin4Lix4LiZ4LiX4Li14LmI',
  '4LmD4Lir4LmJ4LmA4Lil4LiiICovCmZ1bmN0aW9uIG9wZW5DYWxEYXkoaXNvKXsKICB2YXIgbGlzdCA9IGNhbFNob3duKCkuZmlsdGVyKGZ1bmN0aW9uKGUpeyByZXR1cm4gZS5kYXRlID09PSBpc287IH0pOwogIG9wZW5Nb2RhbCgn8J+Xk++4jyAnICsgdGhEYXRl',
  'KGlzbyksCiAgICAobGlzdC5sZW5ndGggPyAnPGRpdiBjbGFzcz0iY2FsLWFnZW5kYSI+JyArIGxpc3QubWFwKGNhbFJvdykuam9pbignJykgKyAnPC9kaXY+JwogICAgICAgICAgICAgICAgIDogJzxkaXYgY2xhc3M9ImVtcHR5IiBzdHlsZT0icGFkZGluZzoxOHB4',
  'Ij7guKLguLHguIfguYTguKHguYjguKHguLXguKPguLLguKLguIHguLLguKPguYPguJnguKfguLHguJnguJnguLXguYk8L2Rpdj4nKSwKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtmb3JtUmVwYWlyKHtib29rRGF0ZTon',
  'ICsganNxKGlzbykgKyAnLHJlcG9ydERhdGU6dG9kYXkoKSxwcmlvcml0eTpcJ+C4m+C4geC4leC4tFwnfSkiPisg4LiZ4Lix4LiU4LiL4LmI4Lit4Lih4Lir4LmJ4Lit4LiHPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJj',
  'bG9zZU1vZGFsKCk7Zm9ybUFjKHtib29rRGF0ZTonICsganNxKGlzbykgKyAnfSkiPisg4LiZ4Lix4LiU4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCk7Zm9y',
  'bUJ1aWxkaW5nKHtib29rRGF0ZTonICsganNxKGlzbykgKyAnfSkiPisg4LiZ4Lix4LiU4LiH4Liy4LiZ4LiV4Li24LiBPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4m+C4tOC4lDwvYnV0dG9uPicp',
  'Owp9CgovKiog4LiB4LiU4LiX4Li14LmI4Lij4Liy4Lii4LiB4Liy4LijOiDguYTguJvguKvguJnguYnguLLguILguK3guIfguIfguLLguJnguJnguLHguYnguJkg4LmD4LiZ4Lib4Li14LiX4Li14LmI4LiI4Liw4LmA4Lir4LmH4LiZ4LiH4Liy4LiZ4LiZ4Lix4LmJ',
  '4LiZ4LmB4LiZ4LmIIOC5hiAqLwpmdW5jdGlvbiBjYWxPcGVuKG1vZHVsZSwgZGF0ZSwgc3RhdGUpewogIGNsb3NlTW9kYWwoKTsKICB2YXIgY3VyID0gU3RyaW5nKG5ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKSk7CiAgLy8g4LiH4Liy4LiZ4LiX4Li14LmI4Lii4Lix',
  '4LiH4LmE4Lih4LmI4LmA4Liq4Lij4LmH4LiI4LmA4Lir4LmH4LiZ4LmD4LiZ4Lib4Li14Lib4Lix4LiI4LiI4Li44Lia4Lix4LiZ4LmA4Liq4Lih4LitIMK3IOC4h+C4suC4meC4l+C4teC5iOC5gOC4quC4o+C5h+C4iOC5geC4peC5ieC4p+C5geC4peC4sOC4o+C4',
  'suC4ouC4geC4suC4o+C5guC4reC4meC4reC4ouC4ueC5iOC5g+C4meC4m+C4teC4guC4reC4h+C4oeC4seC4meC5gOC4reC4hyDCtyDguJvguKPguLDguIHguLHguJnguK3guKLguLnguYjguYPguJnguJvguLXguJfguLXguYjguIvguLfguYnguK0g4LiI4Li24LiH',
  '4LiU4Li54LiX4Li44LiB4Lib4Li1CiAgUy55ZWFyID0gbW9kdWxlID09PSAncHVyY2hhc2VzJyA/ICdhbGwnIDogKChtb2R1bGUgPT09ICdkZWJ0JyB8fCBzdGF0ZSA9PT0gJ2RvbmUnKSA/IFN0cmluZyhkYXRlKS5zbGljZSgwLCA0KSA6IGN1cik7CiAgZ28obW9k',
  'dWxlID09PSAnZGVidCcgPyAnZGVidE1haW4nIDogbW9kdWxlKTsKfQoKLyoqIOC4h+C4suC4meC4l+C4teC5iOC4ouC4seC4h+C5hOC4oeC5iOC4m+C4tOC4lOC4guC4reC4h+C4m+C4teC4reC4t+C5iOC4mSDguIvguLbguYjguIfguYHguKrguJTguIfguKPguYjg',
  'uKfguKHguK3guKLguLnguYjguYPguJnguJvguLXguJfguLXguYjguIHguLPguKXguLHguIfguJTguLkg4oCUIOC4leC4tOC4lOC4m+C5ieC4suC4ouC4muC4reC4geC4p+C5iOC4suC5gOC4m+C5h+C4meC4guC4reC4h+C4m+C4teC5hOC4q+C4mSAqLwpmdW5jdGlv',
  'biBvdGhlclllYXJUYWcoeCl7CiAgcmV0dXJuIHggJiYgeC5vdGhlclllYXIgPyAnIDxzcGFuIGNsYXNzPSJiIGluZm8iIHRpdGxlPSLguIfguLLguJnguJnguLXguYnguKLguLHguIfguYTguKHguYjguJvguLTguJQg4LiI4Li24LiH4LmB4Liq4LiU4LiH4LmD4LiZ',
  '4Lib4Li14LiZ4Li14LmJ4LiU4LmJ4Lin4LiiIj7guJvguLUgJyArIGVzYyhkaXNwbGF5WWVhcih4Lm90aGVyWWVhcikpICsgJzwvc3Bhbj4nIDogJyc7Cn0KCmZ1bmN0aW9uIGF0dHIob2JqKXsKICB2YXIgY2xlYW4gPSB7fTsKICBPYmplY3Qua2V5cyhvYmopLmZv',
  'ckVhY2goZnVuY3Rpb24oayl7CiAgICBpZiAoay5pbmRleE9mKCdfJykgPT09IDAgfHwgL1JlZnMkLy50ZXN0KGspIHx8IGsgPT09ICdyZWNvcmRzJyB8fCBrID09PSAnd2FycmFudHknKSByZXR1cm47CiAgICBjbGVhbltrXSA9IG9ialtrXTsKICB9KTsKICByZXR1',
  'cm4gSlNPTi5zdHJpbmdpZnkoY2xlYW4pLnJlcGxhY2UoLyYvZywnJmFtcDsnKS5yZXBsYWNlKC8nL2csJyYjMzk7JykucmVwbGFjZSgvIi9nLCcmcXVvdDsnKTsKfQo8L3NjcmlwdD4KPHNjcmlwdD4KLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09CiAgIFNldHRpbmdzLmh0bWwg4oCUIOC4q+C4meC5ieC4suC4leC4seC5ieC4h+C4hOC5iOC4siDCtyDguJjguLXguKEgwrcg4Lia4Lix4LiN4LiK4Li14Lic4Li54LmJ4LmD4LiK4LmJIMK3IOC4reC4uOC4m+C4geC4o+C4',
  'k+C5jAogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4LiY4Li14Lih4Liq4Lin4LmI4Liy4LiHIC8g4Lih4Li34LiUIC0tLS0tLS0tLS0tLS0tLS0gKi8KCnZh',
  'ciBMU19USEVNRSA9ICdtY29ybmVyLnRoZW1lJzsKdmFyIFRIRU1FUyA9IFsKICB7IGlkOiAn4LiV4Liy4Lih4LmA4LiE4Lij4Li34LmI4Lit4LiHJywgaWM6ICfwn4yXJywgaGludDogJ+C4quC4peC4seC4muC4leC4suC4oeC4geC4suC4o+C4leC4seC5ieC4h+C4',
  'hOC5iOC4suC4guC4reC4h+C4reC4uOC4m+C4geC4o+C4k+C5jCcgfSwKICB7IGlkOiAn4Liq4Lin4LmI4Liy4LiHJywgICAgICBpYzogJ+KYgO+4jycsIGhpbnQ6ICfguJ7guLfguYnguJnguILguLLguKcg4Lit4LmI4Liy4LiZ4LiH4LmI4Liy4Lii4LiB4Lil4Liy',
  '4LiH4LmB4LiU4LiUJyB9LAogIHsgaWQ6ICfguKHguLfguJQnLCAgICAgICAgaWM6ICfwn4yZJywgaGludDogJ+C4nuC4t+C5ieC4meC5gOC4guC5ieC4oSDguKrguJrguLLguKLguJXguLLguJXguK3guJnguIHguKXguLLguIfguITguLfguJknIH0KXTsKCi8qKgog',
  'KiDguJfguLLguJjguLXguKHguKXguIfguKvguJnguYnguLLguYDguKfguYfguJrguJfguLHguJnguJfguLUKICog4LiV4Lix4Lin4LmB4Lib4Lij4Liq4Li14LiX4Lix4LmJ4LiH4Lir4Lih4LiU4LiZ4Li04Lii4Liy4Lih4LmE4Lin4LmJIDMg4LiK4Lix4LmJ4LiZ',
  '4LmD4LiZIFN0eWxlLmh0bWwg4LmB4Lil4LmJ4LinIOC4leC4o+C4h+C4meC4teC5ieC5geC4hOC5iOC4leC4tOC4lOC4m+C5ieC4suC4ouC4muC4reC4geC4p+C5iOC4suC5g+C4iuC5ieC4iuC4seC5ieC4meC5hOC4q+C4mQogKi8KZnVuY3Rpb24gYXBwbHlUaGVt',
  'ZShuYW1lKXsKICB2YXIgcm9vdCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDsKICBpZiAobmFtZSA9PT0gJ+C4quC4p+C5iOC4suC4hycpIHJvb3Quc2V0QXR0cmlidXRlKCdkYXRhLXRoZW1lJywgJ2xpZ2h0Jyk7CiAgZWxzZSBpZiAobmFtZSA9PT0gJ+C4oeC4',
  't+C4lCcpIHJvb3Quc2V0QXR0cmlidXRlKCdkYXRhLXRoZW1lJywgJ2RhcmsnKTsKICBlbHNlIHJvb3QucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXRoZW1lJyk7ICAgICAgIC8vIOC4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hyA9IOC4m+C4peC5iOC4reC4ouC5',
  'g+C4q+C5iSBwcmVmZXJzLWNvbG9yLXNjaGVtZSDguJXguLHguJTguKrguLTguJkKICB2YXIgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RoZW1lQnRuJyk7CiAgaWYgKGJ0bikgewogICAgdmFyIHQgPSBUSEVNRVMuZmlsdGVyKGZ1bmN0aW9uKHgpeyBy',
  'ZXR1cm4geC5pZCA9PT0gbmFtZTsgfSlbMF0gfHwgVEhFTUVTWzBdOwogICAgYnRuLnRleHRDb250ZW50ID0gdC5pYzsKICAgIGJ0bi50aXRsZSA9ICfguJjguLXguKE6ICcgKyB0LmlkICsgJyAo4LiB4LiU4LmA4Lie4Li34LmI4Lit4Liq4Lil4Lix4LiaKSc7CiAg',
  'fQp9CgpmdW5jdGlvbiBjdXJyZW50VGhlbWUoKXsKICByZXR1cm4gbHNHZXQoTFNfVEhFTUUpIHx8IChTLmJvb3QgJiYgUy5ib290LnNldHRpbmdzICYmIFMuYm9vdC5zZXR0aW5ncy50aGVtZSkgfHwgJ+C4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hyc7Cn0K',
  'Ci8qKiDguJXguLHguYnguIfguJjguLXguKHguYHguKXguLDguIjguLPguYTguKfguYkg4oCUIOC4nOC4ueC5ieC4lOC4ueC5geC4peC4iOC4sOC4luC4ueC4geC4muC4seC4meC4l+C4tuC4geC5gOC4m+C5h+C4meC4hOC5iOC4suC4leC4seC5ieC4h+C4leC5ieC4',
  'meC4guC4reC4h+C4o+C4sOC4muC4muC4lOC5ieC4p+C4oiAqLwpmdW5jdGlvbiBzZXRUaGVtZShuYW1lLCBxdWlldCl7CiAgbHNTZXQoTFNfVEhFTUUsIG5hbWUpOwogIGFwcGx5VGhlbWUobmFtZSk7CiAgaWYgKFMuYm9vdCAmJiBTLmJvb3QuaXNBZG1pbikgewog',
  'ICAgY2FsbEFwaSgnc2V0dGluZ3Muc2F2ZScsIHsgdmFsdWVzOiB7IHRoZW1lOiBuYW1lIH0gfSkuY2F0Y2goZnVuY3Rpb24oKXsgLyog4LmA4LiB4LmH4Lia4LmD4LiZ4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiB4LmH4Lie4LitICovIH0pOwogIH0KICBpZiAoIXF1',
  'aWV0KSB0b2FzdCgn4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LmA4Lib4LmH4LiZ4LiY4Li14LihJyArIChuYW1lID09PSAn4LiV4Liy4Lih4LmA4LiE4Lij4Li34LmI4Lit4LiHJyA/ICfguJXguLLguKHguYDguITguKPguLfguYjguK3guIcnIDogbmFtZSksICdvaycp',
  'OwogIGlmIChTLnBhZ2UgPT09ICdzZXR0aW5ncycpIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKfQoKLyoqIOC4m+C4uOC5iOC4oeC4muC4meC5geC4luC4muC4q+C4seC4pyDigJQg4Lin4LiZ4Liq4Lin4LmI4Liy4LiHIOKGkiDguKHguLfguJQg4oaSIOC4leC4suC4',
  'oeC5gOC4hOC4o+C4t+C5iOC4reC4hyAqLwpmdW5jdGlvbiBjeWNsZVRoZW1lKCl7CiAgdmFyIG9yZGVyID0gWyfguKrguKfguYjguLLguIcnLCAn4Lih4Li34LiUJywgJ+C4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hyddOwogIHZhciBpID0gb3JkZXIuaW5k',
  'ZXhPZihjdXJyZW50VGhlbWUoKSk7CiAgc2V0VGhlbWUob3JkZXJbKGkgKyAxKSAlIG9yZGVyLmxlbmd0aF0pOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4q+C4meC5ieC4suC4leC4seC5ieC4h+C4hOC5iOC4siAtLS0tLS0tLS0tLS0tLS0tICovCgpST1VURVMu',
  'c2V0dGluZ3MgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsKICAgIHJldHVybiBQcm9taXNlLmFsbChbCiAgICAgIGNhbGxBcGkoJ3NldHRpbmdzLmxpc3QnLCB7fSksCiAgICAgIGNhbGxBcGkoJ2F1dGguZGV2aWNlcycsIHt9KS5jYXRjaChmdW5jdGlvbigpeyByZXR1',
  'cm4gW107IH0pLAogICAgICAoUy5ib290ICYmIFMuYm9vdC5pc0FkbWluKSA/IGNhbGxBcGkoJ3VzZXIubGlzdCcsIHt9KS5jYXRjaChmdW5jdGlvbigpeyByZXR1cm4gW107IH0pIDogUHJvbWlzZS5yZXNvbHZlKG51bGwpLAogICAgICAoUy5ib290ICYmIFMuYm9v',
  'dC5pc0FkbWluKSA/IGNhbGxBcGkoJ3NoYXJlLmxpbmtzJywge30pLmNhdGNoKGZ1bmN0aW9uKCl7IHJldHVybiB7fTsgfSkgOiBQcm9taXNlLnJlc29sdmUoe30pCiAgICBdKS50aGVuKGZ1bmN0aW9uKHIpewogICAgICByZXR1cm4geyBzZXR0aW5nczogclswXSwg',
  'ZGV2aWNlczogclsxXSB8fCBbXSwgdXNlcnM6IHJbMl0sIGxpbmtzOiByWzNdIHx8IHt9LCB5ZWFyczogW10gfTsKICAgIH0pOwogIH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHJldHVybiAnJyArCiAgICAgIHNldHRpbmdzQWNjb3VudENhcmQoZCkgKwog',
  'ICAgICBzZXR0aW5nc1RoZW1lQ2FyZCgpICsKICAgICAgKGQuc2V0dGluZ3MuY2FuRWRpdCA/IHNldHRpbmdzR3JvdXBzSHRtbChkLnNldHRpbmdzKSA6IHNldHRpbmdzUmVhZE9ubHlOb3RlKCkpICsKICAgICAgLy8g4LmA4LiJ4Lie4Liy4Liw4Lic4Li54LmJ4LiU',
  '4Li54LmB4Lil4LiX4Li14LmI4LmA4Lir4LmH4LiZ4Liq4Lit4LiH4Liq4LmI4Lin4LiZ4LiZ4Li14LmJIOKAlCDguJXguLHguKfguIHguLLguKPguYzguJTguYDguJvguYfguJnguITguJnguJXguLHguJTguKrguLTguJnguYPguIjguYDguK3guIfguKfguYjguLLg',
  'uIjguLDguYHguKrguJTguIfguK3guLDguYTguKMKICAgICAgLy8g4LmA4Lie4Lij4Liy4Liw4Lir4LiZ4LmJ4Liy4LiV4Lix4Lin4Lit4Lii4LmI4Liy4LiH4LmB4Lia4Lia4LmE4Lif4Lil4LmM4LmA4LiU4Li14Lii4Lin4LmE4Lih4LmI4Lih4Li14Lia4Lix4LiN',
  '4LiK4Li14Lic4Li54LmJ4LmD4LiK4LmJ4LmD4Lir4LmJ4LmB4Liq4LiU4LiHIOC5geC4leC5iOC4ouC4seC4h+C4reC4ouC4suC4geC4muC4reC4geC4nOC4ueC5ieC5g+C4iuC5ieC4p+C5iOC4suC4oeC4teC4reC4sOC5hOC4o+C4muC5ieC4suC4hwogICAgICAo',
  'aXNBZG1pbk5vdygpID8gc2V0dGluZ3NVc2Vyc0NhcmQoZC51c2VycykgKyBzZXR0aW5nc1NoYXJlQ2FyZChkLmxpbmtzKSA6ICcnKTsKICB9Cn07CgovKiAtLS0tIOC4muC4seC4jeC4iuC4teC4guC4reC4h+C4ieC4seC4mSAtLS0tICovCgpmdW5jdGlvbiBzZXR0',
  'aW5nc0FjY291bnRDYXJkKGQpewogIHZhciBtZSA9IEFVVEgubWUgfHwge307CiAgdmFyIGRldmljZXMgPSBkLmRldmljZXMgfHwgW107CiAgcmV0dXJuIGNhcmQoJ/CfkaQg4Lia4Lix4LiN4LiK4Li14LiC4Lit4LiH4LiJ4Lix4LiZJywKICAgICc8ZGl2IGNsYXNz',
  'PSJncmlkIGcyIG1iMTIiPicgKwogICAgICBrcGkoJ+C5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4meC5g+C4meC4iuC4t+C5iOC4rScsIGVzYyhtZS5uYW1lIHx8IG1lLnVzZXJuYW1lIHx8ICfigJMnKSwgZXNjKG1lLnVzZXJuYW1lID8gJ0AnICsgbWUudXNl',
  'cm5hbWUgOiAobWUudmlhIHx8ICcnKSkpICsKICAgICAga3BpKCfguKrguLTguJfguJjguLTguYzguIHguLLguKPguYPguIrguYnguIfguLLguJknLCBlc2MobWUucm9sZSB8fCAn4oCTJyksCiAgICAgICAgICBtZS5jYW5FZGl0ID8gJ+C5gOC4nuC4tOC5iOC4oSDg',
  'uYHguIHguYnguYTguIIg4LmB4Lil4Liw4Lil4Lia4LiC4LmJ4Lit4Lih4Li54Lil4LmE4LiU4LmJJyA6ICfguYDguJvguLTguJTguJTguLnguYTguJTguYnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcnKSArCiAgICAnPC9kaXY+JyArCiAgICAnPGRpdiBj',
  'bGFzcz0icm93Ij4nICsKICAgICAgKG1lLnVzZXJuYW1lID8gJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iZm9ybUNoYW5nZVBhc3N3b3JkKCkiPvCflJEg4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZPC9idXR0b24+JyA6',
  'ICcnKSArCiAgICAgIChtZS51c2VybmFtZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImZvcm1TZXRQaW4oKSI+8J+UoiAnICsKICAgICAgICAoQVVUSC5kZXZpY2UgPyAn4LiV4Lix4LmJ4LiHIFBJTiDguYPguKvguKHguYjguJrguJnguYDguITguKPg',
  'uLfguYjguK3guIfguJnguLXguYknIDogJ+C4leC4seC5ieC4hyBQSU4g4Liq4Liz4Lir4Lij4Lix4Lia4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJJykgKyAnPC9idXR0b24+JyA6ICcnKSArCiAgICAgIChBVVRILmRldmljZSA/ICc8YnV0dG9uIGNsYXNz',
  'PSJidG4gZGdyIiBvbmNsaWNrPSJmb3JnZXRUaGlzRGV2aWNlKCkiPuC4peC4miBQSU4g4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJPC9idXR0b24+JyA6ICcnKSArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNvbmZpcm1Mb2dvdXQo',
  'KSI+8J+aqiDguK3guK3guIHguIjguLLguIHguKPguLDguJrguJo8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nICsKICAgIChkZXZpY2VzLmxlbmd0aAogICAgICA/ICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+PGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtYjgiPuC4reC4',
  'uOC4m+C4geC4o+C4k+C5jOC4l+C4teC5iOC4leC4seC5ieC4hyBQSU4g4LmE4Lin4LmJICgnICsgZGV2aWNlcy5sZW5ndGggKyAnKTwvZGl2PicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOmF1dG8i',
  'Pjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guK3guLjguJvguIHguKPguJPguYw8L3RoPjx0aD7guJXguLHguYnguIfguYDguKHguLfguYjguK08L3RoPjx0aD7guYPguIrguYnguKXguYjguLLguKrguLjguJQ8L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyAr',
  'CiAgICAgICAgZGV2aWNlcy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgICAgICByZXR1cm4gJzx0cj48dGQ+JyArIGVzYyh4LmRldmljZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIHRoRGF0ZVNob3J0KFN0cmluZyh4LmNyZWF0',
  'ZWRBdCkuc2xpY2UoMCwxMCkpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyB0aERhdGVTaG9ydChTdHJpbmcoeC5sYXN0U2Vlbikuc2xpY2UoMCwxMCkpICsgJzwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwv',
  'dGJvZHk+PC90YWJsZT48L2Rpdj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPjxidXR0b24gY2xhc3M9ImJ0biBkZ3Igc20iIG9uY2xpY2s9ImRvRm9yZ2V0QWxsRGV2aWNlcygpIj7guKLguIHguYDguKXguLTguIEgUElOIOC4l+C4uOC4geC5gOC4',
  'hOC4o+C4t+C5iOC4reC4hzwvYnV0dG9uPjwvZGl2PicKICAgICAgOiAnJykpOwp9CgpmdW5jdGlvbiBkb0ZvcmdldEFsbERldmljZXMoKXsKICBjb25maXJtQWN0aW9uKCfguKLguIHguYDguKXguLTguIEgUElOIOC4muC4meC4l+C4uOC4geC5gOC4hOC4o+C4t+C5',
  'iOC4reC4h+C5g+C4iuC5iOC5hOC4q+C4oSDigJQg4LiX4Li44LiB4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiI4Liw4LiV4LmJ4Lit4LiH4Lil4LmH4Lit4LiB4Lit4Li04LiZ4LiU4LmJ4Lin4Lii4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmIJywg',
  'ZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2F1dGguZm9yZ2V0QWxsRGV2aWNlcycsIHt9KS50aGVuKGZ1bmN0aW9uKG4pewogICAgICBzYXZlRGV2aWNlKCcnKTsKICAgICAgdG9hc3QoJ+C4ouC4geC5gOC4peC4tOC4gSBQSU4g4LmB4Lil4LmJ4LinICcgKyBuICsg',
  'JyDguYDguITguKPguLfguYjguK3guIcnLCAnb2snKTsKICAgICAgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7IH0pOwogIH0pOwp9CgovKiAtLS0tIOC4mOC4teC4oSAt',
  'LS0tICovCgpmdW5jdGlvbiBzZXR0aW5nc1RoZW1lQ2FyZCgpewogIHZhciBjdXIgPSBjdXJyZW50VGhlbWUoKTsKICByZXR1cm4gY2FyZCgn8J+OqCDguJjguLXguKHguKrguLXguKvguJnguYnguLLguIjguK0nLAogICAgJzxkaXYgY2xhc3M9InRoZW1lLXBpY2si',
  'PicgKyBUSEVNRVMubWFwKGZ1bmN0aW9uKHQpewogICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9InRoZW1lLW9wdCcgKyAodC5pZCA9PT0gY3VyID8gJyBvbicgOiAnJykgKyAnIiBvbmNsaWNrPSJzZXRUaGVtZShcJycgKyB0LmlkICsgJ1wnKSI+JyArCiAgICAg',
  'ICAgJzxzcGFuIGNsYXNzPSJpYyI+JyArIHQuaWMgKyAnPC9zcGFuPicgKwogICAgICAgICc8Yj4nICsgZXNjKHQuaWQpICsgJzwvYj4nICsKICAgICAgICAnPHNwYW4gY2xhc3M9ImhpbnQiPicgKyBlc2ModC5oaW50KSArICc8L3NwYW4+JyArCiAgICAgICc8L2J1',
  'dHRvbj4nOwogICAgfSkuam9pbignJykgKyAnPC9kaXY+JyArCiAgICAnPHAgY2xhc3M9ImZzMTIgbXV0ZWQgbXQxMiI+4LiY4Li14Lih4LiI4Liz4LmB4Lii4LiB4Lij4Liy4Lii4LmA4LiE4Lij4Li34LmI4Lit4LiHIOC5gOC4m+C4peC4teC5iOC4ouC4meC4l+C4',
  'teC5iOC4meC4teC5iOC4q+C4o+C4t+C4reC4geC4lOC4m+C4uOC5iOC4oeC4o+C4ueC4m+C4nuC4o+C4sOC4reC4suC4l+C4tOC4leC4ouC5jC/guJ7guKPguLDguIjguLHguJnguJfguKPguYzguKHguLjguKHguILguKfguLLguJrguJnguIHguYfguYTguJTguYkn',
  'ICsKICAgIChTLmJvb3QgJiYgUy5ib290LmlzQWRtaW4gPyAnIMK3IOC4hOC5iOC4suC4l+C4teC5iOC4nOC4ueC5ieC4lOC4ueC5geC4peC5gOC4peC4t+C4reC4geC4iOC4sOC5gOC4m+C5h+C4meC4hOC5iOC4suC4leC4seC5ieC4h+C4leC5ieC4meC5g+C4q+C5',
  'ieC5gOC4hOC4o+C4t+C5iOC4reC4h+C4l+C4teC5iOC4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4leC4seC5ieC4hycgOiAnJykgKyAnPC9wPicpOwp9CgovKiAtLS0tIOC4geC4peC4uOC5iOC4oeC4hOC5iOC4suC4leC4seC5ieC4h+C4hOC5iOC4siAtLS0t',
  'ICovCgpmdW5jdGlvbiBzZXR0aW5nc1JlYWRPbmx5Tm90ZSgpewogIHJldHVybiBjYXJkKCfimpnvuI8g4LiB4Liy4Lij4LiV4Lix4LmJ4LiH4LiE4LmI4Liy4Lij4Liw4Lia4LiaJywKICAgICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj7wn5SS',
  'PC9kaXY+4LmA4LiJ4Lie4Liy4Liw4Lic4Li54LmJ4LiU4Li54LmB4Lil4LmA4LiX4LmI4Liy4LiZ4Lix4LmJ4LiZ4LiX4Li14LmI4LmB4LiB4LmJ4LiB4Liy4Lij4LiV4Lix4LmJ4LiH4LiE4LmI4Liy4Lij4Liw4Lia4Lia4LmE4LiU4LmJPC9kaXY+Jyk7Cn0KCmZ1',
  'bmN0aW9uIHNldHRpbmdzR3JvdXBzSHRtbChzKXsKICByZXR1cm4gcy5ncm91cHMubWFwKGZ1bmN0aW9uKGcpewogICAgcmV0dXJuIGNhcmQoZy5pY29uICsgJyAnICsgZy5ncm91cCwKICAgICAgJzxkaXYgY2xhc3M9ImZncmlkIj4nICsgZy5pdGVtcy5tYXAoc2V0',
  'dGluZ0ZpZWxkSHRtbCkuam9pbignJykgKyAnPC9kaXY+Jyk7CiAgfSkuam9pbignJykgKwogIGNhcmQoJ/Cfkr4g4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4LiV4Lix4LmJ4LiH4LiE4LmI4LiyJywKICAgICc8cCBjbGFzcz0iZnMxMyBtdXRlZCI+JyArIGVz',
  'YyhzLnNlY3JldE5vdGUpICsgJzwvcD4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJzYXZlU2V0dGluZ3NGb3JtKCkiPuC4muC4seC4meC4l+C4tuC4geC4l+C4seC5ieC4h+C4',
  'q+C4oeC4lDwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJsb2FkKCkiPuC4ouC4geC5gOC4peC4tOC4geC4geC4suC4o+C5geC4geC5ieC5hOC4gjwvYnV0dG9uPicgKwogICAgJzwvZGl2PicpOwp9CgpmdW5jdGlvbiBzZXR0',
  'aW5nRmllbGRIdG1sKGl0KXsKICB2YXIgaWQgPSAnc18nICsgaXQua2V5OwogIHZhciBpbm5lcjsKICBpZiAoaXQucmVhZE9ubHkpIHsKICAgIGlubmVyID0gJzxkaXYgY2xhc3M9ImlucCIgc3R5bGU9ImJhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKTtjdXJzb3I6',
  'ZGVmYXVsdCI+JyArIGVzYyhpdC52YWx1ZSkgKyAnPC9kaXY+JzsKICB9IGVsc2UgaWYgKGl0LnR5cGUgPT09ICdzZWxlY3QnKSB7CiAgICAvLyDguJ3guLHguYjguIfguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYzguKrguYjguIfguKHguLLguYDguJvg',
  'uYfguJkge3ZhbHVlLGxhYmVsfSDguYDguKrguKHguK0g4oCUIOC4hOC5iOC4suC4l+C4teC5iOC5gOC4geC5h+C4muC4geC4seC4muC4guC5ieC4reC4hOC4p+C4suC4oeC4l+C4teC5iOC5gOC4q+C5h+C4meC4reC4suC4iOC4hOC4meC4peC4sOC4reC4seC4mQog',
  'ICAgaW5uZXIgPSAnPHNlbGVjdCBjbGFzcz0ic2VsIiBpZD0iJyArIGlkICsgJyI+JyArIChpdC5vcHRpb25zIHx8IFtdKS5tYXAoZnVuY3Rpb24obyl7CiAgICAgIHJldHVybiAnPG9wdGlvbiB2YWx1ZT0iJyArIGVzYyhvLnZhbHVlKSArICciJyArIChvLnZhbHVl',
  'ID09PSBpdC52YWx1ZSA/ICcgc2VsZWN0ZWQnIDogJycpICsKICAgICAgICAgICAgICc+JyArIGVzYyhvLmxhYmVsKSArICc8L29wdGlvbj4nOwogICAgfSkuam9pbignJykgKyAnPC9zZWxlY3Q+JzsKICB9IGVsc2UgaWYgKGl0LnR5cGUgPT09ICdtdWx0aWxpbmUn',
  'KSB7CiAgICBpbm5lciA9ICc8dGV4dGFyZWEgY2xhc3M9InRhIiBpZD0iJyArIGlkICsgJyI+JyArIGVzYyhpdC52YWx1ZSkgKyAnPC90ZXh0YXJlYT4nOwogIH0gZWxzZSBpZiAoaXQudHlwZSA9PT0gJ251bWJlcicpIHsKICAgIGlubmVyID0gJzxpbnB1dCB0eXBl',
  'PSJudW1iZXIiIGNsYXNzPSJpbnAiIGlkPSInICsgaWQgKyAnIiB2YWx1ZT0iJyArIGVzYyhpdC52YWx1ZSkgKyAnIiBpbnB1dG1vZGU9ImRlY2ltYWwiJyArCiAgICAgIChpdC5taW4gIT0gbnVsbCA/ICcgbWluPSInICsgZXNjKGl0Lm1pbikgKyAnIicgOiAnJykg',
  'KyAoaXQubWF4ICE9IG51bGwgPyAnIG1heD0iJyArIGVzYyhpdC5tYXgpICsgJyInIDogJycpICsgJz4nICsKICAgICAgKGl0Lm1pbiAhPSBudWxsICYmIGl0Lm1heCAhPSBudWxsID8gJzxkaXYgY2xhc3M9ImhpbnQiPuC5g+C4quC5iOC5hOC4lOC5iSAnICsgZXNj',
  'KGl0Lm1pbikgKyAn4oCTJyArIGVzYyhpdC5tYXgpICsgJzwvZGl2PicgOiAnJyk7CiAgfSBlbHNlIHsKICAgIGlubmVyID0gJzxpbnB1dCB0eXBlPSJ0ZXh0IiBjbGFzcz0iaW5wIiBpZD0iJyArIGlkICsgJyIgdmFsdWU9IicgKyBlc2MoaXQudmFsdWUpICsgJyI+',
  'JzsKICB9CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJmJyArIChpdC50eXBlID09PSAnbXVsdGlsaW5lJyA/ICcgZnVsbCcgOiAnJykgKyAnIj4nICsKICAgICc8bGFiZWwgZm9yPSInICsgaWQgKyAnIj4nICsgZXNjKGl0LmxhYmVsKSArICc8L2xhYmVsPicgKyBpbm5l',
  'ciArCiAgICAoaXQubm90ZSA/ICc8ZGl2IGNsYXNzPSJoaW50Ij4nICsgZXNjKGl0Lm5vdGUpICsgJzwvZGl2PicgOiAnJykgKyAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gc2F2ZVNldHRpbmdzRm9ybSgpewogIHZhciB2YWxzID0ge307CiAgdmFyIGRhdGEgPSBTLmNh',
  'Y2hlLnNldHRpbmdzOwogIGlmICghZGF0YSkgcmV0dXJuOwogIGRhdGEuc2V0dGluZ3MuZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24oZyl7CiAgICBnLml0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXQpewogICAgICBpZiAoaXQucmVhZE9ubHkpIHJldHVybjsKICAgICAg',
  'dmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NfJyArIGl0LmtleSk7CiAgICAgIGlmIChlbCkgdmFsc1tpdC5rZXldID0gZWwudmFsdWU7CiAgICB9KTsKICB9KTsKICBjYWxsQXBpKCdzZXR0aW5ncy5zYXZlJywgeyB2YWx1ZXM6IHZhbHMgfSkudGhl',
  'bihmdW5jdGlvbihyKXsKICAgIGlmICh2YWxzLnRoZW1lKSB7IGxzU2V0KExTX1RIRU1FLCB2YWxzLnRoZW1lKTsgYXBwbHlUaGVtZSh2YWxzLnRoZW1lKTsgfQogICAgdG9hc3Qoci5zYXZlZCA/ICfguJrguLHguJnguJfguLbguIHguYHguKXguYnguKcgJyArIHIu',
  'c2F2ZWQgKyAnIOC4o+C4suC4ouC4geC4suC4oycgOiAn4LmE4Lih4LmI4Lih4Li14Lit4Liw4LmE4Lij4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LmB4Lib4Lil4LiHJywgJ29rJyk7CiAgICAvLyDguITguYjguLLguJrguLLguIfguJXguLHguKcgKOC4o+C4reC4muC4',
  'o+C4teC5gOC4n+C4o+C4iiDguIrguLfguYjguK3guK3guLLguITguLLguKMpIOC4oeC4teC4nOC4peC4geC4seC4muC4l+C4seC5ieC4h+C4q+C4meC5ieC4siDguIjguLbguIfguYLguKvguKXguJTguYPguKvguKHguYjguJfguLHguYnguIfguIrguLjguJQKICAg',
  'IHJldHVybiBjYWxsQXBpKCdhcHAuYm9vdHN0cmFwJykudGhlbihmdW5jdGlvbihiKXsgUy5ib290ID0gYjsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9KTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlIHx8IGUsICdlcnInKTsgfSk7Cn0K',
  'Ci8qIC0tLS0g4LiI4Lix4LiU4LiB4Liy4Lij4Lic4Li54LmJ4LmD4LiK4LmJICjguJzguLnguYnguJTguLnguYHguKXguYDguJfguYjguLLguJnguLHguYnguJkpIC0tLS0gKi8KCmZ1bmN0aW9uIGlzQWRtaW5Ob3coKXsKICByZXR1cm4gISEoUy5ib290ICYmIFMu',
  'Ym9vdC5pc0FkbWluKTsKfQoKZnVuY3Rpb24gc2V0dGluZ3NVc2Vyc0NhcmQodXNlcnMpewogIGlmICghdXNlcnMpIHJldHVybiAnJzsKICByZXR1cm4gY2FyZCgn8J+RpSDguJzguLnguYnguYPguIrguYnguYPguJnguKPguLDguJrguJogKCcgKyB1c2Vycy5sZW5n',
  'dGggKyAnKScsCiAgICAnPHAgY2xhc3M9ImZzMTMgbXV0ZWQiPuC5geC4iOC4geC4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5ieC5geC4peC4sOC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C5ieC4hOC4meC4reC4t+C5iOC4meC5gOC4guC5ieC4suC4',
  'oeC4suC4lOC4ueC4q+C4o+C4t+C4reC4iuC5iOC4p+C4ouC5geC4geC5ieC4guC5ieC4reC4oeC4ueC4peC5hOC4lOC5iSAnICsKICAgICfguJXguLHguYnguIfguKrguLTguJfguJjguLTguYzguYHguKLguIHguKPguLLguKLguITguJkg4LmB4Lil4Liw4Lij4Liw',
  '4LiH4Lix4Lia4LmE4LiU4LmJ4LiX4Li44LiB4LmA4Lih4Li34LmI4LitPC9wPicgKwogICAgJzxkaXYgY2xhc3M9InR3IG10MTIiPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsKICAgICAgJzx0aD7guIrguLfguYjguK3guJzguLnguYnguYPguIrguYk8',
  'L3RoPjx0aD7guIrguLfguYjguK3guJfguLXguYjguYHguKrguJTguIc8L3RoPjx0aD7guKrguLTguJfguJjguLTguYw8L3RoPjx0aD7guKrguJbguLLguJnguLA8L3RoPjx0aD7guYDguILguYnguLLguKXguYjguLLguKrguLjguJQ8L3RoPicgKwogICAgICAnPHRo',
  'IGNsYXNzPSJudW0iPuC4reC4uOC4m+C4geC4o+C4k+C5jDwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgIHVzZXJzLm1hcChmdW5jdGlvbih1KXsKICAgICAgdmFyIG1lTm93ID0gKEFVVEgubWUgJiYgQVVUSC5tZS51c2VybmFtZSkgPT09',
  'IHUudXNlcm5hbWU7CiAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICc8dGQ+PGI+JyArIGVzYyh1LnVzZXJuYW1lKSArICc8L2I+JyArIChtZU5vdyA/ICcgPHNwYW4gY2xhc3M9ImIgaW5mbyI+4LiE4Li44LiTPC9zcGFuPicgOiAnJykgKyAnPC90ZD4nICsK',
  'ICAgICAgICAnPHRkPicgKyBlc2ModS5uYW1lIHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICc8dGQ+JyArIHJvbGVCYWRnZSh1LnJvbGUpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZD4nICsgc3RhdHVzQmFkZ2UodS5zdGF0dXMpICsgKHUubG9ja2VkID8g',
  'JyA8c3BhbiBjbGFzcz0iYiBkZ3IiPuC4luC4ueC4geC4peC5h+C4reC4geC4iuC4seC5iOC4p+C4hOC4o+C4suC4pzwvc3Bhbj4nIDogJycpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArICh1Lmxhc3RMb2dpbiA/IHRoRGF0ZVNob3J0',
  'KFN0cmluZyh1Lmxhc3RMb2dpbikuc2xpY2UoMCwxMCkpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHUuZGV2aWNlcyB8fCAwKSArICc8L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9InQtYWN0aW9ucyI+JyArCiAg',
  'ICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJmb3JtVXNlcignICsgYXR0cih1KSArICcpIj7guYHguIHguYnguYTguII8L2J1dHRvbj4nICsKICAgICAgICAgIChtZU5vdyA/ICcnIDogJzxidXR0b24gY2xhc3M9ImJ0biBzbSBkZ3IiIG9u',
  'Y2xpY2s9ImRlbFVzZXIoJyArIGpzcSh1LnVzZXJuYW1lKSArICcpIj7guKXguJo8L2J1dHRvbj4nKSArCiAgICAgICAgJzwvdGQ+PC90cj4nOwogICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicsCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRu',
  'IHByaSBzbSIgb25jbGljaz0iZm9ybVVzZXIoKSI+KyDguYDguJ7guLTguYjguKHguJzguLnguYnguYPguIrguYk8L2J1dHRvbj4nKTsKfQoKZnVuY3Rpb24gcm9sZUJhZGdlKHJvbGUpewogIHZhciBjbHMgPSByb2xlID09PSAn4Lic4Li54LmJ4LiU4Li54LmB4Lil',
  'JyA/ICdvaycgOiAocm9sZSA9PT0gJ+C5geC4geC5ieC5hOC4guC5hOC4lOC5iScgPyAnaW5mbycgOiAnbXV0ZScpOwogIHJldHVybiAnPHNwYW4gY2xhc3M9ImIgJyArIGNscyArICciPicgKyBlc2Mocm9sZSkgKyAnPC9zcGFuPic7Cn0KCi8vIOC4q+C4oeC4suC4',
  'ouC5gOC4q+C4leC4uDog4LmD4LiK4LmJIGF0dHIoKSDguJXguLHguKfguYDguJTguLXguKLguKfguIHguLHguJrguJfguLXguYggVmlld3MuaHRtbCDguJvguKPguLDguIHguLLguKjguYTguKfguYkKLy8g4LmA4LiE4Lii4Lib4Lij4Liw4LiB4Liy4Lio4LiK4Li3',
  '4LmI4Lit4LiL4LmJ4Liz4LmE4Lin4LmJ4LiV4Lij4LiH4LiZ4Li14LmJ4LiE4Lij4Lix4LmJ4LiH4Lir4LiZ4Li24LmI4LiHIOC5geC4peC5ieC4p+C5hOC4m+C4l+C4seC4muC4guC4reC4h+C5gOC4lOC4tOC4oeC4iOC4meC4m+C4uOC5iOC4oeC5geC4geC5ieC5',
  'hOC4guC4l+C4seC5ieC4h+C4o+C4sOC4muC4muC4nuC4seC4hwovLyAo4Lif4Lit4Lij4LmM4Lih4LiC4Li24LmJ4LiZ4Lin4LmI4Liy4LiHIOC5geC4peC4sOC4geC4lOC4muC4seC4meC4l+C4tuC4geC4geC4peC4suC4ouC5gOC4m+C5h+C4meC4quC4o+C5ieC4',
  'suC4h+C4o+C4suC4ouC4geC4suC4o+C5g+C4q+C4oeC5iOC5geC4l+C4meC4geC4suC4o+C5geC4geC5ieC4guC4reC4h+C5gOC4lOC4tOC4oSkKCmZ1bmN0aW9uIGZvcm1Vc2VyKGpzb24pewogIHZhciB1ID0ganNvbiA/ICh0eXBlb2YganNvbiA9PT0gJ3N0cmlu',
  'ZycgPyBKU09OLnBhcnNlKGpzb24pIDoganNvbikgOiB7fTsKICB2YXIgaXNOZXcgPSAhdS51c2VybmFtZTsKCiAgb3BlbkZvcm0oewogICAgdGl0bGU6IGlzTmV3ID8gJ+C5gOC4nuC4tOC5iOC4oeC4nOC4ueC5ieC5g+C4iuC5ieC5g+C4q+C4oeC5iCcgOiAn4LmB',
  '4LiB4LmJ4LmE4LiC4Lic4Li54LmJ4LmD4LiK4LmJICcgKyB1LnVzZXJuYW1lLAogICAgYWN0aW9uOiAndXNlci5zYXZlJywKICAgIHJlY29yZDogT2JqZWN0LmFzc2lnbih7IGlkOiBpc05ldyA/ICcnIDogdS51c2VybmFtZSwgcm9sZTogJ+C4lOC4ueC4reC4ouC5',
  'iOC4suC4h+C5gOC4lOC4teC4ouC4pycsIHN0YXR1czogJ+C5g+C4iuC5ieC4h+C4suC4mScgfSwgdSksCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3VzZXJuYW1lJywgbGFiZWw6J+C4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5iSAo4Lig4Liy4Lip4Liy',
  '4Lit4Lix4LiH4LiB4Lik4LipKScsIHJlcXVpcmVkOmlzTmV3LCBwaDon4LmA4LiK4LmI4LiZIHNvbWNoYWknLAogICAgICAgIGhpbnQ6IGlzTmV3ID8gJ2EteiAwLTkgLiBfIC0g4Lii4Liy4LinIDPigJMyNCDguJXguLHguKcgwrcg4LmA4Lib4Lil4Li14LmI4Lii',
  '4LiZ4Lig4Liy4Lii4Lir4Lil4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJJyA6ICfguYDguJvguKXguLXguYjguKLguJnguIrguLfguYjguK3guJzguLnguYnguYPguIrguYnguYTguKHguYjguYTguJTguYknIH0sCiAgICAgIHsga2V5OiduYW1lJywgbGFiZWw6J+C4',
  'iuC4t+C5iOC4reC4l+C4teC5iOC5geC4quC4lOC4hycsIHJlcXVpcmVkOnRydWUsIHBoOifguYDguIrguYjguJkg4Liq4Lih4LiK4Liy4LiiJyB9LAogICAgICB7IGtleToncm9sZScsIGxhYmVsOifguKrguLTguJfguJjguLTguYzguIHguLLguKPguYPguIrguYng',
  'uIfguLLguJknLCB0eXBlOidzZWxlY3QnLCBibGFuazpmYWxzZSwgcmVxdWlyZWQ6dHJ1ZSwKICAgICAgICBvcHRpb25zOlsn4LiU4Li54Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinJywn4LmB4LiB4LmJ4LmE4LiC4LmE4LiU4LmJJywn4Lic4Li54LmJ4LiU',
  '4Li54LmB4LilJ10sCiAgICAgICAgaGludDon4LiU4Li54Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinID0g4LmA4Lib4Li04LiU4LiU4Li54LmE4LiU4LmJ4LiX4Li44LiB4Lir4LiZ4LmJ4LiyIMK3IOC5geC4geC5ieC5hOC4guC5hOC4lOC5iSA9IOC5gOC4',
  'nuC4tOC5iOC4oS/guYHguIHguYkv4Lil4Lia4LiC4LmJ4Lit4Lih4Li54LilIMK3IOC4nOC4ueC5ieC4lOC4ueC5geC4pSA9IOC4iOC4seC4lOC4geC4suC4o+C4nOC4ueC5ieC5g+C4iuC5ieC5geC4peC4sOC4geC4suC4o+C4leC4seC5ieC4h+C4hOC5iOC4suC5',
  'hOC4lOC5ieC4lOC5ieC4p+C4oicgfSwKICAgICAgeyBrZXk6J3Bhc3N3b3JkJywgbGFiZWw6IGlzTmV3ID8gJ+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC5gOC4o+C4tOC5iOC4oeC4leC5ieC4mScgOiAn4LiV4Lix4LmJ4LiH4Lij4Lir4Lix4Liq4Lic4LmI4Liy',
  '4LiZ4LmD4Lir4Lih4LmIICjguYDguKfguYnguJnguKfguYjguLLguIcgPSDguYTguKHguYjguYDguJvguKXguLXguYjguKLguJkpJywKICAgICAgICByZXF1aXJlZDppc05ldywgcGg6J+C4reC4ouC5iOC4suC4h+C4meC5ieC4reC4oiA4IOC4leC4seC4p+C4reC4',
  'seC4geC4qeC4oycsCiAgICAgICAgaGludDon4LiI4LiU4LmE4Lin4LmJ4Liq4LmI4LiH4LmD4Lir4LmJ4LmA4LiI4LmJ4Liy4LiV4Lix4LinIOKAlCDguKPguLDguJrguJrguYDguIHguYfguJrguYHguJrguJrguYDguILguYnguLLguKPguKvguLHguKog4LmA4Lib',
  '4Li04LiU4LiU4Li54Lii4LmJ4Lit4LiZ4Lir4Lil4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJJyB9LAogICAgICB7IGtleTonbXVzdENoYW5nZScsIGxhYmVsOifguYPguKvguYnguYDguJvguKXguLXguYjguKLguJnguKPguKvguLHguKrguJzguYjguLLguJnguJXg',
  'uK3guJnguYDguILguYnguLLguITguKPguLHguYnguIfguYHguKPguIEnLCB0eXBlOidzZWxlY3QnLCBibGFuazpmYWxzZSwKICAgICAgICBvcHRpb25zOlt7dmFsdWU6J3RydWUnLGxhYmVsOifguYPguIrguYggKOC5geC4meC4sOC4meC4syknfSx7dmFsdWU6J2Zh',
  'bHNlJyxsYWJlbDon4LmE4Lih4LmI4LiV4LmJ4Lit4LiHJ31dIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0JywgYmxhbms6ZmFsc2UsIG9wdGlvbnM6WyfguYPguIrguYnguIfguLLguJknLCfguKPg',
  'uLDguIfguLHguJonXSwKICAgICAgICBoaW50OifguKPguLDguIfguLHguJogPSDguYDguILguYnguLLguKPguLDguJrguJrguYTguKHguYjguYTguJTguYnguJfguLHguJnguJfguLUg4LmB4LiV4LmI4Lii4Lix4LiH4LmA4LiB4LmH4Lia4Lia4Lix4LiN4LiK4Li1',
  '4LmE4Lin4LmJJyB9LAogICAgICB7IGtleTonbm90ZScsIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdLAogICAgd2lkZTogdHJ1ZQogIH0pOwoKICAvLyDguIrguLfguYjguK3guJzguLng',
  'uYnguYPguIrguYnguYDguJvguKXguLXguYjguKLguJnguYTguKHguYjguYTguJTguYkg4Lil4LmH4Lit4LiB4LiK4LmI4Lit4LiH4LmE4Lin4LmJ4LmA4Lil4Lii4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4LmA4LiC4LmJ4Liy4LmD4LiI4Lic4Li04LiUCiAgaWYg',
  'KCFpc05ldykgewogICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfdXNlcm5hbWUnKTsKICAgIGlmIChlbCkgeyBlbC5yZWFkT25seSA9IHRydWU7IGVsLnN0eWxlLmJhY2tncm91bmQgPSAndmFyKC0tc3VyZmFjZS0yKSc7IH0KICB9Cn0KCmZ1',
  'bmN0aW9uIGRlbFVzZXIodXNlcm5hbWUpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4nOC4ueC5ieC5g+C4iuC5iSAiJyArIHVzZXJuYW1lICsgJyIg4LmD4LiK4LmI4LmE4Lir4LihIOKAlCDguYDguILguYnguLLguKPguLDguJrguJrguYTguKHguYjguYTguJTg',
  'uYnguK3guLXguIHguJfguLHguJnguJfguLUnLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgndXNlci5kZWxldGUnLCB7IHVzZXJuYW1lOiB1c2VybmFtZSB9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICAgIHRvYXN0KCfguKXguJrguJzguLnguYnguYPguIrguYnguYHg',
  'uKXguYnguKcnLCAnb2snKTsKICAgICAgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7IH0pOwogIH0pOwp9CgovKiAtLS0tIOC4peC4tOC4h+C4geC5jOC5gOC4guC5ieC4',
  'suC5g+C4iuC5ieC4h+C4suC4mSAtLS0tICovCgpmdW5jdGlvbiBzZXR0aW5nc1NoYXJlQ2FyZChsaW5rcyl7CiAgaWYgKCFsaW5rcyB8fCAhbGlua3MuYXBwVXJsKSB7CiAgICByZXR1cm4gY2FyZCgn8J+UlyDguKXguLTguIfguIHguYzguYDguILguYnguLLguYPg',
  'uIrguYnguIfguLLguJknLAogICAgICAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C4q+C4suC4peC4tOC4h+C4geC5jOC4iOC4o+C4tOC4h+C5hOC4oeC5iOC5gOC4iOC4rSDigJQg4LmA4Lib4Li04LiU4LmA4Lin4LmH4Lia4LmB4Lit4Lib4LiI4Liy4LiB',
  '4Lil4Li04LiH4LiB4LmM4LiX4Li14LmI4Lil4LiH4LiX4LmJ4Liy4LiiIC9leGVjIOC4quC4seC4geC4hOC4o+C4seC5ieC4hyDguYHguKXguYnguKfguKPguLDguJrguJrguIjguLDguIjguLPguYPguKvguYnguYDguK3guIc8L2Rpdj4nKTsKICB9CiAgcmV0dXJu',
  'IGNhcmQoJ/CflJcg4Lil4Li04LiH4LiB4LmM4LmA4LiC4LmJ4Liy4LmD4LiK4LmJ4LiH4Liy4LiZJywKICAgICc8ZGl2IGNsYXNzPSJmIG1iMTIiPjxsYWJlbD7guKXguLTguIfguIHguYzguKvguKXguLHguIEg4oCUIOC4quC5iOC4h+C5g+C4q+C5ieC4l+C4uOC4',
  'geC4hOC4meC5hOC4lOC5iSAo4LmA4LiC4LmJ4Liy4LiU4LmJ4Lin4Lii4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmB4Lil4Liw4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZKTwvbGFiZWw+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImFw',
  'cFVybCIgcmVhZG9ubHkgdmFsdWU9IicgKyBlc2MobGlua3MuYXBwVXJsKSArICciIG9uY2xpY2s9InRoaXMuc2VsZWN0KCkiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InJvdyBtYjEyIj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xp',
  'Y2s9ImNvcHlGaWVsZChcJ2FwcFVybFwnKSI+8J+TiyDguITguLHguJTguKXguK3guIHguKXguLTguIfguIHguYzguKvguKXguLHguIE8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFz',
  'cz0iZiBtYjEyIj48bGFiZWw+8J+RgCDguKXguLTguIfguIHguYzguJTguLnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKfguYHguJrguJrguYTguKHguYjguJXguYnguK3guIfguKXguYfguK3guIHguK3guLTguJk8L2xhYmVsPicgKwogICAgICAnPGlucHV0',
  'IGNsYXNzPSJpbnAiIGlkPSJzaGFyZVVybCIgcmVhZG9ubHkgdmFsdWU9IicgKyBlc2MobGlua3Mudmlld1VybCkgKyAnIiBvbmNsaWNrPSJ0aGlzLnNlbGVjdCgpIj48L2Rpdj4nICsKICAgICc8cCBjbGFzcz0iZnMxMiAnICsgKGxpbmtzLnNoYXJlRW5hYmxlZCA/',
  'ICdtdXRlZCcgOiAnd2Fybi10ZXh0JykgKyAnIj4nICsKICAgICAgKGxpbmtzLnNoYXJlRW5hYmxlZAogICAgICAgID8gJ+C5gOC4m+C4tOC4lOC4reC4ouC4ueC5iCDigJQg4LmD4LiE4Lij4LiB4LmH4LiV4Liy4Lih4LiX4Li14LmI4Lih4Li14Lil4Li04LiH4LiB',
  '4LmM4LiZ4Li14LmJ4LmA4Lib4Li04LiU4LiU4Li54LiC4LmJ4Lit4Lih4Li54Lil4LmE4LiU4LmJ4LmC4LiU4Lii4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4Lil4LmH4Lit4LiB4Lit4Li04LiZJwogICAgICAgIDogJ+KaoO+4jyDguJvguLTguJTguK3guKLguLnguYgg',
  '4oCUIOC4peC4tOC4h+C4geC5jOC4meC4teC5ieC4ouC4seC4h+C5g+C4iuC5ieC5hOC4oeC5iOC5hOC4lOC5iSDguYDguJvguLTguJTguKrguKfguLTguJXguIrguYzguYTguJTguYnguJfguLXguYjguKvguLHguKfguILguYnguK0gIuC4hOC4p+C4suC4oeC4m+C4',
  'peC4reC4lOC4oOC4seC4ouC5geC4peC4sOC4geC4suC4o+C5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4mSIg4LiU4LmJ4Liy4LiZ4Lia4LiZJykgKwogICAgJzwvcD4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQxMiI+JyArCiAgICAgICc8YnV0dG9uIGNs',
  'YXNzPSJidG4iIG9uY2xpY2s9ImNvcHlGaWVsZChcJ3NoYXJlVXJsXCcpIj7wn5OLIOC4hOC4seC4lOC4peC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jDwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIGRnciIgb25jbGljaz0iZG9S',
  'b3RhdGVTaGFyZSgpIj7wn5SBIOC4reC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC5g+C4q+C4oeC5iDwvYnV0dG9uPicgKwogICAgJzwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImhyIj48L2Rpdj4nICsKICAgICc8cCBjbGFzcz0iZnMxMiBtdXRl',
  'ZCI+8J+GmCDguKXguLTguIfguIHguYzguIHguLnguYnguKPguLDguJrguJogKOC5g+C4iuC5ieC4leC4reC4meC4peC4t+C4oeC4o+C4q+C4seC4quC4nOC5iOC4suC4meC4iOC4meC5gOC4guC5ieC4suC5hOC4oeC5iOC5hOC4lOC5iSDigJQg4Lir4LmJ4Liy4Lih',
  '4Liq4LmI4LiH4LiV4LmI4LitKTxicj4nICsKICAgICc8Y29kZSBjbGFzcz0iZnMxMiI+JyArIGVzYyhsaW5rcy5hZG1pblVybCkgKyAnPC9jb2RlPjwvcD4nKTsKfQoKZnVuY3Rpb24gY29weUZpZWxkKGlkKXsKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50',
  'QnlJZChpZCk7CiAgaWYgKCFlbCkgcmV0dXJuOwogIGVsLnNlbGVjdCgpOwogIHRyeSB7IGRvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7IHRvYXN0KCfguITguLHguJTguKXguK3guIHguYHguKXguYnguKcnLCAnb2snKTsgfQogIGNhdGNoIChlKSB7IHRvYXN0',
  'KCfguIHguJTguITguYnguLLguIfguJfguLXguYjguIrguYjguK3guIfguYHguKXguYnguKfguYDguKXguLfguK3guIEg4LiE4Lix4LiU4Lil4Lit4LiBJywgJ2VycicpOyB9Cn0KPC9zY3JpcHQ+CjxzY3JpcHQ+Ci8qID09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBGb3Jtcy5odG1sIOKAlCDguJ/guK3guKPguYzguKHguYDguJ7guLTguYjguKEv4LmB4LiB4LmJ4LmE4LiCIOC5geC4peC4sOC4geC4suC4o+C4peC4mgogICA9PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCnZhciBGT1JNID0gewogIHNwZWNzOiBbXSwgICAgICAgLy8g4Lic4Lix4LiH4LiK4LmI4Lit4LiH4LiB4Lij4Lit4LiB4LiC4Lit4LiH4Lif4Lit4Lij4LmM4Lih4LiX4Li14LmI4LmA4Lib4Li04LiU',
  '4Lit4Lii4Li54LmICiAga2VlcDoge30sICAgICAgICAvLyDguYTguJ/guKXguYzguYHguJnguJrguYDguJTguLTguKHguJfguLXguYjguKLguLHguIfguYTguKHguYjguYTguJTguYnguYDguK3guLLguK3guK3guIEKICBidWNrZXQ6ICdtaXNjJywgIC8vIOC5guC4',
  'n+C4peC5gOC4lOC4reC4o+C5jOC4l+C4teC5iOC4iOC4sOC5gOC4geC5h+C4muC5hOC4n+C4peC5jOC5geC4meC4muC5g+C4q+C4oeC5iAogIG9jcjogbnVsbCwgICAgICAgLy8g4Lic4Lix4LiH4LiB4Liy4Lij4LmA4LiV4Li04Lih4LiE4LmI4Liy4LiI4Liy4LiB',
  '4Lij4Li54LibCiAgcmVjOiBudWxsLCAgICAgICAvLyDguKPguLLguKLguIHguLLguKPguJfguLXguYjguIHguLPguKXguLHguIfguYHguIHguYnguK3guKLguLnguYggKG51bGwgPSDguIHguLPguKXguLHguIfguYDguJ7guLTguYjguKHguKPguLLguKLguIHguLLg',
  'uKPguYPguKvguKHguYgpCiAgbGluZXM6IFtdLCAgICAgICAvLyDguKPguLLguKLguIHguLLguKPguKLguYjguK3guKLguYPguJnguJrguLTguKUgKOC5g+C4iuC5ieC4geC4seC4muC4iuC5iOC4reC4h+C4iuC4meC4tOC4lCBsaW5lcykKICB0b2RvOiBbXSwgICAg',
  'ICAgIC8vIOC5gOC4iuC5h+C4hOC4peC4tOC4quC4leC5jOC4h+C4suC4meC4i+C5iOC4reC4oSAo4LmD4LiK4LmJ4LiB4Lix4Lia4LiK4LmI4Lit4LiH4LiK4LiZ4Li04LiUIHRvZG8pCiAgdG9kb09wdGlvbnM6IFtdICAvLyDguJXguLHguKfguYDguKXguLfguK3g',
  'uIHguJvguKPguLDguYDguKDguJfguIfguLLguJnguILguK3guIfguYHguJXguYjguKXguLDguILguYnguK0KfTsKCi8qIC0tLS0tLS0tLS0tLS0tLS0gZm9ybSBlbmdpbmUgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gZmllbGRzSHRtbChzcGVjcywgcmVj',
  'KXsKICByZWMgPSByZWMgfHwge307CiAgRk9STS5zcGVjcyA9IHNwZWNzOwogIEZPUk0ua2VlcCA9IHt9OwogIHJldHVybiAnPGRpdiBjbGFzcz0iZmdyaWQiPicgKyBzcGVjcy5tYXAoZnVuY3Rpb24oZil7CiAgICB2YXIgdiA9IHJlY1tmLmtleV07CiAgICB2YXIg',
  'aWQgPSAnZl8nICsgZi5rZXk7CiAgICB2YXIgaW5uZXI7CgogICAgaWYgKGYudHlwZSA9PT0gJ3NlbGVjdCcpIHsKICAgICAgdmFyIG9wdHMgPSAoZi5vcHRpb25zIHx8IFtdKS5tYXAoZnVuY3Rpb24obyl7CiAgICAgICAgdmFyIHZhbCA9IHR5cGVvZiBvID09PSAn',
  'b2JqZWN0JyA/IG8udmFsdWUgOiBvOwogICAgICAgIHZhciBsYWIgPSB0eXBlb2YgbyA9PT0gJ29iamVjdCcgPyBvLmxhYmVsIDogbzsKICAgICAgICByZXR1cm4gJzxvcHRpb24gdmFsdWU9IicgKyBlc2ModmFsKSArICciJyArIChTdHJpbmcodikgPT09IFN0cmlu',
  'Zyh2YWwpID8gJyBzZWxlY3RlZCcgOiAnJykgKyAnPicgKyBlc2MobGFiKSArICc8L29wdGlvbj4nOwogICAgICB9KS5qb2luKCcnKTsKICAgICAgaW5uZXIgPSAnPHNlbGVjdCBjbGFzcz0ic2VsIiBpZD0iJyArIGlkICsgJyI+JyArIChmLmJsYW5rICE9PSBmYWxz',
  'ZSA/ICc8b3B0aW9uIHZhbHVlPSIiPuKAlCDguYDguKXguLfguK3guIEg4oCUPC9vcHRpb24+JyA6ICcnKSArIG9wdHMgKyAnPC9zZWxlY3Q+JzsKCiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ3RleHRhcmVhJykgewogICAgICBpbm5lciA9ICc8dGV4dGFyZWEg',
  'Y2xhc3M9InRhIiBpZD0iJyArIGlkICsgJyIgcGxhY2Vob2xkZXI9IicgKyBlc2MoZi5waHx8JycpICsgJyI+JyArIGVzYyh2fHwnJykgKyAnPC90ZXh0YXJlYT4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnZmlsZXMnKSB7CiAgICAgIEZPUk0ua2VlcFtm',
  'LmtleV0gPSAocmVjW2Yua2V5XSAmJiByZWNbZi5rZXldLmxlbmd0aCkgPyBbXS5jb25jYXQocmVjW2Yua2V5XSkgOiBbXTsKICAgICAgaW5uZXIgPQogICAgICAgICc8ZGl2IGlkPSInICsgaWQgKyAnX2V4aXN0aW5nIj4nICsgZXhpc3RpbmdGaWxlc0h0bWwoZi5r',
  'ZXkpICsgJzwvZGl2PicgKwogICAgICAgICc8bGFiZWwgY2xhc3M9ImZpbGUtZHJvcCIgZm9yPSInICsgaWQgKyAnIj7wn5OOIOC5geC4leC4sOC5gOC4nuC4t+C5iOC4reC5gOC4peC4t+C4reC4geC5hOC4n+C4peC5jCAo4LmA4Lil4Li34Lit4LiB4LmE4LiU4LmJ',
  '4Lir4Lil4Liy4Lii4LmE4Lif4Lil4LmMIMK3IOC5hOC4oeC5iOC5gOC4geC4tOC4mSAxMiBNQiDguJXguYjguK3guYTguJ/guKXguYwpJyArCiAgICAgICAgJzxpbnB1dCB0eXBlPSJmaWxlIiBpZD0iJyArIGlkICsgJyIgbXVsdGlwbGUgYWNjZXB0PSJpbWFnZS8q',
  'LGFwcGxpY2F0aW9uL3BkZiIgc3R5bGU9ImRpc3BsYXk6bm9uZSIgJyArCiAgICAgICAgJ29uY2hhbmdlPSJwcmV2aWV3UGlja2VkKHRoaXMsXCcnICsgaWQgKyAnXCcpIj48L2xhYmVsPicgKwogICAgICAgICc8ZGl2IGlkPSInICsgaWQgKyAnX3ByZXZpZXciIGNs',
  'YXNzPSJ0aHVtYnMgbXQ4Ij48L2Rpdj4nICsKICAgICAgICAnPGRpdiBpZD0iJyArIGlkICsgJ19vY3IiPjwvZGl2Pic7CgogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICd0b2RvJykgewogICAgICBGT1JNLnRvZG8gPSBwYXJzZVRvZG9UZXh0KHYpOwogICAgICBG',
  'T1JNLnRvZG9PcHRpb25zID0gZi5vcHRpb25zIHx8IFtdOwogICAgICBpbm5lciA9ICc8ZGl2IGlkPSInICsgaWQgKyAnIiBjbGFzcz0idG9kbyI+JyArIHRvZG9UYWJsZUh0bWwoKSArICc8L2Rpdj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnbGluZXMn',
  'KSB7CiAgICAgIEZPUk0ubGluZXMgPSBwYXJzZUxpbmVzVGV4dCh2KTsKICAgICAgaW5uZXIgPSAnPGRpdiBpZD0iJyArIGlkICsgJyIgY2xhc3M9ImxpbmVzIj4nICsgbGluZXNUYWJsZUh0bWwoKSArICc8L2Rpdj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09',
  'PSAnY29tcHV0ZWQnKSB7CiAgICAgIGlubmVyID0gJzxkaXYgY2xhc3M9ImlucCIgaWQ9IicgKyBpZCArICciIHN0eWxlPSJiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Zm9udC13ZWlnaHQ6NjAwOycgKwogICAgICAgICAgICAgICdmb250LXZhcmlhbnQtbnVt',
  'ZXJpYzp0YWJ1bGFyLW51bXM7Y3Vyc29yOmRlZmF1bHQiPjA8L2Rpdj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnZGF0ZScpIHsKICAgICAgaW5uZXIgPSAnPGlucHV0IHR5cGU9ImRhdGUiIGNsYXNzPSJpbnAiIGlkPSInICsgaWQgKyAnIiB2YWx1ZT0i',
  'JyArIGVzYyh2IHx8ICcnKSArICciPic7CgogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICdudW1iZXInIHx8IGYudHlwZSA9PT0gJ21vbmV5JykgewogICAgICBpbm5lciA9ICc8aW5wdXQgdHlwZT0ibnVtYmVyIiBzdGVwPSInICsgKGYudHlwZSA9PT0gJ21vbmV5',
  'JyA/ICcwLjAxJyA6ICcxJykgKyAnIiBjbGFzcz0iaW5wIiBpZD0iJyArIGlkICsgJyIgJyArCiAgICAgICAgICAgICAgJ3ZhbHVlPSInICsgKHYgPT0gbnVsbCB8fCB2ID09PSAnJyA/ICcnIDogZXNjKHYpKSArICciIHBsYWNlaG9sZGVyPSInICsgZXNjKGYucGh8',
  'fCcnKSArICciIGlucHV0bW9kZT0iZGVjaW1hbCInICsKICAgICAgICAgICAgICAoZi5zdW1zID8gJyBvbmlucHV0PSJyZWNhbGNTdW1zKCkiJyA6IChmLm9uaW5wdXQgPyAnIG9uaW5wdXQ9IicgKyBlc2MoZi5vbmlucHV0KSArICciJyA6ICcnKSkgKyAnPic7Cgog',
  'ICAgfSBlbHNlIHsKICAgICAgaW5uZXIgPSAnPGlucHV0IHR5cGU9InRleHQiIGNsYXNzPSJpbnAiIGlkPSInICsgaWQgKyAnIiB2YWx1ZT0iJyArIGVzYyh2IHx8ICcnKSArICciIHBsYWNlaG9sZGVyPSInICsgZXNjKGYucGh8fCcnKSArICciPic7CiAgICB9Cgog',
  'ICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJmJyArIChmLmZ1bGwgPyAnIGZ1bGwnIDogJycpICsgJyI+JyArCiAgICAgICc8bGFiZWwgZm9yPSInICsgaWQgKyAnIj4nICsgZXNjKGYubGFiZWwpICsgKGYucmVxdWlyZWQgPyAnIDxzcGFuIHN0eWxlPSJjb2xvcjp2YXIo',
  'LS1kYW5nZXIpIj4qPC9zcGFuPicgOiAnJykgKyAnPC9sYWJlbD4nICsKICAgICAgaW5uZXIgKyAoZi5oaW50ID8gJzxkaXYgY2xhc3M9ImhpbnQiPicgKwogICAgICAgIChmLmhpbnQuY2hhckF0KDApID09PSAnPCcgPyBmLmhpbnQgOiBlc2MoZi5oaW50KSkgKyAn',
  'PC9kaXY+JyA6ICcnKSArICc8L2Rpdj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguYDguIrguYfguITguKXguLTguKrguJXguYzg',
  'uIfguLLguJnguIvguYjguK3guKEg4oCUIOC5gOC4guC5ieC4suC4i+C5iOC4reC4oeC4hOC4o+C4seC5ieC4h+C5gOC4lOC4teC4ouC4p+C4oeC4seC4geC4i+C5iOC4reC4oeC4q+C4peC4suC4ouC4iOC4uOC4lAoKICAg4LmA4LiB4LmH4Lia4Lil4LiH4LiK4Li1',
  '4LiV4Lia4Lij4Lij4LiX4Lix4LiU4Lil4Liw4LiH4Liy4LiZICBbeF0g4LiK4Li34LmI4Lit4LiH4Liy4LiZIHwg4Lib4Lij4Liw4LmA4Lig4LiX4LiH4Liy4LiZCiAgICjguKPguLnguJvguYHguJrguJrguYDguJTguLXguKLguKfguIHguLHguJogcGFyc2VUb2Rv',
  'XyDguJ3guLHguYjguIfguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYwg4oCUIOC5geC4geC5ieC4l+C4teC5iOC5hOC4q+C4meC4leC5ieC4reC4h+C5geC4geC5ieC5g+C4q+C5ieC4leC4o+C4h+C4geC4seC4mSkKICAgPT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgpmdW5jdGlvbiBwYXJzZVRvZG9UZXh0KHRleHQpewogIHZhciByYXcgPSBTdHJpbmcodGV4dCA9PSBudWxsID8gJycgOiB0ZXh0KTsKICBpZiAoIXJhdy50cmltKCkpIHJldHVybiBb',
  'XTsKICB2YXIgbGluZXMgPSByYXcuc3BsaXQoL1xyP1xuLykubWFwKGZ1bmN0aW9uKGwpeyByZXR1cm4gbC50cmltKCk7IH0pLmZpbHRlcihCb29sZWFuKTsKCiAgLy8g4LiC4Lit4LiH4LmA4LiU4Li04Lih4LmA4LiC4Li14Lii4LiZ4Lij4Lin4Lih4Lia4Lij4Lij',
  '4LiX4Lix4LiU4LmA4LiU4Li14Lii4Lin4Lin4LmI4LiyICIxLuC4ouC4suC5geC4meC4pyAyLuC5gOC4geC5h+C4muC4quC4teC4q+C5ieC4reC4hyIKICBpZiAobGluZXMubGVuZ3RoID09PSAxICYmIC9cZFxzKlsuKV0vLnRlc3QobGluZXNbMF0pICYmIGxpbmVz',
  'WzBdLmNoYXJBdCgwKSAhPT0gJ1snKSB7CiAgICBsaW5lcyA9IGxpbmVzWzBdLnNwbGl0KC9ccypcZCtccypbLildXHMqLykubWFwKGZ1bmN0aW9uKHgpeyByZXR1cm4geC50cmltKCk7IH0pLmZpbHRlcihCb29sZWFuKTsKICB9CgogIHJldHVybiBsaW5lcy5tYXAo',
  'ZnVuY3Rpb24obGluZSl7CiAgICB2YXIgZG9uZSA9IGZhbHNlOwogICAgdmFyIG0gPSBsaW5lLm1hdGNoKC9eXFtccyooW3hY4pyTXSk/XHMqXF1ccyooLiopJC8pOwogICAgaWYgKG0pIHsgZG9uZSA9ICEhbVsxXTsgbGluZSA9IG1bMl07IH0KICAgIGxpbmUgPSBs',
  'aW5lLnJlcGxhY2UoL15cZCtccypbLildXHMqLywgJycpLnRyaW0oKTsKICAgIHZhciBhID0gbGluZS5zcGxpdCgnfCcpOwogICAgcmV0dXJuIHsgZG9uZTogZG9uZSwgbmFtZTogKGFbMF0gfHwgJycpLnRyaW0oKSwgY2F0ZWdvcnk6IChhWzFdIHx8ICcnKS50cmlt',
  'KCkgfTsKICB9KS5maWx0ZXIoZnVuY3Rpb24odCl7IHJldHVybiB0Lm5hbWU7IH0pOwp9CgpmdW5jdGlvbiBmb3JtYXRUb2RvVGV4dChsaXN0KXsKICByZXR1cm4gKGxpc3QgfHwgW10pCiAgICAuZmlsdGVyKGZ1bmN0aW9uKHQpeyByZXR1cm4gU3RyaW5nKHQubmFt',
  'ZSB8fCAnJykudHJpbSgpOyB9KQogICAgLm1hcChmdW5jdGlvbih0KXsKICAgICAgdmFyIG5tID0gU3RyaW5nKHQubmFtZSkucmVwbGFjZSgvXHwvZywgJy8nKS50cmltKCk7CiAgICAgIHZhciBjdCA9IFN0cmluZyh0LmNhdGVnb3J5IHx8ICcnKS5yZXBsYWNlKC9c',
  'fC9nLCAnLycpLnRyaW0oKTsKICAgICAgcmV0dXJuICdbJyArICh0LmRvbmUgPyAneCcgOiAnICcpICsgJ10gJyArIG5tICsgKGN0ID8gJyB8ICcgKyBjdCA6ICcnKTsKICAgIH0pLmpvaW4oJ1xuJyk7Cn0KCmZ1bmN0aW9uIHRvZG9Eb25lKCl7IHJldHVybiAoRk9S',
  'TS50b2RvIHx8IFtdKS5maWx0ZXIoZnVuY3Rpb24odCl7IHJldHVybiB0LmRvbmU7IH0pLmxlbmd0aDsgfQoKZnVuY3Rpb24gdG9kb1RhYmxlSHRtbCgpewogIHZhciBvcHRzID0gRk9STS50b2RvT3B0aW9ucyB8fCBbXTsKICB2YXIgcm93cyA9IChGT1JNLnRvZG8g',
  'fHwgW10pLm1hcChmdW5jdGlvbih0LCBpKXsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0idG9kby1yb3cnICsgKHQuZG9uZSA/ICcgZG9uZScgOiAnJykgKyAnIj4nICsKICAgICAgJzxsYWJlbCBjbGFzcz0idG9kby1jaGVjayIgdGl0bGU9IicgKyAodC5kb25lID8g',
  'J+C4l+C4s+C5gOC4quC4o+C5h+C4iOC5geC4peC5ieC4pycgOiAn4Lii4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJ4LiX4LizJykgKyAnIj4nICsKICAgICAgICAnPGlucHV0IHR5cGU9ImNoZWNrYm94IicgKyAodC5kb25lID8gJyBjaGVja2VkJyA6ICcnKSArICcg',
  'b25jaGFuZ2U9InNldFRvZG8oJyArIGkgKyAnLFwnZG9uZVwnLHRoaXMuY2hlY2tlZCkiPicgKwogICAgICAnPC9sYWJlbD4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBwbGFjZWhvbGRlcj0i4LiH4Liy4LiZ4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LiL4LmI',
  '4Lit4LihIiB2YWx1ZT0iJyArIGVzYyh0Lm5hbWUgfHwgJycpICsgJyIgJyArCiAgICAgICAgJ29uaW5wdXQ9InNldFRvZG8oJyArIGkgKyAnLFwnbmFtZVwnLHRoaXMudmFsdWUpIj4nICsKICAgICAgJzxzZWxlY3QgY2xhc3M9InNlbCIgb25jaGFuZ2U9InNldFRv',
  'ZG8oJyArIGkgKyAnLFwnY2F0ZWdvcnlcJyx0aGlzLnZhbHVlKSI+JyArCiAgICAgICAgJzxvcHRpb24gdmFsdWU9IiI+4oCUIOC4m+C4o+C4sOC5gOC4oOC4l+C4h+C4suC4mSDigJQ8L29wdGlvbj4nICsKICAgICAgICBvcHRzLm1hcChmdW5jdGlvbihvKXsKICAg',
  'ICAgICAgIHJldHVybiAnPG9wdGlvbiB2YWx1ZT0iJyArIGVzYyhvKSArICciJyArIChvID09PSB0LmNhdGVnb3J5ID8gJyBzZWxlY3RlZCcgOiAnJykgKyAnPicgKyBlc2MobykgKyAnPC9vcHRpb24+JzsKICAgICAgICB9KS5qb2luKCcnKSArCiAgICAgICc8L3Nl',
  'bGVjdD4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIGRnciIgdGl0bGU9IuC5gOC4reC4suC4h+C4suC4meC4meC4teC5ieC4reC4reC4gSIgb25jbGljaz0iZGVsVG9kbygnICsgaSArICcpIj7DlzwvYnV0dG9uPicgKwogICAg',
  'JzwvZGl2Pic7CiAgfSkuam9pbignJyk7CgogIHZhciBuID0gKEZPUk0udG9kbyB8fCBbXSkubGVuZ3RoLCBkID0gdG9kb0RvbmUoKTsKICByZXR1cm4gKHJvd3MgfHwgJzxkaXYgY2xhc3M9ImhpbnQiIHN0eWxlPSJwYWRkaW5nOjhweCAycHgiPuC4ouC4seC4h+C5',
  'hOC4oeC5iOC4oeC4teC4h+C4suC4mSDigJQg4LiB4LiUIOKAnOC5gOC4nuC4tOC5iOC4oeC4h+C4suC4meKAnSDguYDguJ7guLfguYjguK3guYPguKrguYjguJfguLXguKXguLDguIjguLjguJTguJfguLXguYjguJXguYnguK3guIfguIvguYjguK3guKE8L2Rpdj4n',
  'KSArCiAgICAnPGRpdiBjbGFzcz0icm93IG10OCI+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iYWRkVG9kbygpIj4rIOC5gOC4nuC4tOC5iOC4oeC4h+C4suC4mTwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRv',
  'biB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9InBhc3RlVG9kbygpIj7wn5OLIOC4p+C4suC4h+C4l+C4teC5gOC4lOC4teC4ouC4p+C4q+C4peC4suC4ouC4h+C4suC4mTwvYnV0dG9uPicgKwogICAgICAobiA/ICc8ZGl2IGNsYXNzPSJ0b2Rv',
  'LWNvdW50Ij7guYDguKrguKPguYfguIjguYHguKXguYnguKcgPGI+JyArIGQgKyAnLycgKyBuICsgJzwvYj4g4LiH4Liy4LiZPC9kaXY+JyA6ICcnKSArCiAgICAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gcmVkcmF3VG9kbygpewogIHZhciBib3ggPSBkb2N1bWVudC5n',
  'ZXRFbGVtZW50QnlJZCgnZl9pdGVtcycpOwogIGlmICghYm94KSByZXR1cm47CiAgYm94LmlubmVySFRNTCA9IHRvZG9UYWJsZUh0bWwoKTsKfQoKZnVuY3Rpb24gc2V0VG9kbyhpLCBrZXksIHZhbCl7CiAgaWYgKCFGT1JNLnRvZG9baV0pIHJldHVybjsKICBGT1JN',
  'LnRvZG9baV1ba2V5XSA9IChrZXkgPT09ICdkb25lJykgPyAhIXZhbCA6IHZhbDsKICBpZiAoa2V5ID09PSAnZG9uZScpIHsgcmVkcmF3VG9kbygpOyByZXR1cm47IH0gICAvLyDguJXguLTguYrguIHguYHguKXguYnguKfguKfguLLguJTguYPguKvguKHguYjguYPg',
  'uKvguYnguILguLXguJTguIbguYjguLLguYDguKvguYfguJnguIrguLHguJQKICB2YXIgYyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNmX2l0ZW1zIC50b2RvLWNvdW50IGInKTsKICBpZiAoYykgYy50ZXh0Q29udGVudCA9IHRvZG9Eb25lKCkgKyAnLycgKyBG',
  'T1JNLnRvZG8ubGVuZ3RoOwp9CgpmdW5jdGlvbiBhZGRUb2RvKCl7CiAgRk9STS50b2RvLnB1c2goeyBkb25lOiBmYWxzZSwgbmFtZTogJycsIGNhdGVnb3J5OiAnJyB9KTsKICByZWRyYXdUb2RvKCk7CiAgdmFyIGlucHV0cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0',
  'b3JBbGwoJyNmX2l0ZW1zIC50b2RvLXJvdyAuaW5wJyk7CiAgaWYgKGlucHV0cy5sZW5ndGgpIGlucHV0c1tpbnB1dHMubGVuZ3RoIC0gMV0uZm9jdXMoKTsKfQoKZnVuY3Rpb24gZGVsVG9kbyhpKXsKICBGT1JNLnRvZG8uc3BsaWNlKGksIDEpOwogIHJlZHJhd1Rv',
  'ZG8oKTsKfQoKLyoqIOC4p+C4suC4h+C4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4leC5ieC4reC4h+C4i+C5iOC4reC4oeC4l+C4teC5gOC4lOC4teC4ouC4p+C4q+C4peC4suC4ouC4muC4o+C4o+C4l+C4seC4lCDguYHguKXguYnguKfguYPguKvguYnguKPg',
  'uLDguJrguJrguYHguKLguIHguYPguKvguYkgKi8KZnVuY3Rpb24gcGFzdGVUb2RvKCl7CiAgdmFyIGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2RvUGFzdGVXcmFwJyk7CiAgaWYgKGJveCkgeyBib3guaGlkZGVuID0gIWJveC5oaWRkZW47IGlmICgh',
  'Ym94LmhpZGRlbikgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvZG9QYXN0ZUJveCcpLmZvY3VzKCk7IHJldHVybjsgfQoKICB2YXIgaG9zdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2l0ZW1zJyk7CiAgaWYgKCFob3N0KSByZXR1cm47CiAgdmFyIHdy',
  'YXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICB3cmFwLmlkID0gJ3RvZG9QYXN0ZVdyYXAnOwogIHdyYXAuY2xhc3NOYW1lID0gJ210OCc7CiAgd3JhcC5pbm5lckhUTUwgPQogICAgJzx0ZXh0YXJlYSBjbGFzcz0idGEiIGlkPSJ0b2RvUGFzdGVC',
  'b3giIHN0eWxlPSJtaW4taGVpZ2h0OjExMHB4IiAnICsKICAgICAgJ3BsYWNlaG9sZGVyPSLguKLguLLguYHguJnguKfguKvguYnguK3guIfguJnguYnguLMmIzEwO+C5gOC4geC5h+C4muC4quC4teC4q+C5ieC4reC4hyYjMTA74LmA4Lib4Lil4Li14LmI4Lii4LiZ',
  '4LiB4LmK4Lit4LiB4LiZ4LmJ4Liz4Lil4LmJ4Liy4LiH4LiI4Liy4LiZIj48L3RleHRhcmVhPicgKwogICAgJzxkaXYgY2xhc3M9ImhpbnQgbXQ4Ij7guJrguKPguKPguJfguLHguJTguKXguLDguKvguJnguLbguYjguIfguIfguLLguJkgwrcg4Lir4Lij4Li34Lit',
  '4Lie4Li04Lih4Lie4LmM4Lij4Lin4Lih4Lia4Lij4Lij4LiX4Lix4LiU4LmA4LiU4Li14Lii4Lin4LmB4Lia4LiaIOKAnDEu4Lii4Liy4LmB4LiZ4LinIDIu4LmA4LiB4LmH4Lia4Liq4Li14Lir4LmJ4Lit4LiH4oCdIOC4geC5h+C5hOC4lOC5iTxicj4nICsKICAg',
  'ICAgJ+C5g+C4quC5iOC4m+C4o+C4sOC5gOC4oOC4l+C4h+C4suC4meC4l+C4teC4q+C4peC4seC4h+C4iOC4suC4geC4iuC5iOC4reC4h+C4guC5ieC4suC4hyDguYYg4LmB4LiV4LmI4Lil4Liw4LiH4Liy4LiZPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0icm93',
  'IG10OCI+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSBwcmkiIG9uY2xpY2s9ImFwcGx5UGFzdGVkVG9kbygpIj7guYDguJ7guLTguYjguKHguYDguILguYnguLLguKPguLLguKLguIHguLLguKM8L2J1dHRvbj4nICsKICAgICAg',
  'JzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcJ3RvZG9QYXN0ZVdyYXBcJykuaGlkZGVuPXRydWUiPuC4m+C4tOC4lDwvYnV0dG9uPicgKwogICAgJzwvZGl2Pic7CiAgaG9zdC5hcHBl',
  'bmRDaGlsZCh3cmFwKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9kb1Bhc3RlQm94JykuZm9jdXMoKTsKfQoKZnVuY3Rpb24gYXBwbHlQYXN0ZWRUb2RvKCl7CiAgdmFyIHRleHQgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvZG9QYXN0ZUJveCcp',
  'IHx8IHt9KS52YWx1ZSB8fCAnJzsKICB2YXIgYWRkZWQgPSBwYXJzZVRvZG9UZXh0KHRleHQpOwogIGlmICghYWRkZWQubGVuZ3RoKSByZXR1cm4gdG9hc3QoJ+C5hOC4oeC5iOC4nuC4muC4h+C4suC4meC4l+C4teC5iOC4reC5iOC4suC4meC5hOC4lOC5iScsICdl',
  'cnInKTsKICBGT1JNLnRvZG8gPSAoRk9STS50b2RvIHx8IFtdKS5maWx0ZXIoZnVuY3Rpb24odCl7IHJldHVybiBTdHJpbmcodC5uYW1lIHx8ICcnKS50cmltKCk7IH0pLmNvbmNhdChhZGRlZCk7CiAgcmVkcmF3VG9kbygpOwogIHRvYXN0KCfguYDguJ7guLTguYjg',
  'uKHguYPguKvguYkgJyArIGFkZGVkLmxlbmd0aCArICcg4LiH4Liy4LiZJywgJ29rJyk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJrguLTguKXguYDguJTguLXguKLguKfguKvg',
  'uKXguLLguKLguKPguLLguKLguIHguLLguKMg4oCUIOC4i+C4t+C5ieC4reC4reC4reC4meC5hOC4peC4meC5jOC4l+C4teC5gOC4lOC4teC4ouC4p+C5hOC4lOC5ieC4guC4reC4h+C4q+C4peC4suC4ouC4reC4ouC5iOC4suC4hwoKICAg4LmA4LiB4LmH4Lia4Lil',
  '4LiH4LiK4Li14LiV4LmA4Lib4LmH4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4LihIOC4muC4o+C4o+C4l+C4seC4lOC4peC4sOC4o+C4suC4ouC4geC4suC4oyAg4LiK4Li34LmI4LitIHwg4LiI4Liz4LiZ4Lin4LiZIHwg4Lir4LiZ4LmI4Lin4LiiIHwg4Lij4Liy4LiE',
  '4Liy4LiV4LmI4Lit4Lir4LiZ4LmI4Lin4LiiCiAgICjguKPguLnguJvguYHguJrguJrguYDguJTguLXguKLguKfguIHguLHguJogcGFyc2VMaW5lc18g4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmMIOKAlCDguYHguIHguYnguJfg',
  'uLXguYjguYTguKvguJnguJXguYnguK3guIfguYHguIHguYnguYPguKvguYnguJXguKPguIfguIHguLHguJkpCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKZnVuY3Rpb24gcGFyc2VMaW5l',
  'c1RleHQodGV4dCl7CiAgcmV0dXJuIFN0cmluZyh0ZXh0ID09IG51bGwgPyAnJyA6IHRleHQpLnNwbGl0KC9ccj9cbi8pCiAgICAubWFwKGZ1bmN0aW9uKHMpeyByZXR1cm4gcy50cmltKCk7IH0pLmZpbHRlcihCb29sZWFuKQogICAgLm1hcChmdW5jdGlvbihyYXcp',
  'ewogICAgICB2YXIgYSA9IHJhdy5zcGxpdCgnfCcpLm1hcChmdW5jdGlvbih4KXsgcmV0dXJuIHgudHJpbSgpOyB9KTsKICAgICAgdmFyIG5hbWUgPSBhWzBdIHx8ICcnLCBxdHkgPSAxLCB1bml0ID0gJycsIHByaWNlID0gMDsKICAgICAgaWYgKGEubGVuZ3RoID49',
  'IDQpICAgICAgeyBxdHkgPSBudW1PcihhWzFdLCAxKTsgdW5pdCA9IGFbMl0gfHwgJyc7IHByaWNlID0gbnVtT3IoYVszXSwgMCk7IH0KICAgICAgZWxzZSBpZiAoYS5sZW5ndGggPT09IDMpeyBxdHkgPSBudW1PcihhWzFdLCAxKTsgcHJpY2UgPSBudW1PcihhWzJd',
  'LCAwKTsgfQogICAgICBlbHNlIGlmIChhLmxlbmd0aCA9PT0gMil7IHByaWNlID0gbnVtT3IoYVsxXSwgMCk7IH0KICAgICAgcmV0dXJuIHsgbmFtZTogbmFtZSwgcXR5OiBxdHksIHVuaXQ6IHVuaXQsIHByaWNlOiBwcmljZSB9OwogICAgfSk7Cn0KCmZ1bmN0aW9u',
  'IG51bU9yKHYsIGRmbHQpewogIHZhciBuID0gTnVtYmVyKFN0cmluZyh2KS5yZXBsYWNlKC8sL2csICcnKSk7CiAgcmV0dXJuIGlzRmluaXRlKG4pID8gbiA6IGRmbHQ7Cn0KCmZ1bmN0aW9uIGZvcm1hdExpbmVzVGV4dChsaXN0KXsKICByZXR1cm4gKGxpc3QgfHwg',
  'W10pCiAgICAuZmlsdGVyKGZ1bmN0aW9uKGwpeyByZXR1cm4gU3RyaW5nKGwubmFtZSB8fCAnJykudHJpbSgpIHx8IE51bWJlcihsLnByaWNlKTsgfSkKICAgIC5tYXAoZnVuY3Rpb24obCl7CiAgICAgIHJldHVybiBbU3RyaW5nKGwubmFtZSB8fCAnJykucmVwbGFj',
  'ZSgvXHwvZywgJy8nKSwKICAgICAgICAgICAgICBsLnF0eSB8fCAxLAogICAgICAgICAgICAgIFN0cmluZyhsLnVuaXQgfHwgJycpLnJlcGxhY2UoL1x8L2csICcvJyksCiAgICAgICAgICAgICAgbC5wcmljZSB8fCAwXS5qb2luKCcgfCAnKTsKICAgIH0pLmpvaW4o',
  'J1xuJyk7Cn0KCmZ1bmN0aW9uIGxpbmVUb3RhbChsKXsgcmV0dXJuIChOdW1iZXIobC5xdHkpIHx8IDApICogKE51bWJlcihsLnByaWNlKSB8fCAwKTsgfQpmdW5jdGlvbiBsaW5lc1N1bSgpeyByZXR1cm4gKEZPUk0ubGluZXMgfHwgW10pLnJlZHVjZShmdW5jdGlv',
  'bihhLCBsKXsgcmV0dXJuIGEgKyBsaW5lVG90YWwobCk7IH0sIDApOyB9CgpmdW5jdGlvbiBsaW5lc1RhYmxlSHRtbCgpewogIHZhciByb3dzID0gKEZPUk0ubGluZXMgfHwgW10pLm1hcChmdW5jdGlvbihsLCBpKXsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0ibGlu',
  'ZS1yb3ciPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIHBsYWNlaG9sZGVyPSLguIrguLfguYjguK3guKrguLTguJnguITguYnguLIiIHZhbHVlPSInICsgZXNjKGwubmFtZSB8fCAnJykgKyAnIiAnICsKICAgICAgICAnb25pbnB1dD0ic2V0TGluZSgnICsg',
  'aSArICcsXCduYW1lXCcsdGhpcy52YWx1ZSkiPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAgbnVtIiB0eXBlPSJudW1iZXIiIHN0ZXA9ImFueSIgaW5wdXRtb2RlPSJkZWNpbWFsIiBwbGFjZWhvbGRlcj0i4LiI4Liz4LiZ4Lin4LiZIiAnICsKICAgICAgICAn',
  'dmFsdWU9IicgKyAobC5xdHkgPT0gbnVsbCA/ICcnIDogZXNjKGwucXR5KSkgKyAnIiBvbmlucHV0PSJzZXRMaW5lKCcgKyBpICsgJyxcJ3F0eVwnLHRoaXMudmFsdWUpIj4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBwbGFjZWhvbGRlcj0i4Lir4LiZ4LmI',
  '4Lin4LiiIiB2YWx1ZT0iJyArIGVzYyhsLnVuaXQgfHwgJycpICsgJyIgJyArCiAgICAgICAgJ29uaW5wdXQ9InNldExpbmUoJyArIGkgKyAnLFwndW5pdFwnLHRoaXMudmFsdWUpIj4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIG51bSIgdHlwZT0ibnVtYmVy',
  'IiBzdGVwPSJhbnkiIGlucHV0bW9kZT0iZGVjaW1hbCIgcGxhY2Vob2xkZXI9IuC4o+C4suC4hOC4si/guKvguJnguYjguKfguKIiICcgKwogICAgICAgICd2YWx1ZT0iJyArIChsLnByaWNlID09IG51bGwgPyAnJyA6IGVzYyhsLnByaWNlKSkgKyAnIiBvbmlucHV0',
  'PSJzZXRMaW5lKCcgKyBpICsgJyxcJ3ByaWNlXCcsdGhpcy52YWx1ZSkiPicgKwogICAgICAnPGRpdiBjbGFzcz0ibGluZS1zdW0iPicgKyBtb25leShsaW5lVG90YWwobCksIDIpICsgJzwvZGl2PicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNz',
  'PSJidG4gc20gZGdyIiB0aXRsZT0i4LmA4Lit4Liy4Lij4Liy4Lii4LiB4Liy4Lij4LiZ4Li14LmJ4Lit4Lit4LiBIiBvbmNsaWNrPSJkZWxMaW5lKCcgKyBpICsgJykiPsOXPC9idXR0b24+JyArCiAgICAnPC9kaXY+JzsKICB9KS5qb2luKCcnKTsKCiAgcmV0dXJu',
  'ICc8ZGl2IGNsYXNzPSJsaW5lLWhlYWQiPicgKwogICAgICAnPHNwYW4+4LiK4Li34LmI4Lit4Liq4Li04LiZ4LiE4LmJ4LiyPC9zcGFuPjxzcGFuIGNsYXNzPSJudW0iPuC4iOC4s+C4meC4p+C4mTwvc3Bhbj48c3Bhbj7guKvguJnguYjguKfguKI8L3NwYW4+JyAr',
  'CiAgICAgICc8c3BhbiBjbGFzcz0ibnVtIj7guKPguLLguITguLIv4Lir4LiZ4LmI4Lin4LiiPC9zcGFuPjxzcGFuIGNsYXNzPSJudW0iPuC4o+C4p+C4oTwvc3Bhbj48c3Bhbj48L3NwYW4+JyArCiAgICAnPC9kaXY+JyArCiAgICAocm93cyB8fCAnPGRpdiBjbGFz',
  'cz0iaGludCIgc3R5bGU9InBhZGRpbmc6OHB4IDJweCI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4LijIOKAlCDguIHguJQg4oCc4LmA4Lie4Li04LmI4Lih4Lij4Liy4Lii4LiB4Liy4Lij4oCdIOC5gOC4nuC4t+C5iOC4reC5g+C4quC5',
  'iOC4quC4tOC4meC4hOC5ieC4suC4l+C4teC4peC4sOC4reC4ouC5iOC4suC4hzwvZGl2PicpICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQ4Ij4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJhZGRMaW5lKCki',
  'Pisg4LmA4Lie4Li04LmI4Lih4Lij4Liy4Lii4LiB4Liy4LijPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0icGFzdGVMaW5lcygpIj7wn5OLIOC4p+C4suC4h+C4l+C4teC5gOC4lOC4teC4ouC4',
  'p+C4q+C4peC4suC4ouC4o+C4suC4ouC4geC4suC4ozwvYnV0dG9uPicgKwogICAgICAnPGRpdiBjbGFzcz0ibGluZS10b3RhbCI+4Lij4Lin4Lih4LiE4LmI4Liy4Liq4Li04LiZ4LiE4LmJ4LiyIDxiPicgKyBtb25leShsaW5lc1N1bSgpLCAyKSArICcg4Li/PC9i',
  'PjwvZGl2PicgKwogICAgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIHJlZHJhd0xpbmVzKCl7CiAgdmFyIGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2xpbmVzJyk7CiAgaWYgKCFib3gpIHJldHVybjsKICBib3guaW5uZXJIVE1MID0gbGluZXNUYWJsZUh0',
  'bWwoKTsKICByZWNhbGNCaWxsKCk7Cn0KCmZ1bmN0aW9uIHNldExpbmUoaSwga2V5LCB2YWwpewogIGlmICghRk9STS5saW5lc1tpXSkgcmV0dXJuOwogIEZPUk0ubGluZXNbaV1ba2V5XSA9IChrZXkgPT09ICdxdHknIHx8IGtleSA9PT0gJ3ByaWNlJykgPyBudW1P',
  'cih2YWwsIDApIDogdmFsOwogIC8vIOC5hOC4oeC5iOC4p+C4suC4lOC5g+C4q+C4oeC5iOC4l+C4seC5ieC4h+C4leC4suC4o+C4suC4hyDguYDguJTguLXguYvguKLguKfguYDguITguK3guKPguYzguYDguIvguK3guKPguYzguYDguJTguYnguIfguK3guK3guIHg',
  'uIjguLLguIHguIrguYjguK3guIfguJfguLXguYjguIHguLPguKXguLHguIfguJ7guLTguKHguJ7guYwKICB2YXIgcm93ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2ZfbGluZXMgLmxpbmUtcm93JylbaV07CiAgaWYgKHJvdykgcm93LnF1ZXJ5U2VsZWN0',
  'b3IoJy5saW5lLXN1bScpLnRleHRDb250ZW50ID0gbW9uZXkobGluZVRvdGFsKEZPUk0ubGluZXNbaV0pLCAyKTsKICB2YXIgdG90ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2ZfbGluZXMgLmxpbmUtdG90YWwgYicpOwogIGlmICh0b3QpIHRvdC50ZXh0Q29u',
  'dGVudCA9IG1vbmV5KGxpbmVzU3VtKCksIDIpICsgJyDguL8nOwogIHJlY2FsY0JpbGwoKTsKfQoKZnVuY3Rpb24gYWRkTGluZSgpewogIEZPUk0ubGluZXMucHVzaCh7IG5hbWU6ICcnLCBxdHk6IDEsIHVuaXQ6ICcnLCBwcmljZTogMCB9KTsKICByZWRyYXdMaW5l',
  'cygpOwogIHZhciBpbnB1dHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjZl9saW5lcyAubGluZS1yb3cgLmlucCcpOwogIGlmIChpbnB1dHMubGVuZ3RoKSBpbnB1dHNbKEZPUk0ubGluZXMubGVuZ3RoIC0gMSkgKiA0XS5mb2N1cygpOwp9CgpmdW5jdGlv',
  'biBkZWxMaW5lKGkpewogIEZPUk0ubGluZXMuc3BsaWNlKGksIDEpOwogIHJlZHJhd0xpbmVzKCk7Cn0KCi8qKgogKiDguKfguLLguIfguKPguLLguKLguIHguLLguKPguIjguLLguIHguKvguJnguYnguLLguITguLPguKrguLHguYjguIfguIvguLfguYnguK3guJfg',
  'uLXguYDguJTguLXguKLguKfguJfguLHguYnguIfguIHguYnguK3guJkg4LmB4Lil4LmJ4Lin4LmD4Lir4LmJ4Lij4Liw4Lia4Lia4LmB4Lii4LiB4Lia4Lij4Lij4LiX4Lix4LiU4LmD4Lir4LmJCiAqCiAqIOC4l+C4s+C5gOC4m+C5h+C4meC4iuC5iOC4reC4h+C4',
  'nuC4seC4muC5gOC4geC5h+C4muC4reC4ouC4ueC5iOC5g+C4meC4n+C4reC4o+C5jOC4oeC5gOC4lOC4tOC4oSDguYTguKHguYjguYDguJvguLTguJTguKvguJnguYnguLLguJXguYjguLLguIfguIvguYnguK3guJkKICog4LmA4Lie4Lij4Liy4LiwIG9wZW5Nb2Rh',
  'bCgpIOC5gOC4guC4teC4ouC4meC4l+C4seC4muC4q+C4meC5ieC4suC4leC5iOC4suC4h+C5gOC4lOC4tOC4oSDguJbguYnguLLguYDguJvguLTguJTguIvguYnguK3guJnguJ/guK3guKPguYzguKHguJfguLXguYjguIHguKPguK3guIHguITguYnguLLguIfguYTg',
  'uKfguYnguIjguLDguKvguLLguKLguJfguLHguYnguIfguYPguJoKICovCmZ1bmN0aW9uIHBhc3RlTGluZXMoKXsKICB2YXIgYm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Bhc3RlV3JhcCcpOwogIGlmIChib3gpIHsgYm94LmhpZGRlbiA9ICFib3guaGlk',
  'ZGVuOyBpZiAoIWJveC5oaWRkZW4pIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXN0ZUJveCcpLmZvY3VzKCk7IHJldHVybjsgfQoKICB2YXIgaG9zdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2xpbmVzJyk7CiAgaWYgKCFob3N0KSByZXR1cm47CiAg',
  'dmFyIHdyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICB3cmFwLmlkID0gJ3Bhc3RlV3JhcCc7CiAgd3JhcC5jbGFzc05hbWUgPSAnbXQ4JzsKICB3cmFwLmlubmVySFRNTCA9CiAgICAnPHRleHRhcmVhIGNsYXNzPSJ0YSIgaWQ9InBhc3RlQm94',
  'IiBzdHlsZT0ibWluLWhlaWdodDoxMjBweCIgJyArCiAgICAgICdwbGFjZWhvbGRlcj0i4Lib4Lix4LmK4Lih4LiZ4LmJ4LizIDc1MFcgfCAxIHwg4LmA4LiE4Lij4Li34LmI4Lit4LiHIHwgNDI1MCYjMTA74Liq4Liy4Lii4LmE4LifIFZBRiAyeDEuNSB8IDIwIHwg',
  '4LmA4Lih4LiV4LijIHwgMTcuNSYjMTA74LmA4LiX4Lib4Lie4Lix4LiZ4Liq4Liy4Lii4LmE4LifIDQ1Ij48L3RleHRhcmVhPicgKwogICAgJzxkaXYgY2xhc3M9ImhpbnQgbXQ4Ij7guITguLHguYjguJnguJTguYnguKfguKIgPGI+fDwvYj4g4LiV4Liy4Lih4Lil',
  '4Liz4LiU4Lix4LiaIOC4iuC4t+C5iOC4rSDCtyDguIjguLPguJnguKfguJkgwrcg4Lir4LiZ4LmI4Lin4LiiIMK3IOC4o+C4suC4hOC4suC4leC5iOC4reC4q+C4meC5iOC4p+C4ojxicj4nICsKICAgICAgJ+C4luC5ieC4suC4p+C4suC4h+C4oeC4suC5gOC4m+C5',
  'h+C4meC4guC5ieC4reC4hOC4p+C4suC4oeC4mOC4o+C4o+C4oeC4lOC4siDguKPguLDguJrguJrguIjguLDguJ7guKLguLLguKLguLLguKHguYHguKLguIHguIrguLfguYjguK3guIHguLHguJrguKPguLLguITguLLguYPguKvguYnguYDguK3guIc8L2Rpdj4nICsK',
  'ICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQ4Ij4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIHByaSIgb25jbGljaz0iYXBwbHlQYXN0ZWRMaW5lcygpIj7guYDguJ7guLTguYjguKHguYDguILguYnguLLguKPguLLguKLguIHguLLg',
  'uKM8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcJ3Bhc3RlV3JhcFwnKS5oaWRkZW49dHJ1ZSI+4Lib4Li04LiUPC9idXR0b24+JyArCiAgICAnPC9k',
  'aXY+JzsKICBob3N0LmFwcGVuZENoaWxkKHdyYXApOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXN0ZUJveCcpLmZvY3VzKCk7Cn0KCmZ1bmN0aW9uIGFwcGx5UGFzdGVkTGluZXMoKXsKICB2YXIgdGV4dCA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgn',
  'cGFzdGVCb3gnKSB8fCB7fSkudmFsdWUgfHwgJyc7CiAgdmFyIGFkZGVkID0gdGV4dC5zcGxpdCgvXHI/XG4vKS5tYXAoZnVuY3Rpb24ocyl7IHJldHVybiBzLnRyaW0oKTsgfSkuZmlsdGVyKEJvb2xlYW4pLm1hcChmdW5jdGlvbihyYXcpewogICAgaWYgKHJhdy5p',
  'bmRleE9mKCd8JykgPj0gMCkgcmV0dXJuIHBhcnNlTGluZXNUZXh0KHJhdylbMF07CiAgICAvLyDguYTguKHguYjguKHguLUgfCDigJQg4LmA4LiU4Liy4LiI4Liy4LiB4LiV4Lix4Lin4LmA4Lil4LiC4LiX4LmJ4Liy4Lii4Lia4Lij4Lij4LiX4Lix4LiU4Lin4LmI',
  '4Liy4LmA4Lib4LmH4LiZ4Lij4Liy4LiE4LiyCiAgICB2YXIgbSA9IHJhdy5tYXRjaCgvXiguKj8pW1xzOnjDl10qKFtcZCxdKyg/OlwuXGQrKT8pXHMqKD864Lia4Liy4LiXfOC4vyk/JC8pOwogICAgaWYgKG0gJiYgbVsxXS50cmltKCkpIHJldHVybiB7IG5hbWU6',
  'IG1bMV0udHJpbSgpLCBxdHk6IDEsIHVuaXQ6ICcnLCBwcmljZTogbnVtT3IobVsyXSwgMCkgfTsKICAgIHJldHVybiB7IG5hbWU6IHJhdywgcXR5OiAxLCB1bml0OiAnJywgcHJpY2U6IDAgfTsKICB9KS5maWx0ZXIoQm9vbGVhbik7CgogIGlmICghYWRkZWQubGVu',
  'Z3RoKSByZXR1cm4gdG9hc3QoJ+C5hOC4oeC5iOC4nuC4muC4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4reC5iOC4suC4meC5hOC4lOC5iScsICdlcnInKTsKICBGT1JNLmxpbmVzID0gKEZPUk0ubGluZXMgfHwgW10pLmZpbHRlcihmdW5jdGlvbihsKXsgcmV0',
  'dXJuIFN0cmluZyhsLm5hbWUgfHwgJycpLnRyaW0oKTsgfSkuY29uY2F0KGFkZGVkKTsKICByZWRyYXdMaW5lcygpOyAgIC8vIOC4p+C4suC4lOC5g+C4q+C4oeC5iOC5geC4peC5ieC4p+C4iuC5iOC4reC4h+C4p+C4suC4h+C4iOC4sOC4q+C4suC4ouC5hOC4m+C5',
  'gOC4reC4hyDguYDguJ7guKPguLLguLDguK3guKLguLnguYjguILguYnguLLguIfguYPguJkgZl9saW5lcwogIHRvYXN0KCfguYDguJ7guLTguYjguKHguYPguKvguYkgJyArIGFkZGVkLmxlbmd0aCArICcg4Lij4Liy4Lii4LiB4Liy4LijIOKAlCDguJXguKPguKfg',
  'uIjguJXguLHguKfguYDguKXguILguK3guLXguIHguITguKPguLHguYnguIfguIHguYjguK3guJnguJrguLHguJnguJfguLbguIEnLCAnb2snKTsKfQoKLyoqCiAqIOC4hOC4tOC4lOC4ouC4reC4lOC4o+C4p+C4oeC4guC4reC4h+C4muC4tOC4pSA9IOC4hOC5iOC4',
  'suC4quC4tOC4meC4hOC5ieC4siArIOC4hOC5iOC4suC4quC5iOC4hyDiiJIg4Liq4LmI4Lin4LiZ4Lil4LiUIOC5geC4peC5ieC4p+C5gOC4leC4tOC4oeC4peC4h+C4iuC5iOC4reC4hyAi4Lij4Liy4LiE4Liy4Lij4Lin4LihIgogKiDguYPguKvguYnguJXguKPg',
  'uIfguIHguLHguJrguJfguLXguYjguJ3guLHguYjguIfguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYzguITguLTguJTguJXguK3guJnguJrguLHguJnguJfguLbguIEg4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4Lih4Li14LiX4Liy4LiH4LiX4Li14LmI',
  '4LiV4Lix4Lin4LmA4Lil4LiC4Liq4Lit4LiH4Lid4Lix4LmI4LiH4LmE4Lih4LmI4LiV4Lij4LiH4LiB4Lix4LiZCiAqLwpmdW5jdGlvbiByZWNhbGNCaWxsKCl7CiAgaWYgKCFkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9saW5lcycpKSByZXR1cm47CiAgdmFy',
  'IHByaWNlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfcHJpY2UnKTsKICBpZiAoIXByaWNlKSByZXR1cm47CiAgdmFyIG4gPSAoRk9STS5saW5lcyB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uKGwpeyByZXR1cm4gU3RyaW5nKGwubmFtZSB8fCAnJykudHJpbSgp',
  'IHx8IE51bWJlcihsLnByaWNlKTsgfSkubGVuZ3RoOwogIGlmICghbikgeyBwcmljZS5yZWFkT25seSA9IGZhbHNlOyBwcmljZS5zdHlsZS5iYWNrZ3JvdW5kID0gJyc7IHJldHVybjsgfQoKICB2YXIgc2hpcCA9IE51bWJlcigoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5',
  'SWQoJ2Zfc2hpcHBpbmcnKSB8fCB7fSkudmFsdWUpIHx8IDA7CiAgdmFyIGRpc2MgPSBOdW1iZXIoKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2Rpc2NvdW50JykgfHwge30pLnZhbHVlKSB8fCAwOwogIHByaWNlLnZhbHVlID0gTWF0aC5yb3VuZCgobGluZXNT',
  'dW0oKSArIHNoaXAgLSBkaXNjKSAqIDEwMCkgLyAxMDA7CiAgcHJpY2UucmVhZE9ubHkgPSB0cnVlOyAgICAgICAgICAgICAgICAgICAgICAgLy8g4Lih4Li14Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4Lii4LmB4Lil4LmJ4LinIOC4q+C5ieC4suC4oeC4nuC4',
  'tOC4oeC4nuC5jOC4l+C4seC4muC5g+C4q+C5ieC5hOC4oeC5iOC4leC4o+C4h+C4geC4seC4mQogIHByaWNlLnN0eWxlLmJhY2tncm91bmQgPSAndmFyKC0tc3VyZmFjZS0yKSc7CiAgcHJpY2UudGl0bGUgPSAn4LiE4Li04LiU4LiI4Liy4LiB4Lij4Liy4Lii4LiB',
  '4Liy4Lij4LmD4LiZ4Lia4Li04Lil4LmD4Lir4LmJ4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0IOKAlCDguYHguIHguYnguJfguLXguYjguKPguLLguKLguIHguLLguKPguKLguYjguK3guKIg4LiE4LmI4Liy4Liq4LmI4LiHIOC4q+C4o+C4t+C4reC4quC5iOC4',
  'p+C4meC4peC4lCc7CgogIHZhciBoaW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JpbGxIaW50Jyk7CiAgaWYgKGhpbnQpIHsKICAgIGhpbnQuaW5uZXJIVE1MID0gbiArICcg4Lij4Liy4Lii4LiB4Liy4LijIMK3IOC4hOC5iOC4suC4quC4tOC4meC4hOC5',
  'ieC4siAnICsgbW9uZXkobGluZXNTdW0oKSwgMikgKwogICAgICAoc2hpcCA/ICcgKyDguITguYjguLLguKrguYjguIcgJyArIG1vbmV5KHNoaXAsIDIpIDogJycpICsKICAgICAgKGRpc2MgPyAnIOKIkiDguKrguYjguKfguJnguKXguJQgJyArIG1vbmV5KGRpc2Ms',
  'IDIpIDogJycpOwogIH0KfQoKLyoqIOC4reC4seC4m+C5gOC4lOC4leC4iuC5iOC4reC4h+C4nOC4peC4o+C4p+C4oeC4l+C4uOC4geC4iuC5iOC4reC4h+C5g+C4meC4n+C4reC4o+C5jOC4oeC4m+C4seC4iOC4iOC4uOC4muC4seC4mSAqLwpmdW5jdGlvbiByZWNh',
  'bGNTdW1zKCl7CiAgKEZPUk0uc3BlY3MgfHwgW10pLmZvckVhY2goZnVuY3Rpb24oZil7CiAgICBpZiAoZi50eXBlICE9PSAnY29tcHV0ZWQnIHx8ICFmLmZyb20pIHJldHVybjsKICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmXycgKyBmLmtl',
  'eSk7CiAgICBpZiAoIWVsKSByZXR1cm47CiAgICB2YXIgdG90YWwgPSAwOwogICAgZi5mcm9tLmZvckVhY2goZnVuY3Rpb24oayl7CiAgICAgIHZhciBpID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyArIGspOwogICAgICBpZiAoaSkgdG90YWwgKz0gTnVt',
  'YmVyKGkudmFsdWUpIHx8IDA7CiAgICB9KTsKICAgIGVsLnRleHRDb250ZW50ID0gdG90YWwudG9Mb2NhbGVTdHJpbmcoJ3RoLVRIJywgeyBtaW5pbXVtRnJhY3Rpb25EaWdpdHM6IDAsIG1heGltdW1GcmFjdGlvbkRpZ2l0czogMiB9KSArICcg4Li/JzsKICAgIGVs',
  'LnN0eWxlLmNvbG9yID0gdG90YWwgPiAwID8gJ3ZhcigtLW9rKScgOiAndmFyKC0tbXV0ZWQpJzsKICB9KTsKfQoKZnVuY3Rpb24gZXhpc3RpbmdGaWxlc0h0bWwoa2V5KXsKICB2YXIgbGlzdCA9IEZPUk0ua2VlcFtrZXldIHx8IFtdOwogIGlmICghbGlzdC5sZW5n',
  'dGgpIHJldHVybiAnJzsKICByZXR1cm4gJzxkaXYgY2xhc3M9InRodW1icyBtYjgiPicgKyBsaXN0Lm1hcChmdW5jdGlvbih1cmwsIGkpewogICAgdmFyIGlkID0gU3RyaW5nKHVybCkubWF0Y2goL1stXHddezIwLH0vKTsKICAgIHZhciB0aHVtYiA9IGlkID8gJ2h0',
  'dHBzOi8vZHJpdmUuZ29vZ2xlLmNvbS90aHVtYm5haWw/aWQ9JyArIGlkWzBdICsgJyZzej13MjAwJyA6ICcnOwogICAgcmV0dXJuICc8c3BhbiBzdHlsZT0icG9zaXRpb246cmVsYXRpdmU7ZGlzcGxheTppbmxpbmUtYmxvY2siPicgKwogICAgICAodGh1bWIgPyAn',
  'PGltZyBjbGFzcz0idGh1bWIiIHNyYz0iJyArIGVzYyh0aHVtYikgKyAnIiBvbmNsaWNrPSJ3aW5kb3cub3BlbignICsganNxKHNhZmVVcmwodXJsKSkgKyAnLFwnX2JsYW5rXCcpIj4nCiAgICAgICAgICAgICA6ICc8YSBjbGFzcz0iYiBpbmZvIiBocmVmPSInICsg',
  'ZXNjKHNhZmVVcmwodXJsKSB8fCAnIycpICsgJyIgdGFyZ2V0PSJfYmxhbmsiIHJlbD0ibm9vcGVuZXIiPuC5hOC4n+C4peC5jCAnICsgKGkrMSkgKyAnPC9hPicpICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBvbmNsaWNrPSJkcm9wRmlsZShcJycgKyBr',
  'ZXkgKyAnXCcsJyArIGkgKyAnKSIgdGl0bGU9IuC5gOC4reC4suC4reC4reC4gSIgJyArCiAgICAgICdzdHlsZT0icG9zaXRpb246YWJzb2x1dGU7dG9wOi02cHg7cmlnaHQ6LTZweDtiYWNrZ3JvdW5kOnZhcigtLWRhbmdlcik7Y29sb3I6I2ZmZjtib3JkZXI6MDti',
  'b3JkZXItcmFkaXVzOjk5cHg7d2lkdGg6MThweDtoZWlnaHQ6MThweDtsaW5lLWhlaWdodDoxO2N1cnNvcjpwb2ludGVyO2ZvbnQtc2l6ZToxMnB4Ij7DlzwvYnV0dG9uPicgKwogICAgICAnPC9zcGFuPic7CiAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKfQoKZnVu',
  'Y3Rpb24gZHJvcEZpbGUoa2V5LCBpZHgpewogIEZPUk0ua2VlcFtrZXldLnNwbGljZShpZHgsIDEpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmXycgKyBrZXkgKyAnX2V4aXN0aW5nJykuaW5uZXJIVE1MID0gZXhpc3RpbmdGaWxlc0h0bWwoa2V5KTsKfQoK',
  'ZnVuY3Rpb24gcHJldmlld1BpY2tlZChpbnB1dCwgaWQpewogIHZhciBib3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCArICdfcHJldmlldycpOwogIHZhciBmaWxlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGlucHV0LmZpbGVzIHx8IFtdKTsK',
  'ICBib3guaW5uZXJIVE1MID0gZmlsZXMubWFwKGZ1bmN0aW9uKGYpewogICAgcmV0dXJuICc8c3BhbiBjbGFzcz0iYiBpbmZvIj4nICsgZXNjKGYubmFtZS5zbGljZSgwLDI2KSkgKyAnIMK3ICcgKyBNYXRoLnJvdW5kKGYuc2l6ZS8xMDI0KSArICcgS0I8L3NwYW4+',
  'JzsKICB9KS5qb2luKCcgJyk7CgogIHZhciBzbG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQgKyAnX29jcicpOwogIGlmICghc2xvdCkgcmV0dXJuOwogIHNsb3QuaW5uZXJIVE1MID0gJyc7CiAgaWYgKCFvY3JVc2FibGUoKSB8fCAhZmlyc3RSZWFkYWJs',
  'ZShmaWxlcykpIHJldHVybjsKCiAgdmFyIG1vZGUgPSAoUy5ib290LnNldHRpbmdzICYmIFMuYm9vdC5zZXR0aW5ncy5vY3JBdXRvZmlsbCkgfHwgJ+C4luC4suC4oeC4geC5iOC4reC4meC5gOC4leC4tOC4oSc7CiAgaWYgKG1vZGUgPT09ICfguYTguKHguYjguYDg',
  'uJXguLTguKEnKSByZXR1cm47CiAgaWYgKG1vZGUgPT09ICfguYDguJXguLTguKHguYPguKvguYnguYDguKXguKInKSByZXR1cm4gcnVuT2NyKGlkLCB0cnVlKTsKCiAgc2xvdC5pbm5lckhUTUwgPQogICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRu',
  'IHNtIG10OCIgb25jbGljaz0icnVuT2NyKFwnJyArIGlkICsgJ1wnKSI+JyArCiAgICAn8J+UjiDguK3guYjguLLguJnguILguYnguK3guITguKfguLLguKHguIjguLLguIHguKPguLnguJvguJnguLXguYkg4LmB4Lil4LmJ4Lin4LiK4LmI4Lin4Lii4LiB4Lij4Lit',
  '4LiB4LmD4Lir4LmJPC9idXR0b24+JzsKfQoKLyoqIOC4reC5iOC4suC4meC4hOC5iOC4suC4iOC4suC4geC4n+C4reC4o+C5jOC4oSArIOC4reC4seC4m+C5guC4q+C4peC4lOC5hOC4n+C4peC5jOC5g+C4q+C4oeC5iCDguYHguKXguYnguKfguITguLfguJkgb2Jq',
  'ZWN0IOC4nuC4o+C5ieC4reC4oeC4muC4seC4meC4l+C4tuC4gSAqLwpmdW5jdGlvbiByZWFkRm9ybShzcGVjcywgYnVja2V0KXsKICB2YXIgb3V0ID0ge307CiAgdmFyIHVwbG9hZHMgPSBbXTsKCiAgc3BlY3MuZm9yRWFjaChmdW5jdGlvbihmKXsKICAgIGlmIChm',
  'LnR5cGUgPT09ICdjb21wdXRlZCcpIHJldHVybjsgICAgICAgICAgLy8g4LiK4LmI4Lit4LiH4LiE4Liz4LiZ4Lin4LiTIOC5hOC4oeC5iOC4leC5ieC4reC4h+C4muC4seC4meC4l+C4tuC4gQogICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Zf',
  'JyArIGYua2V5KTsKICAgIGlmICghZWwpIHJldHVybjsKICAgIGlmIChmLnR5cGUgPT09ICdmaWxlcycpIHsKICAgICAgdXBsb2Fkcy5wdXNoKAogICAgICAgIHVwbG9hZEZpbGVzKGVsLCBidWNrZXQpLnRoZW4oZnVuY3Rpb24ocmVmcyl7CiAgICAgICAgICBvdXRb',
  'Zi5rZXldID0gKEZPUk0ua2VlcFtmLmtleV0gfHwgW10pLmNvbmNhdChyZWZzLm1hcChmdW5jdGlvbihyKXsgcmV0dXJuIHIudXJsOyB9KSk7CiAgICAgICAgfSkKICAgICAgKTsKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAndG9kbycpIHsKICAgICAgb3V0W2Yu',
  'a2V5XSA9IGZvcm1hdFRvZG9UZXh0KEZPUk0udG9kbyk7CiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ2xpbmVzJykgewogICAgICBvdXRbZi5rZXldID0gZm9ybWF0TGluZXNUZXh0KEZPUk0ubGluZXMpOwogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICdudW1i',
  'ZXInIHx8IGYudHlwZSA9PT0gJ21vbmV5JykgewogICAgICBvdXRbZi5rZXldID0gZWwudmFsdWUgPT09ICcnID8gbnVsbCA6IE51bWJlcihlbC52YWx1ZSk7CiAgICB9IGVsc2UgewogICAgICBvdXRbZi5rZXldID0gZWwudmFsdWU7CiAgICB9CiAgfSk7CgogIHJl',
  'dHVybiBQcm9taXNlLmFsbCh1cGxvYWRzKS50aGVuKGZ1bmN0aW9uKCl7IHJldHVybiBvdXQ7IH0pOwp9CgovKiog4LmC4LiE4Lij4LiH4Lif4Lit4Lij4LmM4Lih4Lih4Liy4LiV4Lij4LiQ4Liy4LiZOiDguYDguJvguLTguJQgbW9kYWwsIOC4iOC4seC4lOC4geC4',
  'suC4o+C4m+C4uOC5iOC4oeC4muC4seC4meC4l+C4tuC4gSwg4Lij4Li14LmC4Lir4Lil4LiU4Lir4LiZ4LmJ4LiyICovCmZ1bmN0aW9uIG9wZW5Gb3JtKG9wdHMpewogIHZhciByZWMgPSBvcHRzLnJlY29yZCB8fCB7fTsKICBGT1JNLm9jciA9IG9wdHMub2NyIHx8',
  'IG51bGw7CiAgRk9STS5yZWMgPSByZWMuaWQgPyByZWMgOiBudWxsOyAgIC8vIOC4iOC4s+C5hOC4p+C5ieC4p+C5iOC4suC4geC4s+C4peC4seC4h+C5geC4geC5ieC4guC4reC4h+C5gOC4lOC4tOC4oSDguKvguKPguLfguK3guIHguLPguKXguLHguIfguYDguJ7g',
  'uLTguYjguKHguYPguKvguKHguYgKICBvcGVuTW9kYWwob3B0cy50aXRsZSwKICAgIGZpZWxkc0h0bWwob3B0cy5maWVsZHMsIHJlYyksCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4gTwvYnV0',
  'dG9uPicgKwogICAgKHJlYy5pZCAmJiBvcHRzLm9uRGVsZXRlID8gJzxidXR0b24gY2xhc3M9ImJ0biBkZ3IiIGlkPSJmRGVsIj7guKXguJrguKPguLLguKLguIHguLLguKPguJnguLXguYk8L2J1dHRvbj4nIDogJycpICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4g',
  'cHJpIiBpZD0iZlNhdmUiPicgKyAocmVjLmlkID8gJ+C4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C5geC4geC5ieC5hOC4gicgOiAn4Lia4Lix4LiZ4LiX4Li24LiBJykgKyAnPC9idXR0b24+JywKICAgIG9wdHMud2lkZSk7CgogIGlmIChyZWMuaWQgJiYgb3B0',
  'cy5vbkRlbGV0ZSkgewogICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZEZWwnKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsgY2xvc2VNb2RhbCgpOyBvcHRzLm9uRGVsZXRlKHJlYy5pZCk7IH07CiAgfQoKICByZWNhbGNTdW1zKCk7CiAgcmVjYWxjQmlsbCgpOwoK',
  'ICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZlNhdmUnKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsKICAgIHZhciBidG4gPSB0aGlzOwogICAgYnRuLmRpc2FibGVkID0gdHJ1ZTsKICAgIGJ0bi5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g',
  '4LiB4Liz4Lil4Lix4LiH4Lia4Lix4LiZ4LiX4Li24LiB4oCmJzsKCiAgICByZWFkRm9ybShvcHRzLmZpZWxkcywgb3B0cy5idWNrZXQgfHwgJ21pc2MnKS50aGVuKGZ1bmN0aW9uKGRhdGEpewogICAgICB2YXIgbWlzc2luZyA9IG9wdHMuZmllbGRzLmZpbHRlcihm',
  'dW5jdGlvbihmKXsKICAgICAgICByZXR1cm4gZi5yZXF1aXJlZCAmJiAoZGF0YVtmLmtleV0gPT0gbnVsbCB8fCBkYXRhW2Yua2V5XSA9PT0gJycpOwogICAgICB9KTsKICAgICAgaWYgKG1pc3NpbmcubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoJ+C4geC4o+C4uOC4',
  'k+C4suC4geC4o+C4reC4gTogJyArIG1pc3NpbmcubWFwKGZ1bmN0aW9uKGYpeyByZXR1cm4gZi5sYWJlbDsgfSkuam9pbignLCAnKSk7CgogICAgICB2YXIgcmVjb3JkID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0cy5iYXNlIHx8IHt9LCBkYXRhKTsKICAgICAgaWYg',
  'KHJlYy5pZCkgcmVjb3JkLmlkID0gcmVjLmlkOwogICAgICByZXR1cm4gY2FsbEFwaShvcHRzLmFjdGlvbiwgT2JqZWN0LmFzc2lnbih7IHJlY29yZDogcmVjb3JkIH0sIG9wdHMuZXh0cmEgfHwge30pKTsKICAgIH0pLnRoZW4oZnVuY3Rpb24oc2F2ZWQpewogICAg',
  'ICBjbG9zZU1vZGFsKCk7CiAgICAgIC8vIOC4o+C4suC4ouC4geC4suC4o+C4luC4ueC4geC4iOC4seC4lOC5gOC4guC5ieC4suC4m+C4teC4leC4suC4oeC4p+C4seC4meC4l+C4teC5iCDguJbguYnguLLguYTguKHguYjguYPguIrguYjguJvguLXguJfguLXguYjg',
  'uIHguLPguKXguLHguIfguJTguLnguK3guKLguLnguYgg4Lia4Lit4LiB4LmD4Lir4LmJ4LiK4Lix4LiUIOKAlCDguYTguKHguYjguIfguLHguYnguJnguJTguLnguYDguKvguKHguLfguK3guJnguJrguLHguJnguJfguLbguIHguYTguKHguYjguJXguLTguJQKICAg',
  'ICAgaWYgKHNhdmVkICYmIHNhdmVkLnllYXIgJiYgUy55ZWFyICE9PSAnYWxsJyAmJiBTdHJpbmcoc2F2ZWQueWVhcikgIT09IFN0cmluZyhTLnllYXIpKSB7CiAgICAgICAgdG9hc3QoJ+C4muC4seC4meC4l+C4tuC4geC5geC4peC5ieC4pyDigJQg4Lij4Liy4Lii',
  '4LiB4Liy4Lij4LiZ4Li14LmJ4Lit4Lii4Li54LmI4LmD4LiZ4Lib4Li1ICcgKyBkaXNwbGF5WWVhcihzYXZlZC55ZWFyKSArCiAgICAgICAgICAnICjguJXguK3guJnguJnguLXguYnguJTguLnguJvguLUgJyArIGRpc3BsYXlZZWFyKFMueWVhcikgKyAnIOC4reC4',
  'ouC4ueC5iCDguYDguJvguKXguLXguYjguKLguJnguJvguLXguYTguJTguYnguJfguLXguYjguKHguLjguKHguILguKfguLLguJrguJkpJywgJ29rJywgNzAwMCk7CiAgICAgIH0KICAgICAgLy8g4LiV4Lix4Lin4Lia4Lit4LiB4Liq4LiW4Liy4LiZ4Liw4Lih4Li4',
  '4Lih4LiC4Lin4Liy4Lia4LiZ4LiC4Li24LmJ4LiZICLguJrguLHguJnguJfguLbguIHguYHguKXguYnguKciIOC5g+C4q+C5ieC4reC4ouC4ueC5iOC5geC4peC5ieC4pyDguIjguLbguIfguYTguKHguYjguJXguYnguK3guIfguYDguJTguYnguIcgdG9hc3Qg4LiL',
  '4LmJ4LizCiAgICAgIC8vIOC5geC4peC5ieC4p+C4i+C4tOC4h+C4geC5jOC5gOC4h+C4teC4ouC4miDguYYg4LmE4Lih4LmI4Lil4LmJ4Liy4LiH4Lir4LiZ4LmJ4Liy4LmB4Lil4Liw4LmE4Lih4LmI4LmA4LiU4LmJ4LiH4LiB4Lil4Lix4Lia4LmE4Lib4Lia4LiZ',
  '4Liq4Li44LiUCiAgICAgIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKICAgICAgLy8g4Lif4Lit4Lij4LmM4Lih4LiX4Li14LmI4LmA4Lib4Li04LiU4Lih4Liy4LiI4Liy4LiB4Lir4LiZ4LmJ4Liy4LiV4LmI4Liy4LiH4Lit4Li34LmI4LiZICjguYDguIrguYjguJkg',
  '4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZ4LmD4LiZ4Lir4LiZ4LmJ4Liy4Lir4LmJ4Lit4LiHKSDguILguK3guYDguJvguLTguJTguKvguJnguYnguLLguJnguLHguYnguJnguIHguKXguLHguJrguITguLfguJkKICAgICAgaWYgKHR5cGVvZiBvcHRzLmFmdGVy',
  'ID09PSAnZnVuY3Rpb24nKSBvcHRzLmFmdGVyKCk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgYnRuLmRpc2FibGVkID0gZmFsc2U7CiAgICAgIGJ0bi50ZXh0Q29udGVudCA9IHJlYy5pZCA/ICfguJrguLHguJnguJfguLbguIHguIHguLLguKPguYHg',
  'uIHguYnguYTguIInIDogJ+C4muC4seC4meC4l+C4tuC4gSc7CiAgICAgIHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7CiAgICB9KTsKICB9Owp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT0KICAg4Lit4LmI4Liy4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiI4Liy4LiB4Lij4Li54LibIChPQ1IpIOC5geC4peC5ieC4p+C4iuC5iOC4p+C4ouC4geC4o+C4reC4geC4n+C4reC4o+C5jOC4oQoKICAg4LiX4Li44LiB4LiE4LmI4Liy4LiX4Li14LmI4LmE',
  '4LiU4LmJ4LmA4Lib4LmH4LiZ4LmB4LiE4LmI4LiC4LmJ4Lit4LmA4Liq4LiZ4LitIOC4nOC4ueC5ieC5g+C4iuC5ieC4geC4lOC5gOC4leC4tOC4oeC5gOC4reC4h+C4l+C4teC4peC4sOC4iuC5iOC4reC4h+C4q+C4o+C4t+C4reC5gOC4leC4tOC4oeC4l+C4seC5',
  'ieC4h+C4q+C4oeC4lOC4geC5h+C5hOC4lOC5iQogICDguYHguKXguLDguYHguIHguYnguYTguILguJXguYjguK3guYTguJTguYnguYDguKrguKHguK0g4LmA4Lie4Lij4Liy4Liw4LiV4Lix4Lin4Lit4LmI4Liy4LiZ4Lie4Lil4Liy4LiU4LmE4LiU4LmJIOC5guC4',
  'lOC4ouC5gOC4ieC4nuC4suC4sOC4peC4suC4ouC4oeC4t+C4reC4geC4seC4muC4o+C4ueC4m+C5gOC4reC4teC4ouC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCnZhciBPQ1JfTUFY',
  'ID0gOCAqIDEwMjQgKiAxMDI0OyAgIC8vIOC4o+C4ueC4m+C5g+C4q+C4jeC5iOC4geC4p+C5iOC4suC4meC4teC5ieC4quC5iOC4h+C5hOC4m+C4reC5iOC4suC4meC5geC4peC5ieC4p+C4oeC4seC4geC4q+C4oeC4lOC5gOC4p+C4peC4sgoKZnVuY3Rpb24gb2Ny',
  'VXNhYmxlKCl7CiAgcmV0dXJuICEhKEZPUk0ub2NyICYmIFMuYm9vdCAmJiBTLmJvb3Quc2V0dGluZ3MgJiYgUy5ib290LnNldHRpbmdzLm9jckVuYWJsZWQpOwp9CgovKiog4Lij4Li54Lib4LmB4Lij4LiB4LiX4Li14LmI4Lie4Lit4Lit4LmI4Liy4LiZ4LmE4LiU',
  '4LmJICjguILguYnguLLguKHguYTguJ/guKXguYzguYPguKvguI3guYjguYDguIHguLTguJnguYHguKXguLDguYTguJ/guKXguYzguJfguLXguYjguYTguKHguYjguYPguIrguYjguKPguLnguJsvUERGKSAqLwpmdW5jdGlvbiBmaXJzdFJlYWRhYmxlKGZpbGVzKXsK',
  'ICBmb3IgKHZhciBpID0gMDsgaSA8IGZpbGVzLmxlbmd0aDsgaSsrKSB7CiAgICB2YXIgZiA9IGZpbGVzW2ldOwogICAgaWYgKGYuc2l6ZSA8PSBPQ1JfTUFYICYmIC9eaW1hZ2VcL3xwZGYkLy50ZXN0KGYudHlwZSB8fCAnJykpIHJldHVybiBmOwogIH0KICByZXR1',
  'cm4gbnVsbDsKfQoKLyoqCiAqIEBwYXJhbSB7c3RyaW5nfSBpZCAgaWQg4LiC4Lit4LiH4LiK4LmI4Lit4LiH4LmB4LiZ4Lia4LmE4Lif4Lil4LmMIOC5gOC4iuC5iOC4mSBmX3NsaXBzCiAqIEBwYXJhbSB7Ym9vbGVhbn0gYXV0byB0cnVlID0g4LmA4LiV4Li04Lih',
  '4LiK4LmI4Lit4LiH4LiX4Li14LmI4Lii4Lix4LiH4Lin4LmI4Liy4LiH4LmD4Lir4LmJ4LmA4Lil4Lii4LmC4LiU4Lii4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LiB4LiUCiAqLwpmdW5jdGlvbiBydW5PY3IoaWQsIGF1dG8pewogIHZhciBpbnB1dCA9IGRvY3VtZW50',
  'LmdldEVsZW1lbnRCeUlkKGlkKTsKICB2YXIgc2xvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkICsgJ19vY3InKTsKICBpZiAoIWlucHV0IHx8ICFzbG90KSByZXR1cm47CgogIHZhciBmaWxlID0gZmlyc3RSZWFkYWJsZShBcnJheS5wcm90b3R5cGUuc2xp',
  'Y2UuY2FsbChpbnB1dC5maWxlcyB8fCBbXSkpOwogIGlmICghZmlsZSkgeyBzbG90LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJoaW50IG10OCI+4LmE4Lih4LmI4Lih4Li14Lij4Li54Lib4LiX4Li14LmI4Lit4LmI4Liy4LiZ4LmE4LiU4LmJICjguKPguK3guIfg',
  'uKPguLHguJrguKPguLnguJvguKDguLLguJ7guYHguKXguLAgUERGIOC5hOC4oeC5iOC5gOC4geC4tOC4mSA4IE1CKTwvZGl2Pic7IHJldHVybjsgfQoKICBzbG90LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJvY3ItYm94Ij48ZGl2IGNsYXNzPSJoZCI+PHNwYW4g',
  'Y2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4Lit4LmI4Liy4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiI4Liy4LiBICcgKwogICAgICAgICAgICAgICAgICAgZXNjKGZpbGUubmFtZS5zbGljZSgwLCAyOCkpICsgJ+KApjwvZGl2PjwvZGl2Pic7',
  'CgogIHJlYWRBc0RhdGFVcmwoZmlsZSkudGhlbihmdW5jdGlvbihwKXsKICAgIHJldHVybiBjYWxsQXBpKCdvY3IucmVhZCcsIHsgZGF0YVVybDogcC5kYXRhVXJsLCBtaW1lVHlwZTogcC5taW1lVHlwZSB9KTsKICB9KS50aGVuKGZ1bmN0aW9uKHIpewogICAgc2xv',
  'dC5pbm5lckhUTUwgPSBvY3JCb3hIdG1sKGlkLCByKTsKICAgIE9DUl9MQVNUW2lkXSA9IHI7CiAgICBpZiAoYXV0bykgewogICAgICB2YXIgbiA9IG9jckFwcGx5QWxsKGlkLCB0cnVlKTsKICAgICAgdG9hc3QobiA/ICfguK3guYjguLLguJnguKPguLnguJvguYHg',
  'uKXguYnguKcg4LmA4LiV4Li04Lih4LmD4Lir4LmJICcgKyBuICsgJyDguIrguYjguK3guIcg4oCUIOC4leC4o+C4p+C4iOC4lOC4ueC4geC5iOC4reC4meC4muC4seC4meC4l+C4tuC4geC4meC4sCcgOiAn4Lit4LmI4Liy4LiZ4Lij4Li54Lib4LmB4Lil4LmJ4Lin',
  'IOC5geC4leC5iOC4ouC4seC4h+C4iOC4seC4muC4hOC5iOC4suC4l+C4teC5iOC5g+C4iuC5ieC5hOC4lOC5ieC5hOC4oeC5iOC5hOC4lOC5iScsIG4gPyAnb2snIDogJycpOwogICAgfQogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgc2xvdC5pbm5lckhUTUwg',
  'PSAnPGRpdiBjbGFzcz0ib2NyLWJveCI+PGRpdiBjbGFzcz0iaGQiPuKaoO+4jyDguK3guYjguLLguJnguKPguLnguJvguYTguKHguYjguKrguLPguYDguKPguYfguIg8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImhpbnQiPicgKyBlc2MoZS5tZXNzYWdlIHx8',
  'IGUpICsgJzwvZGl2PicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20gbXQ4IiBvbmNsaWNrPSJydW5PY3IoXCcnICsgaWQgKyAnXCcpIj7guKXguK3guIfguK3guLXguIHguITguKPguLHguYnguIc8L2J1dHRvbj48L2Rpdj4nOwog',
  'IH0pOwp9Cgp2YXIgT0NSX0xBU1QgPSB7fTsKCi8qKiDguITguYjguLLguJfguLXguYjguK3guYjguLLguJnguYTguJTguYkg4LiE4Li54LmI4LiB4Lix4Lia4LiK4LmI4Lit4LiH4LmD4LiZ4Lif4Lit4Lij4LmM4Lih4LiX4Li14LmI4LiI4Liw4LmA4Lit4Liy4LmE',
  '4Lib4LmD4Liq4LmIICovCmZ1bmN0aW9uIG9jclBhaXJzKHIpewogIHZhciBtID0gRk9STS5vY3IgfHwge307CiAgdmFyIGcgPSByLmd1ZXNzIHx8IHt9OwogIHZhciBvdXQgPSBbXTsKICBpZiAobS5kYXRlICAgJiYgZy5kYXRlKSAgIG91dC5wdXNoKHsgZmllbGQ6',
  'IG0uZGF0ZSwgICBsYWJlbDogJ+C4p+C4seC4meC4l+C4teC5iCcsICAgICB2YWx1ZTogZy5kYXRlLCAgIHNob3c6IHRoRGF0ZShnLmRhdGUpIH0pOwogIGlmIChtLmFtb3VudCAmJiBnLmFtb3VudCkgb3V0LnB1c2goeyBmaWVsZDogbS5hbW91bnQsIGxhYmVsOiAn',
  '4LiI4Liz4LiZ4Lin4LiZ4LmA4LiH4Li04LiZJywgIHZhbHVlOiBnLmFtb3VudCwgc2hvdzogYmFodChnLmFtb3VudCkgfSk7CiAgaWYgKG0udmVuZG9yICYmIGcudmVuZG9yKSBvdXQucHVzaCh7IGZpZWxkOiBtLnZlbmRvciwgbGFiZWw6ICfguKPguYnguLLguJkv',
  '4Lic4Li54LmJ4LiC4Liy4LiiJywgdmFsdWU6IGcudmVuZG9yLCBzaG93OiBnLnZlbmRvciB9KTsKICBpZiAobS50aXRsZSAgJiYgZy50aXRsZSkgIG91dC5wdXNoKHsgZmllbGQ6IG0udGl0bGUsICBsYWJlbDogJ+C4iuC4t+C5iOC4reC4o+C4suC4ouC4geC4suC4',
  'oycsICB2YWx1ZTogZy50aXRsZSwgIHNob3c6IGcudGl0bGUgfSk7CiAgaWYgKG0ubm90ZSAgICYmIGcucmVmKSAgICBvdXQucHVzaCh7IGZpZWxkOiBtLm5vdGUsICAgbGFiZWw6ICfguYDguKXguILguK3guYnguLLguIfguK3guLTguIcnLCAgdmFsdWU6ICfguK3g',
  'uYnguLLguIfguK3guLTguIcgJyArIGcucmVmLCBzaG93OiBnLnJlZiB9KTsKICAvLyDguYPguJrguYDguKrguKPguYfguIjguKvguKXguLLguKLguKPguLLguKLguIHguLLguKMKICBpZiAoZy5pdGVtcyAmJiBnLml0ZW1zLmxlbmd0aCA+IDEpIHsKICAgIGlmIChk',
  'b2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9saW5lcycpKSB7CiAgICAgIC8vIOC4n+C4reC4o+C5jOC4oeC4meC4teC5ieC4oeC4teC4leC4suC4o+C4suC4h+C4o+C4suC4ouC4geC4suC4o+C4ouC5iOC4reC4oiDigJQg4LmA4LiV4Li04Lih4Lil4LiH4LiV4Liy',
  '4Lij4Liy4LiH4LmA4Lil4LiiIOC5hOC4lOC5ieC4l+C4seC5ieC4h+C4iuC4t+C5iOC4rSDguIjguLPguJnguKfguJkg4LmB4Lil4Liw4Lij4Liy4LiE4Liy4LmB4Lii4LiB4LiB4Lix4LiZCiAgICAgIG91dC5wdXNoKHsgZmllbGQ6ICdfbGluZXMnLCBsYWJlbDog',
  'J+C4o+C4suC4ouC4geC4suC4o+C5g+C4meC4muC4tOC4pScsIHZhbHVlOiBnLml0ZW1zLAogICAgICAgICAgICAgICAgIHNob3c6ICfguYDguJXguLTguKEgJyArIGcuaXRlbXMubGVuZ3RoICsgJyDguKPguLLguKLguIHguLLguKPguKXguIfguJXguLLguKPguLLg',
  'uIcnLCBsaW5lczogdHJ1ZSB9KTsKICAgIH0gZWxzZSBpZiAobS50aXRsZSkgewogICAgICB2YXIgbGluZXMgPSBnLml0ZW1zLm1hcChmdW5jdGlvbihpdCwgaSl7IHJldHVybiAoaSsxKSArICcuJyArIGl0Lm5hbWUgKyAnICcgKyBtb25leShpdC5wcmljZSwgMikg',
  'KyAnIOC4vyc7IH0pLmpvaW4oJ1xuJyk7CiAgICAgIG91dC5wdXNoKHsgZmllbGQ6IG0udGl0bGUsIGxhYmVsOiAn4LiX4Li44LiB4Lij4Liy4Lii4LiB4Liy4LijICgnICsgZy5pdGVtcy5sZW5ndGggKyAnKScsIHZhbHVlOiBsaW5lcywKICAgICAgICAgICAgICAg',
  'ICBzaG93OiBnLml0ZW1zLmxlbmd0aCArICcg4Lij4Liy4Lii4LiB4Liy4Lij4LmD4LiZ4LmD4Lia4LmA4Liq4Lij4LmH4LiIJywgbXVsdGk6IHRydWUgfSk7CiAgICB9CiAgfQogIHJldHVybiBvdXQ7Cn0KCmZ1bmN0aW9uIG9jckJveEh0bWwoaWQsIHIpewogIHZh',
  'ciBwYWlycyA9IG9jclBhaXJzKHIpOwogIGlmICghcGFpcnMubGVuZ3RoKSB7CiAgICByZXR1cm4gJzxkaXYgY2xhc3M9Im9jci1ib3giPjxkaXYgY2xhc3M9ImhkIj7wn5SOIOC4reC5iOC4suC4meC4guC5ieC4reC4hOC4p+C4suC4oeC5hOC4lOC5iSDguYHguJXg',
  'uYjguKLguLHguIfguIjguLHguJrguITguYjguLLguJfguLXguYjguYPguIrguYnguYTguJTguYnguYTguKHguYjguYTguJTguYknICsKICAgICAgJzxzcGFuIGNsYXNzPSJzcCI+PGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9Im9j',
  'clRvZ2dsZVJhdyhcJycgKyBpZCArICdcJykiPuC4lOC4ueC4guC5ieC4reC4hOC4p+C4suC4oeC4l+C4teC5iOC4reC5iOC4suC4meC5hOC4lOC5iTwvYnV0dG9uPjwvc3Bhbj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9Im9jci1yYXciIGlkPSInICsgaWQg',
  'KyAnX3JhdyIgaGlkZGVuPicgKyBlc2Moci50ZXh0IHx8ICco4Lin4LmI4Liy4LiHKScpICsgJzwvZGl2PjwvZGl2Pic7CiAgfQogIHJldHVybiAnPGRpdiBjbGFzcz0ib2NyLWJveCI+JyArCiAgICAnPGRpdiBjbGFzcz0iaGQiPvCflI4g4Lit4LmI4Liy4LiZ4LiI',
  '4Liy4LiB4Lij4Li54Lib4LmE4LiU4LmJ4LmB4Lia4Lia4LiZ4Li14LmJIOKAlCDguIHguJTguYDguJXguLTguKHguIrguYjguK3guIfguJfguLXguYjguJXguYnguK3guIfguIHguLLguKMnICsKICAgICAgJzxzcGFuIGNsYXNzPSJzcCI+JyArCiAgICAgICAgJzxi',
  'dXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIHByaSIgb25jbGljaz0ib2NyQXBwbHlBbGwoXCcnICsgaWQgKyAnXCcpIj7guYDguJXguLTguKHguJfguLHguYnguIfguKvguKHguJQ8L2J1dHRvbj4nICsKICAgICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0',
  'b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9Im9jclRvZ2dsZVJhdyhcJycgKyBpZCArICdcJykiPuC4guC5ieC4reC4hOC4p+C4suC4oeC5gOC4leC5h+C4oTwvYnV0dG9uPicgKwogICAgICAnPC9zcGFuPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9Im9jci1o',
  'aXRzIj4nICsgcGFpcnMubWFwKGZ1bmN0aW9uKHAsIGkpewogICAgICByZXR1cm4gJzxkaXYgY2xhc3M9Im9jci1oaXQiPicgKwogICAgICAgICc8c3BhbiBjbGFzcz0iayI+JyArIGVzYyhwLmxhYmVsKSArICc8L3NwYW4+JyArCiAgICAgICAgJzxzcGFuIGNsYXNz',
  'PSJ2IiB0aXRsZT0iJyArIGVzYyhwLmxpbmVzID8gcC5zaG93IDogU3RyaW5nKHAudmFsdWUpKSArICciPicgKyBlc2MocC5zaG93KSArICc8L3NwYW4+JyArCiAgICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJvY3JB',
  'cHBseU9uZShcJycgKyBpZCArICdcJywnICsgaSArICcpIj7guYDguJXguLTguKE8L2J1dHRvbj4nICsKICAgICAgJzwvZGl2Pic7CiAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJvY3ItcmF3IiBpZD0iJyArIGlkICsgJ19yYXci',
  'IGhpZGRlbj4nICsgZXNjKHIudGV4dCB8fCAnKOC4p+C5iOC4suC4hyknKSArICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJoaW50IG10OCI+4LiV4Lij4Lin4LiI4LiE4Lin4Liy4Lih4LiW4Li54LiB4LiV4LmJ4Lit4LiH4LiB4LmI4Lit4LiZ4Lia4Lix4LiZ',
  '4LiX4Li24LiB4LmA4Liq4Lih4LitIOKAlCDguYHguIHguYnguYPguJnguIrguYjguK3guIfguYTguJTguYnguJXguLLguKHguJvguIHguJXguLQ8L2Rpdj4nICsKICAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gb2NyVG9nZ2xlUmF3KGlkKXsKICB2YXIgZWwgPSBkb2N1',
  'bWVudC5nZXRFbGVtZW50QnlJZChpZCArICdfcmF3Jyk7CiAgaWYgKGVsKSBlbC5oaWRkZW4gPSAhZWwuaGlkZGVuOwp9CgovKiog4LmD4Liq4LmI4LiE4LmI4Liy4Lil4LiH4LiK4LmI4Lit4LiHIOC5geC4peC5ieC4p+C5hOC4ruC5hOC4peC4leC5jOC5g+C4q+C5',
  'ieC5gOC4q+C5h+C4meC4p+C5iOC4suC4iuC5iOC4reC4h+C5hOC4q+C4meC4luC4ueC4geC5gOC4leC4tOC4oSAqLwpmdW5jdGlvbiBvY3JGaWxsKGZpZWxkS2V5LCB2YWx1ZSl7CiAgLy8g4LmA4LiV4Li04Lih4Lil4LiH4LiV4Liy4Lij4Liy4LiH4Lij4Liy4Lii',
  '4LiB4Liy4Lij4Lii4LmI4Lit4LiiICjguYPguJrguYDguKrguKPguYfguIjguJfguLXguYjguKHguLXguILguK3guIfguKvguKXguLLguKLguK3guKLguYjguLLguIcpCiAgaWYgKGZpZWxkS2V5ID09PSAnX2xpbmVzJykgewogICAgdmFyIGFkZCA9ICh2YWx1ZSB8',
  'fCBbXSkubWFwKGZ1bmN0aW9uKGl0KXsKICAgICAgcmV0dXJuIHsgbmFtZTogaXQubmFtZSwgcXR5OiAxLCB1bml0OiAnJywgcHJpY2U6IE51bWJlcihpdC5wcmljZSkgfHwgMCB9OwogICAgfSk7CiAgICBpZiAoIWFkZC5sZW5ndGgpIHJldHVybiBmYWxzZTsKICAg',
  'IEZPUk0ubGluZXMgPSAoRk9STS5saW5lcyB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uKGwpeyByZXR1cm4gU3RyaW5nKGwubmFtZSB8fCAnJykudHJpbSgpOyB9KS5jb25jYXQoYWRkKTsKICAgIHJlZHJhd0xpbmVzKCk7CiAgICB2YXIgYm94ID0gZG9jdW1lbnQuZ2V0',
  'RWxlbWVudEJ5SWQoJ2ZfbGluZXMnKTsKICAgIGlmIChib3gpIHsKICAgICAgYm94LmNsYXNzTGlzdC5hZGQoJ29jci1maWxsZWQnKTsKICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyBib3guY2xhc3NMaXN0LnJlbW92ZSgnb2NyLWZpbGxlZCcpOyB9LCAxNjAw',
  'KTsKICAgIH0KICAgIHJldHVybiB0cnVlOwogIH0KCiAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyArIGZpZWxkS2V5KTsKICBpZiAoIWVsKSByZXR1cm4gZmFsc2U7CiAgZWwudmFsdWUgPSB2YWx1ZTsKICBlbC5jbGFzc0xpc3QuYWRkKCdv',
  'Y3ItZmlsbGVkJyk7CiAgc2V0VGltZW91dChmdW5jdGlvbigpeyBlbC5jbGFzc0xpc3QucmVtb3ZlKCdvY3ItZmlsbGVkJyk7IH0sIDE2MDApOwogIHJlY2FsY1N1bXMoKTsKICByZXR1cm4gdHJ1ZTsKfQoKZnVuY3Rpb24gb2NyQXBwbHlPbmUoaWQsIGlkeCl7CiAg',
  'dmFyIHIgPSBPQ1JfTEFTVFtpZF07CiAgaWYgKCFyKSByZXR1cm47CiAgdmFyIHAgPSBvY3JQYWlycyhyKVtpZHhdOwogIGlmIChwICYmIG9jckZpbGwocC5maWVsZCwgcC52YWx1ZSkpIHsKICAgIHRvYXN0KHAubGluZXMgPyAn4LmA4LiV4Li04LihICcgKyBwLnZh',
  'bHVlLmxlbmd0aCArICcg4Lij4Liy4Lii4LiB4Liy4Lij4Lil4LiH4Lia4Li04Lil4LmB4Lil4LmJ4LinIOKAlCDguJXguKPguKfguIjguIjguLPguJnguKfguJnguIHguLHguJrguKPguLLguITguLLguK3guLXguIHguITguKPguLHguYnguIcnIDogJ+C5gOC4leC4',
  'tOC4oScgKyBwLmxhYmVsICsgJ+C5geC4peC5ieC4pycsICdvaycpOwogIH0KfQoKLyoqCiAqIEBwYXJhbSB7Ym9vbGVhbn0gb25seUVtcHR5IHRydWUgPSDguYDguJXguLTguKHguYDguInguJ7guLLguLDguIrguYjguK3guIfguJfguLXguYjguKLguLHguIfguKfg',
  'uYjguLLguIcgKOC5g+C4iuC5ieC4leC4reC4meC5gOC4leC4tOC4oeC4reC4seC4leC5guC4meC4oeC4seC4leC4tAogKiAgICAgICAgICAgICAgICAgICAgICAgICAgICDguIjguLDguYTguJTguYnguYTguKHguYjguJfguLHguJrguKrguLTguYjguIfguJfguLXg',
  'uYjguJzguLnguYnguYPguIrguYnguJ7guLTguKHguJ7guYzguYTguJvguYHguKXguYnguKcpCiAqIEByZXR1cm4ge251bWJlcn0g4LiI4Liz4LiZ4Lin4LiZ4LiK4LmI4Lit4LiH4LiX4Li14LmI4LmA4LiV4Li04Lih4LiI4Lij4Li04LiHCiAqLwpmdW5jdGlvbiBv',
  'Y3JBcHBseUFsbChpZCwgb25seUVtcHR5KXsKICB2YXIgciA9IE9DUl9MQVNUW2lkXTsKICBpZiAoIXIpIHJldHVybiAwOwogIHZhciBkb25lID0ge307CiAgdmFyIG4gPSAwOwogIG9jclBhaXJzKHIpLmZvckVhY2goZnVuY3Rpb24ocCl7CiAgICBpZiAoZG9uZVtw',
  'LmZpZWxkXSkgcmV0dXJuOyAgICAgICAgICAgICAgICAgICAgICAgLy8g4LiK4LmI4Lit4LiH4LmA4LiU4Li14Lii4Lin4LiB4Lix4LiZ4LmA4LiV4Li04Lih4LiE4Lij4Lix4LmJ4LiH4LmA4LiU4Li14Lii4LinIOC5gOC4reC4suC4leC4seC4p+C5geC4o+C4gQog',
  'ICAgaWYgKHAuZmllbGQgPT09ICdfbGluZXMnKSB7CiAgICAgIC8vIOC4leC4suC4o+C4suC4h+C4o+C4suC4ouC4geC4suC4o+C4ouC5iOC4reC4ojogIuC4p+C5iOC4suC4hyIg4Lir4Lih4Liy4Lii4LiW4Li24LiH4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lij',
  '4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4LiV4Lix4LmJ4LiH4LiK4Li34LmI4Lit4LmE4Lin4LmJCiAgICAgIGlmIChvbmx5RW1wdHkgJiYgKEZPUk0ubGluZXMgfHwgW10pLnNvbWUoZnVuY3Rpb24obCl7IHJldHVybiBTdHJpbmcobC5uYW1lIHx8ICcnKS50cmlt',
  'KCk7IH0pKSByZXR1cm47CiAgICB9IGVsc2UgewogICAgICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl8nICsgcC5maWVsZCk7CiAgICAgIGlmICghZWwpIHJldHVybjsKICAgICAgaWYgKG9ubHlFbXB0eSAmJiBTdHJpbmcoZWwudmFsdWUgfHwg',
  'JycpLnRyaW0oKSAhPT0gJycpIHJldHVybjsKICAgIH0KICAgIGlmIChvY3JGaWxsKHAuZmllbGQsIHAudmFsdWUpKSB7IGRvbmVbcC5maWVsZF0gPSB0cnVlOyBuKys7IH0KICB9KTsKICBpZiAoIW9ubHlFbXB0eSkgdG9hc3QobiA/ICfguYDguJXguLTguKHguYPg',
  'uKvguYkgJyArIG4gKyAnIOC4iuC5iOC4reC4h+C5geC4peC5ieC4pyDigJQg4LiV4Lij4Lin4LiI4LiU4Li54LiB4LmI4Lit4LiZ4Lia4Lix4LiZ4LiX4Li24LiBJyA6ICfguIrguYjguK3guIfguJfguLXguYjguIjguLDguYDguJXguLTguKHguYTguKHguYjguK3g',
  'uKLguLnguYjguYPguJnguJ/guK3guKPguYzguKHguJnguLXguYknLCBuID8gJ29rJyA6ICdlcnInKTsKICByZXR1cm4gbjsKfQoKZnVuY3Rpb24gcm9vbU9wdGlvbnMoKXsgcmV0dXJuIFMuYm9vdCA/IFMuYm9vdC5yb29tcyA6IFtdOyB9CmZ1bmN0aW9uIG9wdChu',
  'YW1lKXsgcmV0dXJuIChTLmJvb3QgJiYgUy5ib290LnNjaGVtYVtuYW1lXSkgfHwgW107IH0KLyoqIOC4p+C4seC4meC4meC4teC5ieC4leC4suC4oeC5gOC4p+C4peC4suC5g+C4meC5gOC4hOC4o+C4t+C5iOC4reC4hyDigJQg4Lir4LmJ4Liy4Lih4LmD4LiK4LmJ',
  'IHRvSVNPU3RyaW5nKCkg4LmA4Lie4Lij4Liy4Liw4LmA4Lib4LmH4LiZ4LmA4Lin4Lil4LiyIFVUQyDguIrguYjguKfguIfguYDguJfguLXguYjguKLguIfguITguLfguJnigJM3IOC5guC4oeC4h+C5gOC4iuC5ieC4suC5gOC4p+C4peC4suC5hOC4l+C4ouC4iOC4',
  'sOC5hOC4lOC5ieC4p+C4seC4meC4l+C4teC5iOC4guC4reC4h+C5gOC4oeC4t+C5iOC4reC4p+C4suC4mSAqLwpmdW5jdGlvbiB0b2RheSgpewogIHZhciBkID0gbmV3IERhdGUoKTsKICByZXR1cm4gZC5nZXRGdWxsWWVhcigpICsgJy0nICsgKCcwJyArIChkLmdl',
  'dE1vbnRoKCkgKyAxKSkuc2xpY2UoLTIpICsgJy0nICsgKCcwJyArIGQuZ2V0RGF0ZSgpKS5zbGljZSgtMik7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3guKPguYzguKE6',
  'IOC4geC5ieC4reC4meC4q+C4meC4teC5iQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybURlYnQocmVjLCBsZWRnZXIpewogIC8vIOC5gOC4peC4t+C4reC4geC5geC4',
  'oeC5iOC5hOC4lOC5ieC4iOC4suC4geC4l+C4uOC4geC4muC4seC4jeC4iuC4tSDguKLguIHguYDguKfguYnguJnguJXguLHguKfguYDguK3guIcKICB2YXIgYWxsID0gKEFMTF9ERUJUUyB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uKGQpeyByZXR1cm4gIXJlYyB8fCBk',
  'LmlkICE9PSByZWMuaWQ7IH0pOwogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4geC5ieC4reC4meC4q+C4meC4teC5iScgOiAn4LmA4Lie4Li04LmI4Lih4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJJywKICAg',
  'IHJlY29yZDogcmVjLCBhY3Rpb246ICdkZWJ0LnNhdmUnLCBiYXNlOiB7IGxlZGdlcjogbGVkZ2VyIH0sCiAgICBvbkRlbGV0ZTogZGVsRGVidCwKICAgIGZpZWxkczogWwogICAgICB7IGtleTondGl0bGUnLCAgICBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4Lij4Lir',
  '4LiZ4Li14LmJJywgcmVxdWlyZWQ6dHJ1ZSwgZnVsbDp0cnVlLCBwaDon4LmA4LiK4LmI4LiZIOC4hOC5iOC4suC4geC5iOC4reC4quC4o+C5ieC4suC4hyBUaGUgTSBDb3JuZXIgQVAnIH0sCiAgICAgIHsga2V5OidsZWRnZXInLCAgIGxhYmVsOifguJvguKPguLDg',
  'uYDguKDguJfguJrguLHguI3guIrguLUnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOlsn4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiBJywn4Lir4LiZ4Li14LmJ4Lij4Lit4LiHJ10sIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5OidjcmVkaXRvcicsIGxhYmVsOifg',
  'uYDguIjguYnguLLguKvguJnguLXguYknLCBwaDon4LmA4LiK4LmI4LiZIOC4hOC4o+C4reC4muC4hOC4o+C4seC4pyAvIOC4mOC4meC4suC4hOC4suC4oyAvIOC4m+C5ieC4suC4leC4sicgfSwKICAgICAgeyBrZXk6J3BhcmVudElkJywgbGFiZWw6J+C5gOC4m+C5',
  'h+C4meC4quC5iOC4p+C4meC4q+C4meC4tuC5iOC4h+C4guC4reC4h+C4geC5ieC4reC4meC4q+C4meC4teC5iScsIHR5cGU6J3NlbGVjdCcsIGZ1bGw6dHJ1ZSwKICAgICAgICBvcHRpb25zOiBhbGwubWFwKGZ1bmN0aW9uKGQpeyByZXR1cm4geyB2YWx1ZTpkLmlk',
  'LCBsYWJlbDpkLnRpdGxlICsgJyAoJyArIGQubGVkZ2VyICsgJyknIH07IH0pLAogICAgICAgIGhpbnQ6J+C5g+C4iuC5ieC5gOC4oeC4t+C5iOC4reC5gOC4h+C4tOC4meC4geC5ieC4reC4meC4meC4teC5ieC5gOC4m+C5h+C4meC4l+C4uOC4meC4guC4reC4h+C4',
  'reC4teC4geC4geC5ieC4reC4mSDguYDguIrguYjguJkg4LmA4LiH4Li04LiZ4Lii4Li34Lih4Lib4LmJ4Liy4LiV4Liy4LmA4Lib4LmH4LiZ4Liq4LmI4Lin4LiZ4Lir4LiZ4Li24LmI4LiH4LiC4Lit4LiH4Lir4LiZ4Li14LmJ4LiL4Li34LmJ4Lit4LiX4Li14LmI',
  '4LiU4Li04LiZIOKAlCAnICsKICAgICAgICAgICAgICfguIjguYjguLLguKLguITguLfguJnguIHguYnguK3guJnguJnguLXguYnguYHguKXguYnguKfguIHguYnguK3guJnguYHguKHguYjguIjguLDguKXguJTguJXguLLguKHguYTguJvguJTguYnguKfguKIg4LmB',
  '4Lil4Liw4Lii4Lit4LiU4Lij4Lin4Lih4LiI4Liw4LmE4Lih4LmI4LiW4Li54LiB4LiZ4Lix4Lia4LiL4LmJ4LizJyB9LAogICAgICB7IGtleTonc3RhcnREYXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4geC5iOC4reC4q+C4meC4teC5iScsIHR5cGU6',
  'J2RhdGUnIH0sCiAgICAgIHsga2V5OidwcmluY2lwYWwnLCBsYWJlbDon4Lii4Lit4LiU4Lir4LiZ4Li14LmJ4LiV4Lix4LmJ4LiH4LiV4LmJ4LiZICjguJrguLLguJcpJywgdHlwZTonbW9uZXknLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidpbnRlcmVz',
  'dFBlck1vbnRoJywgbGFiZWw6J+C4lOC4reC4geC5gOC4muC4teC5ieC4ouC4leC5iOC4reC5gOC4lOC4t+C4reC4mSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JyB9LAogICAgICB7IGtleToncGxhblBlck1vbnRoJywgbGFiZWw6J+C4ouC4reC4lOC4nOC5iOC4',
  'reC4meC4leC5iOC4reC5gOC4lOC4t+C4reC4mSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JyB9LAogICAgICB7IGtleTonZHVlRGF5JywgICBsYWJlbDon4LiB4Liz4Lir4LiZ4LiU4LiK4Liz4Lij4LiwICjguKfguLHguJnguJfguLXguYjguILguK3guIfguYDg',
  'uJTguLfguK3guJkpJywgdHlwZTonbnVtYmVyJywgcGg6JzIwJyB9LAogICAgICB7IGtleTonc3RhdHVzJywgICBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ2RlYnRTdGF0dXNlcycpLCBibGFuazpmYWxzZSB9LAog',
  'ICAgICB7IGtleTonYWxzb0luJywgICBsYWJlbDon4LmB4Liq4LiU4LiH4LmD4LiZ4Lit4Li14LiB4Lir4LiZ4LmJ4Liy4LiU4LmJ4Lin4LiiJywgdHlwZTonc2VsZWN0JywKICAgICAgICBvcHRpb25zOlsgeyB2YWx1ZTon4Lir4LiZ4Li14LmJ4Lij4Lit4LiHJywg',
  'bGFiZWw6J+C4q+C4meC5ieC4suC4q+C4meC4teC5ieC4quC4tOC4mScgfSwgeyB2YWx1ZTon4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiBJywgbGFiZWw6J+C4q+C4meC5ieC4suC4o+C4suC4ouC4geC4suC4o+C4quC4o+C4uOC4m+C4o+C4p+C4oScgfSBdLAogICAg',
  'ICAgIGhpbnQ6J+C4geC5ieC4reC4meC5gOC4lOC4teC4ouC4p+C4geC4seC4mSDguYTguKHguYjguYTguJTguYnguITguLHguJTguKXguK3guIEg4oCUIOC4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C4iuC4s+C4o+C4sCDguYHguIHguYkg4Lir4Lij4Li34Lit',
  '4Lil4Lia4LiI4Liy4LiB4Lir4LiZ4LmJ4Liy4LmE4Lir4LiZIOC4reC4teC4geC4q+C4meC5ieC4suC4geC5h+C5gOC4m+C4peC4teC5iOC4ouC4meC4leC4suC4oSDCtyDguYDguKXguLfguK3guIHguKvguJnguYnguLLguYDguJTguLXguKLguKfguIHguLHguJrg',
  'uJvguKPguLDguYDguKDguJfguJrguLHguI3guIrguLXguYTguKfguYkgPSDguYTguKHguYjguKHguLXguJzguKUnIH0sCiAgICAgIHsga2V5Oidub3RlJywgICAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6',
  'dHJ1ZSB9CiAgICBdCiAgfSk7CiAgaWYgKCFyZWMpIHsgdmFyIGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9sZWRnZXInKTsgaWYgKGUpIGUudmFsdWUgPSBsZWRnZXI7IH0KfQoKZnVuY3Rpb24gZGVsRGVidChpZCl7CiAgY29uZmlybUFjdGlvbign4Lil',
  '4Lia4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJ4LiZ4Li14LmJPyAo4LiW4LmJ4Liy4Lii4Lix4LiH4Lih4Li14Lij4Liy4Lii4LiB4Liy4Lij4LiK4Liz4Lij4Liw4Lir4Lij4Li34Lit4LiB4LmJ4Lit4LiZ4Lii4LmI4Lit4Lii4Lic4Li54LiB4Lit4Lii4Li54LmI',
  'IOC4o+C4sOC4muC4muC4iOC4sOC5hOC4oeC5iOC4ouC4reC4oeC4peC4miDguYDguJ7guLfguYjguK3guYTguKHguYjguYPguKvguYnguKLguK3guJTguKLguYnguLLguKLguYTguJvguIHguYnguK3guJnguK3guLfguYjguJnguYDguIfguLXguKLguJog4LmGKScs',
  'IGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdkZWJ0LmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9u',
  'KGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4Lij4Liy4Lii4LiB4Liy4Lij4LmC',
  '4Lit4LiZ4LmD4LiK4LmJ4Lir4LiZ4Li14LmJCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtRGVidFBheW1lbnQocmVjLCBsZWRnZXIpewogIHZhciBkZWJ0cyA9IChT',
  'LmNhY2hlW1MucGFnZV0gJiYgUy5jYWNoZVtTLnBhZ2VdLmRlYnRzKSB8fCBbXTsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguKPguLLguKLguIHguLLguKPguIrguLPguKPguLAnIDogJ+C4muC4seC4meC4',
  'l+C4tuC4geC4geC4suC4o+C5guC4reC4meC5g+C4iuC5ieC4q+C4meC4teC5iScsCiAgICByZWNvcmQ6IHJlYyB8fCB7IHBheURhdGU6IHRvZGF5KCksIGNoYW5uZWw6ICfguYLguK3guJkgUVInIH0sCiAgICAvLyDguYHguIHguYnguKPguLLguKLguIHguLLguKPg',
  'uYDguJTguLTguKHguITguIfguJrguLHguI3guIrguLXguYDguJTguLTguKHguYTguKfguYkg4oCUIOC4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4oeC4suC4iOC4suC4geC4reC4teC4geC4q+C4meC5ieC4siAo4LiB4LmJ4Lit4LiZ4LiX4Li14LmI4LmB4Liq',
  '4LiU4LiH4Lij4LmI4Lin4LihKSDguJXguYnguK3guIfguYTguKHguYjguJbguLnguIHguKLguYnguLLguKLguJrguLHguI3guIrguLUKICAgIGFjdGlvbjogJ2RlYnQuc2F2ZVBheW1lbnQnLCBiYXNlOiB7IGxlZGdlcjogKHJlYyAmJiByZWMubGVkZ2VyKSB8fCBs',
  'ZWRnZXIgfSwgYnVja2V0OiAnZGVidCcsCiAgICBvY3I6IHsgZGF0ZToncGF5RGF0ZScsIGFtb3VudDoncHJpbmNpcGFsJywgbm90ZTonbm90ZScgfSwKICAgIG9uRGVsZXRlOiBkZWxEZWJ0UGF5bWVudCwKICAgIGZpZWxkczogWwogICAgICB7IGtleToncGF5RGF0',
  'ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguIrguLPguKPguLAnLCB0eXBlOidkYXRlJywgcmVxdWlyZWQ6dHJ1ZSB9LAogICAgICB7IGtleTonY2hhbm5lbCcsIGxhYmVsOifguIrguYjguK3guIfguJfguLLguIcnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25z',
  'Om9wdCgncGF5Q2hhbm5lbHMnKSB9LAogICAgICB7IGtleToncHJpbmNpcGFsJywgbGFiZWw6J+C5gOC4h+C4tOC4meC4leC5ieC4mSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5Jywgc3Vtczp0cnVlLAogICAgICAgIGhpbnQ6J+C4quC5iOC4p+C4meC4l+C4teC5',
  'iOC5hOC4m+C4peC4lOC4ouC4reC4lOC4q+C4meC4teC5ieC4iOC4o+C4tOC4hycgfSwKICAgICAgeyBrZXk6J2ludGVyZXN0JywgIGxhYmVsOifguJTguK3guIHguYDguJrguLXguYnguKIgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHN1bXM6dHJ1ZSwKICAg',
  'ICAgICBoaW50OifguYTguKHguYjguJbguLnguIHguJnguLPguYTguJvguKXguJTguKLguK3guJTguKvguJnguLXguYknIH0sCiAgICAgIHsga2V5OidfdG90YWwnLCAgbGFiZWw6J+C4o+C4p+C4oeC4l+C4teC5iOC5guC4reC4mScsIHR5cGU6J2NvbXB1dGVkJywg',
  'ZnJvbTpbJ3ByaW5jaXBhbCcsJ2ludGVyZXN0J10sCiAgICAgICAgaGludDon4LiV4Lij4Lin4LiI4LmD4Lir4LmJ4LiV4Lij4LiH4LiB4Lix4Lia4Lii4Lit4LiU4LmD4LiZ4Liq4Lil4Li04LibIMK3IOC4o+C4sOC4muC4muC4hOC4tOC4lOC5g+C4q+C5ieC4reC4',
  'seC4leC5guC4meC4oeC4seC4leC4tCcgfSwKICAgICAgeyBrZXk6J2luc3RhbGxtZW50JywgbGFiZWw6J+C4h+C4p+C4lOC4l+C4teC5iCcsIHBoOifguYDguIrguYjguJkgOS8yMDI2JyB9LAogICAgICB7IGtleTonZGVidElkJywgIGxhYmVsOifguJzguLnguIHg',
  'uIHguLHguJrguIHguYnguK3guJnguKvguJnguLXguYknLCB0eXBlOidzZWxlY3QnLAogICAgICAgIG9wdGlvbnM6IGRlYnRzLm1hcChmdW5jdGlvbihkKXsgcmV0dXJuIHsgdmFsdWU6ZC5pZCwgbGFiZWw6ZC50aXRsZSB9OyB9KSwKICAgICAgICBoaW50OifguYDg',
  'uKfguYnguJnguKfguYjguLLguIfguYTguJTguYkg4oCUIOC4o+C4sOC4muC4muC4leC4seC4lOC4geC5ieC4reC4meC5gOC4geC5iOC4suC4geC5iOC4reC4meC5g+C4q+C5ieC5gOC4reC4hyDCtyDguYDguKXguLfguK3guIHguIHguYnguK3guJnguJfguLXguYjg',
  'uKHguLLguIjguLLguIHguK3guLXguIHguKvguJnguYnguLIg4Lii4Lit4LiU4LiI4Liw4LmA4LiC4LmJ4Liy4LiX4Lix4LmJ4LiH4Liq4Lit4LiH4Lir4LiZ4LmJ4LiyJyB9LAogICAgICB7IGtleToncGF5ZXInLCAgIGxhYmVsOifguJzguLnguYnguIrguLPguKPg',
  'uLAnIH0sCiAgICAgIHsga2V5OidzbGlwcycsICAgbGFiZWw6J+C4quC4peC4tOC4m+C4geC4suC4o+C5guC4reC4mScsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4',
  'uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0KICB9KTsKfQoKLyoqCiAqIOC4ouC4reC4lOC5g+C4meC4o+C4sOC4muC4muC5hOC4oeC5iOC4leC4o+C4h+C4geC4seC4muC4ouC4reC4lOC4l+C4teC5iOC5gOC4iOC5ieC4suC4q+C4meC4teC5',
  'ieC5geC4iOC5ieC4hyDihpIg4LiB4Lij4Lit4LiB4Lii4Lit4LiU4LiE4LiH4LmA4Lir4Lil4Li34Lit4LiI4Lij4Li04LiHIOC4o+C4sOC4muC4muC4muC4seC4meC4l+C4tuC4geC4quC5iOC4p+C4meC4leC5iOC4suC4h+C5g+C4q+C5iQogKiDguYTguKHguYjg',
  'uYTguJvguYHguIHguYnguKLguK3guJTguJXguLHguYnguIfguJXguYnguJkg4LmA4Lie4Lij4Liy4Liw4Lib4Lij4Liw4Lin4Lix4LiV4Li04LiI4Liw4LmA4Lie4Li14LmJ4Lii4LiZIOC4o+C4suC4ouC4geC4suC4o+C4m+C4o+C4seC4muC4ouC4reC4lOC4peC4',
  'muC4l+C4tOC5ieC4h+C5hOC4lOC5ieC4luC5ieC4suC4geC4o+C4reC4geC4nOC4tOC4lAogKi8KZnVuY3Rpb24gZm9ybVJlY29uY2lsZURlYnQoeCl7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6ICfguJvguKPguLHguJrguKLguK3guJTguYPguKvguYnguJXguKPg',
  'uIfguKLguK3guJTguIjguKPguLTguIcgwrcgJyArIHgudGl0bGUsCiAgICByZWNvcmQ6IHsgcGF5RGF0ZTogdG9kYXkoKSB9LAogICAgYWN0aW9uOiAnZGVidC5yZWNvbmNpbGUnLCBiYXNlOiB7IGRlYnRJZDogeC5pZCB9LAogICAgZmllbGRzOiBbCiAgICAgIHsg',
  'a2V5OidhY3R1YWxSZW1haW5pbmcnLCBsYWJlbDon4Lii4Lit4LiU4LiE4LiH4LmA4Lir4Lil4Li34Lit4LiI4Lij4Li04LiH4LiV4Lit4LiZ4LiZ4Li14LmJICjguJrguLLguJcpJywgdHlwZTonbW9uZXknLCByZXF1aXJlZDp0cnVlLCBmdWxsOnRydWUsCiAgICAg',
  'ICAgaGludDon4LmD4LiZ4Lij4Liw4Lia4Lia4LiV4Lit4LiZ4LiZ4Li14LmJ4LiE4LiH4LmA4Lir4Lil4Li34LitIDxiPicgKyBiYWh0KHgucmVtYWluaW5nKSArICc8L2I+IMK3IOC4luC5ieC4suC4m+C4tOC4lOC4q+C4meC4teC5ieC4geC5ieC4reC4meC4meC4',
  'teC5ieC5geC4peC5ieC4pyDguYPguKrguYggMCcgfSwKICAgICAgeyBrZXk6J3BheURhdGUnLCBsYWJlbDon4LiTIOC4p+C4seC4meC4l+C4teC5iCcsIHR5cGU6J2RhdGUnLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICAgbGFiZWw6J+C4',
  'quC4suC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlLAogICAgICAgIHBoOifguYDguIrguYjguJkg4Lih4Li14LiH4Lin4LiU4LiX4Li14LmI4LmE4Lih4LmI4LmE4LiU4LmJ4Lia4Lix4LiZ4LiX4Li24LiB4LmE4Lin4LmJIC8g4LmA4LiI',
  '4LmJ4Liy4Lir4LiZ4Li14LmJ4Lil4LiU4LmD4Lir4LmJJywKICAgICAgICBoaW50OifguKPguLDguJrguJrguJrguLHguJnguJfguLbguIHguKrguYjguKfguJnguJXguYjguLLguIfguYDguJvguYfguJnguKPguLLguKLguIHguLLguKPguIrguYjguK3guIfguJfg',
  'uLLguIcgIuC4m+C4o+C4seC4muC4ouC4reC4lCIg4Lic4Li54LiB4LiB4Lix4Lia4LiB4LmJ4Lit4LiZ4LiZ4Li14LmJICcgKwogICAgICAgICAgICAgJ+C5hOC4oeC5iOC4meC4seC4muC5gOC4m+C5h+C4meC4ouC4reC4lOC4nOC5iOC4reC4meC4o+C4suC4ouC4',
  'm+C4teC5geC4peC4sOC5hOC4oeC5iOC5g+C4iuC5ieC4hOC4suC4lOC4geC4suC4o+C4k+C5jOC4p+C4seC4meC4m+C4tOC4lOC4q+C4meC4teC5iSDCtyDguIHguKPguK3guIHguJzguLTguJTguIHguYfguKXguJrguKPguLLguKLguIHguLLguKPguJnguLHguYng',
  'uJnguJfguLTguYnguIfguYTguJTguYknIH0KICAgIF0KICB9KTsKfQoKZnVuY3Rpb24gZGVsRGVidFBheW1lbnQoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4o+C4suC4ouC4geC4suC4o+C4iuC4s+C4o+C4sOC4meC4teC5iT8nLCBmdW5jdGlvbigpewog',
  'ICAgY2FsbEFwaSgnZGVidC5kZWxldGVQYXltZW50JywgeyBpZDogaWQgfSkudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRv',
  'YXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguKPguLLguKLguIHguLLguKPguIvguLfguYng',
  'uK3guILguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1QdXJjaGFzZShyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5',
  'geC4geC5ieC5hOC4guC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4rScgOiAn4LmA4Lie4Li04LmI4Lih4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHJywKICAgIHJlY29yZDogcmVjIHx8IHsgYnV5RGF0ZTogdG9kYXkoKSB9LAogICAg',
  'YWN0aW9uOiAncHVyY2hhc2Uuc2F2ZScsIGJ1Y2tldDogJ3B1cmNoYXNlcycsIHdpZGU6IHRydWUsCiAgICBvY3I6IHsgZGF0ZTonYnV5RGF0ZScsIGFtb3VudDoncHJpY2UnLCB2ZW5kb3I6J3ZlbmRvcicsIHRpdGxlOidpdGVtJyB9LAogICAgb25EZWxldGU6IGRl',
  'bFB1cmNoYXNlLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5OidpdGVtJywgICAgbGFiZWw6J+C4iuC4t+C5iOC4reC4muC4tOC4pSAvIOC4o+C4suC4ouC4geC4suC4o+C4q+C4peC4seC4gScsIHR5cGU6J3RleHRhcmVhJywgcmVxdWlyZWQ6dHJ1ZSwgZnVsbDp0',
  'cnVlLAogICAgICAgIHBoOifguYDguIrguYjguJkg4Liq4Lix4LmI4LiH4LiC4Lit4LiH4LmA4LiC4LmJ4Liy4Lir4LitIFNob3BlZSDguKPguYnguLLguJkgQUJDJywKICAgICAgICBoaW50OifguJbguYnguLLguYPguKrguYjguKPguLLguKLguIHguLLguKPguKLg',
  'uYjguK3guKLguILguYnguLLguIfguKXguYjguLLguIfguYTguKfguYkg4LmB4Lil4LmJ4Lin4LmA4Lin4LmJ4LiZ4LiK4LmI4Lit4LiH4LiZ4Li14LmJ4Lin4LmI4Liy4LiHIOC4o+C4sOC4muC4muC4iOC4sOC4leC4seC5ieC4h+C4iuC4t+C5iOC4reC5g+C4q+C5',
  'ieC5gOC4reC4h+C4iOC4suC4geC4o+C4suC4ouC4geC4suC4o+C5geC4o+C4gScgfSwKICAgICAgeyBrZXk6J2J1eURhdGUnLCBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiL4Li34LmJ4LitJywgdHlwZTonZGF0ZScsIHJlcXVpcmVkOnRydWUgfSwKICAgICAg',
  'eyBrZXk6J2NhdGVnb3J5JywgbGFiZWw6J+C4q+C4oeC4p+C4lOC4q+C4oeC4ueC5iCcsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdwdXJjaGFzZUNhdGVnb3JpZXMnKSB9LAoKICAgICAgeyBrZXk6J2xpbmVzJywgICBsYWJlbDon4Lij4Liy4Lii4LiB4Liy',
  '4Lij4LmD4LiZ4Lia4Li04LilICjguIvguLfguYnguK3guJfguLXguYDguJTguLXguKLguKfguKvguKXguLLguKLguK3guKLguYjguLLguIfguYPguKrguYjguJXguKPguIfguJnguLXguYkpJywgdHlwZTonbGluZXMnLCBmdWxsOnRydWUsCiAgICAgICAgaGludDon',
  '4Liq4Lix4LmI4LiH4Lit4Lit4LiZ4LmE4Lil4LiZ4LmM4LiE4Lij4Lix4LmJ4LiH4LmA4LiU4Li14Lii4Lin4LmE4LiU4LmJ4LiC4Lit4LiH4Lir4Lil4Liy4Lii4Lit4Lii4LmI4Liy4LiHIOC5g+C4quC5iOC5geC4ouC4geC4l+C4teC4peC4sOC4o+C4suC4ouC4',
  'geC4suC4o+C5hOC4lOC5ieC5gOC4peC4oiDCtyDguKPguLDguJrguJrguKPguKfguKHguKPguLLguITguLLguYPguKvguYnguK3guLHguJXguYLguJnguKHguLHguJXguLQnIH0sCiAgICAgIHsga2V5OidzaGlwcGluZycsIGxhYmVsOifguITguYjguLLguKrguYjg',
  'uIcgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHBoOicwJywgb25pbnB1dDoncmVjYWxjQmlsbCgpJyB9LAogICAgICB7IGtleTonZGlzY291bnQnLCBsYWJlbDon4Liq4LmI4Lin4LiZ4Lil4LiUICjguJrguLLguJcpJywgdHlwZTonbW9uZXknLCBwaDonMCcs',
  'IG9uaW5wdXQ6J3JlY2FsY0JpbGwoKScgfSwKICAgICAgeyBrZXk6J3ByaWNlJywgICBsYWJlbDon4Lij4Liy4LiE4Liy4Lij4Lin4Lih4LiX4Lix4LmJ4LiH4Lia4Li04LilICjguJrguLLguJcpJywgdHlwZTonbW9uZXknLCByZXF1aXJlZDp0cnVlLAogICAgICAg',
  'IGhpbnQ6JzxzcGFuIGlkPSJiaWxsSGludCI+PC9zcGFuPicgfSwKICAgICAgeyBrZXk6J29yZGVyTm8nLCBsYWJlbDon4LmA4Lil4LiC4LiX4Li14LmI4LiE4Liz4Liq4Lix4LmI4LiH4LiL4Li34LmJ4LitJywgcGg6J+C5gOC4peC4guC4reC4reC4o+C5jOC5gOC4',
  'lOC4reC4o+C5jOC4iOC4suC4gSBTaG9wZWUgLyBMYXphZGEnIH0sCiAgICAgIHsga2V5Oid2ZW5kb3InLCAgbGFiZWw6J+C5geC4q+C4peC5iOC4h+C4l+C4teC5iOC4i+C4t+C5ieC4rScsIHBoOidTaG9wZWUgLyDguYTguJfguKfguLHguKrguJTguLggLyDguKPg',
  'uYnguLLguJnigKYnIH0sCiAgICAgIHsga2V5OidwYXllcicsICAgbGFiZWw6J+C4nOC4ueC5ieC4iuC4s+C4o+C4sCcgfSwKICAgICAgeyBrZXk6J3dhcnJhbnR5TW9udGhzJywgbGFiZWw6J+C4o+C4sOC4ouC4sOC5gOC4p+C4peC4suC4o+C4seC4muC4m+C4o+C4',
  'sOC4geC4seC4mSAo4LmA4LiU4Li34Lit4LiZKScsIHR5cGU6J251bWJlcicsCiAgICAgICAgaGludDon4Lij4Liw4Lia4Lia4LiI4Liw4LiE4Liz4LiZ4Lin4LiT4Lin4Lix4LiZ4Lir4Lih4LiU4Lib4Lij4Liw4LiB4Lix4LiZ4LmD4Lir4LmJ4Lit4Lix4LiV4LmC',
  '4LiZ4Lih4Lix4LiV4Li0JyB9LAogICAgICB7IGtleToncm9vbScsICAgIGxhYmVsOifguKvguYnguK3guIcv4Lie4Li34LmJ4LiZ4LiX4Li14LmI4LiX4Li14LmI4LmD4LiK4LmJJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpbJ+C4quC5iOC4p+C4meC4geC4peC4',
  'suC4hyddLmNvbmNhdChyb29tT3B0aW9ucygpKSB9LAogICAgICB7IGtleToncGhvdG9zJywgIGxhYmVsOifguKDguLLguJ7guJvguKPguLDguIHguK3guJrguKrguLTguJnguITguYnguLInLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTon',
  'c2xpcHMnLCAgIGxhYmVsOifguKrguKXguLTguJvguIHguLLguKPguYLguK3guJnguIrguLPguKPguLAnLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonbm90ZScsICAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBl',
  'Oid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbFB1cmNoYXNlKGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNh',
  'bGxBcGkoJ3B1cmNoYXNlLmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1l',
  'c3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMCiAgID09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtQWMocmVjKXsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguKPguLLguKLguIHguLLg',
  'uKPguKXguYnguLLguIfguYHguK3guKPguYwnIDogJ+C4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C4peC5ieC4suC4h+C5geC4reC4o+C5jCcsCiAgICByZWNvcmQ6IHJlYyB8fCB7IGJvb2tEYXRlOiB0b2RheSgpIH0sCiAgICBhY3Rpb246ICdhYy5zYXZlJywg',
  'YnVja2V0OiAnYWMnLAogICAgb2NyOiB7IGRhdGU6J3NlcnZpY2VEYXRlJywgYW1vdW50Oidjb3N0JywgdmVuZG9yOid0ZWNobmljaWFuJyB9LAogICAgb25EZWxldGU6IGRlbEFjLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oidyb29tJywgICAgICAgIGxhYmVs',
  'OifguKvguYnguK3guIcnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOnJvb21PcHRpb25zKCksIHJlcXVpcmVkOnRydWUsIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5Oidyb3VuZCcsICAgICAgIGxhYmVsOifguKPguK3guJrguJfguLXguYgnLCB0eXBlOidudW1i',
  'ZXInLCBoaW50OifguYDguKfguYnguJnguKfguYjguLLguIfguYPguKvguYnguKPguLDguJrguJrguJnguLHguJrguJXguYjguK3guIjguLLguIHguKPguK3guJrguKXguYjguLLguKrguLjguJTguILguK3guIfguJvguLXguJnguLHguYnguJknIH0sCiAgICAgIHsg',
  'a2V5Oidib29rRGF0ZScsICAgIGxhYmVsOifguKfguLHguJnguJfguLXguYjguJnguLHguJTguKXguYnguLLguIfguYHguK3guKPguYwnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonc2VydmljZURhdGUnLCBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiU',
  '4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4Lij4LiI4Lij4Li04LiHJywgdHlwZTonZGF0ZScsIGhpbnQ6J+C4geC4o+C4reC4geC5gOC4oeC4t+C5iOC4reC4peC5ieC4suC4h+C5gOC4quC4o+C5h+C4iOC5geC4peC5ieC4pycgfSwKICAgICAgeyBrZXk6J3N0YXR1cycs',
  'ICAgICAgbGFiZWw6J+C4quC4luC4suC4meC4sCcsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdhY1N0YXR1c2VzJykgfSwKICAgICAgeyBrZXk6J3RlY2huaWNpYW4nLCAgbGFiZWw6J+C4iuC5iOC4suC4hyAvIOC4nOC4ueC5ieC5g+C4q+C5ieC4muC4o+C4',
  'tOC4geC4suC4oycgfSwKICAgICAgeyBrZXk6J2Nvc3QnLCAgICAgICAgbGFiZWw6J+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oiAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JyB9LAogICAgICB7IGtleToncGhvdG9zJywgICAgICBsYWJlbDon4Lig4Liy',
  '4Lie4Lib4Lij4Liw4LiB4Lit4LiaJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICAgICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0KICB9',
  'KTsKfQoKZnVuY3Rpb24gZGVsQWMoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4o+C4suC4ouC4geC4suC4o+C4peC5ieC4suC4h+C5geC4reC4o+C5jOC4meC4teC5iT8nLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgnYWMuZGVsZXRlJywgeyBpZDogaWQg',
  'fSkudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgovKiog',
  '4LiZ4Lix4LiU4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4Lir4Lil4Liy4Lii4Lir4LmJ4Lit4LiH4Lie4Lij4LmJ4Lit4Lih4LiB4Lix4LiZICovCmZ1bmN0aW9uIGZvcm1CdWxrQWMoKXsKICB2YXIgcm9vbXMgPSByb29tT3B0aW9ucygpOwogIHZhciBib2R5ID0K',
  'ICAgICc8ZGl2IGNsYXNzPSJmZ3JpZCI+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIj48bGFiZWw+4Lin4Lix4LiZ4LiX4Li14LmI4LiZ4Lix4LiUIDxzcGFuIHN0eWxlPSJjb2xvcjp2YXIoLS1kYW5nZXIpIj4qPC9zcGFuPjwvbGFiZWw+JyArCiAgICAgICAgJzxp',
  'bnB1dCB0eXBlPSJkYXRlIiBjbGFzcz0iaW5wIiBpZD0iYmtfZGF0ZSIgdmFsdWU9IicgKyB0b2RheSgpICsgJyI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIj48bGFiZWw+4LiK4LmI4Liy4LiHIC8g4Lic4Li54LmJ4LmD4Lir4LmJ4Lia4Lij4Li04LiB',
  '4Liy4LijPC9sYWJlbD48aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImJrX3RlY2giPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiI+PGxhYmVsPuC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC4leC5iOC4reC4q+C5ieC4reC4hyAo4Lia4Liy4LiXKTwv',
  'bGFiZWw+PGlucHV0IHR5cGU9Im51bWJlciIgY2xhc3M9ImlucCIgaWQ9ImJrX2Nvc3QiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiI+PGxhYmVsPuC4q+C4oeC4suC4ouC5gOC4q+C4leC4uDwvbGFiZWw+PGlucHV0IGNsYXNzPSJpbnAiIGlkPSJia19u',
  'b3RlIj48L2Rpdj4nICsKICAgICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0icm93IG1iOCI+PGIgY2xhc3M9ImZzMTMiPuC5gOC4peC4t+C4reC4geC4q+C5ieC4reC4hzwvYj48c3BhbiBjbGFzcz0ic3Ai',
  'Pjwvc3Bhbj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iYnVsa1BpY2soXCdhbGxcJykiPuC4l+C4seC5ieC4h+C4q+C4oeC4lDwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJidWxrUGlj',
  'ayhcJ25vbmVcJykiPuC4peC5ieC4suC4hzwvYnV0dG9uPicgKwogICAgICBbMSwyLDMsNCw1XS5tYXAoZnVuY3Rpb24oZil7IHJldHVybiAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJidWxrUGljaygnICsgZiArICcpIj7guIrguLHguYnguJkgJyAr',
  'IGYgKyAnPC9idXR0b24+JzsgfSkuam9pbignJykgKwogICAgJzwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InJvb21zIiBpZD0iYmtSb29tcyI+JyArIHJvb21zLm1hcChmdW5jdGlvbihyKXsKICAgICAgcmV0dXJuICc8bGFiZWwgY2xhc3M9InJvb20iIHN0eWxl',
  'PSJjdXJzb3I6cG9pbnRlciI+PGlucHV0IHR5cGU9ImNoZWNrYm94IiBjbGFzcz0iYmsiIHZhbHVlPSInICsgciArICciPiA8Yj4nICsgciArICc8L2I+PC9sYWJlbD4nOwogICAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKCiAgb3Blbk1vZGFsKCfwn5OFIOC4meC4',
  'seC4lOC4peC5ieC4suC4h+C5geC4reC4o+C5jOC4q+C4peC4suC4ouC4q+C5ieC4reC4h+C4nuC4o+C5ieC4reC4oeC4geC4seC4mScsIGJvZHksCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4',
  'gTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIGlkPSJia1NhdmUiPuC4quC4o+C5ieC4suC4h+C4meC4seC4lOC4q+C4oeC4suC4ojwvYnV0dG9uPicsIHRydWUpOwoKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmtTYXZlJykub25j',
  'bGljayA9IGZ1bmN0aW9uKCl7CiAgICB2YXIgcGlja2VkID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmJrOmNoZWNrZWQnKSkubWFwKGZ1bmN0aW9uKGMpeyByZXR1cm4gYy52YWx1ZTsgfSk7CiAgICB2YXIg',
  'ZGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdia19kYXRlJykudmFsdWU7CiAgICBpZiAoIXBpY2tlZC5sZW5ndGgpIHJldHVybiB0b2FzdCgn4LmA4Lil4Li34Lit4LiB4Lit4Lii4LmI4Liy4LiH4LiZ4LmJ4Lit4LiiIDEg4Lir4LmJ4Lit4LiHJywgJ2Vy',
  'cicpOwogICAgaWYgKCFkYXRlKSByZXR1cm4gdG9hc3QoJ+C4geC4o+C4uOC4k+C4suC4o+C4sOC4muC4uOC4p+C4seC4meC4l+C4teC5iOC4meC4seC4lCcsICdlcnInKTsKICAgIHZhciBidG4gPSB0aGlzOyBidG4uZGlzYWJsZWQgPSB0cnVlOyBidG4uaW5uZXJI',
  'VE1MID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C4muC4seC4meC4l+C4tuC4geKApic7CiAgICBjYWxsQXBpKCdhYy5idWxrQm9vaycsIHsKICAgICAgcm9vbXM6IHBpY2tlZCwgYm9va0RhdGU6IGRhdGUsCiAgICAgIHRlY2hu',
  'aWNpYW46IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdia190ZWNoJykudmFsdWUsCiAgICAgIGNvc3Q6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdia19jb3N0JykudmFsdWUsCiAgICAgIG5vdGU6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdia19ub3RlJyku',
  'dmFsdWUKICAgIH0pLnRoZW4oZnVuY3Rpb24obil7CiAgICAgIGNsb3NlTW9kYWwoKTsgdG9hc3QoJ+C4quC4o+C5ieC4suC4h+C4meC4seC4lOC4q+C4oeC4suC4oiAnICsgbiArICcg4Lir4LmJ4Lit4LiH4LmB4Lil4LmJ4LinJywgJ29rJyk7IGxvYWQoeyBxdWll',
  'dDogdHJ1ZSB9KTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTsgYnRuLnRleHRDb250ZW50ID0gJ+C4quC4o+C5ieC4suC4h+C4meC4seC4lOC4q+C4oeC4suC4oic7IHRvYXN0KGUubWVzc2FnZXx8ZSwgJ2Vycicp',
  'OwogICAgfSk7CiAgfTsKfQoKZnVuY3Rpb24gYnVsa1BpY2sod2hhdCl7CiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmJrJykuZm9yRWFjaChmdW5jdGlvbihjKXsKICAgIGlmICh3aGF0ID09PSAnYWxsJykgYy5jaGVja2VkID0gdHJ1ZTsKICAgIGVsc2Ug',
  'aWYgKHdoYXQgPT09ICdub25lJykgYy5jaGVja2VkID0gZmFsc2U7CiAgICBlbHNlIGMuY2hlY2tlZCA9IFN0cmluZyhjLnZhbHVlKS5jaGFyQXQoMCkgPT09IFN0cmluZyh3aGF0KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Liy4Lih4Lir4LmJ4Lit4LiHCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PSAqLwpmdW5jdGlvbiBmb3JtUmVwYWlyKHJlYyl7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4LiH4Liy4LiZ4LiL4LmI4Lit4LihJyA6ICfguYHguIjguYnguIfguIvguYjguK3guKEgLyDguJrguLHg',
  'uJnguJfguLbguIHguIfguLLguJnguIvguYjguK3guKEnLAogICAgcmVjb3JkOiByZWMgfHwgeyByZXBvcnREYXRlOiB0b2RheSgpLCBwcmlvcml0eTogJ+C4m+C4geC4leC4tCcgfSwKICAgIGFjdGlvbjogJ3JlcGFpci5zYXZlJywgYnVja2V0OiAncm9vbVJlcGFp',
  'cicsIHdpZGU6IHRydWUsCiAgICBvY3I6IHsgZGF0ZToncmVwYWlyRGF0ZScsIGFtb3VudDonY29zdCcsIHZlbmRvcjondGVjaG5pY2lhbicsIHRpdGxlOidpdGVtcycgfSwKICAgIG9uRGVsZXRlOiBkZWxSZXBhaXIsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6',
  'J3Jvb20nLCAgICAgICBsYWJlbDon4Lir4LmJ4Lit4LiHJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpyb29tT3B0aW9ucygpLCByZXF1aXJlZDp0cnVlLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleTonY2F0ZWdvcnknLCAgIGxhYmVsOifguJvguKPguLDguYDg',
  'uKDguJfguIfguLLguJnguKvguKXguLHguIHguILguK3guIfguYPguJrguJnguLXguYknLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncmVwYWlyQ2F0ZWdvcmllcycpLAogICAgICAgIGhpbnQ6J+C5gOC4p+C5ieC4meC4p+C5iOC4suC4h+C5hOC4lOC5iSDi',
  'gJQg4Lij4Liw4Lia4Lia4LmD4LiK4LmJ4Lib4Lij4Liw4LmA4Lig4LiX4LiX4Li14LmI4Lie4Lia4Lia4LmI4Lit4Lii4LiX4Li14LmI4Liq4Li44LiU4LmD4LiZ4LmA4LiK4LmH4LiE4Lil4Li04Liq4LiV4LmM4LmD4Lir4LmJ4LmA4Lit4LiHJyB9LAogICAgICB7',
  'IGtleTonaXRlbXMnLCAgICAgIGxhYmVsOifguKPguLLguKLguIHguLLguKPguJfguLXguYjguJXguYnguK3guIfguIvguYjguK3guKEgKOC4leC4tOC5iuC4geC5gOC4oeC4t+C5iOC4reC4l+C4s+C5gOC4quC4o+C5h+C4iCknLCB0eXBlOid0b2RvJywgcmVxdWly',
  'ZWQ6dHJ1ZSwgZnVsbDp0cnVlLAogICAgICAgIG9wdGlvbnM6IG9wdCgncmVwYWlyQ2F0ZWdvcmllcycpLAogICAgICAgIGhpbnQ6J+C5gOC4guC5ieC4suC4i+C5iOC4reC4oeC4hOC4o+C4seC5ieC4h+C5gOC4lOC4teC4ouC4p+C4oeC4seC4geC4i+C5iOC4reC4',
  'oeC4q+C4peC4suC4ouC4iOC4uOC4lCDguYPguKrguYjguYHguKLguIHguJfguLXguKXguLDguIfguLLguJnguYHguKXguLDguYDguKXguLfguK3guIHguJvguKPguLDguYDguKDguJfguILguK3guIfguYHguJXguYjguKXguLDguIfguLLguJnguYTguJTguYkgwrcg',
  'JyArCiAgICAgICAgICAgICAn4LiV4Li04LmK4LiB4LiE4Lij4Lia4LiX4Li44LiB4LiH4Liy4LiZ4LmB4Lil4LmJ4Lin4Lij4Liw4Lia4Lia4LiI4Liw4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Liq4LiW4Liy4LiZ4Liw4LmA4Lib4LmH4LiZIOKAnOC5gOC4quC4o+C5',
  'h+C4iOC4quC4tOC5ieC4meKAnSDguYPguKvguYnguYDguK3guIcnIH0sCiAgICAgIHsga2V5OidyZXBvcnREYXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC5geC4iOC5ieC4hycsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5Oidib29rRGF0ZScsICAg',
  'bGFiZWw6J+C4p+C4seC4meC4meC4seC4lOC4i+C5iOC4reC4oeC5geC4i+C4oScsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidyZXBhaXJEYXRlJywgbGFiZWw6J+C4p+C4seC4meC5gOC4guC5ieC4suC4i+C5iOC4reC4oeC5geC4i+C4oScsIHR5cGU6J2Rh',
  'dGUnLCBoaW50OifguIHguKPguK3guIHguYDguKHguLfguYjguK3guIvguYjguK3guKHguYDguKrguKPguYfguIjguYHguKXguYnguKcnIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCAgICAgbGFiZWw6J+C4quC4luC4suC4meC4sCcsIHR5cGU6J3NlbGVjdCcsIG9w',
  'dGlvbnM6b3B0KCdyZXBhaXJTdGF0dXNlcycpIH0sCiAgICAgIHsga2V5Oidwcmlvcml0eScsICAgbGFiZWw6J+C4hOC4p+C4suC4oeC5gOC4o+C5iOC4h+C4lOC5iOC4p+C4mScsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdwcmlvcml0aWVzJyksIGJsYW5r',
  'OmZhbHNlIH0sCiAgICAgIHsga2V5Oid0ZWNobmljaWFuJywgbGFiZWw6J+C4iuC5iOC4suC4h+C4nOC4ueC5ieC4i+C5iOC4reC4oScgfSwKICAgICAgeyBrZXk6J2Nvc3QnLCAgICAgICBsYWJlbDon4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiICjguJrg',
  'uLLguJcpJywgdHlwZTonbW9uZXknIH0sCiAgICAgIHsga2V5OidwaG90b3NCZWZvcmUnLCBsYWJlbDon4Lig4Liy4Lie4LiB4LmI4Lit4LiZ4LiL4LmI4Lit4LihJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J3Bob3Rvc0FmdGVyJywg',
  'IGxhYmVsOifguKDguLLguJ7guKvguKXguLHguIfguIvguYjguK3guKEnLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonbm90ZScsICAgICAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1',
  'bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbFJlcGFpcihpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdyZXBhaXIuZGVsZXRlJywgeyBp',
  'ZDogaWQgfSkudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9',
  'CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguIvguYjguK3guKHguYHguIvguKHguJXguLbguIHguYLguJTguKLguKPguKfguKEKICAgPT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1CdWlsZGluZyhyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4h+C4suC4meC4i+C5',
  'iOC4reC4oeC4leC4tuC4gScgOiAn4LmA4Lie4Li04LmI4Lih4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmC4LiU4Lii4Lij4Lin4LihJywKICAgIHJlY29yZDogcmVjIHx8IHsgYm9va0RhdGU6IHRvZGF5KCkgfSwKICAgIGFjdGlvbjog',
  'J2J1aWxkaW5nLnNhdmUnLCBidWNrZXQ6ICdidWlsZGluZycsIHdpZGU6IHRydWUsCiAgICBvY3I6IHsgZGF0ZTonZW5kRGF0ZScsIGFtb3VudDonY29zdCcsIHZlbmRvcjonY29udHJhY3RvcicsIHRpdGxlOid0aXRsZScgfSwKICAgIG9uRGVsZXRlOiBkZWxCdWls',
  'ZGluZywKICAgIGZpZWxkczogWwogICAgICB7IGtleTonem9uZScsICAgICAgbGFiZWw6J+C4quC5iOC4p+C4meC4guC4reC4h+C4reC4suC4hOC4suC4oycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdidWlsZGluZ1pvbmVzJyksIHJlcXVpcmVkOnRydWUg',
  'fSwKICAgICAgeyBrZXk6J3RpdGxlJywgICAgIGxhYmVsOifguKPguLLguKLguIHguLLguKPguIvguYjguK3guKHguYHguIvguKEnLCB0eXBlOid0ZXh0YXJlYScsIHJlcXVpcmVkOnRydWUsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonYm9va0RhdGUnLCAgbGFi',
  'ZWw6J+C4p+C4seC4meC4l+C4teC5iOC4meC4seC4lCcsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidzdGFydERhdGUnLCBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LmA4Lij4Li04LmI4Lih4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4LijJywgdHlwZTon',
  'ZGF0ZScgfSwKICAgICAgeyBrZXk6J2VuZERhdGUnLCAgIGxhYmVsOifguKfguLHguJnguJfguLXguYjguYHguKXguYnguKfguYDguKrguKPguYfguIgnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonc3RhdHVzJywgICAgbGFiZWw6J+C4quC4luC4suC4meC4',
  'sCcsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdidWlsZGluZ1N0YXR1c2VzJykgfSwKICAgICAgeyBrZXk6J2NvbnRyYWN0b3InLCBsYWJlbDon4Lic4Li54LmJ4Lij4Lix4Lia4LmA4Lir4Lih4LiyIC8g4Lij4LmJ4Liy4LiZJyB9LAogICAgICB7IGtleTon',
  'Y29zdCcsICAgICAgbGFiZWw6J+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oiAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JyB9LAogICAgICB7IGtleTonbmV4dER1ZScsICAgbGFiZWw6J+C4hOC4o+C4muC4geC4s+C4q+C4meC4lOC4o+C4reC4muC4luC4',
  'seC4lOC5hOC4mycsIHR5cGU6J2RhdGUnLCBoaW50OifguYDguIrguYjguJkg4LiB4Lix4LiZ4LiL4Li24Lih4LiU4Liy4LiU4Lif4LmJ4Liy4LiX4Li44LiBIDMg4Lib4Li1IOKAlCDguYPguKrguYjguKfguLHguJnguJfguLXguYjguITguKPguLHguYnguIfguJbg',
  'uLHguJTguYTguJsnIH0sCiAgICAgIHsga2V5OidwaG90b3MnLCAgICBsYWJlbDon4Lig4Liy4Lie4Lib4Lij4Liw4LiB4Lit4LiaJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J3NsaXBzJywgICAgIGxhYmVsOifguYPguJrguYDguKrg',
  'uKPguYfguIggLyDguKrguKXguLTguJsnLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonbm90ZScsICAgICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0KICB9',
  'KTsKfQoKZnVuY3Rpb24gZGVsQnVpbGRpbmcoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4h+C4suC4meC4i+C5iOC4reC4oeC4leC4tuC4geC4meC4teC5iT8nLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgnYnVpbGRpbmcuZGVsZXRlJywgeyBpZDogaWQg',
  'fSkudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgovKiA9',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguILguYnguK3guKHguLnguKXguKvguYnguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1Sb29tKHJlYyl7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6ICfguILguYnguK3guKHguLnguKXguKvguYnguK3guIcgJyArIChyZWMgPyByZWMucm9vbSA6ICcnKSwKICAgIHJlY29yZDogcmVj',
  'LCBhY3Rpb246ICdyb29tLnNhdmUnLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oidyb29tJywgICBsYWJlbDon4Lir4LmJ4Lit4LiHJywgcmVxdWlyZWQ6dHJ1ZSB9LAogICAgICB7IGtleTonZmxvb3InLCAgbGFiZWw6J+C4iuC4seC5ieC4mScsIHR5cGU6J251',
  'bWJlcicgfSwKICAgICAgeyBrZXk6J3N0YXR1cycsIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncm9vbVN0YXR1c2VzJyksIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5Oid0ZW5hbnQnLCBsYWJlbDon4LiK4Li3',
  '4LmI4Lit4Lic4Li54LmJ4LmA4LiK4LmI4LiyJyB9LAogICAgICB7IGtleToncGhvbmUnLCAgbGFiZWw6J+C5gOC4muC4reC4o+C5jOC4leC4tOC4lOC4leC5iOC4rScgfSwKICAgICAgeyBrZXk6J3JlbnQnLCAgIGxhYmVsOifguITguYjguLLguYDguIrguYjguLIv',
  '4LmA4LiU4Li34Lit4LiZICjguJrguLLguJcpJywgdHlwZTonbW9uZXknIH0sCiAgICAgIHsga2V5Oidtb3ZlSW4nLCBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LmA4LiC4LmJ4Liy4Lit4Lii4Li54LmIJywgdHlwZTonZGF0ZScgfSwKICAgICAgeyBrZXk6J25v',
  'dGUnLCAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQog',
  'ICDguJ/guK3guKPguYzguKE6IOC4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4meC4m+C4o+C4sOC4iOC4s+C4q+C5ieC4reC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24g',
  'Zm9ybUFzc2V0KHJlYyl7CiAgdmFyIHJvb20gPSAocmVjICYmIHJlYy5yb29tKSB8fCAnJzsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguJfguKPguLHguJ7guKLguYzguKrguLTguJknIDogJ+C5gOC4nuC4',
  'tOC5iOC4oeC4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4meC5g+C4meC4q+C5ieC4reC4hyAnICsgcm9vbSwKICAgIHJlY29yZDogcmVjIHx8IHsgcm9vbTogcm9vbSwgc3RhdHVzOiAn4LmD4LiK4LmJ4LiH4Liy4LiZ4Lib4LiB4LiV4Li0JyB9LAogICAgYWN0aW9u',
  'OiAnYXNzZXQuc2F2ZScsCiAgICBvbkRlbGV0ZTogcmVjICYmIHJlYy5pZCA/IGRlbEFzc2V0IDogbnVsbCwKICAgIGZpZWxkczogWwogICAgICB7IGtleToncm9vbScsICAgbGFiZWw6J+C4q+C5ieC4reC4hycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6cm9vbU9w',
  'dGlvbnMoKSwgcmVxdWlyZWQ6dHJ1ZSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J25hbWUnLCAgIGxhYmVsOifguJfguKPguLHguJ7guKLguYzguKrguLTguJknLCByZXF1aXJlZDp0cnVlLCBwaDon4LmA4LiK4LmI4LiZIOC5geC4reC4o+C5jCDCtyDguYDg',
  'uITguKPguLfguYjguK3guIfguJfguLPguJnguYnguLPguK3guLjguYjguJkgwrcg4LiV4Li54LmJ4LmA4Lii4LmH4LiZJyB9LAogICAgICB7IGtleTonYnJhbmQnLCAgbGFiZWw6J+C4ouC4teC5iOC4q+C5ieC4rS/guKPguLjguYjguJknIH0sCiAgICAgIHsga2V5',
  'OidzZXJpYWwnLCBsYWJlbDonU2VyaWFsIE5vLicgfSwKICAgICAgeyBrZXk6J2luc3RhbGxEYXRlJywgIGxhYmVsOifguKfguLHguJnguJfguLXguYjguJXguLTguJTguJXguLHguYnguIcnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTond2FycmFudHlFbmQn',
  'LCAgbGFiZWw6J+C4m+C4o+C4sOC4geC4seC4meC4q+C4oeC4lOC4reC4suC4ouC4uCcsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ2Fzc2V0U3Rh',
  'dHVzZXMnKSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J3B1cmNoYXNlSWQnLCBsYWJlbDon4Lit4LmJ4Liy4LiH4Lit4Li04LiH4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4LitJywgcGg6J+C4o+C4q+C4seC4quC4o+C4suC4ouC4geC4suC4o+C4i+C4',
  't+C5ieC4reC4guC4reC4hyAo4LiW4LmJ4Liy4Lih4Li1KScgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdLAogICAgLy8g4Lif4Lit4Lij4LmM',
  '4Lih4LiZ4Li14LmJ4LmA4Lib4Li04LiU4LiI4Liy4LiB4Lir4LiZ4LmJ4Liy4LiV4LmI4Liy4LiH4Lij4Liy4Lii4Lil4Liw4LmA4Lit4Li14Lii4LiU4Lir4LmJ4Lit4LiHIOKAlCDguJrguLHguJnguJfguLbguIHguYDguKrguKPguYfguIjguYDguJvguLTguJTg',
  'uIHguKXguLHguJrguYTguJvguKvguJnguYnguLLguYDguJTguLTguKEKICAgIGFmdGVyOiBmdW5jdGlvbigpeyBpZiAocm9vbSAmJiB0eXBlb2Ygb3BlblJvb20gPT09ICdmdW5jdGlvbicpIG9wZW5Sb29tKHJvb20pOyB9CiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbEFz',
  'c2V0KGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguJfguKPguLHguJ7guKLguYzguKrguLTguJnguIrguLTguYnguJnguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2Fzc2V0LmRlbGV0ZScsIHsgaWQ6IGlkIH0pCiAgICAgIC50aGVuKGZ1',
  'bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3guKPguYzguKE6IOC4o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKLguKvguK0KICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1GaW5hbmNlKHJlYyl7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4Lij4Liy4Lii4LiB4Liy4LijJyA6ICfguJrguLHguJng',
  'uJfguLbguIHguKPguLLguKLguKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4LiiJywKICAgIHJlY29yZDogcmVjIHx8IHsgZGF0ZTogdG9kYXkoKSwgY2hhbm5lbDogJ+C5guC4reC4mSBRUicgfSwKICAgIGFjdGlvbjogJ2ZpbmFuY2Uuc2F2ZScsIGJ1Y2tldDog',
  'J21pc2MnLAogICAgb25EZWxldGU6IGRlbEZpbmFuY2UsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J2tpbmQnLCAgIGxhYmVsOifguKPguLLguKLguIHguLLguKMnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnZmluYW5jZUtpbmRzJyksIHJlcXVpcmVk',
  'OnRydWUsIGJsYW5rOmZhbHNlLAogICAgICAgIGhpbnQ6J+C5gOC4peC4t+C4reC4gSAi4Lij4Liy4Lii4Lij4Lix4Lia4LiE4LmI4Liy4LmA4LiK4LmI4LiyIiDguKvguKPguLfguK0gIuC4o+C4suC4ouC4o+C4seC4muC4reC4t+C5iOC4mSDguYYiIOC4o+C4sOC4',
  'muC4muC4iOC4sOC4meC4seC4muC5gOC4m+C5h+C4meC4neC4seC5iOC4h+C4o+C4suC4ouC4o+C4seC4muC5g+C4q+C5ieC4reC4seC4leC5guC4meC4oeC4seC4leC4tCcgfSwKICAgICAgeyBrZXk6J2RhdGUnLCAgIGxhYmVsOifguKfguLHguJnguJfguLXguYgn',
  'LCB0eXBlOidkYXRlJywgcmVxdWlyZWQ6dHJ1ZSB9LAogICAgICB7IGtleTonYW1vdW50JywgbGFiZWw6J+C4iOC4s+C4meC4p+C4meC5gOC4h+C4tOC4mSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JywgcmVxdWlyZWQ6dHJ1ZSB9LAogICAgICB7IGtleTonYmls',
  'bE1vbnRoJywgbGFiZWw6J+C4o+C4reC4muC4muC4tOC4peC4guC4reC4h+C5gOC4lOC4t+C4reC4mScsIHBoOifguYDguIrguYjguJkg4LiBLuC4hC4gMjU2OScgfSwKICAgICAgeyBrZXk6J2NoYW5uZWwnLCBsYWJlbDon4LiK4LmI4Lit4LiH4LiX4Liy4LiHJywg',
  'dHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ2ZpbmFuY2VDaGFubmVscycpIH0sCiAgICAgIHsga2V5OidzbGlwcycsICBsYWJlbDon4Liq4Lil4Li04LibIC8g4LmD4Lia4LmA4Liq4Lij4LmH4LiIJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAg',
  'eyBrZXk6J25vdGUnLCAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbEZpbmFuY2UoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4o+C4suC4',
  'ouC4geC4suC4o+C4meC4teC5iT8nLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgnZmluYW5jZS5kZWxldGUnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7',
  'IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguKrguLPguKPguK3g',
  'uIcgLyDguIHguLnguYnguITguLfguJnguILguYnguK3guKHguLnguKUKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGRvRXhwb3J0SnNvbigpewogIHRvYXN0KCfguIHguLPg',
  'uKXguLHguIfguYDguJXguKPguLXguKLguKHguYTguJ/guKXguYzguKrguLPguKPguK3guIfigKYnKTsKICBjYWxsQXBpKCdiYWNrdXAuZXhwb3J0Jywge30pLnRoZW4oZnVuY3Rpb24oZHVtcCl7CiAgICBzYXZlVGV4dEZpbGUoJ3RoZS1tLWNvcm5lci1hcC1iYWNr',
  'dXAtJyArIHRvZGF5KCkgKyAnLmpzb24nLAogICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KGR1bXAsIG51bGwsIDEpLCAnYXBwbGljYXRpb24vanNvbicpOwogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsICdlcnInKTsgfSk7',
  'Cn0KCmZ1bmN0aW9uIGRvRXhwb3J0Q3N2KHNoZWV0KXsKICBjYWxsQXBpKCdiYWNrdXAuY3N2JywgeyBzaGVldDogc2hlZXQgfSkudGhlbihmdW5jdGlvbihyKXsKICAgIHNhdmVUZXh0RmlsZShyLmZpbGVuYW1lLCByLmNvbnRlbnQsICd0ZXh0L2NzdicpOwogIH0p',
  'LmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsICdlcnInKTsgfSk7Cn0KCi8qKiDguJTguLLguKfguJnguYzguYLguKvguKXguJTguYTguJ/guKXguYwg4oCUIOC5g+C4iuC5iSBkb3dubG9hZHMgY2FwYWJpbGl0eSDguJbguYnguLLguKHguLUg',
  '4LmE4Lih4LmI4LiH4Lix4LmJ4LiZ4LmD4LiK4LmJ4Lil4Li04LiH4LiB4LmM4Lib4LiB4LiV4Li0ICovCmZ1bmN0aW9uIHNhdmVUZXh0RmlsZShmaWxlbmFtZSwgY29udGVudCwgbWltZSl7CiAgaWYgKHR5cGVvZiB3aW5kb3cuc2F2ZVZpYUhvc3QgPT09ICdmdW5j',
  'dGlvbicpIHJldHVybiB3aW5kb3cuc2F2ZVZpYUhvc3QoZmlsZW5hbWUsIGNvbnRlbnQsIG1pbWUpOwogIHZhciBibG9iID0gbmV3IEJsb2IoW2NvbnRlbnRdLCB7IHR5cGU6IG1pbWUgKyAnO2NoYXJzZXQ9dXRmLTgnIH0pOwogIHZhciBhID0gZG9jdW1lbnQuY3Jl',
  'YXRlRWxlbWVudCgnYScpOwogIGEuaHJlZiA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7CiAgYS5kb3dubG9hZCA9IGZpbGVuYW1lOwogIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYSk7IGEuY2xpY2soKTsKICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IFVS',
  'TC5yZXZva2VPYmplY3RVUkwoYS5ocmVmKTsgYS5yZW1vdmUoKTsgfSwgMTAwMCk7CiAgdG9hc3QoJ+C4lOC4suC4p+C4meC5jOC5guC4q+C4peC4lCAnICsgZmlsZW5hbWUgKyAnIOC5geC4peC5ieC4pycsICdvaycpOwp9CgpmdW5jdGlvbiBkb0ltcG9ydEpzb24o',
  'KXsKICBvcGVuTW9kYWwoJ+Kshu+4jyDguIHguLnguYnguITguLfguJnguIjguLLguIHguYTguJ/guKXguYzguKrguLPguKPguK3guIcnLAogICAgJzxwIGNsYXNzPSJmczEzIj7guYDguKXguLfguK3guIHguYTguJ/guKXguYwgPGI+Lmpzb248L2I+IOC4l+C4teC5',
  'iOC5gOC4hOC4ouC4lOC4suC4p+C4meC5jOC5guC4q+C4peC4lOC5hOC4p+C5iTwvcD4nICsKICAgICc8bGFiZWwgY2xhc3M9ImZpbGUtZHJvcCIgZm9yPSJpbXBGaWxlIj7wn5OEIOC5gOC4peC4t+C4reC4geC5hOC4n+C4peC5jOC4quC4s+C4o+C4reC4hycgKwog',
  'ICAgICAnPGlucHV0IHR5cGU9ImZpbGUiIGlkPSJpbXBGaWxlIiBhY2NlcHQ9ImFwcGxpY2F0aW9uL2pzb24sLmpzb24iIHN0eWxlPSJkaXNwbGF5Om5vbmUiICcgKwogICAgICAnb25jaGFuZ2U9ImRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwnaW1wTmFtZVwnKS50',
  'ZXh0Q29udGVudD10aGlzLmZpbGVzWzBdP3RoaXMuZmlsZXNbMF0ubmFtZTpcJ1wnIj48L2xhYmVsPicgKwogICAgJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbXQ4IiBpZD0iaW1wTmFtZSI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PicgKwog',
  'ICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7guKfguLTguJjguLXguIHguLnguYnguITguLfguJk8L2xhYmVsPicgKwogICAgJzxzZWxlY3QgY2xhc3M9InNlbCIgaWQ9ImltcE1vZGUiPicgKwogICAgICAnPG9wdGlvbiB2YWx1ZT0ibWVyZ2UiPuC5gOC4nuC4tOC5',
  'iOC4oeC5gOC4ieC4nuC4suC4sOC4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4ouC4seC4h+C5hOC4oeC5iOC4oeC4tSAo4LmB4LiZ4Liw4LiZ4LizKTwvb3B0aW9uPicgKwogICAgICAnPG9wdGlvbiB2YWx1ZT0icmVwbGFjZSI+4Lil4LmJ4Liy4LiH4LiC4LmJ',
  '4Lit4Lih4Li54Lil4LmA4LiU4Li04Lih4LmB4Lil4LmJ4Lin4LmB4LiX4LiZ4LiX4Li14LmI4LiX4Lix4LmJ4LiH4Lir4Lih4LiUPC9vcHRpb24+JyArCiAgICAnPC9zZWxlY3Q+PC9kaXY+JywKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3Nl',
  'TW9kYWwoKSI+4Lii4LiB4LmA4Lil4Li04LiBPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgaWQ9ImltcEdvIj7guIHguLnguYnguITguLfguJnguILguYnguK3guKHguLnguKU8L2J1dHRvbj4nKTsKCiAgZG9jdW1lbnQuZ2V0RWxlbWVu',
  'dEJ5SWQoJ2ltcEdvJykub25jbGljayA9IGZ1bmN0aW9uKCl7CiAgICB2YXIgZiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbXBGaWxlJykuZmlsZXNbMF07CiAgICBpZiAoIWYpIHJldHVybiB0b2FzdCgn4LiB4Lij4Li44LiT4Liy4LmA4Lil4Li34Lit4LiB',
  '4LmE4Lif4Lil4LmM4LiB4LmI4Lit4LiZJywgJ2VycicpOwogICAgdmFyIG1vZGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW1wTW9kZScpLnZhbHVlOwogICAgdmFyIGJ0biA9IHRoaXM7IGJ0bi5kaXNhYmxlZCA9IHRydWU7IGJ0bi5pbm5lckhUTUwgPSAn',
  'PHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4LiB4Li54LmJ4LiE4Li34LiZ4oCmJzsKICAgIHZhciByID0gbmV3IEZpbGVSZWFkZXIoKTsKICAgIHIub25sb2FkID0gZnVuY3Rpb24oKXsKICAgICAgdmFyIHBhcnNlZDsKICAgICAgdHJ5',
  'IHsgcGFyc2VkID0gSlNPTi5wYXJzZShyLnJlc3VsdCk7IH0KICAgICAgY2F0Y2ggKGUpIHsgYnRuLmRpc2FibGVkID0gZmFsc2U7IGJ0bi50ZXh0Q29udGVudCA9ICfguIHguLnguYnguITguLfguJnguILguYnguK3guKHguLnguKUnOyByZXR1cm4gdG9hc3QoJ+C5',
  'hOC4n+C4peC5jOC5hOC4oeC5iOC5g+C4iuC5iCBKU09OIOC4l+C4teC5iOC4luC4ueC4geC4leC5ieC4reC4hycsICdlcnInKTsgfQogICAgICBjYWxsQXBpKCdiYWNrdXAuaW1wb3J0JywgeyBkYXRhOiBwYXJzZWQsIG1vZGU6IG1vZGUgfSkudGhlbihmdW5jdGlv',
  'bihzdGF0KXsKICAgICAgICBjbG9zZU1vZGFsKCk7CiAgICAgICAgdmFyIG4gPSBPYmplY3Qua2V5cyhzdGF0KS5yZWR1Y2UoZnVuY3Rpb24oYSxrKXsgcmV0dXJuIGEgKyAoc3RhdFtrXXx8MCk7IH0sIDApOwogICAgICAgIHRvYXN0KCfguIHguLnguYnguITguLfg',
  'uJnguKrguLPguYDguKPguYfguIggJyArIG4gKyAnIOC4o+C4suC4ouC4geC4suC4oycsICdvaycpOwogICAgICAgIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgICAgYnRuLmRpc2FibGVkID0gZmFsc2U7IGJ0',
  'bi50ZXh0Q29udGVudCA9ICfguIHguLnguYnguITguLfguJnguILguYnguK3guKHguLnguKUnOyB0b2FzdChlLm1lc3NhZ2V8fGUsICdlcnInKTsKICAgICAgfSk7CiAgICB9OwogICAgci5yZWFkQXNUZXh0KGYpOwogIH07Cn0KCi8qID09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguKXguLTguIfguIHguYzguYHguIrguKPguYwg4LmB4Lil4Liw4LiB4Liy4Lij4Liq4Liz4Lij4Lit4LiH4Lil4LiHIEdvb2dsZSBEcml2ZQogICA9PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCmZ1bmN0aW9uIGNvcHlTaGFyZSgpewogIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaGFyZVVybCcpOwogIGlmICghZWwpIHJldHVybjsKICBlbC5zZWxlY3QoKTsK',
  'ICBpZiAobmF2aWdhdG9yLmNsaXBib2FyZCkgewogICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoZWwudmFsdWUpCiAgICAgIC50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguITguLHguJTguKXguK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYzg',
  'uYHguKXguYnguKcnLCdvaycpOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oKXsgdG9hc3QoJ+C4hOC4seC4lOC4peC4reC4geC5hOC4oeC5iOC4quC4s+C5gOC4o+C5h+C4iCDigJQg4LiB4LiU4LiE4LmJ4Liy4LiH4LiX4Li14LmI4LiK4LmI4Lit4LiH4LmB4Lil',
  '4LmJ4Lin4LmA4Lil4Li34Lit4LiB4LiE4Lix4LiU4Lil4Lit4LiBJywnZXJyJyk7IH0pOwogIH0gZWxzZSB7CiAgICB0cnkgeyBkb2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpOyB0b2FzdCgn4LiE4Lix4LiU4Lil4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK',
  '4Lij4LmM4LmB4Lil4LmJ4LinJywnb2snKTsgfQogICAgY2F0Y2ggKGUpIHsgdG9hc3QoJ+C4hOC4seC4lOC4peC4reC4geC5hOC4oeC5iOC4quC4s+C5gOC4o+C5h+C4iCDigJQg4LiB4LiU4LiE4LmJ4Liy4LiH4LiX4Li14LmI4LiK4LmI4Lit4LiH4LmB4Lil4LmJ',
  '4Lin4LmA4Lil4Li34Lit4LiB4LiE4Lix4LiU4Lil4Lit4LiBJywnZXJyJyk7IH0KICB9Cn0KCmZ1bmN0aW9uIGRvUm90YXRlU2hhcmUoKXsKICBjb25maXJtQWN0aW9uKCfguK3guK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYzguIrguLjguJTguYPguKvg',
  'uKHguYg/IOC4hOC4meC4l+C4teC5iOC4luC4t+C4reC4peC4tOC4h+C4geC5jOC5gOC4lOC4tOC4oeC4iOC4sOC5gOC4m+C4tOC4lOC5hOC4oeC5iOC5hOC4lOC5ieC4reC4teC4gScsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdzaGFyZS5yb3RhdGVUb2tlbics',
  'IHt9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICAgIHRvYXN0KCfguK3guK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYzguIrguLjguJTguYPguKvguKHguYjguYHguKXguYnguKcnLCdvaycpOyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAgICB9KS5jYXRjaChm',
  'dW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCmZ1bmN0aW9uIGRvQmFja3VwTm93KCl7CiAgdG9hc3QoJ+C4geC4s+C4peC4seC4h+C4quC4s+C4o+C4reC4h+C4guC5ieC4reC4oeC4ueC4peC4peC4hyBEcml2ZeKApicp',
  'OwogIGNhbGxBcGkoJ2JhY2t1cC5iYWNrdXBOb3cnLCB7fSkudGhlbihmdW5jdGlvbihyKXsKICAgIHRvYXN0KCfguKrguLPguKPguK3guIfguYHguKXguYnguKc6ICcgKyByLm5hbWUsICdvaycpOyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAgfSkuY2F0Y2goZnVu',
  'Y3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwp9Cjwvc2NyaXB0Pgo8c2NyaXB0PmJvb3QoKTs8L3NjcmlwdD4KPC9ib2R5Pgo8L2h0bWw+Cg=='
].join('');

function indexHtml_() {
  return Utilities.newBlob(Utilities.base64Decode(INDEX_HTML_B64), 'text/html')
    .getDataAsString('UTF-8');
}
