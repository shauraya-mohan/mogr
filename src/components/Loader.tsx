/**
 * The brand loader: animated comb-tooth bars (see globals.css .comb-loader).
 * Server-safe (pure markup + CSS) so it works as a Suspense fallback too.
 */
export default function Loader({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="comb-loader" aria-hidden>
        <span />
        <span />
        <span />
        <span />
        <span />
      </span>
      {label && (
        <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-stone">
          {label}
        </span>
      )}
    </span>
  );
}
