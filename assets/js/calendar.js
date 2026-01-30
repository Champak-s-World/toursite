(function () {
  "use strict";

  const DATA_URL = "data/calendar.json";

  // Month view elements
  const grid = document.getElementById("calDays");
  const monthLabel = document.getElementById("monthLabel");
  const btnPrev = document.getElementById("btnCalPrev");
  const btnNext = document.getElementById("btnCalNext");
  const btnToday = document.getElementById("btnCalToday");

  // Side
  const sideTitle = document.getElementById("sideDateTitle");
  const sideEvents = document.getElementById("sideEvents");
  const sideLinks = document.getElementById("sideLinks");
  const sideWiki = document.getElementById("sideWiki");

  // New UI
  const selCat = document.getElementById("calCategory");
  const viewMonthBtn = document.getElementById("viewMonthBtn");
  const viewYearBtn = document.getElementById("viewYearBtn");
  const monthView = document.getElementById("monthView");
  const yearView = document.getElementById("yearView");

  if (!grid || !monthLabel || !btnPrev || !btnNext || !btnToday) return;

  let DATA = null;
  let allEvents = [];
  let eventMap = new Map(); // yyyy-mm-dd => [events]
  let view = new Date();
  let selected = null;
  let activeCategory = "all";
  let activeView = "month"; // month | year

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

  function safeClear(el){ if (el) el.innerHTML=""; }

  function getFilteredEvents(){
    if (activeCategory === "all") return allEvents;
    return allEvents.filter(ev => (ev.category || (ev.tags && ev.tags[0]) || "general") === activeCategory);
  }

  function buildEventMap(){
    eventMap = new Map();
    getFilteredEvents().forEach(ev => {
      const k = ev.date;
      if (!eventMap.has(k)) eventMap.set(k, []);
      eventMap.get(k).push(ev);
    });
  }

  function renderMonth(){
    monthLabel.textContent = monthName(view);

    const first = startOfMonth(view);

    // 6-week grid (42 cells), week starts Monday
    const dow = (first.getDay() + 6) % 7;
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

    if (!selected) renderSide(null);
  }

  function renderYear(){
    safeClear(yearView);
    const y = view.getFullYear();
    const monthLabels = [];
    for (let m=0;m<12;m++){
      monthLabels.push(new Date(y, m, 1).toLocaleString(lang()==="hi" ? "hi-IN" : "en-IN", { month:"long" }));
    }

    const wrapper = document.createElement("div");
    wrapper.className = "pp-year";

    for (let m=0;m<12;m++){
      const card = document.createElement("div");
      card.className = "pp-year-card";

      const title = document.createElement("div");
      title.className = "pp-year-title";
      title.textContent = monthLabels[m] + " " + y;
      card.appendChild(title);

      const week = document.createElement("div");
      week.className = "pp-mini-week";
      ["M","T","W","T","F","S","S"].forEach(x=>{
        const s=document.createElement("span"); s.textContent=x; week.appendChild(s);
      });
      card.appendChild(week);

      const mini = document.createElement("div");
      mini.className = "pp-mini-grid";

      const first = new Date(y, m, 1);
      const dow = (first.getDay() + 6) % 7;
      const start = new Date(first);
      start.setDate(first.getDate() - dow);

      for (let i=0;i<42;i++){
        const d = new Date(start);
        d.setDate(start.getDate()+i);
        const key = ymd(d);

        const cell = document.createElement("div");
        cell.className = "pp-mini-day" + (d.getMonth() !== m ? " is-out" : "");
        if (eventMap.has(key)) cell.classList.add("has-ev");
        if (selected && key === selected) cell.classList.add("is-selected");
        cell.title = key;

        if (d.getMonth() === m){
          cell.addEventListener("click", () => {
            selected = key;
            view = new Date(d.getFullYear(), d.getMonth(), 1);
            // When selecting from year view, we keep year view but update selection
            render();
            renderSide(key);
          });
        }

        mini.appendChild(cell);
      }

      card.appendChild(mini);
      wrapper.appendChild(card);
    }

    yearView.appendChild(wrapper);

    if (!selected) renderSide(null);
  }

  function render(){
    buildEventMap();

    // view wrappers
    if (activeView === "month"){
      if (monthView) monthView.style.display = "";
      if (yearView) yearView.style.display = "none";
      renderMonth();
    } else {
      if (monthView) monthView.style.display = "none";
      if (yearView) yearView.style.display = "";
      renderYear();
      // Month label should still show the year
      monthLabel.textContent = String(view.getFullYear());
    }

    // toggle buttons
    if (viewMonthBtn && viewYearBtn){
      viewMonthBtn.classList.toggle("is-active", activeView==="month");
      viewYearBtn.classList.toggle("is-active", activeView==="year");
    }
  }

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
      dt.textContent = key + (ev.category ? " • " + ev.category : "");
      box.appendChild(dt);

      sideEvents.appendChild(box);

      (ev.queries || []).forEach(q => queries.push(q));
    });

    const uniq = Array.from(new Set(queries)).slice(0, 6);
    const primary = uniq[0] || (t(evs[0].title) || "");

    uniq.forEach(q => {
      addLink("🔎 " + q + " (Google)", "https://www.google.com/search?q=" + encodeURIComponent(q));
    });
    if (primary){
      addLink("▶ " + primary + " (YouTube)", "https://www.youtube.com/results?search_query=" + encodeURIComponent(primary));
      addLink("📚 " + primary + " (Wikipedia)", "https://en.wikipedia.org/wiki/Special:Search?search=" + encodeURIComponent(primary));
    }

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

  btnPrev.addEventListener("click", () => {
    if (activeView === "year") {
      view = new Date(view.getFullYear()-1, 0, 1);
      selected = null;
      render();
    } else shiftMonth(-1);
  });
  btnNext.addEventListener("click", () => {
    if (activeView === "year") {
      view = new Date(view.getFullYear()+1, 0, 1);
      selected = null;
      render();
    } else shiftMonth(1);
  });
  btnToday.addEventListener("click", () => {
    const now = new Date();
    view = new Date(now.getFullYear(), activeView==="year" ? 0 : now.getMonth(), 1);
    selected = ymd(now);
    render();
    renderSide(selected);
  });

  if (viewMonthBtn) viewMonthBtn.addEventListener("click", () => { activeView="month"; render(); });
  if (viewYearBtn) viewYearBtn.addEventListener("click", () => { activeView="year"; render(); });

  window.addEventListener("pp:langchange", () => {
    // Re-render everything with translated month names and category labels
    buildCategorySelect();
    render();
    if (selected) renderSide(selected);
  });

  async function buildCategorySelect(){
    if (!selCat) return;
    selCat.innerHTML = "";
    const cats = (DATA && DATA.categories) ? DATA.categories : { all: {en:"All",hi:"सभी"} };
    Object.keys(cats).forEach(key => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = t(cats[key]) || key;
      selCat.appendChild(opt);
    });
    selCat.value = activeCategory;
  }

  if (selCat){
    selCat.addEventListener("change", () => {
      activeCategory = selCat.value || "all";
      selected = null;
      render();
    });
  }

  async function init(){
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load " + DATA_URL);
    DATA = await res.json();
    allEvents = DATA.events || [];
    // normalize category
    allEvents.forEach(ev => {
      if (!ev.category) ev.category = (ev.tags && ev.tags[0]) ? ev.tags[0] : "general";
    });

    await buildCategorySelect();
    // If ?date=YYYY-MM-DD is present, auto-select it
    try{
      const params = new URLSearchParams(location.search);
      const d = params.get("date");
      if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)){
        selected = d;
        const dt = new Date(d + "T00:00:00");
        view = new Date(dt.getFullYear(), activeView==="year" ? 0 : dt.getMonth(), 1);
      }
    }catch(e){}
    render();
    if (selected) renderSide(selected);
  }

  init().catch(err => {
    console.error(err);
    monthLabel.textContent = "Calendar data not found";
  });

  // Expose a tiny helper for home-page upcoming list
  window.PP_CAL = {
    upcoming: function (fromDate, limit, category) {
      if (!DATA) return [];
      const from = fromDate ? new Date(fromDate) : new Date();
      const fromKey = ymd(from);
      const evs = (DATA.events || [])
        .filter(ev => ev.date >= fromKey)
        .filter(ev => !category || category==="all" || (ev.category || (ev.tags&&ev.tags[0]) || "general") === category)
        .sort((a,b)=>a.date.localeCompare(b.date))
        .slice(0, limit || 5);
      return evs;
    },
    t: t,
    lang: lang
  };
})();