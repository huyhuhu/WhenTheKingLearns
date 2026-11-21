// He thong thanh tuu, Uy vong, Chieu chi va Nghi su. Cu phap ES5.
(function () {
  'use strict';

  var App = window.App, T = App.T, L = App.L, h = App.h, jp = App.jp;
  var DATA = window.KANJI_DATA || {};
  var DEVICE_KEY = 'wtkl.device';
  var SOUND_KEY = 'wtkl.kingsound';
  var RANK_SEEN_KEY = 'wtkl.rankseen';
  var KEEP_DAYS = 60;
  var RARITY_XP = [20, 50, 150, 500];
  var RARITY = [['Thường', 'Common'], ['Hiếm', 'Rare'], ['Sử thi', 'Epic'], ['Huyền thoại', 'Legendary']];
  var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

  // ---------- tien ich ----------
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function dkey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseKey(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function today() { return dkey(new Date()); }
  function monday(d) { return addDays(d, -((d.getDay() + 6) % 7)); }
  function wkey(d) { return dkey(monday(d)); }
  function keys(o) { return o ? Object.keys(o) : []; }
  function size(o) { return keys(o).length; }
  function fmt(n) { return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, App.isEn() ? ',' : '.'); }
  function hash(s) {
    var x = 2166136261;
    for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = (x * 16777619) >>> 0; }
    return x;
  }
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul ? Math.imul(t ^ (t >>> 15), t | 1) : (t ^ (t >>> 15)) * (t | 1);
      t ^= t + (Math.imul ? Math.imul(t ^ (t >>> 7), t | 61) : (t ^ (t >>> 7)) * (t | 61));
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function readLocal(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function writeLocal(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* che do an danh */ } }

  var deviceId = readLocal(DEVICE_KEY);
  if (!deviceId) {
    deviceId = 'd' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
    writeLocal(DEVICE_KEY, deviceId);
  }

  // ---------- du lieu ----------
  function blank() {
    return {
      dev: {}, seen: {}, best: {}, qmin: {}, h6: {}, flags: {}, unlocked: {},
      seed: [Math.floor(Math.random() * 1e9), Date.now()],
      qsel: {}, reroll: {}, quests: {}, wsel: {}, wreroll: {}, wquests: {},
      title: null, hanko: null, seenAch: 0
    };
  }
  function S() {
    var p = App.progress();
    if (!p.king) p.king = blank();
    var k = p.king, b = blank();
    for (var f in b) if (k[f] === undefined) k[f] = b[f];
    return k;
  }
  function me() {
    var k = S();
    if (!k.dev[deviceId]) k.dev[deviceId] = { c: {}, xp: {}, day: {}, run: {} };
    var d = k.dev[deviceId];
    if (!d.run) d.run = {};
    return d;
  }
  function myDay() {
    var d = me(), t = today();
    if (!d.day[t]) d.day[t] = { xs: {} };
    return d.day[t];
  }
  function seenSet(name) { var s = S().seen; if (!s[name]) s[name] = {}; return s[name]; }
  function flag(name) { var f = S().flags; if (!f[name]) f[name] = Date.now(); }

  // Gop: so lon nhat cho bo dem cung thiet bi, hop cho tap hop, som nhat cho moc thoi gian.
  function mergeMax(a, b) {
    if (a === undefined) return b;
    if (b === undefined) return a;
    if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
    if (a && b && typeof a === 'object' && typeof b === 'object' && !(a instanceof Array)) {
      var out = {}, k;
      for (k in a) out[k] = a[k];
      for (k in b) out[k] = mergeMax(a[k], b[k]);
      return out;
    }
    return a;
  }
  function mergeMin(a, b) {
    var out = {}, k;
    for (k in a || {}) out[k] = a[k];
    for (k in b || {}) out[k] = out[k] === undefined ? b[k] : Math.min(out[k], b[k]);
    return out;
  }
  function mergeStamp(a, b, newest) {
    var out = {}, k;
    for (k in a || {}) out[k] = a[k];
    for (k in b || {}) {
      if (!out[k]) { out[k] = b[k]; continue; }
      var ta = out[k][out[k].length - 1], tb = b[k][b[k].length - 1];
      if (newest ? tb > ta : tb < ta) out[k] = b[k];
    }
    return out;
  }
  function mergeLists(a, b) {
    var out = {}, k, i;
    for (k in a || {}) out[k] = a[k].slice();
    for (k in b || {}) {
      if (!out[k]) out[k] = [];
      for (i = 0; i < b[k].length; i++) if (out[k].indexOf(b[k][i]) < 0) out[k].push(b[k][i]);
    }
    return out;
  }
  function pick(a, b, newest) {
    if (!a) return b || null;
    if (!b) return a;
    return (newest ? b[1] > a[1] : b[1] < a[1]) ? b : a;
  }
  function prune(k) {
    var limit = dkey(addDays(new Date(), -KEEP_DAYS));
    for (var id in k.dev) {
      var day = k.dev[id].day || {};
      for (var d in day) if (d < limit) delete day[d];
    }
    return k;
  }
  function mergeKing(a, b) {
    if (!a) return b ? prune(b) : b;
    if (!b) return prune(a);
    return prune({
      dev: mergeMax(a.dev, b.dev),
      seen: mergeMax(a.seen, b.seen),
      best: mergeMax(a.best, b.best),
      qmin: mergeMin(a.qmin, b.qmin),
      h6: mergeMax(a.h6, b.h6),
      flags: mergeMin(a.flags, b.flags),
      unlocked: mergeMin(a.unlocked, b.unlocked),
      seed: pick(a.seed, b.seed, false),
      qsel: mergeStamp(a.qsel, b.qsel, false),
      reroll: mergeStamp(a.reroll, b.reroll, false),
      quests: mergeLists(a.quests, b.quests),
      wsel: mergeStamp(a.wsel, b.wsel, false),
      wreroll: mergeStamp(a.wreroll, b.wreroll, false),
      wquests: mergeLists(a.wquests, b.wquests),
      title: pick(a.title, b.title, true),
      hanko: pick(a.hanko, b.hanko, true),
      seenAch: Math.max(a.seenAch || 0, b.seenAch || 0)
    });
  }
  App.addMerger('king', mergeKing);

  // ---------- thong ke tong hop ----------
  function sumCounters() {
    var out = {}, dev = S().dev;
    for (var id in dev) for (var k in dev[id].c) out[k] = (out[k] || 0) + dev[id].c[k];
    return out;
  }
  function combineDay(acc, d) {
    for (var k in d) {
      if (k === 'xs') continue;
      var v = d[k];
      if (typeof v === 'number') acc[k] = k.indexOf('mx') === 0 ? Math.max(acc[k] || 0, v) : (acc[k] || 0) + v;
      else if (v && typeof v === 'object') { if (!acc[k]) acc[k] = {}; for (var x in v) acc[k][x] = 1; }
    }
    return acc;
  }
  function dayStats(date) {
    var acc = {}, dev = S().dev;
    for (var id in dev) if (dev[id].day && dev[id].day[date]) combineDay(acc, dev[id].day[date]);
    return acc;
  }
  function studyDays() {
    var set = {}, dev = S().dev;
    for (var id in dev) for (var d in dev[id].xp) if (dev[id].xp[d] > 0) set[d] = 1;
    return keys(set).sort();
  }
  function runs(list) {
    var best = 0, cur = 0, prev = null;
    for (var i = 0; i < list.length; i++) {
      var d = parseKey(list[i]);
      cur = prev && dkey(addDays(prev, 1)) === list[i] ? cur + 1 : 1;
      best = Math.max(best, cur);
      prev = d;
    }
    return best;
  }
  function currentStreak(days) {
    var set = {}, n = 0, d = new Date();
    for (var i = 0; i < days.length; i++) set[days[i]] = 1;
    if (!set[dkey(d)]) d = addDays(d, -1);
    while (set[dkey(d)]) { n++; d = addDays(d, -1); }
    return n;
  }

  // ---------- Uy vong va bac ----------
  var RANKS = [
    [0, 'Hoàng tử nhỏ', 'Little Prince', '幼き王子'],
    [100, 'Hoàng tử', 'Prince', '王子'],
    [300, 'Thái tử', 'Crown Prince', '太子'],
    [700, 'Tân vương', 'New King', '新王'],
    [1500, 'Quốc vương', 'King', '国王'],
    [3000, 'Hiền vương', 'Wise King', '賢王'],
    [6000, 'Đại vương', 'Great King', '大王'],
    [12000, 'Thánh vương', 'Sage King', '聖王'],
    [25000, 'Thiên tử', 'Son of Heaven', '天子'],
    [50000, 'Vạn thế chi vương', 'King for Ten Thousand Ages', '万世の王']
  ];
  var HANKO = [
    { id: 'son', rank: 0, bg: '#c2452d', fg: '#fffdf8', name: ['Đỏ son', 'Vermilion'] },
    { id: 'lam', rank: 2, bg: '#2b6f8f', fg: '#fffdf8', name: ['Lam ngọc', 'Sapphire'] },
    { id: 'kim', rank: 4, bg: '#b8860b', fg: '#fffdf8', name: ['Vàng kim', 'Gold'] },
    { id: 'luc', rank: 6, bg: '#2f7d55', fg: '#fffdf8', name: ['Lục bảo', 'Emerald'] },
    { id: 'tim', rank: 8, bg: '#6b3fa0', fg: '#fffdf8', name: ['Tím hoàng bào', 'Royal purple'] },
    { id: 'den', rank: 9, bg: '#1b1b1f', fg: '#e6c35c', name: ['Mực đen viền vàng', 'Ink and gold'] }
  ];
  var CAP = { flip: 100, right: 300, quiz: 100, perfect: 150, listen: 30, vright: 200 };

  function questXp() {
    var k = S(), xp = 0, d, i;
    for (d in k.quests) {
      for (i = 0; i < k.quests[d].length; i++) xp += QUEST_BY_ID[k.quests[d][i]] ? QUEST_BY_ID[k.quests[d][i]].xp : 0;
      if (k.quests[d].length >= 3) xp += 50;
    }
    for (d in k.wquests) xp += k.wquests[d].length * 100 + (k.wquests[d].length >= 3 ? 150 : 0);
    return xp;
  }
  function achXp() {
    var xp = 0, u = S().unlocked;
    for (var id in u) if (ACH_BY_ID[id]) xp += RARITY_XP[ACH_BY_ID[id].r];
    return xp;
  }
  function totalXp() {
    var k = S(), xp = 0, id, d;
    for (id in k.dev) for (d in k.dev[id].xp) xp += k.dev[id].xp[d];
    xp += 10 * size(k.seen.kn) + 2 * size(k.seen.view) + 100 * size(k.seen.perf);
    var vs = vocabStats();
    xp += 5 * vs.learned + 5 * vs.burned;
    return xp + achXp() + questXp();
  }
  function rankOf(xp) {
    var r = 0;
    for (var i = 0; i < RANKS.length; i++) if (xp >= RANKS[i][0]) r = i;
    return r;
  }
  function rankName(r) { return L([RANKS[r][1], RANKS[r][2]]); }

  // Cong Uy vong lap lai (co gioi han ngay); Uy vong mot lan duoc tinh tu tap hop.
  function addXp(src, n) {
    var day = myDay(), dev = me(), t = today();
    if (CAP[src] !== undefined) {
      var used = day.xs[src] || 0;
      n = Math.max(0, Math.min(n, CAP[src] - used));
      day.xs[src] = used + n;
    }
    if (n <= 0) return;
    dev.xp[t] = (dev.xp[t] || 0) + n;
    day.xpd = (day.xpd || 0) + n;
  }
  function dayXp(n) { var day = myDay(); day.xpd = (day.xpd || 0) + n; }

  // Goi o moi hoat dong hoc: thuong ngay moi, chuoi ngay va cac moc thoi gian.
  function learn() {
    var dev = me(), t = today(), now = new Date(), hr = now.getHours();
    var days = studyDays(), studied = days.indexOf(t) >= 0;
    if (!studied) {
      var prev = days.length ? days[days.length - 1] : null;
      if (prev && (parseKey(t) - parseKey(prev)) / 864e5 >= 7) flag('D13');
      var streak = currentStreak(days) + 1;
      dev.xp[t] = (dev.xp[t] || 0) + 5 + Math.min(streak, 30);
      dayXp(5 + Math.min(streak, 30));
    }
    if (hr < 3) { flag('T2'); seenSet('night')[t] = 1; }
    if (hr >= 4 && hr < 6) { flag('T1'); if (seenSet('night')[t]) flag('H7'); }
    if (hr >= 11 && hr < 13) flag('T3');
    if (now.getDay() === 0 && now.getDate() <= 7 && (now.getMonth() === 6 || now.getMonth() === 11)) flag('T4');
    if (now.getMonth() === 0 && now.getDate() === 1) flag('T5');
  }
  function inc(name, n) { var c = me().c; c[name] = (c[name] || 0) + (n || 1); }
  function dayInc(name, n) { var d = myDay(); d[name] = (d[name] || 0) + (n || 1); }
  function dayMax(name, v) { var d = myDay(); d[name] = Math.max(d[name] || 0, v); }
  function daySet(name, key) { var d = myDay(); if (!d[name]) d[name] = {}; d[name][key] = 1; }

  // ---------- noi dung hoc ----------
  function levels() { return keys(DATA); }
  function allSessions() {
    var out = [];
    for (var id in DATA) for (var i = 0; i < DATA[id].sessions.length; i++) out.push({ key: id + '-' + (i + 1), list: DATA[id].sessions[i] });
    return out;
  }
  function n5() { return DATA.n5 || { sessions: [], kanji: {} }; }
  function knownCount(list) { return App.countKnown(list); }
  function allKanji() { var out = []; for (var id in DATA) out = out.concat(keys(DATA[id].kanji)); return out; }
  function audioCount() { return size(window.AUDIO_SET); }
  function maxStrokeKanji() {
    var K = n5().kanji, mx = 0, out = [], k;
    for (k in K) mx = Math.max(mx, K[k].strokes);
    for (k in K) if (K[k].strokes === mx) out.push(k);
    return out;
  }
  function normReading(r) { return window.Speech ? window.Speech.norm(r) : r; }
  function vocabWords() { var v = window.VOCAB_DATA && window.VOCAB_DATA.n5; return v ? v.words : []; }
  function vocabRecs() { var v = App.progress().vocab; return v && v.w ? v.w : {}; }
  // Bac 5 la Binh si, bac 9 la Trung than dien (khop voi js/vocab.js)
  function vocabStats() {
    var W = vocabWords(), R = vocabRecs(), out = { total: W.length, learned: 0, burned: 0, gia: 0, giaOk: 0, suOk: 0, daijoubu: 0 };
    for (var i = 0; i < W.length; i++) {
      var w = W[i], r = R[w[0] + '|' + w[1]], st = r ? r[0] : 0, tags = ' ' + w[9] + ' ';
      if (r) out.learned++;
      if (st >= 9) out.burned++;
      if (tags.indexOf(' gia ') >= 0) { out.gia++; if (st >= 5) out.giaOk++; }
      if (st >= 5 && tags.indexOf(' su ') >= 0) out.suOk++;
      if (w[0] === '大丈夫') out.daijoubu = st;
    }
    return out;
  }

  // ---------- ngu canh danh gia ----------
  function context() {
    var k = S(), days = studyDays(), c = sumCounters(), sess = allSessions(), i;
    var ctx = { k: k, c: c, days: days, sess: sess };
    ctx.known = knownCount(allKanji());
    ctx.n5known = knownCount(keys(n5().kanji));
    ctx.sessDone = 0; ctx.n5SessDone = 0;
    for (i = 0; i < sess.length; i++) {
      if (knownCount(sess[i].list) === sess[i].list.length) { ctx.sessDone++; if (sess[i].key.indexOf('n5-') === 0) ctx.n5SessDone++; }
    }
    ctx.bestStreak = runs(days);
    ctx.streak = currentStreak(days);
    ctx.weekdays = {};
    ctx.weekend = 0;
    var set = {};
    for (i = 0; i < days.length; i++) {
      var d = parseKey(days[i]);
      set[days[i]] = 1;
      ctx.weekdays[d.getDay()] = 1;
    }
    for (i = 0; i < days.length; i++) if (parseKey(days[i]).getDay() === 6 && set[dkey(addDays(parseKey(days[i]), 1))]) ctx.weekend = 1;
    ctx.maxDayXp = 0;
    for (var id in k.dev) for (var dd in k.dev[id].day) ctx.maxDayXp = Math.max(ctx.maxDayXp, dayStats(dd).xpd || 0);
    var full = [];
    for (var q in k.quests) if (k.quests[q].length >= 3) full.push(q);
    full.sort();
    ctx.fullDays = full.length;
    ctx.fullRun = runs(full);
    var weeks = [];
    for (var w in k.wquests) if (k.wquests[w].length >= 3) weeks.push(w);
    weeks.sort();
    ctx.fullWeeks = weeks.length;
    var wr = 0, wbest = 0, prev = null;
    for (i = 0; i < weeks.length; i++) {
      wr = prev && dkey(addDays(parseKey(prev), 7)) === weeks[i] ? wr + 1 : 1;
      wbest = Math.max(wbest, wr); prev = weeks[i];
    }
    ctx.weekRun = wbest;
    ctx.unlockedCount = size(k.unlocked);
    ctx.remainingKanji = allKanji().length - ctx.known;
    ctx.v = vocabStats();
    return ctx;
  }

  // ---------- thanh tuu ----------
  var CATS = [
    ['宝', 'Kho báu', 'Treasury'], ['璽', 'Bộ sưu tập', 'Collections'], ['学', 'Học viện', 'Academy'],
    ['闘', 'Đấu trường', 'Arena'], ['札', 'Thư khố', 'Archive'], ['筆', 'Thư pháp', 'Calligraphy'],
    ['音', 'Âm luật', 'Sound'], ['律', 'Kỷ luật', 'Discipline'], ['時', 'Thời khắc', 'Moments'],
    ['交', 'Ngoại giao', 'Diplomacy'], ['宮', 'Cung điện', 'Palace'], ['令', 'Chiếu chỉ', 'Decrees'],
    ['民', 'Thần dân', 'Subjects'], ['秘', 'Bí mật', 'Secrets']
  ];
  var ACH = [];
  var ACH_BY_ID = {};
  function def(id, cat, g, r, name, desc, val, goal, hint) {
    var a = { id: id, cat: cat, g: g || id, r: r, name: name, desc: desc, val: val, goal: goal, hint: hint };
    ACH.push(a); ACH_BY_ID[id] = a;
  }
  function tier(prefix, start, cat, g, rs, goals, name, descFn, val) {
    for (var i = 0; i < goals.length; i++) {
      def(prefix + (start + i), cat, g, rs[i], [name[0] + ' ' + ROMAN[i], name[1] + ' ' + ROMAN[i]], descFn(goals[i]), val, goals[i]);
    }
  }
  function goalOf(a) { return typeof a.goal === 'function' ? a.goal() : a.goal; }
  function fl(name) { return function (x) { return x.k.flags[name] ? 1 : 0; }; }
  function cnt(name) { return function (x) { return x.c[name] || 0; }; }
  function seenSize(name) { return function (x) { return size(x.k.seen[name]); }; }
  function n5Len() { return keys(n5().kanji).length; }
  function n5Sessions() { return n5().sessions.length; }

  tier('K', 1, 0, 'K', [0, 0, 1, 1], [1, 10, 25, 50], ['Kho báu Hán tự', 'Kanji Treasury'],
    function (n) { return ['Thuộc ' + n + ' chữ', 'Learn ' + n + ' kanji']; }, function (x) { return x.known; });
  ACH[0].name = ['Nét bút đầu tiên', 'First Stroke'];
  ACH[1].name = ['Túi ngọc nhỏ', 'Pouch of Jewels'];
  ACH[2].name = ['Rương báu', 'Treasure Chest'];
  ACH[3].name = ['Kho bạc hoàng gia', 'Royal Treasury'];
  def('K5', 0, 'K', 2, ['Chủ nhân N5', 'Master of N5'], ['Thuộc toàn bộ chữ N5', 'Learn every N5 kanji'], function (x) { return x.n5known; }, n5Len);

  var SETS = [
    ['Ngũ hành', 'Five Elements', '火水木金土', 0], ['Bảy ngày của vương quốc', 'Seven Days of the Realm', '日月火水木金土', 1],
    ['Đếm đến mười', 'Counting to Ten', '一二三四五六七八九十', 0], ['Quốc khố', 'State Coffers', '百千万円', 0],
    ['Tứ phương', 'Four Directions', '東西南北', 0], ['Định vị thiên hạ', 'Lay of the Land', '上下左右中外', 0],
    ['Hoàng tộc', 'Royal Family', '父母子男女人', 0], ['Long thể', 'The Royal Body', '口目耳手足', 0],
    ['Sơn hà xã tắc', 'Mountains and Rivers', '山川天気雨空花魚', 1], ['Người giữ thời gian', 'Keeper of Time', '年月日時分半間週毎今午前後', 1],
    ['Thánh chỉ', 'Royal Proclamations', '言話語読書聞', 0], ['Ngự giá', 'Royal Procession', '行来出入立休', 0],
    ['Âm dương cân bằng', 'Yin and Yang', '大小多少高安新古', 1], ['Quốc tử giám', 'Imperial Academy', '学校生先本名', 0],
    ['Kinh thành', 'The Capital', '店駅車道電国社会', 1], ['Ngự thiện', 'Royal Banquet', '食飲買', 0]
  ];
  function setDone(chars) { return knownCount(chars.split('')) === chars.length; }
  SETS.forEach(function (s, i) {
    var spaced = s[2].split('').join(' ');
    def('S' + (i + 1), 1, null, s[3], [s[0], s[1]], ['Thuộc trọn: ' + spaced, 'Learn all of: ' + spaced],
      function () { return knownCount(s[2].split('')); }, s[2].length);
  });
  def('S17', 1, null, 2, ['Ngọc tỷ truyền quốc', 'Imperial Seal'], ['Hoàn thành cả 16 bộ sưu tập', 'Complete all 16 collections'],
    function () { var n = 0; for (var i = 0; i < SETS.length; i++) if (setDone(SETS[i][2])) n++; return n; }, 16);

  def('A1', 2, 'A', 0, ['Tốt nghiệp I', 'Graduate I'], ['Thuộc hết chữ của 1 buổi', 'Learn every kanji of 1 session'], function (x) { return x.sessDone; }, 1);
  def('A2', 2, 'A', 1, ['Tốt nghiệp II', 'Graduate II'], ['Thuộc hết chữ của 3 buổi', 'Learn every kanji of 3 sessions'], function (x) { return x.sessDone; }, 3);
  def('A3', 2, 'A', 2, ['Tốt nghiệp III', 'Graduate III'], ['Thuộc hết chữ của mọi buổi N5', 'Learn every kanji of all N5 sessions'], function (x) { return x.n5SessDone; }, n5Sessions);
  def('A4', 2, null, 0, ['Học toàn diện', 'Well-Rounded'], ['Dùng đủ 4 chế độ học trong cùng một buổi', 'Use all 4 study modes in one session'],
    function (x) { var m = x.k.seen.modes || {}, best = 0; for (var s in m) best = Math.max(best, size(m[s])); return Math.min(best, 4); }, 4);
  def('A5', 2, null, 0, ['Người tò mò', 'Curious Mind'], ['Mở trang chi tiết của mọi chữ trong một buổi', 'Open the details of every kanji in a session'],
    function (x) {
      var v = x.k.seen.view || {};
      for (var i = 0; i < x.sess.length; i++) {
        var all = true;
        for (var j = 0; j < x.sess[i].list.length; j++) if (!v[x.sess[i].list[j]]) { all = false; break; }
        if (all) return 1;
      }
      return 0;
    }, 1);
  def('A6', 2, null, 0, ['Đọc vạn quyển', 'Well-Read'], ['Mở trang Từ vựng đi kèm của mọi buổi N5', 'Open the vocabulary page of every N5 session'],
    function (x) { var n = 0; for (var s in x.k.seen.vocab || {}) if (s.indexOf('n5-') === 0) n++; return n; }, n5Sessions);
  def('A7', 2, null, 0, ['Tự vấn', 'Self-Examination'], ['Ở chế độ ẩn nghĩa, chạm xem lại 30 từ', 'Reveal 30 hidden words'], cnt('reveal'), 30);

  tier('Q', 1, 3, 'Q', [0, 0, 1, 2, 3], [1, 10, 50, 100, 300], ['Chiến binh đấu trường', 'Arena Warrior'],
    function (n) { return ['Hoàn thành ' + n + ' bài trắc nghiệm', 'Finish ' + n + ' quizzes']; }, cnt('quiz'));
  tier('Q', 6, 3, 'QR', [0, 0, 1, 2, 3], [50, 200, 500, 1000, 3000], ['Kiếm sĩ', 'Swordsman'],
    function (n) { return ['Tổng ' + n + ' câu trắc nghiệm đúng', n + ' correct quiz answers']; }, cnt('right'));
  def('Q11', 3, null, 1, ['Bách phát bách trúng', 'Hundred Hits'], ['Một bài trắc nghiệm đạt 100%', 'Score 100% on a quiz'], function (x) { return size(x.k.seen.perf) ? 1 : 0; }, 1);
  def('Q12', 3, null, 2, ['Toàn thắng N5', 'Undefeated in N5'], ['Đạt 100% ở mọi buổi N5', 'Score 100% in every N5 session'],
    function (x) { var n = 0; for (var s in x.k.seen.perf || {}) if (s.indexOf('n5-') === 0) n++; return n; }, n5Sessions);
  tier('Q', 13, 3, 'QC', [0, 1, 2, 3], [10, 25, 50, 100], ['Liên hoàn kiếm', 'Chain Blade'],
    function (n) { return ['Chuỗi ' + n + ' câu đúng liên tiếp', n + ' correct answers in a row']; }, function (x) { return x.k.best.chain || 0; });
  def('Q17', 3, null, 1, ['Thần tốc', 'Lightning'], ['Một bài đạt từ 90% trong dưới 2 phút', 'Score 90%+ on a quiz in under 2 minutes'], fl('Q17'), 1);
  def('Q18', 3, null, 1, ['Quật khởi', 'Comeback'], ['Làm lại một buổi từng đạt dưới 50% và đạt từ 90%', 'Retake a session once scored under 50% and score 90%+'], fl('Q18'), 1);
  def('Q19', 3, null, 1, ['Thông dịch quan', 'Interpreter'], ['100 câu đúng dạng "Kanji → nghĩa"', '100 correct "kanji → meaning" answers'], cnt('r_k2m'), 100);
  def('Q20', 3, null, 1, ['Mắt rồng', 'Dragon Eye'], ['100 câu đúng dạng "nghĩa → Kanji"', '100 correct "meaning → kanji" answers'], cnt('r_m2k'), 100);
  def('Q21', 3, null, 1, ['Tai thính', 'Keen Ear'], ['100 câu đúng dạng "Kanji → cách đọc"', '100 correct "kanji → reading" answers'], cnt('r_k2r'), 100);
  def('Q22', 3, null, 1, ['Văn thần', 'Scholar-Official'], ['100 câu đúng dạng "từ vựng → cách đọc"', '100 correct "word → reading" answers'], cnt('r_v2r'), 100);
  def('Q23', 3, null, 2, ['Tay không run', 'Steady Hand'], ['3 bài liên tiếp không sai câu nào', '3 perfect quizzes in a row'], fl('Q23'), 1);

  tier('F', 1, 4, 'F', [0, 0, 1, 2, 3], [1, 100, 500, 2000, 5000], ['Người lật thẻ', 'Card Turner'],
    function (n) { return ['Chấm ' + n + ' thẻ flashcard', 'Grade ' + n + ' flashcards']; }, cnt('flip'));
  def('F6', 4, null, 0, ['Trọn một vòng', 'Full Circle'], ['Đi hết một vòng flashcard của một buổi', 'Finish a flashcard round of a whole session'], fl('F6'), 1);
  def('F7', 4, null, 1, ['Trí nhớ hoàng gia', 'Royal Memory'], ['Một vòng trọn buổi không có thẻ "Chưa thuộc"', 'A full-session round with no "Not yet"'], fl('F7'), 1);
  def('F8', 4, null, 0, ['Không bỏ ai lại phía sau', 'No One Left Behind'], ['Học lại chữ chưa thuộc cho tới khi không còn chữ nào', 'Review missed cards until none are left'], fl('F8'), 1);
  def('F9', 4, null, 0, ['Tuần du', 'Royal Tour'], ['Làm flashcard ở mọi buổi N5', 'Use flashcards in every N5 session'],
    function (x) { var n = 0; for (var s in x.k.seen.flashS || {}) if (s.indexOf('n5-') === 0) n++; return n; }, n5Sessions);

  tier('C', 1, 5, 'C', [0, 1], [10, 50], ['Ngự bút', 'Royal Brush'],
    function (n) { return ['Xem nét viết của ' + n + ' chữ khác nhau', 'View the strokes of ' + n + ' different kanji']; }, seenSize('view'));
  def('C3', 5, 'C', 2, ['Ngự bút III', 'Royal Brush III'], ['Xem nét viết của mọi chữ N5', 'View the strokes of every N5 kanji'],
    function (x) { var v = x.k.seen.view || {}, n = 0; for (var c in n5().kanji) if (v[c]) n++; return n; }, n5Len);
  tier('C', 4, 5, 'CR', [0, 1], [50, 300], ['Nét bút không ngừng', 'Endless Strokes'],
    function (n) { return ['Bấm vào chữ để xem lại nét ' + n + ' lần', 'Replay strokes ' + n + ' times']; }, cnt('replay'));
  def('C6', 5, null, 1, ['Đại thư pháp gia', 'Master Calligrapher'],
    ['Xem trọn nét của các chữ nhiều nét nhất N5: ' + maxStrokeKanji().join(' '), 'Watch the full strokes of the most complex N5 kanji: ' + maxStrokeKanji().join(' ')],
    function (x) { var s = x.k.seen.sdone || {}, m = maxStrokeKanji(), n = 0; for (var i = 0; i < m.length; i++) if (s[m[i]]) n++; return n; },
    function () { return maxStrokeKanji().length; });

  tier('M', 1, 6, 'M', [0, 0, 1, 2], [1, 100, 500, 2000], ['Đôi tai nhà vua', "The King's Ears"],
    function (n) { return ['Nghe phát âm ' + n + ' lần', 'Play pronunciations ' + n + ' times']; }, cnt('listen'));
  def('M5', 6, null, 0, ['Đủ âm', 'Every Sound'], ['Nghe mọi cách đọc On và Kun của một chữ', 'Hear every On and Kun reading of a kanji'],
    function (x) {
      var heard = x.k.seen.heard || {};
      for (var id in DATA) for (var c in DATA[id].kanji) {
        var r = DATA[id].kanji[c].on.concat(DATA[id].kanji[c].kun), all = r.length > 0;
        for (var i = 0; i < r.length; i++) if (!heard[normReading(r[i])]) { all = false; break; }
        if (all) return 1;
      }
      return 0;
    }, 1);
  def('M6', 6, 'MH', 1, ['Kho âm luật I', 'Sound Library I'], ['Nghe 100 âm khác nhau', 'Hear 100 different sounds'], seenSize('heard'), 100);
  def('M7', 6, 'MH', 2, ['Kho âm luật II', 'Sound Library II'], ['Nghe mọi âm có trong web', 'Hear every sound on the site'], seenSize('heard'), audioCount);

  tier('D', 1, 7, 'D', [0, 0, 1, 2, 2, 3], [3, 7, 14, 30, 100, 365], ['Kỷ luật thép', 'Iron Discipline'],
    function (n) { return ['Chuỗi ' + n + ' ngày học liên tiếp', 'A ' + n + '-day study streak']; }, function (x) { return x.bestStreak; });
  tier('D', 7, 7, 'DT', [0, 1, 2, 3], [10, 50, 100, 365], ['Biên niên sử', 'Chronicles'],
    function (n) { return ['Tổng ' + n + ' ngày học', n + ' study days in total']; }, function (x) { return x.days.length; });
  def('D11', 7, null, 0, ['Ngày cần chính', 'Diligent Day'], ['Đạt 100 Uy vọng trong một ngày', 'Earn 100 Prestige in a day'], function (x) { return x.maxDayXp; }, 100);
  def('D12', 7, null, 1, ['Ngày huy hoàng', 'Glorious Day'], ['Đạt 300 Uy vọng trong một ngày', 'Earn 300 Prestige in a day'], function (x) { return x.maxDayXp; }, 300);
  def('D13', 7, null, 0, ['Nhà vua trở về', 'The King Returns'], ['Quay lại học sau ít nhất 7 ngày vắng', 'Come back after 7 days away'], fl('D13'), 1);
  def('D14', 7, null, 0, ['Bảy ngày của tuần', 'Every Day of the Week'], ['Từng học vào đủ Thứ Hai đến Chủ Nhật', 'Study on every day of the week at least once'], function (x) { return size(x.weekdays); }, 7);
  def('D15', 7, null, 0, ['Cuối tuần không nghỉ', 'No Weekend Off'], ['Học cả Thứ Bảy và Chủ Nhật của cùng một tuần', 'Study on both Saturday and Sunday of a week'], function (x) { return x.weekend; }, 1);

  def('T1', 8, null, 1, ['Bình minh của vương quốc', 'Dawn of the Realm'], ['Học trong khung 4:00–6:00 sáng', 'Study between 4:00 and 6:00'], fl('T1'), 1, ['Khi gà chưa gáy', 'Before the rooster crows']);
  def('T2', 8, null, 1, ['Ngọn đèn khuya', 'Midnight Lamp'], ['Học trong khung 0:00–3:00', 'Study between 0:00 and 3:00'], fl('T2'), 1, ['Khi cả kinh thành đã ngủ', 'When the capital sleeps']);
  def('T3', 8, null, 0, ['Giờ Ngọ', 'High Noon'], ['Học trong khung 11:00–13:00', 'Study between 11:00 and 13:00'], fl('T3'), 1);
  def('T4', 8, null, 2, ['Ngày định mệnh', 'Day of Destiny'], ['Học vào ngày thi JLPT', 'Study on JLPT exam day'], fl('T4'), 1, ['Một ngày quan trọng của tháng 7 và tháng 12', 'An important day in July and December']);
  def('T5', 8, null, 1, ['Tân niên', 'New Year'], ['Học vào ngày 1 tháng 1', 'Study on January 1st'], fl('T5'), 1, ['Ngày đầu tiên', 'The very first day']);

  def('G1', 9, null, 0, ['Sứ thần phương Tây', 'Envoy to the West'], ['Chuyển giao diện sang tiếng Anh', 'Switch the interface to English'], fl('G1'), 1);
  def('G2', 9, null, 0, ['Song ngữ', 'Bilingual'], ['Hoàn thành trắc nghiệm ở cả hai ngôn ngữ', 'Finish a quiz in each language'], seenSize('langQuiz'), 2);
  def('G3', 9, null, 1, ['Đại sứ toàn quyền', 'Ambassador'], ['200 câu đúng ở chế độ tiếng Anh', '200 correct answers in English mode'], cnt('rightEn'), 200);

  def('P1', 10, null, 0, ['Nhạc công hoàng gia', 'Court Musician'], ['Bật nhạc nền', 'Turn on background music'], fl('P1'), 1);
  def('P2', 10, null, 0, ['Dàn nhạc cung đình', 'Court Orchestra'], ['Thử mọi phong cách nhạc', 'Try every music style'], seenSize('styles'), function () { return size(window.BGM.styles); });
  def('P3', 10, null, 0, ['Đêm ở cung điện', 'Night at the Palace'], ['Dùng giao diện tối', 'Use the dark theme'], fl('P3'), 1);
  def('P4', 10, null, 0, ['Sứ giả liên lạc', 'Royal Messenger'], ['Đồng bộ đám mây thành công', 'Sync to the cloud successfully'], fl('P4'), 1);
  def('P5', 10, null, 1, ['Vương quốc rộng lớn', 'A Vast Kingdom'], ['Học trên ít nhất 2 thiết bị', 'Study on at least 2 devices'],
    function (x) { var n = 0; for (var id in x.k.dev) if (size(x.k.dev[id].xp)) n++; return n; }, 2);
  def('P6', 10, null, 0, ['Ngự sử ghi chép', 'Royal Scribe'], ['Tải file sao lưu', 'Download a backup file'], fl('P6'), 1);
  def('P7', 10, null, 0, ['Ngai vàng riêng', "A Throne of One's Own"], ['Mở web từ biểu tượng trên màn hình chính', 'Open the site from your home screen'], fl('P7'), 1);

  tier('L', 1, 11, 'L', [0, 1, 2, 3], [1, 10, 50, 150], ['Trung thần', 'Loyal Minister'],
    function (n) { return ['Hoàn thành đủ 3 Chiếu chỉ trong ' + n + ' ngày', 'Complete all 3 decrees on ' + n + ' days']; }, function (x) { return x.fullDays; });
  def('L5', 11, null, 1, ['Phụng mệnh thần tốc', 'Swift Obedience'], ['Hoàn thành đủ 3 Chiếu chỉ trước 9:00 sáng', 'Complete all 3 decrees before 9:00'], fl('L5'), 1);
  def('L6', 11, null, 2, ['Chiếu chỉ nối tiếp', 'Unbroken Decrees'], ['Hoàn thành đủ 3 Chiếu chỉ 7 ngày liên tiếp', 'Complete all 3 decrees 7 days in a row'], function (x) { return x.fullRun; }, 7);
  tier('L', 7, 11, 'LW', [0, 1, 2], [1, 4, 12], ['Nghị sự viên mãn', 'Council Fulfilled'],
    function (n) { return ['Hoàn thành đủ 3 Nghị sự trong ' + n + ' tuần', 'Complete all 3 council tasks in ' + n + ' weeks']; }, function (x) { return x.fullWeeks; });
  def('L10', 11, null, 2, ['Tứ quý thái bình', 'Four Seasons of Peace'], ['Hoàn thành đủ 3 Nghị sự 4 tuần liên tiếp', 'Complete all 3 council tasks 4 weeks in a row'], function (x) { return x.weekRun; }, 4);

  function vTotal() { return vocabWords().length; }
  tier('V', 1, 12, 'V', [0, 0, 1, 2, 2], [10, 100, 300, 500, vTotal], ['Chiêu hiền đãi sĩ', 'Welcoming the Worthy'],
    function (n) { return typeof n === 'number' ? ['Tiếp kiến ' + n + ' thần dân', 'Meet ' + n + ' subjects'] : ['Tiếp kiến mọi thần dân N5', 'Meet every N5 subject']; },
    function (x) { return x.v.learned; });
  ACH_BY_ID.V5.name = ['Minh quân', 'The Enlightened King'];
  tier('V', 6, 12, 'VB', [1, 2, 3], [50, 200, vTotal], ['Trung thần điện', 'Hall of Loyalty'],
    function (n) { return typeof n === 'number' ? [n + ' thần dân vào Trung thần điện', n + ' subjects enter the Hall of Loyalty'] : ['Mọi thần dân N5 vào Trung thần điện', 'Every N5 subject enters the Hall of Loyalty']; },
    function (x) { return x.v.burned; });
  tier('V', 9, 12, 'VR', [0, 1, 2], [100, 1000, 5000], ['Lâm triều', 'Holding Court'],
    function (n) { return ['Tổng ' + n + ' câu Triều kiến đúng', n + ' correct audience answers']; }, cnt('vright'));
  def('V13', 12, null, 1, ['Vạch mặt kẻ giả mạo', 'Unmasking the Impostors'], ['Mọi từ "Kẻ giả mạo" đạt bậc Binh sĩ', 'Every "False friend" word reaches Soldier'],
    function (x) { return x.v.giaOk; }, function () { return vocabStats().gia; });
  def('V14', 12, null, 1, ['Cửa ngõ Dejima', 'Gateway of Dejima'], ['50 từ katakana đạt bậc Binh sĩ', '50 katakana words reach Soldier'], function (x) { return x.v.suOk; }, 50);
  def('V16', 12, null, 2, ['Ngự bút như bay', 'Flying Brush'], ['30 câu gõ cách đọc đúng liên tiếp', '30 typed readings right in a row'], function (x) { return x.k.best.vchain || 0; }, 30);
  def('V17', 12, null, 1, ['Tai rồng', 'Dragon Ears'], ['Tổng 200 câu dạng Nghe đúng', '200 correct listening answers'], cnt('vlisten'), 200);
  def('V19', 12, null, 0, ['Đại trượng phu', 'A True Gentleman'], ['Từ 大丈夫 đạt bậc Binh sĩ', 'The word 大丈夫 reaches Soldier'],
    function (x) { return x.v.daijoubu >= 5 ? 1 : 0; }, 1, ['Không sao, không sao', "It's fine, it's fine"]);

  def('H1', 13, null, 1, ['Ấn tín nhà vua', "The King's Seal"], ['Bấm logo 10 lần trong 5 giây', 'Tap the logo 10 times in 5 seconds'], fl('H1'), 1, ['Con dấu có điều muốn nói', 'The seal has something to say']);
  def('H2', 13, null, 0, ['Nhà vua do dự', 'The Indecisive King'], ['Đổi sáng/tối 10 lần trong 1 phút', 'Switch light/dark 10 times in a minute'], fl('H2'), 1, ['Ngày hay đêm?', 'Day or night?']);
  def('H3', 13, null, 0, ['Lòng vua khó đoán', 'Fickle Heart'], ['Bật tắt "Đã thuộc" cùng một chữ 5 lần', 'Toggle "Learned" on the same kanji 5 times'], fl('H3'), 1, ['Thuộc hay chưa thuộc?', 'Learned or not?']);
  def('H4', 13, null, 0, ['Ngư phủ', 'The Fisherman'], ['Nghe âm うお 10 lần', 'Hear うお 10 times'], cnt('uo'), 10, ['Có tiếng cá dưới sông', 'Something splashes in the river']);
  def('H5', 13, null, 0, ['Vẹt hoàng gia', 'Royal Parrot'], ['Nghe cùng một âm 20 lần liên tiếp', 'Play the same sound 20 times in a row'], fl('H5'), 1, ['Nói lại đi, nói lại đi', 'Say it again, say it again']);
  def('H6', 13, null, 2, ['Thất bại là mẹ thành công', 'Fall Seven, Rise Eight'], ['Sai từ 10 câu trong một bài, rồi làm lại buổi đó đạt 100%', 'Miss 10+ in a quiz, then score 100% on that session'], fl('H6'), 1, ['Ngã ở đâu, đứng dậy ở đó', 'Rise where you fell']);
  def('H7', 13, null, 2, ['Vua không ngủ', 'The Sleepless King'], ['Học cả khung 0:00–3:00 và 4:00–6:00 của cùng một đêm', 'Study at 0:00–3:00 and 4:00–6:00 of the same night'], fl('H7'), 1, ['Mặt trời đã lặn rồi mọc', 'The sun set and rose again']);
  def('H8', 13, null, 3, ['Vạn thế chi vương', 'King for Ten Thousand Ages'], ['Mở khoá mọi thành tựu khác', 'Unlock every other achievement'],
    function (x) { var n = 0; for (var id in x.k.unlocked) if (id !== 'H8' && ACH_BY_ID[id]) n++; return n; }, function () { return ACH.length - 1; }, ['Khi mọi ấn tín đã đóng', 'When every seal is stamped']);

  var HIDDEN = { V19: 1, T1: 1, T2: 1, T4: 1, T5: 1, H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1, H7: 1, H8: 1 };

  // ---------- Chieu chi va Nghi su ----------
  var QUESTS = [
    ['QE1', 0, 'flash', 'Chấm 20 thẻ flashcard', 'Grade 20 flashcards', 20, function (d) { return d.flip || 0; }],
    ['QE2', 0, 'audio', 'Nghe phát âm 15 lần', 'Play 15 pronunciations', 15, function (d) { return d.listen || 0; }],
    ['QE3', 0, 'list', 'Mở trang chi tiết của 5 chữ', 'Open the details of 5 kanji', 5, function (d) { return d.view || 0; }],
    ['QE4', 0, 'quiz', 'Hoàn thành 1 bài trắc nghiệm', 'Finish 1 quiz', 1, function (d) { return d.quiz || 0; }],
    ['QE5', 0, 'vocab', 'Ở chế độ ẩn nghĩa, chạm xem lại 10 từ', 'Reveal 10 hidden words', 10, function (d) { return d.reveal || 0; }],
    ['QE6', 0, 'stroke', 'Bấm vào chữ để xem lại nét viết 10 lần', 'Replay strokes 10 times', 10, function (d) { return d.replay || 0; }],
    ['QM1', 1, 'new', 'Thuộc 3 chữ mới', 'Learn 3 new kanji', 3, function (d) { return d.nk || 0; }, function (x) { return x.remainingKanji >= 3; }],
    ['QM2', 1, 'quiz', 'Trả lời đúng 30 câu trắc nghiệm', 'Answer 30 quiz questions correctly', 30, function (d) { return d.right || 0; }],
    ['QM3', 1, 'quiz', 'Hoàn thành trắc nghiệm ở 2 buổi khác nhau', 'Finish quizzes in 2 different sessions', 2, function (d) { return size(d.qs); }],
    ['QM4', 1, 'flash', 'Chấm 50 thẻ flashcard', 'Grade 50 flashcards', 50, function (d) { return d.flip || 0; }],
    ['QM5', 1, 'flash', 'Ôn bài cũ: trọn một vòng flashcard của buổi đã thuộc từ 80%', 'Review: a full flashcard round of a session you know 80%+', 1, function (d) { return d.rev || 0; },
      function (x) { for (var i = 0; i < x.sess.length; i++) if (knownCount(x.sess[i].list) >= 0.8 * x.sess[i].list.length) return true; return false; }],
    ['QM6', 1, 'quiz', 'Trả lời đúng 10 câu dạng "nghĩa → Kanji"', 'Answer 10 "meaning → kanji" questions correctly', 10, function (d) { return d.m2k || 0; }],
    ['QH1', 2, 'quiz', 'Một bài trắc nghiệm đạt 100%', 'Score 100% on a quiz', 1, function (d) { return d.perfect || 0; }],
    ['QH2', 2, 'quiz', 'Chuỗi 15 câu trắc nghiệm đúng liên tiếp', '15 correct quiz answers in a row', 15, function (d) { return d.mxChain || 0; }],
    ['QH3', 2, 'new', 'Thuộc 5 chữ mới', 'Learn 5 new kanji', 5, function (d) { return d.nk || 0; }, function (x) { return x.remainingKanji >= 5; }],
    ['QH4', 2, 'total', 'Đạt 120 Uy vọng trong ngày (không tính thưởng nhiệm vụ)', 'Earn 120 Prestige today (excluding task rewards)', 120, function (d) { return d.xpd || 0; }],
    ['QH5', 2, 'quiz', 'Phục thù: vượt điểm cũ ở buổi có điểm trắc nghiệm thấp nhất', 'Revenge: beat your score in your weakest session', 1, function (d) { return d.beat || 0; },
      function () { return size(App.progress().quiz) > 0; }],
    ['QH6', 2, 'quiz', 'Một bài trắc nghiệm đạt từ 90% trong dưới 2 phút', 'Score 90%+ on a quiz in under 2 minutes', 1, function (d) { return d.fast || 0; }],
    ['QE7', 0, 'word', 'Trả lời đúng 20 câu Triều kiến', 'Answer 20 audience questions correctly', 20, function (d) { return d.vright || 0; }, function (x) { return x.v.learned >= 5; }],
    ['QM7', 1, 'word', 'Tiếp kiến 5 thần dân mới', 'Meet 5 new subjects', 5, function (d) { return d.vnew || 0; }, function (x) { return x.v.total - x.v.learned >= 5; }],
    ['QH7', 2, 'word', 'Gõ đúng cách đọc 30 câu', 'Type 30 readings correctly', 30, function (d) { return d.vread || 0; }, function (x) { return x.v.learned >= 30; }]
  ];
  var WEEKLY = [
    ['W1', 'quest', 'Hoàn thành đủ 3 Chiếu chỉ trong 5 ngày', 'Complete all 3 decrees on 5 days', 5, function (w) { return w.fullDays; }],
    ['W2', 'days', 'Học 6 trên 7 ngày trong tuần', 'Study on 6 days this week', 6, function (w) { return w.days; },
      function (x, w) { return w.elapsed - w.days <= 1; }],
    ['W3', 'new', 'Thuộc 15 chữ mới', 'Learn 15 new kanji', 15, function (w) { return w.d.nk || 0; }, function (x) { return x.remainingKanji >= 15; }],
    ['W4', 'quiz', 'Trả lời đúng 200 câu trắc nghiệm', 'Answer 200 quiz questions correctly', 200, function (w) { return w.d.right || 0; }],
    ['W5', 'quiz', 'Hoàn thành 15 bài trắc nghiệm', 'Finish 15 quizzes', 15, function (w) { return w.d.quiz || 0; }],
    ['W6', 'quiz', 'Đạt 100% ở 3 buổi khác nhau', 'Score 100% in 3 different sessions', 3, function (w) { return size(w.d.pset); }],
    ['W7', 'flash', 'Chấm 300 thẻ flashcard', 'Grade 300 flashcards', 300, function (w) { return w.d.flip || 0; }],
    ['W8', 'audio', 'Nghe phát âm 150 lần', 'Play 150 pronunciations', 150, function (w) { return w.d.listen || 0; }],
    ['W9', 'total', 'Đạt 800 Uy vọng trong tuần (không tính thưởng nhiệm vụ)', 'Earn 800 Prestige this week (excluding task rewards)', 800, function (w) { return w.d.xpd || 0; }],
    ['W10', 'quiz', 'Tổng ôn: làm trắc nghiệm ở mọi buổi đang có', 'Grand review: take a quiz in every session', function () { return allSessions().length; }, function (w) { return size(w.d.qs); }],
    ['W11', 'ach', 'Mở khoá 3 thành tựu mới', 'Unlock 3 new achievements', 3, function (w) { return w.ach; }, function (x) { return ACH.length - x.unlockedCount >= 10; }],
    ['W12', 'quiz', 'Chuỗi 30 câu trắc nghiệm đúng liên tiếp', '30 correct quiz answers in a row', 30, function (w) { return w.d.mxChain || 0; }],
    ['W15', 'word', 'Trả lời đúng 300 câu Triều kiến', 'Answer 300 audience questions correctly', 300, function (w) { return w.d.vright || 0; }, function (x) { return x.v.learned >= 60; }]
  ];
  var QUEST_BY_ID = {};
  QUESTS.forEach(function (q) { QUEST_BY_ID[q[0]] = { id: q[0], tier: q[1], type: q[2], text: [q[3], q[4]], goal: q[5], prog: q[6], ok: q[7], xp: [15, 30, 50][q[1]] }; });
  var WEEK_BY_ID = {};
  WEEKLY.forEach(function (q) { WEEK_BY_ID[q[0]] = { id: q[0], type: q[1], text: [q[2], q[3]], goal: q[4], prog: q[5], ok: q[6], xp: 100 }; });
  function qgoal(q) { return typeof q.goal === 'function' ? q.goal() : q.goal; }

  function choose(cands, r, used) {
    var free = cands.filter(function (q) { return !used[q.type]; });
    var list = free.length ? free : cands;
    return list.length ? list[Math.floor(r() * list.length)] : null;
  }
  function weekStats(wk) {
    var start = parseKey(wk), d = {}, days = 0, full = 0, now = new Date(), i;
    var studied = {};
    var sd = studyDays();
    for (i = 0; i < sd.length; i++) studied[sd[i]] = 1;
    for (i = 0; i < 7; i++) {
      var key = dkey(addDays(start, i));
      combineDay(d, dayStats(key));
      if (studied[key]) days++;
      if ((S().quests[key] || []).length >= 3) full++;
    }
    var end = addDays(start, 7).getTime(), ach = 0, u = S().unlocked;
    for (var id in u) if (u[id] >= start.getTime() && u[id] < end) ach++;
    var elapsed = Math.floor((parseKey(dkey(now)) - start) / 864e5) + 1;
    return { d: d, days: days, fullDays: full, ach: ach, elapsed: elapsed };
  }
  function seedOf(key) { return hash(String(S().seed[0]) + '|' + key); }
  function dailyIds(date, ctx) {
    var k = S();
    if (!k.qsel[date]) {
      var r = rng(seedOf(date)), used = {}, ids = [];
      for (var t = 0; t < 3; t++) {
        var c = QUESTS.map(function (q) { return QUEST_BY_ID[q[0]]; }).filter(function (q) { return q.tier === t && (!q.ok || q.ok(ctx)); });
        var q = choose(c, r, used);
        if (q) { ids.push(q.id); used[q.type] = 1; }
      }
      k.qsel[date] = [ids, Date.now()];
    }
    var list = k.qsel[date][0].slice(), rr = k.reroll[date];
    if (rr) { var i = list.indexOf(rr[0]); if (i >= 0) list[i] = rr[1]; }
    return list;
  }
  function weeklyIds(wk, ctx, w) {
    var k = S();
    if (!k.wsel[wk]) {
      var r = rng(seedOf('W' + wk)), used = {}, ids = [];
      var c = WEEKLY.map(function (q) { return WEEK_BY_ID[q[0]]; }).filter(function (q) { return !q.ok || q.ok(ctx, w); });
      for (var t = 0; t < 3; t++) {
        var q = choose(c.filter(function (x) { return ids.indexOf(x.id) < 0; }), r, used);
        if (q) { ids.push(q.id); used[q.type] = 1; }
      }
      k.wsel[wk] = [ids, Date.now()];
    }
    var list = k.wsel[wk][0].slice(), rr = k.wreroll[wk];
    if (rr) { var i = list.indexOf(rr[0]); if (i >= 0) list[i] = rr[1]; }
    return list;
  }
  function rerollDaily(id) {
    var k = S(), date = today(), ctx = context(), list = dailyIds(date, ctx), q = QUEST_BY_ID[id];
    if (k.reroll[date] || (k.quests[date] || []).indexOf(id) >= 0 || !q) return;
    var used = {};
    list.forEach(function (x) { if (x !== id) used[QUEST_BY_ID[x].type] = 1; });
    var c = QUESTS.map(function (x) { return QUEST_BY_ID[x[0]]; }).filter(function (x) {
      return x.tier === q.tier && list.indexOf(x.id) < 0 && (!x.ok || x.ok(ctx));
    });
    var pickd = choose(c, rng(seedOf(date + 'r')), used);
    if (pickd) k.reroll[date] = [id, pickd.id, Date.now()];
  }
  function rerollWeekly(id) {
    var k = S(), wk = wkey(new Date()), ctx = context(), w = weekStats(wk), list = weeklyIds(wk, ctx, w);
    if (k.wreroll[wk] || (k.wquests[wk] || []).indexOf(id) >= 0) return;
    var used = {};
    list.forEach(function (x) { if (x !== id) used[WEEK_BY_ID[x].type] = 1; });
    var c = WEEKLY.map(function (x) { return WEEK_BY_ID[x[0]]; }).filter(function (x) { return list.indexOf(x.id) < 0 && (!x.ok || x.ok(ctx, w)); });
    var pickd = choose(c, rng(seedOf(wk + 'r')), used);
    if (pickd) k.wreroll[wk] = [id, pickd.id, Date.now()];
  }

  // ---------- thong bao ----------
  var queue = [];
  var crowns = [];
  var queuedRank = -1;
  var showing = false;
  var toastEl = null;
  var soundOn = readLocal(SOUND_KEY) !== '0';
  var actx = null;

  function chime(big) {
    if (!soundOn) return;
    try {
      if (!actx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; actx = new AC(); }
      if (actx.resume) actx.resume();
      if (window.BGM && window.BGM.duck) { window.BGM.duck(true); setTimeout(function () { window.BGM.duck(false); }, 1200); }
      var notes = big ? [659, 784, 988, 1319] : [880, 1319];
      for (var i = 0; i < notes.length; i++) {
        var o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * 0.12;
        o.type = 'sine'; o.frequency.value = notes[i];
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.18, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        o.connect(g); g.connect(actx.destination);
        o.start(t); o.stop(t + 1);
      }
    } catch (e) { /* trinh duyet khong ho tro */ }
  }
  function sealHtml(glyph, r, extra) {
    return '<span class="seal r' + r + (extra || '') + '"><span class="jp" lang="ja">' + h(glyph) + '</span></span>';
  }
  function flush() {
    if (showing || App.isBusy()) return;
    if (crowns.length) { showCrown(crowns.shift()); return; }
    if (!queue.length) return;
    var it = queue.shift();
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'ktoast';
      toastEl.setAttribute('data-act', 'kToast');
      document.body.appendChild(toastEl);
    }
    showing = true;
    toastEl.className = 'k-' + it.kind;
    toastEl.innerHTML = sealHtml(it.glyph, it.r, ' stamp') + '<span class="kt-body"><small>' + h(it.label) + '</small><b>' + h(it.title) + '</b>' +
      (it.sub ? '<em>' + h(it.sub) + '</em>' : '') + '</span>' + (it.xp ? '<span class="kt-xp">+' + it.xp + '</span>' : '');
    toastEl.getBoundingClientRect();
    toastEl.className += ' show';
    chime(it.r >= 2 || it.kind === 'bonus');
    setTimeout(function () {
      toastEl.className = toastEl.className.replace(' show', '');
      setTimeout(function () { showing = false; flush(); }, 350);
    }, 3800);
  }
  // Bac 1-2 bui toc, 3 phoc dau, 4-6 mu xung thien, 7-10 mu mien (5/9/12 chuoi ngoc)
  function crownSvg(r, cls, sway) {
    var COL = ['#a8754a', '#a8754a', '#9aa4ae', '#9aa4ae', '#d4a017', '#d4a017', '#2f9e6e', '#2f9e6e', '#7b4bb8', '#1b1b1f'];
    var LAC = '#2b2522', GOLD = '#e6c35c', RED = '#c2452d', DGOLD = '#9a7310';
    var c = COL[r], st = ' stroke="' + (r >= 9 ? GOLD : 'rgba(0,0,0,.3)') + '" stroke-width="1.5" stroke-linejoin="round"';
    var lac = ' class="lac" fill="' + LAC + '"' + st, s = '', i;
    var anim = sway && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    function swing(inner, cy) {
      return '<g>' + inner + (anim ? '<animateTransform attributeName="transform" type="rotate" values="-2.5 32 ' + cy + ';2.5 32 ' + cy + ';-2.5 32 ' + cy + '" dur="2.6s" repeatCount="indefinite"/>' : '') + '</g>';
    }
    function P(d, fill, extra) { return '<path d="' + d + '"' + (fill ? ' fill="' + fill + '"' : '') + (extra === undefined ? st : extra) + '/>'; }
    function dot(x, y, rad, fill, extra) { return '<circle cx="' + x + '" cy="' + y + '" r="' + rad + '" fill="' + fill + '"' + (extra || '') + '/>'; }
    function line(x1, y1, x2, y2, col, w) {
      return '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round"/>';
    }

    if (r <= 1) {
      var tails = P('M25 34c-4 6-7 12-11 19l4 1.5c3.5-6.5 6.5-12.5 9.5-19Z', RED) + P('M39 34c4 6 7 12 11 19l-4 1.5c-3.5-6.5-6.5-12.5-9.5-19Z', RED);
      s += P('M12 58C12 41 20 35 32 35S52 41 52 58Z', '', lac) + swing(tails, 34) + '<ellipse cx="32" cy="27" rx="9" ry="8"' + lac + '/>';
      if (r === 0) s += P('M23 30.5h18v4.5H23Z', RED) + line(15, 25, 49, 25, c, 2.6) + dot(15, 25, 2.4, c) + dot(49, 25, 2.4, c);
      else s += P('M21 37L23.5 19Q32 13.5 40.5 19L43 37Z', c) + P('M22.5 31.5h19', 'none', ' stroke="rgba(0,0,0,.25)" stroke-width="1.5"') +
        dot(32, 25, 2.6, RED) + line(12, 24, 52, 24, GOLD, 2.4) + dot(12, 24, 2.3, GOLD) + dot(52, 24, 2.3, GOLD);
    } else if (r === 2) {
      s += P('M22 34Q22 11 32 11Q42 11 42 34Z', '', lac) +
        '<rect x="1.5" y="27" width="21" height="4.5" rx="2.2"' + lac + '/><rect x="41.5" y="27" width="21" height="4.5" rx="2.2"' + lac + '/>' +
        dot(4, 29.2, 2.6, c) + dot(60, 29.2, 2.6, c) +
        P('M14 56V38Q14 24 32 24Q50 24 50 38V56Z', '', lac) + '<rect x="14" y="46" width="36" height="8" fill="' + c + '"' + st + '/>' + dot(32, 50, 2.4, RED);
    } else if (r <= 5) {
      var body = r === 3 ? lac : ' class="lacg" fill="' + LAC + '" stroke="' + c + '" stroke-width="1.5" stroke-linejoin="round"';
      var trim = c, vein = ' stroke="' + c + '" stroke-width="1" fill="none"';
      s += P('M24 21C18 16 11.5 10 11.5 5.5C11.5 2 16 1 18.5 3.5C22 7 26 12 28.5 17Z', '', body) + P('M40 21C46 16 52.5 10 52.5 5.5C52.5 2 48 1 45.5 3.5C42 7 38 12 35.5 17Z', '', body) +
        P('M25.5 18.5Q17 11 15 5M38.5 18.5Q47 11 49 5', '', vein) +
        P('M20 25Q20 9 32 9Q44 9 44 25Z', '', body) + P('M13 56V31Q13 22 22 21.5H42Q51 22 51 31V56Z', '', body) +
        '<rect x="13" y="45" width="38" height="9" fill="' + trim + '"' + st + '/>';
      if (r >= 4) s += dot(32, 33, 4, GOLD) + dot(32, 33, 1.8, RED) +
        P('M15 34q2.5-4 5 0t5 0M49 34q-2.5-4-5 0t-5 0', 'none', ' stroke="' + GOLD + '" stroke-width="2" stroke-linecap="round"') +
        dot(26, 33, 1.6, GOLD) + dot(38, 33, 1.6, GOLD);
      if (r === 5) s += P('M16 50.5q2-3 4 0q2-3 4 0M40 50.5q2-3 4 0q2-3 4 0', 'none', ' stroke="' + DGOLD + '" stroke-width="1.4" stroke-linecap="round"') +
        dot(32, 49.5, 3, '#3d7fd6', ' stroke="#fffdf8" stroke-width="1"') + dot(14.5, 4, 2, RED) + dot(49.5, 4, 2, RED);
    } else {
      var n = r === 6 ? 5 : r === 7 ? 9 : 12, trim2 = r >= 9 ? GOLD : c, strings = '';
      var BEAD = ['#f4f1ea', '#e05a5a', '#e6c35c', '#3d7fd6', '#2f9e6e'];
      if (r >= 9) s += dot(32, 30, 29, GOLD, ' opacity=".14"') + dot(32, 30, 22, GOLD, ' opacity=".16"');
      if (r >= 7) s += swing(line(7, 16, 7, 33, RED, 1.2) + dot(7, 35, 2.8, GOLD) + line(57, 16, 57, 33, RED, 1.2) + dot(57, 35, 2.8, GOLD), 16);
      s += P('M20 16H44L46.5 53H17.5Z', '', lac) + '<rect x="17.5" y="45" width="29" height="8" fill="' + trim2 + '"' + st + '/>' +
        line(11, 28, 53, 28, GOLD, 2.2) + dot(11, 28, 2, GOLD) + dot(53, 28, 2, GOLD) +
        P('M10 9H54L59.5 14H4.5Z', trim2) + '<rect x="4.5" y="14" width="55" height="3"' + lac + '/>';
      for (i = 0; i < n; i++) {
        var x = (8 + 48 * i / (n - 1)).toFixed(1), col = r === 6 ? BEAD[0] : r === 7 ? BEAD[i % 2 ? 3 : 0] : r === 8 ? BEAD[i % 5] : GOLD;
        strings += line(x, 17, x, 38, 'rgba(0,0,0,.4)', 0.7);
        for (var b = 0; b < 5; b++) strings += dot(x, (20 + b * 4.5).toFixed(1), 1.45, col, ' stroke="rgba(0,0,0,.45)" stroke-width=".5"');
      }
      s += swing(strings, 16);
    }
    return '<svg class="' + cls + '" viewBox="0 0 64 60" aria-hidden="true">' + s + '</svg>';
  }
  var crownEl = null;
  function showCrown(r) {
    showing = true;
    if (r > parseInt(readLocal(RANK_SEEN_KEY) || '-1', 10)) writeLocal(RANK_SEEN_KEY, String(r));
    if (!crownEl) { crownEl = document.createElement('div'); crownEl.id = 'kcrown'; document.body.appendChild(crownEl); }
    var reward = '', hk = null;
    for (var i = 0; i < HANKO.length; i++) if (HANKO[i].rank === r) hk = HANKO[i];
    if (hk) reward += '<p>' + T('Mở khoá màu ấn tín: ', 'New seal color: ') + '<b>' + h(L(hk.name)) + '</b></p>';
    reward += '<p>' + T('Danh hiệu mới: ', 'New title: ') + '<b>' + h(rankName(r)) + '</b></p>';
    if (r === 3) reward += '<p>' + T('Bản đồ vương quốc đã mở trong mục Từ vựng', 'The map of your realm is now open in Vocabulary') + '</p>';
    crownEl.innerHTML = '<div class="backdrop" data-act="kCrownClose"></div><div class="dialog coronation">' +
      '<p class="eyebrow">' + T('Lễ đăng quang', 'Coronation') + '</p>' + crownSvg(r, 'big-crown', true) +
      '<h2>' + jp(RANKS[r][3]) + '</h2><h3>' + h(rankName(r)) + '</h3><div class="reward">' + reward + '</div>' +
      '<div class="row">' + (hk ? '<button class="btn primary" data-act="kCrownUse" data-id="' + hk.id + '">' + T('Dùng màu này', 'Use this color') + '</button>' : '') +
      '<button class="btn" data-act="kCrownClose">' + T('Tiếp tục', 'Continue') + '</button></div></div>';
    chime(true);
  }
  function closeCrown() {
    if (crownEl) crownEl.innerHTML = '';
    showing = false;
    setTimeout(flush, 200);
  }

  // ---------- danh gia ----------
  var evalTimer = null;
  var booted = false;
  function schedule() { clearTimeout(evalTimer); evalTimer = setTimeout(evaluate, 30); }
  function evaluate() {
    var k = S(), ctx = context(), now = Date.now(), fresh = [], i;
    for (var pass = 0; pass < 2; pass++) {
      for (i = 0; i < ACH.length; i++) {
        var a = ACH[i];
        if (k.unlocked[a.id]) continue;
        if (a.val(ctx) >= goalOf(a)) { k.unlocked[a.id] = now; fresh.push(a); ctx.unlockedCount++; }
      }
    }
    var date = today(), D = dayStats(date), ids = dailyIds(date, ctx), done = k.quests[date] || (k.quests[date] = []), qfresh = [];
    for (i = 0; i < ids.length; i++) {
      var q = QUEST_BY_ID[ids[i]];
      if (q && done.indexOf(q.id) < 0 && q.prog(D) >= qgoal(q)) { done.push(q.id); qfresh.push(q); }
    }
    var allDaily = qfresh.length && done.length >= 3;
    if (allDaily && new Date().getHours() < 9) flag('L5');
    var wk = wkey(new Date()), w = weekStats(wk), wids = weeklyIds(wk, ctx, w), wdone = k.wquests[wk] || (k.wquests[wk] = []), wfresh = [];
    for (i = 0; i < wids.length; i++) {
      var wq = WEEK_BY_ID[wids[i]];
      if (wq && wdone.indexOf(wq.id) < 0 && wq.prog(w) >= qgoal(wq)) { wdone.push(wq.id); wfresh.push(wq); }
    }
    var allWeekly = wfresh.length && wdone.length >= 3;
    if (qfresh.length || wfresh.length) {
      ctx = context();
      for (i = 0; i < ACH.length; i++) {
        if (!k.unlocked[ACH[i].id] && ACH[i].val(ctx) >= goalOf(ACH[i])) { k.unlocked[ACH[i].id] = now; fresh.push(ACH[i]); }
      }
    }

    var rank = rankOf(totalXp()), seenRank = parseInt(readLocal(RANK_SEEN_KEY) || '-1', 10);
    if (!booted && seenRank < 0) {
      writeLocal(RANK_SEEN_KEY, String(rank));
      if (fresh.length) queue.push({ kind: 'retro', glyph: '王', r: 1, label: T('Sổ ấn tín', 'Seal ledger'), title: T('Đã ghi nhận ' + fresh.length + ' ấn tín', fresh.length + ' seals recorded'), sub: T('từ tiến độ học trước đây', 'from your earlier progress') });
    } else {
      fresh.sort(function (x, y) { return y.r - x.r; });
      fresh.forEach(function (a, i) {
        if (fresh.length > 3 && i >= 2) return;
        queue.push({ kind: 'ach', glyph: CATS[a.cat][0], r: a.r, label: T('Thành tựu · ', 'Achievement · ') + L(RARITY[a.r]), title: L(a.name), sub: L(a.desc), xp: RARITY_XP[a.r] });
      });
      if (fresh.length > 3) {
        var rest = fresh.slice(2), xpRest = 0;
        rest.forEach(function (a) { xpRest += RARITY_XP[a.r]; });
        queue.push({ kind: 'ach', glyph: '璽', r: 1, label: T('Sổ ấn tín', 'Seal ledger'), title: T('và ' + rest.length + ' ấn tín khác', 'and ' + rest.length + ' more seals'), sub: T('Xem trong Hồ sơ', 'See your profile'), xp: xpRest });
      }
      // Chi danh dau da xem khi popup thuc su hien, de dong trang som khong lam mat Le dang quang.
      for (var rr = Math.max(seenRank, queuedRank) + 1; rr <= rank; rr++) if (rr > 0) crowns.push(rr);
      queuedRank = Math.max(queuedRank, rank);
    }
    qfresh.forEach(function (q) { queue.push({ kind: 'quest', glyph: '令', r: q.tier, label: T('Chiếu chỉ hoàn thành', 'Decree complete'), title: L(q.text), xp: q.xp }); });
    if (allDaily) queue.push({ kind: 'bonus', glyph: '賞', r: 2, label: T('Ân thưởng', 'Royal favor'), title: T('Hoàn thành cả 3 Chiếu chỉ hôm nay', 'All 3 decrees done today'), xp: 50 });
    wfresh.forEach(function (q) { queue.push({ kind: 'quest', glyph: '議', r: 2, label: T('Nghị sự hoàn thành', 'Council task complete'), title: L(q.text), xp: 100 }); });
    if (allWeekly) queue.push({ kind: 'bonus', glyph: '賞', r: 3, label: T('Đại ân thưởng', 'Grand royal favor'), title: T('Hoàn thành cả 3 Nghị sự tuần này', 'All 3 council tasks done this week'), xp: 150 });
    booted = true;
    App.saveProgress();
    var route = App.route();
    if (!route.length || route[0] === 'king') App.render(); else App.refreshChrome();
    flush();
  }

  // ---------- su kien ----------
  var logoTaps = [], themeFlips = [], toggles = {}, lastSound = { key: '', n: 0 }, lastListenXp = 0;
  App.on(function (type, e) {
    var k, dev, now = Date.now(), sess;
    if (type === 'start') {
      S(); me();
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) flag('P7');
      if (document.documentElement.getAttribute('data-theme') === 'dark') flag('P3');
      if (App.isEn()) flag('G1');
      if (window.BGM && window.BGM.settings.enabled) { flag('P1'); seenSet('styles')[window.BGM.settings.style] = 1; }
      var kn = seenSet('kn'), all = allKanji(), perf = seenSet('perf'), pq = App.progress().quiz;
      for (var i = 0; i < all.length; i++) if (App.isKnown(all[i])) kn[all[i]] = 1;
      for (var s in pq) if (pq[s][0] === pq[s][1]) perf[s] = 1;
      schedule();
      return;
    }
    k = S(); dev = me();
    switch (type) {
      case 'kanji:known':
        learn();
        if (!seenSet('kn')[e.k]) { seenSet('kn')[e.k] = 1; dayInc('nk'); dayXp(10); }
        break;
      case 'kanji:toggle':
        toggles[e.k] = (toggles[e.k] || 0) + 1;
        if (toggles[e.k] >= 5) flag('H3');
        break;
      case 'kanji:view':
        learn();
        dayInc('view');
        if (!seenSet('view')[e.k]) { seenSet('view')[e.k] = 1; dayXp(2); }
        break;
      case 'mode:open':
        if (!k.seen.modes) k.seen.modes = {};
        if (!k.seen.modes[e.sess]) k.seen.modes[e.sess] = {};
        k.seen.modes[e.sess][e.mode] = 1;
        if (e.mode === 'vocab') seenSet('vocab')[e.sess] = 1;
        break;
      case 'stroke:replay':
        learn(); inc('replay'); dayInc('replay');
        break;
      case 'stroke:done':
        seenSet('sdone')[e.k] = 1;
        break;
      case 'flash:grade':
        learn(); inc('flip'); dayInc('flip'); addXp('flip', 1);
        break;
      case 'flash:roundEnd':
        seenSet('flashS')[e.sess] = 1;
        if (e.full) {
          flag('F6');
          if (!e.misses) flag('F7');
          if (knownCount(e.list) >= 0.8 * e.list.length) dayInc('rev');
        }
        if (e.again && !e.misses) flag('F8');
        break;
      case 'quiz:answer':
        learn(); inc('ans');
        if (e.ok) {
          inc('right'); inc('r_' + e.type); dayInc('right'); addXp('right', 2);
          if (e.type === 'm2k') dayInc('m2k');
          if (e.en) inc('rightEn');
          dev.run.chain = (dev.run.chain || 0) + 1;
          k.best.chain = Math.max(k.best.chain || 0, dev.run.chain);
          dayMax('mxChain', dev.run.chain);
        } else dev.run.chain = 0;
        break;
      case 'quiz:end':
        learn(); sess = e.sess;
        var ratio = e.right / e.total, perfect = e.right === e.total;
        inc('quiz'); dayInc('quiz'); daySet('qs', sess); addXp('quiz', 10);
        seenSet('langQuiz')[e.en ? 'en' : 'vi'] = 1;
        if (perfect) {
          inc('perfect'); dayInc('perfect'); daySet('pset', sess); addXp('perfect', 30);
          if (!seenSet('perf')[sess]) { seenSet('perf')[sess] = 1; dayXp(100); }
          if (k.h6[sess]) flag('H6');
        }
        dev.run.pstreak = perfect ? (dev.run.pstreak || 0) + 1 : 0;
        if (dev.run.pstreak >= 3) flag('Q23');
        if (ratio >= 0.9 && e.ms < 120000) { flag('Q17'); dayInc('fast'); }
        if (k.qmin[sess] !== undefined && k.qmin[sess] < 0.5 && ratio >= 0.9) flag('Q18');
        k.qmin[sess] = k.qmin[sess] === undefined ? ratio : Math.min(k.qmin[sess], ratio);
        if (e.total - e.right >= 10) k.h6[sess] = 1;
        var pq = App.progress().quiz, low = null, lowRatio = 2;
        for (var qk in pq) { var rq = pq[qk][0] / pq[qk][1]; if (rq < lowRatio) { lowRatio = rq; low = qk; } }
        if (low === sess && e.prev !== null && ratio > e.prev) dayInc('beat');
        break;
      case 'audio:play':
        learn(); inc('listen'); dayInc('listen');
        seenSet('heard')[e.key] = 1;
        if (e.key === 'うお') inc('uo');
        if (now - lastListenXp >= 1000) { addXp('listen', 1); lastListenXp = now; }
        lastSound = lastSound.key === e.key ? { key: e.key, n: lastSound.n + 1 } : { key: e.key, n: 1 };
        if (lastSound.n >= 20) flag('H5');
        break;
      case 'word:learn':
        learn(); dayInc('vnew'); dayXp(5);
        break;
      case 'word:view':
        learn();
        break;
      case 'word:answer':
        learn();
        if (e.retry) break;
        if (e.ok && e.mode === 'review') { inc('vright'); dayInc('vright'); addXp('vright', 2); }
        if (e.ok && e.type === 'listen') inc('vlisten');
        if (e.type === 'read') {
          if (e.ok) {
            dayInc('vread');
            dev.run.vchain = (dev.run.vchain || 0) + 1;
            k.best.vchain = Math.max(k.best.vchain || 0, dev.run.vchain);
          } else dev.run.vchain = 0;
        }
        break;
      case 'word:rank':
        if (e.to >= 9) dayXp(5);
        break;
      case 'vocab:reveal':
        learn(); inc('reveal'); dayInc('reveal');
        break;
      case 'setting':
        if (e.name === 'theme') {
          if (e.value === 'dark') flag('P3');
          themeFlips.push(now);
          themeFlips = themeFlips.filter(function (t) { return now - t < 60000; });
          if (themeFlips.length >= 10) flag('H2');
        }
        if (e.name === 'lang' && e.value === 'en') flag('G1');
        if (e.name === 'bgm' && e.value) { flag('P1'); seenSet('styles')[e.style] = 1; }
        if (e.name === 'style' && e.on) seenSet('styles')[e.value] = 1;
        break;
      case 'sync:ok': flag('P4'); break;
      case 'backup': flag('P6'); break;
      case 'logo':
        logoTaps.push(now);
        logoTaps = logoTaps.filter(function (t) { return now - t < 5000; });
        if (logoTaps.length >= 10) flag('H1');
        break;
      default: return;
    }
    schedule();
  });

  // ---------- giao dien ----------
  var catTab = -1, filter = 'all', questTab = 'day';

  function xpBar(xp, r) {
    var lo = RANKS[r][0], hi = r + 1 < RANKS.length ? RANKS[r + 1][0] : lo;
    var pct = hi > lo ? Math.min(100, Math.round((xp - lo) * 100 / (hi - lo))) : 100;
    return '<div class="kbar"><i style="width:' + pct + '%"></i></div><small class="kxp">' +
      (hi > lo ? fmt(xp) + ' / ' + fmt(hi) + T(' Uy vọng', ' Prestige') : fmt(xp) + T(' Uy vọng · bậc cao nhất', ' Prestige · highest rank')) + '</small>';
  }
  function titleText() {
    var t = S().title;
    if (!t || !t[0]) return '';
    if (t[0].charAt(0) === 'R') return rankName(+t[0].slice(1));
    return ACH_BY_ID[t[0]] ? L(ACH_BY_ID[t[0]].name) : '';
  }
  function kingCard() {
    var xp = totalXp(), r = rankOf(xp), title = titleText();
    return '<a class="card kcard" href="#/king">' + crownSvg(r, 'kcrown') + '<span class="body"><small>' + T('Bậc ', 'Rank ') + (r + 1) + ' · ' + jp(RANKS[r][3]) + '</small>' +
      '<b>' + h(rankName(r)) + '</b>' + (title ? '<em>「' + h(title) + '」</em>' : '') + xpBar(xp, r) + '</span>' +
      '<span class="kseals"><b>' + size(S().unlocked) + '</b><small>/' + ACH.length + '</small><small>' + T('ấn tín', 'seals') + '</small></span></a>';
  }
  function questRow(q, cur, goal, done, canReroll, act) {
    var pct = Math.min(100, Math.round(Math.min(cur, goal) * 100 / goal));
    return '<div class="qrow' + (done ? ' done' : '') + '"><span class="qtier t' + (q.tier === undefined ? 3 : q.tier) + '"></span>' +
      '<span class="body"><span class="qtext">' + h(L(q.text)) + '</span><div class="bar"><i style="width:' + pct + '%"></i></div></span>' +
      '<span class="qmeta"><small>' + Math.min(cur, goal) + '/' + goal + '</small><b>+' + q.xp + '</b>' +
      (canReroll && !done ? '<button class="qre" data-act="' + act + '" data-id="' + q.id + '">' + T('Đổi', 'Swap') + '</button>' : '') + '</span>' +
      (done ? sealHtml('済', 2, ' qstamp') : '') + '</div>';
  }
  function questCard() {
    var k = S(), ctx = context(), html = '', date = today(), wk = wkey(new Date());
    if (questTab === 'week') {
      var w = weekStats(wk), wids = weeklyIds(wk, ctx, w), wd = k.wquests[wk] || [];
      var left = 7 - w.elapsed;
      for (var j = 0; j < wids.length; j++) {
        var wq = WEEK_BY_ID[wids[j]];
        html += questRow(wq, wq.prog(w), qgoal(wq), wd.indexOf(wq.id) >= 0, !k.wreroll[wk], 'kRerollW');
      }
      html += '<p class="qfoot">' + (wd.length >= 3 ? T('Đã nhận Đại ân thưởng +150', 'Grand royal favor +150 received') : T('Xong cả 3: Đại ân thưởng +150', 'All 3: grand royal favor +150')) +
        ' · ' + (left > 0 ? T('còn ' + left + ' ngày', left + ' days left') : T('ngày cuối tuần', 'last day')) + '</p>';
    } else {
      var D = dayStats(date), ids = dailyIds(date, ctx), dd = k.quests[date] || [];
      for (var i = 0; i < ids.length; i++) {
        var q = QUEST_BY_ID[ids[i]];
        html += questRow(q, q.prog(D), qgoal(q), dd.indexOf(q.id) >= 0, !k.reroll[date], 'kReroll');
      }
      html += '<p class="qfoot">' + (dd.length >= 3 ? T('Đã nhận Ân thưởng +50', 'Royal favor +50 received') : T('Xong cả 3: Ân thưởng +50', 'All 3: royal favor +50')) +
        ' · ' + T('làm mới lúc 0:00', 'resets at 0:00') + '</p>';
    }
    return '<div class="card qcard"><div class="qhead"><b>' + jp('令') + ' ' + T('Chiếu chỉ', 'Decrees') + '</b><div class="seg small">' +
      '<button class="' + (questTab === 'day' ? 'on' : '') + '" data-act="kQTab" data-tab="day">' + T('Hôm nay', 'Today') + '</button>' +
      '<button class="' + (questTab === 'week' ? 'on' : '') + '" data-act="kQTab" data-tab="week">' + T('Tuần này', 'This week') + '</button></div></div>' + html + '</div>';
  }
  function calendar() {
    var k = S(), start = addDays(monday(new Date()), -28), t = today(), html = '', i;
    var names = App.isEn() ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    for (i = 0; i < 7; i++) html += '<span class="cal-h">' + names[i] + '</span>';
    for (i = 0; i < 35; i++) {
      var key = dkey(addDays(start, i)), n = Math.min(3, (k.quests[key] || []).length);
      html += '<span class="cal l' + n + (key === t ? ' today' : '') + (key > t ? ' future' : '') + '" title="' + key + ': ' + n + '/3"></span>';
    }
    return '<div class="card"><h3>' + T('LỊCH CHIẾU CHỈ 5 TUẦN', 'DECREES · LAST 5 WEEKS') + '</h3><div class="calgrid">' + html + '</div></div>';
  }
  function achCard(group, ctx) {
    var k = S(), last = group[group.length - 1], cur = null, i, unlockedN = 0;
    for (i = 0; i < group.length; i++) if (k.unlocked[group[i].id]) unlockedN++; else if (!cur) cur = group[i];
    var a = cur || last, done = !cur, hidden = HIDDEN[a.id] && !done;
    var goal = goalOf(a), val = Math.min(a.val(ctx), goal);
    var stars = '';
    if (group.length > 1) {
      for (i = 0; i < group.length; i++) stars += '<i class="' + (i < unlockedN ? 'on' : '') + '">★</i>';
      stars = '<span class="stars">' + stars + '</span>';
    }
    var shown = done ? last : a;
    var name = hidden ? '？？？' : L(shown.name);
    var desc = hidden ? L(a.hint || ['Bí mật', 'Secret']) : L(shown.desc);
    var date = done ? new Date(k.unlocked[last.id]) : null;
    return '<div class="card ach' + (done ? ' done' : '') + (hidden ? ' secret' : '') + '">' +
      sealHtml(hidden ? '？' : CATS[a.cat][0], (done ? last : a).r, done ? '' : ' locked') +
      '<span class="body"><b>' + h(name) + '</b>' + stars + '<small>' + h(desc) + '</small>' +
      (done ? '<em>' + T('Đạt ngày ', 'Unlocked ') + dkey(date) + '</em>' :
        hidden ? '' : '<div class="bar"><i style="width:' + Math.round(val * 100 / goal) + '%"></i></div><em>' + val + '/' + goal + ' · ' + L(RARITY[a.r]) + '</em>') +
      '</span></div>';
  }
  function groupsOf(cat) {
    var out = [], byG = {};
    for (var i = 0; i < ACH.length; i++) {
      var a = ACH[i];
      if (cat >= 0 && a.cat !== cat) continue;
      if (!byG[a.g]) { byG[a.g] = []; out.push(byG[a.g]); }
      byG[a.g].push(a);
    }
    return out;
  }
  function viewProfile() {
    var k = S(), ctx = context(), xp = totalXp(), r = rankOf(xp), i;
    k.seenAch = Date.now();
    var titles = '<option value="">' + T('— Không đeo danh hiệu —', '— No title —') + '</option>';
    for (i = 1; i <= r; i++) titles += '<option value="R' + i + '"' + (k.title && k.title[0] === 'R' + i ? ' selected' : '') + '>' + h(rankName(i)) + '</option>';
    for (i = 0; i < ACH.length; i++) {
      var a = ACH[i];
      if (a.r >= 2 && k.unlocked[a.id]) titles += '<option value="' + a.id + '"' + (k.title && k.title[0] === a.id ? ' selected' : '') + '>' + h(L(a.name)) + '</option>';
    }
    var cur = k.hanko ? k.hanko[0] : 'son', sw = '';
    for (i = 0; i < HANKO.length; i++) {
      var c = HANKO[i], open = r >= c.rank;
      sw += '<button class="swatch' + (cur === c.id ? ' on' : '') + (open ? '' : ' locked') + '" style="background:' + c.bg + ';color:' + c.fg + '"' +
        (open ? ' data-act="kHanko" data-id="' + c.id + '"' : ' disabled') + ' title="' + h(L(c.name)) + (open ? '' : ' · ' + T('Bậc ', 'Rank ') + (c.rank + 1)) + '">' + (open ? '王' : '🔒') + '</button>';
    }
    var stats = [
      [ctx.known, T('chữ đã thuộc', 'kanji learned')], [ctx.streak, T('ngày liên tiếp', 'day streak')], [ctx.days.length, T('ngày đã học', 'study days')],
      [ctx.c.right || 0, T('câu đúng', 'correct answers')], [ctx.c.flip || 0, T('thẻ đã chấm', 'cards graded')], [ctx.c.listen || 0, T('lượt nghe', 'listens')],
      [ctx.v.learned, T('thần dân', 'subjects')], [ctx.v.burned, T('trung thần', 'loyal subjects')], [ctx.c.vright || 0, T('câu Triều kiến đúng', 'audience answers')]
    ], st = '';
    for (i = 0; i < stats.length; i++) st += '<div class="kstat"><b>' + fmt(stats[i][0]) + '</b><small>' + stats[i][1] + '</small></div>';

    var tabs = '<button class="' + (catTab < 0 ? 'on' : '') + '" data-act="kCat" data-c="-1">' + T('Tất cả', 'All') + '</button>';
    for (i = 0; i < CATS.length; i++) {
      var tot = 0, got = 0;
      for (var j = 0; j < ACH.length; j++) if (ACH[j].cat === i) { tot++; if (k.unlocked[ACH[j].id]) got++; }
      tabs += '<button class="' + (catTab === i ? 'on' : '') + '" data-act="kCat" data-c="' + i + '">' + jp(CATS[i][0]) + ' ' + h(L([CATS[i][1], CATS[i][2]])) + ' <small>' + got + '/' + tot + '</small></button>';
    }
    var cards = '', groups = groupsOf(catTab);
    for (i = 0; i < groups.length; i++) {
      var g = groups[i], allDone = true, next = null;
      for (j = 0; j < g.length; j++) if (!k.unlocked[g[j].id]) { allDone = false; next = next || g[j]; }
      var anyDone = !!k.unlocked[g[0].id];
      if (filter === 'done' && !anyDone) continue;
      if (filter === 'todo' && allDone) continue;
      if (filter === 'near' && (allDone || HIDDEN[next.id] || next.val(ctx) / goalOf(next) < 0.75)) continue;
      cards += achCard(g, ctx);
    }
    var total = size(k.unlocked);
    var filters = [['all', T('Tất cả', 'All')], ['done', T('Đã đạt', 'Unlocked')], ['todo', T('Chưa đạt', 'Locked')], ['near', T('Sắp đạt', 'Almost')]], fs = '';
    for (i = 0; i < filters.length; i++) fs += '<button class="' + (filter === filters[i][0] ? 'on' : '') + '" data-act="kFilter" data-f="' + filters[i][0] + '">' + filters[i][1] + '</button>';

    return '<div class="card kprofile">' + crownSvg(r, 'big-crown') +
      '<div class="body"><small>' + T('Bậc ', 'Rank ') + (r + 1) + '/10 · ' + jp(RANKS[r][3]) + '</small><h1>' + h(rankName(r)) + '</h1>' +
      '<label class="ktitle">' + T('Danh hiệu', 'Title') + ' <select class="field" data-change="kTitle">' + titles + '</select></label>' + xpBar(xp, r) + '</div></div>' +
      '<div class="card"><h3>' + T('MÀU ẤN TÍN', 'SEAL COLOR') + '</h3><div class="swatches">' + sw + '</div></div>' +
      '<div class="kstats">' + st + '</div>' + questCard() + calendar() +
      '<h3 class="heading">' + T('SỔ ẤN TÍN', 'SEAL LEDGER') + ' · ' + total + '/' + ACH.length + ' · ' + Math.round(total * 100 / ACH.length) + '%</h3>' +
      '<div class="ktabs">' + tabs + '</div><div class="seg small kfilter">' + fs + '</div>' +
      '<div class="grid achs">' + (cards || '<p class="muted center">' + T('Không có thành tựu nào ở đây.', 'Nothing here.') + '</p>') + '</div>';
  }

  // ---------- hanh dong giao dien ----------
  var A = App.actions;
  A.kToast = function () { location.hash = '#/king'; };
  A.kQTab = function (el) { questTab = el.getAttribute('data-tab'); App.render(); };
  A.kReroll = function (el) { rerollDaily(el.getAttribute('data-id')); App.saveProgress(); App.render(); };
  A.kRerollW = function (el) { rerollWeekly(el.getAttribute('data-id')); App.saveProgress(); App.render(); };
  A.kCat = function (el) { catTab = parseInt(el.getAttribute('data-c'), 10); App.render(); };
  A.kFilter = function (el) { filter = el.getAttribute('data-f'); App.render(); };
  A.kTitle = function (el) { S().title = [el.value, Date.now()]; App.saveProgress(); App.render(); };
  A.kHanko = function (el) { S().hanko = [el.getAttribute('data-id'), Date.now()]; App.saveProgress(); App.render(); };
  A.kCrownUse = function (el) { S().hanko = [el.getAttribute('data-id'), Date.now()]; App.saveProgress(); closeCrown(); App.render(); };
  A.kCrownClose = function () { closeCrown(); };
  A.kSoundOn = function () { soundOn = true; writeLocal(SOUND_KEY, '1'); App.refreshChrome(); chime(false); };
  A.kSoundOff = function () { soundOn = false; writeLocal(SOUND_KEY, '0'); App.refreshChrome(); };

  App.addSettingsRow(function (setRow, seg) {
    return setRow(T('Âm báo thành tựu', 'Achievement sound'), seg([[T('Bật', 'On'), 'kSoundOn', soundOn], [T('Tắt', 'Off'), 'kSoundOff', !soundOn]]));
  });
  App.setHanko(function () {
    var id = S().hanko ? S().hanko[0] : 'son', r = rankOf(totalXp());
    for (var i = 0; i < HANKO.length; i++) if (HANKO[i].id === id && r >= HANKO[i].rank) return HANKO[i];
    return HANKO[0];
  });

  App.section({
    id: 'king',
    name: ['Hồ sơ', 'Profile'],
    glyph: '王',
    grid: false,
    ready: true,
    home: function () { return kingCard() + questCard(); },
    route: function (parts) {
      if (parts.length) return null;
      return { html: viewProfile(), title: T('Hồ sơ nhà vua', "The King's Profile"), back: '', backLabel: T('Trang chủ', 'Home') };
    },
    badge: function () {
      var k = S(), t = today();
      for (var id in k.unlocked) if (k.unlocked[id] > k.seenAch) return true;
      return new Date().getHours() >= 20 && (k.quests[t] || []).length < 3;
    },
    afterRender: function () { setTimeout(flush, 300); }
  });

  // Phuc vu kiem thu tu dong.
  App.king = { context: context, totalXp: totalXp, rankOf: rankOf, evaluate: evaluate, ACH: ACH, QUESTS: QUEST_BY_ID, WEEKLY: WEEK_BY_ID, merge: mergeKing, dailyIds: dailyIds, weekStats: weekStats, dayStats: dayStats, deviceId: function () { return deviceId; } };
})();
