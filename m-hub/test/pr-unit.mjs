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

console.log('PR Writer เฟส 2: บุคลากร เวอร์ชัน ชุดโพสต์ โปสเตอร์');
const { fullName, nameWithPosition, searchStaff, rowsToStaff } = await import('../public/pr/staff.js');
const { diffFields, changeSummary } = await import('../public/pr/versions.js');
const { planCampaign, renderStage } = await import('../public/pr/campaign.js');
const { headlineCandidates } = await import('../public/pr/ui-poster.js');
const { SAMPLE_STAFF } = await import('../public/pr/sample.js');
const dean = SAMPLE_STAFF[0];
eq(fullName(dean, 'th'), 'รองศาสตราจารย์ ดร.อรุณี ตัวอย่างดี', 'ชื่อไทยต่อคำนำหน้าแบบไม่เว้นหลัง ดร.');
eq(fullName({ titleTh: 'อาจารย์', nameTh: 'กานต์ ทดลองใช้' }, 'th'), 'อาจารย์ กานต์ ทดลองใช้', 'อาจารย์ + ชื่อ เว้นวรรค');
eq(fullName({ titleTh: 'นางสาว', nameTh: 'สมศรี ใจดี' }, 'th'), 'นางสาวสมศรี ใจดี', 'นางสาว + ชื่อ ไม่เว้นวรรค');
eq(nameWithPosition(dean, 'en'), 'Assoc. Prof. Dr. Arunee Tuayangdee, Dean', 'ชื่อ + ตำแหน่งภาษาอังกฤษ');
eq(searchStaff(SAMPLE_STAFF, 'ผศ.ดร.ภาณุ').map((s) => s.nameTh).join(), 'ภาณุ สมมติวงศ์', 'ค้นชื่อโดยพิมพ์คำนำหน้าย่อมาด้วยก็เจอ');
eq(searchStaff(SAMPLE_STAFF, 'arunee').length, 1, 'ค้นด้วยชื่ออังกฤษ');
const imp = rowsToStaff(['ชื่อ-นามสกุล (ไทย)', 'ชื่อ-นามสกุล (อังกฤษ)', 'คำนำหน้า/ตำแหน่งวิชาการ (ไทย)', 'คำนำหน้า/ตำแหน่งวิชาการ (อังกฤษ)', 'ตำแหน่ง (ไทย)', 'ตำแหน่ง (อังกฤษ)', 'หน่วยงาน / สาขา', 'อีเมล', 'โทรศัพท์'],
  [{ 'ชื่อ-นามสกุล (ไทย)': 'ก ข', 'ชื่อ-นามสกุล (อังกฤษ)': 'K K', 'คำนำหน้า/ตำแหน่งวิชาการ (ไทย)': 'ผู้ช่วยศาสตราจารย์', 'คำนำหน้า/ตำแหน่งวิชาการ (อังกฤษ)': 'Asst. Prof.', 'ตำแหน่ง (ไทย)': 'อาจารย์', 'ตำแหน่ง (อังกฤษ)': 'Lecturer', 'หน่วยงาน / สาขา': 'x', 'อีเมล': 'a@b.c', 'โทรศัพท์': '1' }]);
