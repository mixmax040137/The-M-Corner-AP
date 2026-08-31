/**
 * Debt.gs — บัญชีหนี้หลัก (รายการสรุปรวม) และหนี้รอง (หนี้สิน)
 *
 * โครงคิด:
 *   Debts        = ก้อนหนี้ (ยอดตั้งต้น)
 *   DebtPayments = รายการโอนใช้หนี้แต่ละครั้ง
 *
 *   ยอดหนี้ทั้งหมด = ผลรวม principal ของก้อนหนี้ในบัญชีนั้น
 *   ชำระแล้ว      = ผลรวมรายการชำระ "เงินต้น" (ดอกเบี้ย/ค่าธรรมเนียมไม่ลดเงินต้น)
 *   คงเหลือ       = ยอดหนี้ทั้งหมด - ชำระแล้ว
 */

var LEDGER_MAIN = 'หนี้หลัก';
var LEDGER_SUB = 'หนี้รอง';

function listDebts_(ledger) {
  var rows = readRows_(SHEETS.DEBTS);
  if (ledger) rows = rows.filter(function (d) { return d.ledger === ledger; });
  return rows;
}

function listDebtPayments_(ledger, year) {
  var rows = readRows_(SHEETS.DEBT_PAYMENTS);
  if (ledger) rows = rows.filter(function (p) { return p.ledger === ledger; });
  if (year && year !== 'all') {
    rows = rows.filter(function (p) { return String(p.year || yearOf_(p.payDate)) === String(year); });
  }
  rows.sort(function (a, b) { return String(b.payDate).localeCompare(String(a.payDate)); });
  return rows.map(function (p) {
    p.slipRefs = toFileRefs_(p.slips);
    return p;
  });
}

/**
 * สรุปยอดของบัญชีหนี้หนึ่งบัญชี
 * @param {string} ledger 'หนี้หลัก' | 'หนี้รอง'
 * @param {string|number} year ปี ค.ศ. หรือ 'all'
 */
function debtSummary_(ledger, year) {
  var debts = listDebts_(ledger);
  var allPayments = listDebtPayments_(ledger, 'all');

  var totalDebt = sum_(debts, function (d) { return d.principal; });
  var principalPaid = sum_(allPayments.filter(isPrincipal_), function (p) { return p.amount; });
  var interestPaid = sum_(allPayments.filter(function (p) { return p.kind === 'ดอกเบี้ย'; }), function (p) { return p.amount; });
  var feePaid = sum_(allPayments.filter(function (p) { return p.kind === 'ค่าธรรมเนียม'; }), function (p) { return p.amount; });
  var remaining = totalDebt - principalPaid;
  var percent = totalDebt > 0 ? Math.min(100, (principalPaid / totalDebt) * 100) : 0;

  // แยกตามปี
  var byYearMap = {};
  allPayments.forEach(function (p) {
    var y = p.year || yearOf_(p.payDate);
    if (!y) return;
    if (!byYearMap[y]) byYearMap[y] = { year: Number(y), principal: 0, interest: 0, fee: 0, count: 0 };
    var amt = toNumber_(p.amount) || 0;
    if (isPrincipal_(p)) byYearMap[y].principal += amt;
    else if (p.kind === 'ดอกเบี้ย') byYearMap[y].interest += amt;
    else byYearMap[y].fee += amt;
    byYearMap[y].count++;
  });
  var byYear = Object.keys(byYearMap)
    .map(function (k) { return byYearMap[k]; })
    .sort(function (a, b) { return b.year - a.year; });

  // ยอดสะสมย้อนหลัง (ไว้วาดกราฟความคืบหน้า)
  var asc = byYear.slice().sort(function (a, b) { return a.year - b.year; });
  var run = 0;
  asc.forEach(function (y) { run += y.principal; y.cumulative = round2_(run); });

  // ความคืบหน้ารายก้อนหนี้ (เฉลี่ยตามสัดส่วนยอดตั้งต้น เมื่อไม่ได้ผูก debtId)
  var perDebt = debts.map(function (d) {
    var direct = sum_(allPayments.filter(function (p) {
      return isPrincipal_(p) && String(p.debtId) === String(d.id);
    }), function (p) { return p.amount; });
    var unlinked = sum_(allPayments.filter(function (p) {
      return isPrincipal_(p) && !String(p.debtId || '').trim();
    }), function (p) { return p.amount; });
    var share = totalDebt > 0 ? (toNumber_(d.principal) || 0) / totalDebt : 0;
    var paid = round2_(direct + unlinked * share);
    var principal = toNumber_(d.principal) || 0;
    return {
      id: d.id, title: d.title, creditor: d.creditor, ledger: d.ledger,
      startDate: d.startDate, status: d.status, note: d.note,
      interestPerMonth: d.interestPerMonth, dueDay: d.dueDay, planPerMonth: d.planPerMonth,
      principal: principal,
      paid: Math.min(paid, principal),
      remaining: round2_(Math.max(0, principal - paid)),
      percent: principal > 0 ? Math.min(100, (paid / principal) * 100) : 0,
      estimatedShare: !String(d.id) ? false : true
    };
  });

  // ประมาณการปิดหนี้จากอัตราชำระ 12 เดือนล่าสุด
  var forecast = forecastPayoff_(allPayments, remaining);

  var yearFiltered = (year && year !== 'all')
    ? allPayments.filter(function (p) { return String(p.year || yearOf_(p.payDate)) === String(year); })
    : allPayments;

  return {
    ledger: ledger,
    totalDebt: round2_(totalDebt),
    paid: round2_(principalPaid),
    remaining: round2_(remaining),
    percent: round2_(percent),
    interestPaid: round2_(interestPaid),
    feePaid: round2_(feePaid),
    paymentCount: allPayments.length,
    years: byYear.map(function (y) { return y.year; }),
    byYear: byYear,
    debts: perDebt,
    forecast: forecast,
    selectedYear: year || 'all',
    selectedYearPaid: round2_(sum_(yearFiltered.filter(isPrincipal_), function (p) { return p.amount; })),
    selectedYearInterest: round2_(sum_(yearFiltered.filter(function (p) { return p.kind === 'ดอกเบี้ย'; }), function (p) { return p.amount; })),
    selectedYearCount: yearFiltered.length
  };
}

