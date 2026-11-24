/* =====================================================================
   server.js — ระบบ The M Corner AP บน Cloudflare (ตัวหลัก)

   Worker   รับทุกคำขอแล้วส่งต่อให้ Durable Object ตัวเดียว ("main")
   Durable Object (SQLite ในตัว ใช้ฟรี)
            • เก็บทุกแผ่นงานเป็นแถว ๆ ในตาราง cells — โค้ดธุรกิจชุดเดียวกับ Apps Script
              มองเห็นเป็น "ชีต" ผ่าน prelude.js
            • ทำงานทีละคำขอ คำสั่งของระบบรันจบในรวดเดียว ข้อมูลจึงไม่ชนกัน
            • ทุกการเปลี่ยนแปลงลงคิว outbox ในรายการเดียวกับข้อมูล (บันทึกพร้อมกัน หายไม่ได้)
              แล้วส่งไป Apps Script ทันที ส่งไม่ถึงก็ลองใหม่ด้วย alarm จนสำเร็จ

   เส้นทาง
     GET  /                 หน้าระบบ (เหมือนเปิด /exec ของ Apps Script)
     POST /api              คำสั่งจากหน้าเว็บ { action, payload } → { ok, data | error }
     POST /sync/apply       Apps Script ส่งการเปลี่ยนแปลงมา (ต้องมีรหัสลับร่วม)
     GET  /setup            หน้าเชื่อมต่อ/ย้ายข้อมูล/ตรวจว่าข้อมูลตรงกัน
     POST /setup/*          pair · verify · push · status
     /manifest.webmanifest /sw.js /icon-*.png   ให้ติดตั้งเป็นแอปบนมือถือได้ (PWA)
   ===================================================================== */

import { createApp } from './dist/app.mjs';
import { ASSETS } from './dist/assets.mjs';

const ECHO_WINDOW_MS = 10 * 60 * 1000;   // แก้ฝั่งนี้ไปไม่ถึง 10 นาที แล้วอีกฝั่งส่งแถวเดียวกันมา → ส่งผลสุดท้ายกลับไปยืนยัน
const BATCH_OPS = 300;                    // op ต่อการส่งหนึ่งครั้ง (Apps Script เขียนชีตช้า อย่าส่งก้อนใหญ่เกิน)
const OUTBOX_ROW_MAX = 1500000;           // SQLite ของ Durable Object เก็บได้ 2 MB ต่อช่อง
const MAX_BODY = 60 * 1024 * 1024;

/* ------------------------------------------------------------------ */
/*  Worker                                                             */
/* ------------------------------------------------------------------ */

export default {
  async fetch(request, env) {
    const stub = env.APP.get(env.APP.idFromName('main'));
    return stub.fetch(request);
  }
};

