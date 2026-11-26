// ประวัติเวอร์ชันของงาน: เก็บข้อมูลเดิมก่อนแก้ เพื่อเขียน “แจ้งเปลี่ยนแปลง” แบบเทียบเก่า → ใหม่ และย้อนกลับได้
import { repo } from './db.js';
import { FIELDS, fieldLabel } from './fields.js';
import { fmtRange, fmtTime, fmtDate } from './dates.js';

const guestsText = (g) => (g || []).filter((x) => x && (x.name || x.nameEn)).map((x) => [x.name, x.role].filter(Boolean).join(' ')).join(', ');

// ค่าที่อ่านง่ายของแต่ละช่อง (ใช้แสดงประวัติ)
function show(f, key) {
  if (key === 'guests') return guestsText(f.guests);
  if (key === 'date' || key === 'endDate' || key === 'deadline') return fmtDate(f[key], 'th');
  return String(f[key] ?? '').trim();
}

// รายการช่องที่ต่างกันระหว่างข้อมูลสองชุด
export function diffFields(a, b) {
  const out = [];
  if (!a || !b) return out;
  for (const x of FIELDS) {
    for (const key of x.en ? [x.key, x.key + 'En'] : [x.key]) {
      const o = show(a, key), n = show(b, key);
      if (o !== n) out.push({ field: key, label: fieldLabel(key), old: o, new: n });
    }
  }
  return out;
}

export const sameFields = (a, b) => diffFields(a, b).length === 0;

export async function listVersions(eventId) {
  return (await repo.list('versions')).filter((v) => v.eventId === eventId).sort((a, b) => b.versionNo - a.versionNo);
}

// เก็บข้อมูลปัจจุบันของงานเป็นเวอร์ชัน แล้วเลื่อนเลขเวอร์ชันของงาน (ถ้าข้อมูลเหมือนเวอร์ชันล่าสุดอยู่แล้ว ใช้ของเดิม)
export async function snapshot(eventId, note = '') {
  const ev = await repo.get('events', eventId);
  if (!ev) throw new Error('ไม่พบงาน');
  const [last] = await listVersions(eventId);
  if (last && sameFields(last.fields, ev.fields)) return last;
  const v = await repo.put('versions', { eventId, versionNo: ev.versionNo || 1, fields: structuredClone(ev.fields), note, sample: !!ev.sample });
  await repo.put('events', { ...ev, versionNo: (ev.versionNo || 1) + 1 });
  return v;
}

// ย้อนกลับ: เก็บข้อมูลปัจจุบันเป็นเวอร์ชันก่อน แล้วใช้ข้อมูลของเวอร์ชันที่เลือก
export async function restore(versionId) {
  const v = await repo.get('versions', versionId);
  if (!v) throw new Error('ไม่พบเวอร์ชัน');
  await snapshot(v.eventId, 'ก่อนย้อนกลับไปเวอร์ชัน ' + v.versionNo);
  const ev = await repo.get('events', v.eventId);
  return repo.put('events', { ...ev, fields: structuredClone(v.fields) });
}

// สรุปสั้นของการเปลี่ยนแปลง เช่น "วันที่, สถานที่"
export const changeSummary = (a, b) => diffFields(a, b).map((d) => d.label.replace(/\s*\(.*\)$/, (m) => (/อังกฤษ/.test(m) ? ' (อังกฤษ)' : ''))).join(', ');

export { fmtRange, fmtTime };
