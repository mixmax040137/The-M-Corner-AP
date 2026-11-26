// เทมเพลตโพสต์ (0 token): เนื้อหาตามประเภท × โทน × ภาษา แล้วปรับตามช่องทางอัตโนมัติ
//
// รูปแบบตัวแปรในเทมเพลต
//   {{title}}        แทนค่า ถ้าว่าง ลบทั้งบรรทัด
//   {{title!}}       ถ้าว่าง แสดง [กรอก: ชื่องาน] ให้เห็นว่าต้องเติม
//   {{audience|ผู้สนใจ}}  ถ้าว่าง ใช้ข้อความหลัง |
//   [[ ... ]]        ส่วนเสริม: ถ้าตัวแปรข้างในว่าง ตัดทั้งส่วนออก (คร่อมหลายบรรทัดได้)
import { FACULTY, TONES, KINDS, channelOf, eventTypeOf, toneOf, baseTone, fieldLabel, FIELDS } from './fields.js';
import { fmtRange, fmtDate, fmtTime } from './dates.js';

// ---------- เนื้อหาหลัก: BODIES[ประเภท][โทน][ภาษา] ----------
export const BODIES = {
  invite: {
    official: {
      th: `{{host}} ขอเชิญ{{audience|คณาจารย์ บุคลากร นักศึกษา และผู้สนใจ}} เข้าร่วม{{eventType}} เรื่อง “{{title!}}”
[[โดยได้รับเกียรติจาก{{chair}} เป็นประธานในพิธี]]
[[วิทยากร
{{guests}}]]

{{infoBlock}}

[[{{notes}}]]
[[สอบถามรายละเอียดเพิ่มเติมได้ที่ {{contact}}]]`,
      en: `{{Host}} cordially invites {{audience|faculty members, staff, students and all interested persons}} to attend the {{eventType}} “{{title!}}”.
[[The event will be presided over by {{chair}}.]]
[[Speakers:
{{guests}}]]

{{infoBlock}}

[[{{notes}}]]
[[For further information, please contact {{contact}}.]]`,
    },
    formal: {
      th: `ขอเชิญร่วม{{eventType}} “{{title!}}”
{{host}} ขอเชิญ{{audience|ผู้สนใจ}}เข้าร่วม{{eventType}}ครั้งนี้[[ ซึ่งได้รับเกียรติจาก{{guestsInline}} ร่วมบรรยายและแลกเปลี่ยนความรู้]]
[[ประธานในพิธี: {{chair}}]]

{{infoBlock}}

[[{{notes}}]]
[[สอบถามเพิ่มเติม: {{contact}}]]`,
      en: `Invitation: {{title!}}
{{Host}} invites {{audience|all interested participants}} to join the {{eventType}}[[, featuring {{guestsInline}}]].
[[Presiding: {{chair}}]]

{{infoBlock}}

[[{{notes}}]]
[[Enquiries: {{contact}}]]`,
    },
    semi: {
      th: `📢 ขอเชิญร่วม{{eventType}} “{{title!}}”
{{host}} ขอเชิญชวน{{audience|ทุกท่าน}}มาร่วมงานด้วยกัน
[[วิทยากร: {{guestsInline}}]]

{{infoBlock}}

[[{{notes}}]]
[[สอบถามเพิ่มเติม: {{contact}}]]`,
      en: `📢 You're invited: {{title!}}
Join {{host}} for the {{eventType}}[[ with {{guestsInline}}]]. Everyone is welcome[[, especially {{audience}}]].

{{infoBlock}}

[[{{notes}}]]
[[Questions? Contact {{contact}}.]]`,
    },
    casual: {
      th: `ชวนมาร่วม{{eventKind}} “{{title!}}” กัน{{p}} 🙌
{{host}} จัดงานนี้[[ โดยได้{{guestsInline}}มาแบ่งปันประสบการณ์และชวนคุยแบบเป็นกันเอง]]
[[เหมาะกับ{{audience}}]]

{{infoBlock}}

[[{{notes}}]]
[[ถ้ามีคำถาม ทักมาได้เลยที่ {{contact}}]]
แล้วเจอกันนะ{{pq}} 😊`,
      en: `Save the date! 🙌 “{{title!}}” is coming up.
[[We're bringing in {{guestsInline}} for an open, friendly conversation.]]
[[Perfect for {{audience}}.]]

{{infoBlock}}

[[{{notes}}]]
[[Questions? Just reach out to {{contact}}.]]
Hosted by {{host}}. See you there! 😊`,
    },
    teen: {
      th: `📣 ห้ามพลาด!! “{{title!}}” มาแล้ววว ✨
งานนี้ {{host}} จัดให้แบบจัดเต็ม[[ ได้{{guestsInline}}มาเปิดมุมมองใหม่ ๆ 🔥]]
[[ใครเป็น{{audience}} ต้องไม่พลาด!]]

{{infoBlock}}

[[{{notes}}]]
[[มีคำถามทักได้เลย 👉 {{contact}}]]
ชวนเพื่อนมาด้วยกันนะ แล้วเจอกัน! 💛`,
      en: `📣 Don't miss this one! “{{title!}}” is happening ✨
[[{{guestsInline}} will be there to share some serious inspiration 🔥]]
[[Calling all {{audience}}!]]

{{infoBlock}}

[[{{notes}}]]
[[Got questions? 👉 {{contact}}]]
Brought to you by {{host}}. Bring your friends! 💛`,
    },
  },

  meeting: {
    official: {
      th: `ขอเชิญประชุม{{title!}}
ด้วย{{host}} กำหนดจัดการประชุม{{title!}} จึงขอเรียนเชิญ{{audience|ผู้เกี่ยวข้อง}}เข้าร่วมประชุมตามวันและเวลาดังต่อไปนี้
[[ประธานการประชุม: {{chair}}]]

{{infoBlock}}

[[{{notes}}]]
[[ประสานงาน: {{contact}}]]`,
      en: `Meeting Invitation: {{title!}}
{{Host}} requests the presence of {{audience|all concerned}} at the {{title!}}[[, to be chaired by {{chair}}]].

{{infoBlock}}

[[Agenda and details: {{notes}}]]
[[Coordinator: {{contact}}]]`,
    },
    formal: {
      th: `ขอเชิญประชุม: {{title!}}
{{host}} ขอเชิญ{{audience|ผู้เกี่ยวข้อง}}เข้าร่วมประชุม[[ โดยมี{{chair}} เป็นประธาน]]

{{infoBlock}}

[[วาระและรายละเอียด: {{notes}}]]
[[ติดต่อ: {{contact}}]]`,
      en: `Meeting notice: {{title!}}
{{Host}} invites {{audience|all concerned}} to attend the meeting[[ chaired by {{chair}}]].

{{infoBlock}}

[[Agenda and details: {{notes}}]]
[[Contact: {{contact}}]]`,
    },
    semi: {
      th: `📌 แจ้งนัดประชุม: {{title!}}
{{host}} ขอเชิญ{{audience|ผู้เกี่ยวข้อง}}เข้าร่วมประชุมตามรายละเอียดด้านล่าง[[ (ประธาน: {{chair}})]]

{{infoBlock}}

[[{{notes}}]]
[[ติดต่อ: {{contact}}]]`,
      en: `📌 Meeting: {{title!}}
{{Host}} invites {{audience|all concerned}} to join the meeting below[[ (chair: {{chair}})]].

{{infoBlock}}

[[{{notes}}]]
[[Contact: {{contact}}]]`,
    },
    casual: {
      th: `นัดประชุมกัน{{p}} 🗓️ {{title!}}
{{host}} ชวน{{audience|ทุกท่าน}}มาร่วมประชุมด้วยกัน

{{infoBlock}}

[[{{notes}}]]
[[สงสัยตรงไหน ถามได้ที่ {{contact}}]]
ฝากเข้าร่วมตรงเวลากันด้วยนะ{{pq}} 🙏`,
      en: `Meeting time! 🗓️ {{title!}}
{{Host}} invites {{audience|everyone}} to join in.

{{infoBlock}}

[[{{notes}}]]
[[Questions? Ask {{contact}}.]]
Please be on time. Thanks! 🙏`,
    },
    teen: {
      th: `📣 เรียกรวมพล! ประชุม{{title!}} ✨
{{host}} ขอเชิญ{{audience|ทุกคน}}มาร่วมแชร์ไอเดียกัน 💡

{{infoBlock}}

[[{{notes}}]]
[[สงสัยตรงไหนทักมาได้เลย 👉 {{contact}}]]
อย่าลืมมาตรงเวลานะ! ⏰`,
      en: `📣 Team meeting! {{title!}} ✨
{{Host}} wants {{audience|everyone}} there with your best ideas 💡

{{infoBlock}}

[[{{notes}}]]
[[Questions? 👉 {{contact}}]]
Don't be late! ⏰`,
    },
  },

  recap: {
    official: {
      th: `เมื่อ{{date!}}[[ เวลา {{time}}]] {{host}} จัด{{eventType}} เรื่อง “{{title!}}”[[ ณ {{place}}]]
[[โดยได้รับเกียรติจาก{{chair}} เป็นประธานในพิธี]]
[[ทั้งนี้ ได้รับเกียรติจาก{{guestsInline}} เป็นวิทยากร]]
[[{{notes}}]]
[[ผู้เข้าร่วมประกอบด้วย{{audience}}]]`,
      en: `On {{date!}}, {{host}} held the {{eventType}} “{{title!}}”[[ at {{place}}]].
[[The event was presided over by {{chair}}.]]
[[Distinguished speakers included {{guestsInline}}.]]
[[{{notes}}]]
[[Participants included {{audience}}.]]`,
    },
    formal: {
      th: `{{host}} จัด{{eventType}} “{{title!}}” เมื่อ{{date!}}[[ ณ {{place}}]]
[[ในโอกาสนี้ ได้รับเกียรติจาก{{guestsInline}} ร่วมบรรยายและแลกเปลี่ยนความรู้]]
[[{{notes}}]]
[[ขอขอบคุณ{{audience}}ทุกท่านที่ร่วมกิจกรรม]]`,
      en: `{{Host}} hosted the {{eventType}} “{{title!}}” on {{date!}}[[ at {{place}}]].
[[We were honoured to welcome {{guestsInline}}, who shared their insights with participants.]]
[[{{notes}}]]
[[Thank you to all {{audience}} who took part.]]`,
    },
    semi: {
      th: `📸 ภาพบรรยากาศ{{eventType}} “{{title!}}”
เมื่อ{{date!}}[[ ณ {{place}}]] {{host}} ได้จัด{{eventType}}ขึ้น[[ โดยได้รับเกียรติจาก{{guestsInline}} มาร่วมแบ่งปันความรู้]]
[[{{notes}}]]
ขอบคุณทุกท่านที่มาร่วมกิจกรรมในครั้งนี้ 🙏`,
      en: `📸 Highlights: {{title!}}
On {{date!}}, {{host}} hosted the {{eventType}}[[ at {{place}}]][[, featuring {{guestsInline}}]].
[[{{notes}}]]
Thank you to everyone who joined us 🙏`,
    },
    casual: {
      th: `ขอบคุณทุกคนที่มาร่วม{{eventKind}} “{{title!}}” กัน{{p}} 🙌
{{host}} ขอขอบคุณทุกท่าน[[ และขอบคุณ{{guestsInline}}ที่มาชวนคุยแบบเต็มอิ่ม]]
[[{{notes}}]]
ใครพลาดไป รอติดตามกิจกรรมครั้งหน้าได้เลย{{p}} 😊
[[เมื่อ{{date}}]]`,
      en: `Thank you all for joining “{{title!}}”! 🙌
[[It was great to have {{guestsInline}} with us for such a warm conversation.]]
[[{{notes}}]]
Missed it? Stay tuned for the next one 😊
[[{{date}} · ]]Hosted by {{host}}`,
    },
    teen: {
      th: `✨ สรุปความปังของ{{eventKind}} “{{title!}}” 📸
{{host}} ขอบคุณทุกคนที่มาด้วยกัน[[ และขอบคุณ{{guestsInline}}ที่มาเติมพลังแบบจัดเต็ม 🔥]]
[[{{notes}}]]
ครั้งหน้ามาอีกนะ! 💛
[[เมื่อ{{date}}]]`,
      en: `✨ That's a wrap on “{{title!}}”! 📸
[[Huge thanks to {{guestsInline}} for the amazing energy 🔥]]
[[{{notes}}]]
Thanks for coming, everyone. See you next time! 💛
[[{{date}} · ]]{{Host}}`,
    },
  },

  congrats: {
    official: {
      th: `{{host}} ขอแสดงความยินดีกับ
{{guests!}}
เนื่องในโอกาส{{title!}}
[[{{notes}}]]`,
      en: `{{Host}} extends its warmest congratulations to
{{guests!}}
on {{title!}}.
[[{{notes}}]]`,
    },
    formal: {
      th: `ขอแสดงความยินดี
{{host}} ขอแสดงความยินดีกับ{{guestsInline!}} ในโอกาส{{title!}}
[[{{notes}}]]`,
      en: `Congratulations
{{Host}} congratulates {{guestsInline!}} on {{title!}}.
[[{{notes}}]]`,
    },
    semi: {
      th: `🎉 ขอแสดงความยินดี
{{host}} ขอแสดงความยินดีกับ{{guestsInline!}} ในโอกาส{{title!}}
[[{{notes}}]]
ขอร่วมภาคภูมิใจไปด้วยกัน 👏`,
      en: `🎉 Congratulations!
{{Host}} warmly congratulates {{guestsInline!}} on {{title!}}.
[[{{notes}}]]
We are proud to share this achievement 👏`,
    },
    casual: {
      th: `{{host}} ขอแสดงความยินดีด้วย{{p}}! 🎉
{{guestsInline!}} {{title!}}
[[{{notes}}]]
พวกเราภูมิใจมาก ๆ 👏`,
      en: `Big congratulations to {{guestsInline!}}! 🎉
So proud of you on {{title!}}.
[[{{notes}}]]
— {{Host}} 👏`,
    },
    teen: {
      th: `🎉 ยินดีด้วยสุด ๆ!! ✨
{{guestsInline!}} {{title!}} 🏆
[[{{notes}}]]
{{host}} ภูมิใจมาก ปังไม่ไหว! 💛`,
      en: `🎉 Congrats, legend!! ✨
{{guestsInline!}}, way to go on {{title!}} 🏆
[[{{notes}}]]
So proud of you! 💛 — {{Host}}`,
    },
  },

  announce: {
    official: {
      th: `ประกาศ{{host}}
เรื่อง {{title!}}

{{notes!}}

{{infoBlock}}

[[สอบถามรายละเอียดเพิ่มเติมได้ที่ {{contact}}]]`,
      en: `{{Host}}
Announcement: {{title!}}

{{notes!}}

{{infoBlock}}

[[For further information, please contact {{contact}}.]]`,
    },
    formal: {
      th: `ประกาศ: {{title!}}
{{host}} ขอแจ้งให้{{audience|ผู้เกี่ยวข้อง}}ทราบ ดังนี้
{{notes!}}

{{infoBlock}}

[[ติดต่อ: {{contact}}]]`,
      en: `Announcement: {{title!}}
{{Host}} would like to inform {{audience|all concerned}} of the following:
{{notes!}}

{{infoBlock}}

[[Contact: {{contact}}]]`,
    },
    semi: {
      th: `📢 ประกาศ: {{title!}}
{{host}} ขอแจ้งข่าวถึง{{audience|ทุกท่าน}}
{{notes!}}

{{infoBlock}}

[[สอบถามเพิ่มเติม: {{contact}}]]`,
      en: `📢 Announcement: {{title!}}
{{notes!}}

{{infoBlock}}

[[Questions? Contact {{contact}}.]]
— {{Host}}`,
    },
    casual: {
      th: `📢 มีข่าวมาแจ้ง{{p}}! {{title!}}
{{notes!}}

{{infoBlock}}

[[สงสัยตรงไหน ถามได้ที่ {{contact}}]]
ฝากแชร์ต่อให้เพื่อน ๆ ด้วยนะ{{pq}} 🙏
(จาก {{host}})`,
      en: `📢 Quick update! {{title!}}
{{notes!}}

{{infoBlock}}

[[Any questions? Ask {{contact}}.]]
Please share with your friends 🙏 — {{Host}}`,
    },
    teen: {
      th: `📣 ประกาศ ๆ!! {{title!}} ✨
{{notes!}}

{{infoBlock}}

[[งง ๆ ทักมาเลย 👉 {{contact}}]]
แชร์ต่อให้เพื่อนด้วยน้า 💛 · {{host}}`,
      en: `📣 Heads up!! {{title!}} ✨
{{notes!}}

{{infoBlock}}

[[Confused? 👉 {{contact}}]]
Share this with your friends 💛 — {{Host}}`,
    },
  },

  change: {
    official: {
      th: `แจ้งการเปลี่ยนแปลงกำหนดการ{{eventType}} เรื่อง “{{title!}}”
{{host}} ขอแจ้งการเปลี่ยนแปลงกำหนดการ{{eventType}}ดังกล่าว ดังนี้

{{changes!}}
[[
ข้อมูลอื่นไม่เปลี่ยนแปลง
{{unchanged}}]]

จึงขออภัยในความไม่สะดวกมา ณ ที่นี้
[[สอบถามรายละเอียดเพิ่มเติมได้ที่ {{contact}}]]`,
      en: `Notice of Change: {{title!}}
{{Host}} wishes to inform you of the following changes to the {{eventType}} “{{title!}}”:

{{changes!}}
[[
All other details remain unchanged:
{{unchanged}}]]

We apologise for any inconvenience caused.
[[For further information, please contact {{contact}}.]]`,
    },
    formal: {
      th: `แจ้งเปลี่ยนแปลง: {{title!}}
{{host}} ขอแจ้งเปลี่ยนแปลงรายละเอียด{{eventType}} “{{title!}}” ดังนี้

{{changes!}}
[[
รายละเอียดอื่นคงเดิม
{{unchanged}}]]

ขออภัยในความไม่สะดวก
[[ติดต่อ: {{contact}}]]`,
      en: `Change notice: {{title!}}
{{Host}} would like to inform you of the following updates to “{{title!}}”:

{{changes!}}
[[
Other details remain the same:
{{unchanged}}]]

We apologise for any inconvenience.
[[Contact: {{contact}}]]`,
    },
    semi: {
      th: `📌 แจ้งเปลี่ยนแปลง: {{title!}}
{{host}} ขอแจ้งเปลี่ยนแปลงรายละเอียดดังนี้

{{changes!}}
[[
ส่วนอื่นยังเหมือนเดิม
{{unchanged}}]]

ขออภัยในความไม่สะดวก 🙏
[[สอบถามเพิ่มเติม: {{contact}}]]`,
      en: `📌 Update: {{title!}}
{{Host}} would like to share the following changes:

{{changes!}}
[[
Everything else stays the same:
{{unchanged}}]]

Sorry for any inconvenience 🙏
[[Questions? Contact {{contact}}.]]`,
    },
    casual: {
      th: `อัปเดตด่วน{{p}}! 📌 “{{title!}}” มีการเปลี่ยนแปลงนิดหน่อย

{{changes!}}
[[
ที่เหลือเหมือนเดิม
{{unchanged}}]]

ขอโทษที่ทำให้ไม่สะดวกนะ{{pq}} 🙏
[[ถามได้ที่ {{contact}}]]
(จาก {{host}})`,
      en: `Quick update! 📌 A few details for “{{title!}}” have changed:

{{changes!}}
[[
Everything else is the same:
{{unchanged}}]]

Sorry for the hassle 🙏
[[Questions? Ask {{contact}}.]]
— {{Host}}`,
    },
    teen: {
      th: `🚨 อัปเดตด่วน!! “{{title!}}” เปลี่ยนนิดนึงนะ ✨

{{changes!}}
[[
นอกนั้นเหมือนเดิม
{{unchanged}}]]

ขอโทษที่ทำให้งงน้า 🙏
[[ทักถามได้ 👉 {{contact}}]]
{{host}}`,
      en: `🚨 Plot twist! “{{title!}}” has a small change ✨

{{changes!}}
[[
Everything else? Same as before:
{{unchanged}}]]

Sorry for the confusion 🙏
[[Questions? 👉 {{contact}}]]
— {{Host}}`,
    },
  },

  reminder: {
    official: {
      th: `ขอเชิญลงทะเบียนเข้าร่วม{{eventType}} เรื่อง “{{title!}}”
{{host}} ขอเรียนเชิญ{{audience|ผู้สนใจ}}ลงทะเบียนเข้าร่วมงาน[[ ภายใน{{deadline}}]]

{{infoBlock}}

[[สอบถามรายละเอียดเพิ่มเติมได้ที่ {{contact}}]]`,
      en: `Registration Reminder: {{title!}}
{{Host}} kindly reminds {{audience|all interested persons}} to register for the {{eventType}}[[ by {{deadline}}]].

{{infoBlock}}

[[For further information, please contact {{contact}}.]]`,
    },
    formal: {
      th: `เตือนการลงทะเบียน: {{title!}}
{{host}} ขอเชิญ{{audience|ผู้สนใจ}}ลงทะเบียนเข้าร่วม{{eventType}}[[ ซึ่งจะปิดรับลงทะเบียน{{deadline}}]]

{{infoBlock}}

[[ติดต่อ: {{contact}}]]`,
      en: `Reminder: registration for “{{title!}}”[[ closes on {{deadline}}]].
{{Host}} invites {{audience|all interested participants}} to register via the details below.

{{infoBlock}}

[[Contact: {{contact}}]]`,
    },
    semi: {
      th: `⏳ ใกล้ปิดรับลงทะเบียนแล้ว! “{{title!}}”
{{host}} ขอเชิญชวนผู้ที่สนใจลงทะเบียน[[ ภายใน{{deadline}}]]

{{infoBlock}}

[[สอบถามเพิ่มเติม: {{contact}}]]`,
      en: `⏳ Registration closing soon: {{title!}}
{{Host}} invites everyone interested to register[[ by {{deadline}}]].

{{infoBlock}}

[[Questions? Contact {{contact}}.]]`,
    },
    casual: {
      th: `อย่าลืมลงทะเบียนนะ{{pq}}! ⏳ “{{title!}}”
[[ปิดรับ{{deadline}} ]]ใครยังไม่ได้ลง รีบเลย{{p}}

{{infoBlock}}

[[ถามได้ที่ {{contact}}]]
(จาก {{host}})`,
      en: `Don't forget to sign up! ⏳ “{{title!}}”
[[Registration closes on {{deadline}}, so ]]grab your spot now.

{{infoBlock}}

[[Questions? Ask {{contact}}.]]
— {{Host}}`,
    },
    teen: {
      th: `⏰ นับถอยหลัง!! “{{title!}}” ใกล้ปิดรับแล้ว 🔥
[[ปิดรับ{{deadline}} ]]ใครยังไม่ลง รีบด่วน!

{{infoBlock}}

[[ทักถามได้ 👉 {{contact}}]]
ชวนเพื่อนมาลงด้วยกันเลย 💛 · {{host}}`,
      en: `⏰ Last call!! “{{title!}}” registration is almost closed 🔥
[[Deadline: {{deadline}}. ]]Don't miss out!

{{infoBlock}}

[[Questions? 👉 {{contact}}]]
Tag your friends and sign up together 💛 — {{Host}}`,
    },
  },

  // ไว้อาลัย: ไม่มีอีโมจิทุกโทน และใช้ถ้อยคำสุภาพเสมอ
  condolence: {
    official: {
      th: `{{host}} ขอแสดงความอาลัยอย่างสุดซึ้งต่อการจากไปของ
{{guests!}}
[[{{title}}]]
และขอแสดงความเสียใจต่อครอบครัวและญาติมิตรมา ณ โอกาสนี้
[[
กำหนดการพิธี
{{infoBlock}}]]
[[{{notes}}]]`,
      en: `{{Host}} expresses its deepest condolences on the passing of
{{guests!}}
[[{{title}}]]
Our heartfelt sympathy goes to the family and friends.
[[
Funeral rites:
{{infoBlock}}]]
[[{{notes}}]]`,
    },
    formal: {
      th: `ขอแสดงความอาลัย
{{host}} ขอแสดงความเสียใจอย่างสุดซึ้งต่อการจากไปของ{{guestsInline!}}
[[{{title}}]]
[[
กำหนดการพิธี
{{infoBlock}}]]
[[{{notes}}]]`,
      en: `In Memoriam
{{Host}} is deeply saddened by the passing of {{guestsInline!}} and extends sincere condolences to the family.
[[{{title}}]]
[[
Funeral rites:
{{infoBlock}}]]
[[{{notes}}]]`,
    },
    semi: {
      th: `ด้วยความอาลัยยิ่ง
{{host}} ขอแสดงความเสียใจต่อการจากไปของ{{guestsInline!}} และขอส่งกำลังใจถึงครอบครัวและผู้ใกล้ชิดทุกท่าน
[[{{title}}]]
[[
กำหนดการพิธี
{{infoBlock}}]]
[[{{notes}}]]`,
      en: `With deepest sympathy
{{Host}} mourns the loss of {{guestsInline!}}. Our thoughts are with the family and loved ones.
[[{{title}}]]
[[
Funeral rites:
{{infoBlock}}]]
[[{{notes}}]]`,
    },
    casual: {
      th: `ด้วยความอาลัยและระลึกถึง
{{host}} ขอแสดงความเสียใจต่อการจากไปของ{{guestsInline!}} ท่านจะอยู่ในความทรงจำของพวกเราเสมอ
[[{{title}}]]
[[
กำหนดการพิธี
{{infoBlock}}]]
[[{{notes}}]]`,
      en: `With love and remembrance
We at {{host}} are deeply saddened by the passing of {{guestsInline!}}, who will always be remembered.
[[{{title}}]]
[[
Funeral rites:
{{infoBlock}}]]
[[{{notes}}]]`,
    },
    teen: {
      th: `ร่วมไว้อาลัยแด่{{guestsInline!}}
{{host}} ขอแสดงความเสียใจ และขอส่งกำลังใจถึงครอบครัวและผู้ใกล้ชิด ขอบคุณสำหรับทุกความทรงจำดี ๆ ที่ท่านมอบให้พวกเรา
[[{{title}}]]
[[
กำหนดการพิธี
{{infoBlock}}]]
[[{{notes}}]]`,
      en: `Remembering {{guestsInline!}}
We at {{host}} send our love and support to the family. Thank you for every good memory.
[[{{title}}]]
[[
Funeral rites:
{{infoBlock}}]]
[[{{notes}}]]`,
    },
  },

  thanks: {
    official: {
      th: `{{host}} ขอขอบพระคุณ
{{guests!}}
ที่ได้ให้เกียรติและให้การสนับสนุนการจัด{{eventType}} เรื่อง “{{title!}}”[[ เมื่อ{{date}}]][[ ณ {{place}}]] ให้สำเร็จลุล่วงไปด้วยดี
[[{{notes}}]]`,
      en: `{{Host}} wishes to express its sincere gratitude to
{{guests!}}
for their kind support of the {{eventType}} “{{title!}}”[[, held on {{date}}]][[ at {{place}}]], which was a great success.
[[{{notes}}]]`,
    },
    formal: {
      th: `ขอขอบคุณ
{{host}} ขอขอบคุณ{{guestsInline!}} ที่ร่วมสนับสนุน{{eventType}} “{{title!}}”[[ เมื่อ{{date}}]] จนสำเร็จลุล่วงด้วยดี
[[{{notes}}]]`,
      en: `Thank You
{{Host}} thanks {{guestsInline!}} for supporting the {{eventType}} “{{title!}}”[[ on {{date}}]].
[[{{notes}}]]`,
    },
    semi: {
      th: `🙏 ขอบคุณจากใจ
{{host}} ขอขอบคุณ{{guestsInline!}} ที่ร่วมทำให้{{eventType}} “{{title!}}” สำเร็จลุล่วงด้วยดี
[[{{notes}}]]
หวังว่าจะได้พบกันอีกในกิจกรรมครั้งต่อไป 💐`,
      en: `🙏 A heartfelt thank you
{{Host}} thanks {{guestsInline!}} for helping make “{{title!}}” a success.
[[{{notes}}]]
We look forward to seeing you again 💐`,
    },
    casual: {
      th: `ขอบคุณมาก ๆ เลย{{p}} 🙏
{{host}} ขอบคุณ{{guestsInline!}}ที่มาช่วยให้{{eventKind}} “{{title!}}” ออกมาดีขนาดนี้
[[{{notes}}]]
แล้วพบกันใหม่ครั้งหน้านะ{{pq}} 😊`,
      en: `Thank you so much! 🙏
Big thanks to {{guestsInline!}} for making “{{title!}}” so great.
[[{{notes}}]]
See you next time! 😊 — {{Host}}`,
    },
    teen: {
      th: `💛 ขอบคุณสุดหัวใจ!! ✨
ขอบคุณ{{guestsInline!}}ที่ทำให้{{eventKind}} “{{title!}}” ปังขนาดนี้ 🔥
[[{{notes}}]]
เจอกันใหม่ครั้งหน้า! 🙌 · {{host}}`,
      en: `💛 Thank you, thank you, thank you!! ✨
{{guestsInline!}}, you made “{{title!}}” amazing 🔥
[[{{notes}}]]
See you at the next one! 🙌 — {{Host}}`,
    },
  },
};

