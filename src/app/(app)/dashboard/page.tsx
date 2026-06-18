"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/Button";
import { clearSelfie, getSelfie } from "@/lib/scan/storage";
import { DASHBOARD } from "@/lib/scan/content";

export default function DashboardPage() {
  const router = useRouter();
  const [selfie, setSelfie] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const stored = getSelfie();
    if (!stored) {
      router.replace("/scan");
      return;
    }
    setSelfie(stored);
    setChecked(true);
  }, [router]);

  function handleRetake() {
    clearSelfie();
    router.push("/scan");
  }

  if (!checked) {
    return (
      <p className="font-mono text-[13px] text-stone">Loading…</p>
    );
  }

  return (
    <div className="max-w-[560px]">
      <p className="eyebrow mb-4">{DASHBOARD.eyebrow}</p>
      <h1 className="font-display font-bold text-[clamp(32px,6vw,48px)] tracking-[-0.04em] leading-[0.95] mb-4">
        {DASHBOARD.title}
      </h1>
      <p className="text-graphite text-[clamp(16px,2vw,18px)] leading-relaxed max-w-[46ch] mb-8">
        {DASHBOARD.body}
      </p>

      {selfie && (
        <div className="overflow-hidden rounded-[18px] border border-[var(--ink-08)] bg-cloud mb-8 max-w-[280px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selfie}
            alt="Your scan"
            className="w-full aspect-[3/4] object-cover"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={handleRetake} size="lg">
          {DASHBOARD.retake}
        </Button>
        <Link
          href="/"
          className="font-mono text-[13px] text-graphite transition-colors duration-[400ms] hover:text-bronze"
        >
          {DASHBOARD.home}
        </Link>
      </div>
    </div>
  );
}
