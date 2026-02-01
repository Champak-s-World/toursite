(function(){
  "use strict";

  const STORAGE_KEY = "pp_tour_maker_v1";

  let LOC=null;
  const locByPlaceId = new Map();
  const locByName = new Map();
  function normName(s){ return String(s||"").trim().toLowerCase().replace(/\s+/g," "); }

  async function loadLocations(){
    try{
      const res = await fetch("data/master/locations.json", {cache:"no-store"});
      LOC = await res.json();
      (LOC.cities||[]).forEach(city=>{
        (city.places||[]).forEach(pl=>{
          if(pl && pl.id){
            locByPlaceId.set(pl.id, pl);
            if(pl.name){
              const en = pl.name.en || "";
              const hi = pl.name.hi || "";
              if(en) locByName.set(normName(en), pl);
              if(hi) locByName.set(normName(hi), pl);
            }
          }
        });
      });
    }catch(e){
      console.warn("locations.json not loaded", e);
    }
  }

  function hasCoords(x){ return x && typeof x.lat==="number" && isFinite(x.lat) && typeof x.lng==="number" && isFinite(x.lng); }

  function enrichItinerary(it){
    let changed=false;
    const out = (it||[]).map(s=>{
      if(!s || !s.name) return s;
      if(hasCoords(s)) return s;
      const meta = s.meta || {};
      let pl=null;
      if(meta.placeId && locByPlaceId.has(meta.placeId)) pl = locByPlaceId.get(meta.placeId);
      else {
        const n = normName(s.name);
        if(locByName.has(n)) pl = locByName.get(n);
      }
      if(pl && typeof pl.lat==="number" && typeof pl.lng==="number"){
        changed=true;
        return Object.assign({}, s, {lat:pl.lat, lng:pl.lng});
      }
      return s;
    });
    return {out, changed};
  }

  const searchInput = document.getElementById("tmSearch");
  const resultsMount = document.getElementById("tmResults");
  const itineraryMount = document.getElementById("tmItinerary");
  const notesEl = document.getElementById("tmNotes");
  const btnClear = document.getElementById("tmClear");
  const btnDownload = document.getElementById("tmDownload");
  const btnWA = document.getElementById("tmWhatsApp");
  const savedBadge = document.getElementById("tmSavedBadge");

  if(!searchInput || !resultsMount || !itineraryMount) return;

  function getLang(){ return (window.PP_LANG && window.PP_LANG.getLang) ? window.PP_LANG.getLang() : "en"; }
  function t(obj){ const L=getLang(); return obj ? (obj[L] || obj.en || "") : ""; }

  const state = { itinerary: [], notes: "" };

  function nowStamp(){
    const d = new Date();
    return d.toLocaleString();
  }

  function save(){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        itinerary: state.itinerary,
        notes: state.notes,
        updatedAt: Date.now()
      }));
      if(savedBadge){
        savedBadge.textContent = (getLang()==="hi" ? "✅ ऑटो-सेव: " : "✅ Auto-saved: ") + nowStamp();
      }
    }catch(e){}
  }

  function load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return;
      const obj = JSON.parse(raw);
      const base = Array.isArray(obj.itinerary) ? obj.itinerary : [];
      const enriched = enrichItinerary(base);
      state.itinerary = enriched.out;
      if(enriched.changed){
        obj.itinerary = enriched.out;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
      }
      state.notes = obj.notes || "";
      if(notesEl) notesEl.value = state.notes;
      if(savedBadge && obj.updatedAt){
        savedBadge.textContent = (getLang()==="hi" ? "✅ ऑटो-सेव: " : "✅ Auto-saved: ") + new Date(obj.updatedAt).toLocaleString();
      }
    }catch(e){}
  }

  function uniqId(){ return Math.random().toString(16).slice(2) + Date.now().toString(16); }

  function mapsLink(place){
    if(place.lat && place.lon){
      return "https://www.google.com/maps?q=" + encodeURIComponent(place.lat + "," + place.lon);
    }
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(place.name);
  }

  function renderItinerary(){
    itineraryMount.innerHTML = "";
    if(!state.itinerary.length){
      const div=document.createElement("div");
      div.className="tm-empty";
      div.textContent = (getLang()==="hi") ? "अभी कोई जगह नहीं जोड़ी गई है।" : "No places added yet.";
      itineraryMount.appendChild(div);
      return;
    }

    state.itinerary.forEach((p, idx)=>{
      const item=document.createElement("div");
      item.className="tm-item";

      const left=document.createElement("div");
      left.className="tm-left";
      const title=document.createElement("div");
      title.className="tm-title";
      title.textContent = (idx+1)+". "+p.name;
      const sub=document.createElement("div");
      sub.className="tm-sub";
      sub.textContent = (p.subtitle || "") + (p.lat && p.lon ? (" • " + p.lat + ", " + p.lon) : "");
      left.appendChild(title);
      left.appendChild(sub);

      const actions=document.createElement("div");
      actions.className="tm-actions";

      const up=document.createElement("button");
      up.className="tm-mini";
      up.type="button";
      up.textContent="↑";
      up.title="Move up";
      up.disabled = idx===0;
      up.addEventListener("click", ()=>{
        if(idx===0) return;
        const tmp=state.itinerary[idx-1];
        state.itinerary[idx-1]=state.itinerary[idx];
        state.itinerary[idx]=tmp;
        save(); renderItinerary();
      });

      const down=document.createElement("button");
      down.className="tm-mini";
      down.type="button";
      down.textContent="↓";
      down.title="Move down";
      down.disabled = idx===state.itinerary.length-1;
      down.addEventListener("click", ()=>{
        if(idx===state.itinerary.length-1) return;
        const tmp=state.itinerary[idx+1];
        state.itinerary[idx+1]=state.itinerary[idx];
        state.itinerary[idx]=tmp;
        save(); renderItinerary();
      });

      const open=document.createElement("a");
      open.className="tm-mini";
      open.textContent = (getLang()==="hi") ? "मैप" : "Map";
      open.href = mapsLink(p);
      open.target="_blank"; open.rel="noopener";

      const del=document.createElement("button");
      del.className="tm-mini";
      del.type="button";
      del.textContent = (getLang()==="hi") ? "हटाएँ" : "Remove";
      del.addEventListener("click", ()=>{
        state.itinerary = state.itinerary.filter(x=>x.id!==p.id);
        save(); renderItinerary();
      });

      actions.appendChild(up);
      actions.appendChild(down);
      actions.appendChild(open);
      actions.appendChild(del);

      item.appendChild(left);
      item.appendChild(actions);
      itineraryMount.appendChild(item);
    });
  }

  function addPlace(p){
    // avoid duplicates by name+coords
    const key = (p.name||"").toLowerCase()+"|"+(p.lat||"")+"|"+(p.lon||"");
    const exists = state.itinerary.some(x=>((x.name||"").toLowerCase()+"|"+(x.lat||"")+"|"+(x.lon||""))===key);
    if(exists) return;
    state.itinerary.push({ id: uniqId(), ...p });
    save(); renderItinerary();
  }

  function renderResults(list){
    resultsMount.innerHTML = "";
    if(!list.length) return;

    list.slice(0,10).forEach(p=>{
      const item=document.createElement("div");
      item.className="tm-item";

      const left=document.createElement("div");
      left.className="tm-left";
      const title=document.createElement("div");
      title.className="tm-title";
      title.textContent = p.name;
      const sub=document.createElement("div");
      sub.className="tm-sub";
      sub.textContent = (p.subtitle||"") + (p.lat&&p.lon ? (" • " + p.lat + ", " + p.lon) : "");
      left.appendChild(title); left.appendChild(sub);

      const actions=document.createElement("div");
      actions.className="tm-actions";

      const btn=document.createElement("button");
      btn.className="tm-mini";
      btn.type="button";
      btn.textContent = (getLang()==="hi") ? "जोड़ें" : "Add";
      btn.addEventListener("click", ()=> addPlace(p));

      const open=document.createElement("a");
      open.className="tm-mini";
      open.textContent = (getLang()==="hi") ? "मैप" : "Map";
      open.href = mapsLink(p);
      open.target="_blank"; open.rel="noopener";

      actions.appendChild(btn);
      actions.appendChild(open);

      item.appendChild(left);
      item.appendChild(actions);
      resultsMount.appendChild(item);
    });
  }

  async function searchPlaces(q){
    // OpenStreetMap Nominatim search (client-side)
    // Note: Public service has usage policy; for heavy traffic use your own proxy.
    const url = "https://nominatim.openstreetmap.org/search?format=json&limit=10&addressdetails=1&q=" + encodeURIComponent(q);
    const r = await fetch(url, {
      headers: { "Accept-Language": getLang()==="hi" ? "hi,en" : "en" }
    });
    const arr = await r.json();
    return arr.map(x=>{
      const name = x.display_name ? x.display_name.split(",").slice(0,2).join(",").trim() : q;
      const subtitle = x.display_name || "";
      return { name, subtitle, lat: x.lat, lon: x.lon, source: "nominatim" };
    });
  }

  let timer=null;
  searchInput.addEventListener("input", ()=>{
    clearTimeout(timer);
    const q = searchInput.value.trim();
    if(!q){ resultsMount.innerHTML=""; return; }
    timer=setTimeout(async ()=>{
      try{
        const list = await searchPlaces(q);
        renderResults(list);
      }catch(e){
        resultsMount.innerHTML = "";
        const err=document.createElement("div");
        err.className="tm-empty";
        err.textContent = (getLang()==="hi") ? "सर्च असफल। इंटरनेट/ब्लॉक हो सकता है।" : "Search failed. Internet or blocked.";
        resultsMount.appendChild(err);
      }
    }, 350);
  });

  if(notesEl){
    notesEl.addEventListener("input", ()=>{
      state.notes = notesEl.value;
      save();
    });
  }

  if(btnClear){
    btnClear.addEventListener("click", ()=>{
      if(!confirm(getLang()==="hi" ? "पूरी सूची हटाएँ?" : "Clear the whole itinerary?")) return;
      state.itinerary=[];
      state.notes = "";
      if(notesEl) notesEl.value="";
      save();
      renderItinerary();
      resultsMount.innerHTML="";
      searchInput.value="";
    });
  }

  function buildMessage(){
    const lines=[];
    lines.push(getLang()==="hi" ? "🛕 यात्रा योजना" : "🛕 Tour Plan");
    lines.push("—");
    state.itinerary.forEach((p, i)=>{
      lines.push((i+1)+") "+p.name);
      lines.push("   "+mapsLink(p));
    });
    if(state.notes && state.notes.trim()){
      lines.push("—");
      lines.push(getLang()==="hi" ? "📝 नोट्स:" : "📝 Notes:");
      lines.push(state.notes.trim());
    }
    return lines.join("\n");
  }

  if(btnWA){
    btnWA.addEventListener("click", ()=>{
      const digits = (window.PP_CONFIG && window.PP_CONFIG.contact && window.PP_CONFIG.contact.phoneE164)
        ? window.PP_CONFIG.contact.phoneE164.replace(/\D/g,"")
        : "";
      const msg = buildMessage();
      const url = digits ? ("https://wa.me/"+digits+"?text="+encodeURIComponent(msg)) : ("https://wa.me/?text="+encodeURIComponent(msg));
      window.open(url, "_blank", "noopener");
    });
  }

  if(btnDownload){
    btnDownload.addEventListener("click", ()=>{
      const payload = {
        title: "Tour Plan",
        lang: getLang(),
        notes: state.notes,
        itinerary: state.itinerary.map(p=>({
          name:p.name, subtitle:p.subtitle, lat:p.lat, lon:p.lon, maps: mapsLink(p)
        })),
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {type:"application/json"});
      const a=document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "tour-plan.json";
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 0);
    });
  }

  // Initialize
  load();
  renderItinerary();

  // language change: rerender labels and badge
  window.addEventListener("pp:langchange", ()=>{
    // Keep state; just rerender UI
    renderItinerary();
    if(savedBadge){
      savedBadge.textContent = (getLang()==="hi" ? "✅ ऑटो-सेव: " : "✅ Auto-saved: ") + nowStamp();
    }
  });
})();