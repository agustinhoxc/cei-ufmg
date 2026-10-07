/* ==========================================================================
   CEI/UFMG — interactions.js
   Filtros, rede combinatória, ciclo de governança, trajetória, decision log,
   cronograma (Gantt), planta do prédio, modais de detalhe e de interesse
   ========================================================================== */
(function () {
  'use strict';
  var CEI = window.CEI;
  var doc = document;
  var $ = CEI.$, $$ = CEI.$$, esc = CEI.escape;
  var SVGNS = 'http://www.w3.org/2000/svg';

  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function readJSON(scope, sel) {
    var s = scope.querySelector(sel);
    if (!s) return null;
    try { return JSON.parse(s.textContent); } catch (e) { return null; }
  }
  function svgEl(tag, attrs) {
    var el = doc.createElementNS(SVGNS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  /* =====================================================================
     Filtros
     ===================================================================== */
  $$('[data-filter-scope]').forEach(function (scope) {
    var items = $$('[data-filter-item]', scope);
    var groups = $$('[data-filter-group]', scope);
    var search = $('[data-filter-search]', scope);
    var countEl = $('[data-filter-count]', scope);
    var empty = $('[data-filter-empty]', scope);
    var state = {};
    var params = new URLSearchParams(window.location.search);

    items.forEach(function (it) { it.__text = norm(it.textContent + ' ' + (it.getAttribute('data-search') || '')); it.__tags = (it.getAttribute('data-tags') || '').split(/\s+/); });

    groups.forEach(function (g) {
      var name = g.getAttribute('data-filter-group');
      state[name] = 'all';
      var chips = $$('[data-filter]', g);
      // contagem
      chips.forEach(function (c) {
        var v = c.getAttribute('data-filter');
        var n = v === 'all' ? items.length : items.filter(function (it) { return it.__tags.indexOf(name + ':' + v) !== -1; }).length;
        var cnt = c.querySelector('.count');
        if (cnt) cnt.textContent = n;
        c.addEventListener('click', function () { setGroup(name, v); });
      });
      var pre = params.get(name);
      if (pre && chips.some(function (c) { return c.getAttribute('data-filter') === pre; })) state[name] = pre;
    });

    function setGroup(name, v) {
      state[name] = v;
      var url = new URL(window.location.href);
      if (v === 'all') url.searchParams.delete(name); else url.searchParams.set(name, v);
      try { history.replaceState(null, '', url.pathname + url.search + url.hash); } catch (e) {}
      apply();
    }
    function apply() {
      groups.forEach(function (g) {
        var name = g.getAttribute('data-filter-group');
        $$('[data-filter]', g).forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-filter') === state[name] ? 'true' : 'false'); });
      });
      var q = search ? norm(search.value).trim().split(/\s+/).filter(Boolean) : [];
      var shown = 0;
      items.forEach(function (it) {
        var ok = true;
        for (var name in state) { if (state[name] !== 'all' && it.__tags.indexOf(name + ':' + state[name]) === -1) ok = false; }
        if (ok && q.length) ok = q.every(function (w) { return it.__text.indexOf(w) !== -1; });
        it.classList.toggle('is-filtered-out', !ok);
        if (ok) shown++;
      });
      if (countEl) countEl.textContent = shown + (shown === 1 ? ' resultado' : ' resultados');
      if (empty) empty.classList.toggle('is-visible', shown === 0);
    }
    if (search) {
      var pq = params.get('q');
      if (pq) search.value = pq;
      search.addEventListener('input', apply);
    }
    $$('[data-filter-clear]', scope).forEach(function (b) {
      b.addEventListener('click', function () {
        for (var n in state) state[n] = 'all';
        if (search) search.value = '';
        try { history.replaceState(null, '', window.location.pathname); } catch (e) {}
        apply();
      });
    });
    apply();
  });

  /* =====================================================================
     Rede combinatória
     ===================================================================== */
  $$('[data-network]').forEach(function (scope) {
    var cfg = readJSON(scope, 'script[type="application/json"]');
    if (!cfg) return;
    var holder = $('.network', scope);
    var panel = $('[data-network-panel]', scope);
    var light = scope.hasAttribute('data-light');
    var svg = svgEl('svg', { viewBox: '0 0 600 600', role: 'group', 'aria-label': cfg.label || 'Rede de atores do ecossistema' });
    var gEdges = svgEl('g', {}), gNodes = svgEl('g', {});
    svg.appendChild(gEdges); svg.appendChild(gNodes);
    var byId = {};
    cfg.nodes.forEach(function (n) { byId[n.id] = n; n.links = []; });
    cfg.edges.forEach(function (e) {
      var a = byId[e[0]], b = byId[e[1]];
      if (!a || !b) return;
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      var cx = mx + (300 - mx) * 0.18, cy = my + (300 - my) * 0.18;
      var p = svgEl('path', { d: 'M' + a.x + ' ' + a.y + ' Q ' + cx + ' ' + cy + ' ' + b.x + ' ' + b.y, class: 'net-edge' });
      p.__a = a.id; p.__b = b.id;
      gEdges.appendChild(p);
      a.links.push(b.id); b.links.push(a.id);
    });
    cfg.nodes.forEach(function (n) {
      var g = svgEl('g', { class: 'net-node' + (n.center ? ' is-center' : ''), tabindex: '0', role: 'button', 'aria-label': n.title + ': ' + (n.role || '') });
      g.__id = n.id;
      var r = n.center ? 40 : 11;
      g.appendChild(svgEl('circle', { class: 'halo', cx: n.x, cy: n.y, r: r + 14 }));
      g.appendChild(svgEl('circle', { class: 'core', cx: n.x, cy: n.y, r: r }));
      var t = svgEl('text', { x: n.x, y: n.center ? n.y + 5 : n.y + (n.y > 300 ? 32 : -22) });
      t.textContent = n.label;
      g.appendChild(t);
      gNodes.appendChild(g);
      n.el = g;
    });
    holder.appendChild(svg);

    var active = null, auto = null, userTouched = false;
    function activate(id, fromUser) {
      if (fromUser) { userTouched = true; stopAuto(); }
      active = id;
      var n = byId[id];
      $$('.net-node', svg).forEach(function (g) {
        var me = g.__id === id;
        var linked = n.links.indexOf(g.__id) !== -1;
        g.classList.toggle('is-active', me);
        g.classList.toggle('is-linked', linked && !me);
        g.classList.toggle('is-dim', !me && !linked);
      });
      $$('.net-edge', svg).forEach(function (p) {
        var hot = p.__a === id || p.__b === id;
        p.classList.toggle('is-hot', hot);
        p.classList.toggle('is-dim', !hot);
      });
      if (panel) {
        panel.innerHTML = '<div class="diag-label">' + esc(n.kicker || 'Ator do ecossistema') + '</div>' +
          '<h3>' + esc(n.title) + '</h3>' +
          (n.role ? '<p><strong>' + esc(n.role) + '</strong></p>' : '') +
          (n.desc ? '<p>' + esc(n.desc) + '</p>' : '') +
          '<div class="conn" aria-label="Conexões">' + n.links.map(function (l) { return '<span>↔ ' + esc(byId[l].title) + '</span>'; }).join('') + '</div>' +
          (n.href ? '<p style="margin-top:18px"><a class="link-arrow" href="' + (n.href.charAt(0) === '#' ? '' : CEI.base) + esc(n.href) + '"><span>' + esc(n.hrefLabel || 'Saiba mais') + '</span>' + CEI.icon('arrow-right', 'icon-sm') + '</a></p>' : '');
      }
    }
    function clear() {
      $$('.net-node', svg).forEach(function (g) { g.classList.remove('is-active', 'is-linked', 'is-dim'); });
      $$('.net-edge', svg).forEach(function (p) { p.classList.remove('is-hot', 'is-dim'); });
    }
    $$('.net-node', svg).forEach(function (g) {
      g.addEventListener('mouseenter', function () { activate(g.__id, true); });
      g.addEventListener('focus', function () { activate(g.__id, true); });
      g.addEventListener('click', function () { activate(g.__id, true); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(g.__id, true); } });
    });
    function stopAuto() { if (auto) { clearInterval(auto); auto = null; } }
    var order = cfg.nodes.filter(function (n) { return !n.center; }).map(function (n) { return n.id; });
    var center = cfg.nodes.filter(function (n) { return n.center; })[0];
    var hashId = (window.location.hash || '').replace('#ator-', '');
    if (hashId && byId[hashId]) { activate(hashId, true); }
    else activate(center ? center.id : order[0]);
    if (!CEI.reducedMotion && !userTouched && 'IntersectionObserver' in window) {
      var idx = 0;
      var io = new IntersectionObserver(function (ent) {
        ent.forEach(function (e) {
          if (e.isIntersecting && !userTouched && !auto) {
            auto = setInterval(function () { activate(order[idx % order.length]); idx++; }, 2600);
          } else if (!e.isIntersecting) stopAuto();
        });
      }, { threshold: 0.35 });
      io.observe(scope);
    }
    window.addEventListener('hashchange', function () {
      var h = (window.location.hash || '').replace('#ator-', '');
      if (byId[h]) activate(h, true);
    });
    scope.__activate = activate;
  });

  /* =====================================================================
     Ciclo (governança)
     ===================================================================== */
  $$('[data-cycle]').forEach(function (scope) {
    var cfg = readJSON(scope, 'script[type="application/json"]');
    if (!cfg) return;
    var holder = $('.cycle', scope), panel = $('[data-cycle-panel]', scope);
    var N = cfg.stages.length, R = 230, C = 300;
    var svg = svgEl('svg', { viewBox: '-130 -20 860 640', role: 'group', 'aria-label': cfg.label || 'Ciclo de governança' });
    svg.appendChild(svgEl('circle', { class: 'cycle-ring', cx: C, cy: C, r: R }));
    var circ = 2 * Math.PI * R;
    var prog = svgEl('circle', { class: 'cycle-progress', cx: C, cy: C, r: R, 'stroke-dasharray': circ, 'stroke-dashoffset': circ, transform: 'rotate(-90 300 300)' });
    svg.appendChild(prog);
    var center = svgEl('g', { class: 'cycle-center' });
    var cSm = svgEl('text', { class: 'sm', x: C, y: C - 18 });
    var cBig = svgEl('text', { class: 'big', x: C, y: C + 14 });
    center.appendChild(cSm); center.appendChild(cBig);
    svg.appendChild(center);
    var nodes = cfg.stages.map(function (s, i) {
      var a = (i / N) * Math.PI * 2 - Math.PI / 2;
      var x = C + R * Math.cos(a), y = C + R * Math.sin(a);
      var g = svgEl('g', { class: 'cycle-node', tabindex: '0', role: 'button', 'aria-label': (i + 1) + '. ' + s.title });
      g.appendChild(svgEl('circle', { cx: x, cy: y, r: 26 }));
      var num = svgEl('text', { class: 'num', x: x, y: y + 4 }); num.textContent = String(i + 1).padStart(2, '0');
      g.appendChild(num);
      var ca = Math.cos(a), sa = Math.sin(a), anchor = 'middle', lx, ly;
      if (ca > 0.3) { anchor = 'start'; lx = x + 36; ly = y + 4; }
      else if (ca < -0.3) { anchor = 'end'; lx = x - 36; ly = y + 4; }
      else { lx = x; ly = y + (sa < 0 ? -40 : 48); }
      var lbl = svgEl('text', { x: lx, y: ly, 'text-anchor': anchor, style: 'text-anchor:' + anchor }); lbl.textContent = s.label;
      g.appendChild(lbl);
      g.addEventListener('click', function () { go(i, true); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(i, true); } });
      svg.appendChild(g);
      return g;
    });
    holder.appendChild(svg);
    var cur = 0, timer = null;
    function go(i, user) {
      if (user) stop();
      cur = (i + N) % N;
      nodes.forEach(function (g, k) { g.classList.toggle('is-active', k === cur); g.classList.toggle('is-done', k < cur); });
      prog.setAttribute('stroke-dashoffset', circ - circ * ((cur + 1) / N));
      cSm.textContent = 'Etapa ' + (cur + 1) + ' de ' + N;
      cBig.textContent = cfg.stages[cur].title;
      var s = cfg.stages[cur];
      if (panel) panel.innerHTML = '<div class="diag-label"><span class="n" style="color:var(--gold-deep)">' + String(cur + 1).padStart(2, '0') + '</span>' + esc(s.kicker || 'Ciclo') + '</div><h3 style="font-size:1.8rem;margin-bottom:10px">' + esc(s.title) + '</h3><p class="lead" style="margin:0">' + esc(s.desc) + '</p>' +
        (s.points ? '<ul class="dot-list" style="margin-top:20px">' + s.points.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' : '');
    }
    var playBtn = $('[data-cycle-play]', scope);
    function play() { if (CEI.reducedMotion) return; stop(); timer = setInterval(function () { go(cur + 1); }, 3800); if (playBtn) { playBtn.setAttribute('aria-pressed', 'true'); playBtn.querySelector('span').textContent = 'Pausar'; } }
    function stop() { if (timer) clearInterval(timer); timer = null; if (playBtn) { playBtn.setAttribute('aria-pressed', 'false'); playBtn.querySelector('span').textContent = 'Reproduzir ciclo'; } }
    var prev = $('[data-cycle-prev]', scope), next = $('[data-cycle-next]', scope);
    if (prev) prev.addEventListener('click', function () { go(cur - 1, true); });
    if (next) next.addEventListener('click', function () { go(cur + 1, true); });
    if (playBtn) playBtn.addEventListener('click', function () { timer ? stop() : play(); });
    go(0);
    if ('IntersectionObserver' in window && !CEI.reducedMotion) {
      var started = false;
      var io = new IntersectionObserver(function (ent) { ent.forEach(function (e) { if (e.isIntersecting && !started) { started = true; play(); } }); }, { threshold: 0.4 });
      io.observe(scope);
    }
  });

  /* =====================================================================
     Trajetória (stepper)
     ===================================================================== */
  $$('[data-stepper]').forEach(function (scope) {
    var cfg = readJSON(scope, 'script[type="application/json"]');
    if (!cfg) return;
    var track = $('.stepper-track', scope), panel = $('.step-panel', scope);
    track.setAttribute('role', 'tablist');
    track.setAttribute('aria-label', 'Etapas da trajetória');
    var btns = cfg.steps.map(function (s, i) {
      var b = doc.createElement('button');
      b.type = 'button'; b.className = 'step-btn'; b.setAttribute('role', 'tab');
      b.id = (scope.id || 'traj') + '-tab-' + i;
      b.innerHTML = '<span class="bar"></span><span class="lbl">' + String(i + 1).padStart(2, '0') + '</span><span class="ttl">' + esc(s.title) + '</span>';
      b.addEventListener('click', function () { select(i); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); select(Math.min(i + 1, cfg.steps.length - 1), true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); select(Math.max(i - 1, 0), true); }
      });
      track.appendChild(b);
      return b;
    });
    panel.setAttribute('role', 'tabpanel');
    var cur = 0;
    function select(i, focus) {
      cur = i;
      btns.forEach(function (b, k) {
        b.setAttribute('aria-selected', k === i ? 'true' : 'false');
        b.tabIndex = k === i ? 0 : -1;
        b.classList.toggle('is-done', k < i);
      });
      panel.setAttribute('aria-labelledby', btns[i].id);
      var s = cfg.steps[i];
      panel.innerHTML = '<div><div class="q">Etapa ' + (i + 1) + ' de ' + cfg.steps.length + ' · ' + esc(s.q) + '</div><h3>' + esc(s.title) + '</h3><p>' + esc(s.desc) + '</p>' +
        '<div class="step-nav"><button type="button" class="btn btn-sm" data-prev ' + (i === 0 ? 'disabled' : '') + '>' + CEI.icon('arrow-left', 'icon-sm') + 'Anterior</button>' +
        '<button type="button" class="btn btn-sm btn-dark" data-next ' + (i === cfg.steps.length - 1 ? 'disabled' : '') + '>Próxima etapa ' + CEI.icon('arrow-right', 'icon-arrow icon-sm') + '</button></div></div>' +
        '<div class="step-res"><h4>Como o ecossistema apoia</h4><ul>' + s.res.map(function (r) { return '<li>' + CEI.icon('check', 'icon-sm') + '<span>' + esc(r) + '</span></li>'; }).join('') + '</ul></div>';
      $('[data-prev]', panel).addEventListener('click', function () { select(Math.max(cur - 1, 0)); });
      $('[data-next]', panel).addEventListener('click', function () { select(Math.min(cur + 1, cfg.steps.length - 1)); });
      if (focus) btns[i].focus();
      var b = btns[i];
      var tl = track.scrollLeft, tw = track.clientWidth, bl = b.offsetLeft - track.offsetLeft;
      if (bl < tl || bl + b.offsetWidth > tl + tw) track.scrollTo({ left: bl - 16, behavior: CEI.reducedMotion ? 'auto' : 'smooth' });
    }
    select(0);
  });

  /* =====================================================================
     Decision Log
     ===================================================================== */
  $$('[data-dlog]').forEach(function (scope) {
    var items = $$('.dlog-item', scope);
    var next = $('[data-dlog-next]', scope), reset = $('[data-dlog-reset]', scope), status = $('[data-dlog-status]', scope);
    var cur = 0;
    function render() {
      items.forEach(function (it, i) {
        it.classList.toggle('is-done', i < cur);
        it.classList.toggle('is-current', i === cur);
        it.classList.toggle('is-pending', i > cur);
      });
      if (status) status.textContent = cur >= items.length ? 'Registro completo · ' + items.length + '/' + items.length : 'Etapa ' + (cur + 1) + ' de ' + items.length;
      if (next) { next.disabled = cur >= items.length; next.querySelector('span').textContent = cur >= items.length - 1 ? 'Concluir registro' : 'Avançar etapa'; }
    }
    if (next) next.addEventListener('click', function () { if (cur < items.length) cur++; render(); if (cur >= items.length) CEI.toast('Decision Log completo: a decisão e seus porquês ficam registrados.'); });
    if (reset) reset.addEventListener('click', function () { cur = 0; render(); });
    render();
  });

  /* =====================================================================
     Cronograma (Gantt) — meses 1–36 a partir de 03/10/2025
     ===================================================================== */
  $$('[data-gantt]').forEach(function (scope) {
    var cfg = readJSON(scope, 'script[type="application/json"]');
    if (!cfg) return;
    var host = $('.gantt-host', scope);
    var total = 36;
    var start = new Date(2025, 9, 3);
    var now = new Date();
    var monthNow = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + (now.getDate() >= start.getDate() ? 1 : 0);
    var todayPct = Math.max(0, Math.min(1, (monthNow - 0.5) / total)) * 100;
    var showToday = monthNow >= 1 && monthNow <= total;
    var ticks = ['Out/25', 'Abr/26', 'Out/26', 'Abr/27', 'Out/27', 'Abr/28'];
    var html = '<div class="gantt-scroll"><div class="gantt-inner">' +
      '<div class="gantt-scale"><div class="g-label mono" style="font-size:11px;color:var(--text-3)">ETAPA · MESES</div><div class="g-ticks">' + ticks.map(function (t, i) { return '<span>M' + (i * 6 + 1) + ' · ' + t + '</span>'; }).join('') + '</div></div>';
    var lastGroup = null;
    cfg.rows.forEach(function (r) {
      if (r.group !== lastGroup) {
        lastGroup = r.group;
        html += '<div class="gantt-row is-group"><div class="g-label">' + esc(r.group) + '</div><div class="g-track">' + (showToday ? '<span class="g-today" style="left:' + todayPct + '%"></span>' : '') + '</div></div>';
      }
      var left = ((r.s - 1) / total) * 100, width = ((r.e - r.s + 1) / total) * 100;
      html += '<div class="gantt-row"><div class="g-label">' + esc(r.label) + '</div><div class="g-track">' +
        (showToday ? '<span class="g-today" style="left:' + todayPct + '%" aria-hidden="true"></span>' : '') +
        '<span class="g-bar' + ((r.e - r.s) < 12 ? ' is-short' : '') + '" style="left:' + left + '%;width:' + width + '%" title="Meses ' + r.s + '–' + r.e + '"><span class="visually-hidden">Meses ' + r.s + ' a ' + r.e + '</span></span></div></div>';
    });
    html += '</div></div><div class="gantt-legend"><span><i style="background:var(--ink)"></i>Etapa contínua (≥ 12 meses)</span><span><i style="background:var(--teal)"></i>Etapa pontual</span>' + (showToday ? '<span><i style="background:var(--gold);width:3px;height:12px"></i>Hoje · mês ' + monthNow + ' de 36</span>' : '') + '<span>Fonte: Plano de Trabalho — Edital FAPEMIG 018/2024</span></div>';
    host.innerHTML = html;
  });

  /* =====================================================================
     Grupos de detalhe (planta do prédio, etc.)
     ===================================================================== */
  $$('[data-detail-group]').forEach(function (scope) {
    var btns = $$('[data-detail]', scope);
    var panel = $('[data-detail-panel]', scope);
    function show(b) {
      btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      var tpl = doc.getElementById(b.getAttribute('data-detail'));
      if (tpl && panel) { panel.innerHTML = tpl.innerHTML; }
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { show(b); }); });
    var first = btns.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0] || btns[0];
    if (first) show(first);
  });

  /* =====================================================================
     Modal de detalhe (cards de programas, oportunidades etc.)
     ===================================================================== */
  var detailModal = doc.getElementById('detail-modal');
  doc.addEventListener('click', function (e) {
    var t = e.target.closest('[data-detail-open]');
    if (!t || !detailModal) return;
    e.preventDefault();
    var card = t.closest('[data-detail-card]');
    var tpl = card ? card.querySelector('template.detail-tpl') : null;
    var title = card ? (card.querySelector('h3') || {}).textContent : '';
    $('#detail-title', detailModal).textContent = title || 'Detalhes';
    $('.modal-body', detailModal).innerHTML = tpl ? tpl.innerHTML : '';
    CEI.openDialog(detailModal, t);
  });

  /* Modal de interesse */
  var interest = doc.getElementById('interest-modal');
  doc.addEventListener('click', function (e) {
    var t = e.target.closest('[data-interest]');
    if (!t || !interest) return;
    e.preventDefault();
    var subject = t.getAttribute('data-interest');
    var kind = t.getAttribute('data-interest-kind') || 'Tenho interesse';
    $('#interest-title', interest).textContent = kind;
    $('[data-interest-subject]', interest).textContent = subject;
    var hidden = $('input[name="assunto"]', interest);
    if (hidden) hidden.value = subject;
    var form = $('form', interest);
    form.reset(); form.hidden = false;
    var btn = form.querySelector('[type="submit"]'); if (btn) { btn.disabled = false; if (btn.dataset.label) btn.innerHTML = btn.dataset.label; }
    $$('.field', form).forEach(function (f) { f.classList.remove('has-error'); });
    var st = $('.form-status', interest); if (st) st.classList.remove('is-success');
    if (closeDetailFirst(t)) setTimeout(function () { CEI.openDialog(interest, t); }, 30);
    else CEI.openDialog(interest, t);
  });
  function closeDetailFirst(t) {
    var d = t.closest('dialog');
    if (d && d.open) { CEI.closeDialog(d); return true; }
    return false;
  }
  /* Ao abrir o agente a partir de um modal, fecha o modal antes */
  doc.addEventListener('click', function (e) {
    var t = e.target.closest('dialog:not(.drawer) [data-agent-open]');
    if (t) CEI.closeDialog(t.closest('dialog'));
  }, true);
})();
