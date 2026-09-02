/**
 * bundle.js — รวมซอร์สใน src/ ให้เหลือ 2 ไฟล์ สำหรับวางลง Apps Script
 *
 *   build/Code.gs     ← โค้ดฝั่งเซิร์ฟเวอร์ทั้งหมด
 *   build/Index.html  ← หน้าเว็บทั้งหมด (CSS + JS รวมในไฟล์เดียว)
 *
 * แก้โค้ดที่ src/ เสมอ แล้วรัน `node build/bundle.js` ใหม่ อย่าแก้ที่ build/
 */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');

const GS_ORDER = ['Config.gs','Util.gs','Setup.gs','Users.gs','Auth.gs','Settings.gs','Drive.gs','Ocr.gs',
                  'Seed.gs','Finance.gs','Migrate.gs',
                  'Backup.gs','Debt.gs','Purchase.gs','Maintenance.gs','Building.gs',
                  'Dashboard.gs','Api.gs','Notify.gs','Web.gs'];

const read = p => fs.readFileSync(p, 'utf8');
const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

/* ---------- Code.gs ---------- */
let code = `/**
 * The M Corner AP — ระบบบริหารหอพัก
 * ไฟล์นี้สร้างอัตโนมัติจากโฟลเดอร์ src/ เมื่อ ${stamp} UTC
 *
 * ⚠️ อย่าแก้ไฟล์นี้โดยตรง — แก้ที่ src/ แล้วรัน  node build/bundle.js
 *
 * ประกอบด้วย: ${GS_ORDER.join(', ')}
 */

`;
GS_ORDER.forEach(f => {
  let src = read(path.join(SRC, f));
  if (f === 'Web.gs') src = src.replace(/createTemplateFromFile\('ui\/Index'\)/g, "createTemplateFromFile('Index')");
  code += `\n/* ══════════════════════════════════════════════════════════════\n   ${f}\n   ══════════════════════════════════════════════════════════════ */\n\n${src}\n`;
});

/* ---------- Index.html ---------- */
let html = read(path.join(SRC, 'ui', 'Index.html'));
[['Style','ui/Style.html'], ['App','ui/App.html'], ['Auth','ui/Auth.html'],
 ['Views','ui/Views.html'], ['Settings','ui/Settings.html'], ['Forms','ui/Forms.html']]
  .forEach(([name, rel]) => {
    const tag = new RegExp(`<\\?!=\\s*include\\('ui/${name}'\\);?\\s*\\?>`);
    if (!tag.test(html)) throw new Error('ไม่พบจุดแทรก ui/' + name + ' ใน Index.html');
    html = html.replace(tag, () => read(path.join(SRC, rel)).trimEnd());
  });
