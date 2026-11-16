/* HockeyCut site v2 — küçük i18n katmanı.
   Varsayılan: sayfaya gömülü İngilizce metin. ?lang=xx verilirse i18n/xx.json yüklenir (anahtar → metin).
   Çeviri ekibi: i18n/en.json'u kopyalayıp i18n/<kod>.json yapar, sonra READY listesine kodu ekler.
   Öznitelikler: data-i18n (metin), data-i18n-aria (aria-label), data-i18n-ph (placeholder). */
(function () {
  'use strict';
  var READY = ['en', 'tr', 'de', 'ru', 'es', 'fr', 'it', 'nl', 'cs', 'sk', 'sl', 'hr', 'bg', 'zh', 'ko', 'ja']; // çevirisi tamamlanan dil kodları (dil menüsünde etkin olur)
  var BETA = ['bg', 'ko', 'hr', 'sl', 'sk', 'zh']; // ana dil konuşan kontrolü bekleyen diller: menüde "beta" etiketi
  var RTL = ['ar', 'he', 'fa'];

  // Dinamik (JS ile üretilen) metinlerin İngilizce varsayılanları
  var JS = {
    'js.goal': 'Goal', 'js.shotc': 'Shot candidate', 'js.turnc': 'Turnover candidate', 'js.faceoff': 'Faceoff', 'js.pp': 'Power play', 'js.pk': 'Penalty kill',
    'js.entry': 'Zone entry', 'js.exit': 'D-zone exit', 'js.home': 'Home', 'js.away': 'Away', 'js.tagged': 'Auto-tagged', 'js.cand': 'candidate',
    'js.z.oz': 'Offensive zone', 'js.z.nz': 'Neutral zone', 'js.z.dz': 'Defensive zone', 'js.z.c': 'Center ice',
    'js.foDz': 'Defensive zone',
    'js.cpFo': 'Clip length {d}', 'js.cpCand': 'Clip length {d} · candidate: answer Yes or No',
    'js.auto': 'auto', 'js.cpDesc': 'Clip length {d} · tagged automatically',
    'js.perNote': 'Ring = goal', 'js.foDot': '{n} faceoffs at this dot', 'js.zone': 'Zone', 'js.foN': 'Faceoffs',
    // klip animasyonu (KT-518)
    'js.yes': 'Yes', 'js.no': 'No', 'js.qShot': 'Shot?', 'js.qTurn': 'Turnover?',
    'js.aria.goal': 'Animated demo scene: a pass, a shot, and the puck goes into the net; the goal light comes on.',
    'js.aria.pp': 'Animated demo scene: one player sits in the penalty box, the teams line up 5 on 4 and the puck is passed around.',
    'js.aria.faceoff': 'Animated demo scene: the puck is dropped at the faceoff dot and the players spread out.',
    'js.aria.entry': 'Animated demo scene: the puck carrier crosses the blue line into the offensive zone.',
    'js.aria.exit': 'Animated demo scene: the puck leaves the defensive zone over the blue line.',
    'js.aria.shot': 'Animated demo scene: a shot goes to the net and the goalie stops it; a Shot? Yes / No prompt appears and Yes is chosen.',
    'js.aria.turn': 'Animated demo scene: the puck changes to the other team; a Turnover? Yes / No prompt appears and Yes is chosen.',
    // indirme formu iletileri (KT-512)
    'dl.soon': 'Downloads open very soon.', 'dl.sending': 'Sending…', 'dl.ok': 'We have sent the download link to your e-mail.',
    'dl.errMail': 'Please enter a valid e-mail address.', 'dl.errRiza': 'Please tick the consent box to receive the link.',
    'dl.errBad': 'We could not accept this request. Check your e-mail address and the consent box.',
    // lig kapısı (KT-532)
    'dl.lig.ph': 'Select your league', 'dl.lig.none': 'My league is not listed', 'dl.lig.ok': 'We work with this league.',
    'dl.lig.yok': "We can't serve this league yet. HockeyCut works with the league's official game sheet; more leagues are being added.",
    'dl.lig.sec': 'Please choose your league first.', 'dl.errLigSec': 'Please choose your league first.', 'dl.errTakim': 'Please enter your team name (at least 2 characters).',
    'dl.errMany': 'Too many requests. Please try again in a little while.', 'dl.errNet': 'We could not reach the server. Please try again later.',
    'dl.okT': 'Link sent', 'dl.okB': 'We have sent the download link to your e-mail address. If it does not arrive within a few minutes, please check your spam folder. The link is valid for 72 hours.', 'dl.okKapat': 'OK'
  };
  var dict = {};

  function fmt(s, vars) { return vars ? s.replace(/\{(\w+)\}/g, function (m, k) { return k in vars ? vars[k] : m; }) : s; }
  function t(key, vars) { var s = dict[key] != null ? dict[key] : JS[key] != null ? JS[key] : key; return fmt(s, vars); }

  function apply(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = dict[el.getAttribute('data-i18n')]; if (v == null) return;
      var tgt = el.querySelector(':scope > .lni') || el; tgt.textContent = v;
    });
    root.querySelectorAll('[data-i18n-aria]').forEach(function (el) { var v = dict[el.getAttribute('data-i18n-aria')]; if (v != null) el.setAttribute('aria-label', v); });
    root.querySelectorAll('[data-i18n-ph]').forEach(function (el) { var v = dict[el.getAttribute('data-i18n-ph')]; if (v != null) el.setAttribute('placeholder', v); });
    root.querySelectorAll('[data-i18n-alt]').forEach(function (el) { var v = dict[el.getAttribute('data-i18n-alt')]; if (v != null) el.setAttribute('alt', v); });
  }

  // Varsayılan İngilizce sözlüğü sayfadan topla (en.json üretimi ve denetim için)
  function collect() {
    var out = {};
    document.querySelectorAll('[data-i18n]').forEach(function (el) { out[el.getAttribute('data-i18n')] = el.textContent.trim().replace(/\s+/g, ' '); });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) { out[el.getAttribute('data-i18n-aria')] = el.getAttribute('aria-label'); });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) { out[el.getAttribute('data-i18n-ph')] = el.getAttribute('placeholder'); });
    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) { out[el.getAttribute('data-i18n-alt')] = el.getAttribute('alt'); });
    Object.keys(JS).forEach(function (k) { out[k] = JS[k]; });
    return out;
  }

  function enableMenu() {
    document.querySelectorAll('.lang-list .soon[lang]').forEach(function (s) {
      var code = s.getAttribute('lang'); if (READY.indexOf(code) < 0) return;
      var a = document.createElement('a'); a.href = '?lang=' + code; a.lang = code; a.textContent = s.firstChild.textContent.trim();
      if (BETA.indexOf(code) >= 0) { var b = document.createElement('i'); b.className = 'lc'; b.textContent = 'beta'; a.appendChild(b); }
      s.parentNode.replaceChild(a, s);
    });
  }

  var lang = (new URLSearchParams(location.search).get('lang') || 'en').toLowerCase().replace(/[^a-z-]/g, '').slice(0, 8);
  window.HA_I18N = { t: t, apply: apply, collect: collect, lang: 'en' };

  function done() { document.dispatchEvent(new CustomEvent('i18n:ready', { detail: { lang: window.HA_I18N.lang } })); }
  document.addEventListener('DOMContentLoaded', enableMenu);
  if (lang === 'en' || !window.fetch) return;
  fetch('i18n/' + lang + '.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    dict = d; window.HA_I18N.lang = lang;
    var html = document.documentElement; html.lang = lang; html.dir = RTL.indexOf(lang) >= 0 ? 'rtl' : 'ltr';
    var go = function () {
      apply(document);
      var cur = document.querySelector('.lang-btn span'); if (cur) cur.textContent = lang.toUpperCase();
      document.querySelectorAll('.lang-list [aria-current]').forEach(function (a) { a.removeAttribute('aria-current'); });
      var me = document.querySelector('.lang-list a[lang="' + lang + '"]'); if (me) me.setAttribute('aria-current', 'true');
      done();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  }).catch(function () { /* dosya yoksa İngilizce kalır */ });
})();
