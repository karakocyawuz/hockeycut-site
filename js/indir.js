/* HockeyCut site v2 — e-postayla indirme bağlantısı formu (KT-512 §5).
   POST {PORTAL_ADRESI}/api/indirme-istegi  {eposta, platform:"mac", riza:true}  → 200 {ok:true} (kayıtlı olsa da olmasa da aynı yanıt).
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

  form.addEventListener('submit', function (e) {
    e.preventDefault(); if (sending) return;
    var addr = mail.value.trim();
    invalid(mail, false); invalid(riza, false);
    if (!EPOSTA.test(addr)) { invalid(mail, true); say('dl.errMail'); mail.focus(); return; }
    if (!riza.checked) { invalid(riza, true); say('dl.errRiza'); riza.focus(); return; }
    var base = (w.HA_AYAR && w.HA_AYAR.PORTAL_ADRESI || '').replace(/\/+$/, '');
    sending = true; btn.disabled = true; btn.setAttribute('aria-busy', 'true'); say('dl.sending', true);
    fetch(base + '/api/indirme-istegi', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit',
      body: JSON.stringify({ eposta: addr, platform: 'mac', riza: true })
    }).then(function (r) {
      if (r.ok) { say('dl.ok', true); mail.value = ''; riza.checked = false; return; }
      if (r.status === 429) say('dl.errMany');
      else if (r.status === 400) say('dl.errBad');
      else say('dl.errNet');
    }).catch(function () { say('dl.errNet'); }).then(function () { sending = false; btn.disabled = false; btn.removeAttribute('aria-busy'); });
  });
  // yazmaya başlayınca hata işareti kalkar
  mail.addEventListener('input', function () { invalid(mail, false); });
  riza.addEventListener('change', function () { invalid(riza, false); });
})();
