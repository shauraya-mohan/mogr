"use client";

import Button from "@/components/Button";
import { SCAN_GUIDE } from "@/lib/scan/content";

interface ScanGuideProps {
  onContinue: () => void;
}

export default function ScanGuide({ onContinue }: ScanGuideProps) {
  return (
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
  );
}
