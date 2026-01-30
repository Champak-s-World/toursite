(function(){
  "use strict";

  const DATA_URL = "data/videos.json";
  const mount = document.getElementById("videosMount");
  if (!mount) return;

  function lang(){ return (window.PP_LANG && window.PP_LANG.getLang) ? window.PP_LANG.getLang() : "en"; }
  function t(obj){ return obj ? (obj[lang()] || obj.en || "") : ""; }

  function buildWA(textObj){
    // Use central contact config if present; override message if provided
    const digits = (window.PP_CONFIG && window.PP_CONFIG.contact && window.PP_CONFIG.contact.phoneE164)
      ? window.PP_CONFIG.contact.phoneE164.replace(/\D/g,"")
      : "919999999999";
    const msg = t(textObj) || (window.PP_CONFIG && window.PP_CONFIG.contact && window.PP_CONFIG.contact.whatsappText ? t(window.PP_CONFIG.contact.whatsappText) : "");
    return "https://wa.me/" + digits + "?text=" + encodeURIComponent(msg || "");
  }

  function createYouTubeIframe(youtubeId){
    const iframe = document.createElement("iframe");
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.loading = "lazy";
    // Start muted for autoplay friendliness
    iframe.dataset.ytId = youtubeId;
    iframe.src = "https://www.youtube.com/embed/" + youtubeId + "?enablejsapi=1&playsinline=1&mute=1&rel=0&modestbranding=1";
    return iframe;
  }

  function createMP4Video(src, poster){
    const v = document.createElement("video");
    v.src = src;
    v.controls = true;
    v.muted = true;         // autoplay policies
    v.playsInline = true;
    v.preload = "metadata";
    if (poster) v.poster = poster;
    return v;
  }

  function ytCommand(iframe, func){
    // PostMessage API for YouTube IFrame Player (works with enablejsapi=1)
    try{
      iframe.contentWindow.postMessage(JSON.stringify({
        event:"command", func, args:[]
      }), "*");
    }catch(e){}
  }

  async function load(){
    const res = await fetch(DATA_URL, {cache:"no-store"});
    const data = await res.json();
    const list = data.videos || [];
    mount.innerHTML = "";

    list.forEach(item => {
      const card = document.createElement("article");
      card.className = "pp-video-card";
      card.dataset.type = item.type;

      const top = document.createElement("div");
      top.className = "pp-video-top";

      const left = document.createElement("div");
      const h = document.createElement("h3");
      h.className = "pp-video-title";
      h.textContent = t(item.title) || "Video";
      const d = document.createElement("div");
      d.className = "pp-video-desc";
      d.textContent = t(item.desc) || "";
      left.appendChild(h);
      left.appendChild(d);

      const tags = document.createElement("div");
      tags.className = "pp-video-tags";
      (item.tags || []).slice(0,6).forEach(tag => {
        const s = document.createElement("span");
        s.className = "pp-tag";
        s.textContent = tag;
        tags.appendChild(s);
      });
      left.appendChild(tags);

      top.appendChild(left);
      card.appendChild(top);

      const frame = document.createElement("div");
      frame.className = "pp-video-frame";

      let mediaEl = null;
      if (item.type === "youtube" && item.youtubeId){
        mediaEl = createYouTubeIframe(item.youtubeId);
      } else if (item.type === "mp4" && item.src){
        mediaEl = createMP4Video(item.src, item.poster || "");
      } else {
        const fallback = document.createElement("div");
        fallback.style.padding="24px";
        fallback.style.color="#fff";
        fallback.textContent="Invalid video item.";
        mediaEl = fallback;
      }

      frame.appendChild(mediaEl);
      card.appendChild(frame);

      const actions = document.createElement("div");
      actions.className = "pp-video-actions";

      const leftA = document.createElement("div");
      const playBtn = document.createElement("button");
      playBtn.className = "pp-mini-btn";
      playBtn.type = "button";
      playBtn.setAttribute("data-i18n","videosPlay");
      playBtn.textContent = (lang()==="hi") ? "चलाएँ" : "Play";

      const pauseBtn = document.createElement("button");
      pauseBtn.className = "pp-mini-btn";
      pauseBtn.type = "button";
      pauseBtn.setAttribute("data-i18n","videosPause");
      pauseBtn.textContent = (lang()==="hi") ? "रोकें" : "Pause";

      leftA.appendChild(playBtn);
      leftA.appendChild(pauseBtn);

      const rightA = document.createElement("div");
      rightA.className = "pp-right-actions";

      // WhatsApp CTA (optional)
      const wa = document.createElement("a");
      wa.className = "pp-btn";
      wa.target="_blank"; wa.rel="noopener";
      wa.textContent = t(item.cta) || ((lang()==="hi") ? "WhatsApp" : "WhatsApp");
      wa.href = buildWA(item.whatsappText || null);
      rightA.appendChild(wa);

      // Open original link
      if (item.type === "youtube" && item.youtubeId){
        const open = document.createElement("a");
        open.className="pp-btn pp-btn-outline";
        open.target="_blank"; open.rel="noopener";
        open.setAttribute("data-i18n","videosOpen");
        open.textContent = (lang()==="hi") ? "खोलें" : "Open";
        open.href = "https://www.youtube.com/watch?v=" + encodeURIComponent(item.youtubeId);
        rightA.appendChild(open);
      }

      actions.appendChild(leftA);
      actions.appendChild(rightA);
      card.appendChild(actions);

      // Controls
      function play(){
        if (item.type==="youtube" && mediaEl.tagName==="IFRAME"){
          ytCommand(mediaEl,"playVideo");
        } else if (item.type==="mp4" && mediaEl.tagName==="VIDEO"){
          mediaEl.play().catch(()=>{});
        }
      }
      function pause(){
        if (item.type==="youtube" && mediaEl.tagName==="IFRAME"){
          ytCommand(mediaEl,"pauseVideo");
        } else if (item.type==="mp4" && mediaEl.tagName==="VIDEO"){
          mediaEl.pause();
        }
      }

      playBtn.addEventListener("click", play);
      pauseBtn.addEventListener("click", pause);

      // Intersection Observer: animate + play/pause
      const io = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
          if (entry.isIntersecting && entry.intersectionRatio >= 0.45){
            card.classList.add("is-visible");
            play();
          } else {
            pause();
          }
        });
      }, { threshold:[0,0.25,0.45,0.7,1] });

      io.observe(card);

      mount.appendChild(card);
    });

    // Apply i18n on dynamic nodes
    if (window.PP_I18N && window.PP_I18N.apply) window.PP_I18N.apply(document);
  }

  window.addEventListener("pp:langchange", load);
  window.addEventListener("pp:includesloaded", load);
  load().catch(console.error);
})();