/**
 * SKIN AGENT OWNS THIS FILE — placeholder.
 * Build the skin feature here (see FEATURE_BUILD_GUIDE.md). Per PRD §5.1 skin
 * is routine-only: scan → questionnaire → AM/PM routine + coaching. NO image
 * generation. Model the flow on the hair feature, minus previews.
 */
import Link from "next/link";

export default function SkinPage() {
  return (
    <div className="max-w-[520px]">
      <p className="eyebrow mb-4">skin</p>
      <h1 className="font-display text-[clamp(32px,5vw,48px)] font-bold leading-[0.95] tracking-[-0.04em] mb-4">
        Coming soon<span className="dot">.</span>
      </h1>
      <p className="text-graphite text-[clamp(16px,2vw,18px)] leading-relaxed max-w-[42ch] mb-8">
        The skin read — an honest assessment and a routine built around your
        skin — is being built.
      </p>
      <Link
        href="/dashboard"
        className="font-mono text-[13px] uppercase tracking-[0.12em] text-bronze transition-colors hover:text-ink"
      >
        ← back to dashboard
      </Link>
    </div>
  );
}
