// ทดสอบตรรกะของ L'Arts PR Writer (ไม่ต้องเปิดเบราว์เซอร์): node test/pr-unit.mjs
import { fmtDate, fmtRange, fmtTime, findDates } from '../public/pr/dates.js';
import { renderPost, countEmoji } from '../public/pr/templates.js';
import { checkPost, applyFix, xLength, findLinks } from '../public/pr/checker.js';
import { KINDS, TONES, LANGS, CHANNELS } from '../public/pr/fields.js';
import { SAMPLE_EVENTS, DEFAULT_STYLE } from '../public/pr/sample.js';

let failures = 0, passed = 0;
const ok = (cond, msg) => { if (cond) passed++; else { failures++; console.log('  ✗ ' + msg); } };
const eq = (a, b, msg) => ok(a === b, `${msg}\n      ได้: ${JSON.stringify(a)}\n      ควรได้: ${JSON.stringify(b)}`);

console.log('PR Writer: วันที่และเวลา');
eq(fmtDate('2026-12-15', 'th'), 'วันอังคารที่ 15 ธันวาคม 2569', 'วันที่ไทยเต็ม');
eq(fmtDate('2026-12-15', 'en'), 'Tuesday, 15 December 2026', 'วันที่อังกฤษเต็ม');
eq(fmtDate('2026-12-15', 'th', { short: true }), 'วันอังคารที่ 15 ธ.ค. 2569', 'วันที่ไทยย่อ');
eq(fmtRange('2026-12-15', '2026-12-16', 'th'), 'วันอังคารที่ 15 – วันพุธที่ 16 ธันวาคม 2569', 'ช่วงวันที่เดือนเดียวกัน');
eq(fmtRange('2026-12-31', '2027-01-02', 'en'), 'Thursday, 31 December 2026 – Saturday, 2 January 2027', 'ช่วงวันที่ข้ามปี');
eq(fmtTime('13:00', '16:00', 'th'), '13.00–16.00 น.', 'เวลาไทย');
eq(fmtTime('09:30', '12:00', 'en'), '9:30 a.m. – 12:00 p.m.', 'เวลาอังกฤษ');
eq(fmtTime('09:00', '', 'th'), '09.00 น. เป็นต้นไป', 'เวลาเริ่มอย่างเดียว');

console.log('PR Writer: อ่านวันที่และตรวจวันในสัปดาห์');
const cases = [
  // [ข้อความ, วันที่ที่ควรอ่านได้, วันถูกไหม]
  ['วันจันทร์ที่ 15 ธันวาคม 2569', '2026-12-15', false],
  ['วันอังคารที่ 15 ธันวาคม 2569', '2026-12-15', true],
  ['๑๕ ธ.ค. ๖๙ (จันทร์)', '2026-12-15', false],
  ['วันอังคารที่ ๑๕ ธ.ค. ๒๕๖๙', '2026-12-15', true],
  ['(อ.) 15 ธ.ค. 69', '2026-12-15', true],
  ['15 ธ.ค. 2569 (วันพุธ)', '2026-12-15', false],
  ['วันพฤหัสบดีที่ 3 ธันวาคม พ.ศ. 2569', '2026-12-03', true],
  ['วันพฤหัสที่ 3 ธ.ค. 2569', '2026-12-03', true],
  ['Monday, 15 December 2026', '2026-12-15', false],
  ['Tue 15 Dec 2026', '2026-12-15', true],
  ['Tuesday, December 15, 2026', '2026-12-15', true],
  ['วันอังคารที่ 15/12/2569', '2026-12-15', true],
  ['วันศุกร์ที่ 15/12/2026', '2026-12-15', false],
];
for (const [text, iso, right] of cases) {
  const d = findDates(text, 2026)[0];
  ok(d && d.iso === iso, `อ่าน “${text}” เป็น ${iso} (ได้ ${d && d.iso})`);
  if (d) ok((d.stated === d.actual) === right, `“${text}” ควร${right ? 'ถูก' : 'ผิด'}วัน`);
}
const range = findDates('วันศุกร์ที่ 1 – วันอาทิตย์ที่ 3 มกราคม 2570', 2026);
ok(range.length === 2 && range[0].iso === '2027-01-01' && range[1].iso === '2027-01-03' && range.every((d) => d.stated === d.actual), 'ช่วงวันที่ไทย 2 วัน วันถูกทั้งคู่');
const badRange = findDates('วันจันทร์ที่ 15 – วันอังคารที่ 16 ธันวาคม 2569', 2026);
ok(badRange.length === 2 && badRange.every((d) => d.stated !== d.actual), 'ช่วงวันที่ที่วันผิดทั้งคู่');
ok(findDates('วันที่ 29 กุมภาพันธ์ 2569', 2026)[0].valid === false, '29 ก.พ. 2569 ไม่มีจริง');
ok(findDates('วันที่ 29 กุมภาพันธ์ 2571', 2026)[0].valid === true, '29 ก.พ. 2571 มีจริง (ปีอธิกสุรทิน)');
ok(findDates('การประชุมครั้งที่ 12/2569 เวลา 09.00–12.00 น.', 2026).length === 0, 'เลขครั้งที่ประชุมและเวลาไม่ถูกอ่านเป็นวันที่');

