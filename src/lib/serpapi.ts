// ─── SerpApi data layer: news, jobs, hotels for a place ────────────────
import type { NewsItem, JobItem, HotelItem } from '../types';

async function callSerpApi(apiKey: string, params: Record<string, string>) {
  const qs = new URLSearchParams({ api_key: apiKey, ...params });
  const r = await fetch(`/api/serpapi?${qs}`);
  if (!r.ok) throw new Error(`SerpApi ${r.status}`);
  return r.json();
}

export async function fetchNews(apiKey: string, query: string, countryCode?: string, topic?: string): Promise<NewsItem[]> {
  const q = topic ? `${topic} ${query}`.trim() : query;
  const d = await callSerpApi(apiKey, {
    engine: 'google_news',
    q,
    gl: (countryCode ?? 'US').toLowerCase(),
    hl: 'en',
  });
  return (d.news_results ?? []).slice(0, 12).map((n: any) => ({
    title: n.title,
    link: n.link,
    source: n.source?.name ?? n.source ?? '',
    date: n.date,
    snippet: n.snippet,
    thumbnail: n.thumbnail,
  }));
}

export async function fetchJobs(apiKey: string, query: string, location: string): Promise<JobItem[]> {
  const d = await callSerpApi(apiKey, {
    engine: 'google_jobs',
    q: query || 'jobs',
    location,
    hl: 'en',
  });
  return (d.jobs_results ?? []).slice(0, 12).map((j: any) => ({
    title: j.title,
    company: j.company_name,
    location: j.location,
    via: j.via,
    description: j.description ?? '',
    applyUrl: j.apply_options?.[0]?.link ?? j.related_links?.[0]?.link ?? '',
    postedAt: j.detected_extensions?.posted_at,
  }));
}

const CURRENCY: Record<string, string> = {
  IN: 'INR', US: 'USD', GB: 'GBP', AE: 'AED', SG: 'SGD', EU: 'EUR',
  JP: 'JPY', AU: 'AUD', CA: 'CAD',
};

export async function fetchHotels(apiKey: string, place: string, countryCode?: string): Promise<HotelItem[]> {
  // default: next Friday → Sunday
  const fri = new Date();
  fri.setDate(fri.getDate() + ((5 - fri.getDay() + 7) % 7 || 7));
  const sun = new Date(fri);
  sun.setDate(fri.getDate() + 2);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const d = await callSerpApi(apiKey, {
    engine: 'google_hotels',
    q: place,
    check_in_date: fmt(fri),
    check_out_date: fmt(sun),
    adults: '2',
    currency: CURRENCY[countryCode ?? ''] ?? 'USD',
    gl: (countryCode ?? 'US').toLowerCase(),
    hl: 'en',
  });
  const props = d.properties ?? [];
  return props.slice(0, 10).map((h: any) => ({
    name: h.name,
    price: h.rate_per_night?.lowest ?? h.total_rate?.lowest,
    rating: h.overall_rating,
    reviews: h.reviews,
    link: h.link ?? '',
    thumbnail: h.images?.[0]?.thumbnail,
    amenities: (h.amenities ?? []).slice(0, 5),
  }));
}
