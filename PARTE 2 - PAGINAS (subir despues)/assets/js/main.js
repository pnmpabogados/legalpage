// Interacciones comunes del sitio PNM. Sin dependencias.
(function () {
  'use strict';
  var d = document, html = d.documentElement;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var desktop = window.matchMedia('(min-width: 1121px)');
  var canHover = window.matchMedia('(hover: hover)');
  var twoCols = window.matchMedia('(min-width: 901px)');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Cabecera ---------- */
  var header = $('[data-header]');
  var onScroll = function () { header && header.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menú móvil ---------- */
  var menuBtn = $('[data-menu-toggle]');
  var nav = $('#site-nav');
  function setMenu(open) {
    if (!menuBtn) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    $('.menu-btn__label', menuBtn).textContent = open ? 'Cerrar' : 'Menú';
    html.classList.toggle('nav-open', open);
    if (open) { var first = $('a, button', nav); first && first.focus(); }
  }
  menuBtn && menuBtn.addEventListener('click', function () {
    setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
  });
  desktop.addEventListener('change', function () { setMenu(false); setMega(false); });

  /* ---------- Mega menú ---------- */
  var megaBtn = $('[data-mega-toggle]');
  var mega = $('#mega-especialidades');
  var megaItem = megaBtn && megaBtn.closest('.nav__item--mega');
  var megaTimer;
  function setMega(open) {
    if (!megaBtn) return;
    megaBtn.setAttribute('aria-expanded', String(open));
    mega.hidden = !open;
  }
  if (megaBtn) {
    megaBtn.addEventListener('click', function () { setMega(mega.hidden); });
    megaItem.addEventListener('mouseenter', function () {
      if (!desktop.matches || !canHover.matches) return;
      clearTimeout(megaTimer);
      megaTimer = setTimeout(function () { setMega(true); }, 120);
    });
    megaItem.addEventListener('mouseleave', function () {
      if (!desktop.matches || !canHover.matches) return;
      clearTimeout(megaTimer);
      megaTimer = setTimeout(function () { setMega(false); }, 220);
    });
    megaItem.addEventListener('focusout', function (e) {
      if (desktop.matches && !megaItem.contains(e.relatedTarget)) setMega(false);
    });
    var summary = $('.mega__summary', mega);
    $$('.mega__list a', mega).forEach(function (a) {
      var show = function () { summary.textContent = a.getAttribute('data-summary'); };
      a.addEventListener('mouseenter', show);
      a.addEventListener('focus', show);
    });
    d.addEventListener('click', function (e) {
      if (desktop.matches && !megaItem.contains(e.target)) setMega(false);
    });
  }
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (megaBtn && !mega.hidden) { setMega(false); megaBtn.focus(); }
    else if (html.classList.contains('nav-open')) { setMega(false); setMenu(false); menuBtn.focus(); }
  });
  nav && nav.addEventListener('click', function (e) {
    if (e.target.closest('a') && html.classList.contains('nav-open')) setMenu(false);
  });

  /* ---------- Tipografía cinética: divide títulos en palabras ---------- */
  $$('[data-kt]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach(function (w, i) {
      var outer = d.createElement('span'); outer.className = 'kt-w';
      var inner = d.createElement('span'); inner.className = 'kt-i'; inner.textContent = w;
      inner.style.setProperty('--wi', i);
      outer.appendChild(inner); el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(d.createTextNode(' '));
    });
    if (el.hasAttribute('data-kt-delay')) el.style.setProperty('--kd', 1);
  });

  /* ---------- Revelados al entrar en pantalla ---------- */
  var targets = $$('.reveal, [data-kt], .reveal-img');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('is-in'); });
  }

  /* ---------- Selector «¿Qué necesita resolver?» (patrón de pestañas) ---------- */
  $$('[data-tabs]').forEach(function (root) {
    var tabs = $$('[role="tab"]', root);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = d.getElementById(t.getAttribute('aria-controls'));
        panel.hidden = !on;
        if (on) { panel.classList.remove('is-switching'); void panel.offsetWidth; panel.classList.add('is-switching'); }
      });
      if (focus) tab.focus();
      // Si la imagen del panel quedó por encima de la pantalla (opciones bajas de la lista),
      // se desplaza lo justo para mostrar el panel completo desde su parte superior.
      if (twoCols.matches) {
        var panelTop = d.getElementById(tab.getAttribute('aria-controls')).getBoundingClientRect().top;
        var headerH = header ? header.getBoundingClientRect().height : 0;
        if (panelTop < headerH + 8) window.scrollBy({ top: panelTop - headerH - 24, behavior: reduced.matches ? 'auto' : 'smooth' });
      }
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowDown' || k === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (k === 'ArrowUp' || k === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (k === 'Home') n = tabs[0];
        if (k === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  });

  /* ---------- Metodología: avance del módulo azul ---------- */
  $$('[data-method]').forEach(function (root) {
    var steps = $$('.method__step', root), bar = $('.method__bar', root);
    if (!bar || !('IntersectionObserver' in window)) return;
    var seen = 0;
    var mo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { seen++; mo.unobserve(en.target); bar.style.width = (seen / steps.length) * 100 + '%'; }
      });
    }, { threshold: 0.6 });
    steps.forEach(function (s) { mo.observe(s); });
  });

  /* ---------- Subnavegación de especialidades ---------- */
  var subLinks = $$('.subnav a');
  if (subLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    subLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        subLinks.forEach(function (a) { a.classList.remove('is-current'); });
        var a = byId[en.target.id];
        if (a) {
          a.classList.add('is-current');
          // Solo desplaza la barra horizontalmente: scrollIntoView movía también la página
          // (la barra es sticky) y cortaba el desplazamiento del usuario.
          var list = a.parentNode;
          var left = a.offsetLeft - list.offsetLeft, right = left + a.offsetWidth;
          if (left < list.scrollLeft || right > list.scrollLeft + list.clientWidth) {
            list.scrollTo({ left: Math.max(0, left - 16), behavior: 'smooth' });
          }
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(byId).forEach(function (id) { var s = d.getElementById(id); s && so.observe(s); });
  }

  /* ---------- Paralaje con el ratón y botones magnéticos (inicio) ---------- */
  // Escribe --px / --py (de -1 a 1) en cada zona [data-parallax]; el CSS decide qué capas se mueven.
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  var moving = function () { return finePointer.matches && !calm.matches; };
  $$('[data-parallax]').forEach(function (area) {
    var raf = 0, px = 0, py = 0;
    area.addEventListener('pointermove', function (e) {
      if (!moving()) return;
      var r = area.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width) * 2 - 1;
      py = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0;
        area.style.setProperty('--px', px.toFixed(3));
        area.style.setProperty('--py', py.toFixed(3));
      });
    });
    area.addEventListener('pointerleave', function () {
      area.style.setProperty('--px', 0);
      area.style.setProperty('--py', 0);
    });
  });
  // Retícula viva bajo la portada: piezas que se deslizan hacia huecos que recorren la franja.
  var lg = $('[data-living-grid]');
  if (lg) {
    var lgTimer = 0, lgVisible = true, lgCells = [], lgHoles = [], lgCols = 0, lgStep = 0;
    var cellPos = function (c) { return 'translate(' + (c % lgCols) * lgStep + 'px,' + Math.floor(c / lgCols) * lgStep + 'px)'; };
    var lgTick = function () {
      if (lgVisible) {
        var h = lgHoles[Math.floor(Math.random() * lgHoles.length)];
        var x = h % lgCols, near = [];
        if (x > 0) near.push(h - 1);
        if (x < lgCols - 1) near.push(h + 1);
        near.push(h < lgCols ? h + lgCols : h - lgCols);
        near = near.filter(function (c) { return lgCells[c]; });
        if (near.length) {
          var from = near[Math.floor(Math.random() * near.length)];
          var el = lgCells[from];
          el.style.transform = cellPos(h);
          lgCells[h] = el; lgCells[from] = null;
          lgHoles[lgHoles.indexOf(h)] = from;
        }
      }
      lgTimer = setTimeout(lgTick, 300);
    };
    var lgBuild = function () {
      clearTimeout(lgTimer);
      var cs = getComputedStyle(lg.parentNode);
      var u = parseFloat(cs.getPropertyValue('--lg-u')) || 14, g = parseFloat(cs.getPropertyValue('--lg-g')) || 5;
      lgStep = u + g;
      lgCols = Math.max(4, Math.floor((lg.clientWidth + g) / lgStep));
      var total = lgCols * 2, holes = Math.max(3, Math.round(total / 9));
      lg.textContent = ''; lgCells = [];
      // Huecos repartidos al azar (uno de cada nueve); una pieza azul de cada 17, una en tinta de cada tres y el resto en piedra.
      var order = [], k, r, t;
      for (k = 0; k < total; k++) order.push(k);
      for (k = order.length - 1; k > 0; k--) { r = Math.floor(Math.random() * (k + 1)); t = order[k]; order[k] = order[r]; order[r] = t; }
      lgHoles = order.slice(0, holes);
      order.slice(holes).forEach(function (c, n) {
        var el = d.createElement('i');
        if (n % 17 === 0) el.className = 'is-blue'; else if (n % 3 === 0) el.className = 'is-ink';
        el.style.transform = cellPos(c);
        lg.appendChild(el); lgCells[c] = el;
      });
      if (!reduced.matches) lgTick();
    };
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { lgVisible = en[0].isIntersecting; }).observe(lg);
    var lgW = lg.clientWidth;
    window.addEventListener('resize', function () { if (lg.clientWidth !== lgW) { lgW = lg.clientWidth; lgBuild(); } });
    lgBuild();
  }

  // Destellos en la cabecera de cada especialidad: puntos que aparecen y se apagan sin pausa.
  if (!reduced.matches) $$('[data-sparkles]').forEach(function (hero) {
    var box = d.createElement('div');
    box.className = 'phero__sparkles';
    box.setAttribute('aria-hidden', 'true');
    var small = hero.getAttribute('data-sparkles') === 'sm';
    var n = small ? (window.innerWidth < 700 ? 8 : 12) : (window.innerWidth < 700 ? 22 : 42);
    for (var k = 0; k < n; k++) {
      var sp = d.createElement('i'), roll = Math.random();
      sp.className = roll < 0.3 ? 'is-light' : roll < 0.45 ? 'is-blue' : '';
      sp.style.left = (Math.random() * 100).toFixed(2) + '%';
      sp.style.top = (Math.random() * 100).toFixed(2) + '%';
      sp.style.setProperty('--s', (1.5 + Math.random() * 2.5).toFixed(1) + 'px');
      sp.style.setProperty('--dur', (2.6 + Math.random() * 3.4).toFixed(2) + 's');
      sp.style.setProperty('--delay', (-Math.random() * 6).toFixed(2) + 's');
      sp.style.setProperty('--o', (0.35 + Math.random() * 0.5).toFixed(2));
      box.appendChild(sp);
    }
    hero.insertBefore(box, hero.firstChild);
  });
  $$('.hcontact__channels .btn').forEach(function (b) {
    b.addEventListener('pointermove', function (e) {
      if (!moving()) return;
      var r = b.getBoundingClientRect();
      b.style.translate = ((e.clientX - r.left - r.width / 2) * 0.16).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px';
    });
    b.addEventListener('pointerleave', function () { b.style.translate = ''; });
  });

  /* ---------- Directorio: filtro por especialidad ---------- */
  var dirFilter = $('[data-dir-filter]');
  if (dirFilter) {
    dirFilter.addEventListener('change', function () {
      var v = dirFilter.value, shown = 0;
      $$('[data-dir-list] > li').forEach(function (li) {
        var ok = !v || li.getAttribute('data-areas').split(' ').indexOf(v) > -1;
        li.hidden = !ok; if (ok) shown++;
      });
      $('[data-dir-empty]').hidden = shown > 0;
    });
  }

  /* ---------- Área preseleccionada desde la URL (?area=) ---------- */
  var area = new URLSearchParams(location.search).get('area');
  if (area) $$('[data-area-select]').forEach(function (s) {
    if ($('option[value="' + CSS.escape(area) + '"]', s)) s.value = area;
  });

  /* ---------- WhatsApp flotante: se oculta sobre el pie ---------- */
  var wa = $('[data-wa-float]'), footer = $('.site-footer');
  if (wa && footer && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { wa.classList.toggle('is-hidden', en[0].isIntersecting); }).observe(footer);
  }
})();
