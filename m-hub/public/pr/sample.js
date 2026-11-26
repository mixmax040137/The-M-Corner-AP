// ข้อมูลเริ่มต้น + ข้อมูลตัวอย่าง (sample: true) — ชื่อบุคคล เบอร์โทร อีเมล และลิงก์ทั้งหมดเป็นของสมมติ
import { repo } from './db.js';
import { emptyFields, FACULTY } from './fields.js';

export const DEFAULT_STYLE = {
  id: 'main',
  facultyTh: FACULTY.th,
  facultyEn: FACULTY.en,
  hashtags: [
    { id: 'h1', label: 'ทั่วไป (ตัวอย่าง แก้ได้)', channel: '*', eventType: '*', tags: '#คณะศิลปศาสตร์ #ศิลปศาสตร์ธรรมศาสตร์ #LiberalArtsTU #Thammasat' },
    { id: 'h2', label: 'กิจกรรมนักศึกษา (ตัวอย่าง)', channel: '*', eventType: 'student', tags: '#ชาวศิลปศาสตร์' },
  ],
  banned: [
    { word: 'คลิ๊ก', suggest: 'คลิก', level: 'warn', note: 'ตามราชบัณฑิตยสภา' },
    { word: 'อีเว้นท์', suggest: 'อีเวนต์', level: 'warn' },
    { word: 'สัมนา', suggest: 'สัมมนา', level: 'error' },
    { word: 'อนุญาติ', suggest: 'อนุญาต', level: 'error' },
    { word: 'เว็ปไซต์', suggest: 'เว็บไซต์', level: 'error' },
    { word: 'โอกาศ', suggest: 'โอกาส', level: 'error' },
    { word: 'นะค่ะ', suggest: 'นะคะ', level: 'error' },
    { word: 'ผลลัพท์', suggest: 'ผลลัพธ์', level: 'error' },
  ],
  required: [
    { text: 'คณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์', short: 'คณะศิลปศาสตร์', rule: 'firstFull', lang: 'th' },
    { text: 'Faculty of Liberal Arts, Thammasat University', short: 'Faculty of Liberal Arts', rule: 'firstFull', lang: 'en' },
  ],
  signatures: [
    { id: 's1', lang: 'th', text: 'งานประชาสัมพันธ์\nคณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์' },
    { id: 's2', lang: 'en', text: 'Public Relations Unit\nFaculty of Liberal Arts, Thammasat University' },
  ],
};

export async function loadStyle() {
  const s = await repo.get('style', 'main');
  return s ? { ...DEFAULT_STYLE, ...s } : { ...DEFAULT_STYLE };
}

const ev = (fields, extra) => ({ fields: { ...emptyFields(), ...fields }, versionNo: 1, sample: true, ...extra });

