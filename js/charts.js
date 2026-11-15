/* HockeyCut site v2 — kütüphanesiz SVG grafikler (demo veri). KT-512: şut haritası YOK (şut/turnover aday olarak gelir, nokta çizilmez).
   1) periyot başına bölge girişi + gol (takım bazında), 2) faceoff paneli (9 nokta, daire boyu = faceoff sayısı; kazanan YOK) + OZ/NZ/DZ sayı tablosu. */
(function () {
  'use strict';
  var d = document, w = window, NS = 'http://www.w3.org/2000/svg';
  var T = function (k, v) { return w.HA_I18N ? w.HA_I18N.t(k, v) : k; };
  var HOME = '#ECE6D6', AWAY = '#EE86C4', FOS = '#39FF88'; // app/ui/tasarim/tema.css: --hk-takim-a, --hk-takim-b, --hk-fosfor
  function el(tag, attrs, parent) { var e = d.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function tipFor(host) { var t = host.querySelector('.tip'); if (!t) { t = d.createElement('div'); t.className = 'tip'; t.setAttribute('aria-hidden', 'true'); host.appendChild(t); } return t; }
  function showTip(host, x, y, title, sub) { var t = tipFor(host); t.innerHTML = '<b></b><span></span>'; t.firstChild.textContent = title; t.lastChild.textContent = sub; t.style.left = x + 'px'; t.style.top = y + 'px'; t.classList.add('on'); }
  function hideTip(host) { var t = host.querySelector('.tip'); if (t) t.classList.remove('on'); }
  function hover(g, host, title, sub) {
    function on() { var r = g.getBoundingClientRect(), h = host.getBoundingClientRect(); showTip(host, r.left - h.left + r.width / 2, r.top - h.top, title(), sub()); }
    g.addEventListener('pointerenter', on); g.addEventListener('focus', on);
    g.addEventListener('pointerleave', function () { hideTip(host); }); g.addEventListener('blur', function () { hideTip(host); });
  }

  /* ---- 1. Periyot başına bölge girişi ve gol (takım bazında) ---- */
  var PER = [[7, 1, 5, 0], [9, 1, 6, 1], [6, 1, 8, 1]]; // [ev bölge girişi, ev gol, dep bölge girişi, dep gol]
  function perBars() {
    var host = d.getElementById('perBars'); if (!host) return; host.innerHTML = '';
    var W = 320, H = 270, pb = 26, pt = 22, ih = H - pt - pb, max = 10, gw = W / 3;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': PER.map(function (p, i) { return 'P' + (i + 1) + ': ' + T('js.home') + ' ' + p[0] + ' / ' + p[1] + ', ' + T('js.away') + ' ' + p[2] + ' / ' + p[3]; }).join('; ') }, host);
    [0, 5, 10].forEach(function (v) { var y = pt + ih - v / max * ih; el('line', { x1: 0, x2: W, y1: y, y2: y, stroke: 'rgba(255,255,255,.07)' }, svg); });
    PER.forEach(function (p, i) {
      [[p[0], p[1], HOME, -1], [p[2], p[3], AWAY, 1]].forEach(function (b, j) {
        var bw = 30, x = gw * i + gw / 2 + (j ? 4 : -4 - bw), h = b[0] / max * ih, y = pt + ih - h;
        el('rect', { 'class': 'pb', x: x, y: y, width: bw, height: h, rx: 6, fill: b[2], 'fill-opacity': j ? 0.85 : 0.92, style: '--i:' + (i * 2 + j) }, svg);
        var t = el('text', { x: x + bw / 2, y: y - 7, 'text-anchor': 'middle', 'font-size': 11, fill: '#eef2ef', 'font-family': 'JetBrains Mono, monospace' }, svg); t.textContent = b[0];
        if (b[1]) { for (var k = 0; k < b[1]; k++) el('circle', { cx: x + bw / 2, cy: pt + ih - 9 - k * 12, r: 4.2, fill: 'none', stroke: FOS, 'stroke-width': 2 }, svg); }
      });
      var l = el('text', { x: gw * i + gw / 2, y: H - 6, 'text-anchor': 'middle', 'font-size': 11, fill: '#8d9891', 'font-family': 'JetBrains Mono, monospace' }, svg); l.textContent = 'P' + (i + 1);
    });
    var note = d.createElement('p'); note.className = 'per-note'; note.innerHTML = '<i></i><span></span>'; note.lastChild.textContent = T('js.perNote'); host.appendChild(note);
  }

  /* ---- 2. Faceoff paneli: 9 nokta, daire = faceoff sayısı; OZ/NZ/DZ tablosu (ev sahibi bakışı) ---- */
  var DOTS = [[300, 150, 12], [250, 80, 4], [250, 220, 5], [350, 80, 3], [350, 220, 4], [100, 80, 5], [100, 220, 4], [500, 80, 7], [500, 220, 6]];
  var ZONES = [['js.z.oz', 13, 8], ['js.z.nz', 28, 15], ['js.z.dz', 9, 4]];
  function foPanel() {
    var host = d.getElementById('foRink'), tab = d.getElementById('foTab'); if (!host) return; host.innerHTML = ''; tab.innerHTML = '';
    var svg = el('svg', { viewBox: '0 0 600 300', role: 'group', 'aria-label': T('an.foT') }, host);
    el('use', { href: '#rinkArt' }, svg);
    var max = Math.max.apply(null, DOTS.map(function (x) { return x[2]; }));
    DOTS.forEach(function (n, i) {
      var r = 10 + 20 * n[2] / max, lbl = function () { return T('js.foDot', { n: n[2] }); };
      var g = el('g', { 'class': 'fo-dot', tabindex: 0, role: 'img', 'aria-label': lbl(), style: '--i:' + i }, svg);
      el('circle', { cx: n[0], cy: n[1], r: r, fill: HOME, 'fill-opacity': 0.85, stroke: '#e5eef7', 'stroke-width': 2 }, g);
      var t = el('text', { x: n[0], y: n[1] + 5, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#0b0c0b', 'font-family': 'JetBrains Mono, monospace' }, g); t.textContent = n[2];
      hover(g, host, lbl, function () { return ''; });
    });
    var tb = d.createElement('table'); tb.innerHTML = '<thead><tr><th scope="col"></th><th scope="col"></th></tr></thead><tbody></tbody>';
    var hs = tb.querySelectorAll('th'); hs[0].textContent = T('js.zone'); hs[1].textContent = T('js.foN');
    ZONES.forEach(function (z) { var tr = d.createElement('tr'); tr.innerHTML = '<th scope="row"></th><td class="mono"></td>'; tr.children[0].textContent = T(z[0]); tr.children[1].textContent = z[1]; tb.tBodies[0].appendChild(tr); });
    tab.appendChild(tb);
  }

  function all() { perBars(); foPanel(); }
  all();
  d.addEventListener('i18n:ready', all);
})();
