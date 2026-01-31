
(function(){
  async function loadJSON(url){ const r=await fetch(url); return r.json(); }
  function norm(s){ return (s||"").toLowerCase(); }
  async function build(){
    const svc = await loadJSON("data/services.json");
    const idx=[];
    (svc.services||[]).forEach(s=>{
      idx.push({type:"service", title:s.title, tags:s.tags||[], text:s.desc||{}});
    });
    return idx;
  }
  async function search(q){
    const idx = await window.PP_SEARCH_INDEX;
    const n = norm(q);
    return idx.filter(it=>{
      const t = norm(it.title.en)+" "+norm(it.title.hi)+" "+norm(it.tags.join(" "))+" "+norm(it.text.en)+" "+norm(it.text.hi);
      return t.includes(n);
    });
  }
  window.PP_SEARCH = { build, search };
  window.PP_SEARCH_INDEX = build();
})();
