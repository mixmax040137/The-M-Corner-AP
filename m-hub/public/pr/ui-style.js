// หน้าแนวทางการเขียน (CI): ชื่อคณะ ถ้อยคำบังคับ คำต้องห้าม/ไม่แนะนำ แฮชแท็ก ลายเซ็น และคำอธิบายโทน
// ใช้ในโหมดเทมเพลตทันที และส่งให้ AI เป็นรายการสั้น ๆ ในโหมด AI
import { h, setKids, btn, field, select, toast, confirmBox, text, debounce } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { newId } from './db.js';
import { CHANNELS, EVENT_TYPES, TONES } from './fields.js';
import { DEFAULT_STYLE } from './sample.js';

let st;

export async function mount(el, app) {
  st = { app, el, box: h('div.pr-stack') };
  el.append(
    h('p.intro', 'กำหนดครั้งเดียว ใช้ทุกโพสต์: ตัวตรวจ “ควรเช็ก” เตือนเมื่อพบคำต้องห้าม (พร้อมปุ่มแทนคำให้) และเมื่อขาดถ้อยคำบังคับ ส่วนแฮชแท็กและลายเซ็นใส่ให้อัตโนมัติตามช่องทาง'),
    st.box);
}

export async function show() { draw(); }

const save = debounce(() => st.app.saveStyle({}), 400);

