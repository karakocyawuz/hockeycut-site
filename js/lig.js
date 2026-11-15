/* HockeyCut site v2 — lig kapısı (KT-532): satın alma / indirme öncesi "hangi lig, hangi takım".
   - Seçenekler TEK listeden, #lgRows satırlarından üretilir (ülke = <optgroup>, lig çipi = <option>); ikinci bir liste yoktur.
   - Durum (window.HA_LIG.durum): 'yok' (henüz seçilmedi) | 'secili' (listedeki lig) | 'desteklenmiyor' ("Ligim listede yok").
   - 'secili': e-posta formu (#dlSet) etkinleşir, Premium bağlantısına &lig=<kod> eklenir. Kapalı kipte yalnız olumlu satır görünür.
   - 'desteklenmiyor': form kilitli; Premium / İndir / ücretsiz düğmeleri ileri gitmez, sakin açıklama gösterilir.
   Sunucu da aynı kuralı uygular (portal/src/desteklenen-ligler.js); bu dosya yalnız kullanıcı deneyimidir, güvenlik sınırı değildir. */
(function () {
  'use strict';
  var d = document, w = window, T = function (k) { return w.HA_I18N ? w.HA_I18N.t(k) : k; };
  var sel = d.getElementById('dlLig'), box = d.getElementById('dlLigBox'), msg = d.getElementById('dlLigMsg'), takim = d.getElementById('dlTakim');
  var satirlar = d.getElementById('lgRows'); if (!sel || !box || !msg || !satirlar) return;
  var YOK = '__yok';
  var st = w.HA_LIG = { durum: 'yok', kod: '', ad: '' };
  var set = d.getElementById('dlSet'); // açık kipte var; kapalı kipte ayar.js formu kaldırır

  function seceneklerUret() {
    var onceki = sel.selectedIndex > 0 ? sel.selectedIndex : 0;
    sel.innerHTML = '';
    var ph = d.createElement('option'); ph.value = ''; ph.textContent = T('dl.lig.ph'); sel.appendChild(ph);
    Array.prototype.forEach.call(satirlar.querySelectorAll('.lg-row'), function (satir) {
      var g = d.createElement('optgroup'); g.label = satir.querySelector('.lg-ulke').textContent.trim();
      Array.prototype.forEach.call(satir.querySelectorAll('.lg-chip'), function (c) {
        var o = d.createElement('option'); o.value = satir.getAttribute('data-lg'); o.textContent = c.textContent.trim().replace(/^\+\s*/, ''); g.appendChild(o);
      });
      sel.appendChild(g);
    });
    var yok = d.createElement('option'); yok.value = YOK; yok.textContent = T('dl.lig.none'); sel.appendChild(yok);
    sel.selectedIndex = Math.min(onceki, sel.options.length - 1);
    guncelle(false);
  }

  function yaz(anahtar, sinif) { msg.textContent = anahtar ? T(anahtar) : ''; msg.className = 'dl-msg' + (sinif ? ' ' + sinif : ''); }

  // Premium bağlantısı: seçili lig koduyla (&lig=) — yalnız açık kipte data-portal bağlantıları vardır
  function premiumBaglanti() {
    Array.prototype.forEach.call(d.querySelectorAll('a[data-portal*="plan=pro"]'), function (a) {
      if (!a.hasAttribute('data-href0')) a.setAttribute('data-href0', a.getAttribute('href'));
      var h0 = a.getAttribute('data-href0');
      a.setAttribute('href', st.durum === 'secili' ? h0 + (h0.indexOf('?') < 0 ? '?' : '&') + 'lig=' + encodeURIComponent(st.kod) : h0);
    });
  }
  function kilitIsareti() {
    Array.prototype.forEach.call(d.querySelectorAll('a[data-portal], a[href="#download"]'), function (a) {
      if (a.id === 'waitLink') return;
      if (st.durum === 'desteklenmiyor') a.setAttribute('aria-disabled', 'true'); else a.removeAttribute('aria-disabled');
    });
  }

  function guncelle(duyur) {
    var o = sel.options[sel.selectedIndex];
    if (!o || !o.value) { st.durum = 'yok'; st.kod = ''; st.ad = ''; }
    else if (o.value === YOK) { st.durum = 'desteklenmiyor'; st.kod = ''; st.ad = ''; }
    else { st.durum = 'secili'; st.kod = o.value; st.ad = o.textContent.trim().slice(0, 80); }
    if (set) set.disabled = st.durum !== 'secili'; // lig seçilmeden e-posta alanı/düğme etkin olmaz
    if (st.durum === 'desteklenmiyor') sel.setAttribute('aria-invalid', 'true'); else sel.removeAttribute('aria-invalid');
    if (duyur !== false || st.durum !== 'yok') yaz(st.durum === 'secili' ? 'dl.lig.ok' : st.durum === 'desteklenmiyor' ? 'dl.lig.yok' : '', st.durum === 'secili' ? 'ok' : st.durum === 'desteklenmiyor' ? 'note' : '');
    box.setAttribute('data-durum', st.durum);
    premiumBaglanti(); kilitIsareti();
    d.dispatchEvent(new CustomEvent('lig:degisti', { detail: { durum: st.durum, kod: st.kod, ad: st.ad } }));
  }
  sel.addEventListener('change', function () { guncelle(true); });

  // Lig sorusuna götür: kaydır + seç kutusuna odaklan (hareket azaltma tercihine uyar)
  var azalt = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function soruyaGit() {
    box.scrollIntoView({ behavior: azalt ? 'auto' : 'smooth', block: 'center' });
    try { sel.focus({ preventScroll: true }); } catch (e) { sel.focus(); }
  }

  // İndir / Premium / ücretsiz düğmeleri (üst çubuk, hero, fiyat, alt bilgi): lig seçilmeden ileri gitmez.
  // Capture aşamasında çalışır: ödeme geçiş animasyonundan (data-hk-odeme) önce karar verilir.
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#download"], a[data-portal]');
    if (!a || a.id === 'waitLink' || st.durum === 'secili') return;
    var portal = a.hasAttribute('data-portal');
    if (st.durum === 'desteklenmiyor') { e.preventDefault(); e.stopPropagation(); yaz('dl.lig.yok', 'note'); soruyaGit(); return; }
    // henüz seçilmedi: portal bağlantıları (açık kip) gitmez; "#download" bağlantıları kendi kaydırmasını yapar, sonra soruya odaklanılır
    yaz('dl.lig.sec', 'note');
    if (portal) { e.preventDefault(); e.stopPropagation(); soruyaGit(); }
    else setTimeout(function () { try { sel.focus({ preventScroll: true }); } catch (x) { sel.focus(); } }, 50);
  }, true);

  seceneklerUret();
  d.addEventListener('i18n:ready', seceneklerUret); // dil değişince ülke/lig adları ve iletiler yeniden yazılır, seçim korunur
  if (takim) takim.addEventListener('input', function () { takim.removeAttribute('aria-invalid'); });
})();
