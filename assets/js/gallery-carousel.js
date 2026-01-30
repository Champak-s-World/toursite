(function () {
  "use strict";
  const DATA_URL = "data/gallery.json";

  const elSelect = document.getElementById("categorySelect");
  const elStage  = document.getElementById("carouselStage");
  const elPrev   = document.getElementById("btnPrev");
  const elNext   = document.getElementById("btnNext");
  const elDots   = document.getElementById("dots");
  const elTitle  = document.getElementById("captionTitle");
  const elDesc   = document.getElementById("captionDesc");
  const elCount  = document.getElementById("counter");

  if (!elSelect || !elStage || !elPrev || !elNext) return;

  let DATA = null;
  let slides = [];
  let index = 0;

  function lang(){ return (window.PP_LANG && window.PP_LANG.getLang) ? window.PP_LANG.getLang() : "en"; }
  function t(obj){ return obj ? (obj[lang()] || obj.en || "") : ""; }

  function setActive(newIndex){
    if (!slides.length) return;
    index = (newIndex + slides.length) % slides.length;

    elStage.querySelectorAll(".pp-slide").forEach(function(node, i){
      node.classList.toggle("is-active", i === index);
    });

    var item = slides[index];
    elTitle.textContent = t(item.title) || "—";
    elDesc.textContent  = t(item.desc)  || "—";
    elCount.textContent = (index+1) + " / " + slides.length;

    if (elDots) {
      elDots.querySelectorAll(".pp-dot").forEach(function(d, i){
        d.classList.toggle("is-active", i === index);
      });
    }
  }

  function renderDots(){
    if (!elDots) return;
    elDots.innerHTML = "";
    slides.forEach(function(_, i){
      var b = document.createElement("button");
      b.type = "button";
      b.className = "pp-dot" + (i === index ? " is-active" : "");
      b.setAttribute("aria-label", "Go to slide " + (i+1));
      b.addEventListener("click", function(){ setActive(i); });
      elDots.appendChild(b);
    });
  }

  function renderSlides(){
    elStage.innerHTML = "";
    slides.forEach(function(item, i){
      var wrap = document.createElement("div");
      wrap.className = "pp-slide" + (i === index ? " is-active" : "");

      var fig = document.createElement("figure");
      var img = document.createElement("img");
      img.loading = "lazy";
      img.src = item.src;
      img.alt = t(item.alt) || t(item.title) || "Gallery image";

      fig.appendChild(img);
      wrap.appendChild(fig);
      elStage.appendChild(wrap);
    });

    renderDots();
    setActive(index);
  }

  function fillCategories(){
    elSelect.innerHTML = "";
    var cats = (DATA && DATA.categories) ? DATA.categories : {};
    Object.keys(cats).forEach(function(key){
      var opt = document.createElement("option");
      opt.value = key;
      opt.textContent = t(cats[key].label) || key;
      elSelect.appendChild(opt);
    });
    var def = DATA.defaultCategory;
    var first = Object.keys(cats)[0];
    elSelect.value = (def && cats[def]) ? def : first;
  }

  function loadCategory(key){
    var cats = (DATA && DATA.categories) ? DATA.categories : {};
    if (!cats[key]) return;
    slides = cats[key].items || [];
    index = 0;
    renderSlides();
  }

  elPrev.addEventListener("click", function(){ setActive(index - 1); });
  elNext.addEventListener("click", function(){ setActive(index + 1); });
  elSelect.addEventListener("change", function(){ loadCategory(elSelect.value); });

  elStage.addEventListener("keydown", function(e){
    if (e.key === "ArrowLeft") { e.preventDefault(); elPrev.click(); }
    if (e.key === "ArrowRight"){ e.preventDefault(); elNext.click(); }
  });

  let sx=0, sy=0, touching=false;
  elStage.addEventListener("touchstart", function(e){
    if (!e.touches || e.touches.length !== 1) return;
    touching = true;
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
  }, { passive:true });

  elStage.addEventListener("touchend", function(e){
    if (!touching) return;
    touching = false;
    var tEnd = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : null;
    if (!tEnd) return;
    var dx = tEnd.clientX - sx;
    var dy = tEnd.clientY - sy;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0) elPrev.click(); else elNext.click();
  }, { passive:true });

  window.addEventListener("pp:langchange", function(){
    var cats = (DATA && DATA.categories) ? DATA.categories : {};
    Array.from(elSelect.options).forEach(function(opt){
      var k = opt.value;
      opt.textContent = t(cats[k] && cats[k].label) || k;
    });
    elStage.querySelectorAll("img").forEach(function(img, i){
      var it = slides[i];
      if (it) img.alt = t(it.alt) || t(it.title) || "Gallery image";
    });
    setActive(index);
  });

  async function init(){
    var res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load " + DATA_URL);
    DATA = await res.json();
    fillCategories();
    loadCategory(elSelect.value);
  }

  init().catch(function(e){
    console.error(e);
    elTitle.textContent = "Gallery data not found";
    elDesc.textContent = "Check data/gallery.json";
  });
})();