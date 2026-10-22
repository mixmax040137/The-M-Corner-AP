/**
 * Drive.gs — จัดการไฟล์แนบ (ภาพประกอบ / สลิปการโอน)
 *
 * โครงสร้างโฟลเดอร์:
 *   The M Corner AP - ไฟล์แนบ/
 *     ├── รายการซื้อของ/
 *     ├── สลิปโอนใช้หนี้/
 *     ├── ล้างแอร์/
 *     ├── ซ่อมแซมห้อง/
 *     └── ซ่อมแซมตึก/
 */

var DRIVE_SUBFOLDERS = {
  purchases: 'รายการซื้อของ',
  debt: 'สลิปโอนใช้หนี้',
  ac: 'ล้างแอร์',
  roomRepair: 'ซ่อมแซมห้อง',
  building: 'ซ่อมแซมตึก',
  misc: 'อื่น ๆ'
};

function ensureDriveFolders_() {
  var id = props_().getProperty(PROP.DRIVE_FOLDER_ID);
  var root;
  if (id) {
    try { root = DriveApp.getFolderById(id); } catch (e) { root = null; }
  }
  if (!root) {
    var name = APP.NAME + ' - ไฟล์แนบ';
    var it = DriveApp.getFoldersByName(name);
    root = it.hasNext() ? it.next() : DriveApp.createFolder(name);
    props_().setProperty(PROP.DRIVE_FOLDER_ID, root.getId());
  }
  Object.keys(DRIVE_SUBFOLDERS).forEach(function (k) {
    subFolder_(root, DRIVE_SUBFOLDERS[k]);
  });
  return root;
}

function subFolder_(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function folderFor_(bucket) {
  var root = ensureDriveFolders_();
  return subFolder_(root, DRIVE_SUBFOLDERS[bucket] || DRIVE_SUBFOLDERS.misc);
}

/**
 * อัปโหลดไฟล์จากหน้าเว็บ
 * @param {{bucket:string, files:Array<{name:string, mimeType:string, dataUrl:string}>}} payload
 * @return {Array<{id:string,name:string,url:string,thumb:string}>}
 */
var UPLOAD_MAX_BYTES = 12 * 1024 * 1024;   // ให้ตรงกับที่หน้าเว็บกันไว้
var UPLOAD_MAX_FILES = 20;

/**
 * ดูชนิดไฟล์จาก "เนื้อไฟล์" (ไบต์แรก ๆ) ไม่เชื่อชื่อหรือชนิดที่หน้าเว็บบอกมา
 * ไฟล์แนบถูกแชร์แบบใครมีลิงก์ก็เปิดได้ ถ้ารับทุกชนิด คนที่มีสิทธิ์แก้ไข
 * จะอัปโหลดหน้าเว็บหลอก/ไฟล์อันตรายไปฝากไว้ใน Drive ของเจ้าของหอ แล้วส่งลิงก์ต่อได้
 * รับเฉพาะรูปกับ PDF (สลิป ใบเสร็จ ภาพประกอบ) · คืน mime ที่ถูกต้อง หรือ '' ถ้าไม่รับ
 */
function sniffUpload_(bytes) {
  var b = [];
  for (var i = 0; i < Math.min(16, bytes.length); i++) b.push(bytes[i] & 0xff);
  var ascii = function (from, to) { return String.fromCharCode.apply(null, b.slice(from, to)); };
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && ascii(1, 4) === 'PNG') return 'image/png';
  if (ascii(0, 4) === 'GIF8') return 'image/gif';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (ascii(0, 5) === '%PDF-') return 'application/pdf';
  if (ascii(0, 2) === 'BM') return 'image/bmp';
  if (ascii(4, 8) === 'ftyp' && /^(heic|heix|hevc|heim|heis|mif1|msf1|avif)$/.test(ascii(8, 12))) {
    return ascii(8, 12) === 'avif' ? 'image/avif' : 'image/heic';
  }
  return '';
}