console.log('PR Writer: ตัวตรวจก่อนโพสต์');
const style = DEFAULT_STYLE;
const fields = SAMPLE_EVENTS[0].fields;
const ctx = { fields, kind: 'invite', tone: 'semi', channel: 'facebook', lang: 'th', style, settings: {} };
let r = checkPost('คณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์ ขอเชิญร่วมงาน วันจันทร์ที่ 15 ธันวาคม 2569 เวลา 13.00–16.00 น.', ctx);
const wd = r.items.find((i) => i.code === 'weekday');
ok(wd && wd.level === 'error' && /วันอังคาร/.test(wd.msg), 'จับวันผิด: 15 ธ.ค. 2569 เป็นวันอังคาร');
eq(applyFix('งานวันจันทร์ที่ 15 ธันวาคม 2569', wd.fix), 'งานวันอังคารที่ 15 ธันวาคม 2569', 'ปุ่มแก้วันให้ถูก');
r = checkPost('ปิดรับ ๑๕ ธ.ค. ๖๙ (จันทร์)', ctx);
const wd2 = r.items.find((i) => i.code === 'weekday');
eq(applyFix('ปิดรับ ๑๕ ธ.ค. ๖๙ (จันทร์)', wd2.fix), 'ปิดรับ ๑๕ ธ.ค. ๖๙ (อังคาร)', 'แก้วันโดยคงเลขไทยไว้');
r = checkPost('จัดวันที่ 15 ธันวาคม 2026', ctx);
const era = r.items.find((i) => i.code === 'era');
ok(era && /2569/.test(era.msg), 'ภาษาไทยใช้ ค.ศ. → เตือนให้ใช้ พ.ศ.');
eq(applyFix('จัดวันที่ 15 ธันวาคม 2026', era.fix), 'จัดวันที่ 15 ธันวาคม 2569', 'แก้ปีเป็น พ.ศ.');
r = checkPost('Tuesday, 15 December 2569', { ...ctx, lang: 'en' });
ok(r.items.some((i) => i.code === 'era' && /2026/.test(i.msg)), 'ภาษาอังกฤษใช้ พ.ศ. → เตือนให้ใช้ ค.ศ.');
r = checkPost('ลงทะเบียน forms.gle/abcเพื่อรับสิทธิ์', ctx);
ok(r.items.filter((i) => i.code === 'link-format').length === 2, 'ลิงก์ไม่มี https และมีภาษาไทยติดท้าย');
eq(findLinks('ดูที่ https://example.com/a.')[0].url, 'https://example.com/a', 'ตัดจุดท้ายลิงก์');
r = checkPost('ขอเชิญร่วมสัมนา คลิ๊ก ลงทะเบียนนะค่ะ', ctx);
ok(r.items.filter((i) => i.code === 'banned').length === 3, 'จับคำต้องห้าม 3 คำ');
r = checkPost('คณะศิลปศาสตร์ขอเชิญ', ctx);
ok(r.items.some((i) => i.code === 'required'), 'กล่าวถึงคณะครั้งแรกไม่ใช้ชื่อเต็ม');
r = checkPost('ข้อความ', { ...ctx, fields: { guests: [] } });
ok(r.items.some((i) => i.code === 'missing'), 'แจ้งช่องที่ยังไม่กรอก');
r = checkPost('ขอแสดงความอาลัย 🙏', { ...ctx, kind: 'condolence', fields: { guests: [{ name: 'ก' }] } });
ok(r.items.some((i) => i.code === 'condolence-emoji' && i.level === 'error'), 'ไว้อาลัยห้ามมีอีโมจิ');
r = checkPost('ก'.repeat(300), { ...ctx, channel: 'x' });
ok(r.items.some((i) => i.code === 'len' && i.level === 'error'), 'X ยาวเกิน 280');
eq(xLength('ดู https://example.com/very/long/path/that/is/long'), 26, 'X นับลิงก์เป็น 23 ตัวอักษร');
r = checkPost('“ผศ.ดร.สมชาย ใจดี” บรรยาย', { ...ctx, staff: [{ nameTh: 'สมชาย ใจดี', titleTh: 'รองศาสตราจารย์ ดร.' }] });
ok(r.items.some((i) => i.code === 'staff-title'), 'ตำแหน่งวิชาการไม่ตรงฐานข้อมูลบุคลากร');

