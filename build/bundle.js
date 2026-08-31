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

const GS_ORDER = ['Config.gs','Util.gs','Setup.gs','Auth.gs','Drive.gs','Seed.gs','Finance.gs','Migrate.gs',
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
[['Style','ui/Style.html'], ['App','ui/App.html'], ['Views','ui/Views.html'], ['Forms','ui/Forms.html']]
  .forEach(([name, rel]) => {
    const tag = new RegExp(`<\\?!=\\s*include\\('ui/${name}'\\);?\\s*\\?>`);
    if (!tag.test(html)) throw new Error('ไม่พบจุดแทรก ui/' + name + ' ใน Index.html');
    html = html.replace(tag, () => read(path.join(SRC, rel)).trimEnd());
  });
if (/include\(/.test(html)) throw new Error('ยังมี include() ตกค้างใน Index.html');

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
