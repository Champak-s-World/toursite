/* route-map.js — FIXED
   - Reads itinerary from:
       1) localStorage["pp_tour_maker_v1"]
       2) localStorage["pp_route_data_v1"] (fallback / mirror)
   - Draws polyline + markers on Leaflet map
   - Shows stop list + total distance
*/

(function () {
  "use strict";

  const KEY = "pp_tour_maker_v1";
  const ROUTE_KEY = "pp_route_data_v1";
  const LOC_URL = "data/master/locations.json";

  // ----- DOM refs -----
  const elMap = document.getElementById("rmMap");
  const elList = document.getElementById("stopList");
  const elSummary = document.getElementById("summary");
  const btnShare = document.getElementById("btnShare");
  const btnClear = document.getElementById("btnClear");
  const btnDownload = document.getElementById("btnDownload");
  const btnAutoSort = document.getElementById("btnAutoSort");
  const btnLocateStart = document.getElementById("btnLocateStart");

  if (!elMap) {
    console.error("[route-map] Map container #rmMap not found.");
    return;
  }

  // ----- helpers -----
  function normName(s) {
    return String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
  }
  function hasCoords(x) {
    const la = Number(x && x.lat);
    const ln = Number(x && (x.lng ?? x.lon));
    return Number.isFinite(la) && Number.isFinite(ln);
  }
  function getLng(x) {
    return Number(x && (x.lng ?? x.lon));
  }
  function safeJSONParse(s) {
    try { return JSON.parse(s); } catch (e) { return null; }
  }

  function loadState() {
    const a = safeJSONParse(localStorage.getItem(KEY) || "");
    if (a && Array.isArray(a.itinerary) && a.itinerary.length) return a;

    const b = safeJSONParse(localStorage.getItem(ROUTE_KEY) || "");
    if (b && Array.isArray(b.itinerary) && b.itinerary.length) return b;

    return { itinerary: [], notes: "" };
  }

  // haversine km
  function distKm(a, b) {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const la1 = a.lat * Math.PI / 180;
    const la2 = b.lat * Math.PI / 180;

    const s = Math.sin(dLat / 2) ** 2 +
      Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(s));
  }

  function totalDistanceKm(stops) {
    let sum = 0;
    for (let i = 1; i < stops.length; i++) {
      sum += distKm(stops[i - 1], stops[i]);
    }
    return sum;
  }

  // ----- master locations (for enrichment) -----
  const byName = new Map(); // "kashi vishwanath temple" -> {lat,lng,...}

  async function loadLocations() {
    try {
      const r = await fetch(LOC_URL, { cache: "no-store" });
      if (!r.ok) return;
      const data = await r.json();
      (data.cities || []).forEach(city => {
        (city.places || []).forEach(pl => {
          if (!pl || !pl.name) return;
          const en = pl.name.en || "";
          const hi = pl.name.hi || "";
          if (en && hasCoords(pl)) byName.set(normName(en), pl);
          if (hi && hasCoords(pl)) byName.set(normName(hi), pl);
        });
      });
    } catch (e) {
      // ignore
    }
  }

  function enrichFromMaster(rawStops) {
    return rawStops.map(s => {
      if (!s || !s.name) return s;

      // normalize lng if old "lon" present
      if (s.lat != null && s.lng == null && s.lon != null) {
        const ln = Number(s.lon);
        if (Number.isFinite(ln)) s.lng = ln;
      }

      if (!hasCoords(s)) {
        const hit = byName.get(normName(s.name));
        if (hit && hasCoords(hit)) {
          s.lat = Number(hit.lat);
          s.lng = Number(hit.lng);
          s.meta = s.meta || {};
          s.meta.coordSource = "master";
          s.placeId = s.placeId || hit.id;
        }
      }
      return s;
    }).filter(Boolean);
  }

  // ----- Leaflet map -----
  let map = null;
  let line = null;
  let markers = [];

  function clearMap() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    if (line) {
      map.removeLayer(line);
      line = null;
    }
  }

  function fitTo(points) {
    if (!points.length) return;
    const latlngs = points.map(p => [p.lat, p.lng]);
    const bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds.pad(0.25));
  }

  function renderList(stops) {
    if (!elList) return;
    elList.innerHTML = "";

    if (!stops.length) {
      elList.innerHTML = `<div class="pp-muted">No stops found. Add places in Tour Maker first.</div>`;
      return;
    }

    stops.forEach((s, i) => {
      const lng = getLng(s);
      const row = document.createElement("div");
      row.className = "pp-stoprow";
      row.innerHTML = `
        <div><b>${i + 1}. ${s.name || ""}</b>
          <div class="pp-muted">${s.subtitle || ""}</div>
        </div>
        <div class="pp-muted" style="text-align:right">
          ${hasCoords(s) ? `${Number(s.lat).toFixed(5)}, ${lng.toFixed(5)}` : "—"}
        </div>
      `;
      elList.appendChild(row);
    });
  }

  function renderSummary(stops) {
    if (!elSummary) return;

    const ok = stops.filter(hasCoords);
    if (stops.length === 0) {
      elSummary.textContent = "No route loaded.";
      return;
    }
    if (ok.length < 2) {
      elSummary.textContent = "Add at least 2 stops with coordinates to draw a route.";
      return;
    }

    const km = totalDistanceKm(ok);
    elSummary.textContent = `Stops: ${stops.length} • Mappable: ${ok.length} • Distance: ${km.toFixed(2)} km`;
  }

  function drawRoute(stops) {
    if (!map) return;

    clearMap();

    const ok = stops.filter(hasCoords).map(s => ({ ...s, lng: getLng(s) }));
    renderList(stops);
    renderSummary(stops);

    if (ok.length === 0) {
      if (elSummary) elSummary.textContent = "No coordinates found for stops.";
      return;
    }

    // markers
    ok.forEach((s, idx) => {
      const m = L.marker([s.lat, s.lng]).addTo(map);
      m.bindPopup(`<b>${idx + 1}. ${s.name || ""}</b><br>${s.subtitle || ""}`);
      markers.push(m);
    });

    // polyline needs >=2 points
    if (ok.length >= 2) {
      line = L.polyline(ok.map(s => [s.lat, s.lng]), { weight: 5, opacity: 0.9 }).addTo(map);
    }

    fitTo(ok);
  }

  function initMap() {
    map = L.map("rmMap", { zoomControl: true }).setView([25.3176, 82.9739], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap"
    }).addTo(map);
  }

  // ----- buttons -----
  function downloadJSON(payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "route-data.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  }

  function setupButtons(currentState) {
    if (btnClear) {
      btnClear.addEventListener("click", () => {
        if (!confirm("Clear route data?")) return;
        localStorage.removeItem(KEY);
        localStorage.removeItem(ROUTE_KEY);
        const empty = { itinerary: [], notes: "" };
        drawRoute([]);
        renderList([]);
        renderSummary([]);
      });
    }

    if (btnDownload) {
      btnDownload.addEventListener("click", () => {
        const st = loadState();
        downloadJSON(st);
      });
    }

    if (btnShare) {
      btnShare.addEventListener("click", () => {
        const st = loadState();
        const list = (st.itinerary || []).map((x, i) => `${i + 1}. ${x.name}`).join("\n");
        const msg = `Route plan:\n${list}\n\nNotes: ${st.notes || ""}`;
        const digits = (window.PP_CONFIG && window.PP_CONFIG.contact && window.PP_CONFIG.contact.phoneE164)
          ? String(window.PP_CONFIG.contact.phoneE164).replace(/\D/g, "")
          : "";
        const url = digits
          ? `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`
          : `https://wa.me/?text=${encodeURIComponent(msg)}`;
        window.open(url, "_blank", "noopener");
      });
    }

    // (optional) autosort & locate start can be wired later;
    // keeping buttons harmless if present
    if (btnAutoSort) btnAutoSort.addEventListener("click", () => alert("Auto-sort coming next (optional)."));
    if (btnLocateStart) btnLocateStart.addEventListener("click", () => alert("Locate start coming next (optional)."));
  }

  // ----- boot -----
  (async function boot() {
    initMap();
    await loadLocations();

    const st = loadState();
    const enriched = enrichFromMaster((st.itinerary || []).slice());
    // Persist normalization back to ROUTE_KEY so route.html always has stable coords
    try {
      const payload = { ...st, itinerary: enriched };
      localStorage.setItem(ROUTE_KEY, JSON.stringify(payload));
    } catch (e) {}

    drawRoute(enriched);
    setupButtons(st);
  })();

})();