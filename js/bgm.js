// Nhac nen tong hop bang Web Audio, khong can file am thanh. Cu phap ES5.
(function () {
  'use strict';

  var STORAGE_KEY = 'wtkl.bgm';
  var MAX_GAIN = 0.8;
  var LOOKAHEAD_SEC = 0.25;

  var settings = { enabled: false, volume: 30, style: 'lofi' };
  var ctx = null, master = null, duckNode = null, reverb = null, noiseBuf = null;
  var pulse = {};
  var run = null;
  var playing = false;
  var held = false;

  function opt(o, key, def) { return o[key] === undefined ? def : o[key]; }
  function ext(base, extra) {
    var out = {}, k;
    for (k in base) out[k] = base[k];
    for (k in extra) out[k] = extra[k];
    return out;
  }
  function hz(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

  // ---------- nhac cu ----------
  function track(r, src, end) {
    src.stop(end);
    r.sources.push(src);
    src.onended = function () {
      var i = r.sources.indexOf(src);
      if (i >= 0) r.sources.splice(i, 1);
    };
  }

  function tone(r, time, midi, dur, o) {
    o = o || {};
    var gain = opt(o, 'gain', 0.1), attack = opt(o, 'attack', 0.005), release = opt(o, 'release', 0.08);
    var osc = ctx.createOscillator();
    if (o.wave) osc.setPeriodicWave(o.wave);
    else osc.type = o.type || 'sine';
    osc.frequency.value = hz(midi) * (o.ratio || 1);

    var env = ctx.createGain(), end;
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(gain, time + attack);
    if (o.pluck) {
      end = time + dur;
      env.gain.exponentialRampToValueAtTime(0.0001, end);
    } else {
      var hold = time + Math.max(attack, dur);
      end = hold + release;
      env.gain.setValueAtTime(gain, hold);
      env.gain.linearRampToValueAtTime(0, end);
    }

    var out = env;
    if (o.cutoff) {
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = o.cutoff;
      env.connect(lp);
      out = lp;
    }
    osc.connect(env);
    out.connect(r.bus);
    if (o.send) {
      var send = ctx.createGain();
      send.gain.value = o.send;
      out.connect(send);
      send.connect(reverb);
    }
    osc.start(time);
    track(r, osc, end + 0.05);
  }

  function noise(r, time, dur, gain, filterType, freq) {
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    var filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;
    var env = ctx.createGain();
    env.gain.setValueAtTime(gain, time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(filter);
    filter.connect(env);
    env.connect(r.bus);
    src.start(time, Math.random() * 0.5);
    track(r, src, time + dur + 0.02);
  }

  function kick(r, time, gain, type) {
    var osc = ctx.createOscillator();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    var env = ctx.createGain();
    env.gain.setValueAtTime(gain, time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);
    osc.connect(env);
    env.connect(r.bus);
    osc.start(time);
    track(r, osc, time + 0.4);
  }

  // Song xung hep cho am thanh kieu may NES
  function pulseWave(duty) {
    if (!pulse[duty]) {
      var n = 32, real = new Float32Array(n), imag = new Float32Array(n);
      for (var i = 1; i < n; i++) imag[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
      pulse[duty] = ctx.createPeriodicWave(real, imag);
    }
    return pulse[duty];
  }

  // Moi su kien la [buoc, not midi, do dai tinh theo buoc]
  function playLine(r, line, step, time, stepDur, opts) {
    for (var i = 0; i < line.length; i++) {
      if (line[i][0] === step) tone(r, time, line[i][1], line[i][2] * stepDur, opts);
    }
  }
  function each(chord, fn) { for (var i = 0; i < chord.length; i++) fn(chord[i]); }

  // ---------- phong cach ----------
  var STYLES = {
    lofi: {
      name: 'Lofi Hip-Hop',
      bpm: 76, bars: 4, swing: 0.3, cutoff: 3200, level: 0.7,
      chords: [[53, 57, 60, 64], [53, 59, 64, 69], [52, 55, 59, 62], [55, 61, 65]],
      bass: [38, 43, 36, 45],
      melody: [
        [[6, 69, 2], [8, 72, 2], [10, 74, 4]],
        [[6, 74, 2], [8, 72, 2], [10, 69, 2], [12, 67, 4]],
        [[6, 67, 2], [8, 69, 2], [10, 72, 6]],
        [[8, 69, 2], [10, 67, 2], [12, 64, 4]]
      ],
      step: function (r, s, t, d) {
        var bar = Math.floor(s / 16), st = s % 16;
        var keys = { type: 'sine', pluck: true, gain: 0.05, cutoff: 1500, send: 0.3 };
        if (st === 0) each(this.chords[bar], function (m) { tone(r, t, m, 8 * d + 0.6, keys); });
        if (st === 11) each(this.chords[bar], function (m) { tone(r, t, m, 4 * d, ext(keys, { gain: 0.03 })); });
        if (st === 0 || st === 10) tone(r, t, this.bass[bar], (st ? 5 : 7) * d, { type: 'triangle', gain: 0.22, cutoff: 400 });
        if (r.loop % 2 === 0) {
          playLine(r, this.melody[bar], st, t, d, { type: 'triangle', gain: 0.07, attack: 0.02, release: 0.25, cutoff: 2200, send: 0.4 });
        }
        if (st === 0 || st === 7 || st === 10) kick(r, t, 0.5);
        if (st === 4 || st === 12) noise(r, t, 0.18, 0.18, 'bandpass', 1500);
        if (st % 2 === 0) noise(r, t, 0.04, st % 4 ? 0.04 : 0.07, 'highpass', 7000);
        if (Math.random() < 0.12) noise(r, t + Math.random() * d, 0.004, 0.03, 'highpass', 3000);
      }
    },

    chiptune: {
      name: 'Chiptune 8-bit',
      bpm: 120, bars: 8, swing: 0, cutoff: 6000, level: 0.45,
      chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]],
      melody: [
        [[0, 76, 2], [2, 79, 2], [4, 76, 2], [6, 74, 2], [8, 72, 4], [12, 67, 4]],
        [[0, 69, 2], [2, 72, 2], [4, 76, 4], [8, 74, 2], [10, 72, 2], [12, 74, 4]],
        [[0, 72, 2], [2, 77, 2], [4, 81, 4], [8, 79, 2], [10, 77, 2], [12, 76, 4]],
        [[0, 74, 4], [4, 79, 2], [6, 77, 2], [8, 76, 2], [10, 74, 6]],
        [[0, 79, 4], [4, 76, 2], [6, 79, 2], [8, 84, 4], [12, 79, 4]],
        [[0, 81, 4], [4, 79, 2], [6, 76, 2], [8, 72, 8]],
        [[0, 77, 2], [2, 76, 2], [4, 77, 2], [6, 81, 2], [8, 79, 4], [12, 77, 4]],
        [[0, 74, 4], [4, 71, 2], [6, 74, 2], [8, 67, 8]]
      ],
      step: function (r, s, t, d) {
        var bar = Math.floor(s / 16), st = s % 16, chord = this.chords[bar % 4];
        playLine(r, this.melody[bar], st, t, d, { wave: pulseWave(0.25), gain: 0.06, release: 0.03, send: 0.15 });
        var arp = chord.concat([chord[0] + 12]);
        tone(r, t, arp[st % 4] + 12, d * 0.9, { wave: pulseWave(0.125), gain: 0.015, pluck: true });
        if (st % 2 === 0) tone(r, t, chord[0] - 24 + (st % 4 ? 12 : 0), d * 1.6, { type: 'triangle', gain: 0.2, release: 0.02 });
        if (st === 0 || st === 8 || st === 10) kick(r, t, 0.35, 'triangle');
        if (st === 4 || st === 12) noise(r, t, 0.1, 0.12, 'highpass', 2000);
        if (st % 2 === 0) noise(r, t, 0.03, 0.04, 'highpass', 8000);
      }
    },

    kalimba: {
      name: 'Kalimba',
      bpm: 92, bars: 4, swing: 0.1, cutoff: 6000, level: 1,
      bass: [45, 41, 48, 43],
      arps: [
        [69, 72, 76, 81, 79, 76, 72, 76],
        [65, 69, 72, 77, 76, 72, 69, 72],
        [67, 72, 76, 79, 76, 72, 74, 76],
        [67, 71, 74, 79, 81, 79, 74, 71]
      ],
      sparkle: [84, 88, 81, 86],
      step: function (r, s, t, d) {
        var bar = Math.floor(s / 16), st = s % 16;
        var pluck = { type: 'sine', pluck: true, gain: 0.09, send: 0.35 };
        if (st % 2 === 0) {
          var m = this.arps[bar][st / 2];
          tone(r, t, m, 1.4, pluck);
          tone(r, t, m, 0.25, ext(pluck, { gain: 0.012, ratio: 3, send: 0 }));
        }
        if (st === 0 || st === 8) tone(r, t, this.bass[bar], 2, ext(pluck, { gain: 0.16, send: 0.2 }));
        if (r.loop % 2 === 1 && st === 13) tone(r, t, this.sparkle[bar], 1.6, ext(pluck, { gain: 0.05 }));
      }
    },

    synthwave: {
      name: 'Synthwave / City Pop',
      bpm: 104, bars: 4, swing: 0, cutoff: 5000, level: 0.6,
      chords: [[53, 57, 60, 64], [55, 59, 62, 64], [52, 55, 59, 62], [57, 60, 64, 67]],
      melody: [
        [[2, 76, 2], [4, 77, 2], [6, 79, 2], [8, 81, 4], [12, 79, 2], [14, 76, 2]],
        [[0, 74, 4], [4, 79, 2], [6, 77, 2], [8, 76, 2], [10, 74, 6]],
        [[2, 71, 2], [4, 74, 2], [6, 76, 2], [8, 79, 4], [12, 83, 2], [14, 81, 2]],
        [[0, 81, 6], [6, 79, 2], [8, 76, 4], [12, 76, 2], [14, 79, 2]]
      ],
      step: function (r, s, t, d) {
        var bar = Math.floor(s / 16), st = s % 16, chord = this.chords[bar];
        if (st === 0) {
          each(chord, function (m) {
            tone(r, t, m, 15 * d, { type: 'sawtooth', gain: 0.025, attack: 0.08, release: 0.3, cutoff: 1100, send: 0.3 });
          });
        }
        if (st % 2 === 0) tone(r, t, chord[0] - 24 + (st % 4 ? 12 : 0), d * 1.5, { type: 'sawtooth', gain: 0.1, release: 0.04, cutoff: 650 });
        if (r.loop % 2 === 1) {
          playLine(r, this.melody[bar], st, t, d, { wave: pulseWave(0.5), gain: 0.04, attack: 0.01, release: 0.15, cutoff: 3000, send: 0.4 });
        }
        if (st === 0 || st === 8) kick(r, t, 0.55);
        if (st === 4 || st === 12) noise(r, t, 0.25, 0.2, 'bandpass', 1800);
        if (st % 2 === 0) noise(r, t, st === 14 ? 0.15 : 0.04, 0.05, 'highpass', 8000);
      }
    },

    ambient: {
      name: 'Ambient',
      bpm: 64, bars: 16, swing: 0, cutoff: 1300, level: 1,
      chords: [[50, 57, 61, 64, 66], [47, 54, 57, 61, 62], [43, 50, 54, 57, 62], [45, 52, 54, 59, 62]],
      step: function (r, s, t, d) {
        if (s % 64 !== 0) return;
        each(this.chords[s / 64], function (m) {
          tone(r, t, m, 64 * d, { type: 'sine', gain: 0.05, attack: 4, release: 6, send: 0.3 });
          tone(r, t, m + 12, 64 * d, { type: 'triangle', gain: 0.008, attack: 5, release: 6 });
        });
      }
    }
  };

  // ---------- bo phat ----------
  function targetGain() {
    var v = settings.volume / 100;
    return MAX_GAIN * v * v;
  }

  function buildGraph() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var data = noiseBuf.getChannelData(0);
    for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    master = ctx.createGain();
    master.gain.value = targetGain();
    duckNode = ctx.createGain();
    master.connect(duckNode);
    duckNode.connect(ctx.destination);

    // Hai bo tre noi cheo nhau lam tieng vang don gian
    reverb = ctx.createGain();
    var wet = ctx.createGain();
    wet.gain.value = 0.35;
    wet.connect(master);
    var times = [0.31, 0.47];
    for (var j = 0; j < times.length; j++) {
      var delay = ctx.createDelay(1), fb = ctx.createGain(), damp = ctx.createBiquadFilter();
      delay.delayTime.value = times[j];
      fb.gain.value = 0.35;
      damp.type = 'lowpass';
      damp.frequency.value = 2000;
      reverb.connect(delay);
      delay.connect(damp);
      damp.connect(fb);
      fb.connect(delay);
      damp.connect(wet);
    }
    return true;
  }

  function schedule(r) {
    var style = r.style, stepDur = 60 / style.bpm / 4, total = style.bars * 16;
    while (r.nextTime < ctx.currentTime + LOOKAHEAD_SEC) {
      var swing = r.step % 2 ? style.swing * stepDur : 0;
      style.step(r, r.step, r.nextTime + swing, stepDur);
      r.nextTime += stepDur;
      r.step++;
      if (r.step === total) { r.step = 0; r.loop++; }
    }
  }

  function start() {
    if (playing || held) return;
    if (!ctx && !buildGraph()) return;
    if (ctx.resume) ctx.resume();
    playing = true;

    var style = STYLES[settings.style] || STYLES.lofi;
    var bus = ctx.createGain(), filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = style.cutoff;
    bus.connect(filter);
    filter.connect(master);
    bus.gain.setValueAtTime(0, ctx.currentTime);
    bus.gain.linearRampToValueAtTime(style.level, ctx.currentTime + 1.5);

    var r = { style: style, bus: bus, sources: [], step: 0, loop: 0, nextTime: ctx.currentTime + 0.1 };
    r.timer = setInterval(function () { schedule(r); }, 50);
    schedule(r);
    run = r;
  }

  function stop(fadeSec) {
    if (!playing) return;
    if (fadeSec === undefined) fadeSec = 1.5;
    playing = false;
    var r = run;
    run = null;
    clearInterval(r.timer);
    var now = ctx.currentTime;
    r.bus.gain.cancelScheduledValues(now);
    r.bus.gain.setValueAtTime(r.bus.gain.value, now);
    r.bus.gain.linearRampToValueAtTime(0, now + fadeSec);
    var list = r.sources.slice();
    for (var i = 0; i < list.length; i++) {
      try { list[i].stop(now + fadeSec + 0.05); } catch (e) { /* da dung */ }
    }
    setTimeout(function () { r.bus.disconnect(); }, (fadeSec + 0.2) * 1000);
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (e) { /* che do an danh */ }
  }

  function setEnabled(enabled) {
    settings.enabled = !!enabled;
    save();
    if (settings.enabled) start(); else stop();
  }

  try {
    var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) settings = ext(settings, saved);
  } catch (e) { /* giu mac dinh */ }
  if (!STYLES[settings.style]) settings.style = 'lofi';

  // Trinh duyet chan am thanh cho toi khi nguoi dung cham lan dau
  if (settings.enabled) {
    var startOnGesture = function () {
      document.removeEventListener('click', startOnGesture);
      document.removeEventListener('touchend', startOnGesture);
      document.removeEventListener('keydown', startOnGesture);
      if (settings.enabled) start();
    };
    document.addEventListener('click', startOnGesture);
    document.addEventListener('touchend', startOnGesture);
    document.addEventListener('keydown', startOnGesture);
  }

  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else if (playing) ctx.resume();
  });

  window.BGM = {
    styles: STYLES,
    settings: settings,
    isPlaying: function () { return playing; },
    setEnabled: setEnabled,
    toggle: function () { setEnabled(!settings.enabled); },
    // Tam dung khi podcast phat, khong doi cai dat bat/tat cua nguoi dung
    hold: function (on) {
      held = !!on;
      if (held) stop(0.6); else if (settings.enabled) start();
    },
    duck: function (on) {
      if (!ctx) return;
      duckNode.gain.cancelScheduledValues(ctx.currentTime);
      duckNode.gain.setTargetAtTime(on ? 0.25 : 1, ctx.currentTime, on ? 0.1 : 0.5);
    },
    setStyle: function (id) {
      if (!STYLES[id]) return;
      settings.style = id;
      save();
      if (playing) { stop(0.4); start(); }
    },
    setVolume: function (value) {
      settings.volume = parseInt(value, 10) || 0;
      save();
      if (ctx) master.gain.setTargetAtTime(targetGain(), ctx.currentTime, 0.1);
    }
  };
})();
