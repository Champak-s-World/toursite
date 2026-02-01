(function(){
  "use strict";

  // Mounts: any element with data-featured-mount will be filled.
  const mounts = Array.from(document.querySelectorAll("[data-featured-mount]"));
  if(!mounts.length) return;

  function getLang(){ return (window.PP_LANG && window.PP_LANG.getLang) ? window.PP_LANG.getLang() : "en"; }
  function t(obj){ const L=getLang(); return obj ? (obj[L]||obj.en||"") : ""; }

  function chip(tag){
    const s=document.createElement("span");
    s.className="pp-chip";
    s.textContent=tag;
    return s;
  }

  function waUrl(text){
    const digits = (window.PP_CONFIG && window.PP_CONFIG.contact && window.PP_CONFIG.contact.phoneE164)
      ? window.PP_CONFIG.contact.phoneE164.replace(/\D/g,"")
      : "";
    return digits ? ("https://wa.me/"+digits+"?text="+encodeURIComponent(text)) : ("https://wa.me/?text="+encodeURIComponent(text));
  }

  async function loadJson(url){
    const r = await fetch(url, {cache:"no-store"});
    if(!r.ok) throw new Error("Failed to load "+url);
    return r.json();
  }

  function pickFeatured(list, maxItems){
    const featured = (list||[]).filter(x=>x && x.featured);
    featured.sort((a,b)=>(a.featuredRank||999)-(b.featuredRank||999));
    return featured.slice(0, maxItems);
  }

  function card(item, type){
    const el=document.createElement("article");
    el.className="pp-exp";

    const top=document.createElement("div");
    top.className="pp-exp-top";

    const h=document.createElement("h3");
    h.className="pp-exp-title";
    h.textContent = t(item.title) || item.id || type;
    top.appendChild(h);

    const d=document.createElement("div");
    d.className="pp-exp-desc";
    const note = t(item.featuredNote) || "";
    const meta=[];
    if(type==="tour"){
      if(item.duration) meta.push(item.duration);
      if(item.region) meta.push(item.region);
      const locs=(item.locations||[]).slice(0,3).join(", ");
      if(locs) meta.push(locs);
    } else if(type==="ritual"){
      if(item.ritualType) meta.push(String(item.ritualType).toUpperCase());
      if(item.duration) meta.push(item.duration);
      if((item.locationOptions||[]).length) meta.push(item.locationOptions.join(", "));
    } else if(type==="katha"){
      if(item.kathaType) meta.push(String(item.kathaType).toUpperCase());
      if(item.duration) meta.push(item.duration);
    }
    d.textContent = (note ? (note + (meta.length ? " • " : "")) : "") + meta.join(" • ");
    top.appendChild(d);

    const chips=document.createElement("div");
    chips.className="pp-chiprow";
    (item.tags||[]).slice(0,6).forEach(tag=>chips.appendChild(chip(tag)));
    top.appendChild(chips);

    el.appendChild(top);

    const actions=document.createElement("div");
    actions.className="pp-exp-actions";

    const msg = t(item.whatsappText) || (t(item.title) ? ("Enquiry: "+t(item.title)) : "Enquiry");
    const a=document.createElement("a");
    a.className="pp-btn";
    a.href = waUrl(msg);
    a.target="_blank"; a.rel="noopener";
    a.textContent = t(item.ctaText) || (getLang()==="hi" ? "WhatsApp पर पूछें" : "Enquire on WhatsApp");
    actions.appendChild(a);

    // Secondary action for tours: add to tour-maker
    if(type==="tour"){
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
            const k=(name||"").toLowerCase()+"||";
            const exists=(obj.itinerary||[]).some(x=>((x.name||"").toLowerCase()+"||")===k);
            if(!exists) (obj.itinerary||[]).push({id:Math.random().toString(16).slice(2)+Date.now().toString(16), name});
          };
          (item.locations||[]).slice(0,6).forEach(add);
          localStorage.setItem(key, JSON.stringify(obj));
          alert(getLang()==="hi" ? "टूर मेकर में जोड़ा गया!" : "Added to Tour Maker!");
        }catch(e){ console.error(e); }
      });
      actions.appendChild(b);
    }

    el.appendChild(actions);
    return el;
  }

  async function renderMount(mount){
    const type = (mount.getAttribute("data-featured-type")||"all").toLowerCase();
    const limit = parseInt(mount.getAttribute("data-featured-limit")||"3", 10);
    mount.innerHTML = "";

    try{
      const [tours, rituals, kathas] = await Promise.all([
        loadJson("data/master/tours.json"),
        loadJson("data/master/rituals.json"),
        loadJson("data/master/kathas.json")
      ]);

      let items=[];
      if(type==="tour" || type==="all") items = items.concat(pickFeatured(tours.tours, limit).map(x=>({x, type:"tour"})));
      if(type==="ritual" || type==="all") items = items.concat(pickFeatured(rituals.rituals, limit).map(x=>({x, type:"ritual"})));
      if(type==="katha" || type==="all") items = items.concat(pickFeatured(kathas.kathas, limit).map(x=>({x, type:"katha"})));

      // Global sort by featuredRank within each type, then stable
      items.sort((a,b)=>(a.x.featuredRank||999)-(b.x.featuredRank||999));

      // If "all", cap to limit overall (not per type)
      if(type==="all") items = items.slice(0, limit);

      if(!items.length){
        mount.innerHTML = "<div class='pp-muted'>(No featured items set yet. Add <code>featured:true</code> in master JSON.)</div>";
        return;
      }

      items.forEach(({x, type})=> mount.appendChild(card(x, type)));
    }catch(err){
      mount.innerHTML = "<div class='pp-muted'>Featured could not load. Please use a local server (Live Server) or GitHub Pages.</div>";
      console.error(err);
    }
  }

  function init(){
    mounts.forEach(renderMount);
  }

  init();
  window.addEventListener("pp:langchange", ()=> init());
})();