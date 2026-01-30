/* ==================================================
   Theme Manager (central)
   - Switch themes using CSS variables on <html data-theme="...">
   - Persists in localStorage: pp_theme
   - Supports query param: ?theme=dark / ocean / rose / saffron
   ================================================== */
(function () {
  "use strict";

  var KEY = "pp_theme";
  var DEFAULT = "saffron";
  var THEMES = ["saffron", "dark", "ocean", "rose"];

  function getParamTheme(){
    try{
      var t = new URLSearchParams(location.search).get("theme");
      if (t && THEMES.indexOf(t) !== -1) return t;
    }catch(e){}
    return null;
  }

  function getSaved(){
    try{
      var t = localStorage.getItem(KEY);
      if (t && THEMES.indexOf(t) !== -1) return t;
    }catch(e){}
    return null;
  }

  function apply(theme){
    theme = theme || DEFAULT;
    document.documentElement.setAttribute("data-theme", theme);
    try{ localStorage.setItem(KEY, theme); }catch(e){}
    // let other components react if needed
    window.dispatchEvent(new CustomEvent("pp:themechange", { detail: { theme: theme } }));
  }

  function initUI(){
    var sel = document.getElementById("themeSelect");
    if (!sel) return;

    // populate if empty (works even if header include is dynamic)
    if (!sel.options.length){
      var opts = [
        {v:"saffron", en:"Saffron", hi:"केसर"},
        {v:"dark", en:"Dark", hi:"डार्क"},
        {v:"ocean", en:"Ocean", hi:"ओशन"},
        {v:"rose", en:"Rose", hi:"रोज़"}
      ];
      opts.forEach(function(o){
        var opt=document.createElement("option");
        opt.value=o.v;
        opt.textContent = (window.PP_LANG && window.PP_LANG.getLang && window.PP_LANG.getLang()==="hi") ? o.hi : o.en;
        sel.appendChild(opt);
      });
    }

    // set current value
    var current = document.documentElement.getAttribute("data-theme") || DEFAULT;
    sel.value = current;

    sel.addEventListener("change", function(){
      apply(sel.value);
    });

    // update option labels on language change
    window.addEventListener("pp:langchange", function(){
      var isHi = (window.PP_LANG && window.PP_LANG.getLang && window.PP_LANG.getLang()==="hi");
      Array.from(sel.options).forEach(function(opt){
        if (opt.value==="saffron") opt.textContent = isHi ? "केसर" : "Saffron";
        if (opt.value==="dark") opt.textContent = isHi ? "डार्क" : "Dark";
        if (opt.value==="ocean") opt.textContent = isHi ? "ओशन" : "Ocean";
        if (opt.value==="rose") opt.textContent = isHi ? "रोज़" : "Rose";
      });
    });
  }

  function boot(){
    var t = getParamTheme() || getSaved() || DEFAULT;
    apply(t);
    initUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // when includes are loaded later, we may get themeSelect then
  window.addEventListener("pp:includesloaded", initUI);

  window.PP_THEME = { apply: apply, list: THEMES };
})();