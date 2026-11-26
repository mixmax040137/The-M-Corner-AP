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
 *   { s: Sessions, revoke: ชื่อผู้ใช้, dev: true|false, t } ← ให้ออกจากระบบทุกเครื่อง / ยกเลิก PIN ทุกเครื่อง
 *       (ไม่ส่งรหัสการเข้าใช้งานข้ามระบบ ส่งแค่คำสั่งให้อีกฝั่งลบของตัวเอง)
 *
 * กันรับซ้ำ: ผู้ส่งติดเลขลำดับให้ทุก op (_g จาก Apps Script · _o จาก Cloudflare)
 * ผู้รับจำเลขล่าสุดที่ทำแล้ว ถ้าคำตอบหายระหว่างทางแล้วผู้ส่งส่งซ้ำ ก็ไม่ทำซ้ำ (ประวัติไม่งอก)
 * กันโค้ดคนละรุ่น: ทุกชุดแนบ schemaVersion ผู้รับที่รุ่นไม่ตรงจะปฏิเสธ ผู้ส่งเก็บเข้าคิวรอจนอัปเดตครบ
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

/** ให้ออกจากระบบทุกเครื่องของผู้ใช้ (dev = เฉพาะอุปกรณ์ที่ตั้ง PIN) — อีกฝั่งต้องทำตามด้วย */
function syncNoteRevoke_(username, dev) {
  if (!SYNC_OUT_ || SYNC_APPLYING_) return;
  var u = String(username || '').trim();
  if (u) SYNC_OUT_.ops.push({ s: SHEETS.SESSIONS, revoke: u, dev: !!dev, t: Date.now() });
}

/** ฝั่งรับ: ลบการเข้าใช้งานของผู้ใช้นั้นในระบบของตัวเอง (ไม่จดซ้ำ ไม่ลงประวัติซ้ำ) */
function syncApplyRevoke_(username, dev) {
  var u = normUsername_(username);
  var rows = readRows_(SHEETS.SESSIONS);
  var n = 0;
  for (var i = rows.length - 1; i >= 0; i--) {
    if (normUsername_(rows[i].username) !== u) continue;
    if (dev && rows[i].kind !== 'อุปกรณ์') continue;
    deleteRow_(SHEETS.SESSIONS, rows[i]._row, rows[i]); n++;
  }
  return n;
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
 *   strict        เจอ op ที่ทำไม่ได้ให้หยุดทั้งชุด (ใช้ตอนย้ายข้อมูลตั้งต้น — ต้องครบหรือไม่ทำเลย)
 *                 ไม่ตั้ง = ข้าม op นั้นแล้วทำตัวที่เหลือต่อ ไม่ให้ op เดียวขวางการซิงก์ไปตลอด
 * @return {number} จำนวน op ที่เขียนจริง
 */
function applySyncOps_(ops, opts) {
  opts = opts || {};
  var n = 0;
  SYNC_APPLYING_ = true;
  try {
    (ops || []).forEach(function (op) {
      if (!op) return;
      try {
        n += applySyncOp_(op, opts);
      } catch (e) {
        if (opts.strict) throw e;
        console.error('applySyncOps_: ข้าม op ' + op.s + '/' + (op.k || op.revoke || (op.all ? 'ทั้งชีต' : 'add')) + ' -> ' + e);
        if (opts.failed) opts.failed.push({ s: op.s, k: op.k, error: String(e && e.message || e) });
      }
    });
  } finally {
    SYNC_APPLYING_ = false;
  }
  return n;
}

/** ทำ op เดียว · คืนจำนวนที่เขียนจริง (0 หรือ 1) */
function applySyncOp_(op, opts) {
  if (op.revoke) { syncApplyRevoke_(op.revoke, op.dev); return 1; }
  if (!syncable_(op.s)) return 0;
  var name = op.s, key = syncKey_(name);
  if (op.add) { insertRow_(name, op.add); return 1; }
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
    return 1;
  }
  if (opts.accept && !opts.accept(op)) return 0;
  var found = findRow_(name, op.k, key);
  if (!op.r) {
    if (!found) return 0;
    deleteRow_(name, found._row, found);
    return 1;
  }
  if (found) updateRow_(name, found._row, Object.assign({}, found, op.r));
  else insertRow_(name, op.r);
  return 1;
}

