// เอฟเฟกต์ภาพในเครื่อง: เบลอ · เบลอพื้นหลัง · รีทัชผิว · เปลี่ยนพื้นหลัง · ลบวัตถุ (เติมพื้นที่อัตโนมัติ)
import { boxBlur } from './adjust.js';

export const makeCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
export const ctx2d = (c) => c.getContext('2d', { willReadFrequently: true });
export const cloneCanvas = (src) => { const c = makeCanvas(src.width, src.height); c.getContext('2d').drawImage(src, 0, 0); return c; };

// แยก/รวมช่องสีเป็น Float32 เพื่อคำนวณ
function channels(img) {
  const n = img.width * img.height, d = img.data;
  const r = new Float32Array(n), g = new Float32Array(n), b = new Float32Array(n), a = new Float32Array(n);
  for (let i = 0, j = 0; i < n; i++, j += 4) { r[i] = d[j]; g[i] = d[j + 1]; b[i] = d[j + 2]; a[i] = d[j + 3]; }
  return { r, g, b, a };
}

const gauss = (ch, w, h, rad) => { const r = Math.max(1, Math.round(rad / 1.7)); return boxBlur(boxBlur(boxBlur(ch, w, h, r), w, h, r), w, h, r); };

// เบลอทั้งภาพ (radius เป็นพิกเซล)
export function blurCanvas(src, radius) {
  const out = makeCanvas(src.width, src.height);
  const g = ctx2d(out);
  if ('filter' in g && radius > 0) {
    g.filter = `blur(${radius}px)`;
    // ขยายขอบก่อนเบลอ กันขอบภาพจางเป็นสีใส
    const pad = Math.ceil(radius * 2);
    const big = makeCanvas(src.width + pad * 2, src.height + pad * 2);
    const bg = big.getContext('2d');
    bg.drawImage(src, pad, pad);
    bg.drawImage(src, 0, 0, 1, src.height, 0, pad, pad, src.height);
    bg.drawImage(src, src.width - 1, 0, 1, src.height, pad + src.width, pad, pad, src.height);
    bg.drawImage(big, 0, pad, big.width, 1, 0, 0, big.width, pad);
    bg.drawImage(big, 0, pad + src.height - 1, big.width, 1, 0, pad + src.height, big.width, pad);
    g.drawImage(big, -pad, -pad);
    g.filter = 'none';
    return out;
  }
  const img = ctx2d(src).getImageData(0, 0, src.width, src.height);
  const { r, g: gg, b, a } = channels(img);
  const w = src.width, h = src.height;
  const R = gauss(r, w, h, radius), G = gauss(gg, w, h, radius), B = gauss(b, w, h, radius), A = gauss(a, w, h, radius);
  for (let i = 0, j = 0; i < R.length; i++, j += 4) { img.data[j] = R[i]; img.data[j + 1] = G[i]; img.data[j + 2] = B[i]; img.data[j + 3] = A[i]; }
  g.putImageData(img, 0, 0);
  return out;
}

// รวมสองภาพด้วยหน้ากาก: ผล = a × mask + b × (1 − mask)
export function mixByMask(aCanvas, bCanvas, mask, { invert = false } = {}) {
  const w = aCanvas.width, h = aCanvas.height;
  const A = ctx2d(aCanvas).getImageData(0, 0, w, h), B = ctx2d(bCanvas).getImageData(0, 0, w, h);
  const o = new ImageData(w, h);
  for (let i = 0, j = 0; i < mask.length; i++, j += 4) {
    const m = invert ? 1 - mask[i] : mask[i];
    for (let k = 0; k < 4; k++) o.data[j + k] = A.data[j + k] * m + B.data[j + k] * (1 - m);
  }
  const out = makeCanvas(w, h);
  out.getContext('2d').putImageData(o, 0, 0);
  return out;
}

export function featherMask(mask, w, h, radius) {
  if (radius < 1) return mask;
  return gauss(mask, w, h, radius);
}

