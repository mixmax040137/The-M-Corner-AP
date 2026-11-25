// เครื่องมือ: อ่านข้อความจากภาพ / PDF สแกน (OCR ไทย + อังกฤษ)
import { h, btn, field, select, step, toast, checkbox, dropZone, pickFiles, copyText, download, progressBar, safeName, splitExt } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { outputChooser, openSink } from '../core/output.js';
import { recognize } from '../core/ocr.js';
import { share } from '../core/bus.js';
import { estimateTokens } from '../core/thai.js';

export function mount(root) {
  const o = { langs: 'tha+eng', tidy: true, forceOcr: false };
  const results = []; // {name, text}
  const list = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '14px' } });
  const prog = progressBar();
  let busy = false;
  const queue = [];

  async function addFiles(entries) {
    const ok = entries.filter((x) => /\.(png|jpe?g|webp|bmp|gif|heic|heif|pdf)$/i.test(x.file.name) || /^image\//.test(x.file.type));
    if (!ok.length) return toast('รองรับไฟล์ภาพและ PDF', 'warn');
    queue.push(...ok.map((x) => x.file));
    if (busy) return;
    busy = true;
    while (queue.length) {
      const file = queue.shift();
      const card = h('section.card.ocr-doc', h('h3.card-title', icon('file'), file.name), h('div.muted', 'กำลังเตรียม…'));
      list.prepend(card);
      try {
        const t0 = performance.now();
        const r = await recognize(file, { ...o, onProgress: (s, p) => prog.set(Math.round(p * 100), 100, s) });
        prog.hide();
        results.push({ name: file.name, text: r.text });
        card.replaceWith(resultCard(file, r, ((performance.now() - t0) / 1000).toFixed(1)));
      } catch (e) {
        prog.hide();
        console.error(e);
        card.replaceChildren(h('h3.card-title', icon('file'), file.name), h('div.note.error', 'อ่านไม่สำเร็จ: ' + (e.message || e)));
      }
    }
    busy = false;
  }

  function resultCard(file, r, secs) {
    const ta = h('textarea', { rows: 12, value: r.text });
    const name = safeName(splitExt(file.name)[0]);
    return h('section.card.ocr-doc',
      h('div.row.wrap', h('h3.card-title', icon('file'), file.name), h('span.spacer'),
        h('span.muted.small', `${r.method === 'ocr' ? 'อ่านด้วย OCR' : 'PDF มีข้อความอยู่แล้ว (ดึงตรง)'} · ${r.pages} หน้า · ${r.text.length.toLocaleString()} ตัวอักษร · ${secs} วินาที`)),
      ta,
      h('div.row.wrap',
        btn('คัดลอก', () => copyText(ta.value), { ic: 'copy', kind: 'sm primary' }),
        btn('ดาวน์โหลด .txt', () => download(new Blob(['﻿' + ta.value], { type: 'text/plain;charset=utf-8' }), name + '.txt'), { ic: 'download', kind: 'sm' }),
        btn('ร่างอีเมลประกาศจากข้อความนี้ →', () => {
          share('announce-text', { name: file.name, text: ta.value, file: /\.pdf$/i.test(file.name) ? file : null });
          location.hash = '#/announce';
        }, { ic: 'megaphone', kind: 'sm' }),
        h('span.hint', `~${estimateTokens(ta.value)} token ถ้าส่งต่อให้ AI`)),
      h('div.hint', 'ผล OCR อาจมีตัวอักษรผิดบ้าง โดยเฉพาะภาพเอียง ภาพเบลอ หรือฟอนต์ตกแต่ง — ตรวจทานก่อนนำไปใช้'));
  }

  const out = outputChooser('ocr');
  async function exportAll() {
    const cards = [...list.querySelectorAll('.ocr-doc textarea')];
    if (!cards.length) return toast('ยังไม่มีผลลัพธ์', 'warn');
    let sink;
    try { sink = await openSink(out.mode, { zipName: 'ข้อความ-OCR.zip', dirId: 'mhub-ocr-out' }); }
    catch (e) { if (e.name !== 'AbortError') toast(e.message, 'error'); return; }
    for (const ta of cards) {
      const title = ta.closest('.ocr-doc').querySelector('.card-title').textContent;
      await sink.write(safeName(splitExt(title)[0]) + '.txt', new Blob(['﻿' + ta.value], { type: 'text/plain;charset=utf-8' }));
    }
    const res = await sink.close();
    toast(`บันทึก ${res.count} ไฟล์ → ${res.where}`, 'ok');
  }

  // วางภาพจากคลิปบอร์ด (เช่น ภาพหน้าจอ) เมื่อเปิดหน้านี้อยู่
  document.addEventListener('paste', (e) => {
    if (root.closest('[hidden]') || root.hidden) return;
    const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    e.preventDefault();
    addFiles(files.map((f, i) => ({ file: new File([f], f.name && f.name !== 'image.png' ? f.name : `ภาพที่วาง-${new Date().toLocaleTimeString('th-TH').replace(/:/g, '.')}${i ? '-' + i : ''}.png`, { type: f.type }) })));
  });

  const drop = h('div.drop',
    h('div', icon('scan', 28)),
    h('p', 'ลากภาพ / PDF สแกน มาวาง · หรือกด ', h('kbd', 'Ctrl'), ' + ', h('kbd', 'V'), ' เพื่อวางภาพหน้าจอ · หรือ'),
    btn('เลือกไฟล์', async () => addFiles(await pickFiles({ accept: 'image/*,.heic,.pdf,application/pdf' })), { kind: 'primary', ic: 'image' }));
  dropZone(drop, addFiles);

  root.append(
    h('p.intro', 'ดึงตัวหนังสือจากภาพถ่ายเอกสาร ภาพหน้าจอ โปสเตอร์ หรือ PDF ที่เป็นภาพสแกน — อ่านในเครื่องคุณ ไม่ส่งภาพขึ้นอินเทอร์เน็ต (ครั้งแรกต้องโหลดตัวอ่านประมาณ 5 MB)'),
    step(1, 'เลือกภาพหรือ PDF',
      h('div.grid3',
        field('ภาษาในเอกสาร', select([['tha+eng', 'ไทย + อังกฤษ (แนะนำ)'], ['tha', 'ไทยอย่างเดียว'], ['eng', 'อังกฤษอย่างเดียว']], o.langs, (v) => (o.langs = v))),
        h('div.field', h('span.field-label', ' '), checkbox('จัดช่องว่างภาษาไทยให้อัตโนมัติ', o.tidy, (v) => (o.tidy = v))),
        h('div.field', h('span.field-label', ' '), checkbox('PDF: อ่านด้วย OCR เสมอ (แม้มีข้อความอยู่แล้ว)', o.forceOcr, (v) => (o.forceOcr = v)))),
      drop, prog.el),
    step(2, 'ผลลัพธ์', list,
      h('div.grid2', out.el), h('div.row', btn('บันทึกทั้งหมดเป็น .txt', exportAll, { ic: 'download' }))),
  );
}