function isPrincipal_(p) {
  return !p.kind || p.kind === 'เงินต้น';
}

/** ประเมินว่าอีกกี่เดือนจะปิดหนี้ จากค่าเฉลี่ยการชำระ 12 เดือนล่าสุด */
function forecastPayoff_(payments, remaining) {
  if (remaining <= 0) return { monthsLeft: 0, avgPerMonth: 0, payoffDate: '' };
  var cutoff = addMonths_(new Date(), -12);
  var recent = payments.filter(function (p) {
    if (!isPrincipal_(p)) return false;
    var d = toDate_(p.payDate);
    return d && cutoff && d >= cutoff;
  });
  var total = sum_(recent, function (p) { return p.amount; });
  var avg = total / 12;
  if (avg <= 0) return { monthsLeft: null, avgPerMonth: 0, payoffDate: '' };
  var months = Math.ceil(remaining / avg);
  return {
    monthsLeft: months,
    avgPerMonth: round2_(avg),
    payoffDate: toIsoDate_(addMonths_(new Date(), months))
  };
}

/* ---------- CRUD ---------- */

function saveDebt_(obj) {
  var now = new Date();
  if (obj.id) {
    var found = findRow_(SHEETS.DEBTS, obj.id);
    if (found) {
      var merged = Object.assign({}, found, obj, { updatedAt: now });
      logActivity_('แก้ไขก้อนหนี้', obj.id, obj.title);
      return updateRow_(SHEETS.DEBTS, found._row, merged);
    }
  }
  obj.id = obj.id || uid_('DEBT');
  obj.updatedAt = now;
  logActivity_('เพิ่มก้อนหนี้', obj.id, obj.title);
  return insertRow_(SHEETS.DEBTS, obj);
}

function deleteDebt_(id) {
  var found = findRow_(SHEETS.DEBTS, id);
  if (!found) throw new Error('ไม่พบก้อนหนี้: ' + id);
  deleteRow_(SHEETS.DEBTS, found._row);
  logActivity_('ลบก้อนหนี้', id, found.title);
  return true;
}

function saveDebtPayment_(obj) {
  var now = new Date();
  obj.year = yearOf_(obj.payDate) || obj.year || new Date().getFullYear();
  obj.kind = obj.kind || 'เงินต้น';
  obj.ledger = obj.ledger || LEDGER_MAIN;

  if (obj.id) {
    var found = findRow_(SHEETS.DEBT_PAYMENTS, obj.id);
    if (found) {
      var merged = Object.assign({}, found, obj, { updatedAt: now });
      logActivity_('แก้ไขรายการชำระหนี้', obj.id, obj.amount);
      return updateRow_(SHEETS.DEBT_PAYMENTS, found._row, merged);
    }
  }
  obj.id = obj.id || uid_('PAY');
  obj.updatedAt = now;
  logActivity_('เพิ่มรายการชำระหนี้', obj.id, obj.ledger + ' ' + obj.amount);
  return insertRow_(SHEETS.DEBT_PAYMENTS, obj);
}

function deleteDebtPayment_(id) {
  var found = findRow_(SHEETS.DEBT_PAYMENTS, id);
  if (!found) throw new Error('ไม่พบรายการชำระ: ' + id);
  deleteRow_(SHEETS.DEBT_PAYMENTS, found._row);
  logActivity_('ลบรายการชำระหนี้', id, found.amount);
  return true;
}
