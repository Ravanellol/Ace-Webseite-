/* ==========================================================================
   Intro-Animation: Cursor-Taschenlampe
   --------------------------------------------------------------------------
   Ablauf:
   1. Beim Laden verdeckt ein schwarzes Overlay die ganze Seite.
   2. Ein weicher Lichtkegel (170 px Radius) folgt dem Mauszeiger flüssig.
      Auf Touch-Geräten ohne Maus bleibt er in der Bildschirmmitte.
   3. Genau 5 s nach dem Laden (window "load") weitet sich der Kegel von der
      aktuellen Position aus in 1 s auf den ganzen Bildschirm aus. Danach
      wird das Overlay entfernt und die Seite ist normal bedienbar.
   4. Während des Intros ist Scrollen gesperrt. «Intro überspringen» oder die
      Escape-Taste beenden es sofort. Bei prefers-reduced-motion entfällt es.

   Das Skript wird bewusst synchron im <head> geladen: So steht die Klasse
   .intro-active schon vor dem ersten Rendern fest und die Seite blitzt nicht auf.
   Gezeichnet wird ausschliesslich über CSS-Variablen (siehe css/intro.css).
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- Einstellungen ---------- */
  var CONFIG = {
    radius: 170,          // Radius des Lichtkegels in px
    delay: 5000,          // ms nach dem Laden bis zum Aufweiten
    expandDuration: 1000, // ms für das Aufweiten auf den ganzen Bildschirm
    skipDuration: 350,    // ms für das Aufweiten beim Überspringen
    fadeDuration: 300,    // ms für das Ausblenden des Overlays (wie in intro.css)
    follow: 0.18,         // Nachzieh-Faktor pro Frame (0–1, höher = direkter)
    clearStop: 0.4        // Anteil des Radius, der voll beleuchtet ist (wie in intro.css)
  };

  var root = document.documentElement;

  /* Bei reduzierter Bewegung gibt es kein Intro. */
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    return;
  }

  /* Overlay aktivieren, bevor die Seite gezeichnet wird. */
  root.classList.add('intro-active');

  /* Nach dem Intro soll oben (beim Hero) begonnen werden, nicht an einer
     vom Browser wiederhergestellten Scrollposition. */
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  /* Gibt es eine echte Maus? Sonst (Touch) bleibt das Licht in der Mitte. */
  var hasMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Zustand ---------- */
  var intro = null;       // Overlay-Element
  var skipButton = null;  // Button «Intro überspringen»
  var target = { x: 0, y: 0 };  // wohin der Kegel will (Cursor)
  var current = { x: 0, y: 0 }; // wo der Kegel gerade ist (geglättet)
  var radius = CONFIG.radius;
  var phase = 'follow';   // 'follow' → 'expanding' → 'done'
  var frameId = 0;
  var lastTime = 0;
  var timerId = 0;


  /* ---------- Hilfsfunktionen ---------- */

  /* Schreibt Position und Radius als CSS-Variablen auf das Overlay. */
  function paint() {
    intro.style.setProperty('--intro-x', current.x.toFixed(1) + 'px');
    intro.style.setProperty('--intro-y', current.y.toFixed(1) + 'px');
    intro.style.setProperty('--intro-r', radius.toFixed(1) + 'px');
  }

  /* Bildschirmmitte als Startpunkt (und Dauerposition auf Touch-Geräten). */
  function center() {
    target.x = window.innerWidth / 2;
    target.y = window.innerHeight / 2;
  }

  /* Radius, bei dem auch die entfernteste Bildschirmecke voll beleuchtet ist. */
  function fullRadius() {
    var dx = Math.max(current.x, window.innerWidth - current.x);
    var dy = Math.max(current.y, window.innerHeight - current.y);
    return Math.hypot(dx, dy) / CONFIG.clearStop + 2;
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }


  /* ---------- Cursor verfolgen ---------- */

  function onPointerMove(event) {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    target.x = event.clientX;
    target.y = event.clientY;
  }

  /* Animationsschleife: zieht den Kegel weich zur Zielposition nach.
     Der Faktor wird an die Bildrate angepasst (60/120 Hz fühlen sich gleich an). */
  function tick(time) {
    var dt = lastTime ? Math.min(time - lastTime, 64) : 16.67;
    lastTime = time;

    var k = 1 - Math.pow(1 - CONFIG.follow, dt / 16.67);
    current.x += (target.x - current.x) * k;
    current.y += (target.y - current.y) * k;
    paint();

    if (phase === 'follow') {
      frameId = requestAnimationFrame(tick);
    }
  }


  /* ---------- Aufweiten und Beenden ---------- */

  /* Weitet den Lichtkegel von der aktuellen Position auf den ganzen
     Bildschirm aus und entfernt danach das Overlay. */
  function expand(duration) {
    if (phase !== 'follow') return;
    phase = 'expanding';
    cancelAnimationFrame(frameId);
    clearTimeout(timerId);

    intro.classList.add('is-expanding');
    skipButton.classList.add('is-hidden');

    var from = radius;
    var to = fullRadius();
    var start = performance.now();

    function grow(now) {
      var t = Math.min((now - start) / duration, 1);
      radius = from + (to - from) * easeInOutCubic(t);
      paint();
      if (t < 1) {
        requestAnimationFrame(grow);
      } else {
        finish();
      }
    }
    requestAnimationFrame(grow);
  }

  /* Alles ist hell: Overlay ausblenden, Scroll-Sperre lösen, aufräumen. */
  function finish() {
    phase = 'done';
    intro.classList.add('is-done');

    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('keydown', onKeyDown);

    setTimeout(function () {
      root.classList.remove('intro-active');
      intro.remove();
      skipButton.remove();
    }, CONFIG.fadeDuration);
  }

  function skip() {
    expand(CONFIG.skipDuration);
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') skip();
  }

  function onResize() {
    if (!hasMouse) center();
  }

  /* 5-Sekunden-Timer ab dem vollständigen Laden der Seite. */
  function startTimer() {
    timerId = setTimeout(function () {
      expand(CONFIG.expandDuration);
    }, CONFIG.delay);
  }


  /* ---------- Start ---------- */

  function init() {
    intro = document.getElementById('intro');
    skipButton = document.getElementById('intro-skip');

    /* Markup fehlt? Dann Seite einfach freigeben. */
    if (!intro || !skipButton) {
      root.classList.remove('intro-active');
      return;
    }

    window.scrollTo(0, 0);

    center();
    current.x = target.x;
    current.y = target.y;
    paint();

    if (hasMouse) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    }
    window.addEventListener('resize', onResize);
    document.addEventListener('keydown', onKeyDown);
    skipButton.addEventListener('click', skip);

    frameId = requestAnimationFrame(tick);

    if (document.readyState === 'complete') {
      startTimer();
    } else {
      window.addEventListener('load', startTimer, { once: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
