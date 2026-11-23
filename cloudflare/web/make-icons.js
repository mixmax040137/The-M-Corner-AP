/* สร้างไอคอน PNG จาก icon.svg ด้วย Chromium (รันครั้งเดียวตอนเปลี่ยนไอคอน: node cloudflare/web/make-icons.js) */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const svg = fs.readFileSync(path.join(__dirname, 'icon.svg'), 'utf8');
  const browser = await chromium.launch();
  for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent('<style>html,body{margin:0;background:#1f2a44}</style>' + svg.replace('<svg ', `<svg width="${size}" height="${size}" `));
    await page.screenshot({ path: path.join(__dirname, name), omitBackground: false });
    await page.close();
  }
  await browser.close();
  console.log('สร้างไอคอนแล้ว');
})();
