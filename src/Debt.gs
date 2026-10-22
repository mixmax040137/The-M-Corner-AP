/**
 * Debt.gs — บัญชีหนี้หลัก (รายการสรุปรวม) และหนี้รอง (หนี้สิน)
 *
 * โครงคิด
 *   Debts        = ก้อนหนี้ (ยอดตั้งต้น)
 *   DebtPayments = รายการโอนใช้หนี้แต่ละครั้ง แยกเงินต้นกับดอกเบี้ย
 *
 * ก้อนหนี้ผูกกันเป็นแม่-ลูกได้ผ่านคอลัมน์ "เป็นส่วนหนึ่งของ" (parentId)
 * ใช้กับกรณีที่เงินก้อนหนึ่งเป็น "ทุน" ของอีกก้อน เช่น
 *
 *   ซื้อที่ดิน 4,700,000            ← ก้อนแม่
 *     └─ เงินยืมป้าตา 1,000,000     ← ก้อนลูก (เป็นส่วนหนึ่งของ 4.7 ล้านนั้น)
 *
 * กติกาที่ตามมา
 *   1. จ่ายคืนลูก 1 บาท = แม่ลดลง 1 บาทด้วย (ยอดชำระไหลขึ้นตามสายเสมอ)
 *   2. ยอดตั้งต้นของลูก "อยู่ใน" ยอดของแม่แล้ว ตอนรวมยอดทั้งระบบ
 *      จึงนับเฉพาะก้อนที่ไม่มีแม่ ไม่งั้นจะนับซ้ำ
 *   3. ดอกเบี้ยไม่ไหลขึ้น เพราะเป็นค่าใช้จ่าย ไม่ได้ลดเงินต้นของแม่
 */

var LEDGER_MAIN = 'หนี้หลัก';
var LEDGER_SUB = 'หนี้รอง';

/** บัญชีอื่นที่ก้อนนี้ไปแสดงด้วย ('' = ไม่มี) — ตั้งเป็นบัญชีเดียวกับตัวเองไม่มีผล */
function sharedLedger_(d) {
  var also = String((d && d.alsoIn) || '').trim();
  return also && also !== d.ledger && (also === LEDGER_MAIN || also === LEDGER_SUB) ? also : '';
}

/** ก้อนหนี้นี้แสดงในหน้าของบัญชีนี้หรือไม่ (บัญชีตัวเอง หรือตั้งให้แสดงร่วมไว้) */
function debtInLedger_(d, ledger) {
  return d.ledger === ledger || sharedLedger_(d) === ledger;
}

function listDebts_(ledger) {
  var rows = readRows_(SHEETS.DEBTS);
  if (ledger) rows = rows.filter(function (d) { return debtInLedger_(d, ledger); });
  return rows;
}

/**
 * รายการชำระที่แสดงในหน้าของบัญชีหนึ่ง
 * = ของบัญชีตัวเอง + รายการจากบัญชีอื่นที่ไปตัดก้อนที่ตั้งให้แสดงที่นี่ด้วย
 * เป็นแถวเดียวกันในชีต แก้/ลบจากหน้าไหนก็เปลี่ยนทั้งสองหน้า
 */
function ledgerPayments_(ledger, year) {
  var debts = readRows_(SHEETS.DEBTS);
  var all = listDebtPayments_(null, 'all');
  debtGraph_(debts, all);
  var byId = {};
  debts.forEach(function (d) { byId[String(d.id)] = d; });
  return all.filter(function (p) {
    if (year && year !== 'all' && String(p.year || yearOf_(p.payDate)) !== String(year)) return false;
    if (p.ledger === ledger) return true;
    var hit = (p._toDebts || []).some(function (id) { return byId[id] && sharedLedger_(byId[id]) === ledger; });
    if (hit) p.sharedFrom = p.ledger;
    return hit;
  });
}

/** @param {string|null} ledger ใส่ null เพื่อเอาทุกบัญชี */
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

