// Muc Ngu phap: moi mau la mot cong trinh, moi bai la mot quan the xay tren ban do. Cu phap ES5.
(function () {
  'use strict';

  var App = window.App, T = App.T, h = App.h, jp = App.jp, shuffle = App.shuffle, bar = App.bar;
  var DATA = window.GRAMMAR_DATA || {};
  var HOUR = 3600000, DAY = 24 * HOUR;
  var INTERVAL = [0, DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY];
  var TOP = 6, DONE_LV = 5, ROUND = 10, GOOD_RATE = 0.8, PASS = 0.8, MAX_DAILY = 2;
  var FURI_KEY = 'wtkl.gfuri';
  var LEVELS = [null, ['Móng', 'Foundation'], ['Khung', 'Frame'], ['Tường', 'Walls'], ['Mái', 'Roof'], ['Hoàn thiện', 'Finished'], ['Danh thắng', 'Landmark']];
  // [chu Han, ten VI, ten EN, loi Thai pho VI, EN, kieu cong trinh cho tung mau]
  var COMPLEX = [
    ['関所', 'Trạm gác', 'Checkpoint', 'Mọi lữ khách qua trạm phải xưng danh: "Tôi là ai, từ đâu đến".', 'Every traveller at the checkpoint must say who they are.', ['gate', 'house', 'tower', 'hall', 'store']],
    ['物見櫓', 'Vọng lâu', 'Watchtower', 'Từ vọng lâu, Bệ hạ chỉ gần chỉ xa: cái này, cái đó, cái kia.', 'From the tower you point near and far: this, that, that over there.', ['tower', 'house', 'tower', 'hall', 'stall']],
    ['鐘楼', 'Lầu chuông', 'Bell Tower', 'Chuông điểm giờ, chợ hỏi giá: bài của giờ giấc và tiền bạc.', 'The bell tells the hour and the market asks the price.', ['bell', 'stall', 'house', 'hall', 'store']],
    ['宿場', 'Trạm dịch', 'Post Town', 'Trạm dịch là nơi người ta đi, đến và về.', 'A post town is where people come, go and return.', ['hall', 'house', 'stall', 'gate', 'store']],
    ['茶屋', 'Quán trà', 'Teahouse', 'Ở quán trà, người ta mời nhau: "Uống trà không?", "Cùng đi nhé!".', 'At the teahouse people invite each other: "Shall we?"', ['house', 'stall', 'house', 'hall', 'store']],
    ['庭園', 'Ngự uyển', 'Royal Garden', 'Vào ngự uyển phải biết khen: đẹp, yên tĩnh, rộng lớn.', 'In the royal garden you must know how to praise: beautiful, quiet, vast.', ['pavilion', 'bridge', 'pavilion', 'hall', 'gate']],
    ['蔵', 'Kho lẫm', 'Storehouses', 'Kho lẫm cần biết cái gì ở đâu: trên, dưới, trong, cạnh.', 'In the storehouses you must know what is where.', ['store', 'store', 'house', 'store', 'hall']],
    ['道場', 'Võ đường', 'Dojo', 'Ở võ đường, ai giỏi ai kém, thích gì ghét gì đều phải nói rõ.', 'At the dojo you say plainly who is skilled and what you like.', ['hall', 'house', 'gate', 'tower', 'store', 'house']],
    ['市場', 'Chợ phiên', 'Market', 'Chợ phiên là nơi so hàng, so giá: cái nào rẻ hơn, ngon nhất.', 'At the market you compare: which is cheaper, which is best.', ['stall', 'stall', 'house', 'store', 'stall']],
    ['神社', 'Đền thần', 'Shrine', 'Ở đền thần, người ta cầu ước: muốn có, muốn làm.', 'At the shrine people make wishes: what they want, what they want to do.', ['torii', 'shrine', 'house', 'torii']],
    ['奉行所', 'Phủ đường', 'Magistrate', 'Phủ đường ra lệnh, cho phép và cấm đoán.', 'The magistrate gives orders, permits and forbids.', ['gate', 'hall', 'house', 'tower', 'store']],
    ['工房', 'Xưởng thủ công', 'Workshop', 'Thợ thủ công làm việc theo thứ tự: làm cái này rồi đến cái kia.', 'Craftsmen work in order: this first, then that.', ['house', 'store', 'house', 'hall']],
    ['寺', 'Chùa', 'Temple', 'Chùa có giới luật: điều không được làm, điều phải làm.', 'The temple has rules: what you must not do and what you must.', ['gate', 'pagoda', 'hall', 'bell']],
    ['学問所', 'Học đường', 'Academy', 'Học đường dạy người ta làm được gì và thích làm gì.', 'The academy teaches what you can do and what you love doing.', ['hall', 'house', 'tower', 'house', 'store']],
    ['港', 'Bến cảng', 'Harbor', 'Bến cảng kể chuyện những chuyến đi đã qua.', 'The harbor tells stories of journeys past.', ['store', 'tower', 'house', 'store', 'gate']],
    ['天守閣', 'Thiên thủ các', 'Castle Keep', 'Thiên thủ các là đỉnh cao của toà thành: mọi thứ đổi thay ở đây.', 'The keep is the height of the castle: here everything changes.', ['castle', 'gate', 'tower', 'hall', 'store']]
  ];
  // Phong nen theo vung: nui, bien, tuyet, thanh thi
  var BACKDROP = ['city', 'sea', 'mount', 'sea', 'mount', 'city', 'mount', 'city', 'city', 'snow', 'snow', 'sea', 'snow', 'city', 'mount', 'sea'];
  var GAMES = [
    ['bricks', '磚', ['Thợ cả xếp gạch', 'Master Mason'], ['90 giây xếp câu, mỗi câu đúng là một hàng gạch', '90 seconds of sentence ordering; every right one adds a row of bricks'], 2],
    ['inspect', '検', ['Giám định công trình', 'Building Inspector'], ['Tìm đoạn sai ngữ pháp trong 10 câu', 'Find the grammar mistake in 10 sentences'], 4]
  ];
  var BRICK_MS = 90000;

  var learn = null, review = null, game = null, curMode = '', mapSel = 0, furi = true, lastAnim = null;
  try { furi = localStorage.getItem(FURI_KEY) !== '0'; } catch (e) { /* che do an danh */ }

  // ---------- du lieu ----------
  function D() { return DATA.n5; }
  function P(i) { return D().patterns[i]; }
  function S(i) { return D().s[i]; }
  function G() {
    var p = App.progress();
    if (!p.grammar) p.grammar = {};
    var g = p.grammar;
    if (!g.p) g.p = {};
    if (!g.l) g.l = {};
    if (!g.fin) g.fin = {};
    return g;
  }
  // Ban ghi mau: [cap, han on, so lan sai, chuoi dung, lan on cuoi, lan hoc]
  function rec(i) { return G().p[i] || null; }
  function lv(i) { var r = rec(i); return r ? r[0] : 0; }
  function isDue(r, now) { return r && r[0] < TOP && r[1] <= now; }
  function dayStart() { var d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function todayStat() {
    var g = G(), d = dayStart();
    if (!g.today || g.today[0] !== d) g.today = [d, 0, 0];
    return g.today;
  }
  function lessonCount() { return D().lessons.length; }
  function lessonOf(pid) { var L = D().lessons; for (var i = 0; i < L.length; i++) if (L[i].indexOf(pid) >= 0) return i + 1; return 1; }
  function lessonDone(n) { return !!G().l[n]; }
  function threshold(n) { return 20 + 45 * (n - 1); }
  function vocabRecs() { var v = App.progress().vocab; return v && v.w ? v.w : {}; }
  function vocabWords() { var v = window.VOCAB_DATA && window.VOCAB_DATA.n5; return v ? v.words : []; }
  function wordsLearned() { return Object.keys(vocabRecs()).length; }
  function wordKnown(id) { var w = vocabWords()[id]; return !!(w && vocabRecs()[w[0] + '|' + w[1]]); }
  function lessonsToday() { var t = dayStart(), n = 0, l = G().l; for (var k in l) if (l[k][0] >= t) n++; return n; }
  function goodDay() { var t = todayStat(); return t[2] > 0 && t[1] / t[2] >= GOOD_RATE; }
  function dailyLimit() { return goodDay() ? MAX_DAILY : 1; }
  function nextLesson() { for (var n = 1; n <= lessonCount(); n++) if (!lessonDone(n)) return n; return 0; }
  // Ly do bai n chua hoc duoc; rong la hoc duoc
  function lockReason(n) {
    if (lessonDone(n)) return '';
    if (n > 1 && !lessonDone(n - 1)) return T('Học xong bài ' + (n - 1) + ' trước', 'Finish lesson ' + (n - 1) + ' first');
    var need = threshold(n) - wordsLearned();
    if (need > 0) return T('Cần tiếp kiến thêm ' + need + ' thần dân', 'Meet ' + need + ' more subjects');
    if (lessonsToday() >= dailyLimit()) return T('Hôm nay đã khởi công, mai Bệ hạ xây tiếp', 'You have broken ground today. Build more tomorrow');
    return '';
  }
  function dueList() {
    var now = Date.now(), out = [], all = G().p;
    for (var k in all) if (isDue(all[k], now) && P(+k)) out.push(+k);
    out.sort(function (a, b) { return rec(a)[1] - rec(b)[1]; });
    return out;
  }
  function nextDue() { var m = 0, all = G().p; for (var k in all) if (all[k][0] < TOP && (!m || all[k][1] < m)) m = all[k][1]; return m; }
  function learnedCount() { return Object.keys(G().p).length; }
  // 0: khong, 1: reu nhe, 2: reu day, 3: day leo
  function moss(i, now) {
    var r = rec(i);
    if (!isDue(r, now || Date.now())) return 0;
    var days = ((now || Date.now()) - r[1]) / DAY;
    return days >= 30 ? 3 : days >= 7 ? 2 : 1;
  }
  function complexState(n) {
    var ids = D().lessons[n - 1], low = TOP, m = 0, now = Date.now();
    if (!lessonDone(n)) return { st: 'none', low: 0, moss: 0 };
    for (var i = 0; i < ids.length; i++) { low = Math.min(low, lv(ids[i])); m = Math.max(m, moss(ids[i], now)); }
    return { st: low >= TOP ? 'mark' : low >= DONE_LV ? 'done' : 'build', low: low, moss: m };
  }
  function region(n) { return G().l[n] ? G().l[n][1] || 0 : 0; }
  function complexAt(r) { var l = G().l; for (var k in l) if (l[k][1] === r) return +k; return 0; }
  function V() { return App.vocabApi; }
  function mapOpen() { return !V() || V().mapOpen(); }
  function regionName(r) { return V() ? V().regionName(r) : T('Vùng ', 'Land ') + r; }
  function regionReady(r) { return V() && V().landState(r).st !== 'wild'; }
  function freeRegions() {
    var out = [];
    for (var r = 1; r <= 16; r++) if (regionReady(r) && !complexAt(r)) out.push(r);
    return out;
  }
  function stored() { var out = [], l = G().l; for (var k in l) if (!l[k][1]) out.push(+k); return out.sort(function (a, b) { return a - b; }); }
  function checkFinished(silent) {
    var g = G();
    for (var n = 1; n <= lessonCount(); n++) {
      if (g.fin[n]) continue;
      var st = complexState(n).st;
      if (st !== 'done' && st !== 'mark') continue;
      g.fin[n] = Date.now();
      if (!silent) App.emit('grammar:complex', { n: n, name: cname(n), all: Object.keys(g.fin).length === lessonCount() });
    }
  }

  App.addMerger('grammar', function (a, b) {
    a = a || {}; b = b || {};
    var out = { p: {}, l: {}, fin: {} }, k, ap = a.p || {}, bp = b.p || {};
    for (k in ap) out.p[k] = ap[k];
    for (k in bp) if (!out.p[k] || bp[k][4] > out.p[k][4]) out.p[k] = bp[k];
    var al = a.l || {}, bl = b.l || {};
    for (k in al) out.l[k] = al[k].slice();
    for (k in bl) {
      var x = out.l[k], y = bl[k];
      if (!x) { out.l[k] = y.slice(); continue; }
      // Dat vung lan dau thang
      var place = !x[2] ? y : !y[2] ? x : (y[2] < x[2] ? y : x);
      out.l[k] = [Math.min(x[0], y[0]), place[1] || 0, place[2] || 0];
    }
    for (k in a.fin || {}) out.fin[k] = a.fin[k];
    for (k in b.fin || {}) out.fin[k] = out.fin[k] ? Math.min(out.fin[k], b.fin[k]) : b.fin[k];
    var ad = a.today, bd = b.today;
    if (ad || bd) out.today = !ad ? bd : !bd ? ad : (bd[0] !== ad[0] ? (bd[0] > ad[0] ? bd : ad) : (bd[2] > ad[2] ? bd : ad));
    return out;
  });

  // ---------- cau: [ja, vi, en, phuong an sai, manh, loi, dang goc, tu vung, ma am thanh] ----------
  function units(raw) {
    var out = [], mark = '', i = 0;
    while (i < raw.length) {
      var c = raw.charAt(i);
      if (c === '[') { mark = 'b'; i++; continue; }
      if (c === '<') { mark = 'c'; i++; continue; }
      if (c === ']' || c === '>') { mark = ''; i++; continue; }
      if (c === '{') {
        var end = raw.indexOf('}', i), bits = raw.slice(i + 1, end).split('|');
        out.push({ b: bits[0], r: bits[1], m: mark });
        i = end + 1; continue;
      }
      out.push({ b: c, r: '', m: mark });
      i++;
    }
    var pos = 0;
    for (i = 0; i < out.length; i++) { out[i].p = pos; pos += out[i].b.length; }
    return out;
  }
  function plainOf(u) { var s = ''; for (var i = 0; i < u.length; i++) s += u[i].b; return s; }
  function kanaOf(u) { var s = ''; for (var i = 0; i < u.length; i++) s += u[i].r || u[i].b; return s; }
  function rubyHtml(u) {
    var s = '';
    for (var i = 0; i < u.length; i++) s += u[i].r ? '<ruby>' + h(u[i].b) + '<rt>' + h(u[i].r) + '</rt></ruby>' : h(u[i].b);
    return s;
  }
  function ruby(raw) { return rubyHtml(units(raw)); }
  function slice(u, from, to) { return u.filter(function (x) { return x.p >= from && x.p < to; }); }
  // opts.blank / opts.conj: html thay cho doan danh dau
  function sentHtml(raw, opts) {
    var u = units(raw), s = '', done = {};
    opts = opts || {};
    for (var i = 0; i < u.length; i++) {
      var m = u[i].m;
      if (m === 'b' && opts.blank !== undefined) { if (!done.b) s += opts.blank; done.b = 1; continue; }
      if (m === 'c' && opts.conj !== undefined) { if (!done.c) s += opts.conj; done.c = 1; continue; }
      s += u[i].r ? '<ruby>' + h(u[i].b) + '<rt>' + h(u[i].r) + '</rt></ruby>' : h(u[i].b);
    }
    return '<span lang="ja" class="jp gsent' + (furi ? '' : ' nofuri') + '">' + s + '</span>';
  }
  function markedRaw(raw, open, close) { var a = raw.indexOf(open), b = raw.indexOf(close); return a >= 0 ? raw.slice(a + 1, b) : ''; }
  function tilesSpan(s) {
    var u = units(s[0]), plain = plainOf(u), joined = '', i;
    for (i = 0; i < s[4][0].length; i++) joined += plainOf(units(s[4][0][i]));
    var at = plain.indexOf(joined);
    return { u: u, at: at, end: at + joined.length };
  }
  function tr(s) { return App.isEn() ? s[2] : s[1]; }
  function unknownChips(s) {
    var out = '', W = vocabWords();
    for (var i = 0; i < s[7].length; i++) {
      var w = W[s[7][i]];
      if (w && !wordKnown(s[7][i])) out += '<span class="gchip">' + jp(w[0]) + ' <small>' + h(App.isEn() ? w[5].split(';')[0] : w[4]) + '</small></span>';
    }
    return out ? '<div class="gchips"><small>' + T('Từ chưa tiếp kiến:', 'Words not met yet:') + '</small>' + out + '</div>' : '';
  }
  function sayBtn(sid, big) {
    return '<button class="icon-btn gsay' + (big ? ' big-say' : '') + '" data-act="gSay" data-s="' + sid + '" title="' + T('Nghe câu', 'Play sentence') + '">' + (big ? '🔊' : '▶') + '</button>';
  }
  function speak(sid, el) {
    var s = S(sid), text = plainOf(units(s[0]));
    if (window.Speech.sayGr) window.Speech.sayGr(s[8], text, el); else window.Speech.say(text, el);
  }

  // ---------- noi dung theo ngon ngu ----------
  function pname(i) { return App.L(P(i).n); }
  function cname(n) { return COMPLEX[n - 1][0] + ' ' + T(COMPLEX[n - 1][1], COMPLEX[n - 1][2]); }
  function levelName(l) { return l ? App.L(LEVELS[l]) : T('Chưa xây', 'Not built'); }
  function levelBadge(l) { return '<span class="glv l' + l + '">' + h(levelName(l)) + '</span>'; }
  function link(rest) { return '#/grammar' + (rest ? '/' + rest : ''); }
  // Trang mau nam duoi trang quan the de nut quay lai di dung cap
  function plink(pid) { return link('c/' + lessonOf(pid) + '/p/' + pid); }
  function lessonLabel(n) { return T('Bài ', 'Lesson ') + n; }
  function formula(f) {
    var out = '', parts = f.match(/\([^)]*\)|\S+/g) || [];
    for (var i = 0; i < parts.length; i++) {
      var x = parts[i];
      var cls = /^N\d?$/.test(x) ? 'n' : /^V/.test(x) ? 'v' : /^(A|い-adj|な-adj|adj)/.test(x) ? 'a' : /^(\/|〜|→|\+)$/.test(x) || x.charAt(0) === '(' ? 'sep' : /[ぁ-んァ-ヶ一-龯]/.test(x) ? 'j' : 'sep';
      out += '<span class="gf ' + cls + '"' + (cls === 'j' ? ' lang="ja"' : '') + '>' + h(x) + '</span>';
    }
    return '<span class="gform">' + out + '</span>';
  }
  function building(pid, opts) {
    var n = lessonOf(pid), idx = D().lessons[n - 1].indexOf(pid), type = COMPLEX[n - 1][5][idx % COMPLEX[n - 1][5].length];
    return window.GScene ? window.GScene.building(type, opts.lv, opts.moss || 0, { seed: pid, cls: opts.cls, grow: opts.grow, blueprint: opts.blueprint }) : '';
  }
  function scene(n, opts) {
    if (!window.GScene) return '';
    var ids = D().lessons[n - 1], list = [], now = Date.now(), blue = !lessonDone(n) || (opts && opts.blueprint);
    for (var i = 0; i < ids.length; i++) {
      list.push({ type: COMPLEX[n - 1][5][i % COMPLEX[n - 1][5].length], lv: blue ? 4 : Math.max(1, lv(ids[i])), moss: blue ? 0 : moss(ids[i], now), pid: ids[i],
        grow: opts && opts.grow && opts.grow[ids[i]] });
    }
    var r = region(n);
    return window.GScene.scene(list, { backdrop: r ? BACKDROP[r - 1] : 'city', blueprint: blue, link: !blue && opts && opts.link, title: COMPLEX[n - 1][0] });
  }

  // ---------- cau hoi ----------
  function pool(pid, key) {
    var p = P(pid), out = [];
    for (var i = 0; i < p.q.length; i++) {
      var s = S(p.q[i]);
      if (key === 'blank' ? s[3] : key === 'order' || key === 'star' || key === 'inspect' ? (key === 'inspect' ? s[5] : s[4]) : key === 'conj' ? s[6] : true) out.push(p.q[i]);
    }
    if (key === 'mean' || key === 'listen') out = out.concat(p.ex);
    return out;
  }
  // Uu tien cau toan tu da hoc, cong them neu co tu cua vung dat quan the
  function pickSentence(pid, key, used) {
    var cands = pool(pid, key), best = -1, bestScore = -1, r = region(lessonOf(pid));
    var regionSet = {};
    if (r && window.VOCAB_DATA) { var sess = window.VOCAB_DATA.n5.sessions[r - 1]; for (var j = 0; j < sess.length; j++) regionSet[sess[j]] = 1; }
    for (var i = 0; i < cands.length; i++) {
      var s = S(cands[i]), known = 0, local = 0;
      for (var k = 0; k < s[7].length; k++) { if (wordKnown(s[7][k])) known++; if (regionSet[s[7][k]]) local = 1; }
      var score = (s[7].length ? known / s[7].length : 1) + 0.3 * local + Math.random() * 0.25 - (used[cands[i]] ? 2 : 0);
      if (score > bestScore) { bestScore = score; best = cands[i]; }
    }
    if (best >= 0) used[best] = 1;
    return best;
  }
  function meanOptions(sid, pid, rev) {
    var n = lessonOf(pid), near = [], far = [], seen = {}, me = S(sid), i, j;
    seen[me[1]] = 1;
    for (i = 0; i < D().lessons.length; i++) {
      var ids = D().lessons[i];
      for (j = 0; j < ids.length; j++) {
        if (ids[j] === pid) continue;
        var all = P(ids[j]).ex.concat(P(ids[j]).q);
        for (var k = 0; k < all.length; k++) (i === n - 1 ? near : far).push(all[k]);
      }
    }
    var opts = [sid], cand = shuffle(near).concat(shuffle(far));
    for (i = 0; i < cand.length && opts.length < 4; i++) {
      var s = S(cand[i]);
      if (seen[s[1]]) continue;
      seen[s[1]] = 1; opts.push(cand[i]);
    }
    return shuffle(opts);
  }
  function makeItem(pid, type, used) {
    var sid = pickSentence(pid, type, used);
    if (sid < 0) return null;
    var s = S(sid), it = { pid: pid, sid: sid, type: type };
    if (type === 'blank') {
      var ans = markedRaw(s[0], '[', ']');
      it.opts = shuffle([ans].concat(s[3]));
      it.ans = it.opts.indexOf(ans);
    } else if (type === 'order') {
      it.bag = shuffle([0, 1, 2, 3]);
      it.slots = [];
    } else if (type === 'star') {
      it.opts = shuffle([0, 1, 2, 3]);
      it.ans = it.opts.indexOf(s[4][1] - 1);
    } else if (type === 'mean' || type === 'listen' || type === 'meanr') {
      it.opts = meanOptions(sid, pid);
      it.ans = it.opts.indexOf(sid);
    }
    return it;
  }
  function typesFor(pid, review) {
    var core = [], extra = ['mean', 'listen', 'meanr'];
    if (pool(pid, 'blank').length) core.push('blank');
    if (pool(pid, 'order').length) core.push(review && lv(pid) >= 4 ? 'star' : 'order');
    if (P(pid).conj && pool(pid, 'conj').length) core.push('conj');
    return { core: core, extra: extra };
  }
  function reviewItems(pid, used) {
    var t = typesFor(pid, true), a = shuffle(t.core), first = a[0] || 'mean';
    var rest = a.slice(1).concat(Math.random() < 0.6 ? [] : shuffle(t.extra));
    if (!rest.length) rest = shuffle(t.extra);
    return [makeItem(pid, first, used), makeItem(pid, rest[0], used)].filter(Boolean);
  }
  function newQuiz(items, mode) {
    return { qs: shuffle(items), i: 0, picked: -1, typed: null, near: false, failed: {}, right: 0, total: 0, mode: mode };
  }

  function isRight(q, it) {
    var s = S(it.sid);
    if (it.type === 'order') {
      for (var i = 0; i < 4; i++) if (it.slots[i] !== i) return false;
      return true;
    }
    if (it.type === 'conj') return conjOk(it.typed, s);
    return q.picked === it.ans;
  }
  function conjOk(v, s) {
    if (v === null || v === undefined) return false;
    var u = units(s[0]).filter(function (x) { return x.m === 'c'; }), R = App.romaji;
    if (v === plainOf(u)) return true;
    return R ? R.same(v, kanaOf(u)) : v === kanaOf(u);
  }

  function qHead(q) {
    return '<div class="gqhead"><p class="eyebrow">' + T('Câu ', 'Question ') + (q.i + 1) + '/' + q.qs.length + '</p>' +
      '<button class="btn small gfuri' + (furi ? ' on' : '') + '" data-act="gFuri" title="' + T('Bật/tắt furigana', 'Toggle furigana') + '">' + jp('ふ') + '</button></div>' + bar(q.i, q.qs.length);
  }
  function viewItem(q) {
    var it = q.qs[q.i], s = S(it.sid), answered = it.done, html = '', i, p = P(it.pid);
    var ask = '', body = '', hint = '<p class="muted gtr">' + h(tr(s)) + '</p>';
    if (it.type === 'blank') {
      ask = T('Chọn từ điền vào chỗ trống', 'Choose what fills the blank');
      body = '<div class="card prompt gprompt">' + sentHtml(s[0], { blank: '<span class="gblank">' + (answered ? ruby(it.opts[it.ans]) : '（　　）') + '</span>' }) + hint + '</div><div class="opts">';
      for (i = 0; i < it.opts.length; i++) body += optBtn(i, '<span lang="ja" class="jp">' + ruby(it.opts[i]) + '</span>', it, q);
      body += '</div>';
    } else if (it.type === 'order') {
      var sp = tilesSpan(s), slots = '', bag = '';
      ask = T('Chạm các mảnh để xếp thành câu đúng', 'Tap the pieces to build the sentence');
      for (i = 0; i < 4; i++) {
        var got = it.slots[i];
        slots += got === undefined ? '<span class="gslot"></span>'
          : '<button class="gslot full' + (answered ? (got === i ? ' right' : ' wrong') : '') + '" data-act="gUnslot" data-i="' + i + '"' + (answered ? ' disabled' : '') + '>' + ruby(s[4][0][got]) + '</button>';
      }
      for (i = 0; i < it.bag.length; i++) {
        var k = it.bag[i];
        if (it.slots.indexOf(k) >= 0) continue;
        bag += '<button class="gtile" data-act="gTile" data-k="' + k + '"' + (answered ? ' disabled' : '') + '><span lang="ja" class="jp">' + ruby(s[4][0][k]) + '</span></button>';
      }
      body = '<div class="card prompt gprompt"><span lang="ja" class="jp gsent' + (furi ? '' : ' nofuri') + '">' + rubyHtml(slice(sp.u, 0, sp.at)) + '<span class="gslots">' + slots + '</span>' +
        rubyHtml(slice(sp.u, sp.end, 1e9)) + '</span>' + hint + '</div>' + (bag ? '<div class="gbag">' + bag + '</div>' : '') +
        (!answered && it.slots.length === 4 ? '<div class="row"><button class="btn primary" data-act="gCheck">' + T('Kiểm tra', 'Check') + '</button></div>' : '');
    } else if (it.type === 'star') {
      var sp2 = tilesSpan(s), blanks = '';
      ask = T('Mảnh nào đứng ở vị trí ★?', 'Which piece goes in the ★ slot?');
      for (i = 0; i < 4; i++) blanks += '<span class="gslot' + (i === s[4][1] - 1 ? ' star' : '') + '">' + (answered ? ruby(s[4][0][i]) : i === s[4][1] - 1 ? '★' : '') + '</span>';
      body = '<div class="card prompt gprompt"><span lang="ja" class="jp gsent' + (furi ? '' : ' nofuri') + '">' + rubyHtml(slice(sp2.u, 0, sp2.at)) + '<span class="gslots">' + blanks + '</span>' +
        rubyHtml(slice(sp2.u, sp2.end, 1e9)) + '</span>' + hint + '</div><div class="opts">';
      for (i = 0; i < it.opts.length; i++) body += optBtn(i, '<span lang="ja" class="jp">' + ruby(s[4][0][it.opts[i]]) + '</span>', it, q);
      body += '</div>';
    } else if (it.type === 'conj') {
      var cu = units(s[0]).filter(function (x) { return x.m === 'c'; });
      ask = T('Gõ dạng đúng (romaji hoặc kana)', 'Type the right form (romaji or kana)');
      body = '<div class="card prompt gprompt">' + sentHtml(s[0], { conj: '<span class="gblank">' + (answered ? rubyHtml(cu) : '（' + ruby(s[6]) + ' → ＿＿）') + '</span>' }) + hint + '</div>';
      if (!answered) {
        body += '<form class="vtype" onsubmit="return false"><input id="gInput" class="field" autocomplete="off" autocapitalize="off" spellcheck="false" lang="ja" data-input="gType"' +
          (q.near ? ' placeholder="' + T('Gần đúng rồi, gõ lại nhé', 'Almost, try again') + '"' : '') + '><button class="btn primary" data-act="gSubmit">' + T('Trả lời', 'Answer') + '</button></form>' +
          '<p class="center"><button class="btn small" data-act="gGiveUp">' + T('Không nhớ', 'I don\'t know') + '</button></p>';
      } else {
        var ok = conjOk(it.typed, s);
        body += '<p class="center vres ' + (ok ? 'good' : 'bad') + '">' + (ok ? '✓ ' : '✗ ' + (it.typed ? h(it.typed) + ' → ' : '')) + jp(kanaOf(cu)) + '</p>';
      }
    } else {
      var rev = it.type === 'meanr';
      ask = it.type === 'listen' ? T('Nghe và chọn nghĩa', 'Listen and choose the meaning') : rev ? T('Chọn câu tiếng Nhật đúng', 'Choose the right Japanese sentence') : T('Chọn nghĩa đúng', 'Choose the meaning');
      var prompt = it.type === 'listen' ? sayBtn(it.sid, true) : rev ? '<b class="gvi">' + h(tr(s)) + '</b>' : sentHtml(s[0]);
      body = '<div class="card prompt gprompt">' + prompt + '</div><div class="opts gopts-long">';
      for (i = 0; i < it.opts.length; i++) body += optBtn(i, rev ? sentHtml(S(it.opts[i])[0]) : h(tr(S(it.opts[i]))), it, q);
      body += '</div>';
    }
    html = qHead(q) + '<p class="center muted gask">' + ask + '</p>' + body;
    if (!answered && it.type !== 'listen' && it.type !== 'meanr') html += unknownChips(s);
    if (answered) {
      var good = isRight(q, it);
      html += '<div class="card gafter ' + (good ? 'good' : 'bad') + '"><div class="gafter-s">' + sayBtn(it.sid) + sentHtml(s[0]) + '</div><p class="muted">' + h(tr(s)) + '</p>' +
        (good ? '' : '<p class="gwhy">' + formula(p.f) + ' <span>' + h(pname(it.pid)) + '</span></p>') + '</div>' +
        '<div class="row"><button class="btn primary" id="gNext" data-act="gNext">' + (q.i === q.qs.length - 1 ? T('Xong', 'Finish') : T('Câu tiếp', 'Next')) + '</button></div>';
    }
    return '<div class="quiz gquiz">' + html + '</div>';
  }
  function optBtn(i, label, it, q) {
    var cls = 'opt';
    if (it.done && i === it.ans) cls += ' right';
    else if (it.done && i === q.picked) cls += ' wrong';
    return '<button class="' + cls + '" data-act="gPick" data-i="' + i + '"' + (it.done ? ' disabled' : '') + '>' + label + '</button>';
  }

  // ---------- hoc bai ----------
  function startLearn(n) {
    learn = { n: n, i: 0, phase: lockReason(n) ? 'locked' : 'intro', quiz: null, missed: null, grow: null };
  }
  function practiceQuiz(pid) {
    var used = {}, items = [makeItem(pid, 'blank', used), makeItem(pid, 'order', used)].filter(Boolean);
    return newQuiz(items, 'practice');
  }
  function testQuiz(n) {
    var ids = D().lessons[n - 1], used = {}, items = [], i;
    for (i = 0; i < ids.length; i++) {
      var t = typesFor(ids[i], false), core = shuffle(t.core);
      items.push(makeItem(ids[i], core[0] || 'mean', used));
    }
    var extra = shuffle(ids.concat(ids)).slice(0, Math.max(0, 8 - ids.length));
    for (i = 0; i < extra.length; i++) {
      var tt = typesFor(extra[i], false), opts = tt.core.concat(['mean']);
      items.push(makeItem(extra[i], opts[Math.floor(Math.random() * opts.length)], used));
    }
    return newQuiz(items.filter(Boolean), 'test');
  }
  function patternCard(pid, withEx) {
    var p = P(pid), ex = '';
    for (var i = 0; i < p.ex.length; i++) {
      var s = S(p.ex[i]);
      ex += '<div class="gex">' + sayBtn(p.ex[i]) + '<div>' + sentHtml(s[0]) + '<p class="muted">' + h(tr(s)) + '</p></div></div>';
    }
    return '<div class="card gpcard"><p class="gp-form">' + formula(p.f) + '</p><h2>' + h(pname(pid)) + '</h2>' +
      '<p>' + h(App.L(p.x)) + '</p>' +
      (p.no ? '<div class="gnote"><b>' + T('Lưu ý', 'Watch out') + '</b><p>' + h(App.L(p.no)) + '</p></div>' : '') +
      (p.cp ? '<div class="gnote cmp"><b>' + T('So sánh', 'Compare') + '</b><p>' + h(App.L(p.cp)) + '</p></div>' : '') +
      (p.tip && !App.isEn() ? '<div class="vtip"><b>Mẹo của Thái phó</b><p>' + h(p.tip) + '</p></div>' : '') +
      (withEx ? '<h3>' + T('VÍ DỤ', 'EXAMPLES') + '</h3>' + ex : '') +
      (p.pod ? '<p class="gpod"><button class="btn small" data-act="gPod" data-p="' + pid + '">🎧 ' + T('Nghe trong podcast', 'Hear it in the podcast') + '</button> <small class="muted" lang="ja">' + h(p.pod[2]) + '</small></p>' : '') + '</div>';
  }
  function viewLearn(n) {
    if (!learn || learn.n !== n) startLearn(n);
    var c = COMPLEX[n - 1], ids = D().lessons[n - 1];
    var head = '<div class="hero slim"><p class="eyebrow">' + T('Khởi công', 'Breaking ground') + ' · ' + lessonLabel(n) + ' · ' + h(cname(n)) + '</p></div>';
    if (learn.phase === 'locked') {
      return head + '<div class="card narrow center"><p>🔒 ' + h(lockReason(n) || T('Bài này đã học xong.', 'This lesson is done.')) + '</p></div>' +
        '<div class="row"><a class="btn primary" href="' + link('') + '">' + T('Về Ngữ pháp', 'Back to Grammar') + '</a></div>';
    }
    if (learn.phase === 'intro') {
      var list = '';
      for (var i = 0; i < ids.length; i++) list += '<li>' + formula(P(ids[i]).f) + '</li>';
      return head + '<div class="gscene-box blue">' + scene(n, { blueprint: true }) + '</div>' +
        '<p class="center muted">' + T('Thái phó: "' + c[3] + '"', 'Tutor: "' + c[4] + '"') + '</p>' + suggestCard(n) +
        '<div class="card narrow"><h3>' + T('BẢN VẼ: ' + ids.length + ' CÔNG TRÌNH', 'BLUEPRINT: ' + ids.length + ' BUILDINGS') + '</h3><ol class="glist">' + list + '</ol></div>' +
        '<div class="row"><button class="btn primary" data-act="gLearnGo">' + T('Bắt đầu', 'Begin') + '</button></div>';
    }
    if (learn.phase === 'teach') {
      var pid = ids[learn.i];
      return head + '<div class="narrow">' + bar(learn.i, ids.length) + '</div><p class="center muted">' + T('Công trình ', 'Building ') + (learn.i + 1) + '/' + ids.length + '</p>' +
        patternCard(pid, true) + '<div class="row"><button class="btn primary" data-act="gPractice">' + T('Luyện ngay', 'Practise') + '</button></div>';
    }
    if (learn.phase === 'practice' || learn.phase === 'test') {
      return head + (learn.phase === 'test' ? '<p class="center"><b>' + T('Kiểm tra cuối bài', 'Final check') + '</b> · ' + T('đúng từ 80% để khởi công', '80% to break ground') + '</p>' : '') + viewItem(learn.quiz);
    }
    if (learn.phase === 'retry') {
      var miss = '';
      for (var j = 0; j < learn.missed.length; j++) miss += '<a class="vres-row bad" href="' + plink(learn.missed[j]) + '">' + formula(P(learn.missed[j]).f) + '<span>' + h(pname(learn.missed[j])) + '</span></a>';
      return head + '<div class="hero"><h1>' + learn.score + '%</h1><p class="sub">' + T('Chưa đủ 80%. Xem lại các mẫu còn sai rồi kiểm tra lại nhé.', 'Not 80% yet. Look over the patterns you missed, then try again.') + '</p></div>' +
        '<div class="card narrow vres-list">' + miss + '</div><div class="row"><button class="btn primary" data-act="gRetest">' + T('Kiểm tra lại', 'Try the check again') + '</button></div>';
    }
    // xong
    var placeBtn = mapOpen() && freeRegions().length ? '<a class="btn primary" href="' + link('place/' + n) + '">' + T('Chọn vùng đặt quần thể', 'Choose a land for it') + '</a>' : '';
    var note = !mapOpen() ? T('Quần thể đã vào Kho bản vẽ. Khi đăng quang Tân vương, Bệ hạ sẽ đặt nó lên bản đồ.', 'The complex waits in the blueprint store. Once crowned New King, you can place it on the map.')
      : !freeRegions().length ? T('Chưa có vùng trống để xây. Quần thể chờ trong Kho bản vẽ.', 'No free land yet. The complex waits in the blueprint store.') : '';
    return head + '<div class="gscene-box">' + scene(n, { grow: learn.grow }) + '</div>' +
      '<div class="hero"><h1>' + T('Đã khởi công ', 'Ground broken: ') + h(cname(n)) + '</h1><p class="sub">' +
      T(ids.length + ' công trình đã đổ móng. Lần tu bổ đầu tiên vào ngày mai.', ids.length + ' foundations laid. The first repair round is tomorrow.') + '</p>' +
      (note ? '<p class="note center">' + h(note) + '</p>' : '') + '</div>' +
      (lessonsToday() < dailyLimit() && nextLesson() && !lockReason(nextLesson()) ? '<p class="center muted">' + T('Thái phó: "Hôm nay Bệ hạ học rất tốt, thần xin dâng thêm một bản vẽ."', 'Tutor: "You studied well today, Your Majesty. Here is one more blueprint."') + '</p>' : '') +
      '<div class="row">' + placeBtn + '<a class="btn' + (placeBtn ? '' : ' primary') + '" href="' + link('') + '">' + T('Về Ngữ pháp', 'Back to Grammar') + '</a></div>';
  }
  function suggestCard(n) {
    var ids = D().lessons[n - 1], miss = {}, total = 0, unknown = 0, W = vocabWords();
    if (!window.VOCAB_DATA) return '';
    var sess = window.VOCAB_DATA.n5.sessions, sessOf = {};
    for (var si = 0; si < sess.length; si++) for (var sj = 0; sj < sess[si].length; sj++) sessOf[sess[si][sj]] = si + 1;
    for (var i = 0; i < ids.length; i++) {
      var all = P(ids[i]).ex.concat(P(ids[i]).q);
      for (var j = 0; j < all.length; j++) {
        var ws = S(all[j])[7];
        for (var k = 0; k < ws.length; k++) {
          total++;
          if (!wordKnown(ws[k]) && W[ws[k]]) { unknown++; miss[sessOf[ws[k]]] = (miss[sessOf[ws[k]]] || 0) + 1; }
        }
      }
    }
    if (!total || unknown / total < 0.35) return '';
    var best = 0;
    for (var s in miss) if (!best || miss[s] > miss[best]) best = +s;
    if (!best) return '';
    return '<div class="card narrow gsuggest"><p>' + T('Thái phó: "Câu của bài này có nhiều thần dân Bệ hạ chưa gặp. Tiếp kiến vùng ' + regionName(best) + ' trước thì bài sẽ dễ hơn. Không bắt buộc đâu ạ."',
      'Tutor: "This lesson\'s sentences use many subjects you have not met. Meeting the people of ' + regionName(best) + ' first will make it easier. Only a suggestion."') + '</p>' +
      '<a class="btn small" href="#/vocab/n5/' + best + '">' + T('Sang Từ vựng', 'Go to Vocabulary') + ' →</a></div>';
  }

  // ---------- tu bo ----------
  function startReview() {
    var list = dueList().slice(0, ROUND), used = {}, items = [];
    for (var i = 0; i < list.length; i++) items = items.concat(reviewItems(list[i], used));
    review = { list: list, quiz: items.length ? newQuiz(items, 'review') : null, result: null, cleared: false, grow: null };
  }
  function viewReview() {
    if (!review) startReview();
    var head = '<div class="hero slim"><p class="eyebrow">' + T('Tu bổ', 'Repairs') + '</p></div>';
    if (!review.quiz) {
      var nd = nextDue();
      return head + '<div class="card narrow center"><p>' + T('Chưa có công trình nào cần tu bổ.', 'No building needs repair yet.') + '</p>' +
        (nd ? '<p class="muted">' + T('Lần tu bổ tới: ', 'Next repair: ') + new Date(nd).toLocaleString() + '</p>' : '') + '</div>' +
        '<div class="row"><a class="btn primary" href="' + link('') + '">' + T('Về Ngữ pháp', 'Back to Grammar') + '</a></div>';
    }
    if (review.result) {
      var up = 0, rows = '', bl = '';
      for (var i = 0; i < review.result.length; i++) {
        var x = review.result[i];
        if (x.ok) up++;
        bl += '<a class="gres-b" href="' + plink(x.pid) + '">' + building(x.pid, { lv: lv(x.pid), moss: 0, grow: x.ok && x.to > x.from, cls: 'gb-res' }) + '</a>';
        rows += '<a class="vres-row ' + (x.ok ? 'good' : 'bad') + '" href="' + plink(x.pid) + '">' + formula(P(x.pid).f) + '<span>' + h(pname(x.pid)) + '</span>' + levelBadge(lv(x.pid)) + '</a>';
      }
      var more = dueList().length;
      return head + '<div class="gres-row">' + bl + '</div><div class="hero"><h1>' + up + '/' + review.result.length + '</h1><p class="sub">' +
        T(up + ' công trình được nâng cấp, ' + (review.result.length - up) + ' cần tu bổ thêm', up + ' buildings upgraded, ' + (review.result.length - up) + ' need more work') + '</p>' +
        (review.cleared ? '<p class="vrepel">' + jp('修') + ' ' + T('Đã tu bổ xong mọi công trình hôm nay!', 'Every building is repaired for today!') + '</p>' : '') + '</div>' +
        '<div class="card narrow vres-list">' + rows + '</div>' +
        '<div class="row">' + (more ? '<button class="btn primary" data-act="gReviewMore">' + T('Tu bổ tiếp', 'Keep repairing') + ' (' + more + ')</button>' : '') +
        '<a class="btn" href="' + link('') + '">' + T('Về Ngữ pháp', 'Back to Grammar') + '</a></div>';
    }
    return head + viewItem(review.quiz);
  }
  function grade(pid, ok) {
    var r = G().p[pid], now = Date.now();
    if (!r) return { from: 0, to: 0 };
    var before = r[0];
    if (ok) { r[0] = Math.min(TOP, r[0] + 1); r[3]++; }
    else { r[0] = Math.max(1, r[0] - (r[0] >= 4 ? 2 : 1)); r[2]++; r[3] = 0; }
    r[1] = r[0] >= TOP ? 0 : now + INTERVAL[r[0]];
    r[4] = now;
    if (r[0] !== before) App.emit('grammar:level', { pid: pid, from: before, to: r[0], weathered: now - (r[5] || now) > 0 ? before : 0 });
    return { from: before, to: r[0] };
  }

  // ---------- dat quan the ----------
  function viewPlace(n) {
    var head = '<div class="hero"><p class="eyebrow">' + lessonLabel(n) + '</p><h1>' + T('Đặt ', 'Place ') + h(cname(n)) + '</h1><p class="sub">' +
      T('Chọn một vùng đã có thần dân. Mỗi vùng một quần thể, đặt rồi không dời được.', 'Choose a land with subjects. One complex per land, and it stays where you put it.') + '</p></div>';
    if (!lessonDone(n)) return null;
    if (region(n)) return head + '<div class="card narrow center"><p>' + T('Quần thể đã đặt ở ', 'Already placed in ') + h(regionName(region(n))) + '.</p></div>';
    if (!mapOpen()) return head + '<div class="card narrow center"><p>🔒 ' + T('Đăng quang Tân vương để mở bản đồ.', 'Be crowned New King to open the map.') + '</p></div>';
    var free = freeRegions(), best = suggestRegion(n), cards = '';
    for (var i = 0; i < free.length; i++) {
      var r = free[i], st = V().landState(r);
      cards += '<button class="card mode gplace' + (r === best ? ' best' : '') + '" data-act="gPlace" data-n="' + n + '" data-r="' + r + '">' + jp(V().region(r)[0], 'glyph' + (V().region(r)[0].length > 1 ? ' long' : '')) +
        '<span class="body"><b>' + h(regionName(r)) + (r === best ? ' ✦' : '') + '</b><small>' + st.got + '/' + st.total + T(' thần dân', ' subjects') + ' · ' + h(T('Phông nền: ', 'Backdrop: ') + backdropName(BACKDROP[r - 1])) + '</small></span><i>→</i></button>';
    }
    return head + (free.length ? '<p class="note center">' + T('✦ = vùng gợi ý: nhiều thần dân của vùng này xuất hiện trong câu của bài.', '✦ = suggested: many of its subjects appear in this lesson\'s sentences.') + '</p><div class="rows narrow">' + cards + '</div>'
      : '<div class="card narrow center"><p>' + T('Chưa có vùng trống. Tiếp kiến thần dân ở vùng mới để mở đất.', 'No free land yet. Meet subjects in a new land to open it.') + '</p></div>');
  }
  function backdropName(b) { return App.L({ city: ['thành thị', 'town'], sea: ['biển', 'sea'], mount: ['núi', 'mountains'], snow: ['tuyết', 'snow'] }[b]); }
  function suggestRegion(n) {
    var free = freeRegions(), count = {}, ids = D().lessons[n - 1], best = 0;
    if (!window.VOCAB_DATA) return 0;
    var sess = window.VOCAB_DATA.n5.sessions;
    for (var i = 0; i < ids.length; i++) {
      var all = P(ids[i]).ex.concat(P(ids[i]).q);
      for (var j = 0; j < all.length; j++) {
        var ws = S(all[j])[7];
        for (var k = 0; k < ws.length; k++) for (var r = 0; r < free.length; r++) if (sess[free[r] - 1].indexOf(ws[k]) >= 0) count[free[r]] = (count[free[r]] || 0) + 1;
      }
    }
    for (var x in count) if (!best || count[x] > count[best]) best = +x;
    return best || free[0] || 0;
  }

  // ---------- ban do Kien thiet ----------
  function mapLands() {
    var out = [];
    for (var r = 1; r <= 16; r++) {
      var st = V() ? V().landState(r).st : 'wild', n = complexAt(r), cs = n ? complexState(n) : null, R = V() ? V().region(r) : ['', '', '', '', '', '', '', ''];
      var kind = st === 'wild' ? 'wild' : !cs ? 'empty' : cs.st === 'mark' ? (st === 'peace' ? 'thinh' : 'mark') : cs.st;
      var blds = [];
      if (n) {
        var ids = D().lessons[n - 1], now = Date.now();
        for (var i = 0; i < ids.length; i++) blds.push({ pid: ids[i], svg: building(ids[i], { lv: Math.max(1, lv(ids[i])), moss: moss(ids[i], now) }) });
      }
      out.push({ st: kind, moss: cs ? cs.moss > 0 : false, kanji: R[0], name: App.isEn() ? R[7] : R[2], blds: blds, n: n });
    }
    return out;
  }
  var BSTATES = { empty: ['Đất trống', 'Empty land'], build: ['Đang xây', 'Under construction'], done: ['Hoàn thiện', 'Finished'], mark: ['Danh thắng', 'Landmark'], thinh: ['Thịnh trị', 'Golden age'] };
  function mapCard(entry) {
    if (!window.VocabMap || !V()) return '';
    if (window.VocabMap.mode(entry) === 'land') return V().mapCard(entry);
    var open = mapOpen(), lands = mapLands();
    var toggle = window.VocabMap.toggle(entry);
    if (!open) {
      return '<div class="card vmapcard locked">' + toggle + '<div class="vmap-box">' + window.VocabMap.svg(lands, { locked: true, mode: 'build' }) +
        '<div class="vmap-lock">' + jp('🔒') + '<b>' + T('Đăng quang Tân vương để mở bản đồ vương quốc', 'Be crowned New King to open the map of your realm') + '</b></div></div></div>';
    }
    if (mapSel && !lands[mapSel - 1]) mapSel = 0;
    var info;
    if (mapSel) {
      var L = lands[mapSel - 1], R = V().region(mapSel), n = L.n;
      info = '<div class="vmap-info"><button class="icon-btn vmap-x" data-act="gMapClose" title="' + T('Đóng', 'Close') + '">✕</button>' +
        '<p class="vmi-head">' + jp(R[0], 'vmi-k') + '<b>' + h(App.isEn() ? R[7] : R[2]) + '</b> <small>' + jp(R[1]) + ' · ' + R[7] + '</small></p>';
      if (n) {
        var cs = complexState(n), due = 0, ids = D().lessons[n - 1];
        for (var i = 0; i < ids.length; i++) if (isDue(rec(ids[i]), Date.now())) due++;
        info += '<p><span class="gstate gs-' + L.st + '">' + h(App.L(BSTATES[L.st] || BSTATES.build)) + '</span> <small class="muted">' + h(cname(n)) + ' · ' + T('thấp nhất: ', 'lowest: ') + h(levelName(cs.low)) +
          (due ? ' · ' + due + T(' cần tu bổ', ' need repair') : '') + '</small></p>' +
          '<div class="row"><button class="btn" data-act="gFocus" data-r="' + mapSel + '">🔍 ' + T('Xem công trình', 'See buildings') + '</button>' +
          '<a class="btn primary" href="' + link('c/' + n) + '">' + T('Vào quần thể', 'Enter the complex') + ' →</a></div>';
      } else {
        info += '<p class="muted">' + (L.st === 'wild' ? T('Vùng chưa khai phá. Tiếp kiến thần dân ở đây để mở đất.', 'Unexplored. Meet subjects here to open the land.') : T('Đất trống, có thể đặt một quần thể.', 'Empty land, ready for a complex.')) + '</p>' +
          (L.st !== 'wild' && stored().length ? '<a class="btn primary" href="' + link('place/' + stored()[0]) + '">' + T('Đặt quần thể đang chờ', 'Place a waiting complex') + '</a>' : '');
      }
      info += '</div>';
    } else {
      info = '<div class="vmap-info vmap-key">';
      var F = window.VocabMap.buildFills();
      for (var k in BSTATES) info += '<span class="vkey"><i class="sw-b' + k + '" style="background:' + F[k] + '"></i>' + h(App.L(BSTATES[k])) + '</span>';
      info += '<span class="vkey"><i class="sw-moss"></i>' + T('Có công trình phong hoá', 'Weathered buildings') + '</span><p class="muted">' +
        T('Phóng to một vùng để thấy công trình. Chạm vào vùng để xem.', 'Zoom into a land to see its buildings. Tap a land to see it.') + '</p></div>';
    }
    var ctl = '<div class="vmap-ctl"><button class="icon-btn" data-act="vZoom" data-z="1.6" title="' + T('Phóng to', 'Zoom in') + '">+</button>' +
      '<button class="icon-btn" data-act="vZoom" data-z="0.625" title="' + T('Thu nhỏ', 'Zoom out') + '">−</button>' +
      '<button class="icon-btn" data-act="vZoomReset" title="' + T('Toàn cảnh', 'Whole map') + '">⤢</button></div>';
    var vt = App.king && App.king.civic ? App.king.civic() : null;
    return '<div class="card vmapcard">' + toggle + (vt ? '<p class="vrealm">' + jp(vt.kanji) + ' <b>' + h(vt.name) + '</b> <small class="muted">' + vt.n + '/' + lessonCount() + T(' quần thể hoàn thiện', ' complexes finished') +
      (vt.next ? T(' · ' + vt.next + ' nữa để lên bậc', ' · ' + vt.next + ' more for the next title') : '') + '</small></p>' : '') +
      '<div class="vmap-box">' + window.VocabMap.svg(lands, { sel: mapSel, mode: 'build', wonders: wonderMarks() }) + ctl + '</div>' + info + '</div>';
  }
  function wonderMarks() {
    var w = App.king && App.king.wonders ? App.king.wonders() : [], out = [];
    for (var i = 0; i < w.length; i++) if (w[i].built && regionReady(w[i].r)) out.push({ x: w[i].x, y: w[i].y, svg: window.GScene ? window.GScene.wonder(w[i].type) : '' });
    return out;
  }

  // ---------- man hinh ----------
  function summaryCard() {
    var due = dueList().length, n = nextLesson(), lock = n ? lockReason(n) : '', nd = nextDue();
    var lessonBox = !n ? '<p>' + T('Bệ hạ đã khởi công cả 16 quần thể!', 'You have broken ground on all 16 complexes!') + '</p>'
      : '<div class="gnext"><div class="gscene-mini blue">' + scene(n, { blueprint: true }) + '</div><div><small>' + T('Bài hôm nay', "Today's lesson") + ' · ' + lessonLabel(n) + '</small><b>' + h(cname(n)) + '</b>' +
        '<small class="muted">' + D().lessons[n - 1].length + T(' công trình', ' buildings') + '</small>' +
        (lock ? '<small class="glock">🔒 ' + h(lock) + '</small>' : '<a class="btn primary" href="' + link('learn/' + n) + '">' + T('Khởi công', 'Break ground') + '</a>') + '</div></div>';
    return '<div class="card vsum gsum"><div class="vsum-stats">' +
      '<span><b>' + learnedCount() + '/' + D().patterns.length + '</b><small>' + T('mẫu đã học', 'patterns learned') + '</small></span>' +
      '<span><b>' + due + '</b><small>' + T('cần tu bổ', 'need repair') + '</small></span>' +
      '<span><b>' + Object.keys(G().fin).length + '</b><small>' + T('quần thể hoàn thiện', 'complexes finished') + '</small></span></div>' + lessonBox +
      '<div class="row">' + (due ? '<a class="btn primary attn" href="' + link('review') + '">' + T('Tu bổ', 'Repair') + ' (' + due + ')</a>' : '') + '</div>' +
      (!due && nd ? '<p class="note center">' + T('Lần tu bổ tới: ', 'Next repair: ') + h(new Date(nd).toLocaleString()) + '</p>' : '') + '</div>';
  }
  function storeCard() {
    var list = stored();
    if (!list.length) return '';
    var items = '';
    for (var i = 0; i < list.length; i++) items += '<a class="gstore-i" href="' + (mapOpen() && freeRegions().length ? link('place/' + list[i]) : link('c/' + list[i])) + '">' + jp(COMPLEX[list[i] - 1][0]) + '<small>' + h(T(COMPLEX[list[i] - 1][1], COMPLEX[list[i] - 1][2])) + '</small></a>';
    return '<div class="card gstore"><h3>' + T('KHO BẢN VẼ', 'BLUEPRINT STORE') + '</h3><p class="muted">' +
      (mapOpen() ? (freeRegions().length ? T('Chạm vào một quần thể để chọn đất xây.', 'Tap a complex to choose its land.') : T('Chưa có đất trống. Tiếp kiến thần dân ở vùng mới.', 'No free land. Meet subjects in a new land.'))
        : T('Đăng quang Tân vương để đặt các quần thể lên bản đồ.', 'Be crowned New King to place these on the map.')) + '</p><div class="gstore-list">' + items + '</div></div>';
  }
  function wonderCard() {
    var w = App.king && App.king.wonder ? App.king.wonder() : null;
    if (!w || !learnedCount()) return '';
    var floors = Math.min(5, Math.floor(w.n / 10));
    return '<div class="card gwonder' + (w.done ? ' down' : '') + '"><div class="gw-pic">' + (window.GScene ? window.GScene.wonder(w.type, floors) : '') + '</div><span class="body"><small>' + T('Kỳ quan tuần này', "This week's wonder") + '</small>' +
      '<b>' + jp(w.kanji) + ' ' + h(App.L(w.name)) + '</b><div class="bar"><i style="width:' + Math.min(100, w.n * 2) + '%"></i></div><small>' +
      (w.done ? T('Đã xây xong · +100 Uy vọng', 'Completed · +100 Prestige') : T('Tầng ' + floors + '/5 · ' + Math.min(50, w.n) + '/50 câu ngữ pháp đúng · còn ' + w.daysLeft + ' ngày', 'Floor ' + floors + '/5 · ' + Math.min(50, w.n) + '/50 correct grammar answers · ' + w.daysLeft + ' days left')) + '</small></span></div>';
  }
  function tileCard(n) {
    var c = COMPLEX[n - 1], done = lessonDone(n), cs = complexState(n), lock = done ? '' : lockReason(n), ids = D().lessons[n - 1], got = 0;
    for (var i = 0; i < ids.length; i++) if (lv(ids[i]) >= DONE_LV) got++;
    var where = done ? (region(n) ? regionName(region(n)) : T('Kho bản vẽ', 'Blueprint store')) : (n === nextLesson() ? '' : T(threshold(n) + ' thần dân', threshold(n) + ' subjects'));
    return '<a class="card gtile-c' + (done ? ' gs-' + cs.st : ' off') + (cs.moss ? ' moss' : '') + '" href="' + link(done ? 'c/' + n : n === nextLesson() && !lock ? 'learn/' + n : 'c/' + n) + '">' +
      '<span class="gt-pic' + (done ? '' : ' blue') + '">' + scene(n, { blueprint: !done }) + '</span><span class="gt-name"><small>' + lessonLabel(n) + '</small><b>' + jp(c[0]) + ' ' + h(T(c[1], c[2])) + '</b>' +
      '<small class="muted">' + h(where) + '</small></span>' +
      (done ? '<span class="gt-foot">' + levelBadge(cs.low) + '<small>' + got + '/' + ids.length + '</small></span>' + bar(got, ids.length) : (n === nextLesson() && !lock ? '<span class="gt-foot"><small>' + T('Sẵn sàng khởi công', 'Ready to build') + '</small></span>' : '')) + '</a>';
  }
  function gameLock(id) {
    var g = gameDef(id), need = g[4], done = 0;
    for (var n = 1; n <= lessonCount(); n++) if (lessonDone(n)) done++;
    return done >= need ? '' : T('Học xong ' + need + ' bài (' + done + '/' + need + ')', 'Finish ' + need + ' lessons (' + done + '/' + need + ')');
  }
  function gameDef(id) { for (var i = 0; i < GAMES.length; i++) if (GAMES[i][0] === id) return GAMES[i]; return null; }
  function gameRows() {
    var out = '';
    for (var i = 0; i < GAMES.length; i++) {
      var g = GAMES[i], lock = gameLock(g[0]);
      out += lock ? '<span class="card mode off">' + jp(g[1], 'glyph') + '<span class="body"><b>' + h(App.L(g[2])) + '</b><small>' + h(App.L(g[3])) + '</small><small>🔒 ' + h(lock) + '</small></span></span>'
        : '<a class="card mode" href="' + link('games/' + g[0]) + '">' + jp(g[1], 'glyph') + '<span class="body"><b>' + h(App.L(g[2])) + '</b><small>' + h(App.L(g[3])) + '</small></span><i>→</i></a>';
    }
    return out;
  }
  function extraCards() {
    var started = 0, fin = Object.keys(G().fin).length, open = 0, weathered = 0, n;
    for (n = 1; n <= lessonCount(); n++) { if (lessonDone(n)) { started++; if (complexState(n).moss) weathered++; } }
    for (var i = 0; i < GAMES.length; i++) if (!gameLock(GAMES[i][0])) open++;
    function row(path, glyph, name, note) {
      return '<a class="card mode" href="' + link(path) + '">' + jp(glyph, 'glyph') + '<span class="body"><b>' + name + '</b><small>' + note + '</small></span><i>→</i></a>';
    }
    return '<div class="rows vextra">' +
      row('complexes', '築', T('Các quần thể', 'The complexes'), T(lessonCount() + ' quần thể · ' + started + ' đã khởi công · ' + fin + ' hoàn thiện', lessonCount() + ' complexes · ' + started + ' started · ' + fin + ' finished') +
        (weathered ? T(' · ' + weathered + ' phong hoá', ' · ' + weathered + ' weathered') : '')) +
      row('games', '遊', T('Trò chơi nhỏ', 'Mini games'), open + '/' + GAMES.length + T(' trò đã mở', ' games open')) +
      row('book', '典', T('Sổ tay ngữ pháp', 'Grammar handbook'), T(learnedCount() + ' mẫu đã ghi vào sổ', learnedCount() + ' patterns recorded')) + '</div>';
  }
  function viewHome() {
    return '<div class="hero">' + jp('文法', 'eyebrow') + '<h1>' + T('Ngữ pháp N5', 'N5 Grammar') + '</h1><p class="sub">' +
      lessonCount() + T(' quần thể · ', ' complexes · ') + D().patterns.length + T(' công trình', ' buildings') + '</p></div>' +
      summaryCard() + storeCard() + mapCard('grammar') + wonderCard() + extraCards();
  }
  function viewComplexes() {
    var tiles = '';
    for (var n = 1; n <= lessonCount(); n++) tiles += tileCard(n);
    return '<div class="hero">' + jp('築', 'eyebrow') + '<h1>' + T('Các quần thể', 'The complexes') + '</h1><p class="sub">' +
      T('Mỗi bài là một quần thể. Chạm vào để xem công trình hoặc khởi công.', 'Each lesson is a complex. Tap one to see its buildings or break ground.') + '</p></div>' +
      '<div class="grid gtiles">' + tiles + '</div>';
  }
  function viewGames() {
    return '<div class="hero">' + jp('遊', 'eyebrow') + '<h1>' + T('Trò chơi nhỏ', 'Mini games') + '</h1><p class="sub">' +
      T('Mỗi lượt +5 Uy vọng, tối đa 10 lượt mỗi ngày. Không ảnh hưởng lịch tu bổ.', '+5 Prestige per round, up to 10 a day. Repairs are not affected.') + '</p></div>' +
      '<div class="rows narrow">' + gameRows() + '</div>';
  }
  function viewComplex(n) {
    var c = COMPLEX[n - 1], ids = D().lessons[n - 1], done = lessonDone(n), rows = '';
    for (var i = 0; i < ids.length; i++) {
      var pid = ids[i], r = rec(pid), m = moss(pid);
      rows += '<a class="card mode gprow" href="' + plink(pid) + '"><span class="gp-b">' + building(pid, { lv: done ? Math.max(1, lv(pid)) : 4, moss: m, blueprint: !done }) + '</span>' +
        '<span class="body">' + formula(P(pid).f) + '<small>' + h(pname(pid)) + '</small>' +
        (r ? '<small>' + levelBadge(r[0]) + (m ? ' <span class="gmoss">' + T('phong hoá', 'weathered') + '</span>' : '') + '</small>' : '') + '</span><i>→</i></a>';
    }
    var lock = done ? '' : lockReason(n);
    return '<div class="hero"><p class="eyebrow">' + lessonLabel(n) + (done && region(n) ? ' · ' + h(regionName(region(n))) : '') + '</p><h1>' + jp(c[0]) + ' ' + h(T(c[1], c[2])) + '</h1>' +
      '<p class="sub">' + h(T(c[3], c[4])) + '</p></div>' +
      '<div class="gscene-box' + (done ? '' : ' blue') + '">' + scene(n, { link: true }) + '</div>' +
      (done && !region(n) && mapOpen() && freeRegions().length ? '<div class="row"><a class="btn primary" href="' + link('place/' + n) + '">' + T('Chọn vùng đặt quần thể', 'Choose a land for it') + '</a></div>' : '') +
      (!done ? '<div class="row">' + (lock ? '<p class="note center">🔒 ' + h(lock) + '</p>' : '<a class="btn primary" href="' + link('learn/' + n) + '">' + T('Khởi công', 'Break ground') + '</a>') + '</div>' : '') +
      '<div class="rows narrow">' + rows + '</div>';
  }
  function viewPattern(pid) {
    var r = rec(pid), n = lessonOf(pid), ids = D().lessons[n - 1], pos = ids.indexOf(pid);
    if (!r && !lessonDone(n) && n !== nextLesson()) {
      return '<div class="card narrow center"><p>🔒 ' + T('Mẫu này thuộc bài ', 'This pattern belongs to lesson ') + n + T(', chưa mở.', ', not open yet.') + '</p></div>';
    }
    function nav(j, label) { return j >= 0 && j < ids.length ? '<a class="btn" href="' + plink(ids[j]) + '">' + label + '</a>' : '<span class="btn" disabled>' + label + '</span>'; }
    var head = '<div class="gp-head">' + building(pid, { lv: r ? r[0] : 4, moss: moss(pid), blueprint: !r, cls: 'gb-big' }) + '<div>' +
      (r ? levelBadge(r[0]) : '<span class="glv">' + T('Bản vẽ', 'Blueprint') + '</span>') +
      (r && r[0] < TOP ? '<small class="muted">' + T('Tu bổ: ', 'Repair: ') + new Date(r[1]).toLocaleString() + '</small>' : '') +
      (r ? '<small class="muted">' + T('Sai ', 'Missed ') + r[2] + T(' lần', ' times') + '</small>' : '') + '</div></div>';
    return '<div class="hero slim"><p class="eyebrow">' + lessonLabel(n) + ' · ' + h(cname(n)) + '</p></div>' + head + patternCard(pid, true) +
      '<div class="row">' + nav(pos - 1, T('‹ Trước', '‹ Previous')) + '<span class="pos">' + (pos + 1) + '/' + ids.length + '</span>' + nav(pos + 1, T('Sau ›', 'Next ›')) + '</div>';
  }
  function viewBook() {
    var out = '', any = false;
    for (var n = 1; n <= lessonCount(); n++) {
      var ids = D().lessons[n - 1], rows = '';
      for (var i = 0; i < ids.length; i++) {
        var r = rec(ids[i]);
        rows += r ? '<a class="gbook-row" href="' + plink(ids[i]) + '">' + formula(P(ids[i]).f) + '<span>' + h(pname(ids[i])) + '</span>' + levelBadge(r[0]) + '</a>'
          : '<span class="gbook-row off">' + formula(P(ids[i]).f) + '<span>🔒</span></span>';
        if (r) any = true;
      }
      out += '<div class="card gbook"><h3>' + lessonLabel(n) + ' · ' + h(cname(n)) + '</h3>' + rows + '</div>';
    }
    return '<div class="hero">' + jp('文法典', 'eyebrow') + '<h1>' + T('Sổ tay ngữ pháp', 'Grammar handbook') + '</h1><p class="sub">' +
      (any ? T('Mọi mẫu đã học, chạm để xem lại.', 'Every pattern you have learned. Tap to review it.') : T('Học bài đầu tiên để ghi vào sổ tay.', 'Learn your first lesson to fill the handbook.')) + '</p></div>' + out;
  }

  // ---------- tro choi ----------
  function learnedPids() { return Object.keys(G().p).map(Number).filter(function (i) { return !!P(i); }); }
  function startGame(id) {
    var pids = learnedPids(), used = {};
    if (id === 'bricks') {
      game = { id: id, t0: 0, end: 0, rows: 0, miss: 0, cur: null, pids: pids, used: used, done: false, last: null };
      game.cur = makeItem(pids[Math.floor(Math.random() * pids.length)], 'order', used);
    } else {
      var items = [], cand = shuffle(pids);
      for (var i = 0; items.length < 10 && i < cand.length * 3; i++) {
        var pid = cand[i % cand.length], sid = pickSentence(pid, 'inspect', used);
        if (sid >= 0) items.push({ pid: pid, sid: sid, pick: -1 });
      }
      game = { id: id, items: items, i: 0, right: 0, miss: 0, t0: Date.now(), done: false };
    }
  }
  function endGame() {
    game.done = true;
    var right = game.id === 'bricks' ? game.rows : game.right, total = game.id === 'bricks' ? game.rows + game.miss : game.items.length;
    App.emit('game:end', { g: game.id, right: right, total: total, miss: game.miss, ms: Date.now() - (game.t0 || Date.now()) });
    App.saveProgress();
  }
  var brickTimer = null;
  function brickTick() {
    clearTimeout(brickTimer);
    if (!game || game.id !== 'bricks' || game.done || !game.t0) return;
    var left = game.end - Date.now(), el = document.getElementById('gClock');
    if (left <= 0) { endGame(); App.render(); return; }
    if (el) el.textContent = Math.ceil(left / 1000) + 's';
    brickTimer = setTimeout(brickTick, 250);
  }
  function viewBricks() {
    var g = game, wall = window.GScene ? window.GScene.wall(g.rows) : '';
    if (g.done) {
      var best = App.king && App.king.best ? App.king.best('bricks') : 0;
      return '<div class="gwall">' + wall + '</div><div class="hero"><h1>' + g.rows + T(' hàng gạch', ' rows') + '</h1><p class="sub">' + T('Sai ', 'Missed ') + g.miss + (best ? T(' · kỷ lục ', ' · best ') + best : '') + '</p></div>' +
        '<div class="row"><button class="btn primary" data-act="gGameAgain">' + T('Chơi lại', 'Play again') + '</button><a class="btn" href="' + link('games') + '">' + T('Về trò chơi', 'All games') + '</a></div>';
    }
    if (!g.t0) {
      return '<div class="gwall">' + wall + '</div><div class="card narrow center"><p>' + T('Xếp đúng câu càng nhiều càng tốt trong 90 giây. Mỗi câu đúng thêm một hàng gạch.', 'Build as many sentences as you can in 90 seconds. Each right one adds a row of bricks.') + '</p>' +
        '<button class="btn primary" data-act="gBrickGo">' + T('Bắt đầu', 'Start') + '</button></div>';
    }
    var it = g.cur, s = S(it.sid), sp = tilesSpan(s), slots = '', bag = '', i;
    for (i = 0; i < 4; i++) {
      var got = it.slots[i];
      slots += got === undefined ? '<span class="gslot"></span>' : '<button class="gslot full" data-act="gUnslot" data-i="' + i + '">' + ruby(s[4][0][got]) + '</button>';
    }
    for (i = 0; i < it.bag.length; i++) if (it.slots.indexOf(it.bag[i]) < 0) bag += '<button class="gtile" data-act="gTile" data-k="' + it.bag[i] + '"><span lang="ja" class="jp">' + ruby(s[4][0][it.bag[i]]) + '</span></button>';
    return '<div class="gbrickbar"><b id="gClock">' + Math.ceil((g.end - Date.now()) / 1000) + 's</b><span>' + g.rows + T(' hàng', ' rows') + '</span></div>' +
      '<div class="gwall small">' + wall + '</div>' +
      (g.last ? '<p class="center vres bad">✗ ' + sentHtml(S(g.last)[0]) + '</p>' : '') +
      '<div class="card prompt gprompt"><span lang="ja" class="jp gsent' + (furi ? '' : ' nofuri') + '">' + rubyHtml(slice(sp.u, 0, sp.at)) + '<span class="gslots">' + slots + '</span>' + rubyHtml(slice(sp.u, sp.end, 1e9)) + '</span>' +
      '<p class="muted gtr">' + h(tr(s)) + '</p></div><div class="gbag">' + bag + '</div>';
  }
  function viewInspect() {
    var g = game;
    if (g.done) {
      return '<div class="hero"><h1>' + g.right + '/' + g.items.length + '</h1><p class="sub">' + T('công trình được giám định đúng', 'buildings inspected correctly') + '</p></div>' +
        '<div class="row"><button class="btn primary" data-act="gGameAgain">' + T('Chơi lại', 'Play again') + '</button><a class="btn" href="' + link('games') + '">' + T('Về trò chơi', 'All games') + '</a></div>';
    }
    if (!g.items.length) return '<div class="card narrow center"><p>' + T('Chưa đủ câu để giám định.', 'Not enough sentences yet.') + '</p></div>';
    var it = g.items[g.i], s = S(it.sid), sp = tilesSpan(s), err = s[5], segs = '', answered = it.pick >= 0;
    for (var i = 0; i < 4; i++) {
      var wrong = i === err[0] - 1, label = wrong ? err[1] : s[4][0][i], cls = 'gseg';
      if (answered && wrong) cls += ' right';
      else if (answered && i === it.pick) cls += ' wrong';
      segs += '<button class="' + cls + '" data-act="gSeg" data-i="' + i + '"' + (answered ? ' disabled' : '') + '>' + ruby(label) + '</button>';
    }
    var html = '<p class="eyebrow center">' + T('Câu ', 'Sentence ') + (g.i + 1) + '/' + g.items.length + '</p>' + bar(g.i, g.items.length) +
      '<p class="center muted gask">' + T('Chạm vào đoạn sai ngữ pháp', 'Tap the part with the grammar mistake') + '</p>' +
      '<div class="card prompt gprompt"><span lang="ja" class="jp gsent' + (furi ? '' : ' nofuri') + '">' + rubyHtml(slice(sp.u, 0, sp.at)) + segs + rubyHtml(slice(sp.u, sp.end, 1e9)) + '</span>' +
      '<p class="muted gtr">' + h(tr(s)) + '</p></div>';
    if (answered) {
      html += '<div class="card gafter ' + (it.pick === err[0] - 1 ? 'good' : 'bad') + '"><div class="gafter-s">' + sayBtn(it.sid) + sentHtml(s[0]) + '</div><p>' + h(App.isEn() ? err[3] : err[2]) + '</p></div>' +
        '<div class="row"><button class="btn primary" id="gNext" data-act="gSegNext">' + (g.i === g.items.length - 1 ? T('Xong', 'Finish') : T('Câu tiếp', 'Next')) + '</button></div>';
    }
    return '<div class="quiz gquiz">' + html + '</div>';
  }
  function viewGame(id) {
    var g = gameDef(id), lock = gameLock(id), head = '<div class="hero slim"><p class="eyebrow">' + jp(g[1]) + ' ' + h(App.L(g[2])) + '</p></div>';
    if (lock) return head + '<div class="card narrow center"><p>🔒 ' + h(lock) + '</p></div>';
    if (!game || game.id !== id) startGame(id);
    return head + (id === 'bricks' ? viewBricks() : viewInspect());
  }

  // ---------- dieu huong ----------
  function route(parts, changed) {
    if (!D()) return null;
    if (changed) {
      if (parts[0] !== 'learn' && learn && learn.phase !== 'test' && learn.phase !== 'practice') learn = null;
      if (parts[0] !== 'review') review = null;
      if (parts[0] !== 'games') { game = null; clearTimeout(brickTimer); }
    }
    curMode = parts[0] || '';
    var toG = { back: 'grammar', backLabel: T('Ngữ pháp', 'Grammar') };
    if (!parts.length) return { html: viewHome(), title: T('Ngữ pháp N5', 'N5 Grammar'), back: '', backLabel: T('Trang chủ', 'Home'), after: true };
    var n = parseInt(parts[1], 10), okN = n >= 1 && n <= lessonCount();
    if (parts[0] === 'learn' && okN && parts.length === 2) return { html: viewLearn(n), title: T('Khởi công', 'Breaking ground'), back: toG.back, backLabel: toG.backLabel, transient: true, after: true,
      remember: ['Ngữ pháp · ' + COMPLEX[n - 1][1], 'Grammar · ' + COMPLEX[n - 1][2]] };
    if (parts[0] === 'review' && parts.length === 1) return { html: viewReview(), title: T('Tu bổ', 'Repairs'), back: toG.back, backLabel: toG.backLabel, transient: true, after: true };
    if (parts[0] === 'c' && okN && parts.length === 2) return { html: viewComplex(n), title: cname(n), back: 'grammar/complexes', backLabel: T('Các quần thể', 'The complexes'), after: true };
    if (parts[0] === 'place' && okN && parts.length === 2) { var pl = viewPlace(n); return pl ? { html: pl, title: T('Đặt quần thể', 'Place a complex'), back: 'grammar/c/' + n, backLabel: cname(n), transient: true } : null; }
    if (parts[0] === 'p' && parts.length === 2 && P(n)) {
      setTimeout(function () { location.replace(plink(n)); }, 0);
      return { html: '', title: pname(n), transient: true };
    }
    var pid = parseInt(parts[3], 10);
    if (parts[0] === 'c' && okN && parts[2] === 'p' && parts.length === 4 && P(pid) && lessonOf(pid) === n) {
      if (changed) App.emit('grammar:view', { pid: pid });
      return { html: viewPattern(pid), title: pname(pid), back: 'grammar/c/' + n, backLabel: cname(n), after: true };
    }
    if (parts[0] === 'complexes' && parts.length === 1) return { html: viewComplexes(), title: T('Các quần thể', 'The complexes'), back: toG.back, backLabel: toG.backLabel };
    if (parts[0] === 'games' && parts.length === 1) return { html: viewGames(), title: T('Trò chơi nhỏ', 'Mini games'), back: toG.back, backLabel: toG.backLabel };
    if (parts[0] === 'book' && parts.length === 1) return { html: viewBook(), title: T('Sổ tay ngữ pháp', 'Grammar handbook'), back: toG.back, backLabel: toG.backLabel };
    if (parts[0] === 'games' && parts.length === 2 && gameDef(parts[1])) return { html: viewGame(parts[1]), title: App.L(gameDef(parts[1])[2]), back: 'grammar/games', backLabel: T('Trò chơi', 'Games'), transient: true, after: true };
    return null;
  }
  function pageLabel(parts) {
    if (!D()) return '';
    if (!parts.length) return T('Ngữ pháp N5', 'N5 Grammar');
    var n = parseInt(parts[1], 10);
    if (parts[0] === 'c' && parts.length === 2 && n >= 1 && n <= lessonCount()) return cname(n);
    if (parts[0] === 'c' && parts[2] === 'p' && P(parseInt(parts[3], 10))) return pname(parseInt(parts[3], 10));
    if (parts[0] === 'book') return T('Sổ tay ngữ pháp', 'Grammar handbook');
    if (parts[0] === 'complexes') return T('Các quần thể', 'The complexes');
    if (parts[0] === 'games' && parts.length === 1) return T('Trò chơi nhỏ', 'Mini games');
    return '';
  }

  // ---------- hanh dong ----------
  var A = App.actions;
  function activeQuiz() { return curMode === 'learn' ? learn && learn.quiz : curMode === 'review' ? review && review.quiz : null; }
  function answer(q, ok) {
    var it = q.qs[q.i];
    it.done = true;
    if (!ok) q.failed[it.pid] = 1;
    q.total++; if (ok) q.right++;
    if (q.mode !== 'practice') { var t = todayStat(); t[2]++; if (ok) t[1]++; }
    App.emit('grammar:answer', { pid: it.pid, ok: ok, type: it.type, mode: q.mode, retry: !!it.retry });
    if (!ok && q.mode !== 'test') q.qs.push(retryOf(it));
    App.render();
    var nx = document.getElementById('gNext');
    if (nx) nx.focus();
  }
  function retryOf(it) {
    var c = { pid: it.pid, sid: it.sid, type: it.type, retry: true };
    if (it.opts) { c.opts = shuffle(it.opts); var correct = it.type === 'star' ? S(it.sid)[4][1] - 1 : it.type === 'blank' ? it.opts[it.ans] : it.sid; c.ans = it.type === 'star' ? c.opts.indexOf(correct) : c.opts.indexOf(correct); }
    if (it.type === 'order') { c.bag = shuffle([0, 1, 2, 3]); c.slots = []; }
    return c;
  }
  function enlist(pid) {
    var now = Date.now();
    if (G().p[pid]) return;
    G().p[pid] = [1, now + INTERVAL[1], 0, 0, now, now];
    App.emit('grammar:learn', { pid: pid });
  }
  function finishQuiz(q) {
    if (q.mode === 'practice') {
      var ids = D().lessons[learn.n - 1];
      learn.i++;
      if (learn.i >= ids.length) { learn.phase = 'test'; learn.quiz = testQuiz(learn.n); } else { learn.phase = 'teach'; learn.quiz = null; }
      return;
    }
    if (q.mode === 'test') {
      var score = Math.round(q.right * 100 / Math.max(1, q.total)), n = learn.n;
      if (score / 100 >= PASS) {
        var list = D().lessons[n - 1];
        learn.grow = {};
        for (var i = 0; i < list.length; i++) { enlist(list[i]); learn.grow[list[i]] = 1; }
        G().l[n] = [Date.now(), 0, 0];
        learn.phase = 'done';
        App.emit('grammar:lesson', { n: n, name: cname(n), score: score });
      } else {
        learn.phase = 'retry'; learn.score = score; learn.missed = Object.keys(q.failed).map(Number);
      }
      App.saveProgress();
      return;
    }
    var seen = {}, pids = [];
    for (var j = 0; j < q.qs.length; j++) if (!seen[q.qs[j].pid]) { seen[q.qs[j].pid] = 1; pids.push(q.qs[j].pid); }
    review.result = [];
    for (j = 0; j < pids.length; j++) {
      var ok = !q.failed[pids[j]], m = moss(pids[j]), ch = grade(pids[j], ok);
      review.result.push({ pid: pids[j], ok: ok, from: ch.from, to: ch.to, moss: m });
    }
    review.cleared = !dueList().length;
    App.emit('grammar:reviewEnd', { count: pids.length, right: pids.length - Object.keys(q.failed).length, cleared: review.cleared,
      restored: review.result.filter(function (x) { return x.ok && x.moss >= 3; }).map(function (x) { return x.pid; }) });
    checkFinished(false);
    App.saveProgress();
  }
  A.gLearnGo = function () { learn.phase = 'teach'; learn.i = 0; App.render(); window.scrollTo(0, 0); };
  A.gPractice = function () { learn.phase = 'practice'; learn.quiz = practiceQuiz(D().lessons[learn.n - 1][learn.i]); App.render(); window.scrollTo(0, 0); };
  A.gRetest = function () { learn.phase = 'test'; learn.quiz = testQuiz(learn.n); App.render(); window.scrollTo(0, 0); };
  A.gReviewMore = function () { review = null; App.render(); window.scrollTo(0, 0); };
  A.gPick = function (el) {
    var q = activeQuiz(), it = q && q.qs[q.i];
    if (!it || it.done) return;
    q.picked = parseInt(el.getAttribute('data-i'), 10);
    if (it.type !== 'listen') speak(it.sid);
    answer(q, q.picked === it.ans);
  };
  function curOrder() {
    if (game && game.id === 'bricks' && curMode === 'games') return game.cur;
    var q = activeQuiz();
    return q ? q.qs[q.i] : null;
  }
  A.gTile = function (el) {
    var it = curOrder(), k = parseInt(el.getAttribute('data-k'), 10);
    if (!it || it.done || it.slots.length >= 4) return;
    it.slots.push(k);
    if (game && game.cur === it && it.slots.length === 4) return brickCheck();
    App.render();
  };
  A.gUnslot = function (el) {
    var it = curOrder();
    if (!it || it.done) return;
    it.slots.splice(parseInt(el.getAttribute('data-i'), 10), 1);
    App.render();
  };
  A.gCheck = function () {
    var q = activeQuiz(), it = q && q.qs[q.i];
    if (!it || it.done || it.slots.length < 4) return;
    speak(it.sid);
    answer(q, isRight(q, it));
  };
  A.gType = function (el) {
    if (!App.romaji) return;
    var v = App.romaji.toKana(el.value, false);
    if (v !== el.value) { el.value = v; try { el.setSelectionRange(v.length, v.length); } catch (e) { /* trinh duyet cu */ } }
  };
  A.gSubmit = function () {
    var el = document.getElementById('gInput'), q = activeQuiz(), it = q && q.qs[q.i];
    if (!el || !it || it.done) return;
    var v = (App.romaji ? App.romaji.toKana(el.value, true) : el.value).replace(/\s/g, '');
    if (!v) return;
    var s = S(it.sid), cu = units(s[0]).filter(function (x) { return x.m === 'c'; });
    if (!conjOk(v, s) && !q.near && App.romaji && App.romaji.loose(v) === App.romaji.loose(kanaOf(cu))) {
      q.near = true; App.render();
      var again = document.getElementById('gInput');
      if (again) again.focus();
      return;
    }
    it.typed = v;
    speak(it.sid);
    answer(q, conjOk(v, s));
  };
  A.gGiveUp = function () { var q = activeQuiz(), it = q.qs[q.i]; it.typed = ''; answer(q, false); };
  A.gNext = function () {
    var q = activeQuiz();
    q.i++; q.picked = -1; q.near = false;
    if (q.i >= q.qs.length) finishQuiz(q);
    App.render(); window.scrollTo(0, 0);
  };
  A.gFuri = function () {
    furi = !furi;
    try { localStorage.setItem(FURI_KEY, furi ? '1' : '0'); } catch (e) { /* che do an danh */ }
    App.render();
  };
  A.gSay = function (el) {
    var sid = parseInt(el.getAttribute('data-s'), 10);
    speak(sid, el);
    var parts = App.route();
    if (parts[3] || parts[1] === 'learn') App.emit('grammar:example', { sid: sid });
  };
  A.gPod = function (el) {
    var p = P(parseInt(el.getAttribute('data-p'), 10));
    if (p.pod && window.Podcast) window.Podcast.playAt(p.pod[0], p.pod[1]);
  };
  A.gPlace = function (el) {
    var n = parseInt(el.getAttribute('data-n'), 10), r = parseInt(el.getAttribute('data-r'), 10);
    if (!lessonDone(n) || region(n) || complexAt(r) || !regionReady(r)) return;
    G().l[n][1] = r; G().l[n][2] = Date.now();
    App.emit('grammar:place', { n: n, r: r });
    App.saveProgress();
    mapSel = r;
    if (window.VocabMap) window.VocabMap.focusLater(r);
    location.hash = '#/grammar';
  };
  A.gMapClose = function () { mapSel = 0; App.render(); };
  A.gFocus = function (el) { if (window.VocabMap) window.VocabMap.focus(parseInt(el.getAttribute('data-r'), 10)); };
  A.gBrickGo = function () { game.t0 = Date.now(); game.end = game.t0 + BRICK_MS; App.render(); brickTick(); };
  function brickCheck() {
    var it = game.cur, ok = true;
    for (var i = 0; i < 4; i++) if (it.slots[i] !== i) ok = false;
    if (ok) { game.rows++; game.last = null; speak(it.sid); } else { game.miss++; game.last = it.sid; }
    App.emit('grammar:answer', { pid: it.pid, ok: ok, type: 'order', mode: 'game' });
    game.cur = makeItem(game.pids[Math.floor(Math.random() * game.pids.length)], 'order', game.used);
    if (Object.keys(game.used).length > 40) game.used = {};
    App.render();
  }
  A.gSeg = function (el) {
    var it = game.items[game.i];
    if (it.pick >= 0) return;
    it.pick = parseInt(el.getAttribute('data-i'), 10);
    var ok = it.pick === S(it.sid)[5][0] - 1;
    if (ok) game.right++; else game.miss++;
    App.emit('grammar:answer', { pid: it.pid, ok: ok, type: 'inspect', mode: 'game' });
    App.render();
    var nx = document.getElementById('gNext');
    if (nx) nx.focus();
  };
  A.gSegNext = function () { game.i++; if (game.i >= game.items.length) endGame(); App.render(); window.scrollTo(0, 0); };
  A.gGameAgain = function () { game = null; App.render(); window.scrollTo(0, 0); };
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.keyCode === 13) && e.target && e.target.id === 'gInput') { e.preventDefault(); A.gSubmit(); }
  });

  App.on(function (type) {
    if (type === 'start' && D()) checkFinished(true);
  });
  if (window.VocabMap) window.VocabMap.onTap('build', function (n) { mapSel = mapSel === n ? 0 : n; App.render(); });

  App.grammar = {
    mapCard: mapCard,
    mapTap: function (n) { mapSel = mapSel === n ? 0 : n; App.render(); },
    canLearn: function () { var n = D() && nextLesson(); return !!n && !lockReason(n); },
    stats: function () {
      var g = G(), out = { learned: 0, landmark: 0, lessons: Object.keys(g.l).length, placed: 0, fin: Object.keys(g.fin).length, total: D() ? D().patterns.length : 0, lessonTotal: D() ? lessonCount() : 16, due: 0 };
      var now = Date.now();
      for (var k in g.p) { out.learned++; if (g.p[k][0] >= TOP) out.landmark++; if (isDue(g.p[k], now)) out.due++; }
      for (var n in g.l) if (g.l[n][1]) out.placed++;
      out.lastDone = !!g.fin[16];
      return out;
    },
    COMPLEX: COMPLEX
  };

  App.section({
    id: 'grammar',
    name: ['Ngữ pháp', 'Grammar'],
    glyph: '文',
    desc: ['Kiến thiết vương quốc: mỗi mẫu câu là một công trình', 'Build your kingdom: every pattern is a building'],
    ready: !!D(),
    route: route,
    label: pageLabel,
    busy: function () {
      if (game && !game.done && curMode === 'games' && (game.id !== 'bricks' || game.t0)) return true;
      var q = activeQuiz();
      return !!(q && q.i < q.qs.length && (curMode === 'learn' ? (learn.phase === 'test' || learn.phase === 'practice') : !review.result));
    },
    afterRender: function (mine) {
      if (!mine) return;
      if (window.VocabMap) window.VocabMap.bind('grammar');
      var el = document.getElementById('gInput');
      if (el) el.focus();
    },
    home: function () {
      var due = D() ? dueList().length : 0;
      if (!due) return '';
      return '<a class="card kcard vhome ghome" href="' + link('review') + '">' + jp('修', 'glyph') + '<span class="body"><small>' + T('Tu bổ', 'Repairs') + '</small><b>' +
        due + T(' công trình cần tu bổ', ' buildings need repair') + '</b></span><i>→</i></a>';
    },
    badge: function () { return D() ? dueList().length : 0; },
    stat: function () { return D() ? T('Đã xây ', 'Built ') + learnedCount() + '/' + D().patterns.length + T(' công trình', ' buildings') : ''; }
  });
})();
