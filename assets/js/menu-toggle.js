/* ==================================================
   Mobile Menu Toggle (improved)
   - Toggle via .pp-menu-btn
   - Close on outside click
   - Close when a nav link is clicked
   ================================================== */
(function () {
  "use strict";

  function getBtn(){ return document.querySelector(".pp-menu-btn"); }
  function getNav(){ return document.querySelector(".pp-nav"); }

  function setOpen(open){
    var btn = getBtn();
    var nav = getNav();
    if (!btn || !nav) return;
    nav.classList.toggle("open", !!open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".pp-menu-btn");
    var nav = getNav();

    if (btn) {
      // toggle
      if (!nav) return;
      setOpen(!nav.classList.contains("open"));
      return;
    }

    // if clicking a nav link -> close
    if (e.target.closest(".pp-nav a")) {
      setOpen(false);
      return;
    }

    // outside click closes if open
    if (nav && nav.classList.contains("open")) {
      var insideNav = e.target.closest(".pp-nav");
      if (!insideNav) setOpen(false);
    }
  });

  // Close menu on resize to desktop
  window.addEventListener("resize", function(){
    if (window.innerWidth > 720) setOpen(false);
  });

  // After includes load, make sure menu is closed (fresh DOM)
  window.addEventListener("pp:includesloaded", function(){
    setOpen(false);
  });
})();