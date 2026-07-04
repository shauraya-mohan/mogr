"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/Button";
import Loader from "@/components/Loader";
import SkinCapture from "@/components/skin/SkinCapture";
import { useRoutine } from "@/lib/routine/useRoutine";
import { findStep, shortenLabel, shortenDetail } from "@/lib/routine/content";
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

type Mode = "loading" | "capture" | "review" | "questionnaire" | "analyzing" | "results";

const REGION_LABELS: Record<string, string> = {
  forehead: "forehead",
  nose: "nose",
  cheeks: "cheeks",
  chin: "chin",
  under_eyes: "under eyes",
  t_zone: "T-zone",
  u_zone: "cheeks & jaw",
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

export default function SkinPage() {
  const searchParams = useSearchParams();
  const forceNew = searchParams.get("new") === "1";

  const [mode, setMode] = useState<Mode>("loading");
  const [scanId, setScanId] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [answers, setAnswers] = useState<SkinQuestionnaire>({});
  const [read, setRead] = useState<SkinRead | null>(null);
  const [routine, setRoutine] = useState<SkinRoutine | null>(null);
  const [scanUrl, setScanUrl] = useState<string | null>(null);
  const [scanDate, setScanDate] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const routineCtl = useRoutine();

  // Sign the skin scan image + read its date (for the results view).
  async function loadScanMeta(sid: string) {
    const supabase = createClient();
    const { data: scan } = await supabase
      .from("scans")
      .select("storage_path, created_at")
      .eq("id", sid)
      .maybeSingle();
    if (!scan) return;
    setScanDate(fmtDate(scan.created_at));
    const { data: signed } = await supabase.storage
      .from("user-media")
      .createSignedUrl(scan.storage_path, 3600);
    if (signed?.signedUrl) setScanUrl(signed.signedUrl);
  }

  // Load an existing read if present, else start a fresh scan.
  // If ?new=1 is in the URL, skip straight to capture.
  useEffect(() => {
    if (forceNew) {
      setMode("capture");
      return;
    }
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("skin_profiles")
        .select("data, scan_id, questionnaire")
        .eq("user_id", user.id)
        .maybeSingle();
      const d = data?.data as { read?: SkinRead; routine?: SkinRoutine } | null;
      if (d?.read && d?.routine) {
        setRead(d.read);
        setRoutine(d.routine);
        if (data?.questionnaire) setAnswers(data.questionnaire as SkinQuestionnaire);
        if (data?.scan_id) {
          setScanId(data.scan_id);
          loadScanMeta(data.scan_id);
        }
        setMode("results");
      } else {
        setMode("capture");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceNew]);

  function handleCaptured(dataUrl: string) {
    setCapturedPreview(dataUrl);
    setError(null);
    setMode("review");
  }

  function handleRetake() {
    setCapturedPreview(null);
    setMode("capture");
  }

  async function handleConfirmScan() {
    if (!capturedPreview) return;
    setSaving(true);
    setError(null);
    try {
      const id = await uploadSkinScan(capturedPreview);
      setScanId(id);
      setSaving(false);
      setMode("questionnaire");
    } catch {
      setError("Couldn't save the scan. Try again.");
      setSaving(false);
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
          setError("That photo wasn't clear enough. Let's retake it.");
          setMode("capture");
        } else {
          setError("Analysis failed. Try again.");
          setMode("questionnaire");
        }
        return;
      }
      setRead(json.read);
      setRoutine(json.routine);
      setAdded(false);
      loadScanMeta(scanId);
      setMode("results");
    } catch {
      setError("Analysis failed. Try again.");
      setMode("questionnaire");
    }
  }

  // Add the whole read routine (every AM + PM step) to the routine page in one
  // tap; the per-step pinning/editing then happens there. Dedupes against what's
  // already added so re-tapping is a no-op.
  function addAllToRoutine() {
    if (!routine) return;
    const items = [
      ...routine.am.map((s) => ({ source: "skin" as const, label: shortenLabel(s.step), timeOfDay: "am" as const, note: shortenDetail(s.detail) })),
      ...routine.pm.map((s) => ({ source: "skin" as const, label: shortenLabel(s.step), timeOfDay: "pm" as const, note: shortenDetail(s.detail) })),
    ].filter((it) => !findStep(routineCtl.steps, it.source, it.label, it.timeOfDay));
    if (items.length) routineCtl.addMany(items);
    setAdded(true);
  }

  function rescan() {
    setRead(null);
    setRoutine(null);
    setScanId(null);
    setScanUrl(null);
    setScanDate(null);
    setAnswers({});
    setAdded(false);
    setMode("capture");
  }

  const allAnswered = SKIN_QUESTIONS.every((q) => answers[q.id]);

  if (mode === "loading") {
    return <Loader label="loading" />;
  }

  // ── capture ──
  if (mode === "capture") {
    return (
      <>
        {error && <p className="mb-4 text-[14px] text-bronze">{error}</p>}
        <SkinCapture onCapture={handleCaptured} onError={(m) => setError(m)} />
      </>
    );
  }

  // ── review (scan confirmation — preview / retake / use this photo) ──
  if (mode === "review" && capturedPreview) {
    return (
      <div className="max-w-[560px]">
        <p className="eyebrow mb-4">skin · review</p>
        <h1 className="font-display text-[clamp(32px,6vw,48px)] font-bold leading-[0.95] tracking-[-0.04em] mb-6">
          Look good?
        </h1>

        <div className="overflow-hidden rounded-[18px] border border-[var(--ink-08)] bg-cloud">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={capturedPreview}
            alt="Your skin scan preview"
            className="w-full aspect-[3/4] object-cover"
          />
        </div>

        {error && <p className="mt-4 text-[14px] text-bronze">{error}</p>}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button onClick={handleConfirmScan} size="lg" disabled={saving}>
            {saving ? "Saving…" : "Use this photo"}
          </Button>
          <button
            type="button"
            onClick={handleRetake}
            disabled={saving}
            className="font-mono text-[13px] text-graphite transition-colors duration-[400ms] hover:text-bronze disabled:opacity-50"
          >
            {SKIN_COPY.retake}
          </button>
        </div>
      </div>
    );
  }

  // ── questionnaire (unchanged) ──
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
                      className={`rounded-full border px-4 py-2 text-[14px] transition-colors ${active
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

        <div className="mt-8 flex items-center gap-5">
          <Button onClick={analyze} size="lg" disabled={!allAnswered || busy}>
            {busy ? SKIN_COPY.analyzing : read ? "Update my read" : SKIN_COPY.analyze}
          </Button>
          {read && !busy && (
            <button
              type="button"
              onClick={() => setMode("results")}
              className="font-mono text-[13px] uppercase tracking-[0.12em] text-graphite transition-colors hover:text-bronze"
            >
              cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── results (redesigned) ──
  const visibleConcerns = (read?.concerns ?? []).filter(
    (c) => c.visible && c.severity !== "none" && c.severity !== "unclear",
  );
  const zT = read?.zoneSummary?.t_zone;
  const zU = read?.zoneSummary?.u_zone;

  return (
    <>
      <Link
        href="/dashboard"
        className="group mb-5 inline-flex items-center gap-2.5 rounded-full border border-[var(--ink-12)] bg-cloud py-2 pl-2 pr-4 font-mono text-[12px] uppercase tracking-[0.12em] text-graphite transition-colors hover:border-bronze hover:text-ink"
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-bone transition-transform group-hover:-translate-x-0.5">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </span>
        Dashboard
      </Link>

      <header className="mb-[clamp(18px,3vh,28px)] flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-3">{SKIN_COPY.resultsEyebrow}</p>
          <h1 className="font-display text-[clamp(30px,4.5vw,46px)] font-bold leading-[0.95] tracking-[-0.04em]">
            Your skin today<span className="dot">.</span>
          </h1>
        </div>
        {scanDate && (
          <p className="shrink-0 font-mono text-[12px] tracking-[0.04em] text-stone">
            scanned {scanDate}
          </p>
        )}
      </header>

      {/* Scan + skin type */}
      <div className="grid items-stretch gap-[clamp(16px,2.5vw,24px)] lg:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-[#2C2B27]">
          {scanUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={scanUrl} alt="Your scan" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <span className="absolute left-1/2 top-[25%] -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-[#F4F2EC] backdrop-blur-sm">
            T-zone
          </span>
          <span className="absolute left-1/2 top-[62%] -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-[#F4F2EC] backdrop-blur-sm">
            U-zone
          </span>
          <span className="absolute bottom-4 left-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#F4F2EC]/85 [text-shadow:0_1px_10px_rgba(0,0,0,0.6)]">
            <span className="h-1.5 w-1.5 rounded-full bg-bronze" />
            your scan
          </span>
        </div>

        <div className="rounded-[20px] border border-[var(--ink-08)] bg-cloud p-[clamp(22px,2.8vw,34px)]">
          <p className="mb-2 font-mono text-[12px] uppercase tracking-[0.14em] text-stone">
            {SKIN_COPY.skinTypeLabel}
          </p>
          <h2 className="mb-6 font-display text-[clamp(28px,3.4vw,40px)] font-bold capitalize tracking-[-0.03em] text-ink">
            {read?.skinType?.value ?? "–"}
          </h2>
          <div className="border-t border-[var(--ink-08)]">
            {zT && (
              <div className="flex gap-5 border-b border-[var(--ink-08)] py-4">
                <span className="w-[58px] shrink-0 pt-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-stone">
                  T-zone
                </span>
                <p className="text-[15px] leading-relaxed text-ink">{zT}</p>
              </div>
            )}
            {zU && (
              <div className="flex gap-5 py-4">
                <span className="w-[58px] shrink-0 pt-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-stone">
                  U-zone
                </span>
                <p className="text-[15px] leading-relaxed text-ink">{zU}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* THE READ */}
      {routine?.summary && (
        <div className="mt-[clamp(16px,2.5vw,24px)] rounded-[20px] bg-[#161510] p-[clamp(22px,3vw,38px)]">
          <p className="mb-4 flex items-center gap-2.5 font-mono text-[12px] uppercase tracking-[0.16em] text-bronze">
            <span className="h-1.5 w-1.5 rounded-full bg-bronze" />
            the read
          </p>
          <p className="max-w-[70ch] text-[clamp(17px,1.9vw,21px)] leading-relaxed text-[#F4F2EC]">
            {routine.summary}
          </p>
        </div>
      )}

      {/* What we noticed */}
      <p className="eyebrow mb-2 mt-[clamp(28px,4vh,44px)]">{SKIN_COPY.concernsLabel}</p>
      {visibleConcerns.length ? (
        <ul className="divide-y divide-[var(--ink-08)]">
          {visibleConcerns.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-4 py-4">
              <p className="font-display text-[clamp(16px,1.8vw,20px)] tracking-[-0.01em] text-ink">
                {c.label}
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                {c.regions.length > 0 && (
                  <span className="hidden font-mono text-[12px] tracking-[0.04em] text-stone sm:inline">
                    {c.regions.map((r) => REGION_LABELS[r] ?? r).join(" · ")}
                  </span>
                )}
                <SeverityBar severity={c.severity} />
                <span className="w-[68px] text-right font-mono text-[12px] capitalize tracking-[0.04em] text-ink">
                  {c.severity}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[15px] leading-relaxed text-graphite">
          Nothing notable stood out — your skin&apos;s in good shape. Keep the routine consistent.
        </p>
      )}

      {/* Routine */}
      <div className="mb-5 mt-[clamp(28px,4vh,44px)] flex items-center justify-between gap-4">
        <p className="eyebrow">{SKIN_COPY.routineTitle}</p>
        <button
          type="button"
          onClick={() => setMode("questionnaire")}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--ink-12)] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-graphite transition-colors hover:border-bronze hover:text-ink"
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
          </svg>
          Edit answers
        </button>
      </div>
      <div className="grid items-start gap-[clamp(16px,2.5vw,24px)] lg:grid-cols-2">
        <RoutineCard title={SKIN_COPY.am} steps={routine?.am ?? []} icon={<SunIcon />} />
        <RoutineCard title={SKIN_COPY.pm} steps={routine?.pm ?? []} icon={<MoonIcon />} />
      </div>

      {routine?.habits && routine.habits.length > 0 && (
        <>
          <p className="eyebrow mb-4 mt-[clamp(20px,3vh,32px)]">{SKIN_COPY.habitsLabel}</p>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {routine.habits.map((h, i) => (
              <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed text-graphite">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-bronze" />
                {h}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Actions */}
      <div className="mt-[clamp(28px,4vh,44px)] flex flex-wrap items-center gap-4">
        {added ? (
          <div className="inline-flex items-center gap-4">
            <span className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-stone">
              <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-bronze text-bone">
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              added to routine
            </span>
            <Link
              href="/routine"
              className="group inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.14em] text-bronze transition-colors duration-300 ease-[var(--ease)] hover:text-ink"
            >
              view routine
              <span aria-hidden className="transition-transform duration-300 ease-[var(--ease)] group-hover:translate-x-1">→</span>
            </Link>
          </div>
        ) : (
          <Button onClick={addAllToRoutine} size="lg">
            Add to routine
          </Button>
        )}
        <button
          type="button"
          onClick={rescan}
          className="inline-flex items-center gap-2 rounded-[12px] border border-[var(--ink-12)] px-5 py-3.5 font-display text-[15px] font-medium text-ink transition-colors hover:border-bronze"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
          </svg>
          {SKIN_COPY.rescan}
        </button>
        <span className="ml-auto font-mono text-[12px] tracking-[0.04em] text-stone">
          product picks coming soon
        </span>
      </div>

      <p className="mt-6 font-mono text-[11px] tracking-[0.04em] text-stone">
        {SKIN_COPY.disclaimer}
      </p>
    </>
  );
}

/** Three-segment qualitative meter: mild=1, moderate=2, strong=3 (no numbers). */
function SeverityBar({ severity }: { severity: Severity }) {
  const level = severity === "strong" ? 3 : severity === "moderate" ? 2 : severity === "mild" ? 1 : 0;
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-2 w-5 rounded-full ${i < level ? "bg-ink" : "bg-[var(--ink-12)]"}`}
        />
      ))}
    </div>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.2M12 19.8V22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2 12h2.2M19.8 12H22M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z" />
    </svg>
  );
}

function RoutineCard({
  title,
  steps,
  icon,
}: {
  title: string;
  steps: { step: string; detail: string }[];
  icon: React.ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-[var(--ink-08)] bg-cloud p-[clamp(20px,2.6vw,30px)]">
      <div className="mb-4 flex items-center gap-3 border-b border-[var(--ink-08)] pb-4">
        <span className="shrink-0 text-bronze">{icon}</span>
        <h3 className="font-display text-[20px] font-bold tracking-[-0.02em] text-ink">{title}</h3>
      </div>
      <ul className="divide-y divide-[var(--ink-08)]">
        {steps.map((s, i) => (
          <li key={i} className="py-4 first:pt-0 last:pb-0">
            <p className="text-[16px] font-medium text-ink">{s.step}</p>
            <p className="mt-1 text-[14px] leading-relaxed text-graphite">{s.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
