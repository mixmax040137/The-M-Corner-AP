/**
 * Ocr.gs — อ่านข้อความจากรูปที่แนบเข้ามา แล้วเดาค่าลงฟอร์มให้
 *
 * วิธีทำงาน: ส่งรูปเข้า Google Drive แบบสั่งให้แปลงเป็นเอกสาร (convert=true)
 * พร้อมเปิดโหมดอ่านตัวอักษร (ocr=true) — เป็นตัวอ่านตัวเดียวกับที่ Google Docs ใช้
 * อ่านข้อความออกมาแล้วลบไฟล์ชั่วคราวทิ้งทันที
 *
 * ⚠️ ค่าที่ได้เป็นแค่ "ข้อเสนอ" หน้าเว็บต้องให้ผู้ใช้ตรวจและแก้ได้เสมอ
 *    ตัวอ่านพลาดได้ โดยเฉพาะลายมือและรูปเอียง
 */

var OCR_ENDPOINT = 'https://www.googleapis.com/upload/drive/v2/files';

/**
 * @param {{dataUrl:string, fileId:string, mimeType:string, context:string}} p
 * @return {{text:string, lines:string[], guess:Object, engine:string}}
 */
function ocrRead_(p) {
  p = p || {};
  if (String(getSetting_('ocr_enabled', 'เปิด')).indexOf('เปิด') !== 0) {
    throw new Error('การอ่านข้อความจากรูปถูกปิดอยู่ — เปิดได้ในหน้าตั้งค่า');
  }

  var blob = ocrBlob_(p);
  if (!blob) throw new Error('ไม่พบรูปที่จะอ่าน');

  var mime = blob.getContentType() || '';
  if (!/^image\/|pdf$/.test(mime)) {
    throw new Error('อ่านได้เฉพาะไฟล์รูปภาพหรือ PDF เท่านั้น');
  }

  var text = ocrExtractText_(blob);
  var lines = ocrLines_(text);
  return {
    text: text,
    lines: lines,
    guess: ocrGuess_(lines, String(p.context || '')),
    engine: 'Google Drive OCR'
  };
}

/** หารูปจาก dataUrl ที่หน้าเว็บส่งมา หรือจากไฟล์ที่อัปโหลดไปแล้ว */
function ocrBlob_(p) {
  if (p.dataUrl) {
    var raw = String(p.dataUrl);
    var base64 = raw.indexOf(',') >= 0 ? raw.split(',')[1] : raw;
    var mime = p.mimeType || (raw.match(/^data:([^;,]+)/) || [])[1] || 'image/jpeg';
    return Utilities.newBlob(Utilities.base64Decode(base64), mime, 'ocr-temp');
  }
  if (p.fileId) {
    var id = extractDriveId_(p.fileId) || p.fileId;
    return DriveApp.getFileById(id).getBlob();
  }
  return null;
}

/**
 * เรียก Drive REST v2 ตรง ๆ ด้วย UrlFetchApp
 * ทำแบบนี้เพื่อไม่ต้องเปิดบริการเสริม Drive API ในหน้า Apps Script ให้ยุ่งยาก
 */
function ocrExtractText_(blob) {
  var lang = String(getSetting_('ocr_language', 'th') || 'th').slice(0, 5);
  var token = ScriptApp.getOAuthToken();
  var url = OCR_ENDPOINT + '?uploadType=media&convert=true&ocr=true&ocrLanguage=' +
            encodeURIComponent(lang);

  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: blob.getContentType(),
    payload: blob.getBytes(),
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });

  if (res.getResponseCode() >= 300) {
    throw new Error('อ่านรูปไม่สำเร็จ (' + res.getResponseCode() + ') — ลองใหม่อีกครั้ง');
  }

  var meta = JSON.parse(res.getContentText());
  var tempId = meta.id;
  try {
    var exportUrl = (meta.exportLinks && meta.exportLinks['text/plain']) ||
      'https://www.googleapis.com/drive/v2/files/' + tempId + '/export?mimeType=text/plain';
    var txt = UrlFetchApp.fetch(exportUrl, {
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });
    return txt.getResponseCode() < 300 ? txt.getContentText() : '';
  } finally {
    // ลบไฟล์ชั่วคราวเสมอ ไม่ให้ Drive รก แม้ขั้นตอนก่อนหน้าจะพัง
    try { DriveApp.getFileById(tempId).setTrashed(true); } catch (e) { /* ลบไม่ได้ก็ปล่อย */ }
  }
}

/* ------------------------------------------------------------------ */
/*  แปลงข้อความดิบเป็นค่าที่กรอกฟอร์มได้                                */
/* ------------------------------------------------------------------ */

function ocrLines_(text) {
  return String(text || '')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(function (l) { return l.replace(/\s+/g, ' ').trim(); })
    .filter(function (l) { return l.length > 0; });
}

