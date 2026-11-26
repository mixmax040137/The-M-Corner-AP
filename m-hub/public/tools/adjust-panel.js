// แผงปรับแต่งภาพ (ใช้ทั้งในขั้น “ปรับแต่งภาพ” ของงานเป็นชุด และในหน้าต่างแก้ไขทีละรูป)
import { h, btn, seg, toast } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { ZERO, HUES, FILTERS, withDefaults } from '../core/adjust.js';

const GROUPS = [
  { title: 'สมดุลแสงขาว', ic: 'bulb', items: [
    ['temperature', 'อุณหภูมิสี', 'linear-gradient(90deg,#7aa2f7,#e9edf5 50%,#f0b866)'],
    ['tint', 'โทนสี', 'linear-gradient(90deg,#8bd17c,#eef0ea 50%,#c792ea)'],
  ] },
  { title: 'แสง', ic: 'sparkles', items: [['brightness', 'ความสว่าง'], ['contrast', 'คอนทราสต์'], ['highlights', 'ส่วนสว่าง (ไฮไลต์)'], ['shadows', 'ส่วนเงา'], ['whites', 'ส่วนขาว'], ['blacks', 'ส่วนดำ']] },
  { title: 'สี', ic: 'image', items: [['vibrance', 'ความสดของสี'], ['saturation', 'ความอิ่มสี']] },
  { title: 'พื้นผิว', ic: 'grid', items: [['sharpness', 'ความคม', null, 0], ['clarity', 'ความชัดเฉพาะจุด'], ['vignette', 'ขอบภาพมืด / สว่าง']] },
];

/**
 * scopes: [['all','ทั้งภาพ'], ['person','เฉพาะบุคคล'], ...] หรือ null
 * getImageData: () => ImageData สำหรับปรับอัตโนมัติ / หาเฉดสีหลัก
 */
