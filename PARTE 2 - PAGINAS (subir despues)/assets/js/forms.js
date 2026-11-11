// Formularios de consulta y solicitud de reunión: validación, pasos y envío por WhatsApp.
// No se envía nada a un servidor: el mensaje se redacta con los campos marcados con data-wa-label.
(function () {
  'use strict';
  var d = document;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  var MSG = {
    valueMissing: 'Este campo es obligatorio.',
    typeMismatch: { email: 'Ingrese un correo electrónico válido.' },
    tooShort: 'Escriba al menos {n} caracteres.',
    patternMismatch: 'Ingrese un número de teléfono válido.',
    rangeUnderflow: 'Elija una fecha a partir de mañana.',
    consent: 'Debe aceptar la política de privacidad para continuar.',
    select: 'Seleccione una opción.',
  };

  function fieldOf(el) { return el.closest('.field'); }

  function message(el) {
    var v = el.validity;
    if (v.valid) return '';
    if (el.type === 'checkbox') return MSG.consent;
    if (v.valueMissing) return el.tagName === 'SELECT' ? MSG.select : MSG.valueMissing;
    if (v.typeMismatch) return MSG.typeMismatch[el.type] || MSG.valueMissing;
    if (v.tooShort) return MSG.tooShort.replace('{n}', el.minLength);
    if (v.patternMismatch) return MSG.patternMismatch;
    if (v.rangeUnderflow) return MSG.rangeUnderflow;
    return el.validationMessage;
  }

  function check(el) {
    var f = fieldOf(el); if (!f) return true;
    var msg = message(el), err = $('.field__error', f);
    f.classList.toggle('is-invalid', !!msg);
    f.classList.toggle('is-valid', !msg && el.value !== '' && el.type !== 'checkbox');
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) {
      if (!err.id) err.id = (el.id || el.name) + '-err';
      err.textContent = msg;
      var desc = (el.getAttribute('aria-describedby') || '').split(' ').filter(function (x) { return x && x !== err.id; });
      if (msg) desc.push(err.id);
      desc.length ? el.setAttribute('aria-describedby', desc.join(' ')) : el.removeAttribute('aria-describedby');
    }
    return !msg;
  }

  function controls(scope) {
    return $$('input:not([type="hidden"]):not([type="radio"]), select, textarea', scope)
      .filter(function (el) { return !el.closest('[hidden]'); });
  }

  function validate(scope) {
    var bad = controls(scope).filter(function (el) { return !check(el); });
    if (bad.length) bad[0].focus();
    return !bad.length;
  }

  function setStatus(form, type, title, text) {
    var s = $('.form__status', form);
    s.className = 'form__status' + (type ? ' is-' + type : '');
    s.innerHTML = '';
    if (!title) return;
    var t = d.createElement('strong'); t.textContent = title; s.appendChild(t);
    var p = d.createElement('p'); p.textContent = text; s.appendChild(p);
    return s;
  }

  function initForm(form) {
    // Validación en vivo después del primer intento
    controls(form).forEach(function (el) {
      el.addEventListener('blur', function () { if (el.value || el.type === 'checkbox') check(el); });
      el.addEventListener('input', function () { if (fieldOf(el) && fieldOf(el).classList.contains('is-invalid')) check(el); });
      el.addEventListener('change', function () { if (el.type === 'checkbox' || el.tagName === 'SELECT') check(el); });
    });

    // Contador de caracteres
    $$('textarea[maxlength]', form).forEach(function (ta) {
      var c = $('[data-count]', ta.closest('.field'));
      if (c) ta.addEventListener('input', function () { c.textContent = ta.value.length; });
    });

    // Fecha mínima: mañana
    $$('[data-min-tomorrow]', form).forEach(function (inp) {
      var t = new Date(); t.setDate(t.getDate() + 1);
      inp.min = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
    });

    if (form.hasAttribute('data-wizard')) initWizard(form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(form)) { setStatus(form, 'error', 'Revise los campos marcados.', 'Algunos datos están incompletos o no tienen el formato correcto.'); return; }
      submit(form);
    });
  }

  function initWizard(form) {
    var steps = $$('[data-step]', form), inds = $$('[data-step-ind]', form);
    var prev = $('[data-prev]', form), next = $('[data-next]', form), send = $('[type="submit"]', form);
    var cur = 0;
    function show(i, focus) {
      cur = i;
      steps.forEach(function (s, k) { s.hidden = k !== i; });
      inds.forEach(function (li, k) {
        li.classList.toggle('is-done', k < i);
        k === i ? li.setAttribute('aria-current', 'step') : li.removeAttribute('aria-current');
      });
      prev.hidden = i === 0;
      next.hidden = i === steps.length - 1;
      if (send) send.hidden = i !== steps.length - 1;
      setStatus(form, '', '');
      if (focus) { var lg = $('legend', steps[i]); lg.tabIndex = -1; lg.focus(); }
    }
    next.addEventListener('click', function () { if (validate(steps[cur])) show(cur + 1, true); });
    prev.addEventListener('click', function () { show(cur - 1, true); });
    show(0);
  }

  // Valor legible de un campo: texto de la opción elegida, fecha en formato local, etc.
  function readable(el) {
    if (el.tagName === 'SELECT') return el.value ? el.options[el.selectedIndex].text : '';
    if (el.type === 'date' && el.value) { var p = el.value.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return el.value.trim();
    var r = $('input[type="radio"]:checked', el); // grupo de opciones
    if (!r) return '';
    var lbl = r.closest('label');
    return ($('.card-choice__t', lbl) || $('span', lbl) || lbl).textContent.trim();
  }

  function buildMessage(form) {
    var lines = [form.getAttribute('data-wa-intro'), ''];
    $$('[data-wa-label]', form).forEach(function (el) {
      var v = readable(el);
      if (v) lines.push('• ' + el.getAttribute('data-wa-label') + ': ' + v);
    });
    return lines.join('\n');
  }

  function submit(form) {
    var url = 'https://wa.me/' + form.getAttribute('data-wa') + '?text=' + encodeURIComponent(buildMessage(form));
    var win = window.open(url, '_blank');
    if (win) win.opener = null; else location.href = url; // si el navegador bloquea la ventana nueva
    form.classList.add('is-done');
    var s = setStatus(form, 'success', 'Su mensaje está listo en WhatsApp.',
      form.getAttribute('data-form') === 'reunion'
        ? 'Solo pulse Enviar en WhatsApp. Le confirmaremos fecha y hora por ese medio; la reunión no queda agendada hasta recibir nuestra confirmación.'
        : 'Solo pulse Enviar en WhatsApp. Le responderemos por ese medio para coordinar los siguientes pasos.');
    var a = d.createElement('a');
    a.className = 'link-arrow'; a.href = url; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = 'Abrir WhatsApp de nuevo';
    s.appendChild(a);
    s.tabIndex = -1; s.focus();
  }

  $$('form[data-form]').forEach(initForm);
})();
