// ─── TerraPulse side panel: News / Jobs / Hotels tabs + filters ───────
import { useState } from 'react';
import type { NewsItem, HotelItem, Resume, ScoredJob } from '../types';

type Tab = 'news' | 'jobs' | 'hotels';

interface Props {
  news: NewsItem[]; jobs: ScoredJob[]; hotels: HotelItem[];
  loading: Record<Tab, boolean>;
  error: string;
  newsTopic: string; setNewsTopic: (s: string) => void;
  jobQuery: string; setJobQuery: (s: string) => void;
  onSearch: () => void;
  resume: Resume | null;
  uploading: boolean;
  onResumeUpload: (f: File) => void;
  onResumeClear: () => void;
  locating: number | null;
  onLocateJob: (job: ScoredJob, index: number) => void;
}

function FilterBar({ value, onChange, onSearch, placeholder }: {
  value: string; onChange: (s: string) => void; onSearch: () => void; placeholder: string;
}) {
  return (
    <div className="flex gap-2 mb-3">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        placeholder={placeholder}
        className="flex-1 bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500/60 placeholder:text-slate-600"
      />
      <button
        onClick={onSearch}
        className="px-3 py-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500/25 transition"
      >
        Go
      </button>
    </div>
  );
}

export default function SidePanel(p: Props) {
  const [tab, setTab] = useState<Tab>('news');
  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'news', label: '📰 News', count: p.news.length },
    { id: 'jobs', label: '💼 Jobs', count: p.jobs.length },
    { id: 'hotels', label: '🏨 Hotels', count: p.hotels.length },
  ];

  return (
    <div className="glass rounded-2xl flex flex-col h-full overflow-hidden">
      <div className="flex gap-1 p-2 border-b border-ink-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold transition ${
              tab === t.id ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label} <span className="opacity-70">{t.count > 0 ? `· ${t.count}` : ''}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {p.error && <p className="text-xs text-red-400 mb-2">{p.error}</p>}

        {tab === 'news' && (
          <>
            <FilterBar value={p.newsTopic} onChange={p.setNewsTopic} onSearch={p.onSearch} placeholder="Filter news: e.g. elections, AI, cricket…" />
            {p.loading.news && <p className="text-xs text-cyan-400 animate-agent-thinking">Scanning live headlines…</p>}
            <div className="space-y-2">
              {p.news.map((n, i) => (
                <a key={i} href={n.link} target="_blank" rel="noreferrer"
                   className="block bg-ink-800/60 hover:bg-ink-800 rounded-xl p-3 transition border border-transparent hover:border-cyan-500/20">
                  <p className="text-[13px] font-semibold leading-snug">{n.title}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{n.source}{n.date ? ` · ${n.date}` : ''}</p>
                  {n.snippet && <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{n.snippet}</p>}
                </a>
              ))}
              {!p.loading.news && p.news.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-8">No headlines here yet — zoom or search somewhere else.</p>
              )}
            </div>
          </>
        )}

        {tab === 'jobs' && (
          <>
            {!p.resume ? (
              <label className="block mb-3 rounded-xl border border-dashed border-cyan-500/40 bg-cyan-500/5 p-4 text-center cursor-pointer hover:bg-cyan-500/10 transition">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  disabled={p.uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) p.onResumeUpload(f);
                    e.target.value = '';
                  }}
                />
                <p className="text-[13px] font-bold text-cyan-300">
                  {p.uploading ? 'Reading resume…' : '📄 Upload your resume'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Jobs here get ranked by how well they fit <i>you</i> — match scores, skill gaps, the works.
                </p>
              </label>
            ) : (
              <div className="flex items-center justify-between mb-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-3 py-2">
                <p className="text-[11px] text-emerald-300 font-semibold truncate">
                  📄 {p.resume.name ?? p.resume.filename} · {p.resume.skills.length} skills
                </p>
                <button onClick={p.onResumeClear} className="text-[11px] text-slate-500 hover:text-slate-300 ml-2">
                  ✕
                </button>
              </div>
            )}
            <FilterBar value={p.jobQuery} onChange={p.setJobQuery} onSearch={p.onSearch} placeholder="Filter roles: e.g. designer, data analyst…" />
            {p.loading.jobs && <p className="text-xs text-cyan-400 animate-agent-thinking">Hunting live listings…</p>}
            <div className="space-y-2">
              {p.jobs.map((j, i) => (
                <div key={i} className="bg-ink-800/60 rounded-xl p-3 border border-transparent hover:border-cyan-500/20 transition">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-semibold leading-snug">{j.title}</p>
                    {p.resume && (
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-full whitespace-nowrap ${
                        j.matchScore >= 75 ? 'bg-emerald-500/20 text-emerald-300'
                        : j.matchScore >= 50 ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {j.matchScore}%
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{j.company}{j.location ? ` · ${j.location}` : ''}{j.via ? ` · via ${j.via}` : ''}</p>
                  {p.resume && j.matchedSkills.length > 0 && (
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      <span className="text-emerald-400/90">✓ {j.matchedSkills.slice(0, 4).join(', ')}</span>
                      {j.missingSkills.length > 0 && (
                        <span className="text-slate-500"> · missing: {j.missingSkills.slice(0, 3).join(', ')}</span>
                      )}
                    </p>
                  )}
                  {j.applyUrl && (
                    <a href={j.applyUrl} target="_blank" rel="noreferrer"
                       className="inline-block mt-2 text-[11px] font-bold text-cyan-300 hover:text-cyan-200">
                      Apply ↗
                    </a>
                  )}
                  {!/remote/i.test(j.location ?? '') && (
                    <button
                      onClick={() => p.onLocateJob(j, i)}
                      disabled={p.locating !== null}
                      className="inline-block mt-2 ml-3 text-[11px] font-bold text-amber-300 hover:text-amber-200 disabled:opacity-50"
                      title="Fly the globe to this company's office"
                    >
                      {p.locating === i ? 'Locating…' : '📍 Show on map'}
                    </button>
                  )}
                </div>
              ))}
              {!p.loading.jobs && p.jobs.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-8">No listings found — try a role keyword above.</p>
              )}
            </div>
          </>
        )}

        {tab === 'hotels' && (
          <>
            {p.loading.hotels && <p className="text-xs text-cyan-400 animate-agent-thinking">Checking live prices…</p>}
            <div className="space-y-2">
              {p.hotels.map((h, i) => (
                <div key={i} className="bg-ink-800/60 rounded-xl p-3 border border-transparent hover:border-cyan-500/20 transition">
                  {h.thumbnail && <img src={h.thumbnail} alt="" className="w-full h-24 object-cover rounded-lg mb-2" loading="lazy" />}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-semibold leading-snug">{h.name}</p>
                    {h.price && <p className="text-[13px] font-bold text-emerald-300 whitespace-nowrap">{h.price}</p>}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {h.rating ? `★ ${h.rating}` : ''}{h.reviews ? ` (${h.reviews})` : ''}
                    {h.amenities?.length ? ` · ${h.amenities.slice(0, 3).join(', ')}` : ''}
                  </p>
                  {h.link && (
                    <a href={h.link} target="_blank" rel="noreferrer"
                       className="inline-block mt-2 text-[11px] font-bold text-cyan-300 hover:text-cyan-200">
                      View deal ↗
                    </a>
                  )}
                </div>
              ))}
              {!p.loading.hotels && p.hotels.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-8">Zoom into a city to see hotels with live prices.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
