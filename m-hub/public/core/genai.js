// แก้ภาพด้วย AI (FLUX.2 ผ่าน Workers AI ของบัญชีนี้ — ใช้โควตาฟรีรายวัน และต้องต่ออินเทอร์เน็ต)
// ภาพจะถูกส่งไปประมวลผลที่ Cloudflare เฉพาะเมื่อกดใช้เครื่องมือ AI เท่านั้น
import { makeCanvas, ctx2d, featherMask } from './fx.js';
import { aiTranslate, hasThai } from './glossary.js';

const fit16 = (w, h, max = 1024) => {
  const s = Math.min(1, max / Math.max(w, h));
  return [Math.max(256, Math.round((w * s) / 16) * 16), Math.max(256, Math.round((h * s) / 16) * 16)];
};

// แปลคำสั่งภาษาไทยเป็นอังกฤษก่อน (โมเดลเข้าใจภาษาอังกฤษดีที่สุด)
export async function toEnglish(prompt) {
  if (!hasThai(prompt)) return prompt;
  try { return (await aiTranslate([prompt]))[0]; } catch { return prompt; }
}

async function call(path, payload) {
  const r = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.image) throw new Error(j.error || 'HTTP ' + r.status);
  const img = new Image();
  img.src = j.image;
  await img.decode();
  return img;
}

// ส่งภาพทั้งภาพ (ย่อไม่เกิน 1024) ให้ AI แก้ตามคำสั่ง แล้วขยายกลับเท่าขนาดเดิม
export async function editWhole(src, instruction) {
  const [w, h] = fit16(src.width, src.height);
  const c = makeCanvas(w, h);
  c.getContext('2d').drawImage(src, 0, 0, w, h);
  const img = await call('/api/image/edit', { prompt: instruction, image: c.toDataURL('image/jpeg', 0.92), width: w, height: h });
  const out = makeCanvas(src.width, src.height);
  const g = out.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, src.width, src.height);
  return out;
}

function bboxOf(mask, W, H) {
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x] > 0.5) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

/**
 * แก้เฉพาะพื้นที่ที่ระบาย: ครอปรอบพื้นที่ → AI แก้ → วางกลับเฉพาะในพื้นที่ (ขอบนุ่ม)
 * highlight: ระบายสีบานเย็นทับพื้นที่ในภาพที่ส่ง (ใช้กับการลบวัตถุ ให้ AI รู้ว่าลบตรงไหน)
 */
export async function editRegion(src, mask, instruction, { highlight = false } = {}) {
  const W = src.width, H = src.height;
  const bb = bboxOf(mask, W, H);
  if (!bb) throw new Error('ยังไม่ได้ระบายพื้นที่');
  const bw = bb.x1 - bb.x0 + 1, bh = bb.y1 - bb.y0 + 1;
  const side = Math.min(Math.max(W, H), Math.max(384, Math.round(Math.max(bw, bh) * 1.8)));
  const cw = Math.min(W, Math.max(side, bw + 32)), chh = Math.min(H, Math.max(side, bh + 32));
  const cx = Math.max(0, Math.min(W - cw, Math.round((bb.x0 + bb.x1) / 2 - cw / 2)));
  const cy = Math.max(0, Math.min(H - chh, Math.round((bb.y0 + bb.y1) / 2 - chh / 2)));
  const [w, h] = fit16(cw, chh);
  const crop = makeCanvas(w, h);
  const g = crop.getContext('2d');
  g.drawImage(src, cx, cy, cw, chh, 0, 0, w, h);
  if (highlight) {
    const mc = makeCanvas(cw, chh);
    const mid = new ImageData(cw, chh);
    for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) if (mask[(cy + y) * W + cx + x] > 0.5) { const j = (y * cw + x) * 4; mid.data[j] = 255; mid.data[j + 2] = 255; mid.data[j + 3] = 200; }
    mc.getContext('2d').putImageData(mid, 0, 0);
    g.drawImage(mc, 0, 0, w, h);
  }
  const img = await call('/api/image/edit', { prompt: instruction, image: crop.toDataURL('image/jpeg', 0.92), width: w, height: h });
  const back = makeCanvas(cw, chh);
  const bctx = ctx2d(back);
  bctx.imageSmoothingQuality = 'high';
  bctx.drawImage(img, 0, 0, cw, chh);
  const local = new Float32Array(cw * chh);
  for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) local[y * cw + x] = mask[(cy + y) * W + cx + x] > 0.5 ? 1 : 0;
  // ขยายขอบพื้นที่เล็กน้อยแล้วทำขอบนุ่ม
  const soft = featherMask(featherMask(local, cw, chh, 3).map((v) => (v > 0.05 ? 1 : 0)), cw, chh, Math.max(2, Math.round(Math.max(cw, chh) * 0.01)));
  const out = makeCanvas(W, H);
  const octx = ctx2d(out);
  octx.drawImage(src, 0, 0);
  const base = octx.getImageData(cx, cy, cw, chh), patch = bctx.getImageData(0, 0, cw, chh);
  for (let i = 0; i < soft.length; i++) {
    const m = soft[i];
    if (m <= 0.001) continue;
    const j = i * 4;
    for (let k = 0; k < 3; k++) base.data[j + k] = base.data[j + k] * (1 - m) + patch.data[j + k] * m;
  }
  octx.putImageData(base, cx, cy);
  return out;
}

