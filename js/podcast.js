// Muc Podcast. Cu phap ES5.
(function () {
  'use strict';

  var App = window.App, T = App.T, L = App.L, h = App.h;
  var DATA = window.PODCAST || { base: '', episodes: [] };
  var EPS = DATA.episodes;
  var PREF_KEY = 'wtkl.podcast';
  var CACHE = 'wtkl-podcast-v1';
  var RATES = [0.5, 0.75, 0.9, 1, 1.25, 1.5];
  var FORMATS = {
    dialogue: ['Hội thoại', 'Dialogue'], story: ['Truyện kể', 'Story'], news: ['Bản tin', 'News'],
    shadow: ['Luyện nói', 'Speaking'], lesson: ['Bài giảng', 'Lesson'], fact: ['Kiến thức', 'Facts']
  };
  var CUES = { think: ['Bệ hạ suy nghĩ…', 'Your turn to think…'], repeat: ['Bệ hạ nói theo…', 'Say it out loud…'] };
  var SPK = { thaipho: 'var(--accent)', yuki: '#d6649a', kenta: '#2b9c8f', tanaka: '#b8902a', sato: '#8a6cc4', tama: '#e08a3c', anchor: '#4a86c8' };
  var PALETTE = ['#4a86c8', '#2b9c8f', '#d6649a', '#b8902a', '#8a6cc4', '#e08a3c'];
  var ICONS = {
    play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/>',
    pause: '<path d="M7 4.5h3.5v15H7zM13.5 4.5H17v15h-3.5z" fill="currentColor" stroke="none"/>',
    prev: '<path d="M6 5v14"/><path d="M19 5l-10 7 10 7z" fill="currentColor"/>',
    next: '<path d="M18 5v14"/><path d="M5 5l10 7-10 7z" fill="currentColor"/>',
    repeat: '<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/><path d="M11 10.5l1.5-1v5" stroke-width="1.6"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>'
  };

  var byId = {};
  for (var n = 0; n < EPS.length; n++) byId[EPS[n].id] = EPS[n];

  var prefs = readPrefs();
  var audio = new Audio();
  audio.preload = 'auto';
  var cur = null, lyric = null, nextId = null, played = [], blobUrl = null, loadToken = 0;
  var sheet = null, full = false, sheetView = 'player', pageY = 0;
  var onPlayer = false, els = [], curLine = -1, onCount = -1, looping = false;
  var follow = true, followTimer = null;
  var blocked = false, audioErr = false, heardMarked = false, prefetched = false;
  var lastTick = 0, listenAcc = 0, lastSave = 0, lastFrame = 0, unholdTimer = null;
  var JINGLE = 'audio/jingle.mp3?v=2', jingleSrc = JINGLE, jingleBusy = false, interlude = false, pendingStart = null;
  var topic = '', dlStatus = '', rateOpen = false;

  // ---------- luu tru ----------
  function readPrefs() {
    var p = null;
    try { p = JSON.parse(localStorage.getItem(PREF_KEY)); } catch (e) { /* che do an danh */ }
    p = p || {};
    if (p.furi === undefined) p.furi = 1;
    if (p.ro === undefined) p.ro = 1;
    if (p.tr === undefined) p.tr = 1;
    p.rate = p.rate || 1;
    p.repeat = !!p.repeat;
    p.level = p.level || '';
    p.pos = p.pos || {};
    p.dl = p.dl || {};
    p.pre = p.pre || {};
    return p;
  }
  function savePrefs() {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) { /* che do an danh */ }
  }
  function heardMap() {
    var p = App.progress();
    p.podcast = p.podcast || {};
    p.podcast.heard = p.podcast.heard || {};
    return p.podcast.heard;
  }
  function countHeard() {
    var heard = heardMap(), c = 0;
    for (var i = 0; i < EPS.length; i++) if (heard[EPS[i].id]) c++;
    return c;
  }
  App.addMerger('podcast', function (a, b) {
    var out = { heard: {} }, k, ah = (a && a.heard) || {}, bh = (b && b.heard) || {};
    for (k in ah) out.heard[k] = ah[k];
    for (k in bh) if (!out.heard[k] || bh[k] < out.heard[k]) out.heard[k] = bh[k];
    return out;
  });

  // ---------- tien ich ----------
  function svg(name) { return '<svg class="pico" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + '</svg>'; }
  function fmtTime(t) {
    t = Math.max(0, Math.floor(t || 0));
    return Math.floor(t / 60) + ':' + ('0' + t % 60).slice(-2);
  }
  function fmtSize(b) { return (b / 1048576).toFixed(1) + ' MB'; }
  function fmtDate(d) { var p = d.split('-'); return App.isEn() ? d : p[2] + '/' + p[1] + '/' + p[0]; }
  function ruby(parts) {
    var out = '';
    for (var i = 0; i < parts.length; i++) out += parts[i][1] ? '<ruby>' + h(parts[i][0]) + '<rt>' + h(parts[i][1]) + '</rt></ruby>' : h(parts[i][0]);
    return out;
  }
  function plainJa(parts) {
    var out = '';
    for (var i = 0; i < parts.length; i++) out += parts[i][0];
    return out;
  }
  function spkColor(id) {
    if (SPK[id]) return SPK[id];
    var s = 0;
    for (var i = 0; i < id.length; i++) s += id.charCodeAt(i);
    return PALETTE[s % PALETTE.length];
  }
  function isLocal() { return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname); }
  function audioUrl(ep) {
    var base = DATA.base && !isLocal() ? DATA.base.replace(/\/?$/, '/') : 'podcast/audio/';
    return base + ep.audio;
  }
  function lyricUrl(ep) { return 'data/podcast/' + ep.id + '.json?v=' + ep.audio.split('.')[1]; }
  function isCached(id) { return !!(prefs.dl[id] || prefs.pre[id]); }
  function tabbarHeight() {
    var tb = document.getElementById('tabbar');
    return tb && tb.offsetHeight ? tb.offsetHeight : 0;
  }

  // ---------- chon tap ----------
  function pool() {
    var list = [];
    for (var i = 0; i < EPS.length; i++) if (!prefs.level || EPS[i].level === prefs.level) list.push(EPS[i]);
    return list.length ? list : EPS;
  }
  function pickNext(exclude) {
    var heard = heardMap(), list = pool(), fresh = [], cached = [], rest = [];
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (e.id === exclude) continue;
      rest.push(e);
      if (!heard[e.id]) {
        fresh.push(e);
        if (isCached(e.id)) cached.push(e);
      }
    }
    var from = navigator.onLine === false && cached.length ? cached : fresh.length ? fresh : rest;
    return from.length ? from[Math.floor(Math.random() * from.length)].id : exclude;
  }

  // ---------- phat ----------
  function load(id, autoplay, startAt, fromHistory, withJingle) {
    var ep = byId[id];
    if (!ep) return;
    var token = ++loadToken;
    if (cur && cur.id !== id && !fromHistory) played.push(cur.id);
    cur = ep;
    lyric = null;
    blocked = audioErr = heardMarked = prefetched = false;
    curLine = onCount = -1;
    nextId = pickNext(id);
    interlude = !!withJingle;
    pendingStart = null;
    fetchJingle();
    function go(url) {
      if (token !== loadToken) return;
      if (interlude) { pendingStart = function () { go(url); }; return; }
      var old = blobUrl;
      blobUrl = url.indexOf('blob:') === 0 ? url : null;
      audio.src = url;
      if (old && old !== blobUrl) URL.revokeObjectURL(old);
      audio.loop = prefs.repeat;
      audio.defaultPlaybackRate = audio.playbackRate = prefs.rate;
      if (startAt) {
        audio.addEventListener('loadedmetadata', function seekOnce() {
          audio.removeEventListener('loadedmetadata', seekOnce);
          audio.currentTime = startAt;
        });
      }
      if (autoplay) play();
    }
    if (interlude) {
      audio.src = jingleSrc;
      audio.loop = false;
      audio.defaultPlaybackRate = audio.playbackRate = 1;
      play();
    }
    if (isCached(id) && window.caches) {
      caches.open(CACHE).then(function (c) { return c.match(audioUrl(ep)); }).then(function (res) {
        if (!res) {
          delete prefs.dl[id]; delete prefs.pre[id]; savePrefs();
          return go(audioUrl(ep));
        }
        return res.blob().then(function (b) { go(URL.createObjectURL(b)); });
      })['catch'](function () { go(audioUrl(ep)); });
    } else go(audioUrl(ep));
    loadLyric(ep, token);
    setMedia(ep);
  }
  // Doan nhac ngan giua hai tap; giu ban blob de van phat duoc khi mat song
  function fetchJingle() {
    if (jingleSrc !== JINGLE || jingleBusy || !window.fetch) return;
    jingleBusy = true;
    fetch(JINGLE).then(function (r) { return r.ok ? r.blob() : null; }).then(function (b) {
      if (b) jingleSrc = URL.createObjectURL(b);
      else jingleBusy = false;
    })['catch'](function () { jingleBusy = false; });
  }
  function endInterlude() {
    interlude = false;
    var start = pendingStart;
    pendingStart = null;
    if (start) start();
    refresh();
  }
  function play() {
    var p = audio.play();
    if (p && p['catch']) {
      p['catch'](function (err) {
        if (err && err.name === 'NotAllowedError') { blocked = true; refresh(); }
      });
    }
  }
  function toggle() {
    if (!cur) return;
    if (audioErr) { load(cur.id, true, audio.currentTime, true); return refresh(); }
    if (audio.paused) play(); else audio.pause();
  }
  function seek(t) {
    if (!cur || interlude) return;
    audio.currentTime = Math.max(0, Math.min(cur.duration - 0.2, t));
    sync();
  }
  function goNext() {
    if (!cur) return;
    load(nextId, true);
    refresh();
  }
  function goPrev() {
    if (!cur) return;
    if (audio.currentTime > 5 || !played.length) seek(0);
    else { load(played.pop(), true, 0, true); refresh(); }
  }
  function stopPlayer() {
    if (!cur) return;
    if (!interlude) savePos();
    played.push(cur.id);
    loadToken++;
    cur = lyric = pendingStart = null;
    interlude = blocked = audioErr = false;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
    if (ms) { ms.metadata = null; ms.playbackState = 'none'; }
    updateMini();
  }
  function markHeard() {
    if (heardMarked || !cur) return;
    heardMarked = true;
    var heard = heardMap(), first = !heard[cur.id];
    if (first) { heard[cur.id] = Date.now(); App.saveProgress(); }
    delete prefs.pos[cur.id];
    if (prefs.pre[cur.id] && !prefs.dl[cur.id]) uncache(cur);
    savePrefs();
    App.emit('podcast:done', { id: cur.id, first: first, level: cur.level, format: cur.format, topics: cur.topics || [] });
  }
  function savePos() {
    if (!cur) return;
    lastSave = Date.now();
    var t = audio.currentTime;
    if (t > 10 && t < cur.duration - 20) prefs.pos[cur.id] = Math.floor(t);
    else delete prefs.pos[cur.id];
    savePrefs();
  }

  audio.addEventListener('play', function () {
    blocked = false;
    lastTick = Date.now();
    clearTimeout(unholdTimer);
    if (window.BGM && window.BGM.hold) window.BGM.hold(true);
    updateButtons();
    positionState();
    startLoop();
  });
  audio.addEventListener('pause', function () {
    updateButtons();
    positionState();
    if (!interlude) savePos();
    // Doi mot chut: het bai chuyen sang bai moi thi khong bat lai nhac nen
    clearTimeout(unholdTimer);
    unholdTimer = setTimeout(function () { if (audio.paused && window.BGM && window.BGM.hold) window.BGM.hold(false); }, 1500);
  });
  audio.addEventListener('ended', function () {
    if (interlude) return endInterlude();
    markHeard();
    load(nextId, true, 0, false, true);
    refresh();
  });
  audio.addEventListener('error', function () {
    if (!cur || !audio.getAttribute('src')) return;
    if (interlude) return endInterlude();
    audioErr = true;
    refresh();
  });
  audio.addEventListener('timeupdate', function () {
    if (!cur || interlude) return;
    var t = audio.currentTime, now = Date.now();
    if (!heardMarked && t >= cur.duration * 0.9) markHeard();
    if (!audio.paused && now - lastTick < 2000) {
      listenAcc += (now - lastTick) / 1000;
      if (listenAcc >= 60) { listenAcc -= 60; App.emit('podcast:minute', { id: cur.id }); }
    }
    lastTick = now;
    if (now - lastSave > 5000) savePos();
    if (!prefetched && t > cur.duration * 0.6) prefetchNext();
    if (!looping || now - lastFrame > 500) sync();
  });
  audio.addEventListener('loadedmetadata', positionState);
  audio.addEventListener('durationchange', positionState);
  audio.addEventListener('ratechange', positionState);
  audio.addEventListener('seeked', function () { positionState(); sync(); });

  // ---------- man hinh khoa, thanh thong bao ----------
  var ms = navigator.mediaSession;
  function setMedia(ep) {
    if (!ms || !window.MediaMetadata) return;
    ms.metadata = new window.MediaMetadata({
      title: ep.title.vi, artist: 'Thái phó · ' + ep.level.toUpperCase(), album: 'When The King Learns',
      artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }, { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
    });
  }
  function positionState() {
    if (interlude || !ms || !ms.setPositionState || !audio.duration || !isFinite(audio.duration)) return;
    try { ms.setPositionState({ duration: audio.duration, playbackRate: audio.playbackRate, position: Math.min(audio.currentTime, audio.duration) }); } catch (e) { /* trinh duyet cu */ }
  }
  if (ms) {
    var handlers = {
      play: function () { play(); },
      pause: function () { audio.pause(); },
      previoustrack: goPrev,
      nexttrack: goNext,
      seekbackward: function (d) { seek(audio.currentTime - ((d && d.seekOffset) || 10)); },
      seekforward: function (d) { seek(audio.currentTime + ((d && d.seekOffset) || 10)); },
      seekto: function (d) { seek(d.seekTime); }
    };
    for (var act in handlers) {
      try { ms.setActionHandler(act, handlers[act]); } catch (e) { /* hanh dong khong ho tro */ }
    }
  }

  // ---------- tai truoc / offline ----------
  function cacheEpisode(ep) {
    return caches.open(CACHE).then(function (c) {
      var urls = [audioUrl(ep), lyricUrl(ep)];
      return Promise.all(urls.map(function (u) {
        return fetch(u).then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return c.put(u, res);
        });
      }));
    });
  }
  function uncache(ep) {
    if (!window.caches) return;
    caches.open(CACHE).then(function (c) { c['delete'](audioUrl(ep)); c['delete'](lyricUrl(ep)); });
    delete prefs.pre[ep.id];
  }
  function prefetchNext() {
    prefetched = true;
    var ep = byId[nextId];
    if (!ep || ep === cur || isCached(ep.id) || !window.caches || !window.fetch || navigator.onLine === false) return;
    cacheEpisode(ep).then(function () { prefs.pre[ep.id] = 1; savePrefs(); })['catch'](function () { /* thu lai o tap sau */ });
  }
  function loadLyric(ep, token) {
    var url = lyricUrl(ep);
    function fromNet() {
      return fetch(url).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      });
    }
    var p = window.caches ? caches.match(url).then(function (r) { return r ? r.json() : fromNet(); }) : fromNet();
    p.then(function (data) {
      if (token !== loadToken) return;
      lyric = data;
      refreshLyrics();
    })['catch'](function () {
      if (token !== loadToken) return;
      lyric = false;
      refreshLyrics();
    });
  }

  // ---------- lop phu trinh phat ----------
  function topBar(left, title, right) {
    return '<div class="ps-top">' + left + '<span class="ps-title">' + title + '</span>' + right + '</div>';
  }
  function iconBtn(act, icon, title) {
    return '<button class="pod-b" data-act="' + act + '" title="' + title + '">' + svg(icon) + '</button>';
  }
  function chapsHtml() {
    if (!lyric) return '';
    var out = '';
    for (var i = 0; i < lyric.chapters.length; i++) out += '<button data-act="podChap" data-c="' + i + '">' + h(lyric.chapters[i].name) + '</button>';
    return out;
  }
  function ticksHtml() {
    if (!lyric) return '';
    var out = '';
    for (var i = 1; i < lyric.chapters.length; i++) out += '<i style="left:' + (lyric.chapters[i].s / cur.duration * 100).toFixed(2) + '%"></i>';
    return out;
  }
  function lyricsHtml() {
    if (lyric === null) return '<p class="pod-wait">' + T('Đang tải lời…', 'Loading lyrics…') + '</p>';
    if (lyric === false) return '<p class="pod-wait">' + T('Không tải được lời. Âm thanh vẫn phát bình thường.', 'Could not load the lyrics. Audio still plays.') + '</p>';
    var out = '';
    for (var i = 0; i < lyric.lines.length; i++) {
      var ln = lyric.lines[i];
      if (ln.cue) {
        out += '<div class="pline cue" data-act="podLine" data-i="' + i + '"><span class="pcue">' + h(L(CUES[ln.cue] || CUES.think)) + '</span><span class="pmeter"><i></i></span></div>';
        continue;
      }
      var toks = '';
      for (var j = 0; j < ln.t.length; j++) {
        var t = ln.t[j];
        toks += '<span>' + (t[3] ? '<ruby>' + h(t[0]) + '<rt>' + h(t[3]) + '</rt></ruby>' : h(t[0])) + '</span>';
      }
      var who = lyric.speakers[ln.spk] ? lyric.speakers[ln.spk].name : ln.spk;
      out += '<div class="pline ' + ln.lang + '" data-act="podLine" data-i="' + i + '">' +
        '<div class="pspk" style="color:' + spkColor(ln.spk) + '">' + h(who) + '</div>' +
        '<div class="ptxt' + (ln.lang === 'ja' ? ' jp" lang="ja' : '') + '">' + toks + '</div>' +
        (ln.lang === 'ja' ? '<div class="pro">' + h(ln.ro) + '</div><div class="ptr">' + h(ln.vi) + '</div>' : '') + '</div>';
    }
    return out;
  }
  function opt(act, label, on) { return '<button class="' + (on ? 'on' : '') + '" data-act="' + act + '">' + label + '</button>'; }
  function ratesHtml() {
    var out = '<div class="pod-opts pod-rates"><span>' + T('Tốc độ', 'Speed') + '</span>';
    for (var i = 0; i < RATES.length; i++) {
      out += '<button class="' + (RATES[i] === prefs.rate ? 'on' : '') + '" data-act="podSetRate" data-r="' + RATES[i] + '">' + RATES[i] + 'x</button>';
    }
    return out + '</div>';
  }
  function viewPlayer() {
    var ep = cur;
    var tags = '<span class="pod-lv">' + h(ep.level.toUpperCase()) + '</span>' + h(FORMATS[ep.format] ? L(FORMATS[ep.format]) : '') +
      (ep.topics && ep.topics.length ? ' · ' + h(ep.topics.join(', ')) : '') + (ep.date ? ' · ' + h(fmtDate(ep.date)) : '');
    var cls = 'pod' + (prefs.furi ? '' : ' no-furi') + (prefs.ro ? '' : ' no-ro') + (prefs.tr ? '' : ' no-tr');
    var status = audioErr ? '<span class="pod-err">' + T('Không tải được âm thanh. Bấm ▶ để thử lại.', 'Audio failed to load. Press ▶ to retry.') + '</span>' : '';
    return '<div class="' + cls + '">' +
      topBar(iconBtn('podClose', 'down', T('Thu nhỏ', 'Minimize')), 'Podcast', iconBtn('podList', 'list', T('Danh sách tập', 'Episode list'))) +
      '<div class="ps-body" id="podBody">' +
      '<div class="pod-head"><div class="pod-tags">' + tags + '</div>' +
      '<h1 class="pod-title jp" lang="ja">' + ruby(ep.title.ja) + '</h1>' +
      '<p class="pod-sub">' + h(ep.title.vi) + '</p>' +
      '<div class="pod-chaps" id="podChaps">' + chapsHtml() + '</div></div>' +
      '<div class="pod-lyrics" id="podLyrics">' + lyricsHtml() + '</div></div>' +
      (blocked ? '<button class="pod-start" data-act="podToggle">' + svg('play') + T('Chạm để nghe', 'Tap to listen') + '</button>' : '') +
      (interlude && !blocked ? '<div class="pod-inter">♪ ' + T('Nghỉ một chút, tập mới sắp bắt đầu…', 'Short break, the next episode is coming…') + '</div>' : '') +
      '<button class="pod-follow" id="podFollow" data-act="podFollow">↓ ' + T('Về câu đang phát', 'Back to current line') + '</button>' +
      '<div class="pod-dock" id="podDock"><div class="pod-dock-in">' +
      '<div class="pod-seekwrap"><div class="pod-ticks" id="podTicks">' + ticksHtml() + '</div>' +
      '<input class="pod-seek" id="podSeek" type="range" min="0" max="' + ep.duration + '" step="0.1" value="' + (interlude ? 0 : audio.currentTime) + '" data-input="podSeek"></div>' +
      '<div class="pod-times"><span id="podCur">' + fmtTime(interlude ? 0 : audio.currentTime) + '</span>' + status + '<span>' + fmtTime(ep.duration) + '</span></div>' +
      '<div class="pod-ctrl">' +
      '<button class="pod-b' + (prefs.repeat ? ' on' : '') + '" data-act="podRepeat" title="' + T('Lặp lại tập này', 'Repeat this episode') + '">' + svg('repeat') + '</button>' +
      '<button class="pod-b" data-act="podPrev" title="' + T('Tập trước', 'Previous') + '">' + svg('prev') + '</button>' +
      '<button class="pod-b txt" data-act="podBack" title="' + T('Lùi 10 giây', 'Back 10 seconds') + '">−10</button>' +
      '<button class="pod-play" id="podPlay" data-act="podToggle" title="' + T('Phát / tạm dừng', 'Play / pause') + '">' + svg(audio.paused ? 'play' : 'pause') + '</button>' +
      '<button class="pod-b txt" data-act="podFwd" title="' + T('Tới 10 giây', 'Forward 10 seconds') + '">+10</button>' +
      '<button class="pod-b" data-act="podNext" title="' + T('Tập khác', 'Next episode') + '">' + svg('next') + '</button>' +
      '<button class="pod-b txt' + (rateOpen ? ' on' : '') + '" data-act="podRate" title="' + T('Tốc độ', 'Speed') + '">' + prefs.rate + 'x</button></div>' +
      (rateOpen ? ratesHtml() : '<div class="pod-opts">' + opt('podFuri', 'Furigana', prefs.furi) + opt('podRo', 'Romaji', prefs.ro) + opt('podTr', T('Dịch', 'Translation'), prefs.tr) + '</div>') +
      '</div></div></div>';
  }
  function sheetEl() {
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.id = 'podSheet';
      document.body.appendChild(sheet);
    }
    return sheet;
  }
  function renderSheet() {
    var el = sheetEl(), body = document.getElementById('podBody');
    var keep = body ? body.scrollTop : 0, sameView = el.getAttribute('data-view') === sheetView;
    onPlayer = full && sheetView === 'player' && !!cur;
    el.setAttribute('data-view', sheetView);
    el.innerHTML = sheetView === 'list' || !cur ? viewList() : viewPlayer();
    body = document.getElementById('podBody');
    if (body && sameView) body.scrollTop = keep;
    if (onPlayer) bind();
    else els = [];
  }
  function refresh() {
    if (full) renderSheet();
    updateMini();
  }
  function refreshLyrics() {
    if (!onPlayer) return;
    var box = document.getElementById('podLyrics');
    if (!box) return;
    box.innerHTML = lyricsHtml();
    document.getElementById('podChaps').innerHTML = chapsHtml();
    document.getElementById('podTicks').innerHTML = ticksHtml();
    bind();
  }
  function bind() {
    els = [].slice.call(document.querySelectorAll('#podLyrics .pline'));
    curLine = onCount = -1;
    layout();
    sync();
    startLoop();
  }
  function layout() {
    var dock = document.getElementById('podDock'), fb = document.getElementById('podFollow');
    if (dock && fb) fb.style.bottom = (dock.offsetHeight + 12) + 'px';
  }
  function openSheet(view) {
    if (!EPS.length) return;
    sheetView = view || 'player';
    if (!cur) load(pickNext(null), true);
    var el = sheetEl();
    if (!full) {
      full = true;
      pageY = window.pageYOffset;
      try { window.history.pushState({ podSheet: 1 }, ''); } catch (e) { /* trinh duyet cu */ }
    }
    document.body.classList.add('pod-full');
    renderSheet();
    void el.offsetWidth;
    el.classList.add('open');
    updateMini();
  }
  function closeSheet(fromPop) {
    if (!full) return;
    full = onPlayer = rateOpen = false;
    els = [];
    sheet.classList.remove('open');
    document.body.classList.remove('pod-full');
    window.scrollTo(0, pageY);
    updateMini();
    if (!fromPop && window.history.state && window.history.state.podSheet) window.history.back();
  }
  // Nut Back cua Android thu nho trinh phat thay vi roi trang
  window.addEventListener('popstate', function () { if (full) closeSheet(true); });
  function updateButtons() {
    var b = document.getElementById('podPlay');
    if (b) b.innerHTML = svg(audio.paused ? 'play' : 'pause');
    var start = document.querySelector('.pod-start');
    if (start && !audio.paused) start.parentNode.removeChild(start);
    updateMini();
    if (ms) ms.playbackState = !cur ? 'none' : audio.paused ? 'paused' : 'playing';
  }

  function lineAt(lines, t) {
    var lo = 0, hi = lines.length - 1, ans = -1;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      if (lines[mid].s <= t + 0.05) { ans = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return ans;
  }
  function center(el) {
    var box = document.getElementById('podBody');
    if (!box) return;
    var y = Math.max(0, el.offsetTop + el.offsetHeight / 2 - box.clientHeight * 0.45);
    if (box.scrollTo) {
      try { box.scrollTo({ top: y, behavior: 'smooth' }); } catch (e) { box.scrollTop = y; }
    } else box.scrollTop = y;
    // Cuon muot can trinh duyet ve khung hinh; khong ve thi nhay thang
    setTimeout(function () { if (Math.abs(box.scrollTop - y) > 40) box.scrollTop = y; }, 800);
  }
  function sync() {
    if (!cur || !onPlayer) return;
    var t = interlude ? 0 : audio.currentTime;
    var seekEl = document.getElementById('podSeek'), curEl = document.getElementById('podCur');
    if (seekEl) seekEl.value = t;
    if (curEl) curEl.textContent = fmtTime(t);
    if (interlude || !lyric || !els.length) return;
    var lines = lyric.lines, i = lineAt(lines, t), k;
    if (i !== curLine) {
      if (curLine >= 0 && els[curLine]) {
        els[curLine].classList.remove('cur');
        var old = els[curLine].querySelectorAll('.ptxt span');
        for (k = 0; k < old.length; k++) old[k].className = '';
      }
      for (k = 0; k < els.length; k++) els[k].classList.toggle('past', k < i);
      curLine = i;
      onCount = -1;
      if (i >= 0) {
        els[i].classList.add('cur');
        if (follow && !document.hidden) center(els[i]);
      }
      var ch = 0, btns = document.querySelectorAll('#podChaps button');
      for (k = 0; k < lyric.chapters.length; k++) if (lyric.chapters[k].s <= t + 0.05) ch = k;
      for (k = 0; k < btns.length; k++) btns[k].classList.toggle('on', k === ch);
    }
    if (i < 0) return;
    var ln = lines[i];
    if (ln.cue) {
      var meter = els[i].querySelector('.pmeter i');
      if (meter) meter.style.width = Math.min(100, (t - ln.s) / (ln.e - ln.s) * 100) + '%';
      return;
    }
    var spans = els[i].querySelectorAll('.ptxt span'), c = 0;
    while (c < ln.t.length && ln.t[c][1] <= t) c++;
    if (c !== onCount) {
      for (k = 0; k < spans.length; k++) spans[k].className = k < c ? 'on' : '';
      onCount = c;
    }
    for (k = 0; k < c; k++) {
      var now = t < ln.t[k][2];
      if (now !== spans[k].classList.contains('now')) spans[k].classList.toggle('now', now);
    }
  }
  function loop() {
    if (!onPlayer || audio.paused) { looping = false; return; }
    lastFrame = Date.now();
    sync();
    requestAnimationFrame(loop);
  }
  function startLoop() {
    if (looping || !onPlayer || audio.paused || !window.requestAnimationFrame) return;
    looping = true;
    requestAnimationFrame(loop);
  }
  function pauseFollow(e) {
    if (!onPlayer) return;
    for (var el = e && e.target; el && el !== document; el = el.parentNode) {
      if (el.id !== 'podBody') continue;
      follow = false;
      var fb = document.getElementById('podFollow');
      if (fb) fb.style.display = 'block';
      clearTimeout(followTimer);
      followTimer = setTimeout(resumeFollow, 6000);
      return;
    }
  }
  function resumeFollow() {
    follow = true;
    clearTimeout(followTimer);
    var fb = document.getElementById('podFollow');
    if (fb) fb.style.display = 'none';
    if (onPlayer && curLine >= 0 && els[curLine]) center(els[curLine]);
  }
  window.addEventListener('wheel', pauseFollow, { passive: true });
  window.addEventListener('touchmove', pauseFollow, { passive: true });
  window.addEventListener('resize', function () { if (onPlayer) layout(); updateMini(); });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && onPlayer) { curLine = -1; sync(); startLoop(); }
  });
  document.addEventListener('keydown', function (e) {
    var tag = e.target && e.target.tagName;
    if (!full || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'Escape' || e.keyCode === 27) closeSheet();
    else if (onPlayer && (e.key === ' ' || e.keyCode === 32)) { e.preventDefault(); toggle(); }
  });

  // ---------- thanh phat nho o day man hinh ----------
  function updateMini() {
    var el = document.getElementById('podMini'), app = document.getElementById('app');
    if (full || !cur) {
      if (el) el.style.display = 'none';
      if (app) app.style.paddingBottom = '';
      return;
    }
    if (!el) {
      el = document.createElement('div');
      el.id = 'podMini';
      document.body.appendChild(el);
    }
    el.style.display = '';
    el.style.bottom = tabbarHeight() + 'px';
    el.innerHTML = '<button class="pod-b" data-act="podToggle" title="' + T('Phát / tạm dừng', 'Play / pause') + '">' + svg(audio.paused ? 'play' : 'pause') + '</button>' +
      '<div class="pm-body" data-act="podOpen"><b>' + h(cur.title.vi) + '</b><small>' +
      (interlude ? '♪ ' + T('Sắp sang tập mới…', 'Next episode soon…') : 'Podcast · ' + h(cur.level.toUpperCase())) + '</small></div>' +
      '<button class="pod-b" data-act="podNext" title="' + T('Tập khác', 'Next episode') + '">' + svg('next') + '</button>' +
      '<button class="pod-b pm-x" data-act="podStop" title="' + T('Tắt trình phát', 'Close player') + '">' + svg('close') + '</button>';
    if (app) app.style.paddingBottom = (el.offsetHeight + tabbarHeight() + 16) + 'px';
  }

  // ---------- danh sach ----------
  function offlineInfo() {
    var c = 0, size = 0;
    for (var id in prefs.dl) if (byId[id]) { c++; size += byId[id].size; }
    return { count: c, size: size };
  }
  function viewList() {
    var heard = heardMap(), topics = [], seen = {}, levels = {}, i, j, ep;
    for (i = 0; i < EPS.length; i++) {
      levels[EPS[i].level] = 1;
      for (j = 0; j < (EPS[i].topics || []).length; j++) {
        var tp = EPS[i].topics[j];
        if (!seen[tp]) { seen[tp] = 1; topics.push(tp); }
      }
    }
    var html = '<div class="pod">' +
      topBar(cur ? iconBtn('podList', 'back', T('Về trình phát', 'Back to player')) : '<span class="pod-b"></span>',
        T('Danh sách tập', 'Episodes'), iconBtn('podClose', 'down', T('Thu nhỏ', 'Minimize'))) +
      '<div class="ps-body" id="podBody"><div class="pod-listwrap">' +
      '<p class="pod-count">' + T('Đã nghe ', 'Heard ') + countHeard() + '/' + EPS.length + T(' tập', ' episodes') + '</p>';

    var lvList = Object.keys(levels).sort();
    if (lvList.length > 1) {
      html += '<div class="chips">' + '<button class="chip' + (prefs.level ? '' : ' on') + '" data-act="podLevel" data-lv="">' + T('Mọi cấp', 'All levels') + '</button>';
      for (i = 0; i < lvList.length; i++) html += '<button class="chip' + (prefs.level === lvList[i] ? ' on' : '') + '" data-act="podLevel" data-lv="' + lvList[i] + '">' + lvList[i].toUpperCase() + '</button>';
      html += '</div>';
    }

    var off = offlineInfo();
    html += '<div class="card pod-off"><div class="body"><b>' + T('Nghe offline', 'Listen offline') + '</b><small>' +
      (dlStatus || (off.count ? T('Đã tải ', 'Downloaded ') + off.count + T(' tập · ', ' episodes · ') + fmtSize(off.size) : T('Tải sẵn khi có Wi-Fi để nghe trên tàu, kể cả lúc mất sóng.', 'Download on Wi-Fi to listen without signal.'))) +
      '</small></div><div class="pod-off-btns">' +
      (window.caches ? '<button class="btn" data-act="podDl">' + T('Tải 5 tập chưa nghe', 'Download 5 new') + '</button>' : '') +
      (off.count ? '<button class="btn" data-act="podClear">' + T('Xoá bản tải', 'Remove') + '</button>' : '') + '</div></div>';

    html += '<div class="chips">' + '<button class="chip' + (topic ? '' : ' on') + '" data-act="podTopic" data-t="">' + T('Tất cả', 'All') + '</button>';
    for (i = 0; i < topics.length; i++) html += '<button class="chip' + (topic === topics[i] ? ' on' : '') + '" data-act="podTopic" data-t="' + h(topics[i]) + '">' + h(topics[i]) + '</button>';
    html += '</div><div class="rows">';
    for (i = EPS.length - 1; i >= 0; i--) {
      ep = EPS[i];
      if (prefs.level && ep.level !== prefs.level) continue;
      if (topic && (ep.topics || []).indexOf(topic) < 0) continue;
      var badges = (heard[ep.id] ? '✓ ' + T('Đã nghe', 'Heard') : prefs.pos[ep.id] ? T('Đang nghe dở', 'In progress') : '') +
        (prefs.dl[ep.id] ? (heard[ep.id] || prefs.pos[ep.id] ? ' · ' : '') + T('Đã tải', 'Saved') : '');
      html += '<div class="card rowcard pod-row' + (cur && cur.id === ep.id ? ' playing' : '') + (heard[ep.id] ? ' heard' : '') + '" data-act="podPick" data-id="' + ep.id + '">' +
        '<span class="body"><small class="pod-tags">' + '<span class="pod-lv">' + h(ep.level.toUpperCase()) + '</span>' + h(FORMATS[ep.format] ? L(FORMATS[ep.format]) : '') + (ep.date ? ' · ' + h(fmtDate(ep.date)) : '') + '</small>' +
        '<b>' + h(ep.title.vi) + ' <span class="jp" lang="ja">' + h(plainJa(ep.title.ja)) + '</span></b>' +
        '<span class="preview">' + h(ep.summary || '') + '</span>' + (badges ? '<em>' + badges + '</em>' : '') + '</span>' +
        '<span class="meta"><b>' + fmtTime(ep.duration) + '</b><small>' + fmtSize(ep.size) + '</small></span></div>';
    }
    return html + '</div></div></div></div>';
  }

  // ---------- hanh dong ----------
  var A = App.actions;
  A.podOpen = function () { openSheet('player'); };
  A.podClose = function () { closeSheet(); };
  A.podList = function () { sheetView = sheetView === 'list' ? 'player' : 'list'; rateOpen = false; renderSheet(); };
  A.podToggle = toggle;
  A.podNext = goNext;
  A.podStop = stopPlayer;
  A.podPrev = goPrev;
  A.podBack = function () { seek(audio.currentTime - 10); };
  A.podFwd = function () { seek(audio.currentTime + 10); };
  A.podSeek = function (el) { seek(+el.value); };
  A.podFollow = resumeFollow;
  A.podLine = function (el) {
    if (!lyric) return;
    seek(lyric.lines[+el.getAttribute('data-i')].s);
    resumeFollow();
    if (audio.paused) play();
  };
  A.podChap = function (el) {
    if (!lyric) return;
    seek(lyric.chapters[+el.getAttribute('data-c')].s);
    resumeFollow();
    if (audio.paused) play();
  };
  A.podRate = function () { rateOpen = !rateOpen; refresh(); };
  A.podSetRate = function (el) {
    prefs.rate = +el.getAttribute('data-r');
    audio.defaultPlaybackRate = audio.playbackRate = prefs.rate;
    savePrefs();
    rateOpen = false;
    refresh();
  };
  A.podRepeat = function () {
    prefs.repeat = !prefs.repeat;
    audio.loop = prefs.repeat && !interlude;
    savePrefs();
    App.emit('podcast:repeat', { on: prefs.repeat });
    refresh();
  };
  function flip(key) { return function () { prefs[key] = prefs[key] ? 0 : 1; savePrefs(); refresh(); }; }
  A.podFuri = flip('furi');
  A.podRo = flip('ro');
  A.podTr = flip('tr');
  A.podPick = function (el) {
    var id = el.getAttribute('data-id');
    if (!cur || cur.id !== id) load(id, true, prefs.pos[id] || 0);
    else if (audio.paused) play();
    sheetView = 'player';
    refresh();
  };
  A.podTopic = function (el) { topic = el.getAttribute('data-t'); refresh(); };
  A.podLevel = function (el) { prefs.level = el.getAttribute('data-lv'); savePrefs(); refresh(); };
  A.podDl = function () {
    if (dlStatus || !window.caches) return;
    var heard = heardMap(), list = App.shuffle(pool()), want = [];
    for (var i = 0; i < list.length && want.length < 5; i++) if (!heard[list[i].id] && !prefs.dl[list[i].id]) want.push(list[i]);
    if (!want.length) { alert(T('Bạn đã tải hoặc đã nghe hết các tập.', 'Every episode is already saved or heard.')); return; }
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
    var done = 0;
    function step() {
      if (done >= want.length) { dlStatus = ''; return refresh(); }
      dlStatus = T('Đang tải ', 'Downloading ') + (done + 1) + '/' + want.length + '…';
      refresh();
      cacheEpisode(want[done]).then(function () {
        prefs.dl[want[done].id] = 1;
        delete prefs.pre[want[done].id];
        savePrefs();
        done++;
        step();
      })['catch'](function () {
        dlStatus = '';
        refresh();
        alert(T('Tải không thành công. Kiểm tra kết nối mạng rồi thử lại.', 'Download failed. Check your connection and try again.'));
      });
    }
    step();
  };
  A.podClear = function () {
    if (!confirm(T('Xoá các tập đã tải trên máy này?', 'Remove downloaded episodes from this device?'))) return;
    if (window.caches) caches['delete'](CACHE);
    prefs.dl = {};
    prefs.pre = {};
    savePrefs();
    refresh();
  };

  App.on(function (type) {
    // Nghe phat am kanji thi tam dung podcast de khong de tieng
    if (type === 'audio:play' && !audio.paused) audio.pause();
  });

  App.section({
    id: 'podcast',
    name: ['Podcast', 'Podcast'],
    glyph: '聴',
    desc: ['Nghe Thái phó giảng bài, có lời karaoke, nghe được cả khi tắt màn hình', 'Audio lessons with karaoke lyrics that keep playing with the screen off'],
    ready: true,
    stat: function () { return T('Đã nghe ', 'Heard ') + countHeard() + '/' + EPS.length + T(' tập', ' episodes'); },
    open: function () { openSheet('player'); },
    // Link cu dang #/podcast: ve trang chu roi mo lop phu
    route: function (parts) {
      var view = parts[0] === 'list' ? 'list' : 'player';
      setTimeout(function () { location.replace('#/'); openSheet(view); }, 0);
      return { html: '', title: 'Podcast' };
    },
    afterRender: function () { updateMini(); }
  });
})();
