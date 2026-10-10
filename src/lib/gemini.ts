// ─── Gemini: AI briefing + ask-about-this-place ─────────────────────────
async function callGemini(key: string, prompt: string, maxTokens = 600): Promise<string> {
  const r = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, prompt, model: 'gemini-3.5-flash-lite', maxTokens }),
  });
  if (!r.ok) throw new Error(`Gemini ${r.status}`);
  const d = await r.json();
  const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('empty response');
  return text.trim();
}

/** 3-sentence "what's happening here" brief from live headlines. */
export async function briefPlace(
  key: string,
  placeLabel: string,
  headlines: string[],
  jobTitles: string[],
): Promise<string> {
  const prompt =
    `You are TerraPulse, a location-intelligence briefing voice. ` +
    `Place: ${placeLabel}.\n` +
    `Live headlines:\n${headlines.slice(0, 8).map((h, i) => `${i + 1}. ${h}`).join('\n')}\n` +
    `Open roles nearby:\n${jobTitles.slice(0, 6).join('; ') || '(none fetched)'}\n\n` +
    `Write a tight 3-sentence briefing: sentence 1 = the single most important thing happening here right now; ` +
    `sentence 2 = one more notable development; sentence 3 = the work/opportunity vibe in one clause. ` +
    `No preamble, no bullet points, plain sentences. If headlines are thin, say what's knowable and stay honest.`;
  return callGemini(key, prompt, 400);
}

/** Free-form Q&A grounded in the fetched context for the place. */
export async function askAboutPlace(
  key: string,
  placeLabel: string,
  question: string,
  context: { headlines: string[]; jobs: string[]; hotels: string[] },
): Promise<string> {
  const prompt =
    `You are TerraPulse, answering about ${placeLabel}. Use ONLY the context below; ` +
    `if the answer isn't in it, say so briefly and suggest what to zoom into.\n\n` +
    `Headlines:\n${context.headlines.slice(0, 10).join('\n') || '(none)'}\n\n` +
    `Jobs:\n${context.jobs.slice(0, 8).join('\n') || '(none)'}\n\n` +
    `Hotels:\n${context.hotels.slice(0, 8).join('\n') || '(none)'}\n\n` +
    `Question: ${question}\n\nAnswer in 2-4 sentences, conversational.`;
  return callGemini(key, prompt, 500);
}
