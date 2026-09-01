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
