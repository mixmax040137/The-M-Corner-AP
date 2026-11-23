/**
 * build.js — ประกอบระบบฝั่ง Cloudflare จากซอร์สชุดเดียวกับ Apps Script
 *
 *   cloudflare/dist/app.mjs     createApp(HOST) = prelude.js + src/*.gs (ลำดับเดียวกับ build/bundle.js) + overrides.js
 *   cloudflare/dist/assets.mjs  หน้าเว็บ (src/ui ที่รวมแล้ว) · หน้า /setup · ไฟล์ PWA
 *
 * รัน: node cloudflare/build.js   (แก้ที่ src/ หรือ cloudflare/ แล้วรันใหม่ทุกครั้ง)
 */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(__dirname, 'dist');
const read = p => fs.readFileSync(p, 'utf8');

// ลำดับเดียวกับ build/bundle.js (อ่านจากไฟล์นั้นตรง ๆ จะได้ไม่ลืมแก้สองที่)
const bundleSrc = read(path.join(ROOT, 'build', 'bundle.js'));
const GS_ORDER = eval(bundleSrc.match(/const GS_ORDER = (\[[\s\S]*?\]);/)[1]);

/* ---------- app.mjs ---------- */
const indent = s => s.replace(/^(?=.)/gm, '  ');
let body = '\n/* ===== prelude.js ===== */\n' + read(path.join(__dirname, 'prelude.js'));
GS_ORDER.forEach(f => { body += '\n/* ===== ' + f + ' ===== */\n' + read(path.join(SRC, f)); });
body += '\n/* ===== overrides.js ===== */\n' + read(path.join(__dirname, 'overrides.js'));

const app = `/* สร้างอัตโนมัติโดย cloudflare/build.js — อย่าแก้ไฟล์นี้ */
export function createApp(HOST) {
${indent(body)}
}
`;

/* ---------- หน้าเว็บหลัก: รวม src/ui แบบเดียวกับ build/bundle.js ---------- */
let html = read(path.join(SRC, 'ui', 'Index.html'));
['Style', 'App', 'Auth', 'Views', 'Settings', 'Forms'].forEach(name => {
  const tag = new RegExp(`<\\?!=\\s*include\\('ui/${name}'\\);?\\s*\\?>`);
  if (!tag.test(html)) throw new Error('ไม่พบจุดแทรก ui/' + name);
  html = html.replace(tag, () => read(path.join(SRC, 'ui', name + '.html')).trimEnd());
});
if (/include\(/.test(html)) throw new Error('ยังมี include() ตกค้าง');
const left = (html.match(/<\?[\s\S]*?\?>/g) || []).filter(t => !/^<\?!?=\s*\w+\s*\?>$/.test(t));
if (left.length) throw new Error('มีแท็ก template ที่ฝั่ง Cloudflare ไม่รองรับ: ' + left.join(', '));

// PWA: ไอคอน + manifest + service worker
const head = [
  '<link rel="manifest" href="/manifest.webmanifest">',
  '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
  '<meta name="theme-color" content="#1f2a44">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-title" content="M Corner">'
].join('\n  ');
if (html.indexOf('</head>') < 0 || html.lastIndexOf('</body>') < 0) throw new Error('Index.html ไม่มี </head> หรือ </body>');
html = html.replace('</head>', '  ' + head + '\n</head>');
const swReg = "<script>if('serviceWorker' in navigator){addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}</script>\n";
const at = html.lastIndexOf('</body>');
html = html.slice(0, at) + swReg + html.slice(at);

/* ---------- assets.mjs ---------- */
const WEB = path.join(__dirname, 'web');
const b64 = f => fs.readFileSync(path.join(WEB, f)).toString('base64');
const files = {
  '/manifest.webmanifest': { type: 'application/manifest+json', cache: 'public, max-age=3600', text: read(path.join(WEB, 'manifest.webmanifest')) },
  '/sw.js': { type: 'text/javascript; charset=utf-8', cache: 'no-cache', text: read(path.join(WEB, 'sw.js')) },
  '/favicon.svg': { type: 'image/svg+xml', cache: 'public, max-age=86400', text: read(path.join(WEB, 'icon.svg')) },
  '/icon-192.png': { type: 'image/png', cache: 'public, max-age=86400', b64: b64('icon-192.png') },
  '/icon-512.png': { type: 'image/png', cache: 'public, max-age=86400', b64: b64('icon-512.png') },
  '/apple-touch-icon.png': { type: 'image/png', cache: 'public, max-age=86400', b64: b64('apple-touch-icon.png') }
};
let assets = '/* สร้างอัตโนมัติโดย cloudflare/build.js — อย่าแก้ไฟล์นี้ */\n';
assets += 'const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));\n';
assets += 'export const ASSETS = {\n';
assets += '  index: ' + JSON.stringify(html) + ',\n';
assets += '  setup: ' + JSON.stringify(read(path.join(WEB, 'setup.html'))) + ',\n';
assets += '  files: {\n';
Object.keys(files).forEach(p => {
  const f = files[p];
  assets += '    ' + JSON.stringify(p) + ': { type: ' + JSON.stringify(f.type) + ', cache: ' + JSON.stringify(f.cache) +
    ', body: ' + (f.b64 ? 'b64(' + JSON.stringify(f.b64) + ')' : JSON.stringify(f.text)) + ' },\n';
});
assets += '  }\n};\n';

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'app.mjs'), app);
fs.writeFileSync(path.join(OUT, 'assets.mjs'), assets);
const kb = s => (Buffer.byteLength(s) / 1024).toFixed(0) + ' KB';
console.log('cloudflare/dist/app.mjs     ' + kb(app));
console.log('cloudflare/dist/assets.mjs  ' + kb(assets));
