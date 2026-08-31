/**
 * Auth.gs — ควบคุมสิทธิ์เข้าใช้งาน
 *
 * ระบบนี้ออกแบบมาให้ "ใช้งานคนเดียว" — เจ้าของชีตเข้าได้เสมอ ไม่ต้องตั้งค่าอะไร
 * และตอน Deploy ให้เลือก Who has access = Only myself
 *
 * ถ้าวันหนึ่งอยากให้คนอื่น (แม่บ้าน/ช่าง) เข้าได้ ค่อยตั้ง Script Property
 *   ALLOWED_EMAILS = a@gmail.com,b@gmail.com
 * แล้วเปลี่ยน Who has access เป็น Anyone with Google account
 */

function isAllowed_() {
  var email = currentUserEmail_();
  var owner = ownerEmail_();
  if (owner && email && email.toLowerCase() === owner.toLowerCase()) return true;

  var raw = props_().getProperty(PROP.ALLOWED_EMAILS) || '';
  if (!raw.trim()) return !!(owner && email && email.toLowerCase() === owner.toLowerCase());

  var list = raw.split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(String);
  if (list.indexOf('*') >= 0) return true;
  return list.indexOf(String(email).toLowerCase()) >= 0;
}

function ownerEmail_() {
  try {
    var ss = getSpreadsheet_();
    var o = ss.getOwner();
    return o ? o.getEmail() : '';
  } catch (e) {
    try { return Session.getEffectiveUser().getEmail(); } catch (e2) { return ''; }
  }
}

function requireAccess_() {
  if (!isAllowed_()) {
    throw new Error('ไม่มีสิทธิ์เข้าใช้งานระบบนี้ (' + currentUserEmail_() + ')');
  }
}

/** ใช้ในหน้าเว็บ เพื่อรู้ว่าใครกำลังใช้งาน */
function whoAmI() {
  return {
    email: currentUserEmail_(),
    allowed: isAllowed_(),
    owner: ownerEmail_()
  };
}