ok(imp.list[0].titleTh === 'ผู้ช่วยศาสตราจารย์' && imp.list[0].titleEn === 'Asst. Prof.' && imp.list[0].positionEn === 'Lecturer' && imp.list[0].phone === '1', 'นำเข้า CSV จับคอลัมน์ถูกทุกช่อง');
const recapEv = SAMPLE_EVENTS[2];
const out3 = renderPost(recapEv.fields, { kind: 'recap', tone: 'formal', channel: 'facebook', lang: 'th', style, settings: {} });
const r3 = checkPost(out3.text, { fields: recapEv.fields, kind: 'recap', tone: 'formal', channel: 'facebook', lang: 'th', style, settings: {}, staff: SAMPLE_STAFF });
ok(r3.items.some((i) => i.code === 'staff-title' && /ผู้ช่วยศาสตราจารย์ ดร\./.test(i.msg)), 'ตัวตรวจจับ “อาจารย์ ดร.ณัฐ” ไม่ตรงฐานข้อมูล (ผู้ช่วยศาสตราจารย์ ดร.)');
const out1 = renderPost(SAMPLE_EVENTS[0].fields, { kind: 'invite', tone: 'semi', channel: 'facebook', lang: 'both', style, settings: {} });
const r1 = checkPost(out1.text, { fields: SAMPLE_EVENTS[0].fields, kind: 'invite', tone: 'semi', channel: 'facebook', lang: 'both', style, settings: {}, staff: SAMPLE_STAFF });
ok(!r1.items.some((i) => i.code === 'staff-title'), 'ชื่อที่ตรงฐานข้อมูลไม่ถูกเตือน (ไทย + อังกฤษ)');
const before = { ...SAMPLE_EVENTS[0].fields }, after = { ...before, date: '2026-12-17', place: 'ห้องใหม่' };
const d = diffFields(before, after);
ok(d.length === 2 && d[0].field === 'date' && d[1].field === 'place', 'เทียบเวอร์ชัน: พบช่องที่เปลี่ยน 2 ช่อง');
eq(changeSummary(before, after), 'วันที่, สถานที่', 'สรุปช่องที่เปลี่ยน');
const plan = planCampaign(SAMPLE_EVENTS[0], '2026-11-26');
eq(plan.map((p) => p.date).join(' '), '2026-12-01 2026-12-09 2026-12-14 2026-12-15 2026-12-16', 'ชุดโพสต์ 5 ชิ้น: วันที่แนะนำ');
ok(plan.every((p) => p.include), 'ชุดโพสต์เลือกครบ 5 ชิ้นสำหรับงานที่ยังไม่ถึง');
const pastPlan = planCampaign(SAMPLE_EVENTS[2], '2026-11-26');
ok(pastPlan.filter((p) => p.include).map((p) => p.stage.id).join() === 'recap' && pastPlan[4].date === '2026-11-26', 'งานที่จบแล้ว: แนะนำเฉพาะโพสต์สรุป (วันนี้)');
const db = renderStage(SAMPLE_EVENTS[0], 'daybefore', { tone: 'official', channel: 'facebook', lang: 'th', style, settings: {} });
ok(db.text.startsWith('ขอเรียนเชิญอีกครั้ง — กำหนดจัดในวันพรุ่งนี้') && db.text.includes('วันอังคารที่ 15 ธันวาคม 2569'), 'โพสต์ 1 วันก่อนงานมีบรรทัดนำ “พรุ่งนี้”');
const dof = renderStage(SAMPLE_EVENTS[0], 'dayof', { tone: 'semi', channel: 'email', lang: 'th', style, settings: {} });
ok(!countEmoji(dof.text), 'บรรทัดนำในอีเมลไม่มีอีโมจิ');
const hc = headlineCandidates(SAMPLE_EVENTS[0].fields.title, 'th');
eq(hc[0], 'ภาษา วัฒนธรรม และ AI', 'พาดหัวโปสเตอร์ที่แนะนำอันแรก ≤ 8 คำ');

