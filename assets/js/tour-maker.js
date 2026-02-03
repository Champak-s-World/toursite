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
      LOC = { cities: [] };
    }
  }

  const GEO_CACHE_KEY = "pp_geo_cache_v1";
  function loadGeoCache(){
    try{ return JSON.parse(localStorage.getItem(GEO_CACHE_KEY) || "{}"); }catch(e){ return {}; }
  }
  function saveGeoCache(obj){
    try{ localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(obj)); }catch(e){}
  }
  function hasCoords(x){ const la=Number(x&&x.lat), ln=Number(x&&x.lng); return isFinite(la) && isFinite(ln); }

  function load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return (window.ppTMState = { itinerary: [], notes: "" });
      return (window.ppTMState = JSON.parse(raw));
    }catch(e){
      return (window.ppTMState = { itinerary: [], notes: "" });
    }
  }
  function save(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(window.ppTMState)); }catch(e){}
  }

  // ---------- Itinerary enrich using master locations ----------
  function enrichItinerary(itinerary){
    const out = itinerary.map((s)=>{
      if(!s || !s.name) return s;
      const hit = locByName.get(normName(s.name));
      if(hit && !hasCoords(s) && hasCoords(hit)){
        s.lat = Number(hit.lat);
        s.lng = Number(hit.lng);
        s.meta = s.meta || {};
        s.meta.coordSource = "master";
        s.placeId = s.placeId || hit.id;
      }
      // Backward compat: if old stop stored lon, set lng
      if(s && s.lat && (s.lng==null) && (s.lon!=null)){
        const ln = Number(s.lon);
        if(isFinite(ln)) s.lng = ln;
      }
      return s;
    });
    return out;
  }

  // ---------- Geocode fallback (only used in hybrid mode or ensureCoords) ----------
  async function geocodeStop(s){
    if(!s || !s.name) return { ok:false, stop:s, changed:false };

    // Master first
    const hit = locByName.get(normName(s.name));
    if(hit && hasCoords(hit) && !hasCoords(s)){
      s.lat = Number(hit.lat);
      s.lng = Number(hit.lng);
      s.meta = s.meta || {};
      s.meta.coordSource = "master";
      return { ok:true, stop:s, changed:true };
    }

    // Cache
    const cache = loadGeoCache();
    const key = normName(s.name);
    if(cache[key] && isFinite(cache[key].lat) && isFinite(cache[key].lng)){
      s.lat = cache[key].lat;
      s.lng = cache[key].lng;
      s.meta = s.meta || {};
      s.meta.coordSource = s.meta.coordSource || "cache";
      return { ok:true, stop:s, changed:true };
    }

    // OSM (1 result)
    const q = encodeURIComponent(s.name + (s.meta && s.meta.cityId ? (" " + s.meta.cityId) : ""));
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`;

    try{
      const res = await fetch(url, { headers: { "Accept": "application/json" }, cache: "no-store" });
      if(!res.ok) return { ok:false, stop:s, changed:false };
      const arr = await res.json();
      if(!arr || !arr.length) return { ok:false, stop:s, changed:false };

      const lat = Number(arr[0].lat);
      const lng = Number(arr[0].lon);
      if(!isFinite(lat) || !isFinite(lng)) return { ok:false, stop:s, changed:false };

      s.lat = lat;
      s.lng = lng;
      s.meta = s.meta || {};
      s.meta.coordSource = "osm";

      cache[key] = { lat, lng, ts: Date.now() };
      saveGeoCache(cache);

      return { ok:true, stop:s, changed:true };
    }catch(e){
      return { ok:false, stop:s, changed:false };
    }
  }

  async function ensureCoordsSaved_TM(){
    const obj = load();
    const raw = (obj.itinerary||[]).filter(s=>s && s.name);

    // 1) master enrich
    const stops = enrichItinerary(raw);

    // 2) geocode missing
    let changed = false;
    for(const s of stops){
      if(!hasCoords(s)){
        const r = await geocodeStop(s);
        if(r.changed) changed = true;
      }
    }

    if(changed){
      obj.itinerary = stops;
      save();
    }
  }

  // ---------- UI refs ----------
  const searchInput = document.getElementById("tmSearch");
  const resultsMount = document.getElementById("tmResults");

  const btnModeStrict = document.getElementById("tmModeStrict");
  const btnModeHybrid = document.getElementById("tmModeHybrid");
  const modeHint = document.getElementById("tmModeHint");

  // Search mode: strict vs hybrid
  let searchMode = "strict";
  try{
    const savedMode = localStorage.getItem("pp_search_mode_v1");
    if(savedMode === "hybrid" || savedMode === "strict") searchMode = savedMode;
  }catch(e){}

  function applyModeUI(){
    if(btnModeStrict){
      btnModeStrict.setAttribute("aria-pressed", searchMode==="strict" ? "true":"false");
      btnModeStrict.classList.toggle("is-active", searchMode==="strict");
    }
    if(btnModeHybrid){
      btnModeHybrid.setAttribute("aria-pressed", searchMode==="hybrid" ? "true":"false");
      btnModeHybrid.classList.toggle("is-active", searchMode==="hybrid");
    }
    if(modeHint){
      modeHint.textContent = (searchMode==="strict")
        ? "Verified mode searches only your curated master data (fast, accurate, always has lat/lng)."
        : "Everywhere mode searches your master data first, then falls back to OpenStreetMap (may be slower / sometimes blocked).";
    }
  }

  if(btnModeStrict){
    btnModeStrict.addEventListener("click", ()=>{
      searchMode="strict";
      try{ localStorage.setItem("pp_search_mode_v1", searchMode); }catch(e){}
      applyModeUI();
      searchInput && searchInput.dispatchEvent(new Event("input"));
    });
  }
  if(btnModeHybrid){
    btnModeHybrid.addEventListener("click", ()=>{
      searchMode="hybrid";
      try{ localStorage.setItem("pp_search_mode_v1", searchMode); }catch(e){}
      applyModeUI();
      searchInput && searchInput.dispatchEvent(new Event("input"));
    });
  }
  applyModeUI();

  // ---------- Helpers ----------
  function uniqId(){ return Math.random().toString(36).slice(2,10); }

  const state = load();
  const itineraryMount = document.getElementById("tmItinerary");
  const notesEl = document.getElementById("tmNotes");
  const btnSave = document.getElementById("tmBtnSave");
  const btnClear = document.getElementById("tmBtnClear");
  const btnDownload = document.getElementById("tmBtnDownload");
  const btnWhatsApp = document.getElementById("tmBtnWhatsApp");

  function getLang(){
    return (window.PP_LANG && typeof window.PP_LANG.getLang==="function")
      ? window.PP_LANG.getLang()
      : "en";
  }

  function mapsLink(place){
    const lng = (place && (place.lng ?? place.lon));
    if(place && place.lat && lng){
      return "https://www.google.com/maps?q=" + encodeURIComponent(place.lat + "," + lng);
    }
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(place.name || "");
  }

  function addPlace(p){
    // avoid duplicates by name+coords
    const plng = (p && (p.lng ?? p.lon)) || "";
    const key = (p.name||"").toLowerCase()+"|"+(p.lat||"")+"|"+plng;
    const exists = state.itinerary.some(x=>{
      const xlng = (x && (x.lng ?? x.lon)) || "";
      return ((x.name||"").toLowerCase()+"|"+(x.lat||"")+"|"+xlng)===key;
    });
    if(exists) return;

    // normalize into lat/lng
    const lng = (p && (p.lng ?? p.lon));
    state.itinerary.push({ id: uniqId(), ...p, lng: (lng!=null ? Number(lng) : p.lng) });
    save(); renderItinerary();
  }

  function renderItinerary(){
    if(!itineraryMount) return;
    itineraryMount.innerHTML = "";

    const list = state.itinerary || [];
    if(!list.length){
      const e = document.createElement("div");
      e.className = "tm-empty";
      e.textContent = (getLang()==="hi") ? "अभी कोई स्थान नहीं जोड़ा गया।" : "No places added yet.";
      itineraryMount.appendChild(e);
      updateWhatsApp();
      return;
    }

    list.forEach((p, idx)=>{
      const row = document.createElement("div");
      row.className = "tm-stop";

      const left = document.createElement("div");
      left.className = "tm-stop-left";
      left.innerHTML = `<b>${p.name||""}</b><div class="pp-muted" style="margin-top:2px">${p.subtitle||""}</div>`;

      const meta = document.createElement("div");
      meta.className = "tm-stop-meta";
      const lng = (p && (p.lng ?? p.lon));
      meta.textContent = (p.lat && lng) ? `${p.lat}, ${lng}` : "—";

      const rm = document.createElement("button");
      rm.className = "tm-mini";
      rm.type = "button";
      rm.textContent = (getLang()==="hi") ? "हटाएँ" : "Remove";
      rm.addEventListener("click", ()=>{
        state.itinerary.splice(idx, 1);
        save(); renderItinerary();
      });

      row.appendChild(left);
      row.appendChild(meta);
      row.appendChild(rm);
      itineraryMount.appendChild(row);
    });

    if(notesEl && typeof state.notes === "string") notesEl.value = state.notes;

    updateWhatsApp();
  }

  function updateWhatsApp(){
    if(!btnWhatsApp) return;
    const digits = (window.PP_CONFIG && window.PP_CONFIG.contact && window.PP_CONFIG.contact.phoneE164)
      ? String(window.PP_CONFIG.contact.phoneE164).replace(/\D/g,"")
      : "";

    const lines = (state.itinerary||[]).map((x,i)=>`${i+1}. ${x.name}`).join("\n");
    const msg = (getLang()==="hi")
      ? `नमस्ते, मुझे यह टूर बनाना है:\n${lines}\n\nनोट्स: ${state.notes||""}`
      : `Hello, I want to arrange this tour:\n${lines}\n\nNotes: ${state.notes||""}`;

    btnWhatsApp.href = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  }

  // ---------- Results UI ----------
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
      const lng = (p && (p.lng ?? p.lon));
      sub.textContent = (p.subtitle||"") + (p.lat&&lng ? (" • " + p.lat + ", " + lng) : "");
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

  // ✅ STRICT: locations.json only
  function searchStrictPlaces(q){
    const term = normName(q);
    const hits = [];

    if(!LOC || !Array.isArray(LOC.cities)) return hits;

    LOC.cities.forEach(city=>{
      const cityNameEn = (city.name && city.name.en) ? city.name.en : city.id;
      const cityNameHi = (city.name && city.name.hi) ? city.name.hi : "";
      const cityTags = Array.isArray(city.tags) ? city.tags : [];
      const cityHit = normName(cityNameEn).includes(term) || (cityNameHi && normName(cityNameHi).includes(term))
        || cityTags.some(t=>normName(t).includes(term));

      if(cityHit){
        hits.push({
          name: cityNameEn,
          subtitle: (cityNameHi ? (cityNameHi + " • ") : "") + "City (verified)",
          lat: city.lat,
          lng: city.lng,
          lon: city.lng,
          source: "locations",
          cityId: city.id,
          kind: "city"
        });
      }

      (city.places||[]).forEach(pl=>{
        const en = pl.name && pl.name.en ? pl.name.en : pl.id;
        const hi = pl.name && pl.name.hi ? pl.name.hi : "";
        const tags = Array.isArray(pl.tags) ? pl.tags : [];
        const cat = pl.category || "";
        const match = normName(en).includes(term) || (hi && normName(hi).includes(term))
          || tags.some(t=>normName(t).includes(term))
          || (cat && normName(cat).includes(term));

        if(match){
          hits.push({
            name: en,
            subtitle: (hi ? hi + " • " : "") + cityNameEn + (cat ? (" • " + cat) : "") + " • verified",
            lat: pl.lat,
            lng: pl.lng,
            lon: pl.lng,
            source: "locations",
            cityId: city.id,
            placeId: pl.id,
            kind: "place"
          });
        }
      });
    });

    function score(x){
      const n = normName(x.name);
      let s = 0;
      if(n.startsWith(term)) s += 50;
      if(n.includes(term)) s += 20;
      if(x.kind === "place") s += 10;
      if(isFinite(Number(x.lat)) && isFinite(Number(x.lng))) s += 5;
      return s;
    }
    hits.sort((a,b)=>score(b)-score(a));
    return hits.slice(0, 20);
  }

  // ✅ HYBRID: strict → OSM fallback
  async function searchPlaces(q){
    const url = "https://nominatim.openstreetmap.org/search?format=json&limit=10&addressdetails=1&q=" + encodeURIComponent(q);
    const r = await fetch(url, { headers: { "Accept-Language": getLang()==="hi" ? "hi,en" : "en" } });
    const arr = await r.json();
    return arr.map(x=>{
      const name = x.display_name ? x.display_name.split(",").slice(0,2).join(",").trim() : q;
      const subtitle = x.display_name || "";
      return { name, subtitle, lat: Number(x.lat), lng: Number(x.lon), lon: Number(x.lon), source: "nominatim" };
    });
  }

  async function searchHybridPlaces(q){
    const strict = searchStrictPlaces(q);
    if(strict.length) return strict;
    return await searchPlaces(q);
  }

  // ---------- search input handler ----------
  let timer=null;
  if(searchInput){
    searchInput.addEventListener("input", ()=>{
      clearTimeout(timer);
      const q = searchInput.value.trim();
      if(!q){ resultsMount.innerHTML=""; return; }
      timer=setTimeout(async ()=>{
        try{
          const list = (searchMode === "strict") ? searchStrictPlaces(q) : await searchHybridPlaces(q);

          if(!list || !list.length){
            resultsMount.innerHTML = "";
            const empty=document.createElement("div");
            empty.className="tm-empty";
            empty.textContent = (searchMode==="strict")
              ? ((getLang()==="hi") ? "Verified खोज में कोई परिणाम नहीं मिला। locations.json में जोड़ें या Everywhere मोड चुनें।"
                                   : "No verified results. Add it to locations.json or switch to Everywhere mode.")
              : ((getLang()==="hi") ? "कोई परिणाम नहीं मिला।" : "No results found.");
            resultsMount.appendChild(empty);
            return;
          }

          renderResults(list);
        }catch(e){
          resultsMount.innerHTML = "";
          const err=document.createElement("div");
          err.className="tm-empty";
          err.textContent = (getLang()==="hi")
            ? "सर्च असफल। इंटरनेट/ब्लॉक हो सकता है।"
            : "Search failed. Internet or blocked.";
          resultsMount.appendChild(err);
        }
      }, 350);
    });
  }

  if(notesEl){
    notesEl.addEventListener("input", ()=>{
      state.notes = notesEl.value || "";
      save();
      updateWhatsApp();
    });
  }

  if(btnSave){
    btnSave.addEventListener("click", ()=>{
      save();
      ensureCoordsSaved_TM().then(()=>renderItinerary()).catch(()=>{});
    });
  }

  if(btnClear){
    btnClear.addEventListener("click", ()=>{
      if(!confirm((getLang()==="hi") ? "सब साफ़ करें?" : "Clear everything?")) return;
      state.itinerary = [];
      state.notes = "";
      save();
      renderItinerary();
      resultsMount.innerHTML="";
      if(searchInput) searchInput.value="";
    });
  }

  if(btnDownload){
    btnDownload.addEventListener("click", ()=>{
      const payload = { itinerary: state.itinerary || [], notes: state.notes || "", ts: Date.now() };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {type:"application/json"});
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "tour-itinerary.json";
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 0);
    });
  }

  // Initialize
  (async function boot(){
    load();
    try{
      if(typeof loadLocations === "function"){ await loadLocations(); }
      if(typeof ensureCoordsSaved_TM === "function"){ await ensureCoordsSaved_TM(); }
    }catch(e){ /* ignore */ }
    renderItinerary();
  })();
})();