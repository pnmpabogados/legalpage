// Centro editorial: búsqueda y filtros sobre las publicaciones compiladas en la página.
(function () {
  'use strict';
  var d = document;
  var root = d.querySelector('[data-hub]');
  if (!root) return;
  var $ = function (s) { return root.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };
  var items = JSON.parse(d.getElementById('hub-data').textContent);
  var state = { q: '', cat: '', materia: '', autor: '', tag: '' };

  var params = new URLSearchParams(location.search);
  ['materia', 'autor', 'tag'].forEach(function (k) { if (params.get(k)) state[k] = params.get(k); });
  if (params.get('categoria')) state.cat = params.get('categoria');

  var norm = function (s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var list = $('[data-hub-list]'), count = $('[data-hub-count]'), empty = $('[data-hub-empty]');

  function render() {
    var q = norm(state.q);
    var res = items.filter(function (p) {
      if (state.cat && p.category !== state.cat) return false;
      if (state.materia && p.practice !== state.materia) return false;
      if (state.autor && p.author !== state.autor) return false;
      if (state.tag && p.tags.indexOf(state.tag) < 0) return false;
      if (q && norm([p.title, p.excerpt, p.practiceName, p.categoryName, p.tags.join(' ')].join(' ')).indexOf(q) < 0) return false;
      return true;
    });
    list.innerHTML = '';
    res.forEach(function (p) {
      var li = d.createElement('li');
      var a = d.createElement('a'); a.href = (d.documentElement.getAttribute('data-base') || '') + '/conocimiento/' + p.slug + '/';
      var meta = d.createElement('span'); meta.className = 'kteaser__cat'; meta.textContent = p.categoryName;
      var mid = d.createElement('span');
      var t = d.createElement('span'); t.className = 't'; t.textContent = p.title; t.style.display = 'block';
      var x = d.createElement('span'); x.className = 'x'; x.textContent = p.excerpt; x.style.display = 'block';
      mid.appendChild(t); mid.appendChild(x);
      var m = d.createElement('span'); m.className = 'm'; m.textContent = p.dateText + ' · ' + p.authorName + ' · ' + p.practiceName;
      a.appendChild(meta); a.appendChild(mid); a.appendChild(m); li.appendChild(a); list.appendChild(li);
    });
    if (items.length) {
      count.textContent = res.length === 1 ? '1 publicación' : res.length + ' publicaciones';
      empty.hidden = res.length > 0;
    }
  }

  var form = root.querySelector('[data-hub-form]');
  form && form.addEventListener('submit', function (e) { e.preventDefault(); });
  var qIn = $('[data-hub-q]'), mSel = $('[data-hub-materia]'), aSel = $('[data-hub-autor]');
  qIn.addEventListener('input', function () { state.q = qIn.value; render(); });
  mSel.value = state.materia; mSel.addEventListener('change', function () { state.materia = mSel.value; render(); });
  aSel.value = state.autor; aSel.addEventListener('change', function () { state.autor = aSel.value; render(); });

  function pressGroup(attr, value) {
    $$('[' + attr + ']').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute(attr) === value)); });
  }
  $$('[data-hub-cat]').forEach(function (b) {
    b.addEventListener('click', function () { state.cat = b.getAttribute('data-hub-cat'); pressGroup('data-hub-cat', state.cat); render(); });
  });
  $$('[data-hub-tag]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-hub-tag');
      state.tag = state.tag === v ? '' : v; pressGroup('data-hub-tag', state.tag); render();
    });
  });
  pressGroup('data-hub-cat', state.cat);
  if (state.tag) pressGroup('data-hub-tag', state.tag);
  render();
})();