/** รุ่นโครงสร้างข้อมูลของอีกฝั่งเข้ากับเราไหม (ไม่แนบมา = โค้ดรุ่นแรกที่ยังไม่ส่งค่านี้ ถือว่าเข้ากัน) */
function syncSchemaOk_(v) {
  return v === undefined || v === null || v === '' || Number(v) === SCHEMA_VERSION;
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
  SEQ: 'SYNC_SEQ',            // เลขลำดับ op ล่าสุดที่ส่งออก
  CF_DONE: 'SYNC_CF_DONE',    // เลขลำดับ op จาก Cloudflare ที่ทำไปแล้ว (กันทำซ้ำ)
  RESYNC: 'SYNC_RESYNC',      // คิวยาวเกินที่เก็บได้ → ส่งทั้งชีตแทน
  LAST_OK: 'SYNC_LAST_OK',
  LAST_ERR: 'SYNC_LAST_ERROR'
};
var SYNC_QUEUE_MAX = 8000;    // ไบต์ — Script Properties เก็บได้ราว 9 KB ต่อค่า

function syncConfigured_() {
  return !!(props_().getProperty(SYNC_PROP.SECRET) && props_().getProperty(SYNC_PROP.CF_URL));
}

/** ส่ง op ไปอีกฝั่ง — ฝั่ง Cloudflare ประกาศทับฟังก์ชันนี้ (ให้ Durable Object เป็นคนส่ง) */
function syncDeliver_(ops) {
  if (!syncConfigured_()) return false;
  // ทำใต้ล็อกเสมอ: คิวเก็บใน Script Properties แบบ อ่าน-แก้-เขียน ถ้าสองคำสั่งทำพร้อมกัน
  // อีกคนจะเขียนทับคิวของอีกคน (หรือ syncRetry ลบคิวที่เพิ่งต่อท้าย) แล้วการเปลี่ยนแปลงหาย
  try {
    return withScriptLock_(function () {
      syncTag_(ops);
      var queue = syncQueue_();
      var batch = queue.concat([ops]);
      var resync = syncResyncList_();
      if (!resync.length && syncPost_(batch)) {
        props_().deleteProperty(SYNC_PROP.QUEUE);
        return true;
      }
      syncEnqueue_(ops);
      return false;
    }, 30000);
  } catch (e) {
    console.error('syncDeliver_ -> ' + e);
    try { syncMarkResync_([ops]); } catch (e2) { console.error('syncMarkResync_ -> ' + e2); }
    return false;
  }
}

/** ติดเลขลำดับให้ทุก op (ฝั่ง Cloudflare ใช้กันทำซ้ำเมื่อส่งซ้ำ) */
function syncTag_(ops) {
  var seq = Number(props_().getProperty(SYNC_PROP.SEQ) || 0);
  ops.forEach(function (op) { if (op && op._g === undefined) op._g = ++seq; });
  props_().setProperty(SYNC_PROP.SEQ, String(seq));
}

/** ความยาวเป็นไบต์แบบ UTF-8 (ภาษาไทย 1 ตัว = 3 ไบต์ — ขีดจำกัดของ Script Properties นับเป็นไบต์) */
function utf8Len_(s) {
  return encodeURIComponent(String(s)).replace(/%[0-9A-F]{2}/gi, 'x').length;
}

/** จำว่าชีตไหนต้องส่งทั้งชีตใหม่ (ใช้เมื่อเก็บ op ทีละตัวไม่ไหว) */
function syncMarkResync_(batches) {
  var names = {};
  syncResyncList_().forEach(function (n) { names[n] = true; });
  batches.forEach(function (b) { (b || []).forEach(function (op) { if (op && syncable_(op.s) && op.s !== SHEETS.LOG) names[op.s] = true; }); });
  props_().setProperty(SYNC_PROP.RESYNC, JSON.stringify(Object.keys(names)));
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
  if (utf8Len_(text) <= SYNC_QUEUE_MAX) {
    try { props_().setProperty(SYNC_PROP.QUEUE, text); return; }
    catch (e) { console.error('syncEnqueue_ -> ' + e); }   // ใหญ่เกินจริง ๆ — ไปทางส่งทั้งชีตแทน
  }
  syncMarkResync_(queue);
  props_().deleteProperty(SYNC_PROP.QUEUE);
}

