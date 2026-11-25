// คลังคำแปลประจำหน่วยงาน (ไทย → อังกฤษ) ใช้ร่วมกันทุกเครื่องมือ เก็บในเครื่อง (IndexedDB)
import * as store from './store.js';
import { thaiDatesToEnglish } from './thai.js';

export const CATEGORIES = ['หน่วยงาน', 'ตำแหน่ง', 'หลักสูตร / สาขา', 'คำทั่วไป'];

// คำเริ่มต้น — แก้ไข/เพิ่มเองได้ในเครื่องมือ “คลังคำแปล”
export const DEFAULT_TERMS = [
  ['คณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์', 'Faculty of Liberal Arts, Thammasat University', 'หน่วยงาน'],
  ['คณะศิลปศาสตร์', 'Faculty of Liberal Arts', 'หน่วยงาน'],
  ['มหาวิทยาลัยธรรมศาสตร์', 'Thammasat University', 'หน่วยงาน'],
  ['ท่าพระจันทร์', 'Tha Prachan Campus', 'หน่วยงาน'],
  ['ศูนย์รังสิต', 'Rangsit Campus', 'หน่วยงาน'],
  ['ศูนย์ลำปาง', 'Lampang Campus', 'หน่วยงาน'],
  ['ศูนย์พัทยา', 'Pattaya Campus', 'หน่วยงาน'],
  ['งานประชาสัมพันธ์', 'Public Relations Unit', 'หน่วยงาน'],
  ['งานบริการการศึกษา', 'Academic Services Unit', 'หน่วยงาน'],
  ['งานวิเทศสัมพันธ์', 'International Affairs Unit', 'หน่วยงาน'],
  ['สำนักงานเลขานุการคณะ', 'Office of the Faculty Secretary', 'หน่วยงาน'],
  ['คณบดี', 'Dean', 'ตำแหน่ง'],
  ['รองคณบดีฝ่ายวิชาการ', 'Deputy Dean for Academic Affairs', 'ตำแหน่ง'],
  ['รองคณบดีฝ่ายวิจัย', 'Deputy Dean for Research', 'ตำแหน่ง'],
  ['รองคณบดีฝ่ายกิจการนักศึกษา', 'Deputy Dean for Student Affairs', 'ตำแหน่ง'],
  ['รองคณบดีฝ่ายบริหาร', 'Deputy Dean for Administration', 'ตำแหน่ง'],
  ['ผู้ช่วยคณบดี', 'Assistant Dean', 'ตำแหน่ง'],
  ['หัวหน้าสาขาวิชา', 'Head of Department', 'ตำแหน่ง'],
  ['ศาสตราจารย์', 'Professor', 'ตำแหน่ง'],
  ['รองศาสตราจารย์', 'Associate Professor', 'ตำแหน่ง'],
  ['ผู้ช่วยศาสตราจารย์', 'Assistant Professor', 'ตำแหน่ง'],
  ['ศ.ดร.', 'Prof. Dr.', 'ตำแหน่ง'],
  ['รศ.ดร.', 'Assoc. Prof. Dr.', 'ตำแหน่ง'],
  ['ผศ.ดร.', 'Asst. Prof. Dr.', 'ตำแหน่ง'],
  ['รศ.', 'Assoc. Prof.', 'ตำแหน่ง'],
  ['ผศ.', 'Asst. Prof.', 'ตำแหน่ง'],
  ['ดร.', 'Dr.', 'ตำแหน่ง'],
  ['สาขาวิชาภาษาอังกฤษ', 'Department of English', 'หลักสูตร / สาขา'],
  ['สาขาวิชาภาษาฝรั่งเศส', 'Department of French', 'หลักสูตร / สาขา'],
  ['สาขาวิชาภาษาเยอรมัน', 'Department of German', 'หลักสูตร / สาขา'],
  ['สาขาวิชาภาษาญี่ปุ่น', 'Department of Japanese', 'หลักสูตร / สาขา'],
  ['สาขาวิชาภาษาจีน', 'Department of Chinese', 'หลักสูตร / สาขา'],
  ['สาขาวิชาภาษารัสเซีย', 'Department of Russian', 'หลักสูตร / สาขา'],
  ['สาขาวิชาภาษาไทย', 'Department of Thai', 'หลักสูตร / สาขา'],
  ['สาขาวิชาภาษาศาสตร์', 'Department of Linguistics', 'หลักสูตร / สาขา'],
  ['สาขาวิชาประวัติศาสตร์', 'Department of History', 'หลักสูตร / สาขา'],
  ['สาขาวิชาภูมิศาสตร์', 'Department of Geography', 'หลักสูตร / สาขา'],
  ['สาขาวิชาปรัชญา', 'Department of Philosophy', 'หลักสูตร / สาขา'],
  ['สาขาวิชาจิตวิทยา', 'Department of Psychology', 'หลักสูตร / สาขา'],
  ['สาขาวิชาบรรณารักษศาสตร์และสารสนเทศศาสตร์', 'Department of Library and Information Science', 'หลักสูตร / สาขา'],
  ['ปริญญาตรี', "Bachelor's degree", 'หลักสูตร / สาขา'],
  ['ปริญญาโท', "Master's degree", 'หลักสูตร / สาขา'],
  ['ปริญญาเอก', 'Doctoral degree', 'หลักสูตร / สาขา'],
  ['ปีการศึกษา', 'Academic Year', 'คำทั่วไป'],
  ['ภาคเรียนที่', 'Semester', 'คำทั่วไป'],
  ['ภาคการศึกษาที่', 'Semester', 'คำทั่วไป'],
  ['ทุนการศึกษา', 'scholarship', 'คำทั่วไป'],
  ['โครงการแลกเปลี่ยน', 'exchange program', 'คำทั่วไป'],
  ['สัมมนาวิชาการ', 'academic seminar', 'คำทั่วไป'],
  ['การประชุมวิชาการ', 'academic conference', 'คำทั่วไป'],
  ['พิธีมอบเกียรติบัตร', 'certificate presentation ceremony', 'คำทั่วไป'],
  ['ห้องประชุม', 'meeting room', 'คำทั่วไป'],
  ['นักศึกษา', 'students', 'คำทั่วไป'],
  ['คณาจารย์', 'faculty members', 'คำทั่วไป'],
  ['บุคลากร', 'staff', 'คำทั่วไป'],
].map(([th, en, cat]) => ({ th, en, cat }));

