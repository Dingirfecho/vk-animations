/* ───────────────────────────────────────────────────────────
   A Flag Without a Flag — Vajrakula Motion (engine shared with the other vk-animations pieces)
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
    var secs = stage.querySelectorAll('.scene');
    for (var sc = 0; sc < secs.length; sc++) { var cn = secs[sc].getAttribute('data-chapter'); if (DICT[cn]) secs[sc].setAttribute('data-chapter', DICT[cn]); }
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
      if (!/[A-Za-z\u00C0-\u017F]/.test(key)) continue;
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

  /* ═════════ the blank flag: a cloth that moves very slowly (deterministic in ms) ═════════ */
  var FLAGS = Array.prototype.slice.call(document.querySelectorAll('.flagsvg'));
  function renderFlags(ms) {
    for (var f = 0; f < FLAGS.length; f++) {
      var svg = FLAGS[f], cloth = svg.querySelector('.cloth'); if (!cloth) continue;
      var top = '', bot = [], x, A = 7;
      for (x = 0; x <= 340; x += 20) {
        var off = Math.sin(x * .022 + ms * .00055 + f) * A * (x / 340) + Math.sin(x * .05 - ms * .0003) * 1.6 * (x / 340);
        top += (x ? 'L' : 'M') + (40 + x) + ' ' + (40 + off).toFixed(1);
        bot.unshift('L' + (40 + x) + ' ' + (240 + off).toFixed(1));
      }
      cloth.setAttribute('d', top + bot.join('') + 'Z');
      var o = Math.sin(170 * .022 + ms * .00055 + f) * A * .5 + Math.sin(170 * .05 - ms * .0003) * .8;
      var r = svg.querySelector('.cring'), c = svg.querySelector('.cfill');
      if (r) r.setAttribute('cy', (140 + o).toFixed(1)); if (c) c.setAttribute('cy', (140 + o).toFixed(1));
    }
  }

  /* ═════════ fit: scale a scene's type down (never up) until its tallest panel fits ═════════ */
  var scenes = Array.prototype.slice.call(document.querySelectorAll('.scene'));
  function fitAll() {
    if (!ANIM) return;
    scenes.forEach(function (sc) {
      var k = 1, stk = sc.querySelector('.stack'); sc.style.setProperty('--fit', '1');
      for (var n = 0; n < 16; n++) {
        var cs = getComputedStyle(sc), avail = sc.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
        if (stk.offsetHeight <= avail + 1) break;
        k = Math.max(.45, k - .04); sc.style.setProperty('--fit', k.toFixed(2));
      }
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('img'), function (im) { if (!im.complete) im.addEventListener('load', fitAll); });

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


  sizeCanvas();

  /* ═════════ static, fully composed fallback ═════════ */
  if (!ANIM) {
    renderFlags(9000);
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


  /* ═════════ the score: every element carries data-at (seconds, from its scene's start) and data-a (how it arrives) ═════════ */
  var allScenes = document.querySelectorAll('.scene'), lastScene = allScenes[allScenes.length - 1];
  Array.prototype.forEach.call(allScenes, function (el) {
    var dur = parseFloat(el.getAttribute('data-dur')), S = scene(el.id, dur, el === lastScene ? { fout: 0 } : {});
    var panels = el.querySelectorAll('.panel[data-at]');
    Array.prototype.forEach.call(panels, function (pn) {
      var at = parseFloat(pn.getAttribute('data-at')), out = pn.getAttribute('data-out');
      var s = [[S.t(at), O(0)], [S.t(at + .9), O(1)]];
      if (out) { out = parseFloat(out); s.push([S.t(out - 1.0), O(1)]); s.push([S.t(out), O(0)]); }
      track(pn, s);
    });
    Array.prototype.forEach.call(el.querySelectorAll('.card'), function (cd) {   // a card arrives with its first line
      var f = cd.querySelector('[data-at]'); if (f) fade(cd, S.t(parseFloat(f.getAttribute('data-at'))), 1.4);
    });
    Array.prototype.forEach.call(el.querySelectorAll('[data-a]'), function (n) {
      var a = n.getAttribute('data-a'), at = S.t(parseFloat(n.getAttribute('data-at'))), d = parseFloat(n.getAttribute('data-d')) || 1.8;
      if (a === 'rise') rise(n, at, d, .28);
      else if (a === 'fade') fade(n, at, d);
      else if (a === 'draw') draw(n, at, d);
      else if (a === 'stroke') stroke(n, at, d);
      else if (a === 'words') words(splitWords(n), at, parseFloat(n.getAttribute('data-step')) || .2, 1.5);
      else if (a === 'title') track(n, [[at, { opacity: 0, filter: 'blur(.09em)', transform: 'translateY(.05em)' }], [at + d, { opacity: 1, filter: 'blur(0em)', transform: 'translateY(0em)' }]]);
      else if (a === 'move') track(n, [[at, { transform: 'translate(0px,0px)' }], [at + d, { transform: 'translate(' + n.getAttribute('data-mx') + 'px,' + n.getAttribute('data-my') + 'px)' }]]);
      else if (a === 'photo') {
        track(n, [[at, { opacity: 0, transform: 'translateY(.4em)' }], [at + 2.4, { opacity: 1, transform: 'translateY(0em)' }]]);
        var im = n.querySelector('img'), dr = parseFloat(n.getAttribute('data-drift')) || 14;
        if (im) track(im, [[at, { transform: 'scale(1)' }], [at + dr, { transform: 'scale(1.05)' }]]);
      }
      if (n.hasAttribute('data-hold')) { /* a moved element stays where it arrives */ }
    });
  });
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
    renderFlags(t);
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
  addEventListener('resize', function () { sizeCanvas(); fitAll(); render(); });

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
  fitAll(); render(); state();
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { fitAll(); start(); }, start);
})();