/* ------------------------------------------------------------------ */
/*  เครื่องคิดยอด — ปันส่วนการชำระ แล้วไหลขึ้นตามสายแม่-ลูก              */
/* ------------------------------------------------------------------ */

/** ช่องทางของรายการ "ปรับยอดให้ตรงกับยอดจริง" — ไม่ใช่เงินที่โอนจริง จึงไม่นับเป็นยอดผ่อนรายปี */
var ADJUST_CHANNEL = 'ปรับยอด';

function isAdjustment_(p) { return String(p && p.channel || '') === ADJUST_CHANNEL; }

/**
 * ปันส่วนรายการชำระให้แต่ละก้อนหนี้
 *   ระบุก้อนหนี้ไว้     → เข้าก้อนนั้นเต็มจำนวน
 *   ไม่ได้ระบุ          → ตัดก้อนที่เริ่มก่อนให้หมดก่อน แล้วค่อยไหลไปก้อนถัดไป
 *                        (ก้อนที่เริ่มวันเดียวกัน ตัดก้อนเล็กก่อน)
 *   ก้อนไหนได้เกินยอดตั้งต้น → ส่วนเกินไหลต่อไปก้อนถัดไป ไม่หายไปเฉย ๆ
 *                        (เช่น จ่ายคืนป้าตาครบตอนที่ค่าที่ดินเต็มไปแล้ว)
 *
 * ทำไมไม่เฉลี่ยตามสัดส่วน: ของจริงคือจ่ายค่าที่ดินจนหมดก่อนค่อยมาผ่อนค่าก่อสร้าง
 * ถ้าเฉลี่ย ค่าที่ดินจะไม่มีวันปิดได้เลยทั้งที่จ่ายครบแล้ว และค่าก่อสร้างจะดูเหมือนจ่ายไปเกินจริง
 * ผลสุดท้ายไม่ขึ้นกับลำดับวันที่ของรายการ — ยอดชำระรวมเท่าเดิม แค่เติมก้อนเก่าให้เต็มก่อน
 */
