// Doc tieng Nhat: uu tien file tao san trong audio/ja, thieu thi dung giong cua trinh duyet.
(function () {
  'use strict';

  var player = null;
  var current = null;
  var toastTimer = null;

  // Phai giong het ham norm() trong tools/build_audio.py
  function norm(text) {
    return String(text).replace(/[.\-\s]/g, '').replace(/[ァ-ヶ]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) - 0x60);
    });
  }
  function fileName(key) {
    var out = '';
    for (var i = 0; i < key.length; i++) out += ('000' + key.charCodeAt(i).toString(16)).slice(-4);
    return out + '.mp3';
  }

  function toast(text) {
    var el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.className = 'show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = ''; }, 3000);
  }

  function begin(el) {
    finish();
    current = el || null;
    if (current) current.className += ' speaking';
    if (window.BGM) window.BGM.duck(true);
  }
  function finish() {
    if (current) current.className = current.className.replace(' speaking', '');
    current = null;
    if (window.BGM) window.BGM.duck(false);
  }

  function speakWithBrowser(key, el) {
    var synth = window.speechSynthesis;
    if (!synth || !window.SpeechSynthesisUtterance) {
      finish();
      toast(window.App.T('Chưa có file âm thanh cho mục này và trình duyệt không hỗ trợ giọng đọc.', 'No audio file for this item, and this browser has no speech support.'));
      return;
    }
    var voices = synth.getVoices() || [], voice = null;
    for (var i = 0; i < voices.length; i++) {
      if (/^ja/i.test(voices[i].lang)) { voice = voices[i]; break; }
    }
    if (voices.length && !voice) {
      finish();
      toast(window.App.T('Thiết bị chưa cài giọng đọc tiếng Nhật.', 'This device has no Japanese voice installed.'));
      return;
    }
    var u = new window.SpeechSynthesisUtterance(key);
    u.lang = 'ja-JP';
    if (voice) u.voice = voice;
    u.rate = 0.9;
    u.onend = u.onerror = function () { if (current === el) finish(); };
    synth.cancel();
    begin(el);
    synth.speak(u);
  }

  function say(text, el) {
    var key = norm(text);
    if (!key) return;
    if (window.App) window.App.emit('audio:play', { key: key });
    if (player) { player.onended = player.onerror = null; player.pause(); }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (!(window.AUDIO_SET && window.AUDIO_SET[key])) return speakWithBrowser(key, el);
    begin(el);
    player = new Audio('audio/ja/' + fileName(key) + '?v=' + window.AUDIO_SET[key]);
    player.onended = function () { if (current === el) finish(); };
    player.onerror = function () { speakWithBrowser(key, el); };
    var started = player.play();
    if (started && started['catch']) started['catch'](function () { if (current === el) finish(); });
  }

  window.Speech = { say: say, norm: norm };
})();