console.log('PR Writer เฟส 3: AI คลังโพสต์ การอ่านไฟล์');
const ai = await import('../public/pr/ai.js');
const { pickExamples, postToTemplate } = await import('../public/pr/library.js');
const { heuristics } = await import('../public/pr/extract.js');
const { SAMPLE_POSTS } = await import('../public/pr/sample.js');
ok(ai.SYSTEM_PROMPT.startsWith('You are the PR writer for the Faculty of Liberal Arts (คณะศิลปศาสตร์), Thammasat University.') && ai.SYSTEM_PROMPT.includes('8. Output JSON: {"variant1": "...", "variant2": "...", "check": ["..."]}. No other text.'), 'คำสั่งระบบตรงตามที่กำหนด');
const lib = [...SAMPLE_POSTS, ...Array.from({ length: 6 }, (_, i) => ({ kind: 'invite', channel: 'facebook', tone: 'semi', lang: 'th', eventType: 'seminar', status: 'approved', text: 'สัมมนา ภาษา วัฒนธรรม ' + i }))];
const ex = pickExamples(lib, { kind: 'invite', channel: 'facebook', tone: 'semi', lang: 'th', fields: SAMPLE_EVENTS[0].fields });
ok(ex.length === 3 && ex.every((p) => p.kind === 'invite'), 'เลือกตัวอย่างที่คล้ายที่สุดไม่เกิน 3 โพสต์');
ok(pickExamples(lib.map((p) => ({ ...p, noExample: true })), { kind: 'invite', channel: 'facebook', tone: 'semi', lang: 'th', fields: {} }).length === 0, 'โพสต์ที่ปิด “ใช้เป็นตัวอย่าง” ไม่ถูกเลือก');
ok(pickExamples([{ ...lib[0], status: 'draft' }], { kind: 'invite', channel: 'facebook', tone: 'semi', lang: 'th', fields: {} }).length === 0, 'โพสต์ร่างไม่ถูกใช้เป็นตัวอย่าง');
const u = ai.buildWriteUser({ fields: { ...SAMPLE_EVENTS[0].fields, meetingLink: '', meetingId: '' }, kind: 'invite', tone: 'semi', lang: 'th', channel: 'facebook', style, settings: {}, examples: ex });
ok(u.includes('- Date: วันอังคารที่ 15 ธันวาคม 2569') && !u.includes('Online meeting link') && !u.includes('Meeting ID'), 'ส่งเฉพาะช่องที่กรอก (ไม่มีช่องว่าง)');
ok((u.match(/^\[\d\] /gm) || []).length === 3 && u.includes('#คณะศิลปศาสตร์'), 'ส่งตัวอย่าง 3 โพสต์ + แฮชแท็กตามช่องทาง');
const ub = ai.buildWriteUser({ fields: SAMPLE_EVENTS[0].fields, kind: 'invite', tone: 'formal', lang: 'both', channel: 'email', style, settings: {} });
ok(ub.includes('Tuesday, 15 December 2026') && ub.includes('Thai first, then a natural English version') && ub.includes('หัวเรื่อง: …'), 'สองภาษา: ส่งวันที่ทั้ง พ.ศ./ค.ศ. และให้ใส่หัวเรื่องอีเมล');
const prevF = { ...SAMPLE_EVENTS[0].fields, date: '2026-12-10' };
ok(ai.buildWriteUser({ fields: SAMPLE_EVENTS[0].fields, prevFields: prevF, kind: 'change', tone: 'formal', lang: 'th', channel: 'facebook', style, settings: {} }).includes('วันพฤหัสบดีที่ 10 ธันวาคม 2569 → วันอังคารที่ 15 ธันวาคม 2569'), 'แจ้งเปลี่ยนแปลง: ส่งค่าเดิม → ค่าใหม่ให้ AI');
const est = ai.estimate({ provider: 'claude', model: 'claude-haiku-5-5' }, { system: ai.SYSTEM_PROMPT, user: u, outTok: 900 });
ok(est.usd > 0.0003 && est.usd < 0.002, `ประมาณค่าใช้จ่าย Haiku ต่อการเขียน 2 แบบ ($${est.usd.toFixed(5)})`);
ok(ai.estimate({ provider: 'cf', model: 'cf' }, { user: u }).usd === 0, 'AI ฟรีไม่มีค่าใช้จ่าย');
eq(ai.costOf('claude-sonnet-5-5', 1000000, 100000), 3, 'คำนวณค่าใช้จ่ายจริงจาก token (Sonnet)');
eq(JSON.stringify(ai.parseJSON('```json\n{"variant1":"a","variant2":"b","check":[]}\n```')), '{"variant1":"a","variant2":"b","check":[]}', 'อ่าน JSON ที่ห่อด้วย ```');
eq(ai.splitSubject('หัวเรื่อง: ขอเชิญร่วมงาน\n\nเรียน ทุกท่าน').subject, 'ขอเชิญร่วมงาน', 'แยกหัวเรื่องอีเมลออกจากข้อความ AI');
const hx = heuristics('ขอเชิญร่วมงานเสวนา “อนาคตของการแปล”\nวันพฤหัสบดีที่ ๑๗ ธันวาคม ๒๕๖๙ เวลา 09.30–12.00 น.\nณ ห้องประชุมใหญ่ ชั้น 5\nลงทะเบียน https://forms.gle/abc ภายในวันจันทร์ที่ 14 ธันวาคม 2569\nZoom https://zoom.us/j/123 Meeting ID: 123 456 7890 Passcode: 999\nติดต่อ 02-111-2222 pr@example.com', 2026);
eq(JSON.stringify([hx.title, hx.eventType, hx.date, hx.deadline, hx.startTime, hx.endTime, hx.place, hx.regLink, hx.meetingLink, hx.meetingId, hx.phone, hx.email]),
  JSON.stringify(['อนาคตของการแปล', 'seminar', '2026-12-17', '2026-12-14', '09:30', '12:00', 'ห้องประชุมใหญ่ ชั้น 5', 'https://forms.gle/abc', 'https://zoom.us/j/123', '123 456 7890 (Passcode: 999)', '02-111-2222', 'pr@example.com']), 'อ่านข้อมูลจากข้อความประกาศโดยไม่ใช้ AI (เลขไทยด้วย)');