// หัวเรื่องอีเมล / พาดหัวข่าวเว็บ / เรื่องของหนังสือเวียน
export const SUBJECTS = {
  invite: { th: 'ขอเชิญร่วม{{eventType}} “{{title!}}”[[ {{dateShort}}]]', en: 'Invitation: {{title!}}[[ ({{dateShort}})]]' },
  meeting: { th: 'ขอเชิญประชุม{{title!}}[[ {{dateShort}}]]', en: 'Meeting invitation: {{title!}}[[ – {{dateShort}}]]' },
  recap: { th: '{{host}} จัด{{eventType}} “{{title!}}”', en: '{{Host}} hosts “{{title!}}”' },
  congrats: { th: 'ขอแสดงความยินดีกับ{{guestsInline!}}', en: 'Congratulations to {{guestsInline!}}' },
  announce: { th: 'ประกาศ เรื่อง {{title!}}', en: 'Announcement: {{title!}}' },
  change: { th: '[แจ้งเปลี่ยนแปลง] {{title!}}', en: '[Change notice] {{title!}}' },
  reminder: { th: 'เตือนลงทะเบียน: {{title!}}[[ (ปิดรับ {{deadlineShort}})]]', en: 'Reminder: register for {{title!}}[[ by {{deadlineShort}}]]' },
  condolence: { th: 'ขอแสดงความอาลัยแด่{{guestsInline!}}', en: 'In memory of {{guestsInline!}}' },
  thanks: { th: 'ขอขอบคุณผู้ร่วมสนับสนุน{{eventType}} “{{title!}}”', en: 'Thank you for supporting “{{title!}}”' },
};

