// ฝังไฟล์ทั้งหมดใน public/ ลงในสคริปต์ Worker (src/assets.gen.js)
// ใช้แทน Workers Static Assets เพื่อให้ deploy ได้ด้วยการอัปโหลดสคริปต์อย่างเดียว
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};
const TEXT = new Set(['.html', '.js', '.mjs', '.css', '.json', '.webmanifest', '.svg', '.txt']);

const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
const assets = {};
let raw = 0, gz = 0;
for (const file of walk(pub)) {
  const rel = '/' + relative(pub, file).split('\\').join('/');
  const ext = extname(file);
  if (!TYPES[ext]) throw new Error('ไม่รู้จักชนิดไฟล์: ' + rel);
  const buf = readFileSync(file);
  const etag = '"' + createHash('sha256').update(buf).digest('hex').slice(0, 16) + '"';
  assets[rel] = TEXT.has(ext) ? [TYPES[ext], 't', buf.toString('utf8'), etag] : [TYPES[ext], 'b', buf.toString('base64'), etag];
  raw += buf.length;
}
const out = '// สร้างอัตโนมัติโดย scripts/embed.mjs — อย่าแก้ไขเอง\nexport default ' + JSON.stringify(assets) + ';\n';
writeFileSync(join(root, 'src/assets.gen.js'), out);
gz = gzipSync(out, { level: 9 }).length;
console.log(`embed: ${Object.keys(assets).length} ไฟล์ · ${(raw / 1048576).toFixed(2)} MB → สคริปต์ ${(gz / 1048576).toFixed(2)} MB (gzip)`);
if (gz > 2.9 * 1048576) throw new Error('สคริปต์ใหญ่เกินแผนฟรีของ Workers (3 MB หลังบีบอัด)');
