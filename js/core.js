// Chi dung cu phap ES5 de chay duoc tren WebView Android cu (Via browser).
(function () {
  'use strict';

  var STORE_KEY = 'wtkl.progress.v1';
  var SYNC_KEY = 'wtkl.sync.v1';
  var THEME_KEY = 'wtkl.theme';
  var LAST_KEY = 'wtkl.last';
  var LANG_KEY = 'wtkl.lang';
  var GIST_FILE = 'wtkl-progress.json';

  var appEl = document.getElementById('app');
  var headerEl = document.getElementById('header');
  var navEl = document.getElementById('tabbar');
  var sections = [];
  var sectionById = {};
  var actions = {};
  var listeners = [];
  var mergers = {};
  var settingsRows = [];
  var hankoFn = null;
  var progress = readJson(STORE_KEY) || {};
  var sync = readJson(SYNC_KEY) || {};
  var syncStatus = '';
  var syncBusy = false;
  var syncTimer = null;
  var lastRoute = null;
  var lang = 'vi';
  try { if (localStorage.getItem(LANG_KEY) === 'en') lang = 'en'; } catch (e) { /* che do an danh */ }
  document.documentElement.lang = lang;

  progress.known = progress.known || {};
  progress.quiz = progress.quiz || {};

  // ---------- su kien ----------
  function emit(type, data) {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](type, data || {}); } catch (e) { if (window.console) console.error(e); }
    }
  }

  // ---------- tien ich ----------
  function T(vi, en) { return lang === 'en' ? en : vi; }
  function L(pair) { return typeof pair === 'string' ? pair : pair[lang === 'en' ? 1 : 0]; }
  function h(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function jp(s, cls) {
    return '<span lang="ja" class="jp ' + (cls || '') + '">' + h(s) + '</span>';
  }
  function say(label, cls, speak) {
    return '<span lang="ja" class="jp say ' + (cls || '') + '" data-say="' + h(speak || label) + '">' + h(label) + '</span>';
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function readJson(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* che do an danh */ }
  }
  function bar(n, total) {
    return '<div class="bar"><i style="width:' + (total ? Math.round(n * 100 / total) : 0) + '%"></i></div>';
  }

  // Ky tu nhu ♪ ☀ ⚙ lay tu phong khac nhau tren moi may nen lech tam; dung SVG cho dong deu.
  var ICONS = {
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>'
  };
  function icon(name) {
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + '</svg>';
  }
  function logoSvg(cls) {
    var c = hankoFn ? hankoFn() : { bg: '#c2452d', fg: '#fffdf8' };
    return '<svg class="' + cls + '" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="' + c.bg + '"/>' +
      '<g fill="none" stroke="' + c.fg + '" stroke-width="6" stroke-linecap="round"><path d="M17 18H47M20 32H44M14 46H50M32 18V46"/></g></svg>';
  }

  // ---------- giao dien sang / toi ----------
  function currentTheme() { return document.documentElement.getAttribute('data-theme') || 'light'; }
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* che do an danh */ }
    var meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#16171b' : '#f5f0e6');
  }

  // ---------- tien do ----------
  function isKnown(k) { return !!(progress.known[k] && progress.known[k][0] === 1); }
  function setKnown(k, v) {
    progress.known[k] = [v ? 1 : 0, Date.now()];
    saveProgress();
  }
  function countKnown(list) {
    var n = 0;
    for (var i = 0; i < list.length; i++) if (isKnown(list[i])) n++;
    return n;
  }
  function saveProgress() {
    writeJson(STORE_KEY, progress);
    if (sync.token) {
      clearTimeout(syncTimer);
      syncTimer = setTimeout(function () { doSync(); }, 3000);
    }
  }
  // Moi muc co moc thoi gian, ban ghi moi hon thang; diem trac nghiem giu diem cao nhat.
  function merge(a, b) {
    var out = { known: {}, quiz: {} }, k;
    var ak = (a && a.known) || {}, bk = (b && b.known) || {};
    for (k in ak) out.known[k] = ak[k];
    for (k in bk) if (!out.known[k] || bk[k][1] > out.known[k][1]) out.known[k] = bk[k];
    var aq = (a && a.quiz) || {}, bq = (b && b.quiz) || {};
    for (k in aq) out.quiz[k] = aq[k];
    for (k in bq) if (!out.quiz[k] || bq[k][0] > out.quiz[k][0]) out.quiz[k] = bq[k];
    for (k in mergers) out[k] = mergers[k](a && a[k], b && b[k]);
    return out;
  }

  // ---------- dong bo GitHub Gist ----------
  function gh(method, path, body, cb) {
    var x = new XMLHttpRequest();
    x.open(method, 'https://api.github.com' + path, true);
    x.setRequestHeader('Accept', 'application/vnd.github+json');
    x.setRequestHeader('Authorization', 'token ' + sync.token);
    if (body) x.setRequestHeader('Content-Type', 'application/json');
    x.onreadystatechange = function () {
      if (x.readyState !== 4) return;
      var data = null;
      try { data = JSON.parse(x.responseText); } catch (e) { /* khong phai JSON */ }
      if (x.status >= 200 && x.status < 300) cb(null, data);
      else if (x.status === 401) cb(T('Token không hợp lệ hoặc đã hết hạn.', 'The token is invalid or has expired.'));
      else if (x.status === 404) cb(T('Không tìm thấy Gist (token cần quyền "gist").', 'Gist not found (the token needs the "gist" scope).'));
      else cb(x.status ? T('GitHub báo lỗi ', 'GitHub returned error ') + x.status + '.' : T('Không kết nối được GitHub.', 'Could not reach GitHub.'));
    };
    x.send(body ? JSON.stringify(body) : null);
  }
  function setSyncStatus(text) {
    syncStatus = text;
    var el = document.getElementById('syncStatus');
    if (el) el.textContent = text;
  }
  function doSync() {
    if (!sync.token || syncBusy) return;
    syncBusy = true;
    setSyncStatus(T('Đang đồng bộ…', 'Syncing…'));
    function fail(msg) { syncBusy = false; setSyncStatus(T('Lỗi: ', 'Error: ') + msg); }
    function done() {
      syncBusy = false;
      sync.last = Date.now();
      writeJson(SYNC_KEY, sync);
      emit('sync:ok');
      setSyncStatus(T('Đã đồng bộ lúc ', 'Synced at ') + new Date(sync.last).toLocaleTimeString());
    }
    function pullAndPush() {
      gh('GET', '/gists/' + sync.gistId + '?_=' + Date.now(), null, function (err, gist) {
        if (err) return fail(err);
        var remoteText = gist.files && gist.files[GIST_FILE] ? gist.files[GIST_FILE].content : '{}';
        var remote = null;
        try { remote = JSON.parse(remoteText); } catch (e) { remote = {}; }
        var before = JSON.stringify(progress);
        progress = merge(progress, remote);
        var merged = JSON.stringify(progress);
        writeJson(STORE_KEY, progress);
        // Khong ve lai khi dang o man hinh hoc de khong lam mat the dang lat hay cau dang lam.
        if (merged !== before && parseRoute().length <= 2) render();
        if (merged === JSON.stringify(merge(remote, {}))) return done();
        var files = {};
        files[GIST_FILE] = { content: merged };
        gh('PATCH', '/gists/' + sync.gistId, { files: files }, function (err2) {
          if (err2) return fail(err2);
          done();
        });
      });
    }
    if (sync.gistId) return pullAndPush();
    gh('GET', '/gists?per_page=100', null, function (err, list) {
      if (err) return fail(err);
      for (var i = 0; i < list.length; i++) {
        if (list[i].files && list[i].files[GIST_FILE]) { sync.gistId = list[i].id; break; }
      }
      if (sync.gistId) { writeJson(SYNC_KEY, sync); return pullAndPush(); }
      var files = {};
      files[GIST_FILE] = { content: JSON.stringify(progress) };
      gh('POST', '/gists', { description: 'Tiến độ học tiếng Nhật', 'public': false, files: files }, function (err2, gist) {
        if (err2) return fail(err2);
        sync.gistId = gist.id;
        done();
      });
    });
  }

  // ---------- man hinh chung ----------
  // Muc co open() (nhu Podcast) mo bang lop phu, giu nguyen trang dang xem
  function openAttr(s) { return s.open ? ' data-open="' + s.id + '"' : ''; }
  function viewHome() {
    var last = readJson(LAST_KEY);
    var html = '<div class="hero"><p class="eyebrow">' + jp('今日も一歩ずつ') + '</p><h1>' + T('Hôm nay học gì?', 'What will you study today?') + '</h1></div>';
    if (last && last.path) {
      html += '<a class="resume" href="#/' + h(last.path) + '"><span>' + T('Học tiếp', 'Continue') + '</span><b>' + h(L(last.title)) + '</b><i>→</i></a>';
    }
    for (var j = 0; j < sections.length; j++) if (sections[j].home) html += sections[j].home();
    html += '<div class="grid sections">';
    for (var i = 0; i < sections.length; i++) {
      var s = sections[i];
      if (s.grid === false) continue;
      html += '<a class="card section-card' + (s.ready ? '' : ' soon') + '" href="#/' + s.id + '"' + openAttr(s) + '>' +
        jp(s.glyph, 'glyph') + '<span class="body"><b>' + h(L(s.name)) + '</b><small>' + h(L(s.desc)) + '</small>' +
        '<em>' + h(s.ready && s.stat ? s.stat() : T('Sắp có', 'Coming soon')) + '</em></span></a>';
    }
    return html + '</div>';
  }

  function viewSoon(s) {
    var items = '';
    for (var i = 0; i < (s.planned || []).length; i++) items += '<li>' + h(L(s.planned[i])) + '</li>';
    return '<div class="hero">' + jp(s.glyph, 'glyph big-glyph') + '<h1>' + h(L(s.name)) + '</h1><p class="sub">' + T('Phần này đang được xây dựng', 'This section is under construction') + '</p></div>' +
      '<div class="card narrow"><h3>' + T('DỰ KIẾN SẼ CÓ', 'PLANNED') + '</h3><ul class="plain">' + items + '</ul></div>' +
      '<div class="row"><a class="btn primary" href="#/kanji">' + T('Học Kanji trước', 'Study Kanji first') + '</a></div>';
  }

  var modalEl = null;
  var settingsOpen = false;
  var settingsTab = 'general';

  function setRow(label, control) {
    return '<div class="setrow"><span>' + label + '</span>' + control + '</div>';
  }
  function seg(items) {
    var out = '<div class="seg">';
    for (var i = 0; i < items.length; i++) {
      out += '<button class="' + (items[i][2] ? 'on' : '') + '" data-act="' + items[i][1] + '">' + items[i][0] + '</button>';
    }
    return out + '</div>';
  }
  function settingsBody() {
    if (settingsTab === 'sync') {
      return '<p class="note">' + T('Tạo Personal Access Token (classic) tại github.com → Settings → Developer settings, chỉ tick quyền <b>gist</b>, rồi dán vào đây trên từng thiết bị. Token chỉ lưu trong trình duyệt này và chỉ gửi tới api.github.com.', 'Create a Personal Access Token (classic) at github.com → Settings → Developer settings with only the <b>gist</b> scope, then paste it here on each device. The token is stored only in this browser and sent only to api.github.com.') + '</p>' +
        '<input class="field" id="token" type="password" autocomplete="off" placeholder="ghp_…" value="' + h(sync.token || '') + '">' +
        '<button class="btn primary" data-act="saveToken">' + T('Lưu và đồng bộ', 'Save and sync') + '</button>' +
        '<button class="btn" data-act="clearToken">' + T('Xoá token', 'Remove token') + '</button>' +
        '<p class="status" id="syncStatus">' + h(syncStatus || (sync.token ? T('Đã cài token.', 'Token saved.') : T('Chưa cài đồng bộ.', 'Sync is not set up.'))) + '</p>';
    }
    if (settingsTab === 'backup') {
      return '<h3>' + T('SAO LƯU RA FILE', 'BACK UP TO A FILE') + '</h3>' +
        '<textarea class="field" id="exportBox" readonly>' + h(JSON.stringify(progress)) + '</textarea>' +
        '<button class="btn" data-act="download">' + T('Tải file sao lưu', 'Download backup') + '</button>' +
        '<p class="note">' + T('Nếu trình duyệt không tải được file, hãy chép nội dung trong ô trên.', 'If the download does not start, copy the text in the box above.') + '</p>' +
        '<h3>' + T('NHẬP TỪ BẢN SAO LƯU', 'RESTORE FROM A BACKUP') + '</h3>' +
        '<textarea class="field" id="importBox" placeholder="' + T('Dán nội dung bản sao lưu vào đây', 'Paste the backup text here') + '"></textarea>' +
        '<input class="field" id="importFile" type="file" accept=".json,application/json">' +
        '<button class="btn" data-act="import">' + T('Nhập và gộp vào tiến độ hiện tại', 'Import and merge into current progress') + '</button>' +
        '<p class="status" id="importStatus"></p>' +
        '<h3>' + T('XOÁ TIẾN ĐỘ', 'RESET PROGRESS') + '</h3>' +
        '<button class="btn danger" data-act="reset">' + T('Xoá toàn bộ tiến độ trên thiết bị này', 'Erase all progress on this device') + '</button>';
    }
    if (settingsTab === 'about') {
      return '<h3>' + T('NGUỒN DỮ LIỆU', 'DATA SOURCES') + '</h3><p class="note">' + T('Âm On/Kun: KANJIDIC2. Từ vựng và nghĩa tiếng Anh: JMdict. Cả hai thuộc Electronic Dictionary Research and Development Group, giấy phép CC BY-SA 4.0. Thứ tự nét: KanjiVG © Ulrich Apel, giấy phép CC BY-SA 3.0.', 'On/Kun readings: KANJIDIC2. Vocabulary and English glosses: JMdict. Both are the property of the Electronic Dictionary Research and Development Group, licensed CC BY-SA 4.0. Stroke order: KanjiVG © Ulrich Apel, licensed CC BY-SA 3.0.') + '</p>';
    }
    var B = window.BGM, dark = currentTheme() === 'dark', styles = '';
    for (var id in B.styles) styles += '<option value="' + id + '"' + (B.settings.style === id ? ' selected' : '') + '>' + h(B.styles[id].name) + '</option>';
    return setRow(T('Ngôn ngữ', 'Language'), seg([['Tiếng Việt', 'langVi', lang === 'vi'], ['English', 'langEn', lang === 'en']])) +
      setRow(T('Giao diện', 'Appearance'), seg([['☀ ' + T('Sáng', 'Light'), 'themeLight', !dark], ['☾ ' + T('Tối', 'Dark'), 'themeDark', dark]])) +
      setRow(T('Nhạc nền', 'Background music'), seg([['♪ ' + T('Bật', 'On'), 'bgmOn', B.settings.enabled], [T('Tắt', 'Off'), 'bgmOff', !B.settings.enabled]])) +
      setRow(T('Phong cách nhạc', 'Music style'), '<select class="field" data-change="bgmStyle">' + styles + '</select>') +
      setRow(T('Âm lượng', 'Volume'), '<input class="range" type="range" min="0" max="100" step="5" value="' + B.settings.volume + '" data-input="bgmVolume" data-change="bgmVolume">') +
      settingsRows.map(function (fn) { return fn(setRow, seg); }).join('');
  }
  function renderModal() {
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'modal';
      document.body.appendChild(modalEl);
    }
    document.documentElement.className = settingsOpen ? 'modal-open' : '';
    if (!settingsOpen) { modalEl.innerHTML = ''; return; }
    var names = [['general', T('Chung', 'General')], ['sync', T('Đồng bộ', 'Sync')], ['backup', T('Sao lưu', 'Backup')], ['about', T('Thông tin', 'About')]];
    var tabs = '';
    for (var i = 0; i < names.length; i++) {
      tabs += '<button class="' + (settingsTab === names[i][0] ? 'on' : '') + '" data-act="settingsTab" data-tab="' + names[i][0] + '">' + names[i][1] + '</button>';
    }
    modalEl.innerHTML = '<div class="backdrop" data-act="closeSettings"></div><div class="dialog" role="dialog">' +
      '<div class="dialog-head"><b>' + T('Cài đặt', 'Settings') + '</b><button class="icon-btn" data-act="closeSettings" title="' + T('Đóng', 'Close') + '">' + icon('close') + '</button></div>' +
      '<div class="tabs">' + tabs + '</div><div class="dialog-body">' + settingsBody() + '</div></div>';
  }
  // Chi ve lai thanh dau trang va popup, giu nguyen trang dang mo.
  function refreshChrome() {
    renderChrome(parseRoute());
    renderModal();
  }

  function notFound() {
    return '<div class="hero"><h1>' + T('Không tìm thấy trang', 'Page not found') + '</h1></div><div class="row"><a class="btn primary" href="#/">' + T('Về trang chủ', 'Back to home') + '</a></div>';
  }

  // ---------- dieu huong ----------
  function parseRoute() {
    var raw = location.hash.replace(/^#\/?/, '').replace(/\/$/, '');
    var parts = raw ? raw.split('/') : [];
    for (var i = 0; i < parts.length; i++) {
      try { parts[i] = decodeURIComponent(parts[i]); } catch (e) { /* giu nguyen */ }
    }
    return parts;
  }
  function renderChrome(parts) {
    var B = window.BGM, dark = currentTheme() === 'dark', links = '', tabs = '', i;
    tabs += '<a class="' + (parts.length ? '' : 'on') + '" href="#/"><span class="jp" lang="ja">家</span>' + T('Trang chủ', 'Home') + '</a>';
    for (i = 0; i < sections.length; i++) {
      var s = sections[i], on = parts[0] === s.id ? 'on' : '';
      var dot = s.badge && s.badge() ? '<i class="dot"></i>' : '';
      links += '<a class="' + on + '" href="#/' + s.id + '"' + openAttr(s) + '>' + h(L(s.name)) + dot + '</a>';
      tabs += '<a class="' + on + '" href="#/' + s.id + '"' + openAttr(s) + '>' + jp(s.glyph) + h(L(s.name)) + dot + '</a>';
    }
    headerEl.innerHTML = '<div class="inner"><a class="brand" href="#/" data-act="logo">' + logoSvg('hanko') + '<span class="brand-name">When The King Learns</span></a>' +
      '<nav class="topnav">' + links + '</nav><span class="tools">' +
      '<button class="icon-btn' + (B.settings.enabled ? ' on' : '') + '" data-act="bgmToggle" title="' + T('Nhạc nền', 'Music') + '">' + icon('music') + '</button>' +
      '<button class="icon-btn lang-btn" data-act="langToggle" title="' + T('Đổi ngôn ngữ', 'Switch language') + '">' + (lang === 'en' ? 'EN' : 'VI') + '</button>' +
      '<button class="icon-btn" data-act="themeToggle" title="' + T('Sáng / tối', 'Light / dark') + '">' + icon(dark ? 'sun' : 'moon') + '</button>' +
      '<button class="icon-btn' + (settingsOpen ? ' on' : '') + '" data-act="openSettings" title="' + T('Cài đặt', 'Settings') + '">' + icon('gear') + '</button></span></div>';
    navEl.innerHTML = tabs;
  }
  function render() {
    var parts = parseRoute(), key = parts.join('/');
    if (key === 'settings') { settingsOpen = true; location.hash = '#/'; return; }
    var changed = key !== lastRoute;
    lastRoute = key;
    var view = null, sec = sectionById[parts[0]];
    if (!parts.length) view = { html: viewHome(), title: '' };
    else if (sec && sec.ready) view = sec.route(parts.slice(1), changed);
    else if (sec && parts.length === 1) view = { html: viewSoon(sec), title: L(sec.name) };
    if (!view) view = { html: notFound(), title: '' };

    var back = view.back;
    if (back === undefined && parts.length) {
      var parent = parts.slice(0, -1);
      for (var i = 0; i < parent.length; i++) parent[i] = encodeURIComponent(parent[i]);
      back = parent.join('/');
    }
    renderChrome(parts);
    appEl.innerHTML = (parts.length ? '<a class="backlink" href="#/' + (back || '') + '">‹ ' + h(view.backLabel || T('Quay lại', 'Back')) + '</a>' : '') + view.html;
    document.title = (view.title ? view.title + ' · ' : '') + 'When The King Learns';
    if (view.remember) writeJson(LAST_KEY, { path: key, title: view.remember });
    if (changed) window.scrollTo(0, 0);
    for (var j = 0; j < sections.length; j++) if (sections[j].afterRender) sections[j].afterRender(sections[j] === sec && view.after);
    renderModal();
  }

  // ---------- hanh dong chung ----------
  function setLang(value) {
    lang = value;
    document.documentElement.lang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* che do an danh */ }
    emit('setting', { name: 'lang', value: lang });
    render();
  }
  actions.langToggle = function () { setLang(lang === 'en' ? 'vi' : 'en'); };
  actions.langVi = function () { setLang('vi'); };
  actions.langEn = function () { setLang('en'); };
  actions.openSettings = function () { settingsOpen = true; refreshChrome(); };
  actions.closeSettings = function () { settingsOpen = false; refreshChrome(); };
  actions.settingsTab = function (el) { settingsTab = el.getAttribute('data-tab'); renderModal(); };
  function themeTo(t) { setTheme(t); emit('setting', { name: 'theme', value: t }); refreshChrome(); }
  function bgmTo(on) { window.BGM.setEnabled(on); emit('setting', { name: 'bgm', value: on, style: window.BGM.settings.style }); refreshChrome(); }
  actions.logo = function () { emit('logo'); };
  actions.themeToggle = function () { themeTo(currentTheme() === 'dark' ? 'light' : 'dark'); };
  actions.themeLight = function () { themeTo('light'); };
  actions.themeDark = function () { themeTo('dark'); };
  actions.bgmToggle = function () { bgmTo(!window.BGM.settings.enabled); };
  actions.bgmOn = function () { bgmTo(true); };
  actions.bgmOff = function () { bgmTo(false); };
  actions.bgmStyle = function (el) { window.BGM.setStyle(el.value); emit('setting', { name: 'style', value: el.value, on: window.BGM.settings.enabled }); };
  actions.bgmVolume = function (el) { window.BGM.setVolume(el.value); };
  actions.saveToken = function () {
    var token = document.getElementById('token').value.replace(/\s/g, '');
    if (!token) return setSyncStatus(T('Hãy dán token trước.', 'Paste a token first.'));
    if (token !== sync.token) sync = { token: token };
    writeJson(SYNC_KEY, sync);
    doSync();
  };
  actions.clearToken = function () { sync = {}; writeJson(SYNC_KEY, sync); syncStatus = ''; renderModal(); };
  actions.download = function () {
    try {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(progress)], { type: 'application/json' }));
      a.download = 'wtkl-progress.json';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      emit('backup');
    } catch (e) {
      document.getElementById('exportBox').select();
    }
  };
  actions['import'] = function () {
    function apply(text) {
      var obj = null;
      try { obj = JSON.parse(text); } catch (e) { /* bao loi ben duoi */ }
      if (!obj || typeof obj !== 'object' || (!obj.known && !obj.quiz)) {
        document.getElementById('importStatus').textContent = T('Nội dung không phải bản sao lưu hợp lệ.', 'This is not a valid backup.');
        return;
      }
      progress = merge(progress, obj);
      saveProgress();
      render();
      document.getElementById('importStatus').textContent = T('Đã nhập xong.', 'Import complete.');
    }
    var file = document.getElementById('importFile').files[0];
    if (file) {
      var reader = new FileReader();
      reader.onload = function () { apply(reader.result); };
      reader.readAsText(file);
    } else apply(document.getElementById('importBox').value);
  };
  actions.reset = function () {
    if (!confirm(T('Xoá toàn bộ tiến độ trên thiết bị này? Bản trên Gist (nếu có) không bị xoá.', 'Erase all progress on this device? The copy on Gist, if any, is not erased.'))) return;
    progress = { known: {}, quiz: {} };
    writeJson(STORE_KEY, progress);
    render();
  };

  function dispatch(attr) {
    return function (e) {
      var el = e.target;
      while (el && el !== document) {
        var text = attr === 'data-act' && el.getAttribute && el.getAttribute('data-say');
        if (text) { window.Speech.say(text, el); return; }
        var open = attr === 'data-act' && el.getAttribute && el.getAttribute('data-open');
        if (open && sectionById[open]) { e.preventDefault(); sectionById[open].open(); return; }
        var act = el.getAttribute && el.getAttribute(attr);
        if (act && actions[act]) { actions[act](el); return; }
        el = el.parentNode;
      }
    };
  }

  window.App = {
    T: T, L: L, isEn: function () { return lang === 'en'; },
    emit: emit,
    on: function (fn) { listeners.push(fn); },
    addMerger: function (key, fn) { mergers[key] = fn; },
    addSettingsRow: function (fn) { settingsRows.push(fn); },
    setHanko: function (fn) { hankoFn = fn; },
    refreshChrome: refreshChrome,
    route: parseRoute,
    isBusy: function () {
      for (var i = 0; i < sections.length; i++) if (sections[i].busy && sections[i].busy()) return true;
      return false;
    },
    icon: icon,
    h: h, jp: jp, say: say, shuffle: shuffle, bar: bar,
    actions: actions,
    render: render,
    notFound: notFound,
    progress: function () { return progress; },
    saveProgress: saveProgress,
    isKnown: isKnown, setKnown: setKnown, countKnown: countKnown,
    section: function (def) { sections.push(def); sectionById[def.id] = def; },
    start: function () {
      document.addEventListener('click', dispatch('data-act'));
      document.addEventListener('change', dispatch('data-change'));
      document.addEventListener('input', dispatch('data-input'));
      window.addEventListener('hashchange', render);
      document.addEventListener('keydown', function (e) {
        if (settingsOpen && (e.key === 'Escape' || e.keyCode === 27)) actions.closeSettings();
      });
      emit('start');
      render();
      doSync();
    }
  };
})();
