/**
 * The M Corner AP — ระบบบริหารหอพัก (ไฟล์เดียวจบ)
 * ไฟล์นี้สร้างอัตโนมัติจากโฟลเดอร์ src/ เมื่อ 2026-10-30 06:44 UTC
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
  VERSION: '1.8.0',
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
  return saved;
}

/** @param {Object=} expect แถวที่อ่านมา (ใส่ไว้เพื่อตรวจว่ายังเป็นรายการเดิมก่อนลบ) */
function deleteRow_(name, rowNumber, expect) {
  var sh = ensureSheet_(name);
  sh.deleteRow(verifyRow_(sh, name, rowNumber, expect));
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
    var copy = DriveApp.getFileById(getSpreadsheet_().getId()).makeCopy(name, backupFolder_());
    return copy.getName();
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
  rooms = rooms.map(function (r) { return cleanRoom_(r, true); });

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
  'app.alerts': function (p) { return alertCenter_(p); },
  // ไม่ได้เขียนชีต (เก็บใน Script Properties) จึงไม่ต้องเข้าคิวเขียน และไม่ทำให้เครื่องอื่นโหลดใหม่
  'app.alertsSeen': function (p) { return markAlertsSeen_(p); },
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
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
  // ไม่ตั้ง XFrameOptionsMode.ALLOWALL — ถ้าเปิดให้เว็บอื่นฝังหน้านี้ได้ คนอื่นทำหน้าหลอก
  // ครอบหน้าระบบไว้ใต้ปุ่มของตัวเอง ให้คนที่ล็อกอินค้างอยู่กดลบ/แก้ข้อมูลโดยไม่รู้ตัวได้ (clickjacking)
  // ค่าตั้งต้นของ Apps Script เปิดผ่านลิงก์ /exec ได้ตามปกติ
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
  'by1zb2Z0KTtjb2xvcjp2YXIoLS1pbmZvKX0KLnQgdHIuYWRqIHRke2JhY2tncm91bmQ6dmFyKC0taW5mby1zb2Z0KX0KLyog4Lib4LmJ4Liy4Lii4LiX4Li14LmI4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Lii4Liy4Lin4LmE4LiU4LmJICjguIrguLfguYjguK3guIHg',
  'uYnguK3guJnguKvguJnguLXguYkpIOC5g+C4q+C5ieC4leC4seC4lOC4guC4tuC5ieC4meC4muC4o+C4o+C4l+C4seC4lOC5g+C4q+C4oeC5iOC5geC4l+C4meC4geC4suC4o+C4peC5ieC4meC4guC4reC4muC4geC4suC4o+C5jOC4lCAqLwouYi53cmFwe3doaXRl',
  'LXNwYWNlOm5vcm1hbDtkaXNwbGF5OmlubGluZS1ibG9jazttYXgtd2lkdGg6MTAwJTtib3JkZXItcmFkaXVzOjEwcHg7bGluZS1oZWlnaHQ6MS40NTtvdmVyZmxvdy13cmFwOmFueXdoZXJlfQouYi5tdXRle2JhY2tncm91bmQ6dmFyKC0tbGluZS0yKTtjb2xvcjp2',
  'YXIoLS1tdXRlZCl9CgovKiA9PT09PT09PT09PT0gcm9vbSBncmlkID09PT09PT09PT09PSAqLwouZmxvb3Jze2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47Z2FwOjEycHh9Ci5mbG9vcntkaXNwbGF5OmZsZXg7Z2FwOjEycHg7YWxpZ24taXRlbXM6',
  'ZmxleC1zdGFydH0KLmZsb29yLXRhZ3sKICBmbGV4OjAgMCA2MnB4O2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKTtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6dmFyKC0tci1zbSk7CiAgcGFkZGluZzo4cHg7dGV4dC1hbGlnbjpj',
  'ZW50ZXI7Zm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1tdXRlZCk7Cn0KLmZsb29yLXRhZyBie2Rpc3BsYXk6YmxvY2s7Zm9udC1zaXplOjE3cHg7Y29sb3I6dmFyKC0taW5rKX0KLnJvb21ze2Rpc3BsYXk6Z3JpZDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVw',
  'ZWF0KGF1dG8tZmlsbCxtaW5tYXgoMTI2cHgsMWZyKSk7Z2FwOjhweDtmbGV4OjF9Ci5yb29tewogIGJvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlKTtib3JkZXItcmFkaXVzOnZhcigtLXItc20pO3BhZGRpbmc6OXB4',
  'IDEwcHg7CiAgY3Vyc29yOnBvaW50ZXI7dHJhbnNpdGlvbjp0cmFuc2Zvcm0gLjFzLGJveC1zaGFkb3cgLjE1cyxib3JkZXItY29sb3IgLjE1cztwb3NpdGlvbjpyZWxhdGl2ZTtvdmVyZmxvdzpoaWRkZW47Cn0KLnJvb206aG92ZXJ7dHJhbnNmb3JtOnRyYW5zbGF0',
  'ZVkoLTFweCk7Ym94LXNoYWRvdzp2YXIoLS1zaC1sZyk7Ym9yZGVyLWNvbG9yOnZhcigtLWJyYW5kKX0KLnJvb20gLm5ve2ZvbnQtd2VpZ2h0OjYwMDtmb250LXNpemU6MTUuNXB4O2xldHRlci1zcGFjaW5nOjA7Zm9udC1mYW1pbHk6dmFyKC0tZm9udC1kaXNwbGF5',
  'KTtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXN9Ci5yb29tIC5zdHtmb250LXNpemU6MTFweDtjb2xvcjp2YXIoLS1tdXRlZCk7bWFyZ2luLXRvcDoycHg7bGluZS1oZWlnaHQ6MS4zfQoucm9vbSAuZG90e3Bvc2l0aW9uOmFic29sdXRlO3RvcDo5cHg7',
  'cmlnaHQ6OXB4O3dpZHRoOjhweDtoZWlnaHQ6OHB4O2JvcmRlci1yYWRpdXM6OTlweDtiYWNrZ3JvdW5kOnZhcigtLWxpbmUpfQoucm9vbS5zLW9rIC5kb3R7YmFja2dyb3VuZDp2YXIoLS1vayl9IC5yb29tLnMtd2FybiAuZG90e2JhY2tncm91bmQ6dmFyKC0td2Fy',
  'bil9Ci5yb29tLnMtZGdyIC5kb3R7YmFja2dyb3VuZDp2YXIoLS1kYW5nZXIpfSAucm9vbS5zLWluZm8gLmRvdHtiYWNrZ3JvdW5kOnZhcigtLWluZm8pfQoucm9vbS5zLW9re2JvcmRlci1sZWZ0OjNweCBzb2xpZCB2YXIoLS1vayl9IC5yb29tLnMtd2Fybntib3Jk',
  'ZXItbGVmdDozcHggc29saWQgdmFyKC0td2Fybil9Ci5yb29tLnMtZGdye2JvcmRlci1sZWZ0OjNweCBzb2xpZCB2YXIoLS1kYW5nZXIpfSAucm9vbS5zLWluZm97Ym9yZGVyLWxlZnQ6M3B4IHNvbGlkIHZhcigtLWluZm8pfQoKLyogPT09PT09PT09PT09IGFsZXJ0',
  'cyAvIGxpc3QgPT09PT09PT09PT09ICovCi5hbGlzdHtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1ufQouYWxpe2Rpc3BsYXk6ZmxleDtnYXA6MTFweDtwYWRkaW5nOjExcHggMTZweDtib3JkZXItYm90dG9tOjFweCBzb2xpZCB2YXIoLS1saW5lLTIp',
  'O2N1cnNvcjpwb2ludGVyfQouYWxpOmxhc3QtY2hpbGR7Ym9yZGVyLWJvdHRvbTowfQouYWxpOmhvdmVye2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKX0KLmFsaSAuaWN7Zm9udC1zaXplOjE2cHg7bGluZS1oZWlnaHQ6MS4zfQouYWxpIC50dHtmb250LXdlaWdo',
  'dDo2MDA7Zm9udC1zaXplOjEzcHh9Ci5hbGkgLmRke2ZvbnQtc2l6ZToxMnB4O2NvbG9yOnZhcigtLW11dGVkKTttYXJnaW4tdG9wOjFweH0KLmFsaS5sLWRhbmdlciAudHR7Y29sb3I6dmFyKC0tZGFuZ2VyKX0gLmFsaS5sLXdhcm4gLnR0e2NvbG9yOnZhcigtLXdh',
  'cm4pfQoKLyogPT09PT09PT09PT09IG1lZGlhIC8gdGh1bWJzID09PT09PT09PT09PSAqLwoudGh1bWJze2Rpc3BsYXk6ZmxleDtnYXA6NXB4O2ZsZXgtd3JhcDp3cmFwfQoudGh1bWJ7CiAgd2lkdGg6NDRweDtoZWlnaHQ6NDRweDtib3JkZXItcmFkaXVzOjZweDti',
  'b3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO29iamVjdC1maXQ6Y292ZXI7CiAgYmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpO2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6YmxvY2s7Cn0KLnRodW1iLmJpZ3t3aWR0aDo5MnB4O2hlaWdodDo5MnB4fQouZmlsZS1k',
  'cm9wewogIGJvcmRlcjoxLjVweCBkYXNoZWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTtwYWRkaW5nOjE0cHg7dGV4dC1hbGlnbjpjZW50ZXI7CiAgY29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtc2l6ZToxMi41cHg7Y3Vyc29yOnBvaW50ZXI7',
  'YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpOwp9Ci5maWxlLWRyb3A6aG92ZXJ7Ym9yZGVyLWNvbG9yOnZhcigtLWJyYW5kKTtjb2xvcjp2YXIoLS1icmFuZCl9CgovKiA9PT09PT09PT09PT0gbW9kYWwgPT09PT09PT09PT09ICovCi5vdntwb3NpdGlvbjpmaXhl',
  'ZDtpbnNldDowO2JhY2tncm91bmQ6cmdiYSgxNiwyNCw0MCwuNTUpO2JhY2tkcm9wLWZpbHRlcjpibHVyKDNweCk7ei1pbmRleDoxMDA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmZsZXgtc3RhcnQ7anVzdGlmeS1jb250ZW50OmNlbnRlcjtwYWRkaW5nOjI0cHgg',
  'MTZweDtvdmVyZmxvdy15OmF1dG99Ci5tb2RhbHtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpO2JvcmRlci1yYWRpdXM6MTRweDtib3gtc2hhZG93OnZhcigtLXNoLWxnKTt3aWR0aDoxMDAlO21heC13aWR0aDo2NjBweDttYXJnaW46YXV0byAwO2FuaW1hdGlvbjpw',
  'b3AgLjE2cyBlYXNlLW91dH0KLm1vZGFsLndpZGV7bWF4LXdpZHRoOjk2MHB4fQpAa2V5ZnJhbWVzIHBvcHtmcm9te29wYWNpdHk6MDt0cmFuc2Zvcm06dHJhbnNsYXRlWSgtOHB4KSBzY2FsZSguOTg1KX10b3tvcGFjaXR5OjE7dHJhbnNmb3JtOm5vbmV9fQoubW9k',
  'YWwtaHtwYWRkaW5nOjE2cHggMThweDtib3JkZXItYm90dG9tOjFweCBzb2xpZCB2YXIoLS1saW5lKTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMHB4fQoubW9kYWwtaCBoM3ttYXJnaW46MDtmb250LXNpemU6MTUuNXB4O2ZvbnQtd2VpZ2h0',
  'OjYwMDtmb250LWZhbWlseTp2YXIoLS1mb250LWRpc3BsYXkpfQoubW9kYWwtYntwYWRkaW5nOjE4cHg7bWF4LWhlaWdodDptaW4oNzB2aCw3MDBweCk7b3ZlcmZsb3cteTphdXRvfQoubW9kYWwtZntwYWRkaW5nOjE0cHggMThweDtib3JkZXItdG9wOjFweCBzb2xp',
  'ZCB2YXIoLS1saW5lKTtkaXNwbGF5OmZsZXg7Z2FwOjhweDtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1lbmQ7ZmxleC13cmFwOndyYXB9Ci54e21hcmdpbi1sZWZ0OmF1dG87YmFja2dyb3VuZDowO2JvcmRlcjowO2ZvbnQtc2l6ZToyMHB4O2NvbG9yOnZhcigtLW11dGVk',
  'KTtjdXJzb3I6cG9pbnRlcjtsaW5lLWhlaWdodDoxO3BhZGRpbmc6MnB4IDZweDtib3JkZXItcmFkaXVzOjZweH0KLng6aG92ZXJ7YmFja2dyb3VuZDp2YXIoLS1saW5lLTIpO2NvbG9yOnZhcigtLWluayl9CgouZmdyaWR7ZGlzcGxheTpncmlkO2dyaWQtdGVtcGxh',
  'dGUtY29sdW1uczpyZXBlYXQoMixtaW5tYXgoMCwxZnIpKTtnYXA6MTNweH0KLmZ7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtnYXA6NXB4fQouZi5mdWxse2dyaWQtY29sdW1uOjEvLTF9Ci5mIGxhYmVse2ZvbnQtc2l6ZToxMnB4O2NvbG9yOnZh',
  'cigtLWluay0yKTtmb250LXdlaWdodDo2MDB9Ci5mIC5oaW50e2ZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0tZmFpbnQpfQoKLyogPT09PT09PT09PT09IG1pc2MgPT09PT09PT09PT09ICovCi5lbXB0eXtwYWRkaW5nOjQwcHggMjBweDt0ZXh0LWFsaWduOmNl',
  'bnRlcjtjb2xvcjp2YXIoLS1tdXRlZCl9Ci5lbXB0eSAuYmlne2ZvbnQtc2l6ZTozNHB4O21hcmdpbi1ib3R0b206OHB4O29wYWNpdHk6LjZ9Ci5zcGlue2Rpc3BsYXk6aW5saW5lLWJsb2NrO3dpZHRoOjE1cHg7aGVpZ2h0OjE1cHg7Ym9yZGVyOjJweCBzb2xpZCB2',
  'YXIoLS1saW5lKTtib3JkZXItdG9wLWNvbG9yOnZhcigtLWJyYW5kKTtib3JkZXItcmFkaXVzOjk5cHg7YW5pbWF0aW9uOnNwIC43cyBsaW5lYXIgaW5maW5pdGU7dmVydGljYWwtYWxpZ246LTJweH0KQGtleWZyYW1lcyBzcHt0b3t0cmFuc2Zvcm06cm90YXRlKDM2',
  'MGRlZyl9fQoudG9hc3R7CiAgcG9zaXRpb246Zml4ZWQ7bGVmdDo1MCU7Ym90dG9tOjI0cHg7dHJhbnNmb3JtOnRyYW5zbGF0ZVgoLTUwJSk7ei1pbmRleDoyMDA7CiAgYmFja2dyb3VuZDp2YXIoLS1uYXYpO2NvbG9yOiNmZmY7cGFkZGluZzoxMHB4IDE4cHg7Ym9y',
  'ZGVyLXJhZGl1czo5OXB4O2ZvbnQtc2l6ZToxM3B4OwogIGJveC1zaGFkb3c6dmFyKC0tc2gtbGcpO2FuaW1hdGlvbjp1cCAuMnMgZWFzZS1vdXQ7bWF4LXdpZHRoOjkwdnc7Cn0KLnRvYXN0LmVycntiYWNrZ3JvdW5kOnZhcigtLWRhbmdlcil9Ci50b2FzdC5va3ti',
  'YWNrZ3JvdW5kOnZhcigtLW9rKX0KQGtleWZyYW1lcyB1cHtmcm9te29wYWNpdHk6MDt0cmFuc2Zvcm06dHJhbnNsYXRlKC01MCUsMTBweCl9dG97b3BhY2l0eToxO3RyYW5zZm9ybTp0cmFuc2xhdGUoLTUwJSwwKX19Ci5tdXRlZHtjb2xvcjp2YXIoLS1tdXRlZCl9',
  'IC5mYWludHtjb2xvcjp2YXIoLS1mYWludCl9Ci5mczEye2ZvbnQtc2l6ZToxMnB4fSAuZnMxM3tmb250LXNpemU6MTNweH0KLm1vbm97Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zfQoubXQ4e21hcmdpbi10b3A6OHB4fSAubXQxMnttYXJnaW4tdG9w',
  'OjEycHh9IC5tdDE2e21hcmdpbi10b3A6MTZweH0gLm1iOHttYXJnaW4tYm90dG9tOjhweH0gLm1iMTJ7bWFyZ2luLWJvdHRvbToxMnB4fQoucm93e2Rpc3BsYXk6ZmxleDtnYXA6OHB4O2FsaWduLWl0ZW1zOmNlbnRlcjtmbGV4LXdyYXA6d3JhcH0KLnNwe21hcmdp',
  'bi1sZWZ0OmF1dG99Ci5ocntoZWlnaHQ6MXB4O2JhY2tncm91bmQ6dmFyKC0tbGluZS0yKTttYXJnaW46MTRweCAwfQouY2xpcHtvdmVyZmxvdzpoaWRkZW47dGV4dC1vdmVyZmxvdzplbGxpcHNpcztkaXNwbGF5Oi13ZWJraXQtYm94Oy13ZWJraXQtbGluZS1jbGFt',
  'cDoyOy13ZWJraXQtYm94LW9yaWVudDp2ZXJ0aWNhbH0KCi8qIGJhciBjaGFydCAqLwouYmFyc3tkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2dhcDo5cHh9Ci5iYXItcm93e2Rpc3BsYXk6Z3JpZDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6bWlubWF4',
  'KDkwcHgsMTUwcHgpIDFmciBhdXRvO2dhcDoxMHB4O2FsaWduLWl0ZW1zOmNlbnRlcjtmb250LXNpemU6MTIuNXB4fQouYmFyLXRyYWNre2hlaWdodDo4cHg7YmFja2dyb3VuZDp2YXIoLS1saW5lLTIpO2JvcmRlci1yYWRpdXM6OTlweDtvdmVyZmxvdzpoaWRkZW59',
  'Ci5iYXItZmlsbHtoZWlnaHQ6MTAwJTtiYWNrZ3JvdW5kOnZhcigtLWJyYW5kKTtib3JkZXItcmFkaXVzOjk5cHg7dHJhbnNpdGlvbjp3aWR0aCAuNXN9Ci5iYXItcm93IC52e2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtcztjb2xvcjp2YXIoLS1pbmst',
  'Mik7Zm9udC13ZWlnaHQ6NjAwO3doaXRlLXNwYWNlOm5vd3JhcH0KCi8qIHRpbWVsaW5lICovCi50bHtwb3NpdGlvbjpyZWxhdGl2ZTtwYWRkaW5nLWxlZnQ6MjJweH0KLnRsOmJlZm9yZXtjb250ZW50OicnO3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6NnB4O3RvcDo2',
  'cHg7Ym90dG9tOjZweDt3aWR0aDoycHg7YmFja2dyb3VuZDp2YXIoLS1saW5lKX0KLnRsLWl7cG9zaXRpb246cmVsYXRpdmU7cGFkZGluZzowIDAgMTZweH0KLnRsLWk6YmVmb3Jle2NvbnRlbnQ6Jyc7cG9zaXRpb246YWJzb2x1dGU7bGVmdDotMjBweDt0b3A6NXB4',
  'O3dpZHRoOjEwcHg7aGVpZ2h0OjEwcHg7Ym9yZGVyLXJhZGl1czo5OXB4O2JhY2tncm91bmQ6dmFyKC0tYnJhbmQpO2JvcmRlcjoycHggc29saWQgdmFyKC0tc3VyZmFjZSl9Ci50bC1pIC5ke2ZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0tbXV0ZWQpfQoudGwt',
  'aSAudHtmb250LXdlaWdodDo2MDA7Zm9udC1zaXplOjEzcHh9CgovKiA9PT09PT09PT09PT0gcmVzcG9uc2l2ZSA9PT09PT09PT09PT0gKi8KQG1lZGlhIChtYXgtd2lkdGg6OTAwcHgpewogIC5nNHtncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDIsbWlubWF4',
  'KDAsMWZyKSl9CiAgLmcze2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoMixtaW5tYXgoMCwxZnIpKX0KfQovKiDguYHguJfguYfguJrguYDguKXguYfguJUv4Lir4LiZ4LmJ4Liy4LiV4LmI4Liy4LiH4Lii4LmI4LitOiDguYDguKHguJnguLnguILguYnguLLg',
  'uIfguKLguLHguIfguK3guKLguLnguYgg4LiX4Li14LmI4LmA4Lir4Lil4Li34Lit4LmD4Lir4LmJ4LmB4LiW4Lia4Lir4Lix4Lin4LmA4Lil4Lii4LmB4LiE4LiaCiAgIOC4muC4teC4muC4iuC5iOC4reC4h+C4hOC5ieC4meC4q+C4suC4peC4h+C4q+C4meC5iOC4',
  'reC4ouC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC4leC4geC4muC4o+C4o+C4l+C4seC4lOC4iOC4meC5geC4luC4muC4q+C4seC4p+C4quC4ueC4h+C4guC4tuC5ieC4meC4reC4teC4geC5gOC4l+C5iOC4suC4leC4seC4pyAqLwpAbWVkaWEgKG1heC13aWR0aDox',
  'MDQwcHgpewogIC50b3AtcmlnaHQgI3NlYXJjaEJveHt3aWR0aDoxMzJweCFpbXBvcnRhbnR9CiAgLnRvcC1yaWdodCAjeWVhclNlbHttYXgtd2lkdGg6MTMycHh9CiAgLyog4LiV4Lix4Lin4Lia4Lit4LiB4Liq4LiW4Liy4LiZ4Liw4LmA4Lir4Lil4Li34Lit4LmB',
  '4LiV4LmI4LmE4Lit4LiE4Lit4LiZICjguILguYnguK3guITguKfguLLguKHguKLguLHguIfguK3guYjguLLguJnguYTguJTguYnguIjguLLguIHguIHguLLguKPguIrguLXguYnguITguYnguLLguIcpCiAgICAg4LiB4LiO4LmA4LiU4Li14Lii4Lin4LiB4Lix4Lia',
  '4LiX4Li14LmI4LmD4LiK4LmJ4Lia4LiZ4Lih4Li34Lit4LiW4Li34Lit4Lit4Lii4Li54LmI4LmB4Lil4LmJ4LinIOC5geC4hOC5iOC4guC4ouC4seC4muC5g+C4q+C5ieC5gOC4o+C4tOC5iOC4oeC5gOC4o+C5h+C4p+C4guC4tuC5ieC4mSAqLwogIC5zeW5jLXBp',
  'bGwgLnN5bmMtbGFiZWx7ZGlzcGxheTpub25lfQogIC5zeW5jLXBpbGx7cGFkZGluZzozcHggOHB4fQp9CkBtZWRpYSAobWF4LXdpZHRoOjc2MHB4KXsKICAubmF2ewogICAgcG9zaXRpb246Zml4ZWQ7bGVmdDowO3RvcDowO2JvdHRvbTowO3otaW5kZXg6NjA7dHJh',
  'bnNmb3JtOnRyYW5zbGF0ZVgoLTEwMCUpOwogICAgdHJhbnNpdGlvbjp0cmFuc2Zvcm0gLjIycyBlYXNlO2JveC1zaGFkb3c6dmFyKC0tc2gtbGcpOwogIH0KICAubmF2Lm9wZW57dHJhbnNmb3JtOm5vbmV9CiAgLmJ1cmdlcntkaXNwbGF5OmlubGluZS1mbGV4fQog',
  'IC5jb250ZW50e3BhZGRpbmc6MTRweCAxNHB4IDgwcHh9CiAgLnRvcHtwYWRkaW5nOjEwcHggMTRweH0KICAuZzIsLmczLC5nNHtncmlkLXRlbXBsYXRlLWNvbHVtbnM6MWZyfQogIC5mZ3JpZHtncmlkLXRlbXBsYXRlLWNvbHVtbnM6MWZyfQogIC5mbG9vcntmbGV4',
  'LWRpcmVjdGlvbjpjb2x1bW59CiAgLmZsb29yLXRhZ3tmbGV4Om5vbmU7d2lkdGg6MTAwJTtkaXNwbGF5OmZsZXg7Z2FwOjhweDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnQ7dGV4dC1hbGlnbjpsZWZ0fQogIC5mbG9vci10YWcg',
  'Yntmb250LXNpemU6MTRweH0KICAuc2NyaW17cG9zaXRpb246Zml4ZWQ7aW5zZXQ6MDtiYWNrZ3JvdW5kOnJnYmEoMCwwLDAsLjQ1KTt6LWluZGV4OjU1fQogIC5tb2RhbC1ie21heC1oZWlnaHQ6bm9uZX0KICAub3Z7cGFkZGluZzowfQogIC5tb2RhbHtib3JkZXIt',
  'cmFkaXVzOjA7bWluLWhlaWdodDoxMDB2aDttYXgtd2lkdGg6bm9uZX0KfQovKiA9PT09PT09PT09PT0g4Lir4LiZ4LmJ4Liy4Lil4LmH4Lit4LiB4Lit4Li04LiZIC8gUElOID09PT09PT09PT09PSAqLwpib2R5LmxvY2tlZHtvdmVyZmxvdzpoaWRkZW59CmJvZHku',
  'bG9ja2VkIC5hcHB7ZmlsdGVyOmJsdXIoM3B4KTtwb2ludGVyLWV2ZW50czpub25lO3VzZXItc2VsZWN0Om5vbmV9Ci5hdXRoLXdyYXB7CiAgcG9zaXRpb246Zml4ZWQ7aW5zZXQ6MDt6LWluZGV4OjYwO2Rpc3BsYXk6Z3JpZDtwbGFjZS1pdGVtczpjZW50ZXI7CiAg',
  'cGFkZGluZzoyNHB4O2JhY2tncm91bmQ6dmFyKC0tYmcpO292ZXJmbG93LXk6YXV0bzsKfQouYXV0aC1jYXJkewogIHdpZHRoOjEwMCU7bWF4LXdpZHRoOjM2MHB4O2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTsK',
  'ICBib3JkZXItcmFkaXVzOjE2cHg7Ym94LXNoYWRvdzp2YXIoLS1zaC1sZyk7cGFkZGluZzoyNnB4IDI0cHggMjJweDsKfQouYXV0aC1icmFuZHtmb250LXNpemU6MTVweDtjb2xvcjp2YXIoLS1tdXRlZCk7bWFyZ2luLWJvdHRvbToxOHB4O3RleHQtYWxpZ246Y2Vu',
  'dGVyfQouYXV0aC1icmFuZCBie2NvbG9yOnZhcigtLWluayk7Zm9udC1mYW1pbHk6dmFyKC0tZm9udC1kaXNwbGF5KX0KLmF1dGgtaHttYXJnaW46MCAwIDRweDtmb250LXNpemU6MjBweDtmb250LXdlaWdodDo2MDA7Zm9udC1mYW1pbHk6dmFyKC0tZm9udC1kaXNw',
  'bGF5KTt0ZXh0LWFsaWduOmNlbnRlcn0KLmF1dGgtc3Vie21hcmdpbjowIDAgMThweDtmb250LXNpemU6MTNweDtjb2xvcjp2YXIoLS1tdXRlZCk7dGV4dC1hbGlnbjpjZW50ZXI7bGluZS1oZWlnaHQ6MS42fQouYXV0aC1me21hcmdpbi1ib3R0b206MTNweH0KLmF1',
  'dGgtZiBsYWJlbHtkaXNwbGF5OmJsb2NrO2ZvbnQtc2l6ZToxMi41cHg7Y29sb3I6dmFyKC0taW5rLTIpO21hcmdpbi1ib3R0b206NXB4O2ZvbnQtd2VpZ2h0OjUwMH0KLmF1dGgtZiAuaW5we3dpZHRoOjEwMCU7cGFkZGluZzoxMHB4IDEycHg7Zm9udC1zaXplOjE1',
  'cHh9Ci5hdXRoLWdve3dpZHRoOjEwMCU7anVzdGlmeS1jb250ZW50OmNlbnRlcjtwYWRkaW5nOjExcHg7Zm9udC1zaXplOjE0LjVweDttYXJnaW4tdG9wOjZweH0KLmF1dGgtYWx0e3dpZHRoOjEwMCU7anVzdGlmeS1jb250ZW50OmNlbnRlcjttYXJnaW4tdG9wOjlw',
  'eDtmb250LXNpemU6MTNweH0KLmF1dGgtZXJyewogIGJhY2tncm91bmQ6dmFyKC0tZGFuZ2VyLXNvZnQpO2NvbG9yOnZhcigtLWRhbmdlcik7Ym9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTsKICBwYWRkaW5nOjlweCAxMnB4O2ZvbnQtc2l6ZToxMi41cHg7bWFyZ2lu',
  'LWJvdHRvbToxNHB4O2xpbmUtaGVpZ2h0OjEuNTU7Cn0KLmF1dGgtZm9vdHtmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLWZhaW50KTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW46MTZweCAwIDA7bGluZS1oZWlnaHQ6MS42fQoKLyog4LiI4Li44LiUIDYg4LiI',
  '4Li44LiU4LmB4LiX4LiZIFBJTiDguJfguLXguYjguIHguJTguYTguJvguYHguKXguYnguKcgKi8KLnBpbi1kb3Rze2Rpc3BsYXk6ZmxleDtnYXA6MTNweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO21hcmdpbjo2cHggMCAyMnB4fQoucGluLWRvdHMgaXsKICB3aWR0',
  'aDoxM3B4O2hlaWdodDoxM3B4O2JvcmRlci1yYWRpdXM6OTlweDtiYWNrZ3JvdW5kOnZhcigtLWxpbmUpOwogIGJvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7dHJhbnNpdGlvbjp0cmFuc2Zvcm0gLjEycyxiYWNrZ3JvdW5kIC4xMnM7Cn0KLnBpbi1kb3RzIGku',
  'b257YmFja2dyb3VuZDp2YXIoLS1icmFuZCk7Ym9yZGVyLWNvbG9yOnZhcigtLWJyYW5kKTt0cmFuc2Zvcm06c2NhbGUoMS4xNil9Ci5waW4tZG90cy5idXN5e29wYWNpdHk6LjV9Ci5waW4tZG90cy5zaGFrZXthbmltYXRpb246c2hha2UgLjQyc30KQGtleWZyYW1l',
  'cyBzaGFrZXsKICAwJSwxMDAle3RyYW5zZm9ybTp0cmFuc2xhdGVYKDApfSAyMCV7dHJhbnNmb3JtOnRyYW5zbGF0ZVgoLThweCl9CiAgNDAle3RyYW5zZm9ybTp0cmFuc2xhdGVYKDhweCl9IDYwJXt0cmFuc2Zvcm06dHJhbnNsYXRlWCgtNXB4KX0gODAle3RyYW5z',
  'Zm9ybTp0cmFuc2xhdGVYKDVweCl9Cn0KLnBpbi1wYWR7ZGlzcGxheTpncmlkO2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoMywxZnIpO2dhcDoxMXB4fQoucGluLWt7CiAgYXNwZWN0LXJhdGlvOjEvMTtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2Jh',
  'Y2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKTtjb2xvcjp2YXIoLS1pbmspOwogIGJvcmRlci1yYWRpdXM6MTRweDtmb250LXNpemU6MjFweDtmb250LXdlaWdodDo1MDA7Y3Vyc29yOnBvaW50ZXI7CiAgZm9udC1mYW1pbHk6dmFyKC0tZm9udC1kaXNwbGF5KTtmb250',
  'LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7CiAgdHJhbnNpdGlvbjpiYWNrZ3JvdW5kIC4xcyx0cmFuc2Zvcm0gLjA2czsKfQoucGluLWs6aG92ZXJ7YmFja2dyb3VuZDp2YXIoLS1icmFuZC1zb2Z0KTtib3JkZXItY29sb3I6dmFyKC0tYnJhbmQpfQoucGlu',
  'LWs6YWN0aXZle3RyYW5zZm9ybTpzY2FsZSguOTQpfQoucGluLWsuZ2hvc3R7YmFja2dyb3VuZDp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Zm9udC1zaXplOjE3cHg7Y29sb3I6dmFyKC0tbXV0ZWQpfQoucGluLWsuZ2hvc3Q6aG92ZXJ7YmFj',
  'a2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpO2JvcmRlci1jb2xvcjp2YXIoLS1saW5lKX0KCi8qID09PT09PT09PT09PSDguJXguLHguKfguYDguKXguLfguK3guIHguJjguLXguKEgPT09PT09PT09PT09ICovCi50aGVtZS1waWNre2Rpc3BsYXk6Z3JpZDtncmlkLXRl',
  'bXBsYXRlLWNvbHVtbnM6cmVwZWF0KDMsbWlubWF4KDAsMWZyKSk7Z2FwOjEwcHh9Ci50aGVtZS1vcHR7CiAgZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjRweDt0ZXh0LWFsaWduOmNlbnRlcjsKICBwYWRk',
  'aW5nOjE1cHggMTBweDtib3JkZXI6MS41cHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czp2YXIoLS1yKTsKICBiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Y3Vyc29yOnBvaW50ZXI7Y29sb3I6dmFyKC0taW5rKTtmb250OmluaGVyaXQ7CiAgdHJh',
  'bnNpdGlvbjpib3JkZXItY29sb3IgLjEycyxiYWNrZ3JvdW5kIC4xMnM7Cn0KLnRoZW1lLW9wdDpob3Zlcntib3JkZXItY29sb3I6dmFyKC0tYnJhbmQpfQoudGhlbWUtb3B0Lm9ue2JvcmRlci1jb2xvcjp2YXIoLS1icmFuZCk7YmFja2dyb3VuZDp2YXIoLS1icmFu',
  'ZC1zb2Z0KX0KLnRoZW1lLW9wdCAuaWN7Zm9udC1zaXplOjI0cHg7bGluZS1oZWlnaHQ6MS4yfQoudGhlbWUtb3B0IGJ7Zm9udC1zaXplOjEzLjVweH0KLnRoZW1lLW9wdCAuaGludHtmb250LXNpemU6MTFweDtjb2xvcjp2YXIoLS1tdXRlZCk7bGluZS1oZWlnaHQ6',
  'MS40NX0KLndhcm4tdGV4dHtjb2xvcjp2YXIoLS13YXJuKX0KCi8qID09PT09PT09PT09PSDguJzguKXguIHguLLguKPguK3guYjguLLguJnguILguYnguK3guITguKfguLLguKHguIjguLLguIHguKPguLnguJsgPT09PT09PT09PT09ICovCi8qIOC5hOC4ruC5hOC4',
  'peC4leC5jOC4quC4seC5ieC4mSDguYYg4LmD4Lir4LmJ4LmA4Lir4LmH4LiZ4Lin4LmI4Liy4LiK4LmI4Lit4LiH4LmE4Lir4LiZ4LmA4Lie4Li04LmI4LiH4LiW4Li54LiB4LmA4LiV4Li04Lih4LiI4Liy4LiB4Lij4Li54LibICovCi5vY3ItZmlsbGVkewogIGJv',
  'cmRlci1jb2xvcjp2YXIoLS1icmFuZCkhaW1wb3J0YW50OwogIGJveC1zaGFkb3c6MCAwIDAgM3B4IHZhcigtLWJyYW5kLXNvZnQpIWltcG9ydGFudDsKICBhbmltYXRpb246b2NyUG9wIC40czsKfQpAa2V5ZnJhbWVzIG9jclBvcHsgMCV7YmFja2dyb3VuZDp2YXIo',
  'LS1icmFuZC1zb2Z0KX0gMTAwJXtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpfSB9Cgoub2NyLWJveHsKICBib3JkZXI6MXB4IGRhc2hlZCB2YXIoLS1icmFuZCk7YmFja2dyb3VuZDp2YXIoLS1icmFuZC1zb2Z0KTsKICBib3JkZXItcmFkaXVzOnZhcigtLXItc20p',
  'O3BhZGRpbmc6MTJweDttYXJnaW4tdG9wOjEwcHg7Cn0KLm9jci1ib3ggLmhke2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjdweDtmb250LXNpemU6MTIuNXB4O2ZvbnQtd2VpZ2h0OjYwMDtjb2xvcjp2YXIoLS1icmFuZCk7bWFyZ2luLWJvdHRv',
  'bTo5cHh9Ci5vY3ItYm94IC5oZCAuc3B7bWFyZ2luLWxlZnQ6YXV0bztkaXNwbGF5OmZsZXg7Z2FwOjZweH0KLm9jci1oaXRze2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47Z2FwOjZweH0KLm9jci1oaXR7CiAgZGlzcGxheTpmbGV4O2FsaWduLWl0',
  'ZW1zOmNlbnRlcjtnYXA6OXB4O2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7CiAgYm9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXItc20pO3BhZGRpbmc6N3B4IDEwcHg7Zm9udC1zaXplOjEzcHg7Cn0KLm9jci1oaXQgLmt7',
  'Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtc2l6ZToxMS41cHg7bWluLXdpZHRoOjc4cHh9Ci5vY3ItaGl0IC52e2ZvbnQtd2VpZ2h0OjYwMDtmbGV4OjE7bWluLXdpZHRoOjA7b3ZlcmZsb3c6aGlkZGVuO3RleHQtb3ZlcmZsb3c6ZWxsaXBzaXM7d2hpdGUtc3BhY2U6',
  'bm93cmFwfQoub2NyLXJhd3sKICBtYXgtaGVpZ2h0OjE1MHB4O292ZXJmbG93OmF1dG87YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlKTtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpOwogIGJvcmRlci1yYWRpdXM6dmFyKC0tci1zbSk7cGFkZGluZzo5cHggMTFw',
  'eDtmb250LXNpemU6MTJweDtsaW5lLWhlaWdodDoxLjY1OwogIHdoaXRlLXNwYWNlOnByZS13cmFwO2NvbG9yOnZhcigtLWluay0yKTttYXJnaW4tdG9wOjlweDsKfQoKQG1lZGlhIChtYXgtd2lkdGg6NTIwcHgpewogIC5hdXRoLWNhcmR7bWF4LXdpZHRoOjEwMCU7',
  'cGFkZGluZzoyMnB4IDE4cHggMThweH0KICAudGhlbWUtcGlja3tncmlkLXRlbXBsYXRlLWNvbHVtbnM6MWZyfQogIC50aGVtZS1vcHR7ZmxleC1kaXJlY3Rpb246cm93O3RleHQtYWxpZ246bGVmdDtnYXA6MTFweH0KICAudGhlbWUtb3B0IC5oaW50e2Rpc3BsYXk6',
  'bm9uZX0KfQoKLyogPT09PT09PT09PT09IOC4o+C4suC4ouC4geC4suC4o+C4ouC5iOC4reC4ouC5g+C4meC4muC4tOC4pSAo4LiL4Li34LmJ4Lit4LiX4Li14LmA4LiU4Li14Lii4Lin4Lir4Lil4Liy4Lii4Lit4Lii4LmI4Liy4LiHKSA9PT09PT09PT09PT0gKi8K',
  'LmxpbmVze2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTtwYWRkaW5nOjEwcHg7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpfQoubGluZS1oZWFkLC5saW5lLXJvd3sKICBkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1w',
  'bGF0ZS1jb2x1bW5zOm1pbm1heCgwLDFmcikgODRweCA5MnB4IDEwOHB4IDk2cHggMzRweDsKICBnYXA6N3B4O2FsaWduLWl0ZW1zOmNlbnRlcjsKfQoubGluZS1oZWFke2ZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0tbXV0ZWQpO3BhZGRpbmc6MCAycHggNnB4',
  'O2ZvbnQtd2VpZ2h0OjYwMH0KLmxpbmUtaGVhZCAubnVtLC5saW5lLXJvdyAubnVte3RleHQtYWxpZ246cmlnaHR9Ci5saW5lLXJvd3ttYXJnaW4tYm90dG9tOjZweH0KLmxpbmUtcm93IC5pbnB7cGFkZGluZzo2cHggOXB4O2ZvbnQtc2l6ZToxM3B4fQoubGluZS1y',
  'b3cgLmlucC5udW17dGV4dC1hbGlnbjpyaWdodDtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXN9Ci5saW5lLXN1bXsKICB0ZXh0LWFsaWduOnJpZ2h0O2ZvbnQtc2l6ZToxM3B4O2ZvbnQtd2VpZ2h0OjYwMDtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1',
  'bGFyLW51bXM7CiAgY29sb3I6dmFyKC0taW5rKTt3aGl0ZS1zcGFjZTpub3dyYXA7b3ZlcmZsb3c6aGlkZGVuOwp9Ci5saW5lLXRvdGFse21hcmdpbi1sZWZ0OmF1dG87Zm9udC1zaXplOjEzcHg7Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtdmFyaWFudC1udW1lcmlj',
  'OnRhYnVsYXItbnVtc30KLmxpbmUtdG90YWwgYntjb2xvcjp2YXIoLS1pbmspfQoKLyog4Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4Lii4LiX4Li14LmI4LiB4Liy4LiH4LiU4Li54LmD4LiZ4LiV4Liy4Lij4Liy4LiHICovCi5iaWxsLWxpbmVze21hcmdpbi10',
  'b3A6NnB4O2JvcmRlci1sZWZ0OjJweCBzb2xpZCB2YXIoLS1saW5lKTtwYWRkaW5nLWxlZnQ6OXB4fQouYmlsbC1saW5lewogIGRpc3BsYXk6ZmxleDtnYXA6OHB4O2ZvbnQtc2l6ZToxMnB4O2NvbG9yOnZhcigtLWluay0yKTtwYWRkaW5nOjFweCAwOwogIGZvbnQt',
  'dmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtczsKfQouYmlsbC1saW5lIC5ubXtmbGV4OjE7bWluLXdpZHRoOjA7b3ZlcmZsb3c6aGlkZGVuO3RleHQtb3ZlcmZsb3c6ZWxsaXBzaXM7d2hpdGUtc3BhY2U6bm93cmFwfQouYmlsbC1saW5lIC5xdHtjb2xvcjp2YXIo',
  'LS1mYWludCk7d2hpdGUtc3BhY2U6bm93cmFwfQouYmlsbC1saW5lIC50dHt3aGl0ZS1zcGFjZTpub3dyYXA7Zm9udC13ZWlnaHQ6NjAwfQouYmlsbC1leHRyYXtmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLW11dGVkKTttYXJnaW4tdG9wOjNweH0KLmJpbGwt',
  'dG9nZ2xlewogIGJhY2tncm91bmQ6MDtib3JkZXI6MDtwYWRkaW5nOjA7bWFyZ2luLXRvcDozcHg7Y3Vyc29yOnBvaW50ZXI7Zm9udDppbmhlcml0OwogIGZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0tYnJhbmQpO3RleHQtYWxpZ246bGVmdDsKfQouYmlsbC10',
  'b2dnbGU6aG92ZXJ7dGV4dC1kZWNvcmF0aW9uOnVuZGVybGluZX0KCkBtZWRpYSAobWF4LXdpZHRoOjY0MHB4KXsKICAvKiDguIjguK3guYHguITguJo6IOC4iuC4t+C5iOC4reC4quC4tOC4meC4hOC5ieC4suC4reC4ouC4ueC5iOC4muC4o+C4o+C4l+C4seC4lOC4',
  'muC4mSDguKrguYjguKfguJnguIjguLPguJnguKfguJkv4Lir4LiZ4LmI4Lin4LiiL+C4o+C4suC4hOC4si/guKPguKfguKEg4Lit4Lii4Li54LmI4Lia4Lij4Lij4LiX4Lix4LiU4LmA4LiU4Li14Lii4Lin4LiB4Lix4LiZ4LiC4LmJ4Liy4LiH4Lil4LmI4Liy4LiH',
  'CiAgICAg4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4LiB4Li04LiZ4Lie4Li34LmJ4LiZ4LiX4Li14LmI4LmB4LiZ4Lin4LiV4Lix4LmJ4LiH4LiI4LiZ4LiV4LmJ4Lit4LiH4LmA4Lil4Li34LmI4Lit4LiZ4LiI4Lit4Lii4Liy4Lin4LmA4Lin4Lil4Liy4LiL4Li3',
  '4LmJ4Lit4LiC4Lit4LiH4Lir4Lil4Liy4Lii4Lit4Lii4LmI4Liy4LiHICovCiAgLmxpbmVze3BhZGRpbmc6OHB4fQogIC5saW5lLWhlYWR7ZGlzcGxheTpub25lfQogIC5saW5lLXJvd3sKICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczo1NnB4IG1pbm1heCgwLDFm',
  'cikgNzJweCBtaW5tYXgoMCw4NnB4KTsKICAgIGdyaWQtdGVtcGxhdGUtYXJlYXM6J25hbWUgbmFtZSBuYW1lIGRlbCcgJ3F0eSB1bml0IHByaWNlIHN1bSc7CiAgICBnYXA6NXB4O3BhZGRpbmc6OHB4O21hcmdpbi1ib3R0b206OHB4OwogICAgYm9yZGVyOjFweCBz',
  'b2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXItc20pO2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7CiAgfQogIC5saW5lLXJvdyAuaW5wOm50aC1vZi10eXBlKDEpe2dyaWQtYXJlYTpuYW1lfQogIC5saW5lLXJvdyAuaW5wOm50aC1vZi10eXBl',
  'KDIpe2dyaWQtYXJlYTpxdHk7dGV4dC1hbGlnbjpjZW50ZXJ9CiAgLmxpbmUtcm93IC5pbnA6bnRoLW9mLXR5cGUoMyl7Z3JpZC1hcmVhOnVuaXR9CiAgLmxpbmUtcm93IC5pbnA6bnRoLW9mLXR5cGUoNCl7Z3JpZC1hcmVhOnByaWNlfQogIC5saW5lLXJvdyAubGlu',
  'ZS1zdW17Z3JpZC1hcmVhOnN1bTthbGlnbi1zZWxmOmNlbnRlcjtmb250LXNpemU6MTIuNXB4fQogIC5saW5lLXJvdyAuYnRue2dyaWQtYXJlYTpkZWw7YWxpZ24tc2VsZjpzdGFydDtqdXN0aWZ5LXNlbGY6ZW5kO3dpZHRoOjM0cHg7cGFkZGluZzo2cHggMH0KICAu',
  'bGluZS1yb3cgLmlucHtwYWRkaW5nOjZweCA3cHg7Zm9udC1zaXplOjEyLjVweH0KICAubGluZS10b3RhbHt3aWR0aDoxMDAlO21hcmdpbjo2cHggMCAwO3RleHQtYWxpZ246cmlnaHR9Cn0KCi8qID09PT09PT09PT09PSDguJXguLHguKfguJrguK3guIHguKrguJbg',
  'uLLguJnguLDguIHguLLguKPguIvguLTguIfguIHguYwgKOC4oeC4uOC4oeC4guC4p+C4suC4muC4mSkgPT09PT09PT09PT09CiAgIOC5gOC4h+C4teC4ouC4muC5gOC4oeC4t+C5iOC4reC4l+C4uOC4geC4reC4ouC5iOC4suC4h+C4m+C4geC4leC4tCDguIrguLHg',
  'uJTguYDguIjguJnguYDguKHguLfguYjguK3guKHguLXguK3guLDguYTguKPguJXguYnguK3guIfguIjguLHguJTguIHguLLguKMKICAg4LiV4Lix4Lin4LiX4Li14LmI4LiB4LiU4LmE4LiU4LmJ4LiI4Liw4Lii4LiB4LiC4Li24LmJ4LiZ4LmA4Lil4LmH4LiB4LiZ',
  '4LmJ4Lit4Lii4LiV4Lit4LiZ4LmA4Lit4Liy4LmA4Lih4Liy4Liq4LmM4LiK4Li14LmJIOC5g+C4q+C5ieC4o+C4ueC5ieC4p+C5iOC4suC4geC4lOC5hOC4lOC5iQotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0t',
  'LSAqLwouc3luYy1waWxsewogIHRyYW5zaXRpb246YmFja2dyb3VuZCAuMTVzLGNvbG9yIC4xNXM7CiAgd2hpdGUtc3BhY2U6bm93cmFwO2xpbmUtaGVpZ2h0OjEuNzsKfQouc3luYy1waWxsIC5zcGlue3dpZHRoOjExcHg7aGVpZ2h0OjExcHg7Ym9yZGVyLXdpZHRo',
  'OjJweDt2ZXJ0aWNhbC1hbGlnbjotMXB4fQpidXR0b24uc3luYy1waWxse3BhZGRpbmc6MnB4IDEwcHh9CmJ1dHRvbi5zeW5jLXBpbGw6aG92ZXJ7ZmlsdGVyOmJyaWdodG5lc3MoLjk0KX0KYnV0dG9uLnN5bmMtcGlsbDphY3RpdmV7dHJhbnNmb3JtOnRyYW5zbGF0',
  'ZVkoMXB4KX0KLyog4Liq4LiW4Liy4LiZ4Liw4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LmD4Lir4LmJ4Lic4Li54LmJ4LmD4LiK4LmJ4LiI4Lix4LiU4LiB4Liy4LijIOC4geC4sOC4nuC4o+C4tOC4muC5gOC4muC4siDguYYg4LmD4Lir4LmJ4Liq4Lix4LiH4LmA4LiB',
  '4LiV4LmA4Lir4LmH4LiZIOC5geC4leC5iOC5hOC4oeC5iOC4o+C4muC4geC4p+C4meC4quC4suC4ouC4leC4siAqLwouc3luYy1waWxsLndhcm4sLnN5bmMtcGlsbC5kZ3J7YW5pbWF0aW9uOnN5bmNOdWRnZSAyLjRzIGVhc2UtaW4tb3V0IGluZmluaXRlfQpAa2V5',
  'ZnJhbWVzIHN5bmNOdWRnZXswJSw4OCUsMTAwJXtvcGFjaXR5OjF9OTQle29wYWNpdHk6LjU1fX0KQG1lZGlhIChwcmVmZXJzLXJlZHVjZWQtbW90aW9uOnJlZHVjZSl7CiAgLnN5bmMtcGlsbC53YXJuLC5zeW5jLXBpbGwuZGdye2FuaW1hdGlvbjpub25lfQp9CkBt',
  'ZWRpYSAobWF4LXdpZHRoOjcyMHB4KXsKICAvKiDguIjguK3guYHguITguJo6IOC5gOC4q+C4peC4t+C4reC5geC4leC5iOC5hOC4reC4hOC4reC4meC4q+C4o+C4t+C4reC4p+C4h+C4q+C4oeC4uOC4mSDguJvguKPguLDguKvguKLguLHguJTguJfguLXguYjguJrg',
  'uJnguYHguJbguJrguKvguLHguKcKICAgICDguILguYnguK3guITguKfguLLguKHguKLguLHguIfguK3guYjguLLguJnguYTguJTguYnguIjguLLguIHguIHguLLguKPguYHguJXguLDguITguYnguLLguIcgKHRpdGxlKSAqLwogIC5zeW5jLXBpbGwgLnN5bmMtbGFi',
  'ZWx7ZGlzcGxheTpub25lfQogIC5zeW5jLXBpbGx7cGFkZGluZzozcHggOHB4O2ZvbnQtc2l6ZToxM3B4fQp9CgovKiA9PT09PT09PT09PT0g4LiB4Lij4Liw4LiU4Li04LmI4LiH4LmB4LiI4LmJ4LiH4LmA4LiV4Li34Lit4LiZICsg4LiB4Lil4LmI4Lit4LiH4Lij',
  '4Liy4Lii4LiB4Liy4LijID09PT09PT09PT09PSAqLwouYmVsbC13cmFwe3Bvc2l0aW9uOnJlbGF0aXZlO2Rpc3BsYXk6aW5saW5lLWZsZXh9Ci5idG4uYmVsbHtwb3NpdGlvbjpyZWxhdGl2ZTtmb250LXNpemU6MTVweDtsaW5lLWhlaWdodDoxfQouYmVsbC1kb3R7',
  'CiAgcG9zaXRpb246YWJzb2x1dGU7dG9wOi01cHg7cmlnaHQ6LTVweDttaW4td2lkdGg6MTdweDtoZWlnaHQ6MTdweDtwYWRkaW5nOjAgNHB4OwogIGJhY2tncm91bmQ6dmFyKC0td2Fybik7Y29sb3I6I2ZmZjtib3JkZXItcmFkaXVzOjk5cHg7CiAgZm9udC1zaXpl',
  'OjEwLjVweDtmb250LXdlaWdodDo3MDA7bGluZS1oZWlnaHQ6MTdweDt0ZXh0LWFsaWduOmNlbnRlcjsKICBib3gtc2hhZG93OjAgMCAwIDJweCB2YXIoLS1zdXJmYWNlKTtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7Cn0KLmJlbGwtZG90LnVyZ2Vu',
  'dHtiYWNrZ3JvdW5kOnZhcigtLWRhbmdlcil9Cgoubm90aWZ7CiAgcG9zaXRpb246YWJzb2x1dGU7dG9wOmNhbGMoMTAwJSArIDhweCk7cmlnaHQ6MDt6LWluZGV4OjcwOwogIHdpZHRoOm1pbigzODBweCxjYWxjKDEwMHZ3IC0gMzJweCkpOwogIGJhY2tncm91bmQ6',
  'dmFyKC0tc3VyZmFjZSk7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXIpOwogIGJveC1zaGFkb3c6dmFyKC0tc2gtbGcpO292ZXJmbG93OmhpZGRlbjthbmltYXRpb246cG9wIC4xNHMgZWFzZS1vdXQ7Cn0KLm5vdGlmLWh7',
  'CiAgZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6OHB4O3BhZGRpbmc6MTFweCAxNHB4OwogIGJvcmRlci1ib3R0b206MXB4IHNvbGlkIHZhcigtLWxpbmUtMik7Zm9udC1zaXplOjE0cHg7Cn0KLm5vdGlmLWggLnNwe21hcmdpbi1sZWZ0OmF1dG87',
  'ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6N3B4fQoubm90aWYtbGlzdHttYXgtaGVpZ2h0Om1pbig2MHZoLDQ0MHB4KTtvdmVyZmxvdy15OmF1dG99Ci5ub3RpZi1zZWN7CiAgcGFkZGluZzo5cHggMTRweCA0cHg7Zm9udC1zaXplOjExLjVweDtm',
  'b250LXdlaWdodDo2MDA7Y29sb3I6dmFyKC0tbXV0ZWQpOwogIGJhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKTtwb3NpdGlvbjpzdGlja3k7dG9wOjA7Cn0KLm5vdGlmLWl0ZW17CiAgZGlzcGxheTpibG9jazt3aWR0aDoxMDAlO3RleHQtYWxpZ246bGVmdDtiYWNr',
  'Z3JvdW5kOjA7Ym9yZGVyOjA7Y3Vyc29yOnBvaW50ZXI7CiAgcGFkZGluZzo5cHggMTRweCA5cHggMTdweDtib3JkZXItbGVmdDozcHggc29saWQgdHJhbnNwYXJlbnQ7Zm9udDppbmhlcml0O2NvbG9yOmluaGVyaXQ7CiAgYm9yZGVyLWJvdHRvbToxcHggc29saWQg',
  'dmFyKC0tbGluZS0yKTsKfQoubm90aWYtaXRlbTpob3ZlcntiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMil9Ci5ub3RpZi1pdGVtIC50dHtmb250LXNpemU6MTNweDtmb250LXdlaWdodDo1MDA7Y29sb3I6dmFyKC0taW5rKTtsaW5lLWhlaWdodDoxLjQ1fQoubm90',
  'aWYtaXRlbSAuZGR7Zm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1tdXRlZCk7bWFyZ2luLXRvcDoycHg7bGluZS1oZWlnaHQ6MS41fQoubm90aWYtaXRlbS5sLWRhbmdlcntib3JkZXItbGVmdC1jb2xvcjp2YXIoLS1kYW5nZXIpfQoubm90aWYtaXRlbS5sLXdh',
  'cm57Ym9yZGVyLWxlZnQtY29sb3I6dmFyKC0td2Fybil9Ci5ub3RpZi1pdGVtLmwtaW5mb3tib3JkZXItbGVmdC1jb2xvcjp2YXIoLS1pbmZvKX0KLm5vdGlmLW1vcmV7CiAgZGlzcGxheTpibG9jazt3aWR0aDoxMDAlO3RleHQtYWxpZ246bGVmdDtwYWRkaW5nOjdw',
  'eCAxNHB4IDlweCAxN3B4OwogIGJhY2tncm91bmQ6MDtib3JkZXI6MDtjdXJzb3I6cG9pbnRlcjtmb250OmluaGVyaXQ7Zm9udC1zaXplOjEycHg7Y29sb3I6dmFyKC0tYnJhbmQpOwogIGJvcmRlci1ib3R0b206MXB4IHNvbGlkIHZhcigtLWxpbmUtMik7Cn0KLm5v',
  'dGlmLW1vcmU6aG92ZXJ7dGV4dC1kZWNvcmF0aW9uOnVuZGVybGluZX0KLm5vdGlmLWVtcHR5e3BhZGRpbmc6MjZweCAxNnB4O3RleHQtYWxpZ246Y2VudGVyO2NvbG9yOnZhcigtLW11dGVkKTtmb250LXNpemU6MTMuNXB4O2xpbmUtaGVpZ2h0OjEuN30KLm5vdGlm',
  'LWVtcHR5IC5iaWd7Zm9udC1zaXplOjMwcHg7bWFyZ2luLWJvdHRvbTo2cHh9Ci5ub3RpZi1mewogIHBhZGRpbmc6OXB4IDE0cHg7Ym9yZGVyLXRvcDoxcHggc29saWQgdmFyKC0tbGluZS0yKTsKICBmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLWZhaW50KTti',
  'YWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Cn0KCi8qIOC4leC4seC4p+C5gOC4peC4guC4muC4meC5gOC4oeC4meC4ueC4i+C5ieC4suC4oiDigJQg4LmD4Lir4LmJ4LmA4LiU4LmI4LiZ4LiC4Li24LmJ4LiZ4LmA4Lih4Li34LmI4Lit4Lih4Li14LiH4Liy4LiZ',
  '4LiE4LmJ4Liy4LiHICovCi5uYXYtaXRlbSAuYmFkZ2V7CiAgYmFja2dyb3VuZDp2YXIoLS13YXJuKTtjb2xvcjojZmZmO2ZvbnQtd2VpZ2h0OjcwMDtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7Cn0KLm5hdi1pdGVtLm9uIC5iYWRnZXtiYWNrZ3Jv',
  'dW5kOnJnYmEoMjU1LDI1NSwyNTUsLjI4KTtjb2xvcjojZmZmfQovKiDguYDguKvguYfguJnguYHguKXguYnguKc6IOC4ouC4seC4h+C4muC4reC4geC4iOC4s+C4meC4p+C4meC4h+C4suC4meC4hOC5ieC4suC4hyDguYHguJXguYjguIjguLLguIfguKXguIcg4LmE',
  '4Lih4LmI4LmA4Lij4Li14Lii4LiB4Lij4LmJ4Lit4LiH4LiE4Lin4Liy4Lih4Liq4LiZ4LmD4LiI4LmA4LiX4LmI4Liy4LmA4Lij4Li34LmI4Lit4LiH4LmD4Lir4Lih4LmIICovCi5uYXYtaXRlbSAuYmFkZ2Uuc2VlbntiYWNrZ3JvdW5kOnJnYmEoMjU1LDI1NSwy',
  'NTUsLjEyKTtjb2xvcjp2YXIoLS1uYXYtaW5rKTtmb250LXdlaWdodDo2MDB9Ci5uYXYtaXRlbS5vbiAuYmFkZ2Uuc2VlbntiYWNrZ3JvdW5kOnJnYmEoMjU1LDI1NSwyNTUsLjIpO2NvbG9yOiNmZmZ9Ci50YWIgLmJhZGdlLnNlZW57YmFja2dyb3VuZDp2YXIoLS1s',
  'aW5lKTtjb2xvcjp2YXIoLS1tdXRlZCl9Ci8qIOC4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC5gOC4nuC4tOC5iOC4h+C5gOC4guC5ieC4suC4oeC4suC4leC4seC5ieC4h+C5geC4leC5iOC5gOC4m+C4tOC4lOC4lOC4ueC4hOC4o+C4seC5ieC4h+C4geC5iOC4',
  'reC4mSAqLwoubm90aWYtaXRlbS5pcy1uZXd7YmFja2dyb3VuZDp2YXIoLS1icmFuZC1zb2Z0KX0KLm5vdGlmLWl0ZW0uaXMtbmV3OmhvdmVye2JhY2tncm91bmQ6dmFyKC0tYnJhbmQtc29mdCk7ZmlsdGVyOmJyaWdodG5lc3MoLjk4KX0KLm5ldy1kb3R7ZGlzcGxh',
  'eTppbmxpbmUtYmxvY2s7d2lkdGg6N3B4O2hlaWdodDo3cHg7Ym9yZGVyLXJhZGl1czo5OXB4O2JhY2tncm91bmQ6dmFyKC0tYnJhbmQpO21hcmdpbi1yaWdodDo2cHg7dmVydGljYWwtYWxpZ246MXB4fQoKQG1lZGlhIChtYXgtd2lkdGg6NzIwcHgpewogIC5ub3Rp',
  'ZnsKICAgIHBvc2l0aW9uOmZpeGVkO3RvcDphdXRvO2xlZnQ6OHB4O3JpZ2h0OjhweDtib3R0b206OHB4O3dpZHRoOmF1dG87CiAgICBtYXgtaGVpZ2h0Ojcydmg7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjsKICB9CiAgLm5vdGlmLWxpc3R7Zmxl',
  'eDoxO21heC1oZWlnaHQ6bm9uZX0KfQoKLyogPT09PT09PT09PT09IOC5gOC4iuC5h+C4hOC4peC4tOC4quC4leC5jOC4h+C4suC4meC4i+C5iOC4reC4oSA9PT09PT09PT09PT0gKi8KLyogLS0tLSDguYPguJnguJ/guK3guKPguYzguKEgLS0tLSAqLwoudG9kb3ti',
  'b3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6dmFyKC0tci1zbSk7cGFkZGluZzoxMHB4O2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKX0KLnRvZG8tcm93ewogIGRpc3BsYXk6Z3JpZDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6MzBweCBt',
  'aW5tYXgoMCwxZnIpIDE5MHB4IDM0cHg7CiAgZ2FwOjdweDthbGlnbi1pdGVtczpjZW50ZXI7bWFyZ2luLWJvdHRvbTo2cHg7Cn0KLnRvZG8tcm93IC5pbnAsLnRvZG8tcm93IC5zZWx7cGFkZGluZzo2cHggOXB4O2ZvbnQtc2l6ZToxM3B4fQoudG9kby1yb3cuZG9u',
  'ZSAuaW5we3RleHQtZGVjb3JhdGlvbjpsaW5lLXRocm91Z2g7Y29sb3I6dmFyKC0tbXV0ZWQpfQoudG9kby1jaGVja3tkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpjZW50ZXI7Y3Vyc29yOnBvaW50ZXJ9Ci50b2RvLWNoZWNr',
  'IGlucHV0e3dpZHRoOjE3cHg7aGVpZ2h0OjE3cHg7Y3Vyc29yOnBvaW50ZXI7YWNjZW50LWNvbG9yOnZhcigtLW9rKX0KLnRvZG8tY291bnR7bWFyZ2luLWxlZnQ6YXV0bztmb250LXNpemU6MTNweDtjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC12YXJpYW50LW51bWVy',
  'aWM6dGFidWxhci1udW1zfQoudG9kby1jb3VudCBie2NvbG9yOnZhcigtLWluayl9CgovKiAtLS0tIOC5g+C4meC4leC4suC4o+C4suC4h+C4o+C4suC4ouC4geC4suC4oyAo4LiV4Li04LmK4LiB4LmE4LiU4LmJ4LiI4Lij4Li04LiHKSAtLS0tICovCi50b2RvLXZp',
  'ZXd7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtnYXA6MnB4fQoudG9kby1iYXJ7aGVpZ2h0OjVweDtib3JkZXItcmFkaXVzOjk5cHg7YmFja2dyb3VuZDp2YXIoLS1saW5lLTIpO292ZXJmbG93OmhpZGRlbjttYXJnaW4tYm90dG9tOjJweH0KLnRv',
  'ZG8tYmFyPml7ZGlzcGxheTpibG9jaztoZWlnaHQ6MTAwJTtib3JkZXItcmFkaXVzOjk5cHg7YmFja2dyb3VuZDp2YXIoLS1vayk7dHJhbnNpdGlvbjp3aWR0aCAuMzVzIGVhc2V9Ci50b2RvLW1ldGF7Zm9udC1zaXplOjExcHg7Y29sb3I6dmFyKC0tbXV0ZWQpO2Zv',
  'bnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtczttYXJnaW4tYm90dG9tOjNweH0KLnRvZG8tbWV0YSBie2NvbG9yOnZhcigtLWluayl9Ci50b2RvLWxpbmV7CiAgZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmZsZXgtc3RhcnQ7Z2FwOjdweDtmb250LXNpemU6',
  'MTNweDtsaW5lLWhlaWdodDoxLjU7CiAgcGFkZGluZzoycHggMDtjdXJzb3I6cG9pbnRlcjsKfQoudG9kby1saW5lIGlucHV0e21hcmdpbi10b3A6MnB4O3dpZHRoOjE1cHg7aGVpZ2h0OjE1cHg7ZmxleDpub25lO2N1cnNvcjpwb2ludGVyO2FjY2VudC1jb2xvcjp2',
  'YXIoLS1vayl9Ci50b2RvLWxpbmUgLm5te2ZsZXg6MTttaW4td2lkdGg6MDtjb2xvcjp2YXIoLS1pbmspfQoudG9kby1saW5lIC5jYXR7ZmxleDpub25lO2ZvbnQtc2l6ZToxMC41cHg7cGFkZGluZzoxcHggN3B4fQoudG9kby1saW5lLmRvbmUgLm5te3RleHQtZGVj',
  'b3JhdGlvbjpsaW5lLXRocm91Z2g7Y29sb3I6dmFyKC0tZmFpbnQpfQoudG9kby1saW5lLmxvY2tlZHtjdXJzb3I6ZGVmYXVsdH0KLnRvZG8tbGluZTpub3QoLmxvY2tlZCk6aG92ZXIgLm5te2NvbG9yOnZhcigtLWJyYW5kKX0KCkBtZWRpYSAobWF4LXdpZHRoOjY0',
  'MHB4KXsKICAudG9kby1yb3d7CiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6MzBweCBtaW5tYXgoMCwxZnIpIDM0cHg7CiAgICBncmlkLXRlbXBsYXRlLWFyZWFzOidjaGsgbmFtZSBkZWwnICcuIGNhdCBjYXQnOwogICAgcGFkZGluZzo4cHg7Ym9yZGVyOjFweCBz',
  'b2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXItc20pOwogICAgYmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlKTttYXJnaW4tYm90dG9tOjhweDsKICB9CiAgLnRvZG8tY2hlY2t7Z3JpZC1hcmVhOmNoazthbGlnbi1zZWxmOnN0YXJ0O3BhZGRpbmct',
  'dG9wOjVweH0KICAudG9kby1yb3cgLmlucHtncmlkLWFyZWE6bmFtZX0KICAudG9kby1yb3cgLnNlbHtncmlkLWFyZWE6Y2F0O3dpZHRoOjEwMCV9CiAgLnRvZG8tcm93IC5idG57Z3JpZC1hcmVhOmRlbDthbGlnbi1zZWxmOnN0YXJ0O2p1c3RpZnktc2VsZjplbmQ7',
  'd2lkdGg6MzRweDtwYWRkaW5nOjZweCAwfQogIC50b2RvLWNvdW50e3dpZHRoOjEwMCU7bWFyZ2luOjZweCAwIDA7dGV4dC1hbGlnbjpyaWdodH0KfQoKCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PQogICDguIjguK3guYHguITguJogKOC4oeC4t+C4reC4luC4t+C4rSAvIOC5geC4l+C5h+C4muC5gOC4peC5h+C4leC5geC4meC4p+C4leC4seC5ieC4hykKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09CiAgIOC5hOC4oeC5iOC5hOC4lOC5ieC5geC4ouC4geC5hOC4n+C4peC5jOC4q+C4o+C4t+C4reC5geC4ouC4geC5gOC4l+C4oeC5gOC4nuC4peC4leC4quC4s+C4q+C4o+C4seC4muC4oeC4t+C4reC4luC4t+C4rSDigJQgSFRNTCDguIrg',
  'uLjguJTguYDguJTguLXguKLguKfguIHguLHguJnguJfguLHguYnguIfguKvguKHguJQKICAg4LiV4Lij4LiH4LiZ4Li14LmJ4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LmB4LiE4LmIICLguKfguLLguIfguJXguKPguIfguYTguKvguJkiIOC4guC5ieC4reC4oeC4ueC4',
  'pSDguJvguLjguYjguKEg4LiV4Lij4Lij4LiB4LiwIOC5g+C4iuC5ieC4o+C5iOC4p+C4oeC4geC4seC4meC4q+C4oeC4lAogICDguKLguYjguK0t4LiC4Lii4Liy4Lii4Lir4LiZ4LmJ4Liy4LiV4LmI4Liy4LiH4Lia4LiZ4LiE4Lit4Lih4LiB4LmH4Liq4Lil4Lix',
  '4Lia4LmE4LiU4LmJ4LiX4Lix4LiZ4LiX4Li1IOC5geC4peC4sOC5gOC4nuC4tOC5iOC4oeC4n+C4teC5gOC4iOC4reC4o+C5jOC4hOC4o+C4seC5ieC4h+C5gOC4lOC4teC4ouC4p+C5hOC4lOC5ieC4l+C4seC5ieC4h+C4quC4reC4h+C5geC4muC4mgotLS0tLS0t',
  'LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi8KQG1lZGlhIChtYXgtd2lkdGg6NzYwcHgpewoKICAvKiAtLS0tIOC5geC4luC4muC4peC5iOC4suC4hzog4Lib4Li44LmI4Lih4Lit4Lii4Li54LmI4Lij',
  '4Liw4LiU4Lix4Lia4LiZ4Li04LmJ4Lin4LmC4Lib4LmJ4LiHIOC5hOC4oeC5iOC4leC5ieC4reC4h+C5gOC4reC4t+C5ieC4reC4oeC5hOC4m+C4oeC4uOC4oeC4i+C5ieC4suC4ouC4muC4mSAtLS0tICovCiAgLnRhYmJhcnsKICAgIGRpc3BsYXk6ZmxleDtwb3Np',
  'dGlvbjpmaXhlZDtsZWZ0OjA7cmlnaHQ6MDtib3R0b206MDt6LWluZGV4OjUwOwogICAgYmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlKTtib3JkZXItdG9wOjFweCBzb2xpZCB2YXIoLS1saW5lKTsKICAgIHBhZGRpbmctYm90dG9tOmVudihzYWZlLWFyZWEtaW5zZXQt',
  'Ym90dG9tKTsKICAgIGJveC1zaGFkb3c6MCAtMnB4IDE0cHggcmdiYSgxNSwyMyw0MSwuMDcpOwogIH0KICAudGFiewogICAgZmxleDoxIDEgMDttaW4td2lkdGg6MDttaW4taGVpZ2h0OjU0cHg7cGFkZGluZzo3cHggMnB4IDZweDsKICAgIGRpc3BsYXk6ZmxleDtm',
  'bGV4LWRpcmVjdGlvbjpjb2x1bW47YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpjZW50ZXI7Z2FwOjNweDsKICAgIGJvcmRlcjowO2JhY2tncm91bmQ6MDtjdXJzb3I6cG9pbnRlcjtjb2xvcjp2YXIoLS1tdXRlZCk7CiAgICBmb250LXNpemU6MTAu',
  'NXB4O2xpbmUtaGVpZ2h0OjEuMjtwb3NpdGlvbjpyZWxhdGl2ZTsKICB9CiAgLnRhYiAuaWN7Zm9udC1zaXplOjE4cHg7bGluZS1oZWlnaHQ6MX0KICAudGFiIC50bHttYXgtd2lkdGg6MTAwJTtvdmVyZmxvdzpoaWRkZW47dGV4dC1vdmVyZmxvdzplbGxpcHNpczt3',
  'aGl0ZS1zcGFjZTpub3dyYXB9CiAgLnRhYi5vbntjb2xvcjp2YXIoLS1icmFuZCk7Zm9udC13ZWlnaHQ6NzAwfQogIC50YWIub24gLmlje3RyYW5zZm9ybTp0cmFuc2xhdGVZKC0xcHgpfQogIC50YWIgLmJhZGdlewogICAgcG9zaXRpb246YWJzb2x1dGU7dG9wOjNw',
  'eDtsZWZ0OjUwJTttYXJnaW4tbGVmdDozcHg7CiAgICBiYWNrZ3JvdW5kOnZhcigtLXdhcm4pO2NvbG9yOiNmZmY7Ym9yZGVyLXJhZGl1czo5OXB4OwogICAgbWluLXdpZHRoOjE2cHg7aGVpZ2h0OjE2cHg7cGFkZGluZzowIDRweDsKICAgIGZvbnQtc2l6ZToxMHB4',
  'O2xpbmUtaGVpZ2h0OjE2cHg7Zm9udC13ZWlnaHQ6NzAwO3RleHQtYWxpZ246Y2VudGVyOwogICAgYm94LXNoYWRvdzowIDAgMCAycHggdmFyKC0tc3VyZmFjZSk7CiAgfQogIC8qIOC5gOC4p+C5ieC4meC4l+C4teC5iOC5g+C4q+C5ieC5geC4luC4muC4peC5iOC4',
  'suC4hyDguYTguKHguYjguYPguKvguYnguJfguLHguJrguYDguJnguLfguYnguK3guKvguLLguJrguKPguKPguJfguLHguJTguKrguLjguJTguJfguYnguLLguKIgKi8KICAuY29udGVudHtwYWRkaW5nOjE0cHggMTRweCBjYWxjKDc0cHggKyBlbnYoc2FmZS1hcmVh',
  'LWluc2V0LWJvdHRvbSkpfQogIC50YWJiYXIgfiAub3YsLm5hdnt6LWluZGV4OjYwfQoKICAvKiAtLS0tIOC5geC4luC4muC4q+C4seC4pzog4Lia4Li14Lia4LmD4Lir4LmJ4LmA4Lir4Lil4Li34Lit4LmB4LiW4Lin4LmA4LiU4Li14Lii4Lin4LmA4LiX4LmI4Liy',
  '4LiX4Li14LmI4LmE4Lir4LinIC0tLS0gKi8KICAudG9we3BhZGRpbmc6NnB4IDEwcHg7Z2FwOjdweDtyb3ctZ2FwOjZweH0KICAudG9wIGgxe2ZvbnQtc2l6ZToxNS41cHh9CiAgLnRvcCAuc3Vie2Rpc3BsYXk6bm9uZX0gICAgICAgICAgLyog4LiE4Liz4Lit4LiY',
  '4Li04Lia4Liy4Lii4Lir4LiZ4LmJ4Liy4LmE4Lib4Lit4Lii4Li54LmI4LmD4LiZ4LmA4Lih4LiZ4Li54LiC4LmJ4Liy4LiH4LmB4Lil4LmJ4LinIOC5hOC4oeC5iOC4leC5ieC4reC4h+C4i+C5ieC4syAqLwogIC50b3AtcmlnaHR7Z2FwOjZweDt3aWR0aDoxMDAl',
  'O21hcmdpbi1sZWZ0OjB9CiAgLnRvcC1yaWdodCAjc2VhcmNoQm94e2ZsZXg6MSAxIDExMHB4O3dpZHRoOmF1dG8haW1wb3J0YW50O21pbi13aWR0aDowfQogIC50b3AtcmlnaHQgI3llYXJTZWx7ZmxleDowIDEgYXV0bzttYXgtd2lkdGg6NDJ2d30KICAuYnVyZ2Vy',
  'e3BhZGRpbmc6N3B4IDEwcHh9CiAgLyog4LiK4LmI4Lit4LiH4LiB4Lij4Lit4LiB4Lia4LiZ4LmB4LiW4Lia4Lir4Lix4Lin4LmA4LiV4Li14LmJ4Lii4Lil4LiHIOC5geC4leC5iOC4ouC4seC4h+C4hOC4hyAxNnB4IOC4geC4seC4mSBpT1Mg4LiL4Li54Lih4LmA',
  '4Lit4LiHICovCiAgLnRvcCAuaW5wLC50b3AgLnNlbHtwYWRkaW5nOjZweCAxMHB4fQogIC50b3AgLmJ0bi5pY29ue3BhZGRpbmc6NnB4IDlweH0KCiAgLyogLS0tLSDguJXguLHguKfguYDguKXguILguKrguKPguLjguJs6IDIg4LiK4LmI4Lit4LiH4LiV4LmI4Lit',
  '4LmB4LiW4LinIOC5hOC4oeC5iOC5g+C4iuC5iOC4iuC5iOC4reC4h+C5gOC4lOC4teC4ouC4p+C4iOC4meC4geC4tOC4meC4l+C4seC5ieC4h+C4iOC4rSAtLS0tICovCiAgLmc0LC5nM3tncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDIsbWlubWF4KDAsMWZy',
  'KSl9CiAgLmcye2dyaWQtdGVtcGxhdGUtY29sdW1uczoxZnJ9CiAgLmtwaXtwYWRkaW5nOjExcHggMTJweH0KICAua3BpIC52e2ZvbnQtc2l6ZToxOXB4fQogIC5rcGkgLmx7Zm9udC1zaXplOjExcHh9CiAgLmtwaSAuc3tmb250LXNpemU6MTAuNXB4fQoKICAvKiAt',
  'LS0tIOC4leC4suC4o+C4suC4hyAtPiDguIHguLLguKPguYzguJTguJfguLXguKXguLDguKPguLLguKLguIHguLLguKMgLS0tLQogICAgIOC4iuC4t+C5iOC4reC4hOC4reC4peC4seC4oeC4meC5jOC4oeC4suC4iOC4suC4gSBkYXRhLWxhYmVsIOC4l+C4teC5iCBs',
  'YWJlbENlbGxzKCkg4LiV4Li04LiU4LmE4Lin4LmJ4LmD4Lir4LmJ4Lir4Lil4Lix4LiH4Lin4Liy4LiU4Lir4LiZ4LmJ4LiyCiAgICAg4LiI4Li24LiH4LmD4LiK4LmJ4LmE4LiU4LmJ4LiB4Lix4Lia4LiX4Li44LiB4LiV4Liy4Lij4Liy4LiH4LmD4LiZ4Lij4Liw',
  '4Lia4Lia4LmC4LiU4Lii4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LmB4LiB4LmJ4LiV4Liy4Lij4Liy4LiH4LiX4Li14Lil4Liw4Lit4Lix4LiZICovCiAgLnR3e292ZXJmbG93LXg6dmlzaWJsZX0KICAudHttaW4td2lkdGg6MCFpbXBvcnRhbnQ7ZGlzcGxheTpibG9j',
  'azt3aWR0aDoxMDAlO2JvcmRlcjowfQogIC50IHRoZWFke2Rpc3BsYXk6bm9uZX0KICAudCB0Ym9keXtkaXNwbGF5OmJsb2NrfQogIC50IHRib2R5IHRyewogICAgZGlzcGxheTpibG9jaztiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpO2JvcmRlcjoxcHggc29saWQg',
  'dmFyKC0tbGluZSk7CiAgICBib3JkZXItcmFkaXVzOnZhcigtLXItc20pO3BhZGRpbmc6OXB4IDEycHg7bWFyZ2luLWJvdHRvbTo4cHg7CiAgfQogIC50IHRib2R5IHRyOmxhc3QtY2hpbGR7bWFyZ2luLWJvdHRvbTowfQogIC50IHRib2R5IHRkewogICAgZGlzcGxh',
  'eTpmbGV4O2dhcDoxMHB4O2FsaWduLWl0ZW1zOmJhc2VsaW5lOwogICAgcGFkZGluZzozcHggMDtib3JkZXI6MDt0ZXh0LWFsaWduOmxlZnQhaW1wb3J0YW50O3doaXRlLXNwYWNlOm5vcm1hbDsKICB9CiAgLnQgdGJvZHkgdGQ6ZW1wdHksLnQgdGJvZHkgdGQuY2Vs',
  'bC1lbXB0eXtkaXNwbGF5Om5vbmV9CiAgLnQgdGJvZHkgdGRbZGF0YS1sYWJlbF06OmJlZm9yZXsKICAgIGNvbnRlbnQ6YXR0cihkYXRhLWxhYmVsKTtmbGV4OjAgMCAzNiU7bWluLXdpZHRoOjA7CiAgICBjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC1zaXplOjExLjVw',
  'eDtmb250LXdlaWdodDo1MDA7CiAgfQogIC50IHRib2R5IHRkLm51bXtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydH0KICAudCB0Ym9keSB0ZC5jZWxsLWFjdGlvbnN7CiAgICBqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1lbmQ7Z2FwOjZweDtwYWRkaW5nLXRvcDo5cHg7',
  'bWFyZ2luLXRvcDo2cHg7CiAgICBib3JkZXItdG9wOjFweCBzb2xpZCB2YXIoLS1saW5lLTIpOwogIH0KICAudCB0Ym9keSB0ci5yb3ctd2lkZSB0ZHtkaXNwbGF5OmJsb2NrO3RleHQtYWxpZ246Y2VudGVyIWltcG9ydGFudH0KICAudCB0Ym9keSB0ci5yb3ctd2lk',
  'ZSB0ZDo6YmVmb3Jle2NvbnRlbnQ6bm9uZX0KCiAgLyogLS0tLSDguJvguLjguYjguKHguJXguYnguK3guIfguIHguJTguYLguJTguJnguJTguYnguKfguKLguJnguLTguYnguKcgLS0tLSAqLwogIC5idG57cGFkZGluZzo5cHggMTRweH0KICAuYnRuLnNte3BhZGRp',
  'bmc6N3B4IDExcHg7Zm9udC1zaXplOjEzcHh9CiAgLmJ0bi5pY29ue3BhZGRpbmc6OHB4IDEwcHh9CiAgLmNoaXB7cGFkZGluZzo3cHggMTRweH0KICAuc2VsLC5pbnB7cGFkZGluZzo5cHggMTFweDtmb250LXNpemU6MTZweH0gICAvKiAxNnB4IOC4geC4seC4mSBp',
  'T1Mg4LiL4Li54Lih4LmA4Lit4LiH4LiV4Lit4LiZ4LmB4LiV4Liw4LiK4LmI4Lit4LiH4LiB4Lij4Lit4LiBICovCiAgLnQgLmJ0bi5pY29ue3BhZGRpbmc6N3B4IDEwcHh9CgogIC8qIC0tLS0g4LiB4Lij4Liy4LifOiDguYPguKvguYnguYDguJXguLXguYnguKLg',
  'uKXguIfguKvguJnguYjguK3guKIg4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4LiB4Li04LiZ4LiX4Lix4LmJ4LiH4LiI4LitIC0tLS0gKi8KICAuY2hhcnR7bWluLXdpZHRoOjQ2MHB4fQogIC5jaGFydC13cmFwe292ZXJmbG93LXg6YXV0bzstd2Via2l0LW92ZXJm',
  'bG93LXNjcm9sbGluZzp0b3VjaH0KCiAgLyogLS0tLSDguIHguKXguYjguK3guIfguIvguYnguK3guJk6IOC5gOC4leC5h+C4oeC4iOC4reC5geC4muC4muC5geC4nOC5iOC4meC5gOC4peC4t+C5iOC4reC4meC4guC4tuC5ieC4mSDguJvguLjguYjguKHguJrguLHg',
  'uJnguJfguLbguIHguJXguLTguJTguILguK3guJrguKXguYjguLLguIfguYDguKrguKHguK0gLS0tLSAqLwogIC5tb2RhbC1me3Bvc2l0aW9uOnN0aWNreTtib3R0b206MDtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpOwogICAgcGFkZGluZy1ib3R0b206Y2FsYygx',
  'MnB4ICsgZW52KHNhZmUtYXJlYS1pbnNldC1ib3R0b20pKX0KfQoKLyog4LiI4Lit4LmA4Lil4LmH4LiB4Lih4Liy4LiBICjguYDguITguKPguLfguYjguK3guIfguYDguKXguYfguIEgLyDguKLguYjguK3guKvguJnguYnguLLguJXguYjguLLguIfguYHguITguJrg',
  'uKrguLjguJQpICovCkBtZWRpYSAobWF4LXdpZHRoOjQwMHB4KXsKICAudGFiIC50bHtmb250LXNpemU6OS41cHh9CiAgLmtwaSAudntmb250LXNpemU6MTcuNXB4fQogIC50IHRib2R5IHRkW2RhdGEtbGFiZWxdOjpiZWZvcmV7ZmxleC1iYXNpczo0MiV9Cn0KCkBt',
  'ZWRpYSBwcmludHsKICAubmF2LC50b3AtcmlnaHQsLmJ1cmdlciwudC1hY3Rpb25zLC5idG57ZGlzcGxheTpub25lIWltcG9ydGFudH0KICAuYXBwe2Rpc3BsYXk6YmxvY2t9IGJvZHl7YmFja2dyb3VuZDojZmZmfQogIC5jYXJke2JyZWFrLWluc2lkZTphdm9pZDti',
  'b3gtc2hhZG93Om5vbmV9Cn0KCi8qID09PT09PT09PT09PSDguIrguYjguK3guIfguYDguKXguLfguK3guIHguKrguJbguLLguJnguLDguYPguJnguJXguLLguKPguLLguIcgPT09PT09PT09PT09IC0tLS0tLS0tLS0tLS0tLS0tLS0tCiAgIOC4q+C4meC5ieC4suC4',
  'leC4suC5gOC4q+C4oeC4t+C4reC4meC4m+C5ieC4suC4ouC4quC4luC4suC4meC4sOC5gOC4lOC4tOC4oSDguYHguJXguYjguIHguJTguYDguJvguKXguLXguYjguKLguJnguYTguJTguYnguYDguKXguKLguYTguKHguYjguJXguYnguK3guIfguYDguJvguLTguJTg',
  'uJ/guK3guKPguYzguKEKICAg4LmD4LiK4LmJ4Liq4Li14LiK4Li44LiU4LmA4LiU4Li14Lii4Lin4LiB4Lix4LiaIC5iIOC5gOC4nuC4t+C5iOC4reC5g+C4q+C5ieC4leC4suC4o+C4suC4h+C4reC5iOC4suC4meC5gOC4q+C4oeC4t+C4reC4meC5gOC4lOC4tOC4',
  'oeC4l+C4uOC4geC4m+C4o+C4sOC4geC4suC4owotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqLwouc3Qtc2VsewogIC13ZWJraXQtYXBwZWFyYW5jZTpub25lO2FwcGVhcmFuY2U6bm9u',
  'ZTsKICBib3JkZXI6MXB4IHNvbGlkIHRyYW5zcGFyZW50O2JvcmRlci1yYWRpdXM6OTlweDsKICBwYWRkaW5nOjNweCAyMnB4IDNweCAxMHB4O2ZvbnQtc2l6ZToxMnB4O2ZvbnQtd2VpZ2h0OjYwMDtsaW5lLWhlaWdodDoxLjU7CiAgY3Vyc29yOnBvaW50ZXI7bWF4',
  'LXdpZHRoOjEwMCU7CiAgYmFja2dyb3VuZC1yZXBlYXQ6bm8tcmVwZWF0O2JhY2tncm91bmQtcG9zaXRpb246cmlnaHQgN3B4IGNlbnRlcjtiYWNrZ3JvdW5kLXNpemU6OXB4OwogIGJhY2tncm91bmQtaW1hZ2U6dXJsKCJkYXRhOmltYWdlL3N2Zyt4bWw7Y2hhcnNl',
  'dD11dGY4LCUzQ3N2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAxMCA2JyUzRSUzQ3BhdGggZD0nTTEgMWw0IDQgNC00JyBmaWxsPSdub25lJyBzdHJva2U9JyUyMzY2Nycgc3Ryb2tlLXdpZHRoPScxLjYnIHN0cm9rZS1s',
  'aW5lY2FwPSdyb3VuZCcvJTNFJTNDL3N2ZyUzRSIpOwp9Ci5zdC1zZWw6aG92ZXJ7Ym9yZGVyLWNvbG9yOnZhcigtLWxpbmUpfQouc3Qtc2VsOmZvY3Vze291dGxpbmU6bm9uZTtib3JkZXItY29sb3I6dmFyKC0tYnJhbmQpO2JveC1zaGFkb3c6MCAwIDAgM3B4IHZh',
  'cigtLWJyYW5kLXNvZnQpfQouc3Qtc2VsW2Rpc2FibGVkXXtvcGFjaXR5Oi41NTtjdXJzb3I6cHJvZ3Jlc3N9Ci5zdC1zZWwub2t7YmFja2dyb3VuZC1jb2xvcjp2YXIoLS1vay1zb2Z0KTtjb2xvcjp2YXIoLS1vayl9Ci5zdC1zZWwuaW5mb3tiYWNrZ3JvdW5kLWNv',
  'bG9yOnZhcigtLWluZm8tc29mdCk7Y29sb3I6dmFyKC0taW5mbyl9Ci5zdC1zZWwud2FybntiYWNrZ3JvdW5kLWNvbG9yOnZhcigtLXdhcm4tc29mdCk7Y29sb3I6dmFyKC0td2Fybil9Ci5zdC1zZWwuZGdye2JhY2tncm91bmQtY29sb3I6dmFyKC0tZGFuZ2VyLXNv',
  'ZnQpO2NvbG9yOnZhcigtLWRhbmdlcil9Ci5zdC1zZWwubXV0ZXtiYWNrZ3JvdW5kLWNvbG9yOnZhcigtLXN1cmZhY2UtMik7Y29sb3I6dmFyKC0tbXV0ZWQpfQovKiDguIjguK3guYHguITguJo6IOC4geC4suC4o+C5jOC4lOC4l+C4teC4peC4sOC4o+C4suC4ouC4',
  'geC4suC4oyDguYPguKvguYnguIrguYjguK3guIfguJnguLXguYnguIHguJTguIfguYjguLLguKLguJTguYnguKfguKLguJnguLTguYnguKcgKi8KQG1lZGlhIChtYXgtd2lkdGg6NzYwcHgpewogIC5zdC1zZWx7cGFkZGluZzo3cHggMjZweCA3cHggMTJweDtmb250',
  'LXNpemU6MTNweH0KfQoKLyogPT09PT09PT09PT09IOC4geC4o+C4suC4nyA9PT09PT09PT09PT0gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tCiAgIOC5gOC4quC5ieC4meC4leC4suC4o+C4suC4h+C4geC4seC4muC5geC4geC4meC5gOC4m+C5',
  'h+C4meC5gOC4quC5ieC4meC4muC4suC4h+C4l+C4tuC4miDguYTguKHguYjguYPguIrguYnguYDguKrguYnguJnguJvguKPguLAgKOC5gOC4quC5ieC4meC4m+C4o+C4sOC4reC5iOC4suC4meC5gOC4q+C4oeC4t+C4reC4meC5gOC4quC5ieC4meC4hOC4suC4lOC4',
  'geC4suC4o+C4k+C5jCkKICAg4LmB4LiX4LmI4LiH4Lir4LiZ4Liy4LmE4Lih4LmI4LmA4LiB4Li04LiZIDI0cHgg4Lib4Lil4Liy4Lii4LiU4LmJ4Liy4LiZ4LiC4LmJ4Lit4Lih4Li54Lil4Lih4LiZ4LmA4Lil4LmH4LiB4LiZ4LmJ4Lit4LiiIOC4lOC5ieC4suC4',
  'meC4kOC4suC4meC5gOC4q+C4peC4teC5iOC4ouC4oQogICDguJXguLHguKfguKvguJnguLHguIfguKrguLfguK3guJfguLjguIHguJXguLHguKfguYPguIrguYnguKrguLXguJXguLHguKfguK3guLHguIHguKnguKPguJvguIHguJXguLQg4LmE4Lih4LmI4LmD4LiK',
  '4LmI4Liq4Li14LiC4Lit4LiH4LmB4LiX4LmI4LiHIOKAlCDguKrguLXguK3guKLguLnguYjguJfguLXguYjguYHguJfguYjguIfguYDguJfguYjguLLguJnguLHguYnguJkKLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0t',
  'LS0tLS0tLS0tLS0tLS0tLS0gKi8KLmNoYXJ0LXdyYXB7b3ZlcmZsb3cteDphdXRvfQouY2hhcnR7ZGlzcGxheTpibG9jazt3aWR0aDoxMDAlO2hlaWdodDphdXRvO21pbi13aWR0aDo1NjBweH0KLmNoYXJ0IC5ncmlkLWx7c3Ryb2tlOnZhcigtLWxpbmUpO3N0cm9r',
  'ZS13aWR0aDoxO2ZpbGw6bm9uZX0KLmNoYXJ0IC5heGlzLWx7c3Ryb2tlOnZhcigtLWxpbmUpO3N0cm9rZS13aWR0aDoxfQouY2hhcnQgLnRpY2t7ZmlsbDp2YXIoLS1tdXRlZCk7Zm9udC1zaXplOjExcHg7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1z',
  'fQouY2hhcnQgLnhsYWJ7ZmlsbDp2YXIoLS1pbmstMik7Zm9udC1zaXplOjEycHh9Ci5jaGFydCAuZGxhYntmaWxsOnZhcigtLWluayk7Zm9udC1zaXplOjExcHg7Zm9udC13ZWlnaHQ6NjAwfQouY2hhcnQgLmMxe2ZpbGw6dmFyKC0tYzEpfQouY2hhcnQgLmMye2Zp',
  'bGw6dmFyKC0tYzIpfQouY2hhcnQgLmhpdHtmaWxsOnRyYW5zcGFyZW50O2N1cnNvcjpwb2ludGVyfQouY2hhcnQgLmhpdDpmb2N1c3tvdXRsaW5lOm5vbmV9Ci5jaGFydCAuYmFuZHtmaWxsOnZhcigtLWluayk7b3BhY2l0eTowO3RyYW5zaXRpb246b3BhY2l0eSAu',
  'MTJzfQouY2hhcnQgZy5vbiAuYmFuZHtvcGFjaXR5Oi4wNX0KLmNoYXJ0IC5oaXQ6Zm9jdXMtdmlzaWJsZSArIC5iYW5kLAouY2hhcnQgZy5vbiAuYmFuZHtvcGFjaXR5Oi4wOH0KCi5sZWdlbmR7ZGlzcGxheTpmbGV4O2dhcDoxNHB4O2FsaWduLWl0ZW1zOmNlbnRl',
  'cjtmbGV4LXdyYXA6d3JhcDttYXJnaW4tYm90dG9tOjEwcHh9Ci5sZWdlbmQgLmt7ZGlzcGxheTppbmxpbmUtZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjZweDtmb250LXNpemU6MTJweDtjb2xvcjp2YXIoLS1pbmstMil9Ci5sZWdlbmQgLnN3e3dpZHRoOjEy',
  'cHg7aGVpZ2h0OjEycHg7Ym9yZGVyLXJhZGl1czozcHg7ZmxleDpub25lfQoKLyog4LiB4Lil4LmI4Lit4LiH4Lia4Lit4LiB4LiE4LmI4Liy4LiV4Lit4LiZ4LiK4Li14LmJIOKAlCDguITguYjguLLguJXguLHguKfguYPguKvguI3guYjguKHguLLguIHguYjguK3g',
  'uJkg4LiK4Li34LmI4Lit4Lij4Liy4Lii4LiB4Liy4Lij4LmA4Lib4LmH4LiZ4LiV4Lix4Lin4Lij4Lit4LiHICovCi5jdGlwe3Bvc2l0aW9uOmZpeGVkO3otaW5kZXg6OTA7cG9pbnRlci1ldmVudHM6bm9uZTtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpOwogIGJv',
  'cmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTtib3gtc2hhZG93OnZhcigtLXNoLWxnKTsKICBwYWRkaW5nOjhweCAxMHB4O2ZvbnQtc2l6ZToxMnB4O21pbi13aWR0aDoxMzJweDtvcGFjaXR5OjA7dHJhbnNpdGlvbjpv',
  'cGFjaXR5IC4xc30KLmN0aXAub257b3BhY2l0eToxfQouY3RpcCAubXtmb250LXdlaWdodDo3MDA7Y29sb3I6dmFyKC0taW5rKTttYXJnaW4tYm90dG9tOjZweH0KLmN0aXAgLnJ7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6N3B4O21hcmdpbi10',
  'b3A6M3B4fQouY3RpcCAuciBpe3dpZHRoOjEycHg7aGVpZ2h0OjJweDtib3JkZXItcmFkaXVzOjJweDtmbGV4Om5vbmV9Ci5jdGlwIC5yIGJ7Y29sb3I6dmFyKC0taW5rKTtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7bWFyZ2luLWxlZnQ6YXV0b30K',
  'LmN0aXAgLnIgc3Bhbntjb2xvcjp2YXIoLS1tdXRlZCl9Cgo8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5PgoKPGRpdiBjbGFzcz0iYXBwIj4KICA8IS0tID09PT09PT09PT09PT09PT09IHNpZGViYXIgPT09PT09PT09PT09PT09PT0gLS0+CiAgPGFzaWRlIGNsYXNzPSJu',
  'YXYiIGlkPSJuYXYiPgogICAgPGRpdiBjbGFzcz0iYnJhbmQiPgogICAgICA8Yj7wn4+iIDw/PSBhcHBOYW1lID8+PC9iPgogICAgICA8c3Bhbj48Pz0gc3VidGl0bGUgPz4gwrcgdjw/PSB2ZXJzaW9uID8+PC9zcGFuPgogICAgPC9kaXY+CiAgICA8ZGl2IGNsYXNz',
  'PSJuYXYtbGlzdCIgaWQ9Im5hdkxpc3QiPjwvZGl2PgogICAgPGRpdiBjbGFzcz0ibmF2LWZvb3QiIGlkPSJuYXZGb290Ij7guIHguLPguKXguLHguIfguYLguKvguKXguJTigKY8L2Rpdj4KICA8L2FzaWRlPgoKICA8IS0tID09PT09PT09PT09PT09PT09IG1haW4g',
  'PT09PT09PT09PT09PT09PT0gLS0+CiAgPGRpdiBjbGFzcz0ibWFpbiI+CiAgICA8aGVhZGVyIGNsYXNzPSJ0b3AiPgogICAgICA8YnV0dG9uIGNsYXNzPSJidXJnZXIiIG9uY2xpY2s9InRvZ2dsZU5hdigpIj7imLA8L2J1dHRvbj4KICAgICAgPGRpdj4KICAgICAg',
  'ICA8aDEgaWQ9InBhZ2VUaXRsZSI+4Lig4Liy4Lie4Lij4Lin4LihPC9oMT4KICAgICAgICA8ZGl2IGNsYXNzPSJzdWIiIGlkPSJwYWdlU3ViIj7guYHguJTguIrguJrguK3guKPguYzguJTguKPguKfguKHguJfguLjguIHguKrguYjguKfguJnguILguK3guIfguKvg',
  'uK3guJ7guLHguIE8L2Rpdj4KICAgICAgPC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9InRvcC1yaWdodCI+CiAgICAgICAgPHNwYW4gaWQ9ImxpdmVEb3QiPjwvc3Bhbj4KICAgICAgICA8c3BhbiBpZD0iYmVsbFdyYXAiIGNsYXNzPSJiZWxsLXdyYXAiPjwvc3Bhbj4K',
  'ICAgICAgICA8YnV0dG9uIGNsYXNzPSJidG4gaWNvbiIgaWQ9InRoZW1lQnRuIiB0aXRsZT0i4Liq4Lil4Lix4Lia4LiY4Li14LihIiBvbmNsaWNrPSJjeWNsZVRoZW1lKCkiPvCfjJc8L2J1dHRvbj4KICAgICAgICA8aW5wdXQgY2xhc3M9ImlucCB3LWF1dG8iIGlk',
  'PSJzZWFyY2hCb3giIHBsYWNlaG9sZGVyPSLwn5SOIOC4hOC5ieC4meC4q+C4suC4l+C4seC5ieC4h+C4o+C4sOC4muC4muKApiIgc3R5bGU9IndpZHRoOjE4MHB4IgogICAgICAgICAgICAgICBvbmlucHV0PSJvblNlYXJjaCh0aGlzLnZhbHVlKSIgYXV0b2NvbXBs',
  'ZXRlPSJvZmYiPgogICAgICAgIDxzZWxlY3QgY2xhc3M9InNlbCB3LWF1dG8iIGlkPSJ5ZWFyU2VsIiBvbmNoYW5nZT0ic2V0WWVhcih0aGlzLnZhbHVlKSI+PC9zZWxlY3Q+CiAgICAgICAgPGJ1dHRvbiBjbGFzcz0iYnRuIGljb24iIHRpdGxlPSLguKPguLXguYDg',
  'uJ/guKPguIoiIG9uY2xpY2s9InJlZnJlc2goKSI+4oa7PC9idXR0b24+CiAgICAgIDwvZGl2PgogICAgPC9oZWFkZXI+CiAgICA8bWFpbiBjbGFzcz0iY29udGVudCIgaWQ9InZpZXciPgogICAgICA8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj48',
  'c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPjwvZGl2PuC4geC4s+C4peC4seC4h+C5gOC4iuC4t+C5iOC4reC4oeC4leC5iOC4reC4o+C4sOC4muC4muKApjwvZGl2PgogICAgPC9tYWluPgogIDwvZGl2PgoKICA8IS0tIOC5geC4luC4muC4peC5iOC4suC4h+C4quC4',
  's+C4q+C4o+C4seC4muC4oeC4t+C4reC4luC4t+C4rSDigJQg4Lit4Lii4Li54LmI4LmD4LiZ4Lir4LiZ4LmJ4Liy4LmA4LiU4Li14Lii4Lin4LiB4Lix4LiZ4LiZ4Li14LmJ4LmA4Liq4Lih4LitIOC5hOC4oeC5iOC5hOC4lOC5ieC5geC4ouC4geC5hOC4n+C4peC5',
  'jAogICAgICAgQ1NTIOC5gOC4m+C5h+C4meC4leC4seC4p+C4leC4seC4lOC4quC4tOC4meC4p+C5iOC4suC4iOC4reC5hOC4q+C4meC5gOC4q+C5h+C4mSDguKLguYjguK0t4LiC4Lii4Liy4Lii4Lir4LiZ4LmJ4Liy4LiV4LmI4Liy4LiH4LmB4Lil4LmJ4Lin4Liq',
  '4Lil4Lix4Lia4LmE4LiU4LmJ4LiX4Lix4LiZ4LiX4Li1IC0tPgogIDxuYXYgY2xhc3M9InRhYmJhciIgaWQ9InRhYkJhciIgYXJpYS1sYWJlbD0i4LmA4Lih4LiZ4Li54Lir4Lil4Lix4LiBIj48L25hdj4KPC9kaXY+Cgo8ZGl2IGlkPSJhdXRoUm9vdCI+PC9kaXY+',
  'CjxkaXYgaWQ9Im1vZGFsUm9vdCI+PC9kaXY+CjxkaXYgaWQ9InRvYXN0Um9vdCI+PC9kaXY+Cgo8c2NyaXB0PgogIC8qIOC4hOC5iOC4suC4l+C4seC5ieC4h+C4quC4suC4oeC4luC4ueC4geC4geC4o+C4reC4h+C4oeC4suC4iOC4suC4geC4neC4seC5iOC4h+C5',
  'gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jOC5geC4peC5ieC4pyDguIjguLbguIfguKvguKXguLjguJTguK3guK3guIHguIjguLLguIHguYDguITguKPguLfguYjguK3guIfguKvguKHguLLguKLguITguLPguJ7guLnguJTguYTguKHguYjguYTguJTguYkK',
  'ICAgICAgIGFjY2Vzc0tleSAg4Lic4LmI4Liy4LiZIHNhZmVLZXlfICAgIOC5gOC4q+C4peC4t+C4reC5geC4hOC5iCBBLVogYS16IDAtOSBfIC0KICAgICAgIHJvbGUgICAgICAg4Lih4Liy4LiI4Liy4LiB4Lij4Liy4Lii4LiB4Liy4Lij4LiE4LiH4LiX4Li14LmI',
  'IFJPTEUKICAgICAgIHRoZW1lICAgICAg4Lic4LmI4Liy4LiZIHNhZmVUaGVtZV8gIOC5gOC4q+C4peC4t+C4reC5geC4hOC5iCAzIOC4hOC5iOC4suC4l+C4teC5iOC4geC4s+C4q+C4meC4lOC5hOC4p+C5iQoKICAgICDguJfguLHguYnguIfguKrguLLguKHguJXg',
  'uYnguK3guIfguJ7guLTguKHguJ7guYzguYHguJrguJrguJTguLTguJogKGZvcmNlLXByaW50aW5nKSDguYDguJfguYjguLLguJnguLHguYnguJkg4Lir4LmJ4Liy4Lih4LmD4LiK4LmJ4LmB4Lia4LiaIHN0YW5kYXJkLXByaW50aW5nCiAgICAg4LmA4Lie4Lij4Liy',
  '4Liw4LmB4Lia4Lia4Lir4Lil4Lix4LiH4LiI4LiwIGVzY2FwZSDguYDguITguKPguLfguYjguK3guIfguKvguKHguLLguKLguITguLPguJ7guLnguJTguYDguJvguYfguJkgJnF1b3Q7IOC4i+C4tuC5iOC4h+C5g+C4meC5geC4l+C5h+C4gSBzY3JpcHQKICAgICDg',
  'uYDguJrguKPguLLguKfguYzguYDguIvguK3guKPguYzguYTguKHguYjguJbguK3guJTguIHguKXguLHguJog4LiX4Liz4LmD4Lir4LmJ4LiX4Lix4LmJ4LiH4Lia4Lil4LmH4Lit4LiB4LiZ4Li14LmJ4Lie4Lix4LiH4LiX4Lix4LmJ4LiH4LiB4LmJ4Lit4LiZ4LmB',
  '4Lil4Liw4LiE4LmI4Liy4LmE4Lih4LmI4LiW4Li24LiH4Lir4LiZ4LmJ4Liy4LmA4Lin4LmH4LiaICovCiAgdmFyIEFDQ0VTU19LRVkgPSAiPD8hPSBhY2Nlc3NLZXkgPz4iOwogIHZhciBVU0VSX1JPTEUgID0gIjw/IT0gcm9sZSA/PiI7CiAgdmFyIElOSVRfVEhF',
  'TUUgPSAiPD8hPSB0aGVtZSA/PiI7Cjwvc2NyaXB0Pgo8c2NyaXB0PgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgQXBwLmh0bWwg4oCUIGNvcmU6IHN0YXRlLCBhcGksIHJvdXRlciwgZm9ybWF0',
  'LCBtb2RhbCwgdXBsb2FkCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKdmFyIFMgPSB7CiAgYm9vdDogbnVsbCwgICAgICAgICAgLy8g4LiC4LmJ4Lit4Lih4Li54Lil4LiV4Lix4LmJ4LiH4LiV',
  '4LmJ4LiZ4LiI4Liy4LiBIGFwcC5ib290c3RyYXAKICBwYWdlOiAnZGFzaGJvYXJkJywKICB5ZWFyOiBTdHJpbmcobmV3IERhdGUoKS5nZXRGdWxsWWVhcigpKSwKICBjYWNoZToge30sICAgICAgICAgICAvLyDguYDguIHguYfguJrguJzguKXguKXguLHguJ7guJjg',
  'uYzguKXguYjguLLguKrguLjguJTguILguK3guIfguYHguJXguYjguKXguLDguKvguJnguYnguLIKICBwYXJhbXM6IHt9LCAgICAgICAgICAvLyDguJXguLHguKfguIHguKPguK3guIfguKLguYjguK3guKLguILguK3guIfguYHguJXguYjguKXguLDguKvguJnguYng',
  'uLIg4LmA4LiK4LmI4LiZIHtyb29tOiczMTEnLCBzdGF0dXM6J2FsbCd9CiAgYnVzeTogZmFsc2UsCiAgdmVyc2lvbjogMCwgICAgICAgICAgLy8g4Lij4Li44LmI4LiZ4LiC4LmJ4Lit4Lih4Li54Lil4LiX4Li14LmI4Lir4LiZ4LmJ4Liy4LiZ4Li14LmJ4LiW4Li3',
  '4Lit4Lit4Lii4Li54LmICiAgc2VsZkNoYW5nZVVudGlsOiAwLCAgLy8g4LmA4Lie4Li04LmI4LiH4LiB4LiU4Lia4Lix4LiZ4LiX4Li24LiB4LmA4Lit4LiHIOKAlCDguK3guKLguYjguLLguYDguJTguYnguIfguKfguYjguLIgIuC4oeC4teC4hOC4meC5geC4geC5',
  'ieC4guC5ieC4reC4oeC4ueC4pSIKICBzeW5jVGltZXI6IG51bGwKfTsKCnZhciBBTExfREVCVFMgPSBbXTsKCnZhciBQQUdFUyA9IFsKICB7IGlkOidkYXNoYm9hcmQnLCBpYzon8J+TiicsIGxhYmVsOifguKDguLLguJ7guKPguKfguKEnLCAgICAgICAgICAgICAg',
  'c3ViOifguYHguJTguIrguJrguK3guKPguYzguJTguKPguKfguKHguJfguLjguIHguKrguYjguKfguJnguILguK3guIfguKvguK3guJ7guLHguIEnLCAgICAgICAgc2VjOifguKDguLLguJ7guKPguKfguKEnLCB0YWI6J+C4oOC4suC4nuC4o+C4p+C4oScgfSwKICB7',
  'IGlkOidkZWJ0TWFpbicsICBpYzon8J+SsCcsIGxhYmVsOifguKPguLLguKLguIHguLLguKPguKrguKPguLjguJvguKPguKfguKEnLCAgICAgICBzdWI6J+C4muC4seC4jeC4iuC4teC5guC4reC4meC5g+C4iuC5ieC4q+C4meC4teC5ieC4q+C4peC4seC4geC4guC4',
  'reC4h+C4q+C4reC4nuC4seC4gScsICAgICAgICBzZWM6J+C4geC4suC4o+C5gOC4h+C4tOC4mScgfSwKICB7IGlkOidkZWJ0U3ViJywgICBpYzon8J+nvicsIGxhYmVsOifguKvguJnguLXguYnguKrguLTguJknLCAgICAgICAgICAgICAgc3ViOifguJrguLHguI3g',
  'uIrguLXguYLguK3guJnguYPguIrguYnguKvguJnguLXguYnguKPguK3guIfguILguK3guIfguKvguK3guJ7guLHguIEnIH0sCiAgeyBpZDoncHVyY2hhc2VzJywgaWM6J/Cfm5InLCBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiH',
  'JywgICAgICAgIHN1Yjon4LiC4Lit4LiH4LmA4LiC4LmJ4Liy4Lir4Lit4Lie4Lix4LiBIOC4o+C4suC4hOC4siDguJvguKPguLDguIHguLHguJkg4LmB4Lil4Liw4Liq4Lil4Li04LibJyB9LAogIHsgaWQ6J2ZpbmFuY2UnLCAgIGljOifwn5OSJywgbGFiZWw6J+C4',
  'o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKLguKvguK0nLCAgICAgIHN1Yjon4LiE4LmI4Liy4LmA4LiK4LmI4Liy4LiX4Li14LmI4LmA4LiB4LmH4Lia4LmE4LiU4LmJIMK3IOC4hOC5iOC4suC5hOC4nyDCtyDguITguYjguLLguJnguYnguLMg',
  'wrcg4LiE4LmI4Liy4LmA4LiZ4LmH4LiVIMK3IOC4oOC4suC4qeC4tScsIHRhYjon4Lij4Liy4Lii4Lij4Lix4LiaLeC4iOC5iOC4suC4oicgfSwKICB7IGlkOidhYycsICAgICAgICBpYzon4p2E77iPJywgbGFiZWw6J+C4peC5ieC4suC4h+C5geC4reC4o+C5jCcs',
  'ICAgICAgICAgICAgc3ViOifguJXguLLguKPguLLguIfguKXguYnguLLguIfguYHguK3guKPguYzguKPguLLguKLguKvguYnguK3guIcgMjQg4Lir4LmJ4Lit4LiHJywgICAgICBzZWM6J+C4i+C5iOC4reC4oeC4muC4s+C4o+C4uOC4hycsIHRhYjon4Lil4LmJ4Liy',
  '4LiH4LmB4Lit4Lij4LmMJyB9LAogIHsgaWQ6J3JlcGFpcnMnLCAgIGljOifwn5SnJywgbGFiZWw6J+C4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4suC4oeC4q+C5ieC4reC4hycsICAgICAgc3ViOifguIfguLLguJnguYHguIjguYnguIfguIvguYjguK3guKHguYHg',
  'uKLguIHguJXguLLguKHguKvguYnguK3guIcnLCB0YWI6J+C4i+C5iOC4reC4oeC4q+C5ieC4reC4hycgfSwKICB7IGlkOididWlsZGluZycsICBpYzon8J+PoicsIGxhYmVsOifguIvguYjguK3guKHguYHguIvguKHguJXguLbguIHguYLguJTguKLguKPguKfguKEn',
  'LCAgICBzdWI6J+C4h+C4suC4meC4quC5iOC4p+C4meC4geC4peC4suC4h+C4guC4reC4h+C4reC4suC4hOC4suC4oycgfSwKICB7IGlkOidyb29tcycsICAgICBpYzon8J+aqicsIGxhYmVsOifguKvguYnguK3guIfguJ7guLHguIEnLCAgICAgICAgICAgICBzdWI6',
  'J+C4l+C4sOC5gOC4muC4teC4ouC4meC4q+C5ieC4reC4h+C5geC4peC4sOC4m+C4o+C4sOC4p+C4seC4leC4tOC4o+C4suC4ouC4q+C5ieC4reC4hycsICAgICAgIHNlYzon4LiC4LmJ4Lit4Lih4Li54LilJyB9LAogIHsgaWQ6J3JlcG9ydHMnLCAgIGljOifwn5OI',
  'JywgbGFiZWw6J+C4o+C4suC4ouC4h+C4suC4mSAmIOC4quC4s+C4o+C4reC4h+C4guC5ieC4reC4oeC4ueC4pScsIHN1Yjon4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Lij4Liy4Lii4Lir4LmJ4Lit4LiHIMK3IOC4m+C4j+C4tOC4l+C4tOC4meC4h+C4',
  'suC4mSDCtyDguKrguYjguIfguK3guK3guIHguILguYnguK3guKHguLnguKUnIH0sCiAgeyBpZDonc2V0dGluZ3MnLCAgaWM6J+Kame+4jycsIGxhYmVsOifguJXguLHguYnguIfguITguYjguLInLCAgICAgICAgICAgICAgc3ViOifguJrguLHguI3guIrguLUgwrcg',
  '4LiY4Li14LihIMK3IOC4nOC4ueC5ieC5g+C4iuC5iSDCtyDguKXguLTguIfguIHguYzguYDguILguYnguLLguYPguIrguYnguIfguLLguJknLCAgIHNlYzon4Lij4Liw4Lia4LiaJyB9Cl07CgovKiAtLS0tLS0tLS0tLS0tLS0tIEFQSSAtLS0tLS0tLS0tLS0tLS0t',
  'ICovCgovKiog4LiB4Li44LiN4LmB4LiI4LiX4Li14LmI4LiI4Liw4LmB4LiZ4Lia4LmE4Lib4LiB4Lix4Lia4LiX4Li44LiB4LiE4Liz4Liq4Lix4LmI4LiHIOKAlCDguKHguLUgMiDguJfguLLguIfguKrguLPguKPguK3guIfguYDguJzguLfguYjguK3guJfguLLg',
  'uIfguYHguKPguIHguYTguKHguYjguKHguLIgKi8KdmFyIFJFU09MVkVEX0tFWSA9IG51bGw7CgpmdW5jdGlvbiBhY2Nlc3NLZXkoKXsKICBpZiAoUkVTT0xWRURfS0VZICE9PSBudWxsKSByZXR1cm4gUkVTT0xWRURfS0VZOwogIFJFU09MVkVEX0tFWSA9ICh0eXBl',
  'b2YgQUNDRVNTX0tFWSA9PT0gJ3N0cmluZycgJiYgQUNDRVNTX0tFWSkgPyBBQ0NFU1NfS0VZIDogJyc7CiAgcmV0dXJuIFJFU09MVkVEX0tFWTsKfQoKLyoqIHRydWUg4LiW4LmJ4Liy4LmA4Lib4Li04LiU4LiU4LmJ4Lin4Lii4Lil4Li04LiH4LiB4LmM4Lic4Li5',
  '4LmJ4LiU4Li54LmB4LilIOKAlCDguYPguIrguYnguYHguJfguJnguJXguLHguKfguYHguJvguKMgQ0FOX0VESVQg4LiV4Lij4LiHIOC5hiDguJfguLXguYjguK3guLLguIjguYTguKHguYjguJbguLnguIHguJvguKPguLDguIHguLLguKggKi8KZnVuY3Rpb24gY2Fu',
  'RWRpdCgpewogIGlmICh0eXBlb2YgQ0FOX0VESVQgIT09ICd1bmRlZmluZWQnKSByZXR1cm4gISFDQU5fRURJVDsKICByZXR1cm4gISEoUy5ib290ICYmIFMuYm9vdC5jYW5FZGl0KTsKfQoKZnVuY3Rpb24gY2FsbEFwaShhY3Rpb24sIHBheWxvYWQpewogIHZhciBi',
  'b2R5ID0ge307CiAgT2JqZWN0LmtleXMocGF5bG9hZCB8fCB7fSkuZm9yRWFjaChmdW5jdGlvbihrKXsgYm9keVtrXSA9IHBheWxvYWRba107IH0pOwogIGJvZHkuX2tleSA9IGFjY2Vzc0tleSgpOwogIC8vIOC4nOC4ueC5ieC5gOC4o+C4teC4ouC4geC4quC5iOC4',
  'hyBfc2Vzc2lvbiDguKHguLLguYDguK3guIfguYTguJTguYkgKOC4leC4reC4meC4reC4reC4geC4iOC4suC4geC4o+C4sOC4muC4muC4leC5ieC4reC4h+C5g+C4iuC5ieC4leC4seC4p+C5gOC4geC5iOC4sikKICBpZiAoYm9keS5fc2Vzc2lvbiA9PT0gdW5kZWZp',
  'bmVkKSBib2R5Ll9zZXNzaW9uID0gKHR5cGVvZiBBVVRIICE9PSAndW5kZWZpbmVkJyA/IEFVVEguc2Vzc2lvbiA6ICcnKSB8fCAnJzsKICBwYXlsb2FkID0gYm9keTsKICB2YXIgbXV0YXRpbmcgPSBDTElFTlRfTVVUQVRJTkcudGVzdChhY3Rpb24pOwogIGlmICht',
  'dXRhdGluZykgc3luY1NldCgnc2F2aW5nJyk7CgogIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpewogICAgZ29vZ2xlLnNjcmlwdC5ydW4KICAgICAgLndpdGhTdWNjZXNzSGFuZGxlcihmdW5jdGlvbihyZXMpewogICAgICAgIGlm',
  'ICghcmVzKSB7IGlmIChtdXRhdGluZykgc3luY1NldCgnb2ZmbGluZScpOyByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcign4LmE4Lih4LmI4LmE4LiU4LmJ4Lij4Lix4Lia4LiC4LmJ4Lit4Lih4Li54Lil4LiI4Liy4LiB4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit',
  '4Lij4LmMJykpOyB9CiAgICAgICAgaWYgKHJlcy5vaykgewogICAgICAgICAgaWYgKG11dGF0aW5nKSB7IG1hcmtTZWxmQ2hhbmdlKCk7IHN5bmNTZXQoJ3NhdmVkJyk7IH0KICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlcy5kYXRhKTsKICAgICAgICB9CiAgICAg',
  'ICAgLy8g4Lir4Lih4LiU4Lit4Liy4Lii4Li44Lij4Liw4Lir4Lin4LmI4Liy4LiH4LmD4LiK4LmJ4LiH4Liy4LiZIOKAlCDguJ7guLLguIHguKXguLHguJrguYTguJvguKvguJnguYnguLLguKXguYfguK3guIHguK3guLTguJnguYHguJfguJnguJfguLXguYjguIjg',
  'uLDguILguLbguYnguJnguILguYnguK3guITguKfguLLguKHguITguYnguLLguIfguYTguKfguYnguYDguInguKIg4LmGCiAgICAgICAgaWYgKHJlcy5uZWVkTG9naW4gJiYgdHlwZW9mIG9uU2Vzc2lvbkxvc3QgPT09ICdmdW5jdGlvbicpIG9uU2Vzc2lvbkxvc3Qo',
  'KTsKICAgICAgICBpZiAobXV0YXRpbmcpIHN5bmNTZXQoJ2Vycm9yJywgcmVzLmVycm9yKTsKICAgICAgICByZWplY3QobmV3IEVycm9yKHJlcy5lcnJvcikpOwogICAgICB9KQogICAgICAud2l0aEZhaWx1cmVIYW5kbGVyKGZ1bmN0aW9uKGVycil7CiAgICAgICAg',
  'Ly8g4LmA4LiZ4LmH4LiV4Liq4Liw4LiU4Li44LiUIOKAlCDguILguK3guIfguJfguLXguYjguIHguKPguK3guIHguYTguKfguYnguKLguLHguIfguK3guKLguLnguYjguYPguJnguJ/guK3guKPguYzguKEg4LmE4Lih4LmI4Lir4Liy4Lii4LmE4Lib4LmE4Lir4LiZ',
  'CiAgICAgICAgaWYgKG11dGF0aW5nKSBzeW5jU2V0KGlzT2ZmbGluZUVycm9yKGVycikgPyAnb2ZmbGluZScgOiAnZXJyb3InLCAoZXJyICYmIGVyci5tZXNzYWdlKSB8fCBTdHJpbmcoZXJyKSk7CiAgICAgICAgcmVqZWN0KGVycik7CiAgICAgIH0pCiAgICAgIC5h',
  'cGkoYWN0aW9uLCBwYXlsb2FkIHx8IHt9KTsKICB9KTsKfQoKLyoqIOC5gOC4o+C4teC4ouC4geC5gOC4oeC4t+C5iOC4reC5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jOC4muC4reC4geC4p+C5iOC4suC4ouC4seC4h+C5hOC4oeC5iOC5hOC4lOC5ieC4',
  'peC5h+C4reC4geC4reC4tOC4mSAo4Lir4Lih4LiU4Lit4Liy4Lii4Li4IC8g4LiW4Li54LiB4LmD4Lir4LmJ4Lit4Lit4LiB4LiI4Liy4LiB4Lij4Liw4Lia4LiaKSAqLwp2YXIgc2Vzc2lvbkxvc3RBdCA9IDA7CmZ1bmN0aW9uIG9uU2Vzc2lvbkxvc3QoKXsKICBp',
  'ZiAoRGF0ZS5ub3coKSAtIHNlc3Npb25Mb3N0QXQgPCAzMDAwKSByZXR1cm47ICAgLy8g4Lir4Lil4Liy4Lii4LiE4Liz4Liq4Lix4LmI4LiH4Lie4Lij4LmJ4Lit4Lih4LiB4Lix4LiZ4LiB4LmH4LmA4LiU4LmJ4LiH4LiE4Lij4Lix4LmJ4LiH4LmA4LiU4Li14Lii',
  '4Lin4Lie4LitCiAgc2Vzc2lvbkxvc3RBdCA9IERhdGUubm93KCk7CiAgc2F2ZVNlc3Npb24oJycpOwogIGNsb3NlTW9kYWwoKTsKICBpZiAoQVVUSC5kZXZpY2UpIHNob3dQaW4oKTsgZWxzZSBzaG93TG9naW4oJ+C4q+C4oeC4lOC5gOC4p+C4peC4suC5g+C4iuC5',
  'ieC4h+C4suC4mSDguIHguKPguLjguJPguLLguYDguILguYnguLLguKrguLnguYjguKPguLDguJrguJrguK3guLXguIHguITguKPguLHguYnguIcnKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSBib290ICYgcm91dGluZyAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5j',
  'dGlvbiBib290KCl7CiAgLy8g4LiX4Liy4LiY4Li14Lih4LiB4LmI4Lit4LiZ4Lit4Lii4LmI4Liy4LiH4Lit4Li34LmI4LiZIOC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC5gOC4q+C5h+C4meC4q+C4meC5ieC4suC4iOC4reC4geC4o+C4sOC4nuC4o+C4tOC4muC4',
  'guC4suC4p+C4leC4reC4meC5gOC4m+C4tOC4lAogIGFwcGx5VGhlbWUobHNHZXQoTFNfVEhFTUUpIHx8ICh0eXBlb2YgSU5JVF9USEVNRSA9PT0gJ3N0cmluZycgPyBJTklUX1RIRU1FIDogJ+C4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hycpKTsKICAvLyBh',
  'dXRoR2F0ZSDguIjguLDguK3guYjguLLguJnguIHguLjguI3guYHguIjguIjguLLguIEgVVJMIOC4guC4reC4h+C4q+C4meC5ieC4suC5geC4oeC5iOC5g+C4q+C5ieC4lOC5ieC4p+C4oiDguJbguYnguLLguJXguLHguKfguYHguJvguKPguYTguKHguYjguKHguLLg',
  'uJbguLbguIfguKvguJnguYnguLLguYDguKfguYfguJoKICBhdXRoR2F0ZSgpOwp9CgpmdW5jdGlvbiBib290Tm93KCl7CiAgY2FsbEFwaSgnYXBwLmJvb3RzdHJhcCcpLnRoZW4oZnVuY3Rpb24oYil7CiAgICBTLmJvb3QgPSBiOwogICAgcmVuZGVyTmF2KCk7CiAg',
  'ICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2Rm9vdCcpLmlubmVySFRNTCA9IG5hdkZvb3RIdG1sKGIpOwogICAgUy52ZXJzaW9uID0gYi52ZXJzaW9uIHx8IDA7CiAgICBpZiAoIWIuY2FuRWRpdCkgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdyZWFk',
  'b25seScpOwogICAgLy8g4LiY4Li14Lih4LiC4Lit4LiH4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJ4LiK4LiZ4Liw4LmA4Liq4Lih4LitIOC4luC5ieC4suC4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4leC4seC5ieC4h+C4hOC5iOC4reC4ouC5g+C4',
  'iuC5ieC4guC4reC4h+C4o+C4sOC4muC4mgogICAgYXBwbHlUaGVtZShjdXJyZW50VGhlbWUoKSk7CiAgICBnbyhzdGFydFBhZ2UoYikpOwogICAgcmVmcmVzaEFsZXJ0cygpOwogICAgc3RhcnRQb2xsaW5nKGIuc2V0dGluZ3MgJiYgYi5zZXR0aW5ncy5yZWZyZXNo',
  'U2Vjb25kcyk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndmlldycpLmlubmVySFRNTCA9CiAgICAgICc8ZGl2IGNsYXNzPSJjYXJkIj48ZGl2IGNsYXNzPSJjYXJkLWIiPjxoMz7guYDguIrguLfguYjguK3guKHg',
  'uJXguYjguK3guKPguLDguJrguJrguYTguKHguYjguKrguLPguYDguKPguYfguIg8L2gzPicgKwogICAgICAnPHAgY2xhc3M9Im11dGVkIj4nICsgZXNjKGUubWVzc2FnZXx8ZSkgKyAnPC9wPicgKwogICAgICAnPHAgY2xhc3M9ImZzMTMiPuC4leC4o+C4p+C4iOC4',
  'quC4reC4muC4p+C5iOC4sjog4LmA4Lib4Li04LiU4LiK4Li14LiV4LmB4Lil4LmJ4Lin4Lij4Lix4LiZIDxiPuC5gOC4oeC4meC4uSDwn4+iIFRoZSBNIENvcm5lciBBUCDihpIg8J+agCDguJXguLTguJTguJXguLHguYnguIfguJfguLHguYnguIfguKvguKHguJTg',
  'uYPguJnguITguKXguLTguIHguYDguJTguLXguKLguKc8L2I+ICcgKwogICAgICAn4LmA4Lij4Li14Lii4Lia4Lij4LmJ4Lit4Lii4LmB4Lil4LmJ4LinPC9wPjwvZGl2PjwvZGl2Pic7CiAgfSk7Cn0KCi8qKiDguKvguJnguYnguLLguYHguKPguIHguJfguLXguYjg',
  'uIjguLDguYDguJvguLTguJQg4oCUIOC4leC4suC4oeC4l+C4teC5iOC4leC4seC5ieC4h+C5hOC4p+C5iSDguYHguJXguYjguJbguYnguLLguKHguLUgI2hhc2gg4LmD4LiZ4Lil4Li04LiH4LiB4LmM4LmD4Lir4LmJIGhhc2gg4LiK4LiZ4LiwICovCmZ1bmN0aW9u',
  'IHN0YXJ0UGFnZShiKXsKICB2YXIgaGFzaCA9IChsb2NhdGlvbi5oYXNoIHx8ICcnKS5yZXBsYWNlKCcjJywnJyk7CiAgaWYgKFBBR0VTLnNvbWUoZnVuY3Rpb24ocCl7IHJldHVybiBwLmlkID09PSBoYXNoOyB9KSkgcmV0dXJuIGhhc2g7CiAgdmFyIG1hcCA9IHsK',
  'ICAgICfguYHguJTguIrguJrguK3guKPguYzguJQnOidkYXNoYm9hcmQnLCAn4Lij4Liy4Lii4LiB4Liy4Lij4Liq4Lij4Li44Lib4Lij4Lin4LihJzonZGVidE1haW4nLCAn4Lir4LiZ4Li14LmJ4Liq4Li04LiZJzonZGVidFN1YicsCiAgICAn4Lij4Liy4Lii4LiB',
  '4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHJzoncHVyY2hhc2VzJywgJ+C4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4suC4oeC4q+C5ieC4reC4hyc6J3JlcGFpcnMnCiAgfTsKICByZXR1cm4gbWFwW2Iuc2V0dGluZ3MgJiYgYi5zZXR0aW5ncy5zdGFydFBhZ2Vd',
  'IHx8ICdkYXNoYm9hcmQnOwp9CgovKiog4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Lih4Li44Lih4Lil4LmI4Liy4LiH4LiL4LmJ4Liy4LiiIOKAlCDguYDguKfguK3guKPguYzguIrguLHguJnguYDguKfguYfguJrguYHguK3guJvguIjguLDguYDguILguLXguKLguJng',
  'uJfguLHguJrguJ/guLHguIfguIHguYzguIrguLHguJnguJnguLXguYkgKi8KZnVuY3Rpb24gbmF2Rm9vdEh0bWwoYil7CiAgdmFyIHUgPSBiLnVzZXIgfHwge307CiAgcmV0dXJuICc8YiBzdHlsZT0iY29sb3I6I2M3ZDBlMCI+JyArIGVzYyh1Lm5hbWUgfHwgdS5s',
  'YWJlbCB8fCAnJykgKyAnPC9iPicgKwogICAgKHUudXNlcm5hbWUgPyAnIDxzcGFuIHN0eWxlPSJvcGFjaXR5Oi43Ij5AJyArIGVzYyh1LnVzZXJuYW1lKSArICc8L3NwYW4+JyA6ICcnKSArCiAgICAnPGJyPjxzcGFuIHN0eWxlPSJvcGFjaXR5Oi44Ij4nICsgZXNj',
  'KHUucm9sZSAmJiB1LnJvbGUgIT09ICdub25lJyA/IHUucm9sZSA6IHUudmlhIHx8ICcnKSArICc8L3NwYW4+JyArCiAgICAoYi5zaGVldFVybCA/ICc8YnI+PGEgaHJlZj0iJyArIGVzYyhzYWZlVXJsKGIuc2hlZXRVcmwpKSArICciIHRhcmdldD0iX2JsYW5rIiBy',
  'ZWw9Im5vb3BlbmVyIj7guYDguJvguLTguJQgR29vZ2xlIFNoZWV0IOKGlzwvYT4nIDogJycpICsKICAgICh1LnNpZ25lZEluICYmIHUudXNlcm5hbWUKICAgICAgPyAnPGJyPjxhIGhyZWY9ImphdmFzY3JpcHQ6dm9pZCgwKSIgb25jbGljaz0iY29uZmlybUxvZ291',
  'dCgpIj7guK3guK3guIHguIjguLLguIHguKPguLDguJrguJo8L2E+JwogICAgICA6ICcnKTsKfQoKZnVuY3Rpb24gcmVuZGVyTmF2KCl7CiAgdmFyIGh0bWwgPSAnJzsKICBQQUdFUy5mb3JFYWNoKGZ1bmN0aW9uKHApewogICAgaWYgKHAuc2VjKSBodG1sICs9ICc8',
  'ZGl2IGNsYXNzPSJuYXYtc2VjIj4nICsgcC5zZWMgKyAnPC9kaXY+JzsKICAgIGh0bWwgKz0gJzxidXR0b24gY2xhc3M9Im5hdi1pdGVtIiBpZD0ibmF2LScgKyBwLmlkICsgJyIgb25jbGljaz0iZ28oJyArIGpzcShwLmlkKSArICcpIj4nICsKICAgICAgICAgICAg',
  'ICAnPHNwYW4gY2xhc3M9ImljIj4nICsgcC5pYyArICc8L3NwYW4+PHNwYW4+JyArIHAubGFiZWwgKyAnPC9zcGFuPicgKwogICAgICAgICAgICAgICc8c3BhbiBjbGFzcz0iYmFkZ2UiIGlkPSJiYWRnZS0nICsgcC5pZCArICciIHN0eWxlPSJkaXNwbGF5Om5vbmUi',
  'Pjwvc3Bhbj4nICsKICAgICAgICAgICAgJzwvYnV0dG9uPic7CiAgfSk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdkxpc3QnKS5pbm5lckhUTUwgPSBodG1sOwogIHJlbmRlclRhYnMoKTsKfQoKLyoqCiAqIOC5geC4luC4muC4peC5iOC4suC4h+C4quC4',
  's+C4q+C4o+C4seC4muC4oeC4t+C4reC4luC4t+C4rSDigJQg4LmD4LiK4LmJIFBBR0VTIOC4iuC4uOC4lOC5gOC4lOC4teC4ouC4p+C4geC4seC4muC5gOC4oeC4meC4ueC4guC5ieC4suC4hyDguYHguKXguLDguYDguKPguLXguKLguIEgZ28oKSDguJXguLHguKfg',
  'uYDguJTguLXguKLguKfguIHguLHguJkKICog4LmE4Lih4LmI4LmE4LiU4LmJ4LmA4Lib4LmH4LiZ4Lir4LiZ4LmJ4Liy4LiI4Lit4LiE4LiZ4Lil4Liw4LiK4Li44LiUIOC5gOC4m+C5h+C4meC5geC4hOC5iOC4l+C4teC5iOC4p+C4suC4h+C4m+C4uOC5iOC4oeC4',
  'reC4teC4geC4l+C4teC5iOC4q+C4meC4tuC5iOC4h+C4guC4reC4h+C4guC5ieC4reC4oeC4ueC4peC5gOC4lOC4tOC4oQogKiDguJvguLjguYjguKHguKrguLjguJTguJfguYnguLLguKLguYDguJvguLTguJTguKXguLTguYnguJnguIrguLHguIHguYDguKHguJng',
  'uLnguYDguJTguLTguKEg4LiI4Liw4LmE4LiU4LmJ4LmA4LiC4LmJ4Liy4LiW4Li24LiH4Lir4LiZ4LmJ4Liy4LiX4Li14LmI4LmA4Lir4Lil4Li34Lit4LmE4LiU4LmJ4LiE4Lij4LiaCiAqLwpmdW5jdGlvbiByZW5kZXJUYWJzKCl7CiAgdmFyIGJhciA9IGRvY3Vt',
  'ZW50LmdldEVsZW1lbnRCeUlkKCd0YWJCYXInKTsKICBpZiAoIWJhcikgcmV0dXJuOwogIHZhciBodG1sID0gUEFHRVMuZmlsdGVyKGZ1bmN0aW9uKHApeyByZXR1cm4gcC50YWI7IH0pLm1hcChmdW5jdGlvbihwKXsKICAgIHJldHVybiAnPGJ1dHRvbiBjbGFzcz0i',
  'dGFiIiBpZD0idGFiLScgKyBwLmlkICsgJyIgb25jbGljaz0iZ28oJyArIGpzcShwLmlkKSArICcpIiBhcmlhLWxhYmVsPSInICsgZXNjKHAubGFiZWwpICsgJyI+JyArCiAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9ImljIj4nICsgcC5pYyArICc8L3NwYW4+PHNw',
  'YW4gY2xhc3M9InRsIj4nICsgZXNjKHAudGFiKSArICc8L3NwYW4+JyArCiAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9ImJhZGdlIiBpZD0idGFiYmFkZ2UtJyArIHAuaWQgKyAnIiBzdHlsZT0iZGlzcGxheTpub25lIj48L3NwYW4+JyArCiAgICAgICAgICAgJzwv',
  'YnV0dG9uPic7CiAgfSkuam9pbignJyk7CiAgYmFyLmlubmVySFRNTCA9IGh0bWwgKwogICAgJzxidXR0b24gY2xhc3M9InRhYiIgaWQ9InRhYi1tb3JlIiBvbmNsaWNrPSJ0b2dnbGVOYXYoKSIgYXJpYS1sYWJlbD0i4LmA4Lih4LiZ4Li54LiX4Lix4LmJ4LiH4Lir',
  '4Lih4LiUIj4nICsKICAgICAgJzxzcGFuIGNsYXNzPSJpYyI+4piwPC9zcGFuPjxzcGFuIGNsYXNzPSJ0bCI+4LmA4Lie4Li04LmI4Lih4LmA4LiV4Li04LihPC9zcGFuPicgKwogICAgICAnPHNwYW4gY2xhc3M9ImJhZGdlIiBpZD0idGFiYmFkZ2UtbW9yZSIgc3R5',
  'bGU9ImRpc3BsYXk6bm9uZSI+PC9zcGFuPicgKwogICAgJzwvYnV0dG9uPic7Cn0KCmZ1bmN0aW9uIGdvKHBhZ2UpewogIFMucGFnZSA9IHBhZ2U7CiAgUy5wYXJhbXMgPSB7fTsKICBsb2NhdGlvbi5oYXNoID0gcGFnZTsKICB2YXIgbWV0YSA9IFBBR0VTLmZpbHRl',
  'cihmdW5jdGlvbihwKXtyZXR1cm4gcC5pZD09PXBhZ2U7fSlbMF0gfHwgUEFHRVNbMF07CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BhZ2VUaXRsZScpLnRleHRDb250ZW50ID0gbWV0YS5sYWJlbDsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFnZVN1',
  'YicpLnRleHRDb250ZW50ID0gbWV0YS5zdWI7CiAgUEFHRVMuZm9yRWFjaChmdW5jdGlvbihwKXsKICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXYtJyArIHAuaWQpOwogICAgaWYgKGVsKSBlbC5jbGFzc0xpc3QudG9nZ2xlKCdvbicsIHAu',
  'aWQgPT09IHBhZ2UpOwogICAgdmFyIHRhYiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YWItJyArIHAuaWQpOwogICAgaWYgKHRhYikgdGFiLmNsYXNzTGlzdC50b2dnbGUoJ29uJywgcC5pZCA9PT0gcGFnZSk7CiAgfSk7CiAgLy8g4Lir4LiZ4LmJ4Liy4LiX',
  '4Li14LmI4LmE4Lih4LmI4Lih4Li14LmB4LiX4LmH4Lia4LiC4Lit4LiH4LiV4Lix4Lin4LmA4Lit4LiHIOC5g+C4q+C5ieC4m+C4uOC5iOC4oSAi4LmA4Lie4Li04LmI4Lih4LmA4LiV4Li04LihIiDguKrguKfguYjguLLguIfguYHguJfguJkg4LiI4Liw4LmE4LiU',
  '4LmJ4Lij4Li54LmJ4Lin4LmI4Liy4Lit4Lii4Li54LmI4LiV4Lij4LiH4LmE4Lir4LiZCiAgdmFyIG1vcmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFiLW1vcmUnKTsKICBpZiAobW9yZSkgbW9yZS5jbGFzc0xpc3QudG9nZ2xlKCdvbicsICFQQUdFUy5z',
  'b21lKGZ1bmN0aW9uKHApeyByZXR1cm4gcC50YWIgJiYgcC5pZCA9PT0gcGFnZTsgfSkpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXYnKS5jbGFzc0xpc3QucmVtb3ZlKCdvcGVuJyk7CiAgcmVtb3ZlU2NyaW0oKTsKICBsb2FkKCk7Cn0KCmZ1bmN0aW9u',
  'IHJlZnJlc2goKXsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9CgpmdW5jdGlvbiBzZXRZZWFyKHkpewogIFMueWVhciA9IHk7CiAgbG9hZCgpOwp9CgovKioKICog4LmC4Lir4Lil4LiU4LiC4LmJ4Lit4Lih4Li54Lil4LiC4Lit4LiH4Lir4LiZ4LmJ4Liy4Lib4Lix',
  '4LiI4LiI4Li44Lia4Lix4LiZCiAqCiAqIEBwYXJhbSB7e3F1aWV0OmJvb2xlYW59PX0gb3B0cwogKiAgIHF1aWV0ID0g4LiL4Li04LiH4LiB4LmM4LmA4LiH4Li14Lii4LiaIOC5hiDguYDguJrguLfguYnguK3guIfguKvguKXguLHguIcg4LmE4Lih4LmI4Lil4LmJ',
  '4Liy4LiH4Lir4LiZ4LmJ4Liy4LmA4Lib4LmH4LiZ4Lin4LiH4LiB4Lil4Lih4Lir4Lih4Li44LiZIOC5geC4peC4sOC4hOC4t+C4meC4leC4s+C5geC4q+C4meC5iOC4h+C4l+C4teC5iOC5gOC4peC4t+C5iOC4reC4meC4hOC5ieC4suC4h+C5hOC4p+C5iQogKiAg',
  'ICAgICAgICAg4LmD4LiK4LmJ4Lir4Lil4Lix4LiH4LiB4LiU4Lia4Lix4LiZ4LiX4Li24LiBIOC5geC4peC4sOC4leC4reC4meC4nuC4muC4p+C5iOC4suC4oeC4teC4hOC4meC5geC4geC5ieC4guC5ieC4reC4oeC4ueC4peC4iOC4suC4geC4l+C4teC5iOC4reC4',
  't+C5iOC4mQogKiAgICAgICAgICAg4LmA4Lie4Li34LmI4Lit4LmD4Lir4LmJ4Lir4LiZ4LmJ4Liy4LiI4Lit4LiZ4Li04LmI4LiH4LiX4Li14LmI4Liq4Li44LiUIOC5hOC4oeC5iOC4geC4o+C4sOC4nuC4o+C4tOC4muC5geC4peC4sOC5hOC4oeC5iOC5gOC4lOC5',
  'ieC4h+C4geC4peC4seC4muC5hOC4m+C4muC4meC4quC4uOC4lAogKi8KZnVuY3Rpb24gbG9hZChvcHRzKXsKICBvcHRzID0gKG9wdHMgPT09IHRydWUpID8ge30gOiAob3B0cyB8fCB7fSk7ICAgICAvLyDguYDguJzguLfguYjguK3guYLguITguYnguJTguYDguIHg',
  'uYjguLLguJfguLXguYjguYDguKPguLXguKLguIEgbG9hZCh0cnVlKQogIHZhciBxdWlldCA9ICEhb3B0cy5xdWlldDsKICB2YXIgdmlldyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aWV3Jyk7CiAgdmFyIHIgPSBST1VURVNbUy5wYWdlXTsKICBpZiAoIXIp',
  'IHsgdmlldy5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz0iZW1wdHkiPuC5hOC4oeC5iOC4nuC4muC4q+C4meC5ieC4suC4meC4teC5iTwvZGl2Pic7IHJldHVybiBQcm9taXNlLnJlc29sdmUoKTsgfQoKICBpZiAoIXF1aWV0KSB7CiAgICB2aWV3LmlubmVySFRNTCA9',
  'ICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj48c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPjwvZGl2PuC4geC4s+C4peC4seC4h+C5guC4q+C4peC4lOC4guC5ieC4reC4oeC4ueC4peKApjwvZGl2Pic7CiAgfSBlbHNlIHsKICAgIHN5bmNTZXQo',
  'J3N5bmNpbmcnKTsKICB9CgogIHZhciBrZWVwID0gcXVpZXQgPyBzbmFwc2hvdFZpZXcoKSA6IG51bGw7CgogIHJldHVybiByLmxvYWQoKS50aGVuKGZ1bmN0aW9uKGRhdGEpewogICAgUy5jYWNoZVtTLnBhZ2VdID0gZGF0YTsKCiAgICAvLyDguKvguJnguYnguLLg',
  'uYHguJXguYjguKXguLDguKvguJnguYnguLLguKHguLXguJvguLXguYPguKvguYnguYDguKXguLfguK3guIHguYTguKHguYjguYDguJfguYjguLLguIHguLHguJkgKOC5gOC4iuC5iOC4meC4i+C4t+C5ieC4reC4guC4reC4h+C4oeC4teC4luC4tuC4h+C4m+C4tSAy',
  'NTYzIOC5geC4leC5iOC4o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKLguKHguLXguYHguITguYjguJvguLXguKXguYjguLLguKrguLjguJQpCiAgICAvLyDguJbguYnguLLguJvguLXguJfguLXguYjguITguYnguLLguIfguK3guKLguLnguYjg',
  'uYTguKHguYjguKHguLXguYPguJnguKvguJnguYnguLLguJnguLXguYkgc3luY1llYXJPcHRpb25zIOC4iOC4sOC4m+C4o+C4seC4muC4m+C4teC5g+C4q+C5iSDigJQg4LmB4LiV4LmI4LiC4LmJ4Lit4Lih4Li54Lil4LiX4Li14LmI4LmA4Lie4Li04LmI4LiH4LiU',
  '4Li24LiH4Lih4LiyCiAgICAvLyDguYDguJvguYfguJnguILguK3guIfguJvguLXguYDguIHguYjguLIg4Liq4LmI4Lin4LiZ4Lib4LmJ4Liy4Lii4LiB4Liz4LiB4Lix4Lia4LmD4LiK4LmJ4Lib4Li14LmD4Lir4Lih4LmIIOC4geC4peC4suC4ouC5gOC4m+C5h+C4',
  'meC4muC4reC4geC4p+C5iOC4siAi4Lii4Lit4LiU4LiL4Li34LmJ4LitIOC4m+C4tSAyMDI2ID0gMCDguJrguLLguJciCiAgICAvLyDguJfguLHguYnguIfguJfguLXguYjguJvguLXguJnguLHguYnguJnguKHguLXguKLguK3guJTguIjguKPguLTguIcg4oCUIOC4',
  'leC5ieC4reC4h+C4lOC4tuC4h+C5g+C4q+C4oeC5iOC5g+C4q+C5ieC4leC4o+C4h+C4geC4seC4muC4m+C4teC4l+C4teC5iOC4m+C4o+C4seC4muC5geC4peC5ieC4pwogICAgdmFyIHllYXJCZWZvcmUgPSBTdHJpbmcoUy55ZWFyKTsKICAgIHN5bmNZZWFyT3B0',
  'aW9ucyhkYXRhLnllYXJzIHx8IGRhdGEuYXZhaWxhYmxlIHx8IFtdKTsKICAgIGlmIChTdHJpbmcoUy55ZWFyKSAhPT0geWVhckJlZm9yZSAmJiAhb3B0cy5fcmV0cmllZCkgewogICAgICByZXR1cm4gbG9hZCh7IHF1aWV0OiBxdWlldCwgX3JldHJpZWQ6IHRydWUg',
  'fSk7CiAgICB9CgogICAgdmlldy5pbm5lckhUTUwgPSByLnJlbmRlcihkYXRhKTsKICAgIGxhYmVsQ2VsbHModmlldyk7CiAgICBhcHBseVJlYWRPbmx5KHZpZXcpOwogICAgaWYgKHIuYWZ0ZXIpIHIuYWZ0ZXIoZGF0YSk7CiAgICBpZiAoa2VlcCkgcmVzdG9yZVZp',
  'ZXcoa2VlcCk7CiAgICBpZiAocXVpZXQpIHN5bmNTZXQoJ3N5bmNlZCcpOwogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgaWYgKHF1aWV0KSB7ICAgICAgICAgICAgICAgICAgICAgICAvLyDguIvguLTguIfguIHguYzguYDguJrguLfguYnguK3guIfguKvguKXg',
  'uLHguIfguJ7guKXguLLguJQg4oCUIOC4reC4ouC5iOC4suC4l+C4tOC5ieC4h+C4guC4reC4h+C4l+C4teC5iOC5gOC4q+C5h+C4meC4reC4ouC4ueC5iAogICAgICBzeW5jU2V0KGlzT2ZmbGluZUVycm9yKGUpID8gJ29mZmxpbmUnIDogJ2Vycm9yJywgZS5tZXNz',
  'YWdlIHx8IGUpOwogICAgICByZXR1cm47CiAgICB9CiAgICB2aWV3LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJjYXJkIj48ZGl2IGNsYXNzPSJjYXJkLWIiPjxoMz7guYLguKvguKXguJTguILguYnguK3guKHguLnguKXguYTguKHguYjguKrguLPguYDguKPguYfg',
  'uIg8L2gzPicgKwogICAgICAgICAgICAgICAgICAgICAnPHAgY2xhc3M9Im11dGVkIj4nICsgZXNjKGUubWVzc2FnZXx8ZSkgKyAnPC9wPicgKwogICAgICAgICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJsb2FkKCkiPuC4peC4reC4',
  'h+C5g+C4q+C4oeC5iDwvYnV0dG9uPjwvZGl2PjwvZGl2Pic7CiAgfSk7Cn0KCi8qKiDguIjguLPguKrguKDguLLguJ7guKvguJnguYnguLLguIjguK3guYTguKfguYnguIHguYjguK3guJnguKfguLLguJTguYPguKvguKHguYgg4LmA4Lie4Li34LmI4Lit4LmD4Lir',
  '4LmJ4Lic4Li54LmJ4LmD4LiK4LmJ4Lij4Li54LmJ4Liq4Li24LiB4Lin4LmI4Liy4Lir4LiZ4LmJ4Liy4LmE4Lih4LmI4LmE4LiU4LmJ4LiW4Li54LiB4LmC4Lir4Lil4LiU4LmD4Lir4Lih4LmIICovCmZ1bmN0aW9uIHNuYXBzaG90VmlldygpewogIHZhciBvcGVu',
  'ID0gW107CiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmJpbGwtbGluZXMnKS5mb3JFYWNoKGZ1bmN0aW9uKGVsKXsKICAgIGlmICghZWwuaGlkZGVuKSBvcGVuLnB1c2goZWwuaWQpOwogIH0pOwogIHJldHVybiB7IHk6IHdpbmRvdy5zY3JvbGxZIHx8IDAs',
  'IG9wZW46IG9wZW4gfTsKfQoKZnVuY3Rpb24gcmVzdG9yZVZpZXcoa2VlcCl7CiAga2VlcC5vcGVuLmZvckVhY2goZnVuY3Rpb24oaWQpewogICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpOwogICAgaWYgKGVsKSB7IGVsLmhpZGRlbiA9IGZh',
  'bHNlOyB2YXIgYiA9IGVsLnByZXZpb3VzRWxlbWVudFNpYmxpbmc7CiAgICAgICAgICAgICAgaWYgKGIpIGIudGV4dENvbnRlbnQgPSBiLnRleHRDb250ZW50LnJlcGxhY2UoJ+KWvicsICfilrQnKTsgfQogIH0pOwogIGlmIChrZWVwLnkpIHdpbmRvdy5zY3JvbGxU',
  'bygwLCBrZWVwLnkpOwp9CgovKiog4LmA4LiV4Li04Lih4LiV4Lix4Lin4LmA4Lil4Li34Lit4LiB4Lib4Li14LmD4LiZ4LmB4LiW4Lia4Lia4LiZ4LmD4Lir4LmJ4LiV4Lij4LiH4LiB4Lix4Lia4LiC4LmJ4Lit4Lih4Li54Lil4LiI4Lij4Li04LiH4LiC4Lit4LiH',
  '4Lir4LiZ4LmJ4Liy4LiZ4Lix4LmJ4LiZICovCmZ1bmN0aW9uIHN5bmNZZWFyT3B0aW9ucyh5ZWFycyl7CiAgdmFyIHNlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd5ZWFyU2VsJyk7CiAgdmFyIGxpc3QgPSAoeWVhcnMgfHwgW10pLnNsaWNlKCkuc29ydChm',
  'dW5jdGlvbihhLGIpe3JldHVybiBiLWE7fSk7CiAgdmFyIGN1ciA9IG5ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKTsKICBpZiAobGlzdC5pbmRleE9mKGN1cikgPCAwKSBsaXN0LnVuc2hpZnQoY3VyKTsKICB2YXIgaHRtbCA9ICc8b3B0aW9uIHZhbHVlPSJhbGwiPuC4',
  'l+C4uOC4geC4m+C4tTwvb3B0aW9uPic7CiAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHkpewogICAgLy8g4LiE4LmI4Liy4LmD4LiZIG9wdGlvbiDguYDguJvguYfguJkg4LiELuC4qC4g4LmA4Liq4Lih4LitICjguJfguLHguYnguIfguKPguLDguJrguJrguYPguIrg',
  'uYnguJvguLXguJnguLXguYnguK3guYnguLLguIfguK3guLTguIcpIOC4quC5iOC4p+C4meC4guC5ieC4reC4hOC4p+C4suC4oeC5geC4peC5ieC4p+C5geC4leC5iOC4l+C4teC5iOC4leC4seC5ieC4h+C5hOC4p+C5iQogICAgaHRtbCArPSAnPG9wdGlvbiB2YWx1',
  'ZT0iJyArIHkgKyAnIj7guJvguLUgJyArIGRpc3BsYXlZZWFyKHkpICsKICAgICAgICAgICAgKHVzZUJ1ZGRoaXN0WWVhcigpID8gJyAo4LiELuC4qC4gJyArIHkgKyAnKScgOiAnJykgKyAnPC9vcHRpb24+JzsKICB9KTsKICBzZWwuaW5uZXJIVE1MID0gaHRtbDsK',
  'ICBpZiAobGlzdC5pbmRleE9mKE51bWJlcihTLnllYXIpKSA8IDAgJiYgUy55ZWFyICE9PSAnYWxsJykgUy55ZWFyID0gU3RyaW5nKGN1cik7CiAgc2VsLnZhbHVlID0gUy55ZWFyOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC5guC4q+C4oeC4lOC4lOC4ueC4reC4',
  'ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pyAtLS0tLS0tLS0tLS0tLS0tCiAgIOC4neC4seC5iOC4h+C5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jOC4geC4seC4meC5hOC4p+C5ieC5geC4peC5ieC4p+C5g+C4meC4n+C4seC4h+C4geC5jOC4iuC4seC4',
  'mSBhcGkoKSDguJXguKPguIfguJnguLXguYnguYHguITguYjguIvguYjguK3guJnguJvguLjguYjguKHguJfguLXguYjguIHguJTguYTguJvguIHguYfguJfguLPguYTguKHguYjguYTguJTguYkKICAg4LmA4Lie4Li34LmI4Lit4LmE4Lih4LmI4LmD4Lir4LmJ4Lic',
  '4Li54LmJ4LiX4Li14LmI4LmA4Lib4Li04LiU4LiU4LmJ4Lin4Lii4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4Liq4Lix4Lia4Liq4LiZICovCnZhciBFRElUX0VOVFJZUE9JTlRTID0gL1xiKGZvcm1EZWJ0fGZvcm1EZWJ0UGF5bWVudHxmb3JtUHVyY2hhc2V8',
  'Zm9ybUFjfGZvcm1CdWxrQWN8Zm9ybVJlcGFpcnxmb3JtQnVpbGRpbmd8Zm9ybVJvb218Zm9ybUZpbmFuY2V8Zm9ybVVzZXJ8ZGVsRGVidHxkZWxEZWJ0UGF5bWVudHxkZWxQdXJjaGFzZXxkZWxBY3xkZWxSZXBhaXJ8ZGVsQnVpbGRpbmd8ZGVsRmluYW5jZXxkZWxV',
  'c2VyfGRvSW1wb3J0SnNvbnxkb1JvdGF0ZVNoYXJlfGRvQmFja3VwTm93fHNhdmVTZXR0aW5nc0Zvcm0pXHMqXCgvOwoKZnVuY3Rpb24gYXBwbHlSZWFkT25seShyb290KXsKICBpZiAoY2FuRWRpdCgpKSByZXR1cm47CiAgdmFyIG5vZGVzID0gcm9vdC5xdWVyeVNl',
  'bGVjdG9yQWxsKCdbb25jbGlja10nKTsKICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7CiAgICBpZiAoRURJVF9FTlRSWVBPSU5UUy50ZXN0KG5vZGVzW2ldLmdldEF0dHJpYnV0ZSgnb25jbGljaycpIHx8ICcnKSkgbm9kZXNbaV0ucmVt',
  'b3ZlKCk7CiAgfQp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4o+C4teC5gOC4n+C4o+C4iuC4reC4seC4leC5guC4meC4oeC4seC4leC4tOC5gOC4oeC4t+C5iOC4reC4guC5ieC4reC4oeC4ueC4peC5g+C4meC4iuC4teC4leC5gOC4m+C4peC4teC5iOC4ouC4mSAt',
  'LS0tLS0tLS0tLS0tLS0tCgogICDguIHguI7guYDguKvguKXguYfguIHguILguK3guIfguKrguYjguKfguJnguJnguLXguYk6IOC4q+C5ieC4suC4oeC5guC4q+C4peC4lOC4l+C4seC4muC4quC4tOC5iOC4h+C4l+C4teC5iOC4nOC4ueC5ieC5g+C4iuC5ieC4geC4',
  's+C4peC4seC4h+C4nuC4tOC4oeC4nuC5jOC4reC4ouC4ueC5iOC5gOC4lOC5h+C4lOC4guC4suC4lAogICDguJbguYnguLLguKHguLXguILguYnguK3guKHguLnguKXguYPguKvguKHguYjguJXguK3guJnguJfguLXguYjguJzguLnguYnguYPguIrguYnguIHguLPg',
  'uKXguLHguIfguIHguKPguK3guIHguK3guKLguLnguYgg4LmD4Lir4LmJ4LiC4Li24LmJ4LiZ4Lib4Li44LmI4Lih4LmA4Lil4LmH4LiBIOC5hiDguYPguKvguYnguIHguJTguYDguK3guIfguYDguKHguLfguYjguK3guJ7guKPguYnguK3guKEKCiAgIOC4q+C4oeC4',
  'suC4ouC5gOC4q+C4leC4uDog4Lij4Li44LmI4LiZ4LiC4LmJ4Lit4Lih4Li54Lil4LiU4Li54LiI4Liy4LiBICLguYDguKfguKXguLLguJfguLXguYjguIrguLXguJXguJbguLnguIHguYHguIHguYnguKXguYjguLLguKrguLjguJQiIOC4guC4reC4hyBHb29nbGUg',
  'RHJpdmUKICAg4LiL4Li24LmI4LiH4LiC4Lii4Lix4Lia4LiX4Li44LiB4LiE4Lij4Lix4LmJ4LiH4LiX4Li14LmI4Lih4Li14LiB4Liy4Lij4LmA4LiC4Li14Lii4LiZIOC4o+C4p+C4oeC4luC4tuC4h+C4leC4reC4meC4l+C4teC5iOC5gOC4o+C4suC5gOC4reC4',
  'h+C4geC4lOC4muC4seC4meC4l+C4tuC4geC4lOC5ieC4p+C4ogogICDguIjguLbguIfguJXguYnguK3guIfguIjguJTguKPguLjguYjguJnguYPguKvguKHguYjguYTguKfguYnguKvguKXguLHguIfguJrguLHguJnguJfguLbguIHguJfguLjguIHguITguKPguLHg',
  'uYnguIcg4LmE4Lih4LmI4LiH4Lix4LmJ4LiZ4LiI4Liw4LmC4Lir4Lil4LiU4LiL4LmJ4Liz4LmB4Lil4Liw4LiC4Li24LmJ4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4LihCiAgIOC4p+C5iOC4siAi4Lih4Li14LiE4LiZ4LmB4LiB4LmJ4LiC4LmJ4Lit4Lih4Li54Lil',
  'IiDguJfguLHguYnguIfguJfguLXguYjguITguJnguYHguIHguYnguITguLfguK3guJzguLnguYnguYPguIrguYnguYDguK3guIcKLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovCgovKiog',
  '4LiE4Liz4Liq4Lix4LmI4LiH4LiX4Li14LmI4LiX4Liz4LmD4Lir4LmJ4LiC4LmJ4Lit4Lih4Li54Lil4LmD4LiZ4LiK4Li14LiV4LmA4Lib4Lil4Li14LmI4Lii4LiZICjguYPguKvguYnguJXguKPguIfguIHguLHguJogTVVUQVRJTkdfQUNUSU9OUyDguJ3guLHg',
  'uYjguIfguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYwpICovCnZhciBDTElFTlRfTVVUQVRJTkcgPSAvXC4oc2F2ZXxkZWxldGV8c2F2ZVBheW1lbnR8ZGVsZXRlUGF5bWVudHxidWxrQm9va3xpbXBvcnR8cm90YXRlVG9rZW58YmFja3VwTm93fHVwbG9h',
  'ZHx0cmFzaHx0b2dnbGV8c2V0U3RhdHVzfHJlY29uY2lsZSkkLzsKCi8qKgogKiDguYDguJ7guLTguYjguIfguIHguJTguJrguLHguJnguJfguLbguIHguYDguK3guIcg4oCUIOC4q+C4meC5ieC4suC5guC4q+C4peC4lOC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C4',
  'oeC5iOC5hOC4m+C5geC4peC5ieC4p+C4leC4reC4meC4geC4lOC4muC4seC4meC4l+C4tuC4gQogKiDguIjguJTguKPguLjguYjguJnguILguYnguK3guKHguLnguKXguKXguYjguLLguKrguLjguJTguYTguKfguYkg4LmB4Lil4Liw4LiB4Lix4LiZ4LmE4Lih4LmI',
  '4LmD4Lir4LmJ4Lij4Lit4Lia4LiV4Lij4Lin4LiI4LiW4Lix4LiU4LmE4Lib4LmC4Lir4Lil4LiU4LiL4LmJ4LizCiAqICjguYDguJzguLfguYjguK3guYTguKfguYkgMiDguJnguLLguJfguLUg4LmA4Lie4Lij4Liy4LiwIEdvb2dsZSBEcml2ZSDguK3guLHguJvg',
  'uYDguJTguJXguYDguKfguKXguLLguYHguIHguYnguYTguILguIrguYnguLLguIHguKfguYjguLLguIHguLLguKPguYDguILguLXguKLguJnguIjguKPguLTguIfguYDguKXguYfguIHguJnguYnguK3guKIpCiAqLwpmdW5jdGlvbiBtYXJrU2VsZkNoYW5nZSgpewog',
  'IFMuc2VsZkNoYW5nZVVudGlsID0gRGF0ZS5ub3coKSArIDEyMDAwMDsKICBjbGVhclRpbWVvdXQoUy5zeW5jVGltZXIpOwogIFMuc3luY1RpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpewogICAgc3luY1ZlcnNpb24oKTsKICAgIHJlZnJlc2hBbGVydHMoKTsg',
  'ICAgIC8vIOC4h+C4suC4meC4hOC5ieC4suC4h+C4reC4suC4iOC5gOC4nuC4tOC5iOC4oeC4q+C4o+C4t+C4reC4peC4lOC4iOC4suC4geC4quC4tOC5iOC4h+C4l+C4teC5iOC5gOC4nuC4tOC5iOC4h+C4muC4seC4meC4l+C4tuC4geC5hOC4mwogIH0sIDE1MDAp',
  'Owp9CgpmdW5jdGlvbiBzeW5jVmVyc2lvbigpewogIGNhbGxBcGkoJ2FwcC52ZXJzaW9uJykKICAgIC50aGVuKGZ1bmN0aW9uKHYpeyBpZiAodiAmJiB2LnZlcnNpb24pIFMudmVyc2lvbiA9IHYudmVyc2lvbjsgfSkKICAgIC5jYXRjaChmdW5jdGlvbigpeyAvKiDg',
  'uYTguKfguYnguKPguK3guJrguKvguJnguYnguLIgKi8gfSk7Cn0KCi8qKiDguJzguLnguYnguYPguIrguYnguIHguLPguKXguLHguIfguIHguKPguK3guIHguILguYnguK3guKHguLnguKXguK3guKLguLnguYjguKvguKPguLfguK3guYDguJvguKXguYjguLIg4oCU',
  'IOC4luC5ieC4suC5g+C4iuC5iCDguKvguYnguLLguKHguYLguKvguKXguJTguJfguLHguJogKi8KZnVuY3Rpb24gdXNlcklzQnVzeSgpewogIHZhciBtb2RhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb2RhbFJvb3QnKTsKICBpZiAobW9kYWwgJiYgbW9k',
  'YWwuaW5uZXJIVE1MKSByZXR1cm4gdHJ1ZTsgICAgICAgICAgICAgIC8vIOC4n+C4reC4o+C5jOC4oeC5gOC4m+C4tOC4lOC4hOC5ieC4suC4h+C4reC4ouC4ueC5iAogIHZhciBlbCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7CiAgaWYgKGVsICYmIC9eKElOUFVU',
  'fFRFWFRBUkVBfFNFTEVDVCkkLy50ZXN0KGVsLnRhZ05hbWUpICYmCiAgICAgIGVsLnR5cGUgIT09ICdidXR0b24nICYmIGVsLnR5cGUgIT09ICdzdWJtaXQnKSByZXR1cm4gdHJ1ZTsgICAvLyDguYDguITguK3guKPguYzguYDguIvguK3guKPguYzguK3guKLguLng',
  'uYjguYPguJnguIrguYjguK3guIfguIHguKPguK3guIEKICByZXR1cm4gZmFsc2U7Cn0KCmZ1bmN0aW9uIHJlZnJlc2hMYWJlbChzZWMpewogIGlmICghc2VjKSByZXR1cm4gJ+C4m+C4tOC4lOC4geC4suC4o+C4leC4o+C4p+C4iOC4reC4seC4leC5guC4meC4oeC4',
  'seC4leC4tCc7CiAgaWYgKHNlYyAlIDM2MDAgPT09IDApIHJldHVybiAn4LiV4Lij4Lin4LiI4LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmI4LiX4Li44LiBICcgKyAoc2VjIC8gMzYwMCkgKyAnIOC4iuC4seC5iOC4p+C5guC4oeC4hyc7CiAgaWYgKHNlYyAl',
  'IDYwID09PSAwKSByZXR1cm4gJ+C4leC4o+C4p+C4iOC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C4oeC5iOC4l+C4uOC4gSAnICsgKHNlYyAvIDYwKSArICcg4LiZ4Liy4LiX4Li1JzsKICByZXR1cm4gJ+C4leC4o+C4p+C4iOC4guC5ieC4reC4oeC4ueC4peC5g+C4',
  'q+C4oeC5iOC4l+C4uOC4gSAnICsgc2VjICsgJyDguKfguLTguJnguLLguJfguLUnOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4leC4seC4p+C4muC4reC4geC4quC4luC4suC4meC4sOC4geC4suC4o+C4i+C4tOC4h+C4geC5jCAo4Lih4Li44Lih4LiC4Lin4Liy',
  '4Lia4LiZKSAtLS0tLS0tLS0tLS0tLS0tCgogICDguKvguJnguYnguLLguJfguLXguYg6IOC4muC4reC4geC5g+C4q+C5ieC4o+C4ueC5ieC4leC4peC4reC4lOC4p+C5iOC4suC4leC4reC4meC4meC4teC5ieC4guC5ieC4reC4oeC4ueC4peC4leC4o+C4h+C4geC4',
  'seC4muC4q+C4peC4seC4h+C4muC5ieC4suC4meC4q+C4o+C4t+C4reC4ouC4seC4hwogICDguIHguLPguKXguLHguIfguJrguLHguJnguJfguLbguIHguK3guKLguLnguYjguYTguKvguKEg4Lir4Lij4Li34Lit4Lih4Li14Lit4Liw4LmE4Lij4LiE4LmJ4Liy4LiH',
  '4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LiI4Lix4LiU4LiB4Liy4LijCgogICDguJXguLHguYnguIfguYPguIjguYPguKvguYkgIuC5gOC4h+C4teC4ouC4muC5gOC4oeC4t+C5iOC4reC4l+C4uOC4geC4reC4ouC5iOC4suC4h+C4m+C4geC4leC4tCDguYHguKXguLDg',
  'uIrguLHguJTguYDguIjguJnguYDguKHguLfguYjguK3guKHguLXguK3guLDguYTguKPguJzguLTguJTguJvguIHguJXguLQiCiAgIOC4quC4luC4suC4meC4sOC4l+C4teC5iOC4leC5ieC4reC4h+C5g+C4q+C5ieC4nOC4ueC5ieC5g+C4iuC5ieC4l+C4s+C4reC4',
  'sOC5hOC4o+C4leC5iOC4rSAo4Lih4Li14LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmIIC8g4LmA4LiK4Li34LmI4Lit4Lih4LiV4LmI4Lit4LmE4Lih4LmI4LmE4LiU4LmJKSDguIHguJTguYTguJTguYkKLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0t',
  'LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovCgp2YXIgU1lOQyA9IHsgc3RhdGU6ICdzeW5jZWQnLCBkZXRhaWw6ICcnLCBhdDogMCwgdGltZXI6IG51bGwgfTsKCnZhciBTWU5DX0xPT0sgPSB7CiAgc3luY2VkOiAgeyBjbHM6ICdvaycsICAg',
  'aWNvbjogJ+KXjycsICB0ZXh0OiAn4LiL4Li04LiH4LiB4LmM4LmB4Lil4LmJ4LinJyB9LAogIHN5bmNpbmc6IHsgY2xzOiAnaW5mbycsIGljb246ICcnLCAgIHRleHQ6ICfguIHguLPguKXguLHguIfguIvguLTguIfguIHguYzigKYnLCAgIHNwaW46IHRydWUgfSwK',
  'ICBzYXZpbmc6ICB7IGNsczogJ2luZm8nLCBpY29uOiAnJywgICB0ZXh0OiAn4LiB4Liz4Lil4Lix4LiH4Lia4Lix4LiZ4LiX4Li24LiB4oCmJywgIHNwaW46IHRydWUgfSwKICBzYXZlZDogICB7IGNsczogJ29rJywgICBpY29uOiAn4pyTJywgIHRleHQ6ICfguJrg',
  'uLHguJnguJfguLbguIHguYHguKXguYnguKcnIH0sCiAgcGVuZGluZzogeyBjbHM6ICd3YXJuJywgaWNvbjogJ+KGuycsICB0ZXh0OiAn4Lih4Li14LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmIJywgIGNsaWNrOiAnbG9hZFBlbmRpbmcoKScgfSwKICBvZmZs',
  'aW5lOiB7IGNsczogJ2RncicsICBpY29uOiAn4pqgJywgIHRleHQ6ICfguYDguIrguLfguYjguK3guKHguJXguYjguK3guYTguKHguYjguYTguJTguYknLCBjbGljazogJ3JldHJ5U3luYygpJyB9LAogIGVycm9yOiAgIHsgY2xzOiAnZGdyJywgIGljb246ICfimqAn',
  'LCAgdGV4dDogJ+C4muC4seC4meC4l+C4tuC4geC5hOC4oeC5iOC4quC4s+C5gOC4o+C5h+C4iCcsIGNsaWNrOiAncmV0cnlTeW5jKCknIH0sCiAgcGF1c2VkOiAgeyBjbHM6ICdtdXRlJywgaWNvbjogJ+KXiycsICB0ZXh0OiAn4LmE4Lih4LmI4LiV4Lij4Lin4LiI',
  '4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0JywgY2xpY2s6ICdsb2FkUGVuZGluZygpJyB9Cn07CgovKioKICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlIOC4iuC4t+C5iOC4reC4quC4luC4suC4meC4sOC5g+C4mSBTWU5DX0xPT0sKICogQHBhcmFtIHtzdHJpbmc9',
  'fSBkZXRhaWwg4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Lit4LiY4Li04Lia4Liy4Lii4LmA4Lie4Li04LmI4LihICjguYLguJzguKXguYjguJXguK3guJnguYDguK3guLLguYDguKHguLLguKrguYzguIrguLXguYkpCiAqLwpmdW5jdGlvbiBzeW5jU2V0KHN0YXRlLCBk',
  'ZXRhaWwpewogIC8vIOC4quC4luC4suC4meC4sOC4l+C4teC5iOC4leC5ieC4reC4h+C5g+C4q+C5ieC4nOC4ueC5ieC5g+C4iuC5ieC4iOC4seC4lOC4geC4suC4oyDguKvguYnguLLguKHguJbguLnguIHguKrguJbguLLguJnguLDguJfguLHguYjguKfguYTguJvg',
  'uKHguLLguIHguKXguJrguJfguLTguYnguIcKICBpZiAoKFNZTkMuc3RhdGUgPT09ICdwZW5kaW5nJyB8fCBTWU5DLnN0YXRlID09PSAnb2ZmbGluZScpICYmCiAgICAgIChzdGF0ZSA9PT0gJ3N5bmNlZCcgfHwgc3RhdGUgPT09ICdzeW5jaW5nJykpIHJldHVybjsK',
  'CiAgU1lOQy5zdGF0ZSA9IHN0YXRlOwogIFNZTkMuZGV0YWlsID0gZGV0YWlsIHx8ICcnOwogIGlmIChzdGF0ZSA9PT0gJ3N5bmNlZCcgfHwgc3RhdGUgPT09ICdzYXZlZCcpIFNZTkMuYXQgPSBEYXRlLm5vdygpOwogIHN5bmNQYWludCgpOwoKICBjbGVhclRpbWVv',
  'dXQoU1lOQy50aW1lcik7CiAgaWYgKHN0YXRlID09PSAnc2F2ZWQnKSB7ICAgICAgICAgICAgICAgICAgICAgICAvLyDguYLguIrguKfguYwgIuC4muC4seC4meC4l+C4tuC4geC5geC4peC5ieC4pyIg4LmB4Lib4LmK4Lia4LmA4LiU4Li14Lii4Lin4LmB4Lil4LmJ',
  '4Lin4LiB4Lil4Lix4Lia4LmE4Lib4Lib4LiB4LiV4Li0CiAgICBTWU5DLnRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpewogICAgICBpZiAoU1lOQy5zdGF0ZSA9PT0gJ3NhdmVkJykgc3luY1NldCgnc3luY2VkJyk7CiAgICB9LCAyNjAwKTsKICB9Cn0KCmZ1',
  'bmN0aW9uIHN5bmNQYWludCgpewogIHZhciBkb3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGl2ZURvdCcpOwogIGlmICghZG90KSByZXR1cm47CiAgdmFyIGxvb2sgPSBTWU5DX0xPT0tbU1lOQy5zdGF0ZV0gfHwgU1lOQ19MT09LLnN5bmNlZDsKCiAgdmFy',
  'IHRpcCA9IFNZTkMuZGV0YWlsIHx8IHN5bmNUb29sdGlwKCk7CiAgLy8g4Lir4LmI4Lit4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LmE4Lin4LmJIOC5gOC4nuC4t+C5iOC4reC5g+C4q+C5ieC4iOC4reC5geC4hOC4muC4i+C5iOC4reC4meC5gOC4ieC4nuC4suC4sOC4',
  'guC5ieC4reC4hOC4p+C4suC4oeC5geC4peC4sOC4ouC4seC4h+C5gOC4q+C5h+C4meC5hOC4reC4hOC4reC4meC4reC4ouC4ueC5iAogIHZhciBib2R5ID0gKGxvb2suc3BpbiA/ICc8c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiAnIDogKGxvb2suaWNvbiA/IGxv',
  'b2suaWNvbiArICcgJyA6ICcnKSkgKwogICAgICAgICAgICAgJzxzcGFuIGNsYXNzPSJzeW5jLWxhYmVsIj4nICsgbG9vay50ZXh0ICsgJzwvc3Bhbj4nOwogIHZhciBjbHMgPSAnYiAnICsgbG9vay5jbHMgKyAnIHN5bmMtcGlsbCc7CgogIGRvdC5pbm5lckhUTUwg',
  'PSBsb29rLmNsaWNrCiAgICA/ICc8YnV0dG9uIGNsYXNzPSInICsgY2xzICsgJyIgc3R5bGU9ImJvcmRlcjowO2N1cnNvcjpwb2ludGVyO2ZvbnQ6aW5oZXJpdCIgJyArCiAgICAgICd0aXRsZT0iJyArIGVzYyh0aXApICsgJyIgb25jbGljaz0iJyArIGxvb2suY2xp',
  'Y2sgKyAnIj4nICsgYm9keSArICc8L2J1dHRvbj4nCiAgICA6ICc8c3BhbiBjbGFzcz0iJyArIGNscyArICciIHRpdGxlPSInICsgZXNjKHRpcCkgKyAnIj4nICsgYm9keSArICc8L3NwYW4+JzsKfQoKZnVuY3Rpb24gc3luY1Rvb2x0aXAoKXsKICB2YXIgYmFzZSA9',
  'IHJlZnJlc2hMYWJlbChQT0xMX1NFQ09ORFMpICsgJyDCtyDguYTguKHguYjguYLguKvguKXguJTguJfguLHguJrguJXguK3guJnguIHguLPguKXguLHguIfguIHguKPguK3guIHguILguYnguK3guKHguLnguKUnOwogIGlmICghU1lOQy5hdCkgcmV0dXJuIGJhc2U7',
  'CiAgdmFyIGQgPSBuZXcgRGF0ZShTWU5DLmF0KTsKICB2YXIgaGggPSAoJzAnICsgZC5nZXRIb3VycygpKS5zbGljZSgtMiksIG1tID0gKCcwJyArIGQuZ2V0TWludXRlcygpKS5zbGljZSgtMik7CiAgcmV0dXJuICfguJXguKPguIfguIHguLHguJrguILguYnguK3g',
  'uKHguLnguKXguKvguKXguLHguIfguJrguYnguLLguJnguYDguKHguLfguYjguK0gJyArIGhoICsgJzonICsgbW0gKyAnIOC4mS5cbicgKyBiYXNlOwp9CgovKiog4LmA4LiZ4LmH4LiV4Liq4Liw4LiU4Li44LiUL+C4q+C4peC4uOC4lCDguJXguYjguLLguIfguIjg',
  'uLLguIEgIuC5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jOC4leC4reC4muC4p+C5iOC4suC4l+C4s+C5hOC4oeC5iOC5hOC4lOC5iSIg4LiL4Li24LmI4LiH4LmA4Lib4LmH4LiZ4LiE4Lin4Liy4Lih4Lic4Li04LiU4LiC4Lit4LiH4LiE4Liz4Liq4Lix',
  '4LmI4LiHICovCmZ1bmN0aW9uIGlzT2ZmbGluZUVycm9yKGUpewogIGlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3Iub25MaW5lID09PSBmYWxzZSkgcmV0dXJuIHRydWU7CiAgdmFyIG0gPSBTdHJpbmcoKGUgJiYgZS5tZXNz',
  'YWdlKSB8fCBlIHx8ICcnKTsKICByZXR1cm4gL25ldHdvcmt8ZmFpbGVkfHRpbWVvdXR84LmA4LiE4Lij4Li34Lit4LiC4LmI4Liy4LiifOC5gOC4iuC4t+C5iOC4reC4oeC4leC5iOC4rXzguYTguKHguYjguYTguJTguYnguKPguLHguJrguILguYnguK3guKHguLng',
  'uKXguIjguLLguIHguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYwvaS50ZXN0KG0pOwp9CgovKiog4Lic4Li54LmJ4LmD4LiK4LmJ4LiB4LiU4LiX4Li14LmI4LiV4Lix4Lin4Lia4Lit4LiB4Liq4LiW4Liy4LiZ4Liw4LiV4Lit4LiZ4Lih4Li14Lib4Lix',
  '4LiN4Lir4LiyIOKAlCDguKXguK3guIfguYPguKvguKHguYjguJfguLHguJnguJfguLUgKi8KZnVuY3Rpb24gcmV0cnlTeW5jKCl7CiAgU1lOQy5zdGF0ZSA9ICdzeW5jaW5nJzsKICBzeW5jUGFpbnQoKTsKICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7Cn0KCi8qKiDg',
  'uYLguKvguKXguJTguILguYnguK3guKHguLnguKXguYPguKvguKHguYjguJXguK3guJnguJfguLXguYjguJzguLnguYnguYPguIrguYnguJ7guKPguYnguK3guKEgKOC4geC4lOC4iOC4suC4geC4m+C5ieC4suC4oiAi4Lih4Li14LiC4LmJ4Lit4Lih4Li54Lil4LmD',
  '4Lir4Lih4LmIIikgKi8KZnVuY3Rpb24gbG9hZFBlbmRpbmcoKXsKICBTWU5DLnN0YXRlID0gJ3N5bmNpbmcnOwogIHN5bmNQYWludCgpOwogIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKfQoKdmFyIFBPTExfU0VDT05EUyA9IDA7CnZhciBQT0xMX1RJTUVSID0gbnVs',
  'bDsKCmZ1bmN0aW9uIHN0YXJ0UG9sbGluZyhzZWNvbmRzKXsKICB2YXIgc2VjID0gTnVtYmVyKHNlY29uZHMgfHwgMCk7CiAgUE9MTF9TRUNPTkRTID0gc2VjOwogIGNsZWFySW50ZXJ2YWwoUE9MTF9USU1FUik7CgogIGlmICghc2VjKSB7IHN5bmNTZXQoJ3BhdXNl',
  'ZCcpOyByZXR1cm47IH0gICAvLyDguJvguLTguJTguIHguLLguKPguJXguKPguKfguIjguK3guLHguJXguYLguJnguKHguLHguJXguLQg4oCUIOC4geC4lOC4l+C4teC5iOC4m+C5ieC4suC4ouC5gOC4nuC4t+C5iOC4reC4i+C4tOC4h+C4geC5jOC5gOC4reC4h+C5',
  'hOC4lOC5iQogIHN5bmNTZXQoJ3N5bmNlZCcpOwoKICBQT0xMX1RJTUVSID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKXsKICAgIGlmIChkb2N1bWVudC5oaWRkZW4pIHJldHVybjsKICAgIGNhbGxBcGkoJ2FwcC52ZXJzaW9uJykudGhlbihmdW5jdGlvbih2KXsKICAg',
  'ICAgaWYgKFNZTkMuc3RhdGUgPT09ICdvZmZsaW5lJykgc3luY1NldCgnc3luY2VkJyk7ICAgLy8g4LiB4Lil4Lix4Lia4Lih4Liy4LiV4LmI4Lit4LmE4LiU4LmJ4LmB4Lil4LmJ4LinCiAgICAgIGlmICghdiB8fCAhdi52ZXJzaW9uIHx8IHYudmVyc2lvbiA9PT0g',
  'Uy52ZXJzaW9uKSByZXR1cm47CiAgICAgIFMudmVyc2lvbiA9IHYudmVyc2lvbjsKCiAgICAgIC8vIOC5gOC4o+C4suC5gOC4m+C5h+C4meC4hOC4meC5geC4geC5ieC5gOC4reC4hyDguYHguKXguLDguKvguJnguYnguLLguIHguYfguIvguLTguIfguIHguYzguYTg',
  'uJvguYHguKXguYnguKfguJXguK3guJnguIHguJTguJrguLHguJnguJfguLbguIEKICAgICAgaWYgKERhdGUubm93KCkgPCBTLnNlbGZDaGFuZ2VVbnRpbCkgcmV0dXJuOwoKICAgICAgLy8g4LiB4Liz4Lil4Lix4LiH4LiB4Lij4Lit4LiB4LiC4LmJ4Lit4Lih4Li5',
  '4Lil4Lit4Lii4Li54LmIIOKAlCDguKvguYnguLLguKHguYLguKvguKXguJTguJfguLHguJog4Lij4Lit4LmD4Lir4LmJ4Lic4Li54LmJ4LmD4LiK4LmJ4LiB4LiU4LmA4Lit4LiHCiAgICAgIGlmICh1c2VySXNCdXN5KCkpIHsgc3luY1NldCgncGVuZGluZycpOyBy',
  'ZXR1cm47IH0KCiAgICAgIC8vIOC4i+C4tOC4h+C4geC5jOC5gOC4h+C4teC4ouC4miDguYYg4LmE4Lih4LmI4Lil4LmJ4Liy4LiH4Lir4LiZ4LmJ4LiyIOC5hOC4oeC5iOC5gOC4lOC5ieC4h+C4geC4peC4seC4muC5hOC4m+C4muC4meC4quC4uOC4lAogICAgICBs',
  'b2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAgICAgIHJlZnJlc2hBbGVydHMoKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICBzeW5jU2V0KGlzT2ZmbGluZUVycm9yKGUpID8gJ29mZmxpbmUnIDogJ2Vycm9yJywgKGUgJiYgZS5tZXNzYWdlKSB8fCBTdHJp',
  'bmcoZSkpOwogICAgfSk7CiAgfSwgc2VjICogMTAwMCk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4Lio4Li54LiZ4Lii4LmM4LmB4LiI4LmJ4LiH4LmA4LiV4Li34Lit4LiZIC0tLS0tLS0tLS0tLS0tLS0KCiAgIOC4leC4seC4p+C5gOC4peC4guC4muC4meC5gOC4',
  'oeC4meC4uSAo4LmA4LiK4LmI4LiZIDYg4Lir4Lil4Lix4LiHICLguKXguYnguLLguIfguYHguK3guKPguYwiKSDguIHguLHguJrguIHguKXguYjguK3guIfguYHguIjguYnguIfguYDguJXguLfguK3guJnguJrguJnguYHguJbguJrguKvguLHguKcKICAg4LmD4LiK',
  '4LmJ4LiC4LmJ4Lit4Lih4Li54Lil4LiK4Li44LiU4LmA4LiU4Li14Lii4Lin4LiB4Lix4LiZ4LiI4Liy4LiB4LiE4Liz4Liq4Lix4LmI4LiHIGFwcC5hbGVydHMg4LiL4Li24LmI4LiH4LmA4Lia4Liy4LiB4Lin4LmI4Liy4LmB4LiU4LiK4Lia4Lit4Lij4LmM4LiU',
  '4Lih4Liy4LiBCgogICDguK3guLHguJvguYDguJTguJXguYDguKHguLfguYjguK06IOC5gOC4m+C4tOC4lOC4o+C4sOC4muC4miDCtyDguKvguKXguLHguIfguIHguJTguJrguLHguJnguJfguLbguIEv4Lil4Lia4LiX4Li44LiB4LiE4Lij4Lix4LmJ4LiHIMK3IOC4',
  'l+C4uOC4geC4o+C4reC4muC4leC4o+C4p+C4iOC4guC5ieC4reC4oeC4ueC4pQogICDguYDguJTguLTguKHguJXguLHguKfguYDguKXguILguJnguLXguYnguK3guLHguJvguYDguJTguJXguJXguK3guJnguYDguJvguLTguJTguKvguJnguYnguLLguYHguJTguIrg',
  'uJrguK3guKPguYzguJTguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcKICAg4LmE4Lib4Lit4Lii4Li54LmI4Lir4LiZ4LmJ4Liy4Lit4Li34LmI4LiZ4LmB4Lil4LmJ4Lin4LiV4Lix4Lin4LmA4Lil4LiC4LiI4Li24LiH4LiE4LmJ4Liy4LiH4Lit4Lii4Li5',
  '4LmI4LiX4Li14LmI4LiE4LmI4Liy4LmA4LiB4LmI4LiyCi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqLwoKdmFyIEFMRVJUUyA9IHsgY291bnRzOiB7fSwgaXRlbXM6IFtdLCB0b3RhbDog',
  'MCwgdXJnZW50OiAwLCBhdDogJycgfTsKCi8qCiAqICLguYDguKvguYfguJnguYHguKXguYnguKciIOKAlCDguJXguLHguKfguYDguKXguILguJrguJnguIHguKPguLDguJTguLTguYjguIfguJnguLHguJrguYDguInguJ7guLLguLDguYDguKPguLfguYjguK3guIfg',
  'uJfguLXguYjguKLguLHguIfguYTguKHguYjguYDguITguKLguYDguKvguYfguJkKICog4LmA4Lib4Li04LiU4LiB4Lil4LmI4Lit4LiH4LiU4Li54LmB4Lil4LmJ4Lin4LiV4Lix4Lin4LmA4Lil4LiC4Lir4Liy4LiiIOC5geC4leC5iOC4o+C4suC4ouC4geC4suC4',
  'o+C4ouC4seC4h+C4reC4ouC4ueC5iOC5g+C4meC4geC4peC5iOC4reC4h+C4iOC4meC4geC4p+C5iOC4suC4iOC4sOC5geC4geC5ieC4l+C4teC5iOC4leC5ieC4meC5gOC4q+C4leC4uAogKiDguYDguKPguLfguYjguK3guIfguYPguKvguKHguYjguKvguKPguLfg',
  'uK3guYDguKPguLfguYjguK3guIfguYDguJTguLTguKHguJfguLXguYjguKvguJnguLHguIHguILguLbguYnguJkgKOC5gOC4iuC5iOC4mSDguIfguLLguJnguIvguYjguK3guKHguYDguJ7guLTguYjguIfguYDguKXguKLguIHguLPguKvguJnguJQpIOC5hOC4lOC5',
  'ieC4o+C4q+C4seC4quC5g+C4q+C4oeC5iCDguJXguLHguKfguYDguKXguILguIjguLbguIfguIHguKXguLHguJrguKHguLLguYDguK3guIcKICoKICog4Lil4LmH4Lit4LiB4Lit4Li04LiZ4LiU4LmJ4Lin4Lii4Lia4Lix4LiN4LiK4Li1IOKGkiDguIjguLPguYTg',
  'uKfguYnguJfguLXguYjguJrguLHguI3guIrguLUgKOC5gOC4m+C4tOC4lOC4oeC4t+C4reC4luC4t+C4reC4q+C4o+C4t+C4reC4hOC4reC4oeC4geC5h+C4leC4o+C4h+C4geC4seC4mSkKICog4LmA4LiC4LmJ4Liy4LiU4LmJ4Lin4Lii4LiB4Li44LiN4LmB4LiI',
  'L+C4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jCAo4LmE4Lih4LmI4Lih4Li14Lia4Lix4LiN4LiK4Li1KSDihpIg4LiI4Liz4LmE4Lin4LmJ4LmD4LiZ4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJCiAqLwp2YXIgU0VFTl9MT0NBTF9LRVkgPSAnbWNvcm5l',
  'ci5hbGVydFNlZW4nOwp2YXIgTk9USUZfTkVXID0ge307ICAgICAgLy8g4LmA4Lij4Li34LmI4Lit4LiH4LiX4Li14LmIICLguYPguKvguKHguYgiIOC4leC4reC4meC5gOC4m+C4tOC4lOC4geC4peC5iOC4reC4h+C4o+C4reC4muC4meC4teC5iSDigJQg4Lii4Lix',
  '4LiH4LiV4Li04LiU4Lib4LmJ4Liy4Lii4LmD4Lir4Lih4LmI4LmD4Lir4LmJ4LmA4Lir4LmH4LiZ4LiI4LiZ4LiB4Lin4LmI4Liy4LiI4Liw4Lib4Li04LiU4LiB4Lil4LmI4Lit4LiHCnZhciBTRUVOX1RISVNfUEFHRSA9IHt9OyAvLyDguIjguJTguYDguKvguYfg',
  'uJnguYHguKXguYnguKfguYTguJvguYHguKXguYnguKfguJXguLHguYnguIfguYHguJXguYjguYDguJvguLTguJTguKvguJnguYnguLIg4oCUIOC4geC4seC4meC4nOC4peC4reC5iOC4suC4meC4l+C4teC5iOC4quC5iOC4h+C4oeC4suC4geC5iOC4reC4meC4muC4',
  'seC4meC4l+C4tuC4geC5gOC4quC4o+C5h+C4iCDguJfguLPguYPguKvguYnguJXguLHguKfguYDguKXguILguYDguJTguYnguIfguIHguKXguLHguJoKCmZ1bmN0aW9uIGxvY2FsU2VlbigpewogIHRyeSB7IHZhciB2ID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2Uu',
  'Z2V0SXRlbShTRUVOX0xPQ0FMX0tFWSkgfHwgJ1tdJyk7IHJldHVybiBBcnJheS5pc0FycmF5KHYpID8gdiA6IFtdOyB9CiAgY2F0Y2ggKGUpIHsgcmV0dXJuIFtdOyB9Cn0KCi8qKiDguJTguLHguIrguJnguLXguILguK3guIfguJfguLjguIHguYDguKPguLfguYjg',
  'uK3guIcgKOC4o+C4suC4ouC4peC4sOC5gOC4reC4teC4ouC4lOC4reC4suC4iOC4quC5iOC4h+C4oeC4suC5hOC4oeC5iOC4hOC4o+C4miDguYHguJXguYjguJTguLHguIrguJnguLXguITguKPguJrguYDguKrguKHguK0pICovCmZ1bmN0aW9uIGFsZXJ0SW5kZXgo',
  'KXsKICByZXR1cm4gQUxFUlRTLmluZGV4IHx8IChBTEVSVFMuaXRlbXMgfHwgW10pLm1hcChmdW5jdGlvbihhKXsgcmV0dXJuIHsga2V5OiBhLmtleSwgbW9kdWxlOiBhLm1vZHVsZSwgbGV2ZWw6IGEubGV2ZWwsIHNlZW46IGEuc2VlbiB9OyB9KTsKfQoKLyoKICog',
  '4Lij4Lir4Lix4LiqID0gIuC4leC5ieC4meC5gOC4o+C4t+C5iOC4reC4hyPguKPguLDguJTguLHguJoiIOKAlCDguYDguKvguYfguJnguYHguKXguYnguKfguJbguYnguLLguYDguITguKLguYDguKvguYfguJnguJXguYnguJnguYDguKPguLfguYjguK3guIfguYDg',
  'uJTguLXguKLguKfguIHguLHguJnguJfguLXguYjguKPguLDguJTguLHguJrguYDguJfguYjguLLguJnguLXguYnguKvguKPguLfguK3guKvguJnguLHguIHguIHguKfguYjguLIKICogKOC4geC4leC4tOC4geC4suC5gOC4lOC4teC4ouC4p+C4geC4seC4miBhbGVy',
  'dEtleVNlZW5fIOC4neC4seC5iOC4h+C5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jCkg4LmA4Lij4Li34LmI4Lit4LiH4Lir4LiZ4Lix4LiB4LiC4Li24LmJ4LiZ4LmA4LiV4Li34Lit4LiZ4Lit4Li14LiBIMK3IOC5gOC4muC4suC4peC4h+C5hOC4oeC5',
  'iOC5gOC4leC4t+C4reC4meC4i+C5ieC4swogKi8KZnVuY3Rpb24gYWxlcnRCYXNlKGspeyBrID0gU3RyaW5nKGspOyB2YXIgaSA9IGsubGFzdEluZGV4T2YoJyMnKTsgcmV0dXJuIGkgPCAwID8gayA6IGsuc2xpY2UoMCwgaSk7IH0KZnVuY3Rpb24gYWxlcnRSYW5r',
  'KGspeyBrID0gU3RyaW5nKGspOyB2YXIgaSA9IGsubGFzdEluZGV4T2YoJyMnKTsgcmV0dXJuIGkgPCAwID8gMCA6IChOdW1iZXIoay5zbGljZShpICsgMSkpIHx8IDApOyB9CgovKiog4Lij4Liw4LiU4Lix4Lia4Liq4Li54LiH4Liq4Li44LiU4LiX4Li14LmI4LmA',
  '4Lir4LmH4LiZ4LmB4Lil4LmJ4Lin4LiC4Lit4LiH4LmB4LiV4LmI4Lil4Liw4LiV4LmJ4LiZ4LmA4Lij4Li34LmI4Lit4LiHIOKAlCDguITguLPguJnguKfguJPguITguKPguLHguYnguIfguYDguJTguLXguKLguKfguJXguYjguK3guIHguLLguKPguKfguLLguJQg',
  'Ki8KZnVuY3Rpb24gc2VlblNldCgpewogIHZhciBiZXN0ID0ge307CiAgZnVuY3Rpb24gYWRkKGspeyB2YXIgYiA9IGFsZXJ0QmFzZShrKSwgciA9IGFsZXJ0UmFuayhrKTsgaWYgKCEoYiBpbiBiZXN0KSB8fCByID4gYmVzdFtiXSkgYmVzdFtiXSA9IHI7IH0KICBP',
  'YmplY3Qua2V5cyhTRUVOX1RISVNfUEFHRSkuZm9yRWFjaChhZGQpOwogIGlmIChBTEVSVFMuc2VlblN0b3JlID09PSAnYWNjb3VudCcpIGFsZXJ0SW5kZXgoKS5mb3JFYWNoKGZ1bmN0aW9uKGEpeyBpZiAoYS5zZWVuKSBhZGQoYS5rZXkpOyB9KTsKICBlbHNlIGxv',
  'Y2FsU2VlbigpLmZvckVhY2goYWRkKTsKICByZXR1cm4gYmVzdDsKfQpmdW5jdGlvbiBpc1NlZW5JbihiZXN0LCBrZXkpeyB2YXIgYiA9IGFsZXJ0QmFzZShrZXkpOyByZXR1cm4gKGIgaW4gYmVzdCkgJiYgYmVzdFtiXSA+PSBhbGVydFJhbmsoa2V5KTsgfQpmdW5j',
  'dGlvbiB1bnNlZW5BbGVydHMoYmVzdCl7CiAgYmVzdCA9IGJlc3QgfHwgc2VlblNldCgpOwogIHJldHVybiBhbGVydEluZGV4KCkuZmlsdGVyKGZ1bmN0aW9uKGEpeyByZXR1cm4gIWlzU2VlbkluKGJlc3QsIGEua2V5KTsgfSk7Cn0KCi8qKiDguIjguJTguKfguYjg',
  'uLLguYDguKvguYfguJnguYHguKXguYnguKfguJfguLjguIHguYDguKPguLfguYjguK3guIfguJfguLXguYjguITguYnguLLguIfguK3guKLguLnguYjguJXguK3guJnguJnguLXguYkgKOC5gOC4m+C4tOC4lOC4geC4peC5iOC4reC4hyA9IOC5gOC4q+C5h+C4meC4',
  'l+C4seC5ieC4h+C4q+C4oeC4lCDguKPguKfguKHguYDguKPguLfguYjguK3guIfguJfguLXguYjguK3guKLguLnguYjguYDguIHguLTguJnguKvguJnguYnguLLguKXguLAgOCkgKi8KZnVuY3Rpb24gbWFya0FsZXJ0c1NlZW4oKXsKICB2YXIgZnJlc2ggPSB1bnNl',
  'ZW5BbGVydHMoKTsKICBpZiAoIWZyZXNoLmxlbmd0aCkgcmV0dXJuOwogIHZhciBrZXlzID0gZnJlc2gubWFwKGZ1bmN0aW9uKGEpeyByZXR1cm4gYS5rZXk7IH0pOwogIGtleXMuZm9yRWFjaChmdW5jdGlvbihrKXsgTk9USUZfTkVXW2tdID0gdHJ1ZTsgU0VFTl9U',
  'SElTX1BBR0Vba10gPSB0cnVlOyB9KTsKICB2YXIgbGl2ZSA9IGFsZXJ0SW5kZXgoKS5tYXAoZnVuY3Rpb24oYSl7IHJldHVybiBhLmtleTsgfSk7CiAgaWYgKEFMRVJUUy5zZWVuU3RvcmUgPT09ICdhY2NvdW50JykgewogICAgLy8g4Liq4LmI4LiHICLguJfguLjg',
  'uIHguYDguKPguLfguYjguK3guIfguJfguLXguYjguYDguKvguYfguJnguYHguKXguYnguKciIOC4l+C4uOC4geC4hOC4o+C4seC5ieC4hyDguYTguKHguYjguYPguIrguYjguYHguITguYjguJfguLXguYjguYDguJ7guLTguYjguKEg4oCUIOC4hOC4s+C4guC4reC4',
  'quC4reC4h+C4reC4seC4meC4l+C4teC5iOC4i+C5ieC4reC4meC4geC4seC4meC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC4l+C4seC4muC4geC4seC4meC4iOC4meC4muC4suC4h+C5gOC4o+C4t+C5iOC4reC4h+C4q+C4suC4ogogICAgdmFyIGFsbCA9IGFsZXJ0',
  'SW5kZXgoKS5maWx0ZXIoZnVuY3Rpb24oYSl7IHJldHVybiBhLnNlZW4gfHwgU0VFTl9USElTX1BBR0VbYS5rZXldOyB9KQogICAgICAubWFwKGZ1bmN0aW9uKGEpeyByZXR1cm4gYS5rZXk7IH0pOwogICAgY2FsbEFwaSgnYXBwLmFsZXJ0c1NlZW4nLCB7IGtleXM6',
  'IGFsbCwgbGl2ZTogbGl2ZSB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oKXsgLyog4Lia4Lix4LiZ4LiX4Li24LiB4LmE4Lih4LmI4Lic4LmI4Liy4LiZIOC5g+C4q+C5ieC4leC4seC4p+C5gOC4peC4guC4geC4peC4seC4muC4oeC4siDguIjguLDguYTguJTguYng',
  'uKPguLnguYnguKfguYjguLLguKLguLHguIfguYTguKHguYjguYTguJTguYnguIjguJTguYTguKfguYkgKi8gZm9yZ2V0UGVuZGluZ1NlZW4oa2V5cyk7IH0pOwogIH0gZWxzZSB7CiAgICAvLyDguYDguIHguYfguJrguYDguInguJ7guLLguLDguYDguKPguLfguYjg',
  'uK3guIfguJfguLXguYjguKLguLHguIfguITguYnguLLguIfguK3guKLguLnguYgg4LiX4Li14LmI4LmB4LiB4LmJ4LmE4Lib4LmB4Lil4LmJ4Lin4LiV4Lix4LiU4LiX4Li04LmJ4LiHIOC5hOC4oeC5iOC5g+C4q+C5ieC4muC4p+C4oeC4guC4tuC5ieC4meC5gOC4',
  'o+C4t+C5iOC4reC4oiDguYYKICAgIHZhciBsaXZlU2V0ID0ge307IGxpdmUuZm9yRWFjaChmdW5jdGlvbihrKXsgbGl2ZVNldFthbGVydEJhc2UoayldID0gdHJ1ZTsgfSk7CiAgICB2YXIga2VlcCA9IGxvY2FsU2VlbigpLmZpbHRlcihmdW5jdGlvbihrKXsgcmV0',
  'dXJuIGxpdmVTZXRbYWxlcnRCYXNlKGspXTsgfSkuY29uY2F0KGtleXMpOwogICAgdHJ5IHsgbG9jYWxTdG9yYWdlLnNldEl0ZW0oU0VFTl9MT0NBTF9LRVksIEpTT04uc3RyaW5naWZ5KGtlZXApKTsgfSBjYXRjaCAoZSkgeyAvKiDguYLguKvguKHguJTguKrguYjg',
  'uKfguJnguJXguLHguKcgKi8gfQogIH0KICBwYWludEJhZGdlcygpOwogIHBhaW50QmVsbCgpOwp9Ci8qKiDguJrguLHguJnguJfguLbguIHguYDguKvguYfguJnguYHguKXguYnguKfguYTguKHguYjguJzguYjguLLguJkgKOC5gOC4meC5h+C4leC4q+C4peC4uOC4',
  'lCkg4oCUIOC5gOC4reC4suC4reC4reC4geC4iOC4suC4geC4l+C4teC5iOC4iOC4s+C5hOC4p+C5iSDguKPguK3guJrguKvguJnguYnguLLguJfguLXguYjguYDguJvguLTguJTguIHguKXguYjguK3guIfguIjguLDguKrguYjguIfguYPguKvguKHguYggKi8KZnVu',
  'Y3Rpb24gZm9yZ2V0UGVuZGluZ1NlZW4oa2V5cyl7CiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGspeyBkZWxldGUgU0VFTl9USElTX1BBR0Vba107IH0pOwogIHBhaW50QmFkZ2VzKCk7CiAgcGFpbnRCZWxsKCk7Cn0KCmZ1bmN0aW9uIHJlZnJlc2hBbGVydHMoKXsK',
  'ICByZXR1cm4gY2FsbEFwaSgnYXBwLmFsZXJ0cycpLnRoZW4oZnVuY3Rpb24oYSl7CiAgICBBTEVSVFMgPSBhIHx8IEFMRVJUUzsKICAgIHZhciBvcGVuID0gISFkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbm90aWZQYW5lbCcpOwogICAgaWYgKG9wZW4pIG1hcmtB',
  'bGVydHNTZWVuKCk7ICAgICAgICAgICAvLyDguYDguJvguLTguJTguJTguLnguK3guKLguLnguYgg4LmA4Lij4Li34LmI4Lit4LiH4LiX4Li14LmI4LmA4Lie4Li04LmI4LiH4LmA4LiC4LmJ4Liy4Lih4Liy4LiB4LmH4LiW4Li34Lit4Lin4LmI4Liy4LmA4Lir4LmH',
  '4LiZ4LmB4Lil4LmJ4LinCiAgICBwYWludEJhZGdlcygpOwogICAgcGFpbnRCZWxsKCk7CiAgICBpZiAob3BlbikgcmVuZGVyTm90aWZQYW5lbCgpOyAgICAgICAgIC8vIOC5gOC4m+C4tOC4lOC4hOC5ieC4suC4h+C4reC4ouC4ueC5iCDguYPguKvguYnguK3guLHg',
  'uJvguYDguJTguJXguJXguLLguKEKICAgIHJldHVybiBhOwogIH0pLmNhdGNoKGZ1bmN0aW9uKCl7IC8qIOC5gOC4meC5h+C4leC4quC4sOC4lOC4uOC4lCDguYTguKfguYnguKPguK3guJrguKvguJnguYnguLIgKi8gfSk7Cn0KCi8qKgogKiDguJXguLHguKfguYDg',
  'uKXguILguJrguJnguYDguKHguJnguLnguIvguYnguLLguKIg4oCUIOC4iOC4s+C4meC4p+C4meC5gOC4o+C4t+C5iOC4reC4h+C4l+C4teC5iOC4ouC4seC4h+C4hOC5ieC4suC4h+C4guC4reC4h+C5geC4leC5iOC4peC4sOC4q+C4meC5ieC4siAo4LiV4Lij4LiH',
  '4LiB4Lix4Lia4LiI4Liz4LiZ4Lin4LiZ4LmD4LiZ4LiB4Lil4LmI4Lit4LiH4LmB4LiI4LmJ4LiH4LmA4LiV4Li34Lit4LiZ4LmA4Liq4Lih4LitKQogKiDguKHguLXguYDguKPguLfguYjguK3guIfguJfguLXguYjguKLguLHguIfguYTguKHguYjguYDguITguKLg',
  'uYDguKvguYfguJkgPSDguKrguLXguKrguYnguKHguYDguJTguYjguJkgwrcg4LmA4Lir4LmH4LiZ4LiE4Lij4Lia4LmB4Lil4LmJ4LinID0g4Liq4Li14LiI4Liy4LiHIOC4ouC4seC4h+C4muC4reC4geC4iOC4s+C4meC4p+C4meC4hOC5ieC4suC4h+C5geC4leC5',
  'iOC5hOC4oeC5iOC5gOC4o+C4teC4ouC4geC4o+C5ieC4reC4h+C4hOC4p+C4suC4oeC4quC4meC5g+C4iAogKi8KZnVuY3Rpb24gcGFpbnRCYWRnZXMoKXsKICB2YXIgYyA9IEFMRVJUUy5jb3VudHMgfHwge307CiAgdmFyIGZyZXNoID0ge307CiAgdW5zZWVuQWxl',
  'cnRzKCkuZm9yRWFjaChmdW5jdGlvbihhKXsgZnJlc2hbYS5tb2R1bGVdID0gKGZyZXNoW2EubW9kdWxlXSB8fCAwKSArIDE7IH0pOwogIFBBR0VTLmZvckVhY2goZnVuY3Rpb24ocCl7IHNldEJhZGdlKHAuaWQsIGNbcC5pZF0gfHwgMCwgKGZyZXNoW3AuaWRdIHx8',
  'IDApID09PSAwLCBmcmVzaCk7IH0pOwp9CgpmdW5jdGlvbiBzZXRCYWRnZShwYWdlLCBuLCBzZWVuLCBmcmVzaCl7CiAgW2RvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiYWRnZS0nICsgcGFnZSksIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YWJiYWRnZS0nICsg',
  'cGFnZSldCiAgICAuZm9yRWFjaChmdW5jdGlvbihlbCl7IGlmIChlbCkgcGFpbnRCYWRnZShlbCwgbiwgc2Vlbik7IH0pOwoKICAvLyDguIfguLLguJnguITguYnguLLguIfguILguK3guIfguKvguJnguYnguLLguJfguLXguYjguYTguKHguYjguKHguLXguYHguJfg',
  'uYfguJog4LmD4Lir4LmJ4LmE4Lib4Lij4Lin4Lih4Lit4Lii4Li54LmI4LiX4Li14LmI4Lib4Li44LmI4LihICLguYDguJ7guLTguYjguKHguYDguJXguLTguKEiIOC5hOC4oeC5iOC4h+C4seC5ieC4meC4muC4meC4oeC4t+C4reC4luC4t+C4reC4iOC4sOC4oeC4',
  'reC4h+C5hOC4oeC5iOC5gOC4q+C5h+C4meC5gOC4peC4ogogIHZhciBtb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhYmJhZGdlLW1vcmUnKTsKICBpZiAobW9yZSkgewogICAgdmFyIGhpZGRlblBhZ2VzID0gUEFHRVMuZmlsdGVyKGZ1bmN0aW9uKHAp',
  'eyByZXR1cm4gIXAudGFiOyB9KTsKICAgIHZhciBoaWRkZW4gPSBoaWRkZW5QYWdlcy5yZWR1Y2UoZnVuY3Rpb24oYSwgcCl7IHJldHVybiBhICsgKChBTEVSVFMuY291bnRzIHx8IHt9KVtwLmlkXSB8fCAwKTsgfSwgMCk7CiAgICBmcmVzaCA9IGZyZXNoIHx8IHt9',
  'OwogICAgdmFyIGhpZGRlbkZyZXNoID0gaGlkZGVuUGFnZXMucmVkdWNlKGZ1bmN0aW9uKGEsIHApeyByZXR1cm4gYSArIChmcmVzaFtwLmlkXSB8fCAwKTsgfSwgMCk7CiAgICBwYWludEJhZGdlKG1vcmUsIGhpZGRlbiwgaGlkZGVuRnJlc2ggPT09IDApOwogIH0K',
  'fQoKZnVuY3Rpb24gcGFpbnRCYWRnZShlbCwgbiwgc2Vlbil7CiAgaWYgKG4gPiAwKSB7CiAgICBlbC50ZXh0Q29udGVudCA9IG4gPiA5OSA/ICc5OSsnIDogbjsKICAgIGVsLnN0eWxlLmRpc3BsYXkgPSAnJzsKICAgIGVsLmNsYXNzTGlzdC50b2dnbGUoJ3NlZW4n',
  'LCAhIXNlZW4pOwogICAgZWwudGl0bGUgPSAn4Lii4Lix4LiH4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmIICcgKyBuICsgJyDguKPguLLguKLguIHguLLguKMnICsgKHNlZW4gPyAnICjguYDguKvguYfguJnguYHguKXguYnguKcpJyA6ICcnKTsKICB9IGVsc2Ugewog',
  'ICAgZWwuc3R5bGUuZGlzcGxheSA9ICdub25lJzsKICB9Cn0KCi8qIC0tLS0g4LiB4Lij4Liw4LiU4Li04LmI4LiH4Lia4LiZ4LmB4LiW4Lia4Lir4Lix4LinIC0tLS0gKi8KCmZ1bmN0aW9uIHBhaW50QmVsbCgpewogIHZhciB3cmFwID0gZG9jdW1lbnQuZ2V0RWxl',
  'bWVudEJ5SWQoJ2JlbGxXcmFwJyk7CiAgaWYgKCF3cmFwKSByZXR1cm47CgogIC8vIOC4p+C4suC4lOC5gOC4ieC4nuC4suC4sOC4leC4seC4p+C4m+C4uOC5iOC4oSDguKvguYnguLLguKHguYDguILguLXguKLguJnguJfguLHguJrguJfguLHguYnguIcgYmVsbFdy',
  'YXAKICAvLyDguYDguJ7guKPguLLguLDguIHguKXguYjguK3guIfguYHguIjguYnguIfguYDguJXguLfguK3guJnguJfguLXguYjguYDguJvguLTguJTguITguYnguLLguIfguK3guKLguLnguYjguIHguYfguYDguJvguYfguJnguKXguLnguIHguILguK3guIcgYmVs',
  'bFdyYXAg4LmA4Lir4Lih4Li34Lit4LiZ4LiB4Lix4LiZCiAgdmFyIHNsb3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmVsbFNsb3QnKTsKICBpZiAoIXNsb3QpIHsKICAgIHNsb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7CiAgICBzbG90',
  'LmlkID0gJ2JlbGxTbG90JzsKICAgIHdyYXAuaW5zZXJ0QmVmb3JlKHNsb3QsIHdyYXAuZmlyc3RDaGlsZCk7CiAgfQoKICB2YXIgZnJlc2ggPSB1bnNlZW5BbGVydHMoKTsKICB2YXIgbiA9IGZyZXNoLmxlbmd0aDsKICB2YXIgdG90YWwgPSBBTEVSVFMudG90YWwg',
  'fHwgMDsKICB2YXIgdXJnZW50ID0gZnJlc2guZmlsdGVyKGZ1bmN0aW9uKGEpeyByZXR1cm4gYS5sZXZlbCA9PT0gJ2Rhbmdlcic7IH0pLmxlbmd0aDsKICB2YXIgdGlwID0gbiA/ICfguKHguLXguYDguKPguLfguYjguK3guIfguYPguKvguKHguYggJyArIG4gKyAn',
  'IOC5gOC4o+C4t+C5iOC4reC4hycgOgogICAgICAgICAgICAodG90YWwgPyAn4Lii4Lix4LiH4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmIICcgKyB0b3RhbCArICcg4LmA4Lij4Li34LmI4Lit4LiHICjguYDguKvguYfguJnguYHguKXguYnguKfguJfguLHguYnguIfg',
  'uKvguKHguJQpJyA6ICfguYTguKHguYjguKHguLXguIfguLLguJnguITguYnguLLguIcnKTsKICBzbG90LmlubmVySFRNTCA9CiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIGljb24gYmVsbCIgaWQ9ImJlbGxCdG4iIG9uY2xpY2s9InRvZ2dsZU5vdGlmKCkiICcgKwog',
  'ICAgICAndGl0bGU9IicgKyBlc2ModGlwKSArICciICcgKwogICAgICAnYXJpYS1sYWJlbD0i4LiB4Liy4Lij4LmB4LiI4LmJ4LiH4LmA4LiV4Li34Lit4LiZIj7wn5SUJyArCiAgICAgIChuID8gJzxzcGFuIGNsYXNzPSJiZWxsLWRvdCcgKyAodXJnZW50ID8gJyB1',
  'cmdlbnQnIDogJycpICsgJyI+JyArIChuID4gOTkgPyAnOTkrJyA6IG4pICsgJzwvc3Bhbj4nIDogJycpICsKICAgICc8L2J1dHRvbj4nOwp9CgpmdW5jdGlvbiB0b2dnbGVOb3RpZigpewogIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbm90aWZQYW5lbCcp',
  'KSByZXR1cm4gY2xvc2VOb3RpZigpOwogIHZhciB3cmFwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JlbGxXcmFwJyk7CiAgaWYgKCF3cmFwKSByZXR1cm47CiAgdmFyIHBhbmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgcGFuZWwuaWQg',
  'PSAnbm90aWZQYW5lbCc7CiAgcGFuZWwuY2xhc3NOYW1lID0gJ25vdGlmJzsKICB3cmFwLmFwcGVuZENoaWxkKHBhbmVsKTsKICBOT1RJRl9ORVcgPSB7fTsKICBtYXJrQWxlcnRzU2VlbigpOyAgICAgICAgICAgICAgICAgICAgIC8vIOC5gOC4m+C4tOC4lOC4lOC4',
  'ueC5geC4peC5ieC4pyA9IOC5gOC4q+C5h+C4meC5geC4peC5ieC4pyDguJXguLHguKfguYDguKXguILguJrguJnguIHguKPguLDguJTguLTguYjguIfguKvguLLguKIgKOC4m+C5ieC4suC4oiAi4LmD4Lir4Lih4LmIIiDguKLguLHguIfguK3guKLguLnguYjguYPg',
  'uJnguIHguKXguYjguK3guIcpCiAgcmVuZGVyTm90aWZQYW5lbCgpOwogIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBub3RpZk91dHNpZGUsIHRydWUpOyB9LCAwKTsKICByZWZyZXNoQWxlcnRzKCk7ICAg',
  'ICAgICAgICAgICAgICAgICAgIC8vIOC5gOC4m+C4tOC4lOC4l+C4teC5hOC4o+C4geC5h+C4lOC4tuC4h+C4guC4reC4h+C4peC5iOC4suC4quC4uOC4lOC4oeC4suC5g+C4q+C5ieC4lOC5ieC4p+C4ogp9CgpmdW5jdGlvbiBjbG9zZU5vdGlmKCl7CiAgdmFyIHAg',
  'PSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbm90aWZQYW5lbCcpOwogIGlmIChwKSBwLnJlbW92ZSgpOwogIE5PVElGX05FVyA9IHt9OwogIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgbm90aWZPdXRzaWRlLCB0cnVlKTsKfQoKZnVuY3Rp',
  'b24gbm90aWZPdXRzaWRlKGUpewogIHZhciB3cmFwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JlbGxXcmFwJyk7CiAgaWYgKHdyYXAgJiYgIXdyYXAuY29udGFpbnMoZS50YXJnZXQpKSBjbG9zZU5vdGlmKCk7Cn0KCnZhciBOT1RJRl9HUk9VUFMgPSBbCiAg',
  'eyBtb2R1bGU6J3JlcGFpcnMnLCAgIGljOifwn5SnJywgbGFiZWw6J+C4h+C4suC4meC4i+C5iOC4reC4oeC4q+C5ieC4reC4h+C4l+C4teC5iOC4ouC4seC4h+C5hOC4oeC5iOC5gOC4quC4o+C5h+C4iCcgfSwKICB7IG1vZHVsZTonYWMnLCAgICAgICAgaWM6J+Kd',
  'hO+4jycsIGxhYmVsOifguKXguYnguLLguIfguYHguK3guKPguYzguJbguLbguIfguIHguLPguKvguJnguJQnIH0sCiAgeyBtb2R1bGU6J2J1aWxkaW5nJywgIGljOifwn4+iJywgbGFiZWw6J+C4h+C4suC4meC4leC4tuC4geC4quC5iOC4p+C4meC4geC4peC4suC4',
  'h+C4l+C4teC5iOC4ouC4seC4h+C4hOC5ieC4suC4hycgfSwKICB7IG1vZHVsZToncHVyY2hhc2VzJywgaWM6J/Cfm6HvuI8nLCBsYWJlbDon4Lib4Lij4Liw4LiB4Lix4LiZ4LmD4LiB4Lil4LmJ4Lir4Lih4LiUJyB9LAogIHsgbW9kdWxlOidmaW5hbmNlJywgICBp',
  'Yzon8J+nvicsIGxhYmVsOifguJrguLTguKXguKPguLLguKLguYDguJTguLfguK3guJknIH0KXTsKCmZ1bmN0aW9uIHJlbmRlck5vdGlmUGFuZWwoKXsKICB2YXIgcGFuZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbm90aWZQYW5lbCcpOwogIGlmICghcGFu',
  'ZWwpIHJldHVybjsKICB2YXIgaXRlbXMgPSBBTEVSVFMuaXRlbXMgfHwgW107CgogIHZhciBuZXdDb3VudCA9IGFsZXJ0SW5kZXgoKS5maWx0ZXIoZnVuY3Rpb24oYSl7IHJldHVybiBOT1RJRl9ORVdbYS5rZXldOyB9KS5sZW5ndGg7CiAgdmFyIGhlYWQgPSAnPGRp',
  'diBjbGFzcz0ibm90aWYtaCI+PGI+4LiB4Liy4Lij4LmB4LiI4LmJ4LiH4LmA4LiV4Li34Lit4LiZPC9iPicgKwogICAgJzxzcGFuIGNsYXNzPSJzcCI+JyArCiAgICAgIChuZXdDb3VudCA/ICc8c3BhbiBjbGFzcz0iYiBpbmZvIj7guYPguKvguKHguYggJyArIG5l',
  'd0NvdW50ICsgJzwvc3Bhbj4nIDogJycpICsKICAgICAgKGl0ZW1zLmxlbmd0aCA/ICc8c3BhbiBjbGFzcz0iYiAnICsgKEFMRVJUUy51cmdlbnQgPyAnZGdyJyA6ICd3YXJuJykgKyAnIj7guITguYnguLLguIcgJyArIChBTEVSVFMudG90YWwgfHwgaXRlbXMubGVu',
  'Z3RoKSArICcg4LmA4Lij4Li34LmI4Lit4LiHPC9zcGFuPicgOiAnJykgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24iIHRpdGxlPSLguJTguLbguIfguILguYnguK3guKHguLnguKXguKXguYjguLLguKrguLjguJQiIG9uY2xpY2s9InJlZnJlc2hB',
  'bGVydHMoKSI+4oa7PC9idXR0b24+JyArCiAgICAnPC9zcGFuPjwvZGl2Pic7CgogIGlmICghaXRlbXMubGVuZ3RoKSB7CiAgICBwYW5lbC5pbm5lckhUTUwgPSBoZWFkICsKICAgICAgJzxkaXYgY2xhc3M9Im5vdGlmLWVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPuKc',
  'hTwvZGl2PuC5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4hOC5ieC4suC4hzxicj4nICsKICAgICAgJzxzcGFuIGNsYXNzPSJmczEyIGZhaW50Ij7guJfguLjguIHguK3guKLguYjguLLguIfguYDguKPguLXguKLguJrguKPguYnguK3guKLguJTguLU8L3NwYW4+PC9k',
  'aXY+JzsKICAgIHJldHVybjsKICB9CgogIC8vIOC4iOC4seC4lOC4geC4peC4uOC5iOC4oeC4leC4suC4oeC5guC4oeC4lOC4ueC4pSDguYDguKPguLXguKLguIfguJXguLLguKHguKXguLPguJTguLHguJrguJfguLXguYjguJzguLnguYnguYPguIrguYnguKrguJng',
  'uYPguIjguIHguYjguK3guJkKICB2YXIgYm9keSA9ICcnOwogIE5PVElGX0dST1VQUy5mb3JFYWNoKGZ1bmN0aW9uKGcpewogICAgdmFyIGxpc3QgPSBpdGVtcy5maWx0ZXIoZnVuY3Rpb24oYSl7IHJldHVybiBhLm1vZHVsZSA9PT0gZy5tb2R1bGU7IH0pOwogICAg',
  'aWYgKCFsaXN0Lmxlbmd0aCkgcmV0dXJuOwogICAgLy8g4LiI4Liz4LiZ4Lin4LiZ4LiI4Lij4Li04LiH4LiI4Liy4LiB4LiV4Lix4Lin4LiZ4Lix4LiaICjguKPguLLguKLguKXguLDguYDguK3guLXguKLguJTguKrguYjguIfguKHguLLguYTguKHguYjguYDguIHg',
  'uLTguJnguKvguJnguYnguLLguKXguLAgNDAg4LmA4Lij4Li34LmI4Lit4LiHKQogICAgdmFyIGFsbCA9IE1hdGgubWF4KGxpc3QubGVuZ3RoLCAoQUxFUlRTLmNvdW50cyB8fCB7fSlbZy5tb2R1bGVdIHx8IDApOwogICAgYm9keSArPSAnPGRpdiBjbGFzcz0ibm90',
  'aWYtc2VjIj4nICsgZy5pYyArICcgJyArIGVzYyhnLmxhYmVsKSArICcgKCcgKyBhbGwgKyAnKTwvZGl2Pic7CiAgICBsaXN0LnNsaWNlKDAsIDgpLmZvckVhY2goZnVuY3Rpb24oYSl7CiAgICAgIHZhciBpc05ldyA9ICEhTk9USUZfTkVXW2Eua2V5XTsKICAgICAg',
  'Ym9keSArPSAnPGJ1dHRvbiBjbGFzcz0ibm90aWYtaXRlbSBsLScgKyBlc2MoYS5sZXZlbCkgKyAoaXNOZXcgPyAnIGlzLW5ldycgOiAnJykgKyAnIiBvbmNsaWNrPSJnb3RvQWxlcnQoJyArIGpzcShhLm1vZHVsZSkgKyAnKSI+JyArCiAgICAgICAgJzxkaXYgY2xh',
  'c3M9InR0Ij4nICsgKGlzTmV3ID8gJzxzcGFuIGNsYXNzPSJuZXctZG90IiB0aXRsZT0i4LmA4Lij4Li34LmI4Lit4LiH4LmD4Lir4Lih4LmIIj48L3NwYW4+JyA6ICcnKSArIGVzYyhhLnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgICAoYS5kZXRhaWwgPyAnPGRp',
  'diBjbGFzcz0iZGQiPicgKyBlc2MoYS5kZXRhaWwpICsgJzwvZGl2PicgOiAnJykgKwogICAgICAnPC9idXR0b24+JzsKICAgIH0pOwogICAgaWYgKGFsbCA+IDgpIHsKICAgICAgYm9keSArPSAnPGJ1dHRvbiBjbGFzcz0ibm90aWYtbW9yZSIgb25jbGljaz0iZ290',
  'b0FsZXJ0KCcgKyBqc3EoZy5tb2R1bGUpICsgJykiPicgKwogICAgICAgICfguJTguLnguK3guLXguIEgJyArIChhbGwgLSA4KSArICcg4Lij4Liy4Lii4LiB4Liy4LijIOKGkjwvYnV0dG9uPic7CiAgICB9CiAgfSk7CgogIHBhbmVsLmlubmVySFRNTCA9IGhlYWQg',
  'KyAnPGRpdiBjbGFzcz0ibm90aWYtbGlzdCI+JyArIGJvZHkgKyAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0ibm90aWYtZiI+4Lij4Liy4Lii4LiB4Liy4Lij4LiI4Liw4Lir4Liy4Lii4LmE4Lib4LmA4Lit4LiH4LmA4Lih4Li34LmI4Lit4LmB4LiB4LmJ4LmA',
  '4Lij4Li34LmI4Lit4LiH4LiZ4Lix4LmJ4LiZ4LmB4Lil4LmJ4LinIMK3IOC4reC4seC4m+C5gOC4lOC4lSAnICsgZXNjKFN0cmluZyhBTEVSVFMuYXQgfHwgJycpLnNsaWNlKDExLCAxNikgfHwgJ+KAkycpICsgJyDguJkuIMK3ICcgKwogICAgJzxhIGhyZWY9Imph',
  'dmFzY3JpcHQ6dm9pZCgwKSIgb25jbGljaz0iY2xvc2VOb3RpZigpO2dvKFwnZGFzaGJvYXJkXCcpIj7guJTguLnguJfguLHguYnguIfguKvguKHguJTguYPguJnguYHguJTguIrguJrguK3guKPguYzguJQg4oaSPC9hPjwvZGl2Pic7Cn0KCmZ1bmN0aW9uIGdvdG9B',
  'bGVydChtb2R1bGUpewogIGNsb3NlTm90aWYoKTsKICBnbyhtb2R1bGUgPT09ICdkZWJ0JyA/ICdkZWJ0TWFpbicgOiBtb2R1bGUpOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIGZvcm1hdCBoZWxwZXJzIC0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKgogKiDguILguYng',
  'uK3guITguKfguLLguKHguJfguLXguYjguIjguLDguYTguJvguYDguJvguYfguJnguK3guLLguKPguYzguIHguLTguKfguYDguKHguJnguJXguYzguILguK3guIcgSlMg4LmD4LiZIG9uY2xpY2s9IuKApiIKICogSlNPTi5zdHJpbmdpZnkg4LiX4Liz4LmD4Lir4LmJ',
  '4LmA4Lib4LmH4LiZ4Liq4LiV4Lij4Li04LiHIEpTIOC4l+C4teC5iOC4luC4ueC4geC4leC5ieC4reC4h+C5gOC4quC4oeC4rSAo4Lir4LiZ4Li14Lit4Lix4LiN4Lib4Lij4Liw4LiB4Liy4LioL+C5geC4muC5h+C4geC4quC5geC4peC4iuC5g+C4q+C5iSkg4LmB',
  '4Lil4LmJ4LinIGVzYyDguIHguLHguJnguKvguKXguLjguJTguK3guK3guIHguIjguLLguIEgYXR0cmlidXRlCiAqIOC5g+C4iuC5ieC5geC4l+C4meC4geC4suC4o+C4leC5iOC4rSAnXCcnICsg4LiE4LmI4LiyICsgJ1wnJyDguJXguKPguIcg4LmGIOC4i+C4tuC5',
  'iOC4h+C4hOC5iOC4suC4l+C4teC5iOC4oeC4tSAnIOC4iOC4sOC4l+C4sOC4peC4uOC4reC4reC4geC4oeC4suC4o+C4seC4meC5guC4hOC5ieC4lOC5hOC4lOC5iQogKi8KZnVuY3Rpb24ganNxKHMpeyByZXR1cm4gZXNjKEpTT04uc3RyaW5naWZ5KFN0cmluZyhz',
  'ID09IG51bGwgPyAnJyA6IHMpKSk7IH0KCmZ1bmN0aW9uIGVzYyhzKXsKICByZXR1cm4gU3RyaW5nKHM9PW51bGw/Jyc6cykKICAgIC5yZXBsYWNlKC8mL2csJyZhbXA7JykucmVwbGFjZSgvPC9nLCcmbHQ7JykucmVwbGFjZSgvPi9nLCcmZ3Q7JykKICAgIC5yZXBs',
  'YWNlKC8iL2csJyZxdW90OycpLnJlcGxhY2UoLycvZywnJiMzOTsnKTsKfQpmdW5jdGlvbiBtb25leShuLCBkZWMpewogIHZhciB2ID0gTnVtYmVyKG58fDApOwogIHJldHVybiB2LnRvTG9jYWxlU3RyaW5nKCd0aC1USCcse21pbmltdW1GcmFjdGlvbkRpZ2l0czpk',
  'ZWN8fDAsIG1heGltdW1GcmFjdGlvbkRpZ2l0czpkZWN8fDB9KTsKfQpmdW5jdGlvbiBiYWh0KG4peyByZXR1cm4gbW9uZXkobikgKyAnIOC4vyc7IH0KZnVuY3Rpb24gcGN0KG4peyByZXR1cm4gKE51bWJlcihuKXx8MCkudG9GaXhlZCgxKSArICclJzsgfQpmdW5j',
  'dGlvbiBudW0obil7IHJldHVybiBuPT1udWxsfHxuPT09JycgPyAn4oCTJyA6IG1vbmV5KG4pOyB9CgovKiogMjAyNi0wNC0yNiAtPiAyNiDguYDguKEu4LiiLiAyNTY5ICovCnZhciBUSF9NT04gPSBbJ+C4oS7guIQuJywn4LiBLuC4ni4nLCfguKHguLUu4LiELics',
  'J+C5gOC4oS7guKIuJywn4LieLuC4hC4nLCfguKHguLQu4LiiLicsJ+C4gS7guIQuJywn4LiqLuC4hC4nLCfguIEu4LiiLicsJ+C4lS7guIQuJywn4LieLuC4oi4nLCfguJgu4LiELiddOwovKioKICog4Lib4Li14LiX4Li14LmI4LiI4Liw4LmB4Liq4LiU4LiH4Lia',
  '4LiZ4Lir4LiZ4LmJ4Liy4LiI4LitIOKAlCDguILguYnguK3guKHguLnguKXguYDguIHguYfguJrguYDguJvguYfguJkg4LiELuC4qC4g4LmA4Liq4Lih4LitCiAqIOC4leC4o+C4h+C4meC4teC5ieC5geC4m+C4peC4h+C4leC4reC4meC5geC4quC4lOC4h+C4nOC4',
  'peC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pyDguJXguLLguKHguJfguLXguYjguYDguKXguLfguK3guIHguYTguKfguYnguYPguJnguKvguJnguYnguLLguJXguLHguYnguIfguITguYjguLIKICog4LiE4LmI4Liy4LiV4Lix4LmJ4LiH4LiV4LmJ4LiZ4LiE',
  '4Li34LitIOC4hC7guKguIOC5g+C4q+C5ieC4leC4o+C4h+C4geC4seC4muC4m+C4teC4l+C4teC5iOC5gOC4geC5h+C4muC5g+C4meC4iuC4teC4leC5geC4peC4sOC4m+C4j+C4tOC4l+C4tOC4meC4quC4suC4geC4pQogKi8KZnVuY3Rpb24gdXNlQnVkZGhpc3RZ',
  'ZWFyKCl7CiAgdmFyIGYgPSAoUy5ib290ICYmIFMuYm9vdC5zZXR0aW5ncyAmJiBTLmJvb3Quc2V0dGluZ3MuZGF0ZUZvcm1hdCkgfHwgJ+C4hC7guKguICgyMDI2KSc7CiAgcmV0dXJuIFN0cmluZyhmKS5pbmRleE9mKCfguJ4u4LioLicpID09PSAwOwp9CmZ1bmN0',
  'aW9uIGRpc3BsYXlZZWFyKGNlKXsKICByZXR1cm4gdXNlQnVkZGhpc3RZZWFyKCkgPyBOdW1iZXIoY2UpICsgNTQzIDogTnVtYmVyKGNlKTsKfQoKZnVuY3Rpb24gdGhEYXRlKGlzbyl7CiAgaWYgKCFpc28pIHJldHVybiAn4oCTJzsKICB2YXIgbSA9IFN0cmluZyhp',
  'c28pLm1hdGNoKC9eKFxkezR9KS0oXGR7Mn0pLShcZHsyfSkvKTsKICBpZiAoIW0pIHJldHVybiBlc2MoaXNvKTsKICByZXR1cm4gTnVtYmVyKG1bM10pICsgJyAnICsgVEhfTU9OW051bWJlcihtWzJdKS0xXSArICcgJyArIGRpc3BsYXlZZWFyKG1bMV0pOwp9CmZ1',
  'bmN0aW9uIHRoRGF0ZVNob3J0KGlzbyl7CiAgaWYgKCFpc28pIHJldHVybiAn4oCTJzsKICB2YXIgbSA9IFN0cmluZyhpc28pLm1hdGNoKC9eKFxkezR9KS0oXGR7Mn0pLShcZHsyfSkvKTsKICBpZiAoIW0pIHJldHVybiBlc2MoaXNvKTsKICByZXR1cm4gTnVtYmVy',
  'KG1bM10pICsgJy8nICsgTnVtYmVyKG1bMl0pICsgJy8nICsgU3RyaW5nKGRpc3BsYXlZZWFyKG1bMV0pKS5zbGljZSgyKTsKfQpmdW5jdGlvbiBkYXlzQWdvKGlzbyl7CiAgaWYgKCFpc28pIHJldHVybiBudWxsOwogIHJldHVybiBNYXRoLnJvdW5kKChEYXRlLm5v',
  'dygpIC0gbmV3IERhdGUoaXNvKS5nZXRUaW1lKCkpLzg2NDAwMDAwKTsKfQoKZnVuY3Rpb24gc3RhdHVzQmFkZ2Uoc3QpewogIHZhciBtYXAgPSB7CiAgICAn4LmA4Liq4Lij4LmH4LiI4Liq4Li04LmJ4LiZJzonb2snLCfguJTguLPguYDguJnguLTguJnguIHguLLg',
  'uKPguYHguKXguYnguKcnOidvaycsJ+C5g+C4iuC5ieC4h+C4suC4meC4m+C4geC4leC4tCc6J29rJywn4Lib4Li04LiU4Lir4LiZ4Li14LmJ4LmB4Lil4LmJ4LinJzonb2snLCfguK3guKLguLnguYjguYPguJnguJvguKPguLDguIHguLHguJknOidvaycsJ+C4oeC4',
  'teC4nOC4ueC5ieC5gOC4iuC5iOC4sic6J29rJywn4Lib4LiB4LiV4Li0Jzonb2snLAogICAgJ+C4geC4s+C4peC4seC4h+C4i+C5iOC4reC4oSc6J2luZm8nLCfguIHguLPguKXguLHguIfguJTguLPguYDguJnguLTguJnguIHguLLguKMnOidpbmZvJywn4LiZ4Lix',
  '4LiU4Lir4Lih4Liy4Lii4LmB4Lil4LmJ4LinJzonaW5mbycsJ+C4geC4s+C4peC4seC4h+C4nOC5iOC4reC4mSc6J2luZm8nLCfguKfguYjguLLguIcnOidpbmZvJywKICAgICfguKPguK3guJTguLPguYDguJnguLTguJnguIHguLLguKMnOid3YXJuJywn4LmA4Lil',
  '4Li34LmI4Lit4LiZ4LiZ4Lix4LiUJzond2FybicsJ+C5g+C4geC4peC5ieC4q+C4oeC4lOC4m+C4o+C4sOC4geC4seC4mSc6J3dhcm4nLCfguJXguYnguK3guIfguIvguYjguK3guKEnOid3YXJuJywn4Lie4Lix4LiB4LiK4Liz4Lij4LiwJzond2FybicsJ+C4m+C4',
  'tOC4lOC4m+C4o+C4seC4muC4m+C4o+C4uOC4hyc6J3dhcm4nLCfguYDguIHguLTguJnguIHguLPguKvguJnguJQnOid3YXJuJywn4Lii4Lix4LiH4LmE4Lih4LmI4LmA4LiE4Lii4Lil4LmJ4Liy4LiHJzond2FybicsCiAgICAn4Lii4LiB4LmA4Lil4Li04LiBJzon',
  'bXV0ZScsJ+C4m+C4peC4lOC4o+C4sOC4p+C4suC4hyc6J211dGUnLCfguYTguKHguYjguKPguLDguJrguLgnOidtdXRlJywKICAgICfguKvguKHguJTguK3guLLguKLguLjguYHguKXguYnguKcnOidkZ3InLCfguJTguYjguKfguJnguKHguLLguIEnOidkZ3InLCfg',
  'uJTguYjguKfguJknOid3YXJuJwogIH07CiAgaWYgKCFzdCkgcmV0dXJuICcnOwogIHJldHVybiAnPHNwYW4gY2xhc3M9ImIgJyArIChtYXBbc3RdfHwnbXV0ZScpICsgJyI+JyArIGVzYyhzdCkgKyAnPC9zcGFuPic7Cn0KCmZ1bmN0aW9uIHByb2dyZXNzKHBlcmNl',
  'bnQsIGNscyl7CiAgdmFyIHAgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIE51bWJlcihwZXJjZW50KXx8MCkpOwogIHJldHVybiAnPGRpdiBjbGFzcz0icGJhciAnICsgKGNsc3x8JycpICsgJyI+PGkgc3R5bGU9IndpZHRoOicgKyBwICsgJyUiPjwvaT48L2Rp',
  'dj4nOwp9CgpmdW5jdGlvbiB0aHVtYnNIdG1sKHJlZnMsIGJpZyl7CiAgaWYgKCFyZWZzIHx8ICFyZWZzLmxlbmd0aCkgcmV0dXJuICc8c3BhbiBjbGFzcz0iZmFpbnQgZnMxMiI+4oCTPC9zcGFuPic7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJ0aHVtYnMiPicgKyBy',
  'ZWZzLm1hcChmdW5jdGlvbihyKXsKICAgIGlmIChyLnRodW1iKSB7CiAgICAgIHJldHVybiAnPGltZyBjbGFzcz0idGh1bWInICsgKGJpZz8nIGJpZyc6JycpICsgJyIgbG9hZGluZz0ibGF6eSIgc3JjPSInICsgZXNjKHIudGh1bWIpICsgJyIgJyArCiAgICAgICAg',
  'ICAgICAnb25jbGljaz0id2luZG93Lm9wZW4oJyArIGpzcShzYWZlVXJsKHIudXJsKSkgKyAnLFwnX2JsYW5rXCcpIiAnICsKICAgICAgICAgICAgICdvbmVycm9yPSJ0aGlzLm9uZXJyb3I9bnVsbDt0aGlzLnJlcGxhY2VXaXRoKGZpbGVDaGlwKCcgKyBKU09OLnN0',
  'cmluZ2lmeShKU09OLnN0cmluZ2lmeShyKSkucmVwbGFjZSgvIi9nLCcmcXVvdDsnKSArICcpKSI+JzsKICAgIH0KICAgIHZhciB1ID0gc2FmZVVybChyLnVybCk7CiAgICByZXR1cm4gdSA/ICc8YSBjbGFzcz0iYiBpbmZvIiBocmVmPSInICsgZXNjKHUpICsgJyIg',
  'dGFyZ2V0PSJfYmxhbmsiIHJlbD0ibm9vcGVuZXIiPuC5hOC4n+C4peC5jDwvYT4nCiAgICAgICAgICAgICA6ICc8c3BhbiBjbGFzcz0iYiBtdXRlIiB0aXRsZT0iJyArIGVzYyhyLm5hbWUgfHwgJycpICsgJyI+4LmE4Lif4Lil4LmMPC9zcGFuPic7CiAgfSkuam9p',
  'bignJykgKyAnPC9kaXY+JzsKfQoKLyoqIOC4o+C4seC4muC5gOC4ieC4nuC4suC4sOC4peC4tOC4h+C4geC5jCBodHRwcyDigJQg4LiE4LmI4Liy4Lit4Lii4LmI4Liy4LiHIGphdmFzY3JpcHQ6IOC4l+C4teC5iOC4luC4ueC4geC4nuC4tOC4oeC4nuC5jOC4peC4',
  'h+C4iuC5iOC4reC4h+C5hOC4n+C4peC5jOC5geC4meC4muC5g+C4meC4iuC4teC4leC4iOC4sOC5hOC4oeC5iOC4geC4peC4suC4ouC5gOC4m+C5h+C4meC4peC4tOC4h+C4geC5jCAqLwpmdW5jdGlvbiBzYWZlVXJsKHUpeyB1ID0gU3RyaW5nKHUgPT0gbnVsbCA/',
  'ICcnIDogdSkudHJpbSgpOyByZXR1cm4gL15odHRwczpcL1wvL2kudGVzdCh1KSA/IHUgOiAnJzsgfQpmdW5jdGlvbiBmaWxlQ2hpcChqc29uKXsKICB2YXIgciA9IHR5cGVvZiBqc29uID09PSAnc3RyaW5nJyA/IEpTT04ucGFyc2UoanNvbikgOiBqc29uOwogIHZh',
  'ciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpOwogIGEuY2xhc3NOYW1lID0gJ2IgaW5mbyc7IGEuaHJlZiA9IHNhZmVVcmwoci51cmwpIHx8ICcjJzsgYS50YXJnZXQgPSAnX2JsYW5rJzsgYS5yZWwgPSAnbm9vcGVuZXInOyBhLnRleHRDb250ZW50ID0g',
  'J/Cfk44g4LmE4Lif4Lil4LmMJzsKICByZXR1cm4gYTsKfQoKZnVuY3Rpb24gZW1wdHlCb3godGV4dCwgYWN0aW9uKXsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPvCfl4LvuI88L2Rpdj4nICsgZXNjKHRleHQpICsKICAgICAg',
  'ICAgKGFjdGlvbiA/ICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgYWN0aW9uICsgJzwvZGl2PicgOiAnJykgKyAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gYmFyQ2hhcnQoaXRlbXMsIGxhYmVsS2V5LCB2YWx1ZUtleSwgZm9ybWF0dGVyKXsKICBpZiAoIWl0ZW1zIHx8ICFp',
  'dGVtcy5sZW5ndGgpIHJldHVybiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4guC5ieC4reC4oeC4ueC4pTwvZGl2Pic7CiAgdmFyIG1heCA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGl0ZW1zLm1hcChmdW5jdGlvbihpKXsgcmV0',
  'dXJuIE51bWJlcihpW3ZhbHVlS2V5XSl8fDA7IH0pKSB8fCAxOwogIHJldHVybiAnPGRpdiBjbGFzcz0iYmFycyI+JyArIGl0ZW1zLm1hcChmdW5jdGlvbihpKXsKICAgIHZhciB2ID0gTnVtYmVyKGlbdmFsdWVLZXldKXx8MDsKICAgIHJldHVybiAnPGRpdiBjbGFz',
  'cz0iYmFyLXJvdyI+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJjbGlwIiB0aXRsZT0iJyArIGVzYyhpW2xhYmVsS2V5XSkgKyAnIj4nICsgZXNjKGlbbGFiZWxLZXldKSArICc8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImJhci10cmFjayI+PGRpdiBjbGFzcz0i',
  'YmFyLWZpbGwiIHN0eWxlPSJ3aWR0aDonICsgKHYvbWF4KjEwMCkgKyAnJSI+PC9kaXY+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJ2Ij4nICsgKGZvcm1hdHRlciA/IGZvcm1hdHRlcihpKSA6IG1vbmV5KHYpKSArICc8L2Rpdj4nICsKICAgICc8L2Rpdj4n',
  'OwogIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0gbW9kYWwgLS0tLS0tLS0tLS0tLS0tLSAqLwoKLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tCiAg',
  'IOC4leC4suC4o+C4suC4h+C4muC4meC4iOC4reC5geC4hOC4mgogICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0KICAg4LiV4Liy4Lij4Liy4LiH4LiB4Lin4LmJ4Liy4LiHIDEsMDAwcHgg',
  '4Lit4LmI4Liy4LiZ4Lia4LiZ4Lih4Li34Lit4LiW4Li34Lit4LmE4Lih4LmI4LmE4Lir4LinIOC4leC5ieC4reC4h+C5gOC4peC4t+C5iOC4reC4meC4i+C5ieC4suC4ouC4guC4p+C4suC4leC4peC4reC4lAogICDguIjguLbguIfguJXguLTguJTguIrguLfguYjg',
  'uK3guITguK3guKXguLHguKHguJnguYzguYTguKfguYnguJfguLXguYjguYHguJXguYjguKXguLDguIrguYjguK3guIfguJTguYnguKfguKIgZGF0YS1sYWJlbCDguYHguKXguYnguKfguYPguKvguYkgQ1NTCiAgIOC5gOC4m+C5h+C4meC4hOC4meC4leC4seC4lOC4',
  'quC4tOC4meC4p+C5iOC4suC4iOC4sOC5geC4quC4lOC4h+C5gOC4m+C5h+C4meC4leC4suC4o+C4suC4h+C4q+C4o+C4t+C4reC5gOC4m+C5h+C4meC4geC4suC4o+C5jOC4lOC4l+C4teC4peC4sOC4o+C4suC4ouC4geC4suC4owoKICAg4LiX4Liz4LiX4Li14LmI',
  '4LiZ4Li14LmI4LiX4Li14LmI4LmA4LiU4Li14Lii4Lin4Lir4Lil4Lix4LiH4Lin4Liy4LiU4Lir4LiZ4LmJ4Liy4LmA4Liq4Lij4LmH4LiIIOC4l+C4uOC4geC4leC4suC4o+C4suC4h+C5g+C4meC4o+C4sOC4muC4muC4iOC4tuC4h+C5hOC4lOC5ieC4nOC4peC5',
  'gOC4q+C4oeC4t+C4reC4meC4geC4seC4meC4q+C4oeC4lAogICDguYTguKHguYjguJXguYnguK3guIfguYTguKXguYjguYHguIHguYnguJfguLXguKXguLDguJXguLLguKPguLLguIcg4LmB4Lil4Liw4LiV4Liy4Lij4Liy4LiH4LiX4Li14LmI4LmA4Lie4Li04LmI',
  '4Lih4LmD4Lir4Lih4LmI4LiX4Li14Lir4Lil4Lix4LiH4LiB4LmH4LmE4LiU4LmJ4LmE4Lib4LiU4LmJ4Lin4Lii4LmA4Lil4LiiCiAgIEhUTUwg4Lii4Lix4LiH4LmA4Lib4LmH4LiZ4LiK4Li44LiU4LmA4LiU4Li14Lii4LinIOC4leC5iOC4suC4h+C4geC4seC4',
  'meC5geC4hOC5iCBDU1Mg4Lii4LmI4LitLeC4guC4ouC4suC4ouC4q+C4meC5ieC4suC4leC5iOC4suC4h+C4geC5h+C4quC4peC4seC4muC5hOC4lOC5ieC4l+C4seC4meC4l+C4tQotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0t',
  'LS0tLS0tLS0tLS0tLS0tLS0tLS0tICovCmZ1bmN0aW9uIGxhYmVsQ2VsbHMocm9vdCl7CiAgaWYgKCFyb290KSByZXR1cm47CiAgdmFyIHRhYmxlcyA9IHJvb3QucXVlcnlTZWxlY3RvckFsbCA/IHJvb3QucXVlcnlTZWxlY3RvckFsbCgndGFibGUnKSA6IFtdOwog',
  'IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwodGFibGVzLCBmdW5jdGlvbih0KXsKICAgIHZhciBoZWFkcyA9IEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbCh0LnF1ZXJ5U2VsZWN0b3JBbGwoJ3RoZWFkIHRoJyksIGZ1bmN0aW9uKHRoKXsKICAgICAgcmV0dXJu',
  'ICh0aC50ZXh0Q29udGVudCB8fCAnJykudHJpbSgpOwogICAgfSk7CiAgICBpZiAoIWhlYWRzLmxlbmd0aCkgcmV0dXJuOwogICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbCh0LnF1ZXJ5U2VsZWN0b3JBbGwoJ3Rib2R5IHRyJyksIGZ1bmN0aW9uKHRyKXsK',
  'ICAgICAgLy8g4LmB4LiW4Lin4Liq4Lij4Li44Lib4Lir4Lij4Li34Lit4LmB4LiW4LinICLguYTguKHguYjguKHguLXguILguYnguK3guKHguLnguKUiIOC4l+C4teC5iOC4o+C4p+C4oeC4iuC5iOC4reC4hyDguJvguKXguYjguK3guKLguYTguKfguYnguYDguJXg',
  'uYfguKHguITguKfguLLguKHguIHguKfguYnguLLguIcKICAgICAgaWYgKHRyLnF1ZXJ5U2VsZWN0b3IoJ1tjb2xzcGFuXScpKSB7IHRyLmNsYXNzTGlzdC5hZGQoJ3Jvdy13aWRlJyk7IHJldHVybjsgfQogICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxs',
  'KHRyLmNoaWxkcmVuLCBmdW5jdGlvbih0ZCwgaSl7CiAgICAgICAgdmFyIGxhYmVsID0gaGVhZHNbaV0gfHwgJyc7CiAgICAgICAgaWYgKGxhYmVsKSB0ZC5zZXRBdHRyaWJ1dGUoJ2RhdGEtbGFiZWwnLCBsYWJlbCk7CiAgICAgICAgZWxzZSB0ZC5jbGFzc0xpc3Qu',
  'YWRkKCdjZWxsLWFjdGlvbnMnKTsgICAvLyDguITguK3guKXguLHguKHguJnguYzguJvguLjguYjguKEg4LmE4Lih4LmI4Lih4Li14Lir4Lix4Lin4LiV4Liy4Lij4Liy4LiHIOC5hOC4oeC5iOC4leC5ieC4reC4h+C4leC4tOC4lOC4m+C5ieC4suC4ogoKICAgICAg',
  'ICAvLyDguIrguYjguK3guIfguJfguLXguYjguYTguKHguYjguKHguLXguITguYjguLIgKOC4p+C5iOC4suC4h+C4q+C4o+C4t+C4reC4guC4teC4lCkg4Lia4LiZ4LiI4Lit4LmB4LiE4Lia4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LmC4LiK4Lin4LmM4LmA4Lib4LmH',
  '4LiZ4Lia4Lij4Lij4LiX4Lix4LiUCiAgICAgICAgLy8g4LiB4Liy4Lij4LmM4LiU4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4Lii4Liy4Lin4LmA4LiB4LmJ4LitIOC4quC5iOC4p+C4meC4muC4meC4iOC4reC4geC4p+C5ieC4suC4h+C4ouC4seC4h+C4leC5ieC4',
  'reC4h+C4oeC4teC5gOC4nuC4t+C5iOC4reC5g+C4q+C5ieC4hOC4reC4peC4seC4oeC4meC5jOC4leC4o+C4h+C4geC4seC4mQogICAgICAgIHZhciB0eHQgPSAodGQudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKTsKICAgICAgICB2YXIgaGFzVGhpbmcgPSB0ZC5x',
  'dWVyeVNlbGVjdG9yKCdpbWcsYnV0dG9uLGEsaW5wdXQsc3ZnLC50aHVtYicpOwogICAgICAgIGlmICgodHh0ID09PSAnJyB8fCB0eHQgPT09ICfigJMnIHx8IHR4dCA9PT0gJy0nKSAmJiAhaGFzVGhpbmcpIHsKICAgICAgICAgIHRkLmNsYXNzTGlzdC5hZGQoJ2Nl',
  'bGwtZW1wdHknKTsKICAgICAgICB9CiAgICAgIH0pOwogICAgfSk7CiAgfSk7Cn0KCmZ1bmN0aW9uIG9wZW5Nb2RhbCh0aXRsZSwgYm9keUh0bWwsIGZvb3RIdG1sLCB3aWRlKXsKICB2YXIgcm9vdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb2RhbFJvb3Qn',
  'KTsKICByb290LmlubmVySFRNTCA9CiAgICAnPGRpdiBjbGFzcz0ib3YiIG9uY2xpY2s9ImlmKGV2ZW50LnRhcmdldD09PXRoaXMpY2xvc2VNb2RhbCgpIj4nICsKICAgICAgJzxkaXYgY2xhc3M9Im1vZGFsJyArICh3aWRlPycgd2lkZSc6JycpICsgJyI+JyArCiAg',
  'ICAgICAgJzxkaXYgY2xhc3M9Im1vZGFsLWgiPjxoMz4nICsgZXNjKHRpdGxlKSArICc8L2gzPjxidXR0b24gY2xhc3M9IngiIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+w5c8L2J1dHRvbj48L2Rpdj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0ibW9kYWwtYiI+JyAr',
  'IGJvZHlIdG1sICsgJzwvZGl2PicgKwogICAgICAgIChmb290SHRtbCA/ICc8ZGl2IGNsYXNzPSJtb2RhbC1mIj4nICsgZm9vdEh0bWwgKyAnPC9kaXY+JyA6ICcnKSArCiAgICAgICc8L2Rpdj4nICsKICAgICc8L2Rpdj4nOwogIGFwcGx5UmVhZE9ubHkocm9vdCk7',
  'CiAgbGFiZWxDZWxscyhyb290KTsKICBkb2N1bWVudC5ib2R5LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7Cn0KZnVuY3Rpb24gY2xvc2VNb2RhbCgpewogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb2RhbFJvb3QnKS5pbm5lckhUTUwgPSAnJzsKICBkb2N1',
  'bWVudC5ib2R5LnN0eWxlLm92ZXJmbG93ID0gJyc7Cn0KZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGUpeyBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSBjbG9zZU1vZGFsKCk7IH0pOwoKZnVuY3Rpb24gY29uZmlybUFjdGlvbih0',
  'ZXh0LCBvblllcyl7CiAgb3Blbk1vZGFsKCfguKLguLfguJnguKLguLHguJknLAogICAgJzxwPicgKyBlc2ModGV4dCkgKyAnPC9wPicsCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4gTwvYnV0',
  'dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBkZ3IiIGlkPSJjZm1CdG4iPuC4ouC4t+C4meC4ouC4seC4mTwvYnV0dG9uPicpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZm1CdG4nKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsgY2xvc2VNb2RhbCgp',
  'OyBvblllcygpOyB9Owp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIHRvYXN0IC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIHRvYXN0KG1zZywga2luZCl7CiAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgZWwuY2xhc3NOYW1lID0g',
  'J3RvYXN0ICcgKyAoa2luZHx8JycpOwogIGVsLnRleHRDb250ZW50ID0gbXNnOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2FzdFJvb3QnKS5hcHBlbmRDaGlsZChlbCk7CiAgc2V0VGltZW91dChmdW5jdGlvbigpeyBlbC5yZW1vdmUoKTsgfSwga2luZD09',
  'PSdlcnInID8gNTIwMCA6IDI4MDApOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIG5hdiAobW9iaWxlKSAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiB0b2dnbGVOYXYoKXsKICB2YXIgbmF2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdicpOwogIG5h',
  'di5jbGFzc0xpc3QudG9nZ2xlKCdvcGVuJyk7CiAgaWYgKG5hdi5jbGFzc0xpc3QuY29udGFpbnMoJ29wZW4nKSkgewogICAgdmFyIHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICAgIHMuY2xhc3NOYW1lID0gJ3NjcmltJzsgcy5pZCA9ICdzY3Jp',
  'bSc7CiAgICBzLm9uY2xpY2sgPSBmdW5jdGlvbigpeyBuYXYuY2xhc3NMaXN0LnJlbW92ZSgnb3BlbicpOyByZW1vdmVTY3JpbSgpOyB9OwogICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzKTsKICB9IGVsc2UgcmVtb3ZlU2NyaW0oKTsKfQpmdW5jdGlvbiBy',
  'ZW1vdmVTY3JpbSgpewogIHZhciBzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NjcmltJyk7CiAgaWYgKHMpIHMucmVtb3ZlKCk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0gc2VhcmNoIC0tLS0tLS0tLS0tLS0tLS0gKi8KCnZhciBzZWFyY2hUaW1lciA9IG51',
  'bGw7CmZ1bmN0aW9uIG9uU2VhcmNoKHEpewogIGNsZWFyVGltZW91dChzZWFyY2hUaW1lcik7CiAgaWYgKCFxIHx8IHEudHJpbSgpLmxlbmd0aCA8IDIpIHJldHVybjsKICBzZWFyY2hUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2Fw',
  'cC5zZWFyY2gnLCB7IHE6IHEgfSkudGhlbihmdW5jdGlvbihyb3dzKXsKICAgICAgb3Blbk1vZGFsKCfguJzguKXguIHguLLguKPguITguYnguJnguKvguLIgIicgKyBxICsgJyIgKCcgKyByb3dzLmxlbmd0aCArICcpJywKICAgICAgICByb3dzLmxlbmd0aCA/ICc8',
  'ZGl2IGNsYXNzPSJhbGlzdCI+JyArIHJvd3MubWFwKGZ1bmN0aW9uKHIpewogICAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJhbGkiIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtnbyhcJycgKyBqdW1wUGFnZShyLm1vZHVsZSkgKyAnXCcpIj4nICsKICAgICAgICAg',
  'ICAgJzxkaXYgY2xhc3M9ImljIj4nICsgbW9kdWxlSWNvbihyLm1vZHVsZSkgKyAnPC9kaXY+PGRpdj4nICsKICAgICAgICAgICAgJzxkaXYgY2xhc3M9InR0Ij4nICsgZXNjKHIudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAgICAnPGRpdiBjbGFzcz0iZGQi',
  'PicgKyBlc2Moci5sYWJlbCkgKyAoci5kZXRhaWwgPyAnIMK3ICcgKyBlc2Moci5kZXRhaWwpIDogJycpICsgJzwvZGl2PicgKwogICAgICAgICAgICAnPC9kaXY+PC9kaXY+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nCiAgICAgICAgOiAnPGRpdiBj',
  'bGFzcz0iZW1wdHkiPuC5hOC4oeC5iOC4nuC4muC4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4leC4o+C4h+C4geC4seC4muC4hOC4s+C4hOC5ieC4mTwvZGl2PicsICcnLCB0cnVlKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8',
  'fGUsICdlcnInKTsgfSk7CiAgfSwgNDIwKTsKfQpmdW5jdGlvbiBqdW1wUGFnZShtb2R1bGUpewogIHJldHVybiAoe3B1cmNoYXNlczoncHVyY2hhc2VzJywgcmVwYWlyczoncmVwYWlycycsIGJ1aWxkaW5nOididWlsZGluZycsIGFjOidhYycsIGRlYnQ6J2RlYnRN',
  'YWluJywgcm9vbXM6J3Jvb21zJ30pW21vZHVsZV0gfHwgJ2Rhc2hib2FyZCc7Cn0KZnVuY3Rpb24gbW9kdWxlSWNvbihtb2R1bGUpewogIHJldHVybiAoe3B1cmNoYXNlczon8J+bkicsIHJlcGFpcnM6J/CflKcnLCBidWlsZGluZzon8J+PoicsIGFjOifinYTvuI8n',
  'LCBkZWJ0Oifwn5KwJywgcm9vbXM6J/CfmqonfSlbbW9kdWxlXSB8fCAn8J+ThCc7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0gZmlsZSB1cGxvYWQgLS0tLS0tLS0tLS0tLS0tLSAqLwoKLyoqCiAqIOC4reC5iOC4suC4meC5hOC4n+C4peC5jOC4iOC4suC4gSA8aW5w',
  'dXQgdHlwZT1maWxlPiDguYDguJvguYfguJkgZGF0YVVSTCDguYHguKXguYnguKfguKrguYjguIfguILguLbguYnguJkgRHJpdmUKICog4LiE4Li34LiZIGFycmF5IOC4guC4reC4hyB7aWQsbmFtZSx1cmwsdGh1bWJ9CiAqLwpmdW5jdGlvbiB1cGxvYWRGaWxlcyhp',
  'bnB1dEVsLCBidWNrZXQpewogIHZhciBmaWxlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGlucHV0RWwuZmlsZXMgfHwgW10pOwogIGlmICghZmlsZXMubGVuZ3RoKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTsKICB2YXIgTUFYID0gMTIgKiAxMDI0',
  'ICogMTAyNDsKICB2YXIgdG9vQmlnID0gZmlsZXMuZmlsdGVyKGZ1bmN0aW9uKGYpeyByZXR1cm4gZi5zaXplID4gTUFYOyB9KTsKICBpZiAodG9vQmlnLmxlbmd0aCkgewogICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcign4LmE4Lif4Lil4LmM4LmD',
  '4Lir4LiN4LmI4LmA4LiB4Li04LiZIDEyIE1COiAnICsgdG9vQmlnLm1hcChmdW5jdGlvbihmKXtyZXR1cm4gZi5uYW1lO30pLmpvaW4oJywgJykpKTsKICB9CiAgcmV0dXJuIFByb21pc2UuYWxsKGZpbGVzLm1hcChyZWFkQXNEYXRhVXJsKSkKICAgIC50aGVuKGZ1',
  'bmN0aW9uKHBheWxvYWRzKXsgcmV0dXJuIGNhbGxBcGkoJ2ZpbGUudXBsb2FkJywgeyBidWNrZXQ6IGJ1Y2tldCwgZmlsZXM6IHBheWxvYWRzIH0pOyB9KTsKfQoKZnVuY3Rpb24gcmVhZEFzRGF0YVVybChmaWxlKXsKICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rp',
  'b24ocmVzb2x2ZSwgcmVqZWN0KXsKICAgIHZhciByID0gbmV3IEZpbGVSZWFkZXIoKTsKICAgIHIub25sb2FkID0gZnVuY3Rpb24oKXsgcmVzb2x2ZSh7IG5hbWU6IGZpbGUubmFtZSwgbWltZVR5cGU6IGZpbGUudHlwZSwgZGF0YVVybDogci5yZXN1bHQgfSk7IH07',
  'CiAgICByLm9uZXJyb3IgPSBmdW5jdGlvbigpeyByZWplY3QobmV3IEVycm9yKCfguK3guYjguLLguJnguYTguJ/guKXguYzguYTguKHguYjguKrguLPguYDguKPguYfguIg6ICcgKyBmaWxlLm5hbWUpKTsgfTsKICAgIHIucmVhZEFzRGF0YVVSTChmaWxlKTsKICB9',
  'KTsKfQo8L3NjcmlwdD4KPHNjcmlwdD4KLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIEF1dGguaHRtbCDigJQg4Lir4LiZ4LmJ4Liy4Lil4LmH4Lit4LiB4Lit4Li04LiZIMK3IFBJTiA2IOC4q+C4',
  'peC4seC4gSDCtyDguYDguJvguKXguLXguYjguKLguJnguKPguKvguLHguKrguJzguYjguLLguJkKCiAgIOC4l+C4teC5iOC5gOC4geC5h+C4muC4guC4reC4h+C4neC4seC5iOC4h+C5gOC4muC4o+C4suC4p+C5jOC5gOC4i+C4reC4o+C5jCAyIOC4iuC4seC5ieC4',
  'mSDguYDguJ7guKPguLLguLDguYDguKfguYfguJrguYHguK3guJvguILguK3guIcgQXBwcyBTY3JpcHQKICAg4LiX4Liz4LiH4Liy4LiZ4LmD4LiZIGlmcmFtZSDguJfguLXguYjguIrguLfguYjguK3guYLguJTguYDguKHguJnguYDguJvguKXguLXguYjguKLguJng',
  'uJfguLjguIHguITguKPguLHguYnguIfguJfguLXguYjguYDguJvguLTguJQKICAgbG9jYWxTdG9yYWdlIOC4iOC4tuC4h+C4q+C4suC4ouC5hOC4lOC5iSDguJXguYnguK3guIfguKHguLXguJfguLLguIfguKrguLPguKPguK3guIcKICAgICDCtyDguKPguKvguLHg',
  'uKrguK3guYnguLLguIfguK3guLTguIfguIHguLLguKPguYDguILguYnguLLguYPguIrguYnguIfguLLguJkgKOC4reC4suC4ouC4uOC4quC4seC5ieC4mSkg4oCUIOC5gOC4geC5h+C4muC5g+C4mSBsb2NhbFN0b3JhZ2Ug4Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li1',
  '4Lii4LinCiAgICAgICDguKvguLLguKLguIHguYfguYHguITguYjguYPguKrguYggUElOIOC5g+C4q+C4oeC5iAogICAgIMK3IOC4o+C4q+C4seC4quC4reC4uOC4m+C4geC4o+C4k+C5jCAo4LiE4Li54LmI4LiB4Lix4LiaIFBJTikg4oCUIOC5gOC4geC5h+C4muC4',
  'l+C4seC5ieC4hyBsb2NhbFN0b3JhZ2Ug4LmB4Lil4Liw4LmD4LiZIFVSTCDguILguK3guIfguKvguJnguYnguLLguYHguKHguYgKICAgICAgIOC4nOC5iOC4suC4mSBnb29nbGUuc2NyaXB0Lmhpc3Rvcnkg4LmA4Lie4Li34LmI4Lit4LmD4Lir4LmJ4Lii4Lix4LiH',
  '4Lit4Lii4Li54LmI4Lir4Lil4Lix4LiH4Lib4Li04LiU4LmA4Lib4Li04LiU4LmA4LiE4Lij4Li34LmI4Lit4LiHCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKdmFyIEFVVEggPSB7CiAgc2Vz',
  'c2lvbjogJycsCiAgZGV2aWNlOiAnJywKICBtZTogbnVsbCwKICBwaW46ICcnLAogIHNjcmVlbjogJycKfTsKCnZhciBMU19TRVNTSU9OID0gJ21jb3JuZXIuc2Vzc2lvbic7CnZhciBMU19ERVZJQ0UgID0gJ21jb3JuZXIuZGV2aWNlJzsKCi8qIC0tLS0tLS0tLS0t',
  'LS0tLS0g4LiX4Li14LmI4LmA4LiB4LmH4Lia4Lid4Lix4LmI4LiH4LmA4Lia4Lij4Liy4Lin4LmM4LmA4LiL4Lit4Lij4LmMIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIGxzR2V0KGspewogIHRyeSB7IHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLmdl',
  'dEl0ZW0oaykgfHwgJyc7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuICcnOyB9Cn0KZnVuY3Rpb24gbHNTZXQoaywgdil7CiAgdHJ5IHsgdiA/IHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShrLCB2KSA6IHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrKTsg',
  'fQogIGNhdGNoIChlKSB7IC8qIOC5guC4q+C4oeC4lOC4quC5iOC4p+C4meC4leC4seC4p+C4q+C4o+C4t+C4reC4m+C4tOC4lOC4hOC4uOC4geC4geC4teC5ieC5hOC4p+C5iSDigJQg4LmD4LiK4LmJ4LiX4Liy4LiH4Liq4Liz4Lij4Lit4LiHICovIH0KfQoKLyoq',
  'IOC5gOC4guC4teC4ouC4meC4o+C4q+C4seC4quC4reC4uOC4m+C4geC4o+C4k+C5jOC4peC4hyBVUkwg4LiC4Lit4LiH4Lir4LiZ4LmJ4Liy4LmB4Lih4LmIIOC5g+C4q+C5ieC4o+C4reC4lOC4guC5ieC4suC4oeC4geC4suC4o+C5gOC4m+C4tOC4lOC5g+C4q+C4',
  'oeC5iCAqLwpmdW5jdGlvbiBkZXZpY2VUb1VybCh0b2tlbil7CiAgdHJ5IHsKICAgIGlmICghd2luZG93Lmdvb2dsZSB8fCAhZ29vZ2xlLnNjcmlwdCB8fCAhZ29vZ2xlLnNjcmlwdC5oaXN0b3J5KSByZXR1cm47CiAgICB2YXIgcGFyYW1zID0ge307CiAgICBpZiAo',
  'YWNjZXNzS2V5KCkpIHBhcmFtcy5rZXkgPSBhY2Nlc3NLZXkoKTsKICAgIGlmICh0b2tlbikgcGFyYW1zLmQgPSB0b2tlbjsKICAgIGdvb2dsZS5zY3JpcHQuaGlzdG9yeS5yZXBsYWNlU3RhdGUoe30sIHBhcmFtcywgbG9jYXRpb24uaGFzaCk7CiAgfSBjYXRjaCAo',
  'ZSkgeyAvKiDguYTguKHguYjguYPguIrguYjguYDguKfguYfguJrguYHguK3guJsgKOC5gOC4iuC5iOC4meC5gOC4m+C4tOC4lOC5g+C4mSBkaWFsb2cpIOKAlCDguILguYnguLLguKHguYTguJsgKi8gfQp9CgpmdW5jdGlvbiBzYXZlRGV2aWNlKHRva2VuKXsKICBB',
  'VVRILmRldmljZSA9IHRva2VuIHx8ICcnOwogIGxzU2V0KExTX0RFVklDRSwgQVVUSC5kZXZpY2UpOwogIGRldmljZVRvVXJsKEFVVEguZGV2aWNlKTsKfQoKZnVuY3Rpb24gc2F2ZVNlc3Npb24odG9rZW4pewogIEFVVEguc2Vzc2lvbiA9IHRva2VuIHx8ICcnOwog',
  'IGxzU2V0KExTX1NFU1NJT04sIEFVVEguc2Vzc2lvbik7Cn0KCi8qKiDguK3guYjguLLguJnguITguYjguLLguJfguLXguYjguYDguIHguYfguJrguYTguKfguYnguJfguLHguYnguIfguKvguKHguJQgKOC4leC5ieC4reC4h+C4o+C4rSBVUkwg4LiC4Lit4LiH4Lir',
  '4LiZ4LmJ4Liy4LmB4Lih4LmIIOC4iOC4tuC4h+C5gOC4m+C5h+C4meC5geC4muC4miBjYWxsYmFjaykgKi8KZnVuY3Rpb24gbG9hZFN0b3JlZChkb25lKXsKICBBVVRILnNlc3Npb24gPSBsc0dldChMU19TRVNTSU9OKTsKICBBVVRILmRldmljZSAgPSBsc0dldChM',
  'U19ERVZJQ0UpOwoKICBpZiAod2luZG93Lmdvb2dsZSAmJiBnb29nbGUuc2NyaXB0ICYmIGdvb2dsZS5zY3JpcHQudXJsKSB7CiAgICB0cnkgewogICAgICBnb29nbGUuc2NyaXB0LnVybC5nZXRMb2NhdGlvbihmdW5jdGlvbihsb2MpewogICAgICAgIHZhciBwID0g',
  'KGxvYyAmJiBsb2MucGFyYW1ldGVyKSB8fCB7fTsKICAgICAgICBpZiAocC5kICYmICFBVVRILmRldmljZSkgeyBBVVRILmRldmljZSA9IFN0cmluZyhwLmQpOyBsc1NldChMU19ERVZJQ0UsIEFVVEguZGV2aWNlKTsgfQogICAgICAgIGlmIChwLmtleSAmJiAhYWNj',
  'ZXNzS2V5KCkpIFJFU09MVkVEX0tFWSA9IFN0cmluZyhwLmtleSk7CiAgICAgICAgZG9uZSgpOwogICAgICB9KTsKICAgICAgcmV0dXJuOwogICAgfSBjYXRjaCAoZSkgeyAvKiDguYPguIrguYnguJfguLLguIfguJvguIHguJXguLQgKi8gfQogIH0KICBkb25lKCk7',
  'Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4LiV4Lix4Lin4LiE4Li44Lih4Lil4Liz4LiU4Lix4Lia4Lir4LiZ4LmJ4Liy4LiI4LitIC0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKiDguYDguKPguLXguKLguIHguJXguK3guJnguYDguJvguLTguJTguKvguJnguYnguLLg',
  'uYDguKfguYfguJog4oCUIOC4leC4seC4lOC4quC4tOC4meC4p+C5iOC4suC4iOC4sOC5g+C4q+C5ieC5gOC4q+C5h+C4meC4reC4sOC5hOC4o+C4geC5iOC4reC4mSAqLwpmdW5jdGlvbiBhdXRoR2F0ZSgpewogIGxvYWRTdG9yZWQoZnVuY3Rpb24oKXsKICAgIGNh',
  'bGxBcGkoJ2F1dGgubWUnKS50aGVuKGZ1bmN0aW9uKG1lKXsKICAgICAgQVVUSC5tZSA9IG1lOwogICAgICBpZiAobWUuc2lnbmVkSW4pIHJldHVybiBlbnRlckFwcChtZSk7CiAgICAgIGlmIChBVVRILmRldmljZSkgcmV0dXJuIHNob3dQaW4oKTsKICAgICAgc2hv',
  'd0xvZ2luKCk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgc2hvd0xvZ2luKGUubWVzc2FnZSB8fCBlKTsKICAgIH0pOwogIH0pOwp9CgpmdW5jdGlvbiBlbnRlckFwcChtZSl7CiAgQVVUSC5tZSA9IG1lOwogIGhpZGVBdXRoKCk7CiAgYm9vdE5vdygp',
  'OwogIC8vIOC5gOC4nuC4tOC5iOC4h+C4peC5h+C4reC4geC4reC4tOC4meC4lOC5ieC4p+C4ouC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5geC4peC4sOC4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4leC4seC5ieC4hyBQSU4g4Lia4LiZ4LmA4LiE4Lij4Li3',
  '4LmI4Lit4LiH4LiZ4Li14LmJIOKAlCDguIrguKfguJnguJXguLHguYnguIfguKrguLHguIHguITguKPguLHguYnguIcKICBpZiAoIUFVVEguZGV2aWNlICYmIG1lLnVzZXJuYW1lICYmICFsc0dldCgnbWNvcm5lci5waW5Bc2tlZCcpKSB7CiAgICBzZXRUaW1lb3V0',
  'KG9mZmVyUGluLCA5MDApOwogIH0KfQoKZnVuY3Rpb24gaGlkZUF1dGgoKXsKICB2YXIgciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdXRoUm9vdCcpOwogIGlmIChyKSByLmlubmVySFRNTCA9ICcnOwogIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92',
  'ZSgnbG9ja2VkJyk7Cn0KCmZ1bmN0aW9uIHNob3dBdXRoKGh0bWwpewogIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnbG9ja2VkJyk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F1dGhSb290JykuaW5uZXJIVE1MID0KICAgICc8ZGl2IGNsYXNzPSJh',
  'dXRoLXdyYXAiPjxkaXYgY2xhc3M9ImF1dGgtY2FyZCI+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJhdXRoLWJyYW5kIj7wn4+iIDxiPicgKyBlc2MoKFMuYm9vdCAmJiBTLmJvb3QuYXBwICYmIFMuYm9vdC5hcHAubmFtZSkgfHwgJ1RoZSBNIENvcm5lciBBUCcpICsg',
  'JzwvYj48L2Rpdj4nICsKICAgICAgaHRtbCArCiAgICAnPC9kaXY+PC9kaXY+JzsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguKvguJnguYnguLLguKXguYfguK3guIHguK3guLTguJnguJTguYnguKfguKLguKPguKvguLHguKrguJzguYjguLLguJkgLS0tLS0tLS0t',
  'LS0tLS0tLSAqLwoKZnVuY3Rpb24gc2hvd0xvZ2luKGVycil7CiAgQVVUSC5zY3JlZW4gPSAnbG9naW4nOwogIHNob3dBdXRoKAogICAgJzxoMiBjbGFzcz0iYXV0aC1oIj7guYDguILguYnguLLguKrguLnguYjguKPguLDguJrguJo8L2gyPicgKwogICAgJzxwIGNs',
  'YXNzPSJhdXRoLXN1YiI+4LmD4Liq4LmI4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmB4Lil4Liw4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LiX4Li14LmI4LmE4LiU4LmJ4Lij4Lix4LiaPC9wPicgKwogICAgKGVyciA/ICc8ZGl2IGNsYXNzPSJhdXRo',
  'LWVyciI+JyArIGVzYyhlcnIpICsgJzwvZGl2PicgOiAnPGRpdiBjbGFzcz0iYXV0aC1lcnIiIGlkPSJhdXRoRXJyIiBoaWRkZW4+PC9kaXY+JykgKwogICAgJzxkaXYgY2xhc3M9ImF1dGgtZiI+PGxhYmVsIGZvcj0ibGdVc2VyIj7guIrguLfguYjguK3guJzguLng',
  'uYnguYPguIrguYk8L2xhYmVsPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJsZ1VzZXIiIGF1dG9jb21wbGV0ZT0idXNlcm5hbWUiIGF1dG9jYXBpdGFsaXplPSJub25lIiBzcGVsbGNoZWNrPSJmYWxzZSI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFz',
  'cz0iYXV0aC1mIj48bGFiZWwgZm9yPSJsZ1Bhc3MiPuC4o+C4q+C4seC4quC4nOC5iOC4suC4mTwvbGFiZWw+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImxnUGFzcyIgdHlwZT0icGFzc3dvcmQiIGF1dG9jb21wbGV0ZT0iY3VycmVudC1wYXNzd29y',
  'ZCI+PC9kaXY+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSBhdXRoLWdvIiBpZD0ibGdHbyI+4LmA4LiC4LmJ4Liy4Liq4Li54LmI4Lij4Liw4Lia4LiaPC9idXR0b24+JyArCiAgICAoQVVUSC5kZXZpY2UgPyAnPGJ1dHRvbiBjbGFzcz0iYnRuIGF1dGgt',
  'YWx0IiBvbmNsaWNrPSJzaG93UGluKCkiPuKGkCDguIHguKXguLHguJrguYTguJvguYPguIrguYkgUElOPC9idXR0b24+JyA6ICcnKSArCiAgICAnPHAgY2xhc3M9ImF1dGgtZm9vdCI+4Lil4Li34Lih4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZPyDguYPguKvguYng',
  'uJzguLnguYnguJTguLnguYHguKXguJXguLHguYnguIfguKPguKvguLHguKrguYPguKvguKHguYjguYPguKvguYnguIjguLLguIHguYDguKHguJnguLnguYPguJnguIrguLXguJU8L3A+JwogICk7CgogIHZhciBnbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCds',
  'Z0dvJyk7CiAgdmFyIHVzZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGdVc2VyJyk7CiAgdmFyIHBhc3MgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGdQYXNzJyk7CgogIGZ1bmN0aW9uIHN1Ym1pdCgpewogICAgdmFyIHUgPSB1c2VyLnZhbHVlLnRy',
  'aW0oKSwgcCA9IHBhc3MudmFsdWU7CiAgICBpZiAoIXUgfHwgIXApIHJldHVybiBhdXRoRXJyb3IoJ+C4geC4o+C4uOC4k+C4suC4geC4o+C4reC4geC4l+C4seC5ieC4h+C4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5ieC5geC4peC4sOC4o+C4q+C4seC4quC4',
  'nOC5iOC4suC4mScpOwogICAgZ28uZGlzYWJsZWQgPSB0cnVlOwogICAgZ28uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C4leC4o+C4p+C4iOC4quC4reC4muKApic7CiAgICBjYWxsQXBpKCdhdXRoLmxvZ2lu',
  'JywgeyB1c2VybmFtZTogdSwgcGFzc3dvcmQ6IHAgfSkudGhlbihmdW5jdGlvbihyKXsKICAgICAgc2F2ZVNlc3Npb24oci5zZXNzaW9uKTsKICAgICAgaWYgKHIubXVzdENoYW5nZSkgcmV0dXJuIHNob3dDaGFuZ2VQYXNzd29yZCh0cnVlKTsKICAgICAgcmV0dXJu',
  'IGNhbGxBcGkoJ2F1dGgubWUnKS50aGVuKGVudGVyQXBwKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICBnby5kaXNhYmxlZCA9IGZhbHNlOwogICAgICBnby50ZXh0Q29udGVudCA9ICfguYDguILguYnguLLguKrguLnguYjguKPguLDguJrguJonOwog',
  'ICAgICBwYXNzLnZhbHVlID0gJyc7CiAgICAgIGF1dGhFcnJvcihlLm1lc3NhZ2UgfHwgZSk7CiAgICB9KTsKICB9CgogIGdvLm9uY2xpY2sgPSBzdWJtaXQ7CiAgW3VzZXIsIHBhc3NdLmZvckVhY2goZnVuY3Rpb24oZWwpewogICAgZWwuYWRkRXZlbnRMaXN0ZW5l',
  'cigna2V5ZG93bicsIGZ1bmN0aW9uKGV2KXsgaWYgKGV2LmtleSA9PT0gJ0VudGVyJykgc3VibWl0KCk7IH0pOwogIH0pOwogIHVzZXIuZm9jdXMoKTsKfQoKZnVuY3Rpb24gYXV0aEVycm9yKG1zZyl7CiAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQo',
  'J2F1dGhFcnInKTsKICBpZiAoZWwpIHsgZWwudGV4dENvbnRlbnQgPSBtc2c7IGVsLmhpZGRlbiA9IGZhbHNlOyB9CiAgZWxzZSBzaG93TG9naW4obXNnKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguKvguJnguYnguLIgUElOIDYg4Lir4Lil4Lix4LiBIC0tLS0t',
  'LS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIHNob3dQaW4oKXsKICBBVVRILnNjcmVlbiA9ICdwaW4nOwogIEFVVEgucGluID0gJyc7CiAgc2hvd0F1dGgoCiAgICAnPGgyIGNsYXNzPSJhdXRoLWgiPuC5g+C4quC5iCBQSU48L2gyPicgKwogICAgJzxwIGNsYXNzPSJh',
  'dXRoLXN1YiI+4Lib4Lil4LiU4Lil4LmH4Lit4LiB4LiU4LmJ4Lin4Lii4Lij4Lir4Lix4LiqIDYg4Lir4Lil4Lix4LiB4LiC4Lit4LiH4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJPC9wPicgKwogICAgJzxkaXYgY2xhc3M9ImF1dGgtZXJyIiBpZD0iYXV0',
  'aEVyciIgaGlkZGVuPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InBpbi1kb3RzIiBpZD0icGluRG90cyI+JyArIHBpbkRvdHNIdG1sKCcnKSArICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJwaW4tcGFkIj4nICsKICAgICAgWzEsMiwzLDQsNSw2LDcsOCw5',
  'XS5tYXAoZnVuY3Rpb24obil7CiAgICAgICAgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJwaW4tayIgb25jbGljaz0icGluUHVzaChcJycgKyBuICsgJ1wnKSI+JyArIG4gKyAnPC9idXR0b24+JzsKICAgICAgfSkuam9pbignJykgKwogICAgICAnPGJ1dHRvbiBjbGFz',
  'cz0icGluLWsgZ2hvc3QiIG9uY2xpY2s9InNob3dMb2dpbigpIiB0aXRsZT0i4LmD4LiK4LmJ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmB4LiX4LiZIj7wn5SRPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJwaW4tayIgb25jbGljaz0icGluUHVz',
  'aChcJzBcJykiPjA8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9InBpbi1rIGdob3N0IiBvbmNsaWNrPSJwaW5CYWNrKCkiIHRpdGxlPSLguKXguJoiPuKMqzwvYnV0dG9uPicgKwogICAgJzwvZGl2PicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBh',
  'dXRoLWFsdCIgb25jbGljaz0iZm9yZ2V0VGhpc0RldmljZSgpIj7guKXguLfguKEgUElOIOKAlCDguYDguILguYnguLLguJTguYnguKfguKLguKPguKvguLHguKrguJzguYjguLLguJk8L2J1dHRvbj4nCiAgKTsKCiAgLy8g4LiE4Li14Lii4LmM4Lia4Lit4Lij4LmM',
  '4LiU4LiI4Lij4Li04LiH4LiB4LmH4LmD4LiK4LmJ4LmE4LiU4LmJIOC5hOC4oeC5iOC4leC5ieC4reC4h+C4iOC4tOC5ieC4oeC4m+C4uOC5iOC4oeC4muC4meC4iOC4rQogIGRvY3VtZW50Lm9ua2V5ZG93biA9IGZ1bmN0aW9uKGV2KXsKICAgIGlmIChBVVRILnNj',
  'cmVlbiAhPT0gJ3BpbicpIHJldHVybjsKICAgIGlmICgvXlxkJC8udGVzdChldi5rZXkpKSBwaW5QdXNoKGV2LmtleSk7CiAgICBlbHNlIGlmIChldi5rZXkgPT09ICdCYWNrc3BhY2UnKSBwaW5CYWNrKCk7CiAgfTsKfQoKZnVuY3Rpb24gcGluRG90c0h0bWwocGlu',
  'KXsKICB2YXIgaHRtbCA9ICcnOwogIGZvciAodmFyIGkgPSAwOyBpIDwgNjsgaSsrKSBodG1sICs9ICc8aSBjbGFzcz0iJyArIChpIDwgcGluLmxlbmd0aCA/ICdvbicgOiAnJykgKyAnIj48L2k+JzsKICByZXR1cm4gaHRtbDsKfQoKZnVuY3Rpb24gcGluUHVzaChk',
  'KXsKICBpZiAoQVVUSC5waW4ubGVuZ3RoID49IDYpIHJldHVybjsKICBBVVRILnBpbiArPSBkOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaW5Eb3RzJykuaW5uZXJIVE1MID0gcGluRG90c0h0bWwoQVVUSC5waW4pOwogIGlmIChBVVRILnBpbi5sZW5ndGgg',
  'PT09IDYpIHNldFRpbWVvdXQocGluU3VibWl0LCAxMjApOwp9CgpmdW5jdGlvbiBwaW5CYWNrKCl7CiAgQVVUSC5waW4gPSBBVVRILnBpbi5zbGljZSgwLCAtMSk7CiAgdmFyIGQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGluRG90cycpOwogIGlmIChkKSBk',
  'LmlubmVySFRNTCA9IHBpbkRvdHNIdG1sKEFVVEgucGluKTsKfQoKZnVuY3Rpb24gcGluU3VibWl0KCl7CiAgdmFyIHBpbiA9IEFVVEgucGluOwogIEFVVEgucGluID0gJyc7CiAgdmFyIGRvdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGluRG90cycpOwog',
  'IGlmIChkb3RzKSBkb3RzLmNsYXNzTGlzdC5hZGQoJ2J1c3knKTsKCiAgY2FsbEFwaSgnYXV0aC51bmxvY2snLCB7IGRldmljZTogQVVUSC5kZXZpY2UsIHBpbjogcGluIH0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICBzYXZlU2Vzc2lvbihyLnNlc3Npb24pOwogICAg',
  'ZG9jdW1lbnQub25rZXlkb3duID0gbnVsbDsKICAgIHJldHVybiBjYWxsQXBpKCdhdXRoLm1lJykudGhlbihlbnRlckFwcCk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICB2YXIgbXNnID0gU3RyaW5nKGUubWVzc2FnZSB8fCBlKTsKICAgIGlmIChkb3RzKSB7',
  'IGRvdHMuY2xhc3NMaXN0LnJlbW92ZSgnYnVzeScpOyBkb3RzLmNsYXNzTGlzdC5hZGQoJ3NoYWtlJyk7IGRvdHMuaW5uZXJIVE1MID0gcGluRG90c0h0bWwoJycpOyB9CiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IGlmIChkb3RzKSBkb3RzLmNsYXNzTGlzdC5y',
  'ZW1vdmUoJ3NoYWtlJyk7IH0sIDUwMCk7CiAgICBhdXRoRXJyb3IobXNnKTsKICAgIC8vIFBJTiDguJbguLnguIHguKLguIHguYDguKXguLTguIHguYTguJvguYHguKXguYnguKcgKOC4nOC4tOC4lOC4hOC4o+C4muC5guC4hOC4p+C4leC4siAvIOC4q+C4oeC4lOC4',
  'reC4suC4ouC4uCkg4oCUIOC4leC5ieC4reC4h+C4geC4peC4seC4muC5hOC4m+C5g+C4iuC5ieC4o+C4q+C4seC4quC4nOC5iOC4suC4mQogICAgaWYgKC/guKXguYfguK3guIHguK3guLTguJnguJTguYnguKfguKLguKPguKvguLHguKrguJzguYjguLLguJkvLnRl',
  'c3QobXNnKSkgewogICAgICBzYXZlRGV2aWNlKCcnKTsKICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyBzaG93TG9naW4obXNnKTsgfSwgMTQwMCk7CiAgICB9CiAgfSk7Cn0KCmZ1bmN0aW9uIGZvcmdldFRoaXNEZXZpY2UoKXsKICB2YXIgdG9rZW4gPSBBVVRI',
  'LmRldmljZTsKICBzYXZlRGV2aWNlKCcnKTsKICBsc1NldCgnbWNvcm5lci5waW5Bc2tlZCcsICcnKTsKICBkb2N1bWVudC5vbmtleWRvd24gPSBudWxsOwogIGlmICh0b2tlbikgY2FsbEFwaSgnYXV0aC5mb3JnZXREZXZpY2UnLCB7IGRldmljZTogdG9rZW4gfSku',
  'Y2F0Y2goZnVuY3Rpb24oKXsgLyog4Lir4Lih4LiU4Lit4Liy4Lii4Li44LmE4Lib4LmB4Lil4LmJ4Lin4LiB4LmH4LiK4LmI4Liy4LiH4Lih4Lix4LiZICovIH0pOwogIHNob3dMb2dpbigpOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4leC4seC5ieC4hyBQSU4g',
  'LS0tLS0tLS0tLS0tLS0tLSAqLwoKLyoqIOC4iuC4p+C4meC4leC4seC5ieC4hyBQSU4g4Lir4Lil4Lix4LiH4Lil4LmH4Lit4LiB4Lit4Li04LiZ4LiE4Lij4Lix4LmJ4LiH4LmB4Lij4LiB4Lia4LiZ4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJICovCmZ1',
  'bmN0aW9uIG9mZmVyUGluKCl7CiAgbHNTZXQoJ21jb3JuZXIucGluQXNrZWQnLCAnMScpOwogIG9wZW5Nb2RhbCgn4LiV4Lix4LmJ4LiHIFBJTiDguKrguLPguKvguKPguLHguJrguYDguITguKPguLfguYjguK3guIfguJnguLXguYknLAogICAgJzxwPuC4leC4seC5',
  'ieC4h+C4o+C4q+C4seC4qiA2IOC4q+C4peC4seC4geC5hOC4p+C5iSDguIjguLDguYTguJTguYnguYTguKHguYjguJXguYnguK3guIfguJ7guLTguKHguJ7guYzguKPguKvguLHguKrguJzguYjguLLguJnguJfguLjguIHguITguKPguLHguYnguIfguJfguLXguYjg',
  'uYDguJvguLTguJQ8L3A+JyArCiAgICAnPHAgY2xhc3M9Im11dGVkIGZzMTMiPlBJTiDguJzguLnguIHguIHguLHguJrguYDguITguKPguLfguYjguK3guIfguJnguLXguYnguYDguITguKPguLfguYjguK3guIfguYDguJTguLXguKLguKcg4LmA4LiE4Lij4Li34LmI',
  '4Lit4LiH4Lit4Li34LmI4LiZ4LmD4LiK4LmJ4LmE4Lih4LmI4LmE4LiU4LmJIMK3IOC4ouC4geC5gOC4peC4tOC4geC5gOC4oeC4t+C5iOC4reC5hOC4q+C4o+C5iOC4geC5h+C5hOC4lOC5ieC5g+C4meC4q+C4meC5ieC4suC4leC4seC5ieC4h+C4hOC5iOC4sjwv',
  'cD4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guYTguKfguYnguIHguYjguK3guJk8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCk7Zm9ybVNldFBpbigp',
  'Ij7guJXguLHguYnguIcgUElOIOC5gOC4peC4ojwvYnV0dG9uPicpOwp9CgpmdW5jdGlvbiBmb3JtU2V0UGluKCl7CiAgb3Blbk1vZGFsKCfguJXguLHguYnguIcgUElOIDYg4Lir4Lil4Lix4LiBJywKICAgICc8ZGl2IGNsYXNzPSJmZ3JpZCI+JyArCiAgICAgICc8',
  'ZGl2IGNsYXNzPSJmIGZ1bGwiPjxsYWJlbCBmb3I9InBpbjEiPlBJTiDguYPguKvguKHguYg8L2xhYmVsPicgKwogICAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9InBpbjEiIHR5cGU9InBhc3N3b3JkIiBpbnB1dG1vZGU9Im51bWVyaWMiIG1heGxlbmd0aD0i',
  'NiIgJyArCiAgICAgICAgJ2F1dG9jb21wbGV0ZT0ibmV3LXBhc3N3b3JkIiBwbGFjZWhvbGRlcj0i4oCi4oCi4oCi4oCi4oCi4oCiIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYgZnVsbCI+PGxhYmVsIGZvcj0icGluMiI+4LmD4Liq4LmIIFBJTiDguK3g',
  'uLXguIHguITguKPguLHguYnguIc8L2xhYmVsPicgKwogICAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9InBpbjIiIHR5cGU9InBhc3N3b3JkIiBpbnB1dG1vZGU9Im51bWVyaWMiIG1heGxlbmd0aD0iNiIgJyArCiAgICAgICAgJ2F1dG9jb21wbGV0ZT0ibmV3',
  'LXBhc3N3b3JkIiBwbGFjZWhvbGRlcj0i4oCi4oCi4oCi4oCi4oCi4oCiIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYgZnVsbCI+PGxhYmVsIGZvcj0icGluRGV2Ij7guIrguLfguYjguK3guYDguITguKPguLfguYjguK3guIcgKOC5hOC4p+C5ieC4lOC4',
  'ueC4ouC5ieC4reC4meC4q+C4peC4seC4hyk8L2xhYmVsPicgKwogICAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9InBpbkRldiIgdmFsdWU9IicgKyBlc2MoZ3Vlc3NEZXZpY2VOYW1lKCkpICsgJyI+PC9kaXY+JyArCiAgICAnPC9kaXY+JyArCiAgICAnPHAg',
  'Y2xhc3M9Im11dGVkIGZzMTMgbXQ4Ij7guKvguKXguLXguIHguYDguKXguLXguYjguKLguIfguYDguKXguILguJfguLXguYjguYDguJTguLLguIfguYjguLLguKIg4LmA4LiK4LmI4LiZIDExMTExMSDguKvguKPguLfguK0gMTIzNDU2PC9wPicsCiAgICAnPGJ1dHRv',
  'biBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4gTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIGlkPSJwaW5HbyI+4Lia4Lix4LiZ4LiX4Li24LiBIFBJTjwvYnV0dG9uPicpOwoKICBkb2N1',
  'bWVudC5nZXRFbGVtZW50QnlJZCgncGluR28nKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsKICAgIHZhciBhID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpbjEnKS52YWx1ZTsKICAgIHZhciBiID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpbjInKS52YWx1',
  'ZTsKICAgIGlmICghL15cZHs2fSQvLnRlc3QoYSkpIHJldHVybiB0b2FzdCgnUElOIOC4leC5ieC4reC4h+C5gOC4m+C5h+C4meC4leC4seC4p+C5gOC4peC4giA2IOC4q+C4peC4seC4gScsICdlcnInKTsKICAgIGlmIChhICE9PSBiKSByZXR1cm4gdG9hc3QoJ1BJ',
  'TiDguKrguK3guIfguIrguYjguK3guIfguYTguKHguYjguJXguKPguIfguIHguLHguJknLCAnZXJyJyk7CiAgICB2YXIgYnRuID0gdGhpczsKICAgIGJ0bi5kaXNhYmxlZCA9IHRydWU7CiAgICBidG4uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3Nw',
  'YW4+IOC4geC4s+C4peC4seC4h+C4muC4seC4meC4l+C4tuC4geKApic7CiAgICBjYWxsQXBpKCdhdXRoLnNldFBpbicsIHsgcGluOiBhLCBkZXZpY2U6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaW5EZXYnKS52YWx1ZSB9KS50aGVuKGZ1bmN0aW9uKHIpewog',
  'ICAgICBzYXZlRGV2aWNlKHIuZGV2aWNlKTsKICAgICAgY2xvc2VNb2RhbCgpOwogICAgICB0b2FzdCgn4LiV4Lix4LmJ4LiHIFBJTiDguYDguKPguLXguKLguJrguKPguYnguK3guKIg4oCUIOC4hOC4o+C4seC5ieC4h+C4q+C4meC5ieC4suC5g+C4quC5iOC5geC4',
  'hOC5iCA2IOC4q+C4peC4seC4gScsICdvaycpOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlOwogICAgICBidG4udGV4dENvbnRlbnQgPSAn4Lia4Lix4LiZ4LiX4Li24LiBIFBJTic7CiAgICAgIHRvYXN0KGUubWVz',
  'c2FnZSB8fCBlLCAnZXJyJyk7CiAgICB9KTsKICB9Owp9CgpmdW5jdGlvbiBndWVzc0RldmljZU5hbWUoKXsKICB2YXIgdWEgPSBuYXZpZ2F0b3IudXNlckFnZW50IHx8ICcnOwogIGlmICgvaVBob25lLy50ZXN0KHVhKSkgcmV0dXJuICdpUGhvbmUnOwogIGlmICgv',
  'aVBhZC8udGVzdCh1YSkpIHJldHVybiAnaVBhZCc7CiAgaWYgKC9BbmRyb2lkLy50ZXN0KHVhKSkgcmV0dXJuICdBbmRyb2lkJzsKICBpZiAoL01hY2ludG9zaC8udGVzdCh1YSkpIHJldHVybiAnTWFjJzsKICBpZiAoL1dpbmRvd3MvLnRlc3QodWEpKSByZXR1cm4g',
  'J1dpbmRvd3MnOwogIHJldHVybiAn4Lit4Li44Lib4LiB4Lij4LiT4LmM4LiC4Lit4LiH4LiJ4Lix4LiZJzsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguYDguJvguKXguLXguYjguKLguJnguKPguKvguLHguKrguJzguYjguLLguJkgLS0tLS0tLS0tLS0tLS0tLSAq',
  'LwoKLyoqIEBwYXJhbSB7Ym9vbGVhbn0gZm9yY2VkIHRydWUgPSDguKPguLDguJrguJrguJrguLHguIfguITguLHguJrguYDguJvguKXguLXguYjguKLguJnguJXguK3guJnguKXguYfguK3guIHguK3guLTguJnguITguKPguLHguYnguIfguYHguKPguIEgKi8KZnVu',
  'Y3Rpb24gc2hvd0NoYW5nZVBhc3N3b3JkKGZvcmNlZCl7CiAgaWYgKCFmb3JjZWQpIHJldHVybiBmb3JtQ2hhbmdlUGFzc3dvcmQoKTsKICBBVVRILnNjcmVlbiA9ICdjaGFuZ2UnOwogIHNob3dBdXRoKAogICAgJzxoMiBjbGFzcz0iYXV0aC1oIj7guJXguLHguYng',
  'uIfguKPguKvguLHguKrguJzguYjguLLguJnguILguK3guIfguITguLjguJPguYDguK3guIc8L2gyPicgKwogICAgJzxwIGNsYXNzPSJhdXRoLXN1YiI+4Lij4Lir4Lix4Liq4LiX4Li14LmI4LmE4LiU4LmJ4Lih4Liy4LmA4Lib4LmH4LiZ4Lij4Lir4Lix4Liq4LiK',
  '4Lix4LmI4Lin4LiE4Lij4Liy4LinIOC5gOC4m+C4peC4teC5iOC4ouC4meC4geC5iOC4reC4meC5g+C4iuC5ieC4h+C4suC4meC4q+C4meC4tuC5iOC4h+C4hOC4o+C4seC5ieC4hzwvcD4nICsKICAgICc8ZGl2IGNsYXNzPSJhdXRoLWVyciIgaWQ9ImF1dGhFcnIi',
  'IGhpZGRlbj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJhdXRoLWYiPjxsYWJlbCBmb3I9ImNwT2xkIj7guKPguKvguLHguKrguJzguYjguLLguJnguYDguJTguLTguKE8L2xhYmVsPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJjcE9sZCIgdHlw',
  'ZT0icGFzc3dvcmQiIGF1dG9jb21wbGV0ZT0iY3VycmVudC1wYXNzd29yZCI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iYXV0aC1mIj48bGFiZWwgZm9yPSJjcE5ldyI+4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmIICjguK3guKLguYjguLLg',
  'uIfguJnguYnguK3guKIgOCDguJXguLHguKcpPC9sYWJlbD4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0iY3BOZXciIHR5cGU9InBhc3N3b3JkIiBhdXRvY29tcGxldGU9Im5ldy1wYXNzd29yZCI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iYXV0',
  'aC1mIj48bGFiZWwgZm9yPSJjcE5ldzIiPuC5g+C4quC5iOC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iOC4reC4teC4geC4hOC4o+C4seC5ieC4hzwvbGFiZWw+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImNwTmV3MiIgdHlwZT0i',
  'cGFzc3dvcmQiIGF1dG9jb21wbGV0ZT0ibmV3LXBhc3N3b3JkIj48L2Rpdj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIGF1dGgtZ28iIGlkPSJjcEdvIj7guJrguLHguJnguJfguLbguIHguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYg8',
  'L2J1dHRvbj4nCiAgKTsKCiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NwR28nKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsKICAgIHZhciBvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NwT2xkJykudmFsdWU7CiAgICB2YXIgbiA9IGRvY3VtZW50LmdldEVs',
  'ZW1lbnRCeUlkKCdjcE5ldycpLnZhbHVlOwogICAgdmFyIG4yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NwTmV3MicpLnZhbHVlOwogICAgaWYgKG4ubGVuZ3RoIDwgOCkgcmV0dXJuIGF1dGhFcnJvcign4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir',
  '4Lih4LmI4LiV4LmJ4Lit4LiH4Lii4Liy4Lin4Lit4Lii4LmI4Liy4LiH4LiZ4LmJ4Lit4LiiIDgg4LiV4Lix4Lin4Lit4Lix4LiB4Lip4LijJyk7CiAgICBpZiAobiAhPT0gbjIpIHJldHVybiBhdXRoRXJyb3IoJ+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4',
  'q+C4oeC5iOC4quC4reC4h+C4iuC5iOC4reC4h+C5hOC4oeC5iOC4leC4o+C4h+C4geC4seC4mScpOwogICAgdmFyIGJ0biA9IHRoaXM7CiAgICBidG4uZGlzYWJsZWQgPSB0cnVlOwogICAgYnRuLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFu',
  'PiDguIHguLPguKXguLHguIfguJrguLHguJnguJfguLbguIHigKYnOwogICAgY2FsbEFwaSgnYXV0aC5jaGFuZ2VQYXNzd29yZCcsIHsgb2xkUGFzc3dvcmQ6IG8sIG5ld1Bhc3N3b3JkOiBuLCBfZGV2aWNlOiBBVVRILmRldmljZSB8fCAnJyB9KS50aGVuKGZ1bmN0',
  'aW9uKCl7CiAgICAgIHJldHVybiBjYWxsQXBpKCdhdXRoLm1lJykudGhlbihlbnRlckFwcCk7CiAgICB9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICAgIHRvYXN0KCfguYDguJvguKXguLXguYjguKLguJnguKPguKvguLHguKrguJzguYjguLLguJnguYDguKPguLXguKLg',
  'uJrguKPguYnguK3guKInLCAnb2snKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTsKICAgICAgYnRuLnRleHRDb250ZW50ID0gJ+C4muC4seC4meC4l+C4tuC4geC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4',
  'q+C4oeC5iCc7CiAgICAgIGF1dGhFcnJvcihlLm1lc3NhZ2UgfHwgZSk7CiAgICB9KTsKICB9OwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjcE9sZCcpLmZvY3VzKCk7Cn0KCmZ1bmN0aW9uIGZvcm1DaGFuZ2VQYXNzd29yZCgpewogIG9wZW5Nb2RhbCgn4LmA',
  '4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZJywKICAgICc8ZGl2IGNsYXNzPSJmZ3JpZCI+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIGZ1bGwiPjxsYWJlbCBmb3I9Im1jT2xkIj7guKPguKvguLHguKrguJzguYjguLLguJnguYDguJTg',
  'uLTguKE8L2xhYmVsPjxpbnB1dCBjbGFzcz0iaW5wIiBpZD0ibWNPbGQiIHR5cGU9InBhc3N3b3JkIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYgZnVsbCI+PGxhYmVsIGZvcj0ibWNOZXciPuC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5',
  'iCAo4Lit4Lii4LmI4Liy4LiH4LiZ4LmJ4Lit4LiiIDgg4LiV4Lix4LinKTwvbGFiZWw+PGlucHV0IGNsYXNzPSJpbnAiIGlkPSJtY05ldyIgdHlwZT0icGFzc3dvcmQiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiBmdWxsIj48bGFiZWwgZm9yPSJtY05l',
  'dzIiPuC5g+C4quC5iOC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iOC4reC4teC4geC4hOC4o+C4seC5ieC4hzwvbGFiZWw+PGlucHV0IGNsYXNzPSJpbnAiIGlkPSJtY05ldzIiIHR5cGU9InBhc3N3b3JkIj48L2Rpdj4nICsKICAgICc8L2Rpdj4n',
  'LAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBpZD0ibWNHbyI+4Lia4Lix4LiZ4LiX4Li24LiBPC9idXR0b24+Jyk7',
  'CgogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtY0dvJykub25jbGljayA9IGZ1bmN0aW9uKCl7CiAgICB2YXIgbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtY05ldycpLnZhbHVlOwogICAgaWYgKG4ubGVuZ3RoIDwgOCkgcmV0dXJuIHRvYXN0KCfguKPg',
  'uKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYjguJXguYnguK3guIfguKLguLLguKfguK3guKLguYjguLLguIfguJnguYnguK3guKIgOCDguJXguLHguKfguK3guLHguIHguKnguKMnLCAnZXJyJyk7CiAgICBpZiAobiAhPT0gZG9jdW1lbnQuZ2V0RWxlbWVu',
  'dEJ5SWQoJ21jTmV3MicpLnZhbHVlKSByZXR1cm4gdG9hc3QoJ+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iOC4quC4reC4h+C4iuC5iOC4reC4h+C5hOC4oeC5iOC4leC4o+C4h+C4geC4seC4mScsICdlcnInKTsKICAgIHZhciBidG4gPSB0aGlz',
  'OwogICAgYnRuLmRpc2FibGVkID0gdHJ1ZTsKICAgIGNhbGxBcGkoJ2F1dGguY2hhbmdlUGFzc3dvcmQnLCB7CiAgICAgIG9sZFBhc3N3b3JkOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWNPbGQnKS52YWx1ZSwgbmV3UGFzc3dvcmQ6IG4sIF9kZXZpY2U6IEFV',
  'VEguZGV2aWNlIHx8ICcnCiAgICB9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICAgIGNsb3NlTW9kYWwoKTsKICAgICAgdG9hc3QoJ+C5gOC4m+C4peC4teC5iOC4ouC4meC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5gOC4o+C4teC4ouC4muC4o+C5ieC4reC4oicsICdv',
  'aycpOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlOwogICAgICB0b2FzdChlLm1lc3NhZ2UgfHwgZSwgJ2VycicpOwogICAgfSk7CiAgfTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguK3guK3guIHguIjguLLguIHg',
  'uKPguLDguJrguJogLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gZG9Mb2dvdXQoa2VlcFBpbil7CiAgdmFyIHMgPSBBVVRILnNlc3Npb247CiAgc2F2ZVNlc3Npb24oJycpOwogIGlmICgha2VlcFBpbikgeyB2YXIgZCA9IEFVVEguZGV2aWNlOyBzYXZlRGV2',
  'aWNlKCcnKTsgaWYgKGQpIGNhbGxBcGkoJ2F1dGguZm9yZ2V0RGV2aWNlJywgeyBkZXZpY2U6IGQgfSkuY2F0Y2goZnVuY3Rpb24oKXt9KTsgfQogIGlmIChzKSBjYWxsQXBpKCdhdXRoLmxvZ291dCcsIHsgX3Nlc3Npb246IHMgfSkuY2F0Y2goZnVuY3Rpb24oKXsg',
  'Lyog4Lir4Lih4LiU4Lit4Liy4Lii4Li44LmB4Lil4LmJ4Lin4LiB4LmH4LiW4Li34Lit4Lin4LmI4Liy4Lit4Lit4LiB4LmB4Lil4LmJ4LinICovIH0pOwogIGNsb3NlTW9kYWwoKTsKICBBVVRILm1lID0gbnVsbDsKICBpZiAoQVVUSC5kZXZpY2UpIHNob3dQaW4o',
  'KTsgZWxzZSBzaG93TG9naW4oKTsKfQoKZnVuY3Rpb24gY29uZmlybUxvZ291dCgpewogIG9wZW5Nb2RhbCgn4Lit4Lit4LiB4LiI4Liy4LiB4Lij4Liw4Lia4LiaJywKICAgICc8cD7guJXguYnguK3guIfguIHguLLguKPguK3guK3guIHguIjguLLguIHguKPguLDg',
  'uJrguJrguYPguIrguYjguYTguKvguKE8L3A+JyArCiAgICAoQVVUSC5kZXZpY2UgPyAnPHAgY2xhc3M9Im11dGVkIGZzMTMiPlBJTiDguJrguJnguYDguITguKPguLfguYjguK3guIfguJnguLXguYnguIjguLDguKLguLHguIfguK3guKLguLnguYgg4LiE4Lij4Lix',
  '4LmJ4LiH4Lir4LiZ4LmJ4Liy4LmA4LiC4LmJ4Liy4LiU4LmJ4Lin4LiiIFBJTiDguYTguJTguYnguYDguKXguKI8L3A+JyA6ICcnKSwKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lii4LiB4LmA4Lil4Li04LiBPC9idXR0',
  'b24+JyArCiAgICAoQVVUSC5kZXZpY2UgPyAnPGJ1dHRvbiBjbGFzcz0iYnRuIGRnciIgb25jbGljaz0iZG9Mb2dvdXQoZmFsc2UpIj7guK3guK3guIHguYHguKXguLDguKXguJogUElOPC9idXR0b24+JyA6ICcnKSArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHBy',
  'aSIgb25jbGljaz0iZG9Mb2dvdXQodHJ1ZSkiPuC4reC4reC4geC4iOC4suC4geC4o+C4sOC4muC4mjwvYnV0dG9uPicpOwp9Cjwvc2NyaXB0Pgo8c2NyaXB0PgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT0KICAgVmlld3MuaHRtbCDigJQg4LiV4Lix4Lin4LmC4Lir4Lil4LiUICsg4LiV4Lix4Lin4Lin4Liy4LiU4LiC4Lit4LiH4LmB4LiV4LmI4Lil4Liw4Lir4LiZ4LmJ4LiyCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PSAqLwoKdmFyIFJPVVRFUyA9IHt9OwoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDEpIOC4oOC4suC4nuC4o+C4p+C4oQogICA9PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLmRhc2hib2FyZCA9IHsKICBsb2FkOiBmdW5jdGlvbigpeyByZXR1cm4gY2FsbEFwaSgnYXBwLmRhc2hib2FyZCcsIHsgeWVhcjogUy55ZWFyIH0pOyB9LAogIHJlbmRlcjogZnVuY3Rp',
  'b24oZCl7CiAgICB2YXIgYiA9IGQuYnVpbGRpbmc7CiAgICB2YXIga3BpcyA9CiAgICAgIGtwaSgn4Lii4Lit4LiU4Lir4LiZ4Li14LmJ4LiE4LiH4LmA4Lir4Lil4Li34Lit4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJywgYmFodChkLmRlYnRBbGwucmVtYWluaW5nKSwK',
  'ICAgICAgICAgICfguIjguLLguIHguKLguK3guJTguKvguJnguLXguYkgJyArIGJhaHQoZC5kZWJ0QWxsLnRvdGFsRGVidCkgKyAnIMK3IOC4iuC4s+C4o+C4sOC5geC4peC5ieC4pyAnICsgcGN0KGQuZGVidEFsbC5wZXJjZW50KSwgJ2FjY2VudCcpICsKICAgICAg',
  'a3BpKCfguIrguLPguKPguLDguYHguKXguYnguKcgKOC4q+C4meC4teC5ieC4q+C4peC4seC4gSknLCBwY3QoZC5kZWJ0TWFpbi5wZXJjZW50KSwgYmFodChkLmRlYnRNYWluLnBhaWQpICsgJyDguIjguLLguIEgJyArIGJhaHQoZC5kZWJ0TWFpbi50b3RhbCksICdn',
  'b29kJykgKwogICAgICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC4m+C4tSAnICsgZC55ZWFyLCBiYWh0KGQuc3BlbmRUaGlzWWVhciksICfguIvguLfguYnguK3guILguK3guIcgKyDguIvguYjguK3guKHguYHguIvguKEgKyDguKXguYnguLLg',
  'uIfguYHguK3guKPguYwnKSArCiAgICAgIGtwaSgn4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiE4LmJ4Liy4LiHJywgZC5yZXBhaXJzLm9wZW5Kb2JzICsgJyDguIfguLLguJknLCBkLnJlcGFpcnMub3ZlcmR1ZSArICcg4LiH4Liy4LiZ4LmA4LiB4Li04LiZ4LiB4Liz',
  '4Lir4LiZ4LiUJywgZC5yZXBhaXJzLm92ZXJkdWUgPyAnYmFkJyA6ICcnKTsKCiAgICB2YXIgYWxlcnRzID0gZC5hbGVydHMubGVuZ3RoCiAgICAgID8gJzxkaXYgY2xhc3M9ImFsaXN0Ij4nICsgZC5hbGVydHMuc2xpY2UoMCwxMikubWFwKGZ1bmN0aW9uKGEpewog',
  'ICAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJhbGkgbC0nICsgYS5sZXZlbCArICciIG9uY2xpY2s9ImdvKFwnJyArIGp1bXBQYWdlKGEubW9kdWxlKSArICdcJykiPicgKwogICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJpYyI+JyArIGEuaWNvbiArICc8',
  'L2Rpdj48ZGl2PjxkaXYgY2xhc3M9InR0Ij4nICsgZXNjKGEudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJkZCI+JyArIGVzYyhhLmRldGFpbCkgKyAnPC9kaXY+PC9kaXY+PC9kaXY+JzsKICAgICAgICB9KS5qb2luKCcn',
  'KSArICc8L2Rpdj4nCiAgICAgIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPuKchTwvZGl2PuC5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4hOC5ieC4suC4hyDigJQg4LiX4Li44LiB4Lit4Lii4LmI4Liy4LiH4LmA4Lij4Li14Lii4Lia4Lij',
  '4LmJ4Lit4LiiPC9kaXY+JzsKCiAgICByZXR1cm4gJycgKwogICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsga3BpcyArICc8L2Rpdj4nICsKCiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGcyIG1iMTIiPicgKwogICAgICAgIGNhcmQoJ/CfkrAg4Lij',
  '4Liy4Lii4LiB4Liy4Lij4Liq4Lij4Li44Lib4Lij4Lin4LihICjguKvguJnguLXguYnguKvguKXguLHguIEpJywKICAgICAgICAgIGRlYnRNaW5pKGQuZGVidE1haW4sICdkZWJ0TWFpbicpLAogICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGlj',
  'az0iZ28oXCdkZWJ0TWFpblwnKSI+4LiU4Li54LiX4Lix4LmJ4LiH4Lir4Lih4LiUIOKGkjwvYnV0dG9uPicpICsKICAgICAgICBjYXJkKCfwn6e+IOC4q+C4meC4teC5ieC4quC4tOC4mSAo4Lir4LiZ4Li14LmJ4Lij4Lit4LiHKScsCiAgICAgICAgICBkZWJ0TWlu',
  'aShkLmRlYnRTdWIsICdkZWJ0U3ViJykgKwogICAgICAgICAgKGQuZGVidFN1Yi5pbnRlcmVzdFRoaXNZZWFyID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbXQ4Ij7guJTguK3guIHguYDguJrguLXguYnguKLguJfguLXguYjguIrguLPguKPguLDguJvguLUgJyAr',
  'IGQueWVhciArICc6IDxiPicgKyBiYWh0KGQuZGVidFN1Yi5pbnRlcmVzdFRoaXNZZWFyKSArICc8L2I+PC9kaXY+JyA6ICcnKSwKICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImdvKFwnZGVidFN1YlwnKSI+4LiU4Li54LiX4Lix4LmJ',
  '4LiH4Lir4Lih4LiUIOKGkjwvYnV0dG9uPicpICsKICAgICAgJzwvZGl2PicgKwoKICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgICAga3BpKCfguKvguYnguK3guIfguJfguLHguYnguIfguKvguKHguJQnLCBiLnRvdGFsUm9vbXMgKyAn',
  'IOC4q+C5ieC4reC4hycsICfguKHguLXguJzguLnguYnguYDguIrguYjguLIgJyArIGIub2NjdXBpZWQgKyAnIMK3IOC4p+C5iOC4suC4hyAnICsgYi52YWNhbnQpICsKICAgICAgICBrcGkoJ+C4peC5ieC4suC4h+C5geC4reC4o+C5jOC4m+C4tSAnICsgZC55ZWFy',
  'LCBkLmFjLnJvb21zRG9uZSArICcvJyArIGIudG90YWxSb29tcyArICcg4Lir4LmJ4Lit4LiHJywgZC5hYy5kb25lSW5ZZWFyICsgJyDguKPguK3guJogwrcg4LiE4LmJ4Liy4LiHICcgKyBkLmFjLnJvb21zUGVuZGluZyArICcg4Lir4LmJ4Lit4LiHJywgZC5hYy5y',
  'b29tc1BlbmRpbmcgPyAnd2FybicgOiAnZ29vZCcpICsKICAgICAgICBrcGkoJ+C4i+C4t+C5ieC4reC4guC4reC4h+C4m+C4tSAnICsgZC55ZWFyLCBiYWh0KGQucHVyY2hhc2VzLnllYXJUb3RhbCksIGQucHVyY2hhc2VzLnllYXJDb3VudCArICcg4Lij4Liy4Lii',
  '4LiB4Liy4LijJykgKwogICAgICAgIGtwaSgn4Lib4Lij4Liw4LiB4Lix4LiZ4LmD4LiB4Lil4LmJ4Lir4Lih4LiUJywgZC5wdXJjaGFzZXMud2FycmFudHkuZXhwaXJpbmcgKyAnIOC4o+C4suC4ouC4geC4suC4oycsICfguKvguKHguJTguK3guLLguKLguLjguYHg',
  'uKXguYnguKcgJyArIGQucHVyY2hhc2VzLndhcnJhbnR5LmV4cGlyZWQsIGQucHVyY2hhc2VzLndhcnJhbnR5LmV4cGlyaW5nID8gJ3dhcm4nIDogJycpICsKICAgICAgJzwvZGl2PicgKwoKICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzIgbWIxMiI+JyArCiAgICAg',
  'ICAgY2FyZCgn8J+TkiDguKPguLLguKLguKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4Lii4Lir4LitIOC4m+C4tSAnICsgZC55ZWFyLAogICAgICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzMgbWIxMiI+JyArCiAgICAgICAgICAgIGtwaSgn4Lij4Liy4Lii4Lij',
  '4Lix4LiaJywgYmFodChkLmZpbmFuY2UuaW5jb21lKSwgJ+C5gOC4ieC4peC4teC5iOC4oiAnICsgYmFodChkLmZpbmFuY2UuYXZnSW5jb21lKSArICcv4LmA4LiU4Li34Lit4LiZJywgJ2dvb2QnKSArCiAgICAgICAgICAgIGtwaSgn4Lij4Liy4Lii4LiI4LmI4Liy',
  '4LiiJywgYmFodChkLmZpbmFuY2UuZXhwZW5zZSksICfguYDguInguKXguLXguYjguKIgJyArIGJhaHQoZC5maW5hbmNlLmF2Z0V4cGVuc2UpICsgJy/guYDguJTguLfguK3guJknLCAnYmFkJykgKwogICAgICAgICAgICBrcGkoJ+C4hOC4h+C5gOC4q+C4peC4t+C4',
  'reC4quC4uOC4l+C4mOC4tCcsIGJhaHQoZC5maW5hbmNlLm5ldCksICfguK3guLHguJXguKPguLLguIHguLPguYTguKMgJyArIHBjdChkLmZpbmFuY2UubWFyZ2luKSkgKwogICAgICAgICAgJzwvZGl2PicgKyBtaW5pTW9udGhDaGFydChkLmZpbmFuY2UuYnlNb250',
  'aCksCiAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJnbyhcJ2ZpbmFuY2VcJykiPuC4lOC4ueC4l+C4seC5ieC4h+C4q+C4oeC4lCDihpI8L2J1dHRvbj4nKSArCiAgICAgICAgY2FyZCgn8J+Xk++4jyDguIfguLLguJnguJfguLXguYjg',
  'uIHguLPguKXguLHguIfguIjguLDguJbguLbguIcgKCcgKyBkLnVwY29taW5nLmxlbmd0aCArICcpJywKICAgICAgICAgIGQudXBjb21pbmcubGVuZ3RoID8gJzxkaXYgY2xhc3M9ImFsaXN0Ij4nICsgZC51cGNvbWluZy5zbGljZSgwLDcpLm1hcChmdW5jdGlvbih1',
  'KXsKICAgICAgICAgICAgdmFyIGx2bCA9IHUuZGF5c0xlZnQgPCAwID8gJ2RhbmdlcicgOiAodS5kYXlzTGVmdCA8PSA3ID8gJ3dhcm4nIDogJ2luZm8nKTsKICAgICAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJhbGkgbC0nICsgbHZsICsgJyIgb25jbGljaz0i',
  'Z28oXCcnICsganVtcFBhZ2UodS5tb2R1bGUpICsgJ1wnKSI+JyArCiAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImljIj4nICsgdS5pY29uICsgJzwvZGl2PjxkaXY+PGRpdiBjbGFzcz0idHQiPicgKyBlc2ModS50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAg',
  'ICAgICAgJzxkaXYgY2xhc3M9ImRkIj4nICsgdGhEYXRlKHUuZGF0ZSkgKyAnIMK3ICcgKwogICAgICAgICAgICAgICAgKHUuZGF5c0xlZnQgPCAwID8gJ+C5gOC4peC4ouC4geC4s+C4q+C4meC4lCAnICsgKC11LmRheXNMZWZ0KSArICcg4Lin4Lix4LiZJyA6ICh1',
  'LmRheXNMZWZ0ID09PSAwID8gJ+C4p+C4seC4meC4meC4teC5iScgOiAn4Lit4Li14LiBICcgKyB1LmRheXNMZWZ0ICsgJyDguKfguLHguJknKSkgKwogICAgICAgICAgICAgICc8L2Rpdj48L2Rpdj48L2Rpdj4nOwogICAgICAgICAgfSkuam9pbignJykgKyAnPC9k',
  'aXY+JyA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj7wn4yk77iPPC9kaXY+4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ4LiZ4Lix4LiU4Lir4Lih4Liy4Lii4LmA4Lij4LmH4LinIOC5hiDguJnguLXguYk8L2Rpdj4nLAogICAgICAgICAgJzxi',
  'dXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZ28oXCdyZXBvcnRzXCcpIj7guJvguI/guLTguJfguLTguJnguYDguJXguYfguKEg4oaSPC9idXR0b24+JywgdHJ1ZSkgKwogICAgICAnPC9kaXY+JyArCgogICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMiI+JyAr',
  'CiAgICAgICAgY2FyZCgn8J+UlCDguKrguLTguYjguIfguJfguLXguYjguJXguYnguK3guIfguJfguLMgKCcgKyBkLmFsZXJ0cy5sZW5ndGggKyAnKScsIGFsZXJ0cywgJycsIHRydWUpICsKICAgICAgICBjYXJkKCfwn4+iIOC4h+C4suC4meC4i+C5iOC4reC4oeC5',
  'geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oScsCiAgICAgICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMiI+JyArCiAgICAgICAgICAgIGtwaSgn4LiH4Liy4LiZ4Lib4Li1ICcgKyBkLnllYXIsIGQuYnVpbGRpbmdSZXBhaXJzLnllYXJDb3VudCArICcg',
  '4LiH4Liy4LiZJywgJ+C4hOC5ieC4suC4hyAnICsgZC5idWlsZGluZ1JlcGFpcnMub3BlbkNvdW50KSArCiAgICAgICAgICAgIGtwaSgn4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiJywgYmFodChkLmJ1aWxkaW5nUmVwYWlycy55ZWFyQ29zdCksICfguITg',
  'uKPguJrguIHguLPguKvguJnguJTguYDguKPguYfguKcg4LmGIOC4meC4teC5iSAnICsgZC5idWlsZGluZ1JlcGFpcnMudXBjb21pbmcpICsKICAgICAgICAgICc8L2Rpdj4nICsKICAgICAgICAgIChkLmRlYnRNYWluLmZvcmVjYXN0ICYmIGQuZGVidE1haW4uZm9y',
  'ZWNhc3QubW9udGhzTGVmdAogICAgICAgICAgICA/ICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+PGRpdiBjbGFzcz0iZnMxMyI+PGI+4Lib4Lij4Liw4Lih4Liy4LiT4LiB4Liy4Lij4Lib4Li04LiU4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiBPC9iPjxkaXYgY2xhc3M9',
  'Im11dGVkIG10OCI+JyArCiAgICAgICAgICAgICAgJ+C4iOC4suC4geC4reC4seC4leC4o+C4suC4iuC4s+C4o+C4sOC5gOC4ieC4peC4teC5iOC4oiAnICsgYmFodChkLmRlYnRNYWluLmZvcmVjYXN0LmF2Z1Blck1vbnRoKSArICcv4LmA4LiU4Li34Lit4LiZICgx',
  'MiDguYDguJTguLfguK3guJnguKXguYjguLLguKrguLjguJQpICcgKwogICAgICAgICAgICAgICfguITguLLguJTguKfguYjguLLguK3guLXguIEgPGI+JyArIGQuZGVidE1haW4uZm9yZWNhc3QubW9udGhzTGVmdCArICcg4LmA4LiU4Li34Lit4LiZPC9iPiAnICsK',
  'ICAgICAgICAgICAgICAnKOC4o+C4suC4pyAnICsgdGhEYXRlKGQuZGVidE1haW4uZm9yZWNhc3QucGF5b2ZmRGF0ZSkgKyAnKTwvZGl2PjwvZGl2PicKICAgICAgICAgICAgOiAnJyksCiAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJn',
  'byhcJ2J1aWxkaW5nXCcpIj7guJTguLnguJfguLHguYnguIfguKvguKHguJQg4oaSPC9idXR0b24+JykgKwogICAgICAnPC9kaXY+JzsKICB9LAogIGFmdGVyOiBmdW5jdGlvbigpewogICAgLy8g4LiV4Lix4Lin4LmA4Lil4LiC4Lia4LiZ4LmA4Lih4LiZ4Li54Lit',
  '4Lix4Lib4LmA4LiU4LiV4LiI4Liy4LiB4Lio4Li54LiZ4Lii4LmM4LmB4LiI4LmJ4LiH4LmA4LiV4Li34Lit4LiZIChyZWZyZXNoQWxlcnRzKSDguJfguLjguIHguKvguJnguYnguLIg4LmE4Lih4LmI4LmD4LiK4LmI4LmA4LiJ4Lie4Liy4Liw4Lir4LiZ4LmJ4Liy',
  '4LiZ4Li14LmJCiAgICByZWZyZXNoQWxlcnRzKCk7CiAgfQp9OwoKZnVuY3Rpb24gbWluaU1vbnRoQ2hhcnQoYnlNb250aCl7CiAgdmFyIG1heCA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGJ5TW9udGgubWFwKGZ1bmN0aW9uKG0peyByZXR1cm4gTWF0aC5tYXgobS5p',
  'bmNvbWUsIG0uZXhwZW5zZSk7IH0pKSB8fCAxOwogIHJldHVybiAnPGRpdiBzdHlsZT0iZGlzcGxheTpmbGV4O2dhcDozcHg7YWxpZ24taXRlbXM6ZmxleC1lbmQ7aGVpZ2h0Ojc0cHgiPicgKyBieU1vbnRoLm1hcChmdW5jdGlvbihtKXsKICAgIHZhciBoaSA9IE1h',
  'dGgucm91bmQobS5pbmNvbWUgLyBtYXggKiA2NiksIGhlID0gTWF0aC5yb3VuZChtLmV4cGVuc2UgLyBtYXggKiA2Nik7CiAgICByZXR1cm4gJzxkaXYgc3R5bGU9ImZsZXg6MTt0ZXh0LWFsaWduOmNlbnRlciIgdGl0bGU9IicgKyBtLmxhYmVsICsgJyDCtyDguKPg',
  'uLHguJogJyArIG1vbmV5KG0uaW5jb21lKSArICcgwrcg4LiI4LmI4Liy4LiiICcgKyBtb25leShtLmV4cGVuc2UpICsgJyI+JyArCiAgICAgICc8ZGl2IHN0eWxlPSJkaXNwbGF5OmZsZXg7Z2FwOjFweDthbGlnbi1pdGVtczpmbGV4LWVuZDtqdXN0aWZ5LWNvbnRl',
  'bnQ6Y2VudGVyO2hlaWdodDo2NnB4Ij4nICsKICAgICAgICAnPGRpdiBzdHlsZT0id2lkdGg6NnB4O2hlaWdodDonICsgaGkgKyAncHg7YmFja2dyb3VuZDp2YXIoLS1vayk7Ym9yZGVyLXJhZGl1czoycHggMnB4IDAgMCI+PC9kaXY+JyArCiAgICAgICAgJzxkaXYg',
  'c3R5bGU9IndpZHRoOjZweDtoZWlnaHQ6JyArIGhlICsgJ3B4O2JhY2tncm91bmQ6dmFyKC0tZGFuZ2VyKTtib3JkZXItcmFkaXVzOjJweCAycHggMCAwIj48L2Rpdj4nICsKICAgICAgJzwvZGl2PjxkaXYgY2xhc3M9ImZhaW50IiBzdHlsZT0iZm9udC1zaXplOjku',
  'NXB4Ij4nICsgbS5sYWJlbC5yZXBsYWNlKCcuJywnJykgKyAnPC9kaXY+PC9kaXY+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nICsKICAnPGRpdiBjbGFzcz0icm93IGZzMTIgbXV0ZWQgbXQ4Ij48c3BhbiBjbGFzcz0iYiBvayI+4Lij4Liy4Lii4Lij4Lix4Lia',
  'PC9zcGFuPjxzcGFuIGNsYXNzPSJiIGRnciI+4Lij4Liy4Lii4LiI4LmI4Liy4LiiPC9zcGFuPjwvZGl2Pic7Cn0KCmZ1bmN0aW9uIGRlYnRNaW5pKHgsIHBhZ2UpewogIHJldHVybiAnPGRpdiBjbGFzcz0icG1ldGEiIHN0eWxlPSJtYXJnaW46MCAwIDZweCI+PHNw',
  'YW4+4LiK4Liz4Lij4Liw4LmB4Lil4LmJ4LinIDxiPicgKyBiYWh0KHgucGFpZCkgKyAnPC9iPjwvc3Bhbj4nICsKICAgICAgICAgJzxzcGFuPjxiPicgKyBwY3QoeC5wZXJjZW50KSArICc8L2I+PC9zcGFuPjwvZGl2PicgKwogICAgICAgICBwcm9ncmVzcyh4LnBl',
  'cmNlbnQsICdsZycpICsKICAgICAgICAgJzxkaXYgY2xhc3M9InBtZXRhIj48c3Bhbj7guITguIfguYDguKvguKXguLfguK0gPGI+JyArIGJhaHQoeC5yZW1haW5pbmcpICsgJzwvYj48L3NwYW4+JyArCiAgICAgICAgICc8c3Bhbj7guKLguK3guJTguKvguJnguLXg',
  'uYnguJfguLHguYnguIfguKvguKHguJQgPGI+JyArIGJhaHQoeC50b3RhbCkgKyAnPC9iPjwvc3Bhbj48L2Rpdj4nICsKICAgICAgICAgJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbXQ4Ij7guIrguLPguKPguLDguYPguJnguJvguLXguJfguLXguYjguYDguKXguLfg',
  'uK3guIE6IDxiPicgKyBiYWh0KHgudGhpc1llYXIpICsgJzwvYj48L2Rpdj4nOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgMikg4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiBIC8g4Lir',
  '4LiZ4Li14LmJ4Lij4Lit4LiHICjguYPguIrguYnguJXguLHguKfguKfguLLguJTguKPguYjguKfguKHguIHguLHguJkpCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBkZWJ0',
  'Um91dGUobGVkZ2VyLCB0aXRsZSl7CiAgcmV0dXJuIHsKICAgIGxvYWQ6IGZ1bmN0aW9uKCl7CiAgICAgIHJldHVybiBQcm9taXNlLmFsbChbCiAgICAgICAgY2FsbEFwaSgnZGVidC5zdW1tYXJ5JywgeyBsZWRnZXI6IGxlZGdlciwgeWVhcjogUy55ZWFyIH0pLAog',
  'ICAgICAgIGNhbGxBcGkoJ2RlYnQucGF5bWVudHMnLCB7IGxlZGdlcjogbGVkZ2VyLCB5ZWFyOiBTLnllYXIgfSkKICAgICAgXSkudGhlbihmdW5jdGlvbihyKXsKICAgICAgICB2YXIgZCA9IHJbMF07IGQucGF5bWVudHMgPSByWzFdOyBkLmxlZGdlciA9IGxlZGdl',
  'cjsgZC5wYWdlVGl0bGUgPSB0aXRsZTsKICAgICAgICByZXR1cm4gZDsKICAgICAgfSk7CiAgICB9LAogICAgcmVuZGVyOiByZW5kZXJEZWJ0LAogICAgYWZ0ZXI6IGNhY2hlQWxsRGVidHMKICB9Owp9ClJPVVRFUy5kZWJ0TWFpbiA9IGRlYnRSb3V0ZSgn4Lir4LiZ',
  '4Li14LmJ4Lir4Lil4Lix4LiBJywgJ+C4o+C4suC4ouC4geC4suC4o+C4quC4o+C4uOC4m+C4o+C4p+C4oSBUaGUgTSBDb3JuZXIgQVAnKTsKUk9VVEVTLmRlYnRTdWIgID0gZGVidFJvdXRlKCfguKvguJnguLXguYnguKPguK3guIcnLCAn4Lir4LiZ4Li14LmJ4Liq',
  '4Li04LiZJyk7CgovKiog4LmA4LiB4LmH4Lia4Lij4Liy4Lii4LiK4Li34LmI4Lit4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJ4LiX4Li44LiB4Lia4Lix4LiN4LiK4Li14LmE4Lin4LmJ4LmD4Lir4LmJ4Lif4Lit4Lij4LmM4Lih4LmA4Lil4Li34Lit4LiBICLguYDg',
  'uJvguYfguJnguKrguYjguKfguJnguKvguJnguLbguYjguIfguILguK3guIciICovCmZ1bmN0aW9uIGNhY2hlQWxsRGVidHMoKXsKICBjYWxsQXBpKCdkZWJ0Lmxpc3QnLCB7fSkudGhlbihmdW5jdGlvbihsaXN0KXsKICAgIEFMTF9ERUJUUyA9IGxpc3QubWFwKGZ1',
  'bmN0aW9uKGQpewogICAgICByZXR1cm4geyBpZDogZC5pZCwgdGl0bGU6IGQudGl0bGUsIGxlZGdlcjogZC5sZWRnZXIsIHBhcmVudElkOiBkLnBhcmVudElkIHx8ICcnIH07CiAgICB9KTsKICB9KS5jYXRjaChmdW5jdGlvbigpe30pOwp9CgpmdW5jdGlvbiByZW5k',
  'ZXJEZWJ0KGQpewogIHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CgogIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImNhcmQgbWIxMiI+PGRpdiBjbGFzcz0iY2FyZC1iIj4nICsK',
  'ICAgICc8ZGl2IGNsYXNzPSJyb3cgbWIxMiI+PGgzIHN0eWxlPSJtYXJnaW46MDtmb250LXNpemU6MTVweCI+JyArIGVzYyhkLnBhZ2VUaXRsZSkgKyAnPC9oMz4nICsKICAgICc8c3BhbiBjbGFzcz0ic3AiPjwvc3Bhbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJi',
  'dG4gcHJpIHNtIiBvbmNsaWNrPSJmb3JtRGVidFBheW1lbnQobnVsbCxcJycgKyBkLmxlZGdlciArICdcJykiPisg4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4LiK4Liz4Lij4LiwPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNs',
  'aWNrPSJmb3JtRGVidChudWxsLFwnJyArIGQubGVkZ2VyICsgJ1wnKSI+KyDguYDguJ7guLTguYjguKHguIHguYnguK3guJnguKvguJnguLXguYk8L2J1dHRvbj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJwbWV0YSIgc3R5bGU9Im1hcmdpbjowIDAgN3B4Ij48',
  'c3Bhbj7guITguKfguLLguKHguITguLfguJrguKvguJnguYnguLLguIHguLLguKPguIrguLPguKPguLA8L3NwYW4+PHNwYW4+PGI+JyArIHBjdChkLnBlcmNlbnQpICsgJzwvYj48L3NwYW4+PC9kaXY+JyArCiAgICBwcm9ncmVzcyhkLnBlcmNlbnQsICdsZyAnICsg',
  'KGQucGVyY2VudCA+PSAxMDAgPyAnb2snIDogJycpKSArCiAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtdDE2Ij4nICsKICAgICAga3BpKCfguKLguK3guJTguKvguJnguLXguYnguJfguLHguYnguIfguKvguKHguJQnLCBiYWh0KGQudG90YWxEZWJ0KSwgZC5kZWJ0',
  'cy5sZW5ndGggKyAnIOC4geC5ieC4reC4meC4q+C4meC4teC5iScpICsKICAgICAga3BpKCfguIrguLPguKPguLDguYHguKXguYnguKcnLCBiYWh0KGQucGFpZCksIGQucGF5bWVudENvdW50ICsgJyDguKPguLLguKLguIHguLLguKPguYLguK3guJknICsKICAgICAg',
  'ICAgIChkLmFkanVzdG1lbnRDb3VudCA/ICcgwrcg4Lib4Lij4Lix4Lia4Lii4Lit4LiUICcgKyBiYWh0KGQuYWRqdXN0ZWQpIDogJycpLCAnZ29vZCcpICsKICAgICAga3BpKCfguITguIfguYDguKvguKXguLfguK0nLCBiYWh0KGQucmVtYWluaW5nKSwgJ+C4reC4',
  'teC4gSAnICsgcGN0KDEwMCAtIGQucGVyY2VudCkgKyAnIOC4iOC4sOC4m+C4tOC4lOC4q+C4meC4teC5iScsICdiYWQnKSArCiAgICAgIGtwaSgn4LiK4Liz4Lij4Liw4LmD4LiZJyArIHllYXJMYWJlbCwgYmFodChkLnNlbGVjdGVkWWVhclBhaWQpLCBkLnNlbGVj',
  'dGVkWWVhckNvdW50ICsgJyDguKPguLLguKLguIHguLLguKMnICsKICAgICAgICAgIChkLnNlbGVjdGVkWWVhckludGVyZXN0ID8gJyDCtyDguJTguK3guIHguYDguJrguLXguYnguKIgJyArIGJhaHQoZC5zZWxlY3RlZFllYXJJbnRlcmVzdCkgOiAnJykpICsKICAg',
  'ICc8L2Rpdj48L2Rpdj48L2Rpdj4nOwoKICB2YXIgcGVyRGVidCA9IGQuZGVidHMubGVuZ3RoID8gJzxkaXYgY2xhc3M9ImdyaWQgZy1hdXRvIG1iMTIiPicgKyBkLmRlYnRzLm1hcChmdW5jdGlvbih4KXsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0iY2FyZCI+PGRp',
  'diBjbGFzcz0iY2FyZC1iIj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImNsaXAiIHN0eWxlPSJmb250LXdlaWdodDo2NTA7Zm9udC1zaXplOjEzLjVweDttaW4taGVpZ2h0OjM4cHgiPicgKyBlc2MoeC50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNz',
  'PSJyb3cgZnMxMiBtdXRlZCBtYjgiPicgKyAoeC5zZXR0bGVkID8gJzxzcGFuIGNsYXNzPSJiIG9rIj7inJMg4LiK4Liz4Lij4Liw4LiE4Lij4Lia4LmB4Lil4LmJ4LinPC9zcGFuPicgOiBzdGF0dXNCYWRnZSh4LnN0YXR1cykpICsKICAgICAgICAnPHNwYW4+JyAr',
  'IGVzYyh4LmNyZWRpdG9yIHx8ICfigJMnKSArICh4LnN0YXJ0RGF0ZSA/ICcgwrcgJyArIHRoRGF0ZSh4LnN0YXJ0RGF0ZSkgOiAnJykgKyAnPC9zcGFuPjwvZGl2PicgKwogICAgICAoeC5zaGFyZWRGcm9tCiAgICAgICAgPyAnPGRpdiBjbGFzcz0iYiBvayB3cmFw',
  'IG1iOCIgdGl0bGU9IuC4geC5ieC4reC4meC5gOC4lOC4teC4ouC4p+C4geC4seC4muC5g+C4meC4reC4teC4geC4q+C4meC5ieC4siDguJrguLHguJnguJfguLbguIHguIHguLLguKPguIrguLPguKPguLDguIjguLLguIHguKvguJnguYnguLLguYTguKvguJnguIHg',
  'uYfguYDguILguYnguLLguIHguYnguK3guJnguJnguLXguYkiPvCflJcg4LiB4LmJ4Lit4LiZ4LmA4LiU4Li14Lii4Lin4LiB4Lix4Lia4LmD4LiZ4Lir4LiZ4LmJ4LiyJyArCiAgICAgICAgICAoeC5zaGFyZWRGcm9tID09PSAn4Lir4LiZ4Li14LmJ4Lir4Lil4Lix',
  '4LiBJyA/ICfguKPguLLguKLguIHguLLguKPguKrguKPguLjguJvguKPguKfguKEnIDogJ+C4q+C4meC4teC5ieC4quC4tOC4mScpICsgJzwvZGl2PicKICAgICAgICA6IHguYWxzb0luCiAgICAgICAgPyAnPGRpdiBjbGFzcz0iYiBvayB3cmFwIG1iOCIgdGl0bGU9',
  'IuC4geC5ieC4reC4meC4meC4teC5ieC5geC4quC4lOC4h+C5g+C4meC4reC4teC4geC4q+C4meC5ieC4suC4lOC5ieC4p+C4oiDguJXguLHguKfguYDguKXguILguYDguIrguLfguYjguK3guKHguIHguLHguJkiPvCflJcg4LmB4Liq4LiU4LiH4LmD4LiZ4Lir4LiZ',
  '4LmJ4LiyJyArCiAgICAgICAgICAoeC5hbHNvSW4gPT09ICfguKvguJnguLXguYnguKvguKXguLHguIEnID8gJ+C4o+C4suC4ouC4geC4suC4o+C4quC4o+C4uOC4m+C4o+C4p+C4oScgOiAn4Lir4LiZ4Li14LmJ4Liq4Li04LiZJykgKyAn4LiU4LmJ4Lin4LiiPC9k',
  'aXY+JwogICAgICAgIDogJycpICsKICAgICAgKHgucGFyZW50VGl0bGUKICAgICAgICA/ICc8ZGl2IGNsYXNzPSJiIGluZm8gd3JhcCBtYjgiIHRpdGxlPSLguKLguK3guJTguIHguYnguK3guJnguJnguLXguYnguK3guKLguLnguYjguYPguJnguIHguYnguK3guJng',
  'uYHguKHguYjguYHguKXguYnguKcg4LiI4LmI4Liy4Lii4LiE4Li34LiZ4LiB4LmJ4Lit4LiZ4LiZ4Li14LmJ4LiB4LmJ4Lit4LiZ4LmB4Lih4LmI4LiI4Liw4Lil4LiU4LiV4Liy4LihIj4nICsKICAgICAgICAgICfihrMg4LmA4Lib4LmH4LiZ4Liq4LmI4Lin4LiZ',
  '4Lir4LiZ4Li24LmI4LiH4LiC4Lit4LiHICcgKyBlc2MoeC5wYXJlbnRUaXRsZSkgKyAnPC9kaXY+JwogICAgICAgIDogJycpICsKICAgICAgcHJvZ3Jlc3MoeC5wZXJjZW50KSArCiAgICAgICc8ZGl2IGNsYXNzPSJwbWV0YSI+PHNwYW4+4LiK4Liz4Lij4LiwIDxi',
  'PicgKyBiYWh0KHgucGFpZCkgKyAnPC9iPjwvc3Bhbj48c3Bhbj7guITguIfguYDguKvguKXguLfguK0gPGI+JyArIGJhaHQoeC5yZW1haW5pbmcpICsgJzwvYj48L3NwYW4+PC9kaXY+JyArCiAgICAgICh4LmNoaWxkcmVuICYmIHguY2hpbGRyZW4ubGVuZ3RoCiAg',
  'ICAgICAgPyAnPGRpdiBjbGFzcz0iaHIiIHN0eWxlPSJtYXJnaW46MTJweCAwIDEwcHgiPjwvZGl2PicgKwogICAgICAgICAgJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbWI4Ij7guYPguJnguKLguK3guJTguJnguLXguYnguKHguLXguIHguYnguK3guJnguKLguYjg',
  'uK3guKLguK3guKLguLnguYggJyArIHguY2hpbGRyZW4ubGVuZ3RoICsgJyDguIHguYnguK3guJk8L2Rpdj4nICsKICAgICAgICAgIHguY2hpbGRyZW4ubWFwKGZ1bmN0aW9uKGMpewogICAgICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9Im1iOCI+JyArCiAgICAg',
  'ICAgICAgICAgJzxkaXYgY2xhc3M9InJvdyBmczEyIj48c3Bhbj7ihrMgJyArIGVzYyhjLnRpdGxlKSArICc8L3NwYW4+JyArCiAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPSJzcCBtb25vIj4nICsgbW9uZXkoYy5wYWlkKSArICcgLyAnICsgbW9uZXkoYy5wcmlu',
  'Y2lwYWwpICsgJzwvc3Bhbj48L2Rpdj4nICsKICAgICAgICAgICAgICBwcm9ncmVzcyhjLnBlcmNlbnQsICdvaycpICsgJzwvZGl2Pic7CiAgICAgICAgICB9KS5qb2luKCcnKSArCiAgICAgICAgICAoeC5wYWlkRnJvbUNoaWxkcmVuID8gJzxkaXYgY2xhc3M9ImZz',
  'MTIgbXV0ZWQiPuC4o+C4p+C4oeC4ouC4reC4lOC4l+C4teC5iOC4oeC4suC4iOC4suC4geC4geC5ieC4reC4meC4ouC5iOC4reC4oiAnICsgYmFodCh4LnBhaWRGcm9tQ2hpbGRyZW4pICsgJzwvZGl2PicgOiAnJykKICAgICAgICA6ICcnKSArCiAgICAgICh4Lmlu',
  'dGVyZXN0UGVyTW9udGggPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtdDgiPuC4lOC4reC4geC5gOC4muC4teC5ieC4oiAnICsgYmFodCh4LmludGVyZXN0UGVyTW9udGgpICsgJy/guYDguJTguLfguK3guJk8L2Rpdj4nIDogJycpICsKICAgICAgKHgucGxhblBl',
  'ck1vbnRoID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQiPuC5geC4nOC4meC4nOC5iOC4reC4mSAnICsgYmFodCh4LnBsYW5QZXJNb250aCkgKyAnL+C5gOC4lOC4t+C4reC4mTwvZGl2PicgOiAnJykgKwogICAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPjxidXR0',
  'b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz1cJ2Zvcm1EZWJ0KCcgKyBhdHRyKHgpICsgJywiJyArIGQubGVkZ2VyICsgJyIpXCc+4LmB4LiB4LmJ4LmE4LiCPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIHRpdGxlPSLguKLguK3guJTg',
  'uYTguKHguYjguJXguKPguIfguIHguLHguJrguJfguLXguYjguYDguIjguYnguLLguKvguJnguLXguYnguYHguIjguYnguIc/IOC4geC4o+C4reC4geC4ouC4reC4lOC4hOC4h+C5gOC4q+C4peC4t+C4reC4iOC4o+C4tOC4hyIgb25jbGljaz1cJ2Zvcm1SZWNvbmNp',
  'bGVEZWJ0KCcgKyBhdHRyKHgpICsgJylcJz7impbvuI8g4Lib4Lij4Lix4Lia4Lii4Lit4LiU4LmD4Lir4LmJ4LiV4Lij4LiHPC9idXR0b24+JyArCiAgICAgIC8vIOC4geC5ieC4reC4meC4l+C4teC5iOC4ouC4t+C4oeC4oeC4suC5geC4quC4lOC4hyDguKXguJrg',
  'uIjguLLguIHguKvguJnguYnguLLguJnguLXguYnguYTguKHguYjguYTguJTguYkgKOC4iOC4sOC4q+C4suC4ouC4iOC4suC4geC4reC4teC4geC4q+C4meC5ieC4suC4lOC5ieC4p+C4oikg4oCUIOC5hOC4m+C4peC4muC4l+C4teC5iOC4q+C4meC5ieC4suC5gOC4',
  'iOC5ieC4suC4guC4reC4hyDguKvguKPguLfguK3guJvguLTguJTguIHguLLguKPguYHguKrguJTguIfguKPguYjguKfguKHguYPguJnguJ/guK3guKPguYzguKHguYHguIHguYnguYTguIIKICAgICAgKHguc2hhcmVkRnJvbSA/ICcnIDogJzxidXR0b24gY2xhc3M9',
  'ImJ0biBzbSBkZ3IiIG9uY2xpY2s9ImRlbERlYnQoJyArIGpzcSh4LmlkKSArICcpIj7guKXguJo8L2J1dHRvbj4nKSArICc8L2Rpdj4nICsKICAgICc8L2Rpdj48L2Rpdj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2PicgOiAnJzsKCiAgdmFyIGJ5WWVhciA9IGQu',
  'YnlZZWFyLmxlbmd0aCA/IGNhcmQoJ/Cfk4Ug4Lii4Lit4LiU4LiK4Liz4Lij4Liw4LmB4Lii4LiB4LiV4Liy4Lih4Lib4Li1JywKICAgICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0Ij48dGhlYWQ+PHRyPicgKwogICAgJzx0aD7guJvguLU8L3RoPjx0',
  'aCBjbGFzcz0ibnVtIj7guYDguIfguLTguJnguJXguYnguJk8L3RoPjx0aCBjbGFzcz0ibnVtIj7guJTguK3guIHguYDguJrguLXguYnguKI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKPguKfguKHguJfguLXguYjguYLguK3guJk8L3RoPicgKwogICAgJzx0aCBjbGFz',
  'cz0ibnVtIj7guIjguLPguJnguKfguJnguITguKPguLHguYnguIc8L3RoPjx0aCBjbGFzcz0ibnVtIj7guYDguIfguLTguJnguJXguYnguJnguKrguLDguKrguKE8L3RoPjx0aCBzdHlsZT0id2lkdGg6MjYlIj7guITguKfguLLguKHguITguLfguJrguKvguJnguYng',
  'uLLguKrguLDguKrguKE8L3RoPicgKwogICAgJzwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICBkLmJ5WWVhci5tYXAoZnVuY3Rpb24oeSl7CiAgICAgIHZhciBjdW0gPSB5LmN1bXVsYXRpdmUgIT0gbnVsbCA/IHkuY3VtdWxhdGl2ZSA6IDA7CiAgICAgIHZhciBw',
  'ID0gZC50b3RhbERlYnQgPyAoY3VtIC8gZC50b3RhbERlYnQgKiAxMDApIDogMDsKICAgICAgcmV0dXJuICc8dHIgb25jbGljaz0ic2V0WWVhckZyb21UYWJsZSgnICsgeS55ZWFyICsgJykiIHN0eWxlPSJjdXJzb3I6cG9pbnRlciI+JyArCiAgICAgICAgJzx0ZD48',
  'Yj4nICsgZGlzcGxheVllYXIoeS55ZWFyKSArICc8L2I+JyArCiAgICAgICAgICAodXNlQnVkZGhpc3RZZWFyKCkgPyAnIDxzcGFuIGNsYXNzPSJmYWludCBmczEyIj4vICcgKyB5LnllYXIgKyAnPC9zcGFuPicgOiAnJykgKyAnPC90ZD4nICsKICAgICAgICAnPHRk',
  'IGNsYXNzPSJudW0iPicgKyBtb25leSh5LnByaW5jaXBhbCkgKyAnPC90ZD4nICsKICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAoeS5pbnRlcmVzdCA/IG1vbmV5KHkuaW50ZXJlc3QpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0i',
  'bnVtIj48Yj4nICsgbW9uZXkoeS5wcmluY2lwYWwgKyB5LmludGVyZXN0KSArICc8L2I+PC90ZD4nICsKICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyB5LmNvdW50ICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbW9uZXkoY3VtKSAr',
  'ICc8L3RkPicgKwogICAgICAgICc8dGQ+JyArIHByb2dyZXNzKHApICsgJzwvdGQ+PC90cj4nOwogICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicsICcnLCB0cnVlKSA6ICcnOwoKICB2YXIgcm93cyA9IGQucGF5bWVudHM7CiAgdmFyIGxp',
  'c3QgPSBjYXJkKCfwn6e+IOC4o+C4suC4ouC4geC4suC4o+C5guC4reC4meC5g+C4iuC5ieC4q+C4meC4teC5iSDCtyAnICsgeWVhckxhYmVsICsgJyAoJyArIHJvd3MubGVuZ3RoICsgJyknLAogICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJs',
  'ZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsKICAgICAgJzx0aD7guKfguLHguJnguJfguLXguYg8L3RoPjx0aD7guIfguKfguJQ8L3RoPjx0aCBjbGFzcz0ibnVtIj7guYDguIfguLTguJnguJXguYnguJk8L3RoPjx0aCBjbGFzcz0ibnVtIj7guJTguK3guIHguYDg',
  'uJrguLXguYnguKI8L3RoPicgKwogICAgICAnPHRoIGNsYXNzPSJudW0iPuC4o+C4p+C4oeC4l+C4teC5iOC5guC4reC4mTwvdGg+PHRoPuC4iuC5iOC4reC4h+C4l+C4suC4hzwvdGg+JyArCiAgICAgICc8dGg+4Liq4Lil4Li04LibPC90aD48dGg+4Lir4Lih4Liy',
  '4Lii4LmA4Lir4LiV4Li4PC90aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICByb3dzLm1hcChmdW5jdGlvbihwKXsKICAgICAgICB2YXIgYWRqID0gcC5jaGFubmVsID09PSAn4Lib4Lij4Lix4Lia4Lii4Lit4LiUJzsKICAgICAgICByZXR1',
  'cm4gJzx0cicgKyAoYWRqID8gJyBjbGFzcz0iYWRqIiB0aXRsZT0i4Lij4Liy4Lii4LiB4Liy4Lij4Lib4Lij4Lix4Lia4Lii4Lit4LiU4LmD4Lir4LmJ4LiV4Lij4LiH4Lii4Lit4LiU4LiI4Lij4Li04LiHIOC5hOC4oeC5iOC5g+C4iuC5iOC5gOC4h+C4tOC4meC4',
  'l+C4teC5iOC5guC4reC4mSInIDogJycpICsgJz4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCI+JyArIHRoRGF0ZShwLnBheURhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAiPicgKyBlc2MocC5pbnN0YWxsbWVudCB8',
  'fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChwLnByaW5jaXBhbCA/ICc8YiBzdHlsZT0iY29sb3I6dmFyKC0tb2spIj4nICsgbW9uZXkocC5wcmluY2lwYWwpICsgJzwvYj4nIDogJzxzcGFuIGNsYXNzPSJmYWludCI+',
  '4oCTPC9zcGFuPicpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAocC5pbnRlcmVzdCA/ICc8YiBzdHlsZT0iY29sb3I6dmFyKC0td2FybikiPicgKyBtb25leShwLmludGVyZXN0KSArICc8L2I+JyA6ICc8c3BhbiBjbGFzcz0iZmFp',
  'bnQiPuKAkzwvc3Bhbj4nKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj48Yj4nICsgbW9uZXkocC5hbW91bnQpICsgJzwvYj48L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIChhZGogPyAnPHNwYW4gY2xhc3M9ImIg',
  'aW5mbyI+4pqW77iPIOC4m+C4o+C4seC4muC4ouC4reC4lDwvc3Bhbj4nIDogZXNjKHAuY2hhbm5lbCB8fCAn4oCTJykpICsKICAgICAgICAgICAgKHAuc2hhcmVkRnJvbSA/ICc8ZGl2IGNsYXNzPSJtdDgiPjxzcGFuIGNsYXNzPSJiIG9rIiB0aXRsZT0i4Lij4Liy',
  '4Lii4LiB4Liy4Lij4LmA4LiU4Li14Lii4Lin4LiB4Lix4Lia4LmD4LiZ4Lit4Li14LiB4Lir4LiZ4LmJ4LiyIj7wn5SXICcgKwogICAgICAgICAgICAgIChwLnNoYXJlZEZyb20gPT09ICfguKvguJnguLXguYnguKvguKXguLHguIEnID8gJ+C4o+C4suC4ouC4geC4',
  'suC4o+C4quC4o+C4uOC4m+C4o+C4p+C4oScgOiAn4Lir4LiZ4Li14LmJ4Liq4Li04LiZJykgKyAnPC9zcGFuPjwvZGl2PicgOiAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwocC5zbGlwUmVmcykgKyAnPC90ZD4nICsKICAgICAg',
  'ICAgICc8dGQgY2xhc3M9ImZzMTIgbXV0ZWQgY2xpcCI+JyArIGVzYyhwLm5vdGUgfHwgJycpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkPjxkaXYgY2xhc3M9InQtYWN0aW9ucyI+JyArCiAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIg',
  'b25jbGljaz1cJ2Zvcm1EZWJ0UGF5bWVudCgnICsgYXR0cihwKSArICcsIicgKyBkLmxlZGdlciArICciKVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24gZGdyIiBvbmNsaWNrPSJkZWxEZWJ0UGF5bWVu',
  'dCgnICsganNxKHAuaWQpICsgJykiPvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICc8L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgIDogZW1wdHlCb3goJ+C4ouC4seC4h+C5hOC4oeC5iOC4',
  'oeC4teC4o+C4suC4ouC4geC4suC4o+C4iuC4s+C4o+C4sOC5g+C4mScgKyB5ZWFyTGFiZWwsCiAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZvcm1EZWJ0UGF5bWVudChudWxsLFwnJyArIGQubGVkZ2VyICsgJ1wnKSI+KyDguJrguLHg',
  'uJnguJfguLbguIHguIHguLLguKPguIrguLPguKPguLA8L2J1dHRvbj4nKSwKICAgICcnLCB0cnVlKTsKCiAgcmV0dXJuIGhlYWQgKyBwZXJEZWJ0ICsgYnlZZWFyICsgJzxkaXYgY2xhc3M9Im10MTIiPicgKyBsaXN0ICsgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIHNl',
  'dFllYXJGcm9tVGFibGUoeSl7CiAgUy55ZWFyID0gU3RyaW5nKHkpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd5ZWFyU2VsJykudmFsdWUgPSBTLnllYXI7CiAgbG9hZCgpOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT0KICAgMykg4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMucHVyY2hhc2Vz',
  'ID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7CiAgICByZXR1cm4gUHJvbWlzZS5hbGwoWwogICAgICBjYWxsQXBpKCdwdXJjaGFzZS5zdW1tYXJ5JywgeyB5ZWFyOiBTLnllYXIgfSksCiAgICAgIGNhbGxBcGkoJ3B1cmNoYXNlLmxpc3QnLCB7IHllYXI6IFMueWVhciwg',
  'Y2F0ZWdvcnk6IFMucGFyYW1zLmNhdGVnb3J5IHx8ICcnLCBxOiBTLnBhcmFtcy5xIHx8ICcnIH0pCiAgICBdKS50aGVuKGZ1bmN0aW9uKHIpeyB2YXIgZCA9IHJbMF07IGQuaXRlbXMgPSByWzFdOyByZXR1cm4gZDsgfSk7CiAgfSwKICByZW5kZXI6IGZ1bmN0aW9u',
  'KGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKICAgIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgIGtwaSgn4Lii4Lit4LiU',
  '4LiL4Li34LmJ4LitICcgKyB5ZWFyTGFiZWwsIGJhaHQoZC55ZWFyVG90YWwpLCBkLnllYXJDb3VudCArICcg4Lij4Liy4Lii4LiB4Liy4LijJywgJ2FjY2VudCcpICsKICAgICAga3BpKCfguKLguK3guJTguKrguLDguKrguKHguJfguLHguYnguIfguKvguKHguJQn',
  'LCBiYWh0KGQuZ3JhbmRUb3RhbCksIGQuZ3JhbmRDb3VudCArICcg4Lij4Liy4Lii4LiB4Liy4LijJykgKwogICAgICBrcGkoJ+C4reC4ouC4ueC5iOC5g+C4meC4m+C4o+C4sOC4geC4seC4mScsIGQud2FycmFudHkuYWN0aXZlICsgJyDguKPguLLguKLguIHguLLg',
  'uKMnLCAn4LmD4LiB4Lil4LmJ4Lir4Lih4LiUICcgKyBkLndhcnJhbnR5LmV4cGlyaW5nLCBkLndhcnJhbnR5LmV4cGlyaW5nID8gJ3dhcm4nIDogJ2dvb2QnKSArCiAgICAgIGtwaSgn4Lir4Lih4Lin4LiU4LiX4Li14LmI4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Liq',
  '4Li54LiH4Liq4Li44LiUJywgZC5ieUNhdGVnb3J5WzBdID8gZC5ieUNhdGVnb3J5WzBdLmNhdGVnb3J5IDogJ+KAkycsCiAgICAgICAgICBkLmJ5Q2F0ZWdvcnlbMF0gPyBiYWh0KGQuYnlDYXRlZ29yeVswXS50b3RhbCkgOiAnJykgKwogICAgJzwvZGl2Pic7Cgog',
  'ICAgdmFyIGNoYXJ0cyA9ICc8ZGl2IGNsYXNzPSJncmlkIGcyIG1iMTIiPicgKwogICAgICBjYXJkKCfwn5OKIOC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC5geC4ouC4geC4leC4suC4oeC4q+C4oeC4p+C4lOC4q+C4oeC4ueC5iCDCtyAnICsgeWVhckxh',
  'YmVsLAogICAgICAgIGJhckNoYXJ0KGQuYnlDYXRlZ29yeSwgJ2NhdGVnb3J5JywgJ3RvdGFsJywgZnVuY3Rpb24oaSl7IHJldHVybiBtb25leShpLnRvdGFsKSArICcg4Li/JzsgfSkpICsKICAgICAgY2FyZCgn8J+ThSDguKLguK3guJTguIvguLfguYnguK3guYHg',
  'uKLguIHguJXguLLguKHguJvguLUnLAogICAgICAgIGJhckNoYXJ0KGQuYnlZZWFyLm1hcChmdW5jdGlvbih5KXsgcmV0dXJuIHsgbGFiZWw6ICfguJvguLUgJyArIHkueWVhciArICcgKCcgKyB5LmNvdW50ICsgJyknLCB0b3RhbDogeS50b3RhbCwgeWVhcjogeS55',
  'ZWFyIH07IH0pLAogICAgICAgICAgICAgICAgICdsYWJlbCcsICd0b3RhbCcsIGZ1bmN0aW9uKGkpeyByZXR1cm4gbW9uZXkoaS50b3RhbCkgKyAnIOC4vyc7IH0pKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgY2F0cyA9ICc8ZGl2IGNsYXNzPSJjaGlwcyBtYjEy',
  'Ij4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImNoaXAgJyArICghUy5wYXJhbXMuY2F0ZWdvcnk/J29uJzonJykgKyAnIiBvbmNsaWNrPSJzZXRQYXJhbShcJ2NhdGVnb3J5XCcsXCdcJykiPuC4l+C4uOC4geC4q+C4oeC4p+C4lDwvYnV0dG9uPicgKwogICAgICBk',
  'LmJ5Q2F0ZWdvcnkubWFwKGZ1bmN0aW9uKGMpewogICAgICAgIHJldHVybiAnPGJ1dHRvbiBjbGFzcz0iY2hpcCAnICsgKFMucGFyYW1zLmNhdGVnb3J5PT09Yy5jYXRlZ29yeT8nb24nOicnKSArICciICcgKwogICAgICAgICAgICAgICAnb25jbGljaz0ic2V0UGFy',
  'YW0oXCdjYXRlZ29yeVwnLCcgKyBqc3EoYy5jYXRlZ29yeSkgKyAnKSI+JyArIGVzYyhjLmNhdGVnb3J5KSArICcgKCcgKyBjLmNvdW50ICsgJyk8L2J1dHRvbj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwoKICAgIHZhciByb3dzID0gZC5pdGVtczsK',
  'ICAgIHZhciB0YWJsZSA9IGNhcmQoJ/Cfm5Ig4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHIMK3ICcgKyB5ZWFyTGFiZWwgKyAnICgnICsgcm93cy5sZW5ndGggKyAnKScsCiAgICAgIHJvd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48',
  'dGFibGUgY2xhc3M9InQiIHN0eWxlPSJtaW4td2lkdGg6OTgwcHgiPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aCBzdHlsZT0id2lkdGg6OTZweCI+4Lin4Lix4LiZ4LiX4Li14LmI4LiL4Li34LmJ4LitPC90aD48dGg+4Lij4Liy4Lii4LiB4Liy4Lij4Liq4Li0',
  '4LiZ4LiE4LmJ4LiyPC90aD48dGggY2xhc3M9Im51bSI+4LiI4Liz4LiZ4Lin4LiZPC90aD4nICsKICAgICAgICAnPHRoIGNsYXNzPSJudW0iPuC4o+C4suC4hOC4sjwvdGg+PHRoPuC5geC4q+C4peC5iOC4h+C4l+C4teC5iOC4i+C4t+C5ieC4rTwvdGg+PHRoPuC4',
  'm+C4o+C4sOC4geC4seC4mTwvdGg+PHRoPuC4oOC4suC4njwvdGg+PHRoPuC4quC4peC4tOC4mzwvdGg+PHRoPjwvdGg+JyArCiAgICAgICAgJzwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgcm93cy5tYXAoZnVuY3Rpb24ocCl7CiAgICAgICAgICB2YXIg',
  'dyA9IHAud2FycmFudHkgfHwge307CiAgICAgICAgICByZXR1cm4gJzx0cj4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyB0aERhdGUocC5idXlEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPjxkaXYgY2xhc3M9ImNs',
  'aXAiIHRpdGxlPSInICsgZXNjKHAuaXRlbSkgKyAnIj48Yj4nICsgZXNjKHAuaXRlbSkgKyAnPC9iPjwvZGl2PicgKwogICAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJmczEyIGZhaW50Ij4nICsgZXNjKHAuY2F0ZWdvcnkgfHwgJycpICsgKHAucm9vbSA/ICcgwrcg',
  '4Lir4LmJ4Lit4LiHICcgKyBlc2MocC5yb29tKSA6ICcnKSArCiAgICAgICAgICAgICAgICAocC5vcmRlck5vID8gJyDCtyDguK3guK3guKPguYzguYDguJTguK3guKPguYwgJyArIGVzYyhwLm9yZGVyTm8pIDogJycpICsgJzwvZGl2PicgKwogICAgICAgICAgICAg',
  'IGJpbGxIdG1sKHApICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIG51bShwLnF0eSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj48Yj4nICsgbW9uZXkocC5wcmljZSkgKyAnPC9iPjwvdGQ+JyArCiAg',
  'ICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MocC52ZW5kb3IgfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyAody5oYXMKICAgICAgICAgICAgICAgID8gc3RhdHVzQmFkZ2Uody5zdGF0ZSkgKyAn',
  'PGRpdiBjbGFzcz0iZmFpbnQiIHN0eWxlPSJmb250LXNpemU6MTFweCI+JyArIHRoRGF0ZVNob3J0KHcuZW5kKSArICc8L2Rpdj4nCiAgICAgICAgICAgICAgICA6ICc8c3BhbiBjbGFzcz0iZmFpbnQiPuKAkzwvc3Bhbj4nKSArICc8L3RkPicgKwogICAgICAgICAg',
  'ICAnPHRkPicgKyB0aHVtYnNIdG1sKHAucGhvdG9SZWZzKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHAuc2xpcFJlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsKICAg',
  'ICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24iIG9uY2xpY2s9XCdmb3JtUHVyY2hhc2UoJyArIGF0dHIocCkgKyAnKVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiBkZ3IiIG9u',
  'Y2xpY2s9ImRlbFB1cmNoYXNlKCcgKyBqc3EocC5pZCkgKyAnKSI+8J+XkTwvYnV0dG9uPicgKwogICAgICAgICAgICAnPC9kaXY+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgOiBlbXB0eUJv',
  'eCgn4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LmD4LiZJyArIHllYXJMYWJlbCwgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZvcm1QdXJjaGFzZShudWxsKSI+KyDguYDguJ7guLTguYjguKHg',
  'uKPguLLguKLguIHguLLguKPguIvguLfguYnguK08L2J1dHRvbj4nKSwKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgc20iIG9uY2xpY2s9ImZvcm1QdXJjaGFzZShudWxsKSI+KyDguYDguJ7guLTguYjguKHguKPguLLguKLguIHguLLguKPguIvguLfguYng',
  'uK08L2J1dHRvbj4nLCB0cnVlKTsKCiAgICByZXR1cm4gaGVhZCArIGNoYXJ0cyArIGNhdHMgKyB0YWJsZTsKICB9Cn07CgovKioKICog4Lia4Li04Lil4LiX4Li14LmI4Lih4Li14LiC4Lit4LiH4Lir4Lil4Liy4Lii4Lit4Lii4LmI4Liy4LiHIOKAlCDguYHguKrg',
  'uJTguIfguYDguJvguYfguJnguJvguLjguYjguKHguIHguLLguIfguJTguLkg4LmE4Lih4LmI4LmD4Lir4LmJ4LiV4Liy4Lij4Liy4LiH4Lii4Liy4Lin4LmA4LiB4Li04LiZ4LmE4LibCiAqIOC4muC4tOC4peC4l+C4teC5iOC4oeC4teC4o+C4suC4ouC4geC4suC4',
  'o+C5gOC4lOC4teC4ouC4p+C4q+C4o+C4t+C4reC5hOC4oeC5iOC4oeC4teC4o+C4suC4ouC4geC4suC4o+C4ouC5iOC4reC4ouC5gOC4peC4oiDguYTguKHguYjguJXguYnguK3guIfguYHguKrguJTguIfguK3guLDguYTguKPguYDguJ7guLTguYjguKEKICovCmZ1',
  'bmN0aW9uIGJpbGxIdG1sKHApewogIHZhciBiID0gcC5iaWxsOwogIGlmICghYiB8fCBiLmNvdW50IDwgMikgcmV0dXJuICcnOwogIHZhciBpZCA9ICdiaWxsXycgKyBwLmlkOwogIHJldHVybiAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJiaWxsLXRvZ2ds',
  'ZSIgb25jbGljaz0idG9nZ2xlQmlsbChcJycgKyBpZCArICdcJykiPicgKwogICAgICAn8J+nviAnICsgYi5jb3VudCArICcg4Lij4Liy4Lii4LiB4Liy4Lij4LmD4LiZ4Lia4Li04LilIOKWvjwvYnV0dG9uPicgKwogICAgJzxkaXYgY2xhc3M9ImJpbGwtbGluZXMi',
  'IGlkPSInICsgaWQgKyAnIiBoaWRkZW4+JyArCiAgICAgIGIubGluZXMubWFwKGZ1bmN0aW9uKGwpewogICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0iYmlsbC1saW5lIj4nICsKICAgICAgICAgICc8c3BhbiBjbGFzcz0ibm0iIHRpdGxlPSInICsgZXNjKGwubmFt',
  'ZSkgKyAnIj4nICsgZXNjKGwubmFtZSkgKyAnPC9zcGFuPicgKwogICAgICAgICAgJzxzcGFuIGNsYXNzPSJxdCI+JyArIG51bShsLnF0eSkgKyAobC51bml0ID8gJyAnICsgZXNjKGwudW5pdCkgOiAnJykgKyAnIMOXICcgKyBtb25leShsLnVuaXRQcmljZSwgMikg',
  'KyAnPC9zcGFuPicgKwogICAgICAgICAgJzxzcGFuIGNsYXNzPSJ0dCI+JyArIG1vbmV5KGwudG90YWwsIDIpICsgJzwvc3Bhbj48L2Rpdj4nOwogICAgICB9KS5qb2luKCcnKSArCiAgICAgICgoYi5zaGlwcGluZyB8fCBiLmRpc2NvdW50KQogICAgICAgID8gJzxk',
  'aXYgY2xhc3M9ImJpbGwtZXh0cmEiPicgKwogICAgICAgICAgICAoYi5zaGlwcGluZyA/ICfguITguYjguLLguKrguYjguIcgJyArIG1vbmV5KGIuc2hpcHBpbmcsIDIpIDogJycpICsKICAgICAgICAgICAgKGIuc2hpcHBpbmcgJiYgYi5kaXNjb3VudCA/ICcgwrcg',
  'JyA6ICcnKSArCiAgICAgICAgICAgIChiLmRpc2NvdW50ID8gJ+C4quC5iOC4p+C4meC4peC4lCDiiJInICsgbW9uZXkoYi5kaXNjb3VudCwgMikgOiAnJykgKyAnPC9kaXY+JwogICAgICAgIDogJycpICsKICAgICc8L2Rpdj4nOwp9CgpmdW5jdGlvbiB0b2dnbGVC',
  'aWxsKGlkKXsKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7CiAgaWYgKCFlbCkgcmV0dXJuOwogIGVsLmhpZGRlbiA9ICFlbC5oaWRkZW47CiAgdmFyIGJ0biA9IGVsLnByZXZpb3VzRWxlbWVudFNpYmxpbmc7CiAgaWYgKGJ0bikgYnRuLnRl',
  'eHRDb250ZW50ID0gYnRuLnRleHRDb250ZW50LnJlcGxhY2UoZWwuaGlkZGVuID8gJ+KWtCcgOiAn4pa+JywgZWwuaGlkZGVuID8gJ+KWvicgOiAn4pa0Jyk7Cn0KCmZ1bmN0aW9uIHNldFBhcmFtKGtleSwgdmFsKXsKICBTLnBhcmFtc1trZXldID0gdmFsOwogIGxv',
  'YWQoKTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDQpIOC4peC5ieC4suC4h+C5geC4reC4o+C5jAogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLmFjID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7IHJldHVybiBjYWxsQXBpKCdhYy5tYXRyaXgnLCB7IHllYXI6IFMueWVhciB9KTsgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMu',
  'eWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKICAgIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgIGtwaSgn4Lil4LmJ4Liy4LiH4LmB4Lil4LmJ4LinICcgKyB5ZWFyTGFi',
  'ZWwsIGQucm9vbXNEb25lSW5ZZWFyICsgJy8nICsgZC5yb29tcy5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsIGQuZG9uZUluWWVhciArICcg4Lij4Lit4Lia4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJywgJ2FjY2VudCcpICsKICAgICAga3BpKCfguKLguLHguIfguYTg',
  'uKHguYjguYTguJTguYnguKXguYnguLLguIcnLCBkLnJvb21zUGVuZGluZy5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsIGQucm9vbXNQZW5kaW5nLnNsaWNlKDAsOCkuam9pbignLCAnKSArIChkLnJvb21zUGVuZGluZy5sZW5ndGg+OD8n4oCmJzonJyksIGQucm9v',
  'bXNQZW5kaW5nLmxlbmd0aCA/ICd3YXJuJzonZ29vZCcpICsKICAgICAga3BpKCfguJbguLbguIfguIHguLPguKvguJnguJTguKXguYnguLLguIcnLCBkLm92ZXJkdWUubGVuZ3RoICsgJyDguKvguYnguK3guIcnLCAn4Lij4Lit4Lia4Lil4LmJ4Liy4LiH4LiX4Li4',
  '4LiBICcgKyBkLmN5Y2xlTW9udGhzICsgJyDguYDguJTguLfguK3guJknLCBkLm92ZXJkdWUubGVuZ3RoID8gJ2JhZCc6J2dvb2QnKSArCiAgICAgIGtwaSgn4LiE4Lin4Liy4Lih4LiE4Li34Lia4Lir4LiZ4LmJ4LiyJywgcGN0KGQucm9vbXMubGVuZ3RoID8gZC5y',
  'b29tc0RvbmVJblllYXIvZC5yb29tcy5sZW5ndGgqMTAwIDogMCksICfguILguK3guIfguJfguLHguYnguIfguKvguKHguJQgJyArIGQucm9vbXMubGVuZ3RoICsgJyDguKvguYnguK3guIcnKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgYWN0aW9ucyA9ICc8ZGl2',
  'IGNsYXNzPSJyb3cgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtQWMobnVsbCkiPisg4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMPC9idXR0b24+JyArCiAgICAgICc8',
  'YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImZvcm1CdWxrQWMoKSI+8J+ThSDguJnguLHguJTguKXguYnguLLguIfguKvguKXguLLguKLguKvguYnguK3guIfguJ7guKPguYnguK3guKHguIHguLHguJk8L2J1dHRvbj4nICsKICAgICAgJzxzcGFuIGNsYXNzPSJz',
  'cCI+PC9zcGFuPicgKwogICAgICAnPHNwYW4gY2xhc3M9ImZzMTIgbXV0ZWQiPuC4hOC4peC4tOC4geC4l+C4teC5iOC4q+C5ieC4reC4h+C5gOC4nuC4t+C5iOC4reC4lOC4uS/guYDguJ7guLTguYjguKHguKPguK3guJrguIHguLLguKPguKXguYnguLLguIc8L3Nw',
  'YW4+JyArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgZ3JpZCA9IGNhcmQoJ+KdhO+4jyDguJXguLLguKPguLLguIfguKXguYnguLLguIfguYHguK3guKPguYzguKPguLLguKLguKvguYnguK3guIcgwrcgJyArIHllYXJMYWJlbCwgcm9vbUZsb29ycyhkLnJvb21zLCBm',
  'dW5jdGlvbihyKXsKICAgICAgdmFyIGNscyA9IHIucm91bmRzSW5ZZWFyID4gMCA/ICdzLW9rJyA6IChyLnN0YXRlID09PSAn4LmA4LiB4Li04LiZ4LiB4Liz4Lir4LiZ4LiUJyA/ICdzLWRncicgOiAoci5zdGF0ZSA9PT0gJ+C4ouC4seC4h+C5hOC4oeC5iOC5gOC4',
  'hOC4ouC4peC5ieC4suC4hycgPyAncy13YXJuJyA6ICdzLWluZm8nKSk7CiAgICAgIHZhciBzdWIgPSByLnJvdW5kc0luWWVhciA+IDAKICAgICAgICA/ICc8Yj4nICsgci5yb3VuZHNJblllYXIgKyAnIOC4o+C4reC4mjwvYj48YnI+JyArIHRoRGF0ZVNob3J0KHIu',
  'cmVjb3Jkcy5maWx0ZXIoZnVuY3Rpb24oeCl7cmV0dXJuIHguc2VydmljZURhdGU7fSkubWFwKGZ1bmN0aW9uKHgpe3JldHVybiB4LnNlcnZpY2VEYXRlO30pLnNvcnQoKS5wb3AoKSkKICAgICAgICA6IChyLmJvb2tlZEluWWVhciA/ICfguJnguLHguJTguYHguKXg',
  'uYnguKcgJyArIHIuYm9va2VkSW5ZZWFyIDogKHIubGFzdFNlcnZpY2UgPyAn4Lil4LmI4Liy4Liq4Li44LiUICcgKyB0aERhdGVTaG9ydChyLmxhc3RTZXJ2aWNlKSA6ICfguYTguKHguYjguKHguLXguJvguKPguLDguKfguLHguJXguLQnKSk7CiAgICAgIHJldHVy',
  'biB7IGNsczogY2xzLCBzdWI6IHN1Yiwgb25jbGljazogJ29wZW5BY1Jvb20oJyArIGpzcShyLnJvb20pICsgJyknIH07CiAgICB9KSwgJycsIGZhbHNlKTsKCiAgICB2YXIgbGlzdFJvd3MgPSBbXTsKICAgIGQucm9vbXMuZm9yRWFjaChmdW5jdGlvbihyKXsgci5y',
  'ZWNvcmRzLmZvckVhY2goZnVuY3Rpb24oeCl7IHguX3Jvb20gPSByLnJvb207IGxpc3RSb3dzLnB1c2goeCk7IH0pOyB9KTsKICAgIGxpc3RSb3dzLnNvcnQoZnVuY3Rpb24oYSxiKXsgcmV0dXJuIFN0cmluZyhiLnNlcnZpY2VEYXRlfHxiLmJvb2tEYXRlfHwnJyku',
  'bG9jYWxlQ29tcGFyZShTdHJpbmcoYS5zZXJ2aWNlRGF0ZXx8YS5ib29rRGF0ZXx8JycpKTsgfSk7CgogICAgdmFyIGxpc3QgPSBjYXJkKCfwn5OLIOC4m+C4o+C4sOC4p+C4seC4leC4tOC4geC4suC4o+C4peC5ieC4suC4h+C5geC4reC4o+C5jCDCtyAnICsgeWVh',
  'ckxhYmVsICsgJyAoJyArIGxpc3RSb3dzLmxlbmd0aCArICcpJywKICAgICAgbGlzdFJvd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guKvguYnguK3guIc8L3RoPjx0aD7guKPg',
  'uK3guJrguJfguLXguYg8L3RoPjx0aD7guKfguLHguJnguJfguLXguYjguJnguLHguJQ8L3RoPjx0aD7guKfguLHguJnguJfguLXguYjguJTguLPguYDguJnguLTguJnguIHguLLguKM8L3RoPjx0aD7guKrguJbguLLguJnguLA8L3RoPicgKwogICAgICAgICc8dGg+',
  '4LiK4LmI4Liy4LiHPC90aD48dGggY2xhc3M9Im51bSI+4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiPC90aD48dGg+4Lig4Liy4LiePC90aD48dGg+4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4PC90aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5Picg',
  'KwogICAgICAgIGxpc3RSb3dzLm1hcChmdW5jdGlvbih4KXsKICAgICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgICAnPHRkPjxiPicgKyBlc2MoeC5yb29tKSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHgu',
  'cm91bmQgfHwgMSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyB0aERhdGUoeC5ib29rRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyB0aERhdGUoeC5zZXJ2',
  'aWNlRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgc3RhdHVzU2VsZWN0KHgsICdhYy5zZXRTdGF0dXMnLCBvcHQoJ2FjU3RhdHVzZXMnKSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyh4LnRlY2hu',
  'aWNpYW4gfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIG51bSh4LmNvc3QpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwoeC5waG90b1JlZnMpICsgJzwvdGQ+JyArCiAgICAgICAg',
  'ICAgICc8dGQgY2xhc3M9ImZzMTIgbXV0ZWQgY2xpcCI+JyArIGVzYyh4Lm5vdGUgfHwgJycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGlj',
  'b24iIG9uY2xpY2s9XCdmb3JtQWMoJyArIGF0dHIoeCkgKyAnKVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiBkZ3IiIG9uY2xpY2s9ImRlbEFjKCcgKyBqc3EoeC5pZCkgKyAnKSI+8J+XkTwvYnV0',
  'dG9uPicgKwogICAgICAgICAgICAnPC9kaXY+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgOiBlbXB0eUJveCgn4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lia4Lix4LiZ4LiX4Li24LiB4LiB',
  '4Liy4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4LmD4LiZJyArIHllYXJMYWJlbCksICcnLCB0cnVlKTsKCiAgICByZXR1cm4gaGVhZCArIGFjdGlvbnMgKyBncmlkICsgJzxkaXYgY2xhc3M9Im10MTIiPicgKyBsaXN0ICsgJzwvZGl2Pic7CiAgfQp9OwoKLyoq',
  'CiAqIOC4iuC5iOC4reC4h+C5gOC4peC4t+C4reC4geC4quC4luC4suC4meC4sOC5g+C4meC4leC4suC4o+C4suC4hyDigJQg4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LmB4Lil4LmJ4Lin4Lia4Lix4LiZ4LiX4Li24LiB4LiX4Lix4LiZ4LiX4Li1IOC5hOC4oeC5iOC4',
  'leC5ieC4reC4h+C5gOC4m+C4tOC4lOC4n+C4reC4o+C5jOC4oQogKgogKiDguKvguJnguYnguLLguJXguLLguYDguKvguKHguLfguK3guJnguJvguYnguLLguKLguKrguJbguLLguJnguLDguYDguJTguLTguKHguJfguLjguIHguK3guKLguYjguLLguIcgKOC4quC4',
  'teC5gOC4lOC4teC4ouC4p+C4geC4seC4mSkg4LmB4LiE4LmI4LiB4LiU4LmB4Lil4LmJ4Lin4LmA4Lil4Li34Lit4LiB4LmE4LiU4LmJCiAqIOC4hOC4meC4l+C4teC5iOC5gOC4m+C4tOC4lOC4lOC4ueC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4p+C4iOC4',
  'sOC5gOC4q+C5h+C4meC5gOC4m+C5h+C4meC4m+C5ieC4suC4ouC4mOC4o+C4o+C4oeC4lOC4suC5gOC4q+C4oeC4t+C4reC4meC5gOC4lOC4tOC4oQogKi8KZnVuY3Rpb24gc3RhdHVzU2VsZWN0KHgsIGFjdGlvbiwgb3B0aW9ucyl7CiAgaWYgKCFjYW5FZGl0KCkp',
  'IHJldHVybiBzdGF0dXNCYWRnZSh4LnN0YXR1cyk7CiAgdmFyIGN1ciA9IFN0cmluZyh4LnN0YXR1cyB8fCAnJyk7CiAgdmFyIGxpc3QgPSAob3B0aW9ucyB8fCBbXSkuc2xpY2UoKTsKICBpZiAoY3VyICYmIGxpc3QuaW5kZXhPZihjdXIpIDwgMCkgbGlzdC51bnNo',
  'aWZ0KGN1cik7ICAgLy8g4LiE4LmI4Liy4LmA4LiB4LmI4Liy4LiZ4Lit4LiB4Lij4Liy4Lii4LiB4Liy4LijIOC4leC5ieC4reC4h+C5hOC4oeC5iOC4q+C4suC4ouC5hOC4mwogIHJldHVybiAnPHNlbGVjdCBjbGFzcz0ic3Qtc2VsICcgKyBzdGF0dXNUb25lKGN1',
  'cikgKyAnIiB0aXRsZT0i4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Liq4LiW4Liy4LiZ4Liw4LmE4LiU4LmJ4LmA4Lil4LiiIicgKwogICAgJyBkYXRhLXByZXY9IicgKyBlc2MoY3VyKSArICciJyArCiAgICAnIG9uY2hhbmdlPSJjaGFuZ2VTdGF0dXMoXCcnICsgYWN0',
  'aW9uICsgJ1wnLCcgKyBqc3EoeC5pZCkgKyAnLHRoaXMpIj4nICsKICAgIGxpc3QubWFwKGZ1bmN0aW9uKG8pewogICAgICByZXR1cm4gJzxvcHRpb24gdmFsdWU9IicgKyBlc2MobykgKyAnIicgKyAobyA9PT0gY3VyID8gJyBzZWxlY3RlZCcgOiAnJykgKyAnPicg',
  'KyBlc2MobykgKyAnPC9vcHRpb24+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvc2VsZWN0Pic7Cn0KCi8qKiDguKrguLXguILguK3guIfguKrguJbguLLguJnguLAg4LmD4LiK4LmJ4LiK4Li44LiU4LmA4LiU4Li14Lii4Lin4LiB4Lix4Lia4Lib4LmJ4Liy4LiiIHN0',
  'YXR1c0JhZGdlIOC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC5gOC4nuC4teC5ieC4ouC4meC4geC4seC4mSAqLwpmdW5jdGlvbiBzdGF0dXNUb25lKHN0KXsKICB2YXIgbSA9IFN0cmluZyhzdGF0dXNCYWRnZShzdCkpLm1hdGNoKC9jbGFzcz0iYiAoW2Etel0rKSIv',
  'KTsKICByZXR1cm4gbSA/IG1bMV0gOiAnbXV0ZSc7Cn0KCmZ1bmN0aW9uIGNoYW5nZVN0YXR1cyhhY3Rpb24sIGlkLCBzZWwpewogIHZhciBuZXh0ID0gc2VsLnZhbHVlLCBwcmV2ID0gc2VsLmdldEF0dHJpYnV0ZSgnZGF0YS1wcmV2JykgfHwgJyc7CiAgc2VsLmRp',
  'c2FibGVkID0gdHJ1ZTsKICBzZWwuY2xhc3NOYW1lID0gJ3N0LXNlbCAnICsgc3RhdHVzVG9uZShuZXh0KTsKCiAgY2FsbEFwaShhY3Rpb24sIHsgaWQ6IGlkLCBzdGF0dXM6IG5leHQgfSkudGhlbihmdW5jdGlvbihzYXZlZCl7CiAgICBpZiAoc2F2ZWQgJiYgc2F2',
  'ZWQuZmlsbGVkRGF0ZSkgewogICAgICB0b2FzdCgn4Lia4Lix4LiZ4LiX4Li24LiB4LmB4Lil4LmJ4LinIMK3IOC5gOC4leC4tOC4oeC4p+C4seC4meC4l+C4teC5iOC4lOC4s+C5gOC4meC4tOC4meC4geC4suC4o+C5gOC4m+C5h+C4mSAnICsgdGhEYXRlKHNhdmVk',
  'LmZpbGxlZERhdGUpICsgJyDguYPguKvguYnguJTguYnguKfguKInLCAnb2snKTsKICAgIH0KICAgIHNlbC5zZXRBdHRyaWJ1dGUoJ2RhdGEtcHJldicsIG5leHQpOwogICAgc2VsLmRpc2FibGVkID0gZmFsc2U7CiAgICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7ICAg',
  'Ly8g4LiK4LmI4Lit4LiH4Lir4LmJ4Lit4LiH4LiB4Lix4Lia4LiV4Lix4Lin4LmA4Lil4LiC4Liq4Lij4Li44Lib4LiU4LmJ4Liy4LiZ4Lia4LiZ4Lit4Liy4LiI4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LiV4Liy4LihCiAgICByZWZyZXNoQWxlcnRzKCk7CiAgfSku',
  'Y2F0Y2goZnVuY3Rpb24oZSl7CiAgICBpZiAocHJldikgeyBzZWwudmFsdWUgPSBwcmV2OyBzZWwuY2xhc3NOYW1lID0gJ3N0LXNlbCAnICsgc3RhdHVzVG9uZShwcmV2KTsgfQogICAgc2VsLmRpc2FibGVkID0gZmFsc2U7CiAgICB0b2FzdChlLm1lc3NhZ2UgfHwg',
  'ZSwgJ2VycicpOwogIH0pOwp9CgpmdW5jdGlvbiBvcGVuQWNSb29tKHJvb20pewogIHZhciBkID0gUy5jYWNoZS5hYzsKICB2YXIgciA9IGQucm9vbXMuZmlsdGVyKGZ1bmN0aW9uKHgpeyByZXR1cm4geC5yb29tID09PSByb29tOyB9KVswXTsKICB2YXIgYm9keSA9',
  'CiAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMyBtYjEyIj4nICsKICAgICAga3BpKCfguKPguK3guJrguJfguLXguYjguKXguYnguLLguIfguYPguJnguJvguLXguJnguLXguYknLCAoci5yb3VuZHNJblllYXJ8fDApICsgJyDguKPguK3guJonLCAnJykgKwogICAgICBr',
  'cGkoJ+C4peC5ieC4suC4h+C4peC5iOC4suC4quC4uOC4lCcsIHIubGFzdFNlcnZpY2UgPyB0aERhdGUoci5sYXN0U2VydmljZSkgOiAn4oCTJywgci5sYXN0U2VydmljZSA/IChkYXlzQWdvKHIubGFzdFNlcnZpY2UpICsgJyDguKfguLHguJnguJfguLXguYjguYHg',
  'uKXguYnguKcnKSA6ICcnKSArCiAgICAgIGtwaSgn4LiE4Lij4Lia4LiB4Liz4Lir4LiZ4LiU4Lij4Lit4Lia4LiW4Lix4LiU4LmE4LibJywgci5uZXh0RHVlID8gdGhEYXRlKHIubmV4dER1ZSkgOiAn4oCTJywgci5zdGF0ZSwgci5zdGF0ZSA9PT0gJ+C5gOC4geC4',
  'tOC4meC4geC4s+C4q+C4meC4lCcgPyAnYmFkJyA6ICcnKSArCiAgICAnPC9kaXY+JyArCiAgICAoci5yZWNvcmRzLmxlbmd0aAogICAgICA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOmF1dG8iPjx0aGVhZD48dHI+',
  'PHRoPuC4o+C4reC4mjwvdGg+PHRoPuC4meC4seC4lDwvdGg+PHRoPuC4lOC4s+C5gOC4meC4tOC4meC4geC4suC4ozwvdGg+PHRoPuC4quC4luC4suC4meC4sDwvdGg+PHRoPuC4oOC4suC4njwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAg',
  'ICAgICByLnJlY29yZHMubWFwKGZ1bmN0aW9uKHgpewogICAgICAgICAgcmV0dXJuICc8dHI+PHRkPicgKyAoeC5yb3VuZHx8MSkgKyAnPC90ZD48dGQgY2xhc3M9ImZzMTIiPicgKyB0aERhdGUoeC5ib29rRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0',
  'ZCBjbGFzcz0iZnMxMiI+JyArIHRoRGF0ZSh4LnNlcnZpY2VEYXRlKSArICc8L3RkPjx0ZD4nICsgc3RhdHVzQmFkZ2UoeC5zdGF0dXMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwoeC5waG90b1JlZnMpICsgJzwvdGQ+JyArCiAg',
  'ICAgICAgICAgICc8dGQ+PGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPVwnY2xvc2VNb2RhbCgpO2Zvcm1BYygnICsgYXR0cih4KSArICcpXCc+4LmB4LiB4LmJ4LmE4LiCPC9idXR0b24+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90',
  'Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4muC4seC4meC4l+C4tuC4geC5g+C4meC4m+C4teC4l+C4teC5iOC5gOC4peC4t+C4reC4gTwvZGl2PicpOwoKICBvcGVuTW9kYWwo',
  'J+KdhO+4jyDguKXguYnguLLguIfguYHguK3guKPguYwgwrcg4Lir4LmJ4Lit4LiHICcgKyByb29tLCBib2R5LAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guJvguLTguJQ8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNs',
  'YXNzPSJidG4gcHJpIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCk7Zm9ybUFjKHtyb29tOicgKyBqc3Eocm9vbSkgKyAnfSkiPisg4LmA4Lie4Li04LmI4Lih4Lij4Lit4Lia4LiB4Liy4Lij4Lil4LmJ4Liy4LiHPC9idXR0b24+Jyk7Cn0KCi8qID09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICA1KSDguIvguYjguK3guKHguYHguIvguKHguJXguLLguKHguKvguYnguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09ICovClJPVVRFUy5yZXBhaXJzID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7IHJldHVybiBjYWxsQXBpKCdyZXBhaXIubWF0cml4JywgeyB5ZWFyOiBTLnllYXIgfSk7IH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciB5ZWFyTGFiZWwgPSBT',
  'LnllYXIgPT09ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICBrcGkoJ+C4h+C4suC4meC4i+C5iOC4reC4oSAnICsgeWVhckxhYmVs',
  'LCBkLnRvdGFsSm9icyArICcg4LiH4Liy4LiZJywgJ+C4iOC4suC4gSAnICsgZC5yb29tcy5maWx0ZXIoZnVuY3Rpb24ocil7cmV0dXJuIHIuY291bnQ+MDt9KS5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsICdhY2NlbnQnKSArCiAgICAgIGtwaSgn4LiH4Liy4LiZ',
  '4LiX4Li14LmI4Lii4Lix4LiH4LmE4Lih4LmI4LmA4Liq4Lij4LmH4LiIJywgZC5vcGVuSm9icyArICcg4LiH4Liy4LiZJywgZC5vcGVuVGFza3MgPyAn4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmIICcgKyBkLm9wZW5UYXNrcyArICcg4LiI4Li44LiUJyA6ICcnLCBk',
  'Lm9wZW5Kb2JzID8gJ3dhcm4nIDogJ2dvb2QnKSArCiAgICAgIGtwaSgn4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Lij4Lin4LihJywgYmFodChkLnRvdGFsQ29zdCksIHllYXJMYWJlbCkgKwogICAgICBrcGkoJ+C4q+C5ieC4reC4h+C4l+C4teC5iOC4',
  'ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4i+C5iOC4reC4oScsIGQucm9vbXMuZmlsdGVyKGZ1bmN0aW9uKHIpe3JldHVybiByLmNvdW50PT09MDt9KS5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsICfguYPguJknICsgeWVhckxhYmVsKSArCiAgICAnPC9kaXY+',
  'JzsKCiAgICB2YXIgYWN0aW9ucyA9ICc8ZGl2IGNsYXNzPSJyb3cgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtUmVwYWlyKG51bGwpIj4rIOC5geC4iOC5ieC4h+C4i+C5iOC4reC4oSAvIOC4muC4seC4meC4l+C4',
  'tuC4geC4h+C4suC4meC4i+C5iOC4reC4oTwvYnV0dG9uPicgKwogICAgICAnPHNwYW4gY2xhc3M9InNwIj48L3NwYW4+PHNwYW4gY2xhc3M9ImZzMTIgbXV0ZWQiPuC4hOC4peC4tOC4geC4l+C4teC5iOC4q+C5ieC4reC4h+C5gOC4nuC4t+C5iOC4reC4lOC4ueC4',
  'm+C4o+C4sOC4p+C4seC4leC4tOC4h+C4suC4meC4i+C5iOC4reC4oeC4guC4reC4h+C4q+C5ieC4reC4h+C4meC4seC5ieC4mTwvc3Bhbj48L2Rpdj4nOwoKICAgIHZhciBncmlkID0gY2FyZCgn8J+UpyDguKDguLLguJ7guKPguKfguKHguIfguLLguJnguIvguYjg',
  'uK3guKHguKPguLLguKLguKvguYnguK3guIcgwrcgJyArIHllYXJMYWJlbCwgcm9vbUZsb29ycyhkLnJvb21zLCBmdW5jdGlvbihyKXsKICAgICAgdmFyIGNscyA9IHIub3BlbkNvdW50ID4gMCA/ICdzLWRncicgOiAoci5jb3VudCA+IDAgPyAncy1vaycgOiAncy1p',
  'bmZvJyk7CiAgICAgIHZhciBzdWIgPSByLmNvdW50ID4gMAogICAgICAgID8gJzxiPicgKyByLmNvdW50ICsgJyDguIfguLLguJk8L2I+JyArIChyLm9wZW5Db3VudCA/ICcgwrcg4LiE4LmJ4Liy4LiHICcgKyAoci5vcGVuVGFza3MgfHwgci5vcGVuQ291bnQpICsg',
  'JyDguIjguLjguJQnIDogJycpICsgJzxicj4nICsgKHIubGFzdCA/IHRoRGF0ZVNob3J0KHIubGFzdCkgOiAnJykKICAgICAgICA6ICfguYTguKHguYjguKHguLXguIfguLLguJnguIvguYjguK3guKEnOwogICAgICByZXR1cm4geyBjbHM6IGNscywgc3ViOiBzdWIs',
  'IG9uY2xpY2s6ICdvcGVuUmVwYWlyUm9vbSgnICsganNxKHIucm9vbSkgKyAnKScgfTsKICAgIH0pKTsKCiAgICB2YXIgcm93cyA9IFtdOwogICAgZC5yb29tcy5mb3JFYWNoKGZ1bmN0aW9uKHIpeyByLnJlY29yZHMuZm9yRWFjaChmdW5jdGlvbih4KXsgcm93cy5w',
  'dXNoKHgpOyB9KTsgfSk7CiAgICByb3dzLnNvcnQoZnVuY3Rpb24oYSxiKXsgcmV0dXJuIFN0cmluZyhiLnJlcGFpckRhdGV8fGIuYm9va0RhdGV8fCcnKS5sb2NhbGVDb21wYXJlKFN0cmluZyhhLnJlcGFpckRhdGV8fGEuYm9va0RhdGV8fCcnKSk7IH0pOwoKICAg',
  'IHZhciBsaXN0ID0gY2FyZCgn8J+TiyDguKPguLLguKLguIHguLLguKPguIfguLLguJnguIvguYjguK3guKEgwrcgJyArIHllYXJMYWJlbCArICcgKCcgKyByb3dzLmxlbmd0aCArICcpJywKICAgICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJs',
  'ZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDoxMDIwcHgiPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guKvguYnguK3guIc8L3RoPjx0aD7guKfguLHguJnguJnguLHguJTguIvguYjguK3guKE8L3RoPjx0aD7guKfguLHguJnguYDguILguYnguLLguIvg',
  'uYjguK3guKE8L3RoPjx0aD7guJvguKPguLDguYDguKDguJc8L3RoPjx0aD7guKPguLLguKLguIHguLLguKPguJfguLXguYjguIvguYjguK3guKHguYHguIvguKE8L3RoPicgKwogICAgICAgICc8dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD48dGggY2xhc3M9Im51bSI+',
  '4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiPC90aD48dGg+4LiB4LmI4Lit4LiZPC90aD48dGg+4Lir4Lil4Lix4LiHPC90aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIHJvd3MubWFwKGZ1bmN0aW9uKHgpewogICAgICAgICAg',
  'cmV0dXJuICc8dHI+JyArCiAgICAgICAgICAgICc8dGQ+PGI+JyArIGVzYyh4LnJvb20pICsgJzwvYj48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LmJvb2tEYXRlKSArICc8L3RkPicgKwogICAgICAgICAg',
  'ICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LnJlcGFpckRhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MoeC5jYXRlZ29yeSB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0',
  'ZCBzdHlsZT0ibWluLXdpZHRoOjI4MHB4Ij4nICsgdG9kb0xpc3RIdG1sKHgpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHN0YXR1c0JhZGdlKHguc3RhdHVzKSArICh4LnByaW9yaXR5ICYmIHgucHJpb3JpdHkgIT09ICfguJvguIHguJXguLQnID8g',
  'JyAnICsgc3RhdHVzQmFkZ2UoeC5wcmlvcml0eSkgOiAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbnVtKHguY29zdCkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCh4LmJlZm9yZVJlZnMp',
  'ICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwoeC5hZnRlclJlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNt',
  'IGljb24iIG9uY2xpY2s9XCdmb3JtUmVwYWlyKCcgKyBhdHRyKHgpICsgJylcJz7inI/vuI88L2J1dHRvbj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24gZGdyIiBvbmNsaWNrPSJkZWxSZXBhaXIoJyArIGpzcSh4LmlkKSArICcp',
  'Ij7wn5eRPC9idXR0b24+JyArCiAgICAgICAgICAgICc8L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6IGVtcHR5Qm94KCfguKLguLHguIfguYTguKHguYjguKHguLXguIfguLLguJng',
  'uIvguYjguK3guKHguYPguJknICsgeWVhckxhYmVsLCAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZm9ybVJlcGFpcihudWxsKSI+KyDguYHguIjguYnguIfguIvguYjguK3guKE8L2J1dHRvbj4nKSwgJycsIHRydWUpOwoKICAgIHJldHVybiBoZWFk',
  'ICsgYWN0aW9ucyArIGdyaWQgKyAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIGxpc3QgKyAnPC9kaXY+JzsKICB9Cn07CgovKioKICog4LmA4LiK4LmH4LiE4Lil4Li04Liq4LiV4LmM4LiX4Li14LmI4LiV4Li04LmK4LiB4LmE4LiU4LmJ4LiI4Lij4Li04LiH4LiI4Liy',
  '4LiB4Lir4LiZ4LmJ4Liy4Lij4Liy4Lii4LiB4Liy4LijIOC5hOC4oeC5iOC4leC5ieC4reC4h+C5gOC4m+C4tOC4lOC4n+C4reC4o+C5jOC4oQogKiDguJXguLTguYrguIHguJvguLjguYrguJrguJrguLHguJnguJfguLbguIHguILguLbguYnguJnguIrguLXguJXg',
  'uJfguLHguJnguJfguLUg4LmB4Lil4Liw4LiW4LmJ4Liy4LiV4Li04LmK4LiB4LiE4Lij4Lia4LiX4Li44LiB4LiC4LmJ4LitIOC4quC4luC4suC4meC4sOC4iOC4sOC5gOC4m+C4peC4teC5iOC4ouC4meC5gOC4m+C5h+C4mSAi4LmA4Liq4Lij4LmH4LiI4Liq4Li0',
  '4LmJ4LiZIiDguYPguKvguYnguYDguK3guIcKICovCmZ1bmN0aW9uIHRvZG9MaXN0SHRtbCh4KXsKICB2YXIgdG9kbyA9IHgudG9kbyB8fCBbXTsKICBpZiAoIXRvZG8ubGVuZ3RoKSByZXR1cm4gJzxzcGFuIGNsYXNzPSJmczEzIG11dGVkIj4nICsgZXNjKHguaXRl',
  'bXMgfHwgJ+KAkycpICsgJzwvc3Bhbj4nOwoKICB2YXIgcCA9IHgucHJvZ3Jlc3MgfHwgeyBkb25lOiAwLCB0b3RhbDogdG9kby5sZW5ndGgsIHBlcmNlbnQ6IDAgfTsKICB2YXIgbG9ja2VkID0gIWNhbkVkaXQoKTsKCiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJ0b2Rv',
  'LXZpZXciPicgKwogICAgJzxkaXYgY2xhc3M9InRvZG8tYmFyIj48aSBzdHlsZT0id2lkdGg6JyArIHAucGVyY2VudCArICclIj48L2k+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0idG9kby1tZXRhIj7guYDguKrguKPguYfguIjguYHguKXguYnguKcgPGI+JyAr',
  'IHAuZG9uZSArICcvJyArIHAudG90YWwgKyAnPC9iPiDguIfguLLguJk8L2Rpdj4nICsKICAgIHRvZG8ubWFwKGZ1bmN0aW9uKHQsIGkpewogICAgICByZXR1cm4gJzxsYWJlbCBjbGFzcz0idG9kby1saW5lJyArICh0LmRvbmUgPyAnIGRvbmUnIDogJycpICsgKGxv',
  'Y2tlZCA/ICcgbG9ja2VkJyA6ICcnKSArICciPicgKwogICAgICAgICc8aW5wdXQgdHlwZT0iY2hlY2tib3giJyArICh0LmRvbmUgPyAnIGNoZWNrZWQnIDogJycpICsgKGxvY2tlZCA/ICcgZGlzYWJsZWQnIDogJycpICsKICAgICAgICAgICcgb25jaGFuZ2U9InRv',
  'Z2dsZVRvZG8oJyArIGpzcSh4LmlkKSArICcsJyArIGkgKyAnLHRoaXMuY2hlY2tlZCx0aGlzKSI+JyArCiAgICAgICAgJzxzcGFuIGNsYXNzPSJubSI+JyArIGVzYyh0Lm5hbWUpICsgJzwvc3Bhbj4nICsKICAgICAgICAodC5jYXRlZ29yeSA/ICc8c3BhbiBjbGFz',
  'cz0iYiBtdXRlIGNhdCI+JyArIGVzYyh0LmNhdGVnb3J5KSArICc8L3NwYW4+JyA6ICcnKSArCiAgICAgICc8L2xhYmVsPic7CiAgICB9KS5qb2luKCcnKSArCiAgJzwvZGl2Pic7Cn0KCi8qKgogKiDguJXguLTguYrguIHguIfguLLguJnguKvguJnguLbguYjguIfg',
  'uILguYnguK0g4oCUIOC4reC4seC4m+C5gOC4lOC4leC4q+C4meC5ieC4suC4iOC4reC4l+C4seC4meC4l+C4teC5geC4peC5ieC4p+C4hOC5iOC4reC4ouC4muC4seC4meC4l+C4tuC4gQogKiDguJbguYnguLLguJrguLHguJnguJfguLbguIHguYTguKHguYjguJzg',
  'uYjguLLguJkg4LmD4Lir4LmJ4LiV4Li04LmK4LiB4LiB4Lil4Lix4Lia4LmE4Lib4LmA4Lib4LmH4LiZ4LmA4Lir4Lih4Li34Lit4LiZ4LmA4LiU4Li04LihIOC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC5gOC4guC5ieC4suC5g+C4iOC4nOC4tOC4lOC4p+C5iOC4',
  'suC4muC4seC4meC4l+C4tuC4geC5geC4peC5ieC4pwogKi8KZnVuY3Rpb24gdG9nZ2xlVG9kbyhpZCwgaW5kZXgsIGRvbmUsIGJveCl7CiAgdmFyIGxpbmUgPSBib3guY2xvc2VzdCgnLnRvZG8tbGluZScpOwogIGlmIChsaW5lKSBsaW5lLmNsYXNzTGlzdC50b2dn',
  'bGUoJ2RvbmUnLCBkb25lKTsKICBib3guZGlzYWJsZWQgPSB0cnVlOwoKICBjYWxsQXBpKCdyZXBhaXIudG9nZ2xlJywgeyBpZDogaWQsIGluZGV4OiBpbmRleCwgZG9uZTogZG9uZSB9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7',
  'ICAgICAgICAvLyDguITguKfguLLguKHguITguLfguJrguKvguJnguYnguLLguIHguLHguJrguKrguJbguLLguJnguLDguK3guLLguIjguYDguJvguKXguLXguYjguKLguJkg4LiL4Li04LiH4LiB4LmM4LmA4LiH4Li14Lii4LiaIOC5hgogICAgcmVmcmVzaEFsZXJ0',
  'cygpOyAgICAgICAgICAgICAgLy8g4LiH4Liy4LiZ4LiE4LmJ4Liy4LiH4Lit4Liy4LiI4Lil4LiU4Lil4LiHIOC4leC4seC4p+C5gOC4peC4guC4muC4meC5gOC4oeC4meC4ueC4leC5ieC4reC4h+C4leC4suC4oeC4lOC5ieC4p+C4ogogIH0pLmNhdGNoKGZ1bmN0',
  'aW9uKGUpewogICAgYm94LmNoZWNrZWQgPSAhZG9uZTsKICAgIGlmIChsaW5lKSBsaW5lLmNsYXNzTGlzdC50b2dnbGUoJ2RvbmUnLCAhZG9uZSk7CiAgICBib3guZGlzYWJsZWQgPSBmYWxzZTsKICAgIHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7CiAgfSk7',
  'Cn0KCmZ1bmN0aW9uIG9wZW5SZXBhaXJSb29tKHJvb20pewogIHZhciBkID0gUy5jYWNoZS5yZXBhaXJzOwogIHZhciByID0gZC5yb29tcy5maWx0ZXIoZnVuY3Rpb24oeCl7IHJldHVybiB4LnJvb20gPT09IHJvb207IH0pWzBdOwogIHZhciBib2R5ID0gJzxkaXYg',
  'Y2xhc3M9ImdyaWQgZzMgbWIxMiI+JyArCiAgICAgIGtwaSgn4LiH4Liy4LiZ4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJywgci5jb3VudCArICcg4LiH4Liy4LiZJywgJycpICsKICAgICAga3BpKCfguKLguLHguIfguYTguKHguYjguYDguKrguKPguYfguIgnLCByLm9w',
  'ZW5Db3VudCArICcg4LiH4Liy4LiZJywgci5vcGVuVGFza3MgPyAn4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmIICcgKyByLm9wZW5UYXNrcyArICcg4LiI4Li44LiUJyA6ICcnLCByLm9wZW5Db3VudCA/ICd3YXJuJzonZ29vZCcpICsKICAgICAga3BpKCfguITguYjg',
  'uLLguYPguIrguYnguIjguYjguLLguKInLCBiYWh0KHIuY29zdCksICcnKSArCiAgICAnPC9kaXY+JyArCiAgICAoci5yZWNvcmRzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0bCI+JyArIHIucmVjb3Jkcy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgIHJldHVybiAnPGRp',
  'diBjbGFzcz0idGwtaSI+PGRpdiBjbGFzcz0iZCI+JyArIHRoRGF0ZSh4LnJlcGFpckRhdGUgfHwgeC5ib29rRGF0ZSkgKyAnIMK3ICcgKyBlc2MoeC5jYXRlZ29yeXx8JycpICsgJyAnICsgc3RhdHVzQmFkZ2UoeC5zdGF0dXMpICsgJzwvZGl2PicgKwogICAgICAg',
  'ICc8ZGl2IGNsYXNzPSJ0Ij4nICsgdG9kb0xpc3RIdG1sKHgpICsgJzwvZGl2PicgKwogICAgICAgICh4LnRlY2huaWNpYW4gPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCI+4LiK4LmI4Liy4LiHOiAnICsgZXNjKHgudGVjaG5pY2lhbikgKyAnPC9kaXY+JyA6ICcn',
  'KSArCiAgICAgICAgKHguY29zdCA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIj7guITguYjguLLguYPguIrguYnguIjguYjguLLguKIgJyArIGJhaHQoeC5jb3N0KSArICc8L2Rpdj4nIDogJycpICsKICAgICAgICAnPGRpdiBjbGFzcz0ibXQ4Ij4nICsgdGh1bWJz',
  'SHRtbCgoeC5iZWZvcmVSZWZzfHxbXSkuY29uY2F0KHguYWZ0ZXJSZWZzfHxbXSkpICsgJzwvZGl2PicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJtdDgiPjxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz1cJ2Nsb3NlTW9kYWwoKTtmb3JtUmVwYWlyKCcgKyBh',
  'dHRyKHgpICsgJylcJz7guYHguIHguYnguYTguII8L2J1dHRvbj48L2Rpdj4nICsKICAgICAgJzwvZGl2Pic7CiAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij7guKLguLHguIfguYTguKHguYjguKHguLXguIfguLLguJnguIvg',
  'uYjguK3guKHguYPguJnguJvguLXguJfguLXguYjguYDguKXguLfguK3guIE8L2Rpdj4nKTsKCiAgb3Blbk1vZGFsKCfwn5SnIOC4h+C4suC4meC4i+C5iOC4reC4oSDCtyDguKvguYnguK3guIcgJyArIHJvb20sIGJvZHksCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRu',
  'IiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4m+C4tOC4lDwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtmb3JtUmVwYWlyKHtyb29tOicgKyBqc3Eocm9vbSkgKyAnfSkiPisg4LmA4Lie4Li04LmI',
  '4Lih4LiH4Liy4LiZ4LiL4LmI4Lit4LihPC9idXR0b24+JywgdHJ1ZSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICA2KSDguIvguYjguK3guKHguYHguIvguKHguJXguLbguIHguYLg',
  'uJTguKLguKPguKfguKEKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5idWlsZGluZyA9IHsKICBsb2FkOiBmdW5jdGlvbigpewogICAgcmV0dXJuIFByb21pc2UuYWxsKFsKICAg',
  'ICAgY2FsbEFwaSgnYnVpbGRpbmcuc3VtbWFyeScsIHsgeWVhcjogUy55ZWFyIH0pLAogICAgICBjYWxsQXBpKCdidWlsZGluZy5saXN0JywgeyB5ZWFyOiBTLnllYXIsIHpvbmU6IFMucGFyYW1zLnpvbmUgfHwgJycsIHN0YXR1czogJycgfSkKICAgIF0pLnRoZW4o',
  'ZnVuY3Rpb24ocil7IHZhciBkID0gclswXTsgZC5pdGVtcyA9IHJbMV07IHJldHVybiBkOyB9KTsKICB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgeWVhckxhYmVsID0gUy55ZWFyID09PSAnYWxsJyA/ICfguJfguLjguIHguJvguLUnIDogJ+C4m+C4',
  'tSAnICsgUy55ZWFyOwogICAgdmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAga3BpKCfguIfguLLguJnguJvguLUgJyArIChTLnllYXI9PT0nYWxsJz8n4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJzpTLnllYXIpLCBkLnllYXJDb3Vu',
  'dCArICcg4LiH4Liy4LiZJywgJ+C4quC4sOC4quC4oSAnICsgZC50b3RhbCArICcg4LiH4Liy4LiZJywgJ2FjY2VudCcpICsKICAgICAga3BpKCfguITguYjguLLguYPguIrguYnguIjguYjguLLguKIgJyArIHllYXJMYWJlbCwgYmFodChkLnllYXJDb3N0KSwgJ+C4',
  'quC4sOC4quC4oSAnICsgYmFodChkLmdyYW5kQ29zdCkpICsKICAgICAga3BpKCfguIfguLLguJnguJfguLXguYjguKLguLHguIfguYTguKHguYjguYDguKrguKPguYfguIgnLCBkLm9wZW5Db3VudCArICcg4LiH4Liy4LiZJywgJycsIGQub3BlbkNvdW50ID8gJ3dh',
  'cm4nIDogJ2dvb2QnKSArCiAgICAgIGtwaSgn4LiE4Lij4Lia4LiB4Liz4Lir4LiZ4LiU4LmD4LiZIDkwIOC4p+C4seC4mScsIGQudXBjb21pbmcubGVuZ3RoICsgJyDguIfguLLguJknLCBkLnVwY29taW5nLmxlbmd0aCA/IGQudXBjb21pbmdbMF0udGl0bGUgOiAn',
  'JywgZC51cGNvbWluZy5sZW5ndGggPyAnd2FybicgOiAnJykgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIHpvbmVzID0gJzxkaXYgY2xhc3M9ImNoaXBzIG1iMTIiPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iY2hpcCAnICsgKCFTLnBhcmFtcy56b25lPydvbic6',
  'JycpICsgJyIgb25jbGljaz0ic2V0UGFyYW0oXCd6b25lXCcsXCdcJykiPuC4l+C4uOC4geC4quC5iOC4p+C4mTwvYnV0dG9uPicgKwogICAgICBkLmJ5Wm9uZS5tYXAoZnVuY3Rpb24oeil7CiAgICAgICAgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJjaGlwICcgKyAo',
  'Uy5wYXJhbXMuem9uZT09PXouem9uZT8nb24nOicnKSArICciIG9uY2xpY2s9InNldFBhcmFtKFwnem9uZVwnLCcgKyBqc3Eoei56b25lKSArICcpIj4nICsKICAgICAgICAgICAgICAgZXNjKHouem9uZSkgKyAnICgnICsgei5jb3VudCArICcpPC9idXR0b24+JzsK',
  'ICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKCiAgICB2YXIgY2hhcnRzID0gJzxkaXYgY2xhc3M9ImdyaWQgZzIgbWIxMiI+JyArCiAgICAgIGNhcmQoJ/Cfj5fvuI8g4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4LmB4Lii4LiB4LiV4Liy4Lih4Liq',
  '4LmI4Lin4LiZ4LiC4Lit4LiH4Lit4Liy4LiE4Liy4LijJywgYmFyQ2hhcnQoZC5ieVpvbmUsICd6b25lJywgJ2Nvc3QnLCBmdW5jdGlvbihpKXsgcmV0dXJuIG1vbmV5KGkuY29zdCkgKyAnIOC4vyc7IH0pKSArCiAgICAgIGNhcmQoJ/Cfk4Ug4LiE4LmI4Liy4LmD',
  '4LiK4LmJ4LiI4LmI4Liy4Lii4LmB4Lii4LiB4LiV4Liy4Lih4Lib4Li1JywgYmFyQ2hhcnQoCiAgICAgICAgZC5ieVllYXIubWFwKGZ1bmN0aW9uKHkpeyByZXR1cm4geyBsYWJlbDon4Lib4Li1ICcgKyB5LnllYXIgKyAnICgnICsgeS5jb3VudCArICcg4LiH4Liy',
  '4LiZKScsIGNvc3Q6eS5jb3N0IH07IH0pLAogICAgICAgICdsYWJlbCcsICdjb3N0JywgZnVuY3Rpb24oaSl7IHJldHVybiBtb25leShpLmNvc3QpICsgJyDguL8nOyB9KSkgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIHJvd3MgPSBkLml0ZW1zOwogICAgdmFyIGxp',
  'c3QgPSBjYXJkKCfwn4+iIOC4o+C4suC4ouC4geC4suC4o+C4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oSDCtyAnICsgeWVhckxhYmVsICsgJyAoJyArIHJvd3MubGVuZ3RoICsgJyknLAogICAgICByb3dzLmxlbmd0aCA/ICc8',
  'ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOjEwMjBweCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC4quC5iOC4p+C4meC4guC4reC4h+C4reC4suC4hOC4suC4ozwvdGg+PHRoPuC4o+C4suC4ouC4geC4suC4ozwv',
  'dGg+PHRoPuC4meC4seC4lDwvdGg+PHRoPuC5gOC4o+C4tOC5iOC4oTwvdGg+PHRoPuC5gOC4quC4o+C5h+C4iDwvdGg+PHRoPuC4quC4luC4suC4meC4sDwvdGg+JyArCiAgICAgICAgJzx0aD7guJzguLnguYnguKPguLHguJrguYDguKvguKHguLI8L3RoPjx0aCBj',
  'bGFzcz0ibnVtIj7guITguYjguLLguYPguIrguYnguIjguYjguLLguKI8L3RoPjx0aD7guKPguK3guJrguJbguLHguJTguYTguJs8L3RoPjx0aD7guKDguLLguJ48L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgcm93cy5tYXAoZnVu',
  'Y3Rpb24oeCl7CiAgICAgICAgICByZXR1cm4gJzx0cj4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+PGI+JyArIGVzYyh4LnpvbmUgfHwgJ+KAkycpICsgJzwvYj48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEzIj48ZGl2IGNsYXNz',
  'PSJjbGlwIj4nICsgZXNjKHgudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAgICAgICh4Lm5vdGUgPyAnPGRpdiBjbGFzcz0iZnMxMiBmYWludCBjbGlwIj4nICsgZXNjKHgubm90ZSkgKyAnPC9kaXY+JyA6ICcnKSArICc8L3RkPicgKwogICAgICAgICAgICAn',
  'PHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LmJvb2tEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LnN0YXJ0RGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBj',
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
  '4LmD4LiZIG9uY2xpY2sgYXR0cmlidXRlIOC5hOC4lOC5ieC4reC4ouC5iOC4suC4h+C4m+C4peC4reC4lOC4oOC4seC4oiAqLwpmdW5jdGlvbiBhdHRyKG9iail7CiAgdmFyIGNsZWFuID0ge307CiAgT2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uKGsp',
  'ewogICAgaWYgKGsuaW5kZXhPZignXycpID09PSAwIHx8IC9SZWZzJC8udGVzdChrKSB8fCBrID09PSAncmVjb3JkcycgfHwgayA9PT0gJ3dhcnJhbnR5JykgcmV0dXJuOwogICAgY2xlYW5ba10gPSBvYmpba107CiAgfSk7CiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5',
  'KGNsZWFuKS5yZXBsYWNlKC8mL2csJyZhbXA7JykucmVwbGFjZSgvJy9nLCcmIzM5OycpLnJlcGxhY2UoLyIvZywnJnF1b3Q7Jyk7Cn0KPC9zY3JpcHQ+CjxzY3JpcHQ+Ci8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PQogICBTZXR0aW5ncy5odG1sIOKAlCDguKvguJnguYnguLLguJXguLHguYnguIfguITguYjguLIgwrcg4LiY4Li14LihIMK3IOC4muC4seC4jeC4iuC4teC4nOC4ueC5ieC5g+C4iuC5iSDCtyDguK3guLjguJvguIHguKPguJPguYwKICAgPT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4mOC4teC4oeC4quC4p+C5iOC4suC4hyAvIOC4oeC4t+C4lCAtLS0tLS0tLS0tLS0tLS0tICovCgp2YXIgTFNfVEhFTUUgPSAnbWNv',
  'cm5lci50aGVtZSc7CnZhciBUSEVNRVMgPSBbCiAgeyBpZDogJ+C4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hycsIGljOiAn8J+MlycsIGhpbnQ6ICfguKrguKXguLHguJrguJXguLLguKHguIHguLLguKPguJXguLHguYnguIfguITguYjguLLguILguK3guIfg',
  'uK3guLjguJvguIHguKPguJPguYwnIH0sCiAgeyBpZDogJ+C4quC4p+C5iOC4suC4hycsICAgICAgaWM6ICfimIDvuI8nLCBoaW50OiAn4Lie4Li34LmJ4LiZ4LiC4Liy4LinIOC4reC5iOC4suC4meC4h+C5iOC4suC4ouC4geC4peC4suC4h+C5geC4lOC4lCcgfSwK',
  'ICB7IGlkOiAn4Lih4Li34LiUJywgICAgICAgIGljOiAn8J+MmScsIGhpbnQ6ICfguJ7guLfguYnguJnguYDguILguYnguKEg4Liq4Lia4Liy4Lii4LiV4Liy4LiV4Lit4LiZ4LiB4Lil4Liy4LiH4LiE4Li34LiZJyB9Cl07CgovKioKICog4LiX4Liy4LiY4Li14Lih',
  '4Lil4LiH4Lir4LiZ4LmJ4Liy4LmA4Lin4LmH4Lia4LiX4Lix4LiZ4LiX4Li1CiAqIOC4leC4seC4p+C5geC4m+C4o+C4quC4teC4l+C4seC5ieC4h+C4q+C4oeC4lOC4meC4tOC4ouC4suC4oeC5hOC4p+C5iSAzIOC4iuC4seC5ieC4meC5g+C4mSBTdHlsZS5odG1s',
  'IOC5geC4peC5ieC4pyDguJXguKPguIfguJnguLXguYnguYHguITguYjguJXguLTguJTguJvguYnguLLguKLguJrguK3guIHguKfguYjguLLguYPguIrguYnguIrguLHguYnguJnguYTguKvguJkKICovCmZ1bmN0aW9uIGFwcGx5VGhlbWUobmFtZSl7CiAgdmFyIHJv',
  'b3QgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7CiAgaWYgKG5hbWUgPT09ICfguKrguKfguYjguLLguIcnKSByb290LnNldEF0dHJpYnV0ZSgnZGF0YS10aGVtZScsICdsaWdodCcpOwogIGVsc2UgaWYgKG5hbWUgPT09ICfguKHguLfguJQnKSByb290LnNldEF0',
  'dHJpYnV0ZSgnZGF0YS10aGVtZScsICdkYXJrJyk7CiAgZWxzZSByb290LnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS10aGVtZScpOyAgICAgICAvLyDguJXguLLguKHguYDguITguKPguLfguYjguK3guIcgPSDguJvguKXguYjguK3guKLguYPguKvguYkgcHJlZmVycy1j',
  'b2xvci1zY2hlbWUg4LiV4Lix4LiU4Liq4Li04LiZCiAgdmFyIGJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0aGVtZUJ0bicpOwogIGlmIChidG4pIHsKICAgIHZhciB0ID0gVEhFTUVTLmZpbHRlcihmdW5jdGlvbih4KXsgcmV0dXJuIHguaWQgPT09IG5h',
  'bWU7IH0pWzBdIHx8IFRIRU1FU1swXTsKICAgIGJ0bi50ZXh0Q29udGVudCA9IHQuaWM7CiAgICBidG4udGl0bGUgPSAn4LiY4Li14LihOiAnICsgdC5pZCArICcgKOC4geC4lOC5gOC4nuC4t+C5iOC4reC4quC4peC4seC4miknOwogIH0KfQoKZnVuY3Rpb24gY3Vy',
  'cmVudFRoZW1lKCl7CiAgcmV0dXJuIGxzR2V0KExTX1RIRU1FKSB8fCAoUy5ib290ICYmIFMuYm9vdC5zZXR0aW5ncyAmJiBTLmJvb3Quc2V0dGluZ3MudGhlbWUpIHx8ICfguJXguLLguKHguYDguITguKPguLfguYjguK3guIcnOwp9CgovKiog4LiV4Lix4LmJ4LiH',
  '4LiY4Li14Lih4LmB4Lil4Liw4LiI4Liz4LmE4Lin4LmJIOKAlCDguJzguLnguYnguJTguLnguYHguKXguIjguLDguJbguLnguIHguJrguLHguJnguJfguLbguIHguYDguJvguYfguJnguITguYjguLLguJXguLHguYnguIfguJXguYnguJnguILguK3guIfguKPguLDg',
  'uJrguJrguJTguYnguKfguKIgKi8KZnVuY3Rpb24gc2V0VGhlbWUobmFtZSwgcXVpZXQpewogIGxzU2V0KExTX1RIRU1FLCBuYW1lKTsKICBhcHBseVRoZW1lKG5hbWUpOwogIGlmIChTLmJvb3QgJiYgUy5ib290LmlzQWRtaW4pIHsKICAgIGNhbGxBcGkoJ3NldHRp',
  'bmdzLnNhdmUnLCB7IHZhbHVlczogeyB0aGVtZTogbmFtZSB9IH0pLmNhdGNoKGZ1bmN0aW9uKCl7IC8qIOC5gOC4geC5h+C4muC5g+C4meC5gOC4hOC4o+C4t+C5iOC4reC4h+C4geC5h+C4nuC4rSAqLyB9KTsKICB9CiAgaWYgKCFxdWlldCkgdG9hc3QoJ+C5gOC4',
  'm+C4peC4teC5iOC4ouC4meC5gOC4m+C5h+C4meC4mOC4teC4oScgKyAobmFtZSA9PT0gJ+C4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hycgPyAn4LiV4Liy4Lih4LmA4LiE4Lij4Li34LmI4Lit4LiHJyA6IG5hbWUpLCAnb2snKTsKICBpZiAoUy5wYWdlID09',
  'PSAnc2V0dGluZ3MnKSBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7Cn0KCi8qKiDguJvguLjguYjguKHguJrguJnguYHguJbguJrguKvguLHguKcg4oCUIOC4p+C4meC4quC4p+C5iOC4suC4hyDihpIg4Lih4Li34LiUIOKGkiDguJXguLLguKHguYDguITguKPguLfguYjg',
  'uK3guIcgKi8KZnVuY3Rpb24gY3ljbGVUaGVtZSgpewogIHZhciBvcmRlciA9IFsn4Liq4Lin4LmI4Liy4LiHJywgJ+C4oeC4t+C4lCcsICfguJXguLLguKHguYDguITguKPguLfguYjguK3guIcnXTsKICB2YXIgaSA9IG9yZGVyLmluZGV4T2YoY3VycmVudFRoZW1l',
  'KCkpOwogIHNldFRoZW1lKG9yZGVyWyhpICsgMSkgJSBvcmRlci5sZW5ndGhdKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguKvguJnguYnguLLguJXguLHguYnguIfguITguYjguLIgLS0tLS0tLS0tLS0tLS0tLSAqLwoKUk9VVEVTLnNldHRpbmdzID0gewogIGxv',
  'YWQ6IGZ1bmN0aW9uKCl7CiAgICByZXR1cm4gUHJvbWlzZS5hbGwoWwogICAgICBjYWxsQXBpKCdzZXR0aW5ncy5saXN0Jywge30pLAogICAgICBjYWxsQXBpKCdhdXRoLmRldmljZXMnLCB7fSkuY2F0Y2goZnVuY3Rpb24oKXsgcmV0dXJuIFtdOyB9KSwKICAgICAg',
  'KFMuYm9vdCAmJiBTLmJvb3QuaXNBZG1pbikgPyBjYWxsQXBpKCd1c2VyLmxpc3QnLCB7fSkuY2F0Y2goZnVuY3Rpb24oKXsgcmV0dXJuIFtdOyB9KSA6IFByb21pc2UucmVzb2x2ZShudWxsKSwKICAgICAgKFMuYm9vdCAmJiBTLmJvb3QuaXNBZG1pbikgPyBjYWxs',
  'QXBpKCdzaGFyZS5saW5rcycsIHt9KS5jYXRjaChmdW5jdGlvbigpeyByZXR1cm4ge307IH0pIDogUHJvbWlzZS5yZXNvbHZlKHt9KQogICAgXSkudGhlbihmdW5jdGlvbihyKXsKICAgICAgcmV0dXJuIHsgc2V0dGluZ3M6IHJbMF0sIGRldmljZXM6IHJbMV0gfHwg',
  'W10sIHVzZXJzOiByWzJdLCBsaW5rczogclszXSB8fCB7fSwgeWVhcnM6IFtdIH07CiAgICB9KTsKICB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICByZXR1cm4gJycgKwogICAgICBzZXR0aW5nc0FjY291bnRDYXJkKGQpICsKICAgICAgc2V0dGluZ3NUaGVt',
  'ZUNhcmQoKSArCiAgICAgIChkLnNldHRpbmdzLmNhbkVkaXQgPyBzZXR0aW5nc0dyb3Vwc0h0bWwoZC5zZXR0aW5ncykgOiBzZXR0aW5nc1JlYWRPbmx5Tm90ZSgpKSArCiAgICAgIC8vIOC5gOC4ieC4nuC4suC4sOC4nOC4ueC5ieC4lOC4ueC5geC4peC4l+C4teC5',
  'iOC5gOC4q+C5h+C4meC4quC4reC4h+C4quC5iOC4p+C4meC4meC4teC5iSDigJQg4LiV4Lix4Lin4LiB4Liy4Lij4LmM4LiU4LmA4Lib4LmH4LiZ4LiE4LiZ4LiV4Lix4LiU4Liq4Li04LiZ4LmD4LiI4LmA4Lit4LiH4Lin4LmI4Liy4LiI4Liw4LmB4Liq4LiU4LiH',
  '4Lit4Liw4LmE4LijCiAgICAgIC8vIOC5gOC4nuC4o+C4suC4sOC4q+C4meC5ieC4suC4leC4seC4p+C4reC4ouC5iOC4suC4h+C5geC4muC4muC5hOC4n+C4peC5jOC5gOC4lOC4teC4ouC4p+C5hOC4oeC5iOC4oeC4teC4muC4seC4jeC4iuC4teC4nOC4ueC5ieC5',
  'g+C4iuC5ieC5g+C4q+C5ieC5geC4quC4lOC4hyDguYHguJXguYjguKLguLHguIfguK3guKLguLLguIHguJrguK3guIHguJzguLnguYnguYPguIrguYnguKfguYjguLLguKHguLXguK3guLDguYTguKPguJrguYnguLLguIcKICAgICAgKGlzQWRtaW5Ob3coKSA/IHNl',
  'dHRpbmdzVXNlcnNDYXJkKGQudXNlcnMpICsgc2V0dGluZ3NTaGFyZUNhcmQoZC5saW5rcykgOiAnJyk7CiAgfQp9OwoKLyogLS0tLSDguJrguLHguI3guIrguLXguILguK3guIfguInguLHguJkgLS0tLSAqLwoKZnVuY3Rpb24gc2V0dGluZ3NBY2NvdW50Q2FyZChk',
  'KXsKICB2YXIgbWUgPSBBVVRILm1lIHx8IHt9OwogIHZhciBkZXZpY2VzID0gZC5kZXZpY2VzIHx8IFtdOwogIHJldHVybiBjYXJkKCfwn5GkIOC4muC4seC4jeC4iuC4teC4guC4reC4h+C4ieC4seC4mScsCiAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMiBtYjEyIj4n',
  'ICsKICAgICAga3BpKCfguYDguILguYnguLLguYPguIrguYnguIfguLLguJnguYPguJnguIrguLfguYjguK0nLCBlc2MobWUubmFtZSB8fCBtZS51c2VybmFtZSB8fCAn4oCTJyksIGVzYyhtZS51c2VybmFtZSA/ICdAJyArIG1lLnVzZXJuYW1lIDogKG1lLnZpYSB8',
  'fCAnJykpKSArCiAgICAgIGtwaSgn4Liq4Li04LiX4LiY4Li04LmM4LiB4Liy4Lij4LmD4LiK4LmJ4LiH4Liy4LiZJywgZXNjKG1lLnJvbGUgfHwgJ+KAkycpLAogICAgICAgICAgbWUuY2FuRWRpdCA/ICfguYDguJ7guLTguYjguKEg4LmB4LiB4LmJ4LmE4LiCIOC5',
  'geC4peC4sOC4peC4muC4guC5ieC4reC4oeC4ueC4peC5hOC4lOC5iScgOiAn4LmA4Lib4Li04LiU4LiU4Li54LmE4LiU4LmJ4Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinJykgKwogICAgJzwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InJvdyI+JyArCiAg',
  'ICAgIChtZS51c2VybmFtZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImZvcm1DaGFuZ2VQYXNzd29yZCgpIj7wn5SRIOC5gOC4m+C4peC4teC5iOC4ouC4meC4o+C4q+C4seC4quC4nOC5iOC4suC4mTwvYnV0dG9uPicgOiAnJykgKwogICAgICAobWUu',
  'dXNlcm5hbWUgPyAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJmb3JtU2V0UGluKCkiPvCflKIgJyArCiAgICAgICAgKEFVVEguZGV2aWNlID8gJ+C4leC4seC5ieC4hyBQSU4g4LmD4Lir4Lih4LmI4Lia4LiZ4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li1',
  '4LmJJyA6ICfguJXguLHguYnguIcgUElOIOC4quC4s+C4q+C4o+C4seC4muC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5iScpICsgJzwvYnV0dG9uPicgOiAnJykgKwogICAgICAoQVVUSC5kZXZpY2UgPyAnPGJ1dHRvbiBjbGFzcz0iYnRuIGRnciIgb25jbGlj',
  'az0iZm9yZ2V0VGhpc0RldmljZSgpIj7guKXguJogUElOIOC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5iTwvYnV0dG9uPicgOiAnJykgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjb25maXJtTG9nb3V0KCkiPvCfmqog4Lit4Lit4LiB',
  '4LiI4Liy4LiB4Lij4Liw4Lia4LiaPC9idXR0b24+JyArCiAgICAnPC9kaXY+JyArCiAgICAoZGV2aWNlcy5sZW5ndGgKICAgICAgPyAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PjxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbWI4Ij7guK3guLjguJvguIHguKPguJPguYzg',
  'uJfguLXguYjguJXguLHguYnguIcgUElOIOC5hOC4p+C5iSAoJyArIGRldmljZXMubGVuZ3RoICsgJyk8L2Rpdj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDphdXRvIj48dGhlYWQ+PHRyPicgKwog',
  'ICAgICAgICc8dGg+4Lit4Li44Lib4LiB4Lij4LiT4LmMPC90aD48dGg+4LiV4Lix4LmJ4LiH4LmA4Lih4Li34LmI4LitPC90aD48dGg+4LmD4LiK4LmJ4Lil4LmI4Liy4Liq4Li44LiUPC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIGRldmljZXMu',
  'bWFwKGZ1bmN0aW9uKHgpewogICAgICAgICAgcmV0dXJuICc8dHI+PHRkPicgKyBlc2MoeC5kZXZpY2UpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyB0aERhdGVTaG9ydChTdHJpbmcoeC5jcmVhdGVkQXQpLnNsaWNlKDAsMTAp',
  'KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgdGhEYXRlU2hvcnQoU3RyaW5nKHgubGFzdFNlZW4pLnNsaWNlKDAsMTApKSArICc8L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9k',
  'aXY+JyArCiAgICAgICAgJzxkaXYgY2xhc3M9InJvdyBtdDEyIj48YnV0dG9uIGNsYXNzPSJidG4gZGdyIHNtIiBvbmNsaWNrPSJkb0ZvcmdldEFsbERldmljZXMoKSI+4Lii4LiB4LmA4Lil4Li04LiBIFBJTiDguJfguLjguIHguYDguITguKPguLfguYjguK3guIc8',
  'L2J1dHRvbj48L2Rpdj4nCiAgICAgIDogJycpKTsKfQoKZnVuY3Rpb24gZG9Gb3JnZXRBbGxEZXZpY2VzKCl7CiAgY29uZmlybUFjdGlvbign4Lii4LiB4LmA4Lil4Li04LiBIFBJTiDguJrguJnguJfguLjguIHguYDguITguKPguLfguYjguK3guIfguYPguIrguYjg',
  'uYTguKvguKEg4oCUIOC4l+C4uOC4geC5gOC4hOC4o+C4t+C5iOC4reC4h+C4iOC4sOC4leC5ieC4reC4h+C4peC5h+C4reC4geC4reC4tOC4meC4lOC5ieC4p+C4ouC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iCcsIGZ1bmN0aW9uKCl7CiAgICBj',
  'YWxsQXBpKCdhdXRoLmZvcmdldEFsbERldmljZXMnLCB7fSkudGhlbihmdW5jdGlvbihuKXsKICAgICAgc2F2ZURldmljZSgnJyk7CiAgICAgIHRvYXN0KCfguKLguIHguYDguKXguLTguIEgUElOIOC5geC4peC5ieC4pyAnICsgbiArICcg4LmA4LiE4Lij4Li34LmI',
  '4Lit4LiHJywgJ29rJyk7CiAgICAgIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2UgfHwgZSwgJ2VycicpOyB9KTsKICB9KTsKfQoKLyogLS0tLSDguJjguLXguKEgLS0tLSAqLwoKZnVuY3Rpb24g',
  'c2V0dGluZ3NUaGVtZUNhcmQoKXsKICB2YXIgY3VyID0gY3VycmVudFRoZW1lKCk7CiAgcmV0dXJuIGNhcmQoJ/Cfjqgg4LiY4Li14Lih4Liq4Li14Lir4LiZ4LmJ4Liy4LiI4LitJywKICAgICc8ZGl2IGNsYXNzPSJ0aGVtZS1waWNrIj4nICsgVEhFTUVTLm1hcChm',
  'dW5jdGlvbih0KXsKICAgICAgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJ0aGVtZS1vcHQnICsgKHQuaWQgPT09IGN1ciA/ICcgb24nIDogJycpICsgJyIgb25jbGljaz0ic2V0VGhlbWUoXCcnICsgdC5pZCArICdcJykiPicgKwogICAgICAgICc8c3BhbiBjbGFzcz0i',
  'aWMiPicgKyB0LmljICsgJzwvc3Bhbj4nICsKICAgICAgICAnPGI+JyArIGVzYyh0LmlkKSArICc8L2I+JyArCiAgICAgICAgJzxzcGFuIGNsYXNzPSJoaW50Ij4nICsgZXNjKHQuaGludCkgKyAnPC9zcGFuPicgKwogICAgICAnPC9idXR0b24+JzsKICAgIH0pLmpv',
  'aW4oJycpICsgJzwvZGl2PicgKwogICAgJzxwIGNsYXNzPSJmczEyIG11dGVkIG10MTIiPuC4mOC4teC4oeC4iOC4s+C5geC4ouC4geC4o+C4suC4ouC5gOC4hOC4o+C4t+C5iOC4reC4hyDguYDguJvguKXguLXguYjguKLguJnguJfguLXguYjguJnguLXguYjguKvg',
  'uKPguLfguK3guIHguJTguJvguLjguYjguKHguKPguLnguJvguJ7guKPguLDguK3guLLguJfguLTguJXguKLguYwv4Lie4Lij4Liw4LiI4Lix4LiZ4LiX4Lij4LmM4Lih4Li44Lih4LiC4Lin4Liy4Lia4LiZ4LiB4LmH4LmE4LiU4LmJJyArCiAgICAoUy5ib290ICYm',
  'IFMuYm9vdC5pc0FkbWluID8gJyDCtyDguITguYjguLLguJfguLXguYjguJzguLnguYnguJTguLnguYHguKXguYDguKXguLfguK3guIHguIjguLDguYDguJvguYfguJnguITguYjguLLguJXguLHguYnguIfguJXguYnguJnguYPguKvguYnguYDguITguKPguLfguYjg',
  'uK3guIfguJfguLXguYjguKLguLHguIfguYTguKHguYjguYDguITguKLguJXguLHguYnguIcnIDogJycpICsgJzwvcD4nKTsKfQoKLyogLS0tLSDguIHguKXguLjguYjguKHguITguYjguLLguJXguLHguYnguIfguITguYjguLIgLS0tLSAqLwoKZnVuY3Rpb24gc2V0',
  'dGluZ3NSZWFkT25seU5vdGUoKXsKICByZXR1cm4gY2FyZCgn4pqZ77iPIOC4geC4suC4o+C4leC4seC5ieC4h+C4hOC5iOC4suC4o+C4sOC4muC4micsCiAgICAnPGRpdiBjbGFzcz0iZW1wdHkiPjxkaXYgY2xhc3M9ImJpZyI+8J+UkjwvZGl2PuC5gOC4ieC4nuC4',
  'suC4sOC4nOC4ueC5ieC4lOC4ueC5geC4peC5gOC4l+C5iOC4suC4meC4seC5ieC4meC4l+C4teC5iOC5geC4geC5ieC4geC4suC4o+C4leC4seC5ieC4h+C4hOC5iOC4suC4o+C4sOC4muC4muC5hOC4lOC5iTwvZGl2PicpOwp9CgpmdW5jdGlvbiBzZXR0aW5nc0dy',
  'b3Vwc0h0bWwocyl7CiAgcmV0dXJuIHMuZ3JvdXBzLm1hcChmdW5jdGlvbihnKXsKICAgIHJldHVybiBjYXJkKGcuaWNvbiArICcgJyArIGcuZ3JvdXAsCiAgICAgICc8ZGl2IGNsYXNzPSJmZ3JpZCI+JyArIGcuaXRlbXMubWFwKHNldHRpbmdGaWVsZEh0bWwpLmpv',
  'aW4oJycpICsgJzwvZGl2PicpOwogIH0pLmpvaW4oJycpICsKICBjYXJkKCfwn5K+IOC4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C4leC4seC5ieC4h+C4hOC5iOC4sicsCiAgICAnPHAgY2xhc3M9ImZzMTMgbXV0ZWQiPicgKyBlc2Mocy5zZWNyZXROb3RlKSAr',
  'ICc8L3A+JyArCiAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0ic2F2ZVNldHRpbmdzRm9ybSgpIj7guJrguLHguJnguJfguLbguIHguJfguLHguYnguIfguKvguKHguJQ8L2J1dHRvbj4n',
  'ICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0ibG9hZCgpIj7guKLguIHguYDguKXguLTguIHguIHguLLguKPguYHguIHguYnguYTguII8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nKTsKfQoKZnVuY3Rpb24gc2V0dGluZ0ZpZWxkSHRtbChpdCl7',
  'CiAgdmFyIGlkID0gJ3NfJyArIGl0LmtleTsKICB2YXIgaW5uZXI7CiAgaWYgKGl0LnJlYWRPbmx5KSB7CiAgICBpbm5lciA9ICc8ZGl2IGNsYXNzPSJpbnAiIHN0eWxlPSJiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Y3Vyc29yOmRlZmF1bHQiPicgKyBlc2Mo',
  'aXQudmFsdWUpICsgJzwvZGl2Pic7CiAgfSBlbHNlIGlmIChpdC50eXBlID09PSAnc2VsZWN0JykgewogICAgLy8g4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4Liq4LmI4LiH4Lih4Liy4LmA4Lib4LmH4LiZIHt2YWx1ZSxsYWJl',
  'bH0g4LmA4Liq4Lih4LitIOKAlCDguITguYjguLLguJfguLXguYjguYDguIHguYfguJrguIHguLHguJrguILguYnguK3guITguKfguLLguKHguJfguLXguYjguYDguKvguYfguJnguK3guLLguIjguITguJnguKXguLDguK3guLHguJkKICAgIGlubmVyID0gJzxzZWxl',
  'Y3QgY2xhc3M9InNlbCIgaWQ9IicgKyBpZCArICciPicgKyAoaXQub3B0aW9ucyB8fCBbXSkubWFwKGZ1bmN0aW9uKG8pewogICAgICByZXR1cm4gJzxvcHRpb24gdmFsdWU9IicgKyBlc2Moby52YWx1ZSkgKyAnIicgKyAoby52YWx1ZSA9PT0gaXQudmFsdWUgPyAn',
  'IHNlbGVjdGVkJyA6ICcnKSArCiAgICAgICAgICAgICAnPicgKyBlc2Moby5sYWJlbCkgKyAnPC9vcHRpb24+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvc2VsZWN0Pic7CiAgfSBlbHNlIGlmIChpdC50eXBlID09PSAnbXVsdGlsaW5lJykgewogICAgaW5uZXIgPSAn',
  'PHRleHRhcmVhIGNsYXNzPSJ0YSIgaWQ9IicgKyBpZCArICciPicgKyBlc2MoaXQudmFsdWUpICsgJzwvdGV4dGFyZWE+JzsKICB9IGVsc2UgaWYgKGl0LnR5cGUgPT09ICdudW1iZXInKSB7CiAgICBpbm5lciA9ICc8aW5wdXQgdHlwZT0ibnVtYmVyIiBjbGFzcz0i',
  'aW5wIiBpZD0iJyArIGlkICsgJyIgdmFsdWU9IicgKyBlc2MoaXQudmFsdWUpICsgJyIgaW5wdXRtb2RlPSJkZWNpbWFsIicgKwogICAgICAoaXQubWluICE9IG51bGwgPyAnIG1pbj0iJyArIGVzYyhpdC5taW4pICsgJyInIDogJycpICsgKGl0Lm1heCAhPSBudWxs',
  'ID8gJyBtYXg9IicgKyBlc2MoaXQubWF4KSArICciJyA6ICcnKSArICc+JyArCiAgICAgIChpdC5taW4gIT0gbnVsbCAmJiBpdC5tYXggIT0gbnVsbCA/ICc8ZGl2IGNsYXNzPSJoaW50Ij7guYPguKrguYjguYTguJTguYkgJyArIGVzYyhpdC5taW4pICsgJ+KAkycg',
  'KyBlc2MoaXQubWF4KSArICc8L2Rpdj4nIDogJycpOwogIH0gZWxzZSB7CiAgICBpbm5lciA9ICc8aW5wdXQgdHlwZT0idGV4dCIgY2xhc3M9ImlucCIgaWQ9IicgKyBpZCArICciIHZhbHVlPSInICsgZXNjKGl0LnZhbHVlKSArICciPic7CiAgfQogIHJldHVybiAn',
  'PGRpdiBjbGFzcz0iZicgKyAoaXQudHlwZSA9PT0gJ211bHRpbGluZScgPyAnIGZ1bGwnIDogJycpICsgJyI+JyArCiAgICAnPGxhYmVsIGZvcj0iJyArIGlkICsgJyI+JyArIGVzYyhpdC5sYWJlbCkgKyAnPC9sYWJlbD4nICsgaW5uZXIgKwogICAgKGl0Lm5vdGUg',
  'PyAnPGRpdiBjbGFzcz0iaGludCI+JyArIGVzYyhpdC5ub3RlKSArICc8L2Rpdj4nIDogJycpICsgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIHNhdmVTZXR0aW5nc0Zvcm0oKXsKICB2YXIgdmFscyA9IHt9OwogIHZhciBkYXRhID0gUy5jYWNoZS5zZXR0aW5nczsKICBp',
  'ZiAoIWRhdGEpIHJldHVybjsKICBkYXRhLnNldHRpbmdzLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uKGcpewogICAgZy5pdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0KXsKICAgICAgaWYgKGl0LnJlYWRPbmx5KSByZXR1cm47CiAgICAgIHZhciBlbCA9IGRvY3VtZW50',
  'LmdldEVsZW1lbnRCeUlkKCdzXycgKyBpdC5rZXkpOwogICAgICBpZiAoZWwpIHZhbHNbaXQua2V5XSA9IGVsLnZhbHVlOwogICAgfSk7CiAgfSk7CiAgY2FsbEFwaSgnc2V0dGluZ3Muc2F2ZScsIHsgdmFsdWVzOiB2YWxzIH0pLnRoZW4oZnVuY3Rpb24ocil7CiAg',
  'ICBpZiAodmFscy50aGVtZSkgeyBsc1NldChMU19USEVNRSwgdmFscy50aGVtZSk7IGFwcGx5VGhlbWUodmFscy50aGVtZSk7IH0KICAgIHRvYXN0KHIuc2F2ZWQgPyAn4Lia4Lix4LiZ4LiX4Li24LiB4LmB4Lil4LmJ4LinICcgKyByLnNhdmVkICsgJyDguKPguLLg',
  'uKLguIHguLLguKMnIDogJ+C5hOC4oeC5iOC4oeC4teC4reC4sOC5hOC4o+C5gOC4m+C4peC4teC5iOC4ouC4meC5geC4m+C4peC4hycsICdvaycpOwogICAgLy8g4LiE4LmI4Liy4Lia4Liy4LiH4LiV4Lix4LinICjguKPguK3guJrguKPguLXguYDguJ/guKPguIog',
  '4LiK4Li34LmI4Lit4Lit4Liy4LiE4Liy4LijKSDguKHguLXguJzguKXguIHguLHguJrguJfguLHguYnguIfguKvguJnguYnguLIg4LiI4Li24LiH4LmC4Lir4Lil4LiU4LmD4Lir4Lih4LmI4LiX4Lix4LmJ4LiH4LiK4Li44LiUCiAgICByZXR1cm4gY2FsbEFwaSgn',
  'YXBwLmJvb3RzdHJhcCcpLnRoZW4oZnVuY3Rpb24oYil7IFMuYm9vdCA9IGI7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7IH0pOwp9CgovKiAtLS0tIOC4iOC4seC4',
  'lOC4geC4suC4o+C4nOC4ueC5ieC5g+C4iuC5iSAo4Lic4Li54LmJ4LiU4Li54LmB4Lil4LmA4LiX4LmI4Liy4LiZ4Lix4LmJ4LiZKSAtLS0tICovCgpmdW5jdGlvbiBpc0FkbWluTm93KCl7CiAgcmV0dXJuICEhKFMuYm9vdCAmJiBTLmJvb3QuaXNBZG1pbik7Cn0K',
  'CmZ1bmN0aW9uIHNldHRpbmdzVXNlcnNDYXJkKHVzZXJzKXsKICBpZiAoIXVzZXJzKSByZXR1cm4gJyc7CiAgcmV0dXJuIGNhcmQoJ/CfkaUg4Lic4Li54LmJ4LmD4LiK4LmJ4LmD4LiZ4Lij4Liw4Lia4LiaICgnICsgdXNlcnMubGVuZ3RoICsgJyknLAogICAgJzxw',
  'IGNsYXNzPSJmczEzIG11dGVkIj7guYHguIjguIHguIrguLfguYjguK3guJzguLnguYnguYPguIrguYnguYHguKXguLDguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguYnguITguJnguK3guLfguYjguJnguYDguILguYnguLLguKHguLLguJTguLnguKvguKPg',
  'uLfguK3guIrguYjguKfguKLguYHguIHguYnguILguYnguK3guKHguLnguKXguYTguJTguYkgJyArCiAgICAn4LiV4Lix4LmJ4LiH4Liq4Li04LiX4LiY4Li04LmM4LmB4Lii4LiB4Lij4Liy4Lii4LiE4LiZIOC5geC4peC4sOC4o+C4sOC4h+C4seC4muC5hOC4lOC5',
  'ieC4l+C4uOC4geC5gOC4oeC4t+C5iOC4rTwvcD4nICsKICAgICc8ZGl2IGNsYXNzPSJ0dyBtdDEyIj48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICc8dGg+4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJPC90aD48dGg+4LiK4Li34LmI',
  '4Lit4LiX4Li14LmI4LmB4Liq4LiU4LiHPC90aD48dGg+4Liq4Li04LiX4LiY4Li04LmMPC90aD48dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD48dGg+4LmA4LiC4LmJ4Liy4Lil4LmI4Liy4Liq4Li44LiUPC90aD4nICsKICAgICAgJzx0aCBjbGFzcz0ibnVtIj7guK3g',
  'uLjguJvguIHguKPguJPguYw8L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICB1c2Vycy5tYXAoZnVuY3Rpb24odSl7CiAgICAgIHZhciBtZU5vdyA9IChBVVRILm1lICYmIEFVVEgubWUudXNlcm5hbWUpID09PSB1LnVzZXJuYW1lOwogICAg',
  'ICByZXR1cm4gJzx0cj4nICsKICAgICAgICAnPHRkPjxiPicgKyBlc2ModS51c2VybmFtZSkgKyAnPC9iPicgKyAobWVOb3cgPyAnIDxzcGFuIGNsYXNzPSJiIGluZm8iPuC4hOC4uOC4kzwvc3Bhbj4nIDogJycpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZD4nICsg',
  'ZXNjKHUubmFtZSB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAnPHRkPicgKyByb2xlQmFkZ2UodS5yb2xlKSArICc8L3RkPicgKwogICAgICAgICc8dGQ+JyArIHN0YXR1c0JhZGdlKHUuc3RhdHVzKSArICh1LmxvY2tlZCA/ICcgPHNwYW4gY2xhc3M9ImIg',
  'ZGdyIj7guJbguLnguIHguKXguYfguK3guIHguIrguLHguYjguKfguITguKPguLLguKc8L3NwYW4+JyA6ICcnKSArICc8L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyAodS5sYXN0TG9naW4gPyB0aERhdGVTaG9ydChTdHJpbmcodS5sYXN0TG9n',
  'aW4pLnNsaWNlKDAsMTApKSA6ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArICh1LmRldmljZXMgfHwgMCkgKyAnPC90ZD4nICsKICAgICAgICAnPHRkIGNsYXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgJzxidXR0b24g',
  'Y2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZm9ybVVzZXIoJyArIGF0dHIodSkgKyAnKSI+4LmB4LiB4LmJ4LmE4LiCPC9idXR0b24+JyArCiAgICAgICAgICAobWVOb3cgPyAnJyA6ICc8YnV0dG9uIGNsYXNzPSJidG4gc20gZGdyIiBvbmNsaWNrPSJkZWxVc2VyKCcg',
  'KyBqc3EodS51c2VybmFtZSkgKyAnKSI+4Lil4LiaPC9idXR0b24+JykgKwogICAgICAgICc8L3RkPjwvdHI+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgc20iIG9uY2xpY2s9',
  'ImZvcm1Vc2VyKCkiPisg4LmA4Lie4Li04LmI4Lih4Lic4Li54LmJ4LmD4LiK4LmJPC9idXR0b24+Jyk7Cn0KCmZ1bmN0aW9uIHJvbGVCYWRnZShyb2xlKXsKICB2YXIgY2xzID0gcm9sZSA9PT0gJ+C4nOC4ueC5ieC4lOC4ueC5geC4pScgPyAnb2snIDogKHJvbGUg',
  'PT09ICfguYHguIHguYnguYTguILguYTguJTguYknID8gJ2luZm8nIDogJ211dGUnKTsKICByZXR1cm4gJzxzcGFuIGNsYXNzPSJiICcgKyBjbHMgKyAnIj4nICsgZXNjKHJvbGUpICsgJzwvc3Bhbj4nOwp9CgovLyDguKvguKHguLLguKLguYDguKvguJXguLg6IOC5',
  'g+C4iuC5iSBhdHRyKCkg4LiV4Lix4Lin4LmA4LiU4Li14Lii4Lin4LiB4Lix4Lia4LiX4Li14LmIIFZpZXdzLmh0bWwg4Lib4Lij4Liw4LiB4Liy4Lio4LmE4Lin4LmJCi8vIOC5gOC4hOC4ouC4m+C4o+C4sOC4geC4suC4qOC4iuC4t+C5iOC4reC4i+C5ieC4s+C5',
  'hOC4p+C5ieC4leC4o+C4h+C4meC4teC5ieC4hOC4o+C4seC5ieC4h+C4q+C4meC4tuC5iOC4hyDguYHguKXguYnguKfguYTguJvguJfguLHguJrguILguK3guIfguYDguJTguLTguKHguIjguJnguJvguLjguYjguKHguYHguIHguYnguYTguILguJfguLHguYnguIfg',
  'uKPguLDguJrguJrguJ7guLHguIcKLy8gKOC4n+C4reC4o+C5jOC4oeC4guC4tuC5ieC4meC4p+C5iOC4suC4hyDguYHguKXguLDguIHguJTguJrguLHguJnguJfguLbguIHguIHguKXguLLguKLguYDguJvguYfguJnguKrguKPguYnguLLguIfguKPguLLguKLguIHg',
  'uLLguKPguYPguKvguKHguYjguYHguJfguJnguIHguLLguKPguYHguIHguYnguILguK3guIfguYDguJTguLTguKEpCgpmdW5jdGlvbiBmb3JtVXNlcihqc29uKXsKICB2YXIgdSA9IGpzb24gPyAodHlwZW9mIGpzb24gPT09ICdzdHJpbmcnID8gSlNPTi5wYXJzZShq',
  'c29uKSA6IGpzb24pIDoge307CiAgdmFyIGlzTmV3ID0gIXUudXNlcm5hbWU7CgogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiBpc05ldyA/ICfguYDguJ7guLTguYjguKHguJzguLnguYnguYPguIrguYnguYPguKvguKHguYgnIDogJ+C5geC4geC5ieC5hOC4guC4nOC4',
  'ueC5ieC5g+C4iuC5iSAnICsgdS51c2VybmFtZSwKICAgIGFjdGlvbjogJ3VzZXIuc2F2ZScsCiAgICByZWNvcmQ6IE9iamVjdC5hc3NpZ24oeyBpZDogaXNOZXcgPyAnJyA6IHUudXNlcm5hbWUsIHJvbGU6ICfguJTguLnguK3guKLguYjguLLguIfguYDguJTguLXg',
  'uKLguKcnLCBzdGF0dXM6ICfguYPguIrguYnguIfguLLguJknIH0sIHUpLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oid1c2VybmFtZScsIGxhYmVsOifguIrguLfguYjguK3guJzguLnguYnguYPguIrguYkgKOC4oOC4suC4qeC4suC4reC4seC4h+C4geC4pOC4',
  'qSknLCByZXF1aXJlZDppc05ldywgcGg6J+C5gOC4iuC5iOC4mSBzb21jaGFpJywKICAgICAgICBoaW50OiBpc05ldyA/ICdhLXogMC05IC4gXyAtIOC4ouC4suC4pyAz4oCTMjQg4LiV4Lix4LinIMK3IOC5gOC4m+C4peC4teC5iOC4ouC4meC4oOC4suC4ouC4q+C4',
  'peC4seC4h+C5hOC4oeC5iOC5hOC4lOC5iScgOiAn4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmE4Lih4LmI4LmE4LiU4LmJJyB9LAogICAgICB7IGtleTonbmFtZScsIGxhYmVsOifguIrguLfguYjguK3guJfguLXg',
  'uYjguYHguKrguJTguIcnLCByZXF1aXJlZDp0cnVlLCBwaDon4LmA4LiK4LmI4LiZIOC4quC4oeC4iuC4suC4oicgfSwKICAgICAgeyBrZXk6J3JvbGUnLCBsYWJlbDon4Liq4Li04LiX4LiY4Li04LmM4LiB4Liy4Lij4LmD4LiK4LmJ4LiH4Liy4LiZJywgdHlwZTon',
  'c2VsZWN0JywgYmxhbms6ZmFsc2UsIHJlcXVpcmVkOnRydWUsCiAgICAgICAgb3B0aW9uczpbJ+C4lOC4ueC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pycsJ+C5geC4geC5ieC5hOC4guC5hOC4lOC5iScsJ+C4nOC4ueC5ieC4lOC4ueC5geC4pSddLAogICAg',
  'ICAgIGhpbnQ6J+C4lOC4ueC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pyA9IOC5gOC4m+C4tOC4lOC4lOC4ueC5hOC4lOC5ieC4l+C4uOC4geC4q+C4meC5ieC4siDCtyDguYHguIHguYnguYTguILguYTguJTguYkgPSDguYDguJ7guLTguYjguKEv4LmB4LiB',
  '4LmJL+C4peC4muC4guC5ieC4reC4oeC4ueC4pSDCtyDguJzguLnguYnguJTguLnguYHguKUgPSDguIjguLHguJTguIHguLLguKPguJzguLnguYnguYPguIrguYnguYHguKXguLDguIHguLLguKPguJXguLHguYnguIfguITguYjguLLguYTguJTguYnguJTguYnguKfg',
  'uKInIH0sCiAgICAgIHsga2V5OidwYXNzd29yZCcsIGxhYmVsOiBpc05ldyA/ICfguKPguKvguLHguKrguJzguYjguLLguJnguYDguKPguLTguYjguKHguJXguYnguJknIDogJ+C4leC4seC5ieC4h+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iCAo',
  '4LmA4Lin4LmJ4LiZ4Lin4LmI4Liy4LiHID0g4LmE4Lih4LmI4LmA4Lib4Lil4Li14LmI4Lii4LiZKScsCiAgICAgICAgcmVxdWlyZWQ6aXNOZXcsIHBoOifguK3guKLguYjguLLguIfguJnguYnguK3guKIgOCDguJXguLHguKfguK3guLHguIHguKnguKMnLAogICAg',
  'ICAgIGhpbnQ6J+C4iOC4lOC5hOC4p+C5ieC4quC5iOC4h+C5g+C4q+C5ieC5gOC4iOC5ieC4suC4leC4seC4pyDigJQg4Lij4Liw4Lia4Lia4LmA4LiB4LmH4Lia4LmB4Lia4Lia4LmA4LiC4LmJ4Liy4Lij4Lir4Lix4LiqIOC5gOC4m+C4tOC4lOC4lOC4ueC4ouC5',
  'ieC4reC4meC4q+C4peC4seC4h+C5hOC4oeC5iOC5hOC4lOC5iScgfSwKICAgICAgeyBrZXk6J211c3RDaGFuZ2UnLCBsYWJlbDon4LmD4Lir4LmJ4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LiV4Lit4LiZ4LmA4LiC4LmJ4Liy',
  '4LiE4Lij4Lix4LmJ4LiH4LmB4Lij4LiBJywgdHlwZTonc2VsZWN0JywgYmxhbms6ZmFsc2UsCiAgICAgICAgb3B0aW9uczpbe3ZhbHVlOid0cnVlJyxsYWJlbDon4LmD4LiK4LmIICjguYHguJnguLDguJnguLMpJ30se3ZhbHVlOidmYWxzZScsbGFiZWw6J+C5hOC4',
  'oeC5iOC4leC5ieC4reC4hyd9XSB9LAogICAgICB7IGtleTonc3RhdHVzJywgbGFiZWw6J+C4quC4luC4suC4meC4sCcsIHR5cGU6J3NlbGVjdCcsIGJsYW5rOmZhbHNlLCBvcHRpb25zOlsn4LmD4LiK4LmJ4LiH4Liy4LiZJywn4Lij4Liw4LiH4Lix4LiaJ10sCiAg',
  'ICAgICAgaGludDon4Lij4Liw4LiH4Lix4LiaID0g4LmA4LiC4LmJ4Liy4Lij4Liw4Lia4Lia4LmE4Lih4LmI4LmE4LiU4LmJ4LiX4Lix4LiZ4LiX4Li1IOC5geC4leC5iOC4ouC4seC4h+C5gOC4geC5h+C4muC4muC4seC4jeC4iuC4teC5hOC4p+C5iScgfSwKICAg',
  'ICAgeyBrZXk6J25vdGUnLCBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXSwKICAgIHdpZGU6IHRydWUKICB9KTsKCiAgLy8g4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmA4Lib',
  '4Lil4Li14LmI4Lii4LiZ4LmE4Lih4LmI4LmE4LiU4LmJIOC4peC5h+C4reC4geC4iuC5iOC4reC4h+C5hOC4p+C5ieC5gOC4peC4ouC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC5gOC4guC5ieC4suC5g+C4iOC4nOC4tOC4lAogIGlmICghaXNOZXcpIHsKICAgIHZh',
  'ciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX3VzZXJuYW1lJyk7CiAgICBpZiAoZWwpIHsgZWwucmVhZE9ubHkgPSB0cnVlOyBlbC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3ZhcigtLXN1cmZhY2UtMiknOyB9CiAgfQp9CgpmdW5jdGlvbiBkZWxVc2VyKHVz',
  'ZXJuYW1lKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguJzguLnguYnguYPguIrguYkgIicgKyB1c2VybmFtZSArICciIOC5g+C4iuC5iOC5hOC4q+C4oSDigJQg4LmA4LiC4LmJ4Liy4Lij4Liw4Lia4Lia4LmE4Lih4LmI4LmE4LiU4LmJ4Lit4Li14LiB4LiX4Lix',
  '4LiZ4LiX4Li1JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ3VzZXIuZGVsZXRlJywgeyB1c2VybmFtZTogdXNlcm5hbWUgfSkudGhlbihmdW5jdGlvbigpewogICAgICB0b2FzdCgn4Lil4Lia4Lic4Li54LmJ4LmD4LiK4LmJ4LmB4Lil4LmJ4LinJywgJ29rJyk7',
  'CiAgICAgIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2UgfHwgZSwgJ2VycicpOyB9KTsKICB9KTsKfQoKLyogLS0tLSDguKXguLTguIfguIHguYzguYDguILguYnguLLguYPguIrguYnguIfguLLg',
  'uJkgLS0tLSAqLwoKZnVuY3Rpb24gc2V0dGluZ3NTaGFyZUNhcmQobGlua3MpewogIGlmICghbGlua3MgfHwgIWxpbmtzLmFwcFVybCkgewogICAgcmV0dXJuIGNhcmQoJ/CflJcg4Lil4Li04LiH4LiB4LmM4LmA4LiC4LmJ4Liy4LmD4LiK4LmJ4LiH4Liy4LiZJywK',
  'ICAgICAgJzxkaXYgY2xhc3M9ImVtcHR5Ij7guKLguLHguIfguKvguLLguKXguLTguIfguIHguYzguIjguKPguLTguIfguYTguKHguYjguYDguIjguK0g4oCUIOC5gOC4m+C4tOC4lOC5gOC4p+C5h+C4muC5geC4reC4m+C4iOC4suC4geC4peC4tOC4h+C4geC5jOC4',
  'l+C4teC5iOC4peC4h+C4l+C5ieC4suC4oiAvZXhlYyDguKrguLHguIHguITguKPguLHguYnguIcg4LmB4Lil4LmJ4Lin4Lij4Liw4Lia4Lia4LiI4Liw4LiI4Liz4LmD4Lir4LmJ4LmA4Lit4LiHPC9kaXY+Jyk7CiAgfQogIHJldHVybiBjYXJkKCfwn5SXIOC4peC4',
  'tOC4h+C4geC5jOC5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4mScsCiAgICAnPGRpdiBjbGFzcz0iZiBtYjEyIj48bGFiZWw+4Lil4Li04LiH4LiB4LmM4Lir4Lil4Lix4LiBIOKAlCDguKrguYjguIfguYPguKvguYnguJfguLjguIHguITguJnguYTguJTguYkg',
  'KOC5gOC4guC5ieC4suC4lOC5ieC4p+C4ouC4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5ieC5geC4peC4sOC4o+C4q+C4seC4quC4nOC5iOC4suC4mSk8L2xhYmVsPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJhcHBVcmwiIHJlYWRvbmx5IHZh',
  'bHVlPSInICsgZXNjKGxpbmtzLmFwcFVybCkgKyAnIiBvbmNsaWNrPSJ0aGlzLnNlbGVjdCgpIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJjb3B5RmllbGQoXCdh',
  'cHBVcmxcJykiPvCfk4sg4LiE4Lix4LiU4Lil4Lit4LiB4Lil4Li04LiH4LiB4LmM4Lir4Lil4Lix4LiBPC9idXR0b24+JyArCiAgICAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImYgbWIxMiI+PGxhYmVs',
  'PvCfkYAg4Lil4Li04LiH4LiB4LmM4LiU4Li54Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4Lin4LmB4Lia4Lia4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4Lil4LmH4Lit4LiB4Lit4Li04LiZPC9sYWJlbD4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0i',
  'c2hhcmVVcmwiIHJlYWRvbmx5IHZhbHVlPSInICsgZXNjKGxpbmtzLnZpZXdVcmwpICsgJyIgb25jbGljaz0idGhpcy5zZWxlY3QoKSI+PC9kaXY+JyArCiAgICAnPHAgY2xhc3M9ImZzMTIgJyArIChsaW5rcy5zaGFyZUVuYWJsZWQgPyAnbXV0ZWQnIDogJ3dhcm4t',
  'dGV4dCcpICsgJyI+JyArCiAgICAgIChsaW5rcy5zaGFyZUVuYWJsZWQKICAgICAgICA/ICfguYDguJvguLTguJTguK3guKLguLnguYgg4oCUIOC5g+C4hOC4o+C4geC5h+C4leC4suC4oeC4l+C4teC5iOC4oeC4teC4peC4tOC4h+C4geC5jOC4meC4teC5ieC5gOC4',
  'm+C4tOC4lOC4lOC4ueC4guC5ieC4reC4oeC4ueC4peC5hOC4lOC5ieC5guC4lOC4ouC5hOC4oeC5iOC4leC5ieC4reC4h+C4peC5h+C4reC4geC4reC4tOC4mScKICAgICAgICA6ICfimqDvuI8g4Lib4Li04LiU4Lit4Lii4Li54LmIIOKAlCDguKXguLTguIfguIHg',
  'uYzguJnguLXguYnguKLguLHguIfguYPguIrguYnguYTguKHguYjguYTguJTguYkg4LmA4Lib4Li04LiU4Liq4Lin4Li04LiV4LiK4LmM4LmE4LiU4LmJ4LiX4Li14LmI4Lir4Lix4Lin4LiC4LmJ4LitICLguITguKfguLLguKHguJvguKXguK3guJTguKDguLHguKLg',
  'uYHguKXguLDguIHguLLguKPguYDguILguYnguLLguYPguIrguYnguIfguLLguJkiIOC4lOC5ieC4suC4meC4muC4mScpICsKICAgICc8L3A+JyArCiAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNr',
  'PSJjb3B5RmllbGQoXCdzaGFyZVVybFwnKSI+8J+TiyDguITguLHguJTguKXguK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYw8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBkZ3IiIG9uY2xpY2s9ImRvUm90YXRlU2hhcmUoKSI+8J+U',
  'gSDguK3guK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYzguYPguKvguKHguYg8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+JyArCiAgICAnPHAgY2xhc3M9ImZzMTIgbXV0ZWQiPvCfhpgg4Lil4Li04LiH',
  '4LiB4LmM4LiB4Li54LmJ4Lij4Liw4Lia4LiaICjguYPguIrguYnguJXguK3guJnguKXguLfguKHguKPguKvguLHguKrguJzguYjguLLguJnguIjguJnguYDguILguYnguLLguYTguKHguYjguYTguJTguYkg4oCUIOC4q+C5ieC4suC4oeC4quC5iOC4h+C4leC5iOC4',
  'rSk8YnI+JyArCiAgICAnPGNvZGUgY2xhc3M9ImZzMTIiPicgKyBlc2MobGlua3MuYWRtaW5VcmwpICsgJzwvY29kZT48L3A+Jyk7Cn0KCmZ1bmN0aW9uIGNvcHlGaWVsZChpZCl7CiAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpOwogIGlmICgh',
  'ZWwpIHJldHVybjsKICBlbC5zZWxlY3QoKTsKICB0cnkgeyBkb2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpOyB0b2FzdCgn4LiE4Lix4LiU4Lil4Lit4LiB4LmB4Lil4LmJ4LinJywgJ29rJyk7IH0KICBjYXRjaCAoZSkgeyB0b2FzdCgn4LiB4LiU4LiE4LmJ4Liy',
  '4LiH4LiX4Li14LmI4LiK4LmI4Lit4LiH4LmB4Lil4LmJ4Lin4LmA4Lil4Li34Lit4LiBIOC4hOC4seC4lOC4peC4reC4gScsICdlcnInKTsgfQp9Cjwvc2NyaXB0Pgo8c2NyaXB0PgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT0KICAgRm9ybXMuaHRtbCDigJQg4Lif4Lit4Lij4LmM4Lih4LmA4Lie4Li04LmI4LihL+C5geC4geC5ieC5hOC4giDguYHguKXguLDguIHguLLguKPguKXguJoKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09ICovCgp2YXIgRk9STSA9IHsKICBzcGVjczogW10sICAgICAgIC8vIOC4nOC4seC4h+C4iuC5iOC4reC4h+C4geC4o+C4reC4geC4guC4reC4h+C4n+C4reC4o+C5jOC4oeC4l+C4teC5iOC5gOC4m+C4tOC4lOC4reC4ouC4ueC5iAogIGtl',
  'ZXA6IHt9LCAgICAgICAgLy8g4LmE4Lif4Lil4LmM4LmB4LiZ4Lia4LmA4LiU4Li04Lih4LiX4Li14LmI4Lii4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJ4LmA4Lit4Liy4Lit4Lit4LiBCiAgYnVja2V0OiAnbWlzYycsICAvLyDguYLguJ/guKXguYDguJTguK3guKPg',
  'uYzguJfguLXguYjguIjguLDguYDguIHguYfguJrguYTguJ/guKXguYzguYHguJnguJrguYPguKvguKHguYgKICBvY3I6IG51bGwsICAgICAgIC8vIOC4nOC4seC4h+C4geC4suC4o+C5gOC4leC4tOC4oeC4hOC5iOC4suC4iOC4suC4geC4o+C4ueC4mwogIHJlYzog',
  'bnVsbCwgICAgICAgLy8g4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4LiB4Liz4Lil4Lix4LiH4LmB4LiB4LmJ4Lit4Lii4Li54LmIIChudWxsID0g4LiB4Liz4Lil4Lix4LiH4LmA4Lie4Li04LmI4Lih4Lij4Liy4Lii4LiB4Liy4Lij4LmD4Lir4Lih4LmIKQog',
  'IGxpbmVzOiBbXSwgICAgICAgLy8g4Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4Lii4LmD4LiZ4Lia4Li04LilICjguYPguIrguYnguIHguLHguJrguIrguYjguK3guIfguIrguJnguLTguJQgbGluZXMpCiAgdG9kbzogW10sICAgICAgICAvLyDguYDguIrguYfg',
  'uITguKXguLTguKrguJXguYzguIfguLLguJnguIvguYjguK3guKEgKOC5g+C4iuC5ieC4geC4seC4muC4iuC5iOC4reC4h+C4iuC4meC4tOC4lCB0b2RvKQogIHRvZG9PcHRpb25zOiBbXSAgLy8g4LiV4Lix4Lin4LmA4Lil4Li34Lit4LiB4Lib4Lij4Liw4LmA4Lig',
  '4LiX4LiH4Liy4LiZ4LiC4Lit4LiH4LmB4LiV4LmI4Lil4Liw4LiC4LmJ4LitCn07CgovKiAtLS0tLS0tLS0tLS0tLS0tIGZvcm0gZW5naW5lIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIGZpZWxkc0h0bWwoc3BlY3MsIHJlYyl7CiAgcmVjID0gcmVjIHx8',
  'IHt9OwogIEZPUk0uc3BlY3MgPSBzcGVjczsKICBGT1JNLmtlZXAgPSB7fTsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImZncmlkIj4nICsgc3BlY3MubWFwKGZ1bmN0aW9uKGYpewogICAgdmFyIHYgPSByZWNbZi5rZXldOwogICAgdmFyIGlkID0gJ2ZfJyArIGYua2V5',
  'OwogICAgdmFyIGlubmVyOwoKICAgIGlmIChmLnR5cGUgPT09ICdzZWxlY3QnKSB7CiAgICAgIHZhciBvcHRzID0gKGYub3B0aW9ucyB8fCBbXSkubWFwKGZ1bmN0aW9uKG8pewogICAgICAgIHZhciB2YWwgPSB0eXBlb2YgbyA9PT0gJ29iamVjdCcgPyBvLnZhbHVl',
  'IDogbzsKICAgICAgICB2YXIgbGFiID0gdHlwZW9mIG8gPT09ICdvYmplY3QnID8gby5sYWJlbCA6IG87CiAgICAgICAgcmV0dXJuICc8b3B0aW9uIHZhbHVlPSInICsgZXNjKHZhbCkgKyAnIicgKyAoU3RyaW5nKHYpID09PSBTdHJpbmcodmFsKSA/ICcgc2VsZWN0',
  'ZWQnIDogJycpICsgJz4nICsgZXNjKGxhYikgKyAnPC9vcHRpb24+JzsKICAgICAgfSkuam9pbignJyk7CiAgICAgIGlubmVyID0gJzxzZWxlY3QgY2xhc3M9InNlbCIgaWQ9IicgKyBpZCArICciPicgKyAoZi5ibGFuayAhPT0gZmFsc2UgPyAnPG9wdGlvbiB2YWx1',
  'ZT0iIj7igJQg4LmA4Lil4Li34Lit4LiBIOKAlDwvb3B0aW9uPicgOiAnJykgKyBvcHRzICsgJzwvc2VsZWN0Pic7CgogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICd0ZXh0YXJlYScpIHsKICAgICAgaW5uZXIgPSAnPHRleHRhcmVhIGNsYXNzPSJ0YSIgaWQ9Iicg',
  'KyBpZCArICciIHBsYWNlaG9sZGVyPSInICsgZXNjKGYucGh8fCcnKSArICciPicgKyBlc2Modnx8JycpICsgJzwvdGV4dGFyZWE+JzsKCiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ2ZpbGVzJykgewogICAgICBGT1JNLmtlZXBbZi5rZXldID0gKHJlY1tmLmtl',
  'eV0gJiYgcmVjW2Yua2V5XS5sZW5ndGgpID8gW10uY29uY2F0KHJlY1tmLmtleV0pIDogW107CiAgICAgIGlubmVyID0KICAgICAgICAnPGRpdiBpZD0iJyArIGlkICsgJ19leGlzdGluZyI+JyArIGV4aXN0aW5nRmlsZXNIdG1sKGYua2V5KSArICc8L2Rpdj4nICsK',
  'ICAgICAgICAnPGxhYmVsIGNsYXNzPSJmaWxlLWRyb3AiIGZvcj0iJyArIGlkICsgJyI+8J+TjiDguYHguJXguLDguYDguJ7guLfguYjguK3guYDguKXguLfguK3guIHguYTguJ/guKXguYwgKOC5gOC4peC4t+C4reC4geC5hOC4lOC5ieC4q+C4peC4suC4ouC5hOC4',
  'n+C4peC5jCDCtyDguYTguKHguYjguYDguIHguLTguJkgMTIgTUIg4LiV4LmI4Lit4LmE4Lif4Lil4LmMKScgKwogICAgICAgICc8aW5wdXQgdHlwZT0iZmlsZSIgaWQ9IicgKyBpZCArICciIG11bHRpcGxlIGFjY2VwdD0iaW1hZ2UvKixhcHBsaWNhdGlvbi9wZGYi',
  'IHN0eWxlPSJkaXNwbGF5Om5vbmUiICcgKwogICAgICAgICdvbmNoYW5nZT0icHJldmlld1BpY2tlZCh0aGlzLFwnJyArIGlkICsgJ1wnKSI+PC9sYWJlbD4nICsKICAgICAgICAnPGRpdiBpZD0iJyArIGlkICsgJ19wcmV2aWV3IiBjbGFzcz0idGh1bWJzIG10OCI+',
  'PC9kaXY+JyArCiAgICAgICAgJzxkaXYgaWQ9IicgKyBpZCArICdfb2NyIj48L2Rpdj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAndG9kbycpIHsKICAgICAgRk9STS50b2RvID0gcGFyc2VUb2RvVGV4dCh2KTsKICAgICAgRk9STS50b2RvT3B0aW9ucyA9',
  'IGYub3B0aW9ucyB8fCBbXTsKICAgICAgaW5uZXIgPSAnPGRpdiBpZD0iJyArIGlkICsgJyIgY2xhc3M9InRvZG8iPicgKyB0b2RvVGFibGVIdG1sKCkgKyAnPC9kaXY+JzsKCiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ2xpbmVzJykgewogICAgICBGT1JNLmxp',
  'bmVzID0gcGFyc2VMaW5lc1RleHQodik7CiAgICAgIGlubmVyID0gJzxkaXYgaWQ9IicgKyBpZCArICciIGNsYXNzPSJsaW5lcyI+JyArIGxpbmVzVGFibGVIdG1sKCkgKyAnPC9kaXY+JzsKCiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ2NvbXB1dGVkJykgewog',
  'ICAgICBpbm5lciA9ICc8ZGl2IGNsYXNzPSJpbnAiIGlkPSInICsgaWQgKyAnIiBzdHlsZT0iYmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpO2ZvbnQtd2VpZ2h0OjYwMDsnICsKICAgICAgICAgICAgICAnZm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1z',
  'O2N1cnNvcjpkZWZhdWx0Ij4wPC9kaXY+JzsKCiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ2RhdGUnKSB7CiAgICAgIGlubmVyID0gJzxpbnB1dCB0eXBlPSJkYXRlIiBjbGFzcz0iaW5wIiBpZD0iJyArIGlkICsgJyIgdmFsdWU9IicgKyBlc2ModiB8fCAnJykg',
  'KyAnIj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnbnVtYmVyJyB8fCBmLnR5cGUgPT09ICdtb25leScpIHsKICAgICAgaW5uZXIgPSAnPGlucHV0IHR5cGU9Im51bWJlciIgc3RlcD0iJyArIChmLnR5cGUgPT09ICdtb25leScgPyAnMC4wMScgOiAnMScp',
  'ICsgJyIgY2xhc3M9ImlucCIgaWQ9IicgKyBpZCArICciICcgKwogICAgICAgICAgICAgICd2YWx1ZT0iJyArICh2ID09IG51bGwgfHwgdiA9PT0gJycgPyAnJyA6IGVzYyh2KSkgKyAnIiBwbGFjZWhvbGRlcj0iJyArIGVzYyhmLnBofHwnJykgKyAnIiBpbnB1dG1v',
  'ZGU9ImRlY2ltYWwiJyArCiAgICAgICAgICAgICAgKGYuc3VtcyA/ICcgb25pbnB1dD0icmVjYWxjU3VtcygpIicgOiAoZi5vbmlucHV0ID8gJyBvbmlucHV0PSInICsgZXNjKGYub25pbnB1dCkgKyAnIicgOiAnJykpICsgJz4nOwoKICAgIH0gZWxzZSB7CiAgICAg',
  'IGlubmVyID0gJzxpbnB1dCB0eXBlPSJ0ZXh0IiBjbGFzcz0iaW5wIiBpZD0iJyArIGlkICsgJyIgdmFsdWU9IicgKyBlc2ModiB8fCAnJykgKyAnIiBwbGFjZWhvbGRlcj0iJyArIGVzYyhmLnBofHwnJykgKyAnIj4nOwogICAgfQoKICAgIHJldHVybiAnPGRpdiBj',
  'bGFzcz0iZicgKyAoZi5mdWxsID8gJyBmdWxsJyA6ICcnKSArICciPicgKwogICAgICAnPGxhYmVsIGZvcj0iJyArIGlkICsgJyI+JyArIGVzYyhmLmxhYmVsKSArIChmLnJlcXVpcmVkID8gJyA8c3BhbiBzdHlsZT0iY29sb3I6dmFyKC0tZGFuZ2VyKSI+Kjwvc3Bh',
  'bj4nIDogJycpICsgJzwvbGFiZWw+JyArCiAgICAgIGlubmVyICsgKGYuaGludCA/ICc8ZGl2IGNsYXNzPSJoaW50Ij4nICsKICAgICAgICAoZi5oaW50LmNoYXJBdCgwKSA9PT0gJzwnID8gZi5oaW50IDogZXNjKGYuaGludCkpICsgJzwvZGl2PicgOiAnJykgKyAn',
  'PC9kaXY+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4LmA4LiK4LmH4LiE4Lil4Li04Liq4LiV4LmM4LiH4Liy4LiZ4LiL4LmI4Lit',
  '4LihIOKAlCDguYDguILguYnguLLguIvguYjguK3guKHguITguKPguLHguYnguIfguYDguJTguLXguKLguKfguKHguLHguIHguIvguYjguK3guKHguKvguKXguLLguKLguIjguLjguJQKCiAgIOC5gOC4geC5h+C4muC4peC4h+C4iuC4teC4leC4muC4o+C4o+C4l+C4',
  'seC4lOC4peC4sOC4h+C4suC4mSAgW3hdIOC4iuC4t+C5iOC4reC4h+C4suC4mSB8IOC4m+C4o+C4sOC5gOC4oOC4l+C4h+C4suC4mQogICAo4Lij4Li54Lib4LmB4Lia4Lia4LmA4LiU4Li14Lii4Lin4LiB4Lix4LiaIHBhcnNlVG9kb18g4Lid4Lix4LmI4LiH4LmA',
  '4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmMIOKAlCDguYHguIHguYnguJfguLXguYjguYTguKvguJnguJXguYnguK3guIfguYHguIHguYnguYPguKvguYnguJXguKPguIfguIHguLHguJkpCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKZnVuY3Rpb24gcGFyc2VUb2RvVGV4dCh0ZXh0KXsKICB2YXIgcmF3ID0gU3RyaW5nKHRleHQgPT0gbnVsbCA/ICcnIDogdGV4dCk7CiAgaWYgKCFyYXcudHJpbSgpKSByZXR1cm4gW107CiAgdmFyIGxpbmVzID0g',
  'cmF3LnNwbGl0KC9ccj9cbi8pLm1hcChmdW5jdGlvbihsKXsgcmV0dXJuIGwudHJpbSgpOyB9KS5maWx0ZXIoQm9vbGVhbik7CgogIC8vIOC4guC4reC4h+C5gOC4lOC4tOC4oeC5gOC4guC4teC4ouC4meC4o+C4p+C4oeC4muC4o+C4o+C4l+C4seC4lOC5gOC4lOC4',
  'teC4ouC4p+C4p+C5iOC4siAiMS7guKLguLLguYHguJnguKcgMi7guYDguIHguYfguJrguKrguLXguKvguYnguK3guIciCiAgaWYgKGxpbmVzLmxlbmd0aCA9PT0gMSAmJiAvXGRccypbLildLy50ZXN0KGxpbmVzWzBdKSAmJiBsaW5lc1swXS5jaGFyQXQoMCkgIT09',
  'ICdbJykgewogICAgbGluZXMgPSBsaW5lc1swXS5zcGxpdCgvXHMqXGQrXHMqWy4pXVxzKi8pLm1hcChmdW5jdGlvbih4KXsgcmV0dXJuIHgudHJpbSgpOyB9KS5maWx0ZXIoQm9vbGVhbik7CiAgfQoKICByZXR1cm4gbGluZXMubWFwKGZ1bmN0aW9uKGxpbmUpewog',
  'ICAgdmFyIGRvbmUgPSBmYWxzZTsKICAgIHZhciBtID0gbGluZS5tYXRjaCgvXlxbXHMqKFt4WOKck10pP1xzKlxdXHMqKC4qKSQvKTsKICAgIGlmIChtKSB7IGRvbmUgPSAhIW1bMV07IGxpbmUgPSBtWzJdOyB9CiAgICBsaW5lID0gbGluZS5yZXBsYWNlKC9eXGQr',
  'XHMqWy4pXVxzKi8sICcnKS50cmltKCk7CiAgICB2YXIgYSA9IGxpbmUuc3BsaXQoJ3wnKTsKICAgIHJldHVybiB7IGRvbmU6IGRvbmUsIG5hbWU6IChhWzBdIHx8ICcnKS50cmltKCksIGNhdGVnb3J5OiAoYVsxXSB8fCAnJykudHJpbSgpIH07CiAgfSkuZmlsdGVy',
  'KGZ1bmN0aW9uKHQpeyByZXR1cm4gdC5uYW1lOyB9KTsKfQoKZnVuY3Rpb24gZm9ybWF0VG9kb1RleHQobGlzdCl7CiAgcmV0dXJuIChsaXN0IHx8IFtdKQogICAgLmZpbHRlcihmdW5jdGlvbih0KXsgcmV0dXJuIFN0cmluZyh0Lm5hbWUgfHwgJycpLnRyaW0oKTsg',
  'fSkKICAgIC5tYXAoZnVuY3Rpb24odCl7CiAgICAgIHZhciBubSA9IFN0cmluZyh0Lm5hbWUpLnJlcGxhY2UoL1x8L2csICcvJykudHJpbSgpOwogICAgICB2YXIgY3QgPSBTdHJpbmcodC5jYXRlZ29yeSB8fCAnJykucmVwbGFjZSgvXHwvZywgJy8nKS50cmltKCk7',
  'CiAgICAgIHJldHVybiAnWycgKyAodC5kb25lID8gJ3gnIDogJyAnKSArICddICcgKyBubSArIChjdCA/ICcgfCAnICsgY3QgOiAnJyk7CiAgICB9KS5qb2luKCdcbicpOwp9CgpmdW5jdGlvbiB0b2RvRG9uZSgpeyByZXR1cm4gKEZPUk0udG9kbyB8fCBbXSkuZmls',
  'dGVyKGZ1bmN0aW9uKHQpeyByZXR1cm4gdC5kb25lOyB9KS5sZW5ndGg7IH0KCmZ1bmN0aW9uIHRvZG9UYWJsZUh0bWwoKXsKICB2YXIgb3B0cyA9IEZPUk0udG9kb09wdGlvbnMgfHwgW107CiAgdmFyIHJvd3MgPSAoRk9STS50b2RvIHx8IFtdKS5tYXAoZnVuY3Rp',
  'b24odCwgaSl7CiAgICByZXR1cm4gJzxkaXYgY2xhc3M9InRvZG8tcm93JyArICh0LmRvbmUgPyAnIGRvbmUnIDogJycpICsgJyI+JyArCiAgICAgICc8bGFiZWwgY2xhc3M9InRvZG8tY2hlY2siIHRpdGxlPSInICsgKHQuZG9uZSA/ICfguJfguLPguYDguKrguKPg',
  'uYfguIjguYHguKXguYnguKcnIDogJ+C4ouC4seC4h+C5hOC4oeC5iOC5hOC4lOC5ieC4l+C4sycpICsgJyI+JyArCiAgICAgICAgJzxpbnB1dCB0eXBlPSJjaGVja2JveCInICsgKHQuZG9uZSA/ICcgY2hlY2tlZCcgOiAnJykgKyAnIG9uY2hhbmdlPSJzZXRUb2Rv',
  'KCcgKyBpICsgJyxcJ2RvbmVcJyx0aGlzLmNoZWNrZWQpIj4nICsKICAgICAgJzwvbGFiZWw+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgcGxhY2Vob2xkZXI9IuC4h+C4suC4meC4l+C4teC5iOC4leC5ieC4reC4h+C4i+C5iOC4reC4oSIgdmFsdWU9Iicg',
  'KyBlc2ModC5uYW1lIHx8ICcnKSArICciICcgKwogICAgICAgICdvbmlucHV0PSJzZXRUb2RvKCcgKyBpICsgJyxcJ25hbWVcJyx0aGlzLnZhbHVlKSI+JyArCiAgICAgICc8c2VsZWN0IGNsYXNzPSJzZWwiIG9uY2hhbmdlPSJzZXRUb2RvKCcgKyBpICsgJyxcJ2Nh',
  'dGVnb3J5XCcsdGhpcy52YWx1ZSkiPicgKwogICAgICAgICc8b3B0aW9uIHZhbHVlPSIiPuKAlCDguJvguKPguLDguYDguKDguJfguIfguLLguJkg4oCUPC9vcHRpb24+JyArCiAgICAgICAgb3B0cy5tYXAoZnVuY3Rpb24obyl7CiAgICAgICAgICByZXR1cm4gJzxv',
  'cHRpb24gdmFsdWU9IicgKyBlc2MobykgKyAnIicgKyAobyA9PT0gdC5jYXRlZ29yeSA/ICcgc2VsZWN0ZWQnIDogJycpICsgJz4nICsgZXNjKG8pICsgJzwvb3B0aW9uPic7CiAgICAgICAgfSkuam9pbignJykgKwogICAgICAnPC9zZWxlY3Q+JyArCiAgICAgICc8',
  'YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSBkZ3IiIHRpdGxlPSLguYDguK3guLLguIfguLLguJnguJnguLXguYnguK3guK3guIEiIG9uY2xpY2s9ImRlbFRvZG8oJyArIGkgKyAnKSI+w5c8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nOwogIH0pLmpv',
  'aW4oJycpOwoKICB2YXIgbiA9IChGT1JNLnRvZG8gfHwgW10pLmxlbmd0aCwgZCA9IHRvZG9Eb25lKCk7CiAgcmV0dXJuIChyb3dzIHx8ICc8ZGl2IGNsYXNzPSJoaW50IiBzdHlsZT0icGFkZGluZzo4cHggMnB4Ij7guKLguLHguIfguYTguKHguYjguKHguLXguIfg',
  'uLLguJkg4oCUIOC4geC4lCDigJzguYDguJ7guLTguYjguKHguIfguLLguJnigJ0g4LmA4Lie4Li34LmI4Lit4LmD4Liq4LmI4LiX4Li14Lil4Liw4LiI4Li44LiU4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LiL4LmI4Lit4LihPC9kaXY+JykgKwogICAgJzxkaXYgY2xh',
  'c3M9InJvdyBtdDgiPicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImFkZFRvZG8oKSI+KyDguYDguJ7guLTguYjguKHguIfguLLguJk8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBj',
  'bGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJwYXN0ZVRvZG8oKSI+8J+TiyDguKfguLLguIfguJfguLXguYDguJTguLXguKLguKfguKvguKXguLLguKLguIfguLLguJk8L2J1dHRvbj4nICsKICAgICAgKG4gPyAnPGRpdiBjbGFzcz0idG9kby1jb3VudCI+4LmA4Liq4Lij',
  '4LmH4LiI4LmB4Lil4LmJ4LinIDxiPicgKyBkICsgJy8nICsgbiArICc8L2I+IOC4h+C4suC4mTwvZGl2PicgOiAnJykgKwogICAgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIHJlZHJhd1RvZG8oKXsKICB2YXIgYm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Zf',
  'aXRlbXMnKTsKICBpZiAoIWJveCkgcmV0dXJuOwogIGJveC5pbm5lckhUTUwgPSB0b2RvVGFibGVIdG1sKCk7Cn0KCmZ1bmN0aW9uIHNldFRvZG8oaSwga2V5LCB2YWwpewogIGlmICghRk9STS50b2RvW2ldKSByZXR1cm47CiAgRk9STS50b2RvW2ldW2tleV0gPSAo',
  'a2V5ID09PSAnZG9uZScpID8gISF2YWwgOiB2YWw7CiAgaWYgKGtleSA9PT0gJ2RvbmUnKSB7IHJlZHJhd1RvZG8oKTsgcmV0dXJuOyB9ICAgLy8g4LiV4Li04LmK4LiB4LmB4Lil4LmJ4Lin4Lin4Liy4LiU4LmD4Lir4Lih4LmI4LmD4Lir4LmJ4LiC4Li14LiU4LiG',
  '4LmI4Liy4LmA4Lir4LmH4LiZ4LiK4Lix4LiUCiAgdmFyIGMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZl9pdGVtcyAudG9kby1jb3VudCBiJyk7CiAgaWYgKGMpIGMudGV4dENvbnRlbnQgPSB0b2RvRG9uZSgpICsgJy8nICsgRk9STS50b2RvLmxlbmd0aDsK',
  'fQoKZnVuY3Rpb24gYWRkVG9kbygpewogIEZPUk0udG9kby5wdXNoKHsgZG9uZTogZmFsc2UsIG5hbWU6ICcnLCBjYXRlZ29yeTogJycgfSk7CiAgcmVkcmF3VG9kbygpOwogIHZhciBpbnB1dHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjZl9pdGVtcyAu',
  'dG9kby1yb3cgLmlucCcpOwogIGlmIChpbnB1dHMubGVuZ3RoKSBpbnB1dHNbaW5wdXRzLmxlbmd0aCAtIDFdLmZvY3VzKCk7Cn0KCmZ1bmN0aW9uIGRlbFRvZG8oaSl7CiAgRk9STS50b2RvLnNwbGljZShpLCAxKTsKICByZWRyYXdUb2RvKCk7Cn0KCi8qKiDguKfg',
  'uLLguIfguKPguLLguKLguIHguLLguKPguJfguLXguYjguJXguYnguK3guIfguIvguYjguK3guKHguJfguLXguYDguJTguLXguKLguKfguKvguKXguLLguKLguJrguKPguKPguJfguLHguJQg4LmB4Lil4LmJ4Lin4LmD4Lir4LmJ4Lij4Liw4Lia4Lia4LmB4Lii4LiB',
  '4LmD4Lir4LmJICovCmZ1bmN0aW9uIHBhc3RlVG9kbygpewogIHZhciBib3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9kb1Bhc3RlV3JhcCcpOwogIGlmIChib3gpIHsgYm94LmhpZGRlbiA9ICFib3guaGlkZGVuOyBpZiAoIWJveC5oaWRkZW4pIGRvY3Vt',
  'ZW50LmdldEVsZW1lbnRCeUlkKCd0b2RvUGFzdGVCb3gnKS5mb2N1cygpOyByZXR1cm47IH0KCiAgdmFyIGhvc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9pdGVtcycpOwogIGlmICghaG9zdCkgcmV0dXJuOwogIHZhciB3cmFwID0gZG9jdW1lbnQuY3Jl',
  'YXRlRWxlbWVudCgnZGl2Jyk7CiAgd3JhcC5pZCA9ICd0b2RvUGFzdGVXcmFwJzsKICB3cmFwLmNsYXNzTmFtZSA9ICdtdDgnOwogIHdyYXAuaW5uZXJIVE1MID0KICAgICc8dGV4dGFyZWEgY2xhc3M9InRhIiBpZD0idG9kb1Bhc3RlQm94IiBzdHlsZT0ibWluLWhl',
  'aWdodDoxMTBweCIgJyArCiAgICAgICdwbGFjZWhvbGRlcj0i4Lii4Liy4LmB4LiZ4Lin4Lir4LmJ4Lit4LiH4LiZ4LmJ4LizJiMxMDvguYDguIHguYfguJrguKrguLXguKvguYnguK3guIcmIzEwO+C5gOC4m+C4peC4teC5iOC4ouC4meC4geC5iuC4reC4geC4meC5',
  'ieC4s+C4peC5ieC4suC4h+C4iOC4suC4mSI+PC90ZXh0YXJlYT4nICsKICAgICc8ZGl2IGNsYXNzPSJoaW50IG10OCI+4Lia4Lij4Lij4LiX4Lix4LiU4Lil4Liw4Lir4LiZ4Li24LmI4LiH4LiH4Liy4LiZIMK3IOC4q+C4o+C4t+C4reC4nuC4tOC4oeC4nuC5jOC4',
  'o+C4p+C4oeC4muC4o+C4o+C4l+C4seC4lOC5gOC4lOC4teC4ouC4p+C5geC4muC4miDigJwxLuC4ouC4suC5geC4meC4pyAyLuC5gOC4geC5h+C4muC4quC4teC4q+C5ieC4reC4h+KAnSDguIHguYfguYTguJTguYk8YnI+JyArCiAgICAgICfguYPguKrguYjguJvg',
  'uKPguLDguYDguKDguJfguIfguLLguJnguJfguLXguKvguKXguLHguIfguIjguLLguIHguIrguYjguK3guIfguILguYnguLLguIcg4LmGIOC5geC4leC5iOC4peC4sOC4h+C4suC4mTwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InJvdyBtdDgiPicgKwogICAgICAn',
  'PGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20gcHJpIiBvbmNsaWNrPSJhcHBseVBhc3RlZFRvZG8oKSI+4LmA4Lie4Li04LmI4Lih4LmA4LiC4LmJ4Liy4Lij4Liy4Lii4LiB4Liy4LijPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1',
  'dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCd0b2RvUGFzdGVXcmFwXCcpLmhpZGRlbj10cnVlIj7guJvguLTguJQ8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nOwogIGhvc3QuYXBwZW5kQ2hpbGQod3JhcCk7CiAg',
  'ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvZG9QYXN0ZUJveCcpLmZvY3VzKCk7Cn0KCmZ1bmN0aW9uIGFwcGx5UGFzdGVkVG9kbygpewogIHZhciB0ZXh0ID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2RvUGFzdGVCb3gnKSB8fCB7fSkudmFsdWUgfHwg',
  'Jyc7CiAgdmFyIGFkZGVkID0gcGFyc2VUb2RvVGV4dCh0ZXh0KTsKICBpZiAoIWFkZGVkLmxlbmd0aCkgcmV0dXJuIHRvYXN0KCfguYTguKHguYjguJ7guJrguIfguLLguJnguJfguLXguYjguK3guYjguLLguJnguYTguJTguYknLCAnZXJyJyk7CiAgRk9STS50b2Rv',
  'ID0gKEZPUk0udG9kbyB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uKHQpeyByZXR1cm4gU3RyaW5nKHQubmFtZSB8fCAnJykudHJpbSgpOyB9KS5jb25jYXQoYWRkZWQpOwogIHJlZHJhd1RvZG8oKTsKICB0b2FzdCgn4LmA4Lie4Li04LmI4Lih4LmD4Lir4LmJICcgKyBh',
  'ZGRlZC5sZW5ndGggKyAnIOC4h+C4suC4mScsICdvaycpOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lia4Li04Lil4LmA4LiU4Li14Lii4Lin4Lir4Lil4Liy4Lii4Lij4Liy4Lii',
  '4LiB4Liy4LijIOKAlCDguIvguLfguYnguK3guK3guK3guJnguYTguKXguJnguYzguJfguLXguYDguJTguLXguKLguKfguYTguJTguYnguILguK3guIfguKvguKXguLLguKLguK3guKLguYjguLLguIcKCiAgIOC5gOC4geC5h+C4muC4peC4h+C4iuC4teC4leC5gOC4',
  'm+C5h+C4meC4guC5ieC4reC4hOC4p+C4suC4oSDguJrguKPguKPguJfguLHguJTguKXguLDguKPguLLguKLguIHguLLguKMgIOC4iuC4t+C5iOC4rSB8IOC4iOC4s+C4meC4p+C4mSB8IOC4q+C4meC5iOC4p+C4oiB8IOC4o+C4suC4hOC4suC4leC5iOC4reC4q+C4',
  'meC5iOC4p+C4ogogICAo4Lij4Li54Lib4LmB4Lia4Lia4LmA4LiU4Li14Lii4Lin4LiB4Lix4LiaIHBhcnNlTGluZXNfIOC4neC4seC5iOC4h+C5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jCDigJQg4LmB4LiB4LmJ4LiX4Li14LmI4LmE4Lir4LiZ4LiV',
  '4LmJ4Lit4LiH4LmB4LiB4LmJ4LmD4Lir4LmJ4LiV4Lij4LiH4LiB4Lix4LiZKQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCmZ1bmN0aW9uIHBhcnNlTGluZXNUZXh0KHRleHQpewogIHJl',
  'dHVybiBTdHJpbmcodGV4dCA9PSBudWxsID8gJycgOiB0ZXh0KS5zcGxpdCgvXHI/XG4vKQogICAgLm1hcChmdW5jdGlvbihzKXsgcmV0dXJuIHMudHJpbSgpOyB9KS5maWx0ZXIoQm9vbGVhbikKICAgIC5tYXAoZnVuY3Rpb24ocmF3KXsKICAgICAgdmFyIGEgPSBy',
  'YXcuc3BsaXQoJ3wnKS5tYXAoZnVuY3Rpb24oeCl7IHJldHVybiB4LnRyaW0oKTsgfSk7CiAgICAgIHZhciBuYW1lID0gYVswXSB8fCAnJywgcXR5ID0gMSwgdW5pdCA9ICcnLCBwcmljZSA9IDA7CiAgICAgIGlmIChhLmxlbmd0aCA+PSA0KSAgICAgIHsgcXR5ID0g',
  'bnVtT3IoYVsxXSwgMSk7IHVuaXQgPSBhWzJdIHx8ICcnOyBwcmljZSA9IG51bU9yKGFbM10sIDApOyB9CiAgICAgIGVsc2UgaWYgKGEubGVuZ3RoID09PSAzKXsgcXR5ID0gbnVtT3IoYVsxXSwgMSk7IHByaWNlID0gbnVtT3IoYVsyXSwgMCk7IH0KICAgICAgZWxz',
  'ZSBpZiAoYS5sZW5ndGggPT09IDIpeyBwcmljZSA9IG51bU9yKGFbMV0sIDApOyB9CiAgICAgIHJldHVybiB7IG5hbWU6IG5hbWUsIHF0eTogcXR5LCB1bml0OiB1bml0LCBwcmljZTogcHJpY2UgfTsKICAgIH0pOwp9CgpmdW5jdGlvbiBudW1Pcih2LCBkZmx0KXsK',
  'ICB2YXIgbiA9IE51bWJlcihTdHJpbmcodikucmVwbGFjZSgvLC9nLCAnJykpOwogIHJldHVybiBpc0Zpbml0ZShuKSA/IG4gOiBkZmx0Owp9CgpmdW5jdGlvbiBmb3JtYXRMaW5lc1RleHQobGlzdCl7CiAgcmV0dXJuIChsaXN0IHx8IFtdKQogICAgLmZpbHRlcihm',
  'dW5jdGlvbihsKXsgcmV0dXJuIFN0cmluZyhsLm5hbWUgfHwgJycpLnRyaW0oKSB8fCBOdW1iZXIobC5wcmljZSk7IH0pCiAgICAubWFwKGZ1bmN0aW9uKGwpewogICAgICByZXR1cm4gW1N0cmluZyhsLm5hbWUgfHwgJycpLnJlcGxhY2UoL1x8L2csICcvJyksCiAg',
  'ICAgICAgICAgICAgbC5xdHkgfHwgMSwKICAgICAgICAgICAgICBTdHJpbmcobC51bml0IHx8ICcnKS5yZXBsYWNlKC9cfC9nLCAnLycpLAogICAgICAgICAgICAgIGwucHJpY2UgfHwgMF0uam9pbignIHwgJyk7CiAgICB9KS5qb2luKCdcbicpOwp9CgpmdW5jdGlv',
  'biBsaW5lVG90YWwobCl7IHJldHVybiAoTnVtYmVyKGwucXR5KSB8fCAwKSAqIChOdW1iZXIobC5wcmljZSkgfHwgMCk7IH0KZnVuY3Rpb24gbGluZXNTdW0oKXsgcmV0dXJuIChGT1JNLmxpbmVzIHx8IFtdKS5yZWR1Y2UoZnVuY3Rpb24oYSwgbCl7IHJldHVybiBh',
  'ICsgbGluZVRvdGFsKGwpOyB9LCAwKTsgfQoKZnVuY3Rpb24gbGluZXNUYWJsZUh0bWwoKXsKICB2YXIgcm93cyA9IChGT1JNLmxpbmVzIHx8IFtdKS5tYXAoZnVuY3Rpb24obCwgaSl7CiAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImxpbmUtcm93Ij4nICsKICAgICAg',
  'JzxpbnB1dCBjbGFzcz0iaW5wIiBwbGFjZWhvbGRlcj0i4LiK4Li34LmI4Lit4Liq4Li04LiZ4LiE4LmJ4LiyIiB2YWx1ZT0iJyArIGVzYyhsLm5hbWUgfHwgJycpICsgJyIgJyArCiAgICAgICAgJ29uaW5wdXQ9InNldExpbmUoJyArIGkgKyAnLFwnbmFtZVwnLHRo',
  'aXMudmFsdWUpIj4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIG51bSIgdHlwZT0ibnVtYmVyIiBzdGVwPSJhbnkiIGlucHV0bW9kZT0iZGVjaW1hbCIgcGxhY2Vob2xkZXI9IuC4iOC4s+C4meC4p+C4mSIgJyArCiAgICAgICAgJ3ZhbHVlPSInICsgKGwucXR5',
  'ID09IG51bGwgPyAnJyA6IGVzYyhsLnF0eSkpICsgJyIgb25pbnB1dD0ic2V0TGluZSgnICsgaSArICcsXCdxdHlcJyx0aGlzLnZhbHVlKSI+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgcGxhY2Vob2xkZXI9IuC4q+C4meC5iOC4p+C4oiIgdmFsdWU9Iicg',
  'KyBlc2MobC51bml0IHx8ICcnKSArICciICcgKwogICAgICAgICdvbmlucHV0PSJzZXRMaW5lKCcgKyBpICsgJyxcJ3VuaXRcJyx0aGlzLnZhbHVlKSI+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCBudW0iIHR5cGU9Im51bWJlciIgc3RlcD0iYW55IiBpbnB1',
  'dG1vZGU9ImRlY2ltYWwiIHBsYWNlaG9sZGVyPSLguKPguLLguITguLIv4Lir4LiZ4LmI4Lin4LiiIiAnICsKICAgICAgICAndmFsdWU9IicgKyAobC5wcmljZSA9PSBudWxsID8gJycgOiBlc2MobC5wcmljZSkpICsgJyIgb25pbnB1dD0ic2V0TGluZSgnICsgaSAr',
  'ICcsXCdwcmljZVwnLHRoaXMudmFsdWUpIj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImxpbmUtc3VtIj4nICsgbW9uZXkobGluZVRvdGFsKGwpLCAyKSArICc8L2Rpdj4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIGRnciIgdGl0',
  'bGU9IuC5gOC4reC4suC4o+C4suC4ouC4geC4suC4o+C4meC4teC5ieC4reC4reC4gSIgb25jbGljaz0iZGVsTGluZSgnICsgaSArICcpIj7DlzwvYnV0dG9uPicgKwogICAgJzwvZGl2Pic7CiAgfSkuam9pbignJyk7CgogIHJldHVybiAnPGRpdiBjbGFzcz0ibGlu',
  'ZS1oZWFkIj4nICsKICAgICAgJzxzcGFuPuC4iuC4t+C5iOC4reC4quC4tOC4meC4hOC5ieC4sjwvc3Bhbj48c3BhbiBjbGFzcz0ibnVtIj7guIjguLPguJnguKfguJk8L3NwYW4+PHNwYW4+4Lir4LiZ4LmI4Lin4LiiPC9zcGFuPicgKwogICAgICAnPHNwYW4gY2xh',
  'c3M9Im51bSI+4Lij4Liy4LiE4LiyL+C4q+C4meC5iOC4p+C4ojwvc3Bhbj48c3BhbiBjbGFzcz0ibnVtIj7guKPguKfguKE8L3NwYW4+PHNwYW4+PC9zcGFuPicgKwogICAgJzwvZGl2PicgKwogICAgKHJvd3MgfHwgJzxkaXYgY2xhc3M9ImhpbnQiIHN0eWxlPSJw',
  'YWRkaW5nOjhweCAycHgiPuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4o+C4suC4ouC4geC4suC4oyDigJQg4LiB4LiUIOKAnOC5gOC4nuC4tOC5iOC4oeC4o+C4suC4ouC4geC4suC4o+KAnSDguYDguJ7guLfguYjguK3guYPguKrguYjguKrguLTguJnguITguYng',
  'uLLguJfguLXguKXguLDguK3guKLguYjguLLguIc8L2Rpdj4nKSArCiAgICAnPGRpdiBjbGFzcz0icm93IG10OCI+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iYWRkTGluZSgpIj4rIOC5gOC4nuC4tOC5iOC4',
  'oeC4o+C4suC4ouC4geC4suC4ozwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9InBhc3RlTGluZXMoKSI+8J+TiyDguKfguLLguIfguJfguLXguYDguJTguLXguKLguKfguKvguKXguLLguKLguKPg',
  'uLLguKLguIHguLLguKM8L2J1dHRvbj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImxpbmUtdG90YWwiPuC4o+C4p+C4oeC4hOC5iOC4suC4quC4tOC4meC4hOC5ieC4siA8Yj4nICsgbW9uZXkobGluZXNTdW0oKSwgMikgKyAnIOC4vzwvYj48L2Rpdj4nICsKICAgICc8',
  'L2Rpdj4nOwp9CgpmdW5jdGlvbiByZWRyYXdMaW5lcygpewogIHZhciBib3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9saW5lcycpOwogIGlmICghYm94KSByZXR1cm47CiAgYm94LmlubmVySFRNTCA9IGxpbmVzVGFibGVIdG1sKCk7CiAgcmVjYWxjQmls',
  'bCgpOwp9CgpmdW5jdGlvbiBzZXRMaW5lKGksIGtleSwgdmFsKXsKICBpZiAoIUZPUk0ubGluZXNbaV0pIHJldHVybjsKICBGT1JNLmxpbmVzW2ldW2tleV0gPSAoa2V5ID09PSAncXR5JyB8fCBrZXkgPT09ICdwcmljZScpID8gbnVtT3IodmFsLCAwKSA6IHZhbDsK',
  'ICAvLyDguYTguKHguYjguKfguLLguJTguYPguKvguKHguYjguJfguLHguYnguIfguJXguLLguKPguLLguIcg4LmA4LiU4Li14LmL4Lii4Lin4LmA4LiE4Lit4Lij4LmM4LmA4LiL4Lit4Lij4LmM4LmA4LiU4LmJ4LiH4Lit4Lit4LiB4LiI4Liy4LiB4LiK4LmI4Lit',
  '4LiH4LiX4Li14LmI4LiB4Liz4Lil4Lix4LiH4Lie4Li04Lih4Lie4LmMCiAgdmFyIHJvdyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNmX2xpbmVzIC5saW5lLXJvdycpW2ldOwogIGlmIChyb3cpIHJvdy5xdWVyeVNlbGVjdG9yKCcubGluZS1zdW0nKS50',
  'ZXh0Q29udGVudCA9IG1vbmV5KGxpbmVUb3RhbChGT1JNLmxpbmVzW2ldKSwgMik7CiAgdmFyIHRvdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNmX2xpbmVzIC5saW5lLXRvdGFsIGInKTsKICBpZiAodG90KSB0b3QudGV4dENvbnRlbnQgPSBtb25leShsaW5l',
  'c1N1bSgpLCAyKSArICcg4Li/JzsKICByZWNhbGNCaWxsKCk7Cn0KCmZ1bmN0aW9uIGFkZExpbmUoKXsKICBGT1JNLmxpbmVzLnB1c2goeyBuYW1lOiAnJywgcXR5OiAxLCB1bml0OiAnJywgcHJpY2U6IDAgfSk7CiAgcmVkcmF3TGluZXMoKTsKICB2YXIgaW5wdXRz',
  'ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2ZfbGluZXMgLmxpbmUtcm93IC5pbnAnKTsKICBpZiAoaW5wdXRzLmxlbmd0aCkgaW5wdXRzWyhGT1JNLmxpbmVzLmxlbmd0aCAtIDEpICogNF0uZm9jdXMoKTsKfQoKZnVuY3Rpb24gZGVsTGluZShpKXsKICBG',
  'T1JNLmxpbmVzLnNwbGljZShpLCAxKTsKICByZWRyYXdMaW5lcygpOwp9CgovKioKICog4Lin4Liy4LiH4Lij4Liy4Lii4LiB4Liy4Lij4LiI4Liy4LiB4Lir4LiZ4LmJ4Liy4LiE4Liz4Liq4Lix4LmI4LiH4LiL4Li34LmJ4Lit4LiX4Li14LmA4LiU4Li14Lii4Lin',
  '4LiX4Lix4LmJ4LiH4LiB4LmJ4Lit4LiZIOC5geC4peC5ieC4p+C5g+C4q+C5ieC4o+C4sOC4muC4muC5geC4ouC4geC4muC4o+C4o+C4l+C4seC4lOC5g+C4q+C5iQogKgogKiDguJfguLPguYDguJvguYfguJnguIrguYjguK3guIfguJ7guLHguJrguYDguIHguYfg',
  'uJrguK3guKLguLnguYjguYPguJnguJ/guK3guKPguYzguKHguYDguJTguLTguKEg4LmE4Lih4LmI4LmA4Lib4Li04LiU4Lir4LiZ4LmJ4Liy4LiV4LmI4Liy4LiH4LiL4LmJ4Lit4LiZCiAqIOC5gOC4nuC4o+C4suC4sCBvcGVuTW9kYWwoKSDguYDguILguLXguKLg',
  'uJnguJfguLHguJrguKvguJnguYnguLLguJXguYjguLLguIfguYDguJTguLTguKEg4LiW4LmJ4Liy4LmA4Lib4Li04LiU4LiL4LmJ4Lit4LiZ4Lif4Lit4Lij4LmM4Lih4LiX4Li14LmI4LiB4Lij4Lit4LiB4LiE4LmJ4Liy4LiH4LmE4Lin4LmJ4LiI4Liw4Lir4Liy',
  '4Lii4LiX4Lix4LmJ4LiH4LmD4LiaCiAqLwpmdW5jdGlvbiBwYXN0ZUxpbmVzKCl7CiAgdmFyIGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXN0ZVdyYXAnKTsKICBpZiAoYm94KSB7IGJveC5oaWRkZW4gPSAhYm94LmhpZGRlbjsgaWYgKCFib3guaGlk',
  'ZGVuKSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFzdGVCb3gnKS5mb2N1cygpOyByZXR1cm47IH0KCiAgdmFyIGhvc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9saW5lcycpOwogIGlmICghaG9zdCkgcmV0dXJuOwogIHZhciB3cmFwID0gZG9jdW1l',
  'bnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgd3JhcC5pZCA9ICdwYXN0ZVdyYXAnOwogIHdyYXAuY2xhc3NOYW1lID0gJ210OCc7CiAgd3JhcC5pbm5lckhUTUwgPQogICAgJzx0ZXh0YXJlYSBjbGFzcz0idGEiIGlkPSJwYXN0ZUJveCIgc3R5bGU9Im1pbi1oZWln',
  'aHQ6MTIwcHgiICcgKwogICAgICAncGxhY2Vob2xkZXI9IuC4m+C4seC5iuC4oeC4meC5ieC4syA3NTBXIHwgMSB8IOC5gOC4hOC4o+C4t+C5iOC4reC4hyB8IDQyNTAmIzEwO+C4quC4suC4ouC5hOC4nyBWQUYgMngxLjUgfCAyMCB8IOC5gOC4oeC4leC4oyB8IDE3',
  'LjUmIzEwO+C5gOC4l+C4m+C4nuC4seC4meC4quC4suC4ouC5hOC4nyA0NSI+PC90ZXh0YXJlYT4nICsKICAgICc8ZGl2IGNsYXNzPSJoaW50IG10OCI+4LiE4Lix4LmI4LiZ4LiU4LmJ4Lin4LiiIDxiPnw8L2I+IOC4leC4suC4oeC4peC4s+C4lOC4seC4miDguIrg',
  'uLfguYjguK0gwrcg4LiI4Liz4LiZ4Lin4LiZIMK3IOC4q+C4meC5iOC4p+C4oiDCtyDguKPguLLguITguLLguJXguYjguK3guKvguJnguYjguKfguKI8YnI+JyArCiAgICAgICfguJbguYnguLLguKfguLLguIfguKHguLLguYDguJvguYfguJnguILguYnguK3guITg',
  'uKfguLLguKHguJjguKPguKPguKHguJTguLIg4Lij4Liw4Lia4Lia4LiI4Liw4Lie4Lii4Liy4Lii4Liy4Lih4LmB4Lii4LiB4LiK4Li34LmI4Lit4LiB4Lix4Lia4Lij4Liy4LiE4Liy4LmD4Lir4LmJ4LmA4Lit4LiHPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0i',
  'cm93IG10OCI+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSBwcmkiIG9uY2xpY2s9ImFwcGx5UGFzdGVkTGluZXMoKSI+4LmA4Lie4Li04LmI4Lih4LmA4LiC4LmJ4Liy4Lij4Liy4Lii4LiB4Liy4LijPC9idXR0b24+JyArCiAg',
  'ICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCdwYXN0ZVdyYXBcJykuaGlkZGVuPXRydWUiPuC4m+C4tOC4lDwvYnV0dG9uPicgKwogICAgJzwvZGl2Pic7CiAgaG9zdC5hcHBl',
  'bmRDaGlsZCh3cmFwKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFzdGVCb3gnKS5mb2N1cygpOwp9CgpmdW5jdGlvbiBhcHBseVBhc3RlZExpbmVzKCl7CiAgdmFyIHRleHQgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Bhc3RlQm94JykgfHwge30p',
  'LnZhbHVlIHx8ICcnOwogIHZhciBhZGRlZCA9IHRleHQuc3BsaXQoL1xyP1xuLykubWFwKGZ1bmN0aW9uKHMpeyByZXR1cm4gcy50cmltKCk7IH0pLmZpbHRlcihCb29sZWFuKS5tYXAoZnVuY3Rpb24ocmF3KXsKICAgIGlmIChyYXcuaW5kZXhPZignfCcpID49IDAp',
  'IHJldHVybiBwYXJzZUxpbmVzVGV4dChyYXcpWzBdOwogICAgLy8g4LmE4Lih4LmI4Lih4Li1IHwg4oCUIOC5gOC4lOC4suC4iOC4suC4geC4leC4seC4p+C5gOC4peC4guC4l+C5ieC4suC4ouC4muC4o+C4o+C4l+C4seC4lOC4p+C5iOC4suC5gOC4m+C5h+C4meC4',
  'o+C4suC4hOC4sgogICAgdmFyIG0gPSByYXcubWF0Y2goL14oLio/KVtcczp4w5ddKihbXGQsXSsoPzpcLlxkKyk/KVxzKig/OuC4muC4suC4l3zguL8pPyQvKTsKICAgIGlmIChtICYmIG1bMV0udHJpbSgpKSByZXR1cm4geyBuYW1lOiBtWzFdLnRyaW0oKSwgcXR5',
  'OiAxLCB1bml0OiAnJywgcHJpY2U6IG51bU9yKG1bMl0sIDApIH07CiAgICByZXR1cm4geyBuYW1lOiByYXcsIHF0eTogMSwgdW5pdDogJycsIHByaWNlOiAwIH07CiAgfSkuZmlsdGVyKEJvb2xlYW4pOwoKICBpZiAoIWFkZGVkLmxlbmd0aCkgcmV0dXJuIHRvYXN0',
  'KCfguYTguKHguYjguJ7guJrguKPguLLguKLguIHguLLguKPguJfguLXguYjguK3guYjguLLguJnguYTguJTguYknLCAnZXJyJyk7CiAgRk9STS5saW5lcyA9IChGT1JNLmxpbmVzIHx8IFtdKS5maWx0ZXIoZnVuY3Rpb24obCl7IHJldHVybiBTdHJpbmcobC5uYW1l',
  'IHx8ICcnKS50cmltKCk7IH0pLmNvbmNhdChhZGRlZCk7CiAgcmVkcmF3TGluZXMoKTsgICAvLyDguKfguLLguJTguYPguKvguKHguYjguYHguKXguYnguKfguIrguYjguK3guIfguKfguLLguIfguIjguLDguKvguLLguKLguYTguJvguYDguK3guIcg4LmA4Lie4Lij',
  '4Liy4Liw4Lit4Lii4Li54LmI4LiC4LmJ4Liy4LiH4LmD4LiZIGZfbGluZXMKICB0b2FzdCgn4LmA4Lie4Li04LmI4Lih4LmD4Lir4LmJICcgKyBhZGRlZC5sZW5ndGggKyAnIOC4o+C4suC4ouC4geC4suC4oyDigJQg4LiV4Lij4Lin4LiI4LiV4Lix4Lin4LmA4Lil',
  '4LiC4Lit4Li14LiB4LiE4Lij4Lix4LmJ4LiH4LiB4LmI4Lit4LiZ4Lia4Lix4LiZ4LiX4Li24LiBJywgJ29rJyk7Cn0KCi8qKgogKiDguITguLTguJTguKLguK3guJTguKPguKfguKHguILguK3guIfguJrguLTguKUgPSDguITguYjguLLguKrguLTguJnguITguYng',
  'uLIgKyDguITguYjguLLguKrguYjguIcg4oiSIOC4quC5iOC4p+C4meC4peC4lCDguYHguKXguYnguKfguYDguJXguLTguKHguKXguIfguIrguYjguK3guIcgIuC4o+C4suC4hOC4suC4o+C4p+C4oSIKICog4LmD4Lir4LmJ4LiV4Lij4LiH4LiB4Lix4Lia4LiX4Li1',
  '4LmI4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4LiE4Li04LiU4LiV4Lit4LiZ4Lia4Lix4LiZ4LiX4Li24LiBIOC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC4oeC4teC4l+C4suC4h+C4l+C4teC5iOC4leC4seC4p+C5gOC4peC4',
  'guC4quC4reC4h+C4neC4seC5iOC4h+C5hOC4oeC5iOC4leC4o+C4h+C4geC4seC4mQogKi8KZnVuY3Rpb24gcmVjYWxjQmlsbCgpewogIGlmICghZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfbGluZXMnKSkgcmV0dXJuOwogIHZhciBwcmljZSA9IGRvY3VtZW50',
  'LmdldEVsZW1lbnRCeUlkKCdmX3ByaWNlJyk7CiAgaWYgKCFwcmljZSkgcmV0dXJuOwogIHZhciBuID0gKEZPUk0ubGluZXMgfHwgW10pLmZpbHRlcihmdW5jdGlvbihsKXsgcmV0dXJuIFN0cmluZyhsLm5hbWUgfHwgJycpLnRyaW0oKSB8fCBOdW1iZXIobC5wcmlj',
  'ZSk7IH0pLmxlbmd0aDsKICBpZiAoIW4pIHsgcHJpY2UucmVhZE9ubHkgPSBmYWxzZTsgcHJpY2Uuc3R5bGUuYmFja2dyb3VuZCA9ICcnOyByZXR1cm47IH0KCiAgdmFyIHNoaXAgPSBOdW1iZXIoKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX3NoaXBwaW5nJykg',
  'fHwge30pLnZhbHVlKSB8fCAwOwogIHZhciBkaXNjID0gTnVtYmVyKChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9kaXNjb3VudCcpIHx8IHt9KS52YWx1ZSkgfHwgMDsKICBwcmljZS52YWx1ZSA9IE1hdGgucm91bmQoKGxpbmVzU3VtKCkgKyBzaGlwIC0gZGlz',
  'YykgKiAxMDApIC8gMTAwOwogIHByaWNlLnJlYWRPbmx5ID0gdHJ1ZTsgICAgICAgICAgICAgICAgICAgICAgIC8vIOC4oeC4teC4o+C4suC4ouC4geC4suC4o+C4ouC5iOC4reC4ouC5geC4peC5ieC4pyDguKvguYnguLLguKHguJ7guLTguKHguJ7guYzguJfguLHg',
  'uJrguYPguKvguYnguYTguKHguYjguJXguKPguIfguIHguLHguJkKICBwcmljZS5zdHlsZS5iYWNrZ3JvdW5kID0gJ3ZhcigtLXN1cmZhY2UtMiknOwogIHByaWNlLnRpdGxlID0gJ+C4hOC4tOC4lOC4iOC4suC4geC4o+C4suC4ouC4geC4suC4o+C5g+C4meC4muC4',
  'tOC4peC5g+C4q+C5ieC4reC4seC4leC5guC4meC4oeC4seC4leC4tCDigJQg4LmB4LiB4LmJ4LiX4Li14LmI4Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4LiiIOC4hOC5iOC4suC4quC5iOC4hyDguKvguKPguLfguK3guKrguYjguKfguJnguKXguJQnOwoKICB2',
  'YXIgaGludCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiaWxsSGludCcpOwogIGlmIChoaW50KSB7CiAgICBoaW50LmlubmVySFRNTCA9IG4gKyAnIOC4o+C4suC4ouC4geC4suC4oyDCtyDguITguYjguLLguKrguLTguJnguITguYnguLIgJyArIG1vbmV5KGxp',
  'bmVzU3VtKCksIDIpICsKICAgICAgKHNoaXAgPyAnICsg4LiE4LmI4Liy4Liq4LmI4LiHICcgKyBtb25leShzaGlwLCAyKSA6ICcnKSArCiAgICAgIChkaXNjID8gJyDiiJIg4Liq4LmI4Lin4LiZ4Lil4LiUICcgKyBtb25leShkaXNjLCAyKSA6ICcnKTsKICB9Cn0K',
  'Ci8qKiDguK3guLHguJvguYDguJTguJXguIrguYjguK3guIfguJzguKXguKPguKfguKHguJfguLjguIHguIrguYjguK3guIfguYPguJnguJ/guK3guKPguYzguKHguJvguLHguIjguIjguLjguJrguLHguJkgKi8KZnVuY3Rpb24gcmVjYWxjU3VtcygpewogIChGT1JN',
  'LnNwZWNzIHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uKGYpewogICAgaWYgKGYudHlwZSAhPT0gJ2NvbXB1dGVkJyB8fCAhZi5mcm9tKSByZXR1cm47CiAgICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl8nICsgZi5rZXkpOwogICAgaWYgKCFlbCkg',
  'cmV0dXJuOwogICAgdmFyIHRvdGFsID0gMDsKICAgIGYuZnJvbS5mb3JFYWNoKGZ1bmN0aW9uKGspewogICAgICB2YXIgaSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmXycgKyBrKTsKICAgICAgaWYgKGkpIHRvdGFsICs9IE51bWJlcihpLnZhbHVlKSB8fCAw',
  'OwogICAgfSk7CiAgICBlbC50ZXh0Q29udGVudCA9IHRvdGFsLnRvTG9jYWxlU3RyaW5nKCd0aC1USCcsIHsgbWluaW11bUZyYWN0aW9uRGlnaXRzOiAwLCBtYXhpbXVtRnJhY3Rpb25EaWdpdHM6IDIgfSkgKyAnIOC4vyc7CiAgICBlbC5zdHlsZS5jb2xvciA9IHRv',
  'dGFsID4gMCA/ICd2YXIoLS1vayknIDogJ3ZhcigtLW11dGVkKSc7CiAgfSk7Cn0KCmZ1bmN0aW9uIGV4aXN0aW5nRmlsZXNIdG1sKGtleSl7CiAgdmFyIGxpc3QgPSBGT1JNLmtlZXBba2V5XSB8fCBbXTsKICBpZiAoIWxpc3QubGVuZ3RoKSByZXR1cm4gJyc7CiAg',
  'cmV0dXJuICc8ZGl2IGNsYXNzPSJ0aHVtYnMgbWI4Ij4nICsgbGlzdC5tYXAoZnVuY3Rpb24odXJsLCBpKXsKICAgIHZhciBpZCA9IFN0cmluZyh1cmwpLm1hdGNoKC9bLVx3XXsyMCx9Lyk7CiAgICB2YXIgdGh1bWIgPSBpZCA/ICdodHRwczovL2RyaXZlLmdvb2ds',
  'ZS5jb20vdGh1bWJuYWlsP2lkPScgKyBpZFswXSArICcmc3o9dzIwMCcgOiAnJzsKICAgIHJldHVybiAnPHNwYW4gc3R5bGU9InBvc2l0aW9uOnJlbGF0aXZlO2Rpc3BsYXk6aW5saW5lLWJsb2NrIj4nICsKICAgICAgKHRodW1iID8gJzxpbWcgY2xhc3M9InRodW1i',
  'IiBzcmM9IicgKyBlc2ModGh1bWIpICsgJyIgb25jbGljaz0id2luZG93Lm9wZW4oJyArIGpzcShzYWZlVXJsKHVybCkpICsgJyxcJ19ibGFua1wnKSI+JwogICAgICAgICAgICAgOiAnPGEgY2xhc3M9ImIgaW5mbyIgaHJlZj0iJyArIGVzYyhzYWZlVXJsKHVybCkg',
  'fHwgJyMnKSArICciIHRhcmdldD0iX2JsYW5rIiByZWw9Im5vb3BlbmVyIj7guYTguJ/guKXguYwgJyArIChpKzEpICsgJzwvYT4nKSArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgb25jbGljaz0iZHJvcEZpbGUoXCcnICsga2V5ICsgJ1wnLCcgKyBpICsg',
  'JykiIHRpdGxlPSLguYDguK3guLLguK3guK3guIEiICcgKwogICAgICAnc3R5bGU9InBvc2l0aW9uOmFic29sdXRlO3RvcDotNnB4O3JpZ2h0Oi02cHg7YmFja2dyb3VuZDp2YXIoLS1kYW5nZXIpO2NvbG9yOiNmZmY7Ym9yZGVyOjA7Ym9yZGVyLXJhZGl1czo5OXB4',
  'O3dpZHRoOjE4cHg7aGVpZ2h0OjE4cHg7bGluZS1oZWlnaHQ6MTtjdXJzb3I6cG9pbnRlcjtmb250LXNpemU6MTJweCI+w5c8L2J1dHRvbj4nICsKICAgICAgJzwvc3Bhbj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIGRyb3BGaWxlKGtl',
  'eSwgaWR4KXsKICBGT1JNLmtlZXBba2V5XS5zcGxpY2UoaWR4LCAxKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl8nICsga2V5ICsgJ19leGlzdGluZycpLmlubmVySFRNTCA9IGV4aXN0aW5nRmlsZXNIdG1sKGtleSk7Cn0KCmZ1bmN0aW9uIHByZXZpZXdQ',
  'aWNrZWQoaW5wdXQsIGlkKXsKICB2YXIgYm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQgKyAnX3ByZXZpZXcnKTsKICB2YXIgZmlsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChpbnB1dC5maWxlcyB8fCBbXSk7CiAgYm94LmlubmVySFRNTCA9',
  'IGZpbGVzLm1hcChmdW5jdGlvbihmKXsKICAgIHJldHVybiAnPHNwYW4gY2xhc3M9ImIgaW5mbyI+JyArIGVzYyhmLm5hbWUuc2xpY2UoMCwyNikpICsgJyDCtyAnICsgTWF0aC5yb3VuZChmLnNpemUvMTAyNCkgKyAnIEtCPC9zcGFuPic7CiAgfSkuam9pbignICcp',
  'OwoKICB2YXIgc2xvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkICsgJ19vY3InKTsKICBpZiAoIXNsb3QpIHJldHVybjsKICBzbG90LmlubmVySFRNTCA9ICcnOwogIGlmICghb2NyVXNhYmxlKCkgfHwgIWZpcnN0UmVhZGFibGUoZmlsZXMpKSByZXR1cm47',
  'CgogIHZhciBtb2RlID0gKFMuYm9vdC5zZXR0aW5ncyAmJiBTLmJvb3Quc2V0dGluZ3Mub2NyQXV0b2ZpbGwpIHx8ICfguJbguLLguKHguIHguYjguK3guJnguYDguJXguLTguKEnOwogIGlmIChtb2RlID09PSAn4LmE4Lih4LmI4LmA4LiV4Li04LihJykgcmV0dXJu',
  'OwogIGlmIChtb2RlID09PSAn4LmA4LiV4Li04Lih4LmD4Lir4LmJ4LmA4Lil4LiiJykgcmV0dXJuIHJ1bk9jcihpZCwgdHJ1ZSk7CgogIHNsb3QuaW5uZXJIVE1MID0KICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSBtdDgiIG9uY2xpY2s9',
  'InJ1bk9jcihcJycgKyBpZCArICdcJykiPicgKwogICAgJ/CflI4g4Lit4LmI4Liy4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiI4Liy4LiB4Lij4Li54Lib4LiZ4Li14LmJIOC5geC4peC5ieC4p+C4iuC5iOC4p+C4ouC4geC4o+C4reC4geC5g+C4q+C5iTwvYnV0',
  'dG9uPic7Cn0KCi8qKiDguK3guYjguLLguJnguITguYjguLLguIjguLLguIHguJ/guK3guKPguYzguKEgKyDguK3guLHguJvguYLguKvguKXguJTguYTguJ/guKXguYzguYPguKvguKHguYgg4LmB4Lil4LmJ4Lin4LiE4Li34LiZIG9iamVjdCDguJ7guKPguYnguK3g',
  'uKHguJrguLHguJnguJfguLbguIEgKi8KZnVuY3Rpb24gcmVhZEZvcm0oc3BlY3MsIGJ1Y2tldCl7CiAgdmFyIG91dCA9IHt9OwogIHZhciB1cGxvYWRzID0gW107CgogIHNwZWNzLmZvckVhY2goZnVuY3Rpb24oZil7CiAgICBpZiAoZi50eXBlID09PSAnY29tcHV0',
  'ZWQnKSByZXR1cm47ICAgICAgICAgIC8vIOC4iuC5iOC4reC4h+C4hOC4s+C4meC4p+C4kyDguYTguKHguYjguJXguYnguK3guIfguJrguLHguJnguJfguLbguIEKICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmXycgKyBmLmtleSk7CiAgICBp',
  'ZiAoIWVsKSByZXR1cm47CiAgICBpZiAoZi50eXBlID09PSAnZmlsZXMnKSB7CiAgICAgIHVwbG9hZHMucHVzaCgKICAgICAgICB1cGxvYWRGaWxlcyhlbCwgYnVja2V0KS50aGVuKGZ1bmN0aW9uKHJlZnMpewogICAgICAgICAgb3V0W2Yua2V5XSA9IChGT1JNLmtl',
  'ZXBbZi5rZXldIHx8IFtdKS5jb25jYXQocmVmcy5tYXAoZnVuY3Rpb24ocil7IHJldHVybiByLnVybDsgfSkpOwogICAgICAgIH0pCiAgICAgICk7CiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ3RvZG8nKSB7CiAgICAgIG91dFtmLmtleV0gPSBmb3JtYXRUb2Rv',
  'VGV4dChGT1JNLnRvZG8pOwogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICdsaW5lcycpIHsKICAgICAgb3V0W2Yua2V5XSA9IGZvcm1hdExpbmVzVGV4dChGT1JNLmxpbmVzKTsKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnbnVtYmVyJyB8fCBmLnR5cGUgPT09',
  'ICdtb25leScpIHsKICAgICAgb3V0W2Yua2V5XSA9IGVsLnZhbHVlID09PSAnJyA/IG51bGwgOiBOdW1iZXIoZWwudmFsdWUpOwogICAgfSBlbHNlIHsKICAgICAgb3V0W2Yua2V5XSA9IGVsLnZhbHVlOwogICAgfQogIH0pOwoKICByZXR1cm4gUHJvbWlzZS5hbGwo',
  'dXBsb2FkcykudGhlbihmdW5jdGlvbigpeyByZXR1cm4gb3V0OyB9KTsKfQoKLyoqIOC5guC4hOC4o+C4h+C4n+C4reC4o+C5jOC4oeC4oeC4suC4leC4o+C4kOC4suC4mTog4LmA4Lib4Li04LiUIG1vZGFsLCDguIjguLHguJTguIHguLLguKPguJvguLjguYjguKHg',
  'uJrguLHguJnguJfguLbguIEsIOC4o+C4teC5guC4q+C4peC4lOC4q+C4meC5ieC4siAqLwpmdW5jdGlvbiBvcGVuRm9ybShvcHRzKXsKICB2YXIgcmVjID0gb3B0cy5yZWNvcmQgfHwge307CiAgRk9STS5vY3IgPSBvcHRzLm9jciB8fCBudWxsOwogIEZPUk0ucmVj',
  'ID0gcmVjLmlkID8gcmVjIDogbnVsbDsgICAvLyDguIjguLPguYTguKfguYnguKfguYjguLLguIHguLPguKXguLHguIfguYHguIHguYnguILguK3guIfguYDguJTguLTguKEg4Lir4Lij4Li34Lit4LiB4Liz4Lil4Lix4LiH4LmA4Lie4Li04LmI4Lih4LmD4Lir4Lih',
  '4LmICiAgb3Blbk1vZGFsKG9wdHMudGl0bGUsCiAgICBmaWVsZHNIdG1sKG9wdHMuZmllbGRzLCByZWMpLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgIChyZWMu',
  'aWQgJiYgb3B0cy5vbkRlbGV0ZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4gZGdyIiBpZD0iZkRlbCI+4Lil4Lia4Lij4Liy4Lii4LiB4Liy4Lij4LiZ4Li14LmJPC9idXR0b24+JyA6ICcnKSArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgaWQ9ImZTYXZlIj4n',
  'ICsgKHJlYy5pZCA/ICfguJrguLHguJnguJfguLbguIHguIHguLLguKPguYHguIHguYnguYTguIInIDogJ+C4muC4seC4meC4l+C4tuC4gScpICsgJzwvYnV0dG9uPicsCiAgICBvcHRzLndpZGUpOwoKICBpZiAocmVjLmlkICYmIG9wdHMub25EZWxldGUpIHsKICAg',
  'IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmRGVsJykub25jbGljayA9IGZ1bmN0aW9uKCl7IGNsb3NlTW9kYWwoKTsgb3B0cy5vbkRlbGV0ZShyZWMuaWQpOyB9OwogIH0KCiAgcmVjYWxjU3VtcygpOwogIHJlY2FsY0JpbGwoKTsKCiAgZG9jdW1lbnQuZ2V0RWxl',
  'bWVudEJ5SWQoJ2ZTYXZlJykub25jbGljayA9IGZ1bmN0aW9uKCl7CiAgICB2YXIgYnRuID0gdGhpczsKICAgIGJ0bi5kaXNhYmxlZCA9IHRydWU7CiAgICBidG4uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C4',
  'muC4seC4meC4l+C4tuC4geKApic7CgogICAgcmVhZEZvcm0ob3B0cy5maWVsZHMsIG9wdHMuYnVja2V0IHx8ICdtaXNjJykudGhlbihmdW5jdGlvbihkYXRhKXsKICAgICAgdmFyIG1pc3NpbmcgPSBvcHRzLmZpZWxkcy5maWx0ZXIoZnVuY3Rpb24oZil7CiAgICAg',
  'ICAgcmV0dXJuIGYucmVxdWlyZWQgJiYgKGRhdGFbZi5rZXldID09IG51bGwgfHwgZGF0YVtmLmtleV0gPT09ICcnKTsKICAgICAgfSk7CiAgICAgIGlmIChtaXNzaW5nLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKCfguIHguKPguLjguJPguLLguIHguKPguK3guIE6',
  'ICcgKyBtaXNzaW5nLm1hcChmdW5jdGlvbihmKXsgcmV0dXJuIGYubGFiZWw7IH0pLmpvaW4oJywgJykpOwoKICAgICAgdmFyIHJlY29yZCA9IE9iamVjdC5hc3NpZ24oe30sIG9wdHMuYmFzZSB8fCB7fSwgZGF0YSk7CiAgICAgIGlmIChyZWMuaWQpIHJlY29yZC5p',
  'ZCA9IHJlYy5pZDsKICAgICAgcmV0dXJuIGNhbGxBcGkob3B0cy5hY3Rpb24sIE9iamVjdC5hc3NpZ24oeyByZWNvcmQ6IHJlY29yZCB9LCBvcHRzLmV4dHJhIHx8IHt9KSk7CiAgICB9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICAgIGNsb3NlTW9kYWwoKTsKICAgICAg',
  'Ly8g4LiV4Lix4Lin4Lia4Lit4LiB4Liq4LiW4Liy4LiZ4Liw4Lih4Li44Lih4LiC4Lin4Liy4Lia4LiZ4LiC4Li24LmJ4LiZICLguJrguLHguJnguJfguLbguIHguYHguKXguYnguKciIOC5g+C4q+C5ieC4reC4ouC4ueC5iOC5geC4peC5ieC4pyDguIjguLbguIfg',
  'uYTguKHguYjguJXguYnguK3guIfguYDguJTguYnguIcgdG9hc3Qg4LiL4LmJ4LizCiAgICAgIC8vIOC5geC4peC5ieC4p+C4i+C4tOC4h+C4geC5jOC5gOC4h+C4teC4ouC4miDguYYg4LmE4Lih4LmI4Lil4LmJ4Liy4LiH4Lir4LiZ4LmJ4Liy4LmB4Lil4Liw4LmE',
  '4Lih4LmI4LmA4LiU4LmJ4LiH4LiB4Lil4Lix4Lia4LmE4Lib4Lia4LiZ4Liq4Li44LiUCiAgICAgIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKICAgICAgLy8g4Lif4Lit4Lij4LmM4Lih4LiX4Li14LmI4LmA4Lib4Li04LiU4Lih4Liy4LiI4Liy4LiB4Lir4LiZ4LmJ',
  '4Liy4LiV4LmI4Liy4LiH4Lit4Li34LmI4LiZICjguYDguIrguYjguJkg4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZ4LmD4LiZ4Lir4LiZ4LmJ4Liy4Lir4LmJ4Lit4LiHKSDguILguK3guYDguJvguLTguJTguKvguJnguYnguLLguJnguLHguYnguJnguIHguKXg',
  'uLHguJrguITguLfguJkKICAgICAgaWYgKHR5cGVvZiBvcHRzLmFmdGVyID09PSAnZnVuY3Rpb24nKSBvcHRzLmFmdGVyKCk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgYnRuLmRpc2FibGVkID0gZmFsc2U7CiAgICAgIGJ0bi50ZXh0Q29udGVudCA9',
  'IHJlYy5pZCA/ICfguJrguLHguJnguJfguLbguIHguIHguLLguKPguYHguIHguYnguYTguIInIDogJ+C4muC4seC4meC4l+C4tuC4gSc7CiAgICAgIHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7CiAgICB9KTsKICB9Owp9CgovKiA9PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lit4LmI4Liy4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiI4Liy4LiB4Lij4Li54LibIChPQ1IpIOC5geC4peC5ieC4p+C4iuC5iOC4p+C4ouC4geC4o+C4reC4geC4n+C4reC4',
  'o+C5jOC4oQoKICAg4LiX4Li44LiB4LiE4LmI4Liy4LiX4Li14LmI4LmE4LiU4LmJ4LmA4Lib4LmH4LiZ4LmB4LiE4LmI4LiC4LmJ4Lit4LmA4Liq4LiZ4LitIOC4nOC4ueC5ieC5g+C4iuC5ieC4geC4lOC5gOC4leC4tOC4oeC5gOC4reC4h+C4l+C4teC4peC4sOC4',
  'iuC5iOC4reC4h+C4q+C4o+C4t+C4reC5gOC4leC4tOC4oeC4l+C4seC5ieC4h+C4q+C4oeC4lOC4geC5h+C5hOC4lOC5iQogICDguYHguKXguLDguYHguIHguYnguYTguILguJXguYjguK3guYTguJTguYnguYDguKrguKHguK0g4LmA4Lie4Lij4Liy4Liw4LiV4Lix',
  '4Lin4Lit4LmI4Liy4LiZ4Lie4Lil4Liy4LiU4LmE4LiU4LmJIOC5guC4lOC4ouC5gOC4ieC4nuC4suC4sOC4peC4suC4ouC4oeC4t+C4reC4geC4seC4muC4o+C4ueC4m+C5gOC4reC4teC4ouC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCnZhciBPQ1JfTUFYID0gOCAqIDEwMjQgKiAxMDI0OyAgIC8vIOC4o+C4ueC4m+C5g+C4q+C4jeC5iOC4geC4p+C5iOC4suC4meC4teC5ieC4quC5iOC4h+C5hOC4m+C4reC5iOC4suC4meC5geC4peC5ieC4p+C4',
  'oeC4seC4geC4q+C4oeC4lOC5gOC4p+C4peC4sgoKZnVuY3Rpb24gb2NyVXNhYmxlKCl7CiAgcmV0dXJuICEhKEZPUk0ub2NyICYmIFMuYm9vdCAmJiBTLmJvb3Quc2V0dGluZ3MgJiYgUy5ib290LnNldHRpbmdzLm9jckVuYWJsZWQpOwp9CgovKiog4Lij4Li54Lib',
  '4LmB4Lij4LiB4LiX4Li14LmI4Lie4Lit4Lit4LmI4Liy4LiZ4LmE4LiU4LmJICjguILguYnguLLguKHguYTguJ/guKXguYzguYPguKvguI3guYjguYDguIHguLTguJnguYHguKXguLDguYTguJ/guKXguYzguJfguLXguYjguYTguKHguYjguYPguIrguYjguKPguLng',
  'uJsvUERGKSAqLwpmdW5jdGlvbiBmaXJzdFJlYWRhYmxlKGZpbGVzKXsKICBmb3IgKHZhciBpID0gMDsgaSA8IGZpbGVzLmxlbmd0aDsgaSsrKSB7CiAgICB2YXIgZiA9IGZpbGVzW2ldOwogICAgaWYgKGYuc2l6ZSA8PSBPQ1JfTUFYICYmIC9eaW1hZ2VcL3xwZGYk',
  'Ly50ZXN0KGYudHlwZSB8fCAnJykpIHJldHVybiBmOwogIH0KICByZXR1cm4gbnVsbDsKfQoKLyoqCiAqIEBwYXJhbSB7c3RyaW5nfSBpZCAgaWQg4LiC4Lit4LiH4LiK4LmI4Lit4LiH4LmB4LiZ4Lia4LmE4Lif4Lil4LmMIOC5gOC4iuC5iOC4mSBmX3NsaXBzCiAq',
  'IEBwYXJhbSB7Ym9vbGVhbn0gYXV0byB0cnVlID0g4LmA4LiV4Li04Lih4LiK4LmI4Lit4LiH4LiX4Li14LmI4Lii4Lix4LiH4Lin4LmI4Liy4LiH4LmD4Lir4LmJ4LmA4Lil4Lii4LmC4LiU4Lii4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LiB4LiUCiAqLwpmdW5jdGlv',
  'biBydW5PY3IoaWQsIGF1dG8pewogIHZhciBpbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTsKICB2YXIgc2xvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkICsgJ19vY3InKTsKICBpZiAoIWlucHV0IHx8ICFzbG90KSByZXR1cm47CgogIHZh',
  'ciBmaWxlID0gZmlyc3RSZWFkYWJsZShBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChpbnB1dC5maWxlcyB8fCBbXSkpOwogIGlmICghZmlsZSkgeyBzbG90LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJoaW50IG10OCI+4LmE4Lih4LmI4Lih4Li14Lij4Li54Lib',
  '4LiX4Li14LmI4Lit4LmI4Liy4LiZ4LmE4LiU4LmJICjguKPguK3guIfguKPguLHguJrguKPguLnguJvguKDguLLguJ7guYHguKXguLAgUERGIOC5hOC4oeC5iOC5gOC4geC4tOC4mSA4IE1CKTwvZGl2Pic7IHJldHVybjsgfQoKICBzbG90LmlubmVySFRNTCA9ICc8',
  'ZGl2IGNsYXNzPSJvY3ItYm94Ij48ZGl2IGNsYXNzPSJoZCI+PHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4Lit4LmI4Liy4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiI4Liy4LiBICcgKwogICAgICAgICAgICAgICAgICAgZXNjKGZp',
  'bGUubmFtZS5zbGljZSgwLCAyOCkpICsgJ+KApjwvZGl2PjwvZGl2Pic7CgogIHJlYWRBc0RhdGFVcmwoZmlsZSkudGhlbihmdW5jdGlvbihwKXsKICAgIHJldHVybiBjYWxsQXBpKCdvY3IucmVhZCcsIHsgZGF0YVVybDogcC5kYXRhVXJsLCBtaW1lVHlwZTogcC5t',
  'aW1lVHlwZSB9KTsKICB9KS50aGVuKGZ1bmN0aW9uKHIpewogICAgc2xvdC5pbm5lckhUTUwgPSBvY3JCb3hIdG1sKGlkLCByKTsKICAgIE9DUl9MQVNUW2lkXSA9IHI7CiAgICBpZiAoYXV0bykgewogICAgICB2YXIgbiA9IG9jckFwcGx5QWxsKGlkLCB0cnVlKTsK',
  'ICAgICAgdG9hc3QobiA/ICfguK3guYjguLLguJnguKPguLnguJvguYHguKXguYnguKcg4LmA4LiV4Li04Lih4LmD4Lir4LmJICcgKyBuICsgJyDguIrguYjguK3guIcg4oCUIOC4leC4o+C4p+C4iOC4lOC4ueC4geC5iOC4reC4meC4muC4seC4meC4l+C4tuC4geC4',
  'meC4sCcgOiAn4Lit4LmI4Liy4LiZ4Lij4Li54Lib4LmB4Lil4LmJ4LinIOC5geC4leC5iOC4ouC4seC4h+C4iOC4seC4muC4hOC5iOC4suC4l+C4teC5iOC5g+C4iuC5ieC5hOC4lOC5ieC5hOC4oeC5iOC5hOC4lOC5iScsIG4gPyAnb2snIDogJycpOwogICAgfQog',
  'IH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgc2xvdC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz0ib2NyLWJveCI+PGRpdiBjbGFzcz0iaGQiPuKaoO+4jyDguK3guYjguLLguJnguKPguLnguJvguYTguKHguYjguKrguLPguYDguKPguYfguIg8L2Rpdj4nICsKICAg',
  'ICAgJzxkaXYgY2xhc3M9ImhpbnQiPicgKyBlc2MoZS5tZXNzYWdlIHx8IGUpICsgJzwvZGl2PicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20gbXQ4IiBvbmNsaWNrPSJydW5PY3IoXCcnICsgaWQgKyAnXCcpIj7guKXguK3guIfg',
  'uK3guLXguIHguITguKPguLHguYnguIc8L2J1dHRvbj48L2Rpdj4nOwogIH0pOwp9Cgp2YXIgT0NSX0xBU1QgPSB7fTsKCi8qKiDguITguYjguLLguJfguLXguYjguK3guYjguLLguJnguYTguJTguYkg4LiE4Li54LmI4LiB4Lix4Lia4LiK4LmI4Lit4LiH4LmD4LiZ',
  '4Lif4Lit4Lij4LmM4Lih4LiX4Li14LmI4LiI4Liw4LmA4Lit4Liy4LmE4Lib4LmD4Liq4LmIICovCmZ1bmN0aW9uIG9jclBhaXJzKHIpewogIHZhciBtID0gRk9STS5vY3IgfHwge307CiAgdmFyIGcgPSByLmd1ZXNzIHx8IHt9OwogIHZhciBvdXQgPSBbXTsKICBp',
  'ZiAobS5kYXRlICAgJiYgZy5kYXRlKSAgIG91dC5wdXNoKHsgZmllbGQ6IG0uZGF0ZSwgICBsYWJlbDogJ+C4p+C4seC4meC4l+C4teC5iCcsICAgICB2YWx1ZTogZy5kYXRlLCAgIHNob3c6IHRoRGF0ZShnLmRhdGUpIH0pOwogIGlmIChtLmFtb3VudCAmJiBnLmFt',
  'b3VudCkgb3V0LnB1c2goeyBmaWVsZDogbS5hbW91bnQsIGxhYmVsOiAn4LiI4Liz4LiZ4Lin4LiZ4LmA4LiH4Li04LiZJywgIHZhbHVlOiBnLmFtb3VudCwgc2hvdzogYmFodChnLmFtb3VudCkgfSk7CiAgaWYgKG0udmVuZG9yICYmIGcudmVuZG9yKSBvdXQucHVz',
  'aCh7IGZpZWxkOiBtLnZlbmRvciwgbGFiZWw6ICfguKPguYnguLLguJkv4Lic4Li54LmJ4LiC4Liy4LiiJywgdmFsdWU6IGcudmVuZG9yLCBzaG93OiBnLnZlbmRvciB9KTsKICBpZiAobS50aXRsZSAgJiYgZy50aXRsZSkgIG91dC5wdXNoKHsgZmllbGQ6IG0udGl0',
  'bGUsICBsYWJlbDogJ+C4iuC4t+C5iOC4reC4o+C4suC4ouC4geC4suC4oycsICB2YWx1ZTogZy50aXRsZSwgIHNob3c6IGcudGl0bGUgfSk7CiAgaWYgKG0ubm90ZSAgICYmIGcucmVmKSAgICBvdXQucHVzaCh7IGZpZWxkOiBtLm5vdGUsICAgbGFiZWw6ICfguYDg',
  'uKXguILguK3guYnguLLguIfguK3guLTguIcnLCAgdmFsdWU6ICfguK3guYnguLLguIfguK3guLTguIcgJyArIGcucmVmLCBzaG93OiBnLnJlZiB9KTsKICAvLyDguYPguJrguYDguKrguKPguYfguIjguKvguKXguLLguKLguKPguLLguKLguIHguLLguKMKICBpZiAo',
  'Zy5pdGVtcyAmJiBnLml0ZW1zLmxlbmd0aCA+IDEpIHsKICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9saW5lcycpKSB7CiAgICAgIC8vIOC4n+C4reC4o+C5jOC4oeC4meC4teC5ieC4oeC4teC4leC4suC4o+C4suC4h+C4o+C4suC4ouC4geC4suC4',
  'o+C4ouC5iOC4reC4oiDigJQg4LmA4LiV4Li04Lih4Lil4LiH4LiV4Liy4Lij4Liy4LiH4LmA4Lil4LiiIOC5hOC4lOC5ieC4l+C4seC5ieC4h+C4iuC4t+C5iOC4rSDguIjguLPguJnguKfguJkg4LmB4Lil4Liw4Lij4Liy4LiE4Liy4LmB4Lii4LiB4LiB4Lix4LiZ',
  'CiAgICAgIG91dC5wdXNoKHsgZmllbGQ6ICdfbGluZXMnLCBsYWJlbDogJ+C4o+C4suC4ouC4geC4suC4o+C5g+C4meC4muC4tOC4pScsIHZhbHVlOiBnLml0ZW1zLAogICAgICAgICAgICAgICAgIHNob3c6ICfguYDguJXguLTguKEgJyArIGcuaXRlbXMubGVuZ3Ro',
  'ICsgJyDguKPguLLguKLguIHguLLguKPguKXguIfguJXguLLguKPguLLguIcnLCBsaW5lczogdHJ1ZSB9KTsKICAgIH0gZWxzZSBpZiAobS50aXRsZSkgewogICAgICB2YXIgbGluZXMgPSBnLml0ZW1zLm1hcChmdW5jdGlvbihpdCwgaSl7IHJldHVybiAoaSsxKSAr',
  'ICcuJyArIGl0Lm5hbWUgKyAnICcgKyBtb25leShpdC5wcmljZSwgMikgKyAnIOC4vyc7IH0pLmpvaW4oJ1xuJyk7CiAgICAgIG91dC5wdXNoKHsgZmllbGQ6IG0udGl0bGUsIGxhYmVsOiAn4LiX4Li44LiB4Lij4Liy4Lii4LiB4Liy4LijICgnICsgZy5pdGVtcy5s',
  'ZW5ndGggKyAnKScsIHZhbHVlOiBsaW5lcywKICAgICAgICAgICAgICAgICBzaG93OiBnLml0ZW1zLmxlbmd0aCArICcg4Lij4Liy4Lii4LiB4Liy4Lij4LmD4LiZ4LmD4Lia4LmA4Liq4Lij4LmH4LiIJywgbXVsdGk6IHRydWUgfSk7CiAgICB9CiAgfQogIHJldHVy',
  'biBvdXQ7Cn0KCmZ1bmN0aW9uIG9jckJveEh0bWwoaWQsIHIpewogIHZhciBwYWlycyA9IG9jclBhaXJzKHIpOwogIGlmICghcGFpcnMubGVuZ3RoKSB7CiAgICByZXR1cm4gJzxkaXYgY2xhc3M9Im9jci1ib3giPjxkaXYgY2xhc3M9ImhkIj7wn5SOIOC4reC5iOC4',
  'suC4meC4guC5ieC4reC4hOC4p+C4suC4oeC5hOC4lOC5iSDguYHguJXguYjguKLguLHguIfguIjguLHguJrguITguYjguLLguJfguLXguYjguYPguIrguYnguYTguJTguYnguYTguKHguYjguYTguJTguYknICsKICAgICAgJzxzcGFuIGNsYXNzPSJzcCI+PGJ1dHRv',
  'biB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9Im9jclRvZ2dsZVJhdyhcJycgKyBpZCArICdcJykiPuC4lOC4ueC4guC5ieC4reC4hOC4p+C4suC4oeC4l+C4teC5iOC4reC5iOC4suC4meC5hOC4lOC5iTwvYnV0dG9uPjwvc3Bhbj48L2Rpdj4n',
  'ICsKICAgICAgJzxkaXYgY2xhc3M9Im9jci1yYXciIGlkPSInICsgaWQgKyAnX3JhdyIgaGlkZGVuPicgKyBlc2Moci50ZXh0IHx8ICco4Lin4LmI4Liy4LiHKScpICsgJzwvZGl2PjwvZGl2Pic7CiAgfQogIHJldHVybiAnPGRpdiBjbGFzcz0ib2NyLWJveCI+JyAr',
  'CiAgICAnPGRpdiBjbGFzcz0iaGQiPvCflI4g4Lit4LmI4Liy4LiZ4LiI4Liy4LiB4Lij4Li54Lib4LmE4LiU4LmJ4LmB4Lia4Lia4LiZ4Li14LmJIOKAlCDguIHguJTguYDguJXguLTguKHguIrguYjguK3guIfguJfguLXguYjguJXguYnguK3guIfguIHguLLguKMn',
  'ICsKICAgICAgJzxzcGFuIGNsYXNzPSJzcCI+JyArCiAgICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIHByaSIgb25jbGljaz0ib2NyQXBwbHlBbGwoXCcnICsgaWQgKyAnXCcpIj7guYDguJXguLTguKHguJfguLHguYnguIfguKvguKHg',
  'uJQ8L2J1dHRvbj4nICsKICAgICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9Im9jclRvZ2dsZVJhdyhcJycgKyBpZCArICdcJykiPuC4guC5ieC4reC4hOC4p+C4suC4oeC5gOC4leC5h+C4oTwvYnV0dG9uPicgKwogICAg',
  'ICAnPC9zcGFuPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9Im9jci1oaXRzIj4nICsgcGFpcnMubWFwKGZ1bmN0aW9uKHAsIGkpewogICAgICByZXR1cm4gJzxkaXYgY2xhc3M9Im9jci1oaXQiPicgKwogICAgICAgICc8c3BhbiBjbGFzcz0iayI+JyArIGVzYyhw',
  'LmxhYmVsKSArICc8L3NwYW4+JyArCiAgICAgICAgJzxzcGFuIGNsYXNzPSJ2IiB0aXRsZT0iJyArIGVzYyhwLmxpbmVzID8gcC5zaG93IDogU3RyaW5nKHAudmFsdWUpKSArICciPicgKyBlc2MocC5zaG93KSArICc8L3NwYW4+JyArCiAgICAgICAgJzxidXR0b24g',
  'dHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJvY3JBcHBseU9uZShcJycgKyBpZCArICdcJywnICsgaSArICcpIj7guYDguJXguLTguKE8L2J1dHRvbj4nICsKICAgICAgJzwvZGl2Pic7CiAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nICsKICAg',
  'ICc8ZGl2IGNsYXNzPSJvY3ItcmF3IiBpZD0iJyArIGlkICsgJ19yYXciIGhpZGRlbj4nICsgZXNjKHIudGV4dCB8fCAnKOC4p+C5iOC4suC4hyknKSArICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJoaW50IG10OCI+4LiV4Lij4Lin4LiI4LiE4Lin4Liy4Lih',
  '4LiW4Li54LiB4LiV4LmJ4Lit4LiH4LiB4LmI4Lit4LiZ4Lia4Lix4LiZ4LiX4Li24LiB4LmA4Liq4Lih4LitIOKAlCDguYHguIHguYnguYPguJnguIrguYjguK3guIfguYTguJTguYnguJXguLLguKHguJvguIHguJXguLQ8L2Rpdj4nICsKICAnPC9kaXY+JzsKfQoK',
  'ZnVuY3Rpb24gb2NyVG9nZ2xlUmF3KGlkKXsKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCArICdfcmF3Jyk7CiAgaWYgKGVsKSBlbC5oaWRkZW4gPSAhZWwuaGlkZGVuOwp9CgovKiog4LmD4Liq4LmI4LiE4LmI4Liy4Lil4LiH4LiK4LmI4Lit',
  '4LiHIOC5geC4peC5ieC4p+C5hOC4ruC5hOC4peC4leC5jOC5g+C4q+C5ieC5gOC4q+C5h+C4meC4p+C5iOC4suC4iuC5iOC4reC4h+C5hOC4q+C4meC4luC4ueC4geC5gOC4leC4tOC4oSAqLwpmdW5jdGlvbiBvY3JGaWxsKGZpZWxkS2V5LCB2YWx1ZSl7CiAgLy8g',
  '4LmA4LiV4Li04Lih4Lil4LiH4LiV4Liy4Lij4Liy4LiH4Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4LiiICjguYPguJrguYDguKrguKPguYfguIjguJfguLXguYjguKHguLXguILguK3guIfguKvguKXguLLguKLguK3guKLguYjguLLguIcpCiAgaWYgKGZpZWxk',
  'S2V5ID09PSAnX2xpbmVzJykgewogICAgdmFyIGFkZCA9ICh2YWx1ZSB8fCBbXSkubWFwKGZ1bmN0aW9uKGl0KXsKICAgICAgcmV0dXJuIHsgbmFtZTogaXQubmFtZSwgcXR5OiAxLCB1bml0OiAnJywgcHJpY2U6IE51bWJlcihpdC5wcmljZSkgfHwgMCB9OwogICAg',
  'fSk7CiAgICBpZiAoIWFkZC5sZW5ndGgpIHJldHVybiBmYWxzZTsKICAgIEZPUk0ubGluZXMgPSAoRk9STS5saW5lcyB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uKGwpeyByZXR1cm4gU3RyaW5nKGwubmFtZSB8fCAnJykudHJpbSgpOyB9KS5jb25jYXQoYWRkKTsKICAg',
  'IHJlZHJhd0xpbmVzKCk7CiAgICB2YXIgYm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfbGluZXMnKTsKICAgIGlmIChib3gpIHsKICAgICAgYm94LmNsYXNzTGlzdC5hZGQoJ29jci1maWxsZWQnKTsKICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyBi',
  'b3guY2xhc3NMaXN0LnJlbW92ZSgnb2NyLWZpbGxlZCcpOyB9LCAxNjAwKTsKICAgIH0KICAgIHJldHVybiB0cnVlOwogIH0KCiAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyArIGZpZWxkS2V5KTsKICBpZiAoIWVsKSByZXR1cm4gZmFsc2U7',
  'CiAgZWwudmFsdWUgPSB2YWx1ZTsKICBlbC5jbGFzc0xpc3QuYWRkKCdvY3ItZmlsbGVkJyk7CiAgc2V0VGltZW91dChmdW5jdGlvbigpeyBlbC5jbGFzc0xpc3QucmVtb3ZlKCdvY3ItZmlsbGVkJyk7IH0sIDE2MDApOwogIHJlY2FsY1N1bXMoKTsKICByZXR1cm4g',
  'dHJ1ZTsKfQoKZnVuY3Rpb24gb2NyQXBwbHlPbmUoaWQsIGlkeCl7CiAgdmFyIHIgPSBPQ1JfTEFTVFtpZF07CiAgaWYgKCFyKSByZXR1cm47CiAgdmFyIHAgPSBvY3JQYWlycyhyKVtpZHhdOwogIGlmIChwICYmIG9jckZpbGwocC5maWVsZCwgcC52YWx1ZSkpIHsK',
  'ICAgIHRvYXN0KHAubGluZXMgPyAn4LmA4LiV4Li04LihICcgKyBwLnZhbHVlLmxlbmd0aCArICcg4Lij4Liy4Lii4LiB4Liy4Lij4Lil4LiH4Lia4Li04Lil4LmB4Lil4LmJ4LinIOKAlCDguJXguKPguKfguIjguIjguLPguJnguKfguJnguIHguLHguJrguKPguLLg',
  'uITguLLguK3guLXguIHguITguKPguLHguYnguIcnIDogJ+C5gOC4leC4tOC4oScgKyBwLmxhYmVsICsgJ+C5geC4peC5ieC4pycsICdvaycpOwogIH0KfQoKLyoqCiAqIEBwYXJhbSB7Ym9vbGVhbn0gb25seUVtcHR5IHRydWUgPSDguYDguJXguLTguKHguYDguIng',
  'uJ7guLLguLDguIrguYjguK3guIfguJfguLXguYjguKLguLHguIfguKfguYjguLLguIcgKOC5g+C4iuC5ieC4leC4reC4meC5gOC4leC4tOC4oeC4reC4seC4leC5guC4meC4oeC4seC4leC4tAogKiAgICAgICAgICAgICAgICAgICAgICAgICAgICDguIjguLDguYTg',
  'uJTguYnguYTguKHguYjguJfguLHguJrguKrguLTguYjguIfguJfguLXguYjguJzguLnguYnguYPguIrguYnguJ7guLTguKHguJ7guYzguYTguJvguYHguKXguYnguKcpCiAqIEByZXR1cm4ge251bWJlcn0g4LiI4Liz4LiZ4Lin4LiZ4LiK4LmI4Lit4LiH4LiX4Li1',
  '4LmI4LmA4LiV4Li04Lih4LiI4Lij4Li04LiHCiAqLwpmdW5jdGlvbiBvY3JBcHBseUFsbChpZCwgb25seUVtcHR5KXsKICB2YXIgciA9IE9DUl9MQVNUW2lkXTsKICBpZiAoIXIpIHJldHVybiAwOwogIHZhciBkb25lID0ge307CiAgdmFyIG4gPSAwOwogIG9jclBh',
  'aXJzKHIpLmZvckVhY2goZnVuY3Rpb24ocCl7CiAgICBpZiAoZG9uZVtwLmZpZWxkXSkgcmV0dXJuOyAgICAgICAgICAgICAgICAgICAgICAgLy8g4LiK4LmI4Lit4LiH4LmA4LiU4Li14Lii4Lin4LiB4Lix4LiZ4LmA4LiV4Li04Lih4LiE4Lij4Lix4LmJ4LiH4LmA',
  '4LiU4Li14Lii4LinIOC5gOC4reC4suC4leC4seC4p+C5geC4o+C4gQogICAgaWYgKHAuZmllbGQgPT09ICdfbGluZXMnKSB7CiAgICAgIC8vIOC4leC4suC4o+C4suC4h+C4o+C4suC4ouC4geC4suC4o+C4ouC5iOC4reC4ojogIuC4p+C5iOC4suC4hyIg4Lir4Lih',
  '4Liy4Lii4LiW4Li24LiH4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4LiV4Lix4LmJ4LiH4LiK4Li34LmI4Lit4LmE4Lin4LmJCiAgICAgIGlmIChvbmx5RW1wdHkgJiYgKEZPUk0ubGluZXMgfHwgW10pLnNvbWUoZnVu',
  'Y3Rpb24obCl7IHJldHVybiBTdHJpbmcobC5uYW1lIHx8ICcnKS50cmltKCk7IH0pKSByZXR1cm47CiAgICB9IGVsc2UgewogICAgICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl8nICsgcC5maWVsZCk7CiAgICAgIGlmICghZWwpIHJldHVybjsK',
  'ICAgICAgaWYgKG9ubHlFbXB0eSAmJiBTdHJpbmcoZWwudmFsdWUgfHwgJycpLnRyaW0oKSAhPT0gJycpIHJldHVybjsKICAgIH0KICAgIGlmIChvY3JGaWxsKHAuZmllbGQsIHAudmFsdWUpKSB7IGRvbmVbcC5maWVsZF0gPSB0cnVlOyBuKys7IH0KICB9KTsKICBp',
  'ZiAoIW9ubHlFbXB0eSkgdG9hc3QobiA/ICfguYDguJXguLTguKHguYPguKvguYkgJyArIG4gKyAnIOC4iuC5iOC4reC4h+C5geC4peC5ieC4pyDigJQg4LiV4Lij4Lin4LiI4LiU4Li54LiB4LmI4Lit4LiZ4Lia4Lix4LiZ4LiX4Li24LiBJyA6ICfguIrguYjguK3g',
  'uIfguJfguLXguYjguIjguLDguYDguJXguLTguKHguYTguKHguYjguK3guKLguLnguYjguYPguJnguJ/guK3guKPguYzguKHguJnguLXguYknLCBuID8gJ29rJyA6ICdlcnInKTsKICByZXR1cm4gbjsKfQoKZnVuY3Rpb24gcm9vbU9wdGlvbnMoKXsgcmV0dXJuIFMu',
  'Ym9vdCA/IFMuYm9vdC5yb29tcyA6IFtdOyB9CmZ1bmN0aW9uIG9wdChuYW1lKXsgcmV0dXJuIChTLmJvb3QgJiYgUy5ib290LnNjaGVtYVtuYW1lXSkgfHwgW107IH0KZnVuY3Rpb24gdG9kYXkoKXsgcmV0dXJuIG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zbGlj',
  'ZSgwLDEwKTsgfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtRGVidChyZWMsIGxlZGdlcil7CiAgLy8g4LmA4Lil4Li34Lit4LiB4LmB4Lih4LmI4LmE4LiU4LmJ4LiI4Liy4LiB4LiX4Li44LiB4Lia4Lix4LiN4LiK4Li1IOC4ouC4geC5',
  'gOC4p+C5ieC4meC4leC4seC4p+C5gOC4reC4hwogIHZhciBhbGwgPSAoQUxMX0RFQlRTIHx8IFtdKS5maWx0ZXIoZnVuY3Rpb24oZCl7IHJldHVybiAhcmVjIHx8IGQuaWQgIT09IHJlYy5pZDsgfSk7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMu',
  'aWQgPyAn4LmB4LiB4LmJ4LmE4LiC4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJJyA6ICfguYDguJ7guLTguYjguKHguIHguYnguK3guJnguKvguJnguLXguYknLAogICAgcmVjb3JkOiByZWMsIGFjdGlvbjogJ2RlYnQuc2F2ZScsIGJhc2U6IHsgbGVkZ2VyOiBsZWRn',
  'ZXIgfSwKICAgIG9uRGVsZXRlOiBkZWxEZWJ0LAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oid0aXRsZScsICAgIGxhYmVsOifguKPguLLguKLguIHguLLguKPguKvguJnguLXguYknLCByZXF1aXJlZDp0cnVlLCBmdWxsOnRydWUsIHBoOifguYDguIrguYjguJkg',
  '4LiE4LmI4Liy4LiB4LmI4Lit4Liq4Lij4LmJ4Liy4LiHIFRoZSBNIENvcm5lciBBUCcgfSwKICAgICAgeyBrZXk6J2xlZGdlcicsICAgbGFiZWw6J+C4m+C4o+C4sOC5gOC4oOC4l+C4muC4seC4jeC4iuC4tScsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6WyfguKvg',
  'uJnguLXguYnguKvguKXguLHguIEnLCfguKvguJnguLXguYnguKPguK3guIcnXSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J2NyZWRpdG9yJywgbGFiZWw6J+C5gOC4iOC5ieC4suC4q+C4meC4teC5iScsIHBoOifguYDguIrguYjguJkg4LiE4Lij4Lit4Lia',
  '4LiE4Lij4Lix4LinIC8g4LiY4LiZ4Liy4LiE4Liy4LijIC8g4Lib4LmJ4Liy4LiV4LiyJyB9LAogICAgICB7IGtleToncGFyZW50SWQnLCBsYWJlbDon4LmA4Lib4LmH4LiZ4Liq4LmI4Lin4LiZ4Lir4LiZ4Li24LmI4LiH4LiC4Lit4LiH4LiB4LmJ4Lit4LiZ4Lir',
  '4LiZ4Li14LmJJywgdHlwZTonc2VsZWN0JywgZnVsbDp0cnVlLAogICAgICAgIG9wdGlvbnM6IGFsbC5tYXAoZnVuY3Rpb24oZCl7IHJldHVybiB7IHZhbHVlOmQuaWQsIGxhYmVsOmQudGl0bGUgKyAnICgnICsgZC5sZWRnZXIgKyAnKScgfTsgfSksCiAgICAgICAg',
  'aGludDon4LmD4LiK4LmJ4LmA4Lih4Li34LmI4Lit4LmA4LiH4Li04LiZ4LiB4LmJ4Lit4LiZ4LiZ4Li14LmJ4LmA4Lib4LmH4LiZ4LiX4Li44LiZ4LiC4Lit4LiH4Lit4Li14LiB4LiB4LmJ4Lit4LiZIOC5gOC4iuC5iOC4mSDguYDguIfguLTguJnguKLguLfguKHg',
  'uJvguYnguLLguJXguLLguYDguJvguYfguJnguKrguYjguKfguJnguKvguJnguLbguYjguIfguILguK3guIfguKvguJnguLXguYnguIvguLfguYnguK3guJfguLXguYjguJTguLTguJkg4oCUICcgKwogICAgICAgICAgICAgJ+C4iOC5iOC4suC4ouC4hOC4t+C4meC4',
  'geC5ieC4reC4meC4meC4teC5ieC5geC4peC5ieC4p+C4geC5ieC4reC4meC5geC4oeC5iOC4iOC4sOC4peC4lOC4leC4suC4oeC5hOC4m+C4lOC5ieC4p+C4oiDguYHguKXguLDguKLguK3guJTguKPguKfguKHguIjguLDguYTguKHguYjguJbguLnguIHguJnguLHg',
  'uJrguIvguYnguLMnIH0sCiAgICAgIHsga2V5OidzdGFydERhdGUnLCBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiB4LmI4Lit4Lir4LiZ4Li14LmJJywgdHlwZTonZGF0ZScgfSwKICAgICAgeyBrZXk6J3ByaW5jaXBhbCcsIGxhYmVsOifguKLguK3guJTguKvg',
  'uJnguLXguYnguJXguLHguYnguIfguJXguYnguJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHJlcXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J2ludGVyZXN0UGVyTW9udGgnLCBsYWJlbDon4LiU4Lit4LiB4LmA4Lia4Li14LmJ4Lii4LiV4LmI4Lit4LmA',
  '4LiU4Li34Lit4LiZICjguJrguLLguJcpJywgdHlwZTonbW9uZXknIH0sCiAgICAgIHsga2V5OidwbGFuUGVyTW9udGgnLCBsYWJlbDon4Lii4Lit4LiU4Lic4LmI4Lit4LiZ4LiV4LmI4Lit4LmA4LiU4Li34Lit4LiZICjguJrguLLguJcpJywgdHlwZTonbW9uZXkn',
  'IH0sCiAgICAgIHsga2V5OidkdWVEYXknLCAgIGxhYmVsOifguIHguLPguKvguJnguJTguIrguLPguKPguLAgKOC4p+C4seC4meC4l+C4teC5iOC4guC4reC4h+C5gOC4lOC4t+C4reC4mSknLCB0eXBlOidudW1iZXInLCBwaDonMjAnIH0sCiAgICAgIHsga2V5Oidz',
  'dGF0dXMnLCAgIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnZGVidFN0YXR1c2VzJyksIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5OidhbHNvSW4nLCAgIGxhYmVsOifguYHguKrguJTguIfguYPguJnguK3guLXg',
  'uIHguKvguJnguYnguLLguJTguYnguKfguKInLCB0eXBlOidzZWxlY3QnLAogICAgICAgIG9wdGlvbnM6WyB7IHZhbHVlOifguKvguJnguLXguYnguKPguK3guIcnLCBsYWJlbDon4Lir4LiZ4LmJ4Liy4Lir4LiZ4Li14LmJ4Liq4Li04LiZJyB9LCB7IHZhbHVlOifg',
  'uKvguJnguLXguYnguKvguKXguLHguIEnLCBsYWJlbDon4Lir4LiZ4LmJ4Liy4Lij4Liy4Lii4LiB4Liy4Lij4Liq4Lij4Li44Lib4Lij4Lin4LihJyB9IF0sCiAgICAgICAgaGludDon4LiB4LmJ4Lit4LiZ4LmA4LiU4Li14Lii4Lin4LiB4Lix4LiZIOC5hOC4oeC5',
  'iOC5hOC4lOC5ieC4hOC4seC4lOC4peC4reC4gSDigJQg4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4LiK4Liz4Lij4LiwIOC5geC4geC5iSDguKvguKPguLfguK3guKXguJrguIjguLLguIHguKvguJnguYnguLLguYTguKvguJkg4Lit4Li14LiB4Lir4LiZ4LmJ',
  '4Liy4LiB4LmH4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LiV4Liy4LihIMK3IOC5gOC4peC4t+C4reC4geC4q+C4meC5ieC4suC5gOC4lOC4teC4ouC4p+C4geC4seC4muC4m+C4o+C4sOC5gOC4oOC4l+C4muC4seC4jeC4iuC4teC5hOC4p+C5iSA9IOC5hOC4oeC5iOC4',
  'oeC4teC4nOC4pScgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0KICB9KTsKICBpZiAoIXJlYykgeyB2YXIgZSA9IGRvY3VtZW50LmdldEVs',
  'ZW1lbnRCeUlkKCdmX2xlZGdlcicpOyBpZiAoZSkgZS52YWx1ZSA9IGxlZGdlcjsgfQp9CgpmdW5jdGlvbiBkZWxEZWJ0KGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguIHguYnguK3guJnguKvguJnguLXguYnguJnguLXguYk/ICjguJbguYnguLLguKLguLHg',
  'uIfguKHguLXguKPguLLguKLguIHguLLguKPguIrguLPguKPguLDguKvguKPguLfguK3guIHguYnguK3guJnguKLguYjguK3guKLguJzguLnguIHguK3guKLguLnguYgg4Lij4Liw4Lia4Lia4LiI4Liw4LmE4Lih4LmI4Lii4Lit4Lih4Lil4LiaIOC5gOC4nuC4t+C5',
  'iOC4reC5hOC4oeC5iOC5g+C4q+C5ieC4ouC4reC4lOC4ouC5ieC4suC4ouC5hOC4m+C4geC5ieC4reC4meC4reC4t+C5iOC4meC5gOC4h+C4teC4ouC4miDguYYpJywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2RlYnQuZGVsZXRlJywgeyBpZDogaWQgfSkudGhl',
  'bihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgovKiA9PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguKPguLLguKLguIHguLLguKPguYLguK3guJnguYPguIrguYnguKvguJnguLXguYkKICAgPT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1EZWJ0UGF5bWVudChyZWMsIGxlZGdlcil7CiAgdmFyIGRlYnRzID0gKFMuY2FjaGVbUy5wYWdlXSAmJiBTLmNhY2hlW1MucGFnZV0uZGVidHMpIHx8IFtdOwogIG9wZW5G',
  'b3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4o+C4suC4ouC4geC4suC4o+C4iuC4s+C4o+C4sCcgOiAn4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4LmC4Lit4LiZ4LmD4LiK4LmJ4Lir4LiZ4Li14LmJJywKICAgIHJl',
  'Y29yZDogcmVjIHx8IHsgcGF5RGF0ZTogdG9kYXkoKSwgY2hhbm5lbDogJ+C5guC4reC4mSBRUicgfSwKICAgIC8vIOC5geC4geC5ieC4o+C4suC4ouC4geC4suC4o+C5gOC4lOC4tOC4oeC4hOC4h+C4muC4seC4jeC4iuC4teC5gOC4lOC4tOC4oeC5hOC4p+C5iSDi',
  'gJQg4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4Lih4Liy4LiI4Liy4LiB4Lit4Li14LiB4Lir4LiZ4LmJ4LiyICjguIHguYnguK3guJnguJfguLXguYjguYHguKrguJTguIfguKPguYjguKfguKEpIOC4leC5ieC4reC4h+C5hOC4oeC5iOC4luC4ueC4geC4ouC5',
  'ieC4suC4ouC4muC4seC4jeC4iuC4tQogICAgYWN0aW9uOiAnZGVidC5zYXZlUGF5bWVudCcsIGJhc2U6IHsgbGVkZ2VyOiAocmVjICYmIHJlYy5sZWRnZXIpIHx8IGxlZGdlciB9LCBidWNrZXQ6ICdkZWJ0JywKICAgIG9jcjogeyBkYXRlOidwYXlEYXRlJywgYW1v',
  'dW50OidwcmluY2lwYWwnLCBub3RlOidub3RlJyB9LAogICAgb25EZWxldGU6IGRlbERlYnRQYXltZW50LAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5OidwYXlEYXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4iuC4s+C4o+C4sCcsIHR5cGU6J2RhdGUn',
  'LCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidjaGFubmVsJywgbGFiZWw6J+C4iuC5iOC4reC4h+C4l+C4suC4hycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdwYXlDaGFubmVscycpIH0sCiAgICAgIHsga2V5OidwcmluY2lwYWwnLCBsYWJlbDon',
  '4LmA4LiH4Li04LiZ4LiV4LmJ4LiZICjguJrguLLguJcpJywgdHlwZTonbW9uZXknLCBzdW1zOnRydWUsCiAgICAgICAgaGludDon4Liq4LmI4Lin4LiZ4LiX4Li14LmI4LmE4Lib4Lil4LiU4Lii4Lit4LiU4Lir4LiZ4Li14LmJ4LiI4Lij4Li04LiHJyB9LAogICAg',
  'ICB7IGtleTonaW50ZXJlc3QnLCAgbGFiZWw6J+C4lOC4reC4geC5gOC4muC4teC5ieC4oiAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5Jywgc3Vtczp0cnVlLAogICAgICAgIGhpbnQ6J+C5hOC4oeC5iOC4luC4ueC4geC4meC4s+C5hOC4m+C4peC4lOC4ouC4reC4',
  'lOC4q+C4meC4teC5iScgfSwKICAgICAgeyBrZXk6J190b3RhbCcsICBsYWJlbDon4Lij4Lin4Lih4LiX4Li14LmI4LmC4Lit4LiZJywgdHlwZTonY29tcHV0ZWQnLCBmcm9tOlsncHJpbmNpcGFsJywnaW50ZXJlc3QnXSwKICAgICAgICBoaW50OifguJXguKPguKfg',
  'uIjguYPguKvguYnguJXguKPguIfguIHguLHguJrguKLguK3guJTguYPguJnguKrguKXguLTguJsgwrcg4Lij4Liw4Lia4Lia4LiE4Li04LiU4LmD4Lir4LmJ4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0JyB9LAogICAgICB7IGtleTonaW5zdGFsbG1lbnQnLCBs',
  'YWJlbDon4LiH4Lin4LiU4LiX4Li14LmIJywgcGg6J+C5gOC4iuC5iOC4mSA5LzIwMjYnIH0sCiAgICAgIHsga2V5OidkZWJ0SWQnLCAgbGFiZWw6J+C4nOC4ueC4geC4geC4seC4muC4geC5ieC4reC4meC4q+C4meC4teC5iScsIHR5cGU6J3NlbGVjdCcsCiAgICAg',
  'ICAgb3B0aW9uczogZGVidHMubWFwKGZ1bmN0aW9uKGQpeyByZXR1cm4geyB2YWx1ZTpkLmlkLCBsYWJlbDpkLnRpdGxlIH07IH0pLAogICAgICAgIGhpbnQ6J+C5gOC4p+C5ieC4meC4p+C5iOC4suC4h+C5hOC4lOC5iSDigJQg4Lij4Liw4Lia4Lia4LiV4Lix4LiU',
  '4LiB4LmJ4Lit4LiZ4LmA4LiB4LmI4Liy4LiB4LmI4Lit4LiZ4LmD4Lir4LmJ4LmA4Lit4LiHIMK3IOC5gOC4peC4t+C4reC4geC4geC5ieC4reC4meC4l+C4teC5iOC4oeC4suC4iOC4suC4geC4reC4teC4geC4q+C4meC5ieC4siDguKLguK3guJTguIjguLDguYDg',
  'uILguYnguLLguJfguLHguYnguIfguKrguK3guIfguKvguJnguYnguLInIH0sCiAgICAgIHsga2V5OidwYXllcicsICAgbGFiZWw6J+C4nOC4ueC5ieC4iuC4s+C4o+C4sCcgfSwKICAgICAgeyBrZXk6J3NsaXBzJywgICBsYWJlbDon4Liq4Lil4Li04Lib4LiB4Liy',
  '4Lij4LmC4Lit4LiZJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgovKioKICog',
  '4Lii4Lit4LiU4LmD4LiZ4Lij4Liw4Lia4Lia4LmE4Lih4LmI4LiV4Lij4LiH4LiB4Lix4Lia4Lii4Lit4LiU4LiX4Li14LmI4LmA4LiI4LmJ4Liy4Lir4LiZ4Li14LmJ4LmB4LiI4LmJ4LiHIOKGkiDguIHguKPguK3guIHguKLguK3guJTguITguIfguYDguKvguKXg',
  'uLfguK3guIjguKPguLTguIcg4Lij4Liw4Lia4Lia4Lia4Lix4LiZ4LiX4Li24LiB4Liq4LmI4Lin4LiZ4LiV4LmI4Liy4LiH4LmD4Lir4LmJCiAqIOC5hOC4oeC5iOC5hOC4m+C5geC4geC5ieC4ouC4reC4lOC4leC4seC5ieC4h+C4leC5ieC4mSDguYDguJ7guKPg',
  'uLLguLDguJvguKPguLDguKfguLHguJXguLTguIjguLDguYDguJ7guLXguYnguKLguJkg4Lij4Liy4Lii4LiB4Liy4Lij4Lib4Lij4Lix4Lia4Lii4Lit4LiU4Lil4Lia4LiX4Li04LmJ4LiH4LmE4LiU4LmJ4LiW4LmJ4Liy4LiB4Lij4Lit4LiB4Lic4Li04LiUCiAq',
  'LwpmdW5jdGlvbiBmb3JtUmVjb25jaWxlRGVidCh4KXsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogJ+C4m+C4o+C4seC4muC4ouC4reC4lOC5g+C4q+C5ieC4leC4o+C4h+C4ouC4reC4lOC4iOC4o+C4tOC4hyDCtyAnICsgeC50aXRsZSwKICAgIHJlY29yZDogeyBw',
  'YXlEYXRlOiB0b2RheSgpIH0sCiAgICBhY3Rpb246ICdkZWJ0LnJlY29uY2lsZScsIGJhc2U6IHsgZGVidElkOiB4LmlkIH0sCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J2FjdHVhbFJlbWFpbmluZycsIGxhYmVsOifguKLguK3guJTguITguIfguYDguKvguKXg',
  'uLfguK3guIjguKPguLTguIfguJXguK3guJnguJnguLXguYkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHJlcXVpcmVkOnRydWUsIGZ1bGw6dHJ1ZSwKICAgICAgICBoaW50OifguYPguJnguKPguLDguJrguJrguJXguK3guJnguJnguLXguYnguITguIfguYDg',
  'uKvguKXguLfguK0gPGI+JyArIGJhaHQoeC5yZW1haW5pbmcpICsgJzwvYj4gwrcg4LiW4LmJ4Liy4Lib4Li04LiU4Lir4LiZ4Li14LmJ4LiB4LmJ4Lit4LiZ4LiZ4Li14LmJ4LmB4Lil4LmJ4LinIOC5g+C4quC5iCAwJyB9LAogICAgICB7IGtleToncGF5RGF0ZScs',
  'IGxhYmVsOifguJMg4Lin4Lix4LiZ4LiX4Li14LmIJywgdHlwZTonZGF0ZScsIHJlcXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICBsYWJlbDon4Liq4Liy4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUsCiAgICAgICAg',
  'cGg6J+C5gOC4iuC5iOC4mSDguKHguLXguIfguKfguJTguJfguLXguYjguYTguKHguYjguYTguJTguYnguJrguLHguJnguJfguLbguIHguYTguKfguYkgLyDguYDguIjguYnguLLguKvguJnguLXguYnguKXguJTguYPguKvguYknLAogICAgICAgIGhpbnQ6J+C4o+C4',
  'sOC4muC4muC4muC4seC4meC4l+C4tuC4geC4quC5iOC4p+C4meC4leC5iOC4suC4h+C5gOC4m+C5h+C4meC4o+C4suC4ouC4geC4suC4o+C4iuC5iOC4reC4h+C4l+C4suC4hyAi4Lib4Lij4Lix4Lia4Lii4Lit4LiUIiDguJzguLnguIHguIHguLHguJrguIHguYng',
  'uK3guJnguJnguLXguYkgJyArCiAgICAgICAgICAgICAn4LmE4Lih4LmI4LiZ4Lix4Lia4LmA4Lib4LmH4LiZ4Lii4Lit4LiU4Lic4LmI4Lit4LiZ4Lij4Liy4Lii4Lib4Li14LmB4Lil4Liw4LmE4Lih4LmI4LmD4LiK4LmJ4LiE4Liy4LiU4LiB4Liy4Lij4LiT4LmM',
  '4Lin4Lix4LiZ4Lib4Li04LiU4Lir4LiZ4Li14LmJIMK3IOC4geC4o+C4reC4geC4nOC4tOC4lOC4geC5h+C4peC4muC4o+C4suC4ouC4geC4suC4o+C4meC4seC5ieC4meC4l+C4tOC5ieC4h+C5hOC4lOC5iScgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxE',
  'ZWJ0UGF5bWVudChpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4Lij4Liy4Lii4LiB4Liy4Lij4LiK4Liz4Lij4Liw4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdkZWJ0LmRlbGV0ZVBheW1lbnQnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0',
  'aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3guKPguYzguKE6IOC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybVB1cmNoYXNlKHJlYyl7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4LitJyA6ICfguYDguJ7g',
  'uLTguYjguKHguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcnLAogICAgcmVjb3JkOiByZWMgfHwgeyBidXlEYXRlOiB0b2RheSgpIH0sCiAgICBhY3Rpb246ICdwdXJjaGFzZS5zYXZlJywgYnVja2V0OiAncHVyY2hhc2VzJywgd2lkZTogdHJ1',
  'ZSwKICAgIG9jcjogeyBkYXRlOididXlEYXRlJywgYW1vdW50OidwcmljZScsIHZlbmRvcjondmVuZG9yJywgdGl0bGU6J2l0ZW0nIH0sCiAgICBvbkRlbGV0ZTogZGVsUHVyY2hhc2UsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J2l0ZW0nLCAgICBsYWJlbDon',
  '4LiK4Li34LmI4Lit4Lia4Li04LilIC8g4Lij4Liy4Lii4LiB4Liy4Lij4Lir4Lil4Lix4LiBJywgdHlwZTondGV4dGFyZWEnLCByZXF1aXJlZDp0cnVlLCBmdWxsOnRydWUsCiAgICAgICAgcGg6J+C5gOC4iuC5iOC4mSDguKrguLHguYjguIfguILguK3guIfguYDg',
  'uILguYnguLLguKvguK0gU2hvcGVlIOC4o+C5ieC4suC4mSBBQkMnLAogICAgICAgIGhpbnQ6J+C4luC5ieC4suC5g+C4quC5iOC4o+C4suC4ouC4geC4suC4o+C4ouC5iOC4reC4ouC4guC5ieC4suC4h+C4peC5iOC4suC4h+C5hOC4p+C5iSDguYHguKXguYnguKfg',
  'uYDguKfguYnguJnguIrguYjguK3guIfguJnguLXguYnguKfguYjguLLguIcg4Lij4Liw4Lia4Lia4LiI4Liw4LiV4Lix4LmJ4LiH4LiK4Li34LmI4Lit4LmD4Lir4LmJ4LmA4Lit4LiH4LiI4Liy4LiB4Lij4Liy4Lii4LiB4Liy4Lij4LmB4Lij4LiBJyB9LAogICAg',
  'ICB7IGtleTonYnV5RGF0ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguIvguLfguYnguK0nLCB0eXBlOidkYXRlJywgcmVxdWlyZWQ6dHJ1ZSB9LAogICAgICB7IGtleTonY2F0ZWdvcnknLCBsYWJlbDon4Lir4Lih4Lin4LiU4Lir4Lih4Li54LmIJywgdHlw',
  'ZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ3B1cmNoYXNlQ2F0ZWdvcmllcycpIH0sCgogICAgICB7IGtleTonbGluZXMnLCAgIGxhYmVsOifguKPguLLguKLguIHguLLguKPguYPguJnguJrguLTguKUgKOC4i+C4t+C5ieC4reC4l+C4teC5gOC4lOC4teC4ouC4p+C4',
  'q+C4peC4suC4ouC4reC4ouC5iOC4suC4h+C5g+C4quC5iOC4leC4o+C4h+C4meC4teC5iSknLCB0eXBlOidsaW5lcycsIGZ1bGw6dHJ1ZSwKICAgICAgICBoaW50OifguKrguLHguYjguIfguK3guK3guJnguYTguKXguJnguYzguITguKPguLHguYnguIfguYDguJTg',
  'uLXguKLguKfguYTguJTguYnguILguK3guIfguKvguKXguLLguKLguK3guKLguYjguLLguIcg4LmD4Liq4LmI4LmB4Lii4LiB4LiX4Li14Lil4Liw4Lij4Liy4Lii4LiB4Liy4Lij4LmE4LiU4LmJ4LmA4Lil4LiiIMK3IOC4o+C4sOC4muC4muC4o+C4p+C4oeC4o+C4',
  'suC4hOC4suC5g+C4q+C5ieC4reC4seC4leC5guC4meC4oeC4seC4leC4tCcgfSwKICAgICAgeyBrZXk6J3NoaXBwaW5nJywgbGFiZWw6J+C4hOC5iOC4suC4quC5iOC4hyAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JywgcGg6JzAnLCBvbmlucHV0OidyZWNhbGNC',
  'aWxsKCknIH0sCiAgICAgIHsga2V5OidkaXNjb3VudCcsIGxhYmVsOifguKrguYjguKfguJnguKXguJQgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHBoOicwJywgb25pbnB1dDoncmVjYWxjQmlsbCgpJyB9LAogICAgICB7IGtleToncHJpY2UnLCAgIGxhYmVs',
  'OifguKPguLLguITguLLguKPguKfguKHguJfguLHguYnguIfguJrguLTguKUgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHJlcXVpcmVkOnRydWUsCiAgICAgICAgaGludDonPHNwYW4gaWQ9ImJpbGxIaW50Ij48L3NwYW4+JyB9LAogICAgICB7IGtleTonb3Jk',
  'ZXJObycsIGxhYmVsOifguYDguKXguILguJfguLXguYjguITguLPguKrguLHguYjguIfguIvguLfguYnguK0nLCBwaDon4LmA4Lil4LiC4Lit4Lit4Lij4LmM4LmA4LiU4Lit4Lij4LmM4LiI4Liy4LiBIFNob3BlZSAvIExhemFkYScgfSwKICAgICAgeyBrZXk6J3Zl',
  'bmRvcicsICBsYWJlbDon4LmB4Lir4Lil4LmI4LiH4LiX4Li14LmI4LiL4Li34LmJ4LitJywgcGg6J1Nob3BlZSAvIOC5hOC4l+C4p+C4seC4quC4lOC4uCAvIOC4o+C5ieC4suC4meKApicgfSwKICAgICAgeyBrZXk6J3BheWVyJywgICBsYWJlbDon4Lic4Li54LmJ',
  '4LiK4Liz4Lij4LiwJyB9LAogICAgICB7IGtleTond2FycmFudHlNb250aHMnLCBsYWJlbDon4Lij4Liw4Lii4Liw4LmA4Lin4Lil4Liy4Lij4Lix4Lia4Lib4Lij4Liw4LiB4Lix4LiZICjguYDguJTguLfguK3guJkpJywgdHlwZTonbnVtYmVyJywKICAgICAgICBo',
  'aW50OifguKPguLDguJrguJrguIjguLDguITguLPguJnguKfguJPguKfguLHguJnguKvguKHguJTguJvguKPguLDguIHguLHguJnguYPguKvguYnguK3guLHguJXguYLguJnguKHguLHguJXguLQnIH0sCiAgICAgIHsga2V5Oidyb29tJywgICAgbGFiZWw6J+C4q+C5',
  'ieC4reC4hy/guJ7guLfguYnguJnguJfguLXguYjguJfguLXguYjguYPguIrguYknLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOlsn4Liq4LmI4Lin4LiZ4LiB4Lil4Liy4LiHJ10uY29uY2F0KHJvb21PcHRpb25zKCkpIH0sCiAgICAgIHsga2V5OidwaG90b3MnLCAg',
  'bGFiZWw6J+C4oOC4suC4nuC4m+C4o+C4sOC4geC4reC4muC4quC4tOC4meC4hOC5ieC4sicsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5OidzbGlwcycsICAgbGFiZWw6J+C4quC4peC4tOC4m+C4geC4suC4o+C5guC4reC4meC4iuC4s+C4',
  'o+C4sCcsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0KICB9KTsKfQoKZnVuY3Rpb24gZGVsUHVy',
  'Y2hhc2UoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4meC4teC5iT8nLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgncHVyY2hhc2UuZGVsZXRlJywgeyBpZDogaWQgfSkudGhlbihmdW5jdGlvbigpeyB0',
  'b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguKXguYnguLLguIfguYHguK3guKPguYwKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICov',
  'CmZ1bmN0aW9uIGZvcm1BYyhyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4o+C4suC4ouC4geC4suC4o+C4peC5ieC4suC4h+C5geC4reC4o+C5jCcgOiAn4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy',
  '4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJywKICAgIHJlY29yZDogcmVjIHx8IHsgYm9va0RhdGU6IHRvZGF5KCkgfSwKICAgIGFjdGlvbjogJ2FjLnNhdmUnLCBidWNrZXQ6ICdhYycsCiAgICBvY3I6IHsgZGF0ZTonc2VydmljZURhdGUnLCBhbW91bnQ6J2Nv',
  'c3QnLCB2ZW5kb3I6J3RlY2huaWNpYW4nIH0sCiAgICBvbkRlbGV0ZTogZGVsQWMsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3Jvb20nLCAgICAgICAgbGFiZWw6J+C4q+C5ieC4reC4hycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6cm9vbU9wdGlvbnMoKSwg',
  'cmVxdWlyZWQ6dHJ1ZSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J3JvdW5kJywgICAgICAgbGFiZWw6J+C4o+C4reC4muC4l+C4teC5iCcsIHR5cGU6J251bWJlcicsIGhpbnQ6J+C5gOC4p+C5ieC4meC4p+C5iOC4suC4h+C5g+C4q+C5ieC4o+C4sOC4muC4',
  'muC4meC4seC4muC4leC5iOC4reC4iOC4suC4geC4o+C4reC4muC4peC5iOC4suC4quC4uOC4lOC4guC4reC4h+C4m+C4teC4meC4seC5ieC4mScgfSwKICAgICAgeyBrZXk6J2Jvb2tEYXRlJywgICAgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4meC4seC4lOC4',
  'peC5ieC4suC4h+C5geC4reC4o+C5jCcsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidzZXJ2aWNlRGF0ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguJTguLPguYDguJnguLTguJnguIHguLLguKPguIjguKPguLTguIcnLCB0eXBlOidkYXRlJywgaGlu',
  'dDon4LiB4Lij4Lit4LiB4LmA4Lih4Li34LmI4Lit4Lil4LmJ4Liy4LiH4LmA4Liq4Lij4LmH4LiI4LmB4Lil4LmJ4LinJyB9LAogICAgICB7IGtleTonc3RhdHVzJywgICAgICBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpv',
  'cHQoJ2FjU3RhdHVzZXMnKSB9LAogICAgICB7IGtleTondGVjaG5pY2lhbicsICBsYWJlbDon4LiK4LmI4Liy4LiHIC8g4Lic4Li54LmJ4LmD4Lir4LmJ4Lia4Lij4Li04LiB4Liy4LijJyB9LAogICAgICB7IGtleTonY29zdCcsICAgICAgICBsYWJlbDon4LiE4LmI',
  '4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiICjguJrguLLguJcpJywgdHlwZTonbW9uZXknIH0sCiAgICAgIHsga2V5OidwaG90b3MnLCAgICAgIGxhYmVsOifguKDguLLguJ7guJvguKPguLDguIHguK3guJonLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAg',
  'ICB7IGtleTonbm90ZScsICAgICAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxBYyhpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4Lij4Liy',
  '4Lii4LiB4Liy4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdhYy5kZWxldGUnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBs',
  'b2FkKHsgcXVpZXQ6IHRydWUgfSk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qKiDguJnguLHguJTguKXguYnguLLguIfguYHguK3guKPguYzguKvguKXguLLguKLguKvguYnguK3g',
  'uIfguJ7guKPguYnguK3guKHguIHguLHguJkgKi8KZnVuY3Rpb24gZm9ybUJ1bGtBYygpewogIHZhciByb29tcyA9IHJvb21PcHRpb25zKCk7CiAgdmFyIGJvZHkgPQogICAgJzxkaXYgY2xhc3M9ImZncmlkIj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJl',
  'bD7guKfguLHguJnguJfguLXguYjguJnguLHguJQgPHNwYW4gc3R5bGU9ImNvbG9yOnZhcigtLWRhbmdlcikiPio8L3NwYW4+PC9sYWJlbD4nICsKICAgICAgICAnPGlucHV0IHR5cGU9ImRhdGUiIGNsYXNzPSJpbnAiIGlkPSJia19kYXRlIiB2YWx1ZT0iJyArIHRv',
  'ZGF5KCkgKyAnIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7guIrguYjguLLguIcgLyDguJzguLnguYnguYPguKvguYnguJrguKPguLTguIHguLLguKM8L2xhYmVsPjxpbnB1dCBjbGFzcz0iaW5wIiBpZD0iYmtfdGVjaCI+PC9kaXY+JyAr',
  'CiAgICAgICc8ZGl2IGNsYXNzPSJmIj48bGFiZWw+4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4LiV4LmI4Lit4Lir4LmJ4Lit4LiHICjguJrguLLguJcpPC9sYWJlbD48aW5wdXQgdHlwZT0ibnVtYmVyIiBjbGFzcz0iaW5wIiBpZD0iYmtfY29zdCI+PC9k',
  'aXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIj48bGFiZWw+4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4PC9sYWJlbD48aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImJrX25vdGUiPjwvZGl2PicgKwogICAgJzwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImhyIj48L2Rp',
  'dj4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbWI4Ij48YiBjbGFzcz0iZnMxMyI+4LmA4Lil4Li34Lit4LiB4Lir4LmJ4Lit4LiHPC9iPjxzcGFuIGNsYXNzPSJzcCI+PC9zcGFuPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJidWxr',
  'UGljayhcJ2FsbFwnKSI+4LiX4Lix4LmJ4LiH4Lir4Lih4LiUPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImJ1bGtQaWNrKFwnbm9uZVwnKSI+4Lil4LmJ4Liy4LiHPC9idXR0b24+JyArCiAgICAgIFsxLDIsMyw0LDVd',
  'Lm1hcChmdW5jdGlvbihmKXsgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImJ1bGtQaWNrKCcgKyBmICsgJykiPuC4iuC4seC5ieC4mSAnICsgZiArICc8L2J1dHRvbj4nOyB9KS5qb2luKCcnKSArCiAgICAnPC9kaXY+JyArCiAgICAnPGRp',
  'diBjbGFzcz0icm9vbXMiIGlkPSJia1Jvb21zIj4nICsgcm9vbXMubWFwKGZ1bmN0aW9uKHIpewogICAgICByZXR1cm4gJzxsYWJlbCBjbGFzcz0icm9vbSIgc3R5bGU9ImN1cnNvcjpwb2ludGVyIj48aW5wdXQgdHlwZT0iY2hlY2tib3giIGNsYXNzPSJiayIgdmFs',
  'dWU9IicgKyByICsgJyI+IDxiPicgKyByICsgJzwvYj48L2xhYmVsPic7CiAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwoKICBvcGVuTW9kYWwoJ/Cfk4Ug4LiZ4Lix4LiU4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4Lir4Lil4Liy4Lii4Lir4LmJ4Lit4LiH4Lie',
  '4Lij4LmJ4Lit4Lih4LiB4Lix4LiZJywgYm9keSwKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lii4LiB4LmA4Lil4Li04LiBPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgaWQ9ImJrU2F2ZSI+',
  '4Liq4Lij4LmJ4Liy4LiH4LiZ4Lix4LiU4Lir4Lih4Liy4LiiPC9idXR0b24+JywgdHJ1ZSk7CgogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdia1NhdmUnKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsKICAgIHZhciBwaWNrZWQgPSBBcnJheS5wcm90b3R5cGUuc2xp',
  'Y2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYms6Y2hlY2tlZCcpKS5tYXAoZnVuY3Rpb24oYyl7IHJldHVybiBjLnZhbHVlOyB9KTsKICAgIHZhciBkYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JrX2RhdGUnKS52YWx1ZTsKICAgIGlm',
  'ICghcGlja2VkLmxlbmd0aCkgcmV0dXJuIHRvYXN0KCfguYDguKXguLfguK3guIHguK3guKLguYjguLLguIfguJnguYnguK3guKIgMSDguKvguYnguK3guIcnLCAnZXJyJyk7CiAgICBpZiAoIWRhdGUpIHJldHVybiB0b2FzdCgn4LiB4Lij4Li44LiT4Liy4Lij4Liw',
  '4Lia4Li44Lin4Lix4LiZ4LiX4Li14LmI4LiZ4Lix4LiUJywgJ2VycicpOwogICAgdmFyIGJ0biA9IHRoaXM7IGJ0bi5kaXNhYmxlZCA9IHRydWU7IGJ0bi5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4Lia4Lix',
  '4LiZ4LiX4Li24LiB4oCmJzsKICAgIGNhbGxBcGkoJ2FjLmJ1bGtCb29rJywgewogICAgICByb29tczogcGlja2VkLCBib29rRGF0ZTogZGF0ZSwKICAgICAgdGVjaG5pY2lhbjogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JrX3RlY2gnKS52YWx1ZSwKICAgICAg',
  'Y29zdDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JrX2Nvc3QnKS52YWx1ZSwKICAgICAgbm90ZTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JrX25vdGUnKS52YWx1ZQogICAgfSkudGhlbihmdW5jdGlvbihuKXsKICAgICAgY2xvc2VNb2RhbCgpOyB0b2Fz',
  'dCgn4Liq4Lij4LmJ4Liy4LiH4LiZ4Lix4LiU4Lir4Lih4Liy4LiiICcgKyBuICsgJyDguKvguYnguK3guIfguYHguKXguYnguKcnLCAnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgIGJ0bi5kaXNhYmxl',
  'ZCA9IGZhbHNlOyBidG4udGV4dENvbnRlbnQgPSAn4Liq4Lij4LmJ4Liy4LiH4LiZ4Lix4LiU4Lir4Lih4Liy4LiiJzsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7CiAgICB9KTsKICB9Owp9CgpmdW5jdGlvbiBidWxrUGljayh3aGF0KXsKICBkb2N1bWVudC5x',
  'dWVyeVNlbGVjdG9yQWxsKCcuYmsnKS5mb3JFYWNoKGZ1bmN0aW9uKGMpewogICAgaWYgKHdoYXQgPT09ICdhbGwnKSBjLmNoZWNrZWQgPSB0cnVlOwogICAgZWxzZSBpZiAod2hhdCA9PT0gJ25vbmUnKSBjLmNoZWNrZWQgPSBmYWxzZTsKICAgIGVsc2UgYy5jaGVj',
  'a2VkID0gU3RyaW5nKGMudmFsdWUpLmNoYXJBdCgwKSA9PT0gU3RyaW5nKHdoYXQpOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguIvguYjg',
  'uK3guKHguYHguIvguKHguJXguLLguKHguKvguYnguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1SZXBhaXIocmVjKXsKICBvcGVuRm9ybSh7CiAgICB0aXRs',
  'ZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguIfguLLguJnguIvguYjguK3guKEnIDogJ+C5geC4iOC5ieC4h+C4i+C5iOC4reC4oSAvIOC4muC4seC4meC4l+C4tuC4geC4h+C4suC4meC4i+C5iOC4reC4oScsCiAgICByZWNvcmQ6IHJlYyB8fCB7',
  'IHJlcG9ydERhdGU6IHRvZGF5KCksIHByaW9yaXR5OiAn4Lib4LiB4LiV4Li0JyB9LAogICAgYWN0aW9uOiAncmVwYWlyLnNhdmUnLCBidWNrZXQ6ICdyb29tUmVwYWlyJywgd2lkZTogdHJ1ZSwKICAgIG9jcjogeyBkYXRlOidyZXBhaXJEYXRlJywgYW1vdW50Oidj',
  'b3N0JywgdmVuZG9yOid0ZWNobmljaWFuJywgdGl0bGU6J2l0ZW1zJyB9LAogICAgb25EZWxldGU6IGRlbFJlcGFpciwKICAgIGZpZWxkczogWwogICAgICB7IGtleToncm9vbScsICAgICAgIGxhYmVsOifguKvguYnguK3guIcnLCB0eXBlOidzZWxlY3QnLCBvcHRp',
  'b25zOnJvb21PcHRpb25zKCksIHJlcXVpcmVkOnRydWUsIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5OidjYXRlZ29yeScsICAgbGFiZWw6J+C4m+C4o+C4sOC5gOC4oOC4l+C4h+C4suC4meC4q+C4peC4seC4geC4guC4reC4h+C5g+C4muC4meC4teC5iScsIHR5',
  'cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdyZXBhaXJDYXRlZ29yaWVzJyksCiAgICAgICAgaGludDon4LmA4Lin4LmJ4LiZ4Lin4LmI4Liy4LiH4LmE4LiU4LmJIOKAlCDguKPguLDguJrguJrguYPguIrguYnguJvguKPguLDguYDguKDguJfguJfguLXguYjguJ7g',
  'uJrguJrguYjguK3guKLguJfguLXguYjguKrguLjguJTguYPguJnguYDguIrguYfguITguKXguLTguKrguJXguYzguYPguKvguYnguYDguK3guIcnIH0sCiAgICAgIHsga2V5OidpdGVtcycsICAgICAgbGFiZWw6J+C4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4',
  'leC5ieC4reC4h+C4i+C5iOC4reC4oSAo4LiV4Li04LmK4LiB4LmA4Lih4Li34LmI4Lit4LiX4Liz4LmA4Liq4Lij4LmH4LiIKScsIHR5cGU6J3RvZG8nLCByZXF1aXJlZDp0cnVlLCBmdWxsOnRydWUsCiAgICAgICAgb3B0aW9uczogb3B0KCdyZXBhaXJDYXRlZ29y',
  'aWVzJyksCiAgICAgICAgaGludDon4LmA4LiC4LmJ4Liy4LiL4LmI4Lit4Lih4LiE4Lij4Lix4LmJ4LiH4LmA4LiU4Li14Lii4Lin4Lih4Lix4LiB4LiL4LmI4Lit4Lih4Lir4Lil4Liy4Lii4LiI4Li44LiUIOC5g+C4quC5iOC5geC4ouC4geC4l+C4teC4peC4sOC4',
  'h+C4suC4meC5geC4peC4sOC5gOC4peC4t+C4reC4geC4m+C4o+C4sOC5gOC4oOC4l+C4guC4reC4h+C5geC4leC5iOC4peC4sOC4h+C4suC4meC5hOC4lOC5iSDCtyAnICsKICAgICAgICAgICAgICfguJXguLTguYrguIHguITguKPguJrguJfguLjguIHguIfguLLg',
  'uJnguYHguKXguYnguKfguKPguLDguJrguJrguIjguLDguYDguJvguKXguLXguYjguKLguJnguKrguJbguLLguJnguLDguYDguJvguYfguJkg4oCc4LmA4Liq4Lij4LmH4LiI4Liq4Li04LmJ4LiZ4oCdIOC5g+C4q+C5ieC5gOC4reC4hycgfSwKICAgICAgeyBrZXk6',
  'J3JlcG9ydERhdGUnLCBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LmB4LiI4LmJ4LiHJywgdHlwZTonZGF0ZScgfSwKICAgICAgeyBrZXk6J2Jvb2tEYXRlJywgICBsYWJlbDon4Lin4Lix4LiZ4LiZ4Lix4LiU4LiL4LmI4Lit4Lih4LmB4LiL4LihJywgdHlwZTon',
  'ZGF0ZScgfSwKICAgICAgeyBrZXk6J3JlcGFpckRhdGUnLCBsYWJlbDon4Lin4Lix4LiZ4LmA4LiC4LmJ4Liy4LiL4LmI4Lit4Lih4LmB4LiL4LihJywgdHlwZTonZGF0ZScsIGhpbnQ6J+C4geC4o+C4reC4geC5gOC4oeC4t+C5iOC4reC4i+C5iOC4reC4oeC5gOC4',
  'quC4o+C5h+C4iOC5geC4peC5ieC4pycgfSwKICAgICAgeyBrZXk6J3N0YXR1cycsICAgICBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ3JlcGFpclN0YXR1c2VzJykgfSwKICAgICAgeyBrZXk6J3ByaW9yaXR5Jywg',
  'ICBsYWJlbDon4LiE4Lin4Liy4Lih4LmA4Lij4LmI4LiH4LiU4LmI4Lin4LiZJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ3ByaW9yaXRpZXMnKSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J3RlY2huaWNpYW4nLCBsYWJlbDon4LiK4LmI4Liy4LiH',
  '4Lic4Li54LmJ4LiL4LmI4Lit4LihJyB9LAogICAgICB7IGtleTonY29zdCcsICAgICAgIGxhYmVsOifguITguYjguLLguYPguIrguYnguIjguYjguLLguKIgKOC4muC4suC4lyknLCB0eXBlOidtb25leScgfSwKICAgICAgeyBrZXk6J3Bob3Rvc0JlZm9yZScsIGxh',
  'YmVsOifguKDguLLguJ7guIHguYjguK3guJnguIvguYjguK3guKEnLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleToncGhvdG9zQWZ0ZXInLCAgbGFiZWw6J+C4oOC4suC4nuC4q+C4peC4seC4h+C4i+C5iOC4reC4oScsIHR5cGU6J2ZpbGVz',
  'JywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICAgICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0KICB9KTsKfQoKZnVuY3Rpb24gZGVsUmVwYWlyKGlkKXsKICBjb25m',
  'aXJtQWN0aW9uKCfguKXguJrguIfguLLguJnguIvguYjguK3guKHguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ3JlcGFpci5kZWxldGUnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdv',
  'aycpOyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PQogICDguJ/guK3guKPguYzguKE6IOC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVu',
  'Y3Rpb24gZm9ybUJ1aWxkaW5nKHJlYyl7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiV4Li24LiBJyA6ICfguYDguJ7guLTguYjguKHguIfguLLguJnguIvguYjguK3g',
  'uKHguYHguIvguKHguJXguLbguIHguYLguJTguKLguKPguKfguKEnLAogICAgcmVjb3JkOiByZWMgfHwgeyBib29rRGF0ZTogdG9kYXkoKSB9LAogICAgYWN0aW9uOiAnYnVpbGRpbmcuc2F2ZScsIGJ1Y2tldDogJ2J1aWxkaW5nJywgd2lkZTogdHJ1ZSwKICAgIG9j',
  'cjogeyBkYXRlOidlbmREYXRlJywgYW1vdW50Oidjb3N0JywgdmVuZG9yOidjb250cmFjdG9yJywgdGl0bGU6J3RpdGxlJyB9LAogICAgb25EZWxldGU6IGRlbEJ1aWxkaW5nLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oid6b25lJywgICAgICBsYWJlbDon4Liq',
  '4LmI4Lin4LiZ4LiC4Lit4LiH4Lit4Liy4LiE4Liy4LijJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ2J1aWxkaW5nWm9uZXMnKSwgcmVxdWlyZWQ6dHJ1ZSB9LAogICAgICB7IGtleTondGl0bGUnLCAgICAgbGFiZWw6J+C4o+C4suC4ouC4geC4suC4o+C4',
  'i+C5iOC4reC4oeC5geC4i+C4oScsIHR5cGU6J3RleHRhcmVhJywgcmVxdWlyZWQ6dHJ1ZSwgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidib29rRGF0ZScsICBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiZ4Lix4LiUJywgdHlwZTonZGF0ZScgfSwKICAgICAg',
  'eyBrZXk6J3N0YXJ0RGF0ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguYDguKPguLTguYjguKHguJTguLPguYDguJnguLTguJnguIHguLLguKMnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonZW5kRGF0ZScsICAgbGFiZWw6J+C4p+C4seC4meC4l+C4',
  'teC5iOC5geC4peC5ieC4p+C5gOC4quC4o+C5h+C4iCcsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCAgICBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ2J1aWxkaW5nU3RhdHVzZXMnKSB9LAog',
  'ICAgICB7IGtleTonY29udHJhY3RvcicsIGxhYmVsOifguJzguLnguYnguKPguLHguJrguYDguKvguKHguLIgLyDguKPguYnguLLguJknIH0sCiAgICAgIHsga2V5Oidjb3N0JywgICAgICBsYWJlbDon4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiICjguJrg',
  'uLLguJcpJywgdHlwZTonbW9uZXknIH0sCiAgICAgIHsga2V5OiduZXh0RHVlJywgICBsYWJlbDon4LiE4Lij4Lia4LiB4Liz4Lir4LiZ4LiU4Lij4Lit4Lia4LiW4Lix4LiU4LmE4LibJywgdHlwZTonZGF0ZScsIGhpbnQ6J+C5gOC4iuC5iOC4mSDguIHguLHguJng',
  'uIvguLbguKHguJTguLLguJTguJ/guYnguLLguJfguLjguIEgMyDguJvguLUg4oCUIOC5g+C4quC5iOC4p+C4seC4meC4l+C4teC5iOC4hOC4o+C4seC5ieC4h+C4luC4seC4lOC5hOC4mycgfSwKICAgICAgeyBrZXk6J3Bob3RvcycsICAgIGxhYmVsOifguKDguLLg',
  'uJ7guJvguKPguLDguIHguK3guJonLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonc2xpcHMnLCAgICAgbGFiZWw6J+C5g+C4muC5gOC4quC4o+C5h+C4iCAvIOC4quC4peC4tOC4mycsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAg',
  'ICAgIHsga2V5Oidub3RlJywgICAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxCdWlsZGluZyhpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia',
  '4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiV4Li24LiB4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdidWlsZGluZy5kZWxldGUnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBs',
  'b2FkKHsgcXVpZXQ6IHRydWUgfSk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PQogICDguJ/guK3guKPguYzguKE6IOC4guC5ieC4reC4oeC4ueC4peC4q+C5ieC4reC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybVJvb20ocmVjKXsKICBv',
  'cGVuRm9ybSh7CiAgICB0aXRsZTogJ+C4guC5ieC4reC4oeC4ueC4peC4q+C5ieC4reC4hyAnICsgKHJlYyA/IHJlYy5yb29tIDogJycpLAogICAgcmVjb3JkOiByZWMsIGFjdGlvbjogJ3Jvb20uc2F2ZScsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3Jvb20n',
  'LCAgIGxhYmVsOifguKvguYnguK3guIcnLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidmbG9vcicsICBsYWJlbDon4LiK4Lix4LmJ4LiZJywgdHlwZTonbnVtYmVyJyB9LAogICAgICB7IGtleTonc3RhdHVzJywgbGFiZWw6J+C4quC4luC4suC4meC4sCcs',
  'IHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdyb29tU3RhdHVzZXMnKSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J3RlbmFudCcsIGxhYmVsOifguIrguLfguYjguK3guJzguLnguYnguYDguIrguYjguLInIH0sCiAgICAgIHsga2V5OidwaG9uZScsICBs',
  'YWJlbDon4LmA4Lia4Lit4Lij4LmM4LiV4Li04LiU4LiV4LmI4LitJyB9LAogICAgICB7IGtleToncmVudCcsICAgbGFiZWw6J+C4hOC5iOC4suC5gOC4iuC5iOC4si/guYDguJTguLfguK3guJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScgfSwKICAgICAgeyBr',
  'ZXk6J21vdmVJbicsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguYDguILguYnguLLguK3guKLguLnguYgnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonbm90ZScsICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVh',
  'JywgZnVsbDp0cnVlIH0KICAgIF0KICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZ4Lib4Lij4Liw',
  '4LiI4Liz4Lir4LmJ4Lit4LiHCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtQXNzZXQocmVjKXsKICB2YXIgcm9vbSA9IChyZWMgJiYgcmVjLnJvb20pIHx8ICcnOwog',
  'IG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4mScgOiAn4LmA4Lie4Li04LmI4Lih4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZ4LmD4LiZ4Lir4LmJ4Lit4LiHICcg',
  'KyByb29tLAogICAgcmVjb3JkOiByZWMgfHwgeyByb29tOiByb29tLCBzdGF0dXM6ICfguYPguIrguYnguIfguLLguJnguJvguIHguJXguLQnIH0sCiAgICBhY3Rpb246ICdhc3NldC5zYXZlJywKICAgIG9uRGVsZXRlOiByZWMgJiYgcmVjLmlkID8gZGVsQXNzZXQg',
  'OiBudWxsLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oidyb29tJywgICBsYWJlbDon4Lir4LmJ4Lit4LiHJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpyb29tT3B0aW9ucygpLCByZXF1aXJlZDp0cnVlLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleTonbmFt',
  'ZScsICAgbGFiZWw6J+C4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4mScsIHJlcXVpcmVkOnRydWUsIHBoOifguYDguIrguYjguJkg4LmB4Lit4Lij4LmMIMK3IOC5gOC4hOC4o+C4t+C5iOC4reC4h+C4l+C4s+C4meC5ieC4s+C4reC4uOC5iOC4mSDCtyDguJXguLng',
  'uYnguYDguKLguYfguJknIH0sCiAgICAgIHsga2V5OidicmFuZCcsICBsYWJlbDon4Lii4Li14LmI4Lir4LmJ4LitL+C4o+C4uOC5iOC4mScgfSwKICAgICAgeyBrZXk6J3NlcmlhbCcsIGxhYmVsOidTZXJpYWwgTm8uJyB9LAogICAgICB7IGtleTonaW5zdGFsbERh',
  'dGUnLCAgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4leC4tOC4lOC4leC4seC5ieC4hycsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5Oid3YXJyYW50eUVuZCcsICBsYWJlbDon4Lib4Lij4Liw4LiB4Lix4LiZ4Lir4Lih4LiU4Lit4Liy4Lii4Li4JywgdHlw',
  'ZTonZGF0ZScgfSwKICAgICAgeyBrZXk6J3N0YXR1cycsIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnYXNzZXRTdGF0dXNlcycpLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleToncHVyY2hhc2VJZCcsIGxhYmVs',
  'OifguK3guYnguLLguIfguK3guLTguIfguKPguLLguKLguIHguLLguKPguIvguLfguYnguK0nLCBwaDon4Lij4Lir4Lix4Liq4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHICjguJbguYnguLLguKHguLUpJyB9LAogICAgICB7IGtleTonbm90',
  'ZScsICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0sCiAgICAvLyDguJ/guK3guKPguYzguKHguJnguLXguYnguYDguJvguLTguJTguIjguLLguIHguKvguJnguYnguLLguJXguYjguLLg',
  'uIfguKPguLLguKLguKXguLDguYDguK3guLXguKLguJTguKvguYnguK3guIcg4oCUIOC4muC4seC4meC4l+C4tuC4geC5gOC4quC4o+C5h+C4iOC5gOC4m+C4tOC4lOC4geC4peC4seC4muC5hOC4m+C4q+C4meC5ieC4suC5gOC4lOC4tOC4oQogICAgYWZ0ZXI6IGZ1',
  'bmN0aW9uKCl7IGlmIChyb29tICYmIHR5cGVvZiBvcGVuUm9vbSA9PT0gJ2Z1bmN0aW9uJykgb3BlblJvb20ocm9vbSk7IH0KICB9KTsKfQoKZnVuY3Rpb24gZGVsQXNzZXQoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4l+C4o+C4seC4nuC4ouC5jOC4quC4',
  'tOC4meC4iuC4tOC5ieC4meC4meC4teC5iT8nLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgnYXNzZXQuZGVsZXRlJywgeyBpZDogaWQgfSkKICAgICAgLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWll',
  'dDogdHJ1ZSB9KTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4',
  'n+C4reC4o+C5jOC4oTog4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4ouC4q+C4rQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybUZpbmFuY2Uo',
  'cmVjKXsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguKPguLLguKLguIHguLLguKMnIDogJ+C4muC4seC4meC4l+C4tuC4geC4o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKInLAogICAg',
  'cmVjb3JkOiByZWMgfHwgeyBkYXRlOiB0b2RheSgpLCBjaGFubmVsOiAn4LmC4Lit4LiZIFFSJyB9LAogICAgYWN0aW9uOiAnZmluYW5jZS5zYXZlJywgYnVja2V0OiAnbWlzYycsCiAgICBvbkRlbGV0ZTogZGVsRmluYW5jZSwKICAgIGZpZWxkczogWwogICAgICB7',
  'IGtleTona2luZCcsICAgbGFiZWw6J+C4o+C4suC4ouC4geC4suC4oycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdmaW5hbmNlS2luZHMnKSwgcmVxdWlyZWQ6dHJ1ZSwgYmxhbms6ZmFsc2UsCiAgICAgICAgaGludDon4LmA4Lil4Li34Lit4LiBICLguKPg',
  'uLLguKLguKPguLHguJrguITguYjguLLguYDguIrguYjguLIiIOC4q+C4o+C4t+C4rSAi4Lij4Liy4Lii4Lij4Lix4Lia4Lit4Li34LmI4LiZIOC5hiIg4Lij4Liw4Lia4Lia4LiI4Liw4LiZ4Lix4Lia4LmA4Lib4LmH4LiZ4Lid4Lix4LmI4LiH4Lij4Liy4Lii4Lij',
  '4Lix4Lia4LmD4Lir4LmJ4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0JyB9LAogICAgICB7IGtleTonZGF0ZScsICAgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iCcsIHR5cGU6J2RhdGUnLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidhbW91bnQnLCBs',
  'YWJlbDon4LiI4Liz4LiZ4Lin4LiZ4LmA4LiH4Li04LiZICjguJrguLLguJcpJywgdHlwZTonbW9uZXknLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidiaWxsTW9udGgnLCBsYWJlbDon4Lij4Lit4Lia4Lia4Li04Lil4LiC4Lit4LiH4LmA4LiU4Li34Lit',
  '4LiZJywgcGg6J+C5gOC4iuC5iOC4mSDguIEu4LiELiAyNTY5JyB9LAogICAgICB7IGtleTonY2hhbm5lbCcsIGxhYmVsOifguIrguYjguK3guIfguJfguLLguIcnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnZmluYW5jZUNoYW5uZWxzJykgfSwKICAgICAg',
  'eyBrZXk6J3NsaXBzJywgIGxhYmVsOifguKrguKXguLTguJsgLyDguYPguJrguYDguKrguKPguYfguIgnLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonbm90ZScsICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6',
  'J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0KICB9KTsKfQoKZnVuY3Rpb24gZGVsRmluYW5jZShpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4Lij4Liy4Lii4LiB4Liy4Lij4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdmaW5hbmNl',
  'LmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2Vycicp',
  'OyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4quC4s+C4o+C4reC4hyAvIOC4geC4ueC5ieC4hOC4t+C4meC4guC5ieC4reC4oeC4ueC4pQogICA9PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZG9FeHBvcnRKc29uKCl7CiAgdG9hc3QoJ+C4geC4s+C4peC4seC4h+C5gOC4leC4o+C4teC4ouC4oeC5hOC4n+C4peC5jOC4quC4s+C4o+C4reC4h+KA',
  'picpOwogIGNhbGxBcGkoJ2JhY2t1cC5leHBvcnQnLCB7fSkudGhlbihmdW5jdGlvbihkdW1wKXsKICAgIHNhdmVUZXh0RmlsZSgndGhlLW0tY29ybmVyLWFwLWJhY2t1cC0nICsgdG9kYXkoKSArICcuanNvbicsCiAgICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdp',
  'ZnkoZHVtcCwgbnVsbCwgMSksICdhcHBsaWNhdGlvbi9qc29uJyk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwgJ2VycicpOyB9KTsKfQoKZnVuY3Rpb24gZG9FeHBvcnRDc3Yoc2hlZXQpewogIGNhbGxBcGkoJ2JhY2t1cC5jc3Yn',
  'LCB7IHNoZWV0OiBzaGVldCB9KS50aGVuKGZ1bmN0aW9uKHIpewogICAgc2F2ZVRleHRGaWxlKHIuZmlsZW5hbWUsIHIuY29udGVudCwgJ3RleHQvY3N2Jyk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwgJ2VycicpOyB9KTsKfQoK',
  'LyoqIOC4lOC4suC4p+C4meC5jOC5guC4q+C4peC4lOC5hOC4n+C4peC5jCDigJQg4LmD4LiK4LmJIGRvd25sb2FkcyBjYXBhYmlsaXR5IOC4luC5ieC4suC4oeC4tSDguYTguKHguYjguIfguLHguYnguJnguYPguIrguYnguKXguLTguIfguIHguYzguJvguIHguJXg',
  'uLQgKi8KZnVuY3Rpb24gc2F2ZVRleHRGaWxlKGZpbGVuYW1lLCBjb250ZW50LCBtaW1lKXsKICBpZiAodHlwZW9mIHdpbmRvdy5zYXZlVmlhSG9zdCA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJuIHdpbmRvdy5zYXZlVmlhSG9zdChmaWxlbmFtZSwgY29udGVudCwgbWlt',
  'ZSk7CiAgdmFyIGJsb2IgPSBuZXcgQmxvYihbY29udGVudF0sIHsgdHlwZTogbWltZSArICc7Y2hhcnNldD11dGYtOCcgfSk7CiAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7CiAgYS5ocmVmID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTsK',
  'ICBhLmRvd25sb2FkID0gZmlsZW5hbWU7CiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhKTsgYS5jbGljaygpOwogIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgVVJMLnJldm9rZU9iamVjdFVSTChhLmhyZWYpOyBhLnJlbW92ZSgpOyB9LCAxMDAwKTsKICB0b2Fz',
  'dCgn4LiU4Liy4Lin4LiZ4LmM4LmC4Lir4Lil4LiUICcgKyBmaWxlbmFtZSArICcg4LmB4Lil4LmJ4LinJywgJ29rJyk7Cn0KCmZ1bmN0aW9uIGRvSW1wb3J0SnNvbigpewogIG9wZW5Nb2RhbCgn4qyG77iPIOC4geC4ueC5ieC4hOC4t+C4meC4iOC4suC4geC5hOC4',
  'n+C4peC5jOC4quC4s+C4o+C4reC4hycsCiAgICAnPHAgY2xhc3M9ImZzMTMiPuC5gOC4peC4t+C4reC4geC5hOC4n+C4peC5jCA8Yj4uanNvbjwvYj4g4LiX4Li14LmI4LmA4LiE4Lii4LiU4Liy4Lin4LiZ4LmM4LmC4Lir4Lil4LiU4LmE4Lin4LmJPC9wPicgKwog',
  'ICAgJzxsYWJlbCBjbGFzcz0iZmlsZS1kcm9wIiBmb3I9ImltcEZpbGUiPvCfk4Qg4LmA4Lil4Li34Lit4LiB4LmE4Lif4Lil4LmM4Liq4Liz4Lij4Lit4LiHJyArCiAgICAgICc8aW5wdXQgdHlwZT0iZmlsZSIgaWQ9ImltcEZpbGUiIGFjY2VwdD0iYXBwbGljYXRp',
  'b24vanNvbiwuanNvbiIgc3R5bGU9ImRpc3BsYXk6bm9uZSIgJyArCiAgICAgICdvbmNoYW5nZT0iZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCdpbXBOYW1lXCcpLnRleHRDb250ZW50PXRoaXMuZmlsZXNbMF0/dGhpcy5maWxlc1swXS5uYW1lOlwnXCciPjwvbGFi',
  'ZWw+JyArCiAgICAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtdDgiIGlkPSJpbXBOYW1lIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iZiI+PGxhYmVsPuC4p+C4tOC4mOC4teC4geC4ueC5ieC4hOC4t+C4',
  'mTwvbGFiZWw+JyArCiAgICAnPHNlbGVjdCBjbGFzcz0ic2VsIiBpZD0iaW1wTW9kZSI+JyArCiAgICAgICc8b3B0aW9uIHZhbHVlPSJtZXJnZSI+4LmA4Lie4Li04LmI4Lih4LmA4LiJ4Lie4Liy4Liw4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4Lii4Lix4LiH',
  '4LmE4Lih4LmI4Lih4Li1ICjguYHguJnguLDguJnguLMpPC9vcHRpb24+JyArCiAgICAgICc8b3B0aW9uIHZhbHVlPSJyZXBsYWNlIj7guKXguYnguLLguIfguILguYnguK3guKHguLnguKXguYDguJTguLTguKHguYHguKXguYnguKfguYHguJfguJnguJfguLXguYjg',
  'uJfguLHguYnguIfguKvguKHguJQ8L29wdGlvbj4nICsKICAgICc8L3NlbGVjdD48L2Rpdj4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNs',
  'YXNzPSJidG4gcHJpIiBpZD0iaW1wR28iPuC4geC4ueC5ieC4hOC4t+C4meC4guC5ieC4reC4oeC4ueC4pTwvYnV0dG9uPicpOwoKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW1wR28nKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsKICAgIHZhciBmID0gZG9jdW1l',
  'bnQuZ2V0RWxlbWVudEJ5SWQoJ2ltcEZpbGUnKS5maWxlc1swXTsKICAgIGlmICghZikgcmV0dXJuIHRvYXN0KCfguIHguKPguLjguJPguLLguYDguKXguLfguK3guIHguYTguJ/guKXguYzguIHguYjguK3guJknLCAnZXJyJyk7CiAgICB2YXIgbW9kZSA9IGRvY3Vt',
  'ZW50LmdldEVsZW1lbnRCeUlkKCdpbXBNb2RlJykudmFsdWU7CiAgICB2YXIgYnRuID0gdGhpczsgYnRuLmRpc2FibGVkID0gdHJ1ZTsgYnRuLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDguIHguLPguKXguLHguIfguIHguLnguYnguITg',
  'uLfguJnigKYnOwogICAgdmFyIHIgPSBuZXcgRmlsZVJlYWRlcigpOwogICAgci5vbmxvYWQgPSBmdW5jdGlvbigpewogICAgICB2YXIgcGFyc2VkOwogICAgICB0cnkgeyBwYXJzZWQgPSBKU09OLnBhcnNlKHIucmVzdWx0KTsgfQogICAgICBjYXRjaCAoZSkgeyBi',
  'dG4uZGlzYWJsZWQgPSBmYWxzZTsgYnRuLnRleHRDb250ZW50ID0gJ+C4geC4ueC5ieC4hOC4t+C4meC4guC5ieC4reC4oeC4ueC4pSc7IHJldHVybiB0b2FzdCgn4LmE4Lif4Lil4LmM4LmE4Lih4LmI4LmD4LiK4LmIIEpTT04g4LiX4Li14LmI4LiW4Li54LiB4LiV',
  '4LmJ4Lit4LiHJywgJ2VycicpOyB9CiAgICAgIGNhbGxBcGkoJ2JhY2t1cC5pbXBvcnQnLCB7IGRhdGE6IHBhcnNlZCwgbW9kZTogbW9kZSB9KS50aGVuKGZ1bmN0aW9uKHN0YXQpewogICAgICAgIGNsb3NlTW9kYWwoKTsKICAgICAgICB2YXIgbiA9IE9iamVjdC5r',
  'ZXlzKHN0YXQpLnJlZHVjZShmdW5jdGlvbihhLGspeyByZXR1cm4gYSArIChzdGF0W2tdfHwwKTsgfSwgMCk7CiAgICAgICAgdG9hc3QoJ+C4geC4ueC5ieC4hOC4t+C4meC4quC4s+C5gOC4o+C5h+C4iCAnICsgbiArICcg4Lij4Liy4Lii4LiB4Liy4LijJywgJ29r',
  'Jyk7CiAgICAgICAgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwogICAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTsgYnRuLnRleHRDb250ZW50ID0gJ+C4geC4ueC5ieC4hOC4t+C4meC4guC5ieC4reC4oeC4ueC4pSc7',
  'IHRvYXN0KGUubWVzc2FnZXx8ZSwgJ2VycicpOwogICAgICB9KTsKICAgIH07CiAgICByLnJlYWRBc1RleHQoZik7CiAgfTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4peC4tOC4',
  'h+C4geC5jOC5geC4iuC4o+C5jCDguYHguKXguLDguIHguLLguKPguKrguLPguKPguK3guIfguKXguIcgR29vZ2xlIERyaXZlCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKZnVuY3Rpb24g',
  'Y29weVNoYXJlKCl7CiAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NoYXJlVXJsJyk7CiAgaWYgKCFlbCkgcmV0dXJuOwogIGVsLnNlbGVjdCgpOwogIGlmIChuYXZpZ2F0b3IuY2xpcGJvYXJkKSB7CiAgICBuYXZpZ2F0b3IuY2xpcGJvYXJkLndy',
  'aXRlVGV4dChlbC52YWx1ZSkKICAgICAgLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4hOC4seC4lOC4peC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC5geC4peC5ieC4pycsJ29rJyk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbigpeyB0b2FzdCgn',
  '4LiE4Lix4LiU4Lil4Lit4LiB4LmE4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIIOKAlCDguIHguJTguITguYnguLLguIfguJfguLXguYjguIrguYjguK3guIfguYHguKXguYnguKfguYDguKXguLfguK3guIHguITguLHguJTguKXguK3guIEnLCdlcnInKTsgfSk7CiAg',
  'fSBlbHNlIHsKICAgIHRyeSB7IGRvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7IHRvYXN0KCfguITguLHguJTguKXguK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYzguYHguKXguYnguKcnLCdvaycpOyB9CiAgICBjYXRjaCAoZSkgeyB0b2FzdCgn4LiE',
  '4Lix4LiU4Lil4Lit4LiB4LmE4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIIOKAlCDguIHguJTguITguYnguLLguIfguJfguLXguYjguIrguYjguK3guIfguYHguKXguYnguKfguYDguKXguLfguK3guIHguITguLHguJTguKXguK3guIEnLCdlcnInKTsgfQogIH0KfQoK',
  'ZnVuY3Rpb24gZG9Sb3RhdGVTaGFyZSgpewogIGNvbmZpcm1BY3Rpb24oJ+C4reC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC4iuC4uOC4lOC5g+C4q+C4oeC5iD8g4LiE4LiZ4LiX4Li14LmI4LiW4Li34Lit4Lil4Li04LiH4LiB4LmM4LmA4LiU4Li0',
  '4Lih4LiI4Liw4LmA4Lib4Li04LiU4LmE4Lih4LmI4LmE4LiU4LmJ4Lit4Li14LiBJywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ3NoYXJlLnJvdGF0ZVRva2VuJywge30pLnRoZW4oZnVuY3Rpb24oKXsKICAgICAgdG9hc3QoJ+C4reC4reC4geC4peC4tOC4h+C4',
  'geC5jOC5geC4iuC4o+C5jOC4iuC4uOC4lOC5g+C4q+C4oeC5iOC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKZnVu',
  'Y3Rpb24gZG9CYWNrdXBOb3coKXsKICB0b2FzdCgn4LiB4Liz4Lil4Lix4LiH4Liq4Liz4Lij4Lit4LiH4LiC4LmJ4Lit4Lih4Li54Lil4Lil4LiHIERyaXZl4oCmJyk7CiAgY2FsbEFwaSgnYmFja3VwLmJhY2t1cE5vdycsIHt9KS50aGVuKGZ1bmN0aW9uKHIpewog',
  'ICAgdG9hc3QoJ+C4quC4s+C4o+C4reC4h+C5geC4peC5ieC4pzogJyArIHIubmFtZSwgJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7Cn0KPC9zY3JpcHQ+Cjxz',
  'Y3JpcHQ+Ym9vdCgpOzwvc2NyaXB0Pgo8L2JvZHk+CjwvaHRtbD4K'
].join('');

function indexHtml_() {
  return Utilities.newBlob(Utilities.base64Decode(INDEX_HTML_B64), 'text/html')
    .getDataAsString('UTF-8');
}
