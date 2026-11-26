// L'Arts PR Writer — นิยามข้อมูล: ประเภทโพสต์, โทน, ภาษา, ช่องทาง, ช่องกรอกข้อมูลงาน

export const FACULTY = {
  th: 'คณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์',
  thShort: 'คณะศิลปศาสตร์',
  en: 'the Faculty of Liberal Arts, Thammasat University',
  enShort: 'the Faculty of Liberal Arts',
};

// ประเภทโพสต์ (เทมเพลต 9 แบบ)
export const KINDS = [
  { id: 'invite', th: 'เชิญร่วมงาน', en: 'Invitation' },
  { id: 'meeting', th: 'เชิญประชุม', en: 'Meeting invitation' },
  { id: 'recap', th: 'สรุปกิจกรรม', en: 'Event recap' },
  { id: 'congrats', th: 'แสดงความยินดี', en: 'Congratulations' },
  { id: 'announce', th: 'ประกาศ', en: 'Announcement' },
  { id: 'change', th: 'แจ้งเปลี่ยนแปลงกำหนดการ', en: 'Schedule change' },
  { id: 'reminder', th: 'เตือนลงทะเบียน', en: 'Registration reminder' },
  { id: 'condolence', th: 'ไว้อาลัย', en: 'Condolence' },
  { id: 'thanks', th: 'ขอบคุณ', en: 'Thank-you' },
];

// โทน: emoji = [ต่ำสุด, สูงสุด] ที่เหมาะสม (ใช้ในตัวตรวจ)
export const TONES = [
  { id: 'official', th: 'ราชการ', emoji: [0, 0], desc: 'ภาษาราชการเต็มรูปแบบ ไม่มีอีโมจิ' },
  { id: 'formal', th: 'ทางการ', emoji: [0, 1], desc: 'สุภาพ กระชับ แทบไม่มีอีโมจิ' },
  { id: 'semi', th: 'กึ่งทางการ', emoji: [2, 4], desc: 'สุภาพแต่เป็นมิตร อีโมจิ 2–4 ตัว' },
  { id: 'casual', th: 'ภาษาพูด', emoji: [2, 8], desc: 'เป็นกันเอง เหมือนชวนคุย' },
  { id: 'teen', th: 'วัยรุ่น', emoji: [3, 12], desc: 'สนุก มีพลัง สำหรับนักศึกษา' },
];

export const LANGS = [
  { id: 'th', th: 'ไทย' },
  { id: 'en', th: 'English' },
  { id: 'both', th: 'ไทย + English' },
];

// ช่องทาง: maxLen = เพดานของแพลตฟอร์ม, recLen = ความยาวที่แนะนำ, tags = จำนวนแฮชแท็กที่ใส่อัตโนมัติ
export const CHANNELS = [
  { id: 'facebook', th: 'Facebook', emoji: true, tags: 3, maxTags: 10, recLen: 1500, maxLen: 63206 },
  { id: 'instagram', th: 'Instagram', emoji: true, tags: 6, maxTags: 30, recLen: 1500, maxLen: 2200, noClickLinks: true },
  { id: 'line', th: 'LINE OA', emoji: true, tags: 0, maxTags: 0, recLen: 600, maxLen: 5000 },
  { id: 'x', th: 'X', emoji: true, tags: 2, maxTags: 3, recLen: 280, maxLen: 280, short: true },
  { id: 'email', th: 'อีเมล', emoji: false, tags: 0, maxTags: 0, recLen: 3000, maxLen: 100000, subject: true },
  { id: 'circular', th: 'หนังสือเวียน', emoji: false, tags: 0, maxTags: 0, recLen: 3000, maxLen: 100000, subject: true, forceTone: 'official' },
  { id: 'web', th: 'ข่าวเว็บไซต์', emoji: false, tags: 0, maxTags: 0, recLen: 4000, maxLen: 100000, subject: true },
  { id: 'poster', th: 'ข้อความโปสเตอร์', emoji: false, tags: 1, maxTags: 2, recLen: 400, maxLen: 2000, poster: true },
];

