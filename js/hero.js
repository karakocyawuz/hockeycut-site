/* HockeyCut site v2 — hero ürün paneli (KT-420): bizim çizdiğimiz, 21 sn'lik olay animasyonu. GERÇEK MAÇ GÖRÜNTÜSÜ DEĞİL, canlı da değil.
   Senaryo: savunma bölgesi faceoff'u → DZ çıkış → OZ giriş → şut → gol. Her olayda pistte halka, altta "Auto-tagged" etiketi,
   zaman çizelgesine rozet, sağdaki olay listesine satır düşer. Faceoff kazananı gösterilmez (kullanıcı onaylar); şut = "listelenen şut".
   Kütüphanesiz (canvas 2B). Görünmezken durur; azaltılmış harekette tüm olayların yerinde olduğu durağan kare. */
(function () {
  'use strict';
  var d = document, w = window;
  var panel = d.getElementById('heroPanel'), wrap = d.getElementById('rinkWrap'), strip = d.getElementById('tagStrip'), cv = d.getElementById('rinkCanvas');
  if (!panel || !cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var T = function (k, v) { return w.HA_I18N ? w.HA_I18N.t(k, v) : k; };
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LOOP = 21, TG = 14.6, RH = 330; // döngü sn · gol anı · pist 600×300 + altta 30 birim yedek şeridi
  var GX = 566, GY = 148; // golde pakın durduğu yer: kale çizgisinin (x = 560) ardı, direklerin arası (filenin içi)

  /* ---- Oyuncu anahtar kareleri [zaman, x, y]. Ev sahibi (kemik) sağa hücum eder, deplasman (pembe) sola. Kaleler x≈40 ve x≈560 ----
     HOKEY KURALLARI (senaryoyu değiştirirken uy; e2e-v2.mjs "kural" denetimleri ölçer):
     - Faceoff (0–2 sn, nokta 100,80): santrlar noktada kendi tarafında; diğer oyuncular dairenin (yarıçap 45) dışında, kendi tarafında.
     - Ofsayt: pak mavi çizgiyi (x 367–373) tümüyle geçmeden ev sahibi oyuncusu hücum bölgesine (x > 373) giremez; önce pakı taşıyan girer.
     - Gol: pak kale çizgisini (x = 560) tümüyle geçip direklerin arasında fileye girer (GX). */
  var K = {
    hC:  [[0, 92, 80], [2, 92, 80], [2.5, 100, 86], [3.5, 130, 110], [5, 190, 140], [7, 270, 130], [8, 300, 112], [10, 376, 92], [11.2, 430, 120], [12.4, 470, 140], [14, 500, 150], [21, 510, 150]],
    hL:  [[0, 88, 32], [2, 88, 32], [3.5, 120, 40], [5.5, 185, 45], [8, 265, 60], [10, 345, 50], [11.5, 430, 62], [13, 475, 100], [13.9, 486, 146], [15.5, 495, 150], [21, 495, 150]],
    hR:  [[0, 88, 128], [2, 88, 128], [4, 140, 150], [6, 215, 175], [8, 280, 205], [10, 345, 205], [11.4, 435, 195], [13, 470, 192], [13.7, 478, 185], [15.5, 495, 170], [21, 495, 170]],
    hD1: [[0, 58, 118], [2, 58, 118], [2.5, 60, 128], [3.3, 75, 150], [4.5, 130, 205], [5.6, 200, 215], [6.2, 229, 205], [7.2, 262, 190], [8, 285, 170], [9, 330, 180], [12, 380, 190], [15.5, 395, 190], [21, 395, 190]],
    hD2: [[0, 70, 195], [2, 70, 195], [3, 95, 200], [5, 150, 150], [7, 215, 120], [9, 290, 100], [11, 360, 105], [13, 400, 95], [15.5, 410, 100], [21, 410, 100]],
    aC:  [[0, 108, 80], [2, 108, 80], [2.6, 100, 95], [3.5, 120, 130], [4.5, 150, 150], [6.5, 230, 140], [8.5, 330, 140], [10, 400, 150], [11.5, 440, 150], [13, 470, 150], [15.5, 480, 150], [21, 480, 150]],
    aW1: [[0, 112, 32], [2, 112, 32], [3.5, 150, 60], [5.5, 215, 90], [8, 320, 70], [10.5, 420, 60], [12.5, 480, 70], [15.5, 505, 85], [21, 505, 85]],
    aW2: [[0, 112, 128], [2, 112, 128], [3.5, 125, 160], [5.5, 190, 190], [7.5, 260, 230], [9.5, 340, 235], [11.5, 420, 225], [13.5, 495, 195], [15.5, 505, 200], [21, 505, 200]],
    aD1: [[0, 160, 70], [2, 160, 70], [4, 240, 100], [7, 360, 100], [10, 430, 95], [13, 470, 100], [15.5, 500, 110], [21, 500, 110]],
    aD2: [[0, 160, 115], [2, 160, 115], [4, 250, 145], [7, 380, 155], [10, 455, 170], [13, 490, 165], [15.5, 520, 170], [21, 520, 170]],
    ref: [[0, 98, 58], [2, 98, 58], [3.5, 150, 26], [6, 250, 22], [21, 250, 22]]
  };
  var HOME = ['hC', 'hL', 'hR', 'hD1', 'hD2'], AWAY = ['aC', 'aW1', 'aW2', 'aD1', 'aD2'];

  // Hermite eğrisi: duraklamalarda teğet sıfır, geçişlerde kavisli paten çizgisi
  Object.keys(K).forEach(function (id) {
    var k = K[id];
    k.forEach(function (p, j) {
      var a = k[j - 1], b = k[j + 1], mx = 0, my = 0;
      if (a && b && Math.hypot(p[1] - a[1], p[2] - a[2]) > 0.5 && Math.hypot(b[1] - p[1], b[2] - p[2]) > 0.5) { mx = (b[1] - a[1]) / (b[0] - a[0]) * 0.85; my = (b[2] - a[2]) / (b[0] - a[0]) * 0.85; }
      p[3] = mx; p[4] = my;
    });
  });
  function pos(id, t) {
    var k = K[id], n = k.length;
    if (t <= k[0][0]) return [k[0][1], k[0][2]];
    if (t >= k[n - 1][0]) return [k[n - 1][1], k[n - 1][2]];
    for (var j = 0; j < n - 1; j++) if (t < k[j + 1][0]) {
      var p0 = k[j], p1 = k[j + 1], h = p1[0] - p0[0], s = (t - p0[0]) / h, s2 = s * s, s3 = s2 * s;
      var a = 2 * s3 - 3 * s2 + 1, b = s3 - 2 * s2 + s, c = -2 * s3 + 3 * s2, e = s3 - s2;
      return [a * p0[1] + b * h * p0[3] + c * p1[1] + e * h * p1[3], a * p0[2] + b * h * p0[4] + c * p1[2] + e * h * p1[4]];
    }
  }
  function head(id, t) {
    var a = pos(id, t - 0.05), b = pos(id, t + 0.05), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
    return l > 0.4 ? [dx / l, dy / l] : [id.charAt(0) === 'h' ? 1 : -1, 0];
  }
  function front(id, t) { var p = pos(id, t), h = head(id, t); return [p[0] + h[0] * 7.5, p[1] + h[1] * 7.5]; }

  /* ---- Pak: tut / taşı / pas / şut ---- */
  var PK = [[0, 2.0, 'hold', 100, 80], [2.0, 2.5, 'pass', 'hD1'], [2.5, 7.3, 'carry', 'hD1'], [7.3, 7.9, 'pass', 'hC'], [7.9, 11.2, 'carry', 'hC'], [11.2, 11.8, 'pass', 'hR'],
    [11.8, 13.6, 'carry', 'hR'], [13.6, 14.1, 'pass', 'hL'], [14.1, TG, 'shot', GX, GY], [TG, LOOP, 'hold', GX, GY]];
  function segEnd(s) { return s[2] === 'carry' ? front(s[3], s[1]) : typeof s[3] === 'string' ? front(s[3], s[1]) : [s[3], s[4]]; }
  PK.forEach(function (s, j) { var p = PK[j - 1]; s.start = p ? segEnd(p) : [s[3], s[4]]; });
  function puckAt(t) {
    for (var j = 0; j < PK.length; j++) {
      var s = PK[j]; if (t >= s[1] && j < PK.length - 1) continue;
      if (s[2] === 'hold') return [s[3], s[4]];
      if (s[2] === 'carry') return front(s[3], t);
      var e = segEnd(s), u = Math.min(1, Math.max(0, (t - s[0]) / (s[1] - s[0])));
      if (s[2] === 'pass') u = 1 - Math.pow(1 - u, 1.5);
      return [s.start[0] + (e[0] - s.start[0]) * u, s.start[1] + (e[1] - s.start[1]) * u];
    }
    return null;
  }
  function carrierAt(t) { for (var j = 0; j < PK.length; j++) { var s = PK[j]; if (t >= s[0] && t < s[1]) return s[2] === 'carry' ? s[3] : null; } return null; }

  /* ---- Olaylar: 8 ürün türünden beşi. Renkler uygulamadaki gruplar (app/ui/tasarim/tema.css): hücum #6FA8FF · savunma #F2A256 · diğer #B4BCB6 ---- */
  var COL = { goal: '#6FA8FF', shot: '#6FA8FF', entry: '#6FA8FF', exit: '#F2A256', faceoff: '#B4BCB6' };
  var EV = [
    { t: 2.0, ty: 'faceoff', k: 'js.faceoff', dk: 'js.foDz', x: 100, y: 80, fo: 1 },          // kazananı gösterme: kullanıcı onaylar
    { t: 6.2, ty: 'exit', k: 'js.exit', dk: 'js.home', x: 229, y: 205 },
    { t: 10.0, ty: 'entry', k: 'js.entry', dk: 'js.home', x: 374, y: 92 },
    { t: 14.1, ty: 'shot', k: 'js.shotc', dk: 'js.home', x: 486, y: 146, sog: 1, cand: 1 }, // şut = ADAY (Evet/Hayır ile onaylanır)
    { t: TG, ty: 'goal', k: 'js.goal', dk: 'js.home', x: GX, y: GY, mark: 'goal', mx: 486, my: 146, goal: 1 }
  ];
  var MAX = { events: 6, goals: 2, sog: 3, fo: 3 };
  function gameSec(t) { return 490 + t * 4; } // P2 08:10'dan başlar; 21 sn'de ~1,5 oyun dakikası
  function mmss(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }

  /* ---- Çizim ---- */
  var S = 1, W = 0, dpr = 1, trail = [], marks = [];
  function sprite(col) {
    var c = d.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, col.replace('A', '.55')); g.addColorStop(0.35, col.replace('A', '.18')); g.addColorStop(1, col.replace('A', '0'));
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); return c;
  }
  var HC = '#ECE6D6', AC = '#EE86C4', FOS = '#39FF88'; // takım A (kemik), takım B (fuşya), fosfor — uygulama teması
  var GLOW = { h: sprite('rgba(236,230,214,A)'), a: sprite('rgba(238,134,196,A)'), f: sprite('rgba(57,255,136,A)'), r: sprite('rgba(255,122,114,A)') };
  function dot(x, y, r, fill, stroke, lw) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw || 1.5; ctx.strokeStyle = stroke; ctx.stroke(); } }
  function skater(id, t, carrier) {
    var p = pos(id, t), h = head(id, t), home = id.charAt(0) === 'h', col = home ? HC : AC;
    ctx.drawImage(home ? GLOW.h : GLOW.a, p[0] - 16, p[1] - 16, 32, 32);
    ctx.beginPath(); ctx.moveTo(p[0] + h[0] * 6, p[1] + h[1] * 6); ctx.lineTo(p[0] + h[0] * 11, p[1] + h[1] * 11); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = home ? 'rgba(236,230,214,.75)' : 'rgba(238,134,196,.75)'; ctx.stroke();
    dot(p[0], p[1], 7, col, carrier ? FOS : '#0b0c0b', carrier ? 2.2 : 1.6);
  }
  function referee(t) {
    var p = pos('ref', t); ctx.save(); dot(p[0], p[1], 5.2, '#f4f4f5', '#18181b', 1.2);
    ctx.beginPath(); ctx.arc(p[0], p[1], 5.2, 0, 6.2832); ctx.clip(); ctx.fillStyle = '#18181b';
    for (var i = -1; i <= 1; i++) ctx.fillRect(p[0] + i * 3.2 - 0.8, p[1] - 6, 1.6, 12);
    ctx.restore();
  }
  // döngü sonunda sahne yumuşakça kaybolur, başta belirir (kesme yok)
  function fade(t) { return t < 0.5 ? 0.35 + t / 0.5 * 0.65 : t > LOOP - 1.2 ? Math.max(0, (LOOP - t) / 1.2) : 1; }
  function draw(t) {
    ctx.setTransform(dpr * S, 0, 0, dpr * S, 0, 0); ctx.clearRect(0, 0, 600, RH);
    ctx.globalAlpha = reduce ? 1 : fade(t);
    var pk = puckAt(t), car = carrierAt(t);
    // kalıcı işaretler: gol = dolu nokta + halka (şutun çıktığı yer)
    marks.forEach(function (m) { ctx.save(); ctx.globalAlpha *= 0.95; dot(m.x, m.y, 10, 'rgba(57,255,136,.10)', FOS, 2); dot(m.x, m.y, 3.6, FOS); ctx.restore(); });
    // gol ışığı + dalga
    if (t >= TG && t < TG + 3) {
      var e = (t - TG) / 3, on = Math.floor((t - TG) * 4) % 2 === 0;
      ctx.save(); ctx.globalAlpha *= on ? 1 : 0.45; ctx.drawImage(GLOW.r, 560, 126, 48, 48); dot(584, 150, 4, '#f87171'); ctx.restore();
      for (var r = 0; r < 3; r++) { var q = Math.min(1, Math.max(0, e * 1.5 - r * 0.15)); if (!q) continue; ctx.save(); ctx.globalAlpha *= (1 - q) * 0.9; dot(GX, GY, 10 + q * 120, null, FOS, 2.4 - r * 0.6); ctx.restore(); }
      ctx.save(); ctx.globalAlpha *= 1 - e; ctx.drawImage(GLOW.f, GX - 60, GY - 60, 120, 120); ctx.restore();
    }
    // kaleciler (pakın yüksekliğini izler)
    var gy = pk ? Math.min(162, Math.max(138, 150 + (pk[1] - 150) * 0.22)) : 150;
    [['h', 50], ['a', 550]].forEach(function (g) { ctx.drawImage(GLOW[g[0]], g[1] - 16, gy - 16, 32, 32); dot(g[1], gy, 8.5, g[0] === 'h' ? '#bdb7a8' : '#c76aa2', g[0] === 'h' ? HC : AC, 2); });
    HOME.concat(AWAY).forEach(function (id) { skater(id, t, id === car); });
    referee(t);
    if (pk) {
      trail.push(pk); if (trail.length > 12) trail.shift();
      for (var j = 1; j < trail.length; j++) { ctx.beginPath(); ctx.moveTo(trail[j - 1][0], trail[j - 1][1]); ctx.lineTo(trail[j][0], trail[j][1]); ctx.strokeStyle = 'rgba(57,255,136,' + (j / trail.length * 0.55).toFixed(3) + ')'; ctx.lineWidth = 2.2 * j / trail.length; ctx.stroke(); }
      ctx.drawImage(GLOW.f, pk[0] - 9, pk[1] - 9, 18, 18); dot(pk[0], pk[1], 3.3, '#0a0a0a', '#f4fff0', 1.3);
    } else trail.length = 0;
    ctx.globalAlpha = 1;
  }

  /* ---- Panel arayüzü ---- */
  var track = d.getElementById('tlTrack'), headEl = d.getElementById('tlHead'), fill = d.getElementById('tlFill'), clock = d.getElementById('tlClock'), feed = d.getElementById('feed');
  var flash = d.getElementById('rinkFlash');
  var trackW = 0, val = {}, kEls = {}, bars = {}, tags = [];
  ['events', 'goals', 'sog', 'fo'].forEach(function (k) { kEls[k] = panel.querySelector('[data-kpi="' + k + '"]'); bars[k] = panel.querySelector('[data-kbar="' + k + '"]'); val[k] = 0; });
  function resize() { W = wrap.clientWidth; if (!W) return; dpr = Math.min(2, w.devicePixelRatio || 1); cv.width = Math.round(W * dpr); cv.height = Math.round(W * RH / 600 * dpr); S = W / 600; trackW = track.clientWidth; }
  function setK(k, v, bump) {
    val[k] = v; kEls[k].textContent = v; bars[k].style.width = Math.min(100, v / MAX[k] * 100).toFixed(1) + '%';
    if (bump) { kEls[k].classList.add('bump'); setTimeout(function () { kEls[k].classList.remove('bump'); }, 700); }
  }
  function feedRow(e, gsec, anim) {
    var li = d.createElement('li'); li.style.setProperty('--c', COL[e.ty]); if (!anim) li.style.animation = 'none';
    li.innerHTML = '<span class="fd"></span><span><b></b><small></small></span>';
    li.querySelector('b').textContent = T(e.k); li.querySelector('small').textContent = mmss(gsec) + ' · ' + T(e.dk);
    feed.insertBefore(li, feed.firstChild); while (feed.children.length > 6) feed.removeChild(feed.lastChild);
  }
  function balloon(e, anim) {
    // etiket pistin altındaki şeritte; pistte yalnız olay yerinde küçük halka
    tags.forEach(function (g2) { g2.el.classList.remove('on'); setTimeout(function () { g2.el.remove(); }, 400); }); tags = []; // aynı anda tek etiket
    var b = d.createElement('div'); b.className = 'tagb'; b.style.setProperty('--c', COL[e.ty]);
    b.innerHTML = '<small></small><b></b>'; b.firstChild.textContent = T(e.cand ? 'js.cand' : 'js.tagged'); b.lastChild.textContent = T(e.k) + ' — ' + T(e.dk);
    strip.appendChild(b);
    var r = d.createElement('span'); r.className = 'tag-ring'; r.style.setProperty('--c', COL[e.ty]);
    r.style.left = (e.x * S) + 'px'; r.style.top = (e.y * S) + 'px'; wrap.appendChild(r);
    setTimeout(function () { r.remove(); }, 1600);
    if (anim) { requestAnimationFrame(function () { b.classList.add('on'); }); tags.push({ el: b, t: e.t }); } else b.classList.add('on');
  }
  function fire(e, anim) {
    var m = d.createElement('span'); m.className = 'tl-m'; m.style.left = (e.t / LOOP * 100) + '%'; m.style.setProperty('--c', COL[e.ty]); track.appendChild(m);
    feedRow(e, gameSec(e.t), anim); setK('events', val.events + 1, anim);
    if (e.goal) setK('goals', val.goals + 1, anim); if (e.sog) setK('sog', val.sog + 1, anim); if (e.fo) setK('fo', val.fo + 1, anim);
    if (e.mark) marks.push({ x: e.mx, y: e.my });
    if (anim) balloon(e, true);
    if (anim && e.goal) { flash.classList.add('on'); setTimeout(function () { flash.classList.remove('on'); }, 500); }
  }
  function ui(t) {
    var x = t / LOOP * trackW; headEl.style.transform = 'translateX(' + x.toFixed(1) + 'px)'; fill.style.width = x.toFixed(1) + 'px';
    var g = mmss(gameSec(t)); if (clock.textContent !== g) clock.textContent = g;
    tags = tags.filter(function (g2) { if (t - g2.t > 2.6 || t < g2.t) { g2.el.classList.remove('on'); setTimeout(function () { g2.el.remove(); }, 400); return false; } return true; });
  }
  function resetUI() {
    track.querySelectorAll('.tl-m').forEach(function (m) { m.remove(); }); wrap.querySelectorAll('.tagb').forEach(function (b) { b.remove(); }); tags = []; marks = []; trail = [];
    feed.innerHTML = ''; Object.keys(MAX).forEach(function (k) { setK(k, 0); });
  }

  /* ---- Döngü ---- */
  var t = 0, last = 0, raf = 0, visible = false, nextEv = 0, started = false;
  function frame(now) {
    raf = 0; if (!visible || d.hidden) { last = 0; return; }
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now; t += dt;
    if (t >= LOOP) { t -= LOOP; nextEv = 0; resetUI(); }
    while (nextEv < EV.length && EV[nextEv].t <= t) fire(EV[nextEv++], true);
    draw(t); ui(t); raf = requestAnimationFrame(frame);
  }
  function run() { if (!raf && visible && !d.hidden && !reduce && started) raf = requestAnimationFrame(frame); }
  var TF = 16.2; // azaltılmış hareket: golden hemen sonraki kare, tüm olaylar yerinde
  function still() { draw(TF); ui(TF); }
  function start() {
    if (started) return; started = true; resize(); resetUI();
    if (reduce) { EV.forEach(function (e) { fire(e, false); }); still(); balloon(EV[EV.length - 1], false); return; }
    draw(0); run();
  }
  if ('ResizeObserver' in w) new ResizeObserver(function () { resize(); if (started && (reduce || !raf)) draw(reduce ? TF : t); }).observe(wrap);
  else w.addEventListener('resize', resize);
  if ('IntersectionObserver' in w) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) { start(); run(); } }, { threshold: 0.05 }).observe(panel);
  else { visible = true; start(); }
  d.addEventListener('visibilitychange', run);
  // konum(sn): o andaki oyuncu ve pak konumları (pist birimi) — e2e hokey kuralı denetimleri (faceoff, ofsayt, gol) bunu örnekler
  w.HA_HERO = { konum: function (tt) { return { h: HOME.map(function (id) { return pos(id, tt); }), a: AWAY.map(function (id) { return pos(id, tt); }), pak: puckAt(tt), taraf: 'h' }; }, sure: LOOP, golAni: TG, faceoffBitis: 2.0 };
  d.addEventListener('i18n:ready', function () { if (started) { resetUI(); nextEv = 0; t = 0; if (reduce) { EV.forEach(function (e) { fire(e, false); }); still(); } } });
})();