export function adjustPanel({ initial, onChange, scopes = null, getImageData, onScope }) {
  let p = withDefaults(initial);
  let scope = (initial && initial.scope) || (scopes ? scopes[0][0] : 'all');
  const controls = {};
  const emit = () => onChange && onChange(get());
  const get = () => ({ ...p, hsl: { ...p.hsl }, scope });

  function slider(key, label, track, min = -100) {
    const range = h('input.adj', { type: 'range', min, max: 100, step: 1, value: p[key], 'aria-label': label, style: track ? { '--track': track } : null });
    const numIn = h('input.adj-num', { type: 'number', min, max: 100, value: p[key], 'aria-label': label + ' (ตัวเลข)' });
    const set = (v, fire = true) => { v = Math.max(min, Math.min(100, Math.round(+v || 0))); p[key] = v; range.value = v; numIn.value = v; if (fire) emit(); };
    range.addEventListener('input', () => set(range.value));
    range.addEventListener('dblclick', () => set(0));
    numIn.addEventListener('change', () => set(numIn.value));
    controls[key] = set;
    return h('div.adj-row', h('label', label), range, numIn);
  }

  // ---- แก้สีรายเฉด ----
  let hueSel = 'red';
  const hueSwatches = h('div.row.wrap', { style: { gap: '8px' } });
  const hueSliders = h('div');
  function drawHues(present) {
    const order = present && present.length ? [...present, ...HUES.filter((x) => !present.some((p2) => p2.id === x.id))] : HUES;
    hueSwatches.replaceChildren(...order.map((x) => h('button.hue-dot', {
      type: 'button', title: x.label + (x.share ? ` (${Math.round(x.share * 100)}% ของภาพ)` : ''), 'aria-label': x.label, 'aria-pressed': x.id === hueSel,
      style: { background: x.color, outline: x.share ? '2px solid var(--text)' : 'none', outlineOffset: '2px' },
      onclick: () => { hueSel = x.id; drawHues(present); drawHueSliders(); },
    })));
  }
  function drawHueSliders() {
    const cur = p.hsl[hueSel] || { h: 0, s: 0, l: 0 };
    const label = HUES.find((x) => x.id === hueSel).label;
    const mk = (k, name) => {
      const range = h('input.adj', { type: 'range', min: -100, max: 100, value: cur[k] || 0, 'aria-label': `${name} สี${label}` });
      const numIn = h('input.adj-num', { type: 'number', min: -100, max: 100, value: cur[k] || 0 });
      const set = (v) => { v = Math.max(-100, Math.min(100, Math.round(+v || 0))); p.hsl[hueSel] = { ...(p.hsl[hueSel] || {}), [k]: v }; range.value = v; numIn.value = v; emit(); };
      range.addEventListener('input', () => set(range.value));
      range.addEventListener('dblclick', () => set(0));
      numIn.addEventListener('change', () => set(numIn.value));
      return h('div.adj-row', h('label', name), range, numIn);
    };
    hueSliders.replaceChildren(h('div.small.muted', 'สีที่เลือก: ' + label), mk('h', 'เปลี่ยนเฉดสี'), mk('s', 'ความอิ่มของสีนี้'), mk('l', 'ความสว่างของสีนี้'));
  }

  const invertBox = h('input', { type: 'checkbox', role: 'switch', checked: p.invert, onchange: (e) => { p.invert = e.target.checked; emit(); } });
  const scopeSeg = scopes ? seg(scopes, scope, (v) => { scope = v; onScope && onScope(v); emit(); }) : null;

  function set(np) {
    p = withDefaults(np);
    if (np && np.scope && scopeSeg) { scope = np.scope; scopeSeg.setValue(scope); }
    for (const [k, fn] of Object.entries(controls)) fn(p[k] ?? 0, false);
    invertBox.checked = !!p.invert;
    drawHueSliders();
  }

  function auto() {
    const img = getImageData && getImageData();
    if (!img) return toast('ยังไม่มีภาพตัวอย่างให้วิเคราะห์', 'warn');
    import('../core/adjust.js').then(({ autoParams }) => {
      set({ ...ZERO, ...autoParams(img), scope });
      emit();
      toast('ปรับอัตโนมัติแล้ว — เลื่อนแก้ต่อได้', 'ok', 1800);
    });
  }

  const filters = h('div.chips', ...Object.entries(FILTERS).map(([name, f]) => h('button.chip', { type: 'button', onclick: () => { set({ ...ZERO, ...f, scope }); emit(); } }, name)));

  const el = h('div.adj-panel',
    scopeSeg ? h('div.adj-section', h('h4', 'ใช้กับ'), scopeSeg, h('div.hint', 'เฉพาะบุคคล / พื้นหลัง ใช้ AI ในเครื่องแยกคนออกจากพื้นหลัง (เหมาะกับภาพที่มีคน)')) : '',
    btn('ปรับอัตโนมัติ', auto, { kind: 'primary', ic: 'sparkles' }),
    h('div.adj-section', h('h4', icon('image'), 'ฟิลเตอร์'), filters),
    ...GROUPS.map((g) => h('div.adj-section',
      h('h4', icon(g.ic), g.title, g.title === 'สี' ? h('label.check', { style: { marginLeft: 'auto', fontWeight: 400 } }, h('span', 'สลับสี'), invertBox) : ''),
      ...g.items.map(([k, label, track, min]) => slider(k, label, track, min ?? -100)))),
    h('div.adj-section', h('h4', icon('grid'), 'แก้สีรายเฉด'), h('div.hint', 'สีที่มีกรอบ = สีที่พบมากในภาพ'), hueSwatches, hueSliders),
    btn('รีเซ็ตการปรับแต่ง', () => { set({ ...ZERO, scope }); emit(); }, { ic: 'rotate' }));

  drawHues(null); drawHueSliders();
  return {
    el, get, set,
    analyze() {
      const img = getImageData && getImageData();
      if (!img) return;
      import('../core/adjust.js').then(({ dominantHues }) => {
        const present = dominantHues(img);
        if (present.length && !present.some((x) => x.id === hueSel)) { hueSel = present[0].id; drawHueSliders(); }
        drawHues(present);
      });
    },
  };
}
