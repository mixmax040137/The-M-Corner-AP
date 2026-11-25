// เครื่องมือ UI ที่ใช้ร่วมกันทุกเครื่องมือ
import { icon } from './icons.js';

export const $ = (sel, el = document) => el.querySelector(sel);
export const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

// สร้าง element แบบสั้น: h('button.btn.primary', {onclick}, 'ข้อความ')
export function h(spec, attrs, ...children) {
  if (attrs == null || typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs)) {
    if (attrs != null) children.unshift(attrs);
    attrs = {};
  }
  const [tag, ...classes] = spec.split('.');
  const el = document.createElement(tag || 'div');
  if (classes.length) el.className = classes.join(' ');
  let value;
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'value') { value = v; continue; } // textarea/select ต้องตั้งผ่าน property
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className += (el.className ? ' ' : '') + v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, children);
  if (value !== undefined) el.value = value;
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function btn(label, onclick, { kind = '', ic, title, disabled } = {}) {
  return h('button.btn' + (kind ? '.' + kind : ''), { type: 'button', onclick, title, disabled }, ic ? icon(ic) : null, label ? h('span', label) : null);
}

export function field(label, control, hint) {
  // ใช้ <label> เฉพาะเมื่อข้างในเป็นช่องกรอกตัวเดียว (กันคลิกป้ายแล้วไปกดปุ่มแรกโดยไม่ตั้งใจ)
  const isInput = control instanceof HTMLElement && /^(INPUT|SELECT|TEXTAREA)$/.test(control.tagName);
  return h((isInput ? 'label' : 'div') + '.field', h('span.field-label', label), control, hint ? h('span.hint', hint) : null);
}

export function select(options, value, onchange) {
  const s = h('select', { onchange: (e) => onchange && onchange(e.target.value) });
  for (const o of options) {
    const [v, t] = Array.isArray(o) ? o : [o, o];
    s.append(h('option', { value: v, selected: String(v) === String(value) }, t));
  }
  return s;
}

export function card(title, ...body) {
  return h('section.card', title ? h('h3.card-title', title) : null, ...body);
}

export function step(n, title, ...body) {
  return h('section.card.step', h('h3.card-title', h('span.step-n', n), title), ...body);
}

let toastBox;
export function toast(msg, type = 'info', ms = 3500) {
  if (!toastBox) document.body.append((toastBox = h('div.toasts', { role: 'status', 'aria-live': 'polite' })));
  const t = h('div.toast.' + type, msg);
  toastBox.append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, ms);
}

export function confirmBox(message, { ok = 'ตกลง', cancel = 'ยกเลิก', danger } = {}) {
  return new Promise((resolve) => {
    const close = (v) => { dlg.close(); dlg.remove(); resolve(v); };
    const dlg = h('dialog.dialog',
      h('p', message),
      h('div.row.end', btn(cancel, () => close(false)), btn(ok, () => close(true), { kind: danger ? 'danger' : 'primary' })));
    dlg.addEventListener('cancel', () => close(false));
    document.body.append(dlg);
    dlg.showModal();
  });
}

export function progressBar() {
  const bar = h('div.progress-bar');
  const label = h('span.progress-label');
  const el = h('div.progress', { hidden: true }, h('div.progress-track', bar), label);
  return {
    el,
    set(done, total, text) {
      el.hidden = false;
      bar.style.width = (total ? (done / total) * 100 : 0) + '%';
      label.textContent = text ?? `${done} / ${total}`;
    },
    hide() { el.hidden = true; },
  };
}

export function download(blob, name) {
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('คัดลอกแล้ว', 'ok', 1500); }
  catch { toast('คัดลอกไม่ได้ ลองเลือกข้อความแล้วกด Ctrl+C', 'warn'); }
}

