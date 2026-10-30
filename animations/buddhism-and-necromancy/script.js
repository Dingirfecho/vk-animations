/* ───────────────────────────────────────────────────────────
   Buddhism and Necromancy — Vajrakula Motion
   One seekable master timeline (Web Animations API + a few
   deterministic per-frame functions), so the same source plays
   live in the browser and renders frame-by-frame to video:

     await page.evaluate(ms => vkTimeline.seek(ms), t)

   URL flags:  ?t=SECONDS  ?autoplay=0  ?loop  ?speed=1.25
               ?embed (no transport)  ?render (no transport, paused)
               ?static (the composed reduced-motion page)  ?motion
   ─────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var root = document.documentElement;
  var ANIM = root.classList.contains('anim');
  var Q = location.search;
  var flag = function (n) { return new RegExp('[?&]' + n + '(=|&|$)').test(Q); };
  var param = function (n, d) { var m = Q.match(new RegExp('[?&]' + n + '=([^&]*)')); return m ? decodeURIComponent(m[1]) : d; };
  if (flag('embed')) root.classList.add('embed');
  if (flag('render')) root.classList.add('render');

  var EASE = 'cubic-bezier(.22,.61,.36,1)';
  var clamp = function (x, a, b) { return Math.min(b, Math.max(a, x)); };
  var smooth = function (x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var stage = $('#stage');

  /* ═════════ language (en · es · pt) ═════════ */
  var LANGS = ['en', 'es', 'pt'];
  function pickLang() {
    var p = param('lang', '');
    if (LANGS.indexOf(p) > -1) return p;
    try { var s = localStorage.getItem('vk-lang'); if (LANGS.indexOf(s) > -1) return s; } catch (e) {}
    var nav = (navigator.languages || [navigator.language || 'en']);
    for (var i = 0; i < nav.length; i++) { var c = String(nav[i]).slice(0, 2).toLowerCase(); if (LANGS.indexOf(c) > -1) return c; }
    return 'en';
  }
  var LANG = pickLang();
  var DICT = (window.VK_I18N && window.VK_I18N[LANG]) || {};
  var tr = function (s) { return DICT[s] || s; };
  var normTxt = function (s) { return s.replace(/\s+/g, ' ').trim(); };
  function applyLang() {
    root.setAttribute('lang', LANG);
    var M = window.VK_I18N && window.VK_I18N.meta && window.VK_I18N.meta[LANG];
    if (M) {
      document.title = M.title;
      var d = $('meta[name="description"]'); if (d) d.setAttribute('content', M.desc);
      stage.setAttribute('aria-label', M.aria);
    }
    var btns = document.querySelectorAll('#langbar button');
    for (var b = 0; b < btns.length; b++) btns[b].setAttribute('aria-current', btns[b].getAttribute('data-l') === LANG ? 'true' : 'false');
    if (LANG === 'en') return;
    var done = [], all = stage.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i], tag = el.tagName.toLowerCase();
      if (tag === 'script' || tag === 'style' || tag === 'canvas' || tag === 'defs') continue;
      if (!stage.contains(el)) continue;
      var inside = false; for (var d2 = 0; d2 < done.length; d2++) if (done[d2].contains(el)) { inside = true; break; }
      if (inside) continue;
      var direct = false; for (var n = 0; n < el.childNodes.length; n++) if (el.childNodes[n].nodeType === 3 && el.childNodes[n].textContent.trim()) { direct = true; break; }
      if (!direct) continue;
      done.push(el);
      var key = normTxt(el.innerHTML), val = DICT[key];
      if (val) { if (el instanceof SVGElement) el.textContent = val.replace(/<[^>]+>/g, ''); else el.innerHTML = val; }
      else if (flag('i18ncheck')) console.warn('i18n missing [' + LANG + ']:', key);
    }
  }
  applyLang();
  Array.prototype.forEach.call(document.querySelectorAll('#langbar button'), function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var L = b.getAttribute('data-l'); if (L === LANG) return;
      try { localStorage.setItem('vk-lang', L); } catch (er) {}
      var q = Q.replace(/^\?/, '').split('&').filter(function (x) { return x && !/^(lang|t)=/.test(x); });
      q.push('lang=' + L);
      if (window.vkTimeline && window.vkTimeline.ready) q.push('t=' + Math.floor(window.vkTimeline.time / 1000));
      location.search = '?' + q.join('&');
    });
  });

  /* ═════════ figures built in JS ═════════ */
  var NS = 'http://www.w3.org/2000/svg';
  function mk(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var a in attrs) e.setAttribute(a, attrs[a]); if (parent) parent.appendChild(e); return e; }

  /* The debt: a living circle, and those who need feeding, bound to it by threads */
  var DEBT = { dead: [], thr: [] };
  function buildDebt() {
    var g = $('#debt'); if (!g) return;
    var pts = [[292, 56], [366, 92], [318, 134], [392, 170], [296, 200], [362, 242], [288, 262]], cx = 92, cy = 150, R = 46, r = 13;
    pts.forEach(function (p) {
      var a = Math.atan2(p[1] - cy, p[0] - cx), d = Math.hypot(p[0] - cx, p[1] - cy);
      var th = mk('line', { x1: (cx + Math.cos(a) * R).toFixed(1), y1: (cy + Math.sin(a) * R).toFixed(1), x2: (cx + Math.cos(a) * (d - r)).toFixed(1), y2: (cy + Math.sin(a) * (d - r)).toFixed(1), 'class': 'thread', pathLength: 1, 'stroke-width': 1, opacity: .75 }, g);
      var n = mk('circle', { cx: p[0], cy: p[1], r: r, 'class': 'ring dashed' }, g);
      DEBT.thr.push(th); DEBT.dead.push(n);
    });
  }

  /* The published page: lines of text on the left leaf */
  var LINES = [];
  function buildLines() {
    var g = $('#textlines'); if (!g) return;
    for (var i = 0; i < 8; i++) {
      var y = 46 + i * 21, end = 282 - (i === 2 ? 70 : i === 5 ? 40 : i === 7 ? 120 : 0);
      LINES.push(mk('path', { d: 'M48 ' + y + ' H' + end, 'class': 'tl', pathLength: 1 }, g));
    }
  }

  /* The twenty-four pīṭhas: a ring of points behind the charnel-ground chapter */
  function buildPitha() {
    var g = $('#pitha'); if (!g) return;
    for (var i = 0; i < 24; i++) {
      var a = i / 24 * Math.PI * 2 - Math.PI / 2;
      mk('circle', { cx: (100 + Math.cos(a) * 92).toFixed(2), cy: (100 + Math.sin(a) * 92).toFixed(2), r: 2.6, fill: '#ECE2CC' }, g);
    }
  }

  /* The stream: nothing that persists, nothing that travels. Deterministic in w (ms). */
  var STREAM = [];
  function buildStream() { for (var i = 0; i < 3; i++) { var p = document.getElementById('st' + i); if (p) STREAM.push(p); } }
  function renderStream(w) {
    for (var k = 0; k < STREAM.length; k++) {
      var d = '';
      for (var x = 0; x <= 400; x += 8) {
        var y = 38 + (k - 1) * 17 + Math.sin(x * .022 + w * .00045 * (1 + .15 * k) + k * 1.7) * (7 + k * 2) + Math.sin(x * .05 - w * .0003 + k) * 2.4;
        d += (x ? 'L' : 'M') + x + ' ' + y.toFixed(1);
      }
      STREAM[k].setAttribute('d', d);
    }
  }

  buildDebt(); buildLines(); buildPitha(); buildStream();

  /* ═════════ smoke · light (deterministic functions of time) ═════════ */
  var cv = $('#smoke'), ctx = cv.getContext('2d'), dpr = 1;
  var R0 = rng(7), motes = [], i0;
  for (i0 = 0; i0 < 30; i0++) motes.push({ k: 'w', x: R0(), y0: R0(), sp: .006 + R0() * .012, sway: .012 + R0() * .03, ph: R0() * 6.28, f: .08 + R0() * .2, r: 70 + R0() * 150, a: .018 + R0() * .032 });
  for (i0 = 0; i0 < 18; i0++) motes.push({ k: 's', x: R0(), y0: R0(), sp: .01 + R0() * .016, sway: .006 + R0() * .014, ph: R0() * 6.28, f: .2 + R0() * .5, r: 1.2 + R0() * 2.2, a: .25 + R0() * .35 });

  function uScale() {
    var w = innerWidth, h = innerHeight;
    return h >= w ? Math.min(w / 1080, h / 1920) * 1.45 : Math.min(w / 1920, h / 1080);
  }
  function sizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
  }
  function drawSmoke(ms) {
    var w = cv.width, h = cv.height, U = uScale() * dpr, ts = ms / 1000;
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < motes.length; i++) {
      var m = motes[i], p = ((m.y0 - ts * m.sp) % 1 + 1) % 1;
      var y = h * (1.1 - p * 1.2), x = w * (m.x + Math.sin(ts * m.f + m.ph) * m.sway), env = Math.sin(Math.PI * p);
      var r = m.r * U * (m.k === 'w' ? (.8 + .5 * p) : 1);
      if (m.k === 'w') {
        var g = ctx.createRadialGradient(x, y, 0, x, y, r), a = m.a * env;
        g.addColorStop(0, 'rgba(236,226,204,' + a.toFixed(4) + ')'); g.addColorStop(1, 'rgba(236,226,204,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
      } else {
        var tw = .55 + .45 * Math.sin(ts * m.f * 6 + m.ph), a2 = m.a * env * tw * .55;
        var g2 = ctx.createRadialGradient(x, y, 0, x, y, r * 5 * dpr);
        g2.addColorStop(0, 'rgba(184,144,42,' + a2.toFixed(4) + ')'); g2.addColorStop(1, 'rgba(184,144,42,0)');
        ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(x, y, r * 5 * dpr, 0, 6.2832); ctx.fill();
      }
    }
  }
  var ground = $('.ground'), flame = $('.mark.flame');
  function drawLight(ms) {
    var ts = ms / 1000;
    ground.style.setProperty('--gx', (50 + 9 * Math.sin(ts / 9)).toFixed(2) + '%');
    ground.style.setProperty('--gy', (-8 + 6 * Math.cos(ts / 11)).toFixed(2) + '%');
    var f = .5 + .5 * (Math.sin(ts * 3.1) * .5 + Math.sin(ts * 11.3 + 1) * .3 + Math.sin(ts * 28.7 + 2) * .2);
    ground.style.setProperty('--cf', f.toFixed(3));
    if (flame) flame.style.setProperty('--f', (.55 + .45 * f).toFixed(3));
  }

  sizeCanvas();

  /* ═════════ static, fully composed fallback ═════════ */
  if (!ANIM) {
    renderStream(9000);
    drawSmoke(37000);
    addEventListener('resize', function () { sizeCanvas(); drawSmoke(37000); });
    return;
  }

  /* ═════════ timeline engine ═════════ */
  var items = [];
  var V = function (o, y) { return { opacity: o, transform: 'translateY(' + (y || 0) + 'em)' }; };
  var O = function (o) { return { opacity: o }; };

  function track(el, stops) {
    if (!el) { console.warn('track: missing element'); return; }
    for (var q = 1; q < stops.length; q++) if (stops[q][0] < stops[q - 1][0]) { console.warn('track: stops out of order', stops); stops[q][0] = stops[q - 1][0]; }
    var t0 = stops[0][0], t1 = stops[stops.length - 1][0], span = (t1 - t0) || 1;
    if (!isFinite(t0) || !isFinite(t1)) { console.warn('track: bad time', el && (el.getAttribute('data-k') || el.id || el.tagName), stops[0][0], t1); return; }
    var kf = stops.map(function (s) { var o = {}; for (var k in s[1]) o[k] = s[1][k]; o.offset = (s[0] - t0) / span; o.easing = EASE; return o; });
    var a = el.animate(kf, { duration: span * 1000, fill: 'both' });
    a.pause(); a.currentTime = 0;
    items.push({ a: a, start: t0 * 1000, dur: span * 1000, c: 0 });
  }
  var rise = function (el, t, d, dy) { track(el, [[t, V(0, dy == null ? .28 : dy)], [t + (d || 1.6), V(1, 0)]]); };
  var fade = function (el, t, d) { track(el, [[t, O(0)], [t + (d || 1.4), O(1)]]); };
  var draw = function (el, t, d) { track(el, [[t, { clipPath: 'inset(0 100% 0 0)' }], [t + (d || 1.6), { clipPath: 'inset(0 0% 0 0)' }]]); };
  var vdraw = function (el, t, d) { track(el, [[t, { clipPath: 'inset(100% 0 0 0)' }], [t + (d || 1.6), { clipPath: 'inset(0% 0 0 0)' }]]); };
  var stroke = function (el, t, d) { track(el, [[t, { opacity: 0, strokeDashoffset: 1 }], [t + .2, { opacity: 1, strokeDashoffset: 1 }], [t + (d || 1.6), { opacity: 1, strokeDashoffset: 0 }]]); };
  var panel = function (el, tin, tout) {   // overlapping panels: opacity only
    var s = [[tin - .6, O(0)], [tin, O(1)]]; if (tout) { s.push([tout - 1, O(1)]); s.push([tout, O(0)]); }
    track(el, s);
  };
  function splitWords(el) {
    var out = [];
    (function walk(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(p));
            else { var s = document.createElement('span'); s.className = 'w'; s.style.display = 'inline-block'; s.textContent = p; frag.appendChild(s); out.push(s); }
          });
          c.parentNode.replaceChild(frag, c);
        } else if (c.nodeType === 1) walk(c);
      });
    })(el);
    return out;
  }
  var words = function (list, t, step, d) { list.forEach(function (w, i) { rise(w, t + i * step, d || 1.5, .22); }); };

  var chapters = [], cursor = 0;
  function scene(id, dur, o) {
    o = o || {};
    var el = document.getElementById(id), start = cursor, fin = o.fin || 1.4, fout = o.fout == null ? 1.2 : o.fout;
    var s = [[start, O(0)], [start + fin, O(1)]];
    if (fout) { s.push([start + dur - fout, O(1)]); s.push([start + dur, O(0)]); } else s.push([start + dur, O(1)]);
    track(el, s);
    chapters.push({ id: id, name: el.getAttribute('data-chapter') || id, start: start, end: start + dur });
    cursor += dur;
    return {
      t: function (x) { return start + x; }, start: start,
      k: function (key) { var e = el.querySelector('[data-k="' + key + '"]'); if (!e) console.warn('missing', id, key); return e; }
    };
  }


  /* ───────── 0 · TITLE (12s) ───────── */
  (function () {
    var S = scene('s-title', 12), T = S.t, k = S.k;
    rise(k('flame'), T(1.0), 1.8, .3);
    track(k('title'), [[T(1.8), { opacity: 0, filter: 'blur(.09em)', transform: 'translateY(.05em)' }], [T(4.9), { opacity: 1, filter: 'blur(0em)', transform: 'translateY(0em)' }]]);
    draw(k('taper'), T(5.1), 2.0);
    rise(k('sub'), T(5.8), 1.8);
    rise(k('tour'), T(7.2), 2.0);
    rise(k('credit'), T(9.2), 1.6);
  })();

  /* ───────── 1 · A NOTE ON CARE (15s) ───────── */
  (function () {
    var S = scene('s-care', 15), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    words(splitWords(k('a')), T(1.0), .22, 1.5);
    rise(k('b'), T(4.6), 2.0);
    fade(k('c'), T(8.0), 1.4);
    rise(k('d'), T(8.8), 2.4);
  })();

  /* ───────── 2 · THE PARADOX (18s) ───────── */
  (function () {
    var S = scene('s-paradox', 18), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    words(splitWords(k('a')), T(1.0), .2, 1.5);
    fade(k('c0'), T(2.0), 1.6);
    rise(k('b'), T(5.0), 2.4, .2);
    rise(k('attr'), T(11.0), 1.6);
    [1, 2, 3, 4].forEach(function (n, i) {
      fade(k('r' + n), T(6.0 + i * 1.8), 1.8);
      var dir = i % 2 ? -1 : 1;
      track(k('s' + n), [[T(5.0), { transform: 'rotate(0deg)' }], [T(18), { transform: 'rotate(' + (dir * (60 + i * 25)) + 'deg)' }]]);
    });
  })();

  /* ───────── 3 · THREE KINDS + THE VOTE (25s) ───────── */
  (function () {
    var S = scene('s-three', 25), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    track(k('pA'), [[T(.3), O(0)], [T(.9), O(1)], [T(14.2), O(1)], [T(15.2), O(0)]]);
    rise(k('h'), T(.8), 1.8);
    rise(k('i1'), T(2.8), 2.0, .25); rise(k('i2'), T(4.8), 2.0, .25); rise(k('i3'), T(6.8), 2.0, .25);
    rise(k('r'), T(9.8), 2.2);
    track(k('pB'), [[T(14.6), O(0)], [T(15.4), O(1)]]);
    fade(k('l'), T(15.8), 1.2);
    words(splitWords(k('q')), T(16.2), .2, 1.5);
    rise(k('v1'), T(19.0), 1.5); rise(k('v2'), T(19.9), 1.5); rise(k('v3'), T(20.8), 1.5);
    fade(k('n'), T(22.2), 1.4);
  })();

  /* ───────── 4 · WHO ARE WE TALKING TO? (20s) ───────── */
  var whoScene;
  (function () {
    var S = scene('s-who', 20), T = S.t, k = S.k; whoScene = S;
    fade(k('folio'), T(.6), 1.4);
    track(k('pQ'), [[T(.3), O(0)], [T(.9), O(1)], [T(7.2), O(1)], [T(8.2), O(0)]]);
    words(splitWords(k('q')), T(1.0), .18, 1.5);
    track(k('pC'), [[T(7.6), O(0)], [T(8.4), O(1)]]);
    rise(k('c1'), T(8.6), 2.0, .25);
    rise(k('c2'), T(12.6), 2.0, .25);
  })();

  /* ───────── 5 · THE DEAD ARE THERE (15s) ───────── */
  (function () {
    var S = scene('s-there', 15), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    words(splitWords(k('a')), T(1.0), .17, 1.5);
    rise(k('cA'), T(3.8), 2.0, .25);
    fade(k('mid'), T(7.0), 1.6);
    rise(k('cB'), T(8.2), 2.0, .25);
  })();

  /* ───────── 6 · SERVING THE DEAD (23s) ───────── */
  (function () {
    var S = scene('s-serving', 23), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    track(k('pA'), [[T(.3), O(0)], [T(.9), O(1)], [T(11.0), O(1)], [T(12.0), O(0)]]);
    words(splitWords(k('a')), T(1.0), .17, 1.5);
    rise(k('b'), T(4.2), 2.0); rise(k('c'), T(7.0), 2.0); rise(k('attr'), T(9.6), 1.4);
    fade(k('live'), T(1.6), 1.6); fade(k('livedot'), T(2.4), 1.2);
    DEBT.dead.forEach(function (n, i) { fade(n, T(5.0 + i * .4), 1.2); });
    DEBT.thr.forEach(function (th, i) { stroke(th, T(7.0 + i * .3), 1.6); });
    track(k('pB'), [[T(11.4), O(0)], [T(12.2), O(1)]]);
    words(splitWords(k('h')), T(12.6), .17, 1.5);
    rise(k('r1'), T(15.8), 2.0, .25); rise(k('r2'), T(19.0), 2.0, .25);
  })();

  /* ───────── 7 · THE BARDO THÖDOL (23s) ───────── */
  (function () {
    var S = scene('s-bardo', 23), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    track(k('pA'), [[T(.3), O(0)], [T(.9), O(1)], [T(12.4), O(1)], [T(13.4), O(0)]]);
    words(splitWords(k('h')), T(1.0), .15, 1.5);
    rise(k('i1'), T(3.6), 2.0, .25); rise(k('i2'), T(6.0), 2.0, .25); rise(k('i3'), T(8.4), 2.0, .25);
    track(k('pB'), [[T(12.8), O(0)], [T(13.6), O(1)]]);
    fade(k('lp'), T(14.0), 1.4);
    LINES.forEach(function (l, i) { stroke(l, T(14.4 + i * .22), 1.0); });
    fade(k('cl'), T(16.4), 1.2);
    fade(k('rp'), T(17.0), 1.4);
    stroke(k('frame'), T(17.4), 2.0);
    fade(k('cr'), T(18.6), 1.2);
    rise(k('r'), T(19.0), 2.2);
  })();

  /* ───────── 8 · WHAT THE LIVING OWE (15s) ───────── */
  (function () {
    var S = scene('s-owe', 15), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    words(splitWords(k('a')), T(1.0), .18, 1.5);
    rise(k('b'), T(3.8), 2.0);
    ['w1', 'w2', 'w3', 'w4', 'w5'].forEach(function (key, i) { rise(k(key), T(6.0 + i * 1.1), 1.6, .2); });
  })();

  /* ───────── 9 · THE CHARNEL GROUND (19s) ───────── */
  (function () {
    var S = scene('s-charnel', 19), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    track(k('bg'), [[T(0), { opacity: 0, transform: 'translate(-50%,-50%) rotate(0deg)' }], [T(3.0), { opacity: .12, transform: 'translate(-50%,-50%) rotate(4deg)' }], [T(19), { opacity: .12, transform: 'translate(-50%,-50%) rotate(30deg)' }]]);
    words(splitWords(k('a')), T(1.0), .17, 1.5);
    rise(k('i1'), T(3.6), 2.0, .25); rise(k('i2'), T(6.4), 2.0, .25); rise(k('i3'), T(9.2), 2.0, .25);
    fade(k('n'), T(12.6), 1.8);
  })();

  /* ───────── 10 · CHÖD (17s) ───────── */
  (function () {
    var S = scene('s-chod', 17), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    words(splitWords(k('a')), T(1.0), .17, 1.5);
    rise(k('cA'), T(3.4), 2.0, .25);
    track(k('take'), [[T(3.4), { transform: 'scale(1.35)' }], [T(7.0), { transform: 'scale(1)' }]]);
    fade(k('mid'), T(7.0), 1.4);
    rise(k('cB'), T(8.0), 2.0, .25);
    track(k('give'), [[T(8.0), { transform: 'scale(.78)' }], [T(13.0), { transform: 'scale(1.12)' }]]);
    fade(k('attr'), T(13.2), 1.4);
  })();

  /* ───────── 11 · THE VETĀLA (20s) ───────── */
  (function () {
    var S = scene('s-vetala', 20), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    track(k('pA'), [[T(.3), O(0)], [T(.9), O(1)], [T(9.6), O(1)], [T(10.6), O(0)]]);
    words(splitWords(k('a')), T(1.0), .17, 1.5);
    rise(k('b'), T(4.2), 2.0); rise(k('c'), T(7.0), 2.0);
    track(k('pB'), [[T(10.0), O(0)], [T(10.8), O(1)]]);
    fade(k('l'), T(11.2), 1.2);
    fade(k('leaf'), T(11.6), 1.4);
    stroke(k('frame'), T(12.0), 2.4);
    rise(k('r'), T(14.6), 2.4);
  })();

  /* ───────── 12 · THAILAND (17s) ───────── */
  (function () {
    var S = scene('s-thai', 17), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    track(k('pA'), [[T(.3), O(0)], [T(.9), O(1)], [T(7.8), O(1)], [T(8.8), O(0)]]);
    words(splitWords(k('a')), T(1.0), .17, 1.5);
    rise(k('b'), T(3.8), 2.0); rise(k('attr'), T(6.2), 1.4);
    track(k('pB'), [[T(8.2), O(0)], [T(9.0), O(1)]]);
    fade(k('l'), T(9.4), 1.2);
    rise(k('v'), T(10.0), 1.8);
    fade(k('ra'), T(10.8), 1.6); fade(k('ta'), T(11.2), 1.4);
    fade(k('rb'), T(11.8), 1.6); fade(k('tb'), T(12.2), 1.4);
    fade(k('lens'), T(13.0), 1.8);
    rise(k('n'), T(13.6), 1.8);
  })();

  /* ───────── 13 · BEINGS, NOT TOOLS (14s) ───────── */
  (function () {
    var S = scene('s-bodhi', 14), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    track(k('bg'), [[T(0), { opacity: 0, transform: 'translate(-50%,-50%) rotate(0deg)' }], [T(3.0), { opacity: .11, transform: 'translate(-50%,-50%) rotate(-6deg)' }], [T(14), { opacity: .11, transform: 'translate(-50%,-50%) rotate(-26deg)' }]]);
    words(splitWords(k('a')), T(1.0), .2, 1.5);
    rise(k('b'), T(4.0), 2.2);
    rise(k('attr'), T(7.6), 1.6);
  })();

  /* ───────── 14 · WHAT WOULD YOU ASK FIRST? (24s) ───────── */
  (function () {
    var S = scene('s-guard', 24), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    track(k('pA'), [[T(.3), O(0)], [T(.9), O(1)], [T(9.4), O(1)], [T(10.4), O(0)]]);
    fade(k('l'), T(.8), 1.2);
    rise(k('v'), T(1.4), 2.2);
    words(splitWords(k('q')), T(5.2), .2, 1.5);
    track(k('pB'), [[T(9.8), O(0)], [T(10.6), O(1)]]);
    words(splitWords(k('h')), T(11.0), .17, 1.5);
    ['f1', 'f2', 'f3', 'f4'].forEach(function (key, i) { rise(k(key), T(13.4 + i * 1.6), 1.8, .25); });
    rise(k('r'), T(20.0), 2.2);
  })();

  /* ───────── 15 · BACK TO THE VOTE (19s) ───────── */
  (function () {
    var S = scene('s-reveal', 19), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    track(k('pA'), [[T(.3), O(0)], [T(.9), O(1)], [T(6.4), O(1)], [T(7.4), O(0)]]);
    words(splitWords(k('a')), T(1.0), .2, 1.5);
    track(k('pB'), [[T(6.8), O(0)], [T(7.6), O(1)]]);
    fade(k('l'), T(8.0), 1.2);
    fade(k('w1'), T(8.8), 1.4); fade(k('t1'), T(9.0), 1.4);
    fade(k('w2'), T(9.8), 1.4); fade(k('t2'), T(10.0), 1.4);
    fade(k('w3'), T(10.8), 1.6); fade(k('t3'), T(11.0), 1.4);
    track(k('w3'), [[T(10.8), { transform: 'scale(.5)' }], [T(13.2), { transform: 'scale(1)' }]]);
    track(k('w3f'), [[T(10.8), { opacity: 0, transform: 'scale(.5)' }], [T(12.0), { opacity: 0, transform: 'scale(.5)' }], [T(14.0), { opacity: 1, transform: 'scale(1)' }]]);
    fade(k('w3d'), T(12.8), 1.2);
    rise(k('r'), T(14.2), 2.4);
  })();

  /* ───────── 16 · WITH A VOW (17s) ───────── */
  (function () {
    var S = scene('s-vow', 17), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    track(k('pA'), [[T(.3), O(0)], [T(.9), O(1)], [T(6.8), O(1)], [T(7.8), O(0)]]);
    words(splitWords(k('q')), T(1.0), .26, 1.6);
    track(k('pB'), [[T(7.2), O(0)], [T(8.0), O(1)]]);
    fade(k('l'), T(8.2), 1.2);
    ['s1', 's2', 's3', 's4'].forEach(function (key, i) { rise(k(key), T(9.0 + i * 1.5), 1.6, .2); });
  })();

  /* ───────── 17 · A BUDDHA LEAVES NO ONE BEHIND (26s, holds on the last frame) ───────── */
  (function () {
    var S = scene('s-close', 26, { fout: 0 }), T = S.t, k = S.k;
    words(splitWords(k('a')), T(1.2), .24, 1.6);
    rise(k('b'), T(5.0), 2.6);
    draw(k('taper'), T(8.6), 2.0);
    rise(k('end'), T(10.0), 1.8);
    rise(k('wm'), T(12.6), 1.8);
  })();

  var END = cursor;

  /* ═════════ playback ═════════ */
  var t = 0, playing = false, last = 0, speed = parseFloat(param('speed', '1')) || 1;
  var ctl = $('#controls'), btn = $('#btn-play'), bar = $('#bar'), timeEl = $('#time');
  var segs = chapters.map(function (c) {
    var b = document.createElement('button'); b.className = 'seg'; b.type = 'button';
    b.style.setProperty('--dur', (c.end - c.start).toFixed(2)); b.setAttribute('aria-label', c.name); b.title = c.name;
    b.innerHTML = '<i></i>'; b.addEventListener('click', function () { seek((c.start + .2) * 1000); });
    bar.appendChild(b); return b;
  });
  var mmss = function (s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); };

  function render() {
    var ts = t / 1000, i;
    for (i = 0; i < items.length; i++) {
      var it = items[i], c = clamp(t - it.start, 0, it.dur);
      if (c !== it.c) { it.a.currentTime = c; it.c = c; }
    }
    drawLight(t); drawSmoke(t);
    var wl = t - whoScene.start * 1000;
    if (wl > -1500 && wl < 22000) renderStream(wl);
    for (i = 0; i < chapters.length; i++) {
      var ch = chapters[i], p = clamp((ts - ch.start) / (ch.end - ch.start), 0, 1);
      segs[i].firstChild.style.width = (p * 100).toFixed(1) + '%';
      segs[i].classList.toggle('on', ts >= ch.start && ts < ch.end);
    }
    timeEl.textContent = mmss(ts) + ' / ' + mmss(END);
  }
  function state() { ctl.setAttribute('data-state', t >= END * 1000 ? 'ended' : playing ? 'playing' : 'paused'); }
  function tick(now) {
    if (!playing) return;
    var dt = Math.min(now - last, 100) * speed; last = now;
    t = Math.min(t + dt, END * 1000); render();
    if (t >= END * 1000) { playing = false; state(); if (flag('loop')) setTimeout(function () { seek(0); play(); }, 3500); return; }
    requestAnimationFrame(tick);
  }
  function play() { if (t >= END * 1000) t = 0; playing = true; last = performance.now(); state(); requestAnimationFrame(tick); bump(); }
  function pause() { playing = false; state(); bump(); }
  function seek(ms) { t = clamp(ms, 0, END * 1000); render(); state(); }
  function toggle() { playing ? pause() : play(); }
  function chapterIndex() { var ts = t / 1000; for (var i = chapters.length - 1; i >= 0; i--) if (ts >= chapters[i].start) return i; return 0; }
  function jump(dir) {
    var i = chapterIndex(), ts = t / 1000;
    if (dir < 0) i = (ts - chapters[i].start > 2.5) ? i : Math.max(0, i - 1); else i = Math.min(chapters.length - 1, i + 1);
    seek((chapters[i].start + .2) * 1000);
  }

  var idleTimer;
  function bump() { ctl.classList.remove('idle'); clearTimeout(idleTimer); if (playing) idleTimer = setTimeout(function () { ctl.classList.add('idle'); }, 3200); }
  btn.addEventListener('click', toggle);
  stage.addEventListener('click', toggle);
  ['pointermove', 'pointerdown', 'keydown', 'touchstart'].forEach(function (e) { addEventListener(e, bump, { passive: true }); });
  addEventListener('keydown', function (e) {
    if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle(); }
    else if (e.key === 'ArrowRight') jump(1); else if (e.key === 'ArrowLeft') jump(-1);
    else if (e.key === 'Home') seek(0); else if (e.key === 'End') seek(END * 1000 - 1);
    else if (e.key === 'f') { if (document.fullscreenElement) document.exitFullscreen(); else root.requestFullscreen && root.requestFullscreen(); }
  });
  addEventListener('resize', function () { sizeCanvas(); render(); });

  window.vkTimeline = {
    seek: seek, play: play, pause: pause, toggle: toggle,
    get duration() { return END * 1000; }, get time() { return t; },
    chapters: chapters.map(function (c) { return { id: c.id, name: c.name, start: c.start * 1000, end: c.end * 1000 }; }),
    ready: false
  };

  var start = function () {
    var t0 = parseFloat(param('t', '0')) || 0;
    seek(t0 * 1000);
    window.vkTimeline.ready = true;
    if (!flag('render') && param('autoplay', '1') !== '0') setTimeout(play, 500);
    else { ctl.setAttribute('data-state', 'paused'); }
  };
  render(); state();
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start, start);
})();
