/* ==========================================================================
   projects.js — jQuery category filter + accessible native <dialog> case
   studies. Content for each case study lives in a <template> in projects.html.
   ========================================================================== */
(function ($) {
  "use strict";

  $(function () {
    var $cards = $("[data-project-card]");
    var $filterButtons = $(".filter-btn");
    var $result = $("[data-filter-result]");

    /* Fill the counts from the actual cards, so they can never go stale. */
    $filterButtons.each(function () {
      var filter = $(this).data("filter");
      var count = filter === "all" ? $cards.length : 0;
      if (filter !== "all") {
        $cards.each(function () {
          if (String($(this).data("categories")).split(/\s+/).indexOf(filter) !== -1) count++;
        });
      }
      $(this).find(".filter-count").text(count);
    });

    function applyFilter(filter, initial) {
      var visible = 0;
      $cards.each(function () {
        var categories = String($(this).data("categories")).split(/\s+/);
        var show = filter === "all" || categories.indexOf(filter) !== -1;
        $(this).toggleClass("is-filtered", !show);
        if (show) visible++;
      });

      $filterButtons.each(function () {
        $(this).attr("aria-pressed", String($(this).data("filter") === filter));
      });

      if ($result.length) {
        var label = filter === "all" ? "projects" : filter + " projects";
        $result.text("Showing " + visible + " of " + $cards.length + " " + label);
      }

      /* Filtering changes the grid height and which cards are painted.
         Refresh ScrollTrigger and make sure newly shown cards are visible
         even if their reveal tween has not fired yet. */
      if (!initial && window.ScrollTrigger) window.ScrollTrigger.refresh();
      if (!initial && window.gsap) {
        window.gsap.set($cards.not(".is-filtered").toArray(), { autoAlpha: 1, y: 0 });
      }
    }

    $filterButtons.on("click", function () {
      applyFilter(String($(this).data("filter")), false);
    });

    applyFilter("all", true);

    /* ---- Case-study dialog ------------------------------------------------ */
    var dialog = document.getElementById("case-dialog");
    var content = document.getElementById("case-content");
    var title = document.getElementById("case-title");
    var kicker = document.getElementById("case-kicker");
    var opener = null;

    function openCase(button) {
      if (!dialog || !content) return;
      var project = button.getAttribute("data-project");
      var template = document.getElementById("case-" + project);
      if (!template) return;

      opener = button;
      title.textContent = button.getAttribute("data-title") || "Case study";
      kicker.textContent = button.getAttribute("data-kicker") || "Project case study";
      content.replaceChildren(document.importNode(template.content, true));

      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
      document.body.classList.add("modal-open");
      var closeButton = dialog.querySelector("[data-close-case]");
      if (closeButton) closeButton.focus();
    }

    function closeCase() {
      if (!dialog) return;
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
      document.body.classList.remove("modal-open");
      if (opener && opener.isConnected) opener.focus();
    }

    $(document).on("click", "[data-case]", function () {
      openCase(this);
    });

    $(document).on("click", "[data-close-case]", function () {
      closeCase();
    });

    if (dialog) {
      dialog.addEventListener("click", function (event) {
        if (event.target === dialog) closeCase();
      });
      dialog.addEventListener("close", function () {
        document.body.classList.remove("modal-open");
      });
    }

    /* Allow links like projects.html#commitit to open the right case study. */
    if (window.location.hash) {
      var hash = window.location.hash.slice(1);
      var card = document.getElementById(hash);
      var caseButton = card ? card.querySelector("[data-case]") : null;
      if (caseButton) {
        window.setTimeout(function () {
          openCase(caseButton);
        }, 320);
      }
    }
  });
})(jQuery);
