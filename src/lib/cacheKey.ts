/**
 * Order-insensitive canonical JSON. The same logical input always produces the
 * same string, so server routes can compare a new request to what produced the
 * stored result and reuse it instead of re-calling a (non-deterministic) model.
 * Object keys are sorted; arrays are sorted by content (e.g. multi-select
 * "concerns" don't depend on click order).
 */
export function canonical(value: unknown): string {
  return JSON.stringify(normalize(value));
}

function normalize(v: unknown): unknown {
  if (Array.isArray(v)) {
    return v
      .map(normalize)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>).sort()) {
      out[k] = normalize((v as Record<string, unknown>)[k]);
    }
    return out;
  }
  return v;
}