const tplBody = postToTemplate(renderPost(SAMPLE_EVENTS[0].fields, { kind: 'invite', tone: 'semi', channel: 'facebook', lang: 'th', style, settings: {} }).text, SAMPLE_EVENTS[0].fields, 'th', 'invite');
ok(tplBody.includes('{{title}}') && tplBody.includes('{{date}}') && tplBody.includes('{{host}}') && !tplBody.includes('2569'), 'แปลงโพสต์เป็นเทมเพลต: แทนข้อมูลงานด้วย {{ตัวแปร}}');

console.log('PR Writer เฟส 4: สถิติและรายงาน');
const sts = await import('../public/pr/stats.js');
const { SAMPLE_METRIC_POSTS } = await import('../public/pr/sample.js');
eq(sts.engagement({ reach: 1000, reactions: 50, comments: 5, shares: 3, clicks: 12 }), 70, 'Engagement = รีแอ็กชัน + คอมเมนต์ + แชร์ + คลิก');
eq(sts.rate({ reach: 1000, reactions: 50, comments: 5, shares: 3, clicks: 12 }), 0.07, 'อัตรา = Engagement ÷ Reach');
eq(sts.rate({ reach: 0, reactions: 5 }), null, 'ไม่มี Reach → ไม่คำนวณอัตรา');
eq(sts.timeBucket(12)[0], 'noon', 'ช่วงเวลา 12 น. = กลางวัน');
const allSample = [...SAMPLE_METRIC_POSTS, ...SAMPLE_POSTS];
const sAll = sts.summary(sts.scope(allSample));
ok(sAll.posted === 16 && sAll.measured === 16 && sAll.reach === 50200 && sAll.eng === 5939, 'สรุปรวม: 16 โพสต์ · Reach 50,200 · Engagement 5,939');
const byTone = sts.groupStats(sts.scope(allSample), 'tone');
ok(byTone[0].key === 'semi' && byTone[0].n === 5 && byTone[byTone.length - 1].n === 1, 'จัดอันดับโทน: กลุ่มข้อมูลน้อย (1 โพสต์) อยู่ท้าย แม้ค่าเฉลี่ยสูง');
ok((sts.insight(byTone, 'tone') || '').startsWith('โทนที่ได้ผลดีที่สุด: กึ่งทางการ'), 'สรุปอัตโนมัติ: โทนที่ได้ผลดีที่สุด');
const byWd = sts.groupStats(sts.scope(allSample), 'weekday');
ok(byWd[0].label === 'วันพุธ', 'วันที่โพสต์ที่ได้ผลดีที่สุดคำนวณจากวันจริงของวันที่');
const ppm = sts.postsPerMonth(sts.scope(allSample), 'channel', ['2026-07', '2026-08', '2026-09', '2026-10', '2026-11']);
ok(ppm.series.find((x) => x.key === 'facebook').values.join() === '2,1,2,3,0' && ppm.series.reduce((a, x) => a + x.values.reduce((p, q) => p + q, 0), 0) === 16, 'นับโพสต์ต่อเดือนแยกช่องทาง');
const many = Array.from({ length: 9 }, (_, i) => ({ status: 'posted', postedAt: '2026-11-0' + (i + 1), kind: ['invite', 'meeting', 'recap', 'congrats', 'announce', 'change', 'reminder', 'condolence', 'thanks'][i] }));
ok(sts.postsPerMonth(many, 'kind', ['2026-11']).series.length === 8 && sts.postsPerMonth(many, 'kind', ['2026-11']).series.some((x) => x.label === 'อื่น ๆ'), 'เกิน 8 กลุ่ม รวมกลุ่มเล็กเป็น “อื่น ๆ” (สีมี 8 ช่อง)');
const rows = sts.monthRows(allSample, [], '2026-11');
ok(rows.length === 3 && rows[0].date === '3 พ.ย.' && rows[0].time === '12.05 น.' && rows[2].date === '20 พ.ย.', 'รายงานรายเดือน: เรียงตามวันเวลาที่โพสต์');
eq(sts.monthLabel('2026-11'), 'พฤศจิกายน 2569', 'ชื่อเดือนรายงานเป็น พ.ศ.');

console.log(failures ? `\n✗ ไม่ผ่าน ${failures} ข้อ (ผ่าน ${passed})` : `\n✓ ผ่านทั้งหมด ${passed} ข้อ`);
process.exit(failures ? 1 : 0);
