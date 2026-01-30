(function () {
  "use strict";
  const I18N = {
    siteName: { en: "Spiritual Services", hi: "आध्यात्मिक सेवाएँ" },

    navHome: { en: "Home", hi: "होम" },
    navTours: { en: "Tours", hi: "टूर" },
    navRituals: { en: "Rituals", hi: "यज्ञ/पूजा" },
    navKatha: { en: "Katha", hi: "कथा" },
    navAcharyas: { en: "Acharyas", hi: "आचार्य" },
    navGallery: { en: "Gallery", hi: "गैलरी" },
    navContact: { en: "Contact", hi: "संपर्क" },

    homeTitle: { en: "Spiritual Services & Pilgrimage Experiences", hi: "आध्यात्मिक सेवाएँ एवं तीर्थ यात्रा अनुभव" },
    homeSubtitle: { en: "Tours, Yagya, Kathas & Sacred Arrangements — guided with devotion.", hi: "टूर, यज्ञ, कथा एवं पवित्र व्यवस्थाएँ — पूर्ण श्रद्धा के साथ।" },

    badgeTours: { en: "Spiritual Tours", hi: "धार्मिक यात्राएँ" },
    badgeRituals: { en: "Vedic Rituals", hi: "वैदिक अनुष्ठान" },
    badgeKatha: { en: "Kathas", hi: "कथाएँ" },

    homeServicesTitle: { en: "Our Services", hi: "हमारी सेवाएँ" },
    homeServicesDesc: { en: "Choose from our core spiritual offerings.", hi: "हमारी प्रमुख आध्यात्मिक सेवाओं में से चुनें।" },

    cardToursTitle: { en: "Spiritual Tours", hi: "धार्मिक यात्राएँ" },
    cardToursDesc: { en: "Kashi, Ayodhya, Prayagraj, Chitrakoot, Ujjain, Nashik & more.", hi: "काशी, अयोध्या, प्रयागराज, चित्रकूट, उज्जैन, नासिक एवं अन्य।" },

    cardRitualsTitle: { en: "Yagya & Rituals", hi: "यज्ञ एवं पूजा" },
    cardRitualsDesc: { en: "Mahamrityunjaya Jaap, Rudrabhishek, Shatchandi & more.", hi: "महामृत्युंजय जाप, रुदrाभिषेक, शतचंडी एवं अन्य।" },

    cardKathaTitle: { en: "Kathas & Discourses", hi: "कथा एवं प्रवचन" },
    cardKathaDesc: { en: "Ram Katha, Bhagwat Katha, Shiv & Devi Mahapuran.", hi: "रामकथा, भागवत कथा, शिव एवं देवी महापुराण।" },

    btnExplore: { en: "Explore", hi: "देखें" },

    ctaHomeTitle: { en: "Plan Your Spiritual Journey", hi: "अपनी आध्यात्मिक यात्रा की योजना बनाएं" },
    ctaHomeDesc: { en: "Talk to us on WhatsApp or call directly for guidance.", hi: "मार्गदर्शन के लिए WhatsApp या कॉल करें।" },
    ctaWhatsApp: { en: "WhatsApp", hi: "WhatsApp" },
    ctaCall: { en: "Call", hi: "कॉल करें" },

    galleryTitle: { en: "Gallery", hi: "गैलरी" },
    gallerySubtitle: { en: "Photos & moments from tours, rituals, and kathas.", hi: "टूर, यज्ञ/पूजा और कथाओं के फोटो व क्षण।" },
    galleryBrowseTitle: { en: "Browse by Category", hi: "श्रेणी के अनुसार देखें" },
    galleryBrowseHint: { en: "Use Previous/Next or swipe on mobile.", hi: "Previous/Next दबाएँ या मोबाइल पर swipe करें।" },
    galleryCategoryLabel: { en: "Category", hi: "श्रेणी" },

    footerLine: { en: "Tours • Yagya • Katha • Arrangements", hi: "टूर • यज्ञ • कथा • व्यवस्था" }
  };

  function getLang(){ return (window.PP_LANG && window.PP_LANG.getLang) ? window.PP_LANG.getLang() : "en"; }
  function t(key){
    var e = I18N[key];
    if (!e) return null;
    return e[getLang()] || e.en || "";
  }
  function apply(root){
    root = root || document;
    root.querySelectorAll("[data-i18n]").forEach(function(el){
      var val = t(el.getAttribute("data-i18n"));
      if (val !== null) el.textContent = val;
    });
  }

  apply();
  window.addEventListener("pp:includesloaded", function(){ apply(); });
  window.addEventListener("pp:langchange", function(){ apply(); });

  window.PP_I18N = { apply: apply, dict: I18N };
})();