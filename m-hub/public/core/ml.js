// AI ในเครื่อง (TensorFlow.js): แยกบุคคลออกจากพื้นหลัง และขยายภาพ
// ไฟล์โมเดลโหลดครั้งแรกผ่าน /cdn/ ของ Worker แล้วเบราว์เซอร์จำไว้ (ใช้ออฟไลน์ได้ภายหลัง)
import { loadScript } from './ui.js';

let tfP = null;
export async function tf() {
  tfP ||= (async () => {
    await loadScript('/cdn/tfjs/tf.min.js');
    const T = window.tf;
    for (const b of ['webgl', 'cpu']) {
      try { if (await T.setBackend(b)) break; } catch { /* ลองตัวถัดไป */ }
    }
    await T.ready();
    return T;
  })();
  tfP.catch(() => { tfP = null; });
  return tfP;
}

export async function backendName() { return (await tf()).getBackend(); }

function toCanvas(src, maxSide) {
  const w0 = src.width, h0 = src.height;
  const s = Math.min(1, maxSide / Math.max(w0, h0));
  const c = document.createElement('canvas');
  c.width = Math.max(16, Math.round((w0 * s) / 16) * 16);
  c.height = Math.max(16, Math.round((h0 * s) / 16) * 16);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return c;
}

// ---------- แยกบุคคล (Robust Video Matting) ----------
let rvmP = null;
const loadRvm = async () => (rvmP ||= (await tf()).loadGraphModel('/cdn/m/rvm/rvm.json'));

/**
 * คืนค่าความทึบของ “บุคคล” ทุกจุด (0 = พื้นหลัง, 1 = คน) ขนาดเท่าภาพต้นฉบับ
 * ได้ผลดีกับภาพบุคคล/กลุ่มคน — วัตถุทั่วไปที่ไม่ใช่คนอาจแยกไม่ได้
 */
export async function personMatte(src, { maxSide = 1024 } = {}) {
  const T = await tf();
  const model = await loadRvm();
  const c = toCanvas(src, maxSide);
  const ratio = Math.min(1, Math.max(0.25, 512 / Math.max(c.width, c.height)));
  const input = T.tidy(() => T.browser.fromPixels(c).toFloat().div(255).expandDims(0));
  const ds = T.scalar(ratio);
  let state = [T.scalar(0), T.scalar(0), T.scalar(0), T.scalar(0)];
  let pha = null;
  for (let pass = 0; pass < 2; pass++) { // รอบที่ 2 ใช้ค่าจำจากรอบแรก ทำให้ขอบผม/ขอบตัวละเอียดขึ้น
    const out = await model.executeAsync({ src: input, r1i: state[0], r2i: state[1], r3i: state[2], r4i: state[3], downsample_ratio: ds }, ['pha', 'r1o', 'r2o', 'r3o', 'r4o']);
    T.dispose(state);
    if (pha) pha.dispose();
    [pha, ...state] = out;
  }
  const small = await pha.data();
  T.dispose([input, ds, pha, ...state]);
  // ขยายกลับเป็นขนาดภาพจริง (bilinear ผ่าน canvas)
  const mc = document.createElement('canvas');
  mc.width = c.width; mc.height = c.height;
  const id = new ImageData(c.width, c.height);
  for (let i = 0; i < small.length; i++) { const v = small[i] * 255; id.data[i * 4] = v; id.data[i * 4 + 1] = v; id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
  mc.getContext('2d').putImageData(id, 0, 0);
  const W = src.width, H = src.height;
  const big = document.createElement('canvas');
  big.width = W; big.height = H;
  const bctx = big.getContext('2d', { willReadFrequently: true });
  bctx.imageSmoothingQuality = 'high';
  bctx.drawImage(mc, 0, 0, W, H);
  const bd = bctx.getImageData(0, 0, W, H).data;
  const alpha = new Float32Array(W * H);
  for (let i = 0; i < alpha.length; i++) {
    const a = bd[i * 4] / 255;
    alpha[i] = a < 0.04 ? 0 : a > 0.96 ? 1 : a; // ตัดสัญญาณรบกวนเล็ก ๆ
  }
  return { width: W, height: H, alpha };
}

// ---------- ขยายภาพด้วย AI (ESRGAN) ----------
const esr = {};
const loadEsrgan = async (scale) => (esr[scale] ||= (await tf()).loadLayersModel(`/cdn/m/esrgan/x${scale}/model.json`));

/**
 * ขยายภาพ 2 หรือ 4 เท่าด้วย AI — แบ่งเป็นชิ้น 128 px ซ้อนขอบกันรอยต่อ
 * onProgress(0..1)
 */
export async function upscale(src, scale = 2, { onProgress } = {}) {
  const T = await tf();
  const model = await loadEsrgan(scale);
  const W = src.width, H = src.height;
  const inC = document.createElement('canvas');
  inC.width = W; inC.height = H;
  inC.getContext('2d').drawImage(src, 0, 0);
  const out = document.createElement('canvas');
  out.width = W * scale; out.height = H * scale;
  const octx = out.getContext('2d');
  const tile = 128, pad = 10;
  const pixels = T.tidy(() => T.browser.fromPixels(inC).toFloat());
  const total = Math.ceil(W / tile) * Math.ceil(H / tile);
  let done = 0;
  for (let y = 0; y < H; y += tile) {
    for (let x = 0; x < W; x += tile) {
      const x0 = Math.max(0, x - pad), y0 = Math.max(0, y - pad);
      const x1 = Math.min(W, x + tile + pad), y1 = Math.min(H, y + tile + pad);
      const res = T.tidy(() => {
        const part = pixels.slice([y0, x0, 0], [y1 - y0, x1 - x0, 3]).expandDims(0);
        return model.predict(part).squeeze().clipByValue(0, 255).round().toInt();
      });
      const tw = Math.min(tile, W - x), th = Math.min(tile, H - y);
      const ox = (x - x0) * scale, oy = (y - y0) * scale;
      const crop = T.tidy(() => res.slice([oy, ox, 0], [th * scale, tw * scale, 3]));
      const data = await T.browser.toPixels(crop);
      octx.putImageData(new ImageData(data, tw * scale, th * scale), x * scale, y * scale);
      T.dispose([res, crop]);
      onProgress && onProgress(++done / total);
      if (done % 8 === 0) await new Promise((r) => setTimeout(r, 0));
    }
  }
  pixels.dispose();
  return out;
}
