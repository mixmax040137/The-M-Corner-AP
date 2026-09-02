/**
 * The M Corner AP — ระบบบริหารหอพัก (ไฟล์เดียวจบ)
 * ไฟล์นี้สร้างอัตโนมัติจากโฟลเดอร์ src/ เมื่อ 2026-09-02 10:32 UTC
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
  VERSION: '1.1.0',
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
  'c3R7ZmxleDoxO21heC1oZWlnaHQ6bm9uZX0KfQoKLyogPT09PT09PT09PT09IOC5gOC4iuC5h+C4hOC4peC4tOC4quC4leC5jOC4h+C4suC4meC4i+C5iOC4reC4oSA9PT09PT09PT09PT0gKi8KLyogLS0tLSDguYPguJnguJ/guK3guKPguYzguKEgLS0tLSAqLwou',
  'dG9kb3tib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6dmFyKC0tci1zbSk7cGFkZGluZzoxMHB4O2JhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKX0KLnRvZG8tcm93ewogIGRpc3BsYXk6Z3JpZDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6',
  'MzBweCBtaW5tYXgoMCwxZnIpIDE5MHB4IDM0cHg7CiAgZ2FwOjdweDthbGlnbi1pdGVtczpjZW50ZXI7bWFyZ2luLWJvdHRvbTo2cHg7Cn0KLnRvZG8tcm93IC5pbnAsLnRvZG8tcm93IC5zZWx7cGFkZGluZzo2cHggOXB4O2ZvbnQtc2l6ZToxM3B4fQoudG9kby1y',
  'b3cuZG9uZSAuaW5we3RleHQtZGVjb3JhdGlvbjpsaW5lLXRocm91Z2g7Y29sb3I6dmFyKC0tbXV0ZWQpfQoudG9kby1jaGVja3tkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpjZW50ZXI7Y3Vyc29yOnBvaW50ZXJ9Ci50b2Rv',
  'LWNoZWNrIGlucHV0e3dpZHRoOjE3cHg7aGVpZ2h0OjE3cHg7Y3Vyc29yOnBvaW50ZXI7YWNjZW50LWNvbG9yOnZhcigtLW9rKX0KLnRvZG8tY291bnR7bWFyZ2luLWxlZnQ6YXV0bztmb250LXNpemU6MTNweDtjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC12YXJpYW50',
  'LW51bWVyaWM6dGFidWxhci1udW1zfQoudG9kby1jb3VudCBie2NvbG9yOnZhcigtLWluayl9CgovKiAtLS0tIOC5g+C4meC4leC4suC4o+C4suC4h+C4o+C4suC4ouC4geC4suC4oyAo4LiV4Li04LmK4LiB4LmE4LiU4LmJ4LiI4Lij4Li04LiHKSAtLS0tICovCi50',
  'b2RvLXZpZXd7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtnYXA6MnB4fQoudG9kby1iYXJ7aGVpZ2h0OjVweDtib3JkZXItcmFkaXVzOjk5cHg7YmFja2dyb3VuZDp2YXIoLS1saW5lLTIpO292ZXJmbG93OmhpZGRlbjttYXJnaW4tYm90dG9tOjJw',
  'eH0KLnRvZG8tYmFyPml7ZGlzcGxheTpibG9jaztoZWlnaHQ6MTAwJTtib3JkZXItcmFkaXVzOjk5cHg7YmFja2dyb3VuZDp2YXIoLS1vayk7dHJhbnNpdGlvbjp3aWR0aCAuMzVzIGVhc2V9Ci50b2RvLW1ldGF7Zm9udC1zaXplOjExcHg7Y29sb3I6dmFyKC0tbXV0',
  'ZWQpO2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtczttYXJnaW4tYm90dG9tOjNweH0KLnRvZG8tbWV0YSBie2NvbG9yOnZhcigtLWluayl9Ci50b2RvLWxpbmV7CiAgZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmZsZXgtc3RhcnQ7Z2FwOjdweDtmb250',
  'LXNpemU6MTNweDtsaW5lLWhlaWdodDoxLjU7CiAgcGFkZGluZzoycHggMDtjdXJzb3I6cG9pbnRlcjsKfQoudG9kby1saW5lIGlucHV0e21hcmdpbi10b3A6MnB4O3dpZHRoOjE1cHg7aGVpZ2h0OjE1cHg7ZmxleDpub25lO2N1cnNvcjpwb2ludGVyO2FjY2VudC1j',
  'b2xvcjp2YXIoLS1vayl9Ci50b2RvLWxpbmUgLm5te2ZsZXg6MTttaW4td2lkdGg6MDtjb2xvcjp2YXIoLS1pbmspfQoudG9kby1saW5lIC5jYXR7ZmxleDpub25lO2ZvbnQtc2l6ZToxMC41cHg7cGFkZGluZzoxcHggN3B4fQoudG9kby1saW5lLmRvbmUgLm5te3Rl',
  'eHQtZGVjb3JhdGlvbjpsaW5lLXRocm91Z2g7Y29sb3I6dmFyKC0tZmFpbnQpfQoudG9kby1saW5lLmxvY2tlZHtjdXJzb3I6ZGVmYXVsdH0KLnRvZG8tbGluZTpub3QoLmxvY2tlZCk6aG92ZXIgLm5te2NvbG9yOnZhcigtLWJyYW5kKX0KCkBtZWRpYSAobWF4LXdp',
  'ZHRoOjY0MHB4KXsKICAudG9kby1yb3d7CiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6MzBweCBtaW5tYXgoMCwxZnIpIDM0cHg7CiAgICBncmlkLXRlbXBsYXRlLWFyZWFzOidjaGsgbmFtZSBkZWwnICcuIGNhdCBjYXQnOwogICAgcGFkZGluZzo4cHg7Ym9yZGVy',
  'OjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXItc20pOwogICAgYmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlKTttYXJnaW4tYm90dG9tOjhweDsKICB9CiAgLnRvZG8tY2hlY2t7Z3JpZC1hcmVhOmNoazthbGlnbi1zZWxmOnN0YXJ0O3Bh',
  'ZGRpbmctdG9wOjVweH0KICAudG9kby1yb3cgLmlucHtncmlkLWFyZWE6bmFtZX0KICAudG9kby1yb3cgLnNlbHtncmlkLWFyZWE6Y2F0O3dpZHRoOjEwMCV9CiAgLnRvZG8tcm93IC5idG57Z3JpZC1hcmVhOmRlbDthbGlnbi1zZWxmOnN0YXJ0O2p1c3RpZnktc2Vs',
  'ZjplbmQ7d2lkdGg6MzRweDtwYWRkaW5nOjZweCAwfQogIC50b2RvLWNvdW50e3dpZHRoOjEwMCU7bWFyZ2luOjZweCAwIDA7dGV4dC1hbGlnbjpyaWdodH0KfQoKQG1lZGlhIHByaW50ewogIC5uYXYsLnRvcC1yaWdodCwuYnVyZ2VyLC50LWFjdGlvbnMsLmJ0bntk',
  'aXNwbGF5Om5vbmUhaW1wb3J0YW50fQogIC5hcHB7ZGlzcGxheTpibG9ja30gYm9keXtiYWNrZ3JvdW5kOiNmZmZ9CiAgLmNhcmR7YnJlYWstaW5zaWRlOmF2b2lkO2JveC1zaGFkb3c6bm9uZX0KfQo8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5PgoKPGRpdiBjbGFzcz0i',
  'YXBwIj4KICA8IS0tID09PT09PT09PT09PT09PT09IHNpZGViYXIgPT09PT09PT09PT09PT09PT0gLS0+CiAgPGFzaWRlIGNsYXNzPSJuYXYiIGlkPSJuYXYiPgogICAgPGRpdiBjbGFzcz0iYnJhbmQiPgogICAgICA8Yj7wn4+iIDw/PSBhcHBOYW1lID8+PC9iPgog',
  'ICAgICA8c3Bhbj48Pz0gc3VidGl0bGUgPz4gwrcgdjw/PSB2ZXJzaW9uID8+PC9zcGFuPgogICAgPC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJuYXYtbGlzdCIgaWQ9Im5hdkxpc3QiPjwvZGl2PgogICAgPGRpdiBjbGFzcz0ibmF2LWZvb3QiIGlkPSJuYXZGb290Ij7g',
  'uIHguLPguKXguLHguIfguYLguKvguKXguJTigKY8L2Rpdj4KICA8L2FzaWRlPgoKICA8IS0tID09PT09PT09PT09PT09PT09IG1haW4gPT09PT09PT09PT09PT09PT0gLS0+CiAgPGRpdiBjbGFzcz0ibWFpbiI+CiAgICA8aGVhZGVyIGNsYXNzPSJ0b3AiPgogICAg',
  'ICA8YnV0dG9uIGNsYXNzPSJidXJnZXIiIG9uY2xpY2s9InRvZ2dsZU5hdigpIj7imLA8L2J1dHRvbj4KICAgICAgPGRpdj4KICAgICAgICA8aDEgaWQ9InBhZ2VUaXRsZSI+4Lig4Liy4Lie4Lij4Lin4LihPC9oMT4KICAgICAgICA8ZGl2IGNsYXNzPSJzdWIiIGlk',
  'PSJwYWdlU3ViIj7guYHguJTguIrguJrguK3guKPguYzguJTguKPguKfguKHguJfguLjguIHguKrguYjguKfguJnguILguK3guIfguKvguK3guJ7guLHguIE8L2Rpdj4KICAgICAgPC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9InRvcC1yaWdodCI+CiAgICAgICAgPHNw',
  'YW4gaWQ9ImxpdmVEb3QiPjwvc3Bhbj4KICAgICAgICA8c3BhbiBpZD0iYmVsbFdyYXAiIGNsYXNzPSJiZWxsLXdyYXAiPjwvc3Bhbj4KICAgICAgICA8YnV0dG9uIGNsYXNzPSJidG4gaWNvbiIgaWQ9InRoZW1lQnRuIiB0aXRsZT0i4Liq4Lil4Lix4Lia4LiY4Li1',
  '4LihIiBvbmNsaWNrPSJjeWNsZVRoZW1lKCkiPvCfjJc8L2J1dHRvbj4KICAgICAgICA8aW5wdXQgY2xhc3M9ImlucCB3LWF1dG8iIGlkPSJzZWFyY2hCb3giIHBsYWNlaG9sZGVyPSLwn5SOIOC4hOC5ieC4meC4q+C4suC4l+C4seC5ieC4h+C4o+C4sOC4muC4muKA',
  'piIgc3R5bGU9IndpZHRoOjE4MHB4IgogICAgICAgICAgICAgICBvbmlucHV0PSJvblNlYXJjaCh0aGlzLnZhbHVlKSIgYXV0b2NvbXBsZXRlPSJvZmYiPgogICAgICAgIDxzZWxlY3QgY2xhc3M9InNlbCB3LWF1dG8iIGlkPSJ5ZWFyU2VsIiBvbmNoYW5nZT0ic2V0',
  'WWVhcih0aGlzLnZhbHVlKSI+PC9zZWxlY3Q+CiAgICAgICAgPGJ1dHRvbiBjbGFzcz0iYnRuIGljb24iIHRpdGxlPSLguKPguLXguYDguJ/guKPguIoiIG9uY2xpY2s9InJlZnJlc2goKSI+4oa7PC9idXR0b24+CiAgICAgIDwvZGl2PgogICAgPC9oZWFkZXI+CiAg',
  'ICA8bWFpbiBjbGFzcz0iY29udGVudCIgaWQ9InZpZXciPgogICAgICA8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj48c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPjwvZGl2PuC4geC4s+C4peC4seC4h+C5gOC4iuC4t+C5iOC4reC4oeC4leC5iOC4',
  'reC4o+C4sOC4muC4muKApjwvZGl2PgogICAgPC9tYWluPgogIDwvZGl2Pgo8L2Rpdj4KCjxkaXYgaWQ9ImF1dGhSb290Ij48L2Rpdj4KPGRpdiBpZD0ibW9kYWxSb290Ij48L2Rpdj4KPGRpdiBpZD0idG9hc3RSb290Ij48L2Rpdj4KCjxzY3JpcHQ+CiAgLyog4LiE',
  '4LmI4Liy4LiX4Lix4LmJ4LiH4Liq4Liy4Lih4LiW4Li54LiB4LiB4Lij4Lit4LiH4Lih4Liy4LiI4Liy4LiB4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4LmB4Lil4LmJ4LinIOC4iOC4tuC4h+C4q+C4peC4uOC4lOC4reC4reC4',
  'geC4iOC4suC4geC5gOC4hOC4o+C4t+C5iOC4reC4h+C4q+C4oeC4suC4ouC4hOC4s+C4nuC4ueC4lOC5hOC4oeC5iOC5hOC4lOC5iQogICAgICAgYWNjZXNzS2V5ICDguJzguYjguLLguJkgc2FmZUtleV8gICAg4LmA4Lir4Lil4Li34Lit4LmB4LiE4LmIIEEtWiBh',
  'LXogMC05IF8gLQogICAgICAgcm9sZSAgICAgICDguKHguLLguIjguLLguIHguKPguLLguKLguIHguLLguKPguITguIfguJfguLXguYggUk9MRQogICAgICAgdGhlbWUgICAgICDguJzguYjguLLguJkgc2FmZVRoZW1lXyAg4LmA4Lir4Lil4Li34Lit4LmB4LiE4LmI',
  'IDMg4LiE4LmI4Liy4LiX4Li14LmI4LiB4Liz4Lir4LiZ4LiU4LmE4Lin4LmJCgogICAgIOC4l+C4seC5ieC4h+C4quC4suC4oeC4leC5ieC4reC4h+C4nuC4tOC4oeC4nuC5jOC5geC4muC4muC4lOC4tOC4miAoZm9yY2UtcHJpbnRpbmcpIOC5gOC4l+C5iOC4suC4',
  'meC4seC5ieC4mSDguKvguYnguLLguKHguYPguIrguYnguYHguJrguJogc3RhbmRhcmQtcHJpbnRpbmcKICAgICDguYDguJ7guKPguLLguLDguYHguJrguJrguKvguKXguLHguIfguIjguLAgZXNjYXBlIOC5gOC4hOC4o+C4t+C5iOC4reC4h+C4q+C4oeC4suC4ouC4',
  'hOC4s+C4nuC4ueC4lOC5gOC4m+C5h+C4mSAmcXVvdDsg4LiL4Li24LmI4LiH4LmD4LiZ4LmB4LiX4LmH4LiBIHNjcmlwdAogICAgIOC5gOC4muC4o+C4suC4p+C5jOC5gOC4i+C4reC4o+C5jOC5hOC4oeC5iOC4luC4reC4lOC4geC4peC4seC4miDguJfguLPguYPg',
  'uKvguYnguJfguLHguYnguIfguJrguKXguYfguK3guIHguJnguLXguYnguJ7guLHguIfguJfguLHguYnguIfguIHguYnguK3guJnguYHguKXguLDguITguYjguLLguYTguKHguYjguJbguLbguIfguKvguJnguYnguLLguYDguKfguYfguJogKi8KICB2YXIgQUNDRVNT',
  'X0tFWSA9ICI8PyE9IGFjY2Vzc0tleSA/PiI7CiAgdmFyIFVTRVJfUk9MRSAgPSAiPD8hPSByb2xlID8+IjsKICB2YXIgSU5JVF9USEVNRSA9ICI8PyE9IHRoZW1lID8+IjsKPC9zY3JpcHQ+CjxzY3JpcHQ+Ci8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBBcHAuaHRtbCDigJQgY29yZTogc3RhdGUsIGFwaSwgcm91dGVyLCBmb3JtYXQsIG1vZGFsLCB1cGxvYWQKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09ICovCgp2YXIgUyA9IHsKICBib290OiBudWxsLCAgICAgICAgICAvLyDguILguYnguK3guKHguLnguKXguJXguLHguYnguIfguJXguYnguJnguIjguLLguIEgYXBwLmJvb3RzdHJhcAogIHBhZ2U6ICdkYXNoYm9hcmQnLAogIHllYXI6IFN0cmluZyhuZXcgRGF0',
  'ZSgpLmdldEZ1bGxZZWFyKCkpLAogIGNhY2hlOiB7fSwgICAgICAgICAgIC8vIOC5gOC4geC5h+C4muC4nOC4peC4peC4seC4nuC4mOC5jOC4peC5iOC4suC4quC4uOC4lOC4guC4reC4h+C5geC4leC5iOC4peC4sOC4q+C4meC5ieC4sgogIHBhcmFtczoge30sICAg',
  'ICAgICAgIC8vIOC4leC4seC4p+C4geC4o+C4reC4h+C4ouC5iOC4reC4ouC4guC4reC4h+C5geC4leC5iOC4peC4sOC4q+C4meC5ieC4siDguYDguIrguYjguJkge3Jvb206JzMxMScsIHN0YXR1czonYWxsJ30KICBidXN5OiBmYWxzZSwKICB2ZXJzaW9uOiAwLCAg',
  'ICAgICAgICAvLyDguKPguLjguYjguJnguILguYnguK3guKHguLnguKXguJfguLXguYjguKvguJnguYnguLLguJnguLXguYnguJbguLfguK3guK3guKLguLnguYgKICBzZWxmQ2hhbmdlVW50aWw6IDAsICAvLyDguYDguJ7guLTguYjguIfguIHguJTguJrguLHguJng',
  'uJfguLbguIHguYDguK3guIcg4oCUIOC4reC4ouC5iOC4suC5gOC4lOC5ieC4h+C4p+C5iOC4siAi4Lih4Li14LiE4LiZ4LmB4LiB4LmJ4LiC4LmJ4Lit4Lih4Li54LilIgogIHN5bmNUaW1lcjogbnVsbAp9OwoKdmFyIEFMTF9ERUJUUyA9IFtdOwoKdmFyIFBBR0VT',
  'ID0gWwogIHsgaWQ6J2Rhc2hib2FyZCcsIGljOifwn5OKJywgbGFiZWw6J+C4oOC4suC4nuC4o+C4p+C4oScsICAgICAgICAgICAgICBzdWI6J+C5geC4lOC4iuC4muC4reC4o+C5jOC4lOC4o+C4p+C4oeC4l+C4uOC4geC4quC5iOC4p+C4meC4guC4reC4h+C4q+C4',
  'reC4nuC4seC4gScsICAgICAgICBzZWM6J+C4oOC4suC4nuC4o+C4p+C4oScgfSwKICB7IGlkOidkZWJ0TWFpbicsICBpYzon8J+SsCcsIGxhYmVsOifguKPguLLguKLguIHguLLguKPguKrguKPguLjguJvguKPguKfguKEnLCAgICAgICBzdWI6J+C4muC4seC4jeC4',
  'iuC4teC5guC4reC4meC5g+C4iuC5ieC4q+C4meC4teC5ieC4q+C4peC4seC4geC4guC4reC4h+C4q+C4reC4nuC4seC4gScsICAgICAgICBzZWM6J+C4geC4suC4o+C5gOC4h+C4tOC4mScgfSwKICB7IGlkOidkZWJ0U3ViJywgICBpYzon8J+nvicsIGxhYmVsOifg',
  'uKvguJnguLXguYnguKrguLTguJknLCAgICAgICAgICAgICAgc3ViOifguJrguLHguI3guIrguLXguYLguK3guJnguYPguIrguYnguKvguJnguLXguYnguKPguK3guIfguILguK3guIfguKvguK3guJ7guLHguIEnIH0sCiAgeyBpZDoncHVyY2hhc2VzJywgaWM6J/Cf',
  'm5InLCBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHJywgICAgICAgIHN1Yjon4LiC4Lit4LiH4LmA4LiC4LmJ4Liy4Lir4Lit4Lie4Lix4LiBIOC4o+C4suC4hOC4siDguJvguKPguLDguIHguLHguJkg4LmB4Lil4Liw4Liq4Lil',
  '4Li04LibJyB9LAogIHsgaWQ6J2ZpbmFuY2UnLCAgIGljOifwn5OSJywgbGFiZWw6J+C4o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKLguKvguK0nLCAgICAgIHN1Yjon4LiE4LmI4Liy4LmA4LiK4LmI4Liy4LiX4Li14LmI4LmA4LiB4LmH4Lia',
  '4LmE4LiU4LmJIMK3IOC4hOC5iOC4suC5hOC4nyDCtyDguITguYjguLLguJnguYnguLMgwrcg4LiE4LmI4Liy4LmA4LiZ4LmH4LiVIMK3IOC4oOC4suC4qeC4tScgfSwKICB7IGlkOidhYycsICAgICAgICBpYzon4p2E77iPJywgbGFiZWw6J+C4peC5ieC4suC4h+C5',
  'geC4reC4o+C5jCcsICAgICAgICAgICAgc3ViOifguJXguLLguKPguLLguIfguKXguYnguLLguIfguYHguK3guKPguYzguKPguLLguKLguKvguYnguK3guIcgMjQg4Lir4LmJ4Lit4LiHJywgICAgICBzZWM6J+C4i+C5iOC4reC4oeC4muC4s+C4o+C4uOC4hycgfSwK',
  'ICB7IGlkOidyZXBhaXJzJywgICBpYzon8J+UpycsIGxhYmVsOifguIvguYjguK3guKHguYHguIvguKHguJXguLLguKHguKvguYnguK3guIcnLCAgICAgIHN1Yjon4LiH4Liy4LiZ4LmB4LiI4LmJ4LiH4LiL4LmI4Lit4Lih4LmB4Lii4LiB4LiV4Liy4Lih4Lir4LmJ',
  '4Lit4LiHJyB9LAogIHsgaWQ6J2J1aWxkaW5nJywgIGljOifwn4+iJywgbGFiZWw6J+C4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oScsICAgIHN1Yjon4LiH4Liy4LiZ4Liq4LmI4Lin4LiZ4LiB4Lil4Liy4LiH4LiC4Lit4LiH',
  '4Lit4Liy4LiE4Liy4LijJyB9LAogIHsgaWQ6J3Jvb21zJywgICAgIGljOifwn5qqJywgbGFiZWw6J+C4q+C5ieC4reC4h+C4nuC4seC4gScsICAgICAgICAgICAgIHN1Yjon4LiX4Liw4LmA4Lia4Li14Lii4LiZ4Lir4LmJ4Lit4LiH4LmB4Lil4Liw4Lib4Lij4Liw',
  '4Lin4Lix4LiV4Li04Lij4Liy4Lii4Lir4LmJ4Lit4LiHJywgICAgICAgc2VjOifguILguYnguK3guKHguLnguKUnIH0sCiAgeyBpZDoncmVwb3J0cycsICAgaWM6J/Cfk4gnLCBsYWJlbDon4Lij4Liy4Lii4LiH4Liy4LiZICYg4Liq4Liz4Lij4Lit4LiH4LiC4LmJ',
  '4Lit4Lih4Li54LilJywgc3ViOifguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguKPguLLguKLguKvguYnguK3guIcgwrcg4Lib4LiP4Li04LiX4Li04LiZ4LiH4Liy4LiZIMK3IOC4quC5iOC4h+C4reC4reC4geC4guC5ieC4reC4oeC4ueC4pScgfSwKICB7',
  'IGlkOidzZXR0aW5ncycsICBpYzon4pqZ77iPJywgbGFiZWw6J+C4leC4seC5ieC4h+C4hOC5iOC4sicsICAgICAgICAgICAgICBzdWI6J+C4muC4seC4jeC4iuC4tSDCtyDguJjguLXguKEgwrcg4Lic4Li54LmJ4LmD4LiK4LmJIMK3IOC4peC4tOC4h+C4geC5jOC5',
  'gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4mScsICAgc2VjOifguKPguLDguJrguJonIH0KXTsKCi8qIC0tLS0tLS0tLS0tLS0tLS0gQVBJIC0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKiDguIHguLjguI3guYHguIjguJfguLXguYjguIjguLDguYHguJnguJrguYTg',
  'uJvguIHguLHguJrguJfguLjguIHguITguLPguKrguLHguYjguIcg4oCUIOC4oeC4tSAyIOC4l+C4suC4h+C4quC4s+C4o+C4reC4h+C5gOC4nOC4t+C5iOC4reC4l+C4suC4h+C5geC4o+C4geC5hOC4oeC5iOC4oeC4siAqLwp2YXIgUkVTT0xWRURfS0VZID0gbnVs',
  'bDsKCmZ1bmN0aW9uIGFjY2Vzc0tleSgpewogIGlmIChSRVNPTFZFRF9LRVkgIT09IG51bGwpIHJldHVybiBSRVNPTFZFRF9LRVk7CiAgUkVTT0xWRURfS0VZID0gKHR5cGVvZiBBQ0NFU1NfS0VZID09PSAnc3RyaW5nJyAmJiBBQ0NFU1NfS0VZKSA/IEFDQ0VTU19L',
  'RVkgOiAnJzsKICByZXR1cm4gUkVTT0xWRURfS0VZOwp9CgovKiogdHJ1ZSDguJbguYnguLLguYDguJvguLTguJTguJTguYnguKfguKLguKXguLTguIfguIHguYzguJzguLnguYnguJTguLnguYHguKUg4oCUIOC5g+C4iuC5ieC5geC4l+C4meC4leC4seC4p+C5geC4',
  'm+C4oyBDQU5fRURJVCDguJXguKPguIcg4LmGIOC4l+C4teC5iOC4reC4suC4iOC5hOC4oeC5iOC4luC4ueC4geC4m+C4o+C4sOC4geC4suC4qCAqLwpmdW5jdGlvbiBjYW5FZGl0KCl7CiAgaWYgKHR5cGVvZiBDQU5fRURJVCAhPT0gJ3VuZGVmaW5lZCcpIHJldHVy',
  'biAhIUNBTl9FRElUOwogIHJldHVybiAhIShTLmJvb3QgJiYgUy5ib290LmNhbkVkaXQpOwp9CgpmdW5jdGlvbiBjYWxsQXBpKGFjdGlvbiwgcGF5bG9hZCl7CiAgdmFyIGJvZHkgPSB7fTsKICBPYmplY3Qua2V5cyhwYXlsb2FkIHx8IHt9KS5mb3JFYWNoKGZ1bmN0',
  'aW9uKGspeyBib2R5W2tdID0gcGF5bG9hZFtrXTsgfSk7CiAgYm9keS5fa2V5ID0gYWNjZXNzS2V5KCk7CiAgLy8g4Lic4Li54LmJ4LmA4Lij4Li14Lii4LiB4Liq4LmI4LiHIF9zZXNzaW9uIOC4oeC4suC5gOC4reC4h+C5hOC4lOC5iSAo4LiV4Lit4LiZ4Lit4Lit',
  '4LiB4LiI4Liy4LiB4Lij4Liw4Lia4Lia4LiV4LmJ4Lit4LiH4LmD4LiK4LmJ4LiV4Lix4Lin4LmA4LiB4LmI4LiyKQogIGlmIChib2R5Ll9zZXNzaW9uID09PSB1bmRlZmluZWQpIGJvZHkuX3Nlc3Npb24gPSAodHlwZW9mIEFVVEggIT09ICd1bmRlZmluZWQnID8g',
  'QVVUSC5zZXNzaW9uIDogJycpIHx8ICcnOwogIHBheWxvYWQgPSBib2R5OwogIHZhciBtdXRhdGluZyA9IENMSUVOVF9NVVRBVElORy50ZXN0KGFjdGlvbik7CiAgaWYgKG11dGF0aW5nKSBzeW5jU2V0KCdzYXZpbmcnKTsKCiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1',
  'bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7CiAgICBnb29nbGUuc2NyaXB0LnJ1bgogICAgICAud2l0aFN1Y2Nlc3NIYW5kbGVyKGZ1bmN0aW9uKHJlcyl7CiAgICAgICAgaWYgKCFyZXMpIHsgaWYgKG11dGF0aW5nKSBzeW5jU2V0KCdvZmZsaW5lJyk7IHJldHVybiBy',
  'ZWplY3QobmV3IEVycm9yKCfguYTguKHguYjguYTguJTguYnguKPguLHguJrguILguYnguK3guKHguLnguKXguIjguLLguIHguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYwnKSk7IH0KICAgICAgICBpZiAocmVzLm9rKSB7CiAgICAgICAgICBpZiAobXV0',
  'YXRpbmcpIHsgbWFya1NlbGZDaGFuZ2UoKTsgc3luY1NldCgnc2F2ZWQnKTsgfQogICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzLmRhdGEpOwogICAgICAgIH0KICAgICAgICAvLyDguKvguKHguJTguK3guLLguKLguLjguKPguLDguKvguKfguYjguLLguIfguYPg',
  'uIrguYnguIfguLLguJkg4oCUIOC4nuC4suC4geC4peC4seC4muC5hOC4m+C4q+C4meC5ieC4suC4peC5h+C4reC4geC4reC4tOC4meC5geC4l+C4meC4l+C4teC5iOC4iOC4sOC4guC4tuC5ieC4meC4guC5ieC4reC4hOC4p+C4suC4oeC4hOC5ieC4suC4h+C5hOC4',
  'p+C5ieC5gOC4ieC4oiDguYYKICAgICAgICBpZiAocmVzLm5lZWRMb2dpbiAmJiB0eXBlb2Ygb25TZXNzaW9uTG9zdCA9PT0gJ2Z1bmN0aW9uJykgb25TZXNzaW9uTG9zdCgpOwogICAgICAgIGlmIChtdXRhdGluZykgc3luY1NldCgnZXJyb3InLCByZXMuZXJyb3Ip',
  'OwogICAgICAgIHJlamVjdChuZXcgRXJyb3IocmVzLmVycm9yKSk7CiAgICAgIH0pCiAgICAgIC53aXRoRmFpbHVyZUhhbmRsZXIoZnVuY3Rpb24oZXJyKXsKICAgICAgICAvLyDguYDguJnguYfguJXguKrguLDguJTguLjguJQg4oCUIOC4guC4reC4h+C4l+C4teC5',
  'iOC4geC4o+C4reC4geC5hOC4p+C5ieC4ouC4seC4h+C4reC4ouC4ueC5iOC5g+C4meC4n+C4reC4o+C5jOC4oSDguYTguKHguYjguKvguLLguKLguYTguJvguYTguKvguJkKICAgICAgICBpZiAobXV0YXRpbmcpIHN5bmNTZXQoaXNPZmZsaW5lRXJyb3IoZXJyKSA/',
  'ICdvZmZsaW5lJyA6ICdlcnJvcicsIChlcnIgJiYgZXJyLm1lc3NhZ2UpIHx8IFN0cmluZyhlcnIpKTsKICAgICAgICByZWplY3QoZXJyKTsKICAgICAgfSkKICAgICAgLmFwaShhY3Rpb24sIHBheWxvYWQgfHwge30pOwogIH0pOwp9CgovKiog4LmA4Lij4Li14Lii',
  '4LiB4LmA4Lih4Li34LmI4Lit4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4Lia4Lit4LiB4Lin4LmI4Liy4Lii4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJ4Lil4LmH4Lit4LiB4Lit4Li04LiZICjguKvguKHguJTguK3guLLguKLguLggLyDguJbguLng',
  'uIHguYPguKvguYnguK3guK3guIHguIjguLLguIHguKPguLDguJrguJopICovCnZhciBzZXNzaW9uTG9zdEF0ID0gMDsKZnVuY3Rpb24gb25TZXNzaW9uTG9zdCgpewogIGlmIChEYXRlLm5vdygpIC0gc2Vzc2lvbkxvc3RBdCA8IDMwMDApIHJldHVybjsgICAvLyDg',
  'uKvguKXguLLguKLguITguLPguKrguLHguYjguIfguJ7guKPguYnguK3guKHguIHguLHguJnguIHguYfguYDguJTguYnguIfguITguKPguLHguYnguIfguYDguJTguLXguKLguKfguJ7guK0KICBzZXNzaW9uTG9zdEF0ID0gRGF0ZS5ub3coKTsKICBzYXZlU2Vzc2lv',
  'bignJyk7CiAgY2xvc2VNb2RhbCgpOwogIGlmIChBVVRILmRldmljZSkgc2hvd1BpbigpOyBlbHNlIHNob3dMb2dpbign4Lir4Lih4LiU4LmA4Lin4Lil4Liy4LmD4LiK4LmJ4LiH4Liy4LiZIOC4geC4o+C4uOC4k+C4suC5gOC4guC5ieC4suC4quC4ueC5iOC4o+C4',
  'sOC4muC4muC4reC4teC4geC4hOC4o+C4seC5ieC4hycpOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIGJvb3QgJiByb3V0aW5nIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIGJvb3QoKXsKICAvLyDguJfguLLguJjguLXguKHguIHguYjguK3guJnguK3guKLg',
  'uYjguLLguIfguK3guLfguYjguJkg4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4LmA4Lir4LmH4LiZ4Lir4LiZ4LmJ4Liy4LiI4Lit4LiB4Lij4Liw4Lie4Lij4Li04Lia4LiC4Liy4Lin4LiV4Lit4LiZ4LmA4Lib4Li04LiUCiAgYXBwbHlUaGVtZShsc0dldChMU19U',
  'SEVNRSkgfHwgKHR5cGVvZiBJTklUX1RIRU1FID09PSAnc3RyaW5nJyA/IElOSVRfVEhFTUUgOiAn4LiV4Liy4Lih4LmA4LiE4Lij4Li34LmI4Lit4LiHJykpOwogIC8vIGF1dGhHYXRlIOC4iOC4sOC4reC5iOC4suC4meC4geC4uOC4jeC5geC4iOC4iOC4suC4gSBV',
  'Ukwg4LiC4Lit4LiH4Lir4LiZ4LmJ4Liy4LmB4Lih4LmI4LmD4Lir4LmJ4LiU4LmJ4Lin4LiiIOC4luC5ieC4suC4leC4seC4p+C5geC4m+C4o+C5hOC4oeC5iOC4oeC4suC4luC4tuC4h+C4q+C4meC5ieC4suC5gOC4p+C5h+C4mgogIGF1dGhHYXRlKCk7Cn0KCmZ1',
  'bmN0aW9uIGJvb3ROb3coKXsKICBjYWxsQXBpKCdhcHAuYm9vdHN0cmFwJykudGhlbihmdW5jdGlvbihiKXsKICAgIFMuYm9vdCA9IGI7CiAgICByZW5kZXJOYXYoKTsKICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXZGb290JykuaW5uZXJIVE1MID0gbmF2',
  'Rm9vdEh0bWwoYik7CiAgICBTLnZlcnNpb24gPSBiLnZlcnNpb24gfHwgMDsKICAgIGlmICghYi5jYW5FZGl0KSBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ3JlYWRvbmx5Jyk7CiAgICAvLyDguJjguLXguKHguILguK3guIfguYDguITguKPguLfguYjguK3g',
  'uIfguJnguLXguYnguIrguJnguLDguYDguKrguKHguK0g4LiW4LmJ4Liy4Lii4Lix4LiH4LmE4Lih4LmI4LmA4LiE4Lii4LiV4Lix4LmJ4LiH4LiE4LmI4Lit4Lii4LmD4LiK4LmJ4LiC4Lit4LiH4Lij4Liw4Lia4LiaCiAgICBhcHBseVRoZW1lKGN1cnJlbnRUaGVt',
  'ZSgpKTsKICAgIGdvKHN0YXJ0UGFnZShiKSk7CiAgICByZWZyZXNoQWxlcnRzKCk7CiAgICBzdGFydFBvbGxpbmcoYi5zZXR0aW5ncyAmJiBiLnNldHRpbmdzLnJlZnJlc2hTZWNvbmRzKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgIGRvY3VtZW50LmdldEVs',
  'ZW1lbnRCeUlkKCd2aWV3JykuaW5uZXJIVE1MID0KICAgICAgJzxkaXYgY2xhc3M9ImNhcmQiPjxkaXYgY2xhc3M9ImNhcmQtYiI+PGgzPuC5gOC4iuC4t+C5iOC4reC4oeC4leC5iOC4reC4o+C4sOC4muC4muC5hOC4oeC5iOC4quC4s+C5gOC4o+C5h+C4iDwvaDM+',
  'JyArCiAgICAgICc8cCBjbGFzcz0ibXV0ZWQiPicgKyBlc2MoZS5tZXNzYWdlfHxlKSArICc8L3A+JyArCiAgICAgICc8cCBjbGFzcz0iZnMxMyI+4LiV4Lij4Lin4LiI4Liq4Lit4Lia4Lin4LmI4LiyOiDguYDguJvguLTguJTguIrguLXguJXguYHguKXguYnguKfg',
  'uKPguLHguJkgPGI+4LmA4Lih4LiZ4Li5IPCfj6IgVGhlIE0gQ29ybmVyIEFQIOKGkiDwn5qAIOC4leC4tOC4lOC4leC4seC5ieC4h+C4l+C4seC5ieC4h+C4q+C4oeC4lOC5g+C4meC4hOC4peC4tOC4geC5gOC4lOC4teC4ouC4pzwvYj4gJyArCiAgICAgICfguYDg',
  'uKPguLXguKLguJrguKPguYnguK3guKLguYHguKXguYnguKc8L3A+PC9kaXY+PC9kaXY+JzsKICB9KTsKfQoKLyoqIOC4q+C4meC5ieC4suC5geC4o+C4geC4l+C4teC5iOC4iOC4sOC5gOC4m+C4tOC4lCDigJQg4LiV4Liy4Lih4LiX4Li14LmI4LiV4Lix4LmJ4LiH',
  '4LmE4Lin4LmJIOC5geC4leC5iOC4luC5ieC4suC4oeC4tSAjaGFzaCDguYPguJnguKXguLTguIfguIHguYzguYPguKvguYkgaGFzaCDguIrguJnguLAgKi8KZnVuY3Rpb24gc3RhcnRQYWdlKGIpewogIHZhciBoYXNoID0gKGxvY2F0aW9uLmhhc2ggfHwgJycpLnJl',
  'cGxhY2UoJyMnLCcnKTsKICBpZiAoUEFHRVMuc29tZShmdW5jdGlvbihwKXsgcmV0dXJuIHAuaWQgPT09IGhhc2g7IH0pKSByZXR1cm4gaGFzaDsKICB2YXIgbWFwID0gewogICAgJ+C5geC4lOC4iuC4muC4reC4o+C5jOC4lCc6J2Rhc2hib2FyZCcsICfguKPguLLg',
  'uKLguIHguLLguKPguKrguKPguLjguJvguKPguKfguKEnOidkZWJ0TWFpbicsICfguKvguJnguLXguYnguKrguLTguJknOidkZWJ0U3ViJywKICAgICfguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcnOidwdXJjaGFzZXMnLCAn4LiL4LmI4Lit',
  '4Lih4LmB4LiL4Lih4LiV4Liy4Lih4Lir4LmJ4Lit4LiHJzoncmVwYWlycycKICB9OwogIHJldHVybiBtYXBbYi5zZXR0aW5ncyAmJiBiLnNldHRpbmdzLnN0YXJ0UGFnZV0gfHwgJ2Rhc2hib2FyZCc7Cn0KCi8qKiDguILguYnguK3guITguKfguLLguKHguKHguLjg',
  'uKHguKXguYjguLLguIfguIvguYnguLLguKIg4oCUIOC5gOC4p+C4reC4o+C5jOC4iuC4seC4meC5gOC4p+C5h+C4muC5geC4reC4m+C4iOC4sOC5gOC4guC4teC4ouC4meC4l+C4seC4muC4n+C4seC4h+C4geC5jOC4iuC4seC4meC4meC4teC5iSAqLwpmdW5jdGlv',
  'biBuYXZGb290SHRtbChiKXsKICB2YXIgdSA9IGIudXNlciB8fCB7fTsKICByZXR1cm4gJzxiIHN0eWxlPSJjb2xvcjojYzdkMGUwIj4nICsgZXNjKHUubmFtZSB8fCB1LmxhYmVsIHx8ICcnKSArICc8L2I+JyArCiAgICAodS51c2VybmFtZSA/ICcgPHNwYW4gc3R5',
  'bGU9Im9wYWNpdHk6LjciPkAnICsgZXNjKHUudXNlcm5hbWUpICsgJzwvc3Bhbj4nIDogJycpICsKICAgICc8YnI+PHNwYW4gc3R5bGU9Im9wYWNpdHk6LjgiPicgKyBlc2ModS5yb2xlICYmIHUucm9sZSAhPT0gJ25vbmUnID8gdS5yb2xlIDogdS52aWEgfHwgJycp',
  'ICsgJzwvc3Bhbj4nICsKICAgIChiLnNoZWV0VXJsID8gJzxicj48YSBocmVmPSInICsgYi5zaGVldFVybCArICciIHRhcmdldD0iX2JsYW5rIj7guYDguJvguLTguJQgR29vZ2xlIFNoZWV0IOKGlzwvYT4nIDogJycpICsKICAgICh1LnNpZ25lZEluICYmIHUudXNl',
  'cm5hbWUKICAgICAgPyAnPGJyPjxhIGhyZWY9ImphdmFzY3JpcHQ6dm9pZCgwKSIgb25jbGljaz0iY29uZmlybUxvZ291dCgpIj7guK3guK3guIHguIjguLLguIHguKPguLDguJrguJo8L2E+JwogICAgICA6ICcnKTsKfQoKZnVuY3Rpb24gcmVuZGVyTmF2KCl7CiAg',
  'dmFyIGh0bWwgPSAnJzsKICBQQUdFUy5mb3JFYWNoKGZ1bmN0aW9uKHApewogICAgaWYgKHAuc2VjKSBodG1sICs9ICc8ZGl2IGNsYXNzPSJuYXYtc2VjIj4nICsgcC5zZWMgKyAnPC9kaXY+JzsKICAgIGh0bWwgKz0gJzxidXR0b24gY2xhc3M9Im5hdi1pdGVtIiBp',
  'ZD0ibmF2LScgKyBwLmlkICsgJyIgb25jbGljaz0iZ28oXCcnICsgcC5pZCArICdcJykiPicgKwogICAgICAgICAgICAgICc8c3BhbiBjbGFzcz0iaWMiPicgKyBwLmljICsgJzwvc3Bhbj48c3Bhbj4nICsgcC5sYWJlbCArICc8L3NwYW4+JyArCiAgICAgICAgICAg',
  'ICAgJzxzcGFuIGNsYXNzPSJiYWRnZSIgaWQ9ImJhZGdlLScgKyBwLmlkICsgJyIgc3R5bGU9ImRpc3BsYXk6bm9uZSI+PC9zcGFuPicgKwogICAgICAgICAgICAnPC9idXR0b24+JzsKICB9KTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2TGlzdCcpLmlu',
  'bmVySFRNTCA9IGh0bWw7Cn0KCmZ1bmN0aW9uIGdvKHBhZ2UpewogIFMucGFnZSA9IHBhZ2U7CiAgUy5wYXJhbXMgPSB7fTsKICBsb2NhdGlvbi5oYXNoID0gcGFnZTsKICB2YXIgbWV0YSA9IFBBR0VTLmZpbHRlcihmdW5jdGlvbihwKXtyZXR1cm4gcC5pZD09PXBh',
  'Z2U7fSlbMF0gfHwgUEFHRVNbMF07CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BhZ2VUaXRsZScpLnRleHRDb250ZW50ID0gbWV0YS5sYWJlbDsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFnZVN1YicpLnRleHRDb250ZW50ID0gbWV0YS5zdWI7CiAg',
  'UEFHRVMuZm9yRWFjaChmdW5jdGlvbihwKXsKICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXYtJyArIHAuaWQpOwogICAgaWYgKGVsKSBlbC5jbGFzc0xpc3QudG9nZ2xlKCdvbicsIHAuaWQgPT09IHBhZ2UpOwogIH0pOwogIGRvY3VtZW50',
  'LmdldEVsZW1lbnRCeUlkKCduYXYnKS5jbGFzc0xpc3QucmVtb3ZlKCdvcGVuJyk7CiAgcmVtb3ZlU2NyaW0oKTsKICBsb2FkKCk7Cn0KCmZ1bmN0aW9uIHJlZnJlc2goKXsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9CgpmdW5jdGlvbiBzZXRZZWFyKHkpewogIFMu',
  'eWVhciA9IHk7CiAgbG9hZCgpOwp9CgovKioKICog4LmC4Lir4Lil4LiU4LiC4LmJ4Lit4Lih4Li54Lil4LiC4Lit4LiH4Lir4LiZ4LmJ4Liy4Lib4Lix4LiI4LiI4Li44Lia4Lix4LiZCiAqCiAqIEBwYXJhbSB7e3F1aWV0OmJvb2xlYW59PX0gb3B0cwogKiAgIHF1',
  'aWV0ID0g4LiL4Li04LiH4LiB4LmM4LmA4LiH4Li14Lii4LiaIOC5hiDguYDguJrguLfguYnguK3guIfguKvguKXguLHguIcg4LmE4Lih4LmI4Lil4LmJ4Liy4LiH4Lir4LiZ4LmJ4Liy4LmA4Lib4LmH4LiZ4Lin4LiH4LiB4Lil4Lih4Lir4Lih4Li44LiZIOC5geC4',
  'peC4sOC4hOC4t+C4meC4leC4s+C5geC4q+C4meC5iOC4h+C4l+C4teC5iOC5gOC4peC4t+C5iOC4reC4meC4hOC5ieC4suC4h+C5hOC4p+C5iQogKiAgICAgICAgICAg4LmD4LiK4LmJ4Lir4Lil4Lix4LiH4LiB4LiU4Lia4Lix4LiZ4LiX4Li24LiBIOC5geC4peC4',
  'sOC4leC4reC4meC4nuC4muC4p+C5iOC4suC4oeC4teC4hOC4meC5geC4geC5ieC4guC5ieC4reC4oeC4ueC4peC4iOC4suC4geC4l+C4teC5iOC4reC4t+C5iOC4mQogKiAgICAgICAgICAg4LmA4Lie4Li34LmI4Lit4LmD4Lir4LmJ4Lir4LiZ4LmJ4Liy4LiI4Lit',
  '4LiZ4Li04LmI4LiH4LiX4Li14LmI4Liq4Li44LiUIOC5hOC4oeC5iOC4geC4o+C4sOC4nuC4o+C4tOC4muC5geC4peC4sOC5hOC4oeC5iOC5gOC4lOC5ieC4h+C4geC4peC4seC4muC5hOC4m+C4muC4meC4quC4uOC4lAogKi8KZnVuY3Rpb24gbG9hZChvcHRzKXsK',
  'ICBvcHRzID0gKG9wdHMgPT09IHRydWUpID8ge30gOiAob3B0cyB8fCB7fSk7ICAgICAvLyDguYDguJzguLfguYjguK3guYLguITguYnguJTguYDguIHguYjguLLguJfguLXguYjguYDguKPguLXguKLguIEgbG9hZCh0cnVlKQogIHZhciBxdWlldCA9ICEhb3B0cy5x',
  'dWlldDsKICB2YXIgdmlldyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aWV3Jyk7CiAgdmFyIHIgPSBST1VURVNbUy5wYWdlXTsKICBpZiAoIXIpIHsgdmlldy5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz0iZW1wdHkiPuC5hOC4oeC5iOC4nuC4muC4q+C4meC5',
  'ieC4suC4meC4teC5iTwvZGl2Pic7IHJldHVybiBQcm9taXNlLnJlc29sdmUoKTsgfQoKICBpZiAoIXF1aWV0KSB7CiAgICB2aWV3LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj48c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFu',
  'PjwvZGl2PuC4geC4s+C4peC4seC4h+C5guC4q+C4peC4lOC4guC5ieC4reC4oeC4ueC4peKApjwvZGl2Pic7CiAgfSBlbHNlIHsKICAgIHN5bmNTZXQoJ3N5bmNpbmcnKTsKICB9CgogIHZhciBrZWVwID0gcXVpZXQgPyBzbmFwc2hvdFZpZXcoKSA6IG51bGw7Cgog',
  'IHJldHVybiByLmxvYWQoKS50aGVuKGZ1bmN0aW9uKGRhdGEpewogICAgUy5jYWNoZVtTLnBhZ2VdID0gZGF0YTsKICAgIHN5bmNZZWFyT3B0aW9ucyhkYXRhLnllYXJzIHx8IGRhdGEuYXZhaWxhYmxlIHx8IFtdKTsKICAgIHZpZXcuaW5uZXJIVE1MID0gci5yZW5k',
  'ZXIoZGF0YSk7CiAgICBhcHBseVJlYWRPbmx5KHZpZXcpOwogICAgaWYgKHIuYWZ0ZXIpIHIuYWZ0ZXIoZGF0YSk7CiAgICBpZiAoa2VlcCkgcmVzdG9yZVZpZXcoa2VlcCk7CiAgICBpZiAocXVpZXQpIHN5bmNTZXQoJ3N5bmNlZCcpOwogIH0pLmNhdGNoKGZ1bmN0',
  'aW9uKGUpewogICAgaWYgKHF1aWV0KSB7ICAgICAgICAgICAgICAgICAgICAgICAvLyDguIvguLTguIfguIHguYzguYDguJrguLfguYnguK3guIfguKvguKXguLHguIfguJ7guKXguLLguJQg4oCUIOC4reC4ouC5iOC4suC4l+C4tOC5ieC4h+C4guC4reC4h+C4l+C4',
  'teC5iOC5gOC4q+C5h+C4meC4reC4ouC4ueC5iAogICAgICBzeW5jU2V0KGlzT2ZmbGluZUVycm9yKGUpID8gJ29mZmxpbmUnIDogJ2Vycm9yJywgZS5tZXNzYWdlIHx8IGUpOwogICAgICByZXR1cm47CiAgICB9CiAgICB2aWV3LmlubmVySFRNTCA9ICc8ZGl2IGNs',
  'YXNzPSJjYXJkIj48ZGl2IGNsYXNzPSJjYXJkLWIiPjxoMz7guYLguKvguKXguJTguILguYnguK3guKHguLnguKXguYTguKHguYjguKrguLPguYDguKPguYfguIg8L2gzPicgKwogICAgICAgICAgICAgICAgICAgICAnPHAgY2xhc3M9Im11dGVkIj4nICsgZXNjKGUu',
  'bWVzc2FnZXx8ZSkgKyAnPC9wPicgKwogICAgICAgICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJsb2FkKCkiPuC4peC4reC4h+C5g+C4q+C4oeC5iDwvYnV0dG9uPjwvZGl2PjwvZGl2Pic7CiAgfSk7Cn0KCi8qKiDguIjguLPguKrg',
  'uKDguLLguJ7guKvguJnguYnguLLguIjguK3guYTguKfguYnguIHguYjguK3guJnguKfguLLguJTguYPguKvguKHguYgg4LmA4Lie4Li34LmI4Lit4LmD4Lir4LmJ4Lic4Li54LmJ4LmD4LiK4LmJ4Lij4Li54LmJ4Liq4Li24LiB4Lin4LmI4Liy4Lir4LiZ4LmJ4Liy',
  '4LmE4Lih4LmI4LmE4LiU4LmJ4LiW4Li54LiB4LmC4Lir4Lil4LiU4LmD4Lir4Lih4LmIICovCmZ1bmN0aW9uIHNuYXBzaG90VmlldygpewogIHZhciBvcGVuID0gW107CiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmJpbGwtbGluZXMnKS5mb3JFYWNoKGZ1',
  'bmN0aW9uKGVsKXsKICAgIGlmICghZWwuaGlkZGVuKSBvcGVuLnB1c2goZWwuaWQpOwogIH0pOwogIHJldHVybiB7IHk6IHdpbmRvdy5zY3JvbGxZIHx8IDAsIG9wZW46IG9wZW4gfTsKfQoKZnVuY3Rpb24gcmVzdG9yZVZpZXcoa2VlcCl7CiAga2VlcC5vcGVuLmZv',
  'ckVhY2goZnVuY3Rpb24oaWQpewogICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpOwogICAgaWYgKGVsKSB7IGVsLmhpZGRlbiA9IGZhbHNlOyB2YXIgYiA9IGVsLnByZXZpb3VzRWxlbWVudFNpYmxpbmc7CiAgICAgICAgICAgICAgaWYgKGIp',
  'IGIudGV4dENvbnRlbnQgPSBiLnRleHRDb250ZW50LnJlcGxhY2UoJ+KWvicsICfilrQnKTsgfQogIH0pOwogIGlmIChrZWVwLnkpIHdpbmRvdy5zY3JvbGxUbygwLCBrZWVwLnkpOwp9CgovKiog4LmA4LiV4Li04Lih4LiV4Lix4Lin4LmA4Lil4Li34Lit4LiB4Lib',
  '4Li14LmD4LiZ4LmB4LiW4Lia4Lia4LiZ4LmD4Lir4LmJ4LiV4Lij4LiH4LiB4Lix4Lia4LiC4LmJ4Lit4Lih4Li54Lil4LiI4Lij4Li04LiH4LiC4Lit4LiH4Lir4LiZ4LmJ4Liy4LiZ4Lix4LmJ4LiZICovCmZ1bmN0aW9uIHN5bmNZZWFyT3B0aW9ucyh5ZWFycyl7',
  'CiAgdmFyIHNlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd5ZWFyU2VsJyk7CiAgdmFyIGxpc3QgPSAoeWVhcnMgfHwgW10pLnNsaWNlKCkuc29ydChmdW5jdGlvbihhLGIpe3JldHVybiBiLWE7fSk7CiAgdmFyIGN1ciA9IG5ldyBEYXRlKCkuZ2V0RnVsbFll',
  'YXIoKTsKICBpZiAobGlzdC5pbmRleE9mKGN1cikgPCAwKSBsaXN0LnVuc2hpZnQoY3VyKTsKICB2YXIgaHRtbCA9ICc8b3B0aW9uIHZhbHVlPSJhbGwiPuC4l+C4uOC4geC4m+C4tTwvb3B0aW9uPic7CiAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHkpewogICAgaHRt',
  'bCArPSAnPG9wdGlvbiB2YWx1ZT0iJyArIHkgKyAnIj7guJvguLUgJyArIHkgKyAnICjguJ4u4LioLiAnICsgKE51bWJlcih5KSs1NDMpICsgJyk8L29wdGlvbj4nOwogIH0pOwogIHNlbC5pbm5lckhUTUwgPSBodG1sOwogIGlmIChsaXN0LmluZGV4T2YoTnVtYmVy',
  'KFMueWVhcikpIDwgMCAmJiBTLnllYXIgIT09ICdhbGwnKSBTLnllYXIgPSBTdHJpbmcoY3VyKTsKICBzZWwudmFsdWUgPSBTLnllYXI7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4LmC4Lir4Lih4LiU4LiU4Li54Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4Lin',
  'IC0tLS0tLS0tLS0tLS0tLS0KICAg4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4LiB4Lix4LiZ4LmE4Lin4LmJ4LmB4Lil4LmJ4Lin4LmD4LiZ4Lif4Lix4LiH4LiB4LmM4LiK4Lix4LiZIGFwaSgpIOC4leC4o+C4h+C4meC4teC5',
  'ieC5geC4hOC5iOC4i+C5iOC4reC4meC4m+C4uOC5iOC4oeC4l+C4teC5iOC4geC4lOC5hOC4m+C4geC5h+C4l+C4s+C5hOC4oeC5iOC5hOC4lOC5iQogICDguYDguJ7guLfguYjguK3guYTguKHguYjguYPguKvguYnguJzguLnguYnguJfguLXguYjguYDguJvguLTg',
  'uJTguJTguYnguKfguKLguKXguLTguIfguIHguYzguYHguIrguKPguYzguKrguLHguJrguKrguJkgKi8KdmFyIEVESVRfRU5UUllQT0lOVFMgPSAvXGIoZm9ybURlYnR8Zm9ybURlYnRQYXltZW50fGZvcm1QdXJjaGFzZXxmb3JtQWN8Zm9ybUJ1bGtBY3xmb3JtUmVw',
  'YWlyfGZvcm1CdWlsZGluZ3xmb3JtUm9vbXxmb3JtRmluYW5jZXxmb3JtVXNlcnxkZWxEZWJ0fGRlbERlYnRQYXltZW50fGRlbFB1cmNoYXNlfGRlbEFjfGRlbFJlcGFpcnxkZWxCdWlsZGluZ3xkZWxGaW5hbmNlfGRlbFVzZXJ8ZG9JbXBvcnRKc29ufGRvUm90YXRl',
  'U2hhcmV8ZG9CYWNrdXBOb3d8c2F2ZVNldHRpbmdzRm9ybSlccypcKC87CgpmdW5jdGlvbiBhcHBseVJlYWRPbmx5KHJvb3QpewogIGlmIChjYW5FZGl0KCkpIHJldHVybjsKICB2YXIgbm9kZXMgPSByb290LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tvbmNsaWNrXScpOwog',
  'IGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHsKICAgIGlmIChFRElUX0VOVFJZUE9JTlRTLnRlc3Qobm9kZXNbaV0uZ2V0QXR0cmlidXRlKCdvbmNsaWNrJykgfHwgJycpKSBub2Rlc1tpXS5yZW1vdmUoKTsKICB9Cn0KCi8qIC0tLS0tLS0t',
  'LS0tLS0tLS0g4Lij4Li14LmA4Lif4Lij4LiK4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li04LmA4Lih4Li34LmI4Lit4LiC4LmJ4Lit4Lih4Li54Lil4LmD4LiZ4LiK4Li14LiV4LmA4Lib4Lil4Li14LmI4Lii4LiZIC0tLS0tLS0tLS0tLS0tLS0KCiAgIOC4geC4',
  'juC5gOC4q+C4peC5h+C4geC4guC4reC4h+C4quC5iOC4p+C4meC4meC4teC5iTog4Lir4LmJ4Liy4Lih4LmC4Lir4Lil4LiU4LiX4Lix4Lia4Liq4Li04LmI4LiH4LiX4Li14LmI4Lic4Li54LmJ4LmD4LiK4LmJ4LiB4Liz4Lil4Lix4LiH4Lie4Li04Lih4Lie4LmM',
  '4Lit4Lii4Li54LmI4LmA4LiU4LmH4LiU4LiC4Liy4LiUCiAgIOC4luC5ieC4suC4oeC4teC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C4oeC5iOC4leC4reC4meC4l+C4teC5iOC4nOC4ueC5ieC5g+C4iuC5ieC4geC4s+C4peC4seC4h+C4geC4o+C4reC4geC4reC4',
  'ouC4ueC5iCDguYPguKvguYnguILguLbguYnguJnguJvguLjguYjguKHguYDguKXguYfguIEg4LmGIOC5g+C4q+C5ieC4geC4lOC5gOC4reC4h+C5gOC4oeC4t+C5iOC4reC4nuC4o+C5ieC4reC4oQoKICAg4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4OiDguKPguLjg',
  'uYjguJnguILguYnguK3guKHguLnguKXguJTguLnguIjguLLguIEgIuC5gOC4p+C4peC4suC4l+C4teC5iOC4iuC4teC4leC4luC4ueC4geC5geC4geC5ieC4peC5iOC4suC4quC4uOC4lCIg4LiC4Lit4LiHIEdvb2dsZSBEcml2ZQogICDguIvguLbguYjguIfguILg',
  'uKLguLHguJrguJfguLjguIHguITguKPguLHguYnguIfguJfguLXguYjguKHguLXguIHguLLguKPguYDguILguLXguKLguJkg4Lij4Lin4Lih4LiW4Li24LiH4LiV4Lit4LiZ4LiX4Li14LmI4LmA4Lij4Liy4LmA4Lit4LiH4LiB4LiU4Lia4Lix4LiZ4LiX4Li24LiB',
  '4LiU4LmJ4Lin4LiiCiAgIOC4iOC4tuC4h+C4leC5ieC4reC4h+C4iOC4lOC4o+C4uOC5iOC4meC5g+C4q+C4oeC5iOC5hOC4p+C5ieC4q+C4peC4seC4h+C4muC4seC4meC4l+C4tuC4geC4l+C4uOC4geC4hOC4o+C4seC5ieC4hyDguYTguKHguYjguIfguLHguYng',
  'uJnguIjguLDguYLguKvguKXguJTguIvguYnguLPguYHguKXguLDguILguLbguYnguJnguILguYnguK3guITguKfguLLguKEKICAg4Lin4LmI4LiyICLguKHguLXguITguJnguYHguIHguYnguILguYnguK3guKHguLnguKUiIOC4l+C4seC5ieC4h+C4l+C4teC5iOC4',
  'hOC4meC5geC4geC5ieC4hOC4t+C4reC4nOC4ueC5ieC5g+C4iuC5ieC5gOC4reC4hwotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKiDguITguLPguKrguLHguYjguIfguJfguLXg',
  'uYjguJfguLPguYPguKvguYnguILguYnguK3guKHguLnguKXguYPguJnguIrguLXguJXguYDguJvguKXguLXguYjguKLguJkgKOC5g+C4q+C5ieC4leC4o+C4h+C4geC4seC4miBNVVRBVElOR19BQ1RJT05TIOC4neC4seC5iOC4h+C5gOC4i+C4tOC4o+C5jOC4n+C5',
  'gOC4p+C4reC4o+C5jCkgKi8KdmFyIENMSUVOVF9NVVRBVElORyA9IC9cLihzYXZlfGRlbGV0ZXxzYXZlUGF5bWVudHxkZWxldGVQYXltZW50fGJ1bGtCb29rfGltcG9ydHxyb3RhdGVUb2tlbnxiYWNrdXBOb3d8dXBsb2FkfHRyYXNofHRvZ2dsZSkkLzsKCi8qKgog',
  'KiDguYDguJ7guLTguYjguIfguIHguJTguJrguLHguJnguJfguLbguIHguYDguK3guIcg4oCUIOC4q+C4meC5ieC4suC5guC4q+C4peC4lOC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C4oeC5iOC5hOC4m+C5geC4peC5ieC4p+C4leC4reC4meC4geC4lOC4muC4seC4',
  'meC4l+C4tuC4gQogKiDguIjguJTguKPguLjguYjguJnguILguYnguK3guKHguLnguKXguKXguYjguLLguKrguLjguJTguYTguKfguYkg4LmB4Lil4Liw4LiB4Lix4LiZ4LmE4Lih4LmI4LmD4Lir4LmJ4Lij4Lit4Lia4LiV4Lij4Lin4LiI4LiW4Lix4LiU4LmE4Lib',
  '4LmC4Lir4Lil4LiU4LiL4LmJ4LizCiAqICjguYDguJzguLfguYjguK3guYTguKfguYkgMiDguJnguLLguJfguLUg4LmA4Lie4Lij4Liy4LiwIEdvb2dsZSBEcml2ZSDguK3guLHguJvguYDguJTguJXguYDguKfguKXguLLguYHguIHguYnguYTguILguIrguYnguLLg',
  'uIHguKfguYjguLLguIHguLLguKPguYDguILguLXguKLguJnguIjguKPguLTguIfguYDguKXguYfguIHguJnguYnguK3guKIpCiAqLwpmdW5jdGlvbiBtYXJrU2VsZkNoYW5nZSgpewogIFMuc2VsZkNoYW5nZVVudGlsID0gRGF0ZS5ub3coKSArIDEyMDAwMDsKICBj',
  'bGVhclRpbWVvdXQoUy5zeW5jVGltZXIpOwogIFMuc3luY1RpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpewogICAgc3luY1ZlcnNpb24oKTsKICAgIHJlZnJlc2hBbGVydHMoKTsgICAgIC8vIOC4h+C4suC4meC4hOC5ieC4suC4h+C4reC4suC4iOC5gOC4nuC4',
  'tOC5iOC4oeC4q+C4o+C4t+C4reC4peC4lOC4iOC4suC4geC4quC4tOC5iOC4h+C4l+C4teC5iOC5gOC4nuC4tOC5iOC4h+C4muC4seC4meC4l+C4tuC4geC5hOC4mwogIH0sIDE1MDApOwp9CgpmdW5jdGlvbiBzeW5jVmVyc2lvbigpewogIGNhbGxBcGkoJ2FwcC52',
  'ZXJzaW9uJykKICAgIC50aGVuKGZ1bmN0aW9uKHYpeyBpZiAodiAmJiB2LnZlcnNpb24pIFMudmVyc2lvbiA9IHYudmVyc2lvbjsgfSkKICAgIC5jYXRjaChmdW5jdGlvbigpeyAvKiDguYTguKfguYnguKPguK3guJrguKvguJnguYnguLIgKi8gfSk7Cn0KCi8qKiDg',
  'uJzguLnguYnguYPguIrguYnguIHguLPguKXguLHguIfguIHguKPguK3guIHguILguYnguK3guKHguLnguKXguK3guKLguLnguYjguKvguKPguLfguK3guYDguJvguKXguYjguLIg4oCUIOC4luC5ieC4suC5g+C4iuC5iCDguKvguYnguLLguKHguYLguKvguKXguJTg',
  'uJfguLHguJogKi8KZnVuY3Rpb24gdXNlcklzQnVzeSgpewogIHZhciBtb2RhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb2RhbFJvb3QnKTsKICBpZiAobW9kYWwgJiYgbW9kYWwuaW5uZXJIVE1MKSByZXR1cm4gdHJ1ZTsgICAgICAgICAgICAgIC8vIOC4',
  'n+C4reC4o+C5jOC4oeC5gOC4m+C4tOC4lOC4hOC5ieC4suC4h+C4reC4ouC4ueC5iAogIHZhciBlbCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7CiAgaWYgKGVsICYmIC9eKElOUFVUfFRFWFRBUkVBfFNFTEVDVCkkLy50ZXN0KGVsLnRhZ05hbWUpICYmCiAgICAg',
  'IGVsLnR5cGUgIT09ICdidXR0b24nICYmIGVsLnR5cGUgIT09ICdzdWJtaXQnKSByZXR1cm4gdHJ1ZTsgICAvLyDguYDguITguK3guKPguYzguYDguIvguK3guKPguYzguK3guKLguLnguYjguYPguJnguIrguYjguK3guIfguIHguKPguK3guIEKICByZXR1cm4gZmFs',
  'c2U7Cn0KCmZ1bmN0aW9uIHJlZnJlc2hMYWJlbChzZWMpewogIGlmICghc2VjKSByZXR1cm4gJ+C4m+C4tOC4lOC4geC4suC4o+C4leC4o+C4p+C4iOC4reC4seC4leC5guC4meC4oeC4seC4leC4tCc7CiAgaWYgKHNlYyAlIDM2MDAgPT09IDApIHJldHVybiAn4LiV',
  '4Lij4Lin4LiI4LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmI4LiX4Li44LiBICcgKyAoc2VjIC8gMzYwMCkgKyAnIOC4iuC4seC5iOC4p+C5guC4oeC4hyc7CiAgaWYgKHNlYyAlIDYwID09PSAwKSByZXR1cm4gJ+C4leC4o+C4p+C4iOC4guC5ieC4reC4oeC4',
  'ueC4peC5g+C4q+C4oeC5iOC4l+C4uOC4gSAnICsgKHNlYyAvIDYwKSArICcg4LiZ4Liy4LiX4Li1JzsKICByZXR1cm4gJ+C4leC4o+C4p+C4iOC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C4oeC5iOC4l+C4uOC4gSAnICsgc2VjICsgJyDguKfguLTguJnguLLguJfg',
  'uLUnOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4leC4seC4p+C4muC4reC4geC4quC4luC4suC4meC4sOC4geC4suC4o+C4i+C4tOC4h+C4geC5jCAo4Lih4Li44Lih4LiC4Lin4Liy4Lia4LiZKSAtLS0tLS0tLS0tLS0tLS0tCgogICDguKvguJnguYnguLLguJfg',
  'uLXguYg6IOC4muC4reC4geC5g+C4q+C5ieC4o+C4ueC5ieC4leC4peC4reC4lOC4p+C5iOC4suC4leC4reC4meC4meC4teC5ieC4guC5ieC4reC4oeC4ueC4peC4leC4o+C4h+C4geC4seC4muC4q+C4peC4seC4h+C4muC5ieC4suC4meC4q+C4o+C4t+C4reC4ouC4',
  'seC4hwogICDguIHguLPguKXguLHguIfguJrguLHguJnguJfguLbguIHguK3guKLguLnguYjguYTguKvguKEg4Lir4Lij4Li34Lit4Lih4Li14Lit4Liw4LmE4Lij4LiE4LmJ4Liy4LiH4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LiI4Lix4LiU4LiB4Liy4LijCgogICDg',
  'uJXguLHguYnguIfguYPguIjguYPguKvguYkgIuC5gOC4h+C4teC4ouC4muC5gOC4oeC4t+C5iOC4reC4l+C4uOC4geC4reC4ouC5iOC4suC4h+C4m+C4geC4leC4tCDguYHguKXguLDguIrguLHguJTguYDguIjguJnguYDguKHguLfguYjguK3guKHguLXguK3guLDg',
  'uYTguKPguJzguLTguJTguJvguIHguJXguLQiCiAgIOC4quC4luC4suC4meC4sOC4l+C4teC5iOC4leC5ieC4reC4h+C5g+C4q+C5ieC4nOC4ueC5ieC5g+C4iuC5ieC4l+C4s+C4reC4sOC5hOC4o+C4leC5iOC4rSAo4Lih4Li14LiC4LmJ4Lit4Lih4Li54Lil4LmD',
  '4Lir4Lih4LmIIC8g4LmA4LiK4Li34LmI4Lit4Lih4LiV4LmI4Lit4LmE4Lih4LmI4LmE4LiU4LmJKSDguIHguJTguYTguJTguYkKLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovCgp2YXIg',
  'U1lOQyA9IHsgc3RhdGU6ICdzeW5jZWQnLCBkZXRhaWw6ICcnLCBhdDogMCwgdGltZXI6IG51bGwgfTsKCnZhciBTWU5DX0xPT0sgPSB7CiAgc3luY2VkOiAgeyBjbHM6ICdvaycsICAgaWNvbjogJ+KXjycsICB0ZXh0OiAn4LiL4Li04LiH4LiB4LmM4LmB4Lil4LmJ',
  '4LinJyB9LAogIHN5bmNpbmc6IHsgY2xzOiAnaW5mbycsIGljb246ICcnLCAgIHRleHQ6ICfguIHguLPguKXguLHguIfguIvguLTguIfguIHguYzigKYnLCAgIHNwaW46IHRydWUgfSwKICBzYXZpbmc6ICB7IGNsczogJ2luZm8nLCBpY29uOiAnJywgICB0ZXh0OiAn',
  '4LiB4Liz4Lil4Lix4LiH4Lia4Lix4LiZ4LiX4Li24LiB4oCmJywgIHNwaW46IHRydWUgfSwKICBzYXZlZDogICB7IGNsczogJ29rJywgICBpY29uOiAn4pyTJywgIHRleHQ6ICfguJrguLHguJnguJfguLbguIHguYHguKXguYnguKcnIH0sCiAgcGVuZGluZzogeyBj',
  'bHM6ICd3YXJuJywgaWNvbjogJ+KGuycsICB0ZXh0OiAn4Lih4Li14LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmIJywgIGNsaWNrOiAnbG9hZFBlbmRpbmcoKScgfSwKICBvZmZsaW5lOiB7IGNsczogJ2RncicsICBpY29uOiAn4pqgJywgIHRleHQ6ICfguYDg',
  'uIrguLfguYjguK3guKHguJXguYjguK3guYTguKHguYjguYTguJTguYknLCBjbGljazogJ3JldHJ5U3luYygpJyB9LAogIGVycm9yOiAgIHsgY2xzOiAnZGdyJywgIGljb246ICfimqAnLCAgdGV4dDogJ+C4muC4seC4meC4l+C4tuC4geC5hOC4oeC5iOC4quC4s+C5',
  'gOC4o+C5h+C4iCcsIGNsaWNrOiAncmV0cnlTeW5jKCknIH0sCiAgcGF1c2VkOiAgeyBjbHM6ICdtdXRlJywgaWNvbjogJ+KXiycsICB0ZXh0OiAn4LmE4Lih4LmI4LiV4Lij4Lin4LiI4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0JywgY2xpY2s6ICdsb2FkUGVu',
  'ZGluZygpJyB9Cn07CgovKioKICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlIOC4iuC4t+C5iOC4reC4quC4luC4suC4meC4sOC5g+C4mSBTWU5DX0xPT0sKICogQHBhcmFtIHtzdHJpbmc9fSBkZXRhaWwg4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Lit4LiY4Li04Lia4Liy',
  '4Lii4LmA4Lie4Li04LmI4LihICjguYLguJzguKXguYjguJXguK3guJnguYDguK3guLLguYDguKHguLLguKrguYzguIrguLXguYkpCiAqLwpmdW5jdGlvbiBzeW5jU2V0KHN0YXRlLCBkZXRhaWwpewogIC8vIOC4quC4luC4suC4meC4sOC4l+C4teC5iOC4leC5ieC4',
  'reC4h+C5g+C4q+C5ieC4nOC4ueC5ieC5g+C4iuC5ieC4iOC4seC4lOC4geC4suC4oyDguKvguYnguLLguKHguJbguLnguIHguKrguJbguLLguJnguLDguJfguLHguYjguKfguYTguJvguKHguLLguIHguKXguJrguJfguLTguYnguIcKICBpZiAoKFNZTkMuc3RhdGUg',
  'PT09ICdwZW5kaW5nJyB8fCBTWU5DLnN0YXRlID09PSAnb2ZmbGluZScpICYmCiAgICAgIChzdGF0ZSA9PT0gJ3N5bmNlZCcgfHwgc3RhdGUgPT09ICdzeW5jaW5nJykpIHJldHVybjsKCiAgU1lOQy5zdGF0ZSA9IHN0YXRlOwogIFNZTkMuZGV0YWlsID0gZGV0YWls',
  'IHx8ICcnOwogIGlmIChzdGF0ZSA9PT0gJ3N5bmNlZCcgfHwgc3RhdGUgPT09ICdzYXZlZCcpIFNZTkMuYXQgPSBEYXRlLm5vdygpOwogIHN5bmNQYWludCgpOwoKICBjbGVhclRpbWVvdXQoU1lOQy50aW1lcik7CiAgaWYgKHN0YXRlID09PSAnc2F2ZWQnKSB7ICAg',
  'ICAgICAgICAgICAgICAgICAgICAvLyDguYLguIrguKfguYwgIuC4muC4seC4meC4l+C4tuC4geC5geC4peC5ieC4pyIg4LmB4Lib4LmK4Lia4LmA4LiU4Li14Lii4Lin4LmB4Lil4LmJ4Lin4LiB4Lil4Lix4Lia4LmE4Lib4Lib4LiB4LiV4Li0CiAgICBTWU5DLnRp',
  'bWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpewogICAgICBpZiAoU1lOQy5zdGF0ZSA9PT0gJ3NhdmVkJykgc3luY1NldCgnc3luY2VkJyk7CiAgICB9LCAyNjAwKTsKICB9Cn0KCmZ1bmN0aW9uIHN5bmNQYWludCgpewogIHZhciBkb3QgPSBkb2N1bWVudC5nZXRF',
  'bGVtZW50QnlJZCgnbGl2ZURvdCcpOwogIGlmICghZG90KSByZXR1cm47CiAgdmFyIGxvb2sgPSBTWU5DX0xPT0tbU1lOQy5zdGF0ZV0gfHwgU1lOQ19MT09LLnN5bmNlZDsKCiAgdmFyIHRpcCA9IFNZTkMuZGV0YWlsIHx8IHN5bmNUb29sdGlwKCk7CiAgLy8g4Lir',
  '4LmI4Lit4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LmE4Lin4LmJIOC5gOC4nuC4t+C5iOC4reC5g+C4q+C5ieC4iOC4reC5geC4hOC4muC4i+C5iOC4reC4meC5gOC4ieC4nuC4suC4sOC4guC5ieC4reC4hOC4p+C4suC4oeC5geC4peC4sOC4ouC4seC4h+C5gOC4q+C5',
  'h+C4meC5hOC4reC4hOC4reC4meC4reC4ouC4ueC5iAogIHZhciBib2R5ID0gKGxvb2suc3BpbiA/ICc8c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiAnIDogKGxvb2suaWNvbiA/IGxvb2suaWNvbiArICcgJyA6ICcnKSkgKwogICAgICAgICAgICAgJzxzcGFuIGNs',
  'YXNzPSJzeW5jLWxhYmVsIj4nICsgbG9vay50ZXh0ICsgJzwvc3Bhbj4nOwogIHZhciBjbHMgPSAnYiAnICsgbG9vay5jbHMgKyAnIHN5bmMtcGlsbCc7CgogIGRvdC5pbm5lckhUTUwgPSBsb29rLmNsaWNrCiAgICA/ICc8YnV0dG9uIGNsYXNzPSInICsgY2xzICsg',
  'JyIgc3R5bGU9ImJvcmRlcjowO2N1cnNvcjpwb2ludGVyO2ZvbnQ6aW5oZXJpdCIgJyArCiAgICAgICd0aXRsZT0iJyArIGVzYyh0aXApICsgJyIgb25jbGljaz0iJyArIGxvb2suY2xpY2sgKyAnIj4nICsgYm9keSArICc8L2J1dHRvbj4nCiAgICA6ICc8c3BhbiBj',
  'bGFzcz0iJyArIGNscyArICciIHRpdGxlPSInICsgZXNjKHRpcCkgKyAnIj4nICsgYm9keSArICc8L3NwYW4+JzsKfQoKZnVuY3Rpb24gc3luY1Rvb2x0aXAoKXsKICB2YXIgYmFzZSA9IHJlZnJlc2hMYWJlbChQT0xMX1NFQ09ORFMpICsgJyDCtyDguYTguKHguYjg',
  'uYLguKvguKXguJTguJfguLHguJrguJXguK3guJnguIHguLPguKXguLHguIfguIHguKPguK3guIHguILguYnguK3guKHguLnguKUnOwogIGlmICghU1lOQy5hdCkgcmV0dXJuIGJhc2U7CiAgdmFyIGQgPSBuZXcgRGF0ZShTWU5DLmF0KTsKICB2YXIgaGggPSAoJzAn',
  'ICsgZC5nZXRIb3VycygpKS5zbGljZSgtMiksIG1tID0gKCcwJyArIGQuZ2V0TWludXRlcygpKS5zbGljZSgtMik7CiAgcmV0dXJuICfguJXguKPguIfguIHguLHguJrguILguYnguK3guKHguLnguKXguKvguKXguLHguIfguJrguYnguLLguJnguYDguKHguLfguYjg',
  'uK0gJyArIGhoICsgJzonICsgbW0gKyAnIOC4mS5cbicgKyBiYXNlOwp9CgovKiog4LmA4LiZ4LmH4LiV4Liq4Liw4LiU4Li44LiUL+C4q+C4peC4uOC4lCDguJXguYjguLLguIfguIjguLLguIEgIuC5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jOC4leC4',
  'reC4muC4p+C5iOC4suC4l+C4s+C5hOC4oeC5iOC5hOC4lOC5iSIg4LiL4Li24LmI4LiH4LmA4Lib4LmH4LiZ4LiE4Lin4Liy4Lih4Lic4Li04LiU4LiC4Lit4LiH4LiE4Liz4Liq4Lix4LmI4LiHICovCmZ1bmN0aW9uIGlzT2ZmbGluZUVycm9yKGUpewogIGlmICh0',
  'eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3Iub25MaW5lID09PSBmYWxzZSkgcmV0dXJuIHRydWU7CiAgdmFyIG0gPSBTdHJpbmcoKGUgJiYgZS5tZXNzYWdlKSB8fCBlIHx8ICcnKTsKICByZXR1cm4gL25ldHdvcmt8ZmFpbGVkfHRp',
  'bWVvdXR84LmA4LiE4Lij4Li34Lit4LiC4LmI4Liy4LiifOC5gOC4iuC4t+C5iOC4reC4oeC4leC5iOC4rXzguYTguKHguYjguYTguJTguYnguKPguLHguJrguILguYnguK3guKHguLnguKXguIjguLLguIHguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYwv',
  'aS50ZXN0KG0pOwp9CgovKiog4Lic4Li54LmJ4LmD4LiK4LmJ4LiB4LiU4LiX4Li14LmI4LiV4Lix4Lin4Lia4Lit4LiB4Liq4LiW4Liy4LiZ4Liw4LiV4Lit4LiZ4Lih4Li14Lib4Lix4LiN4Lir4LiyIOKAlCDguKXguK3guIfguYPguKvguKHguYjguJfguLHguJng',
  'uJfguLUgKi8KZnVuY3Rpb24gcmV0cnlTeW5jKCl7CiAgU1lOQy5zdGF0ZSA9ICdzeW5jaW5nJzsKICBzeW5jUGFpbnQoKTsKICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7Cn0KCi8qKiDguYLguKvguKXguJTguILguYnguK3guKHguLnguKXguYPguKvguKHguYjguJXg',
  'uK3guJnguJfguLXguYjguJzguLnguYnguYPguIrguYnguJ7guKPguYnguK3guKEgKOC4geC4lOC4iOC4suC4geC4m+C5ieC4suC4oiAi4Lih4Li14LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmIIikgKi8KZnVuY3Rpb24gbG9hZFBlbmRpbmcoKXsKICBTWU5D',
  'LnN0YXRlID0gJ3N5bmNpbmcnOwogIHN5bmNQYWludCgpOwogIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKfQoKdmFyIFBPTExfU0VDT05EUyA9IDA7CnZhciBQT0xMX1RJTUVSID0gbnVsbDsKCmZ1bmN0aW9uIHN0YXJ0UG9sbGluZyhzZWNvbmRzKXsKICB2YXIgc2Vj',
  'ID0gTnVtYmVyKHNlY29uZHMgfHwgMCk7CiAgUE9MTF9TRUNPTkRTID0gc2VjOwogIGNsZWFySW50ZXJ2YWwoUE9MTF9USU1FUik7CgogIGlmICghc2VjKSB7IHN5bmNTZXQoJ3BhdXNlZCcpOyByZXR1cm47IH0gICAvLyDguJvguLTguJTguIHguLLguKPguJXguKPg',
  'uKfguIjguK3guLHguJXguYLguJnguKHguLHguJXguLQg4oCUIOC4geC4lOC4l+C4teC5iOC4m+C5ieC4suC4ouC5gOC4nuC4t+C5iOC4reC4i+C4tOC4h+C4geC5jOC5gOC4reC4h+C5hOC4lOC5iQogIHN5bmNTZXQoJ3N5bmNlZCcpOwoKICBQT0xMX1RJTUVSID0g',
  'c2V0SW50ZXJ2YWwoZnVuY3Rpb24oKXsKICAgIGlmIChkb2N1bWVudC5oaWRkZW4pIHJldHVybjsKICAgIGNhbGxBcGkoJ2FwcC52ZXJzaW9uJykudGhlbihmdW5jdGlvbih2KXsKICAgICAgaWYgKFNZTkMuc3RhdGUgPT09ICdvZmZsaW5lJykgc3luY1NldCgnc3lu',
  'Y2VkJyk7ICAgLy8g4LiB4Lil4Lix4Lia4Lih4Liy4LiV4LmI4Lit4LmE4LiU4LmJ4LmB4Lil4LmJ4LinCiAgICAgIGlmICghdiB8fCAhdi52ZXJzaW9uIHx8IHYudmVyc2lvbiA9PT0gUy52ZXJzaW9uKSByZXR1cm47CiAgICAgIFMudmVyc2lvbiA9IHYudmVyc2lv',
  'bjsKCiAgICAgIC8vIOC5gOC4o+C4suC5gOC4m+C5h+C4meC4hOC4meC5geC4geC5ieC5gOC4reC4hyDguYHguKXguLDguKvguJnguYnguLLguIHguYfguIvguLTguIfguIHguYzguYTguJvguYHguKXguYnguKfguJXguK3guJnguIHguJTguJrguLHguJnguJfguLbg',
  'uIEKICAgICAgaWYgKERhdGUubm93KCkgPCBTLnNlbGZDaGFuZ2VVbnRpbCkgcmV0dXJuOwoKICAgICAgLy8g4LiB4Liz4Lil4Lix4LiH4LiB4Lij4Lit4LiB4LiC4LmJ4Lit4Lih4Li54Lil4Lit4Lii4Li54LmIIOKAlCDguKvguYnguLLguKHguYLguKvguKXguJTg',
  'uJfguLHguJog4Lij4Lit4LmD4Lir4LmJ4Lic4Li54LmJ4LmD4LiK4LmJ4LiB4LiU4LmA4Lit4LiHCiAgICAgIGlmICh1c2VySXNCdXN5KCkpIHsgc3luY1NldCgncGVuZGluZycpOyByZXR1cm47IH0KCiAgICAgIC8vIOC4i+C4tOC4h+C4geC5jOC5gOC4h+C4teC4',
  'ouC4miDguYYg4LmE4Lih4LmI4Lil4LmJ4Liy4LiH4Lir4LiZ4LmJ4LiyIOC5hOC4oeC5iOC5gOC4lOC5ieC4h+C4geC4peC4seC4muC5hOC4m+C4muC4meC4quC4uOC4lAogICAgICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAgICAgIHJlZnJlc2hBbGVydHMoKTsK',
  'ICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICBzeW5jU2V0KGlzT2ZmbGluZUVycm9yKGUpID8gJ29mZmxpbmUnIDogJ2Vycm9yJywgKGUgJiYgZS5tZXNzYWdlKSB8fCBTdHJpbmcoZSkpOwogICAgfSk7CiAgfSwgc2VjICogMTAwMCk7Cn0KCi8qIC0tLS0t',
  'LS0tLS0tLS0tLS0g4Lio4Li54LiZ4Lii4LmM4LmB4LiI4LmJ4LiH4LmA4LiV4Li34Lit4LiZIC0tLS0tLS0tLS0tLS0tLS0KCiAgIOC4leC4seC4p+C5gOC4peC4guC4muC4meC5gOC4oeC4meC4uSAo4LmA4LiK4LmI4LiZIDYg4Lir4Lil4Lix4LiHICLguKXguYng',
  'uLLguIfguYHguK3guKPguYwiKSDguIHguLHguJrguIHguKXguYjguK3guIfguYHguIjguYnguIfguYDguJXguLfguK3guJnguJrguJnguYHguJbguJrguKvguLHguKcKICAg4LmD4LiK4LmJ4LiC4LmJ4Lit4Lih4Li54Lil4LiK4Li44LiU4LmA4LiU4Li14Lii4Lin',
  '4LiB4Lix4LiZ4LiI4Liy4LiB4LiE4Liz4Liq4Lix4LmI4LiHIGFwcC5hbGVydHMg4LiL4Li24LmI4LiH4LmA4Lia4Liy4LiB4Lin4LmI4Liy4LmB4LiU4LiK4Lia4Lit4Lij4LmM4LiU4Lih4Liy4LiBCgogICDguK3guLHguJvguYDguJTguJXguYDguKHguLfguYjg',
  'uK06IOC5gOC4m+C4tOC4lOC4o+C4sOC4muC4miDCtyDguKvguKXguLHguIfguIHguJTguJrguLHguJnguJfguLbguIEv4Lil4Lia4LiX4Li44LiB4LiE4Lij4Lix4LmJ4LiHIMK3IOC4l+C4uOC4geC4o+C4reC4muC4leC4o+C4p+C4iOC4guC5ieC4reC4oeC4ueC4',
  'pQogICDguYDguJTguLTguKHguJXguLHguKfguYDguKXguILguJnguLXguYnguK3guLHguJvguYDguJTguJXguJXguK3guJnguYDguJvguLTguJTguKvguJnguYnguLLguYHguJTguIrguJrguK3guKPguYzguJTguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcK',
  'ICAg4LmE4Lib4Lit4Lii4Li54LmI4Lir4LiZ4LmJ4Liy4Lit4Li34LmI4LiZ4LmB4Lil4LmJ4Lin4LiV4Lix4Lin4LmA4Lil4LiC4LiI4Li24LiH4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmI4LiX4Li14LmI4LiE4LmI4Liy4LmA4LiB4LmI4LiyCi0tLS0tLS0tLS0t',
  'LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqLwoKdmFyIEFMRVJUUyA9IHsgY291bnRzOiB7fSwgaXRlbXM6IFtdLCB0b3RhbDogMCwgdXJnZW50OiAwLCBhdDogJycgfTsKCmZ1bmN0aW9uIHJlZnJlc2hBbGVy',
  'dHMoKXsKICByZXR1cm4gY2FsbEFwaSgnYXBwLmFsZXJ0cycpLnRoZW4oZnVuY3Rpb24oYSl7CiAgICBBTEVSVFMgPSBhIHx8IEFMRVJUUzsKICAgIHBhaW50QmFkZ2VzKCk7CiAgICBwYWludEJlbGwoKTsKICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgn',
  'bm90aWZQYW5lbCcpKSByZW5kZXJOb3RpZlBhbmVsKCk7ICAgLy8g4LmA4Lib4Li04LiU4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmIIOC5g+C4q+C5ieC4reC4seC4m+C5gOC4lOC4leC4leC4suC4oQogICAgcmV0dXJuIGE7CiAgfSkuY2F0Y2goZnVuY3Rpb24oKXsg',
  'Lyog4LmA4LiZ4LmH4LiV4Liq4Liw4LiU4Li44LiUIOC5hOC4p+C5ieC4o+C4reC4muC4q+C4meC5ieC4siAqLyB9KTsKfQoKLyoqIOC4leC4seC4p+C5gOC4peC4guC4muC4meC5gOC4oeC4meC4ueC4i+C5ieC4suC4oiDigJQg4Lia4Lit4LiB4LiI4Liz4LiZ4Lin',
  '4LiZ4LiH4Liy4LiZ4LiX4Li14LmI4Lii4Lix4LiH4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmI4LiC4Lit4LiH4LmB4LiV4LmI4Lil4Liw4LmC4Lih4LiU4Li54LilICovCmZ1bmN0aW9uIHBhaW50QmFkZ2VzKCl7CiAgdmFyIGMgPSBBTEVSVFMuY291bnRzIHx8IHt9',
  'OwogIFBBR0VTLmZvckVhY2goZnVuY3Rpb24ocCl7IHNldEJhZGdlKHAuaWQsIGNbcC5pZF0gfHwgMCk7IH0pOwp9CgpmdW5jdGlvbiBzZXRCYWRnZShwYWdlLCBuKXsKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmFkZ2UtJyArIHBhZ2UpOwog',
  'IGlmICghZWwpIHJldHVybjsKICBpZiAobiA+IDApIHsKICAgIGVsLnRleHRDb250ZW50ID0gbiA+IDk5ID8gJzk5KycgOiBuOwogICAgZWwuc3R5bGUuZGlzcGxheSA9ICcnOwogICAgZWwudGl0bGUgPSAn4Lii4Lix4LiH4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmI',
  'ICcgKyBuICsgJyDguKPguLLguKLguIHguLLguKMnOwogIH0gZWxzZSB7CiAgICBlbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOwogIH0KfQoKLyogLS0tLSDguIHguKPguLDguJTguLTguYjguIfguJrguJnguYHguJbguJrguKvguLHguKcgLS0tLSAqLwoKZnVuY3Rp',
  'b24gcGFpbnRCZWxsKCl7CiAgdmFyIHdyYXAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmVsbFdyYXAnKTsKICBpZiAoIXdyYXApIHJldHVybjsKCiAgLy8g4Lin4Liy4LiU4LmA4LiJ4Lie4Liy4Liw4LiV4Lix4Lin4Lib4Li44LmI4LihIOC4q+C5ieC4suC4',
  'oeC5gOC4guC4teC4ouC4meC4l+C4seC4muC4l+C4seC5ieC4hyBiZWxsV3JhcAogIC8vIOC5gOC4nuC4o+C4suC4sOC4geC4peC5iOC4reC4h+C5geC4iOC5ieC4h+C5gOC4leC4t+C4reC4meC4l+C4teC5iOC5gOC4m+C4tOC4lOC4hOC5ieC4suC4h+C4reC4ouC4',
  'ueC5iOC4geC5h+C5gOC4m+C5h+C4meC4peC4ueC4geC4guC4reC4hyBiZWxsV3JhcCDguYDguKvguKHguLfguK3guJnguIHguLHguJkKICB2YXIgc2xvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiZWxsU2xvdCcpOwogIGlmICghc2xvdCkgewogICAgc2xv',
  'dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTsKICAgIHNsb3QuaWQgPSAnYmVsbFNsb3QnOwogICAgd3JhcC5pbnNlcnRCZWZvcmUoc2xvdCwgd3JhcC5maXJzdENoaWxkKTsKICB9CgogIHZhciBuID0gQUxFUlRTLnRvdGFsIHx8IDA7CiAgdmFyIHVy',
  'Z2VudCA9IEFMRVJUUy51cmdlbnQgfHwgMDsKICBzbG90LmlubmVySFRNTCA9CiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIGljb24gYmVsbCIgaWQ9ImJlbGxCdG4iIG9uY2xpY2s9InRvZ2dsZU5vdGlmKCkiICcgKwogICAgICAndGl0bGU9IicgKyAobiA/ICfguKHg',
  'uLUgJyArIG4gKyAnIOC5gOC4o+C4t+C5iOC4reC4h+C4l+C4teC5iOC4leC5ieC4reC4h+C4lOC4uScgOiAn4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ4LiE4LmJ4Liy4LiHJykgKyAnIiAnICsKICAgICAgJ2FyaWEtbGFiZWw9IuC4geC4suC4o+C5geC4iOC5ieC4',
  'h+C5gOC4leC4t+C4reC4mSI+8J+UlCcgKwogICAgICAobiA/ICc8c3BhbiBjbGFzcz0iYmVsbC1kb3QnICsgKHVyZ2VudCA/ICcgdXJnZW50JyA6ICcnKSArICciPicgKyAobiA+IDk5ID8gJzk5KycgOiBuKSArICc8L3NwYW4+JyA6ICcnKSArCiAgICAnPC9idXR0',
  'b24+JzsKfQoKZnVuY3Rpb24gdG9nZ2xlTm90aWYoKXsKICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25vdGlmUGFuZWwnKSkgcmV0dXJuIGNsb3NlTm90aWYoKTsKICB2YXIgd3JhcCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiZWxsV3JhcCcpOwog',
  'IGlmICghd3JhcCkgcmV0dXJuOwogIHZhciBwYW5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogIHBhbmVsLmlkID0gJ25vdGlmUGFuZWwnOwogIHBhbmVsLmNsYXNzTmFtZSA9ICdub3RpZic7CiAgd3JhcC5hcHBlbmRDaGlsZChwYW5lbCk7CiAg',
  'cmVuZGVyTm90aWZQYW5lbCgpOwogIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBub3RpZk91dHNpZGUsIHRydWUpOyB9LCAwKTsKICByZWZyZXNoQWxlcnRzKCk7ICAgICAgICAgICAgICAgICAgICAgIC8v',
  'IOC5gOC4m+C4tOC4lOC4l+C4teC5hOC4o+C4geC5h+C4lOC4tuC4h+C4guC4reC4h+C4peC5iOC4suC4quC4uOC4lOC4oeC4suC5g+C4q+C5ieC4lOC5ieC4p+C4ogp9CgpmdW5jdGlvbiBjbG9zZU5vdGlmKCl7CiAgdmFyIHAgPSBkb2N1bWVudC5nZXRFbGVtZW50',
  'QnlJZCgnbm90aWZQYW5lbCcpOwogIGlmIChwKSBwLnJlbW92ZSgpOwogIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgbm90aWZPdXRzaWRlLCB0cnVlKTsKfQoKZnVuY3Rpb24gbm90aWZPdXRzaWRlKGUpewogIHZhciB3cmFwID0gZG9jdW1l',
  'bnQuZ2V0RWxlbWVudEJ5SWQoJ2JlbGxXcmFwJyk7CiAgaWYgKHdyYXAgJiYgIXdyYXAuY29udGFpbnMoZS50YXJnZXQpKSBjbG9zZU5vdGlmKCk7Cn0KCnZhciBOT1RJRl9HUk9VUFMgPSBbCiAgeyBtb2R1bGU6J3JlcGFpcnMnLCAgIGljOifwn5SnJywgbGFiZWw6',
  'J+C4h+C4suC4meC4i+C5iOC4reC4oeC4hOC5ieC4suC4hycgfSwKICB7IG1vZHVsZTonYWMnLCAgICAgICAgaWM6J+KdhO+4jycsIGxhYmVsOifguKXguYnguLLguIfguYHguK3guKPguYzguJbguLbguIfguIHguLPguKvguJnguJQnIH0sCiAgeyBtb2R1bGU6J2J1',
  'aWxkaW5nJywgIGljOifwn4+iJywgbGFiZWw6J+C4h+C4suC4meC4leC4tuC4geC4quC5iOC4p+C4meC4geC4peC4suC4hycgfSwKICB7IG1vZHVsZToncHVyY2hhc2VzJywgaWM6J/Cfm6HvuI8nLCBsYWJlbDon4Lib4Lij4Liw4LiB4Lix4LiZ4LmD4LiB4Lil4LmJ',
  '4Lir4Lih4LiUJyB9LAogIHsgbW9kdWxlOidmaW5hbmNlJywgICBpYzon8J+nvicsIGxhYmVsOifguJrguLTguKXguKPguLLguKLguYDguJTguLfguK3guJknIH0KXTsKCmZ1bmN0aW9uIHJlbmRlck5vdGlmUGFuZWwoKXsKICB2YXIgcGFuZWwgPSBkb2N1bWVudC5n',
  'ZXRFbGVtZW50QnlJZCgnbm90aWZQYW5lbCcpOwogIGlmICghcGFuZWwpIHJldHVybjsKICB2YXIgaXRlbXMgPSBBTEVSVFMuaXRlbXMgfHwgW107CgogIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9Im5vdGlmLWgiPjxiPuC4geC4suC4o+C5geC4iOC5ieC4h+C5gOC4',
  'leC4t+C4reC4mTwvYj4nICsKICAgICc8c3BhbiBjbGFzcz0ic3AiPicgKwogICAgICAoaXRlbXMubGVuZ3RoID8gJzxzcGFuIGNsYXNzPSJiICcgKyAoQUxFUlRTLnVyZ2VudCA/ICdkZ3InIDogJ3dhcm4nKSArICciPicgKyBpdGVtcy5sZW5ndGggKyAnIOC5gOC4',
  'o+C4t+C5iOC4reC4hzwvc3Bhbj4nIDogJycpICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIiB0aXRsZT0i4LiU4Li24LiH4LiC4LmJ4Lit4Lih4Li54Lil4Lil4LmI4Liy4Liq4Li44LiUIiBvbmNsaWNrPSJyZWZyZXNoQWxlcnRzKCkiPuKGuzwv',
  'YnV0dG9uPicgKwogICAgJzwvc3Bhbj48L2Rpdj4nOwoKICBpZiAoIWl0ZW1zLmxlbmd0aCkgewogICAgcGFuZWwuaW5uZXJIVE1MID0gaGVhZCArCiAgICAgICc8ZGl2IGNsYXNzPSJub3RpZi1lbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj7inIU8L2Rpdj7guYTguKHg',
  'uYjguKHguLXguIfguLLguJnguITguYnguLLguIc8YnI+JyArCiAgICAgICc8c3BhbiBjbGFzcz0iZnMxMiBmYWludCI+4LiX4Li44LiB4Lit4Lii4LmI4Liy4LiH4LmA4Lij4Li14Lii4Lia4Lij4LmJ4Lit4Lii4LiU4Li1PC9zcGFuPjwvZGl2Pic7CiAgICByZXR1',
  'cm47CiAgfQoKICAvLyDguIjguLHguJTguIHguKXguLjguYjguKHguJXguLLguKHguYLguKHguJTguLnguKUg4LmA4Lij4Li14Lii4LiH4LiV4Liy4Lih4Lil4Liz4LiU4Lix4Lia4LiX4Li14LmI4Lic4Li54LmJ4LmD4LiK4LmJ4Liq4LiZ4LmD4LiI4LiB4LmI4Lit',
  '4LiZCiAgdmFyIGJvZHkgPSAnJzsKICBOT1RJRl9HUk9VUFMuZm9yRWFjaChmdW5jdGlvbihnKXsKICAgIHZhciBsaXN0ID0gaXRlbXMuZmlsdGVyKGZ1bmN0aW9uKGEpeyByZXR1cm4gYS5tb2R1bGUgPT09IGcubW9kdWxlOyB9KTsKICAgIGlmICghbGlzdC5sZW5n',
  'dGgpIHJldHVybjsKICAgIGJvZHkgKz0gJzxkaXYgY2xhc3M9Im5vdGlmLXNlYyI+JyArIGcuaWMgKyAnICcgKyBlc2MoZy5sYWJlbCkgKyAnICgnICsgbGlzdC5sZW5ndGggKyAnKTwvZGl2Pic7CiAgICBsaXN0LnNsaWNlKDAsIDgpLmZvckVhY2goZnVuY3Rpb24o',
  'YSl7CiAgICAgIGJvZHkgKz0gJzxidXR0b24gY2xhc3M9Im5vdGlmLWl0ZW0gbC0nICsgZXNjKGEubGV2ZWwpICsgJyIgb25jbGljaz0iZ290b0FsZXJ0KFwnJyArIGVzYyhhLm1vZHVsZSkgKyAnXCcpIj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0idHQiPicgKyBl',
  'c2MoYS50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgKGEuZGV0YWlsID8gJzxkaXYgY2xhc3M9ImRkIj4nICsgZXNjKGEuZGV0YWlsKSArICc8L2Rpdj4nIDogJycpICsKICAgICAgJzwvYnV0dG9uPic7CiAgICB9KTsKICAgIGlmIChsaXN0Lmxlbmd0aCA+IDgp',
  'IHsKICAgICAgYm9keSArPSAnPGJ1dHRvbiBjbGFzcz0ibm90aWYtbW9yZSIgb25jbGljaz0iZ290b0FsZXJ0KFwnJyArIGVzYyhnLm1vZHVsZSkgKyAnXCcpIj4nICsKICAgICAgICAn4LiU4Li54Lit4Li14LiBICcgKyAobGlzdC5sZW5ndGggLSA4KSArICcg4Lij',
  '4Liy4Lii4LiB4Liy4LijIOKGkjwvYnV0dG9uPic7CiAgICB9CiAgfSk7CgogIHBhbmVsLmlubmVySFRNTCA9IGhlYWQgKyAnPGRpdiBjbGFzcz0ibm90aWYtbGlzdCI+JyArIGJvZHkgKyAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0ibm90aWYtZiI+4Lit4Lix',
  '4Lib4LmA4LiU4LiV4LmA4Lih4Li34LmI4LitICcgKyBlc2MoU3RyaW5nKEFMRVJUUy5hdCB8fCAnJykuc2xpY2UoMTEsIDE2KSB8fCAn4oCTJykgKyAnIOC4mS4gwrcgJyArCiAgICAnPGEgaHJlZj0iamF2YXNjcmlwdDp2b2lkKDApIiBvbmNsaWNrPSJjbG9zZU5v',
  'dGlmKCk7Z28oXCdkYXNoYm9hcmRcJykiPuC4lOC4ueC4l+C4seC5ieC4h+C4q+C4oeC4lOC5g+C4meC5geC4lOC4iuC4muC4reC4o+C5jOC4lCDihpI8L2E+PC9kaXY+JzsKfQoKZnVuY3Rpb24gZ290b0FsZXJ0KG1vZHVsZSl7CiAgY2xvc2VOb3RpZigpOwogIGdv',
  'KG1vZHVsZSA9PT0gJ2RlYnQnID8gJ2RlYnRNYWluJyA6IG1vZHVsZSk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0gZm9ybWF0IGhlbHBlcnMgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gZXNjKHMpewogIHJldHVybiBTdHJpbmcocz09bnVsbD8nJzpzKQog',
  'ICAgLnJlcGxhY2UoLyYvZywnJmFtcDsnKS5yZXBsYWNlKC88L2csJyZsdDsnKS5yZXBsYWNlKC8+L2csJyZndDsnKQogICAgLnJlcGxhY2UoLyIvZywnJnF1b3Q7JykucmVwbGFjZSgvJy9nLCcmIzM5OycpOwp9CmZ1bmN0aW9uIG1vbmV5KG4sIGRlYyl7CiAgdmFy',
  'IHYgPSBOdW1iZXIobnx8MCk7CiAgcmV0dXJuIHYudG9Mb2NhbGVTdHJpbmcoJ3RoLVRIJyx7bWluaW11bUZyYWN0aW9uRGlnaXRzOmRlY3x8MCwgbWF4aW11bUZyYWN0aW9uRGlnaXRzOmRlY3x8MH0pOwp9CmZ1bmN0aW9uIGJhaHQobil7IHJldHVybiBtb25leShu',
  'KSArICcg4Li/JzsgfQpmdW5jdGlvbiBwY3Qobil7IHJldHVybiAoTnVtYmVyKG4pfHwwKS50b0ZpeGVkKDEpICsgJyUnOyB9CmZ1bmN0aW9uIG51bShuKXsgcmV0dXJuIG49PW51bGx8fG49PT0nJyA/ICfigJMnIDogbW9uZXkobik7IH0KCi8qKiAyMDI2LTA0LTI2',
  'IC0+IDI2IOC5gOC4oS7guKIuIDI1NjkgKi8KdmFyIFRIX01PTiA9IFsn4LihLuC4hC4nLCfguIEu4LieLicsJ+C4oeC4tS7guIQuJywn4LmA4LihLuC4oi4nLCfguJ4u4LiELicsJ+C4oeC4tC7guKIuJywn4LiBLuC4hC4nLCfguKou4LiELicsJ+C4gS7guKIuJywn',
  '4LiVLuC4hC4nLCfguJ4u4LiiLicsJ+C4mC7guIQuJ107CmZ1bmN0aW9uIHRoRGF0ZShpc28pewogIGlmICghaXNvKSByZXR1cm4gJ+KAkyc7CiAgdmFyIG0gPSBTdHJpbmcoaXNvKS5tYXRjaCgvXihcZHs0fSktKFxkezJ9KS0oXGR7Mn0pLyk7CiAgaWYgKCFtKSBy',
  'ZXR1cm4gZXNjKGlzbyk7CiAgcmV0dXJuIE51bWJlcihtWzNdKSArICcgJyArIFRIX01PTltOdW1iZXIobVsyXSktMV0gKyAnICcgKyAoTnVtYmVyKG1bMV0pKzU0Myk7Cn0KZnVuY3Rpb24gdGhEYXRlU2hvcnQoaXNvKXsKICBpZiAoIWlzbykgcmV0dXJuICfigJMn',
  'OwogIHZhciBtID0gU3RyaW5nKGlzbykubWF0Y2goL14oXGR7NH0pLShcZHsyfSktKFxkezJ9KS8pOwogIGlmICghbSkgcmV0dXJuIGVzYyhpc28pOwogIHJldHVybiBOdW1iZXIobVszXSkgKyAnLycgKyBOdW1iZXIobVsyXSkgKyAnLycgKyBTdHJpbmcoTnVtYmVy',
  'KG1bMV0pKzU0Mykuc2xpY2UoMik7Cn0KZnVuY3Rpb24gZGF5c0Fnbyhpc28pewogIGlmICghaXNvKSByZXR1cm4gbnVsbDsKICByZXR1cm4gTWF0aC5yb3VuZCgoRGF0ZS5ub3coKSAtIG5ldyBEYXRlKGlzbykuZ2V0VGltZSgpKS84NjQwMDAwMCk7Cn0KCmZ1bmN0',
  'aW9uIHN0YXR1c0JhZGdlKHN0KXsKICB2YXIgbWFwID0gewogICAgJ+C5gOC4quC4o+C5h+C4iOC4quC4tOC5ieC4mSc6J29rJywn4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4Lij4LmB4Lil4LmJ4LinJzonb2snLCfguYPguIrguYnguIfguLLguJnguJvguIHguJXg',
  'uLQnOidvaycsJ+C4m+C4tOC4lOC4q+C4meC4teC5ieC5geC4peC5ieC4pyc6J29rJywn4Lit4Lii4Li54LmI4LmD4LiZ4Lib4Lij4Liw4LiB4Lix4LiZJzonb2snLCfguKHguLXguJzguLnguYnguYDguIrguYjguLInOidvaycsJ+C4m+C4geC4leC4tCc6J29rJywK',
  'ICAgICfguIHguLPguKXguLHguIfguIvguYjguK3guKEnOidpbmZvJywn4LiB4Liz4Lil4Lix4LiH4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4LijJzonaW5mbycsJ+C4meC4seC4lOC4q+C4oeC4suC4ouC5geC4peC5ieC4pyc6J2luZm8nLCfguIHguLPguKXguLHg',
  'uIfguJzguYjguK3guJknOidpbmZvJywn4Lin4LmI4Liy4LiHJzonaW5mbycsCiAgICAn4Lij4Lit4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4LijJzond2FybicsJ+C5gOC4peC4t+C5iOC4reC4meC4meC4seC4lCc6J3dhcm4nLCfguYPguIHguKXguYnguKvguKHg',
  'uJTguJvguKPguLDguIHguLHguJknOid3YXJuJywn4LiV4LmJ4Lit4LiH4LiL4LmI4Lit4LihJzond2FybicsJ+C4nuC4seC4geC4iuC4s+C4o+C4sCc6J3dhcm4nLCfguJvguLTguJTguJvguKPguLHguJrguJvguKPguLjguIcnOid3YXJuJywn4LmA4LiB4Li04LiZ',
  '4LiB4Liz4Lir4LiZ4LiUJzond2FybicsJ+C4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4peC5ieC4suC4hyc6J3dhcm4nLAogICAgJ+C4ouC4geC5gOC4peC4tOC4gSc6J211dGUnLCfguJvguKXguJTguKPguLDguKfguLLguIcnOidtdXRlJywn4LmE4Lih4LmI',
  '4Lij4Liw4Lia4Li4JzonbXV0ZScsCiAgICAn4Lir4Lih4LiU4Lit4Liy4Lii4Li44LmB4Lil4LmJ4LinJzonZGdyJywn4LiU4LmI4Lin4LiZ4Lih4Liy4LiBJzonZGdyJywn4LiU4LmI4Lin4LiZJzond2FybicKICB9OwogIGlmICghc3QpIHJldHVybiAnJzsKICBy',
  'ZXR1cm4gJzxzcGFuIGNsYXNzPSJiICcgKyAobWFwW3N0XXx8J211dGUnKSArICciPicgKyBlc2Moc3QpICsgJzwvc3Bhbj4nOwp9CgpmdW5jdGlvbiBwcm9ncmVzcyhwZXJjZW50LCBjbHMpewogIHZhciBwID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMTAwLCBOdW1i',
  'ZXIocGVyY2VudCl8fDApKTsKICByZXR1cm4gJzxkaXYgY2xhc3M9InBiYXIgJyArIChjbHN8fCcnKSArICciPjxpIHN0eWxlPSJ3aWR0aDonICsgcCArICclIj48L2k+PC9kaXY+JzsKfQoKZnVuY3Rpb24gdGh1bWJzSHRtbChyZWZzLCBiaWcpewogIGlmICghcmVm',
  'cyB8fCAhcmVmcy5sZW5ndGgpIHJldHVybiAnPHNwYW4gY2xhc3M9ImZhaW50IGZzMTIiPuKAkzwvc3Bhbj4nOwogIHJldHVybiAnPGRpdiBjbGFzcz0idGh1bWJzIj4nICsgcmVmcy5tYXAoZnVuY3Rpb24ocil7CiAgICBpZiAoci50aHVtYikgewogICAgICByZXR1',
  'cm4gJzxpbWcgY2xhc3M9InRodW1iJyArIChiaWc/JyBiaWcnOicnKSArICciIGxvYWRpbmc9ImxhenkiIHNyYz0iJyArIGVzYyhyLnRodW1iKSArICciICcgKwogICAgICAgICAgICAgJ29uY2xpY2s9IndpbmRvdy5vcGVuKFwnJyArIGVzYyhyLnVybCkgKyAnXCcs',
  'XCdfYmxhbmtcJykiICcgKwogICAgICAgICAgICAgJ29uZXJyb3I9InRoaXMub25lcnJvcj1udWxsO3RoaXMucmVwbGFjZVdpdGgoZmlsZUNoaXAoJyArIEpTT04uc3RyaW5naWZ5KEpTT04uc3RyaW5naWZ5KHIpKS5yZXBsYWNlKC8iL2csJyZxdW90OycpICsgJykp',
  'Ij4nOwogICAgfQogICAgcmV0dXJuICc8YSBjbGFzcz0iYiBpbmZvIiBocmVmPSInICsgZXNjKHIudXJsKSArICciIHRhcmdldD0iX2JsYW5rIj7guYTguJ/guKXguYw8L2E+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwp9CmZ1bmN0aW9uIGZpbGVDaGlwKGpz',
  'b24pewogIHZhciByID0gdHlwZW9mIGpzb24gPT09ICdzdHJpbmcnID8gSlNPTi5wYXJzZShqc29uKSA6IGpzb247CiAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7CiAgYS5jbGFzc05hbWUgPSAnYiBpbmZvJzsgYS5ocmVmID0gci51cmw7IGEu',
  'dGFyZ2V0ID0gJ19ibGFuayc7IGEudGV4dENvbnRlbnQgPSAn8J+TjiDguYTguJ/guKXguYwnOwogIHJldHVybiBhOwp9CgpmdW5jdGlvbiBlbXB0eUJveCh0ZXh0LCBhY3Rpb24pewogIHJldHVybiAnPGRpdiBjbGFzcz0iZW1wdHkiPjxkaXYgY2xhc3M9ImJpZyI+',
  '8J+Xgu+4jzwvZGl2PicgKyBlc2ModGV4dCkgKwogICAgICAgICAoYWN0aW9uID8gJzxkaXYgY2xhc3M9Im10MTIiPicgKyBhY3Rpb24gKyAnPC9kaXY+JyA6ICcnKSArICc8L2Rpdj4nOwp9CgpmdW5jdGlvbiBiYXJDaGFydChpdGVtcywgbGFiZWxLZXksIHZhbHVl',
  'S2V5LCBmb3JtYXR0ZXIpewogIGlmICghaXRlbXMgfHwgIWl0ZW1zLmxlbmd0aCkgcmV0dXJuICc8ZGl2IGNsYXNzPSJlbXB0eSI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14LiC4LmJ4Lit4Lih4Li54LilPC9kaXY+JzsKICB2YXIgbWF4ID0gTWF0aC5tYXguYXBw',
  'bHkobnVsbCwgaXRlbXMubWFwKGZ1bmN0aW9uKGkpeyByZXR1cm4gTnVtYmVyKGlbdmFsdWVLZXldKXx8MDsgfSkpIHx8IDE7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJiYXJzIj4nICsgaXRlbXMubWFwKGZ1bmN0aW9uKGkpewogICAgdmFyIHYgPSBOdW1iZXIoaVt2',
  'YWx1ZUtleV0pfHwwOwogICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJiYXItcm93Ij4nICsKICAgICAgJzxkaXYgY2xhc3M9ImNsaXAiIHRpdGxlPSInICsgZXNjKGlbbGFiZWxLZXldKSArICciPicgKyBlc2MoaVtsYWJlbEtleV0pICsgJzwvZGl2PicgKwogICAgICAn',
  'PGRpdiBjbGFzcz0iYmFyLXRyYWNrIj48ZGl2IGNsYXNzPSJiYXItZmlsbCIgc3R5bGU9IndpZHRoOicgKyAodi9tYXgqMTAwKSArICclIj48L2Rpdj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9InYiPicgKyAoZm9ybWF0dGVyID8gZm9ybWF0dGVyKGkpIDog',
  'bW9uZXkodikpICsgJzwvZGl2PicgKwogICAgJzwvZGl2Pic7CiAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSBtb2RhbCAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiBvcGVuTW9kYWwodGl0bGUsIGJvZHlIdG1sLCBm',
  'b290SHRtbCwgd2lkZSl7CiAgdmFyIHJvb3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9kYWxSb290Jyk7CiAgcm9vdC5pbm5lckhUTUwgPQogICAgJzxkaXYgY2xhc3M9Im92IiBvbmNsaWNrPSJpZihldmVudC50YXJnZXQ9PT10aGlzKWNsb3NlTW9kYWwo',
  'KSI+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJtb2RhbCcgKyAod2lkZT8nIHdpZGUnOicnKSArICciPicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJtb2RhbC1oIj48aDM+JyArIGVzYyh0aXRsZSkgKyAnPC9oMz48YnV0dG9uIGNsYXNzPSJ4IiBvbmNsaWNrPSJjbG9z',
  'ZU1vZGFsKCkiPsOXPC9idXR0b24+PC9kaXY+JyArCiAgICAgICAgJzxkaXYgY2xhc3M9Im1vZGFsLWIiPicgKyBib2R5SHRtbCArICc8L2Rpdj4nICsKICAgICAgICAoZm9vdEh0bWwgPyAnPGRpdiBjbGFzcz0ibW9kYWwtZiI+JyArIGZvb3RIdG1sICsgJzwvZGl2',
  'PicgOiAnJykgKwogICAgICAnPC9kaXY+JyArCiAgICAnPC9kaXY+JzsKICBhcHBseVJlYWRPbmx5KHJvb3QpOwogIGRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJzsKfQpmdW5jdGlvbiBjbG9zZU1vZGFsKCl7CiAgZG9jdW1lbnQuZ2V0RWxl',
  'bWVudEJ5SWQoJ21vZGFsUm9vdCcpLmlubmVySFRNTCA9ICcnOwogIGRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnJzsKfQpkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZSl7IGlmIChlLmtleSA9PT0gJ0VzY2FwZScp',
  'IGNsb3NlTW9kYWwoKTsgfSk7CgpmdW5jdGlvbiBjb25maXJtQWN0aW9uKHRleHQsIG9uWWVzKXsKICBvcGVuTW9kYWwoJ+C4ouC4t+C4meC4ouC4seC4mScsCiAgICAnPHA+JyArIGVzYyh0ZXh0KSArICc8L3A+JywKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9u',
  'Y2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lii4LiB4LmA4Lil4Li04LiBPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIGRnciIgaWQ9ImNmbUJ0biI+4Lii4Li34LiZ4Lii4Lix4LiZPC9idXR0b24+Jyk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQo',
  'J2NmbUJ0bicpLm9uY2xpY2sgPSBmdW5jdGlvbigpeyBjbG9zZU1vZGFsKCk7IG9uWWVzKCk7IH07Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0gdG9hc3QgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gdG9hc3QobXNnLCBraW5kKXsKICB2YXIgZWwgPSBkb2N1',
  'bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICBlbC5jbGFzc05hbWUgPSAndG9hc3QgJyArIChraW5kfHwnJyk7CiAgZWwudGV4dENvbnRlbnQgPSBtc2c7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvYXN0Um9vdCcpLmFwcGVuZENoaWxkKGVsKTsKICBz',
  'ZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IGVsLnJlbW92ZSgpOyB9LCBraW5kPT09J2VycicgPyA1MjAwIDogMjgwMCk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0gbmF2IChtb2JpbGUpIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIHRvZ2dsZU5hdigpewogIHZh',
  'ciBuYXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2Jyk7CiAgbmF2LmNsYXNzTGlzdC50b2dnbGUoJ29wZW4nKTsKICBpZiAobmF2LmNsYXNzTGlzdC5jb250YWlucygnb3BlbicpKSB7CiAgICB2YXIgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2Rp',
  'dicpOwogICAgcy5jbGFzc05hbWUgPSAnc2NyaW0nOyBzLmlkID0gJ3NjcmltJzsKICAgIHMub25jbGljayA9IGZ1bmN0aW9uKCl7IG5hdi5jbGFzc0xpc3QucmVtb3ZlKCdvcGVuJyk7IHJlbW92ZVNjcmltKCk7IH07CiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENo',
  'aWxkKHMpOwogIH0gZWxzZSByZW1vdmVTY3JpbSgpOwp9CmZ1bmN0aW9uIHJlbW92ZVNjcmltKCl7CiAgdmFyIHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2NyaW0nKTsKICBpZiAocykgcy5yZW1vdmUoKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSBzZWFy',
  'Y2ggLS0tLS0tLS0tLS0tLS0tLSAqLwoKdmFyIHNlYXJjaFRpbWVyID0gbnVsbDsKZnVuY3Rpb24gb25TZWFyY2gocSl7CiAgY2xlYXJUaW1lb3V0KHNlYXJjaFRpbWVyKTsKICBpZiAoIXEgfHwgcS50cmltKCkubGVuZ3RoIDwgMikgcmV0dXJuOwogIHNlYXJjaFRp',
  'bWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpewogICAgY2FsbEFwaSgnYXBwLnNlYXJjaCcsIHsgcTogcSB9KS50aGVuKGZ1bmN0aW9uKHJvd3MpewogICAgICBvcGVuTW9kYWwoJ+C4nOC4peC4geC4suC4o+C4hOC5ieC4meC4q+C4siAiJyArIHEgKyAnIiAoJyAr',
  'IHJvd3MubGVuZ3RoICsgJyknLAogICAgICAgIHJvd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9ImFsaXN0Ij4nICsgcm93cy5tYXAoZnVuY3Rpb24ocil7CiAgICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImFsaSIgb25jbGljaz0iY2xvc2VNb2RhbCgpO2dvKFwn',
  'JyArIGp1bXBQYWdlKHIubW9kdWxlKSArICdcJykiPicgKwogICAgICAgICAgICAnPGRpdiBjbGFzcz0iaWMiPicgKyBtb2R1bGVJY29uKHIubW9kdWxlKSArICc8L2Rpdj48ZGl2PicgKwogICAgICAgICAgICAnPGRpdiBjbGFzcz0idHQiPicgKyBlc2Moci50aXRs',
  'ZSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJkZCI+JyArIGVzYyhyLmxhYmVsKSArIChyLmRldGFpbCA/ICcgwrcgJyArIGVzYyhyLmRldGFpbCkgOiAnJykgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICc8L2Rpdj48L2Rpdj4nOwogICAg',
  'ICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicKICAgICAgICA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4LmE4Lih4LmI4Lie4Lia4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4LiV4Lij4LiH4LiB4Lix4Lia4LiE4Liz4LiE4LmJ4LiZPC9kaXY+JywgJycsIHRydWUp',
  'OwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwgJ2VycicpOyB9KTsKICB9LCA0MjApOwp9CmZ1bmN0aW9uIGp1bXBQYWdlKG1vZHVsZSl7CiAgcmV0dXJuICh7cHVyY2hhc2VzOidwdXJjaGFzZXMnLCByZXBhaXJzOidyZXBhaXJz',
  'JywgYnVpbGRpbmc6J2J1aWxkaW5nJywgYWM6J2FjJywgZGVidDonZGVidE1haW4nLCByb29tczoncm9vbXMnfSlbbW9kdWxlXSB8fCAnZGFzaGJvYXJkJzsKfQpmdW5jdGlvbiBtb2R1bGVJY29uKG1vZHVsZSl7CiAgcmV0dXJuICh7cHVyY2hhc2VzOifwn5uSJywg',
  'cmVwYWlyczon8J+UpycsIGJ1aWxkaW5nOifwn4+iJywgYWM6J+KdhO+4jycsIGRlYnQ6J/CfkrAnLCByb29tczon8J+aqid9KVttb2R1bGVdIHx8ICfwn5OEJzsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSBmaWxlIHVwbG9hZCAtLS0tLS0tLS0tLS0tLS0tICovCgov',
  'KioKICog4Lit4LmI4Liy4LiZ4LmE4Lif4Lil4LmM4LiI4Liy4LiBIDxpbnB1dCB0eXBlPWZpbGU+IOC5gOC4m+C5h+C4mSBkYXRhVVJMIOC5geC4peC5ieC4p+C4quC5iOC4h+C4guC4tuC5ieC4mSBEcml2ZQogKiDguITguLfguJkgYXJyYXkg4LiC4Lit4LiHIHtp',
  'ZCxuYW1lLHVybCx0aHVtYn0KICovCmZ1bmN0aW9uIHVwbG9hZEZpbGVzKGlucHV0RWwsIGJ1Y2tldCl7CiAgdmFyIGZpbGVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoaW5wdXRFbC5maWxlcyB8fCBbXSk7CiAgaWYgKCFmaWxlcy5sZW5ndGgpIHJldHVy',
  'biBQcm9taXNlLnJlc29sdmUoW10pOwogIHZhciBNQVggPSAxMiAqIDEwMjQgKiAxMDI0OwogIHZhciB0b29CaWcgPSBmaWxlcy5maWx0ZXIoZnVuY3Rpb24oZil7IHJldHVybiBmLnNpemUgPiBNQVg7IH0pOwogIGlmICh0b29CaWcubGVuZ3RoKSB7CiAgICByZXR1',
  'cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCfguYTguJ/guKXguYzguYPguKvguI3guYjguYDguIHguLTguJkgMTIgTUI6ICcgKyB0b29CaWcubWFwKGZ1bmN0aW9uKGYpe3JldHVybiBmLm5hbWU7fSkuam9pbignLCAnKSkpOwogIH0KICByZXR1cm4gUHJvbWlz',
  'ZS5hbGwoZmlsZXMubWFwKHJlYWRBc0RhdGFVcmwpKQogICAgLnRoZW4oZnVuY3Rpb24ocGF5bG9hZHMpeyByZXR1cm4gY2FsbEFwaSgnZmlsZS51cGxvYWQnLCB7IGJ1Y2tldDogYnVja2V0LCBmaWxlczogcGF5bG9hZHMgfSk7IH0pOwp9CgpmdW5jdGlvbiByZWFk',
  'QXNEYXRhVXJsKGZpbGUpewogIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpewogICAgdmFyIHIgPSBuZXcgRmlsZVJlYWRlcigpOwogICAgci5vbmxvYWQgPSBmdW5jdGlvbigpeyByZXNvbHZlKHsgbmFtZTogZmlsZS5uYW1lLCBt',
  'aW1lVHlwZTogZmlsZS50eXBlLCBkYXRhVXJsOiByLnJlc3VsdCB9KTsgfTsKICAgIHIub25lcnJvciA9IGZ1bmN0aW9uKCl7IHJlamVjdChuZXcgRXJyb3IoJ+C4reC5iOC4suC4meC5hOC4n+C4peC5jOC5hOC4oeC5iOC4quC4s+C5gOC4o+C5h+C4iDogJyArIGZp',
  'bGUubmFtZSkpOyB9OwogICAgci5yZWFkQXNEYXRhVVJMKGZpbGUpOwogIH0pOwp9Cjwvc2NyaXB0Pgo8c2NyaXB0PgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgQXV0aC5odG1sIOKAlCDguKvg',
  'uJnguYnguLLguKXguYfguK3guIHguK3guLTguJkgwrcgUElOIDYg4Lir4Lil4Lix4LiBIMK3IOC5gOC4m+C4peC4teC5iOC4ouC4meC4o+C4q+C4seC4quC4nOC5iOC4suC4mQoKICAg4LiX4Li14LmI4LmA4LiB4LmH4Lia4LiC4Lit4LiH4Lid4Lix4LmI4LiH4LmA',
  '4Lia4Lij4Liy4Lin4LmM4LmA4LiL4Lit4Lij4LmMIDIg4LiK4Lix4LmJ4LiZIOC5gOC4nuC4o+C4suC4sOC5gOC4p+C5h+C4muC5geC4reC4m+C4guC4reC4hyBBcHBzIFNjcmlwdAogICDguJfguLPguIfguLLguJnguYPguJkgaWZyYW1lIOC4l+C4teC5iOC4iuC4',
  't+C5iOC4reC5guC4lOC5gOC4oeC4meC5gOC4m+C4peC4teC5iOC4ouC4meC4l+C4uOC4geC4hOC4o+C4seC5ieC4h+C4l+C4teC5iOC5gOC4m+C4tOC4lAogICBsb2NhbFN0b3JhZ2Ug4LiI4Li24LiH4Lir4Liy4Lii4LmE4LiU4LmJIOC4leC5ieC4reC4h+C4oeC4',
  'teC4l+C4suC4h+C4quC4s+C4o+C4reC4hwogICAgIMK3IOC4o+C4q+C4seC4quC4reC5ieC4suC4h+C4reC4tOC4h+C4geC4suC4o+C5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4mSAo4Lit4Liy4Lii4Li44Liq4Lix4LmJ4LiZKSDigJQg4LmA4LiB4LmH4Lia',
  '4LmD4LiZIGxvY2FsU3RvcmFnZSDguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcKICAgICAgIOC4q+C4suC4ouC4geC5h+C5geC4hOC5iOC5g+C4quC5iCBQSU4g4LmD4Lir4Lih4LmICiAgICAgwrcg4Lij4Lir4Lix4Liq4Lit4Li44Lib4LiB4Lij4LiT4LmM',
  'ICjguITguLnguYjguIHguLHguJogUElOKSDigJQg4LmA4LiB4LmH4Lia4LiX4Lix4LmJ4LiHIGxvY2FsU3RvcmFnZSDguYHguKXguLDguYPguJkgVVJMIOC4guC4reC4h+C4q+C4meC5ieC4suC5geC4oeC5iAogICAgICAg4Lic4LmI4Liy4LiZIGdvb2dsZS5zY3Jp',
  'cHQuaGlzdG9yeSDguYDguJ7guLfguYjguK3guYPguKvguYnguKLguLHguIfguK3guKLguLnguYjguKvguKXguLHguIfguJvguLTguJTguYDguJvguLTguJTguYDguITguKPguLfguYjguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09ICovCgp2YXIgQVVUSCA9IHsKICBzZXNzaW9uOiAnJywKICBkZXZpY2U6ICcnLAogIG1lOiBudWxsLAogIHBpbjogJycsCiAgc2NyZWVuOiAnJwp9OwoKdmFyIExTX1NFU1NJT04gPSAnbWNvcm5lci5zZXNzaW9uJzsKdmFyIExT',
  'X0RFVklDRSAgPSAnbWNvcm5lci5kZXZpY2UnOwoKLyogLS0tLS0tLS0tLS0tLS0tLSDguJfguLXguYjguYDguIHguYfguJrguJ3guLHguYjguIfguYDguJrguKPguLLguKfguYzguYDguIvguK3guKPguYwgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gbHNH',
  'ZXQoayl7CiAgdHJ5IHsgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrKSB8fCAnJzsgfSBjYXRjaCAoZSkgeyByZXR1cm4gJyc7IH0KfQpmdW5jdGlvbiBsc1NldChrLCB2KXsKICB0cnkgeyB2ID8gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVt',
  'KGssIHYpIDogd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGspOyB9CiAgY2F0Y2ggKGUpIHsgLyog4LmC4Lir4Lih4LiU4Liq4LmI4Lin4LiZ4LiV4Lix4Lin4Lir4Lij4Li34Lit4Lib4Li04LiU4LiE4Li44LiB4LiB4Li14LmJ4LmE4Lin4LmJIOKAlCDg',
  'uYPguIrguYnguJfguLLguIfguKrguLPguKPguK3guIcgKi8gfQp9CgovKiog4LmA4LiC4Li14Lii4LiZ4Lij4Lir4Lix4Liq4Lit4Li44Lib4LiB4Lij4LiT4LmM4Lil4LiHIFVSTCDguILguK3guIfguKvguJnguYnguLLguYHguKHguYgg4LmD4Lir4LmJ4Lij4Lit',
  '4LiU4LiC4LmJ4Liy4Lih4LiB4Liy4Lij4LmA4Lib4Li04LiU4LmD4Lir4Lih4LmIICovCmZ1bmN0aW9uIGRldmljZVRvVXJsKHRva2VuKXsKICB0cnkgewogICAgaWYgKCF3aW5kb3cuZ29vZ2xlIHx8ICFnb29nbGUuc2NyaXB0IHx8ICFnb29nbGUuc2NyaXB0Lmhp',
  'c3RvcnkpIHJldHVybjsKICAgIHZhciBwYXJhbXMgPSB7fTsKICAgIGlmIChhY2Nlc3NLZXkoKSkgcGFyYW1zLmtleSA9IGFjY2Vzc0tleSgpOwogICAgaWYgKHRva2VuKSBwYXJhbXMuZCA9IHRva2VuOwogICAgZ29vZ2xlLnNjcmlwdC5oaXN0b3J5LnJlcGxhY2VT',
  'dGF0ZSh7fSwgcGFyYW1zLCBsb2NhdGlvbi5oYXNoKTsKICB9IGNhdGNoIChlKSB7IC8qIOC5hOC4oeC5iOC5g+C4iuC5iOC5gOC4p+C5h+C4muC5geC4reC4myAo4LmA4LiK4LmI4LiZ4LmA4Lib4Li04LiU4LmD4LiZIGRpYWxvZykg4oCUIOC4guC5ieC4suC4oeC5',
  'hOC4myAqLyB9Cn0KCmZ1bmN0aW9uIHNhdmVEZXZpY2UodG9rZW4pewogIEFVVEguZGV2aWNlID0gdG9rZW4gfHwgJyc7CiAgbHNTZXQoTFNfREVWSUNFLCBBVVRILmRldmljZSk7CiAgZGV2aWNlVG9VcmwoQVVUSC5kZXZpY2UpOwp9CgpmdW5jdGlvbiBzYXZlU2Vz',
  'c2lvbih0b2tlbil7CiAgQVVUSC5zZXNzaW9uID0gdG9rZW4gfHwgJyc7CiAgbHNTZXQoTFNfU0VTU0lPTiwgQVVUSC5zZXNzaW9uKTsKfQoKLyoqIOC4reC5iOC4suC4meC4hOC5iOC4suC4l+C4teC5iOC5gOC4geC5h+C4muC5hOC4p+C5ieC4l+C4seC5ieC4h+C4',
  'q+C4oeC4lCAo4LiV4LmJ4Lit4LiH4Lij4LitIFVSTCDguILguK3guIfguKvguJnguYnguLLguYHguKHguYgg4LiI4Li24LiH4LmA4Lib4LmH4LiZ4LmB4Lia4LiaIGNhbGxiYWNrKSAqLwpmdW5jdGlvbiBsb2FkU3RvcmVkKGRvbmUpewogIEFVVEguc2Vzc2lvbiA9',
  'IGxzR2V0KExTX1NFU1NJT04pOwogIEFVVEguZGV2aWNlICA9IGxzR2V0KExTX0RFVklDRSk7CgogIGlmICh3aW5kb3cuZ29vZ2xlICYmIGdvb2dsZS5zY3JpcHQgJiYgZ29vZ2xlLnNjcmlwdC51cmwpIHsKICAgIHRyeSB7CiAgICAgIGdvb2dsZS5zY3JpcHQudXJs',
  'LmdldExvY2F0aW9uKGZ1bmN0aW9uKGxvYyl7CiAgICAgICAgdmFyIHAgPSAobG9jICYmIGxvYy5wYXJhbWV0ZXIpIHx8IHt9OwogICAgICAgIGlmIChwLmQgJiYgIUFVVEguZGV2aWNlKSB7IEFVVEguZGV2aWNlID0gU3RyaW5nKHAuZCk7IGxzU2V0KExTX0RFVklD',
  'RSwgQVVUSC5kZXZpY2UpOyB9CiAgICAgICAgaWYgKHAua2V5ICYmICFhY2Nlc3NLZXkoKSkgUkVTT0xWRURfS0VZID0gU3RyaW5nKHAua2V5KTsKICAgICAgICBkb25lKCk7CiAgICAgIH0pOwogICAgICByZXR1cm47CiAgICB9IGNhdGNoIChlKSB7IC8qIOC5g+C4',
  'iuC5ieC4l+C4suC4h+C4m+C4geC4leC4tCAqLyB9CiAgfQogIGRvbmUoKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguJXguLHguKfguITguLjguKHguKXguLPguJTguLHguJrguKvguJnguYnguLLguIjguK0gLS0tLS0tLS0tLS0tLS0tLSAqLwoKLyoqIOC5gOC4',
  'o+C4teC4ouC4geC4leC4reC4meC5gOC4m+C4tOC4lOC4q+C4meC5ieC4suC5gOC4p+C5h+C4miDigJQg4LiV4Lix4LiU4Liq4Li04LiZ4Lin4LmI4Liy4LiI4Liw4LmD4Lir4LmJ4LmA4Lir4LmH4LiZ4Lit4Liw4LmE4Lij4LiB4LmI4Lit4LiZICovCmZ1bmN0aW9u',
  'IGF1dGhHYXRlKCl7CiAgbG9hZFN0b3JlZChmdW5jdGlvbigpewogICAgY2FsbEFwaSgnYXV0aC5tZScpLnRoZW4oZnVuY3Rpb24obWUpewogICAgICBBVVRILm1lID0gbWU7CiAgICAgIGlmIChtZS5zaWduZWRJbikgcmV0dXJuIGVudGVyQXBwKG1lKTsKICAgICAg',
  'aWYgKEFVVEguZGV2aWNlKSByZXR1cm4gc2hvd1BpbigpOwogICAgICBzaG93TG9naW4oKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICBzaG93TG9naW4oZS5tZXNzYWdlIHx8IGUpOwogICAgfSk7CiAgfSk7Cn0KCmZ1bmN0aW9uIGVudGVyQXBwKG1l',
  'KXsKICBBVVRILm1lID0gbWU7CiAgaGlkZUF1dGgoKTsKICBib290Tm93KCk7CiAgLy8g4LmA4Lie4Li04LmI4LiH4Lil4LmH4Lit4LiB4Lit4Li04LiZ4LiU4LmJ4Lin4Lii4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmB4Lil4Liw4Lii4Lix4LiH4LmE4Lih4LmI',
  '4LmA4LiE4Lii4LiV4Lix4LmJ4LiHIFBJTiDguJrguJnguYDguITguKPguLfguYjguK3guIfguJnguLXguYkg4oCUIOC4iuC4p+C4meC4leC4seC5ieC4h+C4quC4seC4geC4hOC4o+C4seC5ieC4hwogIGlmICghQVVUSC5kZXZpY2UgJiYgbWUudXNlcm5hbWUgJiYg',
  'IWxzR2V0KCdtY29ybmVyLnBpbkFza2VkJykpIHsKICAgIHNldFRpbWVvdXQob2ZmZXJQaW4sIDkwMCk7CiAgfQp9CgpmdW5jdGlvbiBoaWRlQXV0aCgpewogIHZhciByID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F1dGhSb290Jyk7CiAgaWYgKHIpIHIuaW5u',
  'ZXJIVE1MID0gJyc7CiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdsb2NrZWQnKTsKfQoKZnVuY3Rpb24gc2hvd0F1dGgoaHRtbCl7CiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdsb2NrZWQnKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJ',
  'ZCgnYXV0aFJvb3QnKS5pbm5lckhUTUwgPQogICAgJzxkaXYgY2xhc3M9ImF1dGgtd3JhcCI+PGRpdiBjbGFzcz0iYXV0aC1jYXJkIj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImF1dGgtYnJhbmQiPvCfj6IgPGI+JyArIGVzYygoUy5ib290ICYmIFMuYm9vdC5hcHAg',
  'JiYgUy5ib290LmFwcC5uYW1lKSB8fCAnVGhlIE0gQ29ybmVyIEFQJykgKyAnPC9iPjwvZGl2PicgKwogICAgICBodG1sICsKICAgICc8L2Rpdj48L2Rpdj4nOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4q+C4meC5ieC4suC4peC5h+C4reC4geC4reC4tOC4meC4',
  'lOC5ieC4p+C4ouC4o+C4q+C4seC4quC4nOC5iOC4suC4mSAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiBzaG93TG9naW4oZXJyKXsKICBBVVRILnNjcmVlbiA9ICdsb2dpbic7CiAgc2hvd0F1dGgoCiAgICAnPGgyIGNsYXNzPSJhdXRoLWgiPuC5gOC4guC5',
  'ieC4suC4quC4ueC5iOC4o+C4sOC4muC4mjwvaDI+JyArCiAgICAnPHAgY2xhc3M9ImF1dGgtc3ViIj7guYPguKrguYjguIrguLfguYjguK3guJzguLnguYnguYPguIrguYnguYHguKXguLDguKPguKvguLHguKrguJzguYjguLLguJnguJfguLXguYjguYTguJTguYng',
  'uKPguLHguJo8L3A+JyArCiAgICAoZXJyID8gJzxkaXYgY2xhc3M9ImF1dGgtZXJyIj4nICsgZXNjKGVycikgKyAnPC9kaXY+JyA6ICc8ZGl2IGNsYXNzPSJhdXRoLWVyciIgaWQ9ImF1dGhFcnIiIGhpZGRlbj48L2Rpdj4nKSArCiAgICAnPGRpdiBjbGFzcz0iYXV0',
  'aC1mIj48bGFiZWwgZm9yPSJsZ1VzZXIiPuC4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5iTwvbGFiZWw+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImxnVXNlciIgYXV0b2NvbXBsZXRlPSJ1c2VybmFtZSIgYXV0b2NhcGl0YWxpemU9Im5vbmUi',
  'IHNwZWxsY2hlY2s9ImZhbHNlIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJhdXRoLWYiPjxsYWJlbCBmb3I9ImxnUGFzcyI+4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZPC9sYWJlbD4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0ibGdQYXNzIiB0',
  'eXBlPSJwYXNzd29yZCIgYXV0b2NvbXBsZXRlPSJjdXJyZW50LXBhc3N3b3JkIj48L2Rpdj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIGF1dGgtZ28iIGlkPSJsZ0dvIj7guYDguILguYnguLLguKrguLnguYjguKPguLDguJrguJo8L2J1dHRvbj4nICsK',
  'ICAgIChBVVRILmRldmljZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4gYXV0aC1hbHQiIG9uY2xpY2s9InNob3dQaW4oKSI+4oaQIOC4geC4peC4seC4muC5hOC4m+C5g+C4iuC5iSBQSU48L2J1dHRvbj4nIDogJycpICsKICAgICc8cCBjbGFzcz0iYXV0aC1mb290Ij7g',
  'uKXguLfguKHguKPguKvguLHguKrguJzguYjguLLguJk/IOC5g+C4q+C5ieC4nOC4ueC5ieC4lOC4ueC5geC4peC4leC4seC5ieC4h+C4o+C4q+C4seC4quC5g+C4q+C4oeC5iOC5g+C4q+C5ieC4iOC4suC4geC5gOC4oeC4meC4ueC5g+C4meC4iuC4teC4lTwvcD4n',
  'CiAgKTsKCiAgdmFyIGdvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xnR28nKTsKICB2YXIgdXNlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsZ1VzZXInKTsKICB2YXIgcGFzcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsZ1Bhc3MnKTsKCiAg',
  'ZnVuY3Rpb24gc3VibWl0KCl7CiAgICB2YXIgdSA9IHVzZXIudmFsdWUudHJpbSgpLCBwID0gcGFzcy52YWx1ZTsKICAgIGlmICghdSB8fCAhcCkgcmV0dXJuIGF1dGhFcnJvcign4LiB4Lij4Li44LiT4Liy4LiB4Lij4Lit4LiB4LiX4Lix4LmJ4LiH4LiK4Li34LmI',
  '4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmB4Lil4Liw4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZJyk7CiAgICBnby5kaXNhYmxlZCA9IHRydWU7CiAgICBnby5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4LiV4Lij',
  '4Lin4LiI4Liq4Lit4Lia4oCmJzsKICAgIGNhbGxBcGkoJ2F1dGgubG9naW4nLCB7IHVzZXJuYW1lOiB1LCBwYXNzd29yZDogcCB9KS50aGVuKGZ1bmN0aW9uKHIpewogICAgICBzYXZlU2Vzc2lvbihyLnNlc3Npb24pOwogICAgICBpZiAoci5tdXN0Q2hhbmdlKSBy',
  'ZXR1cm4gc2hvd0NoYW5nZVBhc3N3b3JkKHRydWUpOwogICAgICByZXR1cm4gY2FsbEFwaSgnYXV0aC5tZScpLnRoZW4oZW50ZXJBcHApOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgIGdvLmRpc2FibGVkID0gZmFsc2U7CiAgICAgIGdvLnRleHRDb250',
  'ZW50ID0gJ+C5gOC4guC5ieC4suC4quC4ueC5iOC4o+C4sOC4muC4mic7CiAgICAgIHBhc3MudmFsdWUgPSAnJzsKICAgICAgYXV0aEVycm9yKGUubWVzc2FnZSB8fCBlKTsKICAgIH0pOwogIH0KCiAgZ28ub25jbGljayA9IHN1Ym1pdDsKICBbdXNlciwgcGFzc10u',
  'Zm9yRWFjaChmdW5jdGlvbihlbCl7CiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZXYpeyBpZiAoZXYua2V5ID09PSAnRW50ZXInKSBzdWJtaXQoKTsgfSk7CiAgfSk7CiAgdXNlci5mb2N1cygpOwp9CgpmdW5jdGlvbiBhdXRoRXJy',
  'b3IobXNnKXsKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXV0aEVycicpOwogIGlmIChlbCkgeyBlbC50ZXh0Q29udGVudCA9IG1zZzsgZWwuaGlkZGVuID0gZmFsc2U7IH0KICBlbHNlIHNob3dMb2dpbihtc2cpOwp9CgovKiAtLS0tLS0tLS0t',
  'LS0tLS0tIOC4q+C4meC5ieC4siBQSU4gNiDguKvguKXguLHguIEgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gc2hvd1BpbigpewogIEFVVEguc2NyZWVuID0gJ3Bpbic7CiAgQVVUSC5waW4gPSAnJzsKICBzaG93QXV0aCgKICAgICc8aDIgY2xhc3M9ImF1',
  'dGgtaCI+4LmD4Liq4LmIIFBJTjwvaDI+JyArCiAgICAnPHAgY2xhc3M9ImF1dGgtc3ViIj7guJvguKXguJTguKXguYfguK3guIHguJTguYnguKfguKLguKPguKvguLHguKogNiDguKvguKXguLHguIHguILguK3guIfguYDguITguKPguLfguYjguK3guIfguJnguLXg',
  'uYk8L3A+JyArCiAgICAnPGRpdiBjbGFzcz0iYXV0aC1lcnIiIGlkPSJhdXRoRXJyIiBoaWRkZW4+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0icGluLWRvdHMiIGlkPSJwaW5Eb3RzIj4nICsgcGluRG90c0h0bWwoJycpICsgJzwvZGl2PicgKwogICAgJzxkaXYg',
  'Y2xhc3M9InBpbi1wYWQiPicgKwogICAgICBbMSwyLDMsNCw1LDYsNyw4LDldLm1hcChmdW5jdGlvbihuKXsKICAgICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9InBpbi1rIiBvbmNsaWNrPSJwaW5QdXNoKFwnJyArIG4gKyAnXCcpIj4nICsgbiArICc8L2J1dHRv',
  'bj4nOwogICAgICB9KS5qb2luKCcnKSArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJwaW4tayBnaG9zdCIgb25jbGljaz0ic2hvd0xvZ2luKCkiIHRpdGxlPSLguYPguIrguYnguKPguKvguLHguKrguJzguYjguLLguJnguYHguJfguJkiPvCflJE8L2J1dHRvbj4nICsK',
  'ICAgICAgJzxidXR0b24gY2xhc3M9InBpbi1rIiBvbmNsaWNrPSJwaW5QdXNoKFwnMFwnKSI+MDwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0icGluLWsgZ2hvc3QiIG9uY2xpY2s9InBpbkJhY2soKSIgdGl0bGU9IuC4peC4miI+4oyrPC9idXR0b24+',
  'JyArCiAgICAnPC9kaXY+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIGF1dGgtYWx0IiBvbmNsaWNrPSJmb3JnZXRUaGlzRGV2aWNlKCkiPuC4peC4t+C4oSBQSU4g4oCUIOC5gOC4guC5ieC4suC4lOC5ieC4p+C4ouC4o+C4q+C4seC4quC4nOC5iOC4suC4mTwv',
  'YnV0dG9uPicKICApOwoKICAvLyDguITguLXguKLguYzguJrguK3guKPguYzguJTguIjguKPguLTguIfguIHguYfguYPguIrguYnguYTguJTguYkg4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LiI4Li04LmJ4Lih4Lib4Li44LmI4Lih4Lia4LiZ4LiI4LitCiAgZG9jdW1l',
  'bnQub25rZXlkb3duID0gZnVuY3Rpb24oZXYpewogICAgaWYgKEFVVEguc2NyZWVuICE9PSAncGluJykgcmV0dXJuOwogICAgaWYgKC9eXGQkLy50ZXN0KGV2LmtleSkpIHBpblB1c2goZXYua2V5KTsKICAgIGVsc2UgaWYgKGV2LmtleSA9PT0gJ0JhY2tzcGFjZScp',
  'IHBpbkJhY2soKTsKICB9Owp9CgpmdW5jdGlvbiBwaW5Eb3RzSHRtbChwaW4pewogIHZhciBodG1sID0gJyc7CiAgZm9yICh2YXIgaSA9IDA7IGkgPCA2OyBpKyspIGh0bWwgKz0gJzxpIGNsYXNzPSInICsgKGkgPCBwaW4ubGVuZ3RoID8gJ29uJyA6ICcnKSArICci',
  'PjwvaT4nOwogIHJldHVybiBodG1sOwp9CgpmdW5jdGlvbiBwaW5QdXNoKGQpewogIGlmIChBVVRILnBpbi5sZW5ndGggPj0gNikgcmV0dXJuOwogIEFVVEgucGluICs9IGQ7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpbkRvdHMnKS5pbm5lckhUTUwgPSBw',
  'aW5Eb3RzSHRtbChBVVRILnBpbik7CiAgaWYgKEFVVEgucGluLmxlbmd0aCA9PT0gNikgc2V0VGltZW91dChwaW5TdWJtaXQsIDEyMCk7Cn0KCmZ1bmN0aW9uIHBpbkJhY2soKXsKICBBVVRILnBpbiA9IEFVVEgucGluLnNsaWNlKDAsIC0xKTsKICB2YXIgZCA9IGRv',
  'Y3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaW5Eb3RzJyk7CiAgaWYgKGQpIGQuaW5uZXJIVE1MID0gcGluRG90c0h0bWwoQVVUSC5waW4pOwp9CgpmdW5jdGlvbiBwaW5TdWJtaXQoKXsKICB2YXIgcGluID0gQVVUSC5waW47CiAgQVVUSC5waW4gPSAnJzsKICB2YXIg',
  'ZG90cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaW5Eb3RzJyk7CiAgaWYgKGRvdHMpIGRvdHMuY2xhc3NMaXN0LmFkZCgnYnVzeScpOwoKICBjYWxsQXBpKCdhdXRoLnVubG9jaycsIHsgZGV2aWNlOiBBVVRILmRldmljZSwgcGluOiBwaW4gfSkudGhlbihm',
  'dW5jdGlvbihyKXsKICAgIHNhdmVTZXNzaW9uKHIuc2Vzc2lvbik7CiAgICBkb2N1bWVudC5vbmtleWRvd24gPSBudWxsOwogICAgcmV0dXJuIGNhbGxBcGkoJ2F1dGgubWUnKS50aGVuKGVudGVyQXBwKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgIHZhciBt',
  'c2cgPSBTdHJpbmcoZS5tZXNzYWdlIHx8IGUpOwogICAgaWYgKGRvdHMpIHsgZG90cy5jbGFzc0xpc3QucmVtb3ZlKCdidXN5Jyk7IGRvdHMuY2xhc3NMaXN0LmFkZCgnc2hha2UnKTsgZG90cy5pbm5lckhUTUwgPSBwaW5Eb3RzSHRtbCgnJyk7IH0KICAgIHNldFRp',
  'bWVvdXQoZnVuY3Rpb24oKXsgaWYgKGRvdHMpIGRvdHMuY2xhc3NMaXN0LnJlbW92ZSgnc2hha2UnKTsgfSwgNTAwKTsKICAgIGF1dGhFcnJvcihtc2cpOwogICAgLy8gUElOIOC4luC4ueC4geC4ouC4geC5gOC4peC4tOC4geC5hOC4m+C5geC4peC5ieC4pyAo4Lic',
  '4Li04LiU4LiE4Lij4Lia4LmC4LiE4Lin4LiV4LiyIC8g4Lir4Lih4LiU4Lit4Liy4Lii4Li4KSDigJQg4LiV4LmJ4Lit4LiH4LiB4Lil4Lix4Lia4LmE4Lib4LmD4LiK4LmJ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZCiAgICBpZiAoL+C4peC5h+C4reC4geC4reC4',
  'tOC4meC4lOC5ieC4p+C4ouC4o+C4q+C4seC4quC4nOC5iOC4suC4mS8udGVzdChtc2cpKSB7CiAgICAgIHNhdmVEZXZpY2UoJycpOwogICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHNob3dMb2dpbihtc2cpOyB9LCAxNDAwKTsKICAgIH0KICB9KTsKfQoKZnVu',
  'Y3Rpb24gZm9yZ2V0VGhpc0RldmljZSgpewogIHZhciB0b2tlbiA9IEFVVEguZGV2aWNlOwogIHNhdmVEZXZpY2UoJycpOwogIGxzU2V0KCdtY29ybmVyLnBpbkFza2VkJywgJycpOwogIGRvY3VtZW50Lm9ua2V5ZG93biA9IG51bGw7CiAgaWYgKHRva2VuKSBjYWxs',
  'QXBpKCdhdXRoLmZvcmdldERldmljZScsIHsgZGV2aWNlOiB0b2tlbiB9KS5jYXRjaChmdW5jdGlvbigpeyAvKiDguKvguKHguJTguK3guLLguKLguLjguYTguJvguYHguKXguYnguKfguIHguYfguIrguYjguLLguIfguKHguLHguJkgKi8gfSk7CiAgc2hvd0xvZ2lu',
  'KCk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4LiV4Lix4LmJ4LiHIFBJTiAtLS0tLS0tLS0tLS0tLS0tICovCgovKiog4LiK4Lin4LiZ4LiV4Lix4LmJ4LiHIFBJTiDguKvguKXguLHguIfguKXguYfguK3guIHguK3guLTguJnguITguKPguLHguYnguIfguYHguKPg',
  'uIHguJrguJnguYDguITguKPguLfguYjguK3guIfguJnguLXguYkgKi8KZnVuY3Rpb24gb2ZmZXJQaW4oKXsKICBsc1NldCgnbWNvcm5lci5waW5Bc2tlZCcsICcxJyk7CiAgb3Blbk1vZGFsKCfguJXguLHguYnguIcgUElOIOC4quC4s+C4q+C4o+C4seC4muC5gOC4',
  'hOC4o+C4t+C5iOC4reC4h+C4meC4teC5iScsCiAgICAnPHA+4LiV4Lix4LmJ4LiH4Lij4Lir4Lix4LiqIDYg4Lir4Lil4Lix4LiB4LmE4Lin4LmJIOC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC4leC5ieC4reC4h+C4nuC4tOC4oeC4nuC5jOC4o+C4q+C4seC4quC4',
  'nOC5iOC4suC4meC4l+C4uOC4geC4hOC4o+C4seC5ieC4h+C4l+C4teC5iOC5gOC4m+C4tOC4lDwvcD4nICsKICAgICc8cCBjbGFzcz0ibXV0ZWQgZnMxMyI+UElOIOC4nOC4ueC4geC4geC4seC4muC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5ieC5gOC4hOC4',
  'o+C4t+C5iOC4reC4h+C5gOC4lOC4teC4ouC4pyDguYDguITguKPguLfguYjguK3guIfguK3guLfguYjguJnguYPguIrguYnguYTguKHguYjguYTguJTguYkgwrcg4Lii4LiB4LmA4Lil4Li04LiB4LmA4Lih4Li34LmI4Lit4LmE4Lir4Lij4LmI4LiB4LmH4LmE4LiU',
  '4LmJ4LmD4LiZ4Lir4LiZ4LmJ4Liy4LiV4Lix4LmJ4LiH4LiE4LmI4LiyPC9wPicsCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC5hOC4p+C5ieC4geC5iOC4reC4mTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9',
  'ImJ0biBwcmkiIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtmb3JtU2V0UGluKCkiPuC4leC4seC5ieC4hyBQSU4g4LmA4Lil4LiiPC9idXR0b24+Jyk7Cn0KCmZ1bmN0aW9uIGZvcm1TZXRQaW4oKXsKICBvcGVuTW9kYWwoJ+C4leC4seC5ieC4hyBQSU4gNiDguKvguKXg',
  'uLHguIEnLAogICAgJzxkaXYgY2xhc3M9ImZncmlkIj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYgZnVsbCI+PGxhYmVsIGZvcj0icGluMSI+UElOIOC5g+C4q+C4oeC5iDwvbGFiZWw+JyArCiAgICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0icGluMSIgdHlw',
  'ZT0icGFzc3dvcmQiIGlucHV0bW9kZT0ibnVtZXJpYyIgbWF4bGVuZ3RoPSI2IiAnICsKICAgICAgICAnYXV0b2NvbXBsZXRlPSJuZXctcGFzc3dvcmQiIHBsYWNlaG9sZGVyPSLigKLigKLigKLigKLigKLigKIiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0i',
  'ZiBmdWxsIj48bGFiZWwgZm9yPSJwaW4yIj7guYPguKrguYggUElOIOC4reC4teC4geC4hOC4o+C4seC5ieC4hzwvbGFiZWw+JyArCiAgICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0icGluMiIgdHlwZT0icGFzc3dvcmQiIGlucHV0bW9kZT0ibnVtZXJpYyIg',
  'bWF4bGVuZ3RoPSI2IiAnICsKICAgICAgICAnYXV0b2NvbXBsZXRlPSJuZXctcGFzc3dvcmQiIHBsYWNlaG9sZGVyPSLigKLigKLigKLigKLigKLigKIiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiBmdWxsIj48bGFiZWwgZm9yPSJwaW5EZXYiPuC4iuC4',
  't+C5iOC4reC5gOC4hOC4o+C4t+C5iOC4reC4hyAo4LmE4Lin4LmJ4LiU4Li54Lii4LmJ4Lit4LiZ4Lir4Lil4Lix4LiHKTwvbGFiZWw+JyArCiAgICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0icGluRGV2IiB2YWx1ZT0iJyArIGVzYyhndWVzc0RldmljZU5h',
  'bWUoKSkgKyAnIj48L2Rpdj4nICsKICAgICc8L2Rpdj4nICsKICAgICc8cCBjbGFzcz0ibXV0ZWQgZnMxMyBtdDgiPuC4q+C4peC4teC4geC5gOC4peC4teC5iOC4ouC4h+C5gOC4peC4guC4l+C4teC5iOC5gOC4lOC4suC4h+C5iOC4suC4oiDguYDguIrguYjguJkg',
  'MTExMTExIOC4q+C4o+C4t+C4rSAxMjM0NTY8L3A+JywKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lii4LiB4LmA4Lil4Li04LiBPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgaWQ9InBpbkdv',
  'Ij7guJrguLHguJnguJfguLbguIEgUElOPC9idXR0b24+Jyk7CgogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaW5HbycpLm9uY2xpY2sgPSBmdW5jdGlvbigpewogICAgdmFyIGEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGluMScpLnZhbHVlOwogICAg',
  'dmFyIGIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGluMicpLnZhbHVlOwogICAgaWYgKCEvXlxkezZ9JC8udGVzdChhKSkgcmV0dXJuIHRvYXN0KCdQSU4g4LiV4LmJ4Lit4LiH4LmA4Lib4LmH4LiZ4LiV4Lix4Lin4LmA4Lil4LiCIDYg4Lir4Lil4Lix4LiB',
  'JywgJ2VycicpOwogICAgaWYgKGEgIT09IGIpIHJldHVybiB0b2FzdCgnUElOIOC4quC4reC4h+C4iuC5iOC4reC4h+C5hOC4oeC5iOC4leC4o+C4h+C4geC4seC4mScsICdlcnInKTsKICAgIHZhciBidG4gPSB0aGlzOwogICAgYnRuLmRpc2FibGVkID0gdHJ1ZTsK',
  'ICAgIGJ0bi5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4Lia4Lix4LiZ4LiX4Li24LiB4oCmJzsKICAgIGNhbGxBcGkoJ2F1dGguc2V0UGluJywgeyBwaW46IGEsIGRldmljZTogZG9jdW1lbnQuZ2V0RWxlbWVu',
  'dEJ5SWQoJ3BpbkRldicpLnZhbHVlIH0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICAgIHNhdmVEZXZpY2Uoci5kZXZpY2UpOwogICAgICBjbG9zZU1vZGFsKCk7CiAgICAgIHRvYXN0KCfguJXguLHguYnguIcgUElOIOC5gOC4o+C4teC4ouC4muC4o+C5ieC4reC4oiDi',
  'gJQg4LiE4Lij4Lix4LmJ4LiH4Lir4LiZ4LmJ4Liy4LmD4Liq4LmI4LmB4LiE4LmIIDYg4Lir4Lil4Lix4LiBJywgJ29rJyk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgYnRuLmRpc2FibGVkID0gZmFsc2U7CiAgICAgIGJ0bi50ZXh0Q29udGVudCA9',
  'ICfguJrguLHguJnguJfguLbguIEgUElOJzsKICAgICAgdG9hc3QoZS5tZXNzYWdlIHx8IGUsICdlcnInKTsKICAgIH0pOwogIH07Cn0KCmZ1bmN0aW9uIGd1ZXNzRGV2aWNlTmFtZSgpewogIHZhciB1YSA9IG5hdmlnYXRvci51c2VyQWdlbnQgfHwgJyc7CiAgaWYg',
  'KC9pUGhvbmUvLnRlc3QodWEpKSByZXR1cm4gJ2lQaG9uZSc7CiAgaWYgKC9pUGFkLy50ZXN0KHVhKSkgcmV0dXJuICdpUGFkJzsKICBpZiAoL0FuZHJvaWQvLnRlc3QodWEpKSByZXR1cm4gJ0FuZHJvaWQnOwogIGlmICgvTWFjaW50b3NoLy50ZXN0KHVhKSkgcmV0',
  'dXJuICdNYWMnOwogIGlmICgvV2luZG93cy8udGVzdCh1YSkpIHJldHVybiAnV2luZG93cyc7CiAgcmV0dXJuICfguK3guLjguJvguIHguKPguJPguYzguILguK3guIfguInguLHguJknOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC5gOC4m+C4peC4teC5iOC4ouC4',
  'meC4o+C4q+C4seC4quC4nOC5iOC4suC4mSAtLS0tLS0tLS0tLS0tLS0tICovCgovKiogQHBhcmFtIHtib29sZWFufSBmb3JjZWQgdHJ1ZSA9IOC4o+C4sOC4muC4muC4muC4seC4h+C4hOC4seC4muC5gOC4m+C4peC4teC5iOC4ouC4meC4leC4reC4meC4peC5h+C4',
  'reC4geC4reC4tOC4meC4hOC4o+C4seC5ieC4h+C5geC4o+C4gSAqLwpmdW5jdGlvbiBzaG93Q2hhbmdlUGFzc3dvcmQoZm9yY2VkKXsKICBpZiAoIWZvcmNlZCkgcmV0dXJuIGZvcm1DaGFuZ2VQYXNzd29yZCgpOwogIEFVVEguc2NyZWVuID0gJ2NoYW5nZSc7CiAg',
  'c2hvd0F1dGgoCiAgICAnPGgyIGNsYXNzPSJhdXRoLWgiPuC4leC4seC5ieC4h+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC4guC4reC4h+C4hOC4uOC4k+C5gOC4reC4hzwvaDI+JyArCiAgICAnPHAgY2xhc3M9ImF1dGgtc3ViIj7guKPguKvguLHguKrguJfguLXg',
  'uYjguYTguJTguYnguKHguLLguYDguJvguYfguJnguKPguKvguLHguKrguIrguLHguYjguKfguITguKPguLLguKcg4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LiB4LmI4Lit4LiZ4LmD4LiK4LmJ4LiH4Liy4LiZ4Lir4LiZ4Li24LmI4LiH4LiE4Lij4Lix4LmJ4LiHPC9w',
  'PicgKwogICAgJzxkaXYgY2xhc3M9ImF1dGgtZXJyIiBpZD0iYXV0aEVyciIgaGlkZGVuPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImF1dGgtZiI+PGxhYmVsIGZvcj0iY3BPbGQiPuC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5gOC4lOC4tOC4oTwvbGFiZWw+',
  'JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImNwT2xkIiB0eXBlPSJwYXNzd29yZCIgYXV0b2NvbXBsZXRlPSJjdXJyZW50LXBhc3N3b3JkIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJhdXRoLWYiPjxsYWJlbCBmb3I9ImNwTmV3Ij7guKPguKvg',
  'uLHguKrguJzguYjguLLguJnguYPguKvguKHguYggKOC4reC4ouC5iOC4suC4h+C4meC5ieC4reC4oiA4IOC4leC4seC4pyk8L2xhYmVsPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJjcE5ldyIgdHlwZT0icGFzc3dvcmQiIGF1dG9jb21wbGV0ZT0i',
  'bmV3LXBhc3N3b3JkIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJhdXRoLWYiPjxsYWJlbCBmb3I9ImNwTmV3MiI+4LmD4Liq4LmI4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmI4Lit4Li14LiB4LiE4Lij4Lix4LmJ4LiHPC9sYWJlbD4nICsK',
  'ICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0iY3BOZXcyIiB0eXBlPSJwYXNzd29yZCIgYXV0b2NvbXBsZXRlPSJuZXctcGFzc3dvcmQiPjwvZGl2PicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgYXV0aC1nbyIgaWQ9ImNwR28iPuC4muC4seC4meC4',
  'l+C4tuC4geC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iDwvYnV0dG9uPicKICApOwoKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3BHbycpLm9uY2xpY2sgPSBmdW5jdGlvbigpewogICAgdmFyIG8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJ',
  'ZCgnY3BPbGQnKS52YWx1ZTsKICAgIHZhciBuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NwTmV3JykudmFsdWU7CiAgICB2YXIgbjIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3BOZXcyJykudmFsdWU7CiAgICBpZiAobi5sZW5ndGggPCA4KSByZXR1',
  'cm4gYXV0aEVycm9yKCfguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYjguJXguYnguK3guIfguKLguLLguKfguK3guKLguYjguLLguIfguJnguYnguK3guKIgOCDguJXguLHguKfguK3guLHguIHguKnguKMnKTsKICAgIGlmIChuICE9PSBuMikgcmV0',
  'dXJuIGF1dGhFcnJvcign4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmI4Liq4Lit4LiH4LiK4LmI4Lit4LiH4LmE4Lih4LmI4LiV4Lij4LiH4LiB4Lix4LiZJyk7CiAgICB2YXIgYnRuID0gdGhpczsKICAgIGJ0bi5kaXNhYmxlZCA9IHRydWU7CiAg',
  'ICBidG4uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C4muC4seC4meC4l+C4tuC4geKApic7CiAgICBjYWxsQXBpKCdhdXRoLmNoYW5nZVBhc3N3b3JkJywgeyBvbGRQYXNzd29yZDogbywgbmV3UGFzc3dvcmQ6',
  'IG4gfSkudGhlbihmdW5jdGlvbigpewogICAgICByZXR1cm4gY2FsbEFwaSgnYXV0aC5tZScpLnRoZW4oZW50ZXJBcHApOwogICAgfSkudGhlbihmdW5jdGlvbigpewogICAgICB0b2FzdCgn4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy',
  '4LiZ4LmA4Lij4Li14Lii4Lia4Lij4LmJ4Lit4LiiJywgJ29rJyk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgYnRuLmRpc2FibGVkID0gZmFsc2U7CiAgICAgIGJ0bi50ZXh0Q29udGVudCA9ICfguJrguLHguJnguJfguLbguIHguKPguKvguLHguKrg',
  'uJzguYjguLLguJnguYPguKvguKHguYgnOwogICAgICBhdXRoRXJyb3IoZS5tZXNzYWdlIHx8IGUpOwogICAgfSk7CiAgfTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3BPbGQnKS5mb2N1cygpOwp9CgpmdW5jdGlvbiBmb3JtQ2hhbmdlUGFzc3dvcmQoKXsK',
  'ICBvcGVuTW9kYWwoJ+C5gOC4m+C4peC4teC5iOC4ouC4meC4o+C4q+C4seC4quC4nOC5iOC4suC4mScsCiAgICAnPGRpdiBjbGFzcz0iZmdyaWQiPicgKwogICAgICAnPGRpdiBjbGFzcz0iZiBmdWxsIj48bGFiZWwgZm9yPSJtY09sZCI+4Lij4Lir4Lix4Liq4Lic',
  '4LmI4Liy4LiZ4LmA4LiU4Li04LihPC9sYWJlbD48aW5wdXQgY2xhc3M9ImlucCIgaWQ9Im1jT2xkIiB0eXBlPSJwYXNzd29yZCI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIGZ1bGwiPjxsYWJlbCBmb3I9Im1jTmV3Ij7guKPguKvguLHguKrguJzguYjg',
  'uLLguJnguYPguKvguKHguYggKOC4reC4ouC5iOC4suC4h+C4meC5ieC4reC4oiA4IOC4leC4seC4pyk8L2xhYmVsPjxpbnB1dCBjbGFzcz0iaW5wIiBpZD0ibWNOZXciIHR5cGU9InBhc3N3b3JkIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYgZnVsbCI+',
  'PGxhYmVsIGZvcj0ibWNOZXcyIj7guYPguKrguYjguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYjguK3guLXguIHguITguKPguLHguYnguIc8L2xhYmVsPjxpbnB1dCBjbGFzcz0iaW5wIiBpZD0ibWNOZXcyIiB0eXBlPSJwYXNzd29yZCI+PC9kaXY+',
  'JyArCiAgICAnPC9kaXY+JywKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lii4LiB4LmA4Lil4Li04LiBPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgaWQ9Im1jR28iPuC4muC4seC4meC4l+C4',
  'tuC4gTwvYnV0dG9uPicpOwoKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWNHbycpLm9uY2xpY2sgPSBmdW5jdGlvbigpewogICAgdmFyIG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWNOZXcnKS52YWx1ZTsKICAgIGlmIChuLmxlbmd0aCA8IDgpIHJl',
  'dHVybiB0b2FzdCgn4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmI4LiV4LmJ4Lit4LiH4Lii4Liy4Lin4Lit4Lii4LmI4Liy4LiH4LiZ4LmJ4Lit4LiiIDgg4LiV4Lix4Lin4Lit4Lix4LiB4Lip4LijJywgJ2VycicpOwogICAgaWYgKG4gIT09IGRv',
  'Y3VtZW50LmdldEVsZW1lbnRCeUlkKCdtY05ldzInKS52YWx1ZSkgcmV0dXJuIHRvYXN0KCfguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYjguKrguK3guIfguIrguYjguK3guIfguYTguKHguYjguJXguKPguIfguIHguLHguJknLCAnZXJyJyk7CiAg',
  'ICB2YXIgYnRuID0gdGhpczsKICAgIGJ0bi5kaXNhYmxlZCA9IHRydWU7CiAgICBjYWxsQXBpKCdhdXRoLmNoYW5nZVBhc3N3b3JkJywgewogICAgICBvbGRQYXNzd29yZDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21jT2xkJykudmFsdWUsIG5ld1Bhc3N3b3Jk',
  'OiBuCiAgICB9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICAgIGNsb3NlTW9kYWwoKTsKICAgICAgdG9hc3QoJ+C5gOC4m+C4peC4teC5iOC4ouC4meC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5gOC4o+C4teC4ouC4muC4o+C5ieC4reC4oicsICdvaycpOwogICAgfSku',
  'Y2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlOwogICAgICB0b2FzdChlLm1lc3NhZ2UgfHwgZSwgJ2VycicpOwogICAgfSk7CiAgfTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguK3guK3guIHguIjguLLguIHguKPguLDguJrguJog',
  'LS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gZG9Mb2dvdXQoa2VlcFBpbil7CiAgdmFyIHMgPSBBVVRILnNlc3Npb247CiAgc2F2ZVNlc3Npb24oJycpOwogIGlmICgha2VlcFBpbikgeyB2YXIgZCA9IEFVVEguZGV2aWNlOyBzYXZlRGV2aWNlKCcnKTsgaWYg',
  'KGQpIGNhbGxBcGkoJ2F1dGguZm9yZ2V0RGV2aWNlJywgeyBkZXZpY2U6IGQgfSkuY2F0Y2goZnVuY3Rpb24oKXt9KTsgfQogIGlmIChzKSBjYWxsQXBpKCdhdXRoLmxvZ291dCcsIHsgX3Nlc3Npb246IHMgfSkuY2F0Y2goZnVuY3Rpb24oKXsgLyog4Lir4Lih4LiU',
  '4Lit4Liy4Lii4Li44LmB4Lil4LmJ4Lin4LiB4LmH4LiW4Li34Lit4Lin4LmI4Liy4Lit4Lit4LiB4LmB4Lil4LmJ4LinICovIH0pOwogIGNsb3NlTW9kYWwoKTsKICBBVVRILm1lID0gbnVsbDsKICBpZiAoQVVUSC5kZXZpY2UpIHNob3dQaW4oKTsgZWxzZSBzaG93',
  'TG9naW4oKTsKfQoKZnVuY3Rpb24gY29uZmlybUxvZ291dCgpewogIG9wZW5Nb2RhbCgn4Lit4Lit4LiB4LiI4Liy4LiB4Lij4Liw4Lia4LiaJywKICAgICc8cD7guJXguYnguK3guIfguIHguLLguKPguK3guK3guIHguIjguLLguIHguKPguLDguJrguJrguYPguIrg',
  'uYjguYTguKvguKE8L3A+JyArCiAgICAoQVVUSC5kZXZpY2UgPyAnPHAgY2xhc3M9Im11dGVkIGZzMTMiPlBJTiDguJrguJnguYDguITguKPguLfguYjguK3guIfguJnguLXguYnguIjguLDguKLguLHguIfguK3guKLguLnguYgg4LiE4Lij4Lix4LmJ4LiH4Lir4LiZ',
  '4LmJ4Liy4LmA4LiC4LmJ4Liy4LiU4LmJ4Lin4LiiIFBJTiDguYTguJTguYnguYDguKXguKI8L3A+JyA6ICcnKSwKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lii4LiB4LmA4Lil4Li04LiBPC9idXR0b24+JyArCiAgICAo',
  'QVVUSC5kZXZpY2UgPyAnPGJ1dHRvbiBjbGFzcz0iYnRuIGRnciIgb25jbGljaz0iZG9Mb2dvdXQoZmFsc2UpIj7guK3guK3guIHguYHguKXguLDguKXguJogUElOPC9idXR0b24+JyA6ICcnKSArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0i',
  'ZG9Mb2dvdXQodHJ1ZSkiPuC4reC4reC4geC4iOC4suC4geC4o+C4sOC4muC4mjwvYnV0dG9uPicpOwp9Cjwvc2NyaXB0Pgo8c2NyaXB0PgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgVmlld3Mu',
  'aHRtbCDigJQg4LiV4Lix4Lin4LmC4Lir4Lil4LiUICsg4LiV4Lix4Lin4Lin4Liy4LiU4LiC4Lit4LiH4LmB4LiV4LmI4Lil4Liw4Lir4LiZ4LmJ4LiyCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAq',
  'LwoKdmFyIFJPVVRFUyA9IHt9OwoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDEpIOC4oOC4suC4nuC4o+C4p+C4oQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLmRhc2hib2FyZCA9IHsKICBsb2FkOiBmdW5jdGlvbigpeyByZXR1cm4gY2FsbEFwaSgnYXBwLmRhc2hib2FyZCcsIHsgeWVhcjogUy55ZWFyIH0pOyB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2',
  'YXIgYiA9IGQuYnVpbGRpbmc7CiAgICB2YXIga3BpcyA9CiAgICAgIGtwaSgn4Lii4Lit4LiU4Lir4LiZ4Li14LmJ4LiE4LiH4LmA4Lir4Lil4Li34Lit4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJywgYmFodChkLmRlYnRBbGwucmVtYWluaW5nKSwKICAgICAgICAgICfg',
  'uIjguLLguIHguKLguK3guJTguKvguJnguLXguYkgJyArIGJhaHQoZC5kZWJ0QWxsLnRvdGFsRGVidCkgKyAnIMK3IOC4iuC4s+C4o+C4sOC5geC4peC5ieC4pyAnICsgcGN0KGQuZGVidEFsbC5wZXJjZW50KSwgJ2FjY2VudCcpICsKICAgICAga3BpKCfguIrguLPg',
  'uKPguLDguYHguKXguYnguKcgKOC4q+C4meC4teC5ieC4q+C4peC4seC4gSknLCBwY3QoZC5kZWJ0TWFpbi5wZXJjZW50KSwgYmFodChkLmRlYnRNYWluLnBhaWQpICsgJyDguIjguLLguIEgJyArIGJhaHQoZC5kZWJ0TWFpbi50b3RhbCksICdnb29kJykgKwogICAg',
  'ICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC4m+C4tSAnICsgZC55ZWFyLCBiYWh0KGQuc3BlbmRUaGlzWWVhciksICfguIvguLfguYnguK3guILguK3guIcgKyDguIvguYjguK3guKHguYHguIvguKEgKyDguKXguYnguLLguIfguYHguK3guKPg',
  'uYwnKSArCiAgICAgIGtwaSgn4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiE4LmJ4Liy4LiHJywgZC5yZXBhaXJzLm9wZW5Kb2JzICsgJyDguIfguLLguJknLCBkLnJlcGFpcnMub3ZlcmR1ZSArICcg4LiH4Liy4LiZ4LmA4LiB4Li04LiZ4LiB4Liz4Lir4LiZ4LiUJywg',
  'ZC5yZXBhaXJzLm92ZXJkdWUgPyAnYmFkJyA6ICcnKTsKCiAgICB2YXIgYWxlcnRzID0gZC5hbGVydHMubGVuZ3RoCiAgICAgID8gJzxkaXYgY2xhc3M9ImFsaXN0Ij4nICsgZC5hbGVydHMuc2xpY2UoMCwxMikubWFwKGZ1bmN0aW9uKGEpewogICAgICAgICAgcmV0',
  'dXJuICc8ZGl2IGNsYXNzPSJhbGkgbC0nICsgYS5sZXZlbCArICciIG9uY2xpY2s9ImdvKFwnJyArIGp1bXBQYWdlKGEubW9kdWxlKSArICdcJykiPicgKwogICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJpYyI+JyArIGEuaWNvbiArICc8L2Rpdj48ZGl2Pjxk',
  'aXYgY2xhc3M9InR0Ij4nICsgZXNjKGEudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJkZCI+JyArIGVzYyhhLmRldGFpbCkgKyAnPC9kaXY+PC9kaXY+PC9kaXY+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4n',
  'CiAgICAgIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPuKchTwvZGl2PuC5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4hOC5ieC4suC4hyDigJQg4LiX4Li44LiB4Lit4Lii4LmI4Liy4LiH4LmA4Lij4Li14Lii4Lia4Lij4LmJ4Lit4LiiPC9k',
  'aXY+JzsKCiAgICByZXR1cm4gJycgKwogICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsga3BpcyArICc8L2Rpdj4nICsKCiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGcyIG1iMTIiPicgKwogICAgICAgIGNhcmQoJ/CfkrAg4Lij4Liy4Lii4LiB4Liy',
  '4Lij4Liq4Lij4Li44Lib4Lij4Lin4LihICjguKvguJnguLXguYnguKvguKXguLHguIEpJywKICAgICAgICAgIGRlYnRNaW5pKGQuZGVidE1haW4sICdkZWJ0TWFpbicpLAogICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZ28oXCdkZWJ0',
  'TWFpblwnKSI+4LiU4Li54LiX4Lix4LmJ4LiH4Lir4Lih4LiUIOKGkjwvYnV0dG9uPicpICsKICAgICAgICBjYXJkKCfwn6e+IOC4q+C4meC4teC5ieC4quC4tOC4mSAo4Lir4LiZ4Li14LmJ4Lij4Lit4LiHKScsCiAgICAgICAgICBkZWJ0TWluaShkLmRlYnRTdWIs',
  'ICdkZWJ0U3ViJykgKwogICAgICAgICAgKGQuZGVidFN1Yi5pbnRlcmVzdFRoaXNZZWFyID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbXQ4Ij7guJTguK3guIHguYDguJrguLXguYnguKLguJfguLXguYjguIrguLPguKPguLDguJvguLUgJyArIGQueWVhciArICc6',
  'IDxiPicgKyBiYWh0KGQuZGVidFN1Yi5pbnRlcmVzdFRoaXNZZWFyKSArICc8L2I+PC9kaXY+JyA6ICcnKSwKICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImdvKFwnZGVidFN1YlwnKSI+4LiU4Li54LiX4Lix4LmJ4LiH4Lir4Lih4LiU',
  'IOKGkjwvYnV0dG9uPicpICsKICAgICAgJzwvZGl2PicgKwoKICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgICAga3BpKCfguKvguYnguK3guIfguJfguLHguYnguIfguKvguKHguJQnLCBiLnRvdGFsUm9vbXMgKyAnIOC4q+C5ieC4reC4',
  'hycsICfguKHguLXguJzguLnguYnguYDguIrguYjguLIgJyArIGIub2NjdXBpZWQgKyAnIMK3IOC4p+C5iOC4suC4hyAnICsgYi52YWNhbnQpICsKICAgICAgICBrcGkoJ+C4peC5ieC4suC4h+C5geC4reC4o+C5jOC4m+C4tSAnICsgZC55ZWFyLCBkLmFjLnJvb21z',
  'RG9uZSArICcvJyArIGIudG90YWxSb29tcyArICcg4Lir4LmJ4Lit4LiHJywgZC5hYy5kb25lSW5ZZWFyICsgJyDguKPguK3guJogwrcg4LiE4LmJ4Liy4LiHICcgKyBkLmFjLnJvb21zUGVuZGluZyArICcg4Lir4LmJ4Lit4LiHJywgZC5hYy5yb29tc1BlbmRpbmcg',
  'PyAnd2FybicgOiAnZ29vZCcpICsKICAgICAgICBrcGkoJ+C4i+C4t+C5ieC4reC4guC4reC4h+C4m+C4tSAnICsgZC55ZWFyLCBiYWh0KGQucHVyY2hhc2VzLnllYXJUb3RhbCksIGQucHVyY2hhc2VzLnllYXJDb3VudCArICcg4Lij4Liy4Lii4LiB4Liy4LijJykg',
  'KwogICAgICAgIGtwaSgn4Lib4Lij4Liw4LiB4Lix4LiZ4LmD4LiB4Lil4LmJ4Lir4Lih4LiUJywgZC5wdXJjaGFzZXMud2FycmFudHkuZXhwaXJpbmcgKyAnIOC4o+C4suC4ouC4geC4suC4oycsICfguKvguKHguJTguK3guLLguKLguLjguYHguKXguYnguKcgJyAr',
  'IGQucHVyY2hhc2VzLndhcnJhbnR5LmV4cGlyZWQsIGQucHVyY2hhc2VzLndhcnJhbnR5LmV4cGlyaW5nID8gJ3dhcm4nIDogJycpICsKICAgICAgJzwvZGl2PicgKwoKICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzIgbWIxMiI+JyArCiAgICAgICAgY2FyZCgn8J+T',
  'kiDguKPguLLguKLguKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4Lii4Lir4LitIOC4m+C4tSAnICsgZC55ZWFyLAogICAgICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzMgbWIxMiI+JyArCiAgICAgICAgICAgIGtwaSgn4Lij4Liy4Lii4Lij4Lix4LiaJywgYmFo',
  'dChkLmZpbmFuY2UuaW5jb21lKSwgJ+C5gOC4ieC4peC4teC5iOC4oiAnICsgYmFodChkLmZpbmFuY2UuYXZnSW5jb21lKSArICcv4LmA4LiU4Li34Lit4LiZJywgJ2dvb2QnKSArCiAgICAgICAgICAgIGtwaSgn4Lij4Liy4Lii4LiI4LmI4Liy4LiiJywgYmFodChk',
  'LmZpbmFuY2UuZXhwZW5zZSksICfguYDguInguKXguLXguYjguKIgJyArIGJhaHQoZC5maW5hbmNlLmF2Z0V4cGVuc2UpICsgJy/guYDguJTguLfguK3guJknLCAnYmFkJykgKwogICAgICAgICAgICBrcGkoJ+C4hOC4h+C5gOC4q+C4peC4t+C4reC4quC4uOC4l+C4',
  'mOC4tCcsIGJhaHQoZC5maW5hbmNlLm5ldCksICfguK3guLHguJXguKPguLLguIHguLPguYTguKMgJyArIHBjdChkLmZpbmFuY2UubWFyZ2luKSkgKwogICAgICAgICAgJzwvZGl2PicgKyBtaW5pTW9udGhDaGFydChkLmZpbmFuY2UuYnlNb250aCksCiAgICAgICAg',
  'ICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJnbyhcJ2ZpbmFuY2VcJykiPuC4lOC4ueC4l+C4seC5ieC4h+C4q+C4oeC4lCDihpI8L2J1dHRvbj4nKSArCiAgICAgICAgY2FyZCgn8J+Xk++4jyDguIfguLLguJnguJfguLXguYjguIHguLPguKXguLHg',
  'uIfguIjguLDguJbguLbguIcgKCcgKyBkLnVwY29taW5nLmxlbmd0aCArICcpJywKICAgICAgICAgIGQudXBjb21pbmcubGVuZ3RoID8gJzxkaXYgY2xhc3M9ImFsaXN0Ij4nICsgZC51cGNvbWluZy5zbGljZSgwLDcpLm1hcChmdW5jdGlvbih1KXsKICAgICAgICAg',
  'ICAgdmFyIGx2bCA9IHUuZGF5c0xlZnQgPCAwID8gJ2RhbmdlcicgOiAodS5kYXlzTGVmdCA8PSA3ID8gJ3dhcm4nIDogJ2luZm8nKTsKICAgICAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJhbGkgbC0nICsgbHZsICsgJyIgb25jbGljaz0iZ28oXCcnICsganVt',
  'cFBhZ2UodS5tb2R1bGUpICsgJ1wnKSI+JyArCiAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImljIj4nICsgdS5pY29uICsgJzwvZGl2PjxkaXY+PGRpdiBjbGFzcz0idHQiPicgKyBlc2ModS50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICAgJzxkaXYg',
  'Y2xhc3M9ImRkIj4nICsgdGhEYXRlKHUuZGF0ZSkgKyAnIMK3ICcgKwogICAgICAgICAgICAgICAgKHUuZGF5c0xlZnQgPCAwID8gJ+C5gOC4peC4ouC4geC4s+C4q+C4meC4lCAnICsgKC11LmRheXNMZWZ0KSArICcg4Lin4Lix4LiZJyA6ICh1LmRheXNMZWZ0ID09',
  'PSAwID8gJ+C4p+C4seC4meC4meC4teC5iScgOiAn4Lit4Li14LiBICcgKyB1LmRheXNMZWZ0ICsgJyDguKfguLHguJknKSkgKwogICAgICAgICAgICAgICc8L2Rpdj48L2Rpdj48L2Rpdj4nOwogICAgICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JyA6ICc8ZGl2',
  'IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj7wn4yk77iPPC9kaXY+4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ4LiZ4Lix4LiU4Lir4Lih4Liy4Lii4LmA4Lij4LmH4LinIOC5hiDguJnguLXguYk8L2Rpdj4nLAogICAgICAgICAgJzxidXR0b24gY2xhc3M9',
  'ImJ0biBzbSIgb25jbGljaz0iZ28oXCdyZXBvcnRzXCcpIj7guJvguI/guLTguJfguLTguJnguYDguJXguYfguKEg4oaSPC9idXR0b24+JywgdHJ1ZSkgKwogICAgICAnPC9kaXY+JyArCgogICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMiI+JyArCiAgICAgICAgY2Fy',
  'ZCgn8J+UlCDguKrguLTguYjguIfguJfguLXguYjguJXguYnguK3guIfguJfguLMgKCcgKyBkLmFsZXJ0cy5sZW5ndGggKyAnKScsIGFsZXJ0cywgJycsIHRydWUpICsKICAgICAgICBjYXJkKCfwn4+iIOC4h+C4suC4meC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4',
  'tuC4geC5guC4lOC4ouC4o+C4p+C4oScsCiAgICAgICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMiI+JyArCiAgICAgICAgICAgIGtwaSgn4LiH4Liy4LiZ4Lib4Li1ICcgKyBkLnllYXIsIGQuYnVpbGRpbmdSZXBhaXJzLnllYXJDb3VudCArICcg4LiH4Liy4LiZJywg',
  'J+C4hOC5ieC4suC4hyAnICsgZC5idWlsZGluZ1JlcGFpcnMub3BlbkNvdW50KSArCiAgICAgICAgICAgIGtwaSgn4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiJywgYmFodChkLmJ1aWxkaW5nUmVwYWlycy55ZWFyQ29zdCksICfguITguKPguJrguIHguLPg',
  'uKvguJnguJTguYDguKPguYfguKcg4LmGIOC4meC4teC5iSAnICsgZC5idWlsZGluZ1JlcGFpcnMudXBjb21pbmcpICsKICAgICAgICAgICc8L2Rpdj4nICsKICAgICAgICAgIChkLmRlYnRNYWluLmZvcmVjYXN0ICYmIGQuZGVidE1haW4uZm9yZWNhc3QubW9udGhz',
  'TGVmdAogICAgICAgICAgICA/ICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+PGRpdiBjbGFzcz0iZnMxMyI+PGI+4Lib4Lij4Liw4Lih4Liy4LiT4LiB4Liy4Lij4Lib4Li04LiU4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiBPC9iPjxkaXYgY2xhc3M9Im11dGVkIG10OCI+',
  'JyArCiAgICAgICAgICAgICAgJ+C4iOC4suC4geC4reC4seC4leC4o+C4suC4iuC4s+C4o+C4sOC5gOC4ieC4peC4teC5iOC4oiAnICsgYmFodChkLmRlYnRNYWluLmZvcmVjYXN0LmF2Z1Blck1vbnRoKSArICcv4LmA4LiU4Li34Lit4LiZICgxMiDguYDguJTguLfg',
  'uK3guJnguKXguYjguLLguKrguLjguJQpICcgKwogICAgICAgICAgICAgICfguITguLLguJTguKfguYjguLLguK3guLXguIEgPGI+JyArIGQuZGVidE1haW4uZm9yZWNhc3QubW9udGhzTGVmdCArICcg4LmA4LiU4Li34Lit4LiZPC9iPiAnICsKICAgICAgICAgICAg',
  'ICAnKOC4o+C4suC4pyAnICsgdGhEYXRlKGQuZGVidE1haW4uZm9yZWNhc3QucGF5b2ZmRGF0ZSkgKyAnKTwvZGl2PjwvZGl2PicKICAgICAgICAgICAgOiAnJyksCiAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJnbyhcJ2J1aWxkaW5n',
  'XCcpIj7guJTguLnguJfguLHguYnguIfguKvguKHguJQg4oaSPC9idXR0b24+JykgKwogICAgICAnPC9kaXY+JzsKICB9LAogIGFmdGVyOiBmdW5jdGlvbigpewogICAgLy8g4LiV4Lix4Lin4LmA4Lil4LiC4Lia4LiZ4LmA4Lih4LiZ4Li54Lit4Lix4Lib4LmA4LiU',
  '4LiV4LiI4Liy4LiB4Lio4Li54LiZ4Lii4LmM4LmB4LiI4LmJ4LiH4LmA4LiV4Li34Lit4LiZIChyZWZyZXNoQWxlcnRzKSDguJfguLjguIHguKvguJnguYnguLIg4LmE4Lih4LmI4LmD4LiK4LmI4LmA4LiJ4Lie4Liy4Liw4Lir4LiZ4LmJ4Liy4LiZ4Li14LmJCiAg',
  'ICByZWZyZXNoQWxlcnRzKCk7CiAgfQp9OwoKZnVuY3Rpb24gbWluaU1vbnRoQ2hhcnQoYnlNb250aCl7CiAgdmFyIG1heCA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGJ5TW9udGgubWFwKGZ1bmN0aW9uKG0peyByZXR1cm4gTWF0aC5tYXgobS5pbmNvbWUsIG0uZXhw',
  'ZW5zZSk7IH0pKSB8fCAxOwogIHJldHVybiAnPGRpdiBzdHlsZT0iZGlzcGxheTpmbGV4O2dhcDozcHg7YWxpZ24taXRlbXM6ZmxleC1lbmQ7aGVpZ2h0Ojc0cHgiPicgKyBieU1vbnRoLm1hcChmdW5jdGlvbihtKXsKICAgIHZhciBoaSA9IE1hdGgucm91bmQobS5p',
  'bmNvbWUgLyBtYXggKiA2NiksIGhlID0gTWF0aC5yb3VuZChtLmV4cGVuc2UgLyBtYXggKiA2Nik7CiAgICByZXR1cm4gJzxkaXYgc3R5bGU9ImZsZXg6MTt0ZXh0LWFsaWduOmNlbnRlciIgdGl0bGU9IicgKyBtLmxhYmVsICsgJyDCtyDguKPguLHguJogJyArIG1v',
  'bmV5KG0uaW5jb21lKSArICcgwrcg4LiI4LmI4Liy4LiiICcgKyBtb25leShtLmV4cGVuc2UpICsgJyI+JyArCiAgICAgICc8ZGl2IHN0eWxlPSJkaXNwbGF5OmZsZXg7Z2FwOjFweDthbGlnbi1pdGVtczpmbGV4LWVuZDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO2hl',
  'aWdodDo2NnB4Ij4nICsKICAgICAgICAnPGRpdiBzdHlsZT0id2lkdGg6NnB4O2hlaWdodDonICsgaGkgKyAncHg7YmFja2dyb3VuZDp2YXIoLS1vayk7Ym9yZGVyLXJhZGl1czoycHggMnB4IDAgMCI+PC9kaXY+JyArCiAgICAgICAgJzxkaXYgc3R5bGU9IndpZHRo',
  'OjZweDtoZWlnaHQ6JyArIGhlICsgJ3B4O2JhY2tncm91bmQ6dmFyKC0tZGFuZ2VyKTtib3JkZXItcmFkaXVzOjJweCAycHggMCAwIj48L2Rpdj4nICsKICAgICAgJzwvZGl2PjxkaXYgY2xhc3M9ImZhaW50IiBzdHlsZT0iZm9udC1zaXplOjkuNXB4Ij4nICsgbS5s',
  'YWJlbC5yZXBsYWNlKCcuJywnJykgKyAnPC9kaXY+PC9kaXY+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nICsKICAnPGRpdiBjbGFzcz0icm93IGZzMTIgbXV0ZWQgbXQ4Ij48c3BhbiBjbGFzcz0iYiBvayI+4Lij4Liy4Lii4Lij4Lix4LiaPC9zcGFuPjxzcGFu',
  'IGNsYXNzPSJiIGRnciI+4Lij4Liy4Lii4LiI4LmI4Liy4LiiPC9zcGFuPjwvZGl2Pic7Cn0KCmZ1bmN0aW9uIGRlYnRNaW5pKHgsIHBhZ2UpewogIHJldHVybiAnPGRpdiBjbGFzcz0icG1ldGEiIHN0eWxlPSJtYXJnaW46MCAwIDZweCI+PHNwYW4+4LiK4Liz4Lij',
  '4Liw4LmB4Lil4LmJ4LinIDxiPicgKyBiYWh0KHgucGFpZCkgKyAnPC9iPjwvc3Bhbj4nICsKICAgICAgICAgJzxzcGFuPjxiPicgKyBwY3QoeC5wZXJjZW50KSArICc8L2I+PC9zcGFuPjwvZGl2PicgKwogICAgICAgICBwcm9ncmVzcyh4LnBlcmNlbnQsICdsZycp',
  'ICsKICAgICAgICAgJzxkaXYgY2xhc3M9InBtZXRhIj48c3Bhbj7guITguIfguYDguKvguKXguLfguK0gPGI+JyArIGJhaHQoeC5yZW1haW5pbmcpICsgJzwvYj48L3NwYW4+JyArCiAgICAgICAgICc8c3Bhbj7guKLguK3guJTguKvguJnguLXguYnguJfguLHguYng',
  'uIfguKvguKHguJQgPGI+JyArIGJhaHQoeC50b3RhbCkgKyAnPC9iPjwvc3Bhbj48L2Rpdj4nICsKICAgICAgICAgJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbXQ4Ij7guIrguLPguKPguLDguYPguJnguJvguLXguJfguLXguYjguYDguKXguLfguK3guIE6IDxiPicg',
  'KyBiYWh0KHgudGhpc1llYXIpICsgJzwvYj48L2Rpdj4nOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgMikg4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiBIC8g4Lir4LiZ4Li14LmJ4Lij',
  '4Lit4LiHICjguYPguIrguYnguJXguLHguKfguKfguLLguJTguKPguYjguKfguKHguIHguLHguJkpCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBkZWJ0Um91dGUobGVkZ2Vy',
  'LCB0aXRsZSl7CiAgcmV0dXJuIHsKICAgIGxvYWQ6IGZ1bmN0aW9uKCl7CiAgICAgIHJldHVybiBQcm9taXNlLmFsbChbCiAgICAgICAgY2FsbEFwaSgnZGVidC5zdW1tYXJ5JywgeyBsZWRnZXI6IGxlZGdlciwgeWVhcjogUy55ZWFyIH0pLAogICAgICAgIGNhbGxB',
  'cGkoJ2RlYnQucGF5bWVudHMnLCB7IGxlZGdlcjogbGVkZ2VyLCB5ZWFyOiBTLnllYXIgfSkKICAgICAgXSkudGhlbihmdW5jdGlvbihyKXsKICAgICAgICB2YXIgZCA9IHJbMF07IGQucGF5bWVudHMgPSByWzFdOyBkLmxlZGdlciA9IGxlZGdlcjsgZC5wYWdlVGl0',
  'bGUgPSB0aXRsZTsKICAgICAgICByZXR1cm4gZDsKICAgICAgfSk7CiAgICB9LAogICAgcmVuZGVyOiByZW5kZXJEZWJ0LAogICAgYWZ0ZXI6IGNhY2hlQWxsRGVidHMKICB9Owp9ClJPVVRFUy5kZWJ0TWFpbiA9IGRlYnRSb3V0ZSgn4Lir4LiZ4Li14LmJ4Lir4Lil',
  '4Lix4LiBJywgJ+C4o+C4suC4ouC4geC4suC4o+C4quC4o+C4uOC4m+C4o+C4p+C4oSBUaGUgTSBDb3JuZXIgQVAnKTsKUk9VVEVTLmRlYnRTdWIgID0gZGVidFJvdXRlKCfguKvguJnguLXguYnguKPguK3guIcnLCAn4Lir4LiZ4Li14LmJ4Liq4Li04LiZJyk7Cgov',
  'Kiog4LmA4LiB4LmH4Lia4Lij4Liy4Lii4LiK4Li34LmI4Lit4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJ4LiX4Li44LiB4Lia4Lix4LiN4LiK4Li14LmE4Lin4LmJ4LmD4Lir4LmJ4Lif4Lit4Lij4LmM4Lih4LmA4Lil4Li34Lit4LiBICLguYDguJvguYfguJnguKrg',
  'uYjguKfguJnguKvguJnguLbguYjguIfguILguK3guIciICovCmZ1bmN0aW9uIGNhY2hlQWxsRGVidHMoKXsKICBjYWxsQXBpKCdkZWJ0Lmxpc3QnLCB7fSkudGhlbihmdW5jdGlvbihsaXN0KXsKICAgIEFMTF9ERUJUUyA9IGxpc3QubWFwKGZ1bmN0aW9uKGQpewog',
  'ICAgICByZXR1cm4geyBpZDogZC5pZCwgdGl0bGU6IGQudGl0bGUsIGxlZGdlcjogZC5sZWRnZXIsIHBhcmVudElkOiBkLnBhcmVudElkIHx8ICcnIH07CiAgICB9KTsKICB9KS5jYXRjaChmdW5jdGlvbigpe30pOwp9CgpmdW5jdGlvbiByZW5kZXJEZWJ0KGQpewog',
  'IHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CgogIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImNhcmQgbWIxMiI+PGRpdiBjbGFzcz0iY2FyZC1iIj4nICsKICAgICc8ZGl2IGNs',
  'YXNzPSJyb3cgbWIxMiI+PGgzIHN0eWxlPSJtYXJnaW46MDtmb250LXNpemU6MTVweCI+JyArIGVzYyhkLnBhZ2VUaXRsZSkgKyAnPC9oMz4nICsKICAgICc8c3BhbiBjbGFzcz0ic3AiPjwvc3Bhbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIHNtIiBv',
  'bmNsaWNrPSJmb3JtRGVidFBheW1lbnQobnVsbCxcJycgKyBkLmxlZGdlciArICdcJykiPisg4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4LiK4Liz4Lij4LiwPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJmb3JtRGVi',
  'dChudWxsLFwnJyArIGQubGVkZ2VyICsgJ1wnKSI+KyDguYDguJ7guLTguYjguKHguIHguYnguK3guJnguKvguJnguLXguYk8L2J1dHRvbj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJwbWV0YSIgc3R5bGU9Im1hcmdpbjowIDAgN3B4Ij48c3Bhbj7guITguKfg',
  'uLLguKHguITguLfguJrguKvguJnguYnguLLguIHguLLguKPguIrguLPguKPguLA8L3NwYW4+PHNwYW4+PGI+JyArIHBjdChkLnBlcmNlbnQpICsgJzwvYj48L3NwYW4+PC9kaXY+JyArCiAgICBwcm9ncmVzcyhkLnBlcmNlbnQsICdsZyAnICsgKGQucGVyY2VudCA+',
  'PSAxMDAgPyAnb2snIDogJycpKSArCiAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtdDE2Ij4nICsKICAgICAga3BpKCfguKLguK3guJTguKvguJnguLXguYnguJfguLHguYnguIfguKvguKHguJQnLCBiYWh0KGQudG90YWxEZWJ0KSwgZC5kZWJ0cy5sZW5ndGggKyAn',
  'IOC4geC5ieC4reC4meC4q+C4meC4teC5iScpICsKICAgICAga3BpKCfguIrguLPguKPguLDguYHguKXguYnguKcnLCBiYWh0KGQucGFpZCksIGQucGF5bWVudENvdW50ICsgJyDguKPguLLguKLguIHguLLguKPguYLguK3guJknLCAnZ29vZCcpICsKICAgICAga3Bp',
  'KCfguITguIfguYDguKvguKXguLfguK0nLCBiYWh0KGQucmVtYWluaW5nKSwgJ+C4reC4teC4gSAnICsgcGN0KDEwMCAtIGQucGVyY2VudCkgKyAnIOC4iOC4sOC4m+C4tOC4lOC4q+C4meC4teC5iScsICdiYWQnKSArCiAgICAgIGtwaSgn4LiK4Liz4Lij4Liw4LmD',
  '4LiZJyArIHllYXJMYWJlbCwgYmFodChkLnNlbGVjdGVkWWVhclBhaWQpLCBkLnNlbGVjdGVkWWVhckNvdW50ICsgJyDguKPguLLguKLguIHguLLguKMnICsKICAgICAgICAgIChkLnNlbGVjdGVkWWVhckludGVyZXN0ID8gJyDCtyDguJTguK3guIHguYDguJrguLXg',
  'uYnguKIgJyArIGJhaHQoZC5zZWxlY3RlZFllYXJJbnRlcmVzdCkgOiAnJykpICsKICAgICc8L2Rpdj48L2Rpdj48L2Rpdj4nOwoKICB2YXIgcGVyRGVidCA9IGQuZGVidHMubGVuZ3RoID8gJzxkaXYgY2xhc3M9ImdyaWQgZy1hdXRvIG1iMTIiPicgKyBkLmRlYnRz',
  'Lm1hcChmdW5jdGlvbih4KXsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0iY2FyZCI+PGRpdiBjbGFzcz0iY2FyZC1iIj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImNsaXAiIHN0eWxlPSJmb250LXdlaWdodDo2NTA7Zm9udC1zaXplOjEzLjVweDttaW4taGVpZ2h0OjM4',
  'cHgiPicgKyBlc2MoeC50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJyb3cgZnMxMiBtdXRlZCBtYjgiPicgKyBzdGF0dXNCYWRnZSh4LnN0YXR1cykgKwogICAgICAgICc8c3Bhbj4nICsgZXNjKHguY3JlZGl0b3IgfHwgJ+KAkycpICsgKHgu',
  'c3RhcnREYXRlID8gJyDCtyAnICsgdGhEYXRlKHguc3RhcnREYXRlKSA6ICcnKSArICc8L3NwYW4+PC9kaXY+JyArCiAgICAgICh4LnBhcmVudFRpdGxlCiAgICAgICAgPyAnPGRpdiBjbGFzcz0iYiBpbmZvIG1iOCIgdGl0bGU9IuC4ouC4reC4lOC4geC5ieC4reC4',
  'meC4meC4teC5ieC4reC4ouC4ueC5iOC5g+C4meC4geC5ieC4reC4meC5geC4oeC5iOC5geC4peC5ieC4pyDguIjguYjguLLguKLguITguLfguJnguIHguYnguK3guJnguJnguLXguYnguIHguYnguK3guJnguYHguKHguYjguIjguLDguKXguJTguJXguLLguKEiPicg',
  'KwogICAgICAgICAgJ+KGsyDguYDguJvguYfguJnguKrguYjguKfguJnguKvguJnguLbguYjguIfguILguK3guIcgJyArIGVzYyh4LnBhcmVudFRpdGxlKSArICc8L2Rpdj4nCiAgICAgICAgOiAnJykgKwogICAgICBwcm9ncmVzcyh4LnBlcmNlbnQpICsKICAgICAg',
  'JzxkaXYgY2xhc3M9InBtZXRhIj48c3Bhbj7guIrguLPguKPguLAgPGI+JyArIGJhaHQoeC5wYWlkKSArICc8L2I+PC9zcGFuPjxzcGFuPuC4hOC4h+C5gOC4q+C4peC4t+C4rSA8Yj4nICsgYmFodCh4LnJlbWFpbmluZykgKyAnPC9iPjwvc3Bhbj48L2Rpdj4nICsK',
  'ICAgICAgKHguY2hpbGRyZW4gJiYgeC5jaGlsZHJlbi5sZW5ndGgKICAgICAgICA/ICc8ZGl2IGNsYXNzPSJociIgc3R5bGU9Im1hcmdpbjoxMnB4IDAgMTBweCI+PC9kaXY+JyArCiAgICAgICAgICAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtYjgiPuC5g+C4meC4',
  'ouC4reC4lOC4meC4teC5ieC4oeC4teC4geC5ieC4reC4meC4ouC5iOC4reC4ouC4reC4ouC4ueC5iCAnICsgeC5jaGlsZHJlbi5sZW5ndGggKyAnIOC4geC5ieC4reC4mTwvZGl2PicgKwogICAgICAgICAgeC5jaGlsZHJlbi5tYXAoZnVuY3Rpb24oYyl7CiAgICAg',
  'ICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0ibWI4Ij4nICsKICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0icm93IGZzMTIiPjxzcGFuPuKGsyAnICsgZXNjKGMudGl0bGUpICsgJzwvc3Bhbj4nICsKICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9InNwIG1vbm8i',
  'PicgKyBtb25leShjLnBhaWQpICsgJyAvICcgKyBtb25leShjLnByaW5jaXBhbCkgKyAnPC9zcGFuPjwvZGl2PicgKwogICAgICAgICAgICAgIHByb2dyZXNzKGMucGVyY2VudCwgJ29rJykgKyAnPC9kaXY+JzsKICAgICAgICAgIH0pLmpvaW4oJycpICsKICAgICAg',
  'ICAgICh4LnBhaWRGcm9tQ2hpbGRyZW4gPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCI+4Lij4Lin4Lih4Lii4Lit4LiU4LiX4Li14LmI4Lih4Liy4LiI4Liy4LiB4LiB4LmJ4Lit4LiZ4Lii4LmI4Lit4LiiICcgKyBiYWh0KHgucGFpZEZyb21DaGlsZHJlbikgKyAn',
  'PC9kaXY+JyA6ICcnKQogICAgICAgIDogJycpICsKICAgICAgKHguaW50ZXJlc3RQZXJNb250aCA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIG10OCI+4LiU4Lit4LiB4LmA4Lia4Li14LmJ4LiiICcgKyBiYWh0KHguaW50ZXJlc3RQZXJNb250aCkgKyAnL+C5gOC4',
  'lOC4t+C4reC4mTwvZGl2PicgOiAnJykgKwogICAgICAoeC5wbGFuUGVyTW9udGggPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCI+4LmB4Lic4LiZ4Lic4LmI4Lit4LiZICcgKyBiYWh0KHgucGxhblBlck1vbnRoKSArICcv4LmA4LiU4Li34Lit4LiZPC9kaXY+JyA6',
  'ICcnKSArCiAgICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQxMiI+PGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPVwnZm9ybURlYnQoJyArIGF0dHIoeCkgKyAnLCInICsgZC5sZWRnZXIgKyAnIilcJz7guYHguIHguYnguYTguII8L2J1dHRvbj4nICsKICAgICAg',
  'JzxidXR0b24gY2xhc3M9ImJ0biBzbSBkZ3IiIG9uY2xpY2s9ImRlbERlYnQoXCcnICsgeC5pZCArICdcJykiPuC4peC4mjwvYnV0dG9uPjwvZGl2PicgKwogICAgJzwvZGl2PjwvZGl2Pic7CiAgfSkuam9pbignJykgKyAnPC9kaXY+JyA6ICcnOwoKICB2YXIgYnlZ',
  'ZWFyID0gZC5ieVllYXIubGVuZ3RoID8gY2FyZCgn8J+ThSDguKLguK3guJTguIrguLPguKPguLDguYHguKLguIHguJXguLLguKHguJvguLUnLAogICAgJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAnPHRoPuC4m+C4',
  'tTwvdGg+PHRoIGNsYXNzPSJudW0iPuC5gOC4h+C4tOC4meC4leC5ieC4mTwvdGg+PHRoIGNsYXNzPSJudW0iPuC4lOC4reC4geC5gOC4muC4teC5ieC4ojwvdGg+PHRoIGNsYXNzPSJudW0iPuC4o+C4p+C4oeC4l+C4teC5iOC5guC4reC4mTwvdGg+JyArCiAgICAn',
  'PHRoIGNsYXNzPSJudW0iPuC4iOC4s+C4meC4p+C4meC4hOC4o+C4seC5ieC4hzwvdGg+PHRoIGNsYXNzPSJudW0iPuC5gOC4h+C4tOC4meC4leC5ieC4meC4quC4sOC4quC4oTwvdGg+PHRoIHN0eWxlPSJ3aWR0aDoyNiUiPuC4hOC4p+C4suC4oeC4hOC4t+C4muC4',
  'q+C4meC5ieC4suC4quC4sOC4quC4oTwvdGg+JyArCiAgICAnPC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgIGQuYnlZZWFyLm1hcChmdW5jdGlvbih5KXsKICAgICAgdmFyIGN1bSA9IHkuY3VtdWxhdGl2ZSAhPSBudWxsID8geS5jdW11bGF0aXZlIDogMDsKICAg',
  'ICAgdmFyIHAgPSBkLnRvdGFsRGVidCA/IChjdW0gLyBkLnRvdGFsRGVidCAqIDEwMCkgOiAwOwogICAgICByZXR1cm4gJzx0ciBvbmNsaWNrPSJzZXRZZWFyRnJvbVRhYmxlKCcgKyB5LnllYXIgKyAnKSIgc3R5bGU9ImN1cnNvcjpwb2ludGVyIj4nICsKICAgICAg',
  'ICAnPHRkPjxiPicgKyB5LnllYXIgKyAnPC9iPiA8c3BhbiBjbGFzcz0iZmFpbnQgZnMxMiI+LyAnICsgKHkueWVhcis1NDMpICsgJzwvc3Bhbj48L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIG1vbmV5KHkucHJpbmNpcGFsKSArICc8L3RkPicg',
  'KwogICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArICh5LmludGVyZXN0ID8gbW9uZXkoeS5pbnRlcmVzdCkgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxiPicgKyBtb25leSh5LnByaW5jaXBhbCArIHkuaW50ZXJlc3QpICsg',
  'JzwvYj48L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIHkuY291bnQgKyAnPC90ZD4nICsKICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyBtb25leShjdW0pICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZD4nICsgcHJvZ3Jlc3MocCkgKyAnPC90',
  'ZD48L3RyPic7CiAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JywgJycsIHRydWUpIDogJyc7CgogIHZhciByb3dzID0gZC5wYXltZW50czsKICB2YXIgbGlzdCA9IGNhcmQoJ/Cfp74g4Lij4Liy4Lii4LiB4Liy4Lij4LmC4Lit4LiZ4LmD',
  '4LiK4LmJ4Lir4LiZ4Li14LmJIMK3ICcgKyB5ZWFyTGFiZWwgKyAnICgnICsgcm93cy5sZW5ndGggKyAnKScsCiAgICByb3dzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0Ij48dGhlYWQ+PHRyPicgKwogICAgICAnPHRoPuC4p+C4seC4',
  'meC4l+C4teC5iDwvdGg+PHRoPuC4h+C4p+C4lDwvdGg+PHRoIGNsYXNzPSJudW0iPuC5gOC4h+C4tOC4meC4leC5ieC4mTwvdGg+PHRoIGNsYXNzPSJudW0iPuC4lOC4reC4geC5gOC4muC4teC5ieC4ojwvdGg+JyArCiAgICAgICc8dGggY2xhc3M9Im51bSI+4Lij',
  '4Lin4Lih4LiX4Li14LmI4LmC4Lit4LiZPC90aD48dGg+4LiK4LmI4Lit4LiH4LiX4Liy4LiHPC90aD4nICsKICAgICAgJzx0aD7guKrguKXguLTguJs8L3RoPjx0aD7guKvguKHguLLguKLguYDguKvguJXguLg8L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJv',
  'ZHk+JyArCiAgICAgIHJvd3MubWFwKGZ1bmN0aW9uKHApewogICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIj4nICsgdGhEYXRlKHAucGF5RGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3Jh',
  'cCI+JyArIGVzYyhwLmluc3RhbGxtZW50IHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHAucHJpbmNpcGFsID8gJzxiIHN0eWxlPSJjb2xvcjp2YXIoLS1vaykiPicgKyBtb25leShwLnByaW5jaXBhbCkgKyAnPC9i',
  'PicgOiAnPHNwYW4gY2xhc3M9ImZhaW50Ij7igJM8L3NwYW4+JykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChwLmludGVyZXN0ID8gJzxiIHN0eWxlPSJjb2xvcjp2YXIoLS13YXJuKSI+JyArIG1vbmV5KHAuaW50ZXJlc3QpICsg',
  'JzwvYj4nIDogJzxzcGFuIGNsYXNzPSJmYWludCI+4oCTPC9zcGFuPicpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxiPicgKyBtb25leShwLmFtb3VudCkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4n',
  'ICsgZXNjKHAuY2hhbm5lbCB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwocC5zbGlwUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIgbXV0ZWQgY2xpcCI+JyArIGVzYyhwLm5vdGUgfHwg',
  'JycpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkPjxkaXYgY2xhc3M9InQtYWN0aW9ucyI+JyArCiAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1EZWJ0UGF5bWVudCgnICsgYXR0cihwKSArICcsIicgKyBkLmxl',
  'ZGdlciArICciKVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24gZGdyIiBvbmNsaWNrPSJkZWxEZWJ0UGF5bWVudChcJycgKyBwLmlkICsgJ1wnKSI+8J+XkTwvYnV0dG9uPicgKwogICAgICAgICAgJzwv',
  'ZGl2PjwvdGQ+PC90cj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgOiBlbXB0eUJveCgn4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4Lij4LiK4Liz4Lij4Liw4LmD4LiZJyArIHllYXJMYWJl',
  'bCwKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZm9ybURlYnRQYXltZW50KG51bGwsXCcnICsgZC5sZWRnZXIgKyAnXCcpIj4rIOC4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C4iuC4s+C4o+C4sDwvYnV0dG9uPicpLAogICAgJycs',
  'IHRydWUpOwoKICByZXR1cm4gaGVhZCArIHBlckRlYnQgKyBieVllYXIgKyAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIGxpc3QgKyAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gc2V0WWVhckZyb21UYWJsZSh5KXsKICBTLnllYXIgPSBTdHJpbmcoeSk7CiAgZG9jdW1lbnQu',
  'Z2V0RWxlbWVudEJ5SWQoJ3llYXJTZWwnKS52YWx1ZSA9IFMueWVhcjsKICBsb2FkKCk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICAzKSDguKPguLLguKLguIHguLLguKPguIvguLfg',
  'uYnguK3guILguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5wdXJjaGFzZXMgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsKICAgIHJldHVybiBQcm9taXNlLmFsbChbCiAg',
  'ICAgIGNhbGxBcGkoJ3B1cmNoYXNlLnN1bW1hcnknLCB7IHllYXI6IFMueWVhciB9KSwKICAgICAgY2FsbEFwaSgncHVyY2hhc2UubGlzdCcsIHsgeWVhcjogUy55ZWFyLCBjYXRlZ29yeTogUy5wYXJhbXMuY2F0ZWdvcnkgfHwgJycsIHE6IFMucGFyYW1zLnEgfHwg',
  'JycgfSkKICAgIF0pLnRoZW4oZnVuY3Rpb24ocil7IHZhciBkID0gclswXTsgZC5pdGVtcyA9IHJbMV07IHJldHVybiBkOyB9KTsKICB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgeWVhckxhYmVsID0gUy55ZWFyID09PSAnYWxsJyA/ICfguJfguLjg',
  'uIHguJvguLUnIDogJ+C4m+C4tSAnICsgUy55ZWFyOwogICAgdmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAga3BpKCfguKLguK3guJTguIvguLfguYnguK0gJyArIHllYXJMYWJlbCwgYmFodChkLnllYXJUb3RhbCksIGQueWVh',
  'ckNvdW50ICsgJyDguKPguLLguKLguIHguLLguKMnLCAnYWNjZW50JykgKwogICAgICBrcGkoJ+C4ouC4reC4lOC4quC4sOC4quC4oeC4l+C4seC5ieC4h+C4q+C4oeC4lCcsIGJhaHQoZC5ncmFuZFRvdGFsKSwgZC5ncmFuZENvdW50ICsgJyDguKPguLLguKLguIHg',
  'uLLguKMnKSArCiAgICAgIGtwaSgn4Lit4Lii4Li54LmI4LmD4LiZ4Lib4Lij4Liw4LiB4Lix4LiZJywgZC53YXJyYW50eS5hY3RpdmUgKyAnIOC4o+C4suC4ouC4geC4suC4oycsICfguYPguIHguKXguYnguKvguKHguJQgJyArIGQud2FycmFudHkuZXhwaXJpbmcs',
  'IGQud2FycmFudHkuZXhwaXJpbmcgPyAnd2FybicgOiAnZ29vZCcpICsKICAgICAga3BpKCfguKvguKHguKfguJTguJfguLXguYjguYPguIrguYnguIjguYjguLLguKLguKrguLnguIfguKrguLjguJQnLCBkLmJ5Q2F0ZWdvcnlbMF0gPyBkLmJ5Q2F0ZWdvcnlbMF0u',
  'Y2F0ZWdvcnkgOiAn4oCTJywKICAgICAgICAgIGQuYnlDYXRlZ29yeVswXSA/IGJhaHQoZC5ieUNhdGVnb3J5WzBdLnRvdGFsKSA6ICcnKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgY2hhcnRzID0gJzxkaXYgY2xhc3M9ImdyaWQgZzIgbWIxMiI+JyArCiAgICAg',
  'IGNhcmQoJ/Cfk4og4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4LmB4Lii4LiB4LiV4Liy4Lih4Lir4Lih4Lin4LiU4Lir4Lih4Li54LmIIMK3ICcgKyB5ZWFyTGFiZWwsCiAgICAgICAgYmFyQ2hhcnQoZC5ieUNhdGVnb3J5LCAnY2F0ZWdvcnknLCAndG90',
  'YWwnLCBmdW5jdGlvbihpKXsgcmV0dXJuIG1vbmV5KGkudG90YWwpICsgJyDguL8nOyB9KSkgKwogICAgICBjYXJkKCfwn5OFIOC4ouC4reC4lOC4i+C4t+C5ieC4reC5geC4ouC4geC4leC4suC4oeC4m+C4tScsCiAgICAgICAgYmFyQ2hhcnQoZC5ieVllYXIubWFw',
  'KGZ1bmN0aW9uKHkpeyByZXR1cm4geyBsYWJlbDogJ+C4m+C4tSAnICsgeS55ZWFyICsgJyAoJyArIHkuY291bnQgKyAnKScsIHRvdGFsOiB5LnRvdGFsLCB5ZWFyOiB5LnllYXIgfTsgfSksCiAgICAgICAgICAgICAgICAgJ2xhYmVsJywgJ3RvdGFsJywgZnVuY3Rp',
  'b24oaSl7IHJldHVybiBtb25leShpLnRvdGFsKSArICcg4Li/JzsgfSkpICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciBjYXRzID0gJzxkaXYgY2xhc3M9ImNoaXBzIG1iMTIiPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iY2hpcCAnICsgKCFTLnBhcmFtcy5jYXRl',
  'Z29yeT8nb24nOicnKSArICciIG9uY2xpY2s9InNldFBhcmFtKFwnY2F0ZWdvcnlcJyxcJ1wnKSI+4LiX4Li44LiB4Lir4Lih4Lin4LiUPC9idXR0b24+JyArCiAgICAgIGQuYnlDYXRlZ29yeS5tYXAoZnVuY3Rpb24oYyl7CiAgICAgICAgcmV0dXJuICc8YnV0dG9u',
  'IGNsYXNzPSJjaGlwICcgKyAoUy5wYXJhbXMuY2F0ZWdvcnk9PT1jLmNhdGVnb3J5Pydvbic6JycpICsgJyIgJyArCiAgICAgICAgICAgICAgICdvbmNsaWNrPSJzZXRQYXJhbShcJ2NhdGVnb3J5XCcsXCcnICsgZXNjKGMuY2F0ZWdvcnkpICsgJ1wnKSI+JyArIGVz',
  'YyhjLmNhdGVnb3J5KSArICcgKCcgKyBjLmNvdW50ICsgJyk8L2J1dHRvbj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwoKICAgIHZhciByb3dzID0gZC5pdGVtczsKICAgIHZhciB0YWJsZSA9IGNhcmQoJ/Cfm5Ig4Lij4Liy4Lii4LiB4Liy4Lij4LiL',
  '4Li34LmJ4Lit4LiC4Lit4LiHIMK3ICcgKyB5ZWFyTGFiZWwgKyAnICgnICsgcm93cy5sZW5ndGggKyAnKScsCiAgICAgIHJvd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiIHN0eWxlPSJtaW4td2lkdGg6OTgwcHgiPjx0aGVhZD48',
  'dHI+JyArCiAgICAgICAgJzx0aCBzdHlsZT0id2lkdGg6OTZweCI+4Lin4Lix4LiZ4LiX4Li14LmI4LiL4Li34LmJ4LitPC90aD48dGg+4Lij4Liy4Lii4LiB4Liy4Lij4Liq4Li04LiZ4LiE4LmJ4LiyPC90aD48dGggY2xhc3M9Im51bSI+4LiI4Liz4LiZ4Lin4LiZ',
  'PC90aD4nICsKICAgICAgICAnPHRoIGNsYXNzPSJudW0iPuC4o+C4suC4hOC4sjwvdGg+PHRoPuC5geC4q+C4peC5iOC4h+C4l+C4teC5iOC4i+C4t+C5ieC4rTwvdGg+PHRoPuC4m+C4o+C4sOC4geC4seC4mTwvdGg+PHRoPuC4oOC4suC4njwvdGg+PHRoPuC4quC4',
  'peC4tOC4mzwvdGg+PHRoPjwvdGg+JyArCiAgICAgICAgJzwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgcm93cy5tYXAoZnVuY3Rpb24ocCl7CiAgICAgICAgICB2YXIgdyA9IHAud2FycmFudHkgfHwge307CiAgICAgICAgICByZXR1cm4gJzx0cj4nICsK',
  'ICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyB0aERhdGUocC5idXlEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPjxkaXYgY2xhc3M9ImNsaXAiIHRpdGxlPSInICsgZXNjKHAuaXRlbSkgKyAnIj48Yj4nICsgZXNjKHAuaXRl',
  'bSkgKyAnPC9iPjwvZGl2PicgKwogICAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJmczEyIGZhaW50Ij4nICsgZXNjKHAuY2F0ZWdvcnkgfHwgJycpICsgKHAucm9vbSA/ICcgwrcg4Lir4LmJ4Lit4LiHICcgKyBlc2MocC5yb29tKSA6ICcnKSArCiAgICAgICAgICAg',
  'ICAgICAocC5vcmRlck5vID8gJyDCtyDguK3guK3guKPguYzguYDguJTguK3guKPguYwgJyArIGVzYyhwLm9yZGVyTm8pIDogJycpICsgJzwvZGl2PicgKwogICAgICAgICAgICAgIGJpbGxIdG1sKHApICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9',
  'Im51bSI+JyArIG51bShwLnF0eSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj48Yj4nICsgbW9uZXkocC5wcmljZSkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MocC52ZW5kb3IgfHwg',
  'J+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyAody5oYXMKICAgICAgICAgICAgICAgID8gc3RhdHVzQmFkZ2Uody5zdGF0ZSkgKyAnPGRpdiBjbGFzcz0iZmFpbnQiIHN0eWxlPSJmb250LXNpemU6MTFweCI+JyArIHRo',
  'RGF0ZVNob3J0KHcuZW5kKSArICc8L2Rpdj4nCiAgICAgICAgICAgICAgICA6ICc8c3BhbiBjbGFzcz0iZmFpbnQiPuKAkzwvc3Bhbj4nKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHAucGhvdG9SZWZzKSArICc8L3RkPicgKwog',
  'ICAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHAuc2xpcFJlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24iIG9uY2xpY2s9',
  'XCdmb3JtUHVyY2hhc2UoJyArIGF0dHIocCkgKyAnKVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiBkZ3IiIG9uY2xpY2s9ImRlbFB1cmNoYXNlKFwnJyArIHAuaWQgKyAnXCcpIj7wn5eRPC9idXR0',
  'b24+JyArCiAgICAgICAgICAgICc8L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6IGVtcHR5Qm94KCfguKLguLHguIfguYTguKHguYjguKHguLXguKPguLLguKLguIHguLLguKPguIvg',
  'uLfguYnguK3guYPguJknICsgeWVhckxhYmVsLCAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZm9ybVB1cmNoYXNlKG51bGwpIj4rIOC5gOC4nuC4tOC5iOC4oeC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4rTwvYnV0dG9uPicpLAogICAgICAn',
  'PGJ1dHRvbiBjbGFzcz0iYnRuIHByaSBzbSIgb25jbGljaz0iZm9ybVB1cmNoYXNlKG51bGwpIj4rIOC5gOC4nuC4tOC5iOC4oeC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4rTwvYnV0dG9uPicsIHRydWUpOwoKICAgIHJldHVybiBoZWFkICsgY2hhcnRzICsg',
  'Y2F0cyArIHRhYmxlOwogIH0KfTsKCi8qKgogKiDguJrguLTguKXguJfguLXguYjguKHguLXguILguK3guIfguKvguKXguLLguKLguK3guKLguYjguLLguIcg4oCUIOC5geC4quC4lOC4h+C5gOC4m+C5h+C4meC4m+C4uOC5iOC4oeC4geC4suC4h+C4lOC4uSDguYTg',
  'uKHguYjguYPguKvguYnguJXguLLguKPguLLguIfguKLguLLguKfguYDguIHguLTguJnguYTguJsKICog4Lia4Li04Lil4LiX4Li14LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4Lij4LmA4LiU4Li14Lii4Lin4Lir4Lij4Li34Lit4LmE4Lih4LmI4Lih4Li14Lij4Liy',
  '4Lii4LiB4Liy4Lij4Lii4LmI4Lit4Lii4LmA4Lil4LiiIOC5hOC4oeC5iOC4leC5ieC4reC4h+C5geC4quC4lOC4h+C4reC4sOC5hOC4o+C5gOC4nuC4tOC5iOC4oQogKi8KZnVuY3Rpb24gYmlsbEh0bWwocCl7CiAgdmFyIGIgPSBwLmJpbGw7CiAgaWYgKCFiIHx8',
  'IGIuY291bnQgPCAyKSByZXR1cm4gJyc7CiAgdmFyIGlkID0gJ2JpbGxfJyArIHAuaWQ7CiAgcmV0dXJuICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJpbGwtdG9nZ2xlIiBvbmNsaWNrPSJ0b2dnbGVCaWxsKFwnJyArIGlkICsgJ1wnKSI+JyArCiAgICAg',
  'ICfwn6e+ICcgKyBiLmNvdW50ICsgJyDguKPguLLguKLguIHguLLguKPguYPguJnguJrguLTguKUg4pa+PC9idXR0b24+JyArCiAgICAnPGRpdiBjbGFzcz0iYmlsbC1saW5lcyIgaWQ9IicgKyBpZCArICciIGhpZGRlbj4nICsKICAgICAgYi5saW5lcy5tYXAoZnVu',
  'Y3Rpb24obCl7CiAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJiaWxsLWxpbmUiPicgKwogICAgICAgICAgJzxzcGFuIGNsYXNzPSJubSIgdGl0bGU9IicgKyBlc2MobC5uYW1lKSArICciPicgKyBlc2MobC5uYW1lKSArICc8L3NwYW4+JyArCiAgICAgICAgICAn',
  'PHNwYW4gY2xhc3M9InF0Ij4nICsgbnVtKGwucXR5KSArIChsLnVuaXQgPyAnICcgKyBlc2MobC51bml0KSA6ICcnKSArICcgw5cgJyArIG1vbmV5KGwudW5pdFByaWNlLCAyKSArICc8L3NwYW4+JyArCiAgICAgICAgICAnPHNwYW4gY2xhc3M9InR0Ij4nICsgbW9u',
  'ZXkobC50b3RhbCwgMikgKyAnPC9zcGFuPjwvZGl2Pic7CiAgICAgIH0pLmpvaW4oJycpICsKICAgICAgKChiLnNoaXBwaW5nIHx8IGIuZGlzY291bnQpCiAgICAgICAgPyAnPGRpdiBjbGFzcz0iYmlsbC1leHRyYSI+JyArCiAgICAgICAgICAgIChiLnNoaXBwaW5n',
  'ID8gJ+C4hOC5iOC4suC4quC5iOC4hyAnICsgbW9uZXkoYi5zaGlwcGluZywgMikgOiAnJykgKwogICAgICAgICAgICAoYi5zaGlwcGluZyAmJiBiLmRpc2NvdW50ID8gJyDCtyAnIDogJycpICsKICAgICAgICAgICAgKGIuZGlzY291bnQgPyAn4Liq4LmI4Lin4LiZ',
  '4Lil4LiUIOKIkicgKyBtb25leShiLmRpc2NvdW50LCAyKSA6ICcnKSArICc8L2Rpdj4nCiAgICAgICAgOiAnJykgKwogICAgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIHRvZ2dsZUJpbGwoaWQpewogIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTsK',
  'ICBpZiAoIWVsKSByZXR1cm47CiAgZWwuaGlkZGVuID0gIWVsLmhpZGRlbjsKICB2YXIgYnRuID0gZWwucHJldmlvdXNFbGVtZW50U2libGluZzsKICBpZiAoYnRuKSBidG4udGV4dENvbnRlbnQgPSBidG4udGV4dENvbnRlbnQucmVwbGFjZShlbC5oaWRkZW4gPyAn',
  '4pa0JyA6ICfilr4nLCBlbC5oaWRkZW4gPyAn4pa+JyA6ICfilrQnKTsKfQoKZnVuY3Rpb24gc2V0UGFyYW0oa2V5LCB2YWwpewogIFMucGFyYW1zW2tleV0gPSB2YWw7CiAgbG9hZCgpOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT0KICAgNCkg4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMuYWMgPSB7CiAgbG9hZDogZnVuY3Rp',
  'b24oKXsgcmV0dXJuIGNhbGxBcGkoJ2FjLm1hdHJpeCcsIHsgeWVhcjogUy55ZWFyIH0pOyB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgeWVhckxhYmVsID0gUy55ZWFyID09PSAnYWxsJyA/ICfguJfguLjguIHguJvguLUnIDogJ+C4m+C4tSAnICsg',
  'Uy55ZWFyOwogICAgdmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAga3BpKCfguKXguYnguLLguIfguYHguKXguYnguKcgJyArIHllYXJMYWJlbCwgZC5yb29tc0RvbmVJblllYXIgKyAnLycgKyBkLnJvb21zLmxlbmd0aCArICcg',
  '4Lir4LmJ4Lit4LiHJywgZC5kb25lSW5ZZWFyICsgJyDguKPguK3guJrguJfguLHguYnguIfguKvguKHguJQnLCAnYWNjZW50JykgKwogICAgICBrcGkoJ+C4ouC4seC4h+C5hOC4oeC5iOC5hOC4lOC5ieC4peC5ieC4suC4hycsIGQucm9vbXNQZW5kaW5nLmxlbmd0',
  'aCArICcg4Lir4LmJ4Lit4LiHJywgZC5yb29tc1BlbmRpbmcuc2xpY2UoMCw4KS5qb2luKCcsICcpICsgKGQucm9vbXNQZW5kaW5nLmxlbmd0aD44PyfigKYnOicnKSwgZC5yb29tc1BlbmRpbmcubGVuZ3RoID8gJ3dhcm4nOidnb29kJykgKwogICAgICBrcGkoJ+C4',
  'luC4tuC4h+C4geC4s+C4q+C4meC4lOC4peC5ieC4suC4hycsIGQub3ZlcmR1ZS5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsICfguKPguK3guJrguKXguYnguLLguIfguJfguLjguIEgJyArIGQuY3ljbGVNb250aHMgKyAnIOC5gOC4lOC4t+C4reC4mScsIGQub3Zl',
  'cmR1ZS5sZW5ndGggPyAnYmFkJzonZ29vZCcpICsKICAgICAga3BpKCfguITguKfguLLguKHguITguLfguJrguKvguJnguYnguLInLCBwY3QoZC5yb29tcy5sZW5ndGggPyBkLnJvb21zRG9uZUluWWVhci9kLnJvb21zLmxlbmd0aCoxMDAgOiAwKSwgJ+C4guC4reC4',
  'h+C4l+C4seC5ieC4h+C4q+C4oeC4lCAnICsgZC5yb29tcy5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycpICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciBhY3Rpb25zID0gJzxkaXYgY2xhc3M9InJvdyBtYjEyIj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBw',
  'cmkiIG9uY2xpY2s9ImZvcm1BYyhudWxsKSI+KyDguJrguLHguJnguJfguLbguIHguIHguLLguKPguKXguYnguLLguIfguYHguK3guKPguYw8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iZm9ybUJ1bGtBYygpIj7wn5OFIOC4',
  'meC4seC4lOC4peC5ieC4suC4h+C4q+C4peC4suC4ouC4q+C5ieC4reC4h+C4nuC4o+C5ieC4reC4oeC4geC4seC4mTwvYnV0dG9uPicgKwogICAgICAnPHNwYW4gY2xhc3M9InNwIj48L3NwYW4+JyArCiAgICAgICc8c3BhbiBjbGFzcz0iZnMxMiBtdXRlZCI+4LiE',
  '4Lil4Li04LiB4LiX4Li14LmI4Lir4LmJ4Lit4LiH4LmA4Lie4Li34LmI4Lit4LiU4Li5L+C5gOC4nuC4tOC5iOC4oeC4o+C4reC4muC4geC4suC4o+C4peC5ieC4suC4hzwvc3Bhbj4nICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciBncmlkID0gY2FyZCgn4p2E77iP',
  'IOC4leC4suC4o+C4suC4h+C4peC5ieC4suC4h+C5geC4reC4o+C5jOC4o+C4suC4ouC4q+C5ieC4reC4hyDCtyAnICsgeWVhckxhYmVsLCByb29tRmxvb3JzKGQucm9vbXMsIGZ1bmN0aW9uKHIpewogICAgICB2YXIgY2xzID0gci5yb3VuZHNJblllYXIgPiAwID8g',
  'J3Mtb2snIDogKHIuc3RhdGUgPT09ICfguYDguIHguLTguJnguIHguLPguKvguJnguJQnID8gJ3MtZGdyJyA6IChyLnN0YXRlID09PSAn4Lii4Lix4LiH4LmE4Lih4LmI4LmA4LiE4Lii4Lil4LmJ4Liy4LiHJyA/ICdzLXdhcm4nIDogJ3MtaW5mbycpKTsKICAgICAg',
  'dmFyIHN1YiA9IHIucm91bmRzSW5ZZWFyID4gMAogICAgICAgID8gJzxiPicgKyByLnJvdW5kc0luWWVhciArICcg4Lij4Lit4LiaPC9iPjxicj4nICsgdGhEYXRlU2hvcnQoci5yZWNvcmRzLmZpbHRlcihmdW5jdGlvbih4KXtyZXR1cm4geC5zZXJ2aWNlRGF0ZTt9',
  'KS5tYXAoZnVuY3Rpb24oeCl7cmV0dXJuIHguc2VydmljZURhdGU7fSkuc29ydCgpLnBvcCgpKQogICAgICAgIDogKHIuYm9va2VkSW5ZZWFyID8gJ+C4meC4seC4lOC5geC4peC5ieC4pyAnICsgci5ib29rZWRJblllYXIgOiAoci5sYXN0U2VydmljZSA/ICfguKXg',
  'uYjguLLguKrguLjguJQgJyArIHRoRGF0ZVNob3J0KHIubGFzdFNlcnZpY2UpIDogJ+C5hOC4oeC5iOC4oeC4teC4m+C4o+C4sOC4p+C4seC4leC4tCcpKTsKICAgICAgcmV0dXJuIHsgY2xzOiBjbHMsIHN1Yjogc3ViLCBvbmNsaWNrOiAnb3BlbkFjUm9vbShcJycg',
  'KyByLnJvb20gKyAnXCcpJyB9OwogICAgfSksICcnLCBmYWxzZSk7CgogICAgdmFyIGxpc3RSb3dzID0gW107CiAgICBkLnJvb21zLmZvckVhY2goZnVuY3Rpb24ocil7IHIucmVjb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uKHgpeyB4Ll9yb29tID0gci5yb29tOyBsaXN0',
  'Um93cy5wdXNoKHgpOyB9KTsgfSk7CiAgICBsaXN0Um93cy5zb3J0KGZ1bmN0aW9uKGEsYil7IHJldHVybiBTdHJpbmcoYi5zZXJ2aWNlRGF0ZXx8Yi5ib29rRGF0ZXx8JycpLmxvY2FsZUNvbXBhcmUoU3RyaW5nKGEuc2VydmljZURhdGV8fGEuYm9va0RhdGV8fCcn',
  'KSk7IH0pOwoKICAgIHZhciBsaXN0ID0gY2FyZCgn8J+TiyDguJvguKPguLDguKfguLHguJXguLTguIHguLLguKPguKXguYnguLLguIfguYHguK3guKPguYwgwrcgJyArIHllYXJMYWJlbCArICcgKCcgKyBsaXN0Um93cy5sZW5ndGggKyAnKScsCiAgICAgIGxpc3RS',
  'b3dzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0Ij48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4Lir4LmJ4Lit4LiHPC90aD48dGg+4Lij4Lit4Lia4LiX4Li14LmIPC90aD48dGg+4Lin4Lix4LiZ4LiX4Li14LmI4LiZ4Lix4LiU',
  'PC90aD48dGg+4Lin4Lix4LiZ4LiX4Li14LmI4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4LijPC90aD48dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD4nICsKICAgICAgICAnPHRoPuC4iuC5iOC4suC4hzwvdGg+PHRoIGNsYXNzPSJudW0iPuC4hOC5iOC4suC5g+C4iuC5',
  'ieC4iOC5iOC4suC4ojwvdGg+PHRoPuC4oOC4suC4njwvdGg+PHRoPuC4q+C4oeC4suC4ouC5gOC4q+C4leC4uDwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICBsaXN0Um93cy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgICAgICByZXR1',
  'cm4gJzx0cj4nICsKICAgICAgICAgICAgJzx0ZD48Yj4nICsgZXNjKHgucm9vbSkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArICh4LnJvdW5kIHx8IDEpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5v',
  'd3JhcCBmczEyIj4nICsgdGhEYXRlKHguYm9va0RhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHguc2VydmljZURhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHN0YXR1c0Jh',
  'ZGdlKHguc3RhdHVzKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKHgudGVjaG5pY2lhbiB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbnVtKHguY29zdCkgKyAnPC90',
  'ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCh4LnBob3RvUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiBtdXRlZCBjbGlwIj4nICsgZXNjKHgubm90ZSB8fCAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICAg',
  'Jzx0ZD48ZGl2IGNsYXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1BYygnICsgYXR0cih4KSArICcpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAgICAgJzxidXR0',
  'b24gY2xhc3M9ImJ0biBzbSBpY29uIGRnciIgb25jbGljaz0iZGVsQWMoXCcnICsgeC5pZCArICdcJykiPvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICAgJzwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48',
  'L2Rpdj4nCiAgICAgIDogZW1wdHlCb3goJ+C4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C4peC5ieC4suC4h+C5geC4reC4o+C5jOC5g+C4mScgKyB5ZWFyTGFiZWwpLCAnJywgdHJ1ZSk7CgogICAgcmV0dXJuIGhlYWQg',
  'KyBhY3Rpb25zICsgZ3JpZCArICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgbGlzdCArICc8L2Rpdj4nOwogIH0KfTsKCmZ1bmN0aW9uIG9wZW5BY1Jvb20ocm9vbSl7CiAgdmFyIGQgPSBTLmNhY2hlLmFjOwogIHZhciByID0gZC5yb29tcy5maWx0ZXIoZnVuY3Rpb24o',
  'eCl7IHJldHVybiB4LnJvb20gPT09IHJvb207IH0pWzBdOwogIHZhciBib2R5ID0KICAgICc8ZGl2IGNsYXNzPSJncmlkIGczIG1iMTIiPicgKwogICAgICBrcGkoJ+C4o+C4reC4muC4l+C4teC5iOC4peC5ieC4suC4h+C5g+C4meC4m+C4teC4meC4teC5iScsIChy',
  'LnJvdW5kc0luWWVhcnx8MCkgKyAnIOC4o+C4reC4micsICcnKSArCiAgICAgIGtwaSgn4Lil4LmJ4Liy4LiH4Lil4LmI4Liy4Liq4Li44LiUJywgci5sYXN0U2VydmljZSA/IHRoRGF0ZShyLmxhc3RTZXJ2aWNlKSA6ICfigJMnLCByLmxhc3RTZXJ2aWNlID8gKGRh',
  'eXNBZ28oci5sYXN0U2VydmljZSkgKyAnIOC4p+C4seC4meC4l+C4teC5iOC5geC4peC5ieC4pycpIDogJycpICsKICAgICAga3BpKCfguITguKPguJrguIHguLPguKvguJnguJTguKPguK3guJrguJbguLHguJTguYTguJsnLCByLm5leHREdWUgPyB0aERhdGUoci5u',
  'ZXh0RHVlKSA6ICfigJMnLCByLnN0YXRlLCByLnN0YXRlID09PSAn4LmA4LiB4Li04LiZ4LiB4Liz4Lir4LiZ4LiUJyA/ICdiYWQnIDogJycpICsKICAgICc8L2Rpdj4nICsKICAgIChyLnJlY29yZHMubGVuZ3RoCiAgICAgID8gJzxkaXYgY2xhc3M9InR3Ij48dGFi',
  'bGUgY2xhc3M9InQiIHN0eWxlPSJtaW4td2lkdGg6YXV0byI+PHRoZWFkPjx0cj48dGg+4Lij4Lit4LiaPC90aD48dGg+4LiZ4Lix4LiUPC90aD48dGg+4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4LijPC90aD48dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD48dGg+4Lig',
  '4Liy4LiePC90aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIHIucmVjb3Jkcy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgICAgICByZXR1cm4gJzx0cj48dGQ+JyArICh4LnJvdW5kfHwxKSArICc8L3RkPjx0ZCBjbGFzcz0iZnMxMiI+JyAr',
  'IHRoRGF0ZSh4LmJvb2tEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgdGhEYXRlKHguc2VydmljZURhdGUpICsgJzwvdGQ+PHRkPicgKyBzdGF0dXNCYWRnZSh4LnN0YXR1cykgKyAnPC90ZD4nICsKICAgICAgICAgICAg',
  'Jzx0ZD4nICsgdGh1bWJzSHRtbCh4LnBob3RvUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9XCdjbG9zZU1vZGFsKCk7Zm9ybUFjKCcgKyBhdHRyKHgpICsgJylcJz7guYHguIHguYnguYTguII8',
  'L2J1dHRvbj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lia4Lix4LiZ4LiX4Li24LiB4LmD4LiZ4Lib4Li1',
  '4LiX4Li14LmI4LmA4Lil4Li34Lit4LiBPC9kaXY+Jyk7CgogIG9wZW5Nb2RhbCgn4p2E77iPIOC4peC5ieC4suC4h+C5geC4reC4o+C5jCDCtyDguKvguYnguK3guIcgJyArIHJvb20sIGJvZHksCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9z',
  'ZU1vZGFsKCkiPuC4m+C4tOC4lDwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtmb3JtQWMoe3Jvb206XCcnICsgcm9vbSArICdcJ30pIj4rIOC5gOC4nuC4tOC5iOC4oeC4o+C4reC4muC4geC4suC4',
  'o+C4peC5ieC4suC4hzwvYnV0dG9uPicpOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgNSkg4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Liy4Lih4Lir4LmJ4Lit4LiHCiAgID09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMucmVwYWlycyA9IHsKICBsb2FkOiBmdW5jdGlvbigpeyByZXR1cm4gY2FsbEFwaSgncmVwYWlyLm1hdHJpeCcsIHsgeWVhcjogUy55ZWFyIH0pOyB9',
  'LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgeWVhckxhYmVsID0gUy55ZWFyID09PSAnYWxsJyA/ICfguJfguLjguIHguJvguLUnIDogJ+C4m+C4tSAnICsgUy55ZWFyOwogICAgdmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsK',
  'ICAgICAga3BpKCfguIfguLLguJnguIvguYjguK3guKEgJyArIHllYXJMYWJlbCwgZC50b3RhbEpvYnMgKyAnIOC4h+C4suC4mScsICfguIjguLLguIEgJyArIGQucm9vbXMuZmlsdGVyKGZ1bmN0aW9uKHIpe3JldHVybiByLmNvdW50PjA7fSkubGVuZ3RoICsgJyDg',
  'uKvguYnguK3guIcnLCAnYWNjZW50JykgKwogICAgICBrcGkoJ+C4h+C4suC4meC4l+C4teC5iOC4ouC4seC4h+C5hOC4oeC5iOC5gOC4quC4o+C5h+C4iCcsIGQub3BlbkpvYnMgKyAnIOC4h+C4suC4mScsIGQub3BlblRhc2tzID8gJ+C4hOC5ieC4suC4h+C4reC4',
  'ouC4ueC5iCAnICsgZC5vcGVuVGFza3MgKyAnIOC4iOC4uOC4lCcgOiAnJywgZC5vcGVuSm9icyA/ICd3YXJuJyA6ICdnb29kJykgKwogICAgICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC4o+C4p+C4oScsIGJhaHQoZC50b3RhbENvc3QpLCB5',
  'ZWFyTGFiZWwpICsKICAgICAga3BpKCfguKvguYnguK3guIfguJfguLXguYjguKLguLHguIfguYTguKHguYjguYDguITguKLguIvguYjguK3guKEnLCBkLnJvb21zLmZpbHRlcihmdW5jdGlvbihyKXtyZXR1cm4gci5jb3VudD09PTA7fSkubGVuZ3RoICsgJyDguKvg',
  'uYnguK3guIcnLCAn4LmD4LiZJyArIHllYXJMYWJlbCkgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIGFjdGlvbnMgPSAnPGRpdiBjbGFzcz0icm93IG1iMTIiPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZm9ybVJlcGFpcihudWxs',
  'KSI+KyDguYHguIjguYnguIfguIvguYjguK3guKEgLyDguJrguLHguJnguJfguLbguIHguIfguLLguJnguIvguYjguK3guKE8L2J1dHRvbj4nICsKICAgICAgJzxzcGFuIGNsYXNzPSJzcCI+PC9zcGFuPjxzcGFuIGNsYXNzPSJmczEyIG11dGVkIj7guITguKXguLTg',
  'uIHguJfguLXguYjguKvguYnguK3guIfguYDguJ7guLfguYjguK3guJTguLnguJvguKPguLDguKfguLHguJXguLTguIfguLLguJnguIvguYjguK3guKHguILguK3guIfguKvguYnguK3guIfguJnguLHguYnguJk8L3NwYW4+PC9kaXY+JzsKCiAgICB2YXIgZ3JpZCA9',
  'IGNhcmQoJ/CflKcg4Lig4Liy4Lie4Lij4Lin4Lih4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4Lij4Liy4Lii4Lir4LmJ4Lit4LiHIMK3ICcgKyB5ZWFyTGFiZWwsIHJvb21GbG9vcnMoZC5yb29tcywgZnVuY3Rpb24ocil7CiAgICAgIHZhciBjbHMgPSByLm9wZW5Db3Vu',
  'dCA+IDAgPyAncy1kZ3InIDogKHIuY291bnQgPiAwID8gJ3Mtb2snIDogJ3MtaW5mbycpOwogICAgICB2YXIgc3ViID0gci5jb3VudCA+IDAKICAgICAgICA/ICc8Yj4nICsgci5jb3VudCArICcg4LiH4Liy4LiZPC9iPicgKyAoci5vcGVuQ291bnQgPyAnIMK3IOC4',
  'hOC5ieC4suC4hyAnICsgKHIub3BlblRhc2tzIHx8IHIub3BlbkNvdW50KSArICcg4LiI4Li44LiUJyA6ICcnKSArICc8YnI+JyArIChyLmxhc3QgPyB0aERhdGVTaG9ydChyLmxhc3QpIDogJycpCiAgICAgICAgOiAn4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ4LiL',
  '4LmI4Lit4LihJzsKICAgICAgcmV0dXJuIHsgY2xzOiBjbHMsIHN1Yjogc3ViLCBvbmNsaWNrOiAnb3BlblJlcGFpclJvb20oXCcnICsgci5yb29tICsgJ1wnKScgfTsKICAgIH0pKTsKCiAgICB2YXIgcm93cyA9IFtdOwogICAgZC5yb29tcy5mb3JFYWNoKGZ1bmN0',
  'aW9uKHIpeyByLnJlY29yZHMuZm9yRWFjaChmdW5jdGlvbih4KXsgcm93cy5wdXNoKHgpOyB9KTsgfSk7CiAgICByb3dzLnNvcnQoZnVuY3Rpb24oYSxiKXsgcmV0dXJuIFN0cmluZyhiLnJlcGFpckRhdGV8fGIuYm9va0RhdGV8fCcnKS5sb2NhbGVDb21wYXJlKFN0',
  'cmluZyhhLnJlcGFpckRhdGV8fGEuYm9va0RhdGV8fCcnKSk7IH0pOwoKICAgIHZhciBsaXN0ID0gY2FyZCgn8J+TiyDguKPguLLguKLguIHguLLguKPguIfguLLguJnguIvguYjguK3guKEgwrcgJyArIHllYXJMYWJlbCArICcgKCcgKyByb3dzLmxlbmd0aCArICcp',
  'JywKICAgICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDoxMDIwcHgiPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guKvguYnguK3guIc8L3RoPjx0aD7guKfguLHguJnguJnguLHguJTg',
  'uIvguYjguK3guKE8L3RoPjx0aD7guKfguLHguJnguYDguILguYnguLLguIvguYjguK3guKE8L3RoPjx0aD7guJvguKPguLDguYDguKDguJc8L3RoPjx0aD7guKPguLLguKLguIHguLLguKPguJfguLXguYjguIvguYjguK3guKHguYHguIvguKE8L3RoPicgKwogICAg',
  'ICAgICc8dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD48dGggY2xhc3M9Im51bSI+4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiPC90aD48dGg+4LiB4LmI4Lit4LiZPC90aD48dGg+4Lir4Lil4Lix4LiHPC90aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5',
  'PicgKwogICAgICAgIHJvd3MubWFwKGZ1bmN0aW9uKHgpewogICAgICAgICAgcmV0dXJuICc8dHI+JyArCiAgICAgICAgICAgICc8dGQ+PGI+JyArIGVzYyh4LnJvb20pICsgJzwvYj48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+',
  'JyArIHRoRGF0ZSh4LmJvb2tEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LnJlcGFpckRhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MoeC5j',
  'YXRlZ29yeSB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBzdHlsZT0ibWluLXdpZHRoOjI4MHB4Ij4nICsgdG9kb0xpc3RIdG1sKHgpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHN0YXR1c0JhZGdlKHguc3RhdHVzKSArICh4',
  'LnByaW9yaXR5ICYmIHgucHJpb3JpdHkgIT09ICfguJvguIHguJXguLQnID8gJyAnICsgc3RhdHVzQmFkZ2UoeC5wcmlvcml0eSkgOiAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbnVtKHguY29zdCkgKyAnPC90ZD4nICsK',
  'ICAgICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCh4LmJlZm9yZVJlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwoeC5hZnRlclJlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rp',
  'b25zIj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24iIG9uY2xpY2s9XCdmb3JtUmVwYWlyKCcgKyBhdHRyKHgpICsgJylcJz7inI/vuI88L2J1dHRvbj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGlj',
  'b24gZGdyIiBvbmNsaWNrPSJkZWxSZXBhaXIoXCcnICsgeC5pZCArICdcJykiPvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICAgJzwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nCiAgICAgIDog',
  'ZW1wdHlCb3goJ+C4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4i+C5iOC4reC4oeC5g+C4mScgKyB5ZWFyTGFiZWwsICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtUmVwYWlyKG51bGwpIj4rIOC5geC4iOC5ieC4h+C4i+C5iOC4',
  'reC4oTwvYnV0dG9uPicpLCAnJywgdHJ1ZSk7CgogICAgcmV0dXJuIGhlYWQgKyBhY3Rpb25zICsgZ3JpZCArICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgbGlzdCArICc8L2Rpdj4nOwogIH0KfTsKCi8qKgogKiDguYDguIrguYfguITguKXguLTguKrguJXguYzguJfg',
  'uLXguYjguJXguLTguYrguIHguYTguJTguYnguIjguKPguLTguIfguIjguLLguIHguKvguJnguYnguLLguKPguLLguKLguIHguLLguKMg4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LmA4Lib4Li04LiU4Lif4Lit4Lij4LmM4LihCiAqIOC4leC4tOC5iuC4geC4m+C4uOC5',
  'iuC4muC4muC4seC4meC4l+C4tuC4geC4guC4tuC5ieC4meC4iuC4teC4leC4l+C4seC4meC4l+C4tSDguYHguKXguLDguJbguYnguLLguJXguLTguYrguIHguITguKPguJrguJfguLjguIHguILguYnguK0g4Liq4LiW4Liy4LiZ4Liw4LiI4Liw4LmA4Lib4Lil4Li1',
  '4LmI4Lii4LiZ4LmA4Lib4LmH4LiZICLguYDguKrguKPguYfguIjguKrguLTguYnguJkiIOC5g+C4q+C5ieC5gOC4reC4hwogKi8KZnVuY3Rpb24gdG9kb0xpc3RIdG1sKHgpewogIHZhciB0b2RvID0geC50b2RvIHx8IFtdOwogIGlmICghdG9kby5sZW5ndGgpIHJl',
  'dHVybiAnPHNwYW4gY2xhc3M9ImZzMTMgbXV0ZWQiPicgKyBlc2MoeC5pdGVtcyB8fCAn4oCTJykgKyAnPC9zcGFuPic7CgogIHZhciBwID0geC5wcm9ncmVzcyB8fCB7IGRvbmU6IDAsIHRvdGFsOiB0b2RvLmxlbmd0aCwgcGVyY2VudDogMCB9OwogIHZhciBsb2Nr',
  'ZWQgPSAhY2FuRWRpdCgpOwoKICByZXR1cm4gJzxkaXYgY2xhc3M9InRvZG8tdmlldyI+JyArCiAgICAnPGRpdiBjbGFzcz0idG9kby1iYXIiPjxpIHN0eWxlPSJ3aWR0aDonICsgcC5wZXJjZW50ICsgJyUiPjwvaT48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJ0',
  'b2RvLW1ldGEiPuC5gOC4quC4o+C5h+C4iOC5geC4peC5ieC4pyA8Yj4nICsgcC5kb25lICsgJy8nICsgcC50b3RhbCArICc8L2I+IOC4h+C4suC4mTwvZGl2PicgKwogICAgdG9kby5tYXAoZnVuY3Rpb24odCwgaSl7CiAgICAgIHJldHVybiAnPGxhYmVsIGNsYXNz',
  'PSJ0b2RvLWxpbmUnICsgKHQuZG9uZSA/ICcgZG9uZScgOiAnJykgKyAobG9ja2VkID8gJyBsb2NrZWQnIDogJycpICsgJyI+JyArCiAgICAgICAgJzxpbnB1dCB0eXBlPSJjaGVja2JveCInICsgKHQuZG9uZSA/ICcgY2hlY2tlZCcgOiAnJykgKyAobG9ja2VkID8g',
  'JyBkaXNhYmxlZCcgOiAnJykgKwogICAgICAgICAgJyBvbmNoYW5nZT0idG9nZ2xlVG9kbyhcJycgKyBlc2MoeC5pZCkgKyAnXCcsJyArIGkgKyAnLHRoaXMuY2hlY2tlZCx0aGlzKSI+JyArCiAgICAgICAgJzxzcGFuIGNsYXNzPSJubSI+JyArIGVzYyh0Lm5hbWUp',
  'ICsgJzwvc3Bhbj4nICsKICAgICAgICAodC5jYXRlZ29yeSA/ICc8c3BhbiBjbGFzcz0iYiBtdXRlIGNhdCI+JyArIGVzYyh0LmNhdGVnb3J5KSArICc8L3NwYW4+JyA6ICcnKSArCiAgICAgICc8L2xhYmVsPic7CiAgICB9KS5qb2luKCcnKSArCiAgJzwvZGl2Pic7',
  'Cn0KCi8qKgogKiDguJXguLTguYrguIHguIfguLLguJnguKvguJnguLbguYjguIfguILguYnguK0g4oCUIOC4reC4seC4m+C5gOC4lOC4leC4q+C4meC5ieC4suC4iOC4reC4l+C4seC4meC4l+C4teC5geC4peC5ieC4p+C4hOC5iOC4reC4ouC4muC4seC4meC4l+C4',
  'tuC4gQogKiDguJbguYnguLLguJrguLHguJnguJfguLbguIHguYTguKHguYjguJzguYjguLLguJkg4LmD4Lir4LmJ4LiV4Li04LmK4LiB4LiB4Lil4Lix4Lia4LmE4Lib4LmA4Lib4LmH4LiZ4LmA4Lir4Lih4Li34Lit4LiZ4LmA4LiU4Li04LihIOC4iOC4sOC5hOC4',
  'lOC5ieC5hOC4oeC5iOC5gOC4guC5ieC4suC5g+C4iOC4nOC4tOC4lOC4p+C5iOC4suC4muC4seC4meC4l+C4tuC4geC5geC4peC5ieC4pwogKi8KZnVuY3Rpb24gdG9nZ2xlVG9kbyhpZCwgaW5kZXgsIGRvbmUsIGJveCl7CiAgdmFyIGxpbmUgPSBib3guY2xvc2Vz',
  'dCgnLnRvZG8tbGluZScpOwogIGlmIChsaW5lKSBsaW5lLmNsYXNzTGlzdC50b2dnbGUoJ2RvbmUnLCBkb25lKTsKICBib3guZGlzYWJsZWQgPSB0cnVlOwoKICBjYWxsQXBpKCdyZXBhaXIudG9nZ2xlJywgeyBpZDogaWQsIGluZGV4OiBpbmRleCwgZG9uZTogZG9u',
  'ZSB9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7ICAgICAgICAvLyDguITguKfguLLguKHguITguLfguJrguKvguJnguYnguLLguIHguLHguJrguKrguJbguLLguJnguLDguK3guLLguIjguYDguJvguKXguLXguYjguKLguJkg4LiL',
  '4Li04LiH4LiB4LmM4LmA4LiH4Li14Lii4LiaIOC5hgogICAgcmVmcmVzaEFsZXJ0cygpOyAgICAgICAgICAgICAgLy8g4LiH4Liy4LiZ4LiE4LmJ4Liy4LiH4Lit4Liy4LiI4Lil4LiU4Lil4LiHIOC4leC4seC4p+C5gOC4peC4guC4muC4meC5gOC4oeC4meC4ueC4',
  'leC5ieC4reC4h+C4leC4suC4oeC4lOC5ieC4p+C4ogogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgYm94LmNoZWNrZWQgPSAhZG9uZTsKICAgIGlmIChsaW5lKSBsaW5lLmNsYXNzTGlzdC50b2dnbGUoJ2RvbmUnLCAhZG9uZSk7CiAgICBib3guZGlzYWJsZWQg',
  'PSBmYWxzZTsKICAgIHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7CiAgfSk7Cn0KCmZ1bmN0aW9uIG9wZW5SZXBhaXJSb29tKHJvb20pewogIHZhciBkID0gUy5jYWNoZS5yZXBhaXJzOwogIHZhciByID0gZC5yb29tcy5maWx0ZXIoZnVuY3Rpb24oeCl7IHJl',
  'dHVybiB4LnJvb20gPT09IHJvb207IH0pWzBdOwogIHZhciBib2R5ID0gJzxkaXYgY2xhc3M9ImdyaWQgZzMgbWIxMiI+JyArCiAgICAgIGtwaSgn4LiH4Liy4LiZ4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJywgci5jb3VudCArICcg4LiH4Liy4LiZJywgJycpICsKICAg',
  'ICAga3BpKCfguKLguLHguIfguYTguKHguYjguYDguKrguKPguYfguIgnLCByLm9wZW5Db3VudCArICcg4LiH4Liy4LiZJywgci5vcGVuVGFza3MgPyAn4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmIICcgKyByLm9wZW5UYXNrcyArICcg4LiI4Li44LiUJyA6ICcnLCBy',
  'Lm9wZW5Db3VudCA/ICd3YXJuJzonZ29vZCcpICsKICAgICAga3BpKCfguITguYjguLLguYPguIrguYnguIjguYjguLLguKInLCBiYWh0KHIuY29zdCksICcnKSArCiAgICAnPC9kaXY+JyArCiAgICAoci5yZWNvcmRzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0bCI+',
  'JyArIHIucmVjb3Jkcy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0idGwtaSI+PGRpdiBjbGFzcz0iZCI+JyArIHRoRGF0ZSh4LnJlcGFpckRhdGUgfHwgeC5ib29rRGF0ZSkgKyAnIMK3ICcgKyBlc2MoeC5jYXRlZ29yeXx8JycpICsg',
  'JyAnICsgc3RhdHVzQmFkZ2UoeC5zdGF0dXMpICsgJzwvZGl2PicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJ0Ij4nICsgdG9kb0xpc3RIdG1sKHgpICsgJzwvZGl2PicgKwogICAgICAgICh4LnRlY2huaWNpYW4gPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCI+4LiK',
  '4LmI4Liy4LiHOiAnICsgZXNjKHgudGVjaG5pY2lhbikgKyAnPC9kaXY+JyA6ICcnKSArCiAgICAgICAgKHguY29zdCA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIj7guITguYjguLLguYPguIrguYnguIjguYjguLLguKIgJyArIGJhaHQoeC5jb3N0KSArICc8L2Rp',
  'dj4nIDogJycpICsKICAgICAgICAnPGRpdiBjbGFzcz0ibXQ4Ij4nICsgdGh1bWJzSHRtbCgoeC5iZWZvcmVSZWZzfHxbXSkuY29uY2F0KHguYWZ0ZXJSZWZzfHxbXSkpICsgJzwvZGl2PicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJtdDgiPjxidXR0b24gY2xhc3M9',
  'ImJ0biBzbSIgb25jbGljaz1cJ2Nsb3NlTW9kYWwoKTtmb3JtUmVwYWlyKCcgKyBhdHRyKHgpICsgJylcJz7guYHguIHguYnguYTguII8L2J1dHRvbj48L2Rpdj4nICsKICAgICAgJzwvZGl2Pic7CiAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nIDogJzxkaXYgY2xh',
  'c3M9ImVtcHR5Ij7guKLguLHguIfguYTguKHguYjguKHguLXguIfguLLguJnguIvguYjguK3guKHguYPguJnguJvguLXguJfguLXguYjguYDguKXguLfguK3guIE8L2Rpdj4nKTsKCiAgb3Blbk1vZGFsKCfwn5SnIOC4h+C4suC4meC4i+C5iOC4reC4oSDCtyDguKvg',
  'uYnguK3guIcgJyArIHJvb20sIGJvZHksCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4m+C4tOC4lDwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtmb3Jt',
  'UmVwYWlyKHtyb29tOlwnJyArIHJvb20gKyAnXCd9KSI+KyDguYDguJ7guLTguYjguKHguIfguLLguJnguIvguYjguK3guKE8L2J1dHRvbj4nLCB0cnVlKTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09CiAgIDYpIOC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLmJ1aWxkaW5nID0gewog',
  'IGxvYWQ6IGZ1bmN0aW9uKCl7CiAgICByZXR1cm4gUHJvbWlzZS5hbGwoWwogICAgICBjYWxsQXBpKCdidWlsZGluZy5zdW1tYXJ5JywgeyB5ZWFyOiBTLnllYXIgfSksCiAgICAgIGNhbGxBcGkoJ2J1aWxkaW5nLmxpc3QnLCB7IHllYXI6IFMueWVhciwgem9uZTog',
  'Uy5wYXJhbXMuem9uZSB8fCAnJywgc3RhdHVzOiAnJyB9KQogICAgXSkudGhlbihmdW5jdGlvbihyKXsgdmFyIGQgPSByWzBdOyBkLml0ZW1zID0gclsxXTsgcmV0dXJuIGQ7IH0pOwogIH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciB5ZWFyTGFiZWwg',
  'PSBTLnllYXIgPT09ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICBrcGkoJ+C4h+C4suC4meC4m+C4tSAnICsgKFMueWVhcj09PSdh',
  'bGwnPyfguJfguLHguYnguIfguKvguKHguJQnOlMueWVhciksIGQueWVhckNvdW50ICsgJyDguIfguLLguJknLCAn4Liq4Liw4Liq4LihICcgKyBkLnRvdGFsICsgJyDguIfguLLguJknLCAnYWNjZW50JykgKwogICAgICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4',
  'iOC5iOC4suC4oiAnICsgeWVhckxhYmVsLCBiYWh0KGQueWVhckNvc3QpLCAn4Liq4Liw4Liq4LihICcgKyBiYWh0KGQuZ3JhbmRDb3N0KSkgKwogICAgICBrcGkoJ+C4h+C4suC4meC4l+C4teC5iOC4ouC4seC4h+C5hOC4oeC5iOC5gOC4quC4o+C5h+C4iCcsIGQu',
  'b3BlbkNvdW50ICsgJyDguIfguLLguJknLCAnJywgZC5vcGVuQ291bnQgPyAnd2FybicgOiAnZ29vZCcpICsKICAgICAga3BpKCfguITguKPguJrguIHguLPguKvguJnguJTguYPguJkgOTAg4Lin4Lix4LiZJywgZC51cGNvbWluZy5sZW5ndGggKyAnIOC4h+C4suC4',
  'mScsIGQudXBjb21pbmcubGVuZ3RoID8gZC51cGNvbWluZ1swXS50aXRsZSA6ICcnLCBkLnVwY29taW5nLmxlbmd0aCA/ICd3YXJuJyA6ICcnKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgem9uZXMgPSAnPGRpdiBjbGFzcz0iY2hpcHMgbWIxMiI+JyArCiAgICAg',
  'ICc8YnV0dG9uIGNsYXNzPSJjaGlwICcgKyAoIVMucGFyYW1zLnpvbmU/J29uJzonJykgKyAnIiBvbmNsaWNrPSJzZXRQYXJhbShcJ3pvbmVcJyxcJ1wnKSI+4LiX4Li44LiB4Liq4LmI4Lin4LiZPC9idXR0b24+JyArCiAgICAgIGQuYnlab25lLm1hcChmdW5jdGlv',
  'bih6KXsKICAgICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9ImNoaXAgJyArIChTLnBhcmFtcy56b25lPT09ei56b25lPydvbic6JycpICsgJyIgb25jbGljaz0ic2V0UGFyYW0oXCd6b25lXCcsXCcnICsgZXNjKHouem9uZSkgKyAnXCcpIj4nICsKICAgICAgICAg',
  'ICAgICAgZXNjKHouem9uZSkgKyAnICgnICsgei5jb3VudCArICcpPC9idXR0b24+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKCiAgICB2YXIgY2hhcnRzID0gJzxkaXYgY2xhc3M9ImdyaWQgZzIgbWIxMiI+JyArCiAgICAgIGNhcmQoJ/Cfj5fvuI8g',
  '4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4LmB4Lii4LiB4LiV4Liy4Lih4Liq4LmI4Lin4LiZ4LiC4Lit4LiH4Lit4Liy4LiE4Liy4LijJywgYmFyQ2hhcnQoZC5ieVpvbmUsICd6b25lJywgJ2Nvc3QnLCBmdW5jdGlvbihpKXsgcmV0dXJuIG1vbmV5KGku',
  'Y29zdCkgKyAnIOC4vyc7IH0pKSArCiAgICAgIGNhcmQoJ/Cfk4Ug4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4LmB4Lii4LiB4LiV4Liy4Lih4Lib4Li1JywgYmFyQ2hhcnQoCiAgICAgICAgZC5ieVllYXIubWFwKGZ1bmN0aW9uKHkpeyByZXR1cm4geyBs',
  'YWJlbDon4Lib4Li1ICcgKyB5LnllYXIgKyAnICgnICsgeS5jb3VudCArICcg4LiH4Liy4LiZKScsIGNvc3Q6eS5jb3N0IH07IH0pLAogICAgICAgICdsYWJlbCcsICdjb3N0JywgZnVuY3Rpb24oaSl7IHJldHVybiBtb25leShpLmNvc3QpICsgJyDguL8nOyB9KSkg',
  'KwogICAgJzwvZGl2Pic7CgogICAgdmFyIHJvd3MgPSBkLml0ZW1zOwogICAgdmFyIGxpc3QgPSBjYXJkKCfwn4+iIOC4o+C4suC4ouC4geC4suC4o+C4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oSDCtyAnICsgeWVhckxhYmVs',
  'ICsgJyAoJyArIHJvd3MubGVuZ3RoICsgJyknLAogICAgICByb3dzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOjEwMjBweCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC4quC5iOC4p+C4meC4',
  'guC4reC4h+C4reC4suC4hOC4suC4ozwvdGg+PHRoPuC4o+C4suC4ouC4geC4suC4ozwvdGg+PHRoPuC4meC4seC4lDwvdGg+PHRoPuC5gOC4o+C4tOC5iOC4oTwvdGg+PHRoPuC5gOC4quC4o+C5h+C4iDwvdGg+PHRoPuC4quC4luC4suC4meC4sDwvdGg+JyArCiAg',
  'ICAgICAgJzx0aD7guJzguLnguYnguKPguLHguJrguYDguKvguKHguLI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguYjguLLguYPguIrguYnguIjguYjguLLguKI8L3RoPjx0aD7guKPguK3guJrguJbguLHguJTguYTguJs8L3RoPjx0aD7guKDguLLguJ48L3RoPjx0',
  'aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgcm93cy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgICAgICByZXR1cm4gJzx0cj4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+PGI+JyArIGVzYyh4LnpvbmUgfHwgJ+KAkycpICsgJzwv',
  'Yj48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEzIj48ZGl2IGNsYXNzPSJjbGlwIj4nICsgZXNjKHgudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAgICAgICh4Lm5vdGUgPyAnPGRpdiBjbGFzcz0iZnMxMiBmYWludCBjbGlwIj4nICsgZXNj',
  'KHgubm90ZSkgKyAnPC9kaXY+JyA6ICcnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LmJvb2tEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyAr',
  'IHRoRGF0ZSh4LnN0YXJ0RGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyB0aERhdGUoeC5lbmREYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyBzdGF0dXNCYWRnZSh4LnN0YXR1cykgKyAn',
  'PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyh4LmNvbnRyYWN0b3IgfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIG51bSh4LmNvc3QpICsgJzwvdGQ+JyArCiAgICAgICAgICAg',
  'ICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgKHgubmV4dER1ZSA/IHRoRGF0ZVNob3J0KHgubmV4dER1ZSkgKwogICAgICAgICAgICAgICAgKHguZHVlSW5EYXlzICE9IG51bGwgPyAnPGRpdiBjbGFzcz0iZmFpbnQiIHN0eWxlPSJmb250LXNpemU6MTFweCI+',
  'JyArICh4LmR1ZUluRGF5czwwID8gJ+C5gOC4peC4oiAnICsgKC14LmR1ZUluRGF5cykgKyAnIOC4p+C4seC4mScgOiAn4Lit4Li14LiBICcgKyB4LmR1ZUluRGF5cyArICcg4Lin4Lix4LiZJykgKyAnPC9kaXY+JyA6ICcnKQogICAgICAgICAgICAgIDogJ+KAkycp',
  'ICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwoKHgucGhvdG9SZWZzfHxbXSkuY29uY2F0KHguc2xpcFJlZnN8fFtdKSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48ZGl2IGNsYXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAg',
  'ICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1CdWlsZGluZygnICsgYXR0cih4KSArICcpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIGRnciIgb25jbGlj',
  'az0iZGVsQnVpbGRpbmcoXCcnICsgeC5pZCArICdcJykiPvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICAgJzwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nCiAgICAgIDogZW1wdHlCb3goJ+C4',
  'ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5g+C4mScgKyB5ZWFyTGFiZWwsICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtQnVpbGRpbmcobnVsbCkiPisg4LmA4Lie4Li04LmI',
  '4Lih4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiV4Li24LiBPC9idXR0b24+JyksCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIHNtIiBvbmNsaWNrPSJmb3JtQnVpbGRpbmcobnVsbCkiPisg4LmA4Lie4Li04LmI4Lih4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiV',
  '4Li24LiBPC9idXR0b24+JywgdHJ1ZSk7CgogICAgcmV0dXJuIGhlYWQgKyB6b25lcyArIGNoYXJ0cyArIGxpc3Q7CiAgfQp9OwoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDcpIOC4q+C5',
  'ieC4reC4h+C4nuC4seC4gQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLnJvb21zID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7IHJldHVybiBjYWxsQXBpKCdyb29tLmxpc3QnKS50',
  'aGVuKGZ1bmN0aW9uKGZsb29ycyl7IHJldHVybiB7IGZsb29yczogZmxvb3JzLCB5ZWFyczogW10gfTsgfSk7IH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciBmbGF0ID0gW107CiAgICBkLmZsb29ycy5mb3JFYWNoKGZ1bmN0aW9uKGYpeyBmLnJvb21z',
  'LmZvckVhY2goZnVuY3Rpb24ocil7IGZsYXQucHVzaChyKTsgfSk7IH0pOwogICAgdmFyIG9jYyA9IGZsYXQuZmlsdGVyKGZ1bmN0aW9uKHIpeyByZXR1cm4gci5zdGF0dXMgPT09ICfguKHguLXguJzguLnguYnguYDguIrguYjguLInOyB9KS5sZW5ndGg7CgogICAg',
  'dmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAga3BpKCfguKvguYnguK3guIfguJfguLHguYnguIfguKvguKHguJQnLCBmbGF0Lmxlbmd0aCArICcg4Lir4LmJ4Lit4LiHJywgJzUg4LiK4Lix4LmJ4LiZJywgJ2FjY2VudCcpICsK',
  'ICAgICAga3BpKCfguKHguLXguJzguLnguYnguYDguIrguYjguLInLCBvY2MgKyAnIOC4q+C5ieC4reC4hycsIHBjdChmbGF0Lmxlbmd0aCA/IG9jYy9mbGF0Lmxlbmd0aCoxMDAgOiAwKSArICcg4Lit4Lix4LiV4Lij4Liy4LmA4LiC4LmJ4Liy4Lie4Lix4LiBJywg',
  'J2dvb2QnKSArCiAgICAgIGtwaSgn4Lir4LmJ4Lit4LiH4Lin4LmI4Liy4LiHJywgZmxhdC5maWx0ZXIoZnVuY3Rpb24ocil7IHJldHVybiByLnN0YXR1cyA9PT0gJ+C4p+C5iOC4suC4hyc7IH0pLmxlbmd0aCArICcg4Lir4LmJ4Lit4LiHJywgJycsICd3YXJuJykg',
  'KwogICAgICBrcGkoJ+C4hOC5iOC4suC5gOC4iuC5iOC4suC4o+C4p+C4oS/guYDguJTguLfguK3guJknLCBiYWh0KGZsYXQucmVkdWNlKGZ1bmN0aW9uKGEscil7IHJldHVybiBhICsgKE51bWJlcihyLnJlbnQpfHwwKTsgfSwgMCkpLCAn4LiI4Liy4LiB4Lir4LmJ',
  '4Lit4LiH4LiX4Li14LmI4LiB4Lij4Lit4LiB4LiE4LmI4Liy4LmA4LiK4LmI4Liy4LmE4Lin4LmJJykgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIGdyaWQgPSBjYXJkKCfwn5qqIOC4nOC4seC4h+C4q+C5ieC4reC4h+C4nuC4seC4gScsIHJvb21GbG9vcnMoZmxh',
  'dCwgZnVuY3Rpb24ocil7CiAgICAgIHZhciBjbHMgPSByLnN0YXR1cyA9PT0gJ+C4oeC4teC4nOC4ueC5ieC5gOC4iuC5iOC4sicgPyAncy1vaycgOiAoci5zdGF0dXMgPT09ICfguKfguYjguLLguIcnID8gJ3MtaW5mbycgOiAncy13YXJuJyk7CiAgICAgIHJldHVy',
  'biB7IGNsczogY2xzLCBzdWI6IGVzYyhyLnRlbmFudCB8fCByLnN0YXR1cyB8fCAnJykgKyAoci5yZW50ID8gJzxicj4nICsgbW9uZXkoci5yZW50KSArICcg4Li/JyA6ICcnKSwKICAgICAgICAgICAgICAgb25jbGljazogJ29wZW5Sb29tKFwnJyArIHIucm9vbSAr',
  'ICdcJyknIH07CiAgICB9KSwgJzxzcGFuIGNsYXNzPSJmczEyIG11dGVkIj7guITguKXguLTguIHguJfguLXguYjguKvguYnguK3guIfguYDguJ7guLfguYjguK3guJTguLnguJvguKPguLDguKfguLHguJXguLTguJfguLHguYnguIfguKvguKHguJTguILguK3guIfg',
  'uKvguYnguK3guIfguJnguLHguYnguJk8L3NwYW4+Jyk7CgogICAgcmV0dXJuIGhlYWQgKyBncmlkOwogIH0KfTsKCmZ1bmN0aW9uIG9wZW5Sb29tKHJvb20pewogIG9wZW5Nb2RhbCgn8J+aqiDguKvguYnguK3guIcgJyArIHJvb20sICc8ZGl2IGNsYXNzPSJlbXB0',
  'eSI+PHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4LmC4Lir4Lil4LiU4oCmPC9kaXY+Jyk7CiAgY2FsbEFwaSgncm9vbS5wcm9maWxlJywgeyByb29tOiByb29tIH0pLnRoZW4oZnVuY3Rpb24ocCl7CiAgICB2YXIgaSA9IHAuaW5mbzsK',
  'ICAgIHZhciBib2R5ID0KICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgICAga3BpKCfguKrguJbguLLguJnguLAnLCBpLnN0YXR1cyB8fCAn4oCTJywgZXNjKGkudGVuYW50IHx8ICcnKSkgKwogICAgICAgIGtwaSgn4Lil4LmJ4Liy4LiH',
  '4LmB4Lit4Lij4LmMJywgcC5hY0NvdW50ICsgJyDguITguKPguLHguYnguIcnLCBwLmxhc3RBYyA/ICfguKXguYjguLLguKrguLjguJQgJyArIHRoRGF0ZShwLmxhc3RBYykgOiAn4LmE4Lih4LmI4Lih4Li14Lib4Lij4Liw4Lin4Lix4LiV4Li0JykgKwogICAgICAg',
  'IGtwaSgn4LiH4Liy4LiZ4LiL4LmI4Lit4LihJywgcC5yZXBhaXJDb3VudCArICcg4LiH4Liy4LiZJywgJ+C4hOC5ieC4suC4hyAnICsgcC5vcGVuUmVwYWlycywgcC5vcGVuUmVwYWlycyA/ICd3YXJuJyA6ICcnKSArCiAgICAgICAga3BpKCfguITguYjguLLguYPg',
  'uIrguYnguIjguYjguLLguKLguKrguLDguKrguKEnLCBiYWh0KHAudG90YWxDb3N0KSwgJ+C4i+C5iOC4reC4oSArIOC4peC5ieC4suC4h+C5geC4reC4o+C5jCcpICsKICAgICAgJzwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0icm93IG1iMTIiPicgKwogICAg',
  'ICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9XCdjbG9zZU1vZGFsKCk7Zm9ybVJvb20oJyArIGF0dHIoaSkgKyAnKVwnPuKcj++4jyDguYHguIHguYnguYTguILguILguYnguK3guKHguLnguKXguKvguYnguK3guIc8L2J1dHRvbj4nICsKICAgICAg',
  'ICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCk7Zm9ybVJlcGFpcih7cm9vbTpcJycgKyByb29tICsgJ1wnfSkiPisg4LmB4LiI4LmJ4LiH4LiL4LmI4Lit4LihPC9idXR0b24+JyArCiAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0',
  'biBzbSIgb25jbGljaz0iY2xvc2VNb2RhbCgpO2Zvcm1BYyh7cm9vbTpcJycgKyByb29tICsgJ1wnfSkiPisg4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMPC9idXR0b24+JyArCiAgICAgICc8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImNhcmQgbWIxMiI+PGRp',
  'diBjbGFzcz0iY2FyZC1oIj48aDM+4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZ4LmD4LiZ4Lir4LmJ4Lit4LiHPC9oMz4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPVwnY2xvc2VNb2RhbCgpO2Zvcm1Bc3NldCh7cm9vbToiJyAr',
  'IGVzYyhyb29tKSArICcifSlcJz4rIOC5gOC4nuC4tOC5iOC4oeC4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4mTwvYnV0dG9uPicgKwogICAgICAnPC9kaXY+PGRpdiBjbGFzcz0iY2FyZC1iIj4nICsKICAgICAgICAocC5hc3NldHMubGVuZ3RoCiAgICAgICAgICA/',
  'ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOmF1dG8iPjx0aGVhZD48dHI+JyArCiAgICAgICAgICAgICc8dGg+4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZPC90aD48dGg+4Lii4Li14LmI4Lir4LmJ4LitL+C4o+C4',
  'uOC5iOC4mTwvdGg+PHRoPuC4leC4tOC4lOC4leC4seC5ieC4hzwvdGg+PHRoPuC4m+C4o+C4sOC4geC4seC4meC4luC4tuC4hzwvdGg+PHRoPuC4quC4luC4suC4meC4sDwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICAgICAgcC5h',
  'c3NldHMubWFwKGZ1bmN0aW9uKGEpewogICAgICAgICAgICAgIHJldHVybiAnPHRyPjx0ZD48Yj4nICsgZXNjKGEubmFtZSkgKyAnPC9iPicgKwogICAgICAgICAgICAgICAgICAgICAgIChhLnNlcmlhbCA/ICc8YnI+PHNwYW4gY2xhc3M9ImZzMTIgbXV0ZWQiPlMv',
  'TiAnICsgZXNjKGEuc2VyaWFsKSArICc8L3NwYW4+JyA6ICcnKSArICc8L3RkPicgKwogICAgICAgICAgICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKGEuYnJhbmR8fCfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAgICAgICAgICAnPHRk',
  'IGNsYXNzPSJmczEyIj4nICsgdGhEYXRlKGEuaW5zdGFsbERhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyAoYS53YXJyYW50eUVuZCA/IHRoRGF0ZShhLndhcnJhbnR5RW5kKSA6ICfigJMnKSArICc8L3Rk',
  'PicgKwogICAgICAgICAgICAgICAgICAgICAnPHRkPicgKyBzdGF0dXNCYWRnZShhLnN0YXR1cykgKyAnPC90ZD4nICsKICAgICAgICAgICAgICAgICAgICAgJzx0ZCBjbGFzcz0idC1hY3Rpb25zIj48YnV0dG9uIGNsYXNzPSJidG4gaWNvbiBzbSIgdGl0bGU9IuC5',
  'geC4geC5ieC5hOC4giIgJyArCiAgICAgICAgICAgICAgICAgICAgICAgJ29uY2xpY2s9XCdjbG9zZU1vZGFsKCk7Zm9ybUFzc2V0KCcgKyBhdHRyKGEpICsgJylcJz7inI/vuI88L2J1dHRvbj48L3RkPjwvdHI+JzsKICAgICAgICAgICAgfSkuam9pbignJykgKyAn',
  'PC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgICAgIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij7guKLguLHguIfguYTguKHguYjguYTguJTguYnguJrguLHguJnguJfguLbguIHguJfguKPguLHguJ7guKLguYzguKrguLTguJnguILguK3guIfguKvguYnguK3guIfg',
  'uJnguLXguYk8L2Rpdj4nKSArCiAgICAgICc8L2Rpdj48L2Rpdj4nICsKICAgICAgJzxoMyBjbGFzcz0iZnMxMyBtYjgiPuC4m+C4o+C4sOC4p+C4seC4leC4tOC4l+C4seC5ieC4h+C4q+C4oeC4lCAoJyArIHAudGltZWxpbmUubGVuZ3RoICsgJyk8L2gzPicgKwog',
  'ICAgICAocC50aW1lbGluZS5sZW5ndGggPyAnPGRpdiBjbGFzcz0idGwiPicgKyBwLnRpbWVsaW5lLm1hcChmdW5jdGlvbihlKXsKICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9InRsLWkiPjxkaXYgY2xhc3M9ImQiPicgKyB0aERhdGUoZS5kYXRlKSArICcgwrcg',
  'JyArIGVzYyhlLnR5cGUpICsgJyAnICsgc3RhdHVzQmFkZ2UoZS5zdGF0dXMpICsgJzwvZGl2PicgKwogICAgICAgICAgJzxkaXYgY2xhc3M9InQiPicgKyBlc2MoZS50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAoZS50b2RvICYmIGUudG9kby5sZW5ndGgg',
  'PyB0b2RvTGlzdEh0bWwoZSkgOiAnJykgKwogICAgICAgICAgKGUuZGV0YWlsID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQiPicgKyBlc2MoZS5kZXRhaWwpICsgJzwvZGl2PicgOiAnJykgKwogICAgICAgICAgKGUuY29zdCA/ICc8ZGl2IGNsYXNzPSJmczEyIG11',
  'dGVkIj4nICsgYmFodChlLmNvc3QpICsgJzwvZGl2PicgOiAnJykgKwogICAgICAgICAgKGUucGhvdG9zICYmIGUucGhvdG9zLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJtdDgiPicgKyB0aHVtYnNIdG1sKGUucGhvdG9zKSArICc8L2Rpdj4nIDogJycpICsKICAgICAg',
  'ICAnPC9kaXY+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JyA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lib4Lij4Liw4Lin4Lix4LiV4Li0PC9kaXY+Jyk7CgogICAgb3Blbk1vZGFsKCfwn5qqIOC4q+C5ieC4reC4',
  'hyAnICsgcm9vbSArICcgwrcg4LiK4Lix4LmJ4LiZICcgKyAoaS5mbG9vcnx8JycpLCBib2R5LAogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4m+C4tOC4lDwvYnV0dG9uPicsIHRydWUpOwogIH0pLmNhdGNoKGZ1bmN0',
  'aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsICdlcnInKTsgY2xvc2VNb2RhbCgpOyB9KTsKfQoKCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICA4KSDguKPguLLguKLguKPguLHguJot4Lij',
  '4Liy4Lii4LiI4LmI4Liy4Lii4Lir4LitICjguKPguLLguKLguYDguJTguLfguK3guJkpCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMuZmluYW5jZSA9IHsKICBsb2FkOiBmdW5j',
  'dGlvbigpewogICAgcmV0dXJuIFByb21pc2UuYWxsKFsKICAgICAgY2FsbEFwaSgnZmluYW5jZS5zdW1tYXJ5JywgeyB5ZWFyOiBTLnllYXIgfSksCiAgICAgIGNhbGxBcGkoJ2ZpbmFuY2UubGlzdCcsIHsgeWVhcjogUy55ZWFyLCBraW5kOiBTLnBhcmFtcy5raW5k',
  'IHx8ICcnIH0pCiAgICBdKS50aGVuKGZ1bmN0aW9uKHIpeyB2YXIgZCA9IHJbMF07IGQuaXRlbXMgPSByWzFdOyByZXR1cm4gZDsgfSk7CiAgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX',
  '4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKICAgIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgIGtwaSgn4Lij4Liy4Lii4Lij4Lix4LiaICcgKyB5ZWFyTGFiZWwsIGJhaHQoZC5pbmNvbWUpLCAn4LmA4LiJ',
  '4Lil4Li14LmI4LiiICcgKyBiYWh0KGQuYXZnSW5jb21lKSArICcv4LmA4LiU4Li34Lit4LiZJywgJ2dvb2QnKSArCiAgICAgIGtwaSgn4Lij4Liy4Lii4LiI4LmI4Liy4LiiICcgKyB5ZWFyTGFiZWwsIGJhaHQoZC5leHBlbnNlKSwgJ+C5gOC4ieC4peC4teC5iOC4',
  'oiAnICsgYmFodChkLmF2Z0V4cGVuc2UpICsgJy/guYDguJTguLfguK3guJknLCAnYmFkJykgKwogICAgICBrcGkoJ+C4hOC4h+C5gOC4q+C4peC4t+C4reC4quC4uOC4l+C4mOC4tCcsIGJhaHQoZC5uZXQpLCAn4Lit4Lix4LiV4Lij4Liy4LiB4Liz4LmE4LijICcg',
  'KyBwY3QoZC5tYXJnaW4pLCAnYWNjZW50ICcgKyAoZC5uZXQgPj0gMCA/ICdnb29kJyA6ICdiYWQnKSkgKwogICAgICBrcGkoJ+C4muC4seC4meC4l+C4tuC4geC5geC4peC5ieC4pycsIGQubW9udGhzV2l0aERhdGEgKyAnIOC5gOC4lOC4t+C4reC4mScsIGQuY291',
  'bnQgKyAnIOC4o+C4suC4ouC4geC4suC4oycpICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciBtYXhCYXIgPSBNYXRoLm1heC5hcHBseShudWxsLCBkLmJ5TW9udGgubWFwKGZ1bmN0aW9uKG0peyByZXR1cm4gTWF0aC5tYXgobS5pbmNvbWUsIG0uZXhwZW5zZSk7IH0p',
  'KSB8fCAxOwogICAgdmFyIG1vbnRobHkgPSBjYXJkKCfwn5OFIOC4o+C4suC4ouC5gOC4lOC4t+C4reC4mSDCtyAnICsgeWVhckxhYmVsLAogICAgICAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsKICAgICAgJzx0aD7guYDg',
  'uJTguLfguK3guJk8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKPguLLguKLguKPguLHguJo8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKPguLLguKLguIjguYjguLLguKI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguIfguYDguKvguKXguLfguK08L3RoPicgKwogICAgICAn',
  'PHRoIHN0eWxlPSJ3aWR0aDozOCUiPuC5gOC4l+C4teC4ouC4muC4o+C4suC4ouC4o+C4seC4miAvIOC4o+C4suC4ouC4iOC5iOC4suC4ojwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgZC5ieU1vbnRoLm1hcChmdW5jdGlvbihtKXsKICAgICAgICB2',
  'YXIgYmxhbmsgPSAhbS5pbmNvbWUgJiYgIW0uZXhwZW5zZTsKICAgICAgICByZXR1cm4gJzx0cicgKyAoYmxhbmsgPyAnIHN0eWxlPSJvcGFjaXR5Oi40NSInIDogJycpICsgJz4nICsKICAgICAgICAgICc8dGQ+PGI+JyArIG0ubGFiZWwgKyAnPC9iPjwvdGQ+JyAr',
  'CiAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAobS5pbmNvbWUgPyBtb25leShtLmluY29tZSkgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChtLmV4cGVuc2UgPyBtb25leShtLmV4cGVuc2UpIDogJ+KAkycp',
  'ICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxiIHN0eWxlPSJjb2xvcjonICsgKG0ubmV0ID49IDAgPyAndmFyKC0tb2spJyA6ICd2YXIoLS1kYW5nZXIpJykgKyAnIj4nICsKICAgICAgICAgICAgKGJsYW5rID8gJ+KAkycgOiBtb25leSht',
  'Lm5ldCkpICsgJzwvYj48L3RkPicgKwogICAgICAgICAgJzx0ZD4nICsKICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImJhci10cmFjayBtYjgiPjxkaXYgY2xhc3M9ImJhci1maWxsIiBzdHlsZT0id2lkdGg6JyArIChtLmluY29tZS9tYXhCYXIqMTAwKSArICclO2Jh',
  'Y2tncm91bmQ6dmFyKC0tb2spIj48L2Rpdj48L2Rpdj4nICsKICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImJhci10cmFjayI+PGRpdiBjbGFzcz0iYmFyLWZpbGwiIHN0eWxlPSJ3aWR0aDonICsgKG0uZXhwZW5zZS9tYXhCYXIqMTAwKSArICclO2JhY2tncm91bmQ6',
  'dmFyKC0tZGFuZ2VyKSI+PC9kaXY+PC9kaXY+JyArCiAgICAgICAgICAnPC90ZD48L3RyPic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nLCAnJywgdHJ1ZSk7CgogICAgdmFyIGJ5S2luZCA9IGNhcmQoJ/Cfp74g4LmB4Lii4LiB',
  '4LiV4Liy4Lih4Lij4Liy4Lii4LiB4Liy4LijIMK3ICcgKyB5ZWFyTGFiZWwsCiAgICAgIGJhckNoYXJ0KGQuYnlLaW5kLm1hcChmdW5jdGlvbihrKXsgcmV0dXJuIHsgbGFiZWw6IGsua2luZCArICcgKCcgKyBrLmNvdW50ICsgJyknLCB0b3RhbDogay50b3RhbCB9',
  'OyB9KSwKICAgICAgICAgICAgICAgJ2xhYmVsJywgJ3RvdGFsJywgZnVuY3Rpb24oaSl7IHJldHVybiBtb25leShpLnRvdGFsKSArICcg4Li/JzsgfSkpOwoKICAgIHZhciBieVllYXIgPSBjYXJkKCfwn5OKIOC5gOC4l+C4teC4ouC4muC4o+C4suC4ouC4m+C4tScs',
  'CiAgICAgIGQuYnlZZWFyLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOmF1dG8iPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guJvguLU8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKPguLLguKLguKPg',
  'uLHguJo8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKPguLLguKLguIjguYjguLLguKI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguIfguYDguKvguKXguLfguK08L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgZC5ieVllYXIubWFwKGZ1bmN0aW9uKHkp',
  'ewogICAgICAgICAgcmV0dXJuICc8dHIgb25jbGljaz0ic2V0WWVhckZyb21UYWJsZSgnICsgeS55ZWFyICsgJykiIHN0eWxlPSJjdXJzb3I6cG9pbnRlciI+JyArCiAgICAgICAgICAgICc8dGQ+PGI+JyArIHkueWVhciArICc8L2I+IDxzcGFuIGNsYXNzPSJmYWlu',
  'dCBmczEyIj4vICcgKyAoeS55ZWFyKzU0MykgKyAnPC9zcGFuPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIG1vbmV5KHkuaW5jb21lKSArICc8L3RkPjx0ZCBjbGFzcz0ibnVtIj4nICsgbW9uZXkoeS5leHBlbnNlKSArICc8L3RkPicg',
  'KwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxiIHN0eWxlPSJjb2xvcjonICsgKHkubmV0Pj0wPyd2YXIoLS1vayknOid2YXIoLS1kYW5nZXIpJykgKyAnIj4nICsgbW9uZXkoeS5uZXQpICsgJzwvYj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcn',
  'KSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JyA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14LiC4LmJ4Lit4Lih4Li54LilPC9kaXY+JywgJycsIHRydWUpOwoKICAgIHZhciBraW5kcyA9ICc8ZGl2IGNsYXNzPSJjaGlwcyBt',
  'YjEyIj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImNoaXAgJyArICghUy5wYXJhbXMua2luZD8nb24nOicnKSArICciIG9uY2xpY2s9InNldFBhcmFtKFwna2luZFwnLFwnXCcpIj7guJfguLjguIHguKPguLLguKLguIHguLLguKM8L2J1dHRvbj4nICsKICAgICAg',
  'ZC5ieUtpbmQubWFwKGZ1bmN0aW9uKGspewogICAgICAgIHJldHVybiAnPGJ1dHRvbiBjbGFzcz0iY2hpcCAnICsgKFMucGFyYW1zLmtpbmQ9PT1rLmtpbmQ/J29uJzonJykgKyAnIiBvbmNsaWNrPSJzZXRQYXJhbShcJ2tpbmRcJyxcJycgKyBlc2Moay5raW5kKSAr',
  'ICdcJykiPicgKwogICAgICAgICAgICAgICBlc2Moay5raW5kKSArICcgKCcgKyBrLmNvdW50ICsgJyk8L2J1dHRvbj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwoKICAgIHZhciByb3dzID0gZC5pdGVtczsKICAgIHZhciBsaXN0ID0gY2FyZCgn8J+T',
  'kiDguKPguLLguKLguIHguLLguKPguJfguLHguYnguIfguKvguKHguJQgwrcgJyArIHllYXJMYWJlbCArICcgKCcgKyByb3dzLmxlbmd0aCArICcpJywKICAgICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0',
  'cj4nICsKICAgICAgICAnPHRoPuC4p+C4seC4meC4l+C4teC5iDwvdGg+PHRoPuC4o+C4suC4ouC4geC4suC4ozwvdGg+PHRoIGNsYXNzPSJudW0iPuC4iOC4s+C4meC4p+C4meC5gOC4h+C4tOC4mTwvdGg+PHRoPuC4o+C4reC4muC4muC4tOC4pTwvdGg+PHRoPuC4',
  'iuC5iOC4reC4h+C4l+C4suC4hzwvdGg+JyArCiAgICAgICAgJzx0aD7guKrguKXguLTguJs8L3RoPjx0aD7guKvguKHguLLguKLguYDguKvguJXguLg8L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgcm93cy5tYXAoZnVuY3Rpb24o',
  'eCl7CiAgICAgICAgICB2YXIgaW5jID0geC5mbG93ID09PSAn4Lij4Liy4Lii4Lij4Lix4LiaJzsKICAgICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LmRhdGUpICsgJzwvdGQ+JyAr',
  'CiAgICAgICAgICAgICc8dGQ+PGI+JyArIGVzYyh4LmtpbmQpICsgJzwvYj4gJyArIChpbmMgPyAnPHNwYW4gY2xhc3M9ImIgb2siPuC4o+C4suC4ouC4o+C4seC4mjwvc3Bhbj4nIDogJzxzcGFuIGNsYXNzPSJiIG11dGUiPuC4o+C4suC4ouC4iOC5iOC4suC4ojwv',
  'c3Bhbj4nKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxiIHN0eWxlPSJjb2xvcjonICsgKGluYz8ndmFyKC0tb2spJzondmFyKC0taW5rKScpICsgJyI+JyArIChpbmM/JysnOifiiJInKSArIG1vbmV5KHguYW1vdW50LCAyKSArICc8',
  'L2I+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyh4LmJpbGxNb250aCB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyh4LmNoYW5uZWwgfHwgJ+KAkycpICsgJzwvdGQ+',
  'JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwoeC5zbGlwUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiBtdXRlZCBjbGlwIj4nICsgZXNjKHgubm90ZSB8fCAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0',
  'ZD48ZGl2IGNsYXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1GaW5hbmNlKCcgKyBhdHRyKHgpICsgJylcJz7inI/vuI88L2J1dHRvbj4nICsKICAgICAgICAgICAgICAnPGJ1',
  'dHRvbiBjbGFzcz0iYnRuIHNtIGljb24gZGdyIiBvbmNsaWNrPSJkZWxGaW5hbmNlKFwnJyArIHguaWQgKyAnXCcpIj7wn5eRPC9idXR0b24+JyArCiAgICAgICAgICAgICc8L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5Pjwv',
  'dGFibGU+PC9kaXY+JwogICAgICA6IGVtcHR5Qm94KCfguKLguLHguIfguYTguKHguYjguKHguLXguKPguLLguKLguIHguLLguKPguYPguJknICsgeWVhckxhYmVsLCAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZm9ybUZpbmFuY2UobnVsbCkiPisg',
  '4Lia4Lix4LiZ4LiX4Li24LiB4Lij4Liy4Lii4LiB4Liy4LijPC9idXR0b24+JyksCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIHNtIiBvbmNsaWNrPSJmb3JtRmluYW5jZShudWxsKSI+KyDguJrguLHguJnguJfguLbguIHguKPguLLguKLguKPguLHguJot',
  '4Lij4Liy4Lii4LiI4LmI4Liy4LiiPC9idXR0b24+JywgdHJ1ZSk7CgogICAgcmV0dXJuIGhlYWQgKyBtb250aGx5ICsgJzxkaXYgY2xhc3M9ImdyaWQgZzIgbXQxMiBtYjEyIj4nICsgYnlLaW5kICsgYnlZZWFyICsgJzwvZGl2PicgKyBraW5kcyArIGxpc3Q7CiAg',
  'fQp9OwoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDkpIOC4o+C4suC4ouC4h+C4suC4mSAmIOC4quC4s+C4o+C4reC4h+C4guC5ieC4reC4oeC4ueC4pQogICA9PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLnJlcG9ydHMgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsKICAgIHJldHVybiBQcm9taXNlLmFsbChbCiAgICAgIGNhbGxBcGkoJ3JlcG9ydC5jb3N0UGVyUm9vbScsIHsg',
  'eWVhcjogUy55ZWFyIH0pLAogICAgICBjYWxsQXBpKCdyZXBvcnQudXBjb21pbmcnLCB7IGRheXM6IDkwIH0pLAogICAgICBjYWxsQXBpKCdiYWNrdXAuc2hlZXRzJywge30pLAogICAgICBjYWxsQXBpKCdzaGFyZS5saW5rcycsIHt9KS5jYXRjaChmdW5jdGlvbigp',
  'eyByZXR1cm4ge307IH0pLAogICAgICBjYWxsQXBpKCdiYWNrdXAuaGlzdG9yeScsIHt9KS5jYXRjaChmdW5jdGlvbigpeyByZXR1cm4gW107IH0pCiAgICBdKS50aGVuKGZ1bmN0aW9uKHIpewogICAgICByZXR1cm4geyBjb3N0OiByWzBdLCB1cGNvbWluZzogclsx',
  'XSwgc2hlZXRzOiByWzJdLCBsaW5rczogclszXSB8fCB7fSwgYmFja3Vwczogcls0XSB8fCBbXSwgeWVhcnM6IFtdIH07CiAgICB9KTsKICB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgeWVhckxhYmVsID0gUy55ZWFyID09PSAnYWxsJyA/ICfguJfg',
  'uLjguIHguJvguLUnIDogJ+C4m+C4tSAnICsgUy55ZWFyOwogICAgdmFyIGMgPSBkLmNvc3Q7CiAgICB2YXIgdG9wID0gYy5yb29tcy5maWx0ZXIoZnVuY3Rpb24ocil7IHJldHVybiByLnRvdGFsID4gMDsgfSk7CiAgICB2YXIgbWF4Q29zdCA9IHRvcC5sZW5ndGgg',
  'PyB0b3BbMF0udG90YWwgOiAxOwoKICAgIHZhciB1cGNvbWluZyA9IGNhcmQoJ/Cfl5PvuI8g4Lib4LiP4Li04LiX4Li04LiZ4LiH4Liy4LiZ4LiX4Li14LmI4LiB4Liz4Lil4Lix4LiH4LiI4Liw4LiW4Li24LiHICg5MCDguKfguLHguJkpIMK3ICcgKyBkLnVwY29t',
  'aW5nLmxlbmd0aCArICcg4LiH4Liy4LiZJywKICAgICAgZC51cGNvbWluZy5sZW5ndGggPyAnPGRpdiBjbGFzcz0iYWxpc3QiPicgKyBkLnVwY29taW5nLm1hcChmdW5jdGlvbih1KXsKICAgICAgICB2YXIgbHZsID0gdS5kYXlzTGVmdCA8IDAgPyAnZGFuZ2VyJyA6',
  'ICh1LmRheXNMZWZ0IDw9IDcgPyAnd2FybicgOiAnaW5mbycpOwogICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0iYWxpIGwtJyArIGx2bCArICciIG9uY2xpY2s9ImdvKFwnJyArIGp1bXBQYWdlKHUubW9kdWxlKSArICdcJykiPicgKwogICAgICAgICAgJzxkaXYg',
  'Y2xhc3M9ImljIj4nICsgdS5pY29uICsgJzwvZGl2PjxkaXY+JyArCiAgICAgICAgICAnPGRpdiBjbGFzcz0idHQiPicgKyBlc2ModS50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAnPGRpdiBjbGFzcz0iZGQiPicgKyB0aERhdGUodS5kYXRlKSArICcgwrcg',
  'JyArCiAgICAgICAgICAgICh1LmRheXNMZWZ0IDwgMCA/ICfguYDguKXguKLguIHguLPguKvguJnguJQgJyArICgtdS5kYXlzTGVmdCkgKyAnIOC4p+C4seC4mScgOiAodS5kYXlzTGVmdCA9PT0gMCA/ICfguKfguLHguJnguJnguLXguYknIDogJ+C4reC4teC4gSAn',
  'ICsgdS5kYXlzTGVmdCArICcg4Lin4Lix4LiZJykpICsKICAgICAgICAgICAgKHUuZGV0YWlsID8gJyDCtyAnICsgZXNjKHUuZGV0YWlsKSA6ICcnKSArICc8L2Rpdj48L2Rpdj48L2Rpdj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nIDogJzxkaXYgY2xh',
  'c3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPvCfjKTvuI88L2Rpdj7guYTguKHguYjguKHguLXguIfguLLguJnguJnguLHguJTguKvguKHguLLguKLguYPguJkgOTAg4Lin4Lix4LiZ4LiC4LmJ4Liy4LiH4Lir4LiZ4LmJ4LiyPC9kaXY+JywgJycsIHRydWUpOwoK',
  'ICAgIHZhciBjb3N0Q2FyZCA9IGNhcmQoJ/Cfj7fvuI8g4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Liq4Liw4Liq4Lih4Lij4Liy4Lii4Lir4LmJ4Lit4LiHIMK3ICcgKyB5ZWFyTGFiZWwsCiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGczIG1iMTIiPicg',
  'KwogICAgICAgIGtwaSgn4Lij4Lin4Lih4LiX4Li44LiB4Lir4LmJ4Lit4LiHJywgYmFodChjLnRvdGFsKSwgJycpICsKICAgICAgICBrcGkoJ+C5gOC4ieC4peC4teC5iOC4ouC4leC5iOC4reC4q+C5ieC4reC4hycsIGJhaHQoYy5hdmVyYWdlKSwgJycpICsKICAg',
  'ICAgICBrcGkoJ+C4q+C5ieC4reC4h+C4l+C4teC5iOC5g+C4iuC5ieC4iOC5iOC4suC4ouC4quC4ueC4h+C4quC4uOC4lCcsIHRvcC5sZW5ndGggPyAoJ+C4q+C5ieC4reC4hyAnICsgdG9wWzBdLnJvb20pIDogJ+KAkycsIHRvcC5sZW5ndGggPyBiYWh0KHRvcFsw',
  'XS50b3RhbCkgOiAnJykgKwogICAgICAnPC9kaXY+JyArCiAgICAgICh0b3AubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guKvguYnguK3guIc8L3RoPjx0aCBjbGFzcz0ibnVtIj7g',
  'uIfguLLguJnguIvguYjguK3guKE8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguYjguLLguIvguYjguK3guKE8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKXguYnguLLguIfguYHguK3guKPguYw8L3RoPicgKwogICAgICAgICc8dGggY2xhc3M9Im51bSI+4LiC4Lit4LiH',
  '4LmA4LiC4LmJ4Liy4Lir4LmJ4Lit4LiHPC90aD48dGggY2xhc3M9Im51bSI+4Lij4Lin4LihPC90aD48dGggc3R5bGU9IndpZHRoOjI2JSI+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIHRvcC5tYXAoZnVuY3Rpb24ocil7CiAgICAgICAgICBy',
  'ZXR1cm4gJzx0ciBvbmNsaWNrPSJvcGVuUm9vbShcJycgKyByLnJvb20gKyAnXCcpIiBzdHlsZT0iY3Vyc29yOnBvaW50ZXIiPicgKwogICAgICAgICAgICAnPHRkPjxiPicgKyByLnJvb20gKyAnPC9iPiA8c3BhbiBjbGFzcz0iZmFpbnQgZnMxMiI+4LiK4Lix4LmJ',
  '4LiZICcgKyByLmZsb29yICsgJzwvc3Bhbj48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyByLmpvYnMgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHIucmVwYWlyID8gbW9uZXkoci5yZXBhaXIpIDog',
  'J+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChyLmFjID8gbW9uZXkoci5hYykgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHIucHVyY2hhc2UgPyBtb25leShyLnB1',
  'cmNoYXNlKSA6ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxiPicgKyBtb25leShyLnRvdGFsKSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48ZGl2IGNsYXNzPSJiYXItdHJhY2siPjxkaXYgY2xhc3M9ImJh',
  'ci1maWxsIiBzdHlsZT0id2lkdGg6JyArIChyLnRvdGFsL21heENvc3QqMTAwKSArICclIj48L2Rpdj48L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6ICc8ZGl2IGNsYXNzPSJlbXB0',
  'eSI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4LiX4Li14LmI4Lia4Lix4LiZ4LiX4Li24LiB4LmE4Lin4LmJ4Lij4Liy4Lii4Lir4LmJ4Lit4LiHPGRpdiBjbGFzcz0iZnMxMiBtdDgiPuC5g+C4quC5iCAi4LiE',
  '4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiIiDguYPguJnguIfguLLguJnguIvguYjguK3guKEv4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMIOC4q+C4o+C4t+C4reC4o+C4sOC4muC4uOC4q+C5ieC4reC4h+C5g+C4meC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5',
  'ieC4reC4guC4reC4hyDguYHguKXguYnguKfguJXguLHguKfguYDguKXguILguIjguLDguILguLbguYnguJnguJfguLXguYjguJnguLXguYg8L2Rpdj48L2Rpdj4nKSk7CgogICAgdmFyIGJhY2t1cCA9IGNhcmQoJ/Cfkr4g4Liq4Liz4Lij4Lit4LiH4LmB4Lil4Liw',
  '4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54LilJywKICAgICAgJzxwIGNsYXNzPSJmczEzIG11dGVkIj7guILguYnguK3guKHguLnguKXguJfguLHguYnguIfguKvguKHguJTguK3guKLguLnguYjguYPguJnguKPguLDguJrguJrguJnguLXguYkg4oCU',
  'IOC4hOC4p+C4o+C4lOC4suC4p+C4meC5jOC5guC4q+C4peC4lOC4quC4s+C4o+C4reC4h+C5hOC4p+C5ieC5gOC4lOC4t+C4reC4meC4peC4sOC4hOC4o+C4seC5ieC4hyAnICsKICAgICAgJ+C5hOC4n+C4peC5jCBKU09OIOC4meC4s+C4geC4peC4seC4muC5gOC4',
  'guC5ieC4suC4o+C4sOC4muC4muC5hOC4lOC5iSDguKrguYjguKfguJkgQ1NWIOC5gOC4m+C4tOC4lOC5g+C4mSBFeGNlbCDguKvguKPguLfguK0gR29vZ2xlIFNoZWV0cyDguYTguJTguYnguYDguKXguKI8L3A+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQx',
  'MiI+JyArCiAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImRvRXhwb3J0SnNvbigpIj7irIfvuI8g4LiU4Liy4Lin4LiZ4LmM4LmC4Lir4Lil4LiU4Liq4Liz4Lij4Lit4LiH4LiX4Lix4LmJ4LiH4Lir4Lih4LiUIChKU09OKTwvYnV0dG9u',
  'PicgKwogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImRvSW1wb3J0SnNvbigpIj7irIbvuI8g4LiB4Li54LmJ4LiE4Li34LiZ4LiI4Liy4LiB4LmE4Lif4Lil4LmM4Liq4Liz4Lij4Lit4LiHPC9idXR0b24+JyArCiAgICAgICc8L2Rpdj4nICsK',
  'ICAgICAgJzxkaXYgY2xhc3M9ImhyIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbWI4Ij7guKrguYjguIfguK3guK3guIHguYDguJvguYfguJkgQ1NWIOC5geC4ouC4geC4leC4suC4o+C4suC4hzwvZGl2PicgKwogICAgICAnPGRpdiBj',
  'bGFzcz0iY2hpcHMiPicgKyBkLnNoZWV0cy5tYXAoZnVuY3Rpb24obil7CiAgICAgICAgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJjaGlwIiBvbmNsaWNrPSJkb0V4cG9ydENzdihcJycgKyBlc2MobikgKyAnXCcpIj4nICsgZXNjKHNoZWV0TGFiZWwobikpICsgJzwv',
  'YnV0dG9uPic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicpOwoKICAgIHZhciBzaGFyZSA9IChjYW5FZGl0KCkgJiYgZC5saW5rcyAmJiBkLmxpbmtzLnZpZXdVcmwpID8gY2FyZCgn8J+UlyDguKXguLTguIfguIHguYzguYDguILguYnguLLguYPguIrguYng',
  'uIfguLLguJknLAogICAgICAnPGRpdiBjbGFzcz0iZiBtYjEyIj48bGFiZWw+8J+UkSDguKXguLTguIfguIHguYzguILguK3guIfguITguLjguJMgKOC5geC4geC5ieC5hOC4guC4guC5ieC4reC4oeC4ueC4peC5hOC4lOC5iSDigJQg4Lit4Lii4LmI4Liy4Liq4LmI',
  '4LiH4LiV4LmI4LitKTwvbGFiZWw+JyArCiAgICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiByZWFkb25seSB2YWx1ZT0iJyArIGVzYyhkLmxpbmtzLmFkbWluVXJsKSArICciIG9uY2xpY2s9InRoaXMuc2VsZWN0KCkiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFz',
  'cz0iZiI+PGxhYmVsPvCfkYAg4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmMICjguYDguJvguLTguJTguJTguLnguYTguJTguYnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcg4oCUIOC4quC5iOC4h+C5g+C4q+C5ieC5g+C4hOC4o+C4geC5h+C5hOC4lOC5',
  'iSk8L2xhYmVsPicgKwogICAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9InNoYXJlVXJsIiByZWFkb25seSB2YWx1ZT0iJyArIGVzYyhkLmxpbmtzLnZpZXdVcmwpICsgJyIgb25jbGljaz0idGhpcy5zZWxlY3QoKSI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNs',
  'YXNzPSJyb3cgbXQxMiI+JyArCiAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImNvcHlTaGFyZSgpIj7wn5OLIOC4hOC4seC4lOC4peC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jDwvYnV0dG9uPicgKwogICAgICAgICc8YnV0',
  'dG9uIGNsYXNzPSJidG4gZGdyIiBvbmNsaWNrPSJkb1JvdGF0ZVNoYXJlKCkiPvCflIEg4Lit4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LmD4Lir4Lih4LmIPC9idXR0b24+JyArCiAgICAgICc8L2Rpdj4nICsKICAgICAgJzxwIGNsYXNzPSJmczEy',
  'IG11dGVkIG10MTIiPuC4hOC4meC4l+C4teC5iOC5gOC4m+C4tOC4lOC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC4iOC4sOC5gOC4q+C5h+C4meC4guC5ieC4reC4oeC4ueC4peC4l+C4seC5ieC4h+C4q+C4oeC4lOC5geC4muC4muC4reC5iOC4suC4meC4reC4',
  'ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pyAnICsKICAgICAgJ+C5hOC4oeC5iOC4leC5ieC4reC4h+C4oeC4teC4muC4seC4jeC4iuC4tSBHb29nbGUg4LmB4Lil4Liw4LmE4Lih4LmI4LmA4Lir4LmH4LiZIEdvb2dsZSBTaGVldCDguILguK3guIfguITguLjguJMg',
  'wrcgJyArCiAgICAgICfguJbguYnguLLguKXguLTguIfguIHguYzguKvguKXguLjguJTguYPguKvguYnguIHguJQgIuC4reC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC5g+C4q+C4oeC5iCIg4Lil4Li04LiH4LiB4LmM4LmA4LiU4Li04Lih4LiI4Liw',
  '4LmD4LiK4LmJ4LmE4Lih4LmI4LmE4LiU4LmJ4LiX4Lix4LiZ4LiX4Li1PC9wPicpIDogJyc7CgogICAgdmFyIGRyaXZlID0gY2FuRWRpdCgpID8gY2FyZCgn4piB77iPIOC4quC4s+C4o+C4reC4h+C4reC4seC4leC5guC4meC4oeC4seC4leC4tOC5g+C4mSBHb29n',
  'bGUgRHJpdmUgKCcgKyBkLmJhY2t1cHMubGVuZ3RoICsgJyDguIrguLjguJQpJywKICAgICAgJzxwIGNsYXNzPSJmczEzIG11dGVkIj7guKPguLDguJrguJrguYDguIHguYfguJrguYTguJ/guKXguYzguKrguLPguKPguK3guIfguYTguKfguYnguYPguJnguYLguJ/g',
  'uKXguYDguJTguK3guKPguYwgIuC4quC4s+C4o+C4reC4h+C4guC5ieC4reC4oeC4ueC4pSIg4Lia4LiZ4LmE4LiU4Lij4Lif4LmM4LiC4Lit4LiH4LiE4Li44LiTICcgKwogICAgICAn4LiV4Lix4LmJ4LiH4LmD4Lir4LmJ4LiX4Liz4Lit4Lix4LiV4LmC4LiZ4Lih',
  '4Lix4LiV4Li04LiX4Li44LiB4Lin4Lix4LiZ4LmE4LiU4LmJ4LiI4Liy4LiB4LmA4Lih4LiZ4Li54LmD4LiZ4LiK4Li14LiVPC9wPicgKwogICAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPjxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iZG9CYWNrdXBOb3co',
  'KSI+8J+SviDguKrguLPguKPguK3guIfguYDguJTguLXguYvguKLguKfguJnguLXguYk8L2J1dHRvbj48L2Rpdj4nICsKICAgICAgKGQuYmFja3Vwcy5sZW5ndGggPyAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PjxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQi',
  'IHN0eWxlPSJtaW4td2lkdGg6YXV0byI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC5hOC4n+C4peC5jDwvdGg+PHRoPuC5gOC4p+C4peC4sjwvdGg+PHRoIGNsYXNzPSJudW0iPuC4guC4meC4suC4lDwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAg',
  'ICAgICBkLmJhY2t1cHMuc2xpY2UoMCwxMCkubWFwKGZ1bmN0aW9uKGIpewogICAgICAgICAgcmV0dXJuICc8dHI+PHRkIGNsYXNzPSJmczEyIj48YSBocmVmPSInICsgZXNjKGIudXJsKSArICciIHRhcmdldD0iX2JsYW5rIj4nICsgZXNjKGIubmFtZSkgKyAnPC9h',
  'PjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MoYi5hdCkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIGZzMTIiPicgKyBNYXRoLnJvdW5kKGIuc2l6ZS8xMDI0KSArICcgS0I8L3RkPjwvdHI+JzsKICAg',
  'ICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JyA6ICcnKSkgOiAnJzsKCiAgICByZXR1cm4gdXBjb21pbmcgKyAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIGNvc3RDYXJkICsgJzwvZGl2PicgKwogICAgICAgICAgIChzaGFyZSA/ICc8ZGl2',
  'IGNsYXNzPSJtdDEyIj4nICsgc2hhcmUgKyAnPC9kaXY+JyA6ICcnKSArCiAgICAgICAgICAgJzxkaXYgY2xhc3M9Im10MTIiPicgKyBiYWNrdXAgKyAnPC9kaXY+JyArCiAgICAgICAgICAgKGRyaXZlID8gJzxkaXYgY2xhc3M9Im10MTIiPicgKyBkcml2ZSArICc8',
  'L2Rpdj4nIDogJycpOwogIH0KfTsKCmZ1bmN0aW9uIHNoZWV0TGFiZWwobil7CiAgcmV0dXJuICh7CiAgICBEZWJ0czon4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJJywgRGVidFBheW1lbnRzOifguKPguLLguKLguIHguLLguKPguIrguLPguKPguLDguKvguJnguLXg',
  'uYknLCBQdXJjaGFzZXM6J+C4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4hycsIFJvb21zOifguJfguLDguYDguJrguLXguKLguJnguKvguYnguK3guIcnLAogICAgQWNTZXJ2aWNlOifguKXguYnguLLguIfguYHguK3guKPguYwnLCBSb29tUmVw',
  'YWlyczon4LiL4LmI4Lit4Lih4LmB4LiL4Lih4Lir4LmJ4Lit4LiHJywgQnVpbGRpbmdSZXBhaXJzOifguIvguYjguK3guKHguYHguIvguKHguJXguLbguIEnLAogICAgUm9vbUFzc2V0czon4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZ4Lir4LmJ4Lit4LiHJywg',
  'RmluYW5jZTon4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4oicsIFNldHRpbmdzOifguJXguLHguYnguIfguITguYjguLInLCBBY3Rpdml0eUxvZzon4Lib4Lij4Liw4Lin4Lix4LiV4Li04LiB4Liy4Lij4LmB4LiB4LmJ4LmE4LiCJwogIH0p',
  'W25dIHx8IG47Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJXguLHguKfguIrguYjguKfguKLguKfguLLguJTguIvguYnguLMg4LmGCiAgID09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKZnVuY3Rpb24ga3BpKGxhYmVsLCB2YWx1ZSwgY2FwLCBjbHMpewogIHJldHVybiAnPGRpdiBjbGFzcz0ia3BpICcgKyAoY2xzfHwnJykgKyAnIj4nICsKICAgICc8ZGl2IGNsYXNzPSJsYmwi',
  'PicgKyBlc2MobGFiZWwpICsgJzwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InZhbCI+JyArIHZhbHVlICsgJzwvZGl2PicgKwogICAgKGNhcCA/ICc8ZGl2IGNsYXNzPSJjYXAiPicgKyBjYXAgKyAnPC9kaXY+JyA6ICcnKSArICc8L2Rpdj4nOwp9CgpmdW5jdGlv',
  'biBjYXJkKHRpdGxlLCBib2R5LCBhY3Rpb25zLCBmbHVzaCl7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJjYXJkIj4nICsKICAgICh0aXRsZSA/ICc8ZGl2IGNsYXNzPSJjYXJkLWgiPjxoMz4nICsgdGl0bGUgKyAnPC9oMz4nICsgKGFjdGlvbnMgPyAnPGRpdiBjbGFz',
  'cz0ic3AiPicgKyBhY3Rpb25zICsgJzwvZGl2PicgOiAnJykgKyAnPC9kaXY+JyA6ICcnKSArCiAgICAnPGRpdiBjbGFzcz0iY2FyZC1iJyArIChmbHVzaCA/ICcgZmx1c2gnIDogJycpICsgJyI+JyArIGJvZHkgKyAnPC9kaXY+PC9kaXY+JzsKfQoKLyoqIOC4p+C4',
  'suC4lOC4nOC4seC4h+C4q+C5ieC4reC4h+C5geC4muC5iOC4h+C4leC4suC4oeC4iuC4seC5ieC4mSDigJQgZGVjb3JhdGUocm9vbSkgLT4ge2Nscywgc3ViLCBvbmNsaWNrfSAqLwpmdW5jdGlvbiByb29tRmxvb3JzKHJvb21zLCBkZWNvcmF0ZSl7CiAgdmFyIGJ5',
  'Rmxvb3IgPSB7fTsKICByb29tcy5mb3JFYWNoKGZ1bmN0aW9uKHIpewogICAgdmFyIGYgPSByLmZsb29yIHx8IE51bWJlcihTdHJpbmcoci5yb29tKS5jaGFyQXQoMCkpOwogICAgKGJ5Rmxvb3JbZl0gPSBieUZsb29yW2ZdIHx8IFtdKS5wdXNoKHIpOwogIH0pOwog',
  'IHZhciBmbG9vcnMgPSBPYmplY3Qua2V5cyhieUZsb29yKS5zb3J0KCk7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJmbG9vcnMiPicgKyBmbG9vcnMubWFwKGZ1bmN0aW9uKGYpewogICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJmbG9vciI+PGRpdiBjbGFzcz0iZmxvb3It',
  'dGFnIj48Yj4nICsgZiArICc8L2I+4LiK4Lix4LmJ4LiZPC9kaXY+PGRpdiBjbGFzcz0icm9vbXMiPicgKwogICAgICBieUZsb29yW2ZdLm1hcChmdW5jdGlvbihyKXsKICAgICAgICB2YXIgZCA9IGRlY29yYXRlKHIpOwogICAgICAgIHJldHVybiAnPGRpdiBjbGFz',
  'cz0icm9vbSAnICsgZC5jbHMgKyAnIiBvbmNsaWNrPSInICsgZC5vbmNsaWNrICsgJyI+JyArCiAgICAgICAgICAnPHNwYW4gY2xhc3M9ImRvdCI+PC9zcGFuPjxkaXYgY2xhc3M9Im5vIj4nICsgZXNjKHIucm9vbSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAnPGRp',
  'diBjbGFzcz0ic3QiPicgKyBkLnN1YiArICc8L2Rpdj48L2Rpdj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj48L2Rpdj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7Cn0KCi8qKiDguYPguKrguYggb2JqZWN0IOC4peC4h+C5g+C4mSBvbmNsaWNrIGF0',
  'dHJpYnV0ZSDguYTguJTguYnguK3guKLguYjguLLguIfguJvguKXguK3guJTguKDguLHguKIgKi8KZnVuY3Rpb24gYXR0cihvYmopewogIHZhciBjbGVhbiA9IHt9OwogIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChmdW5jdGlvbihrKXsKICAgIGlmIChrLmluZGV4',
  'T2YoJ18nKSA9PT0gMCB8fCAvUmVmcyQvLnRlc3QoaykgfHwgayA9PT0gJ3JlY29yZHMnIHx8IGsgPT09ICd3YXJyYW50eScpIHJldHVybjsKICAgIGNsZWFuW2tdID0gb2JqW2tdOwogIH0pOwogIHJldHVybiBKU09OLnN0cmluZ2lmeShjbGVhbikucmVwbGFjZSgv',
  'Ji9nLCcmYW1wOycpLnJlcGxhY2UoLycvZywnJiMzOTsnKS5yZXBsYWNlKC8iL2csJyZxdW90OycpOwp9Cjwvc2NyaXB0Pgo8c2NyaXB0PgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgU2V0dGlu',
  'Z3MuaHRtbCDigJQg4Lir4LiZ4LmJ4Liy4LiV4Lix4LmJ4LiH4LiE4LmI4LiyIMK3IOC4mOC4teC4oSDCtyDguJrguLHguI3guIrguLXguJzguLnguYnguYPguIrguYkgwrcg4Lit4Li44Lib4LiB4Lij4LiT4LmMCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKLyogLS0tLS0tLS0tLS0tLS0tLSDguJjguLXguKHguKrguKfguYjguLLguIcgLyDguKHguLfguJQgLS0tLS0tLS0tLS0tLS0tLSAqLwoKdmFyIExTX1RIRU1FID0gJ21jb3JuZXIudGhlbWUnOwp2YXIg',
  'VEhFTUVTID0gWwogIHsgaWQ6ICfguJXguLLguKHguYDguITguKPguLfguYjguK3guIcnLCBpYzogJ/CfjJcnLCBoaW50OiAn4Liq4Lil4Lix4Lia4LiV4Liy4Lih4LiB4Liy4Lij4LiV4Lix4LmJ4LiH4LiE4LmI4Liy4LiC4Lit4LiH4Lit4Li44Lib4LiB4Lij4LiT',
  '4LmMJyB9LAogIHsgaWQ6ICfguKrguKfguYjguLLguIcnLCAgICAgIGljOiAn4piA77iPJywgaGludDogJ+C4nuC4t+C5ieC4meC4guC4suC4pyDguK3guYjguLLguJnguIfguYjguLLguKLguIHguKXguLLguIfguYHguJTguJQnIH0sCiAgeyBpZDogJ+C4oeC4t+C4',
  'lCcsICAgICAgICBpYzogJ/CfjJknLCBoaW50OiAn4Lie4Li34LmJ4LiZ4LmA4LiC4LmJ4LihIOC4quC4muC4suC4ouC4leC4suC4leC4reC4meC4geC4peC4suC4h+C4hOC4t+C4mScgfQpdOwoKLyoqCiAqIOC4l+C4suC4mOC4teC4oeC4peC4h+C4q+C4meC5ieC4',
  'suC5gOC4p+C5h+C4muC4l+C4seC4meC4l+C4tQogKiDguJXguLHguKfguYHguJvguKPguKrguLXguJfguLHguYnguIfguKvguKHguJTguJnguLTguKLguLLguKHguYTguKfguYkgMyDguIrguLHguYnguJnguYPguJkgU3R5bGUuaHRtbCDguYHguKXguYnguKcg4LiV',
  '4Lij4LiH4LiZ4Li14LmJ4LmB4LiE4LmI4LiV4Li04LiU4Lib4LmJ4Liy4Lii4Lia4Lit4LiB4Lin4LmI4Liy4LmD4LiK4LmJ4LiK4Lix4LmJ4LiZ4LmE4Lir4LiZCiAqLwpmdW5jdGlvbiBhcHBseVRoZW1lKG5hbWUpewogIHZhciByb290ID0gZG9jdW1lbnQuZG9j',
  'dW1lbnRFbGVtZW50OwogIGlmIChuYW1lID09PSAn4Liq4Lin4LmI4Liy4LiHJykgcm9vdC5zZXRBdHRyaWJ1dGUoJ2RhdGEtdGhlbWUnLCAnbGlnaHQnKTsKICBlbHNlIGlmIChuYW1lID09PSAn4Lih4Li34LiUJykgcm9vdC5zZXRBdHRyaWJ1dGUoJ2RhdGEtdGhl',
  'bWUnLCAnZGFyaycpOwogIGVsc2Ugcm9vdC5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtdGhlbWUnKTsgICAgICAgLy8g4LiV4Liy4Lih4LmA4LiE4Lij4Li34LmI4Lit4LiHID0g4Lib4Lil4LmI4Lit4Lii4LmD4Lir4LmJIHByZWZlcnMtY29sb3Itc2NoZW1lIOC4leC4',
  'seC4lOC4quC4tOC4mQogIHZhciBidG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGhlbWVCdG4nKTsKICBpZiAoYnRuKSB7CiAgICB2YXIgdCA9IFRIRU1FUy5maWx0ZXIoZnVuY3Rpb24oeCl7IHJldHVybiB4LmlkID09PSBuYW1lOyB9KVswXSB8fCBUSEVN',
  'RVNbMF07CiAgICBidG4udGV4dENvbnRlbnQgPSB0LmljOwogICAgYnRuLnRpdGxlID0gJ+C4mOC4teC4oTogJyArIHQuaWQgKyAnICjguIHguJTguYDguJ7guLfguYjguK3guKrguKXguLHguJopJzsKICB9Cn0KCmZ1bmN0aW9uIGN1cnJlbnRUaGVtZSgpewogIHJl',
  'dHVybiBsc0dldChMU19USEVNRSkgfHwgKFMuYm9vdCAmJiBTLmJvb3Quc2V0dGluZ3MgJiYgUy5ib290LnNldHRpbmdzLnRoZW1lKSB8fCAn4LiV4Liy4Lih4LmA4LiE4Lij4Li34LmI4Lit4LiHJzsKfQoKLyoqIOC4leC4seC5ieC4h+C4mOC4teC4oeC5geC4peC4',
  'sOC4iOC4s+C5hOC4p+C5iSDigJQg4Lic4Li54LmJ4LiU4Li54LmB4Lil4LiI4Liw4LiW4Li54LiB4Lia4Lix4LiZ4LiX4Li24LiB4LmA4Lib4LmH4LiZ4LiE4LmI4Liy4LiV4Lix4LmJ4LiH4LiV4LmJ4LiZ4LiC4Lit4LiH4Lij4Liw4Lia4Lia4LiU4LmJ4Lin4Lii',
  'ICovCmZ1bmN0aW9uIHNldFRoZW1lKG5hbWUsIHF1aWV0KXsKICBsc1NldChMU19USEVNRSwgbmFtZSk7CiAgYXBwbHlUaGVtZShuYW1lKTsKICBpZiAoUy5ib290ICYmIFMuYm9vdC5pc0FkbWluKSB7CiAgICBjYWxsQXBpKCdzZXR0aW5ncy5zYXZlJywgeyB2YWx1',
  'ZXM6IHsgdGhlbWU6IG5hbWUgfSB9KS5jYXRjaChmdW5jdGlvbigpeyAvKiDguYDguIHguYfguJrguYPguJnguYDguITguKPguLfguYjguK3guIfguIHguYfguJ7guK0gKi8gfSk7CiAgfQogIGlmICghcXVpZXQpIHRvYXN0KCfguYDguJvguKXguLXguYjguKLguJng',
  'uYDguJvguYfguJnguJjguLXguKEnICsgKG5hbWUgPT09ICfguJXguLLguKHguYDguITguKPguLfguYjguK3guIcnID8gJ+C4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hycgOiBuYW1lKSwgJ29rJyk7CiAgaWYgKFMucGFnZSA9PT0gJ3NldHRpbmdzJykgbG9h',
  'ZCh7IHF1aWV0OiB0cnVlIH0pOwp9CgovKiog4Lib4Li44LmI4Lih4Lia4LiZ4LmB4LiW4Lia4Lir4Lix4LinIOKAlCDguKfguJnguKrguKfguYjguLLguIcg4oaSIOC4oeC4t+C4lCDihpIg4LiV4Liy4Lih4LmA4LiE4Lij4Li34LmI4Lit4LiHICovCmZ1bmN0aW9u',
  'IGN5Y2xlVGhlbWUoKXsKICB2YXIgb3JkZXIgPSBbJ+C4quC4p+C5iOC4suC4hycsICfguKHguLfguJQnLCAn4LiV4Liy4Lih4LmA4LiE4Lij4Li34LmI4Lit4LiHJ107CiAgdmFyIGkgPSBvcmRlci5pbmRleE9mKGN1cnJlbnRUaGVtZSgpKTsKICBzZXRUaGVtZShv',
  'cmRlclsoaSArIDEpICUgb3JkZXIubGVuZ3RoXSk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4Lir4LiZ4LmJ4Liy4LiV4Lix4LmJ4LiH4LiE4LmI4LiyIC0tLS0tLS0tLS0tLS0tLS0gKi8KClJPVVRFUy5zZXR0aW5ncyA9IHsKICBsb2FkOiBmdW5jdGlvbigpewog',
  'ICAgcmV0dXJuIFByb21pc2UuYWxsKFsKICAgICAgY2FsbEFwaSgnc2V0dGluZ3MubGlzdCcsIHt9KSwKICAgICAgY2FsbEFwaSgnYXV0aC5kZXZpY2VzJywge30pLmNhdGNoKGZ1bmN0aW9uKCl7IHJldHVybiBbXTsgfSksCiAgICAgIChTLmJvb3QgJiYgUy5ib290',
  'LmlzQWRtaW4pID8gY2FsbEFwaSgndXNlci5saXN0Jywge30pLmNhdGNoKGZ1bmN0aW9uKCl7IHJldHVybiBbXTsgfSkgOiBQcm9taXNlLnJlc29sdmUobnVsbCksCiAgICAgIChTLmJvb3QgJiYgUy5ib290LmlzQWRtaW4pID8gY2FsbEFwaSgnc2hhcmUubGlua3Mn',
  'LCB7fSkuY2F0Y2goZnVuY3Rpb24oKXsgcmV0dXJuIHt9OyB9KSA6IFByb21pc2UucmVzb2x2ZSh7fSkKICAgIF0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICAgIHJldHVybiB7IHNldHRpbmdzOiByWzBdLCBkZXZpY2VzOiByWzFdIHx8IFtdLCB1c2VyczogclsyXSwg',
  'bGlua3M6IHJbM10gfHwge30sIHllYXJzOiBbXSB9OwogICAgfSk7CiAgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgcmV0dXJuICcnICsKICAgICAgc2V0dGluZ3NBY2NvdW50Q2FyZChkKSArCiAgICAgIHNldHRpbmdzVGhlbWVDYXJkKCkgKwogICAgICAo',
  'ZC5zZXR0aW5ncy5jYW5FZGl0ID8gc2V0dGluZ3NHcm91cHNIdG1sKGQuc2V0dGluZ3MpIDogc2V0dGluZ3NSZWFkT25seU5vdGUoKSkgKwogICAgICAvLyDguYDguInguJ7guLLguLDguJzguLnguYnguJTguLnguYHguKXguJfguLXguYjguYDguKvguYfguJnguKrg',
  'uK3guIfguKrguYjguKfguJnguJnguLXguYkg4oCUIOC4leC4seC4p+C4geC4suC4o+C5jOC4lOC5gOC4m+C5h+C4meC4hOC4meC4leC4seC4lOC4quC4tOC4meC5g+C4iOC5gOC4reC4h+C4p+C5iOC4suC4iOC4sOC5geC4quC4lOC4h+C4reC4sOC5hOC4owogICAg',
  'ICAvLyDguYDguJ7guKPguLLguLDguKvguJnguYnguLLguJXguLHguKfguK3guKLguYjguLLguIfguYHguJrguJrguYTguJ/guKXguYzguYDguJTguLXguKLguKfguYTguKHguYjguKHguLXguJrguLHguI3guIrguLXguJzguLnguYnguYPguIrguYnguYPguKvguYng',
  'uYHguKrguJTguIcg4LmB4LiV4LmI4Lii4Lix4LiH4Lit4Lii4Liy4LiB4Lia4Lit4LiB4Lic4Li54LmJ4LmD4LiK4LmJ4Lin4LmI4Liy4Lih4Li14Lit4Liw4LmE4Lij4Lia4LmJ4Liy4LiHCiAgICAgIChpc0FkbWluTm93KCkgPyBzZXR0aW5nc1VzZXJzQ2FyZChk',
  'LnVzZXJzKSArIHNldHRpbmdzU2hhcmVDYXJkKGQubGlua3MpIDogJycpOwogIH0KfTsKCi8qIC0tLS0g4Lia4Lix4LiN4LiK4Li14LiC4Lit4LiH4LiJ4Lix4LiZIC0tLS0gKi8KCmZ1bmN0aW9uIHNldHRpbmdzQWNjb3VudENhcmQoZCl7CiAgdmFyIG1lID0gQVVU',
  'SC5tZSB8fCB7fTsKICB2YXIgZGV2aWNlcyA9IGQuZGV2aWNlcyB8fCBbXTsKICByZXR1cm4gY2FyZCgn8J+RpCDguJrguLHguI3guIrguLXguILguK3guIfguInguLHguJknLAogICAgJzxkaXYgY2xhc3M9ImdyaWQgZzIgbWIxMiI+JyArCiAgICAgIGtwaSgn4LmA',
  '4LiC4LmJ4Liy4LmD4LiK4LmJ4LiH4Liy4LiZ4LmD4LiZ4LiK4Li34LmI4LitJywgZXNjKG1lLm5hbWUgfHwgbWUudXNlcm5hbWUgfHwgJ+KAkycpLCBlc2MobWUudXNlcm5hbWUgPyAnQCcgKyBtZS51c2VybmFtZSA6IChtZS52aWEgfHwgJycpKSkgKwogICAgICBr',
  'cGkoJ+C4quC4tOC4l+C4mOC4tOC5jOC4geC4suC4o+C5g+C4iuC5ieC4h+C4suC4mScsIGVzYyhtZS5yb2xlIHx8ICfigJMnKSwKICAgICAgICAgIG1lLmNhbkVkaXQgPyAn4LmA4Lie4Li04LmI4LihIOC5geC4geC5ieC5hOC4giDguYHguKXguLDguKXguJrguILg',
  'uYnguK3guKHguLnguKXguYTguJTguYknIDogJ+C5gOC4m+C4tOC4lOC4lOC4ueC5hOC4lOC5ieC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pycpICsKICAgICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3ciPicgKwogICAgICAobWUudXNlcm5hbWUg',
  'PyAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJmb3JtQ2hhbmdlUGFzc3dvcmQoKSI+8J+UkSDguYDguJvguKXguLXguYjguKLguJnguKPguKvguLHguKrguJzguYjguLLguJk8L2J1dHRvbj4nIDogJycpICsKICAgICAgKG1lLnVzZXJuYW1lID8gJzxidXR0',
  'b24gY2xhc3M9ImJ0biIgb25jbGljaz0iZm9ybVNldFBpbigpIj7wn5SiICcgKwogICAgICAgIChBVVRILmRldmljZSA/ICfguJXguLHguYnguIcgUElOIOC5g+C4q+C4oeC5iOC4muC4meC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5iScgOiAn4LiV4Lix4LmJ',
  '4LiHIFBJTiDguKrguLPguKvguKPguLHguJrguYDguITguKPguLfguYjguK3guIfguJnguLXguYknKSArICc8L2J1dHRvbj4nIDogJycpICsKICAgICAgKEFVVEguZGV2aWNlID8gJzxidXR0b24gY2xhc3M9ImJ0biBkZ3IiIG9uY2xpY2s9ImZvcmdldFRoaXNEZXZp',
  'Y2UoKSI+4Lil4LiaIFBJTiDguYDguITguKPguLfguYjguK3guIfguJnguLXguYk8L2J1dHRvbj4nIDogJycpICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY29uZmlybUxvZ291dCgpIj7wn5qqIOC4reC4reC4geC4iOC4suC4geC4o+C4sOC4',
  'muC4mjwvYnV0dG9uPicgKwogICAgJzwvZGl2PicgKwogICAgKGRldmljZXMubGVuZ3RoCiAgICAgID8gJzxkaXYgY2xhc3M9ImhyIj48L2Rpdj48ZGl2IGNsYXNzPSJmczEyIG11dGVkIG1iOCI+4Lit4Li44Lib4LiB4Lij4LiT4LmM4LiX4Li14LmI4LiV4Lix4LmJ',
  '4LiHIFBJTiDguYTguKfguYkgKCcgKyBkZXZpY2VzLmxlbmd0aCArICcpPC9kaXY+JyArCiAgICAgICAgJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiIHN0eWxlPSJtaW4td2lkdGg6YXV0byI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC4reC4',
  'uOC4m+C4geC4o+C4k+C5jDwvdGg+PHRoPuC4leC4seC5ieC4h+C5gOC4oeC4t+C5iOC4rTwvdGg+PHRoPuC5g+C4iuC5ieC4peC5iOC4suC4quC4uOC4lDwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICBkZXZpY2VzLm1hcChmdW5jdGlvbih4KXsK',
  'ICAgICAgICAgIHJldHVybiAnPHRyPjx0ZD4nICsgZXNjKHguZGV2aWNlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgdGhEYXRlU2hvcnQoU3RyaW5nKHguY3JlYXRlZEF0KS5zbGljZSgwLDEwKSkgKyAnPC90ZD4nICsKICAg',
  'ICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIHRoRGF0ZVNob3J0KFN0cmluZyh4Lmxhc3RTZWVuKS5zbGljZSgwLDEwKSkgKyAnPC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicgKwogICAgICAgICc8',
  'ZGl2IGNsYXNzPSJyb3cgbXQxMiI+PGJ1dHRvbiBjbGFzcz0iYnRuIGRnciBzbSIgb25jbGljaz0iZG9Gb3JnZXRBbGxEZXZpY2VzKCkiPuC4ouC4geC5gOC4peC4tOC4gSBQSU4g4LiX4Li44LiB4LmA4LiE4Lij4Li34LmI4Lit4LiHPC9idXR0b24+PC9kaXY+Jwog',
  'ICAgICA6ICcnKSk7Cn0KCmZ1bmN0aW9uIGRvRm9yZ2V0QWxsRGV2aWNlcygpewogIGNvbmZpcm1BY3Rpb24oJ+C4ouC4geC5gOC4peC4tOC4gSBQSU4g4Lia4LiZ4LiX4Li44LiB4LmA4LiE4Lij4Li34LmI4Lit4LiH4LmD4LiK4LmI4LmE4Lir4LihIOKAlCDguJfg',
  'uLjguIHguYDguITguKPguLfguYjguK3guIfguIjguLDguJXguYnguK3guIfguKXguYfguK3guIHguK3guLTguJnguJTguYnguKfguKLguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYgnLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgnYXV0aC5mb3Jn',
  'ZXRBbGxEZXZpY2VzJywge30pLnRoZW4oZnVuY3Rpb24obil7CiAgICAgIHNhdmVEZXZpY2UoJycpOwogICAgICB0b2FzdCgn4Lii4LiB4LmA4Lil4Li04LiBIFBJTiDguYHguKXguYnguKcgJyArIG4gKyAnIOC5gOC4hOC4o+C4t+C5iOC4reC4hycsICdvaycpOwog',
  'ICAgICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlIHx8IGUsICdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qIC0tLS0g4LiY4Li14LihIC0tLS0gKi8KCmZ1bmN0aW9uIHNldHRpbmdzVGhlbWVDYXJk',
  'KCl7CiAgdmFyIGN1ciA9IGN1cnJlbnRUaGVtZSgpOwogIHJldHVybiBjYXJkKCfwn46oIOC4mOC4teC4oeC4quC4teC4q+C4meC5ieC4suC4iOC4rScsCiAgICAnPGRpdiBjbGFzcz0idGhlbWUtcGljayI+JyArIFRIRU1FUy5tYXAoZnVuY3Rpb24odCl7CiAgICAg',
  'IHJldHVybiAnPGJ1dHRvbiBjbGFzcz0idGhlbWUtb3B0JyArICh0LmlkID09PSBjdXIgPyAnIG9uJyA6ICcnKSArICciIG9uY2xpY2s9InNldFRoZW1lKFwnJyArIHQuaWQgKyAnXCcpIj4nICsKICAgICAgICAnPHNwYW4gY2xhc3M9ImljIj4nICsgdC5pYyArICc8',
  'L3NwYW4+JyArCiAgICAgICAgJzxiPicgKyBlc2ModC5pZCkgKyAnPC9iPicgKwogICAgICAgICc8c3BhbiBjbGFzcz0iaGludCI+JyArIGVzYyh0LmhpbnQpICsgJzwvc3Bhbj4nICsKICAgICAgJzwvYnV0dG9uPic7CiAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4n',
  'ICsKICAgICc8cCBjbGFzcz0iZnMxMiBtdXRlZCBtdDEyIj7guJjguLXguKHguIjguLPguYHguKLguIHguKPguLLguKLguYDguITguKPguLfguYjguK3guIcg4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LiX4Li14LmI4LiZ4Li14LmI4Lir4Lij4Li34Lit4LiB4LiU4Lib',
  '4Li44LmI4Lih4Lij4Li54Lib4Lie4Lij4Liw4Lit4Liy4LiX4Li04LiV4Lii4LmML+C4nuC4o+C4sOC4iOC4seC4meC4l+C4o+C5jOC4oeC4uOC4oeC4guC4p+C4suC4muC4meC4geC5h+C5hOC4lOC5iScgKwogICAgKFMuYm9vdCAmJiBTLmJvb3QuaXNBZG1pbiA/',
  'ICcgwrcg4LiE4LmI4Liy4LiX4Li14LmI4Lic4Li54LmJ4LiU4Li54LmB4Lil4LmA4Lil4Li34Lit4LiB4LiI4Liw4LmA4Lib4LmH4LiZ4LiE4LmI4Liy4LiV4Lix4LmJ4LiH4LiV4LmJ4LiZ4LmD4Lir4LmJ4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiX4Li14LmI4Lii',
  '4Lix4LiH4LmE4Lih4LmI4LmA4LiE4Lii4LiV4Lix4LmJ4LiHJyA6ICcnKSArICc8L3A+Jyk7Cn0KCi8qIC0tLS0g4LiB4Lil4Li44LmI4Lih4LiE4LmI4Liy4LiV4Lix4LmJ4LiH4LiE4LmI4LiyIC0tLS0gKi8KCmZ1bmN0aW9uIHNldHRpbmdzUmVhZE9ubHlOb3Rl',
  'KCl7CiAgcmV0dXJuIGNhcmQoJ+Kame+4jyDguIHguLLguKPguJXguLHguYnguIfguITguYjguLLguKPguLDguJrguJonLAogICAgJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPvCflJI8L2Rpdj7guYDguInguJ7guLLguLDguJzguLnguYnguJTg',
  'uLnguYHguKXguYDguJfguYjguLLguJnguLHguYnguJnguJfguLXguYjguYHguIHguYnguIHguLLguKPguJXguLHguYnguIfguITguYjguLLguKPguLDguJrguJrguYTguJTguYk8L2Rpdj4nKTsKfQoKZnVuY3Rpb24gc2V0dGluZ3NHcm91cHNIdG1sKHMpewogIHJl',
  'dHVybiBzLmdyb3Vwcy5tYXAoZnVuY3Rpb24oZyl7CiAgICByZXR1cm4gY2FyZChnLmljb24gKyAnICcgKyBnLmdyb3VwLAogICAgICAnPGRpdiBjbGFzcz0iZmdyaWQiPicgKyBnLml0ZW1zLm1hcChzZXR0aW5nRmllbGRIdG1sKS5qb2luKCcnKSArICc8L2Rpdj4n',
  'KTsKICB9KS5qb2luKCcnKSArCiAgY2FyZCgn8J+SviDguJrguLHguJnguJfguLbguIHguIHguLLguKPguJXguLHguYnguIfguITguYjguLInLAogICAgJzxwIGNsYXNzPSJmczEzIG11dGVkIj4nICsgZXNjKHMuc2VjcmV0Tm90ZSkgKyAnPC9wPicgKwogICAgJzxk',
  'aXYgY2xhc3M9InJvdyBtdDEyIj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9InNhdmVTZXR0aW5nc0Zvcm0oKSI+4Lia4Lix4LiZ4LiX4Li24LiB4LiX4Lix4LmJ4LiH4Lir4Lih4LiUPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9u',
  'IGNsYXNzPSJidG4iIG9uY2xpY2s9ImxvYWQoKSI+4Lii4LiB4LmA4Lil4Li04LiB4LiB4Liy4Lij4LmB4LiB4LmJ4LmE4LiCPC9idXR0b24+JyArCiAgICAnPC9kaXY+Jyk7Cn0KCmZ1bmN0aW9uIHNldHRpbmdGaWVsZEh0bWwoaXQpewogIHZhciBpZCA9ICdzXycg',
  'KyBpdC5rZXk7CiAgdmFyIGlubmVyOwogIGlmIChpdC5yZWFkT25seSkgewogICAgaW5uZXIgPSAnPGRpdiBjbGFzcz0iaW5wIiBzdHlsZT0iYmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlLTIpO2N1cnNvcjpkZWZhdWx0Ij4nICsgZXNjKGl0LnZhbHVlKSArICc8L2Rp',
  'dj4nOwogIH0gZWxzZSBpZiAoaXQudHlwZSA9PT0gJ3NlbGVjdCcpIHsKICAgIC8vIOC4neC4seC5iOC4h+C5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jOC4quC5iOC4h+C4oeC4suC5gOC4m+C5h+C4mSB7dmFsdWUsbGFiZWx9IOC5gOC4quC4oeC4rSDi',
  'gJQg4LiE4LmI4Liy4LiX4Li14LmI4LmA4LiB4LmH4Lia4LiB4Lix4Lia4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiX4Li14LmI4LmA4Lir4LmH4LiZ4Lit4Liy4LiI4LiE4LiZ4Lil4Liw4Lit4Lix4LiZCiAgICBpbm5lciA9ICc8c2VsZWN0IGNsYXNzPSJzZWwiIGlk',
  'PSInICsgaWQgKyAnIj4nICsgKGl0Lm9wdGlvbnMgfHwgW10pLm1hcChmdW5jdGlvbihvKXsKICAgICAgcmV0dXJuICc8b3B0aW9uIHZhbHVlPSInICsgZXNjKG8udmFsdWUpICsgJyInICsgKG8udmFsdWUgPT09IGl0LnZhbHVlID8gJyBzZWxlY3RlZCcgOiAnJykg',
  'KwogICAgICAgICAgICAgJz4nICsgZXNjKG8ubGFiZWwpICsgJzwvb3B0aW9uPic7CiAgICB9KS5qb2luKCcnKSArICc8L3NlbGVjdD4nOwogIH0gZWxzZSBpZiAoaXQudHlwZSA9PT0gJ211bHRpbGluZScpIHsKICAgIGlubmVyID0gJzx0ZXh0YXJlYSBjbGFzcz0i',
  'dGEiIGlkPSInICsgaWQgKyAnIj4nICsgZXNjKGl0LnZhbHVlKSArICc8L3RleHRhcmVhPic7CiAgfSBlbHNlIGlmIChpdC50eXBlID09PSAnbnVtYmVyJykgewogICAgaW5uZXIgPSAnPGlucHV0IHR5cGU9Im51bWJlciIgY2xhc3M9ImlucCIgaWQ9IicgKyBpZCAr',
  'ICciIHZhbHVlPSInICsgZXNjKGl0LnZhbHVlKSArICciIGlucHV0bW9kZT0iZGVjaW1hbCI+JzsKICB9IGVsc2UgewogICAgaW5uZXIgPSAnPGlucHV0IHR5cGU9InRleHQiIGNsYXNzPSJpbnAiIGlkPSInICsgaWQgKyAnIiB2YWx1ZT0iJyArIGVzYyhpdC52YWx1',
  'ZSkgKyAnIj4nOwogIH0KICByZXR1cm4gJzxkaXYgY2xhc3M9ImYnICsgKGl0LnR5cGUgPT09ICdtdWx0aWxpbmUnID8gJyBmdWxsJyA6ICcnKSArICciPicgKwogICAgJzxsYWJlbCBmb3I9IicgKyBpZCArICciPicgKyBlc2MoaXQubGFiZWwpICsgJzwvbGFiZWw+',
  'JyArIGlubmVyICsKICAgIChpdC5ub3RlID8gJzxkaXYgY2xhc3M9ImhpbnQiPicgKyBlc2MoaXQubm90ZSkgKyAnPC9kaXY+JyA6ICcnKSArICc8L2Rpdj4nOwp9CgpmdW5jdGlvbiBzYXZlU2V0dGluZ3NGb3JtKCl7CiAgdmFyIHZhbHMgPSB7fTsKICB2YXIgZGF0',
  'YSA9IFMuY2FjaGUuc2V0dGluZ3M7CiAgaWYgKCFkYXRhKSByZXR1cm47CiAgZGF0YS5zZXR0aW5ncy5ncm91cHMuZm9yRWFjaChmdW5jdGlvbihnKXsKICAgIGcuaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdCl7CiAgICAgIGlmIChpdC5yZWFkT25seSkgcmV0dXJu',
  'OwogICAgICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc18nICsgaXQua2V5KTsKICAgICAgaWYgKGVsKSB2YWxzW2l0LmtleV0gPSBlbC52YWx1ZTsKICAgIH0pOwogIH0pOwogIGNhbGxBcGkoJ3NldHRpbmdzLnNhdmUnLCB7IHZhbHVlczogdmFs',
  'cyB9KS50aGVuKGZ1bmN0aW9uKHIpewogICAgaWYgKHZhbHMudGhlbWUpIHsgbHNTZXQoTFNfVEhFTUUsIHZhbHMudGhlbWUpOyBhcHBseVRoZW1lKHZhbHMudGhlbWUpOyB9CiAgICB0b2FzdChyLnNhdmVkID8gJ+C4muC4seC4meC4l+C4tuC4geC5geC4peC5ieC4',
  'pyAnICsgci5zYXZlZCArICcg4Lij4Liy4Lii4LiB4Liy4LijJyA6ICfguYTguKHguYjguKHguLXguK3guLDguYTguKPguYDguJvguKXguLXguYjguKLguJnguYHguJvguKXguIcnLCAnb2snKTsKICAgIC8vIOC4hOC5iOC4suC4muC4suC4h+C4leC4seC4pyAo4Lij',
  '4Lit4Lia4Lij4Li14LmA4Lif4Lij4LiKIOC4iuC4t+C5iOC4reC4reC4suC4hOC4suC4oykg4Lih4Li14Lic4Lil4LiB4Lix4Lia4LiX4Lix4LmJ4LiH4Lir4LiZ4LmJ4LiyIOC4iOC4tuC4h+C5guC4q+C4peC4lOC5g+C4q+C4oeC5iOC4l+C4seC5ieC4h+C4iuC4',
  'uOC4lAogICAgcmV0dXJuIGNhbGxBcGkoJ2FwcC5ib290c3RyYXAnKS50aGVuKGZ1bmN0aW9uKGIpeyBTLmJvb3QgPSBiOyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7IH0pOwogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2UgfHwgZSwgJ2Vycicp',
  'OyB9KTsKfQoKLyogLS0tLSDguIjguLHguJTguIHguLLguKPguJzguLnguYnguYPguIrguYkgKOC4nOC4ueC5ieC4lOC4ueC5geC4peC5gOC4l+C5iOC4suC4meC4seC5ieC4mSkgLS0tLSAqLwoKZnVuY3Rpb24gaXNBZG1pbk5vdygpewogIHJldHVybiAhIShTLmJv',
  'b3QgJiYgUy5ib290LmlzQWRtaW4pOwp9CgpmdW5jdGlvbiBzZXR0aW5nc1VzZXJzQ2FyZCh1c2Vycyl7CiAgaWYgKCF1c2VycykgcmV0dXJuICcnOwogIHJldHVybiBjYXJkKCfwn5GlIOC4nOC4ueC5ieC5g+C4iuC5ieC5g+C4meC4o+C4sOC4muC4miAoJyArIHVz',
  'ZXJzLmxlbmd0aCArICcpJywKICAgICc8cCBjbGFzcz0iZnMxMyBtdXRlZCI+4LmB4LiI4LiB4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmB4Lil4Liw4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4LmJ4LiE4LiZ4Lit4Li34LmI4LiZ4LmA4LiC',
  '4LmJ4Liy4Lih4Liy4LiU4Li54Lir4Lij4Li34Lit4LiK4LmI4Lin4Lii4LmB4LiB4LmJ4LiC4LmJ4Lit4Lih4Li54Lil4LmE4LiU4LmJICcgKwogICAgJ+C4leC4seC5ieC4h+C4quC4tOC4l+C4mOC4tOC5jOC5geC4ouC4geC4o+C4suC4ouC4hOC4mSDguYHguKXg',
  'uLDguKPguLDguIfguLHguJrguYTguJTguYnguJfguLjguIHguYDguKHguLfguYjguK08L3A+JyArCiAgICAnPGRpdiBjbGFzcz0idHcgbXQxMiI+PHRhYmxlIGNsYXNzPSJ0Ij48dGhlYWQ+PHRyPicgKwogICAgICAnPHRoPuC4iuC4t+C5iOC4reC4nOC4ueC5ieC5',
  'g+C4iuC5iTwvdGg+PHRoPuC4iuC4t+C5iOC4reC4l+C4teC5iOC5geC4quC4lOC4hzwvdGg+PHRoPuC4quC4tOC4l+C4mOC4tOC5jDwvdGg+PHRoPuC4quC4luC4suC4meC4sDwvdGg+PHRoPuC5gOC4guC5ieC4suC4peC5iOC4suC4quC4uOC4lDwvdGg+JyArCiAg',
  'ICAgICc8dGggY2xhc3M9Im51bSI+4Lit4Li44Lib4LiB4Lij4LiT4LmMPC90aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgdXNlcnMubWFwKGZ1bmN0aW9uKHUpewogICAgICB2YXIgbWVOb3cgPSAoQVVUSC5tZSAmJiBBVVRILm1lLnVzZXJu',
  'YW1lKSA9PT0gdS51c2VybmFtZTsKICAgICAgcmV0dXJuICc8dHI+JyArCiAgICAgICAgJzx0ZD48Yj4nICsgZXNjKHUudXNlcm5hbWUpICsgJzwvYj4nICsgKG1lTm93ID8gJyA8c3BhbiBjbGFzcz0iYiBpbmZvIj7guITguLjguJM8L3NwYW4+JyA6ICcnKSArICc8',
  'L3RkPicgKwogICAgICAgICc8dGQ+JyArIGVzYyh1Lm5hbWUgfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZD4nICsgcm9sZUJhZGdlKHUucm9sZSkgKyAnPC90ZD4nICsKICAgICAgICAnPHRkPicgKyBzdGF0dXNCYWRnZSh1LnN0YXR1cykgKyAodS5s',
  'b2NrZWQgPyAnIDxzcGFuIGNsYXNzPSJiIGRnciI+4LiW4Li54LiB4Lil4LmH4Lit4LiB4LiK4Lix4LmI4Lin4LiE4Lij4Liy4LinPC9zcGFuPicgOiAnJykgKyAnPC90ZD4nICsKICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgKHUubGFzdExvZ2luID8gdGhE',
  'YXRlU2hvcnQoU3RyaW5nKHUubGFzdExvZ2luKS5zbGljZSgwLDEwKSkgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAodS5kZXZpY2VzIHx8IDApICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0idC1hY3Rpb25z',
  'Ij4nICsKICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImZvcm1Vc2VyKCcgKyBhdHRyKHUpICsgJykiPuC5geC4geC5ieC5hOC4gjwvYnV0dG9uPicgKwogICAgICAgICAgKG1lTm93ID8gJycgOiAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNt',
  'IGRnciIgb25jbGljaz0iZGVsVXNlcihcJycgKyBlc2ModS51c2VybmFtZSkgKyAnXCcpIj7guKXguJo8L2J1dHRvbj4nKSArCiAgICAgICAgJzwvdGQ+PC90cj4nOwogICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicsCiAgICAnPGJ1dHRv',
  'biBjbGFzcz0iYnRuIHByaSBzbSIgb25jbGljaz0iZm9ybVVzZXIoKSI+KyDguYDguJ7guLTguYjguKHguJzguLnguYnguYPguIrguYk8L2J1dHRvbj4nKTsKfQoKZnVuY3Rpb24gcm9sZUJhZGdlKHJvbGUpewogIHZhciBjbHMgPSByb2xlID09PSAn4Lic4Li54LmJ',
  '4LiU4Li54LmB4LilJyA/ICdvaycgOiAocm9sZSA9PT0gJ+C5geC4geC5ieC5hOC4guC5hOC4lOC5iScgPyAnaW5mbycgOiAnbXV0ZScpOwogIHJldHVybiAnPHNwYW4gY2xhc3M9ImIgJyArIGNscyArICciPicgKyBlc2Mocm9sZSkgKyAnPC9zcGFuPic7Cn0KCi8v',
  'IOC4q+C4oeC4suC4ouC5gOC4q+C4leC4uDog4LmD4LiK4LmJIGF0dHIoKSDguJXguLHguKfguYDguJTguLXguKLguKfguIHguLHguJrguJfguLXguYggVmlld3MuaHRtbCDguJvguKPguLDguIHguLLguKjguYTguKfguYkKLy8g4LmA4LiE4Lii4Lib4Lij4Liw4LiB',
  '4Liy4Lio4LiK4Li34LmI4Lit4LiL4LmJ4Liz4LmE4Lin4LmJ4LiV4Lij4LiH4LiZ4Li14LmJ4LiE4Lij4Lix4LmJ4LiH4Lir4LiZ4Li24LmI4LiHIOC5geC4peC5ieC4p+C5hOC4m+C4l+C4seC4muC4guC4reC4h+C5gOC4lOC4tOC4oeC4iOC4meC4m+C4uOC5iOC4',
  'oeC5geC4geC5ieC5hOC4guC4l+C4seC5ieC4h+C4o+C4sOC4muC4muC4nuC4seC4hwovLyAo4Lif4Lit4Lij4LmM4Lih4LiC4Li24LmJ4LiZ4Lin4LmI4Liy4LiHIOC5geC4peC4sOC4geC4lOC4muC4seC4meC4l+C4tuC4geC4geC4peC4suC4ouC5gOC4m+C5h+C4',
  'meC4quC4o+C5ieC4suC4h+C4o+C4suC4ouC4geC4suC4o+C5g+C4q+C4oeC5iOC5geC4l+C4meC4geC4suC4o+C5geC4geC5ieC4guC4reC4h+C5gOC4lOC4tOC4oSkKCmZ1bmN0aW9uIGZvcm1Vc2VyKGpzb24pewogIHZhciB1ID0ganNvbiA/ICh0eXBlb2YganNv',
  'biA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKGpzb24pIDoganNvbikgOiB7fTsKICB2YXIgaXNOZXcgPSAhdS51c2VybmFtZTsKCiAgb3BlbkZvcm0oewogICAgdGl0bGU6IGlzTmV3ID8gJ+C5gOC4nuC4tOC5iOC4oeC4nOC4ueC5ieC5g+C4iuC5ieC5g+C4q+C4',
  'oeC5iCcgOiAn4LmB4LiB4LmJ4LmE4LiC4Lic4Li54LmJ4LmD4LiK4LmJICcgKyB1LnVzZXJuYW1lLAogICAgYWN0aW9uOiAndXNlci5zYXZlJywKICAgIHJlY29yZDogT2JqZWN0LmFzc2lnbih7IGlkOiBpc05ldyA/ICcnIDogdS51c2VybmFtZSwgcm9sZTogJ+C4',
  'lOC4ueC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pycsIHN0YXR1czogJ+C5g+C4iuC5ieC4h+C4suC4mScgfSwgdSksCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3VzZXJuYW1lJywgbGFiZWw6J+C4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5iSAo',
  '4Lig4Liy4Lip4Liy4Lit4Lix4LiH4LiB4Lik4LipKScsIHJlcXVpcmVkOmlzTmV3LCBwaDon4LmA4LiK4LmI4LiZIHNvbWNoYWknLAogICAgICAgIGhpbnQ6IGlzTmV3ID8gJ2EteiAwLTkgLiBfIC0g4Lii4Liy4LinIDPigJMyNCDguJXguLHguKcgwrcg4LmA4Lib',
  '4Lil4Li14LmI4Lii4LiZ4Lig4Liy4Lii4Lir4Lil4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJJyA6ICfguYDguJvguKXguLXguYjguKLguJnguIrguLfguYjguK3guJzguLnguYnguYPguIrguYnguYTguKHguYjguYTguJTguYknIH0sCiAgICAgIHsga2V5OiduYW1l',
  'JywgbGFiZWw6J+C4iuC4t+C5iOC4reC4l+C4teC5iOC5geC4quC4lOC4hycsIHJlcXVpcmVkOnRydWUsIHBoOifguYDguIrguYjguJkg4Liq4Lih4LiK4Liy4LiiJyB9LAogICAgICB7IGtleToncm9sZScsIGxhYmVsOifguKrguLTguJfguJjguLTguYzguIHguLLg',
  'uKPguYPguIrguYnguIfguLLguJknLCB0eXBlOidzZWxlY3QnLCBibGFuazpmYWxzZSwgcmVxdWlyZWQ6dHJ1ZSwKICAgICAgICBvcHRpb25zOlsn4LiU4Li54Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinJywn4LmB4LiB4LmJ4LmE4LiC4LmE4LiU4LmJJywn',
  '4Lic4Li54LmJ4LiU4Li54LmB4LilJ10sCiAgICAgICAgaGludDon4LiU4Li54Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinID0g4LmA4Lib4Li04LiU4LiU4Li54LmE4LiU4LmJ4LiX4Li44LiB4Lir4LiZ4LmJ4LiyIMK3IOC5geC4geC5ieC5hOC4guC5hOC4',
  'lOC5iSA9IOC5gOC4nuC4tOC5iOC4oS/guYHguIHguYkv4Lil4Lia4LiC4LmJ4Lit4Lih4Li54LilIMK3IOC4nOC4ueC5ieC4lOC4ueC5geC4pSA9IOC4iOC4seC4lOC4geC4suC4o+C4nOC4ueC5ieC5g+C4iuC5ieC5geC4peC4sOC4geC4suC4o+C4leC4seC5ieC4',
  'h+C4hOC5iOC4suC5hOC4lOC5ieC4lOC5ieC4p+C4oicgfSwKICAgICAgeyBrZXk6J3Bhc3N3b3JkJywgbGFiZWw6IGlzTmV3ID8gJ+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC5gOC4o+C4tOC5iOC4oeC4leC5ieC4mScgOiAn4LiV4Lix4LmJ4LiH4Lij4Lir4Lix',
  '4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmIICjguYDguKfguYnguJnguKfguYjguLLguIcgPSDguYTguKHguYjguYDguJvguKXguLXguYjguKLguJkpJywKICAgICAgICByZXF1aXJlZDppc05ldywgcGg6J+C4reC4ouC5iOC4suC4h+C4meC5ieC4reC4oiA4IOC4',
  'leC4seC4p+C4reC4seC4geC4qeC4oycsCiAgICAgICAgaGludDon4LiI4LiU4LmE4Lin4LmJ4Liq4LmI4LiH4LmD4Lir4LmJ4LmA4LiI4LmJ4Liy4LiV4Lix4LinIOKAlCDguKPguLDguJrguJrguYDguIHguYfguJrguYHguJrguJrguYDguILguYnguLLguKPguKvg',
  'uLHguKog4LmA4Lib4Li04LiU4LiU4Li54Lii4LmJ4Lit4LiZ4Lir4Lil4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJJyB9LAogICAgICB7IGtleTonbXVzdENoYW5nZScsIGxhYmVsOifguYPguKvguYnguYDguJvguKXguLXguYjguKLguJnguKPguKvguLHguKrguJzg',
  'uYjguLLguJnguJXguK3guJnguYDguILguYnguLLguITguKPguLHguYnguIfguYHguKPguIEnLCB0eXBlOidzZWxlY3QnLCBibGFuazpmYWxzZSwKICAgICAgICBvcHRpb25zOlt7dmFsdWU6J3RydWUnLGxhYmVsOifguYPguIrguYggKOC5geC4meC4sOC4meC4sykn',
  'fSx7dmFsdWU6J2ZhbHNlJyxsYWJlbDon4LmE4Lih4LmI4LiV4LmJ4Lit4LiHJ31dIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0JywgYmxhbms6ZmFsc2UsIG9wdGlvbnM6WyfguYPguIrguYnguIfg',
  'uLLguJknLCfguKPguLDguIfguLHguJonXSwKICAgICAgICBoaW50OifguKPguLDguIfguLHguJogPSDguYDguILguYnguLLguKPguLDguJrguJrguYTguKHguYjguYTguJTguYnguJfguLHguJnguJfguLUg4LmB4LiV4LmI4Lii4Lix4LiH4LmA4LiB4LmH4Lia4Lia',
  '4Lix4LiN4LiK4Li14LmE4Lin4LmJJyB9LAogICAgICB7IGtleTonbm90ZScsIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdLAogICAgd2lkZTogdHJ1ZQogIH0pOwoKICAvLyDguIrguLfg',
  'uYjguK3guJzguLnguYnguYPguIrguYnguYDguJvguKXguLXguYjguKLguJnguYTguKHguYjguYTguJTguYkg4Lil4LmH4Lit4LiB4LiK4LmI4Lit4LiH4LmE4Lin4LmJ4LmA4Lil4Lii4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4LmA4LiC4LmJ4Liy4LmD4LiI4Lic',
  '4Li04LiUCiAgaWYgKCFpc05ldykgewogICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfdXNlcm5hbWUnKTsKICAgIGlmIChlbCkgeyBlbC5yZWFkT25seSA9IHRydWU7IGVsLnN0eWxlLmJhY2tncm91bmQgPSAndmFyKC0tc3VyZmFjZS0yKSc7',
  'IH0KICB9Cn0KCmZ1bmN0aW9uIGRlbFVzZXIodXNlcm5hbWUpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4nOC4ueC5ieC5g+C4iuC5iSAiJyArIHVzZXJuYW1lICsgJyIg4LmD4LiK4LmI4LmE4Lir4LihIOKAlCDguYDguILguYnguLLguKPguLDguJrguJrguYTg',
  'uKHguYjguYTguJTguYnguK3guLXguIHguJfguLHguJnguJfguLUnLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgndXNlci5kZWxldGUnLCB7IHVzZXJuYW1lOiB1c2VybmFtZSB9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICAgIHRvYXN0KCfguKXguJrguJzguLnguYng',
  'uYPguIrguYnguYHguKXguYnguKcnLCAnb2snKTsKICAgICAgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7IH0pOwogIH0pOwp9CgovKiAtLS0tIOC4peC4tOC4h+C4geC5',
  'jOC5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4mSAtLS0tICovCgpmdW5jdGlvbiBzZXR0aW5nc1NoYXJlQ2FyZChsaW5rcyl7CiAgaWYgKCFsaW5rcyB8fCAhbGlua3MuYXBwVXJsKSB7CiAgICByZXR1cm4gY2FyZCgn8J+UlyDguKXguLTguIfguIHguYzguYDg',
  'uILguYnguLLguYPguIrguYnguIfguLLguJknLAogICAgICAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C4q+C4suC4peC4tOC4h+C4geC5jOC4iOC4o+C4tOC4h+C5hOC4oeC5iOC5gOC4iOC4rSDigJQg4LmA4Lib4Li04LiU4LmA4Lin4LmH4Lia4LmB4Lit',
  '4Lib4LiI4Liy4LiB4Lil4Li04LiH4LiB4LmM4LiX4Li14LmI4Lil4LiH4LiX4LmJ4Liy4LiiIC9leGVjIOC4quC4seC4geC4hOC4o+C4seC5ieC4hyDguYHguKXguYnguKfguKPguLDguJrguJrguIjguLDguIjguLPguYPguKvguYnguYDguK3guIc8L2Rpdj4nKTsK',
  'ICB9CiAgcmV0dXJuIGNhcmQoJ/CflJcg4Lil4Li04LiH4LiB4LmM4LmA4LiC4LmJ4Liy4LmD4LiK4LmJ4LiH4Liy4LiZJywKICAgICc8ZGl2IGNsYXNzPSJmIG1iMTIiPjxsYWJlbD7guKXguLTguIfguIHguYzguKvguKXguLHguIEg4oCUIOC4quC5iOC4h+C5g+C4',
  'q+C5ieC4l+C4uOC4geC4hOC4meC5hOC4lOC5iSAo4LmA4LiC4LmJ4Liy4LiU4LmJ4Lin4Lii4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmB4Lil4Liw4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZKTwvbGFiZWw+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9',
  'ImlucCIgaWQ9ImFwcFVybCIgcmVhZG9ubHkgdmFsdWU9IicgKyBlc2MobGlua3MuYXBwVXJsKSArICciIG9uY2xpY2s9InRoaXMuc2VsZWN0KCkiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InJvdyBtYjEyIj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0',
  'biBwcmkiIG9uY2xpY2s9ImNvcHlGaWVsZChcJ2FwcFVybFwnKSI+8J+TiyDguITguLHguJTguKXguK3guIHguKXguLTguIfguIHguYzguKvguKXguLHguIE8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+JyArCiAg',
  'ICAnPGRpdiBjbGFzcz0iZiBtYjEyIj48bGFiZWw+8J+RgCDguKXguLTguIfguIHguYzguJTguLnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKfguYHguJrguJrguYTguKHguYjguJXguYnguK3guIfguKXguYfguK3guIHguK3guLTguJk8L2xhYmVsPicgKwog',
  'ICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJzaGFyZVVybCIgcmVhZG9ubHkgdmFsdWU9IicgKyBlc2MobGlua3Mudmlld1VybCkgKyAnIiBvbmNsaWNrPSJ0aGlzLnNlbGVjdCgpIj48L2Rpdj4nICsKICAgICc8cCBjbGFzcz0iZnMxMiAnICsgKGxpbmtzLnNo',
  'YXJlRW5hYmxlZCA/ICdtdXRlZCcgOiAnd2Fybi10ZXh0JykgKyAnIj4nICsKICAgICAgKGxpbmtzLnNoYXJlRW5hYmxlZAogICAgICAgID8gJ+C5gOC4m+C4tOC4lOC4reC4ouC4ueC5iCDigJQg4LmD4LiE4Lij4LiB4LmH4LiV4Liy4Lih4LiX4Li14LmI4Lih4Li1',
  '4Lil4Li04LiH4LiB4LmM4LiZ4Li14LmJ4LmA4Lib4Li04LiU4LiU4Li54LiC4LmJ4Lit4Lih4Li54Lil4LmE4LiU4LmJ4LmC4LiU4Lii4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4Lil4LmH4Lit4LiB4Lit4Li04LiZJwogICAgICAgIDogJ+KaoO+4jyDguJvguLTguJTg',
  'uK3guKLguLnguYgg4oCUIOC4peC4tOC4h+C4geC5jOC4meC4teC5ieC4ouC4seC4h+C5g+C4iuC5ieC5hOC4oeC5iOC5hOC4lOC5iSDguYDguJvguLTguJTguKrguKfguLTguJXguIrguYzguYTguJTguYnguJfguLXguYjguKvguLHguKfguILguYnguK0gIuC4hOC4',
  'p+C4suC4oeC4m+C4peC4reC4lOC4oOC4seC4ouC5geC4peC4sOC4geC4suC4o+C5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4mSIg4LiU4LmJ4Liy4LiZ4Lia4LiZJykgKwogICAgJzwvcD4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQxMiI+JyArCiAgICAg',
  'ICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNvcHlGaWVsZChcJ3NoYXJlVXJsXCcpIj7wn5OLIOC4hOC4seC4lOC4peC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jDwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIGRnciIg',
  'b25jbGljaz0iZG9Sb3RhdGVTaGFyZSgpIj7wn5SBIOC4reC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC5g+C4q+C4oeC5iDwvYnV0dG9uPicgKwogICAgJzwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImhyIj48L2Rpdj4nICsKICAgICc8cCBjbGFz',
  'cz0iZnMxMiBtdXRlZCI+8J+GmCDguKXguLTguIfguIHguYzguIHguLnguYnguKPguLDguJrguJogKOC5g+C4iuC5ieC4leC4reC4meC4peC4t+C4oeC4o+C4q+C4seC4quC4nOC5iOC4suC4meC4iOC4meC5gOC4guC5ieC4suC5hOC4oeC5iOC5hOC4lOC5iSDigJQg',
  '4Lir4LmJ4Liy4Lih4Liq4LmI4LiH4LiV4LmI4LitKTxicj4nICsKICAgICc8Y29kZSBjbGFzcz0iZnMxMiI+JyArIGVzYyhsaW5rcy5hZG1pblVybCkgKyAnPC9jb2RlPjwvcD4nKTsKfQoKZnVuY3Rpb24gY29weUZpZWxkKGlkKXsKICB2YXIgZWwgPSBkb2N1bWVu',
  'dC5nZXRFbGVtZW50QnlJZChpZCk7CiAgaWYgKCFlbCkgcmV0dXJuOwogIGVsLnNlbGVjdCgpOwogIHRyeSB7IGRvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7IHRvYXN0KCfguITguLHguJTguKXguK3guIHguYHguKXguYnguKcnLCAnb2snKTsgfQogIGNhdGNo',
  'IChlKSB7IHRvYXN0KCfguIHguJTguITguYnguLLguIfguJfguLXguYjguIrguYjguK3guIfguYHguKXguYnguKfguYDguKXguLfguK3guIEg4LiE4Lix4LiU4Lil4Lit4LiBJywgJ2VycicpOyB9Cn0KPC9zY3JpcHQ+CjxzY3JpcHQ+Ci8qID09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBGb3Jtcy5odG1sIOKAlCDguJ/guK3guKPguYzguKHguYDguJ7guLTguYjguKEv4LmB4LiB4LmJ4LmE4LiCIOC5geC4peC4sOC4geC4suC4o+C4peC4mgogICA9PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCnZhciBGT1JNID0gewogIHNwZWNzOiBbXSwgICAgICAgLy8g4Lic4Lix4LiH4LiK4LmI4Lit4LiH4LiB4Lij4Lit4LiB4LiC4Lit4LiH4Lif4Lit4Lij4LmM4Lih4LiX4Li14LmI',
  '4LmA4Lib4Li04LiU4Lit4Lii4Li54LmICiAga2VlcDoge30sICAgICAgICAvLyDguYTguJ/guKXguYzguYHguJnguJrguYDguJTguLTguKHguJfguLXguYjguKLguLHguIfguYTguKHguYjguYTguJTguYnguYDguK3guLLguK3guK3guIEKICBidWNrZXQ6ICdtaXNj',
  'JywgIC8vIOC5guC4n+C4peC5gOC4lOC4reC4o+C5jOC4l+C4teC5iOC4iOC4sOC5gOC4geC5h+C4muC5hOC4n+C4peC5jOC5geC4meC4muC5g+C4q+C4oeC5iAogIG9jcjogbnVsbCwgICAgICAgLy8g4Lic4Lix4LiH4LiB4Liy4Lij4LmA4LiV4Li04Lih4LiE4LmI',
  '4Liy4LiI4Liy4LiB4Lij4Li54LibCiAgcmVjOiBudWxsLCAgICAgICAvLyDguKPguLLguKLguIHguLLguKPguJfguLXguYjguIHguLPguKXguLHguIfguYHguIHguYnguK3guKLguLnguYggKG51bGwgPSDguIHguLPguKXguLHguIfguYDguJ7guLTguYjguKHguKPg',
  'uLLguKLguIHguLLguKPguYPguKvguKHguYgpCiAgbGluZXM6IFtdLCAgICAgICAvLyDguKPguLLguKLguIHguLLguKPguKLguYjguK3guKLguYPguJnguJrguLTguKUgKOC5g+C4iuC5ieC4geC4seC4muC4iuC5iOC4reC4h+C4iuC4meC4tOC4lCBsaW5lcykKICB0',
  'b2RvOiBbXSwgICAgICAgIC8vIOC5gOC4iuC5h+C4hOC4peC4tOC4quC4leC5jOC4h+C4suC4meC4i+C5iOC4reC4oSAo4LmD4LiK4LmJ4LiB4Lix4Lia4LiK4LmI4Lit4LiH4LiK4LiZ4Li04LiUIHRvZG8pCiAgdG9kb09wdGlvbnM6IFtdICAvLyDguJXguLHguKfg',
  'uYDguKXguLfguK3guIHguJvguKPguLDguYDguKDguJfguIfguLLguJnguILguK3guIfguYHguJXguYjguKXguLDguILguYnguK0KfTsKCi8qIC0tLS0tLS0tLS0tLS0tLS0gZm9ybSBlbmdpbmUgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gZmllbGRzSHRt',
  'bChzcGVjcywgcmVjKXsKICByZWMgPSByZWMgfHwge307CiAgRk9STS5zcGVjcyA9IHNwZWNzOwogIEZPUk0ua2VlcCA9IHt9OwogIHJldHVybiAnPGRpdiBjbGFzcz0iZmdyaWQiPicgKyBzcGVjcy5tYXAoZnVuY3Rpb24oZil7CiAgICB2YXIgdiA9IHJlY1tmLmtl',
  'eV07CiAgICB2YXIgaWQgPSAnZl8nICsgZi5rZXk7CiAgICB2YXIgaW5uZXI7CgogICAgaWYgKGYudHlwZSA9PT0gJ3NlbGVjdCcpIHsKICAgICAgdmFyIG9wdHMgPSAoZi5vcHRpb25zIHx8IFtdKS5tYXAoZnVuY3Rpb24obyl7CiAgICAgICAgdmFyIHZhbCA9IHR5',
  'cGVvZiBvID09PSAnb2JqZWN0JyA/IG8udmFsdWUgOiBvOwogICAgICAgIHZhciBsYWIgPSB0eXBlb2YgbyA9PT0gJ29iamVjdCcgPyBvLmxhYmVsIDogbzsKICAgICAgICByZXR1cm4gJzxvcHRpb24gdmFsdWU9IicgKyBlc2ModmFsKSArICciJyArIChTdHJpbmco',
  'dikgPT09IFN0cmluZyh2YWwpID8gJyBzZWxlY3RlZCcgOiAnJykgKyAnPicgKyBlc2MobGFiKSArICc8L29wdGlvbj4nOwogICAgICB9KS5qb2luKCcnKTsKICAgICAgaW5uZXIgPSAnPHNlbGVjdCBjbGFzcz0ic2VsIiBpZD0iJyArIGlkICsgJyI+JyArIChmLmJs',
  'YW5rICE9PSBmYWxzZSA/ICc8b3B0aW9uIHZhbHVlPSIiPuKAlCDguYDguKXguLfguK3guIEg4oCUPC9vcHRpb24+JyA6ICcnKSArIG9wdHMgKyAnPC9zZWxlY3Q+JzsKCiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ3RleHRhcmVhJykgewogICAgICBpbm5lciA9',
  'ICc8dGV4dGFyZWEgY2xhc3M9InRhIiBpZD0iJyArIGlkICsgJyIgcGxhY2Vob2xkZXI9IicgKyBlc2MoZi5waHx8JycpICsgJyI+JyArIGVzYyh2fHwnJykgKyAnPC90ZXh0YXJlYT4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnZmlsZXMnKSB7CiAgICAg',
  'IEZPUk0ua2VlcFtmLmtleV0gPSAocmVjW2Yua2V5XSAmJiByZWNbZi5rZXldLmxlbmd0aCkgPyBbXS5jb25jYXQocmVjW2Yua2V5XSkgOiBbXTsKICAgICAgaW5uZXIgPQogICAgICAgICc8ZGl2IGlkPSInICsgaWQgKyAnX2V4aXN0aW5nIj4nICsgZXhpc3RpbmdG',
  'aWxlc0h0bWwoZi5rZXkpICsgJzwvZGl2PicgKwogICAgICAgICc8bGFiZWwgY2xhc3M9ImZpbGUtZHJvcCIgZm9yPSInICsgaWQgKyAnIj7wn5OOIOC5geC4leC4sOC5gOC4nuC4t+C5iOC4reC5gOC4peC4t+C4reC4geC5hOC4n+C4peC5jCAo4LmA4Lil4Li34Lit',
  '4LiB4LmE4LiU4LmJ4Lir4Lil4Liy4Lii4LmE4Lif4Lil4LmMIMK3IOC5hOC4oeC5iOC5gOC4geC4tOC4mSAxMiBNQiDguJXguYjguK3guYTguJ/guKXguYwpJyArCiAgICAgICAgJzxpbnB1dCB0eXBlPSJmaWxlIiBpZD0iJyArIGlkICsgJyIgbXVsdGlwbGUgYWNj',
  'ZXB0PSJpbWFnZS8qLGFwcGxpY2F0aW9uL3BkZiIgc3R5bGU9ImRpc3BsYXk6bm9uZSIgJyArCiAgICAgICAgJ29uY2hhbmdlPSJwcmV2aWV3UGlja2VkKHRoaXMsXCcnICsgaWQgKyAnXCcpIj48L2xhYmVsPicgKwogICAgICAgICc8ZGl2IGlkPSInICsgaWQgKyAn',
  'X3ByZXZpZXciIGNsYXNzPSJ0aHVtYnMgbXQ4Ij48L2Rpdj4nICsKICAgICAgICAnPGRpdiBpZD0iJyArIGlkICsgJ19vY3IiPjwvZGl2Pic7CgogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICd0b2RvJykgewogICAgICBGT1JNLnRvZG8gPSBwYXJzZVRvZG9UZXh0',
  'KHYpOwogICAgICBGT1JNLnRvZG9PcHRpb25zID0gZi5vcHRpb25zIHx8IFtdOwogICAgICBpbm5lciA9ICc8ZGl2IGlkPSInICsgaWQgKyAnIiBjbGFzcz0idG9kbyI+JyArIHRvZG9UYWJsZUh0bWwoKSArICc8L2Rpdj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBl',
  'ID09PSAnbGluZXMnKSB7CiAgICAgIEZPUk0ubGluZXMgPSBwYXJzZUxpbmVzVGV4dCh2KTsKICAgICAgaW5uZXIgPSAnPGRpdiBpZD0iJyArIGlkICsgJyIgY2xhc3M9ImxpbmVzIj4nICsgbGluZXNUYWJsZUh0bWwoKSArICc8L2Rpdj4nOwoKICAgIH0gZWxzZSBp',
  'ZiAoZi50eXBlID09PSAnY29tcHV0ZWQnKSB7CiAgICAgIGlubmVyID0gJzxkaXYgY2xhc3M9ImlucCIgaWQ9IicgKyBpZCArICciIHN0eWxlPSJiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Zm9udC13ZWlnaHQ6NjAwOycgKwogICAgICAgICAgICAgICdmb250',
  'LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7Y3Vyc29yOmRlZmF1bHQiPjA8L2Rpdj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnZGF0ZScpIHsKICAgICAgaW5uZXIgPSAnPGlucHV0IHR5cGU9ImRhdGUiIGNsYXNzPSJpbnAiIGlkPSInICsgaWQg',
  'KyAnIiB2YWx1ZT0iJyArIGVzYyh2IHx8ICcnKSArICciPic7CgogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICdudW1iZXInIHx8IGYudHlwZSA9PT0gJ21vbmV5JykgewogICAgICBpbm5lciA9ICc8aW5wdXQgdHlwZT0ibnVtYmVyIiBzdGVwPSInICsgKGYudHlw',
  'ZSA9PT0gJ21vbmV5JyA/ICcwLjAxJyA6ICcxJykgKyAnIiBjbGFzcz0iaW5wIiBpZD0iJyArIGlkICsgJyIgJyArCiAgICAgICAgICAgICAgJ3ZhbHVlPSInICsgKHYgPT0gbnVsbCB8fCB2ID09PSAnJyA/ICcnIDogZXNjKHYpKSArICciIHBsYWNlaG9sZGVyPSIn',
  'ICsgZXNjKGYucGh8fCcnKSArICciIGlucHV0bW9kZT0iZGVjaW1hbCInICsKICAgICAgICAgICAgICAoZi5zdW1zID8gJyBvbmlucHV0PSJyZWNhbGNTdW1zKCkiJyA6IChmLm9uaW5wdXQgPyAnIG9uaW5wdXQ9IicgKyBlc2MoZi5vbmlucHV0KSArICciJyA6ICcn',
  'KSkgKyAnPic7CgogICAgfSBlbHNlIHsKICAgICAgaW5uZXIgPSAnPGlucHV0IHR5cGU9InRleHQiIGNsYXNzPSJpbnAiIGlkPSInICsgaWQgKyAnIiB2YWx1ZT0iJyArIGVzYyh2IHx8ICcnKSArICciIHBsYWNlaG9sZGVyPSInICsgZXNjKGYucGh8fCcnKSArICci',
  'Pic7CiAgICB9CgogICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJmJyArIChmLmZ1bGwgPyAnIGZ1bGwnIDogJycpICsgJyI+JyArCiAgICAgICc8bGFiZWwgZm9yPSInICsgaWQgKyAnIj4nICsgZXNjKGYubGFiZWwpICsgKGYucmVxdWlyZWQgPyAnIDxzcGFuIHN0eWxl',
  'PSJjb2xvcjp2YXIoLS1kYW5nZXIpIj4qPC9zcGFuPicgOiAnJykgKyAnPC9sYWJlbD4nICsKICAgICAgaW5uZXIgKyAoZi5oaW50ID8gJzxkaXYgY2xhc3M9ImhpbnQiPicgKwogICAgICAgIChmLmhpbnQuY2hhckF0KDApID09PSAnPCcgPyBmLmhpbnQgOiBlc2Mo',
  'Zi5oaW50KSkgKyAnPC9kaXY+JyA6ICcnKSArICc8L2Rpdj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguYDguIrguYfguITguKXg',
  'uLTguKrguJXguYzguIfguLLguJnguIvguYjguK3guKEg4oCUIOC5gOC4guC5ieC4suC4i+C5iOC4reC4oeC4hOC4o+C4seC5ieC4h+C5gOC4lOC4teC4ouC4p+C4oeC4seC4geC4i+C5iOC4reC4oeC4q+C4peC4suC4ouC4iOC4uOC4lAoKICAg4LmA4LiB4LmH4Lia',
  '4Lil4LiH4LiK4Li14LiV4Lia4Lij4Lij4LiX4Lix4LiU4Lil4Liw4LiH4Liy4LiZICBbeF0g4LiK4Li34LmI4Lit4LiH4Liy4LiZIHwg4Lib4Lij4Liw4LmA4Lig4LiX4LiH4Liy4LiZCiAgICjguKPguLnguJvguYHguJrguJrguYDguJTguLXguKLguKfguIHguLHg',
  'uJogcGFyc2VUb2RvXyDguJ3guLHguYjguIfguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYwg4oCUIOC5geC4geC5ieC4l+C4teC5iOC5hOC4q+C4meC4leC5ieC4reC4h+C5geC4geC5ieC5g+C4q+C5ieC4leC4o+C4h+C4geC4seC4mSkKICAgPT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgpmdW5jdGlvbiBwYXJzZVRvZG9UZXh0KHRleHQpewogIHZhciByYXcgPSBTdHJpbmcodGV4dCA9PSBudWxsID8gJycgOiB0ZXh0KTsKICBpZiAoIXJhdy50cmlt',
  'KCkpIHJldHVybiBbXTsKICB2YXIgbGluZXMgPSByYXcuc3BsaXQoL1xyP1xuLykubWFwKGZ1bmN0aW9uKGwpeyByZXR1cm4gbC50cmltKCk7IH0pLmZpbHRlcihCb29sZWFuKTsKCiAgLy8g4LiC4Lit4LiH4LmA4LiU4Li04Lih4LmA4LiC4Li14Lii4LiZ4Lij4Lin',
  '4Lih4Lia4Lij4Lij4LiX4Lix4LiU4LmA4LiU4Li14Lii4Lin4Lin4LmI4LiyICIxLuC4ouC4suC5geC4meC4pyAyLuC5gOC4geC5h+C4muC4quC4teC4q+C5ieC4reC4hyIKICBpZiAobGluZXMubGVuZ3RoID09PSAxICYmIC9cZFxzKlsuKV0vLnRlc3QobGluZXNb',
  'MF0pICYmIGxpbmVzWzBdLmNoYXJBdCgwKSAhPT0gJ1snKSB7CiAgICBsaW5lcyA9IGxpbmVzWzBdLnNwbGl0KC9ccypcZCtccypbLildXHMqLykubWFwKGZ1bmN0aW9uKHgpeyByZXR1cm4geC50cmltKCk7IH0pLmZpbHRlcihCb29sZWFuKTsKICB9CgogIHJldHVy',
  'biBsaW5lcy5tYXAoZnVuY3Rpb24obGluZSl7CiAgICB2YXIgZG9uZSA9IGZhbHNlOwogICAgdmFyIG0gPSBsaW5lLm1hdGNoKC9eXFtccyooW3hY4pyTXSk/XHMqXF1ccyooLiopJC8pOwogICAgaWYgKG0pIHsgZG9uZSA9ICEhbVsxXTsgbGluZSA9IG1bMl07IH0K',
  'ICAgIGxpbmUgPSBsaW5lLnJlcGxhY2UoL15cZCtccypbLildXHMqLywgJycpLnRyaW0oKTsKICAgIHZhciBhID0gbGluZS5zcGxpdCgnfCcpOwogICAgcmV0dXJuIHsgZG9uZTogZG9uZSwgbmFtZTogKGFbMF0gfHwgJycpLnRyaW0oKSwgY2F0ZWdvcnk6IChhWzFd',
  'IHx8ICcnKS50cmltKCkgfTsKICB9KS5maWx0ZXIoZnVuY3Rpb24odCl7IHJldHVybiB0Lm5hbWU7IH0pOwp9CgpmdW5jdGlvbiBmb3JtYXRUb2RvVGV4dChsaXN0KXsKICByZXR1cm4gKGxpc3QgfHwgW10pCiAgICAuZmlsdGVyKGZ1bmN0aW9uKHQpeyByZXR1cm4g',
  'U3RyaW5nKHQubmFtZSB8fCAnJykudHJpbSgpOyB9KQogICAgLm1hcChmdW5jdGlvbih0KXsKICAgICAgdmFyIG5tID0gU3RyaW5nKHQubmFtZSkucmVwbGFjZSgvXHwvZywgJy8nKS50cmltKCk7CiAgICAgIHZhciBjdCA9IFN0cmluZyh0LmNhdGVnb3J5IHx8ICcn',
  'KS5yZXBsYWNlKC9cfC9nLCAnLycpLnRyaW0oKTsKICAgICAgcmV0dXJuICdbJyArICh0LmRvbmUgPyAneCcgOiAnICcpICsgJ10gJyArIG5tICsgKGN0ID8gJyB8ICcgKyBjdCA6ICcnKTsKICAgIH0pLmpvaW4oJ1xuJyk7Cn0KCmZ1bmN0aW9uIHRvZG9Eb25lKCl7',
  'IHJldHVybiAoRk9STS50b2RvIHx8IFtdKS5maWx0ZXIoZnVuY3Rpb24odCl7IHJldHVybiB0LmRvbmU7IH0pLmxlbmd0aDsgfQoKZnVuY3Rpb24gdG9kb1RhYmxlSHRtbCgpewogIHZhciBvcHRzID0gRk9STS50b2RvT3B0aW9ucyB8fCBbXTsKICB2YXIgcm93cyA9',
  'IChGT1JNLnRvZG8gfHwgW10pLm1hcChmdW5jdGlvbih0LCBpKXsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0idG9kby1yb3cnICsgKHQuZG9uZSA/ICcgZG9uZScgOiAnJykgKyAnIj4nICsKICAgICAgJzxsYWJlbCBjbGFzcz0idG9kby1jaGVjayIgdGl0bGU9Iicg',
  'KyAodC5kb25lID8gJ+C4l+C4s+C5gOC4quC4o+C5h+C4iOC5geC4peC5ieC4pycgOiAn4Lii4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJ4LiX4LizJykgKyAnIj4nICsKICAgICAgICAnPGlucHV0IHR5cGU9ImNoZWNrYm94IicgKyAodC5kb25lID8gJyBjaGVja2Vk',
  'JyA6ICcnKSArICcgb25jaGFuZ2U9InNldFRvZG8oJyArIGkgKyAnLFwnZG9uZVwnLHRoaXMuY2hlY2tlZCkiPicgKwogICAgICAnPC9sYWJlbD4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBwbGFjZWhvbGRlcj0i4LiH4Liy4LiZ4LiX4Li14LmI4LiV4LmJ',
  '4Lit4LiH4LiL4LmI4Lit4LihIiB2YWx1ZT0iJyArIGVzYyh0Lm5hbWUgfHwgJycpICsgJyIgJyArCiAgICAgICAgJ29uaW5wdXQ9InNldFRvZG8oJyArIGkgKyAnLFwnbmFtZVwnLHRoaXMudmFsdWUpIj4nICsKICAgICAgJzxzZWxlY3QgY2xhc3M9InNlbCIgb25j',
  'aGFuZ2U9InNldFRvZG8oJyArIGkgKyAnLFwnY2F0ZWdvcnlcJyx0aGlzLnZhbHVlKSI+JyArCiAgICAgICAgJzxvcHRpb24gdmFsdWU9IiI+4oCUIOC4m+C4o+C4sOC5gOC4oOC4l+C4h+C4suC4mSDigJQ8L29wdGlvbj4nICsKICAgICAgICBvcHRzLm1hcChmdW5j',
  'dGlvbihvKXsKICAgICAgICAgIHJldHVybiAnPG9wdGlvbiB2YWx1ZT0iJyArIGVzYyhvKSArICciJyArIChvID09PSB0LmNhdGVnb3J5ID8gJyBzZWxlY3RlZCcgOiAnJykgKyAnPicgKyBlc2MobykgKyAnPC9vcHRpb24+JzsKICAgICAgICB9KS5qb2luKCcnKSAr',
  'CiAgICAgICc8L3NlbGVjdD4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIGRnciIgdGl0bGU9IuC5gOC4reC4suC4h+C4suC4meC4meC4teC5ieC4reC4reC4gSIgb25jbGljaz0iZGVsVG9kbygnICsgaSArICcpIj7DlzwvYnV0',
  'dG9uPicgKwogICAgJzwvZGl2Pic7CiAgfSkuam9pbignJyk7CgogIHZhciBuID0gKEZPUk0udG9kbyB8fCBbXSkubGVuZ3RoLCBkID0gdG9kb0RvbmUoKTsKICByZXR1cm4gKHJvd3MgfHwgJzxkaXYgY2xhc3M9ImhpbnQiIHN0eWxlPSJwYWRkaW5nOjhweCAycHgi',
  'PuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4h+C4suC4mSDigJQg4LiB4LiUIOKAnOC5gOC4nuC4tOC5iOC4oeC4h+C4suC4meKAnSDguYDguJ7guLfguYjguK3guYPguKrguYjguJfguLXguKXguLDguIjguLjguJTguJfguLXguYjguJXguYnguK3guIfguIvguYjg',
  'uK3guKE8L2Rpdj4nKSArCiAgICAnPGRpdiBjbGFzcz0icm93IG10OCI+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iYWRkVG9kbygpIj4rIOC5gOC4nuC4tOC5iOC4oeC4h+C4suC4mTwvYnV0dG9uPicgKwog',
  'ICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9InBhc3RlVG9kbygpIj7wn5OLIOC4p+C4suC4h+C4l+C4teC5gOC4lOC4teC4ouC4p+C4q+C4peC4suC4ouC4h+C4suC4mTwvYnV0dG9uPicgKwogICAgICAobiA/ICc8ZGl2',
  'IGNsYXNzPSJ0b2RvLWNvdW50Ij7guYDguKrguKPguYfguIjguYHguKXguYnguKcgPGI+JyArIGQgKyAnLycgKyBuICsgJzwvYj4g4LiH4Liy4LiZPC9kaXY+JyA6ICcnKSArCiAgICAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gcmVkcmF3VG9kbygpewogIHZhciBib3gg',
  'PSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9pdGVtcycpOwogIGlmICghYm94KSByZXR1cm47CiAgYm94LmlubmVySFRNTCA9IHRvZG9UYWJsZUh0bWwoKTsKfQoKZnVuY3Rpb24gc2V0VG9kbyhpLCBrZXksIHZhbCl7CiAgaWYgKCFGT1JNLnRvZG9baV0pIHJl',
  'dHVybjsKICBGT1JNLnRvZG9baV1ba2V5XSA9IChrZXkgPT09ICdkb25lJykgPyAhIXZhbCA6IHZhbDsKICBpZiAoa2V5ID09PSAnZG9uZScpIHsgcmVkcmF3VG9kbygpOyByZXR1cm47IH0gICAvLyDguJXguLTguYrguIHguYHguKXguYnguKfguKfguLLguJTguYPg',
  'uKvguKHguYjguYPguKvguYnguILguLXguJTguIbguYjguLLguYDguKvguYfguJnguIrguLHguJQKICB2YXIgYyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNmX2l0ZW1zIC50b2RvLWNvdW50IGInKTsKICBpZiAoYykgYy50ZXh0Q29udGVudCA9IHRvZG9Eb25l',
  'KCkgKyAnLycgKyBGT1JNLnRvZG8ubGVuZ3RoOwp9CgpmdW5jdGlvbiBhZGRUb2RvKCl7CiAgRk9STS50b2RvLnB1c2goeyBkb25lOiBmYWxzZSwgbmFtZTogJycsIGNhdGVnb3J5OiAnJyB9KTsKICByZWRyYXdUb2RvKCk7CiAgdmFyIGlucHV0cyA9IGRvY3VtZW50',
  'LnF1ZXJ5U2VsZWN0b3JBbGwoJyNmX2l0ZW1zIC50b2RvLXJvdyAuaW5wJyk7CiAgaWYgKGlucHV0cy5sZW5ndGgpIGlucHV0c1tpbnB1dHMubGVuZ3RoIC0gMV0uZm9jdXMoKTsKfQoKZnVuY3Rpb24gZGVsVG9kbyhpKXsKICBGT1JNLnRvZG8uc3BsaWNlKGksIDEp',
  'OwogIHJlZHJhd1RvZG8oKTsKfQoKLyoqIOC4p+C4suC4h+C4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4leC5ieC4reC4h+C4i+C5iOC4reC4oeC4l+C4teC5gOC4lOC4teC4ouC4p+C4q+C4peC4suC4ouC4muC4o+C4o+C4l+C4seC4lCDguYHguKXguYnguKfg',
  'uYPguKvguYnguKPguLDguJrguJrguYHguKLguIHguYPguKvguYkgKi8KZnVuY3Rpb24gcGFzdGVUb2RvKCl7CiAgdmFyIGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2RvUGFzdGVXcmFwJyk7CiAgaWYgKGJveCkgeyBib3guaGlkZGVuID0gIWJveC5o',
  'aWRkZW47IGlmICghYm94LmhpZGRlbikgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvZG9QYXN0ZUJveCcpLmZvY3VzKCk7IHJldHVybjsgfQoKICB2YXIgaG9zdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2l0ZW1zJyk7CiAgaWYgKCFob3N0KSByZXR1',
  'cm47CiAgdmFyIHdyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICB3cmFwLmlkID0gJ3RvZG9QYXN0ZVdyYXAnOwogIHdyYXAuY2xhc3NOYW1lID0gJ210OCc7CiAgd3JhcC5pbm5lckhUTUwgPQogICAgJzx0ZXh0YXJlYSBjbGFzcz0idGEiIGlk',
  'PSJ0b2RvUGFzdGVCb3giIHN0eWxlPSJtaW4taGVpZ2h0OjExMHB4IiAnICsKICAgICAgJ3BsYWNlaG9sZGVyPSLguKLguLLguYHguJnguKfguKvguYnguK3guIfguJnguYnguLMmIzEwO+C5gOC4geC5h+C4muC4quC4teC4q+C5ieC4reC4hyYjMTA74LmA4Lib4Lil',
  '4Li14LmI4Lii4LiZ4LiB4LmK4Lit4LiB4LiZ4LmJ4Liz4Lil4LmJ4Liy4LiH4LiI4Liy4LiZIj48L3RleHRhcmVhPicgKwogICAgJzxkaXYgY2xhc3M9ImhpbnQgbXQ4Ij7guJrguKPguKPguJfguLHguJTguKXguLDguKvguJnguLbguYjguIfguIfguLLguJkgwrcg',
  '4Lir4Lij4Li34Lit4Lie4Li04Lih4Lie4LmM4Lij4Lin4Lih4Lia4Lij4Lij4LiX4Lix4LiU4LmA4LiU4Li14Lii4Lin4LmB4Lia4LiaIOKAnDEu4Lii4Liy4LmB4LiZ4LinIDIu4LmA4LiB4LmH4Lia4Liq4Li14Lir4LmJ4Lit4LiH4oCdIOC4geC5h+C5hOC4lOC5',
  'iTxicj4nICsKICAgICAgJ+C5g+C4quC5iOC4m+C4o+C4sOC5gOC4oOC4l+C4h+C4suC4meC4l+C4teC4q+C4peC4seC4h+C4iOC4suC4geC4iuC5iOC4reC4h+C4guC5ieC4suC4hyDguYYg4LmB4LiV4LmI4Lil4Liw4LiH4Liy4LiZPC9kaXY+JyArCiAgICAnPGRp',
  'diBjbGFzcz0icm93IG10OCI+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSBwcmkiIG9uY2xpY2s9ImFwcGx5UGFzdGVkVG9kbygpIj7guYDguJ7guLTguYjguKHguYDguILguYnguLLguKPguLLguKLguIHguLLguKM8L2J1dHRv',
  'bj4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcJ3RvZG9QYXN0ZVdyYXBcJykuaGlkZGVuPXRydWUiPuC4m+C4tOC4lDwvYnV0dG9uPicgKwogICAgJzwvZGl2Pic7',
  'CiAgaG9zdC5hcHBlbmRDaGlsZCh3cmFwKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9kb1Bhc3RlQm94JykuZm9jdXMoKTsKfQoKZnVuY3Rpb24gYXBwbHlQYXN0ZWRUb2RvKCl7CiAgdmFyIHRleHQgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Rv',
  'ZG9QYXN0ZUJveCcpIHx8IHt9KS52YWx1ZSB8fCAnJzsKICB2YXIgYWRkZWQgPSBwYXJzZVRvZG9UZXh0KHRleHQpOwogIGlmICghYWRkZWQubGVuZ3RoKSByZXR1cm4gdG9hc3QoJ+C5hOC4oeC5iOC4nuC4muC4h+C4suC4meC4l+C4teC5iOC4reC5iOC4suC4meC5',
  'hOC4lOC5iScsICdlcnInKTsKICBGT1JNLnRvZG8gPSAoRk9STS50b2RvIHx8IFtdKS5maWx0ZXIoZnVuY3Rpb24odCl7IHJldHVybiBTdHJpbmcodC5uYW1lIHx8ICcnKS50cmltKCk7IH0pLmNvbmNhdChhZGRlZCk7CiAgcmVkcmF3VG9kbygpOwogIHRvYXN0KCfg',
  'uYDguJ7guLTguYjguKHguYPguKvguYkgJyArIGFkZGVkLmxlbmd0aCArICcg4LiH4Liy4LiZJywgJ29rJyk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJrguLTguKXguYDguJTg',
  'uLXguKLguKfguKvguKXguLLguKLguKPguLLguKLguIHguLLguKMg4oCUIOC4i+C4t+C5ieC4reC4reC4reC4meC5hOC4peC4meC5jOC4l+C4teC5gOC4lOC4teC4ouC4p+C5hOC4lOC5ieC4guC4reC4h+C4q+C4peC4suC4ouC4reC4ouC5iOC4suC4hwoKICAg4LmA',
  '4LiB4LmH4Lia4Lil4LiH4LiK4Li14LiV4LmA4Lib4LmH4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4LihIOC4muC4o+C4o+C4l+C4seC4lOC4peC4sOC4o+C4suC4ouC4geC4suC4oyAg4LiK4Li34LmI4LitIHwg4LiI4Liz4LiZ4Lin4LiZIHwg4Lir4LiZ4LmI4Lin4Lii',
  'IHwg4Lij4Liy4LiE4Liy4LiV4LmI4Lit4Lir4LiZ4LmI4Lin4LiiCiAgICjguKPguLnguJvguYHguJrguJrguYDguJTguLXguKLguKfguIHguLHguJogcGFyc2VMaW5lc18g4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmMIOKAlCDg',
  'uYHguIHguYnguJfguLXguYjguYTguKvguJnguJXguYnguK3guIfguYHguIHguYnguYPguKvguYnguJXguKPguIfguIHguLHguJkpCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKZnVuY3Rp',
  'b24gcGFyc2VMaW5lc1RleHQodGV4dCl7CiAgcmV0dXJuIFN0cmluZyh0ZXh0ID09IG51bGwgPyAnJyA6IHRleHQpLnNwbGl0KC9ccj9cbi8pCiAgICAubWFwKGZ1bmN0aW9uKHMpeyByZXR1cm4gcy50cmltKCk7IH0pLmZpbHRlcihCb29sZWFuKQogICAgLm1hcChm',
  'dW5jdGlvbihyYXcpewogICAgICB2YXIgYSA9IHJhdy5zcGxpdCgnfCcpLm1hcChmdW5jdGlvbih4KXsgcmV0dXJuIHgudHJpbSgpOyB9KTsKICAgICAgdmFyIG5hbWUgPSBhWzBdIHx8ICcnLCBxdHkgPSAxLCB1bml0ID0gJycsIHByaWNlID0gMDsKICAgICAgaWYg',
  'KGEubGVuZ3RoID49IDQpICAgICAgeyBxdHkgPSBudW1PcihhWzFdLCAxKTsgdW5pdCA9IGFbMl0gfHwgJyc7IHByaWNlID0gbnVtT3IoYVszXSwgMCk7IH0KICAgICAgZWxzZSBpZiAoYS5sZW5ndGggPT09IDMpeyBxdHkgPSBudW1PcihhWzFdLCAxKTsgcHJpY2Ug',
  'PSBudW1PcihhWzJdLCAwKTsgfQogICAgICBlbHNlIGlmIChhLmxlbmd0aCA9PT0gMil7IHByaWNlID0gbnVtT3IoYVsxXSwgMCk7IH0KICAgICAgcmV0dXJuIHsgbmFtZTogbmFtZSwgcXR5OiBxdHksIHVuaXQ6IHVuaXQsIHByaWNlOiBwcmljZSB9OwogICAgfSk7',
  'Cn0KCmZ1bmN0aW9uIG51bU9yKHYsIGRmbHQpewogIHZhciBuID0gTnVtYmVyKFN0cmluZyh2KS5yZXBsYWNlKC8sL2csICcnKSk7CiAgcmV0dXJuIGlzRmluaXRlKG4pID8gbiA6IGRmbHQ7Cn0KCmZ1bmN0aW9uIGZvcm1hdExpbmVzVGV4dChsaXN0KXsKICByZXR1',
  'cm4gKGxpc3QgfHwgW10pCiAgICAuZmlsdGVyKGZ1bmN0aW9uKGwpeyByZXR1cm4gU3RyaW5nKGwubmFtZSB8fCAnJykudHJpbSgpIHx8IE51bWJlcihsLnByaWNlKTsgfSkKICAgIC5tYXAoZnVuY3Rpb24obCl7CiAgICAgIHJldHVybiBbU3RyaW5nKGwubmFtZSB8',
  'fCAnJykucmVwbGFjZSgvXHwvZywgJy8nKSwKICAgICAgICAgICAgICBsLnF0eSB8fCAxLAogICAgICAgICAgICAgIFN0cmluZyhsLnVuaXQgfHwgJycpLnJlcGxhY2UoL1x8L2csICcvJyksCiAgICAgICAgICAgICAgbC5wcmljZSB8fCAwXS5qb2luKCcgfCAnKTsK',
  'ICAgIH0pLmpvaW4oJ1xuJyk7Cn0KCmZ1bmN0aW9uIGxpbmVUb3RhbChsKXsgcmV0dXJuIChOdW1iZXIobC5xdHkpIHx8IDApICogKE51bWJlcihsLnByaWNlKSB8fCAwKTsgfQpmdW5jdGlvbiBsaW5lc1N1bSgpeyByZXR1cm4gKEZPUk0ubGluZXMgfHwgW10pLnJl',
  'ZHVjZShmdW5jdGlvbihhLCBsKXsgcmV0dXJuIGEgKyBsaW5lVG90YWwobCk7IH0sIDApOyB9CgpmdW5jdGlvbiBsaW5lc1RhYmxlSHRtbCgpewogIHZhciByb3dzID0gKEZPUk0ubGluZXMgfHwgW10pLm1hcChmdW5jdGlvbihsLCBpKXsKICAgIHJldHVybiAnPGRp',
  'diBjbGFzcz0ibGluZS1yb3ciPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIHBsYWNlaG9sZGVyPSLguIrguLfguYjguK3guKrguLTguJnguITguYnguLIiIHZhbHVlPSInICsgZXNjKGwubmFtZSB8fCAnJykgKyAnIiAnICsKICAgICAgICAnb25pbnB1dD0i',
  'c2V0TGluZSgnICsgaSArICcsXCduYW1lXCcsdGhpcy52YWx1ZSkiPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAgbnVtIiB0eXBlPSJudW1iZXIiIHN0ZXA9ImFueSIgaW5wdXRtb2RlPSJkZWNpbWFsIiBwbGFjZWhvbGRlcj0i4LiI4Liz4LiZ4Lin4LiZIiAn',
  'ICsKICAgICAgICAndmFsdWU9IicgKyAobC5xdHkgPT0gbnVsbCA/ICcnIDogZXNjKGwucXR5KSkgKyAnIiBvbmlucHV0PSJzZXRMaW5lKCcgKyBpICsgJyxcJ3F0eVwnLHRoaXMudmFsdWUpIj4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBwbGFjZWhvbGRl',
  'cj0i4Lir4LiZ4LmI4Lin4LiiIiB2YWx1ZT0iJyArIGVzYyhsLnVuaXQgfHwgJycpICsgJyIgJyArCiAgICAgICAgJ29uaW5wdXQ9InNldExpbmUoJyArIGkgKyAnLFwndW5pdFwnLHRoaXMudmFsdWUpIj4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIG51bSIg',
  'dHlwZT0ibnVtYmVyIiBzdGVwPSJhbnkiIGlucHV0bW9kZT0iZGVjaW1hbCIgcGxhY2Vob2xkZXI9IuC4o+C4suC4hOC4si/guKvguJnguYjguKfguKIiICcgKwogICAgICAgICd2YWx1ZT0iJyArIChsLnByaWNlID09IG51bGwgPyAnJyA6IGVzYyhsLnByaWNlKSkg',
  'KyAnIiBvbmlucHV0PSJzZXRMaW5lKCcgKyBpICsgJyxcJ3ByaWNlXCcsdGhpcy52YWx1ZSkiPicgKwogICAgICAnPGRpdiBjbGFzcz0ibGluZS1zdW0iPicgKyBtb25leShsaW5lVG90YWwobCksIDIpICsgJzwvZGl2PicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJi',
  'dXR0b24iIGNsYXNzPSJidG4gc20gZGdyIiB0aXRsZT0i4LmA4Lit4Liy4Lij4Liy4Lii4LiB4Liy4Lij4LiZ4Li14LmJ4Lit4Lit4LiBIiBvbmNsaWNrPSJkZWxMaW5lKCcgKyBpICsgJykiPsOXPC9idXR0b24+JyArCiAgICAnPC9kaXY+JzsKICB9KS5qb2luKCcn',
  'KTsKCiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJsaW5lLWhlYWQiPicgKwogICAgICAnPHNwYW4+4LiK4Li34LmI4Lit4Liq4Li04LiZ4LiE4LmJ4LiyPC9zcGFuPjxzcGFuIGNsYXNzPSJudW0iPuC4iOC4s+C4meC4p+C4mTwvc3Bhbj48c3Bhbj7guKvguJnguYjguKfg',
  'uKI8L3NwYW4+JyArCiAgICAgICc8c3BhbiBjbGFzcz0ibnVtIj7guKPguLLguITguLIv4Lir4LiZ4LmI4Lin4LiiPC9zcGFuPjxzcGFuIGNsYXNzPSJudW0iPuC4o+C4p+C4oTwvc3Bhbj48c3Bhbj48L3NwYW4+JyArCiAgICAnPC9kaXY+JyArCiAgICAocm93cyB8',
  'fCAnPGRpdiBjbGFzcz0iaGludCIgc3R5bGU9InBhZGRpbmc6OHB4IDJweCI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4LijIOKAlCDguIHguJQg4oCc4LmA4Lie4Li04LmI4Lih4Lij4Liy4Lii4LiB4Liy4Lij4oCdIOC5gOC4nuC4t+C5',
  'iOC4reC5g+C4quC5iOC4quC4tOC4meC4hOC5ieC4suC4l+C4teC4peC4sOC4reC4ouC5iOC4suC4hzwvZGl2PicpICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQ4Ij4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNr',
  'PSJhZGRMaW5lKCkiPisg4LmA4Lie4Li04LmI4Lih4Lij4Liy4Lii4LiB4Liy4LijPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0icGFzdGVMaW5lcygpIj7wn5OLIOC4p+C4suC4h+C4l+C4teC5',
  'gOC4lOC4teC4ouC4p+C4q+C4peC4suC4ouC4o+C4suC4ouC4geC4suC4ozwvYnV0dG9uPicgKwogICAgICAnPGRpdiBjbGFzcz0ibGluZS10b3RhbCI+4Lij4Lin4Lih4LiE4LmI4Liy4Liq4Li04LiZ4LiE4LmJ4LiyIDxiPicgKyBtb25leShsaW5lc1N1bSgpLCAy',
  'KSArICcg4Li/PC9iPjwvZGl2PicgKwogICAgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIHJlZHJhd0xpbmVzKCl7CiAgdmFyIGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2xpbmVzJyk7CiAgaWYgKCFib3gpIHJldHVybjsKICBib3guaW5uZXJIVE1MID0g',
  'bGluZXNUYWJsZUh0bWwoKTsKICByZWNhbGNCaWxsKCk7Cn0KCmZ1bmN0aW9uIHNldExpbmUoaSwga2V5LCB2YWwpewogIGlmICghRk9STS5saW5lc1tpXSkgcmV0dXJuOwogIEZPUk0ubGluZXNbaV1ba2V5XSA9IChrZXkgPT09ICdxdHknIHx8IGtleSA9PT0gJ3By',
  'aWNlJykgPyBudW1Pcih2YWwsIDApIDogdmFsOwogIC8vIOC5hOC4oeC5iOC4p+C4suC4lOC5g+C4q+C4oeC5iOC4l+C4seC5ieC4h+C4leC4suC4o+C4suC4hyDguYDguJTguLXguYvguKLguKfguYDguITguK3guKPguYzguYDguIvguK3guKPguYzguYDguJTguYng',
  'uIfguK3guK3guIHguIjguLLguIHguIrguYjguK3guIfguJfguLXguYjguIHguLPguKXguLHguIfguJ7guLTguKHguJ7guYwKICB2YXIgcm93ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2ZfbGluZXMgLmxpbmUtcm93JylbaV07CiAgaWYgKHJvdykgcm93',
  'LnF1ZXJ5U2VsZWN0b3IoJy5saW5lLXN1bScpLnRleHRDb250ZW50ID0gbW9uZXkobGluZVRvdGFsKEZPUk0ubGluZXNbaV0pLCAyKTsKICB2YXIgdG90ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2ZfbGluZXMgLmxpbmUtdG90YWwgYicpOwogIGlmICh0b3Qp',
  'IHRvdC50ZXh0Q29udGVudCA9IG1vbmV5KGxpbmVzU3VtKCksIDIpICsgJyDguL8nOwogIHJlY2FsY0JpbGwoKTsKfQoKZnVuY3Rpb24gYWRkTGluZSgpewogIEZPUk0ubGluZXMucHVzaCh7IG5hbWU6ICcnLCBxdHk6IDEsIHVuaXQ6ICcnLCBwcmljZTogMCB9KTsK',
  'ICByZWRyYXdMaW5lcygpOwogIHZhciBpbnB1dHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjZl9saW5lcyAubGluZS1yb3cgLmlucCcpOwogIGlmIChpbnB1dHMubGVuZ3RoKSBpbnB1dHNbKEZPUk0ubGluZXMubGVuZ3RoIC0gMSkgKiA0XS5mb2N1cygp',
  'Owp9CgpmdW5jdGlvbiBkZWxMaW5lKGkpewogIEZPUk0ubGluZXMuc3BsaWNlKGksIDEpOwogIHJlZHJhd0xpbmVzKCk7Cn0KCi8qKgogKiDguKfguLLguIfguKPguLLguKLguIHguLLguKPguIjguLLguIHguKvguJnguYnguLLguITguLPguKrguLHguYjguIfguIvg',
  'uLfguYnguK3guJfguLXguYDguJTguLXguKLguKfguJfguLHguYnguIfguIHguYnguK3guJkg4LmB4Lil4LmJ4Lin4LmD4Lir4LmJ4Lij4Liw4Lia4Lia4LmB4Lii4LiB4Lia4Lij4Lij4LiX4Lix4LiU4LmD4Lir4LmJCiAqCiAqIOC4l+C4s+C5gOC4m+C5h+C4meC4',
  'iuC5iOC4reC4h+C4nuC4seC4muC5gOC4geC5h+C4muC4reC4ouC4ueC5iOC5g+C4meC4n+C4reC4o+C5jOC4oeC5gOC4lOC4tOC4oSDguYTguKHguYjguYDguJvguLTguJTguKvguJnguYnguLLguJXguYjguLLguIfguIvguYnguK3guJkKICog4LmA4Lie4Lij4Liy',
  '4LiwIG9wZW5Nb2RhbCgpIOC5gOC4guC4teC4ouC4meC4l+C4seC4muC4q+C4meC5ieC4suC4leC5iOC4suC4h+C5gOC4lOC4tOC4oSDguJbguYnguLLguYDguJvguLTguJTguIvguYnguK3guJnguJ/guK3guKPguYzguKHguJfguLXguYjguIHguKPguK3guIHguITg',
  'uYnguLLguIfguYTguKfguYnguIjguLDguKvguLLguKLguJfguLHguYnguIfguYPguJoKICovCmZ1bmN0aW9uIHBhc3RlTGluZXMoKXsKICB2YXIgYm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Bhc3RlV3JhcCcpOwogIGlmIChib3gpIHsgYm94LmhpZGRl',
  'biA9ICFib3guaGlkZGVuOyBpZiAoIWJveC5oaWRkZW4pIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXN0ZUJveCcpLmZvY3VzKCk7IHJldHVybjsgfQoKICB2YXIgaG9zdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2xpbmVzJyk7CiAgaWYgKCFob3N0',
  'KSByZXR1cm47CiAgdmFyIHdyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICB3cmFwLmlkID0gJ3Bhc3RlV3JhcCc7CiAgd3JhcC5jbGFzc05hbWUgPSAnbXQ4JzsKICB3cmFwLmlubmVySFRNTCA9CiAgICAnPHRleHRhcmVhIGNsYXNzPSJ0YSIg',
  'aWQ9InBhc3RlQm94IiBzdHlsZT0ibWluLWhlaWdodDoxMjBweCIgJyArCiAgICAgICdwbGFjZWhvbGRlcj0i4Lib4Lix4LmK4Lih4LiZ4LmJ4LizIDc1MFcgfCAxIHwg4LmA4LiE4Lij4Li34LmI4Lit4LiHIHwgNDI1MCYjMTA74Liq4Liy4Lii4LmE4LifIFZBRiAy',
  'eDEuNSB8IDIwIHwg4LmA4Lih4LiV4LijIHwgMTcuNSYjMTA74LmA4LiX4Lib4Lie4Lix4LiZ4Liq4Liy4Lii4LmE4LifIDQ1Ij48L3RleHRhcmVhPicgKwogICAgJzxkaXYgY2xhc3M9ImhpbnQgbXQ4Ij7guITguLHguYjguJnguJTguYnguKfguKIgPGI+fDwvYj4g',
  '4LiV4Liy4Lih4Lil4Liz4LiU4Lix4LiaIOC4iuC4t+C5iOC4rSDCtyDguIjguLPguJnguKfguJkgwrcg4Lir4LiZ4LmI4Lin4LiiIMK3IOC4o+C4suC4hOC4suC4leC5iOC4reC4q+C4meC5iOC4p+C4ojxicj4nICsKICAgICAgJ+C4luC5ieC4suC4p+C4suC4h+C4',
  'oeC4suC5gOC4m+C5h+C4meC4guC5ieC4reC4hOC4p+C4suC4oeC4mOC4o+C4o+C4oeC4lOC4siDguKPguLDguJrguJrguIjguLDguJ7guKLguLLguKLguLLguKHguYHguKLguIHguIrguLfguYjguK3guIHguLHguJrguKPguLLguITguLLguYPguKvguYnguYDguK3g',
  'uIc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQ4Ij4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIHByaSIgb25jbGljaz0iYXBwbHlQYXN0ZWRMaW5lcygpIj7guYDguJ7guLTguYjguKHguYDguILguYnguLLguKPg',
  'uLLguKLguIHguLLguKM8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcJ3Bhc3RlV3JhcFwnKS5oaWRkZW49dHJ1ZSI+4Lib4Li04LiUPC9idXR0b24+',
  'JyArCiAgICAnPC9kaXY+JzsKICBob3N0LmFwcGVuZENoaWxkKHdyYXApOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXN0ZUJveCcpLmZvY3VzKCk7Cn0KCmZ1bmN0aW9uIGFwcGx5UGFzdGVkTGluZXMoKXsKICB2YXIgdGV4dCA9IChkb2N1bWVudC5nZXRF',
  'bGVtZW50QnlJZCgncGFzdGVCb3gnKSB8fCB7fSkudmFsdWUgfHwgJyc7CiAgdmFyIGFkZGVkID0gdGV4dC5zcGxpdCgvXHI/XG4vKS5tYXAoZnVuY3Rpb24ocyl7IHJldHVybiBzLnRyaW0oKTsgfSkuZmlsdGVyKEJvb2xlYW4pLm1hcChmdW5jdGlvbihyYXcpewog',
  'ICAgaWYgKHJhdy5pbmRleE9mKCd8JykgPj0gMCkgcmV0dXJuIHBhcnNlTGluZXNUZXh0KHJhdylbMF07CiAgICAvLyDguYTguKHguYjguKHguLUgfCDigJQg4LmA4LiU4Liy4LiI4Liy4LiB4LiV4Lix4Lin4LmA4Lil4LiC4LiX4LmJ4Liy4Lii4Lia4Lij4Lij4LiX',
  '4Lix4LiU4Lin4LmI4Liy4LmA4Lib4LmH4LiZ4Lij4Liy4LiE4LiyCiAgICB2YXIgbSA9IHJhdy5tYXRjaCgvXiguKj8pW1xzOnjDl10qKFtcZCxdKyg/OlwuXGQrKT8pXHMqKD864Lia4Liy4LiXfOC4vyk/JC8pOwogICAgaWYgKG0gJiYgbVsxXS50cmltKCkpIHJl',
  'dHVybiB7IG5hbWU6IG1bMV0udHJpbSgpLCBxdHk6IDEsIHVuaXQ6ICcnLCBwcmljZTogbnVtT3IobVsyXSwgMCkgfTsKICAgIHJldHVybiB7IG5hbWU6IHJhdywgcXR5OiAxLCB1bml0OiAnJywgcHJpY2U6IDAgfTsKICB9KS5maWx0ZXIoQm9vbGVhbik7CgogIGlm',
  'ICghYWRkZWQubGVuZ3RoKSByZXR1cm4gdG9hc3QoJ+C5hOC4oeC5iOC4nuC4muC4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4reC5iOC4suC4meC5hOC4lOC5iScsICdlcnInKTsKICBGT1JNLmxpbmVzID0gKEZPUk0ubGluZXMgfHwgW10pLmZpbHRlcihmdW5j',
  'dGlvbihsKXsgcmV0dXJuIFN0cmluZyhsLm5hbWUgfHwgJycpLnRyaW0oKTsgfSkuY29uY2F0KGFkZGVkKTsKICByZWRyYXdMaW5lcygpOyAgIC8vIOC4p+C4suC4lOC5g+C4q+C4oeC5iOC5geC4peC5ieC4p+C4iuC5iOC4reC4h+C4p+C4suC4h+C4iOC4sOC4q+C4',
  'suC4ouC5hOC4m+C5gOC4reC4hyDguYDguJ7guKPguLLguLDguK3guKLguLnguYjguILguYnguLLguIfguYPguJkgZl9saW5lcwogIHRvYXN0KCfguYDguJ7guLTguYjguKHguYPguKvguYkgJyArIGFkZGVkLmxlbmd0aCArICcg4Lij4Liy4Lii4LiB4Liy4LijIOKA',
  'lCDguJXguKPguKfguIjguJXguLHguKfguYDguKXguILguK3guLXguIHguITguKPguLHguYnguIfguIHguYjguK3guJnguJrguLHguJnguJfguLbguIEnLCAnb2snKTsKfQoKLyoqCiAqIOC4hOC4tOC4lOC4ouC4reC4lOC4o+C4p+C4oeC4guC4reC4h+C4muC4tOC4',
  'pSA9IOC4hOC5iOC4suC4quC4tOC4meC4hOC5ieC4siArIOC4hOC5iOC4suC4quC5iOC4hyDiiJIg4Liq4LmI4Lin4LiZ4Lil4LiUIOC5geC4peC5ieC4p+C5gOC4leC4tOC4oeC4peC4h+C4iuC5iOC4reC4hyAi4Lij4Liy4LiE4Liy4Lij4Lin4LihIgogKiDguYPg',
  'uKvguYnguJXguKPguIfguIHguLHguJrguJfguLXguYjguJ3guLHguYjguIfguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYzguITguLTguJTguJXguK3guJnguJrguLHguJnguJfguLbguIEg4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4Lih4Li14LiX4Liy',
  '4LiH4LiX4Li14LmI4LiV4Lix4Lin4LmA4Lil4LiC4Liq4Lit4LiH4Lid4Lix4LmI4LiH4LmE4Lih4LmI4LiV4Lij4LiH4LiB4Lix4LiZCiAqLwpmdW5jdGlvbiByZWNhbGNCaWxsKCl7CiAgaWYgKCFkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9saW5lcycpKSBy',
  'ZXR1cm47CiAgdmFyIHByaWNlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfcHJpY2UnKTsKICBpZiAoIXByaWNlKSByZXR1cm47CiAgdmFyIG4gPSAoRk9STS5saW5lcyB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uKGwpeyByZXR1cm4gU3RyaW5nKGwubmFtZSB8',
  'fCAnJykudHJpbSgpIHx8IE51bWJlcihsLnByaWNlKTsgfSkubGVuZ3RoOwogIGlmICghbikgeyBwcmljZS5yZWFkT25seSA9IGZhbHNlOyBwcmljZS5zdHlsZS5iYWNrZ3JvdW5kID0gJyc7IHJldHVybjsgfQoKICB2YXIgc2hpcCA9IE51bWJlcigoZG9jdW1lbnQu',
  'Z2V0RWxlbWVudEJ5SWQoJ2Zfc2hpcHBpbmcnKSB8fCB7fSkudmFsdWUpIHx8IDA7CiAgdmFyIGRpc2MgPSBOdW1iZXIoKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2Rpc2NvdW50JykgfHwge30pLnZhbHVlKSB8fCAwOwogIHByaWNlLnZhbHVlID0gTWF0aC5y',
  'b3VuZCgobGluZXNTdW0oKSArIHNoaXAgLSBkaXNjKSAqIDEwMCkgLyAxMDA7CiAgcHJpY2UucmVhZE9ubHkgPSB0cnVlOyAgICAgICAgICAgICAgICAgICAgICAgLy8g4Lih4Li14Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4Lii4LmB4Lil4LmJ4LinIOC4q+C5',
  'ieC4suC4oeC4nuC4tOC4oeC4nuC5jOC4l+C4seC4muC5g+C4q+C5ieC5hOC4oeC5iOC4leC4o+C4h+C4geC4seC4mQogIHByaWNlLnN0eWxlLmJhY2tncm91bmQgPSAndmFyKC0tc3VyZmFjZS0yKSc7CiAgcHJpY2UudGl0bGUgPSAn4LiE4Li04LiU4LiI4Liy4LiB',
  '4Lij4Liy4Lii4LiB4Liy4Lij4LmD4LiZ4Lia4Li04Lil4LmD4Lir4LmJ4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0IOKAlCDguYHguIHguYnguJfguLXguYjguKPguLLguKLguIHguLLguKPguKLguYjguK3guKIg4LiE4LmI4Liy4Liq4LmI4LiHIOC4q+C4o+C4',
  't+C4reC4quC5iOC4p+C4meC4peC4lCc7CgogIHZhciBoaW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JpbGxIaW50Jyk7CiAgaWYgKGhpbnQpIHsKICAgIGhpbnQuaW5uZXJIVE1MID0gbiArICcg4Lij4Liy4Lii4LiB4Liy4LijIMK3IOC4hOC5iOC4suC4',
  'quC4tOC4meC4hOC5ieC4siAnICsgbW9uZXkobGluZXNTdW0oKSwgMikgKwogICAgICAoc2hpcCA/ICcgKyDguITguYjguLLguKrguYjguIcgJyArIG1vbmV5KHNoaXAsIDIpIDogJycpICsKICAgICAgKGRpc2MgPyAnIOKIkiDguKrguYjguKfguJnguKXguJQgJyAr',
  'IG1vbmV5KGRpc2MsIDIpIDogJycpOwogIH0KfQoKLyoqIOC4reC4seC4m+C5gOC4lOC4leC4iuC5iOC4reC4h+C4nOC4peC4o+C4p+C4oeC4l+C4uOC4geC4iuC5iOC4reC4h+C5g+C4meC4n+C4reC4o+C5jOC4oeC4m+C4seC4iOC4iOC4uOC4muC4seC4mSAqLwpm',
  'dW5jdGlvbiByZWNhbGNTdW1zKCl7CiAgKEZPUk0uc3BlY3MgfHwgW10pLmZvckVhY2goZnVuY3Rpb24oZil7CiAgICBpZiAoZi50eXBlICE9PSAnY29tcHV0ZWQnIHx8ICFmLmZyb20pIHJldHVybjsKICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlk',
  'KCdmXycgKyBmLmtleSk7CiAgICBpZiAoIWVsKSByZXR1cm47CiAgICB2YXIgdG90YWwgPSAwOwogICAgZi5mcm9tLmZvckVhY2goZnVuY3Rpb24oayl7CiAgICAgIHZhciBpID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyArIGspOwogICAgICBpZiAoaSkg',
  'dG90YWwgKz0gTnVtYmVyKGkudmFsdWUpIHx8IDA7CiAgICB9KTsKICAgIGVsLnRleHRDb250ZW50ID0gdG90YWwudG9Mb2NhbGVTdHJpbmcoJ3RoLVRIJywgeyBtaW5pbXVtRnJhY3Rpb25EaWdpdHM6IDAsIG1heGltdW1GcmFjdGlvbkRpZ2l0czogMiB9KSArICcg',
  '4Li/JzsKICAgIGVsLnN0eWxlLmNvbG9yID0gdG90YWwgPiAwID8gJ3ZhcigtLW9rKScgOiAndmFyKC0tbXV0ZWQpJzsKICB9KTsKfQoKZnVuY3Rpb24gZXhpc3RpbmdGaWxlc0h0bWwoa2V5KXsKICB2YXIgbGlzdCA9IEZPUk0ua2VlcFtrZXldIHx8IFtdOwogIGlm',
  'ICghbGlzdC5sZW5ndGgpIHJldHVybiAnJzsKICByZXR1cm4gJzxkaXYgY2xhc3M9InRodW1icyBtYjgiPicgKyBsaXN0Lm1hcChmdW5jdGlvbih1cmwsIGkpewogICAgdmFyIGlkID0gU3RyaW5nKHVybCkubWF0Y2goL1stXHddezIwLH0vKTsKICAgIHZhciB0aHVt',
  'YiA9IGlkID8gJ2h0dHBzOi8vZHJpdmUuZ29vZ2xlLmNvbS90aHVtYm5haWw/aWQ9JyArIGlkWzBdICsgJyZzej13MjAwJyA6ICcnOwogICAgcmV0dXJuICc8c3BhbiBzdHlsZT0icG9zaXRpb246cmVsYXRpdmU7ZGlzcGxheTppbmxpbmUtYmxvY2siPicgKwogICAg',
  'ICAodGh1bWIgPyAnPGltZyBjbGFzcz0idGh1bWIiIHNyYz0iJyArIGVzYyh0aHVtYikgKyAnIiBvbmNsaWNrPSJ3aW5kb3cub3BlbihcJycgKyBlc2ModXJsKSArICdcJyxcJ19ibGFua1wnKSI+JwogICAgICAgICAgICAgOiAnPGEgY2xhc3M9ImIgaW5mbyIgaHJl',
  'Zj0iJyArIGVzYyh1cmwpICsgJyIgdGFyZ2V0PSJfYmxhbmsiPuC5hOC4n+C4peC5jCAnICsgKGkrMSkgKyAnPC9hPicpICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBvbmNsaWNrPSJkcm9wRmlsZShcJycgKyBrZXkgKyAnXCcsJyArIGkgKyAnKSIgdGl0',
  'bGU9IuC5gOC4reC4suC4reC4reC4gSIgJyArCiAgICAgICdzdHlsZT0icG9zaXRpb246YWJzb2x1dGU7dG9wOi02cHg7cmlnaHQ6LTZweDtiYWNrZ3JvdW5kOnZhcigtLWRhbmdlcik7Y29sb3I6I2ZmZjtib3JkZXI6MDtib3JkZXItcmFkaXVzOjk5cHg7d2lkdGg6',
  'MThweDtoZWlnaHQ6MThweDtsaW5lLWhlaWdodDoxO2N1cnNvcjpwb2ludGVyO2ZvbnQtc2l6ZToxMnB4Ij7DlzwvYnV0dG9uPicgKwogICAgICAnPC9zcGFuPic7CiAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gZHJvcEZpbGUoa2V5LCBpZHgp',
  'ewogIEZPUk0ua2VlcFtrZXldLnNwbGljZShpZHgsIDEpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmXycgKyBrZXkgKyAnX2V4aXN0aW5nJykuaW5uZXJIVE1MID0gZXhpc3RpbmdGaWxlc0h0bWwoa2V5KTsKfQoKZnVuY3Rpb24gcHJldmlld1BpY2tlZChp',
  'bnB1dCwgaWQpewogIHZhciBib3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCArICdfcHJldmlldycpOwogIHZhciBmaWxlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGlucHV0LmZpbGVzIHx8IFtdKTsKICBib3guaW5uZXJIVE1MID0gZmlsZXMu',
  'bWFwKGZ1bmN0aW9uKGYpewogICAgcmV0dXJuICc8c3BhbiBjbGFzcz0iYiBpbmZvIj4nICsgZXNjKGYubmFtZS5zbGljZSgwLDI2KSkgKyAnIMK3ICcgKyBNYXRoLnJvdW5kKGYuc2l6ZS8xMDI0KSArICcgS0I8L3NwYW4+JzsKICB9KS5qb2luKCcgJyk7CgogIHZh',
  'ciBzbG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQgKyAnX29jcicpOwogIGlmICghc2xvdCkgcmV0dXJuOwogIHNsb3QuaW5uZXJIVE1MID0gJyc7CiAgaWYgKCFvY3JVc2FibGUoKSB8fCAhZmlyc3RSZWFkYWJsZShmaWxlcykpIHJldHVybjsKCiAgdmFy',
  'IG1vZGUgPSAoUy5ib290LnNldHRpbmdzICYmIFMuYm9vdC5zZXR0aW5ncy5vY3JBdXRvZmlsbCkgfHwgJ+C4luC4suC4oeC4geC5iOC4reC4meC5gOC4leC4tOC4oSc7CiAgaWYgKG1vZGUgPT09ICfguYTguKHguYjguYDguJXguLTguKEnKSByZXR1cm47CiAgaWYg',
  'KG1vZGUgPT09ICfguYDguJXguLTguKHguYPguKvguYnguYDguKXguKInKSByZXR1cm4gcnVuT2NyKGlkLCB0cnVlKTsKCiAgc2xvdC5pbm5lckhUTUwgPQogICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIG10OCIgb25jbGljaz0icnVuT2Ny',
  'KFwnJyArIGlkICsgJ1wnKSI+JyArCiAgICAn8J+UjiDguK3guYjguLLguJnguILguYnguK3guITguKfguLLguKHguIjguLLguIHguKPguLnguJvguJnguLXguYkg4LmB4Lil4LmJ4Lin4LiK4LmI4Lin4Lii4LiB4Lij4Lit4LiB4LmD4Lir4LmJPC9idXR0b24+JzsK',
  'fQoKLyoqIOC4reC5iOC4suC4meC4hOC5iOC4suC4iOC4suC4geC4n+C4reC4o+C5jOC4oSArIOC4reC4seC4m+C5guC4q+C4peC4lOC5hOC4n+C4peC5jOC5g+C4q+C4oeC5iCDguYHguKXguYnguKfguITguLfguJkgb2JqZWN0IOC4nuC4o+C5ieC4reC4oeC4muC4',
  'seC4meC4l+C4tuC4gSAqLwpmdW5jdGlvbiByZWFkRm9ybShzcGVjcywgYnVja2V0KXsKICB2YXIgb3V0ID0ge307CiAgdmFyIHVwbG9hZHMgPSBbXTsKCiAgc3BlY3MuZm9yRWFjaChmdW5jdGlvbihmKXsKICAgIGlmIChmLnR5cGUgPT09ICdjb21wdXRlZCcpIHJl',
  'dHVybjsgICAgICAgICAgLy8g4LiK4LmI4Lit4LiH4LiE4Liz4LiZ4Lin4LiTIOC5hOC4oeC5iOC4leC5ieC4reC4h+C4muC4seC4meC4l+C4tuC4gQogICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyArIGYua2V5KTsKICAgIGlmICghZWwp',
  'IHJldHVybjsKICAgIGlmIChmLnR5cGUgPT09ICdmaWxlcycpIHsKICAgICAgdXBsb2Fkcy5wdXNoKAogICAgICAgIHVwbG9hZEZpbGVzKGVsLCBidWNrZXQpLnRoZW4oZnVuY3Rpb24ocmVmcyl7CiAgICAgICAgICBvdXRbZi5rZXldID0gKEZPUk0ua2VlcFtmLmtl',
  'eV0gfHwgW10pLmNvbmNhdChyZWZzLm1hcChmdW5jdGlvbihyKXsgcmV0dXJuIHIudXJsOyB9KSk7CiAgICAgICAgfSkKICAgICAgKTsKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAndG9kbycpIHsKICAgICAgb3V0W2Yua2V5XSA9IGZvcm1hdFRvZG9UZXh0KEZP',
  'Uk0udG9kbyk7CiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ2xpbmVzJykgewogICAgICBvdXRbZi5rZXldID0gZm9ybWF0TGluZXNUZXh0KEZPUk0ubGluZXMpOwogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICdudW1iZXInIHx8IGYudHlwZSA9PT0gJ21vbmV5',
  'JykgewogICAgICBvdXRbZi5rZXldID0gZWwudmFsdWUgPT09ICcnID8gbnVsbCA6IE51bWJlcihlbC52YWx1ZSk7CiAgICB9IGVsc2UgewogICAgICBvdXRbZi5rZXldID0gZWwudmFsdWU7CiAgICB9CiAgfSk7CgogIHJldHVybiBQcm9taXNlLmFsbCh1cGxvYWRz',
  'KS50aGVuKGZ1bmN0aW9uKCl7IHJldHVybiBvdXQ7IH0pOwp9CgovKiog4LmC4LiE4Lij4LiH4Lif4Lit4Lij4LmM4Lih4Lih4Liy4LiV4Lij4LiQ4Liy4LiZOiDguYDguJvguLTguJQgbW9kYWwsIOC4iOC4seC4lOC4geC4suC4o+C4m+C4uOC5iOC4oeC4muC4seC4',
  'meC4l+C4tuC4gSwg4Lij4Li14LmC4Lir4Lil4LiU4Lir4LiZ4LmJ4LiyICovCmZ1bmN0aW9uIG9wZW5Gb3JtKG9wdHMpewogIHZhciByZWMgPSBvcHRzLnJlY29yZCB8fCB7fTsKICBGT1JNLm9jciA9IG9wdHMub2NyIHx8IG51bGw7CiAgRk9STS5yZWMgPSByZWMu',
  'aWQgPyByZWMgOiBudWxsOyAgIC8vIOC4iOC4s+C5hOC4p+C5ieC4p+C5iOC4suC4geC4s+C4peC4seC4h+C5geC4geC5ieC4guC4reC4h+C5gOC4lOC4tOC4oSDguKvguKPguLfguK3guIHguLPguKXguLHguIfguYDguJ7guLTguYjguKHguYPguKvguKHguYgKICBv',
  'cGVuTW9kYWwob3B0cy50aXRsZSwKICAgIGZpZWxkc0h0bWwob3B0cy5maWVsZHMsIHJlYyksCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4gTwvYnV0dG9uPicgKwogICAgKHJlYy5pZCAmJiBv',
  'cHRzLm9uRGVsZXRlID8gJzxidXR0b24gY2xhc3M9ImJ0biBkZ3IiIGlkPSJmRGVsIj7guKXguJrguKPguLLguKLguIHguLLguKPguJnguLXguYk8L2J1dHRvbj4nIDogJycpICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBpZD0iZlNhdmUiPicgKyAocmVj',
  'LmlkID8gJ+C4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C5geC4geC5ieC5hOC4gicgOiAn4Lia4Lix4LiZ4LiX4Li24LiBJykgKyAnPC9idXR0b24+JywKICAgIG9wdHMud2lkZSk7CgogIGlmIChyZWMuaWQgJiYgb3B0cy5vbkRlbGV0ZSkgewogICAgZG9jdW1l',
  'bnQuZ2V0RWxlbWVudEJ5SWQoJ2ZEZWwnKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsgY2xvc2VNb2RhbCgpOyBvcHRzLm9uRGVsZXRlKHJlYy5pZCk7IH07CiAgfQoKICByZWNhbGNTdW1zKCk7CiAgcmVjYWxjQmlsbCgpOwoKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJ',
  'ZCgnZlNhdmUnKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsKICAgIHZhciBidG4gPSB0aGlzOwogICAgYnRuLmRpc2FibGVkID0gdHJ1ZTsKICAgIGJ0bi5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4Lia4Lix4LiZ',
  '4LiX4Li24LiB4oCmJzsKCiAgICByZWFkRm9ybShvcHRzLmZpZWxkcywgb3B0cy5idWNrZXQgfHwgJ21pc2MnKS50aGVuKGZ1bmN0aW9uKGRhdGEpewogICAgICB2YXIgbWlzc2luZyA9IG9wdHMuZmllbGRzLmZpbHRlcihmdW5jdGlvbihmKXsKICAgICAgICByZXR1',
  'cm4gZi5yZXF1aXJlZCAmJiAoZGF0YVtmLmtleV0gPT0gbnVsbCB8fCBkYXRhW2Yua2V5XSA9PT0gJycpOwogICAgICB9KTsKICAgICAgaWYgKG1pc3NpbmcubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoJ+C4geC4o+C4uOC4k+C4suC4geC4o+C4reC4gTogJyArIG1p',
  'c3NpbmcubWFwKGZ1bmN0aW9uKGYpeyByZXR1cm4gZi5sYWJlbDsgfSkuam9pbignLCAnKSk7CgogICAgICB2YXIgcmVjb3JkID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0cy5iYXNlIHx8IHt9LCBkYXRhKTsKICAgICAgaWYgKHJlYy5pZCkgcmVjb3JkLmlkID0gcmVj',
  'LmlkOwogICAgICByZXR1cm4gY2FsbEFwaShvcHRzLmFjdGlvbiwgT2JqZWN0LmFzc2lnbih7IHJlY29yZDogcmVjb3JkIH0sIG9wdHMuZXh0cmEgfHwge30pKTsKICAgIH0pLnRoZW4oZnVuY3Rpb24oKXsKICAgICAgY2xvc2VNb2RhbCgpOwogICAgICAvLyDguJXg',
  'uLHguKfguJrguK3guIHguKrguJbguLLguJnguLDguKHguLjguKHguILguKfguLLguJrguJnguILguLbguYnguJkgIuC4muC4seC4meC4l+C4tuC4geC5geC4peC5ieC4pyIg4LmD4Lir4LmJ4Lit4Lii4Li54LmI4LmB4Lil4LmJ4LinIOC4iOC4tuC4h+C5hOC4oeC5',
  'iOC4leC5ieC4reC4h+C5gOC4lOC5ieC4hyB0b2FzdCDguIvguYnguLMKICAgICAgLy8g4LmB4Lil4LmJ4Lin4LiL4Li04LiH4LiB4LmM4LmA4LiH4Li14Lii4LiaIOC5hiDguYTguKHguYjguKXguYnguLLguIfguKvguJnguYnguLLguYHguKXguLDguYTguKHguYjg',
  'uYDguJTguYnguIfguIHguKXguLHguJrguYTguJvguJrguJnguKrguLjguJQKICAgICAgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwogICAgICAvLyDguJ/guK3guKPguYzguKHguJfguLXguYjguYDguJvguLTguJTguKHguLLguIjguLLguIHguKvguJnguYnguLLguJXg',
  'uYjguLLguIfguK3guLfguYjguJkgKOC5gOC4iuC5iOC4mSDguJfguKPguLHguJ7guKLguYzguKrguLTguJnguYPguJnguKvguJnguYnguLLguKvguYnguK3guIcpIOC4guC4reC5gOC4m+C4tOC4lOC4q+C4meC5ieC4suC4meC4seC5ieC4meC4geC4peC4seC4muC4',
  'hOC4t+C4mQogICAgICBpZiAodHlwZW9mIG9wdHMuYWZ0ZXIgPT09ICdmdW5jdGlvbicpIG9wdHMuYWZ0ZXIoKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTsKICAgICAgYnRuLnRleHRDb250ZW50ID0gcmVjLmlk',
  'ID8gJ+C4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C5geC4geC5ieC5hOC4gicgOiAn4Lia4Lix4LiZ4LiX4Li24LiBJzsKICAgICAgdG9hc3QoZS5tZXNzYWdlIHx8IGUsICdlcnInKTsKICAgIH0pOwogIH07Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguK3guYjguLLguJnguILguYnguK3guITguKfguLLguKHguIjguLLguIHguKPguLnguJsgKE9DUikg4LmB4Lil4LmJ4Lin4LiK4LmI4Lin4Lii4LiB4Lij4Lit4LiB4Lif4Lit4Lij4LmM4Lih',
  'CgogICDguJfguLjguIHguITguYjguLLguJfguLXguYjguYTguJTguYnguYDguJvguYfguJnguYHguITguYjguILguYnguK3guYDguKrguJnguK0g4Lic4Li54LmJ4LmD4LiK4LmJ4LiB4LiU4LmA4LiV4Li04Lih4LmA4Lit4LiH4LiX4Li14Lil4Liw4LiK4LmI4Lit',
  '4LiH4Lir4Lij4Li34Lit4LmA4LiV4Li04Lih4LiX4Lix4LmJ4LiH4Lir4Lih4LiU4LiB4LmH4LmE4LiU4LmJCiAgIOC5geC4peC4sOC5geC4geC5ieC5hOC4guC4leC5iOC4reC5hOC4lOC5ieC5gOC4quC4oeC4rSDguYDguJ7guKPguLLguLDguJXguLHguKfguK3g',
  'uYjguLLguJnguJ7guKXguLLguJTguYTguJTguYkg4LmC4LiU4Lii4LmA4LiJ4Lie4Liy4Liw4Lil4Liy4Lii4Lih4Li34Lit4LiB4Lix4Lia4Lij4Li54Lib4LmA4Lit4Li14Lii4LiHCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PSAqLwoKdmFyIE9DUl9NQVggPSA4ICogMTAyNCAqIDEwMjQ7ICAgLy8g4Lij4Li54Lib4LmD4Lir4LiN4LmI4LiB4Lin4LmI4Liy4LiZ4Li14LmJ4Liq4LmI4LiH4LmE4Lib4Lit4LmI4Liy4LiZ4LmB4Lil4LmJ4Lin4Lih4Lix4LiB',
  '4Lir4Lih4LiU4LmA4Lin4Lil4LiyCgpmdW5jdGlvbiBvY3JVc2FibGUoKXsKICByZXR1cm4gISEoRk9STS5vY3IgJiYgUy5ib290ICYmIFMuYm9vdC5zZXR0aW5ncyAmJiBTLmJvb3Quc2V0dGluZ3Mub2NyRW5hYmxlZCk7Cn0KCi8qKiDguKPguLnguJvguYHguKPg',
  'uIHguJfguLXguYjguJ7guK3guK3guYjguLLguJnguYTguJTguYkgKOC4guC5ieC4suC4oeC5hOC4n+C4peC5jOC5g+C4q+C4jeC5iOC5gOC4geC4tOC4meC5geC4peC4sOC5hOC4n+C4peC5jOC4l+C4teC5iOC5hOC4oeC5iOC5g+C4iuC5iOC4o+C4ueC4my9QREYp',
  'ICovCmZ1bmN0aW9uIGZpcnN0UmVhZGFibGUoZmlsZXMpewogIGZvciAodmFyIGkgPSAwOyBpIDwgZmlsZXMubGVuZ3RoOyBpKyspIHsKICAgIHZhciBmID0gZmlsZXNbaV07CiAgICBpZiAoZi5zaXplIDw9IE9DUl9NQVggJiYgL15pbWFnZVwvfHBkZiQvLnRlc3Qo',
  'Zi50eXBlIHx8ICcnKSkgcmV0dXJuIGY7CiAgfQogIHJldHVybiBudWxsOwp9CgovKioKICogQHBhcmFtIHtzdHJpbmd9IGlkICBpZCDguILguK3guIfguIrguYjguK3guIfguYHguJnguJrguYTguJ/guKXguYwg4LmA4LiK4LmI4LiZIGZfc2xpcHMKICogQHBhcmFt',
  'IHtib29sZWFufSBhdXRvIHRydWUgPSDguYDguJXguLTguKHguIrguYjguK3guIfguJfguLXguYjguKLguLHguIfguKfguYjguLLguIfguYPguKvguYnguYDguKXguKLguYLguJTguKLguYTguKHguYjguJXguYnguK3guIfguIHguJQKICovCmZ1bmN0aW9uIHJ1bk9j',
  'cihpZCwgYXV0byl7CiAgdmFyIGlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpOwogIHZhciBzbG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQgKyAnX29jcicpOwogIGlmICghaW5wdXQgfHwgIXNsb3QpIHJldHVybjsKCiAgdmFyIGZpbGUg',
  'PSBmaXJzdFJlYWRhYmxlKEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGlucHV0LmZpbGVzIHx8IFtdKSk7CiAgaWYgKCFmaWxlKSB7IHNsb3QuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9ImhpbnQgbXQ4Ij7guYTguKHguYjguKHguLXguKPguLnguJvguJfguLXg',
  'uYjguK3guYjguLLguJnguYTguJTguYkgKOC4o+C4reC4h+C4o+C4seC4muC4o+C4ueC4m+C4oOC4suC4nuC5geC4peC4sCBQREYg4LmE4Lih4LmI4LmA4LiB4Li04LiZIDggTUIpPC9kaXY+JzsgcmV0dXJuOyB9CgogIHNsb3QuaW5uZXJIVE1MID0gJzxkaXYgY2xh',
  'c3M9Im9jci1ib3giPjxkaXYgY2xhc3M9ImhkIj48c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDguIHguLPguKXguLHguIfguK3guYjguLLguJnguILguYnguK3guITguKfguLLguKHguIjguLLguIEgJyArCiAgICAgICAgICAgICAgICAgICBlc2MoZmlsZS5uYW1l',
  'LnNsaWNlKDAsIDI4KSkgKyAn4oCmPC9kaXY+PC9kaXY+JzsKCiAgcmVhZEFzRGF0YVVybChmaWxlKS50aGVuKGZ1bmN0aW9uKHApewogICAgcmV0dXJuIGNhbGxBcGkoJ29jci5yZWFkJywgeyBkYXRhVXJsOiBwLmRhdGFVcmwsIG1pbWVUeXBlOiBwLm1pbWVUeXBl',
  'IH0pOwogIH0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICBzbG90LmlubmVySFRNTCA9IG9jckJveEh0bWwoaWQsIHIpOwogICAgT0NSX0xBU1RbaWRdID0gcjsKICAgIGlmIChhdXRvKSB7CiAgICAgIHZhciBuID0gb2NyQXBwbHlBbGwoaWQsIHRydWUpOwogICAgICB0',
  'b2FzdChuID8gJ+C4reC5iOC4suC4meC4o+C4ueC4m+C5geC4peC5ieC4pyDguYDguJXguLTguKHguYPguKvguYkgJyArIG4gKyAnIOC4iuC5iOC4reC4hyDigJQg4LiV4Lij4Lin4LiI4LiU4Li54LiB4LmI4Lit4LiZ4Lia4Lix4LiZ4LiX4Li24LiB4LiZ4LiwJyA6',
  'ICfguK3guYjguLLguJnguKPguLnguJvguYHguKXguYnguKcg4LmB4LiV4LmI4Lii4Lix4LiH4LiI4Lix4Lia4LiE4LmI4Liy4LiX4Li14LmI4LmD4LiK4LmJ4LmE4LiU4LmJ4LmE4Lih4LmI4LmE4LiU4LmJJywgbiA/ICdvaycgOiAnJyk7CiAgICB9CiAgfSkuY2F0',
  'Y2goZnVuY3Rpb24oZSl7CiAgICBzbG90LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJvY3ItYm94Ij48ZGl2IGNsYXNzPSJoZCI+4pqg77iPIOC4reC5iOC4suC4meC4o+C4ueC4m+C5hOC4oeC5iOC4quC4s+C5gOC4o+C5h+C4iDwvZGl2PicgKwogICAgICAnPGRp',
  'diBjbGFzcz0iaGludCI+JyArIGVzYyhlLm1lc3NhZ2UgfHwgZSkgKyAnPC9kaXY+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSBtdDgiIG9uY2xpY2s9InJ1bk9jcihcJycgKyBpZCArICdcJykiPuC4peC4reC4h+C4reC4teC4',
  'geC4hOC4o+C4seC5ieC4hzwvYnV0dG9uPjwvZGl2Pic7CiAgfSk7Cn0KCnZhciBPQ1JfTEFTVCA9IHt9OwoKLyoqIOC4hOC5iOC4suC4l+C4teC5iOC4reC5iOC4suC4meC5hOC4lOC5iSDguITguLnguYjguIHguLHguJrguIrguYjguK3guIfguYPguJnguJ/guK3g',
  'uKPguYzguKHguJfguLXguYjguIjguLDguYDguK3guLLguYTguJvguYPguKrguYggKi8KZnVuY3Rpb24gb2NyUGFpcnMocil7CiAgdmFyIG0gPSBGT1JNLm9jciB8fCB7fTsKICB2YXIgZyA9IHIuZ3Vlc3MgfHwge307CiAgdmFyIG91dCA9IFtdOwogIGlmIChtLmRh',
  'dGUgICAmJiBnLmRhdGUpICAgb3V0LnB1c2goeyBmaWVsZDogbS5kYXRlLCAgIGxhYmVsOiAn4Lin4Lix4LiZ4LiX4Li14LmIJywgICAgIHZhbHVlOiBnLmRhdGUsICAgc2hvdzogdGhEYXRlKGcuZGF0ZSkgfSk7CiAgaWYgKG0uYW1vdW50ICYmIGcuYW1vdW50KSBv',
  'dXQucHVzaCh7IGZpZWxkOiBtLmFtb3VudCwgbGFiZWw6ICfguIjguLPguJnguKfguJnguYDguIfguLTguJknLCAgdmFsdWU6IGcuYW1vdW50LCBzaG93OiBiYWh0KGcuYW1vdW50KSB9KTsKICBpZiAobS52ZW5kb3IgJiYgZy52ZW5kb3IpIG91dC5wdXNoKHsgZmll',
  'bGQ6IG0udmVuZG9yLCBsYWJlbDogJ+C4o+C5ieC4suC4mS/guJzguLnguYnguILguLLguKInLCB2YWx1ZTogZy52ZW5kb3IsIHNob3c6IGcudmVuZG9yIH0pOwogIGlmIChtLnRpdGxlICAmJiBnLnRpdGxlKSAgb3V0LnB1c2goeyBmaWVsZDogbS50aXRsZSwgIGxh',
  'YmVsOiAn4LiK4Li34LmI4Lit4Lij4Liy4Lii4LiB4Liy4LijJywgIHZhbHVlOiBnLnRpdGxlLCAgc2hvdzogZy50aXRsZSB9KTsKICBpZiAobS5ub3RlICAgJiYgZy5yZWYpICAgIG91dC5wdXNoKHsgZmllbGQ6IG0ubm90ZSwgICBsYWJlbDogJ+C5gOC4peC4guC4',
  'reC5ieC4suC4h+C4reC4tOC4hycsICB2YWx1ZTogJ+C4reC5ieC4suC4h+C4reC4tOC4hyAnICsgZy5yZWYsIHNob3c6IGcucmVmIH0pOwogIC8vIOC5g+C4muC5gOC4quC4o+C5h+C4iOC4q+C4peC4suC4ouC4o+C4suC4ouC4geC4suC4owogIGlmIChnLml0ZW1z',
  'ICYmIGcuaXRlbXMubGVuZ3RoID4gMSkgewogICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2xpbmVzJykpIHsKICAgICAgLy8g4Lif4Lit4Lij4LmM4Lih4LiZ4Li14LmJ4Lih4Li14LiV4Liy4Lij4Liy4LiH4Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI',
  '4Lit4LiiIOKAlCDguYDguJXguLTguKHguKXguIfguJXguLLguKPguLLguIfguYDguKXguKIg4LmE4LiU4LmJ4LiX4Lix4LmJ4LiH4LiK4Li34LmI4LitIOC4iOC4s+C4meC4p+C4mSDguYHguKXguLDguKPguLLguITguLLguYHguKLguIHguIHguLHguJkKICAgICAg',
  'b3V0LnB1c2goeyBmaWVsZDogJ19saW5lcycsIGxhYmVsOiAn4Lij4Liy4Lii4LiB4Liy4Lij4LmD4LiZ4Lia4Li04LilJywgdmFsdWU6IGcuaXRlbXMsCiAgICAgICAgICAgICAgICAgc2hvdzogJ+C5gOC4leC4tOC4oSAnICsgZy5pdGVtcy5sZW5ndGggKyAnIOC4',
  'o+C4suC4ouC4geC4suC4o+C4peC4h+C4leC4suC4o+C4suC4hycsIGxpbmVzOiB0cnVlIH0pOwogICAgfSBlbHNlIGlmIChtLnRpdGxlKSB7CiAgICAgIHZhciBsaW5lcyA9IGcuaXRlbXMubWFwKGZ1bmN0aW9uKGl0LCBpKXsgcmV0dXJuIChpKzEpICsgJy4nICsg',
  'aXQubmFtZSArICcgJyArIG1vbmV5KGl0LnByaWNlLCAyKSArICcg4Li/JzsgfSkuam9pbignXG4nKTsKICAgICAgb3V0LnB1c2goeyBmaWVsZDogbS50aXRsZSwgbGFiZWw6ICfguJfguLjguIHguKPguLLguKLguIHguLLguKMgKCcgKyBnLml0ZW1zLmxlbmd0aCAr',
  'ICcpJywgdmFsdWU6IGxpbmVzLAogICAgICAgICAgICAgICAgIHNob3c6IGcuaXRlbXMubGVuZ3RoICsgJyDguKPguLLguKLguIHguLLguKPguYPguJnguYPguJrguYDguKrguKPguYfguIgnLCBtdWx0aTogdHJ1ZSB9KTsKICAgIH0KICB9CiAgcmV0dXJuIG91dDsK',
  'fQoKZnVuY3Rpb24gb2NyQm94SHRtbChpZCwgcil7CiAgdmFyIHBhaXJzID0gb2NyUGFpcnMocik7CiAgaWYgKCFwYWlycy5sZW5ndGgpIHsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0ib2NyLWJveCI+PGRpdiBjbGFzcz0iaGQiPvCflI4g4Lit4LmI4Liy4LiZ4LiC',
  '4LmJ4Lit4LiE4Lin4Liy4Lih4LmE4LiU4LmJIOC5geC4leC5iOC4ouC4seC4h+C4iOC4seC4muC4hOC5iOC4suC4l+C4teC5iOC5g+C4iuC5ieC5hOC4lOC5ieC5hOC4oeC5iOC5hOC4lOC5iScgKwogICAgICAnPHNwYW4gY2xhc3M9InNwIj48YnV0dG9uIHR5cGU9',
  'ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0ib2NyVG9nZ2xlUmF3KFwnJyArIGlkICsgJ1wnKSI+4LiU4Li54LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiX4Li14LmI4Lit4LmI4Liy4LiZ4LmE4LiU4LmJPC9idXR0b24+PC9zcGFuPjwvZGl2PicgKwogICAg',
  'ICAnPGRpdiBjbGFzcz0ib2NyLXJhdyIgaWQ9IicgKyBpZCArICdfcmF3IiBoaWRkZW4+JyArIGVzYyhyLnRleHQgfHwgJyjguKfguYjguLLguIcpJykgKyAnPC9kaXY+PC9kaXY+JzsKICB9CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJvY3ItYm94Ij4nICsKICAgICc8',
  'ZGl2IGNsYXNzPSJoZCI+8J+UjiDguK3guYjguLLguJnguIjguLLguIHguKPguLnguJvguYTguJTguYnguYHguJrguJrguJnguLXguYkg4oCUIOC4geC4lOC5gOC4leC4tOC4oeC4iuC5iOC4reC4h+C4l+C4teC5iOC4leC5ieC4reC4h+C4geC4suC4oycgKwogICAg',
  'ICAnPHNwYW4gY2xhc3M9InNwIj4nICsKICAgICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20gcHJpIiBvbmNsaWNrPSJvY3JBcHBseUFsbChcJycgKyBpZCArICdcJykiPuC5gOC4leC4tOC4oeC4l+C4seC5ieC4h+C4q+C4oeC4lDwvYnV0',
  'dG9uPicgKwogICAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0ib2NyVG9nZ2xlUmF3KFwnJyArIGlkICsgJ1wnKSI+4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LmA4LiV4LmH4LihPC9idXR0b24+JyArCiAgICAgICc8L3Nw',
  'YW4+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0ib2NyLWhpdHMiPicgKyBwYWlycy5tYXAoZnVuY3Rpb24ocCwgaSl7CiAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0ib2NyLWhpdCI+JyArCiAgICAgICAgJzxzcGFuIGNsYXNzPSJrIj4nICsgZXNjKHAubGFiZWwp',
  'ICsgJzwvc3Bhbj4nICsKICAgICAgICAnPHNwYW4gY2xhc3M9InYiIHRpdGxlPSInICsgZXNjKHAubGluZXMgPyBwLnNob3cgOiBTdHJpbmcocC52YWx1ZSkpICsgJyI+JyArIGVzYyhwLnNob3cpICsgJzwvc3Bhbj4nICsKICAgICAgICAnPGJ1dHRvbiB0eXBlPSJi',
  'dXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9Im9jckFwcGx5T25lKFwnJyArIGlkICsgJ1wnLCcgKyBpICsgJykiPuC5gOC4leC4tOC4oTwvYnV0dG9uPicgKwogICAgICAnPC9kaXY+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicgKwogICAgJzxkaXYg',
  'Y2xhc3M9Im9jci1yYXciIGlkPSInICsgaWQgKyAnX3JhdyIgaGlkZGVuPicgKyBlc2Moci50ZXh0IHx8ICco4Lin4LmI4Liy4LiHKScpICsgJzwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImhpbnQgbXQ4Ij7guJXguKPguKfguIjguITguKfguLLguKHguJbguLng',
  'uIHguJXguYnguK3guIfguIHguYjguK3guJnguJrguLHguJnguJfguLbguIHguYDguKrguKHguK0g4oCUIOC5geC4geC5ieC5g+C4meC4iuC5iOC4reC4h+C5hOC4lOC5ieC4leC4suC4oeC4m+C4geC4leC4tDwvZGl2PicgKwogICc8L2Rpdj4nOwp9CgpmdW5jdGlv',
  'biBvY3JUb2dnbGVSYXcoaWQpewogIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkICsgJ19yYXcnKTsKICBpZiAoZWwpIGVsLmhpZGRlbiA9ICFlbC5oaWRkZW47Cn0KCi8qKiDguYPguKrguYjguITguYjguLLguKXguIfguIrguYjguK3guIcg4LmB',
  '4Lil4LmJ4Lin4LmE4Liu4LmE4Lil4LiV4LmM4LmD4Lir4LmJ4LmA4Lir4LmH4LiZ4Lin4LmI4Liy4LiK4LmI4Lit4LiH4LmE4Lir4LiZ4LiW4Li54LiB4LmA4LiV4Li04LihICovCmZ1bmN0aW9uIG9jckZpbGwoZmllbGRLZXksIHZhbHVlKXsKICAvLyDguYDguJXg',
  'uLTguKHguKXguIfguJXguLLguKPguLLguIfguKPguLLguKLguIHguLLguKPguKLguYjguK3guKIgKOC5g+C4muC5gOC4quC4o+C5h+C4iOC4l+C4teC5iOC4oeC4teC4guC4reC4h+C4q+C4peC4suC4ouC4reC4ouC5iOC4suC4hykKICBpZiAoZmllbGRLZXkgPT09',
  'ICdfbGluZXMnKSB7CiAgICB2YXIgYWRkID0gKHZhbHVlIHx8IFtdKS5tYXAoZnVuY3Rpb24oaXQpewogICAgICByZXR1cm4geyBuYW1lOiBpdC5uYW1lLCBxdHk6IDEsIHVuaXQ6ICcnLCBwcmljZTogTnVtYmVyKGl0LnByaWNlKSB8fCAwIH07CiAgICB9KTsKICAg',
  'IGlmICghYWRkLmxlbmd0aCkgcmV0dXJuIGZhbHNlOwogICAgRk9STS5saW5lcyA9IChGT1JNLmxpbmVzIHx8IFtdKS5maWx0ZXIoZnVuY3Rpb24obCl7IHJldHVybiBTdHJpbmcobC5uYW1lIHx8ICcnKS50cmltKCk7IH0pLmNvbmNhdChhZGQpOwogICAgcmVkcmF3',
  'TGluZXMoKTsKICAgIHZhciBib3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9saW5lcycpOwogICAgaWYgKGJveCkgewogICAgICBib3guY2xhc3NMaXN0LmFkZCgnb2NyLWZpbGxlZCcpOwogICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IGJveC5jbGFz',
  'c0xpc3QucmVtb3ZlKCdvY3ItZmlsbGVkJyk7IH0sIDE2MDApOwogICAgfQogICAgcmV0dXJuIHRydWU7CiAgfQoKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl8nICsgZmllbGRLZXkpOwogIGlmICghZWwpIHJldHVybiBmYWxzZTsKICBlbC52',
  'YWx1ZSA9IHZhbHVlOwogIGVsLmNsYXNzTGlzdC5hZGQoJ29jci1maWxsZWQnKTsKICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IGVsLmNsYXNzTGlzdC5yZW1vdmUoJ29jci1maWxsZWQnKTsgfSwgMTYwMCk7CiAgcmVjYWxjU3VtcygpOwogIHJldHVybiB0cnVlOwp9',
  'CgpmdW5jdGlvbiBvY3JBcHBseU9uZShpZCwgaWR4KXsKICB2YXIgciA9IE9DUl9MQVNUW2lkXTsKICBpZiAoIXIpIHJldHVybjsKICB2YXIgcCA9IG9jclBhaXJzKHIpW2lkeF07CiAgaWYgKHAgJiYgb2NyRmlsbChwLmZpZWxkLCBwLnZhbHVlKSkgewogICAgdG9h',
  'c3QocC5saW5lcyA/ICfguYDguJXguLTguKEgJyArIHAudmFsdWUubGVuZ3RoICsgJyDguKPguLLguKLguIHguLLguKPguKXguIfguJrguLTguKXguYHguKXguYnguKcg4oCUIOC4leC4o+C4p+C4iOC4iOC4s+C4meC4p+C4meC4geC4seC4muC4o+C4suC4hOC4suC4',
  'reC4teC4geC4hOC4o+C4seC5ieC4hycgOiAn4LmA4LiV4Li04LihJyArIHAubGFiZWwgKyAn4LmB4Lil4LmJ4LinJywgJ29rJyk7CiAgfQp9CgovKioKICogQHBhcmFtIHtib29sZWFufSBvbmx5RW1wdHkgdHJ1ZSA9IOC5gOC4leC4tOC4oeC5gOC4ieC4nuC4suC4',
  'sOC4iuC5iOC4reC4h+C4l+C4teC5iOC4ouC4seC4h+C4p+C5iOC4suC4hyAo4LmD4LiK4LmJ4LiV4Lit4LiZ4LmA4LiV4Li04Lih4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0CiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIOC4iOC4sOC5hOC4lOC5ieC5',
  'hOC4oeC5iOC4l+C4seC4muC4quC4tOC5iOC4h+C4l+C4teC5iOC4nOC4ueC5ieC5g+C4iuC5ieC4nuC4tOC4oeC4nuC5jOC5hOC4m+C5geC4peC5ieC4pykKICogQHJldHVybiB7bnVtYmVyfSDguIjguLPguJnguKfguJnguIrguYjguK3guIfguJfguLXguYjguYDg',
  'uJXguLTguKHguIjguKPguLTguIcKICovCmZ1bmN0aW9uIG9jckFwcGx5QWxsKGlkLCBvbmx5RW1wdHkpewogIHZhciByID0gT0NSX0xBU1RbaWRdOwogIGlmICghcikgcmV0dXJuIDA7CiAgdmFyIGRvbmUgPSB7fTsKICB2YXIgbiA9IDA7CiAgb2NyUGFpcnMociku',
  'Zm9yRWFjaChmdW5jdGlvbihwKXsKICAgIGlmIChkb25lW3AuZmllbGRdKSByZXR1cm47ICAgICAgICAgICAgICAgICAgICAgICAvLyDguIrguYjguK3guIfguYDguJTguLXguKLguKfguIHguLHguJnguYDguJXguLTguKHguITguKPguLHguYnguIfguYDguJTguLXg',
  'uKLguKcg4LmA4Lit4Liy4LiV4Lix4Lin4LmB4Lij4LiBCiAgICBpZiAocC5maWVsZCA9PT0gJ19saW5lcycpIHsKICAgICAgLy8g4LiV4Liy4Lij4Liy4LiH4Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4LiiOiAi4Lin4LmI4Liy4LiHIiDguKvguKHguLLguKLg',
  'uJbguLbguIfguKLguLHguIfguYTguKHguYjguKHguLXguKPguLLguKLguIHguLLguKPguJfguLXguYjguJXguLHguYnguIfguIrguLfguYjguK3guYTguKfguYkKICAgICAgaWYgKG9ubHlFbXB0eSAmJiAoRk9STS5saW5lcyB8fCBbXSkuc29tZShmdW5jdGlvbihs',
  'KXsgcmV0dXJuIFN0cmluZyhsLm5hbWUgfHwgJycpLnRyaW0oKTsgfSkpIHJldHVybjsKICAgIH0gZWxzZSB7CiAgICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmXycgKyBwLmZpZWxkKTsKICAgICAgaWYgKCFlbCkgcmV0dXJuOwogICAgICBp',
  'ZiAob25seUVtcHR5ICYmIFN0cmluZyhlbC52YWx1ZSB8fCAnJykudHJpbSgpICE9PSAnJykgcmV0dXJuOwogICAgfQogICAgaWYgKG9jckZpbGwocC5maWVsZCwgcC52YWx1ZSkpIHsgZG9uZVtwLmZpZWxkXSA9IHRydWU7IG4rKzsgfQogIH0pOwogIGlmICghb25s',
  'eUVtcHR5KSB0b2FzdChuID8gJ+C5gOC4leC4tOC4oeC5g+C4q+C5iSAnICsgbiArICcg4LiK4LmI4Lit4LiH4LmB4Lil4LmJ4LinIOKAlCDguJXguKPguKfguIjguJTguLnguIHguYjguK3guJnguJrguLHguJnguJfguLbguIEnIDogJ+C4iuC5iOC4reC4h+C4l+C4',
  'teC5iOC4iOC4sOC5gOC4leC4tOC4oeC5hOC4oeC5iOC4reC4ouC4ueC5iOC5g+C4meC4n+C4reC4o+C5jOC4oeC4meC4teC5iScsIG4gPyAnb2snIDogJ2VycicpOwogIHJldHVybiBuOwp9CgpmdW5jdGlvbiByb29tT3B0aW9ucygpeyByZXR1cm4gUy5ib290ID8g',
  'Uy5ib290LnJvb21zIDogW107IH0KZnVuY3Rpb24gb3B0KG5hbWUpeyByZXR1cm4gKFMuYm9vdCAmJiBTLmJvb3Quc2NoZW1hW25hbWVdKSB8fCBbXTsgfQpmdW5jdGlvbiB0b2RheSgpeyByZXR1cm4gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNsaWNlKDAsMTAp',
  'OyB9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguIHguYnguK3guJnguKvguJnguLXguYkKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1EZWJ0KHJlYywgbGVkZ2VyKXsKICAvLyDguYDguKXguLfguK3guIHguYHguKHguYjguYTguJTguYnguIjguLLguIHguJfguLjguIHguJrguLHguI3guIrguLUg4Lii4LiB4LmA4Lin4LmJ',
  '4LiZ4LiV4Lix4Lin4LmA4Lit4LiHCiAgdmFyIGFsbCA9IChBTExfREVCVFMgfHwgW10pLmZpbHRlcihmdW5jdGlvbihkKXsgcmV0dXJuICFyZWMgfHwgZC5pZCAhPT0gcmVjLmlkOyB9KTsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfg',
  'uYHguIHguYnguYTguILguIHguYnguK3guJnguKvguJnguLXguYknIDogJ+C5gOC4nuC4tOC5iOC4oeC4geC5ieC4reC4meC4q+C4meC4teC5iScsCiAgICByZWNvcmQ6IHJlYywgYWN0aW9uOiAnZGVidC5zYXZlJywgYmFzZTogeyBsZWRnZXI6IGxlZGdlciB9LAog',
  'ICAgb25EZWxldGU6IGRlbERlYnQsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3RpdGxlJywgICAgbGFiZWw6J+C4o+C4suC4ouC4geC4suC4o+C4q+C4meC4teC5iScsIHJlcXVpcmVkOnRydWUsIGZ1bGw6dHJ1ZSwgcGg6J+C5gOC4iuC5iOC4mSDguITguYjg',
  'uLLguIHguYjguK3guKrguKPguYnguLLguIcgVGhlIE0gQ29ybmVyIEFQJyB9LAogICAgICB7IGtleTonbGVkZ2VyJywgICBsYWJlbDon4Lib4Lij4Liw4LmA4Lig4LiX4Lia4Lix4LiN4LiK4Li1JywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpbJ+C4q+C4meC4teC5',
  'ieC4q+C4peC4seC4gScsJ+C4q+C4meC4teC5ieC4o+C4reC4hyddLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleTonY3JlZGl0b3InLCBsYWJlbDon4LmA4LiI4LmJ4Liy4Lir4LiZ4Li14LmJJywgcGg6J+C5gOC4iuC5iOC4mSDguITguKPguK3guJrguITguKPg',
  'uLHguKcgLyDguJjguJnguLLguITguLLguKMgLyDguJvguYnguLLguJXguLInIH0sCiAgICAgIHsga2V5OidwYXJlbnRJZCcsIGxhYmVsOifguYDguJvguYfguJnguKrguYjguKfguJnguKvguJnguLbguYjguIfguILguK3guIfguIHguYnguK3guJnguKvguJnguLXg',
  'uYknLCB0eXBlOidzZWxlY3QnLCBmdWxsOnRydWUsCiAgICAgICAgb3B0aW9uczogYWxsLm1hcChmdW5jdGlvbihkKXsgcmV0dXJuIHsgdmFsdWU6ZC5pZCwgbGFiZWw6ZC50aXRsZSArICcgKCcgKyBkLmxlZGdlciArICcpJyB9OyB9KSwKICAgICAgICBoaW50Oifg',
  'uYPguIrguYnguYDguKHguLfguYjguK3guYDguIfguLTguJnguIHguYnguK3guJnguJnguLXguYnguYDguJvguYfguJnguJfguLjguJnguILguK3guIfguK3guLXguIHguIHguYnguK3guJkg4LmA4LiK4LmI4LiZIOC5gOC4h+C4tOC4meC4ouC4t+C4oeC4m+C5ieC4',
  'suC4leC4suC5gOC4m+C5h+C4meC4quC5iOC4p+C4meC4q+C4meC4tuC5iOC4h+C4guC4reC4h+C4q+C4meC4teC5ieC4i+C4t+C5ieC4reC4l+C4teC5iOC4lOC4tOC4mSDigJQgJyArCiAgICAgICAgICAgICAn4LiI4LmI4Liy4Lii4LiE4Li34LiZ4LiB4LmJ4Lit',
  '4LiZ4LiZ4Li14LmJ4LmB4Lil4LmJ4Lin4LiB4LmJ4Lit4LiZ4LmB4Lih4LmI4LiI4Liw4Lil4LiU4LiV4Liy4Lih4LmE4Lib4LiU4LmJ4Lin4LiiIOC5geC4peC4sOC4ouC4reC4lOC4o+C4p+C4oeC4iOC4sOC5hOC4oeC5iOC4luC4ueC4geC4meC4seC4muC4i+C5',
  'ieC4sycgfSwKICAgICAgeyBrZXk6J3N0YXJ0RGF0ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguIHguYjguK3guKvguJnguLXguYknLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleToncHJpbmNpcGFsJywgbGFiZWw6J+C4ouC4reC4lOC4q+C4meC4teC5',
  'ieC4leC4seC5ieC4h+C4leC5ieC4mSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JywgcmVxdWlyZWQ6dHJ1ZSB9LAogICAgICB7IGtleTonaW50ZXJlc3RQZXJNb250aCcsIGxhYmVsOifguJTguK3guIHguYDguJrguLXguYnguKLguJXguYjguK3guYDguJTguLfg',
  'uK3guJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScgfSwKICAgICAgeyBrZXk6J3BsYW5QZXJNb250aCcsIGxhYmVsOifguKLguK3guJTguJzguYjguK3guJnguJXguYjguK3guYDguJTguLfguK3guJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScgfSwKICAg',
  'ICAgeyBrZXk6J2R1ZURheScsICAgbGFiZWw6J+C4geC4s+C4q+C4meC4lOC4iuC4s+C4o+C4sCAo4Lin4Lix4LiZ4LiX4Li14LmI4LiC4Lit4LiH4LmA4LiU4Li34Lit4LiZKScsIHR5cGU6J251bWJlcicsIHBoOicyMCcgfSwKICAgICAgeyBrZXk6J3N0YXR1cycs',
  'ICAgbGFiZWw6J+C4quC4luC4suC4meC4sCcsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdkZWJ0U3RhdHVzZXMnKSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6',
  'J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0KICB9KTsKICBpZiAoIXJlYykgeyB2YXIgZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2xlZGdlcicpOyBpZiAoZSkgZS52YWx1ZSA9IGxlZGdlcjsgfQp9CgpmdW5jdGlvbiBkZWxEZWJ0KGlkKXsKICBj',
  'b25maXJtQWN0aW9uKCfguKXguJrguIHguYnguK3guJnguKvguJnguLXguYnguJnguLXguYk/IOC4o+C4suC4ouC4geC4suC4o+C4iuC4s+C4o+C4sOC4l+C4teC5iOC4nOC4ueC4geC5hOC4p+C5ieC4iOC4sOC4ouC4seC4h+C4reC4ouC4ueC5iCcsIGZ1bmN0aW9u',
  'KCl7CiAgICBjYWxsQXBpKCdkZWJ0LmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2Fz',
  'dChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4Lij4Liy4Lii4LiB4Liy4Lij4LmC4Lit4LiZ4LmD',
  '4LiK4LmJ4Lir4LiZ4Li14LmJCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtRGVidFBheW1lbnQocmVjLCBsZWRnZXIpewogIHZhciBkZWJ0cyA9IChTLmNhY2hlW1Mu',
  'cGFnZV0gJiYgUy5jYWNoZVtTLnBhZ2VdLmRlYnRzKSB8fCBbXTsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguKPguLLguKLguIHguLLguKPguIrguLPguKPguLAnIDogJ+C4muC4seC4meC4l+C4tuC4geC4',
  'geC4suC4o+C5guC4reC4meC5g+C4iuC5ieC4q+C4meC4teC5iScsCiAgICByZWNvcmQ6IHJlYyB8fCB7IHBheURhdGU6IHRvZGF5KCksIGNoYW5uZWw6ICfguYLguK3guJkgUVInIH0sCiAgICBhY3Rpb246ICdkZWJ0LnNhdmVQYXltZW50JywgYmFzZTogeyBsZWRn',
  'ZXI6IGxlZGdlciB9LCBidWNrZXQ6ICdkZWJ0JywKICAgIG9jcjogeyBkYXRlOidwYXlEYXRlJywgYW1vdW50OidwcmluY2lwYWwnLCBub3RlOidub3RlJyB9LAogICAgb25EZWxldGU6IGRlbERlYnRQYXltZW50LAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oidw',
  'YXlEYXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4iuC4s+C4o+C4sCcsIHR5cGU6J2RhdGUnLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidjaGFubmVsJywgbGFiZWw6J+C4iuC5iOC4reC4h+C4l+C4suC4hycsIHR5cGU6J3NlbGVjdCcsIG9w',
  'dGlvbnM6b3B0KCdwYXlDaGFubmVscycpIH0sCiAgICAgIHsga2V5OidwcmluY2lwYWwnLCBsYWJlbDon4LmA4LiH4Li04LiZ4LiV4LmJ4LiZICjguJrguLLguJcpJywgdHlwZTonbW9uZXknLCBzdW1zOnRydWUsCiAgICAgICAgaGludDon4Liq4LmI4Lin4LiZ4LiX',
  '4Li14LmI4LmE4Lib4Lil4LiU4Lii4Lit4LiU4Lir4LiZ4Li14LmJ4LiI4Lij4Li04LiHJyB9LAogICAgICB7IGtleTonaW50ZXJlc3QnLCAgbGFiZWw6J+C4lOC4reC4geC5gOC4muC4teC5ieC4oiAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5Jywgc3Vtczp0cnVl',
  'LAogICAgICAgIGhpbnQ6J+C5hOC4oeC5iOC4luC4ueC4geC4meC4s+C5hOC4m+C4peC4lOC4ouC4reC4lOC4q+C4meC4teC5iScgfSwKICAgICAgeyBrZXk6J190b3RhbCcsICBsYWJlbDon4Lij4Lin4Lih4LiX4Li14LmI4LmC4Lit4LiZJywgdHlwZTonY29tcHV0',
  'ZWQnLCBmcm9tOlsncHJpbmNpcGFsJywnaW50ZXJlc3QnXSwKICAgICAgICBoaW50OifguJXguKPguKfguIjguYPguKvguYnguJXguKPguIfguIHguLHguJrguKLguK3guJTguYPguJnguKrguKXguLTguJsgwrcg4Lij4Liw4Lia4Lia4LiE4Li04LiU4LmD4Lir4LmJ',
  '4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0JyB9LAogICAgICB7IGtleTonaW5zdGFsbG1lbnQnLCBsYWJlbDon4LiH4Lin4LiU4LiX4Li14LmIJywgcGg6J+C5gOC4iuC5iOC4mSA5LzI1NjknIH0sCiAgICAgIHsga2V5OidkZWJ0SWQnLCAgbGFiZWw6J+C4nOC4',
  'ueC4geC4geC4seC4muC4geC5ieC4reC4meC4q+C4meC4teC5iScsIHR5cGU6J3NlbGVjdCcsCiAgICAgICAgb3B0aW9uczogZGVidHMubWFwKGZ1bmN0aW9uKGQpeyByZXR1cm4geyB2YWx1ZTpkLmlkLCBsYWJlbDpkLnRpdGxlIH07IH0pLAogICAgICAgIGhpbnQ6',
  'J+C5gOC4p+C5ieC4meC4p+C5iOC4suC4h+C5hOC4lOC5iSDigJQg4Lij4Liw4Lia4Lia4LiI4Liw4LiZ4Lix4Lia4Lij4Lin4Lih4LiX4Lix4LmJ4LiH4Lia4Lix4LiN4LiK4Li1JyB9LAogICAgICB7IGtleToncGF5ZXInLCAgIGxhYmVsOifguJzguLnguYnguIrg',
  'uLPguKPguLAnIH0sCiAgICAgIHsga2V5OidzbGlwcycsICAgbGFiZWw6J+C4quC4peC4tOC4m+C4geC4suC4o+C5guC4reC4mScsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4',
  'q+C4leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0KICB9KTsKfQoKZnVuY3Rpb24gZGVsRGVidFBheW1lbnQoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4o+C4suC4ouC4geC4suC4o+C4iuC4s+C4o+C4sOC4meC4teC5iT8nLCBm',
  'dW5jdGlvbigpewogICAgY2FsbEFwaSgnZGVidC5kZWxldGVQYXltZW50JywgeyBpZDogaWQgfSkudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9KQogICAgICAuY2F0Y2goZnVu',
  'Y3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguKPguLLguKLguIHguLLg',
  'uKPguIvguLfguYnguK3guILguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1QdXJjaGFzZShyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYg',
  'cmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4rScgOiAn4LmA4Lie4Li04LmI4Lih4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHJywKICAgIHJlY29yZDogcmVjIHx8IHsgYnV5RGF0ZTogdG9k',
  'YXkoKSB9LAogICAgYWN0aW9uOiAncHVyY2hhc2Uuc2F2ZScsIGJ1Y2tldDogJ3B1cmNoYXNlcycsIHdpZGU6IHRydWUsCiAgICBvY3I6IHsgZGF0ZTonYnV5RGF0ZScsIGFtb3VudDoncHJpY2UnLCB2ZW5kb3I6J3ZlbmRvcicsIHRpdGxlOidpdGVtJyB9LAogICAg',
  'b25EZWxldGU6IGRlbFB1cmNoYXNlLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5OidpdGVtJywgICAgbGFiZWw6J+C4iuC4t+C5iOC4reC4muC4tOC4pSAvIOC4o+C4suC4ouC4geC4suC4o+C4q+C4peC4seC4gScsIHR5cGU6J3RleHRhcmVhJywgcmVxdWlyZWQ6',
  'dHJ1ZSwgZnVsbDp0cnVlLAogICAgICAgIHBoOifguYDguIrguYjguJkg4Liq4Lix4LmI4LiH4LiC4Lit4LiH4LmA4LiC4LmJ4Liy4Lir4LitIFNob3BlZSDguKPguYnguLLguJkgQUJDJywKICAgICAgICBoaW50OifguJbguYnguLLguYPguKrguYjguKPguLLguKLg',
  'uIHguLLguKPguKLguYjguK3guKLguILguYnguLLguIfguKXguYjguLLguIfguYTguKfguYkg4LmB4Lil4LmJ4Lin4LmA4Lin4LmJ4LiZ4LiK4LmI4Lit4LiH4LiZ4Li14LmJ4Lin4LmI4Liy4LiHIOC4o+C4sOC4muC4muC4iOC4sOC4leC4seC5ieC4h+C4iuC4t+C5',
  'iOC4reC5g+C4q+C5ieC5gOC4reC4h+C4iOC4suC4geC4o+C4suC4ouC4geC4suC4o+C5geC4o+C4gScgfSwKICAgICAgeyBrZXk6J2J1eURhdGUnLCBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiL4Li34LmJ4LitJywgdHlwZTonZGF0ZScsIHJlcXVpcmVkOnRy',
  'dWUgfSwKICAgICAgeyBrZXk6J2NhdGVnb3J5JywgbGFiZWw6J+C4q+C4oeC4p+C4lOC4q+C4oeC4ueC5iCcsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdwdXJjaGFzZUNhdGVnb3JpZXMnKSB9LAoKICAgICAgeyBrZXk6J2xpbmVzJywgICBsYWJlbDon4Lij',
  '4Liy4Lii4LiB4Liy4Lij4LmD4LiZ4Lia4Li04LilICjguIvguLfguYnguK3guJfguLXguYDguJTguLXguKLguKfguKvguKXguLLguKLguK3guKLguYjguLLguIfguYPguKrguYjguJXguKPguIfguJnguLXguYkpJywgdHlwZTonbGluZXMnLCBmdWxsOnRydWUsCiAg',
  'ICAgICAgaGludDon4Liq4Lix4LmI4LiH4Lit4Lit4LiZ4LmE4Lil4LiZ4LmM4LiE4Lij4Lix4LmJ4LiH4LmA4LiU4Li14Lii4Lin4LmE4LiU4LmJ4LiC4Lit4LiH4Lir4Lil4Liy4Lii4Lit4Lii4LmI4Liy4LiHIOC5g+C4quC5iOC5geC4ouC4geC4l+C4teC4peC4',
  'sOC4o+C4suC4ouC4geC4suC4o+C5hOC4lOC5ieC5gOC4peC4oiDCtyDguKPguLDguJrguJrguKPguKfguKHguKPguLLguITguLLguYPguKvguYnguK3guLHguJXguYLguJnguKHguLHguJXguLQnIH0sCiAgICAgIHsga2V5OidzaGlwcGluZycsIGxhYmVsOifguITg',
  'uYjguLLguKrguYjguIcgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHBoOicwJywgb25pbnB1dDoncmVjYWxjQmlsbCgpJyB9LAogICAgICB7IGtleTonZGlzY291bnQnLCBsYWJlbDon4Liq4LmI4Lin4LiZ4Lil4LiUICjguJrguLLguJcpJywgdHlwZTonbW9u',
  'ZXknLCBwaDonMCcsIG9uaW5wdXQ6J3JlY2FsY0JpbGwoKScgfSwKICAgICAgeyBrZXk6J3ByaWNlJywgICBsYWJlbDon4Lij4Liy4LiE4Liy4Lij4Lin4Lih4LiX4Lix4LmJ4LiH4Lia4Li04LilICjguJrguLLguJcpJywgdHlwZTonbW9uZXknLCByZXF1aXJlZDp0',
  'cnVlLAogICAgICAgIGhpbnQ6JzxzcGFuIGlkPSJiaWxsSGludCI+PC9zcGFuPicgfSwKICAgICAgeyBrZXk6J29yZGVyTm8nLCBsYWJlbDon4LmA4Lil4LiC4LiX4Li14LmI4LiE4Liz4Liq4Lix4LmI4LiH4LiL4Li34LmJ4LitJywgcGg6J+C5gOC4peC4guC4reC4',
  'reC4o+C5jOC5gOC4lOC4reC4o+C5jOC4iOC4suC4gSBTaG9wZWUgLyBMYXphZGEnIH0sCiAgICAgIHsga2V5Oid2ZW5kb3InLCAgbGFiZWw6J+C5geC4q+C4peC5iOC4h+C4l+C4teC5iOC4i+C4t+C5ieC4rScsIHBoOidTaG9wZWUgLyDguYTguJfguKfguLHguKrg',
  'uJTguLggLyDguKPguYnguLLguJnigKYnIH0sCiAgICAgIHsga2V5OidwYXllcicsICAgbGFiZWw6J+C4nOC4ueC5ieC4iuC4s+C4o+C4sCcgfSwKICAgICAgeyBrZXk6J3dhcnJhbnR5TW9udGhzJywgbGFiZWw6J+C4o+C4sOC4ouC4sOC5gOC4p+C4peC4suC4o+C4',
  'seC4muC4m+C4o+C4sOC4geC4seC4mSAo4LmA4LiU4Li34Lit4LiZKScsIHR5cGU6J251bWJlcicsCiAgICAgICAgaGludDon4Lij4Liw4Lia4Lia4LiI4Liw4LiE4Liz4LiZ4Lin4LiT4Lin4Lix4LiZ4Lir4Lih4LiU4Lib4Lij4Liw4LiB4Lix4LiZ4LmD4Lir4LmJ',
  '4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0JyB9LAogICAgICB7IGtleToncm9vbScsICAgIGxhYmVsOifguKvguYnguK3guIcv4Lie4Li34LmJ4LiZ4LiX4Li14LmI4LiX4Li14LmI4LmD4LiK4LmJJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpbJ+C4quC5iOC4',
  'p+C4meC4geC4peC4suC4hyddLmNvbmNhdChyb29tT3B0aW9ucygpKSB9LAogICAgICB7IGtleToncGhvdG9zJywgIGxhYmVsOifguKDguLLguJ7guJvguKPguLDguIHguK3guJrguKrguLTguJnguITguYnguLInLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAog',
  'ICAgICB7IGtleTonc2xpcHMnLCAgIGxhYmVsOifguKrguKXguLTguJvguIHguLLguKPguYLguK3guJnguIrguLPguKPguLAnLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonbm90ZScsICAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvg',
  'uJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbFB1cmNoYXNlKGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guJnguLXguYk/JywgZnVuY3Rp',
  'b24oKXsKICAgIGNhbGxBcGkoJ3B1cmNoYXNlLmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUp',
  'eyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmM',
  'CiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtQWMocmVjKXsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguKPg',
  'uLLguKLguIHguLLguKPguKXguYnguLLguIfguYHguK3guKPguYwnIDogJ+C4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C4peC5ieC4suC4h+C5geC4reC4o+C5jCcsCiAgICByZWNvcmQ6IHJlYyB8fCB7IGJvb2tEYXRlOiB0b2RheSgpIH0sCiAgICBhY3Rpb246',
  'ICdhYy5zYXZlJywgYnVja2V0OiAnYWMnLAogICAgb2NyOiB7IGRhdGU6J3NlcnZpY2VEYXRlJywgYW1vdW50Oidjb3N0JywgdmVuZG9yOid0ZWNobmljaWFuJyB9LAogICAgb25EZWxldGU6IGRlbEFjLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oidyb29tJywg',
  'ICAgICAgIGxhYmVsOifguKvguYnguK3guIcnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOnJvb21PcHRpb25zKCksIHJlcXVpcmVkOnRydWUsIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5Oidyb3VuZCcsICAgICAgIGxhYmVsOifguKPguK3guJrguJfguLXguYgn',
  'LCB0eXBlOidudW1iZXInLCBoaW50OifguYDguKfguYnguJnguKfguYjguLLguIfguYPguKvguYnguKPguLDguJrguJrguJnguLHguJrguJXguYjguK3guIjguLLguIHguKPguK3guJrguKXguYjguLLguKrguLjguJTguILguK3guIfguJvguLXguJnguLHguYnguJkn',
  'IH0sCiAgICAgIHsga2V5Oidib29rRGF0ZScsICAgIGxhYmVsOifguKfguLHguJnguJfguLXguYjguJnguLHguJTguKXguYnguLLguIfguYHguK3guKPguYwnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonc2VydmljZURhdGUnLCBsYWJlbDon4Lin4Lix4LiZ',
  '4LiX4Li14LmI4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4Lij4LiI4Lij4Li04LiHJywgdHlwZTonZGF0ZScsIGhpbnQ6J+C4geC4o+C4reC4geC5gOC4oeC4t+C5iOC4reC4peC5ieC4suC4h+C5gOC4quC4o+C5h+C4iOC5geC4peC5ieC4pycgfSwKICAgICAgeyBr',
  'ZXk6J3N0YXR1cycsICAgICAgbGFiZWw6J+C4quC4luC4suC4meC4sCcsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdhY1N0YXR1c2VzJykgfSwKICAgICAgeyBrZXk6J3RlY2huaWNpYW4nLCAgbGFiZWw6J+C4iuC5iOC4suC4hyAvIOC4nOC4ueC5ieC5g+C4',
  'q+C5ieC4muC4o+C4tOC4geC4suC4oycgfSwKICAgICAgeyBrZXk6J2Nvc3QnLCAgICAgICAgbGFiZWw6J+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oiAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JyB9LAogICAgICB7IGtleToncGhvdG9zJywgICAgICBs',
  'YWJlbDon4Lig4Liy4Lie4Lib4Lij4Liw4LiB4Lit4LiaJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICAgICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVl',
  'IH0KICAgIF0KICB9KTsKfQoKZnVuY3Rpb24gZGVsQWMoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4o+C4suC4ouC4geC4suC4o+C4peC5ieC4suC4h+C5geC4reC4o+C5jOC4meC4teC5iT8nLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgnYWMuZGVsZXRl',
  'JywgeyBpZDogaWQgfSkudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwog',
  'IH0pOwp9CgovKiog4LiZ4Lix4LiU4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4Lir4Lil4Liy4Lii4Lir4LmJ4Lit4LiH4Lie4Lij4LmJ4Lit4Lih4LiB4Lix4LiZICovCmZ1bmN0aW9uIGZvcm1CdWxrQWMoKXsKICB2YXIgcm9vbXMgPSByb29tT3B0aW9ucygpOwog',
  'IHZhciBib2R5ID0KICAgICc8ZGl2IGNsYXNzPSJmZ3JpZCI+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIj48bGFiZWw+4Lin4Lix4LiZ4LiX4Li14LmI4LiZ4Lix4LiUIDxzcGFuIHN0eWxlPSJjb2xvcjp2YXIoLS1kYW5nZXIpIj4qPC9zcGFuPjwvbGFiZWw+JyAr',
  'CiAgICAgICAgJzxpbnB1dCB0eXBlPSJkYXRlIiBjbGFzcz0iaW5wIiBpZD0iYmtfZGF0ZSIgdmFsdWU9IicgKyB0b2RheSgpICsgJyI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIj48bGFiZWw+4LiK4LmI4Liy4LiHIC8g4Lic4Li54LmJ4LmD4Lir4LmJ',
  '4Lia4Lij4Li04LiB4Liy4LijPC9sYWJlbD48aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImJrX3RlY2giPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiI+PGxhYmVsPuC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ouC4leC5iOC4reC4q+C5ieC4reC4hyAo',
  '4Lia4Liy4LiXKTwvbGFiZWw+PGlucHV0IHR5cGU9Im51bWJlciIgY2xhc3M9ImlucCIgaWQ9ImJrX2Nvc3QiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiI+PGxhYmVsPuC4q+C4oeC4suC4ouC5gOC4q+C4leC4uDwvbGFiZWw+PGlucHV0IGNsYXNzPSJp',
  'bnAiIGlkPSJia19ub3RlIj48L2Rpdj4nICsKICAgICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0icm93IG1iOCI+PGIgY2xhc3M9ImZzMTMiPuC5gOC4peC4t+C4reC4geC4q+C5ieC4reC4hzwvYj48c3Bh',
  'biBjbGFzcz0ic3AiPjwvc3Bhbj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iYnVsa1BpY2soXCdhbGxcJykiPuC4l+C4seC5ieC4h+C4q+C4oeC4lDwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNs',
  'aWNrPSJidWxrUGljayhcJ25vbmVcJykiPuC4peC5ieC4suC4hzwvYnV0dG9uPicgKwogICAgICBbMSwyLDMsNCw1XS5tYXAoZnVuY3Rpb24oZil7IHJldHVybiAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJidWxrUGljaygnICsgZiArICcpIj7guIrg',
  'uLHguYnguJkgJyArIGYgKyAnPC9idXR0b24+JzsgfSkuam9pbignJykgKwogICAgJzwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InJvb21zIiBpZD0iYmtSb29tcyI+JyArIHJvb21zLm1hcChmdW5jdGlvbihyKXsKICAgICAgcmV0dXJuICc8bGFiZWwgY2xhc3M9',
  'InJvb20iIHN0eWxlPSJjdXJzb3I6cG9pbnRlciI+PGlucHV0IHR5cGU9ImNoZWNrYm94IiBjbGFzcz0iYmsiIHZhbHVlPSInICsgciArICciPiA8Yj4nICsgciArICc8L2I+PC9sYWJlbD4nOwogICAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKCiAgb3Blbk1vZGFs',
  'KCfwn5OFIOC4meC4seC4lOC4peC5ieC4suC4h+C5geC4reC4o+C5jOC4q+C4peC4suC4ouC4q+C5ieC4reC4h+C4nuC4o+C5ieC4reC4oeC4geC4seC4mScsIGJvZHksCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4',
  'geC5gOC4peC4tOC4gTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIGlkPSJia1NhdmUiPuC4quC4o+C5ieC4suC4h+C4meC4seC4lOC4q+C4oeC4suC4ojwvYnV0dG9uPicsIHRydWUpOwoKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgn',
  'YmtTYXZlJykub25jbGljayA9IGZ1bmN0aW9uKCl7CiAgICB2YXIgcGlja2VkID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmJrOmNoZWNrZWQnKSkubWFwKGZ1bmN0aW9uKGMpeyByZXR1cm4gYy52YWx1ZTsg',
  'fSk7CiAgICB2YXIgZGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdia19kYXRlJykudmFsdWU7CiAgICBpZiAoIXBpY2tlZC5sZW5ndGgpIHJldHVybiB0b2FzdCgn4LmA4Lil4Li34Lit4LiB4Lit4Lii4LmI4Liy4LiH4LiZ4LmJ4Lit4LiiIDEg4Lir4LmJ',
  '4Lit4LiHJywgJ2VycicpOwogICAgaWYgKCFkYXRlKSByZXR1cm4gdG9hc3QoJ+C4geC4o+C4uOC4k+C4suC4o+C4sOC4muC4uOC4p+C4seC4meC4l+C4teC5iOC4meC4seC4lCcsICdlcnInKTsKICAgIHZhciBidG4gPSB0aGlzOyBidG4uZGlzYWJsZWQgPSB0cnVl',
  'OyBidG4uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C4muC4seC4meC4l+C4tuC4geKApic7CiAgICBjYWxsQXBpKCdhYy5idWxrQm9vaycsIHsKICAgICAgcm9vbXM6IHBpY2tlZCwgYm9va0RhdGU6IGRhdGUs',
  'CiAgICAgIHRlY2huaWNpYW46IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdia190ZWNoJykudmFsdWUsCiAgICAgIGNvc3Q6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdia19jb3N0JykudmFsdWUsCiAgICAgIG5vdGU6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlk',
  'KCdia19ub3RlJykudmFsdWUKICAgIH0pLnRoZW4oZnVuY3Rpb24obil7CiAgICAgIGNsb3NlTW9kYWwoKTsgdG9hc3QoJ+C4quC4o+C5ieC4suC4h+C4meC4seC4lOC4q+C4oeC4suC4oiAnICsgbiArICcg4Lir4LmJ4Lit4LiH4LmB4Lil4LmJ4LinJywgJ29rJyk7',
  'IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTsgYnRuLnRleHRDb250ZW50ID0gJ+C4quC4o+C5ieC4suC4h+C4meC4seC4lOC4q+C4oeC4suC4oic7IHRvYXN0KGUubWVzc2Fn',
  'ZXx8ZSwgJ2VycicpOwogICAgfSk7CiAgfTsKfQoKZnVuY3Rpb24gYnVsa1BpY2sod2hhdCl7CiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmJrJykuZm9yRWFjaChmdW5jdGlvbihjKXsKICAgIGlmICh3aGF0ID09PSAnYWxsJykgYy5jaGVja2VkID0gdHJ1',
  'ZTsKICAgIGVsc2UgaWYgKHdoYXQgPT09ICdub25lJykgYy5jaGVja2VkID0gZmFsc2U7CiAgICBlbHNlIGMuY2hlY2tlZCA9IFN0cmluZyhjLnZhbHVlKS5jaGFyQXQoMCkgPT09IFN0cmluZyh3aGF0KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Liy4Lih4Lir4LmJ4Lit4LiHCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtUmVwYWlyKHJlYyl7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4LiH4Liy4LiZ4LiL4LmI4Lit4LihJyA6ICfguYHguIjguYnguIfguIvguYjguK3g',
  'uKEgLyDguJrguLHguJnguJfguLbguIHguIfguLLguJnguIvguYjguK3guKEnLAogICAgcmVjb3JkOiByZWMgfHwgeyByZXBvcnREYXRlOiB0b2RheSgpLCBwcmlvcml0eTogJ+C4m+C4geC4leC4tCcgfSwKICAgIGFjdGlvbjogJ3JlcGFpci5zYXZlJywgYnVja2V0',
  'OiAncm9vbVJlcGFpcicsIHdpZGU6IHRydWUsCiAgICBvY3I6IHsgZGF0ZToncmVwYWlyRGF0ZScsIGFtb3VudDonY29zdCcsIHZlbmRvcjondGVjaG5pY2lhbicsIHRpdGxlOidpdGVtcycgfSwKICAgIG9uRGVsZXRlOiBkZWxSZXBhaXIsCiAgICBmaWVsZHM6IFsK',
  'ICAgICAgeyBrZXk6J3Jvb20nLCAgICAgICBsYWJlbDon4Lir4LmJ4Lit4LiHJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpyb29tT3B0aW9ucygpLCByZXF1aXJlZDp0cnVlLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleTonY2F0ZWdvcnknLCAgIGxhYmVsOifg',
  'uJvguKPguLDguYDguKDguJfguIfguLLguJnguKvguKXguLHguIHguILguK3guIfguYPguJrguJnguLXguYknLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncmVwYWlyQ2F0ZWdvcmllcycpLAogICAgICAgIGhpbnQ6J+C5gOC4p+C5ieC4meC4p+C5iOC4suC4',
  'h+C5hOC4lOC5iSDigJQg4Lij4Liw4Lia4Lia4LmD4LiK4LmJ4Lib4Lij4Liw4LmA4Lig4LiX4LiX4Li14LmI4Lie4Lia4Lia4LmI4Lit4Lii4LiX4Li14LmI4Liq4Li44LiU4LmD4LiZ4LmA4LiK4LmH4LiE4Lil4Li04Liq4LiV4LmM4LmD4Lir4LmJ4LmA4Lit4LiH',
  'JyB9LAogICAgICB7IGtleTonaXRlbXMnLCAgICAgIGxhYmVsOifguKPguLLguKLguIHguLLguKPguJfguLXguYjguJXguYnguK3guIfguIvguYjguK3guKEgKOC4leC4tOC5iuC4geC5gOC4oeC4t+C5iOC4reC4l+C4s+C5gOC4quC4o+C5h+C4iCknLCB0eXBlOid0',
  'b2RvJywgcmVxdWlyZWQ6dHJ1ZSwgZnVsbDp0cnVlLAogICAgICAgIG9wdGlvbnM6IG9wdCgncmVwYWlyQ2F0ZWdvcmllcycpLAogICAgICAgIGhpbnQ6J+C5gOC4guC5ieC4suC4i+C5iOC4reC4oeC4hOC4o+C4seC5ieC4h+C5gOC4lOC4teC4ouC4p+C4oeC4seC4',
  'geC4i+C5iOC4reC4oeC4q+C4peC4suC4ouC4iOC4uOC4lCDguYPguKrguYjguYHguKLguIHguJfguLXguKXguLDguIfguLLguJnguYHguKXguLDguYDguKXguLfguK3guIHguJvguKPguLDguYDguKDguJfguILguK3guIfguYHguJXguYjguKXguLDguIfguLLguJng',
  'uYTguJTguYkgwrcgJyArCiAgICAgICAgICAgICAn4LiV4Li04LmK4LiB4LiE4Lij4Lia4LiX4Li44LiB4LiH4Liy4LiZ4LmB4Lil4LmJ4Lin4Lij4Liw4Lia4Lia4LiI4Liw4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Liq4LiW4Liy4LiZ4Liw4LmA4Lib4LmH4LiZIOKA',
  'nOC5gOC4quC4o+C5h+C4iOC4quC4tOC5ieC4meKAnSDguYPguKvguYnguYDguK3guIcnIH0sCiAgICAgIHsga2V5OidyZXBvcnREYXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC5geC4iOC5ieC4hycsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5Oidi',
  'b29rRGF0ZScsICAgbGFiZWw6J+C4p+C4seC4meC4meC4seC4lOC4i+C5iOC4reC4oeC5geC4i+C4oScsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidyZXBhaXJEYXRlJywgbGFiZWw6J+C4p+C4seC4meC5gOC4guC5ieC4suC4i+C5iOC4reC4oeC5geC4i+C4',
  'oScsIHR5cGU6J2RhdGUnLCBoaW50OifguIHguKPguK3guIHguYDguKHguLfguYjguK3guIvguYjguK3guKHguYDguKrguKPguYfguIjguYHguKXguYnguKcnIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCAgICAgbGFiZWw6J+C4quC4luC4suC4meC4sCcsIHR5cGU6',
  'J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdyZXBhaXJTdGF0dXNlcycpIH0sCiAgICAgIHsga2V5Oidwcmlvcml0eScsICAgbGFiZWw6J+C4hOC4p+C4suC4oeC5gOC4o+C5iOC4h+C4lOC5iOC4p+C4mScsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdwcmlvcml0',
  'aWVzJyksIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5Oid0ZWNobmljaWFuJywgbGFiZWw6J+C4iuC5iOC4suC4h+C4nOC4ueC5ieC4i+C5iOC4reC4oScgfSwKICAgICAgeyBrZXk6J2Nvc3QnLCAgICAgICBsYWJlbDon4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI',
  '4Liy4LiiICjguJrguLLguJcpJywgdHlwZTonbW9uZXknIH0sCiAgICAgIHsga2V5OidwaG90b3NCZWZvcmUnLCBsYWJlbDon4Lig4Liy4Lie4LiB4LmI4Lit4LiZ4LiL4LmI4Lit4LihJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J3Bo',
  'b3Rvc0FmdGVyJywgIGxhYmVsOifguKDguLLguJ7guKvguKXguLHguIfguIvguYjguK3guKEnLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonbm90ZScsICAgICAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0',
  'ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbFJlcGFpcihpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdyZXBhaXIu',
  'ZGVsZXRlJywgeyBpZDogaWQgfSkudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7',
  'IH0pOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguIvguYjguK3guKHguYHguIvguKHguJXguLbguIHguYLguJTguKLguKPguKfguKEKICAg',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1CdWlsZGluZyhyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4',
  'h+C4suC4meC4i+C5iOC4reC4oeC4leC4tuC4gScgOiAn4LmA4Lie4Li04LmI4Lih4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmC4LiU4Lii4Lij4Lin4LihJywKICAgIHJlY29yZDogcmVjIHx8IHsgYm9va0RhdGU6IHRvZGF5KCkgfSwK',
  'ICAgIGFjdGlvbjogJ2J1aWxkaW5nLnNhdmUnLCBidWNrZXQ6ICdidWlsZGluZycsIHdpZGU6IHRydWUsCiAgICBvY3I6IHsgZGF0ZTonZW5kRGF0ZScsIGFtb3VudDonY29zdCcsIHZlbmRvcjonY29udHJhY3RvcicsIHRpdGxlOid0aXRsZScgfSwKICAgIG9uRGVs',
  'ZXRlOiBkZWxCdWlsZGluZywKICAgIGZpZWxkczogWwogICAgICB7IGtleTonem9uZScsICAgICAgbGFiZWw6J+C4quC5iOC4p+C4meC4guC4reC4h+C4reC4suC4hOC4suC4oycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdidWlsZGluZ1pvbmVzJyksIHJl',
  'cXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J3RpdGxlJywgICAgIGxhYmVsOifguKPguLLguKLguIHguLLguKPguIvguYjguK3guKHguYHguIvguKEnLCB0eXBlOid0ZXh0YXJlYScsIHJlcXVpcmVkOnRydWUsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonYm9v',
  'a0RhdGUnLCAgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4meC4seC4lCcsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidzdGFydERhdGUnLCBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LmA4Lij4Li04LmI4Lih4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy',
  '4LijJywgdHlwZTonZGF0ZScgfSwKICAgICAgeyBrZXk6J2VuZERhdGUnLCAgIGxhYmVsOifguKfguLHguJnguJfguLXguYjguYHguKXguYnguKfguYDguKrguKPguYfguIgnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonc3RhdHVzJywgICAgbGFiZWw6J+C4',
  'quC4luC4suC4meC4sCcsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdidWlsZGluZ1N0YXR1c2VzJykgfSwKICAgICAgeyBrZXk6J2NvbnRyYWN0b3InLCBsYWJlbDon4Lic4Li54LmJ4Lij4Lix4Lia4LmA4Lir4Lih4LiyIC8g4Lij4LmJ4Liy4LiZJyB9LAog',
  'ICAgICB7IGtleTonY29zdCcsICAgICAgbGFiZWw6J+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oiAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JyB9LAogICAgICB7IGtleTonbmV4dER1ZScsICAgbGFiZWw6J+C4hOC4o+C4muC4geC4s+C4q+C4meC4lOC4',
  'o+C4reC4muC4luC4seC4lOC5hOC4mycsIHR5cGU6J2RhdGUnLCBoaW50OifguYDguIrguYjguJkg4LiB4Lix4LiZ4LiL4Li24Lih4LiU4Liy4LiU4Lif4LmJ4Liy4LiX4Li44LiBIDMg4Lib4Li1IOKAlCDguYPguKrguYjguKfguLHguJnguJfguLXguYjguITguKPg',
  'uLHguYnguIfguJbguLHguJTguYTguJsnIH0sCiAgICAgIHsga2V5OidwaG90b3MnLCAgICBsYWJlbDon4Lig4Liy4Lie4Lib4Lij4Liw4LiB4Lit4LiaJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J3NsaXBzJywgICAgIGxhYmVsOifg',
  'uYPguJrguYDguKrguKPguYfguIggLyDguKrguKXguLTguJsnLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonbm90ZScsICAgICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVl',
  'IH0KICAgIF0KICB9KTsKfQoKZnVuY3Rpb24gZGVsQnVpbGRpbmcoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4h+C4suC4meC4i+C5iOC4reC4oeC4leC4tuC4geC4meC4teC5iT8nLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgnYnVpbGRpbmcuZGVsZXRl',
  'JywgeyBpZDogaWQgfSkudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwog',
  'IH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguILguYnguK3guKHguLnguKXguKvguYnguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1Sb29tKHJlYyl7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6ICfguILguYnguK3guKHguLnguKXguKvguYnguK3guIcgJyArIChyZWMgPyByZWMucm9vbSA6ICcnKSwKICAg',
  'IHJlY29yZDogcmVjLCBhY3Rpb246ICdyb29tLnNhdmUnLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oidyb29tJywgICBsYWJlbDon4Lir4LmJ4Lit4LiHJywgcmVxdWlyZWQ6dHJ1ZSB9LAogICAgICB7IGtleTonZmxvb3InLCAgbGFiZWw6J+C4iuC4seC5ieC4',
  'mScsIHR5cGU6J251bWJlcicgfSwKICAgICAgeyBrZXk6J3N0YXR1cycsIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncm9vbVN0YXR1c2VzJyksIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5Oid0ZW5hbnQnLCBs',
  'YWJlbDon4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmA4LiK4LmI4LiyJyB9LAogICAgICB7IGtleToncGhvbmUnLCAgbGFiZWw6J+C5gOC4muC4reC4o+C5jOC4leC4tOC4lOC4leC5iOC4rScgfSwKICAgICAgeyBrZXk6J3JlbnQnLCAgIGxhYmVsOifguITguYjguLLg',
  'uYDguIrguYjguLIv4LmA4LiU4Li34Lit4LiZICjguJrguLLguJcpJywgdHlwZTonbW9uZXknIH0sCiAgICAgIHsga2V5Oidtb3ZlSW4nLCBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LmA4LiC4LmJ4Liy4Lit4Lii4Li54LmIJywgdHlwZTonZGF0ZScgfSwKICAg',
  'ICAgeyBrZXk6J25vdGUnLCAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PQogICDguJ/guK3guKPguYzguKE6IOC4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4meC4m+C4o+C4sOC4iOC4s+C4q+C5ieC4reC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0g',
  'Ki8KZnVuY3Rpb24gZm9ybUFzc2V0KHJlYyl7CiAgdmFyIHJvb20gPSAocmVjICYmIHJlYy5yb29tKSB8fCAnJzsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguJfguKPguLHguJ7guKLguYzguKrguLTguJkn',
  'IDogJ+C5gOC4nuC4tOC5iOC4oeC4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4meC5g+C4meC4q+C5ieC4reC4hyAnICsgcm9vbSwKICAgIHJlY29yZDogcmVjIHx8IHsgcm9vbTogcm9vbSwgc3RhdHVzOiAn4LmD4LiK4LmJ4LiH4Liy4LiZ4Lib4LiB4LiV4Li0JyB9',
  'LAogICAgYWN0aW9uOiAnYXNzZXQuc2F2ZScsCiAgICBvbkRlbGV0ZTogcmVjICYmIHJlYy5pZCA/IGRlbEFzc2V0IDogbnVsbCwKICAgIGZpZWxkczogWwogICAgICB7IGtleToncm9vbScsICAgbGFiZWw6J+C4q+C5ieC4reC4hycsIHR5cGU6J3NlbGVjdCcsIG9w',
  'dGlvbnM6cm9vbU9wdGlvbnMoKSwgcmVxdWlyZWQ6dHJ1ZSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J25hbWUnLCAgIGxhYmVsOifguJfguKPguLHguJ7guKLguYzguKrguLTguJknLCByZXF1aXJlZDp0cnVlLCBwaDon4LmA4LiK4LmI4LiZIOC5geC4reC4',
  'o+C5jCDCtyDguYDguITguKPguLfguYjguK3guIfguJfguLPguJnguYnguLPguK3guLjguYjguJkgwrcg4LiV4Li54LmJ4LmA4Lii4LmH4LiZJyB9LAogICAgICB7IGtleTonYnJhbmQnLCAgbGFiZWw6J+C4ouC4teC5iOC4q+C5ieC4rS/guKPguLjguYjguJknIH0s',
  'CiAgICAgIHsga2V5OidzZXJpYWwnLCBsYWJlbDonU2VyaWFsIE5vLicgfSwKICAgICAgeyBrZXk6J2luc3RhbGxEYXRlJywgIGxhYmVsOifguKfguLHguJnguJfguLXguYjguJXguLTguJTguJXguLHguYnguIcnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTon',
  'd2FycmFudHlFbmQnLCAgbGFiZWw6J+C4m+C4o+C4sOC4geC4seC4meC4q+C4oeC4lOC4reC4suC4ouC4uCcsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpv',
  'cHQoJ2Fzc2V0U3RhdHVzZXMnKSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J3B1cmNoYXNlSWQnLCBsYWJlbDon4Lit4LmJ4Liy4LiH4Lit4Li04LiH4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4LitJywgcGg6J+C4o+C4q+C4seC4quC4o+C4suC4ouC4',
  'geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4hyAo4LiW4LmJ4Liy4Lih4Li1KScgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdLAogICAgLy8g',
  '4Lif4Lit4Lij4LmM4Lih4LiZ4Li14LmJ4LmA4Lib4Li04LiU4LiI4Liy4LiB4Lir4LiZ4LmJ4Liy4LiV4LmI4Liy4LiH4Lij4Liy4Lii4Lil4Liw4LmA4Lit4Li14Lii4LiU4Lir4LmJ4Lit4LiHIOKAlCDguJrguLHguJnguJfguLbguIHguYDguKrguKPguYfguIjg',
  'uYDguJvguLTguJTguIHguKXguLHguJrguYTguJvguKvguJnguYnguLLguYDguJTguLTguKEKICAgIGFmdGVyOiBmdW5jdGlvbigpeyBpZiAocm9vbSAmJiB0eXBlb2Ygb3BlblJvb20gPT09ICdmdW5jdGlvbicpIG9wZW5Sb29tKHJvb20pOyB9CiAgfSk7Cn0KCmZ1',
  'bmN0aW9uIGRlbEFzc2V0KGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguJfguKPguLHguJ7guKLguYzguKrguLTguJnguIrguLTguYnguJnguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2Fzc2V0LmRlbGV0ZScsIHsgaWQ6IGlkIH0pCiAg',
  'ICAgIC50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8q',
  'ID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3guKPguYzguKE6IOC4o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKLguKvguK0KICAgPT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1GaW5hbmNlKHJlYyl7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4Lij4Liy4Lii4LiB4Liy4LijJyA6',
  'ICfguJrguLHguJnguJfguLbguIHguKPguLLguKLguKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4LiiJywKICAgIHJlY29yZDogcmVjIHx8IHsgZGF0ZTogdG9kYXkoKSwgY2hhbm5lbDogJ+C5guC4reC4mSBRUicgfSwKICAgIGFjdGlvbjogJ2ZpbmFuY2Uuc2F2',
  'ZScsIGJ1Y2tldDogJ21pc2MnLAogICAgb25EZWxldGU6IGRlbEZpbmFuY2UsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J2tpbmQnLCAgIGxhYmVsOifguKPguLLguKLguIHguLLguKMnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnZmluYW5jZUtpbmRz',
  'JyksIHJlcXVpcmVkOnRydWUsIGJsYW5rOmZhbHNlLAogICAgICAgIGhpbnQ6J+C5gOC4peC4t+C4reC4gSAi4Lij4Liy4Lii4Lij4Lix4Lia4LiE4LmI4Liy4LmA4LiK4LmI4LiyIiDguKvguKPguLfguK0gIuC4o+C4suC4ouC4o+C4seC4muC4reC4t+C5iOC4mSDg',
  'uYYiIOC4o+C4sOC4muC4muC4iOC4sOC4meC4seC4muC5gOC4m+C5h+C4meC4neC4seC5iOC4h+C4o+C4suC4ouC4o+C4seC4muC5g+C4q+C5ieC4reC4seC4leC5guC4meC4oeC4seC4leC4tCcgfSwKICAgICAgeyBrZXk6J2RhdGUnLCAgIGxhYmVsOifguKfguLHg',
  'uJnguJfguLXguYgnLCB0eXBlOidkYXRlJywgcmVxdWlyZWQ6dHJ1ZSB9LAogICAgICB7IGtleTonYW1vdW50JywgbGFiZWw6J+C4iOC4s+C4meC4p+C4meC5gOC4h+C4tOC4mSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JywgcmVxdWlyZWQ6dHJ1ZSB9LAogICAg',
  'ICB7IGtleTonYmlsbE1vbnRoJywgbGFiZWw6J+C4o+C4reC4muC4muC4tOC4peC4guC4reC4h+C5gOC4lOC4t+C4reC4mScsIHBoOifguYDguIrguYjguJkg4LiBLuC4hC4gMjU2OScgfSwKICAgICAgeyBrZXk6J2NoYW5uZWwnLCBsYWJlbDon4LiK4LmI4Lit4LiH',
  '4LiX4Liy4LiHJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ2ZpbmFuY2VDaGFubmVscycpIH0sCiAgICAgIHsga2V5OidzbGlwcycsICBsYWJlbDon4Liq4Lil4Li04LibIC8g4LmD4Lia4LmA4Liq4Lij4LmH4LiIJywgdHlwZTonZmlsZXMnLCBmdWxsOnRy',
  'dWUgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbEZpbmFuY2UoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4',
  'peC4muC4o+C4suC4ouC4geC4suC4o+C4meC4teC5iT8nLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgnZmluYW5jZS5kZWxldGUnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKHsgcXVp',
  'ZXQ6IHRydWUgfSk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDg',
  'uKrguLPguKPguK3guIcgLyDguIHguLnguYnguITguLfguJnguILguYnguK3guKHguLnguKUKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGRvRXhwb3J0SnNvbigpewogIHRv',
  'YXN0KCfguIHguLPguKXguLHguIfguYDguJXguKPguLXguKLguKHguYTguJ/guKXguYzguKrguLPguKPguK3guIfigKYnKTsKICBjYWxsQXBpKCdiYWNrdXAuZXhwb3J0Jywge30pLnRoZW4oZnVuY3Rpb24oZHVtcCl7CiAgICBzYXZlVGV4dEZpbGUoJ3RoZS1tLWNv',
  'cm5lci1hcC1iYWNrdXAtJyArIHRvZGF5KCkgKyAnLmpzb24nLAogICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KGR1bXAsIG51bGwsIDEpLCAnYXBwbGljYXRpb24vanNvbicpOwogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUs',
  'ICdlcnInKTsgfSk7Cn0KCmZ1bmN0aW9uIGRvRXhwb3J0Q3N2KHNoZWV0KXsKICBjYWxsQXBpKCdiYWNrdXAuY3N2JywgeyBzaGVldDogc2hlZXQgfSkudGhlbihmdW5jdGlvbihyKXsKICAgIHNhdmVUZXh0RmlsZShyLmZpbGVuYW1lLCByLmNvbnRlbnQsICd0ZXh0',
  'L2NzdicpOwogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsICdlcnInKTsgfSk7Cn0KCi8qKiDguJTguLLguKfguJnguYzguYLguKvguKXguJTguYTguJ/guKXguYwg4oCUIOC5g+C4iuC5iSBkb3dubG9hZHMgY2FwYWJpbGl0eSDguJbg',
  'uYnguLLguKHguLUg4LmE4Lih4LmI4LiH4Lix4LmJ4LiZ4LmD4LiK4LmJ4Lil4Li04LiH4LiB4LmM4Lib4LiB4LiV4Li0ICovCmZ1bmN0aW9uIHNhdmVUZXh0RmlsZShmaWxlbmFtZSwgY29udGVudCwgbWltZSl7CiAgaWYgKHR5cGVvZiB3aW5kb3cuc2F2ZVZpYUhv',
  'c3QgPT09ICdmdW5jdGlvbicpIHJldHVybiB3aW5kb3cuc2F2ZVZpYUhvc3QoZmlsZW5hbWUsIGNvbnRlbnQsIG1pbWUpOwogIHZhciBibG9iID0gbmV3IEJsb2IoW2NvbnRlbnRdLCB7IHR5cGU6IG1pbWUgKyAnO2NoYXJzZXQ9dXRmLTgnIH0pOwogIHZhciBhID0g',
  'ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpOwogIGEuaHJlZiA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7CiAgYS5kb3dubG9hZCA9IGZpbGVuYW1lOwogIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYSk7IGEuY2xpY2soKTsKICBzZXRUaW1lb3V0KGZ1',
  'bmN0aW9uKCl7IFVSTC5yZXZva2VPYmplY3RVUkwoYS5ocmVmKTsgYS5yZW1vdmUoKTsgfSwgMTAwMCk7CiAgdG9hc3QoJ+C4lOC4suC4p+C4meC5jOC5guC4q+C4peC4lCAnICsgZmlsZW5hbWUgKyAnIOC5geC4peC5ieC4pycsICdvaycpOwp9CgpmdW5jdGlvbiBk',
  'b0ltcG9ydEpzb24oKXsKICBvcGVuTW9kYWwoJ+Kshu+4jyDguIHguLnguYnguITguLfguJnguIjguLLguIHguYTguJ/guKXguYzguKrguLPguKPguK3guIcnLAogICAgJzxwIGNsYXNzPSJmczEzIj7guYDguKXguLfguK3guIHguYTguJ/guKXguYwgPGI+Lmpzb248',
  'L2I+IOC4l+C4teC5iOC5gOC4hOC4ouC4lOC4suC4p+C4meC5jOC5guC4q+C4peC4lOC5hOC4p+C5iTwvcD4nICsKICAgICc8bGFiZWwgY2xhc3M9ImZpbGUtZHJvcCIgZm9yPSJpbXBGaWxlIj7wn5OEIOC5gOC4peC4t+C4reC4geC5hOC4n+C4peC5jOC4quC4s+C4',
  'o+C4reC4hycgKwogICAgICAnPGlucHV0IHR5cGU9ImZpbGUiIGlkPSJpbXBGaWxlIiBhY2NlcHQ9ImFwcGxpY2F0aW9uL2pzb24sLmpzb24iIHN0eWxlPSJkaXNwbGF5Om5vbmUiICcgKwogICAgICAnb25jaGFuZ2U9ImRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwn',
  'aW1wTmFtZVwnKS50ZXh0Q29udGVudD10aGlzLmZpbGVzWzBdP3RoaXMuZmlsZXNbMF0ubmFtZTpcJ1wnIj48L2xhYmVsPicgKwogICAgJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbXQ4IiBpZD0iaW1wTmFtZSI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iaHIi',
  'PjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7guKfguLTguJjguLXguIHguLnguYnguITguLfguJk8L2xhYmVsPicgKwogICAgJzxzZWxlY3QgY2xhc3M9InNlbCIgaWQ9ImltcE1vZGUiPicgKwogICAgICAnPG9wdGlvbiB2YWx1ZT0ibWVyZ2Ui',
  'PuC5gOC4nuC4tOC5iOC4oeC5gOC4ieC4nuC4suC4sOC4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4ouC4seC4h+C5hOC4oeC5iOC4oeC4tSAo4LmB4LiZ4Liw4LiZ4LizKTwvb3B0aW9uPicgKwogICAgICAnPG9wdGlvbiB2YWx1ZT0icmVwbGFjZSI+4Lil4LmJ',
  '4Liy4LiH4LiC4LmJ4Lit4Lih4Li54Lil4LmA4LiU4Li04Lih4LmB4Lil4LmJ4Lin4LmB4LiX4LiZ4LiX4Li14LmI4LiX4Lix4LmJ4LiH4Lir4Lih4LiUPC9vcHRpb24+JyArCiAgICAnPC9zZWxlY3Q+PC9kaXY+JywKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9u',
  'Y2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lii4LiB4LmA4Lil4Li04LiBPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgaWQ9ImltcEdvIj7guIHguLnguYnguITguLfguJnguILguYnguK3guKHguLnguKU8L2J1dHRvbj4nKTsKCiAgZG9jdW1l',
  'bnQuZ2V0RWxlbWVudEJ5SWQoJ2ltcEdvJykub25jbGljayA9IGZ1bmN0aW9uKCl7CiAgICB2YXIgZiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbXBGaWxlJykuZmlsZXNbMF07CiAgICBpZiAoIWYpIHJldHVybiB0b2FzdCgn4LiB4Lij4Li44LiT4Liy4LmA',
  '4Lil4Li34Lit4LiB4LmE4Lif4Lil4LmM4LiB4LmI4Lit4LiZJywgJ2VycicpOwogICAgdmFyIG1vZGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW1wTW9kZScpLnZhbHVlOwogICAgdmFyIGJ0biA9IHRoaXM7IGJ0bi5kaXNhYmxlZCA9IHRydWU7IGJ0bi5p',
  'bm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4LiB4Li54LmJ4LiE4Li34LiZ4oCmJzsKICAgIHZhciByID0gbmV3IEZpbGVSZWFkZXIoKTsKICAgIHIub25sb2FkID0gZnVuY3Rpb24oKXsKICAgICAgdmFyIHBhcnNl',
  'ZDsKICAgICAgdHJ5IHsgcGFyc2VkID0gSlNPTi5wYXJzZShyLnJlc3VsdCk7IH0KICAgICAgY2F0Y2ggKGUpIHsgYnRuLmRpc2FibGVkID0gZmFsc2U7IGJ0bi50ZXh0Q29udGVudCA9ICfguIHguLnguYnguITguLfguJnguILguYnguK3guKHguLnguKUnOyByZXR1',
  'cm4gdG9hc3QoJ+C5hOC4n+C4peC5jOC5hOC4oeC5iOC5g+C4iuC5iCBKU09OIOC4l+C4teC5iOC4luC4ueC4geC4leC5ieC4reC4hycsICdlcnInKTsgfQogICAgICBjYWxsQXBpKCdiYWNrdXAuaW1wb3J0JywgeyBkYXRhOiBwYXJzZWQsIG1vZGU6IG1vZGUgfSku',
  'dGhlbihmdW5jdGlvbihzdGF0KXsKICAgICAgICBjbG9zZU1vZGFsKCk7CiAgICAgICAgdmFyIG4gPSBPYmplY3Qua2V5cyhzdGF0KS5yZWR1Y2UoZnVuY3Rpb24oYSxrKXsgcmV0dXJuIGEgKyAoc3RhdFtrXXx8MCk7IH0sIDApOwogICAgICAgIHRvYXN0KCfguIHg',
  'uLnguYnguITguLfguJnguKrguLPguYDguKPguYfguIggJyArIG4gKyAnIOC4o+C4suC4ouC4geC4suC4oycsICdvaycpOwogICAgICAgIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgICAgYnRuLmRpc2FibGVk',
  'ID0gZmFsc2U7IGJ0bi50ZXh0Q29udGVudCA9ICfguIHguLnguYnguITguLfguJnguILguYnguK3guKHguLnguKUnOyB0b2FzdChlLm1lc3NhZ2V8fGUsICdlcnInKTsKICAgICAgfSk7CiAgICB9OwogICAgci5yZWFkQXNUZXh0KGYpOwogIH07Cn0KCi8qID09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguKXguLTguIfguIHguYzguYHguIrguKPguYwg4LmB4Lil4Liw4LiB4Liy4Lij4Liq4Liz4Lij4Lit4LiH4Lil4LiHIEdvb2dsZSBEcml2ZQogICA9PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCmZ1bmN0aW9uIGNvcHlTaGFyZSgpewogIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaGFyZVVybCcpOwogIGlmICghZWwpIHJldHVybjsKICBl',
  'bC5zZWxlY3QoKTsKICBpZiAobmF2aWdhdG9yLmNsaXBib2FyZCkgewogICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoZWwudmFsdWUpCiAgICAgIC50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguITguLHguJTguKXguK3guIHguKXguLTguIfguIHguYzg',
  'uYHguIrguKPguYzguYHguKXguYnguKcnLCdvaycpOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oKXsgdG9hc3QoJ+C4hOC4seC4lOC4peC4reC4geC5hOC4oeC5iOC4quC4s+C5gOC4o+C5h+C4iCDigJQg4LiB4LiU4LiE4LmJ4Liy4LiH4LiX4Li14LmI4LiK4LmI',
  '4Lit4LiH4LmB4Lil4LmJ4Lin4LmA4Lil4Li34Lit4LiB4LiE4Lix4LiU4Lil4Lit4LiBJywnZXJyJyk7IH0pOwogIH0gZWxzZSB7CiAgICB0cnkgeyBkb2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpOyB0b2FzdCgn4LiE4Lix4LiU4Lil4Lit4LiB4Lil4Li04LiH',
  '4LiB4LmM4LmB4LiK4Lij4LmM4LmB4Lil4LmJ4LinJywnb2snKTsgfQogICAgY2F0Y2ggKGUpIHsgdG9hc3QoJ+C4hOC4seC4lOC4peC4reC4geC5hOC4oeC5iOC4quC4s+C5gOC4o+C5h+C4iCDigJQg4LiB4LiU4LiE4LmJ4Liy4LiH4LiX4Li14LmI4LiK4LmI4Lit',
  '4LiH4LmB4Lil4LmJ4Lin4LmA4Lil4Li34Lit4LiB4LiE4Lix4LiU4Lil4Lit4LiBJywnZXJyJyk7IH0KICB9Cn0KCmZ1bmN0aW9uIGRvUm90YXRlU2hhcmUoKXsKICBjb25maXJtQWN0aW9uKCfguK3guK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYzguIrg',
  'uLjguJTguYPguKvguKHguYg/IOC4hOC4meC4l+C4teC5iOC4luC4t+C4reC4peC4tOC4h+C4geC5jOC5gOC4lOC4tOC4oeC4iOC4sOC5gOC4m+C4tOC4lOC5hOC4oeC5iOC5hOC4lOC5ieC4reC4teC4gScsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdzaGFyZS5y',
  'b3RhdGVUb2tlbicsIHt9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICAgIHRvYXN0KCfguK3guK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYzguIrguLjguJTguYPguKvguKHguYjguYHguKXguYnguKcnLCdvaycpOyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAg',
  'ICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCmZ1bmN0aW9uIGRvQmFja3VwTm93KCl7CiAgdG9hc3QoJ+C4geC4s+C4peC4seC4h+C4quC4s+C4o+C4reC4h+C4guC5ieC4reC4oeC4ueC4peC4peC4',
  'hyBEcml2ZeKApicpOwogIGNhbGxBcGkoJ2JhY2t1cC5iYWNrdXBOb3cnLCB7fSkudGhlbihmdW5jdGlvbihyKXsKICAgIHRvYXN0KCfguKrguLPguKPguK3guIfguYHguKXguYnguKc6ICcgKyByLm5hbWUsICdvaycpOyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAg',
  'fSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwp9Cjwvc2NyaXB0Pgo8c2NyaXB0PmJvb3QoKTs8L3NjcmlwdD4KPC9ib2R5Pgo8L2h0bWw+Cg=='
].join('');

function indexHtml_() {
  return Utilities.newBlob(Utilities.base64Decode(INDEX_HTML_B64), 'text/html')
    .getDataAsString('UTF-8');
}