// ขยายขอบภาพ: วางภาพเดิมกลางผืนใหม่ เติมขอบด้วยสีเทาเรียบ แล้วให้ AI วาดฉากต่อออกไป
export async function expand(src, targetW, targetH) {
  const ox = Math.round((targetW - src.width) / 2), oy = Math.round((targetH - src.height) / 2);
  const canvas = makeCanvas(targetW, targetH);
  const g = canvas.getContext('2d');
  g.fillStyle = '#808080';
  g.fillRect(0, 0, targetW, targetH);
  g.drawImage(src, ox, oy);
  const gen = await editWhole(canvas, 'Outpaint: the flat gray areas around the photo are empty canvas. Fill them by extending this photo naturally (same place, same objects, same lighting and perspective) so the whole image looks like one larger photograph. Keep the existing photo unchanged. No text, no frame, no borders.');
  // วางภาพต้นฉบับกลับตรงกลางให้คมเหมือนเดิม (ขอบนุ่มเฉพาะด้านที่ขยาย)
  const out = makeCanvas(targetW, targetH);
  const octx = ctx2d(out);
  octx.drawImage(gen, 0, 0);
  const fade = Math.max(6, Math.round(Math.min(src.width, src.height) * 0.04));
  const tmp = makeCanvas(src.width, src.height);
  const tctx = ctx2d(tmp);
  tctx.drawImage(src, 0, 0);
  const id = tctx.getImageData(0, 0, src.width, src.height);
  const fx = ox > 0, fy = oy > 0;
  for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
    const d = Math.min(fx ? Math.min(x, src.width - 1 - x) : Infinity, fy ? Math.min(y, src.height - 1 - y) : Infinity);
    if (d < fade) id.data[(y * src.width + x) * 4 + 3] = Math.round(255 * (d / fade));
  }
  tctx.putImageData(id, 0, 0);
  octx.drawImage(tmp, ox, oy);
  return out;
}

// เปลี่ยนพื้นหลังด้วย AI: ถ้าตำแหน่งคนในภาพใหม่ตรงกับเดิม จะวางคนจากภาพต้นฉบับทับ (หน้าตาไม่เปลี่ยนแน่นอน)
export async function replaceBackgroundAI(src, scene, matte) {
  const gen = await editWhole(src, `Replace the background with: ${scene}. Keep the person exactly the same: same face, hair, clothes, pose, size and position in the frame. Realistic photo, no text.`);
  if (!matte) return { canvas: gen, kept: false };
  const W = src.width, H = src.height;
  const A = ctx2d(src).getImageData(0, 0, W, H).data, B = ctx2d(gen).getImageData(0, 0, W, H).data;
  let s = 0, n = 0;
  for (let i = 0; i < matte.length; i += 7) if (matte[i] > 0.9) { const j = i * 4; s += Math.abs(A[j] - B[j]) + Math.abs(A[j + 1] - B[j + 1]) + Math.abs(A[j + 2] - B[j + 2]); n += 3; }
  if (!n || s / n > 28) return { canvas: gen, kept: false };
  const soft = featherMask(matte, W, H, 1.5);
  const out = makeCanvas(W, H);
  const octx = ctx2d(out);
  octx.drawImage(gen, 0, 0);
  const o = octx.getImageData(0, 0, W, H);
  for (let i = 0; i < soft.length; i++) { const m = soft[i]; if (m < 0.01) continue; const j = i * 4; for (let k = 0; k < 3; k++) o.data[j + k] = A[j + k] * m + o.data[j + k] * (1 - m); }
  octx.putImageData(o, 0, 0);
  return { canvas: out, kept: true };
}
