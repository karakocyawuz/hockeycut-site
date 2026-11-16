/* HockeyCut site v2 — TEK YAPILANDIRMA NOKTASI (KT-512, KT-530).
   Yayın durumu yalnız burada değişir; HTML'de sabit adres yok.

   INDIRME_ACIK = false (şimdilik): portal ve imzalı kurulum dosyası henüz yok; canlı sitede e-posta TOPLANMAZ.
     - e-posta formu (#dlForm) ve Windows bekleme listesi sayfadan kaldırılır, yerine "İndirme çok yakında açılıyor." satırı gelir;
     - "İndir" düğmeleri #download bölümüne kaydırır; "Premium'a geç" ve data-portal taşıyan bağlantılar da #download'a gider.
   Açmak için: INDIRME_ACIK = true ve PORTAL_ADRESI = 'https://…' (portal adresi). Her şey önceki hâline döner.

   SATIS_ACIK = false (şimdilik, KT-539): ücretli satış YOK (şirket yok, ödeme altyapısı yok; lisans anahtarı elle verilir).
     - fiyat kartındaki Premium satın alma düğmesi tıklanmaz "Yakında" etiketine dönüşür (kart ve özellik listesi kalır);
     - kahramandaki "Premium: ayda 10 $" satırı, alt bilgideki Premium ve İade / Mesafeli satış bağlantıları kalkar;
     - SSS "Ücretsiz ve Premium nasıl işler?" cevabı kapalı kip metnine (faq.a5k) döner.
   Açmak için: SATIS_ACIK = true → bugünkü davranış aynen gelir. İki bayrak birbirinden bağımsızdır.
   (tools/site-yayin-hazirla.sh, SATIS_ACIK = false iken yayın kopyasından mesafeli-satis ve refunds sayfalarını da çıkarır.)

   WINDOWS_ACIK = true (16 Kasım 2026, kullanıcı "aç o zaman indirebileyim"): indirme kartındaki "Bilgisayarınız" seçiminde Windows indirilebilir
     (portal platform:"win" isteğini yalnız INDIR_WIN_URL tanımlıyken kabul eder). "Yalnız Mac / Windows yolda" metinleri Windows'u da anan
     anahtarlara (…W, faq.a3w) döner. false: Windows seçilince "henüz yok" notu çıkar, form gizlenir; metinler eski hâline döner. */
