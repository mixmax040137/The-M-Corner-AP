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
 * @param {{accept?:function(Object):boolean, keepNewer?:function(string,string,number):boolean}=} opts
 *   accept     รับ op แถวนี้ไหม (ฝั่ง Cloudflare ใช้กันข้อมูลเก่ามาทับข้อมูลที่ใหม่กว่า)
 *   keepNewer  ตอนเขียนทั้งชีต แถวไหนของเราใหม่กว่า ให้เก็บของเราไว้
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
        op.all.forEach(function (r) { var k = String(r[key]); if (!(k in merged)) order.push(k); merged[k] = r; });
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
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncRetry') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncRetry').timeBased().everyMinutes(5).create();
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
  try {
    return { ok: true, data: API_ROUTES[action](body.payload || {}, role) };
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e) };
  }
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