export function formatBytes(n) {
  if (!n) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(u.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return (n / 1024 ** i).toFixed(i ? 1 : 0) + ' ' + u[i];
}

// ชื่อไฟล์ที่ปลอดภัยบน Windows/Mac (ภาษาไทยใช้ได้)
export function safeName(name, fallback = 'file') {
  const s = String(name ?? '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/^\.+|\.+$/g, '');
  return s.slice(0, 150) || fallback;
}

export function safePath(path) {
  return String(path ?? '').split(/[\\/]+/).map((p) => safeName(p, '')).filter(Boolean).join('/');
}

export function splitExt(name) {
  const i = name.lastIndexOf('.');
  return i > 0 ? [name.slice(0, i), name.slice(i + 1)] : [name, ''];
}

const collator = new Intl.Collator('th', { numeric: true, sensitivity: 'base' });
export const naturalCompare = (a, b) => collator.compare(a, b);

export function pad(n, width) { return String(n).padStart(width, '0'); }

export const nextFrame = () => new Promise((r) => setTimeout(r, 0));

const scripts = new Map();
export function loadScript(src) {
  if (!scripts.has(src)) {
    scripts.set(src, new Promise((resolve, reject) => {
      const s = h('script', { src, async: true });
      s.onload = resolve;
      s.onerror = () => { scripts.delete(src); reject(new Error('โหลดไม่สำเร็จ: ' + src)); };
      document.head.append(s);
    }));
  }
  return scripts.get(src);
}

// รับไฟล์จากการลากวาง
export function dropZone(el, onFiles) {
  el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drag'); });
  el.addEventListener('dragleave', () => el.classList.remove('drag'));
  el.addEventListener('drop', async (e) => {
    e.preventDefault();
    el.classList.remove('drag');
    const files = await filesFromDataTransfer(e.dataTransfer);
    if (files.length) onFiles(files);
  });
}

async function filesFromDataTransfer(dt) {
  const entries = [...(dt.items || [])].map((i) => i.webkitGetAsEntry && i.webkitGetAsEntry()).filter(Boolean);
  if (!entries.length) return [...dt.files].map((file) => ({ file, path: file.name }));
  const out = [];
  const walk = async (entry, prefix) => {
    if (entry.isFile) {
      const file = await new Promise((res, rej) => entry.file(res, rej));
      out.push({ file, path: prefix + file.name });
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      let batch;
      do {
        batch = await new Promise((res, rej) => reader.readEntries(res, rej));
        for (const e of batch) await walk(e, prefix + entry.name + '/');
      } while (batch.length);
    }
  };
  for (const e of entries) await walk(e, '');
  return out;
}

// เลือกไฟล์ด้วยปุ่มธรรมดา (ใช้ได้ทุกเบราว์เซอร์)
export function pickFiles({ accept = '', multiple = true, directory = false } = {}) {
  return new Promise((resolve) => {
    const inp = h('input', { type: 'file', accept, multiple, hidden: true });
    if (directory) inp.webkitdirectory = true;
    inp.addEventListener('change', () => {
      resolve([...inp.files].map((file) => ({ file, path: file.webkitRelativePath || file.name })));
      inp.remove();
    });
    inp.addEventListener('cancel', () => { resolve([]); inp.remove(); });
    document.body.append(inp);
    inp.click();
  });
}

// แทนค่า {{ชื่อคอลัมน์}} ด้วยข้อมูลของแถวนั้น
export function fillTemplate(tpl, row, extra = {}) {
  return String(tpl ?? '').replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_, key) => {
    if (key in extra) return extra[key];
    const v = row ? row[key] : undefined;
    return v == null ? '' : String(v);
  });
}

export function templateKeys(tpl) {
  return [...String(tpl ?? '').matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)].map((m) => m[1]);
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function tabs(items, onChange) {
  // items: [{id, label, render: () => Node}]
  const bar = h('div.tabs', { role: 'tablist' });
  const body = h('div.tab-body');
  const views = new Map();
  const show = (id) => {
    for (const b of bar.children) b.setAttribute('aria-selected', b.dataset.id === id);
    for (const [k, v] of views) v.hidden = k !== id;
    if (!views.has(id)) {
      const it = items.find((i) => i.id === id);
      const v = h('div', it.render());
      views.set(id, v);
      body.append(v);
    }
    onChange && onChange(id);
  };
  for (const it of items) bar.append(h('button.tab', { type: 'button', role: 'tab', 'data-id': it.id, onclick: () => show(it.id) }, it.icon ? icon(it.icon) : null, it.label));
  show(items[0].id);
  return { el: h('div', bar, body), show };
}

