/* ==========================================================================
   Navigation: Burger-Menü und Link-Attrappen
   --------------------------------------------------------------------------
   - Der Burger-Button öffnet und schliesst das mobile Menü.
     Schliessen auch per Escape-Taste, per Klick auf einen Menüpunkt oder
     wenn das Fenster auf Desktop-Breite wächst.
   - Die Menü-Links springen zu den Abschnitten (#ablauf, #stufen, ...).
   - «Abo anfragen» springt zu #kontakt.
   - Links mit href="#" (Pikettnummer, E-Mail) sind reine Attrappen:
     Sie sehen klickbar aus, lösen aber keine Aktion aus.
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
    if (link) event.preventDefault();
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

  /* Klick auf einen Menüpunkt: Menü schliessen, der Browser springt danach
     zum Abschnitt (die Scroll-Sperre ist dann bereits aufgehoben). */
  menu.addEventListener('click', function (event) {
    if (event.target.closest('a')) setMenu(false);
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
