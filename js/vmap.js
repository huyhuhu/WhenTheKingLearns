// Ban do Nhat Ban cua muc Tu vung: ve SVG, phong to, keo, cham chon vung.
(function () {
  'use strict';
  var App = window.App, M = window.MAP_JAPAN;
  if (!M) return;
  var view = null, onTap = null, frame = 0, lastSvg = null, lastK = 0;
  var LABEL_MAX = 22, LABEL_FS = 52, GOLD = '#d4a017';
  var TINT = { war: 0.3, held: 0.55, annex: 0.85, peace: 0.85 };

  function full() { return [0, 0, M.w, M.h]; }
  function zoomed() { return view && view[2] < M.w - 1; }
  function clampView(v) {
    var w = Math.min(M.w, Math.max(M.w / 6, v[2])), h = w * M.h / M.w;
    return [Math.min(M.w - w, Math.max(0, v[0])), Math.min(M.h - h, Math.max(0, v[1])), w, h];
  }
  function apply() {
    var svg = document.getElementById('vMap');
    if (!svg) return;
    svg.setAttribute('viewBox', view.join(' '));
    // Chu lon dan theo do phong to den LABEL_MAX px tren man hinh roi giu nguyen
    var ppu = svg.getBoundingClientRect().width / view[2], k = Math.min(1, LABEL_MAX / (LABEL_FS * ppu));
    var cls = 'vmap' + (view[2] < M.w / 1.7 ? ' z2' : ''), ta = zoomed() ? 'none' : 'pan-y';
    if (svg.getAttribute('class') !== cls) svg.setAttribute('class', cls);
    if (svg.style.touchAction !== ta) svg.style.touchAction = ta;
    // Keo ngang khong doi ti le thi khong can dat lai nhan, tranh ve lai thua
    if (svg === lastSvg && k === lastK) return;
    lastSvg = svg; lastK = k;
    var labs = svg.querySelectorAll('.vlab');
    for (var i = 0; i < labs.length; i++) {
      var x = labs[i].getAttribute('data-x'), y = labs[i].getAttribute('data-y');
      labs[i].setAttribute('transform', k < 1 ? 'translate(' + x + ' ' + y + ') scale(' + k.toFixed(3) + ') translate(' + -x + ' ' + -y + ')' : '');
    }
  }
  function schedule() {
    if (frame) return;
    var raf = window.requestAnimationFrame || function (f) { return setTimeout(f, 16); };
    frame = raf(function () { frame = 0; apply(); });
  }
  function zoomAt(f, cx, cy) {
    var svg = document.getElementById('vMap');
    if (!svg) return;
    var r = svg.getBoundingClientRect(), fx = (cx - r.left) / r.width, fy = (cy - r.top) / r.height;
    var px = view[0] + fx * view[2], py = view[1] + fy * view[3], w = view[2] / f, h = w * M.h / M.w;
    view = clampView([px - fx * w, py - fy * h, w, h]);
    schedule();
  }
  function panBy(dx, dy) {
    var svg = document.getElementById('vMap');
    if (!svg) return;
    var s = view[2] / svg.getBoundingClientRect().width;
    view = clampView([view[0] - dx * s, view[1] - dy * s, view[2], view[3]]);
    schedule();
  }
  function regionAt(x, y) {
    var el = document.elementFromPoint(x, y);
    while (el && el.getAttribute) {
      var r = el.getAttribute('data-r');
      if (r) return parseInt(r, 10);
      el = el.parentNode;
    }
    return 0;
  }

  var passive = false;
  try { window.addEventListener('test', null, Object.defineProperty({}, 'passive', { get: function () { passive = true; return true; } })); } catch (e) { /* trinh duyet cu */ }
  var opt = passive ? { passive: false } : false;

  var down = null, mouseMoved = false;
  window.addEventListener('mousemove', function (e) {
    if (!down || !document.getElementById('vMap')) return;
    if (Math.abs(e.clientX - down[0]) + Math.abs(e.clientY - down[1]) > 4) mouseMoved = true;
    if (mouseMoved) { panBy(e.clientX - down[0], e.clientY - down[1]); down = [e.clientX, e.clientY]; }
  });
  window.addEventListener('mouseup', function (e) {
    if (down && !mouseMoved && onTap && document.getElementById('vMap')) {
      var n = regionAt(e.clientX, e.clientY);
      if (n) onTap(n);
    }
    down = null;
  });

  function bind(tap) {
    var svg = document.getElementById('vMap');
    if (!svg) return;
    onTap = tap;
    if (!view) view = full();
    apply();
    var t0 = null, last = null, moved = false, dist = 0;
    function pts(e) { var out = []; for (var i = 0; i < e.touches.length; i++) out.push([e.touches[i].clientX, e.touches[i].clientY]); return out; }
    function gap(p) { return Math.sqrt(Math.pow(p[0][0] - p[1][0], 2) + Math.pow(p[0][1] - p[1][1], 2)); }
    svg.addEventListener('touchstart', function (e) {
      var p = pts(e);
      t0 = p[0]; last = p; moved = p.length > 1;
      if (p.length > 1) dist = gap(p);
    }, opt);
    svg.addEventListener('touchmove', function (e) {
      var p = pts(e);
      if (!last) return;
      if (p.length > 1 && last.length > 1) {
        e.preventDefault();
        var d = gap(p);
        if (dist) zoomAt(d / dist, (p[0][0] + p[1][0]) / 2, (p[0][1] + p[1][1]) / 2);
        dist = d; moved = true;
      } else if (p.length === 1 && zoomed()) {
        e.preventDefault();
        panBy(p[0][0] - last[0][0], p[0][1] - last[0][1]);
      }
      if (Math.abs(p[0][0] - t0[0]) + Math.abs(p[0][1] - t0[1]) > 8) moved = true;
      last = p;
      if (p.length < 2) dist = 0;
    }, opt);
    svg.addEventListener('touchend', function (e) {
      if (!e.touches.length) {
        if (!moved && t0 && onTap) {
          var n = regionAt(t0[0], t0[1]);
          if (n) { e.preventDefault(); onTap(n); }
        }
        last = null;
      } else { last = pts(e); dist = last.length > 1 ? gap(last) : 0; }
    }, opt);

    svg.addEventListener('mousedown', function (e) { down = [e.clientX, e.clientY]; mouseMoved = false; e.preventDefault(); });
    // Lan chuot chi phong to khi giu Ctrl hoac da phong to, de khong chan cuon trang
    svg.addEventListener('wheel', function (e) {
      if (!e.ctrlKey && !zoomed()) return;
      e.preventDefault();
      zoomAt(e.deltaY < 0 ? 1.25 : 0.8, e.clientX, e.clientY);
    }, opt);
  }

  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(a, b, t) {
    var x = hex(a), y = hex(b), out = '#';
    for (var i = 0; i < 3; i++) { var v = Math.round(x[i] * t + y[i] * (1 - t)); out += (v < 16 ? '0' : '') + v.toString(16); }
    return out;
  }

  // Trang thai chi the hien bang mau: dam dan theo mau an tin, Thai binh mau vang
  function fills() {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    var land = dark ? '#3b362e' : '#efe5cf', seal = App.hanko().bg;
    var out = { wild: '' };
    for (var st in TINT) out[st] = mix(st === 'peace' ? GOLD : seal, land, TINT[st]);
    return out;
  }

  // lands[i] = { st, due, kanji, name }; opts = { sel, locked }
  function svg(lands, opts) {
    var h = App.h, F = fills();
    var i, s = '', regions = '', fog = '', labels = '', selLab = '', clips = '', peace = '', siege = '', tints = '', seal = App.hanko().bg;
    var r = 40, sea = '<pattern id="vSea" width="' + 2 * r + '" height="' + r + '" patternUnits="userSpaceOnUse">';
    [[0, 0], [2 * r, 0], [r, r / 2], [0, r], [2 * r, r]].forEach(function (c) {
      sea += '<g class="wave">';
      for (var k = 4; k >= 1; k--) sea += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + (r * k / 4 - 1) + '"/>';
      sea += '</g>';
    });
    sea += '</pattern><pattern id="vFog" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><path class="fogline" d="M0 0V22"/></pattern>' +
      '<pattern id="vSiege" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><path class="siegeline" d="M0 0V26"/></pattern>';

    for (i = 0; i < M.regions.length; i++) {
      var g = M.regions[i], L = lands[i], n = i + 1, st = opts.locked ? 'wild' : L.st;
      var fill = F[st];
      regions += '<path class="vr st-' + st + (fill ? ' tint' : '') + '" data-r="' + n + '" d="' + g.d + '"' + (fill ? ' style="--f:' + fill + '"' : '') + '/>';
      // Ghi thang d, khong dung <use>: Chrome 140 Android ve sai lop dia hinh
      clips += g.d;
      if (st === 'wild') fog += '<path class="vfog" d="' + g.d + '"/>';
      // Lop mau mong tren anh dia hinh, de cac muc van tach ro khi dia hinh lam toi mau
      else if (fill) tints += '<path class="vtint" d="' + g.d + '" style="fill:' + (st === 'peace' ? GOLD : seal) + ';fill-opacity:' + (TINT[st] * 0.6).toFixed(2) + '"/>';
      if (st === 'peace') peace += '<path class="vpeace" d="' + g.d + '"/>';
      if (opts.locked) continue;
      if (L.due) siege += '<path class="vsiegefill" d="' + g.d + '"/>';
      var chars = L.kanji.split(''), fs = chars.length > 2 ? 44 : 52, y0 = g.y - (chars.length - 1) * fs / 2;
      var lab = '<g class="vlab' + (opts.sel === n ? ' on' : opts.sel ? ' dim' : '') + '" data-r="' + n + '" data-x="' + g.x + '" data-y="' + g.y + '">';
      for (var c = 0; c < chars.length; c++) lab += '<text class="vk" x="' + g.x + '" y="' + (y0 + c * fs + fs * 0.36) + '" style="font-size:' + fs + 'px">' + chars[c] + '</text>';
      lab += '<text class="vn" x="' + g.x + '" y="' + (y0 + chars.length * fs + 8) + '">' + h(L.name) + '</text></g>';
      if (opts.sel === n) selLab = lab; else labels += lab;
    }
    labels += selLab;
    var sel = '';
    if (opts.sel && !opts.locked) {
      // Lop phu khoet lo dung vung dang chon (evenodd) de lam mo moi vung khac
      sel = '<path class="vdim" fill-rule="evenodd" d="M0 0H' + M.w + 'V' + M.h + 'H0Z' + M.regions[opts.sel - 1].d + '"/>' +
        '<path class="vsel" d="' + M.regions[opts.sel - 1].d + '"/>';
    }
    var ins = M.inset;
    var tx = 520, ty = 470;
    var title = '<g class="vtitle"><rect x="' + (tx - 46) + '" y="' + (ty - 50) + '" width="92" height="420" rx="4"/><rect class="in" x="' + (tx - 38) + '" y="' + (ty - 42) + '" width="76" height="404" rx="2"/>';
    var tt = '大日本国全図'.split('');
    for (i = 0; i < tt.length; i++) title += '<text x="' + tx + '" y="' + (ty + 14 + i * 62) + '">' + tt[i] + '</text>';
    title += '</g>';
    var cx = 1720, cy = 1330, cr = 92;
    var compass = '<g class="vcomp"><circle cx="' + cx + '" cy="' + cy + '" r="' + cr + '"/><circle class="in" cx="' + cx + '" cy="' + cy + '" r="' + (cr - 14) + '"/>' +
      '<path class="needle" d="M' + cx + ' ' + (cy - cr + 18) + 'L' + (cx + 16) + ' ' + cy + 'L' + cx + ' ' + (cy + cr - 18) + 'L' + (cx - 16) + ' ' + cy + 'Z"/>' +
      '<path class="north" d="M' + cx + ' ' + (cy - cr + 18) + 'L' + (cx + 16) + ' ' + cy + 'L' + (cx - 16) + ' ' + cy + 'Z"/>' +
      '<text x="' + cx + '" y="' + (cy - cr - 14) + '">北</text><text x="' + cx + '" y="' + (cy + cr + 46) + '">南</text>' +
      '<text x="' + (cx + cr + 32) + '" y="' + (cy + 14) + '">東</text><text x="' + (cx - cr - 32) + '" y="' + (cy + 14) + '">西</text></g>';

    s += '<svg id="vMap" class="vmap" viewBox="0 0 ' + M.w + ' ' + M.h + '" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
      '<defs>' + sea + '<clipPath id="vLand"><path d="' + clips + M.wild + '"/></clipPath></defs>' +
      '<rect class="vsea" width="' + M.w + '" height="' + M.h + '"/><rect width="' + M.w + '" height="' + M.h + '" fill="url(#vSea)"/>' +
      '<rect class="vinset" x="' + ins[0] + '" y="' + ins[1] + '" width="' + ins[2] + '" height="' + ins[3] + '"/>' +
      '<path class="vother" d="' + M.others + '"/>' + regions + '<path class="vwild" d="' + M.wild + '"/>' +
      '<image class="vrelief" xlink:href="data/map-relief.webp?v=1" x="0" y="0" width="' + M.w + '" height="' + M.h + '" clip-path="url(#vLand)" preserveAspectRatio="none"/>' +
      fog + tints + siege + '<path class="vlake" d="' + M.lakes + '"/><path class="vriver" d="' + M.rivers + '"/><path class="vpref" d="' + M.prefs + '"/>' +
      '<path class="vborder" d="' + M.borders + '"/><path class="vcoast" d="' + M.coast + '"/>' + peace + sel + title + compass + labels + '</svg>';
    return s;
  }

  window.VocabMap = {
    svg: svg,
    bind: bind,
    fills: fills,
    zoom: function (f) {
      var el = document.getElementById('vMap');
      if (!el || !view) return;
      var r = el.getBoundingClientRect();
      zoomAt(f, r.left + r.width / 2, r.top + r.height / 2);
    },
    reset: function () { view = full(); schedule(); }
  };
})();
