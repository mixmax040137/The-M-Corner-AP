/**
 * Auth.gs — สิทธิ์เข้าใช้งานแบบลิงก์
 *
 * ระบบถูก deploy แบบ "ใครมีลิงก์ก็เปิดได้" (Anyone) เพื่อให้แชร์ให้คนอื่นดูได้
 * โดยไม่ต้องให้เขาเข้าถึง Google Sheet ของเรา สิทธิ์จึงคุมด้วย "กุญแจ" ในลิงก์แทน
 *
 *   ลิงก์ผู้ดูแล  .../exec?key=<admin_token>   → เพิ่ม/แก้/ลบได้ทุกอย่าง
 *   ลิงก์แชร์     .../exec?key=<view_token>    → ดูอย่างเดียว แก้อะไรไม่ได้
 *   ไม่มีกุญแจ                                  → เข้าไม่ได้
 *
 * กุญแจสองชุดนี้สุ่มขึ้นตอนติดตั้ง เก็บอยู่ในชีต Settings
 * ถ้าลิงก์แชร์หลุด ให้กด "ออกกุญแจแชร์ใหม่" ลิงก์เดิมจะใช้ไม่ได้ทันที
 *
 * ⚠️ การกันสิทธิ์ทำที่ฝั่งเซิร์ฟเวอร์ (ฟังก์ชัน api) ไม่ใช่แค่ซ่อนปุ่มในหน้าเว็บ
 */

var ROLE = { ADMIN: 'admin', VIEWER: 'viewer', NONE: 'none' };

/** คำสั่งที่เปลี่ยนแปลงข้อมูล — ต้องเป็นผู้ดูแลเท่านั้น */
var MUTATING_ACTIONS = /\.(save|delete|savePayment|deletePayment|bulkBook|import|send|rotateToken|backupNow)$/;

function resolveRole_(key) {
  key = String(key || '').trim();
  if (key) {
    if (key === getSetting_('admin_token', '')) return ROLE.ADMIN;
    if (key === getSetting_('view_token', '')) return ROLE.VIEWER;
  }
  // เจ้าของชีต (หรืออีเมลที่อนุญาตไว้) เข้าได้เสมอ แม้ไม่มีกุญแจในลิงก์
  var email = String(currentUserEmail_() || '').toLowerCase();
  if (email && email !== 'unknown') {
    if (email === String(ownerEmail_() || '').toLowerCase()) return ROLE.ADMIN;
    var allow = String(getSetting_('admin_emails', '') || '')
      .split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(String);
    if (allow.indexOf(email) >= 0) return ROLE.ADMIN;
  }
  return ROLE.NONE;
}

function requireRole_(action, key) {
  var role = resolveRole_(key);
  if (role === ROLE.NONE) {
    throw new Error('ลิงก์นี้ไม่มีสิทธิ์เข้าใช้งาน — ขอลิงก์ที่ถูกต้องจากเจ้าของหอพัก');
  }
  if (MUTATING_ACTIONS.test(action) && role !== ROLE.ADMIN) {
    throw new Error('ลิงก์นี้เป็นแบบดูอย่างเดียว จึงแก้ไขข้อมูลไม่ได้');
  }
  return role;
}

function currentUserEmail_() {
  try { return Session.getActiveUser().getEmail() || ''; }
  catch (e) { return ''; }
}

function ownerEmail_() {
  try {
    var o = getSpreadsheet_().getOwner();
    if (o) return o.getEmail();
  } catch (e) { /* ชีตใน Shared Drive ไม่มีเจ้าของรายบุคคล */ }
  try { return Session.getEffectiveUser().getEmail(); } catch (e2) { return ''; }
}

/** สุ่มกุญแจใหม่ (ตัวอักษรที่อ่านง่าย ไม่มี 0/O/1/l ปนกัน) */
function newToken_(len) {
  var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz';
  var out = '';
  for (var i = 0; i < (len || 22); i++) out += abc.charAt(Math.floor(Math.random() * abc.length));
  return out;
}

/** สร้างกุญแจตอนติดตั้ง ถ้ายังไม่มี */
function ensureTokens_() {
  var made = [];
  [['admin_token', 26], ['view_token', 22]].forEach(function (pair) {
    if (!getSetting_(pair[0], '')) {
      setSetting_(pair[0], newToken_(pair[1]));
      made.push(pair[0]);
    }
  });
  return made;
}

/** ออกกุญแจแชร์ชุดใหม่ — ลิงก์แชร์เดิมจะใช้ไม่ได้ทันที */
function rotateViewToken_() {
  var t = newToken_(22);
  setSetting_('view_token', t);
  logActivity_('ออกกุญแจแชร์ใหม่', 'view_token', '');
  return { token: t, url: shareUrl_(t) };
}

/**
 * URL ของเว็บแอป
 *   ลงท้าย /exec = deploy แล้ว ใช้ได้กับทุกคน แชร์ได้
 *   ลงท้าย /dev  = ยังไม่ได้ deploy เป็นเวอร์ชัน ใช้ได้เฉพาะเจ้าของสคริปต์ แชร์ไม่ได้
 */
function webAppUrl_() {
  try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; }
}

function isTestUrl_(url) {
  return /\/dev(\?|$)/.test(String(url || ''));
}

function shareUrl_(token) {
  var base = webAppUrl_();
  return base ? base + '?key=' + token : '(ยังไม่ได้ deploy)';
}

/** ใช้ในหน้าเว็บ เพื่อรู้ว่ากำลังเปิดด้วยสิทธิ์อะไร */
function whoAmI(key) {
  var role = resolveRole_(key);
  return {
    role: role,
    canEdit: role === ROLE.ADMIN,
    email: currentUserEmail_() || 'ผู้ใช้ผ่านลิงก์',
    label: role === ROLE.ADMIN ? 'ผู้ดูแล' : (role === ROLE.VIEWER ? 'ดูอย่างเดียว' : 'ไม่มีสิทธิ์')
  };
}
