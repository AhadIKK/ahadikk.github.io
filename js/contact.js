/* ==========================================================================
   contact.js — client-side validation + Formspree / mailto fallback
   ========================================================================== */
(function ($) {
  "use strict";

  $(function () {
    var $form = $("#contact-form");
    if (!$form.length) return;

    var profile = window.PROFILE || {};
    var PLACEHOLDER = /\[\[[^\]]+\]\]/;
    var $status = $("#form-status");
    var $statusMessage = $status.find("[data-status-message]");
    var $submit = $form.find('button[type="submit"]');
    var $submitLabel = $submit.find(".btn__label");
    var originalLabel = $submitLabel.text();
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function isPlaceholder(value) {
      return typeof value === "string" && PLACEHOLDER.test(value);
    }

    function setStatus(message, type) {
      if (!$status.length) return;
      $status
        .toggleClass("is-visible", Boolean(message))
        .toggleClass("form-status--error", type === "error")
        .attr("role", type === "error" ? "alert" : "status");
      $statusMessage.text(message || "");
      if (message) {
        $status[0].scrollIntoView({
          block: "nearest",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
        });
      }
    }

    function setError($field, message) {
      var id = $field.attr("id");
      var $error = $("#" + id + "-error");
      if (message) {
        $field.attr("aria-invalid", "true");
        $error.text(message).addClass("is-visible");
      } else {
        $field.removeAttr("aria-invalid");
        $error.text("").removeClass("is-visible");
      }
    }

    function validateField($field) {
      var id = $field.attr("id");
      var value = String($field.val() || "").trim();
      var message = "";

      if (id === "name" && value.length < 2) {
        message = "Please enter your name (at least 2 characters).";
      } else if (id === "email" && !emailPattern.test(value)) {
        message = "Please enter a valid email address, e.g. name@example.com.";
      } else if (id === "subject" && value.length < 3) {
        message = "Give your message a short subject (at least 3 characters).";
      } else if (id === "message" && value.length < 10) {
        message = "Tell me a little more — at least 10 characters.";
      }

      setError($field, message);
      return !message;
    }

    function validateForm() {
      var firstInvalid = null;
      $form.find("[data-validate]").each(function () {
        var valid = validateField($(this));
        if (!valid && !firstInvalid) firstInvalid = this;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        setStatus("Please fix the highlighted fields and try again.", "error");
        return false;
      }
      return true;
    }

    $form.on("blur", "[data-validate]", function () {
      if (String($(this).val() || "").trim()) validateField($(this));
    });

    $form.on("input", "[data-validate]", function () {
      if ($(this).attr("aria-invalid") === "true") validateField($(this));
    });

    function resetSubmit() {
      $submit.prop("disabled", false).removeClass("is-loading").attr("aria-busy", "false");
      $submitLabel.text(originalLabel);
      $form.removeAttr("aria-busy");
    }

    function setSubmitting() {
      $submit.prop("disabled", true).addClass("is-loading").attr("aria-busy", "true");
      $submitLabel.text("Sending…");
      $form.attr("aria-busy", "true");
    }

    $form.on("submit", function (event) {
      event.preventDefault();
      setStatus("");

      /* Simple honeypot: real people never fill this hidden field. */
      if (String($form.find('input[name="company"]').val() || "").trim()) {
        return;
      }

      if (!validateForm()) return;

      var endpoint = profile.formspreeEndpoint;
      var email = profile.email;
      var data = {
        name: String($("#name").val()).trim(),
        email: String($("#email").val()).trim(),
        subject: String($("#subject").val()).trim(),
        message: String($("#message").val()).trim()
      };

      /* Preferred path: a real Formspree endpoint. */
      if (endpoint && !isPlaceholder(endpoint) && /^https?:\/\//.test(endpoint)) {
        setSubmitting();
        fetch(endpoint, {
          method: "POST",
          body: new FormData($form[0]),
          headers: { Accept: "application/json" }
        })
          .then(function (response) {
            if (!response.ok) throw new Error("Form service returned " + response.status);
            return response.json().catch(function () {
              return {};
            });
          })
          .then(function () {
            $form[0].reset();
            $form.find("[data-validate]").each(function () {
              setError($(this), "");
            });
            setStatus("Message sent. Thanks — I'll get back to you as soon as I can.", "success");
            window.AAI.toast("Message sent");
          })
          .catch(function () {
            setStatus(
              "That didn't send. Please try again, or reach me directly by email or LinkedIn.",
              "error"
            );
          })
          .finally(resetSubmit);
        return;
      }

      /* Fallback: open the visitor's email client with a pre-filled message. */
      if (email && !isPlaceholder(email)) {
        var mailSubject = "Portfolio enquiry — " + data.subject;
        var body =
          "Name: " +
          data.name +
          "\nEmail: " +
          data.email +
          "\n\n" +
          data.message;
        window.location.href =
          "mailto:" +
          encodeURIComponent(email) +
          "?subject=" +
          encodeURIComponent(mailSubject) +
          "&body=" +
          encodeURIComponent(body);
        setStatus(
          "Your email app should open with the message ready. Send it from there — or copy the email address in the sidebar.",
          "info"
        );
        return;
      }

      setStatus(
        "The form isn't connected yet. Add a Formspree endpoint or your email in data/profile.js, then try again.",
        "error"
      );
    });
  });
})(jQuery);
