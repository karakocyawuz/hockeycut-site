/* HockeyCut site v2 — hareket katmanı ayarı (KT-393). hareket.js'ten sonra, main.js'ten sonra yüklenir (defer sırası).
   Yalnız seçici verir; davranış hareket.js'tedir. Tanıtım sitesi başlık: kinetik kelimeler; marka: parçacık → logo.
   Müşteri dilinde yazılar (i18n) bozulmaz: kinetik bölme i18n:ready ile yeniden uygulanır. */
(function () {
  'use strict';
  if (!window.HkHareket) return;
  window.HkHareket.kur({ kinetik: ['.hero-title .lni'] }); // KT-420: parçacık→logo süsü kaldırıldı
})();
