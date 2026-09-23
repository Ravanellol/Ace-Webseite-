/* ==========================================================================
   Navigation: Burger-Menü und Link-Attrappen
   --------------------------------------------------------------------------
   - Der Burger-Button öffnet und schliesst das mobile Menü.
     Schliessen auch per Escape-Taste, per Klick auf einen Menüpunkt oder
     wenn das Fenster auf Desktop-Breite wächst.
   - Alle Links mit href="#" sind reine Attrappen: Sie sehen klickbar aus
     (Hover-, Fokus- und Klickzustände), lösen aber keine Aktion aus.
   ========================================================================== */

(function () {
  'use strict';

  var DESKTOP = window.matchMedia('(min-width: 821px)');

  var root = document.documentElement;
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobile-menu');


  /* ---------- Link-Attrappen ---------- */

  /* Verhindert, dass "#"-Links an den Seitenanfang springen oder die URL ändern. */
  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href="#"]');
    if (!link) return;
    event.preventDefault();

    /* Ein Klick im mobilen Menü schliesst es wie bei einer echten Navigation. */
    if (menu && menu.contains(link)) {
      setMenu(false);
    }
  });


  /* ---------- Burger-Menü ---------- */

  if (!burger || !menu) return;

  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Menü schliessen' : 'Menü öffnen');
    menu.classList.toggle('is-open', open);
    root.classList.toggle('menu-open', open);
  }

  function isOpen() {
    return burger.getAttribute('aria-expanded') === 'true';
  }

  burger.addEventListener('click', function () {
    setMenu(!isOpen());
  });

  /* Escape schliesst das Menü und gibt den Fokus an den Burger zurück. */
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen()) {
      setMenu(false);
      burger.focus();
    }
  });

  /* Wird das Fenster breit genug für die Desktop-Navigation, Menü zurücksetzen. */
  DESKTOP.addEventListener('change', function (event) {
    if (event.matches) setMenu(false);
  });
})();
