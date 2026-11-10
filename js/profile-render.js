/* ==========================================================================
   profile-render.js — injects the single source of personal data into every
   page. Runs before ui.js and has no dependencies.
   ========================================================================== */
(function () {
  "use strict";

  var profile = window.PROFILE;
  if (!profile) return;

  var PLACEHOLDER = /\[\[[^\]]+\]\]/;
  var foundPlaceholders = [];

  function isPlaceholder(value) {
    return typeof value === "string" && PLACEHOLDER.test(value);
  }

  function getValue(path) {
    return path.split(".").reduce(function (acc, part) {
      return acc == null ? undefined : acc[part];
    }, profile);
  }

  function markPlaceholder(el, value) {
    if (!isPlaceholder(value)) return;
    el.classList.add("is-placeholder");
    el.title = "Replace this placeholder in data/profile.js";
    if (foundPlaceholders.indexOf(value) === -1) foundPlaceholders.push(value);
  }

  /* Text values: [data-profile="email"], [data-profile="address"], etc. */
  document.querySelectorAll("[data-profile]").forEach(function (el) {
    var value = getValue(el.getAttribute("data-profile"));
    if (value == null) return;
    el.textContent = String(value);
    markPlaceholder(el, value);
  });

  /* External links: [data-link="github"], [data-link="commitit"] */
  document.querySelectorAll("[data-link]").forEach(function (link) {
    var value = getValue("links." + link.getAttribute("data-link"));
    if (!value || isPlaceholder(value)) {
      link.setAttribute("aria-disabled", "true");
      return;
    }
    link.href = value;
    if (/^https?:\/\//.test(value)) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
  });

  /* Resume download links */
  document.querySelectorAll("[data-resume-link]").forEach(function (link) {
    if (profile.resumePdf && !isPlaceholder(profile.resumePdf)) {
      link.href = profile.resumePdf;
      link.setAttribute("download", "");
    }
  });

  /* Optional portrait. The monogram fallback is shown until a real path is set. */
  var photo = document.querySelector("[data-photo]");
  if (photo) {
    if (profile.photo && !isPlaceholder(profile.photo)) {
      photo.addEventListener("load", function () {
        photo.hidden = false;
        var fallback = document.querySelector("[data-photo-fallback]");
        if (fallback) fallback.hidden = true;
      });
      photo.addEventListener("error", function () {
        photo.hidden = true;
      });
      photo.src = profile.photo;
      photo.alt = "Portrait of " + profile.name;
    } else {
      markPlaceholder(photo, profile.photo);
    }
  }

  /* Show the "fill in profile.js" note only while at least one placeholder
     actually exists on this page. */
  document.querySelectorAll("[data-placeholder-note]").forEach(function (note) {
    note.hidden = foundPlaceholders.length === 0;
  });

  document.documentElement.dataset.profileReady = "true";
  window.AAI_PROFILE_PLACEHOLDERS = foundPlaceholders.slice();
})();