/* ------------------------------------------------------------------ */
/*  ที่เก็บข้อมูล: ตาราง SQLite ↔ "ชีต" ที่ prelude.js มองเห็น              */
/* ------------------------------------------------------------------ */

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS sheets (name TEXT PRIMARY KEY, ord INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS cells  (sheet TEXT NOT NULL, r INTEGER NOT NULL, v TEXT NOT NULL, PRIMARY KEY (sheet, r));
CREATE TABLE IF NOT EXISTS props  (k TEXT PRIMARY KEY, v TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS outbox (id INTEGER PRIMARY KEY AUTOINCREMENT, ops TEXT NOT NULL, n INTEGER NOT NULL, at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS rowmeta (sheet TEXT NOT NULL, k TEXT NOT NULL, t INTEGER NOT NULL, src TEXT NOT NULL, del INTEGER NOT NULL,
                                    PRIMARY KEY (sheet, k));
`;

function isDate(v) { return Object.prototype.toString.call(v) === '[object Date]'; }

export class Store {
  /** @param {{exec:Function}} sql  ctx.storage.sql (หรือตัวจำลองตอนทดสอบ) */
  constructor(sql, transactionSync) {
    this.sql = sql;
    this.tx = transactionSync || (fn => fn());
    sql.exec(SCHEMA_SQL);
    this.reset();
  }

  reset() {
    this.sheets = new Map();   // name → { grid, saved: [json] }
    this.dirty = new Set();
    this.props = null;
    this.pending = [];         // ชุด op ที่รอลง outbox ตอน flush
    this.metaQueue = [];       // rowmeta ที่รอบันทึก
  }

  rows(q, ...b) { return this.sql.exec(q, ...b).toArray(); }

  /* ---------- ชีต ---------- */
  encodeRow(row) {
    return JSON.stringify((row || []).map(v => (isDate(v) ? { $d: v.getTime() } : v)));
  }
  decodeRow(text) {
    return JSON.parse(text).map(v => (v && typeof v === 'object' && '$d' in v ? this.makeDate(v.$d) : v));
  }
  hasSheet(name) { return this.sheets.has(name) || this.rows('SELECT 1 FROM sheets WHERE name = ?', name).length > 0; }
  loadSheet(name) {
    const hit = this.sheets.get(name);
    if (hit) return hit.grid;
    if (!this.rows('SELECT 1 FROM sheets WHERE name = ?', name).length) return null;
    const grid = [], saved = [];
    for (const row of this.rows('SELECT r, v FROM cells WHERE sheet = ? ORDER BY r', name)) {
      while (grid.length < row.r) { grid.push([]); saved.push(null); }
      grid[row.r] = this.decodeRow(row.v);
      saved[row.r] = row.v;
    }
    this.sheets.set(name, { grid, saved });
    return grid;
  }
  createSheet(name) {
    if (this.hasSheet(name)) return this.loadSheet(name);
    const ord = (this.rows('SELECT COALESCE(MAX(ord), 0) + 1 AS n FROM sheets')[0] || { n: 1 }).n;
    this.sql.exec('INSERT INTO sheets (name, ord) VALUES (?, ?)', name, ord);
    const grid = [];
    this.sheets.set(name, { grid, saved: [] });
    this.dirty.add(name);
    return grid;
  }
  touchSheet(name) { this.dirty.add(name); }
  sheetNames() { return this.rows('SELECT name FROM sheets ORDER BY ord').map(r => r.name); }

  /* ---------- Script Properties ---------- */
  loadProps() {
    if (!this.props) {
      this.props = new Map();
      for (const r of this.rows('SELECT k, v FROM props')) this.props.set(r.k, r.v);
    }
    return this.props;
  }
  getProp(k) { const p = this.loadProps(); return p.has(k) ? p.get(k) : null; }
  setProp(k, v) { this.loadProps().set(k, String(v)); this.sql.exec('INSERT OR REPLACE INTO props (k, v) VALUES (?, ?)', k, String(v)); }
  delProp(k) { this.loadProps().delete(k); this.sql.exec('DELETE FROM props WHERE k = ?', k); }

  /* ---------- rowmeta: เวลาที่แต่ละแถวถูกแก้ล่าสุด และใครแก้ ---------- */
  meta(sheet, k) {
    const r = this.rows('SELECT t, src, del FROM rowmeta WHERE sheet = ? AND k = ?', sheet, String(k));
    return r.length ? r[0] : null;
  }
  setMeta(sheet, k, t, src, del) {
    this.sql.exec('INSERT OR REPLACE INTO rowmeta (sheet, k, t, src, del) VALUES (?, ?, ?, ?, ?)', sheet, String(k), t, src, del ? 1 : 0);
  }

  /* ---------- บันทึกทุกอย่างที่ค้างในหน่วยความจำ (หนึ่งรายการ = ทั้งหมดหรือไม่มีเลย) ---------- */
  flush(keyOf) {
    let wrote = 0;
    this.tx(() => {
      for (const name of this.dirty) {
        const s = this.sheets.get(name);
        if (!s) continue;
        const { grid, saved } = s;
        // ตัดแถวว่างท้ายชีต (ชีตจริงก็ไม่นับ) — ไม่ต้องเก็บ
        while (grid.length && !(grid[grid.length - 1] || []).some(v => v !== '' && v !== null && v !== undefined)) grid.pop();
        for (let i = 0; i < grid.length; i++) {
          const text = this.encodeRow(grid[i]);
          if (saved[i] === text) continue;
          this.sql.exec('INSERT OR REPLACE INTO cells (sheet, r, v) VALUES (?, ?, ?)', name, i, text);
          saved[i] = text; wrote++;
        }
        if (saved.length > grid.length) {
          this.sql.exec('DELETE FROM cells WHERE sheet = ? AND r >= ?', name, grid.length);
          saved.length = grid.length; wrote++;
        }
      }
      this.dirty.clear();
      for (const m of this.metaQueue) this.setMeta(m.s, m.k, m.t, m.src, m.del);
      this.metaQueue = [];
      for (const ops of this.pending) {
        for (const op of ops) {
          if (op.k !== undefined && op.r !== undefined) this.setMeta(op.s, op.k, op.t, 'cf', !op.r);
          else if (op.all && keyOf) { const key = keyOf(op.s); op.all.forEach(r => this.setMeta(op.s, r[key], op.t, 'cf', false)); }
        }
        for (const chunk of splitOps(ops, keyOf)) {
          this.sql.exec('INSERT INTO outbox (ops, n, at) VALUES (?, ?, ?)', JSON.stringify(chunk), chunk.length, Date.now());
        }
        wrote++;
      }
      this.pending = [];
      if (wrote) {
        const prev = Number(this.getProp('__data_version') || 0);
        this.setProp('__data_version', String(Math.max(Date.now(), prev + 1)));
      }
    });
    return wrote;
  }

  outboxCount() { return (this.rows('SELECT COUNT(*) AS n FROM outbox')[0] || { n: 0 }).n; }

  /** ล้างข้อมูลทั้งหมด (ก่อนย้ายข้อมูลจาก Apps Script มาตั้งต้นใหม่) — ค่าตั้งของการเชื่อมต่อยังอยู่ */
  wipeData() {
    this.tx(() => {
      this.sql.exec('DELETE FROM cells');
      this.sql.exec('DELETE FROM sheets');
      this.sql.exec('DELETE FROM rowmeta');
      this.sql.exec('DELETE FROM outbox');
      this.sql.exec("DELETE FROM props WHERE k NOT IN ('SYNC_SECRET','GAS_URL','GAS_SHEET_URL','__data_version') AND k NOT LIKE '__setup%'");
    });
    this.reset();
  }
}

/** op ชุดใหญ่เกินช่องเดียวของ SQLite → แบ่งเป็นหลายแถว (ลำดับเดิม) */
function splitOps(ops, keyOf) {
  const out = [];
  let cur = [], size = 2;
  for (const op of ops) {
    let pieces = [op];
    const text = JSON.stringify(op);
    if (text.length > OUTBOX_ROW_MAX && op.all) {
      // เขียนทั้งชีตที่ใหญ่มาก: ส่ง "ล้างแล้วใส่ก้อนแรก" ตามด้วยแถวที่เหลือทีละแถว ผลลัพธ์เหมือนกัน
      const per = Math.max(1, Math.floor(op.all.length * OUTBOX_ROW_MAX / text.length / 2));
      pieces = [{ s: op.s, all: op.all.slice(0, per), t: op.t }];
      const key = keyOf ? keyOf(op.s) : 'id';
      op.all.slice(per).forEach(r => pieces.push({ s: op.s, k: String(r[key]), r, t: op.t }));
    }
    for (const p of pieces) {
      const len = JSON.stringify(p).length + 1;
      if (cur.length && size + len > OUTBOX_ROW_MAX) { out.push(cur); cur = []; size = 2; }
      cur.push(p); size += len;
    }
  }
  if (cur.length) out.push(cur);
  return out;
}

/* ------------------------------------------------------------------ */
/*  Durable Object                                                     */
/* ------------------------------------------------------------------ */

export class MCornerAP {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env || {};
    const st = ctx.storage;
    this.store = new Store(st.sql, st.transactionSync ? fn => st.transactionSync(fn) : null);
    this.origin = '';
    this.delivering = null;
    this.boot();
  }

  /** สร้างตัวรันโค้ดของระบบ (ทำใหม่หลังย้ายข้อมูล เพื่อล้างค่าที่จำไว้ในหน่วยความจำ) */
  boot() {
    const self = this, store = this.store;
    const host = {
      loadSheet: n => store.loadSheet(n),
      createSheet: n => store.createSheet(n),
      touchSheet: n => store.touchSheet(n),
      sheetNames: () => store.sheetNames(),
      getProp: k => store.getProp(k),
      setProp: (k, v) => store.setProp(k, v),
      delProp: k => store.delProp(k),
      origin: () => self.origin,
      enqueue: ops => { if (ops && ops.length) store.pending.push(ops); },
      kick: () => { self.later(self.deliver()); },
      dataVersion: () => Number(store.getProp('__data_version') || 0),
      syncStatus: () => self.status(true)
    };
    this.app = createApp(host);
    store.makeDate = this.app.makeDate;
  }

  later(p) {
    p = Promise.resolve(p).catch(e => console.error('background:', e && e.stack || e));
    if (this.ctx.waitUntil) { try { this.ctx.waitUntil(p); } catch (e) { /* บาง runtime ไม่มี */ } }
    return p;
  }

  paired() { return !!(this.store.getProp('SYNC_SECRET') && this.store.getProp('GAS_URL')); }

  /** บันทึกลงฐานข้อมูล แล้วถ้ามีของต้องส่ง ส่งทันที (ไม่ต้องรอ) + ตั้ง alarm กันพลาด */
  commit() {
    const hadPending = this.store.pending.length > 0;
    try {
      this.store.flush(name => this.app.syncKey(name));
    } catch (e) {
      // บันทึกไม่ผ่าน — ทิ้งของในหน่วยความจำ กลับไปเชื่อฐานข้อมูล
      this.store.reset();
      this.boot();
      throw e;
    }
    if (hadPending && this.paired()) {
      this.ensureAlarm(20000);
      this.later(this.deliver());
    }
  }

  async ensureAlarm(ms) {
    try {
      const cur = await this.ctx.storage.getAlarm();
      const at = Date.now() + ms;
      if (!cur || cur > at) await this.ctx.storage.setAlarm(at);
    } catch (e) { /* ตอนทดสอบไม่มี alarm */ }
  }

  async alarm() {
    await this.deliver();
    if (this.store.outboxCount() > 0) {
      const fails = Number(this.store.getProp('__fail_count') || 0);
      await this.ensureAlarm(Math.min(5 * 60000, 15000 * Math.pow(2, Math.min(fails, 5))));
    }
  }

  /* ---------- ส่ง outbox ไป Apps Script (ทีละชุด ตามลำดับ) ---------- */
  deliver() {
    if (this.delivering) return this.delivering;
    const run = (async () => {
      await null;   // ให้ this.delivering ถูกตั้งก่อนเริ่มทำงานเสมอ
      try {
        while (this.paired()) {
          const rows = this.store.rows('SELECT id, ops, n FROM outbox ORDER BY id LIMIT 200');
          if (!rows.length) break;
          let ops = [], last = 0, size = 0;
          for (const r of rows) {
            if (ops.length && (ops.length + r.n > BATCH_OPS || size + r.ops.length > 8 * OUTBOX_ROW_MAX)) break;
            ops = ops.concat(JSON.parse(r.ops)); last = r.id; size += r.ops.length;
          }
          const res = await this.callGas({ op: 'apply', ops });
          if (!res.ok) {
            this.store.setProp('SYNC_LAST_ERROR', stamp() + ' · ' + res.error);
            this.store.setProp('__fail_count', String(Number(this.store.getProp('__fail_count') || 0) + 1));
            break;
          }
          this.store.sql.exec('DELETE FROM outbox WHERE id <= ?', last);
          this.store.setProp('SYNC_LAST_OK', stamp());
          this.store.delProp('__fail_count');
        }
      } finally {
        if (this.store.outboxCount() > 0) await this.ensureAlarm(15000);
      }
    })();
    this.delivering = run;
    run.then(() => { if (this.delivering === run) this.delivering = null; },
             () => { if (this.delivering === run) this.delivering = null; });
    return run;
  }

  /** POST ไป Apps Script (/exec) — Google ตอบกลับด้วยการพาไปอีกที่อยู่หนึ่ง fetch ตามไปให้เอง */
  async callGas(body, url) {
    url = url || this.store.getProp('GAS_URL');
    if (!url) return { ok: false, error: 'ยังไม่ได้เชื่อมกับ Apps Script' };
    if (body.op !== 'pair') body = Object.assign({ secret: this.store.getProp('SYNC_SECRET') }, body);
    try {
      const res = await fetch(url, {
        method: 'POST', redirect: 'follow',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(body.op === 'export' ? 120000 : 90000)
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch (e) {
        return { ok: false, error: 'Apps Script ตอบกลับไม่ใช่ข้อมูล (HTTP ' + res.status + ') — ตรวจว่า Deploy เป็นเว็บแอปที่ "ทุกคน" เข้าถึงได้ และอัปเดตโค้ดเป็นรุ่นล่าสุดแล้ว' };
      }
      if (!data || typeof data !== 'object') return { ok: false, error: 'Apps Script ตอบกลับไม่ถูกต้อง' };
      if (!data.ok && !data.error) data.error = 'Apps Script ตอบกลับว่าไม่สำเร็จ';
      return data;
    } catch (e) {
      return { ok: false, error: 'ติดต่อ Apps Script ไม่ได้: ' + String(e && e.message || e).slice(0, 200) };
    }
  }

  /* ---------- รับการเปลี่ยนแปลงจาก Apps Script ---------- */
  applyFromPeer(ops) {
    const store = this.store, app = this.app, now = Date.now();
    const sendBack = new Map();   // "ชีต\tรหัส" → ต้องส่งสภาพล่าสุดของฝั่งนี้กลับไป
    const accepted = [];
    const key = (s, k) => s + '\t' + k;
    const opts = {
      accept: op => {
        if (op.k === undefined) return true;
        const m = store.meta(op.s, op.k);
        if (!m || op.t >= m.t) {
          if (m && m.src === 'cf' && now - m.t < ECHO_WINDOW_MS) sendBack.set(key(op.s, op.k), { s: op.s, k: op.k });
          accepted.push(op);
          return true;
        }
        sendBack.set(key(op.s, op.k), { s: op.s, k: op.k });   // ของเราใหม่กว่า — บอกอีกฝั่งให้ตามเรา
        return false;
      },
      keepNewer: (name, k, t) => {
        const m = store.meta(name, k);
        if (m && !m.del && m.t > t) { sendBack.set(key(name, k), { s: name, k }); return true; }
        return false;
      },
      dropIncoming: (name, k, t) => {
        const m = store.meta(name, k);
        if (m && m.del && m.t > t) { sendBack.set(key(name, k), { s: name, k }); return true; }
        return false;
      }
    };
    const n = app.applyOps(ops, opts);
    for (const op of accepted) store.metaQueue.push({ s: op.s, k: op.k, t: op.t, src: 'gas', del: !op.r });
    if (sendBack.size) {
      const back = [];
      for (const { s, k } of sendBack.values()) {
        const row = app.findRow(s, k);
        const m = store.meta(s, k);
        back.push({ s, k: String(k), r: row ? app.rowOut(s, row) : null, t: Math.max(m ? m.t : 0, now) });
      }
      // ส่งกลับในนามฝั่งนี้ (เวลาใหม่) — อีกฝั่งจะได้สภาพเดียวกับเรา
      store.pending.push(back);
    }
    this.commit();
    return n;
  }

  /* ---------- สถานะ ---------- */
  status(detail) {
    const s = this.store;
    const url = s.getProp('GAS_URL') || '';
    const out = {
      platform: 'cloudflare',
      paired: this.paired(),
      pending: s.outboxCount(),
      lastOk: s.getProp('SYNC_LAST_OK') || '',
      lastError: s.getProp('SYNC_LAST_ERROR') || '',
      pairedAt: s.getProp('__setup_paired_at') || '',
      version: this.app.version
    };
    out.peer = detail ? url : url.replace(/(\/macros\/s\/.{6}).*(.{6}\/exec)$/, '$1…$2');
    if (detail) out.sheetUrl = s.getProp('GAS_SHEET_URL') || '';
    return out;
  }

  /* ------------------------------------------------------------------ */
  /*  HTTP                                                                */
  /* ------------------------------------------------------------------ */

  async fetch(request) {
    const url = new URL(request.url);
    this.origin = url.origin;
    const path = url.pathname.replace(/\/+$/, '') || '/';
    try {
      if (request.method === 'GET' || request.method === 'HEAD') {
        if (path === '/') return this.page(url);
        if (path === '/setup') return html(ASSETS.setup, { 'Cache-Control': 'no-store' });
        if (path === '/healthz') return json({ ok: true, version: this.app.version, paired: this.paired() });
        const asset = ASSETS.files[path];
        if (asset) return new Response(asset.body, { headers: Object.assign({ 'Content-Type': asset.type, 'Cache-Control': asset.cache }, SECURITY_HEADERS) });
        return new Response('ไม่พบหน้านี้', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
      if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      const body = await readJson(request);
      if (body.adminKey !== undefined) body.adminKey = keyFrom(body.adminKey);
      if (path === '/api') return json(await this.handleApi(body));
      if (path === '/sync/apply') return json(this.handleSyncApply(body));
      if (path === '/setup/status') return json(await this.setupStatus(body));
      if (path === '/setup/pair') return json(await this.setupPair(body));
      if (path === '/setup/verify') return json(await this.setupVerify(body));
      if (path === '/setup/push') return json(await this.setupPush(body));
      return json({ ok: false, error: 'ไม่พบคำสั่งนี้' }, 404);
    } catch (e) {
      if (!e || !e.status || e.status >= 500) console.error(path, e && e.stack || e);
      return json({ ok: false, error: String(e && e.message || e) }, e && e.status || 500);
    }
  }

  page(url) {
    if (!this.paired()) return Response.redirect(this.origin + '/setup', 302);
    const vars = this.app.page(url.searchParams.get('key') || '');
    this.commit();
    const out = ASSETS.index
      .replace(/<\?!=\s*(\w+)\s*\?>/g, (m, k) => String(vars[k] == null ? '' : vars[k]))
      .replace(/<\?=\s*(\w+)\s*\?>/g, (m, k) => escapeHtml(vars[k]));
    return html(out, { 'Cache-Control': 'no-store' });
  }

  async handleApi(body) {
    if (!this.paired()) return { ok: false, error: 'ระบบยังไม่ได้ตั้งค่า — เปิด /setup เพื่อเชื่อมกับ Apps Script ก่อน' };
    const action = String(body.action || '');
    const payload = body.payload && typeof body.payload === 'object' ? body.payload : {};
    if (!this.app.isProxied(action)) {
      const res = this.app.api(action, payload);
      this.commit();
      return res;
    }
    // ใช้ Google Drive/อีเมล → ตรวจสิทธิ์ที่นี่ แล้วให้ Apps Script ทำแทน
    let role;
    try { role = this.app.roleFor(action, payload); }
    catch (e) {
      this.commit();
      const msg = String(e && e.message || e);
      return { ok: false, error: msg, needLogin: /เข้าสู่ระบบก่อน/.test(msg) };
    }
    this.commit();
    const clean = Object.assign({}, payload);
    delete clean._session; delete clean._key;
    const res = await this.callGas({ op: 'api', action, payload: clean, role });
    if (!res.ok) return { ok: false, error: res.error };
    return { ok: true, data: res.data };
  }

  handleSyncApply(body) {
    const secret = this.store.getProp('SYNC_SECRET');
    if (!secret || !safeEqual(body.secret, secret)) return { ok: false, error: 'รหัสเชื่อมต่อไม่ถูกต้อง' };
    const ops = Array.isArray(body.ops) ? body.ops : [];
    const n = this.applyFromPeer(ops);
    return { ok: true, applied: n };
  }

  /* ---------- /setup ---------- */

  /** กันเดากุญแจ: ผิด 8 ครั้งใน 15 นาที → พัก 15 นาที */
  guard(ok) {
    const s = this.store, now = Date.now();
    let g = {};
    try { g = JSON.parse(s.getProp('__setup_guard') || '{}'); } catch (e) { g = {}; }
    if (g.until && now < g.until) {
      const err = new Error('ใส่กุญแจผิดหลายครั้ง — รอ ' + Math.ceil((g.until - now) / 60000) + ' นาทีแล้วลองใหม่');
      err.status = 429; throw err;
    }
    if (ok === undefined) return;
    if (ok) { s.delProp('__setup_guard'); return; }
    if (!g.since || now - g.since > 15 * 60000) g = { since: now, n: 0 };
    g.n++;
    if (g.n >= 8) g.until = now + 15 * 60000;
    s.setProp('__setup_guard', JSON.stringify(g));
  }

  checkAdmin(body) {
    this.guard();
    const ok = this.paired() && this.app.adminKeyOk(body.adminKey);
    this.guard(ok);
    if (!ok) { const e = new Error('กุญแจกู้ระบบไม่ถูกต้อง'); e.status = 403; throw e; }
  }

  async setupStatus(body) {
    if (body && body.adminKey) { this.checkAdmin(body); return Object.assign({ ok: true }, this.status(true), { counts: this.counts() }); }
    return Object.assign({ ok: true }, this.status(false));
  }

  counts() {
    const out = {};
    if (!this.paired()) return out;
    for (const name of this.app.sheetNames()) {
      if (!this.app.syncable(name)) continue;
      out[name] = this.store.hasSheet(name) ? this.app.readRows(name).length : 0;
    }
    return out;
  }

  /**
   * จับคู่กับ Apps Script แล้วย้ายข้อมูลทั้งหมดมาตั้งต้น
   * @param {{gasUrl:string, adminKey:string}} body
   */
  async setupPair(body) {
    const gasUrl = String(body.gasUrl || '').trim();
    const adminKey = String(body.adminKey || '').trim();
    if (!validGasUrl(gasUrl, this.env)) {
      return { ok: false, error: 'ที่อยู่ Apps Script ไม่ถูกต้อง — ต้องเป็นลิงก์ https://script.google.com/macros/s/…/exec' };
    }
    if (!adminKey) return { ok: false, error: 'กรุณาใส่กุญแจกู้ระบบ' };
    this.guard();
    if (this.paired()) {
      // จับคู่ใหม่ = ดึงข้อมูลจาก Apps Script มาทับ — ต้องส่งของที่ค้างให้ถึงก่อน ไม่งั้นการแก้ล่าสุดหาย
      this.checkAdmin(body);
      await this.deliver();
      if (this.store.outboxCount() > 0) {
        return { ok: false, error: 'ยังมีการเปลี่ยนแปลงที่ส่งไป Apps Script ไม่สำเร็จ ' + this.store.outboxCount() + ' ชุด — แก้การเชื่อมต่อให้ส่งได้ก่อน แล้วค่อยดึงข้อมูลใหม่' };
      }
    }
    if (this.pairing) return { ok: false, error: 'กำลังย้ายข้อมูลอยู่ รอสักครู่' };
    this.pairing = true;
    try {
      const p = await this.callGas({ op: 'pair', adminKey, cfUrl: this.origin }, gasUrl);
      if (!p.ok) {
        if (/กุญแจ/.test(p.error || '')) this.guard(false);
        return { ok: false, error: p.error };
      }
      this.guard(true);
      const exp = await this.callGas({ op: 'export', secret: p.secret }, gasUrl);
      if (!exp.ok) return { ok: false, error: 'ดึงข้อมูลจาก Apps Script ไม่สำเร็จ: ' + exp.error };
      if (Number(exp.schemaVersion) !== Number(this.app.schemaVersion)) {
        return { ok: false, error: 'โค้ดสองฝั่งเป็นคนละรุ่น (Apps Script รุ่น ' + exp.version + ' / Cloudflare รุ่น ' +
          this.app.version + ') — อัปเดตโค้ดใน Apps Script ให้เป็นรุ่นล่าสุดแล้ว Deploy ใหม่ก่อน' };
      }
      const t = Date.now();
      this.store.wipeData();
      this.boot();
      this.store.setProp('SYNC_SECRET', p.secret);
      this.store.setProp('GAS_URL', gasUrl);
      this.store.setProp('GAS_SHEET_URL', p.sheetUrl || '');
      this.store.setProp('SCHEMA_VERSION', String(exp.schemaVersion));
      this.store.setProp('__setup_paired_at', stamp());
      this.store.delProp('SYNC_LAST_ERROR');
      const ops = Object.keys(exp.sheets || {}).map(name => ({ s: name, all: exp.sheets[name], t }));
      this.app.applyOps(ops);
      this.app.ensureAll();
      this.app.log('ย้ายข้อมูลจาก Apps Script มา Cloudflare', gasUrl, '');
      this.commit();
      return { ok: true, counts: this.counts(), gasVersion: exp.version, version: this.app.version };
    } finally {
      this.pairing = false;
    }
  }

  /** เทียบข้อมูลสองฝั่งทีละแถว + ตัวเลขสรุปบนหน้าระบบ */
  async setupVerify(body) {
    this.checkAdmin(body);
    await this.deliver();
    const exp = await this.callGas({ op: 'export' });
    if (!exp.ok) return { ok: false, error: 'ดึงข้อมูลจาก Apps Script ไม่สำเร็จ: ' + exp.error };
    const mine = this.app.exportAll().sheets;
    const theirs = exp.sheets || {};
    const sheets = [];
    let allSame = true;
    for (const name of Object.keys(mine)) {
      const a = mine[name] || [], b = theirs[name] || [];
      const row = { name, cf: a.length, gas: b.length, same: true, diff: [] };
      if (name === this.app.logName) {
        row.note = 'ประวัติการแก้ไข — เทียบจำนวนอย่างเดียว';
        row.same = true;
      } else {
        const key = this.app.syncKey(name);
        const ma = new Map(a.map(r => [String(r[key]), canon(r)]));
        const mb = new Map(b.map(r => [String(r[key]), canon(r)]));
        for (const [k, v] of ma) if (mb.get(k) !== v) row.diff.push(mb.has(k) ? 'ต่างกัน: ' + k : 'มีเฉพาะ Cloudflare: ' + k);
        for (const k of mb.keys()) if (!ma.has(k)) row.diff.push('มีเฉพาะ Apps Script: ' + k);
        row.same = row.diff.length === 0 && a.length === b.length;
        row.diff = row.diff.slice(0, 20);
      }
      if (!row.same) allSame = false;
      sheets.push(row);
    }
    // ตัวเลขบนหน้าจอ: รันโค้ดชุดเดียวกันกับข้อมูลของอีกฝั่ง (ในหน่วยความจำ) แล้วเทียบผลทุกตัว
    const other = memoryApp(theirs, exp.schemaVersion);
    const fa = this.app.figures(), fb = other.figures();
    const figures = Object.keys(fa).map(name => ({ name, same: canon(fa[name]) === canon(fb[name]) }));
    if (figures.some(f => !f.same)) allSame = false;
    return { ok: true, allSame, sheets, figures, headline: { cf: this.app.headline(), gas: other.headline() } };
  }

  /** ส่งข้อมูลทั้งหมดของฝั่งนี้ไปทับ Apps Script (ใช้ซ่อมเมื่อตรวจแล้วไม่ตรง) */
  async setupPush(body) {
    this.checkAdmin(body);
    const t = Date.now();
    const sheets = this.app.exportAll().sheets;
    const ops = Object.keys(sheets).filter(n => n !== this.app.logName).map(name => ({ s: name, all: sheets[name], t }));
    this.store.pending.push(ops);
    this.commit();
    await this.deliver();
    return { ok: this.store.outboxCount() === 0, pending: this.store.outboxCount(),
             error: this.store.outboxCount() ? (this.store.getProp('SYNC_LAST_ERROR') || 'ยังส่งไม่สำเร็จ') : '' };
  }
}

/* ------------------------------------------------------------------ */
/*  ตัวช่วย                                                             */
/* ------------------------------------------------------------------ */

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer'   // ลิงก์มีกุญแจอยู่ใน ?key= — ห้ามติดไปกับลิงก์ที่กดออกไปเว็บอื่น
};

function html(body, extra) {
  return new Response(body, { headers: Object.assign({ 'Content-Type': 'text/html; charset=utf-8' }, SECURITY_HEADERS, extra || {}) });
}
function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, SECURITY_HEADERS)
  });
}
async function readJson(request) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > MAX_BODY) { const e = new Error('ข้อมูลใหญ่เกินไป'); e.status = 413; throw e; }
  const text = await request.text();
  if (text.length > MAX_BODY) { const e = new Error('ข้อมูลใหญ่เกินไป'); e.status = 413; throw e; }
  try { const v = JSON.parse(text || '{}'); return v && typeof v === 'object' ? v : {}; }
  catch (e) { return {}; }
}
/** รับได้ทั้งกุญแจเปล่า ๆ และลิงก์กู้ระบบทั้งเส้น (…/exec?key=XXXX) — ตัดเอาเฉพาะกุญแจ */
function keyFrom(v) {
  const s = String(v == null ? '' : v).trim();
  const m = s.match(/[?&]key=([A-Za-z0-9_-]+)/);
  return m ? m[1] : s;
}
function escapeHtml(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
function safeEqual(a, b) {
  a = String(a || ''); b = String(b || '');
  if (!a || a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}
function stamp() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Bangkok', dateStyle: 'short', timeStyle: 'medium' }).format(new Date());
}
function validGasUrl(u, env) {
  if (/^https:\/\/script\.google\.com\/(a\/[^/]+\/)?macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/.test(u)) return true;
  // ทดสอบในเครื่อง (wrangler dev) เท่านั้น — ตั้งไว้ใน .dev.vars ไม่ได้ตั้งบนระบบจริง
  return !!(env && env.ALLOW_TEST_PEER === '1' && /^http:\/\/(127\.0\.0\.1|localhost):\d+\/[\w/-]*$/.test(u));
}
/** เรียงคีย์ให้เหมือนกันก่อนเทียบ */
function canon(v) {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  return JSON.stringify(v === undefined ? null : v);
}

/** ตัวรันโค้ดชุดเดียวกันบนข้อมูลในหน่วยความจำ — ใช้คำนวณตัวเลขของอีกฝั่งเพื่อเทียบ */
export function memoryApp(sheets, schemaVersion) {
  const mem = new MemorySql();
  const store = new Store(mem, null);
  let app;
  const host = {
    loadSheet: n => store.loadSheet(n), createSheet: n => store.createSheet(n), touchSheet: n => store.touchSheet(n),
    sheetNames: () => store.sheetNames(), getProp: k => store.getProp(k), setProp: (k, v) => store.setProp(k, v),
    delProp: k => store.delProp(k), origin: () => '', enqueue: () => {}, kick: () => {}, dataVersion: () => 0,
    syncStatus: () => ({})
  };
  app = createApp(host);
  store.makeDate = app.makeDate;
  store.setProp('SCHEMA_VERSION', String(schemaVersion));
  app.applyOps(Object.keys(sheets).map(name => ({ s: name, all: sheets[name], t: 0 })));
  return app;
}

/** SQL ปลอมแบบเล็กที่สุดสำหรับ memoryApp (รองรับเฉพาะคำสั่งที่ Store ใช้) */
class MemorySql {
  constructor() { this.t = { sheets: [], cells: new Map(), props: new Map() }; }
  exec(q, ...b) {
    const t = this.t, s = q.trim();
    const res = rows => ({ toArray: () => rows });
    if (/^CREATE/i.test(s)) return res([]);
    if (s.startsWith('SELECT 1 FROM sheets')) return res(t.sheets.some(x => x.name === b[0]) ? [{ 1: 1 }] : []);
    if (s.startsWith('SELECT COALESCE(MAX(ord)')) return res([{ n: t.sheets.length + 1 }]);
    if (s.startsWith('INSERT INTO sheets')) { t.sheets.push({ name: b[0], ord: b[1] }); return res([]); }
    if (s.startsWith('SELECT name FROM sheets')) return res(t.sheets.slice());
    if (s.startsWith('SELECT r, v FROM cells')) {
      const m = t.cells.get(b[0]) || new Map();
      return res([...m.entries()].sort((x, y) => x[0] - y[0]).map(([r, v]) => ({ r, v })));
    }
    if (s.startsWith('INSERT OR REPLACE INTO cells')) {
      if (!t.cells.has(b[0])) t.cells.set(b[0], new Map());
      t.cells.get(b[0]).set(b[1], b[2]); return res([]);
    }
    if (s.startsWith('DELETE FROM cells WHERE sheet')) {
      const m = t.cells.get(b[0]); if (m) for (const r of [...m.keys()]) if (r >= b[1]) m.delete(r);
      return res([]);
    }
    if (s.startsWith('SELECT k, v FROM props')) return res([...t.props.entries()].map(([k, v]) => ({ k, v })));
    if (s.startsWith('INSERT OR REPLACE INTO props')) { t.props.set(b[0], b[1]); return res([]); }
    if (s.startsWith('DELETE FROM props')) { t.props.delete(b[0]); return res([]); }
    if (/rowmeta|outbox/.test(s)) return res(/COUNT/.test(s) ? [{ n: 0 }] : []);
    throw new Error('MemorySql: ไม่รองรับ ' + s.slice(0, 60));
  }
}
