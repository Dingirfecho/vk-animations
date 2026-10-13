/* ───────────────────────────────────────────────────────────
   Magic as Dharmic Technology — Vajrakula Motion
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

  /* ═════════ the web of causes (SVG built in JS, drawn per frame) ═════════ */
  var NS = 'http://www.w3.org/2000/svg';
  var web = { nodes: [], edges: [], label: null, built: false };
  var WEB_T = { appear: 6000, move: 13000, moveLen: 3800 };   // ms, local to scene

  function buildWeb() {
    var svg = $('#web'); if (!svg) return;
    var R = rng(21), W = 800, H = 520, i, j;
    var pts = [{ x: 400, y: 262 }];
    for (i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2 + R() * .5, r = 105 + R() * 34; pts.push({ x: 400 + Math.cos(a) * r * 1.25, y: 262 + Math.sin(a) * r * .92 }); }
    for (i = 0; i < 10; i++) { var b = i / 10 * Math.PI * 2 + .3 + R() * .4, q = 205 + R() * 36; pts.push({ x: 400 + Math.cos(b) * q * 1.55, y: 262 + Math.sin(b) * q * .95 }); }
    pts.forEach(function (p) { p.x = clamp(p.x, 36, W - 36); p.y = clamp(p.y, 36, H - 36); });

    var key = {}, edges = [];
    pts.forEach(function (p, a) {
      var d = pts.map(function (o, b) { return { b: b, d: Math.hypot(o.x - p.x, o.y - p.y) }; }).filter(function (o) { return o.b !== a; }).sort(function (m, n) { return m.d - n.d; }).slice(0, 3);
      d.forEach(function (o) { var k = Math.min(a, o.b) + '-' + Math.max(a, o.b); if (!key[k]) { key[k] = 1; edges.push([Math.min(a, o.b), Math.max(a, o.b)]); } });
    });
    // graph distance from the intervention node (0)
    var gd = pts.map(function () { return 99; }); gd[0] = 0;
    for (var pass = 0; pass < 8; pass++) edges.forEach(function (e) { if (gd[e[0]] + 1 < gd[e[1]]) gd[e[1]] = gd[e[0]] + 1; if (gd[e[1]] + 1 < gd[e[0]]) gd[e[0]] = gd[e[1]] + 1; });
    var delta = { x: 62, y: -44 };
    var nodes = pts.map(function (p, n) {
      var g = Math.min(gd[n], 4), f = n === 0 ? 1 : Math.exp(-g * .55) * .8;
      var dx = delta.x * f, dy = delta.y * f;
      if (n) { var vx = p.x - 400, vy = p.y - 262, dd = Math.hypot(vx, vy) || 1, sw = 20 * Math.exp(-g * .5) * (R() > .5 ? 1 : -1); dx += -vy / dd * sw; dy += vx / dd * sw; }
      return { ax: p.x, ay: p.y, bx: clamp(p.x + dx, 30, W - 30), by: clamp(p.y + dy, 30, H - 30), gd: g, ph: R() * 6.28, fq: .0004 + R() * .0005, ap: WEB_T.appear + g * 650 + n * 40, el: null, g: n === 0 };
    });

    var gE = document.createElementNS(NS, 'g'), gN = document.createElementNS(NS, 'g');
    edges.forEach(function (e) {
      var l = document.createElementNS(NS, 'line');
      l.setAttribute('stroke', (e[0] === 0) ? '#B8902A' : '#ECE2CC'); l.setAttribute('stroke-width', '1'); l.setAttribute('opacity', '0');
      gE.appendChild(l); web.edges.push({ a: e[0], b: e[1], el: l, g: e[0] === 0 });
    });
    nodes.forEach(function (n) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', n.g ? 6.5 : 3.6); c.setAttribute('fill', n.g ? '#B8902A' : '#0E1525'); c.setAttribute('stroke', n.g ? '#B8902A' : '#ECE2CC'); c.setAttribute('stroke-width', '1.2'); c.setAttribute('opacity', '0');
      gN.appendChild(c); n.el = c;
    });
    var halo = document.createElementNS(NS, 'circle'); halo.setAttribute('r', 14); halo.setAttribute('fill', 'none'); halo.setAttribute('stroke', '#B8902A'); halo.setAttribute('stroke-width', '1'); halo.setAttribute('opacity', '0');
    var lab = document.createElementNS(NS, 'text'); lab.setAttribute('class', 'svg-cap sm knock'); lab.setAttribute('text-anchor', 'middle'); lab.textContent = tr('Intervention'); lab.setAttribute('opacity', '0');
    svg.appendChild(gE); svg.appendChild(gN); svg.appendChild(halo); svg.appendChild(lab);
    web.nodes = nodes; web.halo = halo; web.label = lab; web.built = true;
  }

  function renderWeb(w) {       // w = ms since the web scene began
    if (!web.built) return;
    var m = smooth((w - WEB_T.move) / WEB_T.moveLen), pos = [];
    web.nodes.forEach(function (n, i) {
      var x = n.ax + (n.bx - n.ax) * m + Math.sin(w * n.fq + n.ph) * 5, y = n.ay + (n.by - n.ay) * m + Math.cos(w * n.fq * 1.3 + n.ph) * 5;
      pos[i] = { x: x, y: y };
      var ap = smooth((w - n.ap) / 900);
      var p = (w - WEB_T.move - n.gd * 650) / 1700, bump = (p > 0 && p < 1) ? Math.pow(Math.sin(Math.PI * p), 2) : 0;
      n.bump = bump; n.apv = ap;
      n.el.setAttribute('cx', x.toFixed(1)); n.el.setAttribute('cy', y.toFixed(1));
      n.el.setAttribute('opacity', (ap * (n.g ? 1 : (.78 + .22 * bump))).toFixed(3));
      n.el.setAttribute('r', ((n.g ? 6.5 : 3.6) + 2.6 * bump).toFixed(2));
    });
    web.edges.forEach(function (e) {
      var A = pos[e.a], B = pos[e.b], na = web.nodes[e.a], nb = web.nodes[e.b];
      e.el.setAttribute('x1', A.x.toFixed(1)); e.el.setAttribute('y1', A.y.toFixed(1)); e.el.setAttribute('x2', B.x.toFixed(1)); e.el.setAttribute('y2', B.y.toFixed(1));
      var o = Math.min(na.apv, nb.apv) * (e.g ? .55 : .24 + .3 * Math.max(na.bump, nb.bump));
      e.el.setAttribute('opacity', o.toFixed(3));
    });
    var g = pos[0], pr = (w - WEB_T.move) / 2400;
    web.halo.setAttribute('cx', g.x.toFixed(1)); web.halo.setAttribute('cy', g.y.toFixed(1));
    web.halo.setAttribute('r', (10 + 46 * clamp(pr, 0, 1)).toFixed(1));
    web.halo.setAttribute('opacity', (pr > 0 && pr < 1 ? .6 * (1 - pr) : 0).toFixed(3));
    web.label.setAttribute('x', g.x.toFixed(1)); web.label.setAttribute('y', (g.y + 30).toFixed(1));
    web.label.setAttribute('opacity', (smooth((w - (WEB_T.move - 600)) / 800) * .9).toFixed(3));
  }

  /* ═════════ rosary beads (ritual figure) ═════════ */
  var beads = [];
  function buildBeads() {
    var g = $('#beads'); if (!g) return;
    var pts = [];
    for (var i = 0; i < 7; i++) { var x = 70 + i * 63.3, y = 96 - 34 * Math.sin(Math.PI * i / 6); pts.push([x, y]); }
    var path = document.createElementNS(NS, 'path');
    path.setAttribute('d', 'M' + pts.map(function (p) { return p[0] + ' ' + p[1]; }).join(' L')); path.setAttribute('class', 'ring dim'); path.setAttribute('data-k', 'bead-string');
    g.appendChild(path); beads.push(path);
    pts.forEach(function (p, i) {
      var c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', p[0]); c.setAttribute('cy', p[1]); c.setAttribute('r', 11); c.setAttribute('class', 'ring'); c.setAttribute('fill', 'rgba(236,226,204,.0)'); c.setAttribute('data-k', 'bead' + i);
      g.appendChild(c); beads.push(c);
    });
  }

  buildWeb(); buildBeads();

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
    renderWeb(26000);
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

  /* ───────── 0 · TITLE (12s) ───────── */
  (function () {
    var S = scene('s-title', 12), T = S.t, k = S.k;
    rise(k('flame'), T(1.0), 1.8, .3);
    track(k('magic'), [[T(1.8), { opacity: 0, filter: 'blur(.09em)', transform: 'translateY(.05em)' }], [T(4.9), { opacity: 1, filter: 'blur(0em)', transform: 'translateY(0em)' }]]);
    draw(k('taper'), T(5.1), 2.0);
    words([].slice.call(k('sub').children), T(5.8), .4, 1.5);
    rise(k('credit'), T(8.8), 1.6);
  })();

  /* ───────── 1 · INVOCATION (13s) ───────── */
  (function () {
    var S = scene('s-opening', 13), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    rise(k('namo'), T(1.0), 2.0);
    draw(k('rosary'), T(2.6), 1.8);
    rise(k('v1'), T(3.4), 1.8); rise(k('v2'), T(5.2), 2.0); rise(k('v3'), T(7.8), 2.2);
  })();

  /* ───────── 2 · THESIS (11s) ───────── */
  (function () {
    var S = scene('s-thesis', 11), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4); fade(k('label'), T(.6), 1.4);
    words(splitWords(k('statement')), T(1.3), .34, 1.5);
    track(k('sm-a'), [[T(3.6), { opacity: 0, transform: 'translateX(-70px)' }], [T(5.0), { opacity: 1, transform: 'translateX(-52px)' }], [T(8.6), { opacity: 1, transform: 'translateX(0px)' }]]);
    track(k('sm-b'), [[T(3.6), { opacity: 0, transform: 'translateX(70px)' }], [T(5.0), { opacity: 1, transform: 'translateX(52px)' }], [T(8.6), { opacity: 1, transform: 'translateX(0px)' }]]);
    track(k('sm-lens'), [[T(6.8), O(0)], [T(8.6), O(1)]]);
    fade(k('sm-dot'), T(8.2), 1.2);
    fade(k('sm-la'), T(5.0), 1.4); fade(k('sm-lb'), T(5.3), 1.4);
  })();

  /* ───────── 3 · A WORKING DEFINITION (27s) ───────── */
  (function () {
    var S = scene('s-definition', 27), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    var lab = function (key, a, b) { var s = [[T(a), V(0, .2)], [T(a + 1.2), V(1, 0)]]; if (b) { s.push([T(b), V(1, 0)]); s.push([T(b + 1.0), V(0, -.2)]); } track(k(key), s); };
    lab('l1', .6, 5.6); lab('l2', 6.2, 11.6); lab('l3', 12.2, 17.6); lab('l4', 18.2, null);
    var rows = [['r1', 1.2, 6.0], ['r2', 6.8, 12.0], ['r3', 12.8, 18.0], ['r4', 18.8, null]];
    rows.forEach(function (r) {
      var li = k(r[0]), kids = li.children;
      rise(kids[0], T(r[1]), 1.4); rise(kids[1], T(r[1] + .2), 1.9); rise(kids[2], T(r[1] + 1.8), 1.6, .12);
      var s = [[T(r[2] || 21.0), O(1)]];
      if (r[2]) { s = [[T(r[2]), O(1)], [T(r[2] + 1.5), O(.5)], [T(21.0), O(.5)], [T(22.6), O(1)]]; track(li, s); }
    });
    vdraw(k('vrule'), T(21.0), 2.6);
  })();

  /* ───────── 4 · SEALS & THE WEB OF CAUSES (22s) ───────── */
  var webScene;
  (function () {
    var S = scene('s-web', 22), T = S.t, k = S.k; webScene = S;
    fade(k('folio'), T(.6), 1.4);
    track(k('l1'), [[T(.5), V(0, .2)], [T(1.7), V(1, 0)], [T(5.6), V(1, 0)], [T(6.6), V(0, -.2)]]);
    track(k('l2'), [[T(6.2), V(0, .2)], [T(7.4), V(1, 0)]]);
    [['seal1', 1.0], ['seal2', 2.2], ['seal3', 3.4], ['seal4', 4.6]].forEach(function (s, i) {
      var st = [[T(s[1]), V(0, .25)], [T(s[1] + 1.6), V(1, 0)]];
      if (i === 1 || i === 3) { st.push([T(Math.max(6.0, s[1] + 1.6)), V(1, 0)]); st.push([T(7.8), V(.3, 0)]); }
      track(k(s[0]), st);
    });
    var cap = function (key, a, b) { var s = [[T(a), V(0, .2)], [T(a + 1.3), V(1, 0)]]; if (b) { s.push([T(b), V(1, 0)]); s.push([T(b + 1.0), V(0, -.2)]); } track(k(key), s); };
    cap('cap1', 8.4, 12.0); cap('cap2', 12.6, 16.6); cap('cap3', 17.2, null);
  })();

  /* ───────── 5 · TWO RESPONSES (23s) ───────── */
  (function () {
    var S = scene('s-shop', 23), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    var p1 = k('p1'), p2 = k('p2'), p3 = k('p3');
    fade(p1.children[0], T(.6), 1.2); rise(p1.children[1], T(1.4), 2.0); rise(p1.children[2], T(4.6), 1.8);
    track(p1, [[T(.3), O(0)], [T(1.0), O(1)], [T(8.4), O(1)], [T(9.4), O(0)]]);
    track(p2, [[T(8.4), O(0)], [T(9.0), O(1)], [T(15.4), O(1)], [T(16.4), O(0)]]);
    var A = k('cardA'), B = k('cardB'), dim = 'rgba(236,226,204,.2)';
    track(A, [[T(9.0), V(0, .28)], [T(10.6), V(1, 0)], [T(12.0), V(1, 0)], [T(13.6), V(.35, 0)]]);
    track(B, [[T(10.2), { opacity: 0, transform: 'translateY(.28em)', borderColor: dim }], [T(11.8), { opacity: 1, transform: 'translateY(0em)', borderColor: dim }], [T(12.2), { opacity: 1, transform: 'translateY(0em)', borderColor: dim }], [T(13.8), { opacity: 1, transform: 'translateY(0em)', borderColor: 'rgba(184,144,42,.8)' }]]);
    rise(k('note'), T(12.8), 1.9);
    track(p3, [[T(16.0), O(0)], [T(16.8), O(1)]]);
    fade(k('ru-a'), T(16.4), 1.4); fade(k('ru-b'), T(16.8), 1.4);
    stroke(k('ru-thread'), T(17.4), 1.8);
    fade(k('ru-la'), T(17.0), 1.4); fade(k('ru-lb'), T(17.2), 1.4);
    track(k('ru-dot'), [[T(19.0), { opacity: 0, transform: 'translateX(0px)' }], [T(19.6), { opacity: 1, transform: 'translateX(0px)' }], [T(20.9), { opacity: 1, transform: 'translateX(212px)' }], [T(22.3), { opacity: 1, transform: 'translateX(0px)' }]]);
    rise(k('ru-text'), T(18.0), 1.9);
  })();

  /* ───────── 6 · THREE STREAMS (44s) ───────── */
  (function () {
    var S = scene('s-streams', 44), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    track(k('tabs'), [[T(5.6), O(0)], [T(6.8), O(1)]]);
    track(k('tab1'), [[T(6.0), O(.3)], [T(6.8), O(1)], [T(14.4), O(1)], [T(15.2), O(.3)]]);
    track(k('tab2'), [[T(6.0), O(.3)], [T(15.0), O(.3)], [T(15.8), O(1)], [T(25.4), O(1)], [T(26.2), O(.3)]]);
    track(k('tab3'), [[T(25.4), O(.3)], [T(26.4), O(1)]]);
    // intro
    track(k('intro'), [[T(.3), O(0)], [T(.9), O(1)], [T(5.4), O(1)], [T(6.4), O(0)]]);
    rise(k('intro-h'), T(.8), 2.0); rise(k('intro-n'), T(3.6), 1.8);
    // Theravada
    track(k('thera'), [[T(6.6), O(0)], [T(7.2), O(1)], [T(14.0), O(1)], [T(14.9), O(0)]]);
    fade(k('g-c'), T(8.0), 1.0); stroke(k('g-ring1'), T(7.4), 1.8); fade(k('g-ring2'), T(8.4), 1.6); fade(k('g-spokes'), T(8.8), 1.2);
    fade(k('g-n'), T(9.0), 1.0); fade(k('g-e'), T(9.4), 1.0); fade(k('g-s'), T(9.8), 1.0); fade(k('g-w'), T(10.2), 1.0);
    track(k('g-pulse'), [[T(10.5), { opacity: 0, transform: 'scale(.1)' }], [T(10.6), { opacity: .55, transform: 'scale(.1)' }], [T(12.0), { opacity: 0, transform: 'scale(1)' }], [T(12.1), { opacity: .55, transform: 'scale(.1)' }], [T(13.5), { opacity: 0, transform: 'scale(1)' }]]);
    rise(k('t-h'), T(7.4), 1.6); rise(k('t-b'), T(8.4), 2.0);
    // Mahayana
    track(k('maha'), [[T(14.8), O(0)], [T(15.4), O(1)], [T(25.4), O(1)], [T(26.2), O(0)]]);
    track(k('lotus'), [[T(15.0), { opacity: 0, transform: 'rotate(-20deg) scale(.9)' }], [T(17.0), { opacity: 1, transform: 'rotate(0deg) scale(1)' }], [T(26.2), { opacity: 1, transform: 'rotate(16deg) scale(1)' }]]);
    rise(k('m-h'), T(15.6), 1.6); rise(k('m-b'), T(16.4), 2.0);
    words([].slice.call(k('m-mantra').children), T(18.2), .4, 1.6);
    rise(k('m-t'), T(22.8), 1.7);
    // Vajrayana
    track(k('vajra'), [[T(26.0), O(0)], [T(26.6), O(1)]]);
    stroke(k('v-r1'), T(26.8), 1.8); stroke(k('v-r2'), T(28.0), 1.8); stroke(k('v-r3'), T(29.2), 1.8);
    fade(k('v-c'), T(30.4), 1.0); fade(k('v-t1'), T(28.0), 1.2); fade(k('v-t2'), T(29.2), 1.2); fade(k('v-t3'), T(30.4), 1.2);
    ['v-a1', 'v-a2', 'v-a3', 'v-a4'].forEach(function (key, i) { fade(k(key), T(31.2 + i * 1.0), 1.4); });
    rise(k('v-h'), T(27.0), 1.6); rise(k('v-b'), T(28.2), 2.0); rise(k('v-n'), T(33.0), 2.0); rise(k('v-warn'), T(35.6), 2.0);
  })();

  /* ───────── 7 · OBJECTIONS (19.5s) ───────── */
  (function () {
    var S = scene('s-objections', 19.5), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    track(k('o1'), [[T(.3), O(0)], [T(.9), O(1)], [T(9.0), O(1)], [T(10.0), O(0)]]);
    fade(k('o1-l1'), T(.6), 1.2); rise(k('o1-q'), T(1.0), 2.0); rise(k('o1-g'), T(2.8), 1.8); draw(k('o1-r'), T(3.9), 1.4); fade(k('o1-l2'), T(4.6), 1.2); rise(k('o1-a'), T(5.0), 1.8);
    track(k('o2'), [[T(9.8), O(0)], [T(10.4), O(1)]]);
    fade(k('o2-l1'), T(10.4), 1.2); rise(k('o2-q'), T(10.8), 2.0); rise(k('o2-g'), T(12.6), 1.8); draw(k('o2-r'), T(13.6), 1.4); fade(k('o2-l2'), T(14.3), 1.2); rise(k('o2-a'), T(14.7), 1.8);
  })();

  /* ───────── 8 · GANAPATI (48s) ───────── */
  (function () {
    var S = scene('s-ganapati', 48), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    // who is Ganapati
    track(k('g1'), [[T(.3), O(0)], [T(.9), O(1)], [T(11.2), O(1)], [T(12.2), O(0)]]);
    fade(k('g1-l'), T(.6), 1.2); rise(k('g1-h'), T(1.2), 2.0); draw(k('g1-t'), T(3.0), 1.8); rise(k('g1-b'), T(4.0), 2.0);
    // bonus transmission
    track(k('g2'), [[T(12.0), O(0)], [T(12.6), O(1)], [T(20.2), O(1)], [T(21.2), O(0)]]);
    track(k('g2-lotus'), [[T(12.2), { opacity: 0, transform: 'rotate(-18deg) scale(.92)' }], [T(14.5), { opacity: .22, transform: 'rotate(0deg) scale(1)' }], [T(21.2), { opacity: .22, transform: 'rotate(14deg) scale(1)' }]]);
    fade(k('g2-l'), T(12.8), 1.2);
    [].slice.call(k('g2-m').querySelectorAll('.syl')).forEach(function (s, i) {
      var t = 13.8 + i * .45;
      track(s, [[T(t), { opacity: 0, color: '#B8902A', transform: 'translateY(.06em)' }], [T(t + .7), { opacity: 1, color: '#B8902A', transform: 'translateY(0em)' }], [T(t + 2.6), { opacity: 1, color: '#ECE2CC', transform: 'translateY(0em)' }]]);
    });
    rise(k('g2-n'), T(17.2), 1.8);
    // implements
    track(k('g3'), [[T(21.0), O(0)], [T(21.6), O(1)], [T(32.4), O(1)], [T(33.4), O(0)]]);
    fade(k('g3-l'), T(21.8), 1.2);
    ['i1', 'i2', 'i3', 'i4'].forEach(function (key, i) { rise(k(key), T(22.4 + i * 1.6), 1.8); });
    rise(k('g3-t'), T(29.4), 2.0);
    // ritual
    track(k('g4'), [[T(33.2), O(0)], [T(33.8), O(1)]]);
    fade(k('g4-l'), T(34.0), 1.2);
    ['st1', 'st2', 'st3', 'st4'].forEach(function (key, i) { rise(k(key), T(34.6 + i * 1.3), 1.6, .2); });
    fade(k('bead-string'), T(38.8), 1.2);
    for (var b = 0; b < 7; b++) {
      var tb = 39.0 + b * .36, el = k('bead' + b);
      track(el, [[T(tb), { opacity: 0, fill: 'rgba(184,144,42,.9)' }], [T(tb + .3), { opacity: 1, fill: 'rgba(184,144,42,.9)' }], [T(tb + 1.5), { opacity: 1, fill: 'rgba(184,144,42,.0)' }]]);
    }
    rise(k('st5'), T(41.6), 1.6, .2); fade(k('wish'), T(42.0), 1.6);
    rise(k('st6'), T(43.0), 1.6, .2);
    ['rip1', 'rip2', 'rip3'].forEach(function (key, i) {
      var t = 43.4 + i * .7;
      track(k(key), [[T(t - .05), { opacity: 0, transform: 'scale(.12)' }], [T(t), { opacity: .75, transform: 'scale(.12)' }], [T(t + 1.8), { opacity: 0, transform: 'scale(1)' }]]);
    });
  })();

  /* ───────── 9 · DEDICATION (22s, holds on the last frame) ───────── */
  (function () {
    var S = scene('s-dedication', 22, { fout: 0 }), T = S.t, k = S.k;
    fade(k('folio'), T(.6), 1.4);
    rise(k('namo'), T(1.0), 2.0); draw(k('rosary'), T(2.4), 1.8);
    rise(k('v1'), T(3.0), 1.8); rise(k('v2'), T(5.0), 2.0); rise(k('v3'), T(7.2), 2.2);
    var sw = k('swasti');
    rise(sw.querySelector('.lockup'), T(10.6), 2.0); fade(sw.querySelector('.cdot'), T(12.2), 1.6);
    rise(k('wm'), T(14.0), 1.8); rise(k('credit'), T(15.4), 1.8);
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
    var wl = t - webScene.start * 1000;
    if (wl > -1500 && wl < 24000) renderWeb(wl);
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
