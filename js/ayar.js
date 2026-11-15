/* HockeyCut site v2 — TEK YAPILANDIRMA NOKTASI (KT-512, KT-530).
   Yayın durumu yalnız burada değişir; HTML'de sabit adres yok.

   INDIRME_ACIK = false (şimdilik): portal ve imzalı kurulum dosyası henüz yok; canlı sitede e-posta TOPLANMAZ.
     - e-posta formu (#dlForm) ve Windows bekleme listesi sayfadan kaldırılır, yerine "İndirme çok yakında açılıyor." satırı gelir;
     - "İndir" düğmeleri #download bölümüne kaydırır; "Premium'a geç" ve data-portal taşıyan bağlantılar da #download'a gider.
   Açmak için: INDIRME_ACIK = true ve PORTAL_ADRESI = 'https://…' (portal adresi). Her şey önceki hâline döner. */
(function () {
  'use strict';
  var INDIRME_ACIK = false;
  var PORTAL_ADRESI = ''; // INDIRME_ACIK true olunca portalın adresi (örn. 'https://portal.hockeycut.com')
  window.HA_AYAR = { PORTAL_ADRESI: PORTAL_ADRESI, INDIRME_ACIK: INDIRME_ACIK };

  var d = document;
  function kaldir(el) { if (el && el.parentNode) el.parentNode.removeChild(el); }

  function bagla() {
    var root = d.documentElement;
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
