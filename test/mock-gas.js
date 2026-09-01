/** ตัวจำลอง Google Apps Script runtime สำหรับทดสอบตรรกะฝั่งเซิร์ฟเวอร์ด้วย Node */
const store = { props: {}, sheets: new Map(), files: new Map() };

function fmt(d, tz, pattern) {
  const p = n => String(n).padStart(2, '0');
  return pattern
    .replace('yyyy', d.getFullYear())
    .replace('MM', p(d.getMonth() + 1))
    .replace('dd', p(d.getDate()))
    .replace('HH', p(d.getHours()))
    .replace('mm', p(d.getMinutes()))
    .replace('ss', p(d.getSeconds()));
}

class Range {
  constructor(sheet, r, c, nr, nc) { Object.assign(this, { sheet, r, c, nr, nc }); }
  getValues() {
    const out = [];
    for (let i = 0; i < this.nr; i++) {
      const row = [];
      for (let j = 0; j < this.nc; j++) row.push(this.sheet.cell(this.r + i, this.c + j));
      out.push(row);
    }
    return out;
  }
  setValues(m) {
    m.forEach((row, i) => row.forEach((v, j) => this.sheet.set(this.r + i, this.c + j, v)));
    return this;
  }
  setValue(v) { this.sheet.set(this.r, this.c, v); return this; }
  getValue() { return this.sheet.cell(this.r, this.c); }
  clearContent() {
    for (let i = 0; i < this.nr; i++)
      for (let j = 0; j < this.nc; j++) this.sheet.set(this.r + i, this.c + j, '');
    return this;
  }
  setNumberFormat() { return this; } setDataValidation() { return this; }
  setWrap() { return this; } setFontWeight() { return this; }
  setBackground() { return this; } setFontColor() { return this; }
  setVerticalAlignment() { return this; }
}

class Sheet {
  constructor(name) { this.name = name; this.data = []; }
  getName() { return this.name; }
  cell(r, c) { const row = this.data[r - 1]; const v = row ? row[c - 1] : ''; return v === undefined ? '' : v; }
  set(r, c, v) { while (this.data.length < r) this.data.push([]); const row = this.data[r - 1]; while (row.length < c) row.push(''); row[c - 1] = v; }
  getRange(r, c, nr = 1, nc = 1) { return new Range(this, r, c, nr, nc); }
  getLastRow() { let last = 0; this.data.forEach((row, i) => { if (row && row.some(v => v !== '' && v != null)) last = i + 1; }); return last; }
  getLastColumn() { return Math.max(0, ...this.data.map(r => (r ? r.length : 0))); }
  getMaxRows() { return Math.max(1000, this.data.length + 1); }
  appendRow(vals) { const r = this.getLastRow() + 1; vals.forEach((v, j) => this.set(r, j + 1, v)); }
  deleteRow(r) { this.data.splice(r - 1, 1); }
  setFrozenRows() { return this; } setColumnWidth() { return this; }
}

const spreadsheet = {
  getId: () => 'MOCK_SS',
  getUrl: () => 'https://docs.google.com/spreadsheets/d/MOCK_SS/edit',
  getOwner: () => ({ getEmail: () => 'owner@example.com' }),
  getSheetByName: n => store.sheets.get(n) || null,
  insertSheet: n => { const s = new Sheet(n); store.sheets.set(n, s); return s; },
  deleteSheet: sh => { store.sheets.delete(sh.getName ? sh.getName() : String(sh)); },
  getSheets: () => Array.from(store.sheets.values())
};

