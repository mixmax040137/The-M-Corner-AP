// เชื่อมต่อโฟลเดอร์ในเครื่องโดยตรง (File System Access API — Chrome / Edge บนคอมพิวเตอร์)
// เบราว์เซอร์ที่ไม่รองรับจะใช้วิธีเลือกไฟล์ + ดาวน์โหลด ZIP แทนโดยอัตโนมัติ
import * as store from './store.js';

export const fsSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

let root = null; // โฟลเดอร์ทำงานหลัก (FileSystemDirectoryHandle)
let rootState = 'none'; // none | ready | needs-permission
const listeners = new Set();

export const workspace = {
  get root() { return root; },
  get state() { return rootState; },
  get name() { return root ? root.name : ''; },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

function emit() { for (const fn of listeners) fn(workspace); }

export async function restoreWorkspace() {
  if (!fsSupported) return;
  const saved = await store.get('workspace');
  if (!saved) return;
  root = saved;
  rootState = (await saved.queryPermission({ mode: 'readwrite' })) === 'granted' ? 'ready' : 'needs-permission';
  emit();
}

export async function connectWorkspace() {
  if (!fsSupported) throw new Error('เบราว์เซอร์นี้เชื่อมโฟลเดอร์โดยตรงไม่ได้ ใช้ Chrome หรือ Edge บนคอมพิวเตอร์');
  if (root && rootState === 'needs-permission') {
    if ((await root.requestPermission({ mode: 'readwrite' })) === 'granted') { rootState = 'ready'; emit(); return root; }
  }
  const dir = await window.showDirectoryPicker({ id: 'mhub-workspace', mode: 'readwrite' });
  root = dir;
  rootState = 'ready';
  await store.set('workspace', dir);
  emit();
  return dir;
}

export async function disconnectWorkspace() {
  root = null;
  rootState = 'none';
  await store.del('workspace');
  emit();
}

// ใช้ในเทสต์อัตโนมัติ: ตั้งโฟลเดอร์ทำงานเป็นโฟลเดอร์ใดก็ได้ (เช่น OPFS)
export function setWorkspaceForTest(dir) { root = dir; rootState = 'ready'; emit(); }

export async function ensurePermission(handle, mode = 'readwrite') {
  if (!handle.queryPermission) return true;
  if ((await handle.queryPermission({ mode })) === 'granted') return true;
  return (await handle.requestPermission({ mode })) === 'granted';
}

// เลือกโฟลเดอร์ (เริ่มที่โฟลเดอร์ทำงานถ้ามี)
export async function pickDirectory(id = 'mhub-pick', mode = 'readwrite') {
  if (window.__mhubPickDirectory) return window.__mhubPickDirectory(id, mode); // จุดเสียบสำหรับเทสต์
  const opts = { id, mode };
  if (root && rootState === 'ready') opts.startIn = root;
  return window.showDirectoryPicker(opts);
}

// ไล่อ่านไฟล์ในโฟลเดอร์ → [{file, path, handle, parent}]
export async function walkDirectory(dir, { recursive = true, accept, prefix = '' } = {}) {
  const out = [];
  for await (const [name, handle] of dir.entries()) {
    if (name.startsWith('.')) continue;
    if (handle.kind === 'file') {
      if (accept && !accept(name)) continue;
      out.push({ file: await handle.getFile(), path: prefix + name, handle, parent: dir });
    } else if (recursive) {
      out.push(...(await walkDirectory(handle, { recursive, accept, prefix: prefix + name + '/' })));
    }
  }
  return out;
}

export async function getSubdir(base, path, create = true) {
  let dir = base;
  for (const part of String(path || '').split('/').filter(Boolean)) dir = await dir.getDirectoryHandle(part, { create });
  return dir;
}

async function exists(dir, name) {
  try { await dir.getFileHandle(name); return true; } catch { return false; }
}

// เขียนไฟล์ลงโฟลเดอร์ ถ้าชื่อซ้ำจะต่อท้าย (2), (3) ... ไม่เขียนทับของเดิม
export async function writeFileTo(base, path, data, { overwrite = false } = {}) {
  const parts = path.split('/').filter(Boolean);
  let name = parts.pop();
  const dir = await getSubdir(base, parts.join('/'), true);
  if (!overwrite && (await exists(dir, name))) {
    const i = name.lastIndexOf('.');
    const [b, e] = i > 0 ? [name.slice(0, i), name.slice(i)] : [name, ''];
    let n = 2;
    while (await exists(dir, `${b} (${n})${e}`)) n++;
    name = `${b} (${n})${e}`;
  }
  const fh = await dir.getFileHandle(name, { create: true });
  const w = await fh.createWritable();
  await w.write(data);
  await w.close();
  return [...parts, name].join('/');
}
