/**
 * The M Corner AP — ระบบบริหารหอพัก (ไฟล์เดียวจบ)
 * ไฟล์นี้สร้างอัตโนมัติจากโฟลเดอร์ src/ เมื่อ 2026-10-22 14:53 UTC
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
  VERSION: '1.7.1',
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

function revokeAllSessions_(username) {
  var u = normUsername_(username);
  var rows = readRows_(SHEETS.SESSIONS);
  for (var i = rows.length - 1; i >= 0; i--) {
    if (normUsername_(rows[i].username) === u) deleteRow_(SHEETS.SESSIONS, rows[i]._row, rows[i]);
  }
  return true;
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

/**
 * คำสั่งที่เขียนลงชีต — ทำทีละคำสั่งเท่านั้น
 * ชีตไม่มี transaction ถ้าสองคนบันทึก/ลบพร้อมกัน เลขแถวที่อ่านไว้จะเลื่อน
 * และการล้างรายการหมดอายุตอนล็อกอินก็ลบแถวเหมือนกัน — ให้รอคิวกันทีละคน
 * (คำสั่งอ่านไม่ต้องรอ หน้าเว็บจึงไม่ช้าลง)
 */
var WRITE_ACTIONS = /\.(save|delete|savePayment|deletePayment|reconcile|setStatus|bulkBook|toggle|import|backupNow|rotateToken|send|login|unlock|logout|setPin|forgetDevice|forgetAllDevices|changePassword|resetPin|signOutAll)$/;

function api(action, payload) {
  payload = payload || {};
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
  'app.alerts': function () { return alertCenter_(); },
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
  'dFVybCA/ICc8YnI+PGEgaHJlZj0iJyArIGVzYyhzYWZlVXJsKGIuc2hlZXRVcmwpKSArICciIHRhcmdldD0iX2JsYW5rIiByZWw9Im5vb3BlbmVyIj7guYDguJvguLTguJQgR29vZ2xlIFNoZWV0IOKGlzwvYT4nIDogJycpICsKICAgICh1LnNpZ25lZEluICYmIHUu',
  'dXNlcm5hbWUKICAgICAgPyAnPGJyPjxhIGhyZWY9ImphdmFzY3JpcHQ6dm9pZCgwKSIgb25jbGljaz0iY29uZmlybUxvZ291dCgpIj7guK3guK3guIHguIjguLLguIHguKPguLDguJrguJo8L2E+JwogICAgICA6ICcnKTsKfQoKZnVuY3Rpb24gcmVuZGVyTmF2KCl7',
  'CiAgdmFyIGh0bWwgPSAnJzsKICBQQUdFUy5mb3JFYWNoKGZ1bmN0aW9uKHApewogICAgaWYgKHAuc2VjKSBodG1sICs9ICc8ZGl2IGNsYXNzPSJuYXYtc2VjIj4nICsgcC5zZWMgKyAnPC9kaXY+JzsKICAgIGh0bWwgKz0gJzxidXR0b24gY2xhc3M9Im5hdi1pdGVt',
  'IiBpZD0ibmF2LScgKyBwLmlkICsgJyIgb25jbGljaz0iZ28oJyArIGpzcShwLmlkKSArICcpIj4nICsKICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9ImljIj4nICsgcC5pYyArICc8L3NwYW4+PHNwYW4+JyArIHAubGFiZWwgKyAnPC9zcGFuPicgKwogICAgICAg',
  'ICAgICAgICc8c3BhbiBjbGFzcz0iYmFkZ2UiIGlkPSJiYWRnZS0nICsgcC5pZCArICciIHN0eWxlPSJkaXNwbGF5Om5vbmUiPjwvc3Bhbj4nICsKICAgICAgICAgICAgJzwvYnV0dG9uPic7CiAgfSk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdkxpc3Qn',
  'KS5pbm5lckhUTUwgPSBodG1sOwogIHJlbmRlclRhYnMoKTsKfQoKLyoqCiAqIOC5geC4luC4muC4peC5iOC4suC4h+C4quC4s+C4q+C4o+C4seC4muC4oeC4t+C4reC4luC4t+C4rSDigJQg4LmD4LiK4LmJIFBBR0VTIOC4iuC4uOC4lOC5gOC4lOC4teC4ouC4p+C4',
  'geC4seC4muC5gOC4oeC4meC4ueC4guC5ieC4suC4hyDguYHguKXguLDguYDguKPguLXguKLguIEgZ28oKSDguJXguLHguKfguYDguJTguLXguKLguKfguIHguLHguJkKICog4LmE4Lih4LmI4LmE4LiU4LmJ4LmA4Lib4LmH4LiZ4Lir4LiZ4LmJ4Liy4LiI4Lit4LiE',
  '4LiZ4Lil4Liw4LiK4Li44LiUIOC5gOC4m+C5h+C4meC5geC4hOC5iOC4l+C4teC5iOC4p+C4suC4h+C4m+C4uOC5iOC4oeC4reC4teC4geC4l+C4teC5iOC4q+C4meC4tuC5iOC4h+C4guC4reC4h+C4guC5ieC4reC4oeC4ueC4peC5gOC4lOC4tOC4oQogKiDguJvg',
  'uLjguYjguKHguKrguLjguJTguJfguYnguLLguKLguYDguJvguLTguJTguKXguLTguYnguJnguIrguLHguIHguYDguKHguJnguLnguYDguJTguLTguKEg4LiI4Liw4LmE4LiU4LmJ4LmA4LiC4LmJ4Liy4LiW4Li24LiH4Lir4LiZ4LmJ4Liy4LiX4Li14LmI4LmA4Lir',
  '4Lil4Li34Lit4LmE4LiU4LmJ4LiE4Lij4LiaCiAqLwpmdW5jdGlvbiByZW5kZXJUYWJzKCl7CiAgdmFyIGJhciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YWJCYXInKTsKICBpZiAoIWJhcikgcmV0dXJuOwogIHZhciBodG1sID0gUEFHRVMuZmlsdGVyKGZ1',
  'bmN0aW9uKHApeyByZXR1cm4gcC50YWI7IH0pLm1hcChmdW5jdGlvbihwKXsKICAgIHJldHVybiAnPGJ1dHRvbiBjbGFzcz0idGFiIiBpZD0idGFiLScgKyBwLmlkICsgJyIgb25jbGljaz0iZ28oJyArIGpzcShwLmlkKSArICcpIiBhcmlhLWxhYmVsPSInICsgZXNj',
  'KHAubGFiZWwpICsgJyI+JyArCiAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9ImljIj4nICsgcC5pYyArICc8L3NwYW4+PHNwYW4gY2xhc3M9InRsIj4nICsgZXNjKHAudGFiKSArICc8L3NwYW4+JyArCiAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9ImJhZGdlIiBp',
  'ZD0idGFiYmFkZ2UtJyArIHAuaWQgKyAnIiBzdHlsZT0iZGlzcGxheTpub25lIj48L3NwYW4+JyArCiAgICAgICAgICAgJzwvYnV0dG9uPic7CiAgfSkuam9pbignJyk7CiAgYmFyLmlubmVySFRNTCA9IGh0bWwgKwogICAgJzxidXR0b24gY2xhc3M9InRhYiIgaWQ9',
  'InRhYi1tb3JlIiBvbmNsaWNrPSJ0b2dnbGVOYXYoKSIgYXJpYS1sYWJlbD0i4LmA4Lih4LiZ4Li54LiX4Lix4LmJ4LiH4Lir4Lih4LiUIj4nICsKICAgICAgJzxzcGFuIGNsYXNzPSJpYyI+4piwPC9zcGFuPjxzcGFuIGNsYXNzPSJ0bCI+4LmA4Lie4Li04LmI4Lih',
  '4LmA4LiV4Li04LihPC9zcGFuPicgKwogICAgICAnPHNwYW4gY2xhc3M9ImJhZGdlIiBpZD0idGFiYmFkZ2UtbW9yZSIgc3R5bGU9ImRpc3BsYXk6bm9uZSI+PC9zcGFuPicgKwogICAgJzwvYnV0dG9uPic7Cn0KCmZ1bmN0aW9uIGdvKHBhZ2UpewogIFMucGFnZSA9',
  'IHBhZ2U7CiAgUy5wYXJhbXMgPSB7fTsKICBsb2NhdGlvbi5oYXNoID0gcGFnZTsKICB2YXIgbWV0YSA9IFBBR0VTLmZpbHRlcihmdW5jdGlvbihwKXtyZXR1cm4gcC5pZD09PXBhZ2U7fSlbMF0gfHwgUEFHRVNbMF07CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQo',
  'J3BhZ2VUaXRsZScpLnRleHRDb250ZW50ID0gbWV0YS5sYWJlbDsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFnZVN1YicpLnRleHRDb250ZW50ID0gbWV0YS5zdWI7CiAgUEFHRVMuZm9yRWFjaChmdW5jdGlvbihwKXsKICAgIHZhciBlbCA9IGRvY3VtZW50',
  'LmdldEVsZW1lbnRCeUlkKCduYXYtJyArIHAuaWQpOwogICAgaWYgKGVsKSBlbC5jbGFzc0xpc3QudG9nZ2xlKCdvbicsIHAuaWQgPT09IHBhZ2UpOwogICAgdmFyIHRhYiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YWItJyArIHAuaWQpOwogICAgaWYgKHRh',
  'YikgdGFiLmNsYXNzTGlzdC50b2dnbGUoJ29uJywgcC5pZCA9PT0gcGFnZSk7CiAgfSk7CiAgLy8g4Lir4LiZ4LmJ4Liy4LiX4Li14LmI4LmE4Lih4LmI4Lih4Li14LmB4LiX4LmH4Lia4LiC4Lit4LiH4LiV4Lix4Lin4LmA4Lit4LiHIOC5g+C4q+C5ieC4m+C4uOC5',
  'iOC4oSAi4LmA4Lie4Li04LmI4Lih4LmA4LiV4Li04LihIiDguKrguKfguYjguLLguIfguYHguJfguJkg4LiI4Liw4LmE4LiU4LmJ4Lij4Li54LmJ4Lin4LmI4Liy4Lit4Lii4Li54LmI4LiV4Lij4LiH4LmE4Lir4LiZCiAgdmFyIG1vcmUgPSBkb2N1bWVudC5nZXRF',
  'bGVtZW50QnlJZCgndGFiLW1vcmUnKTsKICBpZiAobW9yZSkgbW9yZS5jbGFzc0xpc3QudG9nZ2xlKCdvbicsICFQQUdFUy5zb21lKGZ1bmN0aW9uKHApeyByZXR1cm4gcC50YWIgJiYgcC5pZCA9PT0gcGFnZTsgfSkpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlk',
  'KCduYXYnKS5jbGFzc0xpc3QucmVtb3ZlKCdvcGVuJyk7CiAgcmVtb3ZlU2NyaW0oKTsKICBsb2FkKCk7Cn0KCmZ1bmN0aW9uIHJlZnJlc2goKXsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9CgpmdW5jdGlvbiBzZXRZZWFyKHkpewogIFMueWVhciA9IHk7CiAgbG9h',
  'ZCgpOwp9CgovKioKICog4LmC4Lir4Lil4LiU4LiC4LmJ4Lit4Lih4Li54Lil4LiC4Lit4LiH4Lir4LiZ4LmJ4Liy4Lib4Lix4LiI4LiI4Li44Lia4Lix4LiZCiAqCiAqIEBwYXJhbSB7e3F1aWV0OmJvb2xlYW59PX0gb3B0cwogKiAgIHF1aWV0ID0g4LiL4Li04LiH',
  '4LiB4LmM4LmA4LiH4Li14Lii4LiaIOC5hiDguYDguJrguLfguYnguK3guIfguKvguKXguLHguIcg4LmE4Lih4LmI4Lil4LmJ4Liy4LiH4Lir4LiZ4LmJ4Liy4LmA4Lib4LmH4LiZ4Lin4LiH4LiB4Lil4Lih4Lir4Lih4Li44LiZIOC5geC4peC4sOC4hOC4t+C4meC4',
  'leC4s+C5geC4q+C4meC5iOC4h+C4l+C4teC5iOC5gOC4peC4t+C5iOC4reC4meC4hOC5ieC4suC4h+C5hOC4p+C5iQogKiAgICAgICAgICAg4LmD4LiK4LmJ4Lir4Lil4Lix4LiH4LiB4LiU4Lia4Lix4LiZ4LiX4Li24LiBIOC5geC4peC4sOC4leC4reC4meC4nuC4',
  'muC4p+C5iOC4suC4oeC4teC4hOC4meC5geC4geC5ieC4guC5ieC4reC4oeC4ueC4peC4iOC4suC4geC4l+C4teC5iOC4reC4t+C5iOC4mQogKiAgICAgICAgICAg4LmA4Lie4Li34LmI4Lit4LmD4Lir4LmJ4Lir4LiZ4LmJ4Liy4LiI4Lit4LiZ4Li04LmI4LiH4LiX',
  '4Li14LmI4Liq4Li44LiUIOC5hOC4oeC5iOC4geC4o+C4sOC4nuC4o+C4tOC4muC5geC4peC4sOC5hOC4oeC5iOC5gOC4lOC5ieC4h+C4geC4peC4seC4muC5hOC4m+C4muC4meC4quC4uOC4lAogKi8KZnVuY3Rpb24gbG9hZChvcHRzKXsKICBvcHRzID0gKG9wdHMg',
  'PT09IHRydWUpID8ge30gOiAob3B0cyB8fCB7fSk7ICAgICAvLyDguYDguJzguLfguYjguK3guYLguITguYnguJTguYDguIHguYjguLLguJfguLXguYjguYDguKPguLXguKLguIEgbG9hZCh0cnVlKQogIHZhciBxdWlldCA9ICEhb3B0cy5xdWlldDsKICB2YXIgdmll',
  'dyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aWV3Jyk7CiAgdmFyIHIgPSBST1VURVNbUy5wYWdlXTsKICBpZiAoIXIpIHsgdmlldy5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz0iZW1wdHkiPuC5hOC4oeC5iOC4nuC4muC4q+C4meC5ieC4suC4meC4teC5iTwv',
  'ZGl2Pic7IHJldHVybiBQcm9taXNlLnJlc29sdmUoKTsgfQoKICBpZiAoIXF1aWV0KSB7CiAgICB2aWV3LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj48c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPjwvZGl2PuC4geC4s+C4',
  'peC4seC4h+C5guC4q+C4peC4lOC4guC5ieC4reC4oeC4ueC4peKApjwvZGl2Pic7CiAgfSBlbHNlIHsKICAgIHN5bmNTZXQoJ3N5bmNpbmcnKTsKICB9CgogIHZhciBrZWVwID0gcXVpZXQgPyBzbmFwc2hvdFZpZXcoKSA6IG51bGw7CgogIHJldHVybiByLmxvYWQo',
  'KS50aGVuKGZ1bmN0aW9uKGRhdGEpewogICAgUy5jYWNoZVtTLnBhZ2VdID0gZGF0YTsKCiAgICAvLyDguKvguJnguYnguLLguYHguJXguYjguKXguLDguKvguJnguYnguLLguKHguLXguJvguLXguYPguKvguYnguYDguKXguLfguK3guIHguYTguKHguYjguYDguJfg',
  'uYjguLLguIHguLHguJkgKOC5gOC4iuC5iOC4meC4i+C4t+C5ieC4reC4guC4reC4h+C4oeC4teC4luC4tuC4h+C4m+C4tSAyNTYzIOC5geC4leC5iOC4o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKLguKHguLXguYHguITguYjguJvguLXguKXg',
  'uYjguLLguKrguLjguJQpCiAgICAvLyDguJbguYnguLLguJvguLXguJfguLXguYjguITguYnguLLguIfguK3guKLguLnguYjguYTguKHguYjguKHguLXguYPguJnguKvguJnguYnguLLguJnguLXguYkgc3luY1llYXJPcHRpb25zIOC4iOC4sOC4m+C4o+C4seC4muC4',
  'm+C4teC5g+C4q+C5iSDigJQg4LmB4LiV4LmI4LiC4LmJ4Lit4Lih4Li54Lil4LiX4Li14LmI4LmA4Lie4Li04LmI4LiH4LiU4Li24LiH4Lih4LiyCiAgICAvLyDguYDguJvguYfguJnguILguK3guIfguJvguLXguYDguIHguYjguLIg4Liq4LmI4Lin4LiZ4Lib4LmJ',
  '4Liy4Lii4LiB4Liz4LiB4Lix4Lia4LmD4LiK4LmJ4Lib4Li14LmD4Lir4Lih4LmIIOC4geC4peC4suC4ouC5gOC4m+C5h+C4meC4muC4reC4geC4p+C5iOC4siAi4Lii4Lit4LiU4LiL4Li34LmJ4LitIOC4m+C4tSAyMDI2ID0gMCDguJrguLLguJciCiAgICAvLyDg',
  'uJfguLHguYnguIfguJfguLXguYjguJvguLXguJnguLHguYnguJnguKHguLXguKLguK3guJTguIjguKPguLTguIcg4oCUIOC4leC5ieC4reC4h+C4lOC4tuC4h+C5g+C4q+C4oeC5iOC5g+C4q+C5ieC4leC4o+C4h+C4geC4seC4muC4m+C4teC4l+C4teC5iOC4m+C4',
  'o+C4seC4muC5geC4peC5ieC4pwogICAgdmFyIHllYXJCZWZvcmUgPSBTdHJpbmcoUy55ZWFyKTsKICAgIHN5bmNZZWFyT3B0aW9ucyhkYXRhLnllYXJzIHx8IGRhdGEuYXZhaWxhYmxlIHx8IFtdKTsKICAgIGlmIChTdHJpbmcoUy55ZWFyKSAhPT0geWVhckJlZm9y',
  'ZSAmJiAhb3B0cy5fcmV0cmllZCkgewogICAgICByZXR1cm4gbG9hZCh7IHF1aWV0OiBxdWlldCwgX3JldHJpZWQ6IHRydWUgfSk7CiAgICB9CgogICAgdmlldy5pbm5lckhUTUwgPSByLnJlbmRlcihkYXRhKTsKICAgIGxhYmVsQ2VsbHModmlldyk7CiAgICBhcHBs',
  'eVJlYWRPbmx5KHZpZXcpOwogICAgaWYgKHIuYWZ0ZXIpIHIuYWZ0ZXIoZGF0YSk7CiAgICBpZiAoa2VlcCkgcmVzdG9yZVZpZXcoa2VlcCk7CiAgICBpZiAocXVpZXQpIHN5bmNTZXQoJ3N5bmNlZCcpOwogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgaWYgKHF1',
  'aWV0KSB7ICAgICAgICAgICAgICAgICAgICAgICAvLyDguIvguLTguIfguIHguYzguYDguJrguLfguYnguK3guIfguKvguKXguLHguIfguJ7guKXguLLguJQg4oCUIOC4reC4ouC5iOC4suC4l+C4tOC5ieC4h+C4guC4reC4h+C4l+C4teC5iOC5gOC4q+C5h+C4meC4',
  'reC4ouC4ueC5iAogICAgICBzeW5jU2V0KGlzT2ZmbGluZUVycm9yKGUpID8gJ29mZmxpbmUnIDogJ2Vycm9yJywgZS5tZXNzYWdlIHx8IGUpOwogICAgICByZXR1cm47CiAgICB9CiAgICB2aWV3LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJjYXJkIj48ZGl2IGNs',
  'YXNzPSJjYXJkLWIiPjxoMz7guYLguKvguKXguJTguILguYnguK3guKHguLnguKXguYTguKHguYjguKrguLPguYDguKPguYfguIg8L2gzPicgKwogICAgICAgICAgICAgICAgICAgICAnPHAgY2xhc3M9Im11dGVkIj4nICsgZXNjKGUubWVzc2FnZXx8ZSkgKyAnPC9w',
  'PicgKwogICAgICAgICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJsb2FkKCkiPuC4peC4reC4h+C5g+C4q+C4oeC5iDwvYnV0dG9uPjwvZGl2PjwvZGl2Pic7CiAgfSk7Cn0KCi8qKiDguIjguLPguKrguKDguLLguJ7guKvguJnguYng',
  'uLLguIjguK3guYTguKfguYnguIHguYjguK3guJnguKfguLLguJTguYPguKvguKHguYgg4LmA4Lie4Li34LmI4Lit4LmD4Lir4LmJ4Lic4Li54LmJ4LmD4LiK4LmJ4Lij4Li54LmJ4Liq4Li24LiB4Lin4LmI4Liy4Lir4LiZ4LmJ4Liy4LmE4Lih4LmI4LmE4LiU4LmJ',
  '4LiW4Li54LiB4LmC4Lir4Lil4LiU4LmD4Lir4Lih4LmIICovCmZ1bmN0aW9uIHNuYXBzaG90VmlldygpewogIHZhciBvcGVuID0gW107CiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmJpbGwtbGluZXMnKS5mb3JFYWNoKGZ1bmN0aW9uKGVsKXsKICAgIGlm',
  'ICghZWwuaGlkZGVuKSBvcGVuLnB1c2goZWwuaWQpOwogIH0pOwogIHJldHVybiB7IHk6IHdpbmRvdy5zY3JvbGxZIHx8IDAsIG9wZW46IG9wZW4gfTsKfQoKZnVuY3Rpb24gcmVzdG9yZVZpZXcoa2VlcCl7CiAga2VlcC5vcGVuLmZvckVhY2goZnVuY3Rpb24oaWQp',
  'ewogICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpOwogICAgaWYgKGVsKSB7IGVsLmhpZGRlbiA9IGZhbHNlOyB2YXIgYiA9IGVsLnByZXZpb3VzRWxlbWVudFNpYmxpbmc7CiAgICAgICAgICAgICAgaWYgKGIpIGIudGV4dENvbnRlbnQgPSBi',
  'LnRleHRDb250ZW50LnJlcGxhY2UoJ+KWvicsICfilrQnKTsgfQogIH0pOwogIGlmIChrZWVwLnkpIHdpbmRvdy5zY3JvbGxUbygwLCBrZWVwLnkpOwp9CgovKiog4LmA4LiV4Li04Lih4LiV4Lix4Lin4LmA4Lil4Li34Lit4LiB4Lib4Li14LmD4LiZ4LmB4LiW4Lia',
  '4Lia4LiZ4LmD4Lir4LmJ4LiV4Lij4LiH4LiB4Lix4Lia4LiC4LmJ4Lit4Lih4Li54Lil4LiI4Lij4Li04LiH4LiC4Lit4LiH4Lir4LiZ4LmJ4Liy4LiZ4Lix4LmJ4LiZICovCmZ1bmN0aW9uIHN5bmNZZWFyT3B0aW9ucyh5ZWFycyl7CiAgdmFyIHNlbCA9IGRvY3Vt',
  'ZW50LmdldEVsZW1lbnRCeUlkKCd5ZWFyU2VsJyk7CiAgdmFyIGxpc3QgPSAoeWVhcnMgfHwgW10pLnNsaWNlKCkuc29ydChmdW5jdGlvbihhLGIpe3JldHVybiBiLWE7fSk7CiAgdmFyIGN1ciA9IG5ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKTsKICBpZiAobGlzdC5p',
  'bmRleE9mKGN1cikgPCAwKSBsaXN0LnVuc2hpZnQoY3VyKTsKICB2YXIgaHRtbCA9ICc8b3B0aW9uIHZhbHVlPSJhbGwiPuC4l+C4uOC4geC4m+C4tTwvb3B0aW9uPic7CiAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHkpewogICAgLy8g4LiE4LmI4Liy4LmD4LiZIG9w',
  'dGlvbiDguYDguJvguYfguJkg4LiELuC4qC4g4LmA4Liq4Lih4LitICjguJfguLHguYnguIfguKPguLDguJrguJrguYPguIrguYnguJvguLXguJnguLXguYnguK3guYnguLLguIfguK3guLTguIcpIOC4quC5iOC4p+C4meC4guC5ieC4reC4hOC4p+C4suC4oeC5geC4',
  'peC5ieC4p+C5geC4leC5iOC4l+C4teC5iOC4leC4seC5ieC4h+C5hOC4p+C5iQogICAgaHRtbCArPSAnPG9wdGlvbiB2YWx1ZT0iJyArIHkgKyAnIj7guJvguLUgJyArIGRpc3BsYXlZZWFyKHkpICsKICAgICAgICAgICAgKHVzZUJ1ZGRoaXN0WWVhcigpID8gJyAo',
  '4LiELuC4qC4gJyArIHkgKyAnKScgOiAnJykgKyAnPC9vcHRpb24+JzsKICB9KTsKICBzZWwuaW5uZXJIVE1MID0gaHRtbDsKICBpZiAobGlzdC5pbmRleE9mKE51bWJlcihTLnllYXIpKSA8IDAgJiYgUy55ZWFyICE9PSAnYWxsJykgUy55ZWFyID0gU3RyaW5nKGN1',
  'cik7CiAgc2VsLnZhbHVlID0gUy55ZWFyOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC5guC4q+C4oeC4lOC4lOC4ueC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pyAtLS0tLS0tLS0tLS0tLS0tCiAgIOC4neC4seC5iOC4h+C5gOC4i+C4tOC4o+C5jOC4n+C5',
  'gOC4p+C4reC4o+C5jOC4geC4seC4meC5hOC4p+C5ieC5geC4peC5ieC4p+C5g+C4meC4n+C4seC4h+C4geC5jOC4iuC4seC4mSBhcGkoKSDguJXguKPguIfguJnguLXguYnguYHguITguYjguIvguYjguK3guJnguJvguLjguYjguKHguJfguLXguYjguIHguJTguYTg',
  'uJvguIHguYfguJfguLPguYTguKHguYjguYTguJTguYkKICAg4LmA4Lie4Li34LmI4Lit4LmE4Lih4LmI4LmD4Lir4LmJ4Lic4Li54LmJ4LiX4Li14LmI4LmA4Lib4Li04LiU4LiU4LmJ4Lin4Lii4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4Liq4Lix4Lia4Liq',
  '4LiZICovCnZhciBFRElUX0VOVFJZUE9JTlRTID0gL1xiKGZvcm1EZWJ0fGZvcm1EZWJ0UGF5bWVudHxmb3JtUHVyY2hhc2V8Zm9ybUFjfGZvcm1CdWxrQWN8Zm9ybVJlcGFpcnxmb3JtQnVpbGRpbmd8Zm9ybVJvb218Zm9ybUZpbmFuY2V8Zm9ybVVzZXJ8ZGVsRGVi',
  'dHxkZWxEZWJ0UGF5bWVudHxkZWxQdXJjaGFzZXxkZWxBY3xkZWxSZXBhaXJ8ZGVsQnVpbGRpbmd8ZGVsRmluYW5jZXxkZWxVc2VyfGRvSW1wb3J0SnNvbnxkb1JvdGF0ZVNoYXJlfGRvQmFja3VwTm93fHNhdmVTZXR0aW5nc0Zvcm0pXHMqXCgvOwoKZnVuY3Rpb24g',
  'YXBwbHlSZWFkT25seShyb290KXsKICBpZiAoY2FuRWRpdCgpKSByZXR1cm47CiAgdmFyIG5vZGVzID0gcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCdbb25jbGlja10nKTsKICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7CiAgICBpZiAoRURJ',
  'VF9FTlRSWVBPSU5UUy50ZXN0KG5vZGVzW2ldLmdldEF0dHJpYnV0ZSgnb25jbGljaycpIHx8ICcnKSkgbm9kZXNbaV0ucmVtb3ZlKCk7CiAgfQp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4o+C4teC5gOC4n+C4o+C4iuC4reC4seC4leC5guC4meC4oeC4seC4leC4',
  'tOC5gOC4oeC4t+C5iOC4reC4guC5ieC4reC4oeC4ueC4peC5g+C4meC4iuC4teC4leC5gOC4m+C4peC4teC5iOC4ouC4mSAtLS0tLS0tLS0tLS0tLS0tCgogICDguIHguI7guYDguKvguKXguYfguIHguILguK3guIfguKrguYjguKfguJnguJnguLXguYk6IOC4q+C5',
  'ieC4suC4oeC5guC4q+C4peC4lOC4l+C4seC4muC4quC4tOC5iOC4h+C4l+C4teC5iOC4nOC4ueC5ieC5g+C4iuC5ieC4geC4s+C4peC4seC4h+C4nuC4tOC4oeC4nuC5jOC4reC4ouC4ueC5iOC5gOC4lOC5h+C4lOC4guC4suC4lAogICDguJbguYnguLLguKHguLXg',
  'uILguYnguK3guKHguLnguKXguYPguKvguKHguYjguJXguK3guJnguJfguLXguYjguJzguLnguYnguYPguIrguYnguIHguLPguKXguLHguIfguIHguKPguK3guIHguK3guKLguLnguYgg4LmD4Lir4LmJ4LiC4Li24LmJ4LiZ4Lib4Li44LmI4Lih4LmA4Lil4LmH4LiB',
  'IOC5hiDguYPguKvguYnguIHguJTguYDguK3guIfguYDguKHguLfguYjguK3guJ7guKPguYnguK3guKEKCiAgIOC4q+C4oeC4suC4ouC5gOC4q+C4leC4uDog4Lij4Li44LmI4LiZ4LiC4LmJ4Lit4Lih4Li54Lil4LiU4Li54LiI4Liy4LiBICLguYDguKfguKXguLLg',
  'uJfguLXguYjguIrguLXguJXguJbguLnguIHguYHguIHguYnguKXguYjguLLguKrguLjguJQiIOC4guC4reC4hyBHb29nbGUgRHJpdmUKICAg4LiL4Li24LmI4LiH4LiC4Lii4Lix4Lia4LiX4Li44LiB4LiE4Lij4Lix4LmJ4LiH4LiX4Li14LmI4Lih4Li14LiB4Liy',
  '4Lij4LmA4LiC4Li14Lii4LiZIOC4o+C4p+C4oeC4luC4tuC4h+C4leC4reC4meC4l+C4teC5iOC5gOC4o+C4suC5gOC4reC4h+C4geC4lOC4muC4seC4meC4l+C4tuC4geC4lOC5ieC4p+C4ogogICDguIjguLbguIfguJXguYnguK3guIfguIjguJTguKPguLjguYjg',
  'uJnguYPguKvguKHguYjguYTguKfguYnguKvguKXguLHguIfguJrguLHguJnguJfguLbguIHguJfguLjguIHguITguKPguLHguYnguIcg4LmE4Lih4LmI4LiH4Lix4LmJ4LiZ4LiI4Liw4LmC4Lir4Lil4LiU4LiL4LmJ4Liz4LmB4Lil4Liw4LiC4Li24LmJ4LiZ4LiC',
  '4LmJ4Lit4LiE4Lin4Liy4LihCiAgIOC4p+C5iOC4siAi4Lih4Li14LiE4LiZ4LmB4LiB4LmJ4LiC4LmJ4Lit4Lih4Li54LilIiDguJfguLHguYnguIfguJfguLXguYjguITguJnguYHguIHguYnguITguLfguK3guJzguLnguYnguYPguIrguYnguYDguK3guIcKLS0t',
  'LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovCgovKiog4LiE4Liz4Liq4Lix4LmI4LiH4LiX4Li14LmI4LiX4Liz4LmD4Lir4LmJ4LiC4LmJ4Lit4Lih4Li54Lil4LmD4LiZ4LiK4Li14LiV4LmA',
  '4Lib4Lil4Li14LmI4Lii4LiZICjguYPguKvguYnguJXguKPguIfguIHguLHguJogTVVUQVRJTkdfQUNUSU9OUyDguJ3guLHguYjguIfguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYwpICovCnZhciBDTElFTlRfTVVUQVRJTkcgPSAvXC4oc2F2ZXxkZWxl',
  'dGV8c2F2ZVBheW1lbnR8ZGVsZXRlUGF5bWVudHxidWxrQm9va3xpbXBvcnR8cm90YXRlVG9rZW58YmFja3VwTm93fHVwbG9hZHx0cmFzaHx0b2dnbGV8c2V0U3RhdHVzfHJlY29uY2lsZSkkLzsKCi8qKgogKiDguYDguJ7guLTguYjguIfguIHguJTguJrguLHguJng',
  'uJfguLbguIHguYDguK3guIcg4oCUIOC4q+C4meC5ieC4suC5guC4q+C4peC4lOC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C4oeC5iOC5hOC4m+C5geC4peC5ieC4p+C4leC4reC4meC4geC4lOC4muC4seC4meC4l+C4tuC4gQogKiDguIjguJTguKPguLjguYjguJng',
  'uILguYnguK3guKHguLnguKXguKXguYjguLLguKrguLjguJTguYTguKfguYkg4LmB4Lil4Liw4LiB4Lix4LiZ4LmE4Lih4LmI4LmD4Lir4LmJ4Lij4Lit4Lia4LiV4Lij4Lin4LiI4LiW4Lix4LiU4LmE4Lib4LmC4Lir4Lil4LiU4LiL4LmJ4LizCiAqICjguYDguJzg',
  'uLfguYjguK3guYTguKfguYkgMiDguJnguLLguJfguLUg4LmA4Lie4Lij4Liy4LiwIEdvb2dsZSBEcml2ZSDguK3guLHguJvguYDguJTguJXguYDguKfguKXguLLguYHguIHguYnguYTguILguIrguYnguLLguIHguKfguYjguLLguIHguLLguKPguYDguILguLXguKLg',
  'uJnguIjguKPguLTguIfguYDguKXguYfguIHguJnguYnguK3guKIpCiAqLwpmdW5jdGlvbiBtYXJrU2VsZkNoYW5nZSgpewogIFMuc2VsZkNoYW5nZVVudGlsID0gRGF0ZS5ub3coKSArIDEyMDAwMDsKICBjbGVhclRpbWVvdXQoUy5zeW5jVGltZXIpOwogIFMuc3lu',
  'Y1RpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpewogICAgc3luY1ZlcnNpb24oKTsKICAgIHJlZnJlc2hBbGVydHMoKTsgICAgIC8vIOC4h+C4suC4meC4hOC5ieC4suC4h+C4reC4suC4iOC5gOC4nuC4tOC5iOC4oeC4q+C4o+C4t+C4reC4peC4lOC4iOC4suC4',
  'geC4quC4tOC5iOC4h+C4l+C4teC5iOC5gOC4nuC4tOC5iOC4h+C4muC4seC4meC4l+C4tuC4geC5hOC4mwogIH0sIDE1MDApOwp9CgpmdW5jdGlvbiBzeW5jVmVyc2lvbigpewogIGNhbGxBcGkoJ2FwcC52ZXJzaW9uJykKICAgIC50aGVuKGZ1bmN0aW9uKHYpeyBp',
  'ZiAodiAmJiB2LnZlcnNpb24pIFMudmVyc2lvbiA9IHYudmVyc2lvbjsgfSkKICAgIC5jYXRjaChmdW5jdGlvbigpeyAvKiDguYTguKfguYnguKPguK3guJrguKvguJnguYnguLIgKi8gfSk7Cn0KCi8qKiDguJzguLnguYnguYPguIrguYnguIHguLPguKXguLHguIfg',
  'uIHguKPguK3guIHguILguYnguK3guKHguLnguKXguK3guKLguLnguYjguKvguKPguLfguK3guYDguJvguKXguYjguLIg4oCUIOC4luC5ieC4suC5g+C4iuC5iCDguKvguYnguLLguKHguYLguKvguKXguJTguJfguLHguJogKi8KZnVuY3Rpb24gdXNlcklzQnVzeSgp',
  'ewogIHZhciBtb2RhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb2RhbFJvb3QnKTsKICBpZiAobW9kYWwgJiYgbW9kYWwuaW5uZXJIVE1MKSByZXR1cm4gdHJ1ZTsgICAgICAgICAgICAgIC8vIOC4n+C4reC4o+C5jOC4oeC5gOC4m+C4tOC4lOC4hOC5ieC4',
  'suC4h+C4reC4ouC4ueC5iAogIHZhciBlbCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7CiAgaWYgKGVsICYmIC9eKElOUFVUfFRFWFRBUkVBfFNFTEVDVCkkLy50ZXN0KGVsLnRhZ05hbWUpICYmCiAgICAgIGVsLnR5cGUgIT09ICdidXR0b24nICYmIGVsLnR5cGUg',
  'IT09ICdzdWJtaXQnKSByZXR1cm4gdHJ1ZTsgICAvLyDguYDguITguK3guKPguYzguYDguIvguK3guKPguYzguK3guKLguLnguYjguYPguJnguIrguYjguK3guIfguIHguKPguK3guIEKICByZXR1cm4gZmFsc2U7Cn0KCmZ1bmN0aW9uIHJlZnJlc2hMYWJlbChzZWMp',
  'ewogIGlmICghc2VjKSByZXR1cm4gJ+C4m+C4tOC4lOC4geC4suC4o+C4leC4o+C4p+C4iOC4reC4seC4leC5guC4meC4oeC4seC4leC4tCc7CiAgaWYgKHNlYyAlIDM2MDAgPT09IDApIHJldHVybiAn4LiV4Lij4Lin4LiI4LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir',
  '4Lih4LmI4LiX4Li44LiBICcgKyAoc2VjIC8gMzYwMCkgKyAnIOC4iuC4seC5iOC4p+C5guC4oeC4hyc7CiAgaWYgKHNlYyAlIDYwID09PSAwKSByZXR1cm4gJ+C4leC4o+C4p+C4iOC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C4oeC5iOC4l+C4uOC4gSAnICsgKHNl',
  'YyAvIDYwKSArICcg4LiZ4Liy4LiX4Li1JzsKICByZXR1cm4gJ+C4leC4o+C4p+C4iOC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C4oeC5iOC4l+C4uOC4gSAnICsgc2VjICsgJyDguKfguLTguJnguLLguJfguLUnOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4leC4',
  'seC4p+C4muC4reC4geC4quC4luC4suC4meC4sOC4geC4suC4o+C4i+C4tOC4h+C4geC5jCAo4Lih4Li44Lih4LiC4Lin4Liy4Lia4LiZKSAtLS0tLS0tLS0tLS0tLS0tCgogICDguKvguJnguYnguLLguJfguLXguYg6IOC4muC4reC4geC5g+C4q+C5ieC4o+C4ueC5',
  'ieC4leC4peC4reC4lOC4p+C5iOC4suC4leC4reC4meC4meC4teC5ieC4guC5ieC4reC4oeC4ueC4peC4leC4o+C4h+C4geC4seC4muC4q+C4peC4seC4h+C4muC5ieC4suC4meC4q+C4o+C4t+C4reC4ouC4seC4hwogICDguIHguLPguKXguLHguIfguJrguLHguJng',
  'uJfguLbguIHguK3guKLguLnguYjguYTguKvguKEg4Lir4Lij4Li34Lit4Lih4Li14Lit4Liw4LmE4Lij4LiE4LmJ4Liy4LiH4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LiI4Lix4LiU4LiB4Liy4LijCgogICDguJXguLHguYnguIfguYPguIjguYPguKvguYkgIuC5gOC4',
  'h+C4teC4ouC4muC5gOC4oeC4t+C5iOC4reC4l+C4uOC4geC4reC4ouC5iOC4suC4h+C4m+C4geC4leC4tCDguYHguKXguLDguIrguLHguJTguYDguIjguJnguYDguKHguLfguYjguK3guKHguLXguK3guLDguYTguKPguJzguLTguJTguJvguIHguJXguLQiCiAgIOC4',
  'quC4luC4suC4meC4sOC4l+C4teC5iOC4leC5ieC4reC4h+C5g+C4q+C5ieC4nOC4ueC5ieC5g+C4iuC5ieC4l+C4s+C4reC4sOC5hOC4o+C4leC5iOC4rSAo4Lih4Li14LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmIIC8g4LmA4LiK4Li34LmI4Lit4Lih4LiV',
  '4LmI4Lit4LmE4Lih4LmI4LmE4LiU4LmJKSDguIHguJTguYTguJTguYkKLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovCgp2YXIgU1lOQyA9IHsgc3RhdGU6ICdzeW5jZWQnLCBkZXRhaWw6',
  'ICcnLCBhdDogMCwgdGltZXI6IG51bGwgfTsKCnZhciBTWU5DX0xPT0sgPSB7CiAgc3luY2VkOiAgeyBjbHM6ICdvaycsICAgaWNvbjogJ+KXjycsICB0ZXh0OiAn4LiL4Li04LiH4LiB4LmM4LmB4Lil4LmJ4LinJyB9LAogIHN5bmNpbmc6IHsgY2xzOiAnaW5mbycs',
  'IGljb246ICcnLCAgIHRleHQ6ICfguIHguLPguKXguLHguIfguIvguLTguIfguIHguYzigKYnLCAgIHNwaW46IHRydWUgfSwKICBzYXZpbmc6ICB7IGNsczogJ2luZm8nLCBpY29uOiAnJywgICB0ZXh0OiAn4LiB4Liz4Lil4Lix4LiH4Lia4Lix4LiZ4LiX4Li24LiB',
  '4oCmJywgIHNwaW46IHRydWUgfSwKICBzYXZlZDogICB7IGNsczogJ29rJywgICBpY29uOiAn4pyTJywgIHRleHQ6ICfguJrguLHguJnguJfguLbguIHguYHguKXguYnguKcnIH0sCiAgcGVuZGluZzogeyBjbHM6ICd3YXJuJywgaWNvbjogJ+KGuycsICB0ZXh0OiAn',
  '4Lih4Li14LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmIJywgIGNsaWNrOiAnbG9hZFBlbmRpbmcoKScgfSwKICBvZmZsaW5lOiB7IGNsczogJ2RncicsICBpY29uOiAn4pqgJywgIHRleHQ6ICfguYDguIrguLfguYjguK3guKHguJXguYjguK3guYTguKHguYjg',
  'uYTguJTguYknLCBjbGljazogJ3JldHJ5U3luYygpJyB9LAogIGVycm9yOiAgIHsgY2xzOiAnZGdyJywgIGljb246ICfimqAnLCAgdGV4dDogJ+C4muC4seC4meC4l+C4tuC4geC5hOC4oeC5iOC4quC4s+C5gOC4o+C5h+C4iCcsIGNsaWNrOiAncmV0cnlTeW5jKCkn',
  'IH0sCiAgcGF1c2VkOiAgeyBjbHM6ICdtdXRlJywgaWNvbjogJ+KXiycsICB0ZXh0OiAn4LmE4Lih4LmI4LiV4Lij4Lin4LiI4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0JywgY2xpY2s6ICdsb2FkUGVuZGluZygpJyB9Cn07CgovKioKICogQHBhcmFtIHtzdHJp',
  'bmd9IHN0YXRlIOC4iuC4t+C5iOC4reC4quC4luC4suC4meC4sOC5g+C4mSBTWU5DX0xPT0sKICogQHBhcmFtIHtzdHJpbmc9fSBkZXRhaWwg4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Lit4LiY4Li04Lia4Liy4Lii4LmA4Lie4Li04LmI4LihICjguYLguJzguKXguYjg',
  'uJXguK3guJnguYDguK3guLLguYDguKHguLLguKrguYzguIrguLXguYkpCiAqLwpmdW5jdGlvbiBzeW5jU2V0KHN0YXRlLCBkZXRhaWwpewogIC8vIOC4quC4luC4suC4meC4sOC4l+C4teC5iOC4leC5ieC4reC4h+C5g+C4q+C5ieC4nOC4ueC5ieC5g+C4iuC5ieC4',
  'iOC4seC4lOC4geC4suC4oyDguKvguYnguLLguKHguJbguLnguIHguKrguJbguLLguJnguLDguJfguLHguYjguKfguYTguJvguKHguLLguIHguKXguJrguJfguLTguYnguIcKICBpZiAoKFNZTkMuc3RhdGUgPT09ICdwZW5kaW5nJyB8fCBTWU5DLnN0YXRlID09PSAn',
  'b2ZmbGluZScpICYmCiAgICAgIChzdGF0ZSA9PT0gJ3N5bmNlZCcgfHwgc3RhdGUgPT09ICdzeW5jaW5nJykpIHJldHVybjsKCiAgU1lOQy5zdGF0ZSA9IHN0YXRlOwogIFNZTkMuZGV0YWlsID0gZGV0YWlsIHx8ICcnOwogIGlmIChzdGF0ZSA9PT0gJ3N5bmNlZCcg',
  'fHwgc3RhdGUgPT09ICdzYXZlZCcpIFNZTkMuYXQgPSBEYXRlLm5vdygpOwogIHN5bmNQYWludCgpOwoKICBjbGVhclRpbWVvdXQoU1lOQy50aW1lcik7CiAgaWYgKHN0YXRlID09PSAnc2F2ZWQnKSB7ICAgICAgICAgICAgICAgICAgICAgICAvLyDguYLguIrguKfg',
  'uYwgIuC4muC4seC4meC4l+C4tuC4geC5geC4peC5ieC4pyIg4LmB4Lib4LmK4Lia4LmA4LiU4Li14Lii4Lin4LmB4Lil4LmJ4Lin4LiB4Lil4Lix4Lia4LmE4Lib4Lib4LiB4LiV4Li0CiAgICBTWU5DLnRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpewogICAg',
  'ICBpZiAoU1lOQy5zdGF0ZSA9PT0gJ3NhdmVkJykgc3luY1NldCgnc3luY2VkJyk7CiAgICB9LCAyNjAwKTsKICB9Cn0KCmZ1bmN0aW9uIHN5bmNQYWludCgpewogIHZhciBkb3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGl2ZURvdCcpOwogIGlmICghZG90',
  'KSByZXR1cm47CiAgdmFyIGxvb2sgPSBTWU5DX0xPT0tbU1lOQy5zdGF0ZV0gfHwgU1lOQ19MT09LLnN5bmNlZDsKCiAgdmFyIHRpcCA9IFNZTkMuZGV0YWlsIHx8IHN5bmNUb29sdGlwKCk7CiAgLy8g4Lir4LmI4Lit4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LmE4Lin',
  '4LmJIOC5gOC4nuC4t+C5iOC4reC5g+C4q+C5ieC4iOC4reC5geC4hOC4muC4i+C5iOC4reC4meC5gOC4ieC4nuC4suC4sOC4guC5ieC4reC4hOC4p+C4suC4oeC5geC4peC4sOC4ouC4seC4h+C5gOC4q+C5h+C4meC5hOC4reC4hOC4reC4meC4reC4ouC4ueC5iAog',
  'IHZhciBib2R5ID0gKGxvb2suc3BpbiA/ICc8c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiAnIDogKGxvb2suaWNvbiA/IGxvb2suaWNvbiArICcgJyA6ICcnKSkgKwogICAgICAgICAgICAgJzxzcGFuIGNsYXNzPSJzeW5jLWxhYmVsIj4nICsgbG9vay50ZXh0ICsg',
  'Jzwvc3Bhbj4nOwogIHZhciBjbHMgPSAnYiAnICsgbG9vay5jbHMgKyAnIHN5bmMtcGlsbCc7CgogIGRvdC5pbm5lckhUTUwgPSBsb29rLmNsaWNrCiAgICA/ICc8YnV0dG9uIGNsYXNzPSInICsgY2xzICsgJyIgc3R5bGU9ImJvcmRlcjowO2N1cnNvcjpwb2ludGVy',
  'O2ZvbnQ6aW5oZXJpdCIgJyArCiAgICAgICd0aXRsZT0iJyArIGVzYyh0aXApICsgJyIgb25jbGljaz0iJyArIGxvb2suY2xpY2sgKyAnIj4nICsgYm9keSArICc8L2J1dHRvbj4nCiAgICA6ICc8c3BhbiBjbGFzcz0iJyArIGNscyArICciIHRpdGxlPSInICsgZXNj',
  'KHRpcCkgKyAnIj4nICsgYm9keSArICc8L3NwYW4+JzsKfQoKZnVuY3Rpb24gc3luY1Rvb2x0aXAoKXsKICB2YXIgYmFzZSA9IHJlZnJlc2hMYWJlbChQT0xMX1NFQ09ORFMpICsgJyDCtyDguYTguKHguYjguYLguKvguKXguJTguJfguLHguJrguJXguK3guJnguIHg',
  'uLPguKXguLHguIfguIHguKPguK3guIHguILguYnguK3guKHguLnguKUnOwogIGlmICghU1lOQy5hdCkgcmV0dXJuIGJhc2U7CiAgdmFyIGQgPSBuZXcgRGF0ZShTWU5DLmF0KTsKICB2YXIgaGggPSAoJzAnICsgZC5nZXRIb3VycygpKS5zbGljZSgtMiksIG1tID0g',
  'KCcwJyArIGQuZ2V0TWludXRlcygpKS5zbGljZSgtMik7CiAgcmV0dXJuICfguJXguKPguIfguIHguLHguJrguILguYnguK3guKHguLnguKXguKvguKXguLHguIfguJrguYnguLLguJnguYDguKHguLfguYjguK0gJyArIGhoICsgJzonICsgbW0gKyAnIOC4mS5cbicg',
  'KyBiYXNlOwp9CgovKiog4LmA4LiZ4LmH4LiV4Liq4Liw4LiU4Li44LiUL+C4q+C4peC4uOC4lCDguJXguYjguLLguIfguIjguLLguIEgIuC5gOC4i+C4tOC4o+C5jOC4n+C5gOC4p+C4reC4o+C5jOC4leC4reC4muC4p+C5iOC4suC4l+C4s+C5hOC4oeC5iOC5hOC4',
  'lOC5iSIg4LiL4Li24LmI4LiH4LmA4Lib4LmH4LiZ4LiE4Lin4Liy4Lih4Lic4Li04LiU4LiC4Lit4LiH4LiE4Liz4Liq4Lix4LmI4LiHICovCmZ1bmN0aW9uIGlzT2ZmbGluZUVycm9yKGUpewogIGlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAm',
  'JiBuYXZpZ2F0b3Iub25MaW5lID09PSBmYWxzZSkgcmV0dXJuIHRydWU7CiAgdmFyIG0gPSBTdHJpbmcoKGUgJiYgZS5tZXNzYWdlKSB8fCBlIHx8ICcnKTsKICByZXR1cm4gL25ldHdvcmt8ZmFpbGVkfHRpbWVvdXR84LmA4LiE4Lij4Li34Lit4LiC4LmI4Liy4Lii',
  'fOC5gOC4iuC4t+C5iOC4reC4oeC4leC5iOC4rXzguYTguKHguYjguYTguJTguYnguKPguLHguJrguILguYnguK3guKHguLnguKXguIjguLLguIHguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYwvaS50ZXN0KG0pOwp9CgovKiog4Lic4Li54LmJ4LmD4LiK',
  '4LmJ4LiB4LiU4LiX4Li14LmI4LiV4Lix4Lin4Lia4Lit4LiB4Liq4LiW4Liy4LiZ4Liw4LiV4Lit4LiZ4Lih4Li14Lib4Lix4LiN4Lir4LiyIOKAlCDguKXguK3guIfguYPguKvguKHguYjguJfguLHguJnguJfguLUgKi8KZnVuY3Rpb24gcmV0cnlTeW5jKCl7CiAg',
  'U1lOQy5zdGF0ZSA9ICdzeW5jaW5nJzsKICBzeW5jUGFpbnQoKTsKICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7Cn0KCi8qKiDguYLguKvguKXguJTguILguYnguK3guKHguLnguKXguYPguKvguKHguYjguJXguK3guJnguJfguLXguYjguJzguLnguYnguYPguIrguYng',
  'uJ7guKPguYnguK3guKEgKOC4geC4lOC4iOC4suC4geC4m+C5ieC4suC4oiAi4Lih4Li14LiC4LmJ4Lit4Lih4Li54Lil4LmD4Lir4Lih4LmIIikgKi8KZnVuY3Rpb24gbG9hZFBlbmRpbmcoKXsKICBTWU5DLnN0YXRlID0gJ3N5bmNpbmcnOwogIHN5bmNQYWludCgp',
  'OwogIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKfQoKdmFyIFBPTExfU0VDT05EUyA9IDA7CnZhciBQT0xMX1RJTUVSID0gbnVsbDsKCmZ1bmN0aW9uIHN0YXJ0UG9sbGluZyhzZWNvbmRzKXsKICB2YXIgc2VjID0gTnVtYmVyKHNlY29uZHMgfHwgMCk7CiAgUE9MTF9T',
  'RUNPTkRTID0gc2VjOwogIGNsZWFySW50ZXJ2YWwoUE9MTF9USU1FUik7CgogIGlmICghc2VjKSB7IHN5bmNTZXQoJ3BhdXNlZCcpOyByZXR1cm47IH0gICAvLyDguJvguLTguJTguIHguLLguKPguJXguKPguKfguIjguK3guLHguJXguYLguJnguKHguLHguJXguLQg',
  '4oCUIOC4geC4lOC4l+C4teC5iOC4m+C5ieC4suC4ouC5gOC4nuC4t+C5iOC4reC4i+C4tOC4h+C4geC5jOC5gOC4reC4h+C5hOC4lOC5iQogIHN5bmNTZXQoJ3N5bmNlZCcpOwoKICBQT0xMX1RJTUVSID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKXsKICAgIGlmIChk',
  'b2N1bWVudC5oaWRkZW4pIHJldHVybjsKICAgIGNhbGxBcGkoJ2FwcC52ZXJzaW9uJykudGhlbihmdW5jdGlvbih2KXsKICAgICAgaWYgKFNZTkMuc3RhdGUgPT09ICdvZmZsaW5lJykgc3luY1NldCgnc3luY2VkJyk7ICAgLy8g4LiB4Lil4Lix4Lia4Lih4Liy4LiV',
  '4LmI4Lit4LmE4LiU4LmJ4LmB4Lil4LmJ4LinCiAgICAgIGlmICghdiB8fCAhdi52ZXJzaW9uIHx8IHYudmVyc2lvbiA9PT0gUy52ZXJzaW9uKSByZXR1cm47CiAgICAgIFMudmVyc2lvbiA9IHYudmVyc2lvbjsKCiAgICAgIC8vIOC5gOC4o+C4suC5gOC4m+C5h+C4',
  'meC4hOC4meC5geC4geC5ieC5gOC4reC4hyDguYHguKXguLDguKvguJnguYnguLLguIHguYfguIvguLTguIfguIHguYzguYTguJvguYHguKXguYnguKfguJXguK3guJnguIHguJTguJrguLHguJnguJfguLbguIEKICAgICAgaWYgKERhdGUubm93KCkgPCBTLnNlbGZD',
  'aGFuZ2VVbnRpbCkgcmV0dXJuOwoKICAgICAgLy8g4LiB4Liz4Lil4Lix4LiH4LiB4Lij4Lit4LiB4LiC4LmJ4Lit4Lih4Li54Lil4Lit4Lii4Li54LmIIOKAlCDguKvguYnguLLguKHguYLguKvguKXguJTguJfguLHguJog4Lij4Lit4LmD4Lir4LmJ4Lic4Li54LmJ',
  '4LmD4LiK4LmJ4LiB4LiU4LmA4Lit4LiHCiAgICAgIGlmICh1c2VySXNCdXN5KCkpIHsgc3luY1NldCgncGVuZGluZycpOyByZXR1cm47IH0KCiAgICAgIC8vIOC4i+C4tOC4h+C4geC5jOC5gOC4h+C4teC4ouC4miDguYYg4LmE4Lih4LmI4Lil4LmJ4Liy4LiH4Lir',
  '4LiZ4LmJ4LiyIOC5hOC4oeC5iOC5gOC4lOC5ieC4h+C4geC4peC4seC4muC5hOC4m+C4muC4meC4quC4uOC4lAogICAgICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAgICAgIHJlZnJlc2hBbGVydHMoKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICBz',
  'eW5jU2V0KGlzT2ZmbGluZUVycm9yKGUpID8gJ29mZmxpbmUnIDogJ2Vycm9yJywgKGUgJiYgZS5tZXNzYWdlKSB8fCBTdHJpbmcoZSkpOwogICAgfSk7CiAgfSwgc2VjICogMTAwMCk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4Lio4Li54LiZ4Lii4LmM4LmB4LiI',
  '4LmJ4LiH4LmA4LiV4Li34Lit4LiZIC0tLS0tLS0tLS0tLS0tLS0KCiAgIOC4leC4seC4p+C5gOC4peC4guC4muC4meC5gOC4oeC4meC4uSAo4LmA4LiK4LmI4LiZIDYg4Lir4Lil4Lix4LiHICLguKXguYnguLLguIfguYHguK3guKPguYwiKSDguIHguLHguJrguIHg',
  'uKXguYjguK3guIfguYHguIjguYnguIfguYDguJXguLfguK3guJnguJrguJnguYHguJbguJrguKvguLHguKcKICAg4LmD4LiK4LmJ4LiC4LmJ4Lit4Lih4Li54Lil4LiK4Li44LiU4LmA4LiU4Li14Lii4Lin4LiB4Lix4LiZ4LiI4Liy4LiB4LiE4Liz4Liq4Lix4LmI',
  '4LiHIGFwcC5hbGVydHMg4LiL4Li24LmI4LiH4LmA4Lia4Liy4LiB4Lin4LmI4Liy4LmB4LiU4LiK4Lia4Lit4Lij4LmM4LiU4Lih4Liy4LiBCgogICDguK3guLHguJvguYDguJTguJXguYDguKHguLfguYjguK06IOC5gOC4m+C4tOC4lOC4o+C4sOC4muC4miDCtyDg',
  'uKvguKXguLHguIfguIHguJTguJrguLHguJnguJfguLbguIEv4Lil4Lia4LiX4Li44LiB4LiE4Lij4Lix4LmJ4LiHIMK3IOC4l+C4uOC4geC4o+C4reC4muC4leC4o+C4p+C4iOC4guC5ieC4reC4oeC4ueC4pQogICDguYDguJTguLTguKHguJXguLHguKfguYDguKXg',
  'uILguJnguLXguYnguK3guLHguJvguYDguJTguJXguJXguK3guJnguYDguJvguLTguJTguKvguJnguYnguLLguYHguJTguIrguJrguK3guKPguYzguJTguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcKICAg4LmE4Lib4Lit4Lii4Li54LmI4Lir4LiZ4LmJ4Liy',
  '4Lit4Li34LmI4LiZ4LmB4Lil4LmJ4Lin4LiV4Lix4Lin4LmA4Lil4LiC4LiI4Li24LiH4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmI4LiX4Li14LmI4LiE4LmI4Liy4LmA4LiB4LmI4LiyCi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0t',
  'LS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqLwoKdmFyIEFMRVJUUyA9IHsgY291bnRzOiB7fSwgaXRlbXM6IFtdLCB0b3RhbDogMCwgdXJnZW50OiAwLCBhdDogJycgfTsKCmZ1bmN0aW9uIHJlZnJlc2hBbGVydHMoKXsKICByZXR1cm4gY2FsbEFwaSgnYXBwLmFsZXJ0',
  'cycpLnRoZW4oZnVuY3Rpb24oYSl7CiAgICBBTEVSVFMgPSBhIHx8IEFMRVJUUzsKICAgIHBhaW50QmFkZ2VzKCk7CiAgICBwYWludEJlbGwoKTsKICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbm90aWZQYW5lbCcpKSByZW5kZXJOb3RpZlBhbmVsKCk7',
  'ICAgLy8g4LmA4Lib4Li04LiU4LiE4LmJ4Liy4LiH4Lit4Lii4Li54LmIIOC5g+C4q+C5ieC4reC4seC4m+C5gOC4lOC4leC4leC4suC4oQogICAgcmV0dXJuIGE7CiAgfSkuY2F0Y2goZnVuY3Rpb24oKXsgLyog4LmA4LiZ4LmH4LiV4Liq4Liw4LiU4Li44LiUIOC5',
  'hOC4p+C5ieC4o+C4reC4muC4q+C4meC5ieC4siAqLyB9KTsKfQoKLyoqIOC4leC4seC4p+C5gOC4peC4guC4muC4meC5gOC4oeC4meC4ueC4i+C5ieC4suC4oiDigJQg4Lia4Lit4LiB4LiI4Liz4LiZ4Lin4LiZ4LiH4Liy4LiZ4LiX4Li14LmI4Lii4Lix4LiH4LiE',
  '4LmJ4Liy4LiH4Lit4Lii4Li54LmI4LiC4Lit4LiH4LmB4LiV4LmI4Lil4Liw4LmC4Lih4LiU4Li54LilICovCmZ1bmN0aW9uIHBhaW50QmFkZ2VzKCl7CiAgdmFyIGMgPSBBTEVSVFMuY291bnRzIHx8IHt9OwogIFBBR0VTLmZvckVhY2goZnVuY3Rpb24ocCl7IHNl',
  'dEJhZGdlKHAuaWQsIGNbcC5pZF0gfHwgMCk7IH0pOwp9CgpmdW5jdGlvbiBzZXRCYWRnZShwYWdlLCBuKXsKICBbZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JhZGdlLScgKyBwYWdlKSwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhYmJhZGdlLScgKyBwYWdl',
  'KV0KICAgIC5mb3JFYWNoKGZ1bmN0aW9uKGVsKXsgaWYgKGVsKSBwYWludEJhZGdlKGVsLCBuKTsgfSk7CgogIC8vIOC4h+C4suC4meC4hOC5ieC4suC4h+C4guC4reC4h+C4q+C4meC5ieC4suC4l+C4teC5iOC5hOC4oeC5iOC4oeC4teC5geC4l+C5h+C4miDguYPg',
  'uKvguYnguYTguJvguKPguKfguKHguK3guKLguLnguYjguJfguLXguYjguJvguLjguYjguKEgIuC5gOC4nuC4tOC5iOC4oeC5gOC4leC4tOC4oSIg4LmE4Lih4LmI4LiH4Lix4LmJ4LiZ4Lia4LiZ4Lih4Li34Lit4LiW4Li34Lit4LiI4Liw4Lih4Lit4LiH4LmE4Lih',
  '4LmI4LmA4Lir4LmH4LiZ4LmA4Lil4LiiCiAgdmFyIG1vcmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFiYmFkZ2UtbW9yZScpOwogIGlmIChtb3JlKSB7CiAgICB2YXIgaGlkZGVuID0gUEFHRVMuZmlsdGVyKGZ1bmN0aW9uKHApeyByZXR1cm4gIXAudGFi',
  'OyB9KQogICAgICAucmVkdWNlKGZ1bmN0aW9uKGEsIHApeyByZXR1cm4gYSArICgoQUxFUlRTLmNvdW50cyB8fCB7fSlbcC5pZF0gfHwgMCk7IH0sIDApOwogICAgcGFpbnRCYWRnZShtb3JlLCBoaWRkZW4pOwogIH0KfQoKZnVuY3Rpb24gcGFpbnRCYWRnZShlbCwg',
  'bil7CiAgaWYgKG4gPiAwKSB7CiAgICBlbC50ZXh0Q29udGVudCA9IG4gPiA5OSA/ICc5OSsnIDogbjsKICAgIGVsLnN0eWxlLmRpc3BsYXkgPSAnJzsKICAgIGVsLnRpdGxlID0gJ+C4ouC4seC4h+C4hOC5ieC4suC4h+C4reC4ouC4ueC5iCAnICsgbiArICcg4Lij',
  '4Liy4Lii4LiB4Liy4LijJzsKICB9IGVsc2UgewogICAgZWwuc3R5bGUuZGlzcGxheSA9ICdub25lJzsKICB9Cn0KCi8qIC0tLS0g4LiB4Lij4Liw4LiU4Li04LmI4LiH4Lia4LiZ4LmB4LiW4Lia4Lir4Lix4LinIC0tLS0gKi8KCmZ1bmN0aW9uIHBhaW50QmVsbCgp',
  'ewogIHZhciB3cmFwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JlbGxXcmFwJyk7CiAgaWYgKCF3cmFwKSByZXR1cm47CgogIC8vIOC4p+C4suC4lOC5gOC4ieC4nuC4suC4sOC4leC4seC4p+C4m+C4uOC5iOC4oSDguKvguYnguLLguKHguYDguILguLXguKLg',
  'uJnguJfguLHguJrguJfguLHguYnguIcgYmVsbFdyYXAKICAvLyDguYDguJ7guKPguLLguLDguIHguKXguYjguK3guIfguYHguIjguYnguIfguYDguJXguLfguK3guJnguJfguLXguYjguYDguJvguLTguJTguITguYnguLLguIfguK3guKLguLnguYjguIHguYfguYDg',
  'uJvguYfguJnguKXguLnguIHguILguK3guIcgYmVsbFdyYXAg4LmA4Lir4Lih4Li34Lit4LiZ4LiB4Lix4LiZCiAgdmFyIHNsb3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmVsbFNsb3QnKTsKICBpZiAoIXNsb3QpIHsKICAgIHNsb3QgPSBkb2N1bWVudC5j',
  'cmVhdGVFbGVtZW50KCdzcGFuJyk7CiAgICBzbG90LmlkID0gJ2JlbGxTbG90JzsKICAgIHdyYXAuaW5zZXJ0QmVmb3JlKHNsb3QsIHdyYXAuZmlyc3RDaGlsZCk7CiAgfQoKICB2YXIgbiA9IEFMRVJUUy50b3RhbCB8fCAwOwogIHZhciB1cmdlbnQgPSBBTEVSVFMu',
  'dXJnZW50IHx8IDA7CiAgc2xvdC5pbm5lckhUTUwgPQogICAgJzxidXR0b24gY2xhc3M9ImJ0biBpY29uIGJlbGwiIGlkPSJiZWxsQnRuIiBvbmNsaWNrPSJ0b2dnbGVOb3RpZigpIiAnICsKICAgICAgJ3RpdGxlPSInICsgKG4gPyAn4Lih4Li1ICcgKyBuICsgJyDg',
  'uYDguKPguLfguYjguK3guIfguJfguLXguYjguJXguYnguK3guIfguJTguLknIDogJ+C5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4hOC5ieC4suC4hycpICsgJyIgJyArCiAgICAgICdhcmlhLWxhYmVsPSLguIHguLLguKPguYHguIjguYnguIfguYDguJXguLfguK3g',
  'uJkiPvCflJQnICsKICAgICAgKG4gPyAnPHNwYW4gY2xhc3M9ImJlbGwtZG90JyArICh1cmdlbnQgPyAnIHVyZ2VudCcgOiAnJykgKyAnIj4nICsgKG4gPiA5OSA/ICc5OSsnIDogbikgKyAnPC9zcGFuPicgOiAnJykgKwogICAgJzwvYnV0dG9uPic7Cn0KCmZ1bmN0',
  'aW9uIHRvZ2dsZU5vdGlmKCl7CiAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdub3RpZlBhbmVsJykpIHJldHVybiBjbG9zZU5vdGlmKCk7CiAgdmFyIHdyYXAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmVsbFdyYXAnKTsKICBpZiAoIXdyYXApIHJl',
  'dHVybjsKICB2YXIgcGFuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICBwYW5lbC5pZCA9ICdub3RpZlBhbmVsJzsKICBwYW5lbC5jbGFzc05hbWUgPSAnbm90aWYnOwogIHdyYXAuYXBwZW5kQ2hpbGQocGFuZWwpOwogIHJlbmRlck5vdGlmUGFu',
  'ZWwoKTsKICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgbm90aWZPdXRzaWRlLCB0cnVlKTsgfSwgMCk7CiAgcmVmcmVzaEFsZXJ0cygpOyAgICAgICAgICAgICAgICAgICAgICAvLyDguYDguJvguLTguJTg',
  'uJfguLXguYTguKPguIHguYfguJTguLbguIfguILguK3guIfguKXguYjguLLguKrguLjguJTguKHguLLguYPguKvguYnguJTguYnguKfguKIKfQoKZnVuY3Rpb24gY2xvc2VOb3RpZigpewogIHZhciBwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25vdGlmUGFu',
  'ZWwnKTsKICBpZiAocCkgcC5yZW1vdmUoKTsKICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIG5vdGlmT3V0c2lkZSwgdHJ1ZSk7Cn0KCmZ1bmN0aW9uIG5vdGlmT3V0c2lkZShlKXsKICB2YXIgd3JhcCA9IGRvY3VtZW50LmdldEVsZW1lbnRC',
  'eUlkKCdiZWxsV3JhcCcpOwogIGlmICh3cmFwICYmICF3cmFwLmNvbnRhaW5zKGUudGFyZ2V0KSkgY2xvc2VOb3RpZigpOwp9Cgp2YXIgTk9USUZfR1JPVVBTID0gWwogIHsgbW9kdWxlOidyZXBhaXJzJywgICBpYzon8J+UpycsIGxhYmVsOifguIfguLLguJnguIvg',
  'uYjguK3guKHguITguYnguLLguIcnIH0sCiAgeyBtb2R1bGU6J2FjJywgICAgICAgIGljOifinYTvuI8nLCBsYWJlbDon4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4LiW4Li24LiH4LiB4Liz4Lir4LiZ4LiUJyB9LAogIHsgbW9kdWxlOididWlsZGluZycsICBpYzon',
  '8J+PoicsIGxhYmVsOifguIfguLLguJnguJXguLbguIHguKrguYjguKfguJnguIHguKXguLLguIcnIH0sCiAgeyBtb2R1bGU6J3B1cmNoYXNlcycsIGljOifwn5uh77iPJywgbGFiZWw6J+C4m+C4o+C4sOC4geC4seC4meC5g+C4geC4peC5ieC4q+C4oeC4lCcgfSwK',
  'ICB7IG1vZHVsZTonZmluYW5jZScsICAgaWM6J/Cfp74nLCBsYWJlbDon4Lia4Li04Lil4Lij4Liy4Lii4LmA4LiU4Li34Lit4LiZJyB9Cl07CgpmdW5jdGlvbiByZW5kZXJOb3RpZlBhbmVsKCl7CiAgdmFyIHBhbmVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQo',
  'J25vdGlmUGFuZWwnKTsKICBpZiAoIXBhbmVsKSByZXR1cm47CiAgdmFyIGl0ZW1zID0gQUxFUlRTLml0ZW1zIHx8IFtdOwoKICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJub3RpZi1oIj48Yj7guIHguLLguKPguYHguIjguYnguIfguYDguJXguLfguK3guJk8L2I+',
  'JyArCiAgICAnPHNwYW4gY2xhc3M9InNwIj4nICsKICAgICAgKGl0ZW1zLmxlbmd0aCA/ICc8c3BhbiBjbGFzcz0iYiAnICsgKEFMRVJUUy51cmdlbnQgPyAnZGdyJyA6ICd3YXJuJykgKyAnIj4nICsgaXRlbXMubGVuZ3RoICsgJyDguYDguKPguLfguYjguK3guIc8',
  'L3NwYW4+JyA6ICcnKSArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgdGl0bGU9IuC4lOC4tuC4h+C4guC5ieC4reC4oeC4ueC4peC4peC5iOC4suC4quC4uOC4lCIgb25jbGljaz0icmVmcmVzaEFsZXJ0cygpIj7ihrs8L2J1dHRvbj4nICsKICAg',
  'ICc8L3NwYW4+PC9kaXY+JzsKCiAgaWYgKCFpdGVtcy5sZW5ndGgpIHsKICAgIHBhbmVsLmlubmVySFRNTCA9IGhlYWQgKwogICAgICAnPGRpdiBjbGFzcz0ibm90aWYtZW1wdHkiPjxkaXYgY2xhc3M9ImJpZyI+4pyFPC9kaXY+4LmE4Lih4LmI4Lih4Li14LiH4Liy',
  '4LiZ4LiE4LmJ4Liy4LiHPGJyPicgKwogICAgICAnPHNwYW4gY2xhc3M9ImZzMTIgZmFpbnQiPuC4l+C4uOC4geC4reC4ouC5iOC4suC4h+C5gOC4o+C4teC4ouC4muC4o+C5ieC4reC4ouC4lOC4tTwvc3Bhbj48L2Rpdj4nOwogICAgcmV0dXJuOwogIH0KCiAgLy8g',
  '4LiI4Lix4LiU4LiB4Lil4Li44LmI4Lih4LiV4Liy4Lih4LmC4Lih4LiU4Li54LilIOC5gOC4o+C4teC4ouC4h+C4leC4suC4oeC4peC4s+C4lOC4seC4muC4l+C4teC5iOC4nOC4ueC5ieC5g+C4iuC5ieC4quC4meC5g+C4iOC4geC5iOC4reC4mQogIHZhciBib2R5',
  'ID0gJyc7CiAgTk9USUZfR1JPVVBTLmZvckVhY2goZnVuY3Rpb24oZyl7CiAgICB2YXIgbGlzdCA9IGl0ZW1zLmZpbHRlcihmdW5jdGlvbihhKXsgcmV0dXJuIGEubW9kdWxlID09PSBnLm1vZHVsZTsgfSk7CiAgICBpZiAoIWxpc3QubGVuZ3RoKSByZXR1cm47CiAg',
  'ICBib2R5ICs9ICc8ZGl2IGNsYXNzPSJub3RpZi1zZWMiPicgKyBnLmljICsgJyAnICsgZXNjKGcubGFiZWwpICsgJyAoJyArIGxpc3QubGVuZ3RoICsgJyk8L2Rpdj4nOwogICAgbGlzdC5zbGljZSgwLCA4KS5mb3JFYWNoKGZ1bmN0aW9uKGEpewogICAgICBib2R5',
  'ICs9ICc8YnV0dG9uIGNsYXNzPSJub3RpZi1pdGVtIGwtJyArIGVzYyhhLmxldmVsKSArICciIG9uY2xpY2s9ImdvdG9BbGVydCgnICsganNxKGEubW9kdWxlKSArICcpIj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0idHQiPicgKyBlc2MoYS50aXRsZSkgKyAnPC9k',
  'aXY+JyArCiAgICAgICAgKGEuZGV0YWlsID8gJzxkaXYgY2xhc3M9ImRkIj4nICsgZXNjKGEuZGV0YWlsKSArICc8L2Rpdj4nIDogJycpICsKICAgICAgJzwvYnV0dG9uPic7CiAgICB9KTsKICAgIGlmIChsaXN0Lmxlbmd0aCA+IDgpIHsKICAgICAgYm9keSArPSAn',
  'PGJ1dHRvbiBjbGFzcz0ibm90aWYtbW9yZSIgb25jbGljaz0iZ290b0FsZXJ0KCcgKyBqc3EoZy5tb2R1bGUpICsgJykiPicgKwogICAgICAgICfguJTguLnguK3guLXguIEgJyArIChsaXN0Lmxlbmd0aCAtIDgpICsgJyDguKPguLLguKLguIHguLLguKMg4oaSPC9i',
  'dXR0b24+JzsKICAgIH0KICB9KTsKCiAgcGFuZWwuaW5uZXJIVE1MID0gaGVhZCArICc8ZGl2IGNsYXNzPSJub3RpZi1saXN0Ij4nICsgYm9keSArICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJub3RpZi1mIj7guK3guLHguJvguYDguJTguJXguYDguKHguLfg',
  'uYjguK0gJyArIGVzYyhTdHJpbmcoQUxFUlRTLmF0IHx8ICcnKS5zbGljZSgxMSwgMTYpIHx8ICfigJMnKSArICcg4LiZLiDCtyAnICsKICAgICc8YSBocmVmPSJqYXZhc2NyaXB0OnZvaWQoMCkiIG9uY2xpY2s9ImNsb3NlTm90aWYoKTtnbyhcJ2Rhc2hib2FyZFwn',
  'KSI+4LiU4Li54LiX4Lix4LmJ4LiH4Lir4Lih4LiU4LmD4LiZ4LmB4LiU4LiK4Lia4Lit4Lij4LmM4LiUIOKGkjwvYT48L2Rpdj4nOwp9CgpmdW5jdGlvbiBnb3RvQWxlcnQobW9kdWxlKXsKICBjbG9zZU5vdGlmKCk7CiAgZ28obW9kdWxlID09PSAnZGVidCcgPyAn',
  'ZGVidE1haW4nIDogbW9kdWxlKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSBmb3JtYXQgaGVscGVycyAtLS0tLS0tLS0tLS0tLS0tICovCgovKioKICog4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiX4Li14LmI4LiI4Liw4LmE4Lib4LmA4Lib4LmH4LiZ4Lit4Liy4Lij',
  '4LmM4LiB4Li04Lin4LmA4Lih4LiZ4LiV4LmM4LiC4Lit4LiHIEpTIOC5g+C4mSBvbmNsaWNrPSLigKYiCiAqIEpTT04uc3RyaW5naWZ5IOC4l+C4s+C5g+C4q+C5ieC5gOC4m+C5h+C4meC4quC4leC4o+C4tOC4hyBKUyDguJfguLXguYjguJbguLnguIHguJXguYng',
  'uK3guIfguYDguKrguKHguK0gKOC4q+C4meC4teC4reC4seC4jeC4m+C4o+C4sOC4geC4suC4qC/guYHguJrguYfguIHguKrguYHguKXguIrguYPguKvguYkpIOC5geC4peC5ieC4pyBlc2Mg4LiB4Lix4LiZ4Lir4Lil4Li44LiU4Lit4Lit4LiB4LiI4Liy4LiBIGF0',
  'dHJpYnV0ZQogKiDguYPguIrguYnguYHguJfguJnguIHguLLguKPguJXguYjguK0gJ1wnJyArIOC4hOC5iOC4siArICdcJycg4LiV4Lij4LiHIOC5hiDguIvguLbguYjguIfguITguYjguLLguJfguLXguYjguKHguLUgJyDguIjguLDguJfguLDguKXguLjguK3guK3g',
  'uIHguKHguLLguKPguLHguJnguYLguITguYnguJTguYTguJTguYkKICovCmZ1bmN0aW9uIGpzcShzKXsgcmV0dXJuIGVzYyhKU09OLnN0cmluZ2lmeShTdHJpbmcocyA9PSBudWxsID8gJycgOiBzKSkpOyB9CgpmdW5jdGlvbiBlc2Mocyl7CiAgcmV0dXJuIFN0cmlu',
  'ZyhzPT1udWxsPycnOnMpCiAgICAucmVwbGFjZSgvJi9nLCcmYW1wOycpLnJlcGxhY2UoLzwvZywnJmx0OycpLnJlcGxhY2UoLz4vZywnJmd0OycpCiAgICAucmVwbGFjZSgvIi9nLCcmcXVvdDsnKS5yZXBsYWNlKC8nL2csJyYjMzk7Jyk7Cn0KZnVuY3Rpb24gbW9u',
  'ZXkobiwgZGVjKXsKICB2YXIgdiA9IE51bWJlcihufHwwKTsKICByZXR1cm4gdi50b0xvY2FsZVN0cmluZygndGgtVEgnLHttaW5pbXVtRnJhY3Rpb25EaWdpdHM6ZGVjfHwwLCBtYXhpbXVtRnJhY3Rpb25EaWdpdHM6ZGVjfHwwfSk7Cn0KZnVuY3Rpb24gYmFodChu',
  'KXsgcmV0dXJuIG1vbmV5KG4pICsgJyDguL8nOyB9CmZ1bmN0aW9uIHBjdChuKXsgcmV0dXJuIChOdW1iZXIobil8fDApLnRvRml4ZWQoMSkgKyAnJSc7IH0KZnVuY3Rpb24gbnVtKG4peyByZXR1cm4gbj09bnVsbHx8bj09PScnID8gJ+KAkycgOiBtb25leShuKTsg',
  'fQoKLyoqIDIwMjYtMDQtMjYgLT4gMjYg4LmA4LihLuC4oi4gMjU2OSAqLwp2YXIgVEhfTU9OID0gWyfguKEu4LiELicsJ+C4gS7guJ4uJywn4Lih4Li1LuC4hC4nLCfguYDguKEu4LiiLicsJ+C4ni7guIQuJywn4Lih4Li0LuC4oi4nLCfguIEu4LiELicsJ+C4qi7g',
  'uIQuJywn4LiBLuC4oi4nLCfguJUu4LiELicsJ+C4ni7guKIuJywn4LiYLuC4hC4nXTsKLyoqCiAqIOC4m+C4teC4l+C4teC5iOC4iOC4sOC5geC4quC4lOC4h+C4muC4meC4q+C4meC5ieC4suC4iOC4rSDigJQg4LiC4LmJ4Lit4Lih4Li54Lil4LmA4LiB4LmH4Lia',
  '4LmA4Lib4LmH4LiZIOC4hC7guKguIOC5gOC4quC4oeC4rQogKiDguJXguKPguIfguJnguLXguYnguYHguJvguKXguIfguJXguK3guJnguYHguKrguJTguIfguJzguKXguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcg4LiV4Liy4Lih4LiX4Li14LmI4LmA4Lil',
  '4Li34Lit4LiB4LmE4Lin4LmJ4LmD4LiZ4Lir4LiZ4LmJ4Liy4LiV4Lix4LmJ4LiH4LiE4LmI4LiyCiAqIOC4hOC5iOC4suC4leC4seC5ieC4h+C4leC5ieC4meC4hOC4t+C4rSDguIQu4LioLiDguYPguKvguYnguJXguKPguIfguIHguLHguJrguJvguLXguJfguLXg',
  'uYjguYDguIHguYfguJrguYPguJnguIrguLXguJXguYHguKXguLDguJvguI/guLTguJfguLTguJnguKrguLLguIHguKUKICovCmZ1bmN0aW9uIHVzZUJ1ZGRoaXN0WWVhcigpewogIHZhciBmID0gKFMuYm9vdCAmJiBTLmJvb3Quc2V0dGluZ3MgJiYgUy5ib290LnNl',
  'dHRpbmdzLmRhdGVGb3JtYXQpIHx8ICfguIQu4LioLiAoMjAyNiknOwogIHJldHVybiBTdHJpbmcoZikuaW5kZXhPZign4LieLuC4qC4nKSA9PT0gMDsKfQpmdW5jdGlvbiBkaXNwbGF5WWVhcihjZSl7CiAgcmV0dXJuIHVzZUJ1ZGRoaXN0WWVhcigpID8gTnVtYmVy',
  'KGNlKSArIDU0MyA6IE51bWJlcihjZSk7Cn0KCmZ1bmN0aW9uIHRoRGF0ZShpc28pewogIGlmICghaXNvKSByZXR1cm4gJ+KAkyc7CiAgdmFyIG0gPSBTdHJpbmcoaXNvKS5tYXRjaCgvXihcZHs0fSktKFxkezJ9KS0oXGR7Mn0pLyk7CiAgaWYgKCFtKSByZXR1cm4g',
  'ZXNjKGlzbyk7CiAgcmV0dXJuIE51bWJlcihtWzNdKSArICcgJyArIFRIX01PTltOdW1iZXIobVsyXSktMV0gKyAnICcgKyBkaXNwbGF5WWVhcihtWzFdKTsKfQpmdW5jdGlvbiB0aERhdGVTaG9ydChpc28pewogIGlmICghaXNvKSByZXR1cm4gJ+KAkyc7CiAgdmFy',
  'IG0gPSBTdHJpbmcoaXNvKS5tYXRjaCgvXihcZHs0fSktKFxkezJ9KS0oXGR7Mn0pLyk7CiAgaWYgKCFtKSByZXR1cm4gZXNjKGlzbyk7CiAgcmV0dXJuIE51bWJlcihtWzNdKSArICcvJyArIE51bWJlcihtWzJdKSArICcvJyArIFN0cmluZyhkaXNwbGF5WWVhciht',
  'WzFdKSkuc2xpY2UoMik7Cn0KZnVuY3Rpb24gZGF5c0Fnbyhpc28pewogIGlmICghaXNvKSByZXR1cm4gbnVsbDsKICByZXR1cm4gTWF0aC5yb3VuZCgoRGF0ZS5ub3coKSAtIG5ldyBEYXRlKGlzbykuZ2V0VGltZSgpKS84NjQwMDAwMCk7Cn0KCmZ1bmN0aW9uIHN0',
  'YXR1c0JhZGdlKHN0KXsKICB2YXIgbWFwID0gewogICAgJ+C5gOC4quC4o+C5h+C4iOC4quC4tOC5ieC4mSc6J29rJywn4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4Lij4LmB4Lil4LmJ4LinJzonb2snLCfguYPguIrguYnguIfguLLguJnguJvguIHguJXguLQnOidv',
  'aycsJ+C4m+C4tOC4lOC4q+C4meC4teC5ieC5geC4peC5ieC4pyc6J29rJywn4Lit4Lii4Li54LmI4LmD4LiZ4Lib4Lij4Liw4LiB4Lix4LiZJzonb2snLCfguKHguLXguJzguLnguYnguYDguIrguYjguLInOidvaycsJ+C4m+C4geC4leC4tCc6J29rJywKICAgICfg',
  'uIHguLPguKXguLHguIfguIvguYjguK3guKEnOidpbmZvJywn4LiB4Liz4Lil4Lix4LiH4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4LijJzonaW5mbycsJ+C4meC4seC4lOC4q+C4oeC4suC4ouC5geC4peC5ieC4pyc6J2luZm8nLCfguIHguLPguKXguLHguIfguJzg',
  'uYjguK3guJknOidpbmZvJywn4Lin4LmI4Liy4LiHJzonaW5mbycsCiAgICAn4Lij4Lit4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4LijJzond2FybicsJ+C5gOC4peC4t+C5iOC4reC4meC4meC4seC4lCc6J3dhcm4nLCfguYPguIHguKXguYnguKvguKHguJTguJvg',
  'uKPguLDguIHguLHguJknOid3YXJuJywn4LiV4LmJ4Lit4LiH4LiL4LmI4Lit4LihJzond2FybicsJ+C4nuC4seC4geC4iuC4s+C4o+C4sCc6J3dhcm4nLCfguJvguLTguJTguJvguKPguLHguJrguJvguKPguLjguIcnOid3YXJuJywn4LmA4LiB4Li04LiZ4LiB4Liz',
  '4Lir4LiZ4LiUJzond2FybicsJ+C4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4peC5ieC4suC4hyc6J3dhcm4nLAogICAgJ+C4ouC4geC5gOC4peC4tOC4gSc6J211dGUnLCfguJvguKXguJTguKPguLDguKfguLLguIcnOidtdXRlJywn4LmE4Lih4LmI4Lij4Liw',
  '4Lia4Li4JzonbXV0ZScsCiAgICAn4Lir4Lih4LiU4Lit4Liy4Lii4Li44LmB4Lil4LmJ4LinJzonZGdyJywn4LiU4LmI4Lin4LiZ4Lih4Liy4LiBJzonZGdyJywn4LiU4LmI4Lin4LiZJzond2FybicKICB9OwogIGlmICghc3QpIHJldHVybiAnJzsKICByZXR1cm4g',
  'JzxzcGFuIGNsYXNzPSJiICcgKyAobWFwW3N0XXx8J211dGUnKSArICciPicgKyBlc2Moc3QpICsgJzwvc3Bhbj4nOwp9CgpmdW5jdGlvbiBwcm9ncmVzcyhwZXJjZW50LCBjbHMpewogIHZhciBwID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMTAwLCBOdW1iZXIocGVy',
  'Y2VudCl8fDApKTsKICByZXR1cm4gJzxkaXYgY2xhc3M9InBiYXIgJyArIChjbHN8fCcnKSArICciPjxpIHN0eWxlPSJ3aWR0aDonICsgcCArICclIj48L2k+PC9kaXY+JzsKfQoKZnVuY3Rpb24gdGh1bWJzSHRtbChyZWZzLCBiaWcpewogIGlmICghcmVmcyB8fCAh',
  'cmVmcy5sZW5ndGgpIHJldHVybiAnPHNwYW4gY2xhc3M9ImZhaW50IGZzMTIiPuKAkzwvc3Bhbj4nOwogIHJldHVybiAnPGRpdiBjbGFzcz0idGh1bWJzIj4nICsgcmVmcy5tYXAoZnVuY3Rpb24ocil7CiAgICBpZiAoci50aHVtYikgewogICAgICByZXR1cm4gJzxp',
  'bWcgY2xhc3M9InRodW1iJyArIChiaWc/JyBiaWcnOicnKSArICciIGxvYWRpbmc9ImxhenkiIHNyYz0iJyArIGVzYyhyLnRodW1iKSArICciICcgKwogICAgICAgICAgICAgJ29uY2xpY2s9IndpbmRvdy5vcGVuKCcgKyBqc3Eoc2FmZVVybChyLnVybCkpICsgJyxc',
  'J19ibGFua1wnKSIgJyArCiAgICAgICAgICAgICAnb25lcnJvcj0idGhpcy5vbmVycm9yPW51bGw7dGhpcy5yZXBsYWNlV2l0aChmaWxlQ2hpcCgnICsgSlNPTi5zdHJpbmdpZnkoSlNPTi5zdHJpbmdpZnkocikpLnJlcGxhY2UoLyIvZywnJnF1b3Q7JykgKyAnKSki',
  'Pic7CiAgICB9CiAgICB2YXIgdSA9IHNhZmVVcmwoci51cmwpOwogICAgcmV0dXJuIHUgPyAnPGEgY2xhc3M9ImIgaW5mbyIgaHJlZj0iJyArIGVzYyh1KSArICciIHRhcmdldD0iX2JsYW5rIiByZWw9Im5vb3BlbmVyIj7guYTguJ/guKXguYw8L2E+JwogICAgICAg',
  'ICAgICAgOiAnPHNwYW4gY2xhc3M9ImIgbXV0ZSIgdGl0bGU9IicgKyBlc2Moci5uYW1lIHx8ICcnKSArICciPuC5hOC4n+C4peC5jDwvc3Bhbj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7Cn0KCi8qKiDguKPguLHguJrguYDguInguJ7guLLguLDguKXguLTg',
  'uIfguIHguYwgaHR0cHMg4oCUIOC4hOC5iOC4suC4reC4ouC5iOC4suC4hyBqYXZhc2NyaXB0OiDguJfguLXguYjguJbguLnguIHguJ7guLTguKHguJ7guYzguKXguIfguIrguYjguK3guIfguYTguJ/guKXguYzguYHguJnguJrguYPguJnguIrguLXguJXguIjguLDg',
  'uYTguKHguYjguIHguKXguLLguKLguYDguJvguYfguJnguKXguLTguIfguIHguYwgKi8KZnVuY3Rpb24gc2FmZVVybCh1KXsgdSA9IFN0cmluZyh1ID09IG51bGwgPyAnJyA6IHUpLnRyaW0oKTsgcmV0dXJuIC9eaHR0cHM6XC9cLy9pLnRlc3QodSkgPyB1IDogJyc7',
  'IH0KZnVuY3Rpb24gZmlsZUNoaXAoanNvbil7CiAgdmFyIHIgPSB0eXBlb2YganNvbiA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKGpzb24pIDoganNvbjsKICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTsKICBhLmNsYXNzTmFtZSA9ICdiIGlu',
  'Zm8nOyBhLmhyZWYgPSBzYWZlVXJsKHIudXJsKSB8fCAnIyc7IGEudGFyZ2V0ID0gJ19ibGFuayc7IGEucmVsID0gJ25vb3BlbmVyJzsgYS50ZXh0Q29udGVudCA9ICfwn5OOIOC5hOC4n+C4peC5jCc7CiAgcmV0dXJuIGE7Cn0KCmZ1bmN0aW9uIGVtcHR5Qm94KHRl',
  'eHQsIGFjdGlvbil7CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iYmlnIj7wn5eC77iPPC9kaXY+JyArIGVzYyh0ZXh0KSArCiAgICAgICAgIChhY3Rpb24gPyAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIGFjdGlvbiArICc8L2Rpdj4nIDog',
  'JycpICsgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIGJhckNoYXJ0KGl0ZW1zLCBsYWJlbEtleSwgdmFsdWVLZXksIGZvcm1hdHRlcil7CiAgaWYgKCFpdGVtcyB8fCAhaXRlbXMubGVuZ3RoKSByZXR1cm4gJzxkaXYgY2xhc3M9ImVtcHR5Ij7guKLguLHguIfguYTguKHg',
  'uYjguKHguLXguILguYnguK3guKHguLnguKU8L2Rpdj4nOwogIHZhciBtYXggPSBNYXRoLm1heC5hcHBseShudWxsLCBpdGVtcy5tYXAoZnVuY3Rpb24oaSl7IHJldHVybiBOdW1iZXIoaVt2YWx1ZUtleV0pfHwwOyB9KSkgfHwgMTsKICByZXR1cm4gJzxkaXYgY2xh',
  'c3M9ImJhcnMiPicgKyBpdGVtcy5tYXAoZnVuY3Rpb24oaSl7CiAgICB2YXIgdiA9IE51bWJlcihpW3ZhbHVlS2V5XSl8fDA7CiAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImJhci1yb3ciPicgKwogICAgICAnPGRpdiBjbGFzcz0iY2xpcCIgdGl0bGU9IicgKyBlc2Mo',
  'aVtsYWJlbEtleV0pICsgJyI+JyArIGVzYyhpW2xhYmVsS2V5XSkgKyAnPC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJiYXItdHJhY2siPjxkaXYgY2xhc3M9ImJhci1maWxsIiBzdHlsZT0id2lkdGg6JyArICh2L21heCoxMDApICsgJyUiPjwvZGl2PjwvZGl2',
  'PicgKwogICAgICAnPGRpdiBjbGFzcz0idiI+JyArIChmb3JtYXR0ZXIgPyBmb3JtYXR0ZXIoaSkgOiBtb25leSh2KSkgKyAnPC9kaXY+JyArCiAgICAnPC9kaXY+JzsKICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIG1vZGFs',
  'IC0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLQogICDguJXguLLguKPguLLguIfguJrguJnguIjguK3guYHguITguJoKICAgLS0tLS0tLS0tLS0tLS0t',
  'LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tCiAgIOC4leC4suC4o+C4suC4h+C4geC4p+C5ieC4suC4hyAxLDAwMHB4IOC4reC5iOC4suC4meC4muC4meC4oeC4t+C4reC4luC4t+C4reC5hOC4oeC5iOC5hOC4q+C4pyDg',
  'uJXguYnguK3guIfguYDguKXguLfguYjguK3guJnguIvguYnguLLguKLguILguKfguLLguJXguKXguK3guJQKICAg4LiI4Li24LiH4LiV4Li04LiU4LiK4Li34LmI4Lit4LiE4Lit4Lil4Lix4Lih4LiZ4LmM4LmE4Lin4LmJ4LiX4Li14LmI4LmB4LiV4LmI4Lil4Liw',
  '4LiK4LmI4Lit4LiH4LiU4LmJ4Lin4LiiIGRhdGEtbGFiZWwg4LmB4Lil4LmJ4Lin4LmD4Lir4LmJIENTUwogICDguYDguJvguYfguJnguITguJnguJXguLHguJTguKrguLTguJnguKfguYjguLLguIjguLDguYHguKrguJTguIfguYDguJvguYfguJnguJXguLLguKPg',
  'uLLguIfguKvguKPguLfguK3guYDguJvguYfguJnguIHguLLguKPguYzguJTguJfguLXguKXguLDguKPguLLguKLguIHguLLguKMKCiAgIOC4l+C4s+C4l+C4teC5iOC4meC4teC5iOC4l+C4teC5iOC5gOC4lOC4teC4ouC4p+C4q+C4peC4seC4h+C4p+C4suC4lOC4',
  'q+C4meC5ieC4suC5gOC4quC4o+C5h+C4iCDguJfguLjguIHguJXguLLguKPguLLguIfguYPguJnguKPguLDguJrguJrguIjguLbguIfguYTguJTguYnguJzguKXguYDguKvguKHguLfguK3guJnguIHguLHguJnguKvguKHguJQKICAg4LmE4Lih4LmI4LiV4LmJ4Lit',
  '4LiH4LmE4Lil4LmI4LmB4LiB4LmJ4LiX4Li14Lil4Liw4LiV4Liy4Lij4Liy4LiHIOC5geC4peC4sOC4leC4suC4o+C4suC4h+C4l+C4teC5iOC5gOC4nuC4tOC5iOC4oeC5g+C4q+C4oeC5iOC4l+C4teC4q+C4peC4seC4h+C4geC5h+C5hOC4lOC5ieC5hOC4m+C4',
  'lOC5ieC4p+C4ouC5gOC4peC4ogogICBIVE1MIOC4ouC4seC4h+C5gOC4m+C5h+C4meC4iuC4uOC4lOC5gOC4lOC4teC4ouC4pyDguJXguYjguLLguIfguIHguLHguJnguYHguITguYggQ1NTIOC4ouC5iOC4rS3guILguKLguLLguKLguKvguJnguYnguLLguJXguYjg',
  'uLLguIfguIHguYfguKrguKXguLHguJrguYTguJTguYnguJfguLHguJnguJfguLUKLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqLwpmdW5jdGlvbiBsYWJlbENlbGxzKHJvb3QpewogIGlm',
  'ICghcm9vdCkgcmV0dXJuOwogIHZhciB0YWJsZXMgPSByb290LnF1ZXJ5U2VsZWN0b3JBbGwgPyByb290LnF1ZXJ5U2VsZWN0b3JBbGwoJ3RhYmxlJykgOiBbXTsKICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKHRhYmxlcywgZnVuY3Rpb24odCl7CiAgICB2',
  'YXIgaGVhZHMgPSBBcnJheS5wcm90b3R5cGUubWFwLmNhbGwodC5xdWVyeVNlbGVjdG9yQWxsKCd0aGVhZCB0aCcpLCBmdW5jdGlvbih0aCl7CiAgICAgIHJldHVybiAodGgudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKTsKICAgIH0pOwogICAgaWYgKCFoZWFkcy5s',
  'ZW5ndGgpIHJldHVybjsKICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwodC5xdWVyeVNlbGVjdG9yQWxsKCd0Ym9keSB0cicpLCBmdW5jdGlvbih0cil7CiAgICAgIC8vIOC5geC4luC4p+C4quC4o+C4uOC4m+C4q+C4o+C4t+C4reC5geC4luC4pyAi4LmE',
  '4Lih4LmI4Lih4Li14LiC4LmJ4Lit4Lih4Li54LilIiDguJfguLXguYjguKPguKfguKHguIrguYjguK3guIcg4Lib4Lil4LmI4Lit4Lii4LmE4Lin4LmJ4LmA4LiV4LmH4Lih4LiE4Lin4Liy4Lih4LiB4Lin4LmJ4Liy4LiHCiAgICAgIGlmICh0ci5xdWVyeVNlbGVj',
  'dG9yKCdbY29sc3Bhbl0nKSkgeyB0ci5jbGFzc0xpc3QuYWRkKCdyb3ctd2lkZScpOyByZXR1cm47IH0KICAgICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbCh0ci5jaGlsZHJlbiwgZnVuY3Rpb24odGQsIGkpewogICAgICAgIHZhciBsYWJlbCA9IGhlYWRz',
  'W2ldIHx8ICcnOwogICAgICAgIGlmIChsYWJlbCkgdGQuc2V0QXR0cmlidXRlKCdkYXRhLWxhYmVsJywgbGFiZWwpOwogICAgICAgIGVsc2UgdGQuY2xhc3NMaXN0LmFkZCgnY2VsbC1hY3Rpb25zJyk7ICAgLy8g4LiE4Lit4Lil4Lix4Lih4LiZ4LmM4Lib4Li44LmI',
  '4LihIOC5hOC4oeC5iOC4oeC4teC4q+C4seC4p+C4leC4suC4o+C4suC4hyDguYTguKHguYjguJXguYnguK3guIfguJXguLTguJTguJvguYnguLLguKIKCiAgICAgICAgLy8g4LiK4LmI4Lit4LiH4LiX4Li14LmI4LmE4Lih4LmI4Lih4Li14LiE4LmI4LiyICjguKfg',
  'uYjguLLguIfguKvguKPguLfguK3guILguLXguJQpIOC4muC4meC4iOC4reC5geC4hOC4muC5hOC4oeC5iOC4leC5ieC4reC4h+C5guC4iuC4p+C5jOC5gOC4m+C5h+C4meC4muC4o+C4o+C4l+C4seC4lAogICAgICAgIC8vIOC4geC4suC4o+C5jOC4lOC4iOC4sOC5',
  'hOC4lOC5ieC5hOC4oeC5iOC4ouC4suC4p+C5gOC4geC5ieC4rSDguKrguYjguKfguJnguJrguJnguIjguK3guIHguKfguYnguLLguIfguKLguLHguIfguJXguYnguK3guIfguKHguLXguYDguJ7guLfguYjguK3guYPguKvguYnguITguK3guKXguLHguKHguJnguYzg',
  'uJXguKPguIfguIHguLHguJkKICAgICAgICB2YXIgdHh0ID0gKHRkLnRleHRDb250ZW50IHx8ICcnKS50cmltKCk7CiAgICAgICAgdmFyIGhhc1RoaW5nID0gdGQucXVlcnlTZWxlY3RvcignaW1nLGJ1dHRvbixhLGlucHV0LHN2ZywudGh1bWInKTsKICAgICAgICBp',
  'ZiAoKHR4dCA9PT0gJycgfHwgdHh0ID09PSAn4oCTJyB8fCB0eHQgPT09ICctJykgJiYgIWhhc1RoaW5nKSB7CiAgICAgICAgICB0ZC5jbGFzc0xpc3QuYWRkKCdjZWxsLWVtcHR5Jyk7CiAgICAgICAgfQogICAgICB9KTsKICAgIH0pOwogIH0pOwp9CgpmdW5jdGlv',
  'biBvcGVuTW9kYWwodGl0bGUsIGJvZHlIdG1sLCBmb290SHRtbCwgd2lkZSl7CiAgdmFyIHJvb3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9kYWxSb290Jyk7CiAgcm9vdC5pbm5lckhUTUwgPQogICAgJzxkaXYgY2xhc3M9Im92IiBvbmNsaWNrPSJpZihl',
  'dmVudC50YXJnZXQ9PT10aGlzKWNsb3NlTW9kYWwoKSI+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJtb2RhbCcgKyAod2lkZT8nIHdpZGUnOicnKSArICciPicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJtb2RhbC1oIj48aDM+JyArIGVzYyh0aXRsZSkgKyAnPC9oMz48',
  'YnV0dG9uIGNsYXNzPSJ4IiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPsOXPC9idXR0b24+PC9kaXY+JyArCiAgICAgICAgJzxkaXYgY2xhc3M9Im1vZGFsLWIiPicgKyBib2R5SHRtbCArICc8L2Rpdj4nICsKICAgICAgICAoZm9vdEh0bWwgPyAnPGRpdiBjbGFzcz0i',
  'bW9kYWwtZiI+JyArIGZvb3RIdG1sICsgJzwvZGl2PicgOiAnJykgKwogICAgICAnPC9kaXY+JyArCiAgICAnPC9kaXY+JzsKICBhcHBseVJlYWRPbmx5KHJvb3QpOwogIGxhYmVsQ2VsbHMocm9vdCk7CiAgZG9jdW1lbnQuYm9keS5zdHlsZS5vdmVyZmxvdyA9ICdo',
  'aWRkZW4nOwp9CmZ1bmN0aW9uIGNsb3NlTW9kYWwoKXsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9kYWxSb290JykuaW5uZXJIVE1MID0gJyc7CiAgZG9jdW1lbnQuYm9keS5zdHlsZS5vdmVyZmxvdyA9ICcnOwp9CmRvY3VtZW50LmFkZEV2ZW50TGlzdGVu',
  'ZXIoJ2tleWRvd24nLCBmdW5jdGlvbihlKXsgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgY2xvc2VNb2RhbCgpOyB9KTsKCmZ1bmN0aW9uIGNvbmZpcm1BY3Rpb24odGV4dCwgb25ZZXMpewogIG9wZW5Nb2RhbCgn4Lii4Li34LiZ4Lii4Lix4LiZJywKICAgICc8cD4n',
  'ICsgZXNjKHRleHQpICsgJzwvcD4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gZGdyIiBpZD0iY2ZtQnRuIj7guKLguLfg',
  'uJnguKLguLHguJk8L2J1dHRvbj4nKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2ZtQnRuJykub25jbGljayA9IGZ1bmN0aW9uKCl7IGNsb3NlTW9kYWwoKTsgb25ZZXMoKTsgfTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSB0b2FzdCAtLS0tLS0tLS0tLS0t',
  'LS0tICovCgpmdW5jdGlvbiB0b2FzdChtc2csIGtpbmQpewogIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogIGVsLmNsYXNzTmFtZSA9ICd0b2FzdCAnICsgKGtpbmR8fCcnKTsKICBlbC50ZXh0Q29udGVudCA9IG1zZzsKICBkb2N1bWVu',
  'dC5nZXRFbGVtZW50QnlJZCgndG9hc3RSb290JykuYXBwZW5kQ2hpbGQoZWwpOwogIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgZWwucmVtb3ZlKCk7IH0sIGtpbmQ9PT0nZXJyJyA/IDUyMDAgOiAyODAwKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSBuYXYgKG1vYmls',
  'ZSkgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gdG9nZ2xlTmF2KCl7CiAgdmFyIG5hdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXYnKTsKICBuYXYuY2xhc3NMaXN0LnRvZ2dsZSgnb3BlbicpOwogIGlmIChuYXYuY2xhc3NMaXN0LmNvbnRhaW5z',
  'KCdvcGVuJykpIHsKICAgIHZhciBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICBzLmNsYXNzTmFtZSA9ICdzY3JpbSc7IHMuaWQgPSAnc2NyaW0nOwogICAgcy5vbmNsaWNrID0gZnVuY3Rpb24oKXsgbmF2LmNsYXNzTGlzdC5yZW1vdmUoJ29w',
  'ZW4nKTsgcmVtb3ZlU2NyaW0oKTsgfTsKICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocyk7CiAgfSBlbHNlIHJlbW92ZVNjcmltKCk7Cn0KZnVuY3Rpb24gcmVtb3ZlU2NyaW0oKXsKICB2YXIgcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzY3JpbScp',
  'OwogIGlmIChzKSBzLnJlbW92ZSgpOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIHNlYXJjaCAtLS0tLS0tLS0tLS0tLS0tICovCgp2YXIgc2VhcmNoVGltZXIgPSBudWxsOwpmdW5jdGlvbiBvblNlYXJjaChxKXsKICBjbGVhclRpbWVvdXQoc2VhcmNoVGltZXIpOwog',
  'IGlmICghcSB8fCBxLnRyaW0oKS5sZW5ndGggPCAyKSByZXR1cm47CiAgc2VhcmNoVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdhcHAuc2VhcmNoJywgeyBxOiBxIH0pLnRoZW4oZnVuY3Rpb24ocm93cyl7CiAgICAgIG9wZW5Nb2Rh',
  'bCgn4Lic4Lil4LiB4Liy4Lij4LiE4LmJ4LiZ4Lir4LiyICInICsgcSArICciICgnICsgcm93cy5sZW5ndGggKyAnKScsCiAgICAgICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0iYWxpc3QiPicgKyByb3dzLm1hcChmdW5jdGlvbihyKXsKICAgICAgICAgIHJl',
  'dHVybiAnPGRpdiBjbGFzcz0iYWxpIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCk7Z28oXCcnICsganVtcFBhZ2Uoci5tb2R1bGUpICsgJ1wnKSI+JyArCiAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJpYyI+JyArIG1vZHVsZUljb24oci5tb2R1bGUpICsgJzwvZGl2Pjxk',
  'aXY+JyArCiAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJ0dCI+JyArIGVzYyhyLnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImRkIj4nICsgZXNjKHIubGFiZWwpICsgKHIuZGV0YWlsID8gJyDCtyAnICsgZXNjKHIuZGV0YWlsKSA6',
  'ICcnKSArICc8L2Rpdj4nICsKICAgICAgICAgICAgJzwvZGl2PjwvZGl2Pic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+JwogICAgICAgIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij7guYTguKHguYjguJ7guJrguKPguLLguKLguIHguLLguKPguJfguLXguYjg',
  'uJXguKPguIfguIHguLHguJrguITguLPguITguYnguJk8L2Rpdj4nLCAnJywgdHJ1ZSk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7IH0pOwogIH0sIDQyMCk7Cn0KZnVuY3Rpb24ganVtcFBhZ2UobW9kdWxlKXsK',
  'ICByZXR1cm4gKHtwdXJjaGFzZXM6J3B1cmNoYXNlcycsIHJlcGFpcnM6J3JlcGFpcnMnLCBidWlsZGluZzonYnVpbGRpbmcnLCBhYzonYWMnLCBkZWJ0OidkZWJ0TWFpbicsIHJvb21zOidyb29tcyd9KVttb2R1bGVdIHx8ICdkYXNoYm9hcmQnOwp9CmZ1bmN0aW9u',
  'IG1vZHVsZUljb24obW9kdWxlKXsKICByZXR1cm4gKHtwdXJjaGFzZXM6J/Cfm5InLCByZXBhaXJzOifwn5SnJywgYnVpbGRpbmc6J/Cfj6InLCBhYzon4p2E77iPJywgZGVidDon8J+SsCcsIHJvb21zOifwn5qqJ30pW21vZHVsZV0gfHwgJ/Cfk4QnOwp9CgovKiAt',
  'LS0tLS0tLS0tLS0tLS0tIGZpbGUgdXBsb2FkIC0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKgogKiDguK3guYjguLLguJnguYTguJ/guKXguYzguIjguLLguIEgPGlucHV0IHR5cGU9ZmlsZT4g4LmA4Lib4LmH4LiZIGRhdGFVUkwg4LmB4Lil4LmJ4Lin4Liq4LmI4LiH',
  '4LiC4Li24LmJ4LiZIERyaXZlCiAqIOC4hOC4t+C4mSBhcnJheSDguILguK3guIcge2lkLG5hbWUsdXJsLHRodW1ifQogKi8KZnVuY3Rpb24gdXBsb2FkRmlsZXMoaW5wdXRFbCwgYnVja2V0KXsKICB2YXIgZmlsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2Fs',
  'bChpbnB1dEVsLmZpbGVzIHx8IFtdKTsKICBpZiAoIWZpbGVzLmxlbmd0aCkgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7CiAgdmFyIE1BWCA9IDEyICogMTAyNCAqIDEwMjQ7CiAgdmFyIHRvb0JpZyA9IGZpbGVzLmZpbHRlcihmdW5jdGlvbihmKXsgcmV0dXJu',
  'IGYuc2l6ZSA+IE1BWDsgfSk7CiAgaWYgKHRvb0JpZy5sZW5ndGgpIHsKICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ+C5hOC4n+C4peC5jOC5g+C4q+C4jeC5iOC5gOC4geC4tOC4mSAxMiBNQjogJyArIHRvb0JpZy5tYXAoZnVuY3Rpb24oZil7',
  'cmV0dXJuIGYubmFtZTt9KS5qb2luKCcsICcpKSk7CiAgfQogIHJldHVybiBQcm9taXNlLmFsbChmaWxlcy5tYXAocmVhZEFzRGF0YVVybCkpCiAgICAudGhlbihmdW5jdGlvbihwYXlsb2Fkcyl7IHJldHVybiBjYWxsQXBpKCdmaWxlLnVwbG9hZCcsIHsgYnVja2V0',
  'OiBidWNrZXQsIGZpbGVzOiBwYXlsb2FkcyB9KTsgfSk7Cn0KCmZ1bmN0aW9uIHJlYWRBc0RhdGFVcmwoZmlsZSl7CiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7CiAgICB2YXIgciA9IG5ldyBGaWxlUmVhZGVyKCk7CiAgICBy',
  'Lm9ubG9hZCA9IGZ1bmN0aW9uKCl7IHJlc29sdmUoeyBuYW1lOiBmaWxlLm5hbWUsIG1pbWVUeXBlOiBmaWxlLnR5cGUsIGRhdGFVcmw6IHIucmVzdWx0IH0pOyB9OwogICAgci5vbmVycm9yID0gZnVuY3Rpb24oKXsgcmVqZWN0KG5ldyBFcnJvcign4Lit4LmI4Liy',
  '4LiZ4LmE4Lif4Lil4LmM4LmE4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIOiAnICsgZmlsZS5uYW1lKSk7IH07CiAgICByLnJlYWRBc0RhdGFVUkwoZmlsZSk7CiAgfSk7Cn0KPC9zY3JpcHQ+CjxzY3JpcHQ+Ci8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBBdXRoLmh0bWwg4oCUIOC4q+C4meC5ieC4suC4peC5h+C4reC4geC4reC4tOC4mSDCtyBQSU4gNiDguKvguKXguLHguIEgwrcg4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ',
  'CgogICDguJfguLXguYjguYDguIHguYfguJrguILguK3guIfguJ3guLHguYjguIfguYDguJrguKPguLLguKfguYzguYDguIvguK3guKPguYwgMiDguIrguLHguYnguJkg4LmA4Lie4Lij4Liy4Liw4LmA4Lin4LmH4Lia4LmB4Lit4Lib4LiC4Lit4LiHIEFwcHMgU2Ny',
  'aXB0CiAgIOC4l+C4s+C4h+C4suC4meC5g+C4mSBpZnJhbWUg4LiX4Li14LmI4LiK4Li34LmI4Lit4LmC4LiU4LmA4Lih4LiZ4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LiX4Li44LiB4LiE4Lij4Lix4LmJ4LiH4LiX4Li14LmI4LmA4Lib4Li04LiUCiAgIGxvY2FsU3Rv',
  'cmFnZSDguIjguLbguIfguKvguLLguKLguYTguJTguYkg4LiV4LmJ4Lit4LiH4Lih4Li14LiX4Liy4LiH4Liq4Liz4Lij4Lit4LiHCiAgICAgwrcg4Lij4Lir4Lix4Liq4Lit4LmJ4Liy4LiH4Lit4Li04LiH4LiB4Liy4Lij4LmA4LiC4LmJ4Liy4LmD4LiK4LmJ4LiH',
  '4Liy4LiZICjguK3guLLguKLguLjguKrguLHguYnguJkpIOKAlCDguYDguIHguYfguJrguYPguJkgbG9jYWxTdG9yYWdlIOC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pwogICAgICAg4Lir4Liy4Lii4LiB4LmH4LmB4LiE4LmI4LmD4Liq4LmIIFBJTiDguYPg',
  'uKvguKHguYgKICAgICDCtyDguKPguKvguLHguKrguK3guLjguJvguIHguKPguJPguYwgKOC4hOC4ueC5iOC4geC4seC4miBQSU4pIOKAlCDguYDguIHguYfguJrguJfguLHguYnguIcgbG9jYWxTdG9yYWdlIOC5geC4peC4sOC5g+C4mSBVUkwg4LiC4Lit4LiH4Lir',
  '4LiZ4LmJ4Liy4LmB4Lih4LmICiAgICAgICDguJzguYjguLLguJkgZ29vZ2xlLnNjcmlwdC5oaXN0b3J5IOC5gOC4nuC4t+C5iOC4reC5g+C4q+C5ieC4ouC4seC4h+C4reC4ouC4ueC5iOC4q+C4peC4seC4h+C4m+C4tOC4lOC5gOC4m+C4tOC4lOC5gOC4hOC4o+C4',
  't+C5iOC4reC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCnZhciBBVVRIID0gewogIHNlc3Npb246ICcnLAogIGRldmljZTogJycsCiAgbWU6IG51bGwsCiAgcGluOiAnJywKICBzY3JlZW46',
  'ICcnCn07Cgp2YXIgTFNfU0VTU0lPTiA9ICdtY29ybmVyLnNlc3Npb24nOwp2YXIgTFNfREVWSUNFICA9ICdtY29ybmVyLmRldmljZSc7CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4l+C4teC5iOC5gOC4geC5h+C4muC4neC4seC5iOC4h+C5gOC4muC4o+C4suC4p+C5',
  'jOC5gOC4i+C4reC4o+C5jCAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiBsc0dldChrKXsKICB0cnkgeyByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGspIHx8ICcnOyB9IGNhdGNoIChlKSB7IHJldHVybiAnJzsgfQp9CmZ1bmN0aW9uIGxz',
  'U2V0KGssIHYpewogIHRyeSB7IHYgPyB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oaywgdikgOiB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oayk7IH0KICBjYXRjaCAoZSkgeyAvKiDguYLguKvguKHguJTguKrguYjguKfguJnguJXguLHguKfguKvg',
  'uKPguLfguK3guJvguLTguJTguITguLjguIHguIHguLXguYnguYTguKfguYkg4oCUIOC5g+C4iuC5ieC4l+C4suC4h+C4quC4s+C4o+C4reC4hyAqLyB9Cn0KCi8qKiDguYDguILguLXguKLguJnguKPguKvguLHguKrguK3guLjguJvguIHguKPguJPguYzguKXguIcg',
  'VVJMIOC4guC4reC4h+C4q+C4meC5ieC4suC5geC4oeC5iCDguYPguKvguYnguKPguK3guJTguILguYnguLLguKHguIHguLLguKPguYDguJvguLTguJTguYPguKvguKHguYggKi8KZnVuY3Rpb24gZGV2aWNlVG9VcmwodG9rZW4pewogIHRyeSB7CiAgICBpZiAoIXdp',
  'bmRvdy5nb29nbGUgfHwgIWdvb2dsZS5zY3JpcHQgfHwgIWdvb2dsZS5zY3JpcHQuaGlzdG9yeSkgcmV0dXJuOwogICAgdmFyIHBhcmFtcyA9IHt9OwogICAgaWYgKGFjY2Vzc0tleSgpKSBwYXJhbXMua2V5ID0gYWNjZXNzS2V5KCk7CiAgICBpZiAodG9rZW4pIHBh',
  'cmFtcy5kID0gdG9rZW47CiAgICBnb29nbGUuc2NyaXB0Lmhpc3RvcnkucmVwbGFjZVN0YXRlKHt9LCBwYXJhbXMsIGxvY2F0aW9uLmhhc2gpOwogIH0gY2F0Y2ggKGUpIHsgLyog4LmE4Lih4LmI4LmD4LiK4LmI4LmA4Lin4LmH4Lia4LmB4Lit4LibICjguYDguIrg',
  'uYjguJnguYDguJvguLTguJTguYPguJkgZGlhbG9nKSDigJQg4LiC4LmJ4Liy4Lih4LmE4LibICovIH0KfQoKZnVuY3Rpb24gc2F2ZURldmljZSh0b2tlbil7CiAgQVVUSC5kZXZpY2UgPSB0b2tlbiB8fCAnJzsKICBsc1NldChMU19ERVZJQ0UsIEFVVEguZGV2aWNl',
  'KTsKICBkZXZpY2VUb1VybChBVVRILmRldmljZSk7Cn0KCmZ1bmN0aW9uIHNhdmVTZXNzaW9uKHRva2VuKXsKICBBVVRILnNlc3Npb24gPSB0b2tlbiB8fCAnJzsKICBsc1NldChMU19TRVNTSU9OLCBBVVRILnNlc3Npb24pOwp9CgovKiog4Lit4LmI4Liy4LiZ4LiE',
  '4LmI4Liy4LiX4Li14LmI4LmA4LiB4LmH4Lia4LmE4Lin4LmJ4LiX4Lix4LmJ4LiH4Lir4Lih4LiUICjguJXguYnguK3guIfguKPguK0gVVJMIOC4guC4reC4h+C4q+C4meC5ieC4suC5geC4oeC5iCDguIjguLbguIfguYDguJvguYfguJnguYHguJrguJogY2FsbGJh',
  'Y2spICovCmZ1bmN0aW9uIGxvYWRTdG9yZWQoZG9uZSl7CiAgQVVUSC5zZXNzaW9uID0gbHNHZXQoTFNfU0VTU0lPTik7CiAgQVVUSC5kZXZpY2UgID0gbHNHZXQoTFNfREVWSUNFKTsKCiAgaWYgKHdpbmRvdy5nb29nbGUgJiYgZ29vZ2xlLnNjcmlwdCAmJiBnb29n',
  'bGUuc2NyaXB0LnVybCkgewogICAgdHJ5IHsKICAgICAgZ29vZ2xlLnNjcmlwdC51cmwuZ2V0TG9jYXRpb24oZnVuY3Rpb24obG9jKXsKICAgICAgICB2YXIgcCA9IChsb2MgJiYgbG9jLnBhcmFtZXRlcikgfHwge307CiAgICAgICAgaWYgKHAuZCAmJiAhQVVUSC5k',
  'ZXZpY2UpIHsgQVVUSC5kZXZpY2UgPSBTdHJpbmcocC5kKTsgbHNTZXQoTFNfREVWSUNFLCBBVVRILmRldmljZSk7IH0KICAgICAgICBpZiAocC5rZXkgJiYgIWFjY2Vzc0tleSgpKSBSRVNPTFZFRF9LRVkgPSBTdHJpbmcocC5rZXkpOwogICAgICAgIGRvbmUoKTsK',
  'ICAgICAgfSk7CiAgICAgIHJldHVybjsKICAgIH0gY2F0Y2ggKGUpIHsgLyog4LmD4LiK4LmJ4LiX4Liy4LiH4Lib4LiB4LiV4Li0ICovIH0KICB9CiAgZG9uZSgpOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4leC4seC4p+C4hOC4uOC4oeC4peC4s+C4lOC4seC4',
  'muC4q+C4meC5ieC4suC4iOC4rSAtLS0tLS0tLS0tLS0tLS0tICovCgovKiog4LmA4Lij4Li14Lii4LiB4LiV4Lit4LiZ4LmA4Lib4Li04LiU4Lir4LiZ4LmJ4Liy4LmA4Lin4LmH4LiaIOKAlCDguJXguLHguJTguKrguLTguJnguKfguYjguLLguIjguLDguYPguKvg',
  'uYnguYDguKvguYfguJnguK3guLDguYTguKPguIHguYjguK3guJkgKi8KZnVuY3Rpb24gYXV0aEdhdGUoKXsKICBsb2FkU3RvcmVkKGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdhdXRoLm1lJykudGhlbihmdW5jdGlvbihtZSl7CiAgICAgIEFVVEgubWUgPSBtZTsK',
  'ICAgICAgaWYgKG1lLnNpZ25lZEluKSByZXR1cm4gZW50ZXJBcHAobWUpOwogICAgICBpZiAoQVVUSC5kZXZpY2UpIHJldHVybiBzaG93UGluKCk7CiAgICAgIHNob3dMb2dpbigpOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICAgIHNob3dMb2dpbihlLm1l',
  'c3NhZ2UgfHwgZSk7CiAgICB9KTsKICB9KTsKfQoKZnVuY3Rpb24gZW50ZXJBcHAobWUpewogIEFVVEgubWUgPSBtZTsKICBoaWRlQXV0aCgpOwogIGJvb3ROb3coKTsKICAvLyDguYDguJ7guLTguYjguIfguKXguYfguK3guIHguK3guLTguJnguJTguYnguKfguKLg',
  'uKPguKvguLHguKrguJzguYjguLLguJnguYHguKXguLDguKLguLHguIfguYTguKHguYjguYDguITguKLguJXguLHguYnguIcgUElOIOC4muC4meC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5iSDigJQg4LiK4Lin4LiZ4LiV4Lix4LmJ4LiH4Liq4Lix4LiB4LiE',
  '4Lij4Lix4LmJ4LiHCiAgaWYgKCFBVVRILmRldmljZSAmJiBtZS51c2VybmFtZSAmJiAhbHNHZXQoJ21jb3JuZXIucGluQXNrZWQnKSkgewogICAgc2V0VGltZW91dChvZmZlclBpbiwgOTAwKTsKICB9Cn0KCmZ1bmN0aW9uIGhpZGVBdXRoKCl7CiAgdmFyIHIgPSBk',
  'b2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXV0aFJvb3QnKTsKICBpZiAocikgci5pbm5lckhUTUwgPSAnJzsKICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2xvY2tlZCcpOwp9CgpmdW5jdGlvbiBzaG93QXV0aChodG1sKXsKICBkb2N1bWVudC5ib2R5',
  'LmNsYXNzTGlzdC5hZGQoJ2xvY2tlZCcpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdXRoUm9vdCcpLmlubmVySFRNTCA9CiAgICAnPGRpdiBjbGFzcz0iYXV0aC13cmFwIj48ZGl2IGNsYXNzPSJhdXRoLWNhcmQiPicgKwogICAgICAnPGRpdiBjbGFzcz0i',
  'YXV0aC1icmFuZCI+8J+PoiA8Yj4nICsgZXNjKChTLmJvb3QgJiYgUy5ib290LmFwcCAmJiBTLmJvb3QuYXBwLm5hbWUpIHx8ICdUaGUgTSBDb3JuZXIgQVAnKSArICc8L2I+PC9kaXY+JyArCiAgICAgIGh0bWwgKwogICAgJzwvZGl2PjwvZGl2Pic7Cn0KCi8qIC0t',
  'LS0tLS0tLS0tLS0tLS0g4Lir4LiZ4LmJ4Liy4Lil4LmH4Lit4LiB4Lit4Li04LiZ4LiU4LmJ4Lin4Lii4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZIC0tLS0tLS0tLS0tLS0tLS0gKi8KCmZ1bmN0aW9uIHNob3dMb2dpbihlcnIpewogIEFVVEguc2NyZWVuID0gJ2xv',
  'Z2luJzsKICBzaG93QXV0aCgKICAgICc8aDIgY2xhc3M9ImF1dGgtaCI+4LmA4LiC4LmJ4Liy4Liq4Li54LmI4Lij4Liw4Lia4LiaPC9oMj4nICsKICAgICc8cCBjbGFzcz0iYXV0aC1zdWIiPuC5g+C4quC5iOC4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5ieC5',
  'geC4peC4sOC4o+C4q+C4seC4quC4nOC5iOC4suC4meC4l+C4teC5iOC5hOC4lOC5ieC4o+C4seC4mjwvcD4nICsKICAgIChlcnIgPyAnPGRpdiBjbGFzcz0iYXV0aC1lcnIiPicgKyBlc2MoZXJyKSArICc8L2Rpdj4nIDogJzxkaXYgY2xhc3M9ImF1dGgtZXJyIiBp',
  'ZD0iYXV0aEVyciIgaGlkZGVuPjwvZGl2PicpICsKICAgICc8ZGl2IGNsYXNzPSJhdXRoLWYiPjxsYWJlbCBmb3I9ImxnVXNlciI+4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJPC9sYWJlbD4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0ibGdV',
  'c2VyIiBhdXRvY29tcGxldGU9InVzZXJuYW1lIiBhdXRvY2FwaXRhbGl6ZT0ibm9uZSIgc3BlbGxjaGVjaz0iZmFsc2UiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImF1dGgtZiI+PGxhYmVsIGZvcj0ibGdQYXNzIj7guKPguKvguLHguKrguJzguYjguLLguJk8',
  'L2xhYmVsPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJsZ1Bhc3MiIHR5cGU9InBhc3N3b3JkIiBhdXRvY29tcGxldGU9ImN1cnJlbnQtcGFzc3dvcmQiPjwvZGl2PicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgYXV0aC1nbyIgaWQ9Imxn',
  'R28iPuC5gOC4guC5ieC4suC4quC4ueC5iOC4o+C4sOC4muC4mjwvYnV0dG9uPicgKwogICAgKEFVVEguZGV2aWNlID8gJzxidXR0b24gY2xhc3M9ImJ0biBhdXRoLWFsdCIgb25jbGljaz0ic2hvd1BpbigpIj7ihpAg4LiB4Lil4Lix4Lia4LmE4Lib4LmD4LiK4LmJ',
  'IFBJTjwvYnV0dG9uPicgOiAnJykgKwogICAgJzxwIGNsYXNzPSJhdXRoLWZvb3QiPuC4peC4t+C4oeC4o+C4q+C4seC4quC4nOC5iOC4suC4mT8g4LmD4Lir4LmJ4Lic4Li54LmJ4LiU4Li54LmB4Lil4LiV4Lix4LmJ4LiH4Lij4Lir4Lix4Liq4LmD4Lir4Lih4LmI',
  '4LmD4Lir4LmJ4LiI4Liy4LiB4LmA4Lih4LiZ4Li54LmD4LiZ4LiK4Li14LiVPC9wPicKICApOwoKICB2YXIgZ28gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGdHbycpOwogIHZhciB1c2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xnVXNlcicpOwog',
  'IHZhciBwYXNzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xnUGFzcycpOwoKICBmdW5jdGlvbiBzdWJtaXQoKXsKICAgIHZhciB1ID0gdXNlci52YWx1ZS50cmltKCksIHAgPSBwYXNzLnZhbHVlOwogICAgaWYgKCF1IHx8ICFwKSByZXR1cm4gYXV0aEVycm9y',
  'KCfguIHguKPguLjguJPguLLguIHguKPguK3guIHguJfguLHguYnguIfguIrguLfguYjguK3guJzguLnguYnguYPguIrguYnguYHguKXguLDguKPguKvguLHguKrguJzguYjguLLguJknKTsKICAgIGdvLmRpc2FibGVkID0gdHJ1ZTsKICAgIGdvLmlubmVySFRNTCA9',
  'ICc8c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDguIHguLPguKXguLHguIfguJXguKPguKfguIjguKrguK3guJrigKYnOwogICAgY2FsbEFwaSgnYXV0aC5sb2dpbicsIHsgdXNlcm5hbWU6IHUsIHBhc3N3b3JkOiBwIH0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICAg',
  'IHNhdmVTZXNzaW9uKHIuc2Vzc2lvbik7CiAgICAgIGlmIChyLm11c3RDaGFuZ2UpIHJldHVybiBzaG93Q2hhbmdlUGFzc3dvcmQodHJ1ZSk7CiAgICAgIHJldHVybiBjYWxsQXBpKCdhdXRoLm1lJykudGhlbihlbnRlckFwcCk7CiAgICB9KS5jYXRjaChmdW5jdGlv',
  'bihlKXsKICAgICAgZ28uZGlzYWJsZWQgPSBmYWxzZTsKICAgICAgZ28udGV4dENvbnRlbnQgPSAn4LmA4LiC4LmJ4Liy4Liq4Li54LmI4Lij4Liw4Lia4LiaJzsKICAgICAgcGFzcy52YWx1ZSA9ICcnOwogICAgICBhdXRoRXJyb3IoZS5tZXNzYWdlIHx8IGUpOwog',
  'ICAgfSk7CiAgfQoKICBnby5vbmNsaWNrID0gc3VibWl0OwogIFt1c2VyLCBwYXNzXS5mb3JFYWNoKGZ1bmN0aW9uKGVsKXsKICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihldil7IGlmIChldi5rZXkgPT09ICdFbnRlcicpIHN1Ym1p',
  'dCgpOyB9KTsKICB9KTsKICB1c2VyLmZvY3VzKCk7Cn0KCmZ1bmN0aW9uIGF1dGhFcnJvcihtc2cpewogIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdXRoRXJyJyk7CiAgaWYgKGVsKSB7IGVsLnRleHRDb250ZW50ID0gbXNnOyBlbC5oaWRkZW4g',
  'PSBmYWxzZTsgfQogIGVsc2Ugc2hvd0xvZ2luKG1zZyk7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4Lir4LiZ4LmJ4LiyIFBJTiA2IOC4q+C4peC4seC4gSAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiBzaG93UGluKCl7CiAgQVVUSC5zY3JlZW4gPSAncGlu',
  'JzsKICBBVVRILnBpbiA9ICcnOwogIHNob3dBdXRoKAogICAgJzxoMiBjbGFzcz0iYXV0aC1oIj7guYPguKrguYggUElOPC9oMj4nICsKICAgICc8cCBjbGFzcz0iYXV0aC1zdWIiPuC4m+C4peC4lOC4peC5h+C4reC4geC4lOC5ieC4p+C4ouC4o+C4q+C4seC4qiA2',
  'IOC4q+C4peC4seC4geC4guC4reC4h+C5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5iTwvcD4nICsKICAgICc8ZGl2IGNsYXNzPSJhdXRoLWVyciIgaWQ9ImF1dGhFcnIiIGhpZGRlbj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJwaW4tZG90cyIgaWQ9InBp',
  'bkRvdHMiPicgKyBwaW5Eb3RzSHRtbCgnJykgKyAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0icGluLXBhZCI+JyArCiAgICAgIFsxLDIsMyw0LDUsNiw3LDgsOV0ubWFwKGZ1bmN0aW9uKG4pewogICAgICAgIHJldHVybiAnPGJ1dHRvbiBjbGFzcz0icGluLWsi',
  'IG9uY2xpY2s9InBpblB1c2goXCcnICsgbiArICdcJykiPicgKyBuICsgJzwvYnV0dG9uPic7CiAgICAgIH0pLmpvaW4oJycpICsKICAgICAgJzxidXR0b24gY2xhc3M9InBpbi1rIGdob3N0IiBvbmNsaWNrPSJzaG93TG9naW4oKSIgdGl0bGU9IuC5g+C4iuC5ieC4',
  'o+C4q+C4seC4quC4nOC5iOC4suC4meC5geC4l+C4mSI+8J+UkTwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0icGluLWsiIG9uY2xpY2s9InBpblB1c2goXCcwXCcpIj4wPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJwaW4tayBnaG9z',
  'dCIgb25jbGljaz0icGluQmFjaygpIiB0aXRsZT0i4Lil4LiaIj7ijKs8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gYXV0aC1hbHQiIG9uY2xpY2s9ImZvcmdldFRoaXNEZXZpY2UoKSI+4Lil4Li34LihIFBJTiDigJQg',
  '4LmA4LiC4LmJ4Liy4LiU4LmJ4Lin4Lii4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZPC9idXR0b24+JwogICk7CgogIC8vIOC4hOC4teC4ouC5jOC4muC4reC4o+C5jOC4lOC4iOC4o+C4tOC4h+C4geC5h+C5g+C4iuC5ieC5hOC4lOC5iSDguYTguKHguYjguJXguYng',
  'uK3guIfguIjguLTguYnguKHguJvguLjguYjguKHguJrguJnguIjguK0KICBkb2N1bWVudC5vbmtleWRvd24gPSBmdW5jdGlvbihldil7CiAgICBpZiAoQVVUSC5zY3JlZW4gIT09ICdwaW4nKSByZXR1cm47CiAgICBpZiAoL15cZCQvLnRlc3QoZXYua2V5KSkgcGlu',
  'UHVzaChldi5rZXkpOwogICAgZWxzZSBpZiAoZXYua2V5ID09PSAnQmFja3NwYWNlJykgcGluQmFjaygpOwogIH07Cn0KCmZ1bmN0aW9uIHBpbkRvdHNIdG1sKHBpbil7CiAgdmFyIGh0bWwgPSAnJzsKICBmb3IgKHZhciBpID0gMDsgaSA8IDY7IGkrKykgaHRtbCAr',
  'PSAnPGkgY2xhc3M9IicgKyAoaSA8IHBpbi5sZW5ndGggPyAnb24nIDogJycpICsgJyI+PC9pPic7CiAgcmV0dXJuIGh0bWw7Cn0KCmZ1bmN0aW9uIHBpblB1c2goZCl7CiAgaWYgKEFVVEgucGluLmxlbmd0aCA+PSA2KSByZXR1cm47CiAgQVVUSC5waW4gKz0gZDsK',
  'ICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGluRG90cycpLmlubmVySFRNTCA9IHBpbkRvdHNIdG1sKEFVVEgucGluKTsKICBpZiAoQVVUSC5waW4ubGVuZ3RoID09PSA2KSBzZXRUaW1lb3V0KHBpblN1Ym1pdCwgMTIwKTsKfQoKZnVuY3Rpb24gcGluQmFjaygp',
  'ewogIEFVVEgucGluID0gQVVUSC5waW4uc2xpY2UoMCwgLTEpOwogIHZhciBkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpbkRvdHMnKTsKICBpZiAoZCkgZC5pbm5lckhUTUwgPSBwaW5Eb3RzSHRtbChBVVRILnBpbik7Cn0KCmZ1bmN0aW9uIHBpblN1Ym1p',
  'dCgpewogIHZhciBwaW4gPSBBVVRILnBpbjsKICBBVVRILnBpbiA9ICcnOwogIHZhciBkb3RzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpbkRvdHMnKTsKICBpZiAoZG90cykgZG90cy5jbGFzc0xpc3QuYWRkKCdidXN5Jyk7CgogIGNhbGxBcGkoJ2F1dGgu',
  'dW5sb2NrJywgeyBkZXZpY2U6IEFVVEguZGV2aWNlLCBwaW46IHBpbiB9KS50aGVuKGZ1bmN0aW9uKHIpewogICAgc2F2ZVNlc3Npb24oci5zZXNzaW9uKTsKICAgIGRvY3VtZW50Lm9ua2V5ZG93biA9IG51bGw7CiAgICByZXR1cm4gY2FsbEFwaSgnYXV0aC5tZScp',
  'LnRoZW4oZW50ZXJBcHApOwogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgdmFyIG1zZyA9IFN0cmluZyhlLm1lc3NhZ2UgfHwgZSk7CiAgICBpZiAoZG90cykgeyBkb3RzLmNsYXNzTGlzdC5yZW1vdmUoJ2J1c3knKTsgZG90cy5jbGFzc0xpc3QuYWRkKCdzaGFr',
  'ZScpOyBkb3RzLmlubmVySFRNTCA9IHBpbkRvdHNIdG1sKCcnKTsgfQogICAgc2V0VGltZW91dChmdW5jdGlvbigpeyBpZiAoZG90cykgZG90cy5jbGFzc0xpc3QucmVtb3ZlKCdzaGFrZScpOyB9LCA1MDApOwogICAgYXV0aEVycm9yKG1zZyk7CiAgICAvLyBQSU4g',
  '4LiW4Li54LiB4Lii4LiB4LmA4Lil4Li04LiB4LmE4Lib4LmB4Lil4LmJ4LinICjguJzguLTguJTguITguKPguJrguYLguITguKfguJXguLIgLyDguKvguKHguJTguK3guLLguKLguLgpIOKAlCDguJXguYnguK3guIfguIHguKXguLHguJrguYTguJvguYPguIrguYng',
  'uKPguKvguLHguKrguJzguYjguLLguJkKICAgIGlmICgv4Lil4LmH4Lit4LiB4Lit4Li04LiZ4LiU4LmJ4Lin4Lii4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZLy50ZXN0KG1zZykpIHsKICAgICAgc2F2ZURldmljZSgnJyk7CiAgICAgIHNldFRpbWVvdXQoZnVuY3Rp',
  'b24oKXsgc2hvd0xvZ2luKG1zZyk7IH0sIDE0MDApOwogICAgfQogIH0pOwp9CgpmdW5jdGlvbiBmb3JnZXRUaGlzRGV2aWNlKCl7CiAgdmFyIHRva2VuID0gQVVUSC5kZXZpY2U7CiAgc2F2ZURldmljZSgnJyk7CiAgbHNTZXQoJ21jb3JuZXIucGluQXNrZWQnLCAn',
  'Jyk7CiAgZG9jdW1lbnQub25rZXlkb3duID0gbnVsbDsKICBpZiAodG9rZW4pIGNhbGxBcGkoJ2F1dGguZm9yZ2V0RGV2aWNlJywgeyBkZXZpY2U6IHRva2VuIH0pLmNhdGNoKGZ1bmN0aW9uKCl7IC8qIOC4q+C4oeC4lOC4reC4suC4ouC4uOC5hOC4m+C5geC4peC5',
  'ieC4p+C4geC5h+C4iuC5iOC4suC4h+C4oeC4seC4mSAqLyB9KTsKICBzaG93TG9naW4oKTsKfQoKLyogLS0tLS0tLS0tLS0tLS0tLSDguJXguLHguYnguIcgUElOIC0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKiDguIrguKfguJnguJXguLHguYnguIcgUElOIOC4q+C4',
  'peC4seC4h+C4peC5h+C4reC4geC4reC4tOC4meC4hOC4o+C4seC5ieC4h+C5geC4o+C4geC4muC4meC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5iSAqLwpmdW5jdGlvbiBvZmZlclBpbigpewogIGxzU2V0KCdtY29ybmVyLnBpbkFza2VkJywgJzEnKTsKICBv',
  'cGVuTW9kYWwoJ+C4leC4seC5ieC4hyBQSU4g4Liq4Liz4Lir4Lij4Lix4Lia4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJJywKICAgICc8cD7guJXguLHguYnguIfguKPguKvguLHguKogNiDguKvguKXguLHguIHguYTguKfguYkg4LiI4Liw4LmE4LiU4LmJ',
  '4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4Lie4Li04Lih4Lie4LmM4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LiX4Li44LiB4LiE4Lij4Lix4LmJ4LiH4LiX4Li14LmI4LmA4Lib4Li04LiUPC9wPicgKwogICAgJzxwIGNsYXNzPSJtdXRlZCBmczEzIj5QSU4g4Lic4Li5',
  '4LiB4LiB4Lix4Lia4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJ4LmA4LiE4Lij4Li34LmI4Lit4LiH4LmA4LiU4Li14Lii4LinIOC5gOC4hOC4o+C4t+C5iOC4reC4h+C4reC4t+C5iOC4meC5g+C4iuC5ieC5hOC4oeC5iOC5hOC4lOC5iSDCtyDguKLguIHg',
  'uYDguKXguLTguIHguYDguKHguLfguYjguK3guYTguKvguKPguYjguIHguYfguYTguJTguYnguYPguJnguKvguJnguYnguLLguJXguLHguYnguIfguITguYjguLI8L3A+JywKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4LmE',
  '4Lin4LmJ4LiB4LmI4Lit4LiZPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iY2xvc2VNb2RhbCgpO2Zvcm1TZXRQaW4oKSI+4LiV4Lix4LmJ4LiHIFBJTiDguYDguKXguKI8L2J1dHRvbj4nKTsKfQoKZnVuY3Rpb24gZm9y',
  'bVNldFBpbigpewogIG9wZW5Nb2RhbCgn4LiV4Lix4LmJ4LiHIFBJTiA2IOC4q+C4peC4seC4gScsCiAgICAnPGRpdiBjbGFzcz0iZmdyaWQiPicgKwogICAgICAnPGRpdiBjbGFzcz0iZiBmdWxsIj48bGFiZWwgZm9yPSJwaW4xIj5QSU4g4LmD4Lir4Lih4LmIPC9s',
  'YWJlbD4nICsKICAgICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJwaW4xIiB0eXBlPSJwYXNzd29yZCIgaW5wdXRtb2RlPSJudW1lcmljIiBtYXhsZW5ndGg9IjYiICcgKwogICAgICAgICdhdXRvY29tcGxldGU9Im5ldy1wYXNzd29yZCIgcGxhY2Vob2xkZXI9',
  'IuKAouKAouKAouKAouKAouKAoiI+PC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJmIGZ1bGwiPjxsYWJlbCBmb3I9InBpbjIiPuC5g+C4quC5iCBQSU4g4Lit4Li14LiB4LiE4Lij4Lix4LmJ4LiHPC9sYWJlbD4nICsKICAgICAgICAnPGlucHV0IGNsYXNzPSJp',
  'bnAiIGlkPSJwaW4yIiB0eXBlPSJwYXNzd29yZCIgaW5wdXRtb2RlPSJudW1lcmljIiBtYXhsZW5ndGg9IjYiICcgKwogICAgICAgICdhdXRvY29tcGxldGU9Im5ldy1wYXNzd29yZCIgcGxhY2Vob2xkZXI9IuKAouKAouKAouKAouKAouKAoiI+PC9kaXY+JyArCiAg',
  'ICAgICc8ZGl2IGNsYXNzPSJmIGZ1bGwiPjxsYWJlbCBmb3I9InBpbkRldiI+4LiK4Li34LmI4Lit4LmA4LiE4Lij4Li34LmI4Lit4LiHICjguYTguKfguYnguJTguLnguKLguYnguK3guJnguKvguKXguLHguIcpPC9sYWJlbD4nICsKICAgICAgICAnPGlucHV0IGNs',
  'YXNzPSJpbnAiIGlkPSJwaW5EZXYiIHZhbHVlPSInICsgZXNjKGd1ZXNzRGV2aWNlTmFtZSgpKSArICciPjwvZGl2PicgKwogICAgJzwvZGl2PicgKwogICAgJzxwIGNsYXNzPSJtdXRlZCBmczEzIG10OCI+4Lir4Lil4Li14LiB4LmA4Lil4Li14LmI4Lii4LiH4LmA',
  '4Lil4LiC4LiX4Li14LmI4LmA4LiU4Liy4LiH4LmI4Liy4LiiIOC5gOC4iuC5iOC4mSAxMTExMTEg4Lir4Lij4Li34LitIDEyMzQ1NjwvcD4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8',
  'L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBpZD0icGluR28iPuC4muC4seC4meC4l+C4tuC4gSBQSU48L2J1dHRvbj4nKTsKCiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpbkdvJykub25jbGljayA9IGZ1bmN0aW9uKCl7CiAgICB2',
  'YXIgYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaW4xJykudmFsdWU7CiAgICB2YXIgYiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaW4yJykudmFsdWU7CiAgICBpZiAoIS9eXGR7Nn0kLy50ZXN0KGEpKSByZXR1cm4gdG9hc3QoJ1BJTiDguJXguYng',
  'uK3guIfguYDguJvguYfguJnguJXguLHguKfguYDguKXguIIgNiDguKvguKXguLHguIEnLCAnZXJyJyk7CiAgICBpZiAoYSAhPT0gYikgcmV0dXJuIHRvYXN0KCdQSU4g4Liq4Lit4LiH4LiK4LmI4Lit4LiH4LmE4Lih4LmI4LiV4Lij4LiH4LiB4Lix4LiZJywgJ2Vy',
  'cicpOwogICAgdmFyIGJ0biA9IHRoaXM7CiAgICBidG4uZGlzYWJsZWQgPSB0cnVlOwogICAgYnRuLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDguIHguLPguKXguLHguIfguJrguLHguJnguJfguLbguIHigKYnOwogICAgY2FsbEFwaSgn',
  'YXV0aC5zZXRQaW4nLCB7IHBpbjogYSwgZGV2aWNlOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGluRGV2JykudmFsdWUgfSkudGhlbihmdW5jdGlvbihyKXsKICAgICAgc2F2ZURldmljZShyLmRldmljZSk7CiAgICAgIGNsb3NlTW9kYWwoKTsKICAgICAgdG9h',
  'c3QoJ+C4leC4seC5ieC4hyBQSU4g4LmA4Lij4Li14Lii4Lia4Lij4LmJ4Lit4LiiIOKAlCDguITguKPguLHguYnguIfguKvguJnguYnguLLguYPguKrguYjguYHguITguYggNiDguKvguKXguLHguIEnLCAnb2snKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewog',
  'ICAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTsKICAgICAgYnRuLnRleHRDb250ZW50ID0gJ+C4muC4seC4meC4l+C4tuC4gSBQSU4nOwogICAgICB0b2FzdChlLm1lc3NhZ2UgfHwgZSwgJ2VycicpOwogICAgfSk7CiAgfTsKfQoKZnVuY3Rpb24gZ3Vlc3NEZXZpY2VO',
  'YW1lKCl7CiAgdmFyIHVhID0gbmF2aWdhdG9yLnVzZXJBZ2VudCB8fCAnJzsKICBpZiAoL2lQaG9uZS8udGVzdCh1YSkpIHJldHVybiAnaVBob25lJzsKICBpZiAoL2lQYWQvLnRlc3QodWEpKSByZXR1cm4gJ2lQYWQnOwogIGlmICgvQW5kcm9pZC8udGVzdCh1YSkp',
  'IHJldHVybiAnQW5kcm9pZCc7CiAgaWYgKC9NYWNpbnRvc2gvLnRlc3QodWEpKSByZXR1cm4gJ01hYyc7CiAgaWYgKC9XaW5kb3dzLy50ZXN0KHVhKSkgcmV0dXJuICdXaW5kb3dzJzsKICByZXR1cm4gJ+C4reC4uOC4m+C4geC4o+C4k+C5jOC4guC4reC4h+C4ieC4',
  'seC4mSc7Cn0KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZIC0tLS0tLS0tLS0tLS0tLS0gKi8KCi8qKiBAcGFyYW0ge2Jvb2xlYW59IGZvcmNlZCB0cnVlID0g4Lij4Liw4Lia4Lia4Lia4Lix',
  '4LiH4LiE4Lix4Lia4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LiV4Lit4LiZ4Lil4LmH4Lit4LiB4Lit4Li04LiZ4LiE4Lij4Lix4LmJ4LiH4LmB4Lij4LiBICovCmZ1bmN0aW9uIHNob3dDaGFuZ2VQYXNzd29yZChmb3JjZWQpewogIGlmICghZm9yY2VkKSByZXR1cm4g',
  'Zm9ybUNoYW5nZVBhc3N3b3JkKCk7CiAgQVVUSC5zY3JlZW4gPSAnY2hhbmdlJzsKICBzaG93QXV0aCgKICAgICc8aDIgY2xhc3M9ImF1dGgtaCI+4LiV4Lix4LmJ4LiH4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LiC4Lit4LiH4LiE4Li44LiT4LmA4Lit4LiHPC9o',
  'Mj4nICsKICAgICc8cCBjbGFzcz0iYXV0aC1zdWIiPuC4o+C4q+C4seC4quC4l+C4teC5iOC5hOC4lOC5ieC4oeC4suC5gOC4m+C5h+C4meC4o+C4q+C4seC4quC4iuC4seC5iOC4p+C4hOC4o+C4suC4pyDguYDguJvguKXguLXguYjguKLguJnguIHguYjguK3guJng',
  'uYPguIrguYnguIfguLLguJnguKvguJnguLbguYjguIfguITguKPguLHguYnguIc8L3A+JyArCiAgICAnPGRpdiBjbGFzcz0iYXV0aC1lcnIiIGlkPSJhdXRoRXJyIiBoaWRkZW4+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iYXV0aC1mIj48bGFiZWwgZm9yPSJj',
  'cE9sZCI+4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmA4LiU4Li04LihPC9sYWJlbD4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBpZD0iY3BPbGQiIHR5cGU9InBhc3N3b3JkIiBhdXRvY29tcGxldGU9ImN1cnJlbnQtcGFzc3dvcmQiPjwvZGl2PicgKwog',
  'ICAgJzxkaXYgY2xhc3M9ImF1dGgtZiI+PGxhYmVsIGZvcj0iY3BOZXciPuC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iCAo4Lit4Lii4LmI4Liy4LiH4LiZ4LmJ4Lit4LiiIDgg4LiV4Lix4LinKTwvbGFiZWw+JyArCiAgICAgICc8aW5wdXQgY2xh',
  'c3M9ImlucCIgaWQ9ImNwTmV3IiB0eXBlPSJwYXNzd29yZCIgYXV0b2NvbXBsZXRlPSJuZXctcGFzc3dvcmQiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImF1dGgtZiI+PGxhYmVsIGZvcj0iY3BOZXcyIj7guYPguKrguYjguKPguKvguLHguKrguJzguYjguLLg',
  'uJnguYPguKvguKHguYjguK3guLXguIHguITguKPguLHguYnguIc8L2xhYmVsPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJjcE5ldzIiIHR5cGU9InBhc3N3b3JkIiBhdXRvY29tcGxldGU9Im5ldy1wYXNzd29yZCI+PC9kaXY+JyArCiAgICAnPGJ1',
  'dHRvbiBjbGFzcz0iYnRuIHByaSBhdXRoLWdvIiBpZD0iY3BHbyI+4Lia4Lix4LiZ4LiX4Li24LiB4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmIPC9idXR0b24+JwogICk7CgogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjcEdvJykub25jbGlj',
  'ayA9IGZ1bmN0aW9uKCl7CiAgICB2YXIgbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjcE9sZCcpLnZhbHVlOwogICAgdmFyIG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3BOZXcnKS52YWx1ZTsKICAgIHZhciBuMiA9IGRvY3VtZW50LmdldEVsZW1l',
  'bnRCeUlkKCdjcE5ldzInKS52YWx1ZTsKICAgIGlmIChuLmxlbmd0aCA8IDgpIHJldHVybiBhdXRoRXJyb3IoJ+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iOC4leC5ieC4reC4h+C4ouC4suC4p+C4reC4ouC5iOC4suC4h+C4meC5ieC4reC4oiA4',
  'IOC4leC4seC4p+C4reC4seC4geC4qeC4oycpOwogICAgaWYgKG4gIT09IG4yKSByZXR1cm4gYXV0aEVycm9yKCfguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYjguKrguK3guIfguIrguYjguK3guIfguYTguKHguYjguJXguKPguIfguIHguLHguJkn',
  'KTsKICAgIHZhciBidG4gPSB0aGlzOwogICAgYnRuLmRpc2FibGVkID0gdHJ1ZTsKICAgIGJ0bi5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4Lia4Lix4LiZ4LiX4Li24LiB4oCmJzsKICAgIGNhbGxBcGkoJ2F1',
  'dGguY2hhbmdlUGFzc3dvcmQnLCB7IG9sZFBhc3N3b3JkOiBvLCBuZXdQYXNzd29yZDogbiB9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICAgIHJldHVybiBjYWxsQXBpKCdhdXRoLm1lJykudGhlbihlbnRlckFwcCk7CiAgICB9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICAg',
  'IHRvYXN0KCfguYDguJvguKXguLXguYjguKLguJnguKPguKvguLHguKrguJzguYjguLLguJnguYDguKPguLXguKLguJrguKPguYnguK3guKInLCAnb2snKTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTsKICAgICAg',
  'YnRuLnRleHRDb250ZW50ID0gJ+C4muC4seC4meC4l+C4tuC4geC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iCc7CiAgICAgIGF1dGhFcnJvcihlLm1lc3NhZ2UgfHwgZSk7CiAgICB9KTsKICB9OwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdj',
  'cE9sZCcpLmZvY3VzKCk7Cn0KCmZ1bmN0aW9uIGZvcm1DaGFuZ2VQYXNzd29yZCgpewogIG9wZW5Nb2RhbCgn4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZJywKICAgICc8ZGl2IGNsYXNzPSJmZ3JpZCI+JyArCiAgICAgICc8ZGl2',
  'IGNsYXNzPSJmIGZ1bGwiPjxsYWJlbCBmb3I9Im1jT2xkIj7guKPguKvguLHguKrguJzguYjguLLguJnguYDguJTguLTguKE8L2xhYmVsPjxpbnB1dCBjbGFzcz0iaW5wIiBpZD0ibWNPbGQiIHR5cGU9InBhc3N3b3JkIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xh',
  'c3M9ImYgZnVsbCI+PGxhYmVsIGZvcj0ibWNOZXciPuC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iCAo4Lit4Lii4LmI4Liy4LiH4LiZ4LmJ4Lit4LiiIDgg4LiV4Lix4LinKTwvbGFiZWw+PGlucHV0IGNsYXNzPSJpbnAiIGlkPSJtY05ldyIgdHlw',
  'ZT0icGFzc3dvcmQiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiBmdWxsIj48bGFiZWwgZm9yPSJtY05ldzIiPuC5g+C4quC5iOC4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iOC4reC4teC4geC4hOC4o+C4seC5ieC4hzwvbGFiZWw+PGlu',
  'cHV0IGNsYXNzPSJpbnAiIGlkPSJtY05ldzIiIHR5cGU9InBhc3N3b3JkIj48L2Rpdj4nICsKICAgICc8L2Rpdj4nLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAg',
  'ICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBpZD0ibWNHbyI+4Lia4Lix4LiZ4LiX4Li24LiBPC9idXR0b24+Jyk7CgogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtY0dvJykub25jbGljayA9IGZ1bmN0aW9uKCl7CiAgICB2YXIgbiA9IGRvY3VtZW50LmdldEVs',
  'ZW1lbnRCeUlkKCdtY05ldycpLnZhbHVlOwogICAgaWYgKG4ubGVuZ3RoIDwgOCkgcmV0dXJuIHRvYXN0KCfguKPguKvguLHguKrguJzguYjguLLguJnguYPguKvguKHguYjguJXguYnguK3guIfguKLguLLguKfguK3guKLguYjguLLguIfguJnguYnguK3guKIgOCDg',
  'uJXguLHguKfguK3guLHguIHguKnguKMnLCAnZXJyJyk7CiAgICBpZiAobiAhPT0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21jTmV3MicpLnZhbHVlKSByZXR1cm4gdG9hc3QoJ+C4o+C4q+C4seC4quC4nOC5iOC4suC4meC5g+C4q+C4oeC5iOC4quC4reC4h+C4',
  'iuC5iOC4reC4h+C5hOC4oeC5iOC4leC4o+C4h+C4geC4seC4mScsICdlcnInKTsKICAgIHZhciBidG4gPSB0aGlzOwogICAgYnRuLmRpc2FibGVkID0gdHJ1ZTsKICAgIGNhbGxBcGkoJ2F1dGguY2hhbmdlUGFzc3dvcmQnLCB7CiAgICAgIG9sZFBhc3N3b3JkOiBk',
  'b2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWNPbGQnKS52YWx1ZSwgbmV3UGFzc3dvcmQ6IG4KICAgIH0pLnRoZW4oZnVuY3Rpb24oKXsKICAgICAgY2xvc2VNb2RhbCgpOwogICAgICB0b2FzdCgn4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic4LmI',
  '4Liy4LiZ4LmA4Lij4Li14Lii4Lia4Lij4LmJ4Lit4LiiJywgJ29rJyk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgYnRuLmRpc2FibGVkID0gZmFsc2U7CiAgICAgIHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7CiAgICB9KTsKICB9Owp9Cgov',
  'KiAtLS0tLS0tLS0tLS0tLS0tIOC4reC4reC4geC4iOC4suC4geC4o+C4sOC4muC4miAtLS0tLS0tLS0tLS0tLS0tICovCgpmdW5jdGlvbiBkb0xvZ291dChrZWVwUGluKXsKICB2YXIgcyA9IEFVVEguc2Vzc2lvbjsKICBzYXZlU2Vzc2lvbignJyk7CiAgaWYgKCFr',
  'ZWVwUGluKSB7IHZhciBkID0gQVVUSC5kZXZpY2U7IHNhdmVEZXZpY2UoJycpOyBpZiAoZCkgY2FsbEFwaSgnYXV0aC5mb3JnZXREZXZpY2UnLCB7IGRldmljZTogZCB9KS5jYXRjaChmdW5jdGlvbigpe30pOyB9CiAgaWYgKHMpIGNhbGxBcGkoJ2F1dGgubG9nb3V0',
  'JywgeyBfc2Vzc2lvbjogcyB9KS5jYXRjaChmdW5jdGlvbigpeyAvKiDguKvguKHguJTguK3guLLguKLguLjguYHguKXguYnguKfguIHguYfguJbguLfguK3guKfguYjguLLguK3guK3guIHguYHguKXguYnguKcgKi8gfSk7CiAgY2xvc2VNb2RhbCgpOwogIEFVVEgu',
  'bWUgPSBudWxsOwogIGlmIChBVVRILmRldmljZSkgc2hvd1BpbigpOyBlbHNlIHNob3dMb2dpbigpOwp9CgpmdW5jdGlvbiBjb25maXJtTG9nb3V0KCl7CiAgb3Blbk1vZGFsKCfguK3guK3guIHguIjguLLguIHguKPguLDguJrguJonLAogICAgJzxwPuC4leC5ieC4',
  'reC4h+C4geC4suC4o+C4reC4reC4geC4iOC4suC4geC4o+C4sOC4muC4muC5g+C4iuC5iOC5hOC4q+C4oTwvcD4nICsKICAgIChBVVRILmRldmljZSA/ICc8cCBjbGFzcz0ibXV0ZWQgZnMxMyI+UElOIOC4muC4meC5gOC4hOC4o+C4t+C5iOC4reC4h+C4meC4teC5',
  'ieC4iOC4sOC4ouC4seC4h+C4reC4ouC4ueC5iCDguITguKPguLHguYnguIfguKvguJnguYnguLLguYDguILguYnguLLguJTguYnguKfguKIgUElOIOC5hOC4lOC5ieC5gOC4peC4ojwvcD4nIDogJycpLAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0i',
  'Y2xvc2VNb2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgIChBVVRILmRldmljZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4gZGdyIiBvbmNsaWNrPSJkb0xvZ291dChmYWxzZSkiPuC4reC4reC4geC5geC4peC4sOC4peC4miBQSU48L2J1dHRv',
  'bj4nIDogJycpICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJkb0xvZ291dCh0cnVlKSI+4Lit4Lit4LiB4LiI4Liy4LiB4Lij4Liw4Lia4LiaPC9idXR0b24+Jyk7Cn0KPC9zY3JpcHQ+CjxzY3JpcHQ+Ci8qID09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBWaWV3cy5odG1sIOKAlCDguJXguLHguKfguYLguKvguKXguJQgKyDguJXguLHguKfguKfguLLguJTguILguK3guIfguYHguJXguYjguKXguLDguKvguJnguYnguLIKICAgPT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgp2YXIgUk9VVEVTID0ge307CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgMSkg4Lig4Liy4Lie',
  '4Lij4Lin4LihCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMuZGFzaGJvYXJkID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7IHJldHVybiBjYWxsQXBpKCdhcHAuZGFzaGJvYXJkJywg',
  'eyB5ZWFyOiBTLnllYXIgfSk7IH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciBiID0gZC5idWlsZGluZzsKICAgIHZhciBrcGlzID0KICAgICAga3BpKCfguKLguK3guJTguKvguJnguLXguYnguITguIfguYDguKvguKXguLfguK3guJfguLHguYnguIfg',
  'uKvguKHguJQnLCBiYWh0KGQuZGVidEFsbC5yZW1haW5pbmcpLAogICAgICAgICAgJ+C4iOC4suC4geC4ouC4reC4lOC4q+C4meC4teC5iSAnICsgYmFodChkLmRlYnRBbGwudG90YWxEZWJ0KSArICcgwrcg4LiK4Liz4Lij4Liw4LmB4Lil4LmJ4LinICcgKyBwY3Qo',
  'ZC5kZWJ0QWxsLnBlcmNlbnQpLCAnYWNjZW50JykgKwogICAgICBrcGkoJ+C4iuC4s+C4o+C4sOC5geC4peC5ieC4pyAo4Lir4LiZ4Li14LmJ4Lir4Lil4Lix4LiBKScsIHBjdChkLmRlYnRNYWluLnBlcmNlbnQpLCBiYWh0KGQuZGVidE1haW4ucGFpZCkgKyAnIOC4',
  'iOC4suC4gSAnICsgYmFodChkLmRlYnRNYWluLnRvdGFsKSwgJ2dvb2QnKSArCiAgICAgIGtwaSgn4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Lib4Li1ICcgKyBkLnllYXIsIGJhaHQoZC5zcGVuZFRoaXNZZWFyKSwgJ+C4i+C4t+C5ieC4reC4guC4reC4',
  'hyArIOC4i+C5iOC4reC4oeC5geC4i+C4oSArIOC4peC5ieC4suC4h+C5geC4reC4o+C5jCcpICsKICAgICAga3BpKCfguIfguLLguJnguIvguYjguK3guKHguITguYnguLLguIcnLCBkLnJlcGFpcnMub3BlbkpvYnMgKyAnIOC4h+C4suC4mScsIGQucmVwYWlycy5v',
  'dmVyZHVlICsgJyDguIfguLLguJnguYDguIHguLTguJnguIHguLPguKvguJnguJQnLCBkLnJlcGFpcnMub3ZlcmR1ZSA/ICdiYWQnIDogJycpOwoKICAgIHZhciBhbGVydHMgPSBkLmFsZXJ0cy5sZW5ndGgKICAgICAgPyAnPGRpdiBjbGFzcz0iYWxpc3QiPicgKyBk',
  'LmFsZXJ0cy5zbGljZSgwLDEyKS5tYXAoZnVuY3Rpb24oYSl7CiAgICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImFsaSBsLScgKyBhLmxldmVsICsgJyIgb25jbGljaz0iZ28oXCcnICsganVtcFBhZ2UoYS5tb2R1bGUpICsgJ1wnKSI+JyArCiAgICAgICAgICAg',
  'ICAgICAgJzxkaXYgY2xhc3M9ImljIj4nICsgYS5pY29uICsgJzwvZGl2PjxkaXY+PGRpdiBjbGFzcz0idHQiPicgKyBlc2MoYS50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImRkIj4nICsgZXNjKGEuZGV0YWlsKSArICc8',
  'L2Rpdj48L2Rpdj48L2Rpdj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicKICAgICAgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPjxkaXYgY2xhc3M9ImJpZyI+4pyFPC9kaXY+4LmE4Lih4LmI4Lih4Li14LiH4Liy4LiZ4LiE4LmJ4Liy4LiHIOKAlCDguJfg',
  'uLjguIHguK3guKLguYjguLLguIfguYDguKPguLXguKLguJrguKPguYnguK3guKI8L2Rpdj4nOwoKICAgIHJldHVybiAnJyArCiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKyBrcGlzICsgJzwvZGl2PicgKwoKICAgICAgJzxkaXYgY2xhc3M9Imdy',
  'aWQgZzIgbWIxMiI+JyArCiAgICAgICAgY2FyZCgn8J+SsCDguKPguLLguKLguIHguLLguKPguKrguKPguLjguJvguKPguKfguKEgKOC4q+C4meC4teC5ieC4q+C4peC4seC4gSknLAogICAgICAgICAgZGVidE1pbmkoZC5kZWJ0TWFpbiwgJ2RlYnRNYWluJyksCiAg',
  'ICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJnbyhcJ2RlYnRNYWluXCcpIj7guJTguLnguJfguLHguYnguIfguKvguKHguJQg4oaSPC9idXR0b24+JykgKwogICAgICAgIGNhcmQoJ/Cfp74g4Lir4LiZ4Li14LmJ4Liq4Li04LiZICjguKvg',
  'uJnguLXguYnguKPguK3guIcpJywKICAgICAgICAgIGRlYnRNaW5pKGQuZGVidFN1YiwgJ2RlYnRTdWInKSArCiAgICAgICAgICAoZC5kZWJ0U3ViLmludGVyZXN0VGhpc1llYXIgPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtdDgiPuC4lOC4reC4geC5gOC4muC4',
  'teC5ieC4ouC4l+C4teC5iOC4iuC4s+C4o+C4sOC4m+C4tSAnICsgZC55ZWFyICsgJzogPGI+JyArIGJhaHQoZC5kZWJ0U3ViLmludGVyZXN0VGhpc1llYXIpICsgJzwvYj48L2Rpdj4nIDogJycpLAogICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25j',
  'bGljaz0iZ28oXCdkZWJ0U3ViXCcpIj7guJTguLnguJfguLHguYnguIfguKvguKHguJQg4oaSPC9idXR0b24+JykgKwogICAgICAnPC9kaXY+JyArCgogICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAgICBrcGkoJ+C4q+C5ieC4reC4h+C4',
  'l+C4seC5ieC4h+C4q+C4oeC4lCcsIGIudG90YWxSb29tcyArICcg4Lir4LmJ4Lit4LiHJywgJ+C4oeC4teC4nOC4ueC5ieC5gOC4iuC5iOC4siAnICsgYi5vY2N1cGllZCArICcgwrcg4Lin4LmI4Liy4LiHICcgKyBiLnZhY2FudCkgKwogICAgICAgIGtwaSgn4Lil',
  '4LmJ4Liy4LiH4LmB4Lit4Lij4LmM4Lib4Li1ICcgKyBkLnllYXIsIGQuYWMucm9vbXNEb25lICsgJy8nICsgYi50b3RhbFJvb21zICsgJyDguKvguYnguK3guIcnLCBkLmFjLmRvbmVJblllYXIgKyAnIOC4o+C4reC4miDCtyDguITguYnguLLguIcgJyArIGQuYWMu',
  'cm9vbXNQZW5kaW5nICsgJyDguKvguYnguK3guIcnLCBkLmFjLnJvb21zUGVuZGluZyA/ICd3YXJuJyA6ICdnb29kJykgKwogICAgICAgIGtwaSgn4LiL4Li34LmJ4Lit4LiC4Lit4LiH4Lib4Li1ICcgKyBkLnllYXIsIGJhaHQoZC5wdXJjaGFzZXMueWVhclRvdGFs',
  'KSwgZC5wdXJjaGFzZXMueWVhckNvdW50ICsgJyDguKPguLLguKLguIHguLLguKMnKSArCiAgICAgICAga3BpKCfguJvguKPguLDguIHguLHguJnguYPguIHguKXguYnguKvguKHguJQnLCBkLnB1cmNoYXNlcy53YXJyYW50eS5leHBpcmluZyArICcg4Lij4Liy4Lii',
  '4LiB4Liy4LijJywgJ+C4q+C4oeC4lOC4reC4suC4ouC4uOC5geC4peC5ieC4pyAnICsgZC5wdXJjaGFzZXMud2FycmFudHkuZXhwaXJlZCwgZC5wdXJjaGFzZXMud2FycmFudHkuZXhwaXJpbmcgPyAnd2FybicgOiAnJykgKwogICAgICAnPC9kaXY+JyArCgogICAg',
  'ICAnPGRpdiBjbGFzcz0iZ3JpZCBnMiBtYjEyIj4nICsKICAgICAgICBjYXJkKCfwn5OSIOC4o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKLguKvguK0g4Lib4Li1ICcgKyBkLnllYXIsCiAgICAgICAgICAnPGRpdiBjbGFzcz0iZ3JpZCBnMyBt',
  'YjEyIj4nICsKICAgICAgICAgICAga3BpKCfguKPguLLguKLguKPguLHguJonLCBiYWh0KGQuZmluYW5jZS5pbmNvbWUpLCAn4LmA4LiJ4Lil4Li14LmI4LiiICcgKyBiYWh0KGQuZmluYW5jZS5hdmdJbmNvbWUpICsgJy/guYDguJTguLfguK3guJknLCAnZ29vZCcp',
  'ICsKICAgICAgICAgICAga3BpKCfguKPguLLguKLguIjguYjguLLguKInLCBiYWh0KGQuZmluYW5jZS5leHBlbnNlKSwgJ+C5gOC4ieC4peC4teC5iOC4oiAnICsgYmFodChkLmZpbmFuY2UuYXZnRXhwZW5zZSkgKyAnL+C5gOC4lOC4t+C4reC4mScsICdiYWQnKSAr',
  'CiAgICAgICAgICAgIGtwaSgn4LiE4LiH4LmA4Lir4Lil4Li34Lit4Liq4Li44LiX4LiY4Li0JywgYmFodChkLmZpbmFuY2UubmV0KSwgJ+C4reC4seC4leC4o+C4suC4geC4s+C5hOC4oyAnICsgcGN0KGQuZmluYW5jZS5tYXJnaW4pKSArCiAgICAgICAgICAnPC9k',
  'aXY+JyArIG1pbmlNb250aENoYXJ0KGQuZmluYW5jZS5ieU1vbnRoKSwKICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImdvKFwnZmluYW5jZVwnKSI+4LiU4Li54LiX4Lix4LmJ4LiH4Lir4Lih4LiUIOKGkjwvYnV0dG9uPicpICsKICAg',
  'ICAgICBjYXJkKCfwn5eT77iPIOC4h+C4suC4meC4l+C4teC5iOC4geC4s+C4peC4seC4h+C4iOC4sOC4luC4tuC4hyAoJyArIGQudXBjb21pbmcubGVuZ3RoICsgJyknLAogICAgICAgICAgZC51cGNvbWluZy5sZW5ndGggPyAnPGRpdiBjbGFzcz0iYWxpc3QiPicg',
  'KyBkLnVwY29taW5nLnNsaWNlKDAsNykubWFwKGZ1bmN0aW9uKHUpewogICAgICAgICAgICB2YXIgbHZsID0gdS5kYXlzTGVmdCA8IDAgPyAnZGFuZ2VyJyA6ICh1LmRheXNMZWZ0IDw9IDcgPyAnd2FybicgOiAnaW5mbycpOwogICAgICAgICAgICByZXR1cm4gJzxk',
  'aXYgY2xhc3M9ImFsaSBsLScgKyBsdmwgKyAnIiBvbmNsaWNrPSJnbyhcJycgKyBqdW1wUGFnZSh1Lm1vZHVsZSkgKyAnXCcpIj4nICsKICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0iaWMiPicgKyB1Lmljb24gKyAnPC9kaXY+PGRpdj48ZGl2IGNsYXNzPSJ0dCI+',
  'JyArIGVzYyh1LnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0iZGQiPicgKyB0aERhdGUodS5kYXRlKSArICcgwrcgJyArCiAgICAgICAgICAgICAgICAodS5kYXlzTGVmdCA8IDAgPyAn4LmA4Lil4Lii4LiB4Liz4Lir4LiZ4LiU',
  'ICcgKyAoLXUuZGF5c0xlZnQpICsgJyDguKfguLHguJknIDogKHUuZGF5c0xlZnQgPT09IDAgPyAn4Lin4Lix4LiZ4LiZ4Li14LmJJyA6ICfguK3guLXguIEgJyArIHUuZGF5c0xlZnQgKyAnIOC4p+C4seC4mScpKSArCiAgICAgICAgICAgICAgJzwvZGl2PjwvZGl2',
  'PjwvZGl2Pic7CiAgICAgICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPvCfjKTvuI88L2Rpdj7guYTguKHguYjguKHguLXguIfguLLguJnguJnguLHguJTguKvguKHguLLguKLguYDguKPguYfg',
  'uKcg4LmGIOC4meC4teC5iTwvZGl2PicsCiAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJnbyhcJ3JlcG9ydHNcJykiPuC4m+C4j+C4tOC4l+C4tOC4meC5gOC4leC5h+C4oSDihpI8L2J1dHRvbj4nLCB0cnVlKSArCiAgICAgICc8L2Rp',
  'dj4nICsKCiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGcyIj4nICsKICAgICAgICBjYXJkKCfwn5SUIOC4quC4tOC5iOC4h+C4l+C4teC5iOC4leC5ieC4reC4h+C4l+C4syAoJyArIGQuYWxlcnRzLmxlbmd0aCArICcpJywgYWxlcnRzLCAnJywgdHJ1ZSkgKwogICAg',
  'ICAgIGNhcmQoJ/Cfj6Ig4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmC4LiU4Lii4Lij4Lin4LihJywKICAgICAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGcyIj4nICsKICAgICAgICAgICAga3BpKCfguIfguLLguJnguJvguLUgJyArIGQu',
  'eWVhciwgZC5idWlsZGluZ1JlcGFpcnMueWVhckNvdW50ICsgJyDguIfguLLguJknLCAn4LiE4LmJ4Liy4LiHICcgKyBkLmJ1aWxkaW5nUmVwYWlycy5vcGVuQ291bnQpICsKICAgICAgICAgICAga3BpKCfguITguYjguLLguYPguIrguYnguIjguYjguLLguKInLCBi',
  'YWh0KGQuYnVpbGRpbmdSZXBhaXJzLnllYXJDb3N0KSwgJ+C4hOC4o+C4muC4geC4s+C4q+C4meC4lOC5gOC4o+C5h+C4pyDguYYg4LiZ4Li14LmJICcgKyBkLmJ1aWxkaW5nUmVwYWlycy51cGNvbWluZykgKwogICAgICAgICAgJzwvZGl2PicgKwogICAgICAgICAg',
  'KGQuZGVidE1haW4uZm9yZWNhc3QgJiYgZC5kZWJ0TWFpbi5mb3JlY2FzdC5tb250aHNMZWZ0CiAgICAgICAgICAgID8gJzxkaXYgY2xhc3M9ImhyIj48L2Rpdj48ZGl2IGNsYXNzPSJmczEzIj48Yj7guJvguKPguLDguKHguLLguJPguIHguLLguKPguJvguLTguJTg',
  'uKvguJnguLXguYnguKvguKXguLHguIE8L2I+PGRpdiBjbGFzcz0ibXV0ZWQgbXQ4Ij4nICsKICAgICAgICAgICAgICAn4LiI4Liy4LiB4Lit4Lix4LiV4Lij4Liy4LiK4Liz4Lij4Liw4LmA4LiJ4Lil4Li14LmI4LiiICcgKyBiYWh0KGQuZGVidE1haW4uZm9yZWNh',
  'c3QuYXZnUGVyTW9udGgpICsgJy/guYDguJTguLfguK3guJkgKDEyIOC5gOC4lOC4t+C4reC4meC4peC5iOC4suC4quC4uOC4lCkgJyArCiAgICAgICAgICAgICAgJ+C4hOC4suC4lOC4p+C5iOC4suC4reC4teC4gSA8Yj4nICsgZC5kZWJ0TWFpbi5mb3JlY2FzdC5t',
  'b250aHNMZWZ0ICsgJyDguYDguJTguLfguK3guJk8L2I+ICcgKwogICAgICAgICAgICAgICco4Lij4Liy4LinICcgKyB0aERhdGUoZC5kZWJ0TWFpbi5mb3JlY2FzdC5wYXlvZmZEYXRlKSArICcpPC9kaXY+PC9kaXY+JwogICAgICAgICAgICA6ICcnKSwKICAgICAg',
  'ICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImdvKFwnYnVpbGRpbmdcJykiPuC4lOC4ueC4l+C4seC5ieC4h+C4q+C4oeC4lCDihpI8L2J1dHRvbj4nKSArCiAgICAgICc8L2Rpdj4nOwogIH0sCiAgYWZ0ZXI6IGZ1bmN0aW9uKCl7CiAgICAvLyDg',
  'uJXguLHguKfguYDguKXguILguJrguJnguYDguKHguJnguLnguK3guLHguJvguYDguJTguJXguIjguLLguIHguKjguLnguJnguKLguYzguYHguIjguYnguIfguYDguJXguLfguK3guJkgKHJlZnJlc2hBbGVydHMpIOC4l+C4uOC4geC4q+C4meC5ieC4siDguYTguKHg',
  'uYjguYPguIrguYjguYDguInguJ7guLLguLDguKvguJnguYnguLLguJnguLXguYkKICAgIHJlZnJlc2hBbGVydHMoKTsKICB9Cn07CgpmdW5jdGlvbiBtaW5pTW9udGhDaGFydChieU1vbnRoKXsKICB2YXIgbWF4ID0gTWF0aC5tYXguYXBwbHkobnVsbCwgYnlNb250',
  'aC5tYXAoZnVuY3Rpb24obSl7IHJldHVybiBNYXRoLm1heChtLmluY29tZSwgbS5leHBlbnNlKTsgfSkpIHx8IDE7CiAgcmV0dXJuICc8ZGl2IHN0eWxlPSJkaXNwbGF5OmZsZXg7Z2FwOjNweDthbGlnbi1pdGVtczpmbGV4LWVuZDtoZWlnaHQ6NzRweCI+JyArIGJ5',
  'TW9udGgubWFwKGZ1bmN0aW9uKG0pewogICAgdmFyIGhpID0gTWF0aC5yb3VuZChtLmluY29tZSAvIG1heCAqIDY2KSwgaGUgPSBNYXRoLnJvdW5kKG0uZXhwZW5zZSAvIG1heCAqIDY2KTsKICAgIHJldHVybiAnPGRpdiBzdHlsZT0iZmxleDoxO3RleHQtYWxpZ246',
  'Y2VudGVyIiB0aXRsZT0iJyArIG0ubGFiZWwgKyAnIMK3IOC4o+C4seC4miAnICsgbW9uZXkobS5pbmNvbWUpICsgJyDCtyDguIjguYjguLLguKIgJyArIG1vbmV5KG0uZXhwZW5zZSkgKyAnIj4nICsKICAgICAgJzxkaXYgc3R5bGU9ImRpc3BsYXk6ZmxleDtnYXA6',
  'MXB4O2FsaWduLWl0ZW1zOmZsZXgtZW5kO2p1c3RpZnktY29udGVudDpjZW50ZXI7aGVpZ2h0OjY2cHgiPicgKwogICAgICAgICc8ZGl2IHN0eWxlPSJ3aWR0aDo2cHg7aGVpZ2h0OicgKyBoaSArICdweDtiYWNrZ3JvdW5kOnZhcigtLW9rKTtib3JkZXItcmFkaXVz',
  'OjJweCAycHggMCAwIj48L2Rpdj4nICsKICAgICAgICAnPGRpdiBzdHlsZT0id2lkdGg6NnB4O2hlaWdodDonICsgaGUgKyAncHg7YmFja2dyb3VuZDp2YXIoLS1kYW5nZXIpO2JvcmRlci1yYWRpdXM6MnB4IDJweCAwIDAiPjwvZGl2PicgKwogICAgICAnPC9kaXY+',
  'PGRpdiBjbGFzcz0iZmFpbnQiIHN0eWxlPSJmb250LXNpemU6OS41cHgiPicgKyBtLmxhYmVsLnJlcGxhY2UoJy4nLCcnKSArICc8L2Rpdj48L2Rpdj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2PicgKwogICc8ZGl2IGNsYXNzPSJyb3cgZnMxMiBtdXRlZCBtdDgi',
  'PjxzcGFuIGNsYXNzPSJiIG9rIj7guKPguLLguKLguKPguLHguJo8L3NwYW4+PHNwYW4gY2xhc3M9ImIgZGdyIj7guKPguLLguKLguIjguYjguLLguKI8L3NwYW4+PC9kaXY+JzsKfQoKZnVuY3Rpb24gZGVidE1pbmkoeCwgcGFnZSl7CiAgcmV0dXJuICc8ZGl2IGNs',
  'YXNzPSJwbWV0YSIgc3R5bGU9Im1hcmdpbjowIDAgNnB4Ij48c3Bhbj7guIrguLPguKPguLDguYHguKXguYnguKcgPGI+JyArIGJhaHQoeC5wYWlkKSArICc8L2I+PC9zcGFuPicgKwogICAgICAgICAnPHNwYW4+PGI+JyArIHBjdCh4LnBlcmNlbnQpICsgJzwvYj48',
  'L3NwYW4+PC9kaXY+JyArCiAgICAgICAgIHByb2dyZXNzKHgucGVyY2VudCwgJ2xnJykgKwogICAgICAgICAnPGRpdiBjbGFzcz0icG1ldGEiPjxzcGFuPuC4hOC4h+C5gOC4q+C4peC4t+C4rSA8Yj4nICsgYmFodCh4LnJlbWFpbmluZykgKyAnPC9iPjwvc3Bhbj4n',
  'ICsKICAgICAgICAgJzxzcGFuPuC4ouC4reC4lOC4q+C4meC4teC5ieC4l+C4seC5ieC4h+C4q+C4oeC4lCA8Yj4nICsgYmFodCh4LnRvdGFsKSArICc8L2I+PC9zcGFuPjwvZGl2PicgKwogICAgICAgICAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtdDgiPuC4iuC4',
  's+C4o+C4sOC5g+C4meC4m+C4teC4l+C4teC5iOC5gOC4peC4t+C4reC4gTogPGI+JyArIGJhaHQoeC50aGlzWWVhcikgKyAnPC9iPjwvZGl2Pic7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PQogICAyKSDguKvguJnguLXguYnguKvguKXguLHguIEgLyDguKvguJnguLXguYnguKPguK3guIcgKOC5g+C4iuC5ieC4leC4seC4p+C4p+C4suC4lOC4o+C5iOC4p+C4oeC4geC4seC4mSkKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGRlYnRSb3V0ZShsZWRnZXIsIHRpdGxlKXsKICByZXR1cm4gewogICAgbG9hZDogZnVuY3Rpb24oKXsKICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFsKICAgICAgICBjYWxsQXBpKCdkZWJ0LnN1bW1hcnkn',
  'LCB7IGxlZGdlcjogbGVkZ2VyLCB5ZWFyOiBTLnllYXIgfSksCiAgICAgICAgY2FsbEFwaSgnZGVidC5wYXltZW50cycsIHsgbGVkZ2VyOiBsZWRnZXIsIHllYXI6IFMueWVhciB9KQogICAgICBdKS50aGVuKGZ1bmN0aW9uKHIpewogICAgICAgIHZhciBkID0gclsw',
  'XTsgZC5wYXltZW50cyA9IHJbMV07IGQubGVkZ2VyID0gbGVkZ2VyOyBkLnBhZ2VUaXRsZSA9IHRpdGxlOwogICAgICAgIHJldHVybiBkOwogICAgICB9KTsKICAgIH0sCiAgICByZW5kZXI6IHJlbmRlckRlYnQsCiAgICBhZnRlcjogY2FjaGVBbGxEZWJ0cwogIH07',
  'Cn0KUk9VVEVTLmRlYnRNYWluID0gZGVidFJvdXRlKCfguKvguJnguLXguYnguKvguKXguLHguIEnLCAn4Lij4Liy4Lii4LiB4Liy4Lij4Liq4Lij4Li44Lib4Lij4Lin4LihIFRoZSBNIENvcm5lciBBUCcpOwpST1VURVMuZGVidFN1YiAgPSBkZWJ0Um91dGUoJ+C4',
  'q+C4meC4teC5ieC4o+C4reC4hycsICfguKvguJnguLXguYnguKrguLTguJknKTsKCi8qKiDguYDguIHguYfguJrguKPguLLguKLguIrguLfguYjguK3guIHguYnguK3guJnguKvguJnguLXguYnguJfguLjguIHguJrguLHguI3guIrguLXguYTguKfguYnguYPguKvg',
  'uYnguJ/guK3guKPguYzguKHguYDguKXguLfguK3guIEgIuC5gOC4m+C5h+C4meC4quC5iOC4p+C4meC4q+C4meC4tuC5iOC4h+C4guC4reC4hyIgKi8KZnVuY3Rpb24gY2FjaGVBbGxEZWJ0cygpewogIGNhbGxBcGkoJ2RlYnQubGlzdCcsIHt9KS50aGVuKGZ1bmN0',
  'aW9uKGxpc3QpewogICAgQUxMX0RFQlRTID0gbGlzdC5tYXAoZnVuY3Rpb24oZCl7CiAgICAgIHJldHVybiB7IGlkOiBkLmlkLCB0aXRsZTogZC50aXRsZSwgbGVkZ2VyOiBkLmxlZGdlciwgcGFyZW50SWQ6IGQucGFyZW50SWQgfHwgJycgfTsKICAgIH0pOwogIH0p',
  'LmNhdGNoKGZ1bmN0aW9uKCl7fSk7Cn0KCmZ1bmN0aW9uIHJlbmRlckRlYnQoZCl7CiAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKCiAgdmFyIGhlYWQgPSAnPGRpdiBjbGFz',
  'cz0iY2FyZCBtYjEyIj48ZGl2IGNsYXNzPSJjYXJkLWIiPicgKwogICAgJzxkaXYgY2xhc3M9InJvdyBtYjEyIj48aDMgc3R5bGU9Im1hcmdpbjowO2ZvbnQtc2l6ZToxNXB4Ij4nICsgZXNjKGQucGFnZVRpdGxlKSArICc8L2gzPicgKwogICAgJzxzcGFuIGNsYXNz',
  'PSJzcCI+PC9zcGFuPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkgc20iIG9uY2xpY2s9ImZvcm1EZWJ0UGF5bWVudChudWxsLFwnJyArIGQubGVkZ2VyICsgJ1wnKSI+KyDguJrguLHguJnguJfguLbguIHguIHguLLguKPguIrguLPguKPguLA8L2J1dHRv',
  'bj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImZvcm1EZWJ0KG51bGwsXCcnICsgZC5sZWRnZXIgKyAnXCcpIj4rIOC5gOC4nuC4tOC5iOC4oeC4geC5ieC4reC4meC4q+C4meC4teC5iTwvYnV0dG9uPjwvZGl2PicgKwogICAgJzxkaXYg',
  'Y2xhc3M9InBtZXRhIiBzdHlsZT0ibWFyZ2luOjAgMCA3cHgiPjxzcGFuPuC4hOC4p+C4suC4oeC4hOC4t+C4muC4q+C4meC5ieC4suC4geC4suC4o+C4iuC4s+C4o+C4sDwvc3Bhbj48c3Bhbj48Yj4nICsgcGN0KGQucGVyY2VudCkgKyAnPC9iPjwvc3Bhbj48L2Rp',
  'dj4nICsKICAgIHByb2dyZXNzKGQucGVyY2VudCwgJ2xnICcgKyAoZC5wZXJjZW50ID49IDEwMCA/ICdvaycgOiAnJykpICsKICAgICc8ZGl2IGNsYXNzPSJncmlkIGc0IG10MTYiPicgKwogICAgICBrcGkoJ+C4ouC4reC4lOC4q+C4meC4teC5ieC4l+C4seC5ieC4',
  'h+C4q+C4oeC4lCcsIGJhaHQoZC50b3RhbERlYnQpLCBkLmRlYnRzLmxlbmd0aCArICcg4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJJykgKwogICAgICBrcGkoJ+C4iuC4s+C4o+C4sOC5geC4peC5ieC4pycsIGJhaHQoZC5wYWlkKSwgZC5wYXltZW50Q291bnQgKyAn',
  'IOC4o+C4suC4ouC4geC4suC4o+C5guC4reC4mScgKwogICAgICAgICAgKGQuYWRqdXN0bWVudENvdW50ID8gJyDCtyDguJvguKPguLHguJrguKLguK3guJQgJyArIGJhaHQoZC5hZGp1c3RlZCkgOiAnJyksICdnb29kJykgKwogICAgICBrcGkoJ+C4hOC4h+C5gOC4',
  'q+C4peC4t+C4rScsIGJhaHQoZC5yZW1haW5pbmcpLCAn4Lit4Li14LiBICcgKyBwY3QoMTAwIC0gZC5wZXJjZW50KSArICcg4LiI4Liw4Lib4Li04LiU4Lir4LiZ4Li14LmJJywgJ2JhZCcpICsKICAgICAga3BpKCfguIrguLPguKPguLDguYPguJknICsgeWVhckxh',
  'YmVsLCBiYWh0KGQuc2VsZWN0ZWRZZWFyUGFpZCksIGQuc2VsZWN0ZWRZZWFyQ291bnQgKyAnIOC4o+C4suC4ouC4geC4suC4oycgKwogICAgICAgICAgKGQuc2VsZWN0ZWRZZWFySW50ZXJlc3QgPyAnIMK3IOC4lOC4reC4geC5gOC4muC4teC5ieC4oiAnICsgYmFo',
  'dChkLnNlbGVjdGVkWWVhckludGVyZXN0KSA6ICcnKSkgKwogICAgJzwvZGl2PjwvZGl2PjwvZGl2Pic7CgogIHZhciBwZXJEZWJ0ID0gZC5kZWJ0cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0iZ3JpZCBnLWF1dG8gbWIxMiI+JyArIGQuZGVidHMubWFwKGZ1bmN0aW9u',
  'KHgpewogICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJjYXJkIj48ZGl2IGNsYXNzPSJjYXJkLWIiPicgKwogICAgICAnPGRpdiBjbGFzcz0iY2xpcCIgc3R5bGU9ImZvbnQtd2VpZ2h0OjY1MDtmb250LXNpemU6MTMuNXB4O21pbi1oZWlnaHQ6MzhweCI+JyArIGVzYyh4',
  'LnRpdGxlKSArICc8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBmczEyIG11dGVkIG1iOCI+JyArICh4LnNldHRsZWQgPyAnPHNwYW4gY2xhc3M9ImIgb2siPuKckyDguIrguLPguKPguLDguITguKPguJrguYHguKXguYnguKc8L3NwYW4+JyA6IHN0YXR1',
  'c0JhZGdlKHguc3RhdHVzKSkgKwogICAgICAgICc8c3Bhbj4nICsgZXNjKHguY3JlZGl0b3IgfHwgJ+KAkycpICsgKHguc3RhcnREYXRlID8gJyDCtyAnICsgdGhEYXRlKHguc3RhcnREYXRlKSA6ICcnKSArICc8L3NwYW4+PC9kaXY+JyArCiAgICAgICh4LnNoYXJl',
  'ZEZyb20KICAgICAgICA/ICc8ZGl2IGNsYXNzPSJiIG9rIHdyYXAgbWI4IiB0aXRsZT0i4LiB4LmJ4Lit4LiZ4LmA4LiU4Li14Lii4Lin4LiB4Lix4Lia4LmD4LiZ4Lit4Li14LiB4Lir4LiZ4LmJ4LiyIOC4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C4iuC4s+C4',
  'o+C4sOC4iOC4suC4geC4q+C4meC5ieC4suC5hOC4q+C4meC4geC5h+C5gOC4guC5ieC4suC4geC5ieC4reC4meC4meC4teC5iSI+8J+UlyDguIHguYnguK3guJnguYDguJTguLXguKLguKfguIHguLHguJrguYPguJnguKvguJnguYnguLInICsKICAgICAgICAgICh4',
  'LnNoYXJlZEZyb20gPT09ICfguKvguJnguLXguYnguKvguKXguLHguIEnID8gJ+C4o+C4suC4ouC4geC4suC4o+C4quC4o+C4uOC4m+C4o+C4p+C4oScgOiAn4Lir4LiZ4Li14LmJ4Liq4Li04LiZJykgKyAnPC9kaXY+JwogICAgICAgIDogeC5hbHNvSW4KICAgICAg',
  'ICA/ICc8ZGl2IGNsYXNzPSJiIG9rIHdyYXAgbWI4IiB0aXRsZT0i4LiB4LmJ4Lit4LiZ4LiZ4Li14LmJ4LmB4Liq4LiU4LiH4LmD4LiZ4Lit4Li14LiB4Lir4LiZ4LmJ4Liy4LiU4LmJ4Lin4LiiIOC4leC4seC4p+C5gOC4peC4guC5gOC4iuC4t+C5iOC4reC4oeC4',
  'geC4seC4mSI+8J+UlyDguYHguKrguJTguIfguYPguJnguKvguJnguYnguLInICsKICAgICAgICAgICh4LmFsc29JbiA9PT0gJ+C4q+C4meC4teC5ieC4q+C4peC4seC4gScgPyAn4Lij4Liy4Lii4LiB4Liy4Lij4Liq4Lij4Li44Lib4Lij4Lin4LihJyA6ICfguKvg',
  'uJnguLXguYnguKrguLTguJknKSArICfguJTguYnguKfguKI8L2Rpdj4nCiAgICAgICAgOiAnJykgKwogICAgICAoeC5wYXJlbnRUaXRsZQogICAgICAgID8gJzxkaXYgY2xhc3M9ImIgaW5mbyB3cmFwIG1iOCIgdGl0bGU9IuC4ouC4reC4lOC4geC5ieC4reC4meC4',
  'meC4teC5ieC4reC4ouC4ueC5iOC5g+C4meC4geC5ieC4reC4meC5geC4oeC5iOC5geC4peC5ieC4pyDguIjguYjguLLguKLguITguLfguJnguIHguYnguK3guJnguJnguLXguYnguIHguYnguK3guJnguYHguKHguYjguIjguLDguKXguJTguJXguLLguKEiPicgKwog',
  'ICAgICAgICAgJ+KGsyDguYDguJvguYfguJnguKrguYjguKfguJnguKvguJnguLbguYjguIfguILguK3guIcgJyArIGVzYyh4LnBhcmVudFRpdGxlKSArICc8L2Rpdj4nCiAgICAgICAgOiAnJykgKwogICAgICBwcm9ncmVzcyh4LnBlcmNlbnQpICsKICAgICAgJzxk',
  'aXYgY2xhc3M9InBtZXRhIj48c3Bhbj7guIrguLPguKPguLAgPGI+JyArIGJhaHQoeC5wYWlkKSArICc8L2I+PC9zcGFuPjxzcGFuPuC4hOC4h+C5gOC4q+C4peC4t+C4rSA8Yj4nICsgYmFodCh4LnJlbWFpbmluZykgKyAnPC9iPjwvc3Bhbj48L2Rpdj4nICsKICAg',
  'ICAgKHguY2hpbGRyZW4gJiYgeC5jaGlsZHJlbi5sZW5ndGgKICAgICAgICA/ICc8ZGl2IGNsYXNzPSJociIgc3R5bGU9Im1hcmdpbjoxMnB4IDAgMTBweCI+PC9kaXY+JyArCiAgICAgICAgICAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtYjgiPuC5g+C4meC4ouC4',
  'reC4lOC4meC4teC5ieC4oeC4teC4geC5ieC4reC4meC4ouC5iOC4reC4ouC4reC4ouC4ueC5iCAnICsgeC5jaGlsZHJlbi5sZW5ndGggKyAnIOC4geC5ieC4reC4mTwvZGl2PicgKwogICAgICAgICAgeC5jaGlsZHJlbi5tYXAoZnVuY3Rpb24oYyl7CiAgICAgICAg',
  'ICAgIHJldHVybiAnPGRpdiBjbGFzcz0ibWI4Ij4nICsKICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0icm93IGZzMTIiPjxzcGFuPuKGsyAnICsgZXNjKGMudGl0bGUpICsgJzwvc3Bhbj4nICsKICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9InNwIG1vbm8iPicg',
  'KyBtb25leShjLnBhaWQpICsgJyAvICcgKyBtb25leShjLnByaW5jaXBhbCkgKyAnPC9zcGFuPjwvZGl2PicgKwogICAgICAgICAgICAgIHByb2dyZXNzKGMucGVyY2VudCwgJ29rJykgKyAnPC9kaXY+JzsKICAgICAgICAgIH0pLmpvaW4oJycpICsKICAgICAgICAg',
  'ICh4LnBhaWRGcm9tQ2hpbGRyZW4gPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCI+4Lij4Lin4Lih4Lii4Lit4LiU4LiX4Li14LmI4Lih4Liy4LiI4Liy4LiB4LiB4LmJ4Lit4LiZ4Lii4LmI4Lit4LiiICcgKyBiYWh0KHgucGFpZEZyb21DaGlsZHJlbikgKyAnPC9k',
  'aXY+JyA6ICcnKQogICAgICAgIDogJycpICsKICAgICAgKHguaW50ZXJlc3RQZXJNb250aCA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIG10OCI+4LiU4Lit4LiB4LmA4Lia4Li14LmJ4LiiICcgKyBiYWh0KHguaW50ZXJlc3RQZXJNb250aCkgKyAnL+C5gOC4lOC4',
  't+C4reC4mTwvZGl2PicgOiAnJykgKwogICAgICAoeC5wbGFuUGVyTW9udGggPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCI+4LmB4Lic4LiZ4Lic4LmI4Lit4LiZICcgKyBiYWh0KHgucGxhblBlck1vbnRoKSArICcv4LmA4LiU4Li34Lit4LiZPC9kaXY+JyA6ICcn',
  'KSArCiAgICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQxMiI+PGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPVwnZm9ybURlYnQoJyArIGF0dHIoeCkgKyAnLCInICsgZC5sZWRnZXIgKyAnIilcJz7guYHguIHguYnguYTguII8L2J1dHRvbj4nICsKICAgICAgJzxi',
  'dXR0b24gY2xhc3M9ImJ0biBzbSIgdGl0bGU9IuC4ouC4reC4lOC5hOC4oeC5iOC4leC4o+C4h+C4geC4seC4muC4l+C4teC5iOC5gOC4iOC5ieC4suC4q+C4meC4teC5ieC5geC4iOC5ieC4hz8g4LiB4Lij4Lit4LiB4Lii4Lit4LiU4LiE4LiH4LmA4Lir4Lil4Li3',
  '4Lit4LiI4Lij4Li04LiHIiBvbmNsaWNrPVwnZm9ybVJlY29uY2lsZURlYnQoJyArIGF0dHIoeCkgKyAnKVwnPuKalu+4jyDguJvguKPguLHguJrguKLguK3guJTguYPguKvguYnguJXguKPguIc8L2J1dHRvbj4nICsKICAgICAgLy8g4LiB4LmJ4Lit4LiZ4LiX4Li1',
  '4LmI4Lii4Li34Lih4Lih4Liy4LmB4Liq4LiU4LiHIOC4peC4muC4iOC4suC4geC4q+C4meC5ieC4suC4meC4teC5ieC5hOC4oeC5iOC5hOC4lOC5iSAo4LiI4Liw4Lir4Liy4Lii4LiI4Liy4LiB4Lit4Li14LiB4Lir4LiZ4LmJ4Liy4LiU4LmJ4Lin4LiiKSDigJQg',
  '4LmE4Lib4Lil4Lia4LiX4Li14LmI4Lir4LiZ4LmJ4Liy4LmA4LiI4LmJ4Liy4LiC4Lit4LiHIOC4q+C4o+C4t+C4reC4m+C4tOC4lOC4geC4suC4o+C5geC4quC4lOC4h+C4o+C5iOC4p+C4oeC5g+C4meC4n+C4reC4o+C5jOC4oeC5geC4geC5ieC5hOC4ggogICAg',
  'ICAoeC5zaGFyZWRGcm9tID8gJycgOiAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGRnciIgb25jbGljaz0iZGVsRGVidCgnICsganNxKHguaWQpICsgJykiPuC4peC4mjwvYnV0dG9uPicpICsgJzwvZGl2PicgKwogICAgJzwvZGl2PjwvZGl2Pic7CiAgfSkuam9pbign',
  'JykgKyAnPC9kaXY+JyA6ICcnOwoKICB2YXIgYnlZZWFyID0gZC5ieVllYXIubGVuZ3RoID8gY2FyZCgn8J+ThSDguKLguK3guJTguIrguLPguKPguLDguYHguKLguIHguJXguLLguKHguJvguLUnLAogICAgJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQi',
  'Pjx0aGVhZD48dHI+JyArCiAgICAnPHRoPuC4m+C4tTwvdGg+PHRoIGNsYXNzPSJudW0iPuC5gOC4h+C4tOC4meC4leC5ieC4mTwvdGg+PHRoIGNsYXNzPSJudW0iPuC4lOC4reC4geC5gOC4muC4teC5ieC4ojwvdGg+PHRoIGNsYXNzPSJudW0iPuC4o+C4p+C4oeC4',
  'l+C4teC5iOC5guC4reC4mTwvdGg+JyArCiAgICAnPHRoIGNsYXNzPSJudW0iPuC4iOC4s+C4meC4p+C4meC4hOC4o+C4seC5ieC4hzwvdGg+PHRoIGNsYXNzPSJudW0iPuC5gOC4h+C4tOC4meC4leC5ieC4meC4quC4sOC4quC4oTwvdGg+PHRoIHN0eWxlPSJ3aWR0',
  'aDoyNiUiPuC4hOC4p+C4suC4oeC4hOC4t+C4muC4q+C4meC5ieC4suC4quC4sOC4quC4oTwvdGg+JyArCiAgICAnPC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgIGQuYnlZZWFyLm1hcChmdW5jdGlvbih5KXsKICAgICAgdmFyIGN1bSA9IHkuY3VtdWxhdGl2ZSAh',
  'PSBudWxsID8geS5jdW11bGF0aXZlIDogMDsKICAgICAgdmFyIHAgPSBkLnRvdGFsRGVidCA/IChjdW0gLyBkLnRvdGFsRGVidCAqIDEwMCkgOiAwOwogICAgICByZXR1cm4gJzx0ciBvbmNsaWNrPSJzZXRZZWFyRnJvbVRhYmxlKCcgKyB5LnllYXIgKyAnKSIgc3R5',
  'bGU9ImN1cnNvcjpwb2ludGVyIj4nICsKICAgICAgICAnPHRkPjxiPicgKyBkaXNwbGF5WWVhcih5LnllYXIpICsgJzwvYj4nICsKICAgICAgICAgICh1c2VCdWRkaGlzdFllYXIoKSA/ICcgPHNwYW4gY2xhc3M9ImZhaW50IGZzMTIiPi8gJyArIHkueWVhciArICc8',
  'L3NwYW4+JyA6ICcnKSArICc8L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIG1vbmV5KHkucHJpbmNpcGFsKSArICc8L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArICh5LmludGVyZXN0ID8gbW9uZXkoeS5pbnRlcmVzdCkgOiAn',
  '4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxiPicgKyBtb25leSh5LnByaW5jaXBhbCArIHkuaW50ZXJlc3QpICsgJzwvYj48L3RkPicgKwogICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIHkuY291bnQgKyAnPC90ZD4nICsKICAg',
  'ICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyBtb25leShjdW0pICsgJzwvdGQ+JyArCiAgICAgICAgJzx0ZD4nICsgcHJvZ3Jlc3MocCkgKyAnPC90ZD48L3RyPic7CiAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JywgJycsIHRydWUpIDog',
  'Jyc7CgogIHZhciByb3dzID0gZC5wYXltZW50czsKICB2YXIgbGlzdCA9IGNhcmQoJ/Cfp74g4Lij4Liy4Lii4LiB4Liy4Lij4LmC4Lit4LiZ4LmD4LiK4LmJ4Lir4LiZ4Li14LmJIMK3ICcgKyB5ZWFyTGFiZWwgKyAnICgnICsgcm93cy5sZW5ndGggKyAnKScsCiAg',
  'ICByb3dzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0Ij48dGhlYWQ+PHRyPicgKwogICAgICAnPHRoPuC4p+C4seC4meC4l+C4teC5iDwvdGg+PHRoPuC4h+C4p+C4lDwvdGg+PHRoIGNsYXNzPSJudW0iPuC5gOC4h+C4tOC4meC4leC5',
  'ieC4mTwvdGg+PHRoIGNsYXNzPSJudW0iPuC4lOC4reC4geC5gOC4muC4teC5ieC4ojwvdGg+JyArCiAgICAgICc8dGggY2xhc3M9Im51bSI+4Lij4Lin4Lih4LiX4Li14LmI4LmC4Lit4LiZPC90aD48dGg+4LiK4LmI4Lit4LiH4LiX4Liy4LiHPC90aD4nICsKICAg',
  'ICAgJzx0aD7guKrguKXguLTguJs8L3RoPjx0aD7guKvguKHguLLguKLguYDguKvguJXguLg8L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgIHJvd3MubWFwKGZ1bmN0aW9uKHApewogICAgICAgIHZhciBhZGogPSBwLmNoYW5uZWwgPT09',
  'ICfguJvguKPguLHguJrguKLguK3guJQnOwogICAgICAgIHJldHVybiAnPHRyJyArIChhZGogPyAnIGNsYXNzPSJhZGoiIHRpdGxlPSLguKPguLLguKLguIHguLLguKPguJvguKPguLHguJrguKLguK3guJTguYPguKvguYnguJXguKPguIfguKLguK3guJTguIjguKPg',
  'uLTguIcg4LmE4Lih4LmI4LmD4LiK4LmI4LmA4LiH4Li04LiZ4LiX4Li14LmI4LmC4Lit4LiZIicgOiAnJykgKyAnPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibm93cmFwIj4nICsgdGhEYXRlKHAucGF5RGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQg',
  'Y2xhc3M9Im5vd3JhcCI+JyArIGVzYyhwLmluc3RhbGxtZW50IHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHAucHJpbmNpcGFsID8gJzxiIHN0eWxlPSJjb2xvcjp2YXIoLS1vaykiPicgKyBtb25leShwLnByaW5j',
  'aXBhbCkgKyAnPC9iPicgOiAnPHNwYW4gY2xhc3M9ImZhaW50Ij7igJM8L3NwYW4+JykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIChwLmludGVyZXN0ID8gJzxiIHN0eWxlPSJjb2xvcjp2YXIoLS13YXJuKSI+JyArIG1vbmV5KHAu',
  'aW50ZXJlc3QpICsgJzwvYj4nIDogJzxzcGFuIGNsYXNzPSJmYWludCI+4oCTPC9zcGFuPicpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxiPicgKyBtb25leShwLmFtb3VudCkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNs',
  'YXNzPSJmczEyIj4nICsgKGFkaiA/ICc8c3BhbiBjbGFzcz0iYiBpbmZvIj7impbvuI8g4Lib4Lij4Lix4Lia4Lii4Lit4LiUPC9zcGFuPicgOiBlc2MocC5jaGFubmVsIHx8ICfigJMnKSkgKwogICAgICAgICAgICAocC5zaGFyZWRGcm9tID8gJzxkaXYgY2xhc3M9',
  'Im10OCI+PHNwYW4gY2xhc3M9ImIgb2siIHRpdGxlPSLguKPguLLguKLguIHguLLguKPguYDguJTguLXguKLguKfguIHguLHguJrguYPguJnguK3guLXguIHguKvguJnguYnguLIiPvCflJcgJyArCiAgICAgICAgICAgICAgKHAuc2hhcmVkRnJvbSA9PT0gJ+C4q+C4',
  'meC4teC5ieC4q+C4peC4seC4gScgPyAn4Lij4Liy4Lii4LiB4Liy4Lij4Liq4Lij4Li44Lib4Lij4Lin4LihJyA6ICfguKvguJnguLXguYnguKrguLTguJknKSArICc8L3NwYW4+PC9kaXY+JyA6ICcnKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZD4nICsgdGh1',
  'bWJzSHRtbChwLnNsaXBSZWZzKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiBtdXRlZCBjbGlwIj4nICsgZXNjKHAubm90ZSB8fCAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0idC1hY3Rpb25zIj4nICsKICAg',
  'ICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIiBvbmNsaWNrPVwnZm9ybURlYnRQYXltZW50KCcgKyBhdHRyKHApICsgJywiJyArIGQubGVkZ2VyICsgJyIpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJi',
  'dG4gc20gaWNvbiBkZ3IiIG9uY2xpY2s9ImRlbERlYnRQYXltZW50KCcgKyBqc3EocC5pZCkgKyAnKSI+8J+XkTwvYnV0dG9uPicgKwogICAgICAgICAgJzwvZGl2PjwvdGQ+PC90cj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+',
  'JwogICAgOiBlbXB0eUJveCgn4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4Lij4LiK4Liz4Lij4Liw4LmD4LiZJyArIHllYXJMYWJlbCwKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZm9ybURlYnRQYXltZW50',
  'KG51bGwsXCcnICsgZC5sZWRnZXIgKyAnXCcpIj4rIOC4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C4iuC4s+C4o+C4sDwvYnV0dG9uPicpLAogICAgJycsIHRydWUpOwoKICByZXR1cm4gaGVhZCArIHBlckRlYnQgKyBieVllYXIgKyAnPGRpdiBjbGFzcz0ibXQx',
  'MiI+JyArIGxpc3QgKyAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gc2V0WWVhckZyb21UYWJsZSh5KXsKICBTLnllYXIgPSBTdHJpbmcoeSk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3llYXJTZWwnKS52YWx1ZSA9IFMueWVhcjsKICBsb2FkKCk7Cn0KCi8qID09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICAzKSDguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09ICovClJPVVRFUy5wdXJjaGFzZXMgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsKICAgIHJldHVybiBQcm9taXNlLmFsbChbCiAgICAgIGNhbGxBcGkoJ3B1cmNoYXNlLnN1bW1hcnknLCB7IHllYXI6IFMueWVhciB9KSwKICAgICAgY2Fs',
  'bEFwaSgncHVyY2hhc2UubGlzdCcsIHsgeWVhcjogUy55ZWFyLCBjYXRlZ29yeTogUy5wYXJhbXMuY2F0ZWdvcnkgfHwgJycsIHE6IFMucGFyYW1zLnEgfHwgJycgfSkKICAgIF0pLnRoZW4oZnVuY3Rpb24ocil7IHZhciBkID0gclswXTsgZC5pdGVtcyA9IHJbMV07',
  'IHJldHVybiBkOyB9KTsKICB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgeWVhckxhYmVsID0gUy55ZWFyID09PSAnYWxsJyA/ICfguJfguLjguIHguJvguLUnIDogJ+C4m+C4tSAnICsgUy55ZWFyOwogICAgdmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0i',
  'Z3JpZCBnNCBtYjEyIj4nICsKICAgICAga3BpKCfguKLguK3guJTguIvguLfguYnguK0gJyArIHllYXJMYWJlbCwgYmFodChkLnllYXJUb3RhbCksIGQueWVhckNvdW50ICsgJyDguKPguLLguKLguIHguLLguKMnLCAnYWNjZW50JykgKwogICAgICBrcGkoJ+C4ouC4',
  'reC4lOC4quC4sOC4quC4oeC4l+C4seC5ieC4h+C4q+C4oeC4lCcsIGJhaHQoZC5ncmFuZFRvdGFsKSwgZC5ncmFuZENvdW50ICsgJyDguKPguLLguKLguIHguLLguKMnKSArCiAgICAgIGtwaSgn4Lit4Lii4Li54LmI4LmD4LiZ4Lib4Lij4Liw4LiB4Lix4LiZJywg',
  'ZC53YXJyYW50eS5hY3RpdmUgKyAnIOC4o+C4suC4ouC4geC4suC4oycsICfguYPguIHguKXguYnguKvguKHguJQgJyArIGQud2FycmFudHkuZXhwaXJpbmcsIGQud2FycmFudHkuZXhwaXJpbmcgPyAnd2FybicgOiAnZ29vZCcpICsKICAgICAga3BpKCfguKvguKHg',
  'uKfguJTguJfguLXguYjguYPguIrguYnguIjguYjguLLguKLguKrguLnguIfguKrguLjguJQnLCBkLmJ5Q2F0ZWdvcnlbMF0gPyBkLmJ5Q2F0ZWdvcnlbMF0uY2F0ZWdvcnkgOiAn4oCTJywKICAgICAgICAgIGQuYnlDYXRlZ29yeVswXSA/IGJhaHQoZC5ieUNhdGVn',
  'b3J5WzBdLnRvdGFsKSA6ICcnKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgY2hhcnRzID0gJzxkaXYgY2xhc3M9ImdyaWQgZzIgbWIxMiI+JyArCiAgICAgIGNhcmQoJ/Cfk4og4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4LmB4Lii4LiB4LiV4Liy4Lih',
  '4Lir4Lih4Lin4LiU4Lir4Lih4Li54LmIIMK3ICcgKyB5ZWFyTGFiZWwsCiAgICAgICAgYmFyQ2hhcnQoZC5ieUNhdGVnb3J5LCAnY2F0ZWdvcnknLCAndG90YWwnLCBmdW5jdGlvbihpKXsgcmV0dXJuIG1vbmV5KGkudG90YWwpICsgJyDguL8nOyB9KSkgKwogICAg',
  'ICBjYXJkKCfwn5OFIOC4ouC4reC4lOC4i+C4t+C5ieC4reC5geC4ouC4geC4leC4suC4oeC4m+C4tScsCiAgICAgICAgYmFyQ2hhcnQoZC5ieVllYXIubWFwKGZ1bmN0aW9uKHkpeyByZXR1cm4geyBsYWJlbDogJ+C4m+C4tSAnICsgeS55ZWFyICsgJyAoJyArIHku',
  'Y291bnQgKyAnKScsIHRvdGFsOiB5LnRvdGFsLCB5ZWFyOiB5LnllYXIgfTsgfSksCiAgICAgICAgICAgICAgICAgJ2xhYmVsJywgJ3RvdGFsJywgZnVuY3Rpb24oaSl7IHJldHVybiBtb25leShpLnRvdGFsKSArICcg4Li/JzsgfSkpICsKICAgICc8L2Rpdj4nOwoK',
  'ICAgIHZhciBjYXRzID0gJzxkaXYgY2xhc3M9ImNoaXBzIG1iMTIiPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iY2hpcCAnICsgKCFTLnBhcmFtcy5jYXRlZ29yeT8nb24nOicnKSArICciIG9uY2xpY2s9InNldFBhcmFtKFwnY2F0ZWdvcnlcJyxcJ1wnKSI+4LiX',
  '4Li44LiB4Lir4Lih4Lin4LiUPC9idXR0b24+JyArCiAgICAgIGQuYnlDYXRlZ29yeS5tYXAoZnVuY3Rpb24oYyl7CiAgICAgICAgcmV0dXJuICc8YnV0dG9uIGNsYXNzPSJjaGlwICcgKyAoUy5wYXJhbXMuY2F0ZWdvcnk9PT1jLmNhdGVnb3J5Pydvbic6JycpICsg',
  'JyIgJyArCiAgICAgICAgICAgICAgICdvbmNsaWNrPSJzZXRQYXJhbShcJ2NhdGVnb3J5XCcsJyArIGpzcShjLmNhdGVnb3J5KSArICcpIj4nICsgZXNjKGMuY2F0ZWdvcnkpICsgJyAoJyArIGMuY291bnQgKyAnKTwvYnV0dG9uPic7CiAgICAgIH0pLmpvaW4oJycp',
  'ICsgJzwvZGl2Pic7CgogICAgdmFyIHJvd3MgPSBkLml0ZW1zOwogICAgdmFyIHRhYmxlID0gY2FyZCgn8J+bkiDguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcgwrcgJyArIHllYXJMYWJlbCArICcgKCcgKyByb3dzLmxlbmd0aCArICcpJywK',
  'ICAgICAgcm93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDo5ODBweCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoIHN0eWxlPSJ3aWR0aDo5NnB4Ij7guKfguLHguJnguJfguLXguYjguIvguLfg',
  'uYnguK08L3RoPjx0aD7guKPguLLguKLguIHguLLguKPguKrguLTguJnguITguYnguLI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guIjguLPguJnguKfguJk8L3RoPicgKwogICAgICAgICc8dGggY2xhc3M9Im51bSI+4Lij4Liy4LiE4LiyPC90aD48dGg+4LmB4Lir4Lil',
  '4LmI4LiH4LiX4Li14LmI4LiL4Li34LmJ4LitPC90aD48dGg+4Lib4Lij4Liw4LiB4Lix4LiZPC90aD48dGg+4Lig4Liy4LiePC90aD48dGg+4Liq4Lil4Li04LibPC90aD48dGg+PC90aD4nICsKICAgICAgICAnPC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAg',
  'ICByb3dzLm1hcChmdW5jdGlvbihwKXsKICAgICAgICAgIHZhciB3ID0gcC53YXJyYW50eSB8fCB7fTsKICAgICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZShwLmJ1eURhdGUpICsgJzwv',
  'dGQ+JyArCiAgICAgICAgICAgICc8dGQ+PGRpdiBjbGFzcz0iY2xpcCIgdGl0bGU9IicgKyBlc2MocC5pdGVtKSArICciPjxiPicgKyBlc2MocC5pdGVtKSArICc8L2I+PC9kaXY+JyArCiAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImZzMTIgZmFpbnQiPicgKyBl',
  'c2MocC5jYXRlZ29yeSB8fCAnJykgKyAocC5yb29tID8gJyDCtyDguKvguYnguK3guIcgJyArIGVzYyhwLnJvb20pIDogJycpICsKICAgICAgICAgICAgICAgIChwLm9yZGVyTm8gPyAnIMK3IOC4reC4reC4o+C5jOC5gOC4lOC4reC4o+C5jCAnICsgZXNjKHAub3Jk',
  'ZXJObykgOiAnJykgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICAgYmlsbEh0bWwocCkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbnVtKHAucXR5KSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxi',
  'PicgKyBtb25leShwLnByaWNlKSArICc8L2I+PC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyhwLnZlbmRvciB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArICh3LmhhcwogICAg',
  'ICAgICAgICAgICAgPyBzdGF0dXNCYWRnZSh3LnN0YXRlKSArICc8ZGl2IGNsYXNzPSJmYWludCIgc3R5bGU9ImZvbnQtc2l6ZToxMXB4Ij4nICsgdGhEYXRlU2hvcnQody5lbmQpICsgJzwvZGl2PicKICAgICAgICAgICAgICAgIDogJzxzcGFuIGNsYXNzPSJmYWlu',
  'dCI+4oCTPC9zcGFuPicpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwocC5waG90b1JlZnMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHRodW1ic0h0bWwocC5zbGlwUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAg',
  'ICAgJzx0ZD48ZGl2IGNsYXNzPSJ0LWFjdGlvbnMiPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1QdXJjaGFzZSgnICsgYXR0cihwKSArICcpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAg',
  'ICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIGRnciIgb25jbGljaz0iZGVsUHVyY2hhc2UoJyArIGpzcShwLmlkKSArICcpIj7wn5eRPC9idXR0b24+JyArCiAgICAgICAgICAgICc8L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8',
  'L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6IGVtcHR5Qm94KCfguKLguLHguIfguYTguKHguYjguKHguLXguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guYPguJknICsgeWVhckxhYmVsLCAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0i',
  'Zm9ybVB1cmNoYXNlKG51bGwpIj4rIOC5gOC4nuC4tOC5iOC4oeC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4rTwvYnV0dG9uPicpLAogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSBzbSIgb25jbGljaz0iZm9ybVB1cmNoYXNlKG51bGwpIj4rIOC5gOC4',
  'nuC4tOC5iOC4oeC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4rTwvYnV0dG9uPicsIHRydWUpOwoKICAgIHJldHVybiBoZWFkICsgY2hhcnRzICsgY2F0cyArIHRhYmxlOwogIH0KfTsKCi8qKgogKiDguJrguLTguKXguJfguLXguYjguKHguLXguILguK3guIfg',
  'uKvguKXguLLguKLguK3guKLguYjguLLguIcg4oCUIOC5geC4quC4lOC4h+C5gOC4m+C5h+C4meC4m+C4uOC5iOC4oeC4geC4suC4h+C4lOC4uSDguYTguKHguYjguYPguKvguYnguJXguLLguKPguLLguIfguKLguLLguKfguYDguIHguLTguJnguYTguJsKICog4Lia',
  '4Li04Lil4LiX4Li14LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4Lij4LmA4LiU4Li14Lii4Lin4Lir4Lij4Li34Lit4LmE4Lih4LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4Lii4LmA4Lil4LiiIOC5hOC4oeC5iOC4leC5ieC4reC4h+C5geC4quC4',
  'lOC4h+C4reC4sOC5hOC4o+C5gOC4nuC4tOC5iOC4oQogKi8KZnVuY3Rpb24gYmlsbEh0bWwocCl7CiAgdmFyIGIgPSBwLmJpbGw7CiAgaWYgKCFiIHx8IGIuY291bnQgPCAyKSByZXR1cm4gJyc7CiAgdmFyIGlkID0gJ2JpbGxfJyArIHAuaWQ7CiAgcmV0dXJuICc8',
  'YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJpbGwtdG9nZ2xlIiBvbmNsaWNrPSJ0b2dnbGVCaWxsKFwnJyArIGlkICsgJ1wnKSI+JyArCiAgICAgICfwn6e+ICcgKyBiLmNvdW50ICsgJyDguKPguLLguKLguIHguLLguKPguYPguJnguJrguLTguKUg4pa+PC9i',
  'dXR0b24+JyArCiAgICAnPGRpdiBjbGFzcz0iYmlsbC1saW5lcyIgaWQ9IicgKyBpZCArICciIGhpZGRlbj4nICsKICAgICAgYi5saW5lcy5tYXAoZnVuY3Rpb24obCl7CiAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJiaWxsLWxpbmUiPicgKwogICAgICAgICAg',
  'JzxzcGFuIGNsYXNzPSJubSIgdGl0bGU9IicgKyBlc2MobC5uYW1lKSArICciPicgKyBlc2MobC5uYW1lKSArICc8L3NwYW4+JyArCiAgICAgICAgICAnPHNwYW4gY2xhc3M9InF0Ij4nICsgbnVtKGwucXR5KSArIChsLnVuaXQgPyAnICcgKyBlc2MobC51bml0KSA6',
  'ICcnKSArICcgw5cgJyArIG1vbmV5KGwudW5pdFByaWNlLCAyKSArICc8L3NwYW4+JyArCiAgICAgICAgICAnPHNwYW4gY2xhc3M9InR0Ij4nICsgbW9uZXkobC50b3RhbCwgMikgKyAnPC9zcGFuPjwvZGl2Pic7CiAgICAgIH0pLmpvaW4oJycpICsKICAgICAgKChi',
  'LnNoaXBwaW5nIHx8IGIuZGlzY291bnQpCiAgICAgICAgPyAnPGRpdiBjbGFzcz0iYmlsbC1leHRyYSI+JyArCiAgICAgICAgICAgIChiLnNoaXBwaW5nID8gJ+C4hOC5iOC4suC4quC5iOC4hyAnICsgbW9uZXkoYi5zaGlwcGluZywgMikgOiAnJykgKwogICAgICAg',
  'ICAgICAoYi5zaGlwcGluZyAmJiBiLmRpc2NvdW50ID8gJyDCtyAnIDogJycpICsKICAgICAgICAgICAgKGIuZGlzY291bnQgPyAn4Liq4LmI4Lin4LiZ4Lil4LiUIOKIkicgKyBtb25leShiLmRpc2NvdW50LCAyKSA6ICcnKSArICc8L2Rpdj4nCiAgICAgICAgOiAn',
  'JykgKwogICAgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIHRvZ2dsZUJpbGwoaWQpewogIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTsKICBpZiAoIWVsKSByZXR1cm47CiAgZWwuaGlkZGVuID0gIWVsLmhpZGRlbjsKICB2YXIgYnRuID0gZWwucHJl',
  'dmlvdXNFbGVtZW50U2libGluZzsKICBpZiAoYnRuKSBidG4udGV4dENvbnRlbnQgPSBidG4udGV4dENvbnRlbnQucmVwbGFjZShlbC5oaWRkZW4gPyAn4pa0JyA6ICfilr4nLCBlbC5oaWRkZW4gPyAn4pa+JyA6ICfilrQnKTsKfQoKZnVuY3Rpb24gc2V0UGFyYW0o',
  'a2V5LCB2YWwpewogIFMucGFyYW1zW2tleV0gPSB2YWw7CiAgbG9hZCgpOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgNCkg4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMCiAgID09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpST1VURVMuYWMgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsgcmV0dXJuIGNhbGxBcGkoJ2FjLm1hdHJpeCcsIHsgeWVhcjogUy55ZWFyIH0pOyB9LAogIHJlbmRl',
  'cjogZnVuY3Rpb24oZCl7CiAgICB2YXIgeWVhckxhYmVsID0gUy55ZWFyID09PSAnYWxsJyA/ICfguJfguLjguIHguJvguLUnIDogJ+C4m+C4tSAnICsgUy55ZWFyOwogICAgdmFyIGhlYWQgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAga3Bp',
  'KCfguKXguYnguLLguIfguYHguKXguYnguKcgJyArIHllYXJMYWJlbCwgZC5yb29tc0RvbmVJblllYXIgKyAnLycgKyBkLnJvb21zLmxlbmd0aCArICcg4Lir4LmJ4Lit4LiHJywgZC5kb25lSW5ZZWFyICsgJyDguKPguK3guJrguJfguLHguYnguIfguKvguKHguJQn',
  'LCAnYWNjZW50JykgKwogICAgICBrcGkoJ+C4ouC4seC4h+C5hOC4oeC5iOC5hOC4lOC5ieC4peC5ieC4suC4hycsIGQucm9vbXNQZW5kaW5nLmxlbmd0aCArICcg4Lir4LmJ4Lit4LiHJywgZC5yb29tc1BlbmRpbmcuc2xpY2UoMCw4KS5qb2luKCcsICcpICsgKGQu',
  'cm9vbXNQZW5kaW5nLmxlbmd0aD44PyfigKYnOicnKSwgZC5yb29tc1BlbmRpbmcubGVuZ3RoID8gJ3dhcm4nOidnb29kJykgKwogICAgICBrcGkoJ+C4luC4tuC4h+C4geC4s+C4q+C4meC4lOC4peC5ieC4suC4hycsIGQub3ZlcmR1ZS5sZW5ndGggKyAnIOC4q+C5',
  'ieC4reC4hycsICfguKPguK3guJrguKXguYnguLLguIfguJfguLjguIEgJyArIGQuY3ljbGVNb250aHMgKyAnIOC5gOC4lOC4t+C4reC4mScsIGQub3ZlcmR1ZS5sZW5ndGggPyAnYmFkJzonZ29vZCcpICsKICAgICAga3BpKCfguITguKfguLLguKHguITguLfguJrg',
  'uKvguJnguYnguLInLCBwY3QoZC5yb29tcy5sZW5ndGggPyBkLnJvb21zRG9uZUluWWVhci9kLnJvb21zLmxlbmd0aCoxMDAgOiAwKSwgJ+C4guC4reC4h+C4l+C4seC5ieC4h+C4q+C4oeC4lCAnICsgZC5yb29tcy5sZW5ndGggKyAnIOC4q+C5ieC4reC4hycpICsK',
  'ICAgICc8L2Rpdj4nOwoKICAgIHZhciBhY3Rpb25zID0gJzxkaXYgY2xhc3M9InJvdyBtYjEyIj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZvcm1BYyhudWxsKSI+KyDguJrguLHguJnguJfguLbguIHguIHguLLguKPguKXguYng',
  'uLLguIfguYHguK3guKPguYw8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iZm9ybUJ1bGtBYygpIj7wn5OFIOC4meC4seC4lOC4peC5ieC4suC4h+C4q+C4peC4suC4ouC4q+C5ieC4reC4h+C4nuC4o+C5ieC4reC4oeC4geC4',
  'seC4mTwvYnV0dG9uPicgKwogICAgICAnPHNwYW4gY2xhc3M9InNwIj48L3NwYW4+JyArCiAgICAgICc8c3BhbiBjbGFzcz0iZnMxMiBtdXRlZCI+4LiE4Lil4Li04LiB4LiX4Li14LmI4Lir4LmJ4Lit4LiH4LmA4Lie4Li34LmI4Lit4LiU4Li5L+C5gOC4nuC4tOC5',
  'iOC4oeC4o+C4reC4muC4geC4suC4o+C4peC5ieC4suC4hzwvc3Bhbj4nICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciBncmlkID0gY2FyZCgn4p2E77iPIOC4leC4suC4o+C4suC4h+C4peC5ieC4suC4h+C5geC4reC4o+C5jOC4o+C4suC4ouC4q+C5ieC4reC4hyDC',
  'tyAnICsgeWVhckxhYmVsLCByb29tRmxvb3JzKGQucm9vbXMsIGZ1bmN0aW9uKHIpewogICAgICB2YXIgY2xzID0gci5yb3VuZHNJblllYXIgPiAwID8gJ3Mtb2snIDogKHIuc3RhdGUgPT09ICfguYDguIHguLTguJnguIHguLPguKvguJnguJQnID8gJ3MtZGdyJyA6',
  'IChyLnN0YXRlID09PSAn4Lii4Lix4LiH4LmE4Lih4LmI4LmA4LiE4Lii4Lil4LmJ4Liy4LiHJyA/ICdzLXdhcm4nIDogJ3MtaW5mbycpKTsKICAgICAgdmFyIHN1YiA9IHIucm91bmRzSW5ZZWFyID4gMAogICAgICAgID8gJzxiPicgKyByLnJvdW5kc0luWWVhciAr',
  'ICcg4Lij4Lit4LiaPC9iPjxicj4nICsgdGhEYXRlU2hvcnQoci5yZWNvcmRzLmZpbHRlcihmdW5jdGlvbih4KXtyZXR1cm4geC5zZXJ2aWNlRGF0ZTt9KS5tYXAoZnVuY3Rpb24oeCl7cmV0dXJuIHguc2VydmljZURhdGU7fSkuc29ydCgpLnBvcCgpKQogICAgICAg',
  'IDogKHIuYm9va2VkSW5ZZWFyID8gJ+C4meC4seC4lOC5geC4peC5ieC4pyAnICsgci5ib29rZWRJblllYXIgOiAoci5sYXN0U2VydmljZSA/ICfguKXguYjguLLguKrguLjguJQgJyArIHRoRGF0ZVNob3J0KHIubGFzdFNlcnZpY2UpIDogJ+C5hOC4oeC5iOC4oeC4',
  'teC4m+C4o+C4sOC4p+C4seC4leC4tCcpKTsKICAgICAgcmV0dXJuIHsgY2xzOiBjbHMsIHN1Yjogc3ViLCBvbmNsaWNrOiAnb3BlbkFjUm9vbSgnICsganNxKHIucm9vbSkgKyAnKScgfTsKICAgIH0pLCAnJywgZmFsc2UpOwoKICAgIHZhciBsaXN0Um93cyA9IFtd',
  'OwogICAgZC5yb29tcy5mb3JFYWNoKGZ1bmN0aW9uKHIpeyByLnJlY29yZHMuZm9yRWFjaChmdW5jdGlvbih4KXsgeC5fcm9vbSA9IHIucm9vbTsgbGlzdFJvd3MucHVzaCh4KTsgfSk7IH0pOwogICAgbGlzdFJvd3Muc29ydChmdW5jdGlvbihhLGIpeyByZXR1cm4g',
  'U3RyaW5nKGIuc2VydmljZURhdGV8fGIuYm9va0RhdGV8fCcnKS5sb2NhbGVDb21wYXJlKFN0cmluZyhhLnNlcnZpY2VEYXRlfHxhLmJvb2tEYXRlfHwnJykpOyB9KTsKCiAgICB2YXIgbGlzdCA9IGNhcmQoJ/Cfk4sg4Lib4Lij4Liw4Lin4Lix4LiV4Li04LiB4Liy',
  '4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMIMK3ICcgKyB5ZWFyTGFiZWwgKyAnICgnICsgbGlzdFJvd3MubGVuZ3RoICsgJyknLAogICAgICBsaXN0Um93cy5sZW5ndGggPyAnPGRpdiBjbGFzcz0idHciPjx0YWJsZSBjbGFzcz0idCI+PHRoZWFkPjx0cj4nICsK',
  'ICAgICAgICAnPHRoPuC4q+C5ieC4reC4hzwvdGg+PHRoPuC4o+C4reC4muC4l+C4teC5iDwvdGg+PHRoPuC4p+C4seC4meC4l+C4teC5iOC4meC4seC4lDwvdGg+PHRoPuC4p+C4seC4meC4l+C4teC5iOC4lOC4s+C5gOC4meC4tOC4meC4geC4suC4ozwvdGg+PHRo',
  'PuC4quC4luC4suC4meC4sDwvdGg+JyArCiAgICAgICAgJzx0aD7guIrguYjguLLguIc8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguYjguLLguYPguIrguYnguIjguYjguLLguKI8L3RoPjx0aD7guKDguLLguJ48L3RoPjx0aD7guKvguKHguLLguKLguYDguKvguJXg',
  'uLg8L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgbGlzdFJvd3MubWFwKGZ1bmN0aW9uKHgpewogICAgICAgICAgcmV0dXJuICc8dHI+JyArCiAgICAgICAgICAgICc8dGQ+PGI+JyArIGVzYyh4LnJvb20pICsgJzwvYj48L3RkPicg',
  'KwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAoeC5yb3VuZCB8fCAxKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LmJvb2tEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRk',
  'IGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LnNlcnZpY2VEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPicgKyBzdGF0dXNTZWxlY3QoeCwgJ2FjLnNldFN0YXR1cycsIG9wdCgnYWNTdGF0dXNlcycpKSArICc8L3RkPicgKwogICAgICAg',
  'ICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKHgudGVjaG5pY2lhbiB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbnVtKHguY29zdCkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgdGh1bWJz',
  'SHRtbCh4LnBob3RvUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiBtdXRlZCBjbGlwIj4nICsgZXNjKHgubm90ZSB8fCAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48ZGl2IGNsYXNzPSJ0LWFjdGlvbnMiPicgKwog',
  'ICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1BYygnICsgYXR0cih4KSArICcpXCc+4pyP77iPPC9idXR0b24+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIGRnciIgb25jbGlj',
  'az0iZGVsQWMoJyArIGpzcSh4LmlkKSArICcpIj7wn5eRPC9idXR0b24+JyArCiAgICAgICAgICAgICc8L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6IGVtcHR5Qm94KCfguKLguLHg',
  'uIfguYTguKHguYjguKHguLXguJrguLHguJnguJfguLbguIHguIHguLLguKPguKXguYnguLLguIfguYHguK3guKPguYzguYPguJknICsgeWVhckxhYmVsKSwgJycsIHRydWUpOwoKICAgIHJldHVybiBoZWFkICsgYWN0aW9ucyArIGdyaWQgKyAnPGRpdiBjbGFzcz0i',
  'bXQxMiI+JyArIGxpc3QgKyAnPC9kaXY+JzsKICB9Cn07CgovKioKICog4LiK4LmI4Lit4LiH4LmA4Lil4Li34Lit4LiB4Liq4LiW4Liy4LiZ4Liw4LmD4LiZ4LiV4Liy4Lij4Liy4LiHIOKAlCDguYDguJvguKXguLXguYjguKLguJnguYHguKXguYnguKfguJrguLHg',
  'uJnguJfguLbguIHguJfguLHguJnguJfguLUg4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LmA4Lib4Li04LiU4Lif4Lit4Lij4LmM4LihCiAqCiAqIOC4q+C4meC5ieC4suC4leC4suC5gOC4q+C4oeC4t+C4reC4meC4m+C5ieC4suC4ouC4quC4luC4suC4meC4sOC5gOC4',
  'lOC4tOC4oeC4l+C4uOC4geC4reC4ouC5iOC4suC4hyAo4Liq4Li14LmA4LiU4Li14Lii4Lin4LiB4Lix4LiZKSDguYHguITguYjguIHguJTguYHguKXguYnguKfguYDguKXguLfguK3guIHguYTguJTguYkKICog4LiE4LiZ4LiX4Li14LmI4LmA4Lib4Li04LiU4LiU',
  '4Li54Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4Lin4LiI4Liw4LmA4Lir4LmH4LiZ4LmA4Lib4LmH4LiZ4Lib4LmJ4Liy4Lii4LiY4Lij4Lij4Lih4LiU4Liy4LmA4Lir4Lih4Li34Lit4LiZ4LmA4LiU4Li04LihCiAqLwpmdW5jdGlvbiBzdGF0dXNTZWxlY3Qo',
  'eCwgYWN0aW9uLCBvcHRpb25zKXsKICBpZiAoIWNhbkVkaXQoKSkgcmV0dXJuIHN0YXR1c0JhZGdlKHguc3RhdHVzKTsKICB2YXIgY3VyID0gU3RyaW5nKHguc3RhdHVzIHx8ICcnKTsKICB2YXIgbGlzdCA9IChvcHRpb25zIHx8IFtdKS5zbGljZSgpOwogIGlmIChj',
  'dXIgJiYgbGlzdC5pbmRleE9mKGN1cikgPCAwKSBsaXN0LnVuc2hpZnQoY3VyKTsgICAvLyDguITguYjguLLguYDguIHguYjguLLguJnguK3guIHguKPguLLguKLguIHguLLguKMg4LiV4LmJ4Lit4LiH4LmE4Lih4LmI4Lir4Liy4Lii4LmE4LibCiAgcmV0dXJuICc8',
  'c2VsZWN0IGNsYXNzPSJzdC1zZWwgJyArIHN0YXR1c1RvbmUoY3VyKSArICciIHRpdGxlPSLguYDguJvguKXguLXguYjguKLguJnguKrguJbguLLguJnguLDguYTguJTguYnguYDguKXguKIiJyArCiAgICAnIGRhdGEtcHJldj0iJyArIGVzYyhjdXIpICsgJyInICsK',
  'ICAgICcgb25jaGFuZ2U9ImNoYW5nZVN0YXR1cyhcJycgKyBhY3Rpb24gKyAnXCcsJyArIGpzcSh4LmlkKSArICcsdGhpcykiPicgKwogICAgbGlzdC5tYXAoZnVuY3Rpb24obyl7CiAgICAgIHJldHVybiAnPG9wdGlvbiB2YWx1ZT0iJyArIGVzYyhvKSArICciJyAr',
  'IChvID09PSBjdXIgPyAnIHNlbGVjdGVkJyA6ICcnKSArICc+JyArIGVzYyhvKSArICc8L29wdGlvbj4nOwogICAgfSkuam9pbignJykgKyAnPC9zZWxlY3Q+JzsKfQoKLyoqIOC4quC4teC4guC4reC4h+C4quC4luC4suC4meC4sCDguYPguIrguYnguIrguLjguJTg',
  'uYDguJTguLXguKLguKfguIHguLHguJrguJvguYnguLLguKIgc3RhdHVzQmFkZ2Ug4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4LmA4Lie4Li14LmJ4Lii4LiZ4LiB4Lix4LiZICovCmZ1bmN0aW9uIHN0YXR1c1RvbmUoc3QpewogIHZhciBtID0gU3RyaW5nKHN0YXR1',
  'c0JhZGdlKHN0KSkubWF0Y2goL2NsYXNzPSJiIChbYS16XSspIi8pOwogIHJldHVybiBtID8gbVsxXSA6ICdtdXRlJzsKfQoKZnVuY3Rpb24gY2hhbmdlU3RhdHVzKGFjdGlvbiwgaWQsIHNlbCl7CiAgdmFyIG5leHQgPSBzZWwudmFsdWUsIHByZXYgPSBzZWwuZ2V0',
  'QXR0cmlidXRlKCdkYXRhLXByZXYnKSB8fCAnJzsKICBzZWwuZGlzYWJsZWQgPSB0cnVlOwogIHNlbC5jbGFzc05hbWUgPSAnc3Qtc2VsICcgKyBzdGF0dXNUb25lKG5leHQpOwoKICBjYWxsQXBpKGFjdGlvbiwgeyBpZDogaWQsIHN0YXR1czogbmV4dCB9KS50aGVu',
  'KGZ1bmN0aW9uKHNhdmVkKXsKICAgIGlmIChzYXZlZCAmJiBzYXZlZC5maWxsZWREYXRlKSB7CiAgICAgIHRvYXN0KCfguJrguLHguJnguJfguLbguIHguYHguKXguYnguKcgwrcg4LmA4LiV4Li04Lih4Lin4Lix4LiZ4LiX4Li14LmI4LiU4Liz4LmA4LiZ4Li04LiZ',
  '4LiB4Liy4Lij4LmA4Lib4LmH4LiZICcgKyB0aERhdGUoc2F2ZWQuZmlsbGVkRGF0ZSkgKyAnIOC5g+C4q+C5ieC4lOC5ieC4p+C4oicsICdvaycpOwogICAgfQogICAgc2VsLnNldEF0dHJpYnV0ZSgnZGF0YS1wcmV2JywgbmV4dCk7CiAgICBzZWwuZGlzYWJsZWQg',
  'PSBmYWxzZTsKICAgIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgICAvLyDguIrguYjguK3guIfguKvguYnguK3guIfguIHguLHguJrguJXguLHguKfguYDguKXguILguKrguKPguLjguJvguJTguYnguLLguJnguJrguJnguK3guLLguIjguYDguJvguKXguLXguYjguKLg',
  'uJnguJXguLLguKEKICAgIHJlZnJlc2hBbGVydHMoKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgIGlmIChwcmV2KSB7IHNlbC52YWx1ZSA9IHByZXY7IHNlbC5jbGFzc05hbWUgPSAnc3Qtc2VsICcgKyBzdGF0dXNUb25lKHByZXYpOyB9CiAgICBzZWwuZGlz',
  'YWJsZWQgPSBmYWxzZTsKICAgIHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7CiAgfSk7Cn0KCmZ1bmN0aW9uIG9wZW5BY1Jvb20ocm9vbSl7CiAgdmFyIGQgPSBTLmNhY2hlLmFjOwogIHZhciByID0gZC5yb29tcy5maWx0ZXIoZnVuY3Rpb24oeCl7IHJldHVy',
  'biB4LnJvb20gPT09IHJvb207IH0pWzBdOwogIHZhciBib2R5ID0KICAgICc8ZGl2IGNsYXNzPSJncmlkIGczIG1iMTIiPicgKwogICAgICBrcGkoJ+C4o+C4reC4muC4l+C4teC5iOC4peC5ieC4suC4h+C5g+C4meC4m+C4teC4meC4teC5iScsIChyLnJvdW5kc0lu',
  'WWVhcnx8MCkgKyAnIOC4o+C4reC4micsICcnKSArCiAgICAgIGtwaSgn4Lil4LmJ4Liy4LiH4Lil4LmI4Liy4Liq4Li44LiUJywgci5sYXN0U2VydmljZSA/IHRoRGF0ZShyLmxhc3RTZXJ2aWNlKSA6ICfigJMnLCByLmxhc3RTZXJ2aWNlID8gKGRheXNBZ28oci5s',
  'YXN0U2VydmljZSkgKyAnIOC4p+C4seC4meC4l+C4teC5iOC5geC4peC5ieC4pycpIDogJycpICsKICAgICAga3BpKCfguITguKPguJrguIHguLPguKvguJnguJTguKPguK3guJrguJbguLHguJTguYTguJsnLCByLm5leHREdWUgPyB0aERhdGUoci5uZXh0RHVlKSA6',
  'ICfigJMnLCByLnN0YXRlLCByLnN0YXRlID09PSAn4LmA4LiB4Li04LiZ4LiB4Liz4Lir4LiZ4LiUJyA/ICdiYWQnIDogJycpICsKICAgICc8L2Rpdj4nICsKICAgIChyLnJlY29yZHMubGVuZ3RoCiAgICAgID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9',
  'InQiIHN0eWxlPSJtaW4td2lkdGg6YXV0byI+PHRoZWFkPjx0cj48dGg+4Lij4Lit4LiaPC90aD48dGg+4LiZ4Lix4LiUPC90aD48dGg+4LiU4Liz4LmA4LiZ4Li04LiZ4LiB4Liy4LijPC90aD48dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD48dGg+4Lig4Liy4LiePC90',
  'aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIHIucmVjb3Jkcy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgICAgICByZXR1cm4gJzx0cj48dGQ+JyArICh4LnJvdW5kfHwxKSArICc8L3RkPjx0ZCBjbGFzcz0iZnMxMiI+JyArIHRoRGF0ZSh4',
  'LmJvb2tEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgdGhEYXRlKHguc2VydmljZURhdGUpICsgJzwvdGQ+PHRkPicgKyBzdGF0dXNCYWRnZSh4LnN0YXR1cykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsg',
  'dGh1bWJzSHRtbCh4LnBob3RvUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9XCdjbG9zZU1vZGFsKCk7Zm9ybUFjKCcgKyBhdHRyKHgpICsgJylcJz7guYHguIHguYnguYTguII8L2J1dHRvbj48',
  'L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lia4Lix4LiZ4LiX4Li24LiB4LmD4LiZ4Lib4Li14LiX4Li14LmI',
  '4LmA4Lil4Li34Lit4LiBPC9kaXY+Jyk7CgogIG9wZW5Nb2RhbCgn4p2E77iPIOC4peC5ieC4suC4h+C5geC4reC4o+C5jCDCtyDguKvguYnguK3guIcgJyArIHJvb20sIGJvZHksCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCki',
  'PuC4m+C4tOC4lDwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImNsb3NlTW9kYWwoKTtmb3JtQWMoe3Jvb206JyArIGpzcShyb29tKSArICd9KSI+KyDguYDguJ7guLTguYjguKHguKPguK3guJrguIHguLLguKPguKXguYng',
  'uLLguIc8L2J1dHRvbj4nKTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDUpIOC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4suC4oeC4q+C5ieC4reC4hwogICA9PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLnJlcGFpcnMgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsgcmV0dXJuIGNhbGxBcGkoJ3JlcGFpci5tYXRyaXgnLCB7IHllYXI6IFMueWVhciB9KTsgfSwKICByZW5k',
  'ZXI6IGZ1bmN0aW9uKGQpewogICAgdmFyIHllYXJMYWJlbCA9IFMueWVhciA9PT0gJ2FsbCcgPyAn4LiX4Li44LiB4Lib4Li1JyA6ICfguJvguLUgJyArIFMueWVhcjsKICAgIHZhciBoZWFkID0gJzxkaXYgY2xhc3M9ImdyaWQgZzQgbWIxMiI+JyArCiAgICAgIGtw',
  'aSgn4LiH4Liy4LiZ4LiL4LmI4Lit4LihICcgKyB5ZWFyTGFiZWwsIGQudG90YWxKb2JzICsgJyDguIfguLLguJknLCAn4LiI4Liy4LiBICcgKyBkLnJvb21zLmZpbHRlcihmdW5jdGlvbihyKXtyZXR1cm4gci5jb3VudD4wO30pLmxlbmd0aCArICcg4Lir4LmJ4Lit',
  '4LiHJywgJ2FjY2VudCcpICsKICAgICAga3BpKCfguIfguLLguJnguJfguLXguYjguKLguLHguIfguYTguKHguYjguYDguKrguKPguYfguIgnLCBkLm9wZW5Kb2JzICsgJyDguIfguLLguJknLCBkLm9wZW5UYXNrcyA/ICfguITguYnguLLguIfguK3guKLguLnguYgg',
  'JyArIGQub3BlblRhc2tzICsgJyDguIjguLjguJQnIDogJycsIGQub3BlbkpvYnMgPyAnd2FybicgOiAnZ29vZCcpICsKICAgICAga3BpKCfguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguKPguKfguKEnLCBiYWh0KGQudG90YWxDb3N0KSwgeWVhckxhYmVs',
  'KSArCiAgICAgIGtwaSgn4Lir4LmJ4Lit4LiH4LiX4Li14LmI4Lii4Lix4LiH4LmE4Lih4LmI4LmA4LiE4Lii4LiL4LmI4Lit4LihJywgZC5yb29tcy5maWx0ZXIoZnVuY3Rpb24ocil7cmV0dXJuIHIuY291bnQ9PT0wO30pLmxlbmd0aCArICcg4Lir4LmJ4Lit4LiH',
  'JywgJ+C5g+C4mScgKyB5ZWFyTGFiZWwpICsKICAgICc8L2Rpdj4nOwoKICAgIHZhciBhY3Rpb25zID0gJzxkaXYgY2xhc3M9InJvdyBtYjEyIj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImZvcm1SZXBhaXIobnVsbCkiPisg4LmB',
  '4LiI4LmJ4LiH4LiL4LmI4Lit4LihIC8g4Lia4Lix4LiZ4LiX4Li24LiB4LiH4Liy4LiZ4LiL4LmI4Lit4LihPC9idXR0b24+JyArCiAgICAgICc8c3BhbiBjbGFzcz0ic3AiPjwvc3Bhbj48c3BhbiBjbGFzcz0iZnMxMiBtdXRlZCI+4LiE4Lil4Li04LiB4LiX4Li1',
  '4LmI4Lir4LmJ4Lit4LiH4LmA4Lie4Li34LmI4Lit4LiU4Li54Lib4Lij4Liw4Lin4Lix4LiV4Li04LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiC4Lit4LiH4Lir4LmJ4Lit4LiH4LiZ4Lix4LmJ4LiZPC9zcGFuPjwvZGl2Pic7CgogICAgdmFyIGdyaWQgPSBjYXJkKCfw',
  'n5SnIOC4oOC4suC4nuC4o+C4p+C4oeC4h+C4suC4meC4i+C5iOC4reC4oeC4o+C4suC4ouC4q+C5ieC4reC4hyDCtyAnICsgeWVhckxhYmVsLCByb29tRmxvb3JzKGQucm9vbXMsIGZ1bmN0aW9uKHIpewogICAgICB2YXIgY2xzID0gci5vcGVuQ291bnQgPiAwID8g',
  'J3MtZGdyJyA6IChyLmNvdW50ID4gMCA/ICdzLW9rJyA6ICdzLWluZm8nKTsKICAgICAgdmFyIHN1YiA9IHIuY291bnQgPiAwCiAgICAgICAgPyAnPGI+JyArIHIuY291bnQgKyAnIOC4h+C4suC4mTwvYj4nICsgKHIub3BlbkNvdW50ID8gJyDCtyDguITguYnguLLg',
  'uIcgJyArIChyLm9wZW5UYXNrcyB8fCByLm9wZW5Db3VudCkgKyAnIOC4iOC4uOC4lCcgOiAnJykgKyAnPGJyPicgKyAoci5sYXN0ID8gdGhEYXRlU2hvcnQoci5sYXN0KSA6ICcnKQogICAgICAgIDogJ+C5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4i+C5iOC4reC4',
  'oSc7CiAgICAgIHJldHVybiB7IGNsczogY2xzLCBzdWI6IHN1Yiwgb25jbGljazogJ29wZW5SZXBhaXJSb29tKCcgKyBqc3Eoci5yb29tKSArICcpJyB9OwogICAgfSkpOwoKICAgIHZhciByb3dzID0gW107CiAgICBkLnJvb21zLmZvckVhY2goZnVuY3Rpb24ocil7',
  'IHIucmVjb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uKHgpeyByb3dzLnB1c2goeCk7IH0pOyB9KTsKICAgIHJvd3Muc29ydChmdW5jdGlvbihhLGIpeyByZXR1cm4gU3RyaW5nKGIucmVwYWlyRGF0ZXx8Yi5ib29rRGF0ZXx8JycpLmxvY2FsZUNvbXBhcmUoU3RyaW5nKGEu',
  'cmVwYWlyRGF0ZXx8YS5ib29rRGF0ZXx8JycpKTsgfSk7CgogICAgdmFyIGxpc3QgPSBjYXJkKCfwn5OLIOC4o+C4suC4ouC4geC4suC4o+C4h+C4suC4meC4i+C5iOC4reC4oSDCtyAnICsgeWVhckxhYmVsICsgJyAoJyArIHJvd3MubGVuZ3RoICsgJyknLAogICAg',
  'ICByb3dzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOjEwMjBweCI+PHRoZWFkPjx0cj4nICsKICAgICAgICAnPHRoPuC4q+C5ieC4reC4hzwvdGg+PHRoPuC4p+C4seC4meC4meC4seC4lOC4i+C5iOC4',
  'reC4oTwvdGg+PHRoPuC4p+C4seC4meC5gOC4guC5ieC4suC4i+C5iOC4reC4oTwvdGg+PHRoPuC4m+C4o+C4sOC5gOC4oOC4lzwvdGg+PHRoPuC4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4i+C5iOC4reC4oeC5geC4i+C4oTwvdGg+JyArCiAgICAgICAgJzx0',
  'aD7guKrguJbguLLguJnguLA8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguYjguLLguYPguIrguYnguIjguYjguLLguKI8L3RoPjx0aD7guIHguYjguK3guJk8L3RoPjx0aD7guKvguKXguLHguIc8L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAg',
  'ICAgICAgcm93cy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgICAgICByZXR1cm4gJzx0cj4nICsKICAgICAgICAgICAgJzx0ZD48Yj4nICsgZXNjKHgucm9vbSkgKyAnPC9iPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhE',
  'YXRlKHguYm9va0RhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHgucmVwYWlyRGF0ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyh4LmNhdGVnb3J5',
  'IHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIHN0eWxlPSJtaW4td2lkdGg6MjgwcHgiPicgKyB0b2RvTGlzdEh0bWwoeCkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgc3RhdHVzQmFkZ2UoeC5zdGF0dXMpICsgKHgucHJpb3Jp',
  'dHkgJiYgeC5wcmlvcml0eSAhPT0gJ+C4m+C4geC4leC4tCcgPyAnICcgKyBzdGF0dXNCYWRnZSh4LnByaW9yaXR5KSA6ICcnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyBudW0oeC5jb3N0KSArICc8L3RkPicgKwogICAgICAg',
  'ICAgICAnPHRkPicgKyB0aHVtYnNIdG1sKHguYmVmb3JlUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCh4LmFmdGVyUmVmcykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48ZGl2IGNsYXNzPSJ0LWFjdGlvbnMiPicg',
  'KwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiIgb25jbGljaz1cJ2Zvcm1SZXBhaXIoJyArIGF0dHIoeCkgKyAnKVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiBkZ3Ii',
  'IG9uY2xpY2s9ImRlbFJlcGFpcignICsganNxKHguaWQpICsgJykiPvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICAgJzwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nCiAgICAgIDogZW1wdHlC',
  'b3goJ+C4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4i+C5iOC4reC4oeC5g+C4mScgKyB5ZWFyTGFiZWwsICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtUmVwYWlyKG51bGwpIj4rIOC5geC4iOC5ieC4h+C4i+C5iOC4reC4oTwv',
  'YnV0dG9uPicpLCAnJywgdHJ1ZSk7CgogICAgcmV0dXJuIGhlYWQgKyBhY3Rpb25zICsgZ3JpZCArICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgbGlzdCArICc8L2Rpdj4nOwogIH0KfTsKCi8qKgogKiDguYDguIrguYfguITguKXguLTguKrguJXguYzguJfguLXguYjg',
  'uJXguLTguYrguIHguYTguJTguYnguIjguKPguLTguIfguIjguLLguIHguKvguJnguYnguLLguKPguLLguKLguIHguLLguKMg4LmE4Lih4LmI4LiV4LmJ4Lit4LiH4LmA4Lib4Li04LiU4Lif4Lit4Lij4LmM4LihCiAqIOC4leC4tOC5iuC4geC4m+C4uOC5iuC4muC4',
  'muC4seC4meC4l+C4tuC4geC4guC4tuC5ieC4meC4iuC4teC4leC4l+C4seC4meC4l+C4tSDguYHguKXguLDguJbguYnguLLguJXguLTguYrguIHguITguKPguJrguJfguLjguIHguILguYnguK0g4Liq4LiW4Liy4LiZ4Liw4LiI4Liw4LmA4Lib4Lil4Li14LmI4Lii',
  '4LiZ4LmA4Lib4LmH4LiZICLguYDguKrguKPguYfguIjguKrguLTguYnguJkiIOC5g+C4q+C5ieC5gOC4reC4hwogKi8KZnVuY3Rpb24gdG9kb0xpc3RIdG1sKHgpewogIHZhciB0b2RvID0geC50b2RvIHx8IFtdOwogIGlmICghdG9kby5sZW5ndGgpIHJldHVybiAn',
  'PHNwYW4gY2xhc3M9ImZzMTMgbXV0ZWQiPicgKyBlc2MoeC5pdGVtcyB8fCAn4oCTJykgKyAnPC9zcGFuPic7CgogIHZhciBwID0geC5wcm9ncmVzcyB8fCB7IGRvbmU6IDAsIHRvdGFsOiB0b2RvLmxlbmd0aCwgcGVyY2VudDogMCB9OwogIHZhciBsb2NrZWQgPSAh',
  'Y2FuRWRpdCgpOwoKICByZXR1cm4gJzxkaXYgY2xhc3M9InRvZG8tdmlldyI+JyArCiAgICAnPGRpdiBjbGFzcz0idG9kby1iYXIiPjxpIHN0eWxlPSJ3aWR0aDonICsgcC5wZXJjZW50ICsgJyUiPjwvaT48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJ0b2RvLW1l',
  'dGEiPuC5gOC4quC4o+C5h+C4iOC5geC4peC5ieC4pyA8Yj4nICsgcC5kb25lICsgJy8nICsgcC50b3RhbCArICc8L2I+IOC4h+C4suC4mTwvZGl2PicgKwogICAgdG9kby5tYXAoZnVuY3Rpb24odCwgaSl7CiAgICAgIHJldHVybiAnPGxhYmVsIGNsYXNzPSJ0b2Rv',
  'LWxpbmUnICsgKHQuZG9uZSA/ICcgZG9uZScgOiAnJykgKyAobG9ja2VkID8gJyBsb2NrZWQnIDogJycpICsgJyI+JyArCiAgICAgICAgJzxpbnB1dCB0eXBlPSJjaGVja2JveCInICsgKHQuZG9uZSA/ICcgY2hlY2tlZCcgOiAnJykgKyAobG9ja2VkID8gJyBkaXNh',
  'YmxlZCcgOiAnJykgKwogICAgICAgICAgJyBvbmNoYW5nZT0idG9nZ2xlVG9kbygnICsganNxKHguaWQpICsgJywnICsgaSArICcsdGhpcy5jaGVja2VkLHRoaXMpIj4nICsKICAgICAgICAnPHNwYW4gY2xhc3M9Im5tIj4nICsgZXNjKHQubmFtZSkgKyAnPC9zcGFu',
  'PicgKwogICAgICAgICh0LmNhdGVnb3J5ID8gJzxzcGFuIGNsYXNzPSJiIG11dGUgY2F0Ij4nICsgZXNjKHQuY2F0ZWdvcnkpICsgJzwvc3Bhbj4nIDogJycpICsKICAgICAgJzwvbGFiZWw+JzsKICAgIH0pLmpvaW4oJycpICsKICAnPC9kaXY+JzsKfQoKLyoqCiAq',
  'IOC4leC4tOC5iuC4geC4h+C4suC4meC4q+C4meC4tuC5iOC4h+C4guC5ieC4rSDigJQg4Lit4Lix4Lib4LmA4LiU4LiV4Lir4LiZ4LmJ4Liy4LiI4Lit4LiX4Lix4LiZ4LiX4Li14LmB4Lil4LmJ4Lin4LiE4LmI4Lit4Lii4Lia4Lix4LiZ4LiX4Li24LiBCiAqIOC4',
  'luC5ieC4suC4muC4seC4meC4l+C4tuC4geC5hOC4oeC5iOC4nOC5iOC4suC4mSDguYPguKvguYnguJXguLTguYrguIHguIHguKXguLHguJrguYTguJvguYDguJvguYfguJnguYDguKvguKHguLfguK3guJnguYDguJTguLTguKEg4LiI4Liw4LmE4LiU4LmJ4LmE4Lih',
  '4LmI4LmA4LiC4LmJ4Liy4LmD4LiI4Lic4Li04LiU4Lin4LmI4Liy4Lia4Lix4LiZ4LiX4Li24LiB4LmB4Lil4LmJ4LinCiAqLwpmdW5jdGlvbiB0b2dnbGVUb2RvKGlkLCBpbmRleCwgZG9uZSwgYm94KXsKICB2YXIgbGluZSA9IGJveC5jbG9zZXN0KCcudG9kby1s',
  'aW5lJyk7CiAgaWYgKGxpbmUpIGxpbmUuY2xhc3NMaXN0LnRvZ2dsZSgnZG9uZScsIGRvbmUpOwogIGJveC5kaXNhYmxlZCA9IHRydWU7CgogIGNhbGxBcGkoJ3JlcGFpci50b2dnbGUnLCB7IGlkOiBpZCwgaW5kZXg6IGluZGV4LCBkb25lOiBkb25lIH0pLnRoZW4o',
  'ZnVuY3Rpb24oKXsKICAgIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgICAgICAgIC8vIOC4hOC4p+C4suC4oeC4hOC4t+C4muC4q+C4meC5ieC4suC4geC4seC4muC4quC4luC4suC4meC4sOC4reC4suC4iOC5gOC4m+C4peC4teC5iOC4ouC4mSDguIvguLTguIfguIHg',
  'uYzguYDguIfguLXguKLguJog4LmGCiAgICByZWZyZXNoQWxlcnRzKCk7ICAgICAgICAgICAgICAvLyDguIfguLLguJnguITguYnguLLguIfguK3guLLguIjguKXguJTguKXguIcg4LiV4Lix4Lin4LmA4Lil4LiC4Lia4LiZ4LmA4Lih4LiZ4Li54LiV4LmJ4Lit4LiH',
  '4LiV4Liy4Lih4LiU4LmJ4Lin4LiiCiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICBib3guY2hlY2tlZCA9ICFkb25lOwogICAgaWYgKGxpbmUpIGxpbmUuY2xhc3NMaXN0LnRvZ2dsZSgnZG9uZScsICFkb25lKTsKICAgIGJveC5kaXNhYmxlZCA9IGZhbHNlOwog',
  'ICAgdG9hc3QoZS5tZXNzYWdlIHx8IGUsICdlcnInKTsKICB9KTsKfQoKZnVuY3Rpb24gb3BlblJlcGFpclJvb20ocm9vbSl7CiAgdmFyIGQgPSBTLmNhY2hlLnJlcGFpcnM7CiAgdmFyIHIgPSBkLnJvb21zLmZpbHRlcihmdW5jdGlvbih4KXsgcmV0dXJuIHgucm9v',
  'bSA9PT0gcm9vbTsgfSlbMF07CiAgdmFyIGJvZHkgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnMyBtYjEyIj4nICsKICAgICAga3BpKCfguIfguLLguJnguJfguLHguYnguIfguKvguKHguJQnLCByLmNvdW50ICsgJyDguIfguLLguJknLCAnJykgKwogICAgICBrcGkoJ+C4',
  'ouC4seC4h+C5hOC4oeC5iOC5gOC4quC4o+C5h+C4iCcsIHIub3BlbkNvdW50ICsgJyDguIfguLLguJknLCByLm9wZW5UYXNrcyA/ICfguITguYnguLLguIfguK3guKLguLnguYggJyArIHIub3BlblRhc2tzICsgJyDguIjguLjguJQnIDogJycsIHIub3BlbkNvdW50',
  'ID8gJ3dhcm4nOidnb29kJykgKwogICAgICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oicsIGJhaHQoci5jb3N0KSwgJycpICsKICAgICc8L2Rpdj4nICsKICAgIChyLnJlY29yZHMubGVuZ3RoID8gJzxkaXYgY2xhc3M9InRsIj4nICsgci5yZWNv',
  'cmRzLm1hcChmdW5jdGlvbih4KXsKICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJ0bC1pIj48ZGl2IGNsYXNzPSJkIj4nICsgdGhEYXRlKHgucmVwYWlyRGF0ZSB8fCB4LmJvb2tEYXRlKSArICcgwrcgJyArIGVzYyh4LmNhdGVnb3J5fHwnJykgKyAnICcgKyBzdGF0',
  'dXNCYWRnZSh4LnN0YXR1cykgKyAnPC9kaXY+JyArCiAgICAgICAgJzxkaXYgY2xhc3M9InQiPicgKyB0b2RvTGlzdEh0bWwoeCkgKyAnPC9kaXY+JyArCiAgICAgICAgKHgudGVjaG5pY2lhbiA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIj7guIrguYjguLLguIc6',
  'ICcgKyBlc2MoeC50ZWNobmljaWFuKSArICc8L2Rpdj4nIDogJycpICsKICAgICAgICAoeC5jb3N0ID8gJzxkaXYgY2xhc3M9ImZzMTIgbXV0ZWQiPuC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4oiAnICsgYmFodCh4LmNvc3QpICsgJzwvZGl2PicgOiAnJykg',
  'KwogICAgICAgICc8ZGl2IGNsYXNzPSJtdDgiPicgKyB0aHVtYnNIdG1sKCh4LmJlZm9yZVJlZnN8fFtdKS5jb25jYXQoeC5hZnRlclJlZnN8fFtdKSkgKyAnPC9kaXY+JyArCiAgICAgICAgJzxkaXYgY2xhc3M9Im10OCI+PGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBv',
  'bmNsaWNrPVwnY2xvc2VNb2RhbCgpO2Zvcm1SZXBhaXIoJyArIGF0dHIoeCkgKyAnKVwnPuC5geC4geC5ieC5hOC4gjwvYnV0dG9uPjwvZGl2PicgKwogICAgICAnPC9kaXY+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicgOiAnPGRpdiBjbGFzcz0iZW1wdHki',
  'PuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4h+C4suC4meC4i+C5iOC4reC4oeC5g+C4meC4m+C4teC4l+C4teC5iOC5gOC4peC4t+C4reC4gTwvZGl2PicpOwoKICBvcGVuTW9kYWwoJ/CflKcg4LiH4Liy4LiZ4LiL4LmI4Lit4LihIMK3IOC4q+C5ieC4reC4hyAn',
  'ICsgcm9vbSwgYm9keSwKICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+4Lib4Li04LiUPC9idXR0b24+JyArCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iY2xvc2VNb2RhbCgpO2Zvcm1SZXBhaXIoe3Jv',
  'b206JyArIGpzcShyb29tKSArICd9KSI+KyDguYDguJ7guLTguYjguKHguIfguLLguJnguIvguYjguK3guKE8L2J1dHRvbj4nLCB0cnVlKTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAg',
  'IDYpIOC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLmJ1aWxkaW5nID0gewogIGxvYWQ6IGZ1',
  'bmN0aW9uKCl7CiAgICByZXR1cm4gUHJvbWlzZS5hbGwoWwogICAgICBjYWxsQXBpKCdidWlsZGluZy5zdW1tYXJ5JywgeyB5ZWFyOiBTLnllYXIgfSksCiAgICAgIGNhbGxBcGkoJ2J1aWxkaW5nLmxpc3QnLCB7IHllYXI6IFMueWVhciwgem9uZTogUy5wYXJhbXMu',
  'em9uZSB8fCAnJywgc3RhdHVzOiAnJyB9KQogICAgXSkudGhlbihmdW5jdGlvbihyKXsgdmFyIGQgPSByWzBdOyBkLml0ZW1zID0gclsxXTsgcmV0dXJuIGQ7IH0pOwogIH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciB5ZWFyTGFiZWwgPSBTLnllYXIg',
  'PT09ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICBrcGkoJ+C4h+C4suC4meC4m+C4tSAnICsgKFMueWVhcj09PSdhbGwnPyfguJfg',
  'uLHguYnguIfguKvguKHguJQnOlMueWVhciksIGQueWVhckNvdW50ICsgJyDguIfguLLguJknLCAn4Liq4Liw4Liq4LihICcgKyBkLnRvdGFsICsgJyDguIfguLLguJknLCAnYWNjZW50JykgKwogICAgICBrcGkoJ+C4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4',
  'oiAnICsgeWVhckxhYmVsLCBiYWh0KGQueWVhckNvc3QpLCAn4Liq4Liw4Liq4LihICcgKyBiYWh0KGQuZ3JhbmRDb3N0KSkgKwogICAgICBrcGkoJ+C4h+C4suC4meC4l+C4teC5iOC4ouC4seC4h+C5hOC4oeC5iOC5gOC4quC4o+C5h+C4iCcsIGQub3BlbkNvdW50',
  'ICsgJyDguIfguLLguJknLCAnJywgZC5vcGVuQ291bnQgPyAnd2FybicgOiAnZ29vZCcpICsKICAgICAga3BpKCfguITguKPguJrguIHguLPguKvguJnguJTguYPguJkgOTAg4Lin4Lix4LiZJywgZC51cGNvbWluZy5sZW5ndGggKyAnIOC4h+C4suC4mScsIGQudXBj',
  'b21pbmcubGVuZ3RoID8gZC51cGNvbWluZ1swXS50aXRsZSA6ICcnLCBkLnVwY29taW5nLmxlbmd0aCA/ICd3YXJuJyA6ICcnKSArCiAgICAnPC9kaXY+JzsKCiAgICB2YXIgem9uZXMgPSAnPGRpdiBjbGFzcz0iY2hpcHMgbWIxMiI+JyArCiAgICAgICc8YnV0dG9u',
  'IGNsYXNzPSJjaGlwICcgKyAoIVMucGFyYW1zLnpvbmU/J29uJzonJykgKyAnIiBvbmNsaWNrPSJzZXRQYXJhbShcJ3pvbmVcJyxcJ1wnKSI+4LiX4Li44LiB4Liq4LmI4Lin4LiZPC9idXR0b24+JyArCiAgICAgIGQuYnlab25lLm1hcChmdW5jdGlvbih6KXsKICAg',
  'ICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9ImNoaXAgJyArIChTLnBhcmFtcy56b25lPT09ei56b25lPydvbic6JycpICsgJyIgb25jbGljaz0ic2V0UGFyYW0oXCd6b25lXCcsJyArIGpzcSh6LnpvbmUpICsgJykiPicgKwogICAgICAgICAgICAgICBlc2Moei56',
  'b25lKSArICcgKCcgKyB6LmNvdW50ICsgJyk8L2J1dHRvbj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nOwoKICAgIHZhciBjaGFydHMgPSAnPGRpdiBjbGFzcz0iZ3JpZCBnMiBtYjEyIj4nICsKICAgICAgY2FyZCgn8J+Pl++4jyDguITguYjguLLguYPg',
  'uIrguYnguIjguYjguLLguKLguYHguKLguIHguJXguLLguKHguKrguYjguKfguJnguILguK3guIfguK3guLLguITguLLguKMnLCBiYXJDaGFydChkLmJ5Wm9uZSwgJ3pvbmUnLCAnY29zdCcsIGZ1bmN0aW9uKGkpeyByZXR1cm4gbW9uZXkoaS5jb3N0KSArICcg4Li/',
  'JzsgfSkpICsKICAgICAgY2FyZCgn8J+ThSDguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguYHguKLguIHguJXguLLguKHguJvguLUnLCBiYXJDaGFydCgKICAgICAgICBkLmJ5WWVhci5tYXAoZnVuY3Rpb24oeSl7IHJldHVybiB7IGxhYmVsOifguJvguLUg',
  'JyArIHkueWVhciArICcgKCcgKyB5LmNvdW50ICsgJyDguIfguLLguJkpJywgY29zdDp5LmNvc3QgfTsgfSksCiAgICAgICAgJ2xhYmVsJywgJ2Nvc3QnLCBmdW5jdGlvbihpKXsgcmV0dXJuIG1vbmV5KGkuY29zdCkgKyAnIOC4vyc7IH0pKSArCiAgICAnPC9kaXY+',
  'JzsKCiAgICB2YXIgcm93cyA9IGQuaXRlbXM7CiAgICB2YXIgbGlzdCA9IGNhcmQoJ/Cfj6Ig4Lij4Liy4Lii4LiB4Liy4Lij4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmC4LiU4Lii4Lij4Lin4LihIMK3ICcgKyB5ZWFyTGFiZWwgKyAnICgnICsgcm93',
  'cy5sZW5ndGggKyAnKScsCiAgICAgIHJvd3MubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiIHN0eWxlPSJtaW4td2lkdGg6MTAyMHB4Ij48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4Liq4LmI4Lin4LiZ4LiC4Lit4LiH4Lit4Liy',
  '4LiE4Liy4LijPC90aD48dGg+4Lij4Liy4Lii4LiB4Liy4LijPC90aD48dGg+4LiZ4Lix4LiUPC90aD48dGg+4LmA4Lij4Li04LmI4LihPC90aD48dGg+4LmA4Liq4Lij4LmH4LiIPC90aD48dGg+4Liq4LiW4Liy4LiZ4LiwPC90aD4nICsKICAgICAgICAnPHRoPuC4',
  'nOC4ueC5ieC4o+C4seC4muC5gOC4q+C4oeC4sjwvdGg+PHRoIGNsYXNzPSJudW0iPuC4hOC5iOC4suC5g+C4iuC5ieC4iOC5iOC4suC4ojwvdGg+PHRoPuC4o+C4reC4muC4luC4seC4lOC5hOC4mzwvdGg+PHRoPuC4oOC4suC4njwvdGg+PHRoPjwvdGg+PC90cj48',
  'L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICByb3dzLm1hcChmdW5jdGlvbih4KXsKICAgICAgICAgIHJldHVybiAnPHRyPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj48Yj4nICsgZXNjKHguem9uZSB8fCAn4oCTJykgKyAnPC9iPjwvdGQ+JyArCiAg',
  'ICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTMiPjxkaXYgY2xhc3M9ImNsaXAiPicgKyBlc2MoeC50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICAgKHgubm90ZSA/ICc8ZGl2IGNsYXNzPSJmczEyIGZhaW50IGNsaXAiPicgKyBlc2MoeC5ub3RlKSArICc8',
  'L2Rpdj4nIDogJycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHguYm9va0RhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHguc3Rh',
  'cnREYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJub3dyYXAgZnMxMiI+JyArIHRoRGF0ZSh4LmVuZERhdGUpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQ+JyArIHN0YXR1c0JhZGdlKHguc3RhdHVzKSArICc8L3RkPicgKwogICAg',
  'ICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKHguY29udHJhY3RvciB8fCAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgbnVtKHguY29zdCkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0i',
  'bm93cmFwIGZzMTIiPicgKyAoeC5uZXh0RHVlID8gdGhEYXRlU2hvcnQoeC5uZXh0RHVlKSArCiAgICAgICAgICAgICAgICAoeC5kdWVJbkRheXMgIT0gbnVsbCA/ICc8ZGl2IGNsYXNzPSJmYWludCIgc3R5bGU9ImZvbnQtc2l6ZToxMXB4Ij4nICsgKHguZHVlSW5E',
  'YXlzPDAgPyAn4LmA4Lil4LiiICcgKyAoLXguZHVlSW5EYXlzKSArICcg4Lin4Lix4LiZJyA6ICfguK3guLXguIEgJyArIHguZHVlSW5EYXlzICsgJyDguKfguLHguJknKSArICc8L2Rpdj4nIDogJycpCiAgICAgICAgICAgICAgOiAn4oCTJykgKyAnPC90ZD4nICsK',
  'ICAgICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCgoeC5waG90b1JlZnN8fFtdKS5jb25jYXQoeC5zbGlwUmVmc3x8W10pKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkPjxkaXYgY2xhc3M9InQtYWN0aW9ucyI+JyArCiAgICAgICAgICAgICAgJzxidXR0',
  'b24gY2xhc3M9ImJ0biBzbSBpY29uIiBvbmNsaWNrPVwnZm9ybUJ1aWxkaW5nKCcgKyBhdHRyKHgpICsgJylcJz7inI/vuI88L2J1dHRvbj4nICsKICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIGljb24gZGdyIiBvbmNsaWNrPSJkZWxCdWlsZGlu',
  'ZygnICsganNxKHguaWQpICsgJykiPvCfl5E8L2J1dHRvbj4nICsKICAgICAgICAgICAgJzwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nCiAgICAgIDogZW1wdHlCb3goJ+C4ouC4seC4h+C5hOC4',
  'oeC5iOC4oeC4teC4h+C4suC4meC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5g+C4mScgKyB5ZWFyTGFiZWwsICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJmb3JtQnVpbGRpbmcobnVsbCkiPisg4LmA4Lie4Li04LmI4Lih4LiH4Liy4LiZ',
  '4LiL4LmI4Lit4Lih4LiV4Li24LiBPC9idXR0b24+JyksCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIHNtIiBvbmNsaWNrPSJmb3JtQnVpbGRpbmcobnVsbCkiPisg4LmA4Lie4Li04LmI4Lih4LiH4Liy4LiZ4LiL4LmI4Lit4Lih4LiV4Li24LiBPC9idXR0',
  'b24+JywgdHJ1ZSk7CgogICAgcmV0dXJuIGhlYWQgKyB6b25lcyArIGNoYXJ0cyArIGxpc3Q7CiAgfQp9OwoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDcpIOC4q+C5ieC4reC4h+C4nuC4',
  'seC4gQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLnJvb21zID0gewogIGxvYWQ6IGZ1bmN0aW9uKCl7IHJldHVybiBjYWxsQXBpKCdyb29tLmxpc3QnKS50aGVuKGZ1bmN0aW9u',
  'KGZsb29ycyl7IHJldHVybiB7IGZsb29yczogZmxvb3JzLCB5ZWFyczogW10gfTsgfSk7IH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciBmbGF0ID0gW107CiAgICBkLmZsb29ycy5mb3JFYWNoKGZ1bmN0aW9uKGYpeyBmLnJvb21zLmZvckVhY2goZnVu',
  'Y3Rpb24ocil7IGZsYXQucHVzaChyKTsgfSk7IH0pOwogICAgdmFyIG9jYyA9IGZsYXQuZmlsdGVyKGZ1bmN0aW9uKHIpeyByZXR1cm4gci5zdGF0dXMgPT09ICfguKHguLXguJzguLnguYnguYDguIrguYjguLInOyB9KS5sZW5ndGg7CgogICAgdmFyIGhlYWQgPSAn',
  'PGRpdiBjbGFzcz0iZ3JpZCBnNCBtYjEyIj4nICsKICAgICAga3BpKCfguKvguYnguK3guIfguJfguLHguYnguIfguKvguKHguJQnLCBmbGF0Lmxlbmd0aCArICcg4Lir4LmJ4Lit4LiHJywgJzUg4LiK4Lix4LmJ4LiZJywgJ2FjY2VudCcpICsKICAgICAga3BpKCfg',
  'uKHguLXguJzguLnguYnguYDguIrguYjguLInLCBvY2MgKyAnIOC4q+C5ieC4reC4hycsIHBjdChmbGF0Lmxlbmd0aCA/IG9jYy9mbGF0Lmxlbmd0aCoxMDAgOiAwKSArICcg4Lit4Lix4LiV4Lij4Liy4LmA4LiC4LmJ4Liy4Lie4Lix4LiBJywgJ2dvb2QnKSArCiAg',
  'ICAgIGtwaSgn4Lir4LmJ4Lit4LiH4Lin4LmI4Liy4LiHJywgZmxhdC5maWx0ZXIoZnVuY3Rpb24ocil7IHJldHVybiByLnN0YXR1cyA9PT0gJ+C4p+C5iOC4suC4hyc7IH0pLmxlbmd0aCArICcg4Lir4LmJ4Lit4LiHJywgJycsICd3YXJuJykgKwogICAgICBrcGko',
  'J+C4hOC5iOC4suC5gOC4iuC5iOC4suC4o+C4p+C4oS/guYDguJTguLfguK3guJknLCBiYWh0KGZsYXQucmVkdWNlKGZ1bmN0aW9uKGEscil7IHJldHVybiBhICsgKE51bWJlcihyLnJlbnQpfHwwKTsgfSwgMCkpLCAn4LiI4Liy4LiB4Lir4LmJ4Lit4LiH4LiX4Li1',
  '4LmI4LiB4Lij4Lit4LiB4LiE4LmI4Liy4LmA4LiK4LmI4Liy4LmE4Lin4LmJJykgKwogICAgJzwvZGl2Pic7CgogICAgdmFyIGdyaWQgPSBjYXJkKCfwn5qqIOC4nOC4seC4h+C4q+C5ieC4reC4h+C4nuC4seC4gScsIHJvb21GbG9vcnMoZmxhdCwgZnVuY3Rpb24o',
  'cil7CiAgICAgIHZhciBjbHMgPSByLnN0YXR1cyA9PT0gJ+C4oeC4teC4nOC4ueC5ieC5gOC4iuC5iOC4sicgPyAncy1vaycgOiAoci5zdGF0dXMgPT09ICfguKfguYjguLLguIcnID8gJ3MtaW5mbycgOiAncy13YXJuJyk7CiAgICAgIHJldHVybiB7IGNsczogY2xz',
  'LCBzdWI6IGVzYyhyLnRlbmFudCB8fCByLnN0YXR1cyB8fCAnJykgKyAoci5yZW50ID8gJzxicj4nICsgbW9uZXkoci5yZW50KSArICcg4Li/JyA6ICcnKSwKICAgICAgICAgICAgICAgb25jbGljazogJ29wZW5Sb29tKCcgKyBqc3Eoci5yb29tKSArICcpJyB9Owog',
  'ICAgfSksICc8c3BhbiBjbGFzcz0iZnMxMiBtdXRlZCI+4LiE4Lil4Li04LiB4LiX4Li14LmI4Lir4LmJ4Lit4LiH4LmA4Lie4Li34LmI4Lit4LiU4Li54Lib4Lij4Liw4Lin4Lix4LiV4Li04LiX4Lix4LmJ4LiH4Lir4Lih4LiU4LiC4Lit4LiH4Lir4LmJ4Lit4LiH',
  '4LiZ4Lix4LmJ4LiZPC9zcGFuPicpOwoKICAgIHJldHVybiBoZWFkICsgZ3JpZDsKICB9Cn07CgpmdW5jdGlvbiBvcGVuUm9vbShyb29tKXsKICBvcGVuTW9kYWwoJ/Cfmqog4Lir4LmJ4Lit4LiHICcgKyByb29tLCAnPGRpdiBjbGFzcz0iZW1wdHkiPjxzcGFuIGNs',
  'YXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C5guC4q+C4peC4lOKApjwvZGl2PicpOwogIGNhbGxBcGkoJ3Jvb20ucHJvZmlsZScsIHsgcm9vbTogcm9vbSB9KS50aGVuKGZ1bmN0aW9uKHApewogICAgdmFyIGkgPSBwLmluZm87CiAgICB2YXIgYm9k',
  'eSA9CiAgICAgICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICAgIGtwaSgn4Liq4LiW4Liy4LiZ4LiwJywgaS5zdGF0dXMgfHwgJ+KAkycsIGVzYyhpLnRlbmFudCB8fCAnJykpICsKICAgICAgICBrcGkoJ+C4peC5ieC4suC4h+C5geC4reC4o+C5',
  'jCcsIHAuYWNDb3VudCArICcg4LiE4Lij4Lix4LmJ4LiHJywgcC5sYXN0QWMgPyAn4Lil4LmI4Liy4Liq4Li44LiUICcgKyB0aERhdGUocC5sYXN0QWMpIDogJ+C5hOC4oeC5iOC4oeC4teC4m+C4o+C4sOC4p+C4seC4leC4tCcpICsKICAgICAgICBrcGkoJ+C4h+C4',
  'suC4meC4i+C5iOC4reC4oScsIHAucmVwYWlyQ291bnQgKyAnIOC4h+C4suC4mScsICfguITguYnguLLguIcgJyArIHAub3BlblJlcGFpcnMsIHAub3BlblJlcGFpcnMgPyAnd2FybicgOiAnJykgKwogICAgICAgIGtwaSgn4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI',
  '4Liy4Lii4Liq4Liw4Liq4LihJywgYmFodChwLnRvdGFsQ29zdCksICfguIvguYjguK3guKEgKyDguKXguYnguLLguIfguYHguK3guKPguYwnKSArCiAgICAgICc8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBtYjEyIj4nICsKICAgICAgICAnPGJ1dHRv',
  'biBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPVwnY2xvc2VNb2RhbCgpO2Zvcm1Sb29tKCcgKyBhdHRyKGkpICsgJylcJz7inI/vuI8g4LmB4LiB4LmJ4LmE4LiC4LiC4LmJ4Lit4Lih4Li54Lil4Lir4LmJ4Lit4LiHPC9idXR0b24+JyArCiAgICAgICAgJzxidXR0b24g',
  'Y2xhc3M9ImJ0biBzbSIgb25jbGljaz0iY2xvc2VNb2RhbCgpO2Zvcm1SZXBhaXIoe3Jvb206JyArIGpzcShyb29tKSArICd9KSI+KyDguYHguIjguYnguIfguIvguYjguK3guKE8L2J1dHRvbj4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNs',
  'aWNrPSJjbG9zZU1vZGFsKCk7Zm9ybUFjKHtyb29tOicgKyBqc3Eocm9vbSkgKyAnfSkiPisg4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMPC9idXR0b24+JyArCiAgICAgICc8L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImNhcmQgbWIxMiI+PGRpdiBjbGFzcz0i',
  'Y2FyZC1oIj48aDM+4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZ4LmD4LiZ4Lir4LmJ4Lit4LiHPC9oMz4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPVwnY2xvc2VNb2RhbCgpO2Zvcm1Bc3NldCh7cm9vbTonICsganNxKHJvb20p',
  'ICsgJ30pXCc+KyDguYDguJ7guLTguYjguKHguJfguKPguLHguJ7guKLguYzguKrguLTguJk8L2J1dHRvbj4nICsKICAgICAgJzwvZGl2PjxkaXYgY2xhc3M9ImNhcmQtYiI+JyArCiAgICAgICAgKHAuYXNzZXRzLmxlbmd0aAogICAgICAgICAgPyAnPGRpdiBjbGFz',
  'cz0idHciPjx0YWJsZSBjbGFzcz0idCIgc3R5bGU9Im1pbi13aWR0aDphdXRvIj48dGhlYWQ+PHRyPicgKwogICAgICAgICAgICAnPHRoPuC4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4mTwvdGg+PHRoPuC4ouC4teC5iOC4q+C5ieC4rS/guKPguLjguYjguJk8L3Ro',
  'Pjx0aD7guJXguLTguJTguJXguLHguYnguIc8L3RoPjx0aD7guJvguKPguLDguIHguLHguJnguJbguLbguIc8L3RoPjx0aD7guKrguJbguLLguJnguLA8L3RoPjx0aD48L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgICAgIHAuYXNzZXRzLm1hcChm',
  'dW5jdGlvbihhKXsKICAgICAgICAgICAgICByZXR1cm4gJzx0cj48dGQ+PGI+JyArIGVzYyhhLm5hbWUpICsgJzwvYj4nICsKICAgICAgICAgICAgICAgICAgICAgICAoYS5zZXJpYWwgPyAnPGJyPjxzcGFuIGNsYXNzPSJmczEyIG11dGVkIj5TL04gJyArIGVzYyhh',
  'LnNlcmlhbCkgKyAnPC9zcGFuPicgOiAnJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIGVzYyhhLmJyYW5kfHwn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMx',
  'MiI+JyArIHRoRGF0ZShhLmluc3RhbGxEYXRlKSArICc8L3RkPicgKwogICAgICAgICAgICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgKGEud2FycmFudHlFbmQgPyB0aERhdGUoYS53YXJyYW50eUVuZCkgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAg',
  'ICAgICAgICAgICAgICAgJzx0ZD4nICsgc3RhdHVzQmFkZ2UoYS5zdGF0dXMpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICAgICAgICAgICc8dGQgY2xhc3M9InQtYWN0aW9ucyI+PGJ1dHRvbiBjbGFzcz0iYnRuIGljb24gc20iIHRpdGxlPSLguYHguIHguYnguYTg',
  'uIIiICcgKwogICAgICAgICAgICAgICAgICAgICAgICdvbmNsaWNrPVwnY2xvc2VNb2RhbCgpO2Zvcm1Bc3NldCgnICsgYXR0cihhKSArICcpXCc+4pyP77iPPC9idXR0b24+PC90ZD48L3RyPic7CiAgICAgICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90',
  'YWJsZT48L2Rpdj4nCiAgICAgICAgICA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4Lii4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJ4Lia4Lix4LiZ4LiX4Li24LiB4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZ4LiC4Lit4LiH4Lir4LmJ4Lit4LiH4LiZ4Li14LmJPC9k',
  'aXY+JykgKwogICAgICAnPC9kaXY+PC9kaXY+JyArCiAgICAgICc8aDMgY2xhc3M9ImZzMTMgbWI4Ij7guJvguKPguLDguKfguLHguJXguLTguJfguLHguYnguIfguKvguKHguJQgKCcgKyBwLnRpbWVsaW5lLmxlbmd0aCArICcpPC9oMz4nICsKICAgICAgKHAudGlt',
  'ZWxpbmUubGVuZ3RoID8gJzxkaXYgY2xhc3M9InRsIj4nICsgcC50aW1lbGluZS5tYXAoZnVuY3Rpb24oZSl7CiAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJ0bC1pIj48ZGl2IGNsYXNzPSJkIj4nICsgdGhEYXRlKGUuZGF0ZSkgKyAnIMK3ICcgKyBlc2MoZS50',
  'eXBlKSArICcgJyArIHN0YXR1c0JhZGdlKGUuc3RhdHVzKSArICc8L2Rpdj4nICsKICAgICAgICAgICc8ZGl2IGNsYXNzPSJ0Ij4nICsgZXNjKGUudGl0bGUpICsgJzwvZGl2PicgKwogICAgICAgICAgKGUudG9kbyAmJiBlLnRvZG8ubGVuZ3RoID8gdG9kb0xpc3RI',
  'dG1sKGUpIDogJycpICsKICAgICAgICAgIChlLmRldGFpbCA/ICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIj4nICsgZXNjKGUuZGV0YWlsKSArICc8L2Rpdj4nIDogJycpICsKICAgICAgICAgIChlLmNvc3QgPyAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCI+JyArIGJh',
  'aHQoZS5jb3N0KSArICc8L2Rpdj4nIDogJycpICsKICAgICAgICAgIChlLnBob3RvcyAmJiBlLnBob3Rvcy5sZW5ndGggPyAnPGRpdiBjbGFzcz0ibXQ4Ij4nICsgdGh1bWJzSHRtbChlLnBob3RvcykgKyAnPC9kaXY+JyA6ICcnKSArCiAgICAgICAgJzwvZGl2Pic7',
  'CiAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicgOiAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4m+C4o+C4sOC4p+C4seC4leC4tDwvZGl2PicpOwoKICAgIG9wZW5Nb2RhbCgn8J+aqiDguKvguYnguK3guIcgJyArIHJvb20g',
  'KyAnIMK3IOC4iuC4seC5ieC4mSAnICsgKGkuZmxvb3J8fCcnKSwgYm9keSwKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7guJvguLTguJQ8L2J1dHRvbj4nLCB0cnVlKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9h',
  'c3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7IGNsb3NlTW9kYWwoKTsgfSk7Cn0KCgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgOCkg4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5',
  'iOC4suC4ouC4q+C4rSAo4Lij4Liy4Lii4LmA4LiU4Li34Lit4LiZKQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09CiAgIOC4geC4o+C4suC4nyDigJQg4Lin4Liy4LiU4LmA4Lib4LmH4LiZIFNWRyDguJXguKPguIcg4LmGIOC5hOC4oeC5iOC4nuC4tuC5iOC4h+C5hOC4peC4muC4o+C4suC4o+C4teC4guC5ieC4suC4h+C4meC4reC4gQogICDg',
  'uYDguJ7guKPguLLguLDguKvguJnguYnguLLguYDguKfguYfguJrguILguK3guIcgQXBwcyBTY3JpcHQg4LmC4Lir4Lil4LiU4Liq4LiE4Lij4Li04Lib4LiV4LmM4LiC4LmJ4Liy4Lih4LmC4LiU4LmA4Lih4LiZ4LmE4Lih4LmI4LmE4LiU4LmJCiAgIOC5geC4peC4',
  'sOC4q+C4meC5ieC4suC4leC4seC4p+C4reC4ouC5iOC4suC4h+C4leC5ieC4reC4h+C5gOC4m+C4tOC4lOC5hOC4lOC5ieC5guC4lOC4ouC5hOC4oeC5iOC4leC5ieC4reC4h+C4leC5iOC4reC5gOC4meC5h+C4lQoKICAg4Liq4Li14LiX4Li14LmI4LmD4LiK4LmJ',
  '4LmA4Lib4LmH4LiZ4LiZ4LmJ4Liz4LmA4LiH4Li04LiZL+C4quC5ieC4oSDguYTguKHguYjguYPguIrguYjguYDguILguLXguKLguKcv4LmB4LiU4LiHIOC5gOC4nuC4o+C4suC4sOC4p+C4seC4lOC5geC4peC5ieC4p+C5gOC4guC4teC4ouC4p+C4geC4seC4muC5',
  'geC4lOC4hwogICDguITguJnguJXguLLguJrguK3guJTguKrguLXguYDguILguLXguKLguKct4LmB4LiU4LiH4LmB4Lii4LiB4LmE4Lih4LmI4Lit4Lit4LiBICjOlEUgNC45IOC4leC5iOC4s+C4geC4p+C5iOC4suC5gOC4geC4k+C4keC5jCA2KSDguITguLnguYjg',
  'uJnguLXguYnguYTguJTguYkgMjcuNgogICDguJfguLjguIHguJXguLHguKfguYDguKXguILguJfguLXguYjguIHguKPguLLguJ/guYHguKrguJTguIcg4Lit4LmI4Liy4LiZ4LmE4LiU4LmJ4LiI4Liy4LiB4LiV4Liy4Lij4Liy4LiH4LiC4LmJ4Liy4LiH4Lil4LmI',
  '4Liy4LiH4LmA4Liq4Lih4LitCiAgIOC4geC4peC5iOC4reC4h+C4muC4reC4geC4hOC5iOC4suC4leC4reC4meC4iuC4teC5ieC5gOC4m+C5h+C4meC4guC4reC4h+C5geC4luC4oSDguYTguKHguYjguYPguIrguYjguJfguLLguIfguYDguJTguLXguKLguKfguJfg',
  'uLXguYjguIjguLDguKPguLnguYnguITguYjguLIKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgp2YXIgQ0hBUlRfVyA9IDcyMCwgQ0hBUlRfUEFETCA9IDYyLCBDSEFSVF9QQURSID0gMTQs',
  'IENIQVJUX1BBRFQgPSAxNDsKdmFyIENIQVJUX09OID0gbnVsbDsKCi8qKiDguJvguLHguJTguILguLbguYnguJnguYDguJvguYfguJnguYDguKXguILguIHguKXguKEg4LmGIOC4quC4s+C4q+C4o+C4seC4muC4q+C4seC4p+C5geC4geC4mSBZICovCmZ1bmN0aW9u',
  'IG5pY2VNYXgodil7CiAgaWYgKHYgPD0gMCkgcmV0dXJuIDE7CiAgdmFyIG1hZyA9IE1hdGgucG93KDEwLCBNYXRoLmZsb29yKE1hdGgubG9nKHYpIC8gTWF0aC5MTjEwKSk7CiAgdmFyIG4gPSB2IC8gbWFnOwogIHZhciBzdGVwID0gbiA8PSAxID8gMSA6IG4gPD0g',
  'MiA/IDIgOiBuIDw9IDIuNSA/IDIuNSA6IG4gPD0gNSA/IDUgOiAxMDsKICByZXR1cm4gc3RlcCAqIG1hZzsKfQoKLyoqIOC4ouC5iOC4reC4iOC4s+C4meC4p+C4meC5gOC4h+C4tOC4meC5g+C4q+C5ieC4quC4seC5ieC4meC4nuC4reC4quC4s+C4q+C4o+C4seC4',
  'muC4q+C4seC4p+C5geC4geC4mSDigJQgMS4yIOC4pS4gLyA4NUsgKi8KZnVuY3Rpb24gc2hvcnRCYWh0KHYpewogIHZhciBhID0gTWF0aC5hYnModik7CiAgaWYgKGEgPj0gMTAwMDAwMCkgcmV0dXJuICh2IC8gMTAwMDAwMCkudG9GaXhlZChhID49IDEwMDAwMDAw',
  'ID8gMCA6IDEpLnJlcGxhY2UoL1wuMCQvLCAnJykgKyAnIOC4pS4nOwogIGlmIChhID49IDEwMDApIHJldHVybiBNYXRoLnJvdW5kKHYgLyAxMDAwKSArICdLJzsKICByZXR1cm4gU3RyaW5nKE1hdGgucm91bmQodikpOwp9CgovKiog4LmB4LiX4LmI4LiH4LiX4Li1',
  '4LmI4Lib4Lil4Liy4Lii4LiU4LmJ4Liy4LiZ4LiC4LmJ4Lit4Lih4Li54Lil4Lih4LiZIDRweCDguJTguYnguLLguJnguJDguLLguJnguYDguKvguKXguLXguYjguKLguKEgKi8KZnVuY3Rpb24gYmFyUGF0aCh4LCB5LCB3LCBoLCB1cCl7CiAgdmFyIHIgPSBNYXRo',
  'Lm1pbig0LCB3IC8gMiwgaCk7CiAgaWYgKGggPD0gMC41KSByZXR1cm4gJyc7CiAgcmV0dXJuIHVwCiAgICA/ICdNJyArIHggKyAnLCcgKyAoeSArIGgpICsgJ1YnICsgKHkgKyByKSArICdhJyArIHIgKyAnLCcgKyByICsgJyAwIDAgMSAnICsgciArICcsLScgKyBy',
  'ICsKICAgICAgJ2gnICsgKHcgLSAyICogcikgKyAnYScgKyByICsgJywnICsgciArICcgMCAwIDEgJyArIHIgKyAnLCcgKyByICsgJ1YnICsgKHkgKyBoKSArICdaJwogICAgOiAnTScgKyB4ICsgJywnICsgeSArICdWJyArICh5ICsgaCAtIHIpICsgJ2EnICsgciAr',
  'ICcsJyArIHIgKyAnIDAgMCAwICcgKyByICsgJywnICsgciArCiAgICAgICdoJyArICh3IC0gMiAqIHIpICsgJ2EnICsgciArICcsJyArIHIgKyAnIDAgMCAwICcgKyByICsgJywtJyArIHIgKyAnVicgKyB5ICsgJ1onOwp9CgovKiog4LiC4LmJ4Lit4Lih4Li54Lil',
  '4LiC4Lit4LiH4LiB4Lil4LmI4Lit4LiH4Lia4Lit4LiB4LiE4LmI4LiyIOC5gOC4geC5h+C4muC5gOC4m+C5h+C4mSBKU09OIOC5g+C4mSBhdHRyaWJ1dGUg4LmB4Lil4LmJ4LinIGVzYygpIOC5g+C4q+C5ieC4m+C4peC4reC4lOC4oOC4seC4oiAqLwpmdW5jdGlv',
  'biB0aXBEYXRhKGxhYmVsLCByb3dzKXsKICByZXR1cm4gZXNjKEpTT04uc3RyaW5naWZ5KHsgbDogbGFiZWwsIHI6IHJvd3MgfSkpOwp9CgpmdW5jdGlvbiBoaXRSZWN0KHgsIHksIHcsIGgsIHRpcCl7CiAgcmV0dXJuICc8cmVjdCBjbGFzcz0iaGl0IiB0YWJpbmRl',
  'eD0iMCIgcm9sZT0iYnV0dG9uIiB4PSInICsgeCArICciIHk9IicgKyB5ICsKICAgICAgICAgJyIgd2lkdGg9IicgKyB3ICsgJyIgaGVpZ2h0PSInICsgaCArICciIGRhdGEtdGlwPSInICsgdGlwICsgJyI+PC9yZWN0Pic7Cn0KCmZ1bmN0aW9uIGdyaWRBbmRUaWNr',
  'cyh0b3AsIHBsb3RILCBtYXgsIGxpbmVzKXsKICB2YXIgb3V0ID0gJyc7CiAgZm9yICh2YXIgaSA9IDA7IGkgPD0gbGluZXM7IGkrKykgewogICAgdmFyIHkgPSB0b3AgKyBwbG90SCAtIChwbG90SCAqIGkgLyBsaW5lcyk7CiAgICBvdXQgKz0gJzxsaW5lIGNsYXNz',
  'PSJncmlkLWwiIHgxPSInICsgQ0hBUlRfUEFETCArICciIHkxPSInICsgeSArICciIHgyPSInICsgKENIQVJUX1cgLSBDSEFSVF9QQURSKSArICciIHkyPSInICsgeSArICciPjwvbGluZT4nICsKICAgICAgICAgICAnPHRleHQgY2xhc3M9InRpY2siIHg9IicgKyAo',
  'Q0hBUlRfUEFETCAtIDgpICsgJyIgeT0iJyArICh5ICsgNCkgKyAnIiB0ZXh0LWFuY2hvcj0iZW5kIj4nICsgc2hvcnRCYWh0KG1heCAqIGkgLyBsaW5lcykgKyAnPC90ZXh0Pic7CiAgfQogIHJldHVybiBvdXQ7Cn0KCmZ1bmN0aW9uIHN2Z1dyYXAoYm9keSwgaCwg',
  'dGl0bGUpewogIHJldHVybiAnPGRpdiBjbGFzcz0iY2hhcnQtd3JhcCI+PHN2ZyBjbGFzcz0iY2hhcnQiIHZpZXdCb3g9IjAgMCAnICsgQ0hBUlRfVyArICcgJyArIGggKyAnIiAnICsKICAgICdyb2xlPSJpbWciIGFyaWEtbGFiZWw9IicgKyBlc2ModGl0bGUpICsg',
  'JyIgb25wb2ludGVybW92ZT0iY2hhcnRIb3ZlcihldmVudCkiIG9ucG9pbnRlcmxlYXZlPSJjaGFydE91dCgpIiAnICsKICAgICdvbmZvY3VzaW49ImNoYXJ0SG92ZXIoZXZlbnQpIiBvbmZvY3Vzb3V0PSJjaGFydE91dCgpIj4nICsgYm9keSArICc8L3N2Zz48L2Rp',
  'dj4nOwp9CgovKioKICog4LiB4Lij4Liy4Lif4LmB4LiX4LmI4LiH4LiE4Li54LmIIOC4o+C4suC4ouC4o+C4seC4miAvIOC4o+C4suC4ouC4iOC5iOC4suC4oiDguKPguLLguKLguYDguJTguLfguK3guJkKICog4LiV4Li04LiU4Lib4LmJ4Liy4Lii4LiV4Lix4Lin',
  '4LmA4Lil4LiC4LmA4LiJ4Lie4Liy4Liw4LmA4LiU4Li34Lit4LiZ4Liq4Li54LiH4Liq4Li44LiU4LiC4Lit4LiH4LmB4LiV4LmI4Lil4Liw4Lid4Lix4LmI4LiHIOC5hOC4oeC5iOC4leC4tOC4lOC4l+C4uOC4geC5geC4l+C5iOC4hwogKiDguYDguJ7guKPguLLg',
  'uLDguJXguLTguJTguITguKPguJrguJfguLjguIHguYHguJfguYjguIfguYHguKXguYnguKfguKPguIHguIjguJnguYTguKHguYjguKHguLXguYPguITguKPguK3guYjguLLguJkKICovCmZ1bmN0aW9uIGNoYXJ0SW5jb21lRXhwZW5zZShyb3dzKXsKICB2YXIgcGxv',
  'dEggPSAxOTAsIHRvcCA9IENIQVJUX1BBRFQsIEggPSB0b3AgKyBwbG90SCArIDMwOwogIHZhciBtYXggPSBuaWNlTWF4KE1hdGgubWF4LmFwcGx5KG51bGwsIHJvd3MubWFwKGZ1bmN0aW9uKG0peyByZXR1cm4gTWF0aC5tYXgobS5pbmNvbWUsIG0uZXhwZW5zZSk7',
  'IH0pKSB8fCAxKTsKICB2YXIgYmFuZCA9IChDSEFSVF9XIC0gQ0hBUlRfUEFETCAtIENIQVJUX1BBRFIpIC8gcm93cy5sZW5ndGg7CiAgdmFyIGJ3ID0gTWF0aC5taW4oMjQsIChiYW5kIC0gMTApIC8gMik7CgogIHZhciBtYXhJbiA9IHJvd3MucmVkdWNlKGZ1bmN0',
  'aW9uKGEsIGIpeyByZXR1cm4gYi5pbmNvbWUgPiBhLmluY29tZSA/IGIgOiBhOyB9LCByb3dzWzBdKTsKICB2YXIgbWF4RXggPSByb3dzLnJlZHVjZShmdW5jdGlvbihhLCBiKXsgcmV0dXJuIGIuZXhwZW5zZSA+IGEuZXhwZW5zZSA/IGIgOiBhOyB9LCByb3dzWzBd',
  'KTsKCiAgdmFyIGJvZHkgPSBncmlkQW5kVGlja3ModG9wLCBwbG90SCwgbWF4LCA0KTsKICByb3dzLmZvckVhY2goZnVuY3Rpb24obSwgaSl7CiAgICB2YXIgY3ggPSBDSEFSVF9QQURMICsgYmFuZCAqIGkgKyBiYW5kIC8gMjsKICAgIC8vIOC5gOC4p+C5ieC4meC4',
  'iuC5iOC4reC4h+C4p+C5iOC4suC4h+C4quC4teC4nuC4t+C5ieC4mSAycHgg4Lij4Liw4Lir4Lin4LmI4Liy4LiH4LmB4LiX4LmI4LiH4LiE4Li54LmIIOC5hOC4oeC5iOC5g+C4iuC5ieC5gOC4quC5ieC4meC4guC4reC4muC4oeC4suC4hOC4seC5iOC4mQogICAg',
  'dmFyIHgxID0gY3ggLSBidyAtIDEsIHgyID0gY3ggKyAxOwogICAgdmFyIGgxID0gcGxvdEggKiAobS5pbmNvbWUgLyBtYXgpLCBoMiA9IHBsb3RIICogKG0uZXhwZW5zZSAvIG1heCk7CiAgICBib2R5ICs9ICc8Zz4nICsKICAgICAgJzxyZWN0IGNsYXNzPSJiYW5k',
  'IiB4PSInICsgKGN4IC0gYmFuZCAvIDIpICsgJyIgeT0iJyArIHRvcCArICciIHdpZHRoPSInICsgYmFuZCArICciIGhlaWdodD0iJyArIHBsb3RIICsgJyIgcng9IjYiPjwvcmVjdD4nICsKICAgICAgJzxwYXRoIGNsYXNzPSJjMSIgZD0iJyArIGJhclBhdGgoeDEs',
  'IHRvcCArIHBsb3RIIC0gaDEsIGJ3LCBoMSwgdHJ1ZSkgKyAnIj48L3BhdGg+JyArCiAgICAgICc8cGF0aCBjbGFzcz0iYzIiIGQ9IicgKyBiYXJQYXRoKHgyLCB0b3AgKyBwbG90SCAtIGgyLCBidywgaDIsIHRydWUpICsgJyI+PC9wYXRoPic7CiAgICBpZiAobSA9',
  'PT0gbWF4SW4gJiYgbS5pbmNvbWUpIHsKICAgICAgYm9keSArPSAnPHRleHQgY2xhc3M9ImRsYWIiIHg9IicgKyAoeDEgKyBidyAvIDIpICsgJyIgeT0iJyArICh0b3AgKyBwbG90SCAtIGgxIC0gNikgKyAnIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj4nICsgc2hvcnRC',
  'YWh0KG0uaW5jb21lKSArICc8L3RleHQ+JzsKICAgIH0KICAgIGlmIChtID09PSBtYXhFeCAmJiBtLmV4cGVuc2UpIHsKICAgICAgYm9keSArPSAnPHRleHQgY2xhc3M9ImRsYWIiIHg9IicgKyAoeDIgKyBidyAvIDIpICsgJyIgeT0iJyArICh0b3AgKyBwbG90SCAt',
  'IGgyIC0gNikgKyAnIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj4nICsgc2hvcnRCYWh0KG0uZXhwZW5zZSkgKyAnPC90ZXh0Pic7CiAgICB9CiAgICBib2R5ICs9ICc8dGV4dCBjbGFzcz0ieGxhYiIgeD0iJyArIGN4ICsgJyIgeT0iJyArICh0b3AgKyBwbG90SCArIDE4',
  'KSArICciIHRleHQtYW5jaG9yPSJtaWRkbGUiPicgKyBlc2MobS5sYWJlbCkgKyAnPC90ZXh0PicgKwogICAgICBoaXRSZWN0KGN4IC0gYmFuZCAvIDIsIHRvcCwgYmFuZCwgcGxvdEgsCiAgICAgICAgdGlwRGF0YShtLmxhYmVsLCBbWyfguKPguLLguKLguKPguLHg',
  'uJonLCBtb25leShtLmluY29tZSksIDFdLCBbJ+C4o+C4suC4ouC4iOC5iOC4suC4oicsIG1vbmV5KG0uZXhwZW5zZSksIDJdXSkpICsKICAgICAgJzwvZz4nOwogIH0pOwoKICBib2R5ICs9ICc8bGluZSBjbGFzcz0iYXhpcy1sIiB4MT0iJyArIENIQVJUX1BBREwg',
  'KyAnIiB5MT0iJyArICh0b3AgKyBwbG90SCkgKyAnIiB4Mj0iJyArIChDSEFSVF9XIC0gQ0hBUlRfUEFEUikgKyAnIiB5Mj0iJyArICh0b3AgKyBwbG90SCkgKyAnIj48L2xpbmU+JzsKICByZXR1cm4gc3ZnV3JhcChib2R5LCBILCAn4LiB4Lij4Liy4Lif4LmB4LiX',
  '4LmI4LiH4LmA4Lib4Lij4Li14Lii4Lia4LmA4LiX4Li14Lii4Lia4Lij4Liy4Lii4Lij4Lix4Lia4LiB4Lix4Lia4Lij4Liy4Lii4LiI4LmI4Liy4Lii4LiC4Lit4LiH4LmB4LiV4LmI4Lil4Liw4LmA4LiU4Li34Lit4LiZJyk7Cn0KCi8qKgogKiDguIHguLPguYTg',
  'uKMv4LiC4Liy4LiU4LiX4Li44LiZ4Liq4Li44LiX4LiY4Li04Lij4Liy4Lii4LmA4LiU4Li34Lit4LiZIOKAlCDguYHguJfguYjguIfguILguLbguYnguJnguIjguLLguIHguYDguKrguYnguJnguKjguLnguJnguKLguYzguITguLfguK3guIHguLPguYTguKMg4Lil',
  '4LiH4LiE4Li34Lit4LiC4Liy4LiU4LiX4Li44LiZCiAqIOC4leC4s+C5geC4q+C4meC5iOC4h+C5gOC4q+C4meC4t+C4rS/guYPguJXguYnguYDguKrguYnguJnguYDguJvguYfguJnguJXguLHguKfguJrguK3guIHguKvguKXguLHguIEg4Liq4Li14LmA4Lib4LmH',
  '4LiZ4LiV4Lix4Lin4Lii4LmJ4Liz4Lit4Li14LiB4LiK4Lix4LmJ4LiZ4Lir4LiZ4Li24LmI4LiHCiAqLwpmdW5jdGlvbiBjaGFydE5ldChyb3dzKXsKICB2YXIgcGxvdEggPSAxNzAsIHRvcCA9IENIQVJUX1BBRFQsIEggPSB0b3AgKyBwbG90SCArIDMwOwogIHZh',
  'ciBtYXggPSBuaWNlTWF4KE1hdGgubWF4LmFwcGx5KG51bGwsIHJvd3MubWFwKGZ1bmN0aW9uKG0peyByZXR1cm4gTWF0aC5hYnMobS5uZXQpOyB9KSkgfHwgMSk7CiAgdmFyIGJhbmQgPSAoQ0hBUlRfVyAtIENIQVJUX1BBREwgLSBDSEFSVF9QQURSKSAvIHJvd3Mu',
  'bGVuZ3RoOwogIHZhciBidyA9IE1hdGgubWluKDI0LCBiYW5kIC0gMTIpOwogIHZhciB6ZXJvID0gdG9wICsgcGxvdEggLyAyLCBoYWxmID0gcGxvdEggLyAyOwoKICB2YXIgYmVzdCA9IHJvd3MucmVkdWNlKGZ1bmN0aW9uKGEsIGIpeyByZXR1cm4gYi5uZXQgPiBh',
  'Lm5ldCA/IGIgOiBhOyB9LCByb3dzWzBdKTsKICB2YXIgd29yc3QgPSByb3dzLnJlZHVjZShmdW5jdGlvbihhLCBiKXsgcmV0dXJuIGIubmV0IDwgYS5uZXQgPyBiIDogYTsgfSwgcm93c1swXSk7CgogIHZhciBib2R5ID0gJyc7CiAgWzEsIDAuNSwgMCwgLTAuNSwg',
  'LTFdLmZvckVhY2goZnVuY3Rpb24oZil7CiAgICB2YXIgeSA9IHplcm8gLSBoYWxmICogZjsKICAgIGJvZHkgKz0gJzxsaW5lIGNsYXNzPSJncmlkLWwiIHgxPSInICsgQ0hBUlRfUEFETCArICciIHkxPSInICsgeSArICciIHgyPSInICsgKENIQVJUX1cgLSBDSEFS',
  'VF9QQURSKSArICciIHkyPSInICsgeSArICciPjwvbGluZT4nICsKICAgICAgICAgICAgJzx0ZXh0IGNsYXNzPSJ0aWNrIiB4PSInICsgKENIQVJUX1BBREwgLSA4KSArICciIHk9IicgKyAoeSArIDQpICsgJyIgdGV4dC1hbmNob3I9ImVuZCI+JyArIHNob3J0QmFo',
  'dChtYXggKiBmKSArICc8L3RleHQ+JzsKICB9KTsKCiAgcm93cy5mb3JFYWNoKGZ1bmN0aW9uKG0sIGkpewogICAgdmFyIGN4ID0gQ0hBUlRfUEFETCArIGJhbmQgKiBpICsgYmFuZCAvIDI7CiAgICB2YXIgaCA9IGhhbGYgKiAoTWF0aC5hYnMobS5uZXQpIC8gbWF4',
  'KTsKICAgIHZhciB1cCA9IG0ubmV0ID49IDA7CiAgICBib2R5ICs9ICc8Zz4nICsKICAgICAgJzxyZWN0IGNsYXNzPSJiYW5kIiB4PSInICsgKGN4IC0gYmFuZCAvIDIpICsgJyIgeT0iJyArIHRvcCArICciIHdpZHRoPSInICsgYmFuZCArICciIGhlaWdodD0iJyAr',
  'IHBsb3RIICsgJyIgcng9IjYiPjwvcmVjdD4nICsKICAgICAgJzxwYXRoIGNsYXNzPSInICsgKHVwID8gJ2MxJyA6ICdjMicpICsgJyIgZD0iJyArIGJhclBhdGgoY3ggLSBidyAvIDIsIHVwID8gemVybyAtIGggOiB6ZXJvLCBidywgaCwgdXApICsgJyI+PC9wYXRo',
  'Pic7CiAgICBpZiAoKG0gPT09IGJlc3QgJiYgbS5uZXQgPiAwKSB8fCAobSA9PT0gd29yc3QgJiYgbS5uZXQgPCAwKSkgewogICAgICBib2R5ICs9ICc8dGV4dCBjbGFzcz0iZGxhYiIgeD0iJyArIGN4ICsgJyIgeT0iJyArICh1cCA/IHplcm8gLSBoIC0gNiA6IHpl',
  'cm8gKyBoICsgMTQpICsgJyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+JyArIHNob3J0QmFodChtLm5ldCkgKyAnPC90ZXh0Pic7CiAgICB9CiAgICBib2R5ICs9ICc8dGV4dCBjbGFzcz0ieGxhYiIgeD0iJyArIGN4ICsgJyIgeT0iJyArICh0b3AgKyBwbG90SCArIDE4',
  'KSArICciIHRleHQtYW5jaG9yPSJtaWRkbGUiPicgKyBlc2MobS5sYWJlbCkgKyAnPC90ZXh0PicgKwogICAgICBoaXRSZWN0KGN4IC0gYmFuZCAvIDIsIHRvcCwgYmFuZCwgcGxvdEgsCiAgICAgICAgdGlwRGF0YShtLmxhYmVsLCBbW3VwID8gJ+C4geC4s+C5hOC4',
  'oycgOiAn4LiC4Liy4LiU4LiX4Li44LiZJywgbW9uZXkobS5uZXQpLCB1cCA/IDEgOiAyXV0pKSArCiAgICAgICc8L2c+JzsKICB9KTsKCiAgYm9keSArPSAnPGxpbmUgY2xhc3M9ImF4aXMtbCIgeDE9IicgKyBDSEFSVF9QQURMICsgJyIgeTE9IicgKyB6ZXJvICsg',
  'JyIgeDI9IicgKyAoQ0hBUlRfVyAtIENIQVJUX1BBRFIpICsgJyIgeTI9IicgKyB6ZXJvICsgJyI+PC9saW5lPic7CiAgcmV0dXJuIHN2Z1dyYXAoYm9keSwgSCwgJ+C4geC4o+C4suC4n+C4geC4s+C5hOC4o+C4guC4suC4lOC4l+C4uOC4meC4quC4uOC4l+C4mOC4',
  'tOC4o+C4suC4ouC5gOC4lOC4t+C4reC4mSDguYHguJfguYjguIfguYDguKvguJnguLfguK3guYDguKrguYnguJnguITguLfguK3guIHguLPguYTguKMg4LmD4LiV4LmJ4LmA4Liq4LmJ4LiZ4LiE4Li34Lit4LiC4Liy4LiU4LiX4Li44LiZJyk7Cn0KCmZ1bmN0aW9u',
  'IGNoYXJ0VGlwQm94KCl7CiAgdmFyIGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaGFydFRpcCcpOwogIGlmICghYm94KSB7CiAgICBib3ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICAgIGJveC5pZCA9ICdjaGFydFRpcCc7CiAgICBi',
  'b3guY2xhc3NOYW1lID0gJ2N0aXAnOwogICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChib3gpOwogIH0KICByZXR1cm4gYm94Owp9CgpmdW5jdGlvbiBjaGFydEhvdmVyKGV2KXsKICB2YXIgaGl0ID0gZXYudGFyZ2V0ICYmIGV2LnRhcmdldC5jbG9zZXN0ID8g',
  'ZXYudGFyZ2V0LmNsb3Nlc3QoJy5oaXQnKSA6IG51bGw7CiAgaWYgKCFoaXQpIHsgY2hhcnRPdXQoKTsgcmV0dXJuOyB9CgogIHZhciBnID0gaGl0LnBhcmVudE5vZGU7CiAgaWYgKENIQVJUX09OICYmIENIQVJUX09OICE9PSBnKSBDSEFSVF9PTi5jbGFzc0xpc3Qu',
  'cmVtb3ZlKCdvbicpOwogIGcuY2xhc3NMaXN0LmFkZCgnb24nKTsKICBDSEFSVF9PTiA9IGc7CgogIHZhciBkYXRhOwogIHRyeSB7IGRhdGEgPSBKU09OLnBhcnNlKGhpdC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdGlwJykgfHwgJ3t9Jyk7IH0gY2F0Y2ggKGUpIHsgcmV0',
  'dXJuOyB9CgogIC8vIOC4m+C4o+C4sOC4geC4reC4muC4lOC5ieC4p+C4oiB0ZXh0Q29udGVudCDguYTguKHguYjguYPguIrguYggaW5uZXJIVE1MIOKAlCDguIrguLfguYjguK3guKPguLLguKLguIHguLLguKPguKHguLLguIjguLLguIHguILguYnguK3guKHguLng',
  'uKUg4LmE4Lih4LmI4LiE4Lin4Lij4LiW4Li34Lit4Lin4LmI4Liy4Lib4Lil4Lit4LiU4Lig4Lix4LiiCiAgdmFyIGJveCA9IGNoYXJ0VGlwQm94KCk7CiAgYm94LmlubmVySFRNTCA9ICcnOwogIHZhciBoZWFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2',
  'Jyk7CiAgaGVhZC5jbGFzc05hbWUgPSAnbSc7CiAgaGVhZC50ZXh0Q29udGVudCA9IGRhdGEubCB8fCAnJzsKICBib3guYXBwZW5kQ2hpbGQoaGVhZCk7CgogIChkYXRhLnIgfHwgW10pLmZvckVhY2goZnVuY3Rpb24ocm93KXsKICAgIHZhciBsaW5lID0gZG9jdW1l',
  'bnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICBsaW5lLmNsYXNzTmFtZSA9ICdyJzsKICAgIHZhciBrZXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpJyk7CiAgICBrZXkuc3R5bGUuYmFja2dyb3VuZCA9ICd2YXIoLS1jJyArIChyb3dbMl0gfHwgMSkgKyAn',
  'KSc7CiAgICB2YXIgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTsKICAgIG5hbWUudGV4dENvbnRlbnQgPSByb3dbMF07CiAgICB2YXIgdmFsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYicpOwogICAgdmFsLnRleHRDb250ZW50ID0gcm93',
  'WzFdOwogICAgbGluZS5hcHBlbmRDaGlsZChrZXkpOyBsaW5lLmFwcGVuZENoaWxkKG5hbWUpOyBsaW5lLmFwcGVuZENoaWxkKHZhbCk7CiAgICBib3guYXBwZW5kQ2hpbGQobGluZSk7CiAgfSk7CgogIC8vIOC5gOC4geC4suC4sOC4leC4s+C5geC4q+C4meC5iOC4',
  'h+C5gOC4oeC4suC4quC5jCDguYTguKHguYjguYPguIrguYjguILguK3guJrguJrguJnguILguK3guIfguIrguYjguK3guIfguKPguLHguJrguIHguLLguKPguIrguLXguYkgKOC4iuC5iOC4reC4h+C4meC4seC5ieC4meC4quC4ueC4h+C5gOC4l+C5iOC4suC4geC4',
  'o+C4suC4n+C4l+C4seC5ieC4h+C4reC4seC4mQogIC8vIOC4p+C4suC4h+C5hOC4p+C5ieC4guC5ieC4suC4h+C4muC4meC4l+C4teC5hOC4o+C4geC5h+C5hOC4m+C4muC4seC4h+C4q+C4seC4p+C4guC5ieC4reC4geC4suC4o+C5jOC4lOC4l+C4uOC4geC4l+C4',
  'tSkg4LiW4LmJ4Liy4LmA4Lil4Li34LmI4Lit4LiZ4LiU4LmJ4Lin4Lii4LmB4Lib4LmJ4LiZ4Lie4Li04Lih4Lie4LmM4LiB4LmH4LmD4LiK4LmJ4LiV4Lix4Lin4LmB4LiX4LmI4LiH4LmB4LiX4LiZCiAgdmFyIHIgPSBoaXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0',
  'KCk7CiAgdmFyIHB4ID0gKGV2LmNsaWVudFggfHwgZXYuY2xpZW50WCA9PT0gMCkgPyBldi5jbGllbnRYIDogci5sZWZ0ICsgci53aWR0aCAvIDI7CiAgdmFyIHB5ID0gKGV2LmNsaWVudFkgfHwgZXYuY2xpZW50WSA9PT0gMCkgPyBldi5jbGllbnRZIDogci50b3Ag',
  'KyByLmhlaWdodCAvIDI7CiAgYm94LmNsYXNzTGlzdC5hZGQoJ29uJyk7CiAgdmFyIGxlZnQgPSBNYXRoLm1pbihNYXRoLm1heCg4LCBweCAtIGJveC5vZmZzZXRXaWR0aCAvIDIpLCB3aW5kb3cuaW5uZXJXaWR0aCAtIGJveC5vZmZzZXRXaWR0aCAtIDgpOwogIHZh',
  'ciBhYm92ZSA9IHB5IC0gYm94Lm9mZnNldEhlaWdodCAtIDE0OwogIGJveC5zdHlsZS5sZWZ0ID0gbGVmdCArICdweCc7CiAgYm94LnN0eWxlLnRvcCA9IChhYm92ZSA8IDggPyBweSArIDE4IDogYWJvdmUpICsgJ3B4JzsKfQoKZnVuY3Rpb24gY2hhcnRPdXQoKXsK',
  'ICBpZiAoQ0hBUlRfT04pIHsgQ0hBUlRfT04uY2xhc3NMaXN0LnJlbW92ZSgnb24nKTsgQ0hBUlRfT04gPSBudWxsOyB9CiAgdmFyIGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaGFydFRpcCcpOwogIGlmIChib3gpIGJveC5jbGFzc0xpc3QucmVtb3Zl',
  'KCdvbicpOwp9CgpmdW5jdGlvbiBjaGFydExlZ2VuZChhLCBiKXsKICByZXR1cm4gJzxkaXYgY2xhc3M9ImxlZ2VuZCI+JyArCiAgICAnPHNwYW4gY2xhc3M9ImsiPjxzcGFuIGNsYXNzPSJzdyIgc3R5bGU9ImJhY2tncm91bmQ6dmFyKC0tYzEpIj48L3NwYW4+JyAr',
  'IGVzYyhhKSArICc8L3NwYW4+JyArCiAgICAnPHNwYW4gY2xhc3M9ImsiPjxzcGFuIGNsYXNzPSJzdyIgc3R5bGU9ImJhY2tncm91bmQ6dmFyKC0tYzIpIj48L3NwYW4+JyArIGVzYyhiKSArICc8L3NwYW4+JyArCiAgICAnPC9kaXY+JzsKfQoKUk9VVEVTLmZpbmFu',
  'Y2UgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsKICAgIHJldHVybiBQcm9taXNlLmFsbChbCiAgICAgIGNhbGxBcGkoJ2ZpbmFuY2Uuc3VtbWFyeScsIHsgeWVhcjogUy55ZWFyIH0pLAogICAgICBjYWxsQXBpKCdmaW5hbmNlLmxpc3QnLCB7IHllYXI6IFMueWVhciwg',
  'a2luZDogUy5wYXJhbXMua2luZCB8fCAnJyB9KQogICAgXSkudGhlbihmdW5jdGlvbihyKXsgdmFyIGQgPSByWzBdOyBkLml0ZW1zID0gclsxXTsgcmV0dXJuIGQ7IH0pOwogIH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHZhciB5ZWFyTGFiZWwgPSBTLnll',
  'YXIgPT09ICdhbGwnID8gJ+C4l+C4uOC4geC4m+C4tScgOiAn4Lib4Li1ICcgKyBTLnllYXI7CiAgICB2YXIgaGVhZCA9ICc8ZGl2IGNsYXNzPSJncmlkIGc0IG1iMTIiPicgKwogICAgICBrcGkoJ+C4o+C4suC4ouC4o+C4seC4miAnICsgeWVhckxhYmVsLCBiYWh0',
  'KGQuaW5jb21lKSwgJ+C5gOC4ieC4peC4teC5iOC4oiAnICsgYmFodChkLmF2Z0luY29tZSkgKyAnL+C5gOC4lOC4t+C4reC4mScsICdnb29kJykgKwogICAgICBrcGkoJ+C4o+C4suC4ouC4iOC5iOC4suC4oiAnICsgeWVhckxhYmVsLCBiYWh0KGQuZXhwZW5zZSks',
  'ICfguYDguInguKXguLXguYjguKIgJyArIGJhaHQoZC5hdmdFeHBlbnNlKSArICcv4LmA4LiU4Li34Lit4LiZJywgJ2JhZCcpICsKICAgICAga3BpKCfguITguIfguYDguKvguKXguLfguK3guKrguLjguJfguJjguLQnLCBiYWh0KGQubmV0KSwgJ+C4reC4seC4leC4',
  'o+C4suC4geC4s+C5hOC4oyAnICsgcGN0KGQubWFyZ2luKSwgJ2FjY2VudCAnICsgKGQubmV0ID49IDAgPyAnZ29vZCcgOiAnYmFkJykpICsKICAgICAga3BpKCfguJrguLHguJnguJfguLbguIHguYHguKXguYnguKcnLCBkLm1vbnRoc1dpdGhEYXRhICsgJyDguYDg',
  'uJTguLfguK3guJknLCBkLmNvdW50ICsgJyDguKPguLLguKLguIHguLLguKMnKSArCiAgICAnPC9kaXY+JzsKCiAgICAvLyDguIHguKPguLLguJ/guIHguYjguK3guJkg4LmB4Lil4LmJ4Lin4LiE4LmI4Lit4Lii4LiV4Liy4Lij4Liy4LiHIOKAlCDguJXguLLguKPg',
  'uLLguIfguILguYnguLLguIfguKXguYjguLLguIfguITguLfguK3guJfguLXguYjguK3guYjguLLguJnguITguYjguLLguIjguKPguLTguIfguYTguJTguYnguJfguLjguIHguJXguLHguKcKICAgIC8vIOC4geC4o+C4suC4n+C4iuC5iOC4p+C4ouC5g+C4q+C5ieC5',
  'gOC4q+C5h+C4meC5geC4meC4p+C5guC4meC5ieC4oSDguYTguKHguYjguYTguJTguYnguKHguLLguYHguJfguJnguJXguLHguKfguYDguKXguIIKICAgIHZhciBoYXNEYXRhID0gZC5ieU1vbnRoLnNvbWUoZnVuY3Rpb24obSl7IHJldHVybiBtLmluY29tZSB8fCBt',
  'LmV4cGVuc2U7IH0pOwogICAgdmFyIGNoYXJ0cyA9ICFoYXNEYXRhID8gJycgOgogICAgICBjYXJkKCfwn5OIIOC4o+C4suC4ouC4o+C4seC4miAvIOC4o+C4suC4ouC4iOC5iOC4suC4oiDguKPguLLguKLguYDguJTguLfguK3guJkgwrcgJyArIHllYXJMYWJlbCwK',
  'ICAgICAgICBjaGFydExlZ2VuZCgn4Lij4Liy4Lii4Lij4Lix4LiaJywgJ+C4o+C4suC4ouC4iOC5iOC4suC4oicpICsgY2hhcnRJbmNvbWVFeHBlbnNlKGQuYnlNb250aCkpICsKICAgICAgY2FyZCgn4pqW77iPIOC4geC4s+C5hOC4oyAvIOC4guC4suC4lOC4l+C4',
  'uOC4meC4quC4uOC4l+C4mOC4tCDguKPguLLguKLguYDguJTguLfguK3guJkgwrcgJyArIHllYXJMYWJlbCwKICAgICAgICAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtYjgiPuC5geC4l+C5iOC4h+C5gOC4q+C4meC4t+C4reC5gOC4quC5ieC4meC4qOC4ueC4meC4',
  'ouC5jOC4hOC4t+C4reC5gOC4lOC4t+C4reC4meC4l+C4teC5iOC4geC4s+C5hOC4oyDguYPguJXguYnguYDguKrguYnguJnguITguLfguK3guYDguJTguLfguK3guJnguJfguLXguYjguILguLLguJTguJfguLjguJk8L2Rpdj4nICsKICAgICAgICBjaGFydE5ldChk',
  'LmJ5TW9udGgpKTsKCiAgICB2YXIgbWF4QmFyID0gTWF0aC5tYXguYXBwbHkobnVsbCwgZC5ieU1vbnRoLm1hcChmdW5jdGlvbihtKXsgcmV0dXJuIE1hdGgubWF4KG0uaW5jb21lLCBtLmV4cGVuc2UpOyB9KSkgfHwgMTsKICAgIHZhciBtb250aGx5ID0gY2FyZCgn',
  '8J+ThSDguKPguLLguKLguYDguJTguLfguK3guJkgwrcgJyArIHllYXJMYWJlbCwKICAgICAgJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICc8dGg+4LmA4LiU4Li34Lit4LiZPC90aD48dGggY2xhc3M9Im51bSI+',
  '4Lij4Liy4Lii4Lij4Lix4LiaPC90aD48dGggY2xhc3M9Im51bSI+4Lij4Liy4Lii4LiI4LmI4Liy4LiiPC90aD48dGggY2xhc3M9Im51bSI+4LiE4LiH4LmA4Lir4Lil4Li34LitPC90aD4nICsKICAgICAgJzx0aCBzdHlsZT0id2lkdGg6MzglIj7guYDguJfguLXg',
  'uKLguJrguKPguLLguKLguKPguLHguJogLyDguKPguLLguKLguIjguYjguLLguKI8L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgIGQuYnlNb250aC5tYXAoZnVuY3Rpb24obSl7CiAgICAgICAgdmFyIGJsYW5rID0gIW0uaW5jb21lICYmICFtLmV4cGVu',
  'c2U7CiAgICAgICAgcmV0dXJuICc8dHInICsgKGJsYW5rID8gJyBzdHlsZT0ib3BhY2l0eTouNDUiJyA6ICcnKSArICc+JyArCiAgICAgICAgICAnPHRkPjxiPicgKyBtLmxhYmVsICsgJzwvYj48L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsg',
  'KG0uaW5jb21lID8gbW9uZXkobS5pbmNvbWUpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPicgKyAobS5leHBlbnNlID8gbW9uZXkobS5leHBlbnNlKSA6ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgJzx0ZCBjbGFz',
  'cz0ibnVtIj48YiBzdHlsZT0iY29sb3I6JyArIChtLm5ldCA+PSAwID8gJ3ZhcigtLW9rKScgOiAndmFyKC0tZGFuZ2VyKScpICsgJyI+JyArCiAgICAgICAgICAgIChibGFuayA/ICfigJMnIDogbW9uZXkobS5uZXQpKSArICc8L2I+PC90ZD4nICsKICAgICAgICAg',
  'ICc8dGQ+JyArCiAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJiYXItdHJhY2sgbWI4Ij48ZGl2IGNsYXNzPSJiYXItZmlsbCIgc3R5bGU9IndpZHRoOicgKyAobS5pbmNvbWUvbWF4QmFyKjEwMCkgKyAnJTtiYWNrZ3JvdW5kOnZhcigtLWMxKSI+PC9kaXY+PC9kaXY+',
  'JyArCiAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJiYXItdHJhY2siPjxkaXYgY2xhc3M9ImJhci1maWxsIiBzdHlsZT0id2lkdGg6JyArIChtLmV4cGVuc2UvbWF4QmFyKjEwMCkgKyAnJTtiYWNrZ3JvdW5kOnZhcigtLWMyKSI+PC9kaXY+PC9kaXY+JyArCiAgICAg',
  'ICAgICAnPC90ZD48L3RyPic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nLCAnJywgdHJ1ZSk7CgogICAgdmFyIGJ5S2luZCA9IGNhcmQoJ/Cfp74g4LmB4Lii4LiB4LiV4Liy4Lih4Lij4Liy4Lii4LiB4Liy4LijIMK3ICcgKyB5',
  'ZWFyTGFiZWwsCiAgICAgIGJhckNoYXJ0KGQuYnlLaW5kLm1hcChmdW5jdGlvbihrKXsgcmV0dXJuIHsgbGFiZWw6IGsua2luZCArICcgKCcgKyBrLmNvdW50ICsgJyknLCB0b3RhbDogay50b3RhbCB9OyB9KSwKICAgICAgICAgICAgICAgJ2xhYmVsJywgJ3RvdGFs',
  'JywgZnVuY3Rpb24oaSl7IHJldHVybiBtb25leShpLnRvdGFsKSArICcg4Li/JzsgfSkpOwoKICAgIHZhciBieVllYXIgPSBjYXJkKCfwn5OKIOC5gOC4l+C4teC4ouC4muC4o+C4suC4ouC4m+C4tScsCiAgICAgIGQuYnlZZWFyLmxlbmd0aCA/ICc8ZGl2IGNsYXNz',
  'PSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOmF1dG8iPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guJvguLU8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKPguLLguKLguKPguLHguJo8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKPguLLguKLg',
  'uIjguYjguLLguKI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguIfguYDguKvguKXguLfguK08L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgZC5ieVllYXIubWFwKGZ1bmN0aW9uKHkpewogICAgICAgICAgcmV0dXJuICc8dHIgb25jbGljaz0ic2V0',
  'WWVhckZyb21UYWJsZSgnICsgeS55ZWFyICsgJykiIHN0eWxlPSJjdXJzb3I6cG9pbnRlciI+JyArCiAgICAgICAgICAgICc8dGQ+PGI+JyArIGRpc3BsYXlZZWFyKHkueWVhcikgKyAnPC9iPicgKwogICAgICAgICAgKHVzZUJ1ZGRoaXN0WWVhcigpID8gJyA8c3Bh',
  'biBjbGFzcz0iZmFpbnQgZnMxMiI+LyAnICsgeS55ZWFyICsgJzwvc3Bhbj4nIDogJycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIG1vbmV5KHkuaW5jb21lKSArICc8L3RkPjx0ZCBjbGFzcz0ibnVtIj4nICsgbW9uZXkoeS5l',
  'eHBlbnNlKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0iPjxiIHN0eWxlPSJjb2xvcjonICsgKHkubmV0Pj0wPyd2YXIoLS1vayknOid2YXIoLS1kYW5nZXIpJykgKyAnIj4nICsgbW9uZXkoeS5uZXQpICsgJzwvYj48L3RkPjwvdHI+JzsK',
  'ICAgICAgICB9KS5qb2luKCcnKSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JyA6ICc8ZGl2IGNsYXNzPSJlbXB0eSI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14LiC4LmJ4Lit4Lih4Li54LilPC9kaXY+JywgJycsIHRydWUpOwoKICAgIHZhciBraW5kcyA9ICc8',
  'ZGl2IGNsYXNzPSJjaGlwcyBtYjEyIj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImNoaXAgJyArICghUy5wYXJhbXMua2luZD8nb24nOicnKSArICciIG9uY2xpY2s9InNldFBhcmFtKFwna2luZFwnLFwnXCcpIj7guJfguLjguIHguKPguLLguKLguIHguLLguKM8',
  'L2J1dHRvbj4nICsKICAgICAgZC5ieUtpbmQubWFwKGZ1bmN0aW9uKGspewogICAgICAgIHJldHVybiAnPGJ1dHRvbiBjbGFzcz0iY2hpcCAnICsgKFMucGFyYW1zLmtpbmQ9PT1rLmtpbmQ/J29uJzonJykgKyAnIiBvbmNsaWNrPSJzZXRQYXJhbShcJ2tpbmRcJywn',
  'ICsganNxKGsua2luZCkgKyAnKSI+JyArCiAgICAgICAgICAgICAgIGVzYyhrLmtpbmQpICsgJyAoJyArIGsuY291bnQgKyAnKTwvYnV0dG9uPic7CiAgICAgIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7CgogICAgdmFyIHJvd3MgPSBkLml0ZW1zOwogICAgdmFyIGxp',
  'c3QgPSBjYXJkKCfwn5OSIOC4o+C4suC4ouC4geC4suC4o+C4l+C4seC5ieC4h+C4q+C4oeC4lCDCtyAnICsgeWVhckxhYmVsICsgJyAoJyArIHJvd3MubGVuZ3RoICsgJyknLAogICAgICByb3dzLmxlbmd0aCA/ICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNz',
  'PSJ0Ij48dGhlYWQ+PHRyPicgKwogICAgICAgICc8dGg+4Lin4Lix4LiZ4LiX4Li14LmIPC90aD48dGg+4Lij4Liy4Lii4LiB4Liy4LijPC90aD48dGggY2xhc3M9Im51bSI+4LiI4Liz4LiZ4Lin4LiZ4LmA4LiH4Li04LiZPC90aD48dGg+4Lij4Lit4Lia4Lia4Li0',
  '4LilPC90aD48dGg+4LiK4LmI4Lit4LiH4LiX4Liy4LiHPC90aD4nICsKICAgICAgICAnPHRoPuC4quC4peC4tOC4mzwvdGg+PHRoPuC4q+C4oeC4suC4ouC5gOC4q+C4leC4uDwvdGg+PHRoPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT4nICsKICAgICAgICByb3dz',
  'Lm1hcChmdW5jdGlvbih4KXsKICAgICAgICAgIHZhciBpbmMgPSB4LmZsb3cgPT09ICfguKPguLLguKLguKPguLHguJonOwogICAgICAgICAgcmV0dXJuICc8dHI+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im5vd3JhcCBmczEyIj4nICsgdGhEYXRlKHguZGF0',
  'ZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD48Yj4nICsgZXNjKHgua2luZCkgKyAnPC9iPiAnICsgKGluYyA/ICc8c3BhbiBjbGFzcz0iYiBvayI+4Lij4Liy4Lii4Lij4Lix4LiaPC9zcGFuPicgOiAnPHNwYW4gY2xhc3M9ImIgbXV0ZSI+4Lij4Liy4Lii',
  '4LiI4LmI4Liy4LiiPC9zcGFuPicpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+PGIgc3R5bGU9ImNvbG9yOicgKyAoaW5jPyd2YXIoLS1vayknOid2YXIoLS1pbmspJykgKyAnIj4nICsgKGluYz8nKyc6J+KIkicpICsgbW9uZXkoeC5h',
  'bW91bnQsIDIpICsgJzwvYj48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKHguYmlsbE1vbnRoIHx8ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKHguY2hhbm5lbCB8fCAn',
  '4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZD4nICsgdGh1bWJzSHRtbCh4LnNsaXBSZWZzKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIG11dGVkIGNsaXAiPicgKyBlc2MoeC5ub3RlIHx8ICcnKSArICc8L3RkPicgKwog',
  'ICAgICAgICAgICAnPHRkPjxkaXYgY2xhc3M9InQtYWN0aW9ucyI+JyArCiAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBzbSBpY29uIiBvbmNsaWNrPVwnZm9ybUZpbmFuY2UoJyArIGF0dHIoeCkgKyAnKVwnPuKcj++4jzwvYnV0dG9uPicgKwogICAg',
  'ICAgICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20gaWNvbiBkZ3IiIG9uY2xpY2s9ImRlbEZpbmFuY2UoJyArIGpzcSh4LmlkKSArICcpIj7wn5eRPC9idXR0b24+JyArCiAgICAgICAgICAgICc8L2Rpdj48L3RkPjwvdHI+JzsKICAgICAgICB9KS5qb2luKCcn',
  'KSArICc8L3Rib2R5PjwvdGFibGU+PC9kaXY+JwogICAgICA6IGVtcHR5Qm94KCfguKLguLHguIfguYTguKHguYjguKHguLXguKPguLLguKLguIHguLLguKPguYPguJknICsgeWVhckxhYmVsLCAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZm9ybUZp',
  'bmFuY2UobnVsbCkiPisg4Lia4Lix4LiZ4LiX4Li24LiB4Lij4Liy4Lii4LiB4Liy4LijPC9idXR0b24+JyksCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIHNtIiBvbmNsaWNrPSJmb3JtRmluYW5jZShudWxsKSI+KyDguJrguLHguJnguJfguLbguIHguKPg',
  'uLLguKLguKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4LiiPC9idXR0b24+JywgdHJ1ZSk7CgogICAgcmV0dXJuIGhlYWQgKyBjaGFydHMgKyBtb250aGx5ICsgJzxkaXYgY2xhc3M9ImdyaWQgZzIgbXQxMiBtYjEyIj4nICsgYnlLaW5kICsgYnlZZWFyICsgJzwv',
  'ZGl2PicgKyBraW5kcyArIGxpc3Q7CiAgfQp9OwoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIDkpIOC4o+C4suC4ouC4h+C4suC4mSAmIOC4quC4s+C4o+C4reC4h+C4guC5ieC4reC4oeC4',
  'ueC4pQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KUk9VVEVTLnJlcG9ydHMgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsKICAgIHJldHVybiBQcm9taXNlLmFsbChbCiAgICAgIGNhbGxBcGko',
  'J3JlcG9ydC5jb3N0UGVyUm9vbScsIHsgeWVhcjogUy55ZWFyIH0pLAogICAgICBjYWxsQXBpKCdyZXBvcnQudXBjb21pbmcnLCB7IGRheXM6IDkwIH0pLAogICAgICBjYWxsQXBpKCdiYWNrdXAuc2hlZXRzJywge30pLAogICAgICBjYWxsQXBpKCdzaGFyZS5saW5r',
  'cycsIHt9KS5jYXRjaChmdW5jdGlvbigpeyByZXR1cm4ge307IH0pLAogICAgICBjYWxsQXBpKCdiYWNrdXAuaGlzdG9yeScsIHt9KS5jYXRjaChmdW5jdGlvbigpeyByZXR1cm4gW107IH0pCiAgICBdKS50aGVuKGZ1bmN0aW9uKHIpewogICAgICByZXR1cm4geyBj',
  'b3N0OiByWzBdLCB1cGNvbWluZzogclsxXSwgc2hlZXRzOiByWzJdLCBsaW5rczogclszXSB8fCB7fSwgYmFja3Vwczogcls0XSB8fCBbXSwgeWVhcnM6IFtdIH07CiAgICB9KTsKICB9LAogIHJlbmRlcjogZnVuY3Rpb24oZCl7CiAgICB2YXIgeWVhckxhYmVsID0g',
  'Uy55ZWFyID09PSAnYWxsJyA/ICfguJfguLjguIHguJvguLUnIDogJ+C4m+C4tSAnICsgUy55ZWFyOwogICAgdmFyIGMgPSBkLmNvc3Q7CiAgICB2YXIgdG9wID0gYy5yb29tcy5maWx0ZXIoZnVuY3Rpb24ocil7IHJldHVybiByLnRvdGFsID4gMDsgfSk7CiAgICB2',
  'YXIgbWF4Q29zdCA9IHRvcC5sZW5ndGggPyB0b3BbMF0udG90YWwgOiAxOwoKICAgIHZhciB1cGNvbWluZyA9IGNhcmQoJ/Cfl5PvuI8g4Lib4LiP4Li04LiX4Li04LiZ4LiH4Liy4LiZ4LiX4Li14LmI4LiB4Liz4Lil4Lix4LiH4LiI4Liw4LiW4Li24LiHICg5MCDg',
  'uKfguLHguJkpIMK3ICcgKyBkLnVwY29taW5nLmxlbmd0aCArICcg4LiH4Liy4LiZJywKICAgICAgZC51cGNvbWluZy5sZW5ndGggPyAnPGRpdiBjbGFzcz0iYWxpc3QiPicgKyBkLnVwY29taW5nLm1hcChmdW5jdGlvbih1KXsKICAgICAgICB2YXIgbHZsID0gdS5k',
  'YXlzTGVmdCA8IDAgPyAnZGFuZ2VyJyA6ICh1LmRheXNMZWZ0IDw9IDcgPyAnd2FybicgOiAnaW5mbycpOwogICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0iYWxpIGwtJyArIGx2bCArICciIG9uY2xpY2s9ImdvKFwnJyArIGp1bXBQYWdlKHUubW9kdWxlKSArICdc',
  'JykiPicgKwogICAgICAgICAgJzxkaXYgY2xhc3M9ImljIj4nICsgdS5pY29uICsgJzwvZGl2PjxkaXY+JyArCiAgICAgICAgICAnPGRpdiBjbGFzcz0idHQiPicgKyBlc2ModS50aXRsZSkgKyAnPC9kaXY+JyArCiAgICAgICAgICAnPGRpdiBjbGFzcz0iZGQiPicg',
  'KyB0aERhdGUodS5kYXRlKSArICcgwrcgJyArCiAgICAgICAgICAgICh1LmRheXNMZWZ0IDwgMCA/ICfguYDguKXguKLguIHguLPguKvguJnguJQgJyArICgtdS5kYXlzTGVmdCkgKyAnIOC4p+C4seC4mScgOiAodS5kYXlzTGVmdCA9PT0gMCA/ICfguKfguLHguJng',
  'uJnguLXguYknIDogJ+C4reC4teC4gSAnICsgdS5kYXlzTGVmdCArICcg4Lin4Lix4LiZJykpICsKICAgICAgICAgICAgKHUuZGV0YWlsID8gJyDCtyAnICsgZXNjKHUuZGV0YWlsKSA6ICcnKSArICc8L2Rpdj48L2Rpdj48L2Rpdj4nOwogICAgICB9KS5qb2luKCcn',
  'KSArICc8L2Rpdj4nIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJiaWciPvCfjKTvuI88L2Rpdj7guYTguKHguYjguKHguLXguIfguLLguJnguJnguLHguJTguKvguKHguLLguKLguYPguJkgOTAg4Lin4Lix4LiZ4LiC4LmJ4Liy4LiH4Lir4LiZ4LmJ',
  '4LiyPC9kaXY+JywgJycsIHRydWUpOwoKICAgIHZhciBjb3N0Q2FyZCA9IGNhcmQoJ/Cfj7fvuI8g4LiE4LmI4Liy4LmD4LiK4LmJ4LiI4LmI4Liy4Lii4Liq4Liw4Liq4Lih4Lij4Liy4Lii4Lir4LmJ4Lit4LiHIMK3ICcgKyB5ZWFyTGFiZWwsCiAgICAgICc8ZGl2',
  'IGNsYXNzPSJncmlkIGczIG1iMTIiPicgKwogICAgICAgIGtwaSgn4Lij4Lin4Lih4LiX4Li44LiB4Lir4LmJ4Lit4LiHJywgYmFodChjLnRvdGFsKSwgJycpICsKICAgICAgICBrcGkoJ+C5gOC4ieC4peC4teC5iOC4ouC4leC5iOC4reC4q+C5ieC4reC4hycsIGJh',
  'aHQoYy5hdmVyYWdlKSwgJycpICsKICAgICAgICBrcGkoJ+C4q+C5ieC4reC4h+C4l+C4teC5iOC5g+C4iuC5ieC4iOC5iOC4suC4ouC4quC4ueC4h+C4quC4uOC4lCcsIHRvcC5sZW5ndGggPyAoJ+C4q+C5ieC4reC4hyAnICsgdG9wWzBdLnJvb20pIDogJ+KAkycs',
  'IHRvcC5sZW5ndGggPyBiYWh0KHRvcFswXS50b3RhbCkgOiAnJykgKwogICAgICAnPC9kaXY+JyArCiAgICAgICh0b3AubGVuZ3RoID8gJzxkaXYgY2xhc3M9InR3Ij48dGFibGUgY2xhc3M9InQiPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guKvguYnguK3g',
  'uIc8L3RoPjx0aCBjbGFzcz0ibnVtIj7guIfguLLguJnguIvguYjguK3guKE8L3RoPjx0aCBjbGFzcz0ibnVtIj7guITguYjguLLguIvguYjguK3guKE8L3RoPjx0aCBjbGFzcz0ibnVtIj7guKXguYnguLLguIfguYHguK3guKPguYw8L3RoPicgKwogICAgICAgICc8',
  'dGggY2xhc3M9Im51bSI+4LiC4Lit4LiH4LmA4LiC4LmJ4Liy4Lir4LmJ4Lit4LiHPC90aD48dGggY2xhc3M9Im51bSI+4Lij4Lin4LihPC90aD48dGggc3R5bGU9IndpZHRoOjI2JSI+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PicgKwogICAgICAgIHRvcC5tYXAo',
  'ZnVuY3Rpb24ocil7CiAgICAgICAgICByZXR1cm4gJzx0ciBvbmNsaWNrPSJvcGVuUm9vbSgnICsganNxKHIucm9vbSkgKyAnKSIgc3R5bGU9ImN1cnNvcjpwb2ludGVyIj4nICsKICAgICAgICAgICAgJzx0ZD48Yj4nICsgZXNjKHIucm9vbSkgKyAnPC9iPiA8c3Bh',
  'biBjbGFzcz0iZmFpbnQgZnMxMiI+4LiK4Lix4LmJ4LiZICcgKyBlc2Moci5mbG9vcikgKyAnPC9zcGFuPjwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+JyArIHIuam9icyArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJudW0i',
  'PicgKyAoci5yZXBhaXIgPyBtb25leShyLnJlcGFpcikgOiAn4oCTJykgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0ibnVtIj4nICsgKHIuYWMgPyBtb25leShyLmFjKSA6ICfigJMnKSArICc8L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNz',
  'PSJudW0iPicgKyAoci5wdXJjaGFzZSA/IG1vbmV5KHIucHVyY2hhc2UpIDogJ+KAkycpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSI+PGI+JyArIG1vbmV5KHIudG90YWwpICsgJzwvYj48L3RkPicgKwogICAgICAgICAgICAnPHRkPjxk',
  'aXYgY2xhc3M9ImJhci10cmFjayI+PGRpdiBjbGFzcz0iYmFyLWZpbGwiIHN0eWxlPSJ3aWR0aDonICsgKHIudG90YWwvbWF4Q29zdCoxMDApICsgJyUiPjwvZGl2PjwvZGl2PjwvdGQ+PC90cj4nOwogICAgICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJs',
  'ZT48L2Rpdj4nCiAgICAgIDogJzxkaXYgY2xhc3M9ImVtcHR5Ij7guKLguLHguIfguYTguKHguYjguKHguLXguITguYjguLLguYPguIrguYnguIjguYjguLLguKLguJfguLXguYjguJrguLHguJnguJfguLbguIHguYTguKfguYnguKPguLLguKLguKvguYnguK3guIc8',
  'ZGl2IGNsYXNzPSJmczEyIG10OCI+4LmD4Liq4LmIICLguITguYjguLLguYPguIrguYnguIjguYjguLLguKIiIOC5g+C4meC4h+C4suC4meC4i+C5iOC4reC4oS/guKXguYnguLLguIfguYHguK3guKPguYwg4Lir4Lij4Li34Lit4Lij4Liw4Lia4Li44Lir4LmJ4Lit',
  '4LiH4LmD4LiZ4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHIOC5geC4peC5ieC4p+C4leC4seC4p+C5gOC4peC4guC4iOC4sOC4guC4tuC5ieC4meC4l+C4teC5iOC4meC4teC5iDwvZGl2PjwvZGl2PicpKTsKCiAgICB2YXIgYmFja3VwID0g',
  'Y2FyZCgn8J+SviDguKrguLPguKPguK3guIfguYHguKXguLDguIHguLnguYnguITguLfguJnguILguYnguK3guKHguLnguKUnLAogICAgICAnPHAgY2xhc3M9ImZzMTMgbXV0ZWQiPuC4guC5ieC4reC4oeC4ueC4peC4l+C4seC5ieC4h+C4q+C4oeC4lOC4reC4ouC4',
  'ueC5iOC5g+C4meC4o+C4sOC4muC4muC4meC4teC5iSDigJQg4LiE4Lin4Lij4LiU4Liy4Lin4LiZ4LmM4LmC4Lir4Lil4LiU4Liq4Liz4Lij4Lit4LiH4LmE4Lin4LmJ4LmA4LiU4Li34Lit4LiZ4Lil4Liw4LiE4Lij4Lix4LmJ4LiHICcgKwogICAgICAn4LmE4Lif',
  '4Lil4LmMIEpTT04g4LiZ4Liz4LiB4Lil4Lix4Lia4LmA4LiC4LmJ4Liy4Lij4Liw4Lia4Lia4LmE4LiU4LmJIOC4quC5iOC4p+C4mSBDU1Yg4LmA4Lib4Li04LiU4LmD4LiZIEV4Y2VsIOC4q+C4o+C4t+C4rSBHb29nbGUgU2hlZXRzIOC5hOC4lOC5ieC5gOC4peC4',
  'ojwvcD4nICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBtdDEyIj4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSIgb25jbGljaz0iZG9FeHBvcnRKc29uKCkiPuKsh++4jyDguJTguLLguKfguJnguYzguYLguKvguKXguJTguKrguLPguKPguK3guIfg',
  'uJfguLHguYnguIfguKvguKHguJQgKEpTT04pPC9idXR0b24+JyArCiAgICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iZG9JbXBvcnRKc29uKCkiPuKshu+4jyDguIHguLnguYnguITguLfguJnguIjguLLguIHguYTguJ/guKXguYzguKrguLPguKPg',
  'uK3guIc8L2J1dHRvbj4nICsKICAgICAgJzwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZnMxMiBtdXRlZCBtYjgiPuC4quC5iOC4h+C4reC4reC4geC5gOC4m+C5h+C4mSBDU1Yg4LmB4Lii4LiB4LiV',
  '4Liy4Lij4Liy4LiHPC9kaXY+JyArCiAgICAgICc8ZGl2IGNsYXNzPSJjaGlwcyI+JyArIGQuc2hlZXRzLm1hcChmdW5jdGlvbihuKXsKICAgICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9ImNoaXAiIG9uY2xpY2s9ImRvRXhwb3J0Q3N2KCcgKyBqc3EobikgKyAn',
  'KSI+JyArIGVzYyhzaGVldExhYmVsKG4pKSArICc8L2J1dHRvbj4nOwogICAgICB9KS5qb2luKCcnKSArICc8L2Rpdj4nKTsKCiAgICB2YXIgc2hhcmUgPSAoY2FuRWRpdCgpICYmIGQubGlua3MgJiYgZC5saW5rcy52aWV3VXJsKSA/IGNhcmQoJ/CflJcg4Lil4Li0',
  '4LiH4LiB4LmM4LmA4LiC4LmJ4Liy4LmD4LiK4LmJ4LiH4Liy4LiZJywKICAgICAgJzxkaXYgY2xhc3M9ImYgbWIxMiI+PGxhYmVsPvCflJEg4Lil4Li04LiH4LiB4LmM4LiC4Lit4LiH4LiE4Li44LiTICjguYHguIHguYnguYTguILguILguYnguK3guKHguLnguKXg',
  'uYTguJTguYkg4oCUIOC4reC4ouC5iOC4suC4quC5iOC4h+C4leC5iOC4rSk8L2xhYmVsPicgKwogICAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgcmVhZG9ubHkgdmFsdWU9IicgKyBlc2MoZC5saW5rcy5hZG1pblVybCkgKyAnIiBvbmNsaWNrPSJ0aGlzLnNlbGVj',
  'dCgpIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7wn5GAIOC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jCAo4LmA4Lib4Li04LiU4LiU4Li54LmE4LiU4LmJ4Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinIOKAlCDguKrguYjguIfg',
  'uYPguKvguYnguYPguITguKPguIHguYfguYTguJTguYkpPC9sYWJlbD4nICsKICAgICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJzaGFyZVVybCIgcmVhZG9ubHkgdmFsdWU9IicgKyBlc2MoZC5saW5rcy52aWV3VXJsKSArICciIG9uY2xpY2s9InRoaXMuc2Vs',
  'ZWN0KCkiPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPicgKwogICAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJjb3B5U2hhcmUoKSI+8J+TiyDguITguLHguJTguKXguK3guIHguKXguLTguIfguIHguYzguYHguIrg',
  'uKPguYw8L2J1dHRvbj4nICsKICAgICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIGRnciIgb25jbGljaz0iZG9Sb3RhdGVTaGFyZSgpIj7wn5SBIOC4reC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC5g+C4q+C4oeC5iDwvYnV0dG9uPicgKwogICAgICAn',
  'PC9kaXY+JyArCiAgICAgICc8cCBjbGFzcz0iZnMxMiBtdXRlZCBtdDEyIj7guITguJnguJfguLXguYjguYDguJvguLTguJTguKXguLTguIfguIHguYzguYHguIrguKPguYzguIjguLDguYDguKvguYfguJnguILguYnguK3guKHguLnguKXguJfguLHguYnguIfguKvg',
  'uKHguJTguYHguJrguJrguK3guYjguLLguJnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcgJyArCiAgICAgICfguYTguKHguYjguJXguYnguK3guIfguKHguLXguJrguLHguI3guIrguLUgR29vZ2xlIOC5geC4peC4sOC5hOC4oeC5iOC5gOC4q+C5h+C4mSBH',
  'b29nbGUgU2hlZXQg4LiC4Lit4LiH4LiE4Li44LiTIMK3ICcgKwogICAgICAn4LiW4LmJ4Liy4Lil4Li04LiH4LiB4LmM4Lir4Lil4Li44LiU4LmD4Lir4LmJ4LiB4LiUICLguK3guK3guIHguKXguLTguIfguIHguYzguYHguIrguKPguYzguYPguKvguKHguYgiIOC4',
  'peC4tOC4h+C4geC5jOC5gOC4lOC4tOC4oeC4iOC4sOC5g+C4iuC5ieC5hOC4oeC5iOC5hOC4lOC5ieC4l+C4seC4meC4l+C4tTwvcD4nKSA6ICcnOwoKICAgIHZhciBkcml2ZSA9IGNhbkVkaXQoKSA/IGNhcmQoJ+KYge+4jyDguKrguLPguKPguK3guIfguK3guLHg',
  'uJXguYLguJnguKHguLHguJXguLTguYPguJkgR29vZ2xlIERyaXZlICgnICsgZC5iYWNrdXBzLmxlbmd0aCArICcg4LiK4Li44LiUKScsCiAgICAgICc8cCBjbGFzcz0iZnMxMyBtdXRlZCI+4Lij4Liw4Lia4Lia4LmA4LiB4LmH4Lia4LmE4Lif4Lil4LmM4Liq4Liz',
  '4Lij4Lit4LiH4LmE4Lin4LmJ4LmD4LiZ4LmC4Lif4Lil4LmA4LiU4Lit4Lij4LmMICLguKrguLPguKPguK3guIfguILguYnguK3guKHguLnguKUiIOC4muC4meC5hOC4lOC4o+C4n+C5jOC4guC4reC4h+C4hOC4uOC4kyAnICsKICAgICAgJ+C4leC4seC5ieC4h+C5',
  'g+C4q+C5ieC4l+C4s+C4reC4seC4leC5guC4meC4oeC4seC4leC4tOC4l+C4uOC4geC4p+C4seC4meC5hOC4lOC5ieC4iOC4suC4geC5gOC4oeC4meC4ueC5g+C4meC4iuC4teC4lTwvcD4nICsKICAgICAgJzxkaXYgY2xhc3M9InJvdyBtdDEyIj48YnV0dG9uIGNs',
  'YXNzPSJidG4iIG9uY2xpY2s9ImRvQmFja3VwTm93KCkiPvCfkr4g4Liq4Liz4Lij4Lit4LiH4LmA4LiU4Li14LmL4Lii4Lin4LiZ4Li14LmJPC9idXR0b24+PC9kaXY+JyArCiAgICAgIChkLmJhY2t1cHMubGVuZ3RoID8gJzxkaXYgY2xhc3M9ImhyIj48L2Rpdj48',
  'ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBzdHlsZT0ibWluLXdpZHRoOmF1dG8iPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guYTguJ/guKXguYw8L3RoPjx0aD7guYDguKfguKXguLI8L3RoPjx0aCBjbGFzcz0ibnVtIj7guILguJnguLLguJQ8',
  'L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgZC5iYWNrdXBzLnNsaWNlKDAsMTApLm1hcChmdW5jdGlvbihiKXsKICAgICAgICAgIHJldHVybiAnPHRyPjx0ZCBjbGFzcz0iZnMxMiI+PGEgaHJlZj0iJyArIGVzYyhzYWZlVXJsKGIudXJsKSkgKyAn',
  'IiB0YXJnZXQ9Il9ibGFuayIgcmVsPSJub29wZW5lciI+JyArIGVzYyhiLm5hbWUpICsgJzwvYT48L3RkPicgKwogICAgICAgICAgICAnPHRkIGNsYXNzPSJmczEyIj4nICsgZXNjKGIuYXQpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9Im51bSBm',
  'czEyIj4nICsgTWF0aC5yb3VuZChiLnNpemUvMTAyNCkgKyAnIEtCPC90ZD48L3RyPic7CiAgICAgICAgfSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicgOiAnJykpIDogJyc7CgogICAgcmV0dXJuIHVwY29taW5nICsgJzxkaXYgY2xhc3M9Im10',
  'MTIiPicgKyBjb3N0Q2FyZCArICc8L2Rpdj4nICsKICAgICAgICAgICAoc2hhcmUgPyAnPGRpdiBjbGFzcz0ibXQxMiI+JyArIHNoYXJlICsgJzwvZGl2PicgOiAnJykgKwogICAgICAgICAgICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgYmFja3VwICsgJzwvZGl2Picg',
  'KwogICAgICAgICAgIChkcml2ZSA/ICc8ZGl2IGNsYXNzPSJtdDEyIj4nICsgZHJpdmUgKyAnPC9kaXY+JyA6ICcnKTsKICB9Cn07CgpmdW5jdGlvbiBzaGVldExhYmVsKG4pewogIHJldHVybiAoewogICAgRGVidHM6J+C4geC5ieC4reC4meC4q+C4meC4teC5iScs',
  'IERlYnRQYXltZW50czon4Lij4Liy4Lii4LiB4Liy4Lij4LiK4Liz4Lij4Liw4Lir4LiZ4Li14LmJJywgUHVyY2hhc2VzOifguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcnLCBSb29tczon4LiX4Liw4LmA4Lia4Li14Lii4LiZ4Lir4LmJ4Lit',
  '4LiHJywKICAgIEFjU2VydmljZTon4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJywgUm9vbVJlcGFpcnM6J+C4i+C5iOC4reC4oeC5geC4i+C4oeC4q+C5ieC4reC4hycsIEJ1aWxkaW5nUmVwYWlyczon4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiBJywKICAg',
  'IFJvb21Bc3NldHM6J+C4l+C4o+C4seC4nuC4ouC5jOC4quC4tOC4meC4q+C5ieC4reC4hycsIEZpbmFuY2U6J+C4o+C4suC4ouC4o+C4seC4mi3guKPguLLguKLguIjguYjguLLguKInLCBTZXR0aW5nczon4LiV4Lix4LmJ4LiH4LiE4LmI4LiyJywgQWN0aXZpdHlM',
  'b2c6J+C4m+C4o+C4sOC4p+C4seC4leC4tOC4geC4suC4o+C5geC4geC5ieC5hOC4gicKICB9KVtuXSB8fCBuOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4LiV4Lix4Lin4LiK4LmI',
  '4Lin4Lii4Lin4Liy4LiU4LiL4LmJ4LizIOC5hgogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCmZ1bmN0aW9uIGtwaShsYWJlbCwgdmFsdWUsIGNhcCwgY2xzKXsKICByZXR1cm4gJzxkaXYg',
  'Y2xhc3M9ImtwaSAnICsgKGNsc3x8JycpICsgJyI+JyArCiAgICAnPGRpdiBjbGFzcz0ibGJsIj4nICsgZXNjKGxhYmVsKSArICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJ2YWwiPicgKyB2YWx1ZSArICc8L2Rpdj4nICsKICAgIChjYXAgPyAnPGRpdiBjbGFz',
  'cz0iY2FwIj4nICsgY2FwICsgJzwvZGl2PicgOiAnJykgKyAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gY2FyZCh0aXRsZSwgYm9keSwgYWN0aW9ucywgZmx1c2gpewogIHJldHVybiAnPGRpdiBjbGFzcz0iY2FyZCI+JyArCiAgICAodGl0bGUgPyAnPGRpdiBjbGFzcz0i',
  'Y2FyZC1oIj48aDM+JyArIHRpdGxlICsgJzwvaDM+JyArIChhY3Rpb25zID8gJzxkaXYgY2xhc3M9InNwIj4nICsgYWN0aW9ucyArICc8L2Rpdj4nIDogJycpICsgJzwvZGl2PicgOiAnJykgKwogICAgJzxkaXYgY2xhc3M9ImNhcmQtYicgKyAoZmx1c2ggPyAnIGZs',
  'dXNoJyA6ICcnKSArICciPicgKyBib2R5ICsgJzwvZGl2PjwvZGl2Pic7Cn0KCi8qKiDguKfguLLguJTguJzguLHguIfguKvguYnguK3guIfguYHguJrguYjguIfguJXguLLguKHguIrguLHguYnguJkg4oCUIGRlY29yYXRlKHJvb20pIC0+IHtjbHMsIHN1Yiwgb25j',
  'bGlja30gKi8KZnVuY3Rpb24gcm9vbUZsb29ycyhyb29tcywgZGVjb3JhdGUpewogIHZhciBieUZsb29yID0ge307CiAgcm9vbXMuZm9yRWFjaChmdW5jdGlvbihyKXsKICAgIHZhciBmID0gci5mbG9vciB8fCBOdW1iZXIoU3RyaW5nKHIucm9vbSkuY2hhckF0KDAp',
  'KTsKICAgIChieUZsb29yW2ZdID0gYnlGbG9vcltmXSB8fCBbXSkucHVzaChyKTsKICB9KTsKICB2YXIgZmxvb3JzID0gT2JqZWN0LmtleXMoYnlGbG9vcikuc29ydCgpOwogIHJldHVybiAnPGRpdiBjbGFzcz0iZmxvb3JzIj4nICsgZmxvb3JzLm1hcChmdW5jdGlv',
  'bihmKXsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0iZmxvb3IiPjxkaXYgY2xhc3M9ImZsb29yLXRhZyI+PGI+JyArIGYgKyAnPC9iPuC4iuC4seC5ieC4mTwvZGl2PjxkaXYgY2xhc3M9InJvb21zIj4nICsKICAgICAgYnlGbG9vcltmXS5tYXAoZnVuY3Rpb24ocil7',
  'CiAgICAgICAgdmFyIGQgPSBkZWNvcmF0ZShyKTsKICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9InJvb20gJyArIGQuY2xzICsgJyIgb25jbGljaz0iJyArIGQub25jbGljayArICciPicgKwogICAgICAgICAgJzxzcGFuIGNsYXNzPSJkb3QiPjwvc3Bhbj48ZGl2',
  'IGNsYXNzPSJubyI+JyArIGVzYyhyLnJvb20pICsgJzwvZGl2PicgKwogICAgICAgICAgJzxkaXYgY2xhc3M9InN0Ij4nICsgZC5zdWIgKyAnPC9kaXY+PC9kaXY+JzsKICAgICAgfSkuam9pbignJykgKyAnPC9kaXY+PC9kaXY+JzsKICB9KS5qb2luKCcnKSArICc8',
  'L2Rpdj4nOwp9CgovKiog4LmD4Liq4LmIIG9iamVjdCDguKXguIfguYPguJkgb25jbGljayBhdHRyaWJ1dGUg4LmE4LiU4LmJ4Lit4Lii4LmI4Liy4LiH4Lib4Lil4Lit4LiU4Lig4Lix4LiiICovCmZ1bmN0aW9uIGF0dHIob2JqKXsKICB2YXIgY2xlYW4gPSB7fTsK',
  'ICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goZnVuY3Rpb24oayl7CiAgICBpZiAoay5pbmRleE9mKCdfJykgPT09IDAgfHwgL1JlZnMkLy50ZXN0KGspIHx8IGsgPT09ICdyZWNvcmRzJyB8fCBrID09PSAnd2FycmFudHknKSByZXR1cm47CiAgICBjbGVhbltrXSA9',
  'IG9ialtrXTsKICB9KTsKICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoY2xlYW4pLnJlcGxhY2UoLyYvZywnJmFtcDsnKS5yZXBsYWNlKC8nL2csJyYjMzk7JykucmVwbGFjZSgvIi9nLCcmcXVvdDsnKTsKfQo8L3NjcmlwdD4KPHNjcmlwdD4KLyogPT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIFNldHRpbmdzLmh0bWwg4oCUIOC4q+C4meC5ieC4suC4leC4seC5ieC4h+C4hOC5iOC4siDCtyDguJjguLXguKEgwrcg4Lia4Lix4LiN4LiK4Li14Lic4Li54LmJ4LmD4LiK4LmJ',
  'IMK3IOC4reC4uOC4m+C4geC4o+C4k+C5jAogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCi8qIC0tLS0tLS0tLS0tLS0tLS0g4LiY4Li14Lih4Liq4Lin4LmI4Liy4LiHIC8g4Lih4Li34LiUIC0t',
  'LS0tLS0tLS0tLS0tLS0gKi8KCnZhciBMU19USEVNRSA9ICdtY29ybmVyLnRoZW1lJzsKdmFyIFRIRU1FUyA9IFsKICB7IGlkOiAn4LiV4Liy4Lih4LmA4LiE4Lij4Li34LmI4Lit4LiHJywgaWM6ICfwn4yXJywgaGludDogJ+C4quC4peC4seC4muC4leC4suC4oeC4',
  'geC4suC4o+C4leC4seC5ieC4h+C4hOC5iOC4suC4guC4reC4h+C4reC4uOC4m+C4geC4o+C4k+C5jCcgfSwKICB7IGlkOiAn4Liq4Lin4LmI4Liy4LiHJywgICAgICBpYzogJ+KYgO+4jycsIGhpbnQ6ICfguJ7guLfguYnguJnguILguLLguKcg4Lit4LmI4Liy4LiZ',
  '4LiH4LmI4Liy4Lii4LiB4Lil4Liy4LiH4LmB4LiU4LiUJyB9LAogIHsgaWQ6ICfguKHguLfguJQnLCAgICAgICAgaWM6ICfwn4yZJywgaGludDogJ+C4nuC4t+C5ieC4meC5gOC4guC5ieC4oSDguKrguJrguLLguKLguJXguLLguJXguK3guJnguIHguKXguLLguIfg',
  'uITguLfguJknIH0KXTsKCi8qKgogKiDguJfguLLguJjguLXguKHguKXguIfguKvguJnguYnguLLguYDguKfguYfguJrguJfguLHguJnguJfguLUKICog4LiV4Lix4Lin4LmB4Lib4Lij4Liq4Li14LiX4Lix4LmJ4LiH4Lir4Lih4LiU4LiZ4Li04Lii4Liy4Lih4LmE',
  '4Lin4LmJIDMg4LiK4Lix4LmJ4LiZ4LmD4LiZIFN0eWxlLmh0bWwg4LmB4Lil4LmJ4LinIOC4leC4o+C4h+C4meC4teC5ieC5geC4hOC5iOC4leC4tOC4lOC4m+C5ieC4suC4ouC4muC4reC4geC4p+C5iOC4suC5g+C4iuC5ieC4iuC4seC5ieC4meC5hOC4q+C4mQog',
  'Ki8KZnVuY3Rpb24gYXBwbHlUaGVtZShuYW1lKXsKICB2YXIgcm9vdCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDsKICBpZiAobmFtZSA9PT0gJ+C4quC4p+C5iOC4suC4hycpIHJvb3Quc2V0QXR0cmlidXRlKCdkYXRhLXRoZW1lJywgJ2xpZ2h0Jyk7CiAgZWxz',
  'ZSBpZiAobmFtZSA9PT0gJ+C4oeC4t+C4lCcpIHJvb3Quc2V0QXR0cmlidXRlKCdkYXRhLXRoZW1lJywgJ2RhcmsnKTsKICBlbHNlIHJvb3QucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXRoZW1lJyk7ICAgICAgIC8vIOC4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4',
  'hyA9IOC4m+C4peC5iOC4reC4ouC5g+C4q+C5iSBwcmVmZXJzLWNvbG9yLXNjaGVtZSDguJXguLHguJTguKrguLTguJkKICB2YXIgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RoZW1lQnRuJyk7CiAgaWYgKGJ0bikgewogICAgdmFyIHQgPSBUSEVNRVMu',
  'ZmlsdGVyKGZ1bmN0aW9uKHgpeyByZXR1cm4geC5pZCA9PT0gbmFtZTsgfSlbMF0gfHwgVEhFTUVTWzBdOwogICAgYnRuLnRleHRDb250ZW50ID0gdC5pYzsKICAgIGJ0bi50aXRsZSA9ICfguJjguLXguKE6ICcgKyB0LmlkICsgJyAo4LiB4LiU4LmA4Lie4Li34LmI',
  '4Lit4Liq4Lil4Lix4LiaKSc7CiAgfQp9CgpmdW5jdGlvbiBjdXJyZW50VGhlbWUoKXsKICByZXR1cm4gbHNHZXQoTFNfVEhFTUUpIHx8IChTLmJvb3QgJiYgUy5ib290LnNldHRpbmdzICYmIFMuYm9vdC5zZXR0aW5ncy50aGVtZSkgfHwgJ+C4leC4suC4oeC5gOC4',
  'hOC4o+C4t+C5iOC4reC4hyc7Cn0KCi8qKiDguJXguLHguYnguIfguJjguLXguKHguYHguKXguLDguIjguLPguYTguKfguYkg4oCUIOC4nOC4ueC5ieC4lOC4ueC5geC4peC4iOC4sOC4luC4ueC4geC4muC4seC4meC4l+C4tuC4geC5gOC4m+C5h+C4meC4hOC5iOC4',
  'suC4leC4seC5ieC4h+C4leC5ieC4meC4guC4reC4h+C4o+C4sOC4muC4muC4lOC5ieC4p+C4oiAqLwpmdW5jdGlvbiBzZXRUaGVtZShuYW1lLCBxdWlldCl7CiAgbHNTZXQoTFNfVEhFTUUsIG5hbWUpOwogIGFwcGx5VGhlbWUobmFtZSk7CiAgaWYgKFMuYm9vdCAm',
  'JiBTLmJvb3QuaXNBZG1pbikgewogICAgY2FsbEFwaSgnc2V0dGluZ3Muc2F2ZScsIHsgdmFsdWVzOiB7IHRoZW1lOiBuYW1lIH0gfSkuY2F0Y2goZnVuY3Rpb24oKXsgLyog4LmA4LiB4LmH4Lia4LmD4LiZ4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiB4LmH4Lie4Lit',
  'ICovIH0pOwogIH0KICBpZiAoIXF1aWV0KSB0b2FzdCgn4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LmA4Lib4LmH4LiZ4LiY4Li14LihJyArIChuYW1lID09PSAn4LiV4Liy4Lih4LmA4LiE4Lij4Li34LmI4Lit4LiHJyA/ICfguJXguLLguKHguYDguITguKPguLfguYjg',
  'uK3guIcnIDogbmFtZSksICdvaycpOwogIGlmIChTLnBhZ2UgPT09ICdzZXR0aW5ncycpIGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsKfQoKLyoqIOC4m+C4uOC5iOC4oeC4muC4meC5geC4luC4muC4q+C4seC4pyDigJQg4Lin4LiZ4Liq4Lin4LmI4Liy4LiHIOKGkiDg',
  'uKHguLfguJQg4oaSIOC4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hyAqLwpmdW5jdGlvbiBjeWNsZVRoZW1lKCl7CiAgdmFyIG9yZGVyID0gWyfguKrguKfguYjguLLguIcnLCAn4Lih4Li34LiUJywgJ+C4leC4suC4oeC5gOC4hOC4o+C4t+C5iOC4reC4hydd',
  'OwogIHZhciBpID0gb3JkZXIuaW5kZXhPZihjdXJyZW50VGhlbWUoKSk7CiAgc2V0VGhlbWUob3JkZXJbKGkgKyAxKSAlIG9yZGVyLmxlbmd0aF0pOwp9CgovKiAtLS0tLS0tLS0tLS0tLS0tIOC4q+C4meC5ieC4suC4leC4seC5ieC4h+C4hOC5iOC4siAtLS0tLS0t',
  'LS0tLS0tLS0tICovCgpST1VURVMuc2V0dGluZ3MgPSB7CiAgbG9hZDogZnVuY3Rpb24oKXsKICAgIHJldHVybiBQcm9taXNlLmFsbChbCiAgICAgIGNhbGxBcGkoJ3NldHRpbmdzLmxpc3QnLCB7fSksCiAgICAgIGNhbGxBcGkoJ2F1dGguZGV2aWNlcycsIHt9KS5j',
  'YXRjaChmdW5jdGlvbigpeyByZXR1cm4gW107IH0pLAogICAgICAoUy5ib290ICYmIFMuYm9vdC5pc0FkbWluKSA/IGNhbGxBcGkoJ3VzZXIubGlzdCcsIHt9KS5jYXRjaChmdW5jdGlvbigpeyByZXR1cm4gW107IH0pIDogUHJvbWlzZS5yZXNvbHZlKG51bGwpLAog',
  'ICAgICAoUy5ib290ICYmIFMuYm9vdC5pc0FkbWluKSA/IGNhbGxBcGkoJ3NoYXJlLmxpbmtzJywge30pLmNhdGNoKGZ1bmN0aW9uKCl7IHJldHVybiB7fTsgfSkgOiBQcm9taXNlLnJlc29sdmUoe30pCiAgICBdKS50aGVuKGZ1bmN0aW9uKHIpewogICAgICByZXR1',
  'cm4geyBzZXR0aW5nczogclswXSwgZGV2aWNlczogclsxXSB8fCBbXSwgdXNlcnM6IHJbMl0sIGxpbmtzOiByWzNdIHx8IHt9LCB5ZWFyczogW10gfTsKICAgIH0pOwogIH0sCiAgcmVuZGVyOiBmdW5jdGlvbihkKXsKICAgIHJldHVybiAnJyArCiAgICAgIHNldHRp',
  'bmdzQWNjb3VudENhcmQoZCkgKwogICAgICBzZXR0aW5nc1RoZW1lQ2FyZCgpICsKICAgICAgKGQuc2V0dGluZ3MuY2FuRWRpdCA/IHNldHRpbmdzR3JvdXBzSHRtbChkLnNldHRpbmdzKSA6IHNldHRpbmdzUmVhZE9ubHlOb3RlKCkpICsKICAgICAgLy8g4LmA4LiJ',
  '4Lie4Liy4Liw4Lic4Li54LmJ4LiU4Li54LmB4Lil4LiX4Li14LmI4LmA4Lir4LmH4LiZ4Liq4Lit4LiH4Liq4LmI4Lin4LiZ4LiZ4Li14LmJIOKAlCDguJXguLHguKfguIHguLLguKPguYzguJTguYDguJvguYfguJnguITguJnguJXguLHguJTguKrguLTguJnguYPg',
  'uIjguYDguK3guIfguKfguYjguLLguIjguLDguYHguKrguJTguIfguK3guLDguYTguKMKICAgICAgLy8g4LmA4Lie4Lij4Liy4Liw4Lir4LiZ4LmJ4Liy4LiV4Lix4Lin4Lit4Lii4LmI4Liy4LiH4LmB4Lia4Lia4LmE4Lif4Lil4LmM4LmA4LiU4Li14Lii4Lin4LmE',
  '4Lih4LmI4Lih4Li14Lia4Lix4LiN4LiK4Li14Lic4Li54LmJ4LmD4LiK4LmJ4LmD4Lir4LmJ4LmB4Liq4LiU4LiHIOC5geC4leC5iOC4ouC4seC4h+C4reC4ouC4suC4geC4muC4reC4geC4nOC4ueC5ieC5g+C4iuC5ieC4p+C5iOC4suC4oeC4teC4reC4sOC5hOC4',
  'o+C4muC5ieC4suC4hwogICAgICAoaXNBZG1pbk5vdygpID8gc2V0dGluZ3NVc2Vyc0NhcmQoZC51c2VycykgKyBzZXR0aW5nc1NoYXJlQ2FyZChkLmxpbmtzKSA6ICcnKTsKICB9Cn07CgovKiAtLS0tIOC4muC4seC4jeC4iuC4teC4guC4reC4h+C4ieC4seC4mSAt',
  'LS0tICovCgpmdW5jdGlvbiBzZXR0aW5nc0FjY291bnRDYXJkKGQpewogIHZhciBtZSA9IEFVVEgubWUgfHwge307CiAgdmFyIGRldmljZXMgPSBkLmRldmljZXMgfHwgW107CiAgcmV0dXJuIGNhcmQoJ/CfkaQg4Lia4Lix4LiN4LiK4Li14LiC4Lit4LiH4LiJ4Lix',
  '4LiZJywKICAgICc8ZGl2IGNsYXNzPSJncmlkIGcyIG1iMTIiPicgKwogICAgICBrcGkoJ+C5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4meC5g+C4meC4iuC4t+C5iOC4rScsIGVzYyhtZS5uYW1lIHx8IG1lLnVzZXJuYW1lIHx8ICfigJMnKSwgZXNjKG1lLnVz',
  'ZXJuYW1lID8gJ0AnICsgbWUudXNlcm5hbWUgOiAobWUudmlhIHx8ICcnKSkpICsKICAgICAga3BpKCfguKrguLTguJfguJjguLTguYzguIHguLLguKPguYPguIrguYnguIfguLLguJknLCBlc2MobWUucm9sZSB8fCAn4oCTJyksCiAgICAgICAgICBtZS5jYW5FZGl0',
  'ID8gJ+C5gOC4nuC4tOC5iOC4oSDguYHguIHguYnguYTguIIg4LmB4Lil4Liw4Lil4Lia4LiC4LmJ4Lit4Lih4Li54Lil4LmE4LiU4LmJJyA6ICfguYDguJvguLTguJTguJTguLnguYTguJTguYnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKcnKSArCiAgICAn',
  'PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0icm93Ij4nICsKICAgICAgKG1lLnVzZXJuYW1lID8gJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iZm9ybUNoYW5nZVBhc3N3b3JkKCkiPvCflJEg4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lij4Lir4Lix4Liq4Lic',
  '4LmI4Liy4LiZPC9idXR0b24+JyA6ICcnKSArCiAgICAgIChtZS51c2VybmFtZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImZvcm1TZXRQaW4oKSI+8J+UoiAnICsKICAgICAgICAoQVVUSC5kZXZpY2UgPyAn4LiV4Lix4LmJ4LiHIFBJTiDguYPguKvg',
  'uKHguYjguJrguJnguYDguITguKPguLfguYjguK3guIfguJnguLXguYknIDogJ+C4leC4seC5ieC4hyBQSU4g4Liq4Liz4Lir4Lij4Lix4Lia4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJJykgKyAnPC9idXR0b24+JyA6ICcnKSArCiAgICAgIChBVVRILmRl',
  'dmljZSA/ICc8YnV0dG9uIGNsYXNzPSJidG4gZGdyIiBvbmNsaWNrPSJmb3JnZXRUaGlzRGV2aWNlKCkiPuC4peC4miBQSU4g4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiZ4Li14LmJPC9idXR0b24+JyA6ICcnKSArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9u',
  'Y2xpY2s9ImNvbmZpcm1Mb2dvdXQoKSI+8J+aqiDguK3guK3guIHguIjguLLguIHguKPguLDguJrguJo8L2J1dHRvbj4nICsKICAgICc8L2Rpdj4nICsKICAgIChkZXZpY2VzLmxlbmd0aAogICAgICA/ICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+PGRpdiBjbGFzcz0i',
  'ZnMxMiBtdXRlZCBtYjgiPuC4reC4uOC4m+C4geC4o+C4k+C5jOC4l+C4teC5iOC4leC4seC5ieC4hyBQSU4g4LmE4Lin4LmJICgnICsgZGV2aWNlcy5sZW5ndGggKyAnKTwvZGl2PicgKwogICAgICAgICc8ZGl2IGNsYXNzPSJ0dyI+PHRhYmxlIGNsYXNzPSJ0IiBz',
  'dHlsZT0ibWluLXdpZHRoOmF1dG8iPjx0aGVhZD48dHI+JyArCiAgICAgICAgJzx0aD7guK3guLjguJvguIHguKPguJPguYw8L3RoPjx0aD7guJXguLHguYnguIfguYDguKHguLfguYjguK08L3RoPjx0aD7guYPguIrguYnguKXguYjguLLguKrguLjguJQ8L3RoPjwv',
  'dHI+PC90aGVhZD48dGJvZHk+JyArCiAgICAgICAgZGV2aWNlcy5tYXAoZnVuY3Rpb24oeCl7CiAgICAgICAgICByZXR1cm4gJzx0cj48dGQ+JyArIGVzYyh4LmRldmljZSkgKyAnPC90ZD4nICsKICAgICAgICAgICAgJzx0ZCBjbGFzcz0iZnMxMiI+JyArIHRoRGF0',
  'ZVNob3J0KFN0cmluZyh4LmNyZWF0ZWRBdCkuc2xpY2UoMCwxMCkpICsgJzwvdGQ+JyArCiAgICAgICAgICAgICc8dGQgY2xhc3M9ImZzMTIiPicgKyB0aERhdGVTaG9ydChTdHJpbmcoeC5sYXN0U2Vlbikuc2xpY2UoMCwxMCkpICsgJzwvdGQ+PC90cj4nOwogICAg',
  'ICAgIH0pLmpvaW4oJycpICsgJzwvdGJvZHk+PC90YWJsZT48L2Rpdj4nICsKICAgICAgICAnPGRpdiBjbGFzcz0icm93IG10MTIiPjxidXR0b24gY2xhc3M9ImJ0biBkZ3Igc20iIG9uY2xpY2s9ImRvRm9yZ2V0QWxsRGV2aWNlcygpIj7guKLguIHguYDguKXguLTg',
  'uIEgUElOIOC4l+C4uOC4geC5gOC4hOC4o+C4t+C5iOC4reC4hzwvYnV0dG9uPjwvZGl2PicKICAgICAgOiAnJykpOwp9CgpmdW5jdGlvbiBkb0ZvcmdldEFsbERldmljZXMoKXsKICBjb25maXJtQWN0aW9uKCfguKLguIHguYDguKXguLTguIEgUElOIOC4muC4meC4',
  'l+C4uOC4geC5gOC4hOC4o+C4t+C5iOC4reC4h+C5g+C4iuC5iOC5hOC4q+C4oSDigJQg4LiX4Li44LiB4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiI4Liw4LiV4LmJ4Lit4LiH4Lil4LmH4Lit4LiB4Lit4Li04LiZ4LiU4LmJ4Lin4Lii4Lij4Lir4Lix4Liq4Lic4LmI',
  '4Liy4LiZ4LmD4Lir4Lih4LmIJywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2F1dGguZm9yZ2V0QWxsRGV2aWNlcycsIHt9KS50aGVuKGZ1bmN0aW9uKG4pewogICAgICBzYXZlRGV2aWNlKCcnKTsKICAgICAgdG9hc3QoJ+C4ouC4geC5gOC4peC4tOC4gSBQSU4g',
  '4LmB4Lil4LmJ4LinICcgKyBuICsgJyDguYDguITguKPguLfguYjguK3guIcnLCAnb2snKTsKICAgICAgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZSB8fCBlLCAnZXJyJyk7IH0pOwogIH0pOwp9',
  'CgovKiAtLS0tIOC4mOC4teC4oSAtLS0tICovCgpmdW5jdGlvbiBzZXR0aW5nc1RoZW1lQ2FyZCgpewogIHZhciBjdXIgPSBjdXJyZW50VGhlbWUoKTsKICByZXR1cm4gY2FyZCgn8J+OqCDguJjguLXguKHguKrguLXguKvguJnguYnguLLguIjguK0nLAogICAgJzxk',
  'aXYgY2xhc3M9InRoZW1lLXBpY2siPicgKyBUSEVNRVMubWFwKGZ1bmN0aW9uKHQpewogICAgICByZXR1cm4gJzxidXR0b24gY2xhc3M9InRoZW1lLW9wdCcgKyAodC5pZCA9PT0gY3VyID8gJyBvbicgOiAnJykgKyAnIiBvbmNsaWNrPSJzZXRUaGVtZShcJycgKyB0',
  'LmlkICsgJ1wnKSI+JyArCiAgICAgICAgJzxzcGFuIGNsYXNzPSJpYyI+JyArIHQuaWMgKyAnPC9zcGFuPicgKwogICAgICAgICc8Yj4nICsgZXNjKHQuaWQpICsgJzwvYj4nICsKICAgICAgICAnPHNwYW4gY2xhc3M9ImhpbnQiPicgKyBlc2ModC5oaW50KSArICc8',
  'L3NwYW4+JyArCiAgICAgICc8L2J1dHRvbj4nOwogICAgfSkuam9pbignJykgKyAnPC9kaXY+JyArCiAgICAnPHAgY2xhc3M9ImZzMTIgbXV0ZWQgbXQxMiI+4LiY4Li14Lih4LiI4Liz4LmB4Lii4LiB4Lij4Liy4Lii4LmA4LiE4Lij4Li34LmI4Lit4LiHIOC5gOC4',
  'm+C4peC4teC5iOC4ouC4meC4l+C4teC5iOC4meC4teC5iOC4q+C4o+C4t+C4reC4geC4lOC4m+C4uOC5iOC4oeC4o+C4ueC4m+C4nuC4o+C4sOC4reC4suC4l+C4tOC4leC4ouC5jC/guJ7guKPguLDguIjguLHguJnguJfguKPguYzguKHguLjguKHguILguKfguLLg',
  'uJrguJnguIHguYfguYTguJTguYknICsKICAgIChTLmJvb3QgJiYgUy5ib290LmlzQWRtaW4gPyAnIMK3IOC4hOC5iOC4suC4l+C4teC5iOC4nOC4ueC5ieC4lOC4ueC5geC4peC5gOC4peC4t+C4reC4geC4iOC4sOC5gOC4m+C5h+C4meC4hOC5iOC4suC4leC4seC5',
  'ieC4h+C4leC5ieC4meC5g+C4q+C5ieC5gOC4hOC4o+C4t+C5iOC4reC4h+C4l+C4teC5iOC4ouC4seC4h+C5hOC4oeC5iOC5gOC4hOC4ouC4leC4seC5ieC4hycgOiAnJykgKyAnPC9wPicpOwp9CgovKiAtLS0tIOC4geC4peC4uOC5iOC4oeC4hOC5iOC4suC4leC4',
  'seC5ieC4h+C4hOC5iOC4siAtLS0tICovCgpmdW5jdGlvbiBzZXR0aW5nc1JlYWRPbmx5Tm90ZSgpewogIHJldHVybiBjYXJkKCfimpnvuI8g4LiB4Liy4Lij4LiV4Lix4LmJ4LiH4LiE4LmI4Liy4Lij4Liw4Lia4LiaJywKICAgICc8ZGl2IGNsYXNzPSJlbXB0eSI+',
  'PGRpdiBjbGFzcz0iYmlnIj7wn5SSPC9kaXY+4LmA4LiJ4Lie4Liy4Liw4Lic4Li54LmJ4LiU4Li54LmB4Lil4LmA4LiX4LmI4Liy4LiZ4Lix4LmJ4LiZ4LiX4Li14LmI4LmB4LiB4LmJ4LiB4Liy4Lij4LiV4Lix4LmJ4LiH4LiE4LmI4Liy4Lij4Liw4Lia4Lia4LmE',
  '4LiU4LmJPC9kaXY+Jyk7Cn0KCmZ1bmN0aW9uIHNldHRpbmdzR3JvdXBzSHRtbChzKXsKICByZXR1cm4gcy5ncm91cHMubWFwKGZ1bmN0aW9uKGcpewogICAgcmV0dXJuIGNhcmQoZy5pY29uICsgJyAnICsgZy5ncm91cCwKICAgICAgJzxkaXYgY2xhc3M9ImZncmlk',
  'Ij4nICsgZy5pdGVtcy5tYXAoc2V0dGluZ0ZpZWxkSHRtbCkuam9pbignJykgKyAnPC9kaXY+Jyk7CiAgfSkuam9pbignJykgKwogIGNhcmQoJ/Cfkr4g4Lia4Lix4LiZ4LiX4Li24LiB4LiB4Liy4Lij4LiV4Lix4LmJ4LiH4LiE4LmI4LiyJywKICAgICc8cCBjbGFz',
  'cz0iZnMxMyBtdXRlZCI+JyArIGVzYyhzLnNlY3JldE5vdGUpICsgJzwvcD4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBvbmNsaWNrPSJzYXZlU2V0dGluZ3NGb3JtKCkiPuC4muC4seC4meC4',
  'l+C4tuC4geC4l+C4seC5ieC4h+C4q+C4oeC4lDwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJsb2FkKCkiPuC4ouC4geC5gOC4peC4tOC4geC4geC4suC4o+C5geC4geC5ieC5hOC4gjwvYnV0dG9uPicgKwogICAgJzwvZGl2',
  'PicpOwp9CgpmdW5jdGlvbiBzZXR0aW5nRmllbGRIdG1sKGl0KXsKICB2YXIgaWQgPSAnc18nICsgaXQua2V5OwogIHZhciBpbm5lcjsKICBpZiAoaXQucmVhZE9ubHkpIHsKICAgIGlubmVyID0gJzxkaXYgY2xhc3M9ImlucCIgc3R5bGU9ImJhY2tncm91bmQ6dmFy',
  'KC0tc3VyZmFjZS0yKTtjdXJzb3I6ZGVmYXVsdCI+JyArIGVzYyhpdC52YWx1ZSkgKyAnPC9kaXY+JzsKICB9IGVsc2UgaWYgKGl0LnR5cGUgPT09ICdzZWxlY3QnKSB7CiAgICAvLyDguJ3guLHguYjguIfguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYzg',
  'uKrguYjguIfguKHguLLguYDguJvguYfguJkge3ZhbHVlLGxhYmVsfSDguYDguKrguKHguK0g4oCUIOC4hOC5iOC4suC4l+C4teC5iOC5gOC4geC5h+C4muC4geC4seC4muC4guC5ieC4reC4hOC4p+C4suC4oeC4l+C4teC5iOC5gOC4q+C5h+C4meC4reC4suC4iOC4',
  'hOC4meC4peC4sOC4reC4seC4mQogICAgaW5uZXIgPSAnPHNlbGVjdCBjbGFzcz0ic2VsIiBpZD0iJyArIGlkICsgJyI+JyArIChpdC5vcHRpb25zIHx8IFtdKS5tYXAoZnVuY3Rpb24obyl7CiAgICAgIHJldHVybiAnPG9wdGlvbiB2YWx1ZT0iJyArIGVzYyhvLnZh',
  'bHVlKSArICciJyArIChvLnZhbHVlID09PSBpdC52YWx1ZSA/ICcgc2VsZWN0ZWQnIDogJycpICsKICAgICAgICAgICAgICc+JyArIGVzYyhvLmxhYmVsKSArICc8L29wdGlvbj4nOwogICAgfSkuam9pbignJykgKyAnPC9zZWxlY3Q+JzsKICB9IGVsc2UgaWYgKGl0',
  'LnR5cGUgPT09ICdtdWx0aWxpbmUnKSB7CiAgICBpbm5lciA9ICc8dGV4dGFyZWEgY2xhc3M9InRhIiBpZD0iJyArIGlkICsgJyI+JyArIGVzYyhpdC52YWx1ZSkgKyAnPC90ZXh0YXJlYT4nOwogIH0gZWxzZSBpZiAoaXQudHlwZSA9PT0gJ251bWJlcicpIHsKICAg',
  'IGlubmVyID0gJzxpbnB1dCB0eXBlPSJudW1iZXIiIGNsYXNzPSJpbnAiIGlkPSInICsgaWQgKyAnIiB2YWx1ZT0iJyArIGVzYyhpdC52YWx1ZSkgKyAnIiBpbnB1dG1vZGU9ImRlY2ltYWwiPic7CiAgfSBlbHNlIHsKICAgIGlubmVyID0gJzxpbnB1dCB0eXBlPSJ0',
  'ZXh0IiBjbGFzcz0iaW5wIiBpZD0iJyArIGlkICsgJyIgdmFsdWU9IicgKyBlc2MoaXQudmFsdWUpICsgJyI+JzsKICB9CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJmJyArIChpdC50eXBlID09PSAnbXVsdGlsaW5lJyA/ICcgZnVsbCcgOiAnJykgKyAnIj4nICsKICAg',
  'ICc8bGFiZWwgZm9yPSInICsgaWQgKyAnIj4nICsgZXNjKGl0LmxhYmVsKSArICc8L2xhYmVsPicgKyBpbm5lciArCiAgICAoaXQubm90ZSA/ICc8ZGl2IGNsYXNzPSJoaW50Ij4nICsgZXNjKGl0Lm5vdGUpICsgJzwvZGl2PicgOiAnJykgKyAnPC9kaXY+JzsKfQoK',
  'ZnVuY3Rpb24gc2F2ZVNldHRpbmdzRm9ybSgpewogIHZhciB2YWxzID0ge307CiAgdmFyIGRhdGEgPSBTLmNhY2hlLnNldHRpbmdzOwogIGlmICghZGF0YSkgcmV0dXJuOwogIGRhdGEuc2V0dGluZ3MuZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24oZyl7CiAgICBnLml0',
  'ZW1zLmZvckVhY2goZnVuY3Rpb24oaXQpewogICAgICBpZiAoaXQucmVhZE9ubHkpIHJldHVybjsKICAgICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NfJyArIGl0LmtleSk7CiAgICAgIGlmIChlbCkgdmFsc1tpdC5rZXldID0gZWwudmFsdWU7',
  'CiAgICB9KTsKICB9KTsKICBjYWxsQXBpKCdzZXR0aW5ncy5zYXZlJywgeyB2YWx1ZXM6IHZhbHMgfSkudGhlbihmdW5jdGlvbihyKXsKICAgIGlmICh2YWxzLnRoZW1lKSB7IGxzU2V0KExTX1RIRU1FLCB2YWxzLnRoZW1lKTsgYXBwbHlUaGVtZSh2YWxzLnRoZW1l',
  'KTsgfQogICAgdG9hc3Qoci5zYXZlZCA/ICfguJrguLHguJnguJfguLbguIHguYHguKXguYnguKcgJyArIHIuc2F2ZWQgKyAnIOC4o+C4suC4ouC4geC4suC4oycgOiAn4LmE4Lih4LmI4Lih4Li14Lit4Liw4LmE4Lij4LmA4Lib4Lil4Li14LmI4Lii4LiZ4LmB4Lib',
  '4Lil4LiHJywgJ29rJyk7CiAgICAvLyDguITguYjguLLguJrguLLguIfguJXguLHguKcgKOC4o+C4reC4muC4o+C4teC5gOC4n+C4o+C4iiDguIrguLfguYjguK3guK3guLLguITguLLguKMpIOC4oeC4teC4nOC4peC4geC4seC4muC4l+C4seC5ieC4h+C4q+C4meC5',
  'ieC4siDguIjguLbguIfguYLguKvguKXguJTguYPguKvguKHguYjguJfguLHguYnguIfguIrguLjguJQKICAgIHJldHVybiBjYWxsQXBpKCdhcHAuYm9vdHN0cmFwJykudGhlbihmdW5jdGlvbihiKXsgUy5ib290ID0gYjsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9',
  'KTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlIHx8IGUsICdlcnInKTsgfSk7Cn0KCi8qIC0tLS0g4LiI4Lix4LiU4LiB4Liy4Lij4Lic4Li54LmJ4LmD4LiK4LmJICjguJzguLnguYnguJTguLnguYHguKXguYDguJfguYjguLLguJnguLHg',
  'uYnguJkpIC0tLS0gKi8KCmZ1bmN0aW9uIGlzQWRtaW5Ob3coKXsKICByZXR1cm4gISEoUy5ib290ICYmIFMuYm9vdC5pc0FkbWluKTsKfQoKZnVuY3Rpb24gc2V0dGluZ3NVc2Vyc0NhcmQodXNlcnMpewogIGlmICghdXNlcnMpIHJldHVybiAnJzsKICByZXR1cm4g',
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
  'dHRvbj4nICsKICAgICAgICAgIChtZU5vdyA/ICcnIDogJzxidXR0b24gY2xhc3M9ImJ0biBzbSBkZ3IiIG9uY2xpY2s9ImRlbFVzZXIoJyArIGpzcSh1LnVzZXJuYW1lKSArICcpIj7guKXguJo8L2J1dHRvbj4nKSArCiAgICAgICAgJzwvdGQ+PC90cj4nOwogICAg',
  'fSkuam9pbignJykgKyAnPC90Ym9keT48L3RhYmxlPjwvZGl2PicsCiAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIHByaSBzbSIgb25jbGljaz0iZm9ybVVzZXIoKSI+KyDguYDguJ7guLTguYjguKHguJzguLnguYnguYPguIrguYk8L2J1dHRvbj4nKTsKfQoKZnVuY3Rp',
  'b24gcm9sZUJhZGdlKHJvbGUpewogIHZhciBjbHMgPSByb2xlID09PSAn4Lic4Li54LmJ4LiU4Li54LmB4LilJyA/ICdvaycgOiAocm9sZSA9PT0gJ+C5geC4geC5ieC5hOC4guC5hOC4lOC5iScgPyAnaW5mbycgOiAnbXV0ZScpOwogIHJldHVybiAnPHNwYW4gY2xh',
  'c3M9ImIgJyArIGNscyArICciPicgKyBlc2Mocm9sZSkgKyAnPC9zcGFuPic7Cn0KCi8vIOC4q+C4oeC4suC4ouC5gOC4q+C4leC4uDog4LmD4LiK4LmJIGF0dHIoKSDguJXguLHguKfguYDguJTguLXguKLguKfguIHguLHguJrguJfguLXguYggVmlld3MuaHRtbCDg',
  'uJvguKPguLDguIHguLLguKjguYTguKfguYkKLy8g4LmA4LiE4Lii4Lib4Lij4Liw4LiB4Liy4Lio4LiK4Li34LmI4Lit4LiL4LmJ4Liz4LmE4Lin4LmJ4LiV4Lij4LiH4LiZ4Li14LmJ4LiE4Lij4Lix4LmJ4LiH4Lir4LiZ4Li24LmI4LiHIOC5geC4peC5ieC4p+C5',
  'hOC4m+C4l+C4seC4muC4guC4reC4h+C5gOC4lOC4tOC4oeC4iOC4meC4m+C4uOC5iOC4oeC5geC4geC5ieC5hOC4guC4l+C4seC5ieC4h+C4o+C4sOC4muC4muC4nuC4seC4hwovLyAo4Lif4Lit4Lij4LmM4Lih4LiC4Li24LmJ4LiZ4Lin4LmI4Liy4LiHIOC5geC4',
  'peC4sOC4geC4lOC4muC4seC4meC4l+C4tuC4geC4geC4peC4suC4ouC5gOC4m+C5h+C4meC4quC4o+C5ieC4suC4h+C4o+C4suC4ouC4geC4suC4o+C5g+C4q+C4oeC5iOC5geC4l+C4meC4geC4suC4o+C5geC4geC5ieC4guC4reC4h+C5gOC4lOC4tOC4oSkKCmZ1',
  'bmN0aW9uIGZvcm1Vc2VyKGpzb24pewogIHZhciB1ID0ganNvbiA/ICh0eXBlb2YganNvbiA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKGpzb24pIDoganNvbikgOiB7fTsKICB2YXIgaXNOZXcgPSAhdS51c2VybmFtZTsKCiAgb3BlbkZvcm0oewogICAgdGl0bGU6',
  'IGlzTmV3ID8gJ+C5gOC4nuC4tOC5iOC4oeC4nOC4ueC5ieC5g+C4iuC5ieC5g+C4q+C4oeC5iCcgOiAn4LmB4LiB4LmJ4LmE4LiC4Lic4Li54LmJ4LmD4LiK4LmJICcgKyB1LnVzZXJuYW1lLAogICAgYWN0aW9uOiAndXNlci5zYXZlJywKICAgIHJlY29yZDogT2Jq',
  'ZWN0LmFzc2lnbih7IGlkOiBpc05ldyA/ICcnIDogdS51c2VybmFtZSwgcm9sZTogJ+C4lOC4ueC4reC4ouC5iOC4suC4h+C5gOC4lOC4teC4ouC4pycsIHN0YXR1czogJ+C5g+C4iuC5ieC4h+C4suC4mScgfSwgdSksCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6',
  'J3VzZXJuYW1lJywgbGFiZWw6J+C4iuC4t+C5iOC4reC4nOC4ueC5ieC5g+C4iuC5iSAo4Lig4Liy4Lip4Liy4Lit4Lix4LiH4LiB4Lik4LipKScsIHJlcXVpcmVkOmlzTmV3LCBwaDon4LmA4LiK4LmI4LiZIHNvbWNoYWknLAogICAgICAgIGhpbnQ6IGlzTmV3ID8g',
  'J2EteiAwLTkgLiBfIC0g4Lii4Liy4LinIDPigJMyNCDguJXguLHguKcgwrcg4LmA4Lib4Lil4Li14LmI4Lii4LiZ4Lig4Liy4Lii4Lir4Lil4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJJyA6ICfguYDguJvguKXguLXguYjguKLguJnguIrguLfguYjguK3guJzguLng',
  'uYnguYPguIrguYnguYTguKHguYjguYTguJTguYknIH0sCiAgICAgIHsga2V5OiduYW1lJywgbGFiZWw6J+C4iuC4t+C5iOC4reC4l+C4teC5iOC5geC4quC4lOC4hycsIHJlcXVpcmVkOnRydWUsIHBoOifguYDguIrguYjguJkg4Liq4Lih4LiK4Liy4LiiJyB9LAog',
  'ICAgICB7IGtleToncm9sZScsIGxhYmVsOifguKrguLTguJfguJjguLTguYzguIHguLLguKPguYPguIrguYnguIfguLLguJknLCB0eXBlOidzZWxlY3QnLCBibGFuazpmYWxzZSwgcmVxdWlyZWQ6dHJ1ZSwKICAgICAgICBvcHRpb25zOlsn4LiU4Li54Lit4Lii4LmI',
  '4Liy4LiH4LmA4LiU4Li14Lii4LinJywn4LmB4LiB4LmJ4LmE4LiC4LmE4LiU4LmJJywn4Lic4Li54LmJ4LiU4Li54LmB4LilJ10sCiAgICAgICAgaGludDon4LiU4Li54Lit4Lii4LmI4Liy4LiH4LmA4LiU4Li14Lii4LinID0g4LmA4Lib4Li04LiU4LiU4Li54LmE',
  '4LiU4LmJ4LiX4Li44LiB4Lir4LiZ4LmJ4LiyIMK3IOC5geC4geC5ieC5hOC4guC5hOC4lOC5iSA9IOC5gOC4nuC4tOC5iOC4oS/guYHguIHguYkv4Lil4Lia4LiC4LmJ4Lit4Lih4Li54LilIMK3IOC4nOC4ueC5ieC4lOC4ueC5geC4pSA9IOC4iOC4seC4lOC4geC4',
  'suC4o+C4nOC4ueC5ieC5g+C4iuC5ieC5geC4peC4sOC4geC4suC4o+C4leC4seC5ieC4h+C4hOC5iOC4suC5hOC4lOC5ieC4lOC5ieC4p+C4oicgfSwKICAgICAgeyBrZXk6J3Bhc3N3b3JkJywgbGFiZWw6IGlzTmV3ID8gJ+C4o+C4q+C4seC4quC4nOC5iOC4suC4',
  'meC5gOC4o+C4tOC5iOC4oeC4leC5ieC4mScgOiAn4LiV4Lix4LmJ4LiH4Lij4Lir4Lix4Liq4Lic4LmI4Liy4LiZ4LmD4Lir4Lih4LmIICjguYDguKfguYnguJnguKfguYjguLLguIcgPSDguYTguKHguYjguYDguJvguKXguLXguYjguKLguJkpJywKICAgICAgICBy',
  'ZXF1aXJlZDppc05ldywgcGg6J+C4reC4ouC5iOC4suC4h+C4meC5ieC4reC4oiA4IOC4leC4seC4p+C4reC4seC4geC4qeC4oycsCiAgICAgICAgaGludDon4LiI4LiU4LmE4Lin4LmJ4Liq4LmI4LiH4LmD4Lir4LmJ4LmA4LiI4LmJ4Liy4LiV4Lix4LinIOKAlCDg',
  'uKPguLDguJrguJrguYDguIHguYfguJrguYHguJrguJrguYDguILguYnguLLguKPguKvguLHguKog4LmA4Lib4Li04LiU4LiU4Li54Lii4LmJ4Lit4LiZ4Lir4Lil4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJJyB9LAogICAgICB7IGtleTonbXVzdENoYW5nZScsIGxh',
  'YmVsOifguYPguKvguYnguYDguJvguKXguLXguYjguKLguJnguKPguKvguLHguKrguJzguYjguLLguJnguJXguK3guJnguYDguILguYnguLLguITguKPguLHguYnguIfguYHguKPguIEnLCB0eXBlOidzZWxlY3QnLCBibGFuazpmYWxzZSwKICAgICAgICBvcHRpb25z',
  'Olt7dmFsdWU6J3RydWUnLGxhYmVsOifguYPguIrguYggKOC5geC4meC4sOC4meC4syknfSx7dmFsdWU6J2ZhbHNlJyxsYWJlbDon4LmE4Lih4LmI4LiV4LmJ4Lit4LiHJ31dIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywg',
  'dHlwZTonc2VsZWN0JywgYmxhbms6ZmFsc2UsIG9wdGlvbnM6WyfguYPguIrguYnguIfguLLguJknLCfguKPguLDguIfguLHguJonXSwKICAgICAgICBoaW50OifguKPguLDguIfguLHguJogPSDguYDguILguYnguLLguKPguLDguJrguJrguYTguKHguYjguYTguJTg',
  'uYnguJfguLHguJnguJfguLUg4LmB4LiV4LmI4Lii4Lix4LiH4LmA4LiB4LmH4Lia4Lia4Lix4LiN4LiK4Li14LmE4Lin4LmJJyB9LAogICAgICB7IGtleTonbm90ZScsIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1',
  'bGw6dHJ1ZSB9CiAgICBdLAogICAgd2lkZTogdHJ1ZQogIH0pOwoKICAvLyDguIrguLfguYjguK3guJzguLnguYnguYPguIrguYnguYDguJvguKXguLXguYjguKLguJnguYTguKHguYjguYTguJTguYkg4Lil4LmH4Lit4LiB4LiK4LmI4Lit4LiH4LmE4Lin4LmJ4LmA',
  '4Lil4Lii4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4LmA4LiC4LmJ4Liy4LmD4LiI4Lic4Li04LiUCiAgaWYgKCFpc05ldykgewogICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfdXNlcm5hbWUnKTsKICAgIGlmIChlbCkgeyBlbC5yZWFkT25s',
  'eSA9IHRydWU7IGVsLnN0eWxlLmJhY2tncm91bmQgPSAndmFyKC0tc3VyZmFjZS0yKSc7IH0KICB9Cn0KCmZ1bmN0aW9uIGRlbFVzZXIodXNlcm5hbWUpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4nOC4ueC5ieC5g+C4iuC5iSAiJyArIHVzZXJuYW1lICsgJyIg',
  '4LmD4LiK4LmI4LmE4Lir4LihIOKAlCDguYDguILguYnguLLguKPguLDguJrguJrguYTguKHguYjguYTguJTguYnguK3guLXguIHguJfguLHguJnguJfguLUnLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgndXNlci5kZWxldGUnLCB7IHVzZXJuYW1lOiB1c2VybmFt',
  'ZSB9KS50aGVuKGZ1bmN0aW9uKCl7CiAgICAgIHRvYXN0KCfguKXguJrguJzguLnguYnguYPguIrguYnguYHguKXguYnguKcnLCAnb2snKTsKICAgICAgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2Fn',
  'ZSB8fCBlLCAnZXJyJyk7IH0pOwogIH0pOwp9CgovKiAtLS0tIOC4peC4tOC4h+C4geC5jOC5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4mSAtLS0tICovCgpmdW5jdGlvbiBzZXR0aW5nc1NoYXJlQ2FyZChsaW5rcyl7CiAgaWYgKCFsaW5rcyB8fCAhbGlua3Mu',
  'YXBwVXJsKSB7CiAgICByZXR1cm4gY2FyZCgn8J+UlyDguKXguLTguIfguIHguYzguYDguILguYnguLLguYPguIrguYnguIfguLLguJknLAogICAgICAnPGRpdiBjbGFzcz0iZW1wdHkiPuC4ouC4seC4h+C4q+C4suC4peC4tOC4h+C4geC5jOC4iOC4o+C4tOC4h+C5',
  'hOC4oeC5iOC5gOC4iOC4rSDigJQg4LmA4Lib4Li04LiU4LmA4Lin4LmH4Lia4LmB4Lit4Lib4LiI4Liy4LiB4Lil4Li04LiH4LiB4LmM4LiX4Li14LmI4Lil4LiH4LiX4LmJ4Liy4LiiIC9leGVjIOC4quC4seC4geC4hOC4o+C4seC5ieC4hyDguYHguKXguYnguKfg',
  'uKPguLDguJrguJrguIjguLDguIjguLPguYPguKvguYnguYDguK3guIc8L2Rpdj4nKTsKICB9CiAgcmV0dXJuIGNhcmQoJ/CflJcg4Lil4Li04LiH4LiB4LmM4LmA4LiC4LmJ4Liy4LmD4LiK4LmJ4LiH4Liy4LiZJywKICAgICc8ZGl2IGNsYXNzPSJmIG1iMTIiPjxs',
  'YWJlbD7guKXguLTguIfguIHguYzguKvguKXguLHguIEg4oCUIOC4quC5iOC4h+C5g+C4q+C5ieC4l+C4uOC4geC4hOC4meC5hOC4lOC5iSAo4LmA4LiC4LmJ4Liy4LiU4LmJ4Lin4Lii4LiK4Li34LmI4Lit4Lic4Li54LmJ4LmD4LiK4LmJ4LmB4Lil4Liw4Lij4Lir',
  '4Lix4Liq4Lic4LmI4Liy4LiZKTwvbGFiZWw+JyArCiAgICAgICc8aW5wdXQgY2xhc3M9ImlucCIgaWQ9ImFwcFVybCIgcmVhZG9ubHkgdmFsdWU9IicgKyBlc2MobGlua3MuYXBwVXJsKSArICciIG9uY2xpY2s9InRoaXMuc2VsZWN0KCkiPjwvZGl2PicgKwogICAg',
  'JzxkaXYgY2xhc3M9InJvdyBtYjEyIj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIG9uY2xpY2s9ImNvcHlGaWVsZChcJ2FwcFVybFwnKSI+8J+TiyDguITguLHguJTguKXguK3guIHguKXguLTguIfguIHguYzguKvguKXguLHguIE8L2J1dHRvbj4n',
  'ICsKICAgICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJociI+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iZiBtYjEyIj48bGFiZWw+8J+RgCDguKXguLTguIfguIHguYzguJTguLnguK3guKLguYjguLLguIfguYDguJTguLXguKLguKfguYHguJrguJrguYTg',
  'uKHguYjguJXguYnguK3guIfguKXguYfguK3guIHguK3guLTguJk8L2xhYmVsPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIGlkPSJzaGFyZVVybCIgcmVhZG9ubHkgdmFsdWU9IicgKyBlc2MobGlua3Mudmlld1VybCkgKyAnIiBvbmNsaWNrPSJ0aGlzLnNl',
  'bGVjdCgpIj48L2Rpdj4nICsKICAgICc8cCBjbGFzcz0iZnMxMiAnICsgKGxpbmtzLnNoYXJlRW5hYmxlZCA/ICdtdXRlZCcgOiAnd2Fybi10ZXh0JykgKyAnIj4nICsKICAgICAgKGxpbmtzLnNoYXJlRW5hYmxlZAogICAgICAgID8gJ+C5gOC4m+C4tOC4lOC4reC4',
  'ouC4ueC5iCDigJQg4LmD4LiE4Lij4LiB4LmH4LiV4Liy4Lih4LiX4Li14LmI4Lih4Li14Lil4Li04LiH4LiB4LmM4LiZ4Li14LmJ4LmA4Lib4Li04LiU4LiU4Li54LiC4LmJ4Lit4Lih4Li54Lil4LmE4LiU4LmJ4LmC4LiU4Lii4LmE4Lih4LmI4LiV4LmJ4Lit4LiH',
  '4Lil4LmH4Lit4LiB4Lit4Li04LiZJwogICAgICAgIDogJ+KaoO+4jyDguJvguLTguJTguK3guKLguLnguYgg4oCUIOC4peC4tOC4h+C4geC5jOC4meC4teC5ieC4ouC4seC4h+C5g+C4iuC5ieC5hOC4oeC5iOC5hOC4lOC5iSDguYDguJvguLTguJTguKrguKfguLTg',
  'uJXguIrguYzguYTguJTguYnguJfguLXguYjguKvguLHguKfguILguYnguK0gIuC4hOC4p+C4suC4oeC4m+C4peC4reC4lOC4oOC4seC4ouC5geC4peC4sOC4geC4suC4o+C5gOC4guC5ieC4suC5g+C4iuC5ieC4h+C4suC4mSIg4LiU4LmJ4Liy4LiZ4Lia4LiZJykg',
  'KwogICAgJzwvcD4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQxMiI+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4iIG9uY2xpY2s9ImNvcHlGaWVsZChcJ3NoYXJlVXJsXCcpIj7wn5OLIOC4hOC4seC4lOC4peC4reC4geC4peC4tOC4h+C4geC5jOC5geC4',
  'iuC4o+C5jDwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiBjbGFzcz0iYnRuIGRnciIgb25jbGljaz0iZG9Sb3RhdGVTaGFyZSgpIj7wn5SBIOC4reC4reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC5g+C4q+C4oeC5iDwvYnV0dG9uPicgKwogICAgJzwv',
  'ZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImhyIj48L2Rpdj4nICsKICAgICc8cCBjbGFzcz0iZnMxMiBtdXRlZCI+8J+GmCDguKXguLTguIfguIHguYzguIHguLnguYnguKPguLDguJrguJogKOC5g+C4iuC5ieC4leC4reC4meC4peC4t+C4oeC4o+C4q+C4seC4quC4',
  'nOC5iOC4suC4meC4iOC4meC5gOC4guC5ieC4suC5hOC4oeC5iOC5hOC4lOC5iSDigJQg4Lir4LmJ4Liy4Lih4Liq4LmI4LiH4LiV4LmI4LitKTxicj4nICsKICAgICc8Y29kZSBjbGFzcz0iZnMxMiI+JyArIGVzYyhsaW5rcy5hZG1pblVybCkgKyAnPC9jb2RlPjwv',
  'cD4nKTsKfQoKZnVuY3Rpb24gY29weUZpZWxkKGlkKXsKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7CiAgaWYgKCFlbCkgcmV0dXJuOwogIGVsLnNlbGVjdCgpOwogIHRyeSB7IGRvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7IHRvYXN0',
  'KCfguITguLHguJTguKXguK3guIHguYHguKXguYnguKcnLCAnb2snKTsgfQogIGNhdGNoIChlKSB7IHRvYXN0KCfguIHguJTguITguYnguLLguIfguJfguLXguYjguIrguYjguK3guIfguYHguKXguYnguKfguYDguKXguLfguK3guIEg4LiE4Lix4LiU4Lil4Lit4LiB',
  'JywgJ2VycicpOyB9Cn0KPC9zY3JpcHQ+CjxzY3JpcHQ+Ci8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICBGb3Jtcy5odG1sIOKAlCDguJ/guK3guKPguYzguKHguYDguJ7guLTguYjguKEv4LmB4LiB',
  '4LmJ4LmE4LiCIOC5geC4peC4sOC4geC4suC4o+C4peC4mgogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KCnZhciBGT1JNID0gewogIHNwZWNzOiBbXSwgICAgICAgLy8g4Lic4Lix4LiH4LiK4LmI',
  '4Lit4LiH4LiB4Lij4Lit4LiB4LiC4Lit4LiH4Lif4Lit4Lij4LmM4Lih4LiX4Li14LmI4LmA4Lib4Li04LiU4Lit4Lii4Li54LmICiAga2VlcDoge30sICAgICAgICAvLyDguYTguJ/guKXguYzguYHguJnguJrguYDguJTguLTguKHguJfguLXguYjguKLguLHguIfg',
  'uYTguKHguYjguYTguJTguYnguYDguK3guLLguK3guK3guIEKICBidWNrZXQ6ICdtaXNjJywgIC8vIOC5guC4n+C4peC5gOC4lOC4reC4o+C5jOC4l+C4teC5iOC4iOC4sOC5gOC4geC5h+C4muC5hOC4n+C4peC5jOC5geC4meC4muC5g+C4q+C4oeC5iAogIG9jcjog',
  'bnVsbCwgICAgICAgLy8g4Lic4Lix4LiH4LiB4Liy4Lij4LmA4LiV4Li04Lih4LiE4LmI4Liy4LiI4Liy4LiB4Lij4Li54LibCiAgcmVjOiBudWxsLCAgICAgICAvLyDguKPguLLguKLguIHguLLguKPguJfguLXguYjguIHguLPguKXguLHguIfguYHguIHguYnguK3g',
  'uKLguLnguYggKG51bGwgPSDguIHguLPguKXguLHguIfguYDguJ7guLTguYjguKHguKPguLLguKLguIHguLLguKPguYPguKvguKHguYgpCiAgbGluZXM6IFtdLCAgICAgICAvLyDguKPguLLguKLguIHguLLguKPguKLguYjguK3guKLguYPguJnguJrguLTguKUgKOC5',
  'g+C4iuC5ieC4geC4seC4muC4iuC5iOC4reC4h+C4iuC4meC4tOC4lCBsaW5lcykKICB0b2RvOiBbXSwgICAgICAgIC8vIOC5gOC4iuC5h+C4hOC4peC4tOC4quC4leC5jOC4h+C4suC4meC4i+C5iOC4reC4oSAo4LmD4LiK4LmJ4LiB4Lix4Lia4LiK4LmI4Lit4LiH',
  '4LiK4LiZ4Li04LiUIHRvZG8pCiAgdG9kb09wdGlvbnM6IFtdICAvLyDguJXguLHguKfguYDguKXguLfguK3guIHguJvguKPguLDguYDguKDguJfguIfguLLguJnguILguK3guIfguYHguJXguYjguKXguLDguILguYnguK0KfTsKCi8qIC0tLS0tLS0tLS0tLS0tLS0g',
  'Zm9ybSBlbmdpbmUgLS0tLS0tLS0tLS0tLS0tLSAqLwoKZnVuY3Rpb24gZmllbGRzSHRtbChzcGVjcywgcmVjKXsKICByZWMgPSByZWMgfHwge307CiAgRk9STS5zcGVjcyA9IHNwZWNzOwogIEZPUk0ua2VlcCA9IHt9OwogIHJldHVybiAnPGRpdiBjbGFzcz0iZmdy',
  'aWQiPicgKyBzcGVjcy5tYXAoZnVuY3Rpb24oZil7CiAgICB2YXIgdiA9IHJlY1tmLmtleV07CiAgICB2YXIgaWQgPSAnZl8nICsgZi5rZXk7CiAgICB2YXIgaW5uZXI7CgogICAgaWYgKGYudHlwZSA9PT0gJ3NlbGVjdCcpIHsKICAgICAgdmFyIG9wdHMgPSAoZi5v',
  'cHRpb25zIHx8IFtdKS5tYXAoZnVuY3Rpb24obyl7CiAgICAgICAgdmFyIHZhbCA9IHR5cGVvZiBvID09PSAnb2JqZWN0JyA/IG8udmFsdWUgOiBvOwogICAgICAgIHZhciBsYWIgPSB0eXBlb2YgbyA9PT0gJ29iamVjdCcgPyBvLmxhYmVsIDogbzsKICAgICAgICBy',
  'ZXR1cm4gJzxvcHRpb24gdmFsdWU9IicgKyBlc2ModmFsKSArICciJyArIChTdHJpbmcodikgPT09IFN0cmluZyh2YWwpID8gJyBzZWxlY3RlZCcgOiAnJykgKyAnPicgKyBlc2MobGFiKSArICc8L29wdGlvbj4nOwogICAgICB9KS5qb2luKCcnKTsKICAgICAgaW5u',
  'ZXIgPSAnPHNlbGVjdCBjbGFzcz0ic2VsIiBpZD0iJyArIGlkICsgJyI+JyArIChmLmJsYW5rICE9PSBmYWxzZSA/ICc8b3B0aW9uIHZhbHVlPSIiPuKAlCDguYDguKXguLfguK3guIEg4oCUPC9vcHRpb24+JyA6ICcnKSArIG9wdHMgKyAnPC9zZWxlY3Q+JzsKCiAg',
  'ICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ3RleHRhcmVhJykgewogICAgICBpbm5lciA9ICc8dGV4dGFyZWEgY2xhc3M9InRhIiBpZD0iJyArIGlkICsgJyIgcGxhY2Vob2xkZXI9IicgKyBlc2MoZi5waHx8JycpICsgJyI+JyArIGVzYyh2fHwnJykgKyAnPC90ZXh0',
  'YXJlYT4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnZmlsZXMnKSB7CiAgICAgIEZPUk0ua2VlcFtmLmtleV0gPSAocmVjW2Yua2V5XSAmJiByZWNbZi5rZXldLmxlbmd0aCkgPyBbXS5jb25jYXQocmVjW2Yua2V5XSkgOiBbXTsKICAgICAgaW5uZXIgPQog',
  'ICAgICAgICc8ZGl2IGlkPSInICsgaWQgKyAnX2V4aXN0aW5nIj4nICsgZXhpc3RpbmdGaWxlc0h0bWwoZi5rZXkpICsgJzwvZGl2PicgKwogICAgICAgICc8bGFiZWwgY2xhc3M9ImZpbGUtZHJvcCIgZm9yPSInICsgaWQgKyAnIj7wn5OOIOC5geC4leC4sOC5gOC4',
  'nuC4t+C5iOC4reC5gOC4peC4t+C4reC4geC5hOC4n+C4peC5jCAo4LmA4Lil4Li34Lit4LiB4LmE4LiU4LmJ4Lir4Lil4Liy4Lii4LmE4Lif4Lil4LmMIMK3IOC5hOC4oeC5iOC5gOC4geC4tOC4mSAxMiBNQiDguJXguYjguK3guYTguJ/guKXguYwpJyArCiAgICAg',
  'ICAgJzxpbnB1dCB0eXBlPSJmaWxlIiBpZD0iJyArIGlkICsgJyIgbXVsdGlwbGUgYWNjZXB0PSJpbWFnZS8qLGFwcGxpY2F0aW9uL3BkZiIgc3R5bGU9ImRpc3BsYXk6bm9uZSIgJyArCiAgICAgICAgJ29uY2hhbmdlPSJwcmV2aWV3UGlja2VkKHRoaXMsXCcnICsg',
  'aWQgKyAnXCcpIj48L2xhYmVsPicgKwogICAgICAgICc8ZGl2IGlkPSInICsgaWQgKyAnX3ByZXZpZXciIGNsYXNzPSJ0aHVtYnMgbXQ4Ij48L2Rpdj4nICsKICAgICAgICAnPGRpdiBpZD0iJyArIGlkICsgJ19vY3IiPjwvZGl2Pic7CgogICAgfSBlbHNlIGlmIChm',
  'LnR5cGUgPT09ICd0b2RvJykgewogICAgICBGT1JNLnRvZG8gPSBwYXJzZVRvZG9UZXh0KHYpOwogICAgICBGT1JNLnRvZG9PcHRpb25zID0gZi5vcHRpb25zIHx8IFtdOwogICAgICBpbm5lciA9ICc8ZGl2IGlkPSInICsgaWQgKyAnIiBjbGFzcz0idG9kbyI+JyAr',
  'IHRvZG9UYWJsZUh0bWwoKSArICc8L2Rpdj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnbGluZXMnKSB7CiAgICAgIEZPUk0ubGluZXMgPSBwYXJzZUxpbmVzVGV4dCh2KTsKICAgICAgaW5uZXIgPSAnPGRpdiBpZD0iJyArIGlkICsgJyIgY2xhc3M9Imxp',
  'bmVzIj4nICsgbGluZXNUYWJsZUh0bWwoKSArICc8L2Rpdj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnY29tcHV0ZWQnKSB7CiAgICAgIGlubmVyID0gJzxkaXYgY2xhc3M9ImlucCIgaWQ9IicgKyBpZCArICciIHN0eWxlPSJiYWNrZ3JvdW5kOnZhcigt',
  'LXN1cmZhY2UtMik7Zm9udC13ZWlnaHQ6NjAwOycgKwogICAgICAgICAgICAgICdmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7Y3Vyc29yOmRlZmF1bHQiPjA8L2Rpdj4nOwoKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAnZGF0ZScpIHsKICAgICAg',
  'aW5uZXIgPSAnPGlucHV0IHR5cGU9ImRhdGUiIGNsYXNzPSJpbnAiIGlkPSInICsgaWQgKyAnIiB2YWx1ZT0iJyArIGVzYyh2IHx8ICcnKSArICciPic7CgogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICdudW1iZXInIHx8IGYudHlwZSA9PT0gJ21vbmV5Jykgewog',
  'ICAgICBpbm5lciA9ICc8aW5wdXQgdHlwZT0ibnVtYmVyIiBzdGVwPSInICsgKGYudHlwZSA9PT0gJ21vbmV5JyA/ICcwLjAxJyA6ICcxJykgKyAnIiBjbGFzcz0iaW5wIiBpZD0iJyArIGlkICsgJyIgJyArCiAgICAgICAgICAgICAgJ3ZhbHVlPSInICsgKHYgPT0g',
  'bnVsbCB8fCB2ID09PSAnJyA/ICcnIDogZXNjKHYpKSArICciIHBsYWNlaG9sZGVyPSInICsgZXNjKGYucGh8fCcnKSArICciIGlucHV0bW9kZT0iZGVjaW1hbCInICsKICAgICAgICAgICAgICAoZi5zdW1zID8gJyBvbmlucHV0PSJyZWNhbGNTdW1zKCkiJyA6IChm',
  'Lm9uaW5wdXQgPyAnIG9uaW5wdXQ9IicgKyBlc2MoZi5vbmlucHV0KSArICciJyA6ICcnKSkgKyAnPic7CgogICAgfSBlbHNlIHsKICAgICAgaW5uZXIgPSAnPGlucHV0IHR5cGU9InRleHQiIGNsYXNzPSJpbnAiIGlkPSInICsgaWQgKyAnIiB2YWx1ZT0iJyArIGVz',
  'Yyh2IHx8ICcnKSArICciIHBsYWNlaG9sZGVyPSInICsgZXNjKGYucGh8fCcnKSArICciPic7CiAgICB9CgogICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJmJyArIChmLmZ1bGwgPyAnIGZ1bGwnIDogJycpICsgJyI+JyArCiAgICAgICc8bGFiZWwgZm9yPSInICsgaWQg',
  'KyAnIj4nICsgZXNjKGYubGFiZWwpICsgKGYucmVxdWlyZWQgPyAnIDxzcGFuIHN0eWxlPSJjb2xvcjp2YXIoLS1kYW5nZXIpIj4qPC9zcGFuPicgOiAnJykgKyAnPC9sYWJlbD4nICsKICAgICAgaW5uZXIgKyAoZi5oaW50ID8gJzxkaXYgY2xhc3M9ImhpbnQiPicg',
  'KwogICAgICAgIChmLmhpbnQuY2hhckF0KDApID09PSAnPCcgPyBmLmhpbnQgOiBlc2MoZi5oaW50KSkgKyAnPC9kaXY+JyA6ICcnKSArICc8L2Rpdj4nOwogIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguYDguIrguYfguITguKXguLTguKrguJXguYzguIfguLLguJnguIvguYjguK3guKEg4oCUIOC5gOC4guC5ieC4suC4i+C5iOC4reC4oeC4hOC4o+C4seC5ieC4h+C5gOC4lOC4teC4ouC4p+C4oeC4seC4',
  'geC4i+C5iOC4reC4oeC4q+C4peC4suC4ouC4iOC4uOC4lAoKICAg4LmA4LiB4LmH4Lia4Lil4LiH4LiK4Li14LiV4Lia4Lij4Lij4LiX4Lix4LiU4Lil4Liw4LiH4Liy4LiZICBbeF0g4LiK4Li34LmI4Lit4LiH4Liy4LiZIHwg4Lib4Lij4Liw4LmA4Lig4LiX4LiH',
  '4Liy4LiZCiAgICjguKPguLnguJvguYHguJrguJrguYDguJTguLXguKLguKfguIHguLHguJogcGFyc2VUb2RvXyDguJ3guLHguYjguIfguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYwg4oCUIOC5geC4geC5ieC4l+C4teC5iOC5hOC4q+C4meC4leC5ieC4',
  'reC4h+C5geC4geC5ieC5g+C4q+C5ieC4leC4o+C4h+C4geC4seC4mSkKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgpmdW5jdGlvbiBwYXJzZVRvZG9UZXh0KHRleHQpewogIHZhciByYXcg',
  'PSBTdHJpbmcodGV4dCA9PSBudWxsID8gJycgOiB0ZXh0KTsKICBpZiAoIXJhdy50cmltKCkpIHJldHVybiBbXTsKICB2YXIgbGluZXMgPSByYXcuc3BsaXQoL1xyP1xuLykubWFwKGZ1bmN0aW9uKGwpeyByZXR1cm4gbC50cmltKCk7IH0pLmZpbHRlcihCb29sZWFu',
  'KTsKCiAgLy8g4LiC4Lit4LiH4LmA4LiU4Li04Lih4LmA4LiC4Li14Lii4LiZ4Lij4Lin4Lih4Lia4Lij4Lij4LiX4Lix4LiU4LmA4LiU4Li14Lii4Lin4Lin4LmI4LiyICIxLuC4ouC4suC5geC4meC4pyAyLuC5gOC4geC5h+C4muC4quC4teC4q+C5ieC4reC4hyIK',
  'ICBpZiAobGluZXMubGVuZ3RoID09PSAxICYmIC9cZFxzKlsuKV0vLnRlc3QobGluZXNbMF0pICYmIGxpbmVzWzBdLmNoYXJBdCgwKSAhPT0gJ1snKSB7CiAgICBsaW5lcyA9IGxpbmVzWzBdLnNwbGl0KC9ccypcZCtccypbLildXHMqLykubWFwKGZ1bmN0aW9uKHgp',
  'eyByZXR1cm4geC50cmltKCk7IH0pLmZpbHRlcihCb29sZWFuKTsKICB9CgogIHJldHVybiBsaW5lcy5tYXAoZnVuY3Rpb24obGluZSl7CiAgICB2YXIgZG9uZSA9IGZhbHNlOwogICAgdmFyIG0gPSBsaW5lLm1hdGNoKC9eXFtccyooW3hY4pyTXSk/XHMqXF1ccyoo',
  'LiopJC8pOwogICAgaWYgKG0pIHsgZG9uZSA9ICEhbVsxXTsgbGluZSA9IG1bMl07IH0KICAgIGxpbmUgPSBsaW5lLnJlcGxhY2UoL15cZCtccypbLildXHMqLywgJycpLnRyaW0oKTsKICAgIHZhciBhID0gbGluZS5zcGxpdCgnfCcpOwogICAgcmV0dXJuIHsgZG9u',
  'ZTogZG9uZSwgbmFtZTogKGFbMF0gfHwgJycpLnRyaW0oKSwgY2F0ZWdvcnk6IChhWzFdIHx8ICcnKS50cmltKCkgfTsKICB9KS5maWx0ZXIoZnVuY3Rpb24odCl7IHJldHVybiB0Lm5hbWU7IH0pOwp9CgpmdW5jdGlvbiBmb3JtYXRUb2RvVGV4dChsaXN0KXsKICBy',
  'ZXR1cm4gKGxpc3QgfHwgW10pCiAgICAuZmlsdGVyKGZ1bmN0aW9uKHQpeyByZXR1cm4gU3RyaW5nKHQubmFtZSB8fCAnJykudHJpbSgpOyB9KQogICAgLm1hcChmdW5jdGlvbih0KXsKICAgICAgdmFyIG5tID0gU3RyaW5nKHQubmFtZSkucmVwbGFjZSgvXHwvZywg',
  'Jy8nKS50cmltKCk7CiAgICAgIHZhciBjdCA9IFN0cmluZyh0LmNhdGVnb3J5IHx8ICcnKS5yZXBsYWNlKC9cfC9nLCAnLycpLnRyaW0oKTsKICAgICAgcmV0dXJuICdbJyArICh0LmRvbmUgPyAneCcgOiAnICcpICsgJ10gJyArIG5tICsgKGN0ID8gJyB8ICcgKyBj',
  'dCA6ICcnKTsKICAgIH0pLmpvaW4oJ1xuJyk7Cn0KCmZ1bmN0aW9uIHRvZG9Eb25lKCl7IHJldHVybiAoRk9STS50b2RvIHx8IFtdKS5maWx0ZXIoZnVuY3Rpb24odCl7IHJldHVybiB0LmRvbmU7IH0pLmxlbmd0aDsgfQoKZnVuY3Rpb24gdG9kb1RhYmxlSHRtbCgp',
  'ewogIHZhciBvcHRzID0gRk9STS50b2RvT3B0aW9ucyB8fCBbXTsKICB2YXIgcm93cyA9IChGT1JNLnRvZG8gfHwgW10pLm1hcChmdW5jdGlvbih0LCBpKXsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0idG9kby1yb3cnICsgKHQuZG9uZSA/ICcgZG9uZScgOiAnJykg',
  'KyAnIj4nICsKICAgICAgJzxsYWJlbCBjbGFzcz0idG9kby1jaGVjayIgdGl0bGU9IicgKyAodC5kb25lID8gJ+C4l+C4s+C5gOC4quC4o+C5h+C4iOC5geC4peC5ieC4pycgOiAn4Lii4Lix4LiH4LmE4Lih4LmI4LmE4LiU4LmJ4LiX4LizJykgKyAnIj4nICsKICAg',
  'ICAgICAnPGlucHV0IHR5cGU9ImNoZWNrYm94IicgKyAodC5kb25lID8gJyBjaGVja2VkJyA6ICcnKSArICcgb25jaGFuZ2U9InNldFRvZG8oJyArIGkgKyAnLFwnZG9uZVwnLHRoaXMuY2hlY2tlZCkiPicgKwogICAgICAnPC9sYWJlbD4nICsKICAgICAgJzxpbnB1',
  'dCBjbGFzcz0iaW5wIiBwbGFjZWhvbGRlcj0i4LiH4Liy4LiZ4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LiL4LmI4Lit4LihIiB2YWx1ZT0iJyArIGVzYyh0Lm5hbWUgfHwgJycpICsgJyIgJyArCiAgICAgICAgJ29uaW5wdXQ9InNldFRvZG8oJyArIGkgKyAnLFwnbmFt',
  'ZVwnLHRoaXMudmFsdWUpIj4nICsKICAgICAgJzxzZWxlY3QgY2xhc3M9InNlbCIgb25jaGFuZ2U9InNldFRvZG8oJyArIGkgKyAnLFwnY2F0ZWdvcnlcJyx0aGlzLnZhbHVlKSI+JyArCiAgICAgICAgJzxvcHRpb24gdmFsdWU9IiI+4oCUIOC4m+C4o+C4sOC5gOC4',
  'oOC4l+C4h+C4suC4mSDigJQ8L29wdGlvbj4nICsKICAgICAgICBvcHRzLm1hcChmdW5jdGlvbihvKXsKICAgICAgICAgIHJldHVybiAnPG9wdGlvbiB2YWx1ZT0iJyArIGVzYyhvKSArICciJyArIChvID09PSB0LmNhdGVnb3J5ID8gJyBzZWxlY3RlZCcgOiAnJykg',
  'KyAnPicgKyBlc2MobykgKyAnPC9vcHRpb24+JzsKICAgICAgICB9KS5qb2luKCcnKSArCiAgICAgICc8L3NlbGVjdD4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIGRnciIgdGl0bGU9IuC5gOC4reC4suC4h+C4suC4meC4meC4',
  'teC5ieC4reC4reC4gSIgb25jbGljaz0iZGVsVG9kbygnICsgaSArICcpIj7DlzwvYnV0dG9uPicgKwogICAgJzwvZGl2Pic7CiAgfSkuam9pbignJyk7CgogIHZhciBuID0gKEZPUk0udG9kbyB8fCBbXSkubGVuZ3RoLCBkID0gdG9kb0RvbmUoKTsKICByZXR1cm4g',
  'KHJvd3MgfHwgJzxkaXYgY2xhc3M9ImhpbnQiIHN0eWxlPSJwYWRkaW5nOjhweCAycHgiPuC4ouC4seC4h+C5hOC4oeC5iOC4oeC4teC4h+C4suC4mSDigJQg4LiB4LiUIOKAnOC5gOC4nuC4tOC5iOC4oeC4h+C4suC4meKAnSDguYDguJ7guLfguYjguK3guYPguKrg',
  'uYjguJfguLXguKXguLDguIjguLjguJTguJfguLXguYjguJXguYnguK3guIfguIvguYjguK3guKE8L2Rpdj4nKSArCiAgICAnPGRpdiBjbGFzcz0icm93IG10OCI+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0i',
  'YWRkVG9kbygpIj4rIOC5gOC4nuC4tOC5iOC4oeC4h+C4suC4mTwvYnV0dG9uPicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9InBhc3RlVG9kbygpIj7wn5OLIOC4p+C4suC4h+C4l+C4teC5gOC4lOC4teC4ouC4',
  'p+C4q+C4peC4suC4ouC4h+C4suC4mTwvYnV0dG9uPicgKwogICAgICAobiA/ICc8ZGl2IGNsYXNzPSJ0b2RvLWNvdW50Ij7guYDguKrguKPguYfguIjguYHguKXguYnguKcgPGI+JyArIGQgKyAnLycgKyBuICsgJzwvYj4g4LiH4Liy4LiZPC9kaXY+JyA6ICcnKSAr',
  'CiAgICAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gcmVkcmF3VG9kbygpewogIHZhciBib3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9pdGVtcycpOwogIGlmICghYm94KSByZXR1cm47CiAgYm94LmlubmVySFRNTCA9IHRvZG9UYWJsZUh0bWwoKTsKfQoKZnVu',
  'Y3Rpb24gc2V0VG9kbyhpLCBrZXksIHZhbCl7CiAgaWYgKCFGT1JNLnRvZG9baV0pIHJldHVybjsKICBGT1JNLnRvZG9baV1ba2V5XSA9IChrZXkgPT09ICdkb25lJykgPyAhIXZhbCA6IHZhbDsKICBpZiAoa2V5ID09PSAnZG9uZScpIHsgcmVkcmF3VG9kbygpOyBy',
  'ZXR1cm47IH0gICAvLyDguJXguLTguYrguIHguYHguKXguYnguKfguKfguLLguJTguYPguKvguKHguYjguYPguKvguYnguILguLXguJTguIbguYjguLLguYDguKvguYfguJnguIrguLHguJQKICB2YXIgYyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNmX2l0ZW1z',
  'IC50b2RvLWNvdW50IGInKTsKICBpZiAoYykgYy50ZXh0Q29udGVudCA9IHRvZG9Eb25lKCkgKyAnLycgKyBGT1JNLnRvZG8ubGVuZ3RoOwp9CgpmdW5jdGlvbiBhZGRUb2RvKCl7CiAgRk9STS50b2RvLnB1c2goeyBkb25lOiBmYWxzZSwgbmFtZTogJycsIGNhdGVn',
  'b3J5OiAnJyB9KTsKICByZWRyYXdUb2RvKCk7CiAgdmFyIGlucHV0cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNmX2l0ZW1zIC50b2RvLXJvdyAuaW5wJyk7CiAgaWYgKGlucHV0cy5sZW5ndGgpIGlucHV0c1tpbnB1dHMubGVuZ3RoIC0gMV0uZm9jdXMo',
  'KTsKfQoKZnVuY3Rpb24gZGVsVG9kbyhpKXsKICBGT1JNLnRvZG8uc3BsaWNlKGksIDEpOwogIHJlZHJhd1RvZG8oKTsKfQoKLyoqIOC4p+C4suC4h+C4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4leC5ieC4reC4h+C4i+C5iOC4reC4oeC4l+C4teC5gOC4lOC4',
  'teC4ouC4p+C4q+C4peC4suC4ouC4muC4o+C4o+C4l+C4seC4lCDguYHguKXguYnguKfguYPguKvguYnguKPguLDguJrguJrguYHguKLguIHguYPguKvguYkgKi8KZnVuY3Rpb24gcGFzdGVUb2RvKCl7CiAgdmFyIGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlk',
  'KCd0b2RvUGFzdGVXcmFwJyk7CiAgaWYgKGJveCkgeyBib3guaGlkZGVuID0gIWJveC5oaWRkZW47IGlmICghYm94LmhpZGRlbikgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvZG9QYXN0ZUJveCcpLmZvY3VzKCk7IHJldHVybjsgfQoKICB2YXIgaG9zdCA9IGRv',
  'Y3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2l0ZW1zJyk7CiAgaWYgKCFob3N0KSByZXR1cm47CiAgdmFyIHdyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICB3cmFwLmlkID0gJ3RvZG9QYXN0ZVdyYXAnOwogIHdyYXAuY2xhc3NOYW1lID0gJ210',
  'OCc7CiAgd3JhcC5pbm5lckhUTUwgPQogICAgJzx0ZXh0YXJlYSBjbGFzcz0idGEiIGlkPSJ0b2RvUGFzdGVCb3giIHN0eWxlPSJtaW4taGVpZ2h0OjExMHB4IiAnICsKICAgICAgJ3BsYWNlaG9sZGVyPSLguKLguLLguYHguJnguKfguKvguYnguK3guIfguJnguYng',
  'uLMmIzEwO+C5gOC4geC5h+C4muC4quC4teC4q+C5ieC4reC4hyYjMTA74LmA4Lib4Lil4Li14LmI4Lii4LiZ4LiB4LmK4Lit4LiB4LiZ4LmJ4Liz4Lil4LmJ4Liy4LiH4LiI4Liy4LiZIj48L3RleHRhcmVhPicgKwogICAgJzxkaXYgY2xhc3M9ImhpbnQgbXQ4Ij7g',
  'uJrguKPguKPguJfguLHguJTguKXguLDguKvguJnguLbguYjguIfguIfguLLguJkgwrcg4Lir4Lij4Li34Lit4Lie4Li04Lih4Lie4LmM4Lij4Lin4Lih4Lia4Lij4Lij4LiX4Lix4LiU4LmA4LiU4Li14Lii4Lin4LmB4Lia4LiaIOKAnDEu4Lii4Liy4LmB4LiZ4Lin',
  'IDIu4LmA4LiB4LmH4Lia4Liq4Li14Lir4LmJ4Lit4LiH4oCdIOC4geC5h+C5hOC4lOC5iTxicj4nICsKICAgICAgJ+C5g+C4quC5iOC4m+C4o+C4sOC5gOC4oOC4l+C4h+C4suC4meC4l+C4teC4q+C4peC4seC4h+C4iOC4suC4geC4iuC5iOC4reC4h+C4guC5ieC4',
  'suC4hyDguYYg4LmB4LiV4LmI4Lil4Liw4LiH4Liy4LiZPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0icm93IG10OCI+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSBwcmkiIG9uY2xpY2s9ImFwcGx5UGFzdGVkVG9kbygpIj7g',
  'uYDguJ7guLTguYjguKHguYDguILguYnguLLguKPguLLguKLguIHguLLguKM8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcJ3RvZG9QYXN0ZVdyYXBc',
  'JykuaGlkZGVuPXRydWUiPuC4m+C4tOC4lDwvYnV0dG9uPicgKwogICAgJzwvZGl2Pic7CiAgaG9zdC5hcHBlbmRDaGlsZCh3cmFwKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9kb1Bhc3RlQm94JykuZm9jdXMoKTsKfQoKZnVuY3Rpb24gYXBwbHlQYXN0',
  'ZWRUb2RvKCl7CiAgdmFyIHRleHQgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvZG9QYXN0ZUJveCcpIHx8IHt9KS52YWx1ZSB8fCAnJzsKICB2YXIgYWRkZWQgPSBwYXJzZVRvZG9UZXh0KHRleHQpOwogIGlmICghYWRkZWQubGVuZ3RoKSByZXR1cm4gdG9h',
  'c3QoJ+C5hOC4oeC5iOC4nuC4muC4h+C4suC4meC4l+C4teC5iOC4reC5iOC4suC4meC5hOC4lOC5iScsICdlcnInKTsKICBGT1JNLnRvZG8gPSAoRk9STS50b2RvIHx8IFtdKS5maWx0ZXIoZnVuY3Rpb24odCl7IHJldHVybiBTdHJpbmcodC5uYW1lIHx8ICcnKS50',
  'cmltKCk7IH0pLmNvbmNhdChhZGRlZCk7CiAgcmVkcmF3VG9kbygpOwogIHRvYXN0KCfguYDguJ7guLTguYjguKHguYPguKvguYkgJyArIGFkZGVkLmxlbmd0aCArICcg4LiH4Liy4LiZJywgJ29rJyk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJrguLTguKXguYDguJTguLXguKLguKfguKvguKXguLLguKLguKPguLLguKLguIHguLLguKMg4oCUIOC4i+C4t+C5ieC4reC4reC4reC4meC5hOC4peC4meC5jOC4l+C4teC5gOC4lOC4teC4ouC4p+C5',
  'hOC4lOC5ieC4guC4reC4h+C4q+C4peC4suC4ouC4reC4ouC5iOC4suC4hwoKICAg4LmA4LiB4LmH4Lia4Lil4LiH4LiK4Li14LiV4LmA4Lib4LmH4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4LihIOC4muC4o+C4o+C4l+C4seC4lOC4peC4sOC4o+C4suC4ouC4geC4suC4',
  'oyAg4LiK4Li34LmI4LitIHwg4LiI4Liz4LiZ4Lin4LiZIHwg4Lir4LiZ4LmI4Lin4LiiIHwg4Lij4Liy4LiE4Liy4LiV4LmI4Lit4Lir4LiZ4LmI4Lin4LiiCiAgICjguKPguLnguJvguYHguJrguJrguYDguJTguLXguKLguKfguIHguLHguJogcGFyc2VMaW5lc18g',
  '4Lid4Lix4LmI4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmMIOKAlCDguYHguIHguYnguJfguLXguYjguYTguKvguJnguJXguYnguK3guIfguYHguIHguYnguYPguKvguYnguJXguKPguIfguIHguLHguJkpCiAgID09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKZnVuY3Rpb24gcGFyc2VMaW5lc1RleHQodGV4dCl7CiAgcmV0dXJuIFN0cmluZyh0ZXh0ID09IG51bGwgPyAnJyA6IHRleHQpLnNwbGl0KC9ccj9cbi8pCiAgICAubWFwKGZ1bmN0aW9u',
  'KHMpeyByZXR1cm4gcy50cmltKCk7IH0pLmZpbHRlcihCb29sZWFuKQogICAgLm1hcChmdW5jdGlvbihyYXcpewogICAgICB2YXIgYSA9IHJhdy5zcGxpdCgnfCcpLm1hcChmdW5jdGlvbih4KXsgcmV0dXJuIHgudHJpbSgpOyB9KTsKICAgICAgdmFyIG5hbWUgPSBh',
  'WzBdIHx8ICcnLCBxdHkgPSAxLCB1bml0ID0gJycsIHByaWNlID0gMDsKICAgICAgaWYgKGEubGVuZ3RoID49IDQpICAgICAgeyBxdHkgPSBudW1PcihhWzFdLCAxKTsgdW5pdCA9IGFbMl0gfHwgJyc7IHByaWNlID0gbnVtT3IoYVszXSwgMCk7IH0KICAgICAgZWxz',
  'ZSBpZiAoYS5sZW5ndGggPT09IDMpeyBxdHkgPSBudW1PcihhWzFdLCAxKTsgcHJpY2UgPSBudW1PcihhWzJdLCAwKTsgfQogICAgICBlbHNlIGlmIChhLmxlbmd0aCA9PT0gMil7IHByaWNlID0gbnVtT3IoYVsxXSwgMCk7IH0KICAgICAgcmV0dXJuIHsgbmFtZTog',
  'bmFtZSwgcXR5OiBxdHksIHVuaXQ6IHVuaXQsIHByaWNlOiBwcmljZSB9OwogICAgfSk7Cn0KCmZ1bmN0aW9uIG51bU9yKHYsIGRmbHQpewogIHZhciBuID0gTnVtYmVyKFN0cmluZyh2KS5yZXBsYWNlKC8sL2csICcnKSk7CiAgcmV0dXJuIGlzRmluaXRlKG4pID8g',
  'biA6IGRmbHQ7Cn0KCmZ1bmN0aW9uIGZvcm1hdExpbmVzVGV4dChsaXN0KXsKICByZXR1cm4gKGxpc3QgfHwgW10pCiAgICAuZmlsdGVyKGZ1bmN0aW9uKGwpeyByZXR1cm4gU3RyaW5nKGwubmFtZSB8fCAnJykudHJpbSgpIHx8IE51bWJlcihsLnByaWNlKTsgfSkK',
  'ICAgIC5tYXAoZnVuY3Rpb24obCl7CiAgICAgIHJldHVybiBbU3RyaW5nKGwubmFtZSB8fCAnJykucmVwbGFjZSgvXHwvZywgJy8nKSwKICAgICAgICAgICAgICBsLnF0eSB8fCAxLAogICAgICAgICAgICAgIFN0cmluZyhsLnVuaXQgfHwgJycpLnJlcGxhY2UoL1x8',
  'L2csICcvJyksCiAgICAgICAgICAgICAgbC5wcmljZSB8fCAwXS5qb2luKCcgfCAnKTsKICAgIH0pLmpvaW4oJ1xuJyk7Cn0KCmZ1bmN0aW9uIGxpbmVUb3RhbChsKXsgcmV0dXJuIChOdW1iZXIobC5xdHkpIHx8IDApICogKE51bWJlcihsLnByaWNlKSB8fCAwKTsg',
  'fQpmdW5jdGlvbiBsaW5lc1N1bSgpeyByZXR1cm4gKEZPUk0ubGluZXMgfHwgW10pLnJlZHVjZShmdW5jdGlvbihhLCBsKXsgcmV0dXJuIGEgKyBsaW5lVG90YWwobCk7IH0sIDApOyB9CgpmdW5jdGlvbiBsaW5lc1RhYmxlSHRtbCgpewogIHZhciByb3dzID0gKEZP',
  'Uk0ubGluZXMgfHwgW10pLm1hcChmdW5jdGlvbihsLCBpKXsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0ibGluZS1yb3ciPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAiIHBsYWNlaG9sZGVyPSLguIrguLfguYjguK3guKrguLTguJnguITguYnguLIiIHZhbHVl',
  'PSInICsgZXNjKGwubmFtZSB8fCAnJykgKyAnIiAnICsKICAgICAgICAnb25pbnB1dD0ic2V0TGluZSgnICsgaSArICcsXCduYW1lXCcsdGhpcy52YWx1ZSkiPicgKwogICAgICAnPGlucHV0IGNsYXNzPSJpbnAgbnVtIiB0eXBlPSJudW1iZXIiIHN0ZXA9ImFueSIg',
  'aW5wdXRtb2RlPSJkZWNpbWFsIiBwbGFjZWhvbGRlcj0i4LiI4Liz4LiZ4Lin4LiZIiAnICsKICAgICAgICAndmFsdWU9IicgKyAobC5xdHkgPT0gbnVsbCA/ICcnIDogZXNjKGwucXR5KSkgKyAnIiBvbmlucHV0PSJzZXRMaW5lKCcgKyBpICsgJyxcJ3F0eVwnLHRo',
  'aXMudmFsdWUpIj4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIiBwbGFjZWhvbGRlcj0i4Lir4LiZ4LmI4Lin4LiiIiB2YWx1ZT0iJyArIGVzYyhsLnVuaXQgfHwgJycpICsgJyIgJyArCiAgICAgICAgJ29uaW5wdXQ9InNldExpbmUoJyArIGkgKyAnLFwndW5p',
  'dFwnLHRoaXMudmFsdWUpIj4nICsKICAgICAgJzxpbnB1dCBjbGFzcz0iaW5wIG51bSIgdHlwZT0ibnVtYmVyIiBzdGVwPSJhbnkiIGlucHV0bW9kZT0iZGVjaW1hbCIgcGxhY2Vob2xkZXI9IuC4o+C4suC4hOC4si/guKvguJnguYjguKfguKIiICcgKwogICAgICAg',
  'ICd2YWx1ZT0iJyArIChsLnByaWNlID09IG51bGwgPyAnJyA6IGVzYyhsLnByaWNlKSkgKyAnIiBvbmlucHV0PSJzZXRMaW5lKCcgKyBpICsgJyxcJ3ByaWNlXCcsdGhpcy52YWx1ZSkiPicgKwogICAgICAnPGRpdiBjbGFzcz0ibGluZS1zdW0iPicgKyBtb25leShs',
  'aW5lVG90YWwobCksIDIpICsgJzwvZGl2PicgKwogICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20gZGdyIiB0aXRsZT0i4LmA4Lit4Liy4Lij4Liy4Lii4LiB4Liy4Lij4LiZ4Li14LmJ4Lit4Lit4LiBIiBvbmNsaWNrPSJkZWxMaW5lKCcg',
  'KyBpICsgJykiPsOXPC9idXR0b24+JyArCiAgICAnPC9kaXY+JzsKICB9KS5qb2luKCcnKTsKCiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJsaW5lLWhlYWQiPicgKwogICAgICAnPHNwYW4+4LiK4Li34LmI4Lit4Liq4Li04LiZ4LiE4LmJ4LiyPC9zcGFuPjxzcGFuIGNs',
  'YXNzPSJudW0iPuC4iOC4s+C4meC4p+C4mTwvc3Bhbj48c3Bhbj7guKvguJnguYjguKfguKI8L3NwYW4+JyArCiAgICAgICc8c3BhbiBjbGFzcz0ibnVtIj7guKPguLLguITguLIv4Lir4LiZ4LmI4Lin4LiiPC9zcGFuPjxzcGFuIGNsYXNzPSJudW0iPuC4o+C4p+C4',
  'oTwvc3Bhbj48c3Bhbj48L3NwYW4+JyArCiAgICAnPC9kaXY+JyArCiAgICAocm93cyB8fCAnPGRpdiBjbGFzcz0iaGludCIgc3R5bGU9InBhZGRpbmc6OHB4IDJweCI+4Lii4Lix4LiH4LmE4Lih4LmI4Lih4Li14Lij4Liy4Lii4LiB4Liy4LijIOKAlCDguIHguJQg',
  '4oCc4LmA4Lie4Li04LmI4Lih4Lij4Liy4Lii4LiB4Liy4Lij4oCdIOC5gOC4nuC4t+C5iOC4reC5g+C4quC5iOC4quC4tOC4meC4hOC5ieC4suC4l+C4teC4peC4sOC4reC4ouC5iOC4suC4hzwvZGl2PicpICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQ4Ij4nICsK',
  'ICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJhZGRMaW5lKCkiPisg4LmA4Lie4Li04LmI4Lih4Lij4Liy4Lii4LiB4Liy4LijPC9idXR0b24+JyArCiAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0',
  'biBzbSIgb25jbGljaz0icGFzdGVMaW5lcygpIj7wn5OLIOC4p+C4suC4h+C4l+C4teC5gOC4lOC4teC4ouC4p+C4q+C4peC4suC4ouC4o+C4suC4ouC4geC4suC4ozwvYnV0dG9uPicgKwogICAgICAnPGRpdiBjbGFzcz0ibGluZS10b3RhbCI+4Lij4Lin4Lih4LiE',
  '4LmI4Liy4Liq4Li04LiZ4LiE4LmJ4LiyIDxiPicgKyBtb25leShsaW5lc1N1bSgpLCAyKSArICcg4Li/PC9iPjwvZGl2PicgKwogICAgJzwvZGl2Pic7Cn0KCmZ1bmN0aW9uIHJlZHJhd0xpbmVzKCl7CiAgdmFyIGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlk',
  'KCdmX2xpbmVzJyk7CiAgaWYgKCFib3gpIHJldHVybjsKICBib3guaW5uZXJIVE1MID0gbGluZXNUYWJsZUh0bWwoKTsKICByZWNhbGNCaWxsKCk7Cn0KCmZ1bmN0aW9uIHNldExpbmUoaSwga2V5LCB2YWwpewogIGlmICghRk9STS5saW5lc1tpXSkgcmV0dXJuOwog',
  'IEZPUk0ubGluZXNbaV1ba2V5XSA9IChrZXkgPT09ICdxdHknIHx8IGtleSA9PT0gJ3ByaWNlJykgPyBudW1Pcih2YWwsIDApIDogdmFsOwogIC8vIOC5hOC4oeC5iOC4p+C4suC4lOC5g+C4q+C4oeC5iOC4l+C4seC5ieC4h+C4leC4suC4o+C4suC4hyDguYDguJTg',
  'uLXguYvguKLguKfguYDguITguK3guKPguYzguYDguIvguK3guKPguYzguYDguJTguYnguIfguK3guK3guIHguIjguLLguIHguIrguYjguK3guIfguJfguLXguYjguIHguLPguKXguLHguIfguJ7guLTguKHguJ7guYwKICB2YXIgcm93ID0gZG9jdW1lbnQucXVlcnlT',
  'ZWxlY3RvckFsbCgnI2ZfbGluZXMgLmxpbmUtcm93JylbaV07CiAgaWYgKHJvdykgcm93LnF1ZXJ5U2VsZWN0b3IoJy5saW5lLXN1bScpLnRleHRDb250ZW50ID0gbW9uZXkobGluZVRvdGFsKEZPUk0ubGluZXNbaV0pLCAyKTsKICB2YXIgdG90ID0gZG9jdW1lbnQu',
  'cXVlcnlTZWxlY3RvcignI2ZfbGluZXMgLmxpbmUtdG90YWwgYicpOwogIGlmICh0b3QpIHRvdC50ZXh0Q29udGVudCA9IG1vbmV5KGxpbmVzU3VtKCksIDIpICsgJyDguL8nOwogIHJlY2FsY0JpbGwoKTsKfQoKZnVuY3Rpb24gYWRkTGluZSgpewogIEZPUk0ubGlu',
  'ZXMucHVzaCh7IG5hbWU6ICcnLCBxdHk6IDEsIHVuaXQ6ICcnLCBwcmljZTogMCB9KTsKICByZWRyYXdMaW5lcygpOwogIHZhciBpbnB1dHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjZl9saW5lcyAubGluZS1yb3cgLmlucCcpOwogIGlmIChpbnB1dHMu',
  'bGVuZ3RoKSBpbnB1dHNbKEZPUk0ubGluZXMubGVuZ3RoIC0gMSkgKiA0XS5mb2N1cygpOwp9CgpmdW5jdGlvbiBkZWxMaW5lKGkpewogIEZPUk0ubGluZXMuc3BsaWNlKGksIDEpOwogIHJlZHJhd0xpbmVzKCk7Cn0KCi8qKgogKiDguKfguLLguIfguKPguLLguKLg',
  'uIHguLLguKPguIjguLLguIHguKvguJnguYnguLLguITguLPguKrguLHguYjguIfguIvguLfguYnguK3guJfguLXguYDguJTguLXguKLguKfguJfguLHguYnguIfguIHguYnguK3guJkg4LmB4Lil4LmJ4Lin4LmD4Lir4LmJ4Lij4Liw4Lia4Lia4LmB4Lii4LiB4Lia',
  '4Lij4Lij4LiX4Lix4LiU4LmD4Lir4LmJCiAqCiAqIOC4l+C4s+C5gOC4m+C5h+C4meC4iuC5iOC4reC4h+C4nuC4seC4muC5gOC4geC5h+C4muC4reC4ouC4ueC5iOC5g+C4meC4n+C4reC4o+C5jOC4oeC5gOC4lOC4tOC4oSDguYTguKHguYjguYDguJvguLTguJTg',
  'uKvguJnguYnguLLguJXguYjguLLguIfguIvguYnguK3guJkKICog4LmA4Lie4Lij4Liy4LiwIG9wZW5Nb2RhbCgpIOC5gOC4guC4teC4ouC4meC4l+C4seC4muC4q+C4meC5ieC4suC4leC5iOC4suC4h+C5gOC4lOC4tOC4oSDguJbguYnguLLguYDguJvguLTguJTg',
  'uIvguYnguK3guJnguJ/guK3guKPguYzguKHguJfguLXguYjguIHguKPguK3guIHguITguYnguLLguIfguYTguKfguYnguIjguLDguKvguLLguKLguJfguLHguYnguIfguYPguJoKICovCmZ1bmN0aW9uIHBhc3RlTGluZXMoKXsKICB2YXIgYm94ID0gZG9jdW1lbnQu',
  'Z2V0RWxlbWVudEJ5SWQoJ3Bhc3RlV3JhcCcpOwogIGlmIChib3gpIHsgYm94LmhpZGRlbiA9ICFib3guaGlkZGVuOyBpZiAoIWJveC5oaWRkZW4pIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXN0ZUJveCcpLmZvY3VzKCk7IHJldHVybjsgfQoKICB2YXIgaG9z',
  'dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2xpbmVzJyk7CiAgaWYgKCFob3N0KSByZXR1cm47CiAgdmFyIHdyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICB3cmFwLmlkID0gJ3Bhc3RlV3JhcCc7CiAgd3JhcC5jbGFzc05hbWUgPSAn',
  'bXQ4JzsKICB3cmFwLmlubmVySFRNTCA9CiAgICAnPHRleHRhcmVhIGNsYXNzPSJ0YSIgaWQ9InBhc3RlQm94IiBzdHlsZT0ibWluLWhlaWdodDoxMjBweCIgJyArCiAgICAgICdwbGFjZWhvbGRlcj0i4Lib4Lix4LmK4Lih4LiZ4LmJ4LizIDc1MFcgfCAxIHwg4LmA',
  '4LiE4Lij4Li34LmI4Lit4LiHIHwgNDI1MCYjMTA74Liq4Liy4Lii4LmE4LifIFZBRiAyeDEuNSB8IDIwIHwg4LmA4Lih4LiV4LijIHwgMTcuNSYjMTA74LmA4LiX4Lib4Lie4Lix4LiZ4Liq4Liy4Lii4LmE4LifIDQ1Ij48L3RleHRhcmVhPicgKwogICAgJzxkaXYg',
  'Y2xhc3M9ImhpbnQgbXQ4Ij7guITguLHguYjguJnguJTguYnguKfguKIgPGI+fDwvYj4g4LiV4Liy4Lih4Lil4Liz4LiU4Lix4LiaIOC4iuC4t+C5iOC4rSDCtyDguIjguLPguJnguKfguJkgwrcg4Lir4LiZ4LmI4Lin4LiiIMK3IOC4o+C4suC4hOC4suC4leC5iOC4',
  'reC4q+C4meC5iOC4p+C4ojxicj4nICsKICAgICAgJ+C4luC5ieC4suC4p+C4suC4h+C4oeC4suC5gOC4m+C5h+C4meC4guC5ieC4reC4hOC4p+C4suC4oeC4mOC4o+C4o+C4oeC4lOC4siDguKPguLDguJrguJrguIjguLDguJ7guKLguLLguKLguLLguKHguYHguKLg',
  'uIHguIrguLfguYjguK3guIHguLHguJrguKPguLLguITguLLguYPguKvguYnguYDguK3guIc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJyb3cgbXQ4Ij4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIHByaSIgb25jbGljaz0i',
  'YXBwbHlQYXN0ZWRMaW5lcygpIj7guYDguJ7guLTguYjguKHguYDguILguYnguLLguKPguLLguKLguIHguLLguKM8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIiBvbmNsaWNrPSJkb2N1bWVudC5nZXRFbGVtZW50',
  'QnlJZChcJ3Bhc3RlV3JhcFwnKS5oaWRkZW49dHJ1ZSI+4Lib4Li04LiUPC9idXR0b24+JyArCiAgICAnPC9kaXY+JzsKICBob3N0LmFwcGVuZENoaWxkKHdyYXApOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXN0ZUJveCcpLmZvY3VzKCk7Cn0KCmZ1bmN0',
  'aW9uIGFwcGx5UGFzdGVkTGluZXMoKXsKICB2YXIgdGV4dCA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFzdGVCb3gnKSB8fCB7fSkudmFsdWUgfHwgJyc7CiAgdmFyIGFkZGVkID0gdGV4dC5zcGxpdCgvXHI/XG4vKS5tYXAoZnVuY3Rpb24ocyl7IHJldHVy',
  'biBzLnRyaW0oKTsgfSkuZmlsdGVyKEJvb2xlYW4pLm1hcChmdW5jdGlvbihyYXcpewogICAgaWYgKHJhdy5pbmRleE9mKCd8JykgPj0gMCkgcmV0dXJuIHBhcnNlTGluZXNUZXh0KHJhdylbMF07CiAgICAvLyDguYTguKHguYjguKHguLUgfCDigJQg4LmA4LiU4Liy',
  '4LiI4Liy4LiB4LiV4Lix4Lin4LmA4Lil4LiC4LiX4LmJ4Liy4Lii4Lia4Lij4Lij4LiX4Lix4LiU4Lin4LmI4Liy4LmA4Lib4LmH4LiZ4Lij4Liy4LiE4LiyCiAgICB2YXIgbSA9IHJhdy5tYXRjaCgvXiguKj8pW1xzOnjDl10qKFtcZCxdKyg/OlwuXGQrKT8pXHMq',
  'KD864Lia4Liy4LiXfOC4vyk/JC8pOwogICAgaWYgKG0gJiYgbVsxXS50cmltKCkpIHJldHVybiB7IG5hbWU6IG1bMV0udHJpbSgpLCBxdHk6IDEsIHVuaXQ6ICcnLCBwcmljZTogbnVtT3IobVsyXSwgMCkgfTsKICAgIHJldHVybiB7IG5hbWU6IHJhdywgcXR5OiAx',
  'LCB1bml0OiAnJywgcHJpY2U6IDAgfTsKICB9KS5maWx0ZXIoQm9vbGVhbik7CgogIGlmICghYWRkZWQubGVuZ3RoKSByZXR1cm4gdG9hc3QoJ+C5hOC4oeC5iOC4nuC4muC4o+C4suC4ouC4geC4suC4o+C4l+C4teC5iOC4reC5iOC4suC4meC5hOC4lOC5iScsICdl',
  'cnInKTsKICBGT1JNLmxpbmVzID0gKEZPUk0ubGluZXMgfHwgW10pLmZpbHRlcihmdW5jdGlvbihsKXsgcmV0dXJuIFN0cmluZyhsLm5hbWUgfHwgJycpLnRyaW0oKTsgfSkuY29uY2F0KGFkZGVkKTsKICByZWRyYXdMaW5lcygpOyAgIC8vIOC4p+C4suC4lOC5g+C4',
  'q+C4oeC5iOC5geC4peC5ieC4p+C4iuC5iOC4reC4h+C4p+C4suC4h+C4iOC4sOC4q+C4suC4ouC5hOC4m+C5gOC4reC4hyDguYDguJ7guKPguLLguLDguK3guKLguLnguYjguILguYnguLLguIfguYPguJkgZl9saW5lcwogIHRvYXN0KCfguYDguJ7guLTguYjguKHg',
  'uYPguKvguYkgJyArIGFkZGVkLmxlbmd0aCArICcg4Lij4Liy4Lii4LiB4Liy4LijIOKAlCDguJXguKPguKfguIjguJXguLHguKfguYDguKXguILguK3guLXguIHguITguKPguLHguYnguIfguIHguYjguK3guJnguJrguLHguJnguJfguLbguIEnLCAnb2snKTsKfQoK',
  'LyoqCiAqIOC4hOC4tOC4lOC4ouC4reC4lOC4o+C4p+C4oeC4guC4reC4h+C4muC4tOC4pSA9IOC4hOC5iOC4suC4quC4tOC4meC4hOC5ieC4siArIOC4hOC5iOC4suC4quC5iOC4hyDiiJIg4Liq4LmI4Lin4LiZ4Lil4LiUIOC5geC4peC5ieC4p+C5gOC4leC4tOC4',
  'oeC4peC4h+C4iuC5iOC4reC4hyAi4Lij4Liy4LiE4Liy4Lij4Lin4LihIgogKiDguYPguKvguYnguJXguKPguIfguIHguLHguJrguJfguLXguYjguJ3guLHguYjguIfguYDguIvguLTguKPguYzguJ/guYDguKfguK3guKPguYzguITguLTguJTguJXguK3guJnguJrg',
  'uLHguJnguJfguLbguIEg4LiI4Liw4LmE4LiU4LmJ4LmE4Lih4LmI4Lih4Li14LiX4Liy4LiH4LiX4Li14LmI4LiV4Lix4Lin4LmA4Lil4LiC4Liq4Lit4LiH4Lid4Lix4LmI4LiH4LmE4Lih4LmI4LiV4Lij4LiH4LiB4Lix4LiZCiAqLwpmdW5jdGlvbiByZWNhbGNC',
  'aWxsKCl7CiAgaWYgKCFkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9saW5lcycpKSByZXR1cm47CiAgdmFyIHByaWNlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfcHJpY2UnKTsKICBpZiAoIXByaWNlKSByZXR1cm47CiAgdmFyIG4gPSAoRk9STS5saW5l',
  'cyB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uKGwpeyByZXR1cm4gU3RyaW5nKGwubmFtZSB8fCAnJykudHJpbSgpIHx8IE51bWJlcihsLnByaWNlKTsgfSkubGVuZ3RoOwogIGlmICghbikgeyBwcmljZS5yZWFkT25seSA9IGZhbHNlOyBwcmljZS5zdHlsZS5iYWNrZ3Jv',
  'dW5kID0gJyc7IHJldHVybjsgfQoKICB2YXIgc2hpcCA9IE51bWJlcigoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Zfc2hpcHBpbmcnKSB8fCB7fSkudmFsdWUpIHx8IDA7CiAgdmFyIGRpc2MgPSBOdW1iZXIoKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2Rp',
  'c2NvdW50JykgfHwge30pLnZhbHVlKSB8fCAwOwogIHByaWNlLnZhbHVlID0gTWF0aC5yb3VuZCgobGluZXNTdW0oKSArIHNoaXAgLSBkaXNjKSAqIDEwMCkgLyAxMDA7CiAgcHJpY2UucmVhZE9ubHkgPSB0cnVlOyAgICAgICAgICAgICAgICAgICAgICAgLy8g4Lih',
  '4Li14Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4Lii4LmB4Lil4LmJ4LinIOC4q+C5ieC4suC4oeC4nuC4tOC4oeC4nuC5jOC4l+C4seC4muC5g+C4q+C5ieC5hOC4oeC5iOC4leC4o+C4h+C4geC4seC4mQogIHByaWNlLnN0eWxlLmJhY2tncm91bmQgPSAndmFy',
  'KC0tc3VyZmFjZS0yKSc7CiAgcHJpY2UudGl0bGUgPSAn4LiE4Li04LiU4LiI4Liy4LiB4Lij4Liy4Lii4LiB4Liy4Lij4LmD4LiZ4Lia4Li04Lil4LmD4Lir4LmJ4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0IOKAlCDguYHguIHguYnguJfguLXguYjguKPguLLg',
  'uKLguIHguLLguKPguKLguYjguK3guKIg4LiE4LmI4Liy4Liq4LmI4LiHIOC4q+C4o+C4t+C4reC4quC5iOC4p+C4meC4peC4lCc7CgogIHZhciBoaW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JpbGxIaW50Jyk7CiAgaWYgKGhpbnQpIHsKICAgIGhpbnQu',
  'aW5uZXJIVE1MID0gbiArICcg4Lij4Liy4Lii4LiB4Liy4LijIMK3IOC4hOC5iOC4suC4quC4tOC4meC4hOC5ieC4siAnICsgbW9uZXkobGluZXNTdW0oKSwgMikgKwogICAgICAoc2hpcCA/ICcgKyDguITguYjguLLguKrguYjguIcgJyArIG1vbmV5KHNoaXAsIDIp',
  'IDogJycpICsKICAgICAgKGRpc2MgPyAnIOKIkiDguKrguYjguKfguJnguKXguJQgJyArIG1vbmV5KGRpc2MsIDIpIDogJycpOwogIH0KfQoKLyoqIOC4reC4seC4m+C5gOC4lOC4leC4iuC5iOC4reC4h+C4nOC4peC4o+C4p+C4oeC4l+C4uOC4geC4iuC5iOC4reC4',
  'h+C5g+C4meC4n+C4reC4o+C5jOC4oeC4m+C4seC4iOC4iOC4uOC4muC4seC4mSAqLwpmdW5jdGlvbiByZWNhbGNTdW1zKCl7CiAgKEZPUk0uc3BlY3MgfHwgW10pLmZvckVhY2goZnVuY3Rpb24oZil7CiAgICBpZiAoZi50eXBlICE9PSAnY29tcHV0ZWQnIHx8ICFm',
  'LmZyb20pIHJldHVybjsKICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmXycgKyBmLmtleSk7CiAgICBpZiAoIWVsKSByZXR1cm47CiAgICB2YXIgdG90YWwgPSAwOwogICAgZi5mcm9tLmZvckVhY2goZnVuY3Rpb24oayl7CiAgICAgIHZhciBp',
  'ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyArIGspOwogICAgICBpZiAoaSkgdG90YWwgKz0gTnVtYmVyKGkudmFsdWUpIHx8IDA7CiAgICB9KTsKICAgIGVsLnRleHRDb250ZW50ID0gdG90YWwudG9Mb2NhbGVTdHJpbmcoJ3RoLVRIJywgeyBtaW5pbXVt',
  'RnJhY3Rpb25EaWdpdHM6IDAsIG1heGltdW1GcmFjdGlvbkRpZ2l0czogMiB9KSArICcg4Li/JzsKICAgIGVsLnN0eWxlLmNvbG9yID0gdG90YWwgPiAwID8gJ3ZhcigtLW9rKScgOiAndmFyKC0tbXV0ZWQpJzsKICB9KTsKfQoKZnVuY3Rpb24gZXhpc3RpbmdGaWxl',
  'c0h0bWwoa2V5KXsKICB2YXIgbGlzdCA9IEZPUk0ua2VlcFtrZXldIHx8IFtdOwogIGlmICghbGlzdC5sZW5ndGgpIHJldHVybiAnJzsKICByZXR1cm4gJzxkaXYgY2xhc3M9InRodW1icyBtYjgiPicgKyBsaXN0Lm1hcChmdW5jdGlvbih1cmwsIGkpewogICAgdmFy',
  'IGlkID0gU3RyaW5nKHVybCkubWF0Y2goL1stXHddezIwLH0vKTsKICAgIHZhciB0aHVtYiA9IGlkID8gJ2h0dHBzOi8vZHJpdmUuZ29vZ2xlLmNvbS90aHVtYm5haWw/aWQ9JyArIGlkWzBdICsgJyZzej13MjAwJyA6ICcnOwogICAgcmV0dXJuICc8c3BhbiBzdHls',
  'ZT0icG9zaXRpb246cmVsYXRpdmU7ZGlzcGxheTppbmxpbmUtYmxvY2siPicgKwogICAgICAodGh1bWIgPyAnPGltZyBjbGFzcz0idGh1bWIiIHNyYz0iJyArIGVzYyh0aHVtYikgKyAnIiBvbmNsaWNrPSJ3aW5kb3cub3BlbignICsganNxKHNhZmVVcmwodXJsKSkg',
  'KyAnLFwnX2JsYW5rXCcpIj4nCiAgICAgICAgICAgICA6ICc8YSBjbGFzcz0iYiBpbmZvIiBocmVmPSInICsgZXNjKHNhZmVVcmwodXJsKSB8fCAnIycpICsgJyIgdGFyZ2V0PSJfYmxhbmsiIHJlbD0ibm9vcGVuZXIiPuC5hOC4n+C4peC5jCAnICsgKGkrMSkgKyAn',
  'PC9hPicpICsKICAgICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBvbmNsaWNrPSJkcm9wRmlsZShcJycgKyBrZXkgKyAnXCcsJyArIGkgKyAnKSIgdGl0bGU9IuC5gOC4reC4suC4reC4reC4gSIgJyArCiAgICAgICdzdHlsZT0icG9zaXRpb246YWJzb2x1dGU7dG9w',
  'Oi02cHg7cmlnaHQ6LTZweDtiYWNrZ3JvdW5kOnZhcigtLWRhbmdlcik7Y29sb3I6I2ZmZjtib3JkZXI6MDtib3JkZXItcmFkaXVzOjk5cHg7d2lkdGg6MThweDtoZWlnaHQ6MThweDtsaW5lLWhlaWdodDoxO2N1cnNvcjpwb2ludGVyO2ZvbnQtc2l6ZToxMnB4Ij7D',
  'lzwvYnV0dG9uPicgKwogICAgICAnPC9zcGFuPic7CiAgfSkuam9pbignJykgKyAnPC9kaXY+JzsKfQoKZnVuY3Rpb24gZHJvcEZpbGUoa2V5LCBpZHgpewogIEZPUk0ua2VlcFtrZXldLnNwbGljZShpZHgsIDEpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdm',
  'XycgKyBrZXkgKyAnX2V4aXN0aW5nJykuaW5uZXJIVE1MID0gZXhpc3RpbmdGaWxlc0h0bWwoa2V5KTsKfQoKZnVuY3Rpb24gcHJldmlld1BpY2tlZChpbnB1dCwgaWQpewogIHZhciBib3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCArICdfcHJldmlldycp',
  'OwogIHZhciBmaWxlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGlucHV0LmZpbGVzIHx8IFtdKTsKICBib3guaW5uZXJIVE1MID0gZmlsZXMubWFwKGZ1bmN0aW9uKGYpewogICAgcmV0dXJuICc8c3BhbiBjbGFzcz0iYiBpbmZvIj4nICsgZXNjKGYubmFt',
  'ZS5zbGljZSgwLDI2KSkgKyAnIMK3ICcgKyBNYXRoLnJvdW5kKGYuc2l6ZS8xMDI0KSArICcgS0I8L3NwYW4+JzsKICB9KS5qb2luKCcgJyk7CgogIHZhciBzbG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQgKyAnX29jcicpOwogIGlmICghc2xvdCkgcmV0',
  'dXJuOwogIHNsb3QuaW5uZXJIVE1MID0gJyc7CiAgaWYgKCFvY3JVc2FibGUoKSB8fCAhZmlyc3RSZWFkYWJsZShmaWxlcykpIHJldHVybjsKCiAgdmFyIG1vZGUgPSAoUy5ib290LnNldHRpbmdzICYmIFMuYm9vdC5zZXR0aW5ncy5vY3JBdXRvZmlsbCkgfHwgJ+C4',
  'luC4suC4oeC4geC5iOC4reC4meC5gOC4leC4tOC4oSc7CiAgaWYgKG1vZGUgPT09ICfguYTguKHguYjguYDguJXguLTguKEnKSByZXR1cm47CiAgaWYgKG1vZGUgPT09ICfguYDguJXguLTguKHguYPguKvguYnguYDguKXguKInKSByZXR1cm4gcnVuT2NyKGlkLCB0',
  'cnVlKTsKCiAgc2xvdC5pbm5lckhUTUwgPQogICAgJzxidXR0b24gdHlwZT0iYnV0dG9uIiBjbGFzcz0iYnRuIHNtIG10OCIgb25jbGljaz0icnVuT2NyKFwnJyArIGlkICsgJ1wnKSI+JyArCiAgICAn8J+UjiDguK3guYjguLLguJnguILguYnguK3guITguKfguLLg',
  'uKHguIjguLLguIHguKPguLnguJvguJnguLXguYkg4LmB4Lil4LmJ4Lin4LiK4LmI4Lin4Lii4LiB4Lij4Lit4LiB4LmD4Lir4LmJPC9idXR0b24+JzsKfQoKLyoqIOC4reC5iOC4suC4meC4hOC5iOC4suC4iOC4suC4geC4n+C4reC4o+C5jOC4oSArIOC4reC4seC4',
  'm+C5guC4q+C4peC4lOC5hOC4n+C4peC5jOC5g+C4q+C4oeC5iCDguYHguKXguYnguKfguITguLfguJkgb2JqZWN0IOC4nuC4o+C5ieC4reC4oeC4muC4seC4meC4l+C4tuC4gSAqLwpmdW5jdGlvbiByZWFkRm9ybShzcGVjcywgYnVja2V0KXsKICB2YXIgb3V0ID0g',
  'e307CiAgdmFyIHVwbG9hZHMgPSBbXTsKCiAgc3BlY3MuZm9yRWFjaChmdW5jdGlvbihmKXsKICAgIGlmIChmLnR5cGUgPT09ICdjb21wdXRlZCcpIHJldHVybjsgICAgICAgICAgLy8g4LiK4LmI4Lit4LiH4LiE4Liz4LiZ4Lin4LiTIOC5hOC4oeC5iOC4leC5ieC4',
  'reC4h+C4muC4seC4meC4l+C4tuC4gQogICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfJyArIGYua2V5KTsKICAgIGlmICghZWwpIHJldHVybjsKICAgIGlmIChmLnR5cGUgPT09ICdmaWxlcycpIHsKICAgICAgdXBsb2Fkcy5wdXNoKAogICAg',
  'ICAgIHVwbG9hZEZpbGVzKGVsLCBidWNrZXQpLnRoZW4oZnVuY3Rpb24ocmVmcyl7CiAgICAgICAgICBvdXRbZi5rZXldID0gKEZPUk0ua2VlcFtmLmtleV0gfHwgW10pLmNvbmNhdChyZWZzLm1hcChmdW5jdGlvbihyKXsgcmV0dXJuIHIudXJsOyB9KSk7CiAgICAg',
  'ICAgfSkKICAgICAgKTsKICAgIH0gZWxzZSBpZiAoZi50eXBlID09PSAndG9kbycpIHsKICAgICAgb3V0W2Yua2V5XSA9IGZvcm1hdFRvZG9UZXh0KEZPUk0udG9kbyk7CiAgICB9IGVsc2UgaWYgKGYudHlwZSA9PT0gJ2xpbmVzJykgewogICAgICBvdXRbZi5rZXld',
  'ID0gZm9ybWF0TGluZXNUZXh0KEZPUk0ubGluZXMpOwogICAgfSBlbHNlIGlmIChmLnR5cGUgPT09ICdudW1iZXInIHx8IGYudHlwZSA9PT0gJ21vbmV5JykgewogICAgICBvdXRbZi5rZXldID0gZWwudmFsdWUgPT09ICcnID8gbnVsbCA6IE51bWJlcihlbC52YWx1',
  'ZSk7CiAgICB9IGVsc2UgewogICAgICBvdXRbZi5rZXldID0gZWwudmFsdWU7CiAgICB9CiAgfSk7CgogIHJldHVybiBQcm9taXNlLmFsbCh1cGxvYWRzKS50aGVuKGZ1bmN0aW9uKCl7IHJldHVybiBvdXQ7IH0pOwp9CgovKiog4LmC4LiE4Lij4LiH4Lif4Lit4Lij',
  '4LmM4Lih4Lih4Liy4LiV4Lij4LiQ4Liy4LiZOiDguYDguJvguLTguJQgbW9kYWwsIOC4iOC4seC4lOC4geC4suC4o+C4m+C4uOC5iOC4oeC4muC4seC4meC4l+C4tuC4gSwg4Lij4Li14LmC4Lir4Lil4LiU4Lir4LiZ4LmJ4LiyICovCmZ1bmN0aW9uIG9wZW5Gb3Jt',
  'KG9wdHMpewogIHZhciByZWMgPSBvcHRzLnJlY29yZCB8fCB7fTsKICBGT1JNLm9jciA9IG9wdHMub2NyIHx8IG51bGw7CiAgRk9STS5yZWMgPSByZWMuaWQgPyByZWMgOiBudWxsOyAgIC8vIOC4iOC4s+C5hOC4p+C5ieC4p+C5iOC4suC4geC4s+C4peC4seC4h+C5',
  'geC4geC5ieC4guC4reC4h+C5gOC4lOC4tOC4oSDguKvguKPguLfguK3guIHguLPguKXguLHguIfguYDguJ7guLTguYjguKHguYPguKvguKHguYgKICBvcGVuTW9kYWwob3B0cy50aXRsZSwKICAgIGZpZWxkc0h0bWwob3B0cy5maWVsZHMsIHJlYyksCiAgICAnPGJ1',
  'dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4gTwvYnV0dG9uPicgKwogICAgKHJlYy5pZCAmJiBvcHRzLm9uRGVsZXRlID8gJzxidXR0b24gY2xhc3M9ImJ0biBkZ3IiIGlkPSJmRGVsIj7guKXguJrguKPguLLg',
  'uKLguIHguLLguKPguJnguLXguYk8L2J1dHRvbj4nIDogJycpICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBpZD0iZlNhdmUiPicgKyAocmVjLmlkID8gJ+C4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C5geC4geC5ieC5hOC4gicgOiAn4Lia4Lix4LiZ',
  '4LiX4Li24LiBJykgKyAnPC9idXR0b24+JywKICAgIG9wdHMud2lkZSk7CgogIGlmIChyZWMuaWQgJiYgb3B0cy5vbkRlbGV0ZSkgewogICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZEZWwnKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsgY2xvc2VNb2RhbCgpOyBv',
  'cHRzLm9uRGVsZXRlKHJlYy5pZCk7IH07CiAgfQoKICByZWNhbGNTdW1zKCk7CiAgcmVjYWxjQmlsbCgpOwoKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZlNhdmUnKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsKICAgIHZhciBidG4gPSB0aGlzOwogICAgYnRuLmRp',
  'c2FibGVkID0gdHJ1ZTsKICAgIGJ0bi5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g4LiB4Liz4Lil4Lix4LiH4Lia4Lix4LiZ4LiX4Li24LiB4oCmJzsKCiAgICByZWFkRm9ybShvcHRzLmZpZWxkcywgb3B0cy5idWNrZXQgfHwgJ21pc2Mn',
  'KS50aGVuKGZ1bmN0aW9uKGRhdGEpewogICAgICB2YXIgbWlzc2luZyA9IG9wdHMuZmllbGRzLmZpbHRlcihmdW5jdGlvbihmKXsKICAgICAgICByZXR1cm4gZi5yZXF1aXJlZCAmJiAoZGF0YVtmLmtleV0gPT0gbnVsbCB8fCBkYXRhW2Yua2V5XSA9PT0gJycpOwog',
  'ICAgICB9KTsKICAgICAgaWYgKG1pc3NpbmcubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoJ+C4geC4o+C4uOC4k+C4suC4geC4o+C4reC4gTogJyArIG1pc3NpbmcubWFwKGZ1bmN0aW9uKGYpeyByZXR1cm4gZi5sYWJlbDsgfSkuam9pbignLCAnKSk7CgogICAgICB2',
  'YXIgcmVjb3JkID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0cy5iYXNlIHx8IHt9LCBkYXRhKTsKICAgICAgaWYgKHJlYy5pZCkgcmVjb3JkLmlkID0gcmVjLmlkOwogICAgICByZXR1cm4gY2FsbEFwaShvcHRzLmFjdGlvbiwgT2JqZWN0LmFzc2lnbih7IHJlY29yZDog',
  'cmVjb3JkIH0sIG9wdHMuZXh0cmEgfHwge30pKTsKICAgIH0pLnRoZW4oZnVuY3Rpb24oKXsKICAgICAgY2xvc2VNb2RhbCgpOwogICAgICAvLyDguJXguLHguKfguJrguK3guIHguKrguJbguLLguJnguLDguKHguLjguKHguILguKfguLLguJrguJnguILguLbguYng',
  'uJkgIuC4muC4seC4meC4l+C4tuC4geC5geC4peC5ieC4pyIg4LmD4Lir4LmJ4Lit4Lii4Li54LmI4LmB4Lil4LmJ4LinIOC4iOC4tuC4h+C5hOC4oeC5iOC4leC5ieC4reC4h+C5gOC4lOC5ieC4hyB0b2FzdCDguIvguYnguLMKICAgICAgLy8g4LmB4Lil4LmJ4Lin',
  '4LiL4Li04LiH4LiB4LmM4LmA4LiH4Li14Lii4LiaIOC5hiDguYTguKHguYjguKXguYnguLLguIfguKvguJnguYnguLLguYHguKXguLDguYTguKHguYjguYDguJTguYnguIfguIHguKXguLHguJrguYTguJvguJrguJnguKrguLjguJQKICAgICAgbG9hZCh7IHF1aWV0',
  'OiB0cnVlIH0pOwogICAgICAvLyDguJ/guK3guKPguYzguKHguJfguLXguYjguYDguJvguLTguJTguKHguLLguIjguLLguIHguKvguJnguYnguLLguJXguYjguLLguIfguK3guLfguYjguJkgKOC5gOC4iuC5iOC4mSDguJfguKPguLHguJ7guKLguYzguKrguLTguJng',
  'uYPguJnguKvguJnguYnguLLguKvguYnguK3guIcpIOC4guC4reC5gOC4m+C4tOC4lOC4q+C4meC5ieC4suC4meC4seC5ieC4meC4geC4peC4seC4muC4hOC4t+C4mQogICAgICBpZiAodHlwZW9mIG9wdHMuYWZ0ZXIgPT09ICdmdW5jdGlvbicpIG9wdHMuYWZ0ZXIo',
  'KTsKICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTsKICAgICAgYnRuLnRleHRDb250ZW50ID0gcmVjLmlkID8gJ+C4muC4seC4meC4l+C4tuC4geC4geC4suC4o+C5geC4geC5ieC5hOC4gicgOiAn4Lia4Lix4LiZ4LiX',
  '4Li24LiBJzsKICAgICAgdG9hc3QoZS5tZXNzYWdlIHx8IGUsICdlcnInKTsKICAgIH0pOwogIH07Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguK3guYjguLLguJnguILguYnguK3g',
  'uITguKfguLLguKHguIjguLLguIHguKPguLnguJsgKE9DUikg4LmB4Lil4LmJ4Lin4LiK4LmI4Lin4Lii4LiB4Lij4Lit4LiB4Lif4Lit4Lij4LmM4LihCgogICDguJfguLjguIHguITguYjguLLguJfguLXguYjguYTguJTguYnguYDguJvguYfguJnguYHguITguYjg',
  'uILguYnguK3guYDguKrguJnguK0g4Lic4Li54LmJ4LmD4LiK4LmJ4LiB4LiU4LmA4LiV4Li04Lih4LmA4Lit4LiH4LiX4Li14Lil4Liw4LiK4LmI4Lit4LiH4Lir4Lij4Li34Lit4LmA4LiV4Li04Lih4LiX4Lix4LmJ4LiH4Lir4Lih4LiU4LiB4LmH4LmE4LiU4LmJ',
  'CiAgIOC5geC4peC4sOC5geC4geC5ieC5hOC4guC4leC5iOC4reC5hOC4lOC5ieC5gOC4quC4oeC4rSDguYDguJ7guKPguLLguLDguJXguLHguKfguK3guYjguLLguJnguJ7guKXguLLguJTguYTguJTguYkg4LmC4LiU4Lii4LmA4LiJ4Lie4Liy4Liw4Lil4Liy4Lii',
  '4Lih4Li34Lit4LiB4Lix4Lia4Lij4Li54Lib4LmA4Lit4Li14Lii4LiHCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwoKdmFyIE9DUl9NQVggPSA4ICogMTAyNCAqIDEwMjQ7ICAgLy8g4Lij',
  '4Li54Lib4LmD4Lir4LiN4LmI4LiB4Lin4LmI4Liy4LiZ4Li14LmJ4Liq4LmI4LiH4LmE4Lib4Lit4LmI4Liy4LiZ4LmB4Lil4LmJ4Lin4Lih4Lix4LiB4Lir4Lih4LiU4LmA4Lin4Lil4LiyCgpmdW5jdGlvbiBvY3JVc2FibGUoKXsKICByZXR1cm4gISEoRk9STS5v',
  'Y3IgJiYgUy5ib290ICYmIFMuYm9vdC5zZXR0aW5ncyAmJiBTLmJvb3Quc2V0dGluZ3Mub2NyRW5hYmxlZCk7Cn0KCi8qKiDguKPguLnguJvguYHguKPguIHguJfguLXguYjguJ7guK3guK3guYjguLLguJnguYTguJTguYkgKOC4guC5ieC4suC4oeC5hOC4n+C4peC5',
  'jOC5g+C4q+C4jeC5iOC5gOC4geC4tOC4meC5geC4peC4sOC5hOC4n+C4peC5jOC4l+C4teC5iOC5hOC4oeC5iOC5g+C4iuC5iOC4o+C4ueC4my9QREYpICovCmZ1bmN0aW9uIGZpcnN0UmVhZGFibGUoZmlsZXMpewogIGZvciAodmFyIGkgPSAwOyBpIDwgZmlsZXMu',
  'bGVuZ3RoOyBpKyspIHsKICAgIHZhciBmID0gZmlsZXNbaV07CiAgICBpZiAoZi5zaXplIDw9IE9DUl9NQVggJiYgL15pbWFnZVwvfHBkZiQvLnRlc3QoZi50eXBlIHx8ICcnKSkgcmV0dXJuIGY7CiAgfQogIHJldHVybiBudWxsOwp9CgovKioKICogQHBhcmFtIHtz',
  'dHJpbmd9IGlkICBpZCDguILguK3guIfguIrguYjguK3guIfguYHguJnguJrguYTguJ/guKXguYwg4LmA4LiK4LmI4LiZIGZfc2xpcHMKICogQHBhcmFtIHtib29sZWFufSBhdXRvIHRydWUgPSDguYDguJXguLTguKHguIrguYjguK3guIfguJfguLXguYjguKLguLHg',
  'uIfguKfguYjguLLguIfguYPguKvguYnguYDguKXguKLguYLguJTguKLguYTguKHguYjguJXguYnguK3guIfguIHguJQKICovCmZ1bmN0aW9uIHJ1bk9jcihpZCwgYXV0byl7CiAgdmFyIGlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpOwogIHZhciBz',
  'bG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQgKyAnX29jcicpOwogIGlmICghaW5wdXQgfHwgIXNsb3QpIHJldHVybjsKCiAgdmFyIGZpbGUgPSBmaXJzdFJlYWRhYmxlKEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGlucHV0LmZpbGVzIHx8IFtdKSk7',
  'CiAgaWYgKCFmaWxlKSB7IHNsb3QuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9ImhpbnQgbXQ4Ij7guYTguKHguYjguKHguLXguKPguLnguJvguJfguLXguYjguK3guYjguLLguJnguYTguJTguYkgKOC4o+C4reC4h+C4o+C4seC4muC4o+C4ueC4m+C4oOC4suC4nuC5',
  'geC4peC4sCBQREYg4LmE4Lih4LmI4LmA4LiB4Li04LiZIDggTUIpPC9kaXY+JzsgcmV0dXJuOyB9CgogIHNsb3QuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9Im9jci1ib3giPjxkaXYgY2xhc3M9ImhkIj48c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDguIHguLPg',
  'uKXguLHguIfguK3guYjguLLguJnguILguYnguK3guITguKfguLLguKHguIjguLLguIEgJyArCiAgICAgICAgICAgICAgICAgICBlc2MoZmlsZS5uYW1lLnNsaWNlKDAsIDI4KSkgKyAn4oCmPC9kaXY+PC9kaXY+JzsKCiAgcmVhZEFzRGF0YVVybChmaWxlKS50aGVu',
  'KGZ1bmN0aW9uKHApewogICAgcmV0dXJuIGNhbGxBcGkoJ29jci5yZWFkJywgeyBkYXRhVXJsOiBwLmRhdGFVcmwsIG1pbWVUeXBlOiBwLm1pbWVUeXBlIH0pOwogIH0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICBzbG90LmlubmVySFRNTCA9IG9jckJveEh0bWwoaWQs',
  'IHIpOwogICAgT0NSX0xBU1RbaWRdID0gcjsKICAgIGlmIChhdXRvKSB7CiAgICAgIHZhciBuID0gb2NyQXBwbHlBbGwoaWQsIHRydWUpOwogICAgICB0b2FzdChuID8gJ+C4reC5iOC4suC4meC4o+C4ueC4m+C5geC4peC5ieC4pyDguYDguJXguLTguKHguYPguKvg',
  'uYkgJyArIG4gKyAnIOC4iuC5iOC4reC4hyDigJQg4LiV4Lij4Lin4LiI4LiU4Li54LiB4LmI4Lit4LiZ4Lia4Lix4LiZ4LiX4Li24LiB4LiZ4LiwJyA6ICfguK3guYjguLLguJnguKPguLnguJvguYHguKXguYnguKcg4LmB4LiV4LmI4Lii4Lix4LiH4LiI4Lix4Lia',
  '4LiE4LmI4Liy4LiX4Li14LmI4LmD4LiK4LmJ4LmE4LiU4LmJ4LmE4Lih4LmI4LmE4LiU4LmJJywgbiA/ICdvaycgOiAnJyk7CiAgICB9CiAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7CiAgICBzbG90LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJvY3ItYm94Ij48ZGl2',
  'IGNsYXNzPSJoZCI+4pqg77iPIOC4reC5iOC4suC4meC4o+C4ueC4m+C5hOC4oeC5iOC4quC4s+C5gOC4o+C5h+C4iDwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iaGludCI+JyArIGVzYyhlLm1lc3NhZ2UgfHwgZSkgKyAnPC9kaXY+JyArCiAgICAgICc8YnV0',
  'dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSBtdDgiIG9uY2xpY2s9InJ1bk9jcihcJycgKyBpZCArICdcJykiPuC4peC4reC4h+C4reC4teC4geC4hOC4o+C4seC5ieC4hzwvYnV0dG9uPjwvZGl2Pic7CiAgfSk7Cn0KCnZhciBPQ1JfTEFTVCA9IHt9OwoK',
  'LyoqIOC4hOC5iOC4suC4l+C4teC5iOC4reC5iOC4suC4meC5hOC4lOC5iSDguITguLnguYjguIHguLHguJrguIrguYjguK3guIfguYPguJnguJ/guK3guKPguYzguKHguJfguLXguYjguIjguLDguYDguK3guLLguYTguJvguYPguKrguYggKi8KZnVuY3Rpb24gb2Ny',
  'UGFpcnMocil7CiAgdmFyIG0gPSBGT1JNLm9jciB8fCB7fTsKICB2YXIgZyA9IHIuZ3Vlc3MgfHwge307CiAgdmFyIG91dCA9IFtdOwogIGlmIChtLmRhdGUgICAmJiBnLmRhdGUpICAgb3V0LnB1c2goeyBmaWVsZDogbS5kYXRlLCAgIGxhYmVsOiAn4Lin4Lix4LiZ',
  '4LiX4Li14LmIJywgICAgIHZhbHVlOiBnLmRhdGUsICAgc2hvdzogdGhEYXRlKGcuZGF0ZSkgfSk7CiAgaWYgKG0uYW1vdW50ICYmIGcuYW1vdW50KSBvdXQucHVzaCh7IGZpZWxkOiBtLmFtb3VudCwgbGFiZWw6ICfguIjguLPguJnguKfguJnguYDguIfguLTguJkn',
  'LCAgdmFsdWU6IGcuYW1vdW50LCBzaG93OiBiYWh0KGcuYW1vdW50KSB9KTsKICBpZiAobS52ZW5kb3IgJiYgZy52ZW5kb3IpIG91dC5wdXNoKHsgZmllbGQ6IG0udmVuZG9yLCBsYWJlbDogJ+C4o+C5ieC4suC4mS/guJzguLnguYnguILguLLguKInLCB2YWx1ZTog',
  'Zy52ZW5kb3IsIHNob3c6IGcudmVuZG9yIH0pOwogIGlmIChtLnRpdGxlICAmJiBnLnRpdGxlKSAgb3V0LnB1c2goeyBmaWVsZDogbS50aXRsZSwgIGxhYmVsOiAn4LiK4Li34LmI4Lit4Lij4Liy4Lii4LiB4Liy4LijJywgIHZhbHVlOiBnLnRpdGxlLCAgc2hvdzog',
  'Zy50aXRsZSB9KTsKICBpZiAobS5ub3RlICAgJiYgZy5yZWYpICAgIG91dC5wdXNoKHsgZmllbGQ6IG0ubm90ZSwgICBsYWJlbDogJ+C5gOC4peC4guC4reC5ieC4suC4h+C4reC4tOC4hycsICB2YWx1ZTogJ+C4reC5ieC4suC4h+C4reC4tOC4hyAnICsgZy5yZWYs',
  'IHNob3c6IGcucmVmIH0pOwogIC8vIOC5g+C4muC5gOC4quC4o+C5h+C4iOC4q+C4peC4suC4ouC4o+C4suC4ouC4geC4suC4owogIGlmIChnLml0ZW1zICYmIGcuaXRlbXMubGVuZ3RoID4gMSkgewogICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmX2xp',
  'bmVzJykpIHsKICAgICAgLy8g4Lif4Lit4Lij4LmM4Lih4LiZ4Li14LmJ4Lih4Li14LiV4Liy4Lij4Liy4LiH4Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4LiiIOKAlCDguYDguJXguLTguKHguKXguIfguJXguLLguKPguLLguIfguYDguKXguKIg4LmE4LiU4LmJ',
  '4LiX4Lix4LmJ4LiH4LiK4Li34LmI4LitIOC4iOC4s+C4meC4p+C4mSDguYHguKXguLDguKPguLLguITguLLguYHguKLguIHguIHguLHguJkKICAgICAgb3V0LnB1c2goeyBmaWVsZDogJ19saW5lcycsIGxhYmVsOiAn4Lij4Liy4Lii4LiB4Liy4Lij4LmD4LiZ4Lia',
  '4Li04LilJywgdmFsdWU6IGcuaXRlbXMsCiAgICAgICAgICAgICAgICAgc2hvdzogJ+C5gOC4leC4tOC4oSAnICsgZy5pdGVtcy5sZW5ndGggKyAnIOC4o+C4suC4ouC4geC4suC4o+C4peC4h+C4leC4suC4o+C4suC4hycsIGxpbmVzOiB0cnVlIH0pOwogICAgfSBl',
  'bHNlIGlmIChtLnRpdGxlKSB7CiAgICAgIHZhciBsaW5lcyA9IGcuaXRlbXMubWFwKGZ1bmN0aW9uKGl0LCBpKXsgcmV0dXJuIChpKzEpICsgJy4nICsgaXQubmFtZSArICcgJyArIG1vbmV5KGl0LnByaWNlLCAyKSArICcg4Li/JzsgfSkuam9pbignXG4nKTsKICAg',
  'ICAgb3V0LnB1c2goeyBmaWVsZDogbS50aXRsZSwgbGFiZWw6ICfguJfguLjguIHguKPguLLguKLguIHguLLguKMgKCcgKyBnLml0ZW1zLmxlbmd0aCArICcpJywgdmFsdWU6IGxpbmVzLAogICAgICAgICAgICAgICAgIHNob3c6IGcuaXRlbXMubGVuZ3RoICsgJyDg',
  'uKPguLLguKLguIHguLLguKPguYPguJnguYPguJrguYDguKrguKPguYfguIgnLCBtdWx0aTogdHJ1ZSB9KTsKICAgIH0KICB9CiAgcmV0dXJuIG91dDsKfQoKZnVuY3Rpb24gb2NyQm94SHRtbChpZCwgcil7CiAgdmFyIHBhaXJzID0gb2NyUGFpcnMocik7CiAgaWYg',
  'KCFwYWlycy5sZW5ndGgpIHsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0ib2NyLWJveCI+PGRpdiBjbGFzcz0iaGQiPvCflI4g4Lit4LmI4Liy4LiZ4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LmE4LiU4LmJIOC5geC4leC5iOC4ouC4seC4h+C4iOC4seC4muC4hOC5iOC4',
  'suC4l+C4teC5iOC5g+C4iuC5ieC5hOC4lOC5ieC5hOC4oeC5iOC5hOC4lOC5iScgKwogICAgICAnPHNwYW4gY2xhc3M9InNwIj48YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0ib2NyVG9nZ2xlUmF3KFwnJyArIGlkICsgJ1wnKSI+',
  '4LiU4Li54LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiX4Li14LmI4Lit4LmI4Liy4LiZ4LmE4LiU4LmJPC9idXR0b24+PC9zcGFuPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0ib2NyLXJhdyIgaWQ9IicgKyBpZCArICdfcmF3IiBoaWRkZW4+JyArIGVzYyhyLnRl',
  'eHQgfHwgJyjguKfguYjguLLguIcpJykgKyAnPC9kaXY+PC9kaXY+JzsKICB9CiAgcmV0dXJuICc8ZGl2IGNsYXNzPSJvY3ItYm94Ij4nICsKICAgICc8ZGl2IGNsYXNzPSJoZCI+8J+UjiDguK3guYjguLLguJnguIjguLLguIHguKPguLnguJvguYTguJTguYnguYHg',
  'uJrguJrguJnguLXguYkg4oCUIOC4geC4lOC5gOC4leC4tOC4oeC4iuC5iOC4reC4h+C4l+C4teC5iOC4leC5ieC4reC4h+C4geC4suC4oycgKwogICAgICAnPHNwYW4gY2xhc3M9InNwIj4nICsKICAgICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJi',
  'dG4gc20gcHJpIiBvbmNsaWNrPSJvY3JBcHBseUFsbChcJycgKyBpZCArICdcJykiPuC5gOC4leC4tOC4oeC4l+C4seC5ieC4h+C4q+C4oeC4lDwvYnV0dG9uPicgKwogICAgICAgICc8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBzbSIgb25jbGljaz0i',
  'b2NyVG9nZ2xlUmF3KFwnJyArIGlkICsgJ1wnKSI+4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LmA4LiV4LmH4LihPC9idXR0b24+JyArCiAgICAgICc8L3NwYW4+PC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0ib2NyLWhpdHMiPicgKyBwYWlycy5tYXAoZnVuY3Rpb24o',
  'cCwgaSl7CiAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0ib2NyLWhpdCI+JyArCiAgICAgICAgJzxzcGFuIGNsYXNzPSJrIj4nICsgZXNjKHAubGFiZWwpICsgJzwvc3Bhbj4nICsKICAgICAgICAnPHNwYW4gY2xhc3M9InYiIHRpdGxlPSInICsgZXNjKHAubGluZXMg',
  'PyBwLnNob3cgOiBTdHJpbmcocC52YWx1ZSkpICsgJyI+JyArIGVzYyhwLnNob3cpICsgJzwvc3Bhbj4nICsKICAgICAgICAnPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9Im9jckFwcGx5T25lKFwnJyArIGlkICsgJ1wnLCcgKyBp',
  'ICsgJykiPuC5gOC4leC4tOC4oTwvYnV0dG9uPicgKwogICAgICAnPC9kaXY+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9Im9jci1yYXciIGlkPSInICsgaWQgKyAnX3JhdyIgaGlkZGVuPicgKyBlc2Moci50ZXh0IHx8ICco',
  '4Lin4LmI4Liy4LiHKScpICsgJzwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9ImhpbnQgbXQ4Ij7guJXguKPguKfguIjguITguKfguLLguKHguJbguLnguIHguJXguYnguK3guIfguIHguYjguK3guJnguJrguLHguJnguJfguLbguIHguYDguKrguKHguK0g4oCUIOC5',
  'geC4geC5ieC5g+C4meC4iuC5iOC4reC4h+C5hOC4lOC5ieC4leC4suC4oeC4m+C4geC4leC4tDwvZGl2PicgKwogICc8L2Rpdj4nOwp9CgpmdW5jdGlvbiBvY3JUb2dnbGVSYXcoaWQpewogIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkICsgJ19y',
  'YXcnKTsKICBpZiAoZWwpIGVsLmhpZGRlbiA9ICFlbC5oaWRkZW47Cn0KCi8qKiDguYPguKrguYjguITguYjguLLguKXguIfguIrguYjguK3guIcg4LmB4Lil4LmJ4Lin4LmE4Liu4LmE4Lil4LiV4LmM4LmD4Lir4LmJ4LmA4Lir4LmH4LiZ4Lin4LmI4Liy4LiK4LmI',
  '4Lit4LiH4LmE4Lir4LiZ4LiW4Li54LiB4LmA4LiV4Li04LihICovCmZ1bmN0aW9uIG9jckZpbGwoZmllbGRLZXksIHZhbHVlKXsKICAvLyDguYDguJXguLTguKHguKXguIfguJXguLLguKPguLLguIfguKPguLLguKLguIHguLLguKPguKLguYjguK3guKIgKOC5g+C4',
  'muC5gOC4quC4o+C5h+C4iOC4l+C4teC5iOC4oeC4teC4guC4reC4h+C4q+C4peC4suC4ouC4reC4ouC5iOC4suC4hykKICBpZiAoZmllbGRLZXkgPT09ICdfbGluZXMnKSB7CiAgICB2YXIgYWRkID0gKHZhbHVlIHx8IFtdKS5tYXAoZnVuY3Rpb24oaXQpewogICAg',
  'ICByZXR1cm4geyBuYW1lOiBpdC5uYW1lLCBxdHk6IDEsIHVuaXQ6ICcnLCBwcmljZTogTnVtYmVyKGl0LnByaWNlKSB8fCAwIH07CiAgICB9KTsKICAgIGlmICghYWRkLmxlbmd0aCkgcmV0dXJuIGZhbHNlOwogICAgRk9STS5saW5lcyA9IChGT1JNLmxpbmVzIHx8',
  'IFtdKS5maWx0ZXIoZnVuY3Rpb24obCl7IHJldHVybiBTdHJpbmcobC5uYW1lIHx8ICcnKS50cmltKCk7IH0pLmNvbmNhdChhZGQpOwogICAgcmVkcmF3TGluZXMoKTsKICAgIHZhciBib3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl9saW5lcycpOwogICAg',
  'aWYgKGJveCkgewogICAgICBib3guY2xhc3NMaXN0LmFkZCgnb2NyLWZpbGxlZCcpOwogICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IGJveC5jbGFzc0xpc3QucmVtb3ZlKCdvY3ItZmlsbGVkJyk7IH0sIDE2MDApOwogICAgfQogICAgcmV0dXJuIHRydWU7CiAg',
  'fQoKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZl8nICsgZmllbGRLZXkpOwogIGlmICghZWwpIHJldHVybiBmYWxzZTsKICBlbC52YWx1ZSA9IHZhbHVlOwogIGVsLmNsYXNzTGlzdC5hZGQoJ29jci1maWxsZWQnKTsKICBzZXRUaW1lb3V0KGZ1',
  'bmN0aW9uKCl7IGVsLmNsYXNzTGlzdC5yZW1vdmUoJ29jci1maWxsZWQnKTsgfSwgMTYwMCk7CiAgcmVjYWxjU3VtcygpOwogIHJldHVybiB0cnVlOwp9CgpmdW5jdGlvbiBvY3JBcHBseU9uZShpZCwgaWR4KXsKICB2YXIgciA9IE9DUl9MQVNUW2lkXTsKICBpZiAo',
  'IXIpIHJldHVybjsKICB2YXIgcCA9IG9jclBhaXJzKHIpW2lkeF07CiAgaWYgKHAgJiYgb2NyRmlsbChwLmZpZWxkLCBwLnZhbHVlKSkgewogICAgdG9hc3QocC5saW5lcyA/ICfguYDguJXguLTguKEgJyArIHAudmFsdWUubGVuZ3RoICsgJyDguKPguLLguKLguIHg',
  'uLLguKPguKXguIfguJrguLTguKXguYHguKXguYnguKcg4oCUIOC4leC4o+C4p+C4iOC4iOC4s+C4meC4p+C4meC4geC4seC4muC4o+C4suC4hOC4suC4reC4teC4geC4hOC4o+C4seC5ieC4hycgOiAn4LmA4LiV4Li04LihJyArIHAubGFiZWwgKyAn4LmB4Lil4LmJ',
  '4LinJywgJ29rJyk7CiAgfQp9CgovKioKICogQHBhcmFtIHtib29sZWFufSBvbmx5RW1wdHkgdHJ1ZSA9IOC5gOC4leC4tOC4oeC5gOC4ieC4nuC4suC4sOC4iuC5iOC4reC4h+C4l+C4teC5iOC4ouC4seC4h+C4p+C5iOC4suC4hyAo4LmD4LiK4LmJ4LiV4Lit4LiZ',
  '4LmA4LiV4Li04Lih4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0CiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIOC4iOC4sOC5hOC4lOC5ieC5hOC4oeC5iOC4l+C4seC4muC4quC4tOC5iOC4h+C4l+C4teC5iOC4nOC4ueC5ieC5g+C4iuC5ieC4nuC4tOC4',
  'oeC4nuC5jOC5hOC4m+C5geC4peC5ieC4pykKICogQHJldHVybiB7bnVtYmVyfSDguIjguLPguJnguKfguJnguIrguYjguK3guIfguJfguLXguYjguYDguJXguLTguKHguIjguKPguLTguIcKICovCmZ1bmN0aW9uIG9jckFwcGx5QWxsKGlkLCBvbmx5RW1wdHkpewog',
  'IHZhciByID0gT0NSX0xBU1RbaWRdOwogIGlmICghcikgcmV0dXJuIDA7CiAgdmFyIGRvbmUgPSB7fTsKICB2YXIgbiA9IDA7CiAgb2NyUGFpcnMocikuZm9yRWFjaChmdW5jdGlvbihwKXsKICAgIGlmIChkb25lW3AuZmllbGRdKSByZXR1cm47ICAgICAgICAgICAg',
  'ICAgICAgICAgICAvLyDguIrguYjguK3guIfguYDguJTguLXguKLguKfguIHguLHguJnguYDguJXguLTguKHguITguKPguLHguYnguIfguYDguJTguLXguKLguKcg4LmA4Lit4Liy4LiV4Lix4Lin4LmB4Lij4LiBCiAgICBpZiAocC5maWVsZCA9PT0gJ19saW5lcycp',
  'IHsKICAgICAgLy8g4LiV4Liy4Lij4Liy4LiH4Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4LiiOiAi4Lin4LmI4Liy4LiHIiDguKvguKHguLLguKLguJbguLbguIfguKLguLHguIfguYTguKHguYjguKHguLXguKPguLLguKLguIHguLLguKPguJfguLXguYjguJXg',
  'uLHguYnguIfguIrguLfguYjguK3guYTguKfguYkKICAgICAgaWYgKG9ubHlFbXB0eSAmJiAoRk9STS5saW5lcyB8fCBbXSkuc29tZShmdW5jdGlvbihsKXsgcmV0dXJuIFN0cmluZyhsLm5hbWUgfHwgJycpLnRyaW0oKTsgfSkpIHJldHVybjsKICAgIH0gZWxzZSB7',
  'CiAgICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmXycgKyBwLmZpZWxkKTsKICAgICAgaWYgKCFlbCkgcmV0dXJuOwogICAgICBpZiAob25seUVtcHR5ICYmIFN0cmluZyhlbC52YWx1ZSB8fCAnJykudHJpbSgpICE9PSAnJykgcmV0dXJuOwog',
  'ICAgfQogICAgaWYgKG9jckZpbGwocC5maWVsZCwgcC52YWx1ZSkpIHsgZG9uZVtwLmZpZWxkXSA9IHRydWU7IG4rKzsgfQogIH0pOwogIGlmICghb25seUVtcHR5KSB0b2FzdChuID8gJ+C5gOC4leC4tOC4oeC5g+C4q+C5iSAnICsgbiArICcg4LiK4LmI4Lit4LiH',
  '4LmB4Lil4LmJ4LinIOKAlCDguJXguKPguKfguIjguJTguLnguIHguYjguK3guJnguJrguLHguJnguJfguLbguIEnIDogJ+C4iuC5iOC4reC4h+C4l+C4teC5iOC4iOC4sOC5gOC4leC4tOC4oeC5hOC4oeC5iOC4reC4ouC4ueC5iOC5g+C4meC4n+C4reC4o+C5jOC4',
  'oeC4meC4teC5iScsIG4gPyAnb2snIDogJ2VycicpOwogIHJldHVybiBuOwp9CgpmdW5jdGlvbiByb29tT3B0aW9ucygpeyByZXR1cm4gUy5ib290ID8gUy5ib290LnJvb21zIDogW107IH0KZnVuY3Rpb24gb3B0KG5hbWUpeyByZXR1cm4gKFMuYm9vdCAmJiBTLmJv',
  'b3Quc2NoZW1hW25hbWVdKSB8fCBbXTsgfQpmdW5jdGlvbiB0b2RheSgpeyByZXR1cm4gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNsaWNlKDAsMTApOyB9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguIHguYnguK3guJnguKvguJnguLXguYkKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1EZWJ0KHJlYywgbGVkZ2VyKXsK',
  'ICAvLyDguYDguKXguLfguK3guIHguYHguKHguYjguYTguJTguYnguIjguLLguIHguJfguLjguIHguJrguLHguI3guIrguLUg4Lii4LiB4LmA4Lin4LmJ4LiZ4LiV4Lix4Lin4LmA4Lit4LiHCiAgdmFyIGFsbCA9IChBTExfREVCVFMgfHwgW10pLmZpbHRlcihmdW5j',
  'dGlvbihkKXsgcmV0dXJuICFyZWMgfHwgZC5pZCAhPT0gcmVjLmlkOyB9KTsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguIHguYnguK3guJnguKvguJnguLXguYknIDogJ+C5gOC4nuC4tOC5iOC4oeC4geC5',
  'ieC4reC4meC4q+C4meC4teC5iScsCiAgICByZWNvcmQ6IHJlYywgYWN0aW9uOiAnZGVidC5zYXZlJywgYmFzZTogeyBsZWRnZXI6IGxlZGdlciB9LAogICAgb25EZWxldGU6IGRlbERlYnQsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3RpdGxlJywgICAgbGFi',
  'ZWw6J+C4o+C4suC4ouC4geC4suC4o+C4q+C4meC4teC5iScsIHJlcXVpcmVkOnRydWUsIGZ1bGw6dHJ1ZSwgcGg6J+C5gOC4iuC5iOC4mSDguITguYjguLLguIHguYjguK3guKrguKPguYnguLLguIcgVGhlIE0gQ29ybmVyIEFQJyB9LAogICAgICB7IGtleTonbGVk',
  'Z2VyJywgICBsYWJlbDon4Lib4Lij4Liw4LmA4Lig4LiX4Lia4Lix4LiN4LiK4Li1JywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpbJ+C4q+C4meC4teC5ieC4q+C4peC4seC4gScsJ+C4q+C4meC4teC5ieC4o+C4reC4hyddLCBibGFuazpmYWxzZSB9LAogICAgICB7',
  'IGtleTonY3JlZGl0b3InLCBsYWJlbDon4LmA4LiI4LmJ4Liy4Lir4LiZ4Li14LmJJywgcGg6J+C5gOC4iuC5iOC4mSDguITguKPguK3guJrguITguKPguLHguKcgLyDguJjguJnguLLguITguLLguKMgLyDguJvguYnguLLguJXguLInIH0sCiAgICAgIHsga2V5Oidw',
  'YXJlbnRJZCcsIGxhYmVsOifguYDguJvguYfguJnguKrguYjguKfguJnguKvguJnguLbguYjguIfguILguK3guIfguIHguYnguK3guJnguKvguJnguLXguYknLCB0eXBlOidzZWxlY3QnLCBmdWxsOnRydWUsCiAgICAgICAgb3B0aW9uczogYWxsLm1hcChmdW5jdGlv',
  'bihkKXsgcmV0dXJuIHsgdmFsdWU6ZC5pZCwgbGFiZWw6ZC50aXRsZSArICcgKCcgKyBkLmxlZGdlciArICcpJyB9OyB9KSwKICAgICAgICBoaW50OifguYPguIrguYnguYDguKHguLfguYjguK3guYDguIfguLTguJnguIHguYnguK3guJnguJnguLXguYnguYDguJvg',
  'uYfguJnguJfguLjguJnguILguK3guIfguK3guLXguIHguIHguYnguK3guJkg4LmA4LiK4LmI4LiZIOC5gOC4h+C4tOC4meC4ouC4t+C4oeC4m+C5ieC4suC4leC4suC5gOC4m+C5h+C4meC4quC5iOC4p+C4meC4q+C4meC4tuC5iOC4h+C4guC4reC4h+C4q+C4meC4',
  'teC5ieC4i+C4t+C5ieC4reC4l+C4teC5iOC4lOC4tOC4mSDigJQgJyArCiAgICAgICAgICAgICAn4LiI4LmI4Liy4Lii4LiE4Li34LiZ4LiB4LmJ4Lit4LiZ4LiZ4Li14LmJ4LmB4Lil4LmJ4Lin4LiB4LmJ4Lit4LiZ4LmB4Lih4LmI4LiI4Liw4Lil4LiU4LiV4Liy',
  '4Lih4LmE4Lib4LiU4LmJ4Lin4LiiIOC5geC4peC4sOC4ouC4reC4lOC4o+C4p+C4oeC4iOC4sOC5hOC4oeC5iOC4luC4ueC4geC4meC4seC4muC4i+C5ieC4sycgfSwKICAgICAgeyBrZXk6J3N0YXJ0RGF0ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguIHg',
  'uYjguK3guKvguJnguLXguYknLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleToncHJpbmNpcGFsJywgbGFiZWw6J+C4ouC4reC4lOC4q+C4meC4teC5ieC4leC4seC5ieC4h+C4leC5ieC4mSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JywgcmVxdWlyZWQ6dHJ1',
  'ZSB9LAogICAgICB7IGtleTonaW50ZXJlc3RQZXJNb250aCcsIGxhYmVsOifguJTguK3guIHguYDguJrguLXguYnguKLguJXguYjguK3guYDguJTguLfguK3guJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScgfSwKICAgICAgeyBrZXk6J3BsYW5QZXJNb250aCcs',
  'IGxhYmVsOifguKLguK3guJTguJzguYjguK3guJnguJXguYjguK3guYDguJTguLfguK3guJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScgfSwKICAgICAgeyBrZXk6J2R1ZURheScsICAgbGFiZWw6J+C4geC4s+C4q+C4meC4lOC4iuC4s+C4o+C4sCAo4Lin4Lix',
  '4LiZ4LiX4Li14LmI4LiC4Lit4LiH4LmA4LiU4Li34Lit4LiZKScsIHR5cGU6J251bWJlcicsIHBoOicyMCcgfSwKICAgICAgeyBrZXk6J3N0YXR1cycsICAgbGFiZWw6J+C4quC4luC4suC4meC4sCcsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdkZWJ0U3Rh',
  'dHVzZXMnKSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J2Fsc29JbicsICAgbGFiZWw6J+C5geC4quC4lOC4h+C5g+C4meC4reC4teC4geC4q+C4meC5ieC4suC4lOC5ieC4p+C4oicsIHR5cGU6J3NlbGVjdCcsCiAgICAgICAgb3B0aW9uczpbIHsgdmFsdWU6',
  'J+C4q+C4meC4teC5ieC4o+C4reC4hycsIGxhYmVsOifguKvguJnguYnguLLguKvguJnguLXguYnguKrguLTguJknIH0sIHsgdmFsdWU6J+C4q+C4meC4teC5ieC4q+C4peC4seC4gScsIGxhYmVsOifguKvguJnguYnguLLguKPguLLguKLguIHguLLguKPguKrguKPg',
  'uLjguJvguKPguKfguKEnIH0gXSwKICAgICAgICBoaW50OifguIHguYnguK3guJnguYDguJTguLXguKLguKfguIHguLHguJkg4LmE4Lih4LmI4LmE4LiU4LmJ4LiE4Lix4LiU4Lil4Lit4LiBIOKAlCDguJrguLHguJnguJfguLbguIHguIHguLLguKPguIrguLPguKPg',
  'uLAg4LmB4LiB4LmJIOC4q+C4o+C4t+C4reC4peC4muC4iOC4suC4geC4q+C4meC5ieC4suC5hOC4q+C4mSDguK3guLXguIHguKvguJnguYnguLLguIHguYfguYDguJvguKXguLXguYjguKLguJnguJXguLLguKEgwrcg4LmA4Lil4Li34Lit4LiB4Lir4LiZ4LmJ4Liy',
  '4LmA4LiU4Li14Lii4Lin4LiB4Lix4Lia4Lib4Lij4Liw4LmA4Lig4LiX4Lia4Lix4LiN4LiK4Li14LmE4Lin4LmJID0g4LmE4Lih4LmI4Lih4Li14Lic4LilJyB9LAogICAgICB7IGtleTonbm90ZScsICAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4',
  'JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwogIGlmICghcmVjKSB7IHZhciBlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZfbGVkZ2VyJyk7IGlmIChlKSBlLnZhbHVlID0gbGVkZ2VyOyB9Cn0KCmZ1bmN0aW9uIGRlbERlYnQo',
  'aWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4geC5ieC4reC4meC4q+C4meC4teC5ieC4meC4teC5iT8gKOC4luC5ieC4suC4ouC4seC4h+C4oeC4teC4o+C4suC4ouC4geC4suC4o+C4iuC4s+C4o+C4sOC4q+C4o+C4t+C4reC4geC5ieC4reC4meC4ouC5iOC4',
  'reC4ouC4nOC4ueC4geC4reC4ouC4ueC5iCDguKPguLDguJrguJrguIjguLDguYTguKHguYjguKLguK3guKHguKXguJog4LmA4Lie4Li34LmI4Lit4LmE4Lih4LmI4LmD4Lir4LmJ4Lii4Lit4LiU4Lii4LmJ4Liy4Lii4LmE4Lib4LiB4LmJ4Lit4LiZ4Lit4Li34LmI',
  '4LiZ4LmA4LiH4Li14Lii4LiaIOC5hiknLCBmdW5jdGlvbigpewogICAgY2FsbEFwaSgnZGVidC5kZWxldGUnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7',
  'IH0pCiAgICAgIC5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3guKPguYzg',
  'uKE6IOC4o+C4suC4ouC4geC4suC4o+C5guC4reC4meC5g+C4iuC5ieC4q+C4meC4teC5iQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybURlYnRQYXltZW50KHJlYywg',
  'bGVkZ2VyKXsKICB2YXIgZGVidHMgPSAoUy5jYWNoZVtTLnBhZ2VdICYmIFMuY2FjaGVbUy5wYWdlXS5kZWJ0cykgfHwgW107CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4Lij4Liy4Lii4LiB4Liy4Lij4LiK',
  '4Liz4Lij4LiwJyA6ICfguJrguLHguJnguJfguLbguIHguIHguLLguKPguYLguK3guJnguYPguIrguYnguKvguJnguLXguYknLAogICAgcmVjb3JkOiByZWMgfHwgeyBwYXlEYXRlOiB0b2RheSgpLCBjaGFubmVsOiAn4LmC4Lit4LiZIFFSJyB9LAogICAgLy8g4LmB',
  '4LiB4LmJ4Lij4Liy4Lii4LiB4Liy4Lij4LmA4LiU4Li04Lih4LiE4LiH4Lia4Lix4LiN4LiK4Li14LmA4LiU4Li04Lih4LmE4Lin4LmJIOKAlCDguKPguLLguKLguIHguLLguKPguJfguLXguYjguKHguLLguIjguLLguIHguK3guLXguIHguKvguJnguYnguLIgKOC4',
  'geC5ieC4reC4meC4l+C4teC5iOC5geC4quC4lOC4h+C4o+C5iOC4p+C4oSkg4LiV4LmJ4Lit4LiH4LmE4Lih4LmI4LiW4Li54LiB4Lii4LmJ4Liy4Lii4Lia4Lix4LiN4LiK4Li1CiAgICBhY3Rpb246ICdkZWJ0LnNhdmVQYXltZW50JywgYmFzZTogeyBsZWRnZXI6',
  'IChyZWMgJiYgcmVjLmxlZGdlcikgfHwgbGVkZ2VyIH0sIGJ1Y2tldDogJ2RlYnQnLAogICAgb2NyOiB7IGRhdGU6J3BheURhdGUnLCBhbW91bnQ6J3ByaW5jaXBhbCcsIG5vdGU6J25vdGUnIH0sCiAgICBvbkRlbGV0ZTogZGVsRGVidFBheW1lbnQsCiAgICBmaWVs',
  'ZHM6IFsKICAgICAgeyBrZXk6J3BheURhdGUnLCBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiK4Liz4Lij4LiwJywgdHlwZTonZGF0ZScsIHJlcXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J2NoYW5uZWwnLCBsYWJlbDon4LiK4LmI4Lit4LiH4LiX4Liy4LiH',
  'JywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ3BheUNoYW5uZWxzJykgfSwKICAgICAgeyBrZXk6J3ByaW5jaXBhbCcsIGxhYmVsOifguYDguIfguLTguJnguJXguYnguJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHN1bXM6dHJ1ZSwKICAgICAgICBo',
  'aW50OifguKrguYjguKfguJnguJfguLXguYjguYTguJvguKXguJTguKLguK3guJTguKvguJnguLXguYnguIjguKPguLTguIcnIH0sCiAgICAgIHsga2V5OidpbnRlcmVzdCcsICBsYWJlbDon4LiU4Lit4LiB4LmA4Lia4Li14LmJ4LiiICjguJrguLLguJcpJywgdHlw',
  'ZTonbW9uZXknLCBzdW1zOnRydWUsCiAgICAgICAgaGludDon4LmE4Lih4LmI4LiW4Li54LiB4LiZ4Liz4LmE4Lib4Lil4LiU4Lii4Lit4LiU4Lir4LiZ4Li14LmJJyB9LAogICAgICB7IGtleTonX3RvdGFsJywgIGxhYmVsOifguKPguKfguKHguJfguLXguYjguYLg',
  'uK3guJknLCB0eXBlOidjb21wdXRlZCcsIGZyb206WydwcmluY2lwYWwnLCdpbnRlcmVzdCddLAogICAgICAgIGhpbnQ6J+C4leC4o+C4p+C4iOC5g+C4q+C5ieC4leC4o+C4h+C4geC4seC4muC4ouC4reC4lOC5g+C4meC4quC4peC4tOC4myDCtyDguKPguLDguJrg',
  'uJrguITguLTguJTguYPguKvguYnguK3guLHguJXguYLguJnguKHguLHguJXguLQnIH0sCiAgICAgIHsga2V5OidpbnN0YWxsbWVudCcsIGxhYmVsOifguIfguKfguJTguJfguLXguYgnLCBwaDon4LmA4LiK4LmI4LiZIDkvMjAyNicgfSwKICAgICAgeyBrZXk6J2Rl',
  'YnRJZCcsICBsYWJlbDon4Lic4Li54LiB4LiB4Lix4Lia4LiB4LmJ4Lit4LiZ4Lir4LiZ4Li14LmJJywgdHlwZTonc2VsZWN0JywKICAgICAgICBvcHRpb25zOiBkZWJ0cy5tYXAoZnVuY3Rpb24oZCl7IHJldHVybiB7IHZhbHVlOmQuaWQsIGxhYmVsOmQudGl0bGUg',
  'fTsgfSksCiAgICAgICAgaGludDon4LmA4Lin4LmJ4LiZ4Lin4LmI4Liy4LiH4LmE4LiU4LmJIOKAlCDguKPguLDguJrguJrguJXguLHguJTguIHguYnguK3guJnguYDguIHguYjguLLguIHguYjguK3guJnguYPguKvguYnguYDguK3guIcgwrcg4LmA4Lil4Li34Lit',
  '4LiB4LiB4LmJ4Lit4LiZ4LiX4Li14LmI4Lih4Liy4LiI4Liy4LiB4Lit4Li14LiB4Lir4LiZ4LmJ4LiyIOC4ouC4reC4lOC4iOC4sOC5gOC4guC5ieC4suC4l+C4seC5ieC4h+C4quC4reC4h+C4q+C4meC5ieC4sicgfSwKICAgICAgeyBrZXk6J3BheWVyJywgICBs',
  'YWJlbDon4Lic4Li54LmJ4LiK4Liz4Lij4LiwJyB9LAogICAgICB7IGtleTonc2xpcHMnLCAgIGxhYmVsOifguKrguKXguLTguJvguIHguLLguKPguYLguK3guJknLCB0eXBlOidmaWxlcycsIGZ1bGw6dHJ1ZSB9LAogICAgICB7IGtleTonbm90ZScsICAgIGxhYmVs',
  'OifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCi8qKgogKiDguKLguK3guJTguYPguJnguKPguLDguJrguJrguYTguKHguYjguJXguKPguIfguIHguLHguJrguKLguK3guJTguJfguLXg',
  'uYjguYDguIjguYnguLLguKvguJnguLXguYnguYHguIjguYnguIcg4oaSIOC4geC4o+C4reC4geC4ouC4reC4lOC4hOC4h+C5gOC4q+C4peC4t+C4reC4iOC4o+C4tOC4hyDguKPguLDguJrguJrguJrguLHguJnguJfguLbguIHguKrguYjguKfguJnguJXguYjguLLg',
  'uIfguYPguKvguYkKICog4LmE4Lih4LmI4LmE4Lib4LmB4LiB4LmJ4Lii4Lit4LiU4LiV4Lix4LmJ4LiH4LiV4LmJ4LiZIOC5gOC4nuC4o+C4suC4sOC4m+C4o+C4sOC4p+C4seC4leC4tOC4iOC4sOC5gOC4nuC4teC5ieC4ouC4mSDguKPguLLguKLguIHguLLguKPg',
  'uJvguKPguLHguJrguKLguK3guJTguKXguJrguJfguLTguYnguIfguYTguJTguYnguJbguYnguLLguIHguKPguK3guIHguJzguLTguJQKICovCmZ1bmN0aW9uIGZvcm1SZWNvbmNpbGVEZWJ0KHgpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiAn4Lib4Lij4Lix4Lia',
  '4Lii4Lit4LiU4LmD4Lir4LmJ4LiV4Lij4LiH4Lii4Lit4LiU4LiI4Lij4Li04LiHIMK3ICcgKyB4LnRpdGxlLAogICAgcmVjb3JkOiB7IHBheURhdGU6IHRvZGF5KCkgfSwKICAgIGFjdGlvbjogJ2RlYnQucmVjb25jaWxlJywgYmFzZTogeyBkZWJ0SWQ6IHguaWQg',
  'fSwKICAgIGZpZWxkczogWwogICAgICB7IGtleTonYWN0dWFsUmVtYWluaW5nJywgbGFiZWw6J+C4ouC4reC4lOC4hOC4h+C5gOC4q+C4peC4t+C4reC4iOC4o+C4tOC4h+C4leC4reC4meC4meC4teC5iSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JywgcmVxdWly',
  'ZWQ6dHJ1ZSwgZnVsbDp0cnVlLAogICAgICAgIGhpbnQ6J+C5g+C4meC4o+C4sOC4muC4muC4leC4reC4meC4meC4teC5ieC4hOC4h+C5gOC4q+C4peC4t+C4rSA8Yj4nICsgYmFodCh4LnJlbWFpbmluZykgKyAnPC9iPiDCtyDguJbguYnguLLguJvguLTguJTguKvg',
  'uJnguLXguYnguIHguYnguK3guJnguJnguLXguYnguYHguKXguYnguKcg4LmD4Liq4LmIIDAnIH0sCiAgICAgIHsga2V5OidwYXlEYXRlJywgbGFiZWw6J+C4kyDguKfguLHguJnguJfguLXguYgnLCB0eXBlOidkYXRlJywgcmVxdWlyZWQ6dHJ1ZSB9LAogICAgICB7',
  'IGtleTonbm90ZScsICAgIGxhYmVsOifguKrguLLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJlYScsIGZ1bGw6dHJ1ZSwKICAgICAgICBwaDon4LmA4LiK4LmI4LiZIOC4oeC4teC4h+C4p+C4lOC4l+C4teC5iOC5hOC4oeC5iOC5hOC4lOC5ieC4muC4seC4meC4',
  'l+C4tuC4geC5hOC4p+C5iSAvIOC5gOC4iOC5ieC4suC4q+C4meC4teC5ieC4peC4lOC5g+C4q+C5iScsCiAgICAgICAgaGludDon4Lij4Liw4Lia4Lia4Lia4Lix4LiZ4LiX4Li24LiB4Liq4LmI4Lin4LiZ4LiV4LmI4Liy4LiH4LmA4Lib4LmH4LiZ4Lij4Liy4Lii',
  '4LiB4Liy4Lij4LiK4LmI4Lit4LiH4LiX4Liy4LiHICLguJvguKPguLHguJrguKLguK3guJQiIOC4nOC4ueC4geC4geC4seC4muC4geC5ieC4reC4meC4meC4teC5iSAnICsKICAgICAgICAgICAgICfguYTguKHguYjguJnguLHguJrguYDguJvguYfguJnguKLguK3g',
  'uJTguJzguYjguK3guJnguKPguLLguKLguJvguLXguYHguKXguLDguYTguKHguYjguYPguIrguYnguITguLLguJTguIHguLLguKPguJPguYzguKfguLHguJnguJvguLTguJTguKvguJnguLXguYkgwrcg4LiB4Lij4Lit4LiB4Lic4Li04LiU4LiB4LmH4Lil4Lia4Lij',
  '4Liy4Lii4LiB4Liy4Lij4LiZ4Lix4LmJ4LiZ4LiX4Li04LmJ4LiH4LmE4LiU4LmJJyB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbERlYnRQYXltZW50KGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguKPguLLguKLguIHguLLguKPguIrguLPguKPguLDg',
  'uJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2RlYnQuZGVsZXRlUGF5bWVudCcsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkKICAg',
  'ICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4Lij',
  '4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiC4Lit4LiHCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtUHVyY2hhc2UocmVjKXsKICBvcGVuRm9ybSh7CiAgICB0',
  'aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHguIHguYnguYTguILguKPguLLguKLguIHguLLguKPguIvguLfguYnguK0nIDogJ+C5gOC4nuC4tOC5iOC4oeC4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4reC4guC4reC4hycsCiAgICByZWNvcmQ6IHJlYyB8fCB7',
  'IGJ1eURhdGU6IHRvZGF5KCkgfSwKICAgIGFjdGlvbjogJ3B1cmNoYXNlLnNhdmUnLCBidWNrZXQ6ICdwdXJjaGFzZXMnLCB3aWRlOiB0cnVlLAogICAgb2NyOiB7IGRhdGU6J2J1eURhdGUnLCBhbW91bnQ6J3ByaWNlJywgdmVuZG9yOid2ZW5kb3InLCB0aXRsZTon',
  'aXRlbScgfSwKICAgIG9uRGVsZXRlOiBkZWxQdXJjaGFzZSwKICAgIGZpZWxkczogWwogICAgICB7IGtleTonaXRlbScsICAgIGxhYmVsOifguIrguLfguYjguK3guJrguLTguKUgLyDguKPguLLguKLguIHguLLguKPguKvguKXguLHguIEnLCB0eXBlOid0ZXh0YXJl',
  'YScsIHJlcXVpcmVkOnRydWUsIGZ1bGw6dHJ1ZSwKICAgICAgICBwaDon4LmA4LiK4LmI4LiZIOC4quC4seC5iOC4h+C4guC4reC4h+C5gOC4guC5ieC4suC4q+C4rSBTaG9wZWUg4Lij4LmJ4Liy4LiZIEFCQycsCiAgICAgICAgaGludDon4LiW4LmJ4Liy4LmD4Liq',
  '4LmI4Lij4Liy4Lii4LiB4Liy4Lij4Lii4LmI4Lit4Lii4LiC4LmJ4Liy4LiH4Lil4LmI4Liy4LiH4LmE4Lin4LmJIOC5geC4peC5ieC4p+C5gOC4p+C5ieC4meC4iuC5iOC4reC4h+C4meC4teC5ieC4p+C5iOC4suC4hyDguKPguLDguJrguJrguIjguLDguJXguLHg',
  'uYnguIfguIrguLfguYjguK3guYPguKvguYnguYDguK3guIfguIjguLLguIHguKPguLLguKLguIHguLLguKPguYHguKPguIEnIH0sCiAgICAgIHsga2V5OididXlEYXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC4i+C4t+C5ieC4rScsIHR5cGU6J2RhdGUn',
  'LCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5OidjYXRlZ29yeScsIGxhYmVsOifguKvguKHguKfguJTguKvguKHguLnguYgnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncHVyY2hhc2VDYXRlZ29yaWVzJykgfSwKCiAgICAgIHsga2V5OidsaW5lcycs',
  'ICAgbGFiZWw6J+C4o+C4suC4ouC4geC4suC4o+C5g+C4meC4muC4tOC4pSAo4LiL4Li34LmJ4Lit4LiX4Li14LmA4LiU4Li14Lii4Lin4Lir4Lil4Liy4Lii4Lit4Lii4LmI4Liy4LiH4LmD4Liq4LmI4LiV4Lij4LiH4LiZ4Li14LmJKScsIHR5cGU6J2xpbmVzJywg',
  'ZnVsbDp0cnVlLAogICAgICAgIGhpbnQ6J+C4quC4seC5iOC4h+C4reC4reC4meC5hOC4peC4meC5jOC4hOC4o+C4seC5ieC4h+C5gOC4lOC4teC4ouC4p+C5hOC4lOC5ieC4guC4reC4h+C4q+C4peC4suC4ouC4reC4ouC5iOC4suC4hyDguYPguKrguYjguYHguKLg',
  'uIHguJfguLXguKXguLDguKPguLLguKLguIHguLLguKPguYTguJTguYnguYDguKXguKIgwrcg4Lij4Liw4Lia4Lia4Lij4Lin4Lih4Lij4Liy4LiE4Liy4LmD4Lir4LmJ4Lit4Lix4LiV4LmC4LiZ4Lih4Lix4LiV4Li0JyB9LAogICAgICB7IGtleTonc2hpcHBpbmcn',
  'LCBsYWJlbDon4LiE4LmI4Liy4Liq4LmI4LiHICjguJrguLLguJcpJywgdHlwZTonbW9uZXknLCBwaDonMCcsIG9uaW5wdXQ6J3JlY2FsY0JpbGwoKScgfSwKICAgICAgeyBrZXk6J2Rpc2NvdW50JywgbGFiZWw6J+C4quC5iOC4p+C4meC4peC4lCAo4Lia4Liy4LiX',
  'KScsIHR5cGU6J21vbmV5JywgcGg6JzAnLCBvbmlucHV0OidyZWNhbGNCaWxsKCknIH0sCiAgICAgIHsga2V5OidwcmljZScsICAgbGFiZWw6J+C4o+C4suC4hOC4suC4o+C4p+C4oeC4l+C4seC5ieC4h+C4muC4tOC4pSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5',
  'JywgcmVxdWlyZWQ6dHJ1ZSwKICAgICAgICBoaW50Oic8c3BhbiBpZD0iYmlsbEhpbnQiPjwvc3Bhbj4nIH0sCiAgICAgIHsga2V5OidvcmRlck5vJywgbGFiZWw6J+C5gOC4peC4guC4l+C4teC5iOC4hOC4s+C4quC4seC5iOC4h+C4i+C4t+C5ieC4rScsIHBoOifg',
  'uYDguKXguILguK3guK3guKPguYzguYDguJTguK3guKPguYzguIjguLLguIEgU2hvcGVlIC8gTGF6YWRhJyB9LAogICAgICB7IGtleTondmVuZG9yJywgIGxhYmVsOifguYHguKvguKXguYjguIfguJfguLXguYjguIvguLfguYnguK0nLCBwaDonU2hvcGVlIC8g4LmE',
  '4LiX4Lin4Lix4Liq4LiU4Li4IC8g4Lij4LmJ4Liy4LiZ4oCmJyB9LAogICAgICB7IGtleToncGF5ZXInLCAgIGxhYmVsOifguJzguLnguYnguIrguLPguKPguLAnIH0sCiAgICAgIHsga2V5Oid3YXJyYW50eU1vbnRocycsIGxhYmVsOifguKPguLDguKLguLDguYDg',
  'uKfguKXguLLguKPguLHguJrguJvguKPguLDguIHguLHguJkgKOC5gOC4lOC4t+C4reC4mSknLCB0eXBlOidudW1iZXInLAogICAgICAgIGhpbnQ6J+C4o+C4sOC4muC4muC4iOC4sOC4hOC4s+C4meC4p+C4k+C4p+C4seC4meC4q+C4oeC4lOC4m+C4o+C4sOC4geC4',
  'seC4meC5g+C4q+C5ieC4reC4seC4leC5guC4meC4oeC4seC4leC4tCcgfSwKICAgICAgeyBrZXk6J3Jvb20nLCAgICBsYWJlbDon4Lir4LmJ4Lit4LiHL+C4nuC4t+C5ieC4meC4l+C4teC5iOC4l+C4teC5iOC5g+C4iuC5iScsIHR5cGU6J3NlbGVjdCcsIG9wdGlv',
  'bnM6WyfguKrguYjguKfguJnguIHguKXguLLguIcnXS5jb25jYXQocm9vbU9wdGlvbnMoKSkgfSwKICAgICAgeyBrZXk6J3Bob3RvcycsICBsYWJlbDon4Lig4Liy4Lie4Lib4Lij4Liw4LiB4Lit4Lia4Liq4Li04LiZ4LiE4LmJ4LiyJywgdHlwZTonZmlsZXMnLCBm',
  'dWxsOnRydWUgfSwKICAgICAgeyBrZXk6J3NsaXBzJywgICBsYWJlbDon4Liq4Lil4Li04Lib4LiB4Liy4Lij4LmC4Lit4LiZ4LiK4Liz4Lij4LiwJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICBsYWJlbDon4Lir4Lih',
  '4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxQdXJjaGFzZShpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4Lij4Liy4Lii4LiB4Liy4Lij4LiL4Li34LmJ4Lit4LiZ4Li1',
  '4LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdwdXJjaGFzZS5kZWxldGUnLCB7IGlkOiBpZCB9KS50aGVuKGZ1bmN0aW9uKCl7IHRvYXN0KCfguKXguJrguYHguKXguYnguKcnLCdvaycpOyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7IH0pCiAgICAgIC5jYXRj',
  'aChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCdlcnInKTsgfSk7CiAgfSk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3guKPguYzguKE6IOC4peC5ieC4suC4',
  'h+C5geC4reC4o+C5jAogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybUFjKHJlYyl7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB',
  '4LmJ4LmE4LiC4Lij4Liy4Lii4LiB4Liy4Lij4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJyA6ICfguJrguLHguJnguJfguLbguIHguIHguLLguKPguKXguYnguLLguIfguYHguK3guKPguYwnLAogICAgcmVjb3JkOiByZWMgfHwgeyBib29rRGF0ZTogdG9kYXkoKSB9',
  'LAogICAgYWN0aW9uOiAnYWMuc2F2ZScsIGJ1Y2tldDogJ2FjJywKICAgIG9jcjogeyBkYXRlOidzZXJ2aWNlRGF0ZScsIGFtb3VudDonY29zdCcsIHZlbmRvcjondGVjaG5pY2lhbicgfSwKICAgIG9uRGVsZXRlOiBkZWxBYywKICAgIGZpZWxkczogWwogICAgICB7',
  'IGtleToncm9vbScsICAgICAgICBsYWJlbDon4Lir4LmJ4Lit4LiHJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpyb29tT3B0aW9ucygpLCByZXF1aXJlZDp0cnVlLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleToncm91bmQnLCAgICAgICBsYWJlbDon4Lij4Lit',
  '4Lia4LiX4Li14LmIJywgdHlwZTonbnVtYmVyJywgaGludDon4LmA4Lin4LmJ4LiZ4Lin4LmI4Liy4LiH4LmD4Lir4LmJ4Lij4Liw4Lia4Lia4LiZ4Lix4Lia4LiV4LmI4Lit4LiI4Liy4LiB4Lij4Lit4Lia4Lil4LmI4Liy4Liq4Li44LiU4LiC4Lit4LiH4Lib4Li1',
  '4LiZ4Lix4LmJ4LiZJyB9LAogICAgICB7IGtleTonYm9va0RhdGUnLCAgICBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiZ4Lix4LiU4Lil4LmJ4Liy4LiH4LmB4Lit4Lij4LmMJywgdHlwZTonZGF0ZScgfSwKICAgICAgeyBrZXk6J3NlcnZpY2VEYXRlJywgbGFi',
  'ZWw6J+C4p+C4seC4meC4l+C4teC5iOC4lOC4s+C5gOC4meC4tOC4meC4geC4suC4o+C4iOC4o+C4tOC4hycsIHR5cGU6J2RhdGUnLCBoaW50OifguIHguKPguK3guIHguYDguKHguLfguYjguK3guKXguYnguLLguIfguYDguKrguKPguYfguIjguYHguKXguYnguKcn',
  'IH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCAgICAgIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnYWNTdGF0dXNlcycpIH0sCiAgICAgIHsga2V5Oid0ZWNobmljaWFuJywgIGxhYmVsOifguIrguYjguLLguIcgLyDg',
  'uJzguLnguYnguYPguKvguYnguJrguKPguLTguIHguLLguKMnIH0sCiAgICAgIHsga2V5Oidjb3N0JywgICAgICAgIGxhYmVsOifguITguYjguLLguYPguIrguYnguIjguYjguLLguKIgKOC4muC4suC4lyknLCB0eXBlOidtb25leScgfSwKICAgICAgeyBrZXk6J3Bo',
  'b3RvcycsICAgICAgbGFiZWw6J+C4oOC4suC4nuC4m+C4o+C4sOC4geC4reC4micsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICAgICAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJl',
  'YScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbEFjKGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguKPguLLguKLguIHguLLguKPguKXguYnguLLguIfguYHguK3guKPguYzguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxB',
  'cGkoJ2FjLmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUs',
  'J2VycicpOyB9KTsKICB9KTsKfQoKLyoqIOC4meC4seC4lOC4peC5ieC4suC4h+C5geC4reC4o+C5jOC4q+C4peC4suC4ouC4q+C5ieC4reC4h+C4nuC4o+C5ieC4reC4oeC4geC4seC4mSAqLwpmdW5jdGlvbiBmb3JtQnVsa0FjKCl7CiAgdmFyIHJvb21zID0gcm9v',
  'bU9wdGlvbnMoKTsKICB2YXIgYm9keSA9CiAgICAnPGRpdiBjbGFzcz0iZmdyaWQiPicgKwogICAgICAnPGRpdiBjbGFzcz0iZiI+PGxhYmVsPuC4p+C4seC4meC4l+C4teC5iOC4meC4seC4lCA8c3BhbiBzdHlsZT0iY29sb3I6dmFyKC0tZGFuZ2VyKSI+Kjwvc3Bh',
  'bj48L2xhYmVsPicgKwogICAgICAgICc8aW5wdXQgdHlwZT0iZGF0ZSIgY2xhc3M9ImlucCIgaWQ9ImJrX2RhdGUiIHZhbHVlPSInICsgdG9kYXkoKSArICciPjwvZGl2PicgKwogICAgICAnPGRpdiBjbGFzcz0iZiI+PGxhYmVsPuC4iuC5iOC4suC4hyAvIOC4nOC4',
  'ueC5ieC5g+C4q+C5ieC4muC4o+C4tOC4geC4suC4ozwvbGFiZWw+PGlucHV0IGNsYXNzPSJpbnAiIGlkPSJia190ZWNoIj48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7guITguYjguLLguYPguIrguYnguIjguYjguLLguKLguJXguYjguK3g',
  'uKvguYnguK3guIcgKOC4muC4suC4lyk8L2xhYmVsPjxpbnB1dCB0eXBlPSJudW1iZXIiIGNsYXNzPSJpbnAiIGlkPSJia19jb3N0Ij48L2Rpdj4nICsKICAgICAgJzxkaXYgY2xhc3M9ImYiPjxsYWJlbD7guKvguKHguLLguKLguYDguKvguJXguLg8L2xhYmVsPjxp',
  'bnB1dCBjbGFzcz0iaW5wIiBpZD0iYmtfbm90ZSI+PC9kaXY+JyArCiAgICAnPC9kaXY+JyArCiAgICAnPGRpdiBjbGFzcz0iaHIiPjwvZGl2PicgKwogICAgJzxkaXYgY2xhc3M9InJvdyBtYjgiPjxiIGNsYXNzPSJmczEzIj7guYDguKXguLfguK3guIHguKvguYng',
  'uK3guIc8L2I+PHNwYW4gY2xhc3M9InNwIj48L3NwYW4+JyArCiAgICAgICc8YnV0dG9uIGNsYXNzPSJidG4gc20iIG9uY2xpY2s9ImJ1bGtQaWNrKFwnYWxsXCcpIj7guJfguLHguYnguIfguKvguKHguJQ8L2J1dHRvbj4nICsKICAgICAgJzxidXR0b24gY2xhc3M9',
  'ImJ0biBzbSIgb25jbGljaz0iYnVsa1BpY2soXCdub25lXCcpIj7guKXguYnguLLguIc8L2J1dHRvbj4nICsKICAgICAgWzEsMiwzLDQsNV0ubWFwKGZ1bmN0aW9uKGYpeyByZXR1cm4gJzxidXR0b24gY2xhc3M9ImJ0biBzbSIgb25jbGljaz0iYnVsa1BpY2soJyAr',
  'IGYgKyAnKSI+4LiK4Lix4LmJ4LiZICcgKyBmICsgJzwvYnV0dG9uPic7IH0pLmpvaW4oJycpICsKICAgICc8L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJyb29tcyIgaWQ9ImJrUm9vbXMiPicgKyByb29tcy5tYXAoZnVuY3Rpb24ocil7CiAgICAgIHJldHVybiAn',
  'PGxhYmVsIGNsYXNzPSJyb29tIiBzdHlsZT0iY3Vyc29yOnBvaW50ZXIiPjxpbnB1dCB0eXBlPSJjaGVja2JveCIgY2xhc3M9ImJrIiB2YWx1ZT0iJyArIHIgKyAnIj4gPGI+JyArIHIgKyAnPC9iPjwvbGFiZWw+JzsKICAgIH0pLmpvaW4oJycpICsgJzwvZGl2Pic7',
  'CgogIG9wZW5Nb2RhbCgn8J+ThSDguJnguLHguJTguKXguYnguLLguIfguYHguK3guKPguYzguKvguKXguLLguKLguKvguYnguK3guIfguJ7guKPguYnguK3guKHguIHguLHguJknLCBib2R5LAogICAgJzxidXR0b24gY2xhc3M9ImJ0biIgb25jbGljaz0iY2xvc2VN',
  'b2RhbCgpIj7guKLguIHguYDguKXguLTguIE8L2J1dHRvbj4nICsKICAgICc8YnV0dG9uIGNsYXNzPSJidG4gcHJpIiBpZD0iYmtTYXZlIj7guKrguKPguYnguLLguIfguJnguLHguJTguKvguKHguLLguKI8L2J1dHRvbj4nLCB0cnVlKTsKCiAgZG9jdW1lbnQuZ2V0',
  'RWxlbWVudEJ5SWQoJ2JrU2F2ZScpLm9uY2xpY2sgPSBmdW5jdGlvbigpewogICAgdmFyIHBpY2tlZCA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5iazpjaGVja2VkJykpLm1hcChmdW5jdGlvbihjKXsgcmV0',
  'dXJuIGMudmFsdWU7IH0pOwogICAgdmFyIGRhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmtfZGF0ZScpLnZhbHVlOwogICAgaWYgKCFwaWNrZWQubGVuZ3RoKSByZXR1cm4gdG9hc3QoJ+C5gOC4peC4t+C4reC4geC4reC4ouC5iOC4suC4h+C4meC5ieC4',
  'reC4oiAxIOC4q+C5ieC4reC4hycsICdlcnInKTsKICAgIGlmICghZGF0ZSkgcmV0dXJuIHRvYXN0KCfguIHguKPguLjguJPguLLguKPguLDguJrguLjguKfguLHguJnguJfguLXguYjguJnguLHguJQnLCAnZXJyJyk7CiAgICB2YXIgYnRuID0gdGhpczsgYnRuLmRp',
  'c2FibGVkID0gdHJ1ZTsgYnRuLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDguIHguLPguKXguLHguIfguJrguLHguJnguJfguLbguIHigKYnOwogICAgY2FsbEFwaSgnYWMuYnVsa0Jvb2snLCB7CiAgICAgIHJvb21zOiBwaWNrZWQsIGJv',
  'b2tEYXRlOiBkYXRlLAogICAgICB0ZWNobmljaWFuOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmtfdGVjaCcpLnZhbHVlLAogICAgICBjb3N0OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmtfY29zdCcpLnZhbHVlLAogICAgICBub3RlOiBkb2N1bWVudC5n',
  'ZXRFbGVtZW50QnlJZCgnYmtfbm90ZScpLnZhbHVlCiAgICB9KS50aGVuKGZ1bmN0aW9uKG4pewogICAgICBjbG9zZU1vZGFsKCk7IHRvYXN0KCfguKrguKPguYnguLLguIfguJnguLHguJTguKvguKHguLLguKIgJyArIG4gKyAnIOC4q+C5ieC4reC4h+C5geC4peC5',
  'ieC4pycsICdvaycpOyBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAgICB9KS5jYXRjaChmdW5jdGlvbihlKXsKICAgICAgYnRuLmRpc2FibGVkID0gZmFsc2U7IGJ0bi50ZXh0Q29udGVudCA9ICfguKrguKPguYnguLLguIfguJnguLHguJTguKvguKHguLLguKInOyB0',
  'b2FzdChlLm1lc3NhZ2V8fGUsICdlcnInKTsKICAgIH0pOwogIH07Cn0KCmZ1bmN0aW9uIGJ1bGtQaWNrKHdoYXQpewogIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5iaycpLmZvckVhY2goZnVuY3Rpb24oYyl7CiAgICBpZiAod2hhdCA9PT0gJ2FsbCcpIGMu',
  'Y2hlY2tlZCA9IHRydWU7CiAgICBlbHNlIGlmICh3aGF0ID09PSAnbm9uZScpIGMuY2hlY2tlZCA9IGZhbHNlOwogICAgZWxzZSBjLmNoZWNrZWQgPSBTdHJpbmcoYy52YWx1ZSkuY2hhckF0KDApID09PSBTdHJpbmcod2hhdCk7CiAgfSk7Cn0KCi8qID09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDguJ/guK3guKPguYzguKE6IOC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4suC4oeC4q+C5ieC4reC4hwogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gZm9ybVJlcGFpcihyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4h+C4suC4meC4i+C5iOC4reC4oScgOiAn4LmB4LiI4LmJ',
  '4LiH4LiL4LmI4Lit4LihIC8g4Lia4Lix4LiZ4LiX4Li24LiB4LiH4Liy4LiZ4LiL4LmI4Lit4LihJywKICAgIHJlY29yZDogcmVjIHx8IHsgcmVwb3J0RGF0ZTogdG9kYXkoKSwgcHJpb3JpdHk6ICfguJvguIHguJXguLQnIH0sCiAgICBhY3Rpb246ICdyZXBhaXIu',
  'c2F2ZScsIGJ1Y2tldDogJ3Jvb21SZXBhaXInLCB3aWRlOiB0cnVlLAogICAgb2NyOiB7IGRhdGU6J3JlcGFpckRhdGUnLCBhbW91bnQ6J2Nvc3QnLCB2ZW5kb3I6J3RlY2huaWNpYW4nLCB0aXRsZTonaXRlbXMnIH0sCiAgICBvbkRlbGV0ZTogZGVsUmVwYWlyLAog',
  'ICAgZmllbGRzOiBbCiAgICAgIHsga2V5Oidyb29tJywgICAgICAgbGFiZWw6J+C4q+C5ieC4reC4hycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6cm9vbU9wdGlvbnMoKSwgcmVxdWlyZWQ6dHJ1ZSwgYmxhbms6ZmFsc2UgfSwKICAgICAgeyBrZXk6J2NhdGVnb3J5',
  'JywgICBsYWJlbDon4Lib4Lij4Liw4LmA4Lig4LiX4LiH4Liy4LiZ4Lir4Lil4Lix4LiB4LiC4Lit4LiH4LmD4Lia4LiZ4Li14LmJJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ3JlcGFpckNhdGVnb3JpZXMnKSwKICAgICAgICBoaW50OifguYDguKfguYng',
  'uJnguKfguYjguLLguIfguYTguJTguYkg4oCUIOC4o+C4sOC4muC4muC5g+C4iuC5ieC4m+C4o+C4sOC5gOC4oOC4l+C4l+C4teC5iOC4nuC4muC4muC5iOC4reC4ouC4l+C4teC5iOC4quC4uOC4lOC5g+C4meC5gOC4iuC5h+C4hOC4peC4tOC4quC4leC5jOC5g+C4',
  'q+C5ieC5gOC4reC4hycgfSwKICAgICAgeyBrZXk6J2l0ZW1zJywgICAgICBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4Lij4LiX4Li14LmI4LiV4LmJ4Lit4LiH4LiL4LmI4Lit4LihICjguJXguLTguYrguIHguYDguKHguLfguYjguK3guJfguLPguYDguKrguKPguYfg',
  'uIgpJywgdHlwZTondG9kbycsIHJlcXVpcmVkOnRydWUsIGZ1bGw6dHJ1ZSwKICAgICAgICBvcHRpb25zOiBvcHQoJ3JlcGFpckNhdGVnb3JpZXMnKSwKICAgICAgICBoaW50OifguYDguILguYnguLLguIvguYjguK3guKHguITguKPguLHguYnguIfguYDguJTguLXg',
  'uKLguKfguKHguLHguIHguIvguYjguK3guKHguKvguKXguLLguKLguIjguLjguJQg4LmD4Liq4LmI4LmB4Lii4LiB4LiX4Li14Lil4Liw4LiH4Liy4LiZ4LmB4Lil4Liw4LmA4Lil4Li34Lit4LiB4Lib4Lij4Liw4LmA4Lig4LiX4LiC4Lit4LiH4LmB4LiV4LmI4Lil',
  '4Liw4LiH4Liy4LiZ4LmE4LiU4LmJIMK3ICcgKwogICAgICAgICAgICAgJ+C4leC4tOC5iuC4geC4hOC4o+C4muC4l+C4uOC4geC4h+C4suC4meC5geC4peC5ieC4p+C4o+C4sOC4muC4muC4iOC4sOC5gOC4m+C4peC4teC5iOC4ouC4meC4quC4luC4suC4meC4sOC5',
  'gOC4m+C5h+C4mSDigJzguYDguKrguKPguYfguIjguKrguLTguYnguJnigJ0g4LmD4Lir4LmJ4LmA4Lit4LiHJyB9LAogICAgICB7IGtleToncmVwb3J0RGF0ZScsIGxhYmVsOifguKfguLHguJnguJfguLXguYjguYHguIjguYnguIcnLCB0eXBlOidkYXRlJyB9LAog',
  'ICAgICB7IGtleTonYm9va0RhdGUnLCAgIGxhYmVsOifguKfguLHguJnguJnguLHguJTguIvguYjguK3guKHguYHguIvguKEnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleToncmVwYWlyRGF0ZScsIGxhYmVsOifguKfguLHguJnguYDguILguYnguLLguIvguYjg',
  'uK3guKHguYHguIvguKEnLCB0eXBlOidkYXRlJywgaGludDon4LiB4Lij4Lit4LiB4LmA4Lih4Li34LmI4Lit4LiL4LmI4Lit4Lih4LmA4Liq4Lij4LmH4LiI4LmB4Lil4LmJ4LinJyB9LAogICAgICB7IGtleTonc3RhdHVzJywgICAgIGxhYmVsOifguKrguJbguLLg',
  'uJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgncmVwYWlyU3RhdHVzZXMnKSB9LAogICAgICB7IGtleToncHJpb3JpdHknLCAgIGxhYmVsOifguITguKfguLLguKHguYDguKPguYjguIfguJTguYjguKfguJknLCB0eXBlOidzZWxlY3QnLCBvcHRpb25z',
  'Om9wdCgncHJpb3JpdGllcycpLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtleTondGVjaG5pY2lhbicsIGxhYmVsOifguIrguYjguLLguIfguJzguLnguYnguIvguYjguK3guKEnIH0sCiAgICAgIHsga2V5Oidjb3N0JywgICAgICAgbGFiZWw6J+C4hOC5iOC4suC5',
  'g+C4iuC5ieC4iOC5iOC4suC4oiAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JyB9LAogICAgICB7IGtleToncGhvdG9zQmVmb3JlJywgbGFiZWw6J+C4oOC4suC4nuC4geC5iOC4reC4meC4i+C5iOC4reC4oScsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAg',
  'ICAgIHsga2V5OidwaG90b3NBZnRlcicsICBsYWJlbDon4Lig4Liy4Lie4Lir4Lil4Lix4LiH4LiL4LmI4Lit4LihJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICAgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV',
  '4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxSZXBhaXIoaWQpewogIGNvbmZpcm1BY3Rpb24oJ+C4peC4muC4h+C4suC4meC4i+C5iOC4reC4oeC4meC4teC5iT8nLCBmdW5jdGlvbigpewogICAgY2Fs',
  'bEFwaSgncmVwYWlyLmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3Nh',
  'Z2V8fGUsJ2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4LiL4LmI4Lit4Lih4LmB4LiL4Lih4LiV4Li24LiB4LmC4LiU4Lii',
  '4Lij4Lin4LihCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtQnVpbGRpbmcocmVjKXsKICBvcGVuRm9ybSh7CiAgICB0aXRsZTogcmVjICYmIHJlYy5pZCA/ICfguYHg',
  'uIHguYnguYTguILguIfguLLguJnguIvguYjguK3guKHguJXguLbguIEnIDogJ+C5gOC4nuC4tOC5iOC4oeC4h+C4suC4meC4i+C5iOC4reC4oeC5geC4i+C4oeC4leC4tuC4geC5guC4lOC4ouC4o+C4p+C4oScsCiAgICByZWNvcmQ6IHJlYyB8fCB7IGJvb2tEYXRl',
  'OiB0b2RheSgpIH0sCiAgICBhY3Rpb246ICdidWlsZGluZy5zYXZlJywgYnVja2V0OiAnYnVpbGRpbmcnLCB3aWRlOiB0cnVlLAogICAgb2NyOiB7IGRhdGU6J2VuZERhdGUnLCBhbW91bnQ6J2Nvc3QnLCB2ZW5kb3I6J2NvbnRyYWN0b3InLCB0aXRsZTondGl0bGUn',
  'IH0sCiAgICBvbkRlbGV0ZTogZGVsQnVpbGRpbmcsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3pvbmUnLCAgICAgIGxhYmVsOifguKrguYjguKfguJnguILguK3guIfguK3guLLguITguLLguKMnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnYnVpbGRp',
  'bmdab25lcycpLCByZXF1aXJlZDp0cnVlIH0sCiAgICAgIHsga2V5Oid0aXRsZScsICAgICBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4Lij4LiL4LmI4Lit4Lih4LmB4LiL4LihJywgdHlwZTondGV4dGFyZWEnLCByZXF1aXJlZDp0cnVlLCBmdWxsOnRydWUgfSwKICAg',
  'ICAgeyBrZXk6J2Jvb2tEYXRlJywgIGxhYmVsOifguKfguLHguJnguJfguLXguYjguJnguLHguJQnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonc3RhcnREYXRlJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC5gOC4o+C4tOC5iOC4oeC4lOC4s+C5gOC4',
  'meC4tOC4meC4geC4suC4oycsIHR5cGU6J2RhdGUnIH0sCiAgICAgIHsga2V5OidlbmREYXRlJywgICBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LmB4Lil4LmJ4Lin4LmA4Liq4Lij4LmH4LiIJywgdHlwZTonZGF0ZScgfSwKICAgICAgeyBrZXk6J3N0YXR1cycs',
  'ICAgIGxhYmVsOifguKrguJbguLLguJnguLAnLCB0eXBlOidzZWxlY3QnLCBvcHRpb25zOm9wdCgnYnVpbGRpbmdTdGF0dXNlcycpIH0sCiAgICAgIHsga2V5Oidjb250cmFjdG9yJywgbGFiZWw6J+C4nOC4ueC5ieC4o+C4seC4muC5gOC4q+C4oeC4siAvIOC4o+C5',
  'ieC4suC4mScgfSwKICAgICAgeyBrZXk6J2Nvc3QnLCAgICAgIGxhYmVsOifguITguYjguLLguYPguIrguYnguIjguYjguLLguKIgKOC4muC4suC4lyknLCB0eXBlOidtb25leScgfSwKICAgICAgeyBrZXk6J25leHREdWUnLCAgIGxhYmVsOifguITguKPguJrguIHg',
  'uLPguKvguJnguJTguKPguK3guJrguJbguLHguJTguYTguJsnLCB0eXBlOidkYXRlJywgaGludDon4LmA4LiK4LmI4LiZIOC4geC4seC4meC4i+C4tuC4oeC4lOC4suC4lOC4n+C5ieC4suC4l+C4uOC4gSAzIOC4m+C4tSDigJQg4LmD4Liq4LmI4Lin4Lix4LiZ4LiX',
  '4Li14LmI4LiE4Lij4Lix4LmJ4LiH4LiW4Lix4LiU4LmE4LibJyB9LAogICAgICB7IGtleToncGhvdG9zJywgICAgbGFiZWw6J+C4oOC4suC4nuC4m+C4o+C4sOC4geC4reC4micsIHR5cGU6J2ZpbGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5OidzbGlwcycs',
  'ICAgICBsYWJlbDon4LmD4Lia4LmA4Liq4Lij4LmH4LiIIC8g4Liq4Lil4Li04LibJywgdHlwZTonZmlsZXMnLCBmdWxsOnRydWUgfSwKICAgICAgeyBrZXk6J25vdGUnLCAgICAgIGxhYmVsOifguKvguKHguLLguKLguYDguKvguJXguLgnLCB0eXBlOid0ZXh0YXJl',
  'YScsIGZ1bGw6dHJ1ZSB9CiAgICBdCiAgfSk7Cn0KCmZ1bmN0aW9uIGRlbEJ1aWxkaW5nKGlkKXsKICBjb25maXJtQWN0aW9uKCfguKXguJrguIfguLLguJnguIvguYjguK3guKHguJXguLbguIHguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2J1',
  'aWxkaW5nLmRlbGV0ZScsIHsgaWQ6IGlkIH0pLnRoZW4oZnVuY3Rpb24oKXsgdG9hc3QoJ+C4peC4muC5geC4peC5ieC4pycsJ29rJyk7IGxvYWQoeyBxdWlldDogdHJ1ZSB9KTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUs',
  'J2VycicpOyB9KTsKICB9KTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgIOC4n+C4reC4o+C5jOC4oTog4LiC4LmJ4Lit4Lih4Li54Lil4Lir4LmJ4Lit4LiHCiAgID09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtUm9vbShyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiAn4LiC4LmJ4Lit4Lih4Li54Lil4Lir4LmJ4Lit4LiHICcgKyAocmVjID8gcmVjLnJv',
  'b20gOiAnJyksCiAgICByZWNvcmQ6IHJlYywgYWN0aW9uOiAncm9vbS5zYXZlJywKICAgIGZpZWxkczogWwogICAgICB7IGtleToncm9vbScsICAgbGFiZWw6J+C4q+C5ieC4reC4hycsIHJlcXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J2Zsb29yJywgIGxhYmVs',
  'OifguIrguLHguYnguJknLCB0eXBlOidudW1iZXInIH0sCiAgICAgIHsga2V5OidzdGF0dXMnLCBsYWJlbDon4Liq4LiW4Liy4LiZ4LiwJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQoJ3Jvb21TdGF0dXNlcycpLCBibGFuazpmYWxzZSB9LAogICAgICB7IGtl',
  'eTondGVuYW50JywgbGFiZWw6J+C4iuC4t+C5iOC4reC4nOC4ueC5ieC5gOC4iuC5iOC4sicgfSwKICAgICAgeyBrZXk6J3Bob25lJywgIGxhYmVsOifguYDguJrguK3guKPguYzguJXguLTguJTguJXguYjguK0nIH0sCiAgICAgIHsga2V5OidyZW50JywgICBsYWJl',
  'bDon4LiE4LmI4Liy4LmA4LiK4LmI4LiyL+C5gOC4lOC4t+C4reC4mSAo4Lia4Liy4LiXKScsIHR5cGU6J21vbmV5JyB9LAogICAgICB7IGtleTonbW92ZUluJywgbGFiZWw6J+C4p+C4seC4meC4l+C4teC5iOC5gOC4guC5ieC4suC4reC4ouC4ueC5iCcsIHR5cGU6',
  'J2RhdGUnIH0sCiAgICAgIHsga2V5Oidub3RlJywgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguJfguKPguLHguJ7guKLguYzguKrguLTguJnguJvguKPguLDguIjguLPguKvguYnguK3guIcKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT09PT09ICovCmZ1bmN0aW9uIGZvcm1Bc3NldChyZWMpewogIHZhciByb29tID0gKHJlYyAmJiByZWMucm9vbSkgfHwgJyc7CiAgb3BlbkZvcm0oewogICAgdGl0bGU6IHJlYyAmJiByZWMuaWQgPyAn4LmB4LiB4LmJ4LmE4LiC4LiX4Lij4Lix4Lie4Lii',
  '4LmM4Liq4Li04LiZJyA6ICfguYDguJ7guLTguYjguKHguJfguKPguLHguJ7guKLguYzguKrguLTguJnguYPguJnguKvguYnguK3guIcgJyArIHJvb20sCiAgICByZWNvcmQ6IHJlYyB8fCB7IHJvb206IHJvb20sIHN0YXR1czogJ+C5g+C4iuC5ieC4h+C4suC4meC4',
  'm+C4geC4leC4tCcgfSwKICAgIGFjdGlvbjogJ2Fzc2V0LnNhdmUnLAogICAgb25EZWxldGU6IHJlYyAmJiByZWMuaWQgPyBkZWxBc3NldCA6IG51bGwsCiAgICBmaWVsZHM6IFsKICAgICAgeyBrZXk6J3Jvb20nLCAgIGxhYmVsOifguKvguYnguK3guIcnLCB0eXBl',
  'OidzZWxlY3QnLCBvcHRpb25zOnJvb21PcHRpb25zKCksIHJlcXVpcmVkOnRydWUsIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5OiduYW1lJywgICBsYWJlbDon4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZJywgcmVxdWlyZWQ6dHJ1ZSwgcGg6J+C5gOC4iuC5',
  'iOC4mSDguYHguK3guKPguYwgwrcg4LmA4LiE4Lij4Li34LmI4Lit4LiH4LiX4Liz4LiZ4LmJ4Liz4Lit4Li44LmI4LiZIMK3IOC4leC4ueC5ieC5gOC4ouC5h+C4mScgfSwKICAgICAgeyBrZXk6J2JyYW5kJywgIGxhYmVsOifguKLguLXguYjguKvguYnguK0v4Lij',
  '4Li44LmI4LiZJyB9LAogICAgICB7IGtleTonc2VyaWFsJywgbGFiZWw6J1NlcmlhbCBOby4nIH0sCiAgICAgIHsga2V5OidpbnN0YWxsRGF0ZScsICBsYWJlbDon4Lin4Lix4LiZ4LiX4Li14LmI4LiV4Li04LiU4LiV4Lix4LmJ4LiHJywgdHlwZTonZGF0ZScgfSwK',
  'ICAgICAgeyBrZXk6J3dhcnJhbnR5RW5kJywgIGxhYmVsOifguJvguKPguLDguIHguLHguJnguKvguKHguJTguK3guLLguKLguLgnLCB0eXBlOidkYXRlJyB9LAogICAgICB7IGtleTonc3RhdHVzJywgbGFiZWw6J+C4quC4luC4suC4meC4sCcsIHR5cGU6J3NlbGVj',
  'dCcsIG9wdGlvbnM6b3B0KCdhc3NldFN0YXR1c2VzJyksIGJsYW5rOmZhbHNlIH0sCiAgICAgIHsga2V5OidwdXJjaGFzZUlkJywgbGFiZWw6J+C4reC5ieC4suC4h+C4reC4tOC4h+C4o+C4suC4ouC4geC4suC4o+C4i+C4t+C5ieC4rScsIHBoOifguKPguKvguLHg',
  'uKrguKPguLLguKLguIHguLLguKPguIvguLfguYnguK3guILguK3guIcgKOC4luC5ieC4suC4oeC4tSknIH0sCiAgICAgIHsga2V5Oidub3RlJywgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQog',
  'ICAgXSwKICAgIC8vIOC4n+C4reC4o+C5jOC4oeC4meC4teC5ieC5gOC4m+C4tOC4lOC4iOC4suC4geC4q+C4meC5ieC4suC4leC5iOC4suC4h+C4o+C4suC4ouC4peC4sOC5gOC4reC4teC4ouC4lOC4q+C5ieC4reC4hyDigJQg4Lia4Lix4LiZ4LiX4Li24LiB4LmA',
  '4Liq4Lij4LmH4LiI4LmA4Lib4Li04LiU4LiB4Lil4Lix4Lia4LmE4Lib4Lir4LiZ4LmJ4Liy4LmA4LiU4Li04LihCiAgICBhZnRlcjogZnVuY3Rpb24oKXsgaWYgKHJvb20gJiYgdHlwZW9mIG9wZW5Sb29tID09PSAnZnVuY3Rpb24nKSBvcGVuUm9vbShyb29tKTsg',
  'fQogIH0pOwp9CgpmdW5jdGlvbiBkZWxBc3NldChpZCl7CiAgY29uZmlybUFjdGlvbign4Lil4Lia4LiX4Lij4Lix4Lie4Lii4LmM4Liq4Li04LiZ4LiK4Li04LmJ4LiZ4LiZ4Li14LmJPycsIGZ1bmN0aW9uKCl7CiAgICBjYWxsQXBpKCdhc3NldC5kZWxldGUnLCB7',
  'IGlkOiBpZCB9KQogICAgICAudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0p',
  'OwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lif4Lit4Lij4LmM4LihOiDguKPguLLguKLguKPguLHguJot4Lij4Liy4Lii4LiI4LmI4Liy4Lii4Lir4LitCiAgID09PT09',
  'PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBmb3JtRmluYW5jZShyZWMpewogIG9wZW5Gb3JtKHsKICAgIHRpdGxlOiByZWMgJiYgcmVjLmlkID8gJ+C5geC4geC5ieC5hOC4guC4o+C4suC4',
  'ouC4geC4suC4oycgOiAn4Lia4Lix4LiZ4LiX4Li24LiB4Lij4Liy4Lii4Lij4Lix4LiaLeC4o+C4suC4ouC4iOC5iOC4suC4oicsCiAgICByZWNvcmQ6IHJlYyB8fCB7IGRhdGU6IHRvZGF5KCksIGNoYW5uZWw6ICfguYLguK3guJkgUVInIH0sCiAgICBhY3Rpb246',
  'ICdmaW5hbmNlLnNhdmUnLCBidWNrZXQ6ICdtaXNjJywKICAgIG9uRGVsZXRlOiBkZWxGaW5hbmNlLAogICAgZmllbGRzOiBbCiAgICAgIHsga2V5OidraW5kJywgICBsYWJlbDon4Lij4Liy4Lii4LiB4Liy4LijJywgdHlwZTonc2VsZWN0Jywgb3B0aW9uczpvcHQo',
  'J2ZpbmFuY2VLaW5kcycpLCByZXF1aXJlZDp0cnVlLCBibGFuazpmYWxzZSwKICAgICAgICBoaW50OifguYDguKXguLfguK3guIEgIuC4o+C4suC4ouC4o+C4seC4muC4hOC5iOC4suC5gOC4iuC5iOC4siIg4Lir4Lij4Li34LitICLguKPguLLguKLguKPguLHguJrg',
  'uK3guLfguYjguJkg4LmGIiDguKPguLDguJrguJrguIjguLDguJnguLHguJrguYDguJvguYfguJnguJ3guLHguYjguIfguKPguLLguKLguKPguLHguJrguYPguKvguYnguK3guLHguJXguYLguJnguKHguLHguJXguLQnIH0sCiAgICAgIHsga2V5OidkYXRlJywgICBs',
  'YWJlbDon4Lin4Lix4LiZ4LiX4Li14LmIJywgdHlwZTonZGF0ZScsIHJlcXVpcmVkOnRydWUgfSwKICAgICAgeyBrZXk6J2Ftb3VudCcsIGxhYmVsOifguIjguLPguJnguKfguJnguYDguIfguLTguJkgKOC4muC4suC4lyknLCB0eXBlOidtb25leScsIHJlcXVpcmVk',
  'OnRydWUgfSwKICAgICAgeyBrZXk6J2JpbGxNb250aCcsIGxhYmVsOifguKPguK3guJrguJrguLTguKXguILguK3guIfguYDguJTguLfguK3guJknLCBwaDon4LmA4LiK4LmI4LiZIOC4gS7guIQuIDI1NjknIH0sCiAgICAgIHsga2V5OidjaGFubmVsJywgbGFiZWw6',
  'J+C4iuC5iOC4reC4h+C4l+C4suC4hycsIHR5cGU6J3NlbGVjdCcsIG9wdGlvbnM6b3B0KCdmaW5hbmNlQ2hhbm5lbHMnKSB9LAogICAgICB7IGtleTonc2xpcHMnLCAgbGFiZWw6J+C4quC4peC4tOC4myAvIOC5g+C4muC5gOC4quC4o+C5h+C4iCcsIHR5cGU6J2Zp',
  'bGVzJywgZnVsbDp0cnVlIH0sCiAgICAgIHsga2V5Oidub3RlJywgICBsYWJlbDon4Lir4Lih4Liy4Lii4LmA4Lir4LiV4Li4JywgdHlwZTondGV4dGFyZWEnLCBmdWxsOnRydWUgfQogICAgXQogIH0pOwp9CgpmdW5jdGlvbiBkZWxGaW5hbmNlKGlkKXsKICBjb25m',
  'aXJtQWN0aW9uKCfguKXguJrguKPguLLguKLguIHguLLguKPguJnguLXguYk/JywgZnVuY3Rpb24oKXsKICAgIGNhbGxBcGkoJ2ZpbmFuY2UuZGVsZXRlJywgeyBpZDogaWQgfSkudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4Lil4Lia4LmB4Lil4LmJ4LinJywnb2sn',
  'KTsgbG9hZCh7IHF1aWV0OiB0cnVlIH0pOyB9KQogICAgICAuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09',
  'PT09PT09PT0KICAg4Liq4Liz4Lij4Lit4LiHIC8g4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54LilCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBkb0V4cG9y',
  'dEpzb24oKXsKICB0b2FzdCgn4LiB4Liz4Lil4Lix4LiH4LmA4LiV4Lij4Li14Lii4Lih4LmE4Lif4Lil4LmM4Liq4Liz4Lij4Lit4LiH4oCmJyk7CiAgY2FsbEFwaSgnYmFja3VwLmV4cG9ydCcsIHt9KS50aGVuKGZ1bmN0aW9uKGR1bXApewogICAgc2F2ZVRleHRG',
  'aWxlKCd0aGUtbS1jb3JuZXItYXAtYmFja3VwLScgKyB0b2RheSgpICsgJy5qc29uJywKICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShkdW1wLCBudWxsLCAxKSwgJ2FwcGxpY2F0aW9uL2pzb24nKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3Qo',
  'ZS5tZXNzYWdlfHxlLCAnZXJyJyk7IH0pOwp9CgpmdW5jdGlvbiBkb0V4cG9ydENzdihzaGVldCl7CiAgY2FsbEFwaSgnYmFja3VwLmNzdicsIHsgc2hlZXQ6IHNoZWV0IH0pLnRoZW4oZnVuY3Rpb24ocil7CiAgICBzYXZlVGV4dEZpbGUoci5maWxlbmFtZSwgci5j',
  'b250ZW50LCAndGV4dC9jc3YnKTsKICB9KS5jYXRjaChmdW5jdGlvbihlKXsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7IH0pOwp9CgovKiog4LiU4Liy4Lin4LiZ4LmM4LmC4Lir4Lil4LiU4LmE4Lif4Lil4LmMIOKAlCDguYPguIrguYkgZG93bmxvYWRzIGNh',
  'cGFiaWxpdHkg4LiW4LmJ4Liy4Lih4Li1IOC5hOC4oeC5iOC4h+C4seC5ieC4meC5g+C4iuC5ieC4peC4tOC4h+C4geC5jOC4m+C4geC4leC4tCAqLwpmdW5jdGlvbiBzYXZlVGV4dEZpbGUoZmlsZW5hbWUsIGNvbnRlbnQsIG1pbWUpewogIGlmICh0eXBlb2Ygd2lu',
  'ZG93LnNhdmVWaWFIb3N0ID09PSAnZnVuY3Rpb24nKSByZXR1cm4gd2luZG93LnNhdmVWaWFIb3N0KGZpbGVuYW1lLCBjb250ZW50LCBtaW1lKTsKICB2YXIgYmxvYiA9IG5ldyBCbG9iKFtjb250ZW50XSwgeyB0eXBlOiBtaW1lICsgJztjaGFyc2V0PXV0Zi04JyB9',
  'KTsKICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTsKICBhLmhyZWYgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpOwogIGEuZG93bmxvYWQgPSBmaWxlbmFtZTsKICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGEpOyBhLmNsaWNrKCk7CiAg',
  'c2V0VGltZW91dChmdW5jdGlvbigpeyBVUkwucmV2b2tlT2JqZWN0VVJMKGEuaHJlZik7IGEucmVtb3ZlKCk7IH0sIDEwMDApOwogIHRvYXN0KCfguJTguLLguKfguJnguYzguYLguKvguKXguJQgJyArIGZpbGVuYW1lICsgJyDguYHguKXguYnguKcnLCAnb2snKTsK',
  'fQoKZnVuY3Rpb24gZG9JbXBvcnRKc29uKCl7CiAgb3Blbk1vZGFsKCfirIbvuI8g4LiB4Li54LmJ4LiE4Li34LiZ4LiI4Liy4LiB4LmE4Lif4Lil4LmM4Liq4Liz4Lij4Lit4LiHJywKICAgICc8cCBjbGFzcz0iZnMxMyI+4LmA4Lil4Li34Lit4LiB4LmE4Lif4Lil',
  '4LmMIDxiPi5qc29uPC9iPiDguJfguLXguYjguYDguITguKLguJTguLLguKfguJnguYzguYLguKvguKXguJTguYTguKfguYk8L3A+JyArCiAgICAnPGxhYmVsIGNsYXNzPSJmaWxlLWRyb3AiIGZvcj0iaW1wRmlsZSI+8J+ThCDguYDguKXguLfguK3guIHguYTguJ/g',
  'uKXguYzguKrguLPguKPguK3guIcnICsKICAgICAgJzxpbnB1dCB0eXBlPSJmaWxlIiBpZD0iaW1wRmlsZSIgYWNjZXB0PSJhcHBsaWNhdGlvbi9qc29uLC5qc29uIiBzdHlsZT0iZGlzcGxheTpub25lIiAnICsKICAgICAgJ29uY2hhbmdlPSJkb2N1bWVudC5nZXRF',
  'bGVtZW50QnlJZChcJ2ltcE5hbWVcJykudGV4dENvbnRlbnQ9dGhpcy5maWxlc1swXT90aGlzLmZpbGVzWzBdLm5hbWU6XCdcJyI+PC9sYWJlbD4nICsKICAgICc8ZGl2IGNsYXNzPSJmczEyIG11dGVkIG10OCIgaWQ9ImltcE5hbWUiPjwvZGl2PicgKwogICAgJzxk',
  'aXYgY2xhc3M9ImhyIj48L2Rpdj4nICsKICAgICc8ZGl2IGNsYXNzPSJmIj48bGFiZWw+4Lin4Li04LiY4Li14LiB4Li54LmJ4LiE4Li34LiZPC9sYWJlbD4nICsKICAgICc8c2VsZWN0IGNsYXNzPSJzZWwiIGlkPSJpbXBNb2RlIj4nICsKICAgICAgJzxvcHRpb24g',
  'dmFsdWU9Im1lcmdlIj7guYDguJ7guLTguYjguKHguYDguInguJ7guLLguLDguKPguLLguKLguIHguLLguKPguJfguLXguYjguKLguLHguIfguYTguKHguYjguKHguLUgKOC5geC4meC4sOC4meC4syk8L29wdGlvbj4nICsKICAgICAgJzxvcHRpb24gdmFsdWU9InJl',
  'cGxhY2UiPuC4peC5ieC4suC4h+C4guC5ieC4reC4oeC4ueC4peC5gOC4lOC4tOC4oeC5geC4peC5ieC4p+C5geC4l+C4meC4l+C4teC5iOC4l+C4seC5ieC4h+C4q+C4oeC4lDwvb3B0aW9uPicgKwogICAgJzwvc2VsZWN0PjwvZGl2PicsCiAgICAnPGJ1dHRvbiBj',
  'bGFzcz0iYnRuIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPuC4ouC4geC5gOC4peC4tOC4gTwvYnV0dG9uPicgKwogICAgJzxidXR0b24gY2xhc3M9ImJ0biBwcmkiIGlkPSJpbXBHbyI+4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54LilPC9idXR0b24+',
  'Jyk7CgogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbXBHbycpLm9uY2xpY2sgPSBmdW5jdGlvbigpewogICAgdmFyIGYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW1wRmlsZScpLmZpbGVzWzBdOwogICAgaWYgKCFmKSByZXR1cm4gdG9hc3QoJ+C4geC4',
  'o+C4uOC4k+C4suC5gOC4peC4t+C4reC4geC5hOC4n+C4peC5jOC4geC5iOC4reC4mScsICdlcnInKTsKICAgIHZhciBtb2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ltcE1vZGUnKS52YWx1ZTsKICAgIHZhciBidG4gPSB0aGlzOyBidG4uZGlzYWJsZWQg',
  'PSB0cnVlOyBidG4uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOC4geC4s+C4peC4seC4h+C4geC4ueC5ieC4hOC4t+C4meKApic7CiAgICB2YXIgciA9IG5ldyBGaWxlUmVhZGVyKCk7CiAgICByLm9ubG9hZCA9IGZ1bmN0aW9uKCl7CiAg',
  'ICAgIHZhciBwYXJzZWQ7CiAgICAgIHRyeSB7IHBhcnNlZCA9IEpTT04ucGFyc2Uoci5yZXN1bHQpOyB9CiAgICAgIGNhdGNoIChlKSB7IGJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBidG4udGV4dENvbnRlbnQgPSAn4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih',
  '4Li54LilJzsgcmV0dXJuIHRvYXN0KCfguYTguJ/guKXguYzguYTguKHguYjguYPguIrguYggSlNPTiDguJfguLXguYjguJbguLnguIHguJXguYnguK3guIcnLCAnZXJyJyk7IH0KICAgICAgY2FsbEFwaSgnYmFja3VwLmltcG9ydCcsIHsgZGF0YTogcGFyc2VkLCBt',
  'b2RlOiBtb2RlIH0pLnRoZW4oZnVuY3Rpb24oc3RhdCl7CiAgICAgICAgY2xvc2VNb2RhbCgpOwogICAgICAgIHZhciBuID0gT2JqZWN0LmtleXMoc3RhdCkucmVkdWNlKGZ1bmN0aW9uKGEsayl7IHJldHVybiBhICsgKHN0YXRba118fDApOyB9LCAwKTsKICAgICAg',
  'ICB0b2FzdCgn4LiB4Li54LmJ4LiE4Li34LiZ4Liq4Liz4LmA4Lij4LmH4LiIICcgKyBuICsgJyDguKPguLLguKLguIHguLLguKMnLCAnb2snKTsKICAgICAgICBsb2FkKHsgcXVpZXQ6IHRydWUgfSk7CiAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpewogICAgICAg',
  'IGJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBidG4udGV4dENvbnRlbnQgPSAn4LiB4Li54LmJ4LiE4Li34LiZ4LiC4LmJ4Lit4Lih4Li54LilJzsgdG9hc3QoZS5tZXNzYWdlfHxlLCAnZXJyJyk7CiAgICAgIH0pOwogICAgfTsKICAgIHIucmVhZEFzVGV4dChmKTsKICB9',
  'Owp9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmMIOC5geC4peC4sOC4geC4suC4o+C4quC4s+C4o+C4reC4h+C4peC4hyBHb29nbGUgRHJp',
  'dmUKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCgpmdW5jdGlvbiBjb3B5U2hhcmUoKXsKICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2hhcmVVcmwnKTsKICBpZiAoIWVs',
  'KSByZXR1cm47CiAgZWwuc2VsZWN0KCk7CiAgaWYgKG5hdmlnYXRvci5jbGlwYm9hcmQpIHsKICAgIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KGVsLnZhbHVlKQogICAgICAudGhlbihmdW5jdGlvbigpeyB0b2FzdCgn4LiE4Lix4LiU4Lil4Lit4LiB4Lil',
  '4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LmB4Lil4LmJ4LinJywnb2snKTsgfSkKICAgICAgLmNhdGNoKGZ1bmN0aW9uKCl7IHRvYXN0KCfguITguLHguJTguKXguK3guIHguYTguKHguYjguKrguLPguYDguKPguYfguIgg4oCUIOC4geC4lOC4hOC5ieC4suC4h+C4',
  'l+C4teC5iOC4iuC5iOC4reC4h+C5geC4peC5ieC4p+C5gOC4peC4t+C4reC4geC4hOC4seC4lOC4peC4reC4gScsJ2VycicpOyB9KTsKICB9IGVsc2UgewogICAgdHJ5IHsgZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2NvcHknKTsgdG9hc3QoJ+C4hOC4seC4lOC4peC4',
  'reC4geC4peC4tOC4h+C4geC5jOC5geC4iuC4o+C5jOC5geC4peC5ieC4pycsJ29rJyk7IH0KICAgIGNhdGNoIChlKSB7IHRvYXN0KCfguITguLHguJTguKXguK3guIHguYTguKHguYjguKrguLPguYDguKPguYfguIgg4oCUIOC4geC4lOC4hOC5ieC4suC4h+C4l+C4',
  'teC5iOC4iuC5iOC4reC4h+C5geC4peC5ieC4p+C5gOC4peC4t+C4reC4geC4hOC4seC4lOC4peC4reC4gScsJ2VycicpOyB9CiAgfQp9CgpmdW5jdGlvbiBkb1JvdGF0ZVNoYXJlKCl7CiAgY29uZmlybUFjdGlvbign4Lit4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB',
  '4LiK4Lij4LmM4LiK4Li44LiU4LmD4Lir4Lih4LmIPyDguITguJnguJfguLXguYjguJbguLfguK3guKXguLTguIfguIHguYzguYDguJTguLTguKHguIjguLDguYDguJvguLTguJTguYTguKHguYjguYTguJTguYnguK3guLXguIEnLCBmdW5jdGlvbigpewogICAgY2Fs',
  'bEFwaSgnc2hhcmUucm90YXRlVG9rZW4nLCB7fSkudGhlbihmdW5jdGlvbigpewogICAgICB0b2FzdCgn4Lit4Lit4LiB4Lil4Li04LiH4LiB4LmM4LmB4LiK4Lij4LmM4LiK4Li44LiU4LmD4Lir4Lih4LmI4LmB4Lil4LmJ4LinJywnb2snKTsgbG9hZCh7IHF1aWV0',
  'OiB0cnVlIH0pOwogICAgfSkuY2F0Y2goZnVuY3Rpb24oZSl7IHRvYXN0KGUubWVzc2FnZXx8ZSwnZXJyJyk7IH0pOwogIH0pOwp9CgpmdW5jdGlvbiBkb0JhY2t1cE5vdygpewogIHRvYXN0KCfguIHguLPguKXguLHguIfguKrguLPguKPguK3guIfguILguYnguK3g',
  'uKHguLnguKXguKXguIcgRHJpdmXigKYnKTsKICBjYWxsQXBpKCdiYWNrdXAuYmFja3VwTm93Jywge30pLnRoZW4oZnVuY3Rpb24ocil7CiAgICB0b2FzdCgn4Liq4Liz4Lij4Lit4LiH4LmB4Lil4LmJ4LinOiAnICsgci5uYW1lLCAnb2snKTsgbG9hZCh7IHF1aWV0',
  'OiB0cnVlIH0pOwogIH0pLmNhdGNoKGZ1bmN0aW9uKGUpeyB0b2FzdChlLm1lc3NhZ2V8fGUsJ2VycicpOyB9KTsKfQo8L3NjcmlwdD4KPHNjcmlwdD5ib290KCk7PC9zY3JpcHQ+CjwvYm9keT4KPC9odG1sPgo='
].join('');

function indexHtml_() {
  return Utilities.newBlob(Utilities.base64Decode(INDEX_HTML_B64), 'text/html')
    .getDataAsString('UTF-8');
}