// ปุ่มเลือกแบบแบ่งช่อง
export function seg(options, value, onchange) {
  const el = h('div.seg', { role: 'group' });
  const draw = (v) => { for (const b of el.children) b.setAttribute('aria-pressed', b.dataset.v === String(v)); };
  for (const o of options) {
    const [v, t] = Array.isArray(o) ? o : [o, o];
    el.append(h('button', { type: 'button', 'data-v': v, onclick: () => { draw(v); onchange && onchange(v); } }, t));
  }
  draw(value);
  el.setValue = draw;
  return el;
}

export function checkbox(label, checked, onchange) {
  const inp = h('input', { type: 'checkbox', checked: !!checked, onchange: (e) => onchange && onchange(e.target.checked) });
  const el = h('label.check', inp, h('span', label));
  el.input = inp;
  return el;
}

export function num(value, onchange, { min, max, step = 1, width } = {}) {
  return h('input', { type: 'number', value, min, max, step, style: width ? { width } : null, oninput: (e) => onchange && onchange(e.target.value === '' ? '' : +e.target.value) });
}

export function text(value, onchange, attrs = {}) {
  return h('input', { type: 'text', value: value ?? '', oninput: (e) => onchange && onchange(e.target.value), ...attrs });
}

export function debounce(fn, ms = 150) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// แถบพรีเซ็ต: เลือก / บันทึก / ลบ ค่าตั้งที่ใช้บ่อย
export function presetBar(store, { builtins = {}, getData, apply }) {
  const sel = h('select', { style: { maxWidth: '320px' } });
  const load = async () => {
    const mine = await store.list();
    sel.replaceChildren(h('option', { value: '' }, '— เลือกพรีเซ็ต —'));
    const bi = Object.keys(builtins);
    if (bi.length) sel.append(h('optgroup', { label: 'พรีเซ็ตสำเร็จรูป' }, bi.map((k) => h('option', { value: 'b:' + k }, k))));
    const mk = Object.keys(mine);
    if (mk.length) sel.append(h('optgroup', { label: 'ของฉัน' }, mk.map((k) => h('option', { value: 'm:' + k }, k))));
    return mine;
  };
  let mine = {};
  load().then((m) => (mine = m));
  sel.addEventListener('change', () => {
    const v = sel.value;
    if (!v) return;
    const data = v.startsWith('b:') ? builtins[v.slice(2)] : mine[v.slice(2)];
    if (data) { apply(structuredClone(data)); toast('ใช้พรีเซ็ต “' + v.slice(2) + '” แล้ว', 'ok', 1800); }
  });
  const save = btn('บันทึกเป็นพรีเซ็ต', async () => {
    const name = prompt('ตั้งชื่อพรีเซ็ต', sel.value.startsWith('m:') ? sel.value.slice(2) : '');
    if (!name) return;
    await store.save(name.trim(), getData());
    mine = await load();
    sel.value = 'm:' + name.trim();
    toast('บันทึกพรีเซ็ตแล้ว', 'ok');
  }, { ic: 'save' });
  const remove = btn('', async () => {
    if (!sel.value.startsWith('m:')) return toast('เลือกพรีเซ็ตของฉันที่ต้องการลบก่อน', 'warn');
    await store.remove(sel.value.slice(2));
    mine = await load();
    toast('ลบพรีเซ็ตแล้ว');
  }, { ic: 'trash', title: 'ลบพรีเซ็ตนี้', kind: 'icon-only' });
  return h('div.row.wrap.preset-bar', h('span.muted.small', 'พรีเซ็ต'), sel, save, remove);
}