/** POST ไป Cloudflare · batch = รายการของชุด op (ส่งตามลำดับ) */
function syncPost_(batch) {
  var ops = [];
  batch.forEach(function (b) { ops = ops.concat(b); });
  try {
    var res = UrlFetchApp.fetch(String(props_().getProperty(SYNC_PROP.CF_URL)).replace(/\/+$/, '') + '/sync/apply', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true, followRedirects: true,
      payload: JSON.stringify({ secret: props_().getProperty(SYNC_PROP.SECRET), schemaVersion: SCHEMA_VERSION, ops: ops })
    });
    var reply = {};
    try { reply = JSON.parse(res.getContentText() || '{}') || {}; } catch (e2) { reply = {}; }
    var ok = res.getResponseCode() === 200 && reply.ok === true;
    if (ok) props_().setProperty(SYNC_PROP.LAST_OK, nowStamp_());
    else props_().setProperty(SYNC_PROP.LAST_ERR, nowStamp_() + ' · HTTP ' + res.getResponseCode() +
      (reply.error ? ' · ' + String(reply.error).slice(0, 160) : ''));
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
    // คิว (การแก้ที่เก่ากว่า เลขลำดับน้อยกว่า) ต้องไปก่อน แล้วค่อยส่งทั้งชีต (สภาพล่าสุด) ทับ
    // กลับลำดับเมื่อไร ของเก่าจะไปทับของใหม่ และอีกฝั่งจะข้ามคิวเพราะเลขลำดับน้อยกว่าที่ทำไปแล้ว
    var queue = syncQueue_();
    if (queue.length) {
      if (!syncPost_(queue)) return 'ยังส่งไม่ได้ จะลองใหม่รอบหน้า';
      props_().deleteProperty(SYNC_PROP.QUEUE);
    }
    var resync = syncResyncList_();
    if (resync.length) {
      var t = Date.now();
      var ops = resync.filter(syncable_).map(function (name) {
        return { s: name, all: readRows_(name).map(function (r) { return syncRowOut_(name, r); }), t: t };
      });
      syncTag_(ops);
      if (!syncPost_([ops])) return 'ยังส่งไม่ได้ จะลองใหม่รอบหน้า';
      props_().deleteProperty(SYNC_PROP.RESYNC);
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
      if (!syncSchemaOk_(body.schemaVersion)) {
        return { ok: false, error: 'โค้ดสองฝั่งเป็นคนละรุ่น (Apps Script รุ่นข้อมูล ' + SCHEMA_VERSION + ' / Cloudflare ' +
          body.schemaVersion + ') — อัปเดตโค้ดให้ตรงกันก่อน ระหว่างนี้ข้อมูลรอในคิว ไม่หาย' };
      }
      var n = withScriptLock_(function () {
        // ส่งซ้ำ (คำตอบรอบก่อนหายระหว่างทาง) — op ที่ทำไปแล้วข้าม
        var done = Number(props_().getProperty(SYNC_PROP.CF_DONE) || 0), top = done;
        var fresh = (body.ops || []).filter(function (op) {
          var o = op && Number(op._o);
          if (!o) return true;
          if (o > top) top = o;
          return o > done;
        });
        var applied = applySyncOps_(fresh);
        if (top > done) props_().setProperty(SYNC_PROP.CF_DONE, String(top));
        return applied;
      }, 60000);
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
  props_().deleteProperty(SYNC_PROP.CF_DONE);   // Cloudflare ฐานข้อมูลใหม่อาจนับเลขใหม่ตั้งแต่ 1
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
  // แก้ค่าในช่อง (EDIT) ตัว onEdit จัดการแล้ว · จัดรูปแบบ (FORMAT) ไม่เปลี่ยนข้อมูล — ส่งเฉพาะการเปลี่ยนโครง
  var structural = ['INSERT_ROW', 'REMOVE_ROW', 'INSERT_COLUMN', 'REMOVE_COLUMN', 'INSERT_GRID', 'REMOVE_GRID', 'OTHER'];
  if (!e || structural.indexOf(e.changeType) < 0) return;
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
