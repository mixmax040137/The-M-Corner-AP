/* =====================================================================
   overrides.js — ส่วนที่ฝั่ง Cloudflare ทำต่างจาก Apps Script
   (ถูกวางไว้ "หลัง" โค้ด .gs ทั้งหมดภายใน createApp(HOST) — ฟังก์ชันชื่อเดียวกันตัวหลังชนะ)

   หลักการ: แก้ให้น้อยที่สุด ตรรกะธุรกิจทุกอย่างยังเป็นโค้ดชุดเดียวกับ Apps Script
   ที่ต้องทับมีแค่เรื่องที่ "ที่อยู่" ต่างกัน: ที่อยู่ของเว็บ การส่งข้อมูลไปอีกฝั่ง รุ่นของข้อมูล
   ===================================================================== */

function onCloudflare_() { return true; }

/* ---------- การซิงก์: Durable Object เป็นคนส่ง (เก็บลงคิวในฐานข้อมูลก่อน ส่งไม่ถึงก็ไม่หาย) ---------- */
function syncConfigured_() { return !!(HOST.getProp('SYNC_SECRET') && HOST.getProp('GAS_URL')); }
function syncDeliver_(ops) { HOST.enqueue(ops); return true; }
function syncRetry() { HOST.kick(); return 'กำลังส่งข้อมูลที่ค้างอยู่'; }
function installSyncTrigger_() { /* Durable Object ใช้ alarm ลองใหม่เอง */ }
function syncStatus_() { return HOST.syncStatus(); }

/* ---------- ที่อยู่ของระบบ = โดเมนของ Cloudflare เสมอ ----------
   ชีต Settings มีแถว webapp_url ที่ Apps Script จดที่อยู่ของตัวเองไว้ (และซิงก์มาถึงที่นี่)
   ลิงก์แชร์ที่สร้างบน Cloudflare ต้องชี้มาที่ Cloudflare ไม่ใช่ Apps Script */
function rawServiceUrl_() { return HOST.origin(); }
function webAppUrl_() { return HOST.origin(); }
function rememberExecUrl_() { /* ไม่ต้องจด — ที่อยู่ไม่เปลี่ยน */ }

/* ---------- รุ่นของข้อมูล: เวลาที่ฐานข้อมูลถูกเขียนล่าสุด (หน้าเว็บใช้ตรวจว่าต้องโหลดใหม่ไหม) ---------- */
function dataVersion_() { return HOST.dataVersion(); }

/* ---------- บัญชี Google ไม่มีบน Cloudflare ----------
   ทางเข้า "เจ้าของชีต" ใช้ไม่ได้ ต้องล็อกอินด้วยบัญชีผู้ใช้หรือกุญแจกู้ระบบเท่านั้น */
function ownerEmail_() { return ''; }
function currentUserEmail_() { return ''; }

/* ย้ายโครงสร้างข้อมูลบน Cloudflare: ทำสำเนาลง Drive ไม่ได้ — ฝั่ง Apps Script ทำสำเนาของตัวเองอยู่แล้ว
   และทุกการย้ายถูกส่งไปอีกฝั่งด้วย (เขียนทั้งชีต) */
function snapshotBeforeMigrate_() { return ''; }

/* ---------- ฟังก์ชันที่ server.js เรียก ---------- */
var CF_EXPORTS = {
  api: api,
  /** ข้อมูลสำหรับหน้าเว็บ (ทำแบบเดียวกับ doGet) */
  page: function (key) {
    runMigrations_();
    var k = safeKey_(key || '');
    var actor = resolveActor_({ _key: k });
    return {
      appName: APP.NAME, subtitle: APP.SUBTITLE, version: APP.VERSION,
      accessKey: k, role: actor.role, theme: safeTheme_(getSetting_('theme', 'ตามเครื่อง'))
    };
  },
  /** ตรวจสิทธิ์ของคำสั่งที่ต้องส่งต่อให้ Apps Script ทำ (Drive/อีเมล) — คืนสิทธิ์ หรือโยน error */
  roleFor: function (action, payload) { return requireRole_(action, payload || {}); },
  isProxied: function (action) { return SYNC_PROXY_ACTIONS.indexOf(String(action)) >= 0; },
  applyOps: function (ops, opts) { return applySyncOps_(ops, opts); },
  exportAll: function () { return syncExport_(); },
  rowOut: function (name, row) { return syncRowOut_(name, row); },
  readRows: function (name) { return readRows_(name); },
  findRow: function (name, k) { return findRow_(name, k, syncKey_(name)); },
  syncKey: function (name) { return syncKey_(name); },
  syncable: function (name) { return syncable_(name); },
  sheetNames: function () { return Object.keys(SHEETS).map(function (k) { return SHEETS[k]; }); },
  ensureAll: function () { Object.keys(SHEETS).forEach(function (k) { ensureSheet_(SHEETS[k]); }); },
  logName: SHEETS.LOG,
  adminKeyOk: function (k) {
    var want = getSetting_('admin_token', '');
    return !!want && safeEqual_(String(k || '').trim(), want);
  },
  log: function (action, target, detail) { syncBegin_(); try { logActivity_(action, target, detail || ''); } finally { syncEnd_(); } },
  /** ตัวเลขสรุปสำหรับเทียบสองฝั่ง (เรียกตรงไม่ผ่านการตรวจสิทธิ์ — ใช้ภายในเท่านั้น) */
  figures: function () {
    var out = {};
    var year = Number(todayIso_().slice(0, 4));
    var probes = {
      'ภาพรวมปีนี้': function () { return dashboard_(year); },
      'หนี้หลัก (ทุกปี)': function () { return debtSummary_(LEDGER_MAIN, 'all'); },
      'หนี้รอง (ทุกปี)': function () { return debtSummary_(LEDGER_SUB, 'all'); },
      'ภาพรวมหนี้': function () { return debtOverview_(); },
      'รายการซื้อของปีนี้': function () { return purchaseSummary_(year); },
      'รายรับ-รายจ่ายปีนี้': function () { return financeSummary_(year); },
      'ซ่อมตึกปีนี้': function () { return buildingSummary_(year); },
      'ล้างแอร์ปีนี้': function () { return acMatrix_(year); },
      'ซ่อมห้องปีนี้': function () { return repairMatrix_(year); },
      'ค่าใช้จ่ายต่อห้อง': function () { return costPerRoom_(year); },
      'ทะเบียนห้อง': function () { return listRooms_(); }
    };
    Object.keys(probes).forEach(function (name) {
      try { out[name] = JSON.parse(JSON.stringify(probes[name](), function (k, v) { return k === '_row' ? undefined : v; })); }
      catch (e) { out[name] = { error: String(e && e.message || e) }; }
    });
    return out;
  },
  headline: function () {
    var main = debtSummary_(LEDGER_MAIN, 'all'), sub = debtSummary_(LEDGER_SUB, 'all');
    return { mainPaid: main.paid, mainRemaining: main.remaining, subPaid: sub.paid, subRemaining: sub.remaining };
  },
  makeDate: function (ms) { return new Date(ms); },
  schemaVersion: SCHEMA_VERSION,
  version: APP.VERSION,
  internals: { Date: Date, Utilities: Utilities }
};
return CF_EXPORTS;
