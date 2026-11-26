// M Hub — Worker ฝั่งเซิร์ฟเวอร์
// เสิร์ฟหน้าเว็บที่ฝังไว้ในสคริปต์ (src/assets.gen.js สร้างจาก public/) งานไฟล์ทุกอย่างทำในเบราว์เซอร์ของผู้ใช้
// ไม่มีการเก็บไฟล์หรือข้อมูลของผู้ใช้บนเซิร์ฟเวอร์
import ASSETS from './assets.gen.js';

const VERSION = '1.6.0';
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
// โมเดล AI / TensorFlow.js: อนุญาตตามโฟลเดอร์ + รูปแบบชื่อไฟล์ (ต้องตรงกับ scripts/test-assets.mjs)
const CDN_PREFIX = {
  '/cdn/tfjs/': ['@tensorflow/tfjs@4.22.0/dist/', /^tf\.min\.js$/],
  // แพ็กเกจ npm ของโมเดลนี้ใหญ่เกินที่ jsDelivr ให้บริการ (>150 MB) จึงดึงจาก GitHub ที่ commit ตายตัว (ไฟล์เดียวกับ npm 3.0.4)
  '/cdn/m/rvm/': ['https://cdn.jsdelivr.net/gh/vladmandic/human-models@bc66dc53bac03c96d35a7e6daaf717e72f3985f5/models/', /^rvm\.(json|bin)$/],
  '/cdn/m/esrgan/': ['@upscalerjs/esrgan-slim@1.0.0/models/', /^x[24]\/(model\.json|group1-shard1of1\.bin)$/],
};
const TYPE_BY_EXT = { js: JS, json: 'application/json', bin: 'application/octet-stream', wasm: 'application/wasm', gz: 'application/gzip' };
function cdnEntry(path) {
  if (CDN[path]) return CDN[path];
  for (const [pre, [base, allow]] of Object.entries(CDN_PREFIX)) {
    if (!path.startsWith(pre)) continue;
    const rest = path.slice(pre.length);
    if (allow.test(rest)) return [base + rest, TYPE_BY_EXT[rest.split('.').pop()] || 'application/octet-stream'];
  }
  return null;
}

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
  const [src, type] = cdnEntry(path);
  // แคชที่ขอบเครือข่าย 30 วัน เฉพาะคำตอบที่สำเร็จ (ไม่แคชข้อผิดพลาดชั่วคราวจากต้นทาง)
  const r = await fetch(src.startsWith('https://') ? src : 'https://cdn.jsdelivr.net/npm/' + src, { cf: { cacheEverything: true, cacheTtlByStatus: { '200-299': 2592000, '404': 0, '500-599': 0 } } });
  if (!r.ok) return new Response('โหลดไลบรารีไม่สำเร็จ', { status: 502 });
  return new Response(r.body, { headers: { 'content-type': type, 'cache-control': 'public, max-age=2592000, immutable', ...SECURITY } });
}
const MAX_TRANSLATE_CHARS = 4000;
const LANGS = { th: 'thai', en: 'english' };
// โควตาฟรีของ Workers AI (10,000 neurons/วัน) รีเซ็ตเวลา 00:00 UTC = 07:00 น. เวลาไทย
const QUOTA_MSG = 'โควตา AI ฟรีของวันนี้หมดแล้ว (รีเซ็ตทุกวันเวลา 07:00 น.) — เครื่องมือที่ไม่ใช้ AI ยังใช้ได้ตามปกติ';
const isQuota = (msg) => /4006|daily free allocation|neurons/i.test(msg);

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
    const msg = String(e && e.message ? e.message : e);
    return json({ error: isQuota(msg) ? QUOTA_MSG : 'แปลไม่สำเร็จ: ' + msg, quota: isQuota(msg) || undefined }, isQuota(msg) ? 429 : 502);
  }
}

// ---------- สร้าง/แก้ภาพด้วย Workers AI (ใช้โควตาฟรีของบัญชี) ----------
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const b64bytes = (s) => b64ToBytes(String(s || '').replace(/^data:[^,]+,/, ''));

const dim = (v, d) => Math.max(256, Math.min(1024, Math.round((+v || d) / 16) * 16));

