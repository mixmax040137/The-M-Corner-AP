// ปรับแต่งภาพ (แบบเดียวกับแผง Adjust): สมดุลแสงขาว · แสง · สี · แก้สีรายเฉด · พื้นผิว
// ทำงานบน ImageData ในเครื่อง ไม่ใช้ AI — ค่าทุกตัวอยู่ในช่วง -100 … 100 (ความคม 0 … 100)

export const ZERO = {
  temperature: 0, tint: 0,
  brightness: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0,
  vibrance: 0, saturation: 0, invert: false,
  sharpness: 0, clarity: 0, vignette: 0,
  hsl: {}, // { red: {h, s, l}, ... }
};

// ช่วงสีสำหรับ “แก้สีรายเฉด” (องศาบนวงล้อสี)
export const HUES = [
  { id: 'red', label: 'แดง', deg: 0, color: '#e5484d' },
  { id: 'orange', label: 'ส้ม', deg: 30, color: '#f76b15' },
  { id: 'yellow', label: 'เหลือง', deg: 58, color: '#f5d90a' },
  { id: 'green', label: 'เขียว', deg: 120, color: '#30a46c' },
  { id: 'aqua', label: 'ฟ้าอมเขียว', deg: 180, color: '#12a594' },
  { id: 'blue', label: 'น้ำเงิน', deg: 220, color: '#0090ff' },
  { id: 'purple', label: 'ม่วง', deg: 275, color: '#8e4ec6' },
  { id: 'magenta', label: 'ชมพูบานเย็น', deg: 320, color: '#d6409f' },
];

export const FILTERS = {
  'ต้นฉบับ': {},
  'สดใส': { vibrance: 35, contrast: 12, clarity: 10 },
  'อบอุ่น': { temperature: 28, vibrance: 10, highlights: -10 },
  'เย็นสบาย': { temperature: -25, tint: -5, contrast: 8 },
  'ขาวดำ': { saturation: -100, contrast: 18, clarity: 15 },
  'ขาวดำนุ่ม': { saturation: -100, contrast: -10, highlights: -20, shadows: 20 },
  'วินเทจ': { saturation: -35, temperature: 25, blacks: 25, contrast: -12, vignette: 30 },
  'ภาพข่าวคมชัด': { clarity: 30, sharpness: 35, contrast: 10, vibrance: 10 },
  'นุ่มละมุน': { clarity: -25, highlights: -20, brightness: 8, contrast: -10 },
  'ดราม่า': { contrast: 30, clarity: 40, vignette: 35, saturation: -15, shadows: -10 },
  'ฟิล์มสว่าง': { brightness: 15, shadows: 25, blacks: 20, saturation: -10, temperature: 8 },
};

export function isIdentity(p) {
  if (!p) return true;
  for (const k of Object.keys(ZERO)) {
    if (k === 'hsl') { if (Object.values(p.hsl || {}).some((v) => v && (v.h || v.s || v.l))) return false; }
    else if (p[k]) return false;
  }
  return true;
}

export const withDefaults = (p) => ({ ...ZERO, ...(p || {}), hsl: { ...(p && p.hsl) } });

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// เบลอแบบกล่อง (แยกแนวนอน/ตั้ง) บนช่องเดียว — ใช้ทำความคมและความชัดเฉพาะจุด
export function boxBlur(src, w, h, r) {
  if (r < 1) return Float32Array.from(src);
  const tmp = new Float32Array(src.length), out = new Float32Array(src.length);
  const pass = (a, b, len, stride, lines, lineStride) => {
    const d = 2 * r + 1;
    for (let l = 0; l < lines; l++) {
      const base = l * lineStride;
      let acc = 0;
      for (let i = -r; i <= r; i++) acc += a[base + Math.min(len - 1, Math.max(0, i)) * stride];
      for (let i = 0; i < len; i++) {
        b[base + i * stride] = acc / d;
        acc += a[base + Math.min(len - 1, i + r + 1) * stride] - a[base + Math.max(0, i - r) * stride];
      }
    }
  };
  pass(src, tmp, w, 1, h, w);
  pass(tmp, out, h, w, w, 1);
  return out;
}

const blur3 = (src, w, h, r) => boxBlur(boxBlur(boxBlur(src, w, h, r), w, h, r), w, h, r); // ใกล้เคียงเกาส์เซียน

/**
 * ปรับภาพตามค่า p — คืน ImageData ใหม่
 * mask (Float32Array 0..1 ขนาดเท่าภาพ) ใช้จำกัดพื้นที่: ผลลัพธ์ = เดิม × (1−mask) + ปรับแล้ว × mask
 */
