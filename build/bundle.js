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

const GS_ORDER = ['Config.gs','Util.gs','Setup.gs','Auth.gs','Drive.gs','Seed.gs','Finance.gs',
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

const kb = s => (s.length / 1024).toFixed(0) + ' KB';
console.log('build/Code.gs     ' + kb(code) + '  (' + code.split('\n').length + ' บรรทัด)');
console.log('build/Index.html  ' + kb(html) + '  (' + html.split('\n').length + ' บรรทัด)');