// ข้อความสั้นสำหรับ X (≤ 280 ตัวอักษร)
export const SHORT = {
  invite: { th: '📢 ขอเชิญร่วม{{eventType}} “{{title!}}”\n📅 {{dateShort!}}[[ {{timeShort}}]]\n[[📍 {{place}}]]\n[[ลงทะเบียน {{regLink}}]]', en: '📢 You\'re invited: {{title!}}\n📅 {{dateShort!}}[[, {{timeShort}}]]\n[[📍 {{place}}]]\n[[Register: {{regLink}}]]' },
  meeting: { th: '📌 ขอเชิญประชุม{{title!}}\n📅 {{dateShort!}}[[ {{timeShort}}]]\n[[📍 {{place}}]]\n[[💻 {{meetingLink}}]]', en: '📌 Meeting: {{title!}}\n📅 {{dateShort!}}[[, {{timeShort}}]]\n[[📍 {{place}}]]\n[[💻 {{meetingLink}}]]' },
  recap: { th: '📸 {{host}} จัด{{eventType}} “{{title!}}”[[ เมื่อ{{dateShort}}]][[ ขอบคุณ{{guestNames}}]]', en: '📸 {{Host}} hosted “{{title!}}”[[ on {{dateShort}}]][[. Thank you, {{guestNames}}!]]' },
  congrats: { th: '🎉 {{host}} ขอแสดงความยินดีกับ{{guestNames!}} {{title!}}', en: '🎉 Congratulations to {{guestNames!}} on {{title!}}!' },
  announce: { th: '📢 ประกาศ: {{title!}}\n[[📅 {{dateShort}}]]\n[[{{regLink}}]]', en: '📢 Announcement: {{title!}}\n[[📅 {{dateShort}}]]\n[[{{regLink}}]]' },
  change: { th: '📌 [แจ้งเปลี่ยนแปลง] {{title!}}\n{{changesShort!}}\nขออภัยในความไม่สะดวก', en: '📌 [Change notice] {{title!}}\n{{changesShort!}}\nSorry for any inconvenience.' },
  reminder: { th: '⏳ ใกล้ปิดรับลงทะเบียน “{{title!}}”[[\nปิดรับ {{deadlineShort}}]]\n[[{{regLink}}]]', en: '⏳ Registration for “{{title!}}” closes soon[[ ({{deadlineShort}})]]\n[[{{regLink}}]]' },
  condolence: { th: '{{host}} ขอแสดงความอาลัยต่อการจากไปของ{{guestNames!}}', en: '{{Host}} mourns the passing of {{guestNames!}}.' },
  thanks: { th: '🙏 ขอขอบคุณ{{guestNames!}} ที่ร่วมทำให้ “{{title!}}” สำเร็จลุล่วงด้วยดี', en: '🙏 Thank you, {{guestNames!}}, for making “{{title!}}” a success!' },
};

