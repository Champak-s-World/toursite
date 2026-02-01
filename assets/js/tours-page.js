(function(){
  "use strict";
  const mount = document.getElementById("toursMount");
  if(!mount) return;

  function getLang(){ return (window.PP_LANG && window.PP_LANG.getLang) ? window.PP_LANG.getLang() : "en"; }
  function t(obj){ const L=getLang(); return obj ? (obj[L]||obj.en||"") : ""; }

  async function load(){
    const r = await fetch("data/master/tours.json", {cache:"no-store"});
    if(!r.ok) throw new Error("Failed to load data/master/tours.json");
    return r.json();
  }

  function chip(tag){
    const s=document.createElement("span");
    s.className="pp-chip";
    s.textContent=tag;
    return s;
  }

  function waLink(tour){
    const digits = (window.PP_CONFIG && window.PP_CONFIG.contact && window.PP_CONFIG.contact.phoneE164)
      ? window.PP_CONFIG.contact.phoneE164.replace(/\D/g,"")
      : "";
    const msg = t(tour.whatsappText) || (t(tour.title) ? ("Tour enquiry: "+t(tour.title)) : "Tour enquiry");
    return digits ? ("https://wa.me/"+digits+"?text="+encodeURIComponent(msg)) : ("https://wa.me/?text="+encodeURIComponent(msg));
  }

  function card(tour){
    const el=document.createElement("article");
    el.className="pp-exp";

    const top=document.createElement("div");
    top.className="pp-exp-top";

    const h=document.createElement("h3");
    h.className="pp-exp-title";
    h.textContent=t(tour.title) || tour.id;
    top.appendChild(h);

    const d=document.createElement("div");
    d.className="pp-exp-desc";
    const locs = (tour.locations||[]).slice(0,4).join(", ");
    d.textContent = (tour.region ? (tour.region+" • ") : "") + (tour.duration ? tour.duration : "") + (locs ? (" • "+locs) : "");
    top.appendChild(d);

    const chips=document.createElement("div");
    chips.className="pp-chiprow";
    (tour.tags||[]).slice(0,8).forEach(tag=>chips.appendChild(chip(tag)));
    top.appendChild(chips);

    el.appendChild(top);

    const mid=document.createElement("div");
    mid.className="pp-exp-mid";

    if((tour.activities||[]).length){
      const ul=document.createElement("ul");
      ul.className="pp-muted";
      ul.style.margin="6px 0 0 18px";
      ul.style.lineHeight="1.7";
      (tour.activities||[]).slice(0,6).forEach(a=>{
        const li=document.createElement("li");
        li.textContent=a;
        ul.appendChild(li);
      });
      mid.appendChild(ul);
    }

    el.appendChild(mid);

    const actions=document.createElement("div");
    actions.className="pp-exp-actions";

    const a=document.createElement("a");
    a.className="pp-btn";
    a.href=waLink(tour);
    a.target="_blank"; a.rel="noopener";
    a.textContent = t(tour.ctaText) || (getLang()==="hi" ? "WhatsApp पर पूछें" : "Enquire on WhatsApp");
    actions.appendChild(a);

    const b=document.createElement("button");
    b.className="pp-btn pp-btn-outline";
    b.type="button";
    b.textContent = (getLang()==="hi" ? "टूर मेकर में जोड़ें" : "Add to Tour Maker");
    b.addEventListener("click", ()=>{
      try{
        const key="pp_tour_maker_v1";
        const raw=localStorage.getItem(key);
        const obj=raw?JSON.parse(raw):{itinerary:[],notes:""};
        const add=(name)=>{
          const key2=(name||"").toLowerCase()+"||";
          const exists=(obj.itinerary||[]).some(x=>((x.name||"").toLowerCase()+"||")===key2);
          if(!exists) (obj.itinerary||[]).push({id:Math.random().toString(16).slice(2)+Date.now().toString(16), name});
        };
        (tour.locations||[]).slice(0,6).forEach(add);
        localStorage.setItem(key, JSON.stringify(obj));
        alert(getLang()==="hi" ? "टूर मेकर में जोड़ा गया!" : "Added to Tour Maker!");
      }catch(e){
        console.error(e);
      }
    });
    actions.appendChild(b);

    el.appendChild(actions);
    return el;
  }

  async function init(){
    try{
      const data = await load();
      mount.innerHTML="";
      (data.tours||[]).forEach(tour=> mount.appendChild(card(tour)));
      if(!data.tours || !data.tours.length){
        mount.innerHTML = "<div class='pp-muted'>(No tours yet)</div>";
      }
    }catch(err){
      mount.innerHTML = "<div class='pp-muted'>Could not load tours.json. If you opened this page via <b>file://</b>, use a local server (VS Code Live Server). On GitHub Pages it will work.</div>";
      console.error(err);
    }
  }

  init();
  window.addEventListener("pp:langchange", ()=>{ init(); });
})();