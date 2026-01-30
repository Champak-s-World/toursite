# Spiritual Site v2C (Option C)
- includes/ header + footer (loaded with fetch)
- EN/HI toggle + i18n dictionary
- Polished saffron theme
- Working Gallery Carousel (Prev/Next + dots + swipe)
- data/gallery.json drives the gallery

Run locally with VS Code Live Server (recommended).


## Central Contact Config (NEW)
- Edit: `data/site.config.js`
- Auto-wire links via: `assets/js/contact-utils.js`
- Use attributes:
  - `data-pp="whatsapp"`
  - `data-pp="call"`
  - `data-pp="email" data-subject="..."`
  - `data-pp-text="phone"` / `data-pp-text="email"`


## Find-on-Page (Central, Fixed)
- Loaded via `assets/js/external-scripts.js` (dynamic injection)
- Reason: scripts inside fetched includes (innerHTML) do not execute.
