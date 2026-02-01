# Master Data Categories — What to Fill

Update these 4 JSON files. The site pages (Experiences/Search/Calendar) can read them.

## 1) Tours
`data/master/tours.json`
Keys: id, title(en/hi), region, duration, locations[], activities[], tags[]
Optional: bestFor[], ctaText, whatsappText

## 2) Rituals
`data/master/rituals.json`
Keys: id, title(en/hi), ritualType, tags[]
Optional: purpose, benefits, duration, locationOptions[], ctaText, whatsappText

## 3) Kathas
`data/master/kathas.json`
Keys: id, title(en/hi), kathaType, duration, tags[]
Optional: specialNotes, ctaText, whatsappText

## 4) Occasions
`data/master/occasions.json`
Keys: date(YYYY-MM-DD), title(en/hi), tags[]
Optional: description, relatedRituals[], relatedTours[], relatedKathas[]

## Golden rule
- Tags connect content.
- Occasion related* arrays connect by IDs.
