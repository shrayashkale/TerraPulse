# TerraPulse — what's happening anywhere on Earth, live 🌍

A live interactive 3D Earth globe (CesiumJS + NASA satellite imagery). Zoom anywhere —
the deeper you go, the more local the pulse gets: **breaking news, jobs, and hotels
with live prices** for exactly the place you're looking at, all powered by SerpApi,
with an **AI briefing** that tells you what's happening there.

- 🛰 **HD 3D globe** — CesiumJS with NASA GIBS VIIRS true-color imagery + borders/labels, deep zoom
- 📰 **Hierarchical news** — zoom to India → India's breaking news; zoom to Mumbai → Mumbai's; zoom to Andheri → Andheri's (SerpApi Google News)
- 💼 **Jobs where you zoom** — live listings for the city in view, with role filters (SerpApi Google Jobs)
- 🏨 **Hotels with live prices** — weekend rates for the zoomed city (SerpApi Google Hotels)
- ✨ **AI briefing** — Gemini reads the headlines and briefs you in 3 sentences; ask follow-up questions about the place
- ✈ **Fly-to search** — type any place, the globe flies you there

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
2. The coordinates are reverse-geocoded (BigDataCloud, free, no key) to city/state/country.
3. Altitude picks the granularity: country → state → city → neighbourhood.
4. SerpApi fires: Google News for that place, Google Jobs + Google Hotels at city depth.
5. Gemini synthesizes the headlines into a 3-sentence briefing and answers your questions.

## Demo video script

See [DEMO_SCRIPT.md](DEMO_SCRIPT.md) — under 3 minutes.

## Hackathon

Built for the **SerpApi India Hackathon 2026**. AI-assisted build (Muse by Meta), disclosed per the rules.
