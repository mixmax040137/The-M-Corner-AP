// กราฟ SVG แบบเบา (ไม่ใช้ไลบรารี): แท่งแนวนอนจัดอันดับ + คอลัมน์ซ้อนตามเดือน พร้อม tooltip และมุมมองตาราง
// สีหมวดหมู่ 8 ช่องเรียงตายตัว (ผ่านการตรวจความต่างของสีสำหรับผู้ที่มองสีบางสีไม่ชัด บนพื้นของ M Hub ทั้งโหมดสว่าง/มืด)
import { h } from '../core/ui.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs = {}, ...kids) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v);
  for (const c of kids.flat()) if (c != null) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
};
export const fmtNum = (v) => Math.round(v).toLocaleString('th-TH');

// ---------- tooltip เดียวใช้ทั้งหน้า ----------
let tip;
function tooltip() {
  if (!tip) {
    tip = h('div.pr-tip', { role: 'tooltip', hidden: true });
    document.body.append(tip);
    const move = (e) => { tip.style.left = Math.min(window.innerWidth - tip.offsetWidth - 8, e.clientX + 14) + 'px'; tip.style.top = (e.clientY + 14) + 'px'; };
    const showFor = (e) => {
      const t = e.target.closest && e.target.closest('[data-tip]');
      if (!t) { tip.hidden = true; return; }
      tip.textContent = t.getAttribute('data-tip');
      tip.hidden = false;
      move(e);
    };
    document.addEventListener('pointerover', showFor);
    document.addEventListener('pointermove', showFor); // แสดงกลับหลังเลื่อนหน้า โดยไม่ต้องออกจากแท่งก่อน
    document.addEventListener('scroll', () => { tip.hidden = true; }, true);
  }
}

function tableView(head, rows) {
  return h('details.pr-help.pr-tableview',
    h('summary', 'ดูเป็นตาราง'),
    h('div.table-wrap', h('table.table', h('thead', h('tr', head.map((x) => h('th', x)))), h('tbody', rows.map((r) => h('tr', r.map((x) => h('td', x))))))));
}

/**
 * แท่งแนวนอนจัดอันดับ (ชุดเดียว): แท่งที่ดีที่สุดใช้สีหลักและติดค่า แท่งอื่นสีเทา ค่าอยู่ใน tooltip/ตาราง
 * rows: [{label, value, n, tip}]
 */
export function barList({ title, rows, format = fmtNum, unit = '', empty = 'ยังไม่มีข้อมูล' }) {
  tooltip();
  if (!rows.length) return h('section.card.pr-viz', h('h3.card-title', title), h('div.muted.small', empty));
  const max = Math.max(...rows.map((r) => r.value || 0), 1);
  const best = rows.findIndex((r) => r.n >= 2) >= 0 ? rows.findIndex((r) => r.n >= 2) : 0;
  return h('section.card.pr-viz', { 'data-chart': title },
    h('h3.card-title', title),
    h('div.pr-bars', rows.map((r, i) => {
      const w = Math.max(1.5, ((r.value || 0) / max) * 100);
      const label = `${r.label}: ${format(r.value)}${unit} · ${r.n} โพสต์${r.n < 2 ? ' (ข้อมูลน้อย)' : ''}`;
      return h('div.pr-bar-row' + (r.n < 2 ? '.thin' : ''), { 'data-tip': r.tip || label, tabindex: 0, 'aria-label': label },
        h('span.pr-bar-label', r.label, h('span.muted', ` (${r.n}${r.n < 2 ? ' · ข้อมูลน้อย' : ''})`)),
        h('span.pr-bar-track', h('span.pr-bar' + (i === best ? '.best' : ''), { style: { width: w + '%' } })),
        h('span.pr-bar-val', i === best ? format(r.value) + unit : ''));
    })),
    tableView([title, 'ค่าเฉลี่ย', 'จำนวนโพสต์'], rows.map((r) => [r.label, format(r.value) + unit, r.n])));
}

