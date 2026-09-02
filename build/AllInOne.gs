/**
 * The M Corner AP — ระบบบริหารหอพัก (ไฟล์เดียวจบ)
 * ไฟล์นี้สร้างอัตโนมัติจากโฟลเดอร์ src/ เมื่อ 2026-09-02 04:19 UTC
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
  'uJnguYTguJTguYnguIjguLLguIHguIHguLLguKPguYHguJXguLDguITguYnguLLguIcgKHRpdGxlKSAqLwogIC5zeW5jLXBpbGwgLnN5bmMtbGFiZWx7ZGlzcGxheTpub25lfQogIC5zeW5jLXBpbGx7cGFkZGluZzozcHggOHB4O2ZvbnQtc2l6ZToxM3B4fQp9CgpA',
  'bWVkaWEgcHJpbnR7CiAgLm5hdiwudG9wLXJpZ2h0LC5idXJnZXIsLnQtYWN0aW9ucywuYnRue2Rpc3BsYXk6bm9uZSFpbXBvcnRhbnR9CiAgLmFwcHtkaXNwbGF5OmJsb2NrfSBib2R5e2JhY2tncm91bmQ6I2ZmZn0KICAuY2FyZHticmVhay1pbnNpZGU6YXZvaWQ7',
  'Ym94LXNoYWRvdzpub25lfQp9Cjwvc3R5bGU+CjwvaGVhZD4KPGJvZHk+Cgo8ZGl2IGNsYXNzPSJhcHAiPgogIDwhLS0gPT09PT09PT09PT09PT09PT0gc2lkZWJhciA9PT09PT09PT09PT09PT09PSAtLT4KICA8YXNpZGUgY2xhc3M9Im5hdiIgaWQ9Im5hdiI+CiAg',
  'ICA8ZGl2IGNsYXNzPSJicmFuZCI+CiAgICAgIDxiPvCfj6IgPD89IGFwcE5hbWUgPz48L2I+CiAgICAgIDxzcGFuPjw/PSBzdWJ0aXRsZSA/PiDCtyB2PD89IHZlcnNpb24gPz48L3NwYW4+CiAgICA8L2Rpdj4KICAgIDxkaXYgY2xhc3M9Im5hdi1saXN0IiBpZD0i',
  'bmF2TGlzdCI+PC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJuYXYtZm9vdCIgaWQ9Im5hdkZvb3QiPuC4geC4s+C4peC4seC4h+C5guC4q+C4peC4lOKApjwvZGl2PgogIDwvYXNpZGU+CgogIDwhLS0gPT09PT09PT09PT09PT09PT0gbWFpbiA9PT09PT09PT09PT09PT09',
  'PSAtLT4KICA8ZGl2IGNsYXNzPSJtYWluIj4KICAgIDxoZWFkZXIgY2xhc3M9InRvcCI+CiAgICAgIDxidXR0b24gY2xhc3M9ImJ1cmdlciIgb25jbGljaz0idG9nZ2xlTmF2KCkiPuKYsDwvYnV0dG9uPgogICAgICA8ZGl2PgogICAgICAgIDxoMSBpZD0icGFnZVRp',
  'dGxlIj7guKDguLLguJ7guKPguKfguKE8L2gxPgogICAgICAgIDxkaXYgY2xhc3M9InN1YiIgaWQ9InBhZ2VTdWIiPuC5geC4lOC4iuC4muC4reC4o+C5jOC4lOC4o+C4p+C4oeC4l+C4uOC4geC4quC5iOC4p+C4meC4guC4reC4h+C4q+C4reC4nuC4seC4gTwvZGl2',
  'PgogICAgICA8L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0idG9wLXJpZ2h0Ij4KICAgICAgICA8c3BhbiBpZD0ibGl2ZURvdCI+PC9zcGFuPgogICAgICAgIDxidXR0b24gY2xhc3M9ImJ0biBpY29uIiBpZD0idGhlbWVCdG4iIHRpdGxlPSLguKrguKXguLHguJrguJjg',
  'uLXguKEiIG9uY2xpY2s9ImN5Y2xlVGhlbWUoKSI+8J+MlzwvYnV0dG9uPgogICAgICAgIDxpbnB1dCBjbGFzcz0iaW5wIHctYXV0byIgaWQ9InNlYXJjaEJveCIgcGxhY2Vob2xkZXI9IvCflI4g4LiE4LmJ4LiZ4Lir4Liy4LiX4Lix4LmJ4LiH4Lij4Liw4Lia4Lia',
  '4oCmIiBzdHlsZT0id2lkdGg6MTgwcHgiCiAgICAgICAgICAgICAgIG9uaW5wdXQ9Im9uU2VhcmNoKHRoaXMudmFsdWUpIiBhdXRvY29tcGxldGU9Im9mZiI+CiAgICAgICAgPHNlbGVjdCBjbGFzcz0ic2VsIHctYXV0byIgaWQ9InllYXJTZWwiIG9uY2hhbmdlPSJz',
  'ZXRZZWFyKHRoaXMudmFsdWUpIj48L3NlbGVjdD4KICAgICAgICA8YnV0dG9uIGNsYXNzPSJidG4gaWNvbiIgdGl0bGU9IuC4o+C4teC5gOC4n+C4o+C4iiIgb25jbGljaz0icmVmcmVzaCgpIj7ihrs8L2J1dHRvbj4KICAgICAgPC9kaXY+CiAgICA8L2hlYWRlcj4K',
  'ICAgIDxtYWluIGNsYXNzPSJjb250ZW50IiBpZD0idmlldyI+CiAgICAgIDxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPjxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+PC9kaXY+4LiB4Liz4Lil4Lix4LiH4LmA4LiK4Li34LmI4Lit4Lih4LiV4LmI',
  '4Lit4Lij4Liw4Lia4Lia4oCmPC9kaXY+CiAgICA8L21haW4+CiAgPC9kaXY+CjwvZGl2PgoKPGRpdiBpZD0iYXV0aFJvb3QiPjwvZGl2Pgo8ZGl2IGlkPSJtb2RhbFJvb3QiPjwvZGl2Pgo8ZGl2IGlkPSJ0b2FzdFJvb3QiPjwvZGl2PgoKPHNjcmlwdD4KICAvKiDg',
  'uITguYjguLLguJfguLHguYnguIfguKrguLLguKHguJbguLnguIHguIHguKPguK3guIfguKHguLLguIjguLLguIHguJ3guLHguYjguIfguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYzguYHguKXguYnguKcg4LiI4Li24LiH4Lir4Lil4Li44LiU4Lit4Lit',
  '4LiB4LiI4Liy4LiB4LmA4LiE4Lij4Li34LmI4Lit4LiH4Lir4Lih4Liy4Lii4LiE4Liz4Lie4Li54LiU4LmE4Lih4LmI4LmE4LiU4LmJCiAgICAgICBhY2Nlc3NLZXkgIOC4nOC5iOC4suC4mSBzYWZlS2V5XyAgICDguYDguKvguKXguLfguK3guYHguITguYggQS1a',
  'IGEteiAwLTkgXyAtCiAgICAgICByb2xlICAgICAgIOC4oeC4suC4iOC4suC4geC4o+C4suC4ouC4geC4suC4o+C4hOC4h+C4l+C4teC5iCBST0xFCiAgICAgICB0aGVtZSAgICAgIOC4nOC5iOC4suC4mSBzYWZlVGhlbWVfICDguYDguKvguKXguLfguK3guYHguITg',
  'uYggMyDguITguYjguLLguJfguLXguYjguIHguLPguKvguJnguJTguYTguKfguYkKCiAgICAg4LiX4Lix4LmJ4LiH4Liq4Liy4Lih4LiV4LmJ4Lit4LiH4Lie4Li04Lih4Lie4LmM4LmB4Lia4Lia4LiU4Li04LiaIChmb3JjZS1wcmludGluZykg4LmA4LiX4LmI4Liy',
  '4LiZ4Lix4LmJ4LiZIOC4q+C5ieC4suC4oeC5g+C4iuC5ieC5geC4muC4miBzdGFuZGFyZC1wcmludGluZwogICAgIOC5gOC4nuC4o+C4suC4sOC5geC4muC4muC4q+C4peC4seC4h+C4iOC4sCBlc2NhcGUg4LmA4LiE4Lij4Li34LmI4Lit4LiH4Lir4Lih4Liy4Lii',
  '4LiE4Liz4Lie4Li54LiU4LmA4Lib4LmH4LiZICZxdW90OyDguIvguLbguYjguIfguYPguJnguYHguJfguYfguIEgc2NyaXB0CiAgICAg4LmA4Lia4Lij4Liy4Lin4LmM4LmA4LiL4Lit4Lij4LmM4LmE4Lih4LmI4LiW4Lit4LiU4LiB4Lil4Lix4LiaIOC4l+C4s+C5',
  'g+C4q+C5ieC4l+C4seC5ieC4h+C4muC4peC5h+C4reC4geC4meC4teC5ieC4nuC4seC4h+C4l+C4seC5ieC4h+C4geC5ieC4reC4meC5geC4peC4sOC4hOC5iOC4suC5hOC4oeC5iOC4luC4tuC4h+C4q+C4meC5ieC4suC5gOC4p+C5h+C4miAqLwogIHZhciBBQ0NF',
  'U1NfS0VZID0gIjw/IT0gYWNjZXNzS2V5ID8+IjsKICB2YXIgVVNFUl9ST0xFICA9ICI8PyE9IHJvbGUgPz4iOwogIHZhciBJTklUX1RIRU1FID0gIjw/IT0gdGhlbWUgPz4iOwo8L3NjcmlwdD4KPHNjcmlwdD4KLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIEFwcC5odG1sIOKAlCBjb3JlOiBzdGF0ZSwgYXBpLCByb3V0ZXIsIGZvcm1hdCwgbW9kYWwsIHVwbG9hZAogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT0gKi8KCnZhciBTID0gewogIGJvb3Q6IG51bGwsICAgICAgICAgIC8vIOC4guC5ieC4reC4oeC4ueC4peC4leC4seC5ieC4h+C4leC5ieC4meC4iOC4suC4gSBhcHAuYm9vdHN0cmFwCiAgcGFnZTogJ2Rhc2hib2FyZCcsCiAgeWVhcjogU3RyaW5nKG5ldyBE',
  'YXRlKCkuZ2V0RnVsbFllYXIoKSksCiAgY2FjaGU6IHt9LCAgICAgICAgICAgLy8g4LmA4LiB4LmH4Lia4Lic4Lil4Lil4Lix4Lie4LiY4LmM4Lil4LmI4Liy4Liq4Li44LiU4LiC4Lit4LiH4LmB4LiV4LmI4Lil4Liw4Lir4LiZ4LmJ4LiyCiAgcGFyYW1zOiB7fSwg',
  'ICAgICAgICAgLy8g4LiV4Lix4Lin4LiB4Lij4Lit4LiH4Lii4LmI4Lit4Lii4LiC4Lit4LiH4LmB4LiV4LmI4Lil4Liw4Lir4LiZ4LmJ4LiyIOC5gOC4iuC5iOC4mSB7cm9vbTonMzExJywgc3RhdHVzOidhbGwnfQogIGJ1c3k6IGZhbHNlLAogIHZlcnNpb246IDAs',
  'ICAgICAgICAgIC8vIOC4o+C4uOC5iOC4meC4guC5ieC4reC4oeC4ueC4peC4l+C4teC5iOC4q+C4meC5ieC4suC4meC4teC5ieC4luC4t+C4reC4reC4ouC4ueC5iAogIHNlbGZDaGFuZ2VVbnRpbDogMCwgIC8vIOC5gOC4nuC4tOC5iOC4h+C4geC4lOC4muC4seC4',
  'meC4l+C4tuC4geC5gOC4reC4hyDigJQg4Lit4Lii4LmI4Liy4LmA4LiU4LmJ4LiH4Lin4LmI4LiyICLguKHguLXguITguJnguYHguIHguYnguILguYnguK3guKHguLnguKUiCiAgc3luY1RpbWVyOiBudWxsCn07Cgp2YXIgQUxMX0RFQlRTID0gW107Cgp2YXIgUEFH',
  'RVMgPSBbCiAgeyBpZDonZGFzaGJvYXJkJywgaWM6J/Cfk4onLCBsYWJlbDon4Lig4Liy4Lie4Lij4Lin4LihJywgICAgICAgICAgICAgIHN1Yjon4LmB4LiU4LiK4Lia4Lit4Lij4LmM4LiU4Lij4Lin4Lih4LiX4Li44LiB4Liq4LmI4Lin4LiZ4LiC4Lit4LiH4Lir',
  '4Lit4Lie4Lix4LiBJywgICAgICAgIHNlYzon4Lig4Liy4Lie4Lij4Lin4LihJyB9LAogIHsgaWQ6J2RlYnRNYWluJywgIGljOifwn5KwJywgbGFiZWw6J+C4o+C4suC4ouC4geC4suC4o+C4quC4o+C4uOC4m+C4o+C4p+C4oScsICAgICAgIHN1Yjon4Lia4Lix4LiN',
  '4LiK4Li14LmC4Lit4LiZ4LmD4LiK4LmJ4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiB4LiC4Lit4LiH4Lir4Lit4Lie4Lix4LiBJywgICAgICAgIHNlYzon4LiB4Liy4Lij4LmA4LiH4Li04LiZJyB9LAogIHsgaWQ6J2RlYnRTdWInLCAgIGljOifwn6e+JywgbGFiZWw6',
  'J+C4q+C4meC4teC5ieC4quC4tOC4mScsICAgICAgICAgICAgICBzdWI6J+C4muC4seC4jeC4iuC4teC5guC4reC4meC5g+C4iuC5ieC4q+C4meC4teC5ieC4o+C4reC4h+C4guC4reC4h+C4q+C4reC4nuC4seC4gScgfSwKICB7IGlkOidwdXJjaGFzZXMnLCBpYzon',
  '8J+bkicsIGxhYmVsOifguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcnLCAgICAgICAgc3ViOifguILguK3guIfguYDguILguYnguLLguKvguK3guJ7guLHguIEg4Lij4Liy4LiE4LiyIOC4m+C4o+C4sOC4geC4seC4mSDguYHguKXguLDguKrg',
  'uKXguLTguJsnIH0sCiAgeyBpZDonZmluYW5jZScsICAgaWM6J/Cfk5InLCBsYWJlbDon4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4ouC4q+C4rScsICAgICAgc3ViOifguITguYjguLLguYDguIrguYjguLLguJfguLXguYjguYDguIHguYfg',
  'uJrguYTguJTguYkgwrcg4LiE4LmI4Liy4LmE4LifIMK3IOC4hOC5iOC4suC4meC5ieC4syDCtyDguITguYjguLLguYDguJnguYfguJUgwrcg4Lig4Liy4Lip4Li1JyB9LAogIHsgaWQ6J2FjJywgICAgICAgIGljOifinYTvuI8nLCBsYWJlbDon4Lil4LmJ4Liy4LiH',
  '4LmB4Lit4Lij4LmMJywgICAgICAgICAgICBzdWI6J+C4leC4suC4o+C4suC4h+C4peC5ieC4suC4h+C5geC4reC4o+C5jOC4o+C4suC4ouC4q+C5ieC4reC4hyAyNCDguKvguYnguK3guIcnLCAgICAgIHNlYzon4LiL4LmI4Lit4Lih4Lia4Liz4Lij4Li44LiHJyB9',
  'LAogIHsgaWQ6J3JlcGFpcnMnLCAgIGljOifwn5SnJywgbGFiZWw6J+C4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4suC4oeC4q+C5ieC4reC4hycsICAgICAgc3ViOifguIfguLLguJnguYHguIjguYnguIfguIvguYjguK3guKHguYHguKLguIHguJXguLLguKHguKvg',
  'uYnguK3guIcnIH0sCiAgeyBpZDonYnVpbGRpbmcnLCAgaWM6J/Cfj6InLCBsYWJlbDon4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmC4LiU4Lii4Lij4Lin4LihJywgICAgc3ViOifguIfguLLguJnguKrguYjguKfguJnguIHguKXguLLguIfguILguK3g',
  'uIfguK3guLLguITguLLguKMnIH0sCiAgeyBpZDoncm9vbXMnLCAgICAgaWM6J/CfmqonLCBsYWJlbDon4Lir4LmJ4Lit4LiH4Lie4Lix4LiBJywgICAgICAgICAgICAgc3ViOifguJfguLDguYDguJrguLXguKLguJnguKvguYnguK3guIfguYHguKXguLDguJvguKPg',
  'uLDguKfguLHguJXguLTguKPguLLguKLguKvguYnguK3guIcnLCAgICAgICBzZWM6J+C4guC5ieC4reC4oeC4ueC4pScgfSwKICB7IGlkOidyZXBvcnRzJywgICBpYzon8J+TiCcsIGxhYmVsOifguKPguLLguKLguIfguLLguJkgJiDguKrguLPguKPguK3guIfguILg',
  'uYnguK3guKHguLnguKUnLCBzdWI6J+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC4o+C4suC4ouC4q+C5ieC4reC4hyDCtyDguJvguI/guLTguJfguLTguJnguIfguLLguJkgwrcg4Liq4LmI4LiH4Lit4Lit4LiB4LiC4LmJ4Lit4Lih4Li54LilJyB9LAog',
  'IHsgaWQ6J3NldHRpbmdzJywgIGljOifimpnvuI8nLCBsYWJlbDon4LiV4Lix4LmJ4LiH4LiE4LmI4LiyJywgICAgICAgICAgICAgIHN1Yjon4Lia4Lix4LiN4LiK4Li1IMK3IOC4mOC4teC4oSDCtyDguJzguLnguYnguYPguIrguYkgwrcg4Lil4Li04LiH4LiB4LmM',
  '4LmA4LiC4LmJ4Liy4LmD4LiK4LmJ4LiH4Liy4LiZJywgICBzZWM6J+C4o+C4sOC4muC4micgfQpdOwoKLyogLS0tLS0tLS0tLS0tLS0tLSBBUEkgLS0tLS0tLS0tLS0tLS0tLSAqLwoKLyoqIOC4geC4uOC4jeC5geC4iOC4l+C4teC5iOC4iOC4sOC5geC4meC4muC5',
  'hOC4m+C4geC4seC4muC4l+C4uOC4geC4hOC4s+C4quC4seC5iOC4hyDigJQg4Lih4Li1IDIg4LiX4Liy4LiH4Liq4Liz4Lij4Lit4LiH4LmA4Lic4Li34LmI4Lit4LiX4Liy4LiH4LmB4Lij4LiB4LmE4Lih4LmI4Lih4LiyICovCnZhciBSRVNPTFZFRF9LRVkgPSBu',
  'dWxsOwoKZnVuY3Rpb24gYWNjZXNzS2V5KCl7CiAgaWYgKFJFU09MVkVEX0tFWSAhPT0gbnVsbCkgcmV0dXJuIFJFU09MVkVEX0tFWTsKICBSRVNPTFZFRF9LRVkgPSAodHlwZW9mIEFDQ0VTU19LRVkgPT09ICdzdHJpbmcnICYmIEFDQ0VTU19LRVkpID8gQUNDRVNT',
  'X0tFWSA6ICcnOwogIHJldHVybiBSRVNPTFZFRF9LRVk7Cn0KCi8qKiB0cnVlIOC4luC5ieC4suC5gOC4m+C4tOC4lOC4lOC5ieC4p+C4ouC4peC4tOC4h+C4geC5jOC4nOC4ueC5ieC4lOC4ueC5geC4pSDigJQg4LmD4LiK4LmJ4LmB4LiX4LiZ4LiV4Lix4Lin4LmB',
  '4Lib4LijIENBTl9FRElUIOC4leC4o+C4hyDguYYg4LiX4Li14LmI4Lit4Liy4LiI4LmE4Lih4LmI4LiW4Li54LiB4Lib4Lij4Liw4LiB4Liy4LioICovCmZ1bmN0aW9uIGNhbkVkaXQoKXsKICBpZiAodHlwZW9mIENBTl9FRElUICE9PSAndW5kZWZpbmVkJykgcmV0',
  'dXJuICEhQ0FOX0VESVQ7CiAgcmV0dXJuICEhKFMuYm9vdCAmJiBTLmJvb3QuY2FuRWRpdCk7Cn0KCmZ1bmN0aW9uIGNhbGxBcGkoYWN0aW9uLCBwYXlsb2FkKXsKICB2YXIgYm9keSA9IHt9OwogIE9iamVjdC5rZXlzKHBheWxvYWQgfHwge30pLmZvckVhY2goZnVu',
  'Y3Rpb24oayl7IGJvZHlba10gPSBwYXlsb2FkW2tdOyB9KTsKICBib2R5Ll9rZXkgPSBhY2Nlc3NLZXkoKTsKICAvLyDguJzguLnguYnguYDguKPguLXguKLguIHguKrguYjguIcgX3Nlc3Npb24g4Lih4Liy4LmA4Lit4LiH4LmE4LiU4LmJICjguJXguK3guJnguK3g',
  'uK3guIHguIjguLLguIHguKPguLDguJrguJrguJXguYnguK3guIfguYPguIrguYnguJXguLHguKfguYDguIHguYjguLIpCiAgaWYgKGJvZHkuX3Nlc3Npb24gPT09IHVuZGVmaW5lZCkgYm9keS5fc2Vzc2lvbiA9ICh0eXBlb2YgQVVUSCAhPT0gJ3VuZGVmaW5lZCcg',
  'PyBBVVRILnNlc3Npb24gOiAnJykgfHwgJyc7CiAgcGF5bG9hZCA9IGJvZHk7CiAgdmFyIG11dGF0aW5nID0gQ0xJRU5UX01VVEFUSU5HLnRlc3QoYWN0aW9uKTsKICBpZiAobXV0YXRpbmcpIHN5bmNTZXQoJ3NhdmluZycpOwoKICByZXR1cm4gbmV3IFByb21pc2Uo',
  'ZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXsKICAgIGdvb2dsZS5zY3JpcHQucnVuCiAgICAgIC53aXRoU3VjY2Vzc0hhbmRsZXIoZnVuY3Rpb24ocmVzKXsKICAgICAgICBpZiAoIXJlcykgeyBpZiAobXV0YXRpbmcpIHN5bmNTZXQoJ29mZmxpbmUnKTsgcmV0dXJu',
  'IHJlamVjdChuZXcgRXJyb3IoJ+C5hOC4oeC5iOC5hOC4lOC5ieC4o+C4seC4muC4guC5ieC4reC4oeC4ueC4peC4iOC4suC4geC5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jCcpKTsgfQogICAgICAgIGlmIChyZXMub2spIHsKICAgICAgICAgIGlmICht',
  'dXRhdGluZykgeyBtYXJrU2VsZkNoYW5nZSgpOyBzeW5jU2V0KCdzYXZlZCcpOyB9CiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXMuZGF0YSk7CiAgICAgICAgfQogICAgICAgIC8vIOC4q+C4oeC4lOC4reC4suC4ouC4uOC4o+C4sOC4q+C4p+C5iOC4suC4h+C5',
  'g+C4iuC5ieC4h+C4suC4mSDigJQg4Lie4Liy4LiB4Lil4Lix4Lia4LmE4Lib4Lir4LiZ4LmJ4Liy4Lil4LmH4Lit4LiB4Lit4Li04LiZ4LmB4LiX4LiZ4LiX4Li14LmI4LiI4Liw4LiC4Li24LmJ4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiE4LmJ4Liy4LiH4LmE',
  '4Lin4LmJ4LmA4LiJ4LiiIOC5hgogICAgICAgIGlmIChyZXMubmVlZExvZ2luICYmIHR5cGVvZiBvblNlc3Npb25Mb3N0ID09PSAnZnVuY3Rpb24nKSBvblNlc3Npb25Mb3N0KCk7CiAgICAgICAgaWYgKG11dGF0aW5nKSBzeW5jU2V0KCdlcnJvcicsIHJlcy5lcnJv',
  'cik7CiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihyZXMuZXJyb3IpKTsKICAgICAgfSkKICAgICAgLndpdGhGYWlsdXJlSGFuZGxlcihmdW5jdGlvbihlcnIpewogICAgICAgIC8vIOC5gOC4meC5h+C4leC4quC4sOC4lOC4uOC4lCDigJQg4LiC4Lit4LiH4LiX4Li1',
  '4LmI4LiB4Lij4Lit4LiB4LmE4Lin4LmJ4Lii4Lix4LiH4Lit4Lii4Li54LmI4LmD4LiZ4Lif4Lit4Lij4LmM4LihIOC5hOC4oeC5iOC4q+C4suC4ouC5hOC4m+C5hOC4q+C4mQogICAgICAgIGlmIChtdXRhdGluZykgc3luY1NldChpc09mZmxpbmVFcnJvcihlcnIp',
  'ID8gJ29mZmxpbmUnIDogJ2Vycm9yJywgKGVyciAmJiBlcnIubWVzc2FnZSkgfHwgU3RyaW5nKGVycikpOwogICAgICAgIHJlamVjdChlcnIpOwogICAgICB9KQogICAgICAuYXBpKGFjdGlvbiwgcGF5bG9hZCB8fCB7fSk7CiAgfSk7Cn0KCi8qKiDguYDguKPguLXg',
  'uKLguIHguYDguKHguLfguYjguK3guYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYzguJrguK3guIHguKfguYjguLLguKLguLHguIfguYTguKHguYjguYTguJTguYnguKXguYfguK3guIHguK3guLTguJkgKOC4q+C4oeC4lOC4reC4suC4ouC4uCAvIOC4luC4',
  'ueC4geC5g+C4q+C5ieC4reC4reC4geC4iOC4suC4geC4o+C4sOC4muC4mikgKi8KdmFyIHNlc3Npb25Mb3N0QXQgPSAwOwpmdW5jdGlvbiBvblNlc3Npb25Mb3N0KCl7CiAgaWYgKERhdGUubm93KCkgLSBzZXNzaW9uTG9zdEF0IDwgMzAwMCkgcmV0dXJuOyAgIC8v',
  'IOC4q+C4peC4suC4ouC4hOC4s+C4quC4seC5iOC4h+C4nuC4o+C5ieC4reC4oeC4geC4seC4meC4geC5h+C5gOC4lOC5ieC4h+C4hOC4o+C4seC5ieC4h+C5gOC4lOC4teC4ouC4p+C4nuC4rQogIHNlc3Npb25Mb3N0QXQgPSBEYXRlLm5vdygpOwogIHNhdmVTZXNz',
  'aW9uKCcnKTsKICBjbG9zZU1vZGFsKCk7CiAgaWYgKEFVVEguZGV2aWNlKSBzaG93UGluKCk7IGVsc2Ugc2hvd0xvZ2luKCfguKvguKHguJTguYDguKfguKXguLLguYPguIrguYnguIfguLLguJkg4LiB4Lij4Li44LiT4Liy4LmA4LiC4LmJ4Liy4Liq4Li54LmI4Lij',
  '4Liw4Lia4Lia4Lit4Li14LiB4LiE4Lij4Lix4LmJ4LiHJyk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0gYm9vdCAmIHJvdXRpbmcgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gYm9vdCgpewogIC8vIOC4l+C4suC4mOC4teC4oeC4geC5iOC4reC4meC4reC4',
  'ouC5iOC4suC4h+C4reC4t+C5iOC4mSDguIjguLDguYTguJTguYnguYTguKHguYjguYDguKvguYfguJnguKvguJnguYnguLLguIjguK3guIHguKPguLDguJ7guKPguLTguJrguILguLLguKfguJXguK3guJnguYDguJvguLTguJQKICBhcHBseVRoZW1lKGxzR2V0KExT',
  'X1RIRU1FKSB8fCAodHlwZW9mIElOSVRfVEhFTUUgPT09ICdzdHJpbmcnID8gSU5JVF9USEVNRSA6ICfguJXguLLguKHguYDguITguKPguLfguYjguK3guIcnKSk7CiAgLy8gYXV0aEdhdGUg4LiI4Liw4Lit4LmI4Liy4LiZ4LiB4Li44LiN4LmB4LiI4LiI4Liy4LiB',
  'IFVSTCDguILguK3guIfguKvguJnguYnguLLguYHguKHguYjguYPguKvguYnguJTguYnguKfguKIg4LiW4LmJ4Liy4LiV4Lix4Lin4LmB4Lib4Lij4LmE4Lih4LmI4Lih4Liy4LiW4Li24LiH4Lir4LiZ4LmJ4Liy4LmA4Lin4LmH4LiaCiAgYXV0aEdhdGUoKTsKfQoK',
  'ZnVuY3Rpb24gYm9vdE5vdygpewogIGNhbGxBcGkoJ2FwcC5ib290c3RyYXAnKS50aGVuKGZ1bmN0aW9uKGIpewogICAgUy5ib290ID0gYjsKICAgIHJlbmRlck5hdigpOwogICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdkZvb3QnKS5pbm5lckhUTUwgPSBu',
  'YXZGb290SHRtbChiKTsKICAgIFMudmVyc2lvbiA9IGIudmVyc2lvbiB8fCAwOwogICAgaWYgKCFiLmNhbkVkaXQpIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgncmVhZG9ubHknKTsKICAgIC8vIOC4mOC4teC4oeC4guC4reC4h+C5gOC4hOC4o+C4t+C5iOC4',
  'reC4h+C4meC4teC5ieC4iuC4meC4sOC5gOC4quC4oeC4rSDguJbguYnguLLguKLguLHguIfguYTguKHguYjguYDguITguKLguJXguLHguYnguIfguITguYjguK3guKLguYPguIrguYnguILguK3guIfguKPguLDguJrguJoKICAgIGFwcGx5VGhlbWUoY3VycmVudFRo',
  'ZW1lKCkpOwogICAgZ28oc3RhcnRQYWdlKGIpKTsKICAgIHN0YXJ0UG9sbGluZyhiLnNldHRpbmdzICYmIGIuc2V0dGluZ3MucmVmcmVzaFNlY29uZHMpOwogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZpZXcnKS5p',
  'bm5lckhUTUwgPQogICAgICAnPGRpdiBjbGFzcz0iY2FyZCI+PGRpdiBjbGFzcz0iY2FyZC1iIj48aDM+4LmA4LiK4Li34LmI4Lit4Lih4LiV4LmI4Lit4Lij4Liw4Lia4Lia4LmE4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIPC9oMz4nICsKICAgICAgJzxwIGNsYXNz',
  'PSJtdXRlZCI+JyArIGVzYyhlLm1lc3NhZ2V8fGUpICsgJzwvcD4nICsKICAgICAgJzxwIGNsYXNzPSJmczEzIj7guJXguKPguKfguIjguKrguK3guJrguKfguYjguLI6IOC5gOC4m+C4tOC4lOC4iuC4teC4leC5geC4peC5ieC4p+C4o+C4seC4mSA8Yj7guYDguKHg',
  'uJnguLkg8J+PoiBUaGUgTSBDb3JuZXIgQVAg4oaSIPCfmoAg4LiV4Li04LiU4LiV4Lix4LmJ4LiH4LiX4Lix4LmJ4LiH4Lir4Lih4LiU4LmD4LiZ4LiE4Lil4Li04LiB4LmA4LiU4Li14Lii4LinPC9iPiAnICsKICAgICAgJ+C5gOC4o+C4teC4ouC4muC4o+C5ieC4',
  'reC4ouC5geC4peC5ieC4pzwvcD48L2Rpdj48L2Rpdj4nOwogIH0pOwp9CgovKiog4Lir4LiZ4LmJ4Liy4LmB4Lij4LiB4LiX4Li14LmI4LiI4Liw4LmA4Lib4Li04LiUIOKAlCDguJXguLLguKHguJfguLXguYjguJXguLHguYnguIfguYTguKfguYkg4LmB4LiV4LmI',
  '4LiW4LmJ4Liy4Lih4Li1ICNoYXNoIOC5g+C4meC4peC4tOC4h+C4geC5jOC5g+C4q+C5iSBoYXNoIOC4iuC4meC4sCAqLwpmdW5jdGlvbiBzdGFydFBhZ2UoYil7CiAgdmFyIGhhc2ggPSAobG9jYXRpb24uaGFzaCB8fCAnJykucmVwbGFjZSgnIycsJycpOwogIGlm',
  'IChQQUdFUy5zb21lKGZ1bmN0aW9uKHApeyByZXR1cm4gcC5pZCA9PT0gaGFzaDsgfSkpIHJldHVybiBoYXNoOwogIHZhciBtYXAgPSB7CiAgICAn4LmB4LiU4LiK4Lia4Lit4Lij4LmM4LiUJzonZGFzaGJvYXJkJywgJ+C4o+C4suC4ouC4geC4suC4o+C4quC4o+C4',
  'uOC4m+C4o+C4p+C4oSc6J2RlYnRNYWluJywgJ+C4q+C4meC4teC5ieC4quC4tOC4mSc6J2RlYnRTdWInLAogICAgJ+C4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4hyc6J3B1cmNoYXNlcycsICfguIvguYjguK3guKHguYHguIvguKHguJXguLLg',
  'uKHguKvguYnguK3guIcnOidyZXBhaXJzJwogIH07CiAgcmV0dXJuIG1hcFtiLnNldHRpbmdzICYmIGIuc2V0dGluZ3Muc3RhcnRQYWdlXSB8fCAnZGFzaGJvYXJkJzsKfQoKLyoqIOC4guC5ieC4reC4hOC4p+C4suC4oeC4oeC4uOC4oeC4peC5iOC4suC4h+C4i+C5',
  'ieC4suC4oiDigJQg4LmA4Lin4Lit4Lij4LmM4LiK4Lix4LiZ4LmA4Lin4LmH4Lia4LmB4Lit4Lib4LiI4Liw4LmA4LiC4Li14Lii4LiZ4LiX4Lix4Lia4Lif4Lix4LiH4LiB4LmM4LiK4Lix4LiZ4LiZ4Li14LmJICovCmZ1bmN0aW9uIG5hdkZvb3RIdG1sKGIpewog',
  'IHZhciB1ID0gYi51c2VyIHx8IHt9OwogIHJldHVybiAnPGIgc3R5bGU9ImNvbG9yOiNjN2QwZTAiPicgKyBlc2ModS5uYW1lIHx8IHUubGFiZWwgfHwgJycpICsgJzwvYj4nICsKICAgICh1LnVzZXJuYW1lID8gJyA8c3BhbiBzdHlsZT0ib3BhY2l0eTouNyI+QCcg',
  'KyBlc2ModS51c2VybmFtZSkgKyAnPC9zcGFuPicgOiAnJykgKwogICAgJzxicj48c3BhbiBzdHlsZT0ib3BhY2l0eTouOCI+JyArIGVzYyh1LnJvbGUgJiYgdS5yb2xlICE9PSAnbm9uZScgPyB1LnJvbGUgOiB1LnZpYSB8fCAnJykgKyAnPC9zcGFuPicgKwogICAg',
  'KGIuc2hlZXRVcmwgPyAnPGJyPjxhIGhyZWY9IicgKyBiLnNoZWV0VXJsICsgJyIgdGFyZ2V0PSJfYmxhbmsiPuC5gOC4m+C4tOC4lCBHb29nbGUgU2hlZXQg4oaXPC9hPicgOiAnJykgKwogICAgKHUuc2lnbmVkSW4gJiYgdS51c2VybmFtZQogICAgICA/ICc8YnI+',
  'PGEgaHJlZj0iamF2YXNjcmlwdDp2b2lkKDApIiBvbmNsaWNrPSJjb25maXJtTG9nb3V0KCkiPuC4reC4reC4geC4iOC4suC4geC4o+C4sOC4muC4mjwvYT4nCiAgICAgIDogJycpOwp9CgpmdW5jdGlvbiByZW5kZXJOYXYoKXsKICB2YXIgaHRtbCA9ICcnOwogIFBB',
  'R0VTLmZvckVhY2goZnVuY3Rpb24ocCl7CiAgICBpZiAocC5zZWMpIGh0bWwgKz0gJzxkaXYgY2xhc3M9Im5hdi1zZWMiPicgKyBwLnNlYyArICc8L2Rpdj4nOwogICAgaHRtbCArPSAnPGJ1dHRvbiBjbGFzcz0ibmF2LWl0ZW0iIGlkPSJuYXYtJyArIHAuaWQgKyAn',
  'IiBvbmNsaWNrPSJnbyhcJycgKyBwLmlkICsgJ1wnKSI+JyArCiAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPSJpYyI+JyArIHAuaWMgKyAnPC9zcGFuPjxzcGFuPicgKyBwLmxhYmVsICsgJzwvc3Bhbj4nICsKICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9ImJh',
  'ZGdlIiBpZD0iYmFkZ2UtJyArIHAuaWQgKyAnIiBzdHlsZT0iZGlzcGxheTpub25lIj48L3NwYW4+JyArCiAgICAgICAgICAgICc8L2J1dHRvbj4nOwogIH0pOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXZMaXN0JykuaW5uZXJIVE1MID0gaHRtbDsKfQoK',
  'ZnVuY3Rpb24gZ28ocGFnZSl7CiAgUy5wYWdlID0gcGFnZTsKICBTLnBhcmFtcyA9IHt9OwogIGxvY2F0aW9uLmhhc2ggPSBwYWdlOwogIHZhciBtZXRhID0gUEFHRVMuZmlsdGVyKGZ1bmN0aW9uKHApe3JldHVybiBwLmlkPT09cGFnZTt9KVswXSB8fCBQQUdFU1sw',
  'XTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFnZVRpdGxlJykudGV4dENvbnRlbnQgPSBtZXRhLmxhYmVsOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlU3ViJykudGV4dENvbnRlbnQgPSBtZXRhLnN1YjsKICBQQUdFUy5mb3JFYWNoKGZ1bmN0',
  'aW9uKHApewogICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdi0nICsgcC5pZCk7CiAgICBpZiAoZWwpIGVsLmNsYXNzTGlzdC50b2dnbGUoJ29uJywgcC5pZCA9PT0gcGFnZSk7CiAgfSk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25h',
  'dicpLmNsYXNzTGlzdC5yZW1vdmUoJ29wZW4nKTsKICByZW1vdmVTY3JpbSgpOwogIGxvYWQoKTsKfQoKZnVuY3Rpb24gcmVmcmVzaCgpeyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7IH0KCmZ1bmN0aW9uIHNldFllYXIoeSl7CiAgUy55ZWFyID0geTsKICBsb2FkKCk7',
  'Cn0KCi8qKgogKiDguYLguKvguKXguJTguILguYnguK3guKHguLnguKXguILguK3guIfguKvguJnguYnguLLguJvguLHguIjguIjguLjguJrguLHguJkKICoKICogQHBhcmFtIHt7cXVpZXQ6Ym9vbGVhbn09fSBvcHRzCiAqICAgcXVpZXQgPSDguIvguLTguIfguIHg',
  'uYzguYDguIfguLXguKLguJog4LmGIOC5gOC4muC4t+C5ieC4reC4h+C4q+C4peC4seC4hyDguYTguKHguYjguKXguYnguLLguIfguKvguJnguYnguLLguYDguJvguYfguJnguKfguIfguIHguKXguKHguKvguKHguLjguJkg4LmB4Lil4Liw4LiE4Li34LiZ4LiV4Liz',
  '4LmB4Lir4LiZ4LmI4LiH4LiX4Li14LmI4LmA4Lil4Li34LmI4Lit4LiZ4LiE4LmJ4Liy4LiH4LmE4Lin4LmJCiAqICAgICAgICAgICDguYPguIrguYnguKvguKXguLHguIfguIHguJTguJrguLHguJnguJfguLbguIEg4LmB4Lil4Liw4LiV4Lit4LiZ4Lie4Lia4Lin',
  '4LmI4Liy4Lih4Li14LiE4LiZ4LmB4LiB4LmJ4LiC4LmJ4Lit4Lih4Li54Lil4LiI4Liy4LiB4LiX4Li14LmI4Lit4Li34LmI4LiZCiAqICAgICAgICAgICDguYDguJ7guLfguYjguK3guYPguKvguYnguKvguJnguYnguLLguIjguK3guJnguLTguYjguIfguJfguLXg',
  'uYjguKrguLjguJQg4LmE4Lih4LmI4LiB4Lij4Liw4Lie4Lij4Li04Lia4LmB4Lil4Liw4LmE4Lih4LmI4LmA4LiU4LmJ4LiH4LiB4Lil4Lix4Lia4LmE4Lib4Lia4LiZ4Liq4Li44LiUCiAqLwpmdW5jdGlvbiBsb2FkKG9wdHMpewogIG9wdHMgPSAob3B0cyA9PT0g',
  'dHJ1ZSkgPyB7fSA6IChvcHRzIHx8IHt9KTsgICAgIC8vIOC5gOC4nOC4t+C5iOC4reC5guC4hOC5ieC4lOC5gOC4geC5iOC4suC4l+C4teC5iOC5gOC4o+C4teC4ouC4gSBsb2FkKHRydWUpCiAgdmFyIHF1aWV0ID0gISFvcHRzLnF1aWV0OwogIHZhciB2aWV3ID0g',
  'ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZpZXcnKTsKICB2YXIgciA9IFJPVVRFU1tTLnBhZ2VdOwogIGlmICghcikgeyB2aWV3LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4LmE4Lih4LmI4Lie4Lia4Lir4LiZ4LmJ4Liy4LiZ4Li14LmJPC9kaXY+',
  'JzsgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpOyB9CgogIGlmICghcXVpZXQpIHsKICAgIHZpZXcuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPjxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+PC9kaXY+4LiB4Liz4Lil4Lix',
  '4LiH4LmC4Lir4Lil4LiU4LiC4LmJ4Lit4Lih4Li54Lil4oCmPC9kaXY+JzsKICB9IGVsc2UgewogICAgc3luY1NldCgnc3luY2luZycpOwogIH0KCiAgdmFyIGtlZXAgPSBxdWlldCA/IHNuYXBzaG90VmlldygpIDogbnVsbDsKCiAgcmV0dXJuIHIubG9hZCgpLnRo',
  'ZW4oZnVuY3Rpb24oZGF0YSl7CiAgICBTLmNhY2hlW1MucGFnZV0gPSBkYXRhOwogICAgc3luY1llYXJPcHRpb25zKGRhdGEueWVhcnMgfHwgZGF0YS5hdmFpbGFibGUgfHwgW10pOwogICAgdmlldy5pbm5lckhUTUwgPSByLnJlbmRlcihkYXRhKTsKICAgIGFwcGx5',
  'UmVhZE9ubHkodmlldyk7CiAgICBpZiAoci5hZnRlcikgci5hZnRlcihkYXRhKTsKICAgIGlmIChrZWVwKSByZXN0b3JlVmlldyhrZWVwKTsKICAgIGlmIChxdWlldCkgc3luY1NldCgnc3luY2VkJyk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICBpZiAocXVp',
  'ZXQpIHsgICAgICAgICAgICAgICAgICAgICAgIC8vIOC4i+C4tOC4h+C4geC5jOC5gOC4muC4t+C5ieC4reC4h+C4q+C4peC4seC4h+C4nuC4peC4suC4lCDigJQg4Lit4Lii4LmI4Liy4LiX4Li04LmJ4LiH4LiC4Lit4LiH4LiX4Li14LmI4LmA4Lir4LmH4LiZ4Lit',
  '4Lii4Li54LmICiAgICAgIHN5bmNTZXQoaXNPZmZsaW5lRXJyb3IoZSkgPyAnb2ZmbGluZScgOiAnZXJyb3InLCBlLm1lc3NhZ2UgfHwgZSk7CiAgICAgIHJldHVybjsKICAgIH0KICAgIHZpZXcuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9ImNhcmQiPjxkaXYgY2xh',
  'c3M9ImNhcmQtYiI+PGgzPuC5guC4q+C4peC4lOC4guC5ieC4reC4oeC4ueC4peC5hOC4oeC5iOC4quC4s+C5gOC4o+C5h+C4iDwvaDM+JyArCiAgICAgICAgICAgICAgICAgICAgICc8cCBjbGFzcz0ibXV0ZWQiPicgKyBlc2MoZS5tZXNzYWdlfHxlKSArICc8L3A+',
  'JyArCiAgICAgICAgICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImxvYWQoKSI+4Lil4Lit4LiH4LmD4Lir4Lih4LmIPC9idXR0b24+PC9kaXY+PC9kaXY+JzsKICB9KTsKfQoKLyoqIOC4iOC4s+C4quC4oOC4suC4nuC4q+C4meC5ieC4',
  'suC4iOC4reC5hOC4p+C5ieC4geC5iOC4reC4meC4p+C4suC4lOC5g+C4q+C4oeC5iCDguYDguJ7guLfguYjguK3guYPguKvguYnguJzguLnguYnguYPguIrguYnguKPguLnguYnguKrguLbguIHguKfguYjguLLguKvguJnguYnguLLguYTguKHguYjguYTguJTguYng',
  'uJbguLnguIHguYLguKvguKXguJTguYPguKvguKHguYggKi8KZnVuY3Rpb24gc25hcHNob3RWaWV3KCl7CiAgdmFyIG9wZW4gPSBbXTsKICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYmlsbC1saW5lcycpLmZvckVhY2goZnVuY3Rpb24oZWwpewogICAgaWYg',
  'KCFlbC5oaWRkZW4pIG9wZW4ucHVzaChlbC5pZCk7CiAgfSk7CiAgcmV0dXJuIHsgeTogd2luZG93LnNjcm9sbFkgfHwgMCwgb3Blbjogb3BlbiB9Owp9CgpmdW5jdGlvbiByZXN0b3JlVmlldyhrZWVwKXsKICBrZWVwLm9wZW4uZm9yRWFjaChmdW5jdGlvbihpZCl7',
  'CiAgICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7CiAgICBpZiAoZWwpIHsgZWwuaGlkZGVuID0gZmFsc2U7IHZhciBiID0gZWwucHJldmlvdXNFbGVtZW50U2libGluZzsKICAgICAgICAgICAgICBpZiAoYikgYi50ZXh0Q29udGVudCA9IGIu',
  'dGV4dENvbnRlbnQucmVwbGFjZSgn4pa+JywgJ+KWtCcpOyB9CiAgfSk7CiAgaWYgKGtlZXAueSkgd2luZG93LnNjcm9sbFRvKDAsIGtlZXAueSk7Cn0KCi8qKiDguYDguJXguLTguKHguJXguLHguKfguYDguKXguLfguK3guIHguJvguLXguYPguJnguYHguJbguJrg',
  'uJrguJnguYPguKvguYnguJXguKPguIfguIHguLHguJrguILguYnguK3guKHguLnguKXguIjguKPguLTguIfguILguK3guIfguKvguJnguYnguLLguJnguLHguYnguJkgKi8KZnVuY3Rpb24gc3luY1llYXJPcHRpb25zKHllYXJzKXsKICB2YXIgc2VsID0gZG9jdW1l',
  'bnQuZ2V0RWxlbWVudEJ5SWQoJ3llYXJTZWwnKTsKICB2YXIgbGlzdCA9ICh5ZWFycyB8fCBbXSkuc2xpY2UoKS5zb3J0KGZ1bmN0aW9uKGEsYil7cmV0dXJuIGItYTt9KTsKICB2YXIgY3VyID0gbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpOwogIGlmIChsaXN0Lmlu',
  'ZGV4T2YoY3VyKSA8IDApIGxpc3QudW5zaGlmdChjdXIpOwogIHZhciBodG1sID0gJzxvcHRpb24gdmFsdWU9ImFsbCI+4LiX4Li44LiB4Lib4Li1PC9vcHRpb24+JzsKICBsaXN0LmZvckVhY2goZnVuY3Rpb24oeSl7CiAgICBodG1sICs9ICc8b3B0aW9uIHZhbHVl',
  'PSInICsgeSArICciPuC4m+C4tSAnICsgeSArICcgKOC4ni7guKguICcgKyAoTnVtYmVyKHkpKzU0MykgKyAnKTwvb3B0aW9uPic7CiAgfSk7CiAgc2VsLmlubmVySFRNTCA9IGh0bWw7CiAgaWYgKGxpc3QuaW5kZXhPZihOdW1iZXIoUy55ZWFyKSkgPCAwICYmIFMu',
  'eWVhciAhPT0gJ2FsbCcpIFMueWVhciA9IFN0cmluZyhjdXIpOwogIHNlbC52YWx1ZSA9IFMueWVhcjsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguYLguKvguKHguJTguJTguLnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcgLS0tLS0tLS0tLS0tLS0tLQog',
  'ICDguJ3guLHguYjguIfguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYzguIHguLHguJnguYTguKfguYnguYHguKXguYnguKfguYPguJnguJ/guLHguIfguIHguYzguIrguLHguJkgYXBpKCkg4LiV4Lij4LiH4LiZ4Li14LmJ4LmB4LiE4LmI4LiL4LmI4Lit',
  '4LiZ4Lib4Li44LmI4Lih4LiX4Li14LmI4LiB4LiU4LmE4Lib4LiB4LmH4LiX4Liz4LmE4Lih4LmI4LmE4LiU4LmJCiAgIOC5gOC4nuC4t+C5iOC4reC5hOC4oeC5iOC5g+C4q+C5ieC4nOC4ueC5ieC4l+C4teC5iOC5gOC4m+C4tOC4lOC4lOC5ieC4p+C4ouC4peC4',
  'tOC4h+C4geC5jOC5geC4iuC4o+C5jOC4quC4seC4muC4quC4mSAqLwp2YXIgRURJVF9FTlRSWVBPSU5UUyA9IC9cYihmb3JtRGVidHxmb3JtRGVidFBheW1lbnR8Zm9ybVB1cmNoYXNlfGZvcm1BY3xmb3JtQnVsa0FjfGZvcm1SZXBhaXJ8Zm9ybUJ1aWxkaW5nfGZv',
  'cm1Sb29tfGZvcm1GaW5hbmNlfGZvcm1Vc2VyfGRlbERlYnR8ZGVsRGVidFBheW1lbnR8ZGVsUHVyY2hhc2V8ZGVsQWN8ZGVsUmVwYWlyfGRlbEJ1aWxkaW5nfGRlbEZpbmFuY2V8ZGVsVXNlcnxkb0ltcG9ydEpzb258ZG9Sb3RhdGVTaGFyZXxkb0JhY2t1cE5vd3xz',
  'YXZlU2V0dGluZ3NGb3JtKVxzKlwoLzsKCmZ1bmN0aW9uIGFwcGx5UmVhZE9ubHkocm9vdCl7CiAgaWYgKGNhbkVkaXQoKSkgcmV0dXJuOwogIHZhciBub2RlcyA9IHJvb3QucXVlcnlTZWxlY3RvckFsbCgnW29uY2xpY2tdJyk7CiAgZm9yICh2YXIgaSA9IDA7IGkg',
  'PCBub2Rlcy5sZW5ndGg7IGkrKykgewogICAgaWYgKEVESVRfRU5UUllQT0lOVFMudGVzdChub2Rlc1tpXS5nZXRBdHRyaWJ1dGUoJ29uY2xpY2snKSB8fCAnJykpIG5vZGVzW2ldLnJlbW92ZSgpOwogIH0KfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguKPguLXguYDg',
  'uJ/guKPguIrguK3guLHguJXguYLguJnguKHguLHguJXguLTguYDguKHguLfguYjguK3guILguYnguK3guKHguLnguKXguYPguJnguIrguLXguJXguYDguJvguKXguLXguYjguKLguJkgLS0tLS0tLS0tLS0tLS0tLQoKICAg4LiB4LiO4LmA4Lir4Lil4LmH4LiB4LiC',
  '4Lit4LiH4Liq4LmI4Lin4LiZ4LiZ4Li14LmJOiDguKvguYnguLLguKHguYLguKvguKXguJTguJfguLHguJrguKrguLTguYjguIfguJfguLXguYjguJzguLnguYnguYPguIrguYnguIHguLPguKXguLHguIfguJ7guLTguKHguJ7guYzguK3guKLguLnguYjguYDguJTg',
  'uYfguJTguILguLLguJQKICAg4LiW4LmJ4Liy4Lih4Li14LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmI4LiV4Lit4LiZ4LiX4Li14LmI4Lic4Li54LmJ4LmD4LiK4LmJ4LiB4Liz4Lil4Lix4LiH4LiB4Lij4Lit4LiB4Lit4Lii4Li54LmIIOC5g+C4q+C5ieC4',
  'guC4tuC5ieC4meC4m+C4uOC5iOC4oeC5gOC4peC5h+C4gSDguYYg4LmD4Lir4LmJ4LiB4LiU4LmA4Lit4LiH4LmA4Lih4Li34LmI4Lit4Lie4Lij4LmJ4Lit4LihCgogICDguKvguKHguLLguKLguYDguKvguJXguLg6IOC4o+C4uOC5iOC4meC4guC5ieC4reC4oeC4',
  'ueC4peC4lOC4ueC4iOC4suC4gSAi4LmA4Lin4Lil4Liy4LiX4Li14LmI4LiK4Li14LiV4LiW4Li54LiB4LmB4LiB4LmJ4Lil4LmI4Liy4Liq4Li44LiUIiDguILguK3guIcgR29vZ2xlIERyaXZlCiAgIOC4i+C4tuC5iOC4h+C4guC4ouC4seC4muC4l+C4uOC4geC4',
  'hOC4o+C4seC5ieC4h+C4l+C4teC5iOC4oeC4teC4geC4suC4o+C5gOC4guC4teC4ouC4mSDguKPguKfguKHguJbguLbguIfguJXguK3guJnguJfguLXguYjguYDguKPguLLguYDguK3guIfguIHguJTguJrguLHguJnguJfguLbguIHguJTguYnguKfguKIKICAg4LiI',
  '4Li24LiH4LiV4LmJ4Lit4LiH4LiI4LiU4Lij4Li44LmI4LiZ4LmD4Lir4Lih4LmI4LmE4Lin4LmJ4Lir4Lil4Lix4LiH4Lia4Lix4LiZ4LiX4Li24LiB4LiX4Li44LiB4LiE4Lij4Lix4LmJ4LiHIOC5hOC4oeC5iOC4h+C4seC5ieC4meC4iOC4sOC5guC4q+C4peC4',
  'lOC4i+C5ieC4s+C5geC4peC4sOC4guC4tuC5ieC4meC4guC5ieC4reC4hOC4p+C4suC4oQogICDguKfguYjguLIgIuC4oeC4teC4hOC4meC5geC4geC5ieC4guC5ieC4reC4oeC4ueC4pSIg4LiX4Lix4LmJ4LiH4LiX4Li14LmI4LiE4LiZ4LmB4LiB4LmJ4LiE4Li3',
  '4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmA4Lit4LiHCi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqLwoKLyoqIOC4hOC4s+C4quC4seC5iOC4h+C4l+C4teC5iOC4l+C4s+C5g+C4q+C5ieC4',
  'guC5ieC4reC4oeC4ueC4peC5g+C4meC4iuC4teC4leC5gOC4m+C4peC4teC5iOC4ouC4mSAo4LmD4Lir4LmJ4LiV4Lij4LiH4LiB4Lix4LiaIE1VVEFUSU5HX0FDVElPTlMg4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmMKSAqLwp2',
  'YXIgQ0xJRU5UX01VVEFUSU5HID0gL1wuKHNhdmV8ZGVsZXRlfHNhdmVQYXltZW50fGRlbGV0ZVBheW1lbnR8YnVsa0Jvb2t8aW1wb3J0fHJvdGF0ZVRva2VufGJhY2t1cE5vd3x1cGxvYWR8dHJhc2gpJC87CgovKioKICog4LmA4Lie4Li04LmI4LiH4LiB4LiU4Lia',
  '4Lix4LiZ4LiX4Li24LiB4LmA4Lit4LiHIOKAlCDguKvguJnguYnguLLguYLguKvguKXguJTguILguYnguK3guKHguLnguKXguYPguKvguKHguYjguYTguJvguYHguKXguYnguKfguJXguK3guJnguIHguJTguJrguLHguJnguJfguLbguIEKICog4LiI4LiU4Lij4Li4',
  '4LmI4LiZ4LiC4LmJ4Lit4Lih4Li54Lil4Lil4LmI4Liy4Liq4Li44LiU4LmE4Lin4LmJIOC5geC4peC4sOC4geC4seC4meC5hOC4oeC5iOC5g+C4q+C5ieC4o+C4reC4muC4leC4o+C4p+C4iOC4luC4seC4lOC5hOC4m+C5guC4q+C4peC4lOC4i+C5ieC4swogKiAo',
  '4LmA4Lic4Li34LmI4Lit4LmE4Lin4LmJIDIg4LiZ4Liy4LiX4Li1IOC5gOC4nuC4o+C4suC4sCBHb29nbGUgRHJpdmUg4Lit4Lix4Lib4LmA4LiU4LiV4LmA4Lin4Lil4Liy4LmB4LiB4LmJ4LmE4LiC4LiK4LmJ4Liy4LiB4Lin4LmI4Liy4LiB4Liy4Lij4LmA4LiC',
  '4Li14Lii4LiZ4LiI4Lij4Li04LiH4LmA4Lil4LmH4LiB4LiZ4LmJ4Lit4LiiKQogKi8KZnVuY3Rpb24gbWFya1NlbGZDaGFuZ2UoKXsKICBTLnNlbGZDaGFuZ2VVbnRpbCA9IERhdGUubm93KCkgKyAxMjAwMDA7CiAgY2xlYXJUaW1lb3V0KFMuc3luY1RpbWVyKTsK',
  'ICBTLnN5bmNUaW1lciA9IHNldFRpbWVvdXQoc3luY1ZlcnNpb24sIDE1MDApOwp9CgpmdW5jdGlvbiBzeW5jVmVyc2lvbigpewogIGNhbGxBcGkoJ2FwcC52ZXJzaW9uJykKICAgIC50aGVuKGZ1bmN0aW9uKHYpeyBpZiAodiAmJiB2LnZlcnNpb24pIFMudmVyc2lv',
  'biA9IHYudmVyc2lvbjsgfSkKICAgIC5jYXRjaChmdW5jdGlvbigpeyAvKiDguYTguKfguYnguKPguK3guJrguKvguJnguYnguLIgKi8gfSk7Cn0KCi8qKiDguJzguLnguYnguYPguIrguYnguIHguLPguKXguLHguIfguIHguKPguK3guIHguILguYnguK3guKHguLng',
  'uKXguK3guKLguLnguYjguKvguKPguLfguK3guYDguJvguKXguYjguLIg4oCUIOC4luC5ieC4suC5g+C4iuC5iCDguKvguYnguLLguKHguYLguKvguKXguJTguJfguLHguJogKi8KZnVuY3Rpb24gdXNlcklzQnVzeSgpewogIHZhciBtb2RhbCA9IGRvY3VtZW50Lmdl',
  'dEVsZW1lbnRCeUlkKCdtb2RhbFJvb3QnKTsKICBpZiAobW9kYWwgJiYgbW9kYWwuaW5uZXJIVE1MKSByZXR1cm4gdHJ1ZTsgICAgICAgICAgICAgIC8vIOC4n+C4reC4o+C5jOC4oeC5gOC4m+C4tOC4lOC4hOC5ieC4suC4h+C4reC4ouC4ueC5iAogIHZhciBlbCA9',
  'IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7CiAgaWYgKGVsICYmIC9eKElOUFVUfFRFWFRBUkVBfFNFTEVDVCkkLy50ZXN0KGVsLnRhZ05hbWUpICYmCiAgICAgIGVsLnR5cGUgIT09ICdidXR0b24nICYmIGVsLnR5cGUgIT09ICdzdWJtaXQnKSByZXR1cm4gdHJ1ZTsg',
  'ICAvLyDguYDguITguK3guKPguYzguYDguIvguK3guKPguYzguK3guKLguLnguYjguYPguJnguIrguYjguK3guIfguIHguKPguK3guIEKICByZXR1cm4gZmFsc2U7Cn0KCmZ1bmN0aW9uIHJlZnJlc2hMYWJlbChzZWMpewogIGlmICghc2VjKSByZXR1cm4gJ+C4m+C4',
  'tOC4lOC4geC4suC4o+C4leC4o+C4p+C4iOC4reC4seC4leC5guC4meC4oeC4seC4leC4tCc7CiAgaWYgKHNlYyAlIDM2MDAgPT09IDApIHJldHVybiAn4LiV4Lij4Lin4LiI4LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmI4LiX4Li44LiBICcgKyAoc2VjIC8g',
  'MzYwMCkgKyAnIOC4iuC4seC5iOC4p+C5guC4oeC4hyc7CiAgaWYgKHNlYyAlIDYwID09PSAwKSByZXR1cm4gJ+C4leC4o+C4p+C4iOC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C4oeC5iOC4l+C4uOC4gSAnICsgKHNlYyAvIDYwKSArICcg4LiZ4Liy4LiX4Li1JzsK',
  'ICByZXR1cm4gJ+C4leC4o+C4p+C4iOC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C4oeC5iOC4l+C4uOC4gSAnICsgc2VjICsgJyDguKfguLTguJnguLLguJfguLUnOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4leC4seC4p+C4muC4reC4geC4quC4luC4suC4meC4',
  'sOC4geC4suC4o+C4i+C4tOC4h+C4geC5jCAo4Lih4Li44Lih4LiC4Lin4Liy4Lia4LiZKSAtLS0tLS0tLS0tLS0tLS0tCgogICDguKvguJnguYnguLLguJfguLXguYg6IOC4muC4reC4geC5g+C4q+C5ieC4o+C4ueC5ieC4leC4peC4reC4lOC4p+C5iOC4suC4leC4',
  'reC4meC4meC4teC5ieC4guC5ieC4reC4oeC4ueC4peC4leC4o+C4h+C4geC4seC4muC4q+C4peC4seC4h+C4muC5ieC4suC4meC4q+C4o+C4t+C4reC4ouC4seC4hwogICDguIHguLPguKXguLHguIfguJrguLHguJnguJfguLbguIHguK3guKLguLnguYjguYTguKvg',
  'uKEg4Lir4Lij4Li34Lit4Lih4Li14Lit4Liw4LmE4Lij4LiE4LmJ4Liy4LiH4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LiI4Lix4LiU4LiB4Liy4LijCgogICDguJXguLHguYnguIfguYPguIjguYPguKvguYkgIuC5gOC4h+C4teC4ouC4muC5gOC4oeC4t+C5iOC4reC4',
  'l+C4uOC4geC4reC4ouC5iOC4suC4h+C4m+C4geC4leC4tCDguYHguKXguLDguIrguLHguJTguYDguIjguJnguYDguKHguLfguYjguK3guKHguLXguK3guLDguYTguKPguJzguLTguJTguJvguIHguJXguLQiCiAgIOC4quC4luC4suC4meC4sOC4l+C4teC5iOC4leC5',
  'ieC4reC4h+C5g+C4q+C5ieC4nOC4ueC5ieC5g+C4iuC5ieC4l+C4s+C4reC4sOC5hOC4o+C4leC5iOC4rSAo4Lih4Li14LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmIIC8g4LmA4LiK4Li34LmI4Lit4Lih4LiV4LmI4Lit4LmE4Lih4LmI4LmE4LiU4LmJKSDg',
  'uIHguJTguYTguJTguYkKLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovCgp2YXIgU1lOQyA9IHsgc3RhdGU6ICdzeW5jZWQnLCBkZXRhaWw6ICcnLCBhdDogMCwgdGltZXI6IG51bGwgfTsK',
  'CnZhciBTWU5DX0xPT0sgPSB7CiAgc3luY2VkOiAgeyBjbHM6ICdvaycsICAgaWNvbjogJ+KXjycsICB0ZXh0OiAn4LiL4Li04LiH4LiB4LmM4LmB4Lil4LmJ4LinJyB9LAogIHN5bmNpbmc6IHsgY2xzOiAnaW5mbycsIGljb246ICcnLCAgIHRleHQ6ICfguIHguLPg',
  'uKXguLHguIfguIvguLTguIfguIHguYzigKYnLCAgIHNwaW46IHRydWUgfSwKICBzYXZpbmc6ICB7IGNsczogJ2luZm8nLCBpY29uOiAnJywgICB0ZXh0OiAn4LiB4Liz4Lil4Lix4LiH4Lia4Lix4LiZ4LiX4Li24LiB4oCmJywgIHNwaW46IHRydWUgfSwKICBzYXZl',
  'ZDogICB7IGNsczogJ29rJywgICBpY29uOiAn4pyTJywgIHRleHQ6ICfguJrguLHguJnguJfguLbguIHguYHguKXguYnguKcnIH0sCiAgcGVuZGluZzogeyBjbHM6ICd3YXJuJywgaWNvbjogJ+KGuycsICB0ZXh0OiAn4Lih4Li14LiC4LmJ4Lit4Lih4Li54Lil4LmD',
  '4Lir4Lih4LmIJywgIGNsaWNrOiAnbG9hZFBlbmRpbmcoKScgfSwKICBvZmZsaW5lOiB7IGNsczogJ2RncicsICBpY29uOiAn4pqgJywgIHRleHQ6ICfguYDguIrguLfguYjguK3guKHguJXguYjguK3guYTguKHguYjguYTguJTguYknLCBjbGljazogJ3JldHJ5U3lu',
  'YygpJyB9LAogIGVycm9yOiAgIHsgY2xzOiAnZGdyJywgIGljb246ICfimqAnLCAgdGV4dDogJ+C4muC4seC4meC4l+C4tuC4geC5hOC4oeC5iOC4quC4s+C5gOC4o+C5h+C4iCcsIGNsaWNrOiAncmV0cnlTeW5jKCknIH0sCiAgcGF1c2VkOiAgeyBjbHM6ICdtdXRl',
  'JywgaWNvbjogJ+KXiycsICB0ZXh0OiAn4LmE4Lih4LmI4LiV4Lij4Lin4LiI4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0JywgY2xpY2s6ICdsb2FkUGVuZGluZygpJyB9Cn07CgovKioKICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlIOC4iuC4t+C5iOC4reC4quC4',
  'luC4suC4meC4sOC5g+C4mSBTWU5DX0xPT0sKICogQHBhcmFtIHtzdHJpbmc9fSBkZXRhaWwg4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Lit4LiY4Li04Lia4Liy4Lii4LmA4Lie4Li04LmI4LihICjguYLguJzguKXguYjguJXguK3guJnguYDguK3guLLguYDguKHguLLg',
  'uKrguYzguIrguLXguYkpCiAqLwpmdW5jdGlvbiBzeW5jU2V0KHN0YXRlLCBkZXRhaWwpewogIC8vIOC4quC4luC4suC4meC4sOC4l+C4teC5iOC4leC5ieC4reC4h+C5g+C4q+C5ieC4nOC4ueC5ieC5g+C4iuC5ieC4iOC4seC4lOC4geC4suC4oyDguKvguYnguLLg',
  'uKHguJbguLnguIHguKrguJbguLLguJnguLDguJfguLHguYjguKfguYTguJvguKHguLLguIHguKXguJrguJfguLTguYnguIcKICBpZiAoKFNZTkMuc3RhdGUgPT09ICdwZW5kaW5nJyB8fCBTWU5DLnN0YXRlID09PSAnb2ZmbGluZScpICYmCiAgICAgIChzdGF0ZSA9',
  'PT0gJ3N5bmNlZCcgfHwgc3RhdGUgPT09ICdzeW5jaW5nJykpIHJldHVybjsKCiAgU1lOQy5zdGF0ZSA9IHN0YXRlOwogIFNZTkMuZGV0YWlsID0gZGV0YWlsIHx8ICcnOwogIGlmIChzdGF0ZSA9PT0gJ3N5bmNlZCcgfHwgc3RhdGUgPT09ICdzYXZlZCcpIFNZTkMu',
  'YXQgPSBEYXRlLm5vdygpOwogIHN5bmNQYWludCgpOwoKICBjbGVhclRpbWVvdXQoU1lOQy50aW1lcik7CiAgaWYgKHN0YXRlID09PSAnc2F2ZWQnKSB7ICAgICAgICAgICAgICAgICAgICAgICAvLyDguYLguIrguKfguYwgIuC4muC4seC4meC4l+C4tuC4geC5geC4',
  'peC5ieC4pyIg4LmB4Lib4LmK4Lia4LmA4LiU4Li14Lii4Lin4LmB4Lil4LmJ4Lin4LiB4Lil4Lix4Lia4LmE4Lib4Lib4LiB4LiV4Li0CiAgICBTWU5DLnRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpewogICAgICBpZiAoU1lOQy5zdGF0ZSA9PT0gJ3NhdmVk',
  'Jykgc3luY1NldCgnc3luY2VkJyk7CiAgICB9LCAyNjAwKTsKICB9Cn0KCmZ1bmN0aW9uIHN5bmNQYWludCgpewogIHZhciBkb3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGl2ZURvdCcpOwogIGlmICghZG90KSByZXR1cm47CiAgdmFyIGxvb2sgPSBTWU5D',
  'X0xPT0tbU1lOQy5zdGF0ZV0gfHwgU1lOQ19MT09LLnN5bmNlZDsKCiAgdmFyIHRpcCA9IFNZTkMuZGV0YWlsIHx8IHN5bmNUb29sdGlwKCk7CiAgLy8g4Lir4LmI4Lit4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LmE4Lin4LmJIOC5gOC4nuC4t+C5iOC4reC5g+C4q+C5',
  'ieC4iOC4reC5geC4hOC4muC4i+C5iOC4reC4meC5gOC4ieC4nuC4suC4sOC4guC5ieC4reC4hOC4p+C4suC4oeC5geC4peC4sOC4ouC4seC4h+C5gOC4q+C5h+C4meC5hOC4reC4hOC4reC4meC4reC4ouC4ueC5iAogIHZhciBib2R5ID0gKGxvb2suc3BpbiA/ICc8',
  'c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiAnIDogKGxvb2suaWNvbiA/IGxvb2suaWNvbiArICcgJyA6ICcnKSkgKwogICAgICAgICAgICAgJzxzcGFuIGNsYXNzPSJzeW5jLWxhYmVsIj4nICsgbG9vay50ZXh0ICsgJzwvc3Bhbj4nOwogIHZhciBjbHMgPSAnYiAn',
  'ICsgbG9vay5jbHMgKyAnIHN5bmMtcGlsbCc7CgogIGRvdC5pbm5lckhUTUwgPSBsb29rLmNsaWNrCiAgICA/ICc8YnV0dG9uIGNsYXNzPSInICsgY2xzICsgJyIgc3R5bGU9ImJvcmRlcjowO2N1cnNvcjpwb2ludGVyO2ZvbnQ6aW5oZXJpdCIgJyArCiAgICAgICd0',
  'aXRsZT0iJyArIGVzYyh0aXApICsgJyIgb25jbGljaz0iJyArIGxvb2suY2xpY2sgKyAnIj4nICsgYm9keSArICc8L2J1dHRvbj4nCiAgICA6ICc8c3BhbiBjbGFzcz0iJyArIGNscyArICciIHRpdGxlPSInICsgZXNjKHRpcCkgKyAnIj4nICsgYm9keSArICc8L3Nw',
  'YW4+JzsKfQoKZnVuY3Rpb24gc3luY1Rvb2x0aXAoKXsKICB2YXIgYmFzZSA9IHJlZnJlc2hMYWJlbChQT0xMX1NFQ09ORFMpICsgJyDCtyDguYTguKHguYjguYLguKvguKXguJTguJfguLHguJrguJXguK3guJnguIHguLPguKXguLHguIfguIHguKPguK3guIHguILg',
  'uYnguK3guKHguLnguKUnOwogIGlmICghU1lOQy5hdCkgcmV0dXJuIGJhc2U7CiAgdmFyIGQgPSBuZXcgRGF0ZShTWU5DLmF0KTsKICB2YXIgaGggPSAoJzAnICsgZC5nZXRIb3VycygpKS5zbGljZSgtMiksIG1tID0gKCcwJyArIGQuZ2V0TWludXRlcygpKS5zbGlj',
  'ZSgtMik7CiAgcmV0dXJuICfguJXguKPguIfguIHguLHguJrguILguYnguK3guKHguLnguKXguKvguKXguLHguIfguJrguYnguLLguJnguYDguKHguLfguYjguK0gJyArIGhoICsgJzonICsgbW0gKyAnIOC4mS5cbicgKyBiYXNlOwp9CgovKiog4LmA4LiZ4LmH4LiV',
  '4Liq4Liw4LiU4Li44LiUL+C4q+C4peC4uOC4lCDguJXguYjguLLguIfguIjguLLguIEgIuC5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jOC4leC4reC4muC4p+C5iOC4suC4l+C4s+C5hOC4oeC5iOC5hOC4lOC5iSIg4LiL4Li24LmI4LiH4LmA4Lib4LmH',
  '4LiZ4LiE4Lin4Liy4Lih4Lic4Li04LiU4LiC4Lit4LiH4LiE4Liz4Liq4Lix4LmI4LiHICovCmZ1bmN0aW9uIGlzT2ZmbGluZUVycm9yKGUpewogIGlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3Iub25MaW5lID09PSBmYWxz',
  'ZSkgcmV0dXJuIHRydWU7CiAgdmFyIG0gPSBTdHJpbmcoKGUgJiYgZS5tZXNzYWdlKSB8fCBlIHx8ICcnKTsKICByZXR1cm4gL25ldHdvcmt8ZmFpbGVkfHRpbWVvdXR84LmA4LiE4Lij4Li34Lit4LiC4LmI4Liy4LiifOC5gOC4iuC4t+C5iOC4reC4oeC4leC5iOC4',
  'rXzguYTguKHguYjguYTguJTguYnguKPguLHguJrguILguYnguK3guKHguLnguKXguIjguLLguIHguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYwvaS50ZXN0KG0pOwp9CgovKiog4Lic4Li54LmJ4LmD4LiK4LmJ4LiB4LiU4LiX4Li14LmI4LiV4Lix4Lin',
  '4Lia4Lit4LiB4Liq4LiW4Liy4LiZ4Liw4LiV4Lit4LiZ4Lih4Li14Lib4Lix4LiN4Lir4LiyIOKAlCDguKXguK3guIfguYPguKvguKHguYjguJfguLHguJnguJfguLUgKi8KZnVuY3Rpb24gcmV0cnlTeW5jKCl7CiAgU1lOQy5zdGF0ZSA9ICdzeW5jaW5nJzsKICBz',
  'eW5jUGFpbnQoKTsKICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7Cn0KCi8qKiDguYLguKvguKXguJTguILguYnguK3guKHguLnguKXguYPguKvguKHguYjguJXguK3guJnguJfguLXguYjguJzguLnguYnguYPguIrguYnguJ7guKPguYnguK3guKEgKOC4geC4lOC4iOC4',
  'suC4geC4m+C5ieC4suC4oiAi4Lih4Li14LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmIIikgKi8KZnVuY3Rpb24gbG9hZFBlbmRpbmcoKXsKICBTWU5DLnN0YXRlID0gJ3N5bmNpbmcnOwogIHN5bmNQYWludCgpOwogIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsK',
  'fQoKdmFyIFBPTExfU0VDT05EUyA9IDA7CnZhciBQT0xMX1RJTUVSID0gbnVsbDsKCmZ1bmN0aW9uIHN0YXJ0UG9sbGluZyhzZWNvbmRzKXsKICB2YXIgc2VjID0gTnVtYmVyKHNlY29uZHMgfHwgMCk7CiAgUE9MTF9TRUNPTkRTID0gc2VjOwogIGNsZWFySW50ZXJ2',
  'YWwoUE9MTF9USU1FUik7CgogIGlmICghc2VjKSB7IHN5bmNTZXQoJ3BhdXNlZCcpOyByZXR1cm47IH0gICAvLyDguJvguLTguJTguIHguLLguKPguJXguKPguKfguIjguK3guLHguJXguYLguJnguKHguLHguJXguLQg4oCUIOC4geC4lOC4l+C4teC5iOC4m+C5ieC4',
  'suC4ouC5gOC4nuC4t+C5iOC4reC4i+C4tOC4h+C4geC5jOC5gOC4reC4h+C5hOC4lOC5iQogIHN5bmNTZXQoJ3N5bmNlZCcpOwoKICBQT0xMX1RJTUVSID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKXsKICAgIGlmIChkb2N1bWVudC5oaWRkZW4pIHJldHVybjsKICAg',
  'IGNhbGxBcGkoJ2FwcC52ZXJzaW9uJykudGhlbihmdW5jdGlvbih2KXsKICAgICAgaWYgKFNZTkMuc3RhdGUgPT09ICdvZmZsaW5lJykgc3luY1NldCgnc3luY2VkJyk7ICAgLy8g4LiB4Lil4Lix4Lia4Lih4Liy4LiV4LmI4Lit4LmE4LiU4LmJ4LmB4Lil4LmJ4Lin',
  'CiAgICAgIGlmICghdiB8fCAhdi52ZXJzaW9uIHx8IHYudmVyc2lvbiA9PT0gUy52ZXJzaW9uKSByZXR1cm47CiAgICAgIFMudmVyc2lvbiA9IHYudmVyc2lvbjsKCiAgICAgIC8vIOC5gOC4o+C4suC5gOC4m+C5h+C4meC4hOC4meC5geC4geC5ieC5gOC4reC4hyDg',
  'uYHguKXguLDguKvguJnguYnguLLguIHguYfguIvguLTguIfguIHguYzguYTguJvguYHguKXguYnguKfguJXguK3guJnguIHguJTguJrguLHguJnguJfguLbguIEKICAgICAgaWYgKERhdGUubm93KCkgPCBTLnNlbGZDaGFuZ2VVbnRpbCkgcmV0dXJuOwoKICAgICAg',
  'Ly8g4LiB4Liz4Lil4Lix4LiH4LiB4Lij4Lit4LiB4LiC4LmJ4Lit4Lih4Li54Lil4Lit4Lii4Li54LmIIOKAlCDguKvguYnguLLguKHguYLguKvguKXguJTguJfguLHguJog4Lij4Lit4LmD4Lir4LmJ4Lic4Li54LmJ4LmD4LiK4LmJ4LiB4LiU4LmA4Lit4LiHCiAg',
  'ICAgIGlmICh1c2VySXNCdXN5KCkpIHsgc3luY1NldCgncGVuZGluZycpOyByZXR1cm47IH0KCiAgICAgIC8vIOC4i+C4tOC4h+C4geC5jOC5gOC4h+C4teC4ouC4miDguYYg4LmE4Lih4LmI4Lil4LmJ4Liy4LiH4Lir4LiZ4LmJ4LiyIOC5hOC4oeC5iOC5gOC4lOC5',
  'ieC4h+C4geC4peC4seC4muC5hOC4m+C4muC4meC4quC4uOC4lAogICAgICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgc3luY1NldChpc09mZmxpbmVFcnJvcihlKSA/ICdvZmZsaW5lJyA6ICdlcnJvcicsIChl',
  'ICYmIGUubWVzc2FnZSkgfHwgU3RyaW5nKGUpKTsKICAgIH0pOwogIH0sIHNlYyAqIDEwMDApOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIGZvcm1hdCBoZWxwZXJzIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIGVzYyhzKXsKICByZXR1cm4gU3RyaW5nKHM9',
  'PW51bGw/Jyc6cykKICAgIC5yZXBsYWNlKC8mL2csJyZhbXA7JykucmVwbGFjZSgvPC9nLCcmbHQ7JykucmVwbGFjZSgvPi9nLCcmZ3Q7JykKICAgIC5yZXBsYWNlKC8iL2csJyZxdW90OycpLnJlcGxhY2UoLycvZywnJiMzOTsnKTsKfQpmdW5jdGlvbiBtb25leShu',
  'LCBkZWMpewogIHZhciB2ID0gTnVtYmVyKG58fDApOwogIHJldHVybiB2LnRvTG9jYWxlU3RyaW5nKCd0aC1USCcse21pbmltdW1GcmFjdGlvbkRpZ2l0czpkZWN8fDAsIG1heGltdW1GcmFjdGlvbkRpZ2l0czpkZWN8fDB9KTsKfQpmdW5jdGlvbiBiYWh0KG4peyBy',
  'ZXR1cm4gbW9uZXkobikgKyAnIOC4vyc7IH0KZnVuY3Rpb24gcGN0KG4peyByZXR1cm4gKE51bWJlcihuKXx8MCkudG9GaXhlZCgxKSArICclJzsgfQpmdW5jdGlvbiBudW0obil7IHJldHVybiBuPT1udWxsfHxuPT09JycgPyAn4oCTJyA6IG1vbmV5KG4pOyB9Cgov',
  'KiogMjAyNi0wNC0yNiAtPiAyNiDguYDguKEu4LiiLiAyNTY5ICovCnZhciBUSF9NT04gPSBbJ+C4oS7guIQuJywn4LiBLuC4ni4nLCfguKHguLUu4LiELicsJ+C5gOC4oS7guKIuJywn4LieLuC4hC4nLCfguKHguLQu4LiiLicsJ+C4gS7guIQuJywn4LiqLuC4hC4n',
  'LCfguIEu4LiiLicsJ+C4lS7guIQuJywn4LieLuC4oi4nLCfguJgu4LiELiddOwpmdW5jdGlvbiB0aERhdGUoaXNvKXsKICBpZiAoIWlzbykgcmV0dXJuICfigJMnOwogIHZhciBtID0gU3RyaW5nKGlzbykubWF0Y2goL14oXGR7NH0pLShcZHsyfSktKFxkezJ9KS8p',
  'OwogIGlmICghbSkgcmV0dXJuIGVzYyhpc28pOwogIHJldHVybiBOdW1iZXIobVszXSkgKyAnICcgKyBUSF9NT05bTnVtYmVyKG1bMl0pLTFdICsgJyAnICsgKE51bWJlcihtWzFdKSs1NDMpOwp9CmZ1bmN0aW9uIHRoRGF0ZVNob3J0KGlzbyl7CiAgaWYgKCFpc28p',
  'IHJldHVybiAn4oCTJzsKICB2YXIgbSA9IFN0cmluZyhpc28pLm1hdGNoKC9eKFxkezR9KS0oXGR7Mn0pLShcZHsyfSkvKTsKICBpZiAoIW0pIHJldHVybiBlc2MoaXNvKTsKICByZXR1cm4gTnVtYmVyKG1bM10pICsgJy8nICsgTnVtYmVyKG1bMl0pICsgJy8nICsg',
  'U3RyaW5nKE51bWJlcihtWzFdKSs1NDMpLnNsaWNlKDIpOwp9CmZ1bmN0aW9uIGRheXNBZ28oaXNvKXsKICBpZiAoIWlzbykgcmV0dXJuIG51bGw7CiAgcmV0dXJuIE1hdGgucm91bmQoKERhdGUubm93KCkgLSBuZXcgRGF0ZShpc28pLmdldFRpbWUoKSkvODY0MDAw',
  'MDApOwp9CgpmdW5jdGlvbiBzdGF0dXNCYWRnZShzdCl7CiAgdmFyIG1hcCA9IHsKICAgICfguYDguKrguKPguYfguIjguKrguLTguYnguJknOidvaycsJ+C4lOC4s+C5gOC4meC4tOC4meC4geC4suC4o+C5geC4peC5ieC4pyc6J29rJywn4LmD4LiK4LmJ4LiH4Liy',
  '4LiZ4Lib4LiB4LiV4Li0Jzonb2snLCfguJvguLTguJTguKvguJnguLXguYnguYHguKXguYnguKcnOidvaycsJ+C4reC4ouC4ueC5iOC5g+C4meC4m+C4o+C4sOC4geC4seC4mSc6J29rJywn4Lih4Li14Lic4Li54LmJ4LmA4LiK4LmI4LiyJzonb2snLCfguJvguIHg',
  'uJXguLQnOidvaycsCiAgICAn4LiB4Liz4Lil4Lix4LiH4LiL4LmI4Lit4LihJzonaW5mbycsJ+C4geC4s+C4peC4seC4h+C4lOC4s+C5gOC4meC4tOC4meC4geC4suC4oyc6J2luZm8nLCfguJnguLHguJTguKvguKHguLLguKLguYHguKXguYnguKcnOidpbmZvJywn',
  '4LiB4Liz4Lil4Lix4LiH4Lic4LmI4Lit4LiZJzonaW5mbycsJ+C4p+C5iOC4suC4hyc6J2luZm8nLAogICAgJ+C4o+C4reC4lOC4s+C5gOC4meC4tOC4meC4geC4suC4oyc6J3dhcm4nLCfguYDguKXguLfguYjguK3guJnguJnguLHguJQnOid3YXJuJywn4LmD4LiB',
  '4Lil4LmJ4Lir4Lih4LiU4Lib4Lij4Liw4LiB4Lix4LiZJzond2FybicsJ+C4leC5ieC4reC4h+C4i+C5iOC4reC4oSc6J3dhcm4nLCfguJ7guLHguIHguIrguLPguKPguLAnOid3YXJuJywn4Lib4Li04LiU4Lib4Lij4Lix4Lia4Lib4Lij4Li44LiHJzond2Fybics',
  'J+C5gOC4geC4tOC4meC4geC4s+C4q+C4meC4lCc6J3dhcm4nLCfguKLguLHguIfguYTguKHguYjguYDguITguKLguKXguYnguLLguIcnOid3YXJuJywKICAgICfguKLguIHguYDguKXguLTguIEnOidtdXRlJywn4Lib4Lil4LiU4Lij4Liw4Lin4Liy4LiHJzonbXV0',
  'ZScsJ+C5hOC4oeC5iOC4o+C4sOC4muC4uCc6J211dGUnLAogICAgJ+C4q+C4oeC4lOC4reC4suC4ouC4uOC5geC4peC5ieC4pyc6J2RncicsJ+C4lOC5iOC4p+C4meC4oeC4suC4gSc6J2RncicsJ+C4lOC5iOC4p+C4mSc6J3dhcm4nCiAgfTsKICBpZiAoIXN0KSBy',
  'ZXR1cm4gJyc7CiAgcmV0dXJuICc8c3BhbiBjbGFzcz0iYiAnICsgKG1hcFtzdF18fCdtdXRlJykgKyAnIj4nICsgZXNjKHN0KSArICc8L3NwYW4+JzsKfQoKZnVuY3Rpb24gcHJvZ3Jlc3MocGVyY2VudCwgY2xzKXsKICB2YXIgcCA9IE1hdGgubWF4KDAsIE1hdGgu',
  'bWluKDEwMCwgTnVtYmVyKHBlcmNlbnQpfHwwKSk7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJwYmFyICcgKyAoY2xzfHwnJykgKyAnIj48aSBzdHlsZT0id2lkdGg6JyArIHAgKyAnJSI+PC9pPjwvZGl2Pic7Cn0KCmZ1bmN0aW9uIHRodW1ic0h0bWwocmVmcywgYmln',
  'KXsKICBpZiAoIXJlZnMgfHwgIXJlZnMubGVuZ3RoKSByZXR1cm4gJzxzcGFuIGNsYXNzPSJmYWludCBmczEyIj7igJM8L3NwYW4+JzsKICByZXR1cm4gJzxkaXYgY2xhc3M9InRodW1icyI+JyArIHJlZnMubWFwKGZ1bmN0aW9uKHIpewogICAgaWYgKHIudGh1bWIp',
  'IHsKICAgICAgcmV0dXJuICc8aW1nIGNsYXNzPSJ0aHVtYicgKyAoYmlnPycgYmlnJzonJykgKyAnIiBsb2FkaW5nPSJsYXp5IiBzcmM9IicgKyBlc2Moci50aHVtYikgKyAnIiAnICsKICAgICAgICAgICAgICdvbmNsaWNrPSJ3aW5kb3cub3BlbihcJycgKyBlc2Mo',
  'ci51cmwpICsgJ1wnLFwnX2JsYW5rXCcpIiAnICsKICAgICAgICAgICAgICdvbmVycm9yPSJ0aGlzLm9uZXJyb3I9bnVsbDt0aGlzLnJlcGxhY2VXaXRoKGZpbGVDaGlwKCcgKyBKU09OLnN0cmluZ2lmeShKU09OLnN0cmluZ2lmeShyKSkucmVwbGFjZSgvIi9nLCcm',
  'cXVvdDsnKSArICcpKSI+JzsKICAgIH0KICAgIHJldHVybiAnPGEgY2xhc3M9ImIgaW5mbyIgaHJlZj0iJyArIGVzYyhyLnVybCkgKyAnIiB0YXJnZXQ9Il9ibGFuayI+4LmE4Lif4Lil4LmMPC9hPic7CiAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKfQpmdW5jdGlv',
  'biBmaWxlQ2hpcChqc29uKXsKICB2YXIgciA9IHR5cGVvZiBqc29uID09PSAnc3RyaW5nJyA/IEpTT04ucGFyc2UoanNvbikgOiBqc29uOwogIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpOwogIGEuY2xhc3NOYW1lID0gJ2IgaW5mbyc7IGEuaHJl',
  'ZiA9IHIudXJsOyBhLnRhcmdldCA9ICdfYmxhbmsnOyBhLnRleHRDb250ZW50ID0gJ/Cfk44g4LmE4Lif4Lil4LmMJzsKICByZXR1cm4gYTsKfQoKZnVuY3Rpb24gZW1wdHlCb3godGV4dCwgYWN0aW9uKXsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2',
  'IGNsYXNzPSJiaWciPvCfl4LvuI88L2Rpdj4nICsgZXNjKHRleHQpICsKICAgICAgICAgKGFjdGlvbiA/ICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgYWN0aW9uICsgJzwvZGl2PicgOiAnJykgKyAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gYmFyQ2hhcnQoaXRlbXMsIGxh',
  'YmVsS2V5LCB2YWx1ZUtleSwgZm9ybWF0dGVyKXsKICBpZiAoIWl0ZW1zIHx8ICFpdGVtcy5sZW5ndGgpIHJldHVybiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4guC5ieC4reC4oeC4ueC4pTwvZGl2Pic7CiAgdmFyIG1heCA9',
  'IE1hdGgubWF4LmFwcGx5KG51bGwsIGl0ZW1zLm1hcChmdW5jdGlvbihpKXsgcmV0dXJuIE51bWJlcihpW3ZhbHVlS2V5XSl8fDA7IH0pKSB8fCAxOwogIHJldHVybiAnPGRpdiBjbGFzcz0iYmFycyI+JyArIGl0ZW1zLm1hcChmdW5jdGlvbihpKXsKICAgIHZhciB2',
  'ID0gTnVtYmVyKGlbdmFsdWVLZXldKXx8MDsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0iYmFyLXJvdyI+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJjbGlwIiB0aXRsZT0iJyArIGVzYyhpW2xhYmVsS2V5XSkgKyAnIj4nICsgZXNjKGlbbGFiZWxLZXldKSArICc8L2Rp',
  'dj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImJhci10cmFjayI+PGRpdiBjbGFzcz0iYmFyLWZpbGwiIHN0eWxlPSJ3aWR0aDonICsgKHYvbWF4KjEwMCkgKyAnJSI+PC9kaXY+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJ2Ij4nICsgKGZvcm1hdHRlciA/IGZv',
  'cm1hdHRlcihpKSA6IG1vbmV5KHYpKSArICc8L2Rpdj4nICsKICAgICc8L2Rpdj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0gbW9kYWwgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gb3Blbk1vZGFsKHRpdGxl',
  'LCBib2R5SHRtbCwgZm9vdEh0bWwsIHdpZGUpewogIHZhciByb290ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vZGFsUm9vdCcpOwogIHJvb3QuaW5uZXJIVE1MID0KICAgICc8ZGl2IGNsYXNzPSJvdiIgb25jbGljaz0iaWYoZXZlbnQudGFyZ2V0PT09dGhp',
  'cyljbG9zZU1vZGFsKCkiPicgKwogICAgICAnPGRpdiBjbGFzcz0ibW9kYWwnICsgKHdpZGU/JyB3aWRlJzonJykgKyAnIj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0ibW9kYWwtaCI+PGgzPicgKyBlc2ModGl0bGUpICsgJzwvaDM+PGJ1dHRvbiBjbGFzcz0ieCIg',
  'b25jbGljaz0iY2xvc2VNb2RhbCgpIj7DlzwvYnV0dG9uPjwvZGl2PicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJtb2RhbC1iIj4nICsgYm9keUh0bWwgKyAnPC9kaXY+JyArCiAgICAgICAgKGZvb3RIdG1sID8gJzxkaXYgY2xhc3M9Im1vZGFsLWYiPicgKyBmb290',
  'SHRtbCArICc8L2Rpdj4nIDogJycpICsKICAgICAgJzwvZGl2PicgKwogICAgJzwvZGl2Pic7CiAgYXBwbHlSZWFkT25seShyb290KTsKICBkb2N1bWVudC5ib2R5LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7Cn0KZnVuY3Rpb24gY2xvc2VNb2RhbCgpewogIGRv',
  'Y3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb2RhbFJvb3QnKS5pbm5lckhUTUwgPSAnJzsKICBkb2N1bWVudC5ib2R5LnN0eWxlLm92ZXJmbG93ID0gJyc7Cn0KZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGUpeyBpZiAoZS5rZXkg',
  'PT09ICdFc2NhcGUnKSBjbG9zZU1vZGFsKCk7IH0pOwoKZnVuY3Rpb24gY29uZmlybUFjdGlvbih0ZXh0LCBvblllcyl7CiAgb3Blbk1vZGFsKCfguKLguLfguJnguKLguLHguJknLAogICAgJzxwPicgKyBlc2ModGV4dCkgKyAnPC9wPicsCiAgICAnPGJ1dHRvbiBj',
  'bGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4gTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBkZ3IiIGlkPSJjZm1CdG4iPuC4ouC4t+C4meC4ouC4seC4mTwvYnV0dG9uPicpOwogIGRvY3VtZW50Lmdl',
  'dEVsZW1lbnRCeUlkKCdjZm1CdG4nKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsgY2xvc2VNb2RhbCgpOyBvblllcygpOyB9Owp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIHRvYXN0IC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIHRvYXN0KG1zZywga2luZCl7CiAg',
  'dmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgZWwuY2xhc3NOYW1lID0gJ3RvYXN0ICcgKyAoa2luZHx8JycpOwogIGVsLnRleHRDb250ZW50ID0gbXNnOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2FzdFJvb3QnKS5hcHBlbmRD',
  'aGlsZChlbCk7CiAgc2V0VGltZW91dChmdW5jdGlvbigpeyBlbC5yZW1vdmUoKTsgfSwga2luZD09PSdlcnInID8gNTIwMCA6IDI4MDApOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIG5hdiAobW9iaWxlKSAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiB0b2dn',
  'bGVOYXYoKXsKICB2YXIgbmF2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdicpOwogIG5hdi5jbGFzc0xpc3QudG9nZ2xlKCdvcGVuJyk7CiAgaWYgKG5hdi5jbGFzc0xpc3QuY29udGFpbnMoJ29wZW4nKSkgewogICAgdmFyIHMgPSBkb2N1bWVudC5jcmVh',
  'dGVFbGVtZW50KCdkaXYnKTsKICAgIHMuY2xhc3NOYW1lID0gJ3NjcmltJzsgcy5pZCA9ICdzY3JpbSc7CiAgICBzLm9uY2xpY2sgPSBmdW5jdGlvbigpeyBuYXYuY2xhc3NMaXN0LnJlbW92ZSgnb3BlbicpOyByZW1vdmVTY3JpbSgpOyB9OwogICAgZG9jdW1lbnQu',
  'Ym9keS5hcHBlbmRDaGlsZChzKTsKICB9IGVsc2UgcmVtb3ZlU2NyaW0oKTsKfQpmdW5jdGlvbiByZW1vdmVTY3JpbSgpewogIHZhciBzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NjcmltJyk7CiAgaWYgKHMpIHMucmVtb3ZlKCk7Cn0KCi8qIC0tLS0tLS0t',
  'LS0tLS0tLS0gc2VhcmNoIC0tLS0tLS0tLS0tLS0tLS0gKi8KCnZhciBzZWFyY2hUaW1lciA9IG51bGw7CmZ1bmN0aW9uIG9uU2VhcmNoKHEpewogIGNsZWFyVGltZW91dChzZWFyY2hUaW1lcik7CiAgaWYgKCFxIHx8IHEudHJpbSgpLmxlbmd0aCA8IDIpIHJldHVy',
  'bjsKICBzZWFyY2hUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2FwcC5zZWFyY2gnLCB7IHE6IHEgfSkudGhlbihmdW5jdGlvbihyb3dzKXsKICAgICAgb3Blbk1vZGFsKCfguJzguKXguIHguLLguKPguITguYnguJnguKvguLIgIicg',
  'KyBxICsgJyIgKCcgKyByb3dzLmxlbmd0aCArICcpJywKICAgICAgICByb3dzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJhbGlzdCI+JyArIHJvd3MubWFwKGZ1bmN0aW9uKHIpewogICAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJhbGkiIG9uY2xpY2s9ImNsb3Nl',
  'TW9kYWwoKTtnbyhcJycgKyBqdW1wUGFnZShyLm1vZHVsZSkgKyAnXCcpIj4nICsKICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImljIj4nICsgbW9kdWxlSWNvbihyLm1vZHVsZSkgKyAnPC9kaXY+PGRpdj4nICsKICAgICAgICAgICAgJzxkaXYgY2xhc3M9InR0Ij4n',
  'ICsgZXNjKHIudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAgICAnPGRpdiBjbGFzcz0iZGQiPicgKyBlc2Moci5sYWJlbCkgKyAoci5kZXRhaWwgPyAnIMK3ICcgKyBlc2Moci5kZXRhaWwpIDogJycpICsgJzwvZGl2PicgKwogICAgICAgICAgICAnPC9kaXY+',
  'PC9kaXY+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nCiAgICAgICAgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC5hOC4oeC5iOC4nuC4muC4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4leC4o+C4h+C4geC4seC4muC4hOC4s+C4hOC5ieC4mTwvZGl2',
  'PicsICcnLCB0cnVlKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsICdlcnInKTsgfSk7CiAgfSwgNDIwKTsKfQpmdW5jdGlvbiBqdW1wUGFnZShtb2R1bGUpewogIHJldHVybiAoe3B1cmNoYXNlczoncHVyY2hhc2VzJywgcmVw',
  'YWlyczoncmVwYWlycycsIGJ1aWxkaW5nOididWlsZGluZycsIGFjOidhYycsIGRlYnQ6J2RlYnRNYWluJywgcm9vbXM6J3Jvb21zJ30pW21vZHVsZV0gfHwgJ2Rhc2hib2FyZCc7Cn0KZnVuY3Rpb24gbW9kdWxlSWNvbihtb2R1bGUpewogIHJldHVybiAoe3B1cmNo',
  'YXNlczon8J+bkicsIHJlcGFpcnM6J/CflKcnLCBidWlsZGluZzon8J+PoicsIGFjOifinYTvuI8nLCBkZWJ0Oifwn5KwJywgcm9vbXM6J/CfmqonfSlbbW9kdWxlXSB8fCAn8J+ThCc7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0gZmlsZSB1cGxvYWQgLS0tLS0tLS0t',
  'LS0tLS0tLSAqLwoKLyoqCiAqIOC4reC5iOC4suC4meC5hOC4n+C4peC5jOC4iOC4suC4gSA8aW5wdXQgdHlwZT1maWxlPiDguYDguJvguYfguJkgZGF0YVVSTCDguYHguKXguYnguKfguKrguYjguIfguILguLbguYnguJkgRHJpdmUKICog4LiE4Li34LiZIGFycmF5',
  'IOC4guC4reC4hyB7aWQsbmFtZSx1cmwsdGh1bWJ9CiAqLwpmdW5jdGlvbiB1cGxvYWRGaWxlcyhpbnB1dEVsLCBidWNrZXQpewogIHZhciBmaWxlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGlucHV0RWwuZmlsZXMgfHwgW10pOwogIGlmICghZmlsZXMu',
  'bGVuZ3RoKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTsKICB2YXIgTUFYID0gMTIgKiAxMDI0ICogMTAyNDsKICB2YXIgdG9vQmlnID0gZmlsZXMuZmlsdGVyKGZ1bmN0aW9uKGYpeyByZXR1cm4gZi5zaXplID4gTUFYOyB9KTsKICBpZiAodG9vQmlnLmxlbmd0',
  'aCkgewogICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcign4LmE4Lif4Lil4LmM4LmD4Lir4LiN4LmI4LmA4LiB4Li04LiZIDEyIE1COiAnICsgdG9vQmlnLm1hcChmdW5jdGlvbihmKXtyZXR1cm4gZi5uYW1lO30pLmpvaW4oJywgJykpKTsKICB9CiAg',
  'cmV0dXJuIFByb21pc2UuYWxsKGZpbGVzLm1hcChyZWFkQXNEYXRhVXJsKSkKICAgIC50aGVuKGZ1bmN0aW9uKHBheWxvYWRzKXsgcmV0dXJuIGNhbGxBcGkoJ2ZpbGUudXBsb2FkJywgeyBidWNrZXQ6IGJ1Y2tldCwgZmlsZXM6IHBheWxvYWRzIH0pOyB9KTsKfQoK',
  'ZnVuY3Rpb24gcmVhZEFzRGF0YVVybChmaWxlKXsKICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXsKICAgIHZhciByID0gbmV3IEZpbGVSZWFkZXIoKTsKICAgIHIub25sb2FkID0gZnVuY3Rpb24oKXsgcmVzb2x2ZSh7IG5hbWU6',
  'IGZpbGUubmFtZSwgbWltZVR5cGU6IGZpbGUudHlwZSwgZGF0YVVybDogci5yZXN1bHQgfSk7IH07CiAgICByLm9uZXJyb3IgPSBmdW5jdGlvbigpeyByZWplY3QobmV3IEVycm9yKCfguK3guYjguLLguJnguYTguJ/guKXguYzguYTguKHguYjguKrguLPguYDguKPg',
  'uYfguIg6ICcgKyBmaWxlLm5hbWUpKTsgfTsKICAgIHIucmVhZEFzRGF0YVVSTChmaWxlKTsKICB9KTsKfQo8L3NjcmlwdD4KPHNjcmlwdD4KLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIEF1dGgu',
  'aHRtbCDigJQg4Lir4LiZ4LmJ4Liy4Lil4LmH4Lit4LiB4Lit4Li04LiZIMK3IFBJTiA2IOC4q+C4peC4seC4gSDCtyDguYDguJvguKXguLXguYjguKLguJnguKPguKvguLHguKrguJzguYjguLLguJkKCiAgIOC4l+C4teC5iOC5gOC4geC5h+C4muC4guC4reC4h+C4',
  'neC4seC5iOC4h+C5gOC4muC4o+C4suC4p+C5jOC5gOC4i+C4reC4o+C5jCAyIOC4iuC4seC5ieC4mSDguYDguJ7guKPguLLguLDguYDguKfguYfguJrguYHguK3guJvguILguK3guIcgQXBwcyBTY3JpcHQKICAg4LiX4Liz4LiH4Liy4LiZ4LmD4LiZIGlmcmFtZSDg',
  'uJfguLXguYjguIrguLfguYjguK3guYLguJTguYDguKHguJnguYDguJvguKXguLXguYjguKLguJnguJfguLjguIHguITguKPguLHguYnguIfguJfguLXguYjguYDguJvguLTguJQKICAgbG9jYWxTdG9yYWdlIOC4iOC4tuC4h+C4q+C4suC4ouC5hOC4lOC5iSDguJXg',
  'uYnguK3guIfguKHguLXguJfguLLguIfguKrguLPguKPguK3guIcKICAgICDCtyDguKPguKvguLHguKrguK3guYnguLLguIfguK3guLTguIfguIHguLLguKPguYDguILguYnguLLguYPguIrguYnguIfguLLguJkgKOC4reC4suC4ouC4uOC4quC4seC5ieC4mSkg4oCU',
  'IOC5gOC4geC5h+C4muC5g+C4mSBsb2NhbFN0b3JhZ2Ug4Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinCiAgICAgICDguKvguLLguKLguIHguYfguYHguITguYjguYPguKrguYggUElOIOC5g+C4q+C4oeC5iAogICAgIMK3IOC4o+C4q+C4seC4quC4reC4uOC4',
  'm+C4geC4o+C4k+C5jCAo4LiE4Li54LmI4LiB4Lix4LiaIFBJTikg4oCUIOC5gOC4geC5h+C4muC4l+C4seC5ieC4hyBsb2NhbFN0b3JhZ2Ug4LmB4Lil4Liw4LmD4LiZIFVSTCDguILguK3guIfguKvguJnguYnguLLguYHguKHguYgKICAgICAgIOC4nOC5iOC4suC4',
  'mSBnb29nbGUuc2NyaXB0Lmhpc3Rvcnkg4LmA4Lie4Li34LmI4Lit4LmD4Lir4LmJ4Lii4Lix4LiH4Lit4Lii4Li54LmI4Lir4Lil4Lix4LiH4Lib4Li04LiU4LmA4Lib4Li04LiU4LmA4LiE4Lij4Li34LmI4Lit4LiHCiAgID09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKdmFyIEFVVEggPSB7CiAgc2Vzc2lvbjogJycsCiAgZGV2aWNlOiAnJywKICBtZTogbnVsbCwKICBwaW46ICcnLAogIHNjcmVlbjogJycKfTsKCnZhciBMU19TRVNTSU9OID0gJ21jb3JuZXIuc2Vz',
  'c2lvbic7CnZhciBMU19ERVZJQ0UgID0gJ21jb3JuZXIuZGV2aWNlJzsKCi8qIC0tLS0tLS0tLS0tLS0tLS0g4LiX4Li14LmI4LmA4LiB4LmH4Lia4Lid4Lix4LmI4LiH4LmA4Lia4Lij4Liy4Lin4LmM4LmA4LiL4Lit4Lij4LmMIC0tLS0tLS0tLS0tLS0tLS0gKi8K',
  'CmZ1bmN0aW9uIGxzR2V0KGspewogIHRyeSB7IHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oaykgfHwgJyc7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuICcnOyB9Cn0KZnVuY3Rpb24gbHNTZXQoaywgdil7CiAgdHJ5IHsgdiA/IHdpbmRvdy5sb2NhbFN0',
  'b3JhZ2Uuc2V0SXRlbShrLCB2KSA6IHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrKTsgfQogIGNhdGNoIChlKSB7IC8qIOC5guC4q+C4oeC4lOC4quC5iOC4p+C4meC4leC4seC4p+C4q+C4o+C4t+C4reC4m+C4tOC4lOC4hOC4uOC4geC4geC4teC5ieC5',
  'hOC4p+C5iSDigJQg4LmD4LiK4LmJ4LiX4Liy4LiH4Liq4Liz4Lij4Lit4LiHICovIH0KfQoKLyoqIOC5gOC4guC4teC4ouC4meC4o+C4q+C4seC4quC4reC4uOC4m+C4geC4o+C4k+C5jOC4peC4hyBVUkwg4LiC4Lit4LiH4Lir4LiZ4LmJ4Liy4LmB4Lih4LmIIOC5',
  'g+C4q+C5ieC4o+C4reC4lOC4guC5ieC4suC4oeC4geC4suC4o+C5gOC4m+C4tOC4lOC5g+C4q+C4oeC5iCAqLwpmdW5jdGlvbiBkZXZpY2VUb1VybCh0b2tlbil7CiAgdHJ5IHsKICAgIGlmICghd2luZG93Lmdvb2dsZSB8fCAhZ29vZ2xlLnNjcmlwdCB8fCAhZ29v',
  'Z2xlLnNjcmlwdC5oaXN0b3J5KSByZXR1cm47CiAgICB2YXIgcGFyYW1zID0ge307CiAgICBpZiAoYWNjZXNzS2V5KCkpIHBhcmFtcy5rZXkgPSBhY2Nlc3NLZXkoKTsKICAgIGlmICh0b2tlbikgcGFyYW1zLmQgPSB0b2tlbjsKICAgIGdvb2dsZS5zY3JpcHQuaGlz',
  'dG9yeS5yZXBsYWNlU3RhdGUoe30sIHBhcmFtcywgbG9jYXRpb24uaGFzaCk7CiAgfSBjYXRjaCAoZSkgeyAvKiDguYTguKHguYjguYPguIrguYjguYDguKfguYfguJrguYHguK3guJsgKOC5gOC4iuC5iOC4meC5gOC4m+C4tOC4lOC5g+C4mSBkaWFsb2cpIOKAlCDg',
  'uILguYnguLLguKHguYTguJsgKi8gfQp9CgpmdW5jdGlvbiBzYXZlRGV2aWNlKHRva2VuKXsKICBBVVRILmRldmljZSA9IHRva2VuIHx8ICcnOwogIGxzU2V0KExTX0RFVklDRSwgQVVUSC5kZXZpY2UpOwogIGRldmljZVRvVXJsKEFVVEguZGV2aWNlKTsKfQoKZnVu',
  'Y3Rpb24gc2F2ZVNlc3Npb24odG9rZW4pewogIEFVVEguc2Vzc2lvbiA9IHRva2VuIHx8ICcnOwogIGxzU2V0KExTX1NFU1NJT04sIEFVVEguc2Vzc2lvbik7Cn0KCi8qKiDguK3guYjguLLguJnguITguYjguLLguJfguLXguYjguYDguIHguYfguJrguYTguKfguYng',
  'uJfguLHguYnguIfguKvguKHguJQgKOC4leC5ieC4reC4h+C4o+C4rSBVUkwg4LiC4Lit4LiH4Lir4LiZ4LmJ4Liy4LmB4Lih4LmIIOC4iOC4tuC4h+C5gOC4m+C5h+C4meC5geC4muC4miBjYWxsYmFjaykgKi8KZnVuY3Rpb24gbG9hZFN0b3JlZChkb25lKXsKICBB',
  'VVRILnNlc3Npb24gPSBsc0dldChMU19TRVNTSU9OKTsKICBBVVRILmRldmljZSAgPSBsc0dldChMU19ERVZJQ0UpOwoKICBpZiAod2luZG93Lmdvb2dsZSAmJiBnb29nbGUuc2NyaXB0ICYmIGdvb2dsZS5zY3JpcHQudXJsKSB7CiAgICB0cnkgewogICAgICBnb29n',
  'bGUuc2NyaXB0LnVybC5nZXRMb2NhdGlvbihmdW5jdGlvbihsb2MpewogICAgICAgIHZhciBwID0gKGxvYyAmJiBsb2MucGFyYW1ldGVyKSB8fCB7fTsKICAgICAgICBpZiAocC5kICYmICFBVVRILmRldmljZSkgeyBBVVRILmRldmljZSA9IFN0cmluZyhwLmQpOyBs',
  'c1NldChMU19ERVZJQ0UsIEFVVEguZGV2aWNlKTsgfQogICAgICAgIGlmIChwLmtleSAmJiAhYWNjZXNzS2V5KCkpIFJFU09MVkVEX0tFWSA9IFN0cmluZyhwLmtleSk7CiAgICAgICAgZG9uZSgpOwogICAgICB9KTsKICAgICAgcmV0dXJuOwogICAgfSBjYXRjaCAo',
  'ZSkgeyAvKiDguYPguIrguYnguJfguLLguIfguJvguIHguJXguLQgKi8gfQogIH0KICBkb25lKCk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4LiV4Lix4Lin4LiE4Li44Lih4Lil4Liz4LiU4Lix4Lia4Lir4LiZ4LmJ4Liy4LiI4LitIC0tLS0tLS0tLS0tLS0tLS0g',
  'Ki8KCi8qKiDguYDguKPguLXguKLguIHguJXguK3guJnguYDguJvguLTguJTguKvguJnguYnguLLguYDguKfguYfguJog4oCUIOC4leC4seC4lOC4quC4tOC4meC4p+C5iOC4suC4iOC4sOC5g+C4q+C5ieC5gOC4q+C5h+C4meC4reC4sOC5hOC4o+C4geC5iOC4reC4',
  'mSAqLwpmdW5jdGlvbiBhdXRoR2F0ZSgpewogIGxvYWRTdG9yZWQoZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2F1dGgubWUnKS50aGVuKGZ1bmN0aW9uKG1lKXsKICAgICAgQVVUSC5tZSA9IG1lOwogICAgICBpZiAobWUuc2lnbmVkSW4pIHJldHVybiBlbnRlckFw',
  'cChtZSk7CiAgICAgIGlmIChBVVRILmRldmljZSkgcmV0dXJuIHNob3dQaW4oKTsKICAgICAgc2hvd0xvZ2luKCk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgc2hvd0xvZ2luKGUubWVzc2FnZSB8fCBlKTsKICAgIH0pOwogIH0pOwp9CgpmdW5jdGlv',
  'biBlbnRlckFwcChtZSl7CiAgQVVUSC5tZSA9IG1lOwogIGhpZGVBdXRoKCk7CiAgYm9vdE5vdygpOwogIC8vIOC5gOC4nuC4tOC5iOC4h+C4peC5h+C4reC4geC4reC4tOC4meC4lOC5ieC4p+C4ouC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5geC4peC4sOC4ouC4',
  'seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4leC4seC5ieC4hyBQSU4g4Lia4LiZ4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJIOKAlCDguIrguKfguJnguJXguLHguYnguIfguKrguLHguIHguITguKPguLHguYnguIcKICBpZiAoIUFVVEguZGV2aWNlICYmIG1l',
  'LnVzZXJuYW1lICYmICFsc0dldCgnbWNvcm5lci5waW5Bc2tlZCcpKSB7CiAgICBzZXRUaW1lb3V0KG9mZmVyUGluLCA5MDApOwogIH0KfQoKZnVuY3Rpb24gaGlkZUF1dGgoKXsKICB2YXIgciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdXRoUm9vdCcpOwog',
  'IGlmIChyKSByLmlubmVySFRNTCA9ICcnOwogIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbG9ja2VkJyk7Cn0KCmZ1bmN0aW9uIHNob3dBdXRoKGh0bWwpewogIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnbG9ja2VkJyk7CiAgZG9jdW1lbnQu',
  'Z2V0RWxlbWVudEJ5SWQoJ2F1dGhSb290JykuaW5uZXJIVE1MID0KICAgICc8ZGl2IGNsYXNzPSJhdXRoLXdyYXAiPjxkaXYgY2xhc3M9ImF1dGgtY2FyZCI+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJhdXRoLWJyYW5kIj7wn4+iIDxiPicgKyBlc2MoKFMuYm9vdCAm',
  'JiBTLmJvb3QuYXBwICYmIFMuYm9vdC5hcHAubmFtZSkgfHwgJ1RoZSBNIENvcm5lciBBUCcpICsgJzwvYj48L2Rpdj4nICsKICAgICAgaHRtbCArCiAgICAnPC9kaXY+PC9kaXY+JzsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguKvguJnguYnguLLguKXguYfguK3g',
  'uIHguK3guLTguJnguJTguYnguKfguKLguKPguKvguLHguKrguJzguYjguLLguJkgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gc2hvd0xvZ2luKGVycil7CiAgQVVUSC5zY3JlZW4gPSAnbG9naW4nOwogIHNob3dBdXRoKAogICAgJzxoMiBjbGFzcz0iYXV0',
  'aC1oIj7guYDguILguYnguLLguKrguLnguYjguKPguLDguJrguJo8L2gyPicgKwogICAgJzxwIGNsYXNzPSJhdXRoLXN1YiI+4LmD4Liq4LmI4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmB4Lil4Liw4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LiX4Li1',
  '4LmI4LmE4LiU4LmJ4Lij4Lix4LiaPC9wPicgKwogICAgKGVyciA/ICc8ZGl2IGNsYXNzPSJhdXRoLWVyciI+JyArIGVzYyhlcnIpICsgJzwvZGl2PicgOiAnPGRpdiBjbGFzcz0iYXV0aC1lcnIiIGlkPSJhdXRoRXJyIiBoaWRkZW4+PC9kaXY+JykgKwogICAgJzxk',
  'aXYgY2xhc3M9ImF1dGgtZiI+PGxhYmVsIGZvcj0ibGdVc2VyIj7guIrguLfguYjguK3guJzguLnguYnguYPguIrguYk8L2xhYmVsPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJsZ1VzZXIiIGF1dG9jb21wbGV0ZT0idXNlcm5hbWUiIGF1dG9jYXBp',
  'dGFsaXplPSJub25lIiBzcGVsbGNoZWNrPSJmYWxzZSI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iYXV0aC1mIj48bGFiZWwgZm9yPSJsZ1Bhc3MiPuC4o+C4q+C4seC4quC4nOC5iOC4suC4mTwvbGFiZWw+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIg',
  'aWQ9ImxnUGFzcyIgdHlwZT0icGFzc3dvcmQiIGF1dG9jb21wbGV0ZT0iY3VycmVudC1wYXNzd29yZCI+PC9kaXY+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSBhdXRoLWdvIiBpZD0ibGdHbyI+4LmA4LiC4LmJ4Liy4Liq4Li54LmI4Lij4Liw4Lia4Lia',
  'PC9idXR0b24+JyArCiAgICAoQVVUSC5kZXZpY2UgPyAnPGJ1dHRvbiBjbGFzcz0iYnRuIGF1dGgtYWx0IiBvbmNsaWNrPSJzaG93UGluKCkiPuKGkCDguIHguKXguLHguJrguYTguJvguYPguIrguYkgUElOPC9idXR0b24+JyA6ICcnKSArCiAgICAnPHAgY2xhc3M9',
  'ImF1dGgtZm9vdCI+4Lil4Li34Lih4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZPyDguYPguKvguYnguJzguLnguYnguJTguLnguYHguKXguJXguLHguYnguIfguKPguKvguLHguKrguYPguKvguKHguYjguYPguKvguYnguIjguLLguIHguYDguKHguJnguLnguYPguJng',
  'uIrguLXguJU8L3A+JwogICk7CgogIHZhciBnbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsZ0dvJyk7CiAgdmFyIHVzZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGdVc2VyJyk7CiAgdmFyIHBhc3MgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgn',
  'bGdQYXNzJyk7CgogIGZ1bmN0aW9uIHN1Ym1pdCgpewogICAgdmFyIHUgPSB1c2VyLnZhbHVlLnRyaW0oKSwgcCA9IHBhc3MudmFsdWU7CiAgICBpZiAoIXUgfHwgIXApIHJldHVybiBhdXRoRXJyb3IoJ+C4geC4o+C4uOC4k+C4suC4geC4o+C4reC4geC4l+C4seC5',
  'ieC4h+C4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5ieC5geC4peC4sOC4o+C4q+C4seC4quC4nOC5iOC4suC4mScpOwogICAgZ28uZGlzYWJsZWQgPSB0cnVlOwogICAgZ28uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4',
  'peC4seC4h+C4leC4o+C4p+C4iOC4quC4reC4muKApic7CiAgICBjYWxsQXBpKCdhdXRoLmxvZ2luJywgeyB1c2VybmFtZTogdSwgcGFzc3dvcmQ6IHAgfSkudGhlbihmdW5jdGlvbihyKXsKICAgICAgc2F2ZVNlc3Npb24oci5zZXNzaW9uKTsKICAgICAgaWYgKHIu',
  'bXVzdENoYW5nZSkgcmV0dXJuIHNob3dDaGFuZ2VQYXNzd29yZCh0cnVlKTsKICAgICAgcmV0dXJuIGNhbGxBcGkoJ2F1dGgubWUnKS50aGVuKGVudGVyQXBwKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICBnby5kaXNhYmxlZCA9IGZhbHNlOwogICAg',
  'ICBnby50ZXh0Q29udGVudCA9ICfguYDguILguYnguLLguKrguLnguYjguKPguLDguJrguJonOwogICAgICBwYXNzLnZhbHVlID0gJyc7CiAgICAgIGF1dGhFcnJvcihlLm1lc3NhZ2UgfHwgZSk7CiAgICB9KTsKICB9CgogIGdvLm9uY2xpY2sgPSBzdWJtaXQ7CiAg',
  'W3VzZXIsIHBhc3NdLmZvckVhY2goZnVuY3Rpb24oZWwpewogICAgZWwuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGV2KXsgaWYgKGV2LmtleSA9PT0gJ0VudGVyJykgc3VibWl0KCk7IH0pOwogIH0pOwogIHVzZXIuZm9jdXMoKTsKfQoKZnVu',
  'Y3Rpb24gYXV0aEVycm9yKG1zZyl7CiAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F1dGhFcnInKTsKICBpZiAoZWwpIHsgZWwudGV4dENvbnRlbnQgPSBtc2c7IGVsLmhpZGRlbiA9IGZhbHNlOyB9CiAgZWxzZSBzaG93TG9naW4obXNnKTsKfQoK',
  'LyogLS0tLS0tLS0tLS0tLS0tLSDguKvguJnguYnguLIgUElOIDYg4Lir4Lil4Lix4LiBIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIHNob3dQaW4oKXsKICBBVVRILnNjcmVlbiA9ICdwaW4nOwogIEFVVEgucGluID0gJyc7CiAgc2hvd0F1dGgoCiAgICAn',
  'PGgyIGNsYXNzPSJhdXRoLWgiPuC5g+C4quC5iCBQSU48L2gyPicgKwogICAgJzxwIGNsYXNzPSJhdXRoLXN1YiI+4Lib4Lil4LiU4Lil4LmH4Lit4LiB4LiU4LmJ4Lin4Lii4Lij4Lir4Lix4LiqIDYg4Lir4Lil4Lix4LiB4LiC4Lit4LiH4LmA4LiE4Lij4Li34LmI',
  '4Lit4LiH4LiZ4Li14LmJPC9wPicgKwogICAgJzxkaXYgY2xhc3M9ImF1dGgtZXJyIiBpZD0iYXV0aEVyciIgaGlkZGVuPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InBpbi1kb3RzIiBpZD0icGluRG90cyI+JyArIHBpbkRvdHNIdG1sKCcnKSArICc8L2Rpdj4n',
  'ICsKICAgICc8ZGl2IGNsYXNzPSJwaW4tcGFkIj4nICsKICAgICAgWzEsMiwzLDQsNSw2LDcsOCw5XS5tYXAoZnVuY3Rpb24obil7CiAgICAgICAgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJwaW4tayIgb25jbGljaz0icGluUHVzaChcJycgKyBuICsgJ1wnKSI+JyAr',
  'IG4gKyAnPC9idXR0b24+JzsKICAgICAgfSkuam9pbignJykgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0icGluLWsgZ2hvc3QiIG9uY2xpY2s9InNob3dMb2dpbigpIiB0aXRsZT0i4LmD4LiK4LmJ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmB4LiX4LiZIj7wn5SR',
  'PC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJwaW4tayIgb25jbGljaz0icGluUHVzaChcJzBcJykiPjA8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9InBpbi1rIGdob3N0IiBvbmNsaWNrPSJwaW5CYWNrKCkiIHRpdGxlPSLguKXguJoi',
  'PuKMqzwvYnV0dG9uPicgKwogICAgJzwvZGl2PicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBhdXRoLWFsdCIgb25jbGljaz0iZm9yZ2V0VGhpc0RldmljZSgpIj7guKXguLfguKEgUElOIOKAlCDguYDguILguYnguLLguJTguYnguKfguKLguKPguKvguLHguKrg',
  'uJzguYjguLLguJk8L2J1dHRvbj4nCiAgKTsKCiAgLy8g4LiE4Li14Lii4LmM4Lia4Lit4Lij4LmM4LiU4LiI4Lij4Li04LiH4LiB4LmH4LmD4LiK4LmJ4LmE4LiU4LmJIOC5hOC4oeC5iOC4leC5ieC4reC4h+C4iOC4tOC5ieC4oeC4m+C4uOC5iOC4oeC4muC4meC4',
  'iOC4rQogIGRvY3VtZW50Lm9ua2V5ZG93biA9IGZ1bmN0aW9uKGV2KXsKICAgIGlmIChBVVRILnNjcmVlbiAhPT0gJ3BpbicpIHJldHVybjsKICAgIGlmICgvXlxkJC8udGVzdChldi5rZXkpKSBwaW5QdXNoKGV2LmtleSk7CiAgICBlbHNlIGlmIChldi5rZXkgPT09',
  'ICdCYWNrc3BhY2UnKSBwaW5CYWNrKCk7CiAgfTsKfQoKZnVuY3Rpb24gcGluRG90c0h0bWwocGluKXsKICB2YXIgaHRtbCA9ICcnOwogIGZvciAodmFyIGkgPSAwOyBpIDwgNjsgaSsrKSBodG1sICs9ICc8aSBjbGFzcz0iJyArIChpIDwgcGluLmxlbmd0aCA/ICdv',
  'bicgOiAnJykgKyAnIj48L2k+JzsKICByZXR1cm4gaHRtbDsKfQoKZnVuY3Rpb24gcGluUHVzaChkKXsKICBpZiAoQVVUSC5waW4ubGVuZ3RoID49IDYpIHJldHVybjsKICBBVVRILnBpbiArPSBkOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaW5Eb3RzJyku',
  'aW5uZXJIVE1MID0gcGluRG90c0h0bWwoQVVUSC5waW4pOwogIGlmIChBVVRILnBpbi5sZW5ndGggPT09IDYpIHNldFRpbWVvdXQocGluU3VibWl0LCAxMjApOwp9CgpmdW5jdGlvbiBwaW5CYWNrKCl7CiAgQVVUSC5waW4gPSBBVVRILnBpbi5zbGljZSgwLCAtMSk7',
  'CiAgdmFyIGQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGluRG90cycpOwogIGlmIChkKSBkLmlubmVySFRNTCA9IHBpbkRvdHNIdG1sKEFVVEgucGluKTsKfQoKZnVuY3Rpb24gcGluU3VibWl0KCl7CiAgdmFyIHBpbiA9IEFVVEgucGluOwogIEFVVEgucGlu',
  'ID0gJyc7CiAgdmFyIGRvdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGluRG90cycpOwogIGlmIChkb3RzKSBkb3RzLmNsYXNzTGlzdC5hZGQoJ2J1c3knKTsKCiAgY2FsbEFwaSgnYXV0aC51bmxvY2snLCB7IGRldmljZTogQVVUSC5kZXZpY2UsIHBpbjog',
  'cGluIH0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICBzYXZlU2Vzc2lvbihyLnNlc3Npb24pOwogICAgZG9jdW1lbnQub25rZXlkb3duID0gbnVsbDsKICAgIHJldHVybiBjYWxsQXBpKCdhdXRoLm1lJykudGhlbihlbnRlckFwcCk7CiAgfSkuY2F0Y2goZnVuY3Rpb24o',
  'ZSl7CiAgICB2YXIgbXNnID0gU3RyaW5nKGUubWVzc2FnZSB8fCBlKTsKICAgIGlmIChkb3RzKSB7IGRvdHMuY2xhc3NMaXN0LnJlbW92ZSgnYnVzeScpOyBkb3RzLmNsYXNzTGlzdC5hZGQoJ3NoYWtlJyk7IGRvdHMuaW5uZXJIVE1MID0gcGluRG90c0h0bWwoJycp',
  'OyB9CiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IGlmIChkb3RzKSBkb3RzLmNsYXNzTGlzdC5yZW1vdmUoJ3NoYWtlJyk7IH0sIDUwMCk7CiAgICBhdXRoRXJyb3IobXNnKTsKICAgIC8vIFBJTiDguJbguLnguIHguKLguIHguYDguKXguLTguIHguYTguJvguYHg',
  'uKXguYnguKcgKOC4nOC4tOC4lOC4hOC4o+C4muC5guC4hOC4p+C4leC4siAvIOC4q+C4oeC4lOC4reC4suC4ouC4uCkg4oCUIOC4leC5ieC4reC4h+C4geC4peC4seC4muC5hOC4m+C5g+C4iuC5ieC4o+C4q+C4seC4quC4nOC5iOC4suC4mQogICAgaWYgKC/guKXg',
  'uYfguK3guIHguK3guLTguJnguJTguYnguKfguKLguKPguKvguLHguKrguJzguYjguLLguJkvLnRlc3QobXNnKSkgewogICAgICBzYXZlRGV2aWNlKCcnKTsKICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyBzaG93TG9naW4obXNnKTsgfSwgMTQwMCk7CiAgICB9',
  'CiAgfSk7Cn0KCmZ1bmN0aW9uIGZvcmdldFRoaXNEZXZpY2UoKXsKICB2YXIgdG9rZW4gPSBBVVRILmRldmljZTsKICBzYXZlRGV2aWNlKCcnKTsKICBsc1NldCgnbWNvcm5lci5waW5Bc2tlZCcsICcnKTsKICBkb2N1bWVudC5vbmtleWRvd24gPSBudWxsOwogIGlm',
  'ICh0b2tlbikgY2FsbEFwaSgnYXV0aC5mb3JnZXREZXZpY2UnLCB7IGRldmljZTogdG9rZW4gfSkuY2F0Y2goZnVuY3Rpb24oKXsgLyog4Lir4Lih4LiU4Lit4Liy4Lii4Li44LmE4Lib4LmB4Lil4LmJ4Lin4LiB4LmH4LiK4LmI4Liy4LiH4Lih4Lix4LiZICovIH0p',
  'OwogIHNob3dMb2dpbigpOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4leC4seC5ieC4hyBQSU4gLS0tLS0tLS0tLS0tLS0tLSAqLwoKLyoqIOC4iuC4p+C4meC4leC4seC5ieC4hyBQSU4g4Lir4Lil4Lix4LiH4Lil4LmH4Lit4LiB4Lit4Li04LiZ4LiE4Lij4Lix',
  '4LmJ4LiH4LmB4Lij4LiB4Lia4LiZ4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJICovCmZ1bmN0aW9uIG9mZmVyUGluKCl7CiAgbHNTZXQoJ21jb3JuZXIucGluQXNrZWQnLCAnMScpOwogIG9wZW5Nb2RhbCgn4LiV4Lix4LmJ4LiHIFBJTiDguKrguLPguKvg',
  'uKPguLHguJrguYDguITguKPguLfguYjguK3guIfguJnguLXguYknLAogICAgJzxwPuC4leC4seC5ieC4h+C4o+C4q+C4seC4qiA2IOC4q+C4peC4seC4geC5hOC4p+C5iSDguIjguLDguYTguJTguYnguYTguKHguYjguJXguYnguK3guIfguJ7guLTguKHguJ7guYzg',
  'uKPguKvguLHguKrguJzguYjguLLguJnguJfguLjguIHguITguKPguLHguYnguIfguJfguLXguYjguYDguJvguLTguJQ8L3A+JyArCiAgICAnPHAgY2xhc3M9Im11dGVkIGZzMTMiPlBJTiDguJzguLnguIHguIHguLHguJrguYDguITguKPguLfguYjguK3guIfguJng',
  'uLXguYnguYDguITguKPguLfguYjguK3guIfguYDguJTguLXguKLguKcg4LmA4LiE4Lij4Li34LmI4Lit4LiH4Lit4Li34LmI4LiZ4LmD4LiK4LmJ4LmE4Lih4LmI4LmE4LiU4LmJIMK3IOC4ouC4geC5gOC4peC4tOC4geC5gOC4oeC4t+C5iOC4reC5hOC4q+C4o+C5',
  'iOC4geC5h+C5hOC4lOC5ieC5g+C4meC4q+C4meC5ieC4suC4leC4seC5ieC4h+C4hOC5iOC4sjwvcD4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guYTguKfguYnguIHguYjguK3guJk8L2J1dHRvbj4nICsKICAgICc8',
  'YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCk7Zm9ybVNldFBpbigpIj7guJXguLHguYnguIcgUElOIOC5gOC4peC4ojwvYnV0dG9uPicpOwp9CgpmdW5jdGlvbiBmb3JtU2V0UGluKCl7CiAgb3Blbk1vZGFsKCfguJXguLHguYnguIcg',
  'UElOIDYg4Lir4Lil4Lix4LiBJywKICAgICc8ZGl2IGNsYXNzPSJmZ3JpZCI+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIGZ1bGwiPjxsYWJlbCBmb3I9InBpbjEiPlBJTiDguYPguKvguKHguYg8L2xhYmVsPicgKwogICAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIg',
  'aWQ9InBpbjEiIHR5cGU9InBhc3N3b3JkIiBpbnB1dG1vZGU9Im51bWVyaWMiIG1heGxlbmd0aD0iNiIgJyArCiAgICAgICAgJ2F1dG9jb21wbGV0ZT0ibmV3LXBhc3N3b3JkIiBwbGFjZWhvbGRlcj0i4oCi4oCi4oCi4oCi4oCi4oCiIj48L2Rpdj4nICsKICAgICAg',
  'JzxkaXYgY2xhc3M9ImYgZnVsbCI+PGxhYmVsIGZvcj0icGluMiI+4LmD4Liq4LmIIFBJTiDguK3guLXguIHguITguKPguLHguYnguIc8L2xhYmVsPicgKwogICAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9InBpbjIiIHR5cGU9InBhc3N3b3JkIiBpbnB1dG1v',
  'ZGU9Im51bWVyaWMiIG1heGxlbmd0aD0iNiIgJyArCiAgICAgICAgJ2F1dG9jb21wbGV0ZT0ibmV3LXBhc3N3b3JkIiBwbGFjZWhvbGRlcj0i4oCi4oCi4oCi4oCi4oCi4oCiIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYgZnVsbCI+PGxhYmVsIGZvcj0i',
  'cGluRGV2Ij7guIrguLfguYjguK3guYDguITguKPguLfguYjguK3guIcgKOC5hOC4p+C5ieC4lOC4ueC4ouC5ieC4reC4meC4q+C4peC4seC4hyk8L2xhYmVsPicgKwogICAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9InBpbkRldiIgdmFsdWU9IicgKyBlc2Mo',
  'Z3Vlc3NEZXZpY2VOYW1lKCkpICsgJyI+PC9kaXY+JyArCiAgICAnPC9kaXY+JyArCiAgICAnPHAgY2xhc3M9Im11dGVkIGZzMTMgbXQ4Ij7guKvguKXguLXguIHguYDguKXguLXguYjguKLguIfguYDguKXguILguJfguLXguYjguYDguJTguLLguIfguYjguLLguKIg',
  '4LmA4LiK4LmI4LiZIDExMTExMSDguKvguKPguLfguK0gMTIzNDU2PC9wPicsCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4gTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBw',
  'cmkiIGlkPSJwaW5HbyI+4Lia4Lix4LiZ4LiX4Li24LiBIFBJTjwvYnV0dG9uPicpOwoKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGluR28nKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsKICAgIHZhciBhID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpbjEn',
  'KS52YWx1ZTsKICAgIHZhciBiID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpbjInKS52YWx1ZTsKICAgIGlmICghL15cZHs2fSQvLnRlc3QoYSkpIHJldHVybiB0b2FzdCgnUElOIOC4leC5ieC4reC4h+C5gOC4m+C5h+C4meC4leC4seC4p+C5gOC4peC4giA2',
  'IOC4q+C4peC4seC4gScsICdlcnInKTsKICAgIGlmIChhICE9PSBiKSByZXR1cm4gdG9hc3QoJ1BJTiDguKrguK3guIfguIrguYjguK3guIfguYTguKHguYjguJXguKPguIfguIHguLHguJknLCAnZXJyJyk7CiAgICB2YXIgYnRuID0gdGhpczsKICAgIGJ0bi5kaXNh',
  'YmxlZCA9IHRydWU7CiAgICBidG4uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C4muC4seC4meC4l+C4tuC4geKApic7CiAgICBjYWxsQXBpKCdhdXRoLnNldFBpbicsIHsgcGluOiBhLCBkZXZpY2U6IGRvY3Vt',
  'ZW50LmdldEVsZW1lbnRCeUlkKCdwaW5EZXYnKS52YWx1ZSB9KS50aGVuKGZ1bmN0aW9uKHIpewogICAgICBzYXZlRGV2aWNlKHIuZGV2aWNlKTsKICAgICAgY2xvc2VNb2RhbCgpOwogICAgICB0b2FzdCgn4LiV4Lix4LmJ4LiHIFBJTiDguYDguKPguLXguKLguJrg',
  'uKPguYnguK3guKIg4oCUIOC4hOC4o+C4seC5ieC4h+C4q+C4meC5ieC4suC5g+C4quC5iOC5geC4hOC5iCA2IOC4q+C4peC4seC4gScsICdvaycpOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlOwogICAgICBidG4u',
  'dGV4dENvbnRlbnQgPSAn4Lia4Lix4LiZ4LiX4Li24LiBIFBJTic7CiAgICAgIHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7CiAgICB9KTsKICB9Owp9CgpmdW5jdGlvbiBndWVzc0RldmljZU5hbWUoKXsKICB2YXIgdWEgPSBuYXZpZ2F0b3IudXNlckFnZW50',
  'IHx8ICcnOwogIGlmICgvaVBob25lLy50ZXN0KHVhKSkgcmV0dXJuICdpUGhvbmUnOwogIGlmICgvaVBhZC8udGVzdCh1YSkpIHJldHVybiAnaVBhZCc7CiAgaWYgKC9BbmRyb2lkLy50ZXN0KHVhKSkgcmV0dXJuICdBbmRyb2lkJzsKICBpZiAoL01hY2ludG9zaC8u',
  'dGVzdCh1YSkpIHJldHVybiAnTWFjJzsKICBpZiAoL1dpbmRvd3MvLnRlc3QodWEpKSByZXR1cm4gJ1dpbmRvd3MnOwogIHJldHVybiAn4Lit4Li44Lib4LiB4Lij4LiT4LmM4LiC4Lit4LiH4LiJ4Lix4LiZJzsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguYDguJvg',
  'uKXguLXguYjguKLguJnguKPguKvguLHguKrguJzguYjguLLguJkgLS0tLS0tLS0tLS0tLS0tLSAqLwoKLyoqIEBwYXJhbSB7Ym9vbGVhbn0gZm9yY2VkIHRydWUgPSDguKPguLDguJrguJrguJrguLHguIfguITguLHguJrguYDguJvguKXguLXguYjguKLguJnguJXg',
  'uK3guJnguKXguYfguK3guIHguK3guLTguJnguITguKPguLHguYnguIfguYHguKPguIEgKi8KZnVuY3Rpb24gc2hvd0NoYW5nZVBhc3N3b3JkKGZvcmNlZCl7CiAgaWYgKCFmb3JjZWQpIHJldHVybiBmb3JtQ2hhbmdlUGFzc3dvcmQoKTsKICBBVVRILnNjcmVlbiA9',
  'ICdjaGFuZ2UnOwogIHNob3dBdXRoKAogICAgJzxoMiBjbGFzcz0iYXV0aC1oIj7guJXguLHguYnguIfguKPguKvguLHguKrguJzguYjguLLguJnguILguK3guIfguITguLjguJPguYDguK3guIc8L2gyPicgKwogICAgJzxwIGNsYXNzPSJhdXRoLXN1YiI+4Lij4Lir',
  '4Lix4Liq4LiX4Li14LmI4LmE4LiU4LmJ4Lih4Liy4LmA4Lib4LmH4LiZ4Lij4Lir4Lix4Liq4LiK4Lix4LmI4Lin4LiE4Lij4Liy4LinIOC5gOC4m+C4peC4teC5iOC4ouC4meC4geC5iOC4reC4meC5g+C4iuC5ieC4h+C4suC4meC4q+C4meC4tuC5iOC4h+C4hOC4',
  'o+C4seC5ieC4hzwvcD4nICsKICAgICc8ZGl2IGNsYXNzPSJhdXRoLWVyciIgaWQ9ImF1dGhFcnIiIGhpZGRlbj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJhdXRoLWYiPjxsYWJlbCBmb3I9ImNwT2xkIj7guKPguKvguLHguKrguJzguYjguLLguJnguYDguJTg',
  'uLTguKE8L2xhYmVsPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJjcE9sZCIgdHlwZT0icGFzc3dvcmQiIGF1dG9jb21wbGV0ZT0iY3VycmVudC1wYXNzd29yZCI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iYXV0aC1mIj48bGFiZWwgZm9yPSJj',
  'cE5ldyI+4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmIICjguK3guKLguYjguLLguIfguJnguYnguK3guKIgOCDguJXguLHguKcpPC9sYWJlbD4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0iY3BOZXciIHR5cGU9InBhc3N3b3JkIiBh',
  'dXRvY29tcGxldGU9Im5ldy1wYXNzd29yZCI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iYXV0aC1mIj48bGFiZWwgZm9yPSJjcE5ldzIiPuC5g+C4quC5iOC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iOC4reC4teC4geC4hOC4o+C4seC5ieC4',
  'hzwvbGFiZWw+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImNwTmV3MiIgdHlwZT0icGFzc3dvcmQiIGF1dG9jb21wbGV0ZT0ibmV3LXBhc3N3b3JkIj48L2Rpdj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIGF1dGgtZ28iIGlkPSJjcEdv',
  'Ij7guJrguLHguJnguJfguLbguIHguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYg8L2J1dHRvbj4nCiAgKTsKCiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NwR28nKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsKICAgIHZhciBvID0gZG9jdW1lbnQu',
  'Z2V0RWxlbWVudEJ5SWQoJ2NwT2xkJykudmFsdWU7CiAgICB2YXIgbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjcE5ldycpLnZhbHVlOwogICAgdmFyIG4yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NwTmV3MicpLnZhbHVlOwogICAgaWYgKG4ubGVu',
  'Z3RoIDwgOCkgcmV0dXJuIGF1dGhFcnJvcign4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmI4LiV4LmJ4Lit4LiH4Lii4Liy4Lin4Lit4Lii4LmI4Liy4LiH4LiZ4LmJ4Lit4LiiIDgg4LiV4Lix4Lin4Lit4Lix4LiB4Lip4LijJyk7CiAgICBpZiAo',
  'biAhPT0gbjIpIHJldHVybiBhdXRoRXJyb3IoJ+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iOC4quC4reC4h+C4iuC5iOC4reC4h+C5hOC4oeC5iOC4leC4o+C4h+C4geC4seC4mScpOwogICAgdmFyIGJ0biA9IHRoaXM7CiAgICBidG4uZGlzYWJs',
  'ZWQgPSB0cnVlOwogICAgYnRuLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDguIHguLPguKXguLHguIfguJrguLHguJnguJfguLbguIHigKYnOwogICAgY2FsbEFwaSgnYXV0aC5jaGFuZ2VQYXNzd29yZCcsIHsgb2xkUGFzc3dvcmQ6IG8s',
  'IG5ld1Bhc3N3b3JkOiBuIH0pLnRoZW4oZnVuY3Rpb24oKXsKICAgICAgcmV0dXJuIGNhbGxBcGkoJ2F1dGgubWUnKS50aGVuKGVudGVyQXBwKTsKICAgIH0pLnRoZW4oZnVuY3Rpb24oKXsKICAgICAgdG9hc3QoJ+C5gOC4m+C4peC4teC5iOC4ouC4meC4o+C4q+C4',
  'seC4quC4nOC5iOC4suC4meC5gOC4o+C4teC4ouC4muC4o+C5ieC4reC4oicsICdvaycpOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlOwogICAgICBidG4udGV4dENvbnRlbnQgPSAn4Lia4Lix4LiZ4LiX4Li24LiB',
  '4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmIJzsKICAgICAgYXV0aEVycm9yKGUubWVzc2FnZSB8fCBlKTsKICAgIH0pOwogIH07CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NwT2xkJykuZm9jdXMoKTsKfQoKZnVuY3Rpb24gZm9ybUNoYW5n',
  'ZVBhc3N3b3JkKCl7CiAgb3Blbk1vZGFsKCfguYDguJvguKXguLXguYjguKLguJnguKPguKvguLHguKrguJzguYjguLLguJknLAogICAgJzxkaXYgY2xhc3M9ImZncmlkIj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYgZnVsbCI+PGxhYmVsIGZvcj0ibWNPbGQiPuC4',
  'o+C4q+C4seC4quC4nOC5iOC4suC4meC5gOC4lOC4tOC4oTwvbGFiZWw+PGlucHV0IGNsYXNzPSJpbnAiIGlkPSJtY09sZCIgdHlwZT0icGFzc3dvcmQiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiBmdWxsIj48bGFiZWwgZm9yPSJtY05ldyI+4Lij4Lir',
  '4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmIICjguK3guKLguYjguLLguIfguJnguYnguK3guKIgOCDguJXguLHguKcpPC9sYWJlbD48aW5wdXQgY2xhc3M9ImlucCIgaWQ9Im1jTmV3IiB0eXBlPSJwYXNzd29yZCI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNs',
  'YXNzPSJmIGZ1bGwiPjxsYWJlbCBmb3I9Im1jTmV3MiI+4LmD4Liq4LmI4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmI4Lit4Li14LiB4LiE4Lij4Lix4LmJ4LiHPC9sYWJlbD48aW5wdXQgY2xhc3M9ImlucCIgaWQ9Im1jTmV3MiIgdHlwZT0icGFz',
  'c3dvcmQiPjwvZGl2PicgKwogICAgJzwvZGl2PicsCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4gTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIGlkPSJtY0dvIj7g',
  'uJrguLHguJnguJfguLbguIE8L2J1dHRvbj4nKTsKCiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21jR28nKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsKICAgIHZhciBuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21jTmV3JykudmFsdWU7CiAgICBpZiAobi5s',
  'ZW5ndGggPCA4KSByZXR1cm4gdG9hc3QoJ+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iOC4leC5ieC4reC4h+C4ouC4suC4p+C4reC4ouC5iOC4suC4h+C4meC5ieC4reC4oiA4IOC4leC4seC4p+C4reC4seC4geC4qeC4oycsICdlcnInKTsKICAg',
  'IGlmIChuICE9PSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWNOZXcyJykudmFsdWUpIHJldHVybiB0b2FzdCgn4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmI4Liq4Lit4LiH4LiK4LmI4Lit4LiH4LmE4Lih4LmI4LiV4Lij4LiH4LiB4Lix4LiZ',
  'JywgJ2VycicpOwogICAgdmFyIGJ0biA9IHRoaXM7CiAgICBidG4uZGlzYWJsZWQgPSB0cnVlOwogICAgY2FsbEFwaSgnYXV0aC5jaGFuZ2VQYXNzd29yZCcsIHsKICAgICAgb2xkUGFzc3dvcmQ6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtY09sZCcpLnZhbHVl',
  'LCBuZXdQYXNzd29yZDogbgogICAgfSkudGhlbihmdW5jdGlvbigpewogICAgICBjbG9zZU1vZGFsKCk7CiAgICAgIHRvYXN0KCfguYDguJvguKXguLXguYjguKLguJnguKPguKvguLHguKrguJzguYjguLLguJnguYDguKPguLXguKLguJrguKPguYnguK3guKInLCAn',
  'b2snKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTsKICAgICAgdG9hc3QoZS5tZXNzYWdlIHx8IGUsICdlcnInKTsKICAgIH0pOwogIH07Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4Lit4Lit4LiB4LiI4Liy4LiB',
  '4Lij4Liw4Lia4LiaIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIGRvTG9nb3V0KGtlZXBQaW4pewogIHZhciBzID0gQVVUSC5zZXNzaW9uOwogIHNhdmVTZXNzaW9uKCcnKTsKICBpZiAoIWtlZXBQaW4pIHsgdmFyIGQgPSBBVVRILmRldmljZTsgc2F2ZURl',
  'dmljZSgnJyk7IGlmIChkKSBjYWxsQXBpKCdhdXRoLmZvcmdldERldmljZScsIHsgZGV2aWNlOiBkIH0pLmNhdGNoKGZ1bmN0aW9uKCl7fSk7IH0KICBpZiAocykgY2FsbEFwaSgnYXV0aC5sb2dvdXQnLCB7IF9zZXNzaW9uOiBzIH0pLmNhdGNoKGZ1bmN0aW9uKCl7',
  'IC8qIOC4q+C4oeC4lOC4reC4suC4ouC4uOC5geC4peC5ieC4p+C4geC5h+C4luC4t+C4reC4p+C5iOC4suC4reC4reC4geC5geC4peC5ieC4pyAqLyB9KTsKICBjbG9zZU1vZGFsKCk7CiAgQVVUSC5tZSA9IG51bGw7CiAgaWYgKEFVVEguZGV2aWNlKSBzaG93UGlu',
  'KCk7IGVsc2Ugc2hvd0xvZ2luKCk7Cn0KCmZ1bmN0aW9uIGNvbmZpcm1Mb2dvdXQoKXsKICBvcGVuTW9kYWwoJ+C4reC4reC4geC4iOC4suC4geC4o+C4sOC4muC4micsCiAgICAnPHA+4LiV4LmJ4Lit4LiH4LiB4Liy4Lij4Lit4Lit4LiB4LiI4Liy4LiB4Lij4Liw',
  '4Lia4Lia4LmD4LiK4LmI4LmE4Lir4LihPC9wPicgKwogICAgKEFVVEguZGV2aWNlID8gJzxwIGNsYXNzPSJtdXRlZCBmczEzIj5QSU4g4Lia4LiZ4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJ4LiI4Liw4Lii4Lix4LiH4Lit4Lii4Li54LmIIOC4hOC4o+C4',
  'seC5ieC4h+C4q+C4meC5ieC4suC5gOC4guC5ieC4suC4lOC5ieC4p+C4oiBQSU4g4LmE4LiU4LmJ4LmA4Lil4LiiPC9wPicgOiAnJyksCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4gTwvYnV0',
  'dG9uPicgKwogICAgKEFVVEguZGV2aWNlID8gJzxidXR0b24gY2xhc3M9ImJ0biBkZ3IiIG9uY2xpY2s9ImRvTG9nb3V0KGZhbHNlKSI+4Lit4Lit4LiB4LmB4Lil4Liw4Lil4LiaIFBJTjwvYnV0dG9uPicgOiAnJykgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBw',
  'cmkiIG9uY2xpY2s9ImRvTG9nb3V0KHRydWUpIj7guK3guK3guIHguIjguLLguIHguKPguLDguJrguJo8L2J1dHRvbj4nKTsKfQo8L3NjcmlwdD4KPHNjcmlwdD4KLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09CiAgIFZpZXdzLmh0bWwg4oCUIOC4leC4seC4p+C5guC4q+C4peC4lCArIOC4leC4seC4p+C4p+C4suC4lOC4guC4reC4h+C5geC4leC5iOC4peC4sOC4q+C4meC5ieC4sgogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT0gKi8KCnZhciBST1VURVMgPSB7fTsKCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICAxKSDguKDguLLguJ7guKPguKfguKEKICAgPT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5kYXNoYm9hcmQgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsgcmV0dXJuIGNhbGxBcGkoJ2FwcC5kYXNoYm9hcmQnLCB7IHllYXI6IFMueWVhciB9KTsgfSwKICByZW5kZXI6IGZ1bmN0',
  'aW9uKGQpewogICAgdmFyIGIgPSBkLmJ1aWxkaW5nOwogICAgdmFyIGtwaXMgPQogICAgICBrcGkoJ+C4ouC4reC4lOC4q+C4meC4teC5ieC4hOC4h+C5gOC4q+C4peC4t+C4reC4l+C4seC5ieC4h+C4q+C4oeC4lCcsIGJhaHQoZC5kZWJ0QWxsLnJlbWFpbmluZyks',
  'CiAgICAgICAgICAn4LiI4Liy4LiB4Lii4Lit4LiU4Lir4LiZ4Li14LmJICcgKyBiYWh0KGQuZGVidEFsbC50b3RhbERlYnQpICsgJyDCtyDguIrguLPguKPguLDguYHguKXguYnguKcgJyArIHBjdChkLmRlYnRBbGwucGVyY2VudCksICdhY2NlbnQnKSArCiAgICAg',
  'IGtwaSgn4LiK4Liz4Lij4Liw4LmB4Lil4LmJ4LinICjguKvguJnguLXguYnguKvguKXguLHguIEpJywgcGN0KGQuZGVidE1haW4ucGVyY2VudCksIGJhaHQoZC5kZWJ0TWFpbi5wYWlkKSArICcg4LiI4Liy4LiBICcgKyBiYWh0KGQuZGVidE1haW4udG90YWwpLCAn',
  'Z29vZCcpICsKICAgICAga3BpKCfguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguJvguLUgJyArIGQueWVhciwgYmFodChkLnNwZW5kVGhpc1llYXIpLCAn4LiL4Li34LmJ4Lit4LiC4Lit4LiHICsg4LiL4LmI4Lit4Lih4LmB4LiL4LihICsg4Lil4LmJ4Liy',
  '4LiH4LmB4Lit4Lij4LmMJykgKwogICAgICBrcGkoJ+C4h+C4suC4meC4i+C5iOC4reC4oeC4hOC5ieC4suC4hycsIGQucmVwYWlycy5vcGVuSm9icyArICcg4LiH4Liy4LiZJywgZC5yZXBhaXJzLm92ZXJkdWUgKyAnIOC4h+C4suC4meC5gOC4geC4tOC4meC4geC4',
  's+C4q+C4meC4lCcsIGQucmVwYWlycy5vdmVyZHVlID8gJ2JhZCcgOiAnJyk7CgogICAgdmFyIGFsZXJ0cyA9IGQuYWxlcnRzLmxlbmd0aAogICAgICA/ICc8ZGl2IGNsYXNzPSJhbGlzdCI+JyArIGQuYWxlcnRzLnNsaWNlKDAsMTIpLm1hcChmdW5jdGlvbihhKXsK',
  'ICAgICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0iYWxpIGwtJyArIGEubGV2ZWwgKyAnIiBvbmNsaWNrPSJnbyhcJycgKyBqdW1wUGFnZShhLm1vZHVsZSkgKyAnXCcpIj4nICsKICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0iaWMiPicgKyBhLmljb24gKyAn',
  'PC9kaXY+PGRpdj48ZGl2IGNsYXNzPSJ0dCI+JyArIGVzYyhhLnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0iZGQiPicgKyBlc2MoYS5kZXRhaWwpICsgJzwvZGl2PjwvZGl2PjwvZGl2Pic7CiAgICAgICAgfSkuam9pbign',
  'JykgKyAnPC9kaXY+JwogICAgICA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj7inIU8L2Rpdj7guYTguKHguYjguKHguLXguIfguLLguJnguITguYnguLLguIcg4oCUIOC4l+C4uOC4geC4reC4ouC5iOC4suC4h+C5gOC4o+C4teC4ouC4muC4',
  'o+C5ieC4reC4ojwvZGl2Pic7CgogICAgcmV0dXJuICcnICsKICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArIGtwaXMgKyAnPC9kaXY+JyArCgogICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMiBtYjEyIj4nICsKICAgICAgICBjYXJkKCfwn5KwIOC4',
  'o+C4suC4ouC4geC4suC4o+C4quC4o+C4uOC4m+C4o+C4p+C4oSAo4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiBKScsCiAgICAgICAgICBkZWJ0TWluaShkLmRlYnRNYWluLCAnZGVidE1haW4nKSwKICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xp',
  'Y2s9ImdvKFwnZGVidE1haW5cJykiPuC4lOC4ueC4l+C4seC5ieC4h+C4q+C4oeC4lCDihpI8L2J1dHRvbj4nKSArCiAgICAgICAgY2FyZCgn8J+nviDguKvguJnguLXguYnguKrguLTguJkgKOC4q+C4meC4teC5ieC4o+C4reC4hyknLAogICAgICAgICAgZGVidE1p',
  'bmkoZC5kZWJ0U3ViLCAnZGVidFN1YicpICsKICAgICAgICAgIChkLmRlYnRTdWIuaW50ZXJlc3RUaGlzWWVhciA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIG10OCI+4LiU4Lit4LiB4LmA4Lia4Li14LmJ4Lii4LiX4Li14LmI4LiK4Liz4Lij4Liw4Lib4Li1ICcg',
  'KyBkLnllYXIgKyAnOiA8Yj4nICsgYmFodChkLmRlYnRTdWIuaW50ZXJlc3RUaGlzWWVhcikgKyAnPC9iPjwvZGl2PicgOiAnJyksCiAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJnbyhcJ2RlYnRTdWJcJykiPuC4lOC4ueC4l+C4seC5',
  'ieC4h+C4q+C4oeC4lCDihpI8L2J1dHRvbj4nKSArCiAgICAgICc8L2Rpdj4nICsKCiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICAgIGtwaSgn4Lir4LmJ4Lit4LiH4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJywgYi50b3RhbFJvb21zICsg',
  'JyDguKvguYnguK3guIcnLCAn4Lih4Li14Lic4Li54LmJ4LmA4LiK4LmI4LiyICcgKyBiLm9jY3VwaWVkICsgJyDCtyDguKfguYjguLLguIcgJyArIGIudmFjYW50KSArCiAgICAgICAga3BpKCfguKXguYnguLLguIfguYHguK3guKPguYzguJvguLUgJyArIGQueWVh',
  'ciwgZC5hYy5yb29tc0RvbmUgKyAnLycgKyBiLnRvdGFsUm9vbXMgKyAnIOC4q+C5ieC4reC4hycsIGQuYWMuZG9uZUluWWVhciArICcg4Lij4Lit4LiaIMK3IOC4hOC5ieC4suC4hyAnICsgZC5hYy5yb29tc1BlbmRpbmcgKyAnIOC4q+C5ieC4reC4hycsIGQuYWMu',
  'cm9vbXNQZW5kaW5nID8gJ3dhcm4nIDogJ2dvb2QnKSArCiAgICAgICAga3BpKCfguIvguLfguYnguK3guILguK3guIfguJvguLUgJyArIGQueWVhciwgYmFodChkLnB1cmNoYXNlcy55ZWFyVG90YWwpLCBkLnB1cmNoYXNlcy55ZWFyQ291bnQgKyAnIOC4o+C4suC4',
  'ouC4geC4suC4oycpICsKICAgICAgICBrcGkoJ+C4m+C4o+C4sOC4geC4seC4meC5g+C4geC4peC5ieC4q+C4oeC4lCcsIGQucHVyY2hhc2VzLndhcnJhbnR5LmV4cGlyaW5nICsgJyDguKPguLLguKLguIHguLLguKMnLCAn4Lir4Lih4LiU4Lit4Liy4Lii4Li44LmB',
  '4Lil4LmJ4LinICcgKyBkLnB1cmNoYXNlcy53YXJyYW50eS5leHBpcmVkLCBkLnB1cmNoYXNlcy53YXJyYW50eS5leHBpcmluZyA/ICd3YXJuJyA6ICcnKSArCiAgICAgICc8L2Rpdj4nICsKCiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGcyIG1iMTIiPicgKwogICAg',
  'ICAgIGNhcmQoJ/Cfk5Ig4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4ouC4q+C4rSDguJvguLUgJyArIGQueWVhciwKICAgICAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGczIG1iMTIiPicgKwogICAgICAgICAgICBrcGkoJ+C4o+C4suC4ouC4',
  'o+C4seC4micsIGJhaHQoZC5maW5hbmNlLmluY29tZSksICfguYDguInguKXguLXguYjguKIgJyArIGJhaHQoZC5maW5hbmNlLmF2Z0luY29tZSkgKyAnL+C5gOC4lOC4t+C4reC4mScsICdnb29kJykgKwogICAgICAgICAgICBrcGkoJ+C4o+C4suC4ouC4iOC5iOC4',
  'suC4oicsIGJhaHQoZC5maW5hbmNlLmV4cGVuc2UpLCAn4LmA4LiJ4Lil4Li14LmI4LiiICcgKyBiYWh0KGQuZmluYW5jZS5hdmdFeHBlbnNlKSArICcv4LmA4LiU4Li34Lit4LiZJywgJ2JhZCcpICsKICAgICAgICAgICAga3BpKCfguITguIfguYDguKvguKXguLfg',
  'uK3guKrguLjguJfguJjguLQnLCBiYWh0KGQuZmluYW5jZS5uZXQpLCAn4Lit4Lix4LiV4Lij4Liy4LiB4Liz4LmE4LijICcgKyBwY3QoZC5maW5hbmNlLm1hcmdpbikpICsKICAgICAgICAgICc8L2Rpdj4nICsgbWluaU1vbnRoQ2hhcnQoZC5maW5hbmNlLmJ5TW9u',
  'dGgpLAogICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZ28oXCdmaW5hbmNlXCcpIj7guJTguLnguJfguLHguYnguIfguKvguKHguJQg4oaSPC9idXR0b24+JykgKwogICAgICAgIGNhcmQoJ/Cfl5PvuI8g4LiH4Liy4LiZ4LiX4Li14LmI',
  '4LiB4Liz4Lil4Lix4LiH4LiI4Liw4LiW4Li24LiHICgnICsgZC51cGNvbWluZy5sZW5ndGggKyAnKScsCiAgICAgICAgICBkLnVwY29taW5nLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJhbGlzdCI+JyArIGQudXBjb21pbmcuc2xpY2UoMCw3KS5tYXAoZnVuY3Rpb24o',
  'dSl7CiAgICAgICAgICAgIHZhciBsdmwgPSB1LmRheXNMZWZ0IDwgMCA/ICdkYW5nZXInIDogKHUuZGF5c0xlZnQgPD0gNyA/ICd3YXJuJyA6ICdpbmZvJyk7CiAgICAgICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0iYWxpIGwtJyArIGx2bCArICciIG9uY2xpY2s9',
  'ImdvKFwnJyArIGp1bXBQYWdlKHUubW9kdWxlKSArICdcJykiPicgKwogICAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJpYyI+JyArIHUuaWNvbiArICc8L2Rpdj48ZGl2PjxkaXYgY2xhc3M9InR0Ij4nICsgZXNjKHUudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAg',
  'ICAgICAgICc8ZGl2IGNsYXNzPSJkZCI+JyArIHRoRGF0ZSh1LmRhdGUpICsgJyDCtyAnICsKICAgICAgICAgICAgICAgICh1LmRheXNMZWZ0IDwgMCA/ICfguYDguKXguKLguIHguLPguKvguJnguJQgJyArICgtdS5kYXlzTGVmdCkgKyAnIOC4p+C4seC4mScgOiAo',
  'dS5kYXlzTGVmdCA9PT0gMCA/ICfguKfguLHguJnguJnguLXguYknIDogJ+C4reC4teC4gSAnICsgdS5kYXlzTGVmdCArICcg4Lin4Lix4LiZJykpICsKICAgICAgICAgICAgICAnPC9kaXY+PC9kaXY+PC9kaXY+JzsKICAgICAgICAgIH0pLmpvaW4oJycpICsgJzwv',
  'ZGl2PicgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPjxkaXYgY2xhc3M9ImJpZyI+8J+MpO+4jzwvZGl2PuC5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4meC4seC4lOC4q+C4oeC4suC4ouC5gOC4o+C5h+C4pyDguYYg4LiZ4Li14LmJPC9kaXY+JywKICAgICAgICAgICc8',
  'YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImdvKFwncmVwb3J0c1wnKSI+4Lib4LiP4Li04LiX4Li04LiZ4LmA4LiV4LmH4LihIOKGkjwvYnV0dG9uPicsIHRydWUpICsKICAgICAgJzwvZGl2PicgKwoKICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzIiPicg',
  'KwogICAgICAgIGNhcmQoJ/CflJQg4Liq4Li04LmI4LiH4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LiX4LizICgnICsgZC5hbGVydHMubGVuZ3RoICsgJyknLCBhbGVydHMsICcnLCB0cnVlKSArCiAgICAgICAgY2FyZCgn8J+PoiDguIfguLLguJnguIvguYjguK3guKHg',
  'uYHguIvguKHguJXguLbguIHguYLguJTguKLguKPguKfguKEnLAogICAgICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzIiPicgKwogICAgICAgICAgICBrcGkoJ+C4h+C4suC4meC4m+C4tSAnICsgZC55ZWFyLCBkLmJ1aWxkaW5nUmVwYWlycy55ZWFyQ291bnQgKyAn',
  'IOC4h+C4suC4mScsICfguITguYnguLLguIcgJyArIGQuYnVpbGRpbmdSZXBhaXJzLm9wZW5Db3VudCkgKwogICAgICAgICAgICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oicsIGJhaHQoZC5idWlsZGluZ1JlcGFpcnMueWVhckNvc3QpLCAn4LiE',
  '4Lij4Lia4LiB4Liz4Lir4LiZ4LiU4LmA4Lij4LmH4LinIOC5hiDguJnguLXguYkgJyArIGQuYnVpbGRpbmdSZXBhaXJzLnVwY29taW5nKSArCiAgICAgICAgICAnPC9kaXY+JyArCiAgICAgICAgICAoZC5kZWJ0TWFpbi5mb3JlY2FzdCAmJiBkLmRlYnRNYWluLmZv',
  'cmVjYXN0Lm1vbnRoc0xlZnQKICAgICAgICAgICAgPyAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PjxkaXYgY2xhc3M9ImZzMTMiPjxiPuC4m+C4o+C4sOC4oeC4suC4k+C4geC4suC4o+C4m+C4tOC4lOC4q+C4meC4teC5ieC4q+C4peC4seC4gTwvYj48ZGl2IGNsYXNz',
  'PSJtdXRlZCBtdDgiPicgKwogICAgICAgICAgICAgICfguIjguLLguIHguK3guLHguJXguKPguLLguIrguLPguKPguLDguYDguInguKXguLXguYjguKIgJyArIGJhaHQoZC5kZWJ0TWFpbi5mb3JlY2FzdC5hdmdQZXJNb250aCkgKyAnL+C5gOC4lOC4t+C4reC4mSAo',
  'MTIg4LmA4LiU4Li34Lit4LiZ4Lil4LmI4Liy4Liq4Li44LiUKSAnICsKICAgICAgICAgICAgICAn4LiE4Liy4LiU4Lin4LmI4Liy4Lit4Li14LiBIDxiPicgKyBkLmRlYnRNYWluLmZvcmVjYXN0Lm1vbnRoc0xlZnQgKyAnIOC5gOC4lOC4t+C4reC4mTwvYj4gJyAr',
  'CiAgICAgICAgICAgICAgJyjguKPguLLguKcgJyArIHRoRGF0ZShkLmRlYnRNYWluLmZvcmVjYXN0LnBheW9mZkRhdGUpICsgJyk8L2Rpdj48L2Rpdj4nCiAgICAgICAgICAgIDogJycpLAogICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0i',
  'Z28oXCdidWlsZGluZ1wnKSI+4LiU4Li54LiX4Lix4LmJ4LiH4Lir4Lih4LiUIOKGkjwvYnV0dG9uPicpICsKICAgICAgJzwvZGl2Pic7CiAgfSwKICBhZnRlcjogZnVuY3Rpb24oZCl7CiAgICBzZXRCYWRnZSgncmVwYWlycycsIGQucmVwYWlycy5vcGVuSm9icyk7',
  'CiAgICBzZXRCYWRnZSgnYWMnLCBkLmFjLnJvb21zUGVuZGluZyk7CiAgfQp9OwoKZnVuY3Rpb24gbWluaU1vbnRoQ2hhcnQoYnlNb250aCl7CiAgdmFyIG1heCA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGJ5TW9udGgubWFwKGZ1bmN0aW9uKG0peyByZXR1cm4gTWF0',
  'aC5tYXgobS5pbmNvbWUsIG0uZXhwZW5zZSk7IH0pKSB8fCAxOwogIHJldHVybiAnPGRpdiBzdHlsZT0iZGlzcGxheTpmbGV4O2dhcDozcHg7YWxpZ24taXRlbXM6ZmxleC1lbmQ7aGVpZ2h0Ojc0cHgiPicgKyBieU1vbnRoLm1hcChmdW5jdGlvbihtKXsKICAgIHZh',
  'ciBoaSA9IE1hdGgucm91bmQobS5pbmNvbWUgLyBtYXggKiA2NiksIGhlID0gTWF0aC5yb3VuZChtLmV4cGVuc2UgLyBtYXggKiA2Nik7CiAgICByZXR1cm4gJzxkaXYgc3R5bGU9ImZsZXg6MTt0ZXh0LWFsaWduOmNlbnRlciIgdGl0bGU9IicgKyBtLmxhYmVsICsg',
  'JyDCtyDguKPguLHguJogJyArIG1vbmV5KG0uaW5jb21lKSArICcgwrcg4LiI4LmI4Liy4LiiICcgKyBtb25leShtLmV4cGVuc2UpICsgJyI+JyArCiAgICAgICc8ZGl2IHN0eWxlPSJkaXNwbGF5OmZsZXg7Z2FwOjFweDthbGlnbi1pdGVtczpmbGV4LWVuZDtqdXN0',
  'aWZ5LWNvbnRlbnQ6Y2VudGVyO2hlaWdodDo2NnB4Ij4nICsKICAgICAgICAnPGRpdiBzdHlsZT0id2lkdGg6NnB4O2hlaWdodDonICsgaGkgKyAncHg7YmFja2dyb3VuZDp2YXIoLS1vayk7Ym9yZGVyLXJhZGl1czoycHggMnB4IDAgMCI+PC9kaXY+JyArCiAgICAg',
  'ICAgJzxkaXYgc3R5bGU9IndpZHRoOjZweDtoZWlnaHQ6JyArIGhlICsgJ3B4O2JhY2tncm91bmQ6dmFyKC0tZGFuZ2VyKTtib3JkZXItcmFkaXVzOjJweCAycHggMCAwIj48L2Rpdj4nICsKICAgICAgJzwvZGl2PjxkaXYgY2xhc3M9ImZhaW50IiBzdHlsZT0iZm9u',
  'dC1zaXplOjkuNXB4Ij4nICsgbS5sYWJlbC5yZXBsYWNlKCcuJywnJykgKyAnPC9kaXY+PC9kaXY+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nICsKICAnPGRpdiBjbGFzcz0icm93IGZzMTIgbXV0ZWQgbXQ4Ij48c3BhbiBjbGFzcz0iYiBvayI+4Lij4Liy4Lii',
  '4Lij4Lix4LiaPC9zcGFuPjxzcGFuIGNsYXNzPSJiIGRnciI+4Lij4Liy4Lii4LiI4LmI4Liy4LiiPC9zcGFuPjwvZGl2Pic7Cn0KCmZ1bmN0aW9uIGRlYnRNaW5pKHgsIHBhZ2UpewogIHJldHVybiAnPGRpdiBjbGFzcz0icG1ldGEiIHN0eWxlPSJtYXJnaW46MCAw',
  'IDZweCI+PHNwYW4+4LiK4Liz4Lij4Liw4LmB4Lil4LmJ4LinIDxiPicgKyBiYWh0KHgucGFpZCkgKyAnPC9iPjwvc3Bhbj4nICsKICAgICAgICAgJzxzcGFuPjxiPicgKyBwY3QoeC5wZXJjZW50KSArICc8L2I+PC9zcGFuPjwvZGl2PicgKwogICAgICAgICBwcm9n',
  'cmVzcyh4LnBlcmNlbnQsICdsZycpICsKICAgICAgICAgJzxkaXYgY2xhc3M9InBtZXRhIj48c3Bhbj7guITguIfguYDguKvguKXguLfguK0gPGI+JyArIGJhaHQoeC5yZW1haW5pbmcpICsgJzwvYj48L3NwYW4+JyArCiAgICAgICAgICc8c3Bhbj7guKLguK3guJTg',
  'uKvguJnguLXguYnguJfguLHguYnguIfguKvguKHguJQgPGI+JyArIGJhaHQoeC50b3RhbCkgKyAnPC9iPjwvc3Bhbj48L2Rpdj4nICsKICAgICAgICAgJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbXQ4Ij7guIrguLPguKPguLDguYPguJnguJvguLXguJfguLXguYjg',
  'uYDguKXguLfguK3guIE6IDxiPicgKyBiYWh0KHgudGhpc1llYXIpICsgJzwvYj48L2Rpdj4nOwp9CgpmdW5jdGlvbiBzZXRCYWRnZShwYWdlLCBuKXsKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmFkZ2UtJyArIHBhZ2UpOwogIGlmICghZWwp',
  'IHJldHVybjsKICBpZiAobiA+IDApIHsgZWwudGV4dENvbnRlbnQgPSBuOyBlbC5zdHlsZS5kaXNwbGF5ID0gJyc7IH0KICBlbHNlIGVsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PQogICAyKSDguKvguJnguLXguYnguKvguKXguLHguIEgLyDguKvguJnguLXguYnguKPguK3guIcgKOC5g+C4iuC5ieC4leC4seC4p+C4p+C4suC4lOC4o+C5iOC4p+C4oeC4geC4seC4mSkKICAgPT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGRlYnRSb3V0ZShsZWRnZXIsIHRpdGxlKXsKICByZXR1cm4gewogICAgbG9hZDogZnVuY3Rpb24oKXsKICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFsKICAgICAgICBjYWxs',
  'QXBpKCdkZWJ0LnN1bW1hcnknLCB7IGxlZGdlcjogbGVkZ2VyLCB5ZWFyOiBTLnllYXIgfSksCiAgICAgICAgY2FsbEFwaSgnZGVidC5wYXltZW50cycsIHsgbGVkZ2VyOiBsZWRnZXIsIHllYXI6IFMueWVhciB9KQogICAgICBdKS50aGVuKGZ1bmN0aW9uKHIpewog',
  'ICAgICAgIHZhciBkID0gclswXTsgZC5wYXltZW50cyA9IHJbMV07IGQubGVkZ2VyID0gbGVkZ2VyOyBkLnBhZ2VUaXRsZSA9IHRpdGxlOwogICAgICAgIHJldHVybiBkOwogICAgICB9KTsKICAgIH0sCiAgICByZW5kZXI6IHJlbmRlckRlYnQsCiAgICBhZnRlcjog',
  'Y2FjaGVBbGxEZWJ0cwogIH07Cn0KUk9VVEVTLmRlYnRNYWluID0gZGVidFJvdXRlKCfguKvguJnguLXguYnguKvguKXguLHguIEnLCAn4Lij4Liy4Lii4LiB4Liy4Lij4Liq4Lij4Li44Lib4Lij4Lin4LihIFRoZSBNIENvcm5lciBBUCcpOwpST1VURVMuZGVidFN1',
  'YiAgPSBkZWJ0Um91dGUoJ+C4q+C4meC4teC5ieC4o+C4reC4hycsICfguKvguJnguLXguYnguKrguLTguJknKTsKCi8qKiDguYDguIHguYfguJrguKPguLLguKLguIrguLfguYjguK3guIHguYnguK3guJnguKvguJnguLXguYnguJfguLjguIHguJrguLHguI3guIrg',
  'uLXguYTguKfguYnguYPguKvguYnguJ/guK3guKPguYzguKHguYDguKXguLfguK3guIEgIuC5gOC4m+C5h+C4meC4quC5iOC4p+C4meC4q+C4meC4tuC5iOC4h+C4guC4reC4hyIgKi8KZnVuY3Rpb24gY2FjaGVBbGxEZWJ0cygpewogIGNhbGxBcGkoJ2RlYnQubGlz',
  'dCcsIHt9KS50aGVuKGZ1bmN0aW9uKGxpc3QpewogICAgQUxMX0RFQlRTID0gbGlzdC5tYXAoZnVuY3Rpb24oZCl7CiAgICAgIHJldHVybiB7IGlkOiBkLmlkLCB0aXRsZTogZC50aXRsZSwgbGVkZ2VyOiBkLmxlZGdlciwgcGFyZW50SWQ6IGQucGFyZW50SWQgfHwg',
  'JycgfTsKICAgIH0pOwogIH0pLmNhdGNoKGZ1bmN0aW9uKCl7fSk7Cn0KCmZ1bmN0aW9uIHJlbmRlckRlYnQoZCl7CiAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKCiAgdmFy',
  'IGhlYWQgPSAnPGRpdiBjbGFzcz0iY2FyZCBtYjEyIj48ZGl2IGNsYXNzPSJjYXJkLWIiPicgKwogICAgJzxkaXYgY2xhc3M9InJvdyBtYjEyIj48aDMgc3R5bGU9Im1hcmdpbjowO2ZvbnQtc2l6ZToxNXB4Ij4nICsgZXNjKGQucGFnZVRpdGxlKSArICc8L2gzPicg',
  'KwogICAgJzxzcGFuIGNsYXNzPSJzcCI+PC9zcGFuPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgc20iIG9uY2xpY2s9ImZvcm1EZWJ0UGF5bWVudChudWxsLFwnJyArIGQubGVkZ2VyICsgJ1wnKSI+KyDguJrguLHguJnguJfguLbguIHguIHguLLguKPg',
  'uIrguLPguKPguLA8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImZvcm1EZWJ0KG51bGwsXCcnICsgZC5sZWRnZXIgKyAnXCcpIj4rIOC5gOC4nuC4tOC5iOC4oeC4geC5ieC4reC4meC4q+C4meC4teC5iTwvYnV0dG9uPjwv',
  'ZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InBtZXRhIiBzdHlsZT0ibWFyZ2luOjAgMCA3cHgiPjxzcGFuPuC4hOC4p+C4suC4oeC4hOC4t+C4muC4q+C4meC5ieC4suC4geC4suC4o+C4iuC4s+C4o+C4sDwvc3Bhbj48c3Bhbj48Yj4nICsgcGN0KGQucGVyY2VudCkg',
  'KyAnPC9iPjwvc3Bhbj48L2Rpdj4nICsKICAgIHByb2dyZXNzKGQucGVyY2VudCwgJ2xnICcgKyAoZC5wZXJjZW50ID49IDEwMCA/ICdvaycgOiAnJykpICsKICAgICc8ZGl2IGNsYXNzPSJncmlkIGc0IG10MTYiPicgKwogICAgICBrcGkoJ+C4ouC4reC4lOC4q+C4',
  'meC4teC5ieC4l+C4seC5ieC4h+C4q+C4oeC4lCcsIGJhaHQoZC50b3RhbERlYnQpLCBkLmRlYnRzLmxlbmd0aCArICcg4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJJykgKwogICAgICBrcGkoJ+C4iuC4s+C4o+C4sOC5geC4peC5ieC4pycsIGJhaHQoZC5wYWlkKSwg',
  'ZC5wYXltZW50Q291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4o+C5guC4reC4mScsICdnb29kJykgKwogICAgICBrcGkoJ+C4hOC4h+C5gOC4q+C4peC4t+C4rScsIGJhaHQoZC5yZW1haW5pbmcpLCAn4Lit4Li14LiBICcgKyBwY3QoMTAwIC0gZC5wZXJjZW50KSAr',
  'ICcg4LiI4Liw4Lib4Li04LiU4Lir4LiZ4Li14LmJJywgJ2JhZCcpICsKICAgICAga3BpKCfguIrguLPguKPguLDguYPguJknICsgeWVhckxhYmVsLCBiYWh0KGQuc2VsZWN0ZWRZZWFyUGFpZCksIGQuc2VsZWN0ZWRZZWFyQ291bnQgKyAnIOC4o+C4suC4ouC4geC4',
  'suC4oycgKwogICAgICAgICAgKGQuc2VsZWN0ZWRZZWFySW50ZXJlc3QgPyAnIMK3IOC4lOC4reC4geC5gOC4muC4teC5ieC4oiAnICsgYmFodChkLnNlbGVjdGVkWWVhckludGVyZXN0KSA6ICcnKSkgKwogICAgJzwvZGl2PjwvZGl2PjwvZGl2Pic7CgogIHZhciBw',
  'ZXJEZWJ0ID0gZC5kZWJ0cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0iZ3JpZCBnLWF1dG8gbWIxMiI+JyArIGQuZGVidHMubWFwKGZ1bmN0aW9uKHgpewogICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJjYXJkIj48ZGl2IGNsYXNzPSJjYXJkLWIiPicgKwogICAgICAnPGRp',
  'diBjbGFzcz0iY2xpcCIgc3R5bGU9ImZvbnQtd2VpZ2h0OjY1MDtmb250LXNpemU6MTMuNXB4O21pbi1oZWlnaHQ6MzhweCI+JyArIGVzYyh4LnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBmczEyIG11dGVkIG1iOCI+JyArIHN0YXR1',
  'c0JhZGdlKHguc3RhdHVzKSArCiAgICAgICAgJzxzcGFuPicgKyBlc2MoeC5jcmVkaXRvciB8fCAn4oCTJykgKyAoeC5zdGFydERhdGUgPyAnIMK3ICcgKyB0aERhdGUoeC5zdGFydERhdGUpIDogJycpICsgJzwvc3Bhbj48L2Rpdj4nICsKICAgICAgKHgucGFyZW50',
  'VGl0bGUKICAgICAgICA/ICc8ZGl2IGNsYXNzPSJiIGluZm8gbWI4IiB0aXRsZT0i4Lii4Lit4LiU4LiB4LmJ4Lit4LiZ4LiZ4Li14LmJ4Lit4Lii4Li54LmI4LmD4LiZ4LiB4LmJ4Lit4LiZ4LmB4Lih4LmI4LmB4Lil4LmJ4LinIOC4iOC5iOC4suC4ouC4hOC4t+C4',
  'meC4geC5ieC4reC4meC4meC4teC5ieC4geC5ieC4reC4meC5geC4oeC5iOC4iOC4sOC4peC4lOC4leC4suC4oSI+JyArCiAgICAgICAgICAn4oazIOC5gOC4m+C5h+C4meC4quC5iOC4p+C4meC4q+C4meC4tuC5iOC4h+C4guC4reC4hyAnICsgZXNjKHgucGFyZW50',
  'VGl0bGUpICsgJzwvZGl2PicKICAgICAgICA6ICcnKSArCiAgICAgIHByb2dyZXNzKHgucGVyY2VudCkgKwogICAgICAnPGRpdiBjbGFzcz0icG1ldGEiPjxzcGFuPuC4iuC4s+C4o+C4sCA8Yj4nICsgYmFodCh4LnBhaWQpICsgJzwvYj48L3NwYW4+PHNwYW4+4LiE',
  '4LiH4LmA4Lir4Lil4Li34LitIDxiPicgKyBiYWh0KHgucmVtYWluaW5nKSArICc8L2I+PC9zcGFuPjwvZGl2PicgKwogICAgICAoeC5jaGlsZHJlbiAmJiB4LmNoaWxkcmVuLmxlbmd0aAogICAgICAgID8gJzxkaXYgY2xhc3M9ImhyIiBzdHlsZT0ibWFyZ2luOjEy',
  'cHggMCAxMHB4Ij48L2Rpdj4nICsKICAgICAgICAgICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIG1iOCI+4LmD4LiZ4Lii4Lit4LiU4LiZ4Li14LmJ4Lih4Li14LiB4LmJ4Lit4LiZ4Lii4LmI4Lit4Lii4Lit4Lii4Li54LmIICcgKyB4LmNoaWxkcmVuLmxlbmd0aCAr',
  'ICcg4LiB4LmJ4Lit4LiZPC9kaXY+JyArCiAgICAgICAgICB4LmNoaWxkcmVuLm1hcChmdW5jdGlvbihjKXsKICAgICAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJtYjgiPicgKwogICAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJyb3cgZnMxMiI+PHNwYW4+4oaz',
  'ICcgKyBlc2MoYy50aXRsZSkgKyAnPC9zcGFuPicgKwogICAgICAgICAgICAgICc8c3BhbiBjbGFzcz0ic3AgbW9ubyI+JyArIG1vbmV5KGMucGFpZCkgKyAnIC8gJyArIG1vbmV5KGMucHJpbmNpcGFsKSArICc8L3NwYW4+PC9kaXY+JyArCiAgICAgICAgICAgICAg',
  'cHJvZ3Jlc3MoYy5wZXJjZW50LCAnb2snKSArICc8L2Rpdj4nOwogICAgICAgICAgfSkuam9pbignJykgKwogICAgICAgICAgKHgucGFpZEZyb21DaGlsZHJlbiA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIj7guKPguKfguKHguKLguK3guJTguJfguLXguYjguKHg',
  'uLLguIjguLLguIHguIHguYnguK3guJnguKLguYjguK3guKIgJyArIGJhaHQoeC5wYWlkRnJvbUNoaWxkcmVuKSArICc8L2Rpdj4nIDogJycpCiAgICAgICAgOiAnJykgKwogICAgICAoeC5pbnRlcmVzdFBlck1vbnRoID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQg',
  'bXQ4Ij7guJTguK3guIHguYDguJrguLXguYnguKIgJyArIGJhaHQoeC5pbnRlcmVzdFBlck1vbnRoKSArICcv4LmA4LiU4Li34Lit4LiZPC9kaXY+JyA6ICcnKSArCiAgICAgICh4LnBsYW5QZXJNb250aCA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIj7guYHguJzg',
  'uJnguJzguYjguK3guJkgJyArIGJhaHQoeC5wbGFuUGVyTW9udGgpICsgJy/guYDguJTguLfguK3guJk8L2Rpdj4nIDogJycpICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBtdDEyIj48YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9XCdmb3JtRGVidCgnICsg',
  'YXR0cih4KSArICcsIicgKyBkLmxlZGdlciArICciKVwnPuC5geC4geC5ieC5hOC4gjwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGRnciIgb25jbGljaz0iZGVsRGVidChcJycgKyB4LmlkICsgJ1wnKSI+4Lil4LiaPC9idXR0b24+PC9k',
  'aXY+JyArCiAgICAnPC9kaXY+PC9kaXY+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nIDogJyc7CgogIHZhciBieVllYXIgPSBkLmJ5WWVhci5sZW5ndGggPyBjYXJkKCfwn5OFIOC4ouC4reC4lOC4iuC4s+C4o+C4sOC5geC4ouC4geC4leC4suC4oeC4m+C4tScs',
  'CiAgICAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsKICAgICc8dGg+4Lib4Li1PC90aD48dGggY2xhc3M9Im51bSI+4LmA4LiH4Li04LiZ4LiV4LmJ4LiZPC90aD48dGggY2xhc3M9Im51bSI+4LiU4Lit4LiB4LmA4Lia4Li1',
  '4LmJ4LiiPC90aD48dGggY2xhc3M9Im51bSI+4Lij4Lin4Lih4LiX4Li14LmI4LmC4Lit4LiZPC90aD4nICsKICAgICc8dGggY2xhc3M9Im51bSI+4LiI4Liz4LiZ4Lin4LiZ4LiE4Lij4Lix4LmJ4LiHPC90aD48dGggY2xhc3M9Im51bSI+4LmA4LiH4Li04LiZ4LiV',
  '4LmJ4LiZ4Liq4Liw4Liq4LihPC90aD48dGggc3R5bGU9IndpZHRoOjI2JSI+4LiE4Lin4Liy4Lih4LiE4Li34Lia4Lir4LiZ4LmJ4Liy4Liq4Liw4Liq4LihPC90aD4nICsKICAgICc8L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgZC5ieVllYXIubWFwKGZ1bmN0',
  'aW9uKHkpewogICAgICB2YXIgY3VtID0geS5jdW11bGF0aXZlICE9IG51bGwgPyB5LmN1bXVsYXRpdmUgOiAwOwogICAgICB2YXIgcCA9IGQudG90YWxEZWJ0ID8gKGN1bSAvIGQudG90YWxEZWJ0ICogMTAwKSA6IDA7CiAgICAgIHJldHVybiAnPHRyIG9uY2xpY2s9',
  'InNldFllYXJGcm9tVGFibGUoJyArIHkueWVhciArICcpIiBzdHlsZT0iY3Vyc29yOnBvaW50ZXIiPicgKwogICAgICAgICc8dGQ+PGI+JyArIHkueWVhciArICc8L2I+IDxzcGFuIGNsYXNzPSJmYWludCBmczEyIj4vICcgKyAoeS55ZWFyKzU0MykgKyAnPC9zcGFu',
  'PjwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbW9uZXkoeS5wcmluY2lwYWwpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHkuaW50ZXJlc3QgPyBtb25leSh5LmludGVyZXN0KSA6ICfigJMnKSArICc8L3RkPicg',
  'KwogICAgICAgICc8dGQgY2xhc3M9Im51bSI+PGI+JyArIG1vbmV5KHkucHJpbmNpcGFsICsgeS5pbnRlcmVzdCkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgeS5jb3VudCArICc8L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9',
  'Im51bSI+JyArIG1vbmV5KGN1bSkgKyAnPC90ZD4nICsKICAgICAgICAnPHRkPicgKyBwcm9ncmVzcyhwKSArICc8L3RkPjwvdHI+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nLCAnJywgdHJ1ZSkgOiAnJzsKCiAgdmFyIHJvd3Mg',
  'PSBkLnBheW1lbnRzOwogIHZhciBsaXN0ID0gY2FyZCgn8J+nviDguKPguLLguKLguIHguLLguKPguYLguK3guJnguYPguIrguYnguKvguJnguLXguYkgwrcgJyArIHllYXJMYWJlbCArICcgKCcgKyByb3dzLmxlbmd0aCArICcpJywKICAgIHJvd3MubGVuZ3RoID8g',
  'JzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICc8dGg+4Lin4Lix4LiZ4LiX4Li14LmIPC90aD48dGg+4LiH4Lin4LiUPC90aD48dGggY2xhc3M9Im51bSI+4LmA4LiH4Li04LiZ4LiV4LmJ4LiZPC90aD48dGggY2xh',
  'c3M9Im51bSI+4LiU4Lit4LiB4LmA4Lia4Li14LmJ4LiiPC90aD4nICsKICAgICAgJzx0aCBjbGFzcz0ibnVtIj7guKPguKfguKHguJfguLXguYjguYLguK3guJk8L3RoPjx0aD7guIrguYjguK3guIfguJfguLLguIc8L3RoPicgKwogICAgICAnPHRoPuC4quC4peC4',
  'tOC4mzwvdGg+PHRoPuC4q+C4oeC4suC4ouC5gOC4q+C4leC4uDwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgcm93cy5tYXAoZnVuY3Rpb24ocCl7CiAgICAgICAgcmV0dXJuICc8dHI+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJu',
  'b3dyYXAiPicgKyB0aERhdGUocC5wYXlEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIj4nICsgZXNjKHAuaW5zdGFsbG1lbnQgfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAocC5w',
  'cmluY2lwYWwgPyAnPGIgc3R5bGU9ImNvbG9yOnZhcigtLW9rKSI+JyArIG1vbmV5KHAucHJpbmNpcGFsKSArICc8L2I+JyA6ICc8c3BhbiBjbGFzcz0iZmFpbnQiPuKAkzwvc3Bhbj4nKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsg',
  'KHAuaW50ZXJlc3QgPyAnPGIgc3R5bGU9ImNvbG9yOnZhcigtLXdhcm4pIj4nICsgbW9uZXkocC5pbnRlcmVzdCkgKyAnPC9iPicgOiAnPHNwYW4gY2xhc3M9ImZhaW50Ij7igJM8L3NwYW4+JykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+',
  'PGI+JyArIG1vbmV5KHAuYW1vdW50KSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MocC5jaGFubmVsIHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbChwLnNsaXBSZWZzKSAr',
  'ICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiBtdXRlZCBjbGlwIj4nICsgZXNjKHAubm90ZSB8fCAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsKICAgICAgICAgICAgJzxidXR0b24gY2xh',
  'c3M9ImJ0biBzbSBpY29uIiBvbmNsaWNrPVwnZm9ybURlYnRQYXltZW50KCcgKyBhdHRyKHApICsgJywiJyArIGQubGVkZ2VyICsgJyIpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiBkZ3IiIG9uY2xp',
  'Y2s9ImRlbERlYnRQYXltZW50KFwnJyArIHAuaWQgKyAnXCcpIj7wn5eRPC9idXR0b24+JyArCiAgICAgICAgICAnPC9kaXY+PC90ZD48L3RyPic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nCiAgICA6IGVtcHR5Qm94KCfguKLg',
  'uLHguIfguYTguKHguYjguKHguLXguKPguLLguKLguIHguLLguKPguIrguLPguKPguLDguYPguJknICsgeWVhckxhYmVsLAogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtRGVidFBheW1lbnQobnVsbCxcJycgKyBkLmxlZGdlciAr',
  'ICdcJykiPisg4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4LiK4Liz4Lij4LiwPC9idXR0b24+JyksCiAgICAnJywgdHJ1ZSk7CgogIHJldHVybiBoZWFkICsgcGVyRGVidCArIGJ5WWVhciArICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgbGlzdCArICc8L2Rpdj4n',
  'Owp9CgpmdW5jdGlvbiBzZXRZZWFyRnJvbVRhYmxlKHkpewogIFMueWVhciA9IFN0cmluZyh5KTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgneWVhclNlbCcpLnZhbHVlID0gUy55ZWFyOwogIGxvYWQoKTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDMpIOC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8K',
  'Uk9VVEVTLnB1cmNoYXNlcyA9IHsKICBsb2FkOiBmdW5jdGlvbigpewogICAgcmV0dXJuIFByb21pc2UuYWxsKFsKICAgICAgY2FsbEFwaSgncHVyY2hhc2Uuc3VtbWFyeScsIHsgeWVhcjogUy55ZWFyIH0pLAogICAgICBjYWxsQXBpKCdwdXJjaGFzZS5saXN0Jywg',
  'eyB5ZWFyOiBTLnllYXIsIGNhdGVnb3J5OiBTLnBhcmFtcy5jYXRlZ29yeSB8fCAnJywgcTogUy5wYXJhbXMucSB8fCAnJyB9KQogICAgXSkudGhlbihmdW5jdGlvbihyKXsgdmFyIGQgPSByWzBdOyBkLml0ZW1zID0gclsxXTsgcmV0dXJuIGQ7IH0pOwogIH0sCiAg',
  'cmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAg',
  'ICBrcGkoJ+C4ouC4reC4lOC4i+C4t+C5ieC4rSAnICsgeWVhckxhYmVsLCBiYWh0KGQueWVhclRvdGFsKSwgZC55ZWFyQ291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4oycsICdhY2NlbnQnKSArCiAgICAgIGtwaSgn4Lii4Lit4LiU4Liq4Liw4Liq4Lih4LiX4Lix',
  '4LmJ4LiH4Lir4Lih4LiUJywgYmFodChkLmdyYW5kVG90YWwpLCBkLmdyYW5kQ291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4oycpICsKICAgICAga3BpKCfguK3guKLguLnguYjguYPguJnguJvguKPguLDguIHguLHguJknLCBkLndhcnJhbnR5LmFjdGl2ZSArICcg',
  '4Lij4Liy4Lii4LiB4Liy4LijJywgJ+C5g+C4geC4peC5ieC4q+C4oeC4lCAnICsgZC53YXJyYW50eS5leHBpcmluZywgZC53YXJyYW50eS5leHBpcmluZyA/ICd3YXJuJyA6ICdnb29kJykgKwogICAgICBrcGkoJ+C4q+C4oeC4p+C4lOC4l+C4teC5iOC5g+C4iuC5',
  'ieC4iOC5iOC4suC4ouC4quC4ueC4h+C4quC4uOC4lCcsIGQuYnlDYXRlZ29yeVswXSA/IGQuYnlDYXRlZ29yeVswXS5jYXRlZ29yeSA6ICfigJMnLAogICAgICAgICAgZC5ieUNhdGVnb3J5WzBdID8gYmFodChkLmJ5Q2F0ZWdvcnlbMF0udG90YWwpIDogJycpICsK',
  'ICAgICc8L2Rpdj4nOwoKICAgIHZhciBjaGFydHMgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnMiBtYjEyIj4nICsKICAgICAgY2FyZCgn8J+TiiDguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguYHguKLguIHguJXguLLguKHguKvguKHguKfguJTguKvguKHguLng',
  'uYggwrcgJyArIHllYXJMYWJlbCwKICAgICAgICBiYXJDaGFydChkLmJ5Q2F0ZWdvcnksICdjYXRlZ29yeScsICd0b3RhbCcsIGZ1bmN0aW9uKGkpeyByZXR1cm4gbW9uZXkoaS50b3RhbCkgKyAnIOC4vyc7IH0pKSArCiAgICAgIGNhcmQoJ/Cfk4Ug4Lii4Lit4LiU',
  '4LiL4Li34LmJ4Lit4LmB4Lii4LiB4LiV4Liy4Lih4Lib4Li1JywKICAgICAgICBiYXJDaGFydChkLmJ5WWVhci5tYXAoZnVuY3Rpb24oeSl7IHJldHVybiB7IGxhYmVsOiAn4Lib4Li1ICcgKyB5LnllYXIgKyAnICgnICsgeS5jb3VudCArICcpJywgdG90YWw6IHku',
  'dG90YWwsIHllYXI6IHkueWVhciB9OyB9KSwKICAgICAgICAgICAgICAgICAnbGFiZWwnLCAndG90YWwnLCBmdW5jdGlvbihpKXsgcmV0dXJuIG1vbmV5KGkudG90YWwpICsgJyDguL8nOyB9KSkgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIGNhdHMgPSAnPGRpdiBj',
  'bGFzcz0iY2hpcHMgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJjaGlwICcgKyAoIVMucGFyYW1zLmNhdGVnb3J5Pydvbic6JycpICsgJyIgb25jbGljaz0ic2V0UGFyYW0oXCdjYXRlZ29yeVwnLFwnXCcpIj7guJfguLjguIHguKvguKHguKfguJQ8L2J1',
  'dHRvbj4nICsKICAgICAgZC5ieUNhdGVnb3J5Lm1hcChmdW5jdGlvbihjKXsKICAgICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9ImNoaXAgJyArIChTLnBhcmFtcy5jYXRlZ29yeT09PWMuY2F0ZWdvcnk/J29uJzonJykgKyAnIiAnICsKICAgICAgICAgICAgICAg',
  'J29uY2xpY2s9InNldFBhcmFtKFwnY2F0ZWdvcnlcJyxcJycgKyBlc2MoYy5jYXRlZ29yeSkgKyAnXCcpIj4nICsgZXNjKGMuY2F0ZWdvcnkpICsgJyAoJyArIGMuY291bnQgKyAnKTwvYnV0dG9uPic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7CgogICAg',
  'dmFyIHJvd3MgPSBkLml0ZW1zOwogICAgdmFyIHRhYmxlID0gY2FyZCgn8J+bkiDguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcgwrcgJyArIHllYXJMYWJlbCArICcgKCcgKyByb3dzLmxlbmd0aCArICcpJywKICAgICAgcm93cy5sZW5ndGgg',
  'PyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDo5ODBweCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoIHN0eWxlPSJ3aWR0aDo5NnB4Ij7guKfguLHguJnguJfguLXguYjguIvguLfguYnguK08L3RoPjx0aD7guKPg',
  'uLLguKLguIHguLLguKPguKrguLTguJnguITguYnguLI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guIjguLPguJnguKfguJk8L3RoPicgKwogICAgICAgICc8dGggY2xhc3M9Im51bSI+4Lij4Liy4LiE4LiyPC90aD48dGg+4LmB4Lir4Lil4LmI4LiH4LiX4Li14LmI4LiL',
  '4Li34LmJ4LitPC90aD48dGg+4Lib4Lij4Liw4LiB4Lix4LiZPC90aD48dGg+4Lig4Liy4LiePC90aD48dGg+4Liq4Lil4Li04LibPC90aD48dGg+PC90aD4nICsKICAgICAgICAnPC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICByb3dzLm1hcChmdW5jdGlv',
  'bihwKXsKICAgICAgICAgIHZhciB3ID0gcC53YXJyYW50eSB8fCB7fTsKICAgICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZShwLmJ1eURhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAg',
  'ICc8dGQ+PGRpdiBjbGFzcz0iY2xpcCIgdGl0bGU9IicgKyBlc2MocC5pdGVtKSArICciPjxiPicgKyBlc2MocC5pdGVtKSArICc8L2I+PC9kaXY+JyArCiAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImZzMTIgZmFpbnQiPicgKyBlc2MocC5jYXRlZ29yeSB8fCAn',
  'JykgKyAocC5yb29tID8gJyDCtyDguKvguYnguK3guIcgJyArIGVzYyhwLnJvb20pIDogJycpICsKICAgICAgICAgICAgICAgIChwLm9yZGVyTm8gPyAnIMK3IOC4reC4reC4o+C5jOC5gOC4lOC4reC4o+C5jCAnICsgZXNjKHAub3JkZXJObykgOiAnJykgKyAnPC9k',
  'aXY+JyArCiAgICAgICAgICAgICAgYmlsbEh0bWwocCkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbnVtKHAucXR5KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxiPicgKyBtb25leShwLnByaWNl',
  'KSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyhwLnZlbmRvciB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArICh3LmhhcwogICAgICAgICAgICAgICAgPyBzdGF0',
  'dXNCYWRnZSh3LnN0YXRlKSArICc8ZGl2IGNsYXNzPSJmYWludCIgc3R5bGU9ImZvbnQtc2l6ZToxMXB4Ij4nICsgdGhEYXRlU2hvcnQody5lbmQpICsgJzwvZGl2PicKICAgICAgICAgICAgICAgIDogJzxzcGFuIGNsYXNzPSJmYWludCI+4oCTPC9zcGFuPicpICsg',
  'JzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwocC5waG90b1JlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwocC5zbGlwUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48ZGl2IGNsYXNz',
  'PSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1QdXJjaGFzZSgnICsgYXR0cihwKSArICcpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9',
  'ImJ0biBzbSBpY29uIGRnciIgb25jbGljaz0iZGVsUHVyY2hhc2UoXCcnICsgcC5pZCArICdcJykiPvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICAgJzwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rp',
  'dj4nCiAgICAgIDogZW1wdHlCb3goJ+C4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC5g+C4mScgKyB5ZWFyTGFiZWwsICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtUHVyY2hhc2UobnVsbCki',
  'Pisg4LmA4Lie4Li04LmI4Lih4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4LitPC9idXR0b24+JyksCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIHNtIiBvbmNsaWNrPSJmb3JtUHVyY2hhc2UobnVsbCkiPisg4LmA4Lie4Li04LmI4Lih4Lij4Liy4Lii',
  '4LiB4Liy4Lij4LiL4Li34LmJ4LitPC9idXR0b24+JywgdHJ1ZSk7CgogICAgcmV0dXJuIGhlYWQgKyBjaGFydHMgKyBjYXRzICsgdGFibGU7CiAgfQp9OwoKLyoqCiAqIOC4muC4tOC4peC4l+C4teC5iOC4oeC4teC4guC4reC4h+C4q+C4peC4suC4ouC4reC4ouC5',
  'iOC4suC4hyDigJQg4LmB4Liq4LiU4LiH4LmA4Lib4LmH4LiZ4Lib4Li44LmI4Lih4LiB4Liy4LiH4LiU4Li5IOC5hOC4oeC5iOC5g+C4q+C5ieC4leC4suC4o+C4suC4h+C4ouC4suC4p+C5gOC4geC4tOC4meC5hOC4mwogKiDguJrguLTguKXguJfguLXguYjguKHg',
  'uLXguKPguLLguKLguIHguLLguKPguYDguJTguLXguKLguKfguKvguKPguLfguK3guYTguKHguYjguKHguLXguKPguLLguKLguIHguLLguKPguKLguYjguK3guKLguYDguKXguKIg4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LmB4Liq4LiU4LiH4Lit4Liw4LmE4Lij4LmA',
  '4Lie4Li04LmI4LihCiAqLwpmdW5jdGlvbiBiaWxsSHRtbChwKXsKICB2YXIgYiA9IHAuYmlsbDsKICBpZiAoIWIgfHwgYi5jb3VudCA8IDIpIHJldHVybiAnJzsKICB2YXIgaWQgPSAnYmlsbF8nICsgcC5pZDsKICByZXR1cm4gJzxidXR0b24gdHlwZT0iYnV0dG9u',
  'IiBjbGFzcz0iYmlsbC10b2dnbGUiIG9uY2xpY2s9InRvZ2dsZUJpbGwoXCcnICsgaWQgKyAnXCcpIj4nICsKICAgICAgJ/Cfp74gJyArIGIuY291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4o+C5g+C4meC4muC4tOC4pSDilr48L2J1dHRvbj4nICsKICAgICc8ZGl2',
  'IGNsYXNzPSJiaWxsLWxpbmVzIiBpZD0iJyArIGlkICsgJyIgaGlkZGVuPicgKwogICAgICBiLmxpbmVzLm1hcChmdW5jdGlvbihsKXsKICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImJpbGwtbGluZSI+JyArCiAgICAgICAgICAnPHNwYW4gY2xhc3M9Im5tIiB0',
  'aXRsZT0iJyArIGVzYyhsLm5hbWUpICsgJyI+JyArIGVzYyhsLm5hbWUpICsgJzwvc3Bhbj4nICsKICAgICAgICAgICc8c3BhbiBjbGFzcz0icXQiPicgKyBudW0obC5xdHkpICsgKGwudW5pdCA/ICcgJyArIGVzYyhsLnVuaXQpIDogJycpICsgJyDDlyAnICsgbW9u',
  'ZXkobC51bml0UHJpY2UsIDIpICsgJzwvc3Bhbj4nICsKICAgICAgICAgICc8c3BhbiBjbGFzcz0idHQiPicgKyBtb25leShsLnRvdGFsLCAyKSArICc8L3NwYW4+PC9kaXY+JzsKICAgICAgfSkuam9pbignJykgKwogICAgICAoKGIuc2hpcHBpbmcgfHwgYi5kaXNj',
  'b3VudCkKICAgICAgICA/ICc8ZGl2IGNsYXNzPSJiaWxsLWV4dHJhIj4nICsKICAgICAgICAgICAgKGIuc2hpcHBpbmcgPyAn4LiE4LmI4Liy4Liq4LmI4LiHICcgKyBtb25leShiLnNoaXBwaW5nLCAyKSA6ICcnKSArCiAgICAgICAgICAgIChiLnNoaXBwaW5nICYm',
  'IGIuZGlzY291bnQgPyAnIMK3ICcgOiAnJykgKwogICAgICAgICAgICAoYi5kaXNjb3VudCA/ICfguKrguYjguKfguJnguKXguJQg4oiSJyArIG1vbmV5KGIuZGlzY291bnQsIDIpIDogJycpICsgJzwvZGl2PicKICAgICAgICA6ICcnKSArCiAgICAnPC9kaXY+JzsK',
  'fQoKZnVuY3Rpb24gdG9nZ2xlQmlsbChpZCl7CiAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpOwogIGlmICghZWwpIHJldHVybjsKICBlbC5oaWRkZW4gPSAhZWwuaGlkZGVuOwogIHZhciBidG4gPSBlbC5wcmV2aW91c0VsZW1lbnRTaWJsaW5n',
  'OwogIGlmIChidG4pIGJ0bi50ZXh0Q29udGVudCA9IGJ0bi50ZXh0Q29udGVudC5yZXBsYWNlKGVsLmhpZGRlbiA/ICfilrQnIDogJ+KWvicsIGVsLmhpZGRlbiA/ICfilr4nIDogJ+KWtCcpOwp9CgpmdW5jdGlvbiBzZXRQYXJhbShrZXksIHZhbCl7CiAgUy5wYXJh',
  'bXNba2V5XSA9IHZhbDsKICBsb2FkKCk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICA0KSDguKXguYnguLLguIfguYHguK3guKPguYwKICAgPT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5hYyA9IHsKICBsb2FkOiBmdW5jdGlvbigpeyByZXR1cm4gY2FsbEFwaSgnYWMubWF0cml4JywgeyB5ZWFyOiBTLnllYXIgfSk7IH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAg',
  'IHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICBrcGkoJ+C4peC5ieC4suC4h+C5geC4',
  'peC5ieC4pyAnICsgeWVhckxhYmVsLCBkLnJvb21zRG9uZUluWWVhciArICcvJyArIGQucm9vbXMubGVuZ3RoICsgJyDguKvguYnguK3guIcnLCBkLmRvbmVJblllYXIgKyAnIOC4o+C4reC4muC4l+C4seC5ieC4h+C4q+C4oeC4lCcsICdhY2NlbnQnKSArCiAgICAg',
  'IGtwaSgn4Lii4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJ4Lil4LmJ4Liy4LiHJywgZC5yb29tc1BlbmRpbmcubGVuZ3RoICsgJyDguKvguYnguK3guIcnLCBkLnJvb21zUGVuZGluZy5zbGljZSgwLDgpLmpvaW4oJywgJykgKyAoZC5yb29tc1BlbmRpbmcubGVuZ3Ro',
  'Pjg/J+KApic6JycpLCBkLnJvb21zUGVuZGluZy5sZW5ndGggPyAnd2Fybic6J2dvb2QnKSArCiAgICAgIGtwaSgn4LiW4Li24LiH4LiB4Liz4Lir4LiZ4LiU4Lil4LmJ4Liy4LiHJywgZC5vdmVyZHVlLmxlbmd0aCArICcg4Lir4LmJ4Lit4LiHJywgJ+C4o+C4reC4',
  'muC4peC5ieC4suC4h+C4l+C4uOC4gSAnICsgZC5jeWNsZU1vbnRocyArICcg4LmA4LiU4Li34Lit4LiZJywgZC5vdmVyZHVlLmxlbmd0aCA/ICdiYWQnOidnb29kJykgKwogICAgICBrcGkoJ+C4hOC4p+C4suC4oeC4hOC4t+C4muC4q+C4meC5ieC4sicsIHBjdChk',
  'LnJvb21zLmxlbmd0aCA/IGQucm9vbXNEb25lSW5ZZWFyL2Qucm9vbXMubGVuZ3RoKjEwMCA6IDApLCAn4LiC4Lit4LiH4LiX4Lix4LmJ4LiH4Lir4Lih4LiUICcgKyBkLnJvb21zLmxlbmd0aCArICcg4Lir4LmJ4Lit4LiHJykgKwogICAgJzwvZGl2Pic7CgogICAg',
  'dmFyIGFjdGlvbnMgPSAnPGRpdiBjbGFzcz0icm93IG1iMTIiPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZm9ybUFjKG51bGwpIj4rIOC4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C4peC5ieC4suC4h+C5geC4reC4o+C5jDwv',
  'YnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJmb3JtQnVsa0FjKCkiPvCfk4Ug4LiZ4Lix4LiU4Lil4LmJ4Liy4LiH4Lir4Lil4Liy4Lii4Lir4LmJ4Lit4LiH4Lie4Lij4LmJ4Lit4Lih4LiB4Lix4LiZPC9idXR0b24+JyArCiAg',
  'ICAgICc8c3BhbiBjbGFzcz0ic3AiPjwvc3Bhbj4nICsKICAgICAgJzxzcGFuIGNsYXNzPSJmczEyIG11dGVkIj7guITguKXguLTguIHguJfguLXguYjguKvguYnguK3guIfguYDguJ7guLfguYjguK3guJTguLkv4LmA4Lie4Li04LmI4Lih4Lij4Lit4Lia4LiB4Liy',
  '4Lij4Lil4LmJ4Liy4LiHPC9zcGFuPicgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIGdyaWQgPSBjYXJkKCfinYTvuI8g4LiV4Liy4Lij4Liy4LiH4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4Lij4Liy4Lii4Lir4LmJ4Lit4LiHIMK3ICcgKyB5ZWFyTGFiZWwsIHJv',
  'b21GbG9vcnMoZC5yb29tcywgZnVuY3Rpb24ocil7CiAgICAgIHZhciBjbHMgPSByLnJvdW5kc0luWWVhciA+IDAgPyAncy1vaycgOiAoci5zdGF0ZSA9PT0gJ+C5gOC4geC4tOC4meC4geC4s+C4q+C4meC4lCcgPyAncy1kZ3InIDogKHIuc3RhdGUgPT09ICfguKLg',
  'uLHguIfguYTguKHguYjguYDguITguKLguKXguYnguLLguIcnID8gJ3Mtd2FybicgOiAncy1pbmZvJykpOwogICAgICB2YXIgc3ViID0gci5yb3VuZHNJblllYXIgPiAwCiAgICAgICAgPyAnPGI+JyArIHIucm91bmRzSW5ZZWFyICsgJyDguKPguK3guJo8L2I+PGJy',
  'PicgKyB0aERhdGVTaG9ydChyLnJlY29yZHMuZmlsdGVyKGZ1bmN0aW9uKHgpe3JldHVybiB4LnNlcnZpY2VEYXRlO30pLm1hcChmdW5jdGlvbih4KXtyZXR1cm4geC5zZXJ2aWNlRGF0ZTt9KS5zb3J0KCkucG9wKCkpCiAgICAgICAgOiAoci5ib29rZWRJblllYXIg',
  'PyAn4LiZ4Lix4LiU4LmB4Lil4LmJ4LinICcgKyByLmJvb2tlZEluWWVhciA6IChyLmxhc3RTZXJ2aWNlID8gJ+C4peC5iOC4suC4quC4uOC4lCAnICsgdGhEYXRlU2hvcnQoci5sYXN0U2VydmljZSkgOiAn4LmE4Lih4LmI4Lih4Li14Lib4Lij4Liw4Lin4Lix4LiV',
  '4Li0JykpOwogICAgICByZXR1cm4geyBjbHM6IGNscywgc3ViOiBzdWIsIG9uY2xpY2s6ICdvcGVuQWNSb29tKFwnJyArIHIucm9vbSArICdcJyknIH07CiAgICB9KSwgJycsIGZhbHNlKTsKCiAgICB2YXIgbGlzdFJvd3MgPSBbXTsKICAgIGQucm9vbXMuZm9yRWFj',
  'aChmdW5jdGlvbihyKXsgci5yZWNvcmRzLmZvckVhY2goZnVuY3Rpb24oeCl7IHguX3Jvb20gPSByLnJvb207IGxpc3RSb3dzLnB1c2goeCk7IH0pOyB9KTsKICAgIGxpc3RSb3dzLnNvcnQoZnVuY3Rpb24oYSxiKXsgcmV0dXJuIFN0cmluZyhiLnNlcnZpY2VEYXRl',
  'fHxiLmJvb2tEYXRlfHwnJykubG9jYWxlQ29tcGFyZShTdHJpbmcoYS5zZXJ2aWNlRGF0ZXx8YS5ib29rRGF0ZXx8JycpKTsgfSk7CgogICAgdmFyIGxpc3QgPSBjYXJkKCfwn5OLIOC4m+C4o+C4sOC4p+C4seC4leC4tOC4geC4suC4o+C4peC5ieC4suC4h+C5geC4',
  'reC4o+C5jCDCtyAnICsgeWVhckxhYmVsICsgJyAoJyArIGxpc3RSb3dzLmxlbmd0aCArICcpJywKICAgICAgbGlzdFJvd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guKvguYng',
  'uK3guIc8L3RoPjx0aD7guKPguK3guJrguJfguLXguYg8L3RoPjx0aD7guKfguLHguJnguJfguLXguYjguJnguLHguJQ8L3RoPjx0aD7guKfguLHguJnguJfguLXguYjguJTguLPguYDguJnguLTguJnguIHguLLguKM8L3RoPjx0aD7guKrguJbguLLguJnguLA8L3Ro',
  'PicgKwogICAgICAgICc8dGg+4LiK4LmI4Liy4LiHPC90aD48dGggY2xhc3M9Im51bSI+4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiPC90aD48dGg+4Lig4Liy4LiePC90aD48dGg+4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4PC90aD48dGg+PC90aD48L3Ry',
  'PjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIGxpc3RSb3dzLm1hcChmdW5jdGlvbih4KXsKICAgICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgICAnPHRkPjxiPicgKyBlc2MoeC5yb29tKSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBj',
  'bGFzcz0ibnVtIj4nICsgKHgucm91bmQgfHwgMSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyB0aERhdGUoeC5ib29rRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIi',
  'PicgKyB0aERhdGUoeC5zZXJ2aWNlRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgc3RhdHVzQmFkZ2UoeC5zdGF0dXMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MoeC50ZWNobmljaWFuIHx8ICfi',
  'gJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyBudW0oeC5jb3N0KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHgucGhvdG9SZWZzKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNs',
  'YXNzPSJmczEyIG11dGVkIGNsaXAiPicgKyBlc2MoeC5ub3RlIHx8ICcnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPjxkaXYgY2xhc3M9InQtYWN0aW9ucyI+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIiBvbmNsaWNr',
  'PVwnZm9ybUFjKCcgKyBhdHRyKHgpICsgJylcJz7inI/vuI88L2J1dHRvbj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24gZGdyIiBvbmNsaWNrPSJkZWxBYyhcJycgKyB4LmlkICsgJ1wnKSI+8J+XkTwvYnV0dG9uPicgKwogICAg',
  'ICAgICAgICAnPC9kaXY+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgOiBlbXB0eUJveCgn4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4Lil4LmJ',
  '4Liy4LiH4LmB4Lit4Lij4LmM4LmD4LiZJyArIHllYXJMYWJlbCksICcnLCB0cnVlKTsKCiAgICByZXR1cm4gaGVhZCArIGFjdGlvbnMgKyBncmlkICsgJzxkaXYgY2xhc3M9Im10MTIiPicgKyBsaXN0ICsgJzwvZGl2Pic7CiAgfQp9OwoKZnVuY3Rpb24gb3BlbkFj',
  'Um9vbShyb29tKXsKICB2YXIgZCA9IFMuY2FjaGUuYWM7CiAgdmFyIHIgPSBkLnJvb21zLmZpbHRlcihmdW5jdGlvbih4KXsgcmV0dXJuIHgucm9vbSA9PT0gcm9vbTsgfSlbMF07CiAgdmFyIGJvZHkgPQogICAgJzxkaXYgY2xhc3M9ImdyaWQgZzMgbWIxMiI+JyAr',
  'CiAgICAgIGtwaSgn4Lij4Lit4Lia4LiX4Li14LmI4Lil4LmJ4Liy4LiH4LmD4LiZ4Lib4Li14LiZ4Li14LmJJywgKHIucm91bmRzSW5ZZWFyfHwwKSArICcg4Lij4Lit4LiaJywgJycpICsKICAgICAga3BpKCfguKXguYnguLLguIfguKXguYjguLLguKrguLjguJQn',
  'LCByLmxhc3RTZXJ2aWNlID8gdGhEYXRlKHIubGFzdFNlcnZpY2UpIDogJ+KAkycsIHIubGFzdFNlcnZpY2UgPyAoZGF5c0FnbyhyLmxhc3RTZXJ2aWNlKSArICcg4Lin4Lix4LiZ4LiX4Li14LmI4LmB4Lil4LmJ4LinJykgOiAnJykgKwogICAgICBrcGkoJ+C4hOC4',
  'o+C4muC4geC4s+C4q+C4meC4lOC4o+C4reC4muC4luC4seC4lOC5hOC4mycsIHIubmV4dER1ZSA/IHRoRGF0ZShyLm5leHREdWUpIDogJ+KAkycsIHIuc3RhdGUsIHIuc3RhdGUgPT09ICfguYDguIHguLTguJnguIHguLPguKvguJnguJQnID8gJ2JhZCcgOiAnJykg',
  'KwogICAgJzwvZGl2PicgKwogICAgKHIucmVjb3Jkcy5sZW5ndGgKICAgICAgPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDphdXRvIj48dGhlYWQ+PHRyPjx0aD7guKPguK3guJo8L3RoPjx0aD7guJnguLHguJQ8L3Ro',
  'Pjx0aD7guJTguLPguYDguJnguLTguJnguIHguLLguKM8L3RoPjx0aD7guKrguJbguLLguJnguLA8L3RoPjx0aD7guKDguLLguJ48L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgci5yZWNvcmRzLm1hcChmdW5jdGlvbih4KXsKICAg',
  'ICAgICAgIHJldHVybiAnPHRyPjx0ZD4nICsgKHgucm91bmR8fDEpICsgJzwvdGQ+PHRkIGNsYXNzPSJmczEyIj4nICsgdGhEYXRlKHguYm9va0RhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyB0aERhdGUoeC5zZXJ2aWNl',
  'RGF0ZSkgKyAnPC90ZD48dGQ+JyArIHN0YXR1c0JhZGdlKHguc3RhdHVzKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHgucGhvdG9SZWZzKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPjxidXR0b24gY2xhc3M9ImJ0biBz',
  'bSIgb25jbGljaz1cJ2Nsb3NlTW9kYWwoKTtmb3JtQWMoJyArIGF0dHIoeCkgKyAnKVwnPuC5geC4geC5ieC5hOC4gjwvYnV0dG9uPjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nCiAgICAgIDogJzxkaXYg',
  'Y2xhc3M9ImVtcHR5Ij7guKLguLHguIfguYTguKHguYjguKHguLXguJrguLHguJnguJfguLbguIHguYPguJnguJvguLXguJfguLXguYjguYDguKXguLfguK3guIE8L2Rpdj4nKTsKCiAgb3Blbk1vZGFsKCfinYTvuI8g4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMIMK3',
  'IOC4q+C5ieC4reC4hyAnICsgcm9vbSwgYm9keSwKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lib4Li04LiUPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iY2xvc2VNb2RhbCgp',
  'O2Zvcm1BYyh7cm9vbTpcJycgKyByb29tICsgJ1wnfSkiPisg4LmA4Lie4Li04LmI4Lih4Lij4Lit4Lia4LiB4Liy4Lij4Lil4LmJ4Liy4LiHPC9idXR0b24+Jyk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PQogICA1KSDguIvguYjguK3guKHguYHguIvguKHguJXguLLguKHguKvguYnguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5yZXBhaXJzID0gewogIGxv',
  'YWQ6IGZ1bmN0aW9uKCl7IHJldHVybiBjYWxsQXBpKCdyZXBhaXIubWF0cml4JywgeyB5ZWFyOiBTLnllYXIgfSk7IH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScg',
  'OiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICBrcGkoJ+C4h+C4suC4meC4i+C5iOC4reC4oSAnICsgeWVhckxhYmVsLCBkLnRvdGFsSm9icyArICcg4LiH4Liy4LiZJywgJ+C4iOC4',
  'suC4gSAnICsgZC5yb29tcy5maWx0ZXIoZnVuY3Rpb24ocil7cmV0dXJuIHIuY291bnQ+MDt9KS5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsICdhY2NlbnQnKSArCiAgICAgIGtwaSgn4LiH4Liy4LiZ4LiX4Li14LmI4Lii4Lix4LiH4LmE4Lih4LmI4LmA4Liq4Lij',
  '4LmH4LiIJywgZC5vcGVuSm9icyArICcg4LiH4Liy4LiZJywgJycsIGQub3BlbkpvYnMgPyAnd2FybicgOiAnZ29vZCcpICsKICAgICAga3BpKCfguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguKPguKfguKEnLCBiYWh0KGQudG90YWxDb3N0KSwgeWVhckxh',
  'YmVsKSArCiAgICAgIGtwaSgn4Lir4LmJ4Lit4LiH4LiX4Li14LmI4Lii4Lix4LiH4LmE4Lih4LmI4LmA4LiE4Lii4LiL4LmI4Lit4LihJywgZC5yb29tcy5maWx0ZXIoZnVuY3Rpb24ocil7cmV0dXJuIHIuY291bnQ9PT0wO30pLmxlbmd0aCArICcg4Lir4LmJ4Lit',
  '4LiHJywgJ+C5g+C4mScgKyB5ZWFyTGFiZWwpICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciBhY3Rpb25zID0gJzxkaXYgY2xhc3M9InJvdyBtYjEyIj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZvcm1SZXBhaXIobnVsbCkiPisg',
  '4LmB4LiI4LmJ4LiH4LiL4LmI4Lit4LihIC8g4Lia4Lix4LiZ4LiX4Li24LiB4LiH4Liy4LiZ4LiL4LmI4Lit4LihPC9idXR0b24+JyArCiAgICAgICc8c3BhbiBjbGFzcz0ic3AiPjwvc3Bhbj48c3BhbiBjbGFzcz0iZnMxMiBtdXRlZCI+4LiE4Lil4Li04LiB4LiX',
  '4Li14LmI4Lir4LmJ4Lit4LiH4LmA4Lie4Li34LmI4Lit4LiU4Li54Lib4Lij4Liw4Lin4Lix4LiV4Li04LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiC4Lit4LiH4Lir4LmJ4Lit4LiH4LiZ4Lix4LmJ4LiZPC9zcGFuPjwvZGl2Pic7CgogICAgdmFyIGdyaWQgPSBjYXJk',
  'KCfwn5SnIOC4oOC4suC4nuC4o+C4p+C4oeC4h+C4suC4meC4i+C5iOC4reC4oeC4o+C4suC4ouC4q+C5ieC4reC4hyDCtyAnICsgeWVhckxhYmVsLCByb29tRmxvb3JzKGQucm9vbXMsIGZ1bmN0aW9uKHIpewogICAgICB2YXIgY2xzID0gci5vcGVuQ291bnQgPiAw',
  'ID8gJ3MtZGdyJyA6IChyLmNvdW50ID4gMCA/ICdzLW9rJyA6ICdzLWluZm8nKTsKICAgICAgdmFyIHN1YiA9IHIuY291bnQgPiAwCiAgICAgICAgPyAnPGI+JyArIHIuY291bnQgKyAnIOC4h+C4suC4mTwvYj4nICsgKHIub3BlbkNvdW50ID8gJyDCtyDguITguYng',
  'uLLguIcgJyArIHIub3BlbkNvdW50IDogJycpICsgJzxicj4nICsgKHIubGFzdCA/IHRoRGF0ZVNob3J0KHIubGFzdCkgOiAnJykKICAgICAgICA6ICfguYTguKHguYjguKHguLXguIfguLLguJnguIvguYjguK3guKEnOwogICAgICByZXR1cm4geyBjbHM6IGNscywg',
  'c3ViOiBzdWIsIG9uY2xpY2s6ICdvcGVuUmVwYWlyUm9vbShcJycgKyByLnJvb20gKyAnXCcpJyB9OwogICAgfSkpOwoKICAgIHZhciByb3dzID0gW107CiAgICBkLnJvb21zLmZvckVhY2goZnVuY3Rpb24ocil7IHIucmVjb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uKHgp',
  'eyByb3dzLnB1c2goeCk7IH0pOyB9KTsKICAgIHJvd3Muc29ydChmdW5jdGlvbihhLGIpeyByZXR1cm4gU3RyaW5nKGIucmVwYWlyRGF0ZXx8Yi5ib29rRGF0ZXx8JycpLmxvY2FsZUNvbXBhcmUoU3RyaW5nKGEucmVwYWlyRGF0ZXx8YS5ib29rRGF0ZXx8JycpKTsg',
  'fSk7CgogICAgdmFyIGxpc3QgPSBjYXJkKCfwn5OLIOC4o+C4suC4ouC4geC4suC4o+C4h+C4suC4meC4i+C5iOC4reC4oSDCtyAnICsgeWVhckxhYmVsICsgJyAoJyArIHJvd3MubGVuZ3RoICsgJyknLAogICAgICByb3dzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0',
  'dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOjEwMjBweCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC4q+C5ieC4reC4hzwvdGg+PHRoPuC4p+C4seC4meC4meC4seC4lOC4i+C5iOC4reC4oTwvdGg+PHRoPuC4p+C4seC4meC5gOC4guC5',
  'ieC4suC4i+C5iOC4reC4oTwvdGg+PHRoPuC4m+C4o+C4sOC5gOC4oOC4lzwvdGg+PHRoPuC4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4i+C5iOC4reC4oeC5geC4i+C4oTwvdGg+JyArCiAgICAgICAgJzx0aD7guKrguJbguLLguJnguLA8L3RoPjx0aCBjbGFz',
  'cz0ibnVtIj7guITguYjguLLguYPguIrguYnguIjguYjguLLguKI8L3RoPjx0aD7guIHguYjguK3guJk8L3RoPjx0aD7guKvguKXguLHguIc8L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgcm93cy5tYXAoZnVuY3Rpb24oeCl7CiAg',
  'ICAgICAgICByZXR1cm4gJzx0cj4nICsKICAgICAgICAgICAgJzx0ZD48Yj4nICsgZXNjKHgucm9vbSkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHguYm9va0RhdGUpICsgJzwvdGQ+JyArCiAg',
  'ICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHgucmVwYWlyRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyh4LmNhdGVnb3J5IHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAg',
  'ICAgICAnPHRkIGNsYXNzPSJmczEzIj48ZGl2IGNsYXNzPSJjbGlwIj4nICsgZXNjKHguaXRlbXMgfHwgJycpICsgJzwvZGl2PjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHN0YXR1c0JhZGdlKHguc3RhdHVzKSArICh4LnByaW9yaXR5ICYmIHgucHJpb3Jp',
  'dHkgIT09ICfguJvguIHguJXguLQnID8gJyAnICsgc3RhdHVzQmFkZ2UoeC5wcmlvcml0eSkgOiAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbnVtKHguY29zdCkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsg',
  'dGh1bWJzSHRtbCh4LmJlZm9yZVJlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwoeC5hZnRlclJlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsKICAgICAgICAgICAg',
  'ICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24iIG9uY2xpY2s9XCdmb3JtUmVwYWlyKCcgKyBhdHRyKHgpICsgJylcJz7inI/vuI88L2J1dHRvbj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24gZGdyIiBvbmNsaWNrPSJkZWxS',
  'ZXBhaXIoXCcnICsgeC5pZCArICdcJykiPvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICAgJzwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nCiAgICAgIDogZW1wdHlCb3goJ+C4ouC4seC4h+C5',
  'hOC4oeC5iOC4oeC4teC4h+C4suC4meC4i+C5iOC4reC4oeC5g+C4mScgKyB5ZWFyTGFiZWwsICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtUmVwYWlyKG51bGwpIj4rIOC5geC4iOC5ieC4h+C4i+C5iOC4reC4oTwvYnV0dG9uPicpLCAnJywg',
  'dHJ1ZSk7CgogICAgcmV0dXJuIGhlYWQgKyBhY3Rpb25zICsgZ3JpZCArICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgbGlzdCArICc8L2Rpdj4nOwogIH0KfTsKCmZ1bmN0aW9uIG9wZW5SZXBhaXJSb29tKHJvb20pewogIHZhciBkID0gUy5jYWNoZS5yZXBhaXJzOwog',
  'IHZhciByID0gZC5yb29tcy5maWx0ZXIoZnVuY3Rpb24oeCl7IHJldHVybiB4LnJvb20gPT09IHJvb207IH0pWzBdOwogIHZhciBib2R5ID0gJzxkaXYgY2xhc3M9ImdyaWQgZzMgbWIxMiI+JyArCiAgICAgIGtwaSgn4LiH4Liy4LiZ4LiX4Lix4LmJ4LiH4Lir4Lih',
  '4LiUJywgci5jb3VudCArICcg4LiH4Liy4LiZJywgJycpICsKICAgICAga3BpKCfguKLguLHguIfguYTguKHguYjguYDguKrguKPguYfguIgnLCByLm9wZW5Db3VudCArICcg4LiH4Liy4LiZJywgJycsIHIub3BlbkNvdW50ID8gJ3dhcm4nOidnb29kJykgKwogICAg',
  'ICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oicsIGJhaHQoci5jb3N0KSwgJycpICsKICAgICc8L2Rpdj4nICsKICAgIChyLnJlY29yZHMubGVuZ3RoID8gJzxkaXYgY2xhc3M9InRsIj4nICsgci5yZWNvcmRzLm1hcChmdW5jdGlvbih4KXsKICAg',
  'ICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJ0bC1pIj48ZGl2IGNsYXNzPSJkIj4nICsgdGhEYXRlKHgucmVwYWlyRGF0ZSB8fCB4LmJvb2tEYXRlKSArICcgwrcgJyArIGVzYyh4LmNhdGVnb3J5fHwnJykgKyAnICcgKyBzdGF0dXNCYWRnZSh4LnN0YXR1cykgKyAnPC9k',
  'aXY+JyArCiAgICAgICAgJzxkaXYgY2xhc3M9InQiPicgKyBlc2MoeC5pdGVtcyB8fCAnJykgKyAnPC9kaXY+JyArCiAgICAgICAgKHgudGVjaG5pY2lhbiA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIj7guIrguYjguLLguIc6ICcgKyBlc2MoeC50ZWNobmljaWFu',
  'KSArICc8L2Rpdj4nIDogJycpICsKICAgICAgICAoeC5jb3N0ID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQiPuC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oiAnICsgYmFodCh4LmNvc3QpICsgJzwvZGl2PicgOiAnJykgKwogICAgICAgICc8ZGl2IGNsYXNz',
  'PSJtdDgiPicgKyB0aHVtYnNIdG1sKCh4LmJlZm9yZVJlZnN8fFtdKS5jb25jYXQoeC5hZnRlclJlZnN8fFtdKSkgKyAnPC9kaXY+JyArCiAgICAgICAgJzxkaXYgY2xhc3M9Im10OCI+PGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPVwnY2xvc2VNb2RhbCgp',
  'O2Zvcm1SZXBhaXIoJyArIGF0dHIoeCkgKyAnKVwnPuC5geC4geC5ieC5hOC4gjwvYnV0dG9uPjwvZGl2PicgKwogICAgICAnPC9kaXY+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5iOC4',
  'oeC4teC4h+C4suC4meC4i+C5iOC4reC4oeC5g+C4meC4m+C4teC4l+C4teC5iOC5gOC4peC4t+C4reC4gTwvZGl2PicpOwoKICBvcGVuTW9kYWwoJ/CflKcg4LiH4Liy4LiZ4LiL4LmI4Lit4LihIMK3IOC4q+C5ieC4reC4hyAnICsgcm9vbSwgYm9keSwKICAgICc8',
  'YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lib4Li04LiUPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iY2xvc2VNb2RhbCgpO2Zvcm1SZXBhaXIoe3Jvb206XCcnICsgcm9vbSArICdcJ30p',
  'Ij4rIOC5gOC4nuC4tOC5iOC4oeC4h+C4suC4meC4i+C5iOC4reC4oTwvYnV0dG9uPicsIHRydWUpOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgNikg4LiL4LmI4Lit4Lih4LmB4LiL',
  '4Lih4LiV4Li24LiB4LmC4LiU4Lii4Lij4Lin4LihCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMuYnVpbGRpbmcgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsKICAgIHJldHVybiBQ',
  'cm9taXNlLmFsbChbCiAgICAgIGNhbGxBcGkoJ2J1aWxkaW5nLnN1bW1hcnknLCB7IHllYXI6IFMueWVhciB9KSwKICAgICAgY2FsbEFwaSgnYnVpbGRpbmcubGlzdCcsIHsgeWVhcjogUy55ZWFyLCB6b25lOiBTLnBhcmFtcy56b25lIHx8ICcnLCBzdGF0dXM6ICcn',
  'IH0pCiAgICBdKS50aGVuKGZ1bmN0aW9uKHIpeyB2YXIgZCA9IHJbMF07IGQuaXRlbXMgPSByWzFdOyByZXR1cm4gZDsgfSk7CiAgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB',
  '4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKICAgIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgIGtwaSgn4LiH4Liy4LiZ4Lib4Li1ICcgKyAoUy55ZWFyPT09J2FsbCc/J+C4l+C4seC5ieC4h+C4q+C4oeC4lCc6Uy55',
  'ZWFyKSwgZC55ZWFyQ291bnQgKyAnIOC4h+C4suC4mScsICfguKrguLDguKrguKEgJyArIGQudG90YWwgKyAnIOC4h+C4suC4mScsICdhY2NlbnQnKSArCiAgICAgIGtwaSgn4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiICcgKyB5ZWFyTGFiZWwsIGJhaHQo',
  'ZC55ZWFyQ29zdCksICfguKrguLDguKrguKEgJyArIGJhaHQoZC5ncmFuZENvc3QpKSArCiAgICAgIGtwaSgn4LiH4Liy4LiZ4LiX4Li14LmI4Lii4Lix4LiH4LmE4Lih4LmI4LmA4Liq4Lij4LmH4LiIJywgZC5vcGVuQ291bnQgKyAnIOC4h+C4suC4mScsICcnLCBk',
  'Lm9wZW5Db3VudCA/ICd3YXJuJyA6ICdnb29kJykgKwogICAgICBrcGkoJ+C4hOC4o+C4muC4geC4s+C4q+C4meC4lOC5g+C4mSA5MCDguKfguLHguJknLCBkLnVwY29taW5nLmxlbmd0aCArICcg4LiH4Liy4LiZJywgZC51cGNvbWluZy5sZW5ndGggPyBkLnVwY29t',
  'aW5nWzBdLnRpdGxlIDogJycsIGQudXBjb21pbmcubGVuZ3RoID8gJ3dhcm4nIDogJycpICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciB6b25lcyA9ICc8ZGl2IGNsYXNzPSJjaGlwcyBtYjEyIj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImNoaXAgJyArICghUy5w',
  'YXJhbXMuem9uZT8nb24nOicnKSArICciIG9uY2xpY2s9InNldFBhcmFtKFwnem9uZVwnLFwnXCcpIj7guJfguLjguIHguKrguYjguKfguJk8L2J1dHRvbj4nICsKICAgICAgZC5ieVpvbmUubWFwKGZ1bmN0aW9uKHopewogICAgICAgIHJldHVybiAnPGJ1dHRvbiBj',
  'bGFzcz0iY2hpcCAnICsgKFMucGFyYW1zLnpvbmU9PT16LnpvbmU/J29uJzonJykgKyAnIiBvbmNsaWNrPSJzZXRQYXJhbShcJ3pvbmVcJyxcJycgKyBlc2Moei56b25lKSArICdcJykiPicgKwogICAgICAgICAgICAgICBlc2Moei56b25lKSArICcgKCcgKyB6LmNv',
  'dW50ICsgJyk8L2J1dHRvbj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwoKICAgIHZhciBjaGFydHMgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnMiBtYjEyIj4nICsKICAgICAgY2FyZCgn8J+Pl++4jyDguITguYjguLLguYPguIrguYnguIjguYjguLLguKLg',
  'uYHguKLguIHguJXguLLguKHguKrguYjguKfguJnguILguK3guIfguK3guLLguITguLLguKMnLCBiYXJDaGFydChkLmJ5Wm9uZSwgJ3pvbmUnLCAnY29zdCcsIGZ1bmN0aW9uKGkpeyByZXR1cm4gbW9uZXkoaS5jb3N0KSArICcg4Li/JzsgfSkpICsKICAgICAgY2Fy',
  'ZCgn8J+ThSDguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguYHguKLguIHguJXguLLguKHguJvguLUnLCBiYXJDaGFydCgKICAgICAgICBkLmJ5WWVhci5tYXAoZnVuY3Rpb24oeSl7IHJldHVybiB7IGxhYmVsOifguJvguLUgJyArIHkueWVhciArICcgKCcg',
  'KyB5LmNvdW50ICsgJyDguIfguLLguJkpJywgY29zdDp5LmNvc3QgfTsgfSksCiAgICAgICAgJ2xhYmVsJywgJ2Nvc3QnLCBmdW5jdGlvbihpKXsgcmV0dXJuIG1vbmV5KGkuY29zdCkgKyAnIOC4vyc7IH0pKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgcm93cyA9',
  'IGQuaXRlbXM7CiAgICB2YXIgbGlzdCA9IGNhcmQoJ/Cfj6Ig4Lij4Liy4Lii4LiB4Liy4Lij4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmC4LiU4Lii4Lij4Lin4LihIMK3ICcgKyB5ZWFyTGFiZWwgKyAnICgnICsgcm93cy5sZW5ndGggKyAnKScsCiAg',
  'ICAgIHJvd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiIHN0eWxlPSJtaW4td2lkdGg6MTAyMHB4Ij48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4Liq4LmI4Lin4LiZ4LiC4Lit4LiH4Lit4Liy4LiE4Liy4LijPC90aD48dGg+',
  '4Lij4Liy4Lii4LiB4Liy4LijPC90aD48dGg+4LiZ4Lix4LiUPC90aD48dGg+4LmA4Lij4Li04LmI4LihPC90aD48dGg+4LmA4Liq4Lij4LmH4LiIPC90aD48dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD4nICsKICAgICAgICAnPHRoPuC4nOC4ueC5ieC4o+C4seC4muC5',
  'gOC4q+C4oeC4sjwvdGg+PHRoIGNsYXNzPSJudW0iPuC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ojwvdGg+PHRoPuC4o+C4reC4muC4luC4seC4lOC5hOC4mzwvdGg+PHRoPuC4oOC4suC4njwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsK',
  'ICAgICAgICByb3dzLm1hcChmdW5jdGlvbih4KXsKICAgICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj48Yj4nICsgZXNjKHguem9uZSB8fCAn4oCTJykgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xh',
  'c3M9ImZzMTMiPjxkaXYgY2xhc3M9ImNsaXAiPicgKyBlc2MoeC50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICAgKHgubm90ZSA/ICc8ZGl2IGNsYXNzPSJmczEyIGZhaW50IGNsaXAiPicgKyBlc2MoeC5ub3RlKSArICc8L2Rpdj4nIDogJycpICsgJzwv',
  'dGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHguYm9va0RhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHguc3RhcnREYXRlKSArICc8L3RkPicg',
  'KwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LmVuZERhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHN0YXR1c0JhZGdlKHguc3RhdHVzKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNz',
  'PSJmczEyIj4nICsgZXNjKHguY29udHJhY3RvciB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbnVtKHguY29zdCkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyAo',
  'eC5uZXh0RHVlID8gdGhEYXRlU2hvcnQoeC5uZXh0RHVlKSArCiAgICAgICAgICAgICAgICAoeC5kdWVJbkRheXMgIT0gbnVsbCA/ICc8ZGl2IGNsYXNzPSJmYWludCIgc3R5bGU9ImZvbnQtc2l6ZToxMXB4Ij4nICsgKHguZHVlSW5EYXlzPDAgPyAn4LmA4Lil4Lii',
  'ICcgKyAoLXguZHVlSW5EYXlzKSArICcg4Lin4Lix4LiZJyA6ICfguK3guLXguIEgJyArIHguZHVlSW5EYXlzICsgJyDguKfguLHguJknKSArICc8L2Rpdj4nIDogJycpCiAgICAgICAgICAgICAgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4n',
  'ICsgdGh1bWJzSHRtbCgoeC5waG90b1JlZnN8fFtdKS5jb25jYXQoeC5zbGlwUmVmc3x8W10pKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPjxkaXYgY2xhc3M9InQtYWN0aW9ucyI+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBp',
  'Y29uIiBvbmNsaWNrPVwnZm9ybUJ1aWxkaW5nKCcgKyBhdHRyKHgpICsgJylcJz7inI/vuI88L2J1dHRvbj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24gZGdyIiBvbmNsaWNrPSJkZWxCdWlsZGluZyhcJycgKyB4LmlkICsgJ1wn',
  'KSI+8J+XkTwvYnV0dG9uPicgKwogICAgICAgICAgICAnPC9kaXY+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgOiBlbXB0eUJveCgn4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ',
  '4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmD4LiZJyArIHllYXJMYWJlbCwgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZvcm1CdWlsZGluZyhudWxsKSI+KyDguYDguJ7guLTguYjguKHguIfguLLguJnguIvguYjguK3guKHguJXguLbg',
  'uIE8L2J1dHRvbj4nKSwKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgc20iIG9uY2xpY2s9ImZvcm1CdWlsZGluZyhudWxsKSI+KyDguYDguJ7guLTguYjguKHguIfguLLguJnguIvguYjguK3guKHguJXguLbguIE8L2J1dHRvbj4nLCB0cnVlKTsKCiAgICBy',
  'ZXR1cm4gaGVhZCArIHpvbmVzICsgY2hhcnRzICsgbGlzdDsKICB9Cn07CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgNykg4Lir4LmJ4Lit4LiH4Lie4Lix4LiBCiAgID09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMucm9vbXMgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsgcmV0dXJuIGNhbGxBcGkoJ3Jvb20ubGlzdCcpLnRoZW4oZnVuY3Rpb24oZmxvb3JzKXsgcmV0dXJuIHsg',
  'Zmxvb3JzOiBmbG9vcnMsIHllYXJzOiBbXSB9OyB9KTsgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIGZsYXQgPSBbXTsKICAgIGQuZmxvb3JzLmZvckVhY2goZnVuY3Rpb24oZil7IGYucm9vbXMuZm9yRWFjaChmdW5jdGlvbihyKXsgZmxhdC5wdXNo',
  'KHIpOyB9KTsgfSk7CiAgICB2YXIgb2NjID0gZmxhdC5maWx0ZXIoZnVuY3Rpb24ocil7IHJldHVybiByLnN0YXR1cyA9PT0gJ+C4oeC4teC4nOC4ueC5ieC5gOC4iuC5iOC4sic7IH0pLmxlbmd0aDsKCiAgICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJncmlkIGc0',
  'IG1iMTIiPicgKwogICAgICBrcGkoJ+C4q+C5ieC4reC4h+C4l+C4seC5ieC4h+C4q+C4oeC4lCcsIGZsYXQubGVuZ3RoICsgJyDguKvguYnguK3guIcnLCAnNSDguIrguLHguYnguJknLCAnYWNjZW50JykgKwogICAgICBrcGkoJ+C4oeC4teC4nOC4ueC5ieC5gOC4',
  'iuC5iOC4sicsIG9jYyArICcg4Lir4LmJ4Lit4LiHJywgcGN0KGZsYXQubGVuZ3RoID8gb2NjL2ZsYXQubGVuZ3RoKjEwMCA6IDApICsgJyDguK3guLHguJXguKPguLLguYDguILguYnguLLguJ7guLHguIEnLCAnZ29vZCcpICsKICAgICAga3BpKCfguKvguYnguK3g',
  'uIfguKfguYjguLLguIcnLCBmbGF0LmZpbHRlcihmdW5jdGlvbihyKXsgcmV0dXJuIHIuc3RhdHVzID09PSAn4Lin4LmI4Liy4LiHJzsgfSkubGVuZ3RoICsgJyDguKvguYnguK3guIcnLCAnJywgJ3dhcm4nKSArCiAgICAgIGtwaSgn4LiE4LmI4Liy4LmA4LiK4LmI',
  '4Liy4Lij4Lin4LihL+C5gOC4lOC4t+C4reC4mScsIGJhaHQoZmxhdC5yZWR1Y2UoZnVuY3Rpb24oYSxyKXsgcmV0dXJuIGEgKyAoTnVtYmVyKHIucmVudCl8fDApOyB9LCAwKSksICfguIjguLLguIHguKvguYnguK3guIfguJfguLXguYjguIHguKPguK3guIHguITg',
  'uYjguLLguYDguIrguYjguLLguYTguKfguYknKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgZ3JpZCA9IGNhcmQoJ/Cfmqog4Lic4Lix4LiH4Lir4LmJ4Lit4LiH4Lie4Lix4LiBJywgcm9vbUZsb29ycyhmbGF0LCBmdW5jdGlvbihyKXsKICAgICAgdmFyIGNscyA9',
  'IHIuc3RhdHVzID09PSAn4Lih4Li14Lic4Li54LmJ4LmA4LiK4LmI4LiyJyA/ICdzLW9rJyA6IChyLnN0YXR1cyA9PT0gJ+C4p+C5iOC4suC4hycgPyAncy1pbmZvJyA6ICdzLXdhcm4nKTsKICAgICAgcmV0dXJuIHsgY2xzOiBjbHMsIHN1YjogZXNjKHIudGVuYW50',
  'IHx8IHIuc3RhdHVzIHx8ICcnKSArIChyLnJlbnQgPyAnPGJyPicgKyBtb25leShyLnJlbnQpICsgJyDguL8nIDogJycpLAogICAgICAgICAgICAgICBvbmNsaWNrOiAnb3BlblJvb20oXCcnICsgci5yb29tICsgJ1wnKScgfTsKICAgIH0pLCAnPHNwYW4gY2xhc3M9',
  'ImZzMTIgbXV0ZWQiPuC4hOC4peC4tOC4geC4l+C4teC5iOC4q+C5ieC4reC4h+C5gOC4nuC4t+C5iOC4reC4lOC4ueC4m+C4o+C4sOC4p+C4seC4leC4tOC4l+C4seC5ieC4h+C4q+C4oeC4lOC4guC4reC4h+C4q+C5ieC4reC4h+C4meC4seC5ieC4mTwvc3Bhbj4n',
  'KTsKCiAgICByZXR1cm4gaGVhZCArIGdyaWQ7CiAgfQp9OwoKZnVuY3Rpb24gb3BlblJvb20ocm9vbSl7CiAgb3Blbk1vZGFsKCfwn5qqIOC4q+C5ieC4reC4hyAnICsgcm9vbSwgJzxkaXYgY2xhc3M9ImVtcHR5Ij48c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDg',
  'uIHguLPguKXguLHguIfguYLguKvguKXguJTigKY8L2Rpdj4nKTsKICBjYWxsQXBpKCdyb29tLnByb2ZpbGUnLCB7IHJvb206IHJvb20gfSkudGhlbihmdW5jdGlvbihwKXsKICAgIHZhciBpID0gcC5pbmZvOwogICAgdmFyIGJvZHkgPQogICAgICAnPGRpdiBjbGFz',
  'cz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAgICBrcGkoJ+C4quC4luC4suC4meC4sCcsIGkuc3RhdHVzIHx8ICfigJMnLCBlc2MoaS50ZW5hbnQgfHwgJycpKSArCiAgICAgICAga3BpKCfguKXguYnguLLguIfguYHguK3guKPguYwnLCBwLmFjQ291bnQgKyAnIOC4',
  'hOC4o+C4seC5ieC4hycsIHAubGFzdEFjID8gJ+C4peC5iOC4suC4quC4uOC4lCAnICsgdGhEYXRlKHAubGFzdEFjKSA6ICfguYTguKHguYjguKHguLXguJvguKPguLDguKfguLHguJXguLQnKSArCiAgICAgICAga3BpKCfguIfguLLguJnguIvguYjguK3guKEnLCBw',
  'LnJlcGFpckNvdW50ICsgJyDguIfguLLguJknLCAn4LiE4LmJ4Liy4LiHICcgKyBwLm9wZW5SZXBhaXJzLCBwLm9wZW5SZXBhaXJzID8gJ3dhcm4nIDogJycpICsKICAgICAgICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC4quC4sOC4quC4oScs',
  'IGJhaHQocC50b3RhbENvc3QpLCAn4LiL4LmI4Lit4LihICsg4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJykgKwogICAgICAnPC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJyb3cgbWIxMiI+JyArCiAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25j',
  'bGljaz1cJ2Nsb3NlTW9kYWwoKTtmb3JtUm9vbSgnICsgYXR0cihpKSArICcpXCc+4pyP77iPIOC5geC4geC5ieC5hOC4guC4guC5ieC4reC4oeC4ueC4peC4q+C5ieC4reC4hzwvYnV0dG9uPicgKwogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xp',
  'Y2s9ImNsb3NlTW9kYWwoKTtmb3JtUmVwYWlyKHtyb29tOlwnJyArIHJvb20gKyAnXCd9KSI+KyDguYHguIjguYnguIfguIvguYjguK3guKE8L2J1dHRvbj4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCk7Zm9y',
  'bUFjKHtyb29tOlwnJyArIHJvb20gKyAnXCd9KSI+KyDguKXguYnguLLguIfguYHguK3guKPguYw8L2J1dHRvbj4nICsKICAgICAgJzwvZGl2PicgKwogICAgICAocC5hc3NldHMubGVuZ3RoID8gJzxkaXYgY2xhc3M9ImNhcmQgbWIxMiI+PGRpdiBjbGFzcz0iY2Fy',
  'ZC1oIj48aDM+4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZ4LmD4LiZ4Lir4LmJ4Lit4LiHPC9oMz48L2Rpdj48ZGl2IGNsYXNzPSJjYXJkLWIiPicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOmF1',
  'dG8iPjx0aGVhZD48dHI+PHRoPuC4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4mTwvdGg+PHRoPuC4ouC4teC5iOC4q+C5ieC4rS/guKPguLjguYjguJk8L3RoPjx0aD7guJXguLTguJTguJXguLHguYnguIc8L3RoPjx0aD7guKrguJbguLLguJnguLA8L3RoPjwvdHI+',
  'PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgcC5hc3NldHMubWFwKGZ1bmN0aW9uKGEpewogICAgICAgICAgcmV0dXJuICc8dHI+PHRkPicgKyBlc2MoYS5uYW1lKSArICc8L3RkPjx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyhhLmJyYW5kfHwn4oCTJykgKyAnPC90',
  'ZD4nICsKICAgICAgICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgdGhEYXRlKGEuaW5zdGFsbERhdGUpICsgJzwvdGQ+PHRkPicgKyBzdGF0dXNCYWRnZShhLnN0YXR1cykgKyAnPC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9k',
  'eT48L3RhYmxlPjwvZGl2PjwvZGl2PjwvZGl2PicgOiAnJykgKwogICAgICAnPGgzIGNsYXNzPSJmczEzIG1iOCI+4Lib4Lij4Liw4Lin4Lix4LiV4Li04LiX4Lix4LmJ4LiH4Lir4Lih4LiUICgnICsgcC50aW1lbGluZS5sZW5ndGggKyAnKTwvaDM+JyArCiAgICAg',
  'IChwLnRpbWVsaW5lLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0bCI+JyArIHAudGltZWxpbmUubWFwKGZ1bmN0aW9uKGUpewogICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0idGwtaSI+PGRpdiBjbGFzcz0iZCI+JyArIHRoRGF0ZShlLmRhdGUpICsgJyDCtyAnICsg',
  'ZXNjKGUudHlwZSkgKyAnICcgKyBzdGF0dXNCYWRnZShlLnN0YXR1cykgKyAnPC9kaXY+JyArCiAgICAgICAgICAnPGRpdiBjbGFzcz0idCI+JyArIGVzYyhlLnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgICAgIChlLmRldGFpbCA/ICc8ZGl2IGNsYXNzPSJmczEy',
  'IG11dGVkIj4nICsgZXNjKGUuZGV0YWlsKSArICc8L2Rpdj4nIDogJycpICsKICAgICAgICAgIChlLmNvc3QgPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCI+JyArIGJhaHQoZS5jb3N0KSArICc8L2Rpdj4nIDogJycpICsKICAgICAgICAgIChlLnBob3RvcyAmJiBl',
  'LnBob3Rvcy5sZW5ndGggPyAnPGRpdiBjbGFzcz0ibXQ4Ij4nICsgdGh1bWJzSHRtbChlLnBob3RvcykgKyAnPC9kaXY+JyA6ICcnKSArCiAgICAgICAgJzwvZGl2Pic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4',
  'ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4m+C4o+C4sOC4p+C4seC4leC4tDwvZGl2PicpOwoKICAgIG9wZW5Nb2RhbCgn8J+aqiDguKvguYnguK3guIcgJyArIHJvb20gKyAnIMK3IOC4iuC4seC5ieC4mSAnICsgKGkuZmxvb3J8fCcnKSwgYm9keSwKICAgICAgJzxi',
  'dXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guJvguLTguJQ8L2J1dHRvbj4nLCB0cnVlKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7IGNsb3NlTW9kYWwoKTsgfSk7Cn0KCgovKiA9PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgOCkg4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4ouC4q+C4rSAo4Lij4Liy4Lii4LmA4LiU4Li34Lit4LiZKQogICA9PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLmZpbmFuY2UgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsKICAgIHJldHVybiBQcm9taXNlLmFsbChbCiAgICAgIGNhbGxBcGkoJ2ZpbmFuY2Uuc3VtbWFyeScs',
  'IHsgeWVhcjogUy55ZWFyIH0pLAogICAgICBjYWxsQXBpKCdmaW5hbmNlLmxpc3QnLCB7IHllYXI6IFMueWVhciwga2luZDogUy5wYXJhbXMua2luZCB8fCAnJyB9KQogICAgXSkudGhlbihmdW5jdGlvbihyKXsgdmFyIGQgPSByWzBdOyBkLml0ZW1zID0gclsxXTsg',
  'cmV0dXJuIGQ7IH0pOwogIH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJn',
  'cmlkIGc0IG1iMTIiPicgKwogICAgICBrcGkoJ+C4o+C4suC4ouC4o+C4seC4miAnICsgeWVhckxhYmVsLCBiYWh0KGQuaW5jb21lKSwgJ+C5gOC4ieC4peC4teC5iOC4oiAnICsgYmFodChkLmF2Z0luY29tZSkgKyAnL+C5gOC4lOC4t+C4reC4mScsICdnb29kJykg',
  'KwogICAgICBrcGkoJ+C4o+C4suC4ouC4iOC5iOC4suC4oiAnICsgeWVhckxhYmVsLCBiYWh0KGQuZXhwZW5zZSksICfguYDguInguKXguLXguYjguKIgJyArIGJhaHQoZC5hdmdFeHBlbnNlKSArICcv4LmA4LiU4Li34Lit4LiZJywgJ2JhZCcpICsKICAgICAga3Bp',
  'KCfguITguIfguYDguKvguKXguLfguK3guKrguLjguJfguJjguLQnLCBiYWh0KGQubmV0KSwgJ+C4reC4seC4leC4o+C4suC4geC4s+C5hOC4oyAnICsgcGN0KGQubWFyZ2luKSwgJ2FjY2VudCAnICsgKGQubmV0ID49IDAgPyAnZ29vZCcgOiAnYmFkJykpICsKICAg',
  'ICAga3BpKCfguJrguLHguJnguJfguLbguIHguYHguKXguYnguKcnLCBkLm1vbnRoc1dpdGhEYXRhICsgJyDguYDguJTguLfguK3guJknLCBkLmNvdW50ICsgJyDguKPguLLguKLguIHguLLguKMnKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgbWF4QmFyID0gTWF0',
  'aC5tYXguYXBwbHkobnVsbCwgZC5ieU1vbnRoLm1hcChmdW5jdGlvbihtKXsgcmV0dXJuIE1hdGgubWF4KG0uaW5jb21lLCBtLmV4cGVuc2UpOyB9KSkgfHwgMTsKICAgIHZhciBtb250aGx5ID0gY2FyZCgn8J+ThSDguKPguLLguKLguYDguJTguLfguK3guJkgwrcg',
  'JyArIHllYXJMYWJlbCwKICAgICAgJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICc8dGg+4LmA4LiU4Li34Lit4LiZPC90aD48dGggY2xhc3M9Im51bSI+4Lij4Liy4Lii4Lij4Lix4LiaPC90aD48dGggY2xhc3M9',
  'Im51bSI+4Lij4Liy4Lii4LiI4LmI4Liy4LiiPC90aD48dGggY2xhc3M9Im51bSI+4LiE4LiH4LmA4Lir4Lil4Li34LitPC90aD4nICsKICAgICAgJzx0aCBzdHlsZT0id2lkdGg6MzglIj7guYDguJfguLXguKLguJrguKPguLLguKLguKPguLHguJogLyDguKPguLLg',
  'uKLguIjguYjguLLguKI8L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgIGQuYnlNb250aC5tYXAoZnVuY3Rpb24obSl7CiAgICAgICAgdmFyIGJsYW5rID0gIW0uaW5jb21lICYmICFtLmV4cGVuc2U7CiAgICAgICAgcmV0dXJuICc8dHInICsgKGJsYW5r',
  'ID8gJyBzdHlsZT0ib3BhY2l0eTouNDUiJyA6ICcnKSArICc+JyArCiAgICAgICAgICAnPHRkPjxiPicgKyBtLmxhYmVsICsgJzwvYj48L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKG0uaW5jb21lID8gbW9uZXkobS5pbmNvbWUpIDogJ+KA',
  'kycpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAobS5leHBlbnNlID8gbW9uZXkobS5leHBlbnNlKSA6ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj48YiBzdHlsZT0iY29sb3I6JyArIChtLm5l',
  'dCA+PSAwID8gJ3ZhcigtLW9rKScgOiAndmFyKC0tZGFuZ2VyKScpICsgJyI+JyArCiAgICAgICAgICAgIChibGFuayA/ICfigJMnIDogbW9uZXkobS5uZXQpKSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICc8dGQ+JyArCiAgICAgICAgICAgICc8ZGl2IGNsYXNz',
  'PSJiYXItdHJhY2sgbWI4Ij48ZGl2IGNsYXNzPSJiYXItZmlsbCIgc3R5bGU9IndpZHRoOicgKyAobS5pbmNvbWUvbWF4QmFyKjEwMCkgKyAnJTtiYWNrZ3JvdW5kOnZhcigtLW9rKSI+PC9kaXY+PC9kaXY+JyArCiAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJiYXIt',
  'dHJhY2siPjxkaXYgY2xhc3M9ImJhci1maWxsIiBzdHlsZT0id2lkdGg6JyArIChtLmV4cGVuc2UvbWF4QmFyKjEwMCkgKyAnJTtiYWNrZ3JvdW5kOnZhcigtLWRhbmdlcikiPjwvZGl2PjwvZGl2PicgKwogICAgICAgICAgJzwvdGQ+PC90cj4nOwogICAgICB9KS5q',
  'b2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JywgJycsIHRydWUpOwoKICAgIHZhciBieUtpbmQgPSBjYXJkKCfwn6e+IOC5geC4ouC4geC4leC4suC4oeC4o+C4suC4ouC4geC4suC4oyDCtyAnICsgeWVhckxhYmVsLAogICAgICBiYXJDaGFydChkLmJ5',
  'S2luZC5tYXAoZnVuY3Rpb24oayl7IHJldHVybiB7IGxhYmVsOiBrLmtpbmQgKyAnICgnICsgay5jb3VudCArICcpJywgdG90YWw6IGsudG90YWwgfTsgfSksCiAgICAgICAgICAgICAgICdsYWJlbCcsICd0b3RhbCcsIGZ1bmN0aW9uKGkpeyByZXR1cm4gbW9uZXko',
  'aS50b3RhbCkgKyAnIOC4vyc7IH0pKTsKCiAgICB2YXIgYnlZZWFyID0gY2FyZCgn8J+TiiDguYDguJfguLXguKLguJrguKPguLLguKLguJvguLUnLAogICAgICBkLmJ5WWVhci5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9',
  'Im1pbi13aWR0aDphdXRvIj48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4Lib4Li1PC90aD48dGggY2xhc3M9Im51bSI+4Lij4Liy4Lii4Lij4Lix4LiaPC90aD48dGggY2xhc3M9Im51bSI+4Lij4Liy4Lii4LiI4LmI4Liy4LiiPC90aD48dGggY2xhc3M9Im51',
  'bSI+4LiE4LiH4LmA4Lir4Lil4Li34LitPC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIGQuYnlZZWFyLm1hcChmdW5jdGlvbih5KXsKICAgICAgICAgIHJldHVybiAnPHRyIG9uY2xpY2s9InNldFllYXJGcm9tVGFibGUoJyArIHkueWVhciArICcp',
  'IiBzdHlsZT0iY3Vyc29yOnBvaW50ZXIiPicgKwogICAgICAgICAgICAnPHRkPjxiPicgKyB5LnllYXIgKyAnPC9iPiA8c3BhbiBjbGFzcz0iZmFpbnQgZnMxMiI+LyAnICsgKHkueWVhcis1NDMpICsgJzwvc3Bhbj48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNs',
  'YXNzPSJudW0iPicgKyBtb25leSh5LmluY29tZSkgKyAnPC90ZD48dGQgY2xhc3M9Im51bSI+JyArIG1vbmV5KHkuZXhwZW5zZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj48YiBzdHlsZT0iY29sb3I6JyArICh5Lm5ldD49MD8ndmFy',
  'KC0tb2spJzondmFyKC0tZGFuZ2VyKScpICsgJyI+JyArIG1vbmV5KHkubmV0KSArICc8L2I+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C5hOC4',
  'oeC5iOC4oeC4teC4guC5ieC4reC4oeC4ueC4pTwvZGl2PicsICcnLCB0cnVlKTsKCiAgICB2YXIga2luZHMgPSAnPGRpdiBjbGFzcz0iY2hpcHMgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJjaGlwICcgKyAoIVMucGFyYW1zLmtpbmQ/J29uJzonJykg',
  'KyAnIiBvbmNsaWNrPSJzZXRQYXJhbShcJ2tpbmRcJyxcJ1wnKSI+4LiX4Li44LiB4Lij4Liy4Lii4LiB4Liy4LijPC9idXR0b24+JyArCiAgICAgIGQuYnlLaW5kLm1hcChmdW5jdGlvbihrKXsKICAgICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9ImNoaXAgJyAr',
  'IChTLnBhcmFtcy5raW5kPT09ay5raW5kPydvbic6JycpICsgJyIgb25jbGljaz0ic2V0UGFyYW0oXCdraW5kXCcsXCcnICsgZXNjKGsua2luZCkgKyAnXCcpIj4nICsKICAgICAgICAgICAgICAgZXNjKGsua2luZCkgKyAnICgnICsgay5jb3VudCArICcpPC9idXR0',
  'b24+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKCiAgICB2YXIgcm93cyA9IGQuaXRlbXM7CiAgICB2YXIgbGlzdCA9IGNhcmQoJ/Cfk5Ig4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Lix4LmJ4LiH4Lir4Lih4LiUIMK3ICcgKyB5ZWFyTGFiZWwgKyAnICgn',
  'ICsgcm93cy5sZW5ndGggKyAnKScsCiAgICAgIHJvd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guKfguLHguJnguJfguLXguYg8L3RoPjx0aD7guKPguLLguKLguIHguLLguKM8',
  'L3RoPjx0aCBjbGFzcz0ibnVtIj7guIjguLPguJnguKfguJnguYDguIfguLTguJk8L3RoPjx0aD7guKPguK3guJrguJrguLTguKU8L3RoPjx0aD7guIrguYjguK3guIfguJfguLLguIc8L3RoPicgKwogICAgICAgICc8dGg+4Liq4Lil4Li04LibPC90aD48dGg+4Lir',
  '4Lih4Liy4Lii4LmA4Lir4LiV4Li4PC90aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIHJvd3MubWFwKGZ1bmN0aW9uKHgpewogICAgICAgICAgdmFyIGluYyA9IHguZmxvdyA9PT0gJ+C4o+C4suC4ouC4o+C4seC4mic7CiAgICAgICAg',
  'ICByZXR1cm4gJzx0cj4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyB0aERhdGUoeC5kYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPjxiPicgKyBlc2MoeC5raW5kKSArICc8L2I+ICcgKyAoaW5jID8gJzxzcGFuIGNs',
  'YXNzPSJiIG9rIj7guKPguLLguKLguKPguLHguJo8L3NwYW4+JyA6ICc8c3BhbiBjbGFzcz0iYiBtdXRlIj7guKPguLLguKLguIjguYjguLLguKI8L3NwYW4+JykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj48YiBzdHlsZT0iY29sb3I6',
  'JyArIChpbmM/J3ZhcigtLW9rKSc6J3ZhcigtLWluayknKSArICciPicgKyAoaW5jPycrJzon4oiSJykgKyBtb25leSh4LmFtb3VudCwgMikgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MoeC5iaWxsTW9udGggfHwg',
  'J+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MoeC5jaGFubmVsIHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHguc2xpcFJlZnMpICsgJzwvdGQ+JyArCiAgICAg',
  'ICAgICAgICc8dGQgY2xhc3M9ImZzMTIgbXV0ZWQgY2xpcCI+JyArIGVzYyh4Lm5vdGUgfHwgJycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNt',
  'IGljb24iIG9uY2xpY2s9XCdmb3JtRmluYW5jZSgnICsgYXR0cih4KSArICcpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIGRnciIgb25jbGljaz0iZGVsRmluYW5jZShcJycgKyB4LmlkICsgJ1wn',
  'KSI+8J+XkTwvYnV0dG9uPicgKwogICAgICAgICAgICAnPC9kaXY+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgOiBlbXB0eUJveCgn4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lij4Liy4Lii',
  '4LiB4Liy4Lij4LmD4LiZJyArIHllYXJMYWJlbCwgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZvcm1GaW5hbmNlKG51bGwpIj4rIOC4muC4seC4meC4l+C4tuC4geC4o+C4suC4ouC4geC4suC4ozwvYnV0dG9uPicpLAogICAgICAnPGJ1dHRvbiBj',
  'bGFzcz0iYnRuIHByaSBzbSIgb25jbGljaz0iZm9ybUZpbmFuY2UobnVsbCkiPisg4Lia4Lix4LiZ4LiX4Li24LiB4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4ojwvYnV0dG9uPicsIHRydWUpOwoKICAgIHJldHVybiBoZWFkICsgbW9udGhs',
  'eSArICc8ZGl2IGNsYXNzPSJncmlkIGcyIG10MTIgbWIxMiI+JyArIGJ5S2luZCArIGJ5WWVhciArICc8L2Rpdj4nICsga2luZHMgKyBsaXN0OwogIH0KfTsKCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PQogICA5KSDguKPguLLguKLguIfguLLguJkgJiDguKrguLPguKPguK3guIfguILguYnguK3guKHguLnguKUKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5yZXBvcnRzID0g',
  'ewogIGxvYWQ6IGZ1bmN0aW9uKCl7CiAgICByZXR1cm4gUHJvbWlzZS5hbGwoWwogICAgICBjYWxsQXBpKCdyZXBvcnQuY29zdFBlclJvb20nLCB7IHllYXI6IFMueWVhciB9KSwKICAgICAgY2FsbEFwaSgncmVwb3J0LnVwY29taW5nJywgeyBkYXlzOiA5MCB9KSwK',
  'ICAgICAgY2FsbEFwaSgnYmFja3VwLnNoZWV0cycsIHt9KSwKICAgICAgY2FsbEFwaSgnc2hhcmUubGlua3MnLCB7fSkuY2F0Y2goZnVuY3Rpb24oKXsgcmV0dXJuIHt9OyB9KSwKICAgICAgY2FsbEFwaSgnYmFja3VwLmhpc3RvcnknLCB7fSkuY2F0Y2goZnVuY3Rp',
  'b24oKXsgcmV0dXJuIFtdOyB9KQogICAgXSkudGhlbihmdW5jdGlvbihyKXsKICAgICAgcmV0dXJuIHsgY29zdDogclswXSwgdXBjb21pbmc6IHJbMV0sIHNoZWV0czogclsyXSwgbGlua3M6IHJbM10gfHwge30sIGJhY2t1cHM6IHJbNF0gfHwgW10sIHllYXJzOiBb',
  'XSB9OwogICAgfSk7CiAgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKICAgIHZhciBjID0gZC5jb3N0OwogICAgdmFyIHRv',
  'cCA9IGMucm9vbXMuZmlsdGVyKGZ1bmN0aW9uKHIpeyByZXR1cm4gci50b3RhbCA+IDA7IH0pOwogICAgdmFyIG1heENvc3QgPSB0b3AubGVuZ3RoID8gdG9wWzBdLnRvdGFsIDogMTsKCiAgICB2YXIgdXBjb21pbmcgPSBjYXJkKCfwn5eT77iPIOC4m+C4j+C4tOC4',
  'l+C4tOC4meC4h+C4suC4meC4l+C4teC5iOC4geC4s+C4peC4seC4h+C4iOC4sOC4luC4tuC4hyAoOTAg4Lin4Lix4LiZKSDCtyAnICsgZC51cGNvbWluZy5sZW5ndGggKyAnIOC4h+C4suC4mScsCiAgICAgIGQudXBjb21pbmcubGVuZ3RoID8gJzxkaXYgY2xhc3M9',
  'ImFsaXN0Ij4nICsgZC51cGNvbWluZy5tYXAoZnVuY3Rpb24odSl7CiAgICAgICAgdmFyIGx2bCA9IHUuZGF5c0xlZnQgPCAwID8gJ2RhbmdlcicgOiAodS5kYXlzTGVmdCA8PSA3ID8gJ3dhcm4nIDogJ2luZm8nKTsKICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9',
  'ImFsaSBsLScgKyBsdmwgKyAnIiBvbmNsaWNrPSJnbyhcJycgKyBqdW1wUGFnZSh1Lm1vZHVsZSkgKyAnXCcpIj4nICsKICAgICAgICAgICc8ZGl2IGNsYXNzPSJpYyI+JyArIHUuaWNvbiArICc8L2Rpdj48ZGl2PicgKwogICAgICAgICAgJzxkaXYgY2xhc3M9InR0',
  'Ij4nICsgZXNjKHUudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAgJzxkaXYgY2xhc3M9ImRkIj4nICsgdGhEYXRlKHUuZGF0ZSkgKyAnIMK3ICcgKwogICAgICAgICAgICAodS5kYXlzTGVmdCA8IDAgPyAn4LmA4Lil4Lii4LiB4Liz4Lir4LiZ4LiUICcgKyAo',
  'LXUuZGF5c0xlZnQpICsgJyDguKfguLHguJknIDogKHUuZGF5c0xlZnQgPT09IDAgPyAn4Lin4Lix4LiZ4LiZ4Li14LmJJyA6ICfguK3guLXguIEgJyArIHUuZGF5c0xlZnQgKyAnIOC4p+C4seC4mScpKSArCiAgICAgICAgICAgICh1LmRldGFpbCA/ICcgwrcgJyAr',
  'IGVzYyh1LmRldGFpbCkgOiAnJykgKyAnPC9kaXY+PC9kaXY+PC9kaXY+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JyA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj7wn4yk77iPPC9kaXY+4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ',
  '4LiZ4Lix4LiU4Lir4Lih4Liy4Lii4LmD4LiZIDkwIOC4p+C4seC4meC4guC5ieC4suC4h+C4q+C4meC5ieC4sjwvZGl2PicsICcnLCB0cnVlKTsKCiAgICB2YXIgY29zdENhcmQgPSBjYXJkKCfwn4+377iPIOC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC4',
  'quC4sOC4quC4oeC4o+C4suC4ouC4q+C5ieC4reC4hyDCtyAnICsgeWVhckxhYmVsLAogICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMyBtYjEyIj4nICsKICAgICAgICBrcGkoJ+C4o+C4p+C4oeC4l+C4uOC4geC4q+C5ieC4reC4hycsIGJhaHQoYy50b3RhbCksICcn',
  'KSArCiAgICAgICAga3BpKCfguYDguInguKXguLXguYjguKLguJXguYjguK3guKvguYnguK3guIcnLCBiYWh0KGMuYXZlcmFnZSksICcnKSArCiAgICAgICAga3BpKCfguKvguYnguK3guIfguJfguLXguYjguYPguIrguYnguIjguYjguLLguKLguKrguLnguIfguKrg',
  'uLjguJQnLCB0b3AubGVuZ3RoID8gKCfguKvguYnguK3guIcgJyArIHRvcFswXS5yb29tKSA6ICfigJMnLCB0b3AubGVuZ3RoID8gYmFodCh0b3BbMF0udG90YWwpIDogJycpICsKICAgICAgJzwvZGl2PicgKwogICAgICAodG9wLmxlbmd0aCA/ICc8ZGl2IGNsYXNz',
  'PSJ0dyI+PHRhYmxlIGNsYXNzPSJ0Ij48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4Lir4LmJ4Lit4LiHPC90aD48dGggY2xhc3M9Im51bSI+4LiH4Liy4LiZ4LiL4LmI4Lit4LihPC90aD48dGggY2xhc3M9Im51bSI+4LiE4LmI4Liy4LiL4LmI4Lit4LihPC90',
  'aD48dGggY2xhc3M9Im51bSI+4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMPC90aD4nICsKICAgICAgICAnPHRoIGNsYXNzPSJudW0iPuC4guC4reC4h+C5gOC4guC5ieC4suC4q+C5ieC4reC4hzwvdGg+PHRoIGNsYXNzPSJudW0iPuC4o+C4p+C4oTwvdGg+PHRoIHN0',
  'eWxlPSJ3aWR0aDoyNiUiPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICB0b3AubWFwKGZ1bmN0aW9uKHIpewogICAgICAgICAgcmV0dXJuICc8dHIgb25jbGljaz0ib3BlblJvb20oXCcnICsgci5yb29tICsgJ1wnKSIgc3R5bGU9ImN1cnNvcjpw',
  'b2ludGVyIj4nICsKICAgICAgICAgICAgJzx0ZD48Yj4nICsgci5yb29tICsgJzwvYj4gPHNwYW4gY2xhc3M9ImZhaW50IGZzMTIiPuC4iuC4seC5ieC4mSAnICsgci5mbG9vciArICc8L3NwYW4+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4n',
  'ICsgci5qb2JzICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChyLnJlcGFpciA/IG1vbmV5KHIucmVwYWlyKSA6ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAoci5hYyA/IG1vbmV5',
  'KHIuYWMpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChyLnB1cmNoYXNlID8gbW9uZXkoci5wdXJjaGFzZSkgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj48Yj4nICsg',
  'bW9uZXkoci50b3RhbCkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0iYmFyLXRyYWNrIj48ZGl2IGNsYXNzPSJiYXItZmlsbCIgc3R5bGU9IndpZHRoOicgKyAoci50b3RhbC9tYXhDb3N0KjEwMCkgKyAnJSI+PC9kaXY+PC9kaXY+',
  'PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC4l+C4teC5',
  'iOC4muC4seC4meC4l+C4tuC4geC5hOC4p+C5ieC4o+C4suC4ouC4q+C5ieC4reC4hzxkaXYgY2xhc3M9ImZzMTIgbXQ4Ij7guYPguKrguYggIuC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oiIg4LmD4LiZ4LiH4Liy4LiZ4LiL4LmI4Lit4LihL+C4peC5ieC4',
  'suC4h+C5geC4reC4o+C5jCDguKvguKPguLfguK3guKPguLDguJrguLjguKvguYnguK3guIfguYPguJnguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcg4LmB4Lil4LmJ4Lin4LiV4Lix4Lin4LmA4Lil4LiC4LiI4Liw4LiC4Li24LmJ4LiZ4LiX',
  '4Li14LmI4LiZ4Li14LmIPC9kaXY+PC9kaXY+JykpOwoKICAgIHZhciBiYWNrdXAgPSBjYXJkKCfwn5K+IOC4quC4s+C4o+C4reC4h+C5geC4peC4sOC4geC4ueC5ieC4hOC4t+C4meC4guC5ieC4reC4oeC4ueC4pScsCiAgICAgICc8cCBjbGFzcz0iZnMxMyBtdXRl',
  'ZCI+4LiC4LmJ4Lit4Lih4Li54Lil4LiX4Lix4LmJ4LiH4Lir4Lih4LiU4Lit4Lii4Li54LmI4LmD4LiZ4Lij4Liw4Lia4Lia4LiZ4Li14LmJIOKAlCDguITguKfguKPguJTguLLguKfguJnguYzguYLguKvguKXguJTguKrguLPguKPguK3guIfguYTguKfguYnguYDg',
  'uJTguLfguK3guJnguKXguLDguITguKPguLHguYnguIcgJyArCiAgICAgICfguYTguJ/guKXguYwgSlNPTiDguJnguLPguIHguKXguLHguJrguYDguILguYnguLLguKPguLDguJrguJrguYTguJTguYkg4Liq4LmI4Lin4LiZIENTViDguYDguJvguLTguJTguYPguJkg',
  'RXhjZWwg4Lir4Lij4Li34LitIEdvb2dsZSBTaGVldHMg4LmE4LiU4LmJ4LmA4Lil4LiiPC9wPicgKwogICAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPicgKwogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJkb0V4cG9ydEpzb24oKSI+',
  '4qyH77iPIOC4lOC4suC4p+C4meC5jOC5guC4q+C4peC4lOC4quC4s+C4o+C4reC4h+C4l+C4seC5ieC4h+C4q+C4oeC4lCAoSlNPTik8L2J1dHRvbj4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJkb0ltcG9ydEpzb24oKSI+4qyG77iP',
  'IOC4geC4ueC5ieC4hOC4t+C4meC4iOC4suC4geC5hOC4n+C4peC5jOC4quC4s+C4o+C4reC4hzwvYnV0dG9uPicgKwogICAgICAnPC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIG1i',
  'OCI+4Liq4LmI4LiH4Lit4Lit4LiB4LmA4Lib4LmH4LiZIENTViDguYHguKLguIHguJXguLLguKPguLLguIc8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImNoaXBzIj4nICsgZC5zaGVldHMubWFwKGZ1bmN0aW9uKG4pewogICAgICAgIHJldHVybiAnPGJ1dHRv',
  'biBjbGFzcz0iY2hpcCIgb25jbGljaz0iZG9FeHBvcnRDc3YoXCcnICsgZXNjKG4pICsgJ1wnKSI+JyArIGVzYyhzaGVldExhYmVsKG4pKSArICc8L2J1dHRvbj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nKTsKCiAgICB2YXIgc2hhcmUgPSAoY2FuRWRp',
  'dCgpICYmIGQubGlua3MgJiYgZC5saW5rcy52aWV3VXJsKSA/IGNhcmQoJ/CflJcg4Lil4Li04LiH4LiB4LmM4LmA4LiC4LmJ4Liy4LmD4LiK4LmJ4LiH4Liy4LiZJywKICAgICAgJzxkaXYgY2xhc3M9ImYgbWIxMiI+PGxhYmVsPvCflJEg4Lil4Li04LiH4LiB4LmM',
  '4LiC4Lit4LiH4LiE4Li44LiTICjguYHguIHguYnguYTguILguILguYnguK3guKHguLnguKXguYTguJTguYkg4oCUIOC4reC4ouC5iOC4suC4quC5iOC4h+C4leC5iOC4rSk8L2xhYmVsPicgKwogICAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgcmVhZG9ubHkgdmFs',
  'dWU9IicgKyBlc2MoZC5saW5rcy5hZG1pblVybCkgKyAnIiBvbmNsaWNrPSJ0aGlzLnNlbGVjdCgpIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7wn5GAIOC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jCAo4LmA4Lib4Li04LiU4LiU4Li5',
  '4LmE4LiU4LmJ4Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinIOKAlCDguKrguYjguIfguYPguKvguYnguYPguITguKPguIHguYfguYTguJTguYkpPC9sYWJlbD4nICsKICAgICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJzaGFyZVVybCIgcmVhZG9ubHkg',
  'dmFsdWU9IicgKyBlc2MoZC5saW5rcy52aWV3VXJsKSArICciIG9uY2xpY2s9InRoaXMuc2VsZWN0KCkiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPicgKwogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJjb3B5',
  'U2hhcmUoKSI+8J+TiyDguITguLHguJTguKXguK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYw8L2J1dHRvbj4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIGRnciIgb25jbGljaz0iZG9Sb3RhdGVTaGFyZSgpIj7wn5SBIOC4reC4reC4geC4peC4',
  'tOC4h+C4geC5jOC5geC4iuC4o+C5jOC5g+C4q+C4oeC5iDwvYnV0dG9uPicgKwogICAgICAnPC9kaXY+JyArCiAgICAgICc8cCBjbGFzcz0iZnMxMiBtdXRlZCBtdDEyIj7guITguJnguJfguLXguYjguYDguJvguLTguJTguKXguLTguIfguIHguYzguYHguIrguKPg',
  'uYzguIjguLDguYDguKvguYfguJnguILguYnguK3guKHguLnguKXguJfguLHguYnguIfguKvguKHguJTguYHguJrguJrguK3guYjguLLguJnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcgJyArCiAgICAgICfguYTguKHguYjguJXguYnguK3guIfguKHguLXg',
  'uJrguLHguI3guIrguLUgR29vZ2xlIOC5geC4peC4sOC5hOC4oeC5iOC5gOC4q+C5h+C4mSBHb29nbGUgU2hlZXQg4LiC4Lit4LiH4LiE4Li44LiTIMK3ICcgKwogICAgICAn4LiW4LmJ4Liy4Lil4Li04LiH4LiB4LmM4Lir4Lil4Li44LiU4LmD4Lir4LmJ4LiB4LiU',
  'ICLguK3guK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYzguYPguKvguKHguYgiIOC4peC4tOC4h+C4geC5jOC5gOC4lOC4tOC4oeC4iOC4sOC5g+C4iuC5ieC5hOC4oeC5iOC5hOC4lOC5ieC4l+C4seC4meC4l+C4tTwvcD4nKSA6ICcnOwoKICAgIHZhciBk',
  'cml2ZSA9IGNhbkVkaXQoKSA/IGNhcmQoJ+KYge+4jyDguKrguLPguKPguK3guIfguK3guLHguJXguYLguJnguKHguLHguJXguLTguYPguJkgR29vZ2xlIERyaXZlICgnICsgZC5iYWNrdXBzLmxlbmd0aCArICcg4LiK4Li44LiUKScsCiAgICAgICc8cCBjbGFzcz0i',
  'ZnMxMyBtdXRlZCI+4Lij4Liw4Lia4Lia4LmA4LiB4LmH4Lia4LmE4Lif4Lil4LmM4Liq4Liz4Lij4Lit4LiH4LmE4Lin4LmJ4LmD4LiZ4LmC4Lif4Lil4LmA4LiU4Lit4Lij4LmMICLguKrguLPguKPguK3guIfguILguYnguK3guKHguLnguKUiIOC4muC4meC5hOC4',
  'lOC4o+C4n+C5jOC4guC4reC4h+C4hOC4uOC4kyAnICsKICAgICAgJ+C4leC4seC5ieC4h+C5g+C4q+C5ieC4l+C4s+C4reC4seC4leC5guC4meC4oeC4seC4leC4tOC4l+C4uOC4geC4p+C4seC4meC5hOC4lOC5ieC4iOC4suC4geC5gOC4oeC4meC4ueC5g+C4meC4',
  'iuC4teC4lTwvcD4nICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBtdDEyIj48YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImRvQmFja3VwTm93KCkiPvCfkr4g4Liq4Liz4Lij4Lit4LiH4LmA4LiU4Li14LmL4Lii4Lin4LiZ4Li14LmJPC9idXR0b24+PC9kaXY+',
  'JyArCiAgICAgIChkLmJhY2t1cHMubGVuZ3RoID8gJzxkaXYgY2xhc3M9ImhyIj48L2Rpdj48ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOmF1dG8iPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guYTguJ/guKXguYw8',
  'L3RoPjx0aD7guYDguKfguKXguLI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guILguJnguLLguJQ8L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgZC5iYWNrdXBzLnNsaWNlKDAsMTApLm1hcChmdW5jdGlvbihiKXsKICAgICAgICAgIHJldHVybiAnPHRy',
  'Pjx0ZCBjbGFzcz0iZnMxMiI+PGEgaHJlZj0iJyArIGVzYyhiLnVybCkgKyAnIiB0YXJnZXQ9Il9ibGFuayI+JyArIGVzYyhiLm5hbWUpICsgJzwvYT48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKGIuYXQpICsgJzwvdGQ+JyAr',
  'CiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSBmczEyIj4nICsgTWF0aC5yb3VuZChiLnNpemUvMTAyNCkgKyAnIEtCPC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicgOiAnJykpIDogJyc7CgogICAgcmV0',
  'dXJuIHVwY29taW5nICsgJzxkaXYgY2xhc3M9Im10MTIiPicgKyBjb3N0Q2FyZCArICc8L2Rpdj4nICsKICAgICAgICAgICAoc2hhcmUgPyAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIHNoYXJlICsgJzwvZGl2PicgOiAnJykgKwogICAgICAgICAgICc8ZGl2IGNsYXNz',
  'PSJtdDEyIj4nICsgYmFja3VwICsgJzwvZGl2PicgKwogICAgICAgICAgIChkcml2ZSA/ICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgZHJpdmUgKyAnPC9kaXY+JyA6ICcnKTsKICB9Cn07CgpmdW5jdGlvbiBzaGVldExhYmVsKG4pewogIHJldHVybiAoewogICAgRGVi',
  'dHM6J+C4geC5ieC4reC4meC4q+C4meC4teC5iScsIERlYnRQYXltZW50czon4Lij4Liy4Lii4LiB4Liy4Lij4LiK4Liz4Lij4Liw4Lir4LiZ4Li14LmJJywgUHVyY2hhc2VzOifguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcnLCBSb29tczon',
  '4LiX4Liw4LmA4Lia4Li14Lii4LiZ4Lir4LmJ4Lit4LiHJywKICAgIEFjU2VydmljZTon4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJywgUm9vbVJlcGFpcnM6J+C4i+C5iOC4reC4oeC5geC4i+C4oeC4q+C5ieC4reC4hycsIEJ1aWxkaW5nUmVwYWlyczon4LiL4LmI',
  '4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiBJywKICAgIFJvb21Bc3NldHM6J+C4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4meC4q+C5ieC4reC4hycsIEZpbmFuY2U6J+C4o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKInLCBTZXR0aW5nczon4LiV',
  '4Lix4LmJ4LiH4LiE4LmI4LiyJywgQWN0aXZpdHlMb2c6J+C4m+C4o+C4sOC4p+C4seC4leC4tOC4geC4suC4o+C5geC4geC5ieC5hOC4gicKICB9KVtuXSB8fCBuOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT0KICAg4LiV4Lix4Lin4LiK4LmI4Lin4Lii4Lin4Liy4LiU4LiL4LmJ4LizIOC5hgogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCmZ1bmN0aW9uIGtwaShsYWJlbCwgdmFs',
  'dWUsIGNhcCwgY2xzKXsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImtwaSAnICsgKGNsc3x8JycpICsgJyI+JyArCiAgICAnPGRpdiBjbGFzcz0ibGJsIj4nICsgZXNjKGxhYmVsKSArICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJ2YWwiPicgKyB2YWx1ZSArICc8',
  'L2Rpdj4nICsKICAgIChjYXAgPyAnPGRpdiBjbGFzcz0iY2FwIj4nICsgY2FwICsgJzwvZGl2PicgOiAnJykgKyAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gY2FyZCh0aXRsZSwgYm9keSwgYWN0aW9ucywgZmx1c2gpewogIHJldHVybiAnPGRpdiBjbGFzcz0iY2FyZCI+',
  'JyArCiAgICAodGl0bGUgPyAnPGRpdiBjbGFzcz0iY2FyZC1oIj48aDM+JyArIHRpdGxlICsgJzwvaDM+JyArIChhY3Rpb25zID8gJzxkaXYgY2xhc3M9InNwIj4nICsgYWN0aW9ucyArICc8L2Rpdj4nIDogJycpICsgJzwvZGl2PicgOiAnJykgKwogICAgJzxkaXYg',
  'Y2xhc3M9ImNhcmQtYicgKyAoZmx1c2ggPyAnIGZsdXNoJyA6ICcnKSArICciPicgKyBib2R5ICsgJzwvZGl2PjwvZGl2Pic7Cn0KCi8qKiDguKfguLLguJTguJzguLHguIfguKvguYnguK3guIfguYHguJrguYjguIfguJXguLLguKHguIrguLHguYnguJkg4oCUIGRl',
  'Y29yYXRlKHJvb20pIC0+IHtjbHMsIHN1Yiwgb25jbGlja30gKi8KZnVuY3Rpb24gcm9vbUZsb29ycyhyb29tcywgZGVjb3JhdGUpewogIHZhciBieUZsb29yID0ge307CiAgcm9vbXMuZm9yRWFjaChmdW5jdGlvbihyKXsKICAgIHZhciBmID0gci5mbG9vciB8fCBO',
  'dW1iZXIoU3RyaW5nKHIucm9vbSkuY2hhckF0KDApKTsKICAgIChieUZsb29yW2ZdID0gYnlGbG9vcltmXSB8fCBbXSkucHVzaChyKTsKICB9KTsKICB2YXIgZmxvb3JzID0gT2JqZWN0LmtleXMoYnlGbG9vcikuc29ydCgpOwogIHJldHVybiAnPGRpdiBjbGFzcz0i',
  'Zmxvb3JzIj4nICsgZmxvb3JzLm1hcChmdW5jdGlvbihmKXsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0iZmxvb3IiPjxkaXYgY2xhc3M9ImZsb29yLXRhZyI+PGI+JyArIGYgKyAnPC9iPuC4iuC4seC5ieC4mTwvZGl2PjxkaXYgY2xhc3M9InJvb21zIj4nICsKICAg',
  'ICAgYnlGbG9vcltmXS5tYXAoZnVuY3Rpb24ocil7CiAgICAgICAgdmFyIGQgPSBkZWNvcmF0ZShyKTsKICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9InJvb20gJyArIGQuY2xzICsgJyIgb25jbGljaz0iJyArIGQub25jbGljayArICciPicgKwogICAgICAgICAg',
  'JzxzcGFuIGNsYXNzPSJkb3QiPjwvc3Bhbj48ZGl2IGNsYXNzPSJubyI+JyArIGVzYyhyLnJvb20pICsgJzwvZGl2PicgKwogICAgICAgICAgJzxkaXYgY2xhc3M9InN0Ij4nICsgZC5zdWIgKyAnPC9kaXY+PC9kaXY+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9k',
  'aXY+PC9kaXY+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwp9CgovKiog4LmD4Liq4LmIIG9iamVjdCDguKXguIfguYPguJkgb25jbGljayBhdHRyaWJ1dGUg4LmE4LiU4LmJ4Lit4Lii4LmI4Liy4LiH4Lib4Lil4Lit4LiU4Lig4Lix4LiiICovCmZ1bmN0aW9u',
  'IGF0dHIob2JqKXsKICB2YXIgY2xlYW4gPSB7fTsKICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goZnVuY3Rpb24oayl7CiAgICBpZiAoay5pbmRleE9mKCdfJykgPT09IDAgfHwgL1JlZnMkLy50ZXN0KGspIHx8IGsgPT09ICdyZWNvcmRzJyB8fCBrID09PSAnd2Fy',
  'cmFudHknKSByZXR1cm47CiAgICBjbGVhbltrXSA9IG9ialtrXTsKICB9KTsKICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoY2xlYW4pLnJlcGxhY2UoLyYvZywnJmFtcDsnKS5yZXBsYWNlKC8nL2csJyYjMzk7JykucmVwbGFjZSgvIi9nLCcmcXVvdDsnKTsKfQo8L3Nj',
  'cmlwdD4KPHNjcmlwdD4KLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIFNldHRpbmdzLmh0bWwg4oCUIOC4q+C4meC5ieC4suC4leC4seC5ieC4h+C4hOC5iOC4siDCtyDguJjguLXguKEgwrcg4Lia',
  '4Lix4LiN4LiK4Li14Lic4Li54LmJ4LmD4LiK4LmJIMK3IOC4reC4uOC4m+C4geC4o+C4k+C5jAogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4LiY4Li14Lih',
  '4Liq4Lin4LmI4Liy4LiHIC8g4Lih4Li34LiUIC0tLS0tLS0tLS0tLS0tLS0gKi8KCnZhciBMU19USEVNRSA9ICdtY29ybmVyLnRoZW1lJzsKdmFyIFRIRU1FUyA9IFsKICB7IGlkOiAn4LiV4Liy4Lih4LmA4LiE4Lij4Li34LmI4Lit4LiHJywgaWM6ICfwn4yXJywg',
  'aGludDogJ+C4quC4peC4seC4muC4leC4suC4oeC4geC4suC4o+C4leC4seC5ieC4h+C4hOC5iOC4suC4guC4reC4h+C4reC4uOC4m+C4geC4o+C4k+C5jCcgfSwKICB7IGlkOiAn4Liq4Lin4LmI4Liy4LiHJywgICAgICBpYzogJ+KYgO+4jycsIGhpbnQ6ICfguJ7g',
  'uLfguYnguJnguILguLLguKcg4Lit4LmI4Liy4LiZ4LiH4LmI4Liy4Lii4LiB4Lil4Liy4LiH4LmB4LiU4LiUJyB9LAogIHsgaWQ6ICfguKHguLfguJQnLCAgICAgICAgaWM6ICfwn4yZJywgaGludDogJ+C4nuC4t+C5ieC4meC5gOC4guC5ieC4oSDguKrguJrguLLg',
  'uKLguJXguLLguJXguK3guJnguIHguKXguLLguIfguITguLfguJknIH0KXTsKCi8qKgogKiDguJfguLLguJjguLXguKHguKXguIfguKvguJnguYnguLLguYDguKfguYfguJrguJfguLHguJnguJfguLUKICog4LiV4Lix4Lin4LmB4Lib4Lij4Liq4Li14LiX4Lix4LmJ',
  '4LiH4Lir4Lih4LiU4LiZ4Li04Lii4Liy4Lih4LmE4Lin4LmJIDMg4LiK4Lix4LmJ4LiZ4LmD4LiZIFN0eWxlLmh0bWwg4LmB4Lil4LmJ4LinIOC4leC4o+C4h+C4meC4teC5ieC5geC4hOC5iOC4leC4tOC4lOC4m+C5ieC4suC4ouC4muC4reC4geC4p+C5iOC4suC5',
  'g+C4iuC5ieC4iuC4seC5ieC4meC5hOC4q+C4mQogKi8KZnVuY3Rpb24gYXBwbHlUaGVtZShuYW1lKXsKICB2YXIgcm9vdCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDsKICBpZiAobmFtZSA9PT0gJ+C4quC4p+C5iOC4suC4hycpIHJvb3Quc2V0QXR0cmlidXRl',
  'KCdkYXRhLXRoZW1lJywgJ2xpZ2h0Jyk7CiAgZWxzZSBpZiAobmFtZSA9PT0gJ+C4oeC4t+C4lCcpIHJvb3Quc2V0QXR0cmlidXRlKCdkYXRhLXRoZW1lJywgJ2RhcmsnKTsKICBlbHNlIHJvb3QucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXRoZW1lJyk7ICAgICAgIC8v',
  'IOC4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hyA9IOC4m+C4peC5iOC4reC4ouC5g+C4q+C5iSBwcmVmZXJzLWNvbG9yLXNjaGVtZSDguJXguLHguJTguKrguLTguJkKICB2YXIgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RoZW1lQnRuJyk7CiAg',
  'aWYgKGJ0bikgewogICAgdmFyIHQgPSBUSEVNRVMuZmlsdGVyKGZ1bmN0aW9uKHgpeyByZXR1cm4geC5pZCA9PT0gbmFtZTsgfSlbMF0gfHwgVEhFTUVTWzBdOwogICAgYnRuLnRleHRDb250ZW50ID0gdC5pYzsKICAgIGJ0bi50aXRsZSA9ICfguJjguLXguKE6ICcg',
  'KyB0LmlkICsgJyAo4LiB4LiU4LmA4Lie4Li34LmI4Lit4Liq4Lil4Lix4LiaKSc7CiAgfQp9CgpmdW5jdGlvbiBjdXJyZW50VGhlbWUoKXsKICByZXR1cm4gbHNHZXQoTFNfVEhFTUUpIHx8IChTLmJvb3QgJiYgUy5ib290LnNldHRpbmdzICYmIFMuYm9vdC5zZXR0',
  'aW5ncy50aGVtZSkgfHwgJ+C4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hyc7Cn0KCi8qKiDguJXguLHguYnguIfguJjguLXguKHguYHguKXguLDguIjguLPguYTguKfguYkg4oCUIOC4nOC4ueC5ieC4lOC4ueC5geC4peC4iOC4sOC4luC4ueC4geC4muC4seC4',
  'meC4l+C4tuC4geC5gOC4m+C5h+C4meC4hOC5iOC4suC4leC4seC5ieC4h+C4leC5ieC4meC4guC4reC4h+C4o+C4sOC4muC4muC4lOC5ieC4p+C4oiAqLwpmdW5jdGlvbiBzZXRUaGVtZShuYW1lLCBxdWlldCl7CiAgbHNTZXQoTFNfVEhFTUUsIG5hbWUpOwogIGFw',
  'cGx5VGhlbWUobmFtZSk7CiAgaWYgKFMuYm9vdCAmJiBTLmJvb3QuaXNBZG1pbikgewogICAgY2FsbEFwaSgnc2V0dGluZ3Muc2F2ZScsIHsgdmFsdWVzOiB7IHRoZW1lOiBuYW1lIH0gfSkuY2F0Y2goZnVuY3Rpb24oKXsgLyog4LmA4LiB4LmH4Lia4LmD4LiZ4LmA',
  '4LiE4Lij4Li34LmI4Lit4LiH4LiB4LmH4Lie4LitICovIH0pOwogIH0KICBpZiAoIXF1aWV0KSB0b2FzdCgn4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LmA4Lib4LmH4LiZ4LiY4Li14LihJyArIChuYW1lID09PSAn4LiV4Liy4Lih4LmA4LiE4Lij4Li34LmI4Lit4LiH',
  'JyA/ICfguJXguLLguKHguYDguITguKPguLfguYjguK3guIcnIDogbmFtZSksICdvaycpOwogIGlmIChTLnBhZ2UgPT09ICdzZXR0aW5ncycpIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKfQoKLyoqIOC4m+C4uOC5iOC4oeC4muC4meC5geC4luC4muC4q+C4seC4pyDi',
  'gJQg4Lin4LiZ4Liq4Lin4LmI4Liy4LiHIOKGkiDguKHguLfguJQg4oaSIOC4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hyAqLwpmdW5jdGlvbiBjeWNsZVRoZW1lKCl7CiAgdmFyIG9yZGVyID0gWyfguKrguKfguYjguLLguIcnLCAn4Lih4Li34LiUJywgJ+C4',
  'leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hyddOwogIHZhciBpID0gb3JkZXIuaW5kZXhPZihjdXJyZW50VGhlbWUoKSk7CiAgc2V0VGhlbWUob3JkZXJbKGkgKyAxKSAlIG9yZGVyLmxlbmd0aF0pOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4q+C4meC5ieC4',
  'suC4leC4seC5ieC4h+C4hOC5iOC4siAtLS0tLS0tLS0tLS0tLS0tICovCgpST1VURVMuc2V0dGluZ3MgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsKICAgIHJldHVybiBQcm9taXNlLmFsbChbCiAgICAgIGNhbGxBcGkoJ3NldHRpbmdzLmxpc3QnLCB7fSksCiAgICAg',
  'IGNhbGxBcGkoJ2F1dGguZGV2aWNlcycsIHt9KS5jYXRjaChmdW5jdGlvbigpeyByZXR1cm4gW107IH0pLAogICAgICAoUy5ib290ICYmIFMuYm9vdC5pc0FkbWluKSA/IGNhbGxBcGkoJ3VzZXIubGlzdCcsIHt9KS5jYXRjaChmdW5jdGlvbigpeyByZXR1cm4gW107',
  'IH0pIDogUHJvbWlzZS5yZXNvbHZlKG51bGwpLAogICAgICAoUy5ib290ICYmIFMuYm9vdC5pc0FkbWluKSA/IGNhbGxBcGkoJ3NoYXJlLmxpbmtzJywge30pLmNhdGNoKGZ1bmN0aW9uKCl7IHJldHVybiB7fTsgfSkgOiBQcm9taXNlLnJlc29sdmUoe30pCiAgICBd',
  'KS50aGVuKGZ1bmN0aW9uKHIpewogICAgICByZXR1cm4geyBzZXR0aW5nczogclswXSwgZGV2aWNlczogclsxXSB8fCBbXSwgdXNlcnM6IHJbMl0sIGxpbmtzOiByWzNdIHx8IHt9LCB5ZWFyczogW10gfTsKICAgIH0pOwogIH0sCiAgcmVuZGVyOiBmdW5jdGlvbihk',
  'KXsKICAgIHJldHVybiAnJyArCiAgICAgIHNldHRpbmdzQWNjb3VudENhcmQoZCkgKwogICAgICBzZXR0aW5nc1RoZW1lQ2FyZCgpICsKICAgICAgKGQuc2V0dGluZ3MuY2FuRWRpdCA/IHNldHRpbmdzR3JvdXBzSHRtbChkLnNldHRpbmdzKSA6IHNldHRpbmdzUmVh',
  'ZE9ubHlOb3RlKCkpICsKICAgICAgLy8g4LmA4LiJ4Lie4Liy4Liw4Lic4Li54LmJ4LiU4Li54LmB4Lil4LiX4Li14LmI4LmA4Lir4LmH4LiZ4Liq4Lit4LiH4Liq4LmI4Lin4LiZ4LiZ4Li14LmJIOKAlCDguJXguLHguKfguIHguLLguKPguYzguJTguYDguJvguYfg',
  'uJnguITguJnguJXguLHguJTguKrguLTguJnguYPguIjguYDguK3guIfguKfguYjguLLguIjguLDguYHguKrguJTguIfguK3guLDguYTguKMKICAgICAgLy8g4LmA4Lie4Lij4Liy4Liw4Lir4LiZ4LmJ4Liy4LiV4Lix4Lin4Lit4Lii4LmI4Liy4LiH4LmB4Lia4Lia',
  '4LmE4Lif4Lil4LmM4LmA4LiU4Li14Lii4Lin4LmE4Lih4LmI4Lih4Li14Lia4Lix4LiN4LiK4Li14Lic4Li54LmJ4LmD4LiK4LmJ4LmD4Lir4LmJ4LmB4Liq4LiU4LiHIOC5geC4leC5iOC4ouC4seC4h+C4reC4ouC4suC4geC4muC4reC4geC4nOC4ueC5ieC5g+C4',
  'iuC5ieC4p+C5iOC4suC4oeC4teC4reC4sOC5hOC4o+C4muC5ieC4suC4hwogICAgICAoaXNBZG1pbk5vdygpID8gc2V0dGluZ3NVc2Vyc0NhcmQoZC51c2VycykgKyBzZXR0aW5nc1NoYXJlQ2FyZChkLmxpbmtzKSA6ICcnKTsKICB9Cn07CgovKiAtLS0tIOC4muC4',
  'seC4jeC4iuC4teC4guC4reC4h+C4ieC4seC4mSAtLS0tICovCgpmdW5jdGlvbiBzZXR0aW5nc0FjY291bnRDYXJkKGQpewogIHZhciBtZSA9IEFVVEgubWUgfHwge307CiAgdmFyIGRldmljZXMgPSBkLmRldmljZXMgfHwgW107CiAgcmV0dXJuIGNhcmQoJ/CfkaQg',
  '4Lia4Lix4LiN4LiK4Li14LiC4Lit4LiH4LiJ4Lix4LiZJywKICAgICc8ZGl2IGNsYXNzPSJncmlkIGcyIG1iMTIiPicgKwogICAgICBrcGkoJ+C5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4meC5g+C4meC4iuC4t+C5iOC4rScsIGVzYyhtZS5uYW1lIHx8IG1l',
  'LnVzZXJuYW1lIHx8ICfigJMnKSwgZXNjKG1lLnVzZXJuYW1lID8gJ0AnICsgbWUudXNlcm5hbWUgOiAobWUudmlhIHx8ICcnKSkpICsKICAgICAga3BpKCfguKrguLTguJfguJjguLTguYzguIHguLLguKPguYPguIrguYnguIfguLLguJknLCBlc2MobWUucm9sZSB8',
  'fCAn4oCTJyksCiAgICAgICAgICBtZS5jYW5FZGl0ID8gJ+C5gOC4nuC4tOC5iOC4oSDguYHguIHguYnguYTguIIg4LmB4Lil4Liw4Lil4Lia4LiC4LmJ4Lit4Lih4Li54Lil4LmE4LiU4LmJJyA6ICfguYDguJvguLTguJTguJTguLnguYTguJTguYnguK3guKLguYjg',
  'uLLguIfguYDguJTguLXguKLguKcnKSArCiAgICAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0icm93Ij4nICsKICAgICAgKG1lLnVzZXJuYW1lID8gJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iZm9ybUNoYW5nZVBhc3N3b3JkKCkiPvCflJEg4LmA4Lib',
  '4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZPC9idXR0b24+JyA6ICcnKSArCiAgICAgIChtZS51c2VybmFtZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImZvcm1TZXRQaW4oKSI+8J+UoiAnICsKICAgICAgICAoQVVUSC5kZXZp',
  'Y2UgPyAn4LiV4Lix4LmJ4LiHIFBJTiDguYPguKvguKHguYjguJrguJnguYDguITguKPguLfguYjguK3guIfguJnguLXguYknIDogJ+C4leC4seC5ieC4hyBQSU4g4Liq4Liz4Lir4Lij4Lix4Lia4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJJykgKyAnPC9i',
  'dXR0b24+JyA6ICcnKSArCiAgICAgIChBVVRILmRldmljZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4gZGdyIiBvbmNsaWNrPSJmb3JnZXRUaGlzRGV2aWNlKCkiPuC4peC4miBQSU4g4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJPC9idXR0b24+JyA6ICcnKSAr',
  'CiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNvbmZpcm1Mb2dvdXQoKSI+8J+aqiDguK3guK3guIHguIjguLLguIHguKPguLDguJrguJo8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nICsKICAgIChkZXZpY2VzLmxlbmd0aAogICAgICA/ICc8ZGl2',
  'IGNsYXNzPSJociI+PC9kaXY+PGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtYjgiPuC4reC4uOC4m+C4geC4o+C4k+C5jOC4l+C4teC5iOC4leC4seC5ieC4hyBQSU4g4LmE4Lin4LmJICgnICsgZGV2aWNlcy5sZW5ndGggKyAnKTwvZGl2PicgKwogICAgICAgICc8ZGl2',
  'IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOmF1dG8iPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guK3guLjguJvguIHguKPguJPguYw8L3RoPjx0aD7guJXguLHguYnguIfguYDguKHguLfguYjguK08L3RoPjx0aD7guYPg',
  'uIrguYnguKXguYjguLLguKrguLjguJQ8L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgZGV2aWNlcy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgICAgICByZXR1cm4gJzx0cj48dGQ+JyArIGVzYyh4LmRldmljZSkgKyAnPC90ZD4nICsKICAgICAgICAg',
  'ICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIHRoRGF0ZVNob3J0KFN0cmluZyh4LmNyZWF0ZWRBdCkuc2xpY2UoMCwxMCkpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyB0aERhdGVTaG9ydChTdHJpbmcoeC5sYXN0U2Vlbikuc2xp',
  'Y2UoMCwxMCkpICsgJzwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPjxidXR0b24gY2xhc3M9ImJ0biBkZ3Igc20iIG9uY2xpY2s9ImRvRm9yZ2V0',
  'QWxsRGV2aWNlcygpIj7guKLguIHguYDguKXguLTguIEgUElOIOC4l+C4uOC4geC5gOC4hOC4o+C4t+C5iOC4reC4hzwvYnV0dG9uPjwvZGl2PicKICAgICAgOiAnJykpOwp9CgpmdW5jdGlvbiBkb0ZvcmdldEFsbERldmljZXMoKXsKICBjb25maXJtQWN0aW9uKCfg',
  'uKLguIHguYDguKXguLTguIEgUElOIOC4muC4meC4l+C4uOC4geC5gOC4hOC4o+C4t+C5iOC4reC4h+C5g+C4iuC5iOC5hOC4q+C4oSDigJQg4LiX4Li44LiB4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiI4Liw4LiV4LmJ4Lit4LiH4Lil4LmH4Lit4LiB4Lit4Li04LiZ',
  '4LiU4LmJ4Lin4Lii4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmIJywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2F1dGguZm9yZ2V0QWxsRGV2aWNlcycsIHt9KS50aGVuKGZ1bmN0aW9uKG4pewogICAgICBzYXZlRGV2aWNlKCcnKTsKICAgICAg',
  'dG9hc3QoJ+C4ouC4geC5gOC4peC4tOC4gSBQSU4g4LmB4Lil4LmJ4LinICcgKyBuICsgJyDguYDguITguKPguLfguYjguK3guIcnLCAnb2snKTsKICAgICAgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVz',
  'c2FnZSB8fCBlLCAnZXJyJyk7IH0pOwogIH0pOwp9CgovKiAtLS0tIOC4mOC4teC4oSAtLS0tICovCgpmdW5jdGlvbiBzZXR0aW5nc1RoZW1lQ2FyZCgpewogIHZhciBjdXIgPSBjdXJyZW50VGhlbWUoKTsKICByZXR1cm4gY2FyZCgn8J+OqCDguJjguLXguKHguKrg',
  'uLXguKvguJnguYnguLLguIjguK0nLAogICAgJzxkaXYgY2xhc3M9InRoZW1lLXBpY2siPicgKyBUSEVNRVMubWFwKGZ1bmN0aW9uKHQpewogICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9InRoZW1lLW9wdCcgKyAodC5pZCA9PT0gY3VyID8gJyBvbicgOiAnJykg',
  'KyAnIiBvbmNsaWNrPSJzZXRUaGVtZShcJycgKyB0LmlkICsgJ1wnKSI+JyArCiAgICAgICAgJzxzcGFuIGNsYXNzPSJpYyI+JyArIHQuaWMgKyAnPC9zcGFuPicgKwogICAgICAgICc8Yj4nICsgZXNjKHQuaWQpICsgJzwvYj4nICsKICAgICAgICAnPHNwYW4gY2xh',
  'c3M9ImhpbnQiPicgKyBlc2ModC5oaW50KSArICc8L3NwYW4+JyArCiAgICAgICc8L2J1dHRvbj4nOwogICAgfSkuam9pbignJykgKyAnPC9kaXY+JyArCiAgICAnPHAgY2xhc3M9ImZzMTIgbXV0ZWQgbXQxMiI+4LiY4Li14Lih4LiI4Liz4LmB4Lii4LiB4Lij4Liy',
  '4Lii4LmA4LiE4Lij4Li34LmI4Lit4LiHIOC5gOC4m+C4peC4teC5iOC4ouC4meC4l+C4teC5iOC4meC4teC5iOC4q+C4o+C4t+C4reC4geC4lOC4m+C4uOC5iOC4oeC4o+C4ueC4m+C4nuC4o+C4sOC4reC4suC4l+C4tOC4leC4ouC5jC/guJ7guKPguLDguIjguLHg',
  'uJnguJfguKPguYzguKHguLjguKHguILguKfguLLguJrguJnguIHguYfguYTguJTguYknICsKICAgIChTLmJvb3QgJiYgUy5ib290LmlzQWRtaW4gPyAnIMK3IOC4hOC5iOC4suC4l+C4teC5iOC4nOC4ueC5ieC4lOC4ueC5geC4peC5gOC4peC4t+C4reC4geC4iOC4',
  'sOC5gOC4m+C5h+C4meC4hOC5iOC4suC4leC4seC5ieC4h+C4leC5ieC4meC5g+C4q+C5ieC5gOC4hOC4o+C4t+C5iOC4reC4h+C4l+C4teC5iOC4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4leC4seC5ieC4hycgOiAnJykgKyAnPC9wPicpOwp9CgovKiAtLS0t',
  'IOC4geC4peC4uOC5iOC4oeC4hOC5iOC4suC4leC4seC5ieC4h+C4hOC5iOC4siAtLS0tICovCgpmdW5jdGlvbiBzZXR0aW5nc1JlYWRPbmx5Tm90ZSgpewogIHJldHVybiBjYXJkKCfimpnvuI8g4LiB4Liy4Lij4LiV4Lix4LmJ4LiH4LiE4LmI4Liy4Lij4Liw4Lia',
  '4LiaJywKICAgICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj7wn5SSPC9kaXY+4LmA4LiJ4Lie4Liy4Liw4Lic4Li54LmJ4LiU4Li54LmB4Lil4LmA4LiX4LmI4Liy4LiZ4Lix4LmJ4LiZ4LiX4Li14LmI4LmB4LiB4LmJ4LiB4Liy4Lij4LiV4Lix',
  '4LmJ4LiH4LiE4LmI4Liy4Lij4Liw4Lia4Lia4LmE4LiU4LmJPC9kaXY+Jyk7Cn0KCmZ1bmN0aW9uIHNldHRpbmdzR3JvdXBzSHRtbChzKXsKICByZXR1cm4gcy5ncm91cHMubWFwKGZ1bmN0aW9uKGcpewogICAgcmV0dXJuIGNhcmQoZy5pY29uICsgJyAnICsgZy5n',
  'cm91cCwKICAgICAgJzxkaXYgY2xhc3M9ImZncmlkIj4nICsgZy5pdGVtcy5tYXAoc2V0dGluZ0ZpZWxkSHRtbCkuam9pbignJykgKyAnPC9kaXY+Jyk7CiAgfSkuam9pbignJykgKwogIGNhcmQoJ/Cfkr4g4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4LiV4Lix',
  '4LmJ4LiH4LiE4LmI4LiyJywKICAgICc8cCBjbGFzcz0iZnMxMyBtdXRlZCI+JyArIGVzYyhzLnNlY3JldE5vdGUpICsgJzwvcD4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJz',
  'YXZlU2V0dGluZ3NGb3JtKCkiPuC4muC4seC4meC4l+C4tuC4geC4l+C4seC5ieC4h+C4q+C4oeC4lDwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJsb2FkKCkiPuC4ouC4geC5gOC4peC4tOC4geC4geC4suC4o+C5geC4geC5',
  'ieC5hOC4gjwvYnV0dG9uPicgKwogICAgJzwvZGl2PicpOwp9CgpmdW5jdGlvbiBzZXR0aW5nRmllbGRIdG1sKGl0KXsKICB2YXIgaWQgPSAnc18nICsgaXQua2V5OwogIHZhciBpbm5lcjsKICBpZiAoaXQucmVhZE9ubHkpIHsKICAgIGlubmVyID0gJzxkaXYgY2xh',
  'c3M9ImlucCIgc3R5bGU9ImJhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKTtjdXJzb3I6ZGVmYXVsdCI+JyArIGVzYyhpdC52YWx1ZSkgKyAnPC9kaXY+JzsKICB9IGVsc2UgaWYgKGl0LnR5cGUgPT09ICdzZWxlY3QnKSB7CiAgICAvLyDguJ3guLHguYjguIfguYDg',
  'uIvguLTguKPguYzguJ/guYDguKfguK3guKPguYzguKrguYjguIfguKHguLLguYDguJvguYfguJkge3ZhbHVlLGxhYmVsfSDguYDguKrguKHguK0g4oCUIOC4hOC5iOC4suC4l+C4teC5iOC5gOC4geC5h+C4muC4geC4seC4muC4guC5ieC4reC4hOC4p+C4suC4oeC4',
  'l+C4teC5iOC5gOC4q+C5h+C4meC4reC4suC4iOC4hOC4meC4peC4sOC4reC4seC4mQogICAgaW5uZXIgPSAnPHNlbGVjdCBjbGFzcz0ic2VsIiBpZD0iJyArIGlkICsgJyI+JyArIChpdC5vcHRpb25zIHx8IFtdKS5tYXAoZnVuY3Rpb24obyl7CiAgICAgIHJldHVy',
  'biAnPG9wdGlvbiB2YWx1ZT0iJyArIGVzYyhvLnZhbHVlKSArICciJyArIChvLnZhbHVlID09PSBpdC52YWx1ZSA/ICcgc2VsZWN0ZWQnIDogJycpICsKICAgICAgICAgICAgICc+JyArIGVzYyhvLmxhYmVsKSArICc8L29wdGlvbj4nOwogICAgfSkuam9pbignJykg',
  'KyAnPC9zZWxlY3Q+JzsKICB9IGVsc2UgaWYgKGl0LnR5cGUgPT09ICdtdWx0aWxpbmUnKSB7CiAgICBpbm5lciA9ICc8dGV4dGFyZWEgY2xhc3M9InRhIiBpZD0iJyArIGlkICsgJyI+JyArIGVzYyhpdC52YWx1ZSkgKyAnPC90ZXh0YXJlYT4nOwogIH0gZWxzZSBp',
  'ZiAoaXQudHlwZSA9PT0gJ251bWJlcicpIHsKICAgIGlubmVyID0gJzxpbnB1dCB0eXBlPSJudW1iZXIiIGNsYXNzPSJpbnAiIGlkPSInICsgaWQgKyAnIiB2YWx1ZT0iJyArIGVzYyhpdC52YWx1ZSkgKyAnIiBpbnB1dG1vZGU9ImRlY2ltYWwiPic7CiAgfSBlbHNl',
  'IHsKICAgIGlubmVyID0gJzxpbnB1dCB0eXBlPSJ0ZXh0IiBjbGFzcz0iaW5wIiBpZD0iJyArIGlkICsgJyIgdmFsdWU9IicgKyBlc2MoaXQudmFsdWUpICsgJyI+JzsKICB9CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJmJyArIChpdC50eXBlID09PSAnbXVsdGlsaW5l',
  'JyA/ICcgZnVsbCcgOiAnJykgKyAnIj4nICsKICAgICc8bGFiZWwgZm9yPSInICsgaWQgKyAnIj4nICsgZXNjKGl0LmxhYmVsKSArICc8L2xhYmVsPicgKyBpbm5lciArCiAgICAoaXQubm90ZSA/ICc8ZGl2IGNsYXNzPSJoaW50Ij4nICsgZXNjKGl0Lm5vdGUpICsg',
  'JzwvZGl2PicgOiAnJykgKyAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gc2F2ZVNldHRpbmdzRm9ybSgpewogIHZhciB2YWxzID0ge307CiAgdmFyIGRhdGEgPSBTLmNhY2hlLnNldHRpbmdzOwogIGlmICghZGF0YSkgcmV0dXJuOwogIGRhdGEuc2V0dGluZ3MuZ3JvdXBz',
  'LmZvckVhY2goZnVuY3Rpb24oZyl7CiAgICBnLml0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXQpewogICAgICBpZiAoaXQucmVhZE9ubHkpIHJldHVybjsKICAgICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NfJyArIGl0LmtleSk7CiAgICAgIGlm',
  'IChlbCkgdmFsc1tpdC5rZXldID0gZWwudmFsdWU7CiAgICB9KTsKICB9KTsKICBjYWxsQXBpKCdzZXR0aW5ncy5zYXZlJywgeyB2YWx1ZXM6IHZhbHMgfSkudGhlbihmdW5jdGlvbihyKXsKICAgIGlmICh2YWxzLnRoZW1lKSB7IGxzU2V0KExTX1RIRU1FLCB2YWxz',
  'LnRoZW1lKTsgYXBwbHlUaGVtZSh2YWxzLnRoZW1lKTsgfQogICAgdG9hc3Qoci5zYXZlZCA/ICfguJrguLHguJnguJfguLbguIHguYHguKXguYnguKcgJyArIHIuc2F2ZWQgKyAnIOC4o+C4suC4ouC4geC4suC4oycgOiAn4LmE4Lih4LmI4Lih4Li14Lit4Liw4LmE',
  '4Lij4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LmB4Lib4Lil4LiHJywgJ29rJyk7CiAgICAvLyDguITguYjguLLguJrguLLguIfguJXguLHguKcgKOC4o+C4reC4muC4o+C4teC5gOC4n+C4o+C4iiDguIrguLfguYjguK3guK3guLLguITguLLguKMpIOC4oeC4teC4nOC4',
  'peC4geC4seC4muC4l+C4seC5ieC4h+C4q+C4meC5ieC4siDguIjguLbguIfguYLguKvguKXguJTguYPguKvguKHguYjguJfguLHguYnguIfguIrguLjguJQKICAgIHJldHVybiBjYWxsQXBpKCdhcHAuYm9vdHN0cmFwJykudGhlbihmdW5jdGlvbihiKXsgUy5ib290',
  'ID0gYjsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9KTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlIHx8IGUsICdlcnInKTsgfSk7Cn0KCi8qIC0tLS0g4LiI4Lix4LiU4LiB4Liy4Lij4Lic4Li54LmJ4LmD4LiK4LmJICjguJzguLnguYng',
  'uJTguLnguYHguKXguYDguJfguYjguLLguJnguLHguYnguJkpIC0tLS0gKi8KCmZ1bmN0aW9uIGlzQWRtaW5Ob3coKXsKICByZXR1cm4gISEoUy5ib290ICYmIFMuYm9vdC5pc0FkbWluKTsKfQoKZnVuY3Rpb24gc2V0dGluZ3NVc2Vyc0NhcmQodXNlcnMpewogIGlm',
  'ICghdXNlcnMpIHJldHVybiAnJzsKICByZXR1cm4gY2FyZCgn8J+RpSDguJzguLnguYnguYPguIrguYnguYPguJnguKPguLDguJrguJogKCcgKyB1c2Vycy5sZW5ndGggKyAnKScsCiAgICAnPHAgY2xhc3M9ImZzMTMgbXV0ZWQiPuC5geC4iOC4geC4iuC4t+C5iOC4',
  'reC4nOC4ueC5ieC5g+C4iuC5ieC5geC4peC4sOC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C5ieC4hOC4meC4reC4t+C5iOC4meC5gOC4guC5ieC4suC4oeC4suC4lOC4ueC4q+C4o+C4t+C4reC4iuC5iOC4p+C4ouC5geC4geC5ieC4guC5ieC4reC4oeC4',
  'ueC4peC5hOC4lOC5iSAnICsKICAgICfguJXguLHguYnguIfguKrguLTguJfguJjguLTguYzguYHguKLguIHguKPguLLguKLguITguJkg4LmB4Lil4Liw4Lij4Liw4LiH4Lix4Lia4LmE4LiU4LmJ4LiX4Li44LiB4LmA4Lih4Li34LmI4LitPC9wPicgKwogICAgJzxk',
  'aXYgY2xhc3M9InR3IG10MTIiPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsKICAgICAgJzx0aD7guIrguLfguYjguK3guJzguLnguYnguYPguIrguYk8L3RoPjx0aD7guIrguLfguYjguK3guJfguLXguYjguYHguKrguJTguIc8L3RoPjx0aD7guKrguLTg',
  'uJfguJjguLTguYw8L3RoPjx0aD7guKrguJbguLLguJnguLA8L3RoPjx0aD7guYDguILguYnguLLguKXguYjguLLguKrguLjguJQ8L3RoPicgKwogICAgICAnPHRoIGNsYXNzPSJudW0iPuC4reC4uOC4m+C4geC4o+C4k+C5jDwvdGg+PHRoPjwvdGg+PC90cj48L3Ro',
  'ZWFkPjx0Ym9keT4nICsKICAgIHVzZXJzLm1hcChmdW5jdGlvbih1KXsKICAgICAgdmFyIG1lTm93ID0gKEFVVEgubWUgJiYgQVVUSC5tZS51c2VybmFtZSkgPT09IHUudXNlcm5hbWU7CiAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICc8dGQ+PGI+JyArIGVz',
  'Yyh1LnVzZXJuYW1lKSArICc8L2I+JyArIChtZU5vdyA/ICcgPHNwYW4gY2xhc3M9ImIgaW5mbyI+4LiE4Li44LiTPC9zcGFuPicgOiAnJykgKyAnPC90ZD4nICsKICAgICAgICAnPHRkPicgKyBlc2ModS5uYW1lIHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAg',
  'ICc8dGQ+JyArIHJvbGVCYWRnZSh1LnJvbGUpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZD4nICsgc3RhdHVzQmFkZ2UodS5zdGF0dXMpICsgKHUubG9ja2VkID8gJyA8c3BhbiBjbGFzcz0iYiBkZ3IiPuC4luC4ueC4geC4peC5h+C4reC4geC4iuC4seC5iOC4p+C4',
  'hOC4o+C4suC4pzwvc3Bhbj4nIDogJycpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArICh1Lmxhc3RMb2dpbiA/IHRoRGF0ZVNob3J0KFN0cmluZyh1Lmxhc3RMb2dpbikuc2xpY2UoMCwxMCkpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAg',
  'ICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHUuZGV2aWNlcyB8fCAwKSArICc8L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9InQtYWN0aW9ucyI+JyArCiAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJmb3JtVXNlcignICsgYXR0',
  'cih1KSArICcpIj7guYHguIHguYnguYTguII8L2J1dHRvbj4nICsKICAgICAgICAgIChtZU5vdyA/ICcnIDogJzxidXR0b24gY2xhc3M9ImJ0biBzbSBkZ3IiIG9uY2xpY2s9ImRlbFVzZXIoXCcnICsgZXNjKHUudXNlcm5hbWUpICsgJ1wnKSI+4Lil4LiaPC9idXR0',
  'b24+JykgKwogICAgICAgICc8L3RkPjwvdHI+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgc20iIG9uY2xpY2s9ImZvcm1Vc2VyKCkiPisg4LmA4Lie4Li04LmI4Lih4Lic4Li5',
  '4LmJ4LmD4LiK4LmJPC9idXR0b24+Jyk7Cn0KCmZ1bmN0aW9uIHJvbGVCYWRnZShyb2xlKXsKICB2YXIgY2xzID0gcm9sZSA9PT0gJ+C4nOC4ueC5ieC4lOC4ueC5geC4pScgPyAnb2snIDogKHJvbGUgPT09ICfguYHguIHguYnguYTguILguYTguJTguYknID8gJ2lu',
  'Zm8nIDogJ211dGUnKTsKICByZXR1cm4gJzxzcGFuIGNsYXNzPSJiICcgKyBjbHMgKyAnIj4nICsgZXNjKHJvbGUpICsgJzwvc3Bhbj4nOwp9CgovLyDguKvguKHguLLguKLguYDguKvguJXguLg6IOC5g+C4iuC5iSBhdHRyKCkg4LiV4Lix4Lin4LmA4LiU4Li14Lii',
  '4Lin4LiB4Lix4Lia4LiX4Li14LmIIFZpZXdzLmh0bWwg4Lib4Lij4Liw4LiB4Liy4Lio4LmE4Lin4LmJCi8vIOC5gOC4hOC4ouC4m+C4o+C4sOC4geC4suC4qOC4iuC4t+C5iOC4reC4i+C5ieC4s+C5hOC4p+C5ieC4leC4o+C4h+C4meC4teC5ieC4hOC4o+C4seC5',
  'ieC4h+C4q+C4meC4tuC5iOC4hyDguYHguKXguYnguKfguYTguJvguJfguLHguJrguILguK3guIfguYDguJTguLTguKHguIjguJnguJvguLjguYjguKHguYHguIHguYnguYTguILguJfguLHguYnguIfguKPguLDguJrguJrguJ7guLHguIcKLy8gKOC4n+C4reC4o+C5',
  'jOC4oeC4guC4tuC5ieC4meC4p+C5iOC4suC4hyDguYHguKXguLDguIHguJTguJrguLHguJnguJfguLbguIHguIHguKXguLLguKLguYDguJvguYfguJnguKrguKPguYnguLLguIfguKPguLLguKLguIHguLLguKPguYPguKvguKHguYjguYHguJfguJnguIHguLLguKPg',
  'uYHguIHguYnguILguK3guIfguYDguJTguLTguKEpCgpmdW5jdGlvbiBmb3JtVXNlcihqc29uKXsKICB2YXIgdSA9IGpzb24gPyAodHlwZW9mIGpzb24gPT09ICdzdHJpbmcnID8gSlNPTi5wYXJzZShqc29uKSA6IGpzb24pIDoge307CiAgdmFyIGlzTmV3ID0gIXUu',
  'dXNlcm5hbWU7CgogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiBpc05ldyA/ICfguYDguJ7guLTguYjguKHguJzguLnguYnguYPguIrguYnguYPguKvguKHguYgnIDogJ+C5geC4geC5ieC5hOC4guC4nOC4ueC5ieC5g+C4iuC5iSAnICsgdS51c2VybmFtZSwKICAgIGFj',
  'dGlvbjogJ3VzZXIuc2F2ZScsCiAgICByZWNvcmQ6IE9iamVjdC5hc3NpZ24oeyBpZDogaXNOZXcgPyAnJyA6IHUudXNlcm5hbWUsIHJvbGU6ICfguJTguLnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcnLCBzdGF0dXM6ICfguYPguIrguYnguIfguLLguJkn',
  'IH0sIHUpLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oid1c2VybmFtZScsIGxhYmVsOifguIrguLfguYjguK3guJzguLnguYnguYPguIrguYkgKOC4oOC4suC4qeC4suC4reC4seC4h+C4geC4pOC4qSknLCByZXF1aXJlZDppc05ldywgcGg6J+C5gOC4iuC5iOC4',
  'mSBzb21jaGFpJywKICAgICAgICBoaW50OiBpc05ldyA/ICdhLXogMC05IC4gXyAtIOC4ouC4suC4pyAz4oCTMjQg4LiV4Lix4LinIMK3IOC5gOC4m+C4peC4teC5iOC4ouC4meC4oOC4suC4ouC4q+C4peC4seC4h+C5hOC4oeC5iOC5hOC4lOC5iScgOiAn4LmA4Lib',
  '4Lil4Li14LmI4Lii4LiZ4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmE4Lih4LmI4LmE4LiU4LmJJyB9LAogICAgICB7IGtleTonbmFtZScsIGxhYmVsOifguIrguLfguYjguK3guJfguLXguYjguYHguKrguJTguIcnLCByZXF1aXJlZDp0cnVlLCBwaDon',
  '4LmA4LiK4LmI4LiZIOC4quC4oeC4iuC4suC4oicgfSwKICAgICAgeyBrZXk6J3JvbGUnLCBsYWJlbDon4Liq4Li04LiX4LiY4Li04LmM4LiB4Liy4Lij4LmD4LiK4LmJ4LiH4Liy4LiZJywgdHlwZTonc2VsZWN0JywgYmxhbms6ZmFsc2UsIHJlcXVpcmVkOnRydWUs',
  'CiAgICAgICAgb3B0aW9uczpbJ+C4lOC4ueC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pycsJ+C5geC4geC5ieC5hOC4guC5hOC4lOC5iScsJ+C4nOC4ueC5ieC4lOC4ueC5geC4pSddLAogICAgICAgIGhpbnQ6J+C4lOC4ueC4reC4ouC5iOC4suC4h+C5gOC4',
  'lOC4teC4ouC4pyA9IOC5gOC4m+C4tOC4lOC4lOC4ueC5hOC4lOC5ieC4l+C4uOC4geC4q+C4meC5ieC4siDCtyDguYHguIHguYnguYTguILguYTguJTguYkgPSDguYDguJ7guLTguYjguKEv4LmB4LiB4LmJL+C4peC4muC4guC5ieC4reC4oeC4ueC4pSDCtyDguJzg',
  'uLnguYnguJTguLnguYHguKUgPSDguIjguLHguJTguIHguLLguKPguJzguLnguYnguYPguIrguYnguYHguKXguLDguIHguLLguKPguJXguLHguYnguIfguITguYjguLLguYTguJTguYnguJTguYnguKfguKInIH0sCiAgICAgIHsga2V5OidwYXNzd29yZCcsIGxhYmVs',
  'OiBpc05ldyA/ICfguKPguKvguLHguKrguJzguYjguLLguJnguYDguKPguLTguYjguKHguJXguYnguJknIDogJ+C4leC4seC5ieC4h+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iCAo4LmA4Lin4LmJ4LiZ4Lin4LmI4Liy4LiHID0g4LmE4Lih4LmI',
  '4LmA4Lib4Lil4Li14LmI4Lii4LiZKScsCiAgICAgICAgcmVxdWlyZWQ6aXNOZXcsIHBoOifguK3guKLguYjguLLguIfguJnguYnguK3guKIgOCDguJXguLHguKfguK3guLHguIHguKnguKMnLAogICAgICAgIGhpbnQ6J+C4iOC4lOC5hOC4p+C5ieC4quC5iOC4h+C5',
  'g+C4q+C5ieC5gOC4iOC5ieC4suC4leC4seC4pyDigJQg4Lij4Liw4Lia4Lia4LmA4LiB4LmH4Lia4LmB4Lia4Lia4LmA4LiC4LmJ4Liy4Lij4Lir4Lix4LiqIOC5gOC4m+C4tOC4lOC4lOC4ueC4ouC5ieC4reC4meC4q+C4peC4seC4h+C5hOC4oeC5iOC5hOC4lOC5',
  'iScgfSwKICAgICAgeyBrZXk6J211c3RDaGFuZ2UnLCBsYWJlbDon4LmD4Lir4LmJ4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LiV4Lit4LiZ4LmA4LiC4LmJ4Liy4LiE4Lij4Lix4LmJ4LiH4LmB4Lij4LiBJywgdHlwZTonc2Vs',
  'ZWN0JywgYmxhbms6ZmFsc2UsCiAgICAgICAgb3B0aW9uczpbe3ZhbHVlOid0cnVlJyxsYWJlbDon4LmD4LiK4LmIICjguYHguJnguLDguJnguLMpJ30se3ZhbHVlOidmYWxzZScsbGFiZWw6J+C5hOC4oeC5iOC4leC5ieC4reC4hyd9XSB9LAogICAgICB7IGtleTon',
  'c3RhdHVzJywgbGFiZWw6J+C4quC4luC4suC4meC4sCcsIHR5cGU6J3NlbGVjdCcsIGJsYW5rOmZhbHNlLCBvcHRpb25zOlsn4LmD4LiK4LmJ4LiH4Liy4LiZJywn4Lij4Liw4LiH4Lix4LiaJ10sCiAgICAgICAgaGludDon4Lij4Liw4LiH4Lix4LiaID0g4LmA4LiC',
  '4LmJ4Liy4Lij4Liw4Lia4Lia4LmE4Lih4LmI4LmE4LiU4LmJ4LiX4Lix4LiZ4LiX4Li1IOC5geC4leC5iOC4ouC4seC4h+C5gOC4geC5h+C4muC4muC4seC4jeC4iuC4teC5hOC4p+C5iScgfSwKICAgICAgeyBrZXk6J25vdGUnLCBsYWJlbDon4Lir4Lih4Liy4Lii',
  '4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXSwKICAgIHdpZGU6IHRydWUKICB9KTsKCiAgLy8g4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LmE4Lih4LmI4LmE4LiU4LmJIOC4',
  'peC5h+C4reC4geC4iuC5iOC4reC4h+C5hOC4p+C5ieC5gOC4peC4ouC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC5gOC4guC5ieC4suC5g+C4iOC4nOC4tOC4lAogIGlmICghaXNOZXcpIHsKICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX3Vz',
  'ZXJuYW1lJyk7CiAgICBpZiAoZWwpIHsgZWwucmVhZE9ubHkgPSB0cnVlOyBlbC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3ZhcigtLXN1cmZhY2UtMiknOyB9CiAgfQp9CgpmdW5jdGlvbiBkZWxVc2VyKHVzZXJuYW1lKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguJzg',
  'uLnguYnguYPguIrguYkgIicgKyB1c2VybmFtZSArICciIOC5g+C4iuC5iOC5hOC4q+C4oSDigJQg4LmA4LiC4LmJ4Liy4Lij4Liw4Lia4Lia4LmE4Lih4LmI4LmE4LiU4LmJ4Lit4Li14LiB4LiX4Lix4LiZ4LiX4Li1JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGko',
  'J3VzZXIuZGVsZXRlJywgeyB1c2VybmFtZTogdXNlcm5hbWUgfSkudGhlbihmdW5jdGlvbigpewogICAgICB0b2FzdCgn4Lil4Lia4Lic4Li54LmJ4LmD4LiK4LmJ4LmB4Lil4LmJ4LinJywgJ29rJyk7CiAgICAgIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKICAgIH0p',
  'LmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2UgfHwgZSwgJ2VycicpOyB9KTsKICB9KTsKfQoKLyogLS0tLSDguKXguLTguIfguIHguYzguYDguILguYnguLLguYPguIrguYnguIfguLLguJkgLS0tLSAqLwoKZnVuY3Rpb24gc2V0dGluZ3NTaGFyZUNh',
  'cmQobGlua3MpewogIGlmICghbGlua3MgfHwgIWxpbmtzLmFwcFVybCkgewogICAgcmV0dXJuIGNhcmQoJ/CflJcg4Lil4Li04LiH4LiB4LmM4LmA4LiC4LmJ4Liy4LmD4LiK4LmJ4LiH4Liy4LiZJywKICAgICAgJzxkaXYgY2xhc3M9ImVtcHR5Ij7guKLguLHguIfg',
  'uKvguLLguKXguLTguIfguIHguYzguIjguKPguLTguIfguYTguKHguYjguYDguIjguK0g4oCUIOC5gOC4m+C4tOC4lOC5gOC4p+C5h+C4muC5geC4reC4m+C4iOC4suC4geC4peC4tOC4h+C4geC5jOC4l+C4teC5iOC4peC4h+C4l+C5ieC4suC4oiAvZXhlYyDguKrg',
  'uLHguIHguITguKPguLHguYnguIcg4LmB4Lil4LmJ4Lin4Lij4Liw4Lia4Lia4LiI4Liw4LiI4Liz4LmD4Lir4LmJ4LmA4Lit4LiHPC9kaXY+Jyk7CiAgfQogIHJldHVybiBjYXJkKCfwn5SXIOC4peC4tOC4h+C4geC5jOC5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4',
  'suC4mScsCiAgICAnPGRpdiBjbGFzcz0iZiBtYjEyIj48bGFiZWw+4Lil4Li04LiH4LiB4LmM4Lir4Lil4Lix4LiBIOKAlCDguKrguYjguIfguYPguKvguYnguJfguLjguIHguITguJnguYTguJTguYkgKOC5gOC4guC5ieC4suC4lOC5ieC4p+C4ouC4iuC4t+C5iOC4',
  'reC4nOC4ueC5ieC5g+C4iuC5ieC5geC4peC4sOC4o+C4q+C4seC4quC4nOC5iOC4suC4mSk8L2xhYmVsPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJhcHBVcmwiIHJlYWRvbmx5IHZhbHVlPSInICsgZXNjKGxpbmtzLmFwcFVybCkgKyAnIiBvbmNs',
  'aWNrPSJ0aGlzLnNlbGVjdCgpIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJjb3B5RmllbGQoXCdhcHBVcmxcJykiPvCfk4sg4LiE4Lix4LiU4Lil4Lit4LiB4Lil',
  '4Li04LiH4LiB4LmM4Lir4Lil4Lix4LiBPC9idXR0b24+JyArCiAgICAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImYgbWIxMiI+PGxhYmVsPvCfkYAg4Lil4Li04LiH4LiB4LmM4LiU4Li54Lit4Lii4LmI',
  '4Liy4LiH4LmA4LiU4Li14Lii4Lin4LmB4Lia4Lia4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4Lil4LmH4Lit4LiB4Lit4Li04LiZPC9sYWJlbD4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0ic2hhcmVVcmwiIHJlYWRvbmx5IHZhbHVlPSInICsgZXNjKGxp',
  'bmtzLnZpZXdVcmwpICsgJyIgb25jbGljaz0idGhpcy5zZWxlY3QoKSI+PC9kaXY+JyArCiAgICAnPHAgY2xhc3M9ImZzMTIgJyArIChsaW5rcy5zaGFyZUVuYWJsZWQgPyAnbXV0ZWQnIDogJ3dhcm4tdGV4dCcpICsgJyI+JyArCiAgICAgIChsaW5rcy5zaGFyZUVu',
  'YWJsZWQKICAgICAgICA/ICfguYDguJvguLTguJTguK3guKLguLnguYgg4oCUIOC5g+C4hOC4o+C4geC5h+C4leC4suC4oeC4l+C4teC5iOC4oeC4teC4peC4tOC4h+C4geC5jOC4meC4teC5ieC5gOC4m+C4tOC4lOC4lOC4ueC4guC5ieC4reC4oeC4ueC4peC5hOC4',
  'lOC5ieC5guC4lOC4ouC5hOC4oeC5iOC4leC5ieC4reC4h+C4peC5h+C4reC4geC4reC4tOC4mScKICAgICAgICA6ICfimqDvuI8g4Lib4Li04LiU4Lit4Lii4Li54LmIIOKAlCDguKXguLTguIfguIHguYzguJnguLXguYnguKLguLHguIfguYPguIrguYnguYTguKHg',
  'uYjguYTguJTguYkg4LmA4Lib4Li04LiU4Liq4Lin4Li04LiV4LiK4LmM4LmE4LiU4LmJ4LiX4Li14LmI4Lir4Lix4Lin4LiC4LmJ4LitICLguITguKfguLLguKHguJvguKXguK3guJTguKDguLHguKLguYHguKXguLDguIHguLLguKPguYDguILguYnguLLguYPguIrg',
  'uYnguIfguLLguJkiIOC4lOC5ieC4suC4meC4muC4mScpICsKICAgICc8L3A+JyArCiAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjb3B5RmllbGQoXCdzaGFyZVVybFwnKSI+8J+TiyDguITg',
  'uLHguJTguKXguK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYw8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBkZ3IiIG9uY2xpY2s9ImRvUm90YXRlU2hhcmUoKSI+8J+UgSDguK3guK3guIHguKXguLTguIfguIHguYzguYHguIrguKPg',
  'uYzguYPguKvguKHguYg8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+JyArCiAgICAnPHAgY2xhc3M9ImZzMTIgbXV0ZWQiPvCfhpgg4Lil4Li04LiH4LiB4LmM4LiB4Li54LmJ4Lij4Liw4Lia4LiaICjguYPguIrg',
  'uYnguJXguK3guJnguKXguLfguKHguKPguKvguLHguKrguJzguYjguLLguJnguIjguJnguYDguILguYnguLLguYTguKHguYjguYTguJTguYkg4oCUIOC4q+C5ieC4suC4oeC4quC5iOC4h+C4leC5iOC4rSk8YnI+JyArCiAgICAnPGNvZGUgY2xhc3M9ImZzMTIiPicg',
  'KyBlc2MobGlua3MuYWRtaW5VcmwpICsgJzwvY29kZT48L3A+Jyk7Cn0KCmZ1bmN0aW9uIGNvcHlGaWVsZChpZCl7CiAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpOwogIGlmICghZWwpIHJldHVybjsKICBlbC5zZWxlY3QoKTsKICB0cnkgeyBk',
  'b2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpOyB0b2FzdCgn4LiE4Lix4LiU4Lil4Lit4LiB4LmB4Lil4LmJ4LinJywgJ29rJyk7IH0KICBjYXRjaCAoZSkgeyB0b2FzdCgn4LiB4LiU4LiE4LmJ4Liy4LiH4LiX4Li14LmI4LiK4LmI4Lit4LiH4LmB4Lil4LmJ4Lin',
  '4LmA4Lil4Li34Lit4LiBIOC4hOC4seC4lOC4peC4reC4gScsICdlcnInKTsgfQp9Cjwvc2NyaXB0Pgo8c2NyaXB0PgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgRm9ybXMuaHRtbCDigJQg4Lif',
  '4Lit4Lij4LmM4Lih4LmA4Lie4Li04LmI4LihL+C5geC4geC5ieC5hOC4giDguYHguKXguLDguIHguLLguKPguKXguJoKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgp2YXIgRk9STSA9IHsKICBz',
  'cGVjczogW10sICAgICAgIC8vIOC4nOC4seC4h+C4iuC5iOC4reC4h+C4geC4o+C4reC4geC4guC4reC4h+C4n+C4reC4o+C5jOC4oeC4l+C4teC5iOC5gOC4m+C4tOC4lOC4reC4ouC4ueC5iAogIGtlZXA6IHt9LCAgICAgICAgLy8g4LmE4Lif4Lil4LmM4LmB4LiZ',
  '4Lia4LmA4LiU4Li04Lih4LiX4Li14LmI4Lii4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJ4LmA4Lit4Liy4Lit4Lit4LiBCiAgYnVja2V0OiAnbWlzYycsICAvLyDguYLguJ/guKXguYDguJTguK3guKPguYzguJfguLXguYjguIjguLDguYDguIHguYfguJrguYTguJ/g',
  'uKXguYzguYHguJnguJrguYPguKvguKHguYgKICBvY3I6IG51bGwsICAgICAgIC8vIOC4nOC4seC4h+C4geC4suC4o+C5gOC4leC4tOC4oeC4hOC5iOC4suC4iOC4suC4geC4o+C4ueC4mwogIHJlYzogbnVsbCwgICAgICAgLy8g4Lij4Liy4Lii4LiB4Liy4Lij4LiX',
  '4Li14LmI4LiB4Liz4Lil4Lix4LiH4LmB4LiB4LmJ4Lit4Lii4Li54LmIIChudWxsID0g4LiB4Liz4Lil4Lix4LiH4LmA4Lie4Li04LmI4Lih4Lij4Liy4Lii4LiB4Liy4Lij4LmD4Lir4Lih4LmIKQogIGxpbmVzOiBbXSAgICAgICAgLy8g4Lij4Liy4Lii4LiB4Liy',
  '4Lij4Lii4LmI4Lit4Lii4LmD4LiZ4Lia4Li04LilICjguYPguIrguYnguIHguLHguJrguIrguYjguK3guIfguIrguJnguLTguJQgbGluZXMpCn07CgovKiAtLS0tLS0tLS0tLS0tLS0tIGZvcm0gZW5naW5lIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIGZp',
  'ZWxkc0h0bWwoc3BlY3MsIHJlYyl7CiAgcmVjID0gcmVjIHx8IHt9OwogIEZPUk0uc3BlY3MgPSBzcGVjczsKICBGT1JNLmtlZXAgPSB7fTsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImZncmlkIj4nICsgc3BlY3MubWFwKGZ1bmN0aW9uKGYpewogICAgdmFyIHYgPSBy',
  'ZWNbZi5rZXldOwogICAgdmFyIGlkID0gJ2ZfJyArIGYua2V5OwogICAgdmFyIGlubmVyOwoKICAgIGlmIChmLnR5cGUgPT09ICdzZWxlY3QnKSB7CiAgICAgIHZhciBvcHRzID0gKGYub3B0aW9ucyB8fCBbXSkubWFwKGZ1bmN0aW9uKG8pewogICAgICAgIHZhciB2',
  'YWwgPSB0eXBlb2YgbyA9PT0gJ29iamVjdCcgPyBvLnZhbHVlIDogbzsKICAgICAgICB2YXIgbGFiID0gdHlwZW9mIG8gPT09ICdvYmplY3QnID8gby5sYWJlbCA6IG87CiAgICAgICAgcmV0dXJuICc8b3B0aW9uIHZhbHVlPSInICsgZXNjKHZhbCkgKyAnIicgKyAo',
  'U3RyaW5nKHYpID09PSBTdHJpbmcodmFsKSA/ICcgc2VsZWN0ZWQnIDogJycpICsgJz4nICsgZXNjKGxhYikgKyAnPC9vcHRpb24+JzsKICAgICAgfSkuam9pbignJyk7CiAgICAgIGlubmVyID0gJzxzZWxlY3QgY2xhc3M9InNlbCIgaWQ9IicgKyBpZCArICciPicg',
  'KyAoZi5ibGFuayAhPT0gZmFsc2UgPyAnPG9wdGlvbiB2YWx1ZT0iIj7igJQg4LmA4Lil4Li34Lit4LiBIOKAlDwvb3B0aW9uPicgOiAnJykgKyBvcHRzICsgJzwvc2VsZWN0Pic7CgogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICd0ZXh0YXJlYScpIHsKICAgICAg',
  'aW5uZXIgPSAnPHRleHRhcmVhIGNsYXNzPSJ0YSIgaWQ9IicgKyBpZCArICciIHBsYWNlaG9sZGVyPSInICsgZXNjKGYucGh8fCcnKSArICciPicgKyBlc2Modnx8JycpICsgJzwvdGV4dGFyZWE+JzsKCiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ2ZpbGVzJykg',
  'ewogICAgICBGT1JNLmtlZXBbZi5rZXldID0gKHJlY1tmLmtleV0gJiYgcmVjW2Yua2V5XS5sZW5ndGgpID8gW10uY29uY2F0KHJlY1tmLmtleV0pIDogW107CiAgICAgIGlubmVyID0KICAgICAgICAnPGRpdiBpZD0iJyArIGlkICsgJ19leGlzdGluZyI+JyArIGV4',
  'aXN0aW5nRmlsZXNIdG1sKGYua2V5KSArICc8L2Rpdj4nICsKICAgICAgICAnPGxhYmVsIGNsYXNzPSJmaWxlLWRyb3AiIGZvcj0iJyArIGlkICsgJyI+8J+TjiDguYHguJXguLDguYDguJ7guLfguYjguK3guYDguKXguLfguK3guIHguYTguJ/guKXguYwgKOC5gOC4',
  'peC4t+C4reC4geC5hOC4lOC5ieC4q+C4peC4suC4ouC5hOC4n+C4peC5jCDCtyDguYTguKHguYjguYDguIHguLTguJkgMTIgTUIg4LiV4LmI4Lit4LmE4Lif4Lil4LmMKScgKwogICAgICAgICc8aW5wdXQgdHlwZT0iZmlsZSIgaWQ9IicgKyBpZCArICciIG11bHRp',
  'cGxlIGFjY2VwdD0iaW1hZ2UvKixhcHBsaWNhdGlvbi9wZGYiIHN0eWxlPSJkaXNwbGF5Om5vbmUiICcgKwogICAgICAgICdvbmNoYW5nZT0icHJldmlld1BpY2tlZCh0aGlzLFwnJyArIGlkICsgJ1wnKSI+PC9sYWJlbD4nICsKICAgICAgICAnPGRpdiBpZD0iJyAr',
  'IGlkICsgJ19wcmV2aWV3IiBjbGFzcz0idGh1bWJzIG10OCI+PC9kaXY+JyArCiAgICAgICAgJzxkaXYgaWQ9IicgKyBpZCArICdfb2NyIj48L2Rpdj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnbGluZXMnKSB7CiAgICAgIEZPUk0ubGluZXMgPSBwYXJz',
  'ZUxpbmVzVGV4dCh2KTsKICAgICAgaW5uZXIgPSAnPGRpdiBpZD0iJyArIGlkICsgJyIgY2xhc3M9ImxpbmVzIj4nICsgbGluZXNUYWJsZUh0bWwoKSArICc8L2Rpdj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnY29tcHV0ZWQnKSB7CiAgICAgIGlubmVy',
  'ID0gJzxkaXYgY2xhc3M9ImlucCIgaWQ9IicgKyBpZCArICciIHN0eWxlPSJiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Zm9udC13ZWlnaHQ6NjAwOycgKwogICAgICAgICAgICAgICdmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7Y3Vyc29yOmRl',
  'ZmF1bHQiPjA8L2Rpdj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnZGF0ZScpIHsKICAgICAgaW5uZXIgPSAnPGlucHV0IHR5cGU9ImRhdGUiIGNsYXNzPSJpbnAiIGlkPSInICsgaWQgKyAnIiB2YWx1ZT0iJyArIGVzYyh2IHx8ICcnKSArICciPic7Cgog',
  'ICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICdudW1iZXInIHx8IGYudHlwZSA9PT0gJ21vbmV5JykgewogICAgICBpbm5lciA9ICc8aW5wdXQgdHlwZT0ibnVtYmVyIiBzdGVwPSInICsgKGYudHlwZSA9PT0gJ21vbmV5JyA/ICcwLjAxJyA6ICcxJykgKyAnIiBjbGFz',
  'cz0iaW5wIiBpZD0iJyArIGlkICsgJyIgJyArCiAgICAgICAgICAgICAgJ3ZhbHVlPSInICsgKHYgPT0gbnVsbCB8fCB2ID09PSAnJyA/ICcnIDogZXNjKHYpKSArICciIHBsYWNlaG9sZGVyPSInICsgZXNjKGYucGh8fCcnKSArICciIGlucHV0bW9kZT0iZGVjaW1h',
  'bCInICsKICAgICAgICAgICAgICAoZi5zdW1zID8gJyBvbmlucHV0PSJyZWNhbGNTdW1zKCkiJyA6IChmLm9uaW5wdXQgPyAnIG9uaW5wdXQ9IicgKyBlc2MoZi5vbmlucHV0KSArICciJyA6ICcnKSkgKyAnPic7CgogICAgfSBlbHNlIHsKICAgICAgaW5uZXIgPSAn',
  'PGlucHV0IHR5cGU9InRleHQiIGNsYXNzPSJpbnAiIGlkPSInICsgaWQgKyAnIiB2YWx1ZT0iJyArIGVzYyh2IHx8ICcnKSArICciIHBsYWNlaG9sZGVyPSInICsgZXNjKGYucGh8fCcnKSArICciPic7CiAgICB9CgogICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJmJyAr',
  'IChmLmZ1bGwgPyAnIGZ1bGwnIDogJycpICsgJyI+JyArCiAgICAgICc8bGFiZWwgZm9yPSInICsgaWQgKyAnIj4nICsgZXNjKGYubGFiZWwpICsgKGYucmVxdWlyZWQgPyAnIDxzcGFuIHN0eWxlPSJjb2xvcjp2YXIoLS1kYW5nZXIpIj4qPC9zcGFuPicgOiAnJykg',
  'KyAnPC9sYWJlbD4nICsKICAgICAgaW5uZXIgKyAoZi5oaW50ID8gJzxkaXYgY2xhc3M9ImhpbnQiPicgKwogICAgICAgIChmLmhpbnQuY2hhckF0KDApID09PSAnPCcgPyBmLmhpbnQgOiBlc2MoZi5oaW50KSkgKyAnPC9kaXY+JyA6ICcnKSArICc8L2Rpdj4nOwog',
  'IH0pLmpvaW4oJycpICsgJzwvZGl2Pic7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJrguLTguKXguYDguJTguLXguKLguKfguKvguKXguLLguKLguKPguLLguKLguIHguLLguKMg',
  '4oCUIOC4i+C4t+C5ieC4reC4reC4reC4meC5hOC4peC4meC5jOC4l+C4teC5gOC4lOC4teC4ouC4p+C5hOC4lOC5ieC4guC4reC4h+C4q+C4peC4suC4ouC4reC4ouC5iOC4suC4hwoKICAg4LmA4LiB4LmH4Lia4Lil4LiH4LiK4Li14LiV4LmA4Lib4LmH4LiZ4LiC',
  '4LmJ4Lit4LiE4Lin4Liy4LihIOC4muC4o+C4o+C4l+C4seC4lOC4peC4sOC4o+C4suC4ouC4geC4suC4oyAg4LiK4Li34LmI4LitIHwg4LiI4Liz4LiZ4Lin4LiZIHwg4Lir4LiZ4LmI4Lin4LiiIHwg4Lij4Liy4LiE4Liy4LiV4LmI4Lit4Lir4LiZ4LmI4Lin4Lii',
  'CiAgICjguKPguLnguJvguYHguJrguJrguYDguJTguLXguKLguKfguIHguLHguJogcGFyc2VMaW5lc18g4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmMIOKAlCDguYHguIHguYnguJfguLXguYjguYTguKvguJnguJXguYnguK3guIfg',
  'uYHguIHguYnguYPguKvguYnguJXguKPguIfguIHguLHguJkpCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKZnVuY3Rpb24gcGFyc2VMaW5lc1RleHQodGV4dCl7CiAgcmV0dXJuIFN0cmlu',
  'Zyh0ZXh0ID09IG51bGwgPyAnJyA6IHRleHQpLnNwbGl0KC9ccj9cbi8pCiAgICAubWFwKGZ1bmN0aW9uKHMpeyByZXR1cm4gcy50cmltKCk7IH0pLmZpbHRlcihCb29sZWFuKQogICAgLm1hcChmdW5jdGlvbihyYXcpewogICAgICB2YXIgYSA9IHJhdy5zcGxpdCgn',
  'fCcpLm1hcChmdW5jdGlvbih4KXsgcmV0dXJuIHgudHJpbSgpOyB9KTsKICAgICAgdmFyIG5hbWUgPSBhWzBdIHx8ICcnLCBxdHkgPSAxLCB1bml0ID0gJycsIHByaWNlID0gMDsKICAgICAgaWYgKGEubGVuZ3RoID49IDQpICAgICAgeyBxdHkgPSBudW1PcihhWzFd',
  'LCAxKTsgdW5pdCA9IGFbMl0gfHwgJyc7IHByaWNlID0gbnVtT3IoYVszXSwgMCk7IH0KICAgICAgZWxzZSBpZiAoYS5sZW5ndGggPT09IDMpeyBxdHkgPSBudW1PcihhWzFdLCAxKTsgcHJpY2UgPSBudW1PcihhWzJdLCAwKTsgfQogICAgICBlbHNlIGlmIChhLmxl',
  'bmd0aCA9PT0gMil7IHByaWNlID0gbnVtT3IoYVsxXSwgMCk7IH0KICAgICAgcmV0dXJuIHsgbmFtZTogbmFtZSwgcXR5OiBxdHksIHVuaXQ6IHVuaXQsIHByaWNlOiBwcmljZSB9OwogICAgfSk7Cn0KCmZ1bmN0aW9uIG51bU9yKHYsIGRmbHQpewogIHZhciBuID0g',
  'TnVtYmVyKFN0cmluZyh2KS5yZXBsYWNlKC8sL2csICcnKSk7CiAgcmV0dXJuIGlzRmluaXRlKG4pID8gbiA6IGRmbHQ7Cn0KCmZ1bmN0aW9uIGZvcm1hdExpbmVzVGV4dChsaXN0KXsKICByZXR1cm4gKGxpc3QgfHwgW10pCiAgICAuZmlsdGVyKGZ1bmN0aW9uKGwp',
  'eyByZXR1cm4gU3RyaW5nKGwubmFtZSB8fCAnJykudHJpbSgpIHx8IE51bWJlcihsLnByaWNlKTsgfSkKICAgIC5tYXAoZnVuY3Rpb24obCl7CiAgICAgIHJldHVybiBbU3RyaW5nKGwubmFtZSB8fCAnJykucmVwbGFjZSgvXHwvZywgJy8nKSwKICAgICAgICAgICAg',
  'ICBsLnF0eSB8fCAxLAogICAgICAgICAgICAgIFN0cmluZyhsLnVuaXQgfHwgJycpLnJlcGxhY2UoL1x8L2csICcvJyksCiAgICAgICAgICAgICAgbC5wcmljZSB8fCAwXS5qb2luKCcgfCAnKTsKICAgIH0pLmpvaW4oJ1xuJyk7Cn0KCmZ1bmN0aW9uIGxpbmVUb3Rh',
  'bChsKXsgcmV0dXJuIChOdW1iZXIobC5xdHkpIHx8IDApICogKE51bWJlcihsLnByaWNlKSB8fCAwKTsgfQpmdW5jdGlvbiBsaW5lc1N1bSgpeyByZXR1cm4gKEZPUk0ubGluZXMgfHwgW10pLnJlZHVjZShmdW5jdGlvbihhLCBsKXsgcmV0dXJuIGEgKyBsaW5lVG90',
  'YWwobCk7IH0sIDApOyB9CgpmdW5jdGlvbiBsaW5lc1RhYmxlSHRtbCgpewogIHZhciByb3dzID0gKEZPUk0ubGluZXMgfHwgW10pLm1hcChmdW5jdGlvbihsLCBpKXsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0ibGluZS1yb3ciPicgKwogICAgICAnPGlucHV0IGNs',
  'YXNzPSJpbnAiIHBsYWNlaG9sZGVyPSLguIrguLfguYjguK3guKrguLTguJnguITguYnguLIiIHZhbHVlPSInICsgZXNjKGwubmFtZSB8fCAnJykgKyAnIiAnICsKICAgICAgICAnb25pbnB1dD0ic2V0TGluZSgnICsgaSArICcsXCduYW1lXCcsdGhpcy52YWx1ZSki',
  'PicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAgbnVtIiB0eXBlPSJudW1iZXIiIHN0ZXA9ImFueSIgaW5wdXRtb2RlPSJkZWNpbWFsIiBwbGFjZWhvbGRlcj0i4LiI4Liz4LiZ4Lin4LiZIiAnICsKICAgICAgICAndmFsdWU9IicgKyAobC5xdHkgPT0gbnVsbCA/',
  'ICcnIDogZXNjKGwucXR5KSkgKyAnIiBvbmlucHV0PSJzZXRMaW5lKCcgKyBpICsgJyxcJ3F0eVwnLHRoaXMudmFsdWUpIj4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBwbGFjZWhvbGRlcj0i4Lir4LiZ4LmI4Lin4LiiIiB2YWx1ZT0iJyArIGVzYyhsLnVu',
  'aXQgfHwgJycpICsgJyIgJyArCiAgICAgICAgJ29uaW5wdXQ9InNldExpbmUoJyArIGkgKyAnLFwndW5pdFwnLHRoaXMudmFsdWUpIj4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIG51bSIgdHlwZT0ibnVtYmVyIiBzdGVwPSJhbnkiIGlucHV0bW9kZT0iZGVj',
  'aW1hbCIgcGxhY2Vob2xkZXI9IuC4o+C4suC4hOC4si/guKvguJnguYjguKfguKIiICcgKwogICAgICAgICd2YWx1ZT0iJyArIChsLnByaWNlID09IG51bGwgPyAnJyA6IGVzYyhsLnByaWNlKSkgKyAnIiBvbmlucHV0PSJzZXRMaW5lKCcgKyBpICsgJyxcJ3ByaWNl',
  'XCcsdGhpcy52YWx1ZSkiPicgKwogICAgICAnPGRpdiBjbGFzcz0ibGluZS1zdW0iPicgKyBtb25leShsaW5lVG90YWwobCksIDIpICsgJzwvZGl2PicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20gZGdyIiB0aXRsZT0i4LmA4Lit',
  '4Liy4Lij4Liy4Lii4LiB4Liy4Lij4LiZ4Li14LmJ4Lit4Lit4LiBIiBvbmNsaWNrPSJkZWxMaW5lKCcgKyBpICsgJykiPsOXPC9idXR0b24+JyArCiAgICAnPC9kaXY+JzsKICB9KS5qb2luKCcnKTsKCiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJsaW5lLWhlYWQiPicg',
  'KwogICAgICAnPHNwYW4+4LiK4Li34LmI4Lit4Liq4Li04LiZ4LiE4LmJ4LiyPC9zcGFuPjxzcGFuIGNsYXNzPSJudW0iPuC4iOC4s+C4meC4p+C4mTwvc3Bhbj48c3Bhbj7guKvguJnguYjguKfguKI8L3NwYW4+JyArCiAgICAgICc8c3BhbiBjbGFzcz0ibnVtIj7g',
  'uKPguLLguITguLIv4Lir4LiZ4LmI4Lin4LiiPC9zcGFuPjxzcGFuIGNsYXNzPSJudW0iPuC4o+C4p+C4oTwvc3Bhbj48c3Bhbj48L3NwYW4+JyArCiAgICAnPC9kaXY+JyArCiAgICAocm93cyB8fCAnPGRpdiBjbGFzcz0iaGludCIgc3R5bGU9InBhZGRpbmc6OHB4',
  'IDJweCI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4LijIOKAlCDguIHguJQg4oCc4LmA4Lie4Li04LmI4Lih4Lij4Liy4Lii4LiB4Liy4Lij4oCdIOC5gOC4nuC4t+C5iOC4reC5g+C4quC5iOC4quC4tOC4meC4hOC5ieC4suC4l+C4teC4',
  'peC4sOC4reC4ouC5iOC4suC4hzwvZGl2PicpICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQ4Ij4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJhZGRMaW5lKCkiPisg4LmA4Lie4Li04LmI4Lih4Lij4Liy4Lii',
  '4LiB4Liy4LijPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0icGFzdGVMaW5lcygpIj7wn5OLIOC4p+C4suC4h+C4l+C4teC5gOC4lOC4teC4ouC4p+C4q+C4peC4suC4ouC4o+C4suC4ouC4geC4',
  'suC4ozwvYnV0dG9uPicgKwogICAgICAnPGRpdiBjbGFzcz0ibGluZS10b3RhbCI+4Lij4Lin4Lih4LiE4LmI4Liy4Liq4Li04LiZ4LiE4LmJ4LiyIDxiPicgKyBtb25leShsaW5lc1N1bSgpLCAyKSArICcg4Li/PC9iPjwvZGl2PicgKwogICAgJzwvZGl2Pic7Cn0K',
  'CmZ1bmN0aW9uIHJlZHJhd0xpbmVzKCl7CiAgdmFyIGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2xpbmVzJyk7CiAgaWYgKCFib3gpIHJldHVybjsKICBib3guaW5uZXJIVE1MID0gbGluZXNUYWJsZUh0bWwoKTsKICByZWNhbGNCaWxsKCk7Cn0KCmZ1',
  'bmN0aW9uIHNldExpbmUoaSwga2V5LCB2YWwpewogIGlmICghRk9STS5saW5lc1tpXSkgcmV0dXJuOwogIEZPUk0ubGluZXNbaV1ba2V5XSA9IChrZXkgPT09ICdxdHknIHx8IGtleSA9PT0gJ3ByaWNlJykgPyBudW1Pcih2YWwsIDApIDogdmFsOwogIC8vIOC5hOC4',
  'oeC5iOC4p+C4suC4lOC5g+C4q+C4oeC5iOC4l+C4seC5ieC4h+C4leC4suC4o+C4suC4hyDguYDguJTguLXguYvguKLguKfguYDguITguK3guKPguYzguYDguIvguK3guKPguYzguYDguJTguYnguIfguK3guK3guIHguIjguLLguIHguIrguYjguK3guIfguJfguLXg',
  'uYjguIHguLPguKXguLHguIfguJ7guLTguKHguJ7guYwKICB2YXIgcm93ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2ZfbGluZXMgLmxpbmUtcm93JylbaV07CiAgaWYgKHJvdykgcm93LnF1ZXJ5U2VsZWN0b3IoJy5saW5lLXN1bScpLnRleHRDb250ZW50',
  'ID0gbW9uZXkobGluZVRvdGFsKEZPUk0ubGluZXNbaV0pLCAyKTsKICB2YXIgdG90ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2ZfbGluZXMgLmxpbmUtdG90YWwgYicpOwogIGlmICh0b3QpIHRvdC50ZXh0Q29udGVudCA9IG1vbmV5KGxpbmVzU3VtKCksIDIp',
  'ICsgJyDguL8nOwogIHJlY2FsY0JpbGwoKTsKfQoKZnVuY3Rpb24gYWRkTGluZSgpewogIEZPUk0ubGluZXMucHVzaCh7IG5hbWU6ICcnLCBxdHk6IDEsIHVuaXQ6ICcnLCBwcmljZTogMCB9KTsKICByZWRyYXdMaW5lcygpOwogIHZhciBpbnB1dHMgPSBkb2N1bWVu',
  'dC5xdWVyeVNlbGVjdG9yQWxsKCcjZl9saW5lcyAubGluZS1yb3cgLmlucCcpOwogIGlmIChpbnB1dHMubGVuZ3RoKSBpbnB1dHNbKEZPUk0ubGluZXMubGVuZ3RoIC0gMSkgKiA0XS5mb2N1cygpOwp9CgpmdW5jdGlvbiBkZWxMaW5lKGkpewogIEZPUk0ubGluZXMu',
  'c3BsaWNlKGksIDEpOwogIHJlZHJhd0xpbmVzKCk7Cn0KCi8qKgogKiDguKfguLLguIfguKPguLLguKLguIHguLLguKPguIjguLLguIHguKvguJnguYnguLLguITguLPguKrguLHguYjguIfguIvguLfguYnguK3guJfguLXguYDguJTguLXguKLguKfguJfguLHguYng',
  'uIfguIHguYnguK3guJkg4LmB4Lil4LmJ4Lin4LmD4Lir4LmJ4Lij4Liw4Lia4Lia4LmB4Lii4LiB4Lia4Lij4Lij4LiX4Lix4LiU4LmD4Lir4LmJCiAqCiAqIOC4l+C4s+C5gOC4m+C5h+C4meC4iuC5iOC4reC4h+C4nuC4seC4muC5gOC4geC5h+C4muC4reC4ouC4',
  'ueC5iOC5g+C4meC4n+C4reC4o+C5jOC4oeC5gOC4lOC4tOC4oSDguYTguKHguYjguYDguJvguLTguJTguKvguJnguYnguLLguJXguYjguLLguIfguIvguYnguK3guJkKICog4LmA4Lie4Lij4Liy4LiwIG9wZW5Nb2RhbCgpIOC5gOC4guC4teC4ouC4meC4l+C4seC4',
  'muC4q+C4meC5ieC4suC4leC5iOC4suC4h+C5gOC4lOC4tOC4oSDguJbguYnguLLguYDguJvguLTguJTguIvguYnguK3guJnguJ/guK3guKPguYzguKHguJfguLXguYjguIHguKPguK3guIHguITguYnguLLguIfguYTguKfguYnguIjguLDguKvguLLguKLguJfguLHg',
  'uYnguIfguYPguJoKICovCmZ1bmN0aW9uIHBhc3RlTGluZXMoKXsKICB2YXIgYm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Bhc3RlV3JhcCcpOwogIGlmIChib3gpIHsgYm94LmhpZGRlbiA9ICFib3guaGlkZGVuOyBpZiAoIWJveC5oaWRkZW4pIGRvY3Vt',
  'ZW50LmdldEVsZW1lbnRCeUlkKCdwYXN0ZUJveCcpLmZvY3VzKCk7IHJldHVybjsgfQoKICB2YXIgaG9zdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2xpbmVzJyk7CiAgaWYgKCFob3N0KSByZXR1cm47CiAgdmFyIHdyYXAgPSBkb2N1bWVudC5jcmVhdGVF',
  'bGVtZW50KCdkaXYnKTsKICB3cmFwLmlkID0gJ3Bhc3RlV3JhcCc7CiAgd3JhcC5jbGFzc05hbWUgPSAnbXQ4JzsKICB3cmFwLmlubmVySFRNTCA9CiAgICAnPHRleHRhcmVhIGNsYXNzPSJ0YSIgaWQ9InBhc3RlQm94IiBzdHlsZT0ibWluLWhlaWdodDoxMjBweCIg',
  'JyArCiAgICAgICdwbGFjZWhvbGRlcj0i4Lib4Lix4LmK4Lih4LiZ4LmJ4LizIDc1MFcgfCAxIHwg4LmA4LiE4Lij4Li34LmI4Lit4LiHIHwgNDI1MCYjMTA74Liq4Liy4Lii4LmE4LifIFZBRiAyeDEuNSB8IDIwIHwg4LmA4Lih4LiV4LijIHwgMTcuNSYjMTA74LmA',
  '4LiX4Lib4Lie4Lix4LiZ4Liq4Liy4Lii4LmE4LifIDQ1Ij48L3RleHRhcmVhPicgKwogICAgJzxkaXYgY2xhc3M9ImhpbnQgbXQ4Ij7guITguLHguYjguJnguJTguYnguKfguKIgPGI+fDwvYj4g4LiV4Liy4Lih4Lil4Liz4LiU4Lix4LiaIOC4iuC4t+C5iOC4rSDC',
  'tyDguIjguLPguJnguKfguJkgwrcg4Lir4LiZ4LmI4Lin4LiiIMK3IOC4o+C4suC4hOC4suC4leC5iOC4reC4q+C4meC5iOC4p+C4ojxicj4nICsKICAgICAgJ+C4luC5ieC4suC4p+C4suC4h+C4oeC4suC5gOC4m+C5h+C4meC4guC5ieC4reC4hOC4p+C4suC4oeC4',
  'mOC4o+C4o+C4oeC4lOC4siDguKPguLDguJrguJrguIjguLDguJ7guKLguLLguKLguLLguKHguYHguKLguIHguIrguLfguYjguK3guIHguLHguJrguKPguLLguITguLLguYPguKvguYnguYDguK3guIc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQ4Ij4n',
  'ICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIHByaSIgb25jbGljaz0iYXBwbHlQYXN0ZWRMaW5lcygpIj7guYDguJ7guLTguYjguKHguYDguILguYnguLLguKPguLLguKLguIHguLLguKM8L2J1dHRvbj4nICsKICAgICAgJzxidXR0',
  'b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcJ3Bhc3RlV3JhcFwnKS5oaWRkZW49dHJ1ZSI+4Lib4Li04LiUPC9idXR0b24+JyArCiAgICAnPC9kaXY+JzsKICBob3N0LmFwcGVuZENoaWxkKHdy',
  'YXApOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXN0ZUJveCcpLmZvY3VzKCk7Cn0KCmZ1bmN0aW9uIGFwcGx5UGFzdGVkTGluZXMoKXsKICB2YXIgdGV4dCA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFzdGVCb3gnKSB8fCB7fSkudmFsdWUgfHwg',
  'Jyc7CiAgdmFyIGFkZGVkID0gdGV4dC5zcGxpdCgvXHI/XG4vKS5tYXAoZnVuY3Rpb24ocyl7IHJldHVybiBzLnRyaW0oKTsgfSkuZmlsdGVyKEJvb2xlYW4pLm1hcChmdW5jdGlvbihyYXcpewogICAgaWYgKHJhdy5pbmRleE9mKCd8JykgPj0gMCkgcmV0dXJuIHBh',
  'cnNlTGluZXNUZXh0KHJhdylbMF07CiAgICAvLyDguYTguKHguYjguKHguLUgfCDigJQg4LmA4LiU4Liy4LiI4Liy4LiB4LiV4Lix4Lin4LmA4Lil4LiC4LiX4LmJ4Liy4Lii4Lia4Lij4Lij4LiX4Lix4LiU4Lin4LmI4Liy4LmA4Lib4LmH4LiZ4Lij4Liy4LiE4Liy',
  'CiAgICB2YXIgbSA9IHJhdy5tYXRjaCgvXiguKj8pW1xzOnjDl10qKFtcZCxdKyg/OlwuXGQrKT8pXHMqKD864Lia4Liy4LiXfOC4vyk/JC8pOwogICAgaWYgKG0gJiYgbVsxXS50cmltKCkpIHJldHVybiB7IG5hbWU6IG1bMV0udHJpbSgpLCBxdHk6IDEsIHVuaXQ6',
  'ICcnLCBwcmljZTogbnVtT3IobVsyXSwgMCkgfTsKICAgIHJldHVybiB7IG5hbWU6IHJhdywgcXR5OiAxLCB1bml0OiAnJywgcHJpY2U6IDAgfTsKICB9KS5maWx0ZXIoQm9vbGVhbik7CgogIGlmICghYWRkZWQubGVuZ3RoKSByZXR1cm4gdG9hc3QoJ+C5hOC4oeC5',
  'iOC4nuC4muC4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4reC5iOC4suC4meC5hOC4lOC5iScsICdlcnInKTsKICBGT1JNLmxpbmVzID0gKEZPUk0ubGluZXMgfHwgW10pLmZpbHRlcihmdW5jdGlvbihsKXsgcmV0dXJuIFN0cmluZyhsLm5hbWUgfHwgJycpLnRy',
  'aW0oKTsgfSkuY29uY2F0KGFkZGVkKTsKICByZWRyYXdMaW5lcygpOyAgIC8vIOC4p+C4suC4lOC5g+C4q+C4oeC5iOC5geC4peC5ieC4p+C4iuC5iOC4reC4h+C4p+C4suC4h+C4iOC4sOC4q+C4suC4ouC5hOC4m+C5gOC4reC4hyDguYDguJ7guKPguLLguLDguK3g',
  'uKLguLnguYjguILguYnguLLguIfguYPguJkgZl9saW5lcwogIHRvYXN0KCfguYDguJ7guLTguYjguKHguYPguKvguYkgJyArIGFkZGVkLmxlbmd0aCArICcg4Lij4Liy4Lii4LiB4Liy4LijIOKAlCDguJXguKPguKfguIjguJXguLHguKfguYDguKXguILguK3guLXg',
  'uIHguITguKPguLHguYnguIfguIHguYjguK3guJnguJrguLHguJnguJfguLbguIEnLCAnb2snKTsKfQoKLyoqCiAqIOC4hOC4tOC4lOC4ouC4reC4lOC4o+C4p+C4oeC4guC4reC4h+C4muC4tOC4pSA9IOC4hOC5iOC4suC4quC4tOC4meC4hOC5ieC4siArIOC4hOC5',
  'iOC4suC4quC5iOC4hyDiiJIg4Liq4LmI4Lin4LiZ4Lil4LiUIOC5geC4peC5ieC4p+C5gOC4leC4tOC4oeC4peC4h+C4iuC5iOC4reC4hyAi4Lij4Liy4LiE4Liy4Lij4Lin4LihIgogKiDguYPguKvguYnguJXguKPguIfguIHguLHguJrguJfguLXguYjguJ3guLHg',
  'uYjguIfguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYzguITguLTguJTguJXguK3guJnguJrguLHguJnguJfguLbguIEg4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4Lih4Li14LiX4Liy4LiH4LiX4Li14LmI4LiV4Lix4Lin4LmA4Lil4LiC4Liq4Lit4LiH',
  '4Lid4Lix4LmI4LiH4LmE4Lih4LmI4LiV4Lij4LiH4LiB4Lix4LiZCiAqLwpmdW5jdGlvbiByZWNhbGNCaWxsKCl7CiAgaWYgKCFkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9saW5lcycpKSByZXR1cm47CiAgdmFyIHByaWNlID0gZG9jdW1lbnQuZ2V0RWxlbWVu',
  'dEJ5SWQoJ2ZfcHJpY2UnKTsKICBpZiAoIXByaWNlKSByZXR1cm47CiAgdmFyIG4gPSAoRk9STS5saW5lcyB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uKGwpeyByZXR1cm4gU3RyaW5nKGwubmFtZSB8fCAnJykudHJpbSgpIHx8IE51bWJlcihsLnByaWNlKTsgfSkubGVu',
  'Z3RoOwogIGlmICghbikgeyBwcmljZS5yZWFkT25seSA9IGZhbHNlOyBwcmljZS5zdHlsZS5iYWNrZ3JvdW5kID0gJyc7IHJldHVybjsgfQoKICB2YXIgc2hpcCA9IE51bWJlcigoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Zfc2hpcHBpbmcnKSB8fCB7fSkudmFs',
  'dWUpIHx8IDA7CiAgdmFyIGRpc2MgPSBOdW1iZXIoKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2Rpc2NvdW50JykgfHwge30pLnZhbHVlKSB8fCAwOwogIHByaWNlLnZhbHVlID0gTWF0aC5yb3VuZCgobGluZXNTdW0oKSArIHNoaXAgLSBkaXNjKSAqIDEwMCkg',
  'LyAxMDA7CiAgcHJpY2UucmVhZE9ubHkgPSB0cnVlOyAgICAgICAgICAgICAgICAgICAgICAgLy8g4Lih4Li14Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4Lii4LmB4Lil4LmJ4LinIOC4q+C5ieC4suC4oeC4nuC4tOC4oeC4nuC5jOC4l+C4seC4muC5g+C4q+C5',
  'ieC5hOC4oeC5iOC4leC4o+C4h+C4geC4seC4mQogIHByaWNlLnN0eWxlLmJhY2tncm91bmQgPSAndmFyKC0tc3VyZmFjZS0yKSc7CiAgcHJpY2UudGl0bGUgPSAn4LiE4Li04LiU4LiI4Liy4LiB4Lij4Liy4Lii4LiB4Liy4Lij4LmD4LiZ4Lia4Li04Lil4LmD4Lir',
  '4LmJ4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0IOKAlCDguYHguIHguYnguJfguLXguYjguKPguLLguKLguIHguLLguKPguKLguYjguK3guKIg4LiE4LmI4Liy4Liq4LmI4LiHIOC4q+C4o+C4t+C4reC4quC5iOC4p+C4meC4peC4lCc7CgogIHZhciBoaW50ID0g',
  'ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JpbGxIaW50Jyk7CiAgaWYgKGhpbnQpIHsKICAgIGhpbnQuaW5uZXJIVE1MID0gbiArICcg4Lij4Liy4Lii4LiB4Liy4LijIMK3IOC4hOC5iOC4suC4quC4tOC4meC4hOC5ieC4siAnICsgbW9uZXkobGluZXNTdW0oKSwg',
  'MikgKwogICAgICAoc2hpcCA/ICcgKyDguITguYjguLLguKrguYjguIcgJyArIG1vbmV5KHNoaXAsIDIpIDogJycpICsKICAgICAgKGRpc2MgPyAnIOKIkiDguKrguYjguKfguJnguKXguJQgJyArIG1vbmV5KGRpc2MsIDIpIDogJycpOwogIH0KfQoKLyoqIOC4reC4',
  'seC4m+C5gOC4lOC4leC4iuC5iOC4reC4h+C4nOC4peC4o+C4p+C4oeC4l+C4uOC4geC4iuC5iOC4reC4h+C5g+C4meC4n+C4reC4o+C5jOC4oeC4m+C4seC4iOC4iOC4uOC4muC4seC4mSAqLwpmdW5jdGlvbiByZWNhbGNTdW1zKCl7CiAgKEZPUk0uc3BlY3MgfHwg',
  'W10pLmZvckVhY2goZnVuY3Rpb24oZil7CiAgICBpZiAoZi50eXBlICE9PSAnY29tcHV0ZWQnIHx8ICFmLmZyb20pIHJldHVybjsKICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmXycgKyBmLmtleSk7CiAgICBpZiAoIWVsKSByZXR1cm47CiAg',
  'ICB2YXIgdG90YWwgPSAwOwogICAgZi5mcm9tLmZvckVhY2goZnVuY3Rpb24oayl7CiAgICAgIHZhciBpID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyArIGspOwogICAgICBpZiAoaSkgdG90YWwgKz0gTnVtYmVyKGkudmFsdWUpIHx8IDA7CiAgICB9KTsK',
  'ICAgIGVsLnRleHRDb250ZW50ID0gdG90YWwudG9Mb2NhbGVTdHJpbmcoJ3RoLVRIJywgeyBtaW5pbXVtRnJhY3Rpb25EaWdpdHM6IDAsIG1heGltdW1GcmFjdGlvbkRpZ2l0czogMiB9KSArICcg4Li/JzsKICAgIGVsLnN0eWxlLmNvbG9yID0gdG90YWwgPiAwID8g',
  'J3ZhcigtLW9rKScgOiAndmFyKC0tbXV0ZWQpJzsKICB9KTsKfQoKZnVuY3Rpb24gZXhpc3RpbmdGaWxlc0h0bWwoa2V5KXsKICB2YXIgbGlzdCA9IEZPUk0ua2VlcFtrZXldIHx8IFtdOwogIGlmICghbGlzdC5sZW5ndGgpIHJldHVybiAnJzsKICByZXR1cm4gJzxk',
  'aXYgY2xhc3M9InRodW1icyBtYjgiPicgKyBsaXN0Lm1hcChmdW5jdGlvbih1cmwsIGkpewogICAgdmFyIGlkID0gU3RyaW5nKHVybCkubWF0Y2goL1stXHddezIwLH0vKTsKICAgIHZhciB0aHVtYiA9IGlkID8gJ2h0dHBzOi8vZHJpdmUuZ29vZ2xlLmNvbS90aHVt',
  'Ym5haWw/aWQ9JyArIGlkWzBdICsgJyZzej13MjAwJyA6ICcnOwogICAgcmV0dXJuICc8c3BhbiBzdHlsZT0icG9zaXRpb246cmVsYXRpdmU7ZGlzcGxheTppbmxpbmUtYmxvY2siPicgKwogICAgICAodGh1bWIgPyAnPGltZyBjbGFzcz0idGh1bWIiIHNyYz0iJyAr',
  'IGVzYyh0aHVtYikgKyAnIiBvbmNsaWNrPSJ3aW5kb3cub3BlbihcJycgKyBlc2ModXJsKSArICdcJyxcJ19ibGFua1wnKSI+JwogICAgICAgICAgICAgOiAnPGEgY2xhc3M9ImIgaW5mbyIgaHJlZj0iJyArIGVzYyh1cmwpICsgJyIgdGFyZ2V0PSJfYmxhbmsiPuC5',
  'hOC4n+C4peC5jCAnICsgKGkrMSkgKyAnPC9hPicpICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBvbmNsaWNrPSJkcm9wRmlsZShcJycgKyBrZXkgKyAnXCcsJyArIGkgKyAnKSIgdGl0bGU9IuC5gOC4reC4suC4reC4reC4gSIgJyArCiAgICAgICdzdHls',
  'ZT0icG9zaXRpb246YWJzb2x1dGU7dG9wOi02cHg7cmlnaHQ6LTZweDtiYWNrZ3JvdW5kOnZhcigtLWRhbmdlcik7Y29sb3I6I2ZmZjtib3JkZXI6MDtib3JkZXItcmFkaXVzOjk5cHg7d2lkdGg6MThweDtoZWlnaHQ6MThweDtsaW5lLWhlaWdodDoxO2N1cnNvcjpw',
  'b2ludGVyO2ZvbnQtc2l6ZToxMnB4Ij7DlzwvYnV0dG9uPicgKwogICAgICAnPC9zcGFuPic7CiAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gZHJvcEZpbGUoa2V5LCBpZHgpewogIEZPUk0ua2VlcFtrZXldLnNwbGljZShpZHgsIDEpOwogIGRv',
  'Y3VtZW50LmdldEVsZW1lbnRCeUlkKCdmXycgKyBrZXkgKyAnX2V4aXN0aW5nJykuaW5uZXJIVE1MID0gZXhpc3RpbmdGaWxlc0h0bWwoa2V5KTsKfQoKZnVuY3Rpb24gcHJldmlld1BpY2tlZChpbnB1dCwgaWQpewogIHZhciBib3ggPSBkb2N1bWVudC5nZXRFbGVt',
  'ZW50QnlJZChpZCArICdfcHJldmlldycpOwogIHZhciBmaWxlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGlucHV0LmZpbGVzIHx8IFtdKTsKICBib3guaW5uZXJIVE1MID0gZmlsZXMubWFwKGZ1bmN0aW9uKGYpewogICAgcmV0dXJuICc8c3BhbiBjbGFz',
  'cz0iYiBpbmZvIj4nICsgZXNjKGYubmFtZS5zbGljZSgwLDI2KSkgKyAnIMK3ICcgKyBNYXRoLnJvdW5kKGYuc2l6ZS8xMDI0KSArICcgS0I8L3NwYW4+JzsKICB9KS5qb2luKCcgJyk7CgogIHZhciBzbG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQgKyAn',
  'X29jcicpOwogIGlmICghc2xvdCkgcmV0dXJuOwogIHNsb3QuaW5uZXJIVE1MID0gJyc7CiAgaWYgKCFvY3JVc2FibGUoKSB8fCAhZmlyc3RSZWFkYWJsZShmaWxlcykpIHJldHVybjsKCiAgdmFyIG1vZGUgPSAoUy5ib290LnNldHRpbmdzICYmIFMuYm9vdC5zZXR0',
  'aW5ncy5vY3JBdXRvZmlsbCkgfHwgJ+C4luC4suC4oeC4geC5iOC4reC4meC5gOC4leC4tOC4oSc7CiAgaWYgKG1vZGUgPT09ICfguYTguKHguYjguYDguJXguLTguKEnKSByZXR1cm47CiAgaWYgKG1vZGUgPT09ICfguYDguJXguLTguKHguYPguKvguYnguYDguKXg',
  'uKInKSByZXR1cm4gcnVuT2NyKGlkLCB0cnVlKTsKCiAgc2xvdC5pbm5lckhUTUwgPQogICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIG10OCIgb25jbGljaz0icnVuT2NyKFwnJyArIGlkICsgJ1wnKSI+JyArCiAgICAn8J+UjiDguK3guYjg',
  'uLLguJnguILguYnguK3guITguKfguLLguKHguIjguLLguIHguKPguLnguJvguJnguLXguYkg4LmB4Lil4LmJ4Lin4LiK4LmI4Lin4Lii4LiB4Lij4Lit4LiB4LmD4Lir4LmJPC9idXR0b24+JzsKfQoKLyoqIOC4reC5iOC4suC4meC4hOC5iOC4suC4iOC4suC4geC4',
  'n+C4reC4o+C5jOC4oSArIOC4reC4seC4m+C5guC4q+C4peC4lOC5hOC4n+C4peC5jOC5g+C4q+C4oeC5iCDguYHguKXguYnguKfguITguLfguJkgb2JqZWN0IOC4nuC4o+C5ieC4reC4oeC4muC4seC4meC4l+C4tuC4gSAqLwpmdW5jdGlvbiByZWFkRm9ybShzcGVj',
  'cywgYnVja2V0KXsKICB2YXIgb3V0ID0ge307CiAgdmFyIHVwbG9hZHMgPSBbXTsKCiAgc3BlY3MuZm9yRWFjaChmdW5jdGlvbihmKXsKICAgIGlmIChmLnR5cGUgPT09ICdjb21wdXRlZCcpIHJldHVybjsgICAgICAgICAgLy8g4LiK4LmI4Lit4LiH4LiE4Liz4LiZ',
  '4Lin4LiTIOC5hOC4oeC5iOC4leC5ieC4reC4h+C4muC4seC4meC4l+C4tuC4gQogICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyArIGYua2V5KTsKICAgIGlmICghZWwpIHJldHVybjsKICAgIGlmIChmLnR5cGUgPT09ICdmaWxlcycpIHsK',
  'ICAgICAgdXBsb2Fkcy5wdXNoKAogICAgICAgIHVwbG9hZEZpbGVzKGVsLCBidWNrZXQpLnRoZW4oZnVuY3Rpb24ocmVmcyl7CiAgICAgICAgICBvdXRbZi5rZXldID0gKEZPUk0ua2VlcFtmLmtleV0gfHwgW10pLmNvbmNhdChyZWZzLm1hcChmdW5jdGlvbihyKXsg',
  'cmV0dXJuIHIudXJsOyB9KSk7CiAgICAgICAgfSkKICAgICAgKTsKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnbGluZXMnKSB7CiAgICAgIG91dFtmLmtleV0gPSBmb3JtYXRMaW5lc1RleHQoRk9STS5saW5lcyk7CiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0g',
  'J251bWJlcicgfHwgZi50eXBlID09PSAnbW9uZXknKSB7CiAgICAgIG91dFtmLmtleV0gPSBlbC52YWx1ZSA9PT0gJycgPyBudWxsIDogTnVtYmVyKGVsLnZhbHVlKTsKICAgIH0gZWxzZSB7CiAgICAgIG91dFtmLmtleV0gPSBlbC52YWx1ZTsKICAgIH0KICB9KTsK',
  'CiAgcmV0dXJuIFByb21pc2UuYWxsKHVwbG9hZHMpLnRoZW4oZnVuY3Rpb24oKXsgcmV0dXJuIG91dDsgfSk7Cn0KCi8qKiDguYLguITguKPguIfguJ/guK3guKPguYzguKHguKHguLLguJXguKPguJDguLLguJk6IOC5gOC4m+C4tOC4lCBtb2RhbCwg4LiI4Lix4LiU',
  '4LiB4Liy4Lij4Lib4Li44LmI4Lih4Lia4Lix4LiZ4LiX4Li24LiBLCDguKPguLXguYLguKvguKXguJTguKvguJnguYnguLIgKi8KZnVuY3Rpb24gb3BlbkZvcm0ob3B0cyl7CiAgdmFyIHJlYyA9IG9wdHMucmVjb3JkIHx8IHt9OwogIEZPUk0ub2NyID0gb3B0cy5v',
  'Y3IgfHwgbnVsbDsKICBGT1JNLnJlYyA9IHJlYy5pZCA/IHJlYyA6IG51bGw7ICAgLy8g4LiI4Liz4LmE4Lin4LmJ4Lin4LmI4Liy4LiB4Liz4Lil4Lix4LiH4LmB4LiB4LmJ4LiC4Lit4LiH4LmA4LiU4Li04LihIOC4q+C4o+C4t+C4reC4geC4s+C4peC4seC4h+C5',
  'gOC4nuC4tOC5iOC4oeC5g+C4q+C4oeC5iAogIG9wZW5Nb2RhbChvcHRzLnRpdGxlLAogICAgZmllbGRzSHRtbChvcHRzLmZpZWxkcywgcmVjKSwKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lii4LiB4LmA4Lil4Li04LiB',
  'PC9idXR0b24+JyArCiAgICAocmVjLmlkICYmIG9wdHMub25EZWxldGUgPyAnPGJ1dHRvbiBjbGFzcz0iYnRuIGRnciIgaWQ9ImZEZWwiPuC4peC4muC4o+C4suC4ouC4geC4suC4o+C4meC4teC5iTwvYnV0dG9uPicgOiAnJykgKwogICAgJzxidXR0b24gY2xhc3M9',
  'ImJ0biBwcmkiIGlkPSJmU2F2ZSI+JyArIChyZWMuaWQgPyAn4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4LmB4LiB4LmJ4LmE4LiCJyA6ICfguJrguLHguJnguJfguLbguIEnKSArICc8L2J1dHRvbj4nLAogICAgb3B0cy53aWRlKTsKCiAgaWYgKHJlYy5pZCAm',
  'JiBvcHRzLm9uRGVsZXRlKSB7CiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZkRlbCcpLm9uY2xpY2sgPSBmdW5jdGlvbigpeyBjbG9zZU1vZGFsKCk7IG9wdHMub25EZWxldGUocmVjLmlkKTsgfTsKICB9CgogIHJlY2FsY1N1bXMoKTsKICByZWNhbGNCaWxs',
  'KCk7CgogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmU2F2ZScpLm9uY2xpY2sgPSBmdW5jdGlvbigpewogICAgdmFyIGJ0biA9IHRoaXM7CiAgICBidG4uZGlzYWJsZWQgPSB0cnVlOwogICAgYnRuLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz0ic3BpbiI+PC9z',
  'cGFuPiDguIHguLPguKXguLHguIfguJrguLHguJnguJfguLbguIHigKYnOwoKICAgIHJlYWRGb3JtKG9wdHMuZmllbGRzLCBvcHRzLmJ1Y2tldCB8fCAnbWlzYycpLnRoZW4oZnVuY3Rpb24oZGF0YSl7CiAgICAgIHZhciBtaXNzaW5nID0gb3B0cy5maWVsZHMuZmls',
  'dGVyKGZ1bmN0aW9uKGYpewogICAgICAgIHJldHVybiBmLnJlcXVpcmVkICYmIChkYXRhW2Yua2V5XSA9PSBudWxsIHx8IGRhdGFbZi5rZXldID09PSAnJyk7CiAgICAgIH0pOwogICAgICBpZiAobWlzc2luZy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcign4LiB4Lij',
  '4Li44LiT4Liy4LiB4Lij4Lit4LiBOiAnICsgbWlzc2luZy5tYXAoZnVuY3Rpb24oZil7IHJldHVybiBmLmxhYmVsOyB9KS5qb2luKCcsICcpKTsKCiAgICAgIHZhciByZWNvcmQgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRzLmJhc2UgfHwge30sIGRhdGEpOwogICAg',
  'ICBpZiAocmVjLmlkKSByZWNvcmQuaWQgPSByZWMuaWQ7CiAgICAgIHJldHVybiBjYWxsQXBpKG9wdHMuYWN0aW9uLCBPYmplY3QuYXNzaWduKHsgcmVjb3JkOiByZWNvcmQgfSwgb3B0cy5leHRyYSB8fCB7fSkpOwogICAgfSkudGhlbihmdW5jdGlvbigpewogICAg',
  'ICBjbG9zZU1vZGFsKCk7CiAgICAgIC8vIOC4leC4seC4p+C4muC4reC4geC4quC4luC4suC4meC4sOC4oeC4uOC4oeC4guC4p+C4suC4muC4meC4guC4tuC5ieC4mSAi4Lia4Lix4LiZ4LiX4Li24LiB4LmB4Lil4LmJ4LinIiDguYPguKvguYnguK3guKLguLnguYjg',
  'uYHguKXguYnguKcg4LiI4Li24LiH4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LmA4LiU4LmJ4LiHIHRvYXN0IOC4i+C5ieC4swogICAgICAvLyDguYHguKXguYnguKfguIvguLTguIfguIHguYzguYDguIfguLXguKLguJog4LmGIOC5hOC4oeC5iOC4peC5ieC4suC4h+C4',
  'q+C4meC5ieC4suC5geC4peC4sOC5hOC4oeC5iOC5gOC4lOC5ieC4h+C4geC4peC4seC4muC5hOC4m+C4muC4meC4quC4uOC4lAogICAgICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgYnRuLmRpc2FibGVkID0g',
  'ZmFsc2U7CiAgICAgIGJ0bi50ZXh0Q29udGVudCA9IHJlYy5pZCA/ICfguJrguLHguJnguJfguLbguIHguIHguLLguKPguYHguIHguYnguYTguIInIDogJ+C4muC4seC4meC4l+C4tuC4gSc7CiAgICAgIHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7CiAgICB9',
  'KTsKICB9Owp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lit4LmI4Liy4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiI4Liy4LiB4Lij4Li54LibIChPQ1IpIOC5geC4peC5ieC4p+C4',
  'iuC5iOC4p+C4ouC4geC4o+C4reC4geC4n+C4reC4o+C5jOC4oQoKICAg4LiX4Li44LiB4LiE4LmI4Liy4LiX4Li14LmI4LmE4LiU4LmJ4LmA4Lib4LmH4LiZ4LmB4LiE4LmI4LiC4LmJ4Lit4LmA4Liq4LiZ4LitIOC4nOC4ueC5ieC5g+C4iuC5ieC4geC4lOC5gOC4',
  'leC4tOC4oeC5gOC4reC4h+C4l+C4teC4peC4sOC4iuC5iOC4reC4h+C4q+C4o+C4t+C4reC5gOC4leC4tOC4oeC4l+C4seC5ieC4h+C4q+C4oeC4lOC4geC5h+C5hOC4lOC5iQogICDguYHguKXguLDguYHguIHguYnguYTguILguJXguYjguK3guYTguJTguYnguYDg',
  'uKrguKHguK0g4LmA4Lie4Lij4Liy4Liw4LiV4Lix4Lin4Lit4LmI4Liy4LiZ4Lie4Lil4Liy4LiU4LmE4LiU4LmJIOC5guC4lOC4ouC5gOC4ieC4nuC4suC4sOC4peC4suC4ouC4oeC4t+C4reC4geC4seC4muC4o+C4ueC4m+C5gOC4reC4teC4ouC4hwogICA9PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCnZhciBPQ1JfTUFYID0gOCAqIDEwMjQgKiAxMDI0OyAgIC8vIOC4o+C4ueC4m+C5g+C4q+C4jeC5iOC4geC4p+C5iOC4suC4meC4teC5ieC4quC5iOC4h+C5',
  'hOC4m+C4reC5iOC4suC4meC5geC4peC5ieC4p+C4oeC4seC4geC4q+C4oeC4lOC5gOC4p+C4peC4sgoKZnVuY3Rpb24gb2NyVXNhYmxlKCl7CiAgcmV0dXJuICEhKEZPUk0ub2NyICYmIFMuYm9vdCAmJiBTLmJvb3Quc2V0dGluZ3MgJiYgUy5ib290LnNldHRpbmdz',
  'Lm9jckVuYWJsZWQpOwp9CgovKiog4Lij4Li54Lib4LmB4Lij4LiB4LiX4Li14LmI4Lie4Lit4Lit4LmI4Liy4LiZ4LmE4LiU4LmJICjguILguYnguLLguKHguYTguJ/guKXguYzguYPguKvguI3guYjguYDguIHguLTguJnguYHguKXguLDguYTguJ/guKXguYzguJfg',
  'uLXguYjguYTguKHguYjguYPguIrguYjguKPguLnguJsvUERGKSAqLwpmdW5jdGlvbiBmaXJzdFJlYWRhYmxlKGZpbGVzKXsKICBmb3IgKHZhciBpID0gMDsgaSA8IGZpbGVzLmxlbmd0aDsgaSsrKSB7CiAgICB2YXIgZiA9IGZpbGVzW2ldOwogICAgaWYgKGYuc2l6',
  'ZSA8PSBPQ1JfTUFYICYmIC9eaW1hZ2VcL3xwZGYkLy50ZXN0KGYudHlwZSB8fCAnJykpIHJldHVybiBmOwogIH0KICByZXR1cm4gbnVsbDsKfQoKLyoqCiAqIEBwYXJhbSB7c3RyaW5nfSBpZCAgaWQg4LiC4Lit4LiH4LiK4LmI4Lit4LiH4LmB4LiZ4Lia4LmE4Lif',
  '4Lil4LmMIOC5gOC4iuC5iOC4mSBmX3NsaXBzCiAqIEBwYXJhbSB7Ym9vbGVhbn0gYXV0byB0cnVlID0g4LmA4LiV4Li04Lih4LiK4LmI4Lit4LiH4LiX4Li14LmI4Lii4Lix4LiH4Lin4LmI4Liy4LiH4LmD4Lir4LmJ4LmA4Lil4Lii4LmC4LiU4Lii4LmE4Lih4LmI',
  '4LiV4LmJ4Lit4LiH4LiB4LiUCiAqLwpmdW5jdGlvbiBydW5PY3IoaWQsIGF1dG8pewogIHZhciBpbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTsKICB2YXIgc2xvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkICsgJ19vY3InKTsKICBpZiAo',
  'IWlucHV0IHx8ICFzbG90KSByZXR1cm47CgogIHZhciBmaWxlID0gZmlyc3RSZWFkYWJsZShBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChpbnB1dC5maWxlcyB8fCBbXSkpOwogIGlmICghZmlsZSkgeyBzbG90LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJoaW50',
  'IG10OCI+4LmE4Lih4LmI4Lih4Li14Lij4Li54Lib4LiX4Li14LmI4Lit4LmI4Liy4LiZ4LmE4LiU4LmJICjguKPguK3guIfguKPguLHguJrguKPguLnguJvguKDguLLguJ7guYHguKXguLAgUERGIOC5hOC4oeC5iOC5gOC4geC4tOC4mSA4IE1CKTwvZGl2Pic7IHJl',
  'dHVybjsgfQoKICBzbG90LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJvY3ItYm94Ij48ZGl2IGNsYXNzPSJoZCI+PHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4Lit4LmI4Liy4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiI4Liy4LiB',
  'ICcgKwogICAgICAgICAgICAgICAgICAgZXNjKGZpbGUubmFtZS5zbGljZSgwLCAyOCkpICsgJ+KApjwvZGl2PjwvZGl2Pic7CgogIHJlYWRBc0RhdGFVcmwoZmlsZSkudGhlbihmdW5jdGlvbihwKXsKICAgIHJldHVybiBjYWxsQXBpKCdvY3IucmVhZCcsIHsgZGF0',
  'YVVybDogcC5kYXRhVXJsLCBtaW1lVHlwZTogcC5taW1lVHlwZSB9KTsKICB9KS50aGVuKGZ1bmN0aW9uKHIpewogICAgc2xvdC5pbm5lckhUTUwgPSBvY3JCb3hIdG1sKGlkLCByKTsKICAgIE9DUl9MQVNUW2lkXSA9IHI7CiAgICBpZiAoYXV0bykgewogICAgICB2',
  'YXIgbiA9IG9jckFwcGx5QWxsKGlkLCB0cnVlKTsKICAgICAgdG9hc3QobiA/ICfguK3guYjguLLguJnguKPguLnguJvguYHguKXguYnguKcg4LmA4LiV4Li04Lih4LmD4Lir4LmJICcgKyBuICsgJyDguIrguYjguK3guIcg4oCUIOC4leC4o+C4p+C4iOC4lOC4ueC4',
  'geC5iOC4reC4meC4muC4seC4meC4l+C4tuC4geC4meC4sCcgOiAn4Lit4LmI4Liy4LiZ4Lij4Li54Lib4LmB4Lil4LmJ4LinIOC5geC4leC5iOC4ouC4seC4h+C4iOC4seC4muC4hOC5iOC4suC4l+C4teC5iOC5g+C4iuC5ieC5hOC4lOC5ieC5hOC4oeC5iOC5hOC4',
  'lOC5iScsIG4gPyAnb2snIDogJycpOwogICAgfQogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgc2xvdC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz0ib2NyLWJveCI+PGRpdiBjbGFzcz0iaGQiPuKaoO+4jyDguK3guYjguLLguJnguKPguLnguJvguYTguKHguYjg',
  'uKrguLPguYDguKPguYfguIg8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImhpbnQiPicgKyBlc2MoZS5tZXNzYWdlIHx8IGUpICsgJzwvZGl2PicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20gbXQ4IiBvbmNsaWNrPSJydW5P',
  'Y3IoXCcnICsgaWQgKyAnXCcpIj7guKXguK3guIfguK3guLXguIHguITguKPguLHguYnguIc8L2J1dHRvbj48L2Rpdj4nOwogIH0pOwp9Cgp2YXIgT0NSX0xBU1QgPSB7fTsKCi8qKiDguITguYjguLLguJfguLXguYjguK3guYjguLLguJnguYTguJTguYkg4LiE4Li5',
  '4LmI4LiB4Lix4Lia4LiK4LmI4Lit4LiH4LmD4LiZ4Lif4Lit4Lij4LmM4Lih4LiX4Li14LmI4LiI4Liw4LmA4Lit4Liy4LmE4Lib4LmD4Liq4LmIICovCmZ1bmN0aW9uIG9jclBhaXJzKHIpewogIHZhciBtID0gRk9STS5vY3IgfHwge307CiAgdmFyIGcgPSByLmd1',
  'ZXNzIHx8IHt9OwogIHZhciBvdXQgPSBbXTsKICBpZiAobS5kYXRlICAgJiYgZy5kYXRlKSAgIG91dC5wdXNoKHsgZmllbGQ6IG0uZGF0ZSwgICBsYWJlbDogJ+C4p+C4seC4meC4l+C4teC5iCcsICAgICB2YWx1ZTogZy5kYXRlLCAgIHNob3c6IHRoRGF0ZShnLmRh',
  'dGUpIH0pOwogIGlmIChtLmFtb3VudCAmJiBnLmFtb3VudCkgb3V0LnB1c2goeyBmaWVsZDogbS5hbW91bnQsIGxhYmVsOiAn4LiI4Liz4LiZ4Lin4LiZ4LmA4LiH4Li04LiZJywgIHZhbHVlOiBnLmFtb3VudCwgc2hvdzogYmFodChnLmFtb3VudCkgfSk7CiAgaWYg',
  'KG0udmVuZG9yICYmIGcudmVuZG9yKSBvdXQucHVzaCh7IGZpZWxkOiBtLnZlbmRvciwgbGFiZWw6ICfguKPguYnguLLguJkv4Lic4Li54LmJ4LiC4Liy4LiiJywgdmFsdWU6IGcudmVuZG9yLCBzaG93OiBnLnZlbmRvciB9KTsKICBpZiAobS50aXRsZSAgJiYgZy50',
  'aXRsZSkgIG91dC5wdXNoKHsgZmllbGQ6IG0udGl0bGUsICBsYWJlbDogJ+C4iuC4t+C5iOC4reC4o+C4suC4ouC4geC4suC4oycsICB2YWx1ZTogZy50aXRsZSwgIHNob3c6IGcudGl0bGUgfSk7CiAgaWYgKG0ubm90ZSAgICYmIGcucmVmKSAgICBvdXQucHVzaCh7',
  'IGZpZWxkOiBtLm5vdGUsICAgbGFiZWw6ICfguYDguKXguILguK3guYnguLLguIfguK3guLTguIcnLCAgdmFsdWU6ICfguK3guYnguLLguIfguK3guLTguIcgJyArIGcucmVmLCBzaG93OiBnLnJlZiB9KTsKICAvLyDguYPguJrguYDguKrguKPguYfguIjguKvguKXg',
  'uLLguKLguKPguLLguKLguIHguLLguKMKICBpZiAoZy5pdGVtcyAmJiBnLml0ZW1zLmxlbmd0aCA+IDEpIHsKICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9saW5lcycpKSB7CiAgICAgIC8vIOC4n+C4reC4o+C5jOC4oeC4meC4teC5ieC4oeC4teC4',
  'leC4suC4o+C4suC4h+C4o+C4suC4ouC4geC4suC4o+C4ouC5iOC4reC4oiDigJQg4LmA4LiV4Li04Lih4Lil4LiH4LiV4Liy4Lij4Liy4LiH4LmA4Lil4LiiIOC5hOC4lOC5ieC4l+C4seC5ieC4h+C4iuC4t+C5iOC4rSDguIjguLPguJnguKfguJkg4LmB4Lil4Liw',
  '4Lij4Liy4LiE4Liy4LmB4Lii4LiB4LiB4Lix4LiZCiAgICAgIG91dC5wdXNoKHsgZmllbGQ6ICdfbGluZXMnLCBsYWJlbDogJ+C4o+C4suC4ouC4geC4suC4o+C5g+C4meC4muC4tOC4pScsIHZhbHVlOiBnLml0ZW1zLAogICAgICAgICAgICAgICAgIHNob3c6ICfg',
  'uYDguJXguLTguKEgJyArIGcuaXRlbXMubGVuZ3RoICsgJyDguKPguLLguKLguIHguLLguKPguKXguIfguJXguLLguKPguLLguIcnLCBsaW5lczogdHJ1ZSB9KTsKICAgIH0gZWxzZSBpZiAobS50aXRsZSkgewogICAgICB2YXIgbGluZXMgPSBnLml0ZW1zLm1hcChm',
  'dW5jdGlvbihpdCwgaSl7IHJldHVybiAoaSsxKSArICcuJyArIGl0Lm5hbWUgKyAnICcgKyBtb25leShpdC5wcmljZSwgMikgKyAnIOC4vyc7IH0pLmpvaW4oJ1xuJyk7CiAgICAgIG91dC5wdXNoKHsgZmllbGQ6IG0udGl0bGUsIGxhYmVsOiAn4LiX4Li44LiB4Lij',
  '4Liy4Lii4LiB4Liy4LijICgnICsgZy5pdGVtcy5sZW5ndGggKyAnKScsIHZhbHVlOiBsaW5lcywKICAgICAgICAgICAgICAgICBzaG93OiBnLml0ZW1zLmxlbmd0aCArICcg4Lij4Liy4Lii4LiB4Liy4Lij4LmD4LiZ4LmD4Lia4LmA4Liq4Lij4LmH4LiIJywgbXVs',
  'dGk6IHRydWUgfSk7CiAgICB9CiAgfQogIHJldHVybiBvdXQ7Cn0KCmZ1bmN0aW9uIG9jckJveEh0bWwoaWQsIHIpewogIHZhciBwYWlycyA9IG9jclBhaXJzKHIpOwogIGlmICghcGFpcnMubGVuZ3RoKSB7CiAgICByZXR1cm4gJzxkaXYgY2xhc3M9Im9jci1ib3gi',
  'PjxkaXYgY2xhc3M9ImhkIj7wn5SOIOC4reC5iOC4suC4meC4guC5ieC4reC4hOC4p+C4suC4oeC5hOC4lOC5iSDguYHguJXguYjguKLguLHguIfguIjguLHguJrguITguYjguLLguJfguLXguYjguYPguIrguYnguYTguJTguYnguYTguKHguYjguYTguJTguYknICsK',
  'ICAgICAgJzxzcGFuIGNsYXNzPSJzcCI+PGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9Im9jclRvZ2dsZVJhdyhcJycgKyBpZCArICdcJykiPuC4lOC4ueC4guC5ieC4reC4hOC4p+C4suC4oeC4l+C4teC5iOC4reC5iOC4suC4meC5',
  'hOC4lOC5iTwvYnV0dG9uPjwvc3Bhbj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9Im9jci1yYXciIGlkPSInICsgaWQgKyAnX3JhdyIgaGlkZGVuPicgKyBlc2Moci50ZXh0IHx8ICco4Lin4LmI4Liy4LiHKScpICsgJzwvZGl2PjwvZGl2Pic7CiAgfQogIHJl',
  'dHVybiAnPGRpdiBjbGFzcz0ib2NyLWJveCI+JyArCiAgICAnPGRpdiBjbGFzcz0iaGQiPvCflI4g4Lit4LmI4Liy4LiZ4LiI4Liy4LiB4Lij4Li54Lib4LmE4LiU4LmJ4LmB4Lia4Lia4LiZ4Li14LmJIOKAlCDguIHguJTguYDguJXguLTguKHguIrguYjguK3guIfg',
  'uJfguLXguYjguJXguYnguK3guIfguIHguLLguKMnICsKICAgICAgJzxzcGFuIGNsYXNzPSJzcCI+JyArCiAgICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIHByaSIgb25jbGljaz0ib2NyQXBwbHlBbGwoXCcnICsgaWQgKyAnXCcpIj7g',
  'uYDguJXguLTguKHguJfguLHguYnguIfguKvguKHguJQ8L2J1dHRvbj4nICsKICAgICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9Im9jclRvZ2dsZVJhdyhcJycgKyBpZCArICdcJykiPuC4guC5ieC4reC4hOC4p+C4suC4',
  'oeC5gOC4leC5h+C4oTwvYnV0dG9uPicgKwogICAgICAnPC9zcGFuPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9Im9jci1oaXRzIj4nICsgcGFpcnMubWFwKGZ1bmN0aW9uKHAsIGkpewogICAgICByZXR1cm4gJzxkaXYgY2xhc3M9Im9jci1oaXQiPicgKwogICAg',
  'ICAgICc8c3BhbiBjbGFzcz0iayI+JyArIGVzYyhwLmxhYmVsKSArICc8L3NwYW4+JyArCiAgICAgICAgJzxzcGFuIGNsYXNzPSJ2IiB0aXRsZT0iJyArIGVzYyhwLmxpbmVzID8gcC5zaG93IDogU3RyaW5nKHAudmFsdWUpKSArICciPicgKyBlc2MocC5zaG93KSAr',
  'ICc8L3NwYW4+JyArCiAgICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJvY3JBcHBseU9uZShcJycgKyBpZCArICdcJywnICsgaSArICcpIj7guYDguJXguLTguKE8L2J1dHRvbj4nICsKICAgICAgJzwvZGl2Pic7CiAg',
  'ICB9KS5qb2luKCcnKSArICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJvY3ItcmF3IiBpZD0iJyArIGlkICsgJ19yYXciIGhpZGRlbj4nICsgZXNjKHIudGV4dCB8fCAnKOC4p+C5iOC4suC4hyknKSArICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJoaW50',
  'IG10OCI+4LiV4Lij4Lin4LiI4LiE4Lin4Liy4Lih4LiW4Li54LiB4LiV4LmJ4Lit4LiH4LiB4LmI4Lit4LiZ4Lia4Lix4LiZ4LiX4Li24LiB4LmA4Liq4Lih4LitIOKAlCDguYHguIHguYnguYPguJnguIrguYjguK3guIfguYTguJTguYnguJXguLLguKHguJvguIHg',
  'uJXguLQ8L2Rpdj4nICsKICAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gb2NyVG9nZ2xlUmF3KGlkKXsKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCArICdfcmF3Jyk7CiAgaWYgKGVsKSBlbC5oaWRkZW4gPSAhZWwuaGlkZGVuOwp9CgovKiog4LmD',
  '4Liq4LmI4LiE4LmI4Liy4Lil4LiH4LiK4LmI4Lit4LiHIOC5geC4peC5ieC4p+C5hOC4ruC5hOC4peC4leC5jOC5g+C4q+C5ieC5gOC4q+C5h+C4meC4p+C5iOC4suC4iuC5iOC4reC4h+C5hOC4q+C4meC4luC4ueC4geC5gOC4leC4tOC4oSAqLwpmdW5jdGlvbiBv',
  'Y3JGaWxsKGZpZWxkS2V5LCB2YWx1ZSl7CiAgLy8g4LmA4LiV4Li04Lih4Lil4LiH4LiV4Liy4Lij4Liy4LiH4Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4LiiICjguYPguJrguYDguKrguKPguYfguIjguJfguLXguYjguKHguLXguILguK3guIfguKvguKXguLLg',
  'uKLguK3guKLguYjguLLguIcpCiAgaWYgKGZpZWxkS2V5ID09PSAnX2xpbmVzJykgewogICAgdmFyIGFkZCA9ICh2YWx1ZSB8fCBbXSkubWFwKGZ1bmN0aW9uKGl0KXsKICAgICAgcmV0dXJuIHsgbmFtZTogaXQubmFtZSwgcXR5OiAxLCB1bml0OiAnJywgcHJpY2U6',
  'IE51bWJlcihpdC5wcmljZSkgfHwgMCB9OwogICAgfSk7CiAgICBpZiAoIWFkZC5sZW5ndGgpIHJldHVybiBmYWxzZTsKICAgIEZPUk0ubGluZXMgPSAoRk9STS5saW5lcyB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uKGwpeyByZXR1cm4gU3RyaW5nKGwubmFtZSB8fCAn',
  'JykudHJpbSgpOyB9KS5jb25jYXQoYWRkKTsKICAgIHJlZHJhd0xpbmVzKCk7CiAgICB2YXIgYm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfbGluZXMnKTsKICAgIGlmIChib3gpIHsKICAgICAgYm94LmNsYXNzTGlzdC5hZGQoJ29jci1maWxsZWQnKTsK',
  'ICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyBib3guY2xhc3NMaXN0LnJlbW92ZSgnb2NyLWZpbGxlZCcpOyB9LCAxNjAwKTsKICAgIH0KICAgIHJldHVybiB0cnVlOwogIH0KCiAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyArIGZpZWxk',
  'S2V5KTsKICBpZiAoIWVsKSByZXR1cm4gZmFsc2U7CiAgZWwudmFsdWUgPSB2YWx1ZTsKICBlbC5jbGFzc0xpc3QuYWRkKCdvY3ItZmlsbGVkJyk7CiAgc2V0VGltZW91dChmdW5jdGlvbigpeyBlbC5jbGFzc0xpc3QucmVtb3ZlKCdvY3ItZmlsbGVkJyk7IH0sIDE2',
  'MDApOwogIHJlY2FsY1N1bXMoKTsKICByZXR1cm4gdHJ1ZTsKfQoKZnVuY3Rpb24gb2NyQXBwbHlPbmUoaWQsIGlkeCl7CiAgdmFyIHIgPSBPQ1JfTEFTVFtpZF07CiAgaWYgKCFyKSByZXR1cm47CiAgdmFyIHAgPSBvY3JQYWlycyhyKVtpZHhdOwogIGlmIChwICYm',
  'IG9jckZpbGwocC5maWVsZCwgcC52YWx1ZSkpIHsKICAgIHRvYXN0KHAubGluZXMgPyAn4LmA4LiV4Li04LihICcgKyBwLnZhbHVlLmxlbmd0aCArICcg4Lij4Liy4Lii4LiB4Liy4Lij4Lil4LiH4Lia4Li04Lil4LmB4Lil4LmJ4LinIOKAlCDguJXguKPguKfguIjg',
  'uIjguLPguJnguKfguJnguIHguLHguJrguKPguLLguITguLLguK3guLXguIHguITguKPguLHguYnguIcnIDogJ+C5gOC4leC4tOC4oScgKyBwLmxhYmVsICsgJ+C5geC4peC5ieC4pycsICdvaycpOwogIH0KfQoKLyoqCiAqIEBwYXJhbSB7Ym9vbGVhbn0gb25seUVt',
  'cHR5IHRydWUgPSDguYDguJXguLTguKHguYDguInguJ7guLLguLDguIrguYjguK3guIfguJfguLXguYjguKLguLHguIfguKfguYjguLLguIcgKOC5g+C4iuC5ieC4leC4reC4meC5gOC4leC4tOC4oeC4reC4seC4leC5guC4meC4oeC4seC4leC4tAogKiAgICAgICAg',
  'ICAgICAgICAgICAgICAgICAgICDguIjguLDguYTguJTguYnguYTguKHguYjguJfguLHguJrguKrguLTguYjguIfguJfguLXguYjguJzguLnguYnguYPguIrguYnguJ7guLTguKHguJ7guYzguYTguJvguYHguKXguYnguKcpCiAqIEByZXR1cm4ge251bWJlcn0g4LiI',
  '4Liz4LiZ4Lin4LiZ4LiK4LmI4Lit4LiH4LiX4Li14LmI4LmA4LiV4Li04Lih4LiI4Lij4Li04LiHCiAqLwpmdW5jdGlvbiBvY3JBcHBseUFsbChpZCwgb25seUVtcHR5KXsKICB2YXIgciA9IE9DUl9MQVNUW2lkXTsKICBpZiAoIXIpIHJldHVybiAwOwogIHZhciBk',
  'b25lID0ge307CiAgdmFyIG4gPSAwOwogIG9jclBhaXJzKHIpLmZvckVhY2goZnVuY3Rpb24ocCl7CiAgICBpZiAoZG9uZVtwLmZpZWxkXSkgcmV0dXJuOyAgICAgICAgICAgICAgICAgICAgICAgLy8g4LiK4LmI4Lit4LiH4LmA4LiU4Li14Lii4Lin4LiB4Lix4LiZ',
  '4LmA4LiV4Li04Lih4LiE4Lij4Lix4LmJ4LiH4LmA4LiU4Li14Lii4LinIOC5gOC4reC4suC4leC4seC4p+C5geC4o+C4gQogICAgaWYgKHAuZmllbGQgPT09ICdfbGluZXMnKSB7CiAgICAgIC8vIOC4leC4suC4o+C4suC4h+C4o+C4suC4ouC4geC4suC4o+C4ouC5',
  'iOC4reC4ojogIuC4p+C5iOC4suC4hyIg4Lir4Lih4Liy4Lii4LiW4Li24LiH4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4LiV4Lix4LmJ4LiH4LiK4Li34LmI4Lit4LmE4Lin4LmJCiAgICAgIGlmIChvbmx5RW1wdHkg',
  'JiYgKEZPUk0ubGluZXMgfHwgW10pLnNvbWUoZnVuY3Rpb24obCl7IHJldHVybiBTdHJpbmcobC5uYW1lIHx8ICcnKS50cmltKCk7IH0pKSByZXR1cm47CiAgICB9IGVsc2UgewogICAgICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl8nICsgcC5m',
  'aWVsZCk7CiAgICAgIGlmICghZWwpIHJldHVybjsKICAgICAgaWYgKG9ubHlFbXB0eSAmJiBTdHJpbmcoZWwudmFsdWUgfHwgJycpLnRyaW0oKSAhPT0gJycpIHJldHVybjsKICAgIH0KICAgIGlmIChvY3JGaWxsKHAuZmllbGQsIHAudmFsdWUpKSB7IGRvbmVbcC5m',
  'aWVsZF0gPSB0cnVlOyBuKys7IH0KICB9KTsKICBpZiAoIW9ubHlFbXB0eSkgdG9hc3QobiA/ICfguYDguJXguLTguKHguYPguKvguYkgJyArIG4gKyAnIOC4iuC5iOC4reC4h+C5geC4peC5ieC4pyDigJQg4LiV4Lij4Lin4LiI4LiU4Li54LiB4LmI4Lit4LiZ4Lia',
  '4Lix4LiZ4LiX4Li24LiBJyA6ICfguIrguYjguK3guIfguJfguLXguYjguIjguLDguYDguJXguLTguKHguYTguKHguYjguK3guKLguLnguYjguYPguJnguJ/guK3guKPguYzguKHguJnguLXguYknLCBuID8gJ29rJyA6ICdlcnInKTsKICByZXR1cm4gbjsKfQoKZnVu',
  'Y3Rpb24gcm9vbU9wdGlvbnMoKXsgcmV0dXJuIFMuYm9vdCA/IFMuYm9vdC5yb29tcyA6IFtdOyB9CmZ1bmN0aW9uIG9wdChuYW1lKXsgcmV0dXJuIChTLmJvb3QgJiYgUy5ib290LnNjaGVtYVtuYW1lXSkgfHwgW107IH0KZnVuY3Rpb24gdG9kYXkoKXsgcmV0dXJu',
  'IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zbGljZSgwLDEwKTsgfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJ',
  'CiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtRGVidChyZWMsIGxlZGdlcil7CiAgLy8g4LmA4Lil4Li34Lit4LiB4LmB4Lih4LmI4LmE4LiU4LmJ4LiI4Liy4LiB4LiX',
  '4Li44LiB4Lia4Lix4LiN4LiK4Li1IOC4ouC4geC5gOC4p+C5ieC4meC4leC4seC4p+C5gOC4reC4hwogIHZhciBhbGwgPSAoQUxMX0RFQlRTIHx8IFtdKS5maWx0ZXIoZnVuY3Rpb24oZCl7IHJldHVybiAhcmVjIHx8IGQuaWQgIT09IHJlYy5pZDsgfSk7CiAgb3Bl',
  'bkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJJyA6ICfguYDguJ7guLTguYjguKHguIHguYnguK3guJnguKvguJnguLXguYknLAogICAgcmVjb3JkOiByZWMsIGFjdGlvbjogJ2Rl',
  'YnQuc2F2ZScsIGJhc2U6IHsgbGVkZ2VyOiBsZWRnZXIgfSwKICAgIG9uRGVsZXRlOiBkZWxEZWJ0LAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oid0aXRsZScsICAgIGxhYmVsOifguKPguLLguKLguIHguLLguKPguKvguJnguLXguYknLCByZXF1aXJlZDp0cnVl',
  'LCBmdWxsOnRydWUsIHBoOifguYDguIrguYjguJkg4LiE4LmI4Liy4LiB4LmI4Lit4Liq4Lij4LmJ4Liy4LiHIFRoZSBNIENvcm5lciBBUCcgfSwKICAgICAgeyBrZXk6J2xlZGdlcicsICAgbGFiZWw6J+C4m+C4o+C4sOC5gOC4oOC4l+C4muC4seC4jeC4iuC4tScs',
  'IHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6WyfguKvguJnguLXguYnguKvguKXguLHguIEnLCfguKvguJnguLXguYnguKPguK3guIcnXSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J2NyZWRpdG9yJywgbGFiZWw6J+C5gOC4iOC5ieC4suC4q+C4meC4teC5iScs',
  'IHBoOifguYDguIrguYjguJkg4LiE4Lij4Lit4Lia4LiE4Lij4Lix4LinIC8g4LiY4LiZ4Liy4LiE4Liy4LijIC8g4Lib4LmJ4Liy4LiV4LiyJyB9LAogICAgICB7IGtleToncGFyZW50SWQnLCBsYWJlbDon4LmA4Lib4LmH4LiZ4Liq4LmI4Lin4LiZ4Lir4LiZ4Li2',
  '4LmI4LiH4LiC4Lit4LiH4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJJywgdHlwZTonc2VsZWN0JywgZnVsbDp0cnVlLAogICAgICAgIG9wdGlvbnM6IGFsbC5tYXAoZnVuY3Rpb24oZCl7IHJldHVybiB7IHZhbHVlOmQuaWQsIGxhYmVsOmQudGl0bGUgKyAnICgnICsg',
  'ZC5sZWRnZXIgKyAnKScgfTsgfSksCiAgICAgICAgaGludDon4LmD4LiK4LmJ4LmA4Lih4Li34LmI4Lit4LmA4LiH4Li04LiZ4LiB4LmJ4Lit4LiZ4LiZ4Li14LmJ4LmA4Lib4LmH4LiZ4LiX4Li44LiZ4LiC4Lit4LiH4Lit4Li14LiB4LiB4LmJ4Lit4LiZIOC5gOC4',
  'iuC5iOC4mSDguYDguIfguLTguJnguKLguLfguKHguJvguYnguLLguJXguLLguYDguJvguYfguJnguKrguYjguKfguJnguKvguJnguLbguYjguIfguILguK3guIfguKvguJnguLXguYnguIvguLfguYnguK3guJfguLXguYjguJTguLTguJkg4oCUICcgKwogICAgICAg',
  'ICAgICAgJ+C4iOC5iOC4suC4ouC4hOC4t+C4meC4geC5ieC4reC4meC4meC4teC5ieC5geC4peC5ieC4p+C4geC5ieC4reC4meC5geC4oeC5iOC4iOC4sOC4peC4lOC4leC4suC4oeC5hOC4m+C4lOC5ieC4p+C4oiDguYHguKXguLDguKLguK3guJTguKPguKfguKHg',
  'uIjguLDguYTguKHguYjguJbguLnguIHguJnguLHguJrguIvguYnguLMnIH0sCiAgICAgIHsga2V5OidzdGFydERhdGUnLCBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiB4LmI4Lit4Lir4LiZ4Li14LmJJywgdHlwZTonZGF0ZScgfSwKICAgICAgeyBrZXk6J3By',
  'aW5jaXBhbCcsIGxhYmVsOifguKLguK3guJTguKvguJnguLXguYnguJXguLHguYnguIfguJXguYnguJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHJlcXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J2ludGVyZXN0UGVyTW9udGgnLCBsYWJlbDon4LiU4Lit',
  '4LiB4LmA4Lia4Li14LmJ4Lii4LiV4LmI4Lit4LmA4LiU4Li34Lit4LiZICjguJrguLLguJcpJywgdHlwZTonbW9uZXknIH0sCiAgICAgIHsga2V5OidwbGFuUGVyTW9udGgnLCBsYWJlbDon4Lii4Lit4LiU4Lic4LmI4Lit4LiZ4LiV4LmI4Lit4LmA4LiU4Li34Lit',
  '4LiZICjguJrguLLguJcpJywgdHlwZTonbW9uZXknIH0sCiAgICAgIHsga2V5OidkdWVEYXknLCAgIGxhYmVsOifguIHguLPguKvguJnguJTguIrguLPguKPguLAgKOC4p+C4seC4meC4l+C4teC5iOC4guC4reC4h+C5gOC4lOC4t+C4reC4mSknLCB0eXBlOidudW1i',
  'ZXInLCBwaDonMjAnIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCAgIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnZGVidFN0YXR1c2VzJyksIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICAgIGxh',
  'YmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7CiAgaWYgKCFyZWMpIHsgdmFyIGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9sZWRnZXInKTsgaWYgKGUpIGUudmFsdWUgPSBs',
  'ZWRnZXI7IH0KfQoKZnVuY3Rpb24gZGVsRGVidChpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJ4LiZ4Li14LmJPyDguKPguLLguKLguIHguLLguKPguIrguLPguKPguLDguJfguLXguYjguJzguLnguIHguYTguKfguYng',
  'uIjguLDguKLguLHguIfguK3guKLguLnguYgnLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgnZGVidC5kZWxldGUnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKHsgcXVpZXQ6IHRydWUg',
  'fSk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3guKPg',
  'uYzguKE6IOC4o+C4suC4ouC4geC4suC4o+C5guC4reC4meC5g+C4iuC5ieC4q+C4meC4teC5iQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybURlYnRQYXltZW50KHJl',
  'YywgbGVkZ2VyKXsKICB2YXIgZGVidHMgPSAoUy5jYWNoZVtTLnBhZ2VdICYmIFMuY2FjaGVbUy5wYWdlXS5kZWJ0cykgfHwgW107CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4Lij4Liy4Lii4LiB4Liy4Lij',
  '4LiK4Liz4Lij4LiwJyA6ICfguJrguLHguJnguJfguLbguIHguIHguLLguKPguYLguK3guJnguYPguIrguYnguKvguJnguLXguYknLAogICAgcmVjb3JkOiByZWMgfHwgeyBwYXlEYXRlOiB0b2RheSgpLCBjaGFubmVsOiAn4LmC4Lit4LiZIFFSJyB9LAogICAgYWN0',
  'aW9uOiAnZGVidC5zYXZlUGF5bWVudCcsIGJhc2U6IHsgbGVkZ2VyOiBsZWRnZXIgfSwgYnVja2V0OiAnZGVidCcsCiAgICBvY3I6IHsgZGF0ZToncGF5RGF0ZScsIGFtb3VudDoncHJpbmNpcGFsJywgbm90ZTonbm90ZScgfSwKICAgIG9uRGVsZXRlOiBkZWxEZWJ0',
  'UGF5bWVudCwKICAgIGZpZWxkczogWwogICAgICB7IGtleToncGF5RGF0ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguIrguLPguKPguLAnLCB0eXBlOidkYXRlJywgcmVxdWlyZWQ6dHJ1ZSB9LAogICAgICB7IGtleTonY2hhbm5lbCcsIGxhYmVsOifguIrg',
  'uYjguK3guIfguJfguLLguIcnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncGF5Q2hhbm5lbHMnKSB9LAogICAgICB7IGtleToncHJpbmNpcGFsJywgbGFiZWw6J+C5gOC4h+C4tOC4meC4leC5ieC4mSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5Jywgc3Vt',
  'czp0cnVlLAogICAgICAgIGhpbnQ6J+C4quC5iOC4p+C4meC4l+C4teC5iOC5hOC4m+C4peC4lOC4ouC4reC4lOC4q+C4meC4teC5ieC4iOC4o+C4tOC4hycgfSwKICAgICAgeyBrZXk6J2ludGVyZXN0JywgIGxhYmVsOifguJTguK3guIHguYDguJrguLXguYnguKIg',
  'KOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHN1bXM6dHJ1ZSwKICAgICAgICBoaW50OifguYTguKHguYjguJbguLnguIHguJnguLPguYTguJvguKXguJTguKLguK3guJTguKvguJnguLXguYknIH0sCiAgICAgIHsga2V5OidfdG90YWwnLCAgbGFiZWw6J+C4o+C4',
  'p+C4oeC4l+C4teC5iOC5guC4reC4mScsIHR5cGU6J2NvbXB1dGVkJywgZnJvbTpbJ3ByaW5jaXBhbCcsJ2ludGVyZXN0J10sCiAgICAgICAgaGludDon4LiV4Lij4Lin4LiI4LmD4Lir4LmJ4LiV4Lij4LiH4LiB4Lix4Lia4Lii4Lit4LiU4LmD4LiZ4Liq4Lil4Li0',
  '4LibIMK3IOC4o+C4sOC4muC4muC4hOC4tOC4lOC5g+C4q+C5ieC4reC4seC4leC5guC4meC4oeC4seC4leC4tCcgfSwKICAgICAgeyBrZXk6J2luc3RhbGxtZW50JywgbGFiZWw6J+C4h+C4p+C4lOC4l+C4teC5iCcsIHBoOifguYDguIrguYjguJkgOS8yNTY5JyB9',
  'LAogICAgICB7IGtleTonZGVidElkJywgIGxhYmVsOifguJzguLnguIHguIHguLHguJrguIHguYnguK3guJnguKvguJnguLXguYknLCB0eXBlOidzZWxlY3QnLAogICAgICAgIG9wdGlvbnM6IGRlYnRzLm1hcChmdW5jdGlvbihkKXsgcmV0dXJuIHsgdmFsdWU6ZC5p',
  'ZCwgbGFiZWw6ZC50aXRsZSB9OyB9KSwKICAgICAgICBoaW50OifguYDguKfguYnguJnguKfguYjguLLguIfguYTguJTguYkg4oCUIOC4o+C4sOC4muC4muC4iOC4sOC4meC4seC4muC4o+C4p+C4oeC4l+C4seC5ieC4h+C4muC4seC4jeC4iuC4tScgfSwKICAgICAg',
  'eyBrZXk6J3BheWVyJywgICBsYWJlbDon4Lic4Li54LmJ4LiK4Liz4Lij4LiwJyB9LAogICAgICB7IGtleTonc2xpcHMnLCAgIGxhYmVsOifguKrguKXguLTguJvguIHguLLguKPguYLguK3guJknLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtl',
  'eTonbm90ZScsICAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbERlYnRQYXltZW50KGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguKPguLLg',
  'uKLguIHguLLguKPguIrguLPguKPguLDguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2RlYnQuZGVsZXRlUGF5bWVudCcsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQo',
  'eyBxdWlldDogdHJ1ZSB9KTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'CiAgIOC4n+C4reC4o+C5jOC4oTog4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtUHVyY2hhc2Uo',
  'cmVjKXsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguKPguLLguKLguIHguLLguKPguIvguLfguYnguK0nIDogJ+C5gOC4nuC4tOC5iOC4oeC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4',
  'hycsCiAgICByZWNvcmQ6IHJlYyB8fCB7IGJ1eURhdGU6IHRvZGF5KCkgfSwKICAgIGFjdGlvbjogJ3B1cmNoYXNlLnNhdmUnLCBidWNrZXQ6ICdwdXJjaGFzZXMnLCB3aWRlOiB0cnVlLAogICAgb2NyOiB7IGRhdGU6J2J1eURhdGUnLCBhbW91bnQ6J3ByaWNlJywg',
  'dmVuZG9yOid2ZW5kb3InLCB0aXRsZTonaXRlbScgfSwKICAgIG9uRGVsZXRlOiBkZWxQdXJjaGFzZSwKICAgIGZpZWxkczogWwogICAgICB7IGtleTonaXRlbScsICAgIGxhYmVsOifguIrguLfguYjguK3guJrguLTguKUgLyDguKPguLLguKLguIHguLLguKPguKvg',
  'uKXguLHguIEnLCB0eXBlOid0ZXh0YXJlYScsIHJlcXVpcmVkOnRydWUsIGZ1bGw6dHJ1ZSwKICAgICAgICBwaDon4LmA4LiK4LmI4LiZIOC4quC4seC5iOC4h+C4guC4reC4h+C5gOC4guC5ieC4suC4q+C4rSBTaG9wZWUg4Lij4LmJ4Liy4LiZIEFCQycsCiAgICAg',
  'ICAgaGludDon4LiW4LmJ4Liy4LmD4Liq4LmI4Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4Lii4LiC4LmJ4Liy4LiH4Lil4LmI4Liy4LiH4LmE4Lin4LmJIOC5geC4peC5ieC4p+C5gOC4p+C5ieC4meC4iuC5iOC4reC4h+C4meC4teC5ieC4p+C5iOC4suC4hyDg',
  'uKPguLDguJrguJrguIjguLDguJXguLHguYnguIfguIrguLfguYjguK3guYPguKvguYnguYDguK3guIfguIjguLLguIHguKPguLLguKLguIHguLLguKPguYHguKPguIEnIH0sCiAgICAgIHsga2V5OididXlEYXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4',
  'i+C4t+C5ieC4rScsIHR5cGU6J2RhdGUnLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidjYXRlZ29yeScsIGxhYmVsOifguKvguKHguKfguJTguKvguKHguLnguYgnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncHVyY2hhc2VDYXRlZ29yaWVzJykg',
  'fSwKCiAgICAgIHsga2V5OidsaW5lcycsICAgbGFiZWw6J+C4o+C4suC4ouC4geC4suC4o+C5g+C4meC4muC4tOC4pSAo4LiL4Li34LmJ4Lit4LiX4Li14LmA4LiU4Li14Lii4Lin4Lir4Lil4Liy4Lii4Lit4Lii4LmI4Liy4LiH4LmD4Liq4LmI4LiV4Lij4LiH4LiZ',
  '4Li14LmJKScsIHR5cGU6J2xpbmVzJywgZnVsbDp0cnVlLAogICAgICAgIGhpbnQ6J+C4quC4seC5iOC4h+C4reC4reC4meC5hOC4peC4meC5jOC4hOC4o+C4seC5ieC4h+C5gOC4lOC4teC4ouC4p+C5hOC4lOC5ieC4guC4reC4h+C4q+C4peC4suC4ouC4reC4ouC5',
  'iOC4suC4hyDguYPguKrguYjguYHguKLguIHguJfguLXguKXguLDguKPguLLguKLguIHguLLguKPguYTguJTguYnguYDguKXguKIgwrcg4Lij4Liw4Lia4Lia4Lij4Lin4Lih4Lij4Liy4LiE4Liy4LmD4Lir4LmJ4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0JyB9',
  'LAogICAgICB7IGtleTonc2hpcHBpbmcnLCBsYWJlbDon4LiE4LmI4Liy4Liq4LmI4LiHICjguJrguLLguJcpJywgdHlwZTonbW9uZXknLCBwaDonMCcsIG9uaW5wdXQ6J3JlY2FsY0JpbGwoKScgfSwKICAgICAgeyBrZXk6J2Rpc2NvdW50JywgbGFiZWw6J+C4quC5',
  'iOC4p+C4meC4peC4lCAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JywgcGg6JzAnLCBvbmlucHV0OidyZWNhbGNCaWxsKCknIH0sCiAgICAgIHsga2V5OidwcmljZScsICAgbGFiZWw6J+C4o+C4suC4hOC4suC4o+C4p+C4oeC4l+C4seC5ieC4h+C4muC4tOC4pSAo',
  '4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JywgcmVxdWlyZWQ6dHJ1ZSwKICAgICAgICBoaW50Oic8c3BhbiBpZD0iYmlsbEhpbnQiPjwvc3Bhbj4nIH0sCiAgICAgIHsga2V5OidvcmRlck5vJywgbGFiZWw6J+C5gOC4peC4guC4l+C4teC5iOC4hOC4s+C4quC4seC5',
  'iOC4h+C4i+C4t+C5ieC4rScsIHBoOifguYDguKXguILguK3guK3guKPguYzguYDguJTguK3guKPguYzguIjguLLguIEgU2hvcGVlIC8gTGF6YWRhJyB9LAogICAgICB7IGtleTondmVuZG9yJywgIGxhYmVsOifguYHguKvguKXguYjguIfguJfguLXguYjguIvguLfg',
  'uYnguK0nLCBwaDonU2hvcGVlIC8g4LmE4LiX4Lin4Lix4Liq4LiU4Li4IC8g4Lij4LmJ4Liy4LiZ4oCmJyB9LAogICAgICB7IGtleToncGF5ZXInLCAgIGxhYmVsOifguJzguLnguYnguIrguLPguKPguLAnIH0sCiAgICAgIHsga2V5Oid3YXJyYW50eU1vbnRocycs',
  'IGxhYmVsOifguKPguLDguKLguLDguYDguKfguKXguLLguKPguLHguJrguJvguKPguLDguIHguLHguJkgKOC5gOC4lOC4t+C4reC4mSknLCB0eXBlOidudW1iZXInLAogICAgICAgIGhpbnQ6J+C4o+C4sOC4muC4muC4iOC4sOC4hOC4s+C4meC4p+C4k+C4p+C4seC4',
  'meC4q+C4oeC4lOC4m+C4o+C4sOC4geC4seC4meC5g+C4q+C5ieC4reC4seC4leC5guC4meC4oeC4seC4leC4tCcgfSwKICAgICAgeyBrZXk6J3Jvb20nLCAgICBsYWJlbDon4Lir4LmJ4Lit4LiHL+C4nuC4t+C5ieC4meC4l+C4teC5iOC4l+C4teC5iOC5g+C4iuC5',
  'iScsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6WyfguKrguYjguKfguJnguIHguKXguLLguIcnXS5jb25jYXQocm9vbU9wdGlvbnMoKSkgfSwKICAgICAgeyBrZXk6J3Bob3RvcycsICBsYWJlbDon4Lig4Liy4Lie4Lib4Lij4Liw4LiB4Lit4Lia4Liq4Li04LiZ4LiE',
  '4LmJ4LiyJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J3NsaXBzJywgICBsYWJlbDon4Liq4Lil4Li04Lib4LiB4Liy4Lij4LmC4Lit4LiZ4LiK4Liz4Lij4LiwJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6',
  'J25vdGUnLCAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxQdXJjaGFzZShpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4Lij4Liy4Lii4LiB',
  '4Liy4Lij4LiL4Li34LmJ4Lit4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdwdXJjaGFzZS5kZWxldGUnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKHsgcXVpZXQ6',
  'IHRydWUgfSk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/g',
  'uK3guKPguYzguKE6IOC4peC5ieC4suC4h+C5geC4reC4o+C5jAogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybUFjKHJlYyl7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6',
  'IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4Lij4Liy4Lii4LiB4Liy4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJyA6ICfguJrguLHguJnguJfguLbguIHguIHguLLguKPguKXguYnguLLguIfguYHguK3guKPguYwnLAogICAgcmVjb3JkOiByZWMg',
  'fHwgeyBib29rRGF0ZTogdG9kYXkoKSB9LAogICAgYWN0aW9uOiAnYWMuc2F2ZScsIGJ1Y2tldDogJ2FjJywKICAgIG9jcjogeyBkYXRlOidzZXJ2aWNlRGF0ZScsIGFtb3VudDonY29zdCcsIHZlbmRvcjondGVjaG5pY2lhbicgfSwKICAgIG9uRGVsZXRlOiBkZWxB',
  'YywKICAgIGZpZWxkczogWwogICAgICB7IGtleToncm9vbScsICAgICAgICBsYWJlbDon4Lir4LmJ4Lit4LiHJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpyb29tT3B0aW9ucygpLCByZXF1aXJlZDp0cnVlLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleToncm91',
  'bmQnLCAgICAgICBsYWJlbDon4Lij4Lit4Lia4LiX4Li14LmIJywgdHlwZTonbnVtYmVyJywgaGludDon4LmA4Lin4LmJ4LiZ4Lin4LmI4Liy4LiH4LmD4Lir4LmJ4Lij4Liw4Lia4Lia4LiZ4Lix4Lia4LiV4LmI4Lit4LiI4Liy4LiB4Lij4Lit4Lia4Lil4LmI4Liy',
  '4Liq4Li44LiU4LiC4Lit4LiH4Lib4Li14LiZ4Lix4LmJ4LiZJyB9LAogICAgICB7IGtleTonYm9va0RhdGUnLCAgICBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiZ4Lix4LiU4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJywgdHlwZTonZGF0ZScgfSwKICAgICAg',
  'eyBrZXk6J3NlcnZpY2VEYXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4lOC4s+C5gOC4meC4tOC4meC4geC4suC4o+C4iOC4o+C4tOC4hycsIHR5cGU6J2RhdGUnLCBoaW50OifguIHguKPguK3guIHguYDguKHguLfguYjguK3guKXguYnguLLguIfguYDg',
  'uKrguKPguYfguIjguYHguKXguYnguKcnIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCAgICAgIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnYWNTdGF0dXNlcycpIH0sCiAgICAgIHsga2V5Oid0ZWNobmljaWFuJywg',
  'IGxhYmVsOifguIrguYjguLLguIcgLyDguJzguLnguYnguYPguKvguYnguJrguKPguLTguIHguLLguKMnIH0sCiAgICAgIHsga2V5Oidjb3N0JywgICAgICAgIGxhYmVsOifguITguYjguLLguYPguIrguYnguIjguYjguLLguKIgKOC4muC4suC4lyknLCB0eXBlOidt',
  'b25leScgfSwKICAgICAgeyBrZXk6J3Bob3RvcycsICAgICAgbGFiZWw6J+C4oOC4suC4nuC4m+C4o+C4sOC4geC4reC4micsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICAgICAgIGxhYmVsOifguKvguKHguLLguKLguYDg',
  'uKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbEFjKGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguKPguLLguKLguIHguLLguKPguKXguYnguLLguIfguYHguK3guKPguYzguJnguLXguYk/',
  'JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2FjLmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9u',
  'KGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyoqIOC4meC4seC4lOC4peC5ieC4suC4h+C5geC4reC4o+C5jOC4q+C4peC4suC4ouC4q+C5ieC4reC4h+C4nuC4o+C5ieC4reC4oeC4geC4seC4mSAqLwpmdW5jdGlvbiBmb3JtQnVs',
  'a0FjKCl7CiAgdmFyIHJvb21zID0gcm9vbU9wdGlvbnMoKTsKICB2YXIgYm9keSA9CiAgICAnPGRpdiBjbGFzcz0iZmdyaWQiPicgKwogICAgICAnPGRpdiBjbGFzcz0iZiI+PGxhYmVsPuC4p+C4seC4meC4l+C4teC5iOC4meC4seC4lCA8c3BhbiBzdHlsZT0iY29s',
  'b3I6dmFyKC0tZGFuZ2VyKSI+Kjwvc3Bhbj48L2xhYmVsPicgKwogICAgICAgICc8aW5wdXQgdHlwZT0iZGF0ZSIgY2xhc3M9ImlucCIgaWQ9ImJrX2RhdGUiIHZhbHVlPSInICsgdG9kYXkoKSArICciPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiI+PGxh',
  'YmVsPuC4iuC5iOC4suC4hyAvIOC4nOC4ueC5ieC5g+C4q+C5ieC4muC4o+C4tOC4geC4suC4ozwvbGFiZWw+PGlucHV0IGNsYXNzPSJpbnAiIGlkPSJia190ZWNoIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7guITguYjguLLguYPguIrg',
  'uYnguIjguYjguLLguKLguJXguYjguK3guKvguYnguK3guIcgKOC4muC4suC4lyk8L2xhYmVsPjxpbnB1dCB0eXBlPSJudW1iZXIiIGNsYXNzPSJpbnAiIGlkPSJia19jb3N0Ij48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7guKvguKHguLLg',
  'uKLguYDguKvguJXguLg8L2xhYmVsPjxpbnB1dCBjbGFzcz0iaW5wIiBpZD0iYmtfbm90ZSI+PC9kaXY+JyArCiAgICAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InJvdyBtYjgiPjxiIGNsYXNzPSJmczEz',
  'Ij7guYDguKXguLfguK3guIHguKvguYnguK3guIc8L2I+PHNwYW4gY2xhc3M9InNwIj48L3NwYW4+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImJ1bGtQaWNrKFwnYWxsXCcpIj7guJfguLHguYnguIfguKvguKHguJQ8L2J1dHRvbj4n',
  'ICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iYnVsa1BpY2soXCdub25lXCcpIj7guKXguYnguLLguIc8L2J1dHRvbj4nICsKICAgICAgWzEsMiwzLDQsNV0ubWFwKGZ1bmN0aW9uKGYpeyByZXR1cm4gJzxidXR0b24gY2xhc3M9ImJ0biBz',
  'bSIgb25jbGljaz0iYnVsa1BpY2soJyArIGYgKyAnKSI+4LiK4Lix4LmJ4LiZICcgKyBmICsgJzwvYnV0dG9uPic7IH0pLmpvaW4oJycpICsKICAgICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJyb29tcyIgaWQ9ImJrUm9vbXMiPicgKyByb29tcy5tYXAoZnVu',
  'Y3Rpb24ocil7CiAgICAgIHJldHVybiAnPGxhYmVsIGNsYXNzPSJyb29tIiBzdHlsZT0iY3Vyc29yOnBvaW50ZXIiPjxpbnB1dCB0eXBlPSJjaGVja2JveCIgY2xhc3M9ImJrIiB2YWx1ZT0iJyArIHIgKyAnIj4gPGI+JyArIHIgKyAnPC9iPjwvbGFiZWw+JzsKICAg',
  'IH0pLmpvaW4oJycpICsgJzwvZGl2Pic7CgogIG9wZW5Nb2RhbCgn8J+ThSDguJnguLHguJTguKXguYnguLLguIfguYHguK3guKPguYzguKvguKXguLLguKLguKvguYnguK3guIfguJ7guKPguYnguK3guKHguIHguLHguJknLCBib2R5LAogICAgJzxidXR0b24gY2xh',
  'c3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBpZD0iYmtTYXZlIj7guKrguKPguYnguLLguIfguJnguLHguJTguKvguKHguLLguKI8L2J1dHRvbj4n',
  'LCB0cnVlKTsKCiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JrU2F2ZScpLm9uY2xpY2sgPSBmdW5jdGlvbigpewogICAgdmFyIHBpY2tlZCA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5iazpjaGVja2Vk',
  'JykpLm1hcChmdW5jdGlvbihjKXsgcmV0dXJuIGMudmFsdWU7IH0pOwogICAgdmFyIGRhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmtfZGF0ZScpLnZhbHVlOwogICAgaWYgKCFwaWNrZWQubGVuZ3RoKSByZXR1cm4gdG9hc3QoJ+C5gOC4peC4t+C4reC4',
  'geC4reC4ouC5iOC4suC4h+C4meC5ieC4reC4oiAxIOC4q+C5ieC4reC4hycsICdlcnInKTsKICAgIGlmICghZGF0ZSkgcmV0dXJuIHRvYXN0KCfguIHguKPguLjguJPguLLguKPguLDguJrguLjguKfguLHguJnguJfguLXguYjguJnguLHguJQnLCAnZXJyJyk7CiAg',
  'ICB2YXIgYnRuID0gdGhpczsgYnRuLmRpc2FibGVkID0gdHJ1ZTsgYnRuLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDguIHguLPguKXguLHguIfguJrguLHguJnguJfguLbguIHigKYnOwogICAgY2FsbEFwaSgnYWMuYnVsa0Jvb2snLCB7',
  'CiAgICAgIHJvb21zOiBwaWNrZWQsIGJvb2tEYXRlOiBkYXRlLAogICAgICB0ZWNobmljaWFuOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmtfdGVjaCcpLnZhbHVlLAogICAgICBjb3N0OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmtfY29zdCcpLnZhbHVl',
  'LAogICAgICBub3RlOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmtfbm90ZScpLnZhbHVlCiAgICB9KS50aGVuKGZ1bmN0aW9uKG4pewogICAgICBjbG9zZU1vZGFsKCk7IHRvYXN0KCfguKrguKPguYnguLLguIfguJnguLHguJTguKvguKHguLLguKIgJyArIG4g',
  'KyAnIOC4q+C5ieC4reC4h+C5geC4peC5ieC4pycsICdvaycpOyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgYnRuLmRpc2FibGVkID0gZmFsc2U7IGJ0bi50ZXh0Q29udGVudCA9ICfguKrguKPguYnguLLguIfg',
  'uJnguLHguJTguKvguKHguLLguKInOyB0b2FzdChlLm1lc3NhZ2V8fGUsICdlcnInKTsKICAgIH0pOwogIH07Cn0KCmZ1bmN0aW9uIGJ1bGtQaWNrKHdoYXQpewogIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5iaycpLmZvckVhY2goZnVuY3Rpb24oYyl7CiAg',
  'ICBpZiAod2hhdCA9PT0gJ2FsbCcpIGMuY2hlY2tlZCA9IHRydWU7CiAgICBlbHNlIGlmICh3aGF0ID09PSAnbm9uZScpIGMuY2hlY2tlZCA9IGZhbHNlOwogICAgZWxzZSBjLmNoZWNrZWQgPSBTdHJpbmcoYy52YWx1ZSkuY2hhckF0KDApID09PSBTdHJpbmcod2hh',
  'dCk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3guKPguYzguKE6IOC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4suC4oeC4q+C5ieC4reC4hwogICA9PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybVJlcGFpcihyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4h+C4suC4meC4',
  'i+C5iOC4reC4oScgOiAn4LmB4LiI4LmJ4LiH4LiL4LmI4Lit4LihIC8g4Lia4Lix4LiZ4LiX4Li24LiB4LiH4Liy4LiZ4LiL4LmI4Lit4LihJywKICAgIHJlY29yZDogcmVjIHx8IHsgcmVwb3J0RGF0ZTogdG9kYXkoKSwgcHJpb3JpdHk6ICfguJvguIHguJXguLQn',
  'IH0sCiAgICBhY3Rpb246ICdyZXBhaXIuc2F2ZScsIGJ1Y2tldDogJ3Jvb21SZXBhaXInLCB3aWRlOiB0cnVlLAogICAgb2NyOiB7IGRhdGU6J3JlcGFpckRhdGUnLCBhbW91bnQ6J2Nvc3QnLCB2ZW5kb3I6J3RlY2huaWNpYW4nLCB0aXRsZTonaXRlbXMnIH0sCiAg',
  'ICBvbkRlbGV0ZTogZGVsUmVwYWlyLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oidyb29tJywgICAgICAgbGFiZWw6J+C4q+C5ieC4reC4hycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6cm9vbU9wdGlvbnMoKSwgcmVxdWlyZWQ6dHJ1ZSwgYmxhbms6ZmFsc2Ug',
  'fSwKICAgICAgeyBrZXk6J2NhdGVnb3J5JywgICBsYWJlbDon4Lib4Lij4Liw4LmA4Lig4LiX4LiH4Liy4LiZJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ3JlcGFpckNhdGVnb3JpZXMnKSB9LAogICAgICB7IGtleTonaXRlbXMnLCAgICAgIGxhYmVsOifg',
  'uKPguLLguKLguIHguLLguKPguJfguLXguYjguJXguYnguK3guIfguIvguYjguK3guKHguYHguIvguKEnLCB0eXBlOid0ZXh0YXJlYScsIHJlcXVpcmVkOnRydWUsIGZ1bGw6dHJ1ZSwKICAgICAgICBwaDon4LmA4LiK4LmI4LiZIDEu4Lii4Liy4LmB4LiZ4LinIDIu',
  '4LmA4LiB4LmH4Lia4Liq4Li14Lir4LmJ4Lit4LiHIDMu4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LiB4LmK4Lit4LiB4LiZ4LmJ4Liz4Lil4LmJ4Liy4LiH4LiI4Liy4LiZJyB9LAogICAgICB7IGtleToncmVwb3J0RGF0ZScsIGxhYmVsOifguKfguLHguJnguJfguLXg',
  'uYjguYHguIjguYnguIcnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonYm9va0RhdGUnLCAgIGxhYmVsOifguKfguLHguJnguJnguLHguJTguIvguYjguK3guKHguYHguIvguKEnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleToncmVwYWlyRGF0ZScsIGxh',
  'YmVsOifguKfguLHguJnguYDguILguYnguLLguIvguYjguK3guKHguYHguIvguKEnLCB0eXBlOidkYXRlJywgaGludDon4LiB4Lij4Lit4LiB4LmA4Lih4Li34LmI4Lit4LiL4LmI4Lit4Lih4LmA4Liq4Lij4LmH4LiI4LmB4Lil4LmJ4LinJyB9LAogICAgICB7IGtl',
  'eTonc3RhdHVzJywgICAgIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncmVwYWlyU3RhdHVzZXMnKSB9LAogICAgICB7IGtleToncHJpb3JpdHknLCAgIGxhYmVsOifguITguKfguLLguKHguYDguKPguYjguIfguJTg',
  'uYjguKfguJknLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncHJpb3JpdGllcycpLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleTondGVjaG5pY2lhbicsIGxhYmVsOifguIrguYjguLLguIfguJzguLnguYnguIvguYjguK3guKEnIH0sCiAgICAgIHsga2V5',
  'Oidjb3N0JywgICAgICAgbGFiZWw6J+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oiAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JyB9LAogICAgICB7IGtleToncGhvdG9zQmVmb3JlJywgbGFiZWw6J+C4oOC4suC4nuC4geC5iOC4reC4meC4i+C5iOC4reC4',
  'oScsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5OidwaG90b3NBZnRlcicsICBsYWJlbDon4Lig4Liy4Lie4Lir4Lil4Lix4LiH4LiL4LmI4Lit4LihJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J25vdGUnLCAg',
  'ICAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxSZXBhaXIoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4h+C4suC4meC4i+C5iOC4reC4',
  'oeC4meC4teC5iT8nLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgncmVwYWlyLmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkKICAgICAg',
  'LmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4LiL4LmI',
  '4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmC4LiU4Lii4Lij4Lin4LihCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtQnVpbGRpbmcocmVjKXsKICBvcGVuRm9ybSh7',
  'CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguIfguLLguJnguIvguYjguK3guKHguJXguLbguIEnIDogJ+C5gOC4nuC4tOC5iOC4oeC4h+C4suC4meC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4',
  'oScsCiAgICByZWNvcmQ6IHJlYyB8fCB7IGJvb2tEYXRlOiB0b2RheSgpIH0sCiAgICBhY3Rpb246ICdidWlsZGluZy5zYXZlJywgYnVja2V0OiAnYnVpbGRpbmcnLCB3aWRlOiB0cnVlLAogICAgb2NyOiB7IGRhdGU6J2VuZERhdGUnLCBhbW91bnQ6J2Nvc3QnLCB2',
  'ZW5kb3I6J2NvbnRyYWN0b3InLCB0aXRsZTondGl0bGUnIH0sCiAgICBvbkRlbGV0ZTogZGVsQnVpbGRpbmcsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3pvbmUnLCAgICAgIGxhYmVsOifguKrguYjguKfguJnguILguK3guIfguK3guLLguITguLLguKMnLCB0',
  'eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnYnVpbGRpbmdab25lcycpLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5Oid0aXRsZScsICAgICBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4Lij4LiL4LmI4Lit4Lih4LmB4LiL4LihJywgdHlwZTondGV4dGFyZWEn',
  'LCByZXF1aXJlZDp0cnVlLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J2Jvb2tEYXRlJywgIGxhYmVsOifguKfguLHguJnguJfguLXguYjguJnguLHguJQnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonc3RhcnREYXRlJywgbGFiZWw6J+C4p+C4seC4meC4',
  'l+C4teC5iOC5gOC4o+C4tOC5iOC4oeC4lOC4s+C5gOC4meC4tOC4meC4geC4suC4oycsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidlbmREYXRlJywgICBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LmB4Lil4LmJ4Lin4LmA4Liq4Lij4LmH4LiIJywgdHlw',
  'ZTonZGF0ZScgfSwKICAgICAgeyBrZXk6J3N0YXR1cycsICAgIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnYnVpbGRpbmdTdGF0dXNlcycpIH0sCiAgICAgIHsga2V5Oidjb250cmFjdG9yJywgbGFiZWw6J+C4nOC4',
  'ueC5ieC4o+C4seC4muC5gOC4q+C4oeC4siAvIOC4o+C5ieC4suC4mScgfSwKICAgICAgeyBrZXk6J2Nvc3QnLCAgICAgIGxhYmVsOifguITguYjguLLguYPguIrguYnguIjguYjguLLguKIgKOC4muC4suC4lyknLCB0eXBlOidtb25leScgfSwKICAgICAgeyBrZXk6',
  'J25leHREdWUnLCAgIGxhYmVsOifguITguKPguJrguIHguLPguKvguJnguJTguKPguK3guJrguJbguLHguJTguYTguJsnLCB0eXBlOidkYXRlJywgaGludDon4LmA4LiK4LmI4LiZIOC4geC4seC4meC4i+C4tuC4oeC4lOC4suC4lOC4n+C5ieC4suC4l+C4uOC4gSAz',
  'IOC4m+C4tSDigJQg4LmD4Liq4LmI4Lin4Lix4LiZ4LiX4Li14LmI4LiE4Lij4Lix4LmJ4LiH4LiW4Lix4LiU4LmE4LibJyB9LAogICAgICB7IGtleToncGhvdG9zJywgICAgbGFiZWw6J+C4oOC4suC4nuC4m+C4o+C4sOC4geC4reC4micsIHR5cGU6J2ZpbGVzJywg',
  'ZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5OidzbGlwcycsICAgICBsYWJlbDon4LmD4Lia4LmA4Liq4Lij4LmH4LiIIC8g4Liq4Lil4Li04LibJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICAgIGxhYmVsOifguKvguKHg',
  'uLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbEJ1aWxkaW5nKGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguIfguLLguJnguIvguYjguK3guKHguJXguLbguIHguJnguLXg',
  'uYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2J1aWxkaW5nLmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkKICAgICAgLmNhdGNo',
  'KGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4LiC4LmJ4Lit4Lih',
  '4Li54Lil4Lir4LmJ4Lit4LiHCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtUm9vbShyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiAn4LiC4LmJ4Lit4Lih4Li5',
  '4Lil4Lir4LmJ4Lit4LiHICcgKyAocmVjID8gcmVjLnJvb20gOiAnJyksCiAgICByZWNvcmQ6IHJlYywgYWN0aW9uOiAncm9vbS5zYXZlJywKICAgIGZpZWxkczogWwogICAgICB7IGtleToncm9vbScsICAgbGFiZWw6J+C4q+C5ieC4reC4hycsIHJlcXVpcmVkOnRy',
  'dWUgfSwKICAgICAgeyBrZXk6J2Zsb29yJywgIGxhYmVsOifguIrguLHguYnguJknLCB0eXBlOidudW1iZXInIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ3Jvb21TdGF0',
  'dXNlcycpLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleTondGVuYW50JywgbGFiZWw6J+C4iuC4t+C5iOC4reC4nOC4ueC5ieC5gOC4iuC5iOC4sicgfSwKICAgICAgeyBrZXk6J3Bob25lJywgIGxhYmVsOifguYDguJrguK3guKPguYzguJXguLTguJTguJXguYjg',
  'uK0nIH0sCiAgICAgIHsga2V5OidyZW50JywgICBsYWJlbDon4LiE4LmI4Liy4LmA4LiK4LmI4LiyL+C5gOC4lOC4t+C4reC4mSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JyB9LAogICAgICB7IGtleTonbW92ZUluJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5',
  'iOC5gOC4guC5ieC4suC4reC4ouC4ueC5iCcsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5Oidub3RlJywgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgovKiA9PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguKPguLLguKLguKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4Lii4Lir4LitCiAgID09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtRmluYW5jZShyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4o+C4suC4ouC4geC4suC4oycgOiAn4Lia',
  '4Lix4LiZ4LiX4Li24LiB4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4oicsCiAgICByZWNvcmQ6IHJlYyB8fCB7IGRhdGU6IHRvZGF5KCksIGNoYW5uZWw6ICfguYLguK3guJkgUVInIH0sCiAgICBhY3Rpb246ICdmaW5hbmNlLnNhdmUnLCBi',
  'dWNrZXQ6ICdtaXNjJywKICAgIG9uRGVsZXRlOiBkZWxGaW5hbmNlLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5OidraW5kJywgICBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4LijJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ2ZpbmFuY2VLaW5kcycpLCBy',
  'ZXF1aXJlZDp0cnVlLCBibGFuazpmYWxzZSwKICAgICAgICBoaW50OifguYDguKXguLfguK3guIEgIuC4o+C4suC4ouC4o+C4seC4muC4hOC5iOC4suC5gOC4iuC5iOC4siIg4Lir4Lij4Li34LitICLguKPguLLguKLguKPguLHguJrguK3guLfguYjguJkg4LmGIiDg',
  'uKPguLDguJrguJrguIjguLDguJnguLHguJrguYDguJvguYfguJnguJ3guLHguYjguIfguKPguLLguKLguKPguLHguJrguYPguKvguYnguK3guLHguJXguYLguJnguKHguLHguJXguLQnIH0sCiAgICAgIHsga2V5OidkYXRlJywgICBsYWJlbDon4Lin4Lix4LiZ4LiX',
  '4Li14LmIJywgdHlwZTonZGF0ZScsIHJlcXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J2Ftb3VudCcsIGxhYmVsOifguIjguLPguJnguKfguJnguYDguIfguLTguJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHJlcXVpcmVkOnRydWUgfSwKICAgICAgeyBr',
  'ZXk6J2JpbGxNb250aCcsIGxhYmVsOifguKPguK3guJrguJrguLTguKXguILguK3guIfguYDguJTguLfguK3guJknLCBwaDon4LmA4LiK4LmI4LiZIOC4gS7guIQuIDI1NjknIH0sCiAgICAgIHsga2V5OidjaGFubmVsJywgbGFiZWw6J+C4iuC5iOC4reC4h+C4l+C4',
  'suC4hycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdmaW5hbmNlQ2hhbm5lbHMnKSB9LAogICAgICB7IGtleTonc2xpcHMnLCAgbGFiZWw6J+C4quC4peC4tOC4myAvIOC5g+C4muC5gOC4quC4o+C5h+C4iCcsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0s',
  'CiAgICAgIHsga2V5Oidub3RlJywgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxGaW5hbmNlKGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrg',
  'uKPguLLguKLguIHguLLguKPguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2ZpbmFuY2UuZGVsZXRlJywgeyBpZDogaWQgfSkudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCh7IHF1aWV0OiB0',
  'cnVlIH0pOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Liq4Liz',
  '4Lij4Lit4LiHIC8g4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54LilCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBkb0V4cG9ydEpzb24oKXsKICB0b2FzdCgn',
  '4LiB4Liz4Lil4Lix4LiH4LmA4LiV4Lij4Li14Lii4Lih4LmE4Lif4Lil4LmM4Liq4Liz4Lij4Lit4LiH4oCmJyk7CiAgY2FsbEFwaSgnYmFja3VwLmV4cG9ydCcsIHt9KS50aGVuKGZ1bmN0aW9uKGR1bXApewogICAgc2F2ZVRleHRGaWxlKCd0aGUtbS1jb3JuZXIt',
  'YXAtYmFja3VwLScgKyB0b2RheSgpICsgJy5qc29uJywKICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShkdW1wLCBudWxsLCAxKSwgJ2FwcGxpY2F0aW9uL2pzb24nKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJy',
  'Jyk7IH0pOwp9CgpmdW5jdGlvbiBkb0V4cG9ydENzdihzaGVldCl7CiAgY2FsbEFwaSgnYmFja3VwLmNzdicsIHsgc2hlZXQ6IHNoZWV0IH0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICBzYXZlVGV4dEZpbGUoci5maWxlbmFtZSwgci5jb250ZW50LCAndGV4dC9jc3Yn',
  'KTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7IH0pOwp9CgovKiog4LiU4Liy4Lin4LiZ4LmM4LmC4Lir4Lil4LiU4LmE4Lif4Lil4LmMIOKAlCDguYPguIrguYkgZG93bmxvYWRzIGNhcGFiaWxpdHkg4LiW4LmJ4Liy',
  '4Lih4Li1IOC5hOC4oeC5iOC4h+C4seC5ieC4meC5g+C4iuC5ieC4peC4tOC4h+C4geC5jOC4m+C4geC4leC4tCAqLwpmdW5jdGlvbiBzYXZlVGV4dEZpbGUoZmlsZW5hbWUsIGNvbnRlbnQsIG1pbWUpewogIGlmICh0eXBlb2Ygd2luZG93LnNhdmVWaWFIb3N0ID09',
  'PSAnZnVuY3Rpb24nKSByZXR1cm4gd2luZG93LnNhdmVWaWFIb3N0KGZpbGVuYW1lLCBjb250ZW50LCBtaW1lKTsKICB2YXIgYmxvYiA9IG5ldyBCbG9iKFtjb250ZW50XSwgeyB0eXBlOiBtaW1lICsgJztjaGFyc2V0PXV0Zi04JyB9KTsKICB2YXIgYSA9IGRvY3Vt',
  'ZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTsKICBhLmhyZWYgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpOwogIGEuZG93bmxvYWQgPSBmaWxlbmFtZTsKICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGEpOyBhLmNsaWNrKCk7CiAgc2V0VGltZW91dChmdW5jdGlv',
  'bigpeyBVUkwucmV2b2tlT2JqZWN0VVJMKGEuaHJlZik7IGEucmVtb3ZlKCk7IH0sIDEwMDApOwogIHRvYXN0KCfguJTguLLguKfguJnguYzguYLguKvguKXguJQgJyArIGZpbGVuYW1lICsgJyDguYHguKXguYnguKcnLCAnb2snKTsKfQoKZnVuY3Rpb24gZG9JbXBv',
  'cnRKc29uKCl7CiAgb3Blbk1vZGFsKCfirIbvuI8g4LiB4Li54LmJ4LiE4Li34LiZ4LiI4Liy4LiB4LmE4Lif4Lil4LmM4Liq4Liz4Lij4Lit4LiHJywKICAgICc8cCBjbGFzcz0iZnMxMyI+4LmA4Lil4Li34Lit4LiB4LmE4Lif4Lil4LmMIDxiPi5qc29uPC9iPiDg',
  'uJfguLXguYjguYDguITguKLguJTguLLguKfguJnguYzguYLguKvguKXguJTguYTguKfguYk8L3A+JyArCiAgICAnPGxhYmVsIGNsYXNzPSJmaWxlLWRyb3AiIGZvcj0iaW1wRmlsZSI+8J+ThCDguYDguKXguLfguK3guIHguYTguJ/guKXguYzguKrguLPguKPguK3g',
  'uIcnICsKICAgICAgJzxpbnB1dCB0eXBlPSJmaWxlIiBpZD0iaW1wRmlsZSIgYWNjZXB0PSJhcHBsaWNhdGlvbi9qc29uLC5qc29uIiBzdHlsZT0iZGlzcGxheTpub25lIiAnICsKICAgICAgJ29uY2hhbmdlPSJkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcJ2ltcE5h',
  'bWVcJykudGV4dENvbnRlbnQ9dGhpcy5maWxlc1swXT90aGlzLmZpbGVzWzBdLm5hbWU6XCdcJyI+PC9sYWJlbD4nICsKICAgICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIG10OCIgaWQ9ImltcE5hbWUiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImhyIj48L2Rp',
  'dj4nICsKICAgICc8ZGl2IGNsYXNzPSJmIj48bGFiZWw+4Lin4Li04LiY4Li14LiB4Li54LmJ4LiE4Li34LiZPC9sYWJlbD4nICsKICAgICc8c2VsZWN0IGNsYXNzPSJzZWwiIGlkPSJpbXBNb2RlIj4nICsKICAgICAgJzxvcHRpb24gdmFsdWU9Im1lcmdlIj7guYDg',
  'uJ7guLTguYjguKHguYDguInguJ7guLLguLDguKPguLLguKLguIHguLLguKPguJfguLXguYjguKLguLHguIfguYTguKHguYjguKHguLUgKOC5geC4meC4sOC4meC4syk8L29wdGlvbj4nICsKICAgICAgJzxvcHRpb24gdmFsdWU9InJlcGxhY2UiPuC4peC5ieC4suC4',
  'h+C4guC5ieC4reC4oeC4ueC4peC5gOC4lOC4tOC4oeC5geC4peC5ieC4p+C5geC4l+C4meC4l+C4teC5iOC4l+C4seC5ieC4h+C4q+C4oeC4lDwvb3B0aW9uPicgKwogICAgJzwvc2VsZWN0PjwvZGl2PicsCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNr',
  'PSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4gTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIGlkPSJpbXBHbyI+4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54LilPC9idXR0b24+Jyk7CgogIGRvY3VtZW50Lmdl',
  'dEVsZW1lbnRCeUlkKCdpbXBHbycpLm9uY2xpY2sgPSBmdW5jdGlvbigpewogICAgdmFyIGYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW1wRmlsZScpLmZpbGVzWzBdOwogICAgaWYgKCFmKSByZXR1cm4gdG9hc3QoJ+C4geC4o+C4uOC4k+C4suC5gOC4peC4',
  't+C4reC4geC5hOC4n+C4peC5jOC4geC5iOC4reC4mScsICdlcnInKTsKICAgIHZhciBtb2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ltcE1vZGUnKS52YWx1ZTsKICAgIHZhciBidG4gPSB0aGlzOyBidG4uZGlzYWJsZWQgPSB0cnVlOyBidG4uaW5uZXJI',
  'VE1MID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C4geC4ueC5ieC4hOC4t+C4meKApic7CiAgICB2YXIgciA9IG5ldyBGaWxlUmVhZGVyKCk7CiAgICByLm9ubG9hZCA9IGZ1bmN0aW9uKCl7CiAgICAgIHZhciBwYXJzZWQ7CiAg',
  'ICAgIHRyeSB7IHBhcnNlZCA9IEpTT04ucGFyc2Uoci5yZXN1bHQpOyB9CiAgICAgIGNhdGNoIChlKSB7IGJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBidG4udGV4dENvbnRlbnQgPSAn4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54LilJzsgcmV0dXJuIHRv',
  'YXN0KCfguYTguJ/guKXguYzguYTguKHguYjguYPguIrguYggSlNPTiDguJfguLXguYjguJbguLnguIHguJXguYnguK3guIcnLCAnZXJyJyk7IH0KICAgICAgY2FsbEFwaSgnYmFja3VwLmltcG9ydCcsIHsgZGF0YTogcGFyc2VkLCBtb2RlOiBtb2RlIH0pLnRoZW4o',
  'ZnVuY3Rpb24oc3RhdCl7CiAgICAgICAgY2xvc2VNb2RhbCgpOwogICAgICAgIHZhciBuID0gT2JqZWN0LmtleXMoc3RhdCkucmVkdWNlKGZ1bmN0aW9uKGEsayl7IHJldHVybiBhICsgKHN0YXRba118fDApOyB9LCAwKTsKICAgICAgICB0b2FzdCgn4LiB4Li54LmJ',
  '4LiE4Li34LiZ4Liq4Liz4LmA4Lij4LmH4LiIICcgKyBuICsgJyDguKPguLLguKLguIHguLLguKMnLCAnb2snKTsKICAgICAgICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICAgIGJ0bi5kaXNhYmxlZCA9IGZh',
  'bHNlOyBidG4udGV4dENvbnRlbnQgPSAn4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54LilJzsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7CiAgICAgIH0pOwogICAgfTsKICAgIHIucmVhZEFzVGV4dChmKTsKICB9Owp9CgovKiA9PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmMIOC5geC4peC4sOC4geC4suC4o+C4quC4s+C4o+C4reC4h+C4peC4hyBHb29nbGUgRHJpdmUKICAgPT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgpmdW5jdGlvbiBjb3B5U2hhcmUoKXsKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2hhcmVVcmwnKTsKICBpZiAoIWVsKSByZXR1cm47CiAgZWwuc2Vs',
  'ZWN0KCk7CiAgaWYgKG5hdmlnYXRvci5jbGlwYm9hcmQpIHsKICAgIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KGVsLnZhbHVlKQogICAgICAudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4LiE4Lix4LiU4Lil4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK',
  '4Lij4LmM4LmB4Lil4LmJ4LinJywnb2snKTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKCl7IHRvYXN0KCfguITguLHguJTguKXguK3guIHguYTguKHguYjguKrguLPguYDguKPguYfguIgg4oCUIOC4geC4lOC4hOC5ieC4suC4h+C4l+C4teC5iOC4iuC5iOC4reC4',
  'h+C5geC4peC5ieC4p+C5gOC4peC4t+C4reC4geC4hOC4seC4lOC4peC4reC4gScsJ2VycicpOyB9KTsKICB9IGVsc2UgewogICAgdHJ5IHsgZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2NvcHknKTsgdG9hc3QoJ+C4hOC4seC4lOC4peC4reC4geC4peC4tOC4h+C4geC5',
  'jOC5geC4iuC4o+C5jOC5geC4peC5ieC4pycsJ29rJyk7IH0KICAgIGNhdGNoIChlKSB7IHRvYXN0KCfguITguLHguJTguKXguK3guIHguYTguKHguYjguKrguLPguYDguKPguYfguIgg4oCUIOC4geC4lOC4hOC5ieC4suC4h+C4l+C4teC5iOC4iuC5iOC4reC4h+C5',
  'geC4peC5ieC4p+C5gOC4peC4t+C4reC4geC4hOC4seC4lOC4peC4reC4gScsJ2VycicpOyB9CiAgfQp9CgpmdW5jdGlvbiBkb1JvdGF0ZVNoYXJlKCl7CiAgY29uZmlybUFjdGlvbign4Lit4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LiK4Li44LiU',
  '4LmD4Lir4Lih4LmIPyDguITguJnguJfguLXguYjguJbguLfguK3guKXguLTguIfguIHguYzguYDguJTguLTguKHguIjguLDguYDguJvguLTguJTguYTguKHguYjguYTguJTguYnguK3guLXguIEnLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgnc2hhcmUucm90YXRl',
  'VG9rZW4nLCB7fSkudGhlbihmdW5jdGlvbigpewogICAgICB0b2FzdCgn4Lit4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LiK4Li44LiU4LmD4Lir4Lih4LmI4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwogICAgfSku',
  'Y2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgpmdW5jdGlvbiBkb0JhY2t1cE5vdygpewogIHRvYXN0KCfguIHguLPguKXguLHguIfguKrguLPguKPguK3guIfguILguYnguK3guKHguLnguKXguKXguIcgRHJp',
  'dmXigKYnKTsKICBjYWxsQXBpKCdiYWNrdXAuYmFja3VwTm93Jywge30pLnRoZW4oZnVuY3Rpb24ocil7CiAgICB0b2FzdCgn4Liq4Liz4Lij4Lit4LiH4LmB4Lil4LmJ4LinOiAnICsgci5uYW1lLCAnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwogIH0pLmNh',
  'dGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKfQo8L3NjcmlwdD4KPHNjcmlwdD5ib290KCk7PC9zY3JpcHQ+CjwvYm9keT4KPC9odG1sPgo='
].join('');

function indexHtml_() {
  return Utilities.newBlob(Utilities.base64Decode(INDEX_HTML_B64), 'text/html')
    .getDataAsString('UTF-8');
}
