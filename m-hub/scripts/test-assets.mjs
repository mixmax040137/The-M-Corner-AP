// ดึงไฟล์โมเดล AI / TensorFlow.js สำหรับเทสต์ในเครื่อง (เว็บจริงให้ Worker ดึงจาก jsDelivr ที่ /cdn/)
// เก็บเฉพาะไฟล์ที่ใช้ไว้ใน test/cache/ (ไม่เข้า git) — ไม่ต้องติดตั้งแพ็กเกจขนาดใหญ่ใน node_modules
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cache = join(root, 'test', 'cache');
// [แพ็กเกจ@เวอร์ชัน, ไฟล์ในแพ็กเกจ] — ต้องตรงกับรายการ CDN ใน src/worker.js
export const ASSETS = [
  ['@tensorflow/tfjs@4.22.0', ['dist/tf.min.js']],
  ['@vladmandic/human-models@3.0.4', ['models/rvm.json', 'models/rvm.bin']],
  ['@upscalerjs/esrgan-slim@1.0.0', ['models/x2/model.json', 'models/x2/group1-shard1of1.bin', 'models/x4/model.json', 'models/x4/group1-shard1of1.bin']],
];

mkdirSync(cache, { recursive: true });
for (const [spec, files] of ASSETS) {
  const dir = join(cache, spec.replace(/[/@]/g, '_'));
  if (files.every((f) => existsSync(join(dir, f)))) continue;
  console.log('ดาวน์โหลด', spec, '…');
  const tgz = execFileSync('npm', ['pack', spec, '--pack-destination', cache, '--silent'], { encoding: 'utf8' }).trim().split('\n').pop();
  mkdirSync(dir, { recursive: true });
  execFileSync('tar', ['xzf', join(cache, tgz), '-C', dir, '--strip-components=1', ...files.map((f) => 'package/' + f)]);
  rmSync(join(cache, tgz));
}
for (const f of readdirSync(cache)) if (f.endsWith('.tgz')) rmSync(join(cache, f));
console.log('test-assets: ok');
