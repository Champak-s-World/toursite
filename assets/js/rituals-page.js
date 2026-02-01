(function(){
  "use strict";
  const mount = document.getElementById("ritualsMount");
  if(!mount) return;

  function getLang(){ return (window.PP_LANG && window.PP_LANG.getLang) ? window.PP_LANG.getLang() : "en"; }
  function t(obj){ const L=getLang(); return obj ? (obj[L]||obj.en||"") : ""; }

  async function load(){
    const r = await fetch("data/master/rituals.json", {cache:"no-store"});
    if(!r.ok) throw new Error("Failed to load data/master/rituals.json");
    return r.json();
  }

  function chip(tag){
    const s=document.createElement("span");
    s.className="pp-chip";
    s.textContent=tag;
    return s;
  }

  function waLink(rtl){
    const digits = (window.PP_CONFIG && window.PP_CONFIG.contact && window.PP_CONFIG.contact.phoneE164)
      ? window.PP_CONFIG.contact.phoneE164.replace(/\D/g,"")
      : "";
    const msg = t(rtl.whatsappText) || (t(rtl.title) ? ("Ritual enquiry: "+t(rtl.title)) : "Ritual enquiry");
    return digits ? ("https://wa.me/"+digits+"?text="+encodeURIComponent(msg)) : ("https://wa.me/?text="+encodeURIComponent(msg));
  }

  function card(rtl){
    const el=document.createElement("article");
    el.className="pp-exp";

    const top=document.createElement("div");
    top.className="pp-exp-top";

    const h=document.createElement("h3");
    h.className="pp-exp-title";
    h.textContent=t(rtl.title) || rtl.id;
    top.appendChild(h);

    const d=document.createElement("div");
    d.className="pp-exp-desc";
    const parts=[];
    if(rtl.ritualType) parts.push(rtl.ritualType.toString().toUpperCase());
    if(rtl.duration) parts.push(rtl.duration);
    if((rtl.locationOptions||[]).length) parts.push((rtl.locationOptions||[]).join(", "));
    d.textContent = parts.join(" • ");
    top.appendChild(d);

    const chips=document.createElement("div");
    chips.className="pp-chiprow";
    (rtl.tags||[]).slice(0,8).forEach(tag=>chips.appendChild(chip(tag)));
    top.appendChild(chips);

    el.appendChild(top);

    const mid=document.createElement("div");
    mid.className="pp-exp-mid";

    const p=document.createElement("div");
    p.className="pp-muted";
    p.style.lineHeight="1.6";
    p.textContent = t(rtl.purpose) || t(rtl.benefits) || "";
    mid.appendChild(p);

    el.appendChild(mid);

    const actions=document.createElement("div");
    actions.className="pp-exp-actions";

    const a=document.createElement("a");
    a.className="pp-btn";
    a.href=waLink(rtl);
    a.target="_blank"; a.rel="noopener";
    a.textContent = t(rtl.ctaText) || (getLang()==="hi" ? "WhatsApp पर पूछें" : "Enquire on WhatsApp");
    actions.appendChild(a);

    el.appendChild(actions);
    return el;
  }

  async function init(){
    try{
      const data = await load();
      mount.innerHTML="";
      (data.rituals||[]).forEach(rtl=> mount.appendChild(card(rtl)));
      if(!data.rituals || !data.rituals.length){
        mount.innerHTML = "<div class='pp-muted'>(No rituals yet)</div>";
      }
    }catch(err){
      mount.innerHTML = "<div class='pp-muted'>Could not load rituals.json. If you opened this page via <b>file://</b>, use a local server (VS Code Live Server). On GitHub Pages it will work.</div>";
      console.error(err);
    }
  }

  init();
  window.addEventListener("pp:langchange", ()=>{ init(); });
})();