// โฟกัสอัตโนมัติ: เบลอพื้นหลังโดยไม่ให้สีของคนซึมออกมา (normalized convolution)
export function blurBackground(src, matte, amount = 50) {
  const w = src.width, h = src.height;
  const radius = Math.max(2, Math.round((Math.min(w, h) * amount) / 100 * 0.04));
  const img = ctx2d(src).getImageData(0, 0, w, h);
  const { r, g, b } = channels(img);
  const bgW = new Float32Array(w * h);
  for (let i = 0; i < bgW.length; i++) { const k = 1 - matte[i]; bgW[i] = k; r[i] *= k; g[i] *= k; b[i] *= k; }
  const R = gauss(r, w, h, radius), G = gauss(g, w, h, radius), B = gauss(b, w, h, radius), Wt = gauss(bgW, w, h, radius);
  const m = featherMask(matte, w, h, Math.max(1, radius * 0.08));
  const o = img.data;
  for (let i = 0, j = 0; i < m.length; i++, j += 4) {
    const wt = Math.max(1e-3, Wt[i]);
    const k = m[i];
    o[j] = o[j] * k + (R[i] / wt) * (1 - k);
    o[j + 1] = o[j + 1] * k + (G[i] / wt) * (1 - k);
    o[j + 2] = o[j + 2] * k + (B[i] / wt) * (1 - k);
  }
  const out = makeCanvas(w, h);
  out.getContext('2d').putImageData(img, 0, 0);
  return out;
}

// เปลี่ยนพื้นหลัง: โปร่งใส / สี / ภาพ (ครอปให้เต็ม)
export function replaceBackground(src, matte, { mode = 'transparent', color = '#ffffff', image = null } = {}) {
  const w = src.width, h = src.height;
  const out = makeCanvas(w, h);
  const g = ctx2d(out);
  if (mode === 'color') { g.fillStyle = color; g.fillRect(0, 0, w, h); }
  if (mode === 'image' && image) {
    const s = Math.max(w / image.width, h / image.height);
    g.drawImage(image, (w - image.width * s) / 2, (h - image.height * s) / 2, image.width * s, image.height * s);
  }
  const fg = makeCanvas(w, h);
  const fctx = ctx2d(fg);
  fctx.drawImage(src, 0, 0);
  const id = fctx.getImageData(0, 0, w, h);
  for (let i = 0; i < matte.length; i++) id.data[i * 4 + 3] = Math.round(id.data[i * 4 + 3] * matte[i]);
  fctx.putImageData(id, 0, 0);
  g.drawImage(fg, 0, 0);
  return out;
}

// หน้ากากผิว (YCbCr) — ใช้ร่วมกับหน้ากากบุคคลเพื่อไม่ให้ไปโดนพื้นหลังสีคล้ายผิว
export function skinMask(img, personMatte = null) {
  const n = img.width * img.height, d = img.data;
  const m = new Float32Array(n);
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    const r = d[j], g = d[j + 1], b = d[j + 2];
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
    if (y < 40) continue;
    const dcb = Math.max(0, Math.abs(cb - 105) - 18) / 12, dcr = Math.max(0, Math.abs(cr - 150) - 17) / 12;
    let v = Math.max(0, 1 - Math.hypot(dcb, dcr));
    if (personMatte) v *= personMatte[i];
    m[i] = v;
  }
  return m;
}

// guided filter (แบบใช้ตัวเองนำทาง) — ทำให้เรียบโดยคงขอบคม เช่น ขอบตา คิ้ว ปาก
function guided(ch, w, h, r, eps) {
  const II = new Float32Array(ch.length);
  for (let i = 0; i < ch.length; i++) II[i] = ch[i] * ch[i];
  const mI = boxBlur(ch, w, h, r), mII = boxBlur(II, w, h, r);
  const A = new Float32Array(ch.length), B = new Float32Array(ch.length);
  for (let i = 0; i < ch.length; i++) { const v = mII[i] - mI[i] * mI[i]; A[i] = v / (v + eps); B[i] = mI[i] - A[i] * mI[i]; }
  const mA = boxBlur(A, w, h, r), mB = boxBlur(B, w, h, r);
  const out = new Float32Array(ch.length);
  for (let i = 0; i < ch.length; i++) out[i] = mA[i] * ch[i] + mB[i];
  return out;
}

