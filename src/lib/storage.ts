// ─── TerraPulse local storage: API keys only ───────────────────────────
import type { ApiKeys } from '../types';

const KEYS = 'terrapulse.keys.v1';

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
};