(function () {
  'use strict';
  var INDIRME_ACIK = true;   // 16 Kasım 2026: Mac 0.1.0 imzalı + Apple onaylı; portal INDIR_MAC_URL tanımlı (kullanıcı "yayımla")
  var SATIS_ACIK = false; // true: Premium satın alma bağlantıları + iade/mesafeli satış bağlantıları görünür
  var PORTAL_ADRESI = 'https://portal.hockeycut.com'; // INDIRME_ACIK true iken portalın adresi
  var BEKLEME_ACIK = false; // Windows bekleme listesi: portaldaki /bekleme sayfası vekilde kapalı → açık kipte de düğme gösterilmez (yoksa kullanıcı #download'a geri döner)
  var WINDOWS_ACIK = true; // 16 Kasım 2026: Windows 0.1.0 (imzasız kurulum, SmartScreen notu sayfada) — portal INDIR_WIN_URL tanımlı olmalı
  window.HA_AYAR = { PORTAL_ADRESI: PORTAL_ADRESI, INDIRME_ACIK: INDIRME_ACIK, SATIS_ACIK: SATIS_ACIK, BEKLEME_ACIK: BEKLEME_ACIK, WINDOWS_ACIK: WINDOWS_ACIK };

  var d = document;
  function kaldir(el) { if (el && el.parentNode) el.parentNode.removeChild(el); }

  // Satış kapalı: satın alma / iade çağrısı hiçbir yerde görünmez (INDIRME_ACIK'tan bağımsız; data-portal yeniden yazılmadan ÖNCE çalışır)
  function satisKapali() {
    d.documentElement.classList.add('satis-kapali');
    kaldir((d.querySelector('[data-i18n="hero.meta2"]') || {}).parentNode); // "Premium: ayda 10 $"
    d.querySelectorAll('a[data-portal^="/kayit?plan=pro"]').forEach(function (a) {
      if (!a.closest('.plan')) { kaldir(a); return; } // alt bilgideki Premium bağlantısı
      var s = d.createElement('span'); // fiyat kartı: tıklanmayan etiket
      s.className = 'btn btn-ghost plan-soon'; s.setAttribute('data-i18n', 'pr.pro.soon'); s.textContent = 'Coming soon';
      a.parentNode.replaceChild(s, a);
    });
    d.querySelectorAll('a[data-tr="yasal/mesafeli-satis.html"], a[href="yasal/en/refunds.html"]').forEach(kaldir); // iade / mesafeli satış
    var a5 = d.querySelector('[data-i18n="faq.a5"]');
    if (a5) { a5.setAttribute('data-i18n', 'faq.a5k'); a5.textContent = 'Free: 2 games, available today. After each game you answer its Yes/No candidates and the next one opens. In return, your answers and short clips are sent to us for model training. Premium is not on sale yet.'; }
  }

  function bagla() {
    var root = d.documentElement;
    if (!SATIS_ACIK) satisKapali();
    if (INDIRME_ACIK) {
      // Açık kip: portal bağlantıları PORTAL_ADRESI + yol; form ve bekleme listesi görünür; "yakında" satırı kalkar
      root.classList.add('indirme-acik');
      var kok = PORTAL_ADRESI.replace(/\/+$/, '');
      d.querySelectorAll('a[data-portal]').forEach(function (a) { a.setAttribute('href', kok + a.getAttribute('data-portal')); });
      kaldir(d.getElementById('dlSoon'));
      if (WINDOWS_ACIK) { kaldir(d.querySelector('.wait')); windowsVar(); return; }   // Windows indirilebilir: bekleme listesi anlamsız
      if (!BEKLEME_ACIK) { kaldir(d.querySelector('.wait')); windowsYok(); }   // Windows: bekleme listesi kapalıyken yalnız "henüz yok" bilgisi
      return;
    }
    // Kapalı kip: çalışmayan adrese giden hiçbir bağlantı kalmaz
    root.classList.add('indirme-kapali');
    kaldir(d.getElementById('dlForm'));      // e-posta formu (alan, rıza, düğme)
    kaldir(d.getElementById('dlSub'));       // "e-postanı yaz, bağlantıyı gönderelim" cümlesi
    kaldir(d.querySelector('.wait'));        // Windows bekleme listesi (e-posta toplamıyoruz)
    kaldir(d.getElementById('dlPlat'));      // Mac / Windows seçimi (indirme yok)
    d.querySelectorAll('a[data-portal]').forEach(function (a) {
      // Premium / kayıt: indirme bölümüne kaydır; ödeme geçiş animasyonu (data-hk-odeme) çalışmasın
      a.removeAttribute('data-portal'); a.removeAttribute('data-hk-odeme'); a.setAttribute('href', '#download');
    });
    windowsYok();
  }
  // SSS "hangi bilgisayar": "bekleme listesine katıl" cümlesi olmayan metin (tr/en çevirisi faq.a3k)
  function windowsYok() {
    var a3 = d.querySelector('[data-i18n="faq.a3"]');
    if (a3) { a3.setAttribute('data-i18n', 'faq.a3k'); a3.textContent = 'A Mac with Apple Silicon (M1 or newer). There is no Windows version yet.'; }
  }
  // WINDOWS_ACIK: "yalnız Mac / Windows yolda" diyen metinler Windows'u da anan anahtarlara döner (çeviriler i18n/<dil>.json; İngilizcesi burada ve i18n.js'te)
  var WIN_METIN = {
    'hero.eyebrow': ['hero.eyebrowW', 'Video analysis for ice hockey · runs on Mac and Windows'],
    'hero.meta3': ['hero.meta3W', 'The full game stays on your computer'],
    'cta.dl': ['cta.dlW', 'Download'],
    'pr.free.cta': ['cta.dlW', 'Download'],
    'pr.pro.note': ['pr.pro.noteW', 'Runs on Macs with Apple Silicon and on Windows 10/11 (64-bit).'],
    'end.sub': ['end.subW', 'Enter your e-mail and we send you the download link.'],
    'dl.note': ['dl.noteW', 'The link works for 72 hours.'],
    'faq.a3': ['faq.a3w', 'A Mac with Apple Silicon (M1 or newer), or a PC with Windows 10 or 11 (64-bit). On Windows the analysis is faster with a graphics card; without one it runs on the processor and takes longer.']
  };
  function windowsVar() {
    Object.keys(WIN_METIN).forEach(function (k) {
      d.querySelectorAll('[data-i18n="' + k + '"]').forEach(function (el) {
        el.setAttribute('data-i18n', WIN_METIN[k][0]);
        var tgt = el.querySelector(':scope > .lni') || el; tgt.textContent = WIN_METIN[k][1];   // i18n.apply ile aynı hedef (simgeli düğmelerde metin kutusu)
      });
    });
  }
  // Betik sayfa sonunda yüklenir: öğeler hazır; i18n yüklemeden ÖNCE çalışsın diye hemen çağrılır
  bagla();
})();
