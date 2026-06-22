"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import SkinCapture from "@/components/skin/SkinCapture";
import { uploadSkinScan } from "@/lib/skin/upload";
import { createClient } from "@/lib/supabase/client";
import {
  SKIN_QUESTIONS,
  SKIN_COPY,
  type SkinQuestionnaire,
  type SkinRead,
  type SkinRoutine,
  type Severity,
} from "@/lib/skin/content";

type Mode = "loading" | "capture" | "questionnaire" | "analyzing" | "results";

const REGION_LABELS: Record<string, string> = {
  forehead: "Forehead",
  nose: "Nose",
  cheeks: "Cheeks",
  chin: "Chin",
  under_eyes: "Under-eyes",
  t_zone: "T-zone",
  u_zone: "Cheeks & jaw",
};

const SEV_TONE: Record<Severity, string> = {
  none: "text-stone",
  mild: "text-graphite",
  moderate: "text-bronze",
  strong: "text-bronze",
  unclear: "text-stone",
};

export default function SkinPage() {
  const [mode, setMode] = useState<Mode>("loading");
  const [scanId, setScanId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<SkinQuestionnaire>({});
  const [read, setRead] = useState<SkinRead | null>(null);
  const [routine, setRoutine] = useState<SkinRoutine | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load an existing read if present, else start a fresh scan.
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("skin_profiles")
        .select("data")
        .eq("user_id", user.id)
        .maybeSingle();
      const d = data?.data as { read?: SkinRead; routine?: SkinRoutine } | null;
      if (d?.read && d?.routine) {
        setRead(d.read);
        setRoutine(d.routine);
        setMode("results");
      } else {
        setMode("capture");
      }
    })();
  }, []);

  async function handleCaptured(dataUrl: string) {
    setError(null);
    try {
      const id = await uploadSkinScan(dataUrl);
      setScanId(id);
      setMode("questionnaire");
    } catch {
      setError("Couldn't save the scan — try again.");
      setMode("capture");
    }
  }

  async function analyze() {
    if (!scanId) return;
    setMode("analyzing");
    setError(null);
    try {
      const res = await fetch("/api/skin/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId, questionnaire: answers }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === "unusable-image") {
          setError("That photo wasn't clear enough — let's retake it.");
          setMode("capture");
        } else {
          setError("Analysis failed — try again.");
          setMode("questionnaire");
        }
        return;
      }
      setRead(json.read);
      setRoutine(json.routine);
      setMode("results");
    } catch {
      setError("Analysis failed — try again.");
      setMode("questionnaire");
    }
  }

  function rescan() {
    setRead(null);
    setRoutine(null);
    setScanId(null);
    setAnswers({});
    setMode("capture");
  }

  const allAnswered = SKIN_QUESTIONS.every((q) => answers[q.id]);

  if (mode === "loading") {
    return <p className="font-mono text-[13px] text-stone">Loading…</p>;
  }

  if (mode === "capture") {
    return (
      <>
        {error && <p className="mb-4 text-[14px] text-bronze">{error}</p>}
        <SkinCapture onCapture={handleCaptured} onError={(m) => setError(m)} />
      </>
    );
  }

  if (mode === "questionnaire" || mode === "analyzing") {
    const busy = mode === "analyzing";
    return (
      <div className="max-w-[640px]">
        <p className="eyebrow mb-4">{SKIN_COPY.qEyebrow}</p>
        <h1 className="font-display text-[clamp(30px,5vw,44px)] font-bold leading-[0.95] tracking-[-0.04em] mb-3">
          {SKIN_COPY.qTitle}
        </h1>
        <p className="text-graphite text-[clamp(15px,1.8vw,17px)] leading-relaxed max-w-[44ch] mb-8">
          {SKIN_COPY.qBody}
        </p>

        <div className="grid gap-6">
          {SKIN_QUESTIONS.map((q) => (
            <div key={q.id}>
              <p className="mb-3 font-mono text-[12px] uppercase tracking-[0.14em] text-stone">
                {q.label}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {q.options.map((o) => {
                  const active = answers[q.id] === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      disabled={busy}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.value }))}
                      className={`rounded-full border px-4 py-2 text-[14px] transition-colors ${
                        active
                          ? "border-ink bg-ink text-bone"
                          : "border-[var(--ink-12)] text-graphite hover:border-bronze hover:text-ink"
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="mt-6 text-[14px] text-bronze">{error}</p>}

        <div className="mt-8">
          <Button onClick={analyze} size="lg" disabled={!allAnswered || busy}>
            {busy ? SKIN_COPY.analyzing : SKIN_COPY.analyze}
          </Button>
        </div>
      </div>
    );
  }

  // ── results ──
  const visibleConcerns = (read?.concerns ?? []).filter(
    (c) => c.visible && c.severity !== "none" && c.severity !== "unclear",
  );

  return (
    <>
      <header className="mb-[clamp(20px,3vh,32px)] flex items-start justify-between gap-6">
        <div>
          <p className="eyebrow mb-3">{SKIN_COPY.resultsEyebrow}</p>
          <h1 className="font-display text-[clamp(30px,4.5vw,46px)] font-bold leading-[0.95] tracking-[-0.04em]">
            {SKIN_COPY.resultsTitle}
          </h1>
        </div>
        {read?.skinType?.value && (
          <div className="hidden text-right sm:block">
            <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-stone">
              {SKIN_COPY.skinTypeLabel}
            </p>
            <p className="font-display text-[18px] capitalize tracking-[-0.02em] text-ink">
              {read.skinType.value}
            </p>
          </div>
        )}
      </header>

      {routine?.summary && (
        <p className="mb-8 max-w-[64ch] text-[clamp(16px,1.8vw,19px)] leading-relaxed text-ink">
          {routine.summary}
        </p>
      )}

      <div className="grid gap-[clamp(16px,2.5vw,24px)] lg:grid-cols-2">
        {/* What we noticed */}
        <section className="rounded-[20px] border border-[var(--ink-08)] bg-cloud p-[clamp(20px,2.6vw,30px)]">
          <p className="eyebrow mb-5">{SKIN_COPY.concernsLabel}</p>
          {visibleConcerns.length ? (
            <ul className="divide-y divide-[var(--ink-08)]">
              {visibleConcerns.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-[15px] text-ink">{c.label}</p>
                    {c.regions.length > 0 && (
                      <p className="mt-0.5 font-mono text-[11px] tracking-[0.04em] text-stone">
                        {c.regions.map((r) => REGION_LABELS[r] ?? r).join(" · ")}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] ${SEV_TONE[c.severity]}`}
                  >
                    {c.severity}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[15px] leading-relaxed text-graphite">
              Nothing notable stood out — your skin&apos;s in good shape. Keep the routine consistent.
            </p>
          )}

          {read?.zoneSummary && (read.zoneSummary.t_zone || read.zoneSummary.u_zone) && (
            <div className="mt-6 border-t border-[var(--ink-08)] pt-5">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-stone">
                {SKIN_COPY.zonesLabel}
              </p>
              {read.zoneSummary.t_zone && (
                <p className="text-[14px] leading-relaxed text-graphite">
                  <span className="font-medium text-ink">T-zone.</span> {read.zoneSummary.t_zone}
                </p>
              )}
              {read.zoneSummary.u_zone && (
                <p className="mt-1.5 text-[14px] leading-relaxed text-graphite">
                  <span className="font-medium text-ink">Cheeks & jaw.</span> {read.zoneSummary.u_zone}
                </p>
              )}
            </div>
          )}
        </section>

        {/* Routine */}
        <section className="rounded-[20px] border border-[var(--ink-08)] bg-cloud p-[clamp(20px,2.6vw,30px)]">
          <p className="eyebrow mb-5">{SKIN_COPY.routineTitle}</p>
          <div className="grid gap-6 sm:grid-cols-2">
            <RoutineCol title={SKIN_COPY.am} steps={routine?.am ?? []} />
            <RoutineCol title={SKIN_COPY.pm} steps={routine?.pm ?? []} />
          </div>
          {routine?.habits && routine.habits.length > 0 && (
            <div className="mt-6 border-t border-[var(--ink-08)] pt-5">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-stone">
                {SKIN_COPY.habitsLabel}
              </p>
              <ul className="space-y-2">
                {routine.habits.map((h, i) => (
                  <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed text-graphite">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-bronze" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-5">
        <Button onClick={rescan} size="lg">
          {SKIN_COPY.rescan}
        </Button>
        <Link
          href="/dashboard"
          className="font-mono text-[13px] uppercase tracking-[0.12em] text-graphite transition-colors hover:text-bronze"
        >
          back to dashboard
        </Link>
      </div>

      <p className="mt-6 font-mono text-[11px] tracking-[0.04em] text-stone">
        {SKIN_COPY.disclaimer}
      </p>
    </>
  );
}

function RoutineCol({
  title,
  steps,
}: {
  title: string;
  steps: { step: string; detail: string }[];
}) {
  return (
    <div>
      <p className="mb-3 font-display text-[16px] font-bold tracking-[-0.02em] text-ink">{title}</p>
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink font-mono text-[11px] text-bone">
              {i + 1}
            </span>
            <div>
              <p className="text-[14px] font-medium text-ink">{s.step}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-graphite">{s.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
