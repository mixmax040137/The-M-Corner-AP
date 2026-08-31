/**
 * build.js — ประกอบไฟล์เดียวจบสำหรับ Artifact
 *
 * เอกสารที่ได้จะ "สร้างตัวเองซ้ำได้" คือเก็บแม่แบบของตัวเองไว้ข้างใน
 * เวลาผู้ใช้บันทึกข้อมูล หน้าเว็บจะประกอบเอกสารใหม่จากแม่แบบ + ข้อมูลล่าสุด
 * แล้วเผยแพร่ทับตัวเองผ่าน capability "artifact"
 */
require('../test/mock-gas.js');
const fs = require('fs'), path = require('path'), vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');

const GS = ['Config.gs','Util.gs','Setup.gs','Auth.gs','Drive.gs','Seed.gs','Finance.gs','Backup.gs','Migrate.gs',
            'Debt.gs','Purchase.gs','Maintenance.gs','Building.gs','Dashboard.gs','Api.gs','Notify.gs'];

/* ---- 1. เตรียมข้อมูลตั้งต้นด้วย runtime จำลอง ---- */
GS.concat(['Web.gs']).forEach(f =>
  vm.runInThisContext(fs.readFileSync(path.join(SRC, f), 'utf8'), { filename: f }));
setupSystem();
seedHistoricalData();
const SEED = exportAll_().sheets;

/* ---- 2. รวมโค้ด ---- */
const read = p => fs.readFileSync(p, 'utf8');
const stripScript = s => s.replace(/^\s*<script>/, '').replace(/<\/script>\s*$/, '');

// โค้ดฝั่งตรรกะ: ตัด Notify ที่ใช้ MailApp ออก เหลือเฉพาะตัวช่วยที่ Api เรียก
const serverJs = GS
  .filter(f => f !== 'Notify.gs')
  .map(f => '\n/* ===== ' + f + ' ===== */\n' + read(path.join(SRC, f)))
  .join('\n');

const uiJs = ['App.html','Views.html','Forms.html']
  .map(f => '\n/* ===== ui/' + f + ' ===== */\n' + stripScript(read(path.join(SRC, 'ui', f))))
  .join('\n');

const runtimeJs = read(path.join(__dirname, 'runtime.js'));
const css = read(path.join(SRC, 'ui', 'Style.html'));

/* ---- 3. เนื้อหาหน้า (ใช้ทั้งตอนเผยแพร่ครั้งแรกและตอนสร้างตัวเองใหม่) ---- */
const CONTENT = `<title>The M Corner AP</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@500;600;700&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet">
${css}
<style>img{max-width:100%}[hidden]{display:none!important}</style>

<div class="app">
  <aside class="nav" id="nav">
    <div class="brand"><b>🏢 The M Corner AP</b><span>ระบบบริหารหอพัก</span></div>
    <div class="nav-list" id="navList"></div>
    <div class="nav-foot" id="navFoot"></div>
  </aside>
  <div class="main">
    <header class="top">
      <button class="burger" onclick="toggleNav()">☰</button>
      <div><h1 id="pageTitle">ภาพรวม</h1><div class="sub" id="pageSub"></div></div>
      <div class="top-right">
        <span id="saveState"></span>
        <input class="inp w-auto" id="searchBox" placeholder="🔎 ค้นหา…" style="width:150px"
               oninput="onSearch(this.value)" autocomplete="off">
        <select class="sel w-auto" id="yearSel" onchange="setYear(this.value)"></select>
        <button class="btn icon" title="รีเฟรช" onclick="refresh()">↻</button>
      </div>
    </header>
    <main class="content" id="view">
      <div class="empty"><div class="big"><span class="spin"></span></div>กำลังเปิดระบบ…</div>
    </main>
  </div>
</div>
<div id="modalRoot"></div><div id="toastRoot"></div>

<script id="tpl" type="text/plain">{{TEMPLATE}}<\/script>
<script>window.__SEED__ = {{DATA}};<\/script>
<script>${serverJs}<\/script>
<script>${uiJs}<\/script>
<script>${runtimeJs}<\/script>`;

/* ---- 4. เอกสารเต็มฉบับ (ที่หน้าเว็บจะใช้เผยแพร่ทับตัวเอง) ---- */
const FULLDOC = `<!doctype html>
<html lang="th"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
</head><body>
${CONTENT}
</body></html>`;

/* ---- 5. แทนค่า ---- */
const B64 = Buffer.from(FULLDOC, 'utf8').toString('base64');
const dataJson = JSON.stringify(SEED).replace(/</g, '\\u003c');
const PH_TPL = '{' + '{TEMPLATE}' + '}';
const PH_DATA = '{' + '{DATA}' + '}';

const fill = (tpl) => tpl
  .replace(PH_TPL, () => B64)
  .replace(PH_DATA, () => dataJson);

// ไฟล์ที่ส่งให้เครื่องมือ Artifact = เนื้อหาล้วน (ระบบจะห่อ doctype/head/body ให้เอง)
const outFile = fill(CONTENT);
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist', 'the-m-corner-ap.html'), outFile);

/* ---- 6. ตรวจความถูกต้องของการสร้างตัวเองซ้ำ ---- */
const embedded = Buffer.from(B64, 'base64').toString('utf8');
const ok = embedded === FULLDOC && !/<\/script/i.test(B64);
const counts = Object.keys(SEED).map(k => k + '=' + SEED[k].length).join(' ');

console.log('dist/the-m-corner-ap.html');
console.log('  ขนาด        : ' + (outFile.length / 1048576).toFixed(2) + ' MB');
console.log('  ข้อมูลตั้งต้น : ' + counts);
const nT = CONTENT.split(PH_TPL).length - 1, nD = CONTENT.split(PH_DATA).length - 1;
console.log('  placeholder  : TEMPLATE x' + nT + ', DATA x' + nD + (nT === 1 && nD === 1 ? ' ✓' : ' ✗ ต้องมีอย่างละ 1'));
console.log('  สร้างตัวเองซ้ำได้ : ' + (ok ? 'ใช่ ✓' : 'ไม่ ✗'));
if (!ok || nT !== 1 || nD !== 1) process.exit(1);
