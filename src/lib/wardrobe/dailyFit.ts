/** Today's fit combo — picks one saved look per day to feature on the
 *  dashboard. Deterministic per seed (the date) so it's stable all day and
 *  changes tomorrow, without needing any server-side state. */
export function pickForSeed<T>(items: T[], seed: string): T | null {
  if (items.length === 0) return null;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return items[hash % items.length];
}

/** First sentence of a styling rationale, trimmed to fit a one-line dashboard
 *  note instead of the full multi-sentence explanation shown in the preview. */
export function firstSentence(text: string | undefined, max = 90): string {
  const t = (text ?? "").trim();
  if (!t) return "";
  const end = t.search(/[.!?](\s|$)/);
  const sentence = end === -1 ? t : t.slice(0, end + 1);
  if (sentence.length <= max) return sentence;
  let cut = sentence.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  if (sp > 24) cut = cut.slice(0, sp);
  return cut.replace(/[\s,.;:–—-]+$/, "") + "…";
}
