(function(){
  "use strict";

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

  function parseDateYMD(s){
    if(!s || typeof s!=="string") return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
    if(!m) return null;
    const y=+m[1], mo=+m[2]-1, d=+m[3];
    const dt = new Date(Date.UTC(y, mo, d, 0, 0, 0));
    return isNaN(dt.getTime()) ? null : dt;
  }

  function todayUTC(){
    const now=new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0,0,0));
  }

  function upcomingOccasions(occasions, count){
    const base=todayUTC().getTime();
    const list=(occasions||[]).map(o=>({o, dt:parseDateYMD(o.date)}))
      .filter(x=>x.dt && x.dt.getTime()>=base)
      .sort((a,b)=>a.dt.getTime()-b.dt.getTime())
      .slice(0, count)
      .map(x=>x.o);
    return list;
  }

  function indexById(arr){
    const map=new Map();
    (arr||[]).forEach(x=>{ if(x && x.id) map.set(x.id, x); });
    return map;
  }

  function card(item, type, badgeText){
    const el=document.createElement("article");
    el.className="pp-exp";

    const top=document.createElement("div");
    top.className="pp-exp-top";

    const hwrap=document.createElement("div");
    hwrap.style.display="flex";
    hwrap.style.alignItems="center";
    hwrap.style.justifyContent="space-between";
    hwrap.style.gap="10px";

    const h=document.createElement("h3");
    h.className="pp-exp-title";
    h.style.margin="0";
    h.textContent = t(item.title) || item.id || type;
    hwrap.appendChild(h);

    if(badgeText){
      const b=document.createElement("span");
      b.className="pp-chip";
      b.textContent=badgeText;
      hwrap.appendChild(b);
    }

    top.appendChild(hwrap);

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

  async function renderCuratedFeatured(limit){
    const [tours, rituals, kathas] = await Promise.all([
      loadJson("data/master/tours.json"),
      loadJson("data/master/rituals.json"),
      loadJson("data/master/kathas.json")
    ]);
    let items=[];
    items = items.concat(pickFeatured(tours.tours, limit).map(x=>({x, type:"tour"})));
    items = items.concat(pickFeatured(rituals.rituals, limit).map(x=>({x, type:"ritual"})));
    items = items.concat(pickFeatured(kathas.kathas, limit).map(x=>({x, type:"katha"})));
    items.sort((a,b)=>(a.x.featuredRank||999)-(b.x.featuredRank||999));
    return items.slice(0, limit);
  }

  async function renderCalendarFeatured(limit){
    const [occ, tours, rituals, kathas] = await Promise.all([
      loadJson("data/master/occasions.json"),
      loadJson("data/master/tours.json"),
      loadJson("data/master/rituals.json"),
      loadJson("data/master/kathas.json")
    ]);

    const upcoming = upcomingOccasions(occ.occasions, Math.max(1, Math.min(10, limit)));
    const tMap=indexById(tours.tours);
    const rMap=indexById(rituals.rituals);
    const kMap=indexById(kathas.kathas);

    const out=[];
    const seen=new Set();
    upcoming.forEach(o=>{
      const badge = (o && o.date) ? o.date : "";
      (o.relatedTours||[]).forEach(id=>{
        const it=tMap.get(id);
        if(it && !seen.has("tour:"+id)){ out.push({x:it, type:"tour", badge}); seen.add("tour:"+id); }
      });
      (o.relatedRituals||[]).forEach(id=>{
        const it=rMap.get(id);
        if(it && !seen.has("ritual:"+id)){ out.push({x:it, type:"ritual", badge}); seen.add("ritual:"+id); }
      });
      (o.relatedKathas||[]).forEach(id=>{
        const it=kMap.get(id);
        if(it && !seen.has("katha:"+id)){ out.push({x:it, type:"katha", badge}); seen.add("katha:"+id); }
      });
    });

    return out.slice(0, limit);
  }

  async function renderMount(mount){
    const mode = (mount.getAttribute("data-featured-mode")||"mixed").toLowerCase(); // calendar|curated|mixed
    const limit = parseInt(mount.getAttribute("data-featured-limit")||"3", 10);

    mount.innerHTML = "";
    try{
      let items=[];
      if(mode==="calendar"){
        items = await renderCalendarFeatured(limit);
      } else if(mode==="curated"){
        items = await renderCuratedFeatured(limit);
      } else {
        items = await renderCalendarFeatured(limit);
        if(!items.length) items = await renderCuratedFeatured(limit);
      }

      if(!items.length){
        mount.innerHTML = "<div class='pp-muted'>(No featured items yet. Add upcoming occasions with related ids, or set featured:true in master JSON.)</div>";
        return;
      }

      items.forEach(({x, type, badge})=> mount.appendChild(card(x, type, badge)));
    }catch(err){
      mount.innerHTML = "<div class='pp-muted'>Featured could not load. Use a local server (Live Server) or GitHub Pages.</div>";
      console.error(err);
    }
  }

  function init(){ mounts.forEach(renderMount); }

  init();
  window.addEventListener("pp:langchange", ()=> init());
})();