global.SpreadsheetApp = {
  getActiveSpreadsheet: () => spreadsheet,
  openById: () => spreadsheet,
  newDataValidation: () => ({ requireValueInList: () => ({ setAllowInvalid: () => ({ build: () => ({}) }) }) }),
  getUi: () => { throw new Error('no ui'); }
};
global.PropertiesService = {
  getScriptProperties: () => ({
    getProperty: k => (k in store.props ? store.props[k] : null),
    setProperty: (k, v) => { store.props[k] = v; },
    deleteProperty: k => { delete store.props[k]; }
  })
};
const crypto = require('crypto');
global.Utilities = {
  formatDate: fmt,
  formatString: (f, ...a) => { let i = 0; return f.replace(/%s/g, () => a[i++]); },
  base64Decode: s => Buffer.from(s, 'base64'),
  base64Encode: b => Buffer.from(b).toString('base64'),
  DigestAlgorithm: { SHA_256: 'sha256' },
  Charset: { UTF_8: 'utf8' },
  // Apps Script คืน byte แบบมีเครื่องหมาย (-128..127) ต้องเลียนแบบให้เหมือน
  computeDigest: (algo, text) =>
    Array.from(crypto.createHash(algo).update(String(text), 'utf8').digest())
         .map(b => (b > 127 ? b - 256 : b)),
  getUuid: () => crypto.randomUUID(),
  newBlob: (b, m, n) => ({
    b, m, n,
    getDataAsString: (cs) => Buffer.from(b).toString(cs ? String(cs).toLowerCase().replace('-', '') : 'utf8'),
    getBytes: () => b, getName: () => n, getContentType: () => m
  })
};
let fileSeq = 0;
store.folders = new Map();          // ชื่อโฟลเดอร์ -> รายชื่อไฟล์ข้างใน
const mkFile = (name, folderName) => {
  const id = 'FILE' + (++fileSeq).toString().padStart(20, '0');
  const created = new Date(Date.now() + fileSeq * 1000);
  const f = {
    getId: () => id, getName: () => name, getMimeType: () => 'application/json',
    getUrl: () => 'https://drive.google.com/file/d/' + id + '/view',
    getSize: () => 2048, getDateCreated: () => created,
    getLastUpdated: () => store.lastUpdated || created,
    setSharing: () => f,
    setTrashed: () => {
      const list = store.folders.get(folderName) || [];
      store.folders.set(folderName, list.filter(x => x !== f));
      return f;
    }
  };
  store.files.set(id, f);
  if (folderName) {
    const list = store.folders.get(folderName) || [];
    list.push(f); store.folders.set(folderName, list);
  }
  return f;
};
const mkFolder = name => ({
  getId: () => 'FOLDER_' + name, getName: () => name,
  getUrl: () => 'https://drive.google.com/drive/folders/FOLDER_' + name,
  getFoldersByName: n => ({ hasNext: () => true, next: () => mkFolder(n) }),
  createFolder: n => mkFolder(n),
  createFile: blob => mkFile(blob.n, name),
  getFiles: () => {
    const list = (store.folders.get(name) || []).slice();
    let i = 0;
    return { hasNext: () => i < list.length, next: () => list[i++] };
  }
});
global.DriveApp = {
  Access: { ANYONE_WITH_LINK: 1 }, Permission: { VIEW: 1 },
  getFolderById: () => mkFolder('root'),
  getFoldersByName: () => ({ hasNext: () => true, next: () => mkFolder('root') }),
  createFolder: n => mkFolder(n),
  getFileById: (id) => store.files.get(id) || ({
    getLastUpdated: () => store.lastUpdated || new Date('2026-08-31T06:00:00Z'),
    getId: () => 'MOCK_SS',
    setTrashed: () => true,
    getBlob: () => Utilities.newBlob(Buffer.from(''), 'image/jpeg', 'mock.jpg')
  })
};
global.Session = {
  getActiveUser: () => ({ getEmail: () => 'owner@example.com' }),
  getEffectiveUser: () => ({ getEmail: () => 'owner@example.com' })
};
global.MailApp = { sendEmail: o => { store.lastMail = o; } };
const chain = () => {
  const o = {};
  ['timeBased','onWeekDay','atHour','everyDays','inTimezone'].forEach(k => { o[k] = () => chain(); });
  o.create = () => {};
  return o;
};
global.ScriptApp = {
  getProjectTriggers: () => [], deleteTrigger: () => {},
  newTrigger: () => chain(),
  WeekDay: { MONDAY: 1 },
  getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/MOCK/exec' }),
  getOAuthToken: () => 'mock-oauth-token'
};
store.fetches = [];
global.UrlFetchApp = {
  fetch: (url, opts) => {
    store.fetches.push({ url, opts });
    // ปลอมการอัปโหลดเพื่อ OCR ของ Drive: ครั้งแรกคืน metadata ครั้งถัดไปคืนข้อความ
    if (String(url).indexOf('upload/drive') >= 0) {
      return {
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify({
          id: 'OCRTMP', exportLinks: { 'text/plain': 'https://mock/export' }
        })
      };
    }
    return { getResponseCode: () => 200, getContentText: () => store.ocrText || '' };
  }
};
const htmlOut = (content) => ({
  getContent: () => content,
  setTitle() { return this; }, setFaviconUrl() { return this; },
  addMetaTag() { return this; }, setXFrameOptionsMode() { return this; }
});
global.HtmlService = {
  // เก็บค่าที่ถูกใส่ลง template ไว้ใน store เพื่อให้เทสต์ตรวจได้ว่า doGet ส่งอะไรไปหน้าเว็บ
  createTemplateFromFile: (name) => {
    const t = { evaluate: () => { store.lastTemplate = Object.assign({ _file: name }, t); return htmlOut('<template>'); } };
    return t;
  },
  createHtmlOutputFromFile: () => htmlOut(''),
  createHtmlOutput: (c) => htmlOut(c),
  XFrameOptionsMode: { ALLOWALL: 1 }
};

module.exports = { store };
