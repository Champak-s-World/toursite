(function(){
  "use strict";
  const box = document.getElementById("homeUpcoming");
  if (!box) return;

  const DATA_URL = "data/calendar.json";

  function lang(){ return (window.PP_LANG && window.PP_LANG.getLang) ? window.PP_LANG.getLang() : "en"; }
  function t(obj){ return obj ? (obj[lang()] || obj.en || "") : ""; }
  function ymd(d){ return d.toISOString().slice(0,10); }

  function render(list){
    box.innerHTML = "";
    if (!list.length){
      const p=document.createElement("div");
      p.className="pp-muted";
      p.setAttribute("data-i18n","calendarNoUpcoming");
      p.textContent="No upcoming occasions found.";
      box.appendChild(p);
      if (window.PP_I18N && window.PP_I18N.apply) window.PP_I18N.apply(document);
      return;
    }

    list.forEach(ev=>{
      const card=document.createElement("div");
      card.className="pp-ev";
      const title=document.createElement("div");
      title.className="pp-ev-title";
      title.textContent = t(ev.title) || "Occasion";
      const date=document.createElement("div");
      date.className="pp-ev-date";
      date.textContent = ev.date + (ev.category ? " • " + ev.category : "");
      const actions=document.createElement("div");
      actions.style.marginTop="8px";
      const a=document.createElement("a");
      a.className="pp-btn pp-btn-outline";
      a.href = "calendar.html?date=" + encodeURIComponent(ev.date);
      a.textContent = (lang()==="hi") ? "देखें" : "View";
      actions.appendChild(a);

      card.appendChild(title);
      card.appendChild(date);
      card.appendChild(actions);
      box.appendChild(card);
    });
  }

  async function load(){
    try{
      const res=await fetch(DATA_URL, {cache:"no-store"});
      const data=await res.json();
      const fromKey=ymd(new Date());
      const list=(data.events||[])
        .map(ev=>{ if(!ev.category) ev.category=(ev.tags&&ev.tags[0])?ev.tags[0]:"general"; return ev; })
        .filter(ev=>ev.date>=fromKey)
        .sort((a,b)=>a.date.localeCompare(b.date))
        .slice(0,5);
      render(list);
    }catch(e){
      console.error(e);
    }
  }

  window.addEventListener("pp:langchange", load);
  window.addEventListener("pp:includesloaded", load);
  load();
})();