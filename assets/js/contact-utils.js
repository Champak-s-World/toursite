/* ==================================================
   Contact Utils — uses PP_CONFIG
   Provides: PP_CONTACT.whatsapp(), PP_CONTACT.call(), PP_CONTACT.email()
   Auto-wires links using data-pp attributes.
   ================================================== */
(function () {
  "use strict";

  function getLang() {
    return (window.PP_LANG && window.PP_LANG.getLang) ? window.PP_LANG.getLang() : "en";
  }

  function getCfg() {
    if (!window.PP_CONFIG || !window.PP_CONFIG.contact) {
      return {
        phoneE164: "+919999999999",
        email: "info@example.com",
        whatsappText: {
          en: "Namaste! I want to know about your spiritual services.",
          hi: "नमस्ते! मैं आपकी आध्यात्मिक सेवाओं के बारे में जानकारी चाहता/चाहती हूँ।"
        }
      };
    }
    return window.PP_CONFIG.contact;
  }

  function whatsapp() {
    var cfg = getCfg();
    var text = (cfg.whatsappText && (cfg.whatsappText[getLang()] || cfg.whatsappText.en)) || "";
    var digits = (cfg.phoneE164 || "").replace(/\D/g, "");
    return "https://wa.me/" + digits + "?text=" + encodeURIComponent(text);
  }

  function call() {
    var cfg = getCfg();
    return "tel:" + (cfg.phoneE164 || "");
  }

  function email(subject) {
    var cfg = getCfg();
    var em = cfg.email || "";
    if (subject && subject.trim()) {
      return "mailto:" + em + "?subject=" + encodeURIComponent(subject);
    }
    return "mailto:" + em;
  }

  function wire(root) {
    root = root || document;

    root.querySelectorAll("[data-pp='whatsapp']").forEach(function (a) {
      a.setAttribute("href", whatsapp());
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener");
    });

    root.querySelectorAll("[data-pp='call']").forEach(function (a) {
      a.setAttribute("href", call());
    });

    root.querySelectorAll("[data-pp='email']").forEach(function (a) {
      a.setAttribute("href", email(a.getAttribute("data-subject") || ""));
    });

    root.querySelectorAll("[data-pp-text='phone']").forEach(function (el) {
      el.textContent = getCfg().phoneE164 || "";
    });

    root.querySelectorAll("[data-pp-text='email']").forEach(function (el) {
      el.textContent = getCfg().email || "";
    });
  }

  function initAutoWire() {
    wire(document);
    window.addEventListener("pp:includesloaded", function(){ wire(document); });
    window.addEventListener("pp:langchange", function(){ wire(document); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAutoWire);
  } else {
    initAutoWire();
  }

  window.PP_CONTACT = { whatsapp: whatsapp, call: call, email: email, wire: wire };
})();