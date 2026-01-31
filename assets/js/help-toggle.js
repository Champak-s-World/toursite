(function(){
  "use strict";
  const btn=document.getElementById("helpToggle");
  const body=document.getElementById("helpBody");
  if(!btn||!body) return;

  function setOpen(open){
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.textContent = open ? "Hide" : "Show";
    body.hidden = !open;
  }

  btn.addEventListener("click", ()=>{
    const open = btn.getAttribute("aria-expanded")==="true";
    setOpen(!open);
  });

  setOpen(false);
})();