// ─── TerraPulse types ─────────────────────────────────────────────────

export interface ApiKeys {
  serpapi: string;
  gemini: string;
}

export interface Place {
  lat: number;
  lon: number;
  locality?: string;      // e.g. "Andheri"
  city?: string;          // e.g. "Mumbai"
  state?: string;         // e.g. "Maharashtra"
  country?: string;       // e.g. "India"
  countryCode?: string;   // e.g. "IN"
}

export type Granularity = 'country' | 'state' | 'city' | 'locality';

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  date?: string;
  snippet?: string;
  thumbnail?: string;
}

export interface JobItem {
  title: string;
  company: string;
  location: string;
  via: string;
  description: string;
  applyUrl: string;
  postedAt?: string;
}

export interface HotelItem {
  name: string;
  price?: string;
  rating?: string;
  reviews?: string;
  link: string;
  thumbnail?: string;
  amenities?: string[];
}
