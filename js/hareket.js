/* HockeyCut — Ortak hareket katmanı (KT-393) · hareket.css ile birlikte.
   Mantık koduna dokunmaz: sayfadaki öğeleri seçicilerle bulur (MutationObserver + olay yetkilendirme), yalnız görünümü canlandırır.
   Bağımlılık YOK, dış istek YOK. Yalnız transform/opacity (SVG çizgi çizimi hariç: stroke-dashoffset, küçük SVG, bir kez).
   Kurallar: azaltılmış hareket → hiçbir şey çalışmaz (öğeler olduğu gibi kalır); video oynarken süsleme yok; sekme gizliyken yok.
   Genel API: window.HkHareket = { kur(cfg), sayac(el), konfeti(opt), parcacik(el), ayar(ad, acik), sakin() }
   Öznitelikler: data-hk-sayac · data-hk-egim [data-hk-egim-hedef=".sec"] · data-hk-cizgi · data-hk-odeme="durum metni" · data-hk-parcacik
   Esin (kopya değil): "Claude Motion Effects" gönderisindeki fikirler; anthropics/skills frontend-design ilkeleri (az ve amaçlı hareket). */
(function (w, d) {
  'use strict';
  if (w.HkHareket) return;
  var mq = w.matchMedia ? w.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var anahtar = function (ad) { return 'hk-hareket-' + ad; };
  function oku(ad) { try { return w.localStorage.getItem(anahtar(ad)); } catch (_) { return null; } }
  function yaz(ad, v) { try { w.localStorage.setItem(anahtar(ad), v); } catch (_) { /* depolama yok: sessizce geç */ } }

  /* ---- Genel denetimler ---- */
  function azalt() { return !!mq.matches; }
  function videoOynuyor() {
    var v = d.getElementsByTagName('video');
    for (var i = 0; i < v.length; i++) if (!v[i].paused && !v[i].ended && v[i].readyState > 2) return true;
    return false;
  }
  function sakin() { return azalt() || d.hidden || oku('hepsi') === '0' || videoOynuyor(); }
  function dzmi(x) { return x >= '0' && x <= '9'; }
  function kare(fn) { return w.requestAnimationFrame ? w.requestAnimationFrame(fn) : setTimeout(fn, 16); }
  function varMi(f) { return typeof f === 'function'; }
  var EGRI = 'cubic-bezier(.16,1,.3,1)';
  function anim(el, kf, opt) { return el.animate ? el.animate(kf, opt) : null; }

  /* ================= 1. SAYI RULOSU ================= */
  var gorulen = {}; // anahtar → son metin: aynı değer yeniden çizilirse (ör. sekme yenilenince) tekrar yuvarlanmaz
  function rulo(el, anah) {
    if (sakin() || el.__hkRulo) return;
    var metin = el.textContent;
    if (!metin || metin.length > 14 || !/\d/.test(metin)) return;
    if (anah != null) { if (gorulen[anah] === metin) return; gorulen[anah] = metin; }
    var cs = w.getComputedStyle(el), renk = cs.color;
    if (cs.display === 'inline') el.style.display = 'inline-block';
    el.classList.add('hk-rulo-ana');
    // Yalnız tek düğümlü düz metin: ölçümü metin kutusundan al (ortalı/sağa dayalı metinde de hizalı kalır)
    var r0 = el.getBoundingClientRect(), rg = d.createRange(); rg.selectNodeContents(el);
    var tr = rg.getBoundingClientRect();
    if (!tr.height || !tr.width || el.children.length) { el.classList.remove('hk-rulo-ana'); return; }
    el.__hkRulo = true;
    var H = tr.height;
    var kat = d.createElement('span'); kat.className = 'hk-rulo'; kat.setAttribute('aria-hidden', 'true');
    var ks = kat.style;
    ks.left = (tr.left - r0.left).toFixed(2) + 'px'; ks.top = (tr.top - r0.top).toFixed(2) + 'px';
    ks.color = renk; ks.webkitTextFillColor = renk; ks.setProperty('--hk-rh', H.toFixed(2) + 'px');
    var seritler = [], hedef = [];
    for (var i = 0; i < metin.length; i++) {
      var ch = metin.charAt(i), s = d.createElement('span');
      if (dzmi(ch)) {
        s.className = 'hk-k'; var st = d.createElement('span'); st.className = 'hk-ks'; s.appendChild(st);
        seritler.push(st); hedef.push(+ch);
      } else { s.className = 'hk-c'; s.setAttribute('data-c', ch); }
      kat.appendChild(s);
    }
    el.appendChild(kat);
    var bitti = 0, toplam = seritler.length, temizlendi = false;
    function temizle() {
      if (temizlendi) return; temizlendi = true;
      if (kat.parentNode) kat.parentNode.removeChild(kat);
      el.classList.remove('hk-rulo-ana'); el.__hkRulo = false;
    }
    seritler.forEach(function (st, k) {
      var n = hedef[k], yol = n === 0 ? 10 : n; // 0 da tam tur döner; öbür rakamlar 0'dan hedefe
      var a = anim(st, [{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(0,' + (-yol * H) + 'px,0)' }],
        { duration: 620 + k * 70, delay: k * 55, easing: EGRI, fill: 'both' });
      if (!a) { temizle(); return; }
      a.onfinish = function () { if (++bitti >= toplam) temizle(); };
    });
    setTimeout(temizle, 1800 + toplam * 130); // güvenlik: ne olursa olsun özgün metin geri gelir
  }

  /* ================= 2. ÇİZGİ ÇİZİMİ / ÇUBUK BÜYÜMESİ ================= */
  var cizilen = {};
  function cizgiCiz(svg, o, anah) {
    if (sakin() || svg.__hkCizgi) return;
    var kimlik = (o.sec || '') + '|' + (svg.getAttribute('aria-label') || '');
    if (o.bir !== false && cizilen[kimlik]) return;
    cizilen[kimlik] = true; svg.__hkCizgi = true;
    var sira = 0, sonra = o.sonra ? [].slice.call(svg.querySelectorAll(o.sonra)) : [];
    if (o.cizgi) [].slice.call(svg.querySelectorAll(o.cizgi)).forEach(function (e) {
      var cs = w.getComputedStyle(e);
      if (cs.stroke === 'none' || (cs.strokeDasharray && cs.strokeDasharray !== 'none')) return; // kesikli çizgiler olduğu gibi kalır
      e.setAttribute('pathLength', '1');
      var a = anim(e, [{ strokeDasharray: '1 1', strokeDashoffset: 1 }, { strokeDasharray: '1 1', strokeDashoffset: 0 }],
        { duration: o.sure || 900, delay: Math.min(sira++ * 22, 500), easing: EGRI, fill: 'backwards' });
      var kaldir = function () { e.removeAttribute('pathLength'); };
      if (a) a.onfinish = kaldir; else kaldir();
    });
    if (o.bar) [].slice.call(svg.querySelectorAll(o.bar)).forEach(function (e, i) {
      e.style.transformBox = 'fill-box'; e.style.transformOrigin = '50% 100%';
      var a = anim(e, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 700, delay: 80 + i * 60, easing: EGRI, fill: 'backwards' });
      var temiz = function () { e.style.transformBox = ''; e.style.transformOrigin = ''; };
      if (a) a.onfinish = temiz; else temiz();
    });
    sonra.forEach(function (e, i) {
      anim(e, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: (o.sure || 900) * 0.7 + i * 80, easing: 'linear', fill: 'backwards' });
    });
  }

  /* ================= 3. EĞİM (glass tilt) — yetkilendirilmiş, yalnız fare ================= */
  var egimler = [], aktifEgim = null, egimKare = 0, sonOlay = null;
  function egimSifirla(a) {
    if (!a) return; var t = a.hedef;
    t.style.transition = 'transform .5s ' + EGRI; t.style.transform = 'translate3d(0,0,0)';
    setTimeout(function () { if (!aktifEgim || aktifEgim.hedef !== t) { t.style.transform = ''; t.style.transition = ''; } }, 560);
  }
  function egimBul(hedefEl) {
    for (var i = 0; i < egimler.length; i++) {
      var c = egimler[i], kok = hedefEl.closest && hedefEl.closest(c.kok);
      if (kok) return { kok: kok, hedef: c.hedef ? (kok.querySelector(c.hedef) || kok) : kok, derece: c.derece || 3 };
    }
    return null;
  }
  function egimUygula() {
    egimKare = 0; var e = sonOlay; if (!e) return;
    if (sakin()) { egimSifirla(aktifEgim); aktifEgim = null; return; }
    var b = egimBul(e.target);
    if (!b) { egimSifirla(aktifEgim); aktifEgim = null; return; }
    if (aktifEgim && aktifEgim.kok !== b.kok) egimSifirla(aktifEgim);
    aktifEgim = b;
    var r = b.kok.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    b.hedef.style.transition = 'transform 120ms ease-out';
    b.hedef.style.transform = 'perspective(800px) rotateX(' + (-y * 2 * b.derece).toFixed(2) + 'deg) rotateY(' + (x * 2 * b.derece).toFixed(2) + 'deg) scale3d(1.02,1.02,1)';
  }
  d.addEventListener('pointermove', function (e) {
    if (!egimler.length || e.pointerType !== 'mouse') return;
    sonOlay = e; if (!egimKare) egimKare = kare(egimUygula);
  }, { passive: true });
  d.addEventListener('pointerleave', function () { sonOlay = null; egimSifirla(aktifEgim); aktifEgim = null; });
  d.addEventListener('mouseout', function (e) { if (!e.relatedTarget) { sonOlay = null; egimSifirla(aktifEgim); aktifEgim = null; } });

  /* ================= 4. KONFETİ (burst) ================= */
  var RENKLER = ['#22C55E', '#4ADE80', '#39FF88', '#86EFAC', '#ECE6D6', '#F5CD5B', '#15803D'];
  var sonKonfeti = 0;
  function konfeti(opt) {
    opt = opt || {};
    if (sakin() || oku('konfeti') === '0') return false;
    var simdi = Date.now(); if (simdi - sonKonfeti < 4000) return false; sonKonfeti = simdi;
    var ox = w.innerWidth / 2, oy = w.innerHeight * 0.38;
    if (opt.kaynak && opt.kaynak.getBoundingClientRect) { var r = opt.kaynak.getBoundingClientRect(); ox = r.left + r.width / 2; oy = r.top + r.height / 2; }
    var kap = d.createElement('div'); kap.className = 'hk-konfeti'; kap.setAttribute('aria-hidden', 'true');
    var N = opt.adet || 34, bitenler = 0;
    for (var i = 0; i < N; i++) {
      var p = d.createElement('i'), ac = (-90 + (Math.random() - 0.5) * 150) * Math.PI / 180, hiz = 140 + Math.random() * 220;
      var bo = 5 + Math.random() * 5, dx = Math.cos(ac) * hiz, dy = Math.sin(ac) * hiz, don = (Math.random() - 0.5) * 900;
      var ps = p.style, kisa = Math.random() < 0.5;
      ps.width = bo + 'px'; ps.height = (kisa ? bo : bo * 2) + 'px'; ps.background = RENKLER[i % RENKLER.length]; ps.borderRadius = Math.random() < 0.3 ? '50%' : '1px';
      kap.appendChild(p);
      var a = anim(p, [
        { transform: 'translate3d(' + ox + 'px,' + oy + 'px,0) rotate(0deg)', opacity: 1 },
        { transform: 'translate3d(' + (ox + dx * 0.55) + 'px,' + (oy + dy * 0.55 - 20) + 'px,0) rotate(' + (don * 0.5) + 'deg)', opacity: 1, offset: 0.4 },
        { transform: 'translate3d(' + (ox + dx) + 'px,' + (oy + dy + 260) + 'px,0) rotate(' + don + 'deg)', opacity: 0 }
      ], { duration: 1100 + Math.random() * 700, delay: Math.random() * 120, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' });
      if (a) a.onfinish = function () { if (++bitenler >= N && kap.parentNode) kap.parentNode.removeChild(kap); };
    }
    d.body.appendChild(kap);
    setTimeout(function () { if (kap.parentNode) kap.parentNode.removeChild(kap); }, 3200);
    // Kapatma çipi: kalıcı tercih (localStorage); odağı çalmaz
    var cip = d.createElement('div'); cip.className = 'hk-kutlama';
    var yz = d.createElement('span'); yz.textContent = opt.mesaj || 'Analiz tamamlandı';
    var dg = d.createElement('button'); dg.type = 'button'; dg.textContent = opt.kapatMetni || 'Kutlamayı kapat';
    dg.addEventListener('click', function () { yaz('konfeti', '0'); kapat(); });
    cip.appendChild(yz); cip.appendChild(dg); d.body.appendChild(cip);
    function kapat() { if (!cip.parentNode) return; cip.classList.add('cik'); setTimeout(function () { if (cip.parentNode) cip.parentNode.removeChild(cip); }, 240); }
    setTimeout(kapat, 6000);
    return true;
  }

  /* ================= 5. PARÇACIK → LOGO ================= */
  function parcacik(el) {
    if (sakin() || !el || !el.getBoundingClientRect) return;
    try { if (w.sessionStorage.getItem('hk-parcacik')) return; w.sessionStorage.setItem('hk-parcacik', '1'); } catch (_) { /* oturum depolaması yok: yine de çalış */ }
    var r = el.getBoundingClientRect(); if (!r.width) return;
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2, kap = d.createElement('div'), N = 16, bit = 0;
    kap.className = 'hk-parcacik'; kap.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < N; i++) {
      var p = d.createElement('i'), ac = (i / N) * Math.PI * 2 + Math.random() * 0.4, uz = 70 + Math.random() * 90;
      kap.appendChild(p);
      var a = anim(p, [
        { transform: 'translate3d(' + (cx + Math.cos(ac) * uz) + 'px,' + (cy + Math.sin(ac) * uz) + 'px,0) scale(.6)', opacity: 0 },
        { opacity: 1, offset: 0.25 },
        { transform: 'translate3d(' + cx + 'px,' + cy + 'px,0) scale(1.1)', opacity: 0.9 }
      ], { duration: 900, delay: 150 + i * 28, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'both' });
      if (a) a.onfinish = function () { if (++bit >= N) { if (kap.parentNode) kap.parentNode.removeChild(kap); anim(el, [{ transform: 'scale(1)' }, { transform: 'scale(1.14)' }, { transform: 'scale(1)' }], { duration: 420, easing: EGRI }); } };
    }
    d.body.appendChild(kap);
    setTimeout(function () { if (kap.parentNode) kap.parentNode.removeChild(kap); }, 2600);
  }

  /* ================= 6. ÖDEME DÜĞMESİ (button → pay) ================= */
  d.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-hk-odeme]');
    if (!b || b.__hkOdeme || e.defaultPrevented) return;
    var href = b.tagName === 'A' ? b.getAttribute('href') : null;
    if (!href || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button || (b.target && b.target !== '_self') || azalt() || sakin()) return;
    e.preventDefault(); b.__hkOdeme = true;
    var ek = d.createElement('span'); ek.className = 'hk-od'; ek.setAttribute('aria-hidden', 'true');
    ek.innerHTML = '<span class="hk-don"></span><svg class="hk-tik" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
    b.appendChild(ek);
    var durum = d.createElement('span'); durum.className = 'hk-sr'; durum.setAttribute('role', 'status'); b.appendChild(durum);
    b.setAttribute('aria-busy', 'true'); b.classList.add('hk-yukleniyor');
    setTimeout(function () { durum.textContent = b.getAttribute('data-hk-odeme') || ''; }, 30);
    setTimeout(function () { b.classList.remove('hk-yukleniyor'); b.classList.add('hk-tamam'); }, 600);
    setTimeout(function () { w.location.href = href; }, 950);
    // Geri düğmesiyle dönülürse (sayfa önbellekten gelir) düğme sıfırlansın
    w.addEventListener('pageshow', function once(ev) { if (!ev.persisted) return; w.removeEventListener('pageshow', once); b.classList.remove('hk-yukleniyor', 'hk-tamam'); b.removeAttribute('aria-busy'); b.__hkOdeme = false; [ek, durum].forEach(function (x) { if (x.parentNode) x.parentNode.removeChild(x); }); });
  });

  /* ================= 7. KİNETİK BAŞLIK ================= */
  function kinetik(el, satirSirasi) {
    if (el.__hkKin || azalt()) return;
    var metin = el.textContent; if (!metin || metin.indexOf('<') >= 0 || el.children.length) return;
    el.__hkKin = true; el.textContent = '';
    var kelimeler = metin.split(/\s+/).filter(Boolean);
    kelimeler.forEach(function (k, i) {
      var s = d.createElement('span'); s.className = 'hk-kw'; s.style.setProperty('--hk-w', i); s.style.setProperty('--hk-s', satirSirasi || 0);
      s.textContent = k; el.appendChild(s); if (i < kelimeler.length - 1) el.appendChild(d.createTextNode(' '));
    });
    var kok = el.closest('.hero-title') || el.parentNode; if (kok.classList) kok.classList.add('hk-kin');
  }

  /* ================= KAYIT DEFTERİ ================= */
  var sayacSec = [{ sec: '[data-hk-sayac]' }];
  var cizgiSec = [{ sec: 'svg[data-hk-cizgi]', cizgi: 'line,path,polyline,circle', bar: null }];
  var kuyruk = [], kuyrukKare = 0, io = null;

  function gozle(el, fn) {
    if (!('IntersectionObserver' in w)) { fn(); return; }
    if (!io) io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (!en.isIntersecting) return; io.unobserve(en.target); var f = en.target.__hkFn; en.target.__hkFn = null; if (f) f(); });
    }, { threshold: 0.2 });
    el.__hkFn = fn; io.observe(el);
  }
  function anahtarSayac(el, c, idx) {
    var et = varMi(c.etiket) ? c.etiket(el) : null; if (et == null) return null;
    var p = el.parentNode, s = p ? [].indexOf.call(p.children, el) : 0;
    return c.sec + '|' + String(et).slice(0, 60) + '|' + s + '|' + idx;
  }
  function incele(dugum) {
    if (dugum.nodeType !== 1) return;
    sayacSec.forEach(function (c, ci) {
      var l = dugum.matches && dugum.matches(c.sec) ? [dugum] : [];
      l = l.concat([].slice.call(dugum.querySelectorAll ? dugum.querySelectorAll(c.sec) : []));
      l.forEach(function (el) { if (el.__hkSayacGor) return; el.__hkSayacGor = true; gozle(el, function () { rulo(el, anahtarSayac(el, c, ci)); }); });
    });
    cizgiSec.forEach(function (c) {
      var l = dugum.matches && dugum.matches(c.sec) ? [dugum] : [];
      l = l.concat([].slice.call(dugum.querySelectorAll ? dugum.querySelectorAll(c.sec) : []));
      l.forEach(function (el) { if (el.__hkCizgiGor) return; el.__hkCizgiGor = true; gozle(el, function () { cizgiCiz(el, c); }); });
    });
  }
  function bosalt() {
    kuyrukKare = 0; var l = kuyruk; kuyruk = [];
    if (azalt()) return;
    l.forEach(incele);
  }
  var gozcu = w.MutationObserver ? new MutationObserver(function (ms) {
    if (azalt()) return;
    for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) if (ms[i].addedNodes[j].nodeType === 1) kuyruk.push(ms[i].addedNodes[j]);
    if (kuyruk.length && !kuyrukKare) kuyrukKare = kare(bosalt);
  }) : null;

  /* Konfeti tetikleyicisi: mantık koduna dokunmadan, "Video hazır" gibi bildirimin görünmesini izler */
  function konfetiIzle(c) {
    var hedef = d.querySelector(c.gozle); if (!hedef || !w.MutationObserver) return;
    new MutationObserver(function () {
      var m = (hedef.textContent || '').trim(); if (c.eslesme.test(m)) konfeti({ kaynak: hedef, mesaj: c.mesaj, kapatMetni: c.kapatMetni });
    }).observe(hedef, { childList: true, characterData: true, subtree: true });
  }

  function kur(cfg) {
    cfg = cfg || {};
    (cfg.sayac || []).forEach(function (c) { sayacSec.push(typeof c === 'string' ? { sec: c } : c); });
    (cfg.cizgi || []).forEach(function (c) { cizgiSec.push(c); });
    (cfg.egim || []).forEach(function (c) { egimler.push(c); });
    (cfg.kinetik || []).forEach(function (s) {
      var uygula = function () { d.querySelectorAll(s).forEach(function (el, i) { kinetik(el, i); }); };
      uygula(); d.addEventListener('i18n:ready', function () { d.querySelectorAll(s).forEach(function (el) { if (!el.children.length) el.__hkKin = false; }); uygula(); });
    });
    (cfg.parcacik || []).forEach(function (s) { var el = d.querySelector(s); if (el) kare(function () { parcacik(el); }); });
    if (cfg.konfeti) konfetiIzle({ gozle: cfg.konfeti.gozle, eslesme: cfg.konfeti.eslesme, mesaj: cfg.konfeti.mesaj, kapatMetni: cfg.konfeti.kapatMetni });
    kuyruk.push(d.documentElement); if (!kuyrukKare) kuyrukKare = kare(bosalt);
  }

  // Öznitelik tabanlı öğeler: kur() çağrılmasa da çalışır
  function baslat() {
    if (gozcu) gozcu.observe(d.documentElement, { childList: true, subtree: true });
    d.querySelectorAll('[data-hk-egim]').forEach(function (el) { egimler.push({ kok: '[data-hk-egim]', hedef: el.getAttribute('data-hk-egim-hedef') }); });
    var ilk = d.querySelector('[data-hk-parcacik]'); if (ilk) kare(function () { parcacik(ilk); });
    kuyruk.push(d.documentElement); if (!kuyrukKare) kuyrukKare = kare(bosalt);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', baslat); else baslat();

  w.HkHareket = {
    kur: kur, sakin: sakin,
    sayac: function (el) { rulo(el, null); },
    konfeti: konfeti, parcacik: parcacik,
    ayar: function (ad, acik) { yaz(ad, acik ? '1' : '0'); }
  };
})(window, document);