export const EVENT_TYPES = [
  // th = ใช้ในประโยคทางการ, thc = ภาษาพูด, en = ภาษาอังกฤษ
  { id: 'seminar', label: 'สัมมนา / เสวนา', th: 'การสัมมนา', thc: 'งานสัมมนา', en: 'seminar' },
  { id: 'lecture', label: 'บรรยายพิเศษ', th: 'การบรรยายพิเศษ', thc: 'งานบรรยายพิเศษ', en: 'special lecture' },
  { id: 'conference', label: 'ประชุมวิชาการ', th: 'การประชุมวิชาการ', thc: 'งานประชุมวิชาการ', en: 'academic conference' },
  { id: 'workshop', label: 'อบรม / เวิร์กช็อป', th: 'การอบรมเชิงปฏิบัติการ', thc: 'เวิร์กช็อป', en: 'workshop' },
  { id: 'meeting', label: 'ประชุม', th: 'การประชุม', thc: 'การประชุม', en: 'meeting' },
  { id: 'student', label: 'กิจกรรมนักศึกษา', th: 'กิจกรรม', thc: 'กิจกรรม', en: 'student activity' },
  { id: 'ceremony', label: 'พิธี / งานพิธีการ', th: 'พิธี', thc: 'งานพิธี', en: 'ceremony' },
  { id: 'exhibition', label: 'นิทรรศการ', th: 'นิทรรศการ', thc: 'นิทรรศการ', en: 'exhibition' },
  { id: 'admission', label: 'รับสมัคร / ทุน', th: 'การรับสมัคร', thc: 'การรับสมัคร', en: 'application call' },
  { id: 'other', label: 'อื่น ๆ', th: 'กิจกรรม', thc: 'กิจกรรม', en: 'event' },
];

// ช่องกรอกข้อมูลงาน: en = มีช่องภาษาอังกฤษคู่กัน (ชื่อช่อง + 'En')
export const FIELDS = [
  { key: 'title', label: 'ชื่องาน / เรื่อง', en: true, group: 'main' },
  { key: 'eventType', label: 'ประเภทงาน', type: 'eventType', group: 'main' },
  { key: 'date', label: 'วันที่', type: 'date', group: 'main' },
  { key: 'endDate', label: 'ถึงวันที่ (ถ้าจัดหลายวัน)', type: 'date', group: 'main' },
  { key: 'startTime', label: 'เวลาเริ่ม', type: 'time', group: 'main' },
  { key: 'endTime', label: 'เวลาสิ้นสุด', type: 'time', group: 'main' },
  { key: 'place', label: 'สถานที่', en: true, group: 'main' },
  { key: 'organizer', label: 'หน่วยงานที่จัด', en: true, group: 'people', hint: 'เว้นว่าง = คณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์' },
  { key: 'chair', label: 'ประธาน / ผู้ดำเนินรายการ', en: true, group: 'people', hint: 'ใส่คำนำหน้า ตำแหน่งวิชาการ และตำแหน่งให้ครบ' },
  { key: 'guests', label: 'วิทยากร / แขกผู้มีเกียรติ', type: 'guests', group: 'people' },
  { key: 'audience', label: 'กลุ่มเป้าหมาย', en: true, group: 'reg', hint: 'เช่น คณาจารย์ บุคลากร นักศึกษา และผู้สนใจ' },
  { key: 'regLink', label: 'ลิงก์ลงทะเบียน', type: 'url', group: 'reg' },
  { key: 'deadline', label: 'ปิดรับลงทะเบียน', type: 'date', group: 'reg' },
  { key: 'meetingLink', label: 'ลิงก์ประชุมออนไลน์', type: 'url', group: 'reg' },
  { key: 'meetingId', label: 'Meeting ID / Passcode', group: 'reg' },
  { key: 'contactName', label: 'ผู้ประสานงาน', en: true, group: 'contact' },
  { key: 'phone', label: 'โทรศัพท์', type: 'tel', group: 'contact' },
  { key: 'email', label: 'อีเมล', type: 'email', group: 'contact' },
  { key: 'notes', label: 'รายละเอียดเพิ่มเติม', en: true, type: 'textarea', group: 'more' },
];

export const GROUPS = [
  ['main', 'ข้อมูลหลัก'],
  ['people', 'ผู้จัดและบุคคล'],
  ['reg', 'ผู้เข้าร่วม ลงทะเบียน และออนไลน์'],
  ['contact', 'ผู้ติดต่อ'],
  ['more', 'รายละเอียด'],
];

