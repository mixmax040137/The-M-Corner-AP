// ปลายทางของผลงาน: บันทึกลงโฟลเดอร์ในเครื่อง หรือดาวน์โหลดเป็น ZIP
import { h, select, field, download, formatBytes } from './ui.js';
import { fsSupported, pickDirectory, writeFileTo, workspace } from './workspace.js';
import * as store from './store.js';

let fflate;
async function getFflate() { return (fflate ||= await import('../vendor/fflate.mjs')); }

// กล่องเลือกปลายทาง ใช้ซ้ำได้ทุกเครื่องมือ
export function outputChooser(toolId, { allowSingle = false } = {}) {
  const opts = [];
  if (fsSupported) opts.push(['folder', 'บันทึกลงโฟลเดอร์ในเครื่อง (เลือกตอนกดเริ่ม)']);
  opts.push(['zip', 'ดาวน์โหลดเป็นไฟล์ ZIP']);
  if (allowSingle) opts.push(['files', 'ดาวน์โหลดทีละไฟล์']);
  let mode = opts[0][0];
  const key = 'output:' + toolId;
  const sel = select(opts, mode, (v) => { mode = v; store.set(key, v); });
  store.get(key).then((v) => { if (v && opts.some((o) => o[0] === v)) { mode = v; sel.value = v; } });
  const el = field('บันทึกผลลัพธ์', sel, fsSupported ? 'โหมดโฟลเดอร์: ไฟล์ชื่อซ้ำจะต่อท้าย (2) ไม่เขียนทับของเดิม' : 'เบราว์เซอร์นี้บันทึกลงโฟลเดอร์โดยตรงไม่ได้ จึงใช้ ZIP');
  return { el, get mode() { return mode; } };
}

// เปิดปลายทางสำหรับเขียนไฟล์ → { write(path, data), close() }
export async function openSink(mode, { zipName = 'm-hub.zip', dirId = 'mhub-out' } = {}) {
  if (mode === 'folder') {
    const dir = await pickDirectory(dirId, 'readwrite');
    const written = [];
    let bytes = 0;
    return {
      label: dir.name,
      async write(path, data) {
        const p = await writeFileTo(dir, path, data);
        written.push(p);
        bytes += data.size ?? data.byteLength ?? 0;
        return p;
      },
      async close() { return { count: written.length, bytes, where: `โฟลเดอร์ “${dir.name}”`, paths: written }; },
    };
  }
  if (mode === 'files') {
    const written = [];
    return {
      label: 'ดาวน์โหลด',
      async write(path, data) {
        const blob = data instanceof Blob ? data : new Blob([data]);
        download(blob, path.split('/').pop());
        written.push(path);
        await new Promise((r) => setTimeout(r, 250));
        return path;
      },
      async close() { return { count: written.length, bytes: 0, where: 'โฟลเดอร์ดาวน์โหลด', paths: written }; },
    };
  }
  // ZIP
  const { zipSync } = await getFflate();
  const files = {};
  let bytes = 0;
  return {
    label: zipName,
    async write(path, data) {
      let p = path;
      if (files[p]) {
        const i = p.lastIndexOf('.');
        const [b, e] = i > 0 ? [p.slice(0, i), p.slice(i)] : [p, ''];
        let n = 2;
        while (files[`${b} (${n})${e}`]) n++;
        p = `${b} (${n})${e}`;
      }
      const u8 = data instanceof Uint8Array ? data : new Uint8Array(data instanceof Blob ? await data.arrayBuffer() : data);
      const compressed = /\.(jpe?g|png|webp|avif|heic|gif|zip|docx|xlsx|pdf)$/i.test(p);
      files[p] = [u8, { level: compressed ? 0 : 6 }];
      bytes += u8.byteLength;
      return p;
    },
    async close() {
      const zipped = zipSync(files);
      const blob = new Blob([zipped], { type: 'application/zip' });
      download(blob, zipName);
      return { count: Object.keys(files).length, bytes, where: `ไฟล์ ${zipName} (${formatBytes(blob.size)})`, paths: Object.keys(files), blob };
    },
  };
}

export function resultNote(summary) {
  return h('div.note.ok', `เสร็จแล้ว ${summary.count} ไฟล์ → ${summary.where}`);
}

export { workspace };