// ข้อความโปสเตอร์: พาดหัว ≤ 8 คำ, หัวรอง, วัน-เวลา-สถานที่, คำชวน, ลิงก์/QR
const CTA = {
  th: { invite: 'ลงทะเบียนเลย!', meeting: 'โปรดเข้าร่วมประชุมตรงเวลา', recap: 'ขอบคุณทุกท่านที่มาร่วมงาน', congrats: 'ขอแสดงความยินดี', announce: 'อ่านรายละเอียดเพิ่มเติม', change: 'โปรดตรวจสอบกำหนดการใหม่', reminder: 'รีบลงทะเบียนก่อนปิดรับ!', condolence: 'ด้วยความอาลัยยิ่ง', thanks: 'ขอบคุณจากใจ' },
  en: { invite: 'Register now!', meeting: 'Please be on time', recap: 'Thank you for joining us', congrats: 'Congratulations!', announce: 'Read more', change: 'Please check the new schedule', reminder: 'Register before it closes!', condolence: 'With deepest sympathy', thanks: 'Thank you' },
};
export const POSTER = {
  th: `พาดหัว: {{title!}}
หัวรอง: {{eventType}}[[ โดย {{guestsInline}}]]
[[วัน-เวลา: {{dateShort}}[[ | {{time}}]]]]
[[สถานที่: {{place}}]]
คำชวน: {{cta}}
[[QR / ลิงก์: สแกนเพื่อลงทะเบียน ({{regLink}})]]
จัดโดย: {{host}}`,
  en: `Headline: {{title!}}
Sub-headline: {{EventType}}[[ with {{guestsInline}}]]
[[Date & time: {{dateShort}}[[ | {{time}}]]]]
[[Venue: {{place}}]]
Call to action: {{cta}}
[[QR / link: Scan to register ({{regLink}})]]
Hosted by: {{Host}}`,
};

