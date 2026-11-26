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

// บุคลากรตัวอย่าง (ชื่อสมมติ) — อาจารย์ ดร.ณัฐ ในฐานข้อมูลเป็น “ผู้ช่วยศาสตราจารย์ ดร.” แต่ในงานค่ายตัวอย่างเขียนว่า “อาจารย์ ดร.”
// เพื่อให้เห็นว่าตัวตรวจเทียบตำแหน่งวิชาการกับฐานข้อมูลอย่างไร
export const SAMPLE_STAFF = [
  { titleTh: 'รองศาสตราจารย์ ดร.', nameTh: 'อรุณี ตัวอย่างดี', titleEn: 'Assoc. Prof. Dr.', nameEn: 'Arunee Tuayangdee', positionTh: 'คณบดีคณะศิลปศาสตร์', positionEn: 'Dean', unit: 'สำนักงานคณบดี', email: 'dean-sample@example.com', phone: '02-000-0010' },
  { titleTh: 'ผู้ช่วยศาสตราจารย์ ดร.', nameTh: 'วรรณา ตัวอย่าง', titleEn: 'Asst. Prof. Dr.', nameEn: 'Wanna Tuayang', positionTh: 'รองคณบดีฝ่ายกิจการนักศึกษา', positionEn: 'Associate Dean for Student Affairs', unit: 'งานกิจการนักศึกษา', email: 'wanna-sample@example.com', phone: '02-000-0011' },
  { titleTh: 'ผู้ช่วยศาสตราจารย์ ดร.', nameTh: 'ภาณุ สมมติวงศ์', titleEn: 'Asst. Prof. Dr.', nameEn: 'Panu Sommutwong', positionTh: 'อาจารย์ประจำสาขาวิชาภาษาศาสตร์', positionEn: 'Lecturer in Linguistics', unit: 'สาขาวิชาภาษาศาสตร์', email: 'panu-sample@example.com', phone: '' },
  { titleTh: 'ผู้ช่วยศาสตราจารย์ ดร.', nameTh: 'ณัฐ สาธิตกุล', titleEn: 'Asst. Prof. Dr.', nameEn: 'Nat Sathitkul', positionTh: 'อาจารย์ประจำสาขาวิชาภาษาญี่ปุ่น', positionEn: 'Lecturer in Japanese', unit: 'สาขาวิชาภาษาญี่ปุ่น', email: 'nat-sample@example.com', phone: '' },
  { titleTh: 'อาจารย์', nameTh: 'กานต์ ทดลองใช้', titleEn: 'Ajarn', nameEn: 'Karn Thodlongchai', positionTh: 'อาจารย์ประจำสาขาวิชาภาษาฝรั่งเศส', positionEn: 'Lecturer in French', unit: 'สาขาวิชาภาษาฝรั่งเศส', email: 'karn-sample@example.com', phone: '' },
  { titleTh: 'คุณ', nameTh: 'พิมพ์ชนก ใจประสาน', titleEn: 'Ms.', nameEn: 'Pimchanok Jaiprasan', positionTh: 'นักประชาสัมพันธ์', positionEn: 'Public Relations Officer', unit: 'งานประชาสัมพันธ์', email: 'pr-sample@example.com', phone: '02-000-0000' },
  { titleTh: 'คุณ', nameTh: 'สมศรี เลขานุการ', titleEn: 'Ms.', nameEn: 'Somsri Lekhanukarn', positionTh: 'เลขานุการคณะ', positionEn: 'Faculty Secretary', unit: 'สำนักงานคณบดี', email: 'secretary-sample@example.com', phone: '02-000-0001' },
].map((x) => ({ ...x, sample: true }));

const M = (postedAt, reach, reactions, comments, shares, clicks) => ({ postedAt, metrics: { reach, reactions, comments, shares, clicks } });
const SAMPLE_POST_METRICS = [M('2026-09-09T12:15', 4800, 420, 31, 52, 160), M('2026-10-16T17:40', 3300, 230, 14, 20, 25), M('2026-11-20T12:00', 2400, 95, 12, 6, 230)];
const SAMPLE_POST_METRICS_FOR = (i) => SAMPLE_POST_METRICS[i] || { metrics: {} };

