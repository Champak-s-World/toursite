(function () {
  "use strict";

  // Prevent double init (in case script is included twice)
  if (window.__PP_ROUTE_MAP_INIT__) return;
  window.__PP_ROUTE_MAP_INIT__ = true;

  const KEY = "pp_tour_maker_v1";
  const ROUTE_KEY = "pp_route_data_v1";
  const LOC_URL = "data/master/locations.json";

  const elMap = document.getElementById("rmMap");
  const elList = document.getElementById("stopList");
  const elSummary = document.getElementById("summary");

  const btnShare = document.getElementById("btnShare");
  const btnClear = document.getElementById("btnClear");
  const btnDownload = document.getElementById("btnDownload");
  const btnRefresh = document.getElementById("btnRefresh");

  if (!elMap) {
    console.error("[route-map] Map container #rmMap not found.");
    return;
  }

  // ---------- helpers ----------
  function normName(s) {
    return String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
  }
  function getLng(x) {
    return Number(x && (x.lng ?? x.lon));
  }
  function hasCoords(x) {
    const la = Number(x && x.lat);
    const ln = getLng(x);
    return Number.isFinite(la) && Number.isFinite(ln);
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
  function saveState(payload) {
    try {
      localStorage.setItem(ROUTE_KEY, JSON.stringify(payload));
    } catch (e) {}
  }

  // haversine distance
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
    for (let i = 1; i < stops.length; i++) sum += distKm(stops[i - 1], stops[i]);
    return sum;
  }

  // ---------- master locations enrichment ----------
  const byName = new Map();

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
    } catch (e) {}
  }

  function normalizeStops(rawStops) {
    return (rawStops || []).map(s => {
      if (!s) return s;

      // normalize lon -> lng
      if (s.lat != null && s.lng == null && s.lon != null) {
        const ln = Number(s.lon);
        if (Number.isFinite(ln)) s.lng = ln;
      }

      if (!hasCoords(s) && s.name) {
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

  // ---------- Leaflet map ----------
  let map = null;
  let markers = [];
  let line = null;

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
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds.pad(0.25));
  }

  function initMapOnce() {
    // If Leaflet already initialized this container, reuse DOM but avoid re-init.
    if (elMap.classList.contains("leaflet-container")) return;

    map = L.map(elMap, { zoomControl: true }).setView([25.3176, 82.9739], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap"
    }).addTo(map);
  }

  function ensureMapRef() {
    if (!map) {
      // try to find existing map instance (Leaflet doesn’t expose it easily)
      // so we store ours. If container already leaflet, we still create map only once above.
      initMapOnce();
      if (!map) {
        // if container already initialized (because older script init), create a map reference safely:
        // simplest: reload page in that case. But usually our initMapOnce handles it.
        map = L.map(elMap); // may throw if already initialized
      }
    }
  }

  // ---------- UI state ----------
  let current = { itinerary: [], notes: "" };

  function renderSummary(stops) {
    if (!elSummary) return;
    const ok = stops.filter(hasCoords).map(s => ({ ...s, lng: getLng(s) }));
    if (!stops.length) {
      elSummary.textContent = "No route loaded.";
      return;
    }
    if (ok.length < 2) {
      elSummary.textContent = `Stops: ${stops.length} • Mappable: ${ok.length} • Distance: 0.00 km`;
      return;
    }
    const km = totalDistanceKm(ok);
    elSummary.textContent = `Stops: ${stops.length} • Mappable: ${ok.length} • Distance: ${km.toFixed(2)} km`;
  }

  function drawRoute(stops) {
    ensureMapRef();
    if (!map) return;

    clearMap();

    const ok = stops.filter(hasCoords).map(s => ({ ...s, lng: getLng(s) }));

    if (!ok.length) {
      renderSummary(stops);
      return;
    }

    ok.forEach((s, idx) => {
      const m = L.marker([s.lat, s.lng]).addTo(map);
      m.bindPopup(`<b>${idx + 1}. ${s.name || ""}</b><br>${s.subtitle || ""}`);
      markers.push(m);
    });

    if (ok.length >= 2) {
      line = L.polyline(ok.map(s => [s.lat, s.lng]), { weight: 6, opacity: 0.95 }).addTo(map);
    }

    fitTo(ok);
    renderSummary(stops);
  }

  function moveStop(from, to) {
    const arr = current.itinerary || [];
    if (from < 0 || to < 0 || from >= arr.length || to >= arr.length) return;
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    saveState(current);
    renderAll();
  }

  function removeStop(i) {
    const arr = current.itinerary || [];
    arr.splice(i, 1);
    saveState(current);
    renderAll();
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
      const card = document.createElement("div");
      card.className = "pp-stop";
      card.innerHTML = `
        <h3><span class="pp-num">${i + 1}</span>${s.name || ""}</h3>
        <div class="pp-muted">${hasCoords(s) ? `${Number(s.lat).toFixed(5)}, ${lng.toFixed(5)}` : "No coords"}</div>
        <div class="pp-stop-actions">
          <button class="pp-btn pp-btn--ghost" data-act="up" data-i="${i}" ${i === 0 ? "disabled" : ""}>↑</button>
          <button class="pp-btn pp-btn--ghost" data-act="down" data-i="${i}" ${i === stops.length - 1 ? "disabled" : ""}>↓</button>
          <button class="pp-btn pp-btn--ghost" data-act="remove" data-i="${i}">Remove</button>
        </div>
      `;
      elList.appendChild(card);
    });

    // delegation
    elList.onclick = (ev) => {
      const btn = ev.target.closest("button[data-act]");
      if (!btn) return;
      const act = btn.getAttribute("data-act");
      const i = Number(btn.getAttribute("data-i"));
      if (!Number.isFinite(i)) return;

      if (act === "up") moveStop(i, i - 1);
      if (act === "down") moveStop(i, i + 1);
      if (act === "remove") removeStop(i);
    };
  }

  function renderAll() {
    // Normalize + enrich
    current.itinerary = normalizeStops(current.itinerary || []);
    // Persist normalized version so it stays stable
    saveState(current);

    renderList(current.itinerary);
    drawRoute(current.itinerary);
  }

  function reloadFromStorage() {
    const st = loadState();
    current = { itinerary: (st.itinerary || []).slice(), notes: st.notes || "" };
    renderAll();
  }

  // ---------- buttons ----------
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

  function setupButtons() {
    if (btnRefresh) btnRefresh.addEventListener("click", reloadFromStorage);

    if (btnClear) {
      btnClear.addEventListener("click", () => {
        if (!confirm("Clear route data?")) return;
        current = { itinerary: [], notes: "" };
        localStorage.removeItem(ROUTE_KEY);
        renderAll();
      });
    }

    if (btnDownload) btnDownload.addEventListener("click", () => downloadJSON(current));

    if (btnShare) {
      btnShare.addEventListener("click", () => {
        const list = (current.itinerary || []).map((x, i) => `${i + 1}. ${x.name}`).join("\n");
        const msg = `Route plan:\n${list}\n\nNotes: ${current.notes || ""}`;
        const digits = (window.PP_CONFIG && window.PP_CONFIG.contact && window.PP_CONFIG.contact.phoneE164)
          ? String(window.PP_CONFIG.contact.phoneE164).replace(/\D/g, "")
          : "";
        const url = digits
          ? `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`
          : `https://wa.me/?text=${encodeURIComponent(msg)}`;
        window.open(url, "_blank", "noopener");
      });
    }
  }

  // ---------- auto refresh hooks ----------
  function setupAutoRefresh() {
    // When you come back to this tab after editing Tour Maker
    window.addEventListener("focus", reloadFromStorage);

    // When localStorage changes (same origin, other tab)
    window.addEventListener("storage", (e) => {
      if (e.key === KEY || e.key === ROUTE_KEY) reloadFromStorage();
    });
  }

  // ---------- boot ----------
  (async function boot() {
    // Build map + load master locations then load route
    try { initMapOnce(); } catch (e) {}

    await loadLocations();
    setupButtons();
    setupAutoRefresh();
    reloadFromStorage();
  })();

})();