/** เลขไทย ๐-๙ → 0-9 */
function thaiDigits_(s) {
  return String(s || '').replace(/[๐-๙]/g, function (c) {
    return String('๐๑๒๓๔๕๖๗๘๙'.indexOf(c));
  });
}

var TH_MONTHS = {
  'ม.ค': 1, 'มกราคม': 1, 'ก.พ': 2, 'กุมภาพันธ์': 2, 'มี.ค': 3, 'มีนาคม': 3,
  'เม.ย': 4, 'เมษายน': 4, 'พ.ค': 5, 'พฤษภาคม': 5, 'มิ.ย': 6, 'มิถุนายน': 6,
  'ก.ค': 7, 'กรกฎาคม': 7, 'ส.ค': 8, 'สิงหาคม': 8, 'ก.ย': 9, 'กันยายน': 9,
  'ต.ค': 10, 'ตุลาคม': 10, 'พ.ย': 11, 'พฤศจิกายน': 11, 'ธ.ค': 12, 'ธันวาคม': 12
};

/** คำที่มักอยู่ข้างหน้ายอดเงินจริง ๆ ในสลิป/ใบเสร็จ */
var AMOUNT_HINTS = /(จำนวนเงิน|ยอดเงิน|ยอดรวม|รวมทั้งสิ้น|รวมเงิน|รวม|สุทธิ|ราคา|total|amount|grand\s*total|net)/i;

/** คำที่บอกว่าเลขบรรทัดนั้นไม่ใช่ยอดเงิน */
var AMOUNT_SKIP = /(เลขที่|อ้างอิง|ref|no\.|บัญชี|โทร|tel|รหัส|barcode|เวลา|time|vat|ภาษี)/i;

/** ดึงตัวเลขเงินทั้งหมดในบรรทัด */
function ocrAmountsIn_(line) {
  var s = thaiDigits_(line);
  var out = [];
  var re = /(?:^|[^\d.,])(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+\.\d{2}|\d{3,})(?![\d.,]*%)/g;
  var m;
  while ((m = re.exec(s)) !== null) {
    var n = Number(m[1].replace(/,/g, ''));
    if (isFinite(n) && n > 0) out.push(n);
  }
  return out;
}

/** เดาวันที่จากข้อความ คืนรูปแบบ YYYY-MM-DD */
function ocrGuessDate_(lines) {
  var joined = thaiDigits_(lines.join(' \n '));

  // 1 ก.ย. 2569  /  1 กันยายน 2569
  var keys = Object.keys(TH_MONTHS).sort(function (a, b) { return b.length - a.length; });
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i].replace(/\./g, '\\.');
    var re = new RegExp('(\\d{1,2})\\s*' + key + '\\.?\\s*(\\d{2,4})');
    var m = joined.match(re);
    if (m) {
      var y = ocrNormYear_(Number(m[2]));
      return ocrIso_(y, TH_MONTHS[keys[i]], Number(m[1]));
    }
  }

  // 2026-09-01 — ต้องเช็คก่อนแบบ วัน/เดือน/ปี ไม่งั้น 2026-03-10 จะถูกอ่านเป็น 26-03-10
  var m3 = joined.match(/(?:^|[^\d])(\d{4})-(\d{1,2})-(\d{1,2})(?![\d])/);
  if (m3) return ocrIso_(Number(m3[1]), Number(m3[2]), Number(m3[3]));

  // 01/09/2569 · 01-09-2026 · 1.9.26
  var m2 = joined.match(/(?:^|[^\d])(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})(?![\d])/);
  if (m2) {
    var d = Number(m2[1]), mo = Number(m2[2]);
    if (mo > 12 && d <= 12) { var t = d; d = mo; mo = t; }   // เผื่อสลิปฝรั่งเขียน MM/DD
    if (d <= 31 && mo <= 12) return ocrIso_(ocrNormYear_(Number(m2[3])), mo, d);
  }

  return '';
}

/** พ.ศ. → ค.ศ. และปีสองหลัก → สี่หลัก */
function ocrNormYear_(y) {
  if (y > 2400) return y - 543;          // 2569 = พ.ศ. เต็ม → 2026
  if (y >= 1000) return y;               // 2026 = ค.ศ. อยู่แล้ว
  if (y >= 60) return 2500 + y - 543;    // 69 = พ.ศ. สองหลัก → 2026
  return 2000 + y;                       // 26 = ค.ศ. สองหลัก → 2026
}

function ocrIso_(y, m, d) {
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return '';
  return y + '-' + ('0' + m).slice(-2) + '-' + ('0' + d).slice(-2);
}

