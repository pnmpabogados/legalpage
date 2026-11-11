// Se ejecuta antes del primer pintado: activa estilos con JS y decide si mostrar la apertura.
(function () {
  var d = document.documentElement;
  d.classList.add('js');
  try {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (d.hasAttribute('data-home') && !reduce && !sessionStorage.getItem('pnm-intro')) {
      sessionStorage.setItem('pnm-intro', '1');
      d.classList.add('intro-on');
      setTimeout(function () { d.classList.remove('intro-on'); }, 1700);
    }
  } catch (e) { /* almacenamiento no disponible: se omite la apertura */ }
})();
