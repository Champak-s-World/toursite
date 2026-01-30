/* ==================================================
   External Scripts Loader (central)
   Reason: <script> inside fetched includes (innerHTML) will NOT execute.
   This file safely injects required external scripts once per page.
   ================================================== */
(function () {
  "use strict";
  var SRC = "https://programmer-s-picnic.github.io/json-images/find-on-page.js";

  function alreadyLoaded() {
    return !!document.querySelector('script[src="' + SRC + '"]');
  }

  function load() {
    if (alreadyLoaded()) return;
    var s = document.createElement("script");
    s.src = SRC;
    s.defer = true;
    document.head.appendChild(s);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }

  window.addEventListener("pp:includesloaded", load);
})();