/** เดายอดเงิน — เอาบรรทัดที่มีคำใบ้ก่อน ถ้าไม่มีค่อยเอาเลขที่มากที่สุด */
function ocrGuessAmount_(lines) {
  var hinted = [];
  var all = [];

  lines.forEach(function (line) {
    if (AMOUNT_SKIP.test(line)) return;
    var nums = ocrAmountsIn_(line);
    if (!nums.length) return;
    all = all.concat(nums);
    if (AMOUNT_HINTS.test(line)) hinted = hinted.concat(nums);
  });

  var pick = hinted.length ? hinted : all;
  if (!pick.length) return null;

  // ยอดรวมมักเป็นตัวใหญ่สุดในกลุ่มที่เข้าข่าย
  return pick.reduce(function (a, b) { return b > a ? b : a; }, 0) || null;
}

/** เดาชื่อร้าน/ผู้ขาย — บรรทัดแรกที่เป็นตัวอักษรจริง ไม่ใช่เลขล้วน */
function ocrGuessVendor_(lines) {
  for (var i = 0; i < Math.min(lines.length, 6); i++) {
    var l = lines[i];
    if (l.length < 3 || l.length > 60) continue;
    if (/^[\d\s\-.,:/]+$/.test(thaiDigits_(l))) continue;
    if (/(ใบเสร็จ|ใบกำกับ|receipt|invoice|tax)/i.test(l)) continue;
    return l;
  }
  return '';
}

/** บรรทัดนี้เป็นวันที่ล้วน ๆ หรือเปล่า — จะได้ไม่นับเป็นรายการสินค้า */
function ocrLooksLikeDate_(s) {
  return /^\D{0,12}\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\D{0,12}$/.test(s);
}

/**
 * เดาชื่อรายการ — ใบเสร็จมักเขียน "ชื่อของ ... ราคา" โดยราคาอยู่ท้ายบรรทัด
 * จึงตัดเฉพาะตัวเลขท้ายบรรทัดออก ที่เหลือคือชื่อของ
 * (ตัดตัวเลขทุกตัวไม่ได้ เพราะ "ปั๊มน้ำ 750W" จะเหลือแค่ "ปั๊มน้ำ W")
 */
function ocrGuessItems_(lines) {
  var items = [];
  lines.forEach(function (line) {
    if (AMOUNT_SKIP.test(line) || AMOUNT_HINTS.test(line)) return;
    var s = thaiDigits_(line);
    if (ocrLooksLikeDate_(s)) return;

    var m = s.match(/(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+\.\d{2}|\d{3,})\s*(?:บาท|฿|THB)?\s*$/i);
    if (!m) return;

    var price = Number(m[1].replace(/,/g, ''));
    var name = s.slice(0, m.index)
      // ตัด "x2" ที่บอกจำนวนทิ้ง แต่ต้องไม่ไปกิน "2x1.5" ที่เป็นสเปกของสินค้า
      .replace(/(^|[^\d])[x×@]\s*\d{1,3}\s*$/i, '$1')
      .replace(/[\s:.\-]+$/, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (name.length >= 2 && name.length <= 60 && price > 0) {
      items.push({ name: name, price: price });
    }
  });
  return items.slice(0, 20);
}

/** เดาเลขที่อ้างอิง (สลิปโอนเงินมักมี) */
function ocrGuessRef_(lines) {
  for (var i = 0; i < lines.length; i++) {
    var m = thaiDigits_(lines[i]).match(/(?:เลขที่รายการ|เลขที่อ้างอิง|อ้างอิง|ref(?:erence)?(?:\s*no)?)[:\s.]*([A-Za-z0-9]{6,30})/i);
    if (m) return m[1];
  }
  return '';
}

/**
 * รวมทุกอย่างเป็นชุดค่าที่เอาไปเติมฟอร์มได้
 * @param {string} context ชื่อฟอร์มที่กำลังเปิดอยู่ เช่น 'purchase' | 'payment' | 'repair'
 */
function ocrGuess_(lines, context) {
  var amount = ocrGuessAmount_(lines);
  var date = ocrGuessDate_(lines);
  var vendor = ocrGuessVendor_(lines);
  var items = ocrGuessItems_(lines);
  var ref = ocrGuessRef_(lines);

  var g = {
    amount: amount,
    date: date,
    vendor: vendor,
    ref: ref,
    items: items,
    // ชื่อรายการที่แนะนำ — เอารายการที่แพงที่สุด ถ้าไม่มีก็ใช้ชื่อร้าน
    title: items.length
      ? items.reduce(function (a, b) { return b.price > a.price ? b : a; }).name
      : vendor
  };

  // แต่ละฟอร์มใช้ชื่อช่องไม่เหมือนกัน จับคู่ให้ตรงตั้งแต่ที่นี่
  if (context === 'payment') {
    g.fields = { payDate: date, principal: amount, note: ref ? 'อ้างอิง ' + ref : '' };
  } else if (context === 'purchase') {
    g.fields = { buyDate: date, item: g.title, price: amount, vendor: vendor };
  } else if (context === 'repair' || context === 'building' || context === 'ac') {
    g.fields = { doneDate: date, detail: g.title, cost: amount, vendor: vendor };
  } else {
    g.fields = { date: date, detail: g.title, amount: amount, vendor: vendor };
  }
  return g;
}
