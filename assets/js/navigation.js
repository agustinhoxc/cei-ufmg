/* ==========================================================================
   CEI/UFMG — navigation.js
   Mega-menu (desktop), menu mobile, estados ativos
   ========================================================================== */
(function () {
  'use strict';
  var CEI = window.CEI;
  var doc = document;
  var header = CEI.$('.site-header');
  if (!header) return;

  /* ---------- Mega-menu ---------- */
  var items = CEI.$$('.nav-item.has-mega');
  var closeTimer = null;
  function closeAll(except) {
    items.forEach(function (it) {
      if (it === except) return;
      it.classList.remove('is-open');
      var b = it.querySelector('.nav-link');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }
  function open(it) {
    closeAll(it);
    it.classList.add('is-open');
    var b = it.querySelector('.nav-link');
    if (b) b.setAttribute('aria-expanded', 'true');
  }
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  items.forEach(function (it) {
    var btn = it.querySelector('.nav-link');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (it.classList.contains('is-open')) closeAll(); else open(it);
    });
    if (finePointer) {
      it.addEventListener('mouseenter', function () { clearTimeout(closeTimer); open(it); });
      it.addEventListener('mouseleave', function () { closeTimer = setTimeout(function () { closeAll(); }, 180); });
    }
    it.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeAll(); btn.focus(); }
      if (e.key === 'ArrowDown' && doc.activeElement === btn) {
        e.preventDefault(); open(it);
        var first = it.querySelector('.mega a'); if (first) first.focus();
      }
    });
    it.addEventListener('focusout', function (e) {
      if (!it.contains(e.relatedTarget)) it.classList.remove('is-open'), btn.setAttribute('aria-expanded', 'false');
    });
  });
  doc.addEventListener('click', function (e) { if (!e.target.closest('.nav-item.has-mega')) closeAll(); });

  /* ---------- Menu mobile ---------- */
  var toggle = CEI.$('.menu-toggle');
  var menu = CEI.$('.mobile-menu');
  function setMenu(openState) {
    header.classList.toggle('is-open', openState);
    doc.body.classList.toggle('menu-open', openState);
    if (toggle) {
      toggle.setAttribute('aria-expanded', openState ? 'true' : 'false');
      toggle.setAttribute('aria-label', openState ? 'Fechar menu' : 'Abrir menu');
    }
    if (menu) menu.hidden = !openState;
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(!header.classList.contains('is-open')); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && header.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });
    CEI.$$('.m-toggle', menu).forEach(function (b) {
      b.addEventListener('click', function () {
        var sub = doc.getElementById(b.getAttribute('aria-controls'));
        var on = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', on ? 'true' : 'false');
        if (sub) sub.classList.toggle('is-open', on);
      });
    });
    CEI.$$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    CEI.$$('[data-agent-open]', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1180 && header.classList.contains('is-open')) setMenu(false); });
  }
})();
