(function(){
  const dict={
    siteName:{en:'Spiritual Services',hi:'आध्यात्मिक सेवाएँ'},
    navGallery:{en:'Gallery',hi:'गैलरी'},
    homeTitle:{en:'Welcome',hi:'स्वागत है'},
    footerLine:{en:'Tours • Yagya • Katha • Arrangements',hi:'टूर • यज्ञ • कथा • व्यवस्था'}
  };
  function apply(){
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const k=el.dataset.i18n;
      el.textContent=dict[k][PP_LANG.getLang()]||'';
    });
  }
  apply();
  window.addEventListener('pp:langchange',apply);
})();