function draw() {
  const sy = st.app.style;
  sy.banned ||= [];
  sy.required ||= [];
  sy.hashtags ||= [];
  sy.signatures ||= [];
  sy.toneNotes ||= {};
  setKids(st.box,
    h('section.card', h('h3.card-title', icon('award'), 'ชื่อคณะ'),
      h('div.grid2',
        field('ภาษาไทย (ใช้เมื่อกล่าวถึงครั้งแรก)', text(sy.facultyTh, (v) => { sy.facultyTh = v; save(); })),
        field('ภาษาอังกฤษ', text(sy.facultyEn, (v) => { sy.facultyEn = v; save(); }), 'ขึ้นต้นด้วย the เพื่อใช้กลางประโยค เช่น “the Faculty of Liberal Arts, Thammasat University”'))),

    h('section.card', h('h3.card-title', icon('check'), 'ถ้อยคำบังคับ'),
      h('div.hint', '“ชื่อเต็มครั้งแรก” = ครั้งแรกที่พบคำย่อ ต้องเป็นชื่อเต็ม (เช่น คณะศิลปศาสตร์ → คณะศิลปศาสตร์ มหาวิทยาลัยธรรมศาสตร์) · “ต้องมี” = โพสต์ต้องมีถ้อยคำนี้'),
      h('div.field-list', sy.required.map((r, i) => h('div.field-item', { 'data-required': i },
        h('div.grid4',
          field('ถ้อยคำเต็ม', text(r.text, (v) => { r.text = v; save(); })),
          field('คำย่อที่ต้องตรวจ', text(r.short || '', (v) => { r.short = v; save(); }, { placeholder: 'ใช้กับ “ชื่อเต็มครั้งแรก”' })),
          field('กฎ', select([['firstFull', 'ชื่อเต็มครั้งแรก'], ['contains', 'ต้องมี']], r.rule || 'contains', (v) => { r.rule = v; save(); })),
          field('ภาษา', select([['th', 'ไทย'], ['en', 'อังกฤษ'], ['*', 'ทุกภาษา']], r.lang || '*', (v) => { r.lang = v; save(); }))),
        h('div.row.end', btn('ลบ', () => { sy.required.splice(i, 1); save(); draw(); }, { ic: 'trash', kind: 'ghost sm' }))))),
      btn('เพิ่มถ้อยคำบังคับ', () => { sy.required.push({ text: '', short: '', rule: 'contains', lang: 'th' }); save(); draw(); }, { ic: 'plus', kind: 'sm' })),

    h('section.card', h('h3.card-title', icon('alert'), 'คำต้องห้าม / ไม่แนะนำ'),
      h('div.table-wrap', h('table.table',
        h('thead', h('tr', h('th', 'คำที่พบ'), h('th', 'ควรใช้'), h('th', 'ระดับ'), h('th', 'หมายเหตุ'), h('th', ''))),
        h('tbody', sy.banned.map((w, i) => h('tr', { 'data-banned': w.word },
          h('td', h('input', { type: 'text', value: w.word, 'aria-label': 'คำที่พบ', oninput: (e) => { w.word = e.target.value; save(); } })),
          h('td', h('input', { type: 'text', value: w.suggest || '', 'aria-label': 'คำที่ควรใช้', oninput: (e) => { w.suggest = e.target.value; save(); } })),
          h('td', select([['error', 'ห้ามใช้ (ต้องแก้)'], ['warn', 'ไม่แนะนำ (ควรดู)']], w.level || 'warn', (v) => { w.level = v; save(); })),
          h('td', h('input', { type: 'text', value: w.note || '', 'aria-label': 'หมายเหตุ', oninput: (e) => { w.note = e.target.value; save(); } })),
          h('td', btn('', () => { sy.banned.splice(i, 1); save(); draw(); }, { ic: 'trash', kind: 'icon-only sm', title: 'ลบ' }))))))),
      h('div.row.wrap',
        btn('เพิ่มคำ', () => { sy.banned.push({ word: '', suggest: '', level: 'warn', note: '' }); save(); draw(); st.box.querySelector('tr:last-child input')?.focus(); }, { ic: 'plus', kind: 'sm' }),
        h('span.hint', 'ตัวอย่างที่ใส่ไว้: คำที่มักสะกดผิด เช่น คลิ๊ก → คลิก, สัมนา → สัมมนา, นะค่ะ → นะคะ'))),

    h('section.card', h('h3.card-title', icon('grid'), 'ชุดแฮชแท็ก'),
      h('div.field-list', sy.hashtags.map((t, i) => h('div.field-item',
        h('div.grid3',
          field('ชื่อชุด', text(t.label, (v) => { t.label = v; save(); })),
          field('ใช้กับช่องทาง', select([['*', 'ทุกช่องทาง'], ...CHANNELS.map((c) => [c.id, c.th])], t.channel || '*', (v) => { t.channel = v; save(); })),
          field('ใช้กับประเภทงาน', select([['*', 'ทุกประเภท'], ...EVENT_TYPES.map((e) => [e.id, e.label])], t.eventType || '*', (v) => { t.eventType = v; save(); }))),
        h('div.row', h('div', { style: { flex: '1' } }, text(t.tags, (v) => { t.tags = v; save(); }, { 'aria-label': 'แฮชแท็ก', placeholder: '#แท็ก1 #แท็ก2' })),
          btn('', () => { sy.hashtags.splice(i, 1); save(); draw(); }, { ic: 'trash', kind: 'icon-only sm', title: 'ลบชุดนี้' }))))),
      btn('เพิ่มชุดแฮชแท็ก', () => { sy.hashtags.push({ id: newId('h'), label: 'ชุดใหม่', channel: '*', eventType: '*', tags: '' }); save(); draw(); }, { ic: 'plus', kind: 'sm' }),
      h('div.hint', 'จำนวนที่ใส่อัตโนมัติ: Facebook 3, Instagram 6, X 2, ข้อความโปสเตอร์ 1 (โทนราชการไม่เกิน 2, โพสต์ไว้อาลัยไม่ใส่) · ชุดที่ระบุประเภทงานใช้ก่อน')),

    h('section.card', h('h3.card-title', icon('mail'), 'ลายเซ็น (อีเมลและหนังสือเวียน)'),
      h('div.grid2', ...['th', 'en'].map((lang) => {
        let sig = sy.signatures.find((x) => x.lang === lang);
        if (!sig) { sig = { id: newId('s'), lang, text: '' }; sy.signatures.push(sig); }
        return field(lang === 'th' ? 'ภาษาไทย' : 'English', h('textarea', { rows: 4, value: sig.text, oninput: (e) => { sig.text = e.target.value; save(); } }));
      }))),

    h('section.card', h('h3.card-title', icon('pen'), 'คำอธิบายโทน (ส่งให้ AI ในโหมด AI)'),
      h('div.grid2', TONES.map((t) => field(t.th, h('textarea', { rows: 2, value: sy.toneNotes[t.id] ?? t.desc, oninput: (e) => { sy.toneNotes[t.id] = e.target.value; save(); } }))))),

    h('div.row', btn('คืนค่าแนวทางเริ่มต้นทั้งหมด', async () => {
      if (!(await confirmBox('คืนค่าชื่อคณะ ถ้อยคำบังคับ คำต้องห้าม แฮชแท็ก ลายเซ็น และคำอธิบายโทนเป็นค่าเริ่มต้น?', { ok: 'คืนค่า', danger: true }))) return;
      const d = structuredClone(DEFAULT_STYLE);
      await st.app.saveStyle({ facultyTh: d.facultyTh, facultyEn: d.facultyEn, required: d.required, banned: d.banned, hashtags: d.hashtags, signatures: d.signatures, toneNotes: {} });
      toast('คืนค่าแล้ว', 'ok');
      draw();
    }, { kind: 'ghost' })));
}
