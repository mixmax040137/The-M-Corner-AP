// M Hub — Worker ฝั่งเซิร์ฟเวอร์
// เสิร์ฟหน้าเว็บที่ฝังไว้ในสคริปต์ (src/assets.gen.js สร้างจาก public/) งานไฟล์ทุกอย่างทำในเบราว์เซอร์ของผู้ใช้
// ไม่มีการเก็บไฟล์หรือข้อมูลของผู้ใช้บนเซิร์ฟเวอร์
import ASSETS from './assets.gen.js';

const VERSION = '1.1.0';
// ไฟล์ใหญ่ที่ไม่ฝังในสคริปต์: Worker ไปดึงจาก jsDelivr ให้ (เฉพาะไฟล์ในรายการนี้เท่านั้น — ไม่ใช่ proxy เปิด)
const JS = 'text/javascript; charset=utf-8';
const CDN = {
  '/cdn/avif/avif_enc.js': ['@jsquash/avif@2.1.1/codec/enc/avif_enc.js', JS],
  '/cdn/avif/avif_enc.wasm': ['@jsquash/avif@2.1.1/codec/enc/avif_enc.wasm', 'application/wasm'],
  '/cdn/tesseract/worker.min.js': ['tesseract.js@7.0.0/dist/worker.min.js', JS],
  '/cdn/tesseract-core/tesseract-core-relaxedsimd-lstm.wasm.js': ['tesseract.js-core@7.0.0/tesseract-core-relaxedsimd-lstm.wasm.js', JS],
  '/cdn/tesseract-core/tesseract-core-simd-lstm.wasm.js': ['tesseract.js-core@7.0.0/tesseract-core-simd-lstm.wasm.js', JS],
  '/cdn/tesseract-core/tesseract-core-lstm.wasm.js': ['tesseract.js-core@7.0.0/tesseract-core-lstm.wasm.js', JS],
  '/cdn/tessdata/tha.traineddata.gz': ['@tesseract.js-data/tha@1.0.0/4.0.0_best_int/tha.traineddata.gz', 'application/gzip'],
  '/cdn/tessdata/eng.traineddata.gz': ['@tesseract.js-data/eng@1.0.0/4.0.0_best_int/eng.traineddata.gz', 'application/gzip'],
};
const SECURITY = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin' };
const decoded = new Map();

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function serveAsset(req, url) {
  let path;
  try { path = decodeURIComponent(url.pathname); } catch { return new Response('URL ไม่ถูกต้อง', { status: 400 }); }
  if (path.endsWith('/')) path += 'index.html';
  let a = ASSETS[path];
  if (!a && req.method === 'GET' && !/\.[a-z0-9]+$/i.test(path)) { path = '/index.html'; a = ASSETS[path]; }
  if (!a) return new Response('ไม่พบไฟล์', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8', ...SECURITY } });
  const [type, enc, data, etag] = a;
  const headers = {
    'content-type': type,
    etag,
    'cache-control': path.startsWith('/vendor/') || path.startsWith('/icons/') ? 'public, max-age=86400' : 'no-cache',
    ...SECURITY,
  };
  if (req.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
  let body = data;
  if (enc === 'b') {
    if (!decoded.has(path)) decoded.set(path, b64ToBytes(data));
    body = decoded.get(path);
  }
  return new Response(req.method === 'HEAD' ? null : body, { headers });
}

async function serveCdn(path) {
  const [src, type] = CDN[path];
  // แคชที่ขอบเครือข่าย 30 วัน เฉพาะคำตอบที่สำเร็จ (ไม่แคชข้อผิดพลาดชั่วคราวจากต้นทาง)
  const r = await fetch('https://cdn.jsdelivr.net/npm/' + src, { cf: { cacheEverything: true, cacheTtlByStatus: { '200-299': 2592000, '404': 0, '500-599': 0 } } });
  if (!r.ok) return new Response('โหลดไลบรารีไม่สำเร็จ', { status: 502 });
  return new Response(r.body, { headers: { 'content-type': type, 'cache-control': 'public, max-age=2592000, immutable', ...SECURITY } });
}
const MAX_TRANSLATE_CHARS = 4000;
const LANGS = { th: 'thai', en: 'english' };

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

// กันเว็บอื่นมาเรียกใช้โควตา AI ฟรีของบัญชี: รับเฉพาะคำขอจากหน้าเว็บของ M Hub เอง
function sameOrigin(req, url) {
  const origin = req.headers.get('origin');
  return !origin || origin === url.origin;
}

async function translate(req, env) {
  if (!env.AI) return json({ error: 'ยังไม่ได้เปิดใช้ Workers AI' }, 501);
  let body;
  try { body = await req.json(); } catch { return json({ error: 'ข้อมูลไม่ถูกต้อง' }, 400); }
  const texts = Array.isArray(body.texts) ? body.texts : [body.text];
  const source = LANGS[body.from || 'th'];
  const target = LANGS[body.to || 'en'];
  if (!source || !target) return json({ error: 'รองรับเฉพาะ th / en' }, 400);
  const clean = texts.map((t) => String(t ?? '').trim());
  const total = clean.reduce((n, t) => n + t.length, 0);
  if (!total) return json({ error: 'ไม่มีข้อความให้แปล' }, 400);
  if (total > MAX_TRANSLATE_CHARS || clean.length > 20) return json({ error: `ข้อความยาวเกิน ${MAX_TRANSLATE_CHARS} ตัวอักษร` }, 413);
  try {
    const out = [];
    for (const text of clean) {
      if (!text) { out.push(''); continue; }
      const r = await env.AI.run('@cf/meta/m2m100-1.2b', { text, source_lang: source, target_lang: target });
      out.push(r.translated_text || '');
    }
    return json({ ok: true, texts: out, text: out[0] });
  } catch (e) {
    return json({ error: 'แปลไม่สำเร็จ: ' + (e && e.message ? e.message : e) }, 502);
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/health') return json({ ok: true, app: 'm-hub', version: VERSION, ai: !!env.AI });
    if (url.pathname === '/api/translate') {
      if (req.method !== 'POST') return json({ error: 'ใช้ POST' }, 405);
      if (!sameOrigin(req, url)) return json({ error: 'ไม่อนุญาต' }, 403);
      return translate(req, env);
    }
    if (url.pathname.startsWith('/api/')) return json({ error: 'ไม่พบ' }, 404);
    if (CDN[url.pathname]) return serveCdn(url.pathname);
    if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('ไม่อนุญาต', { status: 405 });
    return serveAsset(req, url);
  },
};
