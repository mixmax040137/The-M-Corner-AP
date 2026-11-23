/* sw.js — ให้ติดตั้งเป็นแอปบนมือถือได้
   ไม่เก็บหน้าระบบไว้ในเครื่อง (หน้ามีกุญแจและข้อมูลล่าสุดเสมอ) — เน็ตหลุดจะเห็นหน้าแจ้งว่าออฟไลน์แทน */
var CACHE = 'mcorner-static-v1';
var STATIC = ['/favicon.svg', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];
var OFFLINE = '<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>ออฟไลน์</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0f1729;color:#e6ecf7;' +
  'font-family:system-ui,sans-serif;text-align:center;padding:24px"><div><div style="font-size:44px">📶</div>' +
  '<h1 style="font-size:19px">ยังไม่ได้เชื่อมต่ออินเทอร์เน็ต</h1><p style="color:#8d9ab3">ต่อเน็ตแล้วกดปุ่มด้านล่าง</p>' +
  '<button onclick="location.reload()" style="padding:10px 18px;border-radius:10px;border:0;background:#4f8cff;color:#fff;font-size:15px">ลองอีกครั้ง</button></div></body></html>';

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(STATIC); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(function () {
      return new Response(OFFLINE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }));
    return;
  }
  if (STATIC.indexOf(url.pathname) >= 0) {
    e.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req); }));
  }
});
