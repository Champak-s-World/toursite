(function () {
  "use strict";
  const KEY = "pp_lang";
  const SUPPORTED = new Set(["en", "hi"]);

  function getParamLang() {
    const u = new URL(location.href);
    const v = (u.searchParams.get("lang") || "").toLowerCase().trim();
    return SUPPORTED.has(v) ? v : null;
  }
  function getStoredLang() {
    const v = (localStorage.getItem(KEY) || "").toLowerCase().trim();
    return SUPPORTED.has(v) ? v : null;
  }
  function setDocumentLang(lang) {
    document.documentElement.lang = (lang === "hi") ? "hi" : "en";
    document.documentElement.dataset.lang = lang;
  }
  function setLang(lang) {
    const safe = SUPPORTED.has(lang) ? lang : "en";
    localStorage.setItem(KEY, safe);

    const u = new URL(location.href);
    u.searchParams.set("lang", safe);
    history.replaceState({}, "", u.toString());

    setDocumentLang(safe);
    return safe;
  }
  function getLang() {
    const p = getParamLang();
    if (p) return setLang(p);
    const s = getStoredLang();
    if (s) { setDocumentLang(s); return s; }
    setDocumentLang("en");
    return "en";
  }
  function bindToggle() {
    const btn = document.getElementById("langToggle");
    if (!btn || btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", function(){
      const now = getLang();
      const next = (now === "en") ? "hi" : "en";
      setLang(next);
      window.dispatchEvent(new CustomEvent("pp:langchange", { detail: { lang: next } }));
    });
  }
  getLang();
  window.addEventListener("pp:includesloaded", bindToggle);
  bindToggle();
  window.PP_LANG = { getLang: getLang, setLang: setLang };
})();