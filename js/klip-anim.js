/* HockeyCut site v2 — klip önizleme animasyonu (KT-518).
   Klip bölümündeki oynatıcı, seçili olay türüne göre bizim çizdiğimiz kısa bir sahneyi döngüyle oynatır.
   GERÇEK MAÇ GÖRÜNTÜSÜ DEĞİL: üstten görünüş pist, iki takım rengi nokta, pak. Görsel dil js/hero.js ile aynı (kemik / fuşya / fosfor).
   Kütüphanesiz canvas 2B. Görünür alanda değilken durur; prefers-reduced-motion'da yalnız durağan tek kare.
   main.js her önizlemede 'clip:preview' {type, idx} olayı yollar; sahne baştan başlar. Takım 'a' klipleri aynalanır (sağdan sola hücum). */
(function () {
  'use strict';
  var d = document, w = window;
  var media = d.getElementById('cpMedia'), cv = d.getElementById('cpCanvas'), q = d.getElementById('cpQ');
  if (!media || !cv || !cv.getContext) return;
  var ctx = cv.getContext('2d'), scrub = media.querySelector('.cp-scrub');
  var T = function (k, v) { return w.HA_I18N ? w.HA_I18N.t(k, v) : k; };
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HC = '#ECE6D6', AC = '#EE86C4', FOS = '#39FF88';
  var L = 5.5; // döngü süresi (sn)
  var GX = 566; // golde pakın durduğu yer: kale çizgisinin (x = 560) ardı, filenin içi

  /* Oyuncu yolu: düz sayı dizisi [t,x,y, t,x,y, ...]; aralarda yumuşatılmış (smoothstep) geçiş */
  function at(k, t) {
    var n = k.length;
    if (t <= k[0]) return [k[1], k[2]];
    if (t >= k[n - 3]) return [k[n - 2], k[n - 1]];
    for (var i = 0; i < n - 3; i += 3) if (t < k[i + 3]) {
      var u = (t - k[i]) / (k[i + 3] - k[i]); u = u * u * (3 - 2 * u);
      return [k[i + 1] + (k[i + 4] - k[i + 1]) * u, k[i + 2] + (k[i + 5] - k[i + 2]) * u];
    }
  }
  function ahead(k, t) { var a = at(k, t - 0.05), b = at(k, t + 0.05), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return l > 0.3 ? [dx / l, dy / l] : [1, 0]; }

  /* HOKEY KURALLARI (sahneleri değiştirirken uy; e2e-v2.mjs "kural" denetimleri bunları ölçer):
     - Ofsayt: pak mavi çizgiyi (x 227–233 ve 367–373) tümüyle geçmeden pakın sahibi takımın oyuncusu hücum bölgesine giremez
       (ev sahibi için x > 373). Önce pak (ya da pakı taşıyan), sonra diğer hücumcular girer.
     - Gol: pak kale çizgisini (x = 560) tümüyle geçip direklerin arasında (y 141–159) fileye girer.
     - Faceoff: pak bırakılana dek santrlar noktada kendi tarafında, diğerleri dairenin (yarıçap 45) dışında ve kendi tarafında bekler.
     - Ceza: cezalı oyuncu oyun sürerken buzda olmaz; sahne boyunca ceza kulübesindedir (5'e 4).
     Sahneler. h = ev sahibi (sağa hücum), a = deplasman; 5'er oyuncu. puck: parçalar
     ['hold',t0,t1,x,y] · ['carry',t0,t1,'h0'] · ['pass',t0,t1,'h1' | [x,y]]
     q: {t: soru çipinin göründüğü an, k: etiket anahtarı}  still: durağan kare anı  fx: ek çizim  */
  var S = {
    goal: {
      h: [[0, 250, 160, 1.5, 395, 145, 5.5, 420, 150], [0, 225, 60, 2.2, 430, 88, 3, 462, 106, 5.5, 470, 108], [0, 220, 205, 3, 418, 208, 5.5, 428, 208], [0, 150, 110, 5.5, 330, 120], [0, 140, 190, 5.5, 320, 190]],
      a: [[0, 430, 140, 3, 490, 150, 5.5, 490, 150], [0, 420, 80, 3, 480, 90, 5.5, 480, 90], [0, 400, 200, 3, 470, 200, 5.5, 470, 200], [0, 350, 110, 3, 440, 120, 5.5, 440, 120], [0, 350, 180, 3, 430, 180, 5.5, 430, 180]],
      puck: [['carry', 0, 1.7, 'h0'], ['pass', 1.7, 2.3, 'h1'], ['carry', 2.3, 3, 'h1'], ['pass', 3, 3.55, [GX, 147]], ['hold', 3.55, 5.5, GX, 147]], goalAt: 3.55, goalY: 147, still: 4.2
    },
    pp: {
      h: [[0, 380, 110, 5.5, 400, 100], [0, 380, 190, 5.5, 395, 205], [0, 500, 150, 5.5, 505, 140], [0, 440, 70, 5.5, 450, 60], [0, 440, 230, 5.5, 450, 240]],
      a: [[0, 450, 120, 5.5, 460, 120], [0, 450, 180, 5.5, 460, 180], [0, 490, 150, 5.5, 490, 150], [0, 420, 150, 5.5, 430, 150], [0, 300, 313, 5.5, 300, 313]],
      puck: [['carry', 0, 1.5, 'h0'], ['pass', 1.5, 2.2, 'h4'], ['pass', 2.2, 2.9, 'h2'], ['pass', 2.9, 3.6, 'h3'], ['pass', 3.6, 4.3, 'h1'], ['carry', 4.3, 5.5, 'h1']],
      q: { t: 0.5, txt: '5 v 4' }, still: 2.5, box: [0, 5.5]
    },
    faceoff: {
      h: [[0, 290, 150, 1.5, 290, 150, 5.5, 330, 90], [0, 270, 110, 1.5, 270, 110, 3.6, 340, 60, 5.5, 360, 60], [0, 270, 190, 1.5, 270, 190, 3.6, 330, 230, 5.5, 360, 230], [0, 200, 120, 1.5, 200, 120, 5.5, 250, 130], [0, 200, 180, 1.5, 200, 180, 5.5, 250, 180]],
      a: [[0, 310, 150, 1.5, 310, 150, 5.5, 280, 210], [0, 330, 110, 1.5, 330, 110, 3.6, 270, 70, 5.5, 240, 70], [0, 330, 190, 1.5, 330, 190, 3.6, 280, 240, 5.5, 240, 240], [0, 400, 120, 1.5, 400, 120, 5.5, 350, 130], [0, 400, 180, 1.5, 400, 180, 5.5, 350, 180]],
      // pak noktaya bırakılır, kısa süre çevresinde döner; kazanan gösterilmez
      puck: [['hold', 0, 1.2, 300, 128], ['pass', 1.2, 1.5, [300, 150]], ['hold', 1.5, 5.5, 300, 150]], jitter: [1.5, 3.4], ref: [[0, 300, 120, 1.3, 300, 138, 3, 300, 70, 5.5, 300, 40]], still: 2.0
    },
    entry: {
      h: [[0, 150, 150, 3.4, 430, 150, 5.5, 480, 140], [0, 185, 80, 3.7, 410, 70, 5.5, 450, 80], [0, 185, 220, 3.7, 400, 230, 5.5, 450, 220], [0, 120, 110, 5.5, 330, 110], [0, 120, 190, 5.5, 330, 190]],
      a: [[0, 400, 130, 3.4, 460, 135, 5.5, 480, 140], [0, 390, 190, 3.4, 450, 190, 5.5, 470, 190], [0, 380, 90, 3.4, 440, 100, 5.5, 450, 100], [0, 330, 150, 3.4, 420, 160, 5.5, 440, 160], [0, 330, 210, 3.4, 410, 205, 5.5, 430, 205]],
      puck: [['carry', 0, 5.5, 'h0']], line: [370, 2.55], still: 2.9
    },
    exit: {
      h: [[0, 90, 200, 1.4, 150, 170, 5.5, 200, 150], [0, 120, 110, 2.2, 250, 70, 4, 330, 80, 5.5, 380, 80], [0, 130, 230, 5.5, 280, 220], [0, 80, 130, 5.5, 180, 130], [0, 170, 150, 5.5, 250, 150]],
      a: [[0, 220, 120, 5.5, 160, 140], [0, 230, 190, 5.5, 170, 190], [0, 260, 150, 5.5, 200, 160], [0, 330, 100, 5.5, 300, 110], [0, 340, 200, 5.5, 300, 200]],
      puck: [['carry', 0, 1.4, 'h0'], ['pass', 1.4, 2.2, 'h1'], ['carry', 2.2, 5.5, 'h1']], line: [230, 1.95], still: 2.4
    },
    shot: {
      h: [[0, 265, 150, 2.5, 420, 120, 5.5, 440, 120], [0, 260, 70, 1.8, 400, 85, 2.3, 470, 100, 5.5, 480, 100], [0, 250, 210, 5.5, 420, 200], [0, 150, 120, 5.5, 330, 130], [0, 150, 190, 5.5, 330, 190]],
      a: [[0, 440, 130, 5.5, 480, 140], [0, 430, 190, 5.5, 470, 190], [0, 400, 90, 5.5, 450, 95], [0, 370, 150, 5.5, 430, 160], [0, 360, 210, 5.5, 420, 205]],
      puck: [['carry', 0, 1.8, 'h1'], ['pass', 1.8, 2.3, 'h1'], ['pass', 2.3, 2.9, [549, 156]], ['pass', 2.9, 3.3, [538, 176]], ['hold', 3.3, 5.5, 538, 176]],
      q: { t: 3.3, k: 'js.qShot', yn: 4.4 }, still: 4.8
    },
    turn: {
      h: [[0, 200, 110, 2.4, 280, 120, 5.5, 356, 120], [0, 200, 200, 2.1, 262, 160, 5.5, 330, 150], [0, 260, 60, 5.5, 352, 70], [0, 120, 130, 5.5, 280, 150], [0, 120, 190, 5.5, 260, 190]],
      a: [[0, 380, 160, 1.8, 275, 150, 5.5, 230, 150], [0, 400, 100, 5.5, 300, 90], [0, 400, 220, 5.5, 300, 220], [0, 450, 130, 5.5, 330, 120], [0, 450, 190, 5.5, 330, 190]],
      puck: [['carry', 0, 2.0, 'a0'], ['pass', 2.0, 2.3, 'h1'], ['carry', 2.3, 5.5, 'h1']], q: { t: 3.0, k: 'js.qTurn', yn: 4.1 }, flip: 2.3, still: 4.4
    }
  };
  var ARIA = { goal: 'js.aria.goal', pp: 'js.aria.pp', faceoff: 'js.aria.faceoff', entry: 'js.aria.entry', exit: 'js.aria.exit', shot: 'js.aria.shot', turn: 'js.aria.turn' };

  var hold = false, type = 'goal', mirror = false, t = 0, last = 0, raf = 0, visible = false, W = 0, H = 0, dpr = 1, trail = [];
  Object.keys(S).forEach(function (k) { var s = S[k]; s.id = {}; s.h.forEach(function (p, i) { s.id['h' + i] = p; }); s.a.forEach(function (p, i) { s.id['a' + i] = p; }); });

  /* Pak konumu + son sahip takım (halka rengi) */
  function puckAt(s, tt) {
    var segs = s.puck, startP = null, side = 'h';
    function front(id, x) { var p = at(s.id[id], x), h = ahead(s.id[id], x); return [p[0] + h[0] * 7.5, p[1] + h[1] * 7.5]; }
    function endOf(sg) { return sg[0] === 'hold' ? [sg[3], sg[4]] : sg[0] === 'carry' ? front(sg[3], sg[2]) : typeof sg[3] === 'string' ? front(sg[3], sg[2]) : sg[3]; }
    for (var j = 0; j < segs.length; j++) {
      var sg = segs[j], st = j ? endOf(segs[j - 1]) : (sg[0] === 'hold' ? [sg[3], sg[4]] : sg[0] === 'carry' ? front(sg[3], sg[1]) : [0, 0]);
      if (sg[0] === 'carry') side = sg[3].charAt(0);
      if (tt >= sg[2] && j < segs.length - 1) { if (sg[0] === 'pass' && typeof sg[3] === 'string') side = sg[3].charAt(0); continue; }
      if (sg[0] === 'hold') return { p: [sg[3], sg[4]], side: side };
      if (sg[0] === 'carry') return { p: front(sg[3], tt), side: side };
      var u = Math.min(1, Math.max(0, (tt - sg[1]) / (sg[2] - sg[1]))); u = 1 - Math.pow(1 - u, 1.5);
      if (j === 0) st = typeof sg[3] === 'string' ? at(s.id[sg[3]], sg[1]) : st;
      if (typeof sg[3] === 'string' && u >= 1) side = sg[3].charAt(0);
      return { p: [st[0] + (endOf(sg)[0] - st[0]) * u, st[1] + (endOf(sg)[1] - st[1]) * u], side: side };
    }
    return null;
  }

  function dot(x, y, r, fill, stroke, lw) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw || 1.5; ctx.strokeStyle = stroke; ctx.stroke(); } }
  function col(side) { return side === 'h' ? (mirror ? AC : HC) : (mirror ? HC : AC); }

  function draw(tt) {
    var s = S[type]; ctx.setTransform(dpr * W / 600, 0, 0, dpr * W / 600, 0, 0); ctx.clearRect(0, 0, 600, 330);
    if (mirror) { ctx.translate(600, 0); ctx.scale(-1, 1); }
    // mavi çizgi parıltısı (zone entry / D-zone exit)
    if (s.line) { var e = tt - s.line[1]; if (e > -0.05 && e < 0.9) { var a = Math.max(0, 1 - Math.max(0, e) / 0.9); ctx.fillStyle = 'rgba(125,211,252,' + (0.5 * a).toFixed(3) + ')'; ctx.fillRect(s.line[0] - 8, 0, 16, 300); ctx.fillStyle = 'rgba(190,235,255,' + (0.8 * a).toFixed(3) + ')'; ctx.fillRect(s.line[0] - 2, 0, 4, 300); } }
    // ceza kulübesi parıltısı (power play)
    if (s.box && tt > s.box[0]) { ctx.fillStyle = 'rgba(255,122,114,' + (0.14 + 0.08 * Math.sin(tt * 4)).toFixed(3) + ')'; ctx.fillRect(281, 303, 38, 20); ctx.strokeStyle = 'rgba(255,122,114,.6)'; ctx.lineWidth = 1.4; ctx.strokeRect(281, 303, 38, 20); }
    // gol ışığı + halka
    if (s.goalAt && tt >= s.goalAt && tt < s.goalAt + 2.4) {
      var g = (tt - s.goalAt) / 2.4, on = Math.floor((tt - s.goalAt) * 4) % 2 === 0;
      ctx.globalAlpha = on ? 1 : 0.45; dot(584, 150, 4.5, '#f87171'); dot(584, 150, 10, 'rgba(248,113,113,.18)'); ctx.globalAlpha = 1;
      for (var r = 0; r < 3; r++) { var u = Math.min(1, Math.max(0, g * 1.5 - r * 0.15)); if (u) { ctx.globalAlpha = (1 - u) * 0.9; dot(GX, s.goalY || 150, 10 + u * 110, null, FOS, 2.2 - r * 0.5); } }
      ctx.globalAlpha = 1;
    }
    var pk = puckAt(s, tt), gy = pk ? Math.min(165, Math.max(135, 150 + (pk.p[1] - 150) * 0.25)) : 150;
    // kaleciler
    dot(50, 150, 8, '#bdb7a8', col('h'), 2); dot(550, gy, 8, '#c76aa2', col('a'), 2);
    // oyuncular
    ['h', 'a'].forEach(function (sd) { s[sd].forEach(function (k, i) {
      var p = at(k, tt), h = ahead(k, tt), c = col(sd), carrier = s.puck.some(function (sg) { return sg[0] === 'carry' && sg[3] === sd + i && tt >= sg[1] && tt < sg[2]; });
      ctx.beginPath(); ctx.moveTo(p[0] + h[0] * 6, p[1] + h[1] * 6); ctx.lineTo(p[0] + h[0] * 11, p[1] + h[1] * 11); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = c; ctx.globalAlpha = 0.75; ctx.stroke(); ctx.globalAlpha = 1;
      dot(p[0], p[1], 7, c, carrier ? FOS : '#0b0c0b', carrier ? 2.2 : 1.6);
    }); });
    // hakem (faceoff)
    if (s.ref) { var rp = at(s.ref[0], tt); dot(rp[0], rp[1], 5.2, '#f4f4f5', '#18181b', 1.2); }
    // pak
    if (pk) {
      var pp = pk.p, jt = s.jitter;
      if (jt && tt > jt[0] && tt < jt[1]) pp = [pp[0] + Math.sin(tt * 9) * 6, pp[1] + Math.cos(tt * 7) * 5];
      trail.push(pp); if (trail.length > 10) trail.shift();
      for (var j = 1; j < trail.length; j++) { ctx.beginPath(); ctx.moveTo(trail[j - 1][0], trail[j - 1][1]); ctx.lineTo(trail[j][0], trail[j][1]); ctx.strokeStyle = 'rgba(57,255,136,' + (j / trail.length * 0.5).toFixed(3) + ')'; ctx.lineWidth = 2 * j / trail.length; ctx.stroke(); }
      dot(pp[0], pp[1], 3.3, '#0a0a0a', '#f4fff0', 1.2);
      dot(pp[0], pp[1], 7.5, null, col(pk.side), 2); // halka rengi = pakı son tutan takım
      if (s.flip && tt >= s.flip && tt < s.flip + 0.8) { ctx.globalAlpha = 1 - (tt - s.flip) / 0.8; dot(pp[0], pp[1], 8 + (tt - s.flip) * 40, null, col('h'), 2); ctx.globalAlpha = 1; }
    }
  }

  /* HTML katmanı: soru çipi (Evet/Hayır) ve ilerleme çubuğu */
  var qL = q && q.querySelector('.cp-ql'), qY = q && q.querySelector('.cp-qy'), qN = q && q.querySelector('.cp-qn');
  function ui(tt) {
    var s = S[type], pg = (tt / L * 100).toFixed(1) + '%'; media.style.setProperty('--pg', pg);
    if (!q) return;
    var qq = s.q, show = qq && tt >= qq.t;
    q.hidden = !show; q.classList.toggle('plain', !!(qq && qq.txt)); q.classList.toggle('yes', !!(qq && qq.yn && tt >= qq.yn));
  }
  function labels() {
    var s = S[type], qq = s.q; media.setAttribute('aria-label', T(ARIA[type])); media.setAttribute('data-scene', type);
    if (qL) { qL.textContent = qq ? (qq.txt || T(qq.k)) : ''; qY.textContent = T('js.yes'); qN.textContent = T('js.no'); }
  }
  function resize() { W = media.clientWidth; if (!W) return; H = W * 330 / 600; dpr = Math.min(2, w.devicePixelRatio || 1); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); if (!raf) render(); }
  function render() { var tt = reduce ? S[type].still : t; draw(tt); ui(tt); }
  function frame(now) {
    raf = 0; if (!visible || d.hidden || reduce || hold) { last = 0; return; }
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now; t += dt; if (t >= L) { t -= L; trail.length = 0; }
    render(); raf = requestAnimationFrame(frame);
  }
  function run() { if (!raf && visible && !d.hidden && !reduce && !hold) raf = requestAnimationFrame(frame); }
  function set(ty, mir) { if (!S[ty]) return; type = ty; mirror = !!mir; t = 0; trail.length = 0; labels(); render(); }

  d.addEventListener('clip:preview', function (e) { set(e.detail.type, e.detail.mirror); });
  d.addEventListener('i18n:ready', labels);
  // seek(sn): sahneyi o ana alıp durdurur (test/ekran görüntüsü); seek(null): döngüye devam
  function seek(a) { if (a == null) { hold = false; last = 0; run(); return; } hold = true; t = a; trail.length = 0; render(); }
  // konum(tür, sn): o andaki oyuncu ve pak konumları (aynalanmamış pist birimi) — e2e hokey kuralı denetimleri (ofsayt, gol, faceoff, ceza) bunu örnekler
  function konum(ty, tt) {
    var s = S[ty]; if (!s) return null; var pk = puckAt(s, tt);
    return { h: s.h.map(function (k) { return at(k, tt); }), a: s.a.map(function (k) { return at(k, tt); }), pak: pk ? pk.p : null, taraf: pk ? pk.side : null };
  }
  w.HA_KLIP = { set: set, seek: seek, scene: function () { return type; }, konum: konum, sahneler: Object.keys(S), sure: L, golAni: S.goal.goalAt };
  if ('ResizeObserver' in w) new ResizeObserver(resize).observe(media); else w.addEventListener('resize', resize);
  if ('IntersectionObserver' in w) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) run(); }, { threshold: 0.05 }).observe(media); else { visible = true; run(); }
  d.addEventListener('visibilitychange', run);
  var tab = d.querySelector('#clipTabs [aria-selected=true]'); set(tab ? tab.getAttribute('data-type') : 'goal', false); resize();
})();
