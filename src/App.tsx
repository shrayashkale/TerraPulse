import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiKeys, Place, Granularity, NewsItem, JobItem, HotelItem } from './types';
import { store } from './lib/storage';
import { reverseGeocode, granularityForHeight, placeLabel, queryFor, geocodeSearch } from './lib/geo';
import { fetchNews, fetchJobs, fetchHotels } from './lib/serpapi';
import { briefPlace, askAboutPlace } from './lib/gemini';
import KeyGate from './components/KeyGate';
import Globe, { type GlobeHandle } from './components/Globe';
import SidePanel from './components/SidePanel';
import Briefing from './components/Briefing';

export default function App() {
  const [keys, setKeys] = useState<ApiKeys | null>(() => store.getKeys());
  const globeRef = useRef<GlobeHandle>(null);

  const [place, setPlace] = useState<Place | null>(null);
  const [granularity, setGranularity] = useState<Granularity>('country');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [hotels, setHotels] = useState<HotelItem[]>([]);
  const [loading, setLoading] = useState({ news: false, jobs: false, hotels: false });
  const [error, setError] = useState('');
  const [newsTopic, setNewsTopic] = useState('');
  const [jobQuery, setJobQuery] = useState('');
  const [briefing, setBriefing] = useState('');
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);

  const lastKey = useRef('');
  const keysRef = useRef(keys);
  keysRef.current = keys;
  const topicRef = useRef(newsTopic);
  topicRef.current = newsTopic;
  const jobQRef = useRef(jobQuery);
  jobQRef.current = jobQuery;

  const loadFor = useCallback(async (lat: number, lon: number, height: number, force = false) => {
    const k = keysRef.current;
    if (!k) return;
    try {
      setError('');
      const p = await reverseGeocode(lat, lon);
      const g = granularityForHeight(height);
      const q = queryFor(p, g);
      const cacheKey = `${g}:${q}:${topicRef.current}:${jobQRef.current}`;
      if (!force && cacheKey === lastKey.current) return;
      lastKey.current = cacheKey;

      setPlace(p);
      setGranularity(g);
      const local = g === 'city' || g === 'locality';

      setLoading({ news: true, jobs: local, hotels: local });
      setBriefing('');
      const newsP = fetchNews(k.serpapi, q || p.country || '', p.countryCode, topicRef.current || undefined);
      const jobsP = local
        ? fetchJobs(k.serpapi, jobQRef.current, [p.city, p.country].filter(Boolean).join(', '))
        : Promise.resolve([] as JobItem[]);
      const hotelsP = local
        ? fetchHotels(k.serpapi, [p.city || p.locality, p.country].filter(Boolean).join(' '), p.countryCode)
        : Promise.resolve([] as HotelItem[]);

      const [n, j, h] = await Promise.all([
        newsP.catch(() => [] as NewsItem[]),
        jobsP.catch(() => [] as JobItem[]),
        hotelsP.catch(() => [] as HotelItem[]),
      ]);
      setNews(n); setJobs(j); setHotels(h);
      setLoading({ news: false, jobs: false, hotels: false });

      // AI briefing once the facts are in
      if (n.length > 0) {
        setBriefingLoading(true);
        try {
          const b = await briefPlace(
            k.gemini,
            placeLabel(p, g),
            n.map((x) => x.title),
            j.map((x) => `${x.title} @ ${x.company}`),
          );
          setBriefing(b);
        } catch {
          setBriefing('');
        } finally {
          setBriefingLoading(false);
        }
      }
    } catch (e) {
      setLoading({ news: false, jobs: false, hotels: false });
      setError(e instanceof Error ? e.message : 'Failed to load this area.');
    }
  }, []);

  const onFocusChange = useCallback((lat: number, lon: number, height: number) => {
    loadFor(lat, lon, height);
  }, [loadFor]);

  const doSearch = async () => {
    if (!search.trim() || searching) return;
    setSearching(true);
    try {
      const hit = await geocodeSearch(search.trim());
      if (hit) globeRef.current?.flyTo(hit.lat, hit.lon, 700_000);
    } finally {
      setSearching(false);
    }
  };

  const refetchWithFilters = () => {
    lastKey.current = '';
    // re-derive from current place is complex; simplest: nudge globe via stored last coords
    // (we keep it simple: the next camera move or a re-search will refresh; force via place)
    if (place) loadFor(place.lat, place.lon, granularity === 'locality' ? 200_000 : granularity === 'city' ? 700_000 : granularity === 'state' ? 2_500_000 : 8_000_000, true);
  };

  const ask = useCallback(async (question: string) => {
    const k = keysRef.current;
    if (!k || !place) throw new Error('no context');
    return askAboutPlace(k.gemini, placeLabel(place, granularity), question, {
      headlines: news.map((n) => n.title),
      jobs: jobs.map((j) => `${j.title} @ ${j.company} (${j.location})`),
      hotels: hotels.map((h) => `${h.name}${h.price ? ` — ${h.price}` : ''}`),
    });
  }, [place, granularity, news, jobs, hotels]);

  useEffect(() => {
    document.title = 'TerraPulse — what\'s happening anywhere on Earth, live';
  }, []);

  // pin the place name on the globe itself
  const label = place ? placeLabel(place, granularity) : 'Earth';
  useEffect(() => {
    if (place) globeRef.current?.setLabel(label, place.lat, place.lon);
    else globeRef.current?.setLabel(null);
  }, [label, place]);

  if (!keys) {
    return <KeyGate onDone={() => setKeys(store.getKeys())} />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-ink-950 text-slate-200">
      <Globe ref={globeRef} onFocusChange={onFocusChange} />

      {/* top bar */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 py-3 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-lg font-black text-ink-950">T</div>
          <div>
            <p className="font-bold leading-none tracking-tight">TerraPulse</p>
            <p className="text-[11px] text-cyan-300/80 mt-0.5">{label}</p>
          </div>
        </div>
        <div className="flex-1 flex justify-center pointer-events-auto">
          <div className="flex gap-2 w-full max-w-md">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              placeholder="Fly to… Mumbai, Tokyo, Berlin"
              className="flex-1 glass rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/60 placeholder:text-slate-600"
            />
            <button
              onClick={doSearch}
              disabled={searching}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-ink-950 font-bold text-sm hover:brightness-110 disabled:opacity-40 transition"
            >
              {searching ? '…' : '✈'}
            </button>
          </div>
        </div>
        <div className="w-24 pointer-events-auto hidden md:block" />
      </header>

      {/* left: AI briefing */}
      <div className="absolute left-4 top-20 bottom-4 z-10 w-80 max-w-[calc(100vw-2rem)] hidden sm:block">
        <Briefing briefing={briefing} briefingLoading={briefingLoading} onAsk={ask} />
        <p className="text-[11px] text-slate-600 mt-3 px-1 leading-relaxed">
          Zoom in — the deeper you go, the more local the pulse gets: country → state → city → neighbourhood.
        </p>
      </div>

      {/* right: data tabs */}
      <div className="absolute right-4 top-20 bottom-4 z-10 w-[380px] max-w-[calc(100vw-2rem)] hidden sm:block">
        <SidePanel
          news={news} jobs={jobs} hotels={hotels}
          loading={loading} error={error}
          newsTopic={newsTopic} setNewsTopic={setNewsTopic}
          jobQuery={jobQuery} setJobQuery={setJobQuery}
          onSearch={refetchWithFilters}
        />
      </div>

      {/* mobile: bottom sheet tabs */}
      <div className="absolute left-2 right-2 bottom-2 top-[58%] z-10 sm:hidden">
        <SidePanel
          news={news} jobs={jobs} hotels={hotels}
          loading={loading} error={error}
          newsTopic={newsTopic} setNewsTopic={setNewsTopic}
          jobQuery={jobQuery} setJobQuery={setJobQuery}
          onSearch={refetchWithFilters}
        />
      </div>

      {/* granularity badge */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 hidden sm:block">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full glass text-cyan-300">
          {granularity} pulse
        </span>
      </div>
    </div>
  );
}