// รีทัชผิวหน้า: ผิวเนียน + สว่างขึ้นเล็กน้อย เฉพาะบริเวณผิว
export function retouchSkin(src, { strength = 50, matte = null } = {}) {
  const w = src.width, h = src.height;
  const img = ctx2d(src).getImageData(0, 0, w, h);
  const mask = featherMask(skinMask(img, matte), w, h, Math.max(1, Math.min(w, h) * 0.004));
  const { r, g, b } = channels(img);
  const rad = Math.max(2, Math.round(Math.min(w, h) * 0.006));
  const eps = Math.pow(255 * (0.03 + strength / 100 * 0.05), 2);
  const R = guided(r, w, h, rad, eps), G = guided(g, w, h, rad, eps), B = guided(b, w, h, rad, eps);
  const k = strength / 100, lift = 1 + k * 0.04;
  const o = img.data;
  for (let i = 0, j = 0; i < mask.length; i++, j += 4) {
    const m = Math.min(1, mask[i] * 1.2) * k;
    if (m <= 0.001) continue;
    o[j] = o[j] * (1 - m) + Math.min(255, R[i] * lift) * m;
    o[j + 1] = o[j + 1] * (1 - m) + Math.min(255, G[i] * lift) * m;
    o[j + 2] = o[j + 2] * (1 - m) + Math.min(255, B[i] * lift) * m;
  }
  const out = makeCanvas(w, h);
  out.getContext('2d').putImageData(img, 0, 0);
  return out;
}

// ---------- ลบวัตถุ: เติมพื้นที่ด้วยลวดลายจากรอบ ๆ (PatchMatch หลายระดับ) ----------
// mask: Uint8Array/Float32Array ขนาดเท่าภาพ (>0.5 = ต้องลบ)
export function inpaint(src, mask, { onProgress } = {}) {
  const W = src.width, H = src.height;
  // ครอบเฉพาะบริเวณรอบรอยที่ระบาย เพื่อความเร็ว
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x] > 0.5) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < x0) return cloneCanvas(src);
  const mw = x1 - x0 + 1, mh = y1 - y0 + 1;
  const marg = Math.round(Math.max(mw, mh) * 0.9 + 24);
  const cx0 = Math.max(0, x0 - marg), cy0 = Math.max(0, y0 - marg), cx1 = Math.min(W, x1 + marg + 1), cy1 = Math.min(H, y1 + marg + 1);
  const cw = cx1 - cx0, chh = cy1 - cy0;
  const scale = Math.min(1, 420 / Math.max(cw, chh));
  const sw = Math.max(8, Math.round(cw * scale)), sh = Math.max(8, Math.round(chh * scale));
  const crop = makeCanvas(sw, sh);
  const cctx = ctx2d(crop);
  cctx.imageSmoothingQuality = 'high';
  cctx.drawImage(src, cx0, cy0, cw, chh, 0, 0, sw, sh);
  const img = cctx.getImageData(0, 0, sw, sh);
  const hole = new Uint8Array(sw * sh);
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
    const ox = Math.min(W - 1, Math.round(cx0 + (x + 0.5) / scale)), oy = Math.min(H - 1, Math.round(cy0 + (y + 0.5) / scale));
    // ขยายรอยเล็กน้อยให้ครอบขอบวัตถุ
    let v = 0;
    for (let dy = -1; dy <= 1 && !v; dy++) for (let dx = -1; dx <= 1 && !v; dx++) {
      const xx = Math.min(W - 1, Math.max(0, ox + Math.round(dx / scale))), yy = Math.min(H - 1, Math.max(0, oy + Math.round(dy / scale)));
      if (mask[yy * W + xx] > 0.5) v = 1;
    }
    hole[y * sw + x] = v;
  }
  const filled = patchMatchFill(img, hole, onProgress);
  // วางกลับเฉพาะส่วนที่ลบ (ขอบนุ่ม)
  const fc = makeCanvas(sw, sh);
  fc.getContext('2d').putImageData(filled, 0, 0);
  const up = makeCanvas(cw, chh);
  const uctx = ctx2d(up);
  uctx.imageSmoothingQuality = 'high';
  uctx.drawImage(fc, 0, 0, cw, chh);
  const out = cloneCanvas(src);
  const octx = ctx2d(out);
  const base = octx.getImageData(cx0, cy0, cw, chh), patch = uctx.getImageData(0, 0, cw, chh);
  const local = new Float32Array(cw * chh);
  for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) local[y * cw + x] = mask[(cy0 + y) * W + cx0 + x] > 0.5 ? 1 : 0;
  const soft = featherMask(local, cw, chh, 2);
  for (let i = 0; i < soft.length; i++) {
    const m = Math.min(1, local[i] ? 1 : soft[i] * 2);
    if (!m) continue;
    const j = i * 4;
    for (let k = 0; k < 3; k++) base.data[j + k] = base.data[j + k] * (1 - m) + patch.data[j + k] * m;
  }
  octx.putImageData(base, cx0, cy0);
  return out;
}

