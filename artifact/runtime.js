/* =========================================================
   runtime.js — ตัวเชื่อมให้โค้ดฝั่งเซิร์ฟเวอร์ชุดเดียวกัน
   ทำงานได้ในเบราว์เซอร์ โดยเก็บข้อมูลไว้ในหน้าเว็บเอง
   (โหลดหลังไฟล์ .gs ทั้งหมด — ฟังก์ชันชื่อซ้ำจะทับของเดิม)
   ========================================================= */

/* ---------- ฐานข้อมูลในหน่วยความจำ ---------- */
var ACCESS_KEY = '';
var USER_ROLE = 'admin';
var CAN_EDIT = true;
function canEdit(){ return true; }
var DB = window.__SEED__ || {};
Object.keys(SHEETS).forEach(function (k) {
  var n = SHEETS[k];
  if (!Array.isArray(DB[n])) DB[n] = [];
});

/* ---------- shim ของ Apps Script ---------- */
var Utilities = {
  formatDate: function (d, tz, pattern) {
    var p = function (n) { return String(n).padStart(2, '0'); };
    return pattern
      .replace('yyyy', d.getFullYear()).replace('MM', p(d.getMonth() + 1))
      .replace('dd', p(d.getDate())).replace('HH', p(d.getHours()))
      .replace('mm', p(d.getMinutes())).replace('ss', p(d.getSeconds()));
  },
  formatString: function (f) {
    var a = Array.prototype.slice.call(arguments, 1), i = 0;
    return f.replace(/%s/g, function () { return a[i++]; });
  }
};
var __PROPS__ = {};
function props_() {
  return {
    getProperty: function (k) { return k in __PROPS__ ? __PROPS__[k] : null; },
    setProperty: function (k, v) { __PROPS__[k] = v; },
    deleteProperty: function (k) { delete __PROPS__[k]; }
  };
}
function getSpreadsheet_() { return { getUrl: function () { return ''; }, getId: function () { return ''; } }; }
function currentUserEmail_() { return 'เจ้าของหอพัก'; }
function ownerEmail_() { return 'เจ้าของหอพัก'; }
function resolveRole_() { return ROLE.ADMIN; }
function requireRole_() { return ROLE.ADMIN; }
function whoAmI() { return { role: ROLE.ADMIN, canEdit: true, email: 'เจ้าของหอพัก', label: 'ผู้ดูแล' }; }
function ensureTokens_() { return []; }
function setSetting_(k, v) {
  var rows = rowsOf_(SHEETS.SETTINGS);
  for (var i = 0; i < rows.length; i++) if (String(rows[i].key) === String(k)) { rows[i].value = String(v); return v; }
  rows.push(coerce_(SHEETS.SETTINGS, { key: k, label: k, value: String(v), note: '' }));
  return v;
}
function dataVersion_() { return LOCAL_VERSION; }
function backupToDrive_() { throw new Error('การสำรองลง Google Drive ใช้ได้เมื่อติดตั้งบน Google Apps Script'); }
function listBackups_() { return []; }
var LOCAL_VERSION = Date.now();
function ensureDriveFolders_() { return null; }
function trashFile_() { return true; }
function subFolder_() { return null; }
function sendDigestNow() { return 'การส่งอีเมลอัตโนมัติใช้ได้เมื่อติดตั้งบน Google Apps Script'; }

/* ---------- ชั้นอ่าน/เขียนข้อมูล ---------- */
function rowsOf_(name) {
  if (!Array.isArray(DB[name])) DB[name] = [];
  return DB[name];
}
function coerce_(name, obj) {
  var cols = SCHEMA[name], rec = {};
  cols.forEach(function (c) { rec[c.key] = normalizeValue_(serializeValue_(obj[c.key], c.type), c.type); });
  return rec;
}
function readRows_(name) {
  return rowsOf_(name).map(function (r, i) {
    var o = {};
    Object.keys(r).forEach(function (k) { o[k] = Array.isArray(r[k]) ? r[k].slice() : r[k]; });
    o._row = i + 2;
    return o;
  });
}
function insertRow_(name, obj) {
  var rec = coerce_(name, obj);
  rowsOf_(name).push(rec);
  var out = Object.assign({}, rec); out._row = rowsOf_(name).length + 1;
  DIRTY = true;
  return out;
}
function updateRow_(name, rowNumber, obj) {
  var rec = coerce_(name, obj);
  rowsOf_(name)[rowNumber - 2] = rec;
  var out = Object.assign({}, rec); out._row = rowNumber;
  DIRTY = true;
  return out;
}
function deleteRow_(name, rowNumber) {
  rowsOf_(name).splice(rowNumber - 2, 1);
  DIRTY = true;
}
function bulkInsert_(name, objects) {
  if (!objects || !objects.length) return 0;
  objects.forEach(function (o) { rowsOf_(name).push(coerce_(name, o)); });
  DIRTY = true;
  return objects.length;
}
function clearSheet_(name) { DB[name] = []; DIRTY = true; }
function ensureSheet_(name) { rowsOf_(name); return null; }

