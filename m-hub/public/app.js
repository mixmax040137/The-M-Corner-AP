// M Hub — โครงหลักของแอป: เมนู, เปลี่ยนหน้า, โฟลเดอร์ทำงาน, ติดตั้งลงเครื่อง
import { h, $, btn, toast } from './core/ui.js';
import { icon } from './core/icons.js';
import { tools, ideas } from './tools/registry.js';
import { workspace, restoreWorkspace, connectWorkspace, disconnectWorkspace, fsSupported } from './core/workspace.js';

export const APP_VERSION = '1.4.0';
const main = $('#main');
const nav = $('#nav');
const title = $('#page-title');
const views = new Map(); // เก็บหน้าที่เปิดแล้วไว้ งานที่ทำค้างจะไม่หายเมื่อสลับหน้า

const ctx = { workspace, toast };

// ---------- เมนู ----------
function renderNav() {
  nav.replaceChildren(
    h('a.nav-link', { href: '#/', 'data-id': '' }, icon('home'), 'หน้าแรก'),
    ...tools.map((t) => h('a.nav-link', { href: '#/' + t.id, 'data-id': t.id }, icon(t.icon), t.title)),
  );
  $('#menu-btn').replaceChildren(icon('menu', 20));
  $('#menu-btn').onclick = () => document.body.classList.toggle('nav-open');
  nav.addEventListener('click', () => document.body.classList.remove('nav-open'));
}

// ---------- โฟลเดอร์ทำงาน ----------
function workspaceChip() {
  const el = h('span');
  const draw = () => {
    if (!fsSupported) { el.replaceChildren(); return; }
    if (workspace.state === 'ready') {
      el.replaceChildren(btn('', connect, { ic: 'folder', title: 'โฟลเดอร์ทำงาน: ' + workspace.name, kind: 'ws-chip' }));
      el.firstChild.append(h('span', workspace.name));
    } else if (workspace.state === 'needs-permission') {
      el.replaceChildren(btn('อนุญาตโฟลเดอร์ “' + workspace.name + '”', connect, { ic: 'folder', kind: 'primary' }));
    } else {
      el.replaceChildren(btn('เชื่อมโฟลเดอร์', connect, { ic: 'folderPlus', title: 'เชื่อมต่อโฟลเดอร์ทำงานในเครื่อง' }));
    }
  };
  workspace.onChange(draw);
  draw();
  return el;
}

async function connect() {
  try {
    await connectWorkspace();
    toast('เชื่อมโฟลเดอร์ “' + workspace.name + '” แล้ว', 'ok');
  } catch (e) {
    if (e.name !== 'AbortError') toast(e.message, 'error');
  }
}

// ---------- ติดตั้งลงเครื่อง (PWA) ----------
let installEvent = null;
const installBtn = btn('ติดตั้งลงเครื่อง', async () => {
  if (!installEvent) return showInstallHelp();
  installEvent.prompt();
  const r = await installEvent.userChoice;
  if (r.outcome === 'accepted') toast('ติดตั้งแล้ว เปิดได้จากเมนูโปรแกรม / หน้าจอหลัก', 'ok');
  installEvent = null;
}, { ic: 'install' });
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvent = e; installBtn.hidden = false; });
window.addEventListener('appinstalled', () => { installBtn.hidden = true; });

function showInstallHelp() {
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  toast(isIOS
    ? 'บน iPhone/iPad: กดปุ่มแชร์ แล้วเลือก “เพิ่มไปยังหน้าจอโฮม”'
    : 'กดไอคอนติดตั้ง (⊕) ที่ช่องที่อยู่เว็บของ Chrome / Edge หรือเมนู ⋮ → “ติดตั้ง M Hub”', 'info', 7000);
}

