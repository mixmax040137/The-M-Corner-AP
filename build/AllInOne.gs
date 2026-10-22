/**
 * The M Corner AP — ระบบบริหารหอพัก (ไฟล์เดียวจบ)
 * ไฟล์นี้สร้างอัตโนมัติจากโฟลเดอร์ src/ เมื่อ 2026-10-22 11:33 UTC
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
  VERSION: '1.6.1',
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
var SCHEMA_VERSION = 9;

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
var JS_DATE_TEXT = /^(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{2}) (\d{4}) \d{2}:\d{2}:\d{2} GMT/;
var MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function textFromCell_(v) {
  var y, m, d;
  if (Object.prototype.toString.call(v) === '[object Date]') {
    if (isNaN(v.getTime())) return '';
    var iso = Utilities.formatDate(v, APP.TIMEZONE, 'yyyy-MM-dd');
    y = Number(iso.slice(0, 4)); m = Number(iso.slice(5, 7)); d = Number(iso.slice(8, 10));
  } else {
    var s = String(v);
    var hit = s.match(JS_DATE_TEXT);
    if (!hit) return s;
    y = Number(hit[3]); m = MONTH_ABBR.indexOf(hit[1]) + 1; d = Number(hit[2]);
  }
  if (d === 1) return m + '/' + y;
  return y + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
}

/**
 * ข้อความที่หน้าตาเหมือนตัวเลขหรือวันที่ ("7/2026", "0812345678", "2022")
 * ใส่ ' นำหน้าตอนเขียน ชีตจะเก็บเป็นข้อความตามที่พิมพ์ ไม่แปลงเป็นวันที่/ตัดเลข 0 ข้างหน้า
 * (เครื่องหมาย ' ไม่ถูกเก็บเป็นส่วนหนึ่งของค่า อ่านกลับมาได้ข้อความเดิม)
 */
var LOOKS_NUMERIC = /^[\d\s.,:\/+\-]+$/;

function asSheetText_(s) {
  return LOOKS_NUMERIC.test(s) && /\d/.test(s) ? "'" + s : s;
}

/** ค่าที่เพิ่งเขียน → ค่าที่ client เห็น (ถอด ' ที่ asSheetText_ ใส่ไว้) */
function echoCell_(cell, type) {
  if (typeof cell === 'string' && cell.charAt(0) === "'" && LOOKS_NUMERIC.test(cell.slice(1))) cell = cell.slice(1);
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
  var cols = SCHEMA[name];
  var row = cols.map(function (c) { return serializeValue_(obj[c.key], c.type); });
  sh.getRange(rowNumber, 1, 1, cols.length).setValues([row]);
  var saved = {};
  cols.forEach(function (c, i) { saved[c.key] = echoCell_(row[i], c.type); });
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

  var done = [];
  if (from < 2) done.push(migrateV2SplitPayment_());
  if (from < 3) done.push(migrateV3DebtParent_());
  if (from < 4) done.push(migrateV4Users_());
  if (from < 5) done.push(migrateV5RefreshRate_());
  if (from < 7) done.push(migrateV7RepairTodo_());
  if (from < 8) done.push(migrateV8ChristianYear_());
  if (from < 9) done.push(migrateV9InstallmentText_());

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
  var queue = {};
  debts.forEach(function (d, i) {
    if (!isLedgerRoot(d)) return;
    (queue[d.ledger] = queue[d.ledger] || []).push({ d: d, i: i });
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

  // 1) รายการที่ระบุก้อนไว้ เข้าก้อนนั้นตรง ๆ · ที่ไม่ได้ระบุ รวมเป็นกองกลางของบัญชี
  var pool = {}, poolInterest = {};
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
    pool[p.ledger] = (pool[p.ledger] || 0) + pr;
    poolInterest[p.ledger] = (poolInterest[p.ledger] || 0) + it;
  });

  var filled = {};
  Object.keys(queue).forEach(function (ledger) {
    var roots = queue[ledger];
    var left = pool[ledger] || 0;

    // 2) ก้อนที่ได้เกินยอดตั้งต้นแล้ว (เช่น จ่ายคืนก้อนย่อยทีหลังตอนที่ก้อนแม่เต็มไปแล้ว)
    //    ส่วนที่เกินไม่ได้หายไปไหน คืนเข้ากองกลางให้ไหลไปก้อนถัดไป
    roots.forEach(function (d) {
      var over = allocated(d) - (toNumber_(d.principal) || 0);
      if (over > 0) { own[String(d.id)].principal -= over; left += over; }
    });

    // 3) เทกองกลางลงก้อนที่เริ่มก่อนจนเต็ม แล้วค่อยไปก้อนถัดไป · เกินทุกก้อนพักไว้ก้อนสุดท้าย
    var got = [];
    if (left >= 0) {
      roots.forEach(function (d, k) {
        if (left <= 0) return;
        var room = Math.max(0, (toNumber_(d.principal) || 0) - allocated(d));
        var take = k === roots.length - 1 ? left : Math.min(left, room);
        if (take <= 0) return;
        own[String(d.id)].principal += take;
        left -= take;
        got.push(String(d.id));
      });
    } else {
      // ยอดติดลบ (ปรับยอดหนี้ขึ้น) คืนจากก้อนท้าย ๆ ก่อน
      for (var k = roots.length - 1; k >= 0 && left < 0; k--) {
        var mine = own[String(roots[k].id)].principal;
        var back = k === 0 ? left : Math.max(left, -Math.max(0, mine));
        if (!back) continue;
        own[String(roots[k].id)].principal += back;
        left -= back;
        got.push(String(roots[k].id));
      }
    }
    if (!got.length && roots.length) got.push(String(roots[0].id));
    // ดอกเบี้ยไม่ได้ลดยอดหนี้ ลงก้อนแรกที่ได้รับเงินไว้เฉย ๆ
    own[got[0]].interest += poolInterest[ledger] || 0;
    filled[ledger] = got;
  });

  payments.forEach(function (p) {
    if (!p._toDebts.length) p._toDebts = (filled[p.ledger] || []).slice();
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
  // รายการปรับยอดลดหนี้จริง แต่ไม่ใช่เงินที่โอนในปีนั้น — ไม่เอาไปนับเป็นยอดผ่อนรายปีหรือคาดการณ์
  var adjustments = scoped.filter(isAdjustment_);
  var adjusted = sum_(adjustments, function (p) { return p.principal; });
  scoped = scoped.filter(function (p) { return !isAdjustment_(p); });

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
  'dW5kOnJnYmEoMjU1LDI1NSwyNTUsLjI4KTtjb2xvcjojZmZmfQoKQG1lZGlhIChtYXgtd2lkdGg6NzIwcHgpewogIC5ub3RpZnsKICAgIHBvc2l0aW9uOmZpeGVkO3RvcDphdXRvO2xlZnQ6OHB4O3JpZ2h0OjhweDtib3R0b206OHB4O3dpZHRoOmF1dG87CiAgICBt',
  'YXgtaGVpZ2h0Ojcydmg7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjsKICB9CiAgLm5vdGlmLWxpc3R7ZmxleDoxO21heC1oZWlnaHQ6bm9uZX0KfQoKLyogPT09PT09PT09PT09IOC5gOC4iuC5h+C4hOC4peC4tOC4quC4leC5jOC4h+C4suC4meC4',
  'i+C5iOC4reC4oSA9PT09PT09PT09PT0gKi8KLyogLS0tLSDguYPguJnguJ/guK3guKPguYzguKEgLS0tLSAqLwoudG9kb3tib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6dmFyKC0tci1zbSk7cGFkZGluZzoxMHB4O2JhY2tncm91bmQ6',
  'dmFyKC0tc3VyZmFjZS0yKX0KLnRvZG8tcm93ewogIGRpc3BsYXk6Z3JpZDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6MzBweCBtaW5tYXgoMCwxZnIpIDE5MHB4IDM0cHg7CiAgZ2FwOjdweDthbGlnbi1pdGVtczpjZW50ZXI7bWFyZ2luLWJvdHRvbTo2cHg7Cn0KLnRv',
  'ZG8tcm93IC5pbnAsLnRvZG8tcm93IC5zZWx7cGFkZGluZzo2cHggOXB4O2ZvbnQtc2l6ZToxM3B4fQoudG9kby1yb3cuZG9uZSAuaW5we3RleHQtZGVjb3JhdGlvbjpsaW5lLXRocm91Z2g7Y29sb3I6dmFyKC0tbXV0ZWQpfQoudG9kby1jaGVja3tkaXNwbGF5OmZs',
  'ZXg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpjZW50ZXI7Y3Vyc29yOnBvaW50ZXJ9Ci50b2RvLWNoZWNrIGlucHV0e3dpZHRoOjE3cHg7aGVpZ2h0OjE3cHg7Y3Vyc29yOnBvaW50ZXI7YWNjZW50LWNvbG9yOnZhcigtLW9rKX0KLnRvZG8tY291',
  'bnR7bWFyZ2luLWxlZnQ6YXV0bztmb250LXNpemU6MTNweDtjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zfQoudG9kby1jb3VudCBie2NvbG9yOnZhcigtLWluayl9CgovKiAtLS0tIOC5g+C4meC4leC4suC4o+C4suC4',
  'h+C4o+C4suC4ouC4geC4suC4oyAo4LiV4Li04LmK4LiB4LmE4LiU4LmJ4LiI4Lij4Li04LiHKSAtLS0tICovCi50b2RvLXZpZXd7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtnYXA6MnB4fQoudG9kby1iYXJ7aGVpZ2h0OjVweDtib3JkZXItcmFk',
  'aXVzOjk5cHg7YmFja2dyb3VuZDp2YXIoLS1saW5lLTIpO292ZXJmbG93OmhpZGRlbjttYXJnaW4tYm90dG9tOjJweH0KLnRvZG8tYmFyPml7ZGlzcGxheTpibG9jaztoZWlnaHQ6MTAwJTtib3JkZXItcmFkaXVzOjk5cHg7YmFja2dyb3VuZDp2YXIoLS1vayk7dHJh',
  'bnNpdGlvbjp3aWR0aCAuMzVzIGVhc2V9Ci50b2RvLW1ldGF7Zm9udC1zaXplOjExcHg7Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtczttYXJnaW4tYm90dG9tOjNweH0KLnRvZG8tbWV0YSBie2NvbG9yOnZhcigtLWlu',
  'ayl9Ci50b2RvLWxpbmV7CiAgZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmZsZXgtc3RhcnQ7Z2FwOjdweDtmb250LXNpemU6MTNweDtsaW5lLWhlaWdodDoxLjU7CiAgcGFkZGluZzoycHggMDtjdXJzb3I6cG9pbnRlcjsKfQoudG9kby1saW5lIGlucHV0e21hcmdp',
  'bi10b3A6MnB4O3dpZHRoOjE1cHg7aGVpZ2h0OjE1cHg7ZmxleDpub25lO2N1cnNvcjpwb2ludGVyO2FjY2VudC1jb2xvcjp2YXIoLS1vayl9Ci50b2RvLWxpbmUgLm5te2ZsZXg6MTttaW4td2lkdGg6MDtjb2xvcjp2YXIoLS1pbmspfQoudG9kby1saW5lIC5jYXR7',
  'ZmxleDpub25lO2ZvbnQtc2l6ZToxMC41cHg7cGFkZGluZzoxcHggN3B4fQoudG9kby1saW5lLmRvbmUgLm5te3RleHQtZGVjb3JhdGlvbjpsaW5lLXRocm91Z2g7Y29sb3I6dmFyKC0tZmFpbnQpfQoudG9kby1saW5lLmxvY2tlZHtjdXJzb3I6ZGVmYXVsdH0KLnRv',
  'ZG8tbGluZTpub3QoLmxvY2tlZCk6aG92ZXIgLm5te2NvbG9yOnZhcigtLWJyYW5kKX0KCkBtZWRpYSAobWF4LXdpZHRoOjY0MHB4KXsKICAudG9kby1yb3d7CiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6MzBweCBtaW5tYXgoMCwxZnIpIDM0cHg7CiAgICBncmlk',
  'LXRlbXBsYXRlLWFyZWFzOidjaGsgbmFtZSBkZWwnICcuIGNhdCBjYXQnOwogICAgcGFkZGluZzo4cHg7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOnZhcigtLXItc20pOwogICAgYmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlKTttYXJn',
  'aW4tYm90dG9tOjhweDsKICB9CiAgLnRvZG8tY2hlY2t7Z3JpZC1hcmVhOmNoazthbGlnbi1zZWxmOnN0YXJ0O3BhZGRpbmctdG9wOjVweH0KICAudG9kby1yb3cgLmlucHtncmlkLWFyZWE6bmFtZX0KICAudG9kby1yb3cgLnNlbHtncmlkLWFyZWE6Y2F0O3dpZHRo',
  'OjEwMCV9CiAgLnRvZG8tcm93IC5idG57Z3JpZC1hcmVhOmRlbDthbGlnbi1zZWxmOnN0YXJ0O2p1c3RpZnktc2VsZjplbmQ7d2lkdGg6MzRweDtwYWRkaW5nOjZweCAwfQogIC50b2RvLWNvdW50e3dpZHRoOjEwMCU7bWFyZ2luOjZweCAwIDA7dGV4dC1hbGlnbjpy',
  'aWdodH0KfQoKCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguIjguK3guYHguITguJogKOC4oeC4t+C4reC4luC4t+C4rSAvIOC5geC4l+C5h+C4muC5gOC4peC5h+C4leC5geC4',
  'meC4p+C4leC4seC5ieC4hykKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC5hOC4oeC5iOC5hOC4lOC5ieC5geC4ouC4geC5hOC4n+C4peC5jOC4q+C4o+C4t+C4reC5geC4ouC4',
  'geC5gOC4l+C4oeC5gOC4nuC4peC4leC4quC4s+C4q+C4o+C4seC4muC4oeC4t+C4reC4luC4t+C4rSDigJQgSFRNTCDguIrguLjguJTguYDguJTguLXguKLguKfguIHguLHguJnguJfguLHguYnguIfguKvguKHguJQKICAg4LiV4Lij4LiH4LiZ4Li14LmJ4LmA4Lib',
  '4Lil4Li14LmI4Lii4LiZ4LmB4LiE4LmIICLguKfguLLguIfguJXguKPguIfguYTguKvguJkiIOC4guC5ieC4reC4oeC4ueC4pSDguJvguLjguYjguKEg4LiV4Lij4Lij4LiB4LiwIOC5g+C4iuC5ieC4o+C5iOC4p+C4oeC4geC4seC4meC4q+C4oeC4lAogICDguKLg',
  'uYjguK0t4LiC4Lii4Liy4Lii4Lir4LiZ4LmJ4Liy4LiV4LmI4Liy4LiH4Lia4LiZ4LiE4Lit4Lih4LiB4LmH4Liq4Lil4Lix4Lia4LmE4LiU4LmJ4LiX4Lix4LiZ4LiX4Li1IOC5geC4peC4sOC5gOC4nuC4tOC5iOC4oeC4n+C4teC5gOC4iOC4reC4o+C5jOC4hOC4',
  'o+C4seC5ieC4h+C5gOC4lOC4teC4ouC4p+C5hOC4lOC5ieC4l+C4seC5ieC4h+C4quC4reC4h+C5geC4muC4mgotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi8KQG1lZGlhIChtYXgtd2lk',
  'dGg6NzYwcHgpewoKICAvKiAtLS0tIOC5geC4luC4muC4peC5iOC4suC4hzog4Lib4Li44LmI4Lih4Lit4Lii4Li54LmI4Lij4Liw4LiU4Lix4Lia4LiZ4Li04LmJ4Lin4LmC4Lib4LmJ4LiHIOC5hOC4oeC5iOC4leC5ieC4reC4h+C5gOC4reC4t+C5ieC4reC4oeC5',
  'hOC4m+C4oeC4uOC4oeC4i+C5ieC4suC4ouC4muC4mSAtLS0tICovCiAgLnRhYmJhcnsKICAgIGRpc3BsYXk6ZmxleDtwb3NpdGlvbjpmaXhlZDtsZWZ0OjA7cmlnaHQ6MDtib3R0b206MDt6LWluZGV4OjUwOwogICAgYmFja2dyb3VuZDp2YXIoLS1zdXJmYWNlKTti',
  'b3JkZXItdG9wOjFweCBzb2xpZCB2YXIoLS1saW5lKTsKICAgIHBhZGRpbmctYm90dG9tOmVudihzYWZlLWFyZWEtaW5zZXQtYm90dG9tKTsKICAgIGJveC1zaGFkb3c6MCAtMnB4IDE0cHggcmdiYSgxNSwyMyw0MSwuMDcpOwogIH0KICAudGFiewogICAgZmxleDox',
  'IDEgMDttaW4td2lkdGg6MDttaW4taGVpZ2h0OjU0cHg7cGFkZGluZzo3cHggMnB4IDZweDsKICAgIGRpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpjZW50ZXI7Z2FwOjNweDsKICAgIGJv',
  'cmRlcjowO2JhY2tncm91bmQ6MDtjdXJzb3I6cG9pbnRlcjtjb2xvcjp2YXIoLS1tdXRlZCk7CiAgICBmb250LXNpemU6MTAuNXB4O2xpbmUtaGVpZ2h0OjEuMjtwb3NpdGlvbjpyZWxhdGl2ZTsKICB9CiAgLnRhYiAuaWN7Zm9udC1zaXplOjE4cHg7bGluZS1oZWln',
  'aHQ6MX0KICAudGFiIC50bHttYXgtd2lkdGg6MTAwJTtvdmVyZmxvdzpoaWRkZW47dGV4dC1vdmVyZmxvdzplbGxpcHNpczt3aGl0ZS1zcGFjZTpub3dyYXB9CiAgLnRhYi5vbntjb2xvcjp2YXIoLS1icmFuZCk7Zm9udC13ZWlnaHQ6NzAwfQogIC50YWIub24gLmlj',
  'e3RyYW5zZm9ybTp0cmFuc2xhdGVZKC0xcHgpfQogIC50YWIgLmJhZGdlewogICAgcG9zaXRpb246YWJzb2x1dGU7dG9wOjNweDtsZWZ0OjUwJTttYXJnaW4tbGVmdDozcHg7CiAgICBiYWNrZ3JvdW5kOnZhcigtLXdhcm4pO2NvbG9yOiNmZmY7Ym9yZGVyLXJhZGl1',
  'czo5OXB4OwogICAgbWluLXdpZHRoOjE2cHg7aGVpZ2h0OjE2cHg7cGFkZGluZzowIDRweDsKICAgIGZvbnQtc2l6ZToxMHB4O2xpbmUtaGVpZ2h0OjE2cHg7Zm9udC13ZWlnaHQ6NzAwO3RleHQtYWxpZ246Y2VudGVyOwogICAgYm94LXNoYWRvdzowIDAgMCAycHgg',
  'dmFyKC0tc3VyZmFjZSk7CiAgfQogIC8qIOC5gOC4p+C5ieC4meC4l+C4teC5iOC5g+C4q+C5ieC5geC4luC4muC4peC5iOC4suC4hyDguYTguKHguYjguYPguKvguYnguJfguLHguJrguYDguJnguLfguYnguK3guKvguLLguJrguKPguKPguJfguLHguJTguKrguLjg',
  'uJTguJfguYnguLLguKIgKi8KICAuY29udGVudHtwYWRkaW5nOjE0cHggMTRweCBjYWxjKDc0cHggKyBlbnYoc2FmZS1hcmVhLWluc2V0LWJvdHRvbSkpfQogIC50YWJiYXIgfiAub3YsLm5hdnt6LWluZGV4OjYwfQoKICAvKiAtLS0tIOC5geC4luC4muC4q+C4seC4',
  'pzog4Lia4Li14Lia4LmD4Lir4LmJ4LmA4Lir4Lil4Li34Lit4LmB4LiW4Lin4LmA4LiU4Li14Lii4Lin4LmA4LiX4LmI4Liy4LiX4Li14LmI4LmE4Lir4LinIC0tLS0gKi8KICAudG9we3BhZGRpbmc6NnB4IDEwcHg7Z2FwOjdweDtyb3ctZ2FwOjZweH0KICAudG9w',
  'IGgxe2ZvbnQtc2l6ZToxNS41cHh9CiAgLnRvcCAuc3Vie2Rpc3BsYXk6bm9uZX0gICAgICAgICAgLyog4LiE4Liz4Lit4LiY4Li04Lia4Liy4Lii4Lir4LiZ4LmJ4Liy4LmE4Lib4Lit4Lii4Li54LmI4LmD4LiZ4LmA4Lih4LiZ4Li54LiC4LmJ4Liy4LiH4LmB4Lil',
  '4LmJ4LinIOC5hOC4oeC5iOC4leC5ieC4reC4h+C4i+C5ieC4syAqLwogIC50b3AtcmlnaHR7Z2FwOjZweDt3aWR0aDoxMDAlO21hcmdpbi1sZWZ0OjB9CiAgLnRvcC1yaWdodCAjc2VhcmNoQm94e2ZsZXg6MSAxIDExMHB4O3dpZHRoOmF1dG8haW1wb3J0YW50O21p',
  'bi13aWR0aDowfQogIC50b3AtcmlnaHQgI3llYXJTZWx7ZmxleDowIDEgYXV0bzttYXgtd2lkdGg6NDJ2d30KICAuYnVyZ2Vye3BhZGRpbmc6N3B4IDEwcHh9CiAgLyog4LiK4LmI4Lit4LiH4LiB4Lij4Lit4LiB4Lia4LiZ4LmB4LiW4Lia4Lir4Lix4Lin4LmA4LiV',
  '4Li14LmJ4Lii4Lil4LiHIOC5geC4leC5iOC4ouC4seC4h+C4hOC4hyAxNnB4IOC4geC4seC4mSBpT1Mg4LiL4Li54Lih4LmA4Lit4LiHICovCiAgLnRvcCAuaW5wLC50b3AgLnNlbHtwYWRkaW5nOjZweCAxMHB4fQogIC50b3AgLmJ0bi5pY29ue3BhZGRpbmc6NnB4',
  'IDlweH0KCiAgLyogLS0tLSDguJXguLHguKfguYDguKXguILguKrguKPguLjguJs6IDIg4LiK4LmI4Lit4LiH4LiV4LmI4Lit4LmB4LiW4LinIOC5hOC4oeC5iOC5g+C4iuC5iOC4iuC5iOC4reC4h+C5gOC4lOC4teC4ouC4p+C4iOC4meC4geC4tOC4meC4l+C4seC5',
  'ieC4h+C4iOC4rSAtLS0tICovCiAgLmc0LC5nM3tncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDIsbWlubWF4KDAsMWZyKSl9CiAgLmcye2dyaWQtdGVtcGxhdGUtY29sdW1uczoxZnJ9CiAgLmtwaXtwYWRkaW5nOjExcHggMTJweH0KICAua3BpIC52e2ZvbnQt',
  'c2l6ZToxOXB4fQogIC5rcGkgLmx7Zm9udC1zaXplOjExcHh9CiAgLmtwaSAuc3tmb250LXNpemU6MTAuNXB4fQoKICAvKiAtLS0tIOC4leC4suC4o+C4suC4hyAtPiDguIHguLLguKPguYzguJTguJfguLXguKXguLDguKPguLLguKLguIHguLLguKMgLS0tLQogICAg',
  'IOC4iuC4t+C5iOC4reC4hOC4reC4peC4seC4oeC4meC5jOC4oeC4suC4iOC4suC4gSBkYXRhLWxhYmVsIOC4l+C4teC5iCBsYWJlbENlbGxzKCkg4LiV4Li04LiU4LmE4Lin4LmJ4LmD4Lir4LmJ4Lir4Lil4Lix4LiH4Lin4Liy4LiU4Lir4LiZ4LmJ4LiyCiAgICAg',
  '4LiI4Li24LiH4LmD4LiK4LmJ4LmE4LiU4LmJ4LiB4Lix4Lia4LiX4Li44LiB4LiV4Liy4Lij4Liy4LiH4LmD4LiZ4Lij4Liw4Lia4Lia4LmC4LiU4Lii4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LmB4LiB4LmJ4LiV4Liy4Lij4Liy4LiH4LiX4Li14Lil4Liw4Lit4Lix',
  '4LiZICovCiAgLnR3e292ZXJmbG93LXg6dmlzaWJsZX0KICAudHttaW4td2lkdGg6MCFpbXBvcnRhbnQ7ZGlzcGxheTpibG9jazt3aWR0aDoxMDAlO2JvcmRlcjowfQogIC50IHRoZWFke2Rpc3BsYXk6bm9uZX0KICAudCB0Ym9keXtkaXNwbGF5OmJsb2NrfQogIC50',
  'IHRib2R5IHRyewogICAgZGlzcGxheTpibG9jaztiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpO2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7CiAgICBib3JkZXItcmFkaXVzOnZhcigtLXItc20pO3BhZGRpbmc6OXB4IDEycHg7bWFyZ2luLWJvdHRvbTo4cHg7',
  'CiAgfQogIC50IHRib2R5IHRyOmxhc3QtY2hpbGR7bWFyZ2luLWJvdHRvbTowfQogIC50IHRib2R5IHRkewogICAgZGlzcGxheTpmbGV4O2dhcDoxMHB4O2FsaWduLWl0ZW1zOmJhc2VsaW5lOwogICAgcGFkZGluZzozcHggMDtib3JkZXI6MDt0ZXh0LWFsaWduOmxl',
  'ZnQhaW1wb3J0YW50O3doaXRlLXNwYWNlOm5vcm1hbDsKICB9CiAgLnQgdGJvZHkgdGQ6ZW1wdHksLnQgdGJvZHkgdGQuY2VsbC1lbXB0eXtkaXNwbGF5Om5vbmV9CiAgLnQgdGJvZHkgdGRbZGF0YS1sYWJlbF06OmJlZm9yZXsKICAgIGNvbnRlbnQ6YXR0cihkYXRh',
  'LWxhYmVsKTtmbGV4OjAgMCAzNiU7bWluLXdpZHRoOjA7CiAgICBjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC1zaXplOjExLjVweDtmb250LXdlaWdodDo1MDA7CiAgfQogIC50IHRib2R5IHRkLm51bXtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydH0KICAudCB0Ym9k',
  'eSB0ZC5jZWxsLWFjdGlvbnN7CiAgICBqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1lbmQ7Z2FwOjZweDtwYWRkaW5nLXRvcDo5cHg7bWFyZ2luLXRvcDo2cHg7CiAgICBib3JkZXItdG9wOjFweCBzb2xpZCB2YXIoLS1saW5lLTIpOwogIH0KICAudCB0Ym9keSB0ci5yb3ct',
  'd2lkZSB0ZHtkaXNwbGF5OmJsb2NrO3RleHQtYWxpZ246Y2VudGVyIWltcG9ydGFudH0KICAudCB0Ym9keSB0ci5yb3ctd2lkZSB0ZDo6YmVmb3Jle2NvbnRlbnQ6bm9uZX0KCiAgLyogLS0tLSDguJvguLjguYjguKHguJXguYnguK3guIfguIHguJTguYLguJTguJng',
  'uJTguYnguKfguKLguJnguLTguYnguKcgLS0tLSAqLwogIC5idG57cGFkZGluZzo5cHggMTRweH0KICAuYnRuLnNte3BhZGRpbmc6N3B4IDExcHg7Zm9udC1zaXplOjEzcHh9CiAgLmJ0bi5pY29ue3BhZGRpbmc6OHB4IDEwcHh9CiAgLmNoaXB7cGFkZGluZzo3cHgg',
  'MTRweH0KICAuc2VsLC5pbnB7cGFkZGluZzo5cHggMTFweDtmb250LXNpemU6MTZweH0gICAvKiAxNnB4IOC4geC4seC4mSBpT1Mg4LiL4Li54Lih4LmA4Lit4LiH4LiV4Lit4LiZ4LmB4LiV4Liw4LiK4LmI4Lit4LiH4LiB4Lij4Lit4LiBICovCiAgLnQgLmJ0bi5p',
  'Y29ue3BhZGRpbmc6N3B4IDEwcHh9CgogIC8qIC0tLS0g4LiB4Lij4Liy4LifOiDguYPguKvguYnguYDguJXguLXguYnguKLguKXguIfguKvguJnguYjguK3guKIg4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4LiB4Li04LiZ4LiX4Lix4LmJ4LiH4LiI4LitIC0tLS0g',
  'Ki8KICAuY2hhcnR7bWluLXdpZHRoOjQ2MHB4fQogIC5jaGFydC13cmFwe292ZXJmbG93LXg6YXV0bzstd2Via2l0LW92ZXJmbG93LXNjcm9sbGluZzp0b3VjaH0KCiAgLyogLS0tLSDguIHguKXguYjguK3guIfguIvguYnguK3guJk6IOC5gOC4leC5h+C4oeC4iOC4',
  'reC5geC4muC4muC5geC4nOC5iOC4meC5gOC4peC4t+C5iOC4reC4meC4guC4tuC5ieC4mSDguJvguLjguYjguKHguJrguLHguJnguJfguLbguIHguJXguLTguJTguILguK3guJrguKXguYjguLLguIfguYDguKrguKHguK0gLS0tLSAqLwogIC5tb2RhbC1me3Bvc2l0',
  'aW9uOnN0aWNreTtib3R0b206MDtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpOwogICAgcGFkZGluZy1ib3R0b206Y2FsYygxMnB4ICsgZW52KHNhZmUtYXJlYS1pbnNldC1ib3R0b20pKX0KfQoKLyog4LiI4Lit4LmA4Lil4LmH4LiB4Lih4Liy4LiBICjguYDguITg',
  'uKPguLfguYjguK3guIfguYDguKXguYfguIEgLyDguKLguYjguK3guKvguJnguYnguLLguJXguYjguLLguIfguYHguITguJrguKrguLjguJQpICovCkBtZWRpYSAobWF4LXdpZHRoOjQwMHB4KXsKICAudGFiIC50bHtmb250LXNpemU6OS41cHh9CiAgLmtwaSAudntm',
  'b250LXNpemU6MTcuNXB4fQogIC50IHRib2R5IHRkW2RhdGEtbGFiZWxdOjpiZWZvcmV7ZmxleC1iYXNpczo0MiV9Cn0KCkBtZWRpYSBwcmludHsKICAubmF2LC50b3AtcmlnaHQsLmJ1cmdlciwudC1hY3Rpb25zLC5idG57ZGlzcGxheTpub25lIWltcG9ydGFudH0K',
  'ICAuYXBwe2Rpc3BsYXk6YmxvY2t9IGJvZHl7YmFja2dyb3VuZDojZmZmfQogIC5jYXJke2JyZWFrLWluc2lkZTphdm9pZDtib3gtc2hhZG93Om5vbmV9Cn0KCi8qID09PT09PT09PT09PSDguIrguYjguK3guIfguYDguKXguLfguK3guIHguKrguJbguLLguJnguLDg',
  'uYPguJnguJXguLLguKPguLLguIcgPT09PT09PT09PT09IC0tLS0tLS0tLS0tLS0tLS0tLS0tCiAgIOC4q+C4meC5ieC4suC4leC4suC5gOC4q+C4oeC4t+C4reC4meC4m+C5ieC4suC4ouC4quC4luC4suC4meC4sOC5gOC4lOC4tOC4oSDguYHguJXguYjguIHguJTg',
  'uYDguJvguKXguLXguYjguKLguJnguYTguJTguYnguYDguKXguKLguYTguKHguYjguJXguYnguK3guIfguYDguJvguLTguJTguJ/guK3guKPguYzguKEKICAg4LmD4LiK4LmJ4Liq4Li14LiK4Li44LiU4LmA4LiU4Li14Lii4Lin4LiB4Lix4LiaIC5iIOC5gOC4nuC4',
  't+C5iOC4reC5g+C4q+C5ieC4leC4suC4o+C4suC4h+C4reC5iOC4suC4meC5gOC4q+C4oeC4t+C4reC4meC5gOC4lOC4tOC4oeC4l+C4uOC4geC4m+C4o+C4sOC4geC4suC4owotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0t',
  'LS0tLS0tLS0tLS0tLS0tLS0tLSAqLwouc3Qtc2VsewogIC13ZWJraXQtYXBwZWFyYW5jZTpub25lO2FwcGVhcmFuY2U6bm9uZTsKICBib3JkZXI6MXB4IHNvbGlkIHRyYW5zcGFyZW50O2JvcmRlci1yYWRpdXM6OTlweDsKICBwYWRkaW5nOjNweCAyMnB4IDNweCAx',
  'MHB4O2ZvbnQtc2l6ZToxMnB4O2ZvbnQtd2VpZ2h0OjYwMDtsaW5lLWhlaWdodDoxLjU7CiAgY3Vyc29yOnBvaW50ZXI7bWF4LXdpZHRoOjEwMCU7CiAgYmFja2dyb3VuZC1yZXBlYXQ6bm8tcmVwZWF0O2JhY2tncm91bmQtcG9zaXRpb246cmlnaHQgN3B4IGNlbnRl',
  'cjtiYWNrZ3JvdW5kLXNpemU6OXB4OwogIGJhY2tncm91bmQtaW1hZ2U6dXJsKCJkYXRhOmltYWdlL3N2Zyt4bWw7Y2hhcnNldD11dGY4LCUzQ3N2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAxMCA2JyUzRSUzQ3BhdGgg',
  'ZD0nTTEgMWw0IDQgNC00JyBmaWxsPSdub25lJyBzdHJva2U9JyUyMzY2Nycgc3Ryb2tlLXdpZHRoPScxLjYnIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcvJTNFJTNDL3N2ZyUzRSIpOwp9Ci5zdC1zZWw6aG92ZXJ7Ym9yZGVyLWNvbG9yOnZhcigtLWxpbmUpfQouc3Qt',
  'c2VsOmZvY3Vze291dGxpbmU6bm9uZTtib3JkZXItY29sb3I6dmFyKC0tYnJhbmQpO2JveC1zaGFkb3c6MCAwIDAgM3B4IHZhcigtLWJyYW5kLXNvZnQpfQouc3Qtc2VsW2Rpc2FibGVkXXtvcGFjaXR5Oi41NTtjdXJzb3I6cHJvZ3Jlc3N9Ci5zdC1zZWwub2t7YmFj',
  'a2dyb3VuZC1jb2xvcjp2YXIoLS1vay1zb2Z0KTtjb2xvcjp2YXIoLS1vayl9Ci5zdC1zZWwuaW5mb3tiYWNrZ3JvdW5kLWNvbG9yOnZhcigtLWluZm8tc29mdCk7Y29sb3I6dmFyKC0taW5mbyl9Ci5zdC1zZWwud2FybntiYWNrZ3JvdW5kLWNvbG9yOnZhcigtLXdh',
  'cm4tc29mdCk7Y29sb3I6dmFyKC0td2Fybil9Ci5zdC1zZWwuZGdye2JhY2tncm91bmQtY29sb3I6dmFyKC0tZGFuZ2VyLXNvZnQpO2NvbG9yOnZhcigtLWRhbmdlcil9Ci5zdC1zZWwubXV0ZXtiYWNrZ3JvdW5kLWNvbG9yOnZhcigtLXN1cmZhY2UtMik7Y29sb3I6',
  'dmFyKC0tbXV0ZWQpfQovKiDguIjguK3guYHguITguJo6IOC4geC4suC4o+C5jOC4lOC4l+C4teC4peC4sOC4o+C4suC4ouC4geC4suC4oyDguYPguKvguYnguIrguYjguK3guIfguJnguLXguYnguIHguJTguIfguYjguLLguKLguJTguYnguKfguKLguJnguLTguYng',
  'uKcgKi8KQG1lZGlhIChtYXgtd2lkdGg6NzYwcHgpewogIC5zdC1zZWx7cGFkZGluZzo3cHggMjZweCA3cHggMTJweDtmb250LXNpemU6MTNweH0KfQoKLyogPT09PT09PT09PT09IOC4geC4o+C4suC4nyA9PT09PT09PT09PT0gLS0tLS0tLS0tLS0tLS0tLS0tLS0t',
  'LS0tLS0tLS0tLS0tLS0tCiAgIOC5gOC4quC5ieC4meC4leC4suC4o+C4suC4h+C4geC4seC4muC5geC4geC4meC5gOC4m+C5h+C4meC5gOC4quC5ieC4meC4muC4suC4h+C4l+C4tuC4miDguYTguKHguYjguYPguIrguYnguYDguKrguYnguJnguJvguKPguLAgKOC5',
  'gOC4quC5ieC4meC4m+C4o+C4sOC4reC5iOC4suC4meC5gOC4q+C4oeC4t+C4reC4meC5gOC4quC5ieC4meC4hOC4suC4lOC4geC4suC4o+C4k+C5jCkKICAg4LmB4LiX4LmI4LiH4Lir4LiZ4Liy4LmE4Lih4LmI4LmA4LiB4Li04LiZIDI0cHgg4Lib4Lil4Liy4Lii',
  '4LiU4LmJ4Liy4LiZ4LiC4LmJ4Lit4Lih4Li54Lil4Lih4LiZ4LmA4Lil4LmH4LiB4LiZ4LmJ4Lit4LiiIOC4lOC5ieC4suC4meC4kOC4suC4meC5gOC4q+C4peC4teC5iOC4ouC4oQogICDguJXguLHguKfguKvguJnguLHguIfguKrguLfguK3guJfguLjguIHguJXg',
  'uLHguKfguYPguIrguYnguKrguLXguJXguLHguKfguK3guLHguIHguKnguKPguJvguIHguJXguLQg4LmE4Lih4LmI4LmD4LiK4LmI4Liq4Li14LiC4Lit4LiH4LmB4LiX4LmI4LiHIOKAlCDguKrguLXguK3guKLguLnguYjguJfguLXguYjguYHguJfguYjguIfguYDg',
  'uJfguYjguLLguJnguLHguYnguJkKLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi8KLmNoYXJ0LXdyYXB7b3ZlcmZsb3cteDphdXRvfQouY2hhcnR7ZGlzcGxheTpibG9jazt3aWR0aDox',
  'MDAlO2hlaWdodDphdXRvO21pbi13aWR0aDo1NjBweH0KLmNoYXJ0IC5ncmlkLWx7c3Ryb2tlOnZhcigtLWxpbmUpO3N0cm9rZS13aWR0aDoxO2ZpbGw6bm9uZX0KLmNoYXJ0IC5heGlzLWx7c3Ryb2tlOnZhcigtLWxpbmUpO3N0cm9rZS13aWR0aDoxfQouY2hhcnQg',
  'LnRpY2t7ZmlsbDp2YXIoLS1tdXRlZCk7Zm9udC1zaXplOjExcHg7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zfQouY2hhcnQgLnhsYWJ7ZmlsbDp2YXIoLS1pbmstMik7Zm9udC1zaXplOjEycHh9Ci5jaGFydCAuZGxhYntmaWxsOnZhcigtLWluayk7',
  'Zm9udC1zaXplOjExcHg7Zm9udC13ZWlnaHQ6NjAwfQouY2hhcnQgLmMxe2ZpbGw6dmFyKC0tYzEpfQouY2hhcnQgLmMye2ZpbGw6dmFyKC0tYzIpfQouY2hhcnQgLmhpdHtmaWxsOnRyYW5zcGFyZW50O2N1cnNvcjpwb2ludGVyfQouY2hhcnQgLmhpdDpmb2N1c3tv',
  'dXRsaW5lOm5vbmV9Ci5jaGFydCAuYmFuZHtmaWxsOnZhcigtLWluayk7b3BhY2l0eTowO3RyYW5zaXRpb246b3BhY2l0eSAuMTJzfQouY2hhcnQgZy5vbiAuYmFuZHtvcGFjaXR5Oi4wNX0KLmNoYXJ0IC5oaXQ6Zm9jdXMtdmlzaWJsZSArIC5iYW5kLAouY2hhcnQg',
  'Zy5vbiAuYmFuZHtvcGFjaXR5Oi4wOH0KCi5sZWdlbmR7ZGlzcGxheTpmbGV4O2dhcDoxNHB4O2FsaWduLWl0ZW1zOmNlbnRlcjtmbGV4LXdyYXA6d3JhcDttYXJnaW4tYm90dG9tOjEwcHh9Ci5sZWdlbmQgLmt7ZGlzcGxheTppbmxpbmUtZmxleDthbGlnbi1pdGVt',
  'czpjZW50ZXI7Z2FwOjZweDtmb250LXNpemU6MTJweDtjb2xvcjp2YXIoLS1pbmstMil9Ci5sZWdlbmQgLnN3e3dpZHRoOjEycHg7aGVpZ2h0OjEycHg7Ym9yZGVyLXJhZGl1czozcHg7ZmxleDpub25lfQoKLyog4LiB4Lil4LmI4Lit4LiH4Lia4Lit4LiB4LiE4LmI',
  '4Liy4LiV4Lit4LiZ4LiK4Li14LmJIOKAlCDguITguYjguLLguJXguLHguKfguYPguKvguI3guYjguKHguLLguIHguYjguK3guJkg4LiK4Li34LmI4Lit4Lij4Liy4Lii4LiB4Liy4Lij4LmA4Lib4LmH4LiZ4LiV4Lix4Lin4Lij4Lit4LiHICovCi5jdGlwe3Bvc2l0',
  'aW9uOmZpeGVkO3otaW5kZXg6OTA7cG9pbnRlci1ldmVudHM6bm9uZTtiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UpOwogIGJvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czp2YXIoLS1yLXNtKTtib3gtc2hhZG93OnZhcigtLXNoLWxnKTsK',
  'ICBwYWRkaW5nOjhweCAxMHB4O2ZvbnQtc2l6ZToxMnB4O21pbi13aWR0aDoxMzJweDtvcGFjaXR5OjA7dHJhbnNpdGlvbjpvcGFjaXR5IC4xc30KLmN0aXAub257b3BhY2l0eToxfQouY3RpcCAubXtmb250LXdlaWdodDo3MDA7Y29sb3I6dmFyKC0taW5rKTttYXJn',
  'aW4tYm90dG9tOjZweH0KLmN0aXAgLnJ7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6N3B4O21hcmdpbi10b3A6M3B4fQouY3RpcCAuciBpe3dpZHRoOjEycHg7aGVpZ2h0OjJweDtib3JkZXItcmFkaXVzOjJweDtmbGV4Om5vbmV9Ci5jdGlwIC5y',
  'IGJ7Y29sb3I6dmFyKC0taW5rKTtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7bWFyZ2luLWxlZnQ6YXV0b30KLmN0aXAgLnIgc3Bhbntjb2xvcjp2YXIoLS1tdXRlZCl9Cgo8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5PgoKPGRpdiBjbGFzcz0iYXBwIj4K',
  'ICA8IS0tID09PT09PT09PT09PT09PT09IHNpZGViYXIgPT09PT09PT09PT09PT09PT0gLS0+CiAgPGFzaWRlIGNsYXNzPSJuYXYiIGlkPSJuYXYiPgogICAgPGRpdiBjbGFzcz0iYnJhbmQiPgogICAgICA8Yj7wn4+iIDw/PSBhcHBOYW1lID8+PC9iPgogICAgICA8',
  'c3Bhbj48Pz0gc3VidGl0bGUgPz4gwrcgdjw/PSB2ZXJzaW9uID8+PC9zcGFuPgogICAgPC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJuYXYtbGlzdCIgaWQ9Im5hdkxpc3QiPjwvZGl2PgogICAgPGRpdiBjbGFzcz0ibmF2LWZvb3QiIGlkPSJuYXZGb290Ij7guIHguLPg',
  'uKXguLHguIfguYLguKvguKXguJTigKY8L2Rpdj4KICA8L2FzaWRlPgoKICA8IS0tID09PT09PT09PT09PT09PT09IG1haW4gPT09PT09PT09PT09PT09PT0gLS0+CiAgPGRpdiBjbGFzcz0ibWFpbiI+CiAgICA8aGVhZGVyIGNsYXNzPSJ0b3AiPgogICAgICA8YnV0',
  'dG9uIGNsYXNzPSJidXJnZXIiIG9uY2xpY2s9InRvZ2dsZU5hdigpIj7imLA8L2J1dHRvbj4KICAgICAgPGRpdj4KICAgICAgICA8aDEgaWQ9InBhZ2VUaXRsZSI+4Lig4Liy4Lie4Lij4Lin4LihPC9oMT4KICAgICAgICA8ZGl2IGNsYXNzPSJzdWIiIGlkPSJwYWdl',
  'U3ViIj7guYHguJTguIrguJrguK3guKPguYzguJTguKPguKfguKHguJfguLjguIHguKrguYjguKfguJnguILguK3guIfguKvguK3guJ7guLHguIE8L2Rpdj4KICAgICAgPC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9InRvcC1yaWdodCI+CiAgICAgICAgPHNwYW4gaWQ9',
  'ImxpdmVEb3QiPjwvc3Bhbj4KICAgICAgICA8c3BhbiBpZD0iYmVsbFdyYXAiIGNsYXNzPSJiZWxsLXdyYXAiPjwvc3Bhbj4KICAgICAgICA8YnV0dG9uIGNsYXNzPSJidG4gaWNvbiIgaWQ9InRoZW1lQnRuIiB0aXRsZT0i4Liq4Lil4Lix4Lia4LiY4Li14LihIiBv',
  'bmNsaWNrPSJjeWNsZVRoZW1lKCkiPvCfjJc8L2J1dHRvbj4KICAgICAgICA8aW5wdXQgY2xhc3M9ImlucCB3LWF1dG8iIGlkPSJzZWFyY2hCb3giIHBsYWNlaG9sZGVyPSLwn5SOIOC4hOC5ieC4meC4q+C4suC4l+C4seC5ieC4h+C4o+C4sOC4muC4muKApiIgc3R5',
  'bGU9IndpZHRoOjE4MHB4IgogICAgICAgICAgICAgICBvbmlucHV0PSJvblNlYXJjaCh0aGlzLnZhbHVlKSIgYXV0b2NvbXBsZXRlPSJvZmYiPgogICAgICAgIDxzZWxlY3QgY2xhc3M9InNlbCB3LWF1dG8iIGlkPSJ5ZWFyU2VsIiBvbmNoYW5nZT0ic2V0WWVhcih0',
  'aGlzLnZhbHVlKSI+PC9zZWxlY3Q+CiAgICAgICAgPGJ1dHRvbiBjbGFzcz0iYnRuIGljb24iIHRpdGxlPSLguKPguLXguYDguJ/guKPguIoiIG9uY2xpY2s9InJlZnJlc2goKSI+4oa7PC9idXR0b24+CiAgICAgIDwvZGl2PgogICAgPC9oZWFkZXI+CiAgICA8bWFp',
  'biBjbGFzcz0iY29udGVudCIgaWQ9InZpZXciPgogICAgICA8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj48c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPjwvZGl2PuC4geC4s+C4peC4seC4h+C5gOC4iuC4t+C5iOC4reC4oeC4leC5iOC4reC4o+C4',
  'sOC4muC4muKApjwvZGl2PgogICAgPC9tYWluPgogIDwvZGl2PgoKICA8IS0tIOC5geC4luC4muC4peC5iOC4suC4h+C4quC4s+C4q+C4o+C4seC4muC4oeC4t+C4reC4luC4t+C4rSDigJQg4Lit4Lii4Li54LmI4LmD4LiZ4Lir4LiZ4LmJ4Liy4LmA4LiU4Li14Lii',
  '4Lin4LiB4Lix4LiZ4LiZ4Li14LmJ4LmA4Liq4Lih4LitIOC5hOC4oeC5iOC5hOC4lOC5ieC5geC4ouC4geC5hOC4n+C4peC5jAogICAgICAgQ1NTIOC5gOC4m+C5h+C4meC4leC4seC4p+C4leC4seC4lOC4quC4tOC4meC4p+C5iOC4suC4iOC4reC5hOC4q+C4meC5',
  'gOC4q+C5h+C4mSDguKLguYjguK0t4LiC4Lii4Liy4Lii4Lir4LiZ4LmJ4Liy4LiV4LmI4Liy4LiH4LmB4Lil4LmJ4Lin4Liq4Lil4Lix4Lia4LmE4LiU4LmJ4LiX4Lix4LiZ4LiX4Li1IC0tPgogIDxuYXYgY2xhc3M9InRhYmJhciIgaWQ9InRhYkJhciIgYXJpYS1s',
  'YWJlbD0i4LmA4Lih4LiZ4Li54Lir4Lil4Lix4LiBIj48L25hdj4KPC9kaXY+Cgo8ZGl2IGlkPSJhdXRoUm9vdCI+PC9kaXY+CjxkaXYgaWQ9Im1vZGFsUm9vdCI+PC9kaXY+CjxkaXYgaWQ9InRvYXN0Um9vdCI+PC9kaXY+Cgo8c2NyaXB0PgogIC8qIOC4hOC5iOC4',
  'suC4l+C4seC5ieC4h+C4quC4suC4oeC4luC4ueC4geC4geC4o+C4reC4h+C4oeC4suC4iOC4suC4geC4neC4seC5iOC4h+C5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jOC5geC4peC5ieC4pyDguIjguLbguIfguKvguKXguLjguJTguK3guK3guIHguIjg',
  'uLLguIHguYDguITguKPguLfguYjguK3guIfguKvguKHguLLguKLguITguLPguJ7guLnguJTguYTguKHguYjguYTguJTguYkKICAgICAgIGFjY2Vzc0tleSAg4Lic4LmI4Liy4LiZIHNhZmVLZXlfICAgIOC5gOC4q+C4peC4t+C4reC5geC4hOC5iCBBLVogYS16IDAt',
  'OSBfIC0KICAgICAgIHJvbGUgICAgICAg4Lih4Liy4LiI4Liy4LiB4Lij4Liy4Lii4LiB4Liy4Lij4LiE4LiH4LiX4Li14LmIIFJPTEUKICAgICAgIHRoZW1lICAgICAg4Lic4LmI4Liy4LiZIHNhZmVUaGVtZV8gIOC5gOC4q+C4peC4t+C4reC5geC4hOC5iCAzIOC4',
  'hOC5iOC4suC4l+C4teC5iOC4geC4s+C4q+C4meC4lOC5hOC4p+C5iQoKICAgICDguJfguLHguYnguIfguKrguLLguKHguJXguYnguK3guIfguJ7guLTguKHguJ7guYzguYHguJrguJrguJTguLTguJogKGZvcmNlLXByaW50aW5nKSDguYDguJfguYjguLLguJnguLHg',
  'uYnguJkg4Lir4LmJ4Liy4Lih4LmD4LiK4LmJ4LmB4Lia4LiaIHN0YW5kYXJkLXByaW50aW5nCiAgICAg4LmA4Lie4Lij4Liy4Liw4LmB4Lia4Lia4Lir4Lil4Lix4LiH4LiI4LiwIGVzY2FwZSDguYDguITguKPguLfguYjguK3guIfguKvguKHguLLguKLguITguLPg',
  'uJ7guLnguJTguYDguJvguYfguJkgJnF1b3Q7IOC4i+C4tuC5iOC4h+C5g+C4meC5geC4l+C5h+C4gSBzY3JpcHQKICAgICDguYDguJrguKPguLLguKfguYzguYDguIvguK3guKPguYzguYTguKHguYjguJbguK3guJTguIHguKXguLHguJog4LiX4Liz4LmD4Lir4LmJ',
  '4LiX4Lix4LmJ4LiH4Lia4Lil4LmH4Lit4LiB4LiZ4Li14LmJ4Lie4Lix4LiH4LiX4Lix4LmJ4LiH4LiB4LmJ4Lit4LiZ4LmB4Lil4Liw4LiE4LmI4Liy4LmE4Lih4LmI4LiW4Li24LiH4Lir4LiZ4LmJ4Liy4LmA4Lin4LmH4LiaICovCiAgdmFyIEFDQ0VTU19LRVkg',
  'PSAiPD8hPSBhY2Nlc3NLZXkgPz4iOwogIHZhciBVU0VSX1JPTEUgID0gIjw/IT0gcm9sZSA/PiI7CiAgdmFyIElOSVRfVEhFTUUgPSAiPD8hPSB0aGVtZSA/PiI7Cjwvc2NyaXB0Pgo8c2NyaXB0PgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT0KICAgQXBwLmh0bWwg4oCUIGNvcmU6IHN0YXRlLCBhcGksIHJvdXRlciwgZm9ybWF0LCBtb2RhbCwgdXBsb2FkCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAq',
  'LwoKdmFyIFMgPSB7CiAgYm9vdDogbnVsbCwgICAgICAgICAgLy8g4LiC4LmJ4Lit4Lih4Li54Lil4LiV4Lix4LmJ4LiH4LiV4LmJ4LiZ4LiI4Liy4LiBIGFwcC5ib290c3RyYXAKICBwYWdlOiAnZGFzaGJvYXJkJywKICB5ZWFyOiBTdHJpbmcobmV3IERhdGUoKS5n',
  'ZXRGdWxsWWVhcigpKSwKICBjYWNoZToge30sICAgICAgICAgICAvLyDguYDguIHguYfguJrguJzguKXguKXguLHguJ7guJjguYzguKXguYjguLLguKrguLjguJTguILguK3guIfguYHguJXguYjguKXguLDguKvguJnguYnguLIKICBwYXJhbXM6IHt9LCAgICAgICAg',
  'ICAvLyDguJXguLHguKfguIHguKPguK3guIfguKLguYjguK3guKLguILguK3guIfguYHguJXguYjguKXguLDguKvguJnguYnguLIg4LmA4LiK4LmI4LiZIHtyb29tOiczMTEnLCBzdGF0dXM6J2FsbCd9CiAgYnVzeTogZmFsc2UsCiAgdmVyc2lvbjogMCwgICAgICAg',
  'ICAgLy8g4Lij4Li44LmI4LiZ4LiC4LmJ4Lit4Lih4Li54Lil4LiX4Li14LmI4Lir4LiZ4LmJ4Liy4LiZ4Li14LmJ4LiW4Li34Lit4Lit4Lii4Li54LmICiAgc2VsZkNoYW5nZVVudGlsOiAwLCAgLy8g4LmA4Lie4Li04LmI4LiH4LiB4LiU4Lia4Lix4LiZ4LiX4Li2',
  '4LiB4LmA4Lit4LiHIOKAlCDguK3guKLguYjguLLguYDguJTguYnguIfguKfguYjguLIgIuC4oeC4teC4hOC4meC5geC4geC5ieC4guC5ieC4reC4oeC4ueC4pSIKICBzeW5jVGltZXI6IG51bGwKfTsKCnZhciBBTExfREVCVFMgPSBbXTsKCnZhciBQQUdFUyA9IFsK',
  'ICB7IGlkOidkYXNoYm9hcmQnLCBpYzon8J+TiicsIGxhYmVsOifguKDguLLguJ7guKPguKfguKEnLCAgICAgICAgICAgICAgc3ViOifguYHguJTguIrguJrguK3guKPguYzguJTguKPguKfguKHguJfguLjguIHguKrguYjguKfguJnguILguK3guIfguKvguK3guJ7g',
  'uLHguIEnLCAgICAgICAgc2VjOifguKDguLLguJ7guKPguKfguKEnLCB0YWI6J+C4oOC4suC4nuC4o+C4p+C4oScgfSwKICB7IGlkOidkZWJ0TWFpbicsICBpYzon8J+SsCcsIGxhYmVsOifguKPguLLguKLguIHguLLguKPguKrguKPguLjguJvguKPguKfguKEnLCAg',
  'ICAgICBzdWI6J+C4muC4seC4jeC4iuC4teC5guC4reC4meC5g+C4iuC5ieC4q+C4meC4teC5ieC4q+C4peC4seC4geC4guC4reC4h+C4q+C4reC4nuC4seC4gScsICAgICAgICBzZWM6J+C4geC4suC4o+C5gOC4h+C4tOC4mScgfSwKICB7IGlkOidkZWJ0U3ViJywg',
  'ICBpYzon8J+nvicsIGxhYmVsOifguKvguJnguLXguYnguKrguLTguJknLCAgICAgICAgICAgICAgc3ViOifguJrguLHguI3guIrguLXguYLguK3guJnguYPguIrguYnguKvguJnguLXguYnguKPguK3guIfguILguK3guIfguKvguK3guJ7guLHguIEnIH0sCiAgeyBp',
  'ZDoncHVyY2hhc2VzJywgaWM6J/Cfm5InLCBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHJywgICAgICAgIHN1Yjon4LiC4Lit4LiH4LmA4LiC4LmJ4Liy4Lir4Lit4Lie4Lix4LiBIOC4o+C4suC4hOC4siDguJvguKPguLDguIHg',
  'uLHguJkg4LmB4Lil4Liw4Liq4Lil4Li04LibJyB9LAogIHsgaWQ6J2ZpbmFuY2UnLCAgIGljOifwn5OSJywgbGFiZWw6J+C4o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKLguKvguK0nLCAgICAgIHN1Yjon4LiE4LmI4Liy4LmA4LiK4LmI4Liy',
  '4LiX4Li14LmI4LmA4LiB4LmH4Lia4LmE4LiU4LmJIMK3IOC4hOC5iOC4suC5hOC4nyDCtyDguITguYjguLLguJnguYnguLMgwrcg4LiE4LmI4Liy4LmA4LiZ4LmH4LiVIMK3IOC4oOC4suC4qeC4tScsIHRhYjon4Lij4Liy4Lii4Lij4Lix4LiaLeC4iOC5iOC4suC4',
  'oicgfSwKICB7IGlkOidhYycsICAgICAgICBpYzon4p2E77iPJywgbGFiZWw6J+C4peC5ieC4suC4h+C5geC4reC4o+C5jCcsICAgICAgICAgICAgc3ViOifguJXguLLguKPguLLguIfguKXguYnguLLguIfguYHguK3guKPguYzguKPguLLguKLguKvguYnguK3guIcg',
  'MjQg4Lir4LmJ4Lit4LiHJywgICAgICBzZWM6J+C4i+C5iOC4reC4oeC4muC4s+C4o+C4uOC4hycsIHRhYjon4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJyB9LAogIHsgaWQ6J3JlcGFpcnMnLCAgIGljOifwn5SnJywgbGFiZWw6J+C4i+C5iOC4reC4oeC5geC4i+C4',
  'oeC4leC4suC4oeC4q+C5ieC4reC4hycsICAgICAgc3ViOifguIfguLLguJnguYHguIjguYnguIfguIvguYjguK3guKHguYHguKLguIHguJXguLLguKHguKvguYnguK3guIcnLCB0YWI6J+C4i+C5iOC4reC4oeC4q+C5ieC4reC4hycgfSwKICB7IGlkOididWlsZGlu',
  'ZycsICBpYzon8J+PoicsIGxhYmVsOifguIvguYjguK3guKHguYHguIvguKHguJXguLbguIHguYLguJTguKLguKPguKfguKEnLCAgICBzdWI6J+C4h+C4suC4meC4quC5iOC4p+C4meC4geC4peC4suC4h+C4guC4reC4h+C4reC4suC4hOC4suC4oycgfSwKICB7IGlk',
  'Oidyb29tcycsICAgICBpYzon8J+aqicsIGxhYmVsOifguKvguYnguK3guIfguJ7guLHguIEnLCAgICAgICAgICAgICBzdWI6J+C4l+C4sOC5gOC4muC4teC4ouC4meC4q+C5ieC4reC4h+C5geC4peC4sOC4m+C4o+C4sOC4p+C4seC4leC4tOC4o+C4suC4ouC4q+C5',
  'ieC4reC4hycsICAgICAgIHNlYzon4LiC4LmJ4Lit4Lih4Li54LilJyB9LAogIHsgaWQ6J3JlcG9ydHMnLCAgIGljOifwn5OIJywgbGFiZWw6J+C4o+C4suC4ouC4h+C4suC4mSAmIOC4quC4s+C4o+C4reC4h+C4guC5ieC4reC4oeC4ueC4pScsIHN1Yjon4LiE4LmI',
  '4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Lij4Liy4Lii4Lir4LmJ4Lit4LiHIMK3IOC4m+C4j+C4tOC4l+C4tOC4meC4h+C4suC4mSDCtyDguKrguYjguIfguK3guK3guIHguILguYnguK3guKHguLnguKUnIH0sCiAgeyBpZDonc2V0dGluZ3MnLCAgaWM6J+Kame+4',
  'jycsIGxhYmVsOifguJXguLHguYnguIfguITguYjguLInLCAgICAgICAgICAgICAgc3ViOifguJrguLHguI3guIrguLUgwrcg4LiY4Li14LihIMK3IOC4nOC4ueC5ieC5g+C4iuC5iSDCtyDguKXguLTguIfguIHguYzguYDguILguYnguLLguYPguIrguYnguIfguLLg',
  'uJknLCAgIHNlYzon4Lij4Liw4Lia4LiaJyB9Cl07CgovKiAtLS0tLS0tLS0tLS0tLS0tIEFQSSAtLS0tLS0tLS0tLS0tLS0tICovCgovKiog4LiB4Li44LiN4LmB4LiI4LiX4Li14LmI4LiI4Liw4LmB4LiZ4Lia4LmE4Lib4LiB4Lix4Lia4LiX4Li44LiB4LiE4Liz',
  '4Liq4Lix4LmI4LiHIOKAlCDguKHguLUgMiDguJfguLLguIfguKrguLPguKPguK3guIfguYDguJzguLfguYjguK3guJfguLLguIfguYHguKPguIHguYTguKHguYjguKHguLIgKi8KdmFyIFJFU09MVkVEX0tFWSA9IG51bGw7CgpmdW5jdGlvbiBhY2Nlc3NLZXkoKXsK',
  'ICBpZiAoUkVTT0xWRURfS0VZICE9PSBudWxsKSByZXR1cm4gUkVTT0xWRURfS0VZOwogIFJFU09MVkVEX0tFWSA9ICh0eXBlb2YgQUNDRVNTX0tFWSA9PT0gJ3N0cmluZycgJiYgQUNDRVNTX0tFWSkgPyBBQ0NFU1NfS0VZIDogJyc7CiAgcmV0dXJuIFJFU09MVkVE',
  'X0tFWTsKfQoKLyoqIHRydWUg4LiW4LmJ4Liy4LmA4Lib4Li04LiU4LiU4LmJ4Lin4Lii4Lil4Li04LiH4LiB4LmM4Lic4Li54LmJ4LiU4Li54LmB4LilIOKAlCDguYPguIrguYnguYHguJfguJnguJXguLHguKfguYHguJvguKMgQ0FOX0VESVQg4LiV4Lij4LiHIOC5',
  'hiDguJfguLXguYjguK3guLLguIjguYTguKHguYjguJbguLnguIHguJvguKPguLDguIHguLLguKggKi8KZnVuY3Rpb24gY2FuRWRpdCgpewogIGlmICh0eXBlb2YgQ0FOX0VESVQgIT09ICd1bmRlZmluZWQnKSByZXR1cm4gISFDQU5fRURJVDsKICByZXR1cm4gISEo',
  'Uy5ib290ICYmIFMuYm9vdC5jYW5FZGl0KTsKfQoKZnVuY3Rpb24gY2FsbEFwaShhY3Rpb24sIHBheWxvYWQpewogIHZhciBib2R5ID0ge307CiAgT2JqZWN0LmtleXMocGF5bG9hZCB8fCB7fSkuZm9yRWFjaChmdW5jdGlvbihrKXsgYm9keVtrXSA9IHBheWxvYWRb',
  'a107IH0pOwogIGJvZHkuX2tleSA9IGFjY2Vzc0tleSgpOwogIC8vIOC4nOC4ueC5ieC5gOC4o+C4teC4ouC4geC4quC5iOC4hyBfc2Vzc2lvbiDguKHguLLguYDguK3guIfguYTguJTguYkgKOC4leC4reC4meC4reC4reC4geC4iOC4suC4geC4o+C4sOC4muC4muC4',
  'leC5ieC4reC4h+C5g+C4iuC5ieC4leC4seC4p+C5gOC4geC5iOC4sikKICBpZiAoYm9keS5fc2Vzc2lvbiA9PT0gdW5kZWZpbmVkKSBib2R5Ll9zZXNzaW9uID0gKHR5cGVvZiBBVVRIICE9PSAndW5kZWZpbmVkJyA/IEFVVEguc2Vzc2lvbiA6ICcnKSB8fCAnJzsK',
  'ICBwYXlsb2FkID0gYm9keTsKICB2YXIgbXV0YXRpbmcgPSBDTElFTlRfTVVUQVRJTkcudGVzdChhY3Rpb24pOwogIGlmIChtdXRhdGluZykgc3luY1NldCgnc2F2aW5nJyk7CgogIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpewog',
  'ICAgZ29vZ2xlLnNjcmlwdC5ydW4KICAgICAgLndpdGhTdWNjZXNzSGFuZGxlcihmdW5jdGlvbihyZXMpewogICAgICAgIGlmICghcmVzKSB7IGlmIChtdXRhdGluZykgc3luY1NldCgnb2ZmbGluZScpOyByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcign4LmE4Lih4LmI',
  '4LmE4LiU4LmJ4Lij4Lix4Lia4LiC4LmJ4Lit4Lih4Li54Lil4LiI4Liy4LiB4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmMJykpOyB9CiAgICAgICAgaWYgKHJlcy5vaykgewogICAgICAgICAgaWYgKG11dGF0aW5nKSB7IG1hcmtTZWxmQ2hhbmdlKCk7',
  'IHN5bmNTZXQoJ3NhdmVkJyk7IH0KICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlcy5kYXRhKTsKICAgICAgICB9CiAgICAgICAgLy8g4Lir4Lih4LiU4Lit4Liy4Lii4Li44Lij4Liw4Lir4Lin4LmI4Liy4LiH4LmD4LiK4LmJ4LiH4Liy4LiZIOKAlCDguJ7guLLg',
  'uIHguKXguLHguJrguYTguJvguKvguJnguYnguLLguKXguYfguK3guIHguK3guLTguJnguYHguJfguJnguJfguLXguYjguIjguLDguILguLbguYnguJnguILguYnguK3guITguKfguLLguKHguITguYnguLLguIfguYTguKfguYnguYDguInguKIg4LmGCiAgICAgICAg',
  'aWYgKHJlcy5uZWVkTG9naW4gJiYgdHlwZW9mIG9uU2Vzc2lvbkxvc3QgPT09ICdmdW5jdGlvbicpIG9uU2Vzc2lvbkxvc3QoKTsKICAgICAgICBpZiAobXV0YXRpbmcpIHN5bmNTZXQoJ2Vycm9yJywgcmVzLmVycm9yKTsKICAgICAgICByZWplY3QobmV3IEVycm9y',
  'KHJlcy5lcnJvcikpOwogICAgICB9KQogICAgICAud2l0aEZhaWx1cmVIYW5kbGVyKGZ1bmN0aW9uKGVycil7CiAgICAgICAgLy8g4LmA4LiZ4LmH4LiV4Liq4Liw4LiU4Li44LiUIOKAlCDguILguK3guIfguJfguLXguYjguIHguKPguK3guIHguYTguKfguYnguKLg',
  'uLHguIfguK3guKLguLnguYjguYPguJnguJ/guK3guKPguYzguKEg4LmE4Lih4LmI4Lir4Liy4Lii4LmE4Lib4LmE4Lir4LiZCiAgICAgICAgaWYgKG11dGF0aW5nKSBzeW5jU2V0KGlzT2ZmbGluZUVycm9yKGVycikgPyAnb2ZmbGluZScgOiAnZXJyb3InLCAoZXJy',
  'ICYmIGVyci5tZXNzYWdlKSB8fCBTdHJpbmcoZXJyKSk7CiAgICAgICAgcmVqZWN0KGVycik7CiAgICAgIH0pCiAgICAgIC5hcGkoYWN0aW9uLCBwYXlsb2FkIHx8IHt9KTsKICB9KTsKfQoKLyoqIOC5gOC4o+C4teC4ouC4geC5gOC4oeC4t+C5iOC4reC5gOC4i+C4',
  'tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jOC4muC4reC4geC4p+C5iOC4suC4ouC4seC4h+C5hOC4oeC5iOC5hOC4lOC5ieC4peC5h+C4reC4geC4reC4tOC4mSAo4Lir4Lih4LiU4Lit4Liy4Lii4Li4IC8g4LiW4Li54LiB4LmD4Lir4LmJ4Lit4Lit4LiB4LiI4Liy',
  '4LiB4Lij4Liw4Lia4LiaKSAqLwp2YXIgc2Vzc2lvbkxvc3RBdCA9IDA7CmZ1bmN0aW9uIG9uU2Vzc2lvbkxvc3QoKXsKICBpZiAoRGF0ZS5ub3coKSAtIHNlc3Npb25Mb3N0QXQgPCAzMDAwKSByZXR1cm47ICAgLy8g4Lir4Lil4Liy4Lii4LiE4Liz4Liq4Lix4LmI',
  '4LiH4Lie4Lij4LmJ4Lit4Lih4LiB4Lix4LiZ4LiB4LmH4LmA4LiU4LmJ4LiH4LiE4Lij4Lix4LmJ4LiH4LmA4LiU4Li14Lii4Lin4Lie4LitCiAgc2Vzc2lvbkxvc3RBdCA9IERhdGUubm93KCk7CiAgc2F2ZVNlc3Npb24oJycpOwogIGNsb3NlTW9kYWwoKTsKICBp',
  'ZiAoQVVUSC5kZXZpY2UpIHNob3dQaW4oKTsgZWxzZSBzaG93TG9naW4oJ+C4q+C4oeC4lOC5gOC4p+C4peC4suC5g+C4iuC5ieC4h+C4suC4mSDguIHguKPguLjguJPguLLguYDguILguYnguLLguKrguLnguYjguKPguLDguJrguJrguK3guLXguIHguITguKPguLHg',
  'uYnguIcnKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSBib290ICYgcm91dGluZyAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiBib290KCl7CiAgLy8g4LiX4Liy4LiY4Li14Lih4LiB4LmI4Lit4LiZ4Lit4Lii4LmI4Liy4LiH4Lit4Li34LmI4LiZIOC4iOC4',
  'sOC5hOC4lOC5ieC5hOC4oeC5iOC5gOC4q+C5h+C4meC4q+C4meC5ieC4suC4iOC4reC4geC4o+C4sOC4nuC4o+C4tOC4muC4guC4suC4p+C4leC4reC4meC5gOC4m+C4tOC4lAogIGFwcGx5VGhlbWUobHNHZXQoTFNfVEhFTUUpIHx8ICh0eXBlb2YgSU5JVF9USEVN',
  'RSA9PT0gJ3N0cmluZycgPyBJTklUX1RIRU1FIDogJ+C4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hycpKTsKICAvLyBhdXRoR2F0ZSDguIjguLDguK3guYjguLLguJnguIHguLjguI3guYHguIjguIjguLLguIEgVVJMIOC4guC4reC4h+C4q+C4meC5ieC4suC5',
  'geC4oeC5iOC5g+C4q+C5ieC4lOC5ieC4p+C4oiDguJbguYnguLLguJXguLHguKfguYHguJvguKPguYTguKHguYjguKHguLLguJbguLbguIfguKvguJnguYnguLLguYDguKfguYfguJoKICBhdXRoR2F0ZSgpOwp9CgpmdW5jdGlvbiBib290Tm93KCl7CiAgY2FsbEFw',
  'aSgnYXBwLmJvb3RzdHJhcCcpLnRoZW4oZnVuY3Rpb24oYil7CiAgICBTLmJvb3QgPSBiOwogICAgcmVuZGVyTmF2KCk7CiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2Rm9vdCcpLmlubmVySFRNTCA9IG5hdkZvb3RIdG1sKGIpOwogICAgUy52ZXJzaW9u',
  'ID0gYi52ZXJzaW9uIHx8IDA7CiAgICBpZiAoIWIuY2FuRWRpdCkgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdyZWFkb25seScpOwogICAgLy8g4LiY4Li14Lih4LiC4Lit4LiH4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJ4LiK4LiZ4Liw4LmA4Liq',
  '4Lih4LitIOC4luC5ieC4suC4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4leC4seC5ieC4h+C4hOC5iOC4reC4ouC5g+C4iuC5ieC4guC4reC4h+C4o+C4sOC4muC4mgogICAgYXBwbHlUaGVtZShjdXJyZW50VGhlbWUoKSk7CiAgICBnbyhzdGFydFBhZ2UoYikp',
  'OwogICAgcmVmcmVzaEFsZXJ0cygpOwogICAgc3RhcnRQb2xsaW5nKGIuc2V0dGluZ3MgJiYgYi5zZXR0aW5ncy5yZWZyZXNoU2Vjb25kcyk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndmlldycpLmlubmVySFRN',
  'TCA9CiAgICAgICc8ZGl2IGNsYXNzPSJjYXJkIj48ZGl2IGNsYXNzPSJjYXJkLWIiPjxoMz7guYDguIrguLfguYjguK3guKHguJXguYjguK3guKPguLDguJrguJrguYTguKHguYjguKrguLPguYDguKPguYfguIg8L2gzPicgKwogICAgICAnPHAgY2xhc3M9Im11dGVk',
  'Ij4nICsgZXNjKGUubWVzc2FnZXx8ZSkgKyAnPC9wPicgKwogICAgICAnPHAgY2xhc3M9ImZzMTMiPuC4leC4o+C4p+C4iOC4quC4reC4muC4p+C5iOC4sjog4LmA4Lib4Li04LiU4LiK4Li14LiV4LmB4Lil4LmJ4Lin4Lij4Lix4LiZIDxiPuC5gOC4oeC4meC4uSDw',
  'n4+iIFRoZSBNIENvcm5lciBBUCDihpIg8J+agCDguJXguLTguJTguJXguLHguYnguIfguJfguLHguYnguIfguKvguKHguJTguYPguJnguITguKXguLTguIHguYDguJTguLXguKLguKc8L2I+ICcgKwogICAgICAn4LmA4Lij4Li14Lii4Lia4Lij4LmJ4Lit4Lii4LmB',
  '4Lil4LmJ4LinPC9wPjwvZGl2PjwvZGl2Pic7CiAgfSk7Cn0KCi8qKiDguKvguJnguYnguLLguYHguKPguIHguJfguLXguYjguIjguLDguYDguJvguLTguJQg4oCUIOC4leC4suC4oeC4l+C4teC5iOC4leC4seC5ieC4h+C5hOC4p+C5iSDguYHguJXguYjguJbguYng',
  'uLLguKHguLUgI2hhc2gg4LmD4LiZ4Lil4Li04LiH4LiB4LmM4LmD4Lir4LmJIGhhc2gg4LiK4LiZ4LiwICovCmZ1bmN0aW9uIHN0YXJ0UGFnZShiKXsKICB2YXIgaGFzaCA9IChsb2NhdGlvbi5oYXNoIHx8ICcnKS5yZXBsYWNlKCcjJywnJyk7CiAgaWYgKFBBR0VT',
  'LnNvbWUoZnVuY3Rpb24ocCl7IHJldHVybiBwLmlkID09PSBoYXNoOyB9KSkgcmV0dXJuIGhhc2g7CiAgdmFyIG1hcCA9IHsKICAgICfguYHguJTguIrguJrguK3guKPguYzguJQnOidkYXNoYm9hcmQnLCAn4Lij4Liy4Lii4LiB4Liy4Lij4Liq4Lij4Li44Lib4Lij',
  '4Lin4LihJzonZGVidE1haW4nLCAn4Lir4LiZ4Li14LmJ4Liq4Li04LiZJzonZGVidFN1YicsCiAgICAn4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHJzoncHVyY2hhc2VzJywgJ+C4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4suC4oeC4q+C5',
  'ieC4reC4hyc6J3JlcGFpcnMnCiAgfTsKICByZXR1cm4gbWFwW2Iuc2V0dGluZ3MgJiYgYi5zZXR0aW5ncy5zdGFydFBhZ2VdIHx8ICdkYXNoYm9hcmQnOwp9CgovKiog4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Lih4Li44Lih4Lil4LmI4Liy4LiH4LiL4LmJ4Liy4Lii',
  'IOKAlCDguYDguKfguK3guKPguYzguIrguLHguJnguYDguKfguYfguJrguYHguK3guJvguIjguLDguYDguILguLXguKLguJnguJfguLHguJrguJ/guLHguIfguIHguYzguIrguLHguJnguJnguLXguYkgKi8KZnVuY3Rpb24gbmF2Rm9vdEh0bWwoYil7CiAgdmFyIHUg',
  'PSBiLnVzZXIgfHwge307CiAgcmV0dXJuICc8YiBzdHlsZT0iY29sb3I6I2M3ZDBlMCI+JyArIGVzYyh1Lm5hbWUgfHwgdS5sYWJlbCB8fCAnJykgKyAnPC9iPicgKwogICAgKHUudXNlcm5hbWUgPyAnIDxzcGFuIHN0eWxlPSJvcGFjaXR5Oi43Ij5AJyArIGVzYyh1',
  'LnVzZXJuYW1lKSArICc8L3NwYW4+JyA6ICcnKSArCiAgICAnPGJyPjxzcGFuIHN0eWxlPSJvcGFjaXR5Oi44Ij4nICsgZXNjKHUucm9sZSAmJiB1LnJvbGUgIT09ICdub25lJyA/IHUucm9sZSA6IHUudmlhIHx8ICcnKSArICc8L3NwYW4+JyArCiAgICAoYi5zaGVl',
  'dFVybCA/ICc8YnI+PGEgaHJlZj0iJyArIGIuc2hlZXRVcmwgKyAnIiB0YXJnZXQ9Il9ibGFuayI+4LmA4Lib4Li04LiUIEdvb2dsZSBTaGVldCDihpc8L2E+JyA6ICcnKSArCiAgICAodS5zaWduZWRJbiAmJiB1LnVzZXJuYW1lCiAgICAgID8gJzxicj48YSBocmVm',
  'PSJqYXZhc2NyaXB0OnZvaWQoMCkiIG9uY2xpY2s9ImNvbmZpcm1Mb2dvdXQoKSI+4Lit4Lit4LiB4LiI4Liy4LiB4Lij4Liw4Lia4LiaPC9hPicKICAgICAgOiAnJyk7Cn0KCmZ1bmN0aW9uIHJlbmRlck5hdigpewogIHZhciBodG1sID0gJyc7CiAgUEFHRVMuZm9y',
  'RWFjaChmdW5jdGlvbihwKXsKICAgIGlmIChwLnNlYykgaHRtbCArPSAnPGRpdiBjbGFzcz0ibmF2LXNlYyI+JyArIHAuc2VjICsgJzwvZGl2Pic7CiAgICBodG1sICs9ICc8YnV0dG9uIGNsYXNzPSJuYXYtaXRlbSIgaWQ9Im5hdi0nICsgcC5pZCArICciIG9uY2xp',
  'Y2s9ImdvKFwnJyArIHAuaWQgKyAnXCcpIj4nICsKICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9ImljIj4nICsgcC5pYyArICc8L3NwYW4+PHNwYW4+JyArIHAubGFiZWwgKyAnPC9zcGFuPicgKwogICAgICAgICAgICAgICc8c3BhbiBjbGFzcz0iYmFkZ2UiIGlk',
  'PSJiYWRnZS0nICsgcC5pZCArICciIHN0eWxlPSJkaXNwbGF5Om5vbmUiPjwvc3Bhbj4nICsKICAgICAgICAgICAgJzwvYnV0dG9uPic7CiAgfSk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdkxpc3QnKS5pbm5lckhUTUwgPSBodG1sOwogIHJlbmRlclRh',
  'YnMoKTsKfQoKLyoqCiAqIOC5geC4luC4muC4peC5iOC4suC4h+C4quC4s+C4q+C4o+C4seC4muC4oeC4t+C4reC4luC4t+C4rSDigJQg4LmD4LiK4LmJIFBBR0VTIOC4iuC4uOC4lOC5gOC4lOC4teC4ouC4p+C4geC4seC4muC5gOC4oeC4meC4ueC4guC5ieC4suC4',
  'hyDguYHguKXguLDguYDguKPguLXguKLguIEgZ28oKSDguJXguLHguKfguYDguJTguLXguKLguKfguIHguLHguJkKICog4LmE4Lih4LmI4LmE4LiU4LmJ4LmA4Lib4LmH4LiZ4Lir4LiZ4LmJ4Liy4LiI4Lit4LiE4LiZ4Lil4Liw4LiK4Li44LiUIOC5gOC4m+C5h+C4',
  'meC5geC4hOC5iOC4l+C4teC5iOC4p+C4suC4h+C4m+C4uOC5iOC4oeC4reC4teC4geC4l+C4teC5iOC4q+C4meC4tuC5iOC4h+C4guC4reC4h+C4guC5ieC4reC4oeC4ueC4peC5gOC4lOC4tOC4oQogKiDguJvguLjguYjguKHguKrguLjguJTguJfguYnguLLguKLg',
  'uYDguJvguLTguJTguKXguLTguYnguJnguIrguLHguIHguYDguKHguJnguLnguYDguJTguLTguKEg4LiI4Liw4LmE4LiU4LmJ4LmA4LiC4LmJ4Liy4LiW4Li24LiH4Lir4LiZ4LmJ4Liy4LiX4Li14LmI4LmA4Lir4Lil4Li34Lit4LmE4LiU4LmJ4LiE4Lij4LiaCiAq',
  'LwpmdW5jdGlvbiByZW5kZXJUYWJzKCl7CiAgdmFyIGJhciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YWJCYXInKTsKICBpZiAoIWJhcikgcmV0dXJuOwogIHZhciBodG1sID0gUEFHRVMuZmlsdGVyKGZ1bmN0aW9uKHApeyByZXR1cm4gcC50YWI7IH0pLm1h',
  'cChmdW5jdGlvbihwKXsKICAgIHJldHVybiAnPGJ1dHRvbiBjbGFzcz0idGFiIiBpZD0idGFiLScgKyBwLmlkICsgJyIgb25jbGljaz0iZ28oXCcnICsgcC5pZCArICdcJykiIGFyaWEtbGFiZWw9IicgKyBlc2MocC5sYWJlbCkgKyAnIj4nICsKICAgICAgICAgICAg',
  'ICc8c3BhbiBjbGFzcz0iaWMiPicgKyBwLmljICsgJzwvc3Bhbj48c3BhbiBjbGFzcz0idGwiPicgKyBlc2MocC50YWIpICsgJzwvc3Bhbj4nICsKICAgICAgICAgICAgICc8c3BhbiBjbGFzcz0iYmFkZ2UiIGlkPSJ0YWJiYWRnZS0nICsgcC5pZCArICciIHN0eWxl',
  'PSJkaXNwbGF5Om5vbmUiPjwvc3Bhbj4nICsKICAgICAgICAgICAnPC9idXR0b24+JzsKICB9KS5qb2luKCcnKTsKICBiYXIuaW5uZXJIVE1MID0gaHRtbCArCiAgICAnPGJ1dHRvbiBjbGFzcz0idGFiIiBpZD0idGFiLW1vcmUiIG9uY2xpY2s9InRvZ2dsZU5hdigp',
  'IiBhcmlhLWxhYmVsPSLguYDguKHguJnguLnguJfguLHguYnguIfguKvguKHguJQiPicgKwogICAgICAnPHNwYW4gY2xhc3M9ImljIj7imLA8L3NwYW4+PHNwYW4gY2xhc3M9InRsIj7guYDguJ7guLTguYjguKHguYDguJXguLTguKE8L3NwYW4+JyArCiAgICAgICc8',
  'c3BhbiBjbGFzcz0iYmFkZ2UiIGlkPSJ0YWJiYWRnZS1tb3JlIiBzdHlsZT0iZGlzcGxheTpub25lIj48L3NwYW4+JyArCiAgICAnPC9idXR0b24+JzsKfQoKZnVuY3Rpb24gZ28ocGFnZSl7CiAgUy5wYWdlID0gcGFnZTsKICBTLnBhcmFtcyA9IHt9OwogIGxvY2F0',
  'aW9uLmhhc2ggPSBwYWdlOwogIHZhciBtZXRhID0gUEFHRVMuZmlsdGVyKGZ1bmN0aW9uKHApe3JldHVybiBwLmlkPT09cGFnZTt9KVswXSB8fCBQQUdFU1swXTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFnZVRpdGxlJykudGV4dENvbnRlbnQgPSBtZXRh',
  'LmxhYmVsOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlU3ViJykudGV4dENvbnRlbnQgPSBtZXRhLnN1YjsKICBQQUdFUy5mb3JFYWNoKGZ1bmN0aW9uKHApewogICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdi0nICsgcC5pZCk7',
  'CiAgICBpZiAoZWwpIGVsLmNsYXNzTGlzdC50b2dnbGUoJ29uJywgcC5pZCA9PT0gcGFnZSk7CiAgICB2YXIgdGFiID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhYi0nICsgcC5pZCk7CiAgICBpZiAodGFiKSB0YWIuY2xhc3NMaXN0LnRvZ2dsZSgnb24nLCBw',
  'LmlkID09PSBwYWdlKTsKICB9KTsKICAvLyDguKvguJnguYnguLLguJfguLXguYjguYTguKHguYjguKHguLXguYHguJfguYfguJrguILguK3guIfguJXguLHguKfguYDguK3guIcg4LmD4Lir4LmJ4Lib4Li44LmI4LihICLguYDguJ7guLTguYjguKHguYDguJXguLTg',
  'uKEiIOC4quC4p+C5iOC4suC4h+C5geC4l+C4mSDguIjguLDguYTguJTguYnguKPguLnguYnguKfguYjguLLguK3guKLguLnguYjguJXguKPguIfguYTguKvguJkKICB2YXIgbW9yZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YWItbW9yZScpOwogIGlmICht',
  'b3JlKSBtb3JlLmNsYXNzTGlzdC50b2dnbGUoJ29uJywgIVBBR0VTLnNvbWUoZnVuY3Rpb24ocCl7IHJldHVybiBwLnRhYiAmJiBwLmlkID09PSBwYWdlOyB9KSk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdicpLmNsYXNzTGlzdC5yZW1vdmUoJ29wZW4n',
  'KTsKICByZW1vdmVTY3JpbSgpOwogIGxvYWQoKTsKfQoKZnVuY3Rpb24gcmVmcmVzaCgpeyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7IH0KCmZ1bmN0aW9uIHNldFllYXIoeSl7CiAgUy55ZWFyID0geTsKICBsb2FkKCk7Cn0KCi8qKgogKiDguYLguKvguKXguJTguILg',
  'uYnguK3guKHguLnguKXguILguK3guIfguKvguJnguYnguLLguJvguLHguIjguIjguLjguJrguLHguJkKICoKICogQHBhcmFtIHt7cXVpZXQ6Ym9vbGVhbn09fSBvcHRzCiAqICAgcXVpZXQgPSDguIvguLTguIfguIHguYzguYDguIfguLXguKLguJog4LmGIOC5gOC4',
  'muC4t+C5ieC4reC4h+C4q+C4peC4seC4hyDguYTguKHguYjguKXguYnguLLguIfguKvguJnguYnguLLguYDguJvguYfguJnguKfguIfguIHguKXguKHguKvguKHguLjguJkg4LmB4Lil4Liw4LiE4Li34LiZ4LiV4Liz4LmB4Lir4LiZ4LmI4LiH4LiX4Li14LmI4LmA',
  '4Lil4Li34LmI4Lit4LiZ4LiE4LmJ4Liy4LiH4LmE4Lin4LmJCiAqICAgICAgICAgICDguYPguIrguYnguKvguKXguLHguIfguIHguJTguJrguLHguJnguJfguLbguIEg4LmB4Lil4Liw4LiV4Lit4LiZ4Lie4Lia4Lin4LmI4Liy4Lih4Li14LiE4LiZ4LmB4LiB4LmJ',
  '4LiC4LmJ4Lit4Lih4Li54Lil4LiI4Liy4LiB4LiX4Li14LmI4Lit4Li34LmI4LiZCiAqICAgICAgICAgICDguYDguJ7guLfguYjguK3guYPguKvguYnguKvguJnguYnguLLguIjguK3guJnguLTguYjguIfguJfguLXguYjguKrguLjguJQg4LmE4Lih4LmI4LiB4Lij',
  '4Liw4Lie4Lij4Li04Lia4LmB4Lil4Liw4LmE4Lih4LmI4LmA4LiU4LmJ4LiH4LiB4Lil4Lix4Lia4LmE4Lib4Lia4LiZ4Liq4Li44LiUCiAqLwpmdW5jdGlvbiBsb2FkKG9wdHMpewogIG9wdHMgPSAob3B0cyA9PT0gdHJ1ZSkgPyB7fSA6IChvcHRzIHx8IHt9KTsg',
  'ICAgIC8vIOC5gOC4nOC4t+C5iOC4reC5guC4hOC5ieC4lOC5gOC4geC5iOC4suC4l+C4teC5iOC5gOC4o+C4teC4ouC4gSBsb2FkKHRydWUpCiAgdmFyIHF1aWV0ID0gISFvcHRzLnF1aWV0OwogIHZhciB2aWV3ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Zp',
  'ZXcnKTsKICB2YXIgciA9IFJPVVRFU1tTLnBhZ2VdOwogIGlmICghcikgeyB2aWV3LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4LmE4Lih4LmI4Lie4Lia4Lir4LiZ4LmJ4Liy4LiZ4Li14LmJPC9kaXY+JzsgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgp',
  'OyB9CgogIGlmICghcXVpZXQpIHsKICAgIHZpZXcuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPjxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+PC9kaXY+4LiB4Liz4Lil4Lix4LiH4LmC4Lir4Lil4LiU4LiC4LmJ4Lit4Lih',
  '4Li54Lil4oCmPC9kaXY+JzsKICB9IGVsc2UgewogICAgc3luY1NldCgnc3luY2luZycpOwogIH0KCiAgdmFyIGtlZXAgPSBxdWlldCA/IHNuYXBzaG90VmlldygpIDogbnVsbDsKCiAgcmV0dXJuIHIubG9hZCgpLnRoZW4oZnVuY3Rpb24oZGF0YSl7CiAgICBTLmNh',
  'Y2hlW1MucGFnZV0gPSBkYXRhOwoKICAgIC8vIOC4q+C4meC5ieC4suC5geC4leC5iOC4peC4sOC4q+C4meC5ieC4suC4oeC4teC4m+C4teC5g+C4q+C5ieC5gOC4peC4t+C4reC4geC5hOC4oeC5iOC5gOC4l+C5iOC4suC4geC4seC4mSAo4LmA4LiK4LmI4LiZ4LiL',
  '4Li34LmJ4Lit4LiC4Lit4LiH4Lih4Li14LiW4Li24LiH4Lib4Li1IDI1NjMg4LmB4LiV4LmI4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4ouC4oeC4teC5geC4hOC5iOC4m+C4teC4peC5iOC4suC4quC4uOC4lCkKICAgIC8vIOC4luC5ieC4',
  'suC4m+C4teC4l+C4teC5iOC4hOC5ieC4suC4h+C4reC4ouC4ueC5iOC5hOC4oeC5iOC4oeC4teC5g+C4meC4q+C4meC5ieC4suC4meC4teC5iSBzeW5jWWVhck9wdGlvbnMg4LiI4Liw4Lib4Lij4Lix4Lia4Lib4Li14LmD4Lir4LmJIOKAlCDguYHguJXguYjguILg',
  'uYnguK3guKHguLnguKXguJfguLXguYjguYDguJ7guLTguYjguIfguJTguLbguIfguKHguLIKICAgIC8vIOC5gOC4m+C5h+C4meC4guC4reC4h+C4m+C4teC5gOC4geC5iOC4siDguKrguYjguKfguJnguJvguYnguLLguKLguIHguLPguIHguLHguJrguYPguIrguYng',
  'uJvguLXguYPguKvguKHguYgg4LiB4Lil4Liy4Lii4LmA4Lib4LmH4LiZ4Lia4Lit4LiB4Lin4LmI4LiyICLguKLguK3guJTguIvguLfguYnguK0g4Lib4Li1IDIwMjYgPSAwIOC4muC4suC4lyIKICAgIC8vIOC4l+C4seC5ieC4h+C4l+C4teC5iOC4m+C4teC4meC4',
  'seC5ieC4meC4oeC4teC4ouC4reC4lOC4iOC4o+C4tOC4hyDigJQg4LiV4LmJ4Lit4LiH4LiU4Li24LiH4LmD4Lir4Lih4LmI4LmD4Lir4LmJ4LiV4Lij4LiH4LiB4Lix4Lia4Lib4Li14LiX4Li14LmI4Lib4Lij4Lix4Lia4LmB4Lil4LmJ4LinCiAgICB2YXIgeWVh',
  'ckJlZm9yZSA9IFN0cmluZyhTLnllYXIpOwogICAgc3luY1llYXJPcHRpb25zKGRhdGEueWVhcnMgfHwgZGF0YS5hdmFpbGFibGUgfHwgW10pOwogICAgaWYgKFN0cmluZyhTLnllYXIpICE9PSB5ZWFyQmVmb3JlICYmICFvcHRzLl9yZXRyaWVkKSB7CiAgICAgIHJl',
  'dHVybiBsb2FkKHsgcXVpZXQ6IHF1aWV0LCBfcmV0cmllZDogdHJ1ZSB9KTsKICAgIH0KCiAgICB2aWV3LmlubmVySFRNTCA9IHIucmVuZGVyKGRhdGEpOwogICAgbGFiZWxDZWxscyh2aWV3KTsKICAgIGFwcGx5UmVhZE9ubHkodmlldyk7CiAgICBpZiAoci5hZnRl',
  'cikgci5hZnRlcihkYXRhKTsKICAgIGlmIChrZWVwKSByZXN0b3JlVmlldyhrZWVwKTsKICAgIGlmIChxdWlldCkgc3luY1NldCgnc3luY2VkJyk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICBpZiAocXVpZXQpIHsgICAgICAgICAgICAgICAgICAgICAgIC8v',
  'IOC4i+C4tOC4h+C4geC5jOC5gOC4muC4t+C5ieC4reC4h+C4q+C4peC4seC4h+C4nuC4peC4suC4lCDigJQg4Lit4Lii4LmI4Liy4LiX4Li04LmJ4LiH4LiC4Lit4LiH4LiX4Li14LmI4LmA4Lir4LmH4LiZ4Lit4Lii4Li54LmICiAgICAgIHN5bmNTZXQoaXNPZmZs',
  'aW5lRXJyb3IoZSkgPyAnb2ZmbGluZScgOiAnZXJyb3InLCBlLm1lc3NhZ2UgfHwgZSk7CiAgICAgIHJldHVybjsKICAgIH0KICAgIHZpZXcuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9ImNhcmQiPjxkaXYgY2xhc3M9ImNhcmQtYiI+PGgzPuC5guC4q+C4peC4lOC4',
  'guC5ieC4reC4oeC4ueC4peC5hOC4oeC5iOC4quC4s+C5gOC4o+C5h+C4iDwvaDM+JyArCiAgICAgICAgICAgICAgICAgICAgICc8cCBjbGFzcz0ibXV0ZWQiPicgKyBlc2MoZS5tZXNzYWdlfHxlKSArICc8L3A+JyArCiAgICAgICAgICAgICAgICAgICAgICc8YnV0',
  'dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImxvYWQoKSI+4Lil4Lit4LiH4LmD4Lir4Lih4LmIPC9idXR0b24+PC9kaXY+PC9kaXY+JzsKICB9KTsKfQoKLyoqIOC4iOC4s+C4quC4oOC4suC4nuC4q+C4meC5ieC4suC4iOC4reC5hOC4p+C5ieC4geC5iOC4reC4meC4',
  'p+C4suC4lOC5g+C4q+C4oeC5iCDguYDguJ7guLfguYjguK3guYPguKvguYnguJzguLnguYnguYPguIrguYnguKPguLnguYnguKrguLbguIHguKfguYjguLLguKvguJnguYnguLLguYTguKHguYjguYTguJTguYnguJbguLnguIHguYLguKvguKXguJTguYPguKvguKHg',
  'uYggKi8KZnVuY3Rpb24gc25hcHNob3RWaWV3KCl7CiAgdmFyIG9wZW4gPSBbXTsKICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYmlsbC1saW5lcycpLmZvckVhY2goZnVuY3Rpb24oZWwpewogICAgaWYgKCFlbC5oaWRkZW4pIG9wZW4ucHVzaChlbC5pZCk7',
  'CiAgfSk7CiAgcmV0dXJuIHsgeTogd2luZG93LnNjcm9sbFkgfHwgMCwgb3Blbjogb3BlbiB9Owp9CgpmdW5jdGlvbiByZXN0b3JlVmlldyhrZWVwKXsKICBrZWVwLm9wZW4uZm9yRWFjaChmdW5jdGlvbihpZCl7CiAgICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVt',
  'ZW50QnlJZChpZCk7CiAgICBpZiAoZWwpIHsgZWwuaGlkZGVuID0gZmFsc2U7IHZhciBiID0gZWwucHJldmlvdXNFbGVtZW50U2libGluZzsKICAgICAgICAgICAgICBpZiAoYikgYi50ZXh0Q29udGVudCA9IGIudGV4dENvbnRlbnQucmVwbGFjZSgn4pa+JywgJ+KW',
  'tCcpOyB9CiAgfSk7CiAgaWYgKGtlZXAueSkgd2luZG93LnNjcm9sbFRvKDAsIGtlZXAueSk7Cn0KCi8qKiDguYDguJXguLTguKHguJXguLHguKfguYDguKXguLfguK3guIHguJvguLXguYPguJnguYHguJbguJrguJrguJnguYPguKvguYnguJXguKPguIfguIHguLHg',
  'uJrguILguYnguK3guKHguLnguKXguIjguKPguLTguIfguILguK3guIfguKvguJnguYnguLLguJnguLHguYnguJkgKi8KZnVuY3Rpb24gc3luY1llYXJPcHRpb25zKHllYXJzKXsKICB2YXIgc2VsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3llYXJTZWwnKTsK',
  'ICB2YXIgbGlzdCA9ICh5ZWFycyB8fCBbXSkuc2xpY2UoKS5zb3J0KGZ1bmN0aW9uKGEsYil7cmV0dXJuIGItYTt9KTsKICB2YXIgY3VyID0gbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpOwogIGlmIChsaXN0LmluZGV4T2YoY3VyKSA8IDApIGxpc3QudW5zaGlmdChj',
  'dXIpOwogIHZhciBodG1sID0gJzxvcHRpb24gdmFsdWU9ImFsbCI+4LiX4Li44LiB4Lib4Li1PC9vcHRpb24+JzsKICBsaXN0LmZvckVhY2goZnVuY3Rpb24oeSl7CiAgICAvLyDguITguYjguLLguYPguJkgb3B0aW9uIOC5gOC4m+C5h+C4mSDguIQu4LioLiDguYDg',
  'uKrguKHguK0gKOC4l+C4seC5ieC4h+C4o+C4sOC4muC4muC5g+C4iuC5ieC4m+C4teC4meC4teC5ieC4reC5ieC4suC4h+C4reC4tOC4hykg4Liq4LmI4Lin4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LmB4Lil4LmJ4Lin4LmB4LiV4LmI4LiX4Li14LmI4LiV4Lix',
  '4LmJ4LiH4LmE4Lin4LmJCiAgICBodG1sICs9ICc8b3B0aW9uIHZhbHVlPSInICsgeSArICciPuC4m+C4tSAnICsgZGlzcGxheVllYXIoeSkgKwogICAgICAgICAgICAodXNlQnVkZGhpc3RZZWFyKCkgPyAnICjguIQu4LioLiAnICsgeSArICcpJyA6ICcnKSArICc8',
  'L29wdGlvbj4nOwogIH0pOwogIHNlbC5pbm5lckhUTUwgPSBodG1sOwogIGlmIChsaXN0LmluZGV4T2YoTnVtYmVyKFMueWVhcikpIDwgMCAmJiBTLnllYXIgIT09ICdhbGwnKSBTLnllYXIgPSBTdHJpbmcoY3VyKTsKICBzZWwudmFsdWUgPSBTLnllYXI7Cn0KCi8q',
  'IC0tLS0tLS0tLS0tLS0tLS0g4LmC4Lir4Lih4LiU4LiU4Li54Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinIC0tLS0tLS0tLS0tLS0tLS0KICAg4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4LiB4Lix4LiZ4LmE4Lin4LmJ',
  '4LmB4Lil4LmJ4Lin4LmD4LiZ4Lif4Lix4LiH4LiB4LmM4LiK4Lix4LiZIGFwaSgpIOC4leC4o+C4h+C4meC4teC5ieC5geC4hOC5iOC4i+C5iOC4reC4meC4m+C4uOC5iOC4oeC4l+C4teC5iOC4geC4lOC5hOC4m+C4geC5h+C4l+C4s+C5hOC4oeC5iOC5hOC4lOC5',
  'iQogICDguYDguJ7guLfguYjguK3guYTguKHguYjguYPguKvguYnguJzguLnguYnguJfguLXguYjguYDguJvguLTguJTguJTguYnguKfguKLguKXguLTguIfguIHguYzguYHguIrguKPguYzguKrguLHguJrguKrguJkgKi8KdmFyIEVESVRfRU5UUllQT0lOVFMgPSAv',
  'XGIoZm9ybURlYnR8Zm9ybURlYnRQYXltZW50fGZvcm1QdXJjaGFzZXxmb3JtQWN8Zm9ybUJ1bGtBY3xmb3JtUmVwYWlyfGZvcm1CdWlsZGluZ3xmb3JtUm9vbXxmb3JtRmluYW5jZXxmb3JtVXNlcnxkZWxEZWJ0fGRlbERlYnRQYXltZW50fGRlbFB1cmNoYXNlfGRl',
  'bEFjfGRlbFJlcGFpcnxkZWxCdWlsZGluZ3xkZWxGaW5hbmNlfGRlbFVzZXJ8ZG9JbXBvcnRKc29ufGRvUm90YXRlU2hhcmV8ZG9CYWNrdXBOb3d8c2F2ZVNldHRpbmdzRm9ybSlccypcKC87CgpmdW5jdGlvbiBhcHBseVJlYWRPbmx5KHJvb3QpewogIGlmIChjYW5F',
  'ZGl0KCkpIHJldHVybjsKICB2YXIgbm9kZXMgPSByb290LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tvbmNsaWNrXScpOwogIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHsKICAgIGlmIChFRElUX0VOVFJZUE9JTlRTLnRlc3Qobm9kZXNbaV0uZ2V0',
  'QXR0cmlidXRlKCdvbmNsaWNrJykgfHwgJycpKSBub2Rlc1tpXS5yZW1vdmUoKTsKICB9Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4Lij4Li14LmA4Lif4Lij4LiK4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li04LmA4Lih4Li34LmI4Lit4LiC4LmJ4Lit4Lih4Li5',
  '4Lil4LmD4LiZ4LiK4Li14LiV4LmA4Lib4Lil4Li14LmI4Lii4LiZIC0tLS0tLS0tLS0tLS0tLS0KCiAgIOC4geC4juC5gOC4q+C4peC5h+C4geC4guC4reC4h+C4quC5iOC4p+C4meC4meC4teC5iTog4Lir4LmJ4Liy4Lih4LmC4Lir4Lil4LiU4LiX4Lix4Lia4Liq',
  '4Li04LmI4LiH4LiX4Li14LmI4Lic4Li54LmJ4LmD4LiK4LmJ4LiB4Liz4Lil4Lix4LiH4Lie4Li04Lih4Lie4LmM4Lit4Lii4Li54LmI4LmA4LiU4LmH4LiU4LiC4Liy4LiUCiAgIOC4luC5ieC4suC4oeC4teC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C4oeC5iOC4',
  'leC4reC4meC4l+C4teC5iOC4nOC4ueC5ieC5g+C4iuC5ieC4geC4s+C4peC4seC4h+C4geC4o+C4reC4geC4reC4ouC4ueC5iCDguYPguKvguYnguILguLbguYnguJnguJvguLjguYjguKHguYDguKXguYfguIEg4LmGIOC5g+C4q+C5ieC4geC4lOC5gOC4reC4h+C5',
  'gOC4oeC4t+C5iOC4reC4nuC4o+C5ieC4reC4oQoKICAg4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4OiDguKPguLjguYjguJnguILguYnguK3guKHguLnguKXguJTguLnguIjguLLguIEgIuC5gOC4p+C4peC4suC4l+C4teC5iOC4iuC4teC4leC4luC4ueC4geC5geC4',
  'geC5ieC4peC5iOC4suC4quC4uOC4lCIg4LiC4Lit4LiHIEdvb2dsZSBEcml2ZQogICDguIvguLbguYjguIfguILguKLguLHguJrguJfguLjguIHguITguKPguLHguYnguIfguJfguLXguYjguKHguLXguIHguLLguKPguYDguILguLXguKLguJkg4Lij4Lin4Lih4LiW',
  '4Li24LiH4LiV4Lit4LiZ4LiX4Li14LmI4LmA4Lij4Liy4LmA4Lit4LiH4LiB4LiU4Lia4Lix4LiZ4LiX4Li24LiB4LiU4LmJ4Lin4LiiCiAgIOC4iOC4tuC4h+C4leC5ieC4reC4h+C4iOC4lOC4o+C4uOC5iOC4meC5g+C4q+C4oeC5iOC5hOC4p+C5ieC4q+C4peC4',
  'seC4h+C4muC4seC4meC4l+C4tuC4geC4l+C4uOC4geC4hOC4o+C4seC5ieC4hyDguYTguKHguYjguIfguLHguYnguJnguIjguLDguYLguKvguKXguJTguIvguYnguLPguYHguKXguLDguILguLbguYnguJnguILguYnguK3guITguKfguLLguKEKICAg4Lin4LmI4Liy',
  'ICLguKHguLXguITguJnguYHguIHguYnguILguYnguK3guKHguLnguKUiIOC4l+C4seC5ieC4h+C4l+C4teC5iOC4hOC4meC5geC4geC5ieC4hOC4t+C4reC4nOC4ueC5ieC5g+C4iuC5ieC5gOC4reC4hwotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0t',
  'LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKiDguITguLPguKrguLHguYjguIfguJfguLXguYjguJfguLPguYPguKvguYnguILguYnguK3guKHguLnguKXguYPguJnguIrguLXguJXguYDguJvguKXguLXguYjguKLguJkgKOC5g+C4q+C5ieC4',
  'leC4o+C4h+C4geC4seC4miBNVVRBVElOR19BQ1RJT05TIOC4neC4seC5iOC4h+C5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jCkgKi8KdmFyIENMSUVOVF9NVVRBVElORyA9IC9cLihzYXZlfGRlbGV0ZXxzYXZlUGF5bWVudHxkZWxldGVQYXltZW50fGJ1',
  'bGtCb29rfGltcG9ydHxyb3RhdGVUb2tlbnxiYWNrdXBOb3d8dXBsb2FkfHRyYXNofHRvZ2dsZXxzZXRTdGF0dXN8cmVjb25jaWxlKSQvOwoKLyoqCiAqIOC5gOC4nuC4tOC5iOC4h+C4geC4lOC4muC4seC4meC4l+C4tuC4geC5gOC4reC4hyDigJQg4Lir4LiZ4LmJ',
  '4Liy4LmC4Lir4Lil4LiU4LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmI4LmE4Lib4LmB4Lil4LmJ4Lin4LiV4Lit4LiZ4LiB4LiU4Lia4Lix4LiZ4LiX4Li24LiBCiAqIOC4iOC4lOC4o+C4uOC5iOC4meC4guC5ieC4reC4oeC4ueC4peC4peC5iOC4suC4quC4',
  'uOC4lOC5hOC4p+C5iSDguYHguKXguLDguIHguLHguJnguYTguKHguYjguYPguKvguYnguKPguK3guJrguJXguKPguKfguIjguJbguLHguJTguYTguJvguYLguKvguKXguJTguIvguYnguLMKICogKOC5gOC4nOC4t+C5iOC4reC5hOC4p+C5iSAyIOC4meC4suC4l+C4',
  'tSDguYDguJ7guKPguLLguLAgR29vZ2xlIERyaXZlIOC4reC4seC4m+C5gOC4lOC4leC5gOC4p+C4peC4suC5geC4geC5ieC5hOC4guC4iuC5ieC4suC4geC4p+C5iOC4suC4geC4suC4o+C5gOC4guC4teC4ouC4meC4iOC4o+C4tOC4h+C5gOC4peC5h+C4geC4meC5',
  'ieC4reC4oikKICovCmZ1bmN0aW9uIG1hcmtTZWxmQ2hhbmdlKCl7CiAgUy5zZWxmQ2hhbmdlVW50aWwgPSBEYXRlLm5vdygpICsgMTIwMDAwOwogIGNsZWFyVGltZW91dChTLnN5bmNUaW1lcik7CiAgUy5zeW5jVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7',
  'CiAgICBzeW5jVmVyc2lvbigpOwogICAgcmVmcmVzaEFsZXJ0cygpOyAgICAgLy8g4LiH4Liy4LiZ4LiE4LmJ4Liy4LiH4Lit4Liy4LiI4LmA4Lie4Li04LmI4Lih4Lir4Lij4Li34Lit4Lil4LiU4LiI4Liy4LiB4Liq4Li04LmI4LiH4LiX4Li14LmI4LmA4Lie4Li0',
  '4LmI4LiH4Lia4Lix4LiZ4LiX4Li24LiB4LmE4LibCiAgfSwgMTUwMCk7Cn0KCmZ1bmN0aW9uIHN5bmNWZXJzaW9uKCl7CiAgY2FsbEFwaSgnYXBwLnZlcnNpb24nKQogICAgLnRoZW4oZnVuY3Rpb24odil7IGlmICh2ICYmIHYudmVyc2lvbikgUy52ZXJzaW9uID0g',
  'di52ZXJzaW9uOyB9KQogICAgLmNhdGNoKGZ1bmN0aW9uKCl7IC8qIOC5hOC4p+C5ieC4o+C4reC4muC4q+C4meC5ieC4siAqLyB9KTsKfQoKLyoqIOC4nOC4ueC5ieC5g+C4iuC5ieC4geC4s+C4peC4seC4h+C4geC4o+C4reC4geC4guC5ieC4reC4oeC4ueC4peC4',
  'reC4ouC4ueC5iOC4q+C4o+C4t+C4reC5gOC4m+C4peC5iOC4siDigJQg4LiW4LmJ4Liy4LmD4LiK4LmIIOC4q+C5ieC4suC4oeC5guC4q+C4peC4lOC4l+C4seC4miAqLwpmdW5jdGlvbiB1c2VySXNCdXN5KCl7CiAgdmFyIG1vZGFsID0gZG9jdW1lbnQuZ2V0RWxl',
  'bWVudEJ5SWQoJ21vZGFsUm9vdCcpOwogIGlmIChtb2RhbCAmJiBtb2RhbC5pbm5lckhUTUwpIHJldHVybiB0cnVlOyAgICAgICAgICAgICAgLy8g4Lif4Lit4Lij4LmM4Lih4LmA4Lib4Li04LiU4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmICiAgdmFyIGVsID0gZG9j',
  'dW1lbnQuYWN0aXZlRWxlbWVudDsKICBpZiAoZWwgJiYgL14oSU5QVVR8VEVYVEFSRUF8U0VMRUNUKSQvLnRlc3QoZWwudGFnTmFtZSkgJiYKICAgICAgZWwudHlwZSAhPT0gJ2J1dHRvbicgJiYgZWwudHlwZSAhPT0gJ3N1Ym1pdCcpIHJldHVybiB0cnVlOyAgIC8v',
  'IOC5gOC4hOC4reC4o+C5jOC5gOC4i+C4reC4o+C5jOC4reC4ouC4ueC5iOC5g+C4meC4iuC5iOC4reC4h+C4geC4o+C4reC4gQogIHJldHVybiBmYWxzZTsKfQoKZnVuY3Rpb24gcmVmcmVzaExhYmVsKHNlYyl7CiAgaWYgKCFzZWMpIHJldHVybiAn4Lib4Li04LiU',
  '4LiB4Liy4Lij4LiV4Lij4Lin4LiI4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0JzsKICBpZiAoc2VjICUgMzYwMCA9PT0gMCkgcmV0dXJuICfguJXguKPguKfguIjguILguYnguK3guKHguLnguKXguYPguKvguKHguYjguJfguLjguIEgJyArIChzZWMgLyAzNjAw',
  'KSArICcg4LiK4Lix4LmI4Lin4LmC4Lih4LiHJzsKICBpZiAoc2VjICUgNjAgPT09IDApIHJldHVybiAn4LiV4Lij4Lin4LiI4LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmI4LiX4Li44LiBICcgKyAoc2VjIC8gNjApICsgJyDguJnguLLguJfguLUnOwogIHJl',
  'dHVybiAn4LiV4Lij4Lin4LiI4LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmI4LiX4Li44LiBICcgKyBzZWMgKyAnIOC4p+C4tOC4meC4suC4l+C4tSc7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4LiV4Lix4Lin4Lia4Lit4LiB4Liq4LiW4Liy4LiZ4Liw4LiB',
  '4Liy4Lij4LiL4Li04LiH4LiB4LmMICjguKHguLjguKHguILguKfguLLguJrguJkpIC0tLS0tLS0tLS0tLS0tLS0KCiAgIOC4q+C4meC5ieC4suC4l+C4teC5iDog4Lia4Lit4LiB4LmD4Lir4LmJ4Lij4Li54LmJ4LiV4Lil4Lit4LiU4Lin4LmI4Liy4LiV4Lit4LiZ',
  '4LiZ4Li14LmJ4LiC4LmJ4Lit4Lih4Li54Lil4LiV4Lij4LiH4LiB4Lix4Lia4Lir4Lil4Lix4LiH4Lia4LmJ4Liy4LiZ4Lir4Lij4Li34Lit4Lii4Lix4LiHCiAgIOC4geC4s+C4peC4seC4h+C4muC4seC4meC4l+C4tuC4geC4reC4ouC4ueC5iOC5hOC4q+C4oSDg',
  'uKvguKPguLfguK3guKHguLXguK3guLDguYTguKPguITguYnguLLguIfguJfguLXguYjguJXguYnguK3guIfguIjguLHguJTguIHguLLguKMKCiAgIOC4leC4seC5ieC4h+C5g+C4iOC5g+C4q+C5iSAi4LmA4LiH4Li14Lii4Lia4LmA4Lih4Li34LmI4Lit4LiX4Li4',
  '4LiB4Lit4Lii4LmI4Liy4LiH4Lib4LiB4LiV4Li0IOC5geC4peC4sOC4iuC4seC4lOC5gOC4iOC4meC5gOC4oeC4t+C5iOC4reC4oeC4teC4reC4sOC5hOC4o+C4nOC4tOC4lOC4m+C4geC4leC4tCIKICAg4Liq4LiW4Liy4LiZ4Liw4LiX4Li14LmI4LiV4LmJ4Lit',
  '4LiH4LmD4Lir4LmJ4Lic4Li54LmJ4LmD4LiK4LmJ4LiX4Liz4Lit4Liw4LmE4Lij4LiV4LmI4LitICjguKHguLXguILguYnguK3guKHguLnguKXguYPguKvguKHguYggLyDguYDguIrguLfguYjguK3guKHguJXguYjguK3guYTguKHguYjguYTguJTguYkpIOC4geC4',
  'lOC5hOC4lOC5iQotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi8KCnZhciBTWU5DID0geyBzdGF0ZTogJ3N5bmNlZCcsIGRldGFpbDogJycsIGF0OiAwLCB0aW1lcjogbnVsbCB9OwoKdmFy',
  'IFNZTkNfTE9PSyA9IHsKICBzeW5jZWQ6ICB7IGNsczogJ29rJywgICBpY29uOiAn4pePJywgIHRleHQ6ICfguIvguLTguIfguIHguYzguYHguKXguYnguKcnIH0sCiAgc3luY2luZzogeyBjbHM6ICdpbmZvJywgaWNvbjogJycsICAgdGV4dDogJ+C4geC4s+C4peC4',
  'seC4h+C4i+C4tOC4h+C4geC5jOKApicsICAgc3BpbjogdHJ1ZSB9LAogIHNhdmluZzogIHsgY2xzOiAnaW5mbycsIGljb246ICcnLCAgIHRleHQ6ICfguIHguLPguKXguLHguIfguJrguLHguJnguJfguLbguIHigKYnLCAgc3BpbjogdHJ1ZSB9LAogIHNhdmVkOiAg',
  'IHsgY2xzOiAnb2snLCAgIGljb246ICfinJMnLCAgdGV4dDogJ+C4muC4seC4meC4l+C4tuC4geC5geC4peC5ieC4pycgfSwKICBwZW5kaW5nOiB7IGNsczogJ3dhcm4nLCBpY29uOiAn4oa7JywgIHRleHQ6ICfguKHguLXguILguYnguK3guKHguLnguKXguYPguKvg',
  'uKHguYgnLCAgY2xpY2s6ICdsb2FkUGVuZGluZygpJyB9LAogIG9mZmxpbmU6IHsgY2xzOiAnZGdyJywgIGljb246ICfimqAnLCAgdGV4dDogJ+C5gOC4iuC4t+C5iOC4reC4oeC4leC5iOC4reC5hOC4oeC5iOC5hOC4lOC5iScsIGNsaWNrOiAncmV0cnlTeW5jKCkn',
  'IH0sCiAgZXJyb3I6ICAgeyBjbHM6ICdkZ3InLCAgaWNvbjogJ+KaoCcsICB0ZXh0OiAn4Lia4Lix4LiZ4LiX4Li24LiB4LmE4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIJywgY2xpY2s6ICdyZXRyeVN5bmMoKScgfSwKICBwYXVzZWQ6ICB7IGNsczogJ211dGUnLCBp',
  'Y29uOiAn4peLJywgIHRleHQ6ICfguYTguKHguYjguJXguKPguKfguIjguK3guLHguJXguYLguJnguKHguLHguJXguLQnLCBjbGljazogJ2xvYWRQZW5kaW5nKCknIH0KfTsKCi8qKgogKiBAcGFyYW0ge3N0cmluZ30gc3RhdGUg4LiK4Li34LmI4Lit4Liq4LiW4Liy',
  '4LiZ4Liw4LmD4LiZIFNZTkNfTE9PSwogKiBAcGFyYW0ge3N0cmluZz19IGRldGFpbCDguILguYnguK3guITguKfguLLguKHguK3guJjguLTguJrguLLguKLguYDguJ7guLTguYjguKEgKOC5guC4nOC4peC5iOC4leC4reC4meC5gOC4reC4suC5gOC4oeC4suC4quC5',
  'jOC4iuC4teC5iSkKICovCmZ1bmN0aW9uIHN5bmNTZXQoc3RhdGUsIGRldGFpbCl7CiAgLy8g4Liq4LiW4Liy4LiZ4Liw4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LmD4Lir4LmJ4Lic4Li54LmJ4LmD4LiK4LmJ4LiI4Lix4LiU4LiB4Liy4LijIOC4q+C5ieC4suC4oeC4',
  'luC4ueC4geC4quC4luC4suC4meC4sOC4l+C4seC5iOC4p+C5hOC4m+C4oeC4suC4geC4peC4muC4l+C4tOC5ieC4hwogIGlmICgoU1lOQy5zdGF0ZSA9PT0gJ3BlbmRpbmcnIHx8IFNZTkMuc3RhdGUgPT09ICdvZmZsaW5lJykgJiYKICAgICAgKHN0YXRlID09PSAn',
  'c3luY2VkJyB8fCBzdGF0ZSA9PT0gJ3N5bmNpbmcnKSkgcmV0dXJuOwoKICBTWU5DLnN0YXRlID0gc3RhdGU7CiAgU1lOQy5kZXRhaWwgPSBkZXRhaWwgfHwgJyc7CiAgaWYgKHN0YXRlID09PSAnc3luY2VkJyB8fCBzdGF0ZSA9PT0gJ3NhdmVkJykgU1lOQy5hdCA9',
  'IERhdGUubm93KCk7CiAgc3luY1BhaW50KCk7CgogIGNsZWFyVGltZW91dChTWU5DLnRpbWVyKTsKICBpZiAoc3RhdGUgPT09ICdzYXZlZCcpIHsgICAgICAgICAgICAgICAgICAgICAgIC8vIOC5guC4iuC4p+C5jCAi4Lia4Lix4LiZ4LiX4Li24LiB4LmB4Lil4LmJ',
  '4LinIiDguYHguJvguYrguJrguYDguJTguLXguKLguKfguYHguKXguYnguKfguIHguKXguLHguJrguYTguJvguJvguIHguJXguLQKICAgIFNZTkMudGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7CiAgICAgIGlmIChTWU5DLnN0YXRlID09PSAnc2F2ZWQnKSBz',
  'eW5jU2V0KCdzeW5jZWQnKTsKICAgIH0sIDI2MDApOwogIH0KfQoKZnVuY3Rpb24gc3luY1BhaW50KCl7CiAgdmFyIGRvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsaXZlRG90Jyk7CiAgaWYgKCFkb3QpIHJldHVybjsKICB2YXIgbG9vayA9IFNZTkNfTE9P',
  'S1tTWU5DLnN0YXRlXSB8fCBTWU5DX0xPT0suc3luY2VkOwoKICB2YXIgdGlwID0gU1lOQy5kZXRhaWwgfHwgc3luY1Rvb2x0aXAoKTsKICAvLyDguKvguYjguK3guILguYnguK3guITguKfguLLguKHguYTguKfguYkg4LmA4Lie4Li34LmI4Lit4LmD4Lir4LmJ4LiI',
  '4Lit4LmB4LiE4Lia4LiL4LmI4Lit4LiZ4LmA4LiJ4Lie4Liy4Liw4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LmB4Lil4Liw4Lii4Lix4LiH4LmA4Lir4LmH4LiZ4LmE4Lit4LiE4Lit4LiZ4Lit4Lii4Li54LmICiAgdmFyIGJvZHkgPSAobG9vay5zcGluID8gJzxzcGFu',
  'IGNsYXNzPSJzcGluIj48L3NwYW4+ICcgOiAobG9vay5pY29uID8gbG9vay5pY29uICsgJyAnIDogJycpKSArCiAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9InN5bmMtbGFiZWwiPicgKyBsb29rLnRleHQgKyAnPC9zcGFuPic7CiAgdmFyIGNscyA9ICdiICcgKyBs',
  'b29rLmNscyArICcgc3luYy1waWxsJzsKCiAgZG90LmlubmVySFRNTCA9IGxvb2suY2xpY2sKICAgID8gJzxidXR0b24gY2xhc3M9IicgKyBjbHMgKyAnIiBzdHlsZT0iYm9yZGVyOjA7Y3Vyc29yOnBvaW50ZXI7Zm9udDppbmhlcml0IiAnICsKICAgICAgJ3RpdGxl',
  'PSInICsgZXNjKHRpcCkgKyAnIiBvbmNsaWNrPSInICsgbG9vay5jbGljayArICciPicgKyBib2R5ICsgJzwvYnV0dG9uPicKICAgIDogJzxzcGFuIGNsYXNzPSInICsgY2xzICsgJyIgdGl0bGU9IicgKyBlc2ModGlwKSArICciPicgKyBib2R5ICsgJzwvc3Bhbj4n',
  'Owp9CgpmdW5jdGlvbiBzeW5jVG9vbHRpcCgpewogIHZhciBiYXNlID0gcmVmcmVzaExhYmVsKFBPTExfU0VDT05EUykgKyAnIMK3IOC5hOC4oeC5iOC5guC4q+C4peC4lOC4l+C4seC4muC4leC4reC4meC4geC4s+C4peC4seC4h+C4geC4o+C4reC4geC4guC5ieC4',
  'reC4oeC4ueC4pSc7CiAgaWYgKCFTWU5DLmF0KSByZXR1cm4gYmFzZTsKICB2YXIgZCA9IG5ldyBEYXRlKFNZTkMuYXQpOwogIHZhciBoaCA9ICgnMCcgKyBkLmdldEhvdXJzKCkpLnNsaWNlKC0yKSwgbW0gPSAoJzAnICsgZC5nZXRNaW51dGVzKCkpLnNsaWNlKC0y',
  'KTsKICByZXR1cm4gJ+C4leC4o+C4h+C4geC4seC4muC4guC5ieC4reC4oeC4ueC4peC4q+C4peC4seC4h+C4muC5ieC4suC4meC5gOC4oeC4t+C5iOC4rSAnICsgaGggKyAnOicgKyBtbSArICcg4LiZLlxuJyArIGJhc2U7Cn0KCi8qKiDguYDguJnguYfguJXguKrg',
  'uLDguJTguLjguJQv4Lir4Lil4Li44LiUIOC4leC5iOC4suC4h+C4iOC4suC4gSAi4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmM4LiV4Lit4Lia4Lin4LmI4Liy4LiX4Liz4LmE4Lih4LmI4LmE4LiU4LmJIiDguIvguLbguYjguIfguYDguJvguYfguJng',
  'uITguKfguLLguKHguJzguLTguJTguILguK3guIfguITguLPguKrguLHguYjguIcgKi8KZnVuY3Rpb24gaXNPZmZsaW5lRXJyb3IoZSl7CiAgaWYgKHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIG5hdmlnYXRvci5vbkxpbmUgPT09IGZhbHNlKSBy',
  'ZXR1cm4gdHJ1ZTsKICB2YXIgbSA9IFN0cmluZygoZSAmJiBlLm1lc3NhZ2UpIHx8IGUgfHwgJycpOwogIHJldHVybiAvbmV0d29ya3xmYWlsZWR8dGltZW91dHzguYDguITguKPguLfguK3guILguYjguLLguKJ84LmA4LiK4Li34LmI4Lit4Lih4LiV4LmI4LitfOC5',
  'hOC4oeC5iOC5hOC4lOC5ieC4o+C4seC4muC4guC5ieC4reC4oeC4ueC4peC4iOC4suC4geC5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jC9pLnRlc3QobSk7Cn0KCi8qKiDguJzguLnguYnguYPguIrguYnguIHguJTguJfguLXguYjguJXguLHguKfguJrg',
  'uK3guIHguKrguJbguLLguJnguLDguJXguK3guJnguKHguLXguJvguLHguI3guKvguLIg4oCUIOC4peC4reC4h+C5g+C4q+C4oeC5iOC4l+C4seC4meC4l+C4tSAqLwpmdW5jdGlvbiByZXRyeVN5bmMoKXsKICBTWU5DLnN0YXRlID0gJ3N5bmNpbmcnOwogIHN5bmNQ',
  'YWludCgpOwogIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKfQoKLyoqIOC5guC4q+C4peC4lOC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C4oeC5iOC4leC4reC4meC4l+C4teC5iOC4nOC4ueC5ieC5g+C4iuC5ieC4nuC4o+C5ieC4reC4oSAo4LiB4LiU4LiI4Liy4LiB',
  '4Lib4LmJ4Liy4LiiICLguKHguLXguILguYnguK3guKHguLnguKXguYPguKvguKHguYgiKSAqLwpmdW5jdGlvbiBsb2FkUGVuZGluZygpewogIFNZTkMuc3RhdGUgPSAnc3luY2luZyc7CiAgc3luY1BhaW50KCk7CiAgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwp9Cgp2',
  'YXIgUE9MTF9TRUNPTkRTID0gMDsKdmFyIFBPTExfVElNRVIgPSBudWxsOwoKZnVuY3Rpb24gc3RhcnRQb2xsaW5nKHNlY29uZHMpewogIHZhciBzZWMgPSBOdW1iZXIoc2Vjb25kcyB8fCAwKTsKICBQT0xMX1NFQ09ORFMgPSBzZWM7CiAgY2xlYXJJbnRlcnZhbChQ',
  'T0xMX1RJTUVSKTsKCiAgaWYgKCFzZWMpIHsgc3luY1NldCgncGF1c2VkJyk7IHJldHVybjsgfSAgIC8vIOC4m+C4tOC4lOC4geC4suC4o+C4leC4o+C4p+C4iOC4reC4seC4leC5guC4meC4oeC4seC4leC4tCDigJQg4LiB4LiU4LiX4Li14LmI4Lib4LmJ4Liy4Lii',
  '4LmA4Lie4Li34LmI4Lit4LiL4Li04LiH4LiB4LmM4LmA4Lit4LiH4LmE4LiU4LmJCiAgc3luY1NldCgnc3luY2VkJyk7CgogIFBPTExfVElNRVIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpewogICAgaWYgKGRvY3VtZW50LmhpZGRlbikgcmV0dXJuOwogICAgY2Fs',
  'bEFwaSgnYXBwLnZlcnNpb24nKS50aGVuKGZ1bmN0aW9uKHYpewogICAgICBpZiAoU1lOQy5zdGF0ZSA9PT0gJ29mZmxpbmUnKSBzeW5jU2V0KCdzeW5jZWQnKTsgICAvLyDguIHguKXguLHguJrguKHguLLguJXguYjguK3guYTguJTguYnguYHguKXguYnguKcKICAg',
  'ICAgaWYgKCF2IHx8ICF2LnZlcnNpb24gfHwgdi52ZXJzaW9uID09PSBTLnZlcnNpb24pIHJldHVybjsKICAgICAgUy52ZXJzaW9uID0gdi52ZXJzaW9uOwoKICAgICAgLy8g4LmA4Lij4Liy4LmA4Lib4LmH4LiZ4LiE4LiZ4LmB4LiB4LmJ4LmA4Lit4LiHIOC5geC4',
  'peC4sOC4q+C4meC5ieC4suC4geC5h+C4i+C4tOC4h+C4geC5jOC5hOC4m+C5geC4peC5ieC4p+C4leC4reC4meC4geC4lOC4muC4seC4meC4l+C4tuC4gQogICAgICBpZiAoRGF0ZS5ub3coKSA8IFMuc2VsZkNoYW5nZVVudGlsKSByZXR1cm47CgogICAgICAvLyDg',
  'uIHguLPguKXguLHguIfguIHguKPguK3guIHguILguYnguK3guKHguLnguKXguK3guKLguLnguYgg4oCUIOC4q+C5ieC4suC4oeC5guC4q+C4peC4lOC4l+C4seC4miDguKPguK3guYPguKvguYnguJzguLnguYnguYPguIrguYnguIHguJTguYDguK3guIcKICAgICAg',
  'aWYgKHVzZXJJc0J1c3koKSkgeyBzeW5jU2V0KCdwZW5kaW5nJyk7IHJldHVybjsgfQoKICAgICAgLy8g4LiL4Li04LiH4LiB4LmM4LmA4LiH4Li14Lii4LiaIOC5hiDguYTguKHguYjguKXguYnguLLguIfguKvguJnguYnguLIg4LmE4Lih4LmI4LmA4LiU4LmJ4LiH',
  '4LiB4Lil4Lix4Lia4LmE4Lib4Lia4LiZ4Liq4Li44LiUCiAgICAgIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKICAgICAgcmVmcmVzaEFsZXJ0cygpOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgIHN5bmNTZXQoaXNPZmZsaW5lRXJyb3IoZSkgPyAnb2Zm',
  'bGluZScgOiAnZXJyb3InLCAoZSAmJiBlLm1lc3NhZ2UpIHx8IFN0cmluZyhlKSk7CiAgICB9KTsKICB9LCBzZWMgKiAxMDAwKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguKjguLnguJnguKLguYzguYHguIjguYnguIfguYDguJXguLfguK3guJkgLS0tLS0tLS0t',
  'LS0tLS0tLQoKICAg4LiV4Lix4Lin4LmA4Lil4LiC4Lia4LiZ4LmA4Lih4LiZ4Li5ICjguYDguIrguYjguJkgNiDguKvguKXguLHguIcgIuC4peC5ieC4suC4h+C5geC4reC4o+C5jCIpIOC4geC4seC4muC4geC4peC5iOC4reC4h+C5geC4iOC5ieC4h+C5gOC4leC4',
  't+C4reC4meC4muC4meC5geC4luC4muC4q+C4seC4pwogICDguYPguIrguYnguILguYnguK3guKHguLnguKXguIrguLjguJTguYDguJTguLXguKLguKfguIHguLHguJnguIjguLLguIHguITguLPguKrguLHguYjguIcgYXBwLmFsZXJ0cyDguIvguLbguYjguIfguYDg',
  'uJrguLLguIHguKfguYjguLLguYHguJTguIrguJrguK3guKPguYzguJTguKHguLLguIEKCiAgIOC4reC4seC4m+C5gOC4lOC4leC5gOC4oeC4t+C5iOC4rTog4LmA4Lib4Li04LiU4Lij4Liw4Lia4LiaIMK3IOC4q+C4peC4seC4h+C4geC4lOC4muC4seC4meC4l+C4',
  'tuC4gS/guKXguJrguJfguLjguIHguITguKPguLHguYnguIcgwrcg4LiX4Li44LiB4Lij4Lit4Lia4LiV4Lij4Lin4LiI4LiC4LmJ4Lit4Lih4Li54LilCiAgIOC5gOC4lOC4tOC4oeC4leC4seC4p+C5gOC4peC4guC4meC4teC5ieC4reC4seC4m+C5gOC4lOC4leC4',
  'leC4reC4meC5gOC4m+C4tOC4lOC4q+C4meC5ieC4suC5geC4lOC4iuC4muC4reC4o+C5jOC4lOC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pwogICDguYTguJvguK3guKLguLnguYjguKvguJnguYnguLLguK3guLfguYjguJnguYHguKXguYnguKfguJXguLHg',
  'uKfguYDguKXguILguIjguLbguIfguITguYnguLLguIfguK3guKLguLnguYjguJfguLXguYjguITguYjguLLguYDguIHguYjguLIKLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovCgp2YXIg',
  'QUxFUlRTID0geyBjb3VudHM6IHt9LCBpdGVtczogW10sIHRvdGFsOiAwLCB1cmdlbnQ6IDAsIGF0OiAnJyB9OwoKZnVuY3Rpb24gcmVmcmVzaEFsZXJ0cygpewogIHJldHVybiBjYWxsQXBpKCdhcHAuYWxlcnRzJykudGhlbihmdW5jdGlvbihhKXsKICAgIEFMRVJU',
  'UyA9IGEgfHwgQUxFUlRTOwogICAgcGFpbnRCYWRnZXMoKTsKICAgIHBhaW50QmVsbCgpOwogICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdub3RpZlBhbmVsJykpIHJlbmRlck5vdGlmUGFuZWwoKTsgICAvLyDguYDguJvguLTguJTguITguYnguLLguIfg',
  'uK3guKLguLnguYgg4LmD4Lir4LmJ4Lit4Lix4Lib4LmA4LiU4LiV4LiV4Liy4LihCiAgICByZXR1cm4gYTsKICB9KS5jYXRjaChmdW5jdGlvbigpeyAvKiDguYDguJnguYfguJXguKrguLDguJTguLjguJQg4LmE4Lin4LmJ4Lij4Lit4Lia4Lir4LiZ4LmJ4LiyICov',
  'IH0pOwp9CgovKiog4LiV4Lix4Lin4LmA4Lil4LiC4Lia4LiZ4LmA4Lih4LiZ4Li54LiL4LmJ4Liy4LiiIOKAlCDguJrguK3guIHguIjguLPguJnguKfguJnguIfguLLguJnguJfguLXguYjguKLguLHguIfguITguYnguLLguIfguK3guKLguLnguYjguILguK3guIfg',
  'uYHguJXguYjguKXguLDguYLguKHguJTguLnguKUgKi8KZnVuY3Rpb24gcGFpbnRCYWRnZXMoKXsKICB2YXIgYyA9IEFMRVJUUy5jb3VudHMgfHwge307CiAgUEFHRVMuZm9yRWFjaChmdW5jdGlvbihwKXsgc2V0QmFkZ2UocC5pZCwgY1twLmlkXSB8fCAwKTsgfSk7',
  'Cn0KCmZ1bmN0aW9uIHNldEJhZGdlKHBhZ2UsIG4pewogIFtkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmFkZ2UtJyArIHBhZ2UpLCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFiYmFkZ2UtJyArIHBhZ2UpXQogICAgLmZvckVhY2goZnVuY3Rpb24oZWwpeyBp',
  'ZiAoZWwpIHBhaW50QmFkZ2UoZWwsIG4pOyB9KTsKCiAgLy8g4LiH4Liy4LiZ4LiE4LmJ4Liy4LiH4LiC4Lit4LiH4Lir4LiZ4LmJ4Liy4LiX4Li14LmI4LmE4Lih4LmI4Lih4Li14LmB4LiX4LmH4LiaIOC5g+C4q+C5ieC5hOC4m+C4o+C4p+C4oeC4reC4ouC4ueC5',
  'iOC4l+C4teC5iOC4m+C4uOC5iOC4oSAi4LmA4Lie4Li04LmI4Lih4LmA4LiV4Li04LihIiDguYTguKHguYjguIfguLHguYnguJnguJrguJnguKHguLfguK3guJbguLfguK3guIjguLDguKHguK3guIfguYTguKHguYjguYDguKvguYfguJnguYDguKXguKIKICB2YXIg',
  'bW9yZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YWJiYWRnZS1tb3JlJyk7CiAgaWYgKG1vcmUpIHsKICAgIHZhciBoaWRkZW4gPSBQQUdFUy5maWx0ZXIoZnVuY3Rpb24ocCl7IHJldHVybiAhcC50YWI7IH0pCiAgICAgIC5yZWR1Y2UoZnVuY3Rpb24oYSwg',
  'cCl7IHJldHVybiBhICsgKChBTEVSVFMuY291bnRzIHx8IHt9KVtwLmlkXSB8fCAwKTsgfSwgMCk7CiAgICBwYWludEJhZGdlKG1vcmUsIGhpZGRlbik7CiAgfQp9CgpmdW5jdGlvbiBwYWludEJhZGdlKGVsLCBuKXsKICBpZiAobiA+IDApIHsKICAgIGVsLnRleHRD',
  'b250ZW50ID0gbiA+IDk5ID8gJzk5KycgOiBuOwogICAgZWwuc3R5bGUuZGlzcGxheSA9ICcnOwogICAgZWwudGl0bGUgPSAn4Lii4Lix4LiH4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmIICcgKyBuICsgJyDguKPguLLguKLguIHguLLguKMnOwogIH0gZWxzZSB7CiAg',
  'ICBlbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOwogIH0KfQoKLyogLS0tLSDguIHguKPguLDguJTguLTguYjguIfguJrguJnguYHguJbguJrguKvguLHguKcgLS0tLSAqLwoKZnVuY3Rpb24gcGFpbnRCZWxsKCl7CiAgdmFyIHdyYXAgPSBkb2N1bWVudC5nZXRFbGVt',
  'ZW50QnlJZCgnYmVsbFdyYXAnKTsKICBpZiAoIXdyYXApIHJldHVybjsKCiAgLy8g4Lin4Liy4LiU4LmA4LiJ4Lie4Liy4Liw4LiV4Lix4Lin4Lib4Li44LmI4LihIOC4q+C5ieC4suC4oeC5gOC4guC4teC4ouC4meC4l+C4seC4muC4l+C4seC5ieC4hyBiZWxsV3Jh',
  'cAogIC8vIOC5gOC4nuC4o+C4suC4sOC4geC4peC5iOC4reC4h+C5geC4iOC5ieC4h+C5gOC4leC4t+C4reC4meC4l+C4teC5iOC5gOC4m+C4tOC4lOC4hOC5ieC4suC4h+C4reC4ouC4ueC5iOC4geC5h+C5gOC4m+C5h+C4meC4peC4ueC4geC4guC4reC4hyBiZWxs',
  'V3JhcCDguYDguKvguKHguLfguK3guJnguIHguLHguJkKICB2YXIgc2xvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiZWxsU2xvdCcpOwogIGlmICghc2xvdCkgewogICAgc2xvdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTsKICAgIHNsb3Qu',
  'aWQgPSAnYmVsbFNsb3QnOwogICAgd3JhcC5pbnNlcnRCZWZvcmUoc2xvdCwgd3JhcC5maXJzdENoaWxkKTsKICB9CgogIHZhciBuID0gQUxFUlRTLnRvdGFsIHx8IDA7CiAgdmFyIHVyZ2VudCA9IEFMRVJUUy51cmdlbnQgfHwgMDsKICBzbG90LmlubmVySFRNTCA9',
  'CiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIGljb24gYmVsbCIgaWQ9ImJlbGxCdG4iIG9uY2xpY2s9InRvZ2dsZU5vdGlmKCkiICcgKwogICAgICAndGl0bGU9IicgKyAobiA/ICfguKHguLUgJyArIG4gKyAnIOC5gOC4o+C4t+C5iOC4reC4h+C4l+C4teC5iOC4leC5',
  'ieC4reC4h+C4lOC4uScgOiAn4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ4LiE4LmJ4Liy4LiHJykgKyAnIiAnICsKICAgICAgJ2FyaWEtbGFiZWw9IuC4geC4suC4o+C5geC4iOC5ieC4h+C5gOC4leC4t+C4reC4mSI+8J+UlCcgKwogICAgICAobiA/ICc8c3BhbiBj',
  'bGFzcz0iYmVsbC1kb3QnICsgKHVyZ2VudCA/ICcgdXJnZW50JyA6ICcnKSArICciPicgKyAobiA+IDk5ID8gJzk5KycgOiBuKSArICc8L3NwYW4+JyA6ICcnKSArCiAgICAnPC9idXR0b24+JzsKfQoKZnVuY3Rpb24gdG9nZ2xlTm90aWYoKXsKICBpZiAoZG9jdW1l',
  'bnQuZ2V0RWxlbWVudEJ5SWQoJ25vdGlmUGFuZWwnKSkgcmV0dXJuIGNsb3NlTm90aWYoKTsKICB2YXIgd3JhcCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiZWxsV3JhcCcpOwogIGlmICghd3JhcCkgcmV0dXJuOwogIHZhciBwYW5lbCA9IGRvY3VtZW50LmNy',
  'ZWF0ZUVsZW1lbnQoJ2RpdicpOwogIHBhbmVsLmlkID0gJ25vdGlmUGFuZWwnOwogIHBhbmVsLmNsYXNzTmFtZSA9ICdub3RpZic7CiAgd3JhcC5hcHBlbmRDaGlsZChwYW5lbCk7CiAgcmVuZGVyTm90aWZQYW5lbCgpOwogIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsg',
  'ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBub3RpZk91dHNpZGUsIHRydWUpOyB9LCAwKTsKICByZWZyZXNoQWxlcnRzKCk7ICAgICAgICAgICAgICAgICAgICAgIC8vIOC5gOC4m+C4tOC4lOC4l+C4teC5hOC4o+C4geC5h+C4lOC4tuC4h+C4guC4',
  'reC4h+C4peC5iOC4suC4quC4uOC4lOC4oeC4suC5g+C4q+C5ieC4lOC5ieC4p+C4ogp9CgpmdW5jdGlvbiBjbG9zZU5vdGlmKCl7CiAgdmFyIHAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbm90aWZQYW5lbCcpOwogIGlmIChwKSBwLnJlbW92ZSgpOwogIGRv',
  'Y3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgbm90aWZPdXRzaWRlLCB0cnVlKTsKfQoKZnVuY3Rpb24gbm90aWZPdXRzaWRlKGUpewogIHZhciB3cmFwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JlbGxXcmFwJyk7CiAgaWYgKHdyYXAgJiYg',
  'IXdyYXAuY29udGFpbnMoZS50YXJnZXQpKSBjbG9zZU5vdGlmKCk7Cn0KCnZhciBOT1RJRl9HUk9VUFMgPSBbCiAgeyBtb2R1bGU6J3JlcGFpcnMnLCAgIGljOifwn5SnJywgbGFiZWw6J+C4h+C4suC4meC4i+C5iOC4reC4oeC4hOC5ieC4suC4hycgfSwKICB7IG1v',
  'ZHVsZTonYWMnLCAgICAgICAgaWM6J+KdhO+4jycsIGxhYmVsOifguKXguYnguLLguIfguYHguK3guKPguYzguJbguLbguIfguIHguLPguKvguJnguJQnIH0sCiAgeyBtb2R1bGU6J2J1aWxkaW5nJywgIGljOifwn4+iJywgbGFiZWw6J+C4h+C4suC4meC4leC4tuC4',
  'geC4quC5iOC4p+C4meC4geC4peC4suC4hycgfSwKICB7IG1vZHVsZToncHVyY2hhc2VzJywgaWM6J/Cfm6HvuI8nLCBsYWJlbDon4Lib4Lij4Liw4LiB4Lix4LiZ4LmD4LiB4Lil4LmJ4Lir4Lih4LiUJyB9LAogIHsgbW9kdWxlOidmaW5hbmNlJywgICBpYzon8J+n',
  'vicsIGxhYmVsOifguJrguLTguKXguKPguLLguKLguYDguJTguLfguK3guJknIH0KXTsKCmZ1bmN0aW9uIHJlbmRlck5vdGlmUGFuZWwoKXsKICB2YXIgcGFuZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbm90aWZQYW5lbCcpOwogIGlmICghcGFuZWwpIHJl',
  'dHVybjsKICB2YXIgaXRlbXMgPSBBTEVSVFMuaXRlbXMgfHwgW107CgogIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9Im5vdGlmLWgiPjxiPuC4geC4suC4o+C5geC4iOC5ieC4h+C5gOC4leC4t+C4reC4mTwvYj4nICsKICAgICc8c3BhbiBjbGFzcz0ic3AiPicgKwog',
  'ICAgICAoaXRlbXMubGVuZ3RoID8gJzxzcGFuIGNsYXNzPSJiICcgKyAoQUxFUlRTLnVyZ2VudCA/ICdkZ3InIDogJ3dhcm4nKSArICciPicgKyBpdGVtcy5sZW5ndGggKyAnIOC5gOC4o+C4t+C5iOC4reC4hzwvc3Bhbj4nIDogJycpICsKICAgICAgJzxidXR0b24g',
  'Y2xhc3M9ImJ0biBzbSBpY29uIiB0aXRsZT0i4LiU4Li24LiH4LiC4LmJ4Lit4Lih4Li54Lil4Lil4LmI4Liy4Liq4Li44LiUIiBvbmNsaWNrPSJyZWZyZXNoQWxlcnRzKCkiPuKGuzwvYnV0dG9uPicgKwogICAgJzwvc3Bhbj48L2Rpdj4nOwoKICBpZiAoIWl0ZW1z',
  'Lmxlbmd0aCkgewogICAgcGFuZWwuaW5uZXJIVE1MID0gaGVhZCArCiAgICAgICc8ZGl2IGNsYXNzPSJub3RpZi1lbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj7inIU8L2Rpdj7guYTguKHguYjguKHguLXguIfguLLguJnguITguYnguLLguIc8YnI+JyArCiAgICAgICc8',
  'c3BhbiBjbGFzcz0iZnMxMiBmYWludCI+4LiX4Li44LiB4Lit4Lii4LmI4Liy4LiH4LmA4Lij4Li14Lii4Lia4Lij4LmJ4Lit4Lii4LiU4Li1PC9zcGFuPjwvZGl2Pic7CiAgICByZXR1cm47CiAgfQoKICAvLyDguIjguLHguJTguIHguKXguLjguYjguKHguJXguLLg',
  'uKHguYLguKHguJTguLnguKUg4LmA4Lij4Li14Lii4LiH4LiV4Liy4Lih4Lil4Liz4LiU4Lix4Lia4LiX4Li14LmI4Lic4Li54LmJ4LmD4LiK4LmJ4Liq4LiZ4LmD4LiI4LiB4LmI4Lit4LiZCiAgdmFyIGJvZHkgPSAnJzsKICBOT1RJRl9HUk9VUFMuZm9yRWFjaChm',
  'dW5jdGlvbihnKXsKICAgIHZhciBsaXN0ID0gaXRlbXMuZmlsdGVyKGZ1bmN0aW9uKGEpeyByZXR1cm4gYS5tb2R1bGUgPT09IGcubW9kdWxlOyB9KTsKICAgIGlmICghbGlzdC5sZW5ndGgpIHJldHVybjsKICAgIGJvZHkgKz0gJzxkaXYgY2xhc3M9Im5vdGlmLXNl',
  'YyI+JyArIGcuaWMgKyAnICcgKyBlc2MoZy5sYWJlbCkgKyAnICgnICsgbGlzdC5sZW5ndGggKyAnKTwvZGl2Pic7CiAgICBsaXN0LnNsaWNlKDAsIDgpLmZvckVhY2goZnVuY3Rpb24oYSl7CiAgICAgIGJvZHkgKz0gJzxidXR0b24gY2xhc3M9Im5vdGlmLWl0ZW0g',
  'bC0nICsgZXNjKGEubGV2ZWwpICsgJyIgb25jbGljaz0iZ290b0FsZXJ0KFwnJyArIGVzYyhhLm1vZHVsZSkgKyAnXCcpIj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0idHQiPicgKyBlc2MoYS50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgKGEuZGV0YWlsID8g',
  'JzxkaXYgY2xhc3M9ImRkIj4nICsgZXNjKGEuZGV0YWlsKSArICc8L2Rpdj4nIDogJycpICsKICAgICAgJzwvYnV0dG9uPic7CiAgICB9KTsKICAgIGlmIChsaXN0Lmxlbmd0aCA+IDgpIHsKICAgICAgYm9keSArPSAnPGJ1dHRvbiBjbGFzcz0ibm90aWYtbW9yZSIg',
  'b25jbGljaz0iZ290b0FsZXJ0KFwnJyArIGVzYyhnLm1vZHVsZSkgKyAnXCcpIj4nICsKICAgICAgICAn4LiU4Li54Lit4Li14LiBICcgKyAobGlzdC5sZW5ndGggLSA4KSArICcg4Lij4Liy4Lii4LiB4Liy4LijIOKGkjwvYnV0dG9uPic7CiAgICB9CiAgfSk7Cgog',
  'IHBhbmVsLmlubmVySFRNTCA9IGhlYWQgKyAnPGRpdiBjbGFzcz0ibm90aWYtbGlzdCI+JyArIGJvZHkgKyAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0ibm90aWYtZiI+4Lit4Lix4Lib4LmA4LiU4LiV4LmA4Lih4Li34LmI4LitICcgKyBlc2MoU3RyaW5nKEFM',
  'RVJUUy5hdCB8fCAnJykuc2xpY2UoMTEsIDE2KSB8fCAn4oCTJykgKyAnIOC4mS4gwrcgJyArCiAgICAnPGEgaHJlZj0iamF2YXNjcmlwdDp2b2lkKDApIiBvbmNsaWNrPSJjbG9zZU5vdGlmKCk7Z28oXCdkYXNoYm9hcmRcJykiPuC4lOC4ueC4l+C4seC5ieC4h+C4',
  'q+C4oeC4lOC5g+C4meC5geC4lOC4iuC4muC4reC4o+C5jOC4lCDihpI8L2E+PC9kaXY+JzsKfQoKZnVuY3Rpb24gZ290b0FsZXJ0KG1vZHVsZSl7CiAgY2xvc2VOb3RpZigpOwogIGdvKG1vZHVsZSA9PT0gJ2RlYnQnID8gJ2RlYnRNYWluJyA6IG1vZHVsZSk7Cn0K',
  'Ci8qIC0tLS0tLS0tLS0tLS0tLS0gZm9ybWF0IGhlbHBlcnMgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gZXNjKHMpewogIHJldHVybiBTdHJpbmcocz09bnVsbD8nJzpzKQogICAgLnJlcGxhY2UoLyYvZywnJmFtcDsnKS5yZXBsYWNlKC88L2csJyZsdDsn',
  'KS5yZXBsYWNlKC8+L2csJyZndDsnKQogICAgLnJlcGxhY2UoLyIvZywnJnF1b3Q7JykucmVwbGFjZSgvJy9nLCcmIzM5OycpOwp9CmZ1bmN0aW9uIG1vbmV5KG4sIGRlYyl7CiAgdmFyIHYgPSBOdW1iZXIobnx8MCk7CiAgcmV0dXJuIHYudG9Mb2NhbGVTdHJpbmco',
  'J3RoLVRIJyx7bWluaW11bUZyYWN0aW9uRGlnaXRzOmRlY3x8MCwgbWF4aW11bUZyYWN0aW9uRGlnaXRzOmRlY3x8MH0pOwp9CmZ1bmN0aW9uIGJhaHQobil7IHJldHVybiBtb25leShuKSArICcg4Li/JzsgfQpmdW5jdGlvbiBwY3Qobil7IHJldHVybiAoTnVtYmVy',
  'KG4pfHwwKS50b0ZpeGVkKDEpICsgJyUnOyB9CmZ1bmN0aW9uIG51bShuKXsgcmV0dXJuIG49PW51bGx8fG49PT0nJyA/ICfigJMnIDogbW9uZXkobik7IH0KCi8qKiAyMDI2LTA0LTI2IC0+IDI2IOC5gOC4oS7guKIuIDI1NjkgKi8KdmFyIFRIX01PTiA9IFsn4Lih',
  'LuC4hC4nLCfguIEu4LieLicsJ+C4oeC4tS7guIQuJywn4LmA4LihLuC4oi4nLCfguJ4u4LiELicsJ+C4oeC4tC7guKIuJywn4LiBLuC4hC4nLCfguKou4LiELicsJ+C4gS7guKIuJywn4LiVLuC4hC4nLCfguJ4u4LiiLicsJ+C4mC7guIQuJ107Ci8qKgogKiDguJvg',
  'uLXguJfguLXguYjguIjguLDguYHguKrguJTguIfguJrguJnguKvguJnguYnguLLguIjguK0g4oCUIOC4guC5ieC4reC4oeC4ueC4peC5gOC4geC5h+C4muC5gOC4m+C5h+C4mSDguIQu4LioLiDguYDguKrguKHguK0KICog4LiV4Lij4LiH4LiZ4Li14LmJ4LmB4Lib',
  '4Lil4LiH4LiV4Lit4LiZ4LmB4Liq4LiU4LiH4Lic4Lil4Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinIOC4leC4suC4oeC4l+C4teC5iOC5gOC4peC4t+C4reC4geC5hOC4p+C5ieC5g+C4meC4q+C4meC5ieC4suC4leC4seC5ieC4h+C4hOC5iOC4sgogKiDg',
  'uITguYjguLLguJXguLHguYnguIfguJXguYnguJnguITguLfguK0g4LiELuC4qC4g4LmD4Lir4LmJ4LiV4Lij4LiH4LiB4Lix4Lia4Lib4Li14LiX4Li14LmI4LmA4LiB4LmH4Lia4LmD4LiZ4LiK4Li14LiV4LmB4Lil4Liw4Lib4LiP4Li04LiX4Li04LiZ4Liq4Liy',
  '4LiB4LilCiAqLwpmdW5jdGlvbiB1c2VCdWRkaGlzdFllYXIoKXsKICB2YXIgZiA9IChTLmJvb3QgJiYgUy5ib290LnNldHRpbmdzICYmIFMuYm9vdC5zZXR0aW5ncy5kYXRlRm9ybWF0KSB8fCAn4LiELuC4qC4gKDIwMjYpJzsKICByZXR1cm4gU3RyaW5nKGYpLmlu',
  'ZGV4T2YoJ+C4ni7guKguJykgPT09IDA7Cn0KZnVuY3Rpb24gZGlzcGxheVllYXIoY2UpewogIHJldHVybiB1c2VCdWRkaGlzdFllYXIoKSA/IE51bWJlcihjZSkgKyA1NDMgOiBOdW1iZXIoY2UpOwp9CgpmdW5jdGlvbiB0aERhdGUoaXNvKXsKICBpZiAoIWlzbykg',
  'cmV0dXJuICfigJMnOwogIHZhciBtID0gU3RyaW5nKGlzbykubWF0Y2goL14oXGR7NH0pLShcZHsyfSktKFxkezJ9KS8pOwogIGlmICghbSkgcmV0dXJuIGVzYyhpc28pOwogIHJldHVybiBOdW1iZXIobVszXSkgKyAnICcgKyBUSF9NT05bTnVtYmVyKG1bMl0pLTFd',
  'ICsgJyAnICsgZGlzcGxheVllYXIobVsxXSk7Cn0KZnVuY3Rpb24gdGhEYXRlU2hvcnQoaXNvKXsKICBpZiAoIWlzbykgcmV0dXJuICfigJMnOwogIHZhciBtID0gU3RyaW5nKGlzbykubWF0Y2goL14oXGR7NH0pLShcZHsyfSktKFxkezJ9KS8pOwogIGlmICghbSkg',
  'cmV0dXJuIGVzYyhpc28pOwogIHJldHVybiBOdW1iZXIobVszXSkgKyAnLycgKyBOdW1iZXIobVsyXSkgKyAnLycgKyBTdHJpbmcoZGlzcGxheVllYXIobVsxXSkpLnNsaWNlKDIpOwp9CmZ1bmN0aW9uIGRheXNBZ28oaXNvKXsKICBpZiAoIWlzbykgcmV0dXJuIG51',
  'bGw7CiAgcmV0dXJuIE1hdGgucm91bmQoKERhdGUubm93KCkgLSBuZXcgRGF0ZShpc28pLmdldFRpbWUoKSkvODY0MDAwMDApOwp9CgpmdW5jdGlvbiBzdGF0dXNCYWRnZShzdCl7CiAgdmFyIG1hcCA9IHsKICAgICfguYDguKrguKPguYfguIjguKrguLTguYnguJkn',
  'OidvaycsJ+C4lOC4s+C5gOC4meC4tOC4meC4geC4suC4o+C5geC4peC5ieC4pyc6J29rJywn4LmD4LiK4LmJ4LiH4Liy4LiZ4Lib4LiB4LiV4Li0Jzonb2snLCfguJvguLTguJTguKvguJnguLXguYnguYHguKXguYnguKcnOidvaycsJ+C4reC4ouC4ueC5iOC5g+C4',
  'meC4m+C4o+C4sOC4geC4seC4mSc6J29rJywn4Lih4Li14Lic4Li54LmJ4LmA4LiK4LmI4LiyJzonb2snLCfguJvguIHguJXguLQnOidvaycsCiAgICAn4LiB4Liz4Lil4Lix4LiH4LiL4LmI4Lit4LihJzonaW5mbycsJ+C4geC4s+C4peC4seC4h+C4lOC4s+C5gOC4',
  'meC4tOC4meC4geC4suC4oyc6J2luZm8nLCfguJnguLHguJTguKvguKHguLLguKLguYHguKXguYnguKcnOidpbmZvJywn4LiB4Liz4Lil4Lix4LiH4Lic4LmI4Lit4LiZJzonaW5mbycsJ+C4p+C5iOC4suC4hyc6J2luZm8nLAogICAgJ+C4o+C4reC4lOC4s+C5gOC4',
  'meC4tOC4meC4geC4suC4oyc6J3dhcm4nLCfguYDguKXguLfguYjguK3guJnguJnguLHguJQnOid3YXJuJywn4LmD4LiB4Lil4LmJ4Lir4Lih4LiU4Lib4Lij4Liw4LiB4Lix4LiZJzond2FybicsJ+C4leC5ieC4reC4h+C4i+C5iOC4reC4oSc6J3dhcm4nLCfguJ7g',
  'uLHguIHguIrguLPguKPguLAnOid3YXJuJywn4Lib4Li04LiU4Lib4Lij4Lix4Lia4Lib4Lij4Li44LiHJzond2FybicsJ+C5gOC4geC4tOC4meC4geC4s+C4q+C4meC4lCc6J3dhcm4nLCfguKLguLHguIfguYTguKHguYjguYDguITguKLguKXguYnguLLguIcnOid3',
  'YXJuJywKICAgICfguKLguIHguYDguKXguLTguIEnOidtdXRlJywn4Lib4Lil4LiU4Lij4Liw4Lin4Liy4LiHJzonbXV0ZScsJ+C5hOC4oeC5iOC4o+C4sOC4muC4uCc6J211dGUnLAogICAgJ+C4q+C4oeC4lOC4reC4suC4ouC4uOC5geC4peC5ieC4pyc6J2Rncics',
  'J+C4lOC5iOC4p+C4meC4oeC4suC4gSc6J2RncicsJ+C4lOC5iOC4p+C4mSc6J3dhcm4nCiAgfTsKICBpZiAoIXN0KSByZXR1cm4gJyc7CiAgcmV0dXJuICc8c3BhbiBjbGFzcz0iYiAnICsgKG1hcFtzdF18fCdtdXRlJykgKyAnIj4nICsgZXNjKHN0KSArICc8L3Nw',
  'YW4+JzsKfQoKZnVuY3Rpb24gcHJvZ3Jlc3MocGVyY2VudCwgY2xzKXsKICB2YXIgcCA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEwMCwgTnVtYmVyKHBlcmNlbnQpfHwwKSk7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJwYmFyICcgKyAoY2xzfHwnJykgKyAnIj48aSBz',
  'dHlsZT0id2lkdGg6JyArIHAgKyAnJSI+PC9pPjwvZGl2Pic7Cn0KCmZ1bmN0aW9uIHRodW1ic0h0bWwocmVmcywgYmlnKXsKICBpZiAoIXJlZnMgfHwgIXJlZnMubGVuZ3RoKSByZXR1cm4gJzxzcGFuIGNsYXNzPSJmYWludCBmczEyIj7igJM8L3NwYW4+JzsKICBy',
  'ZXR1cm4gJzxkaXYgY2xhc3M9InRodW1icyI+JyArIHJlZnMubWFwKGZ1bmN0aW9uKHIpewogICAgaWYgKHIudGh1bWIpIHsKICAgICAgcmV0dXJuICc8aW1nIGNsYXNzPSJ0aHVtYicgKyAoYmlnPycgYmlnJzonJykgKyAnIiBsb2FkaW5nPSJsYXp5IiBzcmM9Iicg',
  'KyBlc2Moci50aHVtYikgKyAnIiAnICsKICAgICAgICAgICAgICdvbmNsaWNrPSJ3aW5kb3cub3BlbihcJycgKyBlc2Moci51cmwpICsgJ1wnLFwnX2JsYW5rXCcpIiAnICsKICAgICAgICAgICAgICdvbmVycm9yPSJ0aGlzLm9uZXJyb3I9bnVsbDt0aGlzLnJlcGxh',
  'Y2VXaXRoKGZpbGVDaGlwKCcgKyBKU09OLnN0cmluZ2lmeShKU09OLnN0cmluZ2lmeShyKSkucmVwbGFjZSgvIi9nLCcmcXVvdDsnKSArICcpKSI+JzsKICAgIH0KICAgIHJldHVybiAnPGEgY2xhc3M9ImIgaW5mbyIgaHJlZj0iJyArIGVzYyhyLnVybCkgKyAnIiB0',
  'YXJnZXQ9Il9ibGFuayI+4LmE4Lif4Lil4LmMPC9hPic7CiAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKfQpmdW5jdGlvbiBmaWxlQ2hpcChqc29uKXsKICB2YXIgciA9IHR5cGVvZiBqc29uID09PSAnc3RyaW5nJyA/IEpTT04ucGFyc2UoanNvbikgOiBqc29uOwog',
  'IHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpOwogIGEuY2xhc3NOYW1lID0gJ2IgaW5mbyc7IGEuaHJlZiA9IHIudXJsOyBhLnRhcmdldCA9ICdfYmxhbmsnOyBhLnRleHRDb250ZW50ID0gJ/Cfk44g4LmE4Lif4Lil4LmMJzsKICByZXR1cm4gYTsK',
  'fQoKZnVuY3Rpb24gZW1wdHlCb3godGV4dCwgYWN0aW9uKXsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPvCfl4LvuI88L2Rpdj4nICsgZXNjKHRleHQpICsKICAgICAgICAgKGFjdGlvbiA/ICc8ZGl2IGNsYXNzPSJtdDEyIj4n',
  'ICsgYWN0aW9uICsgJzwvZGl2PicgOiAnJykgKyAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gYmFyQ2hhcnQoaXRlbXMsIGxhYmVsS2V5LCB2YWx1ZUtleSwgZm9ybWF0dGVyKXsKICBpZiAoIWl0ZW1zIHx8ICFpdGVtcy5sZW5ndGgpIHJldHVybiAnPGRpdiBjbGFzcz0i',
  'ZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4guC5ieC4reC4oeC4ueC4pTwvZGl2Pic7CiAgdmFyIG1heCA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGl0ZW1zLm1hcChmdW5jdGlvbihpKXsgcmV0dXJuIE51bWJlcihpW3ZhbHVlS2V5XSl8fDA7IH0pKSB8',
  'fCAxOwogIHJldHVybiAnPGRpdiBjbGFzcz0iYmFycyI+JyArIGl0ZW1zLm1hcChmdW5jdGlvbihpKXsKICAgIHZhciB2ID0gTnVtYmVyKGlbdmFsdWVLZXldKXx8MDsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0iYmFyLXJvdyI+JyArCiAgICAgICc8ZGl2IGNsYXNz',
  'PSJjbGlwIiB0aXRsZT0iJyArIGVzYyhpW2xhYmVsS2V5XSkgKyAnIj4nICsgZXNjKGlbbGFiZWxLZXldKSArICc8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImJhci10cmFjayI+PGRpdiBjbGFzcz0iYmFyLWZpbGwiIHN0eWxlPSJ3aWR0aDonICsgKHYvbWF4',
  'KjEwMCkgKyAnJSI+PC9kaXY+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJ2Ij4nICsgKGZvcm1hdHRlciA/IGZvcm1hdHRlcihpKSA6IG1vbmV5KHYpKSArICc8L2Rpdj4nICsKICAgICc8L2Rpdj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7Cn0KCi8q',
  'IC0tLS0tLS0tLS0tLS0tLS0gbW9kYWwgLS0tLS0tLS0tLS0tLS0tLSAqLwoKLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tCiAgIOC4leC4suC4o+C4suC4h+C4muC4meC4iOC4reC5geC4',
  'hOC4mgogICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0KICAg4LiV4Liy4Lij4Liy4LiH4LiB4Lin4LmJ4Liy4LiHIDEsMDAwcHgg4Lit4LmI4Liy4LiZ4Lia4LiZ4Lih4Li34Lit4LiW4Li3',
  '4Lit4LmE4Lih4LmI4LmE4Lir4LinIOC4leC5ieC4reC4h+C5gOC4peC4t+C5iOC4reC4meC4i+C5ieC4suC4ouC4guC4p+C4suC4leC4peC4reC4lAogICDguIjguLbguIfguJXguLTguJTguIrguLfguYjguK3guITguK3guKXguLHguKHguJnguYzguYTguKfguYng',
  'uJfguLXguYjguYHguJXguYjguKXguLDguIrguYjguK3guIfguJTguYnguKfguKIgZGF0YS1sYWJlbCDguYHguKXguYnguKfguYPguKvguYkgQ1NTCiAgIOC5gOC4m+C5h+C4meC4hOC4meC4leC4seC4lOC4quC4tOC4meC4p+C5iOC4suC4iOC4sOC5geC4quC4lOC4',
  'h+C5gOC4m+C5h+C4meC4leC4suC4o+C4suC4h+C4q+C4o+C4t+C4reC5gOC4m+C5h+C4meC4geC4suC4o+C5jOC4lOC4l+C4teC4peC4sOC4o+C4suC4ouC4geC4suC4owoKICAg4LiX4Liz4LiX4Li14LmI4LiZ4Li14LmI4LiX4Li14LmI4LmA4LiU4Li14Lii4Lin',
  '4Lir4Lil4Lix4LiH4Lin4Liy4LiU4Lir4LiZ4LmJ4Liy4LmA4Liq4Lij4LmH4LiIIOC4l+C4uOC4geC4leC4suC4o+C4suC4h+C5g+C4meC4o+C4sOC4muC4muC4iOC4tuC4h+C5hOC4lOC5ieC4nOC4peC5gOC4q+C4oeC4t+C4reC4meC4geC4seC4meC4q+C4oeC4',
  'lAogICDguYTguKHguYjguJXguYnguK3guIfguYTguKXguYjguYHguIHguYnguJfguLXguKXguLDguJXguLLguKPguLLguIcg4LmB4Lil4Liw4LiV4Liy4Lij4Liy4LiH4LiX4Li14LmI4LmA4Lie4Li04LmI4Lih4LmD4Lir4Lih4LmI4LiX4Li14Lir4Lil4Lix4LiH',
  '4LiB4LmH4LmE4LiU4LmJ4LmE4Lib4LiU4LmJ4Lin4Lii4LmA4Lil4LiiCiAgIEhUTUwg4Lii4Lix4LiH4LmA4Lib4LmH4LiZ4LiK4Li44LiU4LmA4LiU4Li14Lii4LinIOC4leC5iOC4suC4h+C4geC4seC4meC5geC4hOC5iCBDU1Mg4Lii4LmI4LitLeC4guC4ouC4',
  'suC4ouC4q+C4meC5ieC4suC4leC5iOC4suC4h+C4geC5h+C4quC4peC4seC4muC5hOC4lOC5ieC4l+C4seC4meC4l+C4tQotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovCmZ1bmN0aW9u',
  'IGxhYmVsQ2VsbHMocm9vdCl7CiAgaWYgKCFyb290KSByZXR1cm47CiAgdmFyIHRhYmxlcyA9IHJvb3QucXVlcnlTZWxlY3RvckFsbCA/IHJvb3QucXVlcnlTZWxlY3RvckFsbCgndGFibGUnKSA6IFtdOwogIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwodGFi',
  'bGVzLCBmdW5jdGlvbih0KXsKICAgIHZhciBoZWFkcyA9IEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbCh0LnF1ZXJ5U2VsZWN0b3JBbGwoJ3RoZWFkIHRoJyksIGZ1bmN0aW9uKHRoKXsKICAgICAgcmV0dXJuICh0aC50ZXh0Q29udGVudCB8fCAnJykudHJpbSgpOwog',
  'ICAgfSk7CiAgICBpZiAoIWhlYWRzLmxlbmd0aCkgcmV0dXJuOwogICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbCh0LnF1ZXJ5U2VsZWN0b3JBbGwoJ3Rib2R5IHRyJyksIGZ1bmN0aW9uKHRyKXsKICAgICAgLy8g4LmB4LiW4Lin4Liq4Lij4Li44Lib4Lir',
  '4Lij4Li34Lit4LmB4LiW4LinICLguYTguKHguYjguKHguLXguILguYnguK3guKHguLnguKUiIOC4l+C4teC5iOC4o+C4p+C4oeC4iuC5iOC4reC4hyDguJvguKXguYjguK3guKLguYTguKfguYnguYDguJXguYfguKHguITguKfguLLguKHguIHguKfguYnguLLguIcK',
  'ICAgICAgaWYgKHRyLnF1ZXJ5U2VsZWN0b3IoJ1tjb2xzcGFuXScpKSB7IHRyLmNsYXNzTGlzdC5hZGQoJ3Jvdy13aWRlJyk7IHJldHVybjsgfQogICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKHRyLmNoaWxkcmVuLCBmdW5jdGlvbih0ZCwgaSl7CiAg',
  'ICAgICAgdmFyIGxhYmVsID0gaGVhZHNbaV0gfHwgJyc7CiAgICAgICAgaWYgKGxhYmVsKSB0ZC5zZXRBdHRyaWJ1dGUoJ2RhdGEtbGFiZWwnLCBsYWJlbCk7CiAgICAgICAgZWxzZSB0ZC5jbGFzc0xpc3QuYWRkKCdjZWxsLWFjdGlvbnMnKTsgICAvLyDguITguK3g',
  'uKXguLHguKHguJnguYzguJvguLjguYjguKEg4LmE4Lih4LmI4Lih4Li14Lir4Lix4Lin4LiV4Liy4Lij4Liy4LiHIOC5hOC4oeC5iOC4leC5ieC4reC4h+C4leC4tOC4lOC4m+C5ieC4suC4ogoKICAgICAgICAvLyDguIrguYjguK3guIfguJfguLXguYjguYTguKHg',
  'uYjguKHguLXguITguYjguLIgKOC4p+C5iOC4suC4h+C4q+C4o+C4t+C4reC4guC4teC4lCkg4Lia4LiZ4LiI4Lit4LmB4LiE4Lia4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LmC4LiK4Lin4LmM4LmA4Lib4LmH4LiZ4Lia4Lij4Lij4LiX4Lix4LiUCiAgICAgICAgLy8g',
  '4LiB4Liy4Lij4LmM4LiU4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4Lii4Liy4Lin4LmA4LiB4LmJ4LitIOC4quC5iOC4p+C4meC4muC4meC4iOC4reC4geC4p+C5ieC4suC4h+C4ouC4seC4h+C4leC5ieC4reC4h+C4oeC4teC5gOC4nuC4t+C5iOC4reC5g+C4q+C5',
  'ieC4hOC4reC4peC4seC4oeC4meC5jOC4leC4o+C4h+C4geC4seC4mQogICAgICAgIHZhciB0eHQgPSAodGQudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKTsKICAgICAgICB2YXIgaGFzVGhpbmcgPSB0ZC5xdWVyeVNlbGVjdG9yKCdpbWcsYnV0dG9uLGEsaW5wdXQs',
  'c3ZnLC50aHVtYicpOwogICAgICAgIGlmICgodHh0ID09PSAnJyB8fCB0eHQgPT09ICfigJMnIHx8IHR4dCA9PT0gJy0nKSAmJiAhaGFzVGhpbmcpIHsKICAgICAgICAgIHRkLmNsYXNzTGlzdC5hZGQoJ2NlbGwtZW1wdHknKTsKICAgICAgICB9CiAgICAgIH0pOwog',
  'ICAgfSk7CiAgfSk7Cn0KCmZ1bmN0aW9uIG9wZW5Nb2RhbCh0aXRsZSwgYm9keUh0bWwsIGZvb3RIdG1sLCB3aWRlKXsKICB2YXIgcm9vdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb2RhbFJvb3QnKTsKICByb290LmlubmVySFRNTCA9CiAgICAnPGRpdiBj',
  'bGFzcz0ib3YiIG9uY2xpY2s9ImlmKGV2ZW50LnRhcmdldD09PXRoaXMpY2xvc2VNb2RhbCgpIj4nICsKICAgICAgJzxkaXYgY2xhc3M9Im1vZGFsJyArICh3aWRlPycgd2lkZSc6JycpICsgJyI+JyArCiAgICAgICAgJzxkaXYgY2xhc3M9Im1vZGFsLWgiPjxoMz4n',
  'ICsgZXNjKHRpdGxlKSArICc8L2gzPjxidXR0b24gY2xhc3M9IngiIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+w5c8L2J1dHRvbj48L2Rpdj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0ibW9kYWwtYiI+JyArIGJvZHlIdG1sICsgJzwvZGl2PicgKwogICAgICAgIChm',
  'b290SHRtbCA/ICc8ZGl2IGNsYXNzPSJtb2RhbC1mIj4nICsgZm9vdEh0bWwgKyAnPC9kaXY+JyA6ICcnKSArCiAgICAgICc8L2Rpdj4nICsKICAgICc8L2Rpdj4nOwogIGFwcGx5UmVhZE9ubHkocm9vdCk7CiAgbGFiZWxDZWxscyhyb290KTsKICBkb2N1bWVudC5i',
  'b2R5LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7Cn0KZnVuY3Rpb24gY2xvc2VNb2RhbCgpewogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb2RhbFJvb3QnKS5pbm5lckhUTUwgPSAnJzsKICBkb2N1bWVudC5ib2R5LnN0eWxlLm92ZXJmbG93ID0gJyc7Cn0K',
  'ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGUpeyBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSBjbG9zZU1vZGFsKCk7IH0pOwoKZnVuY3Rpb24gY29uZmlybUFjdGlvbih0ZXh0LCBvblllcyl7CiAgb3Blbk1vZGFsKCfguKLguLfg',
  'uJnguKLguLHguJknLAogICAgJzxwPicgKyBlc2ModGV4dCkgKyAnPC9wPicsCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4gTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBk',
  'Z3IiIGlkPSJjZm1CdG4iPuC4ouC4t+C4meC4ouC4seC4mTwvYnV0dG9uPicpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZm1CdG4nKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsgY2xvc2VNb2RhbCgpOyBvblllcygpOyB9Owp9CgovKiAtLS0tLS0tLS0tLS0t',
  'LS0tIHRvYXN0IC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIHRvYXN0KG1zZywga2luZCl7CiAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgZWwuY2xhc3NOYW1lID0gJ3RvYXN0ICcgKyAoa2luZHx8JycpOwogIGVsLnRleHRD',
  'b250ZW50ID0gbXNnOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2FzdFJvb3QnKS5hcHBlbmRDaGlsZChlbCk7CiAgc2V0VGltZW91dChmdW5jdGlvbigpeyBlbC5yZW1vdmUoKTsgfSwga2luZD09PSdlcnInID8gNTIwMCA6IDI4MDApOwp9CgovKiAtLS0t',
  'LS0tLS0tLS0tLS0tIG5hdiAobW9iaWxlKSAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiB0b2dnbGVOYXYoKXsKICB2YXIgbmF2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdicpOwogIG5hdi5jbGFzc0xpc3QudG9nZ2xlKCdvcGVuJyk7CiAgaWYg',
  'KG5hdi5jbGFzc0xpc3QuY29udGFpbnMoJ29wZW4nKSkgewogICAgdmFyIHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICAgIHMuY2xhc3NOYW1lID0gJ3NjcmltJzsgcy5pZCA9ICdzY3JpbSc7CiAgICBzLm9uY2xpY2sgPSBmdW5jdGlvbigpeyBu',
  'YXYuY2xhc3NMaXN0LnJlbW92ZSgnb3BlbicpOyByZW1vdmVTY3JpbSgpOyB9OwogICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzKTsKICB9IGVsc2UgcmVtb3ZlU2NyaW0oKTsKfQpmdW5jdGlvbiByZW1vdmVTY3JpbSgpewogIHZhciBzID0gZG9jdW1lbnQu',
  'Z2V0RWxlbWVudEJ5SWQoJ3NjcmltJyk7CiAgaWYgKHMpIHMucmVtb3ZlKCk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0gc2VhcmNoIC0tLS0tLS0tLS0tLS0tLS0gKi8KCnZhciBzZWFyY2hUaW1lciA9IG51bGw7CmZ1bmN0aW9uIG9uU2VhcmNoKHEpewogIGNsZWFy',
  'VGltZW91dChzZWFyY2hUaW1lcik7CiAgaWYgKCFxIHx8IHEudHJpbSgpLmxlbmd0aCA8IDIpIHJldHVybjsKICBzZWFyY2hUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2FwcC5zZWFyY2gnLCB7IHE6IHEgfSkudGhlbihmdW5jdGlv',
  'bihyb3dzKXsKICAgICAgb3Blbk1vZGFsKCfguJzguKXguIHguLLguKPguITguYnguJnguKvguLIgIicgKyBxICsgJyIgKCcgKyByb3dzLmxlbmd0aCArICcpJywKICAgICAgICByb3dzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJhbGlzdCI+JyArIHJvd3MubWFwKGZ1',
  'bmN0aW9uKHIpewogICAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJhbGkiIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtnbyhcJycgKyBqdW1wUGFnZShyLm1vZHVsZSkgKyAnXCcpIj4nICsKICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImljIj4nICsgbW9kdWxlSWNv',
  'bihyLm1vZHVsZSkgKyAnPC9kaXY+PGRpdj4nICsKICAgICAgICAgICAgJzxkaXYgY2xhc3M9InR0Ij4nICsgZXNjKHIudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAgICAnPGRpdiBjbGFzcz0iZGQiPicgKyBlc2Moci5sYWJlbCkgKyAoci5kZXRhaWwgPyAn',
  'IMK3ICcgKyBlc2Moci5kZXRhaWwpIDogJycpICsgJzwvZGl2PicgKwogICAgICAgICAgICAnPC9kaXY+PC9kaXY+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nCiAgICAgICAgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC5hOC4oeC5iOC4nuC4muC4o+C4',
  'suC4ouC4geC4suC4o+C4l+C4teC5iOC4leC4o+C4h+C4geC4seC4muC4hOC4s+C4hOC5ieC4mTwvZGl2PicsICcnLCB0cnVlKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsICdlcnInKTsgfSk7CiAgfSwgNDIwKTsKfQpmdW5j',
  'dGlvbiBqdW1wUGFnZShtb2R1bGUpewogIHJldHVybiAoe3B1cmNoYXNlczoncHVyY2hhc2VzJywgcmVwYWlyczoncmVwYWlycycsIGJ1aWxkaW5nOididWlsZGluZycsIGFjOidhYycsIGRlYnQ6J2RlYnRNYWluJywgcm9vbXM6J3Jvb21zJ30pW21vZHVsZV0gfHwg',
  'J2Rhc2hib2FyZCc7Cn0KZnVuY3Rpb24gbW9kdWxlSWNvbihtb2R1bGUpewogIHJldHVybiAoe3B1cmNoYXNlczon8J+bkicsIHJlcGFpcnM6J/CflKcnLCBidWlsZGluZzon8J+PoicsIGFjOifinYTvuI8nLCBkZWJ0Oifwn5KwJywgcm9vbXM6J/CfmqonfSlbbW9k',
  'dWxlXSB8fCAn8J+ThCc7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0gZmlsZSB1cGxvYWQgLS0tLS0tLS0tLS0tLS0tLSAqLwoKLyoqCiAqIOC4reC5iOC4suC4meC5hOC4n+C4peC5jOC4iOC4suC4gSA8aW5wdXQgdHlwZT1maWxlPiDguYDguJvguYfguJkgZGF0YVVS',
  'TCDguYHguKXguYnguKfguKrguYjguIfguILguLbguYnguJkgRHJpdmUKICog4LiE4Li34LiZIGFycmF5IOC4guC4reC4hyB7aWQsbmFtZSx1cmwsdGh1bWJ9CiAqLwpmdW5jdGlvbiB1cGxvYWRGaWxlcyhpbnB1dEVsLCBidWNrZXQpewogIHZhciBmaWxlcyA9IEFy',
  'cmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGlucHV0RWwuZmlsZXMgfHwgW10pOwogIGlmICghZmlsZXMubGVuZ3RoKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTsKICB2YXIgTUFYID0gMTIgKiAxMDI0ICogMTAyNDsKICB2YXIgdG9vQmlnID0gZmlsZXMuZmls',
  'dGVyKGZ1bmN0aW9uKGYpeyByZXR1cm4gZi5zaXplID4gTUFYOyB9KTsKICBpZiAodG9vQmlnLmxlbmd0aCkgewogICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcign4LmE4Lif4Lil4LmM4LmD4Lir4LiN4LmI4LmA4LiB4Li04LiZIDEyIE1COiAnICsg',
  'dG9vQmlnLm1hcChmdW5jdGlvbihmKXtyZXR1cm4gZi5uYW1lO30pLmpvaW4oJywgJykpKTsKICB9CiAgcmV0dXJuIFByb21pc2UuYWxsKGZpbGVzLm1hcChyZWFkQXNEYXRhVXJsKSkKICAgIC50aGVuKGZ1bmN0aW9uKHBheWxvYWRzKXsgcmV0dXJuIGNhbGxBcGko',
  'J2ZpbGUudXBsb2FkJywgeyBidWNrZXQ6IGJ1Y2tldCwgZmlsZXM6IHBheWxvYWRzIH0pOyB9KTsKfQoKZnVuY3Rpb24gcmVhZEFzRGF0YVVybChmaWxlKXsKICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXsKICAgIHZhciByID0g',
  'bmV3IEZpbGVSZWFkZXIoKTsKICAgIHIub25sb2FkID0gZnVuY3Rpb24oKXsgcmVzb2x2ZSh7IG5hbWU6IGZpbGUubmFtZSwgbWltZVR5cGU6IGZpbGUudHlwZSwgZGF0YVVybDogci5yZXN1bHQgfSk7IH07CiAgICByLm9uZXJyb3IgPSBmdW5jdGlvbigpeyByZWpl',
  'Y3QobmV3IEVycm9yKCfguK3guYjguLLguJnguYTguJ/guKXguYzguYTguKHguYjguKrguLPguYDguKPguYfguIg6ICcgKyBmaWxlLm5hbWUpKTsgfTsKICAgIHIucmVhZEFzRGF0YVVSTChmaWxlKTsKICB9KTsKfQo8L3NjcmlwdD4KPHNjcmlwdD4KLyogPT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIEF1dGguaHRtbCDigJQg4Lir4LiZ4LmJ4Liy4Lil4LmH4Lit4LiB4Lit4Li04LiZIMK3IFBJTiA2IOC4q+C4peC4seC4gSDCtyDguYDguJvguKXguLXguYjguKLguJng',
  'uKPguKvguLHguKrguJzguYjguLLguJkKCiAgIOC4l+C4teC5iOC5gOC4geC5h+C4muC4guC4reC4h+C4neC4seC5iOC4h+C5gOC4muC4o+C4suC4p+C5jOC5gOC4i+C4reC4o+C5jCAyIOC4iuC4seC5ieC4mSDguYDguJ7guKPguLLguLDguYDguKfguYfguJrguYHg',
  'uK3guJvguILguK3guIcgQXBwcyBTY3JpcHQKICAg4LiX4Liz4LiH4Liy4LiZ4LmD4LiZIGlmcmFtZSDguJfguLXguYjguIrguLfguYjguK3guYLguJTguYDguKHguJnguYDguJvguKXguLXguYjguKLguJnguJfguLjguIHguITguKPguLHguYnguIfguJfguLXguYjg',
  'uYDguJvguLTguJQKICAgbG9jYWxTdG9yYWdlIOC4iOC4tuC4h+C4q+C4suC4ouC5hOC4lOC5iSDguJXguYnguK3guIfguKHguLXguJfguLLguIfguKrguLPguKPguK3guIcKICAgICDCtyDguKPguKvguLHguKrguK3guYnguLLguIfguK3guLTguIfguIHguLLguKPg',
  'uYDguILguYnguLLguYPguIrguYnguIfguLLguJkgKOC4reC4suC4ouC4uOC4quC4seC5ieC4mSkg4oCUIOC5gOC4geC5h+C4muC5g+C4mSBsb2NhbFN0b3JhZ2Ug4Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinCiAgICAgICDguKvguLLguKLguIHguYfguYHg',
  'uITguYjguYPguKrguYggUElOIOC5g+C4q+C4oeC5iAogICAgIMK3IOC4o+C4q+C4seC4quC4reC4uOC4m+C4geC4o+C4k+C5jCAo4LiE4Li54LmI4LiB4Lix4LiaIFBJTikg4oCUIOC5gOC4geC5h+C4muC4l+C4seC5ieC4hyBsb2NhbFN0b3JhZ2Ug4LmB4Lil4Liw',
  '4LmD4LiZIFVSTCDguILguK3guIfguKvguJnguYnguLLguYHguKHguYgKICAgICAgIOC4nOC5iOC4suC4mSBnb29nbGUuc2NyaXB0Lmhpc3Rvcnkg4LmA4Lie4Li34LmI4Lit4LmD4Lir4LmJ4Lii4Lix4LiH4Lit4Lii4Li54LmI4Lir4Lil4Lix4LiH4Lib4Li04LiU',
  '4LmA4Lib4Li04LiU4LmA4LiE4Lij4Li34LmI4Lit4LiHCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKdmFyIEFVVEggPSB7CiAgc2Vzc2lvbjogJycsCiAgZGV2aWNlOiAnJywKICBtZTogbnVs',
  'bCwKICBwaW46ICcnLAogIHNjcmVlbjogJycKfTsKCnZhciBMU19TRVNTSU9OID0gJ21jb3JuZXIuc2Vzc2lvbic7CnZhciBMU19ERVZJQ0UgID0gJ21jb3JuZXIuZGV2aWNlJzsKCi8qIC0tLS0tLS0tLS0tLS0tLS0g4LiX4Li14LmI4LmA4LiB4LmH4Lia4Lid4Lix',
  '4LmI4LiH4LmA4Lia4Lij4Liy4Lin4LmM4LmA4LiL4Lit4Lij4LmMIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIGxzR2V0KGspewogIHRyeSB7IHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oaykgfHwgJyc7IH0gY2F0Y2ggKGUpIHsgcmV0',
  'dXJuICcnOyB9Cn0KZnVuY3Rpb24gbHNTZXQoaywgdil7CiAgdHJ5IHsgdiA/IHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShrLCB2KSA6IHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrKTsgfQogIGNhdGNoIChlKSB7IC8qIOC5guC4q+C4oeC4lOC4',
  'quC5iOC4p+C4meC4leC4seC4p+C4q+C4o+C4t+C4reC4m+C4tOC4lOC4hOC4uOC4geC4geC4teC5ieC5hOC4p+C5iSDigJQg4LmD4LiK4LmJ4LiX4Liy4LiH4Liq4Liz4Lij4Lit4LiHICovIH0KfQoKLyoqIOC5gOC4guC4teC4ouC4meC4o+C4q+C4seC4quC4reC4',
  'uOC4m+C4geC4o+C4k+C5jOC4peC4hyBVUkwg4LiC4Lit4LiH4Lir4LiZ4LmJ4Liy4LmB4Lih4LmIIOC5g+C4q+C5ieC4o+C4reC4lOC4guC5ieC4suC4oeC4geC4suC4o+C5gOC4m+C4tOC4lOC5g+C4q+C4oeC5iCAqLwpmdW5jdGlvbiBkZXZpY2VUb1VybCh0b2tl',
  'bil7CiAgdHJ5IHsKICAgIGlmICghd2luZG93Lmdvb2dsZSB8fCAhZ29vZ2xlLnNjcmlwdCB8fCAhZ29vZ2xlLnNjcmlwdC5oaXN0b3J5KSByZXR1cm47CiAgICB2YXIgcGFyYW1zID0ge307CiAgICBpZiAoYWNjZXNzS2V5KCkpIHBhcmFtcy5rZXkgPSBhY2Nlc3NL',
  'ZXkoKTsKICAgIGlmICh0b2tlbikgcGFyYW1zLmQgPSB0b2tlbjsKICAgIGdvb2dsZS5zY3JpcHQuaGlzdG9yeS5yZXBsYWNlU3RhdGUoe30sIHBhcmFtcywgbG9jYXRpb24uaGFzaCk7CiAgfSBjYXRjaCAoZSkgeyAvKiDguYTguKHguYjguYPguIrguYjguYDguKfg',
  'uYfguJrguYHguK3guJsgKOC5gOC4iuC5iOC4meC5gOC4m+C4tOC4lOC5g+C4mSBkaWFsb2cpIOKAlCDguILguYnguLLguKHguYTguJsgKi8gfQp9CgpmdW5jdGlvbiBzYXZlRGV2aWNlKHRva2VuKXsKICBBVVRILmRldmljZSA9IHRva2VuIHx8ICcnOwogIGxzU2V0',
  'KExTX0RFVklDRSwgQVVUSC5kZXZpY2UpOwogIGRldmljZVRvVXJsKEFVVEguZGV2aWNlKTsKfQoKZnVuY3Rpb24gc2F2ZVNlc3Npb24odG9rZW4pewogIEFVVEguc2Vzc2lvbiA9IHRva2VuIHx8ICcnOwogIGxzU2V0KExTX1NFU1NJT04sIEFVVEguc2Vzc2lvbik7',
  'Cn0KCi8qKiDguK3guYjguLLguJnguITguYjguLLguJfguLXguYjguYDguIHguYfguJrguYTguKfguYnguJfguLHguYnguIfguKvguKHguJQgKOC4leC5ieC4reC4h+C4o+C4rSBVUkwg4LiC4Lit4LiH4Lir4LiZ4LmJ4Liy4LmB4Lih4LmIIOC4iOC4tuC4h+C5gOC4',
  'm+C5h+C4meC5geC4muC4miBjYWxsYmFjaykgKi8KZnVuY3Rpb24gbG9hZFN0b3JlZChkb25lKXsKICBBVVRILnNlc3Npb24gPSBsc0dldChMU19TRVNTSU9OKTsKICBBVVRILmRldmljZSAgPSBsc0dldChMU19ERVZJQ0UpOwoKICBpZiAod2luZG93Lmdvb2dsZSAm',
  'JiBnb29nbGUuc2NyaXB0ICYmIGdvb2dsZS5zY3JpcHQudXJsKSB7CiAgICB0cnkgewogICAgICBnb29nbGUuc2NyaXB0LnVybC5nZXRMb2NhdGlvbihmdW5jdGlvbihsb2MpewogICAgICAgIHZhciBwID0gKGxvYyAmJiBsb2MucGFyYW1ldGVyKSB8fCB7fTsKICAg',
  'ICAgICBpZiAocC5kICYmICFBVVRILmRldmljZSkgeyBBVVRILmRldmljZSA9IFN0cmluZyhwLmQpOyBsc1NldChMU19ERVZJQ0UsIEFVVEguZGV2aWNlKTsgfQogICAgICAgIGlmIChwLmtleSAmJiAhYWNjZXNzS2V5KCkpIFJFU09MVkVEX0tFWSA9IFN0cmluZyhw',
  'LmtleSk7CiAgICAgICAgZG9uZSgpOwogICAgICB9KTsKICAgICAgcmV0dXJuOwogICAgfSBjYXRjaCAoZSkgeyAvKiDguYPguIrguYnguJfguLLguIfguJvguIHguJXguLQgKi8gfQogIH0KICBkb25lKCk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4LiV4Lix4Lin',
  '4LiE4Li44Lih4Lil4Liz4LiU4Lix4Lia4Lir4LiZ4LmJ4Liy4LiI4LitIC0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKiDguYDguKPguLXguKLguIHguJXguK3guJnguYDguJvguLTguJTguKvguJnguYnguLLguYDguKfguYfguJog4oCUIOC4leC4seC4lOC4quC4tOC4',
  'meC4p+C5iOC4suC4iOC4sOC5g+C4q+C5ieC5gOC4q+C5h+C4meC4reC4sOC5hOC4o+C4geC5iOC4reC4mSAqLwpmdW5jdGlvbiBhdXRoR2F0ZSgpewogIGxvYWRTdG9yZWQoZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2F1dGgubWUnKS50aGVuKGZ1bmN0aW9uKG1l',
  'KXsKICAgICAgQVVUSC5tZSA9IG1lOwogICAgICBpZiAobWUuc2lnbmVkSW4pIHJldHVybiBlbnRlckFwcChtZSk7CiAgICAgIGlmIChBVVRILmRldmljZSkgcmV0dXJuIHNob3dQaW4oKTsKICAgICAgc2hvd0xvZ2luKCk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihl',
  'KXsKICAgICAgc2hvd0xvZ2luKGUubWVzc2FnZSB8fCBlKTsKICAgIH0pOwogIH0pOwp9CgpmdW5jdGlvbiBlbnRlckFwcChtZSl7CiAgQVVUSC5tZSA9IG1lOwogIGhpZGVBdXRoKCk7CiAgYm9vdE5vdygpOwogIC8vIOC5gOC4nuC4tOC5iOC4h+C4peC5h+C4reC4',
  'geC4reC4tOC4meC4lOC5ieC4p+C4ouC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5geC4peC4sOC4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4leC4seC5ieC4hyBQSU4g4Lia4LiZ4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJIOKAlCDguIrguKfguJng',
  'uJXguLHguYnguIfguKrguLHguIHguITguKPguLHguYnguIcKICBpZiAoIUFVVEguZGV2aWNlICYmIG1lLnVzZXJuYW1lICYmICFsc0dldCgnbWNvcm5lci5waW5Bc2tlZCcpKSB7CiAgICBzZXRUaW1lb3V0KG9mZmVyUGluLCA5MDApOwogIH0KfQoKZnVuY3Rpb24g',
  'aGlkZUF1dGgoKXsKICB2YXIgciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdXRoUm9vdCcpOwogIGlmIChyKSByLmlubmVySFRNTCA9ICcnOwogIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbG9ja2VkJyk7Cn0KCmZ1bmN0aW9uIHNob3dBdXRo',
  'KGh0bWwpewogIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnbG9ja2VkJyk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F1dGhSb290JykuaW5uZXJIVE1MID0KICAgICc8ZGl2IGNsYXNzPSJhdXRoLXdyYXAiPjxkaXYgY2xhc3M9ImF1dGgtY2FyZCI+',
  'JyArCiAgICAgICc8ZGl2IGNsYXNzPSJhdXRoLWJyYW5kIj7wn4+iIDxiPicgKyBlc2MoKFMuYm9vdCAmJiBTLmJvb3QuYXBwICYmIFMuYm9vdC5hcHAubmFtZSkgfHwgJ1RoZSBNIENvcm5lciBBUCcpICsgJzwvYj48L2Rpdj4nICsKICAgICAgaHRtbCArCiAgICAn',
  'PC9kaXY+PC9kaXY+JzsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguKvguJnguYnguLLguKXguYfguK3guIHguK3guLTguJnguJTguYnguKfguKLguKPguKvguLHguKrguJzguYjguLLguJkgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gc2hvd0xvZ2luKGVy',
  'cil7CiAgQVVUSC5zY3JlZW4gPSAnbG9naW4nOwogIHNob3dBdXRoKAogICAgJzxoMiBjbGFzcz0iYXV0aC1oIj7guYDguILguYnguLLguKrguLnguYjguKPguLDguJrguJo8L2gyPicgKwogICAgJzxwIGNsYXNzPSJhdXRoLXN1YiI+4LmD4Liq4LmI4LiK4Li34LmI',
  '4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmB4Lil4Liw4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LiX4Li14LmI4LmE4LiU4LmJ4Lij4Lix4LiaPC9wPicgKwogICAgKGVyciA/ICc8ZGl2IGNsYXNzPSJhdXRoLWVyciI+JyArIGVzYyhlcnIpICsgJzwvZGl2PicgOiAn',
  'PGRpdiBjbGFzcz0iYXV0aC1lcnIiIGlkPSJhdXRoRXJyIiBoaWRkZW4+PC9kaXY+JykgKwogICAgJzxkaXYgY2xhc3M9ImF1dGgtZiI+PGxhYmVsIGZvcj0ibGdVc2VyIj7guIrguLfguYjguK3guJzguLnguYnguYPguIrguYk8L2xhYmVsPicgKwogICAgICAnPGlu',
  'cHV0IGNsYXNzPSJpbnAiIGlkPSJsZ1VzZXIiIGF1dG9jb21wbGV0ZT0idXNlcm5hbWUiIGF1dG9jYXBpdGFsaXplPSJub25lIiBzcGVsbGNoZWNrPSJmYWxzZSI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iYXV0aC1mIj48bGFiZWwgZm9yPSJsZ1Bhc3MiPuC4',
  'o+C4q+C4seC4quC4nOC5iOC4suC4mTwvbGFiZWw+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImxnUGFzcyIgdHlwZT0icGFzc3dvcmQiIGF1dG9jb21wbGV0ZT0iY3VycmVudC1wYXNzd29yZCI+PC9kaXY+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0i',
  'YnRuIHByaSBhdXRoLWdvIiBpZD0ibGdHbyI+4LmA4LiC4LmJ4Liy4Liq4Li54LmI4Lij4Liw4Lia4LiaPC9idXR0b24+JyArCiAgICAoQVVUSC5kZXZpY2UgPyAnPGJ1dHRvbiBjbGFzcz0iYnRuIGF1dGgtYWx0IiBvbmNsaWNrPSJzaG93UGluKCkiPuKGkCDguIHg',
  'uKXguLHguJrguYTguJvguYPguIrguYkgUElOPC9idXR0b24+JyA6ICcnKSArCiAgICAnPHAgY2xhc3M9ImF1dGgtZm9vdCI+4Lil4Li34Lih4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZPyDguYPguKvguYnguJzguLnguYnguJTguLnguYHguKXguJXguLHguYnguIfg',
  'uKPguKvguLHguKrguYPguKvguKHguYjguYPguKvguYnguIjguLLguIHguYDguKHguJnguLnguYPguJnguIrguLXguJU8L3A+JwogICk7CgogIHZhciBnbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsZ0dvJyk7CiAgdmFyIHVzZXIgPSBkb2N1bWVudC5nZXRF',
  'bGVtZW50QnlJZCgnbGdVc2VyJyk7CiAgdmFyIHBhc3MgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGdQYXNzJyk7CgogIGZ1bmN0aW9uIHN1Ym1pdCgpewogICAgdmFyIHUgPSB1c2VyLnZhbHVlLnRyaW0oKSwgcCA9IHBhc3MudmFsdWU7CiAgICBpZiAoIXUg',
  'fHwgIXApIHJldHVybiBhdXRoRXJyb3IoJ+C4geC4o+C4uOC4k+C4suC4geC4o+C4reC4geC4l+C4seC5ieC4h+C4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5ieC5geC4peC4sOC4o+C4q+C4seC4quC4nOC5iOC4suC4mScpOwogICAgZ28uZGlzYWJsZWQgPSB0',
  'cnVlOwogICAgZ28uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C4leC4o+C4p+C4iOC4quC4reC4muKApic7CiAgICBjYWxsQXBpKCdhdXRoLmxvZ2luJywgeyB1c2VybmFtZTogdSwgcGFzc3dvcmQ6IHAgfSku',
  'dGhlbihmdW5jdGlvbihyKXsKICAgICAgc2F2ZVNlc3Npb24oci5zZXNzaW9uKTsKICAgICAgaWYgKHIubXVzdENoYW5nZSkgcmV0dXJuIHNob3dDaGFuZ2VQYXNzd29yZCh0cnVlKTsKICAgICAgcmV0dXJuIGNhbGxBcGkoJ2F1dGgubWUnKS50aGVuKGVudGVyQXBw',
  'KTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICBnby5kaXNhYmxlZCA9IGZhbHNlOwogICAgICBnby50ZXh0Q29udGVudCA9ICfguYDguILguYnguLLguKrguLnguYjguKPguLDguJrguJonOwogICAgICBwYXNzLnZhbHVlID0gJyc7CiAgICAgIGF1dGhF',
  'cnJvcihlLm1lc3NhZ2UgfHwgZSk7CiAgICB9KTsKICB9CgogIGdvLm9uY2xpY2sgPSBzdWJtaXQ7CiAgW3VzZXIsIHBhc3NdLmZvckVhY2goZnVuY3Rpb24oZWwpewogICAgZWwuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGV2KXsgaWYgKGV2',
  'LmtleSA9PT0gJ0VudGVyJykgc3VibWl0KCk7IH0pOwogIH0pOwogIHVzZXIuZm9jdXMoKTsKfQoKZnVuY3Rpb24gYXV0aEVycm9yKG1zZyl7CiAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F1dGhFcnInKTsKICBpZiAoZWwpIHsgZWwudGV4dENv',
  'bnRlbnQgPSBtc2c7IGVsLmhpZGRlbiA9IGZhbHNlOyB9CiAgZWxzZSBzaG93TG9naW4obXNnKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguKvguJnguYnguLIgUElOIDYg4Lir4Lil4Lix4LiBIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIHNob3dQaW4o',
  'KXsKICBBVVRILnNjcmVlbiA9ICdwaW4nOwogIEFVVEgucGluID0gJyc7CiAgc2hvd0F1dGgoCiAgICAnPGgyIGNsYXNzPSJhdXRoLWgiPuC5g+C4quC5iCBQSU48L2gyPicgKwogICAgJzxwIGNsYXNzPSJhdXRoLXN1YiI+4Lib4Lil4LiU4Lil4LmH4Lit4LiB4LiU',
  '4LmJ4Lin4Lii4Lij4Lir4Lix4LiqIDYg4Lir4Lil4Lix4LiB4LiC4Lit4LiH4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJPC9wPicgKwogICAgJzxkaXYgY2xhc3M9ImF1dGgtZXJyIiBpZD0iYXV0aEVyciIgaGlkZGVuPjwvZGl2PicgKwogICAgJzxkaXYg',
  'Y2xhc3M9InBpbi1kb3RzIiBpZD0icGluRG90cyI+JyArIHBpbkRvdHNIdG1sKCcnKSArICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJwaW4tcGFkIj4nICsKICAgICAgWzEsMiwzLDQsNSw2LDcsOCw5XS5tYXAoZnVuY3Rpb24obil7CiAgICAgICAgcmV0dXJu',
  'ICc8YnV0dG9uIGNsYXNzPSJwaW4tayIgb25jbGljaz0icGluUHVzaChcJycgKyBuICsgJ1wnKSI+JyArIG4gKyAnPC9idXR0b24+JzsKICAgICAgfSkuam9pbignJykgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0icGluLWsgZ2hvc3QiIG9uY2xpY2s9InNob3dMb2dp',
  'bigpIiB0aXRsZT0i4LmD4LiK4LmJ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmB4LiX4LiZIj7wn5SRPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJwaW4tayIgb25jbGljaz0icGluUHVzaChcJzBcJykiPjA8L2J1dHRvbj4nICsKICAgICAgJzxi',
  'dXR0b24gY2xhc3M9InBpbi1rIGdob3N0IiBvbmNsaWNrPSJwaW5CYWNrKCkiIHRpdGxlPSLguKXguJoiPuKMqzwvYnV0dG9uPicgKwogICAgJzwvZGl2PicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBhdXRoLWFsdCIgb25jbGljaz0iZm9yZ2V0VGhpc0Rldmlj',
  'ZSgpIj7guKXguLfguKEgUElOIOKAlCDguYDguILguYnguLLguJTguYnguKfguKLguKPguKvguLHguKrguJzguYjguLLguJk8L2J1dHRvbj4nCiAgKTsKCiAgLy8g4LiE4Li14Lii4LmM4Lia4Lit4Lij4LmM4LiU4LiI4Lij4Li04LiH4LiB4LmH4LmD4LiK4LmJ4LmE',
  '4LiU4LmJIOC5hOC4oeC5iOC4leC5ieC4reC4h+C4iOC4tOC5ieC4oeC4m+C4uOC5iOC4oeC4muC4meC4iOC4rQogIGRvY3VtZW50Lm9ua2V5ZG93biA9IGZ1bmN0aW9uKGV2KXsKICAgIGlmIChBVVRILnNjcmVlbiAhPT0gJ3BpbicpIHJldHVybjsKICAgIGlmICgv',
  'XlxkJC8udGVzdChldi5rZXkpKSBwaW5QdXNoKGV2LmtleSk7CiAgICBlbHNlIGlmIChldi5rZXkgPT09ICdCYWNrc3BhY2UnKSBwaW5CYWNrKCk7CiAgfTsKfQoKZnVuY3Rpb24gcGluRG90c0h0bWwocGluKXsKICB2YXIgaHRtbCA9ICcnOwogIGZvciAodmFyIGkg',
  'PSAwOyBpIDwgNjsgaSsrKSBodG1sICs9ICc8aSBjbGFzcz0iJyArIChpIDwgcGluLmxlbmd0aCA/ICdvbicgOiAnJykgKyAnIj48L2k+JzsKICByZXR1cm4gaHRtbDsKfQoKZnVuY3Rpb24gcGluUHVzaChkKXsKICBpZiAoQVVUSC5waW4ubGVuZ3RoID49IDYpIHJl',
  'dHVybjsKICBBVVRILnBpbiArPSBkOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaW5Eb3RzJykuaW5uZXJIVE1MID0gcGluRG90c0h0bWwoQVVUSC5waW4pOwogIGlmIChBVVRILnBpbi5sZW5ndGggPT09IDYpIHNldFRpbWVvdXQocGluU3VibWl0LCAxMjAp',
  'Owp9CgpmdW5jdGlvbiBwaW5CYWNrKCl7CiAgQVVUSC5waW4gPSBBVVRILnBpbi5zbGljZSgwLCAtMSk7CiAgdmFyIGQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGluRG90cycpOwogIGlmIChkKSBkLmlubmVySFRNTCA9IHBpbkRvdHNIdG1sKEFVVEgucGlu',
  'KTsKfQoKZnVuY3Rpb24gcGluU3VibWl0KCl7CiAgdmFyIHBpbiA9IEFVVEgucGluOwogIEFVVEgucGluID0gJyc7CiAgdmFyIGRvdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGluRG90cycpOwogIGlmIChkb3RzKSBkb3RzLmNsYXNzTGlzdC5hZGQoJ2J1',
  'c3knKTsKCiAgY2FsbEFwaSgnYXV0aC51bmxvY2snLCB7IGRldmljZTogQVVUSC5kZXZpY2UsIHBpbjogcGluIH0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICBzYXZlU2Vzc2lvbihyLnNlc3Npb24pOwogICAgZG9jdW1lbnQub25rZXlkb3duID0gbnVsbDsKICAgIHJl',
  'dHVybiBjYWxsQXBpKCdhdXRoLm1lJykudGhlbihlbnRlckFwcCk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICB2YXIgbXNnID0gU3RyaW5nKGUubWVzc2FnZSB8fCBlKTsKICAgIGlmIChkb3RzKSB7IGRvdHMuY2xhc3NMaXN0LnJlbW92ZSgnYnVzeScpOyBk',
  'b3RzLmNsYXNzTGlzdC5hZGQoJ3NoYWtlJyk7IGRvdHMuaW5uZXJIVE1MID0gcGluRG90c0h0bWwoJycpOyB9CiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IGlmIChkb3RzKSBkb3RzLmNsYXNzTGlzdC5yZW1vdmUoJ3NoYWtlJyk7IH0sIDUwMCk7CiAgICBhdXRo',
  'RXJyb3IobXNnKTsKICAgIC8vIFBJTiDguJbguLnguIHguKLguIHguYDguKXguLTguIHguYTguJvguYHguKXguYnguKcgKOC4nOC4tOC4lOC4hOC4o+C4muC5guC4hOC4p+C4leC4siAvIOC4q+C4oeC4lOC4reC4suC4ouC4uCkg4oCUIOC4leC5ieC4reC4h+C4geC4',
  'peC4seC4muC5hOC4m+C5g+C4iuC5ieC4o+C4q+C4seC4quC4nOC5iOC4suC4mQogICAgaWYgKC/guKXguYfguK3guIHguK3guLTguJnguJTguYnguKfguKLguKPguKvguLHguKrguJzguYjguLLguJkvLnRlc3QobXNnKSkgewogICAgICBzYXZlRGV2aWNlKCcnKTsK',
  'ICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyBzaG93TG9naW4obXNnKTsgfSwgMTQwMCk7CiAgICB9CiAgfSk7Cn0KCmZ1bmN0aW9uIGZvcmdldFRoaXNEZXZpY2UoKXsKICB2YXIgdG9rZW4gPSBBVVRILmRldmljZTsKICBzYXZlRGV2aWNlKCcnKTsKICBsc1Nl',
  'dCgnbWNvcm5lci5waW5Bc2tlZCcsICcnKTsKICBkb2N1bWVudC5vbmtleWRvd24gPSBudWxsOwogIGlmICh0b2tlbikgY2FsbEFwaSgnYXV0aC5mb3JnZXREZXZpY2UnLCB7IGRldmljZTogdG9rZW4gfSkuY2F0Y2goZnVuY3Rpb24oKXsgLyog4Lir4Lih4LiU4Lit',
  '4Liy4Lii4Li44LmE4Lib4LmB4Lil4LmJ4Lin4LiB4LmH4LiK4LmI4Liy4LiH4Lih4Lix4LiZICovIH0pOwogIHNob3dMb2dpbigpOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4leC4seC5ieC4hyBQSU4gLS0tLS0tLS0tLS0tLS0tLSAqLwoKLyoqIOC4iuC4p+C4',
  'meC4leC4seC5ieC4hyBQSU4g4Lir4Lil4Lix4LiH4Lil4LmH4Lit4LiB4Lit4Li04LiZ4LiE4Lij4Lix4LmJ4LiH4LmB4Lij4LiB4Lia4LiZ4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJICovCmZ1bmN0aW9uIG9mZmVyUGluKCl7CiAgbHNTZXQoJ21jb3Ju',
  'ZXIucGluQXNrZWQnLCAnMScpOwogIG9wZW5Nb2RhbCgn4LiV4Lix4LmJ4LiHIFBJTiDguKrguLPguKvguKPguLHguJrguYDguITguKPguLfguYjguK3guIfguJnguLXguYknLAogICAgJzxwPuC4leC4seC5ieC4h+C4o+C4q+C4seC4qiA2IOC4q+C4peC4seC4geC5',
  'hOC4p+C5iSDguIjguLDguYTguJTguYnguYTguKHguYjguJXguYnguK3guIfguJ7guLTguKHguJ7guYzguKPguKvguLHguKrguJzguYjguLLguJnguJfguLjguIHguITguKPguLHguYnguIfguJfguLXguYjguYDguJvguLTguJQ8L3A+JyArCiAgICAnPHAgY2xhc3M9',
  'Im11dGVkIGZzMTMiPlBJTiDguJzguLnguIHguIHguLHguJrguYDguITguKPguLfguYjguK3guIfguJnguLXguYnguYDguITguKPguLfguYjguK3guIfguYDguJTguLXguKLguKcg4LmA4LiE4Lij4Li34LmI4Lit4LiH4Lit4Li34LmI4LiZ4LmD4LiK4LmJ4LmE4Lih',
  '4LmI4LmE4LiU4LmJIMK3IOC4ouC4geC5gOC4peC4tOC4geC5gOC4oeC4t+C5iOC4reC5hOC4q+C4o+C5iOC4geC5h+C5hOC4lOC5ieC5g+C4meC4q+C4meC5ieC4suC4leC4seC5ieC4h+C4hOC5iOC4sjwvcD4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25j',
  'bGljaz0iY2xvc2VNb2RhbCgpIj7guYTguKfguYnguIHguYjguK3guJk8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCk7Zm9ybVNldFBpbigpIj7guJXguLHguYnguIcgUElOIOC5gOC4peC4ojwvYnV0',
  'dG9uPicpOwp9CgpmdW5jdGlvbiBmb3JtU2V0UGluKCl7CiAgb3Blbk1vZGFsKCfguJXguLHguYnguIcgUElOIDYg4Lir4Lil4Lix4LiBJywKICAgICc8ZGl2IGNsYXNzPSJmZ3JpZCI+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIGZ1bGwiPjxsYWJlbCBmb3I9InBp',
  'bjEiPlBJTiDguYPguKvguKHguYg8L2xhYmVsPicgKwogICAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9InBpbjEiIHR5cGU9InBhc3N3b3JkIiBpbnB1dG1vZGU9Im51bWVyaWMiIG1heGxlbmd0aD0iNiIgJyArCiAgICAgICAgJ2F1dG9jb21wbGV0ZT0ibmV3',
  'LXBhc3N3b3JkIiBwbGFjZWhvbGRlcj0i4oCi4oCi4oCi4oCi4oCi4oCiIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYgZnVsbCI+PGxhYmVsIGZvcj0icGluMiI+4LmD4Liq4LmIIFBJTiDguK3guLXguIHguITguKPguLHguYnguIc8L2xhYmVsPicgKwog',
  'ICAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9InBpbjIiIHR5cGU9InBhc3N3b3JkIiBpbnB1dG1vZGU9Im51bWVyaWMiIG1heGxlbmd0aD0iNiIgJyArCiAgICAgICAgJ2F1dG9jb21wbGV0ZT0ibmV3LXBhc3N3b3JkIiBwbGFjZWhvbGRlcj0i4oCi4oCi4oCi',
  '4oCi4oCi4oCiIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYgZnVsbCI+PGxhYmVsIGZvcj0icGluRGV2Ij7guIrguLfguYjguK3guYDguITguKPguLfguYjguK3guIcgKOC5hOC4p+C5ieC4lOC4ueC4ouC5ieC4reC4meC4q+C4peC4seC4hyk8L2xhYmVs',
  'PicgKwogICAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9InBpbkRldiIgdmFsdWU9IicgKyBlc2MoZ3Vlc3NEZXZpY2VOYW1lKCkpICsgJyI+PC9kaXY+JyArCiAgICAnPC9kaXY+JyArCiAgICAnPHAgY2xhc3M9Im11dGVkIGZzMTMgbXQ4Ij7guKvguKXguLXg',
  'uIHguYDguKXguLXguYjguKLguIfguYDguKXguILguJfguLXguYjguYDguJTguLLguIfguYjguLLguKIg4LmA4LiK4LmI4LiZIDExMTExMSDguKvguKPguLfguK0gMTIzNDU2PC9wPicsCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFs',
  'KCkiPuC4ouC4geC5gOC4peC4tOC4gTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIGlkPSJwaW5HbyI+4Lia4Lix4LiZ4LiX4Li24LiBIFBJTjwvYnV0dG9uPicpOwoKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGluR28nKS5vbmNs',
  'aWNrID0gZnVuY3Rpb24oKXsKICAgIHZhciBhID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpbjEnKS52YWx1ZTsKICAgIHZhciBiID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpbjInKS52YWx1ZTsKICAgIGlmICghL15cZHs2fSQvLnRlc3QoYSkpIHJl',
  'dHVybiB0b2FzdCgnUElOIOC4leC5ieC4reC4h+C5gOC4m+C5h+C4meC4leC4seC4p+C5gOC4peC4giA2IOC4q+C4peC4seC4gScsICdlcnInKTsKICAgIGlmIChhICE9PSBiKSByZXR1cm4gdG9hc3QoJ1BJTiDguKrguK3guIfguIrguYjguK3guIfguYTguKHguYjg',
  'uJXguKPguIfguIHguLHguJknLCAnZXJyJyk7CiAgICB2YXIgYnRuID0gdGhpczsKICAgIGJ0bi5kaXNhYmxlZCA9IHRydWU7CiAgICBidG4uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C4muC4seC4meC4l+C4',
  'tuC4geKApic7CiAgICBjYWxsQXBpKCdhdXRoLnNldFBpbicsIHsgcGluOiBhLCBkZXZpY2U6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaW5EZXYnKS52YWx1ZSB9KS50aGVuKGZ1bmN0aW9uKHIpewogICAgICBzYXZlRGV2aWNlKHIuZGV2aWNlKTsKICAgICAg',
  'Y2xvc2VNb2RhbCgpOwogICAgICB0b2FzdCgn4LiV4Lix4LmJ4LiHIFBJTiDguYDguKPguLXguKLguJrguKPguYnguK3guKIg4oCUIOC4hOC4o+C4seC5ieC4h+C4q+C4meC5ieC4suC5g+C4quC5iOC5geC4hOC5iCA2IOC4q+C4peC4seC4gScsICdvaycpOwogICAg',
  'fSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlOwogICAgICBidG4udGV4dENvbnRlbnQgPSAn4Lia4Lix4LiZ4LiX4Li24LiBIFBJTic7CiAgICAgIHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7CiAgICB9KTsKICB9Owp9',
  'CgpmdW5jdGlvbiBndWVzc0RldmljZU5hbWUoKXsKICB2YXIgdWEgPSBuYXZpZ2F0b3IudXNlckFnZW50IHx8ICcnOwogIGlmICgvaVBob25lLy50ZXN0KHVhKSkgcmV0dXJuICdpUGhvbmUnOwogIGlmICgvaVBhZC8udGVzdCh1YSkpIHJldHVybiAnaVBhZCc7CiAg',
  'aWYgKC9BbmRyb2lkLy50ZXN0KHVhKSkgcmV0dXJuICdBbmRyb2lkJzsKICBpZiAoL01hY2ludG9zaC8udGVzdCh1YSkpIHJldHVybiAnTWFjJzsKICBpZiAoL1dpbmRvd3MvLnRlc3QodWEpKSByZXR1cm4gJ1dpbmRvd3MnOwogIHJldHVybiAn4Lit4Li44Lib4LiB',
  '4Lij4LiT4LmM4LiC4Lit4LiH4LiJ4Lix4LiZJzsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguYDguJvguKXguLXguYjguKLguJnguKPguKvguLHguKrguJzguYjguLLguJkgLS0tLS0tLS0tLS0tLS0tLSAqLwoKLyoqIEBwYXJhbSB7Ym9vbGVhbn0gZm9yY2VkIHRy',
  'dWUgPSDguKPguLDguJrguJrguJrguLHguIfguITguLHguJrguYDguJvguKXguLXguYjguKLguJnguJXguK3guJnguKXguYfguK3guIHguK3guLTguJnguITguKPguLHguYnguIfguYHguKPguIEgKi8KZnVuY3Rpb24gc2hvd0NoYW5nZVBhc3N3b3JkKGZvcmNlZCl7',
  'CiAgaWYgKCFmb3JjZWQpIHJldHVybiBmb3JtQ2hhbmdlUGFzc3dvcmQoKTsKICBBVVRILnNjcmVlbiA9ICdjaGFuZ2UnOwogIHNob3dBdXRoKAogICAgJzxoMiBjbGFzcz0iYXV0aC1oIj7guJXguLHguYnguIfguKPguKvguLHguKrguJzguYjguLLguJnguILguK3g',
  'uIfguITguLjguJPguYDguK3guIc8L2gyPicgKwogICAgJzxwIGNsYXNzPSJhdXRoLXN1YiI+4Lij4Lir4Lix4Liq4LiX4Li14LmI4LmE4LiU4LmJ4Lih4Liy4LmA4Lib4LmH4LiZ4Lij4Lir4Lix4Liq4LiK4Lix4LmI4Lin4LiE4Lij4Liy4LinIOC5gOC4m+C4peC4',
  'teC5iOC4ouC4meC4geC5iOC4reC4meC5g+C4iuC5ieC4h+C4suC4meC4q+C4meC4tuC5iOC4h+C4hOC4o+C4seC5ieC4hzwvcD4nICsKICAgICc8ZGl2IGNsYXNzPSJhdXRoLWVyciIgaWQ9ImF1dGhFcnIiIGhpZGRlbj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNz',
  'PSJhdXRoLWYiPjxsYWJlbCBmb3I9ImNwT2xkIj7guKPguKvguLHguKrguJzguYjguLLguJnguYDguJTguLTguKE8L2xhYmVsPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJjcE9sZCIgdHlwZT0icGFzc3dvcmQiIGF1dG9jb21wbGV0ZT0iY3VycmVu',
  'dC1wYXNzd29yZCI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iYXV0aC1mIj48bGFiZWwgZm9yPSJjcE5ldyI+4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmIICjguK3guKLguYjguLLguIfguJnguYnguK3guKIgOCDguJXguLHguKcpPC9sYWJl',
  'bD4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0iY3BOZXciIHR5cGU9InBhc3N3b3JkIiBhdXRvY29tcGxldGU9Im5ldy1wYXNzd29yZCI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iYXV0aC1mIj48bGFiZWwgZm9yPSJjcE5ldzIiPuC5g+C4quC5',
  'iOC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iOC4reC4teC4geC4hOC4o+C4seC5ieC4hzwvbGFiZWw+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImNwTmV3MiIgdHlwZT0icGFzc3dvcmQiIGF1dG9jb21wbGV0ZT0ibmV3LXBhc3N3',
  'b3JkIj48L2Rpdj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIGF1dGgtZ28iIGlkPSJjcEdvIj7guJrguLHguJnguJfguLbguIHguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYg8L2J1dHRvbj4nCiAgKTsKCiAgZG9jdW1lbnQuZ2V0RWxl',
  'bWVudEJ5SWQoJ2NwR28nKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsKICAgIHZhciBvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NwT2xkJykudmFsdWU7CiAgICB2YXIgbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjcE5ldycpLnZhbHVlOwogICAgdmFy',
  'IG4yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NwTmV3MicpLnZhbHVlOwogICAgaWYgKG4ubGVuZ3RoIDwgOCkgcmV0dXJuIGF1dGhFcnJvcign4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmI4LiV4LmJ4Lit4LiH4Lii4Liy4Lin4Lit4Lii',
  '4LmI4Liy4LiH4LiZ4LmJ4Lit4LiiIDgg4LiV4Lix4Lin4Lit4Lix4LiB4Lip4LijJyk7CiAgICBpZiAobiAhPT0gbjIpIHJldHVybiBhdXRoRXJyb3IoJ+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iOC4quC4reC4h+C4iuC5iOC4reC4h+C5hOC4',
  'oeC5iOC4leC4o+C4h+C4geC4seC4mScpOwogICAgdmFyIGJ0biA9IHRoaXM7CiAgICBidG4uZGlzYWJsZWQgPSB0cnVlOwogICAgYnRuLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDguIHguLPguKXguLHguIfguJrguLHguJnguJfguLbg',
  'uIHigKYnOwogICAgY2FsbEFwaSgnYXV0aC5jaGFuZ2VQYXNzd29yZCcsIHsgb2xkUGFzc3dvcmQ6IG8sIG5ld1Bhc3N3b3JkOiBuIH0pLnRoZW4oZnVuY3Rpb24oKXsKICAgICAgcmV0dXJuIGNhbGxBcGkoJ2F1dGgubWUnKS50aGVuKGVudGVyQXBwKTsKICAgIH0p',
  'LnRoZW4oZnVuY3Rpb24oKXsKICAgICAgdG9hc3QoJ+C5gOC4m+C4peC4teC5iOC4ouC4meC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5gOC4o+C4teC4ouC4muC4o+C5ieC4reC4oicsICdvaycpOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgIGJ0bi5k',
  'aXNhYmxlZCA9IGZhbHNlOwogICAgICBidG4udGV4dENvbnRlbnQgPSAn4Lia4Lix4LiZ4LiX4Li24LiB4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmIJzsKICAgICAgYXV0aEVycm9yKGUubWVzc2FnZSB8fCBlKTsKICAgIH0pOwogIH07CiAgZG9j',
  'dW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NwT2xkJykuZm9jdXMoKTsKfQoKZnVuY3Rpb24gZm9ybUNoYW5nZVBhc3N3b3JkKCl7CiAgb3Blbk1vZGFsKCfguYDguJvguKXguLXguYjguKLguJnguKPguKvguLHguKrguJzguYjguLLguJknLAogICAgJzxkaXYgY2xhc3M9',
  'ImZncmlkIj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYgZnVsbCI+PGxhYmVsIGZvcj0ibWNPbGQiPuC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5gOC4lOC4tOC4oTwvbGFiZWw+PGlucHV0IGNsYXNzPSJpbnAiIGlkPSJtY09sZCIgdHlwZT0icGFzc3dvcmQiPjwv',
  'ZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiBmdWxsIj48bGFiZWwgZm9yPSJtY05ldyI+4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmIICjguK3guKLguYjguLLguIfguJnguYnguK3guKIgOCDguJXguLHguKcpPC9sYWJlbD48aW5wdXQgY2xh',
  'c3M9ImlucCIgaWQ9Im1jTmV3IiB0eXBlPSJwYXNzd29yZCI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIGZ1bGwiPjxsYWJlbCBmb3I9Im1jTmV3MiI+4LmD4Liq4LmI4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmI4Lit4Li14LiB4LiE',
  '4Lij4Lix4LmJ4LiHPC9sYWJlbD48aW5wdXQgY2xhc3M9ImlucCIgaWQ9Im1jTmV3MiIgdHlwZT0icGFzc3dvcmQiPjwvZGl2PicgKwogICAgJzwvZGl2PicsCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4',
  'peC4tOC4gTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIGlkPSJtY0dvIj7guJrguLHguJnguJfguLbguIE8L2J1dHRvbj4nKTsKCiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21jR28nKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsKICAg',
  'IHZhciBuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21jTmV3JykudmFsdWU7CiAgICBpZiAobi5sZW5ndGggPCA4KSByZXR1cm4gdG9hc3QoJ+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iOC4leC5ieC4reC4h+C4ouC4suC4p+C4reC4ouC5',
  'iOC4suC4h+C4meC5ieC4reC4oiA4IOC4leC4seC4p+C4reC4seC4geC4qeC4oycsICdlcnInKTsKICAgIGlmIChuICE9PSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWNOZXcyJykudmFsdWUpIHJldHVybiB0b2FzdCgn4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ',
  '4LmD4Lir4Lih4LmI4Liq4Lit4LiH4LiK4LmI4Lit4LiH4LmE4Lih4LmI4LiV4Lij4LiH4LiB4Lix4LiZJywgJ2VycicpOwogICAgdmFyIGJ0biA9IHRoaXM7CiAgICBidG4uZGlzYWJsZWQgPSB0cnVlOwogICAgY2FsbEFwaSgnYXV0aC5jaGFuZ2VQYXNzd29yZCcs',
  'IHsKICAgICAgb2xkUGFzc3dvcmQ6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtY09sZCcpLnZhbHVlLCBuZXdQYXNzd29yZDogbgogICAgfSkudGhlbihmdW5jdGlvbigpewogICAgICBjbG9zZU1vZGFsKCk7CiAgICAgIHRvYXN0KCfguYDguJvguKXguLXguYjg',
  'uKLguJnguKPguKvguLHguKrguJzguYjguLLguJnguYDguKPguLXguKLguJrguKPguYnguK3guKInLCAnb2snKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTsKICAgICAgdG9hc3QoZS5tZXNzYWdlIHx8IGUsICdl',
  'cnInKTsKICAgIH0pOwogIH07Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4Lit4Lit4LiB4LiI4Liy4LiB4Lij4Liw4Lia4LiaIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIGRvTG9nb3V0KGtlZXBQaW4pewogIHZhciBzID0gQVVUSC5zZXNzaW9uOwogIHNh',
  'dmVTZXNzaW9uKCcnKTsKICBpZiAoIWtlZXBQaW4pIHsgdmFyIGQgPSBBVVRILmRldmljZTsgc2F2ZURldmljZSgnJyk7IGlmIChkKSBjYWxsQXBpKCdhdXRoLmZvcmdldERldmljZScsIHsgZGV2aWNlOiBkIH0pLmNhdGNoKGZ1bmN0aW9uKCl7fSk7IH0KICBpZiAo',
  'cykgY2FsbEFwaSgnYXV0aC5sb2dvdXQnLCB7IF9zZXNzaW9uOiBzIH0pLmNhdGNoKGZ1bmN0aW9uKCl7IC8qIOC4q+C4oeC4lOC4reC4suC4ouC4uOC5geC4peC5ieC4p+C4geC5h+C4luC4t+C4reC4p+C5iOC4suC4reC4reC4geC5geC4peC5ieC4pyAqLyB9KTsK',
  'ICBjbG9zZU1vZGFsKCk7CiAgQVVUSC5tZSA9IG51bGw7CiAgaWYgKEFVVEguZGV2aWNlKSBzaG93UGluKCk7IGVsc2Ugc2hvd0xvZ2luKCk7Cn0KCmZ1bmN0aW9uIGNvbmZpcm1Mb2dvdXQoKXsKICBvcGVuTW9kYWwoJ+C4reC4reC4geC4iOC4suC4geC4o+C4sOC4',
  'muC4micsCiAgICAnPHA+4LiV4LmJ4Lit4LiH4LiB4Liy4Lij4Lit4Lit4LiB4LiI4Liy4LiB4Lij4Liw4Lia4Lia4LmD4LiK4LmI4LmE4Lir4LihPC9wPicgKwogICAgKEFVVEguZGV2aWNlID8gJzxwIGNsYXNzPSJtdXRlZCBmczEzIj5QSU4g4Lia4LiZ4LmA4LiE',
  '4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJ4LiI4Liw4Lii4Lix4LiH4Lit4Lii4Li54LmIIOC4hOC4o+C4seC5ieC4h+C4q+C4meC5ieC4suC5gOC4guC5ieC4suC4lOC5ieC4p+C4oiBQSU4g4LmE4LiU4LmJ4LmA4Lil4LiiPC9wPicgOiAnJyksCiAgICAnPGJ1dHRv',
  'biBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4gTwvYnV0dG9uPicgKwogICAgKEFVVEguZGV2aWNlID8gJzxidXR0b24gY2xhc3M9ImJ0biBkZ3IiIG9uY2xpY2s9ImRvTG9nb3V0KGZhbHNlKSI+4Lit4Lit4LiB4LmB',
  '4Lil4Liw4Lil4LiaIFBJTjwvYnV0dG9uPicgOiAnJykgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImRvTG9nb3V0KHRydWUpIj7guK3guK3guIHguIjguLLguIHguKPguLDguJrguJo8L2J1dHRvbj4nKTsKfQo8L3NjcmlwdD4KPHNjcmlw',
  'dD4KLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIFZpZXdzLmh0bWwg4oCUIOC4leC4seC4p+C5guC4q+C4peC4lCArIOC4leC4seC4p+C4p+C4suC4lOC4guC4reC4h+C5geC4leC5iOC4peC4sOC4',
  'q+C4meC5ieC4sgogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCnZhciBST1VURVMgPSB7fTsKCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PQogICAxKSDguKDguLLguJ7guKPguKfguKEKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5kYXNoYm9hcmQgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsgcmV0dXJuIGNh',
  'bGxBcGkoJ2FwcC5kYXNoYm9hcmQnLCB7IHllYXI6IFMueWVhciB9KTsgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIGIgPSBkLmJ1aWxkaW5nOwogICAgdmFyIGtwaXMgPQogICAgICBrcGkoJ+C4ouC4reC4lOC4q+C4meC4teC5ieC4hOC4h+C5gOC4',
  'q+C4peC4t+C4reC4l+C4seC5ieC4h+C4q+C4oeC4lCcsIGJhaHQoZC5kZWJ0QWxsLnJlbWFpbmluZyksCiAgICAgICAgICAn4LiI4Liy4LiB4Lii4Lit4LiU4Lir4LiZ4Li14LmJICcgKyBiYWh0KGQuZGVidEFsbC50b3RhbERlYnQpICsgJyDCtyDguIrguLPguKPg',
  'uLDguYHguKXguYnguKcgJyArIHBjdChkLmRlYnRBbGwucGVyY2VudCksICdhY2NlbnQnKSArCiAgICAgIGtwaSgn4LiK4Liz4Lij4Liw4LmB4Lil4LmJ4LinICjguKvguJnguLXguYnguKvguKXguLHguIEpJywgcGN0KGQuZGVidE1haW4ucGVyY2VudCksIGJhaHQo',
  'ZC5kZWJ0TWFpbi5wYWlkKSArICcg4LiI4Liy4LiBICcgKyBiYWh0KGQuZGVidE1haW4udG90YWwpLCAnZ29vZCcpICsKICAgICAga3BpKCfguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguJvguLUgJyArIGQueWVhciwgYmFodChkLnNwZW5kVGhpc1llYXIp',
  'LCAn4LiL4Li34LmJ4Lit4LiC4Lit4LiHICsg4LiL4LmI4Lit4Lih4LmB4LiL4LihICsg4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJykgKwogICAgICBrcGkoJ+C4h+C4suC4meC4i+C5iOC4reC4oeC4hOC5ieC4suC4hycsIGQucmVwYWlycy5vcGVuSm9icyArICcg',
  '4LiH4Liy4LiZJywgZC5yZXBhaXJzLm92ZXJkdWUgKyAnIOC4h+C4suC4meC5gOC4geC4tOC4meC4geC4s+C4q+C4meC4lCcsIGQucmVwYWlycy5vdmVyZHVlID8gJ2JhZCcgOiAnJyk7CgogICAgdmFyIGFsZXJ0cyA9IGQuYWxlcnRzLmxlbmd0aAogICAgICA/ICc8',
  'ZGl2IGNsYXNzPSJhbGlzdCI+JyArIGQuYWxlcnRzLnNsaWNlKDAsMTIpLm1hcChmdW5jdGlvbihhKXsKICAgICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0iYWxpIGwtJyArIGEubGV2ZWwgKyAnIiBvbmNsaWNrPSJnbyhcJycgKyBqdW1wUGFnZShhLm1vZHVsZSkg',
  'KyAnXCcpIj4nICsKICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0iaWMiPicgKyBhLmljb24gKyAnPC9kaXY+PGRpdj48ZGl2IGNsYXNzPSJ0dCI+JyArIGVzYyhhLnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0iZGQi',
  'PicgKyBlc2MoYS5kZXRhaWwpICsgJzwvZGl2PjwvZGl2PjwvZGl2Pic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JwogICAgICA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj7inIU8L2Rpdj7guYTguKHguYjguKHguLXguIfguLLg',
  'uJnguITguYnguLLguIcg4oCUIOC4l+C4uOC4geC4reC4ouC5iOC4suC4h+C5gOC4o+C4teC4ouC4muC4o+C5ieC4reC4ojwvZGl2Pic7CgogICAgcmV0dXJuICcnICsKICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArIGtwaXMgKyAnPC9kaXY+JyAr',
  'CgogICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMiBtYjEyIj4nICsKICAgICAgICBjYXJkKCfwn5KwIOC4o+C4suC4ouC4geC4suC4o+C4quC4o+C4uOC4m+C4o+C4p+C4oSAo4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiBKScsCiAgICAgICAgICBkZWJ0TWluaShkLmRl',
  'YnRNYWluLCAnZGVidE1haW4nKSwKICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImdvKFwnZGVidE1haW5cJykiPuC4lOC4ueC4l+C4seC5ieC4h+C4q+C4oeC4lCDihpI8L2J1dHRvbj4nKSArCiAgICAgICAgY2FyZCgn8J+nviDguKvg',
  'uJnguLXguYnguKrguLTguJkgKOC4q+C4meC4teC5ieC4o+C4reC4hyknLAogICAgICAgICAgZGVidE1pbmkoZC5kZWJ0U3ViLCAnZGVidFN1YicpICsKICAgICAgICAgIChkLmRlYnRTdWIuaW50ZXJlc3RUaGlzWWVhciA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVk',
  'IG10OCI+4LiU4Lit4LiB4LmA4Lia4Li14LmJ4Lii4LiX4Li14LmI4LiK4Liz4Lij4Liw4Lib4Li1ICcgKyBkLnllYXIgKyAnOiA8Yj4nICsgYmFodChkLmRlYnRTdWIuaW50ZXJlc3RUaGlzWWVhcikgKyAnPC9iPjwvZGl2PicgOiAnJyksCiAgICAgICAgICAnPGJ1',
  'dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJnbyhcJ2RlYnRTdWJcJykiPuC4lOC4ueC4l+C4seC5ieC4h+C4q+C4oeC4lCDihpI8L2J1dHRvbj4nKSArCiAgICAgICc8L2Rpdj4nICsKCiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAg',
  'ICAgIGtwaSgn4Lir4LmJ4Lit4LiH4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJywgYi50b3RhbFJvb21zICsgJyDguKvguYnguK3guIcnLCAn4Lih4Li14Lic4Li54LmJ4LmA4LiK4LmI4LiyICcgKyBiLm9jY3VwaWVkICsgJyDCtyDguKfguYjguLLguIcgJyArIGIudmFj',
  'YW50KSArCiAgICAgICAga3BpKCfguKXguYnguLLguIfguYHguK3guKPguYzguJvguLUgJyArIGQueWVhciwgZC5hYy5yb29tc0RvbmUgKyAnLycgKyBiLnRvdGFsUm9vbXMgKyAnIOC4q+C5ieC4reC4hycsIGQuYWMuZG9uZUluWWVhciArICcg4Lij4Lit4LiaIMK3',
  'IOC4hOC5ieC4suC4hyAnICsgZC5hYy5yb29tc1BlbmRpbmcgKyAnIOC4q+C5ieC4reC4hycsIGQuYWMucm9vbXNQZW5kaW5nID8gJ3dhcm4nIDogJ2dvb2QnKSArCiAgICAgICAga3BpKCfguIvguLfguYnguK3guILguK3guIfguJvguLUgJyArIGQueWVhciwgYmFo',
  'dChkLnB1cmNoYXNlcy55ZWFyVG90YWwpLCBkLnB1cmNoYXNlcy55ZWFyQ291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4oycpICsKICAgICAgICBrcGkoJ+C4m+C4o+C4sOC4geC4seC4meC5g+C4geC4peC5ieC4q+C4oeC4lCcsIGQucHVyY2hhc2VzLndhcnJhbnR5',
  'LmV4cGlyaW5nICsgJyDguKPguLLguKLguIHguLLguKMnLCAn4Lir4Lih4LiU4Lit4Liy4Lii4Li44LmB4Lil4LmJ4LinICcgKyBkLnB1cmNoYXNlcy53YXJyYW50eS5leHBpcmVkLCBkLnB1cmNoYXNlcy53YXJyYW50eS5leHBpcmluZyA/ICd3YXJuJyA6ICcnKSAr',
  'CiAgICAgICc8L2Rpdj4nICsKCiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGcyIG1iMTIiPicgKwogICAgICAgIGNhcmQoJ/Cfk5Ig4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4ouC4q+C4rSDguJvguLUgJyArIGQueWVhciwKICAgICAgICAg',
  'ICc8ZGl2IGNsYXNzPSJncmlkIGczIG1iMTIiPicgKwogICAgICAgICAgICBrcGkoJ+C4o+C4suC4ouC4o+C4seC4micsIGJhaHQoZC5maW5hbmNlLmluY29tZSksICfguYDguInguKXguLXguYjguKIgJyArIGJhaHQoZC5maW5hbmNlLmF2Z0luY29tZSkgKyAnL+C5',
  'gOC4lOC4t+C4reC4mScsICdnb29kJykgKwogICAgICAgICAgICBrcGkoJ+C4o+C4suC4ouC4iOC5iOC4suC4oicsIGJhaHQoZC5maW5hbmNlLmV4cGVuc2UpLCAn4LmA4LiJ4Lil4Li14LmI4LiiICcgKyBiYWh0KGQuZmluYW5jZS5hdmdFeHBlbnNlKSArICcv4LmA',
  '4LiU4Li34Lit4LiZJywgJ2JhZCcpICsKICAgICAgICAgICAga3BpKCfguITguIfguYDguKvguKXguLfguK3guKrguLjguJfguJjguLQnLCBiYWh0KGQuZmluYW5jZS5uZXQpLCAn4Lit4Lix4LiV4Lij4Liy4LiB4Liz4LmE4LijICcgKyBwY3QoZC5maW5hbmNlLm1h',
  'cmdpbikpICsKICAgICAgICAgICc8L2Rpdj4nICsgbWluaU1vbnRoQ2hhcnQoZC5maW5hbmNlLmJ5TW9udGgpLAogICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZ28oXCdmaW5hbmNlXCcpIj7guJTguLnguJfguLHguYnguIfguKvguKHg',
  'uJQg4oaSPC9idXR0b24+JykgKwogICAgICAgIGNhcmQoJ/Cfl5PvuI8g4LiH4Liy4LiZ4LiX4Li14LmI4LiB4Liz4Lil4Lix4LiH4LiI4Liw4LiW4Li24LiHICgnICsgZC51cGNvbWluZy5sZW5ndGggKyAnKScsCiAgICAgICAgICBkLnVwY29taW5nLmxlbmd0aCA/',
  'ICc8ZGl2IGNsYXNzPSJhbGlzdCI+JyArIGQudXBjb21pbmcuc2xpY2UoMCw3KS5tYXAoZnVuY3Rpb24odSl7CiAgICAgICAgICAgIHZhciBsdmwgPSB1LmRheXNMZWZ0IDwgMCA/ICdkYW5nZXInIDogKHUuZGF5c0xlZnQgPD0gNyA/ICd3YXJuJyA6ICdpbmZvJyk7',
  'CiAgICAgICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0iYWxpIGwtJyArIGx2bCArICciIG9uY2xpY2s9ImdvKFwnJyArIGp1bXBQYWdlKHUubW9kdWxlKSArICdcJykiPicgKwogICAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJpYyI+JyArIHUuaWNvbiArICc8L2Rp',
  'dj48ZGl2PjxkaXYgY2xhc3M9InR0Ij4nICsgZXNjKHUudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJkZCI+JyArIHRoRGF0ZSh1LmRhdGUpICsgJyDCtyAnICsKICAgICAgICAgICAgICAgICh1LmRheXNMZWZ0IDwgMCA/ICfg',
  'uYDguKXguKLguIHguLPguKvguJnguJQgJyArICgtdS5kYXlzTGVmdCkgKyAnIOC4p+C4seC4mScgOiAodS5kYXlzTGVmdCA9PT0gMCA/ICfguKfguLHguJnguJnguLXguYknIDogJ+C4reC4teC4gSAnICsgdS5kYXlzTGVmdCArICcg4Lin4Lix4LiZJykpICsKICAg',
  'ICAgICAgICAgICAnPC9kaXY+PC9kaXY+PC9kaXY+JzsKICAgICAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPjxkaXYgY2xhc3M9ImJpZyI+8J+MpO+4jzwvZGl2PuC5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4meC4seC4',
  'lOC4q+C4oeC4suC4ouC5gOC4o+C5h+C4pyDguYYg4LiZ4Li14LmJPC9kaXY+JywKICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImdvKFwncmVwb3J0c1wnKSI+4Lib4LiP4Li04LiX4Li04LiZ4LmA4LiV4LmH4LihIOKGkjwvYnV0dG9u',
  'PicsIHRydWUpICsKICAgICAgJzwvZGl2PicgKwoKICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzIiPicgKwogICAgICAgIGNhcmQoJ/CflJQg4Liq4Li04LmI4LiH4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LiX4LizICgnICsgZC5hbGVydHMubGVuZ3RoICsgJyknLCBh',
  'bGVydHMsICcnLCB0cnVlKSArCiAgICAgICAgY2FyZCgn8J+PoiDguIfguLLguJnguIvguYjguK3guKHguYHguIvguKHguJXguLbguIHguYLguJTguKLguKPguKfguKEnLAogICAgICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzIiPicgKwogICAgICAgICAgICBrcGko',
  'J+C4h+C4suC4meC4m+C4tSAnICsgZC55ZWFyLCBkLmJ1aWxkaW5nUmVwYWlycy55ZWFyQ291bnQgKyAnIOC4h+C4suC4mScsICfguITguYnguLLguIcgJyArIGQuYnVpbGRpbmdSZXBhaXJzLm9wZW5Db3VudCkgKwogICAgICAgICAgICBrcGkoJ+C4hOC5iOC4suC5',
  'g+C4iuC5ieC4iOC5iOC4suC4oicsIGJhaHQoZC5idWlsZGluZ1JlcGFpcnMueWVhckNvc3QpLCAn4LiE4Lij4Lia4LiB4Liz4Lir4LiZ4LiU4LmA4Lij4LmH4LinIOC5hiDguJnguLXguYkgJyArIGQuYnVpbGRpbmdSZXBhaXJzLnVwY29taW5nKSArCiAgICAgICAg',
  'ICAnPC9kaXY+JyArCiAgICAgICAgICAoZC5kZWJ0TWFpbi5mb3JlY2FzdCAmJiBkLmRlYnRNYWluLmZvcmVjYXN0Lm1vbnRoc0xlZnQKICAgICAgICAgICAgPyAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PjxkaXYgY2xhc3M9ImZzMTMiPjxiPuC4m+C4o+C4sOC4oeC4',
  'suC4k+C4geC4suC4o+C4m+C4tOC4lOC4q+C4meC4teC5ieC4q+C4peC4seC4gTwvYj48ZGl2IGNsYXNzPSJtdXRlZCBtdDgiPicgKwogICAgICAgICAgICAgICfguIjguLLguIHguK3guLHguJXguKPguLLguIrguLPguKPguLDguYDguInguKXguLXguYjguKIgJyAr',
  'IGJhaHQoZC5kZWJ0TWFpbi5mb3JlY2FzdC5hdmdQZXJNb250aCkgKyAnL+C5gOC4lOC4t+C4reC4mSAoMTIg4LmA4LiU4Li34Lit4LiZ4Lil4LmI4Liy4Liq4Li44LiUKSAnICsKICAgICAgICAgICAgICAn4LiE4Liy4LiU4Lin4LmI4Liy4Lit4Li14LiBIDxiPicg',
  'KyBkLmRlYnRNYWluLmZvcmVjYXN0Lm1vbnRoc0xlZnQgKyAnIOC5gOC4lOC4t+C4reC4mTwvYj4gJyArCiAgICAgICAgICAgICAgJyjguKPguLLguKcgJyArIHRoRGF0ZShkLmRlYnRNYWluLmZvcmVjYXN0LnBheW9mZkRhdGUpICsgJyk8L2Rpdj48L2Rpdj4nCiAg',
  'ICAgICAgICAgIDogJycpLAogICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZ28oXCdidWlsZGluZ1wnKSI+4LiU4Li54LiX4Lix4LmJ4LiH4Lir4Lih4LiUIOKGkjwvYnV0dG9uPicpICsKICAgICAgJzwvZGl2Pic7CiAgfSwKICBhZnRl',
  'cjogZnVuY3Rpb24oKXsKICAgIC8vIOC4leC4seC4p+C5gOC4peC4guC4muC4meC5gOC4oeC4meC4ueC4reC4seC4m+C5gOC4lOC4leC4iOC4suC4geC4qOC4ueC4meC4ouC5jOC5geC4iOC5ieC4h+C5gOC4leC4t+C4reC4mSAocmVmcmVzaEFsZXJ0cykg4LiX4Li4',
  '4LiB4Lir4LiZ4LmJ4LiyIOC5hOC4oeC5iOC5g+C4iuC5iOC5gOC4ieC4nuC4suC4sOC4q+C4meC5ieC4suC4meC4teC5iQogICAgcmVmcmVzaEFsZXJ0cygpOwogIH0KfTsKCmZ1bmN0aW9uIG1pbmlNb250aENoYXJ0KGJ5TW9udGgpewogIHZhciBtYXggPSBNYXRo',
  'Lm1heC5hcHBseShudWxsLCBieU1vbnRoLm1hcChmdW5jdGlvbihtKXsgcmV0dXJuIE1hdGgubWF4KG0uaW5jb21lLCBtLmV4cGVuc2UpOyB9KSkgfHwgMTsKICByZXR1cm4gJzxkaXYgc3R5bGU9ImRpc3BsYXk6ZmxleDtnYXA6M3B4O2FsaWduLWl0ZW1zOmZsZXgt',
  'ZW5kO2hlaWdodDo3NHB4Ij4nICsgYnlNb250aC5tYXAoZnVuY3Rpb24obSl7CiAgICB2YXIgaGkgPSBNYXRoLnJvdW5kKG0uaW5jb21lIC8gbWF4ICogNjYpLCBoZSA9IE1hdGgucm91bmQobS5leHBlbnNlIC8gbWF4ICogNjYpOwogICAgcmV0dXJuICc8ZGl2IHN0',
  'eWxlPSJmbGV4OjE7dGV4dC1hbGlnbjpjZW50ZXIiIHRpdGxlPSInICsgbS5sYWJlbCArICcgwrcg4Lij4Lix4LiaICcgKyBtb25leShtLmluY29tZSkgKyAnIMK3IOC4iOC5iOC4suC4oiAnICsgbW9uZXkobS5leHBlbnNlKSArICciPicgKwogICAgICAnPGRpdiBz',
  'dHlsZT0iZGlzcGxheTpmbGV4O2dhcDoxcHg7YWxpZ24taXRlbXM6ZmxleC1lbmQ7anVzdGlmeS1jb250ZW50OmNlbnRlcjtoZWlnaHQ6NjZweCI+JyArCiAgICAgICAgJzxkaXYgc3R5bGU9IndpZHRoOjZweDtoZWlnaHQ6JyArIGhpICsgJ3B4O2JhY2tncm91bmQ6',
  'dmFyKC0tb2spO2JvcmRlci1yYWRpdXM6MnB4IDJweCAwIDAiPjwvZGl2PicgKwogICAgICAgICc8ZGl2IHN0eWxlPSJ3aWR0aDo2cHg7aGVpZ2h0OicgKyBoZSArICdweDtiYWNrZ3JvdW5kOnZhcigtLWRhbmdlcik7Ym9yZGVyLXJhZGl1czoycHggMnB4IDAgMCI+',
  'PC9kaXY+JyArCiAgICAgICc8L2Rpdj48ZGl2IGNsYXNzPSJmYWludCIgc3R5bGU9ImZvbnQtc2l6ZTo5LjVweCI+JyArIG0ubGFiZWwucmVwbGFjZSgnLicsJycpICsgJzwvZGl2PjwvZGl2Pic7CiAgfSkuam9pbignJykgKyAnPC9kaXY+JyArCiAgJzxkaXYgY2xh',
  'c3M9InJvdyBmczEyIG11dGVkIG10OCI+PHNwYW4gY2xhc3M9ImIgb2siPuC4o+C4suC4ouC4o+C4seC4mjwvc3Bhbj48c3BhbiBjbGFzcz0iYiBkZ3IiPuC4o+C4suC4ouC4iOC5iOC4suC4ojwvc3Bhbj48L2Rpdj4nOwp9CgpmdW5jdGlvbiBkZWJ0TWluaSh4LCBw',
  'YWdlKXsKICByZXR1cm4gJzxkaXYgY2xhc3M9InBtZXRhIiBzdHlsZT0ibWFyZ2luOjAgMCA2cHgiPjxzcGFuPuC4iuC4s+C4o+C4sOC5geC4peC5ieC4pyA8Yj4nICsgYmFodCh4LnBhaWQpICsgJzwvYj48L3NwYW4+JyArCiAgICAgICAgICc8c3Bhbj48Yj4nICsg',
  'cGN0KHgucGVyY2VudCkgKyAnPC9iPjwvc3Bhbj48L2Rpdj4nICsKICAgICAgICAgcHJvZ3Jlc3MoeC5wZXJjZW50LCAnbGcnKSArCiAgICAgICAgICc8ZGl2IGNsYXNzPSJwbWV0YSI+PHNwYW4+4LiE4LiH4LmA4Lir4Lil4Li34LitIDxiPicgKyBiYWh0KHgucmVt',
  'YWluaW5nKSArICc8L2I+PC9zcGFuPicgKwogICAgICAgICAnPHNwYW4+4Lii4Lit4LiU4Lir4LiZ4Li14LmJ4LiX4Lix4LmJ4LiH4Lir4Lih4LiUIDxiPicgKyBiYWh0KHgudG90YWwpICsgJzwvYj48L3NwYW4+PC9kaXY+JyArCiAgICAgICAgICc8ZGl2IGNsYXNz',
  'PSJmczEyIG11dGVkIG10OCI+4LiK4Liz4Lij4Liw4LmD4LiZ4Lib4Li14LiX4Li14LmI4LmA4Lil4Li34Lit4LiBOiA8Yj4nICsgYmFodCh4LnRoaXNZZWFyKSArICc8L2I+PC9kaXY+JzsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDIpIOC4q+C4meC4teC5ieC4q+C4peC4seC4gSAvIOC4q+C4meC4teC5ieC4o+C4reC4hyAo4LmD4LiK4LmJ4LiV4Lix4Lin4Lin4Liy4LiU4Lij4LmI4Lin4Lih4LiB4Lix4LiZKQogICA9PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZGVidFJvdXRlKGxlZGdlciwgdGl0bGUpewogIHJldHVybiB7CiAgICBsb2FkOiBmdW5jdGlvbigpewogICAgICByZXR1cm4gUHJvbWlzZS5hbGwoWwogICAgICAg',
  'IGNhbGxBcGkoJ2RlYnQuc3VtbWFyeScsIHsgbGVkZ2VyOiBsZWRnZXIsIHllYXI6IFMueWVhciB9KSwKICAgICAgICBjYWxsQXBpKCdkZWJ0LnBheW1lbnRzJywgeyBsZWRnZXI6IGxlZGdlciwgeWVhcjogUy55ZWFyIH0pCiAgICAgIF0pLnRoZW4oZnVuY3Rpb24o',
  'cil7CiAgICAgICAgdmFyIGQgPSByWzBdOyBkLnBheW1lbnRzID0gclsxXTsgZC5sZWRnZXIgPSBsZWRnZXI7IGQucGFnZVRpdGxlID0gdGl0bGU7CiAgICAgICAgcmV0dXJuIGQ7CiAgICAgIH0pOwogICAgfSwKICAgIHJlbmRlcjogcmVuZGVyRGVidCwKICAgIGFm',
  'dGVyOiBjYWNoZUFsbERlYnRzCiAgfTsKfQpST1VURVMuZGVidE1haW4gPSBkZWJ0Um91dGUoJ+C4q+C4meC4teC5ieC4q+C4peC4seC4gScsICfguKPguLLguKLguIHguLLguKPguKrguKPguLjguJvguKPguKfguKEgVGhlIE0gQ29ybmVyIEFQJyk7ClJPVVRFUy5k',
  'ZWJ0U3ViICA9IGRlYnRSb3V0ZSgn4Lir4LiZ4Li14LmJ4Lij4Lit4LiHJywgJ+C4q+C4meC4teC5ieC4quC4tOC4mScpOwoKLyoqIOC5gOC4geC5h+C4muC4o+C4suC4ouC4iuC4t+C5iOC4reC4geC5ieC4reC4meC4q+C4meC4teC5ieC4l+C4uOC4geC4muC4seC4',
  'jeC4iuC4teC5hOC4p+C5ieC5g+C4q+C5ieC4n+C4reC4o+C5jOC4oeC5gOC4peC4t+C4reC4gSAi4LmA4Lib4LmH4LiZ4Liq4LmI4Lin4LiZ4Lir4LiZ4Li24LmI4LiH4LiC4Lit4LiHIiAqLwpmdW5jdGlvbiBjYWNoZUFsbERlYnRzKCl7CiAgY2FsbEFwaSgnZGVi',
  'dC5saXN0Jywge30pLnRoZW4oZnVuY3Rpb24obGlzdCl7CiAgICBBTExfREVCVFMgPSBsaXN0Lm1hcChmdW5jdGlvbihkKXsKICAgICAgcmV0dXJuIHsgaWQ6IGQuaWQsIHRpdGxlOiBkLnRpdGxlLCBsZWRnZXI6IGQubGVkZ2VyLCBwYXJlbnRJZDogZC5wYXJlbnRJ',
  'ZCB8fCAnJyB9OwogICAgfSk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oKXt9KTsKfQoKZnVuY3Rpb24gcmVuZGVyRGVidChkKXsKICB2YXIgeWVhckxhYmVsID0gUy55ZWFyID09PSAnYWxsJyA/ICfguJfguLjguIHguJvguLUnIDogJ+C4m+C4tSAnICsgUy55ZWFyOwoK',
  'ICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJjYXJkIG1iMTIiPjxkaXYgY2xhc3M9ImNhcmQtYiI+JyArCiAgICAnPGRpdiBjbGFzcz0icm93IG1iMTIiPjxoMyBzdHlsZT0ibWFyZ2luOjA7Zm9udC1zaXplOjE1cHgiPicgKyBlc2MoZC5wYWdlVGl0bGUpICsgJzwv',
  'aDM+JyArCiAgICAnPHNwYW4gY2xhc3M9InNwIj48L3NwYW4+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSBzbSIgb25jbGljaz0iZm9ybURlYnRQYXltZW50KG51bGwsXCcnICsgZC5sZWRnZXIgKyAnXCcpIj4rIOC4muC4seC4meC4l+C4tuC4geC4geC4',
  'suC4o+C4iuC4s+C4o+C4sDwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZm9ybURlYnQobnVsbCxcJycgKyBkLmxlZGdlciArICdcJykiPisg4LmA4Lie4Li04LmI4Lih4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJPC9idXR0',
  'b24+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0icG1ldGEiIHN0eWxlPSJtYXJnaW46MCAwIDdweCI+PHNwYW4+4LiE4Lin4Liy4Lih4LiE4Li34Lia4Lir4LiZ4LmJ4Liy4LiB4Liy4Lij4LiK4Liz4Lij4LiwPC9zcGFuPjxzcGFuPjxiPicgKyBwY3QoZC5wZXJj',
  'ZW50KSArICc8L2I+PC9zcGFuPjwvZGl2PicgKwogICAgcHJvZ3Jlc3MoZC5wZXJjZW50LCAnbGcgJyArIChkLnBlcmNlbnQgPj0gMTAwID8gJ29rJyA6ICcnKSkgKwogICAgJzxkaXYgY2xhc3M9ImdyaWQgZzQgbXQxNiI+JyArCiAgICAgIGtwaSgn4Lii4Lit4LiU',
  '4Lir4LiZ4Li14LmJ4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJywgYmFodChkLnRvdGFsRGVidCksIGQuZGVidHMubGVuZ3RoICsgJyDguIHguYnguK3guJnguKvguJnguLXguYknKSArCiAgICAgIGtwaSgn4LiK4Liz4Lij4Liw4LmB4Lil4LmJ4LinJywgYmFodChkLnBh',
  'aWQpLCBkLnBheW1lbnRDb3VudCArICcg4Lij4Liy4Lii4LiB4Liy4Lij4LmC4Lit4LiZJyArCiAgICAgICAgICAoZC5hZGp1c3RtZW50Q291bnQgPyAnIMK3IOC4m+C4o+C4seC4muC4ouC4reC4lCAnICsgYmFodChkLmFkanVzdGVkKSA6ICcnKSwgJ2dvb2QnKSAr',
  'CiAgICAgIGtwaSgn4LiE4LiH4LmA4Lir4Lil4Li34LitJywgYmFodChkLnJlbWFpbmluZyksICfguK3guLXguIEgJyArIHBjdCgxMDAgLSBkLnBlcmNlbnQpICsgJyDguIjguLDguJvguLTguJTguKvguJnguLXguYknLCAnYmFkJykgKwogICAgICBrcGkoJ+C4iuC4',
  's+C4o+C4sOC5g+C4mScgKyB5ZWFyTGFiZWwsIGJhaHQoZC5zZWxlY3RlZFllYXJQYWlkKSwgZC5zZWxlY3RlZFllYXJDb3VudCArICcg4Lij4Liy4Lii4LiB4Liy4LijJyArCiAgICAgICAgICAoZC5zZWxlY3RlZFllYXJJbnRlcmVzdCA/ICcgwrcg4LiU4Lit4LiB',
  '4LmA4Lia4Li14LmJ4LiiICcgKyBiYWh0KGQuc2VsZWN0ZWRZZWFySW50ZXJlc3QpIDogJycpKSArCiAgICAnPC9kaXY+PC9kaXY+PC9kaXY+JzsKCiAgdmFyIHBlckRlYnQgPSBkLmRlYnRzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJncmlkIGctYXV0byBtYjEyIj4n',
  'ICsgZC5kZWJ0cy5tYXAoZnVuY3Rpb24oeCl7CiAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImNhcmQiPjxkaXYgY2xhc3M9ImNhcmQtYiI+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJjbGlwIiBzdHlsZT0iZm9udC13ZWlnaHQ6NjUwO2ZvbnQtc2l6ZToxMy41cHg7bWlu',
  'LWhlaWdodDozOHB4Ij4nICsgZXNjKHgudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0icm93IGZzMTIgbXV0ZWQgbWI4Ij4nICsgKHguc2V0dGxlZCA/ICc8c3BhbiBjbGFzcz0iYiBvayI+4pyTIOC4iuC4s+C4o+C4sOC4hOC4o+C4muC5geC4',
  'peC5ieC4pzwvc3Bhbj4nIDogc3RhdHVzQmFkZ2UoeC5zdGF0dXMpKSArCiAgICAgICAgJzxzcGFuPicgKyBlc2MoeC5jcmVkaXRvciB8fCAn4oCTJykgKyAoeC5zdGFydERhdGUgPyAnIMK3ICcgKyB0aERhdGUoeC5zdGFydERhdGUpIDogJycpICsgJzwvc3Bhbj48',
  'L2Rpdj4nICsKICAgICAgKHgucGFyZW50VGl0bGUKICAgICAgICA/ICc8ZGl2IGNsYXNzPSJiIGluZm8gd3JhcCBtYjgiIHRpdGxlPSLguKLguK3guJTguIHguYnguK3guJnguJnguLXguYnguK3guKLguLnguYjguYPguJnguIHguYnguK3guJnguYHguKHguYjguYHg',
  'uKXguYnguKcg4LiI4LmI4Liy4Lii4LiE4Li34LiZ4LiB4LmJ4Lit4LiZ4LiZ4Li14LmJ4LiB4LmJ4Lit4LiZ4LmB4Lih4LmI4LiI4Liw4Lil4LiU4LiV4Liy4LihIj4nICsKICAgICAgICAgICfihrMg4LmA4Lib4LmH4LiZ4Liq4LmI4Lin4LiZ4Lir4LiZ4Li24LmI',
  '4LiH4LiC4Lit4LiHICcgKyBlc2MoeC5wYXJlbnRUaXRsZSkgKyAnPC9kaXY+JwogICAgICAgIDogJycpICsKICAgICAgcHJvZ3Jlc3MoeC5wZXJjZW50KSArCiAgICAgICc8ZGl2IGNsYXNzPSJwbWV0YSI+PHNwYW4+4LiK4Liz4Lij4LiwIDxiPicgKyBiYWh0KHgu',
  'cGFpZCkgKyAnPC9iPjwvc3Bhbj48c3Bhbj7guITguIfguYDguKvguKXguLfguK0gPGI+JyArIGJhaHQoeC5yZW1haW5pbmcpICsgJzwvYj48L3NwYW4+PC9kaXY+JyArCiAgICAgICh4LmNoaWxkcmVuICYmIHguY2hpbGRyZW4ubGVuZ3RoCiAgICAgICAgPyAnPGRp',
  'diBjbGFzcz0iaHIiIHN0eWxlPSJtYXJnaW46MTJweCAwIDEwcHgiPjwvZGl2PicgKwogICAgICAgICAgJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbWI4Ij7guYPguJnguKLguK3guJTguJnguLXguYnguKHguLXguIHguYnguK3guJnguKLguYjguK3guKLguK3guKLg',
  'uLnguYggJyArIHguY2hpbGRyZW4ubGVuZ3RoICsgJyDguIHguYnguK3guJk8L2Rpdj4nICsKICAgICAgICAgIHguY2hpbGRyZW4ubWFwKGZ1bmN0aW9uKGMpewogICAgICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9Im1iOCI+JyArCiAgICAgICAgICAgICAgJzxk',
  'aXYgY2xhc3M9InJvdyBmczEyIj48c3Bhbj7ihrMgJyArIGVzYyhjLnRpdGxlKSArICc8L3NwYW4+JyArCiAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPSJzcCBtb25vIj4nICsgbW9uZXkoYy5wYWlkKSArICcgLyAnICsgbW9uZXkoYy5wcmluY2lwYWwpICsgJzwv',
  'c3Bhbj48L2Rpdj4nICsKICAgICAgICAgICAgICBwcm9ncmVzcyhjLnBlcmNlbnQsICdvaycpICsgJzwvZGl2Pic7CiAgICAgICAgICB9KS5qb2luKCcnKSArCiAgICAgICAgICAoeC5wYWlkRnJvbUNoaWxkcmVuID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQiPuC4',
  'o+C4p+C4oeC4ouC4reC4lOC4l+C4teC5iOC4oeC4suC4iOC4suC4geC4geC5ieC4reC4meC4ouC5iOC4reC4oiAnICsgYmFodCh4LnBhaWRGcm9tQ2hpbGRyZW4pICsgJzwvZGl2PicgOiAnJykKICAgICAgICA6ICcnKSArCiAgICAgICh4LmludGVyZXN0UGVyTW9u',
  'dGggPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtdDgiPuC4lOC4reC4geC5gOC4muC4teC5ieC4oiAnICsgYmFodCh4LmludGVyZXN0UGVyTW9udGgpICsgJy/guYDguJTguLfguK3guJk8L2Rpdj4nIDogJycpICsKICAgICAgKHgucGxhblBlck1vbnRoID8gJzxk',
  'aXYgY2xhc3M9ImZzMTIgbXV0ZWQiPuC5geC4nOC4meC4nOC5iOC4reC4mSAnICsgYmFodCh4LnBsYW5QZXJNb250aCkgKyAnL+C5gOC4lOC4t+C4reC4mTwvZGl2PicgOiAnJykgKwogICAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPjxidXR0b24gY2xhc3M9ImJ0',
  'biBzbSIgb25jbGljaz1cJ2Zvcm1EZWJ0KCcgKyBhdHRyKHgpICsgJywiJyArIGQubGVkZ2VyICsgJyIpXCc+4LmB4LiB4LmJ4LmE4LiCPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIHRpdGxlPSLguKLguK3guJTguYTguKHguYjguJXg',
  'uKPguIfguIHguLHguJrguJfguLXguYjguYDguIjguYnguLLguKvguJnguLXguYnguYHguIjguYnguIc/IOC4geC4o+C4reC4geC4ouC4reC4lOC4hOC4h+C5gOC4q+C4peC4t+C4reC4iOC4o+C4tOC4hyIgb25jbGljaz1cJ2Zvcm1SZWNvbmNpbGVEZWJ0KCcgKyBh',
  'dHRyKHgpICsgJylcJz7impbvuI8g4Lib4Lij4Lix4Lia4Lii4Lit4LiU4LmD4Lir4LmJ4LiV4Lij4LiHPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gZGdyIiBvbmNsaWNrPSJkZWxEZWJ0KFwnJyArIHguaWQgKyAnXCcpIj7guKXguJo8',
  'L2J1dHRvbj48L2Rpdj4nICsKICAgICc8L2Rpdj48L2Rpdj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2PicgOiAnJzsKCiAgdmFyIGJ5WWVhciA9IGQuYnlZZWFyLmxlbmd0aCA/IGNhcmQoJ/Cfk4Ug4Lii4Lit4LiU4LiK4Liz4Lij4Liw4LmB4Lii4LiB4LiV4Liy',
  '4Lih4Lib4Li1JywKICAgICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0Ij48dGhlYWQ+PHRyPicgKwogICAgJzx0aD7guJvguLU8L3RoPjx0aCBjbGFzcz0ibnVtIj7guYDguIfguLTguJnguJXguYnguJk8L3RoPjx0aCBjbGFzcz0ibnVtIj7guJTguK3g',
  'uIHguYDguJrguLXguYnguKI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKPguKfguKHguJfguLXguYjguYLguK3guJk8L3RoPicgKwogICAgJzx0aCBjbGFzcz0ibnVtIj7guIjguLPguJnguKfguJnguITguKPguLHguYnguIc8L3RoPjx0aCBjbGFzcz0ibnVtIj7guYDg',
  'uIfguLTguJnguJXguYnguJnguKrguLDguKrguKE8L3RoPjx0aCBzdHlsZT0id2lkdGg6MjYlIj7guITguKfguLLguKHguITguLfguJrguKvguJnguYnguLLguKrguLDguKrguKE8L3RoPicgKwogICAgJzwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICBkLmJ5WWVh',
  'ci5tYXAoZnVuY3Rpb24oeSl7CiAgICAgIHZhciBjdW0gPSB5LmN1bXVsYXRpdmUgIT0gbnVsbCA/IHkuY3VtdWxhdGl2ZSA6IDA7CiAgICAgIHZhciBwID0gZC50b3RhbERlYnQgPyAoY3VtIC8gZC50b3RhbERlYnQgKiAxMDApIDogMDsKICAgICAgcmV0dXJuICc8',
  'dHIgb25jbGljaz0ic2V0WWVhckZyb21UYWJsZSgnICsgeS55ZWFyICsgJykiIHN0eWxlPSJjdXJzb3I6cG9pbnRlciI+JyArCiAgICAgICAgJzx0ZD48Yj4nICsgZGlzcGxheVllYXIoeS55ZWFyKSArICc8L2I+JyArCiAgICAgICAgICAodXNlQnVkZGhpc3RZZWFy',
  'KCkgPyAnIDxzcGFuIGNsYXNzPSJmYWludCBmczEyIj4vICcgKyB5LnllYXIgKyAnPC9zcGFuPicgOiAnJykgKyAnPC90ZD4nICsKICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyBtb25leSh5LnByaW5jaXBhbCkgKyAnPC90ZD4nICsKICAgICAgICAnPHRkIGNs',
  'YXNzPSJudW0iPicgKyAoeS5pbnRlcmVzdCA/IG1vbmV5KHkuaW50ZXJlc3QpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj48Yj4nICsgbW9uZXkoeS5wcmluY2lwYWwgKyB5LmludGVyZXN0KSArICc8L2I+PC90ZD4nICsKICAg',
  'ICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyB5LmNvdW50ICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbW9uZXkoY3VtKSArICc8L3RkPicgKwogICAgICAgICc8dGQ+JyArIHByb2dyZXNzKHApICsgJzwvdGQ+PC90cj4nOwogICAgfSku',
  'am9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicsICcnLCB0cnVlKSA6ICcnOwoKICB2YXIgcm93cyA9IGQucGF5bWVudHM7CiAgdmFyIGxpc3QgPSBjYXJkKCfwn6e+IOC4o+C4suC4ouC4geC4suC4o+C5guC4reC4meC5g+C4iuC5ieC4q+C4meC4teC5',
  'iSDCtyAnICsgeWVhckxhYmVsICsgJyAoJyArIHJvd3MubGVuZ3RoICsgJyknLAogICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsKICAgICAgJzx0aD7guKfguLHguJnguJfguLXguYg8L3RoPjx0',
  'aD7guIfguKfguJQ8L3RoPjx0aCBjbGFzcz0ibnVtIj7guYDguIfguLTguJnguJXguYnguJk8L3RoPjx0aCBjbGFzcz0ibnVtIj7guJTguK3guIHguYDguJrguLXguYnguKI8L3RoPicgKwogICAgICAnPHRoIGNsYXNzPSJudW0iPuC4o+C4p+C4oeC4l+C4teC5iOC5',
  'guC4reC4mTwvdGg+PHRoPuC4iuC5iOC4reC4h+C4l+C4suC4hzwvdGg+JyArCiAgICAgICc8dGg+4Liq4Lil4Li04LibPC90aD48dGg+4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4PC90aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICByb3dz',
  'Lm1hcChmdW5jdGlvbihwKXsKICAgICAgICB2YXIgYWRqID0gcC5jaGFubmVsID09PSAn4Lib4Lij4Lix4Lia4Lii4Lit4LiUJzsKICAgICAgICByZXR1cm4gJzx0cicgKyAoYWRqID8gJyBjbGFzcz0iYWRqIiB0aXRsZT0i4Lij4Liy4Lii4LiB4Liy4Lij4Lib4Lij',
  '4Lix4Lia4Lii4Lit4LiU4LmD4Lir4LmJ4LiV4Lij4LiH4Lii4Lit4LiU4LiI4Lij4Li04LiHIOC5hOC4oeC5iOC5g+C4iuC5iOC5gOC4h+C4tOC4meC4l+C4teC5iOC5guC4reC4mSInIDogJycpICsgJz4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCI+',
  'JyArIHRoRGF0ZShwLnBheURhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAiPicgKyBlc2MocC5pbnN0YWxsbWVudCB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChwLnByaW5jaXBh',
  'bCA/ICc8YiBzdHlsZT0iY29sb3I6dmFyKC0tb2spIj4nICsgbW9uZXkocC5wcmluY2lwYWwpICsgJzwvYj4nIDogJzxzcGFuIGNsYXNzPSJmYWludCI+4oCTPC9zcGFuPicpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAocC5pbnRl',
  'cmVzdCA/ICc8YiBzdHlsZT0iY29sb3I6dmFyKC0td2FybikiPicgKyBtb25leShwLmludGVyZXN0KSArICc8L2I+JyA6ICc8c3BhbiBjbGFzcz0iZmFpbnQiPuKAkzwvc3Bhbj4nKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj48Yj4nICsg',
  'bW9uZXkocC5hbW91bnQpICsgJzwvYj48L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIChhZGogPyAnPHNwYW4gY2xhc3M9ImIgaW5mbyI+4pqW77iPIOC4m+C4o+C4seC4muC4ouC4reC4lDwvc3Bhbj4nIDogZXNjKHAuY2hhbm5lbCB8fCAn',
  '4oCTJykpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHAuc2xpcFJlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIG11dGVkIGNsaXAiPicgKyBlc2MocC5ub3RlIHx8ICcnKSArICc8L3RkPicgKwogICAg',
  'ICAgICAgJzx0ZD48ZGl2IGNsYXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24iIG9uY2xpY2s9XCdmb3JtRGVidFBheW1lbnQoJyArIGF0dHIocCkgKyAnLCInICsgZC5sZWRnZXIgKyAnIilcJz7inI/vuI88',
  'L2J1dHRvbj4nICsKICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIGRnciIgb25jbGljaz0iZGVsRGVidFBheW1lbnQoXCcnICsgcC5pZCArICdcJykiPvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICc8L2Rpdj48L3RkPjwvdHI+JzsKICAg',
  'ICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgIDogZW1wdHlCb3goJ+C4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4o+C4suC4ouC4geC4suC4o+C4iuC4s+C4o+C4sOC5g+C4mScgKyB5ZWFyTGFiZWwsCiAgICAgICAgJzxidXR0b24g',
  'Y2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZvcm1EZWJ0UGF5bWVudChudWxsLFwnJyArIGQubGVkZ2VyICsgJ1wnKSI+KyDguJrguLHguJnguJfguLbguIHguIHguLLguKPguIrguLPguKPguLA8L2J1dHRvbj4nKSwKICAgICcnLCB0cnVlKTsKCiAgcmV0dXJuIGhl',
  'YWQgKyBwZXJEZWJ0ICsgYnlZZWFyICsgJzxkaXYgY2xhc3M9Im10MTIiPicgKyBsaXN0ICsgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIHNldFllYXJGcm9tVGFibGUoeSl7CiAgUy55ZWFyID0gU3RyaW5nKHkpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd5ZWFy',
  'U2VsJykudmFsdWUgPSBTLnllYXI7CiAgbG9hZCgpOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgMykg4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHCiAgID09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMucHVyY2hhc2VzID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7CiAgICByZXR1cm4gUHJvbWlzZS5hbGwoWwogICAgICBjYWxsQXBpKCdwdXJjaGFz',
  'ZS5zdW1tYXJ5JywgeyB5ZWFyOiBTLnllYXIgfSksCiAgICAgIGNhbGxBcGkoJ3B1cmNoYXNlLmxpc3QnLCB7IHllYXI6IFMueWVhciwgY2F0ZWdvcnk6IFMucGFyYW1zLmNhdGVnb3J5IHx8ICcnLCBxOiBTLnBhcmFtcy5xIHx8ICcnIH0pCiAgICBdKS50aGVuKGZ1',
  'bmN0aW9uKHIpeyB2YXIgZCA9IHJbMF07IGQuaXRlbXMgPSByWzFdOyByZXR1cm4gZDsgfSk7CiAgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUg',
  'JyArIFMueWVhcjsKICAgIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgIGtwaSgn4Lii4Lit4LiU4LiL4Li34LmJ4LitICcgKyB5ZWFyTGFiZWwsIGJhaHQoZC55ZWFyVG90YWwpLCBkLnllYXJDb3VudCArICcg4Lij4Liy4Lii',
  '4LiB4Liy4LijJywgJ2FjY2VudCcpICsKICAgICAga3BpKCfguKLguK3guJTguKrguLDguKrguKHguJfguLHguYnguIfguKvguKHguJQnLCBiYWh0KGQuZ3JhbmRUb3RhbCksIGQuZ3JhbmRDb3VudCArICcg4Lij4Liy4Lii4LiB4Liy4LijJykgKwogICAgICBrcGko',
  'J+C4reC4ouC4ueC5iOC5g+C4meC4m+C4o+C4sOC4geC4seC4mScsIGQud2FycmFudHkuYWN0aXZlICsgJyDguKPguLLguKLguIHguLLguKMnLCAn4LmD4LiB4Lil4LmJ4Lir4Lih4LiUICcgKyBkLndhcnJhbnR5LmV4cGlyaW5nLCBkLndhcnJhbnR5LmV4cGlyaW5n',
  'ID8gJ3dhcm4nIDogJ2dvb2QnKSArCiAgICAgIGtwaSgn4Lir4Lih4Lin4LiU4LiX4Li14LmI4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Liq4Li54LiH4Liq4Li44LiUJywgZC5ieUNhdGVnb3J5WzBdID8gZC5ieUNhdGVnb3J5WzBdLmNhdGVnb3J5IDogJ+KAkycsCiAg',
  'ICAgICAgICBkLmJ5Q2F0ZWdvcnlbMF0gPyBiYWh0KGQuYnlDYXRlZ29yeVswXS50b3RhbCkgOiAnJykgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIGNoYXJ0cyA9ICc8ZGl2IGNsYXNzPSJncmlkIGcyIG1iMTIiPicgKwogICAgICBjYXJkKCfwn5OKIOC4hOC5iOC4',
  'suC5g+C4iuC5ieC4iOC5iOC4suC4ouC5geC4ouC4geC4leC4suC4oeC4q+C4oeC4p+C4lOC4q+C4oeC4ueC5iCDCtyAnICsgeWVhckxhYmVsLAogICAgICAgIGJhckNoYXJ0KGQuYnlDYXRlZ29yeSwgJ2NhdGVnb3J5JywgJ3RvdGFsJywgZnVuY3Rpb24oaSl7IHJl',
  'dHVybiBtb25leShpLnRvdGFsKSArICcg4Li/JzsgfSkpICsKICAgICAgY2FyZCgn8J+ThSDguKLguK3guJTguIvguLfguYnguK3guYHguKLguIHguJXguLLguKHguJvguLUnLAogICAgICAgIGJhckNoYXJ0KGQuYnlZZWFyLm1hcChmdW5jdGlvbih5KXsgcmV0dXJu',
  'IHsgbGFiZWw6ICfguJvguLUgJyArIHkueWVhciArICcgKCcgKyB5LmNvdW50ICsgJyknLCB0b3RhbDogeS50b3RhbCwgeWVhcjogeS55ZWFyIH07IH0pLAogICAgICAgICAgICAgICAgICdsYWJlbCcsICd0b3RhbCcsIGZ1bmN0aW9uKGkpeyByZXR1cm4gbW9uZXko',
  'aS50b3RhbCkgKyAnIOC4vyc7IH0pKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgY2F0cyA9ICc8ZGl2IGNsYXNzPSJjaGlwcyBtYjEyIj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImNoaXAgJyArICghUy5wYXJhbXMuY2F0ZWdvcnk/J29uJzonJykgKyAnIiBv',
  'bmNsaWNrPSJzZXRQYXJhbShcJ2NhdGVnb3J5XCcsXCdcJykiPuC4l+C4uOC4geC4q+C4oeC4p+C4lDwvYnV0dG9uPicgKwogICAgICBkLmJ5Q2F0ZWdvcnkubWFwKGZ1bmN0aW9uKGMpewogICAgICAgIHJldHVybiAnPGJ1dHRvbiBjbGFzcz0iY2hpcCAnICsgKFMu',
  'cGFyYW1zLmNhdGVnb3J5PT09Yy5jYXRlZ29yeT8nb24nOicnKSArICciICcgKwogICAgICAgICAgICAgICAnb25jbGljaz0ic2V0UGFyYW0oXCdjYXRlZ29yeVwnLFwnJyArIGVzYyhjLmNhdGVnb3J5KSArICdcJykiPicgKyBlc2MoYy5jYXRlZ29yeSkgKyAnICgn',
  'ICsgYy5jb3VudCArICcpPC9idXR0b24+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKCiAgICB2YXIgcm93cyA9IGQuaXRlbXM7CiAgICB2YXIgdGFibGUgPSBjYXJkKCfwn5uSIOC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4hyDC',
  'tyAnICsgeWVhckxhYmVsICsgJyAoJyArIHJvd3MubGVuZ3RoICsgJyknLAogICAgICByb3dzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOjk4MHB4Ij48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGgg',
  'c3R5bGU9IndpZHRoOjk2cHgiPuC4p+C4seC4meC4l+C4teC5iOC4i+C4t+C5ieC4rTwvdGg+PHRoPuC4o+C4suC4ouC4geC4suC4o+C4quC4tOC4meC4hOC5ieC4sjwvdGg+PHRoIGNsYXNzPSJudW0iPuC4iOC4s+C4meC4p+C4mTwvdGg+JyArCiAgICAgICAgJzx0',
  'aCBjbGFzcz0ibnVtIj7guKPguLLguITguLI8L3RoPjx0aD7guYHguKvguKXguYjguIfguJfguLXguYjguIvguLfguYnguK08L3RoPjx0aD7guJvguKPguLDguIHguLHguJk8L3RoPjx0aD7guKDguLLguJ48L3RoPjx0aD7guKrguKXguLTguJs8L3RoPjx0aD48L3Ro',
  'PicgKwogICAgICAgICc8L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIHJvd3MubWFwKGZ1bmN0aW9uKHApewogICAgICAgICAgdmFyIHcgPSBwLndhcnJhbnR5IHx8IHt9OwogICAgICAgICAgcmV0dXJuICc8dHI+JyArCiAgICAgICAgICAgICc8dGQgY2xh',
  'c3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHAuYnV5RGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48ZGl2IGNsYXNzPSJjbGlwIiB0aXRsZT0iJyArIGVzYyhwLml0ZW0pICsgJyI+PGI+JyArIGVzYyhwLml0ZW0pICsgJzwvYj48L2Rpdj4nICsK',
  'ICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0iZnMxMiBmYWludCI+JyArIGVzYyhwLmNhdGVnb3J5IHx8ICcnKSArIChwLnJvb20gPyAnIMK3IOC4q+C5ieC4reC4hyAnICsgZXNjKHAucm9vbSkgOiAnJykgKwogICAgICAgICAgICAgICAgKHAub3JkZXJObyA/ICcg',
  'wrcg4Lit4Lit4Lij4LmM4LmA4LiU4Lit4Lij4LmMICcgKyBlc2MocC5vcmRlck5vKSA6ICcnKSArICc8L2Rpdj4nICsKICAgICAgICAgICAgICBiaWxsSHRtbChwKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyBudW0ocC5xdHkp',
  'ICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+PGI+JyArIG1vbmV5KHAucHJpY2UpICsgJzwvYj48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKHAudmVuZG9yIHx8ICfigJMnKSArICc8L3RkPicgKwog',
  'ICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgKHcuaGFzCiAgICAgICAgICAgICAgICA/IHN0YXR1c0JhZGdlKHcuc3RhdGUpICsgJzxkaXYgY2xhc3M9ImZhaW50IiBzdHlsZT0iZm9udC1zaXplOjExcHgiPicgKyB0aERhdGVTaG9ydCh3LmVuZCkgKyAn',
  'PC9kaXY+JwogICAgICAgICAgICAgICAgOiAnPHNwYW4gY2xhc3M9ImZhaW50Ij7igJM8L3NwYW4+JykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbChwLnBob3RvUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsg',
  'dGh1bWJzSHRtbChwLnNsaXBSZWZzKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPjxkaXYgY2xhc3M9InQtYWN0aW9ucyI+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIiBvbmNsaWNrPVwnZm9ybVB1cmNoYXNlKCcgKyBh',
  'dHRyKHApICsgJylcJz7inI/vuI88L2J1dHRvbj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24gZGdyIiBvbmNsaWNrPSJkZWxQdXJjaGFzZShcJycgKyBwLmlkICsgJ1wnKSI+8J+XkTwvYnV0dG9uPicgKwogICAgICAgICAgICAn',
  'PC9kaXY+PC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgOiBlbXB0eUJveCgn4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LmD4LiZJyArIHll',
  'YXJMYWJlbCwgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZvcm1QdXJjaGFzZShudWxsKSI+KyDguYDguJ7guLTguYjguKHguKPguLLguKLguIHguLLguKPguIvguLfguYnguK08L2J1dHRvbj4nKSwKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBw',
  'cmkgc20iIG9uY2xpY2s9ImZvcm1QdXJjaGFzZShudWxsKSI+KyDguYDguJ7guLTguYjguKHguKPguLLguKLguIHguLLguKPguIvguLfguYnguK08L2J1dHRvbj4nLCB0cnVlKTsKCiAgICByZXR1cm4gaGVhZCArIGNoYXJ0cyArIGNhdHMgKyB0YWJsZTsKICB9Cn07',
  'CgovKioKICog4Lia4Li04Lil4LiX4Li14LmI4Lih4Li14LiC4Lit4LiH4Lir4Lil4Liy4Lii4Lit4Lii4LmI4Liy4LiHIOKAlCDguYHguKrguJTguIfguYDguJvguYfguJnguJvguLjguYjguKHguIHguLLguIfguJTguLkg4LmE4Lih4LmI4LmD4Lir4LmJ4LiV4Liy',
  '4Lij4Liy4LiH4Lii4Liy4Lin4LmA4LiB4Li04LiZ4LmE4LibCiAqIOC4muC4tOC4peC4l+C4teC5iOC4oeC4teC4o+C4suC4ouC4geC4suC4o+C5gOC4lOC4teC4ouC4p+C4q+C4o+C4t+C4reC5hOC4oeC5iOC4oeC4teC4o+C4suC4ouC4geC4suC4o+C4ouC5iOC4',
  'reC4ouC5gOC4peC4oiDguYTguKHguYjguJXguYnguK3guIfguYHguKrguJTguIfguK3guLDguYTguKPguYDguJ7guLTguYjguKEKICovCmZ1bmN0aW9uIGJpbGxIdG1sKHApewogIHZhciBiID0gcC5iaWxsOwogIGlmICghYiB8fCBiLmNvdW50IDwgMikgcmV0dXJu',
  'ICcnOwogIHZhciBpZCA9ICdiaWxsXycgKyBwLmlkOwogIHJldHVybiAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJiaWxsLXRvZ2dsZSIgb25jbGljaz0idG9nZ2xlQmlsbChcJycgKyBpZCArICdcJykiPicgKwogICAgICAn8J+nviAnICsgYi5jb3VudCAr',
  'ICcg4Lij4Liy4Lii4LiB4Liy4Lij4LmD4LiZ4Lia4Li04LilIOKWvjwvYnV0dG9uPicgKwogICAgJzxkaXYgY2xhc3M9ImJpbGwtbGluZXMiIGlkPSInICsgaWQgKyAnIiBoaWRkZW4+JyArCiAgICAgIGIubGluZXMubWFwKGZ1bmN0aW9uKGwpewogICAgICAgIHJl',
  'dHVybiAnPGRpdiBjbGFzcz0iYmlsbC1saW5lIj4nICsKICAgICAgICAgICc8c3BhbiBjbGFzcz0ibm0iIHRpdGxlPSInICsgZXNjKGwubmFtZSkgKyAnIj4nICsgZXNjKGwubmFtZSkgKyAnPC9zcGFuPicgKwogICAgICAgICAgJzxzcGFuIGNsYXNzPSJxdCI+JyAr',
  'IG51bShsLnF0eSkgKyAobC51bml0ID8gJyAnICsgZXNjKGwudW5pdCkgOiAnJykgKyAnIMOXICcgKyBtb25leShsLnVuaXRQcmljZSwgMikgKyAnPC9zcGFuPicgKwogICAgICAgICAgJzxzcGFuIGNsYXNzPSJ0dCI+JyArIG1vbmV5KGwudG90YWwsIDIpICsgJzwv',
  'c3Bhbj48L2Rpdj4nOwogICAgICB9KS5qb2luKCcnKSArCiAgICAgICgoYi5zaGlwcGluZyB8fCBiLmRpc2NvdW50KQogICAgICAgID8gJzxkaXYgY2xhc3M9ImJpbGwtZXh0cmEiPicgKwogICAgICAgICAgICAoYi5zaGlwcGluZyA/ICfguITguYjguLLguKrguYjg',
  'uIcgJyArIG1vbmV5KGIuc2hpcHBpbmcsIDIpIDogJycpICsKICAgICAgICAgICAgKGIuc2hpcHBpbmcgJiYgYi5kaXNjb3VudCA/ICcgwrcgJyA6ICcnKSArCiAgICAgICAgICAgIChiLmRpc2NvdW50ID8gJ+C4quC5iOC4p+C4meC4peC4lCDiiJInICsgbW9uZXko',
  'Yi5kaXNjb3VudCwgMikgOiAnJykgKyAnPC9kaXY+JwogICAgICAgIDogJycpICsKICAgICc8L2Rpdj4nOwp9CgpmdW5jdGlvbiB0b2dnbGVCaWxsKGlkKXsKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7CiAgaWYgKCFlbCkgcmV0dXJuOwog',
  'IGVsLmhpZGRlbiA9ICFlbC5oaWRkZW47CiAgdmFyIGJ0biA9IGVsLnByZXZpb3VzRWxlbWVudFNpYmxpbmc7CiAgaWYgKGJ0bikgYnRuLnRleHRDb250ZW50ID0gYnRuLnRleHRDb250ZW50LnJlcGxhY2UoZWwuaGlkZGVuID8gJ+KWtCcgOiAn4pa+JywgZWwuaGlk',
  'ZGVuID8gJ+KWvicgOiAn4pa0Jyk7Cn0KCmZ1bmN0aW9uIHNldFBhcmFtKGtleSwgdmFsKXsKICBTLnBhcmFtc1trZXldID0gdmFsOwogIGxvYWQoKTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09CiAgIDQpIOC4peC5ieC4suC4h+C5geC4reC4o+C5jAogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLmFjID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7IHJldHVybiBjYWxsQXBp',
  'KCdhYy5tYXRyaXgnLCB7IHllYXI6IFMueWVhciB9KTsgfSwKICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKICAgIHZhciBoZWFk',
  'ID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgIGtwaSgn4Lil4LmJ4Liy4LiH4LmB4Lil4LmJ4LinICcgKyB5ZWFyTGFiZWwsIGQucm9vbXNEb25lSW5ZZWFyICsgJy8nICsgZC5yb29tcy5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycsIGQuZG9u',
  'ZUluWWVhciArICcg4Lij4Lit4Lia4LiX4Lix4LmJ4LiH4Lir4Lih4LiUJywgJ2FjY2VudCcpICsKICAgICAga3BpKCfguKLguLHguIfguYTguKHguYjguYTguJTguYnguKXguYnguLLguIcnLCBkLnJvb21zUGVuZGluZy5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycs',
  'IGQucm9vbXNQZW5kaW5nLnNsaWNlKDAsOCkuam9pbignLCAnKSArIChkLnJvb21zUGVuZGluZy5sZW5ndGg+OD8n4oCmJzonJyksIGQucm9vbXNQZW5kaW5nLmxlbmd0aCA/ICd3YXJuJzonZ29vZCcpICsKICAgICAga3BpKCfguJbguLbguIfguIHguLPguKvguJng',
  'uJTguKXguYnguLLguIcnLCBkLm92ZXJkdWUubGVuZ3RoICsgJyDguKvguYnguK3guIcnLCAn4Lij4Lit4Lia4Lil4LmJ4Liy4LiH4LiX4Li44LiBICcgKyBkLmN5Y2xlTW9udGhzICsgJyDguYDguJTguLfguK3guJknLCBkLm92ZXJkdWUubGVuZ3RoID8gJ2JhZCc6',
  'J2dvb2QnKSArCiAgICAgIGtwaSgn4LiE4Lin4Liy4Lih4LiE4Li34Lia4Lir4LiZ4LmJ4LiyJywgcGN0KGQucm9vbXMubGVuZ3RoID8gZC5yb29tc0RvbmVJblllYXIvZC5yb29tcy5sZW5ndGgqMTAwIDogMCksICfguILguK3guIfguJfguLHguYnguIfguKvguKHg',
  'uJQgJyArIGQucm9vbXMubGVuZ3RoICsgJyDguKvguYnguK3guIcnKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgYWN0aW9ucyA9ICc8ZGl2IGNsYXNzPSJyb3cgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtQWMo',
  'bnVsbCkiPisg4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImZvcm1CdWxrQWMoKSI+8J+ThSDguJnguLHguJTguKXguYnguLLguIfg',
  'uKvguKXguLLguKLguKvguYnguK3guIfguJ7guKPguYnguK3guKHguIHguLHguJk8L2J1dHRvbj4nICsKICAgICAgJzxzcGFuIGNsYXNzPSJzcCI+PC9zcGFuPicgKwogICAgICAnPHNwYW4gY2xhc3M9ImZzMTIgbXV0ZWQiPuC4hOC4peC4tOC4geC4l+C4teC5iOC4',
  'q+C5ieC4reC4h+C5gOC4nuC4t+C5iOC4reC4lOC4uS/guYDguJ7guLTguYjguKHguKPguK3guJrguIHguLLguKPguKXguYnguLLguIc8L3NwYW4+JyArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgZ3JpZCA9IGNhcmQoJ+KdhO+4jyDguJXguLLguKPguLLguIfguKXg',
  'uYnguLLguIfguYHguK3guKPguYzguKPguLLguKLguKvguYnguK3guIcgwrcgJyArIHllYXJMYWJlbCwgcm9vbUZsb29ycyhkLnJvb21zLCBmdW5jdGlvbihyKXsKICAgICAgdmFyIGNscyA9IHIucm91bmRzSW5ZZWFyID4gMCA/ICdzLW9rJyA6IChyLnN0YXRlID09',
  'PSAn4LmA4LiB4Li04LiZ4LiB4Liz4Lir4LiZ4LiUJyA/ICdzLWRncicgOiAoci5zdGF0ZSA9PT0gJ+C4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4peC5ieC4suC4hycgPyAncy13YXJuJyA6ICdzLWluZm8nKSk7CiAgICAgIHZhciBzdWIgPSByLnJvdW5kc0lu',
  'WWVhciA+IDAKICAgICAgICA/ICc8Yj4nICsgci5yb3VuZHNJblllYXIgKyAnIOC4o+C4reC4mjwvYj48YnI+JyArIHRoRGF0ZVNob3J0KHIucmVjb3Jkcy5maWx0ZXIoZnVuY3Rpb24oeCl7cmV0dXJuIHguc2VydmljZURhdGU7fSkubWFwKGZ1bmN0aW9uKHgpe3Jl',
  'dHVybiB4LnNlcnZpY2VEYXRlO30pLnNvcnQoKS5wb3AoKSkKICAgICAgICA6IChyLmJvb2tlZEluWWVhciA/ICfguJnguLHguJTguYHguKXguYnguKcgJyArIHIuYm9va2VkSW5ZZWFyIDogKHIubGFzdFNlcnZpY2UgPyAn4Lil4LmI4Liy4Liq4Li44LiUICcgKyB0',
  'aERhdGVTaG9ydChyLmxhc3RTZXJ2aWNlKSA6ICfguYTguKHguYjguKHguLXguJvguKPguLDguKfguLHguJXguLQnKSk7CiAgICAgIHJldHVybiB7IGNsczogY2xzLCBzdWI6IHN1Yiwgb25jbGljazogJ29wZW5BY1Jvb20oXCcnICsgci5yb29tICsgJ1wnKScgfTsK',
  'ICAgIH0pLCAnJywgZmFsc2UpOwoKICAgIHZhciBsaXN0Um93cyA9IFtdOwogICAgZC5yb29tcy5mb3JFYWNoKGZ1bmN0aW9uKHIpeyByLnJlY29yZHMuZm9yRWFjaChmdW5jdGlvbih4KXsgeC5fcm9vbSA9IHIucm9vbTsgbGlzdFJvd3MucHVzaCh4KTsgfSk7IH0p',
  'OwogICAgbGlzdFJvd3Muc29ydChmdW5jdGlvbihhLGIpeyByZXR1cm4gU3RyaW5nKGIuc2VydmljZURhdGV8fGIuYm9va0RhdGV8fCcnKS5sb2NhbGVDb21wYXJlKFN0cmluZyhhLnNlcnZpY2VEYXRlfHxhLmJvb2tEYXRlfHwnJykpOyB9KTsKCiAgICB2YXIgbGlz',
  'dCA9IGNhcmQoJ/Cfk4sg4Lib4Lij4Liw4Lin4Lix4LiV4Li04LiB4Liy4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMIMK3ICcgKyB5ZWFyTGFiZWwgKyAnICgnICsgbGlzdFJvd3MubGVuZ3RoICsgJyknLAogICAgICBsaXN0Um93cy5sZW5ndGggPyAnPGRpdiBj',
  'bGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC4q+C5ieC4reC4hzwvdGg+PHRoPuC4o+C4reC4muC4l+C4teC5iDwvdGg+PHRoPuC4p+C4seC4meC4l+C4teC5iOC4meC4seC4lDwvdGg+PHRoPuC4p+C4seC4meC4',
  'l+C4teC5iOC4lOC4s+C5gOC4meC4tOC4meC4geC4suC4ozwvdGg+PHRoPuC4quC4luC4suC4meC4sDwvdGg+JyArCiAgICAgICAgJzx0aD7guIrguYjguLLguIc8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguYjguLLguYPguIrguYnguIjguYjguLLguKI8L3RoPjx0',
  'aD7guKDguLLguJ48L3RoPjx0aD7guKvguKHguLLguKLguYDguKvguJXguLg8L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgbGlzdFJvd3MubWFwKGZ1bmN0aW9uKHgpewogICAgICAgICAgcmV0dXJuICc8dHI+JyArCiAgICAgICAg',
  'ICAgICc8dGQ+PGI+JyArIGVzYyh4LnJvb20pICsgJzwvYj48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAoeC5yb3VuZCB8fCAxKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0',
  'ZSh4LmJvb2tEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LnNlcnZpY2VEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyBzdGF0dXNTZWxlY3QoeCwgJ2FjLnNldFN0YXR1',
  'cycsIG9wdCgnYWNTdGF0dXNlcycpKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKHgudGVjaG5pY2lhbiB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbnVtKHguY29z',
  'dCkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCh4LnBob3RvUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiBtdXRlZCBjbGlwIj4nICsgZXNjKHgubm90ZSB8fCAnJykgKyAnPC90ZD4nICsKICAg',
  'ICAgICAgICAgJzx0ZD48ZGl2IGNsYXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1BYygnICsgYXR0cih4KSArICcpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAg',
  'ICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIGRnciIgb25jbGljaz0iZGVsQWMoXCcnICsgeC5pZCArICdcJykiPvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICAgJzwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+',
  'PC90YWJsZT48L2Rpdj4nCiAgICAgIDogZW1wdHlCb3goJ+C4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C4peC5ieC4suC4h+C5geC4reC4o+C5jOC5g+C4mScgKyB5ZWFyTGFiZWwpLCAnJywgdHJ1ZSk7CgogICAgcmV0',
  'dXJuIGhlYWQgKyBhY3Rpb25zICsgZ3JpZCArICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgbGlzdCArICc8L2Rpdj4nOwogIH0KfTsKCi8qKgogKiDguIrguYjguK3guIfguYDguKXguLfguK3guIHguKrguJbguLLguJnguLDguYPguJnguJXguLLguKPguLLguIcg4oCU',
  'IOC5gOC4m+C4peC4teC5iOC4ouC4meC5geC4peC5ieC4p+C4muC4seC4meC4l+C4tuC4geC4l+C4seC4meC4l+C4tSDguYTguKHguYjguJXguYnguK3guIfguYDguJvguLTguJTguJ/guK3guKPguYzguKEKICoKICog4Lir4LiZ4LmJ4Liy4LiV4Liy4LmA4Lir4Lih',
  '4Li34Lit4LiZ4Lib4LmJ4Liy4Lii4Liq4LiW4Liy4LiZ4Liw4LmA4LiU4Li04Lih4LiX4Li44LiB4Lit4Lii4LmI4Liy4LiHICjguKrguLXguYDguJTguLXguKLguKfguIHguLHguJkpIOC5geC4hOC5iOC4geC4lOC5geC4peC5ieC4p+C5gOC4peC4t+C4reC4geC5',
  'hOC4lOC5iQogKiDguITguJnguJfguLXguYjguYDguJvguLTguJTguJTguLnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKfguIjguLDguYDguKvguYfguJnguYDguJvguYfguJnguJvguYnguLLguKLguJjguKPguKPguKHguJTguLLguYDguKvguKHguLfguK3g',
  'uJnguYDguJTguLTguKEKICovCmZ1bmN0aW9uIHN0YXR1c1NlbGVjdCh4LCBhY3Rpb24sIG9wdGlvbnMpewogIGlmICghY2FuRWRpdCgpKSByZXR1cm4gc3RhdHVzQmFkZ2UoeC5zdGF0dXMpOwogIHZhciBjdXIgPSBTdHJpbmcoeC5zdGF0dXMgfHwgJycpOwogIHZh',
  'ciBsaXN0ID0gKG9wdGlvbnMgfHwgW10pLnNsaWNlKCk7CiAgaWYgKGN1ciAmJiBsaXN0LmluZGV4T2YoY3VyKSA8IDApIGxpc3QudW5zaGlmdChjdXIpOyAgIC8vIOC4hOC5iOC4suC5gOC4geC5iOC4suC4meC4reC4geC4o+C4suC4ouC4geC4suC4oyDguJXguYng',
  'uK3guIfguYTguKHguYjguKvguLLguKLguYTguJsKICByZXR1cm4gJzxzZWxlY3QgY2xhc3M9InN0LXNlbCAnICsgc3RhdHVzVG9uZShjdXIpICsgJyIgdGl0bGU9IuC5gOC4m+C4peC4teC5iOC4ouC4meC4quC4luC4suC4meC4sOC5hOC4lOC5ieC5gOC4peC4oiIn',
  'ICsKICAgICcgZGF0YS1wcmV2PSInICsgZXNjKGN1cikgKyAnIicgKwogICAgJyBvbmNoYW5nZT0iY2hhbmdlU3RhdHVzKFwnJyArIGFjdGlvbiArICdcJyxcJycgKyBlc2MoeC5pZCkgKyAnXCcsdGhpcykiPicgKwogICAgbGlzdC5tYXAoZnVuY3Rpb24obyl7CiAg',
  'ICAgIHJldHVybiAnPG9wdGlvbiB2YWx1ZT0iJyArIGVzYyhvKSArICciJyArIChvID09PSBjdXIgPyAnIHNlbGVjdGVkJyA6ICcnKSArICc+JyArIGVzYyhvKSArICc8L29wdGlvbj4nOwogICAgfSkuam9pbignJykgKyAnPC9zZWxlY3Q+JzsKfQoKLyoqIOC4quC4',
  'teC4guC4reC4h+C4quC4luC4suC4meC4sCDguYPguIrguYnguIrguLjguJTguYDguJTguLXguKLguKfguIHguLHguJrguJvguYnguLLguKIgc3RhdHVzQmFkZ2Ug4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4LmA4Lie4Li14LmJ4Lii4LiZ4LiB4Lix4LiZICovCmZ1',
  'bmN0aW9uIHN0YXR1c1RvbmUoc3QpewogIHZhciBtID0gU3RyaW5nKHN0YXR1c0JhZGdlKHN0KSkubWF0Y2goL2NsYXNzPSJiIChbYS16XSspIi8pOwogIHJldHVybiBtID8gbVsxXSA6ICdtdXRlJzsKfQoKZnVuY3Rpb24gY2hhbmdlU3RhdHVzKGFjdGlvbiwgaWQs',
  'IHNlbCl7CiAgdmFyIG5leHQgPSBzZWwudmFsdWUsIHByZXYgPSBzZWwuZ2V0QXR0cmlidXRlKCdkYXRhLXByZXYnKSB8fCAnJzsKICBzZWwuZGlzYWJsZWQgPSB0cnVlOwogIHNlbC5jbGFzc05hbWUgPSAnc3Qtc2VsICcgKyBzdGF0dXNUb25lKG5leHQpOwoKICBj',
  'YWxsQXBpKGFjdGlvbiwgeyBpZDogaWQsIHN0YXR1czogbmV4dCB9KS50aGVuKGZ1bmN0aW9uKHNhdmVkKXsKICAgIGlmIChzYXZlZCAmJiBzYXZlZC5maWxsZWREYXRlKSB7CiAgICAgIHRvYXN0KCfguJrguLHguJnguJfguLbguIHguYHguKXguYnguKcgwrcg4LmA',
  '4LiV4Li04Lih4Lin4Lix4LiZ4LiX4Li14LmI4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4Lij4LmA4Lib4LmH4LiZICcgKyB0aERhdGUoc2F2ZWQuZmlsbGVkRGF0ZSkgKyAnIOC5g+C4q+C5ieC4lOC5ieC4p+C4oicsICdvaycpOwogICAgfQogICAgc2VsLnNldEF0',
  'dHJpYnV0ZSgnZGF0YS1wcmV2JywgbmV4dCk7CiAgICBzZWwuZGlzYWJsZWQgPSBmYWxzZTsKICAgIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgICAvLyDguIrguYjguK3guIfguKvguYnguK3guIfguIHguLHguJrguJXguLHguKfguYDguKXguILguKrguKPguLjguJvg',
  'uJTguYnguLLguJnguJrguJnguK3guLLguIjguYDguJvguKXguLXguYjguKLguJnguJXguLLguKEKICAgIHJlZnJlc2hBbGVydHMoKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgIGlmIChwcmV2KSB7IHNlbC52YWx1ZSA9IHByZXY7IHNlbC5jbGFzc05hbWUg',
  'PSAnc3Qtc2VsICcgKyBzdGF0dXNUb25lKHByZXYpOyB9CiAgICBzZWwuZGlzYWJsZWQgPSBmYWxzZTsKICAgIHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7CiAgfSk7Cn0KCmZ1bmN0aW9uIG9wZW5BY1Jvb20ocm9vbSl7CiAgdmFyIGQgPSBTLmNhY2hlLmFj',
  'OwogIHZhciByID0gZC5yb29tcy5maWx0ZXIoZnVuY3Rpb24oeCl7IHJldHVybiB4LnJvb20gPT09IHJvb207IH0pWzBdOwogIHZhciBib2R5ID0KICAgICc8ZGl2IGNsYXNzPSJncmlkIGczIG1iMTIiPicgKwogICAgICBrcGkoJ+C4o+C4reC4muC4l+C4teC5iOC4',
  'peC5ieC4suC4h+C5g+C4meC4m+C4teC4meC4teC5iScsIChyLnJvdW5kc0luWWVhcnx8MCkgKyAnIOC4o+C4reC4micsICcnKSArCiAgICAgIGtwaSgn4Lil4LmJ4Liy4LiH4Lil4LmI4Liy4Liq4Li44LiUJywgci5sYXN0U2VydmljZSA/IHRoRGF0ZShyLmxhc3RT',
  'ZXJ2aWNlKSA6ICfigJMnLCByLmxhc3RTZXJ2aWNlID8gKGRheXNBZ28oci5sYXN0U2VydmljZSkgKyAnIOC4p+C4seC4meC4l+C4teC5iOC5geC4peC5ieC4pycpIDogJycpICsKICAgICAga3BpKCfguITguKPguJrguIHguLPguKvguJnguJTguKPguK3guJrguJbg',
  'uLHguJTguYTguJsnLCByLm5leHREdWUgPyB0aERhdGUoci5uZXh0RHVlKSA6ICfigJMnLCByLnN0YXRlLCByLnN0YXRlID09PSAn4LmA4LiB4Li04LiZ4LiB4Liz4Lir4LiZ4LiUJyA/ICdiYWQnIDogJycpICsKICAgICc8L2Rpdj4nICsKICAgIChyLnJlY29yZHMu',
  'bGVuZ3RoCiAgICAgID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiIHN0eWxlPSJtaW4td2lkdGg6YXV0byI+PHRoZWFkPjx0cj48dGg+4Lij4Lit4LiaPC90aD48dGg+4LiZ4Lix4LiUPC90aD48dGg+4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4Lij',
  'PC90aD48dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD48dGg+4Lig4Liy4LiePC90aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIHIucmVjb3Jkcy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgICAgICByZXR1cm4gJzx0cj48dGQ+JyArICh4LnJv',
  'dW5kfHwxKSArICc8L3RkPjx0ZCBjbGFzcz0iZnMxMiI+JyArIHRoRGF0ZSh4LmJvb2tEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgdGhEYXRlKHguc2VydmljZURhdGUpICsgJzwvdGQ+PHRkPicgKyBzdGF0dXNCYWRn',
  'ZSh4LnN0YXR1cykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCh4LnBob3RvUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9XCdjbG9zZU1vZGFsKCk7Zm9ybUFj',
  'KCcgKyBhdHRyKHgpICsgJylcJz7guYHguIHguYnguYTguII8L2J1dHRvbj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4Lii4Lix4LiH4LmE4Lih4LmI',
  '4Lih4Li14Lia4Lix4LiZ4LiX4Li24LiB4LmD4LiZ4Lib4Li14LiX4Li14LmI4LmA4Lil4Li34Lit4LiBPC9kaXY+Jyk7CgogIG9wZW5Nb2RhbCgn4p2E77iPIOC4peC5ieC4suC4h+C5geC4reC4o+C5jCDCtyDguKvguYnguK3guIcgJyArIHJvb20sIGJvZHksCiAg',
  'ICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4m+C4tOC4lDwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtmb3JtQWMoe3Jvb206XCcnICsgcm9vbSArICdcJ30p',
  'Ij4rIOC5gOC4nuC4tOC5iOC4oeC4o+C4reC4muC4geC4suC4o+C4peC5ieC4suC4hzwvYnV0dG9uPicpOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgNSkg4LiL4LmI4Lit4Lih4LmB',
  '4LiL4Lih4LiV4Liy4Lih4Lir4LmJ4Lit4LiHCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMucmVwYWlycyA9IHsKICBsb2FkOiBmdW5jdGlvbigpeyByZXR1cm4gY2FsbEFwaSgn',
  'cmVwYWlyLm1hdHJpeCcsIHsgeWVhcjogUy55ZWFyIH0pOyB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgeWVhckxhYmVsID0gUy55ZWFyID09PSAnYWxsJyA/ICfguJfguLjguIHguJvguLUnIDogJ+C4m+C4tSAnICsgUy55ZWFyOwogICAgdmFyIGhl',
  'YWQgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAga3BpKCfguIfguLLguJnguIvguYjguK3guKEgJyArIHllYXJMYWJlbCwgZC50b3RhbEpvYnMgKyAnIOC4h+C4suC4mScsICfguIjguLLguIEgJyArIGQucm9vbXMuZmlsdGVyKGZ1bmN0aW9u',
  'KHIpe3JldHVybiByLmNvdW50PjA7fSkubGVuZ3RoICsgJyDguKvguYnguK3guIcnLCAnYWNjZW50JykgKwogICAgICBrcGkoJ+C4h+C4suC4meC4l+C4teC5iOC4ouC4seC4h+C5hOC4oeC5iOC5gOC4quC4o+C5h+C4iCcsIGQub3BlbkpvYnMgKyAnIOC4h+C4suC4',
  'mScsIGQub3BlblRhc2tzID8gJ+C4hOC5ieC4suC4h+C4reC4ouC4ueC5iCAnICsgZC5vcGVuVGFza3MgKyAnIOC4iOC4uOC4lCcgOiAnJywgZC5vcGVuSm9icyA/ICd3YXJuJyA6ICdnb29kJykgKwogICAgICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4',
  'suC4ouC4o+C4p+C4oScsIGJhaHQoZC50b3RhbENvc3QpLCB5ZWFyTGFiZWwpICsKICAgICAga3BpKCfguKvguYnguK3guIfguJfguLXguYjguKLguLHguIfguYTguKHguYjguYDguITguKLguIvguYjguK3guKEnLCBkLnJvb21zLmZpbHRlcihmdW5jdGlvbihyKXty',
  'ZXR1cm4gci5jb3VudD09PTA7fSkubGVuZ3RoICsgJyDguKvguYnguK3guIcnLCAn4LmD4LiZJyArIHllYXJMYWJlbCkgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIGFjdGlvbnMgPSAnPGRpdiBjbGFzcz0icm93IG1iMTIiPicgKwogICAgICAnPGJ1dHRvbiBjbGFz',
  'cz0iYnRuIHByaSIgb25jbGljaz0iZm9ybVJlcGFpcihudWxsKSI+KyDguYHguIjguYnguIfguIvguYjguK3guKEgLyDguJrguLHguJnguJfguLbguIHguIfguLLguJnguIvguYjguK3guKE8L2J1dHRvbj4nICsKICAgICAgJzxzcGFuIGNsYXNzPSJzcCI+PC9zcGFu',
  'PjxzcGFuIGNsYXNzPSJmczEyIG11dGVkIj7guITguKXguLTguIHguJfguLXguYjguKvguYnguK3guIfguYDguJ7guLfguYjguK3guJTguLnguJvguKPguLDguKfguLHguJXguLTguIfguLLguJnguIvguYjguK3guKHguILguK3guIfguKvguYnguK3guIfguJnguLHg',
  'uYnguJk8L3NwYW4+PC9kaXY+JzsKCiAgICB2YXIgZ3JpZCA9IGNhcmQoJ/CflKcg4Lig4Liy4Lie4Lij4Lin4Lih4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4Lij4Liy4Lii4Lir4LmJ4Lit4LiHIMK3ICcgKyB5ZWFyTGFiZWwsIHJvb21GbG9vcnMoZC5yb29tcywgZnVu',
  'Y3Rpb24ocil7CiAgICAgIHZhciBjbHMgPSByLm9wZW5Db3VudCA+IDAgPyAncy1kZ3InIDogKHIuY291bnQgPiAwID8gJ3Mtb2snIDogJ3MtaW5mbycpOwogICAgICB2YXIgc3ViID0gci5jb3VudCA+IDAKICAgICAgICA/ICc8Yj4nICsgci5jb3VudCArICcg4LiH',
  '4Liy4LiZPC9iPicgKyAoci5vcGVuQ291bnQgPyAnIMK3IOC4hOC5ieC4suC4hyAnICsgKHIub3BlblRhc2tzIHx8IHIub3BlbkNvdW50KSArICcg4LiI4Li44LiUJyA6ICcnKSArICc8YnI+JyArIChyLmxhc3QgPyB0aERhdGVTaG9ydChyLmxhc3QpIDogJycpCiAg',
  'ICAgICAgOiAn4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ4LiL4LmI4Lit4LihJzsKICAgICAgcmV0dXJuIHsgY2xzOiBjbHMsIHN1Yjogc3ViLCBvbmNsaWNrOiAnb3BlblJlcGFpclJvb20oXCcnICsgci5yb29tICsgJ1wnKScgfTsKICAgIH0pKTsKCiAgICB2YXIg',
  'cm93cyA9IFtdOwogICAgZC5yb29tcy5mb3JFYWNoKGZ1bmN0aW9uKHIpeyByLnJlY29yZHMuZm9yRWFjaChmdW5jdGlvbih4KXsgcm93cy5wdXNoKHgpOyB9KTsgfSk7CiAgICByb3dzLnNvcnQoZnVuY3Rpb24oYSxiKXsgcmV0dXJuIFN0cmluZyhiLnJlcGFpckRh',
  'dGV8fGIuYm9va0RhdGV8fCcnKS5sb2NhbGVDb21wYXJlKFN0cmluZyhhLnJlcGFpckRhdGV8fGEuYm9va0RhdGV8fCcnKSk7IH0pOwoKICAgIHZhciBsaXN0ID0gY2FyZCgn8J+TiyDguKPguLLguKLguIHguLLguKPguIfguLLguJnguIvguYjguK3guKEgwrcgJyAr',
  'IHllYXJMYWJlbCArICcgKCcgKyByb3dzLmxlbmd0aCArICcpJywKICAgICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDoxMDIwcHgiPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guKvg',
  'uYnguK3guIc8L3RoPjx0aD7guKfguLHguJnguJnguLHguJTguIvguYjguK3guKE8L3RoPjx0aD7guKfguLHguJnguYDguILguYnguLLguIvguYjguK3guKE8L3RoPjx0aD7guJvguKPguLDguYDguKDguJc8L3RoPjx0aD7guKPguLLguKLguIHguLLguKPguJfguLXg',
  'uYjguIvguYjguK3guKHguYHguIvguKE8L3RoPicgKwogICAgICAgICc8dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD48dGggY2xhc3M9Im51bSI+4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiPC90aD48dGg+4LiB4LmI4Lit4LiZPC90aD48dGg+4Lir4Lil4Lix',
  '4LiHPC90aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIHJvd3MubWFwKGZ1bmN0aW9uKHgpewogICAgICAgICAgcmV0dXJuICc8dHI+JyArCiAgICAgICAgICAgICc8dGQ+PGI+JyArIGVzYyh4LnJvb20pICsgJzwvYj48L3RkPicgKwog',
  'ICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LmJvb2tEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LnJlcGFpckRhdGUpICsgJzwvdGQ+JyArCiAgICAg',
  'ICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyBlc2MoeC5jYXRlZ29yeSB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBzdHlsZT0ibWluLXdpZHRoOjI4MHB4Ij4nICsgdG9kb0xpc3RIdG1sKHgpICsgJzwvdGQ+JyArCiAgICAgICAgICAg',
  'ICc8dGQ+JyArIHN0YXR1c0JhZGdlKHguc3RhdHVzKSArICh4LnByaW9yaXR5ICYmIHgucHJpb3JpdHkgIT09ICfguJvguIHguJXguLQnID8gJyAnICsgc3RhdHVzQmFkZ2UoeC5wcmlvcml0eSkgOiAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFz',
  'cz0ibnVtIj4nICsgbnVtKHguY29zdCkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCh4LmJlZm9yZVJlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwoeC5hZnRlclJlZnMpICsgJzwvdGQ+JyAr',
  'CiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24iIG9uY2xpY2s9XCdmb3JtUmVwYWlyKCcgKyBhdHRyKHgpICsgJylcJz7inI/vuI88L2J1dHRvbj4nICsKICAg',
  'ICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24gZGdyIiBvbmNsaWNrPSJkZWxSZXBhaXIoXCcnICsgeC5pZCArICdcJykiPvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICAgJzwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycp',
  'ICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nCiAgICAgIDogZW1wdHlCb3goJ+C4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4i+C5iOC4reC4oeC5g+C4mScgKyB5ZWFyTGFiZWwsICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3Jt',
  'UmVwYWlyKG51bGwpIj4rIOC5geC4iOC5ieC4h+C4i+C5iOC4reC4oTwvYnV0dG9uPicpLCAnJywgdHJ1ZSk7CgogICAgcmV0dXJuIGhlYWQgKyBhY3Rpb25zICsgZ3JpZCArICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgbGlzdCArICc8L2Rpdj4nOwogIH0KfTsKCi8q',
  'KgogKiDguYDguIrguYfguITguKXguLTguKrguJXguYzguJfguLXguYjguJXguLTguYrguIHguYTguJTguYnguIjguKPguLTguIfguIjguLLguIHguKvguJnguYnguLLguKPguLLguKLguIHguLLguKMg4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LmA4Lib4Li04LiU4Lif',
  '4Lit4Lij4LmM4LihCiAqIOC4leC4tOC5iuC4geC4m+C4uOC5iuC4muC4muC4seC4meC4l+C4tuC4geC4guC4tuC5ieC4meC4iuC4teC4leC4l+C4seC4meC4l+C4tSDguYHguKXguLDguJbguYnguLLguJXguLTguYrguIHguITguKPguJrguJfguLjguIHguILguYng',
  'uK0g4Liq4LiW4Liy4LiZ4Liw4LiI4Liw4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LmA4Lib4LmH4LiZICLguYDguKrguKPguYfguIjguKrguLTguYnguJkiIOC5g+C4q+C5ieC5gOC4reC4hwogKi8KZnVuY3Rpb24gdG9kb0xpc3RIdG1sKHgpewogIHZhciB0b2RvID0g',
  'eC50b2RvIHx8IFtdOwogIGlmICghdG9kby5sZW5ndGgpIHJldHVybiAnPHNwYW4gY2xhc3M9ImZzMTMgbXV0ZWQiPicgKyBlc2MoeC5pdGVtcyB8fCAn4oCTJykgKyAnPC9zcGFuPic7CgogIHZhciBwID0geC5wcm9ncmVzcyB8fCB7IGRvbmU6IDAsIHRvdGFsOiB0',
  'b2RvLmxlbmd0aCwgcGVyY2VudDogMCB9OwogIHZhciBsb2NrZWQgPSAhY2FuRWRpdCgpOwoKICByZXR1cm4gJzxkaXYgY2xhc3M9InRvZG8tdmlldyI+JyArCiAgICAnPGRpdiBjbGFzcz0idG9kby1iYXIiPjxpIHN0eWxlPSJ3aWR0aDonICsgcC5wZXJjZW50ICsg',
  'JyUiPjwvaT48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJ0b2RvLW1ldGEiPuC5gOC4quC4o+C5h+C4iOC5geC4peC5ieC4pyA8Yj4nICsgcC5kb25lICsgJy8nICsgcC50b3RhbCArICc8L2I+IOC4h+C4suC4mTwvZGl2PicgKwogICAgdG9kby5tYXAoZnVuY3Rp',
  'b24odCwgaSl7CiAgICAgIHJldHVybiAnPGxhYmVsIGNsYXNzPSJ0b2RvLWxpbmUnICsgKHQuZG9uZSA/ICcgZG9uZScgOiAnJykgKyAobG9ja2VkID8gJyBsb2NrZWQnIDogJycpICsgJyI+JyArCiAgICAgICAgJzxpbnB1dCB0eXBlPSJjaGVja2JveCInICsgKHQu',
  'ZG9uZSA/ICcgY2hlY2tlZCcgOiAnJykgKyAobG9ja2VkID8gJyBkaXNhYmxlZCcgOiAnJykgKwogICAgICAgICAgJyBvbmNoYW5nZT0idG9nZ2xlVG9kbyhcJycgKyBlc2MoeC5pZCkgKyAnXCcsJyArIGkgKyAnLHRoaXMuY2hlY2tlZCx0aGlzKSI+JyArCiAgICAg',
  'ICAgJzxzcGFuIGNsYXNzPSJubSI+JyArIGVzYyh0Lm5hbWUpICsgJzwvc3Bhbj4nICsKICAgICAgICAodC5jYXRlZ29yeSA/ICc8c3BhbiBjbGFzcz0iYiBtdXRlIGNhdCI+JyArIGVzYyh0LmNhdGVnb3J5KSArICc8L3NwYW4+JyA6ICcnKSArCiAgICAgICc8L2xh',
  'YmVsPic7CiAgICB9KS5qb2luKCcnKSArCiAgJzwvZGl2Pic7Cn0KCi8qKgogKiDguJXguLTguYrguIHguIfguLLguJnguKvguJnguLbguYjguIfguILguYnguK0g4oCUIOC4reC4seC4m+C5gOC4lOC4leC4q+C4meC5ieC4suC4iOC4reC4l+C4seC4meC4l+C4teC5',
  'geC4peC5ieC4p+C4hOC5iOC4reC4ouC4muC4seC4meC4l+C4tuC4gQogKiDguJbguYnguLLguJrguLHguJnguJfguLbguIHguYTguKHguYjguJzguYjguLLguJkg4LmD4Lir4LmJ4LiV4Li04LmK4LiB4LiB4Lil4Lix4Lia4LmE4Lib4LmA4Lib4LmH4LiZ4LmA4Lir',
  '4Lih4Li34Lit4LiZ4LmA4LiU4Li04LihIOC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC5gOC4guC5ieC4suC5g+C4iOC4nOC4tOC4lOC4p+C5iOC4suC4muC4seC4meC4l+C4tuC4geC5geC4peC5ieC4pwogKi8KZnVuY3Rpb24gdG9nZ2xlVG9kbyhpZCwgaW5kZXgs',
  'IGRvbmUsIGJveCl7CiAgdmFyIGxpbmUgPSBib3guY2xvc2VzdCgnLnRvZG8tbGluZScpOwogIGlmIChsaW5lKSBsaW5lLmNsYXNzTGlzdC50b2dnbGUoJ2RvbmUnLCBkb25lKTsKICBib3guZGlzYWJsZWQgPSB0cnVlOwoKICBjYWxsQXBpKCdyZXBhaXIudG9nZ2xl',
  'JywgeyBpZDogaWQsIGluZGV4OiBpbmRleCwgZG9uZTogZG9uZSB9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7ICAgICAgICAvLyDguITguKfguLLguKHguITguLfguJrguKvguJnguYnguLLguIHguLHguJrguKrguJbguLLguJng',
  'uLDguK3guLLguIjguYDguJvguKXguLXguYjguKLguJkg4LiL4Li04LiH4LiB4LmM4LmA4LiH4Li14Lii4LiaIOC5hgogICAgcmVmcmVzaEFsZXJ0cygpOyAgICAgICAgICAgICAgLy8g4LiH4Liy4LiZ4LiE4LmJ4Liy4LiH4Lit4Liy4LiI4Lil4LiU4Lil4LiHIOC4',
  'leC4seC4p+C5gOC4peC4guC4muC4meC5gOC4oeC4meC4ueC4leC5ieC4reC4h+C4leC4suC4oeC4lOC5ieC4p+C4ogogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgYm94LmNoZWNrZWQgPSAhZG9uZTsKICAgIGlmIChsaW5lKSBsaW5lLmNsYXNzTGlzdC50b2dn',
  'bGUoJ2RvbmUnLCAhZG9uZSk7CiAgICBib3guZGlzYWJsZWQgPSBmYWxzZTsKICAgIHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7CiAgfSk7Cn0KCmZ1bmN0aW9uIG9wZW5SZXBhaXJSb29tKHJvb20pewogIHZhciBkID0gUy5jYWNoZS5yZXBhaXJzOwogIHZh',
  'ciByID0gZC5yb29tcy5maWx0ZXIoZnVuY3Rpb24oeCl7IHJldHVybiB4LnJvb20gPT09IHJvb207IH0pWzBdOwogIHZhciBib2R5ID0gJzxkaXYgY2xhc3M9ImdyaWQgZzMgbWIxMiI+JyArCiAgICAgIGtwaSgn4LiH4Liy4LiZ4LiX4Lix4LmJ4LiH4Lir4Lih4LiU',
  'Jywgci5jb3VudCArICcg4LiH4Liy4LiZJywgJycpICsKICAgICAga3BpKCfguKLguLHguIfguYTguKHguYjguYDguKrguKPguYfguIgnLCByLm9wZW5Db3VudCArICcg4LiH4Liy4LiZJywgci5vcGVuVGFza3MgPyAn4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmIICcg',
  'KyByLm9wZW5UYXNrcyArICcg4LiI4Li44LiUJyA6ICcnLCByLm9wZW5Db3VudCA/ICd3YXJuJzonZ29vZCcpICsKICAgICAga3BpKCfguITguYjguLLguYPguIrguYnguIjguYjguLLguKInLCBiYWh0KHIuY29zdCksICcnKSArCiAgICAnPC9kaXY+JyArCiAgICAo',
  'ci5yZWNvcmRzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0bCI+JyArIHIucmVjb3Jkcy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0idGwtaSI+PGRpdiBjbGFzcz0iZCI+JyArIHRoRGF0ZSh4LnJlcGFpckRhdGUgfHwgeC5ib29rRGF0',
  'ZSkgKyAnIMK3ICcgKyBlc2MoeC5jYXRlZ29yeXx8JycpICsgJyAnICsgc3RhdHVzQmFkZ2UoeC5zdGF0dXMpICsgJzwvZGl2PicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJ0Ij4nICsgdG9kb0xpc3RIdG1sKHgpICsgJzwvZGl2PicgKwogICAgICAgICh4LnRlY2hu',
  'aWNpYW4gPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCI+4LiK4LmI4Liy4LiHOiAnICsgZXNjKHgudGVjaG5pY2lhbikgKyAnPC9kaXY+JyA6ICcnKSArCiAgICAgICAgKHguY29zdCA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIj7guITguYjguLLguYPguIrguYng',
  'uIjguYjguLLguKIgJyArIGJhaHQoeC5jb3N0KSArICc8L2Rpdj4nIDogJycpICsKICAgICAgICAnPGRpdiBjbGFzcz0ibXQ4Ij4nICsgdGh1bWJzSHRtbCgoeC5iZWZvcmVSZWZzfHxbXSkuY29uY2F0KHguYWZ0ZXJSZWZzfHxbXSkpICsgJzwvZGl2PicgKwogICAg',
  'ICAgICc8ZGl2IGNsYXNzPSJtdDgiPjxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz1cJ2Nsb3NlTW9kYWwoKTtmb3JtUmVwYWlyKCcgKyBhdHRyKHgpICsgJylcJz7guYHguIHguYnguYTguII8L2J1dHRvbj48L2Rpdj4nICsKICAgICAgJzwvZGl2Pic7CiAg',
  'ICB9KS5qb2luKCcnKSArICc8L2Rpdj4nIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij7guKLguLHguIfguYTguKHguYjguKHguLXguIfguLLguJnguIvguYjguK3guKHguYPguJnguJvguLXguJfguLXguYjguYDguKXguLfguK3guIE8L2Rpdj4nKTsKCiAgb3Blbk1vZGFs',
  'KCfwn5SnIOC4h+C4suC4meC4i+C5iOC4reC4oSDCtyDguKvguYnguK3guIcgJyArIHJvb20sIGJvZHksCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4m+C4tOC4lDwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9',
  'ImJ0biBwcmkiIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtmb3JtUmVwYWlyKHtyb29tOlwnJyArIHJvb20gKyAnXCd9KSI+KyDguYDguJ7guLTguYjguKHguIfguLLguJnguIvguYjguK3guKE8L2J1dHRvbj4nLCB0cnVlKTsKfQoKLyogPT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDYpIOC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT0gKi8KUk9VVEVTLmJ1aWxkaW5nID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7CiAgICByZXR1cm4gUHJvbWlzZS5hbGwoWwogICAgICBjYWxsQXBpKCdidWlsZGluZy5zdW1tYXJ5JywgeyB5ZWFyOiBTLnllYXIgfSksCiAgICAgIGNhbGxBcGkoJ2J1',
  'aWxkaW5nLmxpc3QnLCB7IHllYXI6IFMueWVhciwgem9uZTogUy5wYXJhbXMuem9uZSB8fCAnJywgc3RhdHVzOiAnJyB9KQogICAgXSkudGhlbihmdW5jdGlvbihyKXsgdmFyIGQgPSByWzBdOyBkLml0ZW1zID0gclsxXTsgcmV0dXJuIGQ7IH0pOwogIH0sCiAgcmVu',
  'ZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICBr',
  'cGkoJ+C4h+C4suC4meC4m+C4tSAnICsgKFMueWVhcj09PSdhbGwnPyfguJfguLHguYnguIfguKvguKHguJQnOlMueWVhciksIGQueWVhckNvdW50ICsgJyDguIfguLLguJknLCAn4Liq4Liw4Liq4LihICcgKyBkLnRvdGFsICsgJyDguIfguLLguJknLCAnYWNjZW50',
  'JykgKwogICAgICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oiAnICsgeWVhckxhYmVsLCBiYWh0KGQueWVhckNvc3QpLCAn4Liq4Liw4Liq4LihICcgKyBiYWh0KGQuZ3JhbmRDb3N0KSkgKwogICAgICBrcGkoJ+C4h+C4suC4meC4l+C4teC5iOC4',
  'ouC4seC4h+C5hOC4oeC5iOC5gOC4quC4o+C5h+C4iCcsIGQub3BlbkNvdW50ICsgJyDguIfguLLguJknLCAnJywgZC5vcGVuQ291bnQgPyAnd2FybicgOiAnZ29vZCcpICsKICAgICAga3BpKCfguITguKPguJrguIHguLPguKvguJnguJTguYPguJkgOTAg4Lin4Lix',
  '4LiZJywgZC51cGNvbWluZy5sZW5ndGggKyAnIOC4h+C4suC4mScsIGQudXBjb21pbmcubGVuZ3RoID8gZC51cGNvbWluZ1swXS50aXRsZSA6ICcnLCBkLnVwY29taW5nLmxlbmd0aCA/ICd3YXJuJyA6ICcnKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgem9uZXMg',
  'PSAnPGRpdiBjbGFzcz0iY2hpcHMgbWIxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJjaGlwICcgKyAoIVMucGFyYW1zLnpvbmU/J29uJzonJykgKyAnIiBvbmNsaWNrPSJzZXRQYXJhbShcJ3pvbmVcJyxcJ1wnKSI+4LiX4Li44LiB4Liq4LmI4Lin4LiZPC9i',
  'dXR0b24+JyArCiAgICAgIGQuYnlab25lLm1hcChmdW5jdGlvbih6KXsKICAgICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9ImNoaXAgJyArIChTLnBhcmFtcy56b25lPT09ei56b25lPydvbic6JycpICsgJyIgb25jbGljaz0ic2V0UGFyYW0oXCd6b25lXCcsXCcn',
  'ICsgZXNjKHouem9uZSkgKyAnXCcpIj4nICsKICAgICAgICAgICAgICAgZXNjKHouem9uZSkgKyAnICgnICsgei5jb3VudCArICcpPC9idXR0b24+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKCiAgICB2YXIgY2hhcnRzID0gJzxkaXYgY2xhc3M9Imdy',
  'aWQgZzIgbWIxMiI+JyArCiAgICAgIGNhcmQoJ/Cfj5fvuI8g4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4LmB4Lii4LiB4LiV4Liy4Lih4Liq4LmI4Lin4LiZ4LiC4Lit4LiH4Lit4Liy4LiE4Liy4LijJywgYmFyQ2hhcnQoZC5ieVpvbmUsICd6b25lJywg',
  'J2Nvc3QnLCBmdW5jdGlvbihpKXsgcmV0dXJuIG1vbmV5KGkuY29zdCkgKyAnIOC4vyc7IH0pKSArCiAgICAgIGNhcmQoJ/Cfk4Ug4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4LmB4Lii4LiB4LiV4Liy4Lih4Lib4Li1JywgYmFyQ2hhcnQoCiAgICAgICAg',
  'ZC5ieVllYXIubWFwKGZ1bmN0aW9uKHkpeyByZXR1cm4geyBsYWJlbDon4Lib4Li1ICcgKyB5LnllYXIgKyAnICgnICsgeS5jb3VudCArICcg4LiH4Liy4LiZKScsIGNvc3Q6eS5jb3N0IH07IH0pLAogICAgICAgICdsYWJlbCcsICdjb3N0JywgZnVuY3Rpb24oaSl7',
  'IHJldHVybiBtb25leShpLmNvc3QpICsgJyDguL8nOyB9KSkgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIHJvd3MgPSBkLml0ZW1zOwogICAgdmFyIGxpc3QgPSBjYXJkKCfwn4+iIOC4o+C4suC4ouC4geC4suC4o+C4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4',
  'geC5guC4lOC4ouC4o+C4p+C4oSDCtyAnICsgeWVhckxhYmVsICsgJyAoJyArIHJvd3MubGVuZ3RoICsgJyknLAogICAgICByb3dzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOjEwMjBweCI+PHRoZWFk',
  'Pjx0cj4nICsKICAgICAgICAnPHRoPuC4quC5iOC4p+C4meC4guC4reC4h+C4reC4suC4hOC4suC4ozwvdGg+PHRoPuC4o+C4suC4ouC4geC4suC4ozwvdGg+PHRoPuC4meC4seC4lDwvdGg+PHRoPuC5gOC4o+C4tOC5iOC4oTwvdGg+PHRoPuC5gOC4quC4o+C5h+C4',
  'iDwvdGg+PHRoPuC4quC4luC4suC4meC4sDwvdGg+JyArCiAgICAgICAgJzx0aD7guJzguLnguYnguKPguLHguJrguYDguKvguKHguLI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguYjguLLguYPguIrguYnguIjguYjguLLguKI8L3RoPjx0aD7guKPguK3guJrguJbg',
  'uLHguJTguYTguJs8L3RoPjx0aD7guKDguLLguJ48L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgcm93cy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgICAgICByZXR1cm4gJzx0cj4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMx',
  'MiI+PGI+JyArIGVzYyh4LnpvbmUgfHwgJ+KAkycpICsgJzwvYj48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEzIj48ZGl2IGNsYXNzPSJjbGlwIj4nICsgZXNjKHgudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAgICAgICh4Lm5vdGUgPyAn',
  'PGRpdiBjbGFzcz0iZnMxMiBmYWludCBjbGlwIj4nICsgZXNjKHgubm90ZSkgKyAnPC9kaXY+JyA6ICcnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LmJvb2tEYXRlKSArICc8L3RkPicgKwogICAg',
  'ICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LnN0YXJ0RGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIGZzMTIiPicgKyB0aERhdGUoeC5lbmREYXRlKSArICc8L3RkPicgKwogICAgICAgICAg',
  'ICAnPHRkPicgKyBzdGF0dXNCYWRnZSh4LnN0YXR1cykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyh4LmNvbnRyYWN0b3IgfHwgJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyAr',
  'IG51bSh4LmNvc3QpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgKHgubmV4dER1ZSA/IHRoRGF0ZVNob3J0KHgubmV4dER1ZSkgKwogICAgICAgICAgICAgICAgKHguZHVlSW5EYXlzICE9IG51bGwgPyAnPGRpdiBj',
  'bGFzcz0iZmFpbnQiIHN0eWxlPSJmb250LXNpemU6MTFweCI+JyArICh4LmR1ZUluRGF5czwwID8gJ+C5gOC4peC4oiAnICsgKC14LmR1ZUluRGF5cykgKyAnIOC4p+C4seC4mScgOiAn4Lit4Li14LiBICcgKyB4LmR1ZUluRGF5cyArICcg4Lin4Lix4LiZJykgKyAn',
  'PC9kaXY+JyA6ICcnKQogICAgICAgICAgICAgIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwoKHgucGhvdG9SZWZzfHxbXSkuY29uY2F0KHguc2xpcFJlZnN8fFtdKSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0',
  'ZD48ZGl2IGNsYXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1CdWlsZGluZygnICsgYXR0cih4KSArICcpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAgICAgJzxi',
  'dXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIGRnciIgb25jbGljaz0iZGVsQnVpbGRpbmcoXCcnICsgeC5pZCArICdcJykiPvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICAgJzwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+',
  'PC90YWJsZT48L2Rpdj4nCiAgICAgIDogZW1wdHlCb3goJ+C4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5g+C4mScgKyB5ZWFyTGFiZWwsICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNr',
  'PSJmb3JtQnVpbGRpbmcobnVsbCkiPisg4LmA4Lie4Li04LmI4Lih4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiV4Li24LiBPC9idXR0b24+JyksCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIHNtIiBvbmNsaWNrPSJmb3JtQnVpbGRpbmcobnVsbCkiPisg4LmA',
  '4Lie4Li04LmI4Lih4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiV4Li24LiBPC9idXR0b24+JywgdHJ1ZSk7CgogICAgcmV0dXJuIGhlYWQgKyB6b25lcyArIGNoYXJ0cyArIGxpc3Q7CiAgfQp9OwoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDcpIOC4q+C5ieC4reC4h+C4nuC4seC4gQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLnJvb21zID0gewogIGxvYWQ6IGZ1bmN0',
  'aW9uKCl7IHJldHVybiBjYWxsQXBpKCdyb29tLmxpc3QnKS50aGVuKGZ1bmN0aW9uKGZsb29ycyl7IHJldHVybiB7IGZsb29yczogZmxvb3JzLCB5ZWFyczogW10gfTsgfSk7IH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciBmbGF0ID0gW107CiAgICBk',
  'LmZsb29ycy5mb3JFYWNoKGZ1bmN0aW9uKGYpeyBmLnJvb21zLmZvckVhY2goZnVuY3Rpb24ocil7IGZsYXQucHVzaChyKTsgfSk7IH0pOwogICAgdmFyIG9jYyA9IGZsYXQuZmlsdGVyKGZ1bmN0aW9uKHIpeyByZXR1cm4gci5zdGF0dXMgPT09ICfguKHguLXguJzg',
  'uLnguYnguYDguIrguYjguLInOyB9KS5sZW5ndGg7CgogICAgdmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAga3BpKCfguKvguYnguK3guIfguJfguLHguYnguIfguKvguKHguJQnLCBmbGF0Lmxlbmd0aCArICcg4Lir4LmJ4Lit',
  '4LiHJywgJzUg4LiK4Lix4LmJ4LiZJywgJ2FjY2VudCcpICsKICAgICAga3BpKCfguKHguLXguJzguLnguYnguYDguIrguYjguLInLCBvY2MgKyAnIOC4q+C5ieC4reC4hycsIHBjdChmbGF0Lmxlbmd0aCA/IG9jYy9mbGF0Lmxlbmd0aCoxMDAgOiAwKSArICcg4Lit',
  '4Lix4LiV4Lij4Liy4LmA4LiC4LmJ4Liy4Lie4Lix4LiBJywgJ2dvb2QnKSArCiAgICAgIGtwaSgn4Lir4LmJ4Lit4LiH4Lin4LmI4Liy4LiHJywgZmxhdC5maWx0ZXIoZnVuY3Rpb24ocil7IHJldHVybiByLnN0YXR1cyA9PT0gJ+C4p+C5iOC4suC4hyc7IH0pLmxl',
  'bmd0aCArICcg4Lir4LmJ4Lit4LiHJywgJycsICd3YXJuJykgKwogICAgICBrcGkoJ+C4hOC5iOC4suC5gOC4iuC5iOC4suC4o+C4p+C4oS/guYDguJTguLfguK3guJknLCBiYWh0KGZsYXQucmVkdWNlKGZ1bmN0aW9uKGEscil7IHJldHVybiBhICsgKE51bWJlcihy',
  'LnJlbnQpfHwwKTsgfSwgMCkpLCAn4LiI4Liy4LiB4Lir4LmJ4Lit4LiH4LiX4Li14LmI4LiB4Lij4Lit4LiB4LiE4LmI4Liy4LmA4LiK4LmI4Liy4LmE4Lin4LmJJykgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIGdyaWQgPSBjYXJkKCfwn5qqIOC4nOC4seC4h+C4',
  'q+C5ieC4reC4h+C4nuC4seC4gScsIHJvb21GbG9vcnMoZmxhdCwgZnVuY3Rpb24ocil7CiAgICAgIHZhciBjbHMgPSByLnN0YXR1cyA9PT0gJ+C4oeC4teC4nOC4ueC5ieC5gOC4iuC5iOC4sicgPyAncy1vaycgOiAoci5zdGF0dXMgPT09ICfguKfguYjguLLguIcn',
  'ID8gJ3MtaW5mbycgOiAncy13YXJuJyk7CiAgICAgIHJldHVybiB7IGNsczogY2xzLCBzdWI6IGVzYyhyLnRlbmFudCB8fCByLnN0YXR1cyB8fCAnJykgKyAoci5yZW50ID8gJzxicj4nICsgbW9uZXkoci5yZW50KSArICcg4Li/JyA6ICcnKSwKICAgICAgICAgICAg',
  'ICAgb25jbGljazogJ29wZW5Sb29tKFwnJyArIHIucm9vbSArICdcJyknIH07CiAgICB9KSwgJzxzcGFuIGNsYXNzPSJmczEyIG11dGVkIj7guITguKXguLTguIHguJfguLXguYjguKvguYnguK3guIfguYDguJ7guLfguYjguK3guJTguLnguJvguKPguLDguKfguLHg',
  'uJXguLTguJfguLHguYnguIfguKvguKHguJTguILguK3guIfguKvguYnguK3guIfguJnguLHguYnguJk8L3NwYW4+Jyk7CgogICAgcmV0dXJuIGhlYWQgKyBncmlkOwogIH0KfTsKCmZ1bmN0aW9uIG9wZW5Sb29tKHJvb20pewogIG9wZW5Nb2RhbCgn8J+aqiDguKvg',
  'uYnguK3guIcgJyArIHJvb20sICc8ZGl2IGNsYXNzPSJlbXB0eSI+PHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4LmC4Lir4Lil4LiU4oCmPC9kaXY+Jyk7CiAgY2FsbEFwaSgncm9vbS5wcm9maWxlJywgeyByb29tOiByb29tIH0pLnRo',
  'ZW4oZnVuY3Rpb24ocCl7CiAgICB2YXIgaSA9IHAuaW5mbzsKICAgIHZhciBib2R5ID0KICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgICAga3BpKCfguKrguJbguLLguJnguLAnLCBpLnN0YXR1cyB8fCAn4oCTJywgZXNjKGkudGVuYW50',
  'IHx8ICcnKSkgKwogICAgICAgIGtwaSgn4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJywgcC5hY0NvdW50ICsgJyDguITguKPguLHguYnguIcnLCBwLmxhc3RBYyA/ICfguKXguYjguLLguKrguLjguJQgJyArIHRoRGF0ZShwLmxhc3RBYykgOiAn4LmE4Lih4LmI4Lih',
  '4Li14Lib4Lij4Liw4Lin4Lix4LiV4Li0JykgKwogICAgICAgIGtwaSgn4LiH4Liy4LiZ4LiL4LmI4Lit4LihJywgcC5yZXBhaXJDb3VudCArICcg4LiH4Liy4LiZJywgJ+C4hOC5ieC4suC4hyAnICsgcC5vcGVuUmVwYWlycywgcC5vcGVuUmVwYWlycyA/ICd3YXJu',
  'JyA6ICcnKSArCiAgICAgICAga3BpKCfguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguKrguLDguKrguKEnLCBiYWh0KHAudG90YWxDb3N0KSwgJ+C4i+C5iOC4reC4oSArIOC4peC5ieC4suC4h+C5geC4reC4o+C5jCcpICsKICAgICAgJzwvZGl2PicgKwog',
  'ICAgICAnPGRpdiBjbGFzcz0icm93IG1iMTIiPicgKwogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9XCdjbG9zZU1vZGFsKCk7Zm9ybVJvb20oJyArIGF0dHIoaSkgKyAnKVwnPuKcj++4jyDguYHguIHguYnguYTguILguILguYnguK3guKHg',
  'uLnguKXguKvguYnguK3guIc8L2J1dHRvbj4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCk7Zm9ybVJlcGFpcih7cm9vbTpcJycgKyByb29tICsgJ1wnfSkiPisg4LmB4LiI4LmJ4LiH4LiL4LmI4Lit4LihPC9i',
  'dXR0b24+JyArCiAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iY2xvc2VNb2RhbCgpO2Zvcm1BYyh7cm9vbTpcJycgKyByb29tICsgJ1wnfSkiPisg4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMPC9idXR0b24+JyArCiAgICAgICc8L2Rpdj4n',
  'ICsKICAgICAgJzxkaXYgY2xhc3M9ImNhcmQgbWIxMiI+PGRpdiBjbGFzcz0iY2FyZC1oIj48aDM+4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZ4LmD4LiZ4Lir4LmJ4Lit4LiHPC9oMz4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNr',
  'PVwnY2xvc2VNb2RhbCgpO2Zvcm1Bc3NldCh7cm9vbToiJyArIGVzYyhyb29tKSArICcifSlcJz4rIOC5gOC4nuC4tOC5iOC4oeC4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4mTwvYnV0dG9uPicgKwogICAgICAnPC9kaXY+PGRpdiBjbGFzcz0iY2FyZC1iIj4nICsK',
  'ICAgICAgICAocC5hc3NldHMubGVuZ3RoCiAgICAgICAgICA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOmF1dG8iPjx0aGVhZD48dHI+JyArCiAgICAgICAgICAgICc8dGg+4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li0',
  '4LiZPC90aD48dGg+4Lii4Li14LmI4Lir4LmJ4LitL+C4o+C4uOC5iOC4mTwvdGg+PHRoPuC4leC4tOC4lOC4leC4seC5ieC4hzwvdGg+PHRoPuC4m+C4o+C4sOC4geC4seC4meC4luC4tuC4hzwvdGg+PHRoPuC4quC4luC4suC4meC4sDwvdGg+PHRoPjwvdGg+PC90',
  'cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICAgICAgcC5hc3NldHMubWFwKGZ1bmN0aW9uKGEpewogICAgICAgICAgICAgIHJldHVybiAnPHRyPjx0ZD48Yj4nICsgZXNjKGEubmFtZSkgKyAnPC9iPicgKwogICAgICAgICAgICAgICAgICAgICAgIChhLnNlcmlh',
  'bCA/ICc8YnI+PHNwYW4gY2xhc3M9ImZzMTIgbXV0ZWQiPlMvTiAnICsgZXNjKGEuc2VyaWFsKSArICc8L3NwYW4+JyA6ICcnKSArICc8L3RkPicgKwogICAgICAgICAgICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKGEuYnJhbmR8fCfigJMnKSAr',
  'ICc8L3RkPicgKwogICAgICAgICAgICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgdGhEYXRlKGEuaW5zdGFsbERhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyAoYS53YXJyYW50eUVuZCA/IHRo',
  'RGF0ZShhLndhcnJhbnR5RW5kKSA6ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAgICAgICAgICAnPHRkPicgKyBzdGF0dXNCYWRnZShhLnN0YXR1cykgKyAnPC90ZD4nICsKICAgICAgICAgICAgICAgICAgICAgJzx0ZCBjbGFzcz0idC1hY3Rpb25zIj48',
  'YnV0dG9uIGNsYXNzPSJidG4gaWNvbiBzbSIgdGl0bGU9IuC5geC4geC5ieC5hOC4giIgJyArCiAgICAgICAgICAgICAgICAgICAgICAgJ29uY2xpY2s9XCdjbG9zZU1vZGFsKCk7Zm9ybUFzc2V0KCcgKyBhdHRyKGEpICsgJylcJz7inI/vuI88L2J1dHRvbj48L3Rk',
  'PjwvdHI+JzsKICAgICAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicKICAgICAgICAgIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij7guKLguLHguIfguYTguKHguYjguYTguJTguYnguJrguLHguJnguJfguLbguIHguJfguKPguLHguJ7g',
  'uKLguYzguKrguLTguJnguILguK3guIfguKvguYnguK3guIfguJnguLXguYk8L2Rpdj4nKSArCiAgICAgICc8L2Rpdj48L2Rpdj4nICsKICAgICAgJzxoMyBjbGFzcz0iZnMxMyBtYjgiPuC4m+C4o+C4sOC4p+C4seC4leC4tOC4l+C4seC5ieC4h+C4q+C4oeC4lCAo',
  'JyArIHAudGltZWxpbmUubGVuZ3RoICsgJyk8L2gzPicgKwogICAgICAocC50aW1lbGluZS5sZW5ndGggPyAnPGRpdiBjbGFzcz0idGwiPicgKyBwLnRpbWVsaW5lLm1hcChmdW5jdGlvbihlKXsKICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9InRsLWkiPjxkaXYg',
  'Y2xhc3M9ImQiPicgKyB0aERhdGUoZS5kYXRlKSArICcgwrcgJyArIGVzYyhlLnR5cGUpICsgJyAnICsgc3RhdHVzQmFkZ2UoZS5zdGF0dXMpICsgJzwvZGl2PicgKwogICAgICAgICAgJzxkaXYgY2xhc3M9InQiPicgKyBlc2MoZS50aXRsZSkgKyAnPC9kaXY+JyAr',
  'CiAgICAgICAgICAoZS50b2RvICYmIGUudG9kby5sZW5ndGggPyB0b2RvTGlzdEh0bWwoZSkgOiAnJykgKwogICAgICAgICAgKGUuZGV0YWlsID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQiPicgKyBlc2MoZS5kZXRhaWwpICsgJzwvZGl2PicgOiAnJykgKwogICAg',
  'ICAgICAgKGUuY29zdCA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIj4nICsgYmFodChlLmNvc3QpICsgJzwvZGl2PicgOiAnJykgKwogICAgICAgICAgKGUucGhvdG9zICYmIGUucGhvdG9zLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJtdDgiPicgKyB0aHVtYnNIdG1s',
  'KGUucGhvdG9zKSArICc8L2Rpdj4nIDogJycpICsKICAgICAgICAnPC9kaXY+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JyA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lib4Lij4Liw4Lin4Lix4LiV4Li0PC9kaXY+',
  'Jyk7CgogICAgb3Blbk1vZGFsKCfwn5qqIOC4q+C5ieC4reC4hyAnICsgcm9vbSArICcgwrcg4LiK4Lix4LmJ4LiZICcgKyAoaS5mbG9vcnx8JycpLCBib2R5LAogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4m+C4tOC4',
  'lDwvYnV0dG9uPicsIHRydWUpOwogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsICdlcnInKTsgY2xvc2VNb2RhbCgpOyB9KTsKfQoKCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PQogICA4KSDguKPguLLguKLguKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4Lii4Lir4LitICjguKPguLLguKLguYDguJTguLfguK3guJkpCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PSAqLwovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4LiB4Lij4Liy4LifIOKAlCDguKfguLLguJTguYDguJvguYfguJkgU1ZHIOC4leC4o+C4hyDguYYg4LmE4Lih4LmI4Lie4Li24LmI4LiH',
  '4LmE4Lil4Lia4Lij4Liy4Lij4Li14LiC4LmJ4Liy4LiH4LiZ4Lit4LiBCiAgIOC5gOC4nuC4o+C4suC4sOC4q+C4meC5ieC4suC5gOC4p+C5h+C4muC4guC4reC4hyBBcHBzIFNjcmlwdCDguYLguKvguKXguJTguKrguITguKPguLTguJvguJXguYzguILguYnguLLg',
  'uKHguYLguJTguYDguKHguJnguYTguKHguYjguYTguJTguYkKICAg4LmB4Lil4Liw4Lir4LiZ4LmJ4Liy4LiV4Lix4Lin4Lit4Lii4LmI4Liy4LiH4LiV4LmJ4Lit4LiH4LmA4Lib4Li04LiU4LmE4LiU4LmJ4LmC4LiU4Lii4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LiV',
  '4LmI4Lit4LmA4LiZ4LmH4LiVCgogICDguKrguLXguJfguLXguYjguYPguIrguYnguYDguJvguYfguJnguJnguYnguLPguYDguIfguLTguJkv4Liq4LmJ4LihIOC5hOC4oeC5iOC5g+C4iuC5iOC5gOC4guC4teC4ouC4py/guYHguJTguIcg4LmA4Lie4Lij4Liy4Liw',
  '4Lin4Lix4LiU4LmB4Lil4LmJ4Lin4LmA4LiC4Li14Lii4Lin4LiB4Lix4Lia4LmB4LiU4LiHCiAgIOC4hOC4meC4leC4suC4muC4reC4lOC4quC4teC5gOC4guC4teC4ouC4py3guYHguJTguIfguYHguKLguIHguYTguKHguYjguK3guK3guIEgKM6URSA0Ljkg4LiV',
  '4LmI4Liz4LiB4Lin4LmI4Liy4LmA4LiB4LiT4LiR4LmMIDYpIOC4hOC4ueC5iOC4meC4teC5ieC5hOC4lOC5iSAyNy42CiAgIOC4l+C4uOC4geC4leC4seC4p+C5gOC4peC4guC4l+C4teC5iOC4geC4o+C4suC4n+C5geC4quC4lOC4hyDguK3guYjguLLguJnguYTg',
  'uJTguYnguIjguLLguIHguJXguLLguKPguLLguIfguILguYnguLLguIfguKXguYjguLLguIfguYDguKrguKHguK0KICAg4LiB4Lil4LmI4Lit4LiH4Lia4Lit4LiB4LiE4LmI4Liy4LiV4Lit4LiZ4LiK4Li14LmJ4LmA4Lib4LmH4LiZ4LiC4Lit4LiH4LmB4LiW4Lih',
  'IOC5hOC4oeC5iOC5g+C4iuC5iOC4l+C4suC4h+C5gOC4lOC4teC4ouC4p+C4l+C4teC5iOC4iOC4sOC4o+C4ueC5ieC4hOC5iOC4sgogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCnZhciBD',
  'SEFSVF9XID0gNzIwLCBDSEFSVF9QQURMID0gNjIsIENIQVJUX1BBRFIgPSAxNCwgQ0hBUlRfUEFEVCA9IDE0Owp2YXIgQ0hBUlRfT04gPSBudWxsOwoKLyoqIOC4m+C4seC4lOC4guC4tuC5ieC4meC5gOC4m+C5h+C4meC5gOC4peC4guC4geC4peC4oSDguYYg4Liq',
  '4Liz4Lir4Lij4Lix4Lia4Lir4Lix4Lin4LmB4LiB4LiZIFkgKi8KZnVuY3Rpb24gbmljZU1heCh2KXsKICBpZiAodiA8PSAwKSByZXR1cm4gMTsKICB2YXIgbWFnID0gTWF0aC5wb3coMTAsIE1hdGguZmxvb3IoTWF0aC5sb2codikgLyBNYXRoLkxOMTApKTsKICB2',
  'YXIgbiA9IHYgLyBtYWc7CiAgdmFyIHN0ZXAgPSBuIDw9IDEgPyAxIDogbiA8PSAyID8gMiA6IG4gPD0gMi41ID8gMi41IDogbiA8PSA1ID8gNSA6IDEwOwogIHJldHVybiBzdGVwICogbWFnOwp9CgovKiog4Lii4LmI4Lit4LiI4Liz4LiZ4Lin4LiZ4LmA4LiH4Li0',
  '4LiZ4LmD4Lir4LmJ4Liq4Lix4LmJ4LiZ4Lie4Lit4Liq4Liz4Lir4Lij4Lix4Lia4Lir4Lix4Lin4LmB4LiB4LiZIOKAlCAxLjIg4LilLiAvIDg1SyAqLwpmdW5jdGlvbiBzaG9ydEJhaHQodil7CiAgdmFyIGEgPSBNYXRoLmFicyh2KTsKICBpZiAoYSA+PSAxMDAw',
  'MDAwKSByZXR1cm4gKHYgLyAxMDAwMDAwKS50b0ZpeGVkKGEgPj0gMTAwMDAwMDAgPyAwIDogMSkucmVwbGFjZSgvXC4wJC8sICcnKSArICcg4LilLic7CiAgaWYgKGEgPj0gMTAwMCkgcmV0dXJuIE1hdGgucm91bmQodiAvIDEwMDApICsgJ0snOwogIHJldHVybiBT',
  'dHJpbmcoTWF0aC5yb3VuZCh2KSk7Cn0KCi8qKiDguYHguJfguYjguIfguJfguLXguYjguJvguKXguLLguKLguJTguYnguLLguJnguILguYnguK3guKHguLnguKXguKHguJkgNHB4IOC4lOC5ieC4suC4meC4kOC4suC4meC5gOC4q+C4peC4teC5iOC4ouC4oSAqLwpm',
  'dW5jdGlvbiBiYXJQYXRoKHgsIHksIHcsIGgsIHVwKXsKICB2YXIgciA9IE1hdGgubWluKDQsIHcgLyAyLCBoKTsKICBpZiAoaCA8PSAwLjUpIHJldHVybiAnJzsKICByZXR1cm4gdXAKICAgID8gJ00nICsgeCArICcsJyArICh5ICsgaCkgKyAnVicgKyAoeSArIHIp',
  'ICsgJ2EnICsgciArICcsJyArIHIgKyAnIDAgMCAxICcgKyByICsgJywtJyArIHIgKwogICAgICAnaCcgKyAodyAtIDIgKiByKSArICdhJyArIHIgKyAnLCcgKyByICsgJyAwIDAgMSAnICsgciArICcsJyArIHIgKyAnVicgKyAoeSArIGgpICsgJ1onCiAgICA6ICdN',
  'JyArIHggKyAnLCcgKyB5ICsgJ1YnICsgKHkgKyBoIC0gcikgKyAnYScgKyByICsgJywnICsgciArICcgMCAwIDAgJyArIHIgKyAnLCcgKyByICsKICAgICAgJ2gnICsgKHcgLSAyICogcikgKyAnYScgKyByICsgJywnICsgciArICcgMCAwIDAgJyArIHIgKyAnLC0n',
  'ICsgciArICdWJyArIHkgKyAnWic7Cn0KCi8qKiDguILguYnguK3guKHguLnguKXguILguK3guIfguIHguKXguYjguK3guIfguJrguK3guIHguITguYjguLIg4LmA4LiB4LmH4Lia4LmA4Lib4LmH4LiZIEpTT04g4LmD4LiZIGF0dHJpYnV0ZSDguYHguKXguYnguKcg',
  'ZXNjKCkg4LmD4Lir4LmJ4Lib4Lil4Lit4LiU4Lig4Lix4LiiICovCmZ1bmN0aW9uIHRpcERhdGEobGFiZWwsIHJvd3MpewogIHJldHVybiBlc2MoSlNPTi5zdHJpbmdpZnkoeyBsOiBsYWJlbCwgcjogcm93cyB9KSk7Cn0KCmZ1bmN0aW9uIGhpdFJlY3QoeCwgeSwg',
  'dywgaCwgdGlwKXsKICByZXR1cm4gJzxyZWN0IGNsYXNzPSJoaXQiIHRhYmluZGV4PSIwIiByb2xlPSJidXR0b24iIHg9IicgKyB4ICsgJyIgeT0iJyArIHkgKwogICAgICAgICAnIiB3aWR0aD0iJyArIHcgKyAnIiBoZWlnaHQ9IicgKyBoICsgJyIgZGF0YS10aXA9',
  'IicgKyB0aXAgKyAnIj48L3JlY3Q+JzsKfQoKZnVuY3Rpb24gZ3JpZEFuZFRpY2tzKHRvcCwgcGxvdEgsIG1heCwgbGluZXMpewogIHZhciBvdXQgPSAnJzsKICBmb3IgKHZhciBpID0gMDsgaSA8PSBsaW5lczsgaSsrKSB7CiAgICB2YXIgeSA9IHRvcCArIHBsb3RI',
  'IC0gKHBsb3RIICogaSAvIGxpbmVzKTsKICAgIG91dCArPSAnPGxpbmUgY2xhc3M9ImdyaWQtbCIgeDE9IicgKyBDSEFSVF9QQURMICsgJyIgeTE9IicgKyB5ICsgJyIgeDI9IicgKyAoQ0hBUlRfVyAtIENIQVJUX1BBRFIpICsgJyIgeTI9IicgKyB5ICsgJyI+PC9s',
  'aW5lPicgKwogICAgICAgICAgICc8dGV4dCBjbGFzcz0idGljayIgeD0iJyArIChDSEFSVF9QQURMIC0gOCkgKyAnIiB5PSInICsgKHkgKyA0KSArICciIHRleHQtYW5jaG9yPSJlbmQiPicgKyBzaG9ydEJhaHQobWF4ICogaSAvIGxpbmVzKSArICc8L3RleHQ+JzsK',
  'ICB9CiAgcmV0dXJuIG91dDsKfQoKZnVuY3Rpb24gc3ZnV3JhcChib2R5LCBoLCB0aXRsZSl7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJjaGFydC13cmFwIj48c3ZnIGNsYXNzPSJjaGFydCIgdmlld0JveD0iMCAwICcgKyBDSEFSVF9XICsgJyAnICsgaCArICciICcg',
  'KwogICAgJ3JvbGU9ImltZyIgYXJpYS1sYWJlbD0iJyArIGVzYyh0aXRsZSkgKyAnIiBvbnBvaW50ZXJtb3ZlPSJjaGFydEhvdmVyKGV2ZW50KSIgb25wb2ludGVybGVhdmU9ImNoYXJ0T3V0KCkiICcgKwogICAgJ29uZm9jdXNpbj0iY2hhcnRIb3ZlcihldmVudCki',
  'IG9uZm9jdXNvdXQ9ImNoYXJ0T3V0KCkiPicgKyBib2R5ICsgJzwvc3ZnPjwvZGl2Pic7Cn0KCi8qKgogKiDguIHguKPguLLguJ/guYHguJfguYjguIfguITguLnguYgg4Lij4Liy4Lii4Lij4Lix4LiaIC8g4Lij4Liy4Lii4LiI4LmI4Liy4LiiIOC4o+C4suC4ouC5',
  'gOC4lOC4t+C4reC4mQogKiDguJXguLTguJTguJvguYnguLLguKLguJXguLHguKfguYDguKXguILguYDguInguJ7guLLguLDguYDguJTguLfguK3guJnguKrguLnguIfguKrguLjguJTguILguK3guIfguYHguJXguYjguKXguLDguJ3guLHguYjguIcg4LmE4Lih4LmI',
  '4LiV4Li04LiU4LiX4Li44LiB4LmB4LiX4LmI4LiHCiAqIOC5gOC4nuC4o+C4suC4sOC4leC4tOC4lOC4hOC4o+C4muC4l+C4uOC4geC5geC4l+C5iOC4h+C5geC4peC5ieC4p+C4o+C4geC4iOC4meC5hOC4oeC5iOC4oeC4teC5g+C4hOC4o+C4reC5iOC4suC4mQog',
  'Ki8KZnVuY3Rpb24gY2hhcnRJbmNvbWVFeHBlbnNlKHJvd3MpewogIHZhciBwbG90SCA9IDE5MCwgdG9wID0gQ0hBUlRfUEFEVCwgSCA9IHRvcCArIHBsb3RIICsgMzA7CiAgdmFyIG1heCA9IG5pY2VNYXgoTWF0aC5tYXguYXBwbHkobnVsbCwgcm93cy5tYXAoZnVu',
  'Y3Rpb24obSl7IHJldHVybiBNYXRoLm1heChtLmluY29tZSwgbS5leHBlbnNlKTsgfSkpIHx8IDEpOwogIHZhciBiYW5kID0gKENIQVJUX1cgLSBDSEFSVF9QQURMIC0gQ0hBUlRfUEFEUikgLyByb3dzLmxlbmd0aDsKICB2YXIgYncgPSBNYXRoLm1pbigyNCwgKGJh',
  'bmQgLSAxMCkgLyAyKTsKCiAgdmFyIG1heEluID0gcm93cy5yZWR1Y2UoZnVuY3Rpb24oYSwgYil7IHJldHVybiBiLmluY29tZSA+IGEuaW5jb21lID8gYiA6IGE7IH0sIHJvd3NbMF0pOwogIHZhciBtYXhFeCA9IHJvd3MucmVkdWNlKGZ1bmN0aW9uKGEsIGIpeyBy',
  'ZXR1cm4gYi5leHBlbnNlID4gYS5leHBlbnNlID8gYiA6IGE7IH0sIHJvd3NbMF0pOwoKICB2YXIgYm9keSA9IGdyaWRBbmRUaWNrcyh0b3AsIHBsb3RILCBtYXgsIDQpOwogIHJvd3MuZm9yRWFjaChmdW5jdGlvbihtLCBpKXsKICAgIHZhciBjeCA9IENIQVJUX1BB',
  'REwgKyBiYW5kICogaSArIGJhbmQgLyAyOwogICAgLy8g4LmA4Lin4LmJ4LiZ4LiK4LmI4Lit4LiH4Lin4LmI4Liy4LiH4Liq4Li14Lie4Li34LmJ4LiZIDJweCDguKPguLDguKvguKfguYjguLLguIfguYHguJfguYjguIfguITguLnguYgg4LmE4Lih4LmI4LmD4LiK',
  '4LmJ4LmA4Liq4LmJ4LiZ4LiC4Lit4Lia4Lih4Liy4LiE4Lix4LmI4LiZCiAgICB2YXIgeDEgPSBjeCAtIGJ3IC0gMSwgeDIgPSBjeCArIDE7CiAgICB2YXIgaDEgPSBwbG90SCAqIChtLmluY29tZSAvIG1heCksIGgyID0gcGxvdEggKiAobS5leHBlbnNlIC8gbWF4',
  'KTsKICAgIGJvZHkgKz0gJzxnPicgKwogICAgICAnPHJlY3QgY2xhc3M9ImJhbmQiIHg9IicgKyAoY3ggLSBiYW5kIC8gMikgKyAnIiB5PSInICsgdG9wICsgJyIgd2lkdGg9IicgKyBiYW5kICsgJyIgaGVpZ2h0PSInICsgcGxvdEggKyAnIiByeD0iNiI+PC9yZWN0',
  'PicgKwogICAgICAnPHBhdGggY2xhc3M9ImMxIiBkPSInICsgYmFyUGF0aCh4MSwgdG9wICsgcGxvdEggLSBoMSwgYncsIGgxLCB0cnVlKSArICciPjwvcGF0aD4nICsKICAgICAgJzxwYXRoIGNsYXNzPSJjMiIgZD0iJyArIGJhclBhdGgoeDIsIHRvcCArIHBsb3RI',
  'IC0gaDIsIGJ3LCBoMiwgdHJ1ZSkgKyAnIj48L3BhdGg+JzsKICAgIGlmIChtID09PSBtYXhJbiAmJiBtLmluY29tZSkgewogICAgICBib2R5ICs9ICc8dGV4dCBjbGFzcz0iZGxhYiIgeD0iJyArICh4MSArIGJ3IC8gMikgKyAnIiB5PSInICsgKHRvcCArIHBsb3RI',
  'IC0gaDEgLSA2KSArICciIHRleHQtYW5jaG9yPSJtaWRkbGUiPicgKyBzaG9ydEJhaHQobS5pbmNvbWUpICsgJzwvdGV4dD4nOwogICAgfQogICAgaWYgKG0gPT09IG1heEV4ICYmIG0uZXhwZW5zZSkgewogICAgICBib2R5ICs9ICc8dGV4dCBjbGFzcz0iZGxhYiIg',
  'eD0iJyArICh4MiArIGJ3IC8gMikgKyAnIiB5PSInICsgKHRvcCArIHBsb3RIIC0gaDIgLSA2KSArICciIHRleHQtYW5jaG9yPSJtaWRkbGUiPicgKyBzaG9ydEJhaHQobS5leHBlbnNlKSArICc8L3RleHQ+JzsKICAgIH0KICAgIGJvZHkgKz0gJzx0ZXh0IGNsYXNz',
  'PSJ4bGFiIiB4PSInICsgY3ggKyAnIiB5PSInICsgKHRvcCArIHBsb3RIICsgMTgpICsgJyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+JyArIGVzYyhtLmxhYmVsKSArICc8L3RleHQ+JyArCiAgICAgIGhpdFJlY3QoY3ggLSBiYW5kIC8gMiwgdG9wLCBiYW5kLCBwbG90',
  'SCwKICAgICAgICB0aXBEYXRhKG0ubGFiZWwsIFtbJ+C4o+C4suC4ouC4o+C4seC4micsIG1vbmV5KG0uaW5jb21lKSwgMV0sIFsn4Lij4Liy4Lii4LiI4LmI4Liy4LiiJywgbW9uZXkobS5leHBlbnNlKSwgMl1dKSkgKwogICAgICAnPC9nPic7CiAgfSk7CgogIGJv',
  'ZHkgKz0gJzxsaW5lIGNsYXNzPSJheGlzLWwiIHgxPSInICsgQ0hBUlRfUEFETCArICciIHkxPSInICsgKHRvcCArIHBsb3RIKSArICciIHgyPSInICsgKENIQVJUX1cgLSBDSEFSVF9QQURSKSArICciIHkyPSInICsgKHRvcCArIHBsb3RIKSArICciPjwvbGluZT4n',
  'OwogIHJldHVybiBzdmdXcmFwKGJvZHksIEgsICfguIHguKPguLLguJ/guYHguJfguYjguIfguYDguJvguKPguLXguKLguJrguYDguJfguLXguKLguJrguKPguLLguKLguKPguLHguJrguIHguLHguJrguKPguLLguKLguIjguYjguLLguKLguILguK3guIfguYHguJXg',
  'uYjguKXguLDguYDguJTguLfguK3guJknKTsKfQoKLyoqCiAqIOC4geC4s+C5hOC4oy/guILguLLguJTguJfguLjguJnguKrguLjguJfguJjguLTguKPguLLguKLguYDguJTguLfguK3guJkg4oCUIOC5geC4l+C5iOC4h+C4guC4tuC5ieC4meC4iOC4suC4geC5gOC4',
  'quC5ieC4meC4qOC4ueC4meC4ouC5jOC4hOC4t+C4reC4geC4s+C5hOC4oyDguKXguIfguITguLfguK3guILguLLguJTguJfguLjguJkKICog4LiV4Liz4LmB4Lir4LiZ4LmI4LiH4LmA4Lir4LiZ4Li34LitL+C5g+C4leC5ieC5gOC4quC5ieC4meC5gOC4m+C5h+C4',
  'meC4leC4seC4p+C4muC4reC4geC4q+C4peC4seC4gSDguKrguLXguYDguJvguYfguJnguJXguLHguKfguKLguYnguLPguK3guLXguIHguIrguLHguYnguJnguKvguJnguLbguYjguIcKICovCmZ1bmN0aW9uIGNoYXJ0TmV0KHJvd3MpewogIHZhciBwbG90SCA9IDE3',
  'MCwgdG9wID0gQ0hBUlRfUEFEVCwgSCA9IHRvcCArIHBsb3RIICsgMzA7CiAgdmFyIG1heCA9IG5pY2VNYXgoTWF0aC5tYXguYXBwbHkobnVsbCwgcm93cy5tYXAoZnVuY3Rpb24obSl7IHJldHVybiBNYXRoLmFicyhtLm5ldCk7IH0pKSB8fCAxKTsKICB2YXIgYmFu',
  'ZCA9IChDSEFSVF9XIC0gQ0hBUlRfUEFETCAtIENIQVJUX1BBRFIpIC8gcm93cy5sZW5ndGg7CiAgdmFyIGJ3ID0gTWF0aC5taW4oMjQsIGJhbmQgLSAxMik7CiAgdmFyIHplcm8gPSB0b3AgKyBwbG90SCAvIDIsIGhhbGYgPSBwbG90SCAvIDI7CgogIHZhciBiZXN0',
  'ID0gcm93cy5yZWR1Y2UoZnVuY3Rpb24oYSwgYil7IHJldHVybiBiLm5ldCA+IGEubmV0ID8gYiA6IGE7IH0sIHJvd3NbMF0pOwogIHZhciB3b3JzdCA9IHJvd3MucmVkdWNlKGZ1bmN0aW9uKGEsIGIpeyByZXR1cm4gYi5uZXQgPCBhLm5ldCA/IGIgOiBhOyB9LCBy',
  'b3dzWzBdKTsKCiAgdmFyIGJvZHkgPSAnJzsKICBbMSwgMC41LCAwLCAtMC41LCAtMV0uZm9yRWFjaChmdW5jdGlvbihmKXsKICAgIHZhciB5ID0gemVybyAtIGhhbGYgKiBmOwogICAgYm9keSArPSAnPGxpbmUgY2xhc3M9ImdyaWQtbCIgeDE9IicgKyBDSEFSVF9Q',
  'QURMICsgJyIgeTE9IicgKyB5ICsgJyIgeDI9IicgKyAoQ0hBUlRfVyAtIENIQVJUX1BBRFIpICsgJyIgeTI9IicgKyB5ICsgJyI+PC9saW5lPicgKwogICAgICAgICAgICAnPHRleHQgY2xhc3M9InRpY2siIHg9IicgKyAoQ0hBUlRfUEFETCAtIDgpICsgJyIgeT0i',
  'JyArICh5ICsgNCkgKyAnIiB0ZXh0LWFuY2hvcj0iZW5kIj4nICsgc2hvcnRCYWh0KG1heCAqIGYpICsgJzwvdGV4dD4nOwogIH0pOwoKICByb3dzLmZvckVhY2goZnVuY3Rpb24obSwgaSl7CiAgICB2YXIgY3ggPSBDSEFSVF9QQURMICsgYmFuZCAqIGkgKyBiYW5k',
  'IC8gMjsKICAgIHZhciBoID0gaGFsZiAqIChNYXRoLmFicyhtLm5ldCkgLyBtYXgpOwogICAgdmFyIHVwID0gbS5uZXQgPj0gMDsKICAgIGJvZHkgKz0gJzxnPicgKwogICAgICAnPHJlY3QgY2xhc3M9ImJhbmQiIHg9IicgKyAoY3ggLSBiYW5kIC8gMikgKyAnIiB5',
  'PSInICsgdG9wICsgJyIgd2lkdGg9IicgKyBiYW5kICsgJyIgaGVpZ2h0PSInICsgcGxvdEggKyAnIiByeD0iNiI+PC9yZWN0PicgKwogICAgICAnPHBhdGggY2xhc3M9IicgKyAodXAgPyAnYzEnIDogJ2MyJykgKyAnIiBkPSInICsgYmFyUGF0aChjeCAtIGJ3IC8g',
  'MiwgdXAgPyB6ZXJvIC0gaCA6IHplcm8sIGJ3LCBoLCB1cCkgKyAnIj48L3BhdGg+JzsKICAgIGlmICgobSA9PT0gYmVzdCAmJiBtLm5ldCA+IDApIHx8IChtID09PSB3b3JzdCAmJiBtLm5ldCA8IDApKSB7CiAgICAgIGJvZHkgKz0gJzx0ZXh0IGNsYXNzPSJkbGFi',
  'IiB4PSInICsgY3ggKyAnIiB5PSInICsgKHVwID8gemVybyAtIGggLSA2IDogemVybyArIGggKyAxNCkgKyAnIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj4nICsgc2hvcnRCYWh0KG0ubmV0KSArICc8L3RleHQ+JzsKICAgIH0KICAgIGJvZHkgKz0gJzx0ZXh0IGNsYXNz',
  'PSJ4bGFiIiB4PSInICsgY3ggKyAnIiB5PSInICsgKHRvcCArIHBsb3RIICsgMTgpICsgJyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+JyArIGVzYyhtLmxhYmVsKSArICc8L3RleHQ+JyArCiAgICAgIGhpdFJlY3QoY3ggLSBiYW5kIC8gMiwgdG9wLCBiYW5kLCBwbG90',
  'SCwKICAgICAgICB0aXBEYXRhKG0ubGFiZWwsIFtbdXAgPyAn4LiB4Liz4LmE4LijJyA6ICfguILguLLguJTguJfguLjguJknLCBtb25leShtLm5ldCksIHVwID8gMSA6IDJdXSkpICsKICAgICAgJzwvZz4nOwogIH0pOwoKICBib2R5ICs9ICc8bGluZSBjbGFzcz0i',
  'YXhpcy1sIiB4MT0iJyArIENIQVJUX1BBREwgKyAnIiB5MT0iJyArIHplcm8gKyAnIiB4Mj0iJyArIChDSEFSVF9XIC0gQ0hBUlRfUEFEUikgKyAnIiB5Mj0iJyArIHplcm8gKyAnIj48L2xpbmU+JzsKICByZXR1cm4gc3ZnV3JhcChib2R5LCBILCAn4LiB4Lij4Liy',
  '4Lif4LiB4Liz4LmE4Lij4LiC4Liy4LiU4LiX4Li44LiZ4Liq4Li44LiX4LiY4Li04Lij4Liy4Lii4LmA4LiU4Li34Lit4LiZIOC5geC4l+C5iOC4h+C5gOC4q+C4meC4t+C4reC5gOC4quC5ieC4meC4hOC4t+C4reC4geC4s+C5hOC4oyDguYPguJXguYnguYDguKrg',
  'uYnguJnguITguLfguK3guILguLLguJTguJfguLjguJknKTsKfQoKZnVuY3Rpb24gY2hhcnRUaXBCb3goKXsKICB2YXIgYm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NoYXJ0VGlwJyk7CiAgaWYgKCFib3gpIHsKICAgIGJveCA9IGRvY3VtZW50LmNyZWF0',
  'ZUVsZW1lbnQoJ2RpdicpOwogICAgYm94LmlkID0gJ2NoYXJ0VGlwJzsKICAgIGJveC5jbGFzc05hbWUgPSAnY3RpcCc7CiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGJveCk7CiAgfQogIHJldHVybiBib3g7Cn0KCmZ1bmN0aW9uIGNoYXJ0SG92ZXIoZXYp',
  'ewogIHZhciBoaXQgPSBldi50YXJnZXQgJiYgZXYudGFyZ2V0LmNsb3Nlc3QgPyBldi50YXJnZXQuY2xvc2VzdCgnLmhpdCcpIDogbnVsbDsKICBpZiAoIWhpdCkgeyBjaGFydE91dCgpOyByZXR1cm47IH0KCiAgdmFyIGcgPSBoaXQucGFyZW50Tm9kZTsKICBpZiAo',
  'Q0hBUlRfT04gJiYgQ0hBUlRfT04gIT09IGcpIENIQVJUX09OLmNsYXNzTGlzdC5yZW1vdmUoJ29uJyk7CiAgZy5jbGFzc0xpc3QuYWRkKCdvbicpOwogIENIQVJUX09OID0gZzsKCiAgdmFyIGRhdGE7CiAgdHJ5IHsgZGF0YSA9IEpTT04ucGFyc2UoaGl0LmdldEF0',
  'dHJpYnV0ZSgnZGF0YS10aXAnKSB8fCAne30nKTsgfSBjYXRjaCAoZSkgeyByZXR1cm47IH0KCiAgLy8g4Lib4Lij4Liw4LiB4Lit4Lia4LiU4LmJ4Lin4LiiIHRleHRDb250ZW50IOC5hOC4oeC5iOC5g+C4iuC5iCBpbm5lckhUTUwg4oCUIOC4iuC4t+C5iOC4reC4',
  'o+C4suC4ouC4geC4suC4o+C4oeC4suC4iOC4suC4geC4guC5ieC4reC4oeC4ueC4pSDguYTguKHguYjguITguKfguKPguJbguLfguK3guKfguYjguLLguJvguKXguK3guJTguKDguLHguKIKICB2YXIgYm94ID0gY2hhcnRUaXBCb3goKTsKICBib3guaW5uZXJIVE1M',
  'ID0gJyc7CiAgdmFyIGhlYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICBoZWFkLmNsYXNzTmFtZSA9ICdtJzsKICBoZWFkLnRleHRDb250ZW50ID0gZGF0YS5sIHx8ICcnOwogIGJveC5hcHBlbmRDaGlsZChoZWFkKTsKCiAgKGRhdGEuciB8fCBb',
  'XSkuZm9yRWFjaChmdW5jdGlvbihyb3cpewogICAgdmFyIGxpbmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICAgIGxpbmUuY2xhc3NOYW1lID0gJ3InOwogICAgdmFyIGtleSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKTsKICAgIGtleS5z',
  'dHlsZS5iYWNrZ3JvdW5kID0gJ3ZhcigtLWMnICsgKHJvd1syXSB8fCAxKSArICcpJzsKICAgIHZhciBuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpOwogICAgbmFtZS50ZXh0Q29udGVudCA9IHJvd1swXTsKICAgIHZhciB2YWwgPSBkb2N1bWVu',
  'dC5jcmVhdGVFbGVtZW50KCdiJyk7CiAgICB2YWwudGV4dENvbnRlbnQgPSByb3dbMV07CiAgICBsaW5lLmFwcGVuZENoaWxkKGtleSk7IGxpbmUuYXBwZW5kQ2hpbGQobmFtZSk7IGxpbmUuYXBwZW5kQ2hpbGQodmFsKTsKICAgIGJveC5hcHBlbmRDaGlsZChsaW5l',
  'KTsKICB9KTsKCiAgLy8g4LmA4LiB4Liy4Liw4LiV4Liz4LmB4Lir4LiZ4LmI4LiH4LmA4Lih4Liy4Liq4LmMIOC5hOC4oeC5iOC5g+C4iuC5iOC4guC4reC4muC4muC4meC4guC4reC4h+C4iuC5iOC4reC4h+C4o+C4seC4muC4geC4suC4o+C4iuC4teC5iSAo4LiK',
  '4LmI4Lit4LiH4LiZ4Lix4LmJ4LiZ4Liq4Li54LiH4LmA4LiX4LmI4Liy4LiB4Lij4Liy4Lif4LiX4Lix4LmJ4LiH4Lit4Lix4LiZCiAgLy8g4Lin4Liy4LiH4LmE4Lin4LmJ4LiC4LmJ4Liy4LiH4Lia4LiZ4LiX4Li14LmE4Lij4LiB4LmH4LmE4Lib4Lia4Lix4LiH',
  '4Lir4Lix4Lin4LiC4LmJ4Lit4LiB4Liy4Lij4LmM4LiU4LiX4Li44LiB4LiX4Li1KSDguJbguYnguLLguYDguKXguLfguYjguK3guJnguJTguYnguKfguKLguYHguJvguYnguJnguJ7guLTguKHguJ7guYzguIHguYfguYPguIrguYnguJXguLHguKfguYHguJfguYjg',
  'uIfguYHguJfguJkKICB2YXIgciA9IGhpdC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTsKICB2YXIgcHggPSAoZXYuY2xpZW50WCB8fCBldi5jbGllbnRYID09PSAwKSA/IGV2LmNsaWVudFggOiByLmxlZnQgKyByLndpZHRoIC8gMjsKICB2YXIgcHkgPSAoZXYuY2xp',
  'ZW50WSB8fCBldi5jbGllbnRZID09PSAwKSA/IGV2LmNsaWVudFkgOiByLnRvcCArIHIuaGVpZ2h0IC8gMjsKICBib3guY2xhc3NMaXN0LmFkZCgnb24nKTsKICB2YXIgbGVmdCA9IE1hdGgubWluKE1hdGgubWF4KDgsIHB4IC0gYm94Lm9mZnNldFdpZHRoIC8gMiks',
  'IHdpbmRvdy5pbm5lcldpZHRoIC0gYm94Lm9mZnNldFdpZHRoIC0gOCk7CiAgdmFyIGFib3ZlID0gcHkgLSBib3gub2Zmc2V0SGVpZ2h0IC0gMTQ7CiAgYm94LnN0eWxlLmxlZnQgPSBsZWZ0ICsgJ3B4JzsKICBib3guc3R5bGUudG9wID0gKGFib3ZlIDwgOCA/IHB5',
  'ICsgMTggOiBhYm92ZSkgKyAncHgnOwp9CgpmdW5jdGlvbiBjaGFydE91dCgpewogIGlmIChDSEFSVF9PTikgeyBDSEFSVF9PTi5jbGFzc0xpc3QucmVtb3ZlKCdvbicpOyBDSEFSVF9PTiA9IG51bGw7IH0KICB2YXIgYm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5',
  'SWQoJ2NoYXJ0VGlwJyk7CiAgaWYgKGJveCkgYm94LmNsYXNzTGlzdC5yZW1vdmUoJ29uJyk7Cn0KCmZ1bmN0aW9uIGNoYXJ0TGVnZW5kKGEsIGIpewogIHJldHVybiAnPGRpdiBjbGFzcz0ibGVnZW5kIj4nICsKICAgICc8c3BhbiBjbGFzcz0iayI+PHNwYW4gY2xh',
  'c3M9InN3IiBzdHlsZT0iYmFja2dyb3VuZDp2YXIoLS1jMSkiPjwvc3Bhbj4nICsgZXNjKGEpICsgJzwvc3Bhbj4nICsKICAgICc8c3BhbiBjbGFzcz0iayI+PHNwYW4gY2xhc3M9InN3IiBzdHlsZT0iYmFja2dyb3VuZDp2YXIoLS1jMikiPjwvc3Bhbj4nICsgZXNj',
  'KGIpICsgJzwvc3Bhbj4nICsKICAgICc8L2Rpdj4nOwp9CgpST1VURVMuZmluYW5jZSA9IHsKICBsb2FkOiBmdW5jdGlvbigpewogICAgcmV0dXJuIFByb21pc2UuYWxsKFsKICAgICAgY2FsbEFwaSgnZmluYW5jZS5zdW1tYXJ5JywgeyB5ZWFyOiBTLnllYXIgfSks',
  'CiAgICAgIGNhbGxBcGkoJ2ZpbmFuY2UubGlzdCcsIHsgeWVhcjogUy55ZWFyLCBraW5kOiBTLnBhcmFtcy5raW5kIHx8ICcnIH0pCiAgICBdKS50aGVuKGZ1bmN0aW9uKHIpeyB2YXIgZCA9IHJbMF07IGQuaXRlbXMgPSByWzFdOyByZXR1cm4gZDsgfSk7CiAgfSwK',
  'ICByZW5kZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKICAgIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAg',
  'ICAgIGtwaSgn4Lij4Liy4Lii4Lij4Lix4LiaICcgKyB5ZWFyTGFiZWwsIGJhaHQoZC5pbmNvbWUpLCAn4LmA4LiJ4Lil4Li14LmI4LiiICcgKyBiYWh0KGQuYXZnSW5jb21lKSArICcv4LmA4LiU4Li34Lit4LiZJywgJ2dvb2QnKSArCiAgICAgIGtwaSgn4Lij4Liy',
  '4Lii4LiI4LmI4Liy4LiiICcgKyB5ZWFyTGFiZWwsIGJhaHQoZC5leHBlbnNlKSwgJ+C5gOC4ieC4peC4teC5iOC4oiAnICsgYmFodChkLmF2Z0V4cGVuc2UpICsgJy/guYDguJTguLfguK3guJknLCAnYmFkJykgKwogICAgICBrcGkoJ+C4hOC4h+C5gOC4q+C4peC4',
  't+C4reC4quC4uOC4l+C4mOC4tCcsIGJhaHQoZC5uZXQpLCAn4Lit4Lix4LiV4Lij4Liy4LiB4Liz4LmE4LijICcgKyBwY3QoZC5tYXJnaW4pLCAnYWNjZW50ICcgKyAoZC5uZXQgPj0gMCA/ICdnb29kJyA6ICdiYWQnKSkgKwogICAgICBrcGkoJ+C4muC4seC4meC4',
  'l+C4tuC4geC5geC4peC5ieC4pycsIGQubW9udGhzV2l0aERhdGEgKyAnIOC5gOC4lOC4t+C4reC4mScsIGQuY291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4oycpICsKICAgICc8L2Rpdj4nOwoKICAgIC8vIOC4geC4o+C4suC4n+C4geC5iOC4reC4mSDguYHguKXg',
  'uYnguKfguITguYjguK3guKLguJXguLLguKPguLLguIcg4oCUIOC4leC4suC4o+C4suC4h+C4guC5ieC4suC4h+C4peC5iOC4suC4h+C4hOC4t+C4reC4l+C4teC5iOC4reC5iOC4suC4meC4hOC5iOC4suC4iOC4o+C4tOC4h+C5hOC4lOC5ieC4l+C4uOC4geC4leC4',
  'seC4pwogICAgLy8g4LiB4Lij4Liy4Lif4LiK4LmI4Lin4Lii4LmD4Lir4LmJ4LmA4Lir4LmH4LiZ4LmB4LiZ4Lin4LmC4LiZ4LmJ4LihIOC5hOC4oeC5iOC5hOC4lOC5ieC4oeC4suC5geC4l+C4meC4leC4seC4p+C5gOC4peC4ggogICAgdmFyIGhhc0RhdGEgPSBk',
  'LmJ5TW9udGguc29tZShmdW5jdGlvbihtKXsgcmV0dXJuIG0uaW5jb21lIHx8IG0uZXhwZW5zZTsgfSk7CiAgICB2YXIgY2hhcnRzID0gIWhhc0RhdGEgPyAnJyA6CiAgICAgIGNhcmQoJ/Cfk4gg4Lij4Liy4Lii4Lij4Lix4LiaIC8g4Lij4Liy4Lii4LiI4LmI4Liy',
  '4LiiIOC4o+C4suC4ouC5gOC4lOC4t+C4reC4mSDCtyAnICsgeWVhckxhYmVsLAogICAgICAgIGNoYXJ0TGVnZW5kKCfguKPguLLguKLguKPguLHguJonLCAn4Lij4Liy4Lii4LiI4LmI4Liy4LiiJykgKyBjaGFydEluY29tZUV4cGVuc2UoZC5ieU1vbnRoKSkgKwog',
  'ICAgICBjYXJkKCfimpbvuI8g4LiB4Liz4LmE4LijIC8g4LiC4Liy4LiU4LiX4Li44LiZ4Liq4Li44LiX4LiY4Li0IOC4o+C4suC4ouC5gOC4lOC4t+C4reC4mSDCtyAnICsgeWVhckxhYmVsLAogICAgICAgICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIG1iOCI+4LmB',
  '4LiX4LmI4LiH4LmA4Lir4LiZ4Li34Lit4LmA4Liq4LmJ4LiZ4Lio4Li54LiZ4Lii4LmM4LiE4Li34Lit4LmA4LiU4Li34Lit4LiZ4LiX4Li14LmI4LiB4Liz4LmE4LijIOC5g+C4leC5ieC5gOC4quC5ieC4meC4hOC4t+C4reC5gOC4lOC4t+C4reC4meC4l+C4teC5',
  'iOC4guC4suC4lOC4l+C4uOC4mTwvZGl2PicgKwogICAgICAgIGNoYXJ0TmV0KGQuYnlNb250aCkpOwoKICAgIHZhciBtYXhCYXIgPSBNYXRoLm1heC5hcHBseShudWxsLCBkLmJ5TW9udGgubWFwKGZ1bmN0aW9uKG0peyByZXR1cm4gTWF0aC5tYXgobS5pbmNvbWUs',
  'IG0uZXhwZW5zZSk7IH0pKSB8fCAxOwogICAgdmFyIG1vbnRobHkgPSBjYXJkKCfwn5OFIOC4o+C4suC4ouC5gOC4lOC4t+C4reC4mSDCtyAnICsgeWVhckxhYmVsLAogICAgICAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsK',
  'ICAgICAgJzx0aD7guYDguJTguLfguK3guJk8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKPguLLguKLguKPguLHguJo8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKPguLLguKLguIjguYjguLLguKI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguIfguYDguKvguKXguLfguK08',
  'L3RoPicgKwogICAgICAnPHRoIHN0eWxlPSJ3aWR0aDozOCUiPuC5gOC4l+C4teC4ouC4muC4o+C4suC4ouC4o+C4seC4miAvIOC4o+C4suC4ouC4iOC5iOC4suC4ojwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgZC5ieU1vbnRoLm1hcChmdW5jdGlv',
  'bihtKXsKICAgICAgICB2YXIgYmxhbmsgPSAhbS5pbmNvbWUgJiYgIW0uZXhwZW5zZTsKICAgICAgICByZXR1cm4gJzx0cicgKyAoYmxhbmsgPyAnIHN0eWxlPSJvcGFjaXR5Oi40NSInIDogJycpICsgJz4nICsKICAgICAgICAgICc8dGQ+PGI+JyArIG0ubGFiZWwg',
  'KyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAobS5pbmNvbWUgPyBtb25leShtLmluY29tZSkgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChtLmV4cGVuc2UgPyBtb25leShtLmV4',
  'cGVuc2UpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxiIHN0eWxlPSJjb2xvcjonICsgKG0ubmV0ID49IDAgPyAndmFyKC0tb2spJyA6ICd2YXIoLS1kYW5nZXIpJykgKyAnIj4nICsKICAgICAgICAgICAgKGJsYW5rID8g',
  'J+KAkycgOiBtb25leShtLm5ldCkpICsgJzwvYj48L3RkPicgKwogICAgICAgICAgJzx0ZD4nICsKICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImJhci10cmFjayBtYjgiPjxkaXYgY2xhc3M9ImJhci1maWxsIiBzdHlsZT0id2lkdGg6JyArIChtLmluY29tZS9tYXhC',
  'YXIqMTAwKSArICclO2JhY2tncm91bmQ6dmFyKC0tYzEpIj48L2Rpdj48L2Rpdj4nICsKICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImJhci10cmFjayI+PGRpdiBjbGFzcz0iYmFyLWZpbGwiIHN0eWxlPSJ3aWR0aDonICsgKG0uZXhwZW5zZS9tYXhCYXIqMTAwKSAr',
  'ICclO2JhY2tncm91bmQ6dmFyKC0tYzIpIj48L2Rpdj48L2Rpdj4nICsKICAgICAgICAgICc8L3RkPjwvdHI+JzsKICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicsICcnLCB0cnVlKTsKCiAgICB2YXIgYnlLaW5kID0gY2FyZCgn8J+n',
  'viDguYHguKLguIHguJXguLLguKHguKPguLLguKLguIHguLLguKMgwrcgJyArIHllYXJMYWJlbCwKICAgICAgYmFyQ2hhcnQoZC5ieUtpbmQubWFwKGZ1bmN0aW9uKGspeyByZXR1cm4geyBsYWJlbDogay5raW5kICsgJyAoJyArIGsuY291bnQgKyAnKScsIHRvdGFs',
  'OiBrLnRvdGFsIH07IH0pLAogICAgICAgICAgICAgICAnbGFiZWwnLCAndG90YWwnLCBmdW5jdGlvbihpKXsgcmV0dXJuIG1vbmV5KGkudG90YWwpICsgJyDguL8nOyB9KSk7CgogICAgdmFyIGJ5WWVhciA9IGNhcmQoJ/Cfk4og4LmA4LiX4Li14Lii4Lia4Lij4Liy',
  '4Lii4Lib4Li1JywKICAgICAgZC5ieVllYXIubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiIHN0eWxlPSJtaW4td2lkdGg6YXV0byI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC4m+C4tTwvdGg+PHRoIGNsYXNzPSJudW0iPuC4',
  'o+C4suC4ouC4o+C4seC4mjwvdGg+PHRoIGNsYXNzPSJudW0iPuC4o+C4suC4ouC4iOC5iOC4suC4ojwvdGg+PHRoIGNsYXNzPSJudW0iPuC4hOC4h+C5gOC4q+C4peC4t+C4rTwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICBkLmJ5WWVhci5tYXAo',
  'ZnVuY3Rpb24oeSl7CiAgICAgICAgICByZXR1cm4gJzx0ciBvbmNsaWNrPSJzZXRZZWFyRnJvbVRhYmxlKCcgKyB5LnllYXIgKyAnKSIgc3R5bGU9ImN1cnNvcjpwb2ludGVyIj4nICsKICAgICAgICAgICAgJzx0ZD48Yj4nICsgZGlzcGxheVllYXIoeS55ZWFyKSAr',
  'ICc8L2I+JyArCiAgICAgICAgICAodXNlQnVkZGhpc3RZZWFyKCkgPyAnIDxzcGFuIGNsYXNzPSJmYWludCBmczEyIj4vICcgKyB5LnllYXIgKyAnPC9zcGFuPicgOiAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbW9uZXko',
  'eS5pbmNvbWUpICsgJzwvdGQ+PHRkIGNsYXNzPSJudW0iPicgKyBtb25leSh5LmV4cGVuc2UpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+PGIgc3R5bGU9ImNvbG9yOicgKyAoeS5uZXQ+PTA/J3ZhcigtLW9rKSc6J3ZhcigtLWRhbmdl',
  'ciknKSArICciPicgKyBtb25leSh5Lm5ldCkgKyAnPC9iPjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij7guKLguLHguIfguYTguKHguYjguKHguLXguILguYnguK3g',
  'uKHguLnguKU8L2Rpdj4nLCAnJywgdHJ1ZSk7CgogICAgdmFyIGtpbmRzID0gJzxkaXYgY2xhc3M9ImNoaXBzIG1iMTIiPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iY2hpcCAnICsgKCFTLnBhcmFtcy5raW5kPydvbic6JycpICsgJyIgb25jbGljaz0ic2V0UGFy',
  'YW0oXCdraW5kXCcsXCdcJykiPuC4l+C4uOC4geC4o+C4suC4ouC4geC4suC4ozwvYnV0dG9uPicgKwogICAgICBkLmJ5S2luZC5tYXAoZnVuY3Rpb24oayl7CiAgICAgICAgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJjaGlwICcgKyAoUy5wYXJhbXMua2luZD09PWsu',
  'a2luZD8nb24nOicnKSArICciIG9uY2xpY2s9InNldFBhcmFtKFwna2luZFwnLFwnJyArIGVzYyhrLmtpbmQpICsgJ1wnKSI+JyArCiAgICAgICAgICAgICAgIGVzYyhrLmtpbmQpICsgJyAoJyArIGsuY291bnQgKyAnKTwvYnV0dG9uPic7CiAgICAgIH0pLmpvaW4o',
  'JycpICsgJzwvZGl2Pic7CgogICAgdmFyIHJvd3MgPSBkLml0ZW1zOwogICAgdmFyIGxpc3QgPSBjYXJkKCfwn5OSIOC4o+C4suC4ouC4geC4suC4o+C4l+C4seC5ieC4h+C4q+C4oeC4lCDCtyAnICsgeWVhckxhYmVsICsgJyAoJyArIHJvd3MubGVuZ3RoICsgJykn',
  'LAogICAgICByb3dzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0Ij48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4Lin4Lix4LiZ4LiX4Li14LmIPC90aD48dGg+4Lij4Liy4Lii4LiB4Liy4LijPC90aD48dGggY2xhc3M9Im51bSI+',
  '4LiI4Liz4LiZ4Lin4LiZ4LmA4LiH4Li04LiZPC90aD48dGg+4Lij4Lit4Lia4Lia4Li04LilPC90aD48dGg+4LiK4LmI4Lit4LiH4LiX4Liy4LiHPC90aD4nICsKICAgICAgICAnPHRoPuC4quC4peC4tOC4mzwvdGg+PHRoPuC4q+C4oeC4suC4ouC5gOC4q+C4leC4',
  'uDwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICByb3dzLm1hcChmdW5jdGlvbih4KXsKICAgICAgICAgIHZhciBpbmMgPSB4LmZsb3cgPT09ICfguKPguLLguKLguKPguLHguJonOwogICAgICAgICAgcmV0dXJuICc8dHI+JyArCiAg',
  'ICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHguZGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48Yj4nICsgZXNjKHgua2luZCkgKyAnPC9iPiAnICsgKGluYyA/ICc8c3BhbiBjbGFzcz0iYiBvayI+4Lij4Liy4Lii',
  '4Lij4Lix4LiaPC9zcGFuPicgOiAnPHNwYW4gY2xhc3M9ImIgbXV0ZSI+4Lij4Liy4Lii4LiI4LmI4Liy4LiiPC9zcGFuPicpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+PGIgc3R5bGU9ImNvbG9yOicgKyAoaW5jPyd2YXIoLS1vaykn',
  'Oid2YXIoLS1pbmspJykgKyAnIj4nICsgKGluYz8nKyc6J+KIkicpICsgbW9uZXkoeC5hbW91bnQsIDIpICsgJzwvYj48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKHguYmlsbE1vbnRoIHx8ICfigJMnKSArICc8L3RkPicgKwog',
  'ICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKHguY2hhbm5lbCB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCh4LnNsaXBSZWZzKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJm',
  'czEyIG11dGVkIGNsaXAiPicgKyBlc2MoeC5ub3RlIHx8ICcnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPjxkaXYgY2xhc3M9InQtYWN0aW9ucyI+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIiBvbmNsaWNrPVwnZm9y',
  'bUZpbmFuY2UoJyArIGF0dHIoeCkgKyAnKVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiBkZ3IiIG9uY2xpY2s9ImRlbEZpbmFuY2UoXCcnICsgeC5pZCArICdcJykiPvCfl5E8L2J1dHRvbj4nICsK',
  'ICAgICAgICAgICAgJzwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nCiAgICAgIDogZW1wdHlCb3goJ+C4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4o+C4suC4ouC4geC4suC4o+C5g+C4mScgKyB5',
  'ZWFyTGFiZWwsICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtRmluYW5jZShudWxsKSI+KyDguJrguLHguJnguJfguLbguIHguKPguLLguKLguIHguLLguKM8L2J1dHRvbj4nKSwKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgc20iIG9u',
  'Y2xpY2s9ImZvcm1GaW5hbmNlKG51bGwpIj4rIOC4muC4seC4meC4l+C4tuC4geC4o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKI8L2J1dHRvbj4nLCB0cnVlKTsKCiAgICByZXR1cm4gaGVhZCArIGNoYXJ0cyArIG1vbnRobHkgKyAnPGRpdiBj',
  'bGFzcz0iZ3JpZCBnMiBtdDEyIG1iMTIiPicgKyBieUtpbmQgKyBieVllYXIgKyAnPC9kaXY+JyArIGtpbmRzICsgbGlzdDsKICB9Cn07CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgOSkg',
  '4Lij4Liy4Lii4LiH4Liy4LiZICYg4Liq4Liz4Lij4Lit4LiH4LiC4LmJ4Lit4Lih4Li54LilCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMucmVwb3J0cyA9IHsKICBsb2FkOiBm',
  'dW5jdGlvbigpewogICAgcmV0dXJuIFByb21pc2UuYWxsKFsKICAgICAgY2FsbEFwaSgncmVwb3J0LmNvc3RQZXJSb29tJywgeyB5ZWFyOiBTLnllYXIgfSksCiAgICAgIGNhbGxBcGkoJ3JlcG9ydC51cGNvbWluZycsIHsgZGF5czogOTAgfSksCiAgICAgIGNhbGxB',
  'cGkoJ2JhY2t1cC5zaGVldHMnLCB7fSksCiAgICAgIGNhbGxBcGkoJ3NoYXJlLmxpbmtzJywge30pLmNhdGNoKGZ1bmN0aW9uKCl7IHJldHVybiB7fTsgfSksCiAgICAgIGNhbGxBcGkoJ2JhY2t1cC5oaXN0b3J5Jywge30pLmNhdGNoKGZ1bmN0aW9uKCl7IHJldHVy',
  'biBbXTsgfSkKICAgIF0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICAgIHJldHVybiB7IGNvc3Q6IHJbMF0sIHVwY29taW5nOiByWzFdLCBzaGVldHM6IHJbMl0sIGxpbmtzOiByWzNdIHx8IHt9LCBiYWNrdXBzOiByWzRdIHx8IFtdLCB5ZWFyczogW10gfTsKICAgIH0p',
  'OwogIH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciB5ZWFyTGFiZWwgPSBTLnllYXIgPT09ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgYyA9IGQuY29zdDsKICAgIHZhciB0b3AgPSBjLnJvb21z',
  'LmZpbHRlcihmdW5jdGlvbihyKXsgcmV0dXJuIHIudG90YWwgPiAwOyB9KTsKICAgIHZhciBtYXhDb3N0ID0gdG9wLmxlbmd0aCA/IHRvcFswXS50b3RhbCA6IDE7CgogICAgdmFyIHVwY29taW5nID0gY2FyZCgn8J+Xk++4jyDguJvguI/guLTguJfguLTguJnguIfg',
  'uLLguJnguJfguLXguYjguIHguLPguKXguLHguIfguIjguLDguJbguLbguIcgKDkwIOC4p+C4seC4mSkgwrcgJyArIGQudXBjb21pbmcubGVuZ3RoICsgJyDguIfguLLguJknLAogICAgICBkLnVwY29taW5nLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJhbGlzdCI+JyAr',
  'IGQudXBjb21pbmcubWFwKGZ1bmN0aW9uKHUpewogICAgICAgIHZhciBsdmwgPSB1LmRheXNMZWZ0IDwgMCA/ICdkYW5nZXInIDogKHUuZGF5c0xlZnQgPD0gNyA/ICd3YXJuJyA6ICdpbmZvJyk7CiAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJhbGkgbC0nICsg',
  'bHZsICsgJyIgb25jbGljaz0iZ28oXCcnICsganVtcFBhZ2UodS5tb2R1bGUpICsgJ1wnKSI+JyArCiAgICAgICAgICAnPGRpdiBjbGFzcz0iaWMiPicgKyB1Lmljb24gKyAnPC9kaXY+PGRpdj4nICsKICAgICAgICAgICc8ZGl2IGNsYXNzPSJ0dCI+JyArIGVzYyh1',
  'LnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgICAgICc8ZGl2IGNsYXNzPSJkZCI+JyArIHRoRGF0ZSh1LmRhdGUpICsgJyDCtyAnICsKICAgICAgICAgICAgKHUuZGF5c0xlZnQgPCAwID8gJ+C5gOC4peC4ouC4geC4s+C4q+C4meC4lCAnICsgKC11LmRheXNMZWZ0',
  'KSArICcg4Lin4Lix4LiZJyA6ICh1LmRheXNMZWZ0ID09PSAwID8gJ+C4p+C4seC4meC4meC4teC5iScgOiAn4Lit4Li14LiBICcgKyB1LmRheXNMZWZ0ICsgJyDguKfguLHguJknKSkgKwogICAgICAgICAgICAodS5kZXRhaWwgPyAnIMK3ICcgKyBlc2ModS5kZXRh',
  'aWwpIDogJycpICsgJzwvZGl2PjwvZGl2PjwvZGl2Pic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPjxkaXYgY2xhc3M9ImJpZyI+8J+MpO+4jzwvZGl2PuC5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4meC4seC4lOC4',
  'q+C4oeC4suC4ouC5g+C4mSA5MCDguKfguLHguJnguILguYnguLLguIfguKvguJnguYnguLI8L2Rpdj4nLCAnJywgdHJ1ZSk7CgogICAgdmFyIGNvc3RDYXJkID0gY2FyZCgn8J+Pt++4jyDguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguKrguLDguKrguKHg',
  'uKPguLLguKLguKvguYnguK3guIcgwrcgJyArIHllYXJMYWJlbCwKICAgICAgJzxkaXYgY2xhc3M9ImdyaWQgZzMgbWIxMiI+JyArCiAgICAgICAga3BpKCfguKPguKfguKHguJfguLjguIHguKvguYnguK3guIcnLCBiYWh0KGMudG90YWwpLCAnJykgKwogICAgICAg',
  'IGtwaSgn4LmA4LiJ4Lil4Li14LmI4Lii4LiV4LmI4Lit4Lir4LmJ4Lit4LiHJywgYmFodChjLmF2ZXJhZ2UpLCAnJykgKwogICAgICAgIGtwaSgn4Lir4LmJ4Lit4LiH4LiX4Li14LmI4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Liq4Li54LiH4Liq4Li44LiUJywgdG9w',
  'Lmxlbmd0aCA/ICgn4Lir4LmJ4Lit4LiHICcgKyB0b3BbMF0ucm9vbSkgOiAn4oCTJywgdG9wLmxlbmd0aCA/IGJhaHQodG9wWzBdLnRvdGFsKSA6ICcnKSArCiAgICAgICc8L2Rpdj4nICsKICAgICAgKHRvcC5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJs',
  'ZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC4q+C5ieC4reC4hzwvdGg+PHRoIGNsYXNzPSJudW0iPuC4h+C4suC4meC4i+C5iOC4reC4oTwvdGg+PHRoIGNsYXNzPSJudW0iPuC4hOC5iOC4suC4i+C5iOC4reC4oTwvdGg+PHRoIGNsYXNz',
  'PSJudW0iPuC4peC5ieC4suC4h+C5geC4reC4o+C5jDwvdGg+JyArCiAgICAgICAgJzx0aCBjbGFzcz0ibnVtIj7guILguK3guIfguYDguILguYnguLLguKvguYnguK3guIc8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKPguKfguKE8L3RoPjx0aCBzdHlsZT0id2lkdGg6',
  'MjYlIj48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgdG9wLm1hcChmdW5jdGlvbihyKXsKICAgICAgICAgIHJldHVybiAnPHRyIG9uY2xpY2s9Im9wZW5Sb29tKFwnJyArIHIucm9vbSArICdcJykiIHN0eWxlPSJjdXJzb3I6cG9pbnRlciI+JyAr',
  'CiAgICAgICAgICAgICc8dGQ+PGI+JyArIHIucm9vbSArICc8L2I+IDxzcGFuIGNsYXNzPSJmYWludCBmczEyIj7guIrguLHguYnguJkgJyArIHIuZmxvb3IgKyAnPC9zcGFuPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIHIuam9icyAr',
  'ICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAoci5yZXBhaXIgPyBtb25leShyLnJlcGFpcikgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHIuYWMgPyBtb25leShyLmFjKSA6ICfi',
  'gJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAoci5wdXJjaGFzZSA/IG1vbmV5KHIucHVyY2hhc2UpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+PGI+JyArIG1vbmV5KHIudG90',
  'YWwpICsgJzwvYj48L3RkPicgKwogICAgICAgICAgICAnPHRkPjxkaXYgY2xhc3M9ImJhci10cmFjayI+PGRpdiBjbGFzcz0iYmFyLWZpbGwiIHN0eWxlPSJ3aWR0aDonICsgKHIudG90YWwvbWF4Q29zdCoxMDApICsgJyUiPjwvZGl2PjwvZGl2PjwvdGQ+PC90cj4n',
  'OwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nCiAgICAgIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij7guKLguLHguIfguYTguKHguYjguKHguLXguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguJfguLXguYjguJrguLHguJng',
  'uJfguLbguIHguYTguKfguYnguKPguLLguKLguKvguYnguK3guIc8ZGl2IGNsYXNzPSJmczEyIG10OCI+4LmD4Liq4LmIICLguITguYjguLLguYPguIrguYnguIjguYjguLLguKIiIOC5g+C4meC4h+C4suC4meC4i+C5iOC4reC4oS/guKXguYnguLLguIfguYHguK3g',
  'uKPguYwg4Lir4Lij4Li34Lit4Lij4Liw4Lia4Li44Lir4LmJ4Lit4LiH4LmD4LiZ4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHIOC5geC4peC5ieC4p+C4leC4seC4p+C5gOC4peC4guC4iOC4sOC4guC4tuC5ieC4meC4l+C4teC5iOC4meC4',
  'teC5iDwvZGl2PjwvZGl2PicpKTsKCiAgICB2YXIgYmFja3VwID0gY2FyZCgn8J+SviDguKrguLPguKPguK3guIfguYHguKXguLDguIHguLnguYnguITguLfguJnguILguYnguK3guKHguLnguKUnLAogICAgICAnPHAgY2xhc3M9ImZzMTMgbXV0ZWQiPuC4guC5ieC4',
  'reC4oeC4ueC4peC4l+C4seC5ieC4h+C4q+C4oeC4lOC4reC4ouC4ueC5iOC5g+C4meC4o+C4sOC4muC4muC4meC4teC5iSDigJQg4LiE4Lin4Lij4LiU4Liy4Lin4LiZ4LmM4LmC4Lir4Lil4LiU4Liq4Liz4Lij4Lit4LiH4LmE4Lin4LmJ4LmA4LiU4Li34Lit4LiZ',
  '4Lil4Liw4LiE4Lij4Lix4LmJ4LiHICcgKwogICAgICAn4LmE4Lif4Lil4LmMIEpTT04g4LiZ4Liz4LiB4Lil4Lix4Lia4LmA4LiC4LmJ4Liy4Lij4Liw4Lia4Lia4LmE4LiU4LmJIOC4quC5iOC4p+C4mSBDU1Yg4LmA4Lib4Li04LiU4LmD4LiZIEV4Y2VsIOC4q+C4',
  'o+C4t+C4rSBHb29nbGUgU2hlZXRzIOC5hOC4lOC5ieC5gOC4peC4ojwvcD4nICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBtdDEyIj4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZG9FeHBvcnRKc29uKCkiPuKsh++4jyDguJTg',
  'uLLguKfguJnguYzguYLguKvguKXguJTguKrguLPguKPguK3guIfguJfguLHguYnguIfguKvguKHguJQgKEpTT04pPC9idXR0b24+JyArCiAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iZG9JbXBvcnRKc29uKCkiPuKshu+4jyDguIHguLnguYng',
  'uITguLfguJnguIjguLLguIHguYTguJ/guKXguYzguKrguLPguKPguK3guIc8L2J1dHRvbj4nICsKICAgICAgJzwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtYjgiPuC4quC5iOC4',
  'h+C4reC4reC4geC5gOC4m+C5h+C4mSBDU1Yg4LmB4Lii4LiB4LiV4Liy4Lij4Liy4LiHPC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJjaGlwcyI+JyArIGQuc2hlZXRzLm1hcChmdW5jdGlvbihuKXsKICAgICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9ImNo',
  'aXAiIG9uY2xpY2s9ImRvRXhwb3J0Q3N2KFwnJyArIGVzYyhuKSArICdcJykiPicgKyBlc2Moc2hlZXRMYWJlbChuKSkgKyAnPC9idXR0b24+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+Jyk7CgogICAgdmFyIHNoYXJlID0gKGNhbkVkaXQoKSAmJiBkLmxp',
  'bmtzICYmIGQubGlua3Mudmlld1VybCkgPyBjYXJkKCfwn5SXIOC4peC4tOC4h+C4geC5jOC5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4mScsCiAgICAgICc8ZGl2IGNsYXNzPSJmIG1iMTIiPjxsYWJlbD7wn5SRIOC4peC4tOC4h+C4geC5jOC4guC4reC4h+C4',
  'hOC4uOC4kyAo4LmB4LiB4LmJ4LmE4LiC4LiC4LmJ4Lit4Lih4Li54Lil4LmE4LiU4LmJIOKAlCDguK3guKLguYjguLLguKrguYjguIfguJXguYjguK0pPC9sYWJlbD4nICsKICAgICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIHJlYWRvbmx5IHZhbHVlPSInICsgZXNj',
  'KGQubGlua3MuYWRtaW5VcmwpICsgJyIgb25jbGljaz0idGhpcy5zZWxlY3QoKSI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIj48bGFiZWw+8J+RgCDguKXguLTguIfguIHguYzguYHguIrguKPguYwgKOC5gOC4m+C4tOC4lOC4lOC4ueC5hOC4lOC5ieC4',
  'reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pyDigJQg4Liq4LmI4LiH4LmD4Lir4LmJ4LmD4LiE4Lij4LiB4LmH4LmE4LiU4LmJKTwvbGFiZWw+JyArCiAgICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0ic2hhcmVVcmwiIHJlYWRvbmx5IHZhbHVlPSInICsg',
  'ZXNjKGQubGlua3Mudmlld1VybCkgKyAnIiBvbmNsaWNrPSJ0aGlzLnNlbGVjdCgpIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBtdDEyIj4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iY29weVNoYXJlKCkiPvCf',
  'k4sg4LiE4Lix4LiU4Lil4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmMPC9idXR0b24+JyArCiAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBkZ3IiIG9uY2xpY2s9ImRvUm90YXRlU2hhcmUoKSI+8J+UgSDguK3guK3guIHguKXguLTguIfguIHguYzg',
  'uYHguIrguKPguYzguYPguKvguKHguYg8L2J1dHRvbj4nICsKICAgICAgJzwvZGl2PicgKwogICAgICAnPHAgY2xhc3M9ImZzMTIgbXV0ZWQgbXQxMiI+4LiE4LiZ4LiX4Li14LmI4LmA4Lib4Li04LiU4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LiI4Liw4LmA',
  '4Lir4LmH4LiZ4LiC4LmJ4Lit4Lih4Li54Lil4LiX4Lix4LmJ4LiH4Lir4Lih4LiU4LmB4Lia4Lia4Lit4LmI4Liy4LiZ4Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinICcgKwogICAgICAn4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4Lih4Li14Lia4Lix4LiN4LiK',
  '4Li1IEdvb2dsZSDguYHguKXguLDguYTguKHguYjguYDguKvguYfguJkgR29vZ2xlIFNoZWV0IOC4guC4reC4h+C4hOC4uOC4kyDCtyAnICsKICAgICAgJ+C4luC5ieC4suC4peC4tOC4h+C4geC5jOC4q+C4peC4uOC4lOC5g+C4q+C5ieC4geC4lCAi4Lit4Lit4LiB',
  '4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LmD4Lir4Lih4LmIIiDguKXguLTguIfguIHguYzguYDguJTguLTguKHguIjguLDguYPguIrguYnguYTguKHguYjguYTguJTguYnguJfguLHguJnguJfguLU8L3A+JykgOiAnJzsKCiAgICB2YXIgZHJpdmUgPSBjYW5F',
  'ZGl0KCkgPyBjYXJkKCfimIHvuI8g4Liq4Liz4Lij4Lit4LiH4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li04LmD4LiZIEdvb2dsZSBEcml2ZSAoJyArIGQuYmFja3Vwcy5sZW5ndGggKyAnIOC4iuC4uOC4lCknLAogICAgICAnPHAgY2xhc3M9ImZzMTMgbXV0ZWQi',
  'PuC4o+C4sOC4muC4muC5gOC4geC5h+C4muC5hOC4n+C4peC5jOC4quC4s+C4o+C4reC4h+C5hOC4p+C5ieC5g+C4meC5guC4n+C4peC5gOC4lOC4reC4o+C5jCAi4Liq4Liz4Lij4Lit4LiH4LiC4LmJ4Lit4Lih4Li54LilIiDguJrguJnguYTguJTguKPguJ/guYzg',
  'uILguK3guIfguITguLjguJMgJyArCiAgICAgICfguJXguLHguYnguIfguYPguKvguYnguJfguLPguK3guLHguJXguYLguJnguKHguLHguJXguLTguJfguLjguIHguKfguLHguJnguYTguJTguYnguIjguLLguIHguYDguKHguJnguLnguYPguJnguIrguLXguJU8L3A+',
  'JyArCiAgICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQxMiI+PGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJkb0JhY2t1cE5vdygpIj7wn5K+IOC4quC4s+C4o+C4reC4h+C5gOC4lOC4teC5i+C4ouC4p+C4meC4teC5iTwvYnV0dG9uPjwvZGl2PicgKwogICAgICAo',
  'ZC5iYWNrdXBzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+PGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDphdXRvIj48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4LmE4Lif4Lil4LmMPC90aD48dGg+4LmA',
  '4Lin4Lil4LiyPC90aD48dGggY2xhc3M9Im51bSI+4LiC4LiZ4Liy4LiUPC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIGQuYmFja3Vwcy5zbGljZSgwLDEwKS5tYXAoZnVuY3Rpb24oYil7CiAgICAgICAgICByZXR1cm4gJzx0cj48dGQgY2xhc3M9',
  'ImZzMTIiPjxhIGhyZWY9IicgKyBlc2MoYi51cmwpICsgJyIgdGFyZ2V0PSJfYmxhbmsiPicgKyBlc2MoYi5uYW1lKSArICc8L2E+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyhiLmF0KSArICc8L3RkPicgKwogICAgICAgICAg',
  'ICAnPHRkIGNsYXNzPSJudW0gZnMxMiI+JyArIE1hdGgucm91bmQoYi5zaXplLzEwMjQpICsgJyBLQjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nIDogJycpKSA6ICcnOwoKICAgIHJldHVybiB1cGNvbWlu',
  'ZyArICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgY29zdENhcmQgKyAnPC9kaXY+JyArCiAgICAgICAgICAgKHNoYXJlID8gJzxkaXYgY2xhc3M9Im10MTIiPicgKyBzaGFyZSArICc8L2Rpdj4nIDogJycpICsKICAgICAgICAgICAnPGRpdiBjbGFzcz0ibXQxMiI+JyAr',
  'IGJhY2t1cCArICc8L2Rpdj4nICsKICAgICAgICAgICAoZHJpdmUgPyAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIGRyaXZlICsgJzwvZGl2PicgOiAnJyk7CiAgfQp9OwoKZnVuY3Rpb24gc2hlZXRMYWJlbChuKXsKICByZXR1cm4gKHsKICAgIERlYnRzOifguIHguYng',
  'uK3guJnguKvguJnguLXguYknLCBEZWJ0UGF5bWVudHM6J+C4o+C4suC4ouC4geC4suC4o+C4iuC4s+C4o+C4sOC4q+C4meC4teC5iScsIFB1cmNoYXNlczon4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHJywgUm9vbXM6J+C4l+C4sOC5gOC4',
  'muC4teC4ouC4meC4q+C5ieC4reC4hycsCiAgICBBY1NlcnZpY2U6J+C4peC5ieC4suC4h+C5geC4reC4o+C5jCcsIFJvb21SZXBhaXJzOifguIvguYjguK3guKHguYHguIvguKHguKvguYnguK3guIcnLCBCdWlsZGluZ1JlcGFpcnM6J+C4i+C5iOC4reC4oeC5geC4',
  'i+C4oeC4leC4tuC4gScsCiAgICBSb29tQXNzZXRzOifguJfguKPguLHguJ7guKLguYzguKrguLTguJnguKvguYnguK3guIcnLCBGaW5hbmNlOifguKPguLLguKLguKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4LiiJywgU2V0dGluZ3M6J+C4leC4seC5ieC4h+C4',
  'hOC5iOC4sicsIEFjdGl2aXR5TG9nOifguJvguKPguLDguKfguLHguJXguLTguIHguLLguKPguYHguIHguYnguYTguIInCiAgfSlbbl0gfHwgbjsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'CiAgIOC4leC4seC4p+C4iuC5iOC4p+C4ouC4p+C4suC4lOC4i+C5ieC4syDguYYKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgpmdW5jdGlvbiBrcGkobGFiZWwsIHZhbHVlLCBjYXAsIGNs',
  'cyl7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJrcGkgJyArIChjbHN8fCcnKSArICciPicgKwogICAgJzxkaXYgY2xhc3M9ImxibCI+JyArIGVzYyhsYWJlbCkgKyAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0idmFsIj4nICsgdmFsdWUgKyAnPC9kaXY+JyArCiAg',
  'ICAoY2FwID8gJzxkaXYgY2xhc3M9ImNhcCI+JyArIGNhcCArICc8L2Rpdj4nIDogJycpICsgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIGNhcmQodGl0bGUsIGJvZHksIGFjdGlvbnMsIGZsdXNoKXsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImNhcmQiPicgKwogICAgKHRp',
  'dGxlID8gJzxkaXYgY2xhc3M9ImNhcmQtaCI+PGgzPicgKyB0aXRsZSArICc8L2gzPicgKyAoYWN0aW9ucyA/ICc8ZGl2IGNsYXNzPSJzcCI+JyArIGFjdGlvbnMgKyAnPC9kaXY+JyA6ICcnKSArICc8L2Rpdj4nIDogJycpICsKICAgICc8ZGl2IGNsYXNzPSJjYXJk',
  'LWInICsgKGZsdXNoID8gJyBmbHVzaCcgOiAnJykgKyAnIj4nICsgYm9keSArICc8L2Rpdj48L2Rpdj4nOwp9CgovKiog4Lin4Liy4LiU4Lic4Lix4LiH4Lir4LmJ4Lit4LiH4LmB4Lia4LmI4LiH4LiV4Liy4Lih4LiK4Lix4LmJ4LiZIOKAlCBkZWNvcmF0ZShyb29t',
  'KSAtPiB7Y2xzLCBzdWIsIG9uY2xpY2t9ICovCmZ1bmN0aW9uIHJvb21GbG9vcnMocm9vbXMsIGRlY29yYXRlKXsKICB2YXIgYnlGbG9vciA9IHt9OwogIHJvb21zLmZvckVhY2goZnVuY3Rpb24ocil7CiAgICB2YXIgZiA9IHIuZmxvb3IgfHwgTnVtYmVyKFN0cmlu',
  'ZyhyLnJvb20pLmNoYXJBdCgwKSk7CiAgICAoYnlGbG9vcltmXSA9IGJ5Rmxvb3JbZl0gfHwgW10pLnB1c2gocik7CiAgfSk7CiAgdmFyIGZsb29ycyA9IE9iamVjdC5rZXlzKGJ5Rmxvb3IpLnNvcnQoKTsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImZsb29ycyI+JyAr',
  'IGZsb29ycy5tYXAoZnVuY3Rpb24oZil7CiAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImZsb29yIj48ZGl2IGNsYXNzPSJmbG9vci10YWciPjxiPicgKyBmICsgJzwvYj7guIrguLHguYnguJk8L2Rpdj48ZGl2IGNsYXNzPSJyb29tcyI+JyArCiAgICAgIGJ5Rmxvb3Jb',
  'Zl0ubWFwKGZ1bmN0aW9uKHIpewogICAgICAgIHZhciBkID0gZGVjb3JhdGUocik7CiAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJyb29tICcgKyBkLmNscyArICciIG9uY2xpY2s9IicgKyBkLm9uY2xpY2sgKyAnIj4nICsKICAgICAgICAgICc8c3BhbiBjbGFz',
  'cz0iZG90Ij48L3NwYW4+PGRpdiBjbGFzcz0ibm8iPicgKyBlc2Moci5yb29tKSArICc8L2Rpdj4nICsKICAgICAgICAgICc8ZGl2IGNsYXNzPSJzdCI+JyArIGQuc3ViICsgJzwvZGl2PjwvZGl2Pic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PjwvZGl2Pic7',
  'CiAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKfQoKLyoqIOC5g+C4quC5iCBvYmplY3Qg4Lil4LiH4LmD4LiZIG9uY2xpY2sgYXR0cmlidXRlIOC5hOC4lOC5ieC4reC4ouC5iOC4suC4h+C4m+C4peC4reC4lOC4oOC4seC4oiAqLwpmdW5jdGlvbiBhdHRyKG9iail7',
  'CiAgdmFyIGNsZWFuID0ge307CiAgT2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uKGspewogICAgaWYgKGsuaW5kZXhPZignXycpID09PSAwIHx8IC9SZWZzJC8udGVzdChrKSB8fCBrID09PSAncmVjb3JkcycgfHwgayA9PT0gJ3dhcnJhbnR5JykgcmV0',
  'dXJuOwogICAgY2xlYW5ba10gPSBvYmpba107CiAgfSk7CiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGNsZWFuKS5yZXBsYWNlKC8mL2csJyZhbXA7JykucmVwbGFjZSgvJy9nLCcmIzM5OycpLnJlcGxhY2UoLyIvZywnJnF1b3Q7Jyk7Cn0KPC9zY3JpcHQ+CjxzY3Jp',
  'cHQ+Ci8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBTZXR0aW5ncy5odG1sIOKAlCDguKvguJnguYnguLLguJXguLHguYnguIfguITguYjguLIgwrcg4LiY4Li14LihIMK3IOC4muC4seC4jeC4iuC4',
  'teC4nOC4ueC5ieC5g+C4iuC5iSDCtyDguK3guLjguJvguIHguKPguJPguYwKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4mOC4teC4oeC4quC4p+C5iOC4',
  'suC4hyAvIOC4oeC4t+C4lCAtLS0tLS0tLS0tLS0tLS0tICovCgp2YXIgTFNfVEhFTUUgPSAnbWNvcm5lci50aGVtZSc7CnZhciBUSEVNRVMgPSBbCiAgeyBpZDogJ+C4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hycsIGljOiAn8J+MlycsIGhpbnQ6ICfguKrg',
  'uKXguLHguJrguJXguLLguKHguIHguLLguKPguJXguLHguYnguIfguITguYjguLLguILguK3guIfguK3guLjguJvguIHguKPguJPguYwnIH0sCiAgeyBpZDogJ+C4quC4p+C5iOC4suC4hycsICAgICAgaWM6ICfimIDvuI8nLCBoaW50OiAn4Lie4Li34LmJ4LiZ4LiC',
  '4Liy4LinIOC4reC5iOC4suC4meC4h+C5iOC4suC4ouC4geC4peC4suC4h+C5geC4lOC4lCcgfSwKICB7IGlkOiAn4Lih4Li34LiUJywgICAgICAgIGljOiAn8J+MmScsIGhpbnQ6ICfguJ7guLfguYnguJnguYDguILguYnguKEg4Liq4Lia4Liy4Lii4LiV4Liy4LiV',
  '4Lit4LiZ4LiB4Lil4Liy4LiH4LiE4Li34LiZJyB9Cl07CgovKioKICog4LiX4Liy4LiY4Li14Lih4Lil4LiH4Lir4LiZ4LmJ4Liy4LmA4Lin4LmH4Lia4LiX4Lix4LiZ4LiX4Li1CiAqIOC4leC4seC4p+C5geC4m+C4o+C4quC4teC4l+C4seC5ieC4h+C4q+C4oeC4',
  'lOC4meC4tOC4ouC4suC4oeC5hOC4p+C5iSAzIOC4iuC4seC5ieC4meC5g+C4mSBTdHlsZS5odG1sIOC5geC4peC5ieC4pyDguJXguKPguIfguJnguLXguYnguYHguITguYjguJXguLTguJTguJvguYnguLLguKLguJrguK3guIHguKfguYjguLLguYPguIrguYnguIrg',
  'uLHguYnguJnguYTguKvguJkKICovCmZ1bmN0aW9uIGFwcGx5VGhlbWUobmFtZSl7CiAgdmFyIHJvb3QgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7CiAgaWYgKG5hbWUgPT09ICfguKrguKfguYjguLLguIcnKSByb290LnNldEF0dHJpYnV0ZSgnZGF0YS10aGVt',
  'ZScsICdsaWdodCcpOwogIGVsc2UgaWYgKG5hbWUgPT09ICfguKHguLfguJQnKSByb290LnNldEF0dHJpYnV0ZSgnZGF0YS10aGVtZScsICdkYXJrJyk7CiAgZWxzZSByb290LnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS10aGVtZScpOyAgICAgICAvLyDguJXguLLguKHg',
  'uYDguITguKPguLfguYjguK3guIcgPSDguJvguKXguYjguK3guKLguYPguKvguYkgcHJlZmVycy1jb2xvci1zY2hlbWUg4LiV4Lix4LiU4Liq4Li04LiZCiAgdmFyIGJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0aGVtZUJ0bicpOwogIGlmIChidG4pIHsK',
  'ICAgIHZhciB0ID0gVEhFTUVTLmZpbHRlcihmdW5jdGlvbih4KXsgcmV0dXJuIHguaWQgPT09IG5hbWU7IH0pWzBdIHx8IFRIRU1FU1swXTsKICAgIGJ0bi50ZXh0Q29udGVudCA9IHQuaWM7CiAgICBidG4udGl0bGUgPSAn4LiY4Li14LihOiAnICsgdC5pZCArICcg',
  'KOC4geC4lOC5gOC4nuC4t+C5iOC4reC4quC4peC4seC4miknOwogIH0KfQoKZnVuY3Rpb24gY3VycmVudFRoZW1lKCl7CiAgcmV0dXJuIGxzR2V0KExTX1RIRU1FKSB8fCAoUy5ib290ICYmIFMuYm9vdC5zZXR0aW5ncyAmJiBTLmJvb3Quc2V0dGluZ3MudGhlbWUp',
  'IHx8ICfguJXguLLguKHguYDguITguKPguLfguYjguK3guIcnOwp9CgovKiog4LiV4Lix4LmJ4LiH4LiY4Li14Lih4LmB4Lil4Liw4LiI4Liz4LmE4Lin4LmJIOKAlCDguJzguLnguYnguJTguLnguYHguKXguIjguLDguJbguLnguIHguJrguLHguJnguJfguLbguIHg',
  'uYDguJvguYfguJnguITguYjguLLguJXguLHguYnguIfguJXguYnguJnguILguK3guIfguKPguLDguJrguJrguJTguYnguKfguKIgKi8KZnVuY3Rpb24gc2V0VGhlbWUobmFtZSwgcXVpZXQpewogIGxzU2V0KExTX1RIRU1FLCBuYW1lKTsKICBhcHBseVRoZW1lKG5h',
  'bWUpOwogIGlmIChTLmJvb3QgJiYgUy5ib290LmlzQWRtaW4pIHsKICAgIGNhbGxBcGkoJ3NldHRpbmdzLnNhdmUnLCB7IHZhbHVlczogeyB0aGVtZTogbmFtZSB9IH0pLmNhdGNoKGZ1bmN0aW9uKCl7IC8qIOC5gOC4geC5h+C4muC5g+C4meC5gOC4hOC4o+C4t+C5',
  'iOC4reC4h+C4geC5h+C4nuC4rSAqLyB9KTsKICB9CiAgaWYgKCFxdWlldCkgdG9hc3QoJ+C5gOC4m+C4peC4teC5iOC4ouC4meC5gOC4m+C5h+C4meC4mOC4teC4oScgKyAobmFtZSA9PT0gJ+C4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hycgPyAn4LiV4Liy',
  '4Lih4LmA4LiE4Lij4Li34LmI4Lit4LiHJyA6IG5hbWUpLCAnb2snKTsKICBpZiAoUy5wYWdlID09PSAnc2V0dGluZ3MnKSBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7Cn0KCi8qKiDguJvguLjguYjguKHguJrguJnguYHguJbguJrguKvguLHguKcg4oCUIOC4p+C4meC4',
  'quC4p+C5iOC4suC4hyDihpIg4Lih4Li34LiUIOKGkiDguJXguLLguKHguYDguITguKPguLfguYjguK3guIcgKi8KZnVuY3Rpb24gY3ljbGVUaGVtZSgpewogIHZhciBvcmRlciA9IFsn4Liq4Lin4LmI4Liy4LiHJywgJ+C4oeC4t+C4lCcsICfguJXguLLguKHguYDg',
  'uITguKPguLfguYjguK3guIcnXTsKICB2YXIgaSA9IG9yZGVyLmluZGV4T2YoY3VycmVudFRoZW1lKCkpOwogIHNldFRoZW1lKG9yZGVyWyhpICsgMSkgJSBvcmRlci5sZW5ndGhdKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguKvguJnguYnguLLguJXguLHguYng',
  'uIfguITguYjguLIgLS0tLS0tLS0tLS0tLS0tLSAqLwoKUk9VVEVTLnNldHRpbmdzID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7CiAgICByZXR1cm4gUHJvbWlzZS5hbGwoWwogICAgICBjYWxsQXBpKCdzZXR0aW5ncy5saXN0Jywge30pLAogICAgICBjYWxsQXBpKCdh',
  'dXRoLmRldmljZXMnLCB7fSkuY2F0Y2goZnVuY3Rpb24oKXsgcmV0dXJuIFtdOyB9KSwKICAgICAgKFMuYm9vdCAmJiBTLmJvb3QuaXNBZG1pbikgPyBjYWxsQXBpKCd1c2VyLmxpc3QnLCB7fSkuY2F0Y2goZnVuY3Rpb24oKXsgcmV0dXJuIFtdOyB9KSA6IFByb21p',
  'c2UucmVzb2x2ZShudWxsKSwKICAgICAgKFMuYm9vdCAmJiBTLmJvb3QuaXNBZG1pbikgPyBjYWxsQXBpKCdzaGFyZS5saW5rcycsIHt9KS5jYXRjaChmdW5jdGlvbigpeyByZXR1cm4ge307IH0pIDogUHJvbWlzZS5yZXNvbHZlKHt9KQogICAgXSkudGhlbihmdW5j',
  'dGlvbihyKXsKICAgICAgcmV0dXJuIHsgc2V0dGluZ3M6IHJbMF0sIGRldmljZXM6IHJbMV0gfHwgW10sIHVzZXJzOiByWzJdLCBsaW5rczogclszXSB8fCB7fSwgeWVhcnM6IFtdIH07CiAgICB9KTsKICB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICByZXR1',
  'cm4gJycgKwogICAgICBzZXR0aW5nc0FjY291bnRDYXJkKGQpICsKICAgICAgc2V0dGluZ3NUaGVtZUNhcmQoKSArCiAgICAgIChkLnNldHRpbmdzLmNhbkVkaXQgPyBzZXR0aW5nc0dyb3Vwc0h0bWwoZC5zZXR0aW5ncykgOiBzZXR0aW5nc1JlYWRPbmx5Tm90ZSgp',
  'KSArCiAgICAgIC8vIOC5gOC4ieC4nuC4suC4sOC4nOC4ueC5ieC4lOC4ueC5geC4peC4l+C4teC5iOC5gOC4q+C5h+C4meC4quC4reC4h+C4quC5iOC4p+C4meC4meC4teC5iSDigJQg4LiV4Lix4Lin4LiB4Liy4Lij4LmM4LiU4LmA4Lib4LmH4LiZ4LiE4LiZ4LiV',
  '4Lix4LiU4Liq4Li04LiZ4LmD4LiI4LmA4Lit4LiH4Lin4LmI4Liy4LiI4Liw4LmB4Liq4LiU4LiH4Lit4Liw4LmE4LijCiAgICAgIC8vIOC5gOC4nuC4o+C4suC4sOC4q+C4meC5ieC4suC4leC4seC4p+C4reC4ouC5iOC4suC4h+C5geC4muC4muC5hOC4n+C4peC5',
  'jOC5gOC4lOC4teC4ouC4p+C5hOC4oeC5iOC4oeC4teC4muC4seC4jeC4iuC4teC4nOC4ueC5ieC5g+C4iuC5ieC5g+C4q+C5ieC5geC4quC4lOC4hyDguYHguJXguYjguKLguLHguIfguK3guKLguLLguIHguJrguK3guIHguJzguLnguYnguYPguIrguYnguKfguYjg',
  'uLLguKHguLXguK3guLDguYTguKPguJrguYnguLLguIcKICAgICAgKGlzQWRtaW5Ob3coKSA/IHNldHRpbmdzVXNlcnNDYXJkKGQudXNlcnMpICsgc2V0dGluZ3NTaGFyZUNhcmQoZC5saW5rcykgOiAnJyk7CiAgfQp9OwoKLyogLS0tLSDguJrguLHguI3guIrguLXg',
  'uILguK3guIfguInguLHguJkgLS0tLSAqLwoKZnVuY3Rpb24gc2V0dGluZ3NBY2NvdW50Q2FyZChkKXsKICB2YXIgbWUgPSBBVVRILm1lIHx8IHt9OwogIHZhciBkZXZpY2VzID0gZC5kZXZpY2VzIHx8IFtdOwogIHJldHVybiBjYXJkKCfwn5GkIOC4muC4seC4jeC4',
  'iuC4teC4guC4reC4h+C4ieC4seC4mScsCiAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMiBtYjEyIj4nICsKICAgICAga3BpKCfguYDguILguYnguLLguYPguIrguYnguIfguLLguJnguYPguJnguIrguLfguYjguK0nLCBlc2MobWUubmFtZSB8fCBtZS51c2VybmFtZSB8',
  'fCAn4oCTJyksIGVzYyhtZS51c2VybmFtZSA/ICdAJyArIG1lLnVzZXJuYW1lIDogKG1lLnZpYSB8fCAnJykpKSArCiAgICAgIGtwaSgn4Liq4Li04LiX4LiY4Li04LmM4LiB4Liy4Lij4LmD4LiK4LmJ4LiH4Liy4LiZJywgZXNjKG1lLnJvbGUgfHwgJ+KAkycpLAog',
  'ICAgICAgICAgbWUuY2FuRWRpdCA/ICfguYDguJ7guLTguYjguKEg4LmB4LiB4LmJ4LmE4LiCIOC5geC4peC4sOC4peC4muC4guC5ieC4reC4oeC4ueC4peC5hOC4lOC5iScgOiAn4LmA4Lib4Li04LiU4LiU4Li54LmE4LiU4LmJ4Lit4Lii4LmI4Liy4LiH4LmA4LiU',
  '4Li14Lii4LinJykgKwogICAgJzwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InJvdyI+JyArCiAgICAgIChtZS51c2VybmFtZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImZvcm1DaGFuZ2VQYXNzd29yZCgpIj7wn5SRIOC5gOC4m+C4peC4teC5iOC4',
  'ouC4meC4o+C4q+C4seC4quC4nOC5iOC4suC4mTwvYnV0dG9uPicgOiAnJykgKwogICAgICAobWUudXNlcm5hbWUgPyAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJmb3JtU2V0UGluKCkiPvCflKIgJyArCiAgICAgICAgKEFVVEguZGV2aWNlID8gJ+C4leC4',
  'seC5ieC4hyBQSU4g4LmD4Lir4Lih4LmI4Lia4LiZ4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJJyA6ICfguJXguLHguYnguIcgUElOIOC4quC4s+C4q+C4o+C4seC4muC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5iScpICsgJzwvYnV0dG9uPicgOiAn',
  'JykgKwogICAgICAoQVVUSC5kZXZpY2UgPyAnPGJ1dHRvbiBjbGFzcz0iYnRuIGRnciIgb25jbGljaz0iZm9yZ2V0VGhpc0RldmljZSgpIj7guKXguJogUElOIOC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5iTwvYnV0dG9uPicgOiAnJykgKwogICAgICAnPGJ1',
  'dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjb25maXJtTG9nb3V0KCkiPvCfmqog4Lit4Lit4LiB4LiI4Liy4LiB4Lij4Liw4Lia4LiaPC9idXR0b24+JyArCiAgICAnPC9kaXY+JyArCiAgICAoZGV2aWNlcy5sZW5ndGgKICAgICAgPyAnPGRpdiBjbGFzcz0iaHIi',
  'PjwvZGl2PjxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQgbWI4Ij7guK3guLjguJvguIHguKPguJPguYzguJfguLXguYjguJXguLHguYnguIcgUElOIOC5hOC4p+C5iSAoJyArIGRldmljZXMubGVuZ3RoICsgJyk8L2Rpdj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0idHci',
  'Pjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDphdXRvIj48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4Lit4Li44Lib4LiB4Lij4LiT4LmMPC90aD48dGg+4LiV4Lix4LmJ4LiH4LmA4Lih4Li34LmI4LitPC90aD48dGg+4LmD4LiK4LmJ4Lil4LmI',
  '4Liy4Liq4Li44LiUPC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIGRldmljZXMubWFwKGZ1bmN0aW9uKHgpewogICAgICAgICAgcmV0dXJuICc8dHI+PHRkPicgKyBlc2MoeC5kZXZpY2UpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xh',
  'c3M9ImZzMTIiPicgKyB0aERhdGVTaG9ydChTdHJpbmcoeC5jcmVhdGVkQXQpLnNsaWNlKDAsMTApKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgdGhEYXRlU2hvcnQoU3RyaW5nKHgubGFzdFNlZW4pLnNsaWNlKDAsMTApKSAr',
  'ICc8L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JyArCiAgICAgICAgJzxkaXYgY2xhc3M9InJvdyBtdDEyIj48YnV0dG9uIGNsYXNzPSJidG4gZGdyIHNtIiBvbmNsaWNrPSJkb0ZvcmdldEFsbERldmljZXMo',
  'KSI+4Lii4LiB4LmA4Lil4Li04LiBIFBJTiDguJfguLjguIHguYDguITguKPguLfguYjguK3guIc8L2J1dHRvbj48L2Rpdj4nCiAgICAgIDogJycpKTsKfQoKZnVuY3Rpb24gZG9Gb3JnZXRBbGxEZXZpY2VzKCl7CiAgY29uZmlybUFjdGlvbign4Lii4LiB4LmA4Lil',
  '4Li04LiBIFBJTiDguJrguJnguJfguLjguIHguYDguITguKPguLfguYjguK3guIfguYPguIrguYjguYTguKvguKEg4oCUIOC4l+C4uOC4geC5gOC4hOC4o+C4t+C5iOC4reC4h+C4iOC4sOC4leC5ieC4reC4h+C4peC5h+C4reC4geC4reC4tOC4meC4lOC5ieC4p+C4',
  'ouC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iCcsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdhdXRoLmZvcmdldEFsbERldmljZXMnLCB7fSkudGhlbihmdW5jdGlvbihuKXsKICAgICAgc2F2ZURldmljZSgnJyk7CiAgICAgIHRvYXN0KCfguKLg',
  'uIHguYDguKXguLTguIEgUElOIOC5geC4peC5ieC4pyAnICsgbiArICcg4LmA4LiE4Lij4Li34LmI4Lit4LiHJywgJ29rJyk7CiAgICAgIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2UgfHwgZSwg',
  'J2VycicpOyB9KTsKICB9KTsKfQoKLyogLS0tLSDguJjguLXguKEgLS0tLSAqLwoKZnVuY3Rpb24gc2V0dGluZ3NUaGVtZUNhcmQoKXsKICB2YXIgY3VyID0gY3VycmVudFRoZW1lKCk7CiAgcmV0dXJuIGNhcmQoJ/Cfjqgg4LiY4Li14Lih4Liq4Li14Lir4LiZ4LmJ',
  '4Liy4LiI4LitJywKICAgICc8ZGl2IGNsYXNzPSJ0aGVtZS1waWNrIj4nICsgVEhFTUVTLm1hcChmdW5jdGlvbih0KXsKICAgICAgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJ0aGVtZS1vcHQnICsgKHQuaWQgPT09IGN1ciA/ICcgb24nIDogJycpICsgJyIgb25jbGlj',
  'az0ic2V0VGhlbWUoXCcnICsgdC5pZCArICdcJykiPicgKwogICAgICAgICc8c3BhbiBjbGFzcz0iaWMiPicgKyB0LmljICsgJzwvc3Bhbj4nICsKICAgICAgICAnPGI+JyArIGVzYyh0LmlkKSArICc8L2I+JyArCiAgICAgICAgJzxzcGFuIGNsYXNzPSJoaW50Ij4n',
  'ICsgZXNjKHQuaGludCkgKyAnPC9zcGFuPicgKwogICAgICAnPC9idXR0b24+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicgKwogICAgJzxwIGNsYXNzPSJmczEyIG11dGVkIG10MTIiPuC4mOC4teC4oeC4iOC4s+C5geC4ouC4geC4o+C4suC4ouC5gOC4hOC4',
  'o+C4t+C5iOC4reC4hyDguYDguJvguKXguLXguYjguKLguJnguJfguLXguYjguJnguLXguYjguKvguKPguLfguK3guIHguJTguJvguLjguYjguKHguKPguLnguJvguJ7guKPguLDguK3guLLguJfguLTguJXguKLguYwv4Lie4Lij4Liw4LiI4Lix4LiZ4LiX4Lij4LmM',
  '4Lih4Li44Lih4LiC4Lin4Liy4Lia4LiZ4LiB4LmH4LmE4LiU4LmJJyArCiAgICAoUy5ib290ICYmIFMuYm9vdC5pc0FkbWluID8gJyDCtyDguITguYjguLLguJfguLXguYjguJzguLnguYnguJTguLnguYHguKXguYDguKXguLfguK3guIHguIjguLDguYDguJvguYfg',
  'uJnguITguYjguLLguJXguLHguYnguIfguJXguYnguJnguYPguKvguYnguYDguITguKPguLfguYjguK3guIfguJfguLXguYjguKLguLHguIfguYTguKHguYjguYDguITguKLguJXguLHguYnguIcnIDogJycpICsgJzwvcD4nKTsKfQoKLyogLS0tLSDguIHguKXguLjg',
  'uYjguKHguITguYjguLLguJXguLHguYnguIfguITguYjguLIgLS0tLSAqLwoKZnVuY3Rpb24gc2V0dGluZ3NSZWFkT25seU5vdGUoKXsKICByZXR1cm4gY2FyZCgn4pqZ77iPIOC4geC4suC4o+C4leC4seC5ieC4h+C4hOC5iOC4suC4o+C4sOC4muC4micsCiAgICAn',
  'PGRpdiBjbGFzcz0iZW1wdHkiPjxkaXYgY2xhc3M9ImJpZyI+8J+UkjwvZGl2PuC5gOC4ieC4nuC4suC4sOC4nOC4ueC5ieC4lOC4ueC5geC4peC5gOC4l+C5iOC4suC4meC4seC5ieC4meC4l+C4teC5iOC5geC4geC5ieC4geC4suC4o+C4leC4seC5ieC4h+C4hOC5',
  'iOC4suC4o+C4sOC4muC4muC5hOC4lOC5iTwvZGl2PicpOwp9CgpmdW5jdGlvbiBzZXR0aW5nc0dyb3Vwc0h0bWwocyl7CiAgcmV0dXJuIHMuZ3JvdXBzLm1hcChmdW5jdGlvbihnKXsKICAgIHJldHVybiBjYXJkKGcuaWNvbiArICcgJyArIGcuZ3JvdXAsCiAgICAg',
  'ICc8ZGl2IGNsYXNzPSJmZ3JpZCI+JyArIGcuaXRlbXMubWFwKHNldHRpbmdGaWVsZEh0bWwpLmpvaW4oJycpICsgJzwvZGl2PicpOwogIH0pLmpvaW4oJycpICsKICBjYXJkKCfwn5K+IOC4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C4leC4seC5ieC4h+C4hOC5',
  'iOC4sicsCiAgICAnPHAgY2xhc3M9ImZzMTMgbXV0ZWQiPicgKyBlc2Mocy5zZWNyZXROb3RlKSArICc8L3A+JyArCiAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0ic2F2ZVNldHRpbmdz',
  'Rm9ybSgpIj7guJrguLHguJnguJfguLbguIHguJfguLHguYnguIfguKvguKHguJQ8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0ibG9hZCgpIj7guKLguIHguYDguKXguLTguIHguIHguLLguKPguYHguIHguYnguYTguII8L2J1',
  'dHRvbj4nICsKICAgICc8L2Rpdj4nKTsKfQoKZnVuY3Rpb24gc2V0dGluZ0ZpZWxkSHRtbChpdCl7CiAgdmFyIGlkID0gJ3NfJyArIGl0LmtleTsKICB2YXIgaW5uZXI7CiAgaWYgKGl0LnJlYWRPbmx5KSB7CiAgICBpbm5lciA9ICc8ZGl2IGNsYXNzPSJpbnAiIHN0',
  'eWxlPSJiYWNrZ3JvdW5kOnZhcigtLXN1cmZhY2UtMik7Y3Vyc29yOmRlZmF1bHQiPicgKyBlc2MoaXQudmFsdWUpICsgJzwvZGl2Pic7CiAgfSBlbHNlIGlmIChpdC50eXBlID09PSAnc2VsZWN0JykgewogICAgLy8g4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM',
  '4Lif4LmA4Lin4Lit4Lij4LmM4Liq4LmI4LiH4Lih4Liy4LmA4Lib4LmH4LiZIHt2YWx1ZSxsYWJlbH0g4LmA4Liq4Lih4LitIOKAlCDguITguYjguLLguJfguLXguYjguYDguIHguYfguJrguIHguLHguJrguILguYnguK3guITguKfguLLguKHguJfguLXguYjguYDg',
  'uKvguYfguJnguK3guLLguIjguITguJnguKXguLDguK3guLHguJkKICAgIGlubmVyID0gJzxzZWxlY3QgY2xhc3M9InNlbCIgaWQ9IicgKyBpZCArICciPicgKyAoaXQub3B0aW9ucyB8fCBbXSkubWFwKGZ1bmN0aW9uKG8pewogICAgICByZXR1cm4gJzxvcHRpb24g',
  'dmFsdWU9IicgKyBlc2Moby52YWx1ZSkgKyAnIicgKyAoby52YWx1ZSA9PT0gaXQudmFsdWUgPyAnIHNlbGVjdGVkJyA6ICcnKSArCiAgICAgICAgICAgICAnPicgKyBlc2Moby5sYWJlbCkgKyAnPC9vcHRpb24+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvc2VsZWN0',
  'Pic7CiAgfSBlbHNlIGlmIChpdC50eXBlID09PSAnbXVsdGlsaW5lJykgewogICAgaW5uZXIgPSAnPHRleHRhcmVhIGNsYXNzPSJ0YSIgaWQ9IicgKyBpZCArICciPicgKyBlc2MoaXQudmFsdWUpICsgJzwvdGV4dGFyZWE+JzsKICB9IGVsc2UgaWYgKGl0LnR5cGUg',
  'PT09ICdudW1iZXInKSB7CiAgICBpbm5lciA9ICc8aW5wdXQgdHlwZT0ibnVtYmVyIiBjbGFzcz0iaW5wIiBpZD0iJyArIGlkICsgJyIgdmFsdWU9IicgKyBlc2MoaXQudmFsdWUpICsgJyIgaW5wdXRtb2RlPSJkZWNpbWFsIj4nOwogIH0gZWxzZSB7CiAgICBpbm5l',
  'ciA9ICc8aW5wdXQgdHlwZT0idGV4dCIgY2xhc3M9ImlucCIgaWQ9IicgKyBpZCArICciIHZhbHVlPSInICsgZXNjKGl0LnZhbHVlKSArICciPic7CiAgfQogIHJldHVybiAnPGRpdiBjbGFzcz0iZicgKyAoaXQudHlwZSA9PT0gJ211bHRpbGluZScgPyAnIGZ1bGwn',
  'IDogJycpICsgJyI+JyArCiAgICAnPGxhYmVsIGZvcj0iJyArIGlkICsgJyI+JyArIGVzYyhpdC5sYWJlbCkgKyAnPC9sYWJlbD4nICsgaW5uZXIgKwogICAgKGl0Lm5vdGUgPyAnPGRpdiBjbGFzcz0iaGludCI+JyArIGVzYyhpdC5ub3RlKSArICc8L2Rpdj4nIDog',
  'JycpICsgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIHNhdmVTZXR0aW5nc0Zvcm0oKXsKICB2YXIgdmFscyA9IHt9OwogIHZhciBkYXRhID0gUy5jYWNoZS5zZXR0aW5nczsKICBpZiAoIWRhdGEpIHJldHVybjsKICBkYXRhLnNldHRpbmdzLmdyb3Vwcy5mb3JFYWNoKGZ1',
  'bmN0aW9uKGcpewogICAgZy5pdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0KXsKICAgICAgaWYgKGl0LnJlYWRPbmx5KSByZXR1cm47CiAgICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzXycgKyBpdC5rZXkpOwogICAgICBpZiAoZWwpIHZhbHNb',
  'aXQua2V5XSA9IGVsLnZhbHVlOwogICAgfSk7CiAgfSk7CiAgY2FsbEFwaSgnc2V0dGluZ3Muc2F2ZScsIHsgdmFsdWVzOiB2YWxzIH0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICBpZiAodmFscy50aGVtZSkgeyBsc1NldChMU19USEVNRSwgdmFscy50aGVtZSk7IGFw',
  'cGx5VGhlbWUodmFscy50aGVtZSk7IH0KICAgIHRvYXN0KHIuc2F2ZWQgPyAn4Lia4Lix4LiZ4LiX4Li24LiB4LmB4Lil4LmJ4LinICcgKyByLnNhdmVkICsgJyDguKPguLLguKLguIHguLLguKMnIDogJ+C5hOC4oeC5iOC4oeC4teC4reC4sOC5hOC4o+C5gOC4m+C4',
  'peC4teC5iOC4ouC4meC5geC4m+C4peC4hycsICdvaycpOwogICAgLy8g4LiE4LmI4Liy4Lia4Liy4LiH4LiV4Lix4LinICjguKPguK3guJrguKPguLXguYDguJ/guKPguIog4LiK4Li34LmI4Lit4Lit4Liy4LiE4Liy4LijKSDguKHguLXguJzguKXguIHguLHguJrg',
  'uJfguLHguYnguIfguKvguJnguYnguLIg4LiI4Li24LiH4LmC4Lir4Lil4LiU4LmD4Lir4Lih4LmI4LiX4Lix4LmJ4LiH4LiK4Li44LiUCiAgICByZXR1cm4gY2FsbEFwaSgnYXBwLmJvb3RzdHJhcCcpLnRoZW4oZnVuY3Rpb24oYil7IFMuYm9vdCA9IGI7IGxvYWQo',
  'eyBxdWlldDogdHJ1ZSB9KTsgfSk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7IH0pOwp9CgovKiAtLS0tIOC4iOC4seC4lOC4geC4suC4o+C4nOC4ueC5ieC5g+C4iuC5iSAo4Lic4Li54LmJ4LiU4Li54LmB4Lil',
  '4LmA4LiX4LmI4Liy4LiZ4Lix4LmJ4LiZKSAtLS0tICovCgpmdW5jdGlvbiBpc0FkbWluTm93KCl7CiAgcmV0dXJuICEhKFMuYm9vdCAmJiBTLmJvb3QuaXNBZG1pbik7Cn0KCmZ1bmN0aW9uIHNldHRpbmdzVXNlcnNDYXJkKHVzZXJzKXsKICBpZiAoIXVzZXJzKSBy',
  'ZXR1cm4gJyc7CiAgcmV0dXJuIGNhcmQoJ/CfkaUg4Lic4Li54LmJ4LmD4LiK4LmJ4LmD4LiZ4Lij4Liw4Lia4LiaICgnICsgdXNlcnMubGVuZ3RoICsgJyknLAogICAgJzxwIGNsYXNzPSJmczEzIG11dGVkIj7guYHguIjguIHguIrguLfguYjguK3guJzguLnguYng',
  'uYPguIrguYnguYHguKXguLDguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguYnguITguJnguK3guLfguYjguJnguYDguILguYnguLLguKHguLLguJTguLnguKvguKPguLfguK3guIrguYjguKfguKLguYHguIHguYnguILguYnguK3guKHguLnguKXguYTguJTg',
  'uYkgJyArCiAgICAn4LiV4Lix4LmJ4LiH4Liq4Li04LiX4LiY4Li04LmM4LmB4Lii4LiB4Lij4Liy4Lii4LiE4LiZIOC5geC4peC4sOC4o+C4sOC4h+C4seC4muC5hOC4lOC5ieC4l+C4uOC4geC5gOC4oeC4t+C5iOC4rTwvcD4nICsKICAgICc8ZGl2IGNsYXNzPSJ0',
  'dyBtdDEyIj48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICc8dGg+4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJPC90aD48dGg+4LiK4Li34LmI4Lit4LiX4Li14LmI4LmB4Liq4LiU4LiHPC90aD48dGg+4Liq4Li04LiX4LiY4Li04LmM',
  'PC90aD48dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD48dGg+4LmA4LiC4LmJ4Liy4Lil4LmI4Liy4Liq4Li44LiUPC90aD4nICsKICAgICAgJzx0aCBjbGFzcz0ibnVtIj7guK3guLjguJvguIHguKPguJPguYw8L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+',
  'JyArCiAgICB1c2Vycy5tYXAoZnVuY3Rpb24odSl7CiAgICAgIHZhciBtZU5vdyA9IChBVVRILm1lICYmIEFVVEgubWUudXNlcm5hbWUpID09PSB1LnVzZXJuYW1lOwogICAgICByZXR1cm4gJzx0cj4nICsKICAgICAgICAnPHRkPjxiPicgKyBlc2ModS51c2VybmFt',
  'ZSkgKyAnPC9iPicgKyAobWVOb3cgPyAnIDxzcGFuIGNsYXNzPSJiIGluZm8iPuC4hOC4uOC4kzwvc3Bhbj4nIDogJycpICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZD4nICsgZXNjKHUubmFtZSB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAnPHRkPicgKyBy',
  'b2xlQmFkZ2UodS5yb2xlKSArICc8L3RkPicgKwogICAgICAgICc8dGQ+JyArIHN0YXR1c0JhZGdlKHUuc3RhdHVzKSArICh1LmxvY2tlZCA/ICcgPHNwYW4gY2xhc3M9ImIgZGdyIj7guJbguLnguIHguKXguYfguK3guIHguIrguLHguYjguKfguITguKPguLLguKc8',
  'L3NwYW4+JyA6ICcnKSArICc8L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyAodS5sYXN0TG9naW4gPyB0aERhdGVTaG9ydChTdHJpbmcodS5sYXN0TG9naW4pLnNsaWNlKDAsMTApKSA6ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICc8dGQg',
  'Y2xhc3M9Im51bSI+JyArICh1LmRldmljZXMgfHwgMCkgKyAnPC90ZD4nICsKICAgICAgICAnPHRkIGNsYXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iZm9ybVVzZXIoJyArIGF0dHIodSkgKyAnKSI+',
  '4LmB4LiB4LmJ4LmE4LiCPC9idXR0b24+JyArCiAgICAgICAgICAobWVOb3cgPyAnJyA6ICc8YnV0dG9uIGNsYXNzPSJidG4gc20gZGdyIiBvbmNsaWNrPSJkZWxVc2VyKFwnJyArIGVzYyh1LnVzZXJuYW1lKSArICdcJykiPuC4peC4mjwvYnV0dG9uPicpICsKICAg',
  'ICAgICAnPC90ZD48L3RyPic7CiAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JywKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIHNtIiBvbmNsaWNrPSJmb3JtVXNlcigpIj4rIOC5gOC4nuC4tOC5iOC4oeC4nOC4ueC5ieC5g+C4iuC5',
  'iTwvYnV0dG9uPicpOwp9CgpmdW5jdGlvbiByb2xlQmFkZ2Uocm9sZSl7CiAgdmFyIGNscyA9IHJvbGUgPT09ICfguJzguLnguYnguJTguLnguYHguKUnID8gJ29rJyA6IChyb2xlID09PSAn4LmB4LiB4LmJ4LmE4LiC4LmE4LiU4LmJJyA/ICdpbmZvJyA6ICdtdXRl',
  'Jyk7CiAgcmV0dXJuICc8c3BhbiBjbGFzcz0iYiAnICsgY2xzICsgJyI+JyArIGVzYyhyb2xlKSArICc8L3NwYW4+JzsKfQoKLy8g4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4OiDguYPguIrguYkgYXR0cigpIOC4leC4seC4p+C5gOC4lOC4teC4ouC4p+C4geC4seC4',
  'muC4l+C4teC5iCBWaWV3cy5odG1sIOC4m+C4o+C4sOC4geC4suC4qOC5hOC4p+C5iQovLyDguYDguITguKLguJvguKPguLDguIHguLLguKjguIrguLfguYjguK3guIvguYnguLPguYTguKfguYnguJXguKPguIfguJnguLXguYnguITguKPguLHguYnguIfguKvguJng',
  'uLbguYjguIcg4LmB4Lil4LmJ4Lin4LmE4Lib4LiX4Lix4Lia4LiC4Lit4LiH4LmA4LiU4Li04Lih4LiI4LiZ4Lib4Li44LmI4Lih4LmB4LiB4LmJ4LmE4LiC4LiX4Lix4LmJ4LiH4Lij4Liw4Lia4Lia4Lie4Lix4LiHCi8vICjguJ/guK3guKPguYzguKHguILguLbg',
  'uYnguJnguKfguYjguLLguIcg4LmB4Lil4Liw4LiB4LiU4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Lil4Liy4Lii4LmA4Lib4LmH4LiZ4Liq4Lij4LmJ4Liy4LiH4Lij4Liy4Lii4LiB4Liy4Lij4LmD4Lir4Lih4LmI4LmB4LiX4LiZ4LiB4Liy4Lij4LmB4LiB4LmJ4LiC',
  '4Lit4LiH4LmA4LiU4Li04LihKQoKZnVuY3Rpb24gZm9ybVVzZXIoanNvbil7CiAgdmFyIHUgPSBqc29uID8gKHR5cGVvZiBqc29uID09PSAnc3RyaW5nJyA/IEpTT04ucGFyc2UoanNvbikgOiBqc29uKSA6IHt9OwogIHZhciBpc05ldyA9ICF1LnVzZXJuYW1lOwoK',
  'ICBvcGVuRm9ybSh7CiAgICB0aXRsZTogaXNOZXcgPyAn4LmA4Lie4Li04LmI4Lih4Lic4Li54LmJ4LmD4LiK4LmJ4LmD4Lir4Lih4LmIJyA6ICfguYHguIHguYnguYTguILguJzguLnguYnguYPguIrguYkgJyArIHUudXNlcm5hbWUsCiAgICBhY3Rpb246ICd1c2Vy',
  'LnNhdmUnLAogICAgcmVjb3JkOiBPYmplY3QuYXNzaWduKHsgaWQ6IGlzTmV3ID8gJycgOiB1LnVzZXJuYW1lLCByb2xlOiAn4LiU4Li54Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinJywgc3RhdHVzOiAn4LmD4LiK4LmJ4LiH4Liy4LiZJyB9LCB1KSwKICAg',
  'IGZpZWxkczogWwogICAgICB7IGtleTondXNlcm5hbWUnLCBsYWJlbDon4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJICjguKDguLLguKnguLLguK3guLHguIfguIHguKTguKkpJywgcmVxdWlyZWQ6aXNOZXcsIHBoOifguYDguIrguYjguJkgc29tY2hhaScs',
  'CiAgICAgICAgaGludDogaXNOZXcgPyAnYS16IDAtOSAuIF8gLSDguKLguLLguKcgM+KAkzI0IOC4leC4seC4pyDCtyDguYDguJvguKXguLXguYjguKLguJnguKDguLLguKLguKvguKXguLHguIfguYTguKHguYjguYTguJTguYknIDogJ+C5gOC4m+C4peC4teC5iOC4',
  'ouC4meC4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5ieC5hOC4oeC5iOC5hOC4lOC5iScgfSwKICAgICAgeyBrZXk6J25hbWUnLCBsYWJlbDon4LiK4Li34LmI4Lit4LiX4Li14LmI4LmB4Liq4LiU4LiHJywgcmVxdWlyZWQ6dHJ1ZSwgcGg6J+C5gOC4iuC5iOC4',
  'mSDguKrguKHguIrguLLguKInIH0sCiAgICAgIHsga2V5Oidyb2xlJywgbGFiZWw6J+C4quC4tOC4l+C4mOC4tOC5jOC4geC4suC4o+C5g+C4iuC5ieC4h+C4suC4mScsIHR5cGU6J3NlbGVjdCcsIGJsYW5rOmZhbHNlLCByZXF1aXJlZDp0cnVlLAogICAgICAgIG9w',
  'dGlvbnM6WyfguJTguLnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcnLCfguYHguIHguYnguYTguILguYTguJTguYknLCfguJzguLnguYnguJTguLnguYHguKUnXSwKICAgICAgICBoaW50OifguJTguLnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcg',
  'PSDguYDguJvguLTguJTguJTguLnguYTguJTguYnguJfguLjguIHguKvguJnguYnguLIgwrcg4LmB4LiB4LmJ4LmE4LiC4LmE4LiU4LmJID0g4LmA4Lie4Li04LmI4LihL+C5geC4geC5iS/guKXguJrguILguYnguK3guKHguLnguKUgwrcg4Lic4Li54LmJ4LiU4Li5',
  '4LmB4LilID0g4LiI4Lix4LiU4LiB4Liy4Lij4Lic4Li54LmJ4LmD4LiK4LmJ4LmB4Lil4Liw4LiB4Liy4Lij4LiV4Lix4LmJ4LiH4LiE4LmI4Liy4LmE4LiU4LmJ4LiU4LmJ4Lin4LiiJyB9LAogICAgICB7IGtleToncGFzc3dvcmQnLCBsYWJlbDogaXNOZXcgPyAn',
  '4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmA4Lij4Li04LmI4Lih4LiV4LmJ4LiZJyA6ICfguJXguLHguYnguIfguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYggKOC5gOC4p+C5ieC4meC4p+C5iOC4suC4hyA9IOC5hOC4oeC5iOC5gOC4m+C4peC4',
  'teC5iOC4ouC4mSknLAogICAgICAgIHJlcXVpcmVkOmlzTmV3LCBwaDon4Lit4Lii4LmI4Liy4LiH4LiZ4LmJ4Lit4LiiIDgg4LiV4Lix4Lin4Lit4Lix4LiB4Lip4LijJywKICAgICAgICBoaW50OifguIjguJTguYTguKfguYnguKrguYjguIfguYPguKvguYnguYDg',
  'uIjguYnguLLguJXguLHguKcg4oCUIOC4o+C4sOC4muC4muC5gOC4geC5h+C4muC5geC4muC4muC5gOC4guC5ieC4suC4o+C4q+C4seC4qiDguYDguJvguLTguJTguJTguLnguKLguYnguK3guJnguKvguKXguLHguIfguYTguKHguYjguYTguJTguYknIH0sCiAgICAg',
  'IHsga2V5OidtdXN0Q2hhbmdlJywgbGFiZWw6J+C5g+C4q+C5ieC5gOC4m+C4peC4teC5iOC4ouC4meC4o+C4q+C4seC4quC4nOC5iOC4suC4meC4leC4reC4meC5gOC4guC5ieC4suC4hOC4o+C4seC5ieC4h+C5geC4o+C4gScsIHR5cGU6J3NlbGVjdCcsIGJsYW5r',
  'OmZhbHNlLAogICAgICAgIG9wdGlvbnM6W3t2YWx1ZTondHJ1ZScsbGFiZWw6J+C5g+C4iuC5iCAo4LmB4LiZ4Liw4LiZ4LizKSd9LHt2YWx1ZTonZmFsc2UnLGxhYmVsOifguYTguKHguYjguJXguYnguK3guIcnfV0gfSwKICAgICAgeyBrZXk6J3N0YXR1cycsIGxh',
  'YmVsOifguKrguJbguLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBibGFuazpmYWxzZSwgb3B0aW9uczpbJ+C5g+C4iuC5ieC4h+C4suC4mScsJ+C4o+C4sOC4h+C4seC4middLAogICAgICAgIGhpbnQ6J+C4o+C4sOC4h+C4seC4miA9IOC5gOC4guC5ieC4suC4o+C4',
  'sOC4muC4muC5hOC4oeC5iOC5hOC4lOC5ieC4l+C4seC4meC4l+C4tSDguYHguJXguYjguKLguLHguIfguYDguIHguYfguJrguJrguLHguI3guIrguLXguYTguKfguYknIH0sCiAgICAgIHsga2V5Oidub3RlJywgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4',
  'uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0sCiAgICB3aWRlOiB0cnVlCiAgfSk7CgogIC8vIOC4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5ieC5gOC4m+C4peC4teC5iOC4ouC4meC5hOC4oeC5iOC5hOC4lOC5iSDguKXguYfguK3guIHg',
  'uIrguYjguK3guIfguYTguKfguYnguYDguKXguKLguIjguLDguYTguJTguYnguYTguKHguYjguYDguILguYnguLLguYPguIjguJzguLTguJQKICBpZiAoIWlzTmV3KSB7CiAgICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl91c2VybmFtZScpOwog',
  'ICAgaWYgKGVsKSB7IGVsLnJlYWRPbmx5ID0gdHJ1ZTsgZWwuc3R5bGUuYmFja2dyb3VuZCA9ICd2YXIoLS1zdXJmYWNlLTIpJzsgfQogIH0KfQoKZnVuY3Rpb24gZGVsVXNlcih1c2VybmFtZSl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4Lic4Li54LmJ4LmD4LiK',
  '4LmJICInICsgdXNlcm5hbWUgKyAnIiDguYPguIrguYjguYTguKvguKEg4oCUIOC5gOC4guC5ieC4suC4o+C4sOC4muC4muC5hOC4oeC5iOC5hOC4lOC5ieC4reC4teC4geC4l+C4seC4meC4l+C4tScsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCd1c2VyLmRlbGV0',
  'ZScsIHsgdXNlcm5hbWU6IHVzZXJuYW1lIH0pLnRoZW4oZnVuY3Rpb24oKXsKICAgICAgdG9hc3QoJ+C4peC4muC4nOC4ueC5ieC5g+C4iuC5ieC5geC4peC5ieC4pycsICdvaycpOwogICAgICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAgICB9KS5jYXRjaChmdW5j',
  'dGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlIHx8IGUsICdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qIC0tLS0g4Lil4Li04LiH4LiB4LmM4LmA4LiC4LmJ4Liy4LmD4LiK4LmJ4LiH4Liy4LiZIC0tLS0gKi8KCmZ1bmN0aW9uIHNldHRpbmdzU2hhcmVDYXJkKGxpbmtzKXsK',
  'ICBpZiAoIWxpbmtzIHx8ICFsaW5rcy5hcHBVcmwpIHsKICAgIHJldHVybiBjYXJkKCfwn5SXIOC4peC4tOC4h+C4geC5jOC5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4mScsCiAgICAgICc8ZGl2IGNsYXNzPSJlbXB0eSI+4Lii4Lix4LiH4Lir4Liy4Lil4Li0',
  '4LiH4LiB4LmM4LiI4Lij4Li04LiH4LmE4Lih4LmI4LmA4LiI4LitIOKAlCDguYDguJvguLTguJTguYDguKfguYfguJrguYHguK3guJvguIjguLLguIHguKXguLTguIfguIHguYzguJfguLXguYjguKXguIfguJfguYnguLLguKIgL2V4ZWMg4Liq4Lix4LiB4LiE4Lij',
  '4Lix4LmJ4LiHIOC5geC4peC5ieC4p+C4o+C4sOC4muC4muC4iOC4sOC4iOC4s+C5g+C4q+C5ieC5gOC4reC4hzwvZGl2PicpOwogIH0KICByZXR1cm4gY2FyZCgn8J+UlyDguKXguLTguIfguIHguYzguYDguILguYnguLLguYPguIrguYnguIfguLLguJknLAogICAg',
  'JzxkaXYgY2xhc3M9ImYgbWIxMiI+PGxhYmVsPuC4peC4tOC4h+C4geC5jOC4q+C4peC4seC4gSDigJQg4Liq4LmI4LiH4LmD4Lir4LmJ4LiX4Li44LiB4LiE4LiZ4LmE4LiU4LmJICjguYDguILguYnguLLguJTguYnguKfguKLguIrguLfguYjguK3guJzguLnguYng',
  'uYPguIrguYnguYHguKXguLDguKPguKvguLHguKrguJzguYjguLLguJkpPC9sYWJlbD4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0iYXBwVXJsIiByZWFkb25seSB2YWx1ZT0iJyArIGVzYyhsaW5rcy5hcHBVcmwpICsgJyIgb25jbGljaz0idGhpcy5z',
  'ZWxlY3QoKSI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0icm93IG1iMTIiPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iY29weUZpZWxkKFwnYXBwVXJsXCcpIj7wn5OLIOC4hOC4seC4lOC4peC4reC4geC4peC4tOC4h+C4geC5',
  'jOC4q+C4peC4seC4gTwvYnV0dG9uPicgKwogICAgJzwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImhyIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJmIG1iMTIiPjxsYWJlbD7wn5GAIOC4peC4tOC4h+C4geC5jOC4lOC4ueC4reC4ouC5iOC4suC4h+C5gOC4',
  'lOC4teC4ouC4p+C5geC4muC4muC5hOC4oeC5iOC4leC5ieC4reC4h+C4peC5h+C4reC4geC4reC4tOC4mTwvbGFiZWw+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9InNoYXJlVXJsIiByZWFkb25seSB2YWx1ZT0iJyArIGVzYyhsaW5rcy52aWV3VXJs',
  'KSArICciIG9uY2xpY2s9InRoaXMuc2VsZWN0KCkiPjwvZGl2PicgKwogICAgJzxwIGNsYXNzPSJmczEyICcgKyAobGlua3Muc2hhcmVFbmFibGVkID8gJ211dGVkJyA6ICd3YXJuLXRleHQnKSArICciPicgKwogICAgICAobGlua3Muc2hhcmVFbmFibGVkCiAgICAg',
  'ICAgPyAn4LmA4Lib4Li04LiU4Lit4Lii4Li54LmIIOKAlCDguYPguITguKPguIHguYfguJXguLLguKHguJfguLXguYjguKHguLXguKXguLTguIfguIHguYzguJnguLXguYnguYDguJvguLTguJTguJTguLnguILguYnguK3guKHguLnguKXguYTguJTguYnguYLguJTg',
  'uKLguYTguKHguYjguJXguYnguK3guIfguKXguYfguK3guIHguK3guLTguJknCiAgICAgICAgOiAn4pqg77iPIOC4m+C4tOC4lOC4reC4ouC4ueC5iCDigJQg4Lil4Li04LiH4LiB4LmM4LiZ4Li14LmJ4Lii4Lix4LiH4LmD4LiK4LmJ4LmE4Lih4LmI4LmE4LiU4LmJ',
  'IOC5gOC4m+C4tOC4lOC4quC4p+C4tOC4leC4iuC5jOC5hOC4lOC5ieC4l+C4teC5iOC4q+C4seC4p+C4guC5ieC4rSAi4LiE4Lin4Liy4Lih4Lib4Lil4Lit4LiU4Lig4Lix4Lii4LmB4Lil4Liw4LiB4Liy4Lij4LmA4LiC4LmJ4Liy4LmD4LiK4LmJ4LiH4Liy4LiZ',
  'IiDguJTguYnguLLguJnguJrguJknKSArCiAgICAnPC9wPicgKwogICAgJzxkaXYgY2xhc3M9InJvdyBtdDEyIj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY29weUZpZWxkKFwnc2hhcmVVcmxcJykiPvCfk4sg4LiE4Lix4LiU4Lil4Lit',
  '4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmMPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gZGdyIiBvbmNsaWNrPSJkb1JvdGF0ZVNoYXJlKCkiPvCflIEg4Lit4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LmD4Lir4Lih',
  '4LmIPC9idXR0b24+JyArCiAgICAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PicgKwogICAgJzxwIGNsYXNzPSJmczEyIG11dGVkIj7wn4aYIOC4peC4tOC4h+C4geC5jOC4geC4ueC5ieC4o+C4sOC4muC4miAo4LmD4LiK4LmJ4LiV4Lit4LiZ',
  '4Lil4Li34Lih4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LiI4LiZ4LmA4LiC4LmJ4Liy4LmE4Lih4LmI4LmE4LiU4LmJIOKAlCDguKvguYnguLLguKHguKrguYjguIfguJXguYjguK0pPGJyPicgKwogICAgJzxjb2RlIGNsYXNzPSJmczEyIj4nICsgZXNjKGxpbmtz',
  'LmFkbWluVXJsKSArICc8L2NvZGU+PC9wPicpOwp9CgpmdW5jdGlvbiBjb3B5RmllbGQoaWQpewogIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTsKICBpZiAoIWVsKSByZXR1cm47CiAgZWwuc2VsZWN0KCk7CiAgdHJ5IHsgZG9jdW1lbnQuZXhl',
  'Y0NvbW1hbmQoJ2NvcHknKTsgdG9hc3QoJ+C4hOC4seC4lOC4peC4reC4geC5geC4peC5ieC4pycsICdvaycpOyB9CiAgY2F0Y2ggKGUpIHsgdG9hc3QoJ+C4geC4lOC4hOC5ieC4suC4h+C4l+C4teC5iOC4iuC5iOC4reC4h+C5geC4peC5ieC4p+C5gOC4peC4t+C4',
  'reC4gSDguITguLHguJTguKXguK3guIEnLCAnZXJyJyk7IH0KfQo8L3NjcmlwdD4KPHNjcmlwdD4KLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIEZvcm1zLmh0bWwg4oCUIOC4n+C4reC4o+C5jOC4',
  'oeC5gOC4nuC4tOC5iOC4oS/guYHguIHguYnguYTguIIg4LmB4Lil4Liw4LiB4Liy4Lij4Lil4LiaCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKdmFyIEZPUk0gPSB7CiAgc3BlY3M6IFtdLCAg',
  'ICAgICAvLyDguJzguLHguIfguIrguYjguK3guIfguIHguKPguK3guIHguILguK3guIfguJ/guK3guKPguYzguKHguJfguLXguYjguYDguJvguLTguJTguK3guKLguLnguYgKICBrZWVwOiB7fSwgICAgICAgIC8vIOC5hOC4n+C4peC5jOC5geC4meC4muC5gOC4lOC4',
  'tOC4oeC4l+C4teC5iOC4ouC4seC4h+C5hOC4oeC5iOC5hOC4lOC5ieC5gOC4reC4suC4reC4reC4gQogIGJ1Y2tldDogJ21pc2MnLCAgLy8g4LmC4Lif4Lil4LmA4LiU4Lit4Lij4LmM4LiX4Li14LmI4LiI4Liw4LmA4LiB4LmH4Lia4LmE4Lif4Lil4LmM4LmB4LiZ',
  '4Lia4LmD4Lir4Lih4LmICiAgb2NyOiBudWxsLCAgICAgICAvLyDguJzguLHguIfguIHguLLguKPguYDguJXguLTguKHguITguYjguLLguIjguLLguIHguKPguLnguJsKICByZWM6IG51bGwsICAgICAgIC8vIOC4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4geC4',
  's+C4peC4seC4h+C5geC4geC5ieC4reC4ouC4ueC5iCAobnVsbCA9IOC4geC4s+C4peC4seC4h+C5gOC4nuC4tOC5iOC4oeC4o+C4suC4ouC4geC4suC4o+C5g+C4q+C4oeC5iCkKICBsaW5lczogW10sICAgICAgIC8vIOC4o+C4suC4ouC4geC4suC4o+C4ouC5iOC4',
  'reC4ouC5g+C4meC4muC4tOC4pSAo4LmD4LiK4LmJ4LiB4Lix4Lia4LiK4LmI4Lit4LiH4LiK4LiZ4Li04LiUIGxpbmVzKQogIHRvZG86IFtdLCAgICAgICAgLy8g4LmA4LiK4LmH4LiE4Lil4Li04Liq4LiV4LmM4LiH4Liy4LiZ4LiL4LmI4Lit4LihICjguYPguIrg',
  'uYnguIHguLHguJrguIrguYjguK3guIfguIrguJnguLTguJQgdG9kbykKICB0b2RvT3B0aW9uczogW10gIC8vIOC4leC4seC4p+C5gOC4peC4t+C4reC4geC4m+C4o+C4sOC5gOC4oOC4l+C4h+C4suC4meC4guC4reC4h+C5geC4leC5iOC4peC4sOC4guC5ieC4rQp9',
  'OwoKLyogLS0tLS0tLS0tLS0tLS0tLSBmb3JtIGVuZ2luZSAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiBmaWVsZHNIdG1sKHNwZWNzLCByZWMpewogIHJlYyA9IHJlYyB8fCB7fTsKICBGT1JNLnNwZWNzID0gc3BlY3M7CiAgRk9STS5rZWVwID0ge307CiAg',
  'cmV0dXJuICc8ZGl2IGNsYXNzPSJmZ3JpZCI+JyArIHNwZWNzLm1hcChmdW5jdGlvbihmKXsKICAgIHZhciB2ID0gcmVjW2Yua2V5XTsKICAgIHZhciBpZCA9ICdmXycgKyBmLmtleTsKICAgIHZhciBpbm5lcjsKCiAgICBpZiAoZi50eXBlID09PSAnc2VsZWN0Jykg',
  'ewogICAgICB2YXIgb3B0cyA9IChmLm9wdGlvbnMgfHwgW10pLm1hcChmdW5jdGlvbihvKXsKICAgICAgICB2YXIgdmFsID0gdHlwZW9mIG8gPT09ICdvYmplY3QnID8gby52YWx1ZSA6IG87CiAgICAgICAgdmFyIGxhYiA9IHR5cGVvZiBvID09PSAnb2JqZWN0JyA/',
  'IG8ubGFiZWwgOiBvOwogICAgICAgIHJldHVybiAnPG9wdGlvbiB2YWx1ZT0iJyArIGVzYyh2YWwpICsgJyInICsgKFN0cmluZyh2KSA9PT0gU3RyaW5nKHZhbCkgPyAnIHNlbGVjdGVkJyA6ICcnKSArICc+JyArIGVzYyhsYWIpICsgJzwvb3B0aW9uPic7CiAgICAg',
  'IH0pLmpvaW4oJycpOwogICAgICBpbm5lciA9ICc8c2VsZWN0IGNsYXNzPSJzZWwiIGlkPSInICsgaWQgKyAnIj4nICsgKGYuYmxhbmsgIT09IGZhbHNlID8gJzxvcHRpb24gdmFsdWU9IiI+4oCUIOC5gOC4peC4t+C4reC4gSDigJQ8L29wdGlvbj4nIDogJycpICsg',
  'b3B0cyArICc8L3NlbGVjdD4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAndGV4dGFyZWEnKSB7CiAgICAgIGlubmVyID0gJzx0ZXh0YXJlYSBjbGFzcz0idGEiIGlkPSInICsgaWQgKyAnIiBwbGFjZWhvbGRlcj0iJyArIGVzYyhmLnBofHwnJykgKyAnIj4n',
  'ICsgZXNjKHZ8fCcnKSArICc8L3RleHRhcmVhPic7CgogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICdmaWxlcycpIHsKICAgICAgRk9STS5rZWVwW2Yua2V5XSA9IChyZWNbZi5rZXldICYmIHJlY1tmLmtleV0ubGVuZ3RoKSA/IFtdLmNvbmNhdChyZWNbZi5rZXld',
  'KSA6IFtdOwogICAgICBpbm5lciA9CiAgICAgICAgJzxkaXYgaWQ9IicgKyBpZCArICdfZXhpc3RpbmciPicgKyBleGlzdGluZ0ZpbGVzSHRtbChmLmtleSkgKyAnPC9kaXY+JyArCiAgICAgICAgJzxsYWJlbCBjbGFzcz0iZmlsZS1kcm9wIiBmb3I9IicgKyBpZCAr',
  'ICciPvCfk44g4LmB4LiV4Liw4LmA4Lie4Li34LmI4Lit4LmA4Lil4Li34Lit4LiB4LmE4Lif4Lil4LmMICjguYDguKXguLfguK3guIHguYTguJTguYnguKvguKXguLLguKLguYTguJ/guKXguYwgwrcg4LmE4Lih4LmI4LmA4LiB4Li04LiZIDEyIE1CIOC4leC5iOC4',
  'reC5hOC4n+C4peC5jCknICsKICAgICAgICAnPGlucHV0IHR5cGU9ImZpbGUiIGlkPSInICsgaWQgKyAnIiBtdWx0aXBsZSBhY2NlcHQ9ImltYWdlLyosYXBwbGljYXRpb24vcGRmIiBzdHlsZT0iZGlzcGxheTpub25lIiAnICsKICAgICAgICAnb25jaGFuZ2U9InBy',
  'ZXZpZXdQaWNrZWQodGhpcyxcJycgKyBpZCArICdcJykiPjwvbGFiZWw+JyArCiAgICAgICAgJzxkaXYgaWQ9IicgKyBpZCArICdfcHJldmlldyIgY2xhc3M9InRodW1icyBtdDgiPjwvZGl2PicgKwogICAgICAgICc8ZGl2IGlkPSInICsgaWQgKyAnX29jciI+PC9k',
  'aXY+JzsKCiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ3RvZG8nKSB7CiAgICAgIEZPUk0udG9kbyA9IHBhcnNlVG9kb1RleHQodik7CiAgICAgIEZPUk0udG9kb09wdGlvbnMgPSBmLm9wdGlvbnMgfHwgW107CiAgICAgIGlubmVyID0gJzxkaXYgaWQ9IicgKyBp',
  'ZCArICciIGNsYXNzPSJ0b2RvIj4nICsgdG9kb1RhYmxlSHRtbCgpICsgJzwvZGl2Pic7CgogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICdsaW5lcycpIHsKICAgICAgRk9STS5saW5lcyA9IHBhcnNlTGluZXNUZXh0KHYpOwogICAgICBpbm5lciA9ICc8ZGl2IGlk',
  'PSInICsgaWQgKyAnIiBjbGFzcz0ibGluZXMiPicgKyBsaW5lc1RhYmxlSHRtbCgpICsgJzwvZGl2Pic7CgogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICdjb21wdXRlZCcpIHsKICAgICAgaW5uZXIgPSAnPGRpdiBjbGFzcz0iaW5wIiBpZD0iJyArIGlkICsgJyIg',
  'c3R5bGU9ImJhY2tncm91bmQ6dmFyKC0tc3VyZmFjZS0yKTtmb250LXdlaWdodDo2MDA7JyArCiAgICAgICAgICAgICAgJ2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtcztjdXJzb3I6ZGVmYXVsdCI+MDwvZGl2Pic7CgogICAgfSBlbHNlIGlmIChmLnR5',
  'cGUgPT09ICdkYXRlJykgewogICAgICBpbm5lciA9ICc8aW5wdXQgdHlwZT0iZGF0ZSIgY2xhc3M9ImlucCIgaWQ9IicgKyBpZCArICciIHZhbHVlPSInICsgZXNjKHYgfHwgJycpICsgJyI+JzsKCiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ251bWJlcicgfHwg',
  'Zi50eXBlID09PSAnbW9uZXknKSB7CiAgICAgIGlubmVyID0gJzxpbnB1dCB0eXBlPSJudW1iZXIiIHN0ZXA9IicgKyAoZi50eXBlID09PSAnbW9uZXknID8gJzAuMDEnIDogJzEnKSArICciIGNsYXNzPSJpbnAiIGlkPSInICsgaWQgKyAnIiAnICsKICAgICAgICAg',
  'ICAgICAndmFsdWU9IicgKyAodiA9PSBudWxsIHx8IHYgPT09ICcnID8gJycgOiBlc2ModikpICsgJyIgcGxhY2Vob2xkZXI9IicgKyBlc2MoZi5waHx8JycpICsgJyIgaW5wdXRtb2RlPSJkZWNpbWFsIicgKwogICAgICAgICAgICAgIChmLnN1bXMgPyAnIG9uaW5w',
  'dXQ9InJlY2FsY1N1bXMoKSInIDogKGYub25pbnB1dCA/ICcgb25pbnB1dD0iJyArIGVzYyhmLm9uaW5wdXQpICsgJyInIDogJycpKSArICc+JzsKCiAgICB9IGVsc2UgewogICAgICBpbm5lciA9ICc8aW5wdXQgdHlwZT0idGV4dCIgY2xhc3M9ImlucCIgaWQ9Iicg',
  'KyBpZCArICciIHZhbHVlPSInICsgZXNjKHYgfHwgJycpICsgJyIgcGxhY2Vob2xkZXI9IicgKyBlc2MoZi5waHx8JycpICsgJyI+JzsKICAgIH0KCiAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImYnICsgKGYuZnVsbCA/ICcgZnVsbCcgOiAnJykgKyAnIj4nICsKICAg',
  'ICAgJzxsYWJlbCBmb3I9IicgKyBpZCArICciPicgKyBlc2MoZi5sYWJlbCkgKyAoZi5yZXF1aXJlZCA/ICcgPHNwYW4gc3R5bGU9ImNvbG9yOnZhcigtLWRhbmdlcikiPio8L3NwYW4+JyA6ICcnKSArICc8L2xhYmVsPicgKwogICAgICBpbm5lciArIChmLmhpbnQg',
  'PyAnPGRpdiBjbGFzcz0iaGludCI+JyArCiAgICAgICAgKGYuaGludC5jaGFyQXQoMCkgPT09ICc8JyA/IGYuaGludCA6IGVzYyhmLmhpbnQpKSArICc8L2Rpdj4nIDogJycpICsgJzwvZGl2Pic7CiAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKfQoKLyogPT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC5gOC4iuC5h+C4hOC4peC4tOC4quC4leC5jOC4h+C4suC4meC4i+C5iOC4reC4oSDigJQg4LmA4LiC4LmJ4Liy4LiL4LmI4Lit4Lih4LiE4Lij4Lix4LmJ4LiH',
  '4LmA4LiU4Li14Lii4Lin4Lih4Lix4LiB4LiL4LmI4Lit4Lih4Lir4Lil4Liy4Lii4LiI4Li44LiUCgogICDguYDguIHguYfguJrguKXguIfguIrguLXguJXguJrguKPguKPguJfguLHguJTguKXguLDguIfguLLguJkgIFt4XSDguIrguLfguYjguK3guIfguLLguJkg',
  'fCDguJvguKPguLDguYDguKDguJfguIfguLLguJkKICAgKOC4o+C4ueC4m+C5geC4muC4muC5gOC4lOC4teC4ouC4p+C4geC4seC4miBwYXJzZVRvZG9fIOC4neC4seC5iOC4h+C5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jCDigJQg4LmB4LiB4LmJ4LiX',
  '4Li14LmI4LmE4Lir4LiZ4LiV4LmJ4Lit4LiH4LmB4LiB4LmJ4LmD4Lir4LmJ4LiV4Lij4LiH4LiB4Lix4LiZKQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCmZ1bmN0aW9uIHBhcnNlVG9k',
  'b1RleHQodGV4dCl7CiAgdmFyIHJhdyA9IFN0cmluZyh0ZXh0ID09IG51bGwgPyAnJyA6IHRleHQpOwogIGlmICghcmF3LnRyaW0oKSkgcmV0dXJuIFtdOwogIHZhciBsaW5lcyA9IHJhdy5zcGxpdCgvXHI/XG4vKS5tYXAoZnVuY3Rpb24obCl7IHJldHVybiBsLnRy',
  'aW0oKTsgfSkuZmlsdGVyKEJvb2xlYW4pOwoKICAvLyDguILguK3guIfguYDguJTguLTguKHguYDguILguLXguKLguJnguKPguKfguKHguJrguKPguKPguJfguLHguJTguYDguJTguLXguKLguKfguKfguYjguLIgIjEu4Lii4Liy4LmB4LiZ4LinIDIu4LmA4LiB4LmH',
  '4Lia4Liq4Li14Lir4LmJ4Lit4LiHIgogIGlmIChsaW5lcy5sZW5ndGggPT09IDEgJiYgL1xkXHMqWy4pXS8udGVzdChsaW5lc1swXSkgJiYgbGluZXNbMF0uY2hhckF0KDApICE9PSAnWycpIHsKICAgIGxpbmVzID0gbGluZXNbMF0uc3BsaXQoL1xzKlxkK1xzKlsu',
  'KV1ccyovKS5tYXAoZnVuY3Rpb24oeCl7IHJldHVybiB4LnRyaW0oKTsgfSkuZmlsdGVyKEJvb2xlYW4pOwogIH0KCiAgcmV0dXJuIGxpbmVzLm1hcChmdW5jdGlvbihsaW5lKXsKICAgIHZhciBkb25lID0gZmFsc2U7CiAgICB2YXIgbSA9IGxpbmUubWF0Y2goL15c',
  'W1xzKihbeFjinJNdKT9ccypcXVxzKiguKikkLyk7CiAgICBpZiAobSkgeyBkb25lID0gISFtWzFdOyBsaW5lID0gbVsyXTsgfQogICAgbGluZSA9IGxpbmUucmVwbGFjZSgvXlxkK1xzKlsuKV1ccyovLCAnJykudHJpbSgpOwogICAgdmFyIGEgPSBsaW5lLnNwbGl0',
  'KCd8Jyk7CiAgICByZXR1cm4geyBkb25lOiBkb25lLCBuYW1lOiAoYVswXSB8fCAnJykudHJpbSgpLCBjYXRlZ29yeTogKGFbMV0gfHwgJycpLnRyaW0oKSB9OwogIH0pLmZpbHRlcihmdW5jdGlvbih0KXsgcmV0dXJuIHQubmFtZTsgfSk7Cn0KCmZ1bmN0aW9uIGZv',
  'cm1hdFRvZG9UZXh0KGxpc3QpewogIHJldHVybiAobGlzdCB8fCBbXSkKICAgIC5maWx0ZXIoZnVuY3Rpb24odCl7IHJldHVybiBTdHJpbmcodC5uYW1lIHx8ICcnKS50cmltKCk7IH0pCiAgICAubWFwKGZ1bmN0aW9uKHQpewogICAgICB2YXIgbm0gPSBTdHJpbmco',
  'dC5uYW1lKS5yZXBsYWNlKC9cfC9nLCAnLycpLnRyaW0oKTsKICAgICAgdmFyIGN0ID0gU3RyaW5nKHQuY2F0ZWdvcnkgfHwgJycpLnJlcGxhY2UoL1x8L2csICcvJykudHJpbSgpOwogICAgICByZXR1cm4gJ1snICsgKHQuZG9uZSA/ICd4JyA6ICcgJykgKyAnXSAn',
  'ICsgbm0gKyAoY3QgPyAnIHwgJyArIGN0IDogJycpOwogICAgfSkuam9pbignXG4nKTsKfQoKZnVuY3Rpb24gdG9kb0RvbmUoKXsgcmV0dXJuIChGT1JNLnRvZG8gfHwgW10pLmZpbHRlcihmdW5jdGlvbih0KXsgcmV0dXJuIHQuZG9uZTsgfSkubGVuZ3RoOyB9Cgpm',
  'dW5jdGlvbiB0b2RvVGFibGVIdG1sKCl7CiAgdmFyIG9wdHMgPSBGT1JNLnRvZG9PcHRpb25zIHx8IFtdOwogIHZhciByb3dzID0gKEZPUk0udG9kbyB8fCBbXSkubWFwKGZ1bmN0aW9uKHQsIGkpewogICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJ0b2RvLXJvdycgKyAo',
  'dC5kb25lID8gJyBkb25lJyA6ICcnKSArICciPicgKwogICAgICAnPGxhYmVsIGNsYXNzPSJ0b2RvLWNoZWNrIiB0aXRsZT0iJyArICh0LmRvbmUgPyAn4LiX4Liz4LmA4Liq4Lij4LmH4LiI4LmB4Lil4LmJ4LinJyA6ICfguKLguLHguIfguYTguKHguYjguYTguJTg',
  'uYnguJfguLMnKSArICciPicgKwogICAgICAgICc8aW5wdXQgdHlwZT0iY2hlY2tib3giJyArICh0LmRvbmUgPyAnIGNoZWNrZWQnIDogJycpICsgJyBvbmNoYW5nZT0ic2V0VG9kbygnICsgaSArICcsXCdkb25lXCcsdGhpcy5jaGVja2VkKSI+JyArCiAgICAgICc8',
  'L2xhYmVsPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIHBsYWNlaG9sZGVyPSLguIfguLLguJnguJfguLXguYjguJXguYnguK3guIfguIvguYjguK3guKEiIHZhbHVlPSInICsgZXNjKHQubmFtZSB8fCAnJykgKyAnIiAnICsKICAgICAgICAnb25pbnB1dD0i',
  'c2V0VG9kbygnICsgaSArICcsXCduYW1lXCcsdGhpcy52YWx1ZSkiPicgKwogICAgICAnPHNlbGVjdCBjbGFzcz0ic2VsIiBvbmNoYW5nZT0ic2V0VG9kbygnICsgaSArICcsXCdjYXRlZ29yeVwnLHRoaXMudmFsdWUpIj4nICsKICAgICAgICAnPG9wdGlvbiB2YWx1',
  'ZT0iIj7igJQg4Lib4Lij4Liw4LmA4Lig4LiX4LiH4Liy4LiZIOKAlDwvb3B0aW9uPicgKwogICAgICAgIG9wdHMubWFwKGZ1bmN0aW9uKG8pewogICAgICAgICAgcmV0dXJuICc8b3B0aW9uIHZhbHVlPSInICsgZXNjKG8pICsgJyInICsgKG8gPT09IHQuY2F0ZWdv',
  'cnkgPyAnIHNlbGVjdGVkJyA6ICcnKSArICc+JyArIGVzYyhvKSArICc8L29wdGlvbj4nOwogICAgICAgIH0pLmpvaW4oJycpICsKICAgICAgJzwvc2VsZWN0PicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20gZGdyIiB0aXRsZT0i',
  '4LmA4Lit4Liy4LiH4Liy4LiZ4LiZ4Li14LmJ4Lit4Lit4LiBIiBvbmNsaWNrPSJkZWxUb2RvKCcgKyBpICsgJykiPsOXPC9idXR0b24+JyArCiAgICAnPC9kaXY+JzsKICB9KS5qb2luKCcnKTsKCiAgdmFyIG4gPSAoRk9STS50b2RvIHx8IFtdKS5sZW5ndGgsIGQg',
  'PSB0b2RvRG9uZSgpOwogIHJldHVybiAocm93cyB8fCAnPGRpdiBjbGFzcz0iaGludCIgc3R5bGU9InBhZGRpbmc6OHB4IDJweCI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZIOKAlCDguIHguJQg4oCc4LmA4Lie4Li04LmI4Lih4LiH4Liy4LiZ4oCd',
  'IOC5gOC4nuC4t+C5iOC4reC5g+C4quC5iOC4l+C4teC4peC4sOC4iOC4uOC4lOC4l+C4teC5iOC4leC5ieC4reC4h+C4i+C5iOC4reC4oTwvZGl2PicpICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQ4Ij4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBj',
  'bGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJhZGRUb2RvKCkiPisg4LmA4Lie4Li04LmI4Lih4LiH4Liy4LiZPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0icGFzdGVUb2RvKCkiPvCfk4sg4Lin4Liy',
  '4LiH4LiX4Li14LmA4LiU4Li14Lii4Lin4Lir4Lil4Liy4Lii4LiH4Liy4LiZPC9idXR0b24+JyArCiAgICAgIChuID8gJzxkaXYgY2xhc3M9InRvZG8tY291bnQiPuC5gOC4quC4o+C5h+C4iOC5geC4peC5ieC4pyA8Yj4nICsgZCArICcvJyArIG4gKyAnPC9iPiDg',
  'uIfguLLguJk8L2Rpdj4nIDogJycpICsKICAgICc8L2Rpdj4nOwp9CgpmdW5jdGlvbiByZWRyYXdUb2RvKCl7CiAgdmFyIGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2l0ZW1zJyk7CiAgaWYgKCFib3gpIHJldHVybjsKICBib3guaW5uZXJIVE1MID0g',
  'dG9kb1RhYmxlSHRtbCgpOwp9CgpmdW5jdGlvbiBzZXRUb2RvKGksIGtleSwgdmFsKXsKICBpZiAoIUZPUk0udG9kb1tpXSkgcmV0dXJuOwogIEZPUk0udG9kb1tpXVtrZXldID0gKGtleSA9PT0gJ2RvbmUnKSA/ICEhdmFsIDogdmFsOwogIGlmIChrZXkgPT09ICdk',
  'b25lJykgeyByZWRyYXdUb2RvKCk7IHJldHVybjsgfSAgIC8vIOC4leC4tOC5iuC4geC5geC4peC5ieC4p+C4p+C4suC4lOC5g+C4q+C4oeC5iOC5g+C4q+C5ieC4guC4teC4lOC4huC5iOC4suC5gOC4q+C5h+C4meC4iuC4seC4lAogIHZhciBjID0gZG9jdW1lbnQu',
  'cXVlcnlTZWxlY3RvcignI2ZfaXRlbXMgLnRvZG8tY291bnQgYicpOwogIGlmIChjKSBjLnRleHRDb250ZW50ID0gdG9kb0RvbmUoKSArICcvJyArIEZPUk0udG9kby5sZW5ndGg7Cn0KCmZ1bmN0aW9uIGFkZFRvZG8oKXsKICBGT1JNLnRvZG8ucHVzaCh7IGRvbmU6',
  'IGZhbHNlLCBuYW1lOiAnJywgY2F0ZWdvcnk6ICcnIH0pOwogIHJlZHJhd1RvZG8oKTsKICB2YXIgaW5wdXRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2ZfaXRlbXMgLnRvZG8tcm93IC5pbnAnKTsKICBpZiAoaW5wdXRzLmxlbmd0aCkgaW5wdXRzW2lu',
  'cHV0cy5sZW5ndGggLSAxXS5mb2N1cygpOwp9CgpmdW5jdGlvbiBkZWxUb2RvKGkpewogIEZPUk0udG9kby5zcGxpY2UoaSwgMSk7CiAgcmVkcmF3VG9kbygpOwp9CgovKiog4Lin4Liy4LiH4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LiL',
  '4LmI4Lit4Lih4LiX4Li14LmA4LiU4Li14Lii4Lin4Lir4Lil4Liy4Lii4Lia4Lij4Lij4LiX4Lix4LiUIOC5geC4peC5ieC4p+C5g+C4q+C5ieC4o+C4sOC4muC4muC5geC4ouC4geC5g+C4q+C5iSAqLwpmdW5jdGlvbiBwYXN0ZVRvZG8oKXsKICB2YXIgYm94ID0g',
  'ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvZG9QYXN0ZVdyYXAnKTsKICBpZiAoYm94KSB7IGJveC5oaWRkZW4gPSAhYm94LmhpZGRlbjsgaWYgKCFib3guaGlkZGVuKSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9kb1Bhc3RlQm94JykuZm9jdXMoKTsgcmV0',
  'dXJuOyB9CgogIHZhciBob3N0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfaXRlbXMnKTsKICBpZiAoIWhvc3QpIHJldHVybjsKICB2YXIgd3JhcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogIHdyYXAuaWQgPSAndG9kb1Bhc3RlV3JhcCc7',
  'CiAgd3JhcC5jbGFzc05hbWUgPSAnbXQ4JzsKICB3cmFwLmlubmVySFRNTCA9CiAgICAnPHRleHRhcmVhIGNsYXNzPSJ0YSIgaWQ9InRvZG9QYXN0ZUJveCIgc3R5bGU9Im1pbi1oZWlnaHQ6MTEwcHgiICcgKwogICAgICAncGxhY2Vob2xkZXI9IuC4ouC4suC5geC4',
  'meC4p+C4q+C5ieC4reC4h+C4meC5ieC4syYjMTA74LmA4LiB4LmH4Lia4Liq4Li14Lir4LmJ4Lit4LiHJiMxMDvguYDguJvguKXguLXguYjguKLguJnguIHguYrguK3guIHguJnguYnguLPguKXguYnguLLguIfguIjguLLguJkiPjwvdGV4dGFyZWE+JyArCiAgICAn',
  'PGRpdiBjbGFzcz0iaGludCBtdDgiPuC4muC4o+C4o+C4l+C4seC4lOC4peC4sOC4q+C4meC4tuC5iOC4h+C4h+C4suC4mSDCtyDguKvguKPguLfguK3guJ7guLTguKHguJ7guYzguKPguKfguKHguJrguKPguKPguJfguLHguJTguYDguJTguLXguKLguKfguYHguJrg',
  'uJog4oCcMS7guKLguLLguYHguJnguKcgMi7guYDguIHguYfguJrguKrguLXguKvguYnguK3guIfigJ0g4LiB4LmH4LmE4LiU4LmJPGJyPicgKwogICAgICAn4LmD4Liq4LmI4Lib4Lij4Liw4LmA4Lig4LiX4LiH4Liy4LiZ4LiX4Li14Lir4Lil4Lix4LiH4LiI4Liy',
  '4LiB4LiK4LmI4Lit4LiH4LiC4LmJ4Liy4LiHIOC5hiDguYHguJXguYjguKXguLDguIfguLLguJk8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQ4Ij4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIHByaSIgb25jbGlj',
  'az0iYXBwbHlQYXN0ZWRUb2RvKCkiPuC5gOC4nuC4tOC5iOC4oeC5gOC4guC5ieC4suC4o+C4suC4ouC4geC4suC4ozwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImRvY3VtZW50LmdldEVsZW1l',
  'bnRCeUlkKFwndG9kb1Bhc3RlV3JhcFwnKS5oaWRkZW49dHJ1ZSI+4Lib4Li04LiUPC9idXR0b24+JyArCiAgICAnPC9kaXY+JzsKICBob3N0LmFwcGVuZENoaWxkKHdyYXApOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2RvUGFzdGVCb3gnKS5mb2N1cygp',
  'Owp9CgpmdW5jdGlvbiBhcHBseVBhc3RlZFRvZG8oKXsKICB2YXIgdGV4dCA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9kb1Bhc3RlQm94JykgfHwge30pLnZhbHVlIHx8ICcnOwogIHZhciBhZGRlZCA9IHBhcnNlVG9kb1RleHQodGV4dCk7CiAgaWYgKCFh',
  'ZGRlZC5sZW5ndGgpIHJldHVybiB0b2FzdCgn4LmE4Lih4LmI4Lie4Lia4LiH4Liy4LiZ4LiX4Li14LmI4Lit4LmI4Liy4LiZ4LmE4LiU4LmJJywgJ2VycicpOwogIEZPUk0udG9kbyA9IChGT1JNLnRvZG8gfHwgW10pLmZpbHRlcihmdW5jdGlvbih0KXsgcmV0dXJu',
  'IFN0cmluZyh0Lm5hbWUgfHwgJycpLnRyaW0oKTsgfSkuY29uY2F0KGFkZGVkKTsKICByZWRyYXdUb2RvKCk7CiAgdG9hc3QoJ+C5gOC4nuC4tOC5iOC4oeC5g+C4q+C5iSAnICsgYWRkZWQubGVuZ3RoICsgJyDguIfguLLguJknLCAnb2snKTsKfQoKLyogPT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4muC4tOC4peC5gOC4lOC4teC4ouC4p+C4q+C4peC4suC4ouC4o+C4suC4ouC4geC4suC4oyDigJQg4LiL4Li34LmJ4Lit4Lit4Lit4LiZ4LmE4Lil4LiZ4LmM',
  '4LiX4Li14LmA4LiU4Li14Lii4Lin4LmE4LiU4LmJ4LiC4Lit4LiH4Lir4Lil4Liy4Lii4Lit4Lii4LmI4Liy4LiHCgogICDguYDguIHguYfguJrguKXguIfguIrguLXguJXguYDguJvguYfguJnguILguYnguK3guITguKfguLLguKEg4Lia4Lij4Lij4LiX4Lix4LiU',
  '4Lil4Liw4Lij4Liy4Lii4LiB4Liy4LijICDguIrguLfguYjguK0gfCDguIjguLPguJnguKfguJkgfCDguKvguJnguYjguKfguKIgfCDguKPguLLguITguLLguJXguYjguK3guKvguJnguYjguKfguKIKICAgKOC4o+C4ueC4m+C5geC4muC4muC5gOC4lOC4teC4ouC4',
  'p+C4geC4seC4miBwYXJzZUxpbmVzXyDguJ3guLHguYjguIfguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYwg4oCUIOC5geC4geC5ieC4l+C4teC5iOC5hOC4q+C4meC4leC5ieC4reC4h+C5geC4geC5ieC5g+C4q+C5ieC4leC4o+C4h+C4geC4seC4mSkK',
  'ICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgpmdW5jdGlvbiBwYXJzZUxpbmVzVGV4dCh0ZXh0KXsKICByZXR1cm4gU3RyaW5nKHRleHQgPT0gbnVsbCA/ICcnIDogdGV4dCkuc3BsaXQoL1xy',
  'P1xuLykKICAgIC5tYXAoZnVuY3Rpb24ocyl7IHJldHVybiBzLnRyaW0oKTsgfSkuZmlsdGVyKEJvb2xlYW4pCiAgICAubWFwKGZ1bmN0aW9uKHJhdyl7CiAgICAgIHZhciBhID0gcmF3LnNwbGl0KCd8JykubWFwKGZ1bmN0aW9uKHgpeyByZXR1cm4geC50cmltKCk7',
  'IH0pOwogICAgICB2YXIgbmFtZSA9IGFbMF0gfHwgJycsIHF0eSA9IDEsIHVuaXQgPSAnJywgcHJpY2UgPSAwOwogICAgICBpZiAoYS5sZW5ndGggPj0gNCkgICAgICB7IHF0eSA9IG51bU9yKGFbMV0sIDEpOyB1bml0ID0gYVsyXSB8fCAnJzsgcHJpY2UgPSBudW1P',
  'cihhWzNdLCAwKTsgfQogICAgICBlbHNlIGlmIChhLmxlbmd0aCA9PT0gMyl7IHF0eSA9IG51bU9yKGFbMV0sIDEpOyBwcmljZSA9IG51bU9yKGFbMl0sIDApOyB9CiAgICAgIGVsc2UgaWYgKGEubGVuZ3RoID09PSAyKXsgcHJpY2UgPSBudW1PcihhWzFdLCAwKTsg',
  'fQogICAgICByZXR1cm4geyBuYW1lOiBuYW1lLCBxdHk6IHF0eSwgdW5pdDogdW5pdCwgcHJpY2U6IHByaWNlIH07CiAgICB9KTsKfQoKZnVuY3Rpb24gbnVtT3IodiwgZGZsdCl7CiAgdmFyIG4gPSBOdW1iZXIoU3RyaW5nKHYpLnJlcGxhY2UoLywvZywgJycpKTsK',
  'ICByZXR1cm4gaXNGaW5pdGUobikgPyBuIDogZGZsdDsKfQoKZnVuY3Rpb24gZm9ybWF0TGluZXNUZXh0KGxpc3QpewogIHJldHVybiAobGlzdCB8fCBbXSkKICAgIC5maWx0ZXIoZnVuY3Rpb24obCl7IHJldHVybiBTdHJpbmcobC5uYW1lIHx8ICcnKS50cmltKCkg',
  'fHwgTnVtYmVyKGwucHJpY2UpOyB9KQogICAgLm1hcChmdW5jdGlvbihsKXsKICAgICAgcmV0dXJuIFtTdHJpbmcobC5uYW1lIHx8ICcnKS5yZXBsYWNlKC9cfC9nLCAnLycpLAogICAgICAgICAgICAgIGwucXR5IHx8IDEsCiAgICAgICAgICAgICAgU3RyaW5nKGwu',
  'dW5pdCB8fCAnJykucmVwbGFjZSgvXHwvZywgJy8nKSwKICAgICAgICAgICAgICBsLnByaWNlIHx8IDBdLmpvaW4oJyB8ICcpOwogICAgfSkuam9pbignXG4nKTsKfQoKZnVuY3Rpb24gbGluZVRvdGFsKGwpeyByZXR1cm4gKE51bWJlcihsLnF0eSkgfHwgMCkgKiAo',
  'TnVtYmVyKGwucHJpY2UpIHx8IDApOyB9CmZ1bmN0aW9uIGxpbmVzU3VtKCl7IHJldHVybiAoRk9STS5saW5lcyB8fCBbXSkucmVkdWNlKGZ1bmN0aW9uKGEsIGwpeyByZXR1cm4gYSArIGxpbmVUb3RhbChsKTsgfSwgMCk7IH0KCmZ1bmN0aW9uIGxpbmVzVGFibGVI',
  'dG1sKCl7CiAgdmFyIHJvd3MgPSAoRk9STS5saW5lcyB8fCBbXSkubWFwKGZ1bmN0aW9uKGwsIGkpewogICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJsaW5lLXJvdyI+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgcGxhY2Vob2xkZXI9IuC4iuC4t+C5iOC4reC4',
  'quC4tOC4meC4hOC5ieC4siIgdmFsdWU9IicgKyBlc2MobC5uYW1lIHx8ICcnKSArICciICcgKwogICAgICAgICdvbmlucHV0PSJzZXRMaW5lKCcgKyBpICsgJyxcJ25hbWVcJyx0aGlzLnZhbHVlKSI+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCBudW0iIHR5',
  'cGU9Im51bWJlciIgc3RlcD0iYW55IiBpbnB1dG1vZGU9ImRlY2ltYWwiIHBsYWNlaG9sZGVyPSLguIjguLPguJnguKfguJkiICcgKwogICAgICAgICd2YWx1ZT0iJyArIChsLnF0eSA9PSBudWxsID8gJycgOiBlc2MobC5xdHkpKSArICciIG9uaW5wdXQ9InNldExp',
  'bmUoJyArIGkgKyAnLFwncXR5XCcsdGhpcy52YWx1ZSkiPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIHBsYWNlaG9sZGVyPSLguKvguJnguYjguKfguKIiIHZhbHVlPSInICsgZXNjKGwudW5pdCB8fCAnJykgKyAnIiAnICsKICAgICAgICAnb25pbnB1dD0i',
  'c2V0TGluZSgnICsgaSArICcsXCd1bml0XCcsdGhpcy52YWx1ZSkiPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAgbnVtIiB0eXBlPSJudW1iZXIiIHN0ZXA9ImFueSIgaW5wdXRtb2RlPSJkZWNpbWFsIiBwbGFjZWhvbGRlcj0i4Lij4Liy4LiE4LiyL+C4q+C4',
  'meC5iOC4p+C4oiIgJyArCiAgICAgICAgJ3ZhbHVlPSInICsgKGwucHJpY2UgPT0gbnVsbCA/ICcnIDogZXNjKGwucHJpY2UpKSArICciIG9uaW5wdXQ9InNldExpbmUoJyArIGkgKyAnLFwncHJpY2VcJyx0aGlzLnZhbHVlKSI+JyArCiAgICAgICc8ZGl2IGNsYXNz',
  'PSJsaW5lLXN1bSI+JyArIG1vbmV5KGxpbmVUb3RhbChsKSwgMikgKyAnPC9kaXY+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSBkZ3IiIHRpdGxlPSLguYDguK3guLLguKPguLLguKLguIHguLLguKPguJnguLXguYnguK3guK3g',
  'uIEiIG9uY2xpY2s9ImRlbExpbmUoJyArIGkgKyAnKSI+w5c8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nOwogIH0pLmpvaW4oJycpOwoKICByZXR1cm4gJzxkaXYgY2xhc3M9ImxpbmUtaGVhZCI+JyArCiAgICAgICc8c3Bhbj7guIrguLfguYjguK3guKrguLTguJng',
  'uITguYnguLI8L3NwYW4+PHNwYW4gY2xhc3M9Im51bSI+4LiI4Liz4LiZ4Lin4LiZPC9zcGFuPjxzcGFuPuC4q+C4meC5iOC4p+C4ojwvc3Bhbj4nICsKICAgICAgJzxzcGFuIGNsYXNzPSJudW0iPuC4o+C4suC4hOC4si/guKvguJnguYjguKfguKI8L3NwYW4+PHNw',
  'YW4gY2xhc3M9Im51bSI+4Lij4Lin4LihPC9zcGFuPjxzcGFuPjwvc3Bhbj4nICsKICAgICc8L2Rpdj4nICsKICAgIChyb3dzIHx8ICc8ZGl2IGNsYXNzPSJoaW50IiBzdHlsZT0icGFkZGluZzo4cHggMnB4Ij7guKLguLHguIfguYTguKHguYjguKHguLXguKPguLLg',
  'uKLguIHguLLguKMg4oCUIOC4geC4lCDigJzguYDguJ7guLTguYjguKHguKPguLLguKLguIHguLLguKPigJ0g4LmA4Lie4Li34LmI4Lit4LmD4Liq4LmI4Liq4Li04LiZ4LiE4LmJ4Liy4LiX4Li14Lil4Liw4Lit4Lii4LmI4Liy4LiHPC9kaXY+JykgKwogICAgJzxk',
  'aXYgY2xhc3M9InJvdyBtdDgiPicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImFkZExpbmUoKSI+KyDguYDguJ7guLTguYjguKHguKPguLLguKLguIHguLLguKM8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24g',
  'dHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJwYXN0ZUxpbmVzKCkiPvCfk4sg4Lin4Liy4LiH4LiX4Li14LmA4LiU4Li14Lii4Lin4Lir4Lil4Liy4Lii4Lij4Liy4Lii4LiB4Liy4LijPC9idXR0b24+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJs',
  'aW5lLXRvdGFsIj7guKPguKfguKHguITguYjguLLguKrguLTguJnguITguYnguLIgPGI+JyArIG1vbmV5KGxpbmVzU3VtKCksIDIpICsgJyDguL88L2I+PC9kaXY+JyArCiAgICAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gcmVkcmF3TGluZXMoKXsKICB2YXIgYm94ID0g',
  'ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfbGluZXMnKTsKICBpZiAoIWJveCkgcmV0dXJuOwogIGJveC5pbm5lckhUTUwgPSBsaW5lc1RhYmxlSHRtbCgpOwogIHJlY2FsY0JpbGwoKTsKfQoKZnVuY3Rpb24gc2V0TGluZShpLCBrZXksIHZhbCl7CiAgaWYgKCFG',
  'T1JNLmxpbmVzW2ldKSByZXR1cm47CiAgRk9STS5saW5lc1tpXVtrZXldID0gKGtleSA9PT0gJ3F0eScgfHwga2V5ID09PSAncHJpY2UnKSA/IG51bU9yKHZhbCwgMCkgOiB2YWw7CiAgLy8g4LmE4Lih4LmI4Lin4Liy4LiU4LmD4Lir4Lih4LmI4LiX4Lix4LmJ4LiH',
  '4LiV4Liy4Lij4Liy4LiHIOC5gOC4lOC4teC5i+C4ouC4p+C5gOC4hOC4reC4o+C5jOC5gOC4i+C4reC4o+C5jOC5gOC4lOC5ieC4h+C4reC4reC4geC4iOC4suC4geC4iuC5iOC4reC4h+C4l+C4teC5iOC4geC4s+C4peC4seC4h+C4nuC4tOC4oeC4nuC5jAogIHZh',
  'ciByb3cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjZl9saW5lcyAubGluZS1yb3cnKVtpXTsKICBpZiAocm93KSByb3cucXVlcnlTZWxlY3RvcignLmxpbmUtc3VtJykudGV4dENvbnRlbnQgPSBtb25leShsaW5lVG90YWwoRk9STS5saW5lc1tpXSksIDIp',
  'OwogIHZhciB0b3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZl9saW5lcyAubGluZS10b3RhbCBiJyk7CiAgaWYgKHRvdCkgdG90LnRleHRDb250ZW50ID0gbW9uZXkobGluZXNTdW0oKSwgMikgKyAnIOC4vyc7CiAgcmVjYWxjQmlsbCgpOwp9CgpmdW5jdGlv',
  'biBhZGRMaW5lKCl7CiAgRk9STS5saW5lcy5wdXNoKHsgbmFtZTogJycsIHF0eTogMSwgdW5pdDogJycsIHByaWNlOiAwIH0pOwogIHJlZHJhd0xpbmVzKCk7CiAgdmFyIGlucHV0cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNmX2xpbmVzIC5saW5lLXJv',
  'dyAuaW5wJyk7CiAgaWYgKGlucHV0cy5sZW5ndGgpIGlucHV0c1soRk9STS5saW5lcy5sZW5ndGggLSAxKSAqIDRdLmZvY3VzKCk7Cn0KCmZ1bmN0aW9uIGRlbExpbmUoaSl7CiAgRk9STS5saW5lcy5zcGxpY2UoaSwgMSk7CiAgcmVkcmF3TGluZXMoKTsKfQoKLyoq',
  'CiAqIOC4p+C4suC4h+C4o+C4suC4ouC4geC4suC4o+C4iOC4suC4geC4q+C4meC5ieC4suC4hOC4s+C4quC4seC5iOC4h+C4i+C4t+C5ieC4reC4l+C4teC5gOC4lOC4teC4ouC4p+C4l+C4seC5ieC4h+C4geC5ieC4reC4mSDguYHguKXguYnguKfguYPguKvguYng',
  'uKPguLDguJrguJrguYHguKLguIHguJrguKPguKPguJfguLHguJTguYPguKvguYkKICoKICog4LiX4Liz4LmA4Lib4LmH4LiZ4LiK4LmI4Lit4LiH4Lie4Lix4Lia4LmA4LiB4LmH4Lia4Lit4Lii4Li54LmI4LmD4LiZ4Lif4Lit4Lij4LmM4Lih4LmA4LiU4Li04Lih',
  'IOC5hOC4oeC5iOC5gOC4m+C4tOC4lOC4q+C4meC5ieC4suC4leC5iOC4suC4h+C4i+C5ieC4reC4mQogKiDguYDguJ7guKPguLLguLAgb3Blbk1vZGFsKCkg4LmA4LiC4Li14Lii4LiZ4LiX4Lix4Lia4Lir4LiZ4LmJ4Liy4LiV4LmI4Liy4LiH4LmA4LiU4Li04Lih',
  'IOC4luC5ieC4suC5gOC4m+C4tOC4lOC4i+C5ieC4reC4meC4n+C4reC4o+C5jOC4oeC4l+C4teC5iOC4geC4o+C4reC4geC4hOC5ieC4suC4h+C5hOC4p+C5ieC4iOC4sOC4q+C4suC4ouC4l+C4seC5ieC4h+C5g+C4mgogKi8KZnVuY3Rpb24gcGFzdGVMaW5lcygp',
  'ewogIHZhciBib3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFzdGVXcmFwJyk7CiAgaWYgKGJveCkgeyBib3guaGlkZGVuID0gIWJveC5oaWRkZW47IGlmICghYm94LmhpZGRlbikgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Bhc3RlQm94JykuZm9jdXMo',
  'KTsgcmV0dXJuOyB9CgogIHZhciBob3N0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfbGluZXMnKTsKICBpZiAoIWhvc3QpIHJldHVybjsKICB2YXIgd3JhcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogIHdyYXAuaWQgPSAncGFzdGVXcmFw',
  'JzsKICB3cmFwLmNsYXNzTmFtZSA9ICdtdDgnOwogIHdyYXAuaW5uZXJIVE1MID0KICAgICc8dGV4dGFyZWEgY2xhc3M9InRhIiBpZD0icGFzdGVCb3giIHN0eWxlPSJtaW4taGVpZ2h0OjEyMHB4IiAnICsKICAgICAgJ3BsYWNlaG9sZGVyPSLguJvguLHguYrguKHg',
  'uJnguYnguLMgNzUwVyB8IDEgfCDguYDguITguKPguLfguYjguK3guIcgfCA0MjUwJiMxMDvguKrguLLguKLguYTguJ8gVkFGIDJ4MS41IHwgMjAgfCDguYDguKHguJXguKMgfCAxNy41JiMxMDvguYDguJfguJvguJ7guLHguJnguKrguLLguKLguYTguJ8gNDUiPjwv',
  'dGV4dGFyZWE+JyArCiAgICAnPGRpdiBjbGFzcz0iaGludCBtdDgiPuC4hOC4seC5iOC4meC4lOC5ieC4p+C4oiA8Yj58PC9iPiDguJXguLLguKHguKXguLPguJTguLHguJog4LiK4Li34LmI4LitIMK3IOC4iOC4s+C4meC4p+C4mSDCtyDguKvguJnguYjguKfguKIg',
  'wrcg4Lij4Liy4LiE4Liy4LiV4LmI4Lit4Lir4LiZ4LmI4Lin4LiiPGJyPicgKwogICAgICAn4LiW4LmJ4Liy4Lin4Liy4LiH4Lih4Liy4LmA4Lib4LmH4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiY4Lij4Lij4Lih4LiU4LiyIOC4o+C4sOC4muC4muC4iOC4sOC4',
  'nuC4ouC4suC4ouC4suC4oeC5geC4ouC4geC4iuC4t+C5iOC4reC4geC4seC4muC4o+C4suC4hOC4suC5g+C4q+C5ieC5gOC4reC4hzwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InJvdyBtdDgiPicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNz',
  'PSJidG4gc20gcHJpIiBvbmNsaWNrPSJhcHBseVBhc3RlZExpbmVzKCkiPuC5gOC4nuC4tOC5iOC4oeC5gOC4guC5ieC4suC4o+C4suC4ouC4geC4suC4ozwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xp',
  'Y2s9ImRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwncGFzdGVXcmFwXCcpLmhpZGRlbj10cnVlIj7guJvguLTguJQ8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nOwogIGhvc3QuYXBwZW5kQ2hpbGQod3JhcCk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Bhc3Rl',
  'Qm94JykuZm9jdXMoKTsKfQoKZnVuY3Rpb24gYXBwbHlQYXN0ZWRMaW5lcygpewogIHZhciB0ZXh0ID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXN0ZUJveCcpIHx8IHt9KS52YWx1ZSB8fCAnJzsKICB2YXIgYWRkZWQgPSB0ZXh0LnNwbGl0KC9ccj9cbi8p',
  'Lm1hcChmdW5jdGlvbihzKXsgcmV0dXJuIHMudHJpbSgpOyB9KS5maWx0ZXIoQm9vbGVhbikubWFwKGZ1bmN0aW9uKHJhdyl7CiAgICBpZiAocmF3LmluZGV4T2YoJ3wnKSA+PSAwKSByZXR1cm4gcGFyc2VMaW5lc1RleHQocmF3KVswXTsKICAgIC8vIOC5hOC4oeC5',
  'iOC4oeC4tSB8IOKAlCDguYDguJTguLLguIjguLLguIHguJXguLHguKfguYDguKXguILguJfguYnguLLguKLguJrguKPguKPguJfguLHguJTguKfguYjguLLguYDguJvguYfguJnguKPguLLguITguLIKICAgIHZhciBtID0gcmF3Lm1hdGNoKC9eKC4qPylbXHM6eMOX',
  'XSooW1xkLF0rKD86XC5cZCspPylccyooPzrguJrguLLguJd84Li/KT8kLyk7CiAgICBpZiAobSAmJiBtWzFdLnRyaW0oKSkgcmV0dXJuIHsgbmFtZTogbVsxXS50cmltKCksIHF0eTogMSwgdW5pdDogJycsIHByaWNlOiBudW1PcihtWzJdLCAwKSB9OwogICAgcmV0',
  'dXJuIHsgbmFtZTogcmF3LCBxdHk6IDEsIHVuaXQ6ICcnLCBwcmljZTogMCB9OwogIH0pLmZpbHRlcihCb29sZWFuKTsKCiAgaWYgKCFhZGRlZC5sZW5ndGgpIHJldHVybiB0b2FzdCgn4LmE4Lih4LmI4Lie4Lia4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4Lit',
  '4LmI4Liy4LiZ4LmE4LiU4LmJJywgJ2VycicpOwogIEZPUk0ubGluZXMgPSAoRk9STS5saW5lcyB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uKGwpeyByZXR1cm4gU3RyaW5nKGwubmFtZSB8fCAnJykudHJpbSgpOyB9KS5jb25jYXQoYWRkZWQpOwogIHJlZHJhd0xpbmVz',
  'KCk7ICAgLy8g4Lin4Liy4LiU4LmD4Lir4Lih4LmI4LmB4Lil4LmJ4Lin4LiK4LmI4Lit4LiH4Lin4Liy4LiH4LiI4Liw4Lir4Liy4Lii4LmE4Lib4LmA4Lit4LiHIOC5gOC4nuC4o+C4suC4sOC4reC4ouC4ueC5iOC4guC5ieC4suC4h+C5g+C4mSBmX2xpbmVzCiAg',
  'dG9hc3QoJ+C5gOC4nuC4tOC5iOC4oeC5g+C4q+C5iSAnICsgYWRkZWQubGVuZ3RoICsgJyDguKPguLLguKLguIHguLLguKMg4oCUIOC4leC4o+C4p+C4iOC4leC4seC4p+C5gOC4peC4guC4reC4teC4geC4hOC4o+C4seC5ieC4h+C4geC5iOC4reC4meC4muC4seC4',
  'meC4l+C4tuC4gScsICdvaycpOwp9CgovKioKICog4LiE4Li04LiU4Lii4Lit4LiU4Lij4Lin4Lih4LiC4Lit4LiH4Lia4Li04LilID0g4LiE4LmI4Liy4Liq4Li04LiZ4LiE4LmJ4LiyICsg4LiE4LmI4Liy4Liq4LmI4LiHIOKIkiDguKrguYjguKfguJnguKXguJQg',
  '4LmB4Lil4LmJ4Lin4LmA4LiV4Li04Lih4Lil4LiH4LiK4LmI4Lit4LiHICLguKPguLLguITguLLguKPguKfguKEiCiAqIOC5g+C4q+C5ieC4leC4o+C4h+C4geC4seC4muC4l+C4teC5iOC4neC4seC5iOC4h+C5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5',
  'jOC4hOC4tOC4lOC4leC4reC4meC4muC4seC4meC4l+C4tuC4gSDguIjguLDguYTguJTguYnguYTguKHguYjguKHguLXguJfguLLguIfguJfguLXguYjguJXguLHguKfguYDguKXguILguKrguK3guIfguJ3guLHguYjguIfguYTguKHguYjguJXguKPguIfguIHguLHg',
  'uJkKICovCmZ1bmN0aW9uIHJlY2FsY0JpbGwoKXsKICBpZiAoIWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2xpbmVzJykpIHJldHVybjsKICB2YXIgcHJpY2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9wcmljZScpOwogIGlmICghcHJpY2UpIHJldHVy',
  'bjsKICB2YXIgbiA9IChGT1JNLmxpbmVzIHx8IFtdKS5maWx0ZXIoZnVuY3Rpb24obCl7IHJldHVybiBTdHJpbmcobC5uYW1lIHx8ICcnKS50cmltKCkgfHwgTnVtYmVyKGwucHJpY2UpOyB9KS5sZW5ndGg7CiAgaWYgKCFuKSB7IHByaWNlLnJlYWRPbmx5ID0gZmFs',
  'c2U7IHByaWNlLnN0eWxlLmJhY2tncm91bmQgPSAnJzsgcmV0dXJuOyB9CgogIHZhciBzaGlwID0gTnVtYmVyKChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9zaGlwcGluZycpIHx8IHt9KS52YWx1ZSkgfHwgMDsKICB2YXIgZGlzYyA9IE51bWJlcigoZG9jdW1l',
  'bnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfZGlzY291bnQnKSB8fCB7fSkudmFsdWUpIHx8IDA7CiAgcHJpY2UudmFsdWUgPSBNYXRoLnJvdW5kKChsaW5lc1N1bSgpICsgc2hpcCAtIGRpc2MpICogMTAwKSAvIDEwMDsKICBwcmljZS5yZWFkT25seSA9IHRydWU7ICAgICAg',
  'ICAgICAgICAgICAgICAgICAvLyDguKHguLXguKPguLLguKLguIHguLLguKPguKLguYjguK3guKLguYHguKXguYnguKcg4Lir4LmJ4Liy4Lih4Lie4Li04Lih4Lie4LmM4LiX4Lix4Lia4LmD4Lir4LmJ4LmE4Lih4LmI4LiV4Lij4LiH4LiB4Lix4LiZCiAgcHJpY2Uu',
  'c3R5bGUuYmFja2dyb3VuZCA9ICd2YXIoLS1zdXJmYWNlLTIpJzsKICBwcmljZS50aXRsZSA9ICfguITguLTguJTguIjguLLguIHguKPguLLguKLguIHguLLguKPguYPguJnguJrguLTguKXguYPguKvguYnguK3guLHguJXguYLguJnguKHguLHguJXguLQg4oCUIOC5',
  'geC4geC5ieC4l+C4teC5iOC4o+C4suC4ouC4geC4suC4o+C4ouC5iOC4reC4oiDguITguYjguLLguKrguYjguIcg4Lir4Lij4Li34Lit4Liq4LmI4Lin4LiZ4Lil4LiUJzsKCiAgdmFyIGhpbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmlsbEhpbnQnKTsK',
  'ICBpZiAoaGludCkgewogICAgaGludC5pbm5lckhUTUwgPSBuICsgJyDguKPguLLguKLguIHguLLguKMgwrcg4LiE4LmI4Liy4Liq4Li04LiZ4LiE4LmJ4LiyICcgKyBtb25leShsaW5lc1N1bSgpLCAyKSArCiAgICAgIChzaGlwID8gJyArIOC4hOC5iOC4suC4quC5',
  'iOC4hyAnICsgbW9uZXkoc2hpcCwgMikgOiAnJykgKwogICAgICAoZGlzYyA/ICcg4oiSIOC4quC5iOC4p+C4meC4peC4lCAnICsgbW9uZXkoZGlzYywgMikgOiAnJyk7CiAgfQp9CgovKiog4Lit4Lix4Lib4LmA4LiU4LiV4LiK4LmI4Lit4LiH4Lic4Lil4Lij4Lin',
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
  'KSArICcgwrcgJyArIE1hdGgucm91bmQoZi5zaXplLzEwMjQpICsgJyBLQjwvc3Bhbj4nOwogIH0pLmpvaW4oJyAnKTsKCiAgdmFyIHNsb3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCArICdfb2NyJyk7CiAgaWYgKCFzbG90KSByZXR1cm47CiAgc2xvdC5p',
  'bm5lckhUTUwgPSAnJzsKICBpZiAoIW9jclVzYWJsZSgpIHx8ICFmaXJzdFJlYWRhYmxlKGZpbGVzKSkgcmV0dXJuOwoKICB2YXIgbW9kZSA9IChTLmJvb3Quc2V0dGluZ3MgJiYgUy5ib290LnNldHRpbmdzLm9jckF1dG9maWxsKSB8fCAn4LiW4Liy4Lih4LiB4LmI',
  '4Lit4LiZ4LmA4LiV4Li04LihJzsKICBpZiAobW9kZSA9PT0gJ+C5hOC4oeC5iOC5gOC4leC4tOC4oScpIHJldHVybjsKICBpZiAobW9kZSA9PT0gJ+C5gOC4leC4tOC4oeC5g+C4q+C5ieC5gOC4peC4oicpIHJldHVybiBydW5PY3IoaWQsIHRydWUpOwoKICBzbG90',
  'LmlubmVySFRNTCA9CiAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20gbXQ4IiBvbmNsaWNrPSJydW5PY3IoXCcnICsgaWQgKyAnXCcpIj4nICsKICAgICfwn5SOIOC4reC5iOC4suC4meC4guC5ieC4reC4hOC4p+C4suC4oeC4iOC4suC4geC4',
  'o+C4ueC4m+C4meC4teC5iSDguYHguKXguYnguKfguIrguYjguKfguKLguIHguKPguK3guIHguYPguKvguYk8L2J1dHRvbj4nOwp9CgovKiog4Lit4LmI4Liy4LiZ4LiE4LmI4Liy4LiI4Liy4LiB4Lif4Lit4Lij4LmM4LihICsg4Lit4Lix4Lib4LmC4Lir4Lil4LiU',
  '4LmE4Lif4Lil4LmM4LmD4Lir4Lih4LmIIOC5geC4peC5ieC4p+C4hOC4t+C4mSBvYmplY3Qg4Lie4Lij4LmJ4Lit4Lih4Lia4Lix4LiZ4LiX4Li24LiBICovCmZ1bmN0aW9uIHJlYWRGb3JtKHNwZWNzLCBidWNrZXQpewogIHZhciBvdXQgPSB7fTsKICB2YXIgdXBs',
  'b2FkcyA9IFtdOwoKICBzcGVjcy5mb3JFYWNoKGZ1bmN0aW9uKGYpewogICAgaWYgKGYudHlwZSA9PT0gJ2NvbXB1dGVkJykgcmV0dXJuOyAgICAgICAgICAvLyDguIrguYjguK3guIfguITguLPguJnguKfguJMg4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4Lia4Lix4LiZ',
  '4LiX4Li24LiBCiAgICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl8nICsgZi5rZXkpOwogICAgaWYgKCFlbCkgcmV0dXJuOwogICAgaWYgKGYudHlwZSA9PT0gJ2ZpbGVzJykgewogICAgICB1cGxvYWRzLnB1c2goCiAgICAgICAgdXBsb2FkRmls',
  'ZXMoZWwsIGJ1Y2tldCkudGhlbihmdW5jdGlvbihyZWZzKXsKICAgICAgICAgIG91dFtmLmtleV0gPSAoRk9STS5rZWVwW2Yua2V5XSB8fCBbXSkuY29uY2F0KHJlZnMubWFwKGZ1bmN0aW9uKHIpeyByZXR1cm4gci51cmw7IH0pKTsKICAgICAgICB9KQogICAgICAp',
  'OwogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICd0b2RvJykgewogICAgICBvdXRbZi5rZXldID0gZm9ybWF0VG9kb1RleHQoRk9STS50b2RvKTsKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnbGluZXMnKSB7CiAgICAgIG91dFtmLmtleV0gPSBmb3JtYXRMaW5l',
  'c1RleHQoRk9STS5saW5lcyk7CiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ251bWJlcicgfHwgZi50eXBlID09PSAnbW9uZXknKSB7CiAgICAgIG91dFtmLmtleV0gPSBlbC52YWx1ZSA9PT0gJycgPyBudWxsIDogTnVtYmVyKGVsLnZhbHVlKTsKICAgIH0gZWxz',
  'ZSB7CiAgICAgIG91dFtmLmtleV0gPSBlbC52YWx1ZTsKICAgIH0KICB9KTsKCiAgcmV0dXJuIFByb21pc2UuYWxsKHVwbG9hZHMpLnRoZW4oZnVuY3Rpb24oKXsgcmV0dXJuIG91dDsgfSk7Cn0KCi8qKiDguYLguITguKPguIfguJ/guK3guKPguYzguKHguKHguLLg',
  'uJXguKPguJDguLLguJk6IOC5gOC4m+C4tOC4lCBtb2RhbCwg4LiI4Lix4LiU4LiB4Liy4Lij4Lib4Li44LmI4Lih4Lia4Lix4LiZ4LiX4Li24LiBLCDguKPguLXguYLguKvguKXguJTguKvguJnguYnguLIgKi8KZnVuY3Rpb24gb3BlbkZvcm0ob3B0cyl7CiAgdmFy',
  'IHJlYyA9IG9wdHMucmVjb3JkIHx8IHt9OwogIEZPUk0ub2NyID0gb3B0cy5vY3IgfHwgbnVsbDsKICBGT1JNLnJlYyA9IHJlYy5pZCA/IHJlYyA6IG51bGw7ICAgLy8g4LiI4Liz4LmE4Lin4LmJ4Lin4LmI4Liy4LiB4Liz4Lil4Lix4LiH4LmB4LiB4LmJ4LiC4Lit',
  '4LiH4LmA4LiU4Li04LihIOC4q+C4o+C4t+C4reC4geC4s+C4peC4seC4h+C5gOC4nuC4tOC5iOC4oeC5g+C4q+C4oeC5iAogIG9wZW5Nb2RhbChvcHRzLnRpdGxlLAogICAgZmllbGRzSHRtbChvcHRzLmZpZWxkcywgcmVjKSwKICAgICc8YnV0dG9uIGNsYXNzPSJi',
  'dG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lii4LiB4LmA4Lil4Li04LiBPC9idXR0b24+JyArCiAgICAocmVjLmlkICYmIG9wdHMub25EZWxldGUgPyAnPGJ1dHRvbiBjbGFzcz0iYnRuIGRnciIgaWQ9ImZEZWwiPuC4peC4muC4o+C4suC4ouC4geC4suC4o+C4',
  'meC4teC5iTwvYnV0dG9uPicgOiAnJykgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIGlkPSJmU2F2ZSI+JyArIChyZWMuaWQgPyAn4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4LmB4LiB4LmJ4LmE4LiCJyA6ICfguJrguLHguJnguJfguLbguIEnKSAr',
  'ICc8L2J1dHRvbj4nLAogICAgb3B0cy53aWRlKTsKCiAgaWYgKHJlYy5pZCAmJiBvcHRzLm9uRGVsZXRlKSB7CiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZkRlbCcpLm9uY2xpY2sgPSBmdW5jdGlvbigpeyBjbG9zZU1vZGFsKCk7IG9wdHMub25EZWxldGUo',
  'cmVjLmlkKTsgfTsKICB9CgogIHJlY2FsY1N1bXMoKTsKICByZWNhbGNCaWxsKCk7CgogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmU2F2ZScpLm9uY2xpY2sgPSBmdW5jdGlvbigpewogICAgdmFyIGJ0biA9IHRoaXM7CiAgICBidG4uZGlzYWJsZWQgPSB0cnVl',
  'OwogICAgYnRuLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDguIHguLPguKXguLHguIfguJrguLHguJnguJfguLbguIHigKYnOwoKICAgIHJlYWRGb3JtKG9wdHMuZmllbGRzLCBvcHRzLmJ1Y2tldCB8fCAnbWlzYycpLnRoZW4oZnVuY3Rp',
  'b24oZGF0YSl7CiAgICAgIHZhciBtaXNzaW5nID0gb3B0cy5maWVsZHMuZmlsdGVyKGZ1bmN0aW9uKGYpewogICAgICAgIHJldHVybiBmLnJlcXVpcmVkICYmIChkYXRhW2Yua2V5XSA9PSBudWxsIHx8IGRhdGFbZi5rZXldID09PSAnJyk7CiAgICAgIH0pOwogICAg',
  'ICBpZiAobWlzc2luZy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcign4LiB4Lij4Li44LiT4Liy4LiB4Lij4Lit4LiBOiAnICsgbWlzc2luZy5tYXAoZnVuY3Rpb24oZil7IHJldHVybiBmLmxhYmVsOyB9KS5qb2luKCcsICcpKTsKCiAgICAgIHZhciByZWNvcmQgPSBP',
  'YmplY3QuYXNzaWduKHt9LCBvcHRzLmJhc2UgfHwge30sIGRhdGEpOwogICAgICBpZiAocmVjLmlkKSByZWNvcmQuaWQgPSByZWMuaWQ7CiAgICAgIHJldHVybiBjYWxsQXBpKG9wdHMuYWN0aW9uLCBPYmplY3QuYXNzaWduKHsgcmVjb3JkOiByZWNvcmQgfSwgb3B0',
  'cy5leHRyYSB8fCB7fSkpOwogICAgfSkudGhlbihmdW5jdGlvbigpewogICAgICBjbG9zZU1vZGFsKCk7CiAgICAgIC8vIOC4leC4seC4p+C4muC4reC4geC4quC4luC4suC4meC4sOC4oeC4uOC4oeC4guC4p+C4suC4muC4meC4guC4tuC5ieC4mSAi4Lia4Lix4LiZ',
  '4LiX4Li24LiB4LmB4Lil4LmJ4LinIiDguYPguKvguYnguK3guKLguLnguYjguYHguKXguYnguKcg4LiI4Li24LiH4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LmA4LiU4LmJ4LiHIHRvYXN0IOC4i+C5ieC4swogICAgICAvLyDguYHguKXguYnguKfguIvguLTguIfguIHg',
  'uYzguYDguIfguLXguKLguJog4LmGIOC5hOC4oeC5iOC4peC5ieC4suC4h+C4q+C4meC5ieC4suC5geC4peC4sOC5hOC4oeC5iOC5gOC4lOC5ieC4h+C4geC4peC4seC4muC5hOC4m+C4muC4meC4quC4uOC4lAogICAgICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAg',
  'ICAgIC8vIOC4n+C4reC4o+C5jOC4oeC4l+C4teC5iOC5gOC4m+C4tOC4lOC4oeC4suC4iOC4suC4geC4q+C4meC5ieC4suC4leC5iOC4suC4h+C4reC4t+C5iOC4mSAo4LmA4LiK4LmI4LiZIOC4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4meC5g+C4meC4q+C4meC5',
  'ieC4suC4q+C5ieC4reC4hykg4LiC4Lit4LmA4Lib4Li04LiU4Lir4LiZ4LmJ4Liy4LiZ4Lix4LmJ4LiZ4LiB4Lil4Lix4Lia4LiE4Li34LiZCiAgICAgIGlmICh0eXBlb2Ygb3B0cy5hZnRlciA9PT0gJ2Z1bmN0aW9uJykgb3B0cy5hZnRlcigpOwogICAgfSkuY2F0',
  'Y2goZnVuY3Rpb24oZSl7CiAgICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlOwogICAgICBidG4udGV4dENvbnRlbnQgPSByZWMuaWQgPyAn4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4LmB4LiB4LmJ4LmE4LiCJyA6ICfguJrguLHguJnguJfguLbguIEnOwogICAg',
  'ICB0b2FzdChlLm1lc3NhZ2UgfHwgZSwgJ2VycicpOwogICAgfSk7CiAgfTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4reC5iOC4suC4meC4guC5ieC4reC4hOC4p+C4suC4oeC4',
  'iOC4suC4geC4o+C4ueC4myAoT0NSKSDguYHguKXguYnguKfguIrguYjguKfguKLguIHguKPguK3guIHguJ/guK3guKPguYzguKEKCiAgIOC4l+C4uOC4geC4hOC5iOC4suC4l+C4teC5iOC5hOC4lOC5ieC5gOC4m+C5h+C4meC5geC4hOC5iOC4guC5ieC4reC5gOC4',
  'quC4meC4rSDguJzguLnguYnguYPguIrguYnguIHguJTguYDguJXguLTguKHguYDguK3guIfguJfguLXguKXguLDguIrguYjguK3guIfguKvguKPguLfguK3guYDguJXguLTguKHguJfguLHguYnguIfguKvguKHguJTguIHguYfguYTguJTguYkKICAg4LmB4Lil4Liw',
  '4LmB4LiB4LmJ4LmE4LiC4LiV4LmI4Lit4LmE4LiU4LmJ4LmA4Liq4Lih4LitIOC5gOC4nuC4o+C4suC4sOC4leC4seC4p+C4reC5iOC4suC4meC4nuC4peC4suC4lOC5hOC4lOC5iSDguYLguJTguKLguYDguInguJ7guLLguLDguKXguLLguKLguKHguLfguK3guIHg',
  'uLHguJrguKPguLnguJvguYDguK3guLXguKLguIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgp2YXIgT0NSX01BWCA9IDggKiAxMDI0ICogMTAyNDsgICAvLyDguKPguLnguJvguYPguKvg',
  'uI3guYjguIHguKfguYjguLLguJnguLXguYnguKrguYjguIfguYTguJvguK3guYjguLLguJnguYHguKXguYnguKfguKHguLHguIHguKvguKHguJTguYDguKfguKXguLIKCmZ1bmN0aW9uIG9jclVzYWJsZSgpewogIHJldHVybiAhIShGT1JNLm9jciAmJiBTLmJvb3Qg',
  'JiYgUy5ib290LnNldHRpbmdzICYmIFMuYm9vdC5zZXR0aW5ncy5vY3JFbmFibGVkKTsKfQoKLyoqIOC4o+C4ueC4m+C5geC4o+C4geC4l+C4teC5iOC4nuC4reC4reC5iOC4suC4meC5hOC4lOC5iSAo4LiC4LmJ4Liy4Lih4LmE4Lif4Lil4LmM4LmD4Lir4LiN4LmI',
  '4LmA4LiB4Li04LiZ4LmB4Lil4Liw4LmE4Lif4Lil4LmM4LiX4Li14LmI4LmE4Lih4LmI4LmD4LiK4LmI4Lij4Li54LibL1BERikgKi8KZnVuY3Rpb24gZmlyc3RSZWFkYWJsZShmaWxlcyl7CiAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWxlcy5sZW5ndGg7IGkrKykg',
  'ewogICAgdmFyIGYgPSBmaWxlc1tpXTsKICAgIGlmIChmLnNpemUgPD0gT0NSX01BWCAmJiAvXmltYWdlXC98cGRmJC8udGVzdChmLnR5cGUgfHwgJycpKSByZXR1cm4gZjsKICB9CiAgcmV0dXJuIG51bGw7Cn0KCi8qKgogKiBAcGFyYW0ge3N0cmluZ30gaWQgIGlk',
  'IOC4guC4reC4h+C4iuC5iOC4reC4h+C5geC4meC4muC5hOC4n+C4peC5jCDguYDguIrguYjguJkgZl9zbGlwcwogKiBAcGFyYW0ge2Jvb2xlYW59IGF1dG8gdHJ1ZSA9IOC5gOC4leC4tOC4oeC4iuC5iOC4reC4h+C4l+C4teC5iOC4ouC4seC4h+C4p+C5iOC4suC4',
  'h+C5g+C4q+C5ieC5gOC4peC4ouC5guC4lOC4ouC5hOC4oeC5iOC4leC5ieC4reC4h+C4geC4lAogKi8KZnVuY3Rpb24gcnVuT2NyKGlkLCBhdXRvKXsKICB2YXIgaW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7CiAgdmFyIHNsb3QgPSBkb2N1bWVu',
  'dC5nZXRFbGVtZW50QnlJZChpZCArICdfb2NyJyk7CiAgaWYgKCFpbnB1dCB8fCAhc2xvdCkgcmV0dXJuOwoKICB2YXIgZmlsZSA9IGZpcnN0UmVhZGFibGUoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoaW5wdXQuZmlsZXMgfHwgW10pKTsKICBpZiAoIWZpbGUp',
  'IHsgc2xvdC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz0iaGludCBtdDgiPuC5hOC4oeC5iOC4oeC4teC4o+C4ueC4m+C4l+C4teC5iOC4reC5iOC4suC4meC5hOC4lOC5iSAo4Lij4Lit4LiH4Lij4Lix4Lia4Lij4Li54Lib4Lig4Liy4Lie4LmB4Lil4LiwIFBERiDg',
  'uYTguKHguYjguYDguIHguLTguJkgOCBNQik8L2Rpdj4nOyByZXR1cm47IH0KCiAgc2xvdC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz0ib2NyLWJveCI+PGRpdiBjbGFzcz0iaGQiPjxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C4reC5',
  'iOC4suC4meC4guC5ieC4reC4hOC4p+C4suC4oeC4iOC4suC4gSAnICsKICAgICAgICAgICAgICAgICAgIGVzYyhmaWxlLm5hbWUuc2xpY2UoMCwgMjgpKSArICfigKY8L2Rpdj48L2Rpdj4nOwoKICByZWFkQXNEYXRhVXJsKGZpbGUpLnRoZW4oZnVuY3Rpb24ocCl7',
  'CiAgICByZXR1cm4gY2FsbEFwaSgnb2NyLnJlYWQnLCB7IGRhdGFVcmw6IHAuZGF0YVVybCwgbWltZVR5cGU6IHAubWltZVR5cGUgfSk7CiAgfSkudGhlbihmdW5jdGlvbihyKXsKICAgIHNsb3QuaW5uZXJIVE1MID0gb2NyQm94SHRtbChpZCwgcik7CiAgICBPQ1Jf',
  'TEFTVFtpZF0gPSByOwogICAgaWYgKGF1dG8pIHsKICAgICAgdmFyIG4gPSBvY3JBcHBseUFsbChpZCwgdHJ1ZSk7CiAgICAgIHRvYXN0KG4gPyAn4Lit4LmI4Liy4LiZ4Lij4Li54Lib4LmB4Lil4LmJ4LinIOC5gOC4leC4tOC4oeC5g+C4q+C5iSAnICsgbiArICcg',
  '4LiK4LmI4Lit4LiHIOKAlCDguJXguKPguKfguIjguJTguLnguIHguYjguK3guJnguJrguLHguJnguJfguLbguIHguJnguLAnIDogJ+C4reC5iOC4suC4meC4o+C4ueC4m+C5geC4peC5ieC4pyDguYHguJXguYjguKLguLHguIfguIjguLHguJrguITguYjguLLguJfg',
  'uLXguYjguYPguIrguYnguYTguJTguYnguYTguKHguYjguYTguJTguYknLCBuID8gJ29rJyA6ICcnKTsKICAgIH0KICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgIHNsb3QuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9Im9jci1ib3giPjxkaXYgY2xhc3M9ImhkIj7i',
  'mqDvuI8g4Lit4LmI4Liy4LiZ4Lij4Li54Lib4LmE4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIPC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJoaW50Ij4nICsgZXNjKGUubWVzc2FnZSB8fCBlKSArICc8L2Rpdj4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0',
  'dG9uIiBjbGFzcz0iYnRuIHNtIG10OCIgb25jbGljaz0icnVuT2NyKFwnJyArIGlkICsgJ1wnKSI+4Lil4Lit4LiH4Lit4Li14LiB4LiE4Lij4Lix4LmJ4LiHPC9idXR0b24+PC9kaXY+JzsKICB9KTsKfQoKdmFyIE9DUl9MQVNUID0ge307CgovKiog4LiE4LmI4Liy',
  '4LiX4Li14LmI4Lit4LmI4Liy4LiZ4LmE4LiU4LmJIOC4hOC4ueC5iOC4geC4seC4muC4iuC5iOC4reC4h+C5g+C4meC4n+C4reC4o+C5jOC4oeC4l+C4teC5iOC4iOC4sOC5gOC4reC4suC5hOC4m+C5g+C4quC5iCAqLwpmdW5jdGlvbiBvY3JQYWlycyhyKXsKICB2',
  'YXIgbSA9IEZPUk0ub2NyIHx8IHt9OwogIHZhciBnID0gci5ndWVzcyB8fCB7fTsKICB2YXIgb3V0ID0gW107CiAgaWYgKG0uZGF0ZSAgICYmIGcuZGF0ZSkgICBvdXQucHVzaCh7IGZpZWxkOiBtLmRhdGUsICAgbGFiZWw6ICfguKfguLHguJnguJfguLXguYgnLCAg',
  'ICAgdmFsdWU6IGcuZGF0ZSwgICBzaG93OiB0aERhdGUoZy5kYXRlKSB9KTsKICBpZiAobS5hbW91bnQgJiYgZy5hbW91bnQpIG91dC5wdXNoKHsgZmllbGQ6IG0uYW1vdW50LCBsYWJlbDogJ+C4iOC4s+C4meC4p+C4meC5gOC4h+C4tOC4mScsICB2YWx1ZTogZy5h',
  'bW91bnQsIHNob3c6IGJhaHQoZy5hbW91bnQpIH0pOwogIGlmIChtLnZlbmRvciAmJiBnLnZlbmRvcikgb3V0LnB1c2goeyBmaWVsZDogbS52ZW5kb3IsIGxhYmVsOiAn4Lij4LmJ4Liy4LiZL+C4nOC4ueC5ieC4guC4suC4oicsIHZhbHVlOiBnLnZlbmRvciwgc2hv',
  'dzogZy52ZW5kb3IgfSk7CiAgaWYgKG0udGl0bGUgICYmIGcudGl0bGUpICBvdXQucHVzaCh7IGZpZWxkOiBtLnRpdGxlLCAgbGFiZWw6ICfguIrguLfguYjguK3guKPguLLguKLguIHguLLguKMnLCAgdmFsdWU6IGcudGl0bGUsICBzaG93OiBnLnRpdGxlIH0pOwog',
  'IGlmIChtLm5vdGUgICAmJiBnLnJlZikgICAgb3V0LnB1c2goeyBmaWVsZDogbS5ub3RlLCAgIGxhYmVsOiAn4LmA4Lil4LiC4Lit4LmJ4Liy4LiH4Lit4Li04LiHJywgIHZhbHVlOiAn4Lit4LmJ4Liy4LiH4Lit4Li04LiHICcgKyBnLnJlZiwgc2hvdzogZy5yZWYg',
  'fSk7CiAgLy8g4LmD4Lia4LmA4Liq4Lij4LmH4LiI4Lir4Lil4Liy4Lii4Lij4Liy4Lii4LiB4Liy4LijCiAgaWYgKGcuaXRlbXMgJiYgZy5pdGVtcy5sZW5ndGggPiAxKSB7CiAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfbGluZXMnKSkgewogICAg',
  'ICAvLyDguJ/guK3guKPguYzguKHguJnguLXguYnguKHguLXguJXguLLguKPguLLguIfguKPguLLguKLguIHguLLguKPguKLguYjguK3guKIg4oCUIOC5gOC4leC4tOC4oeC4peC4h+C4leC4suC4o+C4suC4h+C5gOC4peC4oiDguYTguJTguYnguJfguLHguYnguIfg',
  'uIrguLfguYjguK0g4LiI4Liz4LiZ4Lin4LiZIOC5geC4peC4sOC4o+C4suC4hOC4suC5geC4ouC4geC4geC4seC4mQogICAgICBvdXQucHVzaCh7IGZpZWxkOiAnX2xpbmVzJywgbGFiZWw6ICfguKPguLLguKLguIHguLLguKPguYPguJnguJrguLTguKUnLCB2YWx1',
  'ZTogZy5pdGVtcywKICAgICAgICAgICAgICAgICBzaG93OiAn4LmA4LiV4Li04LihICcgKyBnLml0ZW1zLmxlbmd0aCArICcg4Lij4Liy4Lii4LiB4Liy4Lij4Lil4LiH4LiV4Liy4Lij4Liy4LiHJywgbGluZXM6IHRydWUgfSk7CiAgICB9IGVsc2UgaWYgKG0udGl0',
  'bGUpIHsKICAgICAgdmFyIGxpbmVzID0gZy5pdGVtcy5tYXAoZnVuY3Rpb24oaXQsIGkpeyByZXR1cm4gKGkrMSkgKyAnLicgKyBpdC5uYW1lICsgJyAnICsgbW9uZXkoaXQucHJpY2UsIDIpICsgJyDguL8nOyB9KS5qb2luKCdcbicpOwogICAgICBvdXQucHVzaCh7',
  'IGZpZWxkOiBtLnRpdGxlLCBsYWJlbDogJ+C4l+C4uOC4geC4o+C4suC4ouC4geC4suC4oyAoJyArIGcuaXRlbXMubGVuZ3RoICsgJyknLCB2YWx1ZTogbGluZXMsCiAgICAgICAgICAgICAgICAgc2hvdzogZy5pdGVtcy5sZW5ndGggKyAnIOC4o+C4suC4ouC4geC4',
  'suC4o+C5g+C4meC5g+C4muC5gOC4quC4o+C5h+C4iCcsIG11bHRpOiB0cnVlIH0pOwogICAgfQogIH0KICByZXR1cm4gb3V0Owp9CgpmdW5jdGlvbiBvY3JCb3hIdG1sKGlkLCByKXsKICB2YXIgcGFpcnMgPSBvY3JQYWlycyhyKTsKICBpZiAoIXBhaXJzLmxlbmd0',
  'aCkgewogICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJvY3ItYm94Ij48ZGl2IGNsYXNzPSJoZCI+8J+UjiDguK3guYjguLLguJnguILguYnguK3guITguKfguLLguKHguYTguJTguYkg4LmB4LiV4LmI4Lii4Lix4LiH4LiI4Lix4Lia4LiE4LmI4Liy4LiX4Li14LmI4LmD',
  '4LiK4LmJ4LmE4LiU4LmJ4LmE4Lih4LmI4LmE4LiU4LmJJyArCiAgICAgICc8c3BhbiBjbGFzcz0ic3AiPjxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJvY3JUb2dnbGVSYXcoXCcnICsgaWQgKyAnXCcpIj7guJTguLnguILguYng',
  'uK3guITguKfguLLguKHguJfguLXguYjguK3guYjguLLguJnguYTguJTguYk8L2J1dHRvbj48L3NwYW4+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJvY3ItcmF3IiBpZD0iJyArIGlkICsgJ19yYXciIGhpZGRlbj4nICsgZXNjKHIudGV4dCB8fCAnKOC4p+C5',
  'iOC4suC4hyknKSArICc8L2Rpdj48L2Rpdj4nOwogIH0KICByZXR1cm4gJzxkaXYgY2xhc3M9Im9jci1ib3giPicgKwogICAgJzxkaXYgY2xhc3M9ImhkIj7wn5SOIOC4reC5iOC4suC4meC4iOC4suC4geC4o+C4ueC4m+C5hOC4lOC5ieC5geC4muC4muC4meC4teC5',
  'iSDigJQg4LiB4LiU4LmA4LiV4Li04Lih4LiK4LmI4Lit4LiH4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LiB4Liy4LijJyArCiAgICAgICc8c3BhbiBjbGFzcz0ic3AiPicgKwogICAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSBwcmkiIG9u',
  'Y2xpY2s9Im9jckFwcGx5QWxsKFwnJyArIGlkICsgJ1wnKSI+4LmA4LiV4Li04Lih4LiX4Lix4LmJ4LiH4Lir4Lih4LiUPC9idXR0b24+JyArCiAgICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJvY3JUb2dnbGVSYXco',
  'XCcnICsgaWQgKyAnXCcpIj7guILguYnguK3guITguKfguLLguKHguYDguJXguYfguKE8L2J1dHRvbj4nICsKICAgICAgJzwvc3Bhbj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJvY3ItaGl0cyI+JyArIHBhaXJzLm1hcChmdW5jdGlvbihwLCBpKXsKICAgICAg',
  'cmV0dXJuICc8ZGl2IGNsYXNzPSJvY3ItaGl0Ij4nICsKICAgICAgICAnPHNwYW4gY2xhc3M9ImsiPicgKyBlc2MocC5sYWJlbCkgKyAnPC9zcGFuPicgKwogICAgICAgICc8c3BhbiBjbGFzcz0idiIgdGl0bGU9IicgKyBlc2MocC5saW5lcyA/IHAuc2hvdyA6IFN0',
  'cmluZyhwLnZhbHVlKSkgKyAnIj4nICsgZXNjKHAuc2hvdykgKyAnPC9zcGFuPicgKwogICAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0ib2NyQXBwbHlPbmUoXCcnICsgaWQgKyAnXCcsJyArIGkgKyAnKSI+4LmA4LiV',
  '4Li04LihPC9idXR0b24+JyArCiAgICAgICc8L2Rpdj4nOwogICAgfSkuam9pbignJykgKyAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0ib2NyLXJhdyIgaWQ9IicgKyBpZCArICdfcmF3IiBoaWRkZW4+JyArIGVzYyhyLnRleHQgfHwgJyjguKfguYjguLLguIcp',
  'JykgKyAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iaGludCBtdDgiPuC4leC4o+C4p+C4iOC4hOC4p+C4suC4oeC4luC4ueC4geC4leC5ieC4reC4h+C4geC5iOC4reC4meC4muC4seC4meC4l+C4tuC4geC5gOC4quC4oeC4rSDigJQg4LmB4LiB4LmJ4LmD4LiZ',
  '4LiK4LmI4Lit4LiH4LmE4LiU4LmJ4LiV4Liy4Lih4Lib4LiB4LiV4Li0PC9kaXY+JyArCiAgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIG9jclRvZ2dsZVJhdyhpZCl7CiAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQgKyAnX3JhdycpOwogIGlmIChl',
  'bCkgZWwuaGlkZGVuID0gIWVsLmhpZGRlbjsKfQoKLyoqIOC5g+C4quC5iOC4hOC5iOC4suC4peC4h+C4iuC5iOC4reC4hyDguYHguKXguYnguKfguYTguK7guYTguKXguJXguYzguYPguKvguYnguYDguKvguYfguJnguKfguYjguLLguIrguYjguK3guIfguYTguKvg',
  'uJnguJbguLnguIHguYDguJXguLTguKEgKi8KZnVuY3Rpb24gb2NyRmlsbChmaWVsZEtleSwgdmFsdWUpewogIC8vIOC5gOC4leC4tOC4oeC4peC4h+C4leC4suC4o+C4suC4h+C4o+C4suC4ouC4geC4suC4o+C4ouC5iOC4reC4oiAo4LmD4Lia4LmA4Liq4Lij4LmH',
  '4LiI4LiX4Li14LmI4Lih4Li14LiC4Lit4LiH4Lir4Lil4Liy4Lii4Lit4Lii4LmI4Liy4LiHKQogIGlmIChmaWVsZEtleSA9PT0gJ19saW5lcycpIHsKICAgIHZhciBhZGQgPSAodmFsdWUgfHwgW10pLm1hcChmdW5jdGlvbihpdCl7CiAgICAgIHJldHVybiB7IG5h',
  'bWU6IGl0Lm5hbWUsIHF0eTogMSwgdW5pdDogJycsIHByaWNlOiBOdW1iZXIoaXQucHJpY2UpIHx8IDAgfTsKICAgIH0pOwogICAgaWYgKCFhZGQubGVuZ3RoKSByZXR1cm4gZmFsc2U7CiAgICBGT1JNLmxpbmVzID0gKEZPUk0ubGluZXMgfHwgW10pLmZpbHRlcihm',
  'dW5jdGlvbihsKXsgcmV0dXJuIFN0cmluZyhsLm5hbWUgfHwgJycpLnRyaW0oKTsgfSkuY29uY2F0KGFkZCk7CiAgICByZWRyYXdMaW5lcygpOwogICAgdmFyIGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2xpbmVzJyk7CiAgICBpZiAoYm94KSB7CiAg',
  'ICAgIGJveC5jbGFzc0xpc3QuYWRkKCdvY3ItZmlsbGVkJyk7CiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgYm94LmNsYXNzTGlzdC5yZW1vdmUoJ29jci1maWxsZWQnKTsgfSwgMTYwMCk7CiAgICB9CiAgICByZXR1cm4gdHJ1ZTsKICB9CgogIHZhciBlbCA9',
  'IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmXycgKyBmaWVsZEtleSk7CiAgaWYgKCFlbCkgcmV0dXJuIGZhbHNlOwogIGVsLnZhbHVlID0gdmFsdWU7CiAgZWwuY2xhc3NMaXN0LmFkZCgnb2NyLWZpbGxlZCcpOwogIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgZWwu',
  'Y2xhc3NMaXN0LnJlbW92ZSgnb2NyLWZpbGxlZCcpOyB9LCAxNjAwKTsKICByZWNhbGNTdW1zKCk7CiAgcmV0dXJuIHRydWU7Cn0KCmZ1bmN0aW9uIG9jckFwcGx5T25lKGlkLCBpZHgpewogIHZhciByID0gT0NSX0xBU1RbaWRdOwogIGlmICghcikgcmV0dXJuOwog',
  'IHZhciBwID0gb2NyUGFpcnMocilbaWR4XTsKICBpZiAocCAmJiBvY3JGaWxsKHAuZmllbGQsIHAudmFsdWUpKSB7CiAgICB0b2FzdChwLmxpbmVzID8gJ+C5gOC4leC4tOC4oSAnICsgcC52YWx1ZS5sZW5ndGggKyAnIOC4o+C4suC4ouC4geC4suC4o+C4peC4h+C4',
  'muC4tOC4peC5geC4peC5ieC4pyDigJQg4LiV4Lij4Lin4LiI4LiI4Liz4LiZ4Lin4LiZ4LiB4Lix4Lia4Lij4Liy4LiE4Liy4Lit4Li14LiB4LiE4Lij4Lix4LmJ4LiHJyA6ICfguYDguJXguLTguKEnICsgcC5sYWJlbCArICfguYHguKXguYnguKcnLCAnb2snKTsK',
  'ICB9Cn0KCi8qKgogKiBAcGFyYW0ge2Jvb2xlYW59IG9ubHlFbXB0eSB0cnVlID0g4LmA4LiV4Li04Lih4LmA4LiJ4Lie4Liy4Liw4LiK4LmI4Lit4LiH4LiX4Li14LmI4Lii4Lix4LiH4Lin4LmI4Liy4LiHICjguYPguIrguYnguJXguK3guJnguYDguJXguLTguKHg',
  'uK3guLHguJXguYLguJnguKHguLHguJXguLQKICogICAgICAgICAgICAgICAgICAgICAgICAgICAg4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4LiX4Lix4Lia4Liq4Li04LmI4LiH4LiX4Li14LmI4Lic4Li54LmJ4LmD4LiK4LmJ4Lie4Li04Lih4Lie4LmM4LmE4Lib',
  '4LmB4Lil4LmJ4LinKQogKiBAcmV0dXJuIHtudW1iZXJ9IOC4iOC4s+C4meC4p+C4meC4iuC5iOC4reC4h+C4l+C4teC5iOC5gOC4leC4tOC4oeC4iOC4o+C4tOC4hwogKi8KZnVuY3Rpb24gb2NyQXBwbHlBbGwoaWQsIG9ubHlFbXB0eSl7CiAgdmFyIHIgPSBPQ1Jf',
  'TEFTVFtpZF07CiAgaWYgKCFyKSByZXR1cm4gMDsKICB2YXIgZG9uZSA9IHt9OwogIHZhciBuID0gMDsKICBvY3JQYWlycyhyKS5mb3JFYWNoKGZ1bmN0aW9uKHApewogICAgaWYgKGRvbmVbcC5maWVsZF0pIHJldHVybjsgICAgICAgICAgICAgICAgICAgICAgIC8v',
  'IOC4iuC5iOC4reC4h+C5gOC4lOC4teC4ouC4p+C4geC4seC4meC5gOC4leC4tOC4oeC4hOC4o+C4seC5ieC4h+C5gOC4lOC4teC4ouC4pyDguYDguK3guLLguJXguLHguKfguYHguKPguIEKICAgIGlmIChwLmZpZWxkID09PSAnX2xpbmVzJykgewogICAgICAvLyDg',
  'uJXguLLguKPguLLguIfguKPguLLguKLguIHguLLguKPguKLguYjguK3guKI6ICLguKfguYjguLLguIciIOC4q+C4oeC4suC4ouC4luC4tuC4h+C4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4leC4seC5ieC4h+C4iuC4',
  't+C5iOC4reC5hOC4p+C5iQogICAgICBpZiAob25seUVtcHR5ICYmIChGT1JNLmxpbmVzIHx8IFtdKS5zb21lKGZ1bmN0aW9uKGwpeyByZXR1cm4gU3RyaW5nKGwubmFtZSB8fCAnJykudHJpbSgpOyB9KSkgcmV0dXJuOwogICAgfSBlbHNlIHsKICAgICAgdmFyIGVs',
  'ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyArIHAuZmllbGQpOwogICAgICBpZiAoIWVsKSByZXR1cm47CiAgICAgIGlmIChvbmx5RW1wdHkgJiYgU3RyaW5nKGVsLnZhbHVlIHx8ICcnKS50cmltKCkgIT09ICcnKSByZXR1cm47CiAgICB9CiAgICBpZiAo',
  'b2NyRmlsbChwLmZpZWxkLCBwLnZhbHVlKSkgeyBkb25lW3AuZmllbGRdID0gdHJ1ZTsgbisrOyB9CiAgfSk7CiAgaWYgKCFvbmx5RW1wdHkpIHRvYXN0KG4gPyAn4LmA4LiV4Li04Lih4LmD4Lir4LmJICcgKyBuICsgJyDguIrguYjguK3guIfguYHguKXguYnguKcg',
  '4oCUIOC4leC4o+C4p+C4iOC4lOC4ueC4geC5iOC4reC4meC4muC4seC4meC4l+C4tuC4gScgOiAn4LiK4LmI4Lit4LiH4LiX4Li14LmI4LiI4Liw4LmA4LiV4Li04Lih4LmE4Lih4LmI4Lit4Lii4Li54LmI4LmD4LiZ4Lif4Lit4Lij4LmM4Lih4LiZ4Li14LmJJywg',
  'biA/ICdvaycgOiAnZXJyJyk7CiAgcmV0dXJuIG47Cn0KCmZ1bmN0aW9uIHJvb21PcHRpb25zKCl7IHJldHVybiBTLmJvb3QgPyBTLmJvb3Qucm9vbXMgOiBbXTsgfQpmdW5jdGlvbiBvcHQobmFtZSl7IHJldHVybiAoUy5ib290ICYmIFMuYm9vdC5zY2hlbWFbbmFt',
  'ZV0pIHx8IFtdOyB9CmZ1bmN0aW9uIHRvZGF5KCl7IHJldHVybiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc2xpY2UoMCwxMCk7IH0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/g',
  'uK3guKPguYzguKE6IOC4geC5ieC4reC4meC4q+C4meC4teC5iQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybURlYnQocmVjLCBsZWRnZXIpewogIC8vIOC5gOC4peC4',
  't+C4reC4geC5geC4oeC5iOC5hOC4lOC5ieC4iOC4suC4geC4l+C4uOC4geC4muC4seC4jeC4iuC4tSDguKLguIHguYDguKfguYnguJnguJXguLHguKfguYDguK3guIcKICB2YXIgYWxsID0gKEFMTF9ERUJUUyB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uKGQpeyByZXR1',
  'cm4gIXJlYyB8fCBkLmlkICE9PSByZWMuaWQ7IH0pOwogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4geC5ieC4reC4meC4q+C4meC4teC5iScgOiAn4LmA4Lie4Li04LmI4Lih4LiB4LmJ4Lit4LiZ4Lir4LiZ',
  '4Li14LmJJywKICAgIHJlY29yZDogcmVjLCBhY3Rpb246ICdkZWJ0LnNhdmUnLCBiYXNlOiB7IGxlZGdlcjogbGVkZ2VyIH0sCiAgICBvbkRlbGV0ZTogZGVsRGVidCwKICAgIGZpZWxkczogWwogICAgICB7IGtleTondGl0bGUnLCAgICBsYWJlbDon4Lij4Liy4Lii',
  '4LiB4Liy4Lij4Lir4LiZ4Li14LmJJywgcmVxdWlyZWQ6dHJ1ZSwgZnVsbDp0cnVlLCBwaDon4LmA4LiK4LmI4LiZIOC4hOC5iOC4suC4geC5iOC4reC4quC4o+C5ieC4suC4hyBUaGUgTSBDb3JuZXIgQVAnIH0sCiAgICAgIHsga2V5OidsZWRnZXInLCAgIGxhYmVs',
  'OifguJvguKPguLDguYDguKDguJfguJrguLHguI3guIrguLUnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOlsn4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiBJywn4Lir4LiZ4Li14LmJ4Lij4Lit4LiHJ10sIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5OidjcmVkaXRv',
  'cicsIGxhYmVsOifguYDguIjguYnguLLguKvguJnguLXguYknLCBwaDon4LmA4LiK4LmI4LiZIOC4hOC4o+C4reC4muC4hOC4o+C4seC4pyAvIOC4mOC4meC4suC4hOC4suC4oyAvIOC4m+C5ieC4suC4leC4sicgfSwKICAgICAgeyBrZXk6J3BhcmVudElkJywgbGFi',
  'ZWw6J+C5gOC4m+C5h+C4meC4quC5iOC4p+C4meC4q+C4meC4tuC5iOC4h+C4guC4reC4h+C4geC5ieC4reC4meC4q+C4meC4teC5iScsIHR5cGU6J3NlbGVjdCcsIGZ1bGw6dHJ1ZSwKICAgICAgICBvcHRpb25zOiBhbGwubWFwKGZ1bmN0aW9uKGQpeyByZXR1cm4g',
  'eyB2YWx1ZTpkLmlkLCBsYWJlbDpkLnRpdGxlICsgJyAoJyArIGQubGVkZ2VyICsgJyknIH07IH0pLAogICAgICAgIGhpbnQ6J+C5g+C4iuC5ieC5gOC4oeC4t+C5iOC4reC5gOC4h+C4tOC4meC4geC5ieC4reC4meC4meC4teC5ieC5gOC4m+C5h+C4meC4l+C4uOC4',
  'meC4guC4reC4h+C4reC4teC4geC4geC5ieC4reC4mSDguYDguIrguYjguJkg4LmA4LiH4Li04LiZ4Lii4Li34Lih4Lib4LmJ4Liy4LiV4Liy4LmA4Lib4LmH4LiZ4Liq4LmI4Lin4LiZ4Lir4LiZ4Li24LmI4LiH4LiC4Lit4LiH4Lir4LiZ4Li14LmJ4LiL4Li34LmJ',
  '4Lit4LiX4Li14LmI4LiU4Li04LiZIOKAlCAnICsKICAgICAgICAgICAgICfguIjguYjguLLguKLguITguLfguJnguIHguYnguK3guJnguJnguLXguYnguYHguKXguYnguKfguIHguYnguK3guJnguYHguKHguYjguIjguLDguKXguJTguJXguLLguKHguYTguJvguJTg',
  'uYnguKfguKIg4LmB4Lil4Liw4Lii4Lit4LiU4Lij4Lin4Lih4LiI4Liw4LmE4Lih4LmI4LiW4Li54LiB4LiZ4Lix4Lia4LiL4LmJ4LizJyB9LAogICAgICB7IGtleTonc3RhcnREYXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4geC5iOC4reC4q+C4meC4',
  'teC5iScsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidwcmluY2lwYWwnLCBsYWJlbDon4Lii4Lit4LiU4Lir4LiZ4Li14LmJ4LiV4Lix4LmJ4LiH4LiV4LmJ4LiZICjguJrguLLguJcpJywgdHlwZTonbW9uZXknLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsg',
  'a2V5OidpbnRlcmVzdFBlck1vbnRoJywgbGFiZWw6J+C4lOC4reC4geC5gOC4muC4teC5ieC4ouC4leC5iOC4reC5gOC4lOC4t+C4reC4mSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JyB9LAogICAgICB7IGtleToncGxhblBlck1vbnRoJywgbGFiZWw6J+C4ouC4',
  'reC4lOC4nOC5iOC4reC4meC4leC5iOC4reC5gOC4lOC4t+C4reC4mSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JyB9LAogICAgICB7IGtleTonZHVlRGF5JywgICBsYWJlbDon4LiB4Liz4Lir4LiZ4LiU4LiK4Liz4Lij4LiwICjguKfguLHguJnguJfguLXguYjg',
  'uILguK3guIfguYDguJTguLfguK3guJkpJywgdHlwZTonbnVtYmVyJywgcGg6JzIwJyB9LAogICAgICB7IGtleTonc3RhdHVzJywgICBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ2RlYnRTdGF0dXNlcycpLCBibGFu',
  'azpmYWxzZSB9LAogICAgICB7IGtleTonbm90ZScsICAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwogIGlmICghcmVjKSB7IHZhciBlID0gZG9jdW1lbnQuZ2V0RWxlbWVu',
  'dEJ5SWQoJ2ZfbGVkZ2VyJyk7IGlmIChlKSBlLnZhbHVlID0gbGVkZ2VyOyB9Cn0KCmZ1bmN0aW9uIGRlbERlYnQoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4geC5ieC4reC4meC4q+C4meC4teC5ieC4meC4teC5iT8g4Lij4Liy4Lii4LiB4Liy4Lij4LiK',
  '4Liz4Lij4Liw4LiX4Li14LmI4Lic4Li54LiB4LmE4Lin4LmJ4LiI4Liw4Lii4Lix4LiH4Lit4Lii4Li54LmIJywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2RlYnQuZGVsZXRlJywgeyBpZDogaWQgfSkudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB',
  '4Lil4LmJ4LinJywnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguKPguLLguKLguIHguLLguKPguYLguK3guJnguYPguIrguYnguKvguJnguLXguYkKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09ICovCmZ1bmN0aW9uIGZvcm1EZWJ0UGF5bWVudChyZWMsIGxlZGdlcil7CiAgdmFyIGRlYnRzID0gKFMuY2FjaGVbUy5wYWdlXSAmJiBTLmNhY2hlW1MucGFnZV0uZGVidHMpIHx8IFtdOwogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlk',
  'ID8gJ+C5geC4geC5ieC5hOC4guC4o+C4suC4ouC4geC4suC4o+C4iuC4s+C4o+C4sCcgOiAn4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4LmC4Lit4LiZ4LmD4LiK4LmJ4Lir4LiZ4Li14LmJJywKICAgIHJlY29yZDogcmVjIHx8IHsgcGF5RGF0ZTogdG9kYXko',
  'KSwgY2hhbm5lbDogJ+C5guC4reC4mSBRUicgfSwKICAgIGFjdGlvbjogJ2RlYnQuc2F2ZVBheW1lbnQnLCBiYXNlOiB7IGxlZGdlcjogbGVkZ2VyIH0sIGJ1Y2tldDogJ2RlYnQnLAogICAgb2NyOiB7IGRhdGU6J3BheURhdGUnLCBhbW91bnQ6J3ByaW5jaXBhbCcs',
  'IG5vdGU6J25vdGUnIH0sCiAgICBvbkRlbGV0ZTogZGVsRGVidFBheW1lbnQsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3BheURhdGUnLCBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiK4Liz4Lij4LiwJywgdHlwZTonZGF0ZScsIHJlcXVpcmVkOnRydWUg',
  'fSwKICAgICAgeyBrZXk6J2NoYW5uZWwnLCBsYWJlbDon4LiK4LmI4Lit4LiH4LiX4Liy4LiHJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ3BheUNoYW5uZWxzJykgfSwKICAgICAgeyBrZXk6J3ByaW5jaXBhbCcsIGxhYmVsOifguYDguIfguLTguJnguJXg',
  'uYnguJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHN1bXM6dHJ1ZSwKICAgICAgICBoaW50OifguKrguYjguKfguJnguJfguLXguYjguYTguJvguKXguJTguKLguK3guJTguKvguJnguLXguYnguIjguKPguLTguIcnIH0sCiAgICAgIHsga2V5OidpbnRlcmVz',
  'dCcsICBsYWJlbDon4LiU4Lit4LiB4LmA4Lia4Li14LmJ4LiiICjguJrguLLguJcpJywgdHlwZTonbW9uZXknLCBzdW1zOnRydWUsCiAgICAgICAgaGludDon4LmE4Lih4LmI4LiW4Li54LiB4LiZ4Liz4LmE4Lib4Lil4LiU4Lii4Lit4LiU4Lir4LiZ4Li14LmJJyB9',
  'LAogICAgICB7IGtleTonX3RvdGFsJywgIGxhYmVsOifguKPguKfguKHguJfguLXguYjguYLguK3guJknLCB0eXBlOidjb21wdXRlZCcsIGZyb206WydwcmluY2lwYWwnLCdpbnRlcmVzdCddLAogICAgICAgIGhpbnQ6J+C4leC4o+C4p+C4iOC5g+C4q+C5ieC4leC4',
  'o+C4h+C4geC4seC4muC4ouC4reC4lOC5g+C4meC4quC4peC4tOC4myDCtyDguKPguLDguJrguJrguITguLTguJTguYPguKvguYnguK3guLHguJXguYLguJnguKHguLHguJXguLQnIH0sCiAgICAgIHsga2V5OidpbnN0YWxsbWVudCcsIGxhYmVsOifguIfguKfguJTg',
  'uJfguLXguYgnLCBwaDon4LmA4LiK4LmI4LiZIDkvMjAyNicgfSwKICAgICAgeyBrZXk6J2RlYnRJZCcsICBsYWJlbDon4Lic4Li54LiB4LiB4Lix4Lia4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJJywgdHlwZTonc2VsZWN0JywKICAgICAgICBvcHRpb25zOiBkZWJ0',
  'cy5tYXAoZnVuY3Rpb24oZCl7IHJldHVybiB7IHZhbHVlOmQuaWQsIGxhYmVsOmQudGl0bGUgfTsgfSksCiAgICAgICAgaGludDon4LmA4Lin4LmJ4LiZ4Lin4LmI4Liy4LiH4LmE4LiU4LmJIOKAlCDguKPguLDguJrguJrguIjguLDguJnguLHguJrguKPguKfguKHg',
  'uJfguLHguYnguIfguJrguLHguI3guIrguLUnIH0sCiAgICAgIHsga2V5OidwYXllcicsICAgbGFiZWw6J+C4nOC4ueC5ieC4iuC4s+C4o+C4sCcgfSwKICAgICAgeyBrZXk6J3NsaXBzJywgICBsYWJlbDon4Liq4Lil4Li04Lib4LiB4Liy4Lij4LmC4Lit4LiZJywg',
  'dHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgovKioKICog4Lii4Lit4LiU4LmD4LiZ',
  '4Lij4Liw4Lia4Lia4LmE4Lih4LmI4LiV4Lij4LiH4LiB4Lix4Lia4Lii4Lit4LiU4LiX4Li14LmI4LmA4LiI4LmJ4Liy4Lir4LiZ4Li14LmJ4LmB4LiI4LmJ4LiHIOKGkiDguIHguKPguK3guIHguKLguK3guJTguITguIfguYDguKvguKXguLfguK3guIjguKPguLTg',
  'uIcg4Lij4Liw4Lia4Lia4Lia4Lix4LiZ4LiX4Li24LiB4Liq4LmI4Lin4LiZ4LiV4LmI4Liy4LiH4LmD4Lir4LmJCiAqIOC5hOC4oeC5iOC5hOC4m+C5geC4geC5ieC4ouC4reC4lOC4leC4seC5ieC4h+C4leC5ieC4mSDguYDguJ7guKPguLLguLDguJvguKPguLDg',
  'uKfguLHguJXguLTguIjguLDguYDguJ7guLXguYnguKLguJkg4Lij4Liy4Lii4LiB4Liy4Lij4Lib4Lij4Lix4Lia4Lii4Lit4LiU4Lil4Lia4LiX4Li04LmJ4LiH4LmE4LiU4LmJ4LiW4LmJ4Liy4LiB4Lij4Lit4LiB4Lic4Li04LiUCiAqLwpmdW5jdGlvbiBmb3Jt',
  'UmVjb25jaWxlRGVidCh4KXsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogJ+C4m+C4o+C4seC4muC4ouC4reC4lOC5g+C4q+C5ieC4leC4o+C4h+C4ouC4reC4lOC4iOC4o+C4tOC4hyDCtyAnICsgeC50aXRsZSwKICAgIHJlY29yZDogeyBwYXlEYXRlOiB0b2RheSgp',
  'IH0sCiAgICBhY3Rpb246ICdkZWJ0LnJlY29uY2lsZScsIGJhc2U6IHsgZGVidElkOiB4LmlkIH0sCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J2FjdHVhbFJlbWFpbmluZycsIGxhYmVsOifguKLguK3guJTguITguIfguYDguKvguKXguLfguK3guIjguKPguLTg',
  'uIfguJXguK3guJnguJnguLXguYkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHJlcXVpcmVkOnRydWUsIGZ1bGw6dHJ1ZSwKICAgICAgICBoaW50OifguYPguJnguKPguLDguJrguJrguJXguK3guJnguJnguLXguYnguITguIfguYDguKvguKXguLfguK0gPGI+',
  'JyArIGJhaHQoeC5yZW1haW5pbmcpICsgJzwvYj4gwrcg4LiW4LmJ4Liy4Lib4Li04LiU4Lir4LiZ4Li14LmJ4LiB4LmJ4Lit4LiZ4LiZ4Li14LmJ4LmB4Lil4LmJ4LinIOC5g+C4quC5iCAwJyB9LAogICAgICB7IGtleToncGF5RGF0ZScsIGxhYmVsOifguJMg4Lin',
  '4Lix4LiZ4LiX4Li14LmIJywgdHlwZTonZGF0ZScsIHJlcXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICBsYWJlbDon4Liq4Liy4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUsCiAgICAgICAgcGg6J+C5gOC4iuC5iOC4',
  'mSDguKHguLXguIfguKfguJTguJfguLXguYjguYTguKHguYjguYTguJTguYnguJrguLHguJnguJfguLbguIHguYTguKfguYkgLyDguYDguIjguYnguLLguKvguJnguLXguYnguKXguJTguYPguKvguYknLAogICAgICAgIGhpbnQ6J+C4o+C4sOC4muC4muC4muC4seC4',
  'meC4l+C4tuC4geC4quC5iOC4p+C4meC4leC5iOC4suC4h+C5gOC4m+C5h+C4meC4o+C4suC4ouC4geC4suC4o+C4iuC5iOC4reC4h+C4l+C4suC4hyAi4Lib4Lij4Lix4Lia4Lii4Lit4LiUIiDguJzguLnguIHguIHguLHguJrguIHguYnguK3guJnguJnguLXguYkg',
  'JyArCiAgICAgICAgICAgICAn4LmE4Lih4LmI4LiZ4Lix4Lia4LmA4Lib4LmH4LiZ4Lii4Lit4LiU4Lic4LmI4Lit4LiZ4Lij4Liy4Lii4Lib4Li14LmB4Lil4Liw4LmE4Lih4LmI4LmD4LiK4LmJ4LiE4Liy4LiU4LiB4Liy4Lij4LiT4LmM4Lin4Lix4LiZ4Lib4Li0',
  '4LiU4Lir4LiZ4Li14LmJIMK3IOC4geC4o+C4reC4geC4nOC4tOC4lOC4geC5h+C4peC4muC4o+C4suC4ouC4geC4suC4o+C4meC4seC5ieC4meC4l+C4tOC5ieC4h+C5hOC4lOC5iScgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxEZWJ0UGF5bWVudChpZCl7',
  'CiAgY29uZmlybUFjdGlvbign4Lil4Lia4Lij4Liy4Lii4LiB4Liy4Lij4LiK4Liz4Lij4Liw4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdkZWJ0LmRlbGV0ZVBheW1lbnQnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfg',
  'uKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3guKPguYzguKE6IOC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT0gKi8KZnVuY3Rpb24gZm9ybVB1cmNoYXNlKHJlYyl7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4LitJyA6ICfguYDguJ7guLTguYjguKHguKPguLLg',
  'uKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcnLAogICAgcmVjb3JkOiByZWMgfHwgeyBidXlEYXRlOiB0b2RheSgpIH0sCiAgICBhY3Rpb246ICdwdXJjaGFzZS5zYXZlJywgYnVja2V0OiAncHVyY2hhc2VzJywgd2lkZTogdHJ1ZSwKICAgIG9jcjogeyBk',
  'YXRlOididXlEYXRlJywgYW1vdW50OidwcmljZScsIHZlbmRvcjondmVuZG9yJywgdGl0bGU6J2l0ZW0nIH0sCiAgICBvbkRlbGV0ZTogZGVsUHVyY2hhc2UsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J2l0ZW0nLCAgICBsYWJlbDon4LiK4Li34LmI4Lit4Lia',
  '4Li04LilIC8g4Lij4Liy4Lii4LiB4Liy4Lij4Lir4Lil4Lix4LiBJywgdHlwZTondGV4dGFyZWEnLCByZXF1aXJlZDp0cnVlLCBmdWxsOnRydWUsCiAgICAgICAgcGg6J+C5gOC4iuC5iOC4mSDguKrguLHguYjguIfguILguK3guIfguYDguILguYnguLLguKvguK0g',
  'U2hvcGVlIOC4o+C5ieC4suC4mSBBQkMnLAogICAgICAgIGhpbnQ6J+C4luC5ieC4suC5g+C4quC5iOC4o+C4suC4ouC4geC4suC4o+C4ouC5iOC4reC4ouC4guC5ieC4suC4h+C4peC5iOC4suC4h+C5hOC4p+C5iSDguYHguKXguYnguKfguYDguKfguYnguJnguIrg',
  'uYjguK3guIfguJnguLXguYnguKfguYjguLLguIcg4Lij4Liw4Lia4Lia4LiI4Liw4LiV4Lix4LmJ4LiH4LiK4Li34LmI4Lit4LmD4Lir4LmJ4LmA4Lit4LiH4LiI4Liy4LiB4Lij4Liy4Lii4LiB4Liy4Lij4LmB4Lij4LiBJyB9LAogICAgICB7IGtleTonYnV5RGF0',
  'ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguIvguLfguYnguK0nLCB0eXBlOidkYXRlJywgcmVxdWlyZWQ6dHJ1ZSB9LAogICAgICB7IGtleTonY2F0ZWdvcnknLCBsYWJlbDon4Lir4Lih4Lin4LiU4Lir4Lih4Li54LmIJywgdHlwZTonc2VsZWN0Jywgb3B0',
  'aW9uczpvcHQoJ3B1cmNoYXNlQ2F0ZWdvcmllcycpIH0sCgogICAgICB7IGtleTonbGluZXMnLCAgIGxhYmVsOifguKPguLLguKLguIHguLLguKPguYPguJnguJrguLTguKUgKOC4i+C4t+C5ieC4reC4l+C4teC5gOC4lOC4teC4ouC4p+C4q+C4peC4suC4ouC4reC4',
  'ouC5iOC4suC4h+C5g+C4quC5iOC4leC4o+C4h+C4meC4teC5iSknLCB0eXBlOidsaW5lcycsIGZ1bGw6dHJ1ZSwKICAgICAgICBoaW50OifguKrguLHguYjguIfguK3guK3guJnguYTguKXguJnguYzguITguKPguLHguYnguIfguYDguJTguLXguKLguKfguYTguJTg',
  'uYnguILguK3guIfguKvguKXguLLguKLguK3guKLguYjguLLguIcg4LmD4Liq4LmI4LmB4Lii4LiB4LiX4Li14Lil4Liw4Lij4Liy4Lii4LiB4Liy4Lij4LmE4LiU4LmJ4LmA4Lil4LiiIMK3IOC4o+C4sOC4muC4muC4o+C4p+C4oeC4o+C4suC4hOC4suC5g+C4q+C5',
  'ieC4reC4seC4leC5guC4meC4oeC4seC4leC4tCcgfSwKICAgICAgeyBrZXk6J3NoaXBwaW5nJywgbGFiZWw6J+C4hOC5iOC4suC4quC5iOC4hyAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JywgcGg6JzAnLCBvbmlucHV0OidyZWNhbGNCaWxsKCknIH0sCiAgICAg',
  'IHsga2V5OidkaXNjb3VudCcsIGxhYmVsOifguKrguYjguKfguJnguKXguJQgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHBoOicwJywgb25pbnB1dDoncmVjYWxjQmlsbCgpJyB9LAogICAgICB7IGtleToncHJpY2UnLCAgIGxhYmVsOifguKPguLLguITguLLg',
  'uKPguKfguKHguJfguLHguYnguIfguJrguLTguKUgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHJlcXVpcmVkOnRydWUsCiAgICAgICAgaGludDonPHNwYW4gaWQ9ImJpbGxIaW50Ij48L3NwYW4+JyB9LAogICAgICB7IGtleTonb3JkZXJObycsIGxhYmVsOifg',
  'uYDguKXguILguJfguLXguYjguITguLPguKrguLHguYjguIfguIvguLfguYnguK0nLCBwaDon4LmA4Lil4LiC4Lit4Lit4Lij4LmM4LmA4LiU4Lit4Lij4LmM4LiI4Liy4LiBIFNob3BlZSAvIExhemFkYScgfSwKICAgICAgeyBrZXk6J3ZlbmRvcicsICBsYWJlbDon',
  '4LmB4Lir4Lil4LmI4LiH4LiX4Li14LmI4LiL4Li34LmJ4LitJywgcGg6J1Nob3BlZSAvIOC5hOC4l+C4p+C4seC4quC4lOC4uCAvIOC4o+C5ieC4suC4meKApicgfSwKICAgICAgeyBrZXk6J3BheWVyJywgICBsYWJlbDon4Lic4Li54LmJ4LiK4Liz4Lij4LiwJyB9',
  'LAogICAgICB7IGtleTond2FycmFudHlNb250aHMnLCBsYWJlbDon4Lij4Liw4Lii4Liw4LmA4Lin4Lil4Liy4Lij4Lix4Lia4Lib4Lij4Liw4LiB4Lix4LiZICjguYDguJTguLfguK3guJkpJywgdHlwZTonbnVtYmVyJywKICAgICAgICBoaW50OifguKPguLDguJrg',
  'uJrguIjguLDguITguLPguJnguKfguJPguKfguLHguJnguKvguKHguJTguJvguKPguLDguIHguLHguJnguYPguKvguYnguK3guLHguJXguYLguJnguKHguLHguJXguLQnIH0sCiAgICAgIHsga2V5Oidyb29tJywgICAgbGFiZWw6J+C4q+C5ieC4reC4hy/guJ7guLfg',
  'uYnguJnguJfguLXguYjguJfguLXguYjguYPguIrguYknLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOlsn4Liq4LmI4Lin4LiZ4LiB4Lil4Liy4LiHJ10uY29uY2F0KHJvb21PcHRpb25zKCkpIH0sCiAgICAgIHsga2V5OidwaG90b3MnLCAgbGFiZWw6J+C4oOC4suC4',
  'nuC4m+C4o+C4sOC4geC4reC4muC4quC4tOC4meC4hOC5ieC4sicsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5OidzbGlwcycsICAgbGFiZWw6J+C4quC4peC4tOC4m+C4geC4suC4o+C5guC4reC4meC4iuC4s+C4o+C4sCcsIHR5cGU6J2Zp',
  'bGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0KICB9KTsKfQoKZnVuY3Rpb24gZGVsUHVyY2hhc2UoaWQpewogIGNv',
  'bmZpcm1BY3Rpb24oJ+C4peC4muC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4meC4teC5iT8nLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgncHVyY2hhc2UuZGVsZXRlJywgeyBpZDogaWQgfSkudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB',
  '4Lil4LmJ4LinJywnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguKXguYnguLLguIfguYHguK3guKPguYwKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1B',
  'YyhyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4o+C4suC4ouC4geC4suC4o+C4peC5ieC4suC4h+C5geC4reC4o+C5jCcgOiAn4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4Lil4LmJ4Liy4LiH',
  '4LmB4Lit4Lij4LmMJywKICAgIHJlY29yZDogcmVjIHx8IHsgYm9va0RhdGU6IHRvZGF5KCkgfSwKICAgIGFjdGlvbjogJ2FjLnNhdmUnLCBidWNrZXQ6ICdhYycsCiAgICBvY3I6IHsgZGF0ZTonc2VydmljZURhdGUnLCBhbW91bnQ6J2Nvc3QnLCB2ZW5kb3I6J3Rl',
  'Y2huaWNpYW4nIH0sCiAgICBvbkRlbGV0ZTogZGVsQWMsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3Jvb20nLCAgICAgICAgbGFiZWw6J+C4q+C5ieC4reC4hycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6cm9vbU9wdGlvbnMoKSwgcmVxdWlyZWQ6dHJ1ZSwg',
  'Ymxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J3JvdW5kJywgICAgICAgbGFiZWw6J+C4o+C4reC4muC4l+C4teC5iCcsIHR5cGU6J251bWJlcicsIGhpbnQ6J+C5gOC4p+C5ieC4meC4p+C5iOC4suC4h+C5g+C4q+C5ieC4o+C4sOC4muC4muC4meC4seC4muC4leC5',
  'iOC4reC4iOC4suC4geC4o+C4reC4muC4peC5iOC4suC4quC4uOC4lOC4guC4reC4h+C4m+C4teC4meC4seC5ieC4mScgfSwKICAgICAgeyBrZXk6J2Jvb2tEYXRlJywgICAgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4meC4seC4lOC4peC5ieC4suC4h+C5geC4',
  'reC4o+C5jCcsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidzZXJ2aWNlRGF0ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguJTguLPguYDguJnguLTguJnguIHguLLguKPguIjguKPguLTguIcnLCB0eXBlOidkYXRlJywgaGludDon4LiB4Lij4Lit4LiB',
  '4LmA4Lih4Li34LmI4Lit4Lil4LmJ4Liy4LiH4LmA4Liq4Lij4LmH4LiI4LmB4Lil4LmJ4LinJyB9LAogICAgICB7IGtleTonc3RhdHVzJywgICAgICBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ2FjU3RhdHVzZXMn',
  'KSB9LAogICAgICB7IGtleTondGVjaG5pY2lhbicsICBsYWJlbDon4LiK4LmI4Liy4LiHIC8g4Lic4Li54LmJ4LmD4Lir4LmJ4Lia4Lij4Li04LiB4Liy4LijJyB9LAogICAgICB7IGtleTonY29zdCcsICAgICAgICBsYWJlbDon4LiE4LmI4Liy4LmD4LiK4LmJ4LiI',
  '4LmI4Liy4LiiICjguJrguLLguJcpJywgdHlwZTonbW9uZXknIH0sCiAgICAgIHsga2V5OidwaG90b3MnLCAgICAgIGxhYmVsOifguKDguLLguJ7guJvguKPguLDguIHguK3guJonLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonbm90ZScs',
  'ICAgICAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxBYyhpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4Lij4Liy4Lii4LiB4Liy4Lij4Lil',
  '4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdhYy5kZWxldGUnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKHsgcXVpZXQ6IHRy',
  'dWUgfSk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qKiDguJnguLHguJTguKXguYnguLLguIfguYHguK3guKPguYzguKvguKXguLLguKLguKvguYnguK3guIfguJ7guKPguYnguK3g',
  'uKHguIHguLHguJkgKi8KZnVuY3Rpb24gZm9ybUJ1bGtBYygpewogIHZhciByb29tcyA9IHJvb21PcHRpb25zKCk7CiAgdmFyIGJvZHkgPQogICAgJzxkaXYgY2xhc3M9ImZncmlkIj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7guKfguLHguJnguJfg',
  'uLXguYjguJnguLHguJQgPHNwYW4gc3R5bGU9ImNvbG9yOnZhcigtLWRhbmdlcikiPio8L3NwYW4+PC9sYWJlbD4nICsKICAgICAgICAnPGlucHV0IHR5cGU9ImRhdGUiIGNsYXNzPSJpbnAiIGlkPSJia19kYXRlIiB2YWx1ZT0iJyArIHRvZGF5KCkgKyAnIj48L2Rp',
  'dj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7guIrguYjguLLguIcgLyDguJzguLnguYnguYPguKvguYnguJrguKPguLTguIHguLLguKM8L2xhYmVsPjxpbnB1dCBjbGFzcz0iaW5wIiBpZD0iYmtfdGVjaCI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNs',
  'YXNzPSJmIj48bGFiZWw+4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4LiV4LmI4Lit4Lir4LmJ4Lit4LiHICjguJrguLLguJcpPC9sYWJlbD48aW5wdXQgdHlwZT0ibnVtYmVyIiBjbGFzcz0iaW5wIiBpZD0iYmtfY29zdCI+PC9kaXY+JyArCiAgICAgICc8',
  'ZGl2IGNsYXNzPSJmIj48bGFiZWw+4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4PC9sYWJlbD48aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImJrX25vdGUiPjwvZGl2PicgKwogICAgJzwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImhyIj48L2Rpdj4nICsKICAgICc8ZGl2',
  'IGNsYXNzPSJyb3cgbWI4Ij48YiBjbGFzcz0iZnMxMyI+4LmA4Lil4Li34Lit4LiB4Lir4LmJ4Lit4LiHPC9iPjxzcGFuIGNsYXNzPSJzcCI+PC9zcGFuPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJidWxrUGljayhcJ2FsbFwnKSI+',
  '4LiX4Lix4LmJ4LiH4Lir4Lih4LiUPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImJ1bGtQaWNrKFwnbm9uZVwnKSI+4Lil4LmJ4Liy4LiHPC9idXR0b24+JyArCiAgICAgIFsxLDIsMyw0LDVdLm1hcChmdW5jdGlvbihm',
  'KXsgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImJ1bGtQaWNrKCcgKyBmICsgJykiPuC4iuC4seC5ieC4mSAnICsgZiArICc8L2J1dHRvbj4nOyB9KS5qb2luKCcnKSArCiAgICAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0icm9vbXMi',
  'IGlkPSJia1Jvb21zIj4nICsgcm9vbXMubWFwKGZ1bmN0aW9uKHIpewogICAgICByZXR1cm4gJzxsYWJlbCBjbGFzcz0icm9vbSIgc3R5bGU9ImN1cnNvcjpwb2ludGVyIj48aW5wdXQgdHlwZT0iY2hlY2tib3giIGNsYXNzPSJiayIgdmFsdWU9IicgKyByICsgJyI+',
  'IDxiPicgKyByICsgJzwvYj48L2xhYmVsPic7CiAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwoKICBvcGVuTW9kYWwoJ/Cfk4Ug4LiZ4Lix4LiU4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4Lir4Lil4Liy4Lii4Lir4LmJ4Lit4LiH4Lie4Lij4LmJ4Lit4Lih4LiB',
  '4Lix4LiZJywgYm9keSwKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lii4LiB4LmA4Lil4Li04LiBPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgaWQ9ImJrU2F2ZSI+4Liq4Lij4LmJ4Liy4LiH',
  '4LiZ4Lix4LiU4Lir4Lih4Liy4LiiPC9idXR0b24+JywgdHJ1ZSk7CgogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdia1NhdmUnKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsKICAgIHZhciBwaWNrZWQgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChkb2N1bWVu',
  'dC5xdWVyeVNlbGVjdG9yQWxsKCcuYms6Y2hlY2tlZCcpKS5tYXAoZnVuY3Rpb24oYyl7IHJldHVybiBjLnZhbHVlOyB9KTsKICAgIHZhciBkYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JrX2RhdGUnKS52YWx1ZTsKICAgIGlmICghcGlja2VkLmxlbmd0',
  'aCkgcmV0dXJuIHRvYXN0KCfguYDguKXguLfguK3guIHguK3guKLguYjguLLguIfguJnguYnguK3guKIgMSDguKvguYnguK3guIcnLCAnZXJyJyk7CiAgICBpZiAoIWRhdGUpIHJldHVybiB0b2FzdCgn4LiB4Lij4Li44LiT4Liy4Lij4Liw4Lia4Li44Lin4Lix4LiZ',
  '4LiX4Li14LmI4LiZ4Lix4LiUJywgJ2VycicpOwogICAgdmFyIGJ0biA9IHRoaXM7IGJ0bi5kaXNhYmxlZCA9IHRydWU7IGJ0bi5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4Lia4Lix4LiZ4LiX4Li24LiB4oCm',
  'JzsKICAgIGNhbGxBcGkoJ2FjLmJ1bGtCb29rJywgewogICAgICByb29tczogcGlja2VkLCBib29rRGF0ZTogZGF0ZSwKICAgICAgdGVjaG5pY2lhbjogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JrX3RlY2gnKS52YWx1ZSwKICAgICAgY29zdDogZG9jdW1lbnQu',
  'Z2V0RWxlbWVudEJ5SWQoJ2JrX2Nvc3QnKS52YWx1ZSwKICAgICAgbm90ZTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JrX25vdGUnKS52YWx1ZQogICAgfSkudGhlbihmdW5jdGlvbihuKXsKICAgICAgY2xvc2VNb2RhbCgpOyB0b2FzdCgn4Liq4Lij4LmJ4Liy',
  '4LiH4LiZ4Lix4LiU4Lir4Lih4Liy4LiiICcgKyBuICsgJyDguKvguYnguK3guIfguYHguKXguYnguKcnLCAnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBidG4u',
  'dGV4dENvbnRlbnQgPSAn4Liq4Lij4LmJ4Liy4LiH4LiZ4Lix4LiU4Lir4Lih4Liy4LiiJzsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7CiAgICB9KTsKICB9Owp9CgpmdW5jdGlvbiBidWxrUGljayh3aGF0KXsKICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxs',
  'KCcuYmsnKS5mb3JFYWNoKGZ1bmN0aW9uKGMpewogICAgaWYgKHdoYXQgPT09ICdhbGwnKSBjLmNoZWNrZWQgPSB0cnVlOwogICAgZWxzZSBpZiAod2hhdCA9PT0gJ25vbmUnKSBjLmNoZWNrZWQgPSBmYWxzZTsKICAgIGVsc2UgYy5jaGVja2VkID0gU3RyaW5nKGMu',
  'dmFsdWUpLmNoYXJBdCgwKSA9PT0gU3RyaW5nKHdoYXQpOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguIvguYjguK3guKHguYHguIvguKHg',
  'uJXguLLguKHguKvguYnguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1SZXBhaXIocmVjKXsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5p',
  'ZCA/ICfguYHguIHguYnguYTguILguIfguLLguJnguIvguYjguK3guKEnIDogJ+C5geC4iOC5ieC4h+C4i+C5iOC4reC4oSAvIOC4muC4seC4meC4l+C4tuC4geC4h+C4suC4meC4i+C5iOC4reC4oScsCiAgICByZWNvcmQ6IHJlYyB8fCB7IHJlcG9ydERhdGU6IHRv',
  'ZGF5KCksIHByaW9yaXR5OiAn4Lib4LiB4LiV4Li0JyB9LAogICAgYWN0aW9uOiAncmVwYWlyLnNhdmUnLCBidWNrZXQ6ICdyb29tUmVwYWlyJywgd2lkZTogdHJ1ZSwKICAgIG9jcjogeyBkYXRlOidyZXBhaXJEYXRlJywgYW1vdW50Oidjb3N0JywgdmVuZG9yOid0',
  'ZWNobmljaWFuJywgdGl0bGU6J2l0ZW1zJyB9LAogICAgb25EZWxldGU6IGRlbFJlcGFpciwKICAgIGZpZWxkczogWwogICAgICB7IGtleToncm9vbScsICAgICAgIGxhYmVsOifguKvguYnguK3guIcnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOnJvb21PcHRpb25z',
  'KCksIHJlcXVpcmVkOnRydWUsIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5OidjYXRlZ29yeScsICAgbGFiZWw6J+C4m+C4o+C4sOC5gOC4oOC4l+C4h+C4suC4meC4q+C4peC4seC4geC4guC4reC4h+C5g+C4muC4meC4teC5iScsIHR5cGU6J3NlbGVjdCcsIG9w',
  'dGlvbnM6b3B0KCdyZXBhaXJDYXRlZ29yaWVzJyksCiAgICAgICAgaGludDon4LmA4Lin4LmJ4LiZ4Lin4LmI4Liy4LiH4LmE4LiU4LmJIOKAlCDguKPguLDguJrguJrguYPguIrguYnguJvguKPguLDguYDguKDguJfguJfguLXguYjguJ7guJrguJrguYjguK3guKLg',
  'uJfguLXguYjguKrguLjguJTguYPguJnguYDguIrguYfguITguKXguLTguKrguJXguYzguYPguKvguYnguYDguK3guIcnIH0sCiAgICAgIHsga2V5OidpdGVtcycsICAgICAgbGFiZWw6J+C4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4leC5ieC4reC4h+C4i+C5',
  'iOC4reC4oSAo4LiV4Li04LmK4LiB4LmA4Lih4Li34LmI4Lit4LiX4Liz4LmA4Liq4Lij4LmH4LiIKScsIHR5cGU6J3RvZG8nLCByZXF1aXJlZDp0cnVlLCBmdWxsOnRydWUsCiAgICAgICAgb3B0aW9uczogb3B0KCdyZXBhaXJDYXRlZ29yaWVzJyksCiAgICAgICAg',
  'aGludDon4LmA4LiC4LmJ4Liy4LiL4LmI4Lit4Lih4LiE4Lij4Lix4LmJ4LiH4LmA4LiU4Li14Lii4Lin4Lih4Lix4LiB4LiL4LmI4Lit4Lih4Lir4Lil4Liy4Lii4LiI4Li44LiUIOC5g+C4quC5iOC5geC4ouC4geC4l+C4teC4peC4sOC4h+C4suC4meC5geC4peC4',
  'sOC5gOC4peC4t+C4reC4geC4m+C4o+C4sOC5gOC4oOC4l+C4guC4reC4h+C5geC4leC5iOC4peC4sOC4h+C4suC4meC5hOC4lOC5iSDCtyAnICsKICAgICAgICAgICAgICfguJXguLTguYrguIHguITguKPguJrguJfguLjguIHguIfguLLguJnguYHguKXguYnguKfg',
  'uKPguLDguJrguJrguIjguLDguYDguJvguKXguLXguYjguKLguJnguKrguJbguLLguJnguLDguYDguJvguYfguJkg4oCc4LmA4Liq4Lij4LmH4LiI4Liq4Li04LmJ4LiZ4oCdIOC5g+C4q+C5ieC5gOC4reC4hycgfSwKICAgICAgeyBrZXk6J3JlcG9ydERhdGUnLCBs',
  'YWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LmB4LiI4LmJ4LiHJywgdHlwZTonZGF0ZScgfSwKICAgICAgeyBrZXk6J2Jvb2tEYXRlJywgICBsYWJlbDon4Lin4Lix4LiZ4LiZ4Lix4LiU4LiL4LmI4Lit4Lih4LmB4LiL4LihJywgdHlwZTonZGF0ZScgfSwKICAgICAg',
  'eyBrZXk6J3JlcGFpckRhdGUnLCBsYWJlbDon4Lin4Lix4LiZ4LmA4LiC4LmJ4Liy4LiL4LmI4Lit4Lih4LmB4LiL4LihJywgdHlwZTonZGF0ZScsIGhpbnQ6J+C4geC4o+C4reC4geC5gOC4oeC4t+C5iOC4reC4i+C5iOC4reC4oeC5gOC4quC4o+C5h+C4iOC5geC4',
  'peC5ieC4pycgfSwKICAgICAgeyBrZXk6J3N0YXR1cycsICAgICBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ3JlcGFpclN0YXR1c2VzJykgfSwKICAgICAgeyBrZXk6J3ByaW9yaXR5JywgICBsYWJlbDon4LiE4Lin',
  '4Liy4Lih4LmA4Lij4LmI4LiH4LiU4LmI4Lin4LiZJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ3ByaW9yaXRpZXMnKSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J3RlY2huaWNpYW4nLCBsYWJlbDon4LiK4LmI4Liy4LiH4Lic4Li54LmJ4LiL4LmI',
  '4Lit4LihJyB9LAogICAgICB7IGtleTonY29zdCcsICAgICAgIGxhYmVsOifguITguYjguLLguYPguIrguYnguIjguYjguLLguKIgKOC4muC4suC4lyknLCB0eXBlOidtb25leScgfSwKICAgICAgeyBrZXk6J3Bob3Rvc0JlZm9yZScsIGxhYmVsOifguKDguLLguJ7g',
  'uIHguYjguK3guJnguIvguYjguK3guKEnLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleToncGhvdG9zQWZ0ZXInLCAgbGFiZWw6J+C4oOC4suC4nuC4q+C4peC4seC4h+C4i+C5iOC4reC4oScsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0s',
  'CiAgICAgIHsga2V5Oidub3RlJywgICAgICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0KICB9KTsKfQoKZnVuY3Rpb24gZGVsUmVwYWlyKGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXg',
  'uJrguIfguLLguJnguIvguYjguK3guKHguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ3JlcGFpci5kZWxldGUnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKHsgcXVp',
  'ZXQ6IHRydWUgfSk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDg',
  'uJ/guK3guKPguYzguKE6IOC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybUJ1aWxk',
  'aW5nKHJlYyl7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiV4Li24LiBJyA6ICfguYDguJ7guLTguYjguKHguIfguLLguJnguIvguYjguK3guKHguYHguIvguKHguJXg',
  'uLbguIHguYLguJTguKLguKPguKfguKEnLAogICAgcmVjb3JkOiByZWMgfHwgeyBib29rRGF0ZTogdG9kYXkoKSB9LAogICAgYWN0aW9uOiAnYnVpbGRpbmcuc2F2ZScsIGJ1Y2tldDogJ2J1aWxkaW5nJywgd2lkZTogdHJ1ZSwKICAgIG9jcjogeyBkYXRlOidlbmRE',
  'YXRlJywgYW1vdW50Oidjb3N0JywgdmVuZG9yOidjb250cmFjdG9yJywgdGl0bGU6J3RpdGxlJyB9LAogICAgb25EZWxldGU6IGRlbEJ1aWxkaW5nLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oid6b25lJywgICAgICBsYWJlbDon4Liq4LmI4Lin4LiZ4LiC4Lit',
  '4LiH4Lit4Liy4LiE4Liy4LijJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ2J1aWxkaW5nWm9uZXMnKSwgcmVxdWlyZWQ6dHJ1ZSB9LAogICAgICB7IGtleTondGl0bGUnLCAgICAgbGFiZWw6J+C4o+C4suC4ouC4geC4suC4o+C4i+C5iOC4reC4oeC5geC4',
  'i+C4oScsIHR5cGU6J3RleHRhcmVhJywgcmVxdWlyZWQ6dHJ1ZSwgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidib29rRGF0ZScsICBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiZ4Lix4LiUJywgdHlwZTonZGF0ZScgfSwKICAgICAgeyBrZXk6J3N0YXJ0RGF0',
  'ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguYDguKPguLTguYjguKHguJTguLPguYDguJnguLTguJnguIHguLLguKMnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonZW5kRGF0ZScsICAgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC5geC4peC5ieC4',
  'p+C5gOC4quC4o+C5h+C4iCcsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCAgICBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ2J1aWxkaW5nU3RhdHVzZXMnKSB9LAogICAgICB7IGtleTonY29u',
  'dHJhY3RvcicsIGxhYmVsOifguJzguLnguYnguKPguLHguJrguYDguKvguKHguLIgLyDguKPguYnguLLguJknIH0sCiAgICAgIHsga2V5Oidjb3N0JywgICAgICBsYWJlbDon4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4LiiICjguJrguLLguJcpJywgdHlwZTon',
  'bW9uZXknIH0sCiAgICAgIHsga2V5OiduZXh0RHVlJywgICBsYWJlbDon4LiE4Lij4Lia4LiB4Liz4Lir4LiZ4LiU4Lij4Lit4Lia4LiW4Lix4LiU4LmE4LibJywgdHlwZTonZGF0ZScsIGhpbnQ6J+C5gOC4iuC5iOC4mSDguIHguLHguJnguIvguLbguKHguJTguLLg',
  'uJTguJ/guYnguLLguJfguLjguIEgMyDguJvguLUg4oCUIOC5g+C4quC5iOC4p+C4seC4meC4l+C4teC5iOC4hOC4o+C4seC5ieC4h+C4luC4seC4lOC5hOC4mycgfSwKICAgICAgeyBrZXk6J3Bob3RvcycsICAgIGxhYmVsOifguKDguLLguJ7guJvguKPguLDguIHg',
  'uK3guJonLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonc2xpcHMnLCAgICAgbGFiZWw6J+C5g+C4muC5gOC4quC4o+C5h+C4iCAvIOC4quC4peC4tOC4mycsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidub3Rl',
  'JywgICAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxCdWlsZGluZyhpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4LiH4Liy4LiZ4LiL4LmI',
  '4Lit4Lih4LiV4Li24LiB4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdidWlsZGluZy5kZWxldGUnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKHsgcXVpZXQ6IHRy',
  'dWUgfSk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3g',
  'uKPguYzguKE6IOC4guC5ieC4reC4oeC4ueC4peC4q+C5ieC4reC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybVJvb20ocmVjKXsKICBvcGVuRm9ybSh7CiAgICB0',
  'aXRsZTogJ+C4guC5ieC4reC4oeC4ueC4peC4q+C5ieC4reC4hyAnICsgKHJlYyA/IHJlYy5yb29tIDogJycpLAogICAgcmVjb3JkOiByZWMsIGFjdGlvbjogJ3Jvb20uc2F2ZScsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3Jvb20nLCAgIGxhYmVsOifguKvg',
  'uYnguK3guIcnLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidmbG9vcicsICBsYWJlbDon4LiK4Lix4LmJ4LiZJywgdHlwZTonbnVtYmVyJyB9LAogICAgICB7IGtleTonc3RhdHVzJywgbGFiZWw6J+C4quC4luC4suC4meC4sCcsIHR5cGU6J3NlbGVjdCcs',
  'IG9wdGlvbnM6b3B0KCdyb29tU3RhdHVzZXMnKSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J3RlbmFudCcsIGxhYmVsOifguIrguLfguYjguK3guJzguLnguYnguYDguIrguYjguLInIH0sCiAgICAgIHsga2V5OidwaG9uZScsICBsYWJlbDon4LmA4Lia4Lit',
  '4Lij4LmM4LiV4Li04LiU4LiV4LmI4LitJyB9LAogICAgICB7IGtleToncmVudCcsICAgbGFiZWw6J+C4hOC5iOC4suC5gOC4iuC5iOC4si/guYDguJTguLfguK3guJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScgfSwKICAgICAgeyBrZXk6J21vdmVJbicsIGxh',
  'YmVsOifguKfguLHguJnguJfguLXguYjguYDguILguYnguLLguK3guKLguLnguYgnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonbm90ZScsICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlIH0K',
  'ICAgIF0KICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZ4Lib4Lij4Liw4LiI4Liz4Lir4LmJ4Lit',
  '4LiHCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtQXNzZXQocmVjKXsKICB2YXIgcm9vbSA9IChyZWMgJiYgcmVjLnJvb20pIHx8ICcnOwogIG9wZW5Gb3JtKHsKICAg',
  'IHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4mScgOiAn4LmA4Lie4Li04LmI4Lih4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZ4LmD4LiZ4Lir4LmJ4Lit4LiHICcgKyByb29tLAogICAgcmVj',
  'b3JkOiByZWMgfHwgeyByb29tOiByb29tLCBzdGF0dXM6ICfguYPguIrguYnguIfguLLguJnguJvguIHguJXguLQnIH0sCiAgICBhY3Rpb246ICdhc3NldC5zYXZlJywKICAgIG9uRGVsZXRlOiByZWMgJiYgcmVjLmlkID8gZGVsQXNzZXQgOiBudWxsLAogICAgZmll',
  'bGRzOiBbCiAgICAgIHsga2V5Oidyb29tJywgICBsYWJlbDon4Lir4LmJ4Lit4LiHJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpyb29tT3B0aW9ucygpLCByZXF1aXJlZDp0cnVlLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleTonbmFtZScsICAgbGFiZWw6J+C4',
  'l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4mScsIHJlcXVpcmVkOnRydWUsIHBoOifguYDguIrguYjguJkg4LmB4Lit4Lij4LmMIMK3IOC5gOC4hOC4o+C4t+C5iOC4reC4h+C4l+C4s+C4meC5ieC4s+C4reC4uOC5iOC4mSDCtyDguJXguLnguYnguYDguKLguYfguJkn',
  'IH0sCiAgICAgIHsga2V5OidicmFuZCcsICBsYWJlbDon4Lii4Li14LmI4Lir4LmJ4LitL+C4o+C4uOC5iOC4mScgfSwKICAgICAgeyBrZXk6J3NlcmlhbCcsIGxhYmVsOidTZXJpYWwgTm8uJyB9LAogICAgICB7IGtleTonaW5zdGFsbERhdGUnLCAgbGFiZWw6J+C4',
  'p+C4seC4meC4l+C4teC5iOC4leC4tOC4lOC4leC4seC5ieC4hycsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5Oid3YXJyYW50eUVuZCcsICBsYWJlbDon4Lib4Lij4Liw4LiB4Lix4LiZ4Lir4Lih4LiU4Lit4Liy4Lii4Li4JywgdHlwZTonZGF0ZScgfSwKICAg',
  'ICAgeyBrZXk6J3N0YXR1cycsIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnYXNzZXRTdGF0dXNlcycpLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleToncHVyY2hhc2VJZCcsIGxhYmVsOifguK3guYnguLLguIfg',
  'uK3guLTguIfguKPguLLguKLguIHguLLguKPguIvguLfguYnguK0nLCBwaDon4Lij4Lir4Lix4Liq4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHICjguJbguYnguLLguKHguLUpJyB9LAogICAgICB7IGtleTonbm90ZScsICAgbGFiZWw6J+C4',
  'q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVsbDp0cnVlIH0KICAgIF0sCiAgICAvLyDguJ/guK3guKPguYzguKHguJnguLXguYnguYDguJvguLTguJTguIjguLLguIHguKvguJnguYnguLLguJXguYjguLLguIfguKPguLLguKLguKXg',
  'uLDguYDguK3guLXguKLguJTguKvguYnguK3guIcg4oCUIOC4muC4seC4meC4l+C4tuC4geC5gOC4quC4o+C5h+C4iOC5gOC4m+C4tOC4lOC4geC4peC4seC4muC5hOC4m+C4q+C4meC5ieC4suC5gOC4lOC4tOC4oQogICAgYWZ0ZXI6IGZ1bmN0aW9uKCl7IGlmIChy',
  'b29tICYmIHR5cGVvZiBvcGVuUm9vbSA9PT0gJ2Z1bmN0aW9uJykgb3BlblJvb20ocm9vbSk7IH0KICB9KTsKfQoKZnVuY3Rpb24gZGVsQXNzZXQoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4meC4iuC4tOC5ieC4',
  'meC4meC4teC5iT8nLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgnYXNzZXQuZGVsZXRlJywgeyBpZDogaWQgfSkKICAgICAgLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkK',
  'ICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog',
  '4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4ouC4q+C4rQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybUZpbmFuY2UocmVjKXsKICBvcGVuRm9y',
  'bSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguKPguLLguKLguIHguLLguKMnIDogJ+C4muC4seC4meC4l+C4tuC4geC4o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKInLAogICAgcmVjb3JkOiByZWMgfHwg',
  'eyBkYXRlOiB0b2RheSgpLCBjaGFubmVsOiAn4LmC4Lit4LiZIFFSJyB9LAogICAgYWN0aW9uOiAnZmluYW5jZS5zYXZlJywgYnVja2V0OiAnbWlzYycsCiAgICBvbkRlbGV0ZTogZGVsRmluYW5jZSwKICAgIGZpZWxkczogWwogICAgICB7IGtleTona2luZCcsICAg',
  'bGFiZWw6J+C4o+C4suC4ouC4geC4suC4oycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdmaW5hbmNlS2luZHMnKSwgcmVxdWlyZWQ6dHJ1ZSwgYmxhbms6ZmFsc2UsCiAgICAgICAgaGludDon4LmA4Lil4Li34Lit4LiBICLguKPguLLguKLguKPguLHguJrg',
  'uITguYjguLLguYDguIrguYjguLIiIOC4q+C4o+C4t+C4rSAi4Lij4Liy4Lii4Lij4Lix4Lia4Lit4Li34LmI4LiZIOC5hiIg4Lij4Liw4Lia4Lia4LiI4Liw4LiZ4Lix4Lia4LmA4Lib4LmH4LiZ4Lid4Lix4LmI4LiH4Lij4Liy4Lii4Lij4Lix4Lia4LmD4Lir4LmJ',
  '4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0JyB9LAogICAgICB7IGtleTonZGF0ZScsICAgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iCcsIHR5cGU6J2RhdGUnLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidhbW91bnQnLCBsYWJlbDon4LiI4Liz4LiZ',
  '4Lin4LiZ4LmA4LiH4Li04LiZICjguJrguLLguJcpJywgdHlwZTonbW9uZXknLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidiaWxsTW9udGgnLCBsYWJlbDon4Lij4Lit4Lia4Lia4Li04Lil4LiC4Lit4LiH4LmA4LiU4Li34Lit4LiZJywgcGg6J+C5gOC4',
  'iuC5iOC4mSDguIEu4LiELiAyNTY5JyB9LAogICAgICB7IGtleTonY2hhbm5lbCcsIGxhYmVsOifguIrguYjguK3guIfguJfguLLguIcnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnZmluYW5jZUNoYW5uZWxzJykgfSwKICAgICAgeyBrZXk6J3NsaXBzJywg',
  'IGxhYmVsOifguKrguKXguLTguJsgLyDguYPguJrguYDguKrguKPguYfguIgnLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonbm90ZScsICAgbGFiZWw6J+C4q+C4oeC4suC4ouC5gOC4q+C4leC4uCcsIHR5cGU6J3RleHRhcmVhJywgZnVs',
  'bDp0cnVlIH0KICAgIF0KICB9KTsKfQoKZnVuY3Rpb24gZGVsRmluYW5jZShpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4Lij4Liy4Lii4LiB4Liy4Lij4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdmaW5hbmNlLmRlbGV0ZScsIHsgaWQ6',
  'IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoK',
  'LyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4quC4s+C4o+C4reC4hyAvIOC4geC4ueC5ieC4hOC4t+C4meC4guC5ieC4reC4oeC4ueC4pQogICA9PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZG9FeHBvcnRKc29uKCl7CiAgdG9hc3QoJ+C4geC4s+C4peC4seC4h+C5gOC4leC4o+C4teC4ouC4oeC5hOC4n+C4peC5jOC4quC4s+C4o+C4reC4h+KApicpOwogIGNhbGxBcGko',
  'J2JhY2t1cC5leHBvcnQnLCB7fSkudGhlbihmdW5jdGlvbihkdW1wKXsKICAgIHNhdmVUZXh0RmlsZSgndGhlLW0tY29ybmVyLWFwLWJhY2t1cC0nICsgdG9kYXkoKSArICcuanNvbicsCiAgICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoZHVtcCwgbnVsbCwg',
  'MSksICdhcHBsaWNhdGlvbi9qc29uJyk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwgJ2VycicpOyB9KTsKfQoKZnVuY3Rpb24gZG9FeHBvcnRDc3Yoc2hlZXQpewogIGNhbGxBcGkoJ2JhY2t1cC5jc3YnLCB7IHNoZWV0OiBzaGVl',
  'dCB9KS50aGVuKGZ1bmN0aW9uKHIpewogICAgc2F2ZVRleHRGaWxlKHIuZmlsZW5hbWUsIHIuY29udGVudCwgJ3RleHQvY3N2Jyk7CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwgJ2VycicpOyB9KTsKfQoKLyoqIOC4lOC4suC4p+C4',
  'meC5jOC5guC4q+C4peC4lOC5hOC4n+C4peC5jCDigJQg4LmD4LiK4LmJIGRvd25sb2FkcyBjYXBhYmlsaXR5IOC4luC5ieC4suC4oeC4tSDguYTguKHguYjguIfguLHguYnguJnguYPguIrguYnguKXguLTguIfguIHguYzguJvguIHguJXguLQgKi8KZnVuY3Rpb24g',
  'c2F2ZVRleHRGaWxlKGZpbGVuYW1lLCBjb250ZW50LCBtaW1lKXsKICBpZiAodHlwZW9mIHdpbmRvdy5zYXZlVmlhSG9zdCA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJuIHdpbmRvdy5zYXZlVmlhSG9zdChmaWxlbmFtZSwgY29udGVudCwgbWltZSk7CiAgdmFyIGJsb2Ig',
  'PSBuZXcgQmxvYihbY29udGVudF0sIHsgdHlwZTogbWltZSArICc7Y2hhcnNldD11dGYtOCcgfSk7CiAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7CiAgYS5ocmVmID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTsKICBhLmRvd25sb2FkID0g',
  'ZmlsZW5hbWU7CiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhKTsgYS5jbGljaygpOwogIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgVVJMLnJldm9rZU9iamVjdFVSTChhLmhyZWYpOyBhLnJlbW92ZSgpOyB9LCAxMDAwKTsKICB0b2FzdCgn4LiU4Liy4Lin4LiZ',
  '4LmM4LmC4Lir4Lil4LiUICcgKyBmaWxlbmFtZSArICcg4LmB4Lil4LmJ4LinJywgJ29rJyk7Cn0KCmZ1bmN0aW9uIGRvSW1wb3J0SnNvbigpewogIG9wZW5Nb2RhbCgn4qyG77iPIOC4geC4ueC5ieC4hOC4t+C4meC4iOC4suC4geC5hOC4n+C4peC5jOC4quC4s+C4',
  'o+C4reC4hycsCiAgICAnPHAgY2xhc3M9ImZzMTMiPuC5gOC4peC4t+C4reC4geC5hOC4n+C4peC5jCA8Yj4uanNvbjwvYj4g4LiX4Li14LmI4LmA4LiE4Lii4LiU4Liy4Lin4LiZ4LmM4LmC4Lir4Lil4LiU4LmE4Lin4LmJPC9wPicgKwogICAgJzxsYWJlbCBjbGFz',
  'cz0iZmlsZS1kcm9wIiBmb3I9ImltcEZpbGUiPvCfk4Qg4LmA4Lil4Li34Lit4LiB4LmE4Lif4Lil4LmM4Liq4Liz4Lij4Lit4LiHJyArCiAgICAgICc8aW5wdXQgdHlwZT0iZmlsZSIgaWQ9ImltcEZpbGUiIGFjY2VwdD0iYXBwbGljYXRpb24vanNvbiwuanNvbiIg',
  'c3R5bGU9ImRpc3BsYXk6bm9uZSIgJyArCiAgICAgICdvbmNoYW5nZT0iZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCdpbXBOYW1lXCcpLnRleHRDb250ZW50PXRoaXMuZmlsZXNbMF0/dGhpcy5maWxlc1swXS5uYW1lOlwnXCciPjwvbGFiZWw+JyArCiAgICAnPGRp',
  'diBjbGFzcz0iZnMxMiBtdXRlZCBtdDgiIGlkPSJpbXBOYW1lIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iZiI+PGxhYmVsPuC4p+C4tOC4mOC4teC4geC4ueC5ieC4hOC4t+C4mTwvbGFiZWw+JyArCiAg',
  'ICAnPHNlbGVjdCBjbGFzcz0ic2VsIiBpZD0iaW1wTW9kZSI+JyArCiAgICAgICc8b3B0aW9uIHZhbHVlPSJtZXJnZSI+4LmA4Lie4Li04LmI4Lih4LmA4LiJ4Lie4Liy4Liw4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li1',
  'ICjguYHguJnguLDguJnguLMpPC9vcHRpb24+JyArCiAgICAgICc8b3B0aW9uIHZhbHVlPSJyZXBsYWNlIj7guKXguYnguLLguIfguILguYnguK3guKHguLnguKXguYDguJTguLTguKHguYHguKXguYnguKfguYHguJfguJnguJfguLXguYjguJfguLHguYnguIfguKvg',
  'uKHguJQ8L29wdGlvbj4nICsKICAgICc8L3NlbGVjdD48L2Rpdj4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBp',
  'ZD0iaW1wR28iPuC4geC4ueC5ieC4hOC4t+C4meC4guC5ieC4reC4oeC4ueC4pTwvYnV0dG9uPicpOwoKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW1wR28nKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsKICAgIHZhciBmID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5',
  'SWQoJ2ltcEZpbGUnKS5maWxlc1swXTsKICAgIGlmICghZikgcmV0dXJuIHRvYXN0KCfguIHguKPguLjguJPguLLguYDguKXguLfguK3guIHguYTguJ/guKXguYzguIHguYjguK3guJknLCAnZXJyJyk7CiAgICB2YXIgbW9kZSA9IGRvY3VtZW50LmdldEVsZW1lbnRC',
  'eUlkKCdpbXBNb2RlJykudmFsdWU7CiAgICB2YXIgYnRuID0gdGhpczsgYnRuLmRpc2FibGVkID0gdHJ1ZTsgYnRuLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDguIHguLPguKXguLHguIfguIHguLnguYnguITguLfguJnigKYnOwogICAg',
  'dmFyIHIgPSBuZXcgRmlsZVJlYWRlcigpOwogICAgci5vbmxvYWQgPSBmdW5jdGlvbigpewogICAgICB2YXIgcGFyc2VkOwogICAgICB0cnkgeyBwYXJzZWQgPSBKU09OLnBhcnNlKHIucmVzdWx0KTsgfQogICAgICBjYXRjaCAoZSkgeyBidG4uZGlzYWJsZWQgPSBm',
  'YWxzZTsgYnRuLnRleHRDb250ZW50ID0gJ+C4geC4ueC5ieC4hOC4t+C4meC4guC5ieC4reC4oeC4ueC4pSc7IHJldHVybiB0b2FzdCgn4LmE4Lif4Lil4LmM4LmE4Lih4LmI4LmD4LiK4LmIIEpTT04g4LiX4Li14LmI4LiW4Li54LiB4LiV4LmJ4Lit4LiHJywgJ2Vy',
  'cicpOyB9CiAgICAgIGNhbGxBcGkoJ2JhY2t1cC5pbXBvcnQnLCB7IGRhdGE6IHBhcnNlZCwgbW9kZTogbW9kZSB9KS50aGVuKGZ1bmN0aW9uKHN0YXQpewogICAgICAgIGNsb3NlTW9kYWwoKTsKICAgICAgICB2YXIgbiA9IE9iamVjdC5rZXlzKHN0YXQpLnJlZHVj',
  'ZShmdW5jdGlvbihhLGspeyByZXR1cm4gYSArIChzdGF0W2tdfHwwKTsgfSwgMCk7CiAgICAgICAgdG9hc3QoJ+C4geC4ueC5ieC4hOC4t+C4meC4quC4s+C5gOC4o+C5h+C4iCAnICsgbiArICcg4Lij4Liy4Lii4LiB4Liy4LijJywgJ29rJyk7CiAgICAgICAgbG9h',
  'ZCh7IHF1aWV0OiB0cnVlIH0pOwogICAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTsgYnRuLnRleHRDb250ZW50ID0gJ+C4geC4ueC5ieC4hOC4t+C4meC4guC5ieC4reC4oeC4ueC4pSc7IHRvYXN0KGUubWVzc2Fn',
  'ZXx8ZSwgJ2VycicpOwogICAgICB9KTsKICAgIH07CiAgICByLnJlYWRBc1RleHQoZik7CiAgfTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4peC4tOC4h+C4geC5jOC5geC4iuC4',
  'o+C5jCDguYHguKXguLDguIHguLLguKPguKrguLPguKPguK3guIfguKXguIcgR29vZ2xlIERyaXZlCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKZnVuY3Rpb24gY29weVNoYXJlKCl7CiAg',
  'dmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NoYXJlVXJsJyk7CiAgaWYgKCFlbCkgcmV0dXJuOwogIGVsLnNlbGVjdCgpOwogIGlmIChuYXZpZ2F0b3IuY2xpcGJvYXJkKSB7CiAgICBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChlbC52YWx1',
  'ZSkKICAgICAgLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4hOC4seC4lOC4peC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC5geC4peC5ieC4pycsJ29rJyk7IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbigpeyB0b2FzdCgn4LiE4Lix4LiU4Lil4Lit',
  '4LiB4LmE4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIIOKAlCDguIHguJTguITguYnguLLguIfguJfguLXguYjguIrguYjguK3guIfguYHguKXguYnguKfguYDguKXguLfguK3guIHguITguLHguJTguKXguK3guIEnLCdlcnInKTsgfSk7CiAgfSBlbHNlIHsKICAgIHRy',
  'eSB7IGRvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7IHRvYXN0KCfguITguLHguJTguKXguK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYzguYHguKXguYnguKcnLCdvaycpOyB9CiAgICBjYXRjaCAoZSkgeyB0b2FzdCgn4LiE4Lix4LiU4Lil4Lit4LiB',
  '4LmE4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIIOKAlCDguIHguJTguITguYnguLLguIfguJfguLXguYjguIrguYjguK3guIfguYHguKXguYnguKfguYDguKXguLfguK3guIHguITguLHguJTguKXguK3guIEnLCdlcnInKTsgfQogIH0KfQoKZnVuY3Rpb24gZG9Sb3Rh',
  'dGVTaGFyZSgpewogIGNvbmZpcm1BY3Rpb24oJ+C4reC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC4iuC4uOC4lOC5g+C4q+C4oeC5iD8g4LiE4LiZ4LiX4Li14LmI4LiW4Li34Lit4Lil4Li04LiH4LiB4LmM4LmA4LiU4Li04Lih4LiI4Liw4LmA4Lib',
  '4Li04LiU4LmE4Lih4LmI4LmE4LiU4LmJ4Lit4Li14LiBJywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ3NoYXJlLnJvdGF0ZVRva2VuJywge30pLnRoZW4oZnVuY3Rpb24oKXsKICAgICAgdG9hc3QoJ+C4reC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5',
  'jOC4iuC4uOC4lOC5g+C4q+C4oeC5iOC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKZnVuY3Rpb24gZG9CYWNrdXBO',
  'b3coKXsKICB0b2FzdCgn4LiB4Liz4Lil4Lix4LiH4Liq4Liz4Lij4Lit4LiH4LiC4LmJ4Lit4Lih4Li54Lil4Lil4LiHIERyaXZl4oCmJyk7CiAgY2FsbEFwaSgnYmFja3VwLmJhY2t1cE5vdycsIHt9KS50aGVuKGZ1bmN0aW9uKHIpewogICAgdG9hc3QoJ+C4quC4',
  's+C4o+C4reC4h+C5geC4peC5ieC4pzogJyArIHIubmFtZSwgJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7Cn0KPC9zY3JpcHQ+CjxzY3JpcHQ+Ym9vdCgpOzwv',
  'c2NyaXB0Pgo8L2JvZHk+CjwvaHRtbD4K'
].join('');

function indexHtml_() {
  return Utilities.newBlob(Utilities.base64Decode(INDEX_HTML_B64), 'text/html')
    .getDataAsString('UTF-8');
}
