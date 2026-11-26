// ชุดโพสต์ของงาน 1 งาน (5 ชิ้น): ประกาศล่วงหน้า, เตือนก่อนปิดรับ, 1 วันก่อนงาน, วันงาน, สรุปหลังงาน
import { renderPost } from './templates.js';
import { addDays, todayISO } from './dates.js';

const isMeeting = (ev) => ev.kind === 'meeting' || ev.fields.eventType === 'meeting';

// บรรทัดนำสำหรับโพสต์ 1 วันก่อนงาน / วันงาน (ตามโทน)
const LEADS = {
  daybefore: {
    official: { th: 'ขอเรียนเชิญอีกครั้ง — กำหนดจัดในวันพรุ่งนี้', en: 'A kind reminder: the event takes place tomorrow.' },
    formal: { th: 'ขอเชิญชวนอีกครั้ง: พรุ่งนี้แล้ว', en: 'Reminder: this takes place tomorrow.' },
    semi: { th: '📌 พรุ่งนี้แล้ว!', en: '📌 Tomorrow!' },
    casual: { th: 'พรุ่งนี้แล้วนะ! ⏰', en: 'It\'s tomorrow! ⏰' },
    teen: { th: '⏰ พรุ่งนี้แล้ววว!!', en: '⏰ TOMORROW!!' },
  },
  dayof: {
    official: { th: 'วันนี้ — ขอเรียนเชิญเข้าร่วมตามกำหนดการ', en: 'Today: you are cordially invited to attend.' },
    formal: { th: 'วันนี้: ขอเชิญร่วมงาน', en: 'Today: join us.' },
    semi: { th: '📍 วันนี้!', en: '📍 Today!' },
    casual: { th: 'วันนี้แล้ว! เจอกันนะ 🎉', en: 'It\'s today! See you there 🎉' },
    teen: { th: '🎉 วันนี้แล้ว!! มาเจอกัน!', en: '🎉 TODAY!! See you there!' },
  },
};

export const STAGES = [
  { id: 'early', th: 'ประกาศล่วงหน้า', kind: (ev) => (isMeeting(ev) ? 'meeting' : 'invite'), date: (f, today) => { const d = addDays(f.date, -14); return d && d < today && f.date >= today ? today : d; } },
  { id: 'regclose', th: 'เตือนก่อนปิดรับลงทะเบียน', kind: () => 'reminder', date: (f) => (f.deadline ? addDays(f.deadline, -2) : ''), needs: (f) => (f.deadline ? '' : 'ไม่มีวันปิดรับลงทะเบียน') },
  { id: 'daybefore', th: '1 วันก่อนงาน', kind: (ev) => (isMeeting(ev) ? 'meeting' : 'invite'), date: (f) => addDays(f.date, -1), lead: 'daybefore' },
  { id: 'dayof', th: 'วันงาน', kind: (ev) => (isMeeting(ev) ? 'meeting' : 'invite'), date: (f) => f.date, lead: 'dayof' },
  { id: 'recap', th: 'สรุปหลังงาน', kind: () => 'recap', date: (f, today) => { const end = f.endDate || f.date; const d = addDays(end, 1); return d < today && end >= addDays(today, -14) ? today : d; } },
];
export const stageOf = (id) => STAGES.find((s) => s.id === id);

// วันที่แนะนำของแต่ละชิ้น + เลือกไว้ให้หรือไม่ (ชิ้นที่วันผ่านไปแล้ว/ขาดข้อมูล ไม่เลือกให้)
export function planCampaign(ev, today = todayISO()) {
  const f = ev.fields;
  return STAGES.map((s) => {
    const missing = !f.date ? 'ยังไม่มีวันงาน' : s.needs ? s.needs(f) : '';
    const date = missing ? '' : s.date(f, today);
    const past = !!date && date < today;
    if (isMeeting(ev) && s.id === 'regclose') return { stage: s, kind: s.kind(ev), date: '', include: false, note: 'การประชุมไม่ต้องลงทะเบียน' };
    return { stage: s, kind: s.kind(ev), date, include: !missing && !past, note: missing || (past ? 'วันที่แนะนำผ่านไปแล้ว' : '') };
  });
}

export function renderStage(ev, stageId, opts) {
  const s = stageOf(stageId);
  const base = s.lead && LEADS[s.lead];
  const tone = opts.toneBase || opts.tone;
  const lead = base ? base[tone] || base.semi : null;
  return renderPost(ev.fields, { ...opts, kind: s.kind(ev), lead });
}