export const SAMPLE_EVENTS = [
  ev({
    title: 'ภาษา วัฒนธรรม และ AI: มนุษยศาสตร์ในยุคปัญญาประดิษฐ์',
    titleEn: 'Language, Culture and AI: The Humanities in the Age of Artificial Intelligence',
    eventType: 'seminar', date: '2026-12-15', startTime: '13:00', endTime: '16:00',
    place: 'ห้องประชุมชั้น 2 อาคารคณะศิลปศาสตร์ ศูนย์รังสิต', placeEn: '2nd-floor Meeting Room, Faculty of Liberal Arts Building, Rangsit Campus',
    chair: 'รองศาสตราจารย์ ดร.อรุณี ตัวอย่างดี คณบดีคณะศิลปศาสตร์', chairEn: 'Assoc. Prof. Dr. Arunee Tuayangdee, Dean',
    guests: [
      { name: 'ผู้ช่วยศาสตราจารย์ ดร.ภาณุ สมมติวงศ์', role: 'อาจารย์ประจำสาขาวิชาภาษาศาสตร์', nameEn: 'Asst. Prof. Dr. Panu Sommutwong', roleEn: 'Lecturer in Linguistics' },
      { name: 'คุณนันทนา ทดสอบศรี', role: 'ผู้เชี่ยวชาญด้านเทคโนโลยีภาษา', nameEn: 'Ms. Nantana Todsobsri', roleEn: 'Language Technology Specialist' },
    ],
    audience: 'คณาจารย์ บุคลากร นักศึกษา และผู้สนใจ', audienceEn: 'faculty members, staff, students and the public',
    regLink: 'https://forms.gle/LArtsSample2569', deadline: '2026-12-11',
    contactName: 'คุณพิมพ์ชนก ใจประสาน', contactNameEn: 'Ms. Pimchanok Jaiprasan', phone: '02-000-0000', email: 'pr-sample@example.com',
    notes: 'ไม่มีค่าใช้จ่าย ผู้เข้าร่วมครบตามเวลาจะได้รับเกียรติบัตรอิเล็กทรอนิกส์', notesEn: 'Free of charge. E-certificates will be provided to participants who attend the full session.',
  }, { kind: 'invite' }),
  ev({
    title: 'คณะกรรมการบริหารคณะ ครั้งที่ 12/2569', titleEn: 'Faculty Executive Committee Meeting No. 12/2026',
    eventType: 'meeting', date: '2026-12-03', startTime: '09:30', endTime: '12:00',
    place: 'ห้องประชุมคณะ ชั้น 3', placeEn: 'Faculty Meeting Room, 3rd floor',
    chair: 'รองศาสตราจารย์ ดร.อรุณี ตัวอย่างดี คณบดีคณะศิลปศาสตร์', chairEn: 'Assoc. Prof. Dr. Arunee Tuayangdee, Dean',
    audience: 'กรรมการบริหารคณะ', audienceEn: 'members of the Faculty Executive Committee',
    meetingLink: 'https://zoom.us/j/00000000000', meetingId: '000 0000 0000 (Passcode: sample)',
    contactName: 'คุณสมศรี เลขานุการ', contactNameEn: 'Ms. Somsri Lekhanukarn', phone: '02-000-0001', email: 'secretary-sample@example.com',
    notes: 'ขอให้ศึกษาเอกสารประกอบวาระล่วงหน้า', notesEn: 'Please review the agenda documents in advance.',
  }, { kind: 'meeting' }),
  ev({
    title: 'ค่ายภาษาและวัฒนธรรมสำหรับนักเรียนมัธยมปลาย', titleEn: 'Language and Culture Camp for High School Students',
    eventType: 'student', date: '2026-11-20', endDate: '2026-11-21', startTime: '09:00', endTime: '16:00',
    place: 'อาคารคณะศิลปศาสตร์ ศูนย์รังสิต', placeEn: 'Faculty of Liberal Arts Building, Rangsit Campus',
    chair: 'ผู้ช่วยศาสตราจารย์ ดร.วรรณา ตัวอย่าง รองคณบดีฝ่ายกิจการนักศึกษา', chairEn: 'Asst. Prof. Dr. Wanna Tuayang, Associate Dean for Student Affairs',
    guests: [{ name: 'อาจารย์ ดร.ณัฐ สาธิตกุล', role: 'อาจารย์ประจำสาขาวิชาภาษาญี่ปุ่น', nameEn: 'Dr. Nat Sathitkul', roleEn: 'Lecturer in Japanese' }],
    audience: 'นักเรียนมัธยมศึกษาตอนปลาย', audienceEn: 'high school students',
    notes: 'นักเรียน 120 คนจาก 15 โรงเรียนได้ทดลองเรียนภาษาญี่ปุ่น เกาหลี และฝรั่งเศส พร้อมกิจกรรมแนะแนวการเรียนต่อ (ตัวเลขสมมติ)',
    notesEn: '120 students from 15 schools tried Japanese, Korean and French classes and joined study guidance sessions (sample figures).',
  }, { kind: 'recap' }),
];

// ใส่ข้อมูลตัวอย่างครั้งแรก (ถ้าผู้ใช้ลบข้อมูลตัวอย่างไปแล้วจะไม่ใส่ซ้ำ)
export async function seedIfNeeded() {
  const done = await repo.getMeta('sampleSeed', 0);
  if (done >= 1 || (await repo.getMeta('samplesRemoved', false))) return false;
  for (const e of SAMPLE_EVENTS) await repo.put('events', structuredClone(e), { silent: true });
  await repo.setMeta('sampleSeed', 1);
  return true;
}