function debtGraph_(debts, payments) {
  var byId = {};
  debts.forEach(function (d) { byId[String(d.id)] = d; });

  function parentOf(d) {
    var pid = String((d && d.parentId) || '').trim();
    return pid && byId[pid] && byId[pid] !== d ? byId[pid] : null;
  }

  /** ก้อนระดับบนสุด "ของบัญชีนั้น" — ไม่มีแม่ หรือแม่อยู่คนละบัญชี */
  function isLedgerRoot(d) {
    var p = parentOf(d);
    return !p || p.ledger !== d.ledger;
  }

  var children = {};
  debts.forEach(function (d) {
    var p = parentOf(d);
    if (p) (children[String(p.id)] = children[String(p.id)] || []).push(d);
  });

  // ลำดับการตัดของแต่ละบัญชี: เริ่มก่อน → ก้อนเล็กก่อน → ลำดับในชีต
  // ก้อนที่ตั้ง "แสดงในบัญชีอื่นด้วย" ไว้ อยู่ในคิวของบัญชีนั้นด้วย
  // บันทึกการชำระจากหน้าไหนก็ไหลมาลงก้อนเดียวกัน
  var queue = {};
  debts.forEach(function (d, i) {
    if (!isLedgerRoot(d)) return;
    (queue[d.ledger] = queue[d.ledger] || []).push({ d: d, i: i });
    var also = sharedLedger_(d);
    if (also) (queue[also] = queue[also] || []).push({ d: d, i: i });
  });
  Object.keys(queue).forEach(function (k) {
    queue[k] = queue[k].sort(function (a, b) {
      var sa = toIsoDate_(a.d.startDate) || '9999', sb = toIsoDate_(b.d.startDate) || '9999';
      if (sa !== sb) return sa < sb ? -1 : 1;
      var pa = toNumber_(a.d.principal) || 0, pb = toNumber_(b.d.principal) || 0;
      if (pa !== pb) return pa - pb;
      return a.i - b.i;
    }).map(function (x) { return x.d; });
  });

  var own = {};
  debts.forEach(function (d) { own[String(d.id)] = { principal: 0, interest: 0 }; });

  /** เงินต้นที่ลงก้อนนี้ไปแล้ว รวมก้อนลูกทุกชั้น */
  function allocated(d, guard) {
    guard = guard || 0;
    if (guard > 20) return 0;
    var sum = own[String(d.id)].principal;
    (children[String(d.id)] || []).forEach(function (c) { sum += allocated(c, guard + 1); });
    return sum;
  }

  function principalOf(d) { return toNumber_(d.principal) || 0; }

  // 1) รายการที่ระบุก้อนไว้ เข้าก้อนนั้นตรง ๆ · ที่ไม่ได้ระบุ รอเทลงคิวของบัญชีตัวเอง
  var loose = [];
  payments.forEach(function (p) {
    var id = String(p.debtId || '').trim();
    p._toDebts = [];
    p._split = {};
    if (id && own[id]) {
      own[id].principal += toNumber_(p.principal) || 0;
      own[id].interest += toNumber_(p.interest) || 0;
      p._toDebts.push(id);
      p._split[id] = toNumber_(p.principal) || 0;
    } else {
      loose.push(p);
    }
  });

  // 2) ก้อนที่ได้เกินยอดตั้งต้นแล้ว (เช่น จ่ายคืนก้อนย่อยทีหลังตอนที่ก้อนแม่เต็มไปแล้ว)
  //    ส่วนที่เกินไม่ได้หายไปไหน ไหลไปก้อนถัดไปในคิวของบัญชีนั้น
  var spill = {};
  debts.forEach(function (d) {
    if (!isLedgerRoot(d)) return;
    var over = allocated(d) - principalOf(d);
    if (over > 0) { own[String(d.id)].principal -= over; spill[d.ledger] = (spill[d.ledger] || 0) + over; }
  });

  /** เทเงินลงคิวจนเต็มทีละก้อน คืนรหัสก้อนที่ได้รับ · เกินทุกก้อนพักไว้ก้อนสุดท้าย */
  function pour(roots, amount, split) {
    var got = [];
    roots.forEach(function (d, k) {
      if (amount <= 0) return;
      var room = Math.max(0, principalOf(d) - allocated(d));
      var take = k === roots.length - 1 ? amount : Math.min(amount, room);
      if (take <= 0) return;
      own[String(d.id)].principal += take;
      amount -= take;
      got.push(String(d.id));
      if (split) split[String(d.id)] = take;
    });
    return got;
  }

  /** ยอดติดลบ (ปรับยอดหนี้ขึ้น) คืนจากก้อนท้าย ๆ ก่อน */
  function drain(roots, amount, split) {
    var got = [];
    for (var k = roots.length - 1; k >= 0 && amount < 0; k--) {
      var mine = own[String(roots[k].id)].principal;
      var back = k === 0 ? amount : Math.max(amount, -Math.max(0, mine));
      if (!back) continue;
      own[String(roots[k].id)].principal += back;
      amount -= back;
      got.push(String(roots[k].id));
      if (split) split[String(roots[k].id)] = back;
    }
    return got;
  }

  Object.keys(spill).forEach(function (ledger) { pour(queue[ledger] || [], spill[ledger]); });

  // 3) ไล่ตามวันที่ชำระ จะได้รู้ว่าแต่ละรายการไปตัดก้อนไหน (ใช้แสดงรายการในหน้าที่ก้อนนั้นแสดงอยู่)
  //    ยอดรวมแต่ละก้อนไม่ขึ้นกับลำดับ เพราะเติมก้อนเก่าให้เต็มก่อนเสมอ
  loose.sort(function (a, b) {
    return String(toIsoDate_(a.payDate)).localeCompare(String(toIsoDate_(b.payDate)));
  });
  var positive = loose.filter(function (p) { return (toNumber_(p.principal) || 0) >= 0; });
  var negative = loose.filter(function (p) { return (toNumber_(p.principal) || 0) < 0; });
  positive.concat(negative).forEach(function (p) {
    var roots = queue[p.ledger] || [];
    if (!roots.length) return;
    var pr = toNumber_(p.principal) || 0;
    var got = pr >= 0 ? pour(roots, pr, p._split) : drain(roots, pr, p._split);
    if (!got.length) {
      // ดอกเบี้ยอย่างเดียว: ผูกกับก้อนแรกที่ยังไม่เต็ม
      var open = roots.filter(function (d) { return allocated(d) < principalOf(d); })[0] || roots[roots.length - 1];
      got.push(String(open.id));
    }
    // ดอกเบี้ยไม่ได้ลดยอดหนี้ ลงก้อนแรกที่รายการนี้ไปตัดไว้เฉย ๆ
    own[got[0]].interest += toNumber_(p.interest) || 0;
    p._toDebts = got;
  });

  /** ยอดของก้อนหนึ่ง = ของตัวเอง + เงินต้นของลูกทุกชั้น */
  function paidOf(d, guard) {
    guard = guard || 0;
    if (guard > 20) return { principal: 0, interest: 0, fromChildren: 0 };
    var mine = own[String(d.id)] || { principal: 0, interest: 0 };
    var fromChildren = 0;
    (children[String(d.id)] || []).forEach(function (c) {
      var r = paidOf(c, guard + 1);
      fromChildren += r.principal;
    });
    return {
      principal: mine.principal + fromChildren,
      interest: mine.interest,
      fromChildren: fromChildren
    };
  }

  /** บัญชีทั้งหมดที่รายการชำระนี้ส่งผลถึง (ไล่ขึ้นตามสายแม่) */
  function ledgersTouched(p) {
    var set = {};
    (p._toDebts || []).forEach(function (id) {
      var d = byId[id], guard = 0;
      while (d && guard++ < 20) {
        set[d.ledger] = true;
        if (sharedLedger_(d)) set[sharedLedger_(d)] = true;
        d = parentOf(d);
      }
    });
    if (!Object.keys(set).length) set[p.ledger] = true;
    return set;
  }

  /**
   * เงินต้นของรายการนี้ที่ "เป็นของ" บัญชีหนึ่ง
   * รายการของบัญชีตัวเองนับเต็ม · รายการจากบัญชีอื่นนับเฉพาะส่วนที่ไปตัดก้อนที่เกี่ยวกับบัญชีนี้
   * (งวดที่คร่อมสองก้อน เช่น ครึ่งหนึ่งปิดค่าเขียนแบบ อีกครึ่งเข้าค่าก่อสร้าง จะได้ไม่นับเกิน)
   */
  function principalFor(p, ledger) {
    if (p.ledger === ledger) return toNumber_(p.principal) || 0;
    var sum = 0;
    Object.keys(p._split || {}).forEach(function (id) {
      var set = {}, d = byId[id], guard = 0;
      while (d && guard++ < 20) {
        set[d.ledger] = true;
        if (sharedLedger_(d)) set[sharedLedger_(d)] = true;
        d = parentOf(d);
      }
      if (set[ledger]) sum += p._split[id];
    });
    return sum;
  }

  return {
    byId: byId, children: children, parentOf: parentOf, principalFor: principalFor,
    isLedgerRoot: isLedgerRoot, paidOf: paidOf, ledgersTouched: ledgersTouched
  };
}

