// สร้างไฟล์อีเมล .eml (เปิดใน Outlook / Apple Mail / Thunderbird เป็นฉบับร่างพร้อมส่ง)
// และลิงก์เปิดหน้าเขียนอีเมลของ Gmail / Outlook เว็บ / โปรแกรมอีเมลในเครื่อง

const enc = new TextEncoder();

function b64(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(s);
}
const wrap76 = (s) => s.replace(/.{1,76}/g, '$&\r\n').trimEnd();
const isAscii = (s) => /^[\x20-\x7e]*$/.test(s);

// หัวอีเมลภาษาไทย: แบ่งเป็นช่วง =?UTF-8?B?...?= ไม่เกินช่วงละ ~45 ไบต์ (ไม่ตัดกลางตัวอักษร)
export function encodeWord(text) {
  if (isAscii(text)) return text;
  const parts = [];
  let cur = '';
  for (const ch of text) {
    if (enc.encode(cur + ch).length > 45) { parts.push(cur); cur = ''; }
    cur += ch;
  }
  if (cur) parts.push(cur);
  return parts.map((p) => `=?UTF-8?B?${b64(enc.encode(p))}?=`).join('\r\n ');
}

// "ชื่อ <a@b.com>, c@d.com" → หัวอีเมลที่เข้ารหัสแล้ว
export function encodeAddressList(list) {
  return String(list || '').split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean).map((a) => {
    const m = a.match(/^(.*)<([^>]+)>$/);
    if (!m) return a;
    const name = m[1].trim().replace(/^"|"$/g, '');
    return name ? `${isAscii(name) ? `"${name}"` : encodeWord(name)} <${m[2].trim()}>` : m[2].trim();
  }).join(', ');
}

export const splitEmails = (s) => String(s || '').split(/[,;\s]+/).map((x) => x.trim()).filter((x) => /.+@.+\..+/.test(x));

/**
 * attachments: [{ name, type, data: Uint8Array }]
 * draft: true → ใส่ X-Unsent: 1 ให้ Outlook เปิดเป็นฉบับร่างที่กดส่งได้ทันที
 */
export function buildEml({ from = '', to = '', cc = '', bcc = '', subject = '', text = '', attachments = [], draft = true }) {
  const boundary = 'mhub_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  const head = [
    'MIME-Version: 1.0',
    'Date: ' + new Date().toUTCString().replace('GMT', '+0000'),
    from && 'From: ' + encodeAddressList(from),
    'To: ' + encodeAddressList(to),
    cc && 'Cc: ' + encodeAddressList(cc),
    bcc && 'Bcc: ' + encodeAddressList(bcc),
    'Subject: ' + encodeWord(subject),
    draft && 'X-Unsent: 1',
  ].filter(Boolean);
  const body = wrap76(b64(enc.encode(String(text).replace(/\r?\n/g, '\r\n'))));
  if (!attachments.length) {
    return [...head, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', body, ''].join('\r\n');
  }
  const parts = [...head, `Content-Type: multipart/mixed; boundary="${boundary}"`, '', 'This is a multi-part message in MIME format.', '',
    '--' + boundary, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', body, ''];
  for (const a of attachments) {
    const fname = encodeURIComponent(a.name).replace(/['()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
    parts.push('--' + boundary,
      `Content-Type: ${a.type || 'application/octet-stream'}; name="${isAscii(a.name) ? a.name : encodeWord(a.name).replace(/\r\n /g, ' ')}"`,
      `Content-Disposition: attachment; filename*=UTF-8''${fname}`,
      'Content-Transfer-Encoding: base64', '', wrap76(b64(a.data)), '');
  }
  parts.push('--' + boundary + '--', '');
  return parts.join('\r\n');
}

export function gmailLink({ to = '', cc = '', subject = '', text = '' }) {
  const q = new URLSearchParams({ view: 'cm', fs: '1', to: splitEmails(to).join(','), su: subject, body: text });
  if (cc) q.set('cc', splitEmails(cc).join(','));
  return 'https://mail.google.com/mail/?' + q.toString();
}

export function outlookLink({ to = '', cc = '', subject = '', text = '' }) {
  const q = new URLSearchParams({ to: splitEmails(to).join(','), subject, body: text });
  if (cc) q.set('cc', splitEmails(cc).join(','));
  return 'https://outlook.office.com/mail/deeplink/compose?' + q.toString();
}

export function mailtoLink({ to = '', cc = '', subject = '', text = '' }) {
  const q = [`subject=${encodeURIComponent(subject)}`, `body=${encodeURIComponent(text)}`];
  if (cc) q.push('cc=' + encodeURIComponent(splitEmails(cc).join(',')));
  return `mailto:${splitEmails(to).join(',')}?${q.join('&')}`;
}

// CSV (มี BOM ให้ Excel อ่านภาษาไทยถูก) สำหรับใช้กับ Mail Merge ของ Gmail / Outlook
export function toCsv(rows, headers) {
  const esc = (v) => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return '﻿' + [headers.map(esc).join(','), ...rows.map((r) => headers.map((k) => esc(r[k])).join(','))].join('\r\n');
}
