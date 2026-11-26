// เครื่องมือ: L'Arts PR Writer — เขียนโพสต์ประชาสัมพันธ์คณะศิลปศาสตร์ (อยู่ใน M Hub เป็นเครื่องมือหนึ่ง)
// หน้าย่อยเปิดผ่าน #/pr-writer?s=<หน้า>&e=<id งาน>
import { h } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { repo } from '../pr/db.js';
import { seedIfNeeded, loadStyle } from '../pr/sample.js';
import { DEFAULT_SETTINGS } from '../pr/fields.js';

export const TOOL_ID = 'pr-writer';
const SCREENS = [
  { id: 'home', label: 'ภาพรวม', icon: 'home', load: () => import('../pr/ui-home.js') },
  { id: 'compose', label: 'เขียนโพสต์', icon: 'pen', load: () => import('../pr/ui-compose.js') },
  { id: 'events', label: 'งานทั้งหมด', icon: 'list', load: () => import('../pr/ui-events.js') },
  { id: 'calendar', label: 'ปฏิทินโพสต์', icon: 'calendar', load: () => import('../pr/ui-calendar.js') },
  { id: 'library', label: 'คลังโพสต์', icon: 'book', load: () => import('../pr/ui-library.js') },
  { id: 'poster', label: 'ข้อความโปสเตอร์', icon: 'type', load: () => import('../pr/ui-poster.js') },
  { id: 'templates', label: 'เทมเพลต', icon: 'file', load: () => import('../pr/ui-templates.js') },
  { id: 'staff', label: 'บุคลากร', icon: 'users', load: () => import('../pr/ui-staff.js') },
  { id: 'style', label: 'แนวทางการเขียน', icon: 'award', load: () => import('../pr/ui-style.js') },
  { id: 'qr', label: 'QR Code', icon: 'qr', load: () => import('../pr/ui-qr.js') },
  { id: 'stats', label: 'สถิติและรายงาน', icon: 'table', load: () => import('../pr/ui-stats.js') },
  { id: 'settings', label: 'ตั้งค่า', icon: 'gear', load: () => import('../pr/ui-settings.js') },
];

export function parseHash() {
  const [path, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const q = new URLSearchParams(query);
  return { path, screen: q.get('s') || 'home', params: Object.fromEntries(q.entries()) };
}

export async function mount(root) {
  await seedIfNeeded();
  const app = {
    settings: { ...DEFAULT_SETTINGS, ...(await repo.getMeta('settings', {})) },
    style: await loadStyle(),
    staff: await repo.list('staff'),
    async reloadStaff() { this.staff = await repo.list('staff'); },
    async saveSettings(patch) {
      Object.assign(this.settings, patch);
      await repo.setMeta('settings', { ...this.settings }, { silent: true }); // ไม่โหลดซ้ำ: หน้าจอถือ object เดิมอยู่
    },
    async saveStyle(patch) {
      Object.assign(this.style, patch);
      await repo.put('style', { ...this.style, id: 'main' }, { silent: true });
    },
    go(screen, params = {}) {
      const q = new URLSearchParams({ s: screen, ...params });
      location.hash = '#/' + TOOL_ID + '?' + q.toString();
    },
  };
  repo.onChange(async (type) => {
    if (type === 'style' || type === '*') app.style = await loadStyle();
    if (type === 'staff' || type === '*') app.staff = await repo.list('staff');
    if (type === 'meta' || type === '*') app.settings = { ...DEFAULT_SETTINGS, ...(await repo.getMeta('settings', {})) };
  });

  const nav = h('div.tabs.pr-nav', { role: 'tablist' });
  const body = h('div.pr-body');
  const mounted = new Map();
  for (const s of SCREENS) {
    nav.append(h('button.tab', { type: 'button', role: 'tab', 'data-id': s.id, onclick: () => app.go(s.id) }, icon(s.icon), s.label));
  }

  async function show() {
    const { path, screen, params } = parseHash();
    if (path !== TOOL_ID) return;
    const def = SCREENS.find((s) => s.id === screen) || SCREENS[0];
    for (const b of nav.children) b.setAttribute('aria-selected', b.dataset.id === def.id);
    for (const [k, v] of mounted) v.el.hidden = k !== def.id;
    let m = mounted.get(def.id);
    if (!m) {
      const el = h('div.pr-screen', h('div.muted', 'กำลังโหลด…'));
      body.append(el);
      m = { el, mod: null };
      mounted.set(def.id, m);
      try {
        m.mod = await def.load();
        el.replaceChildren();
        await m.mod.mount(el, app);
      } catch (e) {
        console.error(e);
        el.replaceChildren(h('div.note.error', 'เปิดหน้านี้ไม่สำเร็จ: ' + e.message));
        mounted.delete(def.id);
        return;
      }
    }
    m.el.hidden = false;
    if (m.mod && m.mod.show) await m.mod.show(params);
  }
  window.addEventListener('hashchange', show);
  root.append(
    h('p.intro', 'เขียนโพสต์ประชาสัมพันธ์ของคณะศิลปศาสตร์จากข้อมูลงาน ได้หลายโทน หลายช่องทาง ทั้งไทยและอังกฤษ พร้อมตัวตรวจวันที่ ลิงก์ และถ้อยคำก่อนโพสต์ โหมดเทมเพลตไม่ใช้ token และข้อมูลทั้งหมดเก็บในเบราว์เซอร์นี้'),
    nav, body);
  await show();
}
