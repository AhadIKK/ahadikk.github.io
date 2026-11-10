/* ==========================================================================
   home.js — typewriter for the hero role line
   ========================================================================== */
(function () {
  "use strict";

  var roleEl = document.getElementById("typed-role");
  if (!roleEl) return;

  var roles = (window.PROFILE && window.PROFILE.roles) || [
    "Full Stack Developer",
    "AI Prompt Engineer",
    "CSE Student"
  ];
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var roleIndex = 0;
  var charIndex = roles[0].length;
  var deleting = false;

  roleEl.textContent = roles[0];

  if (reduceMotion || roles.length < 2) return;

  function tick() {
    var current = roles[roleIndex];

    if (!deleting && charIndex === current.length) {
      window.setTimeout(function () {
        deleting = true;
        tick();
      }, 1800);
      return;
    }

    if (deleting && charIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      window.setTimeout(tick, 280);
      return;
    }

    charIndex += deleting ? -1 : 1;
    roleEl.textContent = roles[roleIndex].slice(0, charIndex);
    window.setTimeout(tick, deleting ? 32 : 62);
  }

  window.setTimeout(tick, 1700);
})();