/**
 * สรุปยอดของบัญชีหนี้หนึ่งบัญชี
 * @param {string} ledger 'หนี้หลัก' | 'หนี้รอง'
 * @param {string|number} year ปี ค.ศ. หรือ 'all'
 */
function debtSummary_(ledger, year) {
  var allDebts = readRows_(SHEETS.DEBTS);
  var allPayments = listDebtPayments_(null, 'all');
  var g = debtGraph_(allDebts, allPayments);

  // ก้อนของบัญชีนี้ + ก้อนจากบัญชีอื่นที่ตั้งให้แสดงที่นี่ด้วย (ข้อมูลชุดเดียวกัน ไม่ได้คัดลอก)
  var debts = allDebts.filter(function (d) { return debtInLedger_(d, ledger); });
  var byId = g.byId;

  /** รายการนี้ไปตัดก้อนที่ยืมมาแสดงในบัญชีนี้ — นับเหมือนเป็นของบัญชีนี้ทุกอย่าง รวมดอกเบี้ย */
  function paysShared(p) {
    if (p.ledger === ledger) return false;
    return (p._toDebts || []).some(function (id) { return byId[id] && sharedLedger_(byId[id]) === ledger; });
  }
  function ownsInterest(p) { return p.ledger === ledger || paysShared(p); }

  // รายการชำระที่ส่งผลถึงบัญชีนี้
  //   • ของบัญชีตัวเอง และที่ไปตัดก้อนที่แสดงร่วม — เอาทั้งหมด
  //   • ของก้อนลูกที่อยู่คนละบัญชี — เอาเฉพาะที่มีเงินต้น เพราะดอกเบี้ยของลูก
  //     ไม่ได้ลดยอดหนี้ของแม่ ถ้านับมาด้วยจำนวนรายการกับยอดรายปีจะเกินจริง
  //   เงินต้นที่นับใช้ _mine = ส่วนที่เป็นของบัญชีนี้จริง (งวดที่คร่อมสองก้อนนับแค่ส่วนของก้อนที่นี่)
  var scoped = allPayments.filter(function (p) {
    p._mine = g.principalFor(p, ledger);
    if (p.ledger === ledger) return true;
    if (paysShared(p)) return p._mine !== 0 || !!(toNumber_(p.interest) || 0);
    if (!(p._mine > 0)) return false;
    return !!g.ledgersTouched(p)[ledger];
  });
  // รายการปรับยอดลดหนี้จริง แต่ไม่ใช่เงินที่โอนในปีนั้น — ไม่เอาไปนับเป็นยอดผ่อนรายปีหรือคาดการณ์
  var adjustments = scoped.filter(isAdjustment_);
  var adjusted = sum_(adjustments, function (p) { return p._mine; });
  scoped = scoped.filter(function (p) { return !isAdjustment_(p); });

  var totalDebt = sum_(debts, function (d) { return d.principal; });

  var principalPaid = 0;
  debts.forEach(function (d) {
    var parent = g.parentOf(d);
    if (parent && debtInLedger_(parent, ledger)) return;   // ก้อนลูกที่แม่อยู่ในหน้านี้ ถูกนับผ่านแม่แล้ว
    principalPaid += g.paidOf(d).principal;
  });
  var interestPaid = sum_(allPayments.filter(ownsInterest), function (p) { return p.interest; });

  var remaining = totalDebt - principalPaid;
  var percent = totalDebt > 0 ? Math.min(100, (principalPaid / totalDebt) * 100) : 0;

  // แยกตามปี
  var byYearMap = {};
  scoped.forEach(function (p) {
    var y = p.year || yearOf_(p.payDate);
    if (!y) return;
    if (!byYearMap[y]) byYearMap[y] = { year: Number(y), principal: 0, interest: 0, count: 0 };
    byYearMap[y].principal += p._mine;
    byYearMap[y].interest += (ownsInterest(p) ? (toNumber_(p.interest) || 0) : 0);
    byYearMap[y].count++;
  });
  var byYear = Object.keys(byYearMap)
    .map(function (k) { return byYearMap[k]; })
    .sort(function (a, b) { return b.year - a.year; });

  var asc = byYear.slice().sort(function (a, b) { return a.year - b.year; });
  var run = 0;
  asc.forEach(function (y) { run += y.principal; y.cumulative = round2_(run); });

  // ความคืบหน้ารายก้อนหนี้
  var perDebt = debts.map(function (d) {
    var r = g.paidOf(d);
    var principal = toNumber_(d.principal) || 0;
    var paid = round2_(r.principal);
    var parent = g.parentOf(d);
    var kids = (g.children[String(d.id)] || []);
    return {
      id: d.id, title: d.title, creditor: d.creditor, ledger: d.ledger,
      startDate: d.startDate, status: d.status, note: d.note,
      interestPerMonth: d.interestPerMonth, dueDay: d.dueDay, planPerMonth: d.planPerMonth,
      principal: principal,
      paid: Math.min(paid, principal),
      remaining: round2_(Math.max(0, principal - paid)),
      percent: principal > 0 ? Math.min(100, (paid / principal) * 100) : 0,
      paidFromChildren: round2_(r.fromChildren),
      parentId: String(d.parentId || ''),
      alsoIn: sharedLedger_(d),
      sharedFrom: d.ledger !== ledger ? d.ledger : '',
      settled: principal > 0 && paid >= principal - 0.005,
      parentTitle: parent ? parent.title : '',
      children: kids.map(function (c) {
        var cr = g.paidOf(c);
        var cp = toNumber_(c.principal) || 0;
        return {
          id: c.id, title: c.title, ledger: c.ledger, creditor: c.creditor,
          principal: cp, paid: round2_(Math.min(cr.principal, cp)),
          remaining: round2_(Math.max(0, cp - cr.principal)),
          percent: cp > 0 ? Math.min(100, (cr.principal / cp) * 100) : 0
        };
      })
    };
  });

  var forecast = forecastPayoff_(scoped, remaining);

  var yearFiltered = (year && year !== 'all')
    ? scoped.filter(function (p) { return String(p.year || yearOf_(p.payDate)) === String(year); })
    : scoped;

  return {
    ledger: ledger,
    totalDebt: round2_(totalDebt),
    paid: round2_(principalPaid),
    remaining: round2_(remaining),
    percent: round2_(percent),
    interestPaid: round2_(interestPaid),
    paymentCount: scoped.length,
    adjusted: round2_(adjusted),
    adjustmentCount: adjustments.length,
    years: byYear.map(function (y) { return y.year; }),
    byYear: byYear,
    debts: perDebt,
    forecast: forecast,
    selectedYear: year || 'all',
    selectedYearPaid: round2_(sum_(yearFiltered, function (p) { return p._mine; })),
    selectedYearInterest: round2_(sum_(yearFiltered.filter(ownsInterest),
      function (p) { return p.interest; })),
    selectedYearCount: yearFiltered.length
  };
}