export function applyAdjust(img, params, { mask = null } = {}) {
  const p = withDefaults(params);
  const { width: w, height: h, data } = img;
  const n = w * h;
  const out = new ImageData(new Uint8ClampedArray(data), w, h);
  if (isIdentity(p)) return out;
  const o = out.data;
  const t = p.temperature / 100, tn = p.tint / 100;
  const rg = 1 + 0.22 * t + 0.06 * tn, gg = 1 - 0.16 * tn, bg = 1 - 0.22 * t + 0.06 * tn;
  const gamma = Math.pow(2, -p.brightness / 100 * 0.9);
  const c = p.contrast / 100, ck = c >= 0 ? 1 + c * 1.1 : 1 + c * 0.85;
  const hi = p.highlights / 100, sh = p.shadows / 100, wh = p.whites / 100, bl = p.blacks / 100;
  const vib = p.vibrance / 100, sat = p.saturation / 100;
  const hslRanges = HUES.map((hu) => ({ ...hu, ...(p.hsl[hu.id] || {}) })).filter((x) => x.h || x.s || x.l);
  const L = new Float32Array(n);

  for (let i = 0, j = 0; i < n; i++, j += 4) {
    let r = o[j] / 255, g = o[j + 1] / 255, b = o[j + 2] / 255;
    // สมดุลแสงขาว
    r *= rg; g *= gg; b *= bg;
    // ความสว่าง (gamma) และคอนทราสต์
    if (gamma !== 1) { r = Math.pow(clamp01(r), gamma); g = Math.pow(clamp01(g), gamma); b = Math.pow(clamp01(b), gamma); }
    if (ck !== 1) { r = (r - 0.5) * ck + 0.5; g = (g - 0.5) * ck + 0.5; b = (b - 0.5) * ck + 0.5; }
    // ไฮไลต์ / เงา / ขาว / ดำ (ตามความสว่างของจุด)
    if (hi || sh || wh || bl) {
      const lum = clamp01(0.2126 * r + 0.7152 * g + 0.0722 * b);
      let d = 0;
      if (sh) d += sh * 0.32 * Math.pow(1 - smooth(0, 0.55, lum), 2);
      if (hi) d += hi * 0.32 * Math.pow(smooth(0.45, 1, lum), 2);
      if (wh) d += wh * 0.16 * smooth(0.55, 1, lum);
      if (bl) d += bl * 0.16 * (1 - smooth(0, 0.45, lum));
      r += d; g += d; b += d;
    }
    // ความสดของสี (vibrance เน้นสีที่ยังซีด) และความอิ่มสี
    if (vib || sat) {
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const s0 = mx - mn;
      let k = 1 + sat;
      if (vib) k *= 1 + vib * (vib > 0 ? 1 - Math.min(1, s0 * 1.4) : 1);
      r = lum + (r - lum) * k; g = lum + (g - lum) * k; b = lum + (b - lum) * k;
    }
    // แก้สีรายเฉด (HSL)
    if (hslRanges.length) {
      r = clamp01(r); g = clamp01(g); b = clamp01(b);
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), dd = mx - mn;
      if (dd > 0.02) {
        let hue = mx === r ? ((g - b) / dd) % 6 : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4;
        hue = (hue * 60 + 360) % 360;
        let ll = (mx + mn) / 2, ss = dd / (1 - Math.abs(2 * ll - 1) || 1);
        let dh = 0, ds = 0, dl = 0;
        for (const x of hslRanges) {
          const dist = Math.min(Math.abs(hue - x.deg), 360 - Math.abs(hue - x.deg));
          const wgt = Math.max(0, 1 - dist / 40) * Math.min(1, ss * 3);
          if (!wgt) continue;
          dh += wgt * (x.h || 0) * 0.3; ds += wgt * (x.s || 0) / 100; dl += wgt * (x.l || 0) / 100;
        }
        if (dh || ds || dl) {
          hue = (hue + dh + 360) % 360;
          ss = clamp01(ss * (1 + ds));
          ll = clamp01(ll + dl * 0.25 * (1 - Math.abs(2 * ll - 1) * 0.5));
          const C = (1 - Math.abs(2 * ll - 1)) * ss, X = C * (1 - Math.abs(((hue / 60) % 2) - 1)), m = ll - C / 2;
          const seg = Math.floor(hue / 60);
          [r, g, b] = [[C, X, 0], [X, C, 0], [0, C, X], [0, X, C], [X, 0, C], [C, 0, X]][seg % 6];
          r += m; g += m; b += m;
        }
      }
    }
    if (p.invert) { r = 1 - r; g = 1 - g; b = 1 - b; }
    r = clamp01(r); g = clamp01(g); b = clamp01(b);
    o[j] = r * 255; o[j + 1] = g * 255; o[j + 2] = b * 255;
    L[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // พื้นผิว: ความชัดเฉพาะจุด (clarity) และความคม (sharpness)
  if (p.clarity || p.sharpness) {
    let detail = new Float32Array(n);
    if (p.clarity) {
      const rad = Math.max(2, Math.round(Math.min(w, h) * 0.012));
      const big = blur3(L, w, h, rad);
      const k = p.clarity / 100 * 0.9;
      for (let i = 0; i < n; i++) detail[i] += k * (L[i] - big[i]) * 4 * L[i] * (1 - L[i]);
    }
    if (p.sharpness) {
      const small = boxBlur(L, w, h, 1);
      const k = p.sharpness / 100 * 1.6;
      for (let i = 0; i < n; i++) detail[i] += k * (L[i] - small[i]);
    }
    for (let i = 0, j = 0; i < n; i++, j += 4) { const d = detail[i] * 255; o[j] += d; o[j + 1] += d; o[j + 2] += d; }
    detail = null;
  }
  // ขอบมืด/สว่าง (vignette)
  if (p.vignette) {
    const k = p.vignette / 100, cx = w / 2, cy = h / 2, md = Math.hypot(cx, cy);
    for (let y = 0, j = 0; y < h; y++) for (let x = 0; x < w; x++, j += 4) {
      const f = smooth(0.45, 1.05, Math.hypot(x - cx, y - cy) / md) * Math.abs(k) * 0.75;
      if (k > 0) { o[j] *= 1 - f; o[j + 1] *= 1 - f; o[j + 2] *= 1 - f; }
      else { o[j] += (255 - o[j]) * f; o[j + 1] += (255 - o[j + 1]) * f; o[j + 2] += (255 - o[j + 2]) * f; }
    }
  }
  if (mask) {
    for (let i = 0, j = 0; i < n; i++, j += 4) {
      const m = mask[i];
      if (m >= 1) continue;
      o[j] = data[j] + (o[j] - data[j]) * m; o[j + 1] = data[j + 1] + (o[j + 1] - data[j + 1]) * m; o[j + 2] = data[j + 2] + (o[j + 2] - data[j + 2]) * m;
    }
  }
  return out;
}

export function adjustCanvas(canvas, params, opts) {
  if (isIdentity(params)) return canvas;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  ctx.putImageData(applyAdjust(img, params, opts), 0, 0);
  return canvas;
}

// ปรับอัตโนมัติ: ดูฮิสโตแกรมแล้วเสนอค่า (ผู้ใช้เห็นค่าบนแถบเลื่อนและแก้ต่อได้)
export function autoParams(img) {
  const { data } = img;
  const hist = new Uint32Array(256);
  let sr = 0, sg = 0, sb = 0, ssat = 0, cnt = 0;
  const step = Math.max(1, Math.floor(data.length / 4 / 200000)) * 4;
  for (let j = 0; j < data.length; j += step) {
    const r = data[j], g = data[j + 1], b = data[j + 2];
    const l = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    hist[l]++;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (l > 25 && l < 235) { sr += r; sg += g; sb += b; }
    ssat += (mx - mn) / 255;
    cnt++;
  }
  const pct = (q) => { let acc = 0; for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc >= cnt * q) return i / 255; } return 1; };
  const lo = pct(0.005), hi = pct(0.995), mid = pct(0.5);
  const mean = (sr + sg + sb) / 3 || 1;
  const p = {};
  const round = (v, lim = 60) => Math.round(Math.max(-lim, Math.min(lim, v)));
  p.temperature = round(((sb - sr) / mean) * 120, 40);
  p.tint = round(((sg - (sr + sb) / 2) / mean) * 140, 30);
  p.blacks = round(-lo * 220, 40);
  p.whites = round((1 - hi) * 220, 40);
  p.brightness = round((0.47 - mid) * 120, 35);
  p.shadows = mid < 0.4 ? round((0.4 - mid) * 120, 35) : 0;
  p.highlights = hi > 0.98 ? -15 : 0;
  p.contrast = round((0.75 - (hi - lo)) * 60, 25);
  p.vibrance = round((0.28 - ssat / cnt) * 120, 35);
  p.clarity = 8;
  for (const k of Object.keys(p)) if (Math.abs(p[k]) < 3) p[k] = 0;
  return p;
}

// หาเฉดสีหลักในภาพ (สำหรับ “แก้สีรายเฉด”) — คืน id เรียงตามปริมาณ
export function dominantHues(img) {
  const counts = Object.fromEntries(HUES.map((x) => [x.id, 0]));
  const { data } = img;
  const step = Math.max(1, Math.floor(data.length / 4 / 60000)) * 4;
  for (let j = 0; j < data.length; j += step) {
    const r = data[j] / 255, g = data[j + 1] / 255, b = data[j + 2] / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (d < 0.12 || mx < 0.15) continue;
    let hue = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    hue = (hue * 60 + 360) % 360;
    let best = HUES[0], bd = 999;
    for (const x of HUES) { const dist = Math.min(Math.abs(hue - x.deg), 360 - Math.abs(hue - x.deg)); if (dist < bd) { bd = dist; best = x; } }
    counts[best.id]++;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return HUES.map((x) => ({ ...x, share: counts[x.id] / total })).filter((x) => x.share > 0.03).sort((a, b) => b.share - a.share);
}
