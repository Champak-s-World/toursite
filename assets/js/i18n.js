(function () {
  "use strict";

  // -----------------------------
  // DICTIONARY
  // -----------------------------
  const I18N = {
    siteName: { en: "Spiritual Services", hi: "आध्यात्मिक सेवाएँ" },

    navHome: { en: "Home", hi: "होम" },
    navExperiences: { en: "Experiences", hi: "अनुभव" },
    navTours: { en: "Tours", hi: "टूर" },
    navRituals: { en: "Rituals", hi: "यज्ञ/पूजा" },
    navKatha: { en: "Katha", hi: "कथा" },
    navAcharyas: { en: "Acharyas", hi: "आचार्य" },
    navGallery: { en: "Gallery", hi: "गैलरी" },
    navCalendar: { en: "Calendar", hi: "कैलेंडर" },
    navVideos: { en: "Videos", hi: "वीडियो" },
    navContact: { en: "Contact", hi: "संपर्क" },

    homeTitle: {
      en: "Spiritual Services & Pilgrimage Experiences",
      hi: "आध्यात्मिक सेवाएँ एवं तीर्थ यात्रा अनुभव",
    },
    homeSubtitle: {
      en: "Tours, Yagya, Kathas & Sacred Arrangements — guided with devotion.",
      hi: "टूर, यज्ञ, कथा एवं पवित्र व्यवस्थाएँ — पूर्ण श्रद्धा के साथ।",
    },

    badgeTours: { en: "Spiritual Tours", hi: "धार्मिक यात्राएँ" },
    badgeRituals: { en: "Vedic Rituals", hi: "वैदिक अनुष्ठान" },
    badgeKatha: { en: "Kathas", hi: "कथाएँ" },

    homeServicesTitle: { en: "Our Services", hi: "हमारी सेवाएँ" },
    homeUpcomingTitle: {
      en: "Next Important Occasions",
      hi: "आगामी महत्वपूर्ण अवसर",
    },
    homeUpcomingHint: {
      en: "Auto-generated from the calendar.",
      hi: " Demonstration: कैलेंडर से स्वतः तैयार।",
    },
    homeViewCalendar: { en: "View Full Calendar", hi: "पूरा कैलेंडर देखें" },
    homeServicesDesc: {
      en: "Choose from our core spiritual offerings.",
      hi: "हमारी प्रमुख आध्यात्मिक सेवाओं में से चुनें।",
    },

    cardToursTitle: { en: "Spiritual Tours", hi: "धार्मिक यात्राएँ" },
    cardToursDesc: {
      en: "Kashi, Ayodhya, Prayagraj, Chitrakoot, Ujjain, Nashik & more.",
      hi: "काशी, अयोध्या, प्रयागराज, चित्रकूट, उज्जैन, नासिक एवं अन्य।",
    },

    cardRitualsTitle: { en: "Yagya & Rituals", hi: "यज्ञ एवं पूजा" },
    cardRitualsDesc: {
      en: "Mahamrityunjaya Jaap, Rudrabhishek, Shatchandi & more.",
      hi: "महामृत्युंजय जाप, रुदrाभिषेक, शतचंडी एवं अन्य।",
    },

    cardKathaTitle: { en: "Kathas & Discourses", hi: "कथा एवं प्रवचन" },
    cardKathaDesc: {
      en: "Ram Katha, Bhagwat Katha, Shiv & Devi Mahapuran.",
      hi: "रामकथा, भागवत कथा, शिव एवं देवी महापुराण।",
    },

    btnExplore: { en: "Explore", hi: "देखें" },

    ctaHomeTitle: {
      en: "Plan Your Spiritual Journey",
      hi: "अपनी आध्यात्मिक यात्रा की योजना बनाएं",
    },
    ctaHomeDesc: {
      en: "Talk to us on WhatsApp or call directly for guidance.",
      hi: "मार्गदर्शन के लिए WhatsApp या कॉल करें।",
    },
    ctaWhatsApp: { en: "WhatsApp", hi: "WhatsApp" },
    ctaCall: { en: "Call", hi: "कॉल करें" },

    galleryTitle: { en: "Gallery", hi: "गैलरी" },

    calendarTitle: {
      en: "Important Occasions Calendar",
      hi: "महत्वपूर्ण अवसर कैलेंडर",
    },
    calendarSubtitle: {
      en: "Tap a date to see occasions and auto search results.",
      hi: "किसी तारीख पर टैप करें — अवसर और ऑटो सर्च परिणाम देखें।",
    },
    calendarToday: { en: "Today", hi: "आज" },
    calendarPrev: { en: "Prev", hi: "पिछला" },
    calendarNext: { en: "Next", hi: "अगला" },
    calendarMonthLabel: { en: "Month", hi: "महीना" },
    calendarFilterLabel: { en: "Category", hi: "श्रेणी" },
    calendarViewMonth: { en: "Month View", hi: "मासिक दृश्य" },
    calendarViewYear: { en: "Year View", hi: "वार्षिक दृश्य" },
    calendarUpcoming: { en: "Upcoming", hi: "आगामी" },
    calendarNoUpcoming: {
      en: "No upcoming occasions found.",
      hi: "कोई आगामी अवसर नहीं मिला।",
    },
    calendarOccasions: { en: "Occasions", hi: "अवसर" },
    calendarAutoSearch: { en: "Auto Search Results", hi: "ऑटो सर्च परिणाम" },
    calendarSearchHint: {
      en: "Click a result to open in a new tab.",
      hi: "परिणाम पर क्लिक करें — नई टैब में खुलेगा।",
    },
    calendarNoEvents: {
      en: "No occasions marked for this date.",
      hi: "इस तारीख के लिए कोई अवसर चिन्हित नहीं है।",
    },
    calendarPickDate: {
      en: "Pick a date to view details.",
      hi: "विवरण देखने के लिए तारीख चुनें।",
    },
    calendarAddToJson: {
      en: "Add/Edit occasions in data/calendar.json",
      hi: "अवसर जोड़ें/संपादित करें: data/calendar.json",
    },

    videosTitle: { en: "Videos", hi: "वीडियो" },
    videosSubtitle: {
      en: "Scroll to play. Videos animate in and auto pause when out of view.",
      hi: "स्क्रॉल करें — वीडियो एनिमेशन के साथ दिखेंगे और बाहर जाने पर अपने-आप रुकेंगे।",
    },
    videosAddToJson: {
      en: "Add/Edit videos in data/videos.json",
      hi: "वीडियो जोड़ें/संपादित करें: data/videos.json",
    },
    videosMutedNote: {
      en: "Auto-play works best when videos are muted.",
      hi: "ऑटो-प्ले म्यूट वीडियो पर सबसे अच्छा काम करता है।",
    },
    videosPlay: { en: "Play", hi: "चलाएँ" },
    videosPause: { en: "Pause", hi: "रोकें" },
    videosOpen: { en: "Open", hi: "खोलें" },

    themeLabel: { en: "Theme", hi: "थीम" },

    gallerySubtitle: {
      en: "Photos & moments from tours, rituals, and kathas.",
      hi: "टूर, यज्ञ/पूजा और कथाओं के फोटो व क्षण।",
    },
    galleryBrowseTitle: {
      en: "Browse by Category",
      hi: "श्रेणी के अनुसार देखें",
    },
    galleryBrowseHint: {
      en: "Use Previous/Next or swipe on mobile.",
      hi: "Previous/Next दबाएँ या मोबाइल पर swipe करें।",
    },
    galleryCategoryLabel: { en: "Category", hi: "श्रेणी" },

    footerLine: {
      en: "Tours • Yagya • Katha • Arrangements",
      hi: "टूर • यज्ञ • कथा • व्यवस्था",
    },

    experiencesTitle: { en: "Unified Experiences", hi: "एकीकृत अनुभव" },
    experiencesSubtitle: {
      en: "Services auto-linked with calendar dates and videos using shared tags.",
      hi: "साझा टैग्स के आधार पर सेवाएँ, कैलेंडर तारीखें और वीडियो अपने-आप लिंक होते हैं।",
    },
    experiencesSearchPlaceholder: {
      en: "Search services, festivals, videos…",
      hi: "सेवाएँ, पर्व, वीडियो खोजें…",
    },
    experiencesHelpTitle: {
      en: "Help: How Experiences Work",
      hi: "सहायता: अनुभव कैसे काम करता है",
    },
    experiencesHelpShow: { en: "Show", hi: "दिखाएँ" },
    experiencesHelpHide: { en: "Hide", hi: "छिपाएँ" },
    experiencesGoldenRule: {
      en: "Golden rule: Tags are the glue. If tags don't match, items won't link.",
      hi: "सुनहरा नियम: टैग्स ही कड़ी हैं। टैग नहीं मिले तो लिंक नहीं होगा।",
    },
    experiencesHowToAdd: {
      en: "How to add new items",
      hi: "नया डेटा कैसे जोड़ें",
    },
    experiencesExample: { en: "Example", hi: "उदाहरण" },
    experiencesNextDate: { en: "Next date", hi: "अगली तारीख" },
    experiencesRelatedVideo: { en: "Related video", hi: "संबंधित वीडियो" },
    experiencesEnquire: { en: "Enquire on WhatsApp", hi: "WhatsApp पर पूछें" },

    tourMakerTitle: { en: "Tour Maker", hi: "टूर मेकर" },
    tourMakerSubtitle: {
      en: "Search places, build an itinerary, save automatically, download, and send on WhatsApp.",
      hi: "जगहें खोजें, यात्रा सूची बनाएं, ऑटो-सेव, डाउनलोड करें और WhatsApp पर भेजें।",
    },
    tourMakerSearchLabel: { en: "Search locations", hi: "लोकेशन खोजें" },
    tourMakerSearchPh: {
      en: "Type: Kashi, Ayodhya, Prayagraj, Chitrakoot…",
      hi: "लिखें: काशी, अयोध्या, प्रयागराज, चित्रकूट…",
    },
    tourMakerAdd: { en: "Add", hi: "जोड़ें" },
    tourMakerAdded: { en: "Added", hi: "जुड़ गया" },
    tourMakerItinerary: { en: "Your itinerary", hi: "आपकी यात्रा सूची" },
    tourMakerEmpty: {
      en: "No places added yet.",
      hi: "अभी कोई जगह नहीं जोड़ी गई है।",
    },
    tourMakerNotes: { en: "Notes (optional)", hi: "नोट्स (वैकल्पिक)" },
    tourMakerNotesPh: {
      en: "E.g., dates, hotel, pickup point…",
      hi: "जैसे: तारीख, होटल, पिकअप पॉइंट…",
    },
    tourMakerClear: { en: "Clear", hi: "क्लियर" },
    tourMakerDownload: { en: "Download", hi: "डाउनलोड" },
    tourMakerSendWA: { en: "Send on WhatsApp", hi: "WhatsApp पर भेजें" },
    tourMakerAutoSaved: {
      en: "Auto-saved to your device.",
      hi: "आपके डिवाइस में ऑटो-सेव हो गया।",
    },
  };

  // -----------------------------
  // HELPERS
  // -----------------------------
  function getLang() {
    return window.PP_LANG && window.PP_LANG.getLang
      ? window.PP_LANG.getLang()
      : "en";
  }

  function t(key) {
    const e = I18N[key];
    if (!e) return null;
    const lang = getLang();
    return e[lang] || e.en || "";
  }

  // -----------------------------
  // APPLY TRANSLATIONS
  // -----------------------------
  function apply(root) {
    root = root || document;
    const dict = I18N;
    const lang = getLang();

    // Text content
    root.querySelectorAll("[data-i18n]").forEach(function (el) {
      const key = el.getAttribute("data-i18n");
      const node = dict[key];
      if (!node) return;
      const val = node[lang] || node.en || "";
      if (val) el.textContent = val;
    });

    // Placeholders
    root.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      const key = el.getAttribute("data-i18n-placeholder");
      const node = dict[key];
      if (!node) return;
      const val = node[lang] || node.en || "";
      if (val) el.setAttribute("placeholder", val);
    });
  }

  // Initial + on includes/lang changes
  apply();
  window.addEventListener("pp:includesloaded", function () {
    apply();
  });
  window.addEventListener("pp:langchange", function () {
    apply();
  });

  // Expose a clean API (do NOT duplicate translation keys here)
  window.PP_I18N = {
    apply: apply,
    dict: I18N,
    t: t,
    getLang: getLang,
  };
})();
