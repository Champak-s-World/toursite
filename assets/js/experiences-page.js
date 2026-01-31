(function(){
  "use strict";
  const mount=document.getElementById("expMount");
  const q=document.getElementById("smartSearch");
  const resultsWrap=document.getElementById("resultsWrap");
  const helpBtn=document.getElementById("helpToggle");
  const helpBody=document.getElementById("helpBody");
  if(!mount) return;

  function getLang(){ return (window.PP_LANG && window.PP_LANG.getLang) ? window.PP_LANG.getLang() : "en"; }
  function t(obj){ const L=getLang(); return obj ? (obj[L]||obj.en||"") : ""; }
  function ymd(){ return new Date().toISOString().slice(0,10); }

  async function loadJSON(url){ const r=await fetch(url,{cache:"no-store"}); return r.json(); }

  function intersects(a,b){
    const A=new Set(a||[]);
    return (b||[]).some(x=>A.has(x));
  }

  function groupResults(items){
    const g={services:[], events:[], videos:[]};
    items.forEach(it=>{
      if(it.type==="service") g.services.push(it);
      else if(it.type==="event") g.events.push(it);
      else if(it.type==="video") g.videos.push(it);
    });
    return g;
  }

  function renderResultsBox(grouped){
    resultsWrap.innerHTML="";
    const has = grouped.services.length || grouped.events.length || grouped.videos.length;
    if(!has){ resultsWrap.style.display="none"; return; }
    resultsWrap.style.display="block";

    function addGroup(title, items, onClick){
      if(!items.length) return;
      const box=document.createElement("div");
      box.className="pp-res-group";
      const h=document.createElement("div");
      h.className="pp-res-title";
      h.textContent=title;
      box.appendChild(h);

      items.slice(0,6).forEach(it=>{
        const row=document.createElement("div");
        row.className="pp-res-item";
        const left=document.createElement("div");
        left.className="pp-res-left";
        left.textContent = it.label;
        const right=document.createElement("div");
        right.className="pp-res-right";
        right.textContent = it.meta;
        row.appendChild(left); row.appendChild(right);
        row.addEventListener("click", ()=>onClick(it));
        box.appendChild(row);
      });

      resultsWrap.appendChild(box);
    }

    addGroup(getLang()==="hi"?"सेवाएँ":"Services", grouped.services, (it)=>{
      resultsWrap.style.display="none";
      q.blur();
      const el=document.getElementById("svc-"+it.id);
      if(el) el.scrollIntoView({behavior:"smooth", block:"start"});
    });
    addGroup(getLang()==="hi"?"अवसर":"Occasions", grouped.events, (it)=>{
      resultsWrap.style.display="none";
      window.location.href = "calendar.html?date="+encodeURIComponent(it.id);
    });
    addGroup(getLang()==="hi"?"वीडियो":"Videos", grouped.videos, (it)=>{
      resultsWrap.style.display="none";
      window.location.href = "videos.html";
    });
  }

  function buildIndex(services, videos, calendar){
    const idx=[];
    (services.services||[]).forEach(s=>{
      idx.push({type:"service", id:s.id, label:t(s.title), meta:(s.type||"service"), text:(t(s.title)+" "+t(s.desc)+" "+(s.tags||[]).join(" ")).toLowerCase()});
    });
    (calendar.events||[]).forEach(e=>{
      idx.push({type:"event", id:e.date, label:(t(e.title)||e.date), meta:e.date, text:(t(e.title)+" "+(e.tags||[]).join(" ")+ " " + (e.queries||[]).join(" ")).toLowerCase()});
    });
    (videos.videos||[]).forEach(v=>{
      idx.push({type:"video", id:v.id||v.youtubeId, label:t(v.title)||("Video "+(v.youtubeId||"")), meta:(v.youtubeId?"YouTube":"video"), text:(t(v.title)+" "+t(v.desc)+" "+(v.tags||[]).join(" ")).toLowerCase()});
    });
    return idx;
  }

  function nextEventFor(service, calendar){
    const today = ymd();
    const list=(calendar.events||[])
      .filter(e=>e.date>=today)
      .filter(e=>intersects(service.tags, e.tags))
      .sort((a,b)=>a.date.localeCompare(b.date));
    return list[0] || null;
  }

  function pickVideoFor(service, videos){
    // Prefer explicit relatedVideos (youtubeId list) then fallback to tag match
    const rel=(service.relatedVideos||[]);
    if(rel.length){
      const v=(videos.videos||[]).find(x=> rel.includes(x.youtubeId) || rel.includes(x.id));
      if(v && v.youtubeId) return v;
    }
    const v2=(videos.videos||[]).find(v=>v.youtubeId && intersects(service.tags, v.tags));
    return v2 || null;
  }

  function waLink(service){
    const digits = (window.PP_CONFIG && window.PP_CONFIG.contact && window.PP_CONFIG.contact.phoneE164)
      ? window.PP_CONFIG.contact.phoneE164.replace(/\D/g,"")
      : "";
    const msg = t(service.whatsappText) || (t(service.title) ? ("Enquiry: "+t(service.title)) : "");
    if(digits) return "https://wa.me/"+digits+"?text="+encodeURIComponent(msg);
    return "https://wa.me/?text="+encodeURIComponent(msg);
  }

  function card(service, ev, vid){
    const el=document.createElement("article");
    el.className="pp-exp";
    el.id="svc-"+service.id;

    const top=document.createElement("div");
    top.className="pp-exp-top";

    const h=document.createElement("h3");
    h.className="pp-exp-title";
    h.textContent=t(service.title);
    top.appendChild(h);

    const d=document.createElement("div");
    d.className="pp-exp-desc";
    d.textContent=t(service.desc);
    top.appendChild(d);

    const chips=document.createElement("div");
    chips.className="pp-chiprow";
    (service.tags||[]).slice(0,6).forEach(tag=>{
      const s=document.createElement("span");
      s.className="pp-chip";
      s.textContent=tag;
      chips.appendChild(s);
    });
    top.appendChild(chips);

    el.appendChild(top);

    const mid=document.createElement("div");
    mid.className="pp-exp-mid";

    const row=document.createElement("div");
    row.className="pp-row";

    const meta=document.createElement("div");
    meta.className="pp-meta";
    meta.textContent = ev ? ("📅 "+(window.PP_I18N?.dict?.experiencesNextDate?.[getLang()]||"Next date")+": "+ev.date) : "";
    row.appendChild(meta);

    const mini=document.createElement("div");
    mini.className="pp-mini";
    mini.textContent = service.type ? service.type.toUpperCase() : "";
    row.appendChild(mini);
    mid.appendChild(row);

    if(vid && vid.youtubeId){
      const emb=document.createElement("div");
      emb.className="pp-embed";
      const iframe=document.createElement("iframe");
      iframe.loading="lazy";
      iframe.allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen=true;
      iframe.dataset.yt=vid.youtubeId;
      iframe.src="https://www.youtube.com/embed/"+vid.youtubeId+"?enablejsapi=1&playsinline=1&mute=1&rel=0&modestbranding=1";
      emb.appendChild(iframe);
      mid.appendChild(emb);
    }

    el.appendChild(mid);

    const actions=document.createElement("div");
    actions.className="pp-exp-actions";
    const a=document.createElement("a");
    a.className="pp-btn";
    a.target="_blank"; a.rel="noopener";
    a.href=waLink(service);
    a.textContent = t(service.cta) || (window.PP_I18N?.dict?.experiencesEnquire?.[getLang()]||"Enquire on WhatsApp");
    actions.appendChild(a);

    if(ev){
      const b=document.createElement("a");
      b.className="pp-btn pp-btn-outline";
      b.href="calendar.html?date="+encodeURIComponent(ev.date);
      b.textContent="📅 "+ev.date;
      actions.appendChild(b);
    }

    el.appendChild(actions);

    return el;
  }

  function observeCards(){
    const cards=[...document.querySelectorAll(".pp-exp")];
    const io=new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){ e.target.style.transform="translateY(0)"; e.target.style.opacity="1"; }
      });
    },{threshold:0.15});
    cards.forEach(c=>{
      c.style.transform="translateY(10px)";
      c.style.opacity="0";
      c.style.transition="transform .55s ease, opacity .55s ease";
      io.observe(c);
    });
  }

  async function init(){
    const [services, videos, calendar] = await Promise.all([
      loadJSON("data/services.json"),
      loadJSON("data/videos.json"),
      loadJSON("data/calendar.json")
    ]);

    // Build search index
    const index = buildIndex(services, videos, calendar);

    // Render cards
    mount.innerHTML="";
    (services.services||[]).forEach(s=>{
      const ev = nextEventFor(s, calendar);
      const v = pickVideoFor(s, videos);
      mount.appendChild(card(s, ev, v));
    });
    observeCards();

    // Search UI
    function runSearch(){
      const text=(q.value||"").trim().toLowerCase();
      if(!text){ resultsWrap.style.display="none"; return; }
      const hits=index.filter(it=>it.text.includes(text)).slice(0,18);
      renderResultsBox(groupResults(hits));
    }
    q.addEventListener("input", ()=>{ runSearch(); });
    document.addEventListener("click",(e)=>{
      if(!resultsWrap.contains(e.target) && e.target!==q) resultsWrap.style.display="none";
    });

    // Help toggle
    if(helpBtn && helpBody){
      const showTxt = window.PP_I18N?.dict?.experiencesHelpShow?.[getLang()] || "Show";
      const hideTxt = window.PP_I18N?.dict?.experiencesHelpHide?.[getLang()] || "Hide";
      function setOpen(open){
        helpBtn.setAttribute("aria-expanded", open?"true":"false");
        helpBtn.textContent = open?hideTxt:showTxt;
        helpBody.hidden = !open;
      }
      helpBtn.addEventListener("click", ()=>{
        const open = helpBtn.getAttribute("aria-expanded")==="true";
        setOpen(!open);
      });
      setOpen(false);
      window.addEventListener("pp:langchange", ()=>{
        // refresh button labels
        const open = helpBtn.getAttribute("aria-expanded")==="true";
        const s2 = window.PP_I18N?.dict?.experiencesHelpShow?.[getLang()] || "Show";
        const h2 = window.PP_I18N?.dict?.experiencesHelpHide?.[getLang()] || "Hide";
        helpBtn.textContent = open ? h2 : s2;
      });
    }
  }

  window.addEventListener("pp:langchange", ()=>{ init().catch(console.error); });
  window.addEventListener("pp:includesloaded", ()=>{ init().catch(console.error); });
  init().catch(console.error);
})();