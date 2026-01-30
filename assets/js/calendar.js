(function () {
  "use strict";

  const DATA_URL = "data/calendar.json";

  const grid = document.getElementById("calDays");
  const monthLabel = document.getElementById("monthLabel");
  const btnPrev = document.getElementById("btnCalPrev");
  const btnNext = document.getElementById("btnCalNext");
  const btnToday = document.getElementById("btnCalToday");

  const sideTitle = document.getElementById("sideDateTitle");
  const sideEvents = document.getElementById("sideEvents");
  const sideLinks = document.getElementById("sideLinks");
  const sideWiki = document.getElementById("sideWiki");

  if (!grid || !monthLabel || !btnPrev || !btnNext || !btnToday) return;

  let DATA = null;
  let eventMap = new Map(); // yyyy-mm-dd => [events]
  let view = new Date();
  let selected = null;

  function lang() {
    return (window.PP_LANG && window.PP_LANG.getLang) ? window.PP_LANG.getLang() : "en";
  }
  function t(obj) {
    return obj ? (obj[lang()] || obj.en || "") : "";
  }
  function pad2(n){ return String(n).padStart(2,"0"); }
  function ymd(d){
    return d.getFullYear() + "-" + pad2(d.getMonth()+1) + "-" + pad2(d.getDate());
  }
  function monthName(d){
    return d.toLocaleString(lang()==="hi" ? "hi-IN" : "en-IN", { month: "long", year: "numeric" });
  }
  function startOfMonth(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }
  function endOfMonth(d){ return new Date(d.getFullYear(), d.getMonth()+1, 0); }

  function buildEventMap(){
    eventMap = new Map();
    (DATA.events || []).forEach(ev => {
      const k = ev.date;
      if (!eventMap.has(k)) eventMap.set(k, []);
      eventMap.get(k).push(ev);
    });
  }

  function render(){
    monthLabel.textContent = monthName(view);

    const first = startOfMonth(view);
    const last = endOfMonth(view);

    // Build a 6-week grid (42 cells), week starts Monday for India-ish feel
    const dow = (first.getDay() + 6) % 7; // convert Sunday=0 to Monday=0
    const start = new Date(first);
    start.setDate(first.getDate() - dow);

    grid.innerHTML = "";
    const todayKey = ymd(new Date());

    for (let i=0;i<42;i++){
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = ymd(d);

      const cell = document.createElement("div");
      cell.className = "pp-day" + (d.getMonth() !== view.getMonth() ? " is-out" : "");
      cell.dataset.date = key;

      if (key === todayKey) cell.classList.add("is-today");
      if (selected && key === selected) cell.classList.add("is-selected");

      const num = document.createElement("div");
      num.className = "pp-day-num";
      num.textContent = d.getDate();
      cell.appendChild(num);

      if (eventMap.has(key)) {
        const dot = document.createElement("span");
        dot.className = "pp-day-dot";
        cell.appendChild(dot);
      }

      cell.addEventListener("click", () => {
        selected = key;
        render();
        renderSide(key);
      });

      grid.appendChild(cell);
    }

    // If nothing selected, show hint
    if (!selected) renderSide(null);
  }

  function safeClear(el){ if (el) el.innerHTML=""; }

  function addLink(title, url){
    const a = document.createElement("a");
    a.className = "pp-link";
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = title;
    sideLinks.appendChild(a);
  }

  async function wikiSummary(query){
    // Wikipedia REST summary: best-effort (may fail depending on network)
    // We'll use English for now; you can add hi later if needed.
    try{
      const u = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(query);
      const res = await fetch(u, { headers: { "accept": "application/json" } });
      if (!res.ok) throw new Error("wiki fetch failed");
      return await res.json();
    }catch(e){
      return null;
    }
  }

  async function renderSide(key){
    safeClear(sideEvents);
    safeClear(sideLinks);
    safeClear(sideWiki);

    if (!key){
      sideTitle.textContent = (window.PP_I18N && window.PP_I18N.dict && window.PP_I18N.dict.calendarPickDate)
        ? (window.PP_I18N.dict.calendarPickDate[lang()] || window.PP_I18N.dict.calendarPickDate.en)
        : "Pick a date to view details.";
      return;
    }

    const dateObj = new Date(key + "T00:00:00");
    sideTitle.textContent = dateObj.toLocaleDateString(lang()==="hi" ? "hi-IN" : "en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

    const evs = eventMap.get(key) || [];
    if (!evs.length){
      const div = document.createElement("div");
      div.className="pp-muted";
      div.textContent = (window.PP_I18N && window.PP_I18N.dict && window.PP_I18N.dict.calendarNoEvents)
        ? (window.PP_I18N.dict.calendarNoEvents[lang()] || window.PP_I18N.dict.calendarNoEvents.en)
        : "No occasions marked for this date.";
      sideEvents.appendChild(div);
      return;
    }

    // Render events + generate search links
    const queries = [];
    evs.forEach(ev => {
      const box = document.createElement("div");
      box.className="pp-ev";

      const title = document.createElement("div");
      title.className="pp-ev-title";
      title.textContent = t(ev.title) || "Occasion";
      box.appendChild(title);

      const dt = document.createElement("div");
      dt.className="pp-ev-date";
      dt.textContent = key;
      box.appendChild(dt);

      sideEvents.appendChild(box);

      (ev.queries || []).forEach(q => queries.push(q));
    });

    // unique queries
    const uniq = Array.from(new Set(queries)).slice(0, 6);
    const primary = uniq[0] || (t(evs[0].title) || "");

    // Auto search results: build links
    uniq.forEach(q => {
      addLink("🔎 " + q + " (Google)", "https://www.google.com/search?q=" + encodeURIComponent(q));
    });
    if (primary){
      addLink("▶ " + primary + " (YouTube)", "https://www.youtube.com/results?search_query=" + encodeURIComponent(primary));
      addLink("📚 " + primary + " (Wikipedia)", "https://en.wikipedia.org/wiki/Special:Search?search=" + encodeURIComponent(primary));
    }

    // Wikipedia summary (best-effort)
    if (primary){
      const w = await wikiSummary(primary);
      if (w && w.extract){
        const wrap = document.createElement("div");
        wrap.className="pp-wiki";

        const h = document.createElement("div");
        h.className="pp-wiki-title";
        h.textContent = "Wikipedia: " + (w.title || primary);
        wrap.appendChild(h);

        const p = document.createElement("div");
        p.className="pp-wiki-text";
        p.textContent = w.extract;
        wrap.appendChild(p);

        sideWiki.appendChild(wrap);
      }
    }
  }

  function shiftMonth(delta){
    view = new Date(view.getFullYear(), view.getMonth()+delta, 1);
    selected = null;
    render();
  }

  btnPrev.addEventListener("click", () => shiftMonth(-1));
  btnNext.addEventListener("click", () => shiftMonth(1));
  btnToday.addEventListener("click", () => {
    view = new Date();
    selected = ymd(new Date());
    render();
    renderSide(selected);
  });

  window.addEventListener("pp:langchange", () => {
    render();
    if (selected) renderSide(selected);
  });

  async function init(){
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load " + DATA_URL);
    DATA = await res.json();
    buildEventMap();
    render();
  }

  init().catch(err => {
    console.error(err);
    monthLabel.textContent = "Calendar data not found";
  });
})();