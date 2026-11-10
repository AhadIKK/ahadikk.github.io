/* ==========================================================================
   ui.js — theme, navigation, preloader, page transitions, cursor, toast,
   copy-to-clipboard, scroll progress, back-to-top and magnetic buttons.
   Uses jQuery for DOM actions and small vanilla helpers for scroll/cursor.
   ========================================================================== */
(function ($) {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var root = document.documentElement;
  var profile = window.PROFILE || {};
  var PLACEHOLDER = /\[\[[^\]]+\]\]/;

  function isPlaceholder(value) {
    return typeof value === "string" && PLACEHOLDER.test(value);
  }

  /* ---------------------------------------------------------------------
     1. Theme — persisted in localStorage, defaults to the OS preference.
     The tiny inline script in <head> prevents a flash of the wrong theme.
     --------------------------------------------------------------------- */
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var themeColours = { dark: "#0b0e10", light: "#f4f1e8" };

  function applyTheme(theme, animate) {
    if (animate) {
      root.classList.add("theme-transition");
      window.setTimeout(function () {
        root.classList.remove("theme-transition");
      }, 420);
    }
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    if (themeMeta) themeMeta.setAttribute("content", themeColours[theme] || themeColours.dark);
    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      var next = theme === "dark" ? "light" : "dark";
      button.setAttribute("aria-label", "Switch to " + next + " theme");
      button.setAttribute("title", "Switch to " + next + " theme");
    });
  }

  function storedTheme() {
    try {
      return localStorage.getItem("aai-theme");
    } catch (error) {
      return null;
    }
  }

  applyTheme(root.getAttribute("data-theme") || storedTheme() || "dark", false);

  $("[data-theme-toggle]").on("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next, true);
    try {
      localStorage.setItem("aai-theme", next);
    } catch (error) {
      /* Private mode: the theme still works for this visit. */
    }
    window.AAI.toast(next === "light" ? "Light theme on" : "Dark theme on");
  });

  /* ---------------------------------------------------------------------
     2. Active navigation link
     --------------------------------------------------------------------- */
  var currentPage = window.location.pathname.split("/").pop() || "index.html";
  if (currentPage === "") currentPage = "index.html";
  document.querySelectorAll(".nav-list a, .mobile-nav a").forEach(function (link) {
    var href = link.getAttribute("href") || "";
    if (href === currentPage) {
      link.setAttribute("aria-current", "page");
    }
  });
  if (currentPage === "contact.html") {
    var contactCta = document.querySelector(".nav-cta");
    if (contactCta) contactCta.setAttribute("aria-current", "page");
  }

  /* Hover-latching pill for the primary navigation. One shared background
     slides to whichever label is hovered/focused, then returns to the page
     that is actually open. */
  var navList = document.getElementById("primary-nav-list");
  if (navList) {
    var navLinks = Array.prototype.slice.call(navList.querySelectorAll("a"));
    var navActive = navList.querySelector('a[aria-current="page"]');
    var navHovered = null;

    function moveNavIndicator(link) {
      if (!link || !navList.offsetWidth) {
        navList.classList.remove("has-indicator");
        return;
      }
      navList.style.setProperty("--nav-indicator-x", link.offsetLeft + "px");
      navList.style.setProperty("--nav-indicator-w", link.offsetWidth + "px");
      navList.classList.add("has-indicator");
    }

    function restNavIndicator() {
      navHovered = null;
      var focused = document.activeElement && document.activeElement.closest
        ? document.activeElement.closest(".nav-list a")
        : null;
      moveNavIndicator(focused || navActive);
    }

    navLinks.forEach(function (link) {
      link.addEventListener("mouseenter", function () {
        navHovered = link;
        moveNavIndicator(link);
      });
      link.addEventListener("focus", function () {
        moveNavIndicator(link);
      });
    });

    navList.addEventListener("mouseleave", restNavIndicator);
    navList.addEventListener("focusout", function () {
      window.setTimeout(function () {
        if (!navList.contains(document.activeElement)) restNavIndicator();
      }, 0);
    });

    window.addEventListener("resize", function () {
      moveNavIndicator(navHovered || navActive);
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        moveNavIndicator(navHovered || navActive);
      });
    }

    moveNavIndicator(navActive);
  }

  /* ---------------------------------------------------------------------
     3. Mobile navigation — accessible panel with focus + scroll handling
     --------------------------------------------------------------------- */
  var $toggle = $(".nav-toggle");
  var $panel = $(".mobile-panel");
  var $scrim = $(".nav-scrim");
  var panel = $panel[0];
  var toggle = $toggle[0];

  function openNav() {
    if (!panel || !toggle) return;
    panel.classList.add("is-open");
    panel.removeAttribute("inert");
    $scrim.addClass("is-open");
    $toggle.attr("aria-expanded", "true").attr("aria-label", "Close menu");
    $("body").addClass("nav-open");
    window.setTimeout(function () {
      var first = panel.querySelector("a, button");
      if (first) first.focus();
    }, 180);
  }

  function closeNav(restoreFocus) {
    if (!panel || !toggle) return;
    panel.classList.remove("is-open");
    $scrim.removeClass("is-open");
    $toggle.attr("aria-expanded", "false").attr("aria-label", "Open menu");
    $("body").removeClass("nav-open");
    window.setTimeout(function () {
      if (panel.classList.contains("is-open")) return;
      panel.setAttribute("inert", "");
    }, 420);
    if (restoreFocus) toggle.focus();
  }

  $toggle.on("click", function () {
    var isOpen = $toggle.attr("aria-expanded") === "true";
    if (isOpen) closeNav(false);
    else openNav();
  });

  $scrim.on("click", function () {
    closeNav(true);
  });

  $panel.on("click", "a", function () {
    closeNav(false);
  });

  $(document).on("keydown", function (event) {
    if (event.key === "Escape" && $toggle.attr("aria-expanded") === "true") {
      closeNav(true);
    }
  });

  $(window).on("resize", function () {
    if (window.innerWidth > 980 && $toggle.attr("aria-expanded") === "true") {
      closeNav(false);
    }
  });

  /* ---------------------------------------------------------------------
     4. Header behaviour, scroll progress, back-to-top
     --------------------------------------------------------------------- */
  var header = document.getElementById("site-header");
  var progress = document.getElementById("scroll-progress-bar");
  var $toTop = $(".to-top");
  var lastScroll = window.scrollY;
  var ticking = false;

  function onScrollFrame() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;

    if (progress) progress.style.transform = "scaleX(" + ratio + ")";

    if (header) {
      header.classList.toggle("is-scrolled", y > 14);
      var menuOpen = $toggle.attr("aria-expanded") === "true";
      if (!menuOpen && !reduceMotion && y > 250 && y > lastScroll + 5) {
        header.classList.add("is-hidden");
      } else if (y < lastScroll - 5 || y < 180 || menuOpen) {
        header.classList.remove("is-hidden");
      }
    }

    if ($toTop.length) {
      $toTop.toggleClass("is-visible", y > 650);
    }

    lastScroll = y;
    ticking = false;
  }

  function requestScrollFrame() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScrollFrame);
    }
  }

  window.addEventListener("scroll", requestScrollFrame, { passive: true });
  window.addEventListener("resize", requestScrollFrame);
  onScrollFrame();

  $(document).on("focusin", function (event) {
    if (header && event.target.closest(".site-header")) {
      header.classList.remove("is-hidden");
    }
  });

  $toTop.on("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ---------------------------------------------------------------------
     5. Preloader — content is visible underneath; this only removes the veil.
     --------------------------------------------------------------------- */
  var preloader = document.querySelector(".preloader");
  var preloaderStart = performance.now();

  function hidePreloader() {
    if (!preloader) return;
    var internalNav = root.classList.contains("is-internal-nav");
    var minimum = internalNav ? 180 : 650;
    var wait = Math.max(0, minimum - (performance.now() - preloaderStart));
    window.setTimeout(function () {
      preloader.classList.add("is-loaded");
      window.setTimeout(function () {
        if (preloader && preloader.parentNode) preloader.parentNode.removeChild(preloader);
      }, 600);
    }, wait);
  }

  if (document.readyState === "complete") {
    hidePreloader();
  } else {
    window.addEventListener("load", hidePreloader, { once: true });
  }
  window.setTimeout(hidePreloader, 1500); // failsafe, never block content

  /* ---------------------------------------------------------------------
     6. Page transition — a short curtain on internal navigation.
     A one-shot session flag tells the next page to use the logo-only
     preloader. This listener runs even with reduced motion, where the
     visual curtain itself is disabled.
     --------------------------------------------------------------------- */
  document.addEventListener(
    "click",
    function (event) {
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var link = event.target.closest("a");
      if (!link) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;
      var href = link.getAttribute("href");
      if (!href || href.charAt(0) === "#" || /^(mailto:|tel:|javascript:)/i.test(href)) return;

      var target;
      try {
        target = new URL(href, window.location.href);
      } catch (error) {
        return;
      }
      if (target.origin !== window.location.origin) return;
      if (target.pathname === window.location.pathname) return;
      if (!/\.html?$/.test(target.pathname) && target.pathname.charAt(target.pathname.length - 1) !== "/") {
        return;
      }

      try {
        sessionStorage.setItem("aai-internal-nav", "1");
      } catch (error) {
        /* Private mode: fall back to the full intro. */
      }
    },
    true
  );

  var transition = document.querySelector(".page-transition");
  if (!reduceMotion && transition) {
    document.addEventListener("click", function (event) {
      var link = event.target.closest("a");
      if (!link) return;
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;
      if (link.hasAttribute("data-no-transition")) return;
      var href = link.getAttribute("href");
      if (!href || href.charAt(0) === "#" || /^(mailto:|tel:|javascript:)/i.test(href)) return;

      var target;
      try {
        target = new URL(href, window.location.href);
      } catch (error) {
        return;
      }
      if (target.origin !== window.location.origin) return;
      if (target.pathname === window.location.pathname && target.hash) return;
      if (!/\.html?$/.test(target.pathname) && target.pathname.charAt(target.pathname.length - 1) !== "/") {
        return;
      }

      event.preventDefault();
      transition.classList.add("is-leaving");
      window.setTimeout(function () {
        window.location.assign(target.href);
      }, 240);
    });
  }

  window.addEventListener("pageshow", function (event) {
    if (transition) transition.classList.remove("is-leaving");
    if (event.persisted && preloader) preloader.classList.add("is-loaded");
    document.body.classList.add("page-enter");
    window.setTimeout(function () {
      document.body.classList.remove("page-enter");
    }, 700);
  });

  /* ---------------------------------------------------------------------
     7. Custom cursor + magnetic buttons (desktop, fine pointer only)
     --------------------------------------------------------------------- */
  if (finePointer && !reduceMotion && window.innerWidth > 980) {
    var dot = document.querySelector(".cursor-dot");
    var ring = document.querySelector(".cursor-ring");

    if (dot && ring) {
      document.body.classList.add("has-cursor");
      var mouseX = window.innerWidth / 2;
      var mouseY = window.innerHeight / 2;
      var ringX = mouseX;
      var ringY = mouseY;
      var cursorVisible = false;

      function cursorFrame() {
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;

        /* Keep the dot visually inside the ring even during a fast flick.
           The ring trails the pointer by at most 8px; its radius is 16px. */
        var lagX = mouseX - ringX;
        var lagY = mouseY - ringY;
        var lag = Math.sqrt(lagX * lagX + lagY * lagY);
        var maxLag = 8;
        if (lag > maxLag) {
          ringX = mouseX - (lagX / lag) * maxLag;
          ringY = mouseY - (lagY / lag) * maxLag;
        }

        dot.style.transform = "translate3d(" + mouseX + "px," + mouseY + "px,0) translate(-50%,-50%)";
        ring.style.transform = "translate3d(" + ringX + "px," + ringY + "px,0) translate(-50%,-50%)";
        window.requestAnimationFrame(cursorFrame);
      }

      document.addEventListener("mousemove", function (event) {
        mouseX = event.clientX;
        mouseY = event.clientY;
        if (!cursorVisible) {
          cursorVisible = true;
          dot.style.opacity = "1";
          ring.style.opacity = "1";
        }
      });

      document.addEventListener("mouseleave", function () {
        cursorVisible = false;
        dot.style.opacity = "0";
        ring.style.opacity = "0";
      });

      document.addEventListener("mouseover", function (event) {
        if (event.target.closest("a, button, .filter-btn, input, textarea, .project-card")) {
          ring.classList.add("is-active");
        }
      });

      document.addEventListener("mouseout", function (event) {
        if (event.target.closest("a, button, .filter-btn, input, textarea, .project-card")) {
          ring.classList.remove("is-active");
        }
      });

      window.requestAnimationFrame(cursorFrame);
    }

    document.querySelectorAll("[data-magnetic]").forEach(function (element) {
      element.addEventListener("pointermove", function (event) {
        var rect = element.getBoundingClientRect();
        var x = (event.clientX - rect.left - rect.width / 2) * 0.09;
        var y = (event.clientY - rect.top - rect.height / 2) * 0.14;
        element.style.translate = Math.max(-5, Math.min(5, x)) + "px " + Math.max(-4, Math.min(4, y)) + "px";
      });
      element.addEventListener("pointerleave", function () {
        element.style.translate = "";
      });
    });
  }

  /* ---------------------------------------------------------------------
     8. 3D tilt on project cards
     --------------------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      card.addEventListener("pointermove", function (event) {
        var rect = card.getBoundingClientRect();
        var px = (event.clientX - rect.left) / rect.width - 0.5;
        var py = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform =
          "perspective(1100px) rotateX(" + (-py * 4).toFixed(2) + "deg) rotateY(" + (px * 5).toFixed(2) + "deg)";
      });
      card.addEventListener("pointerleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ---------------------------------------------------------------------
     9. Ripple micro-interaction
     --------------------------------------------------------------------- */
  if (!reduceMotion) {
    $(document).on("click", ".btn", function (event) {
      var button = this;
      var rect = button.getBoundingClientRect();
      var ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.left = event.clientX - rect.left + "px";
      ripple.style.top = event.clientY - rect.top + "px";
      button.appendChild(ripple);
      window.setTimeout(function () {
        if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
      }, 700);
    });
  }

  /* ---------------------------------------------------------------------
     10. Toast + copy email
     --------------------------------------------------------------------- */
  var toast = document.getElementById("toast");
  var toastTimer;

  function showToast(message, type) {
    if (!toast) return;
    var icon =
      type === "error"
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7"/></svg>';
    toast.classList.toggle("toast--error", type === "error");
    toast.innerHTML = icon;
    var span = document.createElement("span");
    span.textContent = message;
    toast.appendChild(span);
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 3400);
  }

  window.AAI = window.AAI || {};
  window.AAI.toast = showToast;
  window.AAI.reducedMotion = reduceMotion;

  $(document).on("click", "[data-copy-email]", function () {
    var email = profile.email;
    if (!email || isPlaceholder(email)) {
      showToast("Add your email in data/profile.js first.", "error");
      return;
    }

    function copied() {
      showToast("Email copied — " + email);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(email).then(copied).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }

    function fallbackCopy() {
      var input = document.createElement("textarea");
      input.value = email;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand("copy");
        copied();
      } catch (error) {
        showToast("Could not copy — please select the email manually.", "error");
      }
      document.body.removeChild(input);
    }
  });

  /* ---------------------------------------------------------------------
     11. Print button + footer year
     --------------------------------------------------------------------- */
  $(document).on("click", "[data-print]", function () {
    window.print();
  });

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
    el.setAttribute("datetime", String(new Date().getFullYear()));
  });

  /* ---------------------------------------------------------------------
     12. Respect changes to reduced motion at runtime.
     --------------------------------------------------------------------- */
  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motionQuery.addEventListener) {
    motionQuery.addEventListener("change", function () {
      if (motionQuery.matches) {
        document.body.classList.remove("has-cursor");
        document.querySelectorAll("[data-reveal]").forEach(function (el) {
          el.classList.add("is-revealed");
        });
      }
    });
  }
})(jQuery);
