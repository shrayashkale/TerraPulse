// ─── TerraPulse local storage: API keys + resume ────────────────────────
import type { ApiKeys, Resume } from '../types';

const KEYS = 'terrapulse.keys.v1';
const RESUME = 'terrapulse.resume.v1';

export const store = {
  getKeys(): ApiKeys | null {
    try {
      const raw = localStorage.getItem(KEYS);
      if (!raw) return null;
      const k = JSON.parse(raw);
      return k.serpapi && k.gemini ? k : null;
    } catch {
      return null;
    }
  },
  setKeys(k: ApiKeys) {
    localStorage.setItem(KEYS, JSON.stringify(k));
  },
  clearKeys() {
    localStorage.removeItem(KEYS);
  },
  getResume(): Resume | null {
    try {
      const raw = localStorage.getItem(RESUME);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setResume(r: Resume | null) {
    if (r) localStorage.setItem(RESUME, JSON.stringify(r));
    else localStorage.removeItem(RESUME);
  },
};