if (/include\(/.test(html)) throw new Error('ยังมี include() ตกค้างใน Index.html');

/* ---------- กันชื่อฟังก์ชันซ้ำข้ามไฟล์ ----------
   ไฟล์ ui/*.html ทุกไฟล์อยู่ใน global scope เดียวกัน
   ถ้าประกาศชื่อซ้ำ ตัวที่โหลดทีหลังจะทับตัวแรกเงียบ ๆ โดยไม่มี error
   เคยเกิดขึ้นจริง: attr() ใน Settings.html ไปทับของ Views.html
   จนปุ่มแก้ไขทั้งระบบเปิดฟอร์มเปล่าและกดบันทึกกลายเป็นสร้างรายการใหม่
----------------------------------------------------- */
{
  const seen = {}, dup = [];
  ['App', 'Auth', 'Views', 'Settings', 'Forms'].forEach(name => {
    const src = read(path.join(SRC, 'ui', name + '.html'));
    const re = /^function\s+([A-Za-z_$][\w$]*)\s*\(/gm;
    let m;
    while ((m = re.exec(src)) !== null) {
      if (seen[m[1]]) dup.push(m[1] + ' — ประกาศทั้งใน ' + seen[m[1]] + ' และ ' + name);
      else seen[m[1]] = name;
    }
  });
  if (dup.length) {
    throw new Error('ชื่อฟังก์ชันซ้ำข้ามไฟล์ ui/ (ตัวหลังจะทับตัวแรกเงียบ ๆ):\n  ' + dup.join('\n  '));
  }
}

/* ---------- กันชื่อฟังก์ชันซ้ำข้ามไฟล์ .gs ----------
   ไฟล์ .gs ทุกไฟล์อยู่ใน global scope เดียวกันเหมือนกัน และลำดับโหลด
   ในโปรเจกต์ Apps Script จริงไม่เหมือนลำดับที่เรารวมไฟล์ที่นี่
   ตัวไหนทับตัวไหนจึงเดาไม่ได้ ต้องไม่ให้มีชื่อซ้ำตั้งแต่แรก
   เคยเกิดขึ้นจริง: currentUserEmail_() มีสองตัวที่คืนค่าต่างกัน
   ตัวหนึ่งคืน '' อีกตัวคืน 'unknown' ซึ่งตัวหลังถูกเอาไปเทียบกับ
   อีเมลเจ้าของชีตในการตรวจสิทธิ์
--------------------------------------------------- */
{
  const seen = {}, dup = [];
  GS_ORDER.forEach(name => {
    const re = /^function\s+([A-Za-z_$][\w$]*)\s*\(/gm;
    let m;
    while ((m = re.exec(read(path.join(SRC, name)))) !== null) {
      if (seen[m[1]]) dup.push(m[1] + ' — ประกาศทั้งใน ' + seen[m[1]] + ' และ ' + name);
      else seen[m[1]] = name;
    }
  });
  if (dup.length) {
    throw new Error('ชื่อฟังก์ชันซ้ำข้ามไฟล์ .gs (ตัวหลังจะทับตัวแรกเงียบ ๆ):\n  ' + dup.join('\n  '));
  }
}

/* ---------- กันชื่อตัวเลือกที่ไม่มีอยู่จริง ----------
   opt('ชื่อ') อ่านจาก app.bootstrap ถ้าพิมพ์ชื่อผิดจะได้ [] เงียบ ๆ
   ช่อง select ก็จะว่างเปล่าโดยไม่มี error ให้เห็น
   เคยเกิดขึ้นจริง: opt('rooms') — รายชื่อห้องอยู่นอก schema จึงได้ค่าว่าง
---------------------------------------------------- */
{
  const api = read(path.join(SRC, 'Api.gs'));
  const block = api.slice(api.indexOf('schema: {'), api.indexOf('settings: {'));
  const keys = new Set([...block.matchAll(/^\s*(\w+):/gm)].map(m => m[1]));
  const all = ['App', 'Auth', 'Views', 'Settings', 'Forms']
    .map(n => read(path.join(SRC, 'ui', n + '.html'))).join('\n');
  const bad = [...new Set([...all.matchAll(/opt\('([^']+)'\)/g)].map(m => m[1]))]
    .filter(k => !keys.has(k));
  if (bad.length) {
    throw new Error('opt() เรียกชื่อตัวเลือกที่ app.bootstrap ไม่ได้ส่งมา: ' + bad.join(', '));
  }
}

/* ---------- กันฟังก์ชันที่ถูกเรียกแต่ไม่มีตัวจริง ----------
   จับกรณีลบฟังก์ชันทิ้งแล้วลืมแก้ที่เรียก — ตรวจเฉพาะชื่อที่ขึ้นต้นด้วย form/del
   ซึ่งเป็นปุ่มที่ผู้ใช้กดจริงในตาราง
----------------------------------------------------------- */
{
  const all = ['App', 'Auth', 'Views', 'Settings', 'Forms']
    .map(n => read(path.join(SRC, 'ui', n + '.html'))).join('\n');
  const declared = new Set();
  let m;
  const dre = /^function\s+([A-Za-z_$][\w$]*)\s*\(/gm;
  while ((m = dre.exec(all)) !== null) declared.add(m[1]);
  const missing = new Set();
  const cre = /\b((?:form|del)[A-Z][\w$]*)\s*\(/g;
  while ((m = cre.exec(all)) !== null) if (!declared.has(m[1])) missing.add(m[1]);
  if (missing.size) {
    throw new Error('มีปุ่มเรียกฟังก์ชันที่ไม่มีอยู่จริง: ' + [...missing].join(', '));
  }
}

fs.mkdirSync(path.join(ROOT, 'build'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'build', 'Code.gs'), code);
fs.writeFileSync(path.join(ROOT, 'build', 'Index.html'), html);

/* ---------- AllInOne.gs — ไฟล์เดียวจบ ---------- */
// ฝัง Index.html เป็น base64 เพื่อเลี่ยงปัญหาการ escape ทุกชนิด
// (ถ้าเก็บเป็นสตริงธรรมดา ต้อง escape ทั้ง backslash, backtick และ ${ ซึ่งเสี่ยงพลาด)
const b64 = Buffer.from(html, 'utf8').toString('base64');
const chunks = (b64.match(/.{1,200}/g) || []).map(c => "  '" + c + "'").join(',\n');

const allInOne = code
  .replace("createTemplateFromFile('Index')", 'createTemplate(indexHtml_())')
  .replace('/**\n * The M Corner AP — ระบบบริหารหอพัก',
           '/**\n * The M Corner AP — ระบบบริหารหอพัก (ไฟล์เดียวจบ)')
  + `

/* ══════════════════════════════════════════════════════════════
   หน้าเว็บทั้งหมด (Index.html) ฝังไว้เป็น base64
   แก้ที่ src/ui/ แล้วรัน  node build/bundle.js  เพื่อสร้างใหม่
   ══════════════════════════════════════════════════════════════ */

var INDEX_HTML_B64 = [
${chunks}
].join('');

function indexHtml_() {
  return Utilities.newBlob(Utilities.base64Decode(INDEX_HTML_B64), 'text/html')
    .getDataAsString('UTF-8');
}
`;

fs.writeFileSync(path.join(ROOT, 'build', 'AllInOne.gs'), allInOne);

if (allInOne.indexOf('createTemplate(indexHtml_())') < 0) {
  throw new Error('AllInOne.gs ไม่ได้สลับไปใช้ HTML ที่ฝังไว้');
}
if (Buffer.from(b64, 'base64').toString('utf8') !== html) {
  throw new Error('base64 ของ Index.html ถอดกลับไม่ตรงต้นฉบับ');
}

const kb = s => (s.length / 1024).toFixed(0) + ' KB';
console.log('build/AllInOne.gs  ' + kb(allInOne) + '  (' + allInOne.split('\n').length + ' บรรทัด)  ← วางไฟล์เดียวจบ');
console.log('build/Code.gs      ' + kb(code) + '  (' + code.split('\n').length + ' บรรทัด)   ┐ ทางเลือก');
console.log('build/Index.html   ' + kb(html) + '  (' + html.split('\n').length + ' บรรทัด)   ┘ แบบ 2 ไฟล์');
