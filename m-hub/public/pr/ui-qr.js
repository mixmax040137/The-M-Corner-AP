// หน้า QR Code (0 token): วางลิงก์หรือเลือกจากลิงก์ของงาน → PNG / SVG, ใส่โลโก้คณะตรงกลาง, เลือกขนาด
import { h, setKids, btn, field, select, toast, pickFiles, download, safeName } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { loadQr, qrMatrix, drawQr, qrSvg } from '../core/qr.js';
import { repo } from './db.js';

let st;

export async function mount(el, app) {
  await loadQr();
  st = { app, text: '', size: 1024, fg: '#000000', bg: '#ffffff', logo: null, logoUrl: await repo.getMeta('qrLogo', null), useLogo: true, name: 'QR' };
  if (st.logoUrl) st.logo = await loadImg(st.logoUrl).catch(() => null);
  st.input = h('input', { type: 'text', 'aria-label': 'ลิงก์หรือข้อความ', placeholder: 'วางลิงก์ เช่น https://forms.gle/…', oninput: (e) => { st.text = e.target.value.trim(); st.name = 'QR'; draw(); } });
  st.pick = h('select', { 'aria-label': 'เลือกลิงก์จากงาน', onchange: (e) => { if (!e.target.value) return; const [name, url] = JSON.parse(e.target.value); st.text = url; st.name = name; st.input.value = url; draw(); } });
  st.canvas = h('canvas.pr-qr', { width: 320, height: 320 });
  st.status = h('div.small');
  st.logoBox = h('div.row.wrap');
  el.append(h('div.split',
    h('section.card',
      h('h3.card-title', icon('qr'), 'สร้าง QR Code'),
      field('ลิงก์จากงาน', st.pick),
      field('หรือวางลิงก์ / ข้อความ', st.input),
      h('div.grid3',
        field('ขนาด', select([[512, '512 px (โพสต์/สไลด์)'], [1024, '1024 px (โปสเตอร์ A4)'], [2048, '2048 px (ป้ายใหญ่)']], st.size, (v) => { st.size = +v; draw(); })),
        field('สี QR', h('input', { type: 'color', value: st.fg, oninput: (e) => { st.fg = e.target.value; draw(); } })),
        field('สีพื้น', h('input', { type: 'color', value: st.bg, oninput: (e) => { st.bg = e.target.value; draw(); } }))),
      field('โลโก้คณะตรงกลาง (ไม่บังคับ)', st.logoBox, 'บันทึกโลโก้ไว้ในเบราว์เซอร์นี้ ใช้ซ้ำได้ทุกครั้ง · มีโลโก้จะใช้การแก้ไขข้อผิดพลาดระดับสูง (H) ให้สแกนติดเสมอ'),
      h('div.row.wrap',
        btn('ดาวน์โหลด PNG', savePng, { ic: 'download', kind: 'primary' }),
        btn('ดาวน์โหลด SVG', saveSvg, { ic: 'download' }),
        btn('คัดลอกรูป', copyImg, { ic: 'copy', kind: 'ghost' }))),
    h('section.card', h('h3.card-title', 'ตัวอย่าง'), h('div.pr-qrwrap', st.canvas), st.status)));
  drawLogoBox();
}

export async function show(params = {}) {
  const events = await repo.list('events');
  const opts = [];
  for (const e of events) {
    for (const [k, label] of [['regLink', 'ลงทะเบียน'], ['meetingLink', 'ประชุมออนไลน์']]) {
      if (e.fields[k]) opts.push([`${label}: ${e.fields.title || 'งาน'}`, e.fields[k], `QR ${label} ${e.fields.title || ''}`.trim()]);
    }
  }
  setKids(st.pick, h('option', { value: '' }, opts.length ? '— เลือกลิงก์ —' : '— ยังไม่มีลิงก์ในงาน —'), ...opts.map(([t, u, n]) => h('option', { value: JSON.stringify([n, u]) }, t)));
  if (params.u) { st.text = params.u; st.input.value = params.u; const o = opts.find((x) => x[1] === params.u); st.name = o ? o[2] : 'QR'; }
  draw();
}

const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

