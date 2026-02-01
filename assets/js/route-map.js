(function(){
  "use strict";

  const KEY = "pp_tour_maker_v1";

  const elList = document.getElementById("stopList");
  const elSummary = document.getElementById("summary");
  const btnShare = document.getElementById("btnShare");
  const btnClear = document.getElementById("btnClear");
  const btnDownload = document.getElementById("btnDownload");
  const btnAutoSort = document.getElementById("btnAutoSort");
  const btnLocateStart = document.getElementById("btnLocateStart");

  let map, line, markers = [], startMarker = null;
  let startPoint = null; // {lat,lng} optional

  let LOC = null;
  const locByPlaceId = new Map();
  const locByName = new Map(); // lowercased

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
      // optional file; route still works if coords already present
      console.warn("locations.json not loaded", e);
    }
  }

  function enrichStopsWithLocations(stops){
    let changed = false;
    const out = stops.map(s=>{
      if(!s) return s;
      const has = hasCoords(s);
      if(has) return s;

      const meta = s.meta || {};
      let pl = null;

      if(meta.placeId && locByPlaceId.has(meta.placeId)){
        pl = locByPlaceId.get(meta.placeId);
      } else {
        const n = normName(s.name);
        if(locByName.has(n)) pl = locByName.get(n);
      }

      if(pl && typeof pl.lat==="number" && typeof pl.lng==="number"){
        changed = true;
        return Object.assign({}, s, {lat: pl.lat, lng: pl.lng});
      }
      return s;
    });
    return {out, changed};
  }

  function getLang(){ return (window.PP_LANG && window.PP_LANG.getLang) ? window.PP_LANG.getLang() : "en"; }
  function waUrl(text){
    const digits = (window.PP_CONFIG && window.PP_CONFIG.contact && window.PP_CONFIG.contact.phoneE164)
      ? window.PP_CONFIG.contact.phoneE164.replace(/\D/g,"")
      : "";
    return digits ? ("https://wa.me/"+digits+"?text="+encodeURIComponent(text)) : ("https://wa.me/?text="+encodeURIComponent(text));
  }

  function load(){
    try{ return JSON.parse(localStorage.getItem(KEY) || '{"itinerary":[],"notes":""}'); }
    catch(e){ return {itinerary:[], notes:""}; }
  }
  function save(obj){ localStorage.setItem(KEY, JSON.stringify(obj)); }

  function havKm(a,b){
    const R=6371;
    const dLat=(b.lat-a.lat)*Math.PI/180, dLng=(b.lng-a.lng)*Math.PI/180;
    const s1=Math.sin(dLat/2), s2=Math.sin(dLng/2);
    const aa=s1*s1 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*s2*s2;
    return 2*R*Math.asin(Math.min(1, Math.sqrt(aa)));
  }

  function isNum(x){ return typeof x==="number" && isFinite(x); }
  function hasCoords(s){ return s && isNum(s.lat) && isNum(s.lng); }

  function getStops(){
    const obj = load();
    const raw = (obj.itinerary||[]).filter(s=>s && s.name);
    const enriched = enrichStopsWithLocations(raw);
    if(enriched.changed){
      obj.itinerary = enriched.out;
      save(obj);
    }
    return enriched.out;
  }

  function setStops(stops){
    const obj = load();
    obj.itinerary = stops;
    save(obj);
  }

  function clearMap(){
    markers.forEach(m=>m.remove());
    markers=[];
    if(line){ line.remove(); line=null; }
  }

  function draw(){
    const stops = getStops();
    clearMap();

    const points = [];
    if(startPoint) points.push(startPoint);

    stops.forEach((s, i)=>{
      if(hasCoords(s)){
        const pt = {lat:s.lat, lng:s.lng};
        points.push(pt);

        const m = L.marker([pt.lat, pt.lng]).addTo(map);
        m.bindPopup(`<b>${i+1}. ${escapeHtml(s.name)}</b>`);
        markers.push(m);
      }
    });

    if(startPoint){
      if(startMarker) startMarker.remove();
      startMarker = L.circleMarker([startPoint.lat, startPoint.lng], {
        radius: 8, weight:2, color:"rgba(34,197,94,.95)", fillColor:"rgba(34,197,94,.55)", fillOpacity:.9
      }).addTo(map);
      startMarker.bindPopup(getLang()==="hi" ? "आप यहाँ हैं (Start)" : "You are here (Start)");
    }

    // polyline: skip start if no coords on stops
    const linePts = [];
    if(startPoint) linePts.push([startPoint.lat, startPoint.lng]);
    stops.forEach(s=>{ if(hasCoords(s)) linePts.push([s.lat,s.lng]); });

    if(linePts.length >= 2){
      line = L.polyline(linePts, {weight:4, opacity:.9}).addTo(map);
      map.fitBounds(line.getBounds().pad(0.2));
    } else if(linePts.length === 1){
      map.setView(linePts[0], 12);
    } else {
      map.setView([25.6, 82.6], 6);
    }

    const total = totalDistanceKm();
    const count = stops.length;
    elSummary.textContent = (getLang()==="hi" ? `स्टॉप्स: ${count} • दूरी: ${fmt(total)} km` : `Stops: ${count} • Distance: ${fmt(total)} km`);

    btnShare.href = waUrl(buildShareText());
  }

  function totalDistanceKm(){
    const stops = getStops().filter(hasCoords);
    let sum = 0;
    let prev = startPoint || null;
    stops.forEach(s=>{
      if(prev) sum += havKm(prev, s);
      prev = s;
    });
    return sum;
  }

  function fmt(n){ return (Math.round(n*10)/10).toFixed(1); }

  function escapeHtml(s){
    return String(s||"").replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
  }

  function move(stops, from, to){
    const a = stops.slice();
    const [it] = a.splice(from,1);
    a.splice(to,0,it);
    return a;
  }

  function renderList(){
    const stops = getStops();
    elList.innerHTML = "";

    if(!stops.length){
      elList.innerHTML = `<div class="pp-muted">${getLang()==="hi" ? "टूर मेकर खाली है। Maps / Tour Maker से स्टॉप जोड़ें।" : "Tour Maker is empty. Add places from Map Tours / Tour Maker."}</div>`;
      draw();
      return;
    }

    stops.forEach((s, idx)=>{
      const wrap = document.createElement("div");
      wrap.className = "pp-stop";

      const name = s.name || "";
      const meta = s.meta || {};
      const city = meta.cityId ? `• ${meta.cityId}` : "";
      const cat = meta.category ? `• ${meta.category}` : "";
      const coords = hasCoords(s) ? `${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}` : "—";

      wrap.innerHTML = `
        <h3><span class="pp-num">${idx+1}</span>${escapeHtml(name)}</h3>
        <div class="pp-muted" style="font-size:13px">${escapeHtml(coords)} <span style="opacity:.85">${escapeHtml(city)} ${escapeHtml(cat)}</span></div>
        <div class="pp-stop-actions">
          <button class="pp-btn pp-btn-outline" data-up>↑</button>
          <button class="pp-btn pp-btn-outline" data-down>↓</button>
          <button class="pp-btn pp-btn-outline" data-center>${getLang()==="hi"?"मैप":"Map"}</button>
          <button class="pp-btn pp-btn-outline" data-remove>${getLang()==="hi"?"हटाएँ":"Remove"}</button>
        </div>
      `;

      wrap.querySelector("[data-up]").addEventListener("click", ()=>{
        if(idx===0) return;
        const next = move(stops, idx, idx-1);
        setStops(next); renderList();
      });
      wrap.querySelector("[data-down]").addEventListener("click", ()=>{
        if(idx===stops.length-1) return;
        const next = move(stops, idx, idx+1);
        setStops(next); renderList();
      });
      wrap.querySelector("[data-remove]").addEventListener("click", ()=>{
        const next = stops.slice(); next.splice(idx,1);
        setStops(next); renderList();
      });
      wrap.querySelector("[data-center]").addEventListener("click", ()=>{
        if(hasCoords(s)) map.setView([s.lat, s.lng], 13, {animate:true});
      });

      elList.appendChild(wrap);
    });

    draw();
  }

  function nearestNeighborOrder(stops, start){
    const rem = stops.slice();
    const out = [];
    let cur = start || (rem[0] && hasCoords(rem[0]) ? {lat:rem[0].lat, lng:rem[0].lng} : null);

    while(rem.length){
      let bestI = 0;
      if(cur){
        let bestD = Infinity;
        for(let i=0;i<rem.length;i++){
          const s = rem[i];
          if(!hasCoords(s)) continue;
          const d = havKm(cur, s);
          if(d < bestD){ bestD=d; bestI=i; }
        }
      }
      const [pick] = rem.splice(bestI,1);
      out.push(pick);
      if(hasCoords(pick)) cur = pick;
    }
    return out;
  }

  function buildShareText(){
    const stops = getStops();
    const total = totalDistanceKm();
    const lines = [];
    lines.push(getLang()==="hi" ? "🧭 मेरा टूर रूट" : "🧭 My Tour Route");
    if(startPoint) lines.push(getLang()==="hi" ? `Start: ${startPoint.lat.toFixed(5)}, ${startPoint.lng.toFixed(5)}` : `Start: ${startPoint.lat.toFixed(5)}, ${startPoint.lng.toFixed(5)}`);
    stops.forEach((s, i)=> lines.push(`${i+1}. ${s.name}${hasCoords(s) ? ` (${s.lat.toFixed(5)},${s.lng.toFixed(5)})` : ""}`));
    lines.push(getLang()==="hi" ? `कुल दूरी: ${fmt(total)} km` : `Total distance: ${fmt(total)} km`);
    lines.push("OpenStreetMap links:");
    stops.filter(hasCoords).slice(0,6).forEach(s=> lines.push(`https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lng}#map=16/${s.lat}/${s.lng}`));
    return lines.join("\n");
  }

  function download(){
    const obj = {
      generatedAt: new Date().toISOString(),
      start: startPoint,
      itinerary: getStops(),
      distanceKm: Math.round(totalDistanceKm()*100)/100
    };
    const blob = new Blob([JSON.stringify(obj, null, 2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tour-route.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function clear(){
    const obj = load();
    obj.itinerary = [];
    save(obj);
    startPoint = null;
    if(startMarker){ startMarker.remove(); startMarker=null; }
    renderList();
  }

  function autoSort(){
    const stops = getStops();
    const sorted = nearestNeighborOrder(stops, startPoint);
    setStops(sorted);
    renderList();
  }

  function locateStart(){
    if(!navigator.geolocation){ alert("Geolocation not supported."); return; }
    btnLocateStart.disabled = true;
    btnLocateStart.textContent = (getLang()==="hi" ? "लोकेट…" : "Locating…");

    navigator.geolocation.getCurrentPosition((pos)=>{
      btnLocateStart.disabled = false;
      btnLocateStart.textContent = (getLang()==="hi" ? "Start from Current Location" : "Start from Current Location");

      startPoint = {lat: pos.coords.latitude, lng: pos.coords.longitude};
      renderList();
      map.setView([startPoint.lat, startPoint.lng], 10, {animate:true});
      if(startMarker) startMarker.openPopup();

    }, (err)=>{
      btnLocateStart.disabled = false;
      btnLocateStart.textContent = (getLang()==="hi" ? "Start from Current Location" : "Start from Current Location");
      alert(err.message || "Location permission denied.");
    }, {enableHighAccuracy:true, timeout:12000});
  }

  function initMap(){
    map = L.map("routeMap", {scrollWheelZoom:true}).setView([25.6, 82.6], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
  }

  async function init(){
    initMap();
    await loadLocations();
    btnClear.addEventListener("click", clear);
    btnDownload.addEventListener("click", download);
    btnAutoSort.addEventListener("click", autoSort);
    btnLocateStart.addEventListener("click", locateStart);

    renderList();
    window.addEventListener("storage", (e)=>{
      if(e.key === KEY) renderList();
    });
    window.addEventListener("pp:langchange", ()=> renderList());
  }

  init();
})();