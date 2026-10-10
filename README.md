# TerraPulse — what's happening anywhere on Earth, live 🌍

A Google-Earth-like **interactive HD 3D globe** that answers one question for any spot on the
planet: *what's happening here, right now?* — and for jobseekers, the sharper one: ***where is
the work?***

Zoom into India and get India's breaking news. Zoom into Mumbai and the pulse goes local —
headlines, hotels with live weekend prices, and **job listings ranked by fit against your own
resume**. Zoom into Andheri and it follows you to the neighbourhood. Every zoom level fires
**SerpApi's Google News, Google Jobs, Google Hotels, and Google Maps engines** off the exact
coordinates in view, and a **Gemini AI briefing** synthesizes it all into a three-sentence brief.

## ✨ Features

- 🛰 **HD 3D globe** — CesiumJS with Esri World Imagery (sharp satellite down to street level),
  plus Esri reference overlays: place names, boundaries, and street labels that resolve
  seamlessly as you zoom — the Google Earth feel, no API key needed for imagery
- 📍 **Pinned place label** — the focused place is always named on the globe itself
  ("Mumbai · Maharashtra · India"), updating live as you pan and zoom
- 📰 **Hierarchical news** — zoom depth decides the news: country → state → city → neighbourhood
  (SerpApi Google News), with topic filters
- 💼 **Resume-matched jobs** — upload your resume once (PDF/DOCX/TXT, parsed in your browser);
  every listing at your zoomed location gets a **match % score**, sorted best-first, with
  matched ✓ and missing skills per job. Role filters included. (SerpApi Google Jobs)
- 📌 **Show on map** — every job card has a button that resolves the company's office via
  SerpApi Google Maps, flies the globe straight there, and drops a pin. Jobs become places
  you can visit
- 🏨 **Hotels with live prices** — real weekend rates for the city in view (SerpApi Google Hotels)
- ✨ **AI briefing** — Gemini reads the headlines and briefs you in 3 sentences; ask follow-up
  questions about any place, answered from the live news/jobs/hotels on screen
- ✈ **Fly-to search** — type any place on Earth, the globe flies you there
- ⚡ **Optimized** — micro-pans don't burn API calls, results are cached per place, heavy
  libraries (PDF parsing) load as separate chunks

## 🎯 The problem it solves

Job seekers don't just need *a* job — they need to know **where the opportunities are for
*their* skills**. Which cities are hiring React developers? Where are the data analyst roles
clustering? LinkedIn shows you a list; TerraPulse shows you a **planet**. Upload your resume,
spin the globe, and see the work market light up wherever you look — each listing scored
against *you*, each company a pin you can fly to. Nobody else puts the job market on a map
you can explore.

It also serves travellers scouting a city (news + hotels + AI brief in one view) and the
simply curious — anyone who ever zoomed into Google Earth and wished it knew what was going
on down there.

## Run it

```bash
npm install
npm run serve
```

Open http://localhost:5173, paste your SerpApi + Gemini keys once (stored in your browser only), and start zooming.

> Why a server? Browsers can't call SerpApi/Gemini directly (neither sends CORS headers),
> so `server.mjs` serves the frontend **and** proxies `/api/*` to both APIs. Your keys stay
> yours: stored in your browser, forwarded per request, never stored server-side.

Keys (both free):
- SerpApi — [serpapi.com](https://serpapi.com) (250 searches/month)
- Gemini — [Google AI Studio](https://aistudio.google.com/app/apikey)

## How it works

1. You zoom/pan the globe → the app reads the camera's focus point + altitude.
2. Coordinates are reverse-geocoded (BigDataCloud, free, no key) to city/state/country.
3. Altitude picks the granularity: country → state → city → neighbourhood.
4. SerpApi fires: Google News for that place; Google Jobs + Google Hotels at city depth;
   Google Maps when you hit "Show on map" on a job.
5. Your resume (parsed in-browser, never uploaded anywhere) scores every job listing.
6. Gemini synthesizes the headlines into a 3-sentence briefing and answers your questions.

## Demo video script

See [DEMO_SCRIPT.md](DEMO_SCRIPT.md) — under 3 minutes. Submission notes in [SUBMISSION.md](SUBMISSION.md).

## Credits

- Globe engine: [CesiumJS](https://cesium.com/)
- Imagery: Esri World Imagery (Esri, Maxar, Earthstar Geographics) + Esri reference overlays
  (Esri, HERE, Garmin, OpenStreetMap contributors)
- Live data: [SerpApi](https://serpapi.com) (Google News, Jobs, Hotels, Maps) ·
  Geocoding: BigDataCloud + Nominatim · AI: Google Gemini

## Hackathon

Built for the **SerpApi India Hackathon 2026**. AI-assisted build (Muse by Meta), disclosed per the rules.
