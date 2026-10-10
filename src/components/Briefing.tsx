// ─── TerraPulse AI: place briefing + ask-about-this-place ──────────────
import { useState } from 'react';

interface Props {
  briefing: string;
  briefingLoading: boolean;
  onAsk: (q: string) => Promise<string>;
}

export default function Briefing({ briefing, briefingLoading, onAsk }: Props) {
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);

  const ask = async () => {
    if (!q.trim() || asking) return;
    setAsking(true);
    setAnswer('');
    try {
      setAnswer(await onAsk(q.trim()));
    } catch {
      setAnswer('Could not reach the AI — check your Gemini key.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-fuchsia-300 mb-2">
        ✨ AI Briefing
      </p>
      {briefingLoading ? (
        <p className="text-[13px] text-slate-400 animate-agent-thinking leading-relaxed">
          Reading the headlines, sizing up the place…
        </p>
      ) : briefing ? (
        <p className="text-[13px] text-slate-200 leading-relaxed">{briefing}</p>
      ) : (
        <p className="text-[13px] text-slate-600">Zoom somewhere — the AI briefs you on what's happening there.</p>
      )}

      <div className="flex gap-2 mt-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask()}
          placeholder="Ask about this place…"
          className="flex-1 bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-fuchsia-500/60 placeholder:text-slate-600"
        />
        <button
          onClick={ask}
          disabled={asking || !q.trim()}
          className="px-3 py-2 rounded-lg bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-300 text-xs font-bold hover:bg-fuchsia-500/25 disabled:opacity-40 transition"
        >
          {asking ? '…' : 'Ask'}
        </button>
      </div>
      {answer && (
        <p className="text-[13px] text-slate-300 leading-relaxed mt-3 pt-3 border-t border-ink-800">{answer}</p>
      )}
    </div>
  );
}