// FLUX.2 [klein] 4B: สร้างภาพจากคำบรรยาย หรือแก้ภาพเดิมตามคำสั่ง (ส่งภาพแบบ multipart)
async function imageAI(req, env, kind) {
  if (!env.AI) return json({ error: 'ยังไม่ได้เปิดใช้ Workers AI' }, 501);
  let body;
  try { body = await req.json(); } catch { return json({ error: 'ข้อมูลไม่ถูกต้อง' }, 400); }
  const prompt = String(body.prompt || '').trim().slice(0, 1500);
  if (!prompt) return json({ error: 'ใส่คำอธิบายสิ่งที่ต้องการ' }, 400);
  const form = new FormData();
  form.append('prompt', prompt);
  if (kind === 'edit') {
    const image = b64bytes(body.image);
    if (!image.length) return json({ error: 'ไม่มีภาพที่จะแก้' }, 400);
    if (image.length > MAX_IMAGE_BYTES) return json({ error: 'ภาพใหญ่เกินไป' }, 413);
    const type = (String(body.image).match(/^data:([^;,]+)/) || [])[1] || 'image/jpeg';
    form.append('input_image_0', new Blob([image], { type }), 'input.' + (type.includes('png') ? 'png' : 'jpg'));
  }
  form.append('width', String(dim(body.width, 1024)));
  form.append('height', String(dim(body.height, 1024)));
  const fr = new Request('http://form', { method: 'POST', body: form });
  try {
    const r = await env.AI.run('@cf/black-forest-labs/flux-2-klein-4b', { multipart: { body: fr.body, contentType: fr.headers.get('content-type') } });
    if (!r || !r.image) return json({ error: 'AI ไม่ได้ส่งภาพกลับมา' }, 502);
    return json({ ok: true, image: 'data:image/jpeg;base64,' + r.image });
  } catch (e) {
    const msg = String(e && e.message ? e.message : e);
    return json({ error: isQuota(msg) ? QUOTA_MSG : 'AI แก้ภาพไม่สำเร็จ: ' + msg, quota: isQuota(msg) || undefined }, isQuota(msg) ? 429 : 502);
  }
}

// ---------- ตรวจลิงก์ (สำหรับตัวตรวจก่อนโพสต์ของ L'Arts PR Writer) ----------
// ตรวจจากฝั่งเซิร์ฟเวอร์จึงไม่ติด CORS · รับเฉพาะคำขอจากหน้าเว็บของ M Hub · ไม่ส่งเนื้อหาหน้าเว็บกลับ
const MAX_LINKS = 10;
const PRIVATE_HOST = /^(localhost|.*\.local|.*\.internal|.*\.localhost|0\.0\.0\.0|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+|\[.*\])$/i;
const UA = 'Mozilla/5.0 (compatible; MHubLinkCheck/1.0; +https://m-hub.mcorner-ap.workers.dev)';

async function checkOne(raw) {
  let u;
  try { u = new URL(String(raw)); } catch { return { url: raw, invalid: true }; }
  if (!/^https?:$/.test(u.protocol)) return { url: raw, invalid: true };
  if ((u.port && u.port !== '80' && u.port !== '443') || PRIVATE_HOST.test(u.hostname)) return { url: raw, blocked: true };
  const isForm = /(^|\.)forms\.gle$/i.test(u.hostname) || (/(^|\.)docs\.google\.com$/i.test(u.hostname) && u.pathname.includes('/forms/'));
  const go = (method) => fetch(u.toString(), { method, redirect: 'follow', headers: { 'user-agent': UA, accept: 'text/html,*/*' }, signal: AbortSignal.timeout(8000) });
  try {
    let r = isForm ? null : await go('HEAD');
    if (!r || [400, 403, 405, 406, 501].includes(r.status) || r.status >= 500) r = await go('GET');
    let note;
    if (isForm && r.ok && /text\/html/.test(r.headers.get('content-type') || '')) {
      const html = (await r.text()).slice(0, 400000);
      if (/closedform|no longer accepting responses|ไม่รับคำตอบแล้ว|ไม่รับการตอบกลับ/i.test(html)) note = 'form-closed';
    } else if (r.body) {
      try { await r.body.cancel(); } catch { /* ignore */ }
    }
    return { url: raw, status: r.status, finalUrl: r.url && r.url !== u.toString() ? r.url : undefined, note };
  } catch (e) {
    return { url: raw, error: e && e.name === 'TimeoutError' ? 'timeout' : 'network' };
  }
}

async function linkCheck(req) {
  let body;
  try { body = await req.json(); } catch { return json({ error: 'ข้อมูลไม่ถูกต้อง' }, 400); }
  const urls = [...new Set((Array.isArray(body.urls) ? body.urls : []).map((x) => String(x).trim()).filter(Boolean))].slice(0, MAX_LINKS);
  if (!urls.length) return json({ error: 'ไม่มีลิงก์' }, 400);
  return json({ ok: true, results: await Promise.all(urls.map(checkOne)) });
}

