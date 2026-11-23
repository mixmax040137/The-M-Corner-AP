/* =====================================================================
   prelude.js — ของทดแทนบริการของ Google ให้โค้ด .gs ชุดเดิมรันบน Cloudflare
   (ถูกวางไว้ "ก่อน" โค้ด .gs ภายในฟังก์ชัน createApp(HOST) — ดู build.js)

   หลักการ: โค้ดธุรกิจทั้งหมดไม่รู้ว่าตัวเองรันอยู่ที่ไหน
   แผ่นงานของ Google ถูกแทนด้วยตารางในหน่วยความจำ (เซลล์ต่อเซลล์ เหมือนชีตจริง)
   ที่ HOST โหลดจาก/บันทึกลงฐานข้อมูล SQLite ของ Durable Object
   ===================================================================== */

var CF_TZ = 'Asia/Bangkok';

/* ---------- วันเวลา: ต้องคิดตามเวลาไทยเสมอ (เครื่องของ Cloudflare เป็นเวลา UTC) ---------- */
var CF_FMT_CACHE = {};
function cfFormatDate(d, tz, pattern) {
  if (!(d instanceof Date) || isNaN(d.getTime())) throw new Error('formatDate: วันที่ไม่ถูกต้อง');
  tz = tz || CF_TZ;
  var f = CF_FMT_CACHE[tz] || (CF_FMT_CACHE[tz] = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }));
  var p = {};
  f.formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
  return String(pattern)
    .replace('yyyy', p.year).replace('MM', p.month).replace('dd', p.day)
    .replace('HH', p.hour).replace('mm', p.minute).replace('ss', p.second);
}

/* ---------- SHA-256 แบบทำงานทันที (crypto.subtle ของเว็บเป็นแบบรอผล ใช้กับโค้ดเดิมไม่ได้) ----------
   ต้องได้ผลตรงกับ Utilities.computeDigest ของ Google ทุกบิต
   ไม่งั้นรหัสผ่านที่ตั้งไว้ใน Apps Script จะล็อกอินบน Cloudflare ไม่ได้ (มีชุดทดสอบเทียบ) */
var CF_K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,
  0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,
  0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,
  0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,
  0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