const listeners = new Set();
let cache = null;

export async function loadGlossary() {
  if (!cache) cache = (await store.get('glossary')) || DEFAULT_TERMS.map((x) => ({ ...x }));
  return cache;
}

export async function saveGlossary(list) {
  cache = list.filter((x) => x.th && x.th.trim()).map((x) => ({ th: x.th.trim(), en: (x.en || '').trim(), cat: x.cat || 'คำทั่วไป' }));
  await store.set('glossary', cache);
  for (const fn of listeners) fn(cache);
  return cache;
}

export function onGlossaryChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

// เรียงคำยาวก่อน เพื่อให้ "รองศาสตราจารย์" ถูกแทนก่อน "ศาสตราจารย์"
export function compileGlossary(list) {
  return list.filter((x) => x.th && x.en).map((x) => [x.th, x.en]).sort((a, b) => b[0].length - a[0].length);
}

// แทนคำในคลัง + แปลงวันที่ไทยเป็นอังกฤษ (ไม่ใช้ AI)
export function applyGlossary(text, pairs) {
  let r = thaiDatesToEnglish(String(text || ''));
  for (const [th, en] of pairs) r = r.split(th).join(en);
  return r.replace(/Academic Year (25\d\d)/g, (_, y) => 'Academic Year ' + (+y - 543));
}

export const hasThai = (s) => /[฀-๿]/.test(String(s || ''));

// แปลด้วย Workers AI (ผ่าน Worker ของ M Hub) — แทนคำในคลังก่อนส่ง เพื่อให้ชื่อเฉพาะถูกต้อง
// ตัดข้อความยาวเป็นท่อน ≤ 1,200 ตัวอักษร และส่งทีละไม่เกิน 3,500 ตัวอักษร (เพดานของ Worker คือ 4,000)
function pieces(text, max = 1200) {
  const out = [];
  let rest = text;
  while (rest.length > max) {
    let cut = rest.lastIndexOf(' ', max);
    if (cut < max * 0.5) cut = max;
    out.push(rest.slice(0, cut));
    rest = rest.slice(cut).trimStart();
  }
  out.push(rest);
  return out;
}

export async function aiTranslate(texts, pairs = []) {
  const jobs = texts.map((t) => pieces(applyGlossary(t, pairs)));
  const flat = jobs.flat();
  const result = flat.map((t) => (hasThai(t) ? null : t));
  let batch = [];
  let size = 0;
  const send = async () => {
    if (!batch.length) return;
    const r = await fetch('/api/translate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ texts: batch.map((i) => flat[i]), from: 'th', to: 'en' }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.texts) throw new Error(j.error || 'HTTP ' + r.status);
    batch.forEach((i, k) => (result[i] = j.texts[k]));
    batch = []; size = 0;
  };
  for (let i = 0; i < flat.length; i++) {
    if (result[i] !== null) continue;
    if (batch.length >= 15 || size + flat[i].length > 3500) await send();
    batch.push(i); size += flat[i].length;
  }
  await send();
  let k = 0;
  return jobs.map((p) => p.map(() => result[k++]).join(' '));
}
