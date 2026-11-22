// contact-guard.js — client-side abuse limits for the public contact form.
// NOTE: this only slows casual abuse. Real protection must be configured in the EmailJS dashboard
// (allowed domains, reCAPTCHA, monthly quota) — see SECURITY-CHANGES.md.
(function () {
  'use strict';
  var COOLDOWN_MS = 60 * 1000;
  var lang = (document.documentElement.lang || 'ar').slice(0, 2);
  var MSG = lang === 'ar'
    ? { wait: 'يرجى الانتظار قليلًا قبل إرسال رسالة أخرى.', email: 'يرجى إدخال بريد إلكتروني صحيح.' }
    : { wait: 'Please wait a moment before sending another message.', email: 'Please enter a valid email address.' };
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('contactForm');
    if (!form) return;
    var limits = { senderName: 100, senderEmail: 150, senderPhone: 30, senderMessage: 2000 };
    Object.keys(limits).forEach(function (id) { var el = document.getElementById(id); if (el) el.maxLength = limits[id]; });
    // honeypot: invisible to people, filled by naive bots
    var hp = document.createElement('input');
    hp.type = 'text'; hp.name = 'website'; hp.tabIndex = -1; hp.autocomplete = 'off';
    hp.setAttribute('aria-hidden', 'true');
    hp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;';
    form.appendChild(hp);
    var status = document.getElementById('formStatus');
    function say(text) { if (status) { status.className = 'mt-4 p-4 rounded-xl text-center font-semibold text-sm bg-red-100 text-red-700'; status.textContent = text; } }
    form.addEventListener('submit', function (e) {
      if (hp.value) { e.stopImmediatePropagation(); e.preventDefault(); return; }               // bot: silently drop
      var email = (document.getElementById('senderEmail') || {}).value || '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { e.stopImmediatePropagation(); e.preventDefault(); say(MSG.email); return; }
      var last = 0; try { last = Number(localStorage.getItem('contactLastSend') || 0); } catch (_) {}
      if (Date.now() - last < COOLDOWN_MS) { e.stopImmediatePropagation(); e.preventDefault(); say(MSG.wait); return; }
      try { localStorage.setItem('contactLastSend', String(Date.now())); } catch (_) {}
    }, true);
  });
})();