function drawLogoBox() {
  setKids(st.logoBox, 
    btn(st.logo ? 'เปลี่ยนโลโก้' : 'เลือกไฟล์โลโก้', async () => {
      const [f] = await pickFiles({ accept: 'image/*', multiple: false });
      if (!f) return;
      const url = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f.file); });
      try { st.logo = await loadImg(url); st.logoUrl = url; st.useLogo = true; await repo.setMeta('qrLogo', url); drawLogoBox(); draw(); } catch { toast('เปิดรูปโลโก้ไม่ได้', 'error'); }
    }, { ic: 'image', kind: 'sm' }),
    st.logo ? h('label.check', h('input', { type: 'checkbox', checked: st.useLogo, onchange: (e) => { st.useLogo = e.target.checked; draw(); } }), h('span', 'ใส่โลโก้')) : null,
    st.logo ? btn('', async () => { st.logo = null; st.logoUrl = null; await repo.setMeta('qrLogo', null); drawLogoBox(); draw(); }, { ic: 'x', kind: 'icon-only sm', title: 'ลบโลโก้ที่บันทึกไว้' }) : null);
}

const withLogo = () => !!(st.logo && st.useLogo);
const matrix = () => qrMatrix(st.text, withLogo() ? 'H' : 'M');

function render(size) {
  const m = matrix();
  if (!m) return null;
  const c = h('canvas', { width: size, height: size });
  const ctx = c.getContext('2d');
  drawQr(ctx, m, 0, 0, size, { fg: st.fg, bg: st.bg });
  if (withLogo()) {
    const box = size * 0.22;
    const pad = box * 0.12;
    ctx.fillStyle = st.bg;
    ctx.fillRect((size - box) / 2 - pad, (size - box) / 2 - pad, box + pad * 2, box + pad * 2);
    const r = Math.min(box / st.logo.width, box / st.logo.height);
    ctx.drawImage(st.logo, (size - st.logo.width * r) / 2, (size - st.logo.height * r) / 2, st.logo.width * r, st.logo.height * r);
  }
  return c;
}

function draw() {
  const ctx = st.canvas.getContext('2d');
  ctx.clearRect(0, 0, 320, 320);
  if (!st.text) { st.status.textContent = 'วางลิงก์หรือเลือกลิงก์จากงาน'; st.status.className = 'muted small'; return; }
  const c = render(320);
  if (!c) { st.status.textContent = 'ข้อความยาวเกินกว่าจะทำเป็น QR ได้'; st.status.className = 'status-err small'; return; }
  ctx.drawImage(c, 0, 0);
  const isUrl = /^https?:\/\//i.test(st.text);
  st.status.textContent = isUrl ? `QR ของลิงก์: ${st.text}` : 'QR ของข้อความ (ไม่ใช่ลิงก์ — สแกนแล้วจะเห็นเป็นข้อความ)';
  st.status.className = isUrl ? 'muted small' : 'status-warn small';
}

const fname = (ext) => safeName(st.name || 'QR') + '.' + ext;
function savePng() {
  const c = render(st.size);
  if (!c) return toast('ยังไม่มีลิงก์', 'warn');
  c.toBlob((b) => download(b, fname('png')), 'image/png');
}
function saveSvg() {
  const m = matrix();
  if (!m) return toast('ยังไม่มีลิงก์', 'warn');
  let svg = qrSvg(m, { fg: st.fg, bg: st.bg, size: st.size });
  if (withLogo()) {
    const total = m.n + 8;
    const box = total * 0.22, pad = box * 0.12, x = (total - box) / 2;
    svg = svg.replace('</svg>', `<rect x="${x - pad}" y="${x - pad}" width="${box + pad * 2}" height="${box + pad * 2}" fill="${st.bg}"/><image href="${st.logoUrl}" x="${x}" y="${x}" width="${box}" height="${box}" preserveAspectRatio="xMidYMid meet"/></svg>`);
  }
  download(new Blob([svg], { type: 'image/svg+xml' }), fname('svg'));
}
async function copyImg() {
  const c = render(st.size);
  if (!c) return toast('ยังไม่มีลิงก์', 'warn');
  try {
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    toast('คัดลอกรูป QR แล้ว วางในโพสต์หรือสไลด์ได้เลย', 'ok');
  } catch { toast('เบราว์เซอร์นี้คัดลอกรูปไม่ได้ ใช้ปุ่มดาวน์โหลดแทน', 'warn'); }
}
