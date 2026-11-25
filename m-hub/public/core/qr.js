// สร้าง QR Code (รองรับภาษาไทย/UTF-8) — ใช้ในเครื่องมือ QR และในเกียรติบัตร/ป้ายชื่อ
let lib = null;
const cache = new Map();

export async function loadQr() {
  if (!lib) {
    lib = (await import('../vendor/qrcode.mjs')).default;
    lib.stringToBytes = (s) => Array.from(new TextEncoder().encode(s)); // UTF-8 แทน Latin-1
  }
  return lib;
}

// คืนตาราง QR (ต้องเรียก loadQr() ก่อนอย่างน้อย 1 ครั้ง) — null ถ้ายังไม่โหลดหรือข้อความยาวเกิน
export function qrMatrix(text, ecl = 'M') {
  if (!lib || !text) return null;
  const key = ecl + '|' + text;
  if (cache.has(key)) return cache.get(key);
  let m = null;
  try {
    const qr = lib(0, ecl);
    qr.addData(String(text), 'Byte');
    qr.make();
    const n = qr.getModuleCount();
    const cells = new Uint8Array(n * n);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) cells[r * n + c] = qr.isDark(r, c) ? 1 : 0;
    m = { n, cells };
  } catch { m = null; }
  if (cache.size > 500) cache.clear();
  cache.set(key, m);
  return m;
}

// วาด QR ลง canvas: (x, y) = มุมซ้ายบน, size = ความกว้างรวมขอบ (quiet zone)
export function drawQr(ctx, m, x, y, size, { fg = '#000000', bg = '#ffffff', margin = 4 } = {}) {
  const total = m.n + margin * 2;
  const s = size / total;
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(x, y, size, size); }
  ctx.fillStyle = fg;
  for (let r = 0; r < m.n; r++) {
    for (let c = 0; c < m.n; c++) {
      if (m.cells[r * m.n + c]) ctx.fillRect(Math.floor(x + (c + margin) * s), Math.floor(y + (r + margin) * s), Math.ceil(s), Math.ceil(s));
    }
  }
}

export function qrSvg(m, { fg = '#000000', bg = '#ffffff', margin = 4, size = 512 } = {}) {
  const total = m.n + margin * 2;
  let path = '';
  for (let r = 0; r < m.n; r++) for (let c = 0; c < m.n; c++) if (m.cells[r * m.n + c]) path += `M${c + margin} ${r + margin}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">${bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}<path fill="${fg}" d="${path}"/></svg>`;
}