// ---------- AI เขียนข้อความฟรี (Workers AI) สำหรับ L'Arts PR Writer ----------
// ใช้โควตาฟรีของบัญชีเดียวกับการแปลและ AI รูปภาพ · ลองรุ่นถัดไปให้อัตโนมัติถ้ารุ่นแรกใช้ไม่ได้ (ยกเว้นโควตาหมด)
const TEXT_MODELS = ['@cf/deepseek-ai/deepseek-v4-flash-0731', '@cf/moonshotai/kimi-k2.6', '@cf/meta/llama-3.3-70b-instruct-fp8-fast'];
const NO_REASONING = { '@cf/deepseek-ai/deepseek-v4-flash-0731': { reasoning_effort: 'none' }, '@cf/moonshotai/kimi-k2.6': { reasoning_effort: 'none' } };
const MAX_AI_CHARS = 16000;

function textOf(r) {
  if (!r) return '';
  if (typeof r === 'string') return r;
  if (typeof r.response === 'string') return r.response;
  if (r.response && typeof r.response === 'object') return JSON.stringify(r.response);
  const c = r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.map((x) => x.text || '').join('');
  if (typeof r.output_text === 'string') return r.output_text;
  return '';
}

async function aiChat(req, env) {
  if (!env.AI) return json({ error: 'ยังไม่ได้เปิดใช้ Workers AI' }, 501);
  let body;
  try { body = await req.json(); } catch { return json({ error: 'ข้อมูลไม่ถูกต้อง' }, 400); }
  const system = String(body.system || '').slice(0, 6000);
  const user = String(body.user || '');
  if (!user.trim()) return json({ error: 'ไม่มีข้อความ' }, 400);
  if (user.length + system.length > MAX_AI_CHARS) return json({ error: 'ข้อความยาวเกินไปสำหรับ AI ฟรี' }, 413);
  const maxTokens = Math.max(200, Math.min(4000, +body.max_tokens || 2500));
  const schema = body.schema && typeof body.schema === 'object' ? body.schema : null;
  let lastErr = '';
  for (const model of TEXT_MODELS) {
    try {
      const input = {
        messages: [...(system ? [{ role: 'system', content: system }] : []), { role: 'user', content: user }],
        max_tokens: maxTokens,
        ...(NO_REASONING[model] || {}),
        ...(schema ? { response_format: { type: 'json_schema', json_schema: { name: 'result', schema, strict: false } } } : {}),
      };
      const r = await env.AI.run(model, input);
      const text = textOf(r).trim();
      if (!text) { lastErr = 'AI ไม่ได้ส่งข้อความกลับมา'; continue; }
      const u = r.usage || {};
      return json({ ok: true, text, model, usage: { input_tokens: u.prompt_tokens ?? u.input_tokens ?? null, output_tokens: u.completion_tokens ?? u.output_tokens ?? null } });
    } catch (e) {
      const msg = String(e && e.message ? e.message : e);
      if (isQuota(msg)) return json({ error: QUOTA_MSG, quota: true }, 429);
      lastErr = msg;
    }
  }
  return json({ error: 'AI ฟรีใช้ไม่ได้ตอนนี้: ' + lastErr.slice(0, 200) }, 502);
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
    if (url.pathname === '/api/image/generate' || url.pathname === '/api/image/edit') {
      if (req.method !== 'POST') return json({ error: 'ใช้ POST' }, 405);
      if (!sameOrigin(req, url)) return json({ error: 'ไม่อนุญาต' }, 403);
      return imageAI(req, env, url.pathname.endsWith('generate') ? 'generate' : 'edit');
    }
    if (url.pathname === '/api/ai/chat') {
      if (req.method !== 'POST') return json({ error: 'ใช้ POST' }, 405);
      if (!sameOrigin(req, url)) return json({ error: 'ไม่อนุญาต' }, 403);
      return aiChat(req, env);
    }
    if (url.pathname === '/api/linkcheck') {
      if (req.method !== 'POST') return json({ error: 'ใช้ POST' }, 405);
      if (!sameOrigin(req, url)) return json({ error: 'ไม่อนุญาต' }, 403);
      return linkCheck(req);
    }
    if (url.pathname.startsWith('/api/')) return json({ error: 'ไม่พบ' }, 404);
    if (url.pathname.startsWith('/cdn/') && cdnEntry(url.pathname)) return serveCdn(url.pathname);
    if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('ไม่อนุญาต', { status: 405 });
    return serveAsset(req, url);
  },
};