function patchMatchFill(img, hole, onProgress) {
  // สร้างพีระมิดจนรูเล็กพอ แล้วไล่ขึ้นทีละระดับ
  const levels = [];
  let cur = { w: img.width, h: img.height, px: Float32Array.from(img.data), hole };
  levels.push(cur);
  while (Math.min(cur.w, cur.h) > 48 && levels.length < 5) {
    const w = Math.max(1, cur.w >> 1), h = Math.max(1, cur.h >> 1);
    const px = new Float32Array(w * h * 4), ho = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let acc = [0, 0, 0, 0], cnt = 0, hh = 0;
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
        const sx = Math.min(cur.w - 1, x * 2 + dx), sy = Math.min(cur.h - 1, y * 2 + dy), si = sy * cur.w + sx;
        if (cur.hole[si]) { hh = 1; continue; }
        for (let k = 0; k < 4; k++) acc[k] += cur.px[si * 4 + k];
        cnt++;
      }
      const di = y * w + x;
      ho[di] = hh;
      for (let k = 0; k < 4; k++) px[di * 4 + k] = cnt ? acc[k] / cnt : 0;
    }
    cur = { w, h, px, hole: ho };
    levels.push(cur);
  }
  const P = 3; // รัศมีแพตช์ (7×7)
  let prev = null;
  for (let L = levels.length - 1; L >= 0; L--) {
    const { w, h, px, hole: ho } = levels[L];
    // ค่าตั้งต้น: จากระดับก่อนหน้า หรือค่าเฉลี่ยรอบ ๆ (ระดับหยาบสุด)
    if (prev) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!ho[i]) continue;
        const pi = Math.min(prev.h - 1, y >> 1) * prev.w + Math.min(prev.w - 1, x >> 1);
        for (let k = 0; k < 4; k++) px[i * 4 + k] = prev.px[pi * 4 + k];
      }
    } else diffuse(px, ho, w, h);
    // จุดที่ใช้เป็นแหล่งแพตช์ได้ (ไม่แตะรูเลย)
    const valid = [];
    for (let y = P; y < h - P; y++) for (let x = P; x < w - P; x++) {
      let ok = true;
      for (let dy = -P; dy <= P && ok; dy++) for (let dx = -P; dx <= P; dx++) if (ho[(y + dy) * w + x + dx]) { ok = false; break; }
      if (ok) valid.push(y * w + x);
    }
    if (!valid.length) { prev = levels[L]; continue; }
    const targets = [];
    for (let i = 0; i < w * h; i++) {
      const x = i % w, y = (i / w) | 0;
      let near = false;
      for (let dy = -P; dy <= P && !near; dy++) for (let dx = -P; dx <= P; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < w && yy < h && ho[yy * w + xx]) { near = true; break; }
      }
      if (near) targets.push(i);
    }
    const nnf = new Int32Array(w * h).fill(-1);
    const cost = new Float32Array(w * h).fill(Infinity);
    const dist = (t, s, best) => {
      const tx = t % w, ty = (t / w) | 0, sx = s % w, sy = (s / w) | 0;
      let d = 0;
      for (let dy = -P; dy <= P; dy++) {
        const ty2 = Math.min(h - 1, Math.max(0, ty + dy)), sy2 = sy + dy;
        for (let dx = -P; dx <= P; dx++) {
          const ti = (ty2 * w + Math.min(w - 1, Math.max(0, tx + dx))) * 4, si = (sy2 * w + sx + dx) * 4;
          const a = px[ti] - px[si], b = px[ti + 1] - px[si + 1], c = px[ti + 2] - px[si + 2];
          d += a * a + b * b + c * c;
          if (d >= best) return d;
        }
      }
      return d;
    };
    const iters = L === 0 ? 3 : 4;
    for (let em = 0; em < iters; em++) {
      for (const t of targets) {
        if (nnf[t] < 0) { nnf[t] = valid[(Math.random() * valid.length) | 0]; cost[t] = dist(t, nnf[t], Infinity); }
        else cost[t] = dist(t, nnf[t], Infinity);
      }
      for (let it = 0; it < 4; it++) {
        const order = it % 2 ? targets.slice().reverse() : targets;
        const step = it % 2 ? 1 : -1;
        for (const t of order) {
          const tx = t % w, ty = (t / w) | 0;
          // แพร่จากเพื่อนบ้าน
          for (const [nx, ny] of [[tx + step, ty], [tx, ty + step]]) {
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const nb = nnf[ny * w + nx];
            if (nb < 0) continue;
            const cand = nb - step * (nx !== tx ? 1 : w);
            if (cand < 0 || cand >= w * h) continue;
            const cx = cand % w, cy = (cand / w) | 0;
            if (cx < P || cy < P || cx >= w - P || cy >= h - P || !isValidSrc(ho, w, cx, cy, P)) continue;
            const d = dist(t, cand, cost[t]);
            if (d < cost[t]) { cost[t] = d; nnf[t] = cand; }
          }
          // สุ่มค้นหารอบจุดดีที่สุดเดิม
          let rad = Math.max(w, h);
          const bx = nnf[t] % w, by = (nnf[t] / w) | 0;
          while (rad >= 1) {
            const cx = Math.min(w - P - 1, Math.max(P, bx + Math.round((Math.random() * 2 - 1) * rad)));
            const cy = Math.min(h - P - 1, Math.max(P, by + Math.round((Math.random() * 2 - 1) * rad)));
            if (isValidSrc(ho, w, cx, cy, P)) {
              const cand = cy * w + cx, d = dist(t, cand, cost[t]);
              if (d < cost[t]) { cost[t] = d; nnf[t] = cand; }
            }
            rad >>= 1;
          }
        }
      }
      // โหวตสี: แต่ละจุดในรูรับค่าจากแพตช์ที่ครอบมัน
      const acc = new Float32Array(w * h * 4), wsum = new Float32Array(w * h);
      for (const t of targets) {
        const tx = t % w, ty = (t / w) | 0, s = nnf[t], sx = s % w, sy = (s / w) | 0;
        const wt = Math.exp(-cost[t] / (2 * 49 * 400));
        for (let dy = -P; dy <= P; dy++) for (let dx = -P; dx <= P; dx++) {
          const x = tx + dx, y = ty + dy;
          if (x < 0 || y < 0 || x >= w || y >= h) continue;
          const i = y * w + x;
          if (!ho[i]) continue;
          const si = ((sy + dy) * w + sx + dx) * 4;
          acc[i * 4] += px[si] * wt; acc[i * 4 + 1] += px[si + 1] * wt; acc[i * 4 + 2] += px[si + 2] * wt; acc[i * 4 + 3] += px[si + 3] * wt;
          wsum[i] += wt;
        }
      }
      for (let i = 0; i < w * h; i++) if (ho[i] && wsum[i] > 0) for (let k = 0; k < 4; k++) px[i * 4 + k] = acc[i * 4 + k] / wsum[i];
    }
    onProgress && onProgress((levels.length - L) / levels.length);
    prev = levels[L];
  }
  const out = new ImageData(img.width, img.height);
  const top = levels[0];
  for (let i = 0; i < top.px.length; i++) out.data[i] = top.px[i];
  return out;
}

