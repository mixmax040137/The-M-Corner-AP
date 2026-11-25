// เครื่องมือ: ย่อ / ตัดวิดีโอ (WebCodecs ผ่าน mediabunny — ประมวลผลในเครื่อง ใช้การ์ดจอช่วยเข้ารหัส)
import { h, btn, field, select, step, toast, seg, checkbox, num, dropZone, pickFiles, progressBar, formatBytes, safeName, splitExt, download } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { outputChooser, openSink } from '../core/output.js';

let mbP;
const mb = () => (mbP ||= import('../vendor/mediabunny.mjs'));

const PRESETS = {
  line: { label: 'ส่ง LINE / อีเมล (ไฟล์เล็ก)', short: 720, bitrate: 1_500_000 },
  social: { label: 'โพสต์โซเชียล (สมดุล)', short: 1080, bitrate: 4_000_000 },
  high: { label: 'คุณภาพสูง', short: 0, bitrate: 8_000_000 },
  size: { label: 'กำหนดขนาดไฟล์เอง', short: 720, bitrate: 0 },
};

export const fmtTime = (s) => { s = Math.max(0, s || 0); const m = Math.floor(s / 60); return `${m}:${(s - m * 60).toFixed(1).padStart(4, '0')}`; };
export function parseTime(t) {
  const p = String(t).trim().split(':').map(Number);
  if (p.some(isNaN)) return NaN;
  return p.reduce((a, x) => a * 60 + x, 0);
}

