// Ve cong trinh, canh quan the, buc tuong gach va ky quan bang SVG. Cu phap ES5.
(function () {
  'use strict';

  function r2(n) { return Math.round(n * 10) / 10; }
  function rect(x, y, w, h, cls) { return '<rect class="' + cls + '" x="' + r2(x) + '" y="' + r2(y) + '" width="' + r2(w) + '" height="' + r2(h) + '"/>'; }
  function line(x1, y1, x2, y2, cls) { return '<path class="' + cls + '" d="M' + r2(x1) + ' ' + r2(y1) + 'L' + r2(x2) + ' ' + r2(y2) + '"/>'; }
  function path(d, cls) { return '<path class="' + cls + '" d="' + d + '"/>'; }
  function circle(x, y, r, cls) { return '<circle class="' + cls + '" cx="' + r2(x) + '" cy="' + r2(y) + '" r="' + r2(r) + '"/>'; }
  function grp(cls, inner) { return inner ? '<g class="' + cls + '">' + inner + '</g>' : ''; }
  function rnd(seed) { var a = (seed * 9301 + 49297) % 233280; return function () { a = (a * 9301 + 49297) % 233280; return a / 233280; }; }

  // Mai cong kieu Nhat: hai dau vut len
  function roof(cx, y, w, h, style) {
    var l = cx - w / 2, rr = cx + w / 2, lift = style === 'flat' ? 0 : h * 0.35;
    var d = style === 'gable'
      ? 'M' + r2(l) + ' ' + r2(y) + 'L' + r2(cx) + ' ' + r2(y - h) + 'L' + r2(rr) + ' ' + r2(y) + 'Z'
      : 'M' + r2(l - 3) + ' ' + r2(y - lift) + 'Q' + r2(l + w * 0.18) + ' ' + r2(y) + ' ' + r2(l + w * 0.22) + ' ' + r2(y - h * 0.55) +
        'L' + r2(cx - w * 0.16) + ' ' + r2(y - h) + 'L' + r2(cx + w * 0.16) + ' ' + r2(y - h) + 'L' + r2(rr - w * 0.22) + ' ' + r2(y - h * 0.55) +
        'Q' + r2(rr - w * 0.18) + ' ' + r2(y) + ' ' + r2(rr + 3) + ' ' + r2(y - lift) + 'Z';
    return path(d, 'rf');
  }
  function shoji(x, y, w, h) {
    var s = rect(x, y, w, h, 'wl'), n = Math.max(2, Math.round(w / 9));
    for (var i = 1; i < n; i++) s += line(x + w * i / n, y, x + w * i / n, y + h, 'gr');
    s += line(x, y + h / 2, x + w, y + h / 2, 'gr');
    return s;
  }

  // Cong trinh nhieu tang: moi tang [rong, cao, kieu mai]
  var SHAPES = {
    house: [[56, 24, 'gable']],
    hall: [[72, 26, 'curve']],
    tower: [[36, 24, 'curve'], [28, 20, 'curve']],
    store: [[44, 30, 'gable']],
    shrine: [[60, 24, 'gable']],
    castle: [[48, 18, 'curve'], [38, 16, 'curve'], [26, 14, 'curve']],
    pagoda: [[40, 14, 'curve'], [33, 13, 'curve'], [26, 12, 'curve']]
  };
  function tiered(type, lv, R) {
    var tiers = SHAPES[type], cx = 50, base = 92, out = { l1: '', l2: '', l3: '', l4: '', l5: '', l6: '' };
    var wob = 1 + (R() - 0.5) * 0.12, y = base - (type === 'castle' ? 14 : 5);
    out.l1 += type === 'castle' ? path('M' + (cx - 34) + ' ' + base + 'L' + (cx - 27) + ' ' + (base - 14) + 'L' + (cx + 27) + ' ' + (base - 14) + 'L' + (cx + 34) + ' ' + base + 'Z', 'st')
      : rect(cx - tiers[0][0] * wob / 2 - 3, base - 5, tiers[0][0] * wob + 6, 5, 'st');
    for (var i = 0; i < tiers.length; i++) {
      var w = tiers[i][0] * wob, hh = tiers[i][1], x = cx - w / 2, top = y - hh;
      out.l1 += i === 0 ? line(x + 3, y, x + 3, y - 6, 'wd') + line(x + w - 3, y, x + w - 3, y - 6, 'wd') : '';
      out.l2 += line(x + 3, y, x + 3, top, 'wd') + line(x + w - 3, y, x + w - 3, top, 'wd') + line(x + w / 2, y, x + w / 2, top, 'wd') + line(x, top, x + w, top, 'wd');
      out.l3 += type === 'store' ? rect(x + 3, top, w - 6, hh, 'wl') + rect(x + 3, y - 7, w - 6, 7, 'ink') + rect(cx - 5, y - 15, 10, 15, 'dr')
        : shoji(x + 3, top + 2, w - 6, hh - 2);
      var rh = type === 'pagoda' ? 9 : hh * 0.75 + 6;
      out.l4 += roof(cx, top + 2, w + 14, rh, tiers[i][2]);
      out.l5 += line(x + 3, y, x + 3, top + 2, 'ac') + line(x + w - 3, y, x + w - 3, top + 2, 'ac');
      y = top + 2 - rh * 0.55;
    }
    if (type === 'shrine') out.l4 += line(cx - 22, y + 2, cx - 14, y - 8, 'wdk') + line(cx + 22, y + 2, cx + 14, y - 8, 'wdk');
    if (type === 'pagoda') out.l4 += line(cx, y + 4, cx, y - 14, 'wdk');
    out.l5 += circle(cx + tiers[0][0] * wob / 2 + 2, base - 18, 3.2, 'lan');
    out.l6 += circle(cx - 6, y + 1, 2, 'gd') + circle(cx + 6, y + 1, 2, 'gd') + line(cx + 18, y + 8, cx + 18, y - 16, 'wdk') + path('M' + (cx + 18) + ' ' + (y - 16) + 'l10 3l-10 3z', 'flag');
    return out;
  }
  function special(type, lv, R) {
    var o = { l1: '', l2: '', l3: '', l4: '', l5: '', l6: '' }, b = 92;
    if (type === 'gate' || type === 'torii') {
      var tor = type === 'torii';
      o.l1 = rect(26, b - 4, 10, 4, 'st') + rect(64, b - 4, 10, 4, 'st');
      o.l2 = line(31, b - 4, 31, b - 52, tor ? 'wdx' : 'wdx') + line(69, b - 4, 69, b - 52, 'wdx');
      o.l3 = tor ? line(24, b - 40, 76, b - 40, 'wdx') : rect(34, b - 44, 32, 40, 'dr') + line(50, b - 44, 50, b - 4, 'ink');
      o.l4 = tor ? path('M14 ' + (b - 50) + 'Q50 ' + (b - 56) + ' 86 ' + (b - 50) + 'L84 ' + (b - 56) + 'Q50 ' + (b - 62) + ' 16 ' + (b - 56) + 'Z', 'rfk') : roof(50, b - 50, 64, 16, 'curve');
      o.l5 = tor ? path('M31 ' + (b - 4) + 'V' + (b - 52) + 'M69 ' + (b - 4) + 'V' + (b - 52) + 'M24 ' + (b - 40) + 'H76', 'acx') : line(31, b - 4, 31, b - 50, 'acx') + line(69, b - 4, 69, b - 50, 'acx');
      o.l6 = circle(50, b - (tor ? 47 : 66), 3, 'gd');
    } else if (type === 'stall') {
      o.l1 = rect(22, b - 4, 56, 4, 'st');
      o.l2 = line(26, b - 4, 26, b - 38, 'wd') + line(74, b - 4, 74, b - 38, 'wd') + rect(24, b - 18, 52, 4, 'wd');
      o.l3 = rect(28, b - 14, 44, 10, 'wl');
      o.l4 = path('M18 ' + (b - 36) + 'L82 ' + (b - 36) + 'L76 ' + (b - 46) + 'L24 ' + (b - 46) + 'Z', 'rf') + path('M30 ' + (b - 36) + 'h12v8h-12zM44 ' + (b - 36) + 'h12v8h-12zM58 ' + (b - 36) + 'h12v8h-12z', 'noren');
      o.l5 = circle(22, b - 30, 3.4, 'lan') + circle(78, b - 30, 3.4, 'lan');
      o.l6 = circle(50, b - 48, 2.4, 'gd') + line(80, b - 46, 80, b - 64, 'wdk') + path('M80 ' + (b - 64) + 'l9 3l-9 3z', 'flag');
    } else if (type === 'bell' || type === 'pavilion') {
      o.l1 = rect(24, b - 6, 52, 6, 'st');
      o.l2 = line(30, b - 6, 30, b - 42, 'wd') + line(70, b - 6, 70, b - 42, 'wd') + line(28, b - 42, 72, b - 42, 'wd');
      o.l3 = type === 'bell' ? line(50, b - 42, 50, b - 36, 'ink') + path('M42 ' + (b - 16) + 'Q42 ' + (b - 36) + ' 50 ' + (b - 36) + 'Q58 ' + (b - 36) + ' 58 ' + (b - 16) + 'Z', 'bellc') : rect(30, b - 14, 40, 3, 'wd');
      o.l4 = roof(50, b - 40, 60, 20, 'curve');
      o.l5 = line(30, b - 6, 30, b - 40, 'ac') + line(70, b - 6, 70, b - 40, 'ac');
      o.l6 = circle(50, b - 62, 2.6, 'gd');
    } else {
      o.l1 = rect(14, b - 4, 8, 4, 'st') + rect(78, b - 4, 8, 4, 'st');
      o.l2 = path('M18 ' + (b - 4) + 'Q50 ' + (b - 40) + ' 82 ' + (b - 4), 'wdx');
      o.l3 = path('M18 ' + (b - 14) + 'Q50 ' + (b - 50) + ' 82 ' + (b - 14), 'wdx') + line(30, b - 12, 30, b - 26, 'wd') + line(50, b - 22, 50, b - 32, 'wd') + line(70, b - 12, 70, b - 26, 'wd');
      o.l4 = path('M16 ' + (b - 16) + 'Q50 ' + (b - 54) + ' 84 ' + (b - 16), 'wdk');
      o.l5 = path('M18 ' + (b - 14) + 'Q50 ' + (b - 50) + ' 82 ' + (b - 14), 'acx');
      o.l6 = circle(18, b - 18, 2.5, 'gd') + circle(82, b - 18, 2.5, 'gd');
    }
    return o;
  }
  function mossLayer(m, R) {
    if (!m) return '';
    var s = '', i;
    for (i = 0; i < 2 + m * 2; i++) s += circle(18 + R() * 64, 88 + R() * 4, 2.5 + R() * 2.5, 'ms');
    if (m >= 2) {
      s += path('M' + r2(35 + R() * 10) + ' 70l3 6l-2 5l3 6', 'ck') + path('M' + r2(58 + R() * 10) + ' 60l-2 5l3 4', 'ck');
      for (i = 0; i < 3; i++) s += circle(25 + R() * 50, 40 + R() * 20, 2 + R() * 2, 'ms');
    }
    if (m >= 3) s += path('M24 92q4-12-2-22q6-10 0-22M76 92q-5-10 1-20q-4-10 2-18', 'vine');
    return grp('moss', s);
  }

  function inner(type, lv, m, opts) {
    var R = rnd((opts.seed || 1) * 7 + 3), parts = SHAPES[type] ? tiered(type, lv, R) : special(type, lv, R), s = '';
    var top = opts.blueprint ? 4 : lv;
    for (var i = 1; i <= Math.min(top, 6); i++) s += grp('L' + i + (opts.grow && i === top ? ' grow' : ''), parts['l' + i]);
    if (!opts.blueprint) s += mossLayer(m, R);
    return s;
  }
  function building(type, lv, m, opts) {
    opts = opts || {};
    return '<svg class="gb' + (opts.blueprint ? ' bp' : ' lv' + lv) + (opts.cls ? ' ' + opts.cls : '') + '" viewBox="0 0 100 100" aria-hidden="true">' + inner(type, lv, m, opts) + '</svg>';
  }

  var BACK = {
    city: function () { return path('M0 182L40 182L40 170L70 170L70 176L110 176L110 164L150 164L150 178L210 178L210 168L240 160L270 168L270 182L340 182L340 172L380 172L380 166L420 166L420 180L480 180L480 170L520 162L560 170L560 182L620 182L620 174L670 174L670 168L720 168L720 180L800 180L800 214L0 214Z', 'far'); },
    mount: function () { return path('M0 200L90 120L150 170L240 92L330 180L420 120L520 186L600 110L700 176L800 130L800 214L0 214Z', 'far') + path('M222 108L240 92L258 108L248 104L240 110L232 104Z', 'snowcap') + path('M584 124L600 110L616 124L606 120L600 126L594 120Z', 'snowcap'); },
    sea: function () { return rect(0, 170, 800, 44, 'sea') + path('M20 186q15-6 30 0t30 0M200 196q15-6 30 0t30 0M420 184q15-6 30 0t30 0M620 194q15-6 30 0t30 0', 'wave') + path('M660 168l18-8l18 8z', 'sail'); },
    snow: function () { return path('M0 190Q120 150 240 184T480 176T800 168L800 214L0 214Z', 'snowhill') + circle(120, 60, 2, 'flake') + circle(300, 40, 2.5, 'flake') + circle(520, 70, 2, 'flake') + circle(700, 50, 2.5, 'flake'); }
  };
  function scene(list, opts) {
    var w = 800, gy = 232, n = list.length, s = '', i;
    var bg = opts.blueprint ? '' : '<defs><linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sky1"/><stop offset="1" class="sky2"/></linearGradient></defs>' +
      rect(0, 0, w, 260, 'sky') + circle(690, 58, 26, 'sun') + (BACK[opts.backdrop] || BACK.city)() + path('M0 214Q200 204 400 212T800 210L800 260L0 260Z', 'ground');
    if (opts.blueprint) { for (i = 0; i <= 16; i++) s += line(i * 50, 0, i * 50, 260, 'grid'); for (i = 0; i <= 5; i++) s += line(0, i * 52, w, i * 52, 'grid'); }
    var slot = w / n, order = [];
    for (i = 0; i < n; i++) order.push(i);
    var items = '';
    for (i = 0; i < n; i++) {
      var it = list[i], big = i === Math.floor((n - 1) / 2), size = big ? 190 : 150 - (n > 5 ? 20 : 0);
      var x = slot * i + slot / 2 - size / 2, y = gy - size * 0.92;
      var b = building(it.type, it.lv, it.moss, { seed: it.pid, blueprint: opts.blueprint, grow: it.grow }).replace('<svg ', '<svg x="' + r2(x) + '" y="' + r2(y) + '" width="' + size + '" height="' + size + '" ');
      items += opts.link ? '<a href="#/grammar/p/' + it.pid + '">' + b + '</a>' : b;
    }
    var life = '';
    if (!opts.blueprint) {
      life = '<g class="walker w1"><circle cx="0" cy="226" r="3.5"/><path d="M-4 240L0 229L4 240Z"/></g><g class="walker w2"><circle cx="0" cy="230" r="3"/><path d="M-3.5 242L0 233L3.5 242Z"/></g>' +
        '<g class="smoke"><circle cx="' + r2(slot / 2 + 10) + '" cy="150" r="5"/><circle cx="' + r2(slot / 2 + 14) + '" cy="136" r="7"/></g>';
    }
    return '<svg class="gscene ' + (opts.blueprint ? 'bp' : 'bk-' + opts.backdrop) + '" viewBox="0 0 800 260" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' + bg + s +
      (opts.title ? '<text class="gtitle" x="20" y="44">' + opts.title + '</text>' : '') + items + life + '</svg>';
  }

  function wall(rows) {
    var s = '', show = Math.min(rows, 12), bw = 30, bh = 9;
    for (var r = 0; r < show; r++) {
      var y = 112 - (r + 1) * bh, off = r % 2 ? bw / 2 : 0;
      for (var x = -off; x < 300; x += bw) s += rect(Math.max(0, x) + 0.6, y + 0.6, Math.min(bw, 300 - Math.max(0, x)) - 1.2, bh - 1.2, 'brick' + (r === show - 1 ? ' grow' : ''));
    }
    return '<svg class="gwall-svg" viewBox="0 0 300 116" aria-hidden="true">' + rect(0, 112, 300, 4, 'st') + s + (rows > 12 ? '<text x="150" y="16" class="gwall-n">+' + (rows - 12) + '</text>' : '') + '</svg>';
  }

  // Ky quan: so tang da xay 0..5 (mac dinh 5)
  function wonder(type, floors) {
    if (floors === undefined) floors = 5;
    var s = '', tiers = { pagoda5: 5, kinkaku: 3, himeji: 4, daibutsu: 2, kiyomizu: 2, phoenix: 2, shuri: 2, torii: 1 }[type] || 3;
    var built = Math.ceil(floors * tiers / 5), base = 94, cx = 50, y = base;
    var cls = type === 'kinkaku' ? ' gold' : type === 'shuri' || type === 'torii' ? ' red' : '';
    if (type === 'torii') {
      s += path('M8 ' + base + 'q20-6 42 0t42 0', 'wave');
      if (floors >= 2) s += line(32, base - 2, 32, base - 50, 'acx') + line(68, base - 2, 68, base - 50, 'acx');
      if (floors >= 3) s += line(24, base - 38, 76, base - 38, 'acx');
      if (floors >= 4) s += path('M12 ' + (base - 48) + 'Q50 ' + (base - 56) + ' 88 ' + (base - 48) + 'L86 ' + (base - 54) + 'Q50 ' + (base - 62) + ' 14 ' + (base - 54) + 'Z', 'rfk');
      if (floors >= 5) s += circle(50, base - 46, 2.6, 'gd');
    } else {
      if (type === 'himeji' || type === 'shuri') { s += path('M14 ' + base + 'L22 ' + (base - 12) + 'L78 ' + (base - 12) + 'L86 ' + base + 'Z', 'st'); y = base - 12; }
      if (type === 'kiyomizu') { for (var k = 0; k < 6; k++) s += line(18 + k * 13, base, 18 + k * 13, base - 16, 'wd'); s += line(14, base - 16, 86, base - 16, 'wd'); y = base - 16; }
      for (var i = 0; i < tiers; i++) {
        var w = (type === 'daibutsu' || type === 'phoenix' ? 74 : 56) * (1 - i * (type === 'pagoda5' ? 0.12 : 0.18)), hh = type === 'pagoda5' ? 9 : 16, x = cx - w / 2;
        if (i < built) {
          s += shoji(x + 3, y - hh, w - 6, hh) + roof(cx, y - hh + 2, w + 12, type === 'pagoda5' ? 7 : 12, 'curve');
        } else s += rect(x + 3, y - hh, w - 6, hh, 'scaf') + line(x + 3, y - hh, x + w - 3, y, 'scaf') + line(x + w - 3, y - hh, x + 3, y, 'scaf');
        y -= hh + (type === 'pagoda5' ? 4 : 8);
      }
      if (type === 'phoenix' && floors >= 5) s += roof(18, base - 18, 26, 9, 'curve') + roof(82, base - 18, 26, 9, 'curve');
      if (floors >= 5) s += line(cx, y + 6, cx, y - 6, 'wdk') + circle(cx, y - 7, 2.2, 'gd');
    }
    return '<svg class="gb gw' + cls + '" viewBox="0 0 100 100" aria-hidden="true">' + s + '</svg>';
  }

  window.GScene = { building: building, scene: scene, wall: wall, wonder: wonder };
})();
