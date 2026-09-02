/**
 * The M Corner AP — ระบบบริหารหอพัก (ไฟล์เดียวจบ)
 * ไฟล์นี้สร้างอัตโนมัติจากโฟลเดอร์ src/ เมื่อ 2026-09-02 04:57 UTC
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
var SCHEMA_VERSION = 6;

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
  if (from < 5) done.push(migrateV5RefreshRate_());

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
  obj.year = yearOf_(obj.buyDate) || obj.year || new Date().getFullYear();
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
  'IC50aGVtZS1vcHR7ZmxleC1kaXJlY3Rpb246cm93O3RleHQtYWxpZ246bGVmdDtnYXA6MTFweH0KICAudGhlbWUtb3B0IC5oaW50e2Rpc3BsYXk6bm9uZX0KfQoKLyogPT09PT09PT09PT09IOC4o+C4suC4ouC4geC4suC4o+C4ouC5iOC4reC4ouC5g+C4meC4muC4',
  'tOC4pSAo4LiL4Li34LmJ4Lit4LiX4Li14LmA4LiU4Li14Lii4Lin4Lir4Lil4Liy4Lii4Lit4Lii4LmI4Liy4LiHKSA9PT09PT09PT09PT0gKi8KLmxpbmVze2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTtwYWRk',
  'aW5nOjEwcHg7YmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpfQoubGluZS1oZWFkLC5saW5lLXJvd3sKICBkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOm1pbm1heCgwLDFmcikgODRweCA5MnB4IDEwOHB4IDk2cHggMzRweDsKICBnYXA6N3B4O2Fs',
  'aWduLWl0ZW1zOmNlbnRlcjsKfQoubGluZS1oZWFke2ZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0tbXV0ZWQpO3BhZGRpbmc6MCAycHggNnB4O2ZvbnQtd2VpZ2h0OjYwMH0KLmxpbmUtaGVhZCAubnVtLC5saW5lLXJvdyAubnVte3RleHQtYWxpZ246cmlnaHR9',
  'Ci5saW5lLXJvd3ttYXJnaW4tYm90dG9tOjZweH0KLmxpbmUtcm93IC5pbnB7cGFkZGluZzo2cHggOXB4O2ZvbnQtc2l6ZToxM3B4fQoubGluZS1yb3cgLmlucC5udW17dGV4dC1hbGlnbjpyaWdodDtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXN9Ci5s',
  'aW5lLXN1bXsKICB0ZXh0LWFsaWduOnJpZ2h0O2ZvbnQtc2l6ZToxM3B4O2ZvbnQtd2VpZ2h0OjYwMDtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7CiAgY29sb3I6dmFyKC0taW5rKTt3aGl0ZS1zcGFjZTpub3dyYXA7b3ZlcmZsb3c6aGlkZGVuOwp9',
  'Ci5saW5lLXRvdGFse21hcmdpbi1sZWZ0OmF1dG87Zm9udC1zaXplOjEzcHg7Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtc30KLmxpbmUtdG90YWwgYntjb2xvcjp2YXIoLS1pbmspfQoKLyog4Lij4Liy4Lii4LiB4Liy',
  '4Lij4Lii4LmI4Lit4Lii4LiX4Li14LmI4LiB4Liy4LiH4LiU4Li54LmD4LiZ4LiV4Liy4Lij4Liy4LiHICovCi5iaWxsLWxpbmVze21hcmdpbi10b3A6NnB4O2JvcmRlci1sZWZ0OjJweCBzb2xpZCB2YXIoLS1saW5lKTtwYWRkaW5nLWxlZnQ6OXB4fQouYmlsbC1s',
  'aW5lewogIGRpc3BsYXk6ZmxleDtnYXA6OHB4O2ZvbnQtc2l6ZToxMnB4O2NvbG9yOnZhcigtLWluay0yKTtwYWRkaW5nOjFweCAwOwogIGZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtczsKfQouYmlsbC1saW5lIC5ubXtmbGV4OjE7bWluLXdpZHRoOjA7',
  'b3ZlcmZsb3c6aGlkZGVuO3RleHQtb3ZlcmZsb3c6ZWxsaXBzaXM7d2hpdGUtc3BhY2U6bm93cmFwfQouYmlsbC1saW5lIC5xdHtjb2xvcjp2YXIoLS1mYWludCk7d2hpdGUtc3BhY2U6bm93cmFwfQouYmlsbC1saW5lIC50dHt3aGl0ZS1zcGFjZTpub3dyYXA7Zm9u',
  'dC13ZWlnaHQ6NjAwfQouYmlsbC1leHRyYXtmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLW11dGVkKTttYXJnaW4tdG9wOjNweH0KLmJpbGwtdG9nZ2xlewogIGJhY2tncm91bmQ6MDtib3JkZXI6MDtwYWRkaW5nOjA7bWFyZ2luLXRvcDozcHg7Y3Vyc29yOnBv',
  'aW50ZXI7Zm9udDppbmhlcml0OwogIGZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0tYnJhbmQpO3RleHQtYWxpZ246bGVmdDsKfQouYmlsbC10b2dnbGU6aG92ZXJ7dGV4dC1kZWNvcmF0aW9uOnVuZGVybGluZX0KCkBtZWRpYSAobWF4LXdpZHRoOjY0MHB4KXsK',
  'ICAvKiDguIjguK3guYHguITguJo6IOC4iuC4t+C5iOC4reC4quC4tOC4meC4hOC5ieC4suC4reC4ouC4ueC5iOC4muC4o+C4o+C4l+C4seC4lOC4muC4mSDguKrguYjguKfguJnguIjguLPguJnguKfguJkv4Lir4LiZ4LmI4Lin4LiiL+C4o+C4suC4hOC4si/guKPg',
  'uKfguKEg4Lit4Lii4Li54LmI4Lia4Lij4Lij4LiX4Lix4LiU4LmA4LiU4Li14Lii4Lin4LiB4Lix4LiZ4LiC4LmJ4Liy4LiH4Lil4LmI4Liy4LiHCiAgICAg4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4LiB4Li04LiZ4Lie4Li34LmJ4LiZ4LiX4Li14LmI4LmB4LiZ',
  '4Lin4LiV4Lix4LmJ4LiH4LiI4LiZ4LiV4LmJ4Lit4LiH4LmA4Lil4Li34LmI4Lit4LiZ4LiI4Lit4Lii4Liy4Lin4LmA4Lin4Lil4Liy4LiL4Li34LmJ4Lit4LiC4Lit4LiH4Lir4Lil4Liy4Lii4Lit4Lii4LmI4Liy4LiHICovCiAgLmxpbmVze3BhZGRpbmc6OHB4',
  'fQogIC5saW5lLWhlYWR7ZGlzcGxheTpub25lfQogIC5saW5lLXJvd3sKICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczo1NnB4IG1pbm1heCgwLDFmcikgNzJweCBtaW5tYXgoMCw4NnB4KTsKICAgIGdyaWQtdGVtcGxhdGUtYXJlYXM6J25hbWUgbmFtZSBuYW1lIGRl',
  'bCcgJ3F0eSB1bml0IHByaWNlIHN1bSc7CiAgICBnYXA6NXB4O3BhZGRpbmc6OHB4O21hcmdpbi1ib3R0b206OHB4OwogICAgYm9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXItc20pO2JhY2tncm91bmQ6dmFyKC0tc3VyZmFj',
  'ZSk7CiAgfQogIC5saW5lLXJvdyAuaW5wOm50aC1vZi10eXBlKDEpe2dyaWQtYXJlYTpuYW1lfQogIC5saW5lLXJvdyAuaW5wOm50aC1vZi10eXBlKDIpe2dyaWQtYXJlYTpxdHk7dGV4dC1hbGlnbjpjZW50ZXJ9CiAgLmxpbmUtcm93IC5pbnA6bnRoLW9mLXR5cGUo',
  'Myl7Z3JpZC1hcmVhOnVuaXR9CiAgLmxpbmUtcm93IC5pbnA6bnRoLW9mLXR5cGUoNCl7Z3JpZC1hcmVhOnByaWNlfQogIC5saW5lLXJvdyAubGluZS1zdW17Z3JpZC1hcmVhOnN1bTthbGlnbi1zZWxmOmNlbnRlcjtmb250LXNpemU6MTIuNXB4fQogIC5saW5lLXJv',
  'dyAuYnRue2dyaWQtYXJlYTpkZWw7YWxpZ24tc2VsZjpzdGFydDtqdXN0aWZ5LXNlbGY6ZW5kO3dpZHRoOjM0cHg7cGFkZGluZzo2cHggMH0KICAubGluZS1yb3cgLmlucHtwYWRkaW5nOjZweCA3cHg7Zm9udC1zaXplOjEyLjVweH0KICAubGluZS10b3RhbHt3aWR0',
  'aDoxMDAlO21hcmdpbjo2cHggMCAwO3RleHQtYWxpZ246cmlnaHR9Cn0KCi8qID09PT09PT09PT09PSDguJXguLHguKfguJrguK3guIHguKrguJbguLLguJnguLDguIHguLLguKPguIvguLTguIfguIHguYwgKOC4oeC4uOC4oeC4guC4p+C4suC4muC4mSkgPT09PT09',
  'PT09PT09CiAgIOC5gOC4h+C4teC4ouC4muC5gOC4oeC4t+C5iOC4reC4l+C4uOC4geC4reC4ouC5iOC4suC4h+C4m+C4geC4leC4tCDguIrguLHguJTguYDguIjguJnguYDguKHguLfguYjguK3guKHguLXguK3guLDguYTguKPguJXguYnguK3guIfguIjguLHguJTg',
  'uIHguLLguKMKICAg4LiV4Lix4Lin4LiX4Li14LmI4LiB4LiU4LmE4LiU4LmJ4LiI4Liw4Lii4LiB4LiC4Li24LmJ4LiZ4LmA4Lil4LmH4LiB4LiZ4LmJ4Lit4Lii4LiV4Lit4LiZ4LmA4Lit4Liy4LmA4Lih4Liy4Liq4LmM4LiK4Li14LmJIOC5g+C4q+C5ieC4o+C4',
  'ueC5ieC4p+C5iOC4suC4geC4lOC5hOC4lOC5iQotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqLwouc3luYy1waWxsewogIHRyYW5zaXRpb246YmFja2dyb3VuZCAuMTVzLGNvbG9yIC4xNXM7CiAgd2hpdGUt',
  'c3BhY2U6bm93cmFwO2xpbmUtaGVpZ2h0OjEuNzsKfQouc3luYy1waWxsIC5zcGlue3dpZHRoOjExcHg7aGVpZ2h0OjExcHg7Ym9yZGVyLXdpZHRoOjJweDt2ZXJ0aWNhbC1hbGlnbjotMXB4fQpidXR0b24uc3luYy1waWxse3BhZGRpbmc6MnB4IDEwcHh9CmJ1dHRv',
  'bi5zeW5jLXBpbGw6aG92ZXJ7ZmlsdGVyOmJyaWdodG5lc3MoLjk0KX0KYnV0dG9uLnN5bmMtcGlsbDphY3RpdmV7dHJhbnNmb3JtOnRyYW5zbGF0ZVkoMXB4KX0KLyog4Liq4LiW4Liy4LiZ4Liw4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LmD4Lir4LmJ4Lic4Li54LmJ',
  '4LmD4LiK4LmJ4LiI4Lix4LiU4LiB4Liy4LijIOC4geC4sOC4nuC4o+C4tOC4muC5gOC4muC4siDguYYg4LmD4Lir4LmJ4Liq4Lix4LiH4LmA4LiB4LiV4LmA4Lir4LmH4LiZIOC5geC4leC5iOC5hOC4oeC5iOC4o+C4muC4geC4p+C4meC4quC4suC4ouC4leC4siAq',
  'Lwouc3luYy1waWxsLndhcm4sLnN5bmMtcGlsbC5kZ3J7YW5pbWF0aW9uOnN5bmNOdWRnZSAyLjRzIGVhc2UtaW4tb3V0IGluZmluaXRlfQpAa2V5ZnJhbWVzIHN5bmNOdWRnZXswJSw4OCUsMTAwJXtvcGFjaXR5OjF9OTQle29wYWNpdHk6LjU1fX0KQG1lZGlhIChw',
  'cmVmZXJzLXJlZHVjZWQtbW90aW9uOnJlZHVjZSl7CiAgLnN5bmMtcGlsbC53YXJuLC5zeW5jLXBpbGwuZGdye2FuaW1hdGlvbjpub25lfQp9CkBtZWRpYSAobWF4LXdpZHRoOjcyMHB4KXsKICAvKiDguIjguK3guYHguITguJo6IOC5gOC4q+C4peC4t+C4reC5geC4',
  'leC5iOC5hOC4reC4hOC4reC4meC4q+C4o+C4t+C4reC4p+C4h+C4q+C4oeC4uOC4mSDguJvguKPguLDguKvguKLguLHguJTguJfguLXguYjguJrguJnguYHguJbguJrguKvguLHguKcKICAgICDguILguYnguK3guITguKfguLLguKHguKLguLHguIfguK3guYjguLLg',
  'uJnguYTguJTguYnguIjguLLguIHguIHguLLguKPguYHguJXguLDguITguYnguLLguIcgKHRpdGxlKSAqLwogIC5zeW5jLXBpbGwgLnN5bmMtbGFiZWx7ZGlzcGxheTpub25lfQogIC5zeW5jLXBpbGx7cGFkZGluZzozcHggOHB4O2ZvbnQtc2l6ZToxM3B4fQp9Cgov',
  'KiA9PT09PT09PT09PT0g4LiB4Lij4Liw4LiU4Li04LmI4LiH4LmB4LiI4LmJ4LiH4LmA4LiV4Li34Lit4LiZICsg4LiB4Lil4LmI4Lit4LiH4Lij4Liy4Lii4LiB4Liy4LijID09PT09PT09PT09PSAqLwouYmVsbC13cmFwe3Bvc2l0aW9uOnJlbGF0aXZlO2Rpc3Bs',
  'YXk6aW5saW5lLWZsZXh9Ci5idG4uYmVsbHtwb3NpdGlvbjpyZWxhdGl2ZTtmb250LXNpemU6MTVweDtsaW5lLWhlaWdodDoxfQouYmVsbC1kb3R7CiAgcG9zaXRpb246YWJzb2x1dGU7dG9wOi01cHg7cmlnaHQ6LTVweDttaW4td2lkdGg6MTdweDtoZWlnaHQ6MTdw',
  'eDtwYWRkaW5nOjAgNHB4OwogIGJhY2tncm91bmQ6dmFyKC0td2Fybik7Y29sb3I6I2ZmZjtib3JkZXItcmFkaXVzOjk5cHg7CiAgZm9udC1zaXplOjEwLjVweDtmb250LXdlaWdodDo3MDA7bGluZS1oZWlnaHQ6MTdweDt0ZXh0LWFsaWduOmNlbnRlcjsKICBib3gt',
  'c2hhZG93OjAgMCAwIDJweCB2YXIoLS1zdXJmYWNlKTtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7Cn0KLmJlbGwtZG90LnVyZ2VudHtiYWNrZ3JvdW5kOnZhcigtLWRhbmdlcil9Cgoubm90aWZ7CiAgcG9zaXRpb246YWJzb2x1dGU7dG9wOmNhbGMo',
  'MTAwJSArIDhweCk7cmlnaHQ6MDt6LWluZGV4OjcwOwogIHdpZHRoOm1pbigzODBweCxjYWxjKDEwMHZ3IC0gMzJweCkpOwogIGJhY2tncm91bmQ6dmFyKC0tc3VyZmFjZSk7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXIp',
  'OwogIGJveC1zaGFkb3c6dmFyKC0tc2gtbGcpO292ZXJmbG93OmhpZGRlbjthbmltYXRpb246cG9wIC4xNHMgZWFzZS1vdXQ7Cn0KLm5vdGlmLWh7CiAgZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6OHB4O3BhZGRpbmc6MTFweCAxNHB4OwogIGJv',
  'cmRlci1ib3R0b206MXB4IHNvbGlkIHZhcigtLWxpbmUtMik7Zm9udC1zaXplOjE0cHg7Cn0KLm5vdGlmLWggLnNwe21hcmdpbi1sZWZ0OmF1dG87ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6N3B4fQoubm90aWYtbGlzdHttYXgtaGVpZ2h0Om1p',
  'big2MHZoLDQ0MHB4KTtvdmVyZmxvdy15OmF1dG99Ci5ub3RpZi1zZWN7CiAgcGFkZGluZzo5cHggMTRweCA0cHg7Zm9udC1zaXplOjExLjVweDtmb250LXdlaWdodDo2MDA7Y29sb3I6dmFyKC0tbXV0ZWQpOwogIGJhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKTtw',
  'b3NpdGlvbjpzdGlja3k7dG9wOjA7Cn0KLm5vdGlmLWl0ZW17CiAgZGlzcGxheTpibG9jazt3aWR0aDoxMDAlO3RleHQtYWxpZ246bGVmdDtiYWNrZ3JvdW5kOjA7Ym9yZGVyOjA7Y3Vyc29yOnBvaW50ZXI7CiAgcGFkZGluZzo5cHggMTRweCA5cHggMTdweDtib3Jk',
  'ZXItbGVmdDozcHggc29saWQgdHJhbnNwYXJlbnQ7Zm9udDppbmhlcml0O2NvbG9yOmluaGVyaXQ7CiAgYm9yZGVyLWJvdHRvbToxcHggc29saWQgdmFyKC0tbGluZS0yKTsKfQoubm90aWYtaXRlbTpob3ZlcntiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMil9Ci5u',
  'b3RpZi1pdGVtIC50dHtmb250LXNpemU6MTNweDtmb250LXdlaWdodDo1MDA7Y29sb3I6dmFyKC0taW5rKTtsaW5lLWhlaWdodDoxLjQ1fQoubm90aWYtaXRlbSAuZGR7Zm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1tdXRlZCk7bWFyZ2luLXRvcDoycHg7bGlu',
  'ZS1oZWlnaHQ6MS41fQoubm90aWYtaXRlbS5sLWRhbmdlcntib3JkZXItbGVmdC1jb2xvcjp2YXIoLS1kYW5nZXIpfQoubm90aWYtaXRlbS5sLXdhcm57Ym9yZGVyLWxlZnQtY29sb3I6dmFyKC0td2Fybil9Ci5ub3RpZi1pdGVtLmwtaW5mb3tib3JkZXItbGVmdC1j',
  'b2xvcjp2YXIoLS1pbmZvKX0KLm5vdGlmLW1vcmV7CiAgZGlzcGxheTpibG9jazt3aWR0aDoxMDAlO3RleHQtYWxpZ246bGVmdDtwYWRkaW5nOjdweCAxNHB4IDlweCAxN3B4OwogIGJhY2tncm91bmQ6MDtib3JkZXI6MDtjdXJzb3I6cG9pbnRlcjtmb250OmluaGVy',
  'aXQ7Zm9udC1zaXplOjEycHg7Y29sb3I6dmFyKC0tYnJhbmQpOwogIGJvcmRlci1ib3R0b206MXB4IHNvbGlkIHZhcigtLWxpbmUtMik7Cn0KLm5vdGlmLW1vcmU6aG92ZXJ7dGV4dC1kZWNvcmF0aW9uOnVuZGVybGluZX0KLm5vdGlmLWVtcHR5e3BhZGRpbmc6MjZw',
  'eCAxNnB4O3RleHQtYWxpZ246Y2VudGVyO2NvbG9yOnZhcigtLW11dGVkKTtmb250LXNpemU6MTMuNXB4O2xpbmUtaGVpZ2h0OjEuN30KLm5vdGlmLWVtcHR5IC5iaWd7Zm9udC1zaXplOjMwcHg7bWFyZ2luLWJvdHRvbTo2cHh9Ci5ub3RpZi1mewogIHBhZGRpbmc6',
  'OXB4IDE0cHg7Ym9yZGVyLXRvcDoxcHggc29saWQgdmFyKC0tbGluZS0yKTsKICBmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLWZhaW50KTtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Cn0KCi8qIOC4leC4seC4p+C5gOC4peC4guC4muC4meC5gOC4oeC4',
  'meC4ueC4i+C5ieC4suC4oiDigJQg4LmD4Lir4LmJ4LmA4LiU4LmI4LiZ4LiC4Li24LmJ4LiZ4LmA4Lih4Li34LmI4Lit4Lih4Li14LiH4Liy4LiZ4LiE4LmJ4Liy4LiHICovCi5uYXYtaXRlbSAuYmFkZ2V7CiAgYmFja2dyb3VuZDp2YXIoLS13YXJuKTtjb2xvcjoj',
  'ZmZmO2ZvbnQtd2VpZ2h0OjcwMDtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7Cn0KLm5hdi1pdGVtLm9uIC5iYWRnZXtiYWNrZ3JvdW5kOnJnYmEoMjU1LDI1NSwyNTUsLjI4KTtjb2xvcjojZmZmfQoKQG1lZGlhIChtYXgtd2lkdGg6NzIwcHgpewog',
  'IC5ub3RpZnsKICAgIHBvc2l0aW9uOmZpeGVkO3RvcDphdXRvO2xlZnQ6OHB4O3JpZ2h0OjhweDtib3R0b206OHB4O3dpZHRoOmF1dG87CiAgICBtYXgtaGVpZ2h0Ojcydmg7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjsKICB9CiAgLm5vdGlmLWxp',
  'c3R7ZmxleDoxO21heC1oZWlnaHQ6bm9uZX0KfQoKQG1lZGlhIHByaW50ewogIC5uYXYsLnRvcC1yaWdodCwuYnVyZ2VyLC50LWFjdGlvbnMsLmJ0bntkaXNwbGF5Om5vbmUhaW1wb3J0YW50fQogIC5hcHB7ZGlzcGxheTpibG9ja30gYm9keXtiYWNrZ3JvdW5kOiNm',
  'ZmZ9CiAgLmNhcmR7YnJlYWstaW5zaWRlOmF2b2lkO2JveC1zaGFkb3c6bm9uZX0KfQo8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5PgoKPGRpdiBjbGFzcz0iYXBwIj4KICA8IS0tID09PT09PT09PT09PT09PT09IHNpZGViYXIgPT09PT09PT09PT09PT09PT0gLS0+CiAg',
  'PGFzaWRlIGNsYXNzPSJuYXYiIGlkPSJuYXYiPgogICAgPGRpdiBjbGFzcz0iYnJhbmQiPgogICAgICA8Yj7wn4+iIDw/PSBhcHBOYW1lID8+PC9iPgogICAgICA8c3Bhbj48Pz0gc3VidGl0bGUgPz4gwrcgdjw/PSB2ZXJzaW9uID8+PC9zcGFuPgogICAgPC9kaXY+',
  'CiAgICA8ZGl2IGNsYXNzPSJuYXYtbGlzdCIgaWQ9Im5hdkxpc3QiPjwvZGl2PgogICAgPGRpdiBjbGFzcz0ibmF2LWZvb3QiIGlkPSJuYXZGb290Ij7guIHguLPguKXguLHguIfguYLguKvguKXguJTigKY8L2Rpdj4KICA8L2FzaWRlPgoKICA8IS0tID09PT09PT09',
  'PT09PT09PT09IG1haW4gPT09PT09PT09PT09PT09PT0gLS0+CiAgPGRpdiBjbGFzcz0ibWFpbiI+CiAgICA8aGVhZGVyIGNsYXNzPSJ0b3AiPgogICAgICA8YnV0dG9uIGNsYXNzPSJidXJnZXIiIG9uY2xpY2s9InRvZ2dsZU5hdigpIj7imLA8L2J1dHRvbj4KICAg',
  'ICAgPGRpdj4KICAgICAgICA8aDEgaWQ9InBhZ2VUaXRsZSI+4Lig4Liy4Lie4Lij4Lin4LihPC9oMT4KICAgICAgICA8ZGl2IGNsYXNzPSJzdWIiIGlkPSJwYWdlU3ViIj7guYHguJTguIrguJrguK3guKPguYzguJTguKPguKfguKHguJfguLjguIHguKrguYjguKfg',
  'uJnguILguK3guIfguKvguK3guJ7guLHguIE8L2Rpdj4KICAgICAgPC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9InRvcC1yaWdodCI+CiAgICAgICAgPHNwYW4gaWQ9ImxpdmVEb3QiPjwvc3Bhbj4KICAgICAgICA8c3BhbiBpZD0iYmVsbFdyYXAiIGNsYXNzPSJiZWxs',
  'LXdyYXAiPjwvc3Bhbj4KICAgICAgICA8YnV0dG9uIGNsYXNzPSJidG4gaWNvbiIgaWQ9InRoZW1lQnRuIiB0aXRsZT0i4Liq4Lil4Lix4Lia4LiY4Li14LihIiBvbmNsaWNrPSJjeWNsZVRoZW1lKCkiPvCfjJc8L2J1dHRvbj4KICAgICAgICA8aW5wdXQgY2xhc3M9',
  'ImlucCB3LWF1dG8iIGlkPSJzZWFyY2hCb3giIHBsYWNlaG9sZGVyPSLwn5SOIOC4hOC5ieC4meC4q+C4suC4l+C4seC5ieC4h+C4o+C4sOC4muC4muKApiIgc3R5bGU9IndpZHRoOjE4MHB4IgogICAgICAgICAgICAgICBvbmlucHV0PSJvblNlYXJjaCh0aGlzLnZh',
  'bHVlKSIgYXV0b2NvbXBsZXRlPSJvZmYiPgogICAgICAgIDxzZWxlY3QgY2xhc3M9InNlbCB3LWF1dG8iIGlkPSJ5ZWFyU2VsIiBvbmNoYW5nZT0ic2V0WWVhcih0aGlzLnZhbHVlKSI+PC9zZWxlY3Q+CiAgICAgICAgPGJ1dHRvbiBjbGFzcz0iYnRuIGljb24iIHRp',
  'dGxlPSLguKPguLXguYDguJ/guKPguIoiIG9uY2xpY2s9InJlZnJlc2goKSI+4oa7PC9idXR0b24+CiAgICAgIDwvZGl2PgogICAgPC9oZWFkZXI+CiAgICA8bWFpbiBjbGFzcz0iY29udGVudCIgaWQ9InZpZXciPgogICAgICA8ZGl2IGNsYXNzPSJlbXB0eSI+PGRp',
  'diBjbGFzcz0iYmlnIj48c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPjwvZGl2PuC4geC4s+C4peC4seC4h+C5gOC4iuC4t+C5iOC4reC4oeC4leC5iOC4reC4o+C4sOC4muC4muKApjwvZGl2PgogICAgPC9tYWluPgogIDwvZGl2Pgo8L2Rpdj4KCjxkaXYgaWQ9ImF1',
  'dGhSb290Ij48L2Rpdj4KPGRpdiBpZD0ibW9kYWxSb290Ij48L2Rpdj4KPGRpdiBpZD0idG9hc3RSb290Ij48L2Rpdj4KCjxzY3JpcHQ+CiAgLyog4LiE4LmI4Liy4LiX4Lix4LmJ4LiH4Liq4Liy4Lih4LiW4Li54LiB4LiB4Lij4Lit4LiH4Lih4Liy4LiI4Liy4LiB',
  '4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4LmB4Lil4LmJ4LinIOC4iOC4tuC4h+C4q+C4peC4uOC4lOC4reC4reC4geC4iOC4suC4geC5gOC4hOC4o+C4t+C5iOC4reC4h+C4q+C4oeC4suC4ouC4hOC4s+C4nuC4ueC4lOC5hOC4',
  'oeC5iOC5hOC4lOC5iQogICAgICAgYWNjZXNzS2V5ICDguJzguYjguLLguJkgc2FmZUtleV8gICAg4LmA4Lir4Lil4Li34Lit4LmB4LiE4LmIIEEtWiBhLXogMC05IF8gLQogICAgICAgcm9sZSAgICAgICDguKHguLLguIjguLLguIHguKPguLLguKLguIHguLLguKPg',
  'uITguIfguJfguLXguYggUk9MRQogICAgICAgdGhlbWUgICAgICDguJzguYjguLLguJkgc2FmZVRoZW1lXyAg4LmA4Lir4Lil4Li34Lit4LmB4LiE4LmIIDMg4LiE4LmI4Liy4LiX4Li14LmI4LiB4Liz4Lir4LiZ4LiU4LmE4Lin4LmJCgogICAgIOC4l+C4seC5ieC4',
  'h+C4quC4suC4oeC4leC5ieC4reC4h+C4nuC4tOC4oeC4nuC5jOC5geC4muC4muC4lOC4tOC4miAoZm9yY2UtcHJpbnRpbmcpIOC5gOC4l+C5iOC4suC4meC4seC5ieC4mSDguKvguYnguLLguKHguYPguIrguYnguYHguJrguJogc3RhbmRhcmQtcHJpbnRpbmcKICAg',
  'ICDguYDguJ7guKPguLLguLDguYHguJrguJrguKvguKXguLHguIfguIjguLAgZXNjYXBlIOC5gOC4hOC4o+C4t+C5iOC4reC4h+C4q+C4oeC4suC4ouC4hOC4s+C4nuC4ueC4lOC5gOC4m+C5h+C4mSAmcXVvdDsg4LiL4Li24LmI4LiH4LmD4LiZ4LmB4LiX4LmH4LiB',
  'IHNjcmlwdAogICAgIOC5gOC4muC4o+C4suC4p+C5jOC5gOC4i+C4reC4o+C5jOC5hOC4oeC5iOC4luC4reC4lOC4geC4peC4seC4miDguJfguLPguYPguKvguYnguJfguLHguYnguIfguJrguKXguYfguK3guIHguJnguLXguYnguJ7guLHguIfguJfguLHguYnguIfg',
  'uIHguYnguK3guJnguYHguKXguLDguITguYjguLLguYTguKHguYjguJbguLbguIfguKvguJnguYnguLLguYDguKfguYfguJogKi8KICB2YXIgQUNDRVNTX0tFWSA9ICI8PyE9IGFjY2Vzc0tleSA/PiI7CiAgdmFyIFVTRVJfUk9MRSAgPSAiPD8hPSByb2xlID8+IjsK',
  'ICB2YXIgSU5JVF9USEVNRSA9ICI8PyE9IHRoZW1lID8+IjsKPC9zY3JpcHQ+CjxzY3JpcHQ+Ci8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBBcHAuaHRtbCDigJQgY29yZTogc3RhdGUsIGFwaSwg',
  'cm91dGVyLCBmb3JtYXQsIG1vZGFsLCB1cGxvYWQKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgp2YXIgUyA9IHsKICBib290OiBudWxsLCAgICAgICAgICAvLyDguILguYnguK3guKHguLnguKXg',
  'uJXguLHguYnguIfguJXguYnguJnguIjguLLguIEgYXBwLmJvb3RzdHJhcAogIHBhZ2U6ICdkYXNoYm9hcmQnLAogIHllYXI6IFN0cmluZyhuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCkpLAogIGNhY2hlOiB7fSwgICAgICAgICAgIC8vIOC5gOC4geC5h+C4muC4nOC4',
  'peC4peC4seC4nuC4mOC5jOC4peC5iOC4suC4quC4uOC4lOC4guC4reC4h+C5geC4leC5iOC4peC4sOC4q+C4meC5ieC4sgogIHBhcmFtczoge30sICAgICAgICAgIC8vIOC4leC4seC4p+C4geC4o+C4reC4h+C4ouC5iOC4reC4ouC4guC4reC4h+C5geC4leC5iOC4',
  'peC4sOC4q+C4meC5ieC4siDguYDguIrguYjguJkge3Jvb206JzMxMScsIHN0YXR1czonYWxsJ30KICBidXN5OiBmYWxzZSwKICB2ZXJzaW9uOiAwLCAgICAgICAgICAvLyDguKPguLjguYjguJnguILguYnguK3guKHguLnguKXguJfguLXguYjguKvguJnguYnguLLg',
  'uJnguLXguYnguJbguLfguK3guK3guKLguLnguYgKICBzZWxmQ2hhbmdlVW50aWw6IDAsICAvLyDguYDguJ7guLTguYjguIfguIHguJTguJrguLHguJnguJfguLbguIHguYDguK3guIcg4oCUIOC4reC4ouC5iOC4suC5gOC4lOC5ieC4h+C4p+C5iOC4siAi4Lih4Li1',
  '4LiE4LiZ4LmB4LiB4LmJ4LiC4LmJ4Lit4Lih4Li54LilIgogIHN5bmNUaW1lcjogbnVsbAp9OwoKdmFyIEFMTF9ERUJUUyA9IFtdOwoKdmFyIFBBR0VTID0gWwogIHsgaWQ6J2Rhc2hib2FyZCcsIGljOifwn5OKJywgbGFiZWw6J+C4oOC4suC4nuC4o+C4p+C4oScs',
  'ICAgICAgICAgICAgICBzdWI6J+C5geC4lOC4iuC4muC4reC4o+C5jOC4lOC4o+C4p+C4oeC4l+C4uOC4geC4quC5iOC4p+C4meC4guC4reC4h+C4q+C4reC4nuC4seC4gScsICAgICAgICBzZWM6J+C4oOC4suC4nuC4o+C4p+C4oScgfSwKICB7IGlkOidkZWJ0TWFp',
  'bicsICBpYzon8J+SsCcsIGxhYmVsOifguKPguLLguKLguIHguLLguKPguKrguKPguLjguJvguKPguKfguKEnLCAgICAgICBzdWI6J+C4muC4seC4jeC4iuC4teC5guC4reC4meC5g+C4iuC5ieC4q+C4meC4teC5ieC4q+C4peC4seC4geC4guC4reC4h+C4q+C4reC4',
  'nuC4seC4gScsICAgICAgICBzZWM6J+C4geC4suC4o+C5gOC4h+C4tOC4mScgfSwKICB7IGlkOidkZWJ0U3ViJywgICBpYzon8J+nvicsIGxhYmVsOifguKvguJnguLXguYnguKrguLTguJknLCAgICAgICAgICAgICAgc3ViOifguJrguLHguI3guIrguLXguYLguK3g',
  'uJnguYPguIrguYnguKvguJnguLXguYnguKPguK3guIfguILguK3guIfguKvguK3guJ7guLHguIEnIH0sCiAgeyBpZDoncHVyY2hhc2VzJywgaWM6J/Cfm5InLCBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHJywgICAgICAgIHN1',
  'Yjon4LiC4Lit4LiH4LmA4LiC4LmJ4Liy4Lir4Lit4Lie4Lix4LiBIOC4o+C4suC4hOC4siDguJvguKPguLDguIHguLHguJkg4LmB4Lil4Liw4Liq4Lil4Li04LibJyB9LAogIHsgaWQ6J2ZpbmFuY2UnLCAgIGljOifwn5OSJywgbGFiZWw6J+C4o+C4suC4ouC4o+C4',
  'seC4mi3guKPguLLguKLguIjguYjguLLguKLguKvguK0nLCAgICAgIHN1Yjon4LiE4LmI4Liy4LmA4LiK4LmI4Liy4LiX4Li14LmI4LmA4LiB4LmH4Lia4LmE4LiU4LmJIMK3IOC4hOC5iOC4suC5hOC4nyDCtyDguITguYjguLLguJnguYnguLMgwrcg4LiE4LmI4Liy',
  '4LmA4LiZ4LmH4LiVIMK3IOC4oOC4suC4qeC4tScgfSwKICB7IGlkOidhYycsICAgICAgICBpYzon4p2E77iPJywgbGFiZWw6J+C4peC5ieC4suC4h+C5geC4reC4o+C5jCcsICAgICAgICAgICAgc3ViOifguJXguLLguKPguLLguIfguKXguYnguLLguIfguYHguK3g',
  'uKPguYzguKPguLLguKLguKvguYnguK3guIcgMjQg4Lir4LmJ4Lit4LiHJywgICAgICBzZWM6J+C4i+C5iOC4reC4oeC4muC4s+C4o+C4uOC4hycgfSwKICB7IGlkOidyZXBhaXJzJywgICBpYzon8J+UpycsIGxhYmVsOifguIvguYjguK3guKHguYHguIvguKHguJXg',
  'uLLguKHguKvguYnguK3guIcnLCAgICAgIHN1Yjon4LiH4Liy4LiZ4LmB4LiI4LmJ4LiH4LiL4LmI4Lit4Lih4LmB4Lii4LiB4LiV4Liy4Lih4Lir4LmJ4Lit4LiHJyB9LAogIHsgaWQ6J2J1aWxkaW5nJywgIGljOifwn4+iJywgbGFiZWw6J+C4i+C5iOC4reC4oeC5',
  'geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oScsICAgIHN1Yjon4LiH4Liy4LiZ4Liq4LmI4Lin4LiZ4LiB4Lil4Liy4LiH4LiC4Lit4LiH4Lit4Liy4LiE4Liy4LijJyB9LAogIHsgaWQ6J3Jvb21zJywgICAgIGljOifwn5qqJywgbGFiZWw6J+C4q+C5',
  'ieC4reC4h+C4nuC4seC4gScsICAgICAgICAgICAgIHN1Yjon4LiX4Liw4LmA4Lia4Li14Lii4LiZ4Lir4LmJ4Lit4LiH4LmB4Lil4Liw4Lib4Lij4Liw4Lin4Lix4LiV4Li04Lij4Liy4Lii4Lir4LmJ4Lit4LiHJywgICAgICAgc2VjOifguILguYnguK3guKHguLng',
  'uKUnIH0sCiAgeyBpZDoncmVwb3J0cycsICAgaWM6J/Cfk4gnLCBsYWJlbDon4Lij4Liy4Lii4LiH4Liy4LiZICYg4Liq4Liz4Lij4Lit4LiH4LiC4LmJ4Lit4Lih4Li54LilJywgc3ViOifguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguKPguLLguKLguKvg',
  'uYnguK3guIcgwrcg4Lib4LiP4Li04LiX4Li04LiZ4LiH4Liy4LiZIMK3IOC4quC5iOC4h+C4reC4reC4geC4guC5ieC4reC4oeC4ueC4pScgfSwKICB7IGlkOidzZXR0aW5ncycsICBpYzon4pqZ77iPJywgbGFiZWw6J+C4leC4seC5ieC4h+C4hOC5iOC4sicsICAg',
  'ICAgICAgICAgICBzdWI6J+C4muC4seC4jeC4iuC4tSDCtyDguJjguLXguKEgwrcg4Lic4Li54LmJ4LmD4LiK4LmJIMK3IOC4peC4tOC4h+C4geC5jOC5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4mScsICAgc2VjOifguKPguLDguJrguJonIH0KXTsKCi8qIC0t',
  'LS0tLS0tLS0tLS0tLS0gQVBJIC0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKiDguIHguLjguI3guYHguIjguJfguLXguYjguIjguLDguYHguJnguJrguYTguJvguIHguLHguJrguJfguLjguIHguITguLPguKrguLHguYjguIcg4oCUIOC4oeC4tSAyIOC4l+C4suC4h+C4',
  'quC4s+C4o+C4reC4h+C5gOC4nOC4t+C5iOC4reC4l+C4suC4h+C5geC4o+C4geC5hOC4oeC5iOC4oeC4siAqLwp2YXIgUkVTT0xWRURfS0VZID0gbnVsbDsKCmZ1bmN0aW9uIGFjY2Vzc0tleSgpewogIGlmIChSRVNPTFZFRF9LRVkgIT09IG51bGwpIHJldHVybiBS',
  'RVNPTFZFRF9LRVk7CiAgUkVTT0xWRURfS0VZID0gKHR5cGVvZiBBQ0NFU1NfS0VZID09PSAnc3RyaW5nJyAmJiBBQ0NFU1NfS0VZKSA/IEFDQ0VTU19LRVkgOiAnJzsKICByZXR1cm4gUkVTT0xWRURfS0VZOwp9CgovKiogdHJ1ZSDguJbguYnguLLguYDguJvguLTg',
  'uJTguJTguYnguKfguKLguKXguLTguIfguIHguYzguJzguLnguYnguJTguLnguYHguKUg4oCUIOC5g+C4iuC5ieC5geC4l+C4meC4leC4seC4p+C5geC4m+C4oyBDQU5fRURJVCDguJXguKPguIcg4LmGIOC4l+C4teC5iOC4reC4suC4iOC5hOC4oeC5iOC4luC4ueC4',
  'geC4m+C4o+C4sOC4geC4suC4qCAqLwpmdW5jdGlvbiBjYW5FZGl0KCl7CiAgaWYgKHR5cGVvZiBDQU5fRURJVCAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiAhIUNBTl9FRElUOwogIHJldHVybiAhIShTLmJvb3QgJiYgUy5ib290LmNhbkVkaXQpOwp9CgpmdW5jdGlv',
  'biBjYWxsQXBpKGFjdGlvbiwgcGF5bG9hZCl7CiAgdmFyIGJvZHkgPSB7fTsKICBPYmplY3Qua2V5cyhwYXlsb2FkIHx8IHt9KS5mb3JFYWNoKGZ1bmN0aW9uKGspeyBib2R5W2tdID0gcGF5bG9hZFtrXTsgfSk7CiAgYm9keS5fa2V5ID0gYWNjZXNzS2V5KCk7CiAg',
  'Ly8g4Lic4Li54LmJ4LmA4Lij4Li14Lii4LiB4Liq4LmI4LiHIF9zZXNzaW9uIOC4oeC4suC5gOC4reC4h+C5hOC4lOC5iSAo4LiV4Lit4LiZ4Lit4Lit4LiB4LiI4Liy4LiB4Lij4Liw4Lia4Lia4LiV4LmJ4Lit4LiH4LmD4LiK4LmJ4LiV4Lix4Lin4LmA4LiB4LmI',
  '4LiyKQogIGlmIChib2R5Ll9zZXNzaW9uID09PSB1bmRlZmluZWQpIGJvZHkuX3Nlc3Npb24gPSAodHlwZW9mIEFVVEggIT09ICd1bmRlZmluZWQnID8gQVVUSC5zZXNzaW9uIDogJycpIHx8ICcnOwogIHBheWxvYWQgPSBib2R5OwogIHZhciBtdXRhdGluZyA9IENM',
  'SUVOVF9NVVRBVElORy50ZXN0KGFjdGlvbik7CiAgaWYgKG11dGF0aW5nKSBzeW5jU2V0KCdzYXZpbmcnKTsKCiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7CiAgICBnb29nbGUuc2NyaXB0LnJ1bgogICAgICAud2l0aFN1Y2Nl',
  'c3NIYW5kbGVyKGZ1bmN0aW9uKHJlcyl7CiAgICAgICAgaWYgKCFyZXMpIHsgaWYgKG11dGF0aW5nKSBzeW5jU2V0KCdvZmZsaW5lJyk7IHJldHVybiByZWplY3QobmV3IEVycm9yKCfguYTguKHguYjguYTguJTguYnguKPguLHguJrguILguYnguK3guKHguLnguKXg',
  'uIjguLLguIHguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYwnKSk7IH0KICAgICAgICBpZiAocmVzLm9rKSB7CiAgICAgICAgICBpZiAobXV0YXRpbmcpIHsgbWFya1NlbGZDaGFuZ2UoKTsgc3luY1NldCgnc2F2ZWQnKTsgfQogICAgICAgICAgcmV0dXJu',
  'IHJlc29sdmUocmVzLmRhdGEpOwogICAgICAgIH0KICAgICAgICAvLyDguKvguKHguJTguK3guLLguKLguLjguKPguLDguKvguKfguYjguLLguIfguYPguIrguYnguIfguLLguJkg4oCUIOC4nuC4suC4geC4peC4seC4muC5hOC4m+C4q+C4meC5ieC4suC4peC5h+C4',
  'reC4geC4reC4tOC4meC5geC4l+C4meC4l+C4teC5iOC4iOC4sOC4guC4tuC5ieC4meC4guC5ieC4reC4hOC4p+C4suC4oeC4hOC5ieC4suC4h+C5hOC4p+C5ieC5gOC4ieC4oiDguYYKICAgICAgICBpZiAocmVzLm5lZWRMb2dpbiAmJiB0eXBlb2Ygb25TZXNzaW9u',
  'TG9zdCA9PT0gJ2Z1bmN0aW9uJykgb25TZXNzaW9uTG9zdCgpOwogICAgICAgIGlmIChtdXRhdGluZykgc3luY1NldCgnZXJyb3InLCByZXMuZXJyb3IpOwogICAgICAgIHJlamVjdChuZXcgRXJyb3IocmVzLmVycm9yKSk7CiAgICAgIH0pCiAgICAgIC53aXRoRmFp',
  'bHVyZUhhbmRsZXIoZnVuY3Rpb24oZXJyKXsKICAgICAgICAvLyDguYDguJnguYfguJXguKrguLDguJTguLjguJQg4oCUIOC4guC4reC4h+C4l+C4teC5iOC4geC4o+C4reC4geC5hOC4p+C5ieC4ouC4seC4h+C4reC4ouC4ueC5iOC5g+C4meC4n+C4reC4o+C5jOC4',
  'oSDguYTguKHguYjguKvguLLguKLguYTguJvguYTguKvguJkKICAgICAgICBpZiAobXV0YXRpbmcpIHN5bmNTZXQoaXNPZmZsaW5lRXJyb3IoZXJyKSA/ICdvZmZsaW5lJyA6ICdlcnJvcicsIChlcnIgJiYgZXJyLm1lc3NhZ2UpIHx8IFN0cmluZyhlcnIpKTsKICAg',
  'ICAgICByZWplY3QoZXJyKTsKICAgICAgfSkKICAgICAgLmFwaShhY3Rpb24sIHBheWxvYWQgfHwge30pOwogIH0pOwp9CgovKiog4LmA4Lij4Li14Lii4LiB4LmA4Lih4Li34LmI4Lit4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4Lia4Lit4LiB4Lin',
  '4LmI4Liy4Lii4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJ4Lil4LmH4Lit4LiB4Lit4Li04LiZICjguKvguKHguJTguK3guLLguKLguLggLyDguJbguLnguIHguYPguKvguYnguK3guK3guIHguIjguLLguIHguKPguLDguJrguJopICovCnZhciBzZXNzaW9uTG9zdEF0',
  'ID0gMDsKZnVuY3Rpb24gb25TZXNzaW9uTG9zdCgpewogIGlmIChEYXRlLm5vdygpIC0gc2Vzc2lvbkxvc3RBdCA8IDMwMDApIHJldHVybjsgICAvLyDguKvguKXguLLguKLguITguLPguKrguLHguYjguIfguJ7guKPguYnguK3guKHguIHguLHguJnguIHguYfguYDg',
  'uJTguYnguIfguITguKPguLHguYnguIfguYDguJTguLXguKLguKfguJ7guK0KICBzZXNzaW9uTG9zdEF0ID0gRGF0ZS5ub3coKTsKICBzYXZlU2Vzc2lvbignJyk7CiAgY2xvc2VNb2RhbCgpOwogIGlmIChBVVRILmRldmljZSkgc2hvd1BpbigpOyBlbHNlIHNob3dM',
  'b2dpbign4Lir4Lih4LiU4LmA4Lin4Lil4Liy4LmD4LiK4LmJ4LiH4Liy4LiZIOC4geC4o+C4uOC4k+C4suC5gOC4guC5ieC4suC4quC4ueC5iOC4o+C4sOC4muC4muC4reC4teC4geC4hOC4o+C4seC5ieC4hycpOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIGJvb3Qg',
  'JiByb3V0aW5nIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIGJvb3QoKXsKICAvLyDguJfguLLguJjguLXguKHguIHguYjguK3guJnguK3guKLguYjguLLguIfguK3guLfguYjguJkg4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4LmA4Lir4LmH4LiZ4Lir4LiZ',
  '4LmJ4Liy4LiI4Lit4LiB4Lij4Liw4Lie4Lij4Li04Lia4LiC4Liy4Lin4LiV4Lit4LiZ4LmA4Lib4Li04LiUCiAgYXBwbHlUaGVtZShsc0dldChMU19USEVNRSkgfHwgKHR5cGVvZiBJTklUX1RIRU1FID09PSAnc3RyaW5nJyA/IElOSVRfVEhFTUUgOiAn4LiV4Liy',
  '4Lih4LmA4LiE4Lij4Li34LmI4Lit4LiHJykpOwogIC8vIGF1dGhHYXRlIOC4iOC4sOC4reC5iOC4suC4meC4geC4uOC4jeC5geC4iOC4iOC4suC4gSBVUkwg4LiC4Lit4LiH4Lir4LiZ4LmJ4Liy4LmB4Lih4LmI4LmD4Lir4LmJ4LiU4LmJ4Lin4LiiIOC4luC5ieC4',
  'suC4leC4seC4p+C5geC4m+C4o+C5hOC4oeC5iOC4oeC4suC4luC4tuC4h+C4q+C4meC5ieC4suC5gOC4p+C5h+C4mgogIGF1dGhHYXRlKCk7Cn0KCmZ1bmN0aW9uIGJvb3ROb3coKXsKICBjYWxsQXBpKCdhcHAuYm9vdHN0cmFwJykudGhlbihmdW5jdGlvbihiKXsK',
  'ICAgIFMuYm9vdCA9IGI7CiAgICByZW5kZXJOYXYoKTsKICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXZGb290JykuaW5uZXJIVE1MID0gbmF2Rm9vdEh0bWwoYik7CiAgICBTLnZlcnNpb24gPSBiLnZlcnNpb24gfHwgMDsKICAgIGlmICghYi5jYW5FZGl0',
  'KSBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ3JlYWRvbmx5Jyk7CiAgICAvLyDguJjguLXguKHguILguK3guIfguYDguITguKPguLfguYjguK3guIfguJnguLXguYnguIrguJnguLDguYDguKrguKHguK0g4LiW4LmJ4Liy4Lii4Lix4LiH4LmE4Lih4LmI4LmA',
  '4LiE4Lii4LiV4Lix4LmJ4LiH4LiE4LmI4Lit4Lii4LmD4LiK4LmJ4LiC4Lit4LiH4Lij4Liw4Lia4LiaCiAgICBhcHBseVRoZW1lKGN1cnJlbnRUaGVtZSgpKTsKICAgIGdvKHN0YXJ0UGFnZShiKSk7CiAgICByZWZyZXNoQWxlcnRzKCk7CiAgICBzdGFydFBvbGxp',
  'bmcoYi5zZXR0aW5ncyAmJiBiLnNldHRpbmdzLnJlZnJlc2hTZWNvbmRzKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aWV3JykuaW5uZXJIVE1MID0KICAgICAgJzxkaXYgY2xhc3M9ImNhcmQiPjxkaXYgY2xh',
  'c3M9ImNhcmQtYiI+PGgzPuC5gOC4iuC4t+C5iOC4reC4oeC4leC5iOC4reC4o+C4sOC4muC4muC5hOC4oeC5iOC4quC4s+C5gOC4o+C5h+C4iDwvaDM+JyArCiAgICAgICc8cCBjbGFzcz0ibXV0ZWQiPicgKyBlc2MoZS5tZXNzYWdlfHxlKSArICc8L3A+JyArCiAg',
  'ICAgICc8cCBjbGFzcz0iZnMxMyI+4LiV4Lij4Lin4LiI4Liq4Lit4Lia4Lin4LmI4LiyOiDguYDguJvguLTguJTguIrguLXguJXguYHguKXguYnguKfguKPguLHguJkgPGI+4LmA4Lih4LiZ4Li5IPCfj6IgVGhlIE0gQ29ybmVyIEFQIOKGkiDwn5qAIOC4leC4tOC4',
  'lOC4leC4seC5ieC4h+C4l+C4seC5ieC4h+C4q+C4oeC4lOC5g+C4meC4hOC4peC4tOC4geC5gOC4lOC4teC4ouC4pzwvYj4gJyArCiAgICAgICfguYDguKPguLXguKLguJrguKPguYnguK3guKLguYHguKXguYnguKc8L3A+PC9kaXY+PC9kaXY+JzsKICB9KTsKfQoK',
  'LyoqIOC4q+C4meC5ieC4suC5geC4o+C4geC4l+C4teC5iOC4iOC4sOC5gOC4m+C4tOC4lCDigJQg4LiV4Liy4Lih4LiX4Li14LmI4LiV4Lix4LmJ4LiH4LmE4Lin4LmJIOC5geC4leC5iOC4luC5ieC4suC4oeC4tSAjaGFzaCDguYPguJnguKXguLTguIfguIHguYzg',
  'uYPguKvguYkgaGFzaCDguIrguJnguLAgKi8KZnVuY3Rpb24gc3RhcnRQYWdlKGIpewogIHZhciBoYXNoID0gKGxvY2F0aW9uLmhhc2ggfHwgJycpLnJlcGxhY2UoJyMnLCcnKTsKICBpZiAoUEFHRVMuc29tZShmdW5jdGlvbihwKXsgcmV0dXJuIHAuaWQgPT09IGhh',
  'c2g7IH0pKSByZXR1cm4gaGFzaDsKICB2YXIgbWFwID0gewogICAgJ+C5geC4lOC4iuC4muC4reC4o+C5jOC4lCc6J2Rhc2hib2FyZCcsICfguKPguLLguKLguIHguLLguKPguKrguKPguLjguJvguKPguKfguKEnOidkZWJ0TWFpbicsICfguKvguJnguLXguYnguKrg',
  'uLTguJknOidkZWJ0U3ViJywKICAgICfguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcnOidwdXJjaGFzZXMnLCAn4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Liy4Lih4Lir4LmJ4Lit4LiHJzoncmVwYWlycycKICB9OwogIHJldHVybiBtYXBb',
  'Yi5zZXR0aW5ncyAmJiBiLnNldHRpbmdzLnN0YXJ0UGFnZV0gfHwgJ2Rhc2hib2FyZCc7Cn0KCi8qKiDguILguYnguK3guITguKfguLLguKHguKHguLjguKHguKXguYjguLLguIfguIvguYnguLLguKIg4oCUIOC5gOC4p+C4reC4o+C5jOC4iuC4seC4meC5gOC4p+C5',
  'h+C4muC5geC4reC4m+C4iOC4sOC5gOC4guC4teC4ouC4meC4l+C4seC4muC4n+C4seC4h+C4geC5jOC4iuC4seC4meC4meC4teC5iSAqLwpmdW5jdGlvbiBuYXZGb290SHRtbChiKXsKICB2YXIgdSA9IGIudXNlciB8fCB7fTsKICByZXR1cm4gJzxiIHN0eWxlPSJj',
  'b2xvcjojYzdkMGUwIj4nICsgZXNjKHUubmFtZSB8fCB1LmxhYmVsIHx8ICcnKSArICc8L2I+JyArCiAgICAodS51c2VybmFtZSA/ICcgPHNwYW4gc3R5bGU9Im9wYWNpdHk6LjciPkAnICsgZXNjKHUudXNlcm5hbWUpICsgJzwvc3Bhbj4nIDogJycpICsKICAgICc8',
  'YnI+PHNwYW4gc3R5bGU9Im9wYWNpdHk6LjgiPicgKyBlc2ModS5yb2xlICYmIHUucm9sZSAhPT0gJ25vbmUnID8gdS5yb2xlIDogdS52aWEgfHwgJycpICsgJzwvc3Bhbj4nICsKICAgIChiLnNoZWV0VXJsID8gJzxicj48YSBocmVmPSInICsgYi5zaGVldFVybCAr',
  'ICciIHRhcmdldD0iX2JsYW5rIj7guYDguJvguLTguJQgR29vZ2xlIFNoZWV0IOKGlzwvYT4nIDogJycpICsKICAgICh1LnNpZ25lZEluICYmIHUudXNlcm5hbWUKICAgICAgPyAnPGJyPjxhIGhyZWY9ImphdmFzY3JpcHQ6dm9pZCgwKSIgb25jbGljaz0iY29uZmly',
  'bUxvZ291dCgpIj7guK3guK3guIHguIjguLLguIHguKPguLDguJrguJo8L2E+JwogICAgICA6ICcnKTsKfQoKZnVuY3Rpb24gcmVuZGVyTmF2KCl7CiAgdmFyIGh0bWwgPSAnJzsKICBQQUdFUy5mb3JFYWNoKGZ1bmN0aW9uKHApewogICAgaWYgKHAuc2VjKSBodG1s',
  'ICs9ICc8ZGl2IGNsYXNzPSJuYXYtc2VjIj4nICsgcC5zZWMgKyAnPC9kaXY+JzsKICAgIGh0bWwgKz0gJzxidXR0b24gY2xhc3M9Im5hdi1pdGVtIiBpZD0ibmF2LScgKyBwLmlkICsgJyIgb25jbGljaz0iZ28oXCcnICsgcC5pZCArICdcJykiPicgKwogICAgICAg',
  'ICAgICAgICc8c3BhbiBjbGFzcz0iaWMiPicgKyBwLmljICsgJzwvc3Bhbj48c3Bhbj4nICsgcC5sYWJlbCArICc8L3NwYW4+JyArCiAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPSJiYWRnZSIgaWQ9ImJhZGdlLScgKyBwLmlkICsgJyIgc3R5bGU9ImRpc3BsYXk6',
  'bm9uZSI+PC9zcGFuPicgKwogICAgICAgICAgICAnPC9idXR0b24+JzsKICB9KTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2TGlzdCcpLmlubmVySFRNTCA9IGh0bWw7Cn0KCmZ1bmN0aW9uIGdvKHBhZ2UpewogIFMucGFnZSA9IHBhZ2U7CiAgUy5wYXJh',
  'bXMgPSB7fTsKICBsb2NhdGlvbi5oYXNoID0gcGFnZTsKICB2YXIgbWV0YSA9IFBBR0VTLmZpbHRlcihmdW5jdGlvbihwKXtyZXR1cm4gcC5pZD09PXBhZ2U7fSlbMF0gfHwgUEFHRVNbMF07CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BhZ2VUaXRsZScpLnRl',
  'eHRDb250ZW50ID0gbWV0YS5sYWJlbDsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFnZVN1YicpLnRleHRDb250ZW50ID0gbWV0YS5zdWI7CiAgUEFHRVMuZm9yRWFjaChmdW5jdGlvbihwKXsKICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlk',
  'KCduYXYtJyArIHAuaWQpOwogICAgaWYgKGVsKSBlbC5jbGFzc0xpc3QudG9nZ2xlKCdvbicsIHAuaWQgPT09IHBhZ2UpOwogIH0pOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXYnKS5jbGFzc0xpc3QucmVtb3ZlKCdvcGVuJyk7CiAgcmVtb3ZlU2NyaW0o',
  'KTsKICBsb2FkKCk7Cn0KCmZ1bmN0aW9uIHJlZnJlc2goKXsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9CgpmdW5jdGlvbiBzZXRZZWFyKHkpewogIFMueWVhciA9IHk7CiAgbG9hZCgpOwp9CgovKioKICog4LmC4Lir4Lil4LiU4LiC4LmJ4Lit4Lih4Li54Lil4LiC',
  '4Lit4LiH4Lir4LiZ4LmJ4Liy4Lib4Lix4LiI4LiI4Li44Lia4Lix4LiZCiAqCiAqIEBwYXJhbSB7e3F1aWV0OmJvb2xlYW59PX0gb3B0cwogKiAgIHF1aWV0ID0g4LiL4Li04LiH4LiB4LmM4LmA4LiH4Li14Lii4LiaIOC5hiDguYDguJrguLfguYnguK3guIfguKvg',
  'uKXguLHguIcg4LmE4Lih4LmI4Lil4LmJ4Liy4LiH4Lir4LiZ4LmJ4Liy4LmA4Lib4LmH4LiZ4Lin4LiH4LiB4Lil4Lih4Lir4Lih4Li44LiZIOC5geC4peC4sOC4hOC4t+C4meC4leC4s+C5geC4q+C4meC5iOC4h+C4l+C4teC5iOC5gOC4peC4t+C5iOC4reC4meC4',
  'hOC5ieC4suC4h+C5hOC4p+C5iQogKiAgICAgICAgICAg4LmD4LiK4LmJ4Lir4Lil4Lix4LiH4LiB4LiU4Lia4Lix4LiZ4LiX4Li24LiBIOC5geC4peC4sOC4leC4reC4meC4nuC4muC4p+C5iOC4suC4oeC4teC4hOC4meC5geC4geC5ieC4guC5ieC4reC4oeC4ueC4',
  'peC4iOC4suC4geC4l+C4teC5iOC4reC4t+C5iOC4mQogKiAgICAgICAgICAg4LmA4Lie4Li34LmI4Lit4LmD4Lir4LmJ4Lir4LiZ4LmJ4Liy4LiI4Lit4LiZ4Li04LmI4LiH4LiX4Li14LmI4Liq4Li44LiUIOC5hOC4oeC5iOC4geC4o+C4sOC4nuC4o+C4tOC4muC5',
  'geC4peC4sOC5hOC4oeC5iOC5gOC4lOC5ieC4h+C4geC4peC4seC4muC5hOC4m+C4muC4meC4quC4uOC4lAogKi8KZnVuY3Rpb24gbG9hZChvcHRzKXsKICBvcHRzID0gKG9wdHMgPT09IHRydWUpID8ge30gOiAob3B0cyB8fCB7fSk7ICAgICAvLyDguYDguJzguLfg',
  'uYjguK3guYLguITguYnguJTguYDguIHguYjguLLguJfguLXguYjguYDguKPguLXguKLguIEgbG9hZCh0cnVlKQogIHZhciBxdWlldCA9ICEhb3B0cy5xdWlldDsKICB2YXIgdmlldyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aWV3Jyk7CiAgdmFyIHIgPSBS',
  'T1VURVNbUy5wYWdlXTsKICBpZiAoIXIpIHsgdmlldy5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz0iZW1wdHkiPuC5hOC4oeC5iOC4nuC4muC4q+C4meC5ieC4suC4meC4teC5iTwvZGl2Pic7IHJldHVybiBQcm9taXNlLnJlc29sdmUoKTsgfQoKICBpZiAoIXF1aWV0',
  'KSB7CiAgICB2aWV3LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj48c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPjwvZGl2PuC4geC4s+C4peC4seC4h+C5guC4q+C4peC4lOC4guC5ieC4reC4oeC4ueC4peKApjwvZGl2Pic7',
  'CiAgfSBlbHNlIHsKICAgIHN5bmNTZXQoJ3N5bmNpbmcnKTsKICB9CgogIHZhciBrZWVwID0gcXVpZXQgPyBzbmFwc2hvdFZpZXcoKSA6IG51bGw7CgogIHJldHVybiByLmxvYWQoKS50aGVuKGZ1bmN0aW9uKGRhdGEpewogICAgUy5jYWNoZVtTLnBhZ2VdID0gZGF0',
  'YTsKICAgIHN5bmNZZWFyT3B0aW9ucyhkYXRhLnllYXJzIHx8IGRhdGEuYXZhaWxhYmxlIHx8IFtdKTsKICAgIHZpZXcuaW5uZXJIVE1MID0gci5yZW5kZXIoZGF0YSk7CiAgICBhcHBseVJlYWRPbmx5KHZpZXcpOwogICAgaWYgKHIuYWZ0ZXIpIHIuYWZ0ZXIoZGF0',
  'YSk7CiAgICBpZiAoa2VlcCkgcmVzdG9yZVZpZXcoa2VlcCk7CiAgICBpZiAocXVpZXQpIHN5bmNTZXQoJ3N5bmNlZCcpOwogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgaWYgKHF1aWV0KSB7ICAgICAgICAgICAgICAgICAgICAgICAvLyDguIvguLTguIfguIHg',
  'uYzguYDguJrguLfguYnguK3guIfguKvguKXguLHguIfguJ7guKXguLLguJQg4oCUIOC4reC4ouC5iOC4suC4l+C4tOC5ieC4h+C4guC4reC4h+C4l+C4teC5iOC5gOC4q+C5h+C4meC4reC4ouC4ueC5iAogICAgICBzeW5jU2V0KGlzT2ZmbGluZUVycm9yKGUpID8g',
  'J29mZmxpbmUnIDogJ2Vycm9yJywgZS5tZXNzYWdlIHx8IGUpOwogICAgICByZXR1cm47CiAgICB9CiAgICB2aWV3LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJjYXJkIj48ZGl2IGNsYXNzPSJjYXJkLWIiPjxoMz7guYLguKvguKXguJTguILguYnguK3guKHguLng',
  'uKXguYTguKHguYjguKrguLPguYDguKPguYfguIg8L2gzPicgKwogICAgICAgICAgICAgICAgICAgICAnPHAgY2xhc3M9Im11dGVkIj4nICsgZXNjKGUubWVzc2FnZXx8ZSkgKyAnPC9wPicgKwogICAgICAgICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRu',
  'IiBvbmNsaWNrPSJsb2FkKCkiPuC4peC4reC4h+C5g+C4q+C4oeC5iDwvYnV0dG9uPjwvZGl2PjwvZGl2Pic7CiAgfSk7Cn0KCi8qKiDguIjguLPguKrguKDguLLguJ7guKvguJnguYnguLLguIjguK3guYTguKfguYnguIHguYjguK3guJnguKfguLLguJTguYPguKvg',
  'uKHguYgg4LmA4Lie4Li34LmI4Lit4LmD4Lir4LmJ4Lic4Li54LmJ4LmD4LiK4LmJ4Lij4Li54LmJ4Liq4Li24LiB4Lin4LmI4Liy4Lir4LiZ4LmJ4Liy4LmE4Lih4LmI4LmE4LiU4LmJ4LiW4Li54LiB4LmC4Lir4Lil4LiU4LmD4Lir4Lih4LmIICovCmZ1bmN0aW9u',
  'IHNuYXBzaG90VmlldygpewogIHZhciBvcGVuID0gW107CiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmJpbGwtbGluZXMnKS5mb3JFYWNoKGZ1bmN0aW9uKGVsKXsKICAgIGlmICghZWwuaGlkZGVuKSBvcGVuLnB1c2goZWwuaWQpOwogIH0pOwogIHJldHVy',
  'biB7IHk6IHdpbmRvdy5zY3JvbGxZIHx8IDAsIG9wZW46IG9wZW4gfTsKfQoKZnVuY3Rpb24gcmVzdG9yZVZpZXcoa2VlcCl7CiAga2VlcC5vcGVuLmZvckVhY2goZnVuY3Rpb24oaWQpewogICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpOwog',
  'ICAgaWYgKGVsKSB7IGVsLmhpZGRlbiA9IGZhbHNlOyB2YXIgYiA9IGVsLnByZXZpb3VzRWxlbWVudFNpYmxpbmc7CiAgICAgICAgICAgICAgaWYgKGIpIGIudGV4dENvbnRlbnQgPSBiLnRleHRDb250ZW50LnJlcGxhY2UoJ+KWvicsICfilrQnKTsgfQogIH0pOwog',
  'IGlmIChrZWVwLnkpIHdpbmRvdy5zY3JvbGxUbygwLCBrZWVwLnkpOwp9CgovKiog4LmA4LiV4Li04Lih4LiV4Lix4Lin4LmA4Lil4Li34Lit4LiB4Lib4Li14LmD4LiZ4LmB4LiW4Lia4Lia4LiZ4LmD4Lir4LmJ4LiV4Lij4LiH4LiB4Lix4Lia4LiC4LmJ4Lit4Lih',
  '4Li54Lil4LiI4Lij4Li04LiH4LiC4Lit4LiH4Lir4LiZ4LmJ4Liy4LiZ4Lix4LmJ4LiZICovCmZ1bmN0aW9uIHN5bmNZZWFyT3B0aW9ucyh5ZWFycyl7CiAgdmFyIHNlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd5ZWFyU2VsJyk7CiAgdmFyIGxpc3QgPSAo',
  'eWVhcnMgfHwgW10pLnNsaWNlKCkuc29ydChmdW5jdGlvbihhLGIpe3JldHVybiBiLWE7fSk7CiAgdmFyIGN1ciA9IG5ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKTsKICBpZiAobGlzdC5pbmRleE9mKGN1cikgPCAwKSBsaXN0LnVuc2hpZnQoY3VyKTsKICB2YXIgaHRt',
  'bCA9ICc8b3B0aW9uIHZhbHVlPSJhbGwiPuC4l+C4uOC4geC4m+C4tTwvb3B0aW9uPic7CiAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHkpewogICAgaHRtbCArPSAnPG9wdGlvbiB2YWx1ZT0iJyArIHkgKyAnIj7guJvguLUgJyArIHkgKyAnICjguJ4u4LioLiAnICsg',
  'KE51bWJlcih5KSs1NDMpICsgJyk8L29wdGlvbj4nOwogIH0pOwogIHNlbC5pbm5lckhUTUwgPSBodG1sOwogIGlmIChsaXN0LmluZGV4T2YoTnVtYmVyKFMueWVhcikpIDwgMCAmJiBTLnllYXIgIT09ICdhbGwnKSBTLnllYXIgPSBTdHJpbmcoY3VyKTsKICBzZWwu',
  'dmFsdWUgPSBTLnllYXI7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4LmC4Lir4Lih4LiU4LiU4Li54Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinIC0tLS0tLS0tLS0tLS0tLS0KICAg4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij',
  '4LmM4LiB4Lix4LiZ4LmE4Lin4LmJ4LmB4Lil4LmJ4Lin4LmD4LiZ4Lif4Lix4LiH4LiB4LmM4LiK4Lix4LiZIGFwaSgpIOC4leC4o+C4h+C4meC4teC5ieC5geC4hOC5iOC4i+C5iOC4reC4meC4m+C4uOC5iOC4oeC4l+C4teC5iOC4geC4lOC5hOC4m+C4geC5h+C4',
  'l+C4s+C5hOC4oeC5iOC5hOC4lOC5iQogICDguYDguJ7guLfguYjguK3guYTguKHguYjguYPguKvguYnguJzguLnguYnguJfguLXguYjguYDguJvguLTguJTguJTguYnguKfguKLguKXguLTguIfguIHguYzguYHguIrguKPguYzguKrguLHguJrguKrguJkgKi8KdmFy',
  'IEVESVRfRU5UUllQT0lOVFMgPSAvXGIoZm9ybURlYnR8Zm9ybURlYnRQYXltZW50fGZvcm1QdXJjaGFzZXxmb3JtQWN8Zm9ybUJ1bGtBY3xmb3JtUmVwYWlyfGZvcm1CdWlsZGluZ3xmb3JtUm9vbXxmb3JtRmluYW5jZXxmb3JtVXNlcnxkZWxEZWJ0fGRlbERlYnRQ',
  'YXltZW50fGRlbFB1cmNoYXNlfGRlbEFjfGRlbFJlcGFpcnxkZWxCdWlsZGluZ3xkZWxGaW5hbmNlfGRlbFVzZXJ8ZG9JbXBvcnRKc29ufGRvUm90YXRlU2hhcmV8ZG9CYWNrdXBOb3d8c2F2ZVNldHRpbmdzRm9ybSlccypcKC87CgpmdW5jdGlvbiBhcHBseVJlYWRP',
  'bmx5KHJvb3QpewogIGlmIChjYW5FZGl0KCkpIHJldHVybjsKICB2YXIgbm9kZXMgPSByb290LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tvbmNsaWNrXScpOwogIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHsKICAgIGlmIChFRElUX0VOVFJZUE9J',
  'TlRTLnRlc3Qobm9kZXNbaV0uZ2V0QXR0cmlidXRlKCdvbmNsaWNrJykgfHwgJycpKSBub2Rlc1tpXS5yZW1vdmUoKTsKICB9Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4Lij4Li14LmA4Lif4Lij4LiK4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li04LmA4Lih4Li3',
  '4LmI4Lit4LiC4LmJ4Lit4Lih4Li54Lil4LmD4LiZ4LiK4Li14LiV4LmA4Lib4Lil4Li14LmI4Lii4LiZIC0tLS0tLS0tLS0tLS0tLS0KCiAgIOC4geC4juC5gOC4q+C4peC5h+C4geC4guC4reC4h+C4quC5iOC4p+C4meC4meC4teC5iTog4Lir4LmJ4Liy4Lih4LmC',
  '4Lir4Lil4LiU4LiX4Lix4Lia4Liq4Li04LmI4LiH4LiX4Li14LmI4Lic4Li54LmJ4LmD4LiK4LmJ4LiB4Liz4Lil4Lix4LiH4Lie4Li04Lih4Lie4LmM4Lit4Lii4Li54LmI4LmA4LiU4LmH4LiU4LiC4Liy4LiUCiAgIOC4luC5ieC4suC4oeC4teC4guC5ieC4reC4',
  'oeC4ueC4peC5g+C4q+C4oeC5iOC4leC4reC4meC4l+C4teC5iOC4nOC4ueC5ieC5g+C4iuC5ieC4geC4s+C4peC4seC4h+C4geC4o+C4reC4geC4reC4ouC4ueC5iCDguYPguKvguYnguILguLbguYnguJnguJvguLjguYjguKHguYDguKXguYfguIEg4LmGIOC5g+C4',
  'q+C5ieC4geC4lOC5gOC4reC4h+C5gOC4oeC4t+C5iOC4reC4nuC4o+C5ieC4reC4oQoKICAg4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4OiDguKPguLjguYjguJnguILguYnguK3guKHguLnguKXguJTguLnguIjguLLguIEgIuC5gOC4p+C4peC4suC4l+C4teC5iOC4',
  'iuC4teC4leC4luC4ueC4geC5geC4geC5ieC4peC5iOC4suC4quC4uOC4lCIg4LiC4Lit4LiHIEdvb2dsZSBEcml2ZQogICDguIvguLbguYjguIfguILguKLguLHguJrguJfguLjguIHguITguKPguLHguYnguIfguJfguLXguYjguKHguLXguIHguLLguKPguYDguILg',
  'uLXguKLguJkg4Lij4Lin4Lih4LiW4Li24LiH4LiV4Lit4LiZ4LiX4Li14LmI4LmA4Lij4Liy4LmA4Lit4LiH4LiB4LiU4Lia4Lix4LiZ4LiX4Li24LiB4LiU4LmJ4Lin4LiiCiAgIOC4iOC4tuC4h+C4leC5ieC4reC4h+C4iOC4lOC4o+C4uOC5iOC4meC5g+C4q+C4',
  'oeC5iOC5hOC4p+C5ieC4q+C4peC4seC4h+C4muC4seC4meC4l+C4tuC4geC4l+C4uOC4geC4hOC4o+C4seC5ieC4hyDguYTguKHguYjguIfguLHguYnguJnguIjguLDguYLguKvguKXguJTguIvguYnguLPguYHguKXguLDguILguLbguYnguJnguILguYnguK3guITg',
  'uKfguLLguKEKICAg4Lin4LmI4LiyICLguKHguLXguITguJnguYHguIHguYnguILguYnguK3guKHguLnguKUiIOC4l+C4seC5ieC4h+C4l+C4teC5iOC4hOC4meC5geC4geC5ieC4hOC4t+C4reC4nOC4ueC5ieC5g+C4iuC5ieC5gOC4reC4hwotLS0tLS0tLS0tLS0t',
  'LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKiDguITguLPguKrguLHguYjguIfguJfguLXguYjguJfguLPguYPguKvguYnguILguYnguK3guKHguLnguKXguYPguJnguIrguLXguJXguYDguJvguKXguLXg',
  'uYjguKLguJkgKOC5g+C4q+C5ieC4leC4o+C4h+C4geC4seC4miBNVVRBVElOR19BQ1RJT05TIOC4neC4seC5iOC4h+C5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jCkgKi8KdmFyIENMSUVOVF9NVVRBVElORyA9IC9cLihzYXZlfGRlbGV0ZXxzYXZlUGF5',
  'bWVudHxkZWxldGVQYXltZW50fGJ1bGtCb29rfGltcG9ydHxyb3RhdGVUb2tlbnxiYWNrdXBOb3d8dXBsb2FkfHRyYXNoKSQvOwoKLyoqCiAqIOC5gOC4nuC4tOC5iOC4h+C4geC4lOC4muC4seC4meC4l+C4tuC4geC5gOC4reC4hyDigJQg4Lir4LiZ4LmJ4Liy4LmC',
  '4Lir4Lil4LiU4LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmI4LmE4Lib4LmB4Lil4LmJ4Lin4LiV4Lit4LiZ4LiB4LiU4Lia4Lix4LiZ4LiX4Li24LiBCiAqIOC4iOC4lOC4o+C4uOC5iOC4meC4guC5ieC4reC4oeC4ueC4peC4peC5iOC4suC4quC4uOC4lOC5',
  'hOC4p+C5iSDguYHguKXguLDguIHguLHguJnguYTguKHguYjguYPguKvguYnguKPguK3guJrguJXguKPguKfguIjguJbguLHguJTguYTguJvguYLguKvguKXguJTguIvguYnguLMKICogKOC5gOC4nOC4t+C5iOC4reC5hOC4p+C5iSAyIOC4meC4suC4l+C4tSDguYDg',
  'uJ7guKPguLLguLAgR29vZ2xlIERyaXZlIOC4reC4seC4m+C5gOC4lOC4leC5gOC4p+C4peC4suC5geC4geC5ieC5hOC4guC4iuC5ieC4suC4geC4p+C5iOC4suC4geC4suC4o+C5gOC4guC4teC4ouC4meC4iOC4o+C4tOC4h+C5gOC4peC5h+C4geC4meC5ieC4reC4',
  'oikKICovCmZ1bmN0aW9uIG1hcmtTZWxmQ2hhbmdlKCl7CiAgUy5zZWxmQ2hhbmdlVW50aWwgPSBEYXRlLm5vdygpICsgMTIwMDAwOwogIGNsZWFyVGltZW91dChTLnN5bmNUaW1lcik7CiAgUy5zeW5jVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7CiAgICBz',
  'eW5jVmVyc2lvbigpOwogICAgcmVmcmVzaEFsZXJ0cygpOyAgICAgLy8g4LiH4Liy4LiZ4LiE4LmJ4Liy4LiH4Lit4Liy4LiI4LmA4Lie4Li04LmI4Lih4Lir4Lij4Li34Lit4Lil4LiU4LiI4Liy4LiB4Liq4Li04LmI4LiH4LiX4Li14LmI4LmA4Lie4Li04LmI4LiH',
  '4Lia4Lix4LiZ4LiX4Li24LiB4LmE4LibCiAgfSwgMTUwMCk7Cn0KCmZ1bmN0aW9uIHN5bmNWZXJzaW9uKCl7CiAgY2FsbEFwaSgnYXBwLnZlcnNpb24nKQogICAgLnRoZW4oZnVuY3Rpb24odil7IGlmICh2ICYmIHYudmVyc2lvbikgUy52ZXJzaW9uID0gdi52ZXJz',
  'aW9uOyB9KQogICAgLmNhdGNoKGZ1bmN0aW9uKCl7IC8qIOC5hOC4p+C5ieC4o+C4reC4muC4q+C4meC5ieC4siAqLyB9KTsKfQoKLyoqIOC4nOC4ueC5ieC5g+C4iuC5ieC4geC4s+C4peC4seC4h+C4geC4o+C4reC4geC4guC5ieC4reC4oeC4ueC4peC4reC4ouC4',
  'ueC5iOC4q+C4o+C4t+C4reC5gOC4m+C4peC5iOC4siDigJQg4LiW4LmJ4Liy4LmD4LiK4LmIIOC4q+C5ieC4suC4oeC5guC4q+C4peC4lOC4l+C4seC4miAqLwpmdW5jdGlvbiB1c2VySXNCdXN5KCl7CiAgdmFyIG1vZGFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5',
  'SWQoJ21vZGFsUm9vdCcpOwogIGlmIChtb2RhbCAmJiBtb2RhbC5pbm5lckhUTUwpIHJldHVybiB0cnVlOyAgICAgICAgICAgICAgLy8g4Lif4Lit4Lij4LmM4Lih4LmA4Lib4Li04LiU4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmICiAgdmFyIGVsID0gZG9jdW1lbnQu',
  'YWN0aXZlRWxlbWVudDsKICBpZiAoZWwgJiYgL14oSU5QVVR8VEVYVEFSRUF8U0VMRUNUKSQvLnRlc3QoZWwudGFnTmFtZSkgJiYKICAgICAgZWwudHlwZSAhPT0gJ2J1dHRvbicgJiYgZWwudHlwZSAhPT0gJ3N1Ym1pdCcpIHJldHVybiB0cnVlOyAgIC8vIOC5gOC4',
  'hOC4reC4o+C5jOC5gOC4i+C4reC4o+C5jOC4reC4ouC4ueC5iOC5g+C4meC4iuC5iOC4reC4h+C4geC4o+C4reC4gQogIHJldHVybiBmYWxzZTsKfQoKZnVuY3Rpb24gcmVmcmVzaExhYmVsKHNlYyl7CiAgaWYgKCFzZWMpIHJldHVybiAn4Lib4Li04LiU4LiB4Liy',
  '4Lij4LiV4Lij4Lin4LiI4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0JzsKICBpZiAoc2VjICUgMzYwMCA9PT0gMCkgcmV0dXJuICfguJXguKPguKfguIjguILguYnguK3guKHguLnguKXguYPguKvguKHguYjguJfguLjguIEgJyArIChzZWMgLyAzNjAwKSArICcg',
  '4LiK4Lix4LmI4Lin4LmC4Lih4LiHJzsKICBpZiAoc2VjICUgNjAgPT09IDApIHJldHVybiAn4LiV4Lij4Lin4LiI4LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmI4LiX4Li44LiBICcgKyAoc2VjIC8gNjApICsgJyDguJnguLLguJfguLUnOwogIHJldHVybiAn',
  '4LiV4Lij4Lin4LiI4LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmI4LiX4Li44LiBICcgKyBzZWMgKyAnIOC4p+C4tOC4meC4suC4l+C4tSc7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4LiV4Lix4Lin4Lia4Lit4LiB4Liq4LiW4Liy4LiZ4Liw4LiB4Liy4Lij',
  '4LiL4Li04LiH4LiB4LmMICjguKHguLjguKHguILguKfguLLguJrguJkpIC0tLS0tLS0tLS0tLS0tLS0KCiAgIOC4q+C4meC5ieC4suC4l+C4teC5iDog4Lia4Lit4LiB4LmD4Lir4LmJ4Lij4Li54LmJ4LiV4Lil4Lit4LiU4Lin4LmI4Liy4LiV4Lit4LiZ4LiZ4Li1',
  '4LmJ4LiC4LmJ4Lit4Lih4Li54Lil4LiV4Lij4LiH4LiB4Lix4Lia4Lir4Lil4Lix4LiH4Lia4LmJ4Liy4LiZ4Lir4Lij4Li34Lit4Lii4Lix4LiHCiAgIOC4geC4s+C4peC4seC4h+C4muC4seC4meC4l+C4tuC4geC4reC4ouC4ueC5iOC5hOC4q+C4oSDguKvguKPg',
  'uLfguK3guKHguLXguK3guLDguYTguKPguITguYnguLLguIfguJfguLXguYjguJXguYnguK3guIfguIjguLHguJTguIHguLLguKMKCiAgIOC4leC4seC5ieC4h+C5g+C4iOC5g+C4q+C5iSAi4LmA4LiH4Li14Lii4Lia4LmA4Lih4Li34LmI4Lit4LiX4Li44LiB4Lit',
  '4Lii4LmI4Liy4LiH4Lib4LiB4LiV4Li0IOC5geC4peC4sOC4iuC4seC4lOC5gOC4iOC4meC5gOC4oeC4t+C5iOC4reC4oeC4teC4reC4sOC5hOC4o+C4nOC4tOC4lOC4m+C4geC4leC4tCIKICAg4Liq4LiW4Liy4LiZ4Liw4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LmD',
  '4Lir4LmJ4Lic4Li54LmJ4LmD4LiK4LmJ4LiX4Liz4Lit4Liw4LmE4Lij4LiV4LmI4LitICjguKHguLXguILguYnguK3guKHguLnguKXguYPguKvguKHguYggLyDguYDguIrguLfguYjguK3guKHguJXguYjguK3guYTguKHguYjguYTguJTguYkpIOC4geC4lOC5hOC4',
  'lOC5iQotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi8KCnZhciBTWU5DID0geyBzdGF0ZTogJ3N5bmNlZCcsIGRldGFpbDogJycsIGF0OiAwLCB0aW1lcjogbnVsbCB9OwoKdmFyIFNZTkNf',
  'TE9PSyA9IHsKICBzeW5jZWQ6ICB7IGNsczogJ29rJywgICBpY29uOiAn4pePJywgIHRleHQ6ICfguIvguLTguIfguIHguYzguYHguKXguYnguKcnIH0sCiAgc3luY2luZzogeyBjbHM6ICdpbmZvJywgaWNvbjogJycsICAgdGV4dDogJ+C4geC4s+C4peC4seC4h+C4',
  'i+C4tOC4h+C4geC5jOKApicsICAgc3BpbjogdHJ1ZSB9LAogIHNhdmluZzogIHsgY2xzOiAnaW5mbycsIGljb246ICcnLCAgIHRleHQ6ICfguIHguLPguKXguLHguIfguJrguLHguJnguJfguLbguIHigKYnLCAgc3BpbjogdHJ1ZSB9LAogIHNhdmVkOiAgIHsgY2xz',
  'OiAnb2snLCAgIGljb246ICfinJMnLCAgdGV4dDogJ+C4muC4seC4meC4l+C4tuC4geC5geC4peC5ieC4pycgfSwKICBwZW5kaW5nOiB7IGNsczogJ3dhcm4nLCBpY29uOiAn4oa7JywgIHRleHQ6ICfguKHguLXguILguYnguK3guKHguLnguKXguYPguKvguKHguYgn',
  'LCAgY2xpY2s6ICdsb2FkUGVuZGluZygpJyB9LAogIG9mZmxpbmU6IHsgY2xzOiAnZGdyJywgIGljb246ICfimqAnLCAgdGV4dDogJ+C5gOC4iuC4t+C5iOC4reC4oeC4leC5iOC4reC5hOC4oeC5iOC5hOC4lOC5iScsIGNsaWNrOiAncmV0cnlTeW5jKCknIH0sCiAg',
  'ZXJyb3I6ICAgeyBjbHM6ICdkZ3InLCAgaWNvbjogJ+KaoCcsICB0ZXh0OiAn4Lia4Lix4LiZ4LiX4Li24LiB4LmE4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIJywgY2xpY2s6ICdyZXRyeVN5bmMoKScgfSwKICBwYXVzZWQ6ICB7IGNsczogJ211dGUnLCBpY29uOiAn',
  '4peLJywgIHRleHQ6ICfguYTguKHguYjguJXguKPguKfguIjguK3guLHguJXguYLguJnguKHguLHguJXguLQnLCBjbGljazogJ2xvYWRQZW5kaW5nKCknIH0KfTsKCi8qKgogKiBAcGFyYW0ge3N0cmluZ30gc3RhdGUg4LiK4Li34LmI4Lit4Liq4LiW4Liy4LiZ4Liw',
  '4LmD4LiZIFNZTkNfTE9PSwogKiBAcGFyYW0ge3N0cmluZz19IGRldGFpbCDguILguYnguK3guITguKfguLLguKHguK3guJjguLTguJrguLLguKLguYDguJ7guLTguYjguKEgKOC5guC4nOC4peC5iOC4leC4reC4meC5gOC4reC4suC5gOC4oeC4suC4quC5jOC4iuC4',
  'teC5iSkKICovCmZ1bmN0aW9uIHN5bmNTZXQoc3RhdGUsIGRldGFpbCl7CiAgLy8g4Liq4LiW4Liy4LiZ4Liw4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LmD4Lir4LmJ4Lic4Li54LmJ4LmD4LiK4LmJ4LiI4Lix4LiU4LiB4Liy4LijIOC4q+C5ieC4suC4oeC4luC4ueC4',
  'geC4quC4luC4suC4meC4sOC4l+C4seC5iOC4p+C5hOC4m+C4oeC4suC4geC4peC4muC4l+C4tOC5ieC4hwogIGlmICgoU1lOQy5zdGF0ZSA9PT0gJ3BlbmRpbmcnIHx8IFNZTkMuc3RhdGUgPT09ICdvZmZsaW5lJykgJiYKICAgICAgKHN0YXRlID09PSAnc3luY2Vk',
  'JyB8fCBzdGF0ZSA9PT0gJ3N5bmNpbmcnKSkgcmV0dXJuOwoKICBTWU5DLnN0YXRlID0gc3RhdGU7CiAgU1lOQy5kZXRhaWwgPSBkZXRhaWwgfHwgJyc7CiAgaWYgKHN0YXRlID09PSAnc3luY2VkJyB8fCBzdGF0ZSA9PT0gJ3NhdmVkJykgU1lOQy5hdCA9IERhdGUu',
  'bm93KCk7CiAgc3luY1BhaW50KCk7CgogIGNsZWFyVGltZW91dChTWU5DLnRpbWVyKTsKICBpZiAoc3RhdGUgPT09ICdzYXZlZCcpIHsgICAgICAgICAgICAgICAgICAgICAgIC8vIOC5guC4iuC4p+C5jCAi4Lia4Lix4LiZ4LiX4Li24LiB4LmB4Lil4LmJ4LinIiDg',
  'uYHguJvguYrguJrguYDguJTguLXguKLguKfguYHguKXguYnguKfguIHguKXguLHguJrguYTguJvguJvguIHguJXguLQKICAgIFNZTkMudGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7CiAgICAgIGlmIChTWU5DLnN0YXRlID09PSAnc2F2ZWQnKSBzeW5jU2V0',
  'KCdzeW5jZWQnKTsKICAgIH0sIDI2MDApOwogIH0KfQoKZnVuY3Rpb24gc3luY1BhaW50KCl7CiAgdmFyIGRvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsaXZlRG90Jyk7CiAgaWYgKCFkb3QpIHJldHVybjsKICB2YXIgbG9vayA9IFNZTkNfTE9PS1tTWU5D',
  'LnN0YXRlXSB8fCBTWU5DX0xPT0suc3luY2VkOwoKICB2YXIgdGlwID0gU1lOQy5kZXRhaWwgfHwgc3luY1Rvb2x0aXAoKTsKICAvLyDguKvguYjguK3guILguYnguK3guITguKfguLLguKHguYTguKfguYkg4LmA4Lie4Li34LmI4Lit4LmD4Lir4LmJ4LiI4Lit4LmB',
  '4LiE4Lia4LiL4LmI4Lit4LiZ4LmA4LiJ4Lie4Liy4Liw4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LmB4Lil4Liw4Lii4Lix4LiH4LmA4Lir4LmH4LiZ4LmE4Lit4LiE4Lit4LiZ4Lit4Lii4Li54LmICiAgdmFyIGJvZHkgPSAobG9vay5zcGluID8gJzxzcGFuIGNsYXNz',
  'PSJzcGluIj48L3NwYW4+ICcgOiAobG9vay5pY29uID8gbG9vay5pY29uICsgJyAnIDogJycpKSArCiAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9InN5bmMtbGFiZWwiPicgKyBsb29rLnRleHQgKyAnPC9zcGFuPic7CiAgdmFyIGNscyA9ICdiICcgKyBsb29rLmNs',
  'cyArICcgc3luYy1waWxsJzsKCiAgZG90LmlubmVySFRNTCA9IGxvb2suY2xpY2sKICAgID8gJzxidXR0b24gY2xhc3M9IicgKyBjbHMgKyAnIiBzdHlsZT0iYm9yZGVyOjA7Y3Vyc29yOnBvaW50ZXI7Zm9udDppbmhlcml0IiAnICsKICAgICAgJ3RpdGxlPSInICsg',
  'ZXNjKHRpcCkgKyAnIiBvbmNsaWNrPSInICsgbG9vay5jbGljayArICciPicgKyBib2R5ICsgJzwvYnV0dG9uPicKICAgIDogJzxzcGFuIGNsYXNzPSInICsgY2xzICsgJyIgdGl0bGU9IicgKyBlc2ModGlwKSArICciPicgKyBib2R5ICsgJzwvc3Bhbj4nOwp9Cgpm',
  'dW5jdGlvbiBzeW5jVG9vbHRpcCgpewogIHZhciBiYXNlID0gcmVmcmVzaExhYmVsKFBPTExfU0VDT05EUykgKyAnIMK3IOC5hOC4oeC5iOC5guC4q+C4peC4lOC4l+C4seC4muC4leC4reC4meC4geC4s+C4peC4seC4h+C4geC4o+C4reC4geC4guC5ieC4reC4oeC4',
  'ueC4pSc7CiAgaWYgKCFTWU5DLmF0KSByZXR1cm4gYmFzZTsKICB2YXIgZCA9IG5ldyBEYXRlKFNZTkMuYXQpOwogIHZhciBoaCA9ICgnMCcgKyBkLmdldEhvdXJzKCkpLnNsaWNlKC0yKSwgbW0gPSAoJzAnICsgZC5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKTsKICBy',
  'ZXR1cm4gJ+C4leC4o+C4h+C4geC4seC4muC4guC5ieC4reC4oeC4ueC4peC4q+C4peC4seC4h+C4muC5ieC4suC4meC5gOC4oeC4t+C5iOC4rSAnICsgaGggKyAnOicgKyBtbSArICcg4LiZLlxuJyArIGJhc2U7Cn0KCi8qKiDguYDguJnguYfguJXguKrguLDguJTg',
  'uLjguJQv4Lir4Lil4Li44LiUIOC4leC5iOC4suC4h+C4iOC4suC4gSAi4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4LiV4Lit4Lia4Lin4LmI4Liy4LiX4Liz4LmE4Lih4LmI4LmE4LiU4LmJIiDguIvguLbguYjguIfguYDguJvguYfguJnguITguKfg',
  'uLLguKHguJzguLTguJTguILguK3guIfguITguLPguKrguLHguYjguIcgKi8KZnVuY3Rpb24gaXNPZmZsaW5lRXJyb3IoZSl7CiAgaWYgKHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIG5hdmlnYXRvci5vbkxpbmUgPT09IGZhbHNlKSByZXR1cm4g',
  'dHJ1ZTsKICB2YXIgbSA9IFN0cmluZygoZSAmJiBlLm1lc3NhZ2UpIHx8IGUgfHwgJycpOwogIHJldHVybiAvbmV0d29ya3xmYWlsZWR8dGltZW91dHzguYDguITguKPguLfguK3guILguYjguLLguKJ84LmA4LiK4Li34LmI4Lit4Lih4LiV4LmI4LitfOC5hOC4oeC5',
  'iOC5hOC4lOC5ieC4o+C4seC4muC4guC5ieC4reC4oeC4ueC4peC4iOC4suC4geC5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jC9pLnRlc3QobSk7Cn0KCi8qKiDguJzguLnguYnguYPguIrguYnguIHguJTguJfguLXguYjguJXguLHguKfguJrguK3guIHg',
  'uKrguJbguLLguJnguLDguJXguK3guJnguKHguLXguJvguLHguI3guKvguLIg4oCUIOC4peC4reC4h+C5g+C4q+C4oeC5iOC4l+C4seC4meC4l+C4tSAqLwpmdW5jdGlvbiByZXRyeVN5bmMoKXsKICBTWU5DLnN0YXRlID0gJ3N5bmNpbmcnOwogIHN5bmNQYWludCgp',
  'OwogIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKfQoKLyoqIOC5guC4q+C4peC4lOC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C4oeC5iOC4leC4reC4meC4l+C4teC5iOC4nOC4ueC5ieC5g+C4iuC5ieC4nuC4o+C5ieC4reC4oSAo4LiB4LiU4LiI4Liy4LiB4Lib4LmJ',
  '4Liy4LiiICLguKHguLXguILguYnguK3guKHguLnguKXguYPguKvguKHguYgiKSAqLwpmdW5jdGlvbiBsb2FkUGVuZGluZygpewogIFNZTkMuc3RhdGUgPSAnc3luY2luZyc7CiAgc3luY1BhaW50KCk7CiAgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwp9Cgp2YXIgUE9M',
  'TF9TRUNPTkRTID0gMDsKdmFyIFBPTExfVElNRVIgPSBudWxsOwoKZnVuY3Rpb24gc3RhcnRQb2xsaW5nKHNlY29uZHMpewogIHZhciBzZWMgPSBOdW1iZXIoc2Vjb25kcyB8fCAwKTsKICBQT0xMX1NFQ09ORFMgPSBzZWM7CiAgY2xlYXJJbnRlcnZhbChQT0xMX1RJ',
  'TUVSKTsKCiAgaWYgKCFzZWMpIHsgc3luY1NldCgncGF1c2VkJyk7IHJldHVybjsgfSAgIC8vIOC4m+C4tOC4lOC4geC4suC4o+C4leC4o+C4p+C4iOC4reC4seC4leC5guC4meC4oeC4seC4leC4tCDigJQg4LiB4LiU4LiX4Li14LmI4Lib4LmJ4Liy4Lii4LmA4Lie',
  '4Li34LmI4Lit4LiL4Li04LiH4LiB4LmM4LmA4Lit4LiH4LmE4LiU4LmJCiAgc3luY1NldCgnc3luY2VkJyk7CgogIFBPTExfVElNRVIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpewogICAgaWYgKGRvY3VtZW50LmhpZGRlbikgcmV0dXJuOwogICAgY2FsbEFwaSgn',
  'YXBwLnZlcnNpb24nKS50aGVuKGZ1bmN0aW9uKHYpewogICAgICBpZiAoU1lOQy5zdGF0ZSA9PT0gJ29mZmxpbmUnKSBzeW5jU2V0KCdzeW5jZWQnKTsgICAvLyDguIHguKXguLHguJrguKHguLLguJXguYjguK3guYTguJTguYnguYHguKXguYnguKcKICAgICAgaWYg',
  'KCF2IHx8ICF2LnZlcnNpb24gfHwgdi52ZXJzaW9uID09PSBTLnZlcnNpb24pIHJldHVybjsKICAgICAgUy52ZXJzaW9uID0gdi52ZXJzaW9uOwoKICAgICAgLy8g4LmA4Lij4Liy4LmA4Lib4LmH4LiZ4LiE4LiZ4LmB4LiB4LmJ4LmA4Lit4LiHIOC5geC4peC4sOC4',
  'q+C4meC5ieC4suC4geC5h+C4i+C4tOC4h+C4geC5jOC5hOC4m+C5geC4peC5ieC4p+C4leC4reC4meC4geC4lOC4muC4seC4meC4l+C4tuC4gQogICAgICBpZiAoRGF0ZS5ub3coKSA8IFMuc2VsZkNoYW5nZVVudGlsKSByZXR1cm47CgogICAgICAvLyDguIHguLPg',
  'uKXguLHguIfguIHguKPguK3guIHguILguYnguK3guKHguLnguKXguK3guKLguLnguYgg4oCUIOC4q+C5ieC4suC4oeC5guC4q+C4peC4lOC4l+C4seC4miDguKPguK3guYPguKvguYnguJzguLnguYnguYPguIrguYnguIHguJTguYDguK3guIcKICAgICAgaWYgKHVz',
  'ZXJJc0J1c3koKSkgeyBzeW5jU2V0KCdwZW5kaW5nJyk7IHJldHVybjsgfQoKICAgICAgLy8g4LiL4Li04LiH4LiB4LmM4LmA4LiH4Li14Lii4LiaIOC5hiDguYTguKHguYjguKXguYnguLLguIfguKvguJnguYnguLIg4LmE4Lih4LmI4LmA4LiU4LmJ4LiH4LiB4Lil',
  '4Lix4Lia4LmE4Lib4Lia4LiZ4Liq4Li44LiUCiAgICAgIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKICAgICAgcmVmcmVzaEFsZXJ0cygpOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgIHN5bmNTZXQoaXNPZmZsaW5lRXJyb3IoZSkgPyAnb2ZmbGluZScg',
  'OiAnZXJyb3InLCAoZSAmJiBlLm1lc3NhZ2UpIHx8IFN0cmluZyhlKSk7CiAgICB9KTsKICB9LCBzZWMgKiAxMDAwKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguKjguLnguJnguKLguYzguYHguIjguYnguIfguYDguJXguLfguK3guJkgLS0tLS0tLS0tLS0tLS0t',
  'LQoKICAg4LiV4Lix4Lin4LmA4Lil4LiC4Lia4LiZ4LmA4Lih4LiZ4Li5ICjguYDguIrguYjguJkgNiDguKvguKXguLHguIcgIuC4peC5ieC4suC4h+C5geC4reC4o+C5jCIpIOC4geC4seC4muC4geC4peC5iOC4reC4h+C5geC4iOC5ieC4h+C5gOC4leC4t+C4reC4',
  'meC4muC4meC5geC4luC4muC4q+C4seC4pwogICDguYPguIrguYnguILguYnguK3guKHguLnguKXguIrguLjguJTguYDguJTguLXguKLguKfguIHguLHguJnguIjguLLguIHguITguLPguKrguLHguYjguIcgYXBwLmFsZXJ0cyDguIvguLbguYjguIfguYDguJrguLLg',
  'uIHguKfguYjguLLguYHguJTguIrguJrguK3guKPguYzguJTguKHguLLguIEKCiAgIOC4reC4seC4m+C5gOC4lOC4leC5gOC4oeC4t+C5iOC4rTog4LmA4Lib4Li04LiU4Lij4Liw4Lia4LiaIMK3IOC4q+C4peC4seC4h+C4geC4lOC4muC4seC4meC4l+C4tuC4gS/g',
  'uKXguJrguJfguLjguIHguITguKPguLHguYnguIcgwrcg4LiX4Li44LiB4Lij4Lit4Lia4LiV4Lij4Lin4LiI4LiC4LmJ4Lit4Lih4Li54LilCiAgIOC5gOC4lOC4tOC4oeC4leC4seC4p+C5gOC4peC4guC4meC4teC5ieC4reC4seC4m+C5gOC4lOC4leC4leC4reC4',
  'meC5gOC4m+C4tOC4lOC4q+C4meC5ieC4suC5geC4lOC4iuC4muC4reC4o+C5jOC4lOC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pwogICDguYTguJvguK3guKLguLnguYjguKvguJnguYnguLLguK3guLfguYjguJnguYHguKXguYnguKfguJXguLHguKfguYDg',
  'uKXguILguIjguLbguIfguITguYnguLLguIfguK3guKLguLnguYjguJfguLXguYjguITguYjguLLguYDguIHguYjguLIKLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovCgp2YXIgQUxFUlRT',
  'ID0geyBjb3VudHM6IHt9LCBpdGVtczogW10sIHRvdGFsOiAwLCB1cmdlbnQ6IDAsIGF0OiAnJyB9OwoKZnVuY3Rpb24gcmVmcmVzaEFsZXJ0cygpewogIHJldHVybiBjYWxsQXBpKCdhcHAuYWxlcnRzJykudGhlbihmdW5jdGlvbihhKXsKICAgIEFMRVJUUyA9IGEg',
  'fHwgQUxFUlRTOwogICAgcGFpbnRCYWRnZXMoKTsKICAgIHBhaW50QmVsbCgpOwogICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdub3RpZlBhbmVsJykpIHJlbmRlck5vdGlmUGFuZWwoKTsgICAvLyDguYDguJvguLTguJTguITguYnguLLguIfguK3guKLg',
  'uLnguYgg4LmD4Lir4LmJ4Lit4Lix4Lib4LmA4LiU4LiV4LiV4Liy4LihCiAgICByZXR1cm4gYTsKICB9KS5jYXRjaChmdW5jdGlvbigpeyAvKiDguYDguJnguYfguJXguKrguLDguJTguLjguJQg4LmE4Lin4LmJ4Lij4Lit4Lia4Lir4LiZ4LmJ4LiyICovIH0pOwp9',
  'CgovKiog4LiV4Lix4Lin4LmA4Lil4LiC4Lia4LiZ4LmA4Lih4LiZ4Li54LiL4LmJ4Liy4LiiIOKAlCDguJrguK3guIHguIjguLPguJnguKfguJnguIfguLLguJnguJfguLXguYjguKLguLHguIfguITguYnguLLguIfguK3guKLguLnguYjguILguK3guIfguYHguJXg',
  'uYjguKXguLDguYLguKHguJTguLnguKUgKi8KZnVuY3Rpb24gcGFpbnRCYWRnZXMoKXsKICB2YXIgYyA9IEFMRVJUUy5jb3VudHMgfHwge307CiAgUEFHRVMuZm9yRWFjaChmdW5jdGlvbihwKXsgc2V0QmFkZ2UocC5pZCwgY1twLmlkXSB8fCAwKTsgfSk7Cn0KCmZ1',
  'bmN0aW9uIHNldEJhZGdlKHBhZ2UsIG4pewogIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiYWRnZS0nICsgcGFnZSk7CiAgaWYgKCFlbCkgcmV0dXJuOwogIGlmIChuID4gMCkgewogICAgZWwudGV4dENvbnRlbnQgPSBuID4gOTkgPyAnOTkrJyA6',
  'IG47CiAgICBlbC5zdHlsZS5kaXNwbGF5ID0gJyc7CiAgICBlbC50aXRsZSA9ICfguKLguLHguIfguITguYnguLLguIfguK3guKLguLnguYggJyArIG4gKyAnIOC4o+C4suC4ouC4geC4suC4oyc7CiAgfSBlbHNlIHsKICAgIGVsLnN0eWxlLmRpc3BsYXkgPSAnbm9u',
  'ZSc7CiAgfQp9CgovKiAtLS0tIOC4geC4o+C4sOC4lOC4tOC5iOC4h+C4muC4meC5geC4luC4muC4q+C4seC4pyAtLS0tICovCgpmdW5jdGlvbiBwYWludEJlbGwoKXsKICB2YXIgd3JhcCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiZWxsV3JhcCcpOwogIGlm',
  'ICghd3JhcCkgcmV0dXJuOwoKICAvLyDguKfguLLguJTguYDguInguJ7guLLguLDguJXguLHguKfguJvguLjguYjguKEg4Lir4LmJ4Liy4Lih4LmA4LiC4Li14Lii4LiZ4LiX4Lix4Lia4LiX4Lix4LmJ4LiHIGJlbGxXcmFwCiAgLy8g4LmA4Lie4Lij4Liy4Liw4LiB',
  '4Lil4LmI4Lit4LiH4LmB4LiI4LmJ4LiH4LmA4LiV4Li34Lit4LiZ4LiX4Li14LmI4LmA4Lib4Li04LiU4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmI4LiB4LmH4LmA4Lib4LmH4LiZ4Lil4Li54LiB4LiC4Lit4LiHIGJlbGxXcmFwIOC5gOC4q+C4oeC4t+C4reC4meC4',
  'geC4seC4mQogIHZhciBzbG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JlbGxTbG90Jyk7CiAgaWYgKCFzbG90KSB7CiAgICBzbG90ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpOwogICAgc2xvdC5pZCA9ICdiZWxsU2xvdCc7CiAgICB3cmFw',
  'Lmluc2VydEJlZm9yZShzbG90LCB3cmFwLmZpcnN0Q2hpbGQpOwogIH0KCiAgdmFyIG4gPSBBTEVSVFMudG90YWwgfHwgMDsKICB2YXIgdXJnZW50ID0gQUxFUlRTLnVyZ2VudCB8fCAwOwogIHNsb3QuaW5uZXJIVE1MID0KICAgICc8YnV0dG9uIGNsYXNzPSJidG4g',
  'aWNvbiBiZWxsIiBpZD0iYmVsbEJ0biIgb25jbGljaz0idG9nZ2xlTm90aWYoKSIgJyArCiAgICAgICd0aXRsZT0iJyArIChuID8gJ+C4oeC4tSAnICsgbiArICcg4LmA4Lij4Li34LmI4Lit4LiH4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LiU4Li5JyA6ICfguYTguKHg',
  'uYjguKHguLXguIfguLLguJnguITguYnguLLguIcnKSArICciICcgKwogICAgICAnYXJpYS1sYWJlbD0i4LiB4Liy4Lij4LmB4LiI4LmJ4LiH4LmA4LiV4Li34Lit4LiZIj7wn5SUJyArCiAgICAgIChuID8gJzxzcGFuIGNsYXNzPSJiZWxsLWRvdCcgKyAodXJnZW50',
  'ID8gJyB1cmdlbnQnIDogJycpICsgJyI+JyArIChuID4gOTkgPyAnOTkrJyA6IG4pICsgJzwvc3Bhbj4nIDogJycpICsKICAgICc8L2J1dHRvbj4nOwp9CgpmdW5jdGlvbiB0b2dnbGVOb3RpZigpewogIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbm90aWZQ',
  'YW5lbCcpKSByZXR1cm4gY2xvc2VOb3RpZigpOwogIHZhciB3cmFwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JlbGxXcmFwJyk7CiAgaWYgKCF3cmFwKSByZXR1cm47CiAgdmFyIHBhbmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgcGFu',
  'ZWwuaWQgPSAnbm90aWZQYW5lbCc7CiAgcGFuZWwuY2xhc3NOYW1lID0gJ25vdGlmJzsKICB3cmFwLmFwcGVuZENoaWxkKHBhbmVsKTsKICByZW5kZXJOb3RpZlBhbmVsKCk7CiAgc2V0VGltZW91dChmdW5jdGlvbigpeyBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVy',
  'KCdjbGljaycsIG5vdGlmT3V0c2lkZSwgdHJ1ZSk7IH0sIDApOwogIHJlZnJlc2hBbGVydHMoKTsgICAgICAgICAgICAgICAgICAgICAgLy8g4LmA4Lib4Li04LiU4LiX4Li14LmE4Lij4LiB4LmH4LiU4Li24LiH4LiC4Lit4LiH4Lil4LmI4Liy4Liq4Li44LiU4Lih',
  '4Liy4LmD4Lir4LmJ4LiU4LmJ4Lin4LiiCn0KCmZ1bmN0aW9uIGNsb3NlTm90aWYoKXsKICB2YXIgcCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdub3RpZlBhbmVsJyk7CiAgaWYgKHApIHAucmVtb3ZlKCk7CiAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5l',
  'cignY2xpY2snLCBub3RpZk91dHNpZGUsIHRydWUpOwp9CgpmdW5jdGlvbiBub3RpZk91dHNpZGUoZSl7CiAgdmFyIHdyYXAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmVsbFdyYXAnKTsKICBpZiAod3JhcCAmJiAhd3JhcC5jb250YWlucyhlLnRhcmdldCkp',
  'IGNsb3NlTm90aWYoKTsKfQoKdmFyIE5PVElGX0dST1VQUyA9IFsKICB7IG1vZHVsZToncmVwYWlycycsICAgaWM6J/CflKcnLCBsYWJlbDon4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiE4LmJ4Liy4LiHJyB9LAogIHsgbW9kdWxlOidhYycsICAgICAgICBpYzon4p2E',
  '77iPJywgbGFiZWw6J+C4peC5ieC4suC4h+C5geC4reC4o+C5jOC4luC4tuC4h+C4geC4s+C4q+C4meC4lCcgfSwKICB7IG1vZHVsZTonYnVpbGRpbmcnLCAgaWM6J/Cfj6InLCBsYWJlbDon4LiH4Liy4LiZ4LiV4Li24LiB4Liq4LmI4Lin4LiZ4LiB4Lil4Liy4LiH',
  'JyB9LAogIHsgbW9kdWxlOidwdXJjaGFzZXMnLCBpYzon8J+boe+4jycsIGxhYmVsOifguJvguKPguLDguIHguLHguJnguYPguIHguKXguYnguKvguKHguJQnIH0sCiAgeyBtb2R1bGU6J2ZpbmFuY2UnLCAgIGljOifwn6e+JywgbGFiZWw6J+C4muC4tOC4peC4o+C4',
  'suC4ouC5gOC4lOC4t+C4reC4mScgfQpdOwoKZnVuY3Rpb24gcmVuZGVyTm90aWZQYW5lbCgpewogIHZhciBwYW5lbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdub3RpZlBhbmVsJyk7CiAgaWYgKCFwYW5lbCkgcmV0dXJuOwogIHZhciBpdGVtcyA9IEFMRVJU',
  'Uy5pdGVtcyB8fCBbXTsKCiAgdmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0ibm90aWYtaCI+PGI+4LiB4Liy4Lij4LmB4LiI4LmJ4LiH4LmA4LiV4Li34Lit4LiZPC9iPicgKwogICAgJzxzcGFuIGNsYXNzPSJzcCI+JyArCiAgICAgIChpdGVtcy5sZW5ndGggPyAnPHNw',
  'YW4gY2xhc3M9ImIgJyArIChBTEVSVFMudXJnZW50ID8gJ2RncicgOiAnd2FybicpICsgJyI+JyArIGl0ZW1zLmxlbmd0aCArICcg4LmA4Lij4Li34LmI4Lit4LiHPC9zcGFuPicgOiAnJykgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24iIHRpdGxl',
  'PSLguJTguLbguIfguILguYnguK3guKHguLnguKXguKXguYjguLLguKrguLjguJQiIG9uY2xpY2s9InJlZnJlc2hBbGVydHMoKSI+4oa7PC9idXR0b24+JyArCiAgICAnPC9zcGFuPjwvZGl2Pic7CgogIGlmICghaXRlbXMubGVuZ3RoKSB7CiAgICBwYW5lbC5pbm5l',
  'ckhUTUwgPSBoZWFkICsKICAgICAgJzxkaXYgY2xhc3M9Im5vdGlmLWVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPuKchTwvZGl2PuC5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4hOC5ieC4suC4hzxicj4nICsKICAgICAgJzxzcGFuIGNsYXNzPSJmczEyIGZhaW50Ij7g',
  'uJfguLjguIHguK3guKLguYjguLLguIfguYDguKPguLXguKLguJrguKPguYnguK3guKLguJTguLU8L3NwYW4+PC9kaXY+JzsKICAgIHJldHVybjsKICB9CgogIC8vIOC4iOC4seC4lOC4geC4peC4uOC5iOC4oeC4leC4suC4oeC5guC4oeC4lOC4ueC4pSDguYDguKPg',
  'uLXguKLguIfguJXguLLguKHguKXguLPguJTguLHguJrguJfguLXguYjguJzguLnguYnguYPguIrguYnguKrguJnguYPguIjguIHguYjguK3guJkKICB2YXIgYm9keSA9ICcnOwogIE5PVElGX0dST1VQUy5mb3JFYWNoKGZ1bmN0aW9uKGcpewogICAgdmFyIGxpc3Qg',
  'PSBpdGVtcy5maWx0ZXIoZnVuY3Rpb24oYSl7IHJldHVybiBhLm1vZHVsZSA9PT0gZy5tb2R1bGU7IH0pOwogICAgaWYgKCFsaXN0Lmxlbmd0aCkgcmV0dXJuOwogICAgYm9keSArPSAnPGRpdiBjbGFzcz0ibm90aWYtc2VjIj4nICsgZy5pYyArICcgJyArIGVzYyhn',
  'LmxhYmVsKSArICcgKCcgKyBsaXN0Lmxlbmd0aCArICcpPC9kaXY+JzsKICAgIGxpc3Quc2xpY2UoMCwgOCkuZm9yRWFjaChmdW5jdGlvbihhKXsKICAgICAgYm9keSArPSAnPGJ1dHRvbiBjbGFzcz0ibm90aWYtaXRlbSBsLScgKyBlc2MoYS5sZXZlbCkgKyAnIiBv',
  'bmNsaWNrPSJnb3RvQWxlcnQoXCcnICsgZXNjKGEubW9kdWxlKSArICdcJykiPicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJ0dCI+JyArIGVzYyhhLnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgICAoYS5kZXRhaWwgPyAnPGRpdiBjbGFzcz0iZGQiPicgKyBlc2Mo',
  'YS5kZXRhaWwpICsgJzwvZGl2PicgOiAnJykgKwogICAgICAnPC9idXR0b24+JzsKICAgIH0pOwogICAgaWYgKGxpc3QubGVuZ3RoID4gOCkgewogICAgICBib2R5ICs9ICc8YnV0dG9uIGNsYXNzPSJub3RpZi1tb3JlIiBvbmNsaWNrPSJnb3RvQWxlcnQoXCcnICsg',
  'ZXNjKGcubW9kdWxlKSArICdcJykiPicgKwogICAgICAgICfguJTguLnguK3guLXguIEgJyArIChsaXN0Lmxlbmd0aCAtIDgpICsgJyDguKPguLLguKLguIHguLLguKMg4oaSPC9idXR0b24+JzsKICAgIH0KICB9KTsKCiAgcGFuZWwuaW5uZXJIVE1MID0gaGVhZCAr',
  'ICc8ZGl2IGNsYXNzPSJub3RpZi1saXN0Ij4nICsgYm9keSArICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJub3RpZi1mIj7guK3guLHguJvguYDguJTguJXguYDguKHguLfguYjguK0gJyArIGVzYyhTdHJpbmcoQUxFUlRTLmF0IHx8ICcnKS5zbGljZSgxMSwg',
  'MTYpIHx8ICfigJMnKSArICcg4LiZLiDCtyAnICsKICAgICc8YSBocmVmPSJqYXZhc2NyaXB0OnZvaWQoMCkiIG9uY2xpY2s9ImNsb3NlTm90aWYoKTtnbyhcJ2Rhc2hib2FyZFwnKSI+4LiU4Li54LiX4Lix4LmJ4LiH4Lir4Lih4LiU4LmD4LiZ4LmB4LiU4LiK4Lia',
  '4Lit4Lij4LmM4LiUIOKGkjwvYT48L2Rpdj4nOwp9CgpmdW5jdGlvbiBnb3RvQWxlcnQobW9kdWxlKXsKICBjbG9zZU5vdGlmKCk7CiAgZ28obW9kdWxlID09PSAnZGVidCcgPyAnZGVidE1haW4nIDogbW9kdWxlKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSBmb3Jt',
  'YXQgaGVscGVycyAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiBlc2Mocyl7CiAgcmV0dXJuIFN0cmluZyhzPT1udWxsPycnOnMpCiAgICAucmVwbGFjZSgvJi9nLCcmYW1wOycpLnJlcGxhY2UoLzwvZywnJmx0OycpLnJlcGxhY2UoLz4vZywnJmd0OycpCiAg',
  'ICAucmVwbGFjZSgvIi9nLCcmcXVvdDsnKS5yZXBsYWNlKC8nL2csJyYjMzk7Jyk7Cn0KZnVuY3Rpb24gbW9uZXkobiwgZGVjKXsKICB2YXIgdiA9IE51bWJlcihufHwwKTsKICByZXR1cm4gdi50b0xvY2FsZVN0cmluZygndGgtVEgnLHttaW5pbXVtRnJhY3Rpb25E',
  'aWdpdHM6ZGVjfHwwLCBtYXhpbXVtRnJhY3Rpb25EaWdpdHM6ZGVjfHwwfSk7Cn0KZnVuY3Rpb24gYmFodChuKXsgcmV0dXJuIG1vbmV5KG4pICsgJyDguL8nOyB9CmZ1bmN0aW9uIHBjdChuKXsgcmV0dXJuIChOdW1iZXIobil8fDApLnRvRml4ZWQoMSkgKyAnJSc7',
  'IH0KZnVuY3Rpb24gbnVtKG4peyByZXR1cm4gbj09bnVsbHx8bj09PScnID8gJ+KAkycgOiBtb25leShuKTsgfQoKLyoqIDIwMjYtMDQtMjYgLT4gMjYg4LmA4LihLuC4oi4gMjU2OSAqLwp2YXIgVEhfTU9OID0gWyfguKEu4LiELicsJ+C4gS7guJ4uJywn4Lih4Li1',
  'LuC4hC4nLCfguYDguKEu4LiiLicsJ+C4ni7guIQuJywn4Lih4Li0LuC4oi4nLCfguIEu4LiELicsJ+C4qi7guIQuJywn4LiBLuC4oi4nLCfguJUu4LiELicsJ+C4ni7guKIuJywn4LiYLuC4hC4nXTsKZnVuY3Rpb24gdGhEYXRlKGlzbyl7CiAgaWYgKCFpc28pIHJl',
  'dHVybiAn4oCTJzsKICB2YXIgbSA9IFN0cmluZyhpc28pLm1hdGNoKC9eKFxkezR9KS0oXGR7Mn0pLShcZHsyfSkvKTsKICBpZiAoIW0pIHJldHVybiBlc2MoaXNvKTsKICByZXR1cm4gTnVtYmVyKG1bM10pICsgJyAnICsgVEhfTU9OW051bWJlcihtWzJdKS0xXSAr',
  'ICcgJyArIChOdW1iZXIobVsxXSkrNTQzKTsKfQpmdW5jdGlvbiB0aERhdGVTaG9ydChpc28pewogIGlmICghaXNvKSByZXR1cm4gJ+KAkyc7CiAgdmFyIG0gPSBTdHJpbmcoaXNvKS5tYXRjaCgvXihcZHs0fSktKFxkezJ9KS0oXGR7Mn0pLyk7CiAgaWYgKCFtKSBy',
  'ZXR1cm4gZXNjKGlzbyk7CiAgcmV0dXJuIE51bWJlcihtWzNdKSArICcvJyArIE51bWJlcihtWzJdKSArICcvJyArIFN0cmluZyhOdW1iZXIobVsxXSkrNTQzKS5zbGljZSgyKTsKfQpmdW5jdGlvbiBkYXlzQWdvKGlzbyl7CiAgaWYgKCFpc28pIHJldHVybiBudWxs',
  'OwogIHJldHVybiBNYXRoLnJvdW5kKChEYXRlLm5vdygpIC0gbmV3IERhdGUoaXNvKS5nZXRUaW1lKCkpLzg2NDAwMDAwKTsKfQoKZnVuY3Rpb24gc3RhdHVzQmFkZ2Uoc3QpewogIHZhciBtYXAgPSB7CiAgICAn4LmA4Liq4Lij4LmH4LiI4Liq4Li04LmJ4LiZJzon',
  'b2snLCfguJTguLPguYDguJnguLTguJnguIHguLLguKPguYHguKXguYnguKcnOidvaycsJ+C5g+C4iuC5ieC4h+C4suC4meC4m+C4geC4leC4tCc6J29rJywn4Lib4Li04LiU4Lir4LiZ4Li14LmJ4LmB4Lil4LmJ4LinJzonb2snLCfguK3guKLguLnguYjguYPguJng',
  'uJvguKPguLDguIHguLHguJknOidvaycsJ+C4oeC4teC4nOC4ueC5ieC5gOC4iuC5iOC4sic6J29rJywn4Lib4LiB4LiV4Li0Jzonb2snLAogICAgJ+C4geC4s+C4peC4seC4h+C4i+C5iOC4reC4oSc6J2luZm8nLCfguIHguLPguKXguLHguIfguJTguLPguYDguJng',
  'uLTguJnguIHguLLguKMnOidpbmZvJywn4LiZ4Lix4LiU4Lir4Lih4Liy4Lii4LmB4Lil4LmJ4LinJzonaW5mbycsJ+C4geC4s+C4peC4seC4h+C4nOC5iOC4reC4mSc6J2luZm8nLCfguKfguYjguLLguIcnOidpbmZvJywKICAgICfguKPguK3guJTguLPguYDguJng',
  'uLTguJnguIHguLLguKMnOid3YXJuJywn4LmA4Lil4Li34LmI4Lit4LiZ4LiZ4Lix4LiUJzond2FybicsJ+C5g+C4geC4peC5ieC4q+C4oeC4lOC4m+C4o+C4sOC4geC4seC4mSc6J3dhcm4nLCfguJXguYnguK3guIfguIvguYjguK3guKEnOid3YXJuJywn4Lie4Lix',
  '4LiB4LiK4Liz4Lij4LiwJzond2FybicsJ+C4m+C4tOC4lOC4m+C4o+C4seC4muC4m+C4o+C4uOC4hyc6J3dhcm4nLCfguYDguIHguLTguJnguIHguLPguKvguJnguJQnOid3YXJuJywn4Lii4Lix4LiH4LmE4Lih4LmI4LmA4LiE4Lii4Lil4LmJ4Liy4LiHJzond2Fy',
  'bicsCiAgICAn4Lii4LiB4LmA4Lil4Li04LiBJzonbXV0ZScsJ+C4m+C4peC4lOC4o+C4sOC4p+C4suC4hyc6J211dGUnLCfguYTguKHguYjguKPguLDguJrguLgnOidtdXRlJywKICAgICfguKvguKHguJTguK3guLLguKLguLjguYHguKXguYnguKcnOidkZ3InLCfg',
  'uJTguYjguKfguJnguKHguLLguIEnOidkZ3InLCfguJTguYjguKfguJknOid3YXJuJwogIH07CiAgaWYgKCFzdCkgcmV0dXJuICcnOwogIHJldHVybiAnPHNwYW4gY2xhc3M9ImIgJyArIChtYXBbc3RdfHwnbXV0ZScpICsgJyI+JyArIGVzYyhzdCkgKyAnPC9zcGFu',
  'Pic7Cn0KCmZ1bmN0aW9uIHByb2dyZXNzKHBlcmNlbnQsIGNscyl7CiAgdmFyIHAgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIE51bWJlcihwZXJjZW50KXx8MCkpOwogIHJldHVybiAnPGRpdiBjbGFzcz0icGJhciAnICsgKGNsc3x8JycpICsgJyI+PGkgc3R5',
  'bGU9IndpZHRoOicgKyBwICsgJyUiPjwvaT48L2Rpdj4nOwp9CgpmdW5jdGlvbiB0aHVtYnNIdG1sKHJlZnMsIGJpZyl7CiAgaWYgKCFyZWZzIHx8ICFyZWZzLmxlbmd0aCkgcmV0dXJuICc8c3BhbiBjbGFzcz0iZmFpbnQgZnMxMiI+4oCTPC9zcGFuPic7CiAgcmV0',
  'dXJuICc8ZGl2IGNsYXNzPSJ0aHVtYnMiPicgKyByZWZzLm1hcChmdW5jdGlvbihyKXsKICAgIGlmIChyLnRodW1iKSB7CiAgICAgIHJldHVybiAnPGltZyBjbGFzcz0idGh1bWInICsgKGJpZz8nIGJpZyc6JycpICsgJyIgbG9hZGluZz0ibGF6eSIgc3JjPSInICsg',
  'ZXNjKHIudGh1bWIpICsgJyIgJyArCiAgICAgICAgICAgICAnb25jbGljaz0id2luZG93Lm9wZW4oXCcnICsgZXNjKHIudXJsKSArICdcJyxcJ19ibGFua1wnKSIgJyArCiAgICAgICAgICAgICAnb25lcnJvcj0idGhpcy5vbmVycm9yPW51bGw7dGhpcy5yZXBsYWNl',
  'V2l0aChmaWxlQ2hpcCgnICsgSlNPTi5zdHJpbmdpZnkoSlNPTi5zdHJpbmdpZnkocikpLnJlcGxhY2UoLyIvZywnJnF1b3Q7JykgKyAnKSkiPic7CiAgICB9CiAgICByZXR1cm4gJzxhIGNsYXNzPSJiIGluZm8iIGhyZWY9IicgKyBlc2Moci51cmwpICsgJyIgdGFy',
  'Z2V0PSJfYmxhbmsiPuC5hOC4n+C4peC5jDwvYT4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7Cn0KZnVuY3Rpb24gZmlsZUNoaXAoanNvbil7CiAgdmFyIHIgPSB0eXBlb2YganNvbiA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKGpzb24pIDoganNvbjsKICB2',
  'YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTsKICBhLmNsYXNzTmFtZSA9ICdiIGluZm8nOyBhLmhyZWYgPSByLnVybDsgYS50YXJnZXQgPSAnX2JsYW5rJzsgYS50ZXh0Q29udGVudCA9ICfwn5OOIOC5hOC4n+C4peC5jCc7CiAgcmV0dXJuIGE7Cn0K',
  'CmZ1bmN0aW9uIGVtcHR5Qm94KHRleHQsIGFjdGlvbil7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj7wn5eC77iPPC9kaXY+JyArIGVzYyh0ZXh0KSArCiAgICAgICAgIChhY3Rpb24gPyAnPGRpdiBjbGFzcz0ibXQxMiI+JyAr',
  'IGFjdGlvbiArICc8L2Rpdj4nIDogJycpICsgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIGJhckNoYXJ0KGl0ZW1zLCBsYWJlbEtleSwgdmFsdWVLZXksIGZvcm1hdHRlcil7CiAgaWYgKCFpdGVtcyB8fCAhaXRlbXMubGVuZ3RoKSByZXR1cm4gJzxkaXYgY2xhc3M9ImVt',
  'cHR5Ij7guKLguLHguIfguYTguKHguYjguKHguLXguILguYnguK3guKHguLnguKU8L2Rpdj4nOwogIHZhciBtYXggPSBNYXRoLm1heC5hcHBseShudWxsLCBpdGVtcy5tYXAoZnVuY3Rpb24oaSl7IHJldHVybiBOdW1iZXIoaVt2YWx1ZUtleV0pfHwwOyB9KSkgfHwg',
  'MTsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImJhcnMiPicgKyBpdGVtcy5tYXAoZnVuY3Rpb24oaSl7CiAgICB2YXIgdiA9IE51bWJlcihpW3ZhbHVlS2V5XSl8fDA7CiAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImJhci1yb3ciPicgKwogICAgICAnPGRpdiBjbGFzcz0i',
  'Y2xpcCIgdGl0bGU9IicgKyBlc2MoaVtsYWJlbEtleV0pICsgJyI+JyArIGVzYyhpW2xhYmVsS2V5XSkgKyAnPC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJiYXItdHJhY2siPjxkaXYgY2xhc3M9ImJhci1maWxsIiBzdHlsZT0id2lkdGg6JyArICh2L21heCox',
  'MDApICsgJyUiPjwvZGl2PjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0idiI+JyArIChmb3JtYXR0ZXIgPyBmb3JtYXR0ZXIoaSkgOiBtb25leSh2KSkgKyAnPC9kaXY+JyArCiAgICAnPC9kaXY+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwp9CgovKiAt',
  'LS0tLS0tLS0tLS0tLS0tIG1vZGFsIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIG9wZW5Nb2RhbCh0aXRsZSwgYm9keUh0bWwsIGZvb3RIdG1sLCB3aWRlKXsKICB2YXIgcm9vdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb2RhbFJvb3QnKTsKICBy',
  'b290LmlubmVySFRNTCA9CiAgICAnPGRpdiBjbGFzcz0ib3YiIG9uY2xpY2s9ImlmKGV2ZW50LnRhcmdldD09PXRoaXMpY2xvc2VNb2RhbCgpIj4nICsKICAgICAgJzxkaXYgY2xhc3M9Im1vZGFsJyArICh3aWRlPycgd2lkZSc6JycpICsgJyI+JyArCiAgICAgICAg',
  'JzxkaXYgY2xhc3M9Im1vZGFsLWgiPjxoMz4nICsgZXNjKHRpdGxlKSArICc8L2gzPjxidXR0b24gY2xhc3M9IngiIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+w5c8L2J1dHRvbj48L2Rpdj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0ibW9kYWwtYiI+JyArIGJvZHlI',
  'dG1sICsgJzwvZGl2PicgKwogICAgICAgIChmb290SHRtbCA/ICc8ZGl2IGNsYXNzPSJtb2RhbC1mIj4nICsgZm9vdEh0bWwgKyAnPC9kaXY+JyA6ICcnKSArCiAgICAgICc8L2Rpdj4nICsKICAgICc8L2Rpdj4nOwogIGFwcGx5UmVhZE9ubHkocm9vdCk7CiAgZG9j',
  'dW1lbnQuYm9keS5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nOwp9CmZ1bmN0aW9uIGNsb3NlTW9kYWwoKXsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9kYWxSb290JykuaW5uZXJIVE1MID0gJyc7CiAgZG9jdW1lbnQuYm9keS5zdHlsZS5vdmVyZmxvdyA9',
  'ICcnOwp9CmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihlKXsgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgY2xvc2VNb2RhbCgpOyB9KTsKCmZ1bmN0aW9uIGNvbmZpcm1BY3Rpb24odGV4dCwgb25ZZXMpewogIG9wZW5Nb2RhbCgn',
  '4Lii4Li34LiZ4Lii4Lix4LiZJywKICAgICc8cD4nICsgZXNjKHRleHQpICsgJzwvcD4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNz',
  'PSJidG4gZGdyIiBpZD0iY2ZtQnRuIj7guKLguLfguJnguKLguLHguJk8L2J1dHRvbj4nKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2ZtQnRuJykub25jbGljayA9IGZ1bmN0aW9uKCl7IGNsb3NlTW9kYWwoKTsgb25ZZXMoKTsgfTsKfQoKLyogLS0tLS0t',
  'LS0tLS0tLS0tLSB0b2FzdCAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiB0b2FzdChtc2csIGtpbmQpewogIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogIGVsLmNsYXNzTmFtZSA9ICd0b2FzdCAnICsgKGtpbmR8fCcnKTsKICBl',
  'bC50ZXh0Q29udGVudCA9IG1zZzsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9hc3RSb290JykuYXBwZW5kQ2hpbGQoZWwpOwogIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgZWwucmVtb3ZlKCk7IH0sIGtpbmQ9PT0nZXJyJyA/IDUyMDAgOiAyODAwKTsKfQoK',
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
  'dHJpbmcocC5rZXkpOwogICAgICAgIGRvbmUoKTsKICAgICAgfSk7CiAgICAgIHJldHVybjsKICAgIH0gY2F0Y2ggKGUpIHsgLyog4LmD4LiK4LmJ4LiX4Liy4LiH4Lib4LiB4LiV4Li0ICovIH0KICB9CiAgZG9uZSgpOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4',
  'leC4seC4p+C4hOC4uOC4oeC4peC4s+C4lOC4seC4muC4q+C4meC5ieC4suC4iOC4rSAtLS0tLS0tLS0tLS0tLS0tICovCgovKiog4LmA4Lij4Li14Lii4LiB4LiV4Lit4LiZ4LmA4Lib4Li04LiU4Lir4LiZ4LmJ4Liy4LmA4Lin4LmH4LiaIOKAlCDguJXguLHguJTg',
  'uKrguLTguJnguKfguYjguLLguIjguLDguYPguKvguYnguYDguKvguYfguJnguK3guLDguYTguKPguIHguYjguK3guJkgKi8KZnVuY3Rpb24gYXV0aEdhdGUoKXsKICBsb2FkU3RvcmVkKGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdhdXRoLm1lJykudGhlbihmdW5j',
  'dGlvbihtZSl7CiAgICAgIEFVVEgubWUgPSBtZTsKICAgICAgaWYgKG1lLnNpZ25lZEluKSByZXR1cm4gZW50ZXJBcHAobWUpOwogICAgICBpZiAoQVVUSC5kZXZpY2UpIHJldHVybiBzaG93UGluKCk7CiAgICAgIHNob3dMb2dpbigpOwogICAgfSkuY2F0Y2goZnVu',
  'Y3Rpb24oZSl7CiAgICAgIHNob3dMb2dpbihlLm1lc3NhZ2UgfHwgZSk7CiAgICB9KTsKICB9KTsKfQoKZnVuY3Rpb24gZW50ZXJBcHAobWUpewogIEFVVEgubWUgPSBtZTsKICBoaWRlQXV0aCgpOwogIGJvb3ROb3coKTsKICAvLyDguYDguJ7guLTguYjguIfguKXg',
  'uYfguK3guIHguK3guLTguJnguJTguYnguKfguKLguKPguKvguLHguKrguJzguYjguLLguJnguYHguKXguLDguKLguLHguIfguYTguKHguYjguYDguITguKLguJXguLHguYnguIcgUElOIOC4muC4meC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5iSDigJQg4LiK',
  '4Lin4LiZ4LiV4Lix4LmJ4LiH4Liq4Lix4LiB4LiE4Lij4Lix4LmJ4LiHCiAgaWYgKCFBVVRILmRldmljZSAmJiBtZS51c2VybmFtZSAmJiAhbHNHZXQoJ21jb3JuZXIucGluQXNrZWQnKSkgewogICAgc2V0VGltZW91dChvZmZlclBpbiwgOTAwKTsKICB9Cn0KCmZ1',
  'bmN0aW9uIGhpZGVBdXRoKCl7CiAgdmFyIHIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXV0aFJvb3QnKTsKICBpZiAocikgci5pbm5lckhUTUwgPSAnJzsKICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2xvY2tlZCcpOwp9CgpmdW5jdGlvbiBz',
  'aG93QXV0aChodG1sKXsKICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ2xvY2tlZCcpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdXRoUm9vdCcpLmlubmVySFRNTCA9CiAgICAnPGRpdiBjbGFzcz0iYXV0aC13cmFwIj48ZGl2IGNsYXNzPSJhdXRo',
  'LWNhcmQiPicgKwogICAgICAnPGRpdiBjbGFzcz0iYXV0aC1icmFuZCI+8J+PoiA8Yj4nICsgZXNjKChTLmJvb3QgJiYgUy5ib290LmFwcCAmJiBTLmJvb3QuYXBwLm5hbWUpIHx8ICdUaGUgTSBDb3JuZXIgQVAnKSArICc8L2I+PC9kaXY+JyArCiAgICAgIGh0bWwg',
  'KwogICAgJzwvZGl2PjwvZGl2Pic7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4Lir4LiZ4LmJ4Liy4Lil4LmH4Lit4LiB4Lit4Li04LiZ4LiU4LmJ4Lin4Lii4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIHNob3dM',
  'b2dpbihlcnIpewogIEFVVEguc2NyZWVuID0gJ2xvZ2luJzsKICBzaG93QXV0aCgKICAgICc8aDIgY2xhc3M9ImF1dGgtaCI+4LmA4LiC4LmJ4Liy4Liq4Li54LmI4Lij4Liw4Lia4LiaPC9oMj4nICsKICAgICc8cCBjbGFzcz0iYXV0aC1zdWIiPuC5g+C4quC5iOC4',
  'iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5ieC5geC4peC4sOC4o+C4q+C4seC4quC4nOC5iOC4suC4meC4l+C4teC5iOC5hOC4lOC5ieC4o+C4seC4mjwvcD4nICsKICAgIChlcnIgPyAnPGRpdiBjbGFzcz0iYXV0aC1lcnIiPicgKyBlc2MoZXJyKSArICc8L2Rp',
  'dj4nIDogJzxkaXYgY2xhc3M9ImF1dGgtZXJyIiBpZD0iYXV0aEVyciIgaGlkZGVuPjwvZGl2PicpICsKICAgICc8ZGl2IGNsYXNzPSJhdXRoLWYiPjxsYWJlbCBmb3I9ImxnVXNlciI+4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJPC9sYWJlbD4nICsKICAg',
  'ICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0ibGdVc2VyIiBhdXRvY29tcGxldGU9InVzZXJuYW1lIiBhdXRvY2FwaXRhbGl6ZT0ibm9uZSIgc3BlbGxjaGVjaz0iZmFsc2UiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImF1dGgtZiI+PGxhYmVsIGZvcj0ibGdQ',
  'YXNzIj7guKPguKvguLHguKrguJzguYjguLLguJk8L2xhYmVsPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJsZ1Bhc3MiIHR5cGU9InBhc3N3b3JkIiBhdXRvY29tcGxldGU9ImN1cnJlbnQtcGFzc3dvcmQiPjwvZGl2PicgKwogICAgJzxidXR0b24g',
  'Y2xhc3M9ImJ0biBwcmkgYXV0aC1nbyIgaWQ9ImxnR28iPuC5gOC4guC5ieC4suC4quC4ueC5iOC4o+C4sOC4muC4mjwvYnV0dG9uPicgKwogICAgKEFVVEguZGV2aWNlID8gJzxidXR0b24gY2xhc3M9ImJ0biBhdXRoLWFsdCIgb25jbGljaz0ic2hvd1BpbigpIj7i',
  'hpAg4LiB4Lil4Lix4Lia4LmE4Lib4LmD4LiK4LmJIFBJTjwvYnV0dG9uPicgOiAnJykgKwogICAgJzxwIGNsYXNzPSJhdXRoLWZvb3QiPuC4peC4t+C4oeC4o+C4q+C4seC4quC4nOC5iOC4suC4mT8g4LmD4Lir4LmJ4Lic4Li54LmJ4LiU4Li54LmB4Lil4LiV4Lix',
  '4LmJ4LiH4Lij4Lir4Lix4Liq4LmD4Lir4Lih4LmI4LmD4Lir4LmJ4LiI4Liy4LiB4LmA4Lih4LiZ4Li54LmD4LiZ4LiK4Li14LiVPC9wPicKICApOwoKICB2YXIgZ28gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGdHbycpOwogIHZhciB1c2VyID0gZG9jdW1l',
  'bnQuZ2V0RWxlbWVudEJ5SWQoJ2xnVXNlcicpOwogIHZhciBwYXNzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xnUGFzcycpOwoKICBmdW5jdGlvbiBzdWJtaXQoKXsKICAgIHZhciB1ID0gdXNlci52YWx1ZS50cmltKCksIHAgPSBwYXNzLnZhbHVlOwogICAg',
  'aWYgKCF1IHx8ICFwKSByZXR1cm4gYXV0aEVycm9yKCfguIHguKPguLjguJPguLLguIHguKPguK3guIHguJfguLHguYnguIfguIrguLfguYjguK3guJzguLnguYnguYPguIrguYnguYHguKXguLDguKPguKvguLHguKrguJzguYjguLLguJknKTsKICAgIGdvLmRpc2Fi',
  'bGVkID0gdHJ1ZTsKICAgIGdvLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDguIHguLPguKXguLHguIfguJXguKPguKfguIjguKrguK3guJrigKYnOwogICAgY2FsbEFwaSgnYXV0aC5sb2dpbicsIHsgdXNlcm5hbWU6IHUsIHBhc3N3b3Jk',
  'OiBwIH0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICAgIHNhdmVTZXNzaW9uKHIuc2Vzc2lvbik7CiAgICAgIGlmIChyLm11c3RDaGFuZ2UpIHJldHVybiBzaG93Q2hhbmdlUGFzc3dvcmQodHJ1ZSk7CiAgICAgIHJldHVybiBjYWxsQXBpKCdhdXRoLm1lJykudGhlbihl',
  'bnRlckFwcCk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgZ28uZGlzYWJsZWQgPSBmYWxzZTsKICAgICAgZ28udGV4dENvbnRlbnQgPSAn4LmA4LiC4LmJ4Liy4Liq4Li54LmI4Lij4Liw4Lia4LiaJzsKICAgICAgcGFzcy52YWx1ZSA9ICcnOwogICAg',
  'ICBhdXRoRXJyb3IoZS5tZXNzYWdlIHx8IGUpOwogICAgfSk7CiAgfQoKICBnby5vbmNsaWNrID0gc3VibWl0OwogIFt1c2VyLCBwYXNzXS5mb3JFYWNoKGZ1bmN0aW9uKGVsKXsKICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihldil7',
  'IGlmIChldi5rZXkgPT09ICdFbnRlcicpIHN1Ym1pdCgpOyB9KTsKICB9KTsKICB1c2VyLmZvY3VzKCk7Cn0KCmZ1bmN0aW9uIGF1dGhFcnJvcihtc2cpewogIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdXRoRXJyJyk7CiAgaWYgKGVsKSB7IGVs',
  'LnRleHRDb250ZW50ID0gbXNnOyBlbC5oaWRkZW4gPSBmYWxzZTsgfQogIGVsc2Ugc2hvd0xvZ2luKG1zZyk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4Lir4LiZ4LmJ4LiyIFBJTiA2IOC4q+C4peC4seC4gSAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiBz',
  'aG93UGluKCl7CiAgQVVUSC5zY3JlZW4gPSAncGluJzsKICBBVVRILnBpbiA9ICcnOwogIHNob3dBdXRoKAogICAgJzxoMiBjbGFzcz0iYXV0aC1oIj7guYPguKrguYggUElOPC9oMj4nICsKICAgICc8cCBjbGFzcz0iYXV0aC1zdWIiPuC4m+C4peC4lOC4peC5h+C4',
  'reC4geC4lOC5ieC4p+C4ouC4o+C4q+C4seC4qiA2IOC4q+C4peC4seC4geC4guC4reC4h+C5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5iTwvcD4nICsKICAgICc8ZGl2IGNsYXNzPSJhdXRoLWVyciIgaWQ9ImF1dGhFcnIiIGhpZGRlbj48L2Rpdj4nICsKICAg',
  'ICc8ZGl2IGNsYXNzPSJwaW4tZG90cyIgaWQ9InBpbkRvdHMiPicgKyBwaW5Eb3RzSHRtbCgnJykgKyAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0icGluLXBhZCI+JyArCiAgICAgIFsxLDIsMyw0LDUsNiw3LDgsOV0ubWFwKGZ1bmN0aW9uKG4pewogICAgICAg',
  'IHJldHVybiAnPGJ1dHRvbiBjbGFzcz0icGluLWsiIG9uY2xpY2s9InBpblB1c2goXCcnICsgbiArICdcJykiPicgKyBuICsgJzwvYnV0dG9uPic7CiAgICAgIH0pLmpvaW4oJycpICsKICAgICAgJzxidXR0b24gY2xhc3M9InBpbi1rIGdob3N0IiBvbmNsaWNrPSJz',
  'aG93TG9naW4oKSIgdGl0bGU9IuC5g+C4iuC5ieC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5geC4l+C4mSI+8J+UkTwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0icGluLWsiIG9uY2xpY2s9InBpblB1c2goXCcwXCcpIj4wPC9idXR0b24+JyArCiAg',
  'ICAgICc8YnV0dG9uIGNsYXNzPSJwaW4tayBnaG9zdCIgb25jbGljaz0icGluQmFjaygpIiB0aXRsZT0i4Lil4LiaIj7ijKs8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gYXV0aC1hbHQiIG9uY2xpY2s9ImZvcmdldFRo',
  'aXNEZXZpY2UoKSI+4Lil4Li34LihIFBJTiDigJQg4LmA4LiC4LmJ4Liy4LiU4LmJ4Lin4Lii4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZPC9idXR0b24+JwogICk7CgogIC8vIOC4hOC4teC4ouC5jOC4muC4reC4o+C5jOC4lOC4iOC4o+C4tOC4h+C4geC5h+C5g+C4',
  'iuC5ieC5hOC4lOC5iSDguYTguKHguYjguJXguYnguK3guIfguIjguLTguYnguKHguJvguLjguYjguKHguJrguJnguIjguK0KICBkb2N1bWVudC5vbmtleWRvd24gPSBmdW5jdGlvbihldil7CiAgICBpZiAoQVVUSC5zY3JlZW4gIT09ICdwaW4nKSByZXR1cm47CiAg',
  'ICBpZiAoL15cZCQvLnRlc3QoZXYua2V5KSkgcGluUHVzaChldi5rZXkpOwogICAgZWxzZSBpZiAoZXYua2V5ID09PSAnQmFja3NwYWNlJykgcGluQmFjaygpOwogIH07Cn0KCmZ1bmN0aW9uIHBpbkRvdHNIdG1sKHBpbil7CiAgdmFyIGh0bWwgPSAnJzsKICBmb3Ig',
  'KHZhciBpID0gMDsgaSA8IDY7IGkrKykgaHRtbCArPSAnPGkgY2xhc3M9IicgKyAoaSA8IHBpbi5sZW5ndGggPyAnb24nIDogJycpICsgJyI+PC9pPic7CiAgcmV0dXJuIGh0bWw7Cn0KCmZ1bmN0aW9uIHBpblB1c2goZCl7CiAgaWYgKEFVVEgucGluLmxlbmd0aCA+',
  'PSA2KSByZXR1cm47CiAgQVVUSC5waW4gKz0gZDsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGluRG90cycpLmlubmVySFRNTCA9IHBpbkRvdHNIdG1sKEFVVEgucGluKTsKICBpZiAoQVVUSC5waW4ubGVuZ3RoID09PSA2KSBzZXRUaW1lb3V0KHBpblN1Ym1p',
  'dCwgMTIwKTsKfQoKZnVuY3Rpb24gcGluQmFjaygpewogIEFVVEgucGluID0gQVVUSC5waW4uc2xpY2UoMCwgLTEpOwogIHZhciBkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpbkRvdHMnKTsKICBpZiAoZCkgZC5pbm5lckhUTUwgPSBwaW5Eb3RzSHRtbChB',
  'VVRILnBpbik7Cn0KCmZ1bmN0aW9uIHBpblN1Ym1pdCgpewogIHZhciBwaW4gPSBBVVRILnBpbjsKICBBVVRILnBpbiA9ICcnOwogIHZhciBkb3RzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpbkRvdHMnKTsKICBpZiAoZG90cykgZG90cy5jbGFzc0xpc3Qu',
  'YWRkKCdidXN5Jyk7CgogIGNhbGxBcGkoJ2F1dGgudW5sb2NrJywgeyBkZXZpY2U6IEFVVEguZGV2aWNlLCBwaW46IHBpbiB9KS50aGVuKGZ1bmN0aW9uKHIpewogICAgc2F2ZVNlc3Npb24oci5zZXNzaW9uKTsKICAgIGRvY3VtZW50Lm9ua2V5ZG93biA9IG51bGw7',
  'CiAgICByZXR1cm4gY2FsbEFwaSgnYXV0aC5tZScpLnRoZW4oZW50ZXJBcHApOwogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgdmFyIG1zZyA9IFN0cmluZyhlLm1lc3NhZ2UgfHwgZSk7CiAgICBpZiAoZG90cykgeyBkb3RzLmNsYXNzTGlzdC5yZW1vdmUoJ2J1',
  'c3knKTsgZG90cy5jbGFzc0xpc3QuYWRkKCdzaGFrZScpOyBkb3RzLmlubmVySFRNTCA9IHBpbkRvdHNIdG1sKCcnKTsgfQogICAgc2V0VGltZW91dChmdW5jdGlvbigpeyBpZiAoZG90cykgZG90cy5jbGFzc0xpc3QucmVtb3ZlKCdzaGFrZScpOyB9LCA1MDApOwog',
  'ICAgYXV0aEVycm9yKG1zZyk7CiAgICAvLyBQSU4g4LiW4Li54LiB4Lii4LiB4LmA4Lil4Li04LiB4LmE4Lib4LmB4Lil4LmJ4LinICjguJzguLTguJTguITguKPguJrguYLguITguKfguJXguLIgLyDguKvguKHguJTguK3guLLguKLguLgpIOKAlCDguJXguYnguK3g',
  'uIfguIHguKXguLHguJrguYTguJvguYPguIrguYnguKPguKvguLHguKrguJzguYjguLLguJkKICAgIGlmICgv4Lil4LmH4Lit4LiB4Lit4Li04LiZ4LiU4LmJ4Lin4Lii4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZLy50ZXN0KG1zZykpIHsKICAgICAgc2F2ZURldmlj',
  'ZSgnJyk7CiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgc2hvd0xvZ2luKG1zZyk7IH0sIDE0MDApOwogICAgfQogIH0pOwp9CgpmdW5jdGlvbiBmb3JnZXRUaGlzRGV2aWNlKCl7CiAgdmFyIHRva2VuID0gQVVUSC5kZXZpY2U7CiAgc2F2ZURldmljZSgnJyk7',
  'CiAgbHNTZXQoJ21jb3JuZXIucGluQXNrZWQnLCAnJyk7CiAgZG9jdW1lbnQub25rZXlkb3duID0gbnVsbDsKICBpZiAodG9rZW4pIGNhbGxBcGkoJ2F1dGguZm9yZ2V0RGV2aWNlJywgeyBkZXZpY2U6IHRva2VuIH0pLmNhdGNoKGZ1bmN0aW9uKCl7IC8qIOC4q+C4',
  'oeC4lOC4reC4suC4ouC4uOC5hOC4m+C5geC4peC5ieC4p+C4geC5h+C4iuC5iOC4suC4h+C4oeC4seC4mSAqLyB9KTsKICBzaG93TG9naW4oKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguJXguLHguYnguIcgUElOIC0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKiDg',
  'uIrguKfguJnguJXguLHguYnguIcgUElOIOC4q+C4peC4seC4h+C4peC5h+C4reC4geC4reC4tOC4meC4hOC4o+C4seC5ieC4h+C5geC4o+C4geC4muC4meC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5iSAqLwpmdW5jdGlvbiBvZmZlclBpbigpewogIGxzU2V0',
  'KCdtY29ybmVyLnBpbkFza2VkJywgJzEnKTsKICBvcGVuTW9kYWwoJ+C4leC4seC5ieC4hyBQSU4g4Liq4Liz4Lir4Lij4Lix4Lia4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJJywKICAgICc8cD7guJXguLHguYnguIfguKPguKvguLHguKogNiDguKvguKXg',
  'uLHguIHguYTguKfguYkg4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4Lie4Li04Lih4Lie4LmM4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LiX4Li44LiB4LiE4Lij4Lix4LmJ4LiH4LiX4Li14LmI4LmA4Lib4Li04LiUPC9wPicgKwogICAgJzxw',
  'IGNsYXNzPSJtdXRlZCBmczEzIj5QSU4g4Lic4Li54LiB4LiB4Lix4Lia4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJ4LmA4LiE4Lij4Li34LmI4Lit4LiH4LmA4LiU4Li14Lii4LinIOC5gOC4hOC4o+C4t+C5iOC4reC4h+C4reC4t+C5iOC4meC5g+C4iuC5',
  'ieC5hOC4oeC5iOC5hOC4lOC5iSDCtyDguKLguIHguYDguKXguLTguIHguYDguKHguLfguYjguK3guYTguKvguKPguYjguIHguYfguYTguJTguYnguYPguJnguKvguJnguYnguLLguJXguLHguYnguIfguITguYjguLI8L3A+JywKICAgICc8YnV0dG9uIGNsYXNzPSJi',
  'dG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4LmE4Lin4LmJ4LiB4LmI4Lit4LiZPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iY2xvc2VNb2RhbCgpO2Zvcm1TZXRQaW4oKSI+4LiV4Lix4LmJ4LiHIFBJTiDguYDguKXg',
  'uKI8L2J1dHRvbj4nKTsKfQoKZnVuY3Rpb24gZm9ybVNldFBpbigpewogIG9wZW5Nb2RhbCgn4LiV4Lix4LmJ4LiHIFBJTiA2IOC4q+C4peC4seC4gScsCiAgICAnPGRpdiBjbGFzcz0iZmdyaWQiPicgKwogICAgICAnPGRpdiBjbGFzcz0iZiBmdWxsIj48bGFiZWwg',
  'Zm9yPSJwaW4xIj5QSU4g4LmD4Lir4Lih4LmIPC9sYWJlbD4nICsKICAgICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJwaW4xIiB0eXBlPSJwYXNzd29yZCIgaW5wdXRtb2RlPSJudW1lcmljIiBtYXhsZW5ndGg9IjYiICcgKwogICAgICAgICdhdXRvY29tcGxl',
  'dGU9Im5ldy1wYXNzd29yZCIgcGxhY2Vob2xkZXI9IuKAouKAouKAouKAouKAouKAoiI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIGZ1bGwiPjxsYWJlbCBmb3I9InBpbjIiPuC5g+C4quC5iCBQSU4g4Lit4Li14LiB4LiE4Lij4Lix4LmJ4LiHPC9sYWJl',
  'bD4nICsKICAgICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJwaW4yIiB0eXBlPSJwYXNzd29yZCIgaW5wdXRtb2RlPSJudW1lcmljIiBtYXhsZW5ndGg9IjYiICcgKwogICAgICAgICdhdXRvY29tcGxldGU9Im5ldy1wYXNzd29yZCIgcGxhY2Vob2xkZXI9IuKA',
  'ouKAouKAouKAouKAouKAoiI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIGZ1bGwiPjxsYWJlbCBmb3I9InBpbkRldiI+4LiK4Li34LmI4Lit4LmA4LiE4Lij4Li34LmI4Lit4LiHICjguYTguKfguYnguJTguLnguKLguYnguK3guJnguKvguKXguLHguIcp',
  'PC9sYWJlbD4nICsKICAgICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJwaW5EZXYiIHZhbHVlPSInICsgZXNjKGd1ZXNzRGV2aWNlTmFtZSgpKSArICciPjwvZGl2PicgKwogICAgJzwvZGl2PicgKwogICAgJzxwIGNsYXNzPSJtdXRlZCBmczEzIG10OCI+4Lir',
  '4Lil4Li14LiB4LmA4Lil4Li14LmI4Lii4LiH4LmA4Lil4LiC4LiX4Li14LmI4LmA4LiU4Liy4LiH4LmI4Liy4LiiIOC5gOC4iuC5iOC4mSAxMTExMTEg4Lir4Lij4Li34LitIDEyMzQ1NjwvcD4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xv',
  'c2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBpZD0icGluR28iPuC4muC4seC4meC4l+C4tuC4gSBQSU48L2J1dHRvbj4nKTsKCiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Bpbkdv',
  'Jykub25jbGljayA9IGZ1bmN0aW9uKCl7CiAgICB2YXIgYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaW4xJykudmFsdWU7CiAgICB2YXIgYiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaW4yJykudmFsdWU7CiAgICBpZiAoIS9eXGR7Nn0kLy50ZXN0',
  'KGEpKSByZXR1cm4gdG9hc3QoJ1BJTiDguJXguYnguK3guIfguYDguJvguYfguJnguJXguLHguKfguYDguKXguIIgNiDguKvguKXguLHguIEnLCAnZXJyJyk7CiAgICBpZiAoYSAhPT0gYikgcmV0dXJuIHRvYXN0KCdQSU4g4Liq4Lit4LiH4LiK4LmI4Lit4LiH4LmE',
  '4Lih4LmI4LiV4Lij4LiH4LiB4Lix4LiZJywgJ2VycicpOwogICAgdmFyIGJ0biA9IHRoaXM7CiAgICBidG4uZGlzYWJsZWQgPSB0cnVlOwogICAgYnRuLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDguIHguLPguKXguLHguIfguJrguLHg',
  'uJnguJfguLbguIHigKYnOwogICAgY2FsbEFwaSgnYXV0aC5zZXRQaW4nLCB7IHBpbjogYSwgZGV2aWNlOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGluRGV2JykudmFsdWUgfSkudGhlbihmdW5jdGlvbihyKXsKICAgICAgc2F2ZURldmljZShyLmRldmljZSk7',
  'CiAgICAgIGNsb3NlTW9kYWwoKTsKICAgICAgdG9hc3QoJ+C4leC4seC5ieC4hyBQSU4g4LmA4Lij4Li14Lii4Lia4Lij4LmJ4Lit4LiiIOKAlCDguITguKPguLHguYnguIfguKvguJnguYnguLLguYPguKrguYjguYHguITguYggNiDguKvguKXguLHguIEnLCAnb2sn',
  'KTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTsKICAgICAgYnRuLnRleHRDb250ZW50ID0gJ+C4muC4seC4meC4l+C4tuC4gSBQSU4nOwogICAgICB0b2FzdChlLm1lc3NhZ2UgfHwgZSwgJ2VycicpOwogICAgfSk7',
  'CiAgfTsKfQoKZnVuY3Rpb24gZ3Vlc3NEZXZpY2VOYW1lKCl7CiAgdmFyIHVhID0gbmF2aWdhdG9yLnVzZXJBZ2VudCB8fCAnJzsKICBpZiAoL2lQaG9uZS8udGVzdCh1YSkpIHJldHVybiAnaVBob25lJzsKICBpZiAoL2lQYWQvLnRlc3QodWEpKSByZXR1cm4gJ2lQ',
  'YWQnOwogIGlmICgvQW5kcm9pZC8udGVzdCh1YSkpIHJldHVybiAnQW5kcm9pZCc7CiAgaWYgKC9NYWNpbnRvc2gvLnRlc3QodWEpKSByZXR1cm4gJ01hYyc7CiAgaWYgKC9XaW5kb3dzLy50ZXN0KHVhKSkgcmV0dXJuICdXaW5kb3dzJzsKICByZXR1cm4gJ+C4reC4',
  'uOC4m+C4geC4o+C4k+C5jOC4guC4reC4h+C4ieC4seC4mSc7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZIC0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKiBAcGFyYW0ge2Jvb2xlYW59IGZv',
  'cmNlZCB0cnVlID0g4Lij4Liw4Lia4Lia4Lia4Lix4LiH4LiE4Lix4Lia4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LiV4Lit4LiZ4Lil4LmH4Lit4LiB4Lit4Li04LiZ4LiE4Lij4Lix4LmJ4LiH4LmB4Lij4LiBICovCmZ1bmN0aW9uIHNob3dDaGFuZ2VQYXNzd29yZChm',
  'b3JjZWQpewogIGlmICghZm9yY2VkKSByZXR1cm4gZm9ybUNoYW5nZVBhc3N3b3JkKCk7CiAgQVVUSC5zY3JlZW4gPSAnY2hhbmdlJzsKICBzaG93QXV0aCgKICAgICc8aDIgY2xhc3M9ImF1dGgtaCI+4LiV4Lix4LmJ4LiH4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ',
  '4LiC4Lit4LiH4LiE4Li44LiT4LmA4Lit4LiHPC9oMj4nICsKICAgICc8cCBjbGFzcz0iYXV0aC1zdWIiPuC4o+C4q+C4seC4quC4l+C4teC5iOC5hOC4lOC5ieC4oeC4suC5gOC4m+C5h+C4meC4o+C4q+C4seC4quC4iuC4seC5iOC4p+C4hOC4o+C4suC4pyDguYDg',
  'uJvguKXguLXguYjguKLguJnguIHguYjguK3guJnguYPguIrguYnguIfguLLguJnguKvguJnguLbguYjguIfguITguKPguLHguYnguIc8L3A+JyArCiAgICAnPGRpdiBjbGFzcz0iYXV0aC1lcnIiIGlkPSJhdXRoRXJyIiBoaWRkZW4+PC9kaXY+JyArCiAgICAnPGRp',
  'diBjbGFzcz0iYXV0aC1mIj48bGFiZWwgZm9yPSJjcE9sZCI+4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmA4LiU4Li04LihPC9sYWJlbD4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0iY3BPbGQiIHR5cGU9InBhc3N3b3JkIiBhdXRvY29tcGxldGU9',
  'ImN1cnJlbnQtcGFzc3dvcmQiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImF1dGgtZiI+PGxhYmVsIGZvcj0iY3BOZXciPuC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iCAo4Lit4Lii4LmI4Liy4LiH4LiZ4LmJ4Lit4LiiIDgg4LiV4Lix4Lin',
  'KTwvbGFiZWw+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImNwTmV3IiB0eXBlPSJwYXNzd29yZCIgYXV0b2NvbXBsZXRlPSJuZXctcGFzc3dvcmQiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImF1dGgtZiI+PGxhYmVsIGZvcj0iY3BOZXcyIj7g',
  'uYPguKrguYjguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYjguK3guLXguIHguITguKPguLHguYnguIc8L2xhYmVsPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJjcE5ldzIiIHR5cGU9InBhc3N3b3JkIiBhdXRvY29tcGxldGU9Im5l',
  'dy1wYXNzd29yZCI+PC9kaXY+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSBhdXRoLWdvIiBpZD0iY3BHbyI+4Lia4Lix4LiZ4LiX4Li24LiB4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmIPC9idXR0b24+JwogICk7CgogIGRvY3VtZW50',
  'LmdldEVsZW1lbnRCeUlkKCdjcEdvJykub25jbGljayA9IGZ1bmN0aW9uKCl7CiAgICB2YXIgbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjcE9sZCcpLnZhbHVlOwogICAgdmFyIG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3BOZXcnKS52YWx1ZTsK',
  'ICAgIHZhciBuMiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjcE5ldzInKS52YWx1ZTsKICAgIGlmIChuLmxlbmd0aCA8IDgpIHJldHVybiBhdXRoRXJyb3IoJ+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iOC4leC5ieC4reC4h+C4ouC4suC4',
  'p+C4reC4ouC5iOC4suC4h+C4meC5ieC4reC4oiA4IOC4leC4seC4p+C4reC4seC4geC4qeC4oycpOwogICAgaWYgKG4gIT09IG4yKSByZXR1cm4gYXV0aEVycm9yKCfguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYjguKrguK3guIfguIrguYjguK3g',
  'uIfguYTguKHguYjguJXguKPguIfguIHguLHguJknKTsKICAgIHZhciBidG4gPSB0aGlzOwogICAgYnRuLmRpc2FibGVkID0gdHJ1ZTsKICAgIGJ0bi5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4Lia4Lix4LiZ',
  '4LiX4Li24LiB4oCmJzsKICAgIGNhbGxBcGkoJ2F1dGguY2hhbmdlUGFzc3dvcmQnLCB7IG9sZFBhc3N3b3JkOiBvLCBuZXdQYXNzd29yZDogbiB9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICAgIHJldHVybiBjYWxsQXBpKCdhdXRoLm1lJykudGhlbihlbnRlckFwcCk7',
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
  'c3dvcmQnLCB7CiAgICAgIG9sZFBhc3N3b3JkOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWNPbGQnKS52YWx1ZSwgbmV3UGFzc3dvcmQ6IG4KICAgIH0pLnRoZW4oZnVuY3Rpb24oKXsKICAgICAgY2xvc2VNb2RhbCgpOwogICAgICB0b2FzdCgn4LmA4Lib4Lil',
  '4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmA4Lij4Li14Lii4Lia4Lij4LmJ4Lit4LiiJywgJ29rJyk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgYnRuLmRpc2FibGVkID0gZmFsc2U7CiAgICAgIHRvYXN0KGUubWVzc2FnZSB8',
  'fCBlLCAnZXJyJyk7CiAgICB9KTsKICB9Owp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4reC4reC4geC4iOC4suC4geC4o+C4sOC4muC4miAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiBkb0xvZ291dChrZWVwUGluKXsKICB2YXIgcyA9IEFVVEguc2Vzc2lv',
  'bjsKICBzYXZlU2Vzc2lvbignJyk7CiAgaWYgKCFrZWVwUGluKSB7IHZhciBkID0gQVVUSC5kZXZpY2U7IHNhdmVEZXZpY2UoJycpOyBpZiAoZCkgY2FsbEFwaSgnYXV0aC5mb3JnZXREZXZpY2UnLCB7IGRldmljZTogZCB9KS5jYXRjaChmdW5jdGlvbigpe30pOyB9',
  'CiAgaWYgKHMpIGNhbGxBcGkoJ2F1dGgubG9nb3V0JywgeyBfc2Vzc2lvbjogcyB9KS5jYXRjaChmdW5jdGlvbigpeyAvKiDguKvguKHguJTguK3guLLguKLguLjguYHguKXguYnguKfguIHguYfguJbguLfguK3guKfguYjguLLguK3guK3guIHguYHguKXguYnguKcg',
  'Ki8gfSk7CiAgY2xvc2VNb2RhbCgpOwogIEFVVEgubWUgPSBudWxsOwogIGlmIChBVVRILmRldmljZSkgc2hvd1BpbigpOyBlbHNlIHNob3dMb2dpbigpOwp9CgpmdW5jdGlvbiBjb25maXJtTG9nb3V0KCl7CiAgb3Blbk1vZGFsKCfguK3guK3guIHguIjguLLguIHg',
  'uKPguLDguJrguJonLAogICAgJzxwPuC4leC5ieC4reC4h+C4geC4suC4o+C4reC4reC4geC4iOC4suC4geC4o+C4sOC4muC4muC5g+C4iuC5iOC5hOC4q+C4oTwvcD4nICsKICAgIChBVVRILmRldmljZSA/ICc8cCBjbGFzcz0ibXV0ZWQgZnMxMyI+UElOIOC4muC4',
  'meC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5ieC4iOC4sOC4ouC4seC4h+C4reC4ouC4ueC5iCDguITguKPguLHguYnguIfguKvguJnguYnguLLguYDguILguYnguLLguJTguYnguKfguKIgUElOIOC5hOC4lOC5ieC5gOC4peC4ojwvcD4nIDogJycpLAogICAg',
  'JzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgIChBVVRILmRldmljZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4gZGdyIiBvbmNsaWNrPSJkb0xvZ291dChmYWxzZSkiPuC4reC4',
  'reC4geC5geC4peC4sOC4peC4miBQSU48L2J1dHRvbj4nIDogJycpICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJkb0xvZ291dCh0cnVlKSI+4Lit4Lit4LiB4LiI4Liy4LiB4Lij4Liw4Lia4LiaPC9idXR0b24+Jyk7Cn0KPC9zY3JpcHQ+',
  'CjxzY3JpcHQ+Ci8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBWaWV3cy5odG1sIOKAlCDguJXguLHguKfguYLguKvguKXguJQgKyDguJXguLHguKfguKfguLLguJTguILguK3guIfguYHguJXguYjg',
  'uKXguLDguKvguJnguYnguLIKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgp2YXIgUk9VVEVTID0ge307CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT0KICAgMSkg4Lig4Liy4Lie4Lij4Lin4LihCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMuZGFzaGJvYXJkID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7IHJl',
  'dHVybiBjYWxsQXBpKCdhcHAuZGFzaGJvYXJkJywgeyB5ZWFyOiBTLnllYXIgfSk7IH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciBiID0gZC5idWlsZGluZzsKICAgIHZhciBrcGlzID0KICAgICAga3BpKCfguKLguK3guJTguKvguJnguLXguYnguITg',
  'uIfguYDguKvguKXguLfguK3guJfguLHguYnguIfguKvguKHguJQnLCBiYWh0KGQuZGVidEFsbC5yZW1haW5pbmcpLAogICAgICAgICAgJ+C4iOC4suC4geC4ouC4reC4lOC4q+C4meC4teC5iSAnICsgYmFodChkLmRlYnRBbGwudG90YWxEZWJ0KSArICcgwrcg4LiK',
  '4Liz4Lij4Liw4LmB4Lil4LmJ4LinICcgKyBwY3QoZC5kZWJ0QWxsLnBlcmNlbnQpLCAnYWNjZW50JykgKwogICAgICBrcGkoJ+C4iuC4s+C4o+C4sOC5geC4peC5ieC4pyAo4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiBKScsIHBjdChkLmRlYnRNYWluLnBlcmNlbnQp',
  'LCBiYWh0KGQuZGVidE1haW4ucGFpZCkgKyAnIOC4iOC4suC4gSAnICsgYmFodChkLmRlYnRNYWluLnRvdGFsKSwgJ2dvb2QnKSArCiAgICAgIGtwaSgn4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Lib4Li1ICcgKyBkLnllYXIsIGJhaHQoZC5zcGVuZFRo',
  'aXNZZWFyKSwgJ+C4i+C4t+C5ieC4reC4guC4reC4hyArIOC4i+C5iOC4reC4oeC5geC4i+C4oSArIOC4peC5ieC4suC4h+C5geC4reC4o+C5jCcpICsKICAgICAga3BpKCfguIfguLLguJnguIvguYjguK3guKHguITguYnguLLguIcnLCBkLnJlcGFpcnMub3Blbkpv',
  'YnMgKyAnIOC4h+C4suC4mScsIGQucmVwYWlycy5vdmVyZHVlICsgJyDguIfguLLguJnguYDguIHguLTguJnguIHguLPguKvguJnguJQnLCBkLnJlcGFpcnMub3ZlcmR1ZSA/ICdiYWQnIDogJycpOwoKICAgIHZhciBhbGVydHMgPSBkLmFsZXJ0cy5sZW5ndGgKICAg',
  'ICAgPyAnPGRpdiBjbGFzcz0iYWxpc3QiPicgKyBkLmFsZXJ0cy5zbGljZSgwLDEyKS5tYXAoZnVuY3Rpb24oYSl7CiAgICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImFsaSBsLScgKyBhLmxldmVsICsgJyIgb25jbGljaz0iZ28oXCcnICsganVtcFBhZ2UoYS5t',
  'b2R1bGUpICsgJ1wnKSI+JyArCiAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImljIj4nICsgYS5pY29uICsgJzwvZGl2PjxkaXY+PGRpdiBjbGFzcz0idHQiPicgKyBlc2MoYS50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICAgICAgJzxkaXYgY2xh',
  'c3M9ImRkIj4nICsgZXNjKGEuZGV0YWlsKSArICc8L2Rpdj48L2Rpdj48L2Rpdj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicKICAgICAgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPjxkaXYgY2xhc3M9ImJpZyI+4pyFPC9kaXY+4LmE4Lih4LmI4Lih4Li1',
  '4LiH4Liy4LiZ4LiE4LmJ4Liy4LiHIOKAlCDguJfguLjguIHguK3guKLguYjguLLguIfguYDguKPguLXguKLguJrguKPguYnguK3guKI8L2Rpdj4nOwoKICAgIHJldHVybiAnJyArCiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKyBrcGlzICsgJzwv',
  'ZGl2PicgKwoKICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzIgbWIxMiI+JyArCiAgICAgICAgY2FyZCgn8J+SsCDguKPguLLguKLguIHguLLguKPguKrguKPguLjguJvguKPguKfguKEgKOC4q+C4meC4teC5ieC4q+C4peC4seC4gSknLAogICAgICAgICAgZGVidE1p',
  'bmkoZC5kZWJ0TWFpbiwgJ2RlYnRNYWluJyksCiAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJnbyhcJ2RlYnRNYWluXCcpIj7guJTguLnguJfguLHguYnguIfguKvguKHguJQg4oaSPC9idXR0b24+JykgKwogICAgICAgIGNhcmQoJ/Cf',
  'p74g4Lir4LiZ4Li14LmJ4Liq4Li04LiZICjguKvguJnguLXguYnguKPguK3guIcpJywKICAgICAgICAgIGRlYnRNaW5pKGQuZGVidFN1YiwgJ2RlYnRTdWInKSArCiAgICAgICAgICAoZC5kZWJ0U3ViLmludGVyZXN0VGhpc1llYXIgPyAnPGRpdiBjbGFzcz0iZnMx',
  'MiBtdXRlZCBtdDgiPuC4lOC4reC4geC5gOC4muC4teC5ieC4ouC4l+C4teC5iOC4iuC4s+C4o+C4sOC4m+C4tSAnICsgZC55ZWFyICsgJzogPGI+JyArIGJhaHQoZC5kZWJ0U3ViLmludGVyZXN0VGhpc1llYXIpICsgJzwvYj48L2Rpdj4nIDogJycpLAogICAgICAg',
  'ICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZ28oXCdkZWJ0U3ViXCcpIj7guJTguLnguJfguLHguYnguIfguKvguKHguJQg4oaSPC9idXR0b24+JykgKwogICAgICAnPC9kaXY+JyArCgogICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4n',
  'ICsKICAgICAgICBrcGkoJ+C4q+C5ieC4reC4h+C4l+C4seC5ieC4h+C4q+C4oeC4lCcsIGIudG90YWxSb29tcyArICcg4Lir4LmJ4Lit4LiHJywgJ+C4oeC4teC4nOC4ueC5ieC5gOC4iuC5iOC4siAnICsgYi5vY2N1cGllZCArICcgwrcg4Lin4LmI4Liy4LiHICcg',
  'KyBiLnZhY2FudCkgKwogICAgICAgIGtwaSgn4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4Lib4Li1ICcgKyBkLnllYXIsIGQuYWMucm9vbXNEb25lICsgJy8nICsgYi50b3RhbFJvb21zICsgJyDguKvguYnguK3guIcnLCBkLmFjLmRvbmVJblllYXIgKyAnIOC4o+C4',
  'reC4miDCtyDguITguYnguLLguIcgJyArIGQuYWMucm9vbXNQZW5kaW5nICsgJyDguKvguYnguK3guIcnLCBkLmFjLnJvb21zUGVuZGluZyA/ICd3YXJuJyA6ICdnb29kJykgKwogICAgICAgIGtwaSgn4LiL4Li34LmJ4Lit4LiC4Lit4LiH4Lib4Li1ICcgKyBkLnll',
  'YXIsIGJhaHQoZC5wdXJjaGFzZXMueWVhclRvdGFsKSwgZC5wdXJjaGFzZXMueWVhckNvdW50ICsgJyDguKPguLLguKLguIHguLLguKMnKSArCiAgICAgICAga3BpKCfguJvguKPguLDguIHguLHguJnguYPguIHguKXguYnguKvguKHguJQnLCBkLnB1cmNoYXNlcy53',
  'YXJyYW50eS5leHBpcmluZyArICcg4Lij4Liy4Lii4LiB4Liy4LijJywgJ+C4q+C4oeC4lOC4reC4suC4ouC4uOC5geC4peC5ieC4pyAnICsgZC5wdXJjaGFzZXMud2FycmFudHkuZXhwaXJlZCwgZC5wdXJjaGFzZXMud2FycmFudHkuZXhwaXJpbmcgPyAnd2Fybicg',
  'OiAnJykgKwogICAgICAnPC9kaXY+JyArCgogICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMiBtYjEyIj4nICsKICAgICAgICBjYXJkKCfwn5OSIOC4o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKLguKvguK0g4Lib4Li1ICcgKyBkLnllYXIsCiAg',
  'ICAgICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMyBtYjEyIj4nICsKICAgICAgICAgICAga3BpKCfguKPguLLguKLguKPguLHguJonLCBiYWh0KGQuZmluYW5jZS5pbmNvbWUpLCAn4LmA4LiJ4Lil4Li14LmI4LiiICcgKyBiYWh0KGQuZmluYW5jZS5hdmdJbmNvbWUp',
  'ICsgJy/guYDguJTguLfguK3guJknLCAnZ29vZCcpICsKICAgICAgICAgICAga3BpKCfguKPguLLguKLguIjguYjguLLguKInLCBiYWh0KGQuZmluYW5jZS5leHBlbnNlKSwgJ+C5gOC4ieC4peC4teC5iOC4oiAnICsgYmFodChkLmZpbmFuY2UuYXZnRXhwZW5zZSkg',
  'KyAnL+C5gOC4lOC4t+C4reC4mScsICdiYWQnKSArCiAgICAgICAgICAgIGtwaSgn4LiE4LiH4LmA4Lir4Lil4Li34Lit4Liq4Li44LiX4LiY4Li0JywgYmFodChkLmZpbmFuY2UubmV0KSwgJ+C4reC4seC4leC4o+C4suC4geC4s+C5hOC4oyAnICsgcGN0KGQuZmlu',
  'YW5jZS5tYXJnaW4pKSArCiAgICAgICAgICAnPC9kaXY+JyArIG1pbmlNb250aENoYXJ0KGQuZmluYW5jZS5ieU1vbnRoKSwKICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImdvKFwnZmluYW5jZVwnKSI+4LiU4Li54LiX4Lix4LmJ4LiH',
  '4Lir4Lih4LiUIOKGkjwvYnV0dG9uPicpICsKICAgICAgICBjYXJkKCfwn5eT77iPIOC4h+C4suC4meC4l+C4teC5iOC4geC4s+C4peC4seC4h+C4iOC4sOC4luC4tuC4hyAoJyArIGQudXBjb21pbmcubGVuZ3RoICsgJyknLAogICAgICAgICAgZC51cGNvbWluZy5s',
  'ZW5ndGggPyAnPGRpdiBjbGFzcz0iYWxpc3QiPicgKyBkLnVwY29taW5nLnNsaWNlKDAsNykubWFwKGZ1bmN0aW9uKHUpewogICAgICAgICAgICB2YXIgbHZsID0gdS5kYXlzTGVmdCA8IDAgPyAnZGFuZ2VyJyA6ICh1LmRheXNMZWZ0IDw9IDcgPyAnd2FybicgOiAn',
  'aW5mbycpOwogICAgICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImFsaSBsLScgKyBsdmwgKyAnIiBvbmNsaWNrPSJnbyhcJycgKyBqdW1wUGFnZSh1Lm1vZHVsZSkgKyAnXCcpIj4nICsKICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0iaWMiPicgKyB1Lmljb24g',
  'KyAnPC9kaXY+PGRpdj48ZGl2IGNsYXNzPSJ0dCI+JyArIGVzYyh1LnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0iZGQiPicgKyB0aERhdGUodS5kYXRlKSArICcgwrcgJyArCiAgICAgICAgICAgICAgICAodS5kYXlzTGVmdCA8',
  'IDAgPyAn4LmA4Lil4Lii4LiB4Liz4Lir4LiZ4LiUICcgKyAoLXUuZGF5c0xlZnQpICsgJyDguKfguLHguJknIDogKHUuZGF5c0xlZnQgPT09IDAgPyAn4Lin4Lix4LiZ4LiZ4Li14LmJJyA6ICfguK3guLXguIEgJyArIHUuZGF5c0xlZnQgKyAnIOC4p+C4seC4mScp',
  'KSArCiAgICAgICAgICAgICAgJzwvZGl2PjwvZGl2PjwvZGl2Pic7CiAgICAgICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPvCfjKTvuI88L2Rpdj7guYTguKHguYjguKHguLXguIfguLLguJng',
  'uJnguLHguJTguKvguKHguLLguKLguYDguKPguYfguKcg4LmGIOC4meC4teC5iTwvZGl2PicsCiAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJnbyhcJ3JlcG9ydHNcJykiPuC4m+C4j+C4tOC4l+C4tOC4meC5gOC4leC5h+C4oSDihpI8',
  'L2J1dHRvbj4nLCB0cnVlKSArCiAgICAgICc8L2Rpdj4nICsKCiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGcyIj4nICsKICAgICAgICBjYXJkKCfwn5SUIOC4quC4tOC5iOC4h+C4l+C4teC5iOC4leC5ieC4reC4h+C4l+C4syAoJyArIGQuYWxlcnRzLmxlbmd0aCAr',
  'ICcpJywgYWxlcnRzLCAnJywgdHJ1ZSkgKwogICAgICAgIGNhcmQoJ/Cfj6Ig4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmC4LiU4Lii4Lij4Lin4LihJywKICAgICAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGcyIj4nICsKICAgICAgICAg',
  'ICAga3BpKCfguIfguLLguJnguJvguLUgJyArIGQueWVhciwgZC5idWlsZGluZ1JlcGFpcnMueWVhckNvdW50ICsgJyDguIfguLLguJknLCAn4LiE4LmJ4Liy4LiHICcgKyBkLmJ1aWxkaW5nUmVwYWlycy5vcGVuQ291bnQpICsKICAgICAgICAgICAga3BpKCfguITg',
  'uYjguLLguYPguIrguYnguIjguYjguLLguKInLCBiYWh0KGQuYnVpbGRpbmdSZXBhaXJzLnllYXJDb3N0KSwgJ+C4hOC4o+C4muC4geC4s+C4q+C4meC4lOC5gOC4o+C5h+C4pyDguYYg4LiZ4Li14LmJICcgKyBkLmJ1aWxkaW5nUmVwYWlycy51cGNvbWluZykgKwog',
  'ICAgICAgICAgJzwvZGl2PicgKwogICAgICAgICAgKGQuZGVidE1haW4uZm9yZWNhc3QgJiYgZC5kZWJ0TWFpbi5mb3JlY2FzdC5tb250aHNMZWZ0CiAgICAgICAgICAgID8gJzxkaXYgY2xhc3M9ImhyIj48L2Rpdj48ZGl2IGNsYXNzPSJmczEzIj48Yj7guJvguKPg',
  'uLDguKHguLLguJPguIHguLLguKPguJvguLTguJTguKvguJnguLXguYnguKvguKXguLHguIE8L2I+PGRpdiBjbGFzcz0ibXV0ZWQgbXQ4Ij4nICsKICAgICAgICAgICAgICAn4LiI4Liy4LiB4Lit4Lix4LiV4Lij4Liy4LiK4Liz4Lij4Liw4LmA4LiJ4Lil4Li14LmI',
  '4LiiICcgKyBiYWh0KGQuZGVidE1haW4uZm9yZWNhc3QuYXZnUGVyTW9udGgpICsgJy/guYDguJTguLfguK3guJkgKDEyIOC5gOC4lOC4t+C4reC4meC4peC5iOC4suC4quC4uOC4lCkgJyArCiAgICAgICAgICAgICAgJ+C4hOC4suC4lOC4p+C5iOC4suC4reC4teC4',
  'gSA8Yj4nICsgZC5kZWJ0TWFpbi5mb3JlY2FzdC5tb250aHNMZWZ0ICsgJyDguYDguJTguLfguK3guJk8L2I+ICcgKwogICAgICAgICAgICAgICco4Lij4Liy4LinICcgKyB0aERhdGUoZC5kZWJ0TWFpbi5mb3JlY2FzdC5wYXlvZmZEYXRlKSArICcpPC9kaXY+PC9k',
  'aXY+JwogICAgICAgICAgICA6ICcnKSwKICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImdvKFwnYnVpbGRpbmdcJykiPuC4lOC4ueC4l+C4seC5ieC4h+C4q+C4oeC4lCDihpI8L2J1dHRvbj4nKSArCiAgICAgICc8L2Rpdj4nOwogIH0s',
  'CiAgYWZ0ZXI6IGZ1bmN0aW9uKCl7CiAgICAvLyDguJXguLHguKfguYDguKXguILguJrguJnguYDguKHguJnguLnguK3guLHguJvguYDguJTguJXguIjguLLguIHguKjguLnguJnguKLguYzguYHguIjguYnguIfguYDguJXguLfguK3guJkgKHJlZnJlc2hBbGVydHMp',
  'IOC4l+C4uOC4geC4q+C4meC5ieC4siDguYTguKHguYjguYPguIrguYjguYDguInguJ7guLLguLDguKvguJnguYnguLLguJnguLXguYkKICAgIHJlZnJlc2hBbGVydHMoKTsKICB9Cn07CgpmdW5jdGlvbiBtaW5pTW9udGhDaGFydChieU1vbnRoKXsKICB2YXIgbWF4',
  'ID0gTWF0aC5tYXguYXBwbHkobnVsbCwgYnlNb250aC5tYXAoZnVuY3Rpb24obSl7IHJldHVybiBNYXRoLm1heChtLmluY29tZSwgbS5leHBlbnNlKTsgfSkpIHx8IDE7CiAgcmV0dXJuICc8ZGl2IHN0eWxlPSJkaXNwbGF5OmZsZXg7Z2FwOjNweDthbGlnbi1pdGVt',
  'czpmbGV4LWVuZDtoZWlnaHQ6NzRweCI+JyArIGJ5TW9udGgubWFwKGZ1bmN0aW9uKG0pewogICAgdmFyIGhpID0gTWF0aC5yb3VuZChtLmluY29tZSAvIG1heCAqIDY2KSwgaGUgPSBNYXRoLnJvdW5kKG0uZXhwZW5zZSAvIG1heCAqIDY2KTsKICAgIHJldHVybiAn',
  'PGRpdiBzdHlsZT0iZmxleDoxO3RleHQtYWxpZ246Y2VudGVyIiB0aXRsZT0iJyArIG0ubGFiZWwgKyAnIMK3IOC4o+C4seC4miAnICsgbW9uZXkobS5pbmNvbWUpICsgJyDCtyDguIjguYjguLLguKIgJyArIG1vbmV5KG0uZXhwZW5zZSkgKyAnIj4nICsKICAgICAg',
  'JzxkaXYgc3R5bGU9ImRpc3BsYXk6ZmxleDtnYXA6MXB4O2FsaWduLWl0ZW1zOmZsZXgtZW5kO2p1c3RpZnktY29udGVudDpjZW50ZXI7aGVpZ2h0OjY2cHgiPicgKwogICAgICAgICc8ZGl2IHN0eWxlPSJ3aWR0aDo2cHg7aGVpZ2h0OicgKyBoaSArICdweDtiYWNr',
  'Z3JvdW5kOnZhcigtLW9rKTtib3JkZXItcmFkaXVzOjJweCAycHggMCAwIj48L2Rpdj4nICsKICAgICAgICAnPGRpdiBzdHlsZT0id2lkdGg6NnB4O2hlaWdodDonICsgaGUgKyAncHg7YmFja2dyb3VuZDp2YXIoLS1kYW5nZXIpO2JvcmRlci1yYWRpdXM6MnB4IDJw',
  'eCAwIDAiPjwvZGl2PicgKwogICAgICAnPC9kaXY+PGRpdiBjbGFzcz0iZmFpbnQiIHN0eWxlPSJmb250LXNpemU6OS41cHgiPicgKyBtLmxhYmVsLnJlcGxhY2UoJy4nLCcnKSArICc8L2Rpdj48L2Rpdj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2PicgKwogICc8',
  'ZGl2IGNsYXNzPSJyb3cgZnMxMiBtdXRlZCBtdDgiPjxzcGFuIGNsYXNzPSJiIG9rIj7guKPguLLguKLguKPguLHguJo8L3NwYW4+PHNwYW4gY2xhc3M9ImIgZGdyIj7guKPguLLguKLguIjguYjguLLguKI8L3NwYW4+PC9kaXY+JzsKfQoKZnVuY3Rpb24gZGVidE1p',
  'bmkoeCwgcGFnZSl7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJwbWV0YSIgc3R5bGU9Im1hcmdpbjowIDAgNnB4Ij48c3Bhbj7guIrguLPguKPguLDguYHguKXguYnguKcgPGI+JyArIGJhaHQoeC5wYWlkKSArICc8L2I+PC9zcGFuPicgKwogICAgICAgICAnPHNwYW4+',
  'PGI+JyArIHBjdCh4LnBlcmNlbnQpICsgJzwvYj48L3NwYW4+PC9kaXY+JyArCiAgICAgICAgIHByb2dyZXNzKHgucGVyY2VudCwgJ2xnJykgKwogICAgICAgICAnPGRpdiBjbGFzcz0icG1ldGEiPjxzcGFuPuC4hOC4h+C5gOC4q+C4peC4t+C4rSA8Yj4nICsgYmFo',
  'dCh4LnJlbWFpbmluZykgKyAnPC9iPjwvc3Bhbj4nICsKICAgICAgICAgJzxzcGFuPuC4ouC4reC4lOC4q+C4meC4teC5ieC4l+C4seC5ieC4h+C4q+C4oeC4lCA8Yj4nICsgYmFodCh4LnRvdGFsKSArICc8L2I+PC9zcGFuPjwvZGl2PicgKwogICAgICAgICAnPGRp',
  'diBjbGFzcz0iZnMxMiBtdXRlZCBtdDgiPuC4iuC4s+C4o+C4sOC5g+C4meC4m+C4teC4l+C4teC5iOC5gOC4peC4t+C4reC4gTogPGI+JyArIGJhaHQoeC50aGlzWWVhcikgKyAnPC9iPjwvZGl2Pic7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICAyKSDguKvguJnguLXguYnguKvguKXguLHguIEgLyDguKvguJnguLXguYnguKPguK3guIcgKOC5g+C4iuC5ieC4leC4seC4p+C4p+C4suC4lOC4o+C5iOC4p+C4oeC4geC4seC4mSkKICAgPT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGRlYnRSb3V0ZShsZWRnZXIsIHRpdGxlKXsKICByZXR1cm4gewogICAgbG9hZDogZnVuY3Rpb24oKXsKICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFsK',
  'ICAgICAgICBjYWxsQXBpKCdkZWJ0LnN1bW1hcnknLCB7IGxlZGdlcjogbGVkZ2VyLCB5ZWFyOiBTLnllYXIgfSksCiAgICAgICAgY2FsbEFwaSgnZGVidC5wYXltZW50cycsIHsgbGVkZ2VyOiBsZWRnZXIsIHllYXI6IFMueWVhciB9KQogICAgICBdKS50aGVuKGZ1',
  'bmN0aW9uKHIpewogICAgICAgIHZhciBkID0gclswXTsgZC5wYXltZW50cyA9IHJbMV07IGQubGVkZ2VyID0gbGVkZ2VyOyBkLnBhZ2VUaXRsZSA9IHRpdGxlOwogICAgICAgIHJldHVybiBkOwogICAgICB9KTsKICAgIH0sCiAgICByZW5kZXI6IHJlbmRlckRlYnQs',
  'CiAgICBhZnRlcjogY2FjaGVBbGxEZWJ0cwogIH07Cn0KUk9VVEVTLmRlYnRNYWluID0gZGVidFJvdXRlKCfguKvguJnguLXguYnguKvguKXguLHguIEnLCAn4Lij4Liy4Lii4LiB4Liy4Lij4Liq4Lij4Li44Lib4Lij4Lin4LihIFRoZSBNIENvcm5lciBBUCcpOwpS',
  'T1VURVMuZGVidFN1YiAgPSBkZWJ0Um91dGUoJ+C4q+C4meC4teC5ieC4o+C4reC4hycsICfguKvguJnguLXguYnguKrguLTguJknKTsKCi8qKiDguYDguIHguYfguJrguKPguLLguKLguIrguLfguYjguK3guIHguYnguK3guJnguKvguJnguLXguYnguJfguLjguIHg',
  'uJrguLHguI3guIrguLXguYTguKfguYnguYPguKvguYnguJ/guK3guKPguYzguKHguYDguKXguLfguK3guIEgIuC5gOC4m+C5h+C4meC4quC5iOC4p+C4meC4q+C4meC4tuC5iOC4h+C4guC4reC4hyIgKi8KZnVuY3Rpb24gY2FjaGVBbGxEZWJ0cygpewogIGNhbGxB',
  'cGkoJ2RlYnQubGlzdCcsIHt9KS50aGVuKGZ1bmN0aW9uKGxpc3QpewogICAgQUxMX0RFQlRTID0gbGlzdC5tYXAoZnVuY3Rpb24oZCl7CiAgICAgIHJldHVybiB7IGlkOiBkLmlkLCB0aXRsZTogZC50aXRsZSwgbGVkZ2VyOiBkLmxlZGdlciwgcGFyZW50SWQ6IGQu',
  'cGFyZW50SWQgfHwgJycgfTsKICAgIH0pOwogIH0pLmNhdGNoKGZ1bmN0aW9uKCl7fSk7Cn0KCmZ1bmN0aW9uIHJlbmRlckRlYnQoZCl7CiAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMu',
  'eWVhcjsKCiAgdmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iY2FyZCBtYjEyIj48ZGl2IGNsYXNzPSJjYXJkLWIiPicgKwogICAgJzxkaXYgY2xhc3M9InJvdyBtYjEyIj48aDMgc3R5bGU9Im1hcmdpbjowO2ZvbnQtc2l6ZToxNXB4Ij4nICsgZXNjKGQucGFnZVRpdGxl',
  'KSArICc8L2gzPicgKwogICAgJzxzcGFuIGNsYXNzPSJzcCI+PC9zcGFuPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgc20iIG9uY2xpY2s9ImZvcm1EZWJ0UGF5bWVudChudWxsLFwnJyArIGQubGVkZ2VyICsgJ1wnKSI+KyDguJrguLHguJnguJfguLbg',
  'uIHguIHguLLguKPguIrguLPguKPguLA8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImZvcm1EZWJ0KG51bGwsXCcnICsgZC5sZWRnZXIgKyAnXCcpIj4rIOC5gOC4nuC4tOC5iOC4oeC4geC5ieC4reC4meC4q+C4meC4teC5',
  'iTwvYnV0dG9uPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InBtZXRhIiBzdHlsZT0ibWFyZ2luOjAgMCA3cHgiPjxzcGFuPuC4hOC4p+C4suC4oeC4hOC4t+C4muC4q+C4meC5ieC4suC4geC4suC4o+C4iuC4s+C4o+C4sDwvc3Bhbj48c3Bhbj48Yj4nICsgcGN0',
  'KGQucGVyY2VudCkgKyAnPC9iPjwvc3Bhbj48L2Rpdj4nICsKICAgIHByb2dyZXNzKGQucGVyY2VudCwgJ2xnICcgKyAoZC5wZXJjZW50ID49IDEwMCA/ICdvaycgOiAnJykpICsKICAgICc8ZGl2IGNsYXNzPSJncmlkIGc0IG10MTYiPicgKwogICAgICBrcGkoJ+C4',
  'ouC4reC4lOC4q+C4meC4teC5ieC4l+C4seC5ieC4h+C4q+C4oeC4lCcsIGJhaHQoZC50b3RhbERlYnQpLCBkLmRlYnRzLmxlbmd0aCArICcg4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJJykgKwogICAgICBrcGkoJ+C4iuC4s+C4o+C4sOC5geC4peC5ieC4pycsIGJh',
  'aHQoZC5wYWlkKSwgZC5wYXltZW50Q291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4o+C5guC4reC4mScsICdnb29kJykgKwogICAgICBrcGkoJ+C4hOC4h+C5gOC4q+C4peC4t+C4rScsIGJhaHQoZC5yZW1haW5pbmcpLCAn4Lit4Li14LiBICcgKyBwY3QoMTAwIC0g',
  'ZC5wZXJjZW50KSArICcg4LiI4Liw4Lib4Li04LiU4Lir4LiZ4Li14LmJJywgJ2JhZCcpICsKICAgICAga3BpKCfguIrguLPguKPguLDguYPguJknICsgeWVhckxhYmVsLCBiYWh0KGQuc2VsZWN0ZWRZZWFyUGFpZCksIGQuc2VsZWN0ZWRZZWFyQ291bnQgKyAnIOC4',
  'o+C4suC4ouC4geC4suC4oycgKwogICAgICAgICAgKGQuc2VsZWN0ZWRZZWFySW50ZXJlc3QgPyAnIMK3IOC4lOC4reC4geC5gOC4muC4teC5ieC4oiAnICsgYmFodChkLnNlbGVjdGVkWWVhckludGVyZXN0KSA6ICcnKSkgKwogICAgJzwvZGl2PjwvZGl2PjwvZGl2',
  'Pic7CgogIHZhciBwZXJEZWJ0ID0gZC5kZWJ0cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0iZ3JpZCBnLWF1dG8gbWIxMiI+JyArIGQuZGVidHMubWFwKGZ1bmN0aW9uKHgpewogICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJjYXJkIj48ZGl2IGNsYXNzPSJjYXJkLWIiPicg',
  'KwogICAgICAnPGRpdiBjbGFzcz0iY2xpcCIgc3R5bGU9ImZvbnQtd2VpZ2h0OjY1MDtmb250LXNpemU6MTMuNXB4O21pbi1oZWlnaHQ6MzhweCI+JyArIGVzYyh4LnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBmczEyIG11dGVkIG1i',
  'OCI+JyArIHN0YXR1c0JhZGdlKHguc3RhdHVzKSArCiAgICAgICAgJzxzcGFuPicgKyBlc2MoeC5jcmVkaXRvciB8fCAn4oCTJykgKyAoeC5zdGFydERhdGUgPyAnIMK3ICcgKyB0aERhdGUoeC5zdGFydERhdGUpIDogJycpICsgJzwvc3Bhbj48L2Rpdj4nICsKICAg',
  'ICAgKHgucGFyZW50VGl0bGUKICAgICAgICA/ICc8ZGl2IGNsYXNzPSJiIGluZm8gbWI4IiB0aXRsZT0i4Lii4Lit4LiU4LiB4LmJ4Lit4LiZ4LiZ4Li14LmJ4Lit4Lii4Li54LmI4LmD4LiZ4LiB4LmJ4Lit4LiZ4LmB4Lih4LmI4LmB4Lil4LmJ4LinIOC4iOC5iOC4',
  'suC4ouC4hOC4t+C4meC4geC5ieC4reC4meC4meC4teC5ieC4geC5ieC4reC4meC5geC4oeC5iOC4iOC4sOC4peC4lOC4leC4suC4oSI+JyArCiAgICAgICAgICAn4oazIOC5gOC4m+C5h+C4meC4quC5iOC4p+C4meC4q+C4meC4tuC5iOC4h+C4guC4reC4hyAnICsg',
  'ZXNjKHgucGFyZW50VGl0bGUpICsgJzwvZGl2PicKICAgICAgICA6ICcnKSArCiAgICAgIHByb2dyZXNzKHgucGVyY2VudCkgKwogICAgICAnPGRpdiBjbGFzcz0icG1ldGEiPjxzcGFuPuC4iuC4s+C4o+C4sCA8Yj4nICsgYmFodCh4LnBhaWQpICsgJzwvYj48L3Nw',
  'YW4+PHNwYW4+4LiE4LiH4LmA4Lir4Lil4Li34LitIDxiPicgKyBiYWh0KHgucmVtYWluaW5nKSArICc8L2I+PC9zcGFuPjwvZGl2PicgKwogICAgICAoeC5jaGlsZHJlbiAmJiB4LmNoaWxkcmVuLmxlbmd0aAogICAgICAgID8gJzxkaXYgY2xhc3M9ImhyIiBzdHls',
  'ZT0ibWFyZ2luOjEycHggMCAxMHB4Ij48L2Rpdj4nICsKICAgICAgICAgICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIG1iOCI+4LmD4LiZ4Lii4Lit4LiU4LiZ4Li14LmJ4Lih4Li14LiB4LmJ4Lit4LiZ4Lii4LmI4Lit4Lii4Lit4Lii4Li54LmIICcgKyB4LmNoaWxk',
  'cmVuLmxlbmd0aCArICcg4LiB4LmJ4Lit4LiZPC9kaXY+JyArCiAgICAgICAgICB4LmNoaWxkcmVuLm1hcChmdW5jdGlvbihjKXsKICAgICAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJtYjgiPicgKwogICAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJyb3cgZnMx',
  'MiI+PHNwYW4+4oazICcgKyBlc2MoYy50aXRsZSkgKyAnPC9zcGFuPicgKwogICAgICAgICAgICAgICc8c3BhbiBjbGFzcz0ic3AgbW9ubyI+JyArIG1vbmV5KGMucGFpZCkgKyAnIC8gJyArIG1vbmV5KGMucHJpbmNpcGFsKSArICc8L3NwYW4+PC9kaXY+JyArCiAg',
  'ICAgICAgICAgICAgcHJvZ3Jlc3MoYy5wZXJjZW50LCAnb2snKSArICc8L2Rpdj4nOwogICAgICAgICAgfSkuam9pbignJykgKwogICAgICAgICAgKHgucGFpZEZyb21DaGlsZHJlbiA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIj7guKPguKfguKHguKLguK3guJTg',
  'uJfguLXguYjguKHguLLguIjguLLguIHguIHguYnguK3guJnguKLguYjguK3guKIgJyArIGJhaHQoeC5wYWlkRnJvbUNoaWxkcmVuKSArICc8L2Rpdj4nIDogJycpCiAgICAgICAgOiAnJykgKwogICAgICAoeC5pbnRlcmVzdFBlck1vbnRoID8gJzxkaXYgY2xhc3M9',
  'ImZzMTIgbXV0ZWQgbXQ4Ij7guJTguK3guIHguYDguJrguLXguYnguKIgJyArIGJhaHQoeC5pbnRlcmVzdFBlck1vbnRoKSArICcv4LmA4LiU4Li34Lit4LiZPC9kaXY+JyA6ICcnKSArCiAgICAgICh4LnBsYW5QZXJNb250aCA/ICc8ZGl2IGNsYXNzPSJmczEyIG11',
  'dGVkIj7guYHguJzguJnguJzguYjguK3guJkgJyArIGJhaHQoeC5wbGFuUGVyTW9udGgpICsgJy/guYDguJTguLfguK3guJk8L2Rpdj4nIDogJycpICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBtdDEyIj48YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9XCdm',
  'b3JtRGVidCgnICsgYXR0cih4KSArICcsIicgKyBkLmxlZGdlciArICciKVwnPuC5geC4geC5ieC5hOC4gjwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGRnciIgb25jbGljaz0iZGVsRGVidChcJycgKyB4LmlkICsgJ1wnKSI+4Lil4Lia',
  'PC9idXR0b24+PC9kaXY+JyArCiAgICAnPC9kaXY+PC9kaXY+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nIDogJyc7CgogIHZhciBieVllYXIgPSBkLmJ5WWVhci5sZW5ndGggPyBjYXJkKCfwn5OFIOC4ouC4reC4lOC4iuC4s+C4o+C4sOC5geC4ouC4geC4leC4',
  'suC4oeC4m+C4tScsCiAgICAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsKICAgICc8dGg+4Lib4Li1PC90aD48dGggY2xhc3M9Im51bSI+4LmA4LiH4Li04LiZ4LiV4LmJ4LiZPC90aD48dGggY2xhc3M9Im51bSI+4LiU4Lit',
  '4LiB4LmA4Lia4Li14LmJ4LiiPC90aD48dGggY2xhc3M9Im51bSI+4Lij4Lin4Lih4LiX4Li14LmI4LmC4Lit4LiZPC90aD4nICsKICAgICc8dGggY2xhc3M9Im51bSI+4LiI4Liz4LiZ4Lin4LiZ4LiE4Lij4Lix4LmJ4LiHPC90aD48dGggY2xhc3M9Im51bSI+4LmA',
  '4LiH4Li04LiZ4LiV4LmJ4LiZ4Liq4Liw4Liq4LihPC90aD48dGggc3R5bGU9IndpZHRoOjI2JSI+4LiE4Lin4Liy4Lih4LiE4Li34Lia4Lir4LiZ4LmJ4Liy4Liq4Liw4Liq4LihPC90aD4nICsKICAgICc8L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgZC5ieVll',
  'YXIubWFwKGZ1bmN0aW9uKHkpewogICAgICB2YXIgY3VtID0geS5jdW11bGF0aXZlICE9IG51bGwgPyB5LmN1bXVsYXRpdmUgOiAwOwogICAgICB2YXIgcCA9IGQudG90YWxEZWJ0ID8gKGN1bSAvIGQudG90YWxEZWJ0ICogMTAwKSA6IDA7CiAgICAgIHJldHVybiAn',
  'PHRyIG9uY2xpY2s9InNldFllYXJGcm9tVGFibGUoJyArIHkueWVhciArICcpIiBzdHlsZT0iY3Vyc29yOnBvaW50ZXIiPicgKwogICAgICAgICc8dGQ+PGI+JyArIHkueWVhciArICc8L2I+IDxzcGFuIGNsYXNzPSJmYWludCBmczEyIj4vICcgKyAoeS55ZWFyKzU0',
  'MykgKyAnPC9zcGFuPjwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbW9uZXkoeS5wcmluY2lwYWwpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHkuaW50ZXJlc3QgPyBtb25leSh5LmludGVyZXN0KSA6ICfigJMn',
  'KSArICc8L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9Im51bSI+PGI+JyArIG1vbmV5KHkucHJpbmNpcGFsICsgeS5pbnRlcmVzdCkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgeS5jb3VudCArICc8L3RkPicgKwogICAgICAg',
  'ICc8dGQgY2xhc3M9Im51bSI+JyArIG1vbmV5KGN1bSkgKyAnPC90ZD4nICsKICAgICAgICAnPHRkPicgKyBwcm9ncmVzcyhwKSArICc8L3RkPjwvdHI+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nLCAnJywgdHJ1ZSkgOiAnJzsK',
  'CiAgdmFyIHJvd3MgPSBkLnBheW1lbnRzOwogIHZhciBsaXN0ID0gY2FyZCgn8J+nviDguKPguLLguKLguIHguLLguKPguYLguK3guJnguYPguIrguYnguKvguJnguLXguYkgwrcgJyArIHllYXJMYWJlbCArICcgKCcgKyByb3dzLmxlbmd0aCArICcpJywKICAgIHJv',
  'd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICc8dGg+4Lin4Lix4LiZ4LiX4Li14LmIPC90aD48dGg+4LiH4Lin4LiUPC90aD48dGggY2xhc3M9Im51bSI+4LmA4LiH4Li04LiZ4LiV4LmJ4LiZ',
  'PC90aD48dGggY2xhc3M9Im51bSI+4LiU4Lit4LiB4LmA4Lia4Li14LmJ4LiiPC90aD4nICsKICAgICAgJzx0aCBjbGFzcz0ibnVtIj7guKPguKfguKHguJfguLXguYjguYLguK3guJk8L3RoPjx0aD7guIrguYjguK3guIfguJfguLLguIc8L3RoPicgKwogICAgICAn',
  'PHRoPuC4quC4peC4tOC4mzwvdGg+PHRoPuC4q+C4oeC4suC4ouC5gOC4q+C4leC4uDwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgcm93cy5tYXAoZnVuY3Rpb24ocCl7CiAgICAgICAgcmV0dXJuICc8dHI+JyArCiAgICAgICAgICAn',
  'PHRkIGNsYXNzPSJub3dyYXAiPicgKyB0aERhdGUocC5wYXlEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIj4nICsgZXNjKHAuaW5zdGFsbG1lbnQgfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJu',
  'dW0iPicgKyAocC5wcmluY2lwYWwgPyAnPGIgc3R5bGU9ImNvbG9yOnZhcigtLW9rKSI+JyArIG1vbmV5KHAucHJpbmNpcGFsKSArICc8L2I+JyA6ICc8c3BhbiBjbGFzcz0iZmFpbnQiPuKAkzwvc3Bhbj4nKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFz',
  'cz0ibnVtIj4nICsgKHAuaW50ZXJlc3QgPyAnPGIgc3R5bGU9ImNvbG9yOnZhcigtLXdhcm4pIj4nICsgbW9uZXkocC5pbnRlcmVzdCkgKyAnPC9iPicgOiAnPHNwYW4gY2xhc3M9ImZhaW50Ij7igJM8L3NwYW4+JykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQg',
  'Y2xhc3M9Im51bSI+PGI+JyArIG1vbmV5KHAuYW1vdW50KSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MocC5jaGFubmVsIHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbChw',
  'LnNsaXBSZWZzKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiBtdXRlZCBjbGlwIj4nICsgZXNjKHAubm90ZSB8fCAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsKICAgICAgICAgICAg',
  'JzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIiBvbmNsaWNrPVwnZm9ybURlYnRQYXltZW50KCcgKyBhdHRyKHApICsgJywiJyArIGQubGVkZ2VyICsgJyIpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNv',
  'biBkZ3IiIG9uY2xpY2s9ImRlbERlYnRQYXltZW50KFwnJyArIHAuaWQgKyAnXCcpIj7wn5eRPC9idXR0b24+JyArCiAgICAgICAgICAnPC9kaXY+PC90ZD48L3RyPic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nCiAgICA6IGVt',
  'cHR5Qm94KCfguKLguLHguIfguYTguKHguYjguKHguLXguKPguLLguKLguIHguLLguKPguIrguLPguKPguLDguYPguJknICsgeWVhckxhYmVsLAogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtRGVidFBheW1lbnQobnVsbCxcJycg',
  'KyBkLmxlZGdlciArICdcJykiPisg4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4LiK4Liz4Lij4LiwPC9idXR0b24+JyksCiAgICAnJywgdHJ1ZSk7CgogIHJldHVybiBoZWFkICsgcGVyRGVidCArIGJ5WWVhciArICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgbGlz',
  'dCArICc8L2Rpdj4nOwp9CgpmdW5jdGlvbiBzZXRZZWFyRnJvbVRhYmxlKHkpewogIFMueWVhciA9IFN0cmluZyh5KTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgneWVhclNlbCcpLnZhbHVlID0gUy55ZWFyOwogIGxvYWQoKTsKfQoKLyogPT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDMpIOC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT0gKi8KUk9VVEVTLnB1cmNoYXNlcyA9IHsKICBsb2FkOiBmdW5jdGlvbigpewogICAgcmV0dXJuIFByb21pc2UuYWxsKFsKICAgICAgY2FsbEFwaSgncHVyY2hhc2Uuc3VtbWFyeScsIHsgeWVhcjogUy55ZWFyIH0pLAogICAgICBjYWxsQXBpKCdwdXJj',
  'aGFzZS5saXN0JywgeyB5ZWFyOiBTLnllYXIsIGNhdGVnb3J5OiBTLnBhcmFtcy5jYXRlZ29yeSB8fCAnJywgcTogUy5wYXJhbXMucSB8fCAnJyB9KQogICAgXSkudGhlbihmdW5jdGlvbihyKXsgdmFyIGQgPSByWzBdOyBkLml0ZW1zID0gclsxXTsgcmV0dXJuIGQ7',
  'IH0pOwogIH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1i',
  'MTIiPicgKwogICAgICBrcGkoJ+C4ouC4reC4lOC4i+C4t+C5ieC4rSAnICsgeWVhckxhYmVsLCBiYWh0KGQueWVhclRvdGFsKSwgZC55ZWFyQ291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4oycsICdhY2NlbnQnKSArCiAgICAgIGtwaSgn4Lii4Lit4LiU4Liq4Liw',
  '4Liq4Lih4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJywgYmFodChkLmdyYW5kVG90YWwpLCBkLmdyYW5kQ291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4oycpICsKICAgICAga3BpKCfguK3guKLguLnguYjguYPguJnguJvguKPguLDguIHguLHguJknLCBkLndhcnJhbnR5',
  'LmFjdGl2ZSArICcg4Lij4Liy4Lii4LiB4Liy4LijJywgJ+C5g+C4geC4peC5ieC4q+C4oeC4lCAnICsgZC53YXJyYW50eS5leHBpcmluZywgZC53YXJyYW50eS5leHBpcmluZyA/ICd3YXJuJyA6ICdnb29kJykgKwogICAgICBrcGkoJ+C4q+C4oeC4p+C4lOC4l+C4',
  'teC5iOC5g+C4iuC5ieC4iOC5iOC4suC4ouC4quC4ueC4h+C4quC4uOC4lCcsIGQuYnlDYXRlZ29yeVswXSA/IGQuYnlDYXRlZ29yeVswXS5jYXRlZ29yeSA6ICfigJMnLAogICAgICAgICAgZC5ieUNhdGVnb3J5WzBdID8gYmFodChkLmJ5Q2F0ZWdvcnlbMF0udG90',
  'YWwpIDogJycpICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciBjaGFydHMgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnMiBtYjEyIj4nICsKICAgICAgY2FyZCgn8J+TiiDguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguYHguKLguIHguJXguLLguKHguKvguKHguKfg',
  'uJTguKvguKHguLnguYggwrcgJyArIHllYXJMYWJlbCwKICAgICAgICBiYXJDaGFydChkLmJ5Q2F0ZWdvcnksICdjYXRlZ29yeScsICd0b3RhbCcsIGZ1bmN0aW9uKGkpeyByZXR1cm4gbW9uZXkoaS50b3RhbCkgKyAnIOC4vyc7IH0pKSArCiAgICAgIGNhcmQoJ/Cf',
  'k4Ug4Lii4Lit4LiU4LiL4Li34LmJ4Lit4LmB4Lii4LiB4LiV4Liy4Lih4Lib4Li1JywKICAgICAgICBiYXJDaGFydChkLmJ5WWVhci5tYXAoZnVuY3Rpb24oeSl7IHJldHVybiB7IGxhYmVsOiAn4Lib4Li1ICcgKyB5LnllYXIgKyAnICgnICsgeS5jb3VudCArICcp',
  'JywgdG90YWw6IHkudG90YWwsIHllYXI6IHkueWVhciB9OyB9KSwKICAgICAgICAgICAgICAgICAnbGFiZWwnLCAndG90YWwnLCBmdW5jdGlvbihpKXsgcmV0dXJuIG1vbmV5KGkudG90YWwpICsgJyDguL8nOyB9KSkgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIGNh',
  'dHMgPSAnPGRpdiBjbGFzcz0iY2hpcHMgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJjaGlwICcgKyAoIVMucGFyYW1zLmNhdGVnb3J5Pydvbic6JycpICsgJyIgb25jbGljaz0ic2V0UGFyYW0oXCdjYXRlZ29yeVwnLFwnXCcpIj7guJfguLjguIHguKvg',
  'uKHguKfguJQ8L2J1dHRvbj4nICsKICAgICAgZC5ieUNhdGVnb3J5Lm1hcChmdW5jdGlvbihjKXsKICAgICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9ImNoaXAgJyArIChTLnBhcmFtcy5jYXRlZ29yeT09PWMuY2F0ZWdvcnk/J29uJzonJykgKyAnIiAnICsKICAg',
  'ICAgICAgICAgICAgJ29uY2xpY2s9InNldFBhcmFtKFwnY2F0ZWdvcnlcJyxcJycgKyBlc2MoYy5jYXRlZ29yeSkgKyAnXCcpIj4nICsgZXNjKGMuY2F0ZWdvcnkpICsgJyAoJyArIGMuY291bnQgKyAnKTwvYnV0dG9uPic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwv',
  'ZGl2Pic7CgogICAgdmFyIHJvd3MgPSBkLml0ZW1zOwogICAgdmFyIHRhYmxlID0gY2FyZCgn8J+bkiDguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcgwrcgJyArIHllYXJMYWJlbCArICcgKCcgKyByb3dzLmxlbmd0aCArICcpJywKICAgICAg',
  'cm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDo5ODBweCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoIHN0eWxlPSJ3aWR0aDo5NnB4Ij7guKfguLHguJnguJfguLXguYjguIvguLfguYnguK08',
  'L3RoPjx0aD7guKPguLLguKLguIHguLLguKPguKrguLTguJnguITguYnguLI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guIjguLPguJnguKfguJk8L3RoPicgKwogICAgICAgICc8dGggY2xhc3M9Im51bSI+4Lij4Liy4LiE4LiyPC90aD48dGg+4LmB4Lir4Lil4LmI4LiH',
  '4LiX4Li14LmI4LiL4Li34LmJ4LitPC90aD48dGg+4Lib4Lij4Liw4LiB4Lix4LiZPC90aD48dGg+4Lig4Liy4LiePC90aD48dGg+4Liq4Lil4Li04LibPC90aD48dGg+PC90aD4nICsKICAgICAgICAnPC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICByb3dz',
  'Lm1hcChmdW5jdGlvbihwKXsKICAgICAgICAgIHZhciB3ID0gcC53YXJyYW50eSB8fCB7fTsKICAgICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZShwLmJ1eURhdGUpICsgJzwvdGQ+JyAr',
  'CiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0iY2xpcCIgdGl0bGU9IicgKyBlc2MocC5pdGVtKSArICciPjxiPicgKyBlc2MocC5pdGVtKSArICc8L2I+PC9kaXY+JyArCiAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImZzMTIgZmFpbnQiPicgKyBlc2MocC5j',
  'YXRlZ29yeSB8fCAnJykgKyAocC5yb29tID8gJyDCtyDguKvguYnguK3guIcgJyArIGVzYyhwLnJvb20pIDogJycpICsKICAgICAgICAgICAgICAgIChwLm9yZGVyTm8gPyAnIMK3IOC4reC4reC4o+C5jOC5gOC4lOC4reC4o+C5jCAnICsgZXNjKHAub3JkZXJObykg',
  'OiAnJykgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICAgYmlsbEh0bWwocCkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbnVtKHAucXR5KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxiPicgKyBt',
  'b25leShwLnByaWNlKSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyhwLnZlbmRvciB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArICh3LmhhcwogICAgICAgICAg',
  'ICAgICAgPyBzdGF0dXNCYWRnZSh3LnN0YXRlKSArICc8ZGl2IGNsYXNzPSJmYWludCIgc3R5bGU9ImZvbnQtc2l6ZToxMXB4Ij4nICsgdGhEYXRlU2hvcnQody5lbmQpICsgJzwvZGl2PicKICAgICAgICAgICAgICAgIDogJzxzcGFuIGNsYXNzPSJmYWludCI+4oCT',
  'PC9zcGFuPicpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwocC5waG90b1JlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwocC5zbGlwUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0',
  'ZD48ZGl2IGNsYXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1QdXJjaGFzZSgnICsgYXR0cihwKSArICcpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAgICAgJzxi',
  'dXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIGRnciIgb25jbGljaz0iZGVsUHVyY2hhc2UoXCcnICsgcC5pZCArICdcJykiPvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICAgJzwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+',
  'PC90YWJsZT48L2Rpdj4nCiAgICAgIDogZW1wdHlCb3goJ+C4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC5g+C4mScgKyB5ZWFyTGFiZWwsICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtUHVy',
  'Y2hhc2UobnVsbCkiPisg4LmA4Lie4Li04LmI4Lih4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4LitPC9idXR0b24+JyksCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIHNtIiBvbmNsaWNrPSJmb3JtUHVyY2hhc2UobnVsbCkiPisg4LmA4Lie4Li04LmI',
  '4Lih4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4LitPC9idXR0b24+JywgdHJ1ZSk7CgogICAgcmV0dXJuIGhlYWQgKyBjaGFydHMgKyBjYXRzICsgdGFibGU7CiAgfQp9OwoKLyoqCiAqIOC4muC4tOC4peC4l+C4teC5iOC4oeC4teC4guC4reC4h+C4q+C4peC4',
  'suC4ouC4reC4ouC5iOC4suC4hyDigJQg4LmB4Liq4LiU4LiH4LmA4Lib4LmH4LiZ4Lib4Li44LmI4Lih4LiB4Liy4LiH4LiU4Li5IOC5hOC4oeC5iOC5g+C4q+C5ieC4leC4suC4o+C4suC4h+C4ouC4suC4p+C5gOC4geC4tOC4meC5hOC4mwogKiDguJrguLTguKXg',
  'uJfguLXguYjguKHguLXguKPguLLguKLguIHguLLguKPguYDguJTguLXguKLguKfguKvguKPguLfguK3guYTguKHguYjguKHguLXguKPguLLguKLguIHguLLguKPguKLguYjguK3guKLguYDguKXguKIg4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LmB4Liq4LiU4LiH4Lit',
  '4Liw4LmE4Lij4LmA4Lie4Li04LmI4LihCiAqLwpmdW5jdGlvbiBiaWxsSHRtbChwKXsKICB2YXIgYiA9IHAuYmlsbDsKICBpZiAoIWIgfHwgYi5jb3VudCA8IDIpIHJldHVybiAnJzsKICB2YXIgaWQgPSAnYmlsbF8nICsgcC5pZDsKICByZXR1cm4gJzxidXR0b24g',
  'dHlwZT0iYnV0dG9uIiBjbGFzcz0iYmlsbC10b2dnbGUiIG9uY2xpY2s9InRvZ2dsZUJpbGwoXCcnICsgaWQgKyAnXCcpIj4nICsKICAgICAgJ/Cfp74gJyArIGIuY291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4o+C5g+C4meC4muC4tOC4pSDilr48L2J1dHRvbj4n',
  'ICsKICAgICc8ZGl2IGNsYXNzPSJiaWxsLWxpbmVzIiBpZD0iJyArIGlkICsgJyIgaGlkZGVuPicgKwogICAgICBiLmxpbmVzLm1hcChmdW5jdGlvbihsKXsKICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImJpbGwtbGluZSI+JyArCiAgICAgICAgICAnPHNwYW4g',
  'Y2xhc3M9Im5tIiB0aXRsZT0iJyArIGVzYyhsLm5hbWUpICsgJyI+JyArIGVzYyhsLm5hbWUpICsgJzwvc3Bhbj4nICsKICAgICAgICAgICc8c3BhbiBjbGFzcz0icXQiPicgKyBudW0obC5xdHkpICsgKGwudW5pdCA/ICcgJyArIGVzYyhsLnVuaXQpIDogJycpICsg',
  'JyDDlyAnICsgbW9uZXkobC51bml0UHJpY2UsIDIpICsgJzwvc3Bhbj4nICsKICAgICAgICAgICc8c3BhbiBjbGFzcz0idHQiPicgKyBtb25leShsLnRvdGFsLCAyKSArICc8L3NwYW4+PC9kaXY+JzsKICAgICAgfSkuam9pbignJykgKwogICAgICAoKGIuc2hpcHBp',
  'bmcgfHwgYi5kaXNjb3VudCkKICAgICAgICA/ICc8ZGl2IGNsYXNzPSJiaWxsLWV4dHJhIj4nICsKICAgICAgICAgICAgKGIuc2hpcHBpbmcgPyAn4LiE4LmI4Liy4Liq4LmI4LiHICcgKyBtb25leShiLnNoaXBwaW5nLCAyKSA6ICcnKSArCiAgICAgICAgICAgIChi',
  'LnNoaXBwaW5nICYmIGIuZGlzY291bnQgPyAnIMK3ICcgOiAnJykgKwogICAgICAgICAgICAoYi5kaXNjb3VudCA/ICfguKrguYjguKfguJnguKXguJQg4oiSJyArIG1vbmV5KGIuZGlzY291bnQsIDIpIDogJycpICsgJzwvZGl2PicKICAgICAgICA6ICcnKSArCiAg',
  'ICAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gdG9nZ2xlQmlsbChpZCl7CiAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpOwogIGlmICghZWwpIHJldHVybjsKICBlbC5oaWRkZW4gPSAhZWwuaGlkZGVuOwogIHZhciBidG4gPSBlbC5wcmV2aW91c0Vs',
  'ZW1lbnRTaWJsaW5nOwogIGlmIChidG4pIGJ0bi50ZXh0Q29udGVudCA9IGJ0bi50ZXh0Q29udGVudC5yZXBsYWNlKGVsLmhpZGRlbiA/ICfilrQnIDogJ+KWvicsIGVsLmhpZGRlbiA/ICfilr4nIDogJ+KWtCcpOwp9CgpmdW5jdGlvbiBzZXRQYXJhbShrZXksIHZh',
  'bCl7CiAgUy5wYXJhbXNba2V5XSA9IHZhbDsKICBsb2FkKCk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICA0KSDguKXguYnguLLguIfguYHguK3guKPguYwKICAgPT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5hYyA9IHsKICBsb2FkOiBmdW5jdGlvbigpeyByZXR1cm4gY2FsbEFwaSgnYWMubWF0cml4JywgeyB5ZWFyOiBTLnllYXIgfSk7IH0sCiAgcmVuZGVyOiBmdW5j',
  'dGlvbihkKXsKICAgIHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICBrcGkoJ+C4peC5',
  'ieC4suC4h+C5geC4peC5ieC4pyAnICsgeWVhckxhYmVsLCBkLnJvb21zRG9uZUluWWVhciArICcvJyArIGQucm9vbXMubGVuZ3RoICsgJyDguKvguYnguK3guIcnLCBkLmRvbmVJblllYXIgKyAnIOC4o+C4reC4muC4l+C4seC5ieC4h+C4q+C4oeC4lCcsICdhY2Nl',
  'bnQnKSArCiAgICAgIGtwaSgn4Lii4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJ4Lil4LmJ4Liy4LiHJywgZC5yb29tc1BlbmRpbmcubGVuZ3RoICsgJyDguKvguYnguK3guIcnLCBkLnJvb21zUGVuZGluZy5zbGljZSgwLDgpLmpvaW4oJywgJykgKyAoZC5yb29tc1Bl',
  'bmRpbmcubGVuZ3RoPjg/J+KApic6JycpLCBkLnJvb21zUGVuZGluZy5sZW5ndGggPyAnd2Fybic6J2dvb2QnKSArCiAgICAgIGtwaSgn4LiW4Li24LiH4LiB4Liz4Lir4LiZ4LiU4Lil4LmJ4Liy4LiHJywgZC5vdmVyZHVlLmxlbmd0aCArICcg4Lir4LmJ4Lit4LiH',
  'JywgJ+C4o+C4reC4muC4peC5ieC4suC4h+C4l+C4uOC4gSAnICsgZC5jeWNsZU1vbnRocyArICcg4LmA4LiU4Li34Lit4LiZJywgZC5vdmVyZHVlLmxlbmd0aCA/ICdiYWQnOidnb29kJykgKwogICAgICBrcGkoJ+C4hOC4p+C4suC4oeC4hOC4t+C4muC4q+C4meC5',
  'ieC4sicsIHBjdChkLnJvb21zLmxlbmd0aCA/IGQucm9vbXNEb25lSW5ZZWFyL2Qucm9vbXMubGVuZ3RoKjEwMCA6IDApLCAn4LiC4Lit4LiH4LiX4Lix4LmJ4LiH4Lir4Lih4LiUICcgKyBkLnJvb21zLmxlbmd0aCArICcg4Lir4LmJ4Lit4LiHJykgKwogICAgJzwv',
  'ZGl2Pic7CgogICAgdmFyIGFjdGlvbnMgPSAnPGRpdiBjbGFzcz0icm93IG1iMTIiPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZm9ybUFjKG51bGwpIj4rIOC4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C4peC5ieC4suC4h+C5',
  'geC4reC4o+C5jDwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJmb3JtQnVsa0FjKCkiPvCfk4Ug4LiZ4Lix4LiU4Lil4LmJ4Liy4LiH4Lir4Lil4Liy4Lii4Lir4LmJ4Lit4LiH4Lie4Lij4LmJ4Lit4Lih4LiB4Lix4LiZPC9i',
  'dXR0b24+JyArCiAgICAgICc8c3BhbiBjbGFzcz0ic3AiPjwvc3Bhbj4nICsKICAgICAgJzxzcGFuIGNsYXNzPSJmczEyIG11dGVkIj7guITguKXguLTguIHguJfguLXguYjguKvguYnguK3guIfguYDguJ7guLfguYjguK3guJTguLkv4LmA4Lie4Li04LmI4Lih4Lij',
  '4Lit4Lia4LiB4Liy4Lij4Lil4LmJ4Liy4LiHPC9zcGFuPicgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIGdyaWQgPSBjYXJkKCfinYTvuI8g4LiV4Liy4Lij4Liy4LiH4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4Lij4Liy4Lii4Lir4LmJ4Lit4LiHIMK3ICcgKyB5',
  'ZWFyTGFiZWwsIHJvb21GbG9vcnMoZC5yb29tcywgZnVuY3Rpb24ocil7CiAgICAgIHZhciBjbHMgPSByLnJvdW5kc0luWWVhciA+IDAgPyAncy1vaycgOiAoci5zdGF0ZSA9PT0gJ+C5gOC4geC4tOC4meC4geC4s+C4q+C4meC4lCcgPyAncy1kZ3InIDogKHIuc3Rh',
  'dGUgPT09ICfguKLguLHguIfguYTguKHguYjguYDguITguKLguKXguYnguLLguIcnID8gJ3Mtd2FybicgOiAncy1pbmZvJykpOwogICAgICB2YXIgc3ViID0gci5yb3VuZHNJblllYXIgPiAwCiAgICAgICAgPyAnPGI+JyArIHIucm91bmRzSW5ZZWFyICsgJyDguKPg',
  'uK3guJo8L2I+PGJyPicgKyB0aERhdGVTaG9ydChyLnJlY29yZHMuZmlsdGVyKGZ1bmN0aW9uKHgpe3JldHVybiB4LnNlcnZpY2VEYXRlO30pLm1hcChmdW5jdGlvbih4KXtyZXR1cm4geC5zZXJ2aWNlRGF0ZTt9KS5zb3J0KCkucG9wKCkpCiAgICAgICAgOiAoci5i',
  'b29rZWRJblllYXIgPyAn4LiZ4Lix4LiU4LmB4Lil4LmJ4LinICcgKyByLmJvb2tlZEluWWVhciA6IChyLmxhc3RTZXJ2aWNlID8gJ+C4peC5iOC4suC4quC4uOC4lCAnICsgdGhEYXRlU2hvcnQoci5sYXN0U2VydmljZSkgOiAn4LmE4Lih4LmI4Lih4Li14Lib4Lij',
  '4Liw4Lin4Lix4LiV4Li0JykpOwogICAgICByZXR1cm4geyBjbHM6IGNscywgc3ViOiBzdWIsIG9uY2xpY2s6ICdvcGVuQWNSb29tKFwnJyArIHIucm9vbSArICdcJyknIH07CiAgICB9KSwgJycsIGZhbHNlKTsKCiAgICB2YXIgbGlzdFJvd3MgPSBbXTsKICAgIGQu',
  'cm9vbXMuZm9yRWFjaChmdW5jdGlvbihyKXsgci5yZWNvcmRzLmZvckVhY2goZnVuY3Rpb24oeCl7IHguX3Jvb20gPSByLnJvb207IGxpc3RSb3dzLnB1c2goeCk7IH0pOyB9KTsKICAgIGxpc3RSb3dzLnNvcnQoZnVuY3Rpb24oYSxiKXsgcmV0dXJuIFN0cmluZyhi',
  'LnNlcnZpY2VEYXRlfHxiLmJvb2tEYXRlfHwnJykubG9jYWxlQ29tcGFyZShTdHJpbmcoYS5zZXJ2aWNlRGF0ZXx8YS5ib29rRGF0ZXx8JycpKTsgfSk7CgogICAgdmFyIGxpc3QgPSBjYXJkKCfwn5OLIOC4m+C4o+C4sOC4p+C4seC4leC4tOC4geC4suC4o+C4peC5',
  'ieC4suC4h+C5geC4reC4o+C5jCDCtyAnICsgeWVhckxhYmVsICsgJyAoJyArIGxpc3RSb3dzLmxlbmd0aCArICcpJywKICAgICAgbGlzdFJvd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICAg',
  'Jzx0aD7guKvguYnguK3guIc8L3RoPjx0aD7guKPguK3guJrguJfguLXguYg8L3RoPjx0aD7guKfguLHguJnguJfguLXguYjguJnguLHguJQ8L3RoPjx0aD7guKfguLHguJnguJfguLXguYjguJTguLPguYDguJnguLTguJnguIHguLLguKM8L3RoPjx0aD7guKrguJbg',
  'uLLguJnguLA8L3RoPicgKwogICAgICAgICc8dGg+4LiK4LmI4Liy4LiHPC90aD48dGggY2xhc3M9Im51bSI+4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiPC90aD48dGg+4Lig4Liy4LiePC90aD48dGg+4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4PC90aD48',
  'dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIGxpc3RSb3dzLm1hcChmdW5jdGlvbih4KXsKICAgICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgICAnPHRkPjxiPicgKyBlc2MoeC5yb29tKSArICc8L2I+PC90ZD4nICsKICAgICAg',
  'ICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHgucm91bmQgfHwgMSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyB0aERhdGUoeC5ib29rRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0i',
  'bm93cmFwIGZzMTIiPicgKyB0aERhdGUoeC5zZXJ2aWNlRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgc3RhdHVzQmFkZ2UoeC5zdGF0dXMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MoeC50ZWNo',
  'bmljaWFuIHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyBudW0oeC5jb3N0KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHgucGhvdG9SZWZzKSArICc8L3RkPicgKwogICAgICAg',
  'ICAgICAnPHRkIGNsYXNzPSJmczEyIG11dGVkIGNsaXAiPicgKyBlc2MoeC5ub3RlIHx8ICcnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPjxkaXYgY2xhc3M9InQtYWN0aW9ucyI+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBp',
  'Y29uIiBvbmNsaWNrPVwnZm9ybUFjKCcgKyBhdHRyKHgpICsgJylcJz7inI/vuI88L2J1dHRvbj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24gZGdyIiBvbmNsaWNrPSJkZWxBYyhcJycgKyB4LmlkICsgJ1wnKSI+8J+XkTwvYnV0',
  'dG9uPicgKwogICAgICAgICAgICAnPC9kaXY+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgOiBlbXB0eUJveCgn4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lia4Lix4LiZ4LiX4Li24LiB4LiB',
  '4Liy4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4LmD4LiZJyArIHllYXJMYWJlbCksICcnLCB0cnVlKTsKCiAgICByZXR1cm4gaGVhZCArIGFjdGlvbnMgKyBncmlkICsgJzxkaXYgY2xhc3M9Im10MTIiPicgKyBsaXN0ICsgJzwvZGl2Pic7CiAgfQp9OwoKZnVu',
  'Y3Rpb24gb3BlbkFjUm9vbShyb29tKXsKICB2YXIgZCA9IFMuY2FjaGUuYWM7CiAgdmFyIHIgPSBkLnJvb21zLmZpbHRlcihmdW5jdGlvbih4KXsgcmV0dXJuIHgucm9vbSA9PT0gcm9vbTsgfSlbMF07CiAgdmFyIGJvZHkgPQogICAgJzxkaXYgY2xhc3M9ImdyaWQg',
  'ZzMgbWIxMiI+JyArCiAgICAgIGtwaSgn4Lij4Lit4Lia4LiX4Li14LmI4Lil4LmJ4Liy4LiH4LmD4LiZ4Lib4Li14LiZ4Li14LmJJywgKHIucm91bmRzSW5ZZWFyfHwwKSArICcg4Lij4Lit4LiaJywgJycpICsKICAgICAga3BpKCfguKXguYnguLLguIfguKXguYjg',
  'uLLguKrguLjguJQnLCByLmxhc3RTZXJ2aWNlID8gdGhEYXRlKHIubGFzdFNlcnZpY2UpIDogJ+KAkycsIHIubGFzdFNlcnZpY2UgPyAoZGF5c0FnbyhyLmxhc3RTZXJ2aWNlKSArICcg4Lin4Lix4LiZ4LiX4Li14LmI4LmB4Lil4LmJ4LinJykgOiAnJykgKwogICAg',
  'ICBrcGkoJ+C4hOC4o+C4muC4geC4s+C4q+C4meC4lOC4o+C4reC4muC4luC4seC4lOC5hOC4mycsIHIubmV4dER1ZSA/IHRoRGF0ZShyLm5leHREdWUpIDogJ+KAkycsIHIuc3RhdGUsIHIuc3RhdGUgPT09ICfguYDguIHguLTguJnguIHguLPguKvguJnguJQnID8g',
  'J2JhZCcgOiAnJykgKwogICAgJzwvZGl2PicgKwogICAgKHIucmVjb3Jkcy5sZW5ndGgKICAgICAgPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDphdXRvIj48dGhlYWQ+PHRyPjx0aD7guKPguK3guJo8L3RoPjx0aD7g',
  'uJnguLHguJQ8L3RoPjx0aD7guJTguLPguYDguJnguLTguJnguIHguLLguKM8L3RoPjx0aD7guKrguJbguLLguJnguLA8L3RoPjx0aD7guKDguLLguJ48L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgci5yZWNvcmRzLm1hcChmdW5j',
  'dGlvbih4KXsKICAgICAgICAgIHJldHVybiAnPHRyPjx0ZD4nICsgKHgucm91bmR8fDEpICsgJzwvdGQ+PHRkIGNsYXNzPSJmczEyIj4nICsgdGhEYXRlKHguYm9va0RhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyB0aERh',
  'dGUoeC5zZXJ2aWNlRGF0ZSkgKyAnPC90ZD48dGQ+JyArIHN0YXR1c0JhZGdlKHguc3RhdHVzKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHgucGhvdG9SZWZzKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPjxidXR0b24g',
  'Y2xhc3M9ImJ0biBzbSIgb25jbGljaz1cJ2Nsb3NlTW9kYWwoKTtmb3JtQWMoJyArIGF0dHIoeCkgKyAnKVwnPuC5geC4geC5ieC5hOC4gjwvYnV0dG9uPjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nCiAg',
  'ICAgIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij7guKLguLHguIfguYTguKHguYjguKHguLXguJrguLHguJnguJfguLbguIHguYPguJnguJvguLXguJfguLXguYjguYDguKXguLfguK3guIE8L2Rpdj4nKTsKCiAgb3Blbk1vZGFsKCfinYTvuI8g4Lil4LmJ4Liy4LiH4LmB',
  '4Lit4Lij4LmMIMK3IOC4q+C5ieC4reC4hyAnICsgcm9vbSwgYm9keSwKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lib4Li04LiUPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0i',
  'Y2xvc2VNb2RhbCgpO2Zvcm1BYyh7cm9vbTpcJycgKyByb29tICsgJ1wnfSkiPisg4LmA4Lie4Li04LmI4Lih4Lij4Lit4Lia4LiB4Liy4Lij4Lil4LmJ4Liy4LiHPC9idXR0b24+Jyk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PQogICA1KSDguIvguYjguK3guKHguYHguIvguKHguJXguLLguKHguKvguYnguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5yZXBh',
  'aXJzID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7IHJldHVybiBjYWxsQXBpKCdyZXBhaXIubWF0cml4JywgeyB5ZWFyOiBTLnllYXIgfSk7IH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09ICdhbGwnID8gJ+C4l+C4',
  'uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICBrcGkoJ+C4h+C4suC4meC4i+C5iOC4reC4oSAnICsgeWVhckxhYmVsLCBkLnRvdGFsSm9icyArICcg4LiH4Liy',
  '4LiZJywgJ+C4iOC4suC4gSAnICsgZC5yb29tcy5maWx0ZXIoZnVuY3Rpb24ocil7cmV0dXJuIHIuY291bnQ+MDt9KS5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsICdhY2NlbnQnKSArCiAgICAgIGtwaSgn4LiH4Liy4LiZ4LiX4Li14LmI4Lii4Lix4LiH4LmE4Lih',
  '4LmI4LmA4Liq4Lij4LmH4LiIJywgZC5vcGVuSm9icyArICcg4LiH4Liy4LiZJywgJycsIGQub3BlbkpvYnMgPyAnd2FybicgOiAnZ29vZCcpICsKICAgICAga3BpKCfguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguKPguKfguKEnLCBiYWh0KGQudG90YWxD',
  'b3N0KSwgeWVhckxhYmVsKSArCiAgICAgIGtwaSgn4Lir4LmJ4Lit4LiH4LiX4Li14LmI4Lii4Lix4LiH4LmE4Lih4LmI4LmA4LiE4Lii4LiL4LmI4Lit4LihJywgZC5yb29tcy5maWx0ZXIoZnVuY3Rpb24ocil7cmV0dXJuIHIuY291bnQ9PT0wO30pLmxlbmd0aCAr',
  'ICcg4Lir4LmJ4Lit4LiHJywgJ+C5g+C4mScgKyB5ZWFyTGFiZWwpICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciBhY3Rpb25zID0gJzxkaXYgY2xhc3M9InJvdyBtYjEyIj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZvcm1SZXBh',
  'aXIobnVsbCkiPisg4LmB4LiI4LmJ4LiH4LiL4LmI4Lit4LihIC8g4Lia4Lix4LiZ4LiX4Li24LiB4LiH4Liy4LiZ4LiL4LmI4Lit4LihPC9idXR0b24+JyArCiAgICAgICc8c3BhbiBjbGFzcz0ic3AiPjwvc3Bhbj48c3BhbiBjbGFzcz0iZnMxMiBtdXRlZCI+4LiE',
  '4Lil4Li04LiB4LiX4Li14LmI4Lir4LmJ4Lit4LiH4LmA4Lie4Li34LmI4Lit4LiU4Li54Lib4Lij4Liw4Lin4Lix4LiV4Li04LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiC4Lit4LiH4Lir4LmJ4Lit4LiH4LiZ4Lix4LmJ4LiZPC9zcGFuPjwvZGl2Pic7CgogICAgdmFy',
  'IGdyaWQgPSBjYXJkKCfwn5SnIOC4oOC4suC4nuC4o+C4p+C4oeC4h+C4suC4meC4i+C5iOC4reC4oeC4o+C4suC4ouC4q+C5ieC4reC4hyDCtyAnICsgeWVhckxhYmVsLCByb29tRmxvb3JzKGQucm9vbXMsIGZ1bmN0aW9uKHIpewogICAgICB2YXIgY2xzID0gci5v',
  'cGVuQ291bnQgPiAwID8gJ3MtZGdyJyA6IChyLmNvdW50ID4gMCA/ICdzLW9rJyA6ICdzLWluZm8nKTsKICAgICAgdmFyIHN1YiA9IHIuY291bnQgPiAwCiAgICAgICAgPyAnPGI+JyArIHIuY291bnQgKyAnIOC4h+C4suC4mTwvYj4nICsgKHIub3BlbkNvdW50ID8g',
  'JyDCtyDguITguYnguLLguIcgJyArIHIub3BlbkNvdW50IDogJycpICsgJzxicj4nICsgKHIubGFzdCA/IHRoRGF0ZVNob3J0KHIubGFzdCkgOiAnJykKICAgICAgICA6ICfguYTguKHguYjguKHguLXguIfguLLguJnguIvguYjguK3guKEnOwogICAgICByZXR1cm4g',
  'eyBjbHM6IGNscywgc3ViOiBzdWIsIG9uY2xpY2s6ICdvcGVuUmVwYWlyUm9vbShcJycgKyByLnJvb20gKyAnXCcpJyB9OwogICAgfSkpOwoKICAgIHZhciByb3dzID0gW107CiAgICBkLnJvb21zLmZvckVhY2goZnVuY3Rpb24ocil7IHIucmVjb3Jkcy5mb3JFYWNo',
  'KGZ1bmN0aW9uKHgpeyByb3dzLnB1c2goeCk7IH0pOyB9KTsKICAgIHJvd3Muc29ydChmdW5jdGlvbihhLGIpeyByZXR1cm4gU3RyaW5nKGIucmVwYWlyRGF0ZXx8Yi5ib29rRGF0ZXx8JycpLmxvY2FsZUNvbXBhcmUoU3RyaW5nKGEucmVwYWlyRGF0ZXx8YS5ib29r',
  'RGF0ZXx8JycpKTsgfSk7CgogICAgdmFyIGxpc3QgPSBjYXJkKCfwn5OLIOC4o+C4suC4ouC4geC4suC4o+C4h+C4suC4meC4i+C5iOC4reC4oSDCtyAnICsgeWVhckxhYmVsICsgJyAoJyArIHJvd3MubGVuZ3RoICsgJyknLAogICAgICByb3dzLmxlbmd0aCA/ICc8',
  'ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOjEwMjBweCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC4q+C5ieC4reC4hzwvdGg+PHRoPuC4p+C4seC4meC4meC4seC4lOC4i+C5iOC4reC4oTwvdGg+PHRoPuC4p+C4',
  'seC4meC5gOC4guC5ieC4suC4i+C5iOC4reC4oTwvdGg+PHRoPuC4m+C4o+C4sOC5gOC4oOC4lzwvdGg+PHRoPuC4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4i+C5iOC4reC4oeC5geC4i+C4oTwvdGg+JyArCiAgICAgICAgJzx0aD7guKrguJbguLLguJnguLA8',
  'L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguYjguLLguYPguIrguYnguIjguYjguLLguKI8L3RoPjx0aD7guIHguYjguK3guJk8L3RoPjx0aD7guKvguKXguLHguIc8L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgcm93cy5tYXAoZnVu',
  'Y3Rpb24oeCl7CiAgICAgICAgICByZXR1cm4gJzx0cj4nICsKICAgICAgICAgICAgJzx0ZD48Yj4nICsgZXNjKHgucm9vbSkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHguYm9va0RhdGUpICsg',
  'JzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHgucmVwYWlyRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyh4LmNhdGVnb3J5IHx8ICfigJMnKSArICc8L3Rk',
  'PicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEzIj48ZGl2IGNsYXNzPSJjbGlwIj4nICsgZXNjKHguaXRlbXMgfHwgJycpICsgJzwvZGl2PjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHN0YXR1c0JhZGdlKHguc3RhdHVzKSArICh4LnByaW9yaXR5',
  'ICYmIHgucHJpb3JpdHkgIT09ICfguJvguIHguJXguLQnID8gJyAnICsgc3RhdHVzQmFkZ2UoeC5wcmlvcml0eSkgOiAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbnVtKHguY29zdCkgKyAnPC90ZD4nICsKICAgICAgICAg',
  'ICAgJzx0ZD4nICsgdGh1bWJzSHRtbCh4LmJlZm9yZVJlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwoeC5hZnRlclJlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsK',
  'ICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24iIG9uY2xpY2s9XCdmb3JtUmVwYWlyKCcgKyBhdHRyKHgpICsgJylcJz7inI/vuI88L2J1dHRvbj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24gZGdyIiBv',
  'bmNsaWNrPSJkZWxSZXBhaXIoXCcnICsgeC5pZCArICdcJykiPvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICAgJzwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nCiAgICAgIDogZW1wdHlCb3go',
  'J+C4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4i+C5iOC4reC4oeC5g+C4mScgKyB5ZWFyTGFiZWwsICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtUmVwYWlyKG51bGwpIj4rIOC5geC4iOC5ieC4h+C4i+C5iOC4reC4oTwvYnV0',
  'dG9uPicpLCAnJywgdHJ1ZSk7CgogICAgcmV0dXJuIGhlYWQgKyBhY3Rpb25zICsgZ3JpZCArICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgbGlzdCArICc8L2Rpdj4nOwogIH0KfTsKCmZ1bmN0aW9uIG9wZW5SZXBhaXJSb29tKHJvb20pewogIHZhciBkID0gUy5jYWNo',
  'ZS5yZXBhaXJzOwogIHZhciByID0gZC5yb29tcy5maWx0ZXIoZnVuY3Rpb24oeCl7IHJldHVybiB4LnJvb20gPT09IHJvb207IH0pWzBdOwogIHZhciBib2R5ID0gJzxkaXYgY2xhc3M9ImdyaWQgZzMgbWIxMiI+JyArCiAgICAgIGtwaSgn4LiH4Liy4LiZ4LiX4Lix',
  '4LmJ4LiH4Lir4Lih4LiUJywgci5jb3VudCArICcg4LiH4Liy4LiZJywgJycpICsKICAgICAga3BpKCfguKLguLHguIfguYTguKHguYjguYDguKrguKPguYfguIgnLCByLm9wZW5Db3VudCArICcg4LiH4Liy4LiZJywgJycsIHIub3BlbkNvdW50ID8gJ3dhcm4nOidn',
  'b29kJykgKwogICAgICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oicsIGJhaHQoci5jb3N0KSwgJycpICsKICAgICc8L2Rpdj4nICsKICAgIChyLnJlY29yZHMubGVuZ3RoID8gJzxkaXYgY2xhc3M9InRsIj4nICsgci5yZWNvcmRzLm1hcChmdW5j',
  'dGlvbih4KXsKICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJ0bC1pIj48ZGl2IGNsYXNzPSJkIj4nICsgdGhEYXRlKHgucmVwYWlyRGF0ZSB8fCB4LmJvb2tEYXRlKSArICcgwrcgJyArIGVzYyh4LmNhdGVnb3J5fHwnJykgKyAnICcgKyBzdGF0dXNCYWRnZSh4LnN0',
  'YXR1cykgKyAnPC9kaXY+JyArCiAgICAgICAgJzxkaXYgY2xhc3M9InQiPicgKyBlc2MoeC5pdGVtcyB8fCAnJykgKyAnPC9kaXY+JyArCiAgICAgICAgKHgudGVjaG5pY2lhbiA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIj7guIrguYjguLLguIc6ICcgKyBlc2Mo',
  'eC50ZWNobmljaWFuKSArICc8L2Rpdj4nIDogJycpICsKICAgICAgICAoeC5jb3N0ID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQiPuC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oiAnICsgYmFodCh4LmNvc3QpICsgJzwvZGl2PicgOiAnJykgKwogICAgICAg',
  'ICc8ZGl2IGNsYXNzPSJtdDgiPicgKyB0aHVtYnNIdG1sKCh4LmJlZm9yZVJlZnN8fFtdKS5jb25jYXQoeC5hZnRlclJlZnN8fFtdKSkgKyAnPC9kaXY+JyArCiAgICAgICAgJzxkaXYgY2xhc3M9Im10OCI+PGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPVwn',
  'Y2xvc2VNb2RhbCgpO2Zvcm1SZXBhaXIoJyArIGF0dHIoeCkgKyAnKVwnPuC5geC4geC5ieC5hOC4gjwvYnV0dG9uPjwvZGl2PicgKwogICAgICAnPC9kaXY+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4',
  'h+C5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4i+C5iOC4reC4oeC5g+C4meC4m+C4teC4l+C4teC5iOC5gOC4peC4t+C4reC4gTwvZGl2PicpOwoKICBvcGVuTW9kYWwoJ/CflKcg4LiH4Liy4LiZ4LiL4LmI4Lit4LihIMK3IOC4q+C5ieC4reC4hyAnICsgcm9vbSwg',
  'Ym9keSwKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lib4Li04LiUPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iY2xvc2VNb2RhbCgpO2Zvcm1SZXBhaXIoe3Jvb206XCcnICsg',
  'cm9vbSArICdcJ30pIj4rIOC5gOC4nuC4tOC5iOC4oeC4h+C4suC4meC4i+C5iOC4reC4oTwvYnV0dG9uPicsIHRydWUpOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgNikg4LiL4LmI',
  '4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmC4LiU4Lii4Lij4Lin4LihCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMuYnVpbGRpbmcgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsK',
  'ICAgIHJldHVybiBQcm9taXNlLmFsbChbCiAgICAgIGNhbGxBcGkoJ2J1aWxkaW5nLnN1bW1hcnknLCB7IHllYXI6IFMueWVhciB9KSwKICAgICAgY2FsbEFwaSgnYnVpbGRpbmcubGlzdCcsIHsgeWVhcjogUy55ZWFyLCB6b25lOiBTLnBhcmFtcy56b25lIHx8ICcn',
  'LCBzdGF0dXM6ICcnIH0pCiAgICBdKS50aGVuKGZ1bmN0aW9uKHIpeyB2YXIgZCA9IHJbMF07IGQuaXRlbXMgPSByWzFdOyByZXR1cm4gZDsgfSk7CiAgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcg',
  'PyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKICAgIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgIGtwaSgn4LiH4Liy4LiZ4Lib4Li1ICcgKyAoUy55ZWFyPT09J2FsbCc/J+C4l+C4seC5ieC4h+C4',
  'q+C4oeC4lCc6Uy55ZWFyKSwgZC55ZWFyQ291bnQgKyAnIOC4h+C4suC4mScsICfguKrguLDguKrguKEgJyArIGQudG90YWwgKyAnIOC4h+C4suC4mScsICdhY2NlbnQnKSArCiAgICAgIGtwaSgn4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiICcgKyB5ZWFy',
  'TGFiZWwsIGJhaHQoZC55ZWFyQ29zdCksICfguKrguLDguKrguKEgJyArIGJhaHQoZC5ncmFuZENvc3QpKSArCiAgICAgIGtwaSgn4LiH4Liy4LiZ4LiX4Li14LmI4Lii4Lix4LiH4LmE4Lih4LmI4LmA4Liq4Lij4LmH4LiIJywgZC5vcGVuQ291bnQgKyAnIOC4h+C4',
  'suC4mScsICcnLCBkLm9wZW5Db3VudCA/ICd3YXJuJyA6ICdnb29kJykgKwogICAgICBrcGkoJ+C4hOC4o+C4muC4geC4s+C4q+C4meC4lOC5g+C4mSA5MCDguKfguLHguJknLCBkLnVwY29taW5nLmxlbmd0aCArICcg4LiH4Liy4LiZJywgZC51cGNvbWluZy5sZW5n',
  'dGggPyBkLnVwY29taW5nWzBdLnRpdGxlIDogJycsIGQudXBjb21pbmcubGVuZ3RoID8gJ3dhcm4nIDogJycpICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciB6b25lcyA9ICc8ZGl2IGNsYXNzPSJjaGlwcyBtYjEyIj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImNo',
  'aXAgJyArICghUy5wYXJhbXMuem9uZT8nb24nOicnKSArICciIG9uY2xpY2s9InNldFBhcmFtKFwnem9uZVwnLFwnXCcpIj7guJfguLjguIHguKrguYjguKfguJk8L2J1dHRvbj4nICsKICAgICAgZC5ieVpvbmUubWFwKGZ1bmN0aW9uKHopewogICAgICAgIHJldHVy',
  'biAnPGJ1dHRvbiBjbGFzcz0iY2hpcCAnICsgKFMucGFyYW1zLnpvbmU9PT16LnpvbmU/J29uJzonJykgKyAnIiBvbmNsaWNrPSJzZXRQYXJhbShcJ3pvbmVcJyxcJycgKyBlc2Moei56b25lKSArICdcJykiPicgKwogICAgICAgICAgICAgICBlc2Moei56b25lKSAr',
  'ICcgKCcgKyB6LmNvdW50ICsgJyk8L2J1dHRvbj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwoKICAgIHZhciBjaGFydHMgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnMiBtYjEyIj4nICsKICAgICAgY2FyZCgn8J+Pl++4jyDguITguYjguLLguYPguIrguYng',
  'uIjguYjguLLguKLguYHguKLguIHguJXguLLguKHguKrguYjguKfguJnguILguK3guIfguK3guLLguITguLLguKMnLCBiYXJDaGFydChkLmJ5Wm9uZSwgJ3pvbmUnLCAnY29zdCcsIGZ1bmN0aW9uKGkpeyByZXR1cm4gbW9uZXkoaS5jb3N0KSArICcg4Li/JzsgfSkp',
  'ICsKICAgICAgY2FyZCgn8J+ThSDguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguYHguKLguIHguJXguLLguKHguJvguLUnLCBiYXJDaGFydCgKICAgICAgICBkLmJ5WWVhci5tYXAoZnVuY3Rpb24oeSl7IHJldHVybiB7IGxhYmVsOifguJvguLUgJyArIHku',
  'eWVhciArICcgKCcgKyB5LmNvdW50ICsgJyDguIfguLLguJkpJywgY29zdDp5LmNvc3QgfTsgfSksCiAgICAgICAgJ2xhYmVsJywgJ2Nvc3QnLCBmdW5jdGlvbihpKXsgcmV0dXJuIG1vbmV5KGkuY29zdCkgKyAnIOC4vyc7IH0pKSArCiAgICAnPC9kaXY+JzsKCiAg',
  'ICB2YXIgcm93cyA9IGQuaXRlbXM7CiAgICB2YXIgbGlzdCA9IGNhcmQoJ/Cfj6Ig4Lij4Liy4Lii4LiB4Liy4Lij4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmC4LiU4Lii4Lij4Lin4LihIMK3ICcgKyB5ZWFyTGFiZWwgKyAnICgnICsgcm93cy5sZW5n',
  'dGggKyAnKScsCiAgICAgIHJvd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiIHN0eWxlPSJtaW4td2lkdGg6MTAyMHB4Ij48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4Liq4LmI4Lin4LiZ4LiC4Lit4LiH4Lit4Liy4LiE4Liy',
  '4LijPC90aD48dGg+4Lij4Liy4Lii4LiB4Liy4LijPC90aD48dGg+4LiZ4Lix4LiUPC90aD48dGg+4LmA4Lij4Li04LmI4LihPC90aD48dGg+4LmA4Liq4Lij4LmH4LiIPC90aD48dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD4nICsKICAgICAgICAnPHRoPuC4nOC4ueC5',
  'ieC4o+C4seC4muC5gOC4q+C4oeC4sjwvdGg+PHRoIGNsYXNzPSJudW0iPuC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ojwvdGg+PHRoPuC4o+C4reC4muC4luC4seC4lOC5hOC4mzwvdGg+PHRoPuC4oOC4suC4njwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFk',
  'Pjx0Ym9keT4nICsKICAgICAgICByb3dzLm1hcChmdW5jdGlvbih4KXsKICAgICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj48Yj4nICsgZXNjKHguem9uZSB8fCAn4oCTJykgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAg',
  'ICAgICc8dGQgY2xhc3M9ImZzMTMiPjxkaXYgY2xhc3M9ImNsaXAiPicgKyBlc2MoeC50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICAgKHgubm90ZSA/ICc8ZGl2IGNsYXNzPSJmczEyIGZhaW50IGNsaXAiPicgKyBlc2MoeC5ub3RlKSArICc8L2Rpdj4n',
  'IDogJycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHguYm9va0RhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHguc3RhcnREYXRl',
  'KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LmVuZERhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHN0YXR1c0JhZGdlKHguc3RhdHVzKSArICc8L3RkPicgKwogICAgICAgICAg',
  'ICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKHguY29udHJhY3RvciB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbnVtKHguY29zdCkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFw',
  'IGZzMTIiPicgKyAoeC5uZXh0RHVlID8gdGhEYXRlU2hvcnQoeC5uZXh0RHVlKSArCiAgICAgICAgICAgICAgICAoeC5kdWVJbkRheXMgIT0gbnVsbCA/ICc8ZGl2IGNsYXNzPSJmYWludCIgc3R5bGU9ImZvbnQtc2l6ZToxMXB4Ij4nICsgKHguZHVlSW5EYXlzPDAg',
  'PyAn4LmA4Lil4LiiICcgKyAoLXguZHVlSW5EYXlzKSArICcg4Lin4Lix4LiZJyA6ICfguK3guLXguIEgJyArIHguZHVlSW5EYXlzICsgJyDguKfguLHguJknKSArICc8L2Rpdj4nIDogJycpCiAgICAgICAgICAgICAgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAg',
  'ICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCgoeC5waG90b1JlZnN8fFtdKS5jb25jYXQoeC5zbGlwUmVmc3x8W10pKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPjxkaXYgY2xhc3M9InQtYWN0aW9ucyI+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xh',
  'c3M9ImJ0biBzbSBpY29uIiBvbmNsaWNrPVwnZm9ybUJ1aWxkaW5nKCcgKyBhdHRyKHgpICsgJylcJz7inI/vuI88L2J1dHRvbj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24gZGdyIiBvbmNsaWNrPSJkZWxCdWlsZGluZyhcJycg',
  'KyB4LmlkICsgJ1wnKSI+8J+XkTwvYnV0dG9uPicgKwogICAgICAgICAgICAnPC9kaXY+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgOiBlbXB0eUJveCgn4Lii4Lix4LiH4LmE4Lih4LmI4Lih',
  '4Li14LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmD4LiZJyArIHllYXJMYWJlbCwgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZvcm1CdWlsZGluZyhudWxsKSI+KyDguYDguJ7guLTguYjguKHguIfguLLguJnguIvguYjg',
  'uK3guKHguJXguLbguIE8L2J1dHRvbj4nKSwKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgc20iIG9uY2xpY2s9ImZvcm1CdWlsZGluZyhudWxsKSI+KyDguYDguJ7guLTguYjguKHguIfguLLguJnguIvguYjguK3guKHguJXguLbguIE8L2J1dHRvbj4nLCB0',
  'cnVlKTsKCiAgICByZXR1cm4gaGVhZCArIHpvbmVzICsgY2hhcnRzICsgbGlzdDsKICB9Cn07CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgNykg4Lir4LmJ4Lit4LiH4Lie4Lix4LiBCiAg',
  'ID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMucm9vbXMgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsgcmV0dXJuIGNhbGxBcGkoJ3Jvb20ubGlzdCcpLnRoZW4oZnVuY3Rpb24oZmxvb3Jz',
  'KXsgcmV0dXJuIHsgZmxvb3JzOiBmbG9vcnMsIHllYXJzOiBbXSB9OyB9KTsgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIGZsYXQgPSBbXTsKICAgIGQuZmxvb3JzLmZvckVhY2goZnVuY3Rpb24oZil7IGYucm9vbXMuZm9yRWFjaChmdW5jdGlvbihy',
  'KXsgZmxhdC5wdXNoKHIpOyB9KTsgfSk7CiAgICB2YXIgb2NjID0gZmxhdC5maWx0ZXIoZnVuY3Rpb24ocil7IHJldHVybiByLnN0YXR1cyA9PT0gJ+C4oeC4teC4nOC4ueC5ieC5gOC4iuC5iOC4sic7IH0pLmxlbmd0aDsKCiAgICB2YXIgaGVhZCA9ICc8ZGl2IGNs',
  'YXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICBrcGkoJ+C4q+C5ieC4reC4h+C4l+C4seC5ieC4h+C4q+C4oeC4lCcsIGZsYXQubGVuZ3RoICsgJyDguKvguYnguK3guIcnLCAnNSDguIrguLHguYnguJknLCAnYWNjZW50JykgKwogICAgICBrcGkoJ+C4oeC4teC4',
  'nOC4ueC5ieC5gOC4iuC5iOC4sicsIG9jYyArICcg4Lir4LmJ4Lit4LiHJywgcGN0KGZsYXQubGVuZ3RoID8gb2NjL2ZsYXQubGVuZ3RoKjEwMCA6IDApICsgJyDguK3guLHguJXguKPguLLguYDguILguYnguLLguJ7guLHguIEnLCAnZ29vZCcpICsKICAgICAga3Bp',
  'KCfguKvguYnguK3guIfguKfguYjguLLguIcnLCBmbGF0LmZpbHRlcihmdW5jdGlvbihyKXsgcmV0dXJuIHIuc3RhdHVzID09PSAn4Lin4LmI4Liy4LiHJzsgfSkubGVuZ3RoICsgJyDguKvguYnguK3guIcnLCAnJywgJ3dhcm4nKSArCiAgICAgIGtwaSgn4LiE4LmI',
  '4Liy4LmA4LiK4LmI4Liy4Lij4Lin4LihL+C5gOC4lOC4t+C4reC4mScsIGJhaHQoZmxhdC5yZWR1Y2UoZnVuY3Rpb24oYSxyKXsgcmV0dXJuIGEgKyAoTnVtYmVyKHIucmVudCl8fDApOyB9LCAwKSksICfguIjguLLguIHguKvguYnguK3guIfguJfguLXguYjguIHg',
  'uKPguK3guIHguITguYjguLLguYDguIrguYjguLLguYTguKfguYknKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgZ3JpZCA9IGNhcmQoJ/Cfmqog4Lic4Lix4LiH4Lir4LmJ4Lit4LiH4Lie4Lix4LiBJywgcm9vbUZsb29ycyhmbGF0LCBmdW5jdGlvbihyKXsKICAg',
  'ICAgdmFyIGNscyA9IHIuc3RhdHVzID09PSAn4Lih4Li14Lic4Li54LmJ4LmA4LiK4LmI4LiyJyA/ICdzLW9rJyA6IChyLnN0YXR1cyA9PT0gJ+C4p+C5iOC4suC4hycgPyAncy1pbmZvJyA6ICdzLXdhcm4nKTsKICAgICAgcmV0dXJuIHsgY2xzOiBjbHMsIHN1Yjog',
  'ZXNjKHIudGVuYW50IHx8IHIuc3RhdHVzIHx8ICcnKSArIChyLnJlbnQgPyAnPGJyPicgKyBtb25leShyLnJlbnQpICsgJyDguL8nIDogJycpLAogICAgICAgICAgICAgICBvbmNsaWNrOiAnb3BlblJvb20oXCcnICsgci5yb29tICsgJ1wnKScgfTsKICAgIH0pLCAn',
  'PHNwYW4gY2xhc3M9ImZzMTIgbXV0ZWQiPuC4hOC4peC4tOC4geC4l+C4teC5iOC4q+C5ieC4reC4h+C5gOC4nuC4t+C5iOC4reC4lOC4ueC4m+C4o+C4sOC4p+C4seC4leC4tOC4l+C4seC5ieC4h+C4q+C4oeC4lOC4guC4reC4h+C4q+C5ieC4reC4h+C4meC4seC5',
  'ieC4mTwvc3Bhbj4nKTsKCiAgICByZXR1cm4gaGVhZCArIGdyaWQ7CiAgfQp9OwoKZnVuY3Rpb24gb3BlblJvb20ocm9vbSl7CiAgb3Blbk1vZGFsKCfwn5qqIOC4q+C5ieC4reC4hyAnICsgcm9vbSwgJzxkaXYgY2xhc3M9ImVtcHR5Ij48c3BhbiBjbGFzcz0ic3Bp',
  'biI+PC9zcGFuPiDguIHguLPguKXguLHguIfguYLguKvguKXguJTigKY8L2Rpdj4nKTsKICBjYWxsQXBpKCdyb29tLnByb2ZpbGUnLCB7IHJvb206IHJvb20gfSkudGhlbihmdW5jdGlvbihwKXsKICAgIHZhciBpID0gcC5pbmZvOwogICAgdmFyIGJvZHkgPQogICAg',
  'ICAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAgICBrcGkoJ+C4quC4luC4suC4meC4sCcsIGkuc3RhdHVzIHx8ICfigJMnLCBlc2MoaS50ZW5hbnQgfHwgJycpKSArCiAgICAgICAga3BpKCfguKXguYnguLLguIfguYHguK3guKPguYwnLCBwLmFj',
  'Q291bnQgKyAnIOC4hOC4o+C4seC5ieC4hycsIHAubGFzdEFjID8gJ+C4peC5iOC4suC4quC4uOC4lCAnICsgdGhEYXRlKHAubGFzdEFjKSA6ICfguYTguKHguYjguKHguLXguJvguKPguLDguKfguLHguJXguLQnKSArCiAgICAgICAga3BpKCfguIfguLLguJnguIvg',
  'uYjguK3guKEnLCBwLnJlcGFpckNvdW50ICsgJyDguIfguLLguJknLCAn4LiE4LmJ4Liy4LiHICcgKyBwLm9wZW5SZXBhaXJzLCBwLm9wZW5SZXBhaXJzID8gJ3dhcm4nIDogJycpICsKICAgICAgICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC4',
  'quC4sOC4quC4oScsIGJhaHQocC50b3RhbENvc3QpLCAn4LiL4LmI4Lit4LihICsg4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJykgKwogICAgICAnPC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJyb3cgbWIxMiI+JyArCiAgICAgICAgJzxidXR0b24gY2xhc3M9',
  'ImJ0biBzbSIgb25jbGljaz1cJ2Nsb3NlTW9kYWwoKTtmb3JtUm9vbSgnICsgYXR0cihpKSArICcpXCc+4pyP77iPIOC5geC4geC5ieC5hOC4guC4guC5ieC4reC4oeC4ueC4peC4q+C5ieC4reC4hzwvYnV0dG9uPicgKwogICAgICAgICc8YnV0dG9uIGNsYXNzPSJi',
  'dG4gc20iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtmb3JtUmVwYWlyKHtyb29tOlwnJyArIHJvb20gKyAnXCd9KSI+KyDguYHguIjguYnguIfguIvguYjguK3guKE8L2J1dHRvbj4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJjbG9z',
  'ZU1vZGFsKCk7Zm9ybUFjKHtyb29tOlwnJyArIHJvb20gKyAnXCd9KSI+KyDguKXguYnguLLguIfguYHguK3guKPguYw8L2J1dHRvbj4nICsKICAgICAgJzwvZGl2PicgKwogICAgICAocC5hc3NldHMubGVuZ3RoID8gJzxkaXYgY2xhc3M9ImNhcmQgbWIxMiI+PGRp',
  'diBjbGFzcz0iY2FyZC1oIj48aDM+4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZ4LmD4LiZ4Lir4LmJ4Lit4LiHPC9oMz48L2Rpdj48ZGl2IGNsYXNzPSJjYXJkLWIiPicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0i',
  'bWluLXdpZHRoOmF1dG8iPjx0aGVhZD48dHI+PHRoPuC4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4mTwvdGg+PHRoPuC4ouC4teC5iOC4q+C5ieC4rS/guKPguLjguYjguJk8L3RoPjx0aD7guJXguLTguJTguJXguLHguYnguIc8L3RoPjx0aD7guKrguJbguLLguJng',
  'uLA8L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgcC5hc3NldHMubWFwKGZ1bmN0aW9uKGEpewogICAgICAgICAgcmV0dXJuICc8dHI+PHRkPicgKyBlc2MoYS5uYW1lKSArICc8L3RkPjx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyhhLmJyYW5kfHwn',
  '4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgdGhEYXRlKGEuaW5zdGFsbERhdGUpICsgJzwvdGQ+PHRkPicgKyBzdGF0dXNCYWRnZShhLnN0YXR1cykgKyAnPC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbign',
  'JykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PjwvZGl2PjwvZGl2PicgOiAnJykgKwogICAgICAnPGgzIGNsYXNzPSJmczEzIG1iOCI+4Lib4Lij4Liw4Lin4Lix4LiV4Li04LiX4Lix4LmJ4LiH4Lir4Lih4LiUICgnICsgcC50aW1lbGluZS5sZW5ndGggKyAnKTwv',
  'aDM+JyArCiAgICAgIChwLnRpbWVsaW5lLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0bCI+JyArIHAudGltZWxpbmUubWFwKGZ1bmN0aW9uKGUpewogICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0idGwtaSI+PGRpdiBjbGFzcz0iZCI+JyArIHRoRGF0ZShlLmRhdGUp',
  'ICsgJyDCtyAnICsgZXNjKGUudHlwZSkgKyAnICcgKyBzdGF0dXNCYWRnZShlLnN0YXR1cykgKyAnPC9kaXY+JyArCiAgICAgICAgICAnPGRpdiBjbGFzcz0idCI+JyArIGVzYyhlLnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgICAgIChlLmRldGFpbCA/ICc8ZGl2',
  'IGNsYXNzPSJmczEyIG11dGVkIj4nICsgZXNjKGUuZGV0YWlsKSArICc8L2Rpdj4nIDogJycpICsKICAgICAgICAgIChlLmNvc3QgPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCI+JyArIGJhaHQoZS5jb3N0KSArICc8L2Rpdj4nIDogJycpICsKICAgICAgICAgIChl',
  'LnBob3RvcyAmJiBlLnBob3Rvcy5sZW5ndGggPyAnPGRpdiBjbGFzcz0ibXQ4Ij4nICsgdGh1bWJzSHRtbChlLnBob3RvcykgKyAnPC9kaXY+JyA6ICcnKSArCiAgICAgICAgJzwvZGl2Pic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicgOiAnPGRpdiBjbGFz',
  'cz0iZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4m+C4o+C4sOC4p+C4seC4leC4tDwvZGl2PicpOwoKICAgIG9wZW5Nb2RhbCgn8J+aqiDguKvguYnguK3guIcgJyArIHJvb20gKyAnIMK3IOC4iuC4seC5ieC4mSAnICsgKGkuZmxvb3J8fCcnKSwgYm9k',
  'eSwKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guJvguLTguJQ8L2J1dHRvbj4nLCB0cnVlKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7IGNsb3NlTW9kYWwoKTsgfSk7',
  'Cn0KCgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgOCkg4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4ouC4q+C4rSAo4Lij4Liy4Lii4LmA4LiU4Li34Lit4LiZKQog',
  'ICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLmZpbmFuY2UgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsKICAgIHJldHVybiBQcm9taXNlLmFsbChbCiAgICAgIGNhbGxBcGkoJ2ZpbmFu',
  'Y2Uuc3VtbWFyeScsIHsgeWVhcjogUy55ZWFyIH0pLAogICAgICBjYWxsQXBpKCdmaW5hbmNlLmxpc3QnLCB7IHllYXI6IFMueWVhciwga2luZDogUy5wYXJhbXMua2luZCB8fCAnJyB9KQogICAgXSkudGhlbihmdW5jdGlvbihyKXsgdmFyIGQgPSByWzBdOyBkLml0',
  'ZW1zID0gclsxXTsgcmV0dXJuIGQ7IH0pOwogIH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgaGVhZCA9ICc8',
  'ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICBrcGkoJ+C4o+C4suC4ouC4o+C4seC4miAnICsgeWVhckxhYmVsLCBiYWh0KGQuaW5jb21lKSwgJ+C5gOC4ieC4peC4teC5iOC4oiAnICsgYmFodChkLmF2Z0luY29tZSkgKyAnL+C5gOC4lOC4t+C4reC4',
  'mScsICdnb29kJykgKwogICAgICBrcGkoJ+C4o+C4suC4ouC4iOC5iOC4suC4oiAnICsgeWVhckxhYmVsLCBiYWh0KGQuZXhwZW5zZSksICfguYDguInguKXguLXguYjguKIgJyArIGJhaHQoZC5hdmdFeHBlbnNlKSArICcv4LmA4LiU4Li34Lit4LiZJywgJ2JhZCcp',
  'ICsKICAgICAga3BpKCfguITguIfguYDguKvguKXguLfguK3guKrguLjguJfguJjguLQnLCBiYWh0KGQubmV0KSwgJ+C4reC4seC4leC4o+C4suC4geC4s+C5hOC4oyAnICsgcGN0KGQubWFyZ2luKSwgJ2FjY2VudCAnICsgKGQubmV0ID49IDAgPyAnZ29vZCcgOiAn',
  'YmFkJykpICsKICAgICAga3BpKCfguJrguLHguJnguJfguLbguIHguYHguKXguYnguKcnLCBkLm1vbnRoc1dpdGhEYXRhICsgJyDguYDguJTguLfguK3guJknLCBkLmNvdW50ICsgJyDguKPguLLguKLguIHguLLguKMnKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIg',
  'bWF4QmFyID0gTWF0aC5tYXguYXBwbHkobnVsbCwgZC5ieU1vbnRoLm1hcChmdW5jdGlvbihtKXsgcmV0dXJuIE1hdGgubWF4KG0uaW5jb21lLCBtLmV4cGVuc2UpOyB9KSkgfHwgMTsKICAgIHZhciBtb250aGx5ID0gY2FyZCgn8J+ThSDguKPguLLguKLguYDguJTg',
  'uLfguK3guJkgwrcgJyArIHllYXJMYWJlbCwKICAgICAgJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICc8dGg+4LmA4LiU4Li34Lit4LiZPC90aD48dGggY2xhc3M9Im51bSI+4Lij4Liy4Lii4Lij4Lix4LiaPC90',
  'aD48dGggY2xhc3M9Im51bSI+4Lij4Liy4Lii4LiI4LmI4Liy4LiiPC90aD48dGggY2xhc3M9Im51bSI+4LiE4LiH4LmA4Lir4Lil4Li34LitPC90aD4nICsKICAgICAgJzx0aCBzdHlsZT0id2lkdGg6MzglIj7guYDguJfguLXguKLguJrguKPguLLguKLguKPguLHg',
  'uJogLyDguKPguLLguKLguIjguYjguLLguKI8L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgIGQuYnlNb250aC5tYXAoZnVuY3Rpb24obSl7CiAgICAgICAgdmFyIGJsYW5rID0gIW0uaW5jb21lICYmICFtLmV4cGVuc2U7CiAgICAgICAgcmV0dXJuICc8',
  'dHInICsgKGJsYW5rID8gJyBzdHlsZT0ib3BhY2l0eTouNDUiJyA6ICcnKSArICc+JyArCiAgICAgICAgICAnPHRkPjxiPicgKyBtLmxhYmVsICsgJzwvYj48L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKG0uaW5jb21lID8gbW9uZXkobS5p',
  'bmNvbWUpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAobS5leHBlbnNlID8gbW9uZXkobS5leHBlbnNlKSA6ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj48YiBzdHlsZT0iY29s',
  'b3I6JyArIChtLm5ldCA+PSAwID8gJ3ZhcigtLW9rKScgOiAndmFyKC0tZGFuZ2VyKScpICsgJyI+JyArCiAgICAgICAgICAgIChibGFuayA/ICfigJMnIDogbW9uZXkobS5uZXQpKSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICc8dGQ+JyArCiAgICAgICAgICAg',
  'ICc8ZGl2IGNsYXNzPSJiYXItdHJhY2sgbWI4Ij48ZGl2IGNsYXNzPSJiYXItZmlsbCIgc3R5bGU9IndpZHRoOicgKyAobS5pbmNvbWUvbWF4QmFyKjEwMCkgKyAnJTtiYWNrZ3JvdW5kOnZhcigtLW9rKSI+PC9kaXY+PC9kaXY+JyArCiAgICAgICAgICAgICc8ZGl2',
  'IGNsYXNzPSJiYXItdHJhY2siPjxkaXYgY2xhc3M9ImJhci1maWxsIiBzdHlsZT0id2lkdGg6JyArIChtLmV4cGVuc2UvbWF4QmFyKjEwMCkgKyAnJTtiYWNrZ3JvdW5kOnZhcigtLWRhbmdlcikiPjwvZGl2PjwvZGl2PicgKwogICAgICAgICAgJzwvdGQ+PC90cj4n',
  'OwogICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JywgJycsIHRydWUpOwoKICAgIHZhciBieUtpbmQgPSBjYXJkKCfwn6e+IOC5geC4ouC4geC4leC4suC4oeC4o+C4suC4ouC4geC4suC4oyDCtyAnICsgeWVhckxhYmVsLAogICAgICBi',
  'YXJDaGFydChkLmJ5S2luZC5tYXAoZnVuY3Rpb24oayl7IHJldHVybiB7IGxhYmVsOiBrLmtpbmQgKyAnICgnICsgay5jb3VudCArICcpJywgdG90YWw6IGsudG90YWwgfTsgfSksCiAgICAgICAgICAgICAgICdsYWJlbCcsICd0b3RhbCcsIGZ1bmN0aW9uKGkpeyBy',
  'ZXR1cm4gbW9uZXkoaS50b3RhbCkgKyAnIOC4vyc7IH0pKTsKCiAgICB2YXIgYnlZZWFyID0gY2FyZCgn8J+TiiDguYDguJfguLXguKLguJrguKPguLLguKLguJvguLUnLAogICAgICBkLmJ5WWVhci5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFz',
  'cz0idCIgc3R5bGU9Im1pbi13aWR0aDphdXRvIj48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4Lib4Li1PC90aD48dGggY2xhc3M9Im51bSI+4Lij4Liy4Lii4Lij4Lix4LiaPC90aD48dGggY2xhc3M9Im51bSI+4Lij4Liy4Lii4LiI4LmI4Liy4LiiPC90aD48',
  'dGggY2xhc3M9Im51bSI+4LiE4LiH4LmA4Lir4Lil4Li34LitPC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIGQuYnlZZWFyLm1hcChmdW5jdGlvbih5KXsKICAgICAgICAgIHJldHVybiAnPHRyIG9uY2xpY2s9InNldFllYXJGcm9tVGFibGUoJyAr',
  'IHkueWVhciArICcpIiBzdHlsZT0iY3Vyc29yOnBvaW50ZXIiPicgKwogICAgICAgICAgICAnPHRkPjxiPicgKyB5LnllYXIgKyAnPC9iPiA8c3BhbiBjbGFzcz0iZmFpbnQgZnMxMiI+LyAnICsgKHkueWVhcis1NDMpICsgJzwvc3Bhbj48L3RkPicgKwogICAgICAg',
  'ICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyBtb25leSh5LmluY29tZSkgKyAnPC90ZD48dGQgY2xhc3M9Im51bSI+JyArIG1vbmV5KHkuZXhwZW5zZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj48YiBzdHlsZT0iY29sb3I6JyArICh5',
  'Lm5ldD49MD8ndmFyKC0tb2spJzondmFyKC0tZGFuZ2VyKScpICsgJyI+JyArIG1vbmV5KHkubmV0KSArICc8L2I+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4',
  'ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4guC5ieC4reC4oeC4ueC4pTwvZGl2PicsICcnLCB0cnVlKTsKCiAgICB2YXIga2luZHMgPSAnPGRpdiBjbGFzcz0iY2hpcHMgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJjaGlwICcgKyAoIVMucGFyYW1zLmtp',
  'bmQ/J29uJzonJykgKyAnIiBvbmNsaWNrPSJzZXRQYXJhbShcJ2tpbmRcJyxcJ1wnKSI+4LiX4Li44LiB4Lij4Liy4Lii4LiB4Liy4LijPC9idXR0b24+JyArCiAgICAgIGQuYnlLaW5kLm1hcChmdW5jdGlvbihrKXsKICAgICAgICByZXR1cm4gJzxidXR0b24gY2xh',
  'c3M9ImNoaXAgJyArIChTLnBhcmFtcy5raW5kPT09ay5raW5kPydvbic6JycpICsgJyIgb25jbGljaz0ic2V0UGFyYW0oXCdraW5kXCcsXCcnICsgZXNjKGsua2luZCkgKyAnXCcpIj4nICsKICAgICAgICAgICAgICAgZXNjKGsua2luZCkgKyAnICgnICsgay5jb3Vu',
  'dCArICcpPC9idXR0b24+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKCiAgICB2YXIgcm93cyA9IGQuaXRlbXM7CiAgICB2YXIgbGlzdCA9IGNhcmQoJ/Cfk5Ig4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Lix4LmJ4LiH4Lir4Lih4LiUIMK3ICcgKyB5ZWFy',
  'TGFiZWwgKyAnICgnICsgcm93cy5sZW5ndGggKyAnKScsCiAgICAgIHJvd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guKfguLHguJnguJfguLXguYg8L3RoPjx0aD7guKPguLLg',
  'uKLguIHguLLguKM8L3RoPjx0aCBjbGFzcz0ibnVtIj7guIjguLPguJnguKfguJnguYDguIfguLTguJk8L3RoPjx0aD7guKPguK3guJrguJrguLTguKU8L3RoPjx0aD7guIrguYjguK3guIfguJfguLLguIc8L3RoPicgKwogICAgICAgICc8dGg+4Liq4Lil4Li04Lib',
  'PC90aD48dGg+4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4PC90aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIHJvd3MubWFwKGZ1bmN0aW9uKHgpewogICAgICAgICAgdmFyIGluYyA9IHguZmxvdyA9PT0gJ+C4o+C4suC4ouC4o+C4seC4',
  'mic7CiAgICAgICAgICByZXR1cm4gJzx0cj4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyB0aERhdGUoeC5kYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPjxiPicgKyBlc2MoeC5raW5kKSArICc8L2I+ICcgKyAoaW5j',
  'ID8gJzxzcGFuIGNsYXNzPSJiIG9rIj7guKPguLLguKLguKPguLHguJo8L3NwYW4+JyA6ICc8c3BhbiBjbGFzcz0iYiBtdXRlIj7guKPguLLguKLguIjguYjguLLguKI8L3NwYW4+JykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj48YiBz',
  'dHlsZT0iY29sb3I6JyArIChpbmM/J3ZhcigtLW9rKSc6J3ZhcigtLWluayknKSArICciPicgKyAoaW5jPycrJzon4oiSJykgKyBtb25leSh4LmFtb3VudCwgMikgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MoeC5i',
  'aWxsTW9udGggfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MoeC5jaGFubmVsIHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHguc2xpcFJlZnMpICsgJzwv',
  'dGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIgbXV0ZWQgY2xpcCI+JyArIGVzYyh4Lm5vdGUgfHwgJycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBj',
  'bGFzcz0iYnRuIHNtIGljb24iIG9uY2xpY2s9XCdmb3JtRmluYW5jZSgnICsgYXR0cih4KSArICcpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIGRnciIgb25jbGljaz0iZGVsRmluYW5jZShcJycg',
  'KyB4LmlkICsgJ1wnKSI+8J+XkTwvYnV0dG9uPicgKwogICAgICAgICAgICAnPC9kaXY+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgOiBlbXB0eUJveCgn4Lii4Lix4LiH4LmE4Lih4LmI4Lih',
  '4Li14Lij4Liy4Lii4LiB4Liy4Lij4LmD4LiZJyArIHllYXJMYWJlbCwgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZvcm1GaW5hbmNlKG51bGwpIj4rIOC4muC4seC4meC4l+C4tuC4geC4o+C4suC4ouC4geC4suC4ozwvYnV0dG9uPicpLAogICAg',
  'ICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSBzbSIgb25jbGljaz0iZm9ybUZpbmFuY2UobnVsbCkiPisg4Lia4Lix4LiZ4LiX4Li24LiB4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4ojwvYnV0dG9uPicsIHRydWUpOwoKICAgIHJldHVybiBo',
  'ZWFkICsgbW9udGhseSArICc8ZGl2IGNsYXNzPSJncmlkIGcyIG10MTIgbWIxMiI+JyArIGJ5S2luZCArIGJ5WWVhciArICc8L2Rpdj4nICsga2luZHMgKyBsaXN0OwogIH0KfTsKCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PQogICA5KSDguKPguLLguKLguIfguLLguJkgJiDguKrguLPguKPguK3guIfguILguYnguK3guKHguLnguKUKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRF',
  'Uy5yZXBvcnRzID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7CiAgICByZXR1cm4gUHJvbWlzZS5hbGwoWwogICAgICBjYWxsQXBpKCdyZXBvcnQuY29zdFBlclJvb20nLCB7IHllYXI6IFMueWVhciB9KSwKICAgICAgY2FsbEFwaSgncmVwb3J0LnVwY29taW5nJywgeyBk',
  'YXlzOiA5MCB9KSwKICAgICAgY2FsbEFwaSgnYmFja3VwLnNoZWV0cycsIHt9KSwKICAgICAgY2FsbEFwaSgnc2hhcmUubGlua3MnLCB7fSkuY2F0Y2goZnVuY3Rpb24oKXsgcmV0dXJuIHt9OyB9KSwKICAgICAgY2FsbEFwaSgnYmFja3VwLmhpc3RvcnknLCB7fSku',
  'Y2F0Y2goZnVuY3Rpb24oKXsgcmV0dXJuIFtdOyB9KQogICAgXSkudGhlbihmdW5jdGlvbihyKXsKICAgICAgcmV0dXJuIHsgY29zdDogclswXSwgdXBjb21pbmc6IHJbMV0sIHNoZWV0czogclsyXSwgbGlua3M6IHJbM10gfHwge30sIGJhY2t1cHM6IHJbNF0gfHwg',
  'W10sIHllYXJzOiBbXSB9OwogICAgfSk7CiAgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKICAgIHZhciBjID0gZC5jb3N0',
  'OwogICAgdmFyIHRvcCA9IGMucm9vbXMuZmlsdGVyKGZ1bmN0aW9uKHIpeyByZXR1cm4gci50b3RhbCA+IDA7IH0pOwogICAgdmFyIG1heENvc3QgPSB0b3AubGVuZ3RoID8gdG9wWzBdLnRvdGFsIDogMTsKCiAgICB2YXIgdXBjb21pbmcgPSBjYXJkKCfwn5eT77iP',
  'IOC4m+C4j+C4tOC4l+C4tOC4meC4h+C4suC4meC4l+C4teC5iOC4geC4s+C4peC4seC4h+C4iOC4sOC4luC4tuC4hyAoOTAg4Lin4Lix4LiZKSDCtyAnICsgZC51cGNvbWluZy5sZW5ndGggKyAnIOC4h+C4suC4mScsCiAgICAgIGQudXBjb21pbmcubGVuZ3RoID8g',
  'JzxkaXYgY2xhc3M9ImFsaXN0Ij4nICsgZC51cGNvbWluZy5tYXAoZnVuY3Rpb24odSl7CiAgICAgICAgdmFyIGx2bCA9IHUuZGF5c0xlZnQgPCAwID8gJ2RhbmdlcicgOiAodS5kYXlzTGVmdCA8PSA3ID8gJ3dhcm4nIDogJ2luZm8nKTsKICAgICAgICByZXR1cm4g',
  'JzxkaXYgY2xhc3M9ImFsaSBsLScgKyBsdmwgKyAnIiBvbmNsaWNrPSJnbyhcJycgKyBqdW1wUGFnZSh1Lm1vZHVsZSkgKyAnXCcpIj4nICsKICAgICAgICAgICc8ZGl2IGNsYXNzPSJpYyI+JyArIHUuaWNvbiArICc8L2Rpdj48ZGl2PicgKwogICAgICAgICAgJzxk',
  'aXYgY2xhc3M9InR0Ij4nICsgZXNjKHUudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAgJzxkaXYgY2xhc3M9ImRkIj4nICsgdGhEYXRlKHUuZGF0ZSkgKyAnIMK3ICcgKwogICAgICAgICAgICAodS5kYXlzTGVmdCA8IDAgPyAn4LmA4Lil4Lii4LiB4Liz4Lir',
  '4LiZ4LiUICcgKyAoLXUuZGF5c0xlZnQpICsgJyDguKfguLHguJknIDogKHUuZGF5c0xlZnQgPT09IDAgPyAn4Lin4Lix4LiZ4LiZ4Li14LmJJyA6ICfguK3guLXguIEgJyArIHUuZGF5c0xlZnQgKyAnIOC4p+C4seC4mScpKSArCiAgICAgICAgICAgICh1LmRldGFp',
  'bCA/ICcgwrcgJyArIGVzYyh1LmRldGFpbCkgOiAnJykgKyAnPC9kaXY+PC9kaXY+PC9kaXY+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JyA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj7wn4yk77iPPC9kaXY+4LmE4Lih4LmI4Lih',
  '4Li14LiH4Liy4LiZ4LiZ4Lix4LiU4Lir4Lih4Liy4Lii4LmD4LiZIDkwIOC4p+C4seC4meC4guC5ieC4suC4h+C4q+C4meC5ieC4sjwvZGl2PicsICcnLCB0cnVlKTsKCiAgICB2YXIgY29zdENhcmQgPSBjYXJkKCfwn4+377iPIOC4hOC5iOC4suC5g+C4iuC5ieC4',
  'iOC5iOC4suC4ouC4quC4sOC4quC4oeC4o+C4suC4ouC4q+C5ieC4reC4hyDCtyAnICsgeWVhckxhYmVsLAogICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMyBtYjEyIj4nICsKICAgICAgICBrcGkoJ+C4o+C4p+C4oeC4l+C4uOC4geC4q+C5ieC4reC4hycsIGJhaHQo',
  'Yy50b3RhbCksICcnKSArCiAgICAgICAga3BpKCfguYDguInguKXguLXguYjguKLguJXguYjguK3guKvguYnguK3guIcnLCBiYWh0KGMuYXZlcmFnZSksICcnKSArCiAgICAgICAga3BpKCfguKvguYnguK3guIfguJfguLXguYjguYPguIrguYnguIjguYjguLLguKLg',
  'uKrguLnguIfguKrguLjguJQnLCB0b3AubGVuZ3RoID8gKCfguKvguYnguK3guIcgJyArIHRvcFswXS5yb29tKSA6ICfigJMnLCB0b3AubGVuZ3RoID8gYmFodCh0b3BbMF0udG90YWwpIDogJycpICsKICAgICAgJzwvZGl2PicgKwogICAgICAodG9wLmxlbmd0aCA/',
  'ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0Ij48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4Lir4LmJ4Lit4LiHPC90aD48dGggY2xhc3M9Im51bSI+4LiH4Liy4LiZ4LiL4LmI4Lit4LihPC90aD48dGggY2xhc3M9Im51bSI+4LiE4LmI4Liy4LiL',
  '4LmI4Lit4LihPC90aD48dGggY2xhc3M9Im51bSI+4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMPC90aD4nICsKICAgICAgICAnPHRoIGNsYXNzPSJudW0iPuC4guC4reC4h+C5gOC4guC5ieC4suC4q+C5ieC4reC4hzwvdGg+PHRoIGNsYXNzPSJudW0iPuC4o+C4p+C4',
  'oTwvdGg+PHRoIHN0eWxlPSJ3aWR0aDoyNiUiPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICB0b3AubWFwKGZ1bmN0aW9uKHIpewogICAgICAgICAgcmV0dXJuICc8dHIgb25jbGljaz0ib3BlblJvb20oXCcnICsgci5yb29tICsgJ1wnKSIgc3R5',
  'bGU9ImN1cnNvcjpwb2ludGVyIj4nICsKICAgICAgICAgICAgJzx0ZD48Yj4nICsgci5yb29tICsgJzwvYj4gPHNwYW4gY2xhc3M9ImZhaW50IGZzMTIiPuC4iuC4seC5ieC4mSAnICsgci5mbG9vciArICc8L3NwYW4+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBj',
  'bGFzcz0ibnVtIj4nICsgci5qb2JzICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChyLnJlcGFpciA/IG1vbmV5KHIucmVwYWlyKSA6ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAo',
  'ci5hYyA/IG1vbmV5KHIuYWMpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChyLnB1cmNoYXNlID8gbW9uZXkoci5wdXJjaGFzZSkgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0i',
  'bnVtIj48Yj4nICsgbW9uZXkoci50b3RhbCkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0iYmFyLXRyYWNrIj48ZGl2IGNsYXNzPSJiYXItZmlsbCIgc3R5bGU9IndpZHRoOicgKyAoci50b3RhbC9tYXhDb3N0KjEwMCkgKyAnJSI+',
  'PC9kaXY+PC9kaXY+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4',
  'suC4ouC4l+C4teC5iOC4muC4seC4meC4l+C4tuC4geC5hOC4p+C5ieC4o+C4suC4ouC4q+C5ieC4reC4hzxkaXYgY2xhc3M9ImZzMTIgbXQ4Ij7guYPguKrguYggIuC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oiIg4LmD4LiZ4LiH4Liy4LiZ4LiL4LmI4Lit',
  '4LihL+C4peC5ieC4suC4h+C5geC4reC4o+C5jCDguKvguKPguLfguK3guKPguLDguJrguLjguKvguYnguK3guIfguYPguJnguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcg4LmB4Lil4LmJ4Lin4LiV4Lix4Lin4LmA4Lil4LiC4LiI4Liw4LiC',
  '4Li24LmJ4LiZ4LiX4Li14LmI4LiZ4Li14LmIPC9kaXY+PC9kaXY+JykpOwoKICAgIHZhciBiYWNrdXAgPSBjYXJkKCfwn5K+IOC4quC4s+C4o+C4reC4h+C5geC4peC4sOC4geC4ueC5ieC4hOC4t+C4meC4guC5ieC4reC4oeC4ueC4pScsCiAgICAgICc8cCBjbGFz',
  'cz0iZnMxMyBtdXRlZCI+4LiC4LmJ4Lit4Lih4Li54Lil4LiX4Lix4LmJ4LiH4Lir4Lih4LiU4Lit4Lii4Li54LmI4LmD4LiZ4Lij4Liw4Lia4Lia4LiZ4Li14LmJIOKAlCDguITguKfguKPguJTguLLguKfguJnguYzguYLguKvguKXguJTguKrguLPguKPguK3guIfg',
  'uYTguKfguYnguYDguJTguLfguK3guJnguKXguLDguITguKPguLHguYnguIcgJyArCiAgICAgICfguYTguJ/guKXguYwgSlNPTiDguJnguLPguIHguKXguLHguJrguYDguILguYnguLLguKPguLDguJrguJrguYTguJTguYkg4Liq4LmI4Lin4LiZIENTViDguYDguJvg',
  'uLTguJTguYPguJkgRXhjZWwg4Lir4Lij4Li34LitIEdvb2dsZSBTaGVldHMg4LmE4LiU4LmJ4LmA4Lil4LiiPC9wPicgKwogICAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPicgKwogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJkb0V4',
  'cG9ydEpzb24oKSI+4qyH77iPIOC4lOC4suC4p+C4meC5jOC5guC4q+C4peC4lOC4quC4s+C4o+C4reC4h+C4l+C4seC5ieC4h+C4q+C4oeC4lCAoSlNPTik8L2J1dHRvbj4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJkb0ltcG9ydEpz',
  'b24oKSI+4qyG77iPIOC4geC4ueC5ieC4hOC4t+C4meC4iOC4suC4geC5hOC4n+C4peC5jOC4quC4s+C4o+C4reC4hzwvYnV0dG9uPicgKwogICAgICAnPC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJm',
  'czEyIG11dGVkIG1iOCI+4Liq4LmI4LiH4Lit4Lit4LiB4LmA4Lib4LmH4LiZIENTViDguYHguKLguIHguJXguLLguKPguLLguIc8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImNoaXBzIj4nICsgZC5zaGVldHMubWFwKGZ1bmN0aW9uKG4pewogICAgICAgIHJl',
  'dHVybiAnPGJ1dHRvbiBjbGFzcz0iY2hpcCIgb25jbGljaz0iZG9FeHBvcnRDc3YoXCcnICsgZXNjKG4pICsgJ1wnKSI+JyArIGVzYyhzaGVldExhYmVsKG4pKSArICc8L2J1dHRvbj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nKTsKCiAgICB2YXIgc2hh',
  'cmUgPSAoY2FuRWRpdCgpICYmIGQubGlua3MgJiYgZC5saW5rcy52aWV3VXJsKSA/IGNhcmQoJ/CflJcg4Lil4Li04LiH4LiB4LmM4LmA4LiC4LmJ4Liy4LmD4LiK4LmJ4LiH4Liy4LiZJywKICAgICAgJzxkaXYgY2xhc3M9ImYgbWIxMiI+PGxhYmVsPvCflJEg4Lil',
  '4Li04LiH4LiB4LmM4LiC4Lit4LiH4LiE4Li44LiTICjguYHguIHguYnguYTguILguILguYnguK3guKHguLnguKXguYTguJTguYkg4oCUIOC4reC4ouC5iOC4suC4quC5iOC4h+C4leC5iOC4rSk8L2xhYmVsPicgKwogICAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIg',
  'cmVhZG9ubHkgdmFsdWU9IicgKyBlc2MoZC5saW5rcy5hZG1pblVybCkgKyAnIiBvbmNsaWNrPSJ0aGlzLnNlbGVjdCgpIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7wn5GAIOC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jCAo4LmA4Lib',
  '4Li04LiU4LiU4Li54LmE4LiU4LmJ4Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinIOKAlCDguKrguYjguIfguYPguKvguYnguYPguITguKPguIHguYfguYTguJTguYkpPC9sYWJlbD4nICsKICAgICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJzaGFyZVVy',
  'bCIgcmVhZG9ubHkgdmFsdWU9IicgKyBlc2MoZC5saW5rcy52aWV3VXJsKSArICciIG9uY2xpY2s9InRoaXMuc2VsZWN0KCkiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPicgKwogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBv',
  'bmNsaWNrPSJjb3B5U2hhcmUoKSI+8J+TiyDguITguLHguJTguKXguK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYw8L2J1dHRvbj4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIGRnciIgb25jbGljaz0iZG9Sb3RhdGVTaGFyZSgpIj7wn5SBIOC4',
  'reC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC5g+C4q+C4oeC5iDwvYnV0dG9uPicgKwogICAgICAnPC9kaXY+JyArCiAgICAgICc8cCBjbGFzcz0iZnMxMiBtdXRlZCBtdDEyIj7guITguJnguJfguLXguYjguYDguJvguLTguJTguKXguLTguIfguIHg',
  'uYzguYHguIrguKPguYzguIjguLDguYDguKvguYfguJnguILguYnguK3guKHguLnguKXguJfguLHguYnguIfguKvguKHguJTguYHguJrguJrguK3guYjguLLguJnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcgJyArCiAgICAgICfguYTguKHguYjguJXguYng',
  'uK3guIfguKHguLXguJrguLHguI3guIrguLUgR29vZ2xlIOC5geC4peC4sOC5hOC4oeC5iOC5gOC4q+C5h+C4mSBHb29nbGUgU2hlZXQg4LiC4Lit4LiH4LiE4Li44LiTIMK3ICcgKwogICAgICAn4LiW4LmJ4Liy4Lil4Li04LiH4LiB4LmM4Lir4Lil4Li44LiU4LmD',
  '4Lir4LmJ4LiB4LiUICLguK3guK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYzguYPguKvguKHguYgiIOC4peC4tOC4h+C4geC5jOC5gOC4lOC4tOC4oeC4iOC4sOC5g+C4iuC5ieC5hOC4oeC5iOC5hOC4lOC5ieC4l+C4seC4meC4l+C4tTwvcD4nKSA6ICcn',
  'OwoKICAgIHZhciBkcml2ZSA9IGNhbkVkaXQoKSA/IGNhcmQoJ+KYge+4jyDguKrguLPguKPguK3guIfguK3guLHguJXguYLguJnguKHguLHguJXguLTguYPguJkgR29vZ2xlIERyaXZlICgnICsgZC5iYWNrdXBzLmxlbmd0aCArICcg4LiK4Li44LiUKScsCiAgICAg',
  'ICc8cCBjbGFzcz0iZnMxMyBtdXRlZCI+4Lij4Liw4Lia4Lia4LmA4LiB4LmH4Lia4LmE4Lif4Lil4LmM4Liq4Liz4Lij4Lit4LiH4LmE4Lin4LmJ4LmD4LiZ4LmC4Lif4Lil4LmA4LiU4Lit4Lij4LmMICLguKrguLPguKPguK3guIfguILguYnguK3guKHguLnguKUi',
  'IOC4muC4meC5hOC4lOC4o+C4n+C5jOC4guC4reC4h+C4hOC4uOC4kyAnICsKICAgICAgJ+C4leC4seC5ieC4h+C5g+C4q+C5ieC4l+C4s+C4reC4seC4leC5guC4meC4oeC4seC4leC4tOC4l+C4uOC4geC4p+C4seC4meC5hOC4lOC5ieC4iOC4suC4geC5gOC4oeC4',
  'meC4ueC5g+C4meC4iuC4teC4lTwvcD4nICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBtdDEyIj48YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImRvQmFja3VwTm93KCkiPvCfkr4g4Liq4Liz4Lij4Lit4LiH4LmA4LiU4Li14LmL4Lii4Lin4LiZ4Li14LmJPC9i',
  'dXR0b24+PC9kaXY+JyArCiAgICAgIChkLmJhY2t1cHMubGVuZ3RoID8gJzxkaXYgY2xhc3M9ImhyIj48L2Rpdj48ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOmF1dG8iPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7g',
  'uYTguJ/guKXguYw8L3RoPjx0aD7guYDguKfguKXguLI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guILguJnguLLguJQ8L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgZC5iYWNrdXBzLnNsaWNlKDAsMTApLm1hcChmdW5jdGlvbihiKXsKICAgICAgICAg',
  'IHJldHVybiAnPHRyPjx0ZCBjbGFzcz0iZnMxMiI+PGEgaHJlZj0iJyArIGVzYyhiLnVybCkgKyAnIiB0YXJnZXQ9Il9ibGFuayI+JyArIGVzYyhiLm5hbWUpICsgJzwvYT48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKGIuYXQp',
  'ICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSBmczEyIj4nICsgTWF0aC5yb3VuZChiLnNpemUvMTAyNCkgKyAnIEtCPC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicgOiAnJykpIDog',
  'Jyc7CgogICAgcmV0dXJuIHVwY29taW5nICsgJzxkaXYgY2xhc3M9Im10MTIiPicgKyBjb3N0Q2FyZCArICc8L2Rpdj4nICsKICAgICAgICAgICAoc2hhcmUgPyAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIHNoYXJlICsgJzwvZGl2PicgOiAnJykgKwogICAgICAgICAg',
  'ICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgYmFja3VwICsgJzwvZGl2PicgKwogICAgICAgICAgIChkcml2ZSA/ICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgZHJpdmUgKyAnPC9kaXY+JyA6ICcnKTsKICB9Cn07CgpmdW5jdGlvbiBzaGVldExhYmVsKG4pewogIHJldHVy',
  'biAoewogICAgRGVidHM6J+C4geC5ieC4reC4meC4q+C4meC4teC5iScsIERlYnRQYXltZW50czon4Lij4Liy4Lii4LiB4Liy4Lij4LiK4Liz4Lij4Liw4Lir4LiZ4Li14LmJJywgUHVyY2hhc2VzOifguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3g',
  'uIcnLCBSb29tczon4LiX4Liw4LmA4Lia4Li14Lii4LiZ4Lir4LmJ4Lit4LiHJywKICAgIEFjU2VydmljZTon4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJywgUm9vbVJlcGFpcnM6J+C4i+C5iOC4reC4oeC5geC4i+C4oeC4q+C5ieC4reC4hycsIEJ1aWxkaW5nUmVw',
  'YWlyczon4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiBJywKICAgIFJvb21Bc3NldHM6J+C4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4meC4q+C5ieC4reC4hycsIEZpbmFuY2U6J+C4o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKInLCBT',
  'ZXR0aW5nczon4LiV4Lix4LmJ4LiH4LiE4LmI4LiyJywgQWN0aXZpdHlMb2c6J+C4m+C4o+C4sOC4p+C4seC4leC4tOC4geC4suC4o+C5geC4geC5ieC5hOC4gicKICB9KVtuXSB8fCBuOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT0KICAg4LiV4Lix4Lin4LiK4LmI4Lin4Lii4Lin4Liy4LiU4LiL4LmJ4LizIOC5hgogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCmZ1bmN0aW9uIGtw',
  'aShsYWJlbCwgdmFsdWUsIGNhcCwgY2xzKXsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImtwaSAnICsgKGNsc3x8JycpICsgJyI+JyArCiAgICAnPGRpdiBjbGFzcz0ibGJsIj4nICsgZXNjKGxhYmVsKSArICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJ2YWwiPicg',
  'KyB2YWx1ZSArICc8L2Rpdj4nICsKICAgIChjYXAgPyAnPGRpdiBjbGFzcz0iY2FwIj4nICsgY2FwICsgJzwvZGl2PicgOiAnJykgKyAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gY2FyZCh0aXRsZSwgYm9keSwgYWN0aW9ucywgZmx1c2gpewogIHJldHVybiAnPGRpdiBj',
  'bGFzcz0iY2FyZCI+JyArCiAgICAodGl0bGUgPyAnPGRpdiBjbGFzcz0iY2FyZC1oIj48aDM+JyArIHRpdGxlICsgJzwvaDM+JyArIChhY3Rpb25zID8gJzxkaXYgY2xhc3M9InNwIj4nICsgYWN0aW9ucyArICc8L2Rpdj4nIDogJycpICsgJzwvZGl2PicgOiAnJykg',
  'KwogICAgJzxkaXYgY2xhc3M9ImNhcmQtYicgKyAoZmx1c2ggPyAnIGZsdXNoJyA6ICcnKSArICciPicgKyBib2R5ICsgJzwvZGl2PjwvZGl2Pic7Cn0KCi8qKiDguKfguLLguJTguJzguLHguIfguKvguYnguK3guIfguYHguJrguYjguIfguJXguLLguKHguIrguLHg',
  'uYnguJkg4oCUIGRlY29yYXRlKHJvb20pIC0+IHtjbHMsIHN1Yiwgb25jbGlja30gKi8KZnVuY3Rpb24gcm9vbUZsb29ycyhyb29tcywgZGVjb3JhdGUpewogIHZhciBieUZsb29yID0ge307CiAgcm9vbXMuZm9yRWFjaChmdW5jdGlvbihyKXsKICAgIHZhciBmID0g',
  'ci5mbG9vciB8fCBOdW1iZXIoU3RyaW5nKHIucm9vbSkuY2hhckF0KDApKTsKICAgIChieUZsb29yW2ZdID0gYnlGbG9vcltmXSB8fCBbXSkucHVzaChyKTsKICB9KTsKICB2YXIgZmxvb3JzID0gT2JqZWN0LmtleXMoYnlGbG9vcikuc29ydCgpOwogIHJldHVybiAn',
  'PGRpdiBjbGFzcz0iZmxvb3JzIj4nICsgZmxvb3JzLm1hcChmdW5jdGlvbihmKXsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0iZmxvb3IiPjxkaXYgY2xhc3M9ImZsb29yLXRhZyI+PGI+JyArIGYgKyAnPC9iPuC4iuC4seC5ieC4mTwvZGl2PjxkaXYgY2xhc3M9InJv',
  'b21zIj4nICsKICAgICAgYnlGbG9vcltmXS5tYXAoZnVuY3Rpb24ocil7CiAgICAgICAgdmFyIGQgPSBkZWNvcmF0ZShyKTsKICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9InJvb20gJyArIGQuY2xzICsgJyIgb25jbGljaz0iJyArIGQub25jbGljayArICciPicg',
  'KwogICAgICAgICAgJzxzcGFuIGNsYXNzPSJkb3QiPjwvc3Bhbj48ZGl2IGNsYXNzPSJubyI+JyArIGVzYyhyLnJvb20pICsgJzwvZGl2PicgKwogICAgICAgICAgJzxkaXYgY2xhc3M9InN0Ij4nICsgZC5zdWIgKyAnPC9kaXY+PC9kaXY+JzsKICAgICAgfSkuam9p',
  'bignJykgKyAnPC9kaXY+PC9kaXY+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwp9CgovKiog4LmD4Liq4LmIIG9iamVjdCDguKXguIfguYPguJkgb25jbGljayBhdHRyaWJ1dGUg4LmE4LiU4LmJ4Lit4Lii4LmI4Liy4LiH4Lib4Lil4Lit4LiU4Lig4Lix4Lii',
  'ICovCmZ1bmN0aW9uIGF0dHIob2JqKXsKICB2YXIgY2xlYW4gPSB7fTsKICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goZnVuY3Rpb24oayl7CiAgICBpZiAoay5pbmRleE9mKCdfJykgPT09IDAgfHwgL1JlZnMkLy50ZXN0KGspIHx8IGsgPT09ICdyZWNvcmRzJyB8',
  'fCBrID09PSAnd2FycmFudHknKSByZXR1cm47CiAgICBjbGVhbltrXSA9IG9ialtrXTsKICB9KTsKICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoY2xlYW4pLnJlcGxhY2UoLyYvZywnJmFtcDsnKS5yZXBsYWNlKC8nL2csJyYjMzk7JykucmVwbGFjZSgvIi9nLCcmcXVv',
  'dDsnKTsKfQo8L3NjcmlwdD4KPHNjcmlwdD4KLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIFNldHRpbmdzLmh0bWwg4oCUIOC4q+C4meC5ieC4suC4leC4seC5ieC4h+C4hOC5iOC4siDCtyDguJjg',
  'uLXguKEgwrcg4Lia4Lix4LiN4LiK4Li14Lic4Li54LmJ4LmD4LiK4LmJIMK3IOC4reC4uOC4m+C4geC4o+C4k+C5jAogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCi8qIC0tLS0tLS0tLS0tLS0t',
  'LS0g4LiY4Li14Lih4Liq4Lin4LmI4Liy4LiHIC8g4Lih4Li34LiUIC0tLS0tLS0tLS0tLS0tLS0gKi8KCnZhciBMU19USEVNRSA9ICdtY29ybmVyLnRoZW1lJzsKdmFyIFRIRU1FUyA9IFsKICB7IGlkOiAn4LiV4Liy4Lih4LmA4LiE4Lij4Li34LmI4Lit4LiHJywg',
  'aWM6ICfwn4yXJywgaGludDogJ+C4quC4peC4seC4muC4leC4suC4oeC4geC4suC4o+C4leC4seC5ieC4h+C4hOC5iOC4suC4guC4reC4h+C4reC4uOC4m+C4geC4o+C4k+C5jCcgfSwKICB7IGlkOiAn4Liq4Lin4LmI4Liy4LiHJywgICAgICBpYzogJ+KYgO+4jycs',
  'IGhpbnQ6ICfguJ7guLfguYnguJnguILguLLguKcg4Lit4LmI4Liy4LiZ4LiH4LmI4Liy4Lii4LiB4Lil4Liy4LiH4LmB4LiU4LiUJyB9LAogIHsgaWQ6ICfguKHguLfguJQnLCAgICAgICAgaWM6ICfwn4yZJywgaGludDogJ+C4nuC4t+C5ieC4meC5gOC4guC5ieC4',
  'oSDguKrguJrguLLguKLguJXguLLguJXguK3guJnguIHguKXguLLguIfguITguLfguJknIH0KXTsKCi8qKgogKiDguJfguLLguJjguLXguKHguKXguIfguKvguJnguYnguLLguYDguKfguYfguJrguJfguLHguJnguJfguLUKICog4LiV4Lix4Lin4LmB4Lib4Lij4Liq',
  '4Li14LiX4Lix4LmJ4LiH4Lir4Lih4LiU4LiZ4Li04Lii4Liy4Lih4LmE4Lin4LmJIDMg4LiK4Lix4LmJ4LiZ4LmD4LiZIFN0eWxlLmh0bWwg4LmB4Lil4LmJ4LinIOC4leC4o+C4h+C4meC4teC5ieC5geC4hOC5iOC4leC4tOC4lOC4m+C5ieC4suC4ouC4muC4reC4',
  'geC4p+C5iOC4suC5g+C4iuC5ieC4iuC4seC5ieC4meC5hOC4q+C4mQogKi8KZnVuY3Rpb24gYXBwbHlUaGVtZShuYW1lKXsKICB2YXIgcm9vdCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDsKICBpZiAobmFtZSA9PT0gJ+C4quC4p+C5iOC4suC4hycpIHJvb3Qu',
  'c2V0QXR0cmlidXRlKCdkYXRhLXRoZW1lJywgJ2xpZ2h0Jyk7CiAgZWxzZSBpZiAobmFtZSA9PT0gJ+C4oeC4t+C4lCcpIHJvb3Quc2V0QXR0cmlidXRlKCdkYXRhLXRoZW1lJywgJ2RhcmsnKTsKICBlbHNlIHJvb3QucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXRoZW1l',
  'Jyk7ICAgICAgIC8vIOC4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hyA9IOC4m+C4peC5iOC4reC4ouC5g+C4q+C5iSBwcmVmZXJzLWNvbG9yLXNjaGVtZSDguJXguLHguJTguKrguLTguJkKICB2YXIgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Ro',
  'ZW1lQnRuJyk7CiAgaWYgKGJ0bikgewogICAgdmFyIHQgPSBUSEVNRVMuZmlsdGVyKGZ1bmN0aW9uKHgpeyByZXR1cm4geC5pZCA9PT0gbmFtZTsgfSlbMF0gfHwgVEhFTUVTWzBdOwogICAgYnRuLnRleHRDb250ZW50ID0gdC5pYzsKICAgIGJ0bi50aXRsZSA9ICfg',
  'uJjguLXguKE6ICcgKyB0LmlkICsgJyAo4LiB4LiU4LmA4Lie4Li34LmI4Lit4Liq4Lil4Lix4LiaKSc7CiAgfQp9CgpmdW5jdGlvbiBjdXJyZW50VGhlbWUoKXsKICByZXR1cm4gbHNHZXQoTFNfVEhFTUUpIHx8IChTLmJvb3QgJiYgUy5ib290LnNldHRpbmdzICYm',
  'IFMuYm9vdC5zZXR0aW5ncy50aGVtZSkgfHwgJ+C4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hyc7Cn0KCi8qKiDguJXguLHguYnguIfguJjguLXguKHguYHguKXguLDguIjguLPguYTguKfguYkg4oCUIOC4nOC4ueC5ieC4lOC4ueC5geC4peC4iOC4sOC4luC4',
  'ueC4geC4muC4seC4meC4l+C4tuC4geC5gOC4m+C5h+C4meC4hOC5iOC4suC4leC4seC5ieC4h+C4leC5ieC4meC4guC4reC4h+C4o+C4sOC4muC4muC4lOC5ieC4p+C4oiAqLwpmdW5jdGlvbiBzZXRUaGVtZShuYW1lLCBxdWlldCl7CiAgbHNTZXQoTFNfVEhFTUUs',
  'IG5hbWUpOwogIGFwcGx5VGhlbWUobmFtZSk7CiAgaWYgKFMuYm9vdCAmJiBTLmJvb3QuaXNBZG1pbikgewogICAgY2FsbEFwaSgnc2V0dGluZ3Muc2F2ZScsIHsgdmFsdWVzOiB7IHRoZW1lOiBuYW1lIH0gfSkuY2F0Y2goZnVuY3Rpb24oKXsgLyog4LmA4LiB4LmH',
  '4Lia4LmD4LiZ4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiB4LmH4Lie4LitICovIH0pOwogIH0KICBpZiAoIXF1aWV0KSB0b2FzdCgn4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LmA4Lib4LmH4LiZ4LiY4Li14LihJyArIChuYW1lID09PSAn4LiV4Liy4Lih4LmA4LiE4Lij',
  '4Li34LmI4Lit4LiHJyA/ICfguJXguLLguKHguYDguITguKPguLfguYjguK3guIcnIDogbmFtZSksICdvaycpOwogIGlmIChTLnBhZ2UgPT09ICdzZXR0aW5ncycpIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKfQoKLyoqIOC4m+C4uOC5iOC4oeC4muC4meC5geC4luC4',
  'muC4q+C4seC4pyDigJQg4Lin4LiZ4Liq4Lin4LmI4Liy4LiHIOKGkiDguKHguLfguJQg4oaSIOC4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hyAqLwpmdW5jdGlvbiBjeWNsZVRoZW1lKCl7CiAgdmFyIG9yZGVyID0gWyfguKrguKfguYjguLLguIcnLCAn4Lih',
  '4Li34LiUJywgJ+C4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hyddOwogIHZhciBpID0gb3JkZXIuaW5kZXhPZihjdXJyZW50VGhlbWUoKSk7CiAgc2V0VGhlbWUob3JkZXJbKGkgKyAxKSAlIG9yZGVyLmxlbmd0aF0pOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0t',
  'IOC4q+C4meC5ieC4suC4leC4seC5ieC4h+C4hOC5iOC4siAtLS0tLS0tLS0tLS0tLS0tICovCgpST1VURVMuc2V0dGluZ3MgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsKICAgIHJldHVybiBQcm9taXNlLmFsbChbCiAgICAgIGNhbGxBcGkoJ3NldHRpbmdzLmxpc3Qn',
  'LCB7fSksCiAgICAgIGNhbGxBcGkoJ2F1dGguZGV2aWNlcycsIHt9KS5jYXRjaChmdW5jdGlvbigpeyByZXR1cm4gW107IH0pLAogICAgICAoUy5ib290ICYmIFMuYm9vdC5pc0FkbWluKSA/IGNhbGxBcGkoJ3VzZXIubGlzdCcsIHt9KS5jYXRjaChmdW5jdGlvbigp',
  'eyByZXR1cm4gW107IH0pIDogUHJvbWlzZS5yZXNvbHZlKG51bGwpLAogICAgICAoUy5ib290ICYmIFMuYm9vdC5pc0FkbWluKSA/IGNhbGxBcGkoJ3NoYXJlLmxpbmtzJywge30pLmNhdGNoKGZ1bmN0aW9uKCl7IHJldHVybiB7fTsgfSkgOiBQcm9taXNlLnJlc29s',
  'dmUoe30pCiAgICBdKS50aGVuKGZ1bmN0aW9uKHIpewogICAgICByZXR1cm4geyBzZXR0aW5nczogclswXSwgZGV2aWNlczogclsxXSB8fCBbXSwgdXNlcnM6IHJbMl0sIGxpbmtzOiByWzNdIHx8IHt9LCB5ZWFyczogW10gfTsKICAgIH0pOwogIH0sCiAgcmVuZGVy',
  'OiBmdW5jdGlvbihkKXsKICAgIHJldHVybiAnJyArCiAgICAgIHNldHRpbmdzQWNjb3VudENhcmQoZCkgKwogICAgICBzZXR0aW5nc1RoZW1lQ2FyZCgpICsKICAgICAgKGQuc2V0dGluZ3MuY2FuRWRpdCA/IHNldHRpbmdzR3JvdXBzSHRtbChkLnNldHRpbmdzKSA6',
  'IHNldHRpbmdzUmVhZE9ubHlOb3RlKCkpICsKICAgICAgLy8g4LmA4LiJ4Lie4Liy4Liw4Lic4Li54LmJ4LiU4Li54LmB4Lil4LiX4Li14LmI4LmA4Lir4LmH4LiZ4Liq4Lit4LiH4Liq4LmI4Lin4LiZ4LiZ4Li14LmJIOKAlCDguJXguLHguKfguIHguLLguKPguYzg',
  'uJTguYDguJvguYfguJnguITguJnguJXguLHguJTguKrguLTguJnguYPguIjguYDguK3guIfguKfguYjguLLguIjguLDguYHguKrguJTguIfguK3guLDguYTguKMKICAgICAgLy8g4LmA4Lie4Lij4Liy4Liw4Lir4LiZ4LmJ4Liy4LiV4Lix4Lin4Lit4Lii4LmI4Liy',
  '4LiH4LmB4Lia4Lia4LmE4Lif4Lil4LmM4LmA4LiU4Li14Lii4Lin4LmE4Lih4LmI4Lih4Li14Lia4Lix4LiN4LiK4Li14Lic4Li54LmJ4LmD4LiK4LmJ4LmD4Lir4LmJ4LmB4Liq4LiU4LiHIOC5geC4leC5iOC4ouC4seC4h+C4reC4ouC4suC4geC4muC4reC4geC4',
  'nOC4ueC5ieC5g+C4iuC5ieC4p+C5iOC4suC4oeC4teC4reC4sOC5hOC4o+C4muC5ieC4suC4hwogICAgICAoaXNBZG1pbk5vdygpID8gc2V0dGluZ3NVc2Vyc0NhcmQoZC51c2VycykgKyBzZXR0aW5nc1NoYXJlQ2FyZChkLmxpbmtzKSA6ICcnKTsKICB9Cn07Cgov',
  'KiAtLS0tIOC4muC4seC4jeC4iuC4teC4guC4reC4h+C4ieC4seC4mSAtLS0tICovCgpmdW5jdGlvbiBzZXR0aW5nc0FjY291bnRDYXJkKGQpewogIHZhciBtZSA9IEFVVEgubWUgfHwge307CiAgdmFyIGRldmljZXMgPSBkLmRldmljZXMgfHwgW107CiAgcmV0dXJu',
  'IGNhcmQoJ/CfkaQg4Lia4Lix4LiN4LiK4Li14LiC4Lit4LiH4LiJ4Lix4LiZJywKICAgICc8ZGl2IGNsYXNzPSJncmlkIGcyIG1iMTIiPicgKwogICAgICBrcGkoJ+C5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4meC5g+C4meC4iuC4t+C5iOC4rScsIGVzYyht',
  'ZS5uYW1lIHx8IG1lLnVzZXJuYW1lIHx8ICfigJMnKSwgZXNjKG1lLnVzZXJuYW1lID8gJ0AnICsgbWUudXNlcm5hbWUgOiAobWUudmlhIHx8ICcnKSkpICsKICAgICAga3BpKCfguKrguLTguJfguJjguLTguYzguIHguLLguKPguYPguIrguYnguIfguLLguJknLCBl',
  'c2MobWUucm9sZSB8fCAn4oCTJyksCiAgICAgICAgICBtZS5jYW5FZGl0ID8gJ+C5gOC4nuC4tOC5iOC4oSDguYHguIHguYnguYTguIIg4LmB4Lil4Liw4Lil4Lia4LiC4LmJ4Lit4Lih4Li54Lil4LmE4LiU4LmJJyA6ICfguYDguJvguLTguJTguJTguLnguYTguJTg',
  'uYnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcnKSArCiAgICAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0icm93Ij4nICsKICAgICAgKG1lLnVzZXJuYW1lID8gJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iZm9ybUNoYW5nZVBhc3N3b3JkKCki',
  'PvCflJEg4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZPC9idXR0b24+JyA6ICcnKSArCiAgICAgIChtZS51c2VybmFtZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImZvcm1TZXRQaW4oKSI+8J+UoiAnICsKICAgICAg',
  'ICAoQVVUSC5kZXZpY2UgPyAn4LiV4Lix4LmJ4LiHIFBJTiDguYPguKvguKHguYjguJrguJnguYDguITguKPguLfguYjguK3guIfguJnguLXguYknIDogJ+C4leC4seC5ieC4hyBQSU4g4Liq4Liz4Lir4Lij4Lix4Lia4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li1',
  '4LmJJykgKyAnPC9idXR0b24+JyA6ICcnKSArCiAgICAgIChBVVRILmRldmljZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4gZGdyIiBvbmNsaWNrPSJmb3JnZXRUaGlzRGV2aWNlKCkiPuC4peC4miBQSU4g4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJPC9idXR0',
  'b24+JyA6ICcnKSArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNvbmZpcm1Mb2dvdXQoKSI+8J+aqiDguK3guK3guIHguIjguLLguIHguKPguLDguJrguJo8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nICsKICAgIChkZXZpY2VzLmxlbmd0aAog',
  'ICAgICA/ICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+PGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtYjgiPuC4reC4uOC4m+C4geC4o+C4k+C5jOC4l+C4teC5iOC4leC4seC5ieC4hyBQSU4g4LmE4Lin4LmJICgnICsgZGV2aWNlcy5sZW5ndGggKyAnKTwvZGl2PicgKwog',
  'ICAgICAgICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOmF1dG8iPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guK3guLjguJvguIHguKPguJPguYw8L3RoPjx0aD7guJXguLHguYnguIfguYDguKHguLfguYjguK08',
  'L3RoPjx0aD7guYPguIrguYnguKXguYjguLLguKrguLjguJQ8L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgZGV2aWNlcy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgICAgICByZXR1cm4gJzx0cj48dGQ+JyArIGVzYyh4LmRldmljZSkgKyAnPC90ZD4n',
  'ICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIHRoRGF0ZVNob3J0KFN0cmluZyh4LmNyZWF0ZWRBdCkuc2xpY2UoMCwxMCkpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyB0aERhdGVTaG9ydChTdHJpbmcoeC5s',
  'YXN0U2Vlbikuc2xpY2UoMCwxMCkpICsgJzwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPjxidXR0b24gY2xhc3M9ImJ0biBkZ3Igc20iIG9uY2xp',
  'Y2s9ImRvRm9yZ2V0QWxsRGV2aWNlcygpIj7guKLguIHguYDguKXguLTguIEgUElOIOC4l+C4uOC4geC5gOC4hOC4o+C4t+C5iOC4reC4hzwvYnV0dG9uPjwvZGl2PicKICAgICAgOiAnJykpOwp9CgpmdW5jdGlvbiBkb0ZvcmdldEFsbERldmljZXMoKXsKICBjb25m',
  'aXJtQWN0aW9uKCfguKLguIHguYDguKXguLTguIEgUElOIOC4muC4meC4l+C4uOC4geC5gOC4hOC4o+C4t+C5iOC4reC4h+C5g+C4iuC5iOC5hOC4q+C4oSDigJQg4LiX4Li44LiB4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiI4Liw4LiV4LmJ4Lit4LiH4Lil4LmH4Lit',
  '4LiB4Lit4Li04LiZ4LiU4LmJ4Lin4Lii4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmIJywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2F1dGguZm9yZ2V0QWxsRGV2aWNlcycsIHt9KS50aGVuKGZ1bmN0aW9uKG4pewogICAgICBzYXZlRGV2aWNl',
  'KCcnKTsKICAgICAgdG9hc3QoJ+C4ouC4geC5gOC4peC4tOC4gSBQSU4g4LmB4Lil4LmJ4LinICcgKyBuICsgJyDguYDguITguKPguLfguYjguK3guIcnLCAnb2snKTsKICAgICAgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7',
  'IHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7IH0pOwogIH0pOwp9CgovKiAtLS0tIOC4mOC4teC4oSAtLS0tICovCgpmdW5jdGlvbiBzZXR0aW5nc1RoZW1lQ2FyZCgpewogIHZhciBjdXIgPSBjdXJyZW50VGhlbWUoKTsKICByZXR1cm4gY2FyZCgn8J+OqCDg',
  'uJjguLXguKHguKrguLXguKvguJnguYnguLLguIjguK0nLAogICAgJzxkaXYgY2xhc3M9InRoZW1lLXBpY2siPicgKyBUSEVNRVMubWFwKGZ1bmN0aW9uKHQpewogICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9InRoZW1lLW9wdCcgKyAodC5pZCA9PT0gY3VyID8g',
  'JyBvbicgOiAnJykgKyAnIiBvbmNsaWNrPSJzZXRUaGVtZShcJycgKyB0LmlkICsgJ1wnKSI+JyArCiAgICAgICAgJzxzcGFuIGNsYXNzPSJpYyI+JyArIHQuaWMgKyAnPC9zcGFuPicgKwogICAgICAgICc8Yj4nICsgZXNjKHQuaWQpICsgJzwvYj4nICsKICAgICAg',
  'ICAnPHNwYW4gY2xhc3M9ImhpbnQiPicgKyBlc2ModC5oaW50KSArICc8L3NwYW4+JyArCiAgICAgICc8L2J1dHRvbj4nOwogICAgfSkuam9pbignJykgKyAnPC9kaXY+JyArCiAgICAnPHAgY2xhc3M9ImZzMTIgbXV0ZWQgbXQxMiI+4LiY4Li14Lih4LiI4Liz4LmB',
  '4Lii4LiB4Lij4Liy4Lii4LmA4LiE4Lij4Li34LmI4Lit4LiHIOC5gOC4m+C4peC4teC5iOC4ouC4meC4l+C4teC5iOC4meC4teC5iOC4q+C4o+C4t+C4reC4geC4lOC4m+C4uOC5iOC4oeC4o+C4ueC4m+C4nuC4o+C4sOC4reC4suC4l+C4tOC4leC4ouC5jC/guJ7g',
  'uKPguLDguIjguLHguJnguJfguKPguYzguKHguLjguKHguILguKfguLLguJrguJnguIHguYfguYTguJTguYknICsKICAgIChTLmJvb3QgJiYgUy5ib290LmlzQWRtaW4gPyAnIMK3IOC4hOC5iOC4suC4l+C4teC5iOC4nOC4ueC5ieC4lOC4ueC5geC4peC5gOC4peC4',
  't+C4reC4geC4iOC4sOC5gOC4m+C5h+C4meC4hOC5iOC4suC4leC4seC5ieC4h+C4leC5ieC4meC5g+C4q+C5ieC5gOC4hOC4o+C4t+C5iOC4reC4h+C4l+C4teC5iOC4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4leC4seC5ieC4hycgOiAnJykgKyAnPC9wPicp',
  'Owp9CgovKiAtLS0tIOC4geC4peC4uOC5iOC4oeC4hOC5iOC4suC4leC4seC5ieC4h+C4hOC5iOC4siAtLS0tICovCgpmdW5jdGlvbiBzZXR0aW5nc1JlYWRPbmx5Tm90ZSgpewogIHJldHVybiBjYXJkKCfimpnvuI8g4LiB4Liy4Lij4LiV4Lix4LmJ4LiH4LiE4LmI',
  '4Liy4Lij4Liw4Lia4LiaJywKICAgICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj7wn5SSPC9kaXY+4LmA4LiJ4Lie4Liy4Liw4Lic4Li54LmJ4LiU4Li54LmB4Lil4LmA4LiX4LmI4Liy4LiZ4Lix4LmJ4LiZ4LiX4Li14LmI4LmB4LiB4LmJ4LiB',
  '4Liy4Lij4LiV4Lix4LmJ4LiH4LiE4LmI4Liy4Lij4Liw4Lia4Lia4LmE4LiU4LmJPC9kaXY+Jyk7Cn0KCmZ1bmN0aW9uIHNldHRpbmdzR3JvdXBzSHRtbChzKXsKICByZXR1cm4gcy5ncm91cHMubWFwKGZ1bmN0aW9uKGcpewogICAgcmV0dXJuIGNhcmQoZy5pY29u',
  'ICsgJyAnICsgZy5ncm91cCwKICAgICAgJzxkaXYgY2xhc3M9ImZncmlkIj4nICsgZy5pdGVtcy5tYXAoc2V0dGluZ0ZpZWxkSHRtbCkuam9pbignJykgKyAnPC9kaXY+Jyk7CiAgfSkuam9pbignJykgKwogIGNhcmQoJ/Cfkr4g4Lia4Lix4LiZ4LiX4Li24LiB4LiB',
  '4Liy4Lij4LiV4Lix4LmJ4LiH4LiE4LmI4LiyJywKICAgICc8cCBjbGFzcz0iZnMxMyBtdXRlZCI+JyArIGVzYyhzLnNlY3JldE5vdGUpICsgJzwvcD4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJp',
  'IiBvbmNsaWNrPSJzYXZlU2V0dGluZ3NGb3JtKCkiPuC4muC4seC4meC4l+C4tuC4geC4l+C4seC5ieC4h+C4q+C4oeC4lDwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJsb2FkKCkiPuC4ouC4geC5gOC4peC4tOC4geC4geC4',
  'suC4o+C5geC4geC5ieC5hOC4gjwvYnV0dG9uPicgKwogICAgJzwvZGl2PicpOwp9CgpmdW5jdGlvbiBzZXR0aW5nRmllbGRIdG1sKGl0KXsKICB2YXIgaWQgPSAnc18nICsgaXQua2V5OwogIHZhciBpbm5lcjsKICBpZiAoaXQucmVhZE9ubHkpIHsKICAgIGlubmVy',
  'ID0gJzxkaXYgY2xhc3M9ImlucCIgc3R5bGU9ImJhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKTtjdXJzb3I6ZGVmYXVsdCI+JyArIGVzYyhpdC52YWx1ZSkgKyAnPC9kaXY+JzsKICB9IGVsc2UgaWYgKGl0LnR5cGUgPT09ICdzZWxlY3QnKSB7CiAgICAvLyDguJ3g',
  'uLHguYjguIfguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYzguKrguYjguIfguKHguLLguYDguJvguYfguJkge3ZhbHVlLGxhYmVsfSDguYDguKrguKHguK0g4oCUIOC4hOC5iOC4suC4l+C4teC5iOC5gOC4geC5h+C4muC4geC4seC4muC4guC5ieC4reC4',
  'hOC4p+C4suC4oeC4l+C4teC5iOC5gOC4q+C5h+C4meC4reC4suC4iOC4hOC4meC4peC4sOC4reC4seC4mQogICAgaW5uZXIgPSAnPHNlbGVjdCBjbGFzcz0ic2VsIiBpZD0iJyArIGlkICsgJyI+JyArIChpdC5vcHRpb25zIHx8IFtdKS5tYXAoZnVuY3Rpb24obyl7',
  'CiAgICAgIHJldHVybiAnPG9wdGlvbiB2YWx1ZT0iJyArIGVzYyhvLnZhbHVlKSArICciJyArIChvLnZhbHVlID09PSBpdC52YWx1ZSA/ICcgc2VsZWN0ZWQnIDogJycpICsKICAgICAgICAgICAgICc+JyArIGVzYyhvLmxhYmVsKSArICc8L29wdGlvbj4nOwogICAg',
  'fSkuam9pbignJykgKyAnPC9zZWxlY3Q+JzsKICB9IGVsc2UgaWYgKGl0LnR5cGUgPT09ICdtdWx0aWxpbmUnKSB7CiAgICBpbm5lciA9ICc8dGV4dGFyZWEgY2xhc3M9InRhIiBpZD0iJyArIGlkICsgJyI+JyArIGVzYyhpdC52YWx1ZSkgKyAnPC90ZXh0YXJlYT4n',
  'OwogIH0gZWxzZSBpZiAoaXQudHlwZSA9PT0gJ251bWJlcicpIHsKICAgIGlubmVyID0gJzxpbnB1dCB0eXBlPSJudW1iZXIiIGNsYXNzPSJpbnAiIGlkPSInICsgaWQgKyAnIiB2YWx1ZT0iJyArIGVzYyhpdC52YWx1ZSkgKyAnIiBpbnB1dG1vZGU9ImRlY2ltYWwi',
  'Pic7CiAgfSBlbHNlIHsKICAgIGlubmVyID0gJzxpbnB1dCB0eXBlPSJ0ZXh0IiBjbGFzcz0iaW5wIiBpZD0iJyArIGlkICsgJyIgdmFsdWU9IicgKyBlc2MoaXQudmFsdWUpICsgJyI+JzsKICB9CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJmJyArIChpdC50eXBlID09',
  'PSAnbXVsdGlsaW5lJyA/ICcgZnVsbCcgOiAnJykgKyAnIj4nICsKICAgICc8bGFiZWwgZm9yPSInICsgaWQgKyAnIj4nICsgZXNjKGl0LmxhYmVsKSArICc8L2xhYmVsPicgKyBpbm5lciArCiAgICAoaXQubm90ZSA/ICc8ZGl2IGNsYXNzPSJoaW50Ij4nICsgZXNj',
  'KGl0Lm5vdGUpICsgJzwvZGl2PicgOiAnJykgKyAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gc2F2ZVNldHRpbmdzRm9ybSgpewogIHZhciB2YWxzID0ge307CiAgdmFyIGRhdGEgPSBTLmNhY2hlLnNldHRpbmdzOwogIGlmICghZGF0YSkgcmV0dXJuOwogIGRhdGEuc2V0',
  'dGluZ3MuZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24oZyl7CiAgICBnLml0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXQpewogICAgICBpZiAoaXQucmVhZE9ubHkpIHJldHVybjsKICAgICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NfJyArIGl0Lmtl',
  'eSk7CiAgICAgIGlmIChlbCkgdmFsc1tpdC5rZXldID0gZWwudmFsdWU7CiAgICB9KTsKICB9KTsKICBjYWxsQXBpKCdzZXR0aW5ncy5zYXZlJywgeyB2YWx1ZXM6IHZhbHMgfSkudGhlbihmdW5jdGlvbihyKXsKICAgIGlmICh2YWxzLnRoZW1lKSB7IGxzU2V0KExT',
  'X1RIRU1FLCB2YWxzLnRoZW1lKTsgYXBwbHlUaGVtZSh2YWxzLnRoZW1lKTsgfQogICAgdG9hc3Qoci5zYXZlZCA/ICfguJrguLHguJnguJfguLbguIHguYHguKXguYnguKcgJyArIHIuc2F2ZWQgKyAnIOC4o+C4suC4ouC4geC4suC4oycgOiAn4LmE4Lih4LmI4Lih',
  '4Li14Lit4Liw4LmE4Lij4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LmB4Lib4Lil4LiHJywgJ29rJyk7CiAgICAvLyDguITguYjguLLguJrguLLguIfguJXguLHguKcgKOC4o+C4reC4muC4o+C4teC5gOC4n+C4o+C4iiDguIrguLfguYjguK3guK3guLLguITguLLguKMp',
  'IOC4oeC4teC4nOC4peC4geC4seC4muC4l+C4seC5ieC4h+C4q+C4meC5ieC4siDguIjguLbguIfguYLguKvguKXguJTguYPguKvguKHguYjguJfguLHguYnguIfguIrguLjguJQKICAgIHJldHVybiBjYWxsQXBpKCdhcHAuYm9vdHN0cmFwJykudGhlbihmdW5jdGlv',
  'bihiKXsgUy5ib290ID0gYjsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9KTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlIHx8IGUsICdlcnInKTsgfSk7Cn0KCi8qIC0tLS0g4LiI4Lix4LiU4LiB4Liy4Lij4Lic4Li54LmJ4LmD4LiK4LmJ',
  'ICjguJzguLnguYnguJTguLnguYHguKXguYDguJfguYjguLLguJnguLHguYnguJkpIC0tLS0gKi8KCmZ1bmN0aW9uIGlzQWRtaW5Ob3coKXsKICByZXR1cm4gISEoUy5ib290ICYmIFMuYm9vdC5pc0FkbWluKTsKfQoKZnVuY3Rpb24gc2V0dGluZ3NVc2Vyc0NhcmQo',
  'dXNlcnMpewogIGlmICghdXNlcnMpIHJldHVybiAnJzsKICByZXR1cm4gY2FyZCgn8J+RpSDguJzguLnguYnguYPguIrguYnguYPguJnguKPguLDguJrguJogKCcgKyB1c2Vycy5sZW5ndGggKyAnKScsCiAgICAnPHAgY2xhc3M9ImZzMTMgbXV0ZWQiPuC5geC4iOC4',
  'geC4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5ieC5geC4peC4sOC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C5ieC4hOC4meC4reC4t+C5iOC4meC5gOC4guC5ieC4suC4oeC4suC4lOC4ueC4q+C4o+C4t+C4reC4iuC5iOC4p+C4ouC5geC4geC5ieC4',
  'guC5ieC4reC4oeC4ueC4peC5hOC4lOC5iSAnICsKICAgICfguJXguLHguYnguIfguKrguLTguJfguJjguLTguYzguYHguKLguIHguKPguLLguKLguITguJkg4LmB4Lil4Liw4Lij4Liw4LiH4Lix4Lia4LmE4LiU4LmJ4LiX4Li44LiB4LmA4Lih4Li34LmI4LitPC9w',
  'PicgKwogICAgJzxkaXYgY2xhc3M9InR3IG10MTIiPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsKICAgICAgJzx0aD7guIrguLfguYjguK3guJzguLnguYnguYPguIrguYk8L3RoPjx0aD7guIrguLfguYjguK3guJfguLXguYjguYHguKrguJTguIc8L3Ro',
  'Pjx0aD7guKrguLTguJfguJjguLTguYw8L3RoPjx0aD7guKrguJbguLLguJnguLA8L3RoPjx0aD7guYDguILguYnguLLguKXguYjguLLguKrguLjguJQ8L3RoPicgKwogICAgICAnPHRoIGNsYXNzPSJudW0iPuC4reC4uOC4m+C4geC4o+C4k+C5jDwvdGg+PHRoPjwv',
  'dGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgIHVzZXJzLm1hcChmdW5jdGlvbih1KXsKICAgICAgdmFyIG1lTm93ID0gKEFVVEgubWUgJiYgQVVUSC5tZS51c2VybmFtZSkgPT09IHUudXNlcm5hbWU7CiAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICc8',
  'dGQ+PGI+JyArIGVzYyh1LnVzZXJuYW1lKSArICc8L2I+JyArIChtZU5vdyA/ICcgPHNwYW4gY2xhc3M9ImIgaW5mbyI+4LiE4Li44LiTPC9zcGFuPicgOiAnJykgKyAnPC90ZD4nICsKICAgICAgICAnPHRkPicgKyBlc2ModS5uYW1lIHx8ICfigJMnKSArICc8L3Rk',
  'PicgKwogICAgICAgICc8dGQ+JyArIHJvbGVCYWRnZSh1LnJvbGUpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZD4nICsgc3RhdHVzQmFkZ2UodS5zdGF0dXMpICsgKHUubG9ja2VkID8gJyA8c3BhbiBjbGFzcz0iYiBkZ3IiPuC4luC4ueC4geC4peC5h+C4reC4geC4',
  'iuC4seC5iOC4p+C4hOC4o+C4suC4pzwvc3Bhbj4nIDogJycpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArICh1Lmxhc3RMb2dpbiA/IHRoRGF0ZVNob3J0KFN0cmluZyh1Lmxhc3RMb2dpbikuc2xpY2UoMCwxMCkpIDogJ+KAkycpICsg',
  'JzwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHUuZGV2aWNlcyB8fCAwKSArICc8L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9InQtYWN0aW9ucyI+JyArCiAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJmb3Jt',
  'VXNlcignICsgYXR0cih1KSArICcpIj7guYHguIHguYnguYTguII8L2J1dHRvbj4nICsKICAgICAgICAgIChtZU5vdyA/ICcnIDogJzxidXR0b24gY2xhc3M9ImJ0biBzbSBkZ3IiIG9uY2xpY2s9ImRlbFVzZXIoXCcnICsgZXNjKHUudXNlcm5hbWUpICsgJ1wnKSI+',
  '4Lil4LiaPC9idXR0b24+JykgKwogICAgICAgICc8L3RkPjwvdHI+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgc20iIG9uY2xpY2s9ImZvcm1Vc2VyKCkiPisg4LmA4Lie4Li0',
  '4LmI4Lih4Lic4Li54LmJ4LmD4LiK4LmJPC9idXR0b24+Jyk7Cn0KCmZ1bmN0aW9uIHJvbGVCYWRnZShyb2xlKXsKICB2YXIgY2xzID0gcm9sZSA9PT0gJ+C4nOC4ueC5ieC4lOC4ueC5geC4pScgPyAnb2snIDogKHJvbGUgPT09ICfguYHguIHguYnguYTguILguYTg',
  'uJTguYknID8gJ2luZm8nIDogJ211dGUnKTsKICByZXR1cm4gJzxzcGFuIGNsYXNzPSJiICcgKyBjbHMgKyAnIj4nICsgZXNjKHJvbGUpICsgJzwvc3Bhbj4nOwp9CgovLyDguKvguKHguLLguKLguYDguKvguJXguLg6IOC5g+C4iuC5iSBhdHRyKCkg4LiV4Lix4Lin',
  '4LmA4LiU4Li14Lii4Lin4LiB4Lix4Lia4LiX4Li14LmIIFZpZXdzLmh0bWwg4Lib4Lij4Liw4LiB4Liy4Lio4LmE4Lin4LmJCi8vIOC5gOC4hOC4ouC4m+C4o+C4sOC4geC4suC4qOC4iuC4t+C5iOC4reC4i+C5ieC4s+C5hOC4p+C5ieC4leC4o+C4h+C4meC4teC5',
  'ieC4hOC4o+C4seC5ieC4h+C4q+C4meC4tuC5iOC4hyDguYHguKXguYnguKfguYTguJvguJfguLHguJrguILguK3guIfguYDguJTguLTguKHguIjguJnguJvguLjguYjguKHguYHguIHguYnguYTguILguJfguLHguYnguIfguKPguLDguJrguJrguJ7guLHguIcKLy8g',
  'KOC4n+C4reC4o+C5jOC4oeC4guC4tuC5ieC4meC4p+C5iOC4suC4hyDguYHguKXguLDguIHguJTguJrguLHguJnguJfguLbguIHguIHguKXguLLguKLguYDguJvguYfguJnguKrguKPguYnguLLguIfguKPguLLguKLguIHguLLguKPguYPguKvguKHguYjguYHguJfg',
  'uJnguIHguLLguKPguYHguIHguYnguILguK3guIfguYDguJTguLTguKEpCgpmdW5jdGlvbiBmb3JtVXNlcihqc29uKXsKICB2YXIgdSA9IGpzb24gPyAodHlwZW9mIGpzb24gPT09ICdzdHJpbmcnID8gSlNPTi5wYXJzZShqc29uKSA6IGpzb24pIDoge307CiAgdmFy',
  'IGlzTmV3ID0gIXUudXNlcm5hbWU7CgogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiBpc05ldyA/ICfguYDguJ7guLTguYjguKHguJzguLnguYnguYPguIrguYnguYPguKvguKHguYgnIDogJ+C5geC4geC5ieC5hOC4guC4nOC4ueC5ieC5g+C4iuC5iSAnICsgdS51c2Vy',
  'bmFtZSwKICAgIGFjdGlvbjogJ3VzZXIuc2F2ZScsCiAgICByZWNvcmQ6IE9iamVjdC5hc3NpZ24oeyBpZDogaXNOZXcgPyAnJyA6IHUudXNlcm5hbWUsIHJvbGU6ICfguJTguLnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcnLCBzdGF0dXM6ICfguYPguIrg',
  'uYnguIfguLLguJknIH0sIHUpLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oid1c2VybmFtZScsIGxhYmVsOifguIrguLfguYjguK3guJzguLnguYnguYPguIrguYkgKOC4oOC4suC4qeC4suC4reC4seC4h+C4geC4pOC4qSknLCByZXF1aXJlZDppc05ldywgcGg6',
  'J+C5gOC4iuC5iOC4mSBzb21jaGFpJywKICAgICAgICBoaW50OiBpc05ldyA/ICdhLXogMC05IC4gXyAtIOC4ouC4suC4pyAz4oCTMjQg4LiV4Lix4LinIMK3IOC5gOC4m+C4peC4teC5iOC4ouC4meC4oOC4suC4ouC4q+C4peC4seC4h+C5hOC4oeC5iOC5hOC4lOC5',
  'iScgOiAn4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmE4Lih4LmI4LmE4LiU4LmJJyB9LAogICAgICB7IGtleTonbmFtZScsIGxhYmVsOifguIrguLfguYjguK3guJfguLXguYjguYHguKrguJTguIcnLCByZXF1aXJl',
  'ZDp0cnVlLCBwaDon4LmA4LiK4LmI4LiZIOC4quC4oeC4iuC4suC4oicgfSwKICAgICAgeyBrZXk6J3JvbGUnLCBsYWJlbDon4Liq4Li04LiX4LiY4Li04LmM4LiB4Liy4Lij4LmD4LiK4LmJ4LiH4Liy4LiZJywgdHlwZTonc2VsZWN0JywgYmxhbms6ZmFsc2UsIHJl',
  'cXVpcmVkOnRydWUsCiAgICAgICAgb3B0aW9uczpbJ+C4lOC4ueC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pycsJ+C5geC4geC5ieC5hOC4guC5hOC4lOC5iScsJ+C4nOC4ueC5ieC4lOC4ueC5geC4pSddLAogICAgICAgIGhpbnQ6J+C4lOC4ueC4reC4ouC5',
  'iOC4suC4h+C5gOC4lOC4teC4ouC4pyA9IOC5gOC4m+C4tOC4lOC4lOC4ueC5hOC4lOC5ieC4l+C4uOC4geC4q+C4meC5ieC4siDCtyDguYHguIHguYnguYTguILguYTguJTguYkgPSDguYDguJ7guLTguYjguKEv4LmB4LiB4LmJL+C4peC4muC4guC5ieC4reC4oeC4',
  'ueC4pSDCtyDguJzguLnguYnguJTguLnguYHguKUgPSDguIjguLHguJTguIHguLLguKPguJzguLnguYnguYPguIrguYnguYHguKXguLDguIHguLLguKPguJXguLHguYnguIfguITguYjguLLguYTguJTguYnguJTguYnguKfguKInIH0sCiAgICAgIHsga2V5OidwYXNz',
  'd29yZCcsIGxhYmVsOiBpc05ldyA/ICfguKPguKvguLHguKrguJzguYjguLLguJnguYDguKPguLTguYjguKHguJXguYnguJknIDogJ+C4leC4seC5ieC4h+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iCAo4LmA4Lin4LmJ4LiZ4Lin4LmI4Liy4LiH',
  'ID0g4LmE4Lih4LmI4LmA4Lib4Lil4Li14LmI4Lii4LiZKScsCiAgICAgICAgcmVxdWlyZWQ6aXNOZXcsIHBoOifguK3guKLguYjguLLguIfguJnguYnguK3guKIgOCDguJXguLHguKfguK3guLHguIHguKnguKMnLAogICAgICAgIGhpbnQ6J+C4iOC4lOC5hOC4p+C5',
  'ieC4quC5iOC4h+C5g+C4q+C5ieC5gOC4iOC5ieC4suC4leC4seC4pyDigJQg4Lij4Liw4Lia4Lia4LmA4LiB4LmH4Lia4LmB4Lia4Lia4LmA4LiC4LmJ4Liy4Lij4Lir4Lix4LiqIOC5gOC4m+C4tOC4lOC4lOC4ueC4ouC5ieC4reC4meC4q+C4peC4seC4h+C5hOC4',
  'oeC5iOC5hOC4lOC5iScgfSwKICAgICAgeyBrZXk6J211c3RDaGFuZ2UnLCBsYWJlbDon4LmD4Lir4LmJ4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LiV4Lit4LiZ4LmA4LiC4LmJ4Liy4LiE4Lij4Lix4LmJ4LiH4LmB4Lij4LiB',
  'JywgdHlwZTonc2VsZWN0JywgYmxhbms6ZmFsc2UsCiAgICAgICAgb3B0aW9uczpbe3ZhbHVlOid0cnVlJyxsYWJlbDon4LmD4LiK4LmIICjguYHguJnguLDguJnguLMpJ30se3ZhbHVlOidmYWxzZScsbGFiZWw6J+C5hOC4oeC5iOC4leC5ieC4reC4hyd9XSB9LAog',
  'ICAgICB7IGtleTonc3RhdHVzJywgbGFiZWw6J+C4quC4luC4suC4meC4sCcsIHR5cGU6J3NlbGVjdCcsIGJsYW5rOmZhbHNlLCBvcHRpb25zOlsn4LmD4LiK4LmJ4LiH4Liy4LiZJywn4Lij4Liw4LiH4Lix4LiaJ10sCiAgICAgICAgaGludDon4Lij4Liw4LiH4Lix',
  '4LiaID0g4LmA4LiC4LmJ4Liy4Lij4Liw4Lia4Lia4LmE4Lih4LmI4LmE4LiU4LmJ4LiX4Lix4LiZ4LiX4Li1IOC5geC4leC5iOC4ouC4seC4h+C5gOC4geC5h+C4muC4muC4seC4jeC4iuC4teC5hOC4p+C5iScgfSwKICAgICAgeyBrZXk6J25vdGUnLCBsYWJlbDon',
  '4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXSwKICAgIHdpZGU6IHRydWUKICB9KTsKCiAgLy8g4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LmE4Lih4LmI',
  '4LmE4LiU4LmJIOC4peC5h+C4reC4geC4iuC5iOC4reC4h+C5hOC4p+C5ieC5gOC4peC4ouC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC5gOC4guC5ieC4suC5g+C4iOC4nOC4tOC4lAogIGlmICghaXNOZXcpIHsKICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1l',
  'bnRCeUlkKCdmX3VzZXJuYW1lJyk7CiAgICBpZiAoZWwpIHsgZWwucmVhZE9ubHkgPSB0cnVlOyBlbC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3ZhcigtLXN1cmZhY2UtMiknOyB9CiAgfQp9CgpmdW5jdGlvbiBkZWxVc2VyKHVzZXJuYW1lKXsKICBjb25maXJtQWN0aW9u',
  'KCfguKXguJrguJzguLnguYnguYPguIrguYkgIicgKyB1c2VybmFtZSArICciIOC5g+C4iuC5iOC5hOC4q+C4oSDigJQg4LmA4LiC4LmJ4Liy4Lij4Liw4Lia4Lia4LmE4Lih4LmI4LmE4LiU4LmJ4Lit4Li14LiB4LiX4Lix4LiZ4LiX4Li1JywgZnVuY3Rpb24oKXsK',
  'ICAgIGNhbGxBcGkoJ3VzZXIuZGVsZXRlJywgeyB1c2VybmFtZTogdXNlcm5hbWUgfSkudGhlbihmdW5jdGlvbigpewogICAgICB0b2FzdCgn4Lil4Lia4Lic4Li54LmJ4LmD4LiK4LmJ4LmB4Lil4LmJ4LinJywgJ29rJyk7CiAgICAgIGxvYWQoeyBxdWlldDogdHJ1',
  'ZSB9KTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2UgfHwgZSwgJ2VycicpOyB9KTsKICB9KTsKfQoKLyogLS0tLSDguKXguLTguIfguIHguYzguYDguILguYnguLLguYPguIrguYnguIfguLLguJkgLS0tLSAqLwoKZnVuY3Rpb24gc2V0',
  'dGluZ3NTaGFyZUNhcmQobGlua3MpewogIGlmICghbGlua3MgfHwgIWxpbmtzLmFwcFVybCkgewogICAgcmV0dXJuIGNhcmQoJ/CflJcg4Lil4Li04LiH4LiB4LmM4LmA4LiC4LmJ4Liy4LmD4LiK4LmJ4LiH4Liy4LiZJywKICAgICAgJzxkaXYgY2xhc3M9ImVtcHR5',
  'Ij7guKLguLHguIfguKvguLLguKXguLTguIfguIHguYzguIjguKPguLTguIfguYTguKHguYjguYDguIjguK0g4oCUIOC5gOC4m+C4tOC4lOC5gOC4p+C5h+C4muC5geC4reC4m+C4iOC4suC4geC4peC4tOC4h+C4geC5jOC4l+C4teC5iOC4peC4h+C4l+C5ieC4suC4',
  'oiAvZXhlYyDguKrguLHguIHguITguKPguLHguYnguIcg4LmB4Lil4LmJ4Lin4Lij4Liw4Lia4Lia4LiI4Liw4LiI4Liz4LmD4Lir4LmJ4LmA4Lit4LiHPC9kaXY+Jyk7CiAgfQogIHJldHVybiBjYXJkKCfwn5SXIOC4peC4tOC4h+C4geC5jOC5gOC4guC5ieC4suC5',
  'g+C4iuC5ieC4h+C4suC4mScsCiAgICAnPGRpdiBjbGFzcz0iZiBtYjEyIj48bGFiZWw+4Lil4Li04LiH4LiB4LmM4Lir4Lil4Lix4LiBIOKAlCDguKrguYjguIfguYPguKvguYnguJfguLjguIHguITguJnguYTguJTguYkgKOC5gOC4guC5ieC4suC4lOC5ieC4p+C4',
  'ouC4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5ieC5geC4peC4sOC4o+C4q+C4seC4quC4nOC5iOC4suC4mSk8L2xhYmVsPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJhcHBVcmwiIHJlYWRvbmx5IHZhbHVlPSInICsgZXNjKGxpbmtzLmFwcFVy',
  'bCkgKyAnIiBvbmNsaWNrPSJ0aGlzLnNlbGVjdCgpIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJjb3B5RmllbGQoXCdhcHBVcmxcJykiPvCfk4sg4LiE4Lix4LiU',
  '4Lil4Lit4LiB4Lil4Li04LiH4LiB4LmM4Lir4Lil4Lix4LiBPC9idXR0b24+JyArCiAgICAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImYgbWIxMiI+PGxhYmVsPvCfkYAg4Lil4Li04LiH4LiB4LmM4LiU',
  '4Li54Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4Lin4LmB4Lia4Lia4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4Lil4LmH4Lit4LiB4Lit4Li04LiZPC9sYWJlbD4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0ic2hhcmVVcmwiIHJlYWRvbmx5IHZhbHVl',
  'PSInICsgZXNjKGxpbmtzLnZpZXdVcmwpICsgJyIgb25jbGljaz0idGhpcy5zZWxlY3QoKSI+PC9kaXY+JyArCiAgICAnPHAgY2xhc3M9ImZzMTIgJyArIChsaW5rcy5zaGFyZUVuYWJsZWQgPyAnbXV0ZWQnIDogJ3dhcm4tdGV4dCcpICsgJyI+JyArCiAgICAgIChs',
  'aW5rcy5zaGFyZUVuYWJsZWQKICAgICAgICA/ICfguYDguJvguLTguJTguK3guKLguLnguYgg4oCUIOC5g+C4hOC4o+C4geC5h+C4leC4suC4oeC4l+C4teC5iOC4oeC4teC4peC4tOC4h+C4geC5jOC4meC4teC5ieC5gOC4m+C4tOC4lOC4lOC4ueC4guC5ieC4reC4',
  'oeC4ueC4peC5hOC4lOC5ieC5guC4lOC4ouC5hOC4oeC5iOC4leC5ieC4reC4h+C4peC5h+C4reC4geC4reC4tOC4mScKICAgICAgICA6ICfimqDvuI8g4Lib4Li04LiU4Lit4Lii4Li54LmIIOKAlCDguKXguLTguIfguIHguYzguJnguLXguYnguKLguLHguIfguYPg',
  'uIrguYnguYTguKHguYjguYTguJTguYkg4LmA4Lib4Li04LiU4Liq4Lin4Li04LiV4LiK4LmM4LmE4LiU4LmJ4LiX4Li14LmI4Lir4Lix4Lin4LiC4LmJ4LitICLguITguKfguLLguKHguJvguKXguK3guJTguKDguLHguKLguYHguKXguLDguIHguLLguKPguYDguILg',
  'uYnguLLguYPguIrguYnguIfguLLguJkiIOC4lOC5ieC4suC4meC4muC4mScpICsKICAgICc8L3A+JyArCiAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjb3B5RmllbGQoXCdzaGFyZVVybFwn',
  'KSI+8J+TiyDguITguLHguJTguKXguK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYw8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBkZ3IiIG9uY2xpY2s9ImRvUm90YXRlU2hhcmUoKSI+8J+UgSDguK3guK3guIHguKXguLTguIfguIHg',
  'uYzguYHguIrguKPguYzguYPguKvguKHguYg8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+JyArCiAgICAnPHAgY2xhc3M9ImZzMTIgbXV0ZWQiPvCfhpgg4Lil4Li04LiH4LiB4LmM4LiB4Li54LmJ4Lij4Liw4Lia',
  '4LiaICjguYPguIrguYnguJXguK3guJnguKXguLfguKHguKPguKvguLHguKrguJzguYjguLLguJnguIjguJnguYDguILguYnguLLguYTguKHguYjguYTguJTguYkg4oCUIOC4q+C5ieC4suC4oeC4quC5iOC4h+C4leC5iOC4rSk8YnI+JyArCiAgICAnPGNvZGUgY2xh',
  'c3M9ImZzMTIiPicgKyBlc2MobGlua3MuYWRtaW5VcmwpICsgJzwvY29kZT48L3A+Jyk7Cn0KCmZ1bmN0aW9uIGNvcHlGaWVsZChpZCl7CiAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpOwogIGlmICghZWwpIHJldHVybjsKICBlbC5zZWxlY3Qo',
  'KTsKICB0cnkgeyBkb2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpOyB0b2FzdCgn4LiE4Lix4LiU4Lil4Lit4LiB4LmB4Lil4LmJ4LinJywgJ29rJyk7IH0KICBjYXRjaCAoZSkgeyB0b2FzdCgn4LiB4LiU4LiE4LmJ4Liy4LiH4LiX4Li14LmI4LiK4LmI4Lit4LiH',
  '4LmB4Lil4LmJ4Lin4LmA4Lil4Li34Lit4LiBIOC4hOC4seC4lOC4peC4reC4gScsICdlcnInKTsgfQp9Cjwvc2NyaXB0Pgo8c2NyaXB0PgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgRm9ybXMu',
  'aHRtbCDigJQg4Lif4Lit4Lij4LmM4Lih4LmA4Lie4Li04LmI4LihL+C5geC4geC5ieC5hOC4giDguYHguKXguLDguIHguLLguKPguKXguJoKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgp2YXIg',
  'Rk9STSA9IHsKICBzcGVjczogW10sICAgICAgIC8vIOC4nOC4seC4h+C4iuC5iOC4reC4h+C4geC4o+C4reC4geC4guC4reC4h+C4n+C4reC4o+C5jOC4oeC4l+C4teC5iOC5gOC4m+C4tOC4lOC4reC4ouC4ueC5iAogIGtlZXA6IHt9LCAgICAgICAgLy8g4LmE4Lif',
  '4Lil4LmM4LmB4LiZ4Lia4LmA4LiU4Li04Lih4LiX4Li14LmI4Lii4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJ4LmA4Lit4Liy4Lit4Lit4LiBCiAgYnVja2V0OiAnbWlzYycsICAvLyDguYLguJ/guKXguYDguJTguK3guKPguYzguJfguLXguYjguIjguLDguYDguIHg',
  'uYfguJrguYTguJ/guKXguYzguYHguJnguJrguYPguKvguKHguYgKICBvY3I6IG51bGwsICAgICAgIC8vIOC4nOC4seC4h+C4geC4suC4o+C5gOC4leC4tOC4oeC4hOC5iOC4suC4iOC4suC4geC4o+C4ueC4mwogIHJlYzogbnVsbCwgICAgICAgLy8g4Lij4Liy4Lii',
  '4LiB4Liy4Lij4LiX4Li14LmI4LiB4Liz4Lil4Lix4LiH4LmB4LiB4LmJ4Lit4Lii4Li54LmIIChudWxsID0g4LiB4Liz4Lil4Lix4LiH4LmA4Lie4Li04LmI4Lih4Lij4Liy4Lii4LiB4Liy4Lij4LmD4Lir4Lih4LmIKQogIGxpbmVzOiBbXSAgICAgICAgLy8g4Lij',
  '4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4Lii4LmD4LiZ4Lia4Li04LilICjguYPguIrguYnguIHguLHguJrguIrguYjguK3guIfguIrguJnguLTguJQgbGluZXMpCn07CgovKiAtLS0tLS0tLS0tLS0tLS0tIGZvcm0gZW5naW5lIC0tLS0tLS0tLS0tLS0tLS0gKi8K',
  'CmZ1bmN0aW9uIGZpZWxkc0h0bWwoc3BlY3MsIHJlYyl7CiAgcmVjID0gcmVjIHx8IHt9OwogIEZPUk0uc3BlY3MgPSBzcGVjczsKICBGT1JNLmtlZXAgPSB7fTsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImZncmlkIj4nICsgc3BlY3MubWFwKGZ1bmN0aW9uKGYpewog',
  'ICAgdmFyIHYgPSByZWNbZi5rZXldOwogICAgdmFyIGlkID0gJ2ZfJyArIGYua2V5OwogICAgdmFyIGlubmVyOwoKICAgIGlmIChmLnR5cGUgPT09ICdzZWxlY3QnKSB7CiAgICAgIHZhciBvcHRzID0gKGYub3B0aW9ucyB8fCBbXSkubWFwKGZ1bmN0aW9uKG8pewog',
  'ICAgICAgIHZhciB2YWwgPSB0eXBlb2YgbyA9PT0gJ29iamVjdCcgPyBvLnZhbHVlIDogbzsKICAgICAgICB2YXIgbGFiID0gdHlwZW9mIG8gPT09ICdvYmplY3QnID8gby5sYWJlbCA6IG87CiAgICAgICAgcmV0dXJuICc8b3B0aW9uIHZhbHVlPSInICsgZXNjKHZh',
  'bCkgKyAnIicgKyAoU3RyaW5nKHYpID09PSBTdHJpbmcodmFsKSA/ICcgc2VsZWN0ZWQnIDogJycpICsgJz4nICsgZXNjKGxhYikgKyAnPC9vcHRpb24+JzsKICAgICAgfSkuam9pbignJyk7CiAgICAgIGlubmVyID0gJzxzZWxlY3QgY2xhc3M9InNlbCIgaWQ9Iicg',
  'KyBpZCArICciPicgKyAoZi5ibGFuayAhPT0gZmFsc2UgPyAnPG9wdGlvbiB2YWx1ZT0iIj7igJQg4LmA4Lil4Li34Lit4LiBIOKAlDwvb3B0aW9uPicgOiAnJykgKyBvcHRzICsgJzwvc2VsZWN0Pic7CgogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICd0ZXh0YXJl',
  'YScpIHsKICAgICAgaW5uZXIgPSAnPHRleHRhcmVhIGNsYXNzPSJ0YSIgaWQ9IicgKyBpZCArICciIHBsYWNlaG9sZGVyPSInICsgZXNjKGYucGh8fCcnKSArICciPicgKyBlc2Modnx8JycpICsgJzwvdGV4dGFyZWE+JzsKCiAgICB9IGVsc2UgaWYgKGYudHlwZSA9',
  'PT0gJ2ZpbGVzJykgewogICAgICBGT1JNLmtlZXBbZi5rZXldID0gKHJlY1tmLmtleV0gJiYgcmVjW2Yua2V5XS5sZW5ndGgpID8gW10uY29uY2F0KHJlY1tmLmtleV0pIDogW107CiAgICAgIGlubmVyID0KICAgICAgICAnPGRpdiBpZD0iJyArIGlkICsgJ19leGlz',
  'dGluZyI+JyArIGV4aXN0aW5nRmlsZXNIdG1sKGYua2V5KSArICc8L2Rpdj4nICsKICAgICAgICAnPGxhYmVsIGNsYXNzPSJmaWxlLWRyb3AiIGZvcj0iJyArIGlkICsgJyI+8J+TjiDguYHguJXguLDguYDguJ7guLfguYjguK3guYDguKXguLfguK3guIHguYTguJ/g',
  'uKXguYwgKOC5gOC4peC4t+C4reC4geC5hOC4lOC5ieC4q+C4peC4suC4ouC5hOC4n+C4peC5jCDCtyDguYTguKHguYjguYDguIHguLTguJkgMTIgTUIg4LiV4LmI4Lit4LmE4Lif4Lil4LmMKScgKwogICAgICAgICc8aW5wdXQgdHlwZT0iZmlsZSIgaWQ9IicgKyBp',
  'ZCArICciIG11bHRpcGxlIGFjY2VwdD0iaW1hZ2UvKixhcHBsaWNhdGlvbi9wZGYiIHN0eWxlPSJkaXNwbGF5Om5vbmUiICcgKwogICAgICAgICdvbmNoYW5nZT0icHJldmlld1BpY2tlZCh0aGlzLFwnJyArIGlkICsgJ1wnKSI+PC9sYWJlbD4nICsKICAgICAgICAn',
  'PGRpdiBpZD0iJyArIGlkICsgJ19wcmV2aWV3IiBjbGFzcz0idGh1bWJzIG10OCI+PC9kaXY+JyArCiAgICAgICAgJzxkaXYgaWQ9IicgKyBpZCArICdfb2NyIj48L2Rpdj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnbGluZXMnKSB7CiAgICAgIEZPUk0u',
  'bGluZXMgPSBwYXJzZUxpbmVzVGV4dCh2KTsKICAgICAgaW5uZXIgPSAnPGRpdiBpZD0iJyArIGlkICsgJyIgY2xhc3M9ImxpbmVzIj4nICsgbGluZXNUYWJsZUh0bWwoKSArICc8L2Rpdj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnY29tcHV0ZWQnKSB7',
  'CiAgICAgIGlubmVyID0gJzxkaXYgY2xhc3M9ImlucCIgaWQ9IicgKyBpZCArICciIHN0eWxlPSJiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Zm9udC13ZWlnaHQ6NjAwOycgKwogICAgICAgICAgICAgICdmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51',
  'bXM7Y3Vyc29yOmRlZmF1bHQiPjA8L2Rpdj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnZGF0ZScpIHsKICAgICAgaW5uZXIgPSAnPGlucHV0IHR5cGU9ImRhdGUiIGNsYXNzPSJpbnAiIGlkPSInICsgaWQgKyAnIiB2YWx1ZT0iJyArIGVzYyh2IHx8ICcn',
  'KSArICciPic7CgogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICdudW1iZXInIHx8IGYudHlwZSA9PT0gJ21vbmV5JykgewogICAgICBpbm5lciA9ICc8aW5wdXQgdHlwZT0ibnVtYmVyIiBzdGVwPSInICsgKGYudHlwZSA9PT0gJ21vbmV5JyA/ICcwLjAxJyA6ICcx',
  'JykgKyAnIiBjbGFzcz0iaW5wIiBpZD0iJyArIGlkICsgJyIgJyArCiAgICAgICAgICAgICAgJ3ZhbHVlPSInICsgKHYgPT0gbnVsbCB8fCB2ID09PSAnJyA/ICcnIDogZXNjKHYpKSArICciIHBsYWNlaG9sZGVyPSInICsgZXNjKGYucGh8fCcnKSArICciIGlucHV0',
  'bW9kZT0iZGVjaW1hbCInICsKICAgICAgICAgICAgICAoZi5zdW1zID8gJyBvbmlucHV0PSJyZWNhbGNTdW1zKCkiJyA6IChmLm9uaW5wdXQgPyAnIG9uaW5wdXQ9IicgKyBlc2MoZi5vbmlucHV0KSArICciJyA6ICcnKSkgKyAnPic7CgogICAgfSBlbHNlIHsKICAg',
  'ICAgaW5uZXIgPSAnPGlucHV0IHR5cGU9InRleHQiIGNsYXNzPSJpbnAiIGlkPSInICsgaWQgKyAnIiB2YWx1ZT0iJyArIGVzYyh2IHx8ICcnKSArICciIHBsYWNlaG9sZGVyPSInICsgZXNjKGYucGh8fCcnKSArICciPic7CiAgICB9CgogICAgcmV0dXJuICc8ZGl2',
  'IGNsYXNzPSJmJyArIChmLmZ1bGwgPyAnIGZ1bGwnIDogJycpICsgJyI+JyArCiAgICAgICc8bGFiZWwgZm9yPSInICsgaWQgKyAnIj4nICsgZXNjKGYubGFiZWwpICsgKGYucmVxdWlyZWQgPyAnIDxzcGFuIHN0eWxlPSJjb2xvcjp2YXIoLS1kYW5nZXIpIj4qPC9z',
  'cGFuPicgOiAnJykgKyAnPC9sYWJlbD4nICsKICAgICAgaW5uZXIgKyAoZi5oaW50ID8gJzxkaXYgY2xhc3M9ImhpbnQiPicgKwogICAgICAgIChmLmhpbnQuY2hhckF0KDApID09PSAnPCcgPyBmLmhpbnQgOiBlc2MoZi5oaW50KSkgKyAnPC9kaXY+JyA6ICcnKSAr',
  'ICc8L2Rpdj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJrguLTguKXguYDguJTguLXguKLguKfguKvguKXguLLguKLguKPguLLg',
  'uKLguIHguLLguKMg4oCUIOC4i+C4t+C5ieC4reC4reC4reC4meC5hOC4peC4meC5jOC4l+C4teC5gOC4lOC4teC4ouC4p+C5hOC4lOC5ieC4guC4reC4h+C4q+C4peC4suC4ouC4reC4ouC5iOC4suC4hwoKICAg4LmA4LiB4LmH4Lia4Lil4LiH4LiK4Li14LiV4LmA',
  '4Lib4LmH4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4LihIOC4muC4o+C4o+C4l+C4seC4lOC4peC4sOC4o+C4suC4ouC4geC4suC4oyAg4LiK4Li34LmI4LitIHwg4LiI4Liz4LiZ4Lin4LiZIHwg4Lir4LiZ4LmI4Lin4LiiIHwg4Lij4Liy4LiE4Liy4LiV4LmI4Lit4Lir',
  '4LiZ4LmI4Lin4LiiCiAgICjguKPguLnguJvguYHguJrguJrguYDguJTguLXguKLguKfguIHguLHguJogcGFyc2VMaW5lc18g4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmMIOKAlCDguYHguIHguYnguJfguLXguYjguYTguKvguJng',
  'uJXguYnguK3guIfguYHguIHguYnguYPguKvguYnguJXguKPguIfguIHguLHguJkpCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKZnVuY3Rpb24gcGFyc2VMaW5lc1RleHQodGV4dCl7CiAg',
  'cmV0dXJuIFN0cmluZyh0ZXh0ID09IG51bGwgPyAnJyA6IHRleHQpLnNwbGl0KC9ccj9cbi8pCiAgICAubWFwKGZ1bmN0aW9uKHMpeyByZXR1cm4gcy50cmltKCk7IH0pLmZpbHRlcihCb29sZWFuKQogICAgLm1hcChmdW5jdGlvbihyYXcpewogICAgICB2YXIgYSA9',
  'IHJhdy5zcGxpdCgnfCcpLm1hcChmdW5jdGlvbih4KXsgcmV0dXJuIHgudHJpbSgpOyB9KTsKICAgICAgdmFyIG5hbWUgPSBhWzBdIHx8ICcnLCBxdHkgPSAxLCB1bml0ID0gJycsIHByaWNlID0gMDsKICAgICAgaWYgKGEubGVuZ3RoID49IDQpICAgICAgeyBxdHkg',
  'PSBudW1PcihhWzFdLCAxKTsgdW5pdCA9IGFbMl0gfHwgJyc7IHByaWNlID0gbnVtT3IoYVszXSwgMCk7IH0KICAgICAgZWxzZSBpZiAoYS5sZW5ndGggPT09IDMpeyBxdHkgPSBudW1PcihhWzFdLCAxKTsgcHJpY2UgPSBudW1PcihhWzJdLCAwKTsgfQogICAgICBl',
  'bHNlIGlmIChhLmxlbmd0aCA9PT0gMil7IHByaWNlID0gbnVtT3IoYVsxXSwgMCk7IH0KICAgICAgcmV0dXJuIHsgbmFtZTogbmFtZSwgcXR5OiBxdHksIHVuaXQ6IHVuaXQsIHByaWNlOiBwcmljZSB9OwogICAgfSk7Cn0KCmZ1bmN0aW9uIG51bU9yKHYsIGRmbHQp',
  'ewogIHZhciBuID0gTnVtYmVyKFN0cmluZyh2KS5yZXBsYWNlKC8sL2csICcnKSk7CiAgcmV0dXJuIGlzRmluaXRlKG4pID8gbiA6IGRmbHQ7Cn0KCmZ1bmN0aW9uIGZvcm1hdExpbmVzVGV4dChsaXN0KXsKICByZXR1cm4gKGxpc3QgfHwgW10pCiAgICAuZmlsdGVy',
  'KGZ1bmN0aW9uKGwpeyByZXR1cm4gU3RyaW5nKGwubmFtZSB8fCAnJykudHJpbSgpIHx8IE51bWJlcihsLnByaWNlKTsgfSkKICAgIC5tYXAoZnVuY3Rpb24obCl7CiAgICAgIHJldHVybiBbU3RyaW5nKGwubmFtZSB8fCAnJykucmVwbGFjZSgvXHwvZywgJy8nKSwK',
  'ICAgICAgICAgICAgICBsLnF0eSB8fCAxLAogICAgICAgICAgICAgIFN0cmluZyhsLnVuaXQgfHwgJycpLnJlcGxhY2UoL1x8L2csICcvJyksCiAgICAgICAgICAgICAgbC5wcmljZSB8fCAwXS5qb2luKCcgfCAnKTsKICAgIH0pLmpvaW4oJ1xuJyk7Cn0KCmZ1bmN0',
  'aW9uIGxpbmVUb3RhbChsKXsgcmV0dXJuIChOdW1iZXIobC5xdHkpIHx8IDApICogKE51bWJlcihsLnByaWNlKSB8fCAwKTsgfQpmdW5jdGlvbiBsaW5lc1N1bSgpeyByZXR1cm4gKEZPUk0ubGluZXMgfHwgW10pLnJlZHVjZShmdW5jdGlvbihhLCBsKXsgcmV0dXJu',
  'IGEgKyBsaW5lVG90YWwobCk7IH0sIDApOyB9CgpmdW5jdGlvbiBsaW5lc1RhYmxlSHRtbCgpewogIHZhciByb3dzID0gKEZPUk0ubGluZXMgfHwgW10pLm1hcChmdW5jdGlvbihsLCBpKXsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0ibGluZS1yb3ciPicgKwogICAg',
  'ICAnPGlucHV0IGNsYXNzPSJpbnAiIHBsYWNlaG9sZGVyPSLguIrguLfguYjguK3guKrguLTguJnguITguYnguLIiIHZhbHVlPSInICsgZXNjKGwubmFtZSB8fCAnJykgKyAnIiAnICsKICAgICAgICAnb25pbnB1dD0ic2V0TGluZSgnICsgaSArICcsXCduYW1lXCcs',
  'dGhpcy52YWx1ZSkiPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAgbnVtIiB0eXBlPSJudW1iZXIiIHN0ZXA9ImFueSIgaW5wdXRtb2RlPSJkZWNpbWFsIiBwbGFjZWhvbGRlcj0i4LiI4Liz4LiZ4Lin4LiZIiAnICsKICAgICAgICAndmFsdWU9IicgKyAobC5x',
  'dHkgPT0gbnVsbCA/ICcnIDogZXNjKGwucXR5KSkgKyAnIiBvbmlucHV0PSJzZXRMaW5lKCcgKyBpICsgJyxcJ3F0eVwnLHRoaXMudmFsdWUpIj4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBwbGFjZWhvbGRlcj0i4Lir4LiZ4LmI4Lin4LiiIiB2YWx1ZT0i',
  'JyArIGVzYyhsLnVuaXQgfHwgJycpICsgJyIgJyArCiAgICAgICAgJ29uaW5wdXQ9InNldExpbmUoJyArIGkgKyAnLFwndW5pdFwnLHRoaXMudmFsdWUpIj4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIG51bSIgdHlwZT0ibnVtYmVyIiBzdGVwPSJhbnkiIGlu',
  'cHV0bW9kZT0iZGVjaW1hbCIgcGxhY2Vob2xkZXI9IuC4o+C4suC4hOC4si/guKvguJnguYjguKfguKIiICcgKwogICAgICAgICd2YWx1ZT0iJyArIChsLnByaWNlID09IG51bGwgPyAnJyA6IGVzYyhsLnByaWNlKSkgKyAnIiBvbmlucHV0PSJzZXRMaW5lKCcgKyBp',
  'ICsgJyxcJ3ByaWNlXCcsdGhpcy52YWx1ZSkiPicgKwogICAgICAnPGRpdiBjbGFzcz0ibGluZS1zdW0iPicgKyBtb25leShsaW5lVG90YWwobCksIDIpICsgJzwvZGl2PicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20gZGdyIiB0',
  'aXRsZT0i4LmA4Lit4Liy4Lij4Liy4Lii4LiB4Liy4Lij4LiZ4Li14LmJ4Lit4Lit4LiBIiBvbmNsaWNrPSJkZWxMaW5lKCcgKyBpICsgJykiPsOXPC9idXR0b24+JyArCiAgICAnPC9kaXY+JzsKICB9KS5qb2luKCcnKTsKCiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJs',
  'aW5lLWhlYWQiPicgKwogICAgICAnPHNwYW4+4LiK4Li34LmI4Lit4Liq4Li04LiZ4LiE4LmJ4LiyPC9zcGFuPjxzcGFuIGNsYXNzPSJudW0iPuC4iOC4s+C4meC4p+C4mTwvc3Bhbj48c3Bhbj7guKvguJnguYjguKfguKI8L3NwYW4+JyArCiAgICAgICc8c3BhbiBj',
  'bGFzcz0ibnVtIj7guKPguLLguITguLIv4Lir4LiZ4LmI4Lin4LiiPC9zcGFuPjxzcGFuIGNsYXNzPSJudW0iPuC4o+C4p+C4oTwvc3Bhbj48c3Bhbj48L3NwYW4+JyArCiAgICAnPC9kaXY+JyArCiAgICAocm93cyB8fCAnPGRpdiBjbGFzcz0iaGludCIgc3R5bGU9',
  'InBhZGRpbmc6OHB4IDJweCI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4LijIOKAlCDguIHguJQg4oCc4LmA4Lie4Li04LmI4Lih4Lij4Liy4Lii4LiB4Liy4Lij4oCdIOC5gOC4nuC4t+C5iOC4reC5g+C4quC5iOC4quC4tOC4meC4hOC5',
  'ieC4suC4l+C4teC4peC4sOC4reC4ouC5iOC4suC4hzwvZGl2PicpICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQ4Ij4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJhZGRMaW5lKCkiPisg4LmA4Lie4Li04LmI',
  '4Lih4Lij4Liy4Lii4LiB4Liy4LijPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0icGFzdGVMaW5lcygpIj7wn5OLIOC4p+C4suC4h+C4l+C4teC5gOC4lOC4teC4ouC4p+C4q+C4peC4suC4ouC4',
  'o+C4suC4ouC4geC4suC4ozwvYnV0dG9uPicgKwogICAgICAnPGRpdiBjbGFzcz0ibGluZS10b3RhbCI+4Lij4Lin4Lih4LiE4LmI4Liy4Liq4Li04LiZ4LiE4LmJ4LiyIDxiPicgKyBtb25leShsaW5lc1N1bSgpLCAyKSArICcg4Li/PC9iPjwvZGl2PicgKwogICAg',
  'JzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIHJlZHJhd0xpbmVzKCl7CiAgdmFyIGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2xpbmVzJyk7CiAgaWYgKCFib3gpIHJldHVybjsKICBib3guaW5uZXJIVE1MID0gbGluZXNUYWJsZUh0bWwoKTsKICByZWNhbGNC',
  'aWxsKCk7Cn0KCmZ1bmN0aW9uIHNldExpbmUoaSwga2V5LCB2YWwpewogIGlmICghRk9STS5saW5lc1tpXSkgcmV0dXJuOwogIEZPUk0ubGluZXNbaV1ba2V5XSA9IChrZXkgPT09ICdxdHknIHx8IGtleSA9PT0gJ3ByaWNlJykgPyBudW1Pcih2YWwsIDApIDogdmFs',
  'OwogIC8vIOC5hOC4oeC5iOC4p+C4suC4lOC5g+C4q+C4oeC5iOC4l+C4seC5ieC4h+C4leC4suC4o+C4suC4hyDguYDguJTguLXguYvguKLguKfguYDguITguK3guKPguYzguYDguIvguK3guKPguYzguYDguJTguYnguIfguK3guK3guIHguIjguLLguIHguIrguYjg',
  'uK3guIfguJfguLXguYjguIHguLPguKXguLHguIfguJ7guLTguKHguJ7guYwKICB2YXIgcm93ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2ZfbGluZXMgLmxpbmUtcm93JylbaV07CiAgaWYgKHJvdykgcm93LnF1ZXJ5U2VsZWN0b3IoJy5saW5lLXN1bScp',
  'LnRleHRDb250ZW50ID0gbW9uZXkobGluZVRvdGFsKEZPUk0ubGluZXNbaV0pLCAyKTsKICB2YXIgdG90ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2ZfbGluZXMgLmxpbmUtdG90YWwgYicpOwogIGlmICh0b3QpIHRvdC50ZXh0Q29udGVudCA9IG1vbmV5KGxp',
  'bmVzU3VtKCksIDIpICsgJyDguL8nOwogIHJlY2FsY0JpbGwoKTsKfQoKZnVuY3Rpb24gYWRkTGluZSgpewogIEZPUk0ubGluZXMucHVzaCh7IG5hbWU6ICcnLCBxdHk6IDEsIHVuaXQ6ICcnLCBwcmljZTogMCB9KTsKICByZWRyYXdMaW5lcygpOwogIHZhciBpbnB1',
  'dHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjZl9saW5lcyAubGluZS1yb3cgLmlucCcpOwogIGlmIChpbnB1dHMubGVuZ3RoKSBpbnB1dHNbKEZPUk0ubGluZXMubGVuZ3RoIC0gMSkgKiA0XS5mb2N1cygpOwp9CgpmdW5jdGlvbiBkZWxMaW5lKGkpewog',
  'IEZPUk0ubGluZXMuc3BsaWNlKGksIDEpOwogIHJlZHJhd0xpbmVzKCk7Cn0KCi8qKgogKiDguKfguLLguIfguKPguLLguKLguIHguLLguKPguIjguLLguIHguKvguJnguYnguLLguITguLPguKrguLHguYjguIfguIvguLfguYnguK3guJfguLXguYDguJTguLXguKLg',
  'uKfguJfguLHguYnguIfguIHguYnguK3guJkg4LmB4Lil4LmJ4Lin4LmD4Lir4LmJ4Lij4Liw4Lia4Lia4LmB4Lii4LiB4Lia4Lij4Lij4LiX4Lix4LiU4LmD4Lir4LmJCiAqCiAqIOC4l+C4s+C5gOC4m+C5h+C4meC4iuC5iOC4reC4h+C4nuC4seC4muC5gOC4geC5',
  'h+C4muC4reC4ouC4ueC5iOC5g+C4meC4n+C4reC4o+C5jOC4oeC5gOC4lOC4tOC4oSDguYTguKHguYjguYDguJvguLTguJTguKvguJnguYnguLLguJXguYjguLLguIfguIvguYnguK3guJkKICog4LmA4Lie4Lij4Liy4LiwIG9wZW5Nb2RhbCgpIOC5gOC4guC4teC4',
  'ouC4meC4l+C4seC4muC4q+C4meC5ieC4suC4leC5iOC4suC4h+C5gOC4lOC4tOC4oSDguJbguYnguLLguYDguJvguLTguJTguIvguYnguK3guJnguJ/guK3guKPguYzguKHguJfguLXguYjguIHguKPguK3guIHguITguYnguLLguIfguYTguKfguYnguIjguLDguKvg',
  'uLLguKLguJfguLHguYnguIfguYPguJoKICovCmZ1bmN0aW9uIHBhc3RlTGluZXMoKXsKICB2YXIgYm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Bhc3RlV3JhcCcpOwogIGlmIChib3gpIHsgYm94LmhpZGRlbiA9ICFib3guaGlkZGVuOyBpZiAoIWJveC5o',
  'aWRkZW4pIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXN0ZUJveCcpLmZvY3VzKCk7IHJldHVybjsgfQoKICB2YXIgaG9zdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2xpbmVzJyk7CiAgaWYgKCFob3N0KSByZXR1cm47CiAgdmFyIHdyYXAgPSBkb2N1',
  'bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICB3cmFwLmlkID0gJ3Bhc3RlV3JhcCc7CiAgd3JhcC5jbGFzc05hbWUgPSAnbXQ4JzsKICB3cmFwLmlubmVySFRNTCA9CiAgICAnPHRleHRhcmVhIGNsYXNzPSJ0YSIgaWQ9InBhc3RlQm94IiBzdHlsZT0ibWluLWhl',
  'aWdodDoxMjBweCIgJyArCiAgICAgICdwbGFjZWhvbGRlcj0i4Lib4Lix4LmK4Lih4LiZ4LmJ4LizIDc1MFcgfCAxIHwg4LmA4LiE4Lij4Li34LmI4Lit4LiHIHwgNDI1MCYjMTA74Liq4Liy4Lii4LmE4LifIFZBRiAyeDEuNSB8IDIwIHwg4LmA4Lih4LiV4LijIHwg',
  'MTcuNSYjMTA74LmA4LiX4Lib4Lie4Lix4LiZ4Liq4Liy4Lii4LmE4LifIDQ1Ij48L3RleHRhcmVhPicgKwogICAgJzxkaXYgY2xhc3M9ImhpbnQgbXQ4Ij7guITguLHguYjguJnguJTguYnguKfguKIgPGI+fDwvYj4g4LiV4Liy4Lih4Lil4Liz4LiU4Lix4LiaIOC4',
  'iuC4t+C5iOC4rSDCtyDguIjguLPguJnguKfguJkgwrcg4Lir4LiZ4LmI4Lin4LiiIMK3IOC4o+C4suC4hOC4suC4leC5iOC4reC4q+C4meC5iOC4p+C4ojxicj4nICsKICAgICAgJ+C4luC5ieC4suC4p+C4suC4h+C4oeC4suC5gOC4m+C5h+C4meC4guC5ieC4reC4',
  'hOC4p+C4suC4oeC4mOC4o+C4o+C4oeC4lOC4siDguKPguLDguJrguJrguIjguLDguJ7guKLguLLguKLguLLguKHguYHguKLguIHguIrguLfguYjguK3guIHguLHguJrguKPguLLguITguLLguYPguKvguYnguYDguK3guIc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNz',
  'PSJyb3cgbXQ4Ij4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIHByaSIgb25jbGljaz0iYXBwbHlQYXN0ZWRMaW5lcygpIj7guYDguJ7guLTguYjguKHguYDguILguYnguLLguKPguLLguKLguIHguLLguKM8L2J1dHRvbj4nICsK',
  'ICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcJ3Bhc3RlV3JhcFwnKS5oaWRkZW49dHJ1ZSI+4Lib4Li04LiUPC9idXR0b24+JyArCiAgICAnPC9kaXY+JzsKICBob3N0LmFw',
  'cGVuZENoaWxkKHdyYXApOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXN0ZUJveCcpLmZvY3VzKCk7Cn0KCmZ1bmN0aW9uIGFwcGx5UGFzdGVkTGluZXMoKXsKICB2YXIgdGV4dCA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFzdGVCb3gnKSB8fCB7',
  'fSkudmFsdWUgfHwgJyc7CiAgdmFyIGFkZGVkID0gdGV4dC5zcGxpdCgvXHI/XG4vKS5tYXAoZnVuY3Rpb24ocyl7IHJldHVybiBzLnRyaW0oKTsgfSkuZmlsdGVyKEJvb2xlYW4pLm1hcChmdW5jdGlvbihyYXcpewogICAgaWYgKHJhdy5pbmRleE9mKCd8JykgPj0g',
  'MCkgcmV0dXJuIHBhcnNlTGluZXNUZXh0KHJhdylbMF07CiAgICAvLyDguYTguKHguYjguKHguLUgfCDigJQg4LmA4LiU4Liy4LiI4Liy4LiB4LiV4Lix4Lin4LmA4Lil4LiC4LiX4LmJ4Liy4Lii4Lia4Lij4Lij4LiX4Lix4LiU4Lin4LmI4Liy4LmA4Lib4LmH4LiZ',
  '4Lij4Liy4LiE4LiyCiAgICB2YXIgbSA9IHJhdy5tYXRjaCgvXiguKj8pW1xzOnjDl10qKFtcZCxdKyg/OlwuXGQrKT8pXHMqKD864Lia4Liy4LiXfOC4vyk/JC8pOwogICAgaWYgKG0gJiYgbVsxXS50cmltKCkpIHJldHVybiB7IG5hbWU6IG1bMV0udHJpbSgpLCBx',
  'dHk6IDEsIHVuaXQ6ICcnLCBwcmljZTogbnVtT3IobVsyXSwgMCkgfTsKICAgIHJldHVybiB7IG5hbWU6IHJhdywgcXR5OiAxLCB1bml0OiAnJywgcHJpY2U6IDAgfTsKICB9KS5maWx0ZXIoQm9vbGVhbik7CgogIGlmICghYWRkZWQubGVuZ3RoKSByZXR1cm4gdG9h',
  'c3QoJ+C5hOC4oeC5iOC4nuC4muC4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4reC5iOC4suC4meC5hOC4lOC5iScsICdlcnInKTsKICBGT1JNLmxpbmVzID0gKEZPUk0ubGluZXMgfHwgW10pLmZpbHRlcihmdW5jdGlvbihsKXsgcmV0dXJuIFN0cmluZyhsLm5h',
  'bWUgfHwgJycpLnRyaW0oKTsgfSkuY29uY2F0KGFkZGVkKTsKICByZWRyYXdMaW5lcygpOyAgIC8vIOC4p+C4suC4lOC5g+C4q+C4oeC5iOC5geC4peC5ieC4p+C4iuC5iOC4reC4h+C4p+C4suC4h+C4iOC4sOC4q+C4suC4ouC5hOC4m+C5gOC4reC4hyDguYDguJ7g',
  'uKPguLLguLDguK3guKLguLnguYjguILguYnguLLguIfguYPguJkgZl9saW5lcwogIHRvYXN0KCfguYDguJ7guLTguYjguKHguYPguKvguYkgJyArIGFkZGVkLmxlbmd0aCArICcg4Lij4Liy4Lii4LiB4Liy4LijIOKAlCDguJXguKPguKfguIjguJXguLHguKfguYDg',
  'uKXguILguK3guLXguIHguITguKPguLHguYnguIfguIHguYjguK3guJnguJrguLHguJnguJfguLbguIEnLCAnb2snKTsKfQoKLyoqCiAqIOC4hOC4tOC4lOC4ouC4reC4lOC4o+C4p+C4oeC4guC4reC4h+C4muC4tOC4pSA9IOC4hOC5iOC4suC4quC4tOC4meC4hOC5',
  'ieC4siArIOC4hOC5iOC4suC4quC5iOC4hyDiiJIg4Liq4LmI4Lin4LiZ4Lil4LiUIOC5geC4peC5ieC4p+C5gOC4leC4tOC4oeC4peC4h+C4iuC5iOC4reC4hyAi4Lij4Liy4LiE4Liy4Lij4Lin4LihIgogKiDguYPguKvguYnguJXguKPguIfguIHguLHguJrguJfg',
  'uLXguYjguJ3guLHguYjguIfguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYzguITguLTguJTguJXguK3guJnguJrguLHguJnguJfguLbguIEg4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4Lih4Li14LiX4Liy4LiH4LiX4Li14LmI4LiV4Lix4Lin4LmA4Lil',
  '4LiC4Liq4Lit4LiH4Lid4Lix4LmI4LiH4LmE4Lih4LmI4LiV4Lij4LiH4LiB4Lix4LiZCiAqLwpmdW5jdGlvbiByZWNhbGNCaWxsKCl7CiAgaWYgKCFkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9saW5lcycpKSByZXR1cm47CiAgdmFyIHByaWNlID0gZG9jdW1l',
  'bnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfcHJpY2UnKTsKICBpZiAoIXByaWNlKSByZXR1cm47CiAgdmFyIG4gPSAoRk9STS5saW5lcyB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uKGwpeyByZXR1cm4gU3RyaW5nKGwubmFtZSB8fCAnJykudHJpbSgpIHx8IE51bWJlcihsLnBy',
  'aWNlKTsgfSkubGVuZ3RoOwogIGlmICghbikgeyBwcmljZS5yZWFkT25seSA9IGZhbHNlOyBwcmljZS5zdHlsZS5iYWNrZ3JvdW5kID0gJyc7IHJldHVybjsgfQoKICB2YXIgc2hpcCA9IE51bWJlcigoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Zfc2hpcHBpbmcn',
  'KSB8fCB7fSkudmFsdWUpIHx8IDA7CiAgdmFyIGRpc2MgPSBOdW1iZXIoKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2Rpc2NvdW50JykgfHwge30pLnZhbHVlKSB8fCAwOwogIHByaWNlLnZhbHVlID0gTWF0aC5yb3VuZCgobGluZXNTdW0oKSArIHNoaXAgLSBk',
  'aXNjKSAqIDEwMCkgLyAxMDA7CiAgcHJpY2UucmVhZE9ubHkgPSB0cnVlOyAgICAgICAgICAgICAgICAgICAgICAgLy8g4Lih4Li14Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4Lii4LmB4Lil4LmJ4LinIOC4q+C5ieC4suC4oeC4nuC4tOC4oeC4nuC5jOC4l+C4',
  'seC4muC5g+C4q+C5ieC5hOC4oeC5iOC4leC4o+C4h+C4geC4seC4mQogIHByaWNlLnN0eWxlLmJhY2tncm91bmQgPSAndmFyKC0tc3VyZmFjZS0yKSc7CiAgcHJpY2UudGl0bGUgPSAn4LiE4Li04LiU4LiI4Liy4LiB4Lij4Liy4Lii4LiB4Liy4Lij4LmD4LiZ4Lia',
  '4Li04Lil4LmD4Lir4LmJ4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0IOKAlCDguYHguIHguYnguJfguLXguYjguKPguLLguKLguIHguLLguKPguKLguYjguK3guKIg4LiE4LmI4Liy4Liq4LmI4LiHIOC4q+C4o+C4t+C4reC4quC5iOC4p+C4meC4peC4lCc7Cgog',
  'IHZhciBoaW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JpbGxIaW50Jyk7CiAgaWYgKGhpbnQpIHsKICAgIGhpbnQuaW5uZXJIVE1MID0gbiArICcg4Lij4Liy4Lii4LiB4Liy4LijIMK3IOC4hOC5iOC4suC4quC4tOC4meC4hOC5ieC4siAnICsgbW9uZXko',
  'bGluZXNTdW0oKSwgMikgKwogICAgICAoc2hpcCA/ICcgKyDguITguYjguLLguKrguYjguIcgJyArIG1vbmV5KHNoaXAsIDIpIDogJycpICsKICAgICAgKGRpc2MgPyAnIOKIkiDguKrguYjguKfguJnguKXguJQgJyArIG1vbmV5KGRpc2MsIDIpIDogJycpOwogIH0K',
  'fQoKLyoqIOC4reC4seC4m+C5gOC4lOC4leC4iuC5iOC4reC4h+C4nOC4peC4o+C4p+C4oeC4l+C4uOC4geC4iuC5iOC4reC4h+C5g+C4meC4n+C4reC4o+C5jOC4oeC4m+C4seC4iOC4iOC4uOC4muC4seC4mSAqLwpmdW5jdGlvbiByZWNhbGNTdW1zKCl7CiAgKEZP',
  'Uk0uc3BlY3MgfHwgW10pLmZvckVhY2goZnVuY3Rpb24oZil7CiAgICBpZiAoZi50eXBlICE9PSAnY29tcHV0ZWQnIHx8ICFmLmZyb20pIHJldHVybjsKICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmXycgKyBmLmtleSk7CiAgICBpZiAoIWVs',
  'KSByZXR1cm47CiAgICB2YXIgdG90YWwgPSAwOwogICAgZi5mcm9tLmZvckVhY2goZnVuY3Rpb24oayl7CiAgICAgIHZhciBpID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyArIGspOwogICAgICBpZiAoaSkgdG90YWwgKz0gTnVtYmVyKGkudmFsdWUpIHx8',
  'IDA7CiAgICB9KTsKICAgIGVsLnRleHRDb250ZW50ID0gdG90YWwudG9Mb2NhbGVTdHJpbmcoJ3RoLVRIJywgeyBtaW5pbXVtRnJhY3Rpb25EaWdpdHM6IDAsIG1heGltdW1GcmFjdGlvbkRpZ2l0czogMiB9KSArICcg4Li/JzsKICAgIGVsLnN0eWxlLmNvbG9yID0g',
  'dG90YWwgPiAwID8gJ3ZhcigtLW9rKScgOiAndmFyKC0tbXV0ZWQpJzsKICB9KTsKfQoKZnVuY3Rpb24gZXhpc3RpbmdGaWxlc0h0bWwoa2V5KXsKICB2YXIgbGlzdCA9IEZPUk0ua2VlcFtrZXldIHx8IFtdOwogIGlmICghbGlzdC5sZW5ndGgpIHJldHVybiAnJzsK',
  'ICByZXR1cm4gJzxkaXYgY2xhc3M9InRodW1icyBtYjgiPicgKyBsaXN0Lm1hcChmdW5jdGlvbih1cmwsIGkpewogICAgdmFyIGlkID0gU3RyaW5nKHVybCkubWF0Y2goL1stXHddezIwLH0vKTsKICAgIHZhciB0aHVtYiA9IGlkID8gJ2h0dHBzOi8vZHJpdmUuZ29v',
  'Z2xlLmNvbS90aHVtYm5haWw/aWQ9JyArIGlkWzBdICsgJyZzej13MjAwJyA6ICcnOwogICAgcmV0dXJuICc8c3BhbiBzdHlsZT0icG9zaXRpb246cmVsYXRpdmU7ZGlzcGxheTppbmxpbmUtYmxvY2siPicgKwogICAgICAodGh1bWIgPyAnPGltZyBjbGFzcz0idGh1',
  'bWIiIHNyYz0iJyArIGVzYyh0aHVtYikgKyAnIiBvbmNsaWNrPSJ3aW5kb3cub3BlbihcJycgKyBlc2ModXJsKSArICdcJyxcJ19ibGFua1wnKSI+JwogICAgICAgICAgICAgOiAnPGEgY2xhc3M9ImIgaW5mbyIgaHJlZj0iJyArIGVzYyh1cmwpICsgJyIgdGFyZ2V0',
  'PSJfYmxhbmsiPuC5hOC4n+C4peC5jCAnICsgKGkrMSkgKyAnPC9hPicpICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBvbmNsaWNrPSJkcm9wRmlsZShcJycgKyBrZXkgKyAnXCcsJyArIGkgKyAnKSIgdGl0bGU9IuC5gOC4reC4suC4reC4reC4gSIgJyAr',
  'CiAgICAgICdzdHlsZT0icG9zaXRpb246YWJzb2x1dGU7dG9wOi02cHg7cmlnaHQ6LTZweDtiYWNrZ3JvdW5kOnZhcigtLWRhbmdlcik7Y29sb3I6I2ZmZjtib3JkZXI6MDtib3JkZXItcmFkaXVzOjk5cHg7d2lkdGg6MThweDtoZWlnaHQ6MThweDtsaW5lLWhlaWdo',
  'dDoxO2N1cnNvcjpwb2ludGVyO2ZvbnQtc2l6ZToxMnB4Ij7DlzwvYnV0dG9uPicgKwogICAgICAnPC9zcGFuPic7CiAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gZHJvcEZpbGUoa2V5LCBpZHgpewogIEZPUk0ua2VlcFtrZXldLnNwbGljZShp',
  'ZHgsIDEpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmXycgKyBrZXkgKyAnX2V4aXN0aW5nJykuaW5uZXJIVE1MID0gZXhpc3RpbmdGaWxlc0h0bWwoa2V5KTsKfQoKZnVuY3Rpb24gcHJldmlld1BpY2tlZChpbnB1dCwgaWQpewogIHZhciBib3ggPSBkb2N1',
  'bWVudC5nZXRFbGVtZW50QnlJZChpZCArICdfcHJldmlldycpOwogIHZhciBmaWxlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGlucHV0LmZpbGVzIHx8IFtdKTsKICBib3guaW5uZXJIVE1MID0gZmlsZXMubWFwKGZ1bmN0aW9uKGYpewogICAgcmV0dXJu',
  'ICc8c3BhbiBjbGFzcz0iYiBpbmZvIj4nICsgZXNjKGYubmFtZS5zbGljZSgwLDI2KSkgKyAnIMK3ICcgKyBNYXRoLnJvdW5kKGYuc2l6ZS8xMDI0KSArICcgS0I8L3NwYW4+JzsKICB9KS5qb2luKCcgJyk7CgogIHZhciBzbG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVu',
  'dEJ5SWQoaWQgKyAnX29jcicpOwogIGlmICghc2xvdCkgcmV0dXJuOwogIHNsb3QuaW5uZXJIVE1MID0gJyc7CiAgaWYgKCFvY3JVc2FibGUoKSB8fCAhZmlyc3RSZWFkYWJsZShmaWxlcykpIHJldHVybjsKCiAgdmFyIG1vZGUgPSAoUy5ib290LnNldHRpbmdzICYm',
  'IFMuYm9vdC5zZXR0aW5ncy5vY3JBdXRvZmlsbCkgfHwgJ+C4luC4suC4oeC4geC5iOC4reC4meC5gOC4leC4tOC4oSc7CiAgaWYgKG1vZGUgPT09ICfguYTguKHguYjguYDguJXguLTguKEnKSByZXR1cm47CiAgaWYgKG1vZGUgPT09ICfguYDguJXguLTguKHguYPg',
  'uKvguYnguYDguKXguKInKSByZXR1cm4gcnVuT2NyKGlkLCB0cnVlKTsKCiAgc2xvdC5pbm5lckhUTUwgPQogICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIG10OCIgb25jbGljaz0icnVuT2NyKFwnJyArIGlkICsgJ1wnKSI+JyArCiAgICAn',
  '8J+UjiDguK3guYjguLLguJnguILguYnguK3guITguKfguLLguKHguIjguLLguIHguKPguLnguJvguJnguLXguYkg4LmB4Lil4LmJ4Lin4LiK4LmI4Lin4Lii4LiB4Lij4Lit4LiB4LmD4Lir4LmJPC9idXR0b24+JzsKfQoKLyoqIOC4reC5iOC4suC4meC4hOC5iOC4',
  'suC4iOC4suC4geC4n+C4reC4o+C5jOC4oSArIOC4reC4seC4m+C5guC4q+C4peC4lOC5hOC4n+C4peC5jOC5g+C4q+C4oeC5iCDguYHguKXguYnguKfguITguLfguJkgb2JqZWN0IOC4nuC4o+C5ieC4reC4oeC4muC4seC4meC4l+C4tuC4gSAqLwpmdW5jdGlvbiBy',
  'ZWFkRm9ybShzcGVjcywgYnVja2V0KXsKICB2YXIgb3V0ID0ge307CiAgdmFyIHVwbG9hZHMgPSBbXTsKCiAgc3BlY3MuZm9yRWFjaChmdW5jdGlvbihmKXsKICAgIGlmIChmLnR5cGUgPT09ICdjb21wdXRlZCcpIHJldHVybjsgICAgICAgICAgLy8g4LiK4LmI4Lit',
  '4LiH4LiE4Liz4LiZ4Lin4LiTIOC5hOC4oeC5iOC4leC5ieC4reC4h+C4muC4seC4meC4l+C4tuC4gQogICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyArIGYua2V5KTsKICAgIGlmICghZWwpIHJldHVybjsKICAgIGlmIChmLnR5cGUgPT09',
  'ICdmaWxlcycpIHsKICAgICAgdXBsb2Fkcy5wdXNoKAogICAgICAgIHVwbG9hZEZpbGVzKGVsLCBidWNrZXQpLnRoZW4oZnVuY3Rpb24ocmVmcyl7CiAgICAgICAgICBvdXRbZi5rZXldID0gKEZPUk0ua2VlcFtmLmtleV0gfHwgW10pLmNvbmNhdChyZWZzLm1hcChm',
  'dW5jdGlvbihyKXsgcmV0dXJuIHIudXJsOyB9KSk7CiAgICAgICAgfSkKICAgICAgKTsKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnbGluZXMnKSB7CiAgICAgIG91dFtmLmtleV0gPSBmb3JtYXRMaW5lc1RleHQoRk9STS5saW5lcyk7CiAgICB9IGVsc2UgaWYg',
  'KGYudHlwZSA9PT0gJ251bWJlcicgfHwgZi50eXBlID09PSAnbW9uZXknKSB7CiAgICAgIG91dFtmLmtleV0gPSBlbC52YWx1ZSA9PT0gJycgPyBudWxsIDogTnVtYmVyKGVsLnZhbHVlKTsKICAgIH0gZWxzZSB7CiAgICAgIG91dFtmLmtleV0gPSBlbC52YWx1ZTsK',
  'ICAgIH0KICB9KTsKCiAgcmV0dXJuIFByb21pc2UuYWxsKHVwbG9hZHMpLnRoZW4oZnVuY3Rpb24oKXsgcmV0dXJuIG91dDsgfSk7Cn0KCi8qKiDguYLguITguKPguIfguJ/guK3guKPguYzguKHguKHguLLguJXguKPguJDguLLguJk6IOC5gOC4m+C4tOC4lCBtb2Rh',
  'bCwg4LiI4Lix4LiU4LiB4Liy4Lij4Lib4Li44LmI4Lih4Lia4Lix4LiZ4LiX4Li24LiBLCDguKPguLXguYLguKvguKXguJTguKvguJnguYnguLIgKi8KZnVuY3Rpb24gb3BlbkZvcm0ob3B0cyl7CiAgdmFyIHJlYyA9IG9wdHMucmVjb3JkIHx8IHt9OwogIEZPUk0u',
  'b2NyID0gb3B0cy5vY3IgfHwgbnVsbDsKICBGT1JNLnJlYyA9IHJlYy5pZCA/IHJlYyA6IG51bGw7ICAgLy8g4LiI4Liz4LmE4Lin4LmJ4Lin4LmI4Liy4LiB4Liz4Lil4Lix4LiH4LmB4LiB4LmJ4LiC4Lit4LiH4LmA4LiU4Li04LihIOC4q+C4o+C4t+C4reC4geC4',
  's+C4peC4seC4h+C5gOC4nuC4tOC5iOC4oeC5g+C4q+C4oeC5iAogIG9wZW5Nb2RhbChvcHRzLnRpdGxlLAogICAgZmllbGRzSHRtbChvcHRzLmZpZWxkcywgcmVjKSwKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lii4LiB',
  '4LmA4Lil4Li04LiBPC9idXR0b24+JyArCiAgICAocmVjLmlkICYmIG9wdHMub25EZWxldGUgPyAnPGJ1dHRvbiBjbGFzcz0iYnRuIGRnciIgaWQ9ImZEZWwiPuC4peC4muC4o+C4suC4ouC4geC4suC4o+C4meC4teC5iTwvYnV0dG9uPicgOiAnJykgKwogICAgJzxi',
  'dXR0b24gY2xhc3M9ImJ0biBwcmkiIGlkPSJmU2F2ZSI+JyArIChyZWMuaWQgPyAn4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4LmB4LiB4LmJ4LmE4LiCJyA6ICfguJrguLHguJnguJfguLbguIEnKSArICc8L2J1dHRvbj4nLAogICAgb3B0cy53aWRlKTsKCiAg',
  'aWYgKHJlYy5pZCAmJiBvcHRzLm9uRGVsZXRlKSB7CiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZkRlbCcpLm9uY2xpY2sgPSBmdW5jdGlvbigpeyBjbG9zZU1vZGFsKCk7IG9wdHMub25EZWxldGUocmVjLmlkKTsgfTsKICB9CgogIHJlY2FsY1N1bXMoKTsK',
  'ICByZWNhbGNCaWxsKCk7CgogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmU2F2ZScpLm9uY2xpY2sgPSBmdW5jdGlvbigpewogICAgdmFyIGJ0biA9IHRoaXM7CiAgICBidG4uZGlzYWJsZWQgPSB0cnVlOwogICAgYnRuLmlubmVySFRNTCA9ICc8c3BhbiBjbGFz',
  'cz0ic3BpbiI+PC9zcGFuPiDguIHguLPguKXguLHguIfguJrguLHguJnguJfguLbguIHigKYnOwoKICAgIHJlYWRGb3JtKG9wdHMuZmllbGRzLCBvcHRzLmJ1Y2tldCB8fCAnbWlzYycpLnRoZW4oZnVuY3Rpb24oZGF0YSl7CiAgICAgIHZhciBtaXNzaW5nID0gb3B0',
  'cy5maWVsZHMuZmlsdGVyKGZ1bmN0aW9uKGYpewogICAgICAgIHJldHVybiBmLnJlcXVpcmVkICYmIChkYXRhW2Yua2V5XSA9PSBudWxsIHx8IGRhdGFbZi5rZXldID09PSAnJyk7CiAgICAgIH0pOwogICAgICBpZiAobWlzc2luZy5sZW5ndGgpIHRocm93IG5ldyBF',
  'cnJvcign4LiB4Lij4Li44LiT4Liy4LiB4Lij4Lit4LiBOiAnICsgbWlzc2luZy5tYXAoZnVuY3Rpb24oZil7IHJldHVybiBmLmxhYmVsOyB9KS5qb2luKCcsICcpKTsKCiAgICAgIHZhciByZWNvcmQgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRzLmJhc2UgfHwge30s',
  'IGRhdGEpOwogICAgICBpZiAocmVjLmlkKSByZWNvcmQuaWQgPSByZWMuaWQ7CiAgICAgIHJldHVybiBjYWxsQXBpKG9wdHMuYWN0aW9uLCBPYmplY3QuYXNzaWduKHsgcmVjb3JkOiByZWNvcmQgfSwgb3B0cy5leHRyYSB8fCB7fSkpOwogICAgfSkudGhlbihmdW5j',
  'dGlvbigpewogICAgICBjbG9zZU1vZGFsKCk7CiAgICAgIC8vIOC4leC4seC4p+C4muC4reC4geC4quC4luC4suC4meC4sOC4oeC4uOC4oeC4guC4p+C4suC4muC4meC4guC4tuC5ieC4mSAi4Lia4Lix4LiZ4LiX4Li24LiB4LmB4Lil4LmJ4LinIiDguYPguKvguYng',
  'uK3guKLguLnguYjguYHguKXguYnguKcg4LiI4Li24LiH4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LmA4LiU4LmJ4LiHIHRvYXN0IOC4i+C5ieC4swogICAgICAvLyDguYHguKXguYnguKfguIvguLTguIfguIHguYzguYDguIfguLXguKLguJog4LmGIOC5hOC4oeC5iOC4',
  'peC5ieC4suC4h+C4q+C4meC5ieC4suC5geC4peC4sOC5hOC4oeC5iOC5gOC4lOC5ieC4h+C4geC4peC4seC4muC5hOC4m+C4muC4meC4quC4uOC4lAogICAgICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgYnRu',
  'LmRpc2FibGVkID0gZmFsc2U7CiAgICAgIGJ0bi50ZXh0Q29udGVudCA9IHJlYy5pZCA/ICfguJrguLHguJnguJfguLbguIHguIHguLLguKPguYHguIHguYnguYTguIInIDogJ+C4muC4seC4meC4l+C4tuC4gSc7CiAgICAgIHRvYXN0KGUubWVzc2FnZSB8fCBlLCAn',
  'ZXJyJyk7CiAgICB9KTsKICB9Owp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lit4LmI4Liy4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiI4Liy4LiB4Lij4Li54LibIChPQ1IpIOC5',
  'geC4peC5ieC4p+C4iuC5iOC4p+C4ouC4geC4o+C4reC4geC4n+C4reC4o+C5jOC4oQoKICAg4LiX4Li44LiB4LiE4LmI4Liy4LiX4Li14LmI4LmE4LiU4LmJ4LmA4Lib4LmH4LiZ4LmB4LiE4LmI4LiC4LmJ4Lit4LmA4Liq4LiZ4LitIOC4nOC4ueC5ieC5g+C4iuC5',
  'ieC4geC4lOC5gOC4leC4tOC4oeC5gOC4reC4h+C4l+C4teC4peC4sOC4iuC5iOC4reC4h+C4q+C4o+C4t+C4reC5gOC4leC4tOC4oeC4l+C4seC5ieC4h+C4q+C4oeC4lOC4geC5h+C5hOC4lOC5iQogICDguYHguKXguLDguYHguIHguYnguYTguILguJXguYjguK3g',
  'uYTguJTguYnguYDguKrguKHguK0g4LmA4Lie4Lij4Liy4Liw4LiV4Lix4Lin4Lit4LmI4Liy4LiZ4Lie4Lil4Liy4LiU4LmE4LiU4LmJIOC5guC4lOC4ouC5gOC4ieC4nuC4suC4sOC4peC4suC4ouC4oeC4t+C4reC4geC4seC4muC4o+C4ueC4m+C5gOC4reC4teC4',
  'ouC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCnZhciBPQ1JfTUFYID0gOCAqIDEwMjQgKiAxMDI0OyAgIC8vIOC4o+C4ueC4m+C5g+C4q+C4jeC5iOC4geC4p+C5iOC4suC4meC4teC5',
  'ieC4quC5iOC4h+C5hOC4m+C4reC5iOC4suC4meC5geC4peC5ieC4p+C4oeC4seC4geC4q+C4oeC4lOC5gOC4p+C4peC4sgoKZnVuY3Rpb24gb2NyVXNhYmxlKCl7CiAgcmV0dXJuICEhKEZPUk0ub2NyICYmIFMuYm9vdCAmJiBTLmJvb3Quc2V0dGluZ3MgJiYgUy5i',
  'b290LnNldHRpbmdzLm9jckVuYWJsZWQpOwp9CgovKiog4Lij4Li54Lib4LmB4Lij4LiB4LiX4Li14LmI4Lie4Lit4Lit4LmI4Liy4LiZ4LmE4LiU4LmJICjguILguYnguLLguKHguYTguJ/guKXguYzguYPguKvguI3guYjguYDguIHguLTguJnguYHguKXguLDguYTg',
  'uJ/guKXguYzguJfguLXguYjguYTguKHguYjguYPguIrguYjguKPguLnguJsvUERGKSAqLwpmdW5jdGlvbiBmaXJzdFJlYWRhYmxlKGZpbGVzKXsKICBmb3IgKHZhciBpID0gMDsgaSA8IGZpbGVzLmxlbmd0aDsgaSsrKSB7CiAgICB2YXIgZiA9IGZpbGVzW2ldOwog',
  'ICAgaWYgKGYuc2l6ZSA8PSBPQ1JfTUFYICYmIC9eaW1hZ2VcL3xwZGYkLy50ZXN0KGYudHlwZSB8fCAnJykpIHJldHVybiBmOwogIH0KICByZXR1cm4gbnVsbDsKfQoKLyoqCiAqIEBwYXJhbSB7c3RyaW5nfSBpZCAgaWQg4LiC4Lit4LiH4LiK4LmI4Lit4LiH4LmB',
  '4LiZ4Lia4LmE4Lif4Lil4LmMIOC5gOC4iuC5iOC4mSBmX3NsaXBzCiAqIEBwYXJhbSB7Ym9vbGVhbn0gYXV0byB0cnVlID0g4LmA4LiV4Li04Lih4LiK4LmI4Lit4LiH4LiX4Li14LmI4Lii4Lix4LiH4Lin4LmI4Liy4LiH4LmD4Lir4LmJ4LmA4Lil4Lii4LmC4LiU',
  '4Lii4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LiB4LiUCiAqLwpmdW5jdGlvbiBydW5PY3IoaWQsIGF1dG8pewogIHZhciBpbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTsKICB2YXIgc2xvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkICsgJ19v',
  'Y3InKTsKICBpZiAoIWlucHV0IHx8ICFzbG90KSByZXR1cm47CgogIHZhciBmaWxlID0gZmlyc3RSZWFkYWJsZShBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChpbnB1dC5maWxlcyB8fCBbXSkpOwogIGlmICghZmlsZSkgeyBzbG90LmlubmVySFRNTCA9ICc8ZGl2',
  'IGNsYXNzPSJoaW50IG10OCI+4LmE4Lih4LmI4Lih4Li14Lij4Li54Lib4LiX4Li14LmI4Lit4LmI4Liy4LiZ4LmE4LiU4LmJICjguKPguK3guIfguKPguLHguJrguKPguLnguJvguKDguLLguJ7guYHguKXguLAgUERGIOC5hOC4oeC5iOC5gOC4geC4tOC4mSA4IE1C',
  'KTwvZGl2Pic7IHJldHVybjsgfQoKICBzbG90LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJvY3ItYm94Ij48ZGl2IGNsYXNzPSJoZCI+PHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4Lit4LmI4Liy4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy',
  '4Lih4LiI4Liy4LiBICcgKwogICAgICAgICAgICAgICAgICAgZXNjKGZpbGUubmFtZS5zbGljZSgwLCAyOCkpICsgJ+KApjwvZGl2PjwvZGl2Pic7CgogIHJlYWRBc0RhdGFVcmwoZmlsZSkudGhlbihmdW5jdGlvbihwKXsKICAgIHJldHVybiBjYWxsQXBpKCdvY3Iu',
  'cmVhZCcsIHsgZGF0YVVybDogcC5kYXRhVXJsLCBtaW1lVHlwZTogcC5taW1lVHlwZSB9KTsKICB9KS50aGVuKGZ1bmN0aW9uKHIpewogICAgc2xvdC5pbm5lckhUTUwgPSBvY3JCb3hIdG1sKGlkLCByKTsKICAgIE9DUl9MQVNUW2lkXSA9IHI7CiAgICBpZiAoYXV0',
  'bykgewogICAgICB2YXIgbiA9IG9jckFwcGx5QWxsKGlkLCB0cnVlKTsKICAgICAgdG9hc3QobiA/ICfguK3guYjguLLguJnguKPguLnguJvguYHguKXguYnguKcg4LmA4LiV4Li04Lih4LmD4Lir4LmJICcgKyBuICsgJyDguIrguYjguK3guIcg4oCUIOC4leC4o+C4',
  'p+C4iOC4lOC4ueC4geC5iOC4reC4meC4muC4seC4meC4l+C4tuC4geC4meC4sCcgOiAn4Lit4LmI4Liy4LiZ4Lij4Li54Lib4LmB4Lil4LmJ4LinIOC5geC4leC5iOC4ouC4seC4h+C4iOC4seC4muC4hOC5iOC4suC4l+C4teC5iOC5g+C4iuC5ieC5hOC4lOC5ieC5',
  'hOC4oeC5iOC5hOC4lOC5iScsIG4gPyAnb2snIDogJycpOwogICAgfQogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgc2xvdC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz0ib2NyLWJveCI+PGRpdiBjbGFzcz0iaGQiPuKaoO+4jyDguK3guYjguLLguJnguKPguLng',
  'uJvguYTguKHguYjguKrguLPguYDguKPguYfguIg8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImhpbnQiPicgKyBlc2MoZS5tZXNzYWdlIHx8IGUpICsgJzwvZGl2PicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20gbXQ4IiBv',
  'bmNsaWNrPSJydW5PY3IoXCcnICsgaWQgKyAnXCcpIj7guKXguK3guIfguK3guLXguIHguITguKPguLHguYnguIc8L2J1dHRvbj48L2Rpdj4nOwogIH0pOwp9Cgp2YXIgT0NSX0xBU1QgPSB7fTsKCi8qKiDguITguYjguLLguJfguLXguYjguK3guYjguLLguJnguYTg',
  'uJTguYkg4LiE4Li54LmI4LiB4Lix4Lia4LiK4LmI4Lit4LiH4LmD4LiZ4Lif4Lit4Lij4LmM4Lih4LiX4Li14LmI4LiI4Liw4LmA4Lit4Liy4LmE4Lib4LmD4Liq4LmIICovCmZ1bmN0aW9uIG9jclBhaXJzKHIpewogIHZhciBtID0gRk9STS5vY3IgfHwge307CiAg',
  'dmFyIGcgPSByLmd1ZXNzIHx8IHt9OwogIHZhciBvdXQgPSBbXTsKICBpZiAobS5kYXRlICAgJiYgZy5kYXRlKSAgIG91dC5wdXNoKHsgZmllbGQ6IG0uZGF0ZSwgICBsYWJlbDogJ+C4p+C4seC4meC4l+C4teC5iCcsICAgICB2YWx1ZTogZy5kYXRlLCAgIHNob3c6',
  'IHRoRGF0ZShnLmRhdGUpIH0pOwogIGlmIChtLmFtb3VudCAmJiBnLmFtb3VudCkgb3V0LnB1c2goeyBmaWVsZDogbS5hbW91bnQsIGxhYmVsOiAn4LiI4Liz4LiZ4Lin4LiZ4LmA4LiH4Li04LiZJywgIHZhbHVlOiBnLmFtb3VudCwgc2hvdzogYmFodChnLmFtb3Vu',
  'dCkgfSk7CiAgaWYgKG0udmVuZG9yICYmIGcudmVuZG9yKSBvdXQucHVzaCh7IGZpZWxkOiBtLnZlbmRvciwgbGFiZWw6ICfguKPguYnguLLguJkv4Lic4Li54LmJ4LiC4Liy4LiiJywgdmFsdWU6IGcudmVuZG9yLCBzaG93OiBnLnZlbmRvciB9KTsKICBpZiAobS50',
  'aXRsZSAgJiYgZy50aXRsZSkgIG91dC5wdXNoKHsgZmllbGQ6IG0udGl0bGUsICBsYWJlbDogJ+C4iuC4t+C5iOC4reC4o+C4suC4ouC4geC4suC4oycsICB2YWx1ZTogZy50aXRsZSwgIHNob3c6IGcudGl0bGUgfSk7CiAgaWYgKG0ubm90ZSAgICYmIGcucmVmKSAg',
  'ICBvdXQucHVzaCh7IGZpZWxkOiBtLm5vdGUsICAgbGFiZWw6ICfguYDguKXguILguK3guYnguLLguIfguK3guLTguIcnLCAgdmFsdWU6ICfguK3guYnguLLguIfguK3guLTguIcgJyArIGcucmVmLCBzaG93OiBnLnJlZiB9KTsKICAvLyDguYPguJrguYDguKrguKPg',
  'uYfguIjguKvguKXguLLguKLguKPguLLguKLguIHguLLguKMKICBpZiAoZy5pdGVtcyAmJiBnLml0ZW1zLmxlbmd0aCA+IDEpIHsKICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9saW5lcycpKSB7CiAgICAgIC8vIOC4n+C4reC4o+C5jOC4oeC4meC4',
  'teC5ieC4oeC4teC4leC4suC4o+C4suC4h+C4o+C4suC4ouC4geC4suC4o+C4ouC5iOC4reC4oiDigJQg4LmA4LiV4Li04Lih4Lil4LiH4LiV4Liy4Lij4Liy4LiH4LmA4Lil4LiiIOC5hOC4lOC5ieC4l+C4seC5ieC4h+C4iuC4t+C5iOC4rSDguIjguLPguJnguKfg',
  'uJkg4LmB4Lil4Liw4Lij4Liy4LiE4Liy4LmB4Lii4LiB4LiB4Lix4LiZCiAgICAgIG91dC5wdXNoKHsgZmllbGQ6ICdfbGluZXMnLCBsYWJlbDogJ+C4o+C4suC4ouC4geC4suC4o+C5g+C4meC4muC4tOC4pScsIHZhbHVlOiBnLml0ZW1zLAogICAgICAgICAgICAg',
  'ICAgIHNob3c6ICfguYDguJXguLTguKEgJyArIGcuaXRlbXMubGVuZ3RoICsgJyDguKPguLLguKLguIHguLLguKPguKXguIfguJXguLLguKPguLLguIcnLCBsaW5lczogdHJ1ZSB9KTsKICAgIH0gZWxzZSBpZiAobS50aXRsZSkgewogICAgICB2YXIgbGluZXMgPSBn',
  'Lml0ZW1zLm1hcChmdW5jdGlvbihpdCwgaSl7IHJldHVybiAoaSsxKSArICcuJyArIGl0Lm5hbWUgKyAnICcgKyBtb25leShpdC5wcmljZSwgMikgKyAnIOC4vyc7IH0pLmpvaW4oJ1xuJyk7CiAgICAgIG91dC5wdXNoKHsgZmllbGQ6IG0udGl0bGUsIGxhYmVsOiAn',
  '4LiX4Li44LiB4Lij4Liy4Lii4LiB4Liy4LijICgnICsgZy5pdGVtcy5sZW5ndGggKyAnKScsIHZhbHVlOiBsaW5lcywKICAgICAgICAgICAgICAgICBzaG93OiBnLml0ZW1zLmxlbmd0aCArICcg4Lij4Liy4Lii4LiB4Liy4Lij4LmD4LiZ4LmD4Lia4LmA4Liq4Lij',
  '4LmH4LiIJywgbXVsdGk6IHRydWUgfSk7CiAgICB9CiAgfQogIHJldHVybiBvdXQ7Cn0KCmZ1bmN0aW9uIG9jckJveEh0bWwoaWQsIHIpewogIHZhciBwYWlycyA9IG9jclBhaXJzKHIpOwogIGlmICghcGFpcnMubGVuZ3RoKSB7CiAgICByZXR1cm4gJzxkaXYgY2xh',
  'c3M9Im9jci1ib3giPjxkaXYgY2xhc3M9ImhkIj7wn5SOIOC4reC5iOC4suC4meC4guC5ieC4reC4hOC4p+C4suC4oeC5hOC4lOC5iSDguYHguJXguYjguKLguLHguIfguIjguLHguJrguITguYjguLLguJfguLXguYjguYPguIrguYnguYTguJTguYnguYTguKHguYjg',
  'uYTguJTguYknICsKICAgICAgJzxzcGFuIGNsYXNzPSJzcCI+PGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9Im9jclRvZ2dsZVJhdyhcJycgKyBpZCArICdcJykiPuC4lOC4ueC4guC5ieC4reC4hOC4p+C4suC4oeC4l+C4teC5iOC4',
  'reC5iOC4suC4meC5hOC4lOC5iTwvYnV0dG9uPjwvc3Bhbj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9Im9jci1yYXciIGlkPSInICsgaWQgKyAnX3JhdyIgaGlkZGVuPicgKyBlc2Moci50ZXh0IHx8ICco4Lin4LmI4Liy4LiHKScpICsgJzwvZGl2PjwvZGl2',
  'Pic7CiAgfQogIHJldHVybiAnPGRpdiBjbGFzcz0ib2NyLWJveCI+JyArCiAgICAnPGRpdiBjbGFzcz0iaGQiPvCflI4g4Lit4LmI4Liy4LiZ4LiI4Liy4LiB4Lij4Li54Lib4LmE4LiU4LmJ4LmB4Lia4Lia4LiZ4Li14LmJIOKAlCDguIHguJTguYDguJXguLTguKHg',
  'uIrguYjguK3guIfguJfguLXguYjguJXguYnguK3guIfguIHguLLguKMnICsKICAgICAgJzxzcGFuIGNsYXNzPSJzcCI+JyArCiAgICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIHByaSIgb25jbGljaz0ib2NyQXBwbHlBbGwoXCcnICsg',
  'aWQgKyAnXCcpIj7guYDguJXguLTguKHguJfguLHguYnguIfguKvguKHguJQ8L2J1dHRvbj4nICsKICAgICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9Im9jclRvZ2dsZVJhdyhcJycgKyBpZCArICdcJykiPuC4guC5ieC4',
  'reC4hOC4p+C4suC4oeC5gOC4leC5h+C4oTwvYnV0dG9uPicgKwogICAgICAnPC9zcGFuPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9Im9jci1oaXRzIj4nICsgcGFpcnMubWFwKGZ1bmN0aW9uKHAsIGkpewogICAgICByZXR1cm4gJzxkaXYgY2xhc3M9Im9jci1o',
  'aXQiPicgKwogICAgICAgICc8c3BhbiBjbGFzcz0iayI+JyArIGVzYyhwLmxhYmVsKSArICc8L3NwYW4+JyArCiAgICAgICAgJzxzcGFuIGNsYXNzPSJ2IiB0aXRsZT0iJyArIGVzYyhwLmxpbmVzID8gcC5zaG93IDogU3RyaW5nKHAudmFsdWUpKSArICciPicgKyBl',
  'c2MocC5zaG93KSArICc8L3NwYW4+JyArCiAgICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJvY3JBcHBseU9uZShcJycgKyBpZCArICdcJywnICsgaSArICcpIj7guYDguJXguLTguKE8L2J1dHRvbj4nICsKICAgICAg',
  'JzwvZGl2Pic7CiAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJvY3ItcmF3IiBpZD0iJyArIGlkICsgJ19yYXciIGhpZGRlbj4nICsgZXNjKHIudGV4dCB8fCAnKOC4p+C5iOC4suC4hyknKSArICc8L2Rpdj4nICsKICAgICc8ZGl2',
  'IGNsYXNzPSJoaW50IG10OCI+4LiV4Lij4Lin4LiI4LiE4Lin4Liy4Lih4LiW4Li54LiB4LiV4LmJ4Lit4LiH4LiB4LmI4Lit4LiZ4Lia4Lix4LiZ4LiX4Li24LiB4LmA4Liq4Lih4LitIOKAlCDguYHguIHguYnguYPguJnguIrguYjguK3guIfguYTguJTguYnguJXg',
  'uLLguKHguJvguIHguJXguLQ8L2Rpdj4nICsKICAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gb2NyVG9nZ2xlUmF3KGlkKXsKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCArICdfcmF3Jyk7CiAgaWYgKGVsKSBlbC5oaWRkZW4gPSAhZWwuaGlkZGVu',
  'Owp9CgovKiog4LmD4Liq4LmI4LiE4LmI4Liy4Lil4LiH4LiK4LmI4Lit4LiHIOC5geC4peC5ieC4p+C5hOC4ruC5hOC4peC4leC5jOC5g+C4q+C5ieC5gOC4q+C5h+C4meC4p+C5iOC4suC4iuC5iOC4reC4h+C5hOC4q+C4meC4luC4ueC4geC5gOC4leC4tOC4oSAq',
  'LwpmdW5jdGlvbiBvY3JGaWxsKGZpZWxkS2V5LCB2YWx1ZSl7CiAgLy8g4LmA4LiV4Li04Lih4Lil4LiH4LiV4Liy4Lij4Liy4LiH4Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4LiiICjguYPguJrguYDguKrguKPguYfguIjguJfguLXguYjguKHguLXguILguK3g',
  'uIfguKvguKXguLLguKLguK3guKLguYjguLLguIcpCiAgaWYgKGZpZWxkS2V5ID09PSAnX2xpbmVzJykgewogICAgdmFyIGFkZCA9ICh2YWx1ZSB8fCBbXSkubWFwKGZ1bmN0aW9uKGl0KXsKICAgICAgcmV0dXJuIHsgbmFtZTogaXQubmFtZSwgcXR5OiAxLCB1bml0',
  'OiAnJywgcHJpY2U6IE51bWJlcihpdC5wcmljZSkgfHwgMCB9OwogICAgfSk7CiAgICBpZiAoIWFkZC5sZW5ndGgpIHJldHVybiBmYWxzZTsKICAgIEZPUk0ubGluZXMgPSAoRk9STS5saW5lcyB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uKGwpeyByZXR1cm4gU3RyaW5n',
  'KGwubmFtZSB8fCAnJykudHJpbSgpOyB9KS5jb25jYXQoYWRkKTsKICAgIHJlZHJhd0xpbmVzKCk7CiAgICB2YXIgYm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfbGluZXMnKTsKICAgIGlmIChib3gpIHsKICAgICAgYm94LmNsYXNzTGlzdC5hZGQoJ29j',
  'ci1maWxsZWQnKTsKICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyBib3guY2xhc3NMaXN0LnJlbW92ZSgnb2NyLWZpbGxlZCcpOyB9LCAxNjAwKTsKICAgIH0KICAgIHJldHVybiB0cnVlOwogIH0KCiAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQo',
  'J2ZfJyArIGZpZWxkS2V5KTsKICBpZiAoIWVsKSByZXR1cm4gZmFsc2U7CiAgZWwudmFsdWUgPSB2YWx1ZTsKICBlbC5jbGFzc0xpc3QuYWRkKCdvY3ItZmlsbGVkJyk7CiAgc2V0VGltZW91dChmdW5jdGlvbigpeyBlbC5jbGFzc0xpc3QucmVtb3ZlKCdvY3ItZmls',
  'bGVkJyk7IH0sIDE2MDApOwogIHJlY2FsY1N1bXMoKTsKICByZXR1cm4gdHJ1ZTsKfQoKZnVuY3Rpb24gb2NyQXBwbHlPbmUoaWQsIGlkeCl7CiAgdmFyIHIgPSBPQ1JfTEFTVFtpZF07CiAgaWYgKCFyKSByZXR1cm47CiAgdmFyIHAgPSBvY3JQYWlycyhyKVtpZHhd',
  'OwogIGlmIChwICYmIG9jckZpbGwocC5maWVsZCwgcC52YWx1ZSkpIHsKICAgIHRvYXN0KHAubGluZXMgPyAn4LmA4LiV4Li04LihICcgKyBwLnZhbHVlLmxlbmd0aCArICcg4Lij4Liy4Lii4LiB4Liy4Lij4Lil4LiH4Lia4Li04Lil4LmB4Lil4LmJ4LinIOKAlCDg',
  'uJXguKPguKfguIjguIjguLPguJnguKfguJnguIHguLHguJrguKPguLLguITguLLguK3guLXguIHguITguKPguLHguYnguIcnIDogJ+C5gOC4leC4tOC4oScgKyBwLmxhYmVsICsgJ+C5geC4peC5ieC4pycsICdvaycpOwogIH0KfQoKLyoqCiAqIEBwYXJhbSB7Ym9v',
  'bGVhbn0gb25seUVtcHR5IHRydWUgPSDguYDguJXguLTguKHguYDguInguJ7guLLguLDguIrguYjguK3guIfguJfguLXguYjguKLguLHguIfguKfguYjguLLguIcgKOC5g+C4iuC5ieC4leC4reC4meC5gOC4leC4tOC4oeC4reC4seC4leC5guC4meC4oeC4seC4leC4',
  'tAogKiAgICAgICAgICAgICAgICAgICAgICAgICAgICDguIjguLDguYTguJTguYnguYTguKHguYjguJfguLHguJrguKrguLTguYjguIfguJfguLXguYjguJzguLnguYnguYPguIrguYnguJ7guLTguKHguJ7guYzguYTguJvguYHguKXguYnguKcpCiAqIEByZXR1cm4g',
  'e251bWJlcn0g4LiI4Liz4LiZ4Lin4LiZ4LiK4LmI4Lit4LiH4LiX4Li14LmI4LmA4LiV4Li04Lih4LiI4Lij4Li04LiHCiAqLwpmdW5jdGlvbiBvY3JBcHBseUFsbChpZCwgb25seUVtcHR5KXsKICB2YXIgciA9IE9DUl9MQVNUW2lkXTsKICBpZiAoIXIpIHJldHVy',
  'biAwOwogIHZhciBkb25lID0ge307CiAgdmFyIG4gPSAwOwogIG9jclBhaXJzKHIpLmZvckVhY2goZnVuY3Rpb24ocCl7CiAgICBpZiAoZG9uZVtwLmZpZWxkXSkgcmV0dXJuOyAgICAgICAgICAgICAgICAgICAgICAgLy8g4LiK4LmI4Lit4LiH4LmA4LiU4Li14Lii',
  '4Lin4LiB4Lix4LiZ4LmA4LiV4Li04Lih4LiE4Lij4Lix4LmJ4LiH4LmA4LiU4Li14Lii4LinIOC5gOC4reC4suC4leC4seC4p+C5geC4o+C4gQogICAgaWYgKHAuZmllbGQgPT09ICdfbGluZXMnKSB7CiAgICAgIC8vIOC4leC4suC4o+C4suC4h+C4o+C4suC4ouC4',
  'geC4suC4o+C4ouC5iOC4reC4ojogIuC4p+C5iOC4suC4hyIg4Lir4Lih4Liy4Lii4LiW4Li24LiH4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4LiV4Lix4LmJ4LiH4LiK4Li34LmI4Lit4LmE4Lin4LmJCiAgICAgIGlm',
  'IChvbmx5RW1wdHkgJiYgKEZPUk0ubGluZXMgfHwgW10pLnNvbWUoZnVuY3Rpb24obCl7IHJldHVybiBTdHJpbmcobC5uYW1lIHx8ICcnKS50cmltKCk7IH0pKSByZXR1cm47CiAgICB9IGVsc2UgewogICAgICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJ',
  'ZCgnZl8nICsgcC5maWVsZCk7CiAgICAgIGlmICghZWwpIHJldHVybjsKICAgICAgaWYgKG9ubHlFbXB0eSAmJiBTdHJpbmcoZWwudmFsdWUgfHwgJycpLnRyaW0oKSAhPT0gJycpIHJldHVybjsKICAgIH0KICAgIGlmIChvY3JGaWxsKHAuZmllbGQsIHAudmFsdWUp',
  'KSB7IGRvbmVbcC5maWVsZF0gPSB0cnVlOyBuKys7IH0KICB9KTsKICBpZiAoIW9ubHlFbXB0eSkgdG9hc3QobiA/ICfguYDguJXguLTguKHguYPguKvguYkgJyArIG4gKyAnIOC4iuC5iOC4reC4h+C5geC4peC5ieC4pyDigJQg4LiV4Lij4Lin4LiI4LiU4Li54LiB',
  '4LmI4Lit4LiZ4Lia4Lix4LiZ4LiX4Li24LiBJyA6ICfguIrguYjguK3guIfguJfguLXguYjguIjguLDguYDguJXguLTguKHguYTguKHguYjguK3guKLguLnguYjguYPguJnguJ/guK3guKPguYzguKHguJnguLXguYknLCBuID8gJ29rJyA6ICdlcnInKTsKICByZXR1',
  'cm4gbjsKfQoKZnVuY3Rpb24gcm9vbU9wdGlvbnMoKXsgcmV0dXJuIFMuYm9vdCA/IFMuYm9vdC5yb29tcyA6IFtdOyB9CmZ1bmN0aW9uIG9wdChuYW1lKXsgcmV0dXJuIChTLmJvb3QgJiYgUy5ib290LnNjaGVtYVtuYW1lXSkgfHwgW107IH0KZnVuY3Rpb24gdG9k',
  'YXkoKXsgcmV0dXJuIG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zbGljZSgwLDEwKTsgfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4LiB4LmJ4Lit4LiZ',
  '4Lir4LiZ4Li14LmJCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtRGVidChyZWMsIGxlZGdlcil7CiAgLy8g4LmA4Lil4Li34Lit4LiB4LmB4Lih4LmI4LmE4LiU4LmJ',
  '4LiI4Liy4LiB4LiX4Li44LiB4Lia4Lix4LiN4LiK4Li1IOC4ouC4geC5gOC4p+C5ieC4meC4leC4seC4p+C5gOC4reC4hwogIHZhciBhbGwgPSAoQUxMX0RFQlRTIHx8IFtdKS5maWx0ZXIoZnVuY3Rpb24oZCl7IHJldHVybiAhcmVjIHx8IGQuaWQgIT09IHJlYy5p',
  'ZDsgfSk7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJJyA6ICfguYDguJ7guLTguYjguKHguIHguYnguK3guJnguKvguJnguLXguYknLAogICAgcmVjb3JkOiByZWMs',
  'IGFjdGlvbjogJ2RlYnQuc2F2ZScsIGJhc2U6IHsgbGVkZ2VyOiBsZWRnZXIgfSwKICAgIG9uRGVsZXRlOiBkZWxEZWJ0LAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oid0aXRsZScsICAgIGxhYmVsOifguKPguLLguKLguIHguLLguKPguKvguJnguLXguYknLCBy',
  'ZXF1aXJlZDp0cnVlLCBmdWxsOnRydWUsIHBoOifguYDguIrguYjguJkg4LiE4LmI4Liy4LiB4LmI4Lit4Liq4Lij4LmJ4Liy4LiHIFRoZSBNIENvcm5lciBBUCcgfSwKICAgICAgeyBrZXk6J2xlZGdlcicsICAgbGFiZWw6J+C4m+C4o+C4sOC5gOC4oOC4l+C4muC4',
  'seC4jeC4iuC4tScsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6WyfguKvguJnguLXguYnguKvguKXguLHguIEnLCfguKvguJnguLXguYnguKPguK3guIcnXSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J2NyZWRpdG9yJywgbGFiZWw6J+C5gOC4iOC5ieC4suC4',
  'q+C4meC4teC5iScsIHBoOifguYDguIrguYjguJkg4LiE4Lij4Lit4Lia4LiE4Lij4Lix4LinIC8g4LiY4LiZ4Liy4LiE4Liy4LijIC8g4Lib4LmJ4Liy4LiV4LiyJyB9LAogICAgICB7IGtleToncGFyZW50SWQnLCBsYWJlbDon4LmA4Lib4LmH4LiZ4Liq4LmI4Lin',
  '4LiZ4Lir4LiZ4Li24LmI4LiH4LiC4Lit4LiH4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJJywgdHlwZTonc2VsZWN0JywgZnVsbDp0cnVlLAogICAgICAgIG9wdGlvbnM6IGFsbC5tYXAoZnVuY3Rpb24oZCl7IHJldHVybiB7IHZhbHVlOmQuaWQsIGxhYmVsOmQudGl0',
  'bGUgKyAnICgnICsgZC5sZWRnZXIgKyAnKScgfTsgfSksCiAgICAgICAgaGludDon4LmD4LiK4LmJ4LmA4Lih4Li34LmI4Lit4LmA4LiH4Li04LiZ4LiB4LmJ4Lit4LiZ4LiZ4Li14LmJ4LmA4Lib4LmH4LiZ4LiX4Li44LiZ4LiC4Lit4LiH4Lit4Li14LiB4LiB4LmJ',
  '4Lit4LiZIOC5gOC4iuC5iOC4mSDguYDguIfguLTguJnguKLguLfguKHguJvguYnguLLguJXguLLguYDguJvguYfguJnguKrguYjguKfguJnguKvguJnguLbguYjguIfguILguK3guIfguKvguJnguLXguYnguIvguLfguYnguK3guJfguLXguYjguJTguLTguJkg4oCU',
  'ICcgKwogICAgICAgICAgICAgJ+C4iOC5iOC4suC4ouC4hOC4t+C4meC4geC5ieC4reC4meC4meC4teC5ieC5geC4peC5ieC4p+C4geC5ieC4reC4meC5geC4oeC5iOC4iOC4sOC4peC4lOC4leC4suC4oeC5hOC4m+C4lOC5ieC4p+C4oiDguYHguKXguLDguKLguK3g',
  'uJTguKPguKfguKHguIjguLDguYTguKHguYjguJbguLnguIHguJnguLHguJrguIvguYnguLMnIH0sCiAgICAgIHsga2V5OidzdGFydERhdGUnLCBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiB4LmI4Lit4Lir4LiZ4Li14LmJJywgdHlwZTonZGF0ZScgfSwKICAg',
  'ICAgeyBrZXk6J3ByaW5jaXBhbCcsIGxhYmVsOifguKLguK3guJTguKvguJnguLXguYnguJXguLHguYnguIfguJXguYnguJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHJlcXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J2ludGVyZXN0UGVyTW9udGgnLCBs',
  'YWJlbDon4LiU4Lit4LiB4LmA4Lia4Li14LmJ4Lii4LiV4LmI4Lit4LmA4LiU4Li34Lit4LiZICjguJrguLLguJcpJywgdHlwZTonbW9uZXknIH0sCiAgICAgIHsga2V5OidwbGFuUGVyTW9udGgnLCBsYWJlbDon4Lii4Lit4LiU4Lic4LmI4Lit4LiZ4LiV4LmI4Lit',
  '4LmA4LiU4Li34Lit4LiZICjguJrguLLguJcpJywgdHlwZTonbW9uZXknIH0sCiAgICAgIHsga2V5OidkdWVEYXknLCAgIGxhYmVsOifguIHguLPguKvguJnguJTguIrguLPguKPguLAgKOC4p+C4seC4meC4l+C4teC5iOC4guC4reC4h+C5gOC4lOC4t+C4reC4mSkn',
  'LCB0eXBlOidudW1iZXInLCBwaDonMjAnIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCAgIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnZGVidFN0YXR1c2VzJyksIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5Oidu',
  'b3RlJywgICAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7CiAgaWYgKCFyZWMpIHsgdmFyIGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9sZWRnZXInKTsgaWYgKGUp',
  'IGUudmFsdWUgPSBsZWRnZXI7IH0KfQoKZnVuY3Rpb24gZGVsRGVidChpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJ4LiZ4Li14LmJPyDguKPguLLguKLguIHguLLguKPguIrguLPguKPguLDguJfguLXguYjguJzguLng',
  'uIHguYTguKfguYnguIjguLDguKLguLHguIfguK3guKLguLnguYgnLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgnZGVidC5kZWxldGUnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKHsg',
  'cXVpZXQ6IHRydWUgfSk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQog',
  'ICDguJ/guK3guKPguYzguKE6IOC4o+C4suC4ouC4geC4suC4o+C5guC4reC4meC5g+C4iuC5ieC4q+C4meC4teC5iQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybURl',
  'YnRQYXltZW50KHJlYywgbGVkZ2VyKXsKICB2YXIgZGVidHMgPSAoUy5jYWNoZVtTLnBhZ2VdICYmIFMuY2FjaGVbUy5wYWdlXS5kZWJ0cykgfHwgW107CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4Lij4Liy',
  '4Lii4LiB4Liy4Lij4LiK4Liz4Lij4LiwJyA6ICfguJrguLHguJnguJfguLbguIHguIHguLLguKPguYLguK3guJnguYPguIrguYnguKvguJnguLXguYknLAogICAgcmVjb3JkOiByZWMgfHwgeyBwYXlEYXRlOiB0b2RheSgpLCBjaGFubmVsOiAn4LmC4Lit4LiZIFFS',
  'JyB9LAogICAgYWN0aW9uOiAnZGVidC5zYXZlUGF5bWVudCcsIGJhc2U6IHsgbGVkZ2VyOiBsZWRnZXIgfSwgYnVja2V0OiAnZGVidCcsCiAgICBvY3I6IHsgZGF0ZToncGF5RGF0ZScsIGFtb3VudDoncHJpbmNpcGFsJywgbm90ZTonbm90ZScgfSwKICAgIG9uRGVs',
  'ZXRlOiBkZWxEZWJ0UGF5bWVudCwKICAgIGZpZWxkczogWwogICAgICB7IGtleToncGF5RGF0ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguIrguLPguKPguLAnLCB0eXBlOidkYXRlJywgcmVxdWlyZWQ6dHJ1ZSB9LAogICAgICB7IGtleTonY2hhbm5lbCcs',
  'IGxhYmVsOifguIrguYjguK3guIfguJfguLLguIcnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncGF5Q2hhbm5lbHMnKSB9LAogICAgICB7IGtleToncHJpbmNpcGFsJywgbGFiZWw6J+C5gOC4h+C4tOC4meC4leC5ieC4mSAo4Lia4Liy4LiXKScsIHR5cGU6',
  'J21vbmV5Jywgc3Vtczp0cnVlLAogICAgICAgIGhpbnQ6J+C4quC5iOC4p+C4meC4l+C4teC5iOC5hOC4m+C4peC4lOC4ouC4reC4lOC4q+C4meC4teC5ieC4iOC4o+C4tOC4hycgfSwKICAgICAgeyBrZXk6J2ludGVyZXN0JywgIGxhYmVsOifguJTguK3guIHguYDg',
  'uJrguLXguYnguKIgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHN1bXM6dHJ1ZSwKICAgICAgICBoaW50OifguYTguKHguYjguJbguLnguIHguJnguLPguYTguJvguKXguJTguKLguK3guJTguKvguJnguLXguYknIH0sCiAgICAgIHsga2V5OidfdG90YWwnLCAg',
  'bGFiZWw6J+C4o+C4p+C4oeC4l+C4teC5iOC5guC4reC4mScsIHR5cGU6J2NvbXB1dGVkJywgZnJvbTpbJ3ByaW5jaXBhbCcsJ2ludGVyZXN0J10sCiAgICAgICAgaGludDon4LiV4Lij4Lin4LiI4LmD4Lir4LmJ4LiV4Lij4LiH4LiB4Lix4Lia4Lii4Lit4LiU4LmD',
  '4LiZ4Liq4Lil4Li04LibIMK3IOC4o+C4sOC4muC4muC4hOC4tOC4lOC5g+C4q+C5ieC4reC4seC4leC5guC4meC4oeC4seC4leC4tCcgfSwKICAgICAgeyBrZXk6J2luc3RhbGxtZW50JywgbGFiZWw6J+C4h+C4p+C4lOC4l+C4teC5iCcsIHBoOifguYDguIrguYjg',
  'uJkgOS8yNTY5JyB9LAogICAgICB7IGtleTonZGVidElkJywgIGxhYmVsOifguJzguLnguIHguIHguLHguJrguIHguYnguK3guJnguKvguJnguLXguYknLCB0eXBlOidzZWxlY3QnLAogICAgICAgIG9wdGlvbnM6IGRlYnRzLm1hcChmdW5jdGlvbihkKXsgcmV0dXJu',
  'IHsgdmFsdWU6ZC5pZCwgbGFiZWw6ZC50aXRsZSB9OyB9KSwKICAgICAgICBoaW50OifguYDguKfguYnguJnguKfguYjguLLguIfguYTguJTguYkg4oCUIOC4o+C4sOC4muC4muC4iOC4sOC4meC4seC4muC4o+C4p+C4oeC4l+C4seC5ieC4h+C4muC4seC4jeC4iuC4',
  'tScgfSwKICAgICAgeyBrZXk6J3BheWVyJywgICBsYWJlbDon4Lic4Li54LmJ4LiK4Liz4Lij4LiwJyB9LAogICAgICB7IGtleTonc2xpcHMnLCAgIGxhYmVsOifguKrguKXguLTguJvguIHguLLguKPguYLguK3guJknLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9',
  'LAogICAgICB7IGtleTonbm90ZScsICAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbERlYnRQYXltZW50KGlkKXsKICBjb25maXJtQWN0aW9uKCfg',
  'uKXguJrguKPguLLguKLguIHguLLguKPguIrguLPguKPguLDguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2RlYnQuZGVsZXRlUGF5bWVudCcsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycs',
  'J29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBm',
  'b3JtUHVyY2hhc2UocmVjKXsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguKPguLLguKLguIHguLLguKPguIvguLfguYnguK0nIDogJ+C5gOC4nuC4tOC5iOC4oeC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5',
  'ieC4reC4guC4reC4hycsCiAgICByZWNvcmQ6IHJlYyB8fCB7IGJ1eURhdGU6IHRvZGF5KCkgfSwKICAgIGFjdGlvbjogJ3B1cmNoYXNlLnNhdmUnLCBidWNrZXQ6ICdwdXJjaGFzZXMnLCB3aWRlOiB0cnVlLAogICAgb2NyOiB7IGRhdGU6J2J1eURhdGUnLCBhbW91',
  'bnQ6J3ByaWNlJywgdmVuZG9yOid2ZW5kb3InLCB0aXRsZTonaXRlbScgfSwKICAgIG9uRGVsZXRlOiBkZWxQdXJjaGFzZSwKICAgIGZpZWxkczogWwogICAgICB7IGtleTonaXRlbScsICAgIGxhYmVsOifguIrguLfguYjguK3guJrguLTguKUgLyDguKPguLLguKLg',
  'uIHguLLguKPguKvguKXguLHguIEnLCB0eXBlOid0ZXh0YXJlYScsIHJlcXVpcmVkOnRydWUsIGZ1bGw6dHJ1ZSwKICAgICAgICBwaDon4LmA4LiK4LmI4LiZIOC4quC4seC5iOC4h+C4guC4reC4h+C5gOC4guC5ieC4suC4q+C4rSBTaG9wZWUg4Lij4LmJ4Liy4LiZ',
  'IEFCQycsCiAgICAgICAgaGludDon4LiW4LmJ4Liy4LmD4Liq4LmI4Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4Lii4LiC4LmJ4Liy4LiH4Lil4LmI4Liy4LiH4LmE4Lin4LmJIOC5geC4peC5ieC4p+C5gOC4p+C5ieC4meC4iuC5iOC4reC4h+C4meC4teC5ieC4',
  'p+C5iOC4suC4hyDguKPguLDguJrguJrguIjguLDguJXguLHguYnguIfguIrguLfguYjguK3guYPguKvguYnguYDguK3guIfguIjguLLguIHguKPguLLguKLguIHguLLguKPguYHguKPguIEnIH0sCiAgICAgIHsga2V5OididXlEYXRlJywgbGFiZWw6J+C4p+C4seC4',
  'meC4l+C4teC5iOC4i+C4t+C5ieC4rScsIHR5cGU6J2RhdGUnLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidjYXRlZ29yeScsIGxhYmVsOifguKvguKHguKfguJTguKvguKHguLnguYgnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncHVyY2hhc2VD',
  'YXRlZ29yaWVzJykgfSwKCiAgICAgIHsga2V5OidsaW5lcycsICAgbGFiZWw6J+C4o+C4suC4ouC4geC4suC4o+C5g+C4meC4muC4tOC4pSAo4LiL4Li34LmJ4Lit4LiX4Li14LmA4LiU4Li14Lii4Lin4Lir4Lil4Liy4Lii4Lit4Lii4LmI4Liy4LiH4LmD4Liq4LmI',
  '4LiV4Lij4LiH4LiZ4Li14LmJKScsIHR5cGU6J2xpbmVzJywgZnVsbDp0cnVlLAogICAgICAgIGhpbnQ6J+C4quC4seC5iOC4h+C4reC4reC4meC5hOC4peC4meC5jOC4hOC4o+C4seC5ieC4h+C5gOC4lOC4teC4ouC4p+C5hOC4lOC5ieC4guC4reC4h+C4q+C4peC4',
  'suC4ouC4reC4ouC5iOC4suC4hyDguYPguKrguYjguYHguKLguIHguJfguLXguKXguLDguKPguLLguKLguIHguLLguKPguYTguJTguYnguYDguKXguKIgwrcg4Lij4Liw4Lia4Lia4Lij4Lin4Lih4Lij4Liy4LiE4Liy4LmD4Lir4LmJ4Lit4Lix4LiV4LmC4LiZ4Lih',
  '4Lix4LiV4Li0JyB9LAogICAgICB7IGtleTonc2hpcHBpbmcnLCBsYWJlbDon4LiE4LmI4Liy4Liq4LmI4LiHICjguJrguLLguJcpJywgdHlwZTonbW9uZXknLCBwaDonMCcsIG9uaW5wdXQ6J3JlY2FsY0JpbGwoKScgfSwKICAgICAgeyBrZXk6J2Rpc2NvdW50Jywg',
  'bGFiZWw6J+C4quC5iOC4p+C4meC4peC4lCAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JywgcGg6JzAnLCBvbmlucHV0OidyZWNhbGNCaWxsKCknIH0sCiAgICAgIHsga2V5OidwcmljZScsICAgbGFiZWw6J+C4o+C4suC4hOC4suC4o+C4p+C4oeC4l+C4seC5ieC4',
  'h+C4muC4tOC4pSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JywgcmVxdWlyZWQ6dHJ1ZSwKICAgICAgICBoaW50Oic8c3BhbiBpZD0iYmlsbEhpbnQiPjwvc3Bhbj4nIH0sCiAgICAgIHsga2V5OidvcmRlck5vJywgbGFiZWw6J+C5gOC4peC4guC4l+C4teC5iOC4',
  'hOC4s+C4quC4seC5iOC4h+C4i+C4t+C5ieC4rScsIHBoOifguYDguKXguILguK3guK3guKPguYzguYDguJTguK3guKPguYzguIjguLLguIEgU2hvcGVlIC8gTGF6YWRhJyB9LAogICAgICB7IGtleTondmVuZG9yJywgIGxhYmVsOifguYHguKvguKXguYjguIfguJfg',
  'uLXguYjguIvguLfguYnguK0nLCBwaDonU2hvcGVlIC8g4LmE4LiX4Lin4Lix4Liq4LiU4Li4IC8g4Lij4LmJ4Liy4LiZ4oCmJyB9LAogICAgICB7IGtleToncGF5ZXInLCAgIGxhYmVsOifguJzguLnguYnguIrguLPguKPguLAnIH0sCiAgICAgIHsga2V5Oid3YXJy',
  'YW50eU1vbnRocycsIGxhYmVsOifguKPguLDguKLguLDguYDguKfguKXguLLguKPguLHguJrguJvguKPguLDguIHguLHguJkgKOC5gOC4lOC4t+C4reC4mSknLCB0eXBlOidudW1iZXInLAogICAgICAgIGhpbnQ6J+C4o+C4sOC4muC4muC4iOC4sOC4hOC4s+C4meC4',
  'p+C4k+C4p+C4seC4meC4q+C4oeC4lOC4m+C4o+C4sOC4geC4seC4meC5g+C4q+C5ieC4reC4seC4leC5guC4meC4oeC4seC4leC4tCcgfSwKICAgICAgeyBrZXk6J3Jvb20nLCAgICBsYWJlbDon4Lir4LmJ4Lit4LiHL+C4nuC4t+C5ieC4meC4l+C4teC5iOC4l+C4',
  'teC5iOC5g+C4iuC5iScsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6WyfguKrguYjguKfguJnguIHguKXguLLguIcnXS5jb25jYXQocm9vbU9wdGlvbnMoKSkgfSwKICAgICAgeyBrZXk6J3Bob3RvcycsICBsYWJlbDon4Lig4Liy4Lie4Lib4Lij4Liw4LiB4Lit4Lia',
  '4Liq4Li04LiZ4LiE4LmJ4LiyJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J3NsaXBzJywgICBsYWJlbDon4Liq4Lil4Li04Lib4LiB4Liy4Lij4LmC4Lit4LiZ4LiK4Liz4Lij4LiwJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwK',
  'ICAgICAgeyBrZXk6J25vdGUnLCAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxQdXJjaGFzZShpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia',
  '4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdwdXJjaGFzZS5kZWxldGUnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBs',
  'b2FkKHsgcXVpZXQ6IHRydWUgfSk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PQogICDguJ/guK3guKPguYzguKE6IOC4peC5ieC4suC4h+C5geC4reC4o+C5jAogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybUFjKHJlYyl7CiAgb3BlbkZvcm0o',
  'ewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4Lij4Liy4Lii4LiB4Liy4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJyA6ICfguJrguLHguJnguJfguLbguIHguIHguLLguKPguKXguYnguLLguIfguYHguK3guKPguYwnLAogICAg',
  'cmVjb3JkOiByZWMgfHwgeyBib29rRGF0ZTogdG9kYXkoKSB9LAogICAgYWN0aW9uOiAnYWMuc2F2ZScsIGJ1Y2tldDogJ2FjJywKICAgIG9jcjogeyBkYXRlOidzZXJ2aWNlRGF0ZScsIGFtb3VudDonY29zdCcsIHZlbmRvcjondGVjaG5pY2lhbicgfSwKICAgIG9u',
  'RGVsZXRlOiBkZWxBYywKICAgIGZpZWxkczogWwogICAgICB7IGtleToncm9vbScsICAgICAgICBsYWJlbDon4Lir4LmJ4Lit4LiHJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpyb29tT3B0aW9ucygpLCByZXF1aXJlZDp0cnVlLCBibGFuazpmYWxzZSB9LAogICAg',
  'ICB7IGtleToncm91bmQnLCAgICAgICBsYWJlbDon4Lij4Lit4Lia4LiX4Li14LmIJywgdHlwZTonbnVtYmVyJywgaGludDon4LmA4Lin4LmJ4LiZ4Lin4LmI4Liy4LiH4LmD4Lir4LmJ4Lij4Liw4Lia4Lia4LiZ4Lix4Lia4LiV4LmI4Lit4LiI4Liy4LiB4Lij4Lit',
  '4Lia4Lil4LmI4Liy4Liq4Li44LiU4LiC4Lit4LiH4Lib4Li14LiZ4Lix4LmJ4LiZJyB9LAogICAgICB7IGtleTonYm9va0RhdGUnLCAgICBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiZ4Lix4LiU4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJywgdHlwZTonZGF0',
  'ZScgfSwKICAgICAgeyBrZXk6J3NlcnZpY2VEYXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4lOC4s+C5gOC4meC4tOC4meC4geC4suC4o+C4iOC4o+C4tOC4hycsIHR5cGU6J2RhdGUnLCBoaW50OifguIHguKPguK3guIHguYDguKHguLfguYjguK3guKXg',
  'uYnguLLguIfguYDguKrguKPguYfguIjguYHguKXguYnguKcnIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCAgICAgIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnYWNTdGF0dXNlcycpIH0sCiAgICAgIHsga2V5Oid0',
  'ZWNobmljaWFuJywgIGxhYmVsOifguIrguYjguLLguIcgLyDguJzguLnguYnguYPguKvguYnguJrguKPguLTguIHguLLguKMnIH0sCiAgICAgIHsga2V5Oidjb3N0JywgICAgICAgIGxhYmVsOifguITguYjguLLguYPguIrguYnguIjguYjguLLguKIgKOC4muC4suC4',
  'lyknLCB0eXBlOidtb25leScgfSwKICAgICAgeyBrZXk6J3Bob3RvcycsICAgICAgbGFiZWw6J+C4oOC4suC4nuC4m+C4o+C4sOC4geC4reC4micsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICAgICAgIGxhYmVsOifguKvg',
  'uKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbEFjKGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguKPguLLguKLguIHguLLguKPguKXguYnguLLguIfguYHguK3guKPg',
  'uYzguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2FjLmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkKICAgICAgLmNh',
  'dGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyoqIOC4meC4seC4lOC4peC5ieC4suC4h+C5geC4reC4o+C5jOC4q+C4peC4suC4ouC4q+C5ieC4reC4h+C4nuC4o+C5ieC4reC4oeC4geC4seC4mSAqLwpmdW5j',
  'dGlvbiBmb3JtQnVsa0FjKCl7CiAgdmFyIHJvb21zID0gcm9vbU9wdGlvbnMoKTsKICB2YXIgYm9keSA9CiAgICAnPGRpdiBjbGFzcz0iZmdyaWQiPicgKwogICAgICAnPGRpdiBjbGFzcz0iZiI+PGxhYmVsPuC4p+C4seC4meC4l+C4teC5iOC4meC4seC4lCA8c3Bh',
  'biBzdHlsZT0iY29sb3I6dmFyKC0tZGFuZ2VyKSI+Kjwvc3Bhbj48L2xhYmVsPicgKwogICAgICAgICc8aW5wdXQgdHlwZT0iZGF0ZSIgY2xhc3M9ImlucCIgaWQ9ImJrX2RhdGUiIHZhbHVlPSInICsgdG9kYXkoKSArICciPjwvZGl2PicgKwogICAgICAnPGRpdiBj',
  'bGFzcz0iZiI+PGxhYmVsPuC4iuC5iOC4suC4hyAvIOC4nOC4ueC5ieC5g+C4q+C5ieC4muC4o+C4tOC4geC4suC4ozwvbGFiZWw+PGlucHV0IGNsYXNzPSJpbnAiIGlkPSJia190ZWNoIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7guITg',
  'uYjguLLguYPguIrguYnguIjguYjguLLguKLguJXguYjguK3guKvguYnguK3guIcgKOC4muC4suC4lyk8L2xhYmVsPjxpbnB1dCB0eXBlPSJudW1iZXIiIGNsYXNzPSJpbnAiIGlkPSJia19jb3N0Ij48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJl',
  'bD7guKvguKHguLLguKLguYDguKvguJXguLg8L2xhYmVsPjxpbnB1dCBjbGFzcz0iaW5wIiBpZD0iYmtfbm90ZSI+PC9kaXY+JyArCiAgICAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InJvdyBtYjgiPjxi',
  'IGNsYXNzPSJmczEzIj7guYDguKXguLfguK3guIHguKvguYnguK3guIc8L2I+PHNwYW4gY2xhc3M9InNwIj48L3NwYW4+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImJ1bGtQaWNrKFwnYWxsXCcpIj7guJfguLHguYnguIfguKvguKHg',
  'uJQ8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iYnVsa1BpY2soXCdub25lXCcpIj7guKXguYnguLLguIc8L2J1dHRvbj4nICsKICAgICAgWzEsMiwzLDQsNV0ubWFwKGZ1bmN0aW9uKGYpeyByZXR1cm4gJzxidXR0b24g',
  'Y2xhc3M9ImJ0biBzbSIgb25jbGljaz0iYnVsa1BpY2soJyArIGYgKyAnKSI+4LiK4Lix4LmJ4LiZICcgKyBmICsgJzwvYnV0dG9uPic7IH0pLmpvaW4oJycpICsKICAgICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJyb29tcyIgaWQ9ImJrUm9vbXMiPicgKyBy',
  'b29tcy5tYXAoZnVuY3Rpb24ocil7CiAgICAgIHJldHVybiAnPGxhYmVsIGNsYXNzPSJyb29tIiBzdHlsZT0iY3Vyc29yOnBvaW50ZXIiPjxpbnB1dCB0eXBlPSJjaGVja2JveCIgY2xhc3M9ImJrIiB2YWx1ZT0iJyArIHIgKyAnIj4gPGI+JyArIHIgKyAnPC9iPjwv',
  'bGFiZWw+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7CgogIG9wZW5Nb2RhbCgn8J+ThSDguJnguLHguJTguKXguYnguLLguIfguYHguK3guKPguYzguKvguKXguLLguKLguKvguYnguK3guIfguJ7guKPguYnguK3guKHguIHguLHguJknLCBib2R5LAogICAg',
  'JzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBpZD0iYmtTYXZlIj7guKrguKPguYnguLLguIfguJnguLHguJTguKvguKHguLLg',
  'uKI8L2J1dHRvbj4nLCB0cnVlKTsKCiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JrU2F2ZScpLm9uY2xpY2sgPSBmdW5jdGlvbigpewogICAgdmFyIHBpY2tlZCA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwo',
  'Jy5iazpjaGVja2VkJykpLm1hcChmdW5jdGlvbihjKXsgcmV0dXJuIGMudmFsdWU7IH0pOwogICAgdmFyIGRhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmtfZGF0ZScpLnZhbHVlOwogICAgaWYgKCFwaWNrZWQubGVuZ3RoKSByZXR1cm4gdG9hc3QoJ+C5',
  'gOC4peC4t+C4reC4geC4reC4ouC5iOC4suC4h+C4meC5ieC4reC4oiAxIOC4q+C5ieC4reC4hycsICdlcnInKTsKICAgIGlmICghZGF0ZSkgcmV0dXJuIHRvYXN0KCfguIHguKPguLjguJPguLLguKPguLDguJrguLjguKfguLHguJnguJfguLXguYjguJnguLHguJQn',
  'LCAnZXJyJyk7CiAgICB2YXIgYnRuID0gdGhpczsgYnRuLmRpc2FibGVkID0gdHJ1ZTsgYnRuLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDguIHguLPguKXguLHguIfguJrguLHguJnguJfguLbguIHigKYnOwogICAgY2FsbEFwaSgnYWMu',
  'YnVsa0Jvb2snLCB7CiAgICAgIHJvb21zOiBwaWNrZWQsIGJvb2tEYXRlOiBkYXRlLAogICAgICB0ZWNobmljaWFuOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmtfdGVjaCcpLnZhbHVlLAogICAgICBjb3N0OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmtf',
  'Y29zdCcpLnZhbHVlLAogICAgICBub3RlOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmtfbm90ZScpLnZhbHVlCiAgICB9KS50aGVuKGZ1bmN0aW9uKG4pewogICAgICBjbG9zZU1vZGFsKCk7IHRvYXN0KCfguKrguKPguYnguLLguIfguJnguLHguJTguKvguKHg',
  'uLLguKIgJyArIG4gKyAnIOC4q+C5ieC4reC4h+C5geC4peC5ieC4pycsICdvaycpOyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgYnRuLmRpc2FibGVkID0gZmFsc2U7IGJ0bi50ZXh0Q29udGVudCA9ICfguKrg',
  'uKPguYnguLLguIfguJnguLHguJTguKvguKHguLLguKInOyB0b2FzdChlLm1lc3NhZ2V8fGUsICdlcnInKTsKICAgIH0pOwogIH07Cn0KCmZ1bmN0aW9uIGJ1bGtQaWNrKHdoYXQpewogIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5iaycpLmZvckVhY2goZnVu',
  'Y3Rpb24oYyl7CiAgICBpZiAod2hhdCA9PT0gJ2FsbCcpIGMuY2hlY2tlZCA9IHRydWU7CiAgICBlbHNlIGlmICh3aGF0ID09PSAnbm9uZScpIGMuY2hlY2tlZCA9IGZhbHNlOwogICAgZWxzZSBjLmNoZWNrZWQgPSBTdHJpbmcoYy52YWx1ZSkuY2hhckF0KDApID09',
  'PSBTdHJpbmcod2hhdCk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3guKPguYzguKE6IOC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4suC4oeC4q+C5ieC4reC4',
  'hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybVJlcGFpcihyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4',
  'guC4h+C4suC4meC4i+C5iOC4reC4oScgOiAn4LmB4LiI4LmJ4LiH4LiL4LmI4Lit4LihIC8g4Lia4Lix4LiZ4LiX4Li24LiB4LiH4Liy4LiZ4LiL4LmI4Lit4LihJywKICAgIHJlY29yZDogcmVjIHx8IHsgcmVwb3J0RGF0ZTogdG9kYXkoKSwgcHJpb3JpdHk6ICfg',
  'uJvguIHguJXguLQnIH0sCiAgICBhY3Rpb246ICdyZXBhaXIuc2F2ZScsIGJ1Y2tldDogJ3Jvb21SZXBhaXInLCB3aWRlOiB0cnVlLAogICAgb2NyOiB7IGRhdGU6J3JlcGFpckRhdGUnLCBhbW91bnQ6J2Nvc3QnLCB2ZW5kb3I6J3RlY2huaWNpYW4nLCB0aXRsZTon',
  'aXRlbXMnIH0sCiAgICBvbkRlbGV0ZTogZGVsUmVwYWlyLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oidyb29tJywgICAgICAgbGFiZWw6J+C4q+C5ieC4reC4hycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6cm9vbU9wdGlvbnMoKSwgcmVxdWlyZWQ6dHJ1ZSwg',
  'Ymxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J2NhdGVnb3J5JywgICBsYWJlbDon4Lib4Lij4Liw4LmA4Lig4LiX4LiH4Liy4LiZJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ3JlcGFpckNhdGVnb3JpZXMnKSB9LAogICAgICB7IGtleTonaXRlbXMnLCAg',
  'ICAgIGxhYmVsOifguKPguLLguKLguIHguLLguKPguJfguLXguYjguJXguYnguK3guIfguIvguYjguK3guKHguYHguIvguKEnLCB0eXBlOid0ZXh0YXJlYScsIHJlcXVpcmVkOnRydWUsIGZ1bGw6dHJ1ZSwKICAgICAgICBwaDon4LmA4LiK4LmI4LiZIDEu4Lii4Liy',
  '4LmB4LiZ4LinIDIu4LmA4LiB4LmH4Lia4Liq4Li14Lir4LmJ4Lit4LiHIDMu4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LiB4LmK4Lit4LiB4LiZ4LmJ4Liz4Lil4LmJ4Liy4LiH4LiI4Liy4LiZJyB9LAogICAgICB7IGtleToncmVwb3J0RGF0ZScsIGxhYmVsOifguKfg',
  'uLHguJnguJfguLXguYjguYHguIjguYnguIcnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonYm9va0RhdGUnLCAgIGxhYmVsOifguKfguLHguJnguJnguLHguJTguIvguYjguK3guKHguYHguIvguKEnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleToncmVw',
  'YWlyRGF0ZScsIGxhYmVsOifguKfguLHguJnguYDguILguYnguLLguIvguYjguK3guKHguYHguIvguKEnLCB0eXBlOidkYXRlJywgaGludDon4LiB4Lij4Lit4LiB4LmA4Lih4Li34LmI4Lit4LiL4LmI4Lit4Lih4LmA4Liq4Lij4LmH4LiI4LmB4Lil4LmJ4LinJyB9',
  'LAogICAgICB7IGtleTonc3RhdHVzJywgICAgIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncmVwYWlyU3RhdHVzZXMnKSB9LAogICAgICB7IGtleToncHJpb3JpdHknLCAgIGxhYmVsOifguITguKfguLLguKHguYDg',
  'uKPguYjguIfguJTguYjguKfguJknLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncHJpb3JpdGllcycpLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleTondGVjaG5pY2lhbicsIGxhYmVsOifguIrguYjguLLguIfguJzguLnguYnguIvguYjguK3guKEnIH0s',
  'CiAgICAgIHsga2V5Oidjb3N0JywgICAgICAgbGFiZWw6J+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oiAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JyB9LAogICAgICB7IGtleToncGhvdG9zQmVmb3JlJywgbGFiZWw6J+C4oOC4suC4nuC4geC5iOC4reC4',
  'meC4i+C5iOC4reC4oScsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5OidwaG90b3NBZnRlcicsICBsYWJlbDon4Lig4Liy4Lie4Lir4Lil4Lix4LiH4LiL4LmI4Lit4LihJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBr',
  'ZXk6J25vdGUnLCAgICAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxSZXBhaXIoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4h+C4suC4',
  'meC4i+C5iOC4reC4oeC4meC4teC5iT8nLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgncmVwYWlyLmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9',
  'KTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5',
  'jOC4oTog4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmC4LiU4Lii4Lij4Lin4LihCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtQnVpbGRpbmcocmVjKXsK',
  'ICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguIfguLLguJnguIvguYjguK3guKHguJXguLbguIEnIDogJ+C5gOC4nuC4tOC5iOC4oeC4h+C4suC4meC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4',
  'lOC4ouC4o+C4p+C4oScsCiAgICByZWNvcmQ6IHJlYyB8fCB7IGJvb2tEYXRlOiB0b2RheSgpIH0sCiAgICBhY3Rpb246ICdidWlsZGluZy5zYXZlJywgYnVja2V0OiAnYnVpbGRpbmcnLCB3aWRlOiB0cnVlLAogICAgb2NyOiB7IGRhdGU6J2VuZERhdGUnLCBhbW91',
  'bnQ6J2Nvc3QnLCB2ZW5kb3I6J2NvbnRyYWN0b3InLCB0aXRsZTondGl0bGUnIH0sCiAgICBvbkRlbGV0ZTogZGVsQnVpbGRpbmcsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3pvbmUnLCAgICAgIGxhYmVsOifguKrguYjguKfguJnguILguK3guIfguK3guLLg',
  'uITguLLguKMnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnYnVpbGRpbmdab25lcycpLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5Oid0aXRsZScsICAgICBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4Lij4LiL4LmI4Lit4Lih4LmB4LiL4LihJywgdHlw',
  'ZTondGV4dGFyZWEnLCByZXF1aXJlZDp0cnVlLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J2Jvb2tEYXRlJywgIGxhYmVsOifguKfguLHguJnguJfguLXguYjguJnguLHguJQnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonc3RhcnREYXRlJywgbGFiZWw6',
  'J+C4p+C4seC4meC4l+C4teC5iOC5gOC4o+C4tOC5iOC4oeC4lOC4s+C5gOC4meC4tOC4meC4geC4suC4oycsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidlbmREYXRlJywgICBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LmB4Lil4LmJ4Lin4LmA4Liq4Lij',
  '4LmH4LiIJywgdHlwZTonZGF0ZScgfSwKICAgICAgeyBrZXk6J3N0YXR1cycsICAgIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnYnVpbGRpbmdTdGF0dXNlcycpIH0sCiAgICAgIHsga2V5Oidjb250cmFjdG9yJywg',
  'bGFiZWw6J+C4nOC4ueC5ieC4o+C4seC4muC5gOC4q+C4oeC4siAvIOC4o+C5ieC4suC4mScgfSwKICAgICAgeyBrZXk6J2Nvc3QnLCAgICAgIGxhYmVsOifguITguYjguLLguYPguIrguYnguIjguYjguLLguKIgKOC4muC4suC4lyknLCB0eXBlOidtb25leScgfSwK',
  'ICAgICAgeyBrZXk6J25leHREdWUnLCAgIGxhYmVsOifguITguKPguJrguIHguLPguKvguJnguJTguKPguK3guJrguJbguLHguJTguYTguJsnLCB0eXBlOidkYXRlJywgaGludDon4LmA4LiK4LmI4LiZIOC4geC4seC4meC4i+C4tuC4oeC4lOC4suC4lOC4n+C5ieC4',
  'suC4l+C4uOC4gSAzIOC4m+C4tSDigJQg4LmD4Liq4LmI4Lin4Lix4LiZ4LiX4Li14LmI4LiE4Lij4Lix4LmJ4LiH4LiW4Lix4LiU4LmE4LibJyB9LAogICAgICB7IGtleToncGhvdG9zJywgICAgbGFiZWw6J+C4oOC4suC4nuC4m+C4o+C4sOC4geC4reC4micsIHR5',
  'cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5OidzbGlwcycsICAgICBsYWJlbDon4LmD4Lia4LmA4Liq4Lij4LmH4LiIIC8g4Liq4Lil4Li04LibJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICAgIGxh',
  'YmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbEJ1aWxkaW5nKGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguIfguLLguJnguIvguYjguK3guKHguJXg',
  'uLbguIHguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2J1aWxkaW5nLmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkK',
  'ICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog',
  '4LiC4LmJ4Lit4Lih4Li54Lil4Lir4LmJ4Lit4LiHCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtUm9vbShyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiAn4LiC',
  '4LmJ4Lit4Lih4Li54Lil4Lir4LmJ4Lit4LiHICcgKyAocmVjID8gcmVjLnJvb20gOiAnJyksCiAgICByZWNvcmQ6IHJlYywgYWN0aW9uOiAncm9vbS5zYXZlJywKICAgIGZpZWxkczogWwogICAgICB7IGtleToncm9vbScsICAgbGFiZWw6J+C4q+C5ieC4reC4hycs',
  'IHJlcXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J2Zsb29yJywgIGxhYmVsOifguIrguLHguYnguJknLCB0eXBlOidudW1iZXInIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpv',
  'cHQoJ3Jvb21TdGF0dXNlcycpLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleTondGVuYW50JywgbGFiZWw6J+C4iuC4t+C5iOC4reC4nOC4ueC5ieC5gOC4iuC5iOC4sicgfSwKICAgICAgeyBrZXk6J3Bob25lJywgIGxhYmVsOifguYDguJrguK3guKPguYzguJXg',
  'uLTguJTguJXguYjguK0nIH0sCiAgICAgIHsga2V5OidyZW50JywgICBsYWJlbDon4LiE4LmI4Liy4LmA4LiK4LmI4LiyL+C5gOC4lOC4t+C4reC4mSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JyB9LAogICAgICB7IGtleTonbW92ZUluJywgbGFiZWw6J+C4p+C4',
  'seC4meC4l+C4teC5iOC5gOC4guC5ieC4suC4reC4ouC4ueC5iCcsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5Oidub3RlJywgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0p',
  'Owp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguKPguLLguKLguKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4Lii4Lir4LitCiAgID09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtRmluYW5jZShyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4o+C4suC4ouC4geC4',
  'suC4oycgOiAn4Lia4Lix4LiZ4LiX4Li24LiB4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4oicsCiAgICByZWNvcmQ6IHJlYyB8fCB7IGRhdGU6IHRvZGF5KCksIGNoYW5uZWw6ICfguYLguK3guJkgUVInIH0sCiAgICBhY3Rpb246ICdmaW5h',
  'bmNlLnNhdmUnLCBidWNrZXQ6ICdtaXNjJywKICAgIG9uRGVsZXRlOiBkZWxGaW5hbmNlLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5OidraW5kJywgICBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4LijJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ2ZpbmFu',
  'Y2VLaW5kcycpLCByZXF1aXJlZDp0cnVlLCBibGFuazpmYWxzZSwKICAgICAgICBoaW50OifguYDguKXguLfguK3guIEgIuC4o+C4suC4ouC4o+C4seC4muC4hOC5iOC4suC5gOC4iuC5iOC4siIg4Lir4Lij4Li34LitICLguKPguLLguKLguKPguLHguJrguK3guLfg',
  'uYjguJkg4LmGIiDguKPguLDguJrguJrguIjguLDguJnguLHguJrguYDguJvguYfguJnguJ3guLHguYjguIfguKPguLLguKLguKPguLHguJrguYPguKvguYnguK3guLHguJXguYLguJnguKHguLHguJXguLQnIH0sCiAgICAgIHsga2V5OidkYXRlJywgICBsYWJlbDon',
  '4Lin4Lix4LiZ4LiX4Li14LmIJywgdHlwZTonZGF0ZScsIHJlcXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J2Ftb3VudCcsIGxhYmVsOifguIjguLPguJnguKfguJnguYDguIfguLTguJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHJlcXVpcmVkOnRydWUg',
  'fSwKICAgICAgeyBrZXk6J2JpbGxNb250aCcsIGxhYmVsOifguKPguK3guJrguJrguLTguKXguILguK3guIfguYDguJTguLfguK3guJknLCBwaDon4LmA4LiK4LmI4LiZIOC4gS7guIQuIDI1NjknIH0sCiAgICAgIHsga2V5OidjaGFubmVsJywgbGFiZWw6J+C4iuC5',
  'iOC4reC4h+C4l+C4suC4hycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdmaW5hbmNlQ2hhbm5lbHMnKSB9LAogICAgICB7IGtleTonc2xpcHMnLCAgbGFiZWw6J+C4quC4peC4tOC4myAvIOC5g+C4muC5gOC4quC4o+C5h+C4iCcsIHR5cGU6J2ZpbGVzJywg',
  'ZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxGaW5hbmNlKGlkKXsKICBjb25maXJtQWN0',
  'aW9uKCfguKXguJrguKPguLLguKLguIHguLLguKPguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2ZpbmFuY2UuZGVsZXRlJywgeyBpZDogaWQgfSkudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2snKTsgbG9h',
  'ZCh7IHF1aWV0OiB0cnVlIH0pOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT0KICAg4Liq4Liz4Lij4Lit4LiHIC8g4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54LilCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBkb0V4cG9ydEpzb24o',
  'KXsKICB0b2FzdCgn4LiB4Liz4Lil4Lix4LiH4LmA4LiV4Lij4Li14Lii4Lih4LmE4Lif4Lil4LmM4Liq4Liz4Lij4Lit4LiH4oCmJyk7CiAgY2FsbEFwaSgnYmFja3VwLmV4cG9ydCcsIHt9KS50aGVuKGZ1bmN0aW9uKGR1bXApewogICAgc2F2ZVRleHRGaWxlKCd0',
  'aGUtbS1jb3JuZXItYXAtYmFja3VwLScgKyB0b2RheSgpICsgJy5qc29uJywKICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShkdW1wLCBudWxsLCAxKSwgJ2FwcGxpY2F0aW9uL2pzb24nKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNz',
  'YWdlfHxlLCAnZXJyJyk7IH0pOwp9CgpmdW5jdGlvbiBkb0V4cG9ydENzdihzaGVldCl7CiAgY2FsbEFwaSgnYmFja3VwLmNzdicsIHsgc2hlZXQ6IHNoZWV0IH0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICBzYXZlVGV4dEZpbGUoci5maWxlbmFtZSwgci5jb250ZW50',
  'LCAndGV4dC9jc3YnKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7IH0pOwp9CgovKiog4LiU4Liy4Lin4LiZ4LmM4LmC4Lir4Lil4LiU4LmE4Lif4Lil4LmMIOKAlCDguYPguIrguYkgZG93bmxvYWRzIGNhcGFiaWxp',
  'dHkg4LiW4LmJ4Liy4Lih4Li1IOC5hOC4oeC5iOC4h+C4seC5ieC4meC5g+C4iuC5ieC4peC4tOC4h+C4geC5jOC4m+C4geC4leC4tCAqLwpmdW5jdGlvbiBzYXZlVGV4dEZpbGUoZmlsZW5hbWUsIGNvbnRlbnQsIG1pbWUpewogIGlmICh0eXBlb2Ygd2luZG93LnNh',
  'dmVWaWFIb3N0ID09PSAnZnVuY3Rpb24nKSByZXR1cm4gd2luZG93LnNhdmVWaWFIb3N0KGZpbGVuYW1lLCBjb250ZW50LCBtaW1lKTsKICB2YXIgYmxvYiA9IG5ldyBCbG9iKFtjb250ZW50XSwgeyB0eXBlOiBtaW1lICsgJztjaGFyc2V0PXV0Zi04JyB9KTsKICB2',
  'YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTsKICBhLmhyZWYgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpOwogIGEuZG93bmxvYWQgPSBmaWxlbmFtZTsKICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGEpOyBhLmNsaWNrKCk7CiAgc2V0VGlt',
  'ZW91dChmdW5jdGlvbigpeyBVUkwucmV2b2tlT2JqZWN0VVJMKGEuaHJlZik7IGEucmVtb3ZlKCk7IH0sIDEwMDApOwogIHRvYXN0KCfguJTguLLguKfguJnguYzguYLguKvguKXguJQgJyArIGZpbGVuYW1lICsgJyDguYHguKXguYnguKcnLCAnb2snKTsKfQoKZnVu',
  'Y3Rpb24gZG9JbXBvcnRKc29uKCl7CiAgb3Blbk1vZGFsKCfirIbvuI8g4LiB4Li54LmJ4LiE4Li34LiZ4LiI4Liy4LiB4LmE4Lif4Lil4LmM4Liq4Liz4Lij4Lit4LiHJywKICAgICc8cCBjbGFzcz0iZnMxMyI+4LmA4Lil4Li34Lit4LiB4LmE4Lif4Lil4LmMIDxi',
  'Pi5qc29uPC9iPiDguJfguLXguYjguYDguITguKLguJTguLLguKfguJnguYzguYLguKvguKXguJTguYTguKfguYk8L3A+JyArCiAgICAnPGxhYmVsIGNsYXNzPSJmaWxlLWRyb3AiIGZvcj0iaW1wRmlsZSI+8J+ThCDguYDguKXguLfguK3guIHguYTguJ/guKXguYzg',
  'uKrguLPguKPguK3guIcnICsKICAgICAgJzxpbnB1dCB0eXBlPSJmaWxlIiBpZD0iaW1wRmlsZSIgYWNjZXB0PSJhcHBsaWNhdGlvbi9qc29uLC5qc29uIiBzdHlsZT0iZGlzcGxheTpub25lIiAnICsKICAgICAgJ29uY2hhbmdlPSJkb2N1bWVudC5nZXRFbGVtZW50',
  'QnlJZChcJ2ltcE5hbWVcJykudGV4dENvbnRlbnQ9dGhpcy5maWxlc1swXT90aGlzLmZpbGVzWzBdLm5hbWU6XCdcJyI+PC9sYWJlbD4nICsKICAgICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIG10OCIgaWQ9ImltcE5hbWUiPjwvZGl2PicgKwogICAgJzxkaXYgY2xh',
  'c3M9ImhyIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJmIj48bGFiZWw+4Lin4Li04LiY4Li14LiB4Li54LmJ4LiE4Li34LiZPC9sYWJlbD4nICsKICAgICc8c2VsZWN0IGNsYXNzPSJzZWwiIGlkPSJpbXBNb2RlIj4nICsKICAgICAgJzxvcHRpb24gdmFsdWU9',
  'Im1lcmdlIj7guYDguJ7guLTguYjguKHguYDguInguJ7guLLguLDguKPguLLguKLguIHguLLguKPguJfguLXguYjguKLguLHguIfguYTguKHguYjguKHguLUgKOC5geC4meC4sOC4meC4syk8L29wdGlvbj4nICsKICAgICAgJzxvcHRpb24gdmFsdWU9InJlcGxhY2Ui',
  'PuC4peC5ieC4suC4h+C4guC5ieC4reC4oeC4ueC4peC5gOC4lOC4tOC4oeC5geC4peC5ieC4p+C5geC4l+C4meC4l+C4teC5iOC4l+C4seC5ieC4h+C4q+C4oeC4lDwvb3B0aW9uPicgKwogICAgJzwvc2VsZWN0PjwvZGl2PicsCiAgICAnPGJ1dHRvbiBjbGFzcz0i',
  'YnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4gTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIGlkPSJpbXBHbyI+4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54LilPC9idXR0b24+Jyk7Cgog',
  'IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbXBHbycpLm9uY2xpY2sgPSBmdW5jdGlvbigpewogICAgdmFyIGYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW1wRmlsZScpLmZpbGVzWzBdOwogICAgaWYgKCFmKSByZXR1cm4gdG9hc3QoJ+C4geC4o+C4uOC4',
  'k+C4suC5gOC4peC4t+C4reC4geC5hOC4n+C4peC5jOC4geC5iOC4reC4mScsICdlcnInKTsKICAgIHZhciBtb2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ltcE1vZGUnKS52YWx1ZTsKICAgIHZhciBidG4gPSB0aGlzOyBidG4uZGlzYWJsZWQgPSB0cnVl',
  'OyBidG4uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C4geC4ueC5ieC4hOC4t+C4meKApic7CiAgICB2YXIgciA9IG5ldyBGaWxlUmVhZGVyKCk7CiAgICByLm9ubG9hZCA9IGZ1bmN0aW9uKCl7CiAgICAgIHZh',
  'ciBwYXJzZWQ7CiAgICAgIHRyeSB7IHBhcnNlZCA9IEpTT04ucGFyc2Uoci5yZXN1bHQpOyB9CiAgICAgIGNhdGNoIChlKSB7IGJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBidG4udGV4dENvbnRlbnQgPSAn4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54Lil',
  'JzsgcmV0dXJuIHRvYXN0KCfguYTguJ/guKXguYzguYTguKHguYjguYPguIrguYggSlNPTiDguJfguLXguYjguJbguLnguIHguJXguYnguK3guIcnLCAnZXJyJyk7IH0KICAgICAgY2FsbEFwaSgnYmFja3VwLmltcG9ydCcsIHsgZGF0YTogcGFyc2VkLCBtb2RlOiBt',
  'b2RlIH0pLnRoZW4oZnVuY3Rpb24oc3RhdCl7CiAgICAgICAgY2xvc2VNb2RhbCgpOwogICAgICAgIHZhciBuID0gT2JqZWN0LmtleXMoc3RhdCkucmVkdWNlKGZ1bmN0aW9uKGEsayl7IHJldHVybiBhICsgKHN0YXRba118fDApOyB9LCAwKTsKICAgICAgICB0b2Fz',
  'dCgn4LiB4Li54LmJ4LiE4Li34LiZ4Liq4Liz4LmA4Lij4LmH4LiIICcgKyBuICsgJyDguKPguLLguKLguIHguLLguKMnLCAnb2snKTsKICAgICAgICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICAgIGJ0bi5k',
  'aXNhYmxlZCA9IGZhbHNlOyBidG4udGV4dENvbnRlbnQgPSAn4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54LilJzsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7CiAgICAgIH0pOwogICAgfTsKICAgIHIucmVhZEFzVGV4dChmKTsKICB9Owp9Cgov',
  'KiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmMIOC5geC4peC4sOC4geC4suC4o+C4quC4s+C4o+C4reC4h+C4peC4hyBHb29nbGUgRHJpdmUKICAg',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgpmdW5jdGlvbiBjb3B5U2hhcmUoKXsKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2hhcmVVcmwnKTsKICBpZiAoIWVsKSByZXR1',
  'cm47CiAgZWwuc2VsZWN0KCk7CiAgaWYgKG5hdmlnYXRvci5jbGlwYm9hcmQpIHsKICAgIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KGVsLnZhbHVlKQogICAgICAudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4LiE4Lix4LiU4Lil4Lit4LiB4Lil4Li04LiH',
  '4LiB4LmM4LmB4LiK4Lij4LmM4LmB4Lil4LmJ4LinJywnb2snKTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKCl7IHRvYXN0KCfguITguLHguJTguKXguK3guIHguYTguKHguYjguKrguLPguYDguKPguYfguIgg4oCUIOC4geC4lOC4hOC5ieC4suC4h+C4l+C4teC5',
  'iOC4iuC5iOC4reC4h+C5geC4peC5ieC4p+C5gOC4peC4t+C4reC4geC4hOC4seC4lOC4peC4reC4gScsJ2VycicpOyB9KTsKICB9IGVsc2UgewogICAgdHJ5IHsgZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2NvcHknKTsgdG9hc3QoJ+C4hOC4seC4lOC4peC4reC4geC4',
  'peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC5geC4peC5ieC4pycsJ29rJyk7IH0KICAgIGNhdGNoIChlKSB7IHRvYXN0KCfguITguLHguJTguKXguK3guIHguYTguKHguYjguKrguLPguYDguKPguYfguIgg4oCUIOC4geC4lOC4hOC5ieC4suC4h+C4l+C4teC5iOC4',
  'iuC5iOC4reC4h+C5geC4peC5ieC4p+C5gOC4peC4t+C4reC4geC4hOC4seC4lOC4peC4reC4gScsJ2VycicpOyB9CiAgfQp9CgpmdW5jdGlvbiBkb1JvdGF0ZVNoYXJlKCl7CiAgY29uZmlybUFjdGlvbign4Lit4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij',
  '4LmM4LiK4Li44LiU4LmD4Lir4Lih4LmIPyDguITguJnguJfguLXguYjguJbguLfguK3guKXguLTguIfguIHguYzguYDguJTguLTguKHguIjguLDguYDguJvguLTguJTguYTguKHguYjguYTguJTguYnguK3guLXguIEnLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgn',
  'c2hhcmUucm90YXRlVG9rZW4nLCB7fSkudGhlbihmdW5jdGlvbigpewogICAgICB0b2FzdCgn4Lit4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LiK4Li44LiU4LmD4Lir4Lih4LmI4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVl',
  'IH0pOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgpmdW5jdGlvbiBkb0JhY2t1cE5vdygpewogIHRvYXN0KCfguIHguLPguKXguLHguIfguKrguLPguKPguK3guIfguILguYnguK3guKHguLng',
  'uKXguKXguIcgRHJpdmXigKYnKTsKICBjYWxsQXBpKCdiYWNrdXAuYmFja3VwTm93Jywge30pLnRoZW4oZnVuY3Rpb24ocil7CiAgICB0b2FzdCgn4Liq4Liz4Lij4Lit4LiH4LmB4Lil4LmJ4LinOiAnICsgci5uYW1lLCAnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVl',
  'IH0pOwogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKfQo8L3NjcmlwdD4KPHNjcmlwdD5ib290KCk7PC9zY3JpcHQ+CjwvYm9keT4KPC9odG1sPgo='
].join('');

function indexHtml_() {
  return Utilities.newBlob(Utilities.base64Decode(INDEX_HTML_B64), 'text/html')
    .getDataAsString('UTF-8');
}
