(function () {
  "use strict";
  async function loadInclude(el) {
    const url = el.getAttribute("data-include");
    if (!url) return;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Include load failed: " + url);
    el.innerHTML = await res.text();
  }
  function markActiveNav() {
    const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll("[data-nav]").forEach(function(a){
      const target = (a.getAttribute("data-nav") || "").toLowerCase();
      a.classList.toggle("is-active", target === file);
    });
  }
  async function loadAll() {
    const nodes = Array.from(document.querySelectorAll("[data-include]"));
    for (const el of nodes) await loadInclude(el);
    markActiveNav();
    window.dispatchEvent(new CustomEvent("pp:includesloaded"));
  }
  loadAll().catch(console.error);
})();