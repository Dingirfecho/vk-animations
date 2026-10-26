/* ───────────────────────────────────────────────────────────
   Buddhism & Politics — Vajrakula Motion
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

  /* The assembly: eight points that gather in harmony, hold, and disperse in harmony */
  var ASM = [];
  function buildAssembly() {
    var g = $('#assembly'); if (!g) return;
    for (var i = 0; i < 8; i++) {
      var a = i / 8 * Math.PI * 2 - Math.PI / 2, x = 200 + Math.cos(a) * 118, y = 200 + Math.sin(a) * 118;
      var c = mk('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 11, 'class': 'node' }, g);
      var o = (i % 2 ? 1.0 : .7) * 78, tw = (i % 3 - 1) * 16;
      c._off = [Math.cos(a) * o - Math.sin(a) * tw, Math.sin(a) * o + Math.cos(a) * tw];
      ASM.push(c);
    }
  }

  /* The tether: a centre that tries to stand apart, and the web that will not let it go.
     Drawn per frame (deterministic in w = ms since the scene began). */
  var TH = { built: false, nodes: [], spokes: [], rim: [] };
  var TH_T = { out: 8000, outLen: 3200, back: 13200, backLen: 3400 };
  function buildTether() {
    var svg = $('#tether'); if (!svg) return;
    var R = rng(5), N = 9, i, cx = 400, cy = 262;
    var labels = { 0: tr('Politics'), 3: tr('Power'), 6: tr('Rulers') };
    var gE = mk('g', {}, svg), gN = mk('g', {}, svg), gT = mk('g', {}, svg);
    for (i = 0; i < N; i++) {
      var a = i / N * Math.PI * 2 - .9 + (R() - .5) * .25, rx = 285 + R() * 45, ry = 175 + R() * 30;
      var n = { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry, ap: 3000 + i * 380, ph: R() * 6.28, fq: .0004 + R() * .0004 };
      n.rest = Math.hypot(n.x - cx, n.y - cy);
      TH.nodes.push(n);
    }
    TH.nodes.forEach(function (n, i) {
      n.spoke = mk('line', { stroke: '#ECE2CC', 'stroke-width': 1, opacity: 0 }, gE);
      n.rimEdge = mk('line', { stroke: '#ECE2CC', 'stroke-width': 1, opacity: 0 }, gE);
      n.el = mk('circle', { r: 4.6, fill: '#0E1525', stroke: '#ECE2CC', 'stroke-width': 1.3, opacity: 0 }, gN);
      if (labels[i]) { n.lab = mk('text', { 'class': 'svg-cap sm knock', 'text-anchor': 'middle', opacity: 0 }, gT); n.lab.textContent = labels[i]; n.up = n.y < cy; }
    });
    TH.c = mk('circle', { r: 15, fill: '#0E1525', stroke: '#B8902A', 'stroke-width': 1.6, opacity: 0 }, gN);
    TH.cd = mk('circle', { r: 4, fill: '#B8902A', opacity: 0 }, gN);
    TH.cl = mk('text', { 'class': 'svg-cap knock', 'text-anchor': 'middle', opacity: 0 }, gT); TH.cl.textContent = tr('Buddhism');
    TH.built = true;
  }
  function renderTether(w) {
    if (!TH.built) return;
    var out = smooth((w - TH_T.out) / TH_T.outLen), back = smooth((w - TH_T.back) / TH_T.backLen), m = out * (1 - back);
    var dx = 150 * m, dy = -26 * m, c = { x: 400 + dx, y: 262 + dy }, N = TH.nodes.length;
    var cap = smooth((w - 1800) / 1100);
    var pos = TH.nodes.map(function (n) {
      return { x: n.x + Math.sin(w * n.fq + n.ph) * 5 + dx * .16 * m, y: n.y + Math.cos(w * n.fq * 1.3 + n.ph) * 5 + dy * .16 * m };
    });
    TH.nodes.forEach(function (n, i) {
      var p = pos[i], ap = smooth((w - n.ap) / 900), q = pos[(i + 1) % N], an = smooth((w - TH.nodes[(i + 1) % N].ap) / 900);
      n.el.setAttribute('cx', p.x.toFixed(1)); n.el.setAttribute('cy', p.y.toFixed(1)); n.el.setAttribute('opacity', ap.toFixed(3));
      var stretch = clamp((Math.hypot(p.x - c.x, p.y - c.y) / n.rest - 1) / .45, 0, 1);
      n.spoke.setAttribute('x1', c.x.toFixed(1)); n.spoke.setAttribute('y1', c.y.toFixed(1)); n.spoke.setAttribute('x2', p.x.toFixed(1)); n.spoke.setAttribute('y2', p.y.toFixed(1));
      n.spoke.setAttribute('opacity', (Math.min(ap, cap) * (.2 + .5 * stretch)).toFixed(3));
      n.rimEdge.setAttribute('x1', p.x.toFixed(1)); n.rimEdge.setAttribute('y1', p.y.toFixed(1)); n.rimEdge.setAttribute('x2', q.x.toFixed(1)); n.rimEdge.setAttribute('y2', q.y.toFixed(1));
      n.rimEdge.setAttribute('opacity', (Math.min(ap, an) * .13).toFixed(3));
      if (n.lab) { n.lab.setAttribute('x', p.x.toFixed(1)); n.lab.setAttribute('y', (p.y + (n.up ? -18 : 28)).toFixed(1)); n.lab.setAttribute('opacity', (ap * .9).toFixed(3)); }
    });
    TH.c.setAttribute('cx', c.x.toFixed(1)); TH.c.setAttribute('cy', c.y.toFixed(1)); TH.c.setAttribute('opacity', cap.toFixed(3));
    TH.cd.setAttribute('cx', c.x.toFixed(1)); TH.cd.setAttribute('cy', c.y.toFixed(1)); TH.cd.setAttribute('opacity', cap.toFixed(3));
    TH.cl.setAttribute('x', c.x.toFixed(1)); TH.cl.setAttribute('y', (c.y + 40).toFixed(1)); TH.cl.setAttribute('opacity', (smooth((w - 2300) / 900) * .9).toFixed(3));
  }

  buildAssembly(); buildTether();

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
    renderTether(11000);
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


  /* ───────── 0 · TITLE (11s) ───────── */
  (function () {
    var S = scene('s-title', 11), T = S.t, k = S.k;
    rise(k('wheel'), T(1.0), 1.8, .3);
    track(k('title'), [[T(1.8), { opacity: 0, filter: 'blur(.09em)', transform: 'translateY(.05em)' }], [T(4.9), { opacity: 1, filter: 'blur(0em)', transform: 'translateY(0em)' }]]);
    draw(k('taper'), T(5.1), 2.0);
    rise(k('sub'), T(5.8), 1.8);
    rise(k('credit'), T(8.4), 1.6);
  })();

  /* ───────── 1 · WHAT I WAS TOLD (13s) ───────── */
  (function () {
    var S = scene('s-told', 13), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    words(splitWords(k('claim')), T(1.2), .2, 1.5);
    rise(k('atall'), T(7.6), 2.2);
  })();

  /* ───────── 2 · THE VAJJIANS (20s) ───────── */
  (function () {
    var S = scene('s-vajjian', 20), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    rise(k('l1'), T(1.0), 2.2, .2); rise(k('l2'), T(9.0), 2.0, .2); rise(k('attr'), T(12.6), 1.6);
    fade(k('a-ring'), T(1.2), 1.6);
    ASM.forEach(function (c, i) {
      var o = c._off, far = 'translate(' + o[0].toFixed(1) + 'px,' + o[1].toFixed(1) + 'px)', near = 'translate(' + (o[0] * .55).toFixed(1) + 'px,' + (o[1] * .55).toFixed(1) + 'px)', home = 'translate(0px,0px)';
      track(c, [[T(1.0 + i * .15), { opacity: 0, transform: far }], [T(2.4 + i * .15), { opacity: 1, transform: far }], [T(7.0), { opacity: 1, transform: home }], [T(14.5), { opacity: 1, transform: home }], [T(19.0), { opacity: 1, transform: near }]]);
    });
    fade(k('a-c'), T(7.2), 1.6);
  })();

  /* ───────── 3 · AND YET (18s) ───────── */
  (function () {
    var S = scene('s-shown', 18), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    rise(k('yet'), T(1.0), 2.2);
    words(splitWords(k('a')), T(3.4), .2, 1.5);
    rise(k('b'), T(9.0), 2.2);
  })();

  /* ───────── 4 · KŪṬADANTA (19s) ───────── */
  (function () {
    var S = scene('s-kutadanta', 19), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    track(k('bg'), [[T(0), { opacity: 0, transform: 'translate(-50%,-50%) rotate(0deg)' }], [T(3.0), { opacity: .11, transform: 'translate(-50%,-50%) rotate(6deg)' }], [T(19), { opacity: .11, transform: 'translate(-50%,-50%) rotate(34deg)' }]]);
    rise(k('l1'), T(1.0), 2.4, .2); rise(k('l2'), T(10.0), 2.0, .2); rise(k('attr'), T(13.0), 1.6);
  })();

  /* ───────── 5 · FIRST, HISTORY (22s) ───────── */
  (function () {
    var S = scene('s-history', 22), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    track(k('p1'), [[T(.3), O(0)], [T(.9), O(1)], [T(7.6), O(1)], [T(8.6), O(0)]]);
    words(splitWords(k('intro')), T(1.0), .2, 1.5);
    track(k('p2'), [[T(8.2), O(0)], [T(8.8), O(1)]]);
    words(splitWords(k('first')), T(9.2), .17, 1.4);
    stroke(k('t-line'), T(13.0), 2.4);
    fade(k('t-past'), T(13.0), 1.2); fade(k('t-now'), T(14.8), 1.2);
    rise(k('n1'), T(14.0), 1.6, .3); rise(k('n2'), T(15.8), 1.6, .3); rise(k('n3'), T(17.6), 1.6, .3);
  })();

  /* ───────── 6 · SUVARṆAPRABHĀSOTTAMA (16s) ───────── */
  (function () {
    var S = scene('s-suvarna', 16), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    ['l1', 'l2', 'l3', 'l4'].forEach(function (key, i) { rise(k(key), T(1.0 + i * 2.4), 2.0, .2); });
    rise(k('attr'), T(11.2), 1.6);
    ['w1', 'w2', 'w3'].forEach(function (key, i) {
      var t = 3.0 + i * 1.4;
      track(k(key), [[T(t - .05), { opacity: 0, transform: 'scale(.12)' }], [T(t), { opacity: .7, transform: 'scale(.12)' }], [T(t + 2.2), { opacity: 0, transform: 'scale(1)' }]]);
    });
    track(k('lotus'), [[T(8.0), { opacity: 0, transform: 'scale(.7)' }], [T(11.0), { opacity: 1, transform: 'scale(1)' }]]);
  })();

  /* ───────── 7 · SECOND, INTERDEPENDENCE (22s) ───────── */
  var tetherScene;
  (function () {
    var S = scene('s-interdep', 22), T = S.t, k = S.k; tetherScene = S;
    fade(k('folio'), T(.6), 1.4);
    rise(k('a'), T(1.0), 2.0);
    words(splitWords(k('b')), T(4.0), .26, 1.6);
    fade($('#tether'), T(2.2), 1.6);
  })();

  /* ───────── 8 · RĀJANIVĀDANĀMA (17s) ───────── */
  (function () {
    var S = scene('s-rajani', 17), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    track(k('bg'), [[T(0), { opacity: 0, transform: 'translate(-50%,-50%) rotate(0deg)' }], [T(3.0), { opacity: .11, transform: 'translate(-50%,-50%) rotate(-6deg)' }], [T(17), { opacity: .11, transform: 'translate(-50%,-50%) rotate(-30deg)' }]]);
    ['l1', 'l2', 'l3', 'l4'].forEach(function (key, i) { rise(k(key), T(1.0 + i * 2.6), 2.0, .2); });
    rise(k('attr'), T(12.2), 1.6);
  })();

  /* ───────── 9 · HIS HOLINESS (15s) ───────── */
  (function () {
    var S = scene('s-dalai', 15), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    words(splitWords(k('a')), T(1.2), .2, 1.5);
    rise(k('b'), T(7.2), 2.2);
  })();

  /* ───────── 10 · CHURCH & STATE (16s) ───────── */
  (function () {
    var S = scene('s-separation', 16), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    words(splitWords(k('a')), T(1.0), .2, 1.5);
    fade(k('c1'), T(5.0), 1.6); fade(k('c1t'), T(5.4), 1.4); fade(k('c2'), T(5.6), 1.6); fade(k('c2t'), T(6.0), 1.4);
    stroke(k('rule'), T(6.8), 1.8);
    rise(k('b'), T(9.8), 2.2);
  })();

  /* ───────── 11 · THE QUESTION (34s, holds on the last frame) ───────── */
  (function () {
    var S = scene('s-question', 34, { fout: 0 }), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    track(k('pA'), [[T(.3), O(0)], [T(.9), O(1)], [T(10.0), O(1)], [T(11.0), O(0)]]);
    words(splitWords(k('a')), T(1.0), .22, 1.5);
    rise(k('b'), T(4.8), 2.0);
    track(k('pB'), [[T(10.6), O(0)], [T(11.4), O(1)]]);
    words(splitWords(k('q')), T(11.8), .17, 1.4);
    track(k('m-a'), [[T(16.0), { opacity: 0, transform: 'translateX(-120px)' }], [T(17.4), { opacity: 1, transform: 'translateX(-120px)' }], [T(23.0), { opacity: 1, transform: 'translateX(0px)' }]]);
    track(k('m-b'), [[T(16.0), { opacity: 0, transform: 'translateX(120px)' }], [T(17.4), { opacity: 1, transform: 'translateX(120px)' }], [T(23.0), { opacity: 1, transform: 'translateX(0px)' }]]);
    track(k('m-lens'), [[T(21.4), O(0)], [T(23.4), O(1)]]);
    fade(k('m-dot'), T(22.8), 1.2);
    rise(k('end'), T(25.2), 1.8); rise(k('wm'), T(28.0), 1.8);
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
    var wl = t - tetherScene.start * 1000;
    if (wl > -1500 && wl < 24000) renderTether(wl);
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
