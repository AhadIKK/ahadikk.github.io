/* ==========================================================================
   animations.js — GSAP + ScrollTrigger choreography
   Every content block is visible by default; motion is an enhancement.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;

  function setCountersFinal() {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      var pad = parseInt(el.getAttribute("data-pad") || "0", 10);
      if (Number.isFinite(target)) {
        el.textContent = pad ? String(target).padStart(pad, "0") : String(target);
      }
    });
  }

  /* If GSAP is unavailable (offline CDN failure, for example), leave the
     CSS default states alone and make sure meters are readable. */
  if (!gsap) {
    root.classList.add("no-gsap");
    document.querySelectorAll(".meter__fill").forEach(function (fill) {
      fill.style.transform = "scaleX(1)";
    });
    setCountersFinal();
    return;
  }

  if (reduceMotion) {
    root.classList.add("reduce-motion");
    document.querySelectorAll(".meter__fill").forEach(function (fill) {
      fill.style.transform = "scaleX(1)";
    });
    document.querySelectorAll(".timeline__track").forEach(function (track) {
      track.style.transform = "scaleY(1)";
    });
    setCountersFinal();
    return;
  }

  if (ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---- Hero entrance ---------------------------------------------------- */
  var hero = document.querySelector(".hero");
  if (hero) {
    var tl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 0.9 },
      delay: 0.18
    });

    tl.from(".hero__eyebrow", { y: 16, autoAlpha: 0, duration: 0.55 })
      .from(".hero__title .line", { y: 54, autoAlpha: 0, stagger: 0.09, duration: 1 }, "-=0.25")
      .from(".hero__role", { y: 18, autoAlpha: 0, duration: 0.65 }, "-=0.45")
      .from(".hero__copy", { y: 18, autoAlpha: 0, duration: 0.65 }, "-=0.5")
      .from(".hero__actions .btn", { y: 16, autoAlpha: 0, stagger: 0.08, duration: 0.55 }, "-=0.42")
      .from(".hero__proof", { y: 12, autoAlpha: 0, duration: 0.55 }, "-=0.38")
      .from(".hero__stage", { y: 30, autoAlpha: 0, duration: 1 }, "-=0.7")
      .from(".float-card", { scale: 0.9, autoAlpha: 0, stagger: 0.1, duration: 0.55 }, "-=0.45");
  }

  /* ---- Scroll reveals --------------------------------------------------- */
  if (ScrollTrigger) {
    var revealItems = gsap.utils.toArray("[data-reveal]");
    if (revealItems.length) {
      gsap.set(revealItems, { y: 26, autoAlpha: 0 });
      ScrollTrigger.batch(revealItems, {
        start: "top 88%",
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, {
            y: 0,
            autoAlpha: 1,
            duration: 0.8,
            stagger: 0.075,
            ease: "power2.out",
            overwrite: true,
            onComplete: function () {
              batch.forEach(function (el) {
                el.classList.add("is-revealed");
              });
            }
          });
        }
      });

      /* Content safety net: if an element is inside (or just below) the
         viewport but ScrollTrigger has not revealed it, expose it. Animation
         must never be a prerequisite for reading the page. */
      function revealVisibleFallback() {
        revealItems.forEach(function (el) {
          if (el.classList.contains("is-revealed")) return;
          var rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight * 1.05 && rect.bottom > -80) {
            if (window.getComputedStyle(el).visibility === "hidden") {
              gsap.set(el, { autoAlpha: 1, y: 0 });
              el.classList.add("is-revealed");
            }
          }
        });
      }

      window.setTimeout(revealVisibleFallback, 4200);
      var fallbackTicking = false;
      window.addEventListener(
        "scroll",
        function () {
          if (fallbackTicking) return;
          fallbackTicking = true;
          window.requestAnimationFrame(function () {
            revealVisibleFallback();
            fallbackTicking = false;
          });
        },
        { passive: true }
      );
    }

    /* ---- Timeline line draws as it enters -------------------------------- */
    document.querySelectorAll(".timeline__track").forEach(function (track) {
      gsap.fromTo(
        track,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: track.closest(".timeline") || track,
            start: "top 76%",
            end: "bottom 62%",
            scrub: 0.6
          }
        }
      );
    });

    /* ---- Skill evidence meters ------------------------------------------ */
    document.querySelectorAll(".meter__fill").forEach(function (fill) {
      var trigger = fill.closest(".skill-group") || fill;
      gsap.fromTo(
        fill,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.15,
          ease: "power3.out",
          scrollTrigger: { trigger: trigger, start: "top 82%", once: true }
        }
      );
    });

    /* ---- Counters -------------------------------------------------------- */
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      var pad = parseInt(el.getAttribute("data-pad") || "0", 10);
      if (!Number.isFinite(target)) return;

      function format(value) {
        return pad ? String(value).padStart(pad, "0") : String(value);
      }

      ScrollTrigger.create({
        trigger: el,
        start: "top 92%",
        once: true,
        onEnter: function () {
          var state = { value: 0 };
          el.textContent = format(0);
          gsap.to(state, {
            value: target,
            duration: 1.4,
            ease: "power2.out",
            onUpdate: function () {
              el.textContent = format(Math.round(state.value));
            },
            onComplete: function () {
              el.textContent = format(target);
            }
          });
        }
      });
    });

    /* ---- Gentle hero parallax ------------------------------------------- */
    if (window.innerWidth > 760) {
      gsap.to(".hero__stage", {
        yPercent: -6,
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: 0.8
        }
      });
    }

    window.addEventListener("load", function () {
      ScrollTrigger.refresh();
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        ScrollTrigger.refresh();
      });
    }
  }
})();
