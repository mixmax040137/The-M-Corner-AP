/** ส่งออกข้อมูลตั้งต้น + โครงสร้างคอลัมน์ เพื่อนำไปสร้างไฟล์ Google Sheet */
require('../test/mock-gas.js');
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = path.join(__dirname, '..', 'src');
['Config.gs','Util.gs','Setup.gs','Auth.gs','Drive.gs','Seed.gs','Finance.gs','Backup.gs',
 'Debt.gs','Purchase.gs','Maintenance.gs','Building.gs','Dashboard.gs','Api.gs','Notify.gs']
  .forEach(f => vm.runInThisContext(fs.readFileSync(path.join(SRC, f), 'utf8'), { filename: f }));

setupSystem();
seedHistoricalData();

// กุญแจให้ระบบสุ่มเองตอนติดตั้งจริง ไม่ฝังมากับไฟล์
setSetting_('admin_token', '');
setSetting_('view_token', '');
DB_OUT = { order: Object.keys(SHEETS).map(k => SHEETS[k]), schema: {}, data: {} };
DB_OUT.order.forEach(n => {
  DB_OUT.schema[n] = SCHEMA[n].map(c => ({ key: c.key, label: c.label, type: c.type }));
  DB_OUT.data[n] = readRows_(n).map(r => { const o = {}; Object.keys(r).forEach(k => { if (k !== '_row') o[k] = r[k]; }); return o; });
});
fs.writeFileSync(path.join(__dirname, 'seed.json'), JSON.stringify(DB_OUT));
console.log(DB_OUT.order.map(n => n + '=' + DB_OUT.data[n].length).join(' '));