// ---------- หน้าแรก ----------
function homeView() {
  const wsCard = h('section.card');
  const drawWs = () => {
    const status = !fsSupported
      ? h('div.note.warn', 'เบราว์เซอร์นี้เชื่อมโฟลเดอร์โดยตรงไม่ได้ — ยังใช้ทุกเครื่องมือได้ โดยเลือกไฟล์ และรับผลเป็น ZIP (แนะนำ Chrome หรือ Edge บนคอมพิวเตอร์)')
      : workspace.state === 'ready'
        ? h('div.ws', h('div.note.ok', icon('folder'), ' เชื่อมต่อโฟลเดอร์ “', h('b', workspace.name), '” แล้ว'), btn('เปลี่ยนโฟลเดอร์', connect), btn('เลิกเชื่อม', async () => { await disconnectWorkspace(); }, { kind: 'ghost' }))
        : workspace.state === 'needs-permission'
          ? h('div.ws', h('div.note.warn', 'ต้องกดอนุญาตโฟลเดอร์ “' + workspace.name + '” อีกครั้ง (เบราว์เซอร์ขอทุกครั้งที่เปิดใหม่)'), btn('อนุญาต', connect, { kind: 'primary', ic: 'check' }))
          : h('div.ws', btn('เชื่อมต่อโฟลเดอร์ทำงาน', connect, { kind: 'primary', ic: 'folderPlus' }), h('span.muted.small', 'เช่น โฟลเดอร์ “งานประชาสัมพันธ์” — เครื่องมือจะเปิด/บันทึกไฟล์เริ่มจากที่นี่'));
    wsCard.replaceChildren(h('h3.card-title', icon('folder'), 'โฟลเดอร์ทำงานในเครื่อง'), status);
  };
  workspace.onChange(drawWs);
  drawWs();

  return h('div.tool-view',
    h('div.hero',
      h('h2', 'ศูนย์รวมเครื่องมือทำงาน'),
      h('p', 'งานซ้ำ ๆ ที่เคยต้องทำทีละไฟล์ หรือต้องให้ AI ช่วยทุกครั้ง ทำได้ที่นี่ในคลิกเดียว ทุกอย่างประมวลผลบนเครื่องของคุณเอง ไฟล์ไม่ถูกอัปโหลดไปไหน และไม่ใช้ token ของ AI')),
    h('div.facts',
      fact('shield', 'ไฟล์อยู่ในเครื่องคุณ', 'ประมวลผลในเบราว์เซอร์ ไม่ส่งไฟล์ขึ้นเซิร์ฟเวอร์'),
      fact('wifiOff', 'ใช้ออฟไลน์ได้', 'หลังเปิดครั้งแรก ใช้งานได้แม้ไม่มีเน็ต'),
      fact('install', 'ติดตั้งเป็นโปรแกรมได้', 'เปิดจากเมนูโปรแกรมได้เหมือนแอปทั่วไป'),
      fact('save', 'จำค่าที่ใช้บ่อย', 'บันทึกเป็นพรีเซ็ต เรียกใช้ซ้ำได้ทันที')),
    wsCard,
    h('h3', 'เครื่องมือ'),
    h('div.tool-grid', tools.map((t) => h('a.tool-card', { href: '#/' + t.id },
      h('div.tool-ic', icon(t.icon, 22)), h('h3', t.title), h('p', t.desc),
      h('div.chips', (t.tags || []).map((x) => h('span.tag', x)))))),
    h('h3', 'ไอเดียเครื่องมือถัดไป'),
    h('p.intro', 'M Hub ออกแบบให้เพิ่มเครื่องมือได้เรื่อย ๆ — อยากได้ตัวไหน บอก Claude ให้เพิ่มเข้าไปได้เลย'),
    h('div.tool-grid', ideas.map((i) => h('div.idea', icon(i.icon), h('div', h('b', i.title), h('span', i.desc))))),
  );
}

function fact(ic, t, d) {
  return h('div.fact', icon(ic), h('div', h('b', t), h('div.muted.small', d)));
}

// ---------- เปลี่ยนหน้า ----------
async function route() {
  const id = (location.hash.replace(/^#\/?/, '').split('?')[0]) || '';
  const tool = tools.find((t) => t.id === id);
  for (const a of nav.querySelectorAll('.nav-link')) a.setAttribute('aria-current', a.dataset.id === (tool ? tool.id : '') ? 'page' : 'false');
  title.textContent = tool ? tool.title : 'หน้าแรก';
  document.title = tool ? `${tool.title} · M Hub` : 'M Hub';
  for (const v of [...main.children]) { if (v.dataset.failed) v.remove(); else v.hidden = true; }
  const key = tool ? tool.id : '';
  let view = views.get(key);
  if (!view) {
    view = h('div.tool-view', h('div.muted', 'กำลังโหลด…'));
    views.set(key, view);
    main.append(view);
    try {
      if (!tool) view.replaceChildren(...homeView().childNodes);
      else {
        const mod = await tool.load();
        view.replaceChildren();
        await mod.mount(view, ctx);
      }
    } catch (e) {
      console.error(e);
      view.replaceChildren(h('div.note.error', 'เปิดเครื่องมือไม่สำเร็จ: ' + e.message));
      view.dataset.failed = '1';
      views.delete(key);
    }
  }
  view.hidden = false;
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

// ---------- เริ่มต้น ----------
renderNav();
$('#topbar-actions').append(workspaceChip(), installBtn);
installBtn.hidden = isStandalone();
$('#sidebar-foot').append(h('div', 'เวอร์ชัน ' + APP_VERSION), h('div', 'ทำงานในเครื่อง · ไม่อัปโหลดไฟล์'));
window.addEventListener('hashchange', route);
await restoreWorkspace().catch(() => {});
await route();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
window.__mhubReady = true;
