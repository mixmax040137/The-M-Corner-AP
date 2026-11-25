// M Hub service worker — ใช้งานออฟไลน์ได้ และติดตั้งเป็นโปรแกรมได้
// โค้ดแอป: เน็ตก่อน (ได้เวอร์ชันใหม่เสมอ) ถ้าออฟไลน์ใช้ของที่เก็บไว้
// ไลบรารี/ฟอนต์ใน /vendor/: ใช้ของที่เก็บไว้ก่อน (ไฟล์ใหญ่ ไม่ค่อยเปลี่ยน)
const VERSION = 'm-hub-v1';
const SHELL = ['/', '/app.js', '/app.css', '/manifest.webmanifest', '/icons/icon.svg', '/vendor/fonts/fonts.css',
  '/core/ui.js', '/core/icons.js', '/core/store.js', '/core/workspace.js', '/core/output.js', '/core/data.js', '/core/thai.js',
  '/tools/registry.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/vendor/') || url.pathname.startsWith('/cdn/')) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
      return res;
    })));
    return;
  }
  e.respondWith(fetch(e.request).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request).then((hit) => hit || (e.request.mode === 'navigate' ? caches.match('/') : Response.error()))));
});
