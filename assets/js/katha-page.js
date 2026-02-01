(function(){
  "use strict";
  const mount = document.getElementById("kathaMount");
  if(!mount) return;

  function getLang(){ return (window.PP_LANG && window.PP_LANG.getLang) ? window.PP_LANG.getLang() : "en"; }
  function t(obj){ const L=getLang(); return obj ? (obj[L]||obj.en||"") : ""; }

  async function load(){
    const r = await fetch("data/master/kathas.json", {cache:"no-store"});
    if(!r.ok) throw new Error("Failed to load data/master/kathas.json");
    return r.json();
  }

  function chip(tag){
    const s=document.createElement("span");
    s.className="pp-chip";
    s.textContent=tag;
    return s;
  }

  function card(k){
    const el=document.createElement("article");
    el.className="pp-exp";

    const top=document.createElement("div");
    top.className="pp-exp-top";

    const h=document.createElement("h3");
    h.className="pp-exp-title";
    h.textContent=t(k.title) || k.id;
    top.appendChild(h);

    const d=document.createElement("div");
    d.className="pp-exp-desc";
    d.textContent = (t(k.specialNotes) || t(k.description) || "");
    top.appendChild(d);

    const chips=document.createElement("div");
    chips.className="pp-chiprow";
    (k.tags||[]).slice(0,8).forEach(tag=>chips.appendChild(chip(tag)));
    top.appendChild(chips);

    el.appendChild(top);

    const mid=document.createElement("div");
    mid.className="pp-exp-mid";

    const row=document.createElement("div");
    row.className="pp-row";

    const meta=document.createElement("div");
    meta.className="pp-meta";
    meta.textContent = k.duration ? ("⏳ "+k.duration) : "";
    row.appendChild(meta);

    const mini=document.createElement("div");
    mini.className="pp-mini";
    mini.textContent = (k.kathaType||"KATHA").toString().toUpperCase();
    row.appendChild(mini);

    mid.appendChild(row);
    el.appendChild(mid);

    const actions=document.createElement("div");
    actions.className="pp-exp-actions";

    const digits = (window.PP_CONFIG && window.PP_CONFIG.contact && window.PP_CONFIG.contact.phoneE164)
      ? window.PP_CONFIG.contact.phoneE164.replace(/\D/g,"")
      : "";

    const msg = t(k.whatsappText) || (t(k.title) ? ("Enquiry: "+t(k.title)) : "Enquiry for Katha");
    const wa = digits ? ("https://wa.me/"+digits+"?text="+encodeURIComponent(msg)) : ("https://wa.me/?text="+encodeURIComponent(msg));

    const a=document.createElement("a");
    a.className="pp-btn";
    a.href=wa;
    a.target="_blank"; a.rel="noopener";
    a.textContent = t(k.ctaText) || (getLang()==="hi" ? "WhatsApp पर पूछें" : "Enquire on WhatsApp");
    actions.appendChild(a);

    el.appendChild(actions);
    return el;
  }

  async function init(){
    try{
      const data = await load();
      mount.innerHTML="";
      (data.kathas||[]).forEach(k=> mount.appendChild(card(k)));
    }catch(err){
      mount.innerHTML = "<div class='pp-muted'>Could not load kathas.json. Please check <code>data/master/kathas.json</code>.</div>";
      console.error(err);
    }
  }

  init();
  window.addEventListener("pp:langchange", ()=>{ init(); });
})();