function uploadFiles_(payload) {
  var bucket = (payload && payload.bucket) || 'misc';
  var files = ((payload && payload.files) || []).filter(function (f) { return f && f.dataUrl; });
  if (files.length > UPLOAD_MAX_FILES) throw new Error('แนบได้ครั้งละไม่เกิน ' + UPLOAD_MAX_FILES + ' ไฟล์');

  // ตรวจครบทุกไฟล์ก่อน ค่อยสร้างไฟล์จริง — ไม่ให้เหลือไฟล์ครึ่ง ๆ กลาง ๆ ถ้ามีไฟล์หนึ่งไม่ผ่าน
  var ready = files.map(function (f) {
    var base64 = String(f.dataUrl).indexOf(',') >= 0
      ? String(f.dataUrl).split(',')[1]
      : String(f.dataUrl);
    var bytes = Utilities.base64Decode(base64);
    var name = String(f.name || 'file');
    if (bytes.length > UPLOAD_MAX_BYTES) throw new Error('ไฟล์ใหญ่เกิน 12 MB: ' + name);
    var mime = sniffUpload_(bytes);
    if (!mime) throw new Error('แนบได้เฉพาะรูปภาพ (JPG PNG WEBP HEIC GIF) หรือ PDF — ไฟล์นี้ใช้ไม่ได้: ' + name);
    return { bytes: bytes, mime: mime, name: name };
  });

  var folder = folderFor_(bucket);
  var out = [];
  ready.forEach(function (f) {
    var safeName = f.name
      .replace(/[\\/:*?"<>|]/g, '_')
      .slice(0, 90);
    var stamped = Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyyMMdd-HHmmss') + '-' + safeName;
    var blob = Utilities.newBlob(f.bytes, f.mime, stamped);
    var file = folder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) { /* Shared Drive บางประเภทตั้งไม่ได้ — ข้ามไป */ }
    out.push(fileInfo_(file));
  });
  return out;
}

function fileInfo_(file) {
  var id = file.getId();
  return {
    id: id,
    name: file.getName(),
    url: 'https://drive.google.com/file/d/' + id + '/view',
    thumb: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w600',
    mime: file.getMimeType()
  };
}

/** แปลง URL/ID ที่เก็บในชีต ให้เป็นข้อมูลพร้อมแสดงผล */
function toFileRefs_(list) {
  return splitList_(list).map(function (raw) {
    var id = extractDriveId_(raw);
    // ลิงก์อื่นที่ไม่ใช่ไฟล์ Drive รับเฉพาะ https — กัน javascript: ที่ถูกพิมพ์ใส่ช่องไฟล์แนบ
    if (!id) return { id: '', name: raw, url: /^https:\/\//i.test(String(raw).trim()) ? String(raw).trim() : '', thumb: '' };
    return {
      id: id,
      name: '',
      url: 'https://drive.google.com/file/d/' + id + '/view',
      thumb: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w600'
    };
  });
}

function extractDriveId_(raw) {
  var s = String(raw || '').trim();
  if (!s) return '';
  var m = s.match(/\/d\/([a-zA-Z0-9_-]{20,})/) ||
          s.match(/[?&]id=([a-zA-Z0-9_-]{20,})/) ||
          s.match(/^([a-zA-Z0-9_-]{20,})$/);
  return m ? m[1] : '';
}

/**
 * ไฟล์นี้อยู่ในโฟลเดอร์ไฟล์แนบของระบบหรือไม่ (ไล่ขึ้นไปตามโฟลเดอร์แม่)
 *
 * สคริปต์ทำงานด้วยสิทธิ์ของเจ้าของ เข้าถึง Drive ของเจ้าของได้ทั้งหมด
 * ถ้ารับรหัสไฟล์อะไรก็ได้ คนที่มีสิทธิ์แก้ไขจะลบไฟล์ส่วนตัวของเจ้าของทิ้ง
 * หรือส่งเอกสารส่วนตัวไปอ่านข้อความ (OCR) แล้วได้เนื้อหากลับไปได้
 * จึงยอมเฉพาะไฟล์ที่ระบบเป็นคนอัปโหลดไว้เอง
 */
function isAppFile_(file) {
  var rootId = props_().getProperty(PROP.DRIVE_FOLDER_ID);
  if (!rootId || !file || typeof file.getParents !== 'function') return false;
  var queue = [], seen = {};
  var it = file.getParents();
  while (it.hasNext()) queue.push({ f: it.next(), depth: 1 });
  while (queue.length) {
    var cur = queue.shift();
    var id = cur.f.getId();
    if (id === rootId) return true;
    if (seen[id] || cur.depth >= 6) continue;
    seen[id] = true;
    var up = cur.f.getParents();
    while (up.hasNext()) queue.push({ f: up.next(), depth: cur.depth + 1 });
  }
  return false;
}

/** เปิดไฟล์ของระบบตามรหัส — ไฟล์นอกโฟลเดอร์ไฟล์แนบถือว่าไม่มี */
function appFileById_(fileId) {
  var id = extractDriveId_(fileId) || String(fileId || '').trim();
  if (!id) throw new Error('ไม่พบไฟล์');
  var file;
  try { file = DriveApp.getFileById(id); } catch (e) { throw new Error('ไม่พบไฟล์'); }
  if (!isAppFile_(file)) throw new Error('ไฟล์นี้ไม่ได้อยู่ในโฟลเดอร์ไฟล์แนบของระบบ');
  return file;
}

/** ลบไฟล์ (ย้ายลงถังขยะ) — เฉพาะไฟล์แนบของระบบ */
function trashFile_(fileId) {
  var file = appFileById_(fileId);
  try { file.setTrashed(true); return true; }
  catch (e) { return false; }
}
