/* HockeyCut site v2 — sayfa davranışları: menü, dil menüsü, belirme, ışık takibi, adım çizgisi, klip listesi, SSS (indirme formu: indir.js) */
(function () {
  'use strict';
  var d = document, w = window, T = function (k, v) { return w.HA_I18N ? w.HA_I18N.t(k, v) : k; };
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = w.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };

  /* Üst menü: kayınca cam arka plan */
  var nav = $('#nav');
  var onScroll = function () { nav.classList.toggle('scrolled', w.scrollY > 8); };
  onScroll();

  /* Mobil menü */
  var tog = $('#navToggle'), links = $('#navLinks');
  function closeNav() { links.classList.remove('open'); tog.setAttribute('aria-expanded', 'false'); }
  tog.addEventListener('click', function () { var o = !links.classList.contains('open'); links.classList.toggle('open', o); tog.setAttribute('aria-expanded', String(o)); if (o) { var f = links.querySelector('a'); f && f.focus(); } });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });

  /* Dil menüsü */
  var lb = $('.lang-btn'), ll = $('#langList');
  function closeLang() { ll.hidden = true; lb.setAttribute('aria-expanded', 'false'); }
  lb.addEventListener('click', function () { var o = ll.hidden; ll.hidden = !o; lb.setAttribute('aria-expanded', String(o)); if (o) { var a = ll.querySelector('a'); a && a.focus(); } });
  d.addEventListener('click', function (e) { if (!e.target.closest('#lang')) closeLang(); if (!e.target.closest('#navLinks') && !e.target.closest('#navToggle')) closeNav(); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (!ll.hidden) { closeLang(); lb.focus(); } if (links.classList.contains('open')) { closeNav(); tog.focus(); } } });

  /* Hero başlığı: satır maskesi için iç span */
  $$('.hero-title .ln').forEach(function (ln) { var s = d.createElement('span'); s.className = 'lni'; while (ln.firstChild) s.appendChild(ln.firstChild); ln.appendChild(s); });

  /* Kaydırınca belirme — varsayılan görünür; html.js varken gizli başlar */
  var items = $$('.rv').concat($$('.hero-title'));
  function show(el) { el.classList.add('in'); }
  if (reduce || !('IntersectionObserver' in w)) items.forEach(show);
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }); }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
    items.forEach(function (el) { io.observe(el); });
    // Güvenlik: 1,5 sn sonra ekranda ya da yukarıda kalan her şey görünür olur
    setTimeout(function () { items.forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) show(el); }); }, 1500);
    w.addEventListener('beforeprint', function () { items.forEach(show); });
  }

  /* Işık takibi yalnız fiyat kartlarında (karar anı); 3B eğim yok (KT-420) */
  $$('.plan').forEach(function (el) {
    if (!fine) return;
    var raf = 0, ev = null, tilt = false;
    el.addEventListener('pointermove', function (e) {
      ev = e; if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0; var r = el.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top;
        el.style.setProperty('--mx', x + 'px'); el.style.setProperty('--my', y + 'px'); el.classList.add('lit');
        if (tilt && el.classList.contains('in')) { el.style.transition = 'transform .2s ease-out'; el.style.transform = 'perspective(900px) rotateX(' + ((0.5 - y / r.height) * 5).toFixed(2) + 'deg) rotateY(' + ((x / r.width - 0.5) * 5).toFixed(2) + 'deg)'; }
      });
    });
    el.addEventListener('pointerleave', function () { el.classList.remove('lit'); if (tilt) { el.style.transition = 'transform .6s cubic-bezier(.2,.8,.2,1)'; el.style.transform = ''; } });
  });

  /* Adım çizgisi kaydırdıkça çizilir */
  var steps = $('#steps'), stepMax = 0;
  function stepProgress() {
    if (!steps) return;
    if (reduce) { steps.style.setProperty('--p', 1); return; }
    var r = steps.getBoundingClientRect(), p = (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.25);
    p = Math.max(stepMax, Math.min(1, p)); stepMax = p; steps.style.setProperty('--p', p.toFixed(3));
  }
  var ticking = false;
  w.addEventListener('scroll', function () { if (ticking) return; ticking = true; requestAnimationFrame(function () { ticking = false; onScroll(); stepProgress(); }); }, { passive: true });
  stepProgress();

  /* Klip listesi (demo veri) — uygulamadaki olay listesi biçimi: tür · takım · periyot/saat · süre; renkler app/ui/tasarim/tema.css grupları */
  // cand: true → şut/turnover ADAY: kullanıcı Evet/Hayır ile onaylar (KT-512 §6)
  var TYPES = {
    goal: { k: 'js.goal', c: '#6FA8FF', i: 'i-ev-goal' }, pp: { k: 'js.pp', c: '#FF7A72', i: 'i-ev-pp' }, faceoff: { k: 'js.faceoff', c: '#B4BCB6', i: 'i-ev-fo' },
    entry: { k: 'js.entry', c: '#6FA8FF', i: 'i-ev-entry' }, exit: { k: 'js.exit', c: '#F2A256', i: 'i-ev-exit' },
    shot: { k: 'js.shotc', c: '#6FA8FF', i: 'i-ev-shot', cand: true }, turn: { k: 'js.turnc', c: '#B4BCB6', i: 'i-ev-turn', cand: true }
  };
  // [takım h/a, periyot·saat, süre, ek] ek: faceoff → bölge anahtarı (kazanan gösterilmez); pp → [güç, tür]. Şut ve turnover: aday
  var CLIPS = {
    goal: [['h', 'P1 04:12', '0:12'], ['a', 'P2 07:48', '0:11'], ['h', 'P3 13:01', '0:12']],
    turn: [['h', 'P1 07:19', '0:09'], ['a', 'P2 02:33', '0:08'], ['h', 'P3 11:40', '0:08']],
    shot: [['h', 'P1 02:47', '0:10'], ['h', 'P1 08:30', '0:12'], ['a', 'P1 11:05', '0:09'], ['h', 'P2 03:19', '0:11'], ['a', 'P2 09:52', '0:10'], ['h', 'P3 06:14', '0:12']],
    faceoff: [['h', 'P1 00:00', '0:08', 'js.z.c'], ['h', 'P1 06:41', '0:12', 'js.z.oz'], ['a', 'P2 01:58', '0:07', 'js.z.dz'], ['h', 'P2 10:33', '0:06', 'js.z.nz'], ['a', 'P3 04:05', '0:09', 'js.z.nz']],
    pp: [['h', 'P2 15:20', '2:00', ['5v4', 'js.pp']], ['h', 'P2 17:31', '1:46', ['4v5', 'js.pk']], ['h', 'P3 08:02', '0:40', ['5v3', 'js.pp']]],
    entry: [['h', 'P1 03:12', '0:08'], ['h', 'P1 09:44', '0:07'], ['a', 'P2 06:20', '0:08'], ['h', 'P3 01:37', '0:06']],
    exit: [['h', 'P1 05:03', '0:07'], ['a', 'P1 14:26', '0:08'], ['h', 'P2 12:09', '0:06'], ['a', 'P3 09:15', '0:07']]
  };
  var tabs = $$('#clipTabs [role=tab]'), list = $('#clipList'), pv = $('#clipPreview'), panel = $('#clipPanel');
  var curType = 'goal', curIdx = 0;
  function team(x) { return T(x === 'h' ? 'js.home' : 'js.away'); }
  function parts(type, c) { // uygulamanın sade biçimi
    var ty = TYPES[type], name = T(ty.k), p = [name];
    if (type === 'faceoff') p.length = 1, p.push(T(c[3])); // takım ve kazanan yok: yalnız bölge
    else if (type === 'pp') { p[0] = T(c[3][1]); p.push(c[3][0], team(c[0])); }
    if (type !== 'faceoff' && type !== 'pp') p.push(team(c[0]));
    return p;
  }
  function preview(type, i, anim) {
    var c = CLIPS[type][i], ty = TYPES[type]; curIdx = i;
    $$('button', list).forEach(function (b, j) { b.setAttribute('aria-current', j === i ? 'true' : 'false'); });
    var tb = $('#cpType'); tb.textContent = type === 'pp' ? T(c[3][1]) : T(ty.k); tb.style.setProperty('--c', ty.c);
    var tm = $('#cpTeam'); tm.textContent = type === 'faceoff' ? '' : team(c[0]); tm.className = 'team ' + (type === 'faceoff' ? 'x' : c[0]); tm.hidden = type === 'faceoff';
    $('#cpWhen').textContent = c[1];
    $('#cpTitle').textContent = parts(type, c).concat(c[1]).join(' · ');
    $('#cpDesc').textContent = T(ty.cand ? 'js.cpCand' : type === 'faceoff' ? 'js.cpFo' : 'js.cpDesc', { d: c[2] });
    var yn = $('#cpYn'); if (yn) yn.hidden = !ty.cand; // Evet/Hayır yalnız adaylarda
    $('#cpMedia').style.setProperty('--c', ty.c);
    // klip animasyonu (js/klip-anim.js): sahne olay türüne göre; deplasman klipleri aynalanır
    d.dispatchEvent(new CustomEvent('clip:preview', { detail: { type: type, idx: i, mirror: c[0] === 'a' } }));
    pv.classList.remove('swap'); void pv.offsetWidth; if (anim) pv.classList.add('swap');
  }
  function renderList(type, anim) {
    curType = type; list.innerHTML = ''; var ty = TYPES[type];
    CLIPS[type].forEach(function (c, i) {
      var li = d.createElement('li'), b = d.createElement('button');
      b.type = 'button'; b.className = 'cc'; b.style.setProperty('--c', ty.c); if (anim) b.style.animationDelay = (i * 45) + 'ms'; else b.style.animation = 'none';
      b.innerHTML = '<span class="cc-th"><svg aria-hidden="true"><use href="#' + ty.i + '"/></svg></span><span class="cc-b"><span class="cc-top"><span class="tbadge"></span><span class="team"></span><em class="chip"></em></span><span class="cc-meta mono"></span></span><span class="cd mono"></span>';
      var pr = parts(type, c);
      b.querySelector('.tbadge').textContent = pr[0];
      var tm = b.querySelector('.team'); if (type === 'faceoff') tm.remove(); else { tm.textContent = team(c[0]); tm.classList.add(c[0]); }
      var ch = b.querySelector('.chip'); ch.textContent = T(ty.cand ? 'js.cand' : 'js.auto'); // KT-434: faceoff kazananı üründe yok
      b.querySelector('.cc-meta').textContent = [c[1]].concat(type === 'faceoff' ? pr.slice(1) : type === 'pp' ? [pr[1]] : []).join(' · ');
      b.querySelector('.cd').textContent = c[2];
      b.addEventListener('click', function () { preview(type, i, true); });
      li.appendChild(b); list.appendChild(li);
    });
    preview(type, 0, anim);
  }
  function selectTab(tab, focus) {
    tabs.forEach(function (t) { var on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    panel.setAttribute('aria-labelledby', tab.id);
    if (focus) tab.focus();
    renderList(tab.getAttribute('data-type'), !reduce);
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = tabs.length, j = k === 'ArrowRight' ? (i + 1) % n : k === 'ArrowLeft' ? (i - 1 + n) % n : k === 'Home' ? 0 : k === 'End' ? n - 1 : -1;
      if (j >= 0) { e.preventDefault(); selectTab(tabs[j], true); }
    });
  });
  if (list) renderList('goal', false);
  d.addEventListener('i18n:ready', function () { renderList(curType, false); preview(curType, curIdx, false); });

  /* Yasal bağlantılar dile göre (KT-518): sayfa dili tr iken Türkçe taslaklar, diğer tüm dillerde yasal/en/ sayfaları (HTML varsayılanı İngilizce) */
  d.addEventListener('i18n:ready', function (e) {
    if (!e.detail || e.detail.lang !== 'tr') return;
    $$('a[data-tr]').forEach(function (a) { a.setAttribute('href', a.getAttribute('data-tr')); var k = a.getAttribute('data-i18n-tr'); if (k) a.setAttribute('data-i18n', k); });
    if (w.HA_I18N) w.HA_I18N.apply(d);
  });

  /* KT-528b: SSS "Hangi liglerin maç kâğıdı destekleniyor?" cevabındaki liste, #lgRows satırlarından doldurulur — liste TEK yerde (index.html .lg-row).
     Biçim: "Ülke: Lig, Lig; Ülke: Lig…". Dil değişince (i18n:ready) ülke adı / genel ifadelerin çevrilmiş metniyle yeniden yazılır. */
  function ligListesi() {
    var hedef = $('[data-lig-liste]'); if (!hedef) return;
    hedef.textContent = $$('#lgRows .lg-row').map(function (r) {
      return r.querySelector('.lg-ulke').textContent.trim() + ': ' + $$('.lg-chip', r).map(function (c) { return c.textContent.trim(); }).join(', ');
    }).join('; ');
  }
  ligListesi();
  d.addEventListener('i18n:ready', ligListesi);

  /* SSS akordeon */
  $$('.qa button').forEach(function (b) {
    b.addEventListener('click', function () { var o = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', String(o)); b.closest('.qa').classList.toggle('open', o); });
  });

})();