/**
 * คอลัมน์ซ้อนตามเดือน: series = [{label, values}] (≤ 8 ชุด), labels = ป้ายเดือน
 */
export function stackedColumns({ title, labels, series }) {
  tooltip();
  const W = 640, H = 240, padL = 34, padB = 26, padT = 18, padR = 6;
  const totals = labels.map((_, i) => series.reduce((a, sr) => a + sr.values[i], 0));
  const max = Math.max(1, ...totals);
  const step = max <= 5 ? 1 : max <= 10 ? 2 : max <= 25 ? 5 : Math.ceil(max / 5 / 5) * 5;
  const top = Math.ceil(max / step) * step;
  const y = (v) => padT + (H - padT - padB) * (1 - v / top);
  const colW = (W - padL - padR) / labels.length;
  const barW = Math.min(36, colW * 0.56);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'pr-cols-svg', role: 'img', 'aria-label': title });
  for (let v = 0; v <= top; v += step) {
    svg.append(s('line', { x1: padL, x2: W - padR, y1: y(v), y2: y(v), class: 'pr-grid' }));
    svg.append(s('text', { x: padL - 6, y: y(v) + 4, class: 'pr-axis', 'text-anchor': 'end' }, v));
  }
  labels.forEach((lab, i) => {
    const cx = padL + colW * i + colW / 2;
    let base = 0;
    const segs = series.map((sr, si) => ({ sr, si, v: sr.values[i] })).filter((x) => x.v > 0);
    segs.forEach(({ sr, si, v }, k) => {
      const y0 = y(base), y1 = y(base + v);
      const hgt = Math.max(0, y0 - y1 - (k > 0 ? 2 : 0)); // ช่องว่าง 2px ระหว่างส่วน
      const yTop = y1;
      const isTop = k === segs.length - 1;
      const r = isTop ? Math.min(4, hgt / 2, barW / 2) : 0;
      const x = cx - barW / 2;
      const d = r
        ? `M${x},${yTop + hgt} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + barW - r} Q${x + barW},${yTop} ${x + barW},${yTop + r} V${yTop + hgt} Z`
        : `M${x},${yTop} H${x + barW} V${yTop + hgt} H${x} Z`;
      svg.append(s('path', { d, class: `pr-s${(si % 8) + 1}`, 'data-tip': `${lab} · ${sr.label}: ${v} โพสต์` }));
      base += v;
    });
    if (totals[i]) svg.append(s('text', { x: cx, y: y(totals[i]) - 5, class: 'pr-cap', 'text-anchor': 'middle' }, totals[i]));
    svg.append(s('text', { x: cx, y: H - 8, class: 'pr-axis', 'text-anchor': 'middle' }, lab));
  });
  svg.append(s('line', { x1: padL, x2: W - padR, y1: y(0), y2: y(0), class: 'pr-baseline' }));
  return h('section.card.pr-viz', { 'data-chart': title },
    h('h3.card-title', title),
    series.length ? h('div.pr-legend2', series.map((sr, si) => h('span.pr-key', h('span.pr-swatch.pr-s' + ((si % 8) + 1)), sr.label))) : null,
    series.length ? h('div.pr-svgwrap', svg) : h('div.muted.small', 'ยังไม่มีโพสต์ที่โพสต์แล้วในช่วงนี้'),
    tableView(['เดือน', ...series.map((x) => x.label), 'รวม'], labels.map((lab, i) => [lab, ...series.map((x) => x.values[i]), totals[i]])));
}

// ตัวเลขเด่น
export const statTile = (label, value, sub) => h('div.pr-stat', h('div.pr-stat-label', label), h('div.pr-stat-value', value), sub ? h('div.pr-stat-sub', sub) : null);

// ---------- สำหรับหน้าพิมพ์ (HTML ล้วน ไม่มี tooltip) ----------
export function svgString(node) { return new XMLSerializer().serializeToString(node); }
