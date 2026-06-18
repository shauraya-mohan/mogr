"use client";

import Button from "@/components/Button";
import { SCAN_GUIDE } from "@/lib/scan/content";

interface ScanGuideProps {
  onContinue: () => void;
}

const PREVIEW_SRC = "/assets/replicate-prediction-ezkef9jschrmy0cyv9k85drd5c.mp4";

export default function ScanGuide({ onContinue }: ScanGuideProps) {
  return (
    <div className="grid items-start gap-[clamp(32px,5vw,72px)] lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
      {/* ── Left: the guidance ── */}
      <div className="max-w-[560px]">
        <p className="eyebrow mb-4">{SCAN_GUIDE.eyebrow}</p>
        <h1 className="font-display font-bold text-[clamp(32px,6vw,48px)] tracking-[-0.04em] leading-[0.95] mb-4">
          {SCAN_GUIDE.title}
        </h1>
        <p className="text-graphite text-[clamp(16px,2vw,18px)] leading-relaxed max-w-[46ch] mb-8">
          {SCAN_GUIDE.body}
        </p>

        <ul className="grid gap-4 mb-8">
          {SCAN_GUIDE.tips.map((tip) => (
            <li
              key={tip.label}
              className="bg-cloud border border-[var(--ink-08)] rounded-[18px] p-5 flex gap-4"
            >
              <span className="font-mono text-[12px] tracking-[0.14em] uppercase text-stone shrink-0 pt-0.5">
                {tip.label}
              </span>
              <p className="text-graphite text-[15px] leading-relaxed">{tip.text}</p>
            </li>
          ))}
        </ul>

        <p className="font-mono text-[12px] tracking-[0.06em] text-stone mb-8 max-w-[46ch]">
          {SCAN_GUIDE.privacy}
        </p>

        <Button onClick={onContinue} size="lg">
          {SCAN_GUIDE.continue}
        </Button>
      </div>

      {/* ── Right: looping preview (fills the wide-screen space) ── */}
      <aside className="hidden lg:block sticky top-[calc(var(--header-h)+32px)]">
        <figure className="relative overflow-hidden rounded-[18px] border border-[var(--ink-08)] bg-cloud aspect-[4/5]">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
          >
            <source src={PREVIEW_SRC} type="video/mp4" />
          </video>

          {/* ambient scan line — ties the preview to the scan theme */}
          <div className="scan-sweep opacity-50">
            <div className="scan-sweep__line opacity-70" />
            <div className="scan-sweep__glow" />
          </div>

          {/* subtle top + bottom scrims so the labels stay legible over any frame */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/55 to-transparent" />

          {/* HUD label (fixed light colors — sits over media, theme-independent) */}
          <span className="absolute left-5 top-5 flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-[#F4F2EC]/75">
            <span className="h-1.5 w-1.5 rounded-full bg-bronze" />
            preview
          </span>

          {/* bottom caption */}
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-5 pb-5 pt-16">
            <p className="font-display font-bold text-[22px] leading-none tracking-[-0.03em] text-[#F4F2EC]">
              The upgraded you<span className="dot">.</span>
            </p>
            <p className="mt-2 font-mono text-[10px] tracking-[0.18em] uppercase text-[#F4F2EC]/55">
              ai preview · for illustration
            </p>
          </figcaption>
        </figure>
      </aside>
    </div>
  );
}