/**
 * ยอดรวมทั้งระบบแบบไม่นับซ้ำ — นับเฉพาะก้อนหนี้ที่ไม่มีแม่
 * ใช้บนแดชบอร์ด เพราะการเอายอดของแต่ละบัญชีมาบวกกันตรง ๆ
 * จะนับก้อนลูกซ้ำกับที่อยู่ในก้อนแม่อยู่แล้ว
 */
function debtOverview_() {
  var allDebts = readRows_(SHEETS.DEBTS);
  var allPayments = listDebtPayments_(null, 'all');
  var g = debtGraph_(allDebts, allPayments);

  var total = 0, paid = 0;
  allDebts.forEach(function (d) {
    if (g.parentOf(d)) return;                  // ยอดของลูกอยู่ในแม่แล้ว
    total += toNumber_(d.principal) || 0;
    paid += g.paidOf(d).principal;
  });
  var interest = sum_(allPayments, function (p) { return p.interest; });

  return {
    totalDebt: round2_(total),
    paid: round2_(Math.min(paid, total)),
    remaining: round2_(Math.max(0, total - paid)),
    percent: total > 0 ? round2_(Math.min(100, paid / total * 100)) : 0,
    interestPaid: round2_(interest)
  };
}

/** ประเมินว่าอีกกี่เดือนจะปิดหนี้ จากค่าเฉลี่ยการชำระ 12 เดือนล่าสุด */
function forecastPayoff_(payments, remaining) {
  if (remaining <= 0) return { monthsLeft: 0, avgPerMonth: 0, payoffDate: '' };
  var cutoff = addMonths_(new Date(), -12);
  var recent = payments.filter(function (p) {
    var d = toDate_(p.payDate);
    return d && cutoff && d >= cutoff;
  });
  var total = sum_(recent, function (p) { return p._mine != null ? p._mine : p.principal; });
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

/** กันผูกวน เช่น A เป็นลูกของ B แล้ว B เป็นลูกของ A */
function assertNoCycle_(debtId, parentId) {
  if (!parentId) return;
  if (String(parentId) === String(debtId)) {
    throw new Error('ก้อนหนี้ผูกเป็นส่วนหนึ่งของตัวเองไม่ได้');
  }
  var byId = {};
  readRows_(SHEETS.DEBTS).forEach(function (d) { byId[String(d.id)] = d; });
  var cur = byId[String(parentId)], guard = 0;
  while (cur && guard++ < 20) {
    if (String(cur.id) === String(debtId)) {
      throw new Error('ผูกแบบนี้จะวนกลับมาหาตัวเอง — เลือกก้อนหนี้อื่น');
    }
    cur = byId[String(cur.parentId || '')];
  }
}

function saveDebt_(obj) {
  var now = new Date();
  obj.parentId = String(obj.parentId || '').trim();
  obj.alsoIn = sharedLedger_({ ledger: obj.ledger, alsoIn: obj.alsoIn });
  if (obj.parentId) assertNoCycle_(obj.id, obj.parentId);
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
  // ลบก้อนที่ยังมีของผูกอยู่ ยอดจะย้ายไปก้อนอื่นเงียบ ๆ — ให้ย้าย/ลบของที่ผูกก่อน
  var pays = readRows_(SHEETS.DEBT_PAYMENTS).filter(function (p) { return String(p.debtId) === String(id); }).length;
  if (pays) throw new Error('ก้อนนี้มีรายการชำระผูกอยู่ ' + pays + ' รายการ — ลบหรือเปลี่ยน "ผูกกับก้อนหนี้" ของรายการเหล่านั้นก่อน');
  var kids = readRows_(SHEETS.DEBTS).filter(function (d) { return String(d.parentId) === String(id); }).length;
  if (kids) throw new Error('มีก้อนหนี้ ' + kids + ' ก้อนที่เป็นส่วนหนึ่งของก้อนนี้ — ปลดการผูกของก้อนเหล่านั้นก่อน');
  deleteRow_(SHEETS.DEBTS, found._row, found);
  logActivity_('ลบก้อนหนี้', id, found.title);
  return true;
}

function saveDebtPayment_(obj) {
  var now = new Date();
  obj.payDate = cleanDate_(obj.payDate, 'วันที่ชำระ', true);
  obj.year = yearOf_(obj.payDate);
  obj.ledger = obj.ledger || LEDGER_MAIN;
  // ผูกกับก้อนหนี้ไว้ → รายการเป็นของบัญชีที่ก้อนนั้นอยู่จริงเสมอ ไม่ว่าจะกดบันทึกจากหน้าไหน
  // (เช่น บันทึกค่าก่อสร้างจากหน้าหนี้สิน ก็ยังเข้ายอดของรายการสรุปรวมด้วย)
  var debtId = String(obj.debtId || '').trim();
  if (debtId) {
    var debt = findRow_(SHEETS.DEBTS, debtId);
    // ก้อนที่ผูกไว้ถูกลบไปแล้ว (ข้อมูลเก่า) ไม่ให้แก้รายการไม่ได้ — ปลดการผูก ให้ระบบตัดก้อนเก่าก่อนแทน
    if (debt) obj.ledger = debt.ledger;
    else obj.debtId = '';
  }
  // "รวมที่โอน" คิดให้เองเสมอ เพื่อให้ตรงกับสลิปและกันกรอกไม่ตรงกัน
  obj.principal = toNumber_(obj.principal) || 0;
  obj.interest = toNumber_(obj.interest) || 0;
  obj.amount = round2_(obj.principal + obj.interest);

  if (obj.id) {
    var found = findRow_(SHEETS.DEBT_PAYMENTS, obj.id);
    if (found) {
      var merged = Object.assign({}, found, obj, { updatedAt: now });
      logActivity_('แก้ไขรายการชำระหนี้', obj.id, 'เงินต้น ' + obj.principal + ' · ดอกเบี้ย ' + obj.interest);
      return updateRow_(SHEETS.DEBT_PAYMENTS, found._row, merged);
    }
  }
  obj.id = obj.id || uid_('PAY');
  obj.updatedAt = now;
  logActivity_('เพิ่มรายการชำระหนี้', obj.id, obj.ledger + ' เงินต้น ' + obj.principal + ' · ดอกเบี้ย ' + obj.interest);
  return insertRow_(SHEETS.DEBT_PAYMENTS, obj);
}

function deleteDebtPayment_(id) {
  var found = findRow_(SHEETS.DEBT_PAYMENTS, id);
  if (!found) throw new Error('ไม่พบรายการชำระ: ' + id);
  deleteRow_(SHEETS.DEBT_PAYMENTS, found._row, found);
  logActivity_('ลบรายการชำระหนี้', id, found.amount);
  return true;
}

/**
 * ปรับยอดคงเหลือของก้อนหนี้ให้ตรงกับยอดจริง
 *
 * ใช้ตอนที่ยอดในระบบกับยอดที่เจ้าหนี้แจ้งไม่ตรงกัน เช่น มีบางงวดที่ไม่ได้บันทึกไว้
 * หรือเจ้าหนี้ยกให้บางส่วน — แทนที่จะไปแก้ยอดตั้งต้น (ซึ่งทำให้ประวัติเพี้ยน)
 * ระบบบันทึก "รายการปรับยอด" เท่าส่วนต่างผูกกับก้อนนั้น ตรวจย้อนหลังได้และลบทิ้งได้
 *
 * @param {{debtId:string, actualRemaining:number, payDate?:string, note?:string}} p
 */
function reconcileDebt_(p) {
  var debt = findRow_(SHEETS.DEBTS, p.debtId);
  if (!debt) throw new Error('ไม่พบก้อนหนี้: ' + p.debtId);
  var actual = toNumber_(p.actualRemaining);
  if (actual === null || actual < 0) throw new Error('กรอกยอดคงเหลือจริงเป็นตัวเลขตั้งแต่ 0 ขึ้นไป');
  var principal = toNumber_(debt.principal) || 0;
  if (actual > principal) throw new Error('ยอดคงเหลือจริงมากกว่ายอดหนี้ตั้งต้น (' + principal + ') — แก้ยอดตั้งต้นของก้อนนี้แทน');

  // ใช้ยอดที่ยังไม่ตัดเพดาน ไม่งั้นก้อนที่จ่ายเกินจะปรับลงไม่ได้
  var g = debtGraph_(readRows_(SHEETS.DEBTS), listDebtPayments_(null, 'all'));
  var current = principal - g.paidOf(debt).principal;
  var diff = round2_(current - actual);
  if (Math.abs(diff) < 0.005) throw new Error('ยอดคงเหลือตรงกับยอดจริงอยู่แล้ว ไม่ต้องปรับ');

  var note = 'ปรับยอดคงเหลือ ' + round2_(current) + ' → ' + actual +
    (p.note ? ' · ' + String(p.note).trim() : '');
  var saved = saveDebtPayment_({
    ledger: debt.ledger, debtId: debt.id, payDate: p.payDate || todayIso_(),
    principal: diff, interest: 0, channel: ADJUST_CHANNEL, note: note
  });
  logActivity_('ปรับยอดหนี้ให้ตรงยอดจริง', debt.id, debt.title + ' · ' + note);
  return saved;
}
