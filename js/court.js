(function () {
  'use strict';

  var KEY = 'wtkl.court';
  var root = document.documentElement;
  var App = window.App, T = App.T, actions = App.actions;
  var fontLoaded = false, petals = null, modalTimer = null;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function isOn() { return root.hasAttribute('data-court'); }

  function loadFont() {
    if (fontLoaded) return;
    fontLoaded = true;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif:wght@700;800&family=Shippori+Mincho:wght@700;800&display=swap';
    document.head.appendChild(l);
  }

  function updatePetals() {
    var want = isOn() && !reduced && !App.route().length;
    if (!want) { if (petals) { petals.parentNode.removeChild(petals); petals = null; } return; }
    if (petals) return;
    petals = document.createElement('div');
    petals.id = 'court-petals';
    var html = '';
    for (var i = 0; i < 12; i++) {
      html += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;animation-duration:' + (9 + Math.random() * 8).toFixed(1) +
        's;animation-delay:-' + (Math.random() * 16).toFixed(1) + 's;width:' + (9 + Math.random() * 8).toFixed(0) + 'px"></i>';
    }
    petals.innerHTML = html;
    document.body.appendChild(petals);
  }

  function setOn(on) {
    if (on) { root.setAttribute('data-court', ''); loadFont(); } else root.removeAttribute('data-court');
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
    updatePetals();
    App.refreshChrome();
  }

  var CLICKABLE = 'button, a, .opt, .chip, .vcard, [data-act]';
  document.addEventListener('pointerdown', function (e) {
    if (!isOn() || reduced || e.button > 0) return;
    var t = e.target.closest && e.target.closest(CLICKABLE);
    if (!t || t.disabled) return;
    var burst = document.createElement('span'), sparks = '';
    burst.className = 'court-burst';
    burst.style.left = e.clientX + 'px';
    burst.style.top = e.clientY + 'px';
    for (var i = 0; i < 8; i++) sparks += '<i style="--a:' + (i * 45 + Math.random() * 20) + 'deg;--d:' + (22 + Math.random() * 18).toFixed(0) + 'px"></i>';
    burst.innerHTML = sparks;
    document.body.appendChild(burst);
    setTimeout(function () { burst.parentNode && burst.parentNode.removeChild(burst); }, 700);
  }, true);

  function modalEl() { return document.getElementById('modal'); }
  var openSettings = actions.openSettings, closeSettings = actions.closeSettings;
  actions.openSettings = function (el) {
    openSettings(el);
    var m = modalEl();
    if (!m || !isOn()) return;
    clearTimeout(modalTimer);
    m.classList.remove('leave');
    m.classList.add('enter');
    modalTimer = setTimeout(function () { m.classList.remove('enter'); }, 650);
  };
  actions.closeSettings = function (el) {
    var m = modalEl();
    if (!m || !isOn() || reduced || !m.firstChild || m.classList.contains('leave')) { closeSettings(el); return; }
    clearTimeout(modalTimer);
    m.classList.remove('enter');
    m.classList.add('leave');
    modalTimer = setTimeout(function () { m.classList.remove('leave'); closeSettings(el); }, 300);
  };

  var ENTER = {
    flip: ['.flash', 'court-flip'], flashYes: ['.flash', 'court-deal'], flashNo: ['.flash', 'court-deal'],
    flashAgain: ['.flash', 'court-deal'], flashAll: ['.flash', 'court-deal'],
    quizNext: ['.quiz', 'court-new'], quizRetry: ['.quiz', 'court-new'], vNext: ['.quiz', 'court-new'], vgNext: ['.quiz', 'court-new']
  };
  Object.keys(ENTER).forEach(function (name) {
    var orig = actions[name];
    if (!orig) return;
    actions[name] = function (el) {
      orig(el);
      var t = isOn() && document.querySelector('#app ' + ENTER[name][0]);
      if (t) t.classList.add(ENTER[name][1]);
    };
  });

  actions.courtOn = function () { setOn(true); };
  actions.courtOff = function () { setOn(false); };
  App.addSettingsRow(function (setRow, seg) {
    var on = isOn();
    return setRow(T('Giao diện triều đình', 'Imperial court style'), seg([[T('Bật', 'On'), 'courtOn', on], [T('Tắt', 'Off'), 'courtOff', !on]]));
  });

  // Entrance animations must not replay on in-page re-renders (e.g. map clicks)
  var enterTimer = null;
  function markEnter() {
    var app = document.getElementById('app');
    if (!app) return;
    app.classList.add('court-enter');
    clearTimeout(enterTimer);
    enterTimer = setTimeout(function () { app.classList.remove('court-enter'); }, 1200);
  }
  function isStudy(p) {
    if (p[0] === 'kanji') return /^(flash|quiz|vocab)$/.test(p[3] || '') || (p[3] === 'list' && p.length === 5);
    if (p[0] !== 'vocab') return false;
    return p[1] === 'review' || (p[1] === 'wanted' && p[2] === 'hunt') || (p[1] === 'games' && p.length === 3) ||
      (p[1] === 'n5' && /^(learn|review|w)$/.test(p[3] || ''));
  }
  function updateFocus() {
    if (isStudy(App.route())) root.setAttribute('data-focus', ''); else root.removeAttribute('data-focus');
  }

  window.addEventListener('hashchange', function () { markEnter(); updatePetals(); updateFocus(); });
  App.on(function (type) { if (type === 'start') { markEnter(); updateFocus(); setTimeout(updatePetals, 0); } });
  if (isOn()) loadFont();
})();
