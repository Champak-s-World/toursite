(function(){
  "use strict";

  const q = document.getElementById("q");
  const hint = document.getElementById("hint");
  const sel = document.getElementById("selected");
  const btnLocate = document.getElementById("btnLocate");

  const TM_KEY = "pp_tour_maker_v1";

  const state = { data:null, cityIndex:new Map(), placeIndex:new Map(), markers:[], map:null, userMarker:null };

  function getLang(){ return (window.PP_LANG && window.PP_LANG.getLang) ? window.PP_LANG.getLang() : "en"; }
  function t(obj){ const L=getLang(); return obj ? (obj[L]||obj.en||"") : ""; }

  function km(a,b){
    const R=6371;
    const dLat=(b.lat-a.lat)*Math.PI/180, dLng=(b.lng-a.lng)*Math.PI/180;
    const s1=Math.sin(dLat/2), s2=Math.sin(dLng/2);
    const aa=s1*s1 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*s2*s2;
    return 2*R*Math.asin(Math.min(1, Math.sqrt(aa)));
  }

  function loadTourMaker(){
    try{ return JSON.parse(localStorage.getItem(TM_KEY) || '{"itinerary":[],"notes":""}'); }
    catch(e){ return {itinerary:[], notes:""}; }
  }
  function saveTourMaker(obj){ localStorage.setItem(TM_KEY, JSON.stringify(obj)); }

  function addToTourMaker(name, lat, lng, meta){
    const obj = loadTourMaker();
    const key = (name||"").toLowerCase()+"||";
    const exists = (obj.itinerary||[]).some(x => ((x.name||"").toLowerCase()+"||")===key);
    if(!exists){
      obj.itinerary.push({ id:(Math.random().toString(16).slice(2)+Date.now().toString(16)), name, lat, lng, meta: meta||{} });
      saveTourMaker(obj);
    }
  }

  function waUrl(text){
    const digits = (window.PP_CONFIG && window.PP_CONFIG.contact && window.PP_CONFIG.contact.phoneE164)
      ? window.PP_CONFIG.contact.phoneE164.replace(/\D/g,"")
      : "";
    return digits ? ("https://wa.me/"+digits+"?text="+encodeURIComponent(text)) : ("https://wa.me/?text="+encodeURIComponent(text));
  }

  function buildSelected(place, city){
    const title = t(place.name);
    const desc = t(place.desc);
    const imgs = place.images || [];
    const vids = place.videos || [];

    const chips = (place.category ? [place.category] : []).concat(city.tags||[]).slice(0,6);
    const chipHtml = chips.map(c=>`<span class="pp-chip pp-chipbtn" data-chip="${c}">${c}</span>`).join(" ");

    const carousel = imgs.length ? `
      <div style="margin-top:10px; display:grid; gap:8px">
        <div style="display:flex; gap:10px; align-items:center; justify-content:space-between">
          <div class="pp-muted pp-small">Photos (dummy)</div>
          <div style="display:flex; gap:8px">
            <button class="pp-btn pp-btn-outline" id="prevImg" type="button">‹</button>
            <button class="pp-btn pp-btn-outline" id="nextImg" type="button">›</button>
          </div>
        </div>
        <img id="imgView" class="pp-thumb" style="width:100%; height:180px" src="${imgs[0]}" alt="${title} photo" />
      </div>` : "";

    const video = vids.length ? `
      <div style="margin-top:10px">
        <div class="pp-muted pp-small">Video (dummy)</div>
        <div style="margin-top:6px; border-radius:14px; overflow:hidden; border:1px solid var(--border)">
          <iframe width="100%" height="190" src="https://www.youtube-nocookie.com/embed/${vids[0].id}" title="${vids[0].title||'Video'}"
            frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
      </div>` : "";

    sel.innerHTML = `
      <div class="pp-loc-card">
        <img class="pp-thumb" src="${(imgs[0]||city.heroImage)}" alt="${title}" />
        <div>
          <div class="pp-loc-title">${title}</div>
          <div class="pp-muted pp-small">${t(city.name)} • ${place.category||""}</div>
          <div class="pp-small" style="margin-top:6px; line-height:1.6">${desc||""}</div>
          <div class="pp-chiprow" style="margin-top:8px">${chipHtml}</div>
          <div class="pp-actions" style="margin-top:10px">
            <button class="pp-btn" id="addTM" type="button">${getLang()==="hi"?"टूर मेकर में जोड़ें":"Add to Tour Maker"}</button>
            <a class="pp-btn pp-btn-outline" id="waShare" target="_blank" rel="noopener">${getLang()==="hi"?"WhatsApp पर भेजें":"Send on WhatsApp"}</a>
            <button class="pp-btn pp-btn-outline" id="center" type="button">${getLang()==="hi"?"मैप पर दिखाएँ":"Show on Map"}</button>
          </div>
        </div>
      </div>
      ${carousel}
      ${video}
    `;

    sel.querySelectorAll("[data-chip]").forEach(el=>{
      el.addEventListener("click", ()=>{
        q.value = el.getAttribute("data-chip") || "";
        runSearch();
      });
    });

    sel.querySelector("#addTM").addEventListener("click", ()=>{
      addToTourMaker(title, place.lat, place.lng, {cityId: city.id, placeId: place.id, category: place.category});
      alert(getLang()==="hi" ? "टूर मेकर में जोड़ा गया!" : "Added to Tour Maker!");
    });

    const waText = `${getLang()==="hi"?"मेरा टूर सुझाव":"My tour suggestion"}: ${title} (${t(city.name)})\nhttps://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=16/${place.lat}/${place.lng}`;
    sel.querySelector("#waShare").href = waUrl(waText);

    sel.querySelector("#center").addEventListener("click", ()=>{
      state.map.setView([place.lat, place.lng], 14, {animate:true});
    });

    if(imgs.length){
      let idx=0;
      const imgView = sel.querySelector("#imgView");
      const prev = sel.querySelector("#prevImg");
      const next = sel.querySelector("#nextImg");
      const set=()=>{ imgView.src = imgs[idx % imgs.length]; };
      prev.addEventListener("click", ()=>{ idx = (idx-1+imgs.length)%imgs.length; set(); });
      next.addEventListener("click", ()=>{ idx = (idx+1)%imgs.length; set(); });
    }
  }

  function addMarkers(){
    state.markers.forEach(m=> m.remove());
    state.markers = [];
    state.placeIndex.clear();

    state.data.cities.forEach(city=>{
      const cityMarker = L.circleMarker([city.lat, city.lng], { radius: 9, weight:2, color: "rgba(245,158,11,.9)", fillColor:"rgba(245,158,11,.55)", fillOpacity: .9 }).addTo(state.map);
      cityMarker.bindPopup(`<b>${t(city.name)}</b><br/>${(city.places||[]).length} places`);
      state.markers.push(cityMarker);

      (city.places||[]).forEach(place=>{
        const m = L.marker([place.lat, place.lng]).addTo(state.map);
        m.bindPopup(`<b>${t(place.name)}</b><br/><span style="opacity:.8">${place.category||""}</span>`);
        m.on("click", ()=> buildSelected(place, city));
        state.markers.push(m);
        state.placeIndex.set(place.id, {place, city});
      });
    });
  }

  function runSearch(){
    const term = (q.value||"").trim().toLowerCase();
    if(!term){ hint.textContent = "Tip: search 'ghat', 'temple', 'ram', 'kashi', 'sangam'…"; return; }
    const hits=[];
    state.data.cities.forEach(city=>{
      const cityHit = t(city.name).toLowerCase().includes(term) || (city.tags||[]).some(x=>String(x).toLowerCase().includes(term));
      (city.places||[]).forEach(place=>{
        const inPlace = t(place.name).toLowerCase().includes(term)
          || (place.category||"").toLowerCase().includes(term)
          || (city.tags||[]).some(x=>String(x).toLowerCase().includes(term));
        if(cityHit || inPlace) hits.push({place, city});
      });
    });
    hint.textContent = hits.length ? `${hits.length} result(s). Click a marker or pick one from the list below.` : "No results. Try another keyword.";
    if(hits[0]){
      buildSelected(hits[0].place, hits[0].city);
      state.map.setView([hits[0].place.lat, hits[0].place.lng], 13, {animate:true});
    }
  }

  async function locate(){
    if(!navigator.geolocation){ alert("Geolocation not supported."); return; }
    btnLocate.disabled = true;
    btnLocate.textContent = (getLang()==="hi" ? "लोकेट हो रहा है…" : "Locating…");

    navigator.geolocation.getCurrentPosition((pos)=>{
      btnLocate.disabled = false;
      btnLocate.textContent = (getLang()==="hi" ? "वर्तमान लोकेशन" : "Use Current Location");

      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      const here = {lat, lng};

      if(state.userMarker) state.userMarker.remove();
      state.userMarker = L.circleMarker([lat,lng], { radius: 8, weight:2, color:"rgba(34,197,94,.95)", fillColor:"rgba(34,197,94,.55)", fillOpacity:.9 }).addTo(state.map);
      state.userMarker.bindPopup(getLang()==="hi" ? "आप यहाँ हैं" : "You are here").openPopup();

      let best=null, bestD=1e9;
      state.data.cities.forEach(city=>{
        const d = km(here, {lat:city.lat, lng:city.lng});
        if(d<bestD){ bestD=d; best=city; }
      });

      const close=[];
      state.data.cities.forEach(city=>{
        (city.places||[]).forEach(place=>{
          const d=km(here, {lat:place.lat, lng:place.lng});
          if(d<=50) close.push({place, city, d});
        });
      });
      close.sort((a,b)=>a.d-b.d);

      state.map.setView([lat,lng], bestD<250 ? 8 : 5, {animate:true});

      if(best){
        hint.textContent = `${getLang()==="hi"?"सबसे नज़दीकी शहर":"Nearest city"}: ${t(best.name)} (${bestD.toFixed(1)} km). ${getLang()==="hi"?"पास के स्थान":"Nearby places"}: ${Math.min(close.length,5)}.`;
      }

      if(close[0]) buildSelected(close[0].place, close[0].city);

    }, (err)=>{
      btnLocate.disabled = false;
      btnLocate.textContent = (getLang()==="hi" ? "वर्तमान लोकेशन" : "Use Current Location");
      alert(err.message || "Location permission denied.");
    }, {enableHighAccuracy:true, timeout:12000});
  }

  function quickAddCity(cityId){
    const city = state.data.cities.find(c=>c.id===cityId);
    if(!city) return;
    (city.places||[]).forEach(pl=> addToTourMaker(t(pl.name), pl.lat, pl.lng, {cityId: city.id, placeId: pl.id, category: pl.category}));
    alert(getLang()==="hi" ? "टूर मेकर में जोड़ दिया!" : "Added city places to Tour Maker!");
  }

  async function init(){
    const res = await fetch("data/master/locations.json", {cache:"no-store"});
    state.data = await res.json();

    state.data.cities.forEach(c=> state.cityIndex.set(c.id, c));

    state.map = L.map("ppMap", {scrollWheelZoom:true}).setView([25.6, 82.6], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(state.map);

    addMarkers();

    hint.textContent = "Tip: search 'ghat', 'temple', 'ram', 'kashi', 'sangam'…";
    q.addEventListener("input", runSearch);

    btnLocate.addEventListener("click", locate);

    document.querySelectorAll("[data-city]").forEach(b=>{
      b.addEventListener("click", ()=> quickAddCity(b.getAttribute("data-city")));
    });

    const first = state.data.cities?.[0]?.places?.[0];
    if(first) buildSelected(first, state.data.cities[0]);

    window.addEventListener("pp:langchange", ()=>{
      runSearch();
    });
  }

  init().catch(err=>{
    console.error(err);
    if(sel) sel.textContent = "Failed to load locations.json. Please check data/master/locations.json";
  });
})();