// ป้ายช่องที่เปลี่ยนตามประเภทโพสต์ (ช่องเดิม ความหมายเหมาะกับเรื่องนั้น)
export const KIND_LABELS = {
  congrats: { title: 'ผลงาน / รางวัล (ขึ้นต้นด้วยกริยา เช่น “ได้รับรางวัล…”)', guests: 'ผู้ได้รับรางวัล / ผู้ที่แสดงความยินดี', date: 'วันที่ (ถ้ามี)' },
  condolence: { title: 'ข้อความเพิ่มเติม (ถ้ามี เช่น “ถึงแก่กรรมเมื่อ…”)', guests: 'ผู้วายชนม์ (ชื่อ และตำแหน่ง)', date: 'วันพิธี (ถ้ามี)', place: 'สถานที่ประกอบพิธี', notes: 'รายละเอียดพิธี' },
  thanks: { guests: 'ผู้ที่ต้องการขอบคุณ (บุคคล / หน่วยงาน)', title: 'ชื่องานที่ขอบคุณ' },
  announce: { title: 'เรื่องที่ประกาศ', notes: 'เนื้อหาประกาศ', date: 'วันที่เกี่ยวข้อง (ถ้ามี)' },
  change: { notes: 'รายละเอียดการเปลี่ยนแปลง (ถ้าไม่ได้ใช้ “แก้ไขและแจ้งเปลี่ยนแปลง”)' },
  meeting: { title: 'ชื่อการประชุม (เช่น คณะกรรมการประจำคณะ ครั้งที่ 12/2569)', notes: 'วาระ / รายละเอียด' },
  recap: { notes: 'สรุปเนื้อหา / ไฮไลต์ของงาน' },
};

// ช่องที่ต้องมีสำหรับแต่ละประเภท ('a|b' = อย่างใดอย่างหนึ่ง)
export const REQUIRED = {
  invite: ['title', 'date', 'startTime', 'place|meetingLink'],
  meeting: ['title', 'date', 'startTime', 'place|meetingLink'],
  recap: ['title', 'date'],
  congrats: ['title', 'guests'],
  announce: ['title', 'notes'],
  change: ['title', 'notes|changes'],
  reminder: ['title', 'deadline', 'regLink'],
  condolence: ['guests'],
  thanks: ['title', 'guests'],
};

export const fieldLabel = (key, kind) => {
  const base = key.endsWith('En') && key !== 'En' ? key.slice(0, -2) : key;
  const f = FIELDS.find((x) => x.key === base);
  const lbl = (KIND_LABELS[kind] && KIND_LABELS[kind][base]) || (f ? f.label : key);
  return key === base ? lbl : lbl.replace(/\s*\(.*\)$/, '') + ' (อังกฤษ)';
};

export const kindOf = (id) => KINDS.find((k) => k.id === id) || KINDS[0];
export const channelOf = (id) => CHANNELS.find((c) => c.id === id) || CHANNELS[0];
export const eventTypeOf = (id) => EVENT_TYPES.find((t) => t.id === id) || EVENT_TYPES[EVENT_TYPES.length - 1];

// โทนที่ผู้ใช้สร้างเอง: { id: 'custom:xxx', th, base, desc, emoji }
export function toneOf(id, customTones = []) {
  return TONES.find((t) => t.id === id) || customTones.find((t) => t.id === id) || TONES[2];
}
export const baseTone = (id, customTones = []) => {
  const t = toneOf(id, customTones);
  return t.base || t.id;
};

export function emptyFields() {
  const f = { guests: [] };
  for (const x of FIELDS) {
    if (x.type === 'guests') continue;
    f[x.key] = x.key === 'eventType' ? 'seminar' : '';
    if (x.en) f[x.key + 'En'] = '';
  }
  return f;
}

export const DEFAULT_SETTINGS = {
  particle: 'none', // none | khrap | kha
  tone: 'semi',
  lang: 'th',
  channel: 'facebook',
  kind: 'invite',
  draftModel: 'claude-haiku-5-5',
  polishModel: 'claude-sonnet-5-5',
  customTones: [],
};