function logActivity_(action, target, detail) {
  rowsOf_(SHEETS.LOG).push(coerce_(SHEETS.LOG, {
    at: new Date(), user: currentUserEmail_(), action: action, target: target,
    detail: typeof detail === 'string' ? detail : JSON.stringify(detail || {})
  }));
  if (rowsOf_(SHEETS.LOG).length > 400) DB[SHEETS.LOG] = rowsOf_(SHEETS.LOG).slice(-400);
}

/* ---------- ไฟล์แนบ: เก็บเป็นรูปฝังในหน้าเว็บ ---------- */
function toFileRefs_(list) {
  return splitList_(list).map(function (raw) {
    var s = String(raw || '');
    if (s.indexOf('data:') === 0) return { id: '', name: 'รูปภาพ', url: s, thumb: s };
    var m = s.match(/\/d\/([a-zA-Z0-9_-]{20,})/) || s.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
    if (m) return { id: m[1], name: '', url: s, thumb: 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w600' };
    return { id: '', name: s, url: s, thumb: /\.(png|jpe?g|gif|webp)$/i.test(s) ? s : '' };
  });
}
function uploadFiles_(payload) {
  return ((payload && payload.files) || []).map(function (f) {
    return { id: '', name: f.name || '', url: f.dataUrl, thumb: f.dataUrl, mime: f.mimeType || '' };
  });
}

/* =========================================================
   การบันทึกข้อมูลถาวร — หน้าเว็บบันทึกตัวเองเป็นเวอร์ชันใหม่
   ========================================================= */

var DIRTY = false;
var ARTIFACT = null;        // namespace ของ capability (null = อ่านอย่างเดียว)
var DOWNLOADS = null;
var SAVING = false;
var SAVE_TIMER = null;

/**
 * ต่อกลับเป็นเอกสารเต็มฉบับจากแม่แบบที่ฝังไว้ในหน้า
 *
 * แม่แบบเก็บเป็น base64 จึงไม่มีทางไปปิดแท็ก script ก่อนเวลา
 * และไม่ต้องเข้ารหัสใหม่ตอนบันทึก — ใช้สตริงเดิมวางกลับได้เลย
 */
var PH_TPL = '{' + '{TEMPLATE}' + '}';
var PH_DATA = '{' + '{DATA}' + '}';

function decodeB64_(b64) {
  var bin = atob(b64);
  var bytes = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

function buildDocument_() {
  var b64 = document.getElementById('tpl').textContent.trim();
  var TEMPLATE = decodeB64_(b64);
  var json = JSON.stringify(DB).replace(/</g, '\\u003c');
  return TEMPLATE
    .replace(PH_TPL, function () { return b64; })
    .replace(PH_DATA, function () { return json; });
}

function saveState(){
  if (!DIRTY) return Promise.resolve('nochange');
  if (!ARTIFACT) { showSaveState('readonly'); return Promise.resolve('readonly'); }
  if (SAVING) return Promise.resolve('busy');
  SAVING = true;
  showSaveState('saving');

  var html = buildDocument_();
  var mb = html.length / 1048576;
  if (mb > 14) {
    SAVING = false;
    showSaveState('toobig');
    toast('ข้อมูลใหญ่เกินไป (' + mb.toFixed(1) + ' MB) — ลบรูปเก่าบางส่วนหรือดาวน์โหลดสำรองไว้ก่อน', 'err');
    return Promise.resolve('toobig');
  }

  return ARTIFACT.publish(html).then(function(){
    DIRTY = false; SAVING = false; showSaveState('saved');
    return 'saved';
  }).catch(function(e){
    SAVING = false;
    var code = (e && (e.code || e.name)) || '';
    if (String(code).indexOf('conflict') >= 0) {
      showSaveState('conflict');
      toast('มีการบันทึกจากหน้าต่างอื่น — หน้านี้จะโหลดข้อมูลล่าสุด', 'err');
      return 'conflict';
    }
    showSaveState('error');
    toast('บันทึกไม่สำเร็จ: ' + (e && e.message ? e.message : e), 'err');
    return 'error';
  });
}

function showSaveState(state){
  var el = document.getElementById('saveState');
  if (!el) return;
  var map = {
    ready:    ['', ''],
    saving:   ['<span class="spin"></span> กำลังบันทึก…', 'b info'],
    saved:    ['✓ บันทึกแล้ว', 'b ok'],
    dirty:    ['● ยังไม่ได้บันทึก', 'b warn'],
    readonly: ['👁 โหมดดูอย่างเดียว', 'b mute'],
    conflict: ['⚠ ข้อมูลชนกัน', 'b dgr'],
    toobig:   ['⚠ ข้อมูลเต็ม', 'b dgr'],
    error:    ['⚠ บันทึกไม่สำเร็จ', 'b dgr']
  };
  var m = map[state] || map.ready;
  el.className = m[1];
  el.innerHTML = m[0];
  if (state === 'saved') setTimeout(function(){ if (!DIRTY) showSaveState('ready'); }, 2600);
}

/* ---------- เชื่อม API ของหน้าเว็บเข้ากับตรรกะในเครื่อง ---------- */
var MUTATING = /\.(save|delete|savePayment|deletePayment|bulkBook|import)$/;

callApi = function(action, payload){
  return new Promise(function(resolve, reject){
    var res;
    try { res = api(action, payload || {}); }
    catch (e) { return reject(e); }
    if (!res.ok) return reject(new Error(res.error));

    if (MUTATING.test(action)) {
      DIRTY = true;
      showSaveState('dirty');
      resolve(res.data);
      clearTimeout(SAVE_TIMER);
      SAVE_TIMER = setTimeout(saveState, 400);   // รวมการแก้ไขที่ติดกันเป็นการบันทึกครั้งเดียว
    } else {
      resolve(res.data);
    }
  });
};

/* ---------- ย่อรูปก่อนแนบ เพื่อไม่ให้ไฟล์บวม ---------- */
readAsDataUrl = function(file){
  return new Promise(function(resolve, reject){
    if (!/^image\//.test(file.type)) {
      var fr = new FileReader();
      fr.onload = function(){ resolve({ name: file.name, mimeType: file.type, dataUrl: fr.result }); };
      fr.onerror = function(){ reject(new Error('อ่านไฟล์ไม่สำเร็จ: ' + file.name)); };
      return fr.readAsDataURL(file);
    }
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function(){
      var MAX = 1100;
      var w = img.naturalWidth, h = img.naturalHeight;
      var scale = Math.min(1, MAX / Math.max(w, h));
      var c = document.createElement('canvas');
      c.width = Math.round(w * scale); c.height = Math.round(h * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve({ name: file.name, mimeType: 'image/jpeg', dataUrl: c.toDataURL('image/jpeg', 0.72) });
    };
    img.onerror = function(){ URL.revokeObjectURL(url); reject(new Error('อ่านรูปไม่สำเร็จ: ' + file.name)); };
    img.src = url;
  });
};

/* ---------- จำหน้าที่เปิดค้างไว้ (หลังบันทึกหน้าจะโหลดใหม่) ---------- */
function rememberView(){
  try { localStorage.setItem('mcorner.view', JSON.stringify({ page: S.page, year: S.year })); } catch (e) {}
}
function restoreView(){
  try {
    var v = JSON.parse(localStorage.getItem('mcorner.view') || 'null');
    if (v && v.page) { S.year = v.year || S.year; return v.page; }
  } catch (e) {}
  return null;
}

/* ---------- ดาวน์โหลดไฟล์ผ่าน capability ---------- */
window.saveViaHost = function(filename, content, mime){
  if (!DOWNLOADS) {
    openModal('ดาวน์โหลดไม่ได้ในหน้านี้',
      '<p class="fs13">คัดลอกข้อความด้านล่างไปวางในไฟล์ <b>' + esc(filename) + '</b> ได้เลย</p>' +
      '<textarea class="ta" style="min-height:300px;font-family:monospace;font-size:11px" onclick="this.select()">' +
      esc(content) + '</textarea>',
      '<button class="btn" onclick="closeModal()">ปิด</button>', true);
    return;
  }
  DOWNLOADS.save({ filename: filename, data: content })
    .then(function(){ toast('บันทึกไฟล์ ' + filename + ' แล้ว', 'ok'); })
    .catch(function(e){
      var c = e && (e.code || e.name);
      if (String(c).indexOf('cancel') >= 0 || String(c).indexOf('denied') >= 0) return;
      toast('ดาวน์โหลดไม่สำเร็จ: ' + (e && e.message ? e.message : e), 'err');
    });
};

/* ---------- หน้าตัวอย่างไม่มีบัญชีผู้ใช้ จึงข้ามด่านล็อกอินไปเลย ---------- */
authGate = function(){
  AUTH.me = {
    role: 'ผู้ดูแล', canEdit: true, isAdmin: true, signedIn: true,
    username: '', name: 'หน้าตัวอย่าง', via: 'หน้าตัวอย่าง', label: 'ผู้ดูแล'
  };
  bootNow();
};

// ทุกคำสั่งในหน้านี้ถือว่าเป็นผู้ดูแล เพราะข้อมูลอยู่ในเครื่องผู้ใช้เองอยู่แล้ว
resolveActor_ = function(){
  return { role: ROLE.ADMIN, username: '', name: 'หน้าตัวอย่าง', via: 'หน้าตัวอย่าง' };
};

// ไม่มีเซิร์ฟเวอร์ให้เก็บบัญชี จึงตัดส่วนจัดการผู้ใช้กับลิงก์แชร์ออกจากหน้าตั้งค่า
listUsers_ = function(){ return null; };
listDevices_ = function(){ return []; };

/* ---------- ไม่ต้อง poll เพราะข้อมูลอยู่ในหน้าเดียวกัน ---------- */
function startPolling(){
  var dot = document.getElementById('liveDot');
  if (dot) dot.innerHTML = '';
}

/* ---------- ข้อความมุมล่างซ้าย ---------- */
function navFootHtml(){
  return '<b style="color:#c7d0e0">ข้อมูลบันทึกอยู่ในหน้านี้</b>' +
         '<br>ดาวน์โหลดสำรองที่หน้า "รายงาน"' +
         '<br><span style="opacity:.7">v' + APP.VERSION + '</span>';
}

/* ---------- บอกให้ชัดว่าอะไรมีเฉพาะเวอร์ชันบน Google ---------- */
settingsUsersCard = function(){
  return card('👥 บัญชีผู้ใช้และการแชร์',
    '<div class="empty"><div class="big">🔐</div>' +
    'การล็อกอิน · PIN 6 หลัก · แจกบัญชีให้คนอื่น · และการอ่านข้อความจากรูป<br>' +
    'มีเฉพาะเวอร์ชันที่ติดตั้งบน Google Apps Script<br>' +
    '<span class="fs12">หน้านี้เป็นตัวอย่างแบบไฟล์เดียว ข้อมูลเก็บอยู่ในหน้าเว็บนี้เอง</span></div>');
};
settingsShareCard = function(){ return ''; };

/* ---------- เริ่มระบบ ---------- */
(function start(){
  var wanted = restoreView();
  boot();
  if (wanted) setTimeout(function(){ if (S.page !== wanted) go(wanted); }, 60);

  window.addEventListener('beforeunload', rememberView);
  document.addEventListener('visibilitychange', function(){ if (document.hidden) rememberView(); });

  if (window.claude && typeof window.claude.use === 'function') {
    window.claude.use('artifact').then(function(a){
      ARTIFACT = a;
      showSaveState(a ? (DIRTY ? 'dirty' : 'ready') : 'readonly');
      if (a && DIRTY) saveState();
    }).catch(function(){ showSaveState('readonly'); });

    window.claude.use('downloads').then(function(d){ DOWNLOADS = d; }).catch(function(){});
  } else {
    showSaveState('readonly');
  }
})();
