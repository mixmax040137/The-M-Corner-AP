// ส่งข้อมูลระหว่างเครื่องมือ (อยู่ในหน่วยความจำของหน้าเว็บเท่านั้น)
// เช่น เครื่องมือจัดการรายชื่อ → ส่งรายชื่อที่สะอาดแล้วไปให้ “ออกเอกสารจากเทมเพลต”
const data = new Map();
const listeners = new Map();

export function share(key, value) {
  data.set(key, value);
  for (const fn of listeners.get(key) || []) fn(value);
}

export const shared = (key) => data.get(key);

export function onShare(key, fn) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(fn);
  return () => listeners.get(key).delete(fn);
}
