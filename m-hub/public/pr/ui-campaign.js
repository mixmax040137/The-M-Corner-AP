// หน้าต่าง “สร้างชุดโพสต์” (5 ชิ้นต่องาน) และหน้าต่างแก้โพสต์ในปฏิทิน — ใช้ร่วมกันหลายหน้า
import { h, setKids, btn, field, select, toast, copyText, confirmBox } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { repo } from './db.js';
import { TONES, LANGS, CHANNELS, kindOf, channelOf, toneOf } from './fields.js';
import { fmtDate } from './dates.js';
import { planCampaign, renderStage, stageOf } from './campaign.js';
import { renderPost } from './templates.js';
import { checkPost } from './checker.js';
import { METRICS, engagement } from './stats.js';

export const STATUS = [['draft', 'ร่าง'], ['approved', 'อนุมัติแล้ว'], ['posted', 'โพสต์แล้ว']];

function dialog(title, ...body) {
  const dlg = h('dialog.dialog.pr-dialog', { 'aria-label': title });
  const close = () => { dlg.close(); dlg.remove(); };
  dlg.addEventListener('cancel', close);
  setKids(dlg, h('div.row', h('h3', title), h('span.spacer'), btn('', close, { ic: 'x', kind: 'icon-only sm', title: 'ปิด' })), ...body);
  document.body.append(dlg);
  dlg.showModal();
  return { dlg, close };
}

const dateInput = (value, onChange, label) => {
  const hint = h('span.hint');
  const drawHint = (v) => { hint.textContent = v ? fmtDate(v, 'th') : ''; };
  drawHint(value);
  const inp = h('input', { type: 'date', value: value || '', 'aria-label': label, oninput: (e) => { drawHint(e.target.value); onChange(e.target.value); } });
  return h('div.pr-stack.pr-date', inp, hint);
};

// ---------- สร้างชุดโพสต์ ----------
export async function openCampaign(app, eventId) {
  const ev = await repo.get('events', eventId);
  if (!ev) return toast('ไม่พบงาน', 'warn');
  if (!ev.fields.date) return toast('ใส่วันงานก่อน แล้วค่อยสร้างชุดโพสต์', 'warn');
  const s = app.settings;
  const o = { channel: s.channel, tone: s.tone, lang: s.lang };
  const plan = planCampaign(ev);
  const existing = (await repo.list('posts')).filter((p) => p.eventId === eventId && p.stage);
  const rows = plan.map((p) => h('tr', { 'data-stage': p.stage.id },
    h('td', h('input', { type: 'checkbox', checked: p.include, disabled: !p.date && !!p.note, 'aria-label': 'สร้าง ' + p.stage.th, onchange: (e) => { p.include = e.target.checked; } })),
    h('td', h('b', p.stage.th), h('div.muted.small', kindOf(p.kind).th)),
    h('td', p.note && !p.date ? h('span.muted.small', p.note) : dateInput(p.date, (v) => { p.date = v; }, 'วันที่โพสต์ ' + p.stage.th)),
    h('td', p.note && p.date ? h('span.status-warn.small', p.note) : null)));
  const { close } = dialog('สร้างชุดโพสต์: ' + (ev.fields.title || 'งาน'),
    h('p.small.muted', 'ระบบแนะนำวันที่ให้จากวันงานและวันปิดรับลงทะเบียน (แก้ได้) ทุกชิ้นเขียนด้วยเทมเพลต (0 token) และบันทึกเป็น “ร่าง” ไว้ในปฏิทิน เปิดแก้ทีละชิ้นได้'),
    existing.length ? h('div.note.warn', `งานนี้มีโพสต์จากชุดโพสต์อยู่แล้ว ${existing.length} ชิ้น — สร้างใหม่จะเพิ่มอีกชุด`) : null,
    h('div.grid3',
      field('ช่องทาง', select(CHANNELS.map((c) => [c.id, c.th]), o.channel, (v) => { o.channel = v; })),
      field('โทน', select([...TONES.map((t) => [t.id, t.th]), ...(s.customTones || []).map((t) => [t.id, t.th])], o.tone, (v) => { o.tone = v; })),
      field('ภาษา', select(LANGS.map((l) => [l.id, l.th]), o.lang, (v) => { o.lang = v; }))),
    h('div.table-wrap', h('table.table.pr-camp', h('thead', h('tr', h('th', ''), h('th', 'ชิ้น'), h('th', 'วันที่โพสต์'), h('th', ''))), h('tbody', rows))),
    h('div.row.end',
      btn('ยกเลิก', () => close(), { kind: 'ghost' }),
      btn('สร้างโพสต์ที่เลือก', async () => {
        const chosen = plan.filter((p) => p.include && p.date);
        if (!chosen.length) return toast('ยังไม่ได้เลือกชิ้นไหน', 'warn');
        const toneBase = toneOf(o.tone, s.customTones || []).base || o.tone;
        for (const p of chosen) {
          const r = renderStage(ev, p.stage.id, { ...o, toneBase, settings: app.settings, style: app.style, userTemplates: await repo.list('templates') });
          await repo.put('posts', { eventId, eventType: ev.fields.eventType, kind: p.kind, stage: p.stage.id, tone: o.tone, channel: o.channel, lang: o.lang,
            text: r.text, subject: r.subject, status: 'draft', source: 'template', plannedDate: p.date, metrics: {}, sample: !!ev.sample });
        }
        close();
        toast(`สร้างโพสต์ ${chosen.length} ชิ้นแล้ว (ร่าง) — ดูในปฏิทินโพสต์`, 'ok', 4000);
        app.go('calendar', { m: chosen[0].date.slice(0, 7) });
      }, { ic: 'calendar', kind: 'primary' })));
}