// ---------- ตัวช่วย ----------
const EMOJI_RE = /(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:️|⃣|‍\p{Extended_Pictographic})*️?/gu;
export const countEmoji = (s) => (String(s || '').replace(/[©®™]/g, '').match(EMOJI_RE) || []).length;
export function stripEmoji(s) {
  return String(s || '').split('\n').map((l) => {
    const r = l.replace(EMOJI_RE, '');
    return r === l ? l : r.replace(/\s{2,}/g, ' ').trim();
  }).join('\n');
}

const PH = /\{\{\s*([A-Za-z_]+)(!)?(?:\|([^{}]*))?\s*\}\}/g;
export const placeholderKeys = (body) => [...String(body || '').matchAll(PH)].map((m) => m[1]);

function processGroups(text, val) {
  // จัดการ [[ ... ]] ซ้อนกันได้: ทำจากชั้นในสุดออกมา
  let prev;
  do {
    prev = text;
    text = text.replace(/\[\[((?:(?!\[\[)[\s\S])*?)\]\]/g, (_, inner) => {
      for (const m of inner.matchAll(PH)) if (!m[2] && m[3] === undefined && !val(m[1]).trim()) return '';
      return inner;
    });
  } while (text !== prev);
  return text;
}

export function fill(body, vars, missingLabel = (k) => k) {
  const val = (k) => (vars[k] == null ? '' : String(vars[k]));
  const t = processGroups(String(body ?? '').replace(/\r/g, ''), val);
  const out = [];
  for (const line of t.split('\n')) {
    let drop = false;
    const l = line.replace(PH, (_, k, req, fb) => {
      const v = val(k);
      if (v.trim()) return v;
      if (req) return `[กรอก: ${missingLabel(k)}]`;
      if (fb !== undefined) return fb;
      drop = true;
      return '';
    });
    if (!drop) out.push(l.replace(/[ \t]+$/, ''));
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const joinList = (arr, lang) => (arr.length < 2 ? arr.join('') : arr.slice(0, -1).join(', ') + (lang === 'th' ? ' และ' : ' and ') + ' ' + arr[arr.length - 1]);

export function pickHashtags(style, channelId, eventType, n) {
  if (!n) return '';
  const sets = (style && style.hashtags) || [];
  const match = (s) => (!s.channel || s.channel === '*' || s.channel === channelId) && (!s.eventType || s.eventType === '*' || s.eventType === eventType);
  const ordered = [...sets.filter((s) => match(s) && s.eventType && s.eventType !== '*'), ...sets.filter((s) => match(s) && (!s.eventType || s.eventType === '*'))];
  const tags = [];
  for (const s of ordered) for (const t of String(s.tags || '').split(/\s+/)) if (t.startsWith('#') && t.length > 1 && !tags.includes(t)) tags.push(t);
  return tags.slice(0, n).join(' ');
}

const signatureOf = (style, lang) => {
  const list = (style && style.signatures) || [];
  return (list.find((s) => s.lang === lang) || {}).text || '';
};

// ---------- ตัวแปรของแต่ละภาษา ----------
const INFO_ITEMS = {
  invite: ['date', 'time', 'place', 'online', 'mid', 'reg', 'deadline'],
  meeting: ['date', 'time', 'place', 'online', 'mid'],
  recap: [], congrats: [], thanks: [],
  announce: ['date', 'time', 'place', 'online', 'reg', 'deadline'],
  change: ['date', 'time', 'place', 'online', 'mid', 'reg'],
  reminder: ['deadline', 'reg', 'date', 'time', 'place', 'online'],
  condolence: ['date', 'time', 'place'],
};
const INFO_FMT = {
  th: {
    plain: { date: '• %', time: '• เวลา %', place: '• ณ %', online: '• ประชุมออนไลน์: %', mid: '• Meeting ID: %', reg: '• ลงทะเบียน: %', deadline: '• ปิดรับลงทะเบียน%' },
    full: { date: '📅 %', time: '⏰ เวลา %', place: '📍 %', online: '💻 ออนไลน์: %', mid: '🔑 Meeting ID: %', reg: '📝 ลงทะเบียน: %', deadline: '⏳ ปิดรับลงทะเบียน%' },
  },
  en: {
    plain: { date: 'Date: %', time: 'Time: %', place: 'Venue: %', online: 'Online: %', mid: 'Meeting ID: %', reg: 'Register: %', deadline: 'Registration closes: %' },
    full: { date: '📅 %', time: '⏰ %', place: '📍 %', online: '💻 Online: %', mid: '🔑 Meeting ID: %', reg: '📝 Register: %', deadline: '⏳ Registration closes: %' },
  },
};
// ป้ายของช่องที่เปลี่ยน (ใช้ในแจ้งเปลี่ยนแปลง)
const DIFF_LABEL = {
  th: { title: 'ชื่องาน', date: 'วันที่', time: 'เวลา', place: 'สถานที่', online: 'ลิงก์ประชุมออนไลน์', mid: 'Meeting ID', reg: 'ลิงก์ลงทะเบียน', deadline: 'ปิดรับลงทะเบียน' },
  en: { title: 'Title', date: 'Date', time: 'Time', place: 'Venue', online: 'Online link', mid: 'Meeting ID', reg: 'Registration link', deadline: 'Registration deadline' },
};

function infoValues(f, lang, enOr) {
  const th = lang === 'th';
  return {
    title: th ? f.title : enOr('title'),
    date: fmtRange(f.date, f.endDate, lang),
    time: fmtTime(f.startTime, f.endTime, lang),
    place: th ? f.place : enOr('place'),
    online: f.meetingLink || '',
    mid: f.meetingId || '',
    reg: f.regLink || '',
    deadline: fmtDate(f.deadline, lang),
  };
}

export function buildVars(f, lang, ctx) {
  const { kind = 'invite', infoStyle = 'plain', style = {}, settings = {}, prevFields = null } = ctx;
  const th = lang === 'th';
  const enOr = (k) => f[k + 'En'] || (f[k] ? `[กรอก: ${fieldLabel(k + 'En', kind)}]` : '');
  const pick = (k) => (th ? f[k] || '' : f[k + 'En'] || '');
  const et = eventTypeOf(f.eventType);
  const facultyTh = style.facultyTh || FACULTY.th;
  const facultyEn = style.facultyEn || FACULTY.en;
  const faculty = th ? facultyTh : facultyEn;
  const org = pick('organizer');
  const host = org ? (th ? (org.includes('ศิลปศาสตร์') ? org : `${org} ${facultyTh}`) : (/liberal arts/i.test(org) ? org : `${org}, ${facultyEn}`)) : faculty;
  const guests = (f.guests || []).filter((g) => g && (g.name || g.nameEn));
  const gname = (g) => {
    if (th) return [g.name || g.nameEn, g.role].filter(Boolean).join(' ');
    const n = g.nameEn || (g.name ? `[กรอก: ชื่อ ${g.name} (อังกฤษ)]` : '');
    return [n, g.roleEn].filter(Boolean).join(', ');
  };
  const iv = infoValues(f, lang, enOr);
  const fmtSet = INFO_FMT[th ? 'th' : 'en'];
  const items = INFO_ITEMS[kind] || INFO_ITEMS.invite;
  const lineOf = (k) => {
    const v = iv[k];
    if (!v) return '';
    const useEmoji = infoStyle === 'full' || (infoStyle === 'light' && (k === 'date' || k === 'place'));
    return (useEmoji ? fmtSet.full : fmtSet.plain)[k].replace('%', v);
  };
  // แจ้งเปลี่ยนแปลง: เทียบกับเวอร์ชันก่อนหน้า
  let changes = '', unchanged = '', changesShort = '';
  if (prevFields) {
    const ov = infoValues(prevFields, lang, (k) => prevFields[k + 'En'] || prevFields[k] || '');
    const keys = ['title', 'date', 'time', 'place', 'online', 'mid', 'reg', 'deadline'];
    const changed = keys.filter((k) => (ov[k] || '') !== (iv[k] || ''));
    const L = DIFF_LABEL[th ? 'th' : 'en'];
    const none = th ? '(ไม่มี)' : '(none)';
    changes = changed.map((k) => (th ? `• ${L[k]}: จากเดิม ${ov[k] || none} เปลี่ยนเป็น ${iv[k] || none}` : `• ${L[k]}: changed from ${ov[k] || none} to ${iv[k] || none}`)).join('\n');
    changesShort = changed.map((k) => `${L[k]}: ${iv[k] || none}`).join('\n');
    unchanged = ['date', 'time', 'place', 'online'].filter((k) => !changed.includes(k) && iv[k])
      .map((k) => `• ${L[k]}: ${iv[k]} ${th ? '(ไม่เปลี่ยนแปลง)' : '(unchanged)'}`).join('\n');
  } else {
    changes = pick('notes');
    changesShort = changes.split('\n')[0] || '';
  }
  const particle = settings.particle || 'none';
  const contact = th
    ? [f.contactName, f.phone && 'โทร. ' + f.phone, f.email && 'อีเมล ' + f.email].filter(Boolean).join(' ')
    : [enOr('contactName'), f.phone && 'Tel. ' + f.phone, f.email && 'Email: ' + f.email].filter(Boolean).join(', ');
  const vars = {
    title: th ? f.title : f.titleEn,
    eventType: th ? et.th : et.en,
    EventType: th ? et.th : cap(et.en),
    eventKind: th ? et.thc : et.en,
    date: iv.date,
    dateShort: fmtRange(f.date, f.endDate, lang, { short: true }),
    dateNoDay: fmtRange(f.date, f.endDate, lang, { weekday: false }),
    time: iv.time,
    timeShort: f.startTime ? (th ? f.startTime.replace(':', '.') + ' น.' : fmtTime(f.startTime, '', 'en').replace('from ', '')) : '',
    place: th ? f.place : enOr('place'),
    organizer: org,
    host,
    Host: cap(host),
    faculty,
    Faculty: cap(faculty),
    facultyShort: th ? FACULTY.thShort : FACULTY.enShort,
    chair: th ? f.chair || '' : enOr('chair'),
    guests: guests.map((g) => '• ' + gname(g)).join('\n'),
    guestsInline: joinList(guests.map(gname), lang),
    guestNames: joinList(guests.map((g) => (th ? g.name || g.nameEn : g.nameEn || (g.name ? `[กรอก: ชื่อ ${g.name} (อังกฤษ)]` : ''))), lang),
    audience: pick('audience'),
    regLink: f.regLink,
    deadline: iv.deadline,
    deadlineShort: fmtDate(f.deadline, lang, { short: true }),
    meetingLink: f.meetingLink,
    meetingId: f.meetingId,
    contactName: pick('contactName'),
    phone: f.phone,
    email: f.email,
    contact,
    notes: pick('notes'),
    infoBlock: items.map(lineOf).filter(Boolean).join('\n'),
    changes,
    changesShort,
    unchanged,
    cta: CTA[th ? 'th' : 'en'][kind] || '',
    p: th ? (particle === 'khrap' ? 'ครับ' : particle === 'kha' ? 'ค่ะ' : '') : '',
    pq: th ? (particle === 'khrap' ? 'ครับ' : particle === 'kha' ? 'คะ' : '') : '',
    year: f.date ? (th ? +f.date.slice(0, 4) + 543 : f.date.slice(0, 4)) : '',
  };
  for (const x of FIELDS) {
    if (x.en) { vars[x.key + '_th'] = f[x.key] || ''; vars[x.key + '_en'] = f[x.key + 'En'] || ''; }
  }
  return vars;
}

// ชื่อช่องที่ใช้ใน [กรอก: ...]
function missingLabeler(lang, kind) {
  const computed = { date: 'date', dateShort: 'date', dateNoDay: 'date', time: 'startTime', timeShort: 'startTime', deadline: 'deadline', deadlineShort: 'deadline',
    guests: 'guests', guestsInline: 'guests', guestNames: 'guests', contact: 'contactName', changes: 'notes', changesShort: 'notes', Host: 'organizer', host: 'organizer', infoBlock: 'date' };
  return (k) => {
    const base = computed[k] || k.replace(/_(th|en)$/, '');
    const f = FIELDS.find((x) => x.key === base);
    if (k === 'changes' || k === 'changesShort') return kind === 'change' ? 'รายละเอียดการเปลี่ยนแปลง' : fieldLabel('notes', kind);
    return fieldLabel(lang === 'en' && f && f.en ? base + 'En' : base, kind).replace(/\s*\((?!อังกฤษ).*?\)$/, '');
  };
}

// ---------- เลือกเทมเพลต ----------
export function builtinBody(kind, tone, lang, channelId) {
  const ch = channelOf(channelId);
  if (ch.short) return SHORT[kind][lang];
  if (ch.poster) return POSTER[lang];
  return BODIES[kind][tone][lang];
}

// หาเทมเพลตของผู้ใช้ที่ตั้งให้ใช้แทนต้นแบบ (เจาะจงมากที่สุดก่อน)
export function findOverride(userTemplates, { kind, tone, channel, lang }) {
  const cands = (userTemplates || []).filter((t) => !t.deleted && t.override && t.kind === kind && t.lang === lang
    && (t.tone === '*' || t.tone === tone) && (t.channel === '*' || t.channel === channel));
  cands.sort((a, b) => (b.channel !== '*') - (a.channel !== '*') || (b.tone !== '*') - (a.tone !== '*'));
  return cands[0] || null;
}

// ---------- สร้างโพสต์ ----------
/**
 * opts: { kind, tone, channel, lang ('th'|'en'|'both'), settings, style, userTemplates, templateId, prevFields }
 * คืน { text, subject, used: [{lang, source, name}], toneId }
 */
export function renderPost(fields, opts) {
  const ch = channelOf(opts.channel);
  const customTones = (opts.settings && opts.settings.customTones) || [];
  const toneId = ch.forceTone || baseTone(opts.tone, customTones);
  const tone = TONES.find((t) => t.id === toneId) || TONES[2];
  const kind = KINDS.some((k) => k.id === opts.kind) ? opts.kind : 'invite';
  const emojiOK = ch.emoji && tone.emoji[1] > 0 && kind !== 'condolence';
  const infoStyle = !emojiOK ? 'plain' : toneId === 'semi' ? 'light' : toneId === 'casual' || toneId === 'teen' ? 'full' : 'plain';
  const langs = opts.lang === 'both' ? ['th', 'en'] : [opts.lang === 'en' ? 'en' : 'th'];
  const used = [];
  const parts = langs.map((lang) => {
    const vars = buildVars(fields, lang, { kind, infoStyle, style: opts.style, settings: opts.settings, prevFields: opts.prevFields });
    vars.hashtags = pickHashtags(opts.style, ch.id, fields.eventType, kind === 'condolence' ? 0 : ch.tags);
    vars.signature = signatureOf(opts.style, lang);
    const label = missingLabeler(lang, kind);
    let tpl = null;
    if (opts.templateId) tpl = (opts.userTemplates || []).find((t) => t.id === opts.templateId && t.lang === lang && !t.deleted) || null;
    if (!tpl) tpl = findOverride(opts.userTemplates, { kind, tone: toneId, channel: ch.id, lang });
    const body = tpl ? tpl.body : builtinBody(kind, toneId, lang, ch.id);
    used.push({ lang, source: tpl ? 'user' : 'builtin', name: tpl ? tpl.name : 'ต้นแบบ', id: tpl ? tpl.id : null });
    let text = fill(body, vars, label);
    if (!emojiOK) text = stripEmoji(text);
    let subject = ch.subject ? stripEmoji(fill(SUBJECTS[kind][lang], vars, label)) : '';
    const fullCustom = tpl && tpl.channel !== '*';
    if (!fullCustom) text = frame(ch.id, text, { lang, kind, toneId, vars, subject });
    return { text, subject, vars, hasTagsVar: /\{\{\s*hashtags/.test(body) };
  });
  const sep = ch.id === 'email' || ch.id === 'circular' || ch.id === 'web' ? '\n\n----------\n\n' : '\n\n— — —\n\n';
  let text = parts.map((p) => p.text).join(sep);
  const subject = parts.map((p) => p.subject).filter(Boolean).join(' / ');
  const n = toneId === 'official' ? Math.min(ch.tags, 2) : ch.tags;
  const tags = pickHashtags(opts.style, ch.id, fields.eventType, kind === 'condolence' ? 0 : n);
  if (tags && !parts.some((p) => p.hasTagsVar)) text += '\n\n' + tags;
  return { text: text.trim(), subject, used, toneId, emojiOK, channel: ch.id };
}

function frame(channelId, body, { lang, kind, toneId, vars, subject }) {
  const th = lang === 'th';
  const formal = toneId === 'official' || toneId === 'formal';
  if (channelId === 'email') {
    const greet = th
      ? (formal || toneId === 'semi' ? `เรียน ${vars.audience || (formal ? 'ผู้เกี่ยวข้องทุกท่าน' : 'ทุกท่าน')}` : vars.p ? `สวัสดี${vars.p}` : 'สวัสดีทุกคน')
      : (formal || toneId === 'semi' ? `Dear ${vars.audience || 'all'},` : 'Hi everyone,');
    const close = th ? (formal ? 'ขอแสดงความนับถือ' : 'ขอบคุณ' + vars.p) : formal ? 'Yours sincerely,' : toneId === 'semi' ? 'Best regards,' : 'Best wishes,';
    return [greet, '', body, '', close, vars.signature || null].filter((x) => x !== null).join('\n').trim();
  }
  if (channelId === 'circular') {
    const closeTh = { invite: 'จึงเรียนมาเพื่อโปรดทราบ และขอเชิญชวนผู้สนใจเข้าร่วมโดยทั่วกัน', reminder: 'จึงเรียนมาเพื่อโปรดทราบ และขอเชิญชวนผู้สนใจลงทะเบียนโดยทั่วกัน',
      meeting: 'จึงเรียนมาเพื่อโปรดเข้าร่วมประชุมตามวัน เวลา และสถานที่ดังกล่าว', announce: 'จึงเรียนมาเพื่อโปรดทราบโดยทั่วกัน' }[kind] || 'จึงเรียนมาเพื่อโปรดทราบ';
    const closeEn = { invite: 'For your information. All are welcome to attend.', reminder: 'For your information and kind attention.', meeting: 'Your attendance is kindly requested.' }[kind] || 'For your information.';
    return th
      ? `เรื่อง  ${subject}\nเรียน  ${vars.audience || 'คณาจารย์ บุคลากร และนักศึกษา'}\n\n${body}\n\n${closeTh}${vars.signature ? '\n\n' + vars.signature : ''}`
      : `Subject: ${subject}\nTo: ${vars.audience || 'All faculty members, staff and students'}\n\n${body}\n\n${closeEn}${vars.signature ? '\n\n' + vars.signature : ''}`;
  }
  if (channelId === 'web') return `${subject}\n\n${body}`;
  return body;
}

// ตัวอย่างเทมเพลตเปล่าสำหรับเริ่มเขียนเอง
export const PLACEHOLDER_HELP = [
  ['title', 'ชื่องาน'], ['eventType', 'ประเภทงาน (การสัมมนา)'], ['eventKind', 'ประเภทงานแบบภาษาพูด'], ['date', 'วันที่เต็ม พร้อมวัน'], ['dateShort', 'วันที่แบบย่อ'],
  ['time', 'เวลา'], ['place', 'สถานที่'], ['host', 'ผู้จัด (ชื่อคณะเต็ม)'], ['chair', 'ประธาน'], ['guests', 'รายชื่อวิทยากร (ทีละบรรทัด)'],
  ['guestsInline', 'รายชื่อวิทยากรพร้อมตำแหน่งในประโยค'], ['guestNames', 'เฉพาะชื่อวิทยากร'], ['audience', 'กลุ่มเป้าหมาย'], ['regLink', 'ลิงก์ลงทะเบียน'], ['deadline', 'วันปิดรับ'], ['meetingLink', 'ลิงก์ประชุม'],
  ['meetingId', 'Meeting ID'], ['contact', 'ผู้ติดต่อ + โทร + อีเมล'], ['notes', 'รายละเอียดเพิ่มเติม'], ['infoBlock', 'กล่องข้อมูลสำคัญ'], ['changes', 'รายการที่เปลี่ยน'],
  ['unchanged', 'ข้อมูลที่ไม่เปลี่ยน'], ['hashtags', 'แฮชแท็ก'], ['signature', 'ลายเซ็น'], ['p', 'คำลงท้าย ครับ/ค่ะ'], ['pq', 'คำลงท้าย ครับ/คะ'],
];
