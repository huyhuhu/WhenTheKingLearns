// Muc Kanji. Cu phap ES5.
(function () {
  'use strict';

  var App = window.App, T = App.T, h = App.h, jp = App.jp, say = App.say, shuffle = App.shuffle, bar = App.bar;
  var isKnown = App.isKnown, setKnown = App.setKnown, countKnown = App.countKnown;
  var DATA = window.KANJI_DATA || {};
  var LEVELS = [
    { id: 'n5', name: 'N5', sub: ['Cơ bản', 'Beginner'] },
    { id: 'n4', name: 'N4', sub: ['Sơ cấp', 'Elementary'] },
    { id: 'n3', name: 'N3', sub: ['Trung cấp', 'Intermediate'] },
    { id: 'n2', name: 'N2', sub: ['Trung cao cấp', 'Upper intermediate'] },
    { id: 'n1', name: 'N1', sub: ['Cao cấp', 'Advanced'] }
  ];
  var appEl = document.getElementById('app');
  var animToken = 0;
  var flash = null;
  var quiz = null;
  var quizKey = '';
  var hideAnswers = false;

  function findLevel(id) {
    for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return LEVELS[i];
    return null;
  }
  function link(L, n, rest) {
    return '#/kanji/' + L.id + (n ? '/' + n : '') + (rest ? '/' + rest : '');
  }

  // ---------- noi dung theo ngon ngu ----------
  function kw(k) { return App.isEn() ? k.en.kw : k.hv; }
  function mean(k) { return App.isEn() ? k.en.m : k.vi; }
  function story(k) { return App.isEn() ? k.en.story : k.story; }
  function vmean(v) { return App.isEn() ? v[4] : v[3]; }
  function sess(n) { return T('Buổi ', 'Session ') + n; }

  // ---------- thanh phan ----------
  function strokeSvg(k) {
    var d = '';
    for (var i = 0; i < k.paths.length; i++) d += '<path d="' + h(k.paths[i]) + '"/>';
    return '<svg class="strokes" viewBox="0 0 109 109"><g class="guide">' + d + '</g><g class="ink">' + d + '</g></svg>';
  }
  function animateStrokes() {
    var token = ++animToken;
    var paths = appEl.querySelectorAll('.strokes .ink path');
    for (var i = 0; i < paths.length; i++) {
      var len = paths[i].getTotalLength();
      paths[i].style.transition = 'none';
      paths[i].style.strokeDasharray = len + ' ' + len;
      paths[i].style.strokeDashoffset = len;
    }
    function step(n) {
      if (token !== animToken || n >= paths.length) return;
      var p = paths[n];
      var ms = Math.max(280, Math.round(p.getTotalLength() * 7));
      p.getBoundingClientRect();
      p.style.transition = 'stroke-dashoffset ' + ms + 'ms ease';
      p.style.strokeDashoffset = '0';
      setTimeout(function () { step(n + 1); }, ms + 160);
    }
    setTimeout(function () { step(0); }, 250);
  }
  function wordCard(v) {
    return '<div class="card word" data-act="reveal">' +
      '<div class="top">' + say(v[0], 'w', v[1]) + say(v[1], 'r') + '</div>' +
      '<div class="bottom"><b>' + h(App.isEn() ? '' : v[2]) + '</b><span>' + h(vmean(v)) + '</span></div></div>';
  }
  function cleanKun(s) { return s.replace(/[.\-]/g, ''); }
  function readLabel(k) {
    var parts = [];
    if (k.on.length) parts.push(k.on[0]);
    if (k.kun.length) parts.push(cleanKun(k.kun[0]));
    return parts.join(' · ');
  }
  function sayList(list) {
    var out = [];
    for (var i = 0; i < list.length; i++) out.push(say(list[i]));
    return out.join('、') || '—';
  }
  function meanLabel(k) { return App.isEn() ? k.en.m : k.hv + ' · ' + k.vi; }
  function tile(L, n, ch, d) {
    return '<a class="card tile' + (isKnown(ch) ? ' known' : '') + '" href="' + link(L, n, 'list/' + encodeURIComponent(ch)) + '">' +
      jp(ch, 'k') + '<span class="hv">' + h(kw(d.kanji[ch])) + '</span></a>';
  }

  // ---------- man hinh ----------
  function viewLevel(L) {
    var d = DATA[L.id], chips = '', i;
    for (i = 0; i < LEVELS.length; i++) {
      chips += '<a class="chip' + (LEVELS[i] === L ? ' on' : '') + (DATA[LEVELS[i].id] ? '' : ' soon') + '" href="' + link(LEVELS[i]) + '">' + LEVELS[i].name + '</a>';
    }
    var html = '<div class="hero">' + jp('漢字', 'eyebrow') + '<h1>Kanji ' + L.name + '</h1><p class="sub">' + App.L(L.sub) +
      (d ? ' · ' + d.sessions.length + T(' buổi · ', ' sessions · ') + Object.keys(d.kanji).length + T(' chữ', ' kanji') : '') + '</p></div>' +
      '<div class="chips">' + chips + '</div>';
    if (!d) return html + '<div class="card narrow center"><p>' + T('Cấp độ ' + L.name + ' chưa có dữ liệu.', 'Level ' + L.name + ' has no data yet.') + '</p><p class="note">' + T('Sẽ được bổ sung sau.', 'It will be added later.') + '</p></div>';
    html += '<div class="rows">';
    for (i = 0; i < d.sessions.length; i++) {
      var s = d.sessions[i], known = countKnown(s), best = App.progress().quiz[L.id + '-' + (i + 1)];
      html += '<a class="card rowcard" href="' + link(L, i + 1) + '"><span class="no">' + (i < 9 ? '0' : '') + (i + 1) + '</span>' +
        '<span class="body"><b>' + sess(i + 1) + '</b>' + jp(s.join(' '), 'preview') + bar(known, s.length) + '</span>' +
        '<span class="meta"><b>' + known + '/' + s.length + '</b><small>' + (best ? T('Điểm ', 'Score ') + best[0] + '/' + best[1] : T('Chưa kiểm tra', 'Not tested')) + '</small></span></a>';
    }
    return html + '</div>';
  }

  function viewSession(L, d, n) {
    var s = d.sessions[n - 1], best = App.progress().quiz[L.id + '-' + n];
    function mode(path, glyph, name, note) {
      return '<a class="card mode" href="' + link(L, n, path) + '">' + jp(glyph, 'glyph') + '<span class="body"><b>' + name + '</b><small>' + note + '</small></span><i>→</i></a>';
    }
    return '<div class="hero"><p class="eyebrow">Kanji ' + L.name + '</p><h1>' + sess(n) + '</h1><p class="sub">' + s.length + T(' chữ · đã thuộc ', ' kanji · learned ') + countKnown(s) + '</p></div>' +
      '<div class="rows narrow">' +
      mode('list', '覧', T('Danh sách', 'List'), T('Xem từng chữ, nét viết và cách nhớ', 'Each kanji with stroke order and a mnemonic')) +
      mode('flash', '札', 'Flashcard', T('Lật thẻ, tự đánh dấu đã thuộc', 'Flip cards and mark what you know')) +
      mode('quiz', '問', T('Trắc nghiệm', 'Quiz'), best ? T('Điểm cao nhất ', 'Best score ') + best[0] + '/' + best[1] : T('Chưa làm lần nào', 'Not taken yet')) +
      mode('vocab', '語', T('Từ vựng đi kèm', 'Vocabulary'), T('Từ thông dụng chứa các chữ của buổi', 'Common words using the kanji of this session')) +
      '</div>';
  }

  function viewList(L, d, n) {
    var s = d.sessions[n - 1], tiles = '';
    for (var i = 0; i < s.length; i++) tiles += tile(L, n, s[i], d);
    return '<div class="hero"><p class="eyebrow">' + sess(n) + ' · ' + s.length + T(' chữ', ' kanji') + '</p><h1>' + T('Danh sách', 'List') + '</h1><p class="sub">' + T('Bấm vào Kanji để xem chi tiết', 'Tap a kanji for details') + '</p></div>' +
      '<div class="grid kanji">' + tiles + '</div>';
  }

  function viewDetail(L, d, n, ch) {
    var s = d.sessions[n - 1], k = d.kanji[ch], idx = s.indexOf(ch), words = '';
    if (!k || idx < 0) return null;
    for (var i = 0; i < k.vocab.length; i++) words += wordCard(k.vocab[i]);
    var known = isKnown(ch);
    function nav(j, label) {
      return j >= 0 && j < s.length
        ? '<a class="btn" href="' + link(L, n, 'list/' + encodeURIComponent(s[j])) + '">' + label + '</a>'
        : '<span class="btn" disabled>' + label + '</span>';
    }
    return '<div class="card detail"><div class="strokebox">' + strokeSvg(k) + '<button class="replay" data-act="replay" title="' + T('Viết lại', 'Replay') + '">↻</button></div>' +
      '<div class="detail-info"><p class="eyebrow">JLPT ' + d.level + ' · ' + k.strokes + T(' nét', ' strokes') + '</p><h2>' + h(kw(k)) + '</h2><p class="vi">' + h(mean(k)) + '</p>' +
      '<div class="readings"><div class="reading"><small>' + T('ÂM ON', 'ON READING') + '</small>' + sayList(k.on) + '</div>' +
      '<div class="reading"><small>' + T('ÂM KUN', 'KUN READING') + '</small>' + sayList(k.kun) + '</div></div>' +
      '<p class="note">' + T('Bấm vào cách đọc hoặc từ vựng để nghe.', 'Tap a reading or a word to hear it.') + '</p>' +
      '<button class="btn' + (known ? ' good' : '') + '" data-act="toggleKnown" data-k="' + h(ch) + '">' + (known ? T('✓ Đã thuộc', '✓ Learned') : T('Đánh dấu đã thuộc', 'Mark as learned')) + '</button>' +
      '</div></div>' +
      '<div class="card story"><h3>' + T('CÂU CHUYỆN LIÊN TƯỞNG', 'MNEMONIC') + '</h3><p>' + h(story(k)) + '</p></div>' +
      '<h3 class="heading">' + T('TỪ VỰNG THÔNG DỤNG', 'COMMON WORDS') + ' (' + k.vocab.length + ')</h3><div class="grid vocab">' + words + '</div>' +
      '<div class="row">' + nav(idx - 1, T('‹ Chữ trước', '‹ Previous')) + '<span class="pos">' + (idx + 1) + '/' + s.length + '</span>' + nav(idx + 1, T('Chữ sau ›', 'Next ›')) + '</div>';
  }

  function viewVocab(L, d, n) {
    var s = d.sessions[n - 1], seen = {}, cards = '', count = 0;
    for (var i = 0; i < s.length; i++) {
      var list = d.kanji[s[i]].vocab;
      for (var j = 0; j < list.length; j++) {
        if (seen[list[j][0]]) continue;
        seen[list[j][0]] = 1;
        cards += wordCard(list[j]);
        count++;
      }
    }
    return '<div class="hero"><p class="eyebrow">' + sess(n) + ' · ' + count + T(' từ', ' words') + '</p><h1>' + T('Từ vựng đi kèm', 'Vocabulary') + '</h1></div>' +
      '<div class="row"><button class="btn" data-act="toggleHide">' + (hideAnswers ? T('Hiện cách đọc và nghĩa', 'Show readings and meanings') : T('Ẩn cách đọc và nghĩa để tự kiểm tra', 'Hide readings and meanings to test yourself')) + '</button></div>' +
      '<div class="grid vocab' + (hideAnswers ? ' hide-answers' : '') + '">' + cards + '</div>';
  }

  function startFlash(list) { flash = { order: shuffle(list), i: 0, flipped: false, again: [] }; }
  function viewFlash(L, d, n) {
    var s = d.sessions[n - 1];
    if (!flash) startFlash(s);
    if (flash.i >= flash.order.length) {
      return '<div class="hero"><p class="eyebrow">Flashcard · ' + sess(n) + '</p><h1>' + T('Hoàn thành', 'Done') + '</h1><p class="sub">' + T('Đã thuộc ', 'Learned ') + countKnown(s) + '/' + s.length + T(' chữ', ' kanji') + '</p></div><div class="row">' +
        (flash.again.length ? '<button class="btn primary" data-act="flashAgain">' + T('Học lại ' + flash.again.length + ' chữ chưa thuộc', 'Review the ' + flash.again.length + ' you missed') + '</button>' : '') +
        '<button class="btn" data-act="flashAll">' + T('Học lại tất cả', 'Review all') + '</button>' +
        '<a class="btn" href="' + link(L, n) + '">' + T('Về buổi học', 'Back to session') + '</a></div>';
    }
    var ch = flash.order[flash.i], k = d.kanji[ch], body;
    if (!flash.flipped) {
      body = jp(ch, 'big') + '<p class="tap">' + T('Chạm để lật thẻ', 'Tap to flip') + '</p>';
    } else {
      var ex = '';
      for (var i = 0; i < k.vocab.length && i < 2; i++) ex += '<p>' + say(k.vocab[i][0], '', k.vocab[i][1]) + ' (' + say(k.vocab[i][1]) + ') · ' + h(vmean(k.vocab[i])) + '</p>';
      body = jp(ch, 'big small') + '<div class="hv">' + h(kw(k)) + '</div><p><i>' + h(mean(k)) + '</i></p>' +
        '<p><b>On:</b> ' + sayList(k.on) + ' &nbsp; <b>Kun:</b> ' + sayList(k.kun) + '</p>' + ex;
    }
    return '<div class="hero slim"><p class="eyebrow">Flashcard · ' + sess(n) + ' · ' + (flash.i + 1) + '/' + flash.order.length + '</p></div>' +
      '<div class="narrow">' + bar(flash.i, flash.order.length) + '</div>' +
      '<button class="card flash" data-act="flip">' + body + '</button>' +
      '<div class="row">' + (flash.flipped
        ? '<button class="btn danger" data-act="flashNo">' + T('Chưa thuộc', 'Not yet') + '</button><button class="btn good" data-act="flashYes">' + T('Đã thuộc', 'Got it') + '</button>'
        : '<button class="btn primary" data-act="flip">' + T('Lật thẻ', 'Flip') + '</button>') + '</div>';
  }

  function pickOptions(correct, candidates) {
    var used = {}, opts = [correct];
    used[correct] = 1;
    for (var i = 0; i < candidates.length && opts.length < 4; i++) {
      if (used[candidates[i]]) continue;
      used[candidates[i]] = 1;
      opts.push(candidates[i]);
    }
    opts = shuffle(opts);
    return { opts: opts, ans: opts.indexOf(correct) };
  }
  function startQuiz(L, d, n) {
    var s = d.sessions[n - 1], all = Object.keys(d.kanji);
    var order = shuffle(s), types = shuffle(['k2m', 'm2k', 'k2r', 'v2r']);
    var readings = [], i, j;
    for (i = 0; i < s.length; i++) for (j = 0; j < d.kanji[s[i]].vocab.length; j++) readings.push(d.kanji[s[i]].vocab[j][1]);
    var qs = [];
    for (i = 0; i < order.length; i++) {
      var ch = order[i], k = d.kanji[ch], type = types[i % 4];
      var others = shuffle(s).concat(shuffle(all)), q = { ch: ch, type: type };
      var labelOf = type === 'k2m' ? meanLabel : type === 'k2r' ? readLabel : null;
      var picked;
      if (type === 'm2k') {
        picked = pickOptions(ch, others);
        q.prompt = h(meanLabel(k)); q.hint = T('Chọn chữ Kanji đúng', 'Choose the correct kanji'); q.kanjiOpts = true;
      } else if (type === 'v2r') {
        var v = k.vocab[Math.floor(Math.random() * k.vocab.length)];
        picked = pickOptions(v[1], shuffle(readings));
        q.prompt = jp(v[0], 'mid'); q.hint = T('Chọn cách đọc của từ', 'Choose the reading of this word'); q.after = say(v[0], '', v[1]) + ' (' + say(v[1]) + '): ' + h(vmean(v));
      } else {
        var cand = [];
        for (j = 0; j < others.length; j++) cand.push(labelOf(d.kanji[others[j]]));
        picked = pickOptions(labelOf(k), cand);
        q.prompt = jp(ch, 'big'); q.hint = type === 'k2m' ? T('Chọn âm Hán-Việt và nghĩa', 'Choose the meaning') : T('Chọn cách đọc (On · Kun)', 'Choose the reading (On · Kun)');
      }
      q.opts = picked.opts; q.ans = picked.ans;
      q.after = q.after || (jp(ch) + ' · ' + h(kw(k) + ' · ' + mean(k)) + ' · ' + sayList(k.on.slice(0, 1).concat(k.kun.slice(0, 1))));
      qs.push(q);
    }
    quiz = { qs: qs, i: 0, picked: -1, right: 0, wrong: [] };
    quizKey = L.id + '-' + n;
  }
  function viewQuiz(L, d, n) {
    if (!quiz) startQuiz(L, d, n);
    var i;
    if (quiz.i >= quiz.qs.length) {
      var wrong = '';
      for (i = 0; i < quiz.wrong.length; i++) wrong += tile(L, n, quiz.wrong[i], d);
      return '<div class="hero"><p class="eyebrow">' + T('Trắc nghiệm', 'Quiz') + ' · ' + sess(n) + '</p><h1>' + quiz.right + '/' + quiz.qs.length + '</h1></div>' +
        (wrong ? '<p class="center muted">' + T('Các chữ cần ôn lại', 'Kanji to review') + '</p><div class="grid kanji">' + wrong + '</div>' : '<p class="center">' + T('Tuyệt vời, đúng hết!', 'Perfect score!') + '</p>') +
        '<div class="row"><button class="btn primary" data-act="quizRetry">' + T('Làm lại', 'Try again') + '</button><a class="btn" href="' + link(L, n) + '">' + T('Về buổi học', 'Back to session') + '</a></div>';
    }
    var q = quiz.qs[quiz.i], answered = quiz.picked >= 0, opts = '';
    for (i = 0; i < q.opts.length; i++) {
      var cls = 'opt' + (q.kanjiOpts ? ' kanji' : '');
      if (answered && i === q.ans) cls += ' right';
      else if (answered && i === quiz.picked) cls += ' wrong';
      opts += '<button class="' + cls + '" data-act="answer" data-i="' + i + '"' + (answered ? ' disabled' : '') + '>' + (q.type === 'k2m' ? h(q.opts[i]) : jp(q.opts[i])) + '</button>';
    }
    return '<div class="quiz"><div class="hero slim"><p class="eyebrow">' + T('Câu ', 'Question ') + (quiz.i + 1) + '/' + quiz.qs.length + T(' · Đúng ', ' · Correct ') + quiz.right + '</p></div>' +
      bar(quiz.i, quiz.qs.length) +
      '<div class="card prompt"><div class="' + (q.type === 'm2k' ? 'mid' : '') + '">' + q.prompt + '</div><div class="muted">' + q.hint + '</div></div>' +
      '<div class="opts">' + opts + '</div>' +
      (answered ? '<p class="center">' + q.after + '</p><div class="row"><button class="btn primary" data-act="quizNext">' +
        (quiz.i === quiz.qs.length - 1 ? T('Xem kết quả', 'See results') : T('Câu tiếp theo', 'Next question')) + '</button></div>' : '') + '</div>';
  }

  // ---------- dieu huong trong muc ----------
  function route(parts, changed) {
    if (changed) { flash = null; quiz = null; }
    var L = findLevel(parts[0] || 'n5');
    if (!L) return null;
    if (parts.length <= 1) return { html: viewLevel(L), title: 'Kanji ' + L.name, back: '', backLabel: T('Trang chủ', 'Home') };
    var d = DATA[L.id], n = parseInt(parts[1], 10);
    if (!d || !(n >= 1 && n <= d.sessions.length)) return null;
    var title = 'Kanji ' + L.name + ' · ' + sess(n), html = null, after = false, label = sess(n);
    if (parts.length === 2) { html = viewSession(L, d, n); label = 'Kanji ' + L.name; }
    else if (parts[2] === 'list' && parts.length === 3) html = viewList(L, d, n);
    else if (parts[2] === 'list' && parts.length === 4) { html = viewDetail(L, d, n, parts[3]); after = true; label = T('Danh sách', 'List'); }
    else if (parts[2] === 'flash' && parts.length === 3) html = viewFlash(L, d, n);
    else if (parts[2] === 'quiz' && parts.length === 3) html = viewQuiz(L, d, n);
    else if (parts[2] === 'vocab' && parts.length === 3) html = viewVocab(L, d, n);
    if (!html) return null;
    return { html: html, title: title, after: after, backLabel: label, remember: ['Kanji ' + L.name + ' · Buổi ' + n, 'Kanji ' + L.name + ' · Session ' + n] };
  }

  // ---------- hanh dong ----------
  var A = App.actions;
  A.replay = function () { animateStrokes(); };
  A.toggleKnown = function (el) { var k = el.getAttribute('data-k'); setKnown(k, !isKnown(k)); App.render(); };
  A.reveal = function (el) { el.className = el.className.indexOf(' show') < 0 ? el.className + ' show' : el.className.replace(' show', ''); };
  A.toggleHide = function () { hideAnswers = !hideAnswers; App.render(); };
  A.flip = function () { flash.flipped = !flash.flipped; App.render(); };
  A.flashYes = function () { setKnown(flash.order[flash.i], true); flash.i++; flash.flipped = false; App.render(); };
  A.flashNo = function () { var k = flash.order[flash.i]; setKnown(k, false); flash.again.push(k); flash.i++; flash.flipped = false; App.render(); };
  A.flashAgain = function () { startFlash(flash.again); App.render(); };
  A.flashAll = function () { flash = null; App.render(); };
  A.answer = function (el) {
    if (quiz.picked >= 0) return;
    var q = quiz.qs[quiz.i];
    quiz.picked = parseInt(el.getAttribute('data-i'), 10);
    if (quiz.picked === q.ans) quiz.right++;
    else if (quiz.wrong.indexOf(q.ch) < 0) quiz.wrong.push(q.ch);
    App.render();
  };
  A.quizNext = function () {
    quiz.i++; quiz.picked = -1;
    if (quiz.i >= quiz.qs.length) {
      var p = App.progress(), best = p.quiz[quizKey];
      if (!best || quiz.right > best[0]) { p.quiz[quizKey] = [quiz.right, quiz.qs.length, Date.now()]; App.saveProgress(); }
    }
    App.render();
    window.scrollTo(0, 0);
  };
  A.quizRetry = function () { quiz = null; App.render(); };

  App.section({
    id: 'kanji',
    name: 'Kanji',
    glyph: '字',
    desc: ['Hán tự theo buổi: danh sách, flashcard, trắc nghiệm, từ vựng', 'Kanji by session: list, flashcards, quiz, vocabulary'],
    ready: true,
    route: route,
    afterRender: function (animate) { if (animate) animateStrokes(); else animToken++; },
    stat: function () {
      var total = 0, known = 0;
      for (var id in DATA) { var all = Object.keys(DATA[id].kanji); total += all.length; known += countKnown(all); }
      return T('Đã thuộc ', 'Learned ') + known + '/' + total + T(' chữ', ' kanji');
    }
  });
})();