export function mount(root) {
  const o = { preset: 'line', short: 720, targetMb: 20, mute: false, format: 'auto' };
  const items = []; // {file, url, duration, width, height, start, end, el}
  const list = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '14px' } });
  const support = h('div');
  const prog = progressBar();
  const result = h('div');
  const out = outputChooser('video', { preferFiles: true });
  let current = null; // conversion ที่กำลังทำ
  let cancelled = false;

  if (!('VideoEncoder' in window)) support.replaceChildren(h('div.note.error', 'เบราว์เซอร์นี้ยังไม่รองรับการแปลงวิดีโอ (WebCodecs) — ใช้ Chrome หรือ Edge เวอร์ชันล่าสุดบนคอมพิวเตอร์'));

  async function addFiles(entries) {
    const vids = entries.filter((x) => /^video\//.test(x.file.type) || /\.(mp4|mov|m4v|webm|mkv)$/i.test(x.file.name));
    if (!vids.length) return toast('ไม่พบไฟล์วิดีโอ', 'warn');
    const { Input, ALL_FORMATS, BlobSource } = await mb();
    for (const { file } of vids) {
      const it = { file, url: URL.createObjectURL(file), duration: 0, width: 0, height: 0, start: 0, end: 0 };
      try {
        const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
        const vt = await input.getPrimaryVideoTrack();
        it.duration = await input.computeDuration();
        if (vt) { it.width = vt.displayWidth; it.height = vt.displayHeight; it.codec = vt.codec; }
        it.end = it.duration;
      } catch (e) { it.error = 'อ่านไฟล์นี้ไม่ได้: ' + e.message; }
      items.push(it);
      list.append(itemCard(it));
    }
  }

  function itemCard(it) {
    const video = h('video', { src: it.url, controls: true, preload: 'metadata', style: { width: '100%', maxHeight: '320px', background: '#000', borderRadius: '8px' } });
    video.addEventListener('loadedmetadata', () => {
      if (!it.duration && isFinite(video.duration)) { it.duration = video.duration; it.end = it.duration; drawTrim(); }
      if (!it.width) { it.width = video.videoWidth; it.height = video.videoHeight; }
    });
    const trimBox = h('div.grid4');
    const startIn = h('input', { type: 'text', 'aria-label': 'จุดเริ่ม' });
    const endIn = h('input', { type: 'text', 'aria-label': 'จุดจบ' });
    const lenLabel = h('span.muted.small');
    function drawTrim() {
      startIn.value = fmtTime(it.start); endIn.value = fmtTime(it.end);
      lenLabel.textContent = `ความยาวหลังตัด ${fmtTime(it.end - it.start)} จาก ${fmtTime(it.duration)}`;
    }
    const setT = (k, v) => {
      if (isNaN(v)) return toast('รูปแบบเวลา เช่น 1:05.5', 'warn');
      it[k] = Math.min(it.duration, Math.max(0, v));
      if (it.end <= it.start) { if (k === 'start') it.end = it.duration; else it.start = 0; }
      drawTrim();
    };
    startIn.addEventListener('change', () => setT('start', parseTime(startIn.value)));
    endIn.addEventListener('change', () => setT('end', parseTime(endIn.value)));
    trimBox.append(
      field('เริ่มที่ (นาที:วินาที)', startIn), field('จบที่', endIn),
      h('div.field', h('span.field-label', ' '), btn('ใช้ตำแหน่งที่เล่นอยู่เป็นจุดเริ่ม', () => setT('start', video.currentTime), { kind: 'sm' })),
      h('div.field', h('span.field-label', ' '), btn('ใช้ตำแหน่งที่เล่นอยู่เป็นจุดจบ', () => setT('end', video.currentTime), { kind: 'sm' })));
    drawTrim();
    const status = h('div');
    it.status = status;
    const remove = btn('', () => { items.splice(items.indexOf(it), 1); URL.revokeObjectURL(it.url); card.remove(); }, { ic: 'x', kind: 'icon-only sm', title: 'เอาออก' });
    const card = h('section.card.video-item',
      h('div.row.wrap', h('h3.card-title', icon('video'), it.file.name), h('span.spacer'),
        h('span.muted.small', `${formatBytes(it.file.size)}${it.width ? ` · ${it.width}×${it.height}` : ''}${it.duration ? ` · ${fmtTime(it.duration)}` : ''}`), remove),
      it.error ? h('div.note.warn', it.error) : '',
      video, trimBox, lenLabel,
      h('div.row.wrap', btn('บันทึกภาพนิ่งจากตำแหน่งนี้ (JPG)', () => {
        if (!video.videoWidth) return toast('วิดีโอยังไม่พร้อม', 'warn');
        const c = h('canvas', { width: video.videoWidth, height: video.videoHeight });
        c.getContext('2d').drawImage(video, 0, 0);
        c.toBlob((b) => download(b, `${safeName(splitExt(it.file.name)[0])}-${fmtTime(video.currentTime).replace(/[:.]/g, '-')}.jpg`), 'image/jpeg', 0.92);
      }, { ic: 'camera', kind: 'sm' })),
      status);
    return card;
  }

  function targetFor(it) {
    const p = PRESETS[o.preset];
    const short = o.preset === 'size' || o.preset === 'line' || o.preset === 'social' ? (o.preset === 'size' ? +o.short : p.short) : 0;
    const srcShort = Math.min(it.width || 1920, it.height || 1080);
    let width, height;
    if (short && srcShort > short) {
      const s = short / srcShort;
      width = Math.round(((it.width || 1920) * s) / 2) * 2;
      height = Math.round(((it.height || 1080) * s) / 2) * 2;
    }
    let bitrate = p.bitrate;
    if (o.preset === 'size') {
      const secs = Math.max(1, it.end - it.start);
      const audio = o.mute ? 0 : 128_000;
      bitrate = Math.max(250_000, Math.floor(((+o.targetMb || 20) * 8 * 1024 * 1024 * 0.94) / secs - audio));
    }
    return { width, height, bitrate };
  }

  async function chooseFormat(w, hgt, bitrate) {
    const { canEncodeVideo } = await mb();
    const size = { width: w || 1280, height: hgt || 720, bitrate };
    if (o.format !== 'webm' && (await canEncodeVideo('avc', size))) return { kind: 'mp4', codec: 'avc' };
    if (o.format === 'mp4') throw new Error('เบราว์เซอร์นี้สร้าง MP4 (H.264) ไม่ได้ — เลือก WebM หรือใช้ Chrome/Edge บน Windows/Mac');
    for (const c of ['vp9', 'vp8']) if (await canEncodeVideo(c, size)) return { kind: 'webm', codec: c };
    throw new Error('เบราว์เซอร์นี้เข้ารหัสวิดีโอไม่ได้');
  }

  async function convert(it, sink) {
    const M = await mb();
    const t = targetFor(it);
    const fmt = await chooseFormat(t.width || it.width, t.height || it.height, t.bitrate);
    const input = new M.Input({ source: new M.BlobSource(it.file), formats: M.ALL_FORMATS });
    const output = new M.Output({
      format: fmt.kind === 'mp4' ? new M.Mp4OutputFormat({ fastStart: 'in-memory' }) : new M.WebMOutputFormat(),
      target: new M.BufferTarget(),
    });
    const trimmed = it.start > 0.05 || it.end < it.duration - 0.05;
    // MP4: ใช้เสียง AAC เพื่อให้เล่นได้ทุกเครื่อง (iPhone/QuickTime) ถ้าเข้ารหัสได้ หรือไฟล์ต้นทางเป็น AAC อยู่แล้ว
    let audio = o.mute ? { discard: true } : {};
    let opusInMp4 = false;
    if (!o.mute && fmt.kind === 'mp4') {
      const at = await input.getPrimaryAudioTrack();
      if (at && (at.codec === 'aac' || (await M.canEncodeAudio('aac')))) audio = { codec: 'aac' };
      else if (at) opusInMp4 = true;
    }
    const conv = await M.Conversion.init({
      input, output, showWarnings: false,
      video: { codec: fmt.codec, bitrate: t.bitrate, ...(t.width ? { width: t.width, height: t.height, fit: 'contain' } : {}), forceTranscode: true },
      audio,
      ...(trimmed ? { trim: { start: it.start, end: it.end } } : {}),
    });
    if (!conv.isValid) throw new Error('แปลงไฟล์นี้ไม่ได้: ' + conv.discardedTracks.map((d) => `${d.track.type} (${d.reason})`).join(', '));
    const lostAudio = !o.mute && conv.discardedTracks.some((d) => d.track.type === 'audio');
    current = conv;
    conv.onProgress = (p) => prog.set(Math.round(p * 100), 100, `${it.file.name} · ${Math.round(p * 100)}%`);
    await conv.execute();
    current = null;
    const blob = new Blob([output.target.buffer], { type: fmt.kind === 'mp4' ? 'video/mp4' : 'video/webm' });
    const name = `${safeName(splitExt(it.file.name)[0])}-ย่อแล้ว.${fmt.kind}`;
    await sink.write(name, blob);
    return { blob, name, fmt, lostAudio, opusInMp4 };
  }

  async function runAll() {
    if (!items.length) return toast('เลือกวิดีโอก่อน', 'warn');
    let sink;
    try { sink = await openSink(out.mode, { zipName: 'วิดีโอ-ย่อแล้ว.zip', dirId: 'mhub-video-out' }); }
    catch (e) { if (e.name !== 'AbortError') toast(e.message, 'error'); return; }
    cancelled = false;
    startBtn.disabled = true; stopBtn.hidden = false;
    let done = 0;
    for (const it of items) {
      if (cancelled) break;
      if (it.error) continue;
      it.status.replaceChildren(h('div.muted', 'กำลังแปลง…'));
      try {
        const t0 = performance.now();
        const r = await convert(it, sink);
        done++;
        const pct = Math.round((1 - r.blob.size / it.file.size) * 100);
        it.status.replaceChildren(h('div.note.ok', `✓ ${r.name} · ${formatBytes(it.file.size)} → ${formatBytes(r.blob.size)}${pct > 0 ? ` (เล็กลง ${pct}%)` : ''} · ${r.fmt.kind.toUpperCase()} · ${((performance.now() - t0) / 1000).toFixed(1)} วินาที`),
          r.fmt.kind === 'webm' && o.format === 'auto' ? h('div.hint', 'เบราว์เซอร์นี้สร้าง MP4 ไม่ได้ จึงบันทึกเป็น WebM (เปิดได้ใน Chrome / YouTube / LINE บนคอม)') : '',
          r.lostAudio ? h('div.note.warn', 'เบราว์เซอร์นี้แปลงเสียงของไฟล์นี้ไม่ได้ ผลลัพธ์จึงไม่มีเสียง') : '',
          r.opusInMp4 ? h('div.hint', 'เสียงเป็นแบบ Opus (เบราว์เซอร์นี้สร้าง AAC ไม่ได้) — เล่นได้ใน Chrome/Android แต่บาง iPhone อาจไม่มีเสียง') : '');
      } catch (e) {
        current = null;
        console.error(e);
        it.status.replaceChildren(h('div.note.error', cancelled ? 'หยุดแล้ว' : '✗ ' + (e.message || e)));
      }
    }
    prog.hide();
    startBtn.disabled = false; stopBtn.hidden = true;
    if (done) { const res = await sink.close(); result.replaceChildren(h('div.note.ok', `แปลงเสร็จ ${done} ไฟล์ → ${res.where}`)); }
  }

  const startBtn = btn('เริ่มแปลงวิดีโอ', runAll, { kind: 'primary big', ic: 'play' });
  const stopBtn = btn('หยุด', async () => { cancelled = true; if (current) await current.cancel(); }, { kind: 'danger', ic: 'stop' });
  stopBtn.hidden = true;

  const presetExtra = h('div.grid4');
  const drawPreset = () => presetExtra.replaceChildren(...(o.preset === 'size' ? [
    field('ขนาดไฟล์ไม่เกิน (MB)', num(o.targetMb, (v) => (o.targetMb = v), { min: 1, max: 2000 }), 'เช่น 25 สำหรับแนบอีเมล'),
    field('ความละเอียด (ด้านสั้น)', select([[0, 'เท่าเดิม'], [1080, '1080p'], [720, '720p'], [480, '480p'], [360, '360p']], o.short, (v) => (o.short = +v))),
  ] : [h('div.hint', { style: { gridColumn: '1 / -1' } }, o.preset === 'line' ? 'ด้านสั้น 720 px · ~1.5 Mbps — วิดีโอ 1 นาทีประมาณ 12 MB' : o.preset === 'social' ? 'ด้านสั้น 1080 px · ~4 Mbps — วิดีโอ 1 นาทีประมาณ 30 MB' : 'ความละเอียดเดิม · ~8 Mbps')]));
  drawPreset();

  const drop = h('div.drop', h('div', icon('video', 28)), h('p', 'ลากวิดีโอมาวาง หรือ'),
    btn('เลือกวิดีโอ', async () => addFiles(await pickFiles({ accept: 'video/*,.mov,.mkv' })), { kind: 'primary', ic: 'video' }));
  dropZone(drop, addFiles);

  root.append(
    h('p.intro', 'ย่อขนาดวิดีโอให้ส่ง LINE/อีเมลได้ ตัดเฉพาะช่วงที่ต้องการ ลดความละเอียด หรือปิดเสียง — ทำในเครื่องคุณด้วยการ์ดจอ ไม่ต้องอัปโหลดไปเว็บอื่น'),
    support,
    step(1, 'เลือกวิดีโอ', drop),
    step(2, 'ตั้งค่า',
      field('เป้าหมาย', seg(Object.entries(PRESETS).map(([k, p]) => [k, p.label]), o.preset, (v) => { o.preset = v; drawPreset(); })),
      presetExtra,
      h('div.grid3',
        field('รูปแบบไฟล์', select([['auto', 'อัตโนมัติ (MP4 ถ้าทำได้)'], ['mp4', 'MP4 (H.264)'], ['webm', 'WebM (VP9)']], o.format, (v) => (o.format = v))),
        h('div.field', h('span.field-label', ' '), checkbox('ปิดเสียง (ตัดเสียงออก)', o.mute, (v) => (o.mute = v)))),
      out.el),
    step(3, 'ตัดช่วงและแปลง', list, h('div.row.wrap', startBtn, stopBtn), prog.el, result),
  );
}
