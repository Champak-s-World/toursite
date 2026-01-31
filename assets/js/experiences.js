
(function(){
  "use strict";
  const mount=document.getElementById("expMount");
  if(!mount) return;

  function t(obj,lang){ return obj ? (obj[lang]||obj.en||"") : ""; }
  function lang(){ return document.documentElement.getAttribute("data-lang")||"en"; }

  Promise.all([
    fetch("data/services.json").then(r=>r.json()),
    fetch("data/videos.json").then(r=>r.ok?r.json():{videos:[]}),
    fetch("data/calendar.json").then(r=>r.ok?r.json():{events:[]})
  ]).then(([svc,vid,cal])=>{
    (svc.services||[]).forEach(s=>{
      const card=document.createElement("article");
      card.className="exp-card";

      const h=document.createElement("h3");
      h.textContent=t(s.title,lang());
      card.appendChild(h);

      const p=document.createElement("p");
      p.textContent=t(s.desc,lang());
      card.appendChild(p);

      const ev=(cal.events||[]).filter(e=> (e.tags||[]).some(tg=>(s.tags||[]).includes(tg)))
        .sort((a,b)=>a.date.localeCompare(b.date))[0];
      if(ev){
        const d=document.createElement("div");
        d.className="exp-date";
        d.textContent="📅 "+ev.date;
        card.appendChild(d);
      }

      const vids=(vid.videos||[]).filter(v=> (v.tags||[]).some(tg=>(s.tags||[]).includes(tg)));
      if(vids.length && vids[0].youtubeId){
        const iframe=document.createElement("iframe");
        iframe.src="https://www.youtube.com/embed/"+vids[0].youtubeId+"?mute=1&playsinline=1";
        iframe.loading="lazy";
        iframe.allow="autoplay; encrypted-media";
        iframe.style.width="100%";
        iframe.style.aspectRatio="16/9";
        iframe.style.borderRadius="12px";
        card.appendChild(iframe);
      }

      const a=document.createElement("a");
      a.className="exp-cta";
      a.href="https://wa.me/?text="+encodeURIComponent(t(s.whatsappText||{},lang()));
      a.textContent=t(s.cta||{en:"Enquire"},lang());
      a.target="_blank";
      card.appendChild(a);

      mount.appendChild(card);
    });
  });
})();