// ---------- แก้โพสต์ ----------
export async function openPostEditor(app, postId) {
  const p = await repo.get('posts', postId);
  if (!p) return toast('ไม่พบโพสต์', 'warn');
  const ev = p.eventId ? await repo.get('events', p.eventId) : null;
  const ch = channelOf(p.channel);
  const textArea = h('textarea.pr-text', { rows: 12, value: p.text || '', 'aria-label': 'ข้อความโพสต์', oninput: () => drawChecks() });
  const subject = ch.subject ? h('input', { type: 'text', value: p.subject || '', 'aria-label': 'หัวเรื่อง', oninput: () => drawChecks() }) : null;
  const checks = h('div');
  let planned = p.plannedDate || '';
  let status = p.status || 'draft';
  const drawChecks = () => {
    const res = checkPost(textArea.value, { fields: ev ? ev.fields : {}, kind: p.kind, tone: p.tone, channel: p.channel, lang: p.lang, style: app.style, settings: app.settings, subject: subject ? subject.value : '', staff: app.staff || [] });
    const bad = res.items.filter((i) => i.level === 'error' || i.level === 'warn');
    setKids(checks, bad.length
      ? h('ul.check-list', bad.slice(0, 6).map((i) => h('li.check-item.' + i.level, icon(i.level === 'error' ? 'xCircle' : 'alert'), h('span.check-msg', i.msg))))
      : h('div.check-item.ok', icon('checkCircle'), h('span.check-msg', 'ไม่พบปัญหาที่ตรวจได้อัตโนมัติ')));
  };
  drawChecks();
  // ผลการโพสต์ (ใส่ได้เมื่อโพสต์แล้ว)
  const m = { ...(p.metrics || {}) };
  const pa = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/.exec(String(p.postedAt || '')) || [];
  const posted = { date: pa[1] || '', time: pa[2] || '' };
  const engOut = h('b');
  const drawEng = () => { engOut.textContent = engagement(m).toLocaleString('th-TH'); };
  drawEng();
  const metricsBox = h('details.pr-help.pr-metrics', { open: p.status === 'posted' },
    h('summary', 'ผลการโพสต์ (Reach, รีแอ็กชัน, คอมเมนต์ ฯลฯ)'),
    h('div.grid2',
      field('วันที่โพสต์จริง', h('input', { type: 'date', value: posted.date, 'aria-label': 'วันที่โพสต์จริง', oninput: (e) => { posted.date = e.target.value; } })),
      field('เวลาที่โพสต์', h('input', { type: 'time', value: posted.time, 'aria-label': 'เวลาที่โพสต์', oninput: (e) => { posted.time = e.target.value; } }))),
    h('div.pr-metric-grid', METRICS.map(([k, t]) => field(t, h('input', { type: 'number', min: 0, value: m[k] ?? '', 'aria-label': t, oninput: (e) => { m[k] = e.target.value === '' ? '' : Math.max(0, +e.target.value); drawEng(); } })))),
    h('div.small', 'Engagement (รีแอ็กชัน + คอมเมนต์ + แชร์ + คลิก): ', engOut));
  const save = async (extra = {}) => {
    const t = new Date().toISOString();
    const st2 = posted.date && status !== 'posted' ? 'posted' : status;
    const postedAt = posted.date ? posted.date + (posted.time ? 'T' + posted.time : '') : st2 === 'posted' ? p.postedAt || t : p.postedAt;
    await repo.put('posts', { ...p, text: textArea.value, subject: subject ? subject.value : p.subject, plannedDate: planned, status: st2,
      approvedAt: st2 !== 'draft' ? p.approvedAt || t : p.approvedAt, postedAt, metrics: m, edited: true, ...extra });
  };
  const label = [p.stage ? stageOf(p.stage).th : kindOf(p.kind).th, ch.th, (LANGS.find((l) => l.id === p.lang) || {}).th, 'โทน' + toneOf(p.tone, app.settings.customTones).th].join(' · ');
  const { close } = dialog(ev ? ev.fields.title || 'โพสต์' : 'โพสต์',
    h('div.muted.small', label),
    h('div.grid2',
      field('วันที่จะโพสต์', dateInput(planned, (v) => { planned = v; }, 'วันที่จะโพสต์')),
      field('สถานะ', select(STATUS, status, (v) => { status = v; }))),
    subject ? field('หัวเรื่อง', subject) : null,
    textArea,
    checks,
    metricsBox,
    h('div.row.wrap',
      btn('บันทึก', async () => { await save(); close(); toast('บันทึกแล้ว', 'ok', 1500); }, { ic: 'save', kind: 'primary' }),
      btn('คัดลอก', () => copyText(textArea.value), { ic: 'copy' }),
      ev ? btn('สร้างใหม่จากเทมเพลต', async () => {
        const opts = { tone: p.tone, toneBase: toneOf(p.tone, app.settings.customTones || []).base || p.tone, channel: p.channel, lang: p.lang, settings: app.settings, style: app.style, userTemplates: await repo.list('templates') };
        const r = p.stage ? renderStage(ev, p.stage, opts) : renderPost(ev.fields, { ...opts, kind: p.kind });
        textArea.value = r.text;
        if (subject) subject.value = r.subject;
        drawChecks();
      }, { ic: 'refresh', kind: 'ghost', title: 'ใช้ข้อมูลงานล่าสุดเขียนข้อความใหม่' }) : null,
      btn('เปิดในหน้าเขียนโพสต์', async () => { await save(); close(); app.go('compose', { p: p.id }); }, { ic: 'pen', kind: 'ghost' }),
      h('span.spacer'),
      btn('ลบ', async () => { if (!(await confirmBox('ลบโพสต์นี้?', { ok: 'ลบ', danger: true }))) return; await repo.remove('posts', p.id); close(); }, { ic: 'trash', kind: 'danger sm' })));
}
