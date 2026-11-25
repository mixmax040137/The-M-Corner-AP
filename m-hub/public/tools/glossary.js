// เครื่องมือ: คลังคำแปลประจำหน่วยงาน + แปลข้อความด้วยคลังคำ / Workers AI
import { h, btn, field, select, step, toast, text, debounce, pickFiles, download, copyText, confirmBox } from '../core/ui.js';
import { readGrid, loadXLSX } from '../core/data.js';
import { CATEGORIES, DEFAULT_TERMS, loadGlossary, saveGlossary, compileGlossary, applyGlossary, aiTranslate, hasThai, onGlossaryChange } from '../core/glossary.js';

export async function mount(root) {
  let terms = (await loadGlossary()).map((x) => ({ ...x }));
  let q = '', cat = '';
  const save = debounce(async () => { await saveGlossary(terms); count.textContent = `${terms.length} คำ`; }, 400);
  const count = h('span.muted.small', `${terms.length} คำ`);
  const tableWrap = h('div.table-wrap', { style: { maxHeight: '480px' } });

  function render() {
    const shown = terms.map((t, i) => [t, i]).filter(([t]) => (!cat || t.cat === cat) && (!q || t.th.includes(q) || t.en.toLowerCase().includes(q.toLowerCase())));
    tableWrap.replaceChildren(h('table.table',
      h('thead', h('tr', h('th', 'ภาษาไทย'), h('th', 'English'), h('th', 'หมวด'), h('th', ''))),
      h('tbody', shown.map(([t, i]) => h('tr',
        h('td', h('input', { type: 'text', value: t.th, 'aria-label': 'ภาษาไทย', oninput: (e) => { t.th = e.target.value; save(); } })),
        h('td', h('input', { type: 'text', value: t.en, 'aria-label': 'English', oninput: (e) => { t.en = e.target.value; save(); } })),
        h('td', select(CATEGORIES, t.cat, (v) => { t.cat = v; save(); })),
        h('td', btn('', () => { terms.splice(i, 1); save(); render(); }, { ic: 'trash', kind: 'icon-only sm', title: 'ลบคำนี้' })))))));
    if (!shown.length) tableWrap.append(h('div.muted', { style: { padding: '12px' } }, 'ไม่พบคำที่ค้นหา'));
  }

  async function importFile(file) {
    try {
      const [sheet] = await readGrid(file);
      let added = 0, updated = 0;
      for (const row of sheet.grid) {
        const [th, en, c] = row.map((x) => String(x ?? '').trim());
        if (!th || !en || /^(ภาษาไทย|ไทย|thai)$/i.test(th)) continue;
        const ex = terms.find((t) => t.th === th);
        if (ex) { ex.en = en; if (c) ex.cat = CATEGORIES.includes(c) ? c : ex.cat; updated++; }
        else { terms.push({ th, en, cat: CATEGORIES.includes(c) ? c : 'คำทั่วไป' }); added++; }
      }
      await saveGlossary(terms);
      render();
      count.textContent = `${terms.length} คำ`;
      toast(`นำเข้าแล้ว: เพิ่ม ${added} คำ · อัปเดต ${updated} คำ`, 'ok');
    } catch (e) { toast('นำเข้าไม่ได้: ' + e.message, 'error'); }
  }

  async function exportXlsx() {
    const XLSX = await loadXLSX();
    const ws = XLSX.utils.aoa_to_sheet([['ภาษาไทย', 'English', 'หมวด'], ...terms.map((t) => [t.th, t.en, t.cat])]);
    ws['!cols'] = [{ wch: 40 }, { wch: 45 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'คลังคำแปล');
    download(new Blob([XLSX.write(wb, { type: 'array', bookType: 'xlsx' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'คลังคำแปล.xlsx');
  }

  // ---------- ช่องแปลข้อความ ----------
  const input = h('textarea', { rows: 7, placeholder: 'วางข้อความภาษาไทย เช่น ชื่อโครงการ ตำแหน่ง หรือย่อหน้าข่าว' });
  const output = h('textarea', { rows: 7, placeholder: 'ผลลัพธ์ภาษาอังกฤษ' });
  const status = h('div.hint');
  const pairs = () => compileGlossary(terms);
  const byGlossary = () => {
    const r = input.value.split('\n').map((l) => applyGlossary(l, pairs())).join('\n');
    output.value = r;
    const left = (r.match(/[฀-๿]+/g) || []).length;
    status.textContent = left ? `ยังเหลือคำไทย ${left} ช่วง — กด “แปลด้วย AI ฟรี” หรือเพิ่มคำลงคลัง` : 'แปลครบด้วยคลังคำ (ไม่ใช้ AI)';
  };
  const aiBtn = btn('แปลด้วย AI ฟรี (Cloudflare)', async () => {
    if (!hasThai(input.value)) return toast('ไม่มีข้อความภาษาไทย', 'warn');
    aiBtn.disabled = true; status.textContent = 'กำลังแปล…';
    try {
      const lines = input.value.split('\n');
      output.value = (await aiTranslate(lines, pairs())).join('\n');
      status.textContent = 'แปลแล้ว — ตรวจทานก่อนใช้งานทุกครั้ง';
    } catch (e) { status.textContent = ''; toast('แปลไม่สำเร็จ: ' + e.message, 'error'); }
    finally { aiBtn.disabled = false; }
  }, { ic: 'sparkles', kind: 'primary' });

  onGlossaryChange((list) => { if (list !== terms) { terms = list.map((x) => ({ ...x })); render(); } });
  render();

  root.append(
    h('p.intro', 'เก็บชื่อหน่วยงาน ตำแหน่ง หลักสูตร และคำเฉพาะ ไทย ↔ อังกฤษ ไว้ที่เดียว เครื่องมือ “ร่างอีเมลประกาศ” และการแปลทุกจุดจะใช้คำเหล่านี้ก่อน AI เสมอ ชื่อเฉพาะจึงสะกดตรงกันทุกครั้ง'),
    step(1, 'แปลข้อความ',
      h('div.grid2', field('ภาษาไทย', input), field('English', output)),
      h('div.row.wrap', btn('แปลด้วยคลังคำ (ไม่ใช้ AI)', byGlossary, { ic: 'languages' }), aiBtn, btn('คัดลอกผลลัพธ์', () => copyText(output.value), { ic: 'copy', kind: 'ghost' })),
      status),
    step(2, h('span', 'คำในคลัง ', count),
      h('div.row.wrap',
        h('div', { style: { flex: '1', minWidth: '200px' } }, text('', (v) => { q = v.trim(); render(); }, { placeholder: 'ค้นหาคำ…', 'aria-label': 'ค้นหาคำ' })),
        select([['', 'ทุกหมวด'], ...CATEGORIES], cat, (v) => { cat = v; render(); }),
        btn('เพิ่มคำ', () => { terms.unshift({ th: '', en: '', cat: cat || 'คำทั่วไป' }); q = ''; render(); tableWrap.querySelector('input')?.focus(); }, { ic: 'plus', kind: 'primary' })),
      tableWrap,
      h('div.row.wrap',
        btn('นำเข้าจาก Excel / CSV', async () => { const [f] = await pickFiles({ accept: '.xlsx,.xls,.csv', multiple: false }); if (f) importFile(f.file); }, { ic: 'upload' }),
        btn('ส่งออก Excel', exportXlsx, { ic: 'download' }),
        btn('คืนค่าเริ่มต้น', async () => {
          if (!(await confirmBox('ลบคำที่เพิ่ม/แก้เองทั้งหมด แล้วกลับไปใช้คำเริ่มต้น?', { ok: 'คืนค่าเริ่มต้น', danger: true }))) return;
          terms = DEFAULT_TERMS.map((x) => ({ ...x }));
          await saveGlossary(terms); render(); count.textContent = `${terms.length} คำ`;
        }, { kind: 'ghost' })),
      h('div.hint', 'ไฟล์นำเข้า: คอลัมน์ A = ภาษาไทย, B = English, C = หมวด (ไม่บังคับ) · คำที่มีอยู่แล้วจะถูกอัปเดต')),
  );
}
