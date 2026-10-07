/* ==========================================================================
   CEI/UFMG — main.js
   Utilidades globais: header, reveal, contadores, modais, abas, formulários, toast
   ========================================================================== */
(function () {
  'use strict';

  var CEI = window.CEI = window.CEI || {};
  var doc = document;
  var root = doc.documentElement;
  CEI.base = root.getAttribute('data-base') || '';
  CEI.reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  CEI.$ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  CEI.$$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };
  CEI.escape = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  CEI.icon = function (name, cls) {
    var tpl = doc.getElementById('icon-' + name);
    if (!tpl) return '';
    var html = tpl.innerHTML.trim();
    if (cls) html = html.replace('class="icon"', 'class="icon ' + cls + '"');
    return html;
  };

  /* ---------- Toast ---------- */
  CEI.toast = function (text) {
    var region = CEI.$('.toast-region');
    if (!region) return;
    var t = doc.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.innerHTML = CEI.icon('check') + '<span>' + CEI.escape(text) + '</span>';
    region.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 3600);
    setTimeout(function () { t.remove(); }, 4000);
  };

  /* ---------- Header ao rolar ---------- */
  var header = CEI.$('.site-header');
  var fab = CEI.$('.fab');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 12);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Reveal ---------- */
  var reveals = CEI.$$('.reveal, .flow-item');
  if ('IntersectionObserver' in window && !CEI.reducedMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Contadores ---------- */
  function formatNum(n, dec) {
    return n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function runCounter(el) {
    var to = parseFloat(el.getAttribute('data-count-to'));
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    if (isNaN(to)) return;
    if (CEI.reducedMotion) { el.textContent = formatNum(to, dec); return; }
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatNum(to * eased, dec);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = CEI.$$('[data-count-to]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { cio.observe(c); });
  } else { counters.forEach(runCounter); }

  /* Barras animadas */
  var bars = CEI.$$('.bar-fill[data-w]');
  if ('IntersectionObserver' in window) {
    var bio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.style.width = e.target.getAttribute('data-w') + '%'; bio.unobserve(e.target); }
      });
    }, { threshold: 0.3 });
    bars.forEach(function (b) { bio.observe(b); });
  } else { bars.forEach(function (b) { b.style.width = b.getAttribute('data-w') + '%'; }); }

  /* ---------- Ano ---------- */
  CEI.$$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Modais (dialog) ---------- */
  var lastFocus = null;
  CEI.openDialog = function (dlg, opener) {
    if (!dlg) return;
    lastFocus = opener || doc.activeElement;
    if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); }
    else dlg.setAttribute('open', '');
    doc.body.classList.add('dialog-open');
    if (fab && dlg.classList.contains('drawer')) fab.classList.add('is-hidden');
  };
  CEI.closeDialog = function (dlg) {
    if (!dlg) return;
    if (typeof dlg.close === 'function' && dlg.open) dlg.close();
    else dlg.removeAttribute('open');
  };
  CEI.$$('dialog').forEach(function (dlg) {
    dlg.addEventListener('close', function () {
      if (!CEI.$$('dialog').some(function (d) { return d.open; })) doc.body.classList.remove('dialog-open');
      if (fab) fab.classList.remove('is-hidden');
      if (lastFocus && typeof lastFocus.focus === 'function') { try { lastFocus.focus(); } catch (e) {} }
    });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) CEI.closeDialog(dlg);
    });
  });
  doc.addEventListener('click', function (e) {
    var closer = e.target.closest('[data-close-dialog]');
    if (closer) { CEI.closeDialog(closer.closest('dialog')); return; }
    var opener = e.target.closest('[data-modal-open]');
    if (opener) {
      e.preventDefault();
      CEI.openDialog(doc.getElementById(opener.getAttribute('data-modal-open')), opener);
    }
  });

  /* ---------- Abas ---------- */
  CEI.$$('[role="tablist"]').forEach(function (list) {
    var tabs = CEI.$$('[role="tab"]', list);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = doc.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (k === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (k === 'Home') n = tabs[0];
        if (k === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  });

  /* ---------- Formulários ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function validateField(field) {
    var input = field.querySelector('input, select, textarea');
    if (!input) return true;
    var val = (input.type === 'checkbox') ? input.checked : String(input.value || '').trim();
    var ok = true, msg = '';
    if (input.required && !val) { ok = false; msg = input.getAttribute('data-msg-required') || 'Campo obrigatório.'; }
    else if (input.type === 'email' && val && !EMAIL_RE.test(val)) { ok = false; msg = 'Informe um e-mail válido.'; }
    else if (input.minLength > 0 && val && val.length < input.minLength) { ok = false; msg = 'Escreva pelo menos ' + input.minLength + ' caracteres.'; }
    field.classList.toggle('has-error', !ok);
    input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    var err = field.querySelector('.field-error');
    if (err) err.textContent = msg;
    return ok;
  }
  CEI.bindForm = function (form) {
    if (!form || form.__bound) return;
    form.__bound = true;
    form.setAttribute('novalidate', '');
    CEI.$$('.field', form).forEach(function (f) {
      var input = f.querySelector('input, select, textarea');
      if (input) input.addEventListener('blur', function () { if (f.classList.contains('has-error') || input.value) validateField(f); });
      if (input) input.addEventListener('input', function () { if (f.classList.contains('has-error')) validateField(f); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = CEI.$$('.field', form);
      var firstBad = null;
      fields.forEach(function (f) { if (!validateField(f) && !firstBad) firstBad = f; });
      if (firstBad) { var i = firstBad.querySelector('input, select, textarea'); if (i) i.focus(); return; }
      var btn = form.querySelector('[type="submit"]');
      if (btn) { btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.innerHTML = 'Enviando…'; }
      setTimeout(function () {
        var status = form.parentNode.querySelector('.form-status');
        form.hidden = true;
        if (status) { status.classList.add('is-success'); status.setAttribute('tabindex', '-1'); status.focus(); }
        else CEI.toast('Recebido. Obrigado!');
      }, 700);
    });
    var again = form.parentNode.querySelector('[data-form-reset]');
    if (again) again.addEventListener('click', function () {
      form.reset(); form.hidden = false;
      var btn = form.querySelector('[type="submit"]');
      if (btn) { btn.disabled = false; if (btn.dataset.label) btn.innerHTML = btn.dataset.label; }
      var status = form.parentNode.querySelector('.form-status');
      if (status) status.classList.remove('is-success');
    });
  };
  CEI.$$('form[data-form]').forEach(CEI.bindForm);

  /* ---------- Copiar ---------- */
  doc.addEventListener('click', function (e) {
    var c = e.target.closest('[data-copy]');
    if (!c) return;
    var text = c.getAttribute('data-copy');
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { CEI.toast('Copiado: ' + text); });
    else CEI.toast(text);
  });
})();