function isValidSrc(ho, w, x, y, P) {
  for (let dy = -P; dy <= P; dy += P) for (let dx = -P; dx <= P; dx += P) if (ho[(y + dy) * w + x + dx]) return false;
  return !ho[y * w + x];
}

// เติมรูเบื้องต้นด้วยค่าเฉลี่ยของเพื่อนบ้านที่รู้ค่า (ไล่จากขอบเข้าใน)
function diffuse(px, ho, w, h) {
  const known = new Uint8Array(w * h);
  for (let i = 0; i < known.length; i++) known[i] = ho[i] ? 0 : 1;
  let remaining = known.reduce((a, v) => a + (v ? 0 : 1), 0);
  let guard = 0;
  while (remaining > 0 && guard++ < w + h) {
    const add = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (known[i]) continue;
      let acc = [0, 0, 0, 0], c = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const k = yy * w + xx;
        if (!known[k]) continue;
        for (let q = 0; q < 4; q++) acc[q] += px[k * 4 + q];
        c++;
      }
      if (c) add.push([i, acc.map((v) => v / c)]);
    }
    if (!add.length) break;
    for (const [i, v] of add) { for (let q = 0; q < 4; q++) px[i * 4 + q] = v[q]; known[i] = 1; remaining--; }
  }
}
