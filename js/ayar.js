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
   (tools/site-yayin-hazirla.sh, SATIS_ACIK = false iken yayın kopyasından mesafeli-satis ve refunds sayfalarını da çıkarır.) */
(function () {
  'use strict';
  var INDIRME_ACIK = false;
  var SATIS_ACIK = false; // true: Premium satın alma bağlantıları + iade/mesafeli satış bağlantıları görünür
  var PORTAL_ADRESI = ''; // INDIRME_ACIK true olunca portalın adresi (örn. 'https://portal.hockeycut.com')
  window.HA_AYAR = { PORTAL_ADRESI: PORTAL_ADRESI, INDIRME_ACIK: INDIRME_ACIK, SATIS_ACIK: SATIS_ACIK };

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
      return;
    }
    // Kapalı kip: çalışmayan adrese giden hiçbir bağlantı kalmaz
    root.classList.add('indirme-kapali');
    kaldir(d.getElementById('dlForm'));      // e-posta formu (alan, rıza, düğme)
    kaldir(d.getElementById('dlSub'));       // "e-postanı yaz, bağlantıyı gönderelim" cümlesi
    kaldir(d.querySelector('.wait'));        // Windows bekleme listesi (e-posta toplamıyoruz)
    d.querySelectorAll('a[data-portal]').forEach(function (a) {
      // Premium / kayıt: indirme bölümüne kaydır; ödeme geçiş animasyonu (data-hk-odeme) çalışmasın
      a.removeAttribute('data-portal'); a.removeAttribute('data-hk-odeme'); a.setAttribute('href', '#download');
    });
    // SSS "hangi bilgisayar": "bekleme listesine katıl" cümlesi olmayan metin (tr/en çevirisi faq.a3k)
    var a3 = d.querySelector('[data-i18n="faq.a3"]');
    if (a3) { a3.setAttribute('data-i18n', 'faq.a3k'); a3.textContent = 'A Mac with Apple Silicon (M1 or newer). There is no Windows version yet.'; }
  }
  // Betik sayfa sonunda yüklenir: öğeler hazır; i18n yüklemeden ÖNCE çalışsın diye hemen çağrılır
  bagla();
})();
