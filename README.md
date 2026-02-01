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


## Calendar (NEW)
- Page: `calendar.html`
- Data: `data/calendar.json`
- Component: `assets/js/calendar.js` + `assets/css/calendar.css`
- Auto search results: generates Google/YouTube/Wikipedia links and tries Wikipedia summary.


## Videos (NEW)
- Page: `videos.html`
- Data: `data/videos.json`
- Component: `assets/js/videos.js` + `assets/css/videos.css`
- Uses IntersectionObserver to animate cards and auto play/pause media while scrolling.
- Note: Browser autoplay policies may require videos to be muted (we set muted by default for mp4 and YouTube).


## Themes (NEW)
- UI: Theme dropdown in header
- Code: `assets/js/theme.js`
- Storage: localStorage key `pp_theme`
- URL override: `?theme=saffron|dark|ocean|rose`
- Variables overridden via `html[data-theme="..."]` in `assets/css/theme-saffron.css`


## Experiences (NEW)
- Page: `experiences.html`
- Data: `data/services.json` (Option B)
- Auto-links calendar + videos using shared tags.
- Search: smart search dropdown groups Services / Occasions / Videos.


## Tour Maker (NEW)
- Page: `tour-maker.html`
- Search: OpenStreetMap Nominatim (client-side)
- Build itinerary: add/remove/reorder
- Auto-save: localStorage key `pp_tour_maker_v1`
- Export: Download JSON
- Share: WhatsApp message with Google Maps links


## Master Data (NEW)
- Files: `data/master/tours.json`, `rituals.json`, `kathas.json`, `occasions.json`
- Preview page: `master-data.html`
- Guide: `MASTER_DATA_GUIDE.md`


## Featured (NEW)
- Add `featured:true` and `featuredRank` in master JSON items.
- Shared renderer: `assets/js/featured.js`
- Pages: Tours/Rituals/Katha show Featured section from master data.


## Tour Route Map (NEW)
- Page: `route.html`
- Draws itinerary from Tour Maker (`localStorage` key `pp_tour_maker_v1`).
- Shows markers + polyline route + total distance.
- Reorder stops, auto-sort (nearest neighbor), start from current location, WhatsApp share, download route JSON.
