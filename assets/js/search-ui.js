
(function(){
  const input = document.getElementById("smartSearch");
  const out = document.getElementById("searchResults");
  if(!input||!out) return;
  let t;
  input.addEventListener("input", ()=>{
    clearTimeout(t);
    t=setTimeout(async ()=>{
      const q=input.value.trim();
      out.innerHTML="";
      if(!q) return;
      const res = await window.PP_SEARCH.search(q);
      res.forEach(r=>{
        const d=document.createElement("div");
        d.textContent = r.title.en+" (service)";
        out.appendChild(d);
      });
    },200);
  });
})();