var CF_W = new Int32Array(64);
function cfSha256(bytes) {
  var len = bytes.length, bitLen = len * 8;
  var padded = new Uint8Array(((len + 9 + 63) >> 6) << 6);
  padded.set(bytes); padded[len] = 0x80;
  var dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 4, bitLen >>> 0);
  dv.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000));
  var h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a,
      h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  var W = CF_W;
  for (var off = 0; off < padded.length; off += 64) {
    for (var i = 0; i < 16; i++) W[i] = dv.getInt32(off + i * 4);
    for (i = 16; i < 64; i++) {
      var a0 = W[i - 15], a1 = W[i - 2];
      var s0 = ((a0 >>> 7) | (a0 << 25)) ^ ((a0 >>> 18) | (a0 << 14)) ^ (a0 >>> 3);
      var s1 = ((a1 >>> 17) | (a1 << 15)) ^ ((a1 >>> 19) | (a1 << 13)) ^ (a1 >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
    }
    var a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (i = 0; i < 64; i++) {
      var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      var ch = (e & f) ^ (~e & g);
      var t1 = (h + S1 + ch + CF_K[i] + W[i]) | 0;
      var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      var mj = (a & b) ^ (a & c) ^ (b & c);
      var t2 = (S0 + mj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }
  var out = new Uint8Array(32), odv = new DataView(out.buffer);
  [h0, h1, h2, h3, h4, h5, h6, h7].forEach(function (v, k) { odv.setInt32(k * 4, v); });
  return out;
}

var CF_B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function cfBase64Encode(bytes) {
  var s = '', i, n = bytes.length;
  for (i = 0; i < n; i += 3) {
    var b0 = bytes[i] & 255, b1 = i + 1 < n ? bytes[i + 1] & 255 : 0, b2 = i + 2 < n ? bytes[i + 2] & 255 : 0;
    s += CF_B64[b0 >> 2] + CF_B64[((b0 & 3) << 4) | (b1 >> 4)] +
         (i + 1 < n ? CF_B64[((b1 & 15) << 2) | (b2 >> 6)] : '=') + (i + 2 < n ? CF_B64[b2 & 63] : '=');
  }
  return s;
}
function cfBase64Decode(str) {
  var bin = atob(String(str).replace(/[\r\n\s]/g, ''));
  var out = [];
  for (var i = 0; i < bin.length; i++) { var c = bin.charCodeAt(i); out.push(c > 127 ? c - 256 : c); }
  return out;
}

var Utilities = {
  formatDate: cfFormatDate,
  formatString: function (f) {
    var a = Array.prototype.slice.call(arguments, 1), i = 0;
    return String(f).replace(/%s/g, function () { return a[i++]; });
  },
  DigestAlgorithm: { SHA_256: 'SHA_256' },
  Charset: { UTF_8: 'UTF_8' },
  // เหมือน Google: คืนไบต์แบบมีเครื่องหมาย (-128..127)
  computeDigest: function (algo, text) {
    if (algo !== 'SHA_256') throw new Error('รองรับเฉพาะ SHA-256');
    return Array.prototype.map.call(cfSha256(new TextEncoder().encode(String(text))), function (b) { return b > 127 ? b - 256 : b; });
  },
  base64Encode: function (v) { return cfBase64Encode(typeof v === 'string' ? new TextEncoder().encode(v) : v); },
  base64Decode: cfBase64Decode,
  getUuid: function () { return crypto.randomUUID(); },
  newBlob: function () { throw new Error('ไฟล์ทำงานผ่าน Apps Script'); },
  sleep: function () {}
};

/* ---------- แผ่นงาน: ตารางในหน่วยความจำที่ HOST บันทึกลงฐานข้อมูล ---------- */

/** ชีตจริงเก็บข้อความที่ขึ้นต้นด้วย ' เป็นข้อความ (ไม่เก็บ ' ไว้) — ทำเหมือนกัน */
function cfCellIn(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' && v.charAt(0) === "'") return v.slice(1);
  if (v instanceof Date) return new Date(v.getTime());
  return v;
}

function cfSheet(name, grid) {
  function touch() { HOST.touchSheet(name, grid); }
  function cell(r, c) { var row = grid[r - 1]; var v = row ? row[c - 1] : ''; return v === undefined ? '' : v; }
  function set(r, c, v) {
    while (grid.length < r) grid.push([]);
    var row = grid[r - 1];
    while (row.length < c) row.push('');
    row[c - 1] = cfCellIn(v);
  }
  function lastRow() {
    for (var i = grid.length - 1; i >= 0; i--) {
      var row = grid[i];
      if (row && row.some(function (v) { return v !== '' && v !== null && v !== undefined; })) return i + 1;
    }
    return 0;
  }
  function range(r, c, nr, nc) {
    nr = nr || 1; nc = nc || 1;
    var rg = {
      getValues: function () {
        var out = [];
        for (var i = 0; i < nr; i++) {
          var row = [];
          for (var j = 0; j < nc; j++) {
            var v = cell(r + i, c + j);
            row.push(v instanceof Date ? new Date(v.getTime()) : v);
          }
          out.push(row);
        }
        return out;
      },
      getValue: function () { var v = cell(r, c); return v instanceof Date ? new Date(v.getTime()) : v; },
      setValues: function (m) {
        m.forEach(function (row, i) { row.forEach(function (v, j) { set(r + i, c + j, v); }); });
        touch(); return rg;
      },
      setValue: function (v) { set(r, c, v); touch(); return rg; },
      clearContent: function () {
        for (var i = 0; i < nr; i++) for (var j = 0; j < nc; j++) if (grid[r + i - 1]) set(r + i, c + j, '');
        touch(); return rg;
      }
    };
    ['setNumberFormat', 'setDataValidation', 'setWrap', 'setFontWeight', 'setBackground',
     'setFontColor', 'setVerticalAlignment'].forEach(function (k) { rg[k] = function () { return rg; }; });
    return rg;
  }
  return {
    getName: function () { return name; },
    getRange: range,
    getLastRow: lastRow,
    getLastColumn: function () {
      var m = 0;
      grid.forEach(function (row) {
        for (var j = row.length - 1; j >= 0; j--) {
          if (row[j] !== '' && row[j] !== null && row[j] !== undefined) { if (j + 1 > m) m = j + 1; break; }
        }
      });
      return m;
    },
    getMaxRows: function () { return Math.max(1000, grid.length + 1); },
    appendRow: function (vals) { var r = lastRow() + 1; vals.forEach(function (v, j) { set(r, j + 1, v); }); touch(); },
    deleteRow: function (r) { grid.splice(r - 1, 1); touch(); },
    setFrozenRows: function () {}, setColumnWidth: function () {},
    copyTo: function () { throw new Error('ไม่รองรับบน Cloudflare'); }
  };
}

var CF_SHEET_CACHE = {};
var CF_SS = {
  getId: function () { return 'cloudflare'; },
  getName: function () { return 'The M Corner AP'; },
  // ลิงก์ "เปิด Google Sheet" ชี้ไปชีตของ Apps Script ตัวสำรอง (ได้มาตอนจับคู่)
  getUrl: function () { return HOST.getProp('GAS_SHEET_URL') || ''; },
  getOwner: function () { return null; },
  getSheetByName: function (name) {
    var grid = HOST.loadSheet(name);
    if (!grid) return null;
    return cfSheet(name, grid);
  },
  insertSheet: function (name) {
    var grid = HOST.createSheet(name);
    return cfSheet(name, grid);
  },
  getSheets: function () { return HOST.sheetNames().map(function (n) { return CF_SS.getSheetByName(n); }); },
  deleteSheet: function () { throw new Error('ไม่รองรับบน Cloudflare'); }
};

var SpreadsheetApp = {
  getActiveSpreadsheet: function () { return CF_SS; },
  openById: function () { return CF_SS; },
  flush: function () {},
  newDataValidation: function () {
    var b = { requireValueInList: function () { return b; }, setAllowInvalid: function () { return b; }, build: function () { return {}; } };
    return b;
  },
  getUi: function () { throw new Error('ไม่มีเมนูชีตบน Cloudflare'); },
  create: function () { throw new Error('ไม่รองรับบน Cloudflare'); }
};

var PropertiesService = {
  getScriptProperties: function () {
    return {
      getProperty: function (k) { return HOST.getProp(k); },
      setProperty: function (k, v) { HOST.setProp(k, String(v)); },
      deleteProperty: function (k) { HOST.delProp(k); }
    };
  }
};

/* Durable Object ทำงานทีละคำขอ และคำสั่งของระบบรันจบในรวดเดียว ไม่มีใครแทรกกลางทาง
   จึงไม่ต้องมีคิวเหมือน Apps Script */
var LockService = {
  getScriptLock: function () {
    return { waitLock: function () {}, tryLock: function () { return true; }, releaseLock: function () {}, hasLock: function () { return true; } };
  }
};

var Session = {
  getActiveUser: function () { return { getEmail: function () { return ''; } }; },
  getEffectiveUser: function () { return { getEmail: function () { return ''; } }; }
};

var CF_NOT_HERE = function () { throw new Error('งานนี้ใช้ Google Drive/อีเมล — ระบบส่งต่อให้ Apps Script ทำ'); };
var ScriptApp = {
  getService: function () { return { getUrl: function () { return HOST.origin(); } }; },
  getProjectTriggers: function () { return []; },
  deleteTrigger: function () {},
  newTrigger: CF_NOT_HERE,
  getOAuthToken: CF_NOT_HERE,
  WeekDay: {}
};
var DriveApp = { getFileById: CF_NOT_HERE, getFolderById: CF_NOT_HERE, getFoldersByName: CF_NOT_HERE, createFolder: CF_NOT_HERE, Access: {}, Permission: {} };
var MailApp = { sendEmail: CF_NOT_HERE };
var UrlFetchApp = { fetch: CF_NOT_HERE };
var HtmlService = { createTemplateFromFile: CF_NOT_HERE, createHtmlOutputFromFile: CF_NOT_HERE, createHtmlOutput: CF_NOT_HERE, XFrameOptionsMode: {} };
var ContentService = { createTextOutput: CF_NOT_HERE, MimeType: {} };
