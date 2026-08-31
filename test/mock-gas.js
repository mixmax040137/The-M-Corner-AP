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
  setNumberFormat() { return this; } setDataValidation() { return this; }
  setWrap() { return this; } setFontWeight() { return this; }
  setBackground() { return this; } setFontColor() { return this; }
  setVerticalAlignment() { return this; }
}

class Sheet {
  constructor(name) { this.name = name; this.data = []; }
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
  insertSheet: n => { const s = new Sheet(n); store.sheets.set(n, s); return s; }
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
global.Utilities = {
  formatDate: fmt,
  formatString: (f, ...a) => { let i = 0; return f.replace(/%s/g, () => a[i++]); },
  base64Decode: s => Buffer.from(s, 'base64'),
  newBlob: (b, m, n) => ({ b, m, n })
};
let fileSeq = 0;
const mkFile = name => {
  const id = 'FILE' + (++fileSeq).toString().padStart(20, '0');
  const f = { getId: () => id, getName: () => name, getMimeType: () => 'image/jpeg', setSharing: () => f, setTrashed: () => f };
  store.files.set(id, f); return f;
};
const mkFolder = name => ({
  getId: () => 'FOLDER_' + name, getName: () => name,
  getFoldersByName: n => ({ hasNext: () => true, next: () => mkFolder(n) }),
  createFolder: n => mkFolder(n),
  createFile: blob => mkFile(blob.n)
});
global.DriveApp = {
  Access: { ANYONE_WITH_LINK: 1 }, Permission: { VIEW: 1 },
  getFolderById: () => mkFolder('root'),
  getFoldersByName: () => ({ hasNext: () => true, next: () => mkFolder('root') }),
  createFolder: n => mkFolder(n),
  getFileById: () => mkFile('x')
};
global.Session = {
  getActiveUser: () => ({ getEmail: () => 'owner@example.com' }),
  getEffectiveUser: () => ({ getEmail: () => 'owner@example.com' })
};
global.MailApp = { sendEmail: o => { store.lastMail = o; } };
global.ScriptApp = {
  getProjectTriggers: () => [], deleteTrigger: () => {},
  newTrigger: () => ({ timeBased: () => ({ onWeekDay: () => ({ atHour: () => ({ inTimezone: () => ({ create: () => {} }) }) }) }) }),
  WeekDay: { MONDAY: 1 },
  getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/MOCK/exec' })
};
global.UrlFetchApp = { fetch: () => ({ getResponseCode: () => 200 }) };
global.HtmlService = {
  createTemplateFromFile: () => ({ evaluate: () => ({ setTitle(){return this;}, setFaviconUrl(){return this;}, addMetaTag(){return this;}, setXFrameOptionsMode(){return this;} }) }),
  createHtmlOutputFromFile: () => ({ getContent: () => '' }),
  XFrameOptionsMode: { ALLOWALL: 1 }
};

module.exports = { store };
