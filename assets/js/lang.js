(function(){
  const k='pp_lang';
  const get=()=>localStorage.getItem(k)||'en';
  const set=l=>{localStorage.setItem(k,l);document.documentElement.lang=l;};
  set(get());
  document.addEventListener('click',e=>{
    if(e.target.id==='langToggle'){
      set(get()==='en'?'hi':'en');
      window.dispatchEvent(new Event('pp:langchange'));
    }
  });
  window.PP_LANG={getLang:get};
})();