/* HockeyCut site v2 — e-postayla indirme bağlantısı formu (KT-512 §5).
   POST {PORTAL_ADRESI}/api/indirme-istegi  {eposta, platform:"mac"|"win", riza:true, lig_kodu, lig_adi, takim, dil} (KT-532; "win" 16 Kasım, js/ayar.js WINDOWS_ACIK)  → 200 {ok:true} (kayıtlı olsa da olmasa da aynı yanıt).
   Çerez/kimlik bilgisi gönderilmez (credentials: omit). Mesajlar aria-live alanına yazılır; metinler i18n sözlüğünden gelir. */
(function () {
  'use strict';
  var d = document, w = window, T = function (k) { return w.HA_I18N ? w.HA_I18N.t(k) : k; };
  var form = d.getElementById('dlForm'); if (!form) return;
  var mail = d.getElementById('dlEmail'), riza = d.getElementById('dlRiza'), btn = d.getElementById('dlBtn'), msg = d.getElementById('dlMsg');
  var EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var sending = false;

  function say(key, ok) { msg.textContent = T(key); msg.className = 'dl-msg ' + (ok ? 'ok' : 'err'); }
  function invalid(el, on) { if (on) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); }

  /* 16 Kasım 2026: platform seçimi (Mac / Windows). Varsayılan ziyaretçinin işletim sistemi. Windows kapalıyken (WINDOWS_ACIK=false)
     Windows seçilince "henüz yok" notu çıkar, lig sorusu ve form gizlenir (CSS: .plat-yok). Açıkken Windows seçilince SmartScreen notu (.plat-win). */
  var WIN = !!(w.HA_AYAR && w.HA_AYAR.WINDOWS_ACIK), plat = 'mac';
  var pk = d.getElementById('dlPlat'), kart = pk && (pk.closest('.end') || pk.parentNode);
  function platSec(p, odak) {
    if (!pk) return; plat = p;
    pk.querySelectorAll('[data-plat]').forEach(function (b) { var on = b.getAttribute('data-plat') === p; b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; if (on && odak) b.focus(); });
    kart.classList.toggle('plat-mac', p === 'mac'); kart.classList.toggle('plat-yok', p === 'win' && !WIN); kart.classList.toggle('plat-win', p === 'win' && WIN);
    if (msg.textContent && !sending) { msg.textContent = ''; msg.className = 'dl-msg'; }
  }
  if (pk) {
    if (!WIN) { var ws = d.getElementById('dlPlatWinS'); if (ws) { ws.setAttribute('data-i18n', 'dl.plat.winSoon'); ws.textContent = 'Coming soon'; } }
    pk.addEventListener('click', function (e) { var b = e.target.closest('[data-plat]'); if (b) platSec(b.getAttribute('data-plat'), false); });
    pk.addEventListener('keydown', function (e) {   // radyo grubu: oklar seçimi değiştirir
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) < 0 || !e.target.closest('[data-plat]')) return;
      e.preventDefault(); platSec(plat === 'mac' ? 'win' : 'mac', true);
    });
    var ua = (w.navigator.userAgentData && w.navigator.userAgentData.platform) || w.navigator.userAgent || '';
    platSec(/Windows/i.test(ua) ? 'win' : 'mac', false);
  }
  /* Intel Mac sürümü yayında: surum.json'a "mac_intel": {"son","adres"} eklenince <html> sınıfı .intel-hazir olur (aynı kaynak: güncelleme bildirgesi).
     Mac düğmesinin alt yazısı Intel'i de kapsar, "hazırlanıyor" notu yerine kısa bilgi (+ Intel sürümünün sınırı) gelir; fiyat notu ve SSS cevabı da Intel'i anar.
     Metinler data-i18n anahtarı değiştirilerek yenilenir (i18n.js sonradan yüklenirse apply() yeni anahtarı kullanır; önce yüklenmişse T() ile hemen yazılır).
     intel-hazir DEĞİLKEN hiçbir şey değişmez. Windows kapalı kipte (WINDOWS_ACIK=false) pr.pro.note / faq.a3 anahtarları bu listede yok → onlara dokunulmaz. */
  var INTEL_METIN = [['dl.plat.macS', 'dl.plat.macSI'], ['dl.plat.macIntel', 'dl.plat.macIntelOk'], ['pr.pro.noteW', 'pr.pro.noteI'], ['faq.a3w', 'faq.a3i'], ['dl.note', 'dl.noteW']];
  function intelHazir() {
    d.documentElement.classList.add('intel-hazir');
    INTEL_METIN.forEach(function (c) {
      d.querySelectorAll('[data-i18n="' + c[0] + '"]').forEach(function (el) { el.setAttribute('data-i18n', c[1]); el.textContent = T(c[1]); });
    });
  }
  if (pk && w.fetch) fetch('surum.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
    if (j && j.mac_intel && j.mac_intel.adres) intelHazir();
  }).catch(function () { /* dosya yoksa "hazırlanıyor" notu görünür kalır */ });
  w.HA_INDIR_PLATFORM = function () { return plat; };   // e2e

  /* Başarı bildirimi: ortada açılan pencere (<dialog>, odak düğmede, Esc / Tamam / dışarı tık kapatır; kapanınca odak lig sorusuna döner) */
  var dlg = null;
  function bildirim() {
    if (!dlg) {
      dlg = d.createElement('dialog'); dlg.className = 'hk-bildirim'; dlg.id = 'dlBildirim'; dlg.setAttribute('aria-labelledby', 'dlBildirimT'); dlg.setAttribute('aria-describedby', 'dlBildirimB');
      var ic = d.createElement('div'); ic.className = 'hk-bildirim-ic';
      var ik = d.createElement('div'); ik.className = 'hk-bildirim-ikon'; ik.setAttribute('aria-hidden', 'true'); ik.textContent = '\u2713';
      var h = d.createElement('h2'); h.id = 'dlBildirimT'; h.setAttribute('data-i18n', 'dl.okT');
      var b = d.createElement('p'); b.id = 'dlBildirimB'; b.setAttribute('data-i18n', 'dl.okB');
      var k = d.createElement('button'); k.type = 'button'; k.className = 'btn btn-primary'; k.setAttribute('data-i18n', 'dl.okKapat');
      k.addEventListener('click', function () { dlg.close(); });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });   // pencere dışına tık
      dlg.addEventListener('close', function () { var ls = d.getElementById('dlLig'); if (ls) { try { ls.focus({ preventScroll: true }); } catch (x) { ls.focus(); } } });
      ic.appendChild(ik); ic.appendChild(h); ic.appendChild(b); ic.appendChild(k); dlg.appendChild(ic); d.body.appendChild(dlg);
    }
    dlg.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = T(el.getAttribute('data-i18n')); });
    if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
    var kb = dlg.querySelector('button'); if (kb) kb.focus();
  }
  w.HA_INDIR_BILDIRIM = bildirim;   // e2e
  form.addEventListener('submit', function (e) {
    e.preventDefault(); if (sending) return;
    if (plat === 'win' && !WIN) { say('dl.plat.winYok'); return; }   // Windows kapalı: form zaten gizli; yine de istek gitmez
    var addr = mail.value.trim();
    invalid(mail, false); invalid(riza, false);
    // KT-532: önce lig sorusu — listedeki bir lig seçilmeden ve takım yazılmadan istek gitmez
    var lig = w.HA_LIG || {}, tk = ((d.getElementById('dlTakim') || {}).value || '').trim();
    if (lig.durum !== 'secili') { say(lig.durum === 'desteklenmiyor' ? 'dl.lig.yok' : 'dl.errLigSec'); var ls = d.getElementById('dlLig'); if (ls) ls.focus(); return; }
    if (tk.length < 2 || tk.length > 80) { var te = d.getElementById('dlTakim'); invalid(te, true); say('dl.errTakim'); te.focus(); return; }
    if (!EPOSTA.test(addr)) { invalid(mail, true); say('dl.errMail'); mail.focus(); return; }
    if (!riza.checked) { invalid(riza, true); say('dl.errRiza'); riza.focus(); return; }
    var base = (w.HA_AYAR && w.HA_AYAR.PORTAL_ADRESI || '').replace(/\/+$/, '');
    sending = true; btn.disabled = true; btn.setAttribute('aria-busy', 'true'); say('dl.sending', true);
    fetch(base + '/api/indirme-istegi', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit',
      body: JSON.stringify({ eposta: addr, platform: plat, riza: true, lig_kodu: lig.kod, lig_adi: lig.ad, takim: tk, dil: (w.HA_I18N && w.HA_I18N.lang) || 'en' })   // dil: e-posta Türkçe mi İngilizce mi (portal: tr dışı → en)
    }).then(function (r) {
      if (r.ok) { say('dl.ok', true); mail.value = ''; riza.checked = false; if (w.HA_LIG && w.HA_LIG.sifirla) w.HA_LIG.sifirla(); bildirim(); return; }   // kullanıcı 16 Kasım: alanlar boşalsın + açılır bildirim
      if (r.status === 429) say('dl.errMany');
      else if (r.status === 400) return r.json().then(function (j) { say(j && j.hata === 'lig_desteklenmiyor' ? 'dl.lig.yok' : j && j.hata === 'platform_hazir_degil' ? 'dl.plat.winYok' : 'dl.errBad'); }, function () { say('dl.errBad'); });
      else say('dl.errNet');
    }).catch(function () { say('dl.errNet'); }).then(function () { sending = false; btn.disabled = false; btn.removeAttribute('aria-busy'); });
  });
  // yazmaya başlayınca hata işareti kalkar
  mail.addEventListener('input', function () { invalid(mail, false); });
  riza.addEventListener('change', function () { invalid(riza, false); });
})();