console.log('PR Writer: เทมเพลตทุกแบบ (9 ประเภท × 5 โทน × 3 ภาษา × 8 ช่องทาง)');
let combos = 0, weekdayErrors = 0, junk = 0, emojiLeak = 0, xOver = 0;
for (const ev of SAMPLE_EVENTS) {
  for (const k of KINDS) for (const t of TONES) for (const l of LANGS) for (const c of CHANNELS) {
    const out = renderPost(ev.fields, { kind: k.id, tone: t.id, channel: c.id, lang: l.id, style, settings: { particle: 'kha' } });
    combos++;
    if (/undefined|null|\{\{|\}\}|\[\[|\]\]/.test(out.text + out.subject)) { junk++; if (junk < 4) console.log('    ข้อความแปลก:', k.id, t.id, l.id, c.id, out.text.slice(0, 200)); }
    const res = checkPost(out.text, { fields: ev.fields, kind: k.id, tone: t.id, channel: c.id, lang: l.id, style, settings: {}, subject: out.subject });
    if (res.items.some((i) => i.code === 'weekday' || i.code === 'date-invalid' || i.code === 'era')) weekdayErrors++;
    if ((!c.emoji || k.id === 'condolence' || t.id === 'official') && countEmoji(out.text + out.subject)) emojiLeak++;
    if (c.id === 'x' && l.id !== 'both' && xLength(out.text) > 280) { xOver++; if (xOver < 3) console.log('    X ยาวเกิน:', k.id, t.id, l.id, xLength(out.text)); }
  }
}
ok(combos === 3 * 9 * 5 * 3 * 8, `สร้างครบ ${combos} แบบ`);
eq(junk, 0, 'ไม่มีตัวแปรค้าง / undefined / null ในผลลัพธ์');
eq(weekdayErrors, 0, 'ผลลัพธ์จากเทมเพลตไม่มีวันผิด/ปีผิดเลย');
eq(emojiLeak, 0, 'ไม่มีอีโมจิในช่องทาง/โทน/ประเภทที่ห้ามอีโมจิ');
eq(xOver, 0, 'ข้อความ X (ภาษาเดียว) ไม่เกิน 280 ตัวอักษร');

const th = renderPost(SAMPLE_EVENTS[0].fields, { kind: 'invite', tone: 'official', channel: 'email', lang: 'th', style, settings: {} });
ok(th.text.startsWith('เรียน คณาจารย์') && th.text.includes('ขอแสดงความนับถือ') && th.text.includes('งานประชาสัมพันธ์'), 'อีเมลมีคำขึ้นต้น คำลงท้าย และลายเซ็น');
ok(th.subject.includes('ขอเชิญร่วมการสัมมนา'), 'อีเมลมีหัวเรื่อง');
const circ = renderPost(SAMPLE_EVENTS[0].fields, { kind: 'invite', tone: 'teen', channel: 'circular', lang: 'th', style, settings: {} });
ok(circ.text.startsWith('เรื่อง  ') && circ.text.includes('จึงเรียนมาเพื่อโปรดทราบ') && circ.toneId === 'official', 'หนังสือเวียนใช้โทนราชการเสมอ');
const prev = { ...SAMPLE_EVENTS[0].fields, date: '2026-12-10', place: 'ห้องเดิม', placeEn: 'Old room' };
const ch = renderPost(SAMPLE_EVENTS[0].fields, { kind: 'change', tone: 'formal', channel: 'email', lang: 'th', style, settings: {}, prevFields: prev });
ok(ch.subject.startsWith('[แจ้งเปลี่ยนแปลง]'), 'หัวเรื่องแจ้งเปลี่ยนแปลงขึ้นต้นด้วย [แจ้งเปลี่ยนแปลง]');
ok(/จากเดิม วันพฤหัสบดีที่ 10 ธันวาคม 2569 เปลี่ยนเป็น วันอังคารที่ 15 ธันวาคม 2569/.test(ch.text), 'แสดงวันที่เดิม → ใหม่');
ok(/เวลา: 13\.00–16\.00 น\. \(ไม่เปลี่ยนแปลง\)/.test(ch.text), 'ข้อมูลที่ไม่เปลี่ยนมี (ไม่เปลี่ยนแปลง)');
ok(ch.text.includes('ขออภัยในความไม่สะดวก'), 'มีคำขออภัย');
const en = renderPost({ ...SAMPLE_EVENTS[0].fields, placeEn: '' }, { kind: 'invite', tone: 'semi', channel: 'facebook', lang: 'en', style, settings: {} });
ok(en.text.includes('[กรอก: สถานที่ (อังกฤษ)]'), 'ภาษาอังกฤษที่ยังไม่กรอก แสดง [กรอก: …]');

console.log(failures ? `\n✗ ไม่ผ่าน ${failures} ข้อ (ผ่าน ${passed})` : `\n✓ ผ่านทั้งหมด ${passed} ข้อ`);
process.exit(failures ? 1 : 0);
