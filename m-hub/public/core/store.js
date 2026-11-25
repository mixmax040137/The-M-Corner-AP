// เก็บค่าตั้งและพรีเซ็ตไว้ในเครื่อง (IndexedDB) — ไม่ส่งขึ้นเซิร์ฟเวอร์
const DB = 'm-hub';
let dbp;

function db() {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore('kv');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbp;
}

async function tx(mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction('kv', mode);
    const r = fn(t.objectStore('kv'));
    t.oncomplete = () => resolve(r && 'result' in r ? r.result : undefined);
    t.onerror = () => reject(t.error);
  });
}

export async function get(key, fallback) {
  try {
    const v = await tx('readonly', (s) => s.get(key));
    return v === undefined ? fallback : v;
  } catch { return fallback; }
}

export async function set(key, value) {
  try { await tx('readwrite', (s) => s.put(value, key)); return true; } catch { return false; }
}

export async function del(key) {
  try { await tx('readwrite', (s) => s.delete(key)); } catch { /* ignore */ }
}

// พรีเซ็ตต่อเครื่องมือ: บันทึกค่าตั้งที่ใช้บ่อย เรียกกลับมาใช้ได้ในคลิกเดียว
export function presets(toolId) {
  const key = 'presets:' + toolId;
  return {
    async list() { return (await get(key, {})) || {}; },
    async save(name, data) { const all = await this.list(); all[name] = data; await set(key, all); },
    async remove(name) { const all = await this.list(); delete all[name]; await set(key, all); },
  };
}
