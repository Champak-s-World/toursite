(function(){
  document.querySelectorAll('[data-include]').forEach(el=>{
    fetch(el.getAttribute('data-include')).then(r=>r.text()).then(t=>el.innerHTML=t);
  });
})();