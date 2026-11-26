// L'Arts PR Writer — ชั้นเก็บข้อมูล (Repository)
// หน้าจอเรียกผ่าน repo.* เท่านั้น ตอนนี้เก็บใน IndexedDB ของเบราว์เซอร์
// ภายหลังต่อ Google Sheets ได้โดยเขียน backend ใหม่ที่มีเมธอด getAll / put / del เหมือน idbBackend แล้วสลับ
// ทุกรายการมี id, createdAt, updatedAt, deleted (ลบแบบทำเครื่องหมาย เพื่อให้รวมไฟล์จากหลายเครื่องได้) และ sample

export const TYPES = ['events', 'versions', 'templates', 'posts', 'staff', 'style', 'usage', 'meta'];
const LOCAL_ONLY = ['cache']; // ไม่ส่งออก: สร้างใหม่ได้เสมอ
const DB_NAME = 'larts-pr-writer';
const SCHEMA = 1;
export const API_KEY_STORAGE = 'larts-pr:anthropic-key'; // เก็บใน localStorage ของเบราว์เซอร์นี้เท่านั้น ไม่อยู่ในไฟล์ส่งออก

const idbBackend = (() => {
  let dbp;
  const open = () => (dbp ||= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, SCHEMA);
    req.onupgradeneeded = () => {
      for (const t of [...TYPES, ...LOCAL_ONLY]) if (!req.result.objectStoreNames.contains(t)) req.result.createObjectStore(t, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
  const run = async (store, mode, fn) => {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const r = fn(tx.objectStore(store));
      tx.oncomplete = () => resolve(r && 'result' in r ? r.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  };
  return {
    getAll: (store) => run(store, 'readonly', (s) => s.getAll()),
    get: (store, id) => run(store, 'readonly', (s) => s.get(id)),
    put: (store, obj) => run(store, 'readwrite', (s) => s.put(obj)),
    putMany: (store, list) => run(store, 'readwrite', (s) => { for (const o of list) s.put(o); }),
    del: (store, id) => run(store, 'readwrite', (s) => s.delete(id)),
    clear: (store) => run(store, 'readwrite', (s) => s.clear()),
  };
})();

const backend = idbBackend;
const listeners = new Set();
const emit = (type) => { for (const fn of listeners) { try { fn(type); } catch (e) { console.error(e); } } };
const now = () => new Date().toISOString();
export const newId = (prefix = '') => prefix + (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

export const repo = {
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  async list(type, { withDeleted = false } = {}) {
    const all = (await backend.getAll(type)) || [];
    return withDeleted ? all : all.filter((x) => !x.deleted);
  },
  async get(type, id) {
    const x = await backend.get(type, id);
    return x && !x.deleted ? x : null;
  },
  async put(type, obj, { silent = false } = {}) {
    const t = now();
    const rec = { sample: false, deleted: false, ...obj, id: obj.id || newId(), createdAt: obj.createdAt || t, updatedAt: t };
    await backend.put(type, rec);
    if (!silent) emit(type);
    return rec;
  },
  async remove(type, id) {
    const x = await backend.get(type, id);
    if (!x) return;
    await backend.put(type, { ...x, deleted: true, updatedAt: now() });
    emit(type);
  },

  // ค่าตั้งเดี่ยว ๆ (เก็บใน meta)
  async getMeta(key, fallback) {
    const x = await backend.get('meta', key);
    return x && !x.deleted ? x.value : fallback;
  },
  async setMeta(key, value) {
    await this.put('meta', { id: key, value }, { silent: true });
    emit('meta');
  },

  // แคชผลลัพธ์ AI (ไม่ส่งออก)
  async cacheGet(key) { const x = await backend.get('cache', key); return x ? x.value : null; },
  async cacheSet(key, value) { await backend.put('cache', { id: key, value, at: now() }); },

  // ---------- ส่งออก / นำเข้าทั้งหมดเป็น JSON ไฟล์เดียว ----------
  async exportAll() {
    const data = {};
    for (const t of TYPES) data[t] = await backend.getAll(t);
    return { app: 'larts-pr-writer', schema: SCHEMA, exportedAt: now(), data };
  },

  // รวมข้อมูล: รายการที่ id ตรงกัน ใช้ตัวที่แก้ล่าสุด (updatedAt ใหม่กว่า)
  async importAll(json) {
    if (!json || json.app !== 'larts-pr-writer' || !json.data) throw new Error('ไม่ใช่ไฟล์สำรองของ L\'Arts PR Writer');
    const counts = { added: 0, updated: 0, kept: 0 };
    for (const t of TYPES) {
      const incoming = Array.isArray(json.data[t]) ? json.data[t] : [];
      if (!incoming.length) continue;
      const mine = new Map(((await backend.getAll(t)) || []).map((x) => [x.id, x]));
      const write = [];
      for (const x of incoming) {
        if (!x || !x.id) continue;
        if (t === 'meta' && /key|secret|token/i.test(x.id)) continue;
        const cur = mine.get(x.id);
        if (!cur) { write.push(x); counts.added++; }
        else if (String(x.updatedAt || '') > String(cur.updatedAt || '')) { write.push(x); counts.updated++; }
        else counts.kept++;
      }
      if (write.length) await backend.putMany(t, write);
    }
    emit('*');
    return counts;
  },

  async removeSamples() {
    let n = 0;
    for (const t of TYPES) {
      const list = (await backend.getAll(t)).filter((x) => x.sample && !x.deleted);
      for (const x of list) { await backend.put(t, { ...x, deleted: true, updatedAt: now() }); n++; }
    }
    await this.setMeta('samplesRemoved', true);
    emit('*');
    return n;
  },

  async wipeAll() {
    for (const t of [...TYPES, ...LOCAL_ONLY]) await backend.clear(t);
    emit('*');
  },
};

// API key: อยู่ในเบราว์เซอร์นี้เท่านั้น
export const apiKey = {
  get() { try { return localStorage.getItem(API_KEY_STORAGE) || ''; } catch { return ''; } },
  set(v) { try { if (v) localStorage.setItem(API_KEY_STORAGE, v.trim()); else localStorage.removeItem(API_KEY_STORAGE); } catch { /* ignore */ } },
};
