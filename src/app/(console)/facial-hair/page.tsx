/**
 * FACIAL-HAIR AGENT OWNS THIS FILE — placeholder.
 * Build the facial-hair feature here (see FEATURE_BUILD_GUIDE.md). It mirrors
 * the hair feature: scan → questionnaire → vision read → face-preserving beard
 * previews (gpt-image-2 edit) → save to looks. Clone the hair files and swap
 * "hair" for "facial hair" in the prompts/copy.
 */
import Link from "next/link";

export default function FacialHairPage() {
  return (
    <div className="max-w-[520px]">
      <p className="eyebrow mb-4">facial hair</p>
      <h1 className="font-display text-[clamp(32px,5vw,48px)] font-bold leading-[0.95] tracking-[-0.04em] mb-4">
        Coming soon<span className="dot">.</span>
      </h1>
      <p className="text-graphite text-[clamp(16px,2vw,18px)] leading-relaxed max-w-[42ch] mb-8">
        Beard and stubble styles matched to your growth and jawline — previewed
        on your own face — are being built.
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
