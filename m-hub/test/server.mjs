// เซิร์ฟเวอร์ทดสอบในเครื่อง: เสิร์ฟ public/ และจำลอง /api/* (ไม่ต้องใช้บัญชี Cloudflare)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const pub = fileURLToPath(new URL('../public/', import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.wasm': 'application/wasm', '.woff2': 'font/woff2' };

export const aiCalls = [];
const GRAY_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNoAAAAggCBd81ytgAAAABJRU5ErkJggg==';

export function startServer(port = 0) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/api/health') { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ ok: true, app: 'm-hub', ai: true })); }
    if (url.pathname === '/api/image/edit' || url.pathname === '/api/image/generate') {
      // จำลอง Workers AI: คืนภาพเดิม (หรือภาพเทาเมื่อสร้างใหม่) และจดคำสั่งล่าสุดไว้ให้เทสต์ตรวจ
      let body = '';
      for await (const c of req) body += c;
      const j = JSON.parse(body || '{}');
      aiCalls.push({ path: url.pathname, prompt: j.prompt, width: j.width, height: j.height });
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify({ ok: true, image: j.image || GRAY_PNG }));
    }
    if (url.pathname === '/api/translate') {
      let body = '';
      for await (const c of req) body += c;
      const { texts = [] } = JSON.parse(body || '{}');
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify({ ok: true, texts: texts.map((t) => '[EN] ' + t) }));
    }
    const CDN = {
      '/cdn/avif/': '@jsquash/avif/codec/enc/', '/cdn/tesseract/': 'tesseract.js/dist/', '/cdn/tesseract-core/': 'tesseract.js-core/',
      '/cdn/tessdata/tha.': '@tesseract.js-data/tha/4.0.0_best_int/tha.', '/cdn/tessdata/eng.': '@tesseract.js-data/eng/4.0.0_best_int/eng.',
    };
    const CACHE = { '/cdn/tfjs/': '_tensorflow_tfjs_4.22.0/dist/', '/cdn/m/rvm/': '_vladmandic_human-models_3.0.4/models/', '/cdn/m/esrgan/': '_upscalerjs_esrgan-slim_1.0.0/models/' };
    const cpre = Object.keys(CACHE).find((k) => url.pathname.startsWith(k));
    if (cpre) {
      const f = fileURLToPath(new URL('./cache/' + CACHE[cpre] + url.pathname.slice(cpre.length), import.meta.url));
      res.setHeader('content-type', f.endsWith('.js') ? 'text/javascript' : f.endsWith('.json') ? 'application/json' : 'application/octet-stream');
      try { return res.end(await readFile(f)); } catch { res.statusCode = 404; return res.end('not found (รัน node scripts/test-assets.mjs)'); }
    }
    const pre = Object.keys(CDN).find((k) => url.pathname.startsWith(k));
    if (pre) {
      // จำลองสิ่งที่ Worker ทำจริง (ดึงจาก jsDelivr) ด้วยไฟล์ใน node_modules
      const f = fileURLToPath(new URL('../node_modules/' + CDN[pre] + url.pathname.slice(pre.length), import.meta.url));
      res.setHeader('content-type', f.endsWith('.wasm') ? 'application/wasm' : f.endsWith('.gz') ? 'application/gzip' : 'text/javascript');
      try { return res.end(await readFile(f)); } catch { res.statusCode = 404; return res.end('not found'); }
    }
    let p = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    if (p.endsWith('/')) p += 'index.html';
    const file = join(pub, p);
    try {
      if (!(await stat(file)).isFile()) throw 0;
      res.setHeader('content-type', TYPES[extname(file)] || 'application/octet-stream');
      res.end(await readFile(file));
    } catch { res.statusCode = 404; res.end('not found'); }
  });
  return new Promise((r) => server.listen(port, '127.0.0.1', () => r({ server, url: `http://127.0.0.1:${server.address().port}` })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { url } = await startServer(+process.argv[2] || 8788);
  console.log('M Hub test server: ' + url);
}