// โพสต์ที่ใช้จริงตัวอย่าง (อยู่ในคลังโพสต์ ใช้เป็นตัวอย่างให้ AI) — งาน ชื่อ และลิงก์สมมติ
export const SAMPLE_POSTS = [
  { kind: 'invite', channel: 'facebook', tone: 'semi', lang: 'th', eventType: 'seminar', tags: ['วิชาการ'],
    text: `📢 ขอเชิญร่วมเสวนา “แปลอย่างไรให้ได้ใจ: นักแปลกับวรรณกรรมร่วมสมัย”
คณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์ ชวนนักศึกษาและผู้สนใจมาฟังมุมมองจากนักแปลมืออาชีพ พร้อมเปิดช่วงถาม–ตอบ

📅 วันพุธที่ 9 กันยายน 2569
• เวลา 13.30–15.30 น.
📍 ห้องประชุมชั้น 2 อาคารคณะศิลปศาสตร์ ศูนย์รังสิต
• ลงทะเบียน: https://forms.gle/SampleOldPost1

เข้าร่วมฟรี ไม่มีค่าใช้จ่าย

#คณะศิลปศาสตร์ #ศิลปศาสตร์ธรรมศาสตร์ #LiberalArtsTU` },
  { kind: 'recap', channel: 'facebook', tone: 'formal', lang: 'th', eventType: 'lecture', tags: ['บรรยายพิเศษ'],
    text: `คณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์ จัดการบรรยายพิเศษ “ภาษากับอัตลักษณ์ในโลกออนไลน์” เมื่อวันศุกร์ที่ 16 ตุลาคม 2569 ณ ห้องประชุมคณะ ชั้น 3
ในโอกาสนี้ ได้รับเกียรติจากผู้ช่วยศาสตราจารย์ ดร.ภาณุ สมมติวงศ์ ร่วมบรรยายและแลกเปลี่ยนความรู้กับนักศึกษากว่า 80 คน (ตัวเลขสมมติ)
ขอขอบคุณผู้เข้าร่วมทุกท่าน

#คณะศิลปศาสตร์ #ศิลปศาสตร์ธรรมศาสตร์ #LiberalArtsTU` },
  { kind: 'announce', channel: 'line', tone: 'casual', lang: 'th', eventType: 'admission', tags: ['ทุน'],
    text: `📢 มีข่าวมาแจ้ง! เปิดรับสมัครทุนสนับสนุนการแลกเปลี่ยนระยะสั้น (ตัวอย่าง)
นักศึกษาชั้นปีที่ 2–3 สมัครได้ถึงวันจันทร์ที่ 30 พฤศจิกายน 2569 นะ
📝 สมัคร: https://forms.gle/SampleOldPost3
สงสัยตรงไหน ทักงานกิจการนักศึกษาได้เลย 🙏
(จาก คณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์)` },
].map((p, i) => ({ ...p, subject: '', status: 'posted', source: 'manual', sample: true, ...SAMPLE_POST_METRICS_FOR(i) }));

// ผลการโพสต์ตัวอย่าง (ตัวเลขสมมติ) สำหรับหน้า “สถิติและรายงาน” — ไม่ใช้เป็นตัวอย่างให้ AI
export const SAMPLE_METRIC_POSTS = [
  ['invite', 'facebook', 'semi', 'seminar', M('2026-07-08T12:10', 4200, 310, 24, 41, 120)],
  ['invite', 'instagram', 'casual', 'student', M('2026-07-15T19:30', 2600, 280, 35, 12, 40)],
  ['recap', 'facebook', 'formal', 'ceremony', M('2026-07-27T09:05', 3100, 190, 10, 15, 30)],
  ['reminder', 'line', 'casual', 'seminar', M('2026-08-04T12:00', 1800, 60, 6, 3, 210)],
  ['announce', 'facebook', 'official', 'admission', M('2026-08-12T10:00', 5200, 150, 30, 60, 340)],
  ['invite', 'x', 'teen', 'student', M('2026-08-20T20:15', 900, 45, 4, 9, 18)],
  ['congrats', 'facebook', 'semi', 'other', M('2026-09-02T12:30', 6100, 640, 85, 33, 20)],
  ['recap', 'instagram', 'semi', 'workshop', M('2026-09-18T18:00', 2200, 240, 18, 6, 15)],
  ['invite', 'facebook', 'formal', 'lecture', M('2026-10-06T09:30', 3500, 160, 12, 20, 95)],
  ['reminder', 'email', 'formal', 'conference', M('2026-10-14T08:45', 1200, 0, 0, 0, 160)],
  ['thanks', 'facebook', 'semi', 'conference', M('2026-10-29T12:20', 3900, 300, 22, 18, 25)],
  ['invite', 'line', 'casual', 'workshop', M('2026-11-03T12:05', 2000, 80, 9, 4, 190)],
  ['announce', 'instagram', 'teen', 'student', M('2026-11-12T19:45', 3000, 360, 40, 15, 35)],
].map(([kind, channel, tone, eventType, extra], i) => ({
  kind, channel, tone, eventType, lang: 'th', subject: '', tags: [], status: 'posted', source: 'manual', noExample: true, statsOnly: true, sample: true,
  text: `(โพสต์ตัวอย่างสำหรับสถิติ ${i + 1}) ${channel} · ${kind}`, ...extra,
}));
// ใส่ข้อมูลตัวอย่างครั้งแรก และเพิ่มชุดใหม่เมื่ออัปเดตเฟส (ถ้าผู้ใช้ลบข้อมูลตัวอย่างไปแล้วจะไม่ใส่ซ้ำ)
export const SAMPLE_VERSION = 4;
export async function seedIfNeeded() {
  const done = await repo.getMeta('sampleSeed', 0);
  if (done >= SAMPLE_VERSION || (await repo.getMeta('samplesRemoved', false))) return false;
  if (done < 1) for (const e of SAMPLE_EVENTS) await repo.put('events', structuredClone(e), { silent: true });
  if (done < 2) for (const x of SAMPLE_STAFF) await repo.put('staff', structuredClone(x), { silent: true });
  if (done < 3) for (const x of SAMPLE_POSTS) await repo.put('posts', structuredClone(x), { silent: true });
  if (done < 4) {
    // ใส่ตัวเลขผลให้โพสต์ตัวอย่างในคลังที่มีอยู่แล้ว (ถ้ายังไม่มี) และเพิ่มโพสต์ตัวอย่างสำหรับสถิติ
    const existing = (await repo.list('posts')).filter((p) => p.sample && p.source === 'manual');
    for (const [i, x] of SAMPLE_POSTS.entries()) {
      const hit = existing.find((p) => p.text === x.text && !(p.metrics && p.metrics.reach));
      if (hit) await repo.put('posts', { ...hit, ...SAMPLE_POST_METRICS_FOR(i) }, { silent: true });
    }
    for (const x of SAMPLE_METRIC_POSTS) await repo.put('posts', structuredClone(x), { silent: true });
  }
  await repo.setMeta('sampleSeed', SAMPLE_VERSION);
  return true;
}
