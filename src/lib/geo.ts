// ─── Geo: reverse-geocode + zoom granularity + fly-to search ────────────
import type { Place, Granularity } from '../types';

/** Free reverse geocoder, no key, CORS-friendly (follows to api-bdc.io). */
export async function reverseGeocode(lat: number, lon: number): Promise<Place> {
  const url =
    `https://api.bigdatacloud.net/data/reverse-geocode-client` +
    `?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&localityLanguage=en`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('geocode failed');
  const d = await r.json();
  return {
    lat, lon,
    locality: d.locality || undefined,
    city: d.city || d.locality || undefined,
    state: d.principalSubdivision || undefined,
    country: d.countryName || undefined,
    countryCode: d.countryCode || undefined,
  };
}

/**
 * Map camera height (meters above ellipsoid) to the place granularity
 * whose news we show — the deeper you zoom, the more local it gets.
 */
export function granularityForHeight(h: number): Granularity {
  if (h > 4_000_000) return 'country';
  if (h > 1_500_000) return 'state';
  if (h > 450_000) return 'city';
  return 'locality';
}

/** Human label for the current focus, e.g. "Andheri · Mumbai · India". */
export function placeLabel(p: Place, g: Granularity): string {
  const parts: string[] = [];
  if (g === 'locality' && p.locality) parts.push(p.locality);
  if (p.city && p.city !== p.locality) parts.push(p.city);
  if ((g === 'country' || g === 'state') && p.state) parts.push(p.state);
  if (p.country) parts.push(p.country);
  return parts.filter(Boolean).join(' · ') || `${p.lat.toFixed(2)}, ${p.lon.toFixed(2)}`;
}

/** The query string SerpApi gets for a given granularity. */
export function queryFor(p: Place, g: Granularity): string {
  switch (g) {
    case 'locality':
      return [p.locality, p.city, p.country].filter(Boolean).join(' ');
    case 'city':
      return [p.city, p.country].filter(Boolean).join(' ');
    case 'state':
      return [p.state, p.country].filter(Boolean).join(' ');
    case 'country':
      return p.country ?? '';
  }
}

/** Fly-to search: Nominatim, no key, CORS-friendly. */
export async function geocodeSearch(q: string): Promise<{ lat: number; lon: number; label: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) return null;
  const d = await r.json();
  if (!d?.length) return null;
  return { lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon), label: d[0].display_name.split(',').slice(0, 3).join(',') };
}
