"use client";

import Button from "@/components/Button";
import { SCAN_REVIEW } from "@/lib/scan/content";

interface ScanReviewProps {
  imageSrc: string;
  onConfirm: () => void;
  onRetake: () => void;
  saving?: boolean;
}

export default function ScanReview({
  imageSrc,
  onConfirm,
  onRetake,
  saving = false,
}: ScanReviewProps) {
  return (
    <div className="max-w-[560px]">
      <p className="eyebrow mb-4">{SCAN_REVIEW.eyebrow}</p>
      <h1 className="font-display font-bold text-[clamp(32px,6vw,48px)] tracking-[-0.04em] leading-[0.95] mb-6">
        {SCAN_REVIEW.title}
      </h1>

      <div className="overflow-hidden rounded-[18px] border border-[var(--ink-08)] bg-cloud">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt="Your scan preview"
          className="w-full aspect-[3/4] object-cover"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button onClick={onConfirm} size="lg" disabled={saving}>
          {saving ? "…" : SCAN_REVIEW.confirm}
        </Button>
        <button
          type="button"
          onClick={onRetake}
          disabled={saving}
          className="font-mono text-[13px] text-graphite transition-colors duration-[400ms] hover:text-bronze disabled:opacity-50"
        >
          {SCAN_REVIEW.retake}
        </button>
      </div>
    </div